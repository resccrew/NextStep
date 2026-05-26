/* global React, Icon, Logo, MatchMeter, Avatar, Chip, JobCard, EXP_LEVELS */
const { useState: useStateH, useMemo: useMemoH, useEffect: useEffectH } = React;

// ============ Home / Recommendations ============
function HomePage({ user, profile, jobs = [], onOpenJob, savedIds, onSave, onNav }) {
  const recommended = useMemoH(() => {
    return [...jobs].sort((a, b) => b.match - a.match).slice(0, 5);
  }, [jobs]);
  
  const topMatch = recommended[0];
  const rest = recommended.slice(1);

  const firstName = (user.name || user.username || '').split(' ')[0] || 'You';
  
  const matchAvg = recommended.length > 0 
    ? Math.round(recommended.reduce((s, j) => s + j.match, 0) / recommended.length) 
    : 0;
  const newToday = recommended.length > 0 ? recommended.length + 3 : 0;
  const applications = 4;

  const completeness = useMemoH(() => {
    let pct = 30;
    if (profile.role) pct += 15;
    if (profile.skills && profile.skills.length) pct += Math.min(25, profile.skills.length * 5);
    if (profile.experience) pct += 10;
    if (profile.formats && profile.formats.length) pct += 10;
    if (profile.salary) pct += 10;
    return Math.min(100, pct);
  }, [profile]);

  return (
    <div className="home-edit">
      <header className="home-greet">
        <div className="col gap-4">
          <div className="eyebrow row gap-6"><span className="live-dot"></span> Today · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <h1 className="home-hello">Hi&nbsp;<em>{firstName}</em>.</h1>
          <div className="home-subhello">
            {newToday} new roles since yesterday. {topMatch ? `Top match is ${topMatch.match}% — start there.` : 'Looking for the best matches...'}
          </div>
        </div>
      </header>

      <section className="stats-strip" aria-label="Today at a glance">
        <button className="stats-cell" onClick={() => onNav('search')}>
          <span className="stats-val">{newToday}</span>
          <span className="stats-lbl">New today</span>
        </button>
        <div className="stats-cell">
          <span className="stats-val">{matchAvg}<span className="stats-unit">%</span></span>
          <span className="stats-lbl">Avg. match</span>
        </div>
        <div className="stats-cell">
          <span className="stats-val">{applications}</span>
          <span className="stats-lbl">Applied this month</span>
        </div>
        <button className="stats-cell" onClick={() => onNav('saved')}>
          <span className="stats-val">{savedIds.length}</span>
          <span className="stats-lbl">Saved <Icon.Arrow /></span>
        </button>
      </section>

      {topMatch ? (
        <section className="home-feature" onClick={() => onOpenJob(topMatch)}>
          <div className="home-feature-meta">
            <div className="eyebrow row gap-8">
              <span className="dot-mint" aria-hidden="true"></span>
              Top match for you
            </div>
            <div className="home-feature-pct">
              <MatchMeter pct={topMatch.match} size={56} stroke={4} />
            </div>
          </div>
          <h2 className="home-feature-title">{topMatch.title}</h2>
          <div className="home-feature-sub muted">
            {topMatch.company} · {topMatch.location} · {topMatch.salary}
          </div>
          <p className="home-feature-why">
            <span className="eyebrow" style={{display:'inline', marginRight: 6}}>Why</span>
            {topMatch.why}. Tags overlap: {topMatch.tags.slice(0, 3).join(', ')}.
          </p>
          <div className="home-feature-row">
            <button className="btn btn-primary btn-lg" onClick={(e) => { e.stopPropagation(); onOpenJob(topMatch); }}>
              View role <Icon.Arrow />
            </button>
            <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); onSave(topMatch.id); }}>
              <Icon.Bookmark /> {savedIds.includes(topMatch.id) ? 'Saved' : 'Save for later'}
            </button>
          </div>
        </section>
      ) : (
        <section className="home-feature" style={{textAlign: 'center', padding: '40px 20px'}}>
          <div className="muted">Jobs are still loading or are not available in the database...</div>
        </section>
      )}

      <section className="home-list">
        <header className="home-list-head">
          <div className="col gap-4">
            <h3 className="home-list-title">More for you</h3>
            <div className="muted home-list-sub">{rest.length} more · sorted by match</div>
          </div>
          <button className="home-list-all" onClick={() => onNav('search')}>
            See all <Icon.Arrow />
          </button>
        </header>
        {rest.length > 0 ? (
          <ul className="home-list-rows">
            {rest.map((j) =>
              <li key={j.id}>
                <JobCard
                  job={j}
                  saved={savedIds.includes(j.id)}
                  onSave={() => onSave(j.id)}
                  onOpen={() => onOpenJob(j)} />
              </li>
            )}
          </ul>
        ) : (
          <div className="muted" style={{padding: '20px 0'}}>Loading more jobs...</div>
        )}
      </section>

      {completeness < 100 &&
        <section className="home-nudge" onClick={() => onNav('profile')}>
          <div className="home-nudge-main">
            <div className="eyebrow">Improve your matches</div>
            <div className="home-nudge-text">
              Your profile is <strong>{completeness}%</strong> complete. Add a few more skills to get
              sharper recommendations.
            </div>
          </div>
          <div className="home-nudge-side">
            <div className="home-nudge-track">
              <div className="home-nudge-fill" style={{ width: completeness + '%' }}></div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); onNav('profile'); }}>
              Continue <Icon.Arrow />
            </button>
          </div>
        </section>
      }
    </div>
  );
}

// ============ Search Page ============
function SearchPage({ user, profile, jobs = [], onOpenJob, savedIds, onSave,
  onSearch, searchStatus, searchResults, searchQuery, pollAttempts }) {

  const [query, setQuery] = useStateH('');
  const [minMatch, setMinMatch] = useStateH(0);
  const [activeTags, setActiveTags] = useStateH([]);
  const [format, setFormat] = useStateH('all');
  const [useAI, setUseAI] = useStateH(true);
  const [searchPage, setSearchPage] = useStateH(1);
  const [searchTotalCount, setSearchTotalCount] = useStateH(0);
  const PAGE_SIZE = 10;
  const [localPage, setLocalPage] = useStateH(1);
  const LOCAL_PAGE_SIZE = 10;
  const [searchMeta, setSearchMeta] = useState({ count: 0, page: 1 });
  const isLiveSearch = searchStatus !== 'idle' && searchQuery === query.trim().toLowerCase();
  const sourceJobs = isLiveSearch && searchStatus === 'completed' ? searchResults : jobs;
  useEffectH(() => { setLocalPage(1); }, [query, activeTags, minMatch, format]);

  const allTags = useMemoH(() => {
    const t = new Set();
    sourceJobs.forEach((j) => j.tags.forEach((x) => t.add(x)));
    return [...t];
  }, [sourceJobs]);

  const toggleTag = (t) => setActiveTags((prev) =>
    prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
  );

  const results = useMemoH(() => {
    if (isLiveSearch && searchStatus === 'pending') return [];

    let r = [...sourceJobs];
    if (query.trim() && !isLiveSearch) {
      const q = query.toLowerCase();
      r = r.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.join(' ').toLowerCase().includes(q)
      );
    }
    if (activeTags.length) r = r.filter((j) => activeTags.some((t) => j.tags.includes(t)));
    if (format !== 'all') r = r.filter((j) => j.location.toLowerCase().includes(format));
    r = r.filter((j) => j.match >= minMatch);
    r.sort((a, b) => b.match - a.match);
    return r;
  }, [query, activeTags, minMatch, format, sourceJobs, isLiveSearch, searchStatus]);

  const pagedResults = useMemoH(() => {
    const start = (localPage - 1) * LOCAL_PAGE_SIZE;
    return results.slice(start, start + LOCAL_PAGE_SIZE);
  }, [results, localPage]);

  const totalLocalPages = Math.ceil(results.length / LOCAL_PAGE_SIZE);

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      onSearch(query.trim(), format !== 'all' ? format : '');
    }
  };

  return (
    <div className="page-edit">
      <header className="page-head">
        <div className="col gap-4">
          <div className="eyebrow">Search</div>
          <h1 className="page-hello">Find a role.</h1>
          <div className="page-subhello">
            {jobs.length} roles indexed. Try a skill, company, or keyword — we'll surface the closest
            matches first.
          </div>
        </div>
      </header>

      <div className="search-wrap">
        <div className="search-input">
          <Icon.Search />
          <input
            placeholder="e.g. React, product designer, analyst..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {query && (
            <button type="button" className="search-clear"
              onClick={() => setQuery('')} aria-label="Clear">
              <Icon.X />
            </button>
          )}
        </div>

        <div className="row" style={{justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 12}}>
          <div className="search-quickchips" style={{marginTop: 0}}>
            {(profile.skills?.length ? profile.skills : allTags).slice(0, 5).map((s) =>
              <Chip key={s} on={activeTags.includes(s)} onClick={() => toggleTag(s)}>{s}</Chip>
            )}
          </div>
          <div className="row gap-8">
            <label className="row gap-8" style={{fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none'}}>
              <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)}
                style={{accentColor: 'var(--accent-strong)'}} />
              <span style={{display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-strong)'}}>
                <Icon.AI /> AI semantic search
              </span>
            </label>
            <button className="btn btn-primary btn-sm" onClick={handleSearch}
              disabled={searchStatus === 'pending' || !query.trim()}>
              {searchStatus === 'pending' ? 'Searching...' : 'Search web'}
            </button>
          </div>
        </div>
      </div>

      {/* Статус-банер */}
      {isLiveSearch && searchStatus === 'pending' && (
        <div style={{
          padding: '14px 20px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(15,67,23,0.06)', border: '1px solid rgba(15,67,23,0.12)',
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 14
        }}>
          <span className="live-dot"></span>
          Scraping fresh jobs for <strong>"{searchQuery}"</strong>...
          {pollAttempts > 0 && (
            <span className="muted" style={{marginLeft: 'auto', fontSize: 12}}>
              attempt {pollAttempts}/{30}
            </span>
          )}
        </div>
      )}
      {isLiveSearch && searchStatus === 'failed' && (
        <div style={{
          padding: '14px 20px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(200,50,50,0.06)', border: '1px solid rgba(200,50,50,0.15)',
          fontSize: 14, color: '#c83232'
        }}>
          ✕ Scraping failed. Try again or browse existing results below.
        </div>
      )}
      {isLiveSearch && searchStatus === 'completed' && (
        <div style={{
          padding: '14px 20px', borderRadius: 12, marginBottom: 16,
          background: 'rgba(15,67,23,0.06)', border: '1px solid rgba(15,67,23,0.12)',
          fontSize: 14
        }}>
          ✓ Found <strong>{searchResults.length}</strong> fresh results for "{searchQuery}"
        </div>
      )}

      <div className="search-layout">
        <aside className="filters">
          <div className="filters-head">
            <span className="eyebrow">Filters</span>
            <button type="button" className="filters-reset"
              onClick={() => { setActiveTags([]); setMinMatch(0); setFormat('all'); }}>
              Reset
            </button>
          </div>

          <div className="filters-block">
            <div className="filters-label">Min. match</div>
            <div className="filters-match-row">
              <span className="muted" style={{ fontSize: 12 }}>0%</span>
              <span className="filters-match-val">{minMatch}%+</span>
              <span className="muted" style={{ fontSize: 12 }}>100%</span>
            </div>
            <input type="range" min={0} max={100} step={5} value={minMatch}
              onChange={(e) => setMinMatch(+e.target.value)} className="filters-range" />
          </div>

          <div className="filters-block">
            <div className="filters-label">Format</div>
            <div className="filters-radios">
              {[
                { id: 'all',    label: 'All' },
                { id: 'remote', label: 'Remote' },
                { id: 'hybrid', label: 'Hybrid' },
                { id: 'office', label: 'Office' },
              ].map((f) =>
                <label key={f.id} className="filters-radio">
                  <input type="radio" name="fmt"
                    checked={format === f.id}
                    onChange={() => setFormat(f.id)} />
                  <span>{f.label}</span>
                </label>
              )}
            </div>
          </div>

          <div className="filters-block">
            <div className="filters-label">Skills</div>
            <div className="filters-skills">
              {allTags.map((t) =>
                <Chip key={t} on={activeTags.includes(t)} onClick={() => toggleTag(t)}>{t}</Chip>
              )}
            </div>
          </div>
        </aside>

        <div className="search-results">
          <div className="search-results-head">
            <span className="muted" style={{ fontSize: 13 }}>
              <strong style={{ color: 'var(--text)' }}>{results.length}</strong>
              {results.length === 1 ? ' role' : ' roles'}
              {activeTags.length > 0 && ` · ${activeTags.join(', ')}`}
              {isLiveSearch && searchStatus === 'completed' && ' · live results'}
            </span>
            <div className="seg-mini">
              <button className="is-on">By match</button>
              <button>Recent</button>
            </div>
          </div>

          {isLiveSearch && searchStatus === 'pending' ? (
            <div style={{padding: '40px 0', textAlign: 'center'}}>
              <div className="muted">Searching fresh jobs from praca.pl...</div>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No matches</div>
              <div className="empty-state-text">Try removing some filters or search the web.</div>
            </div>
          ) : (
            <><ul className="job-list">
                  {pagedResults.map((j) => <li key={j.id}>
                    <JobCard job={j} saved={savedIds.includes(j.id)} onSave={() => onSave(j.id)} onOpen={() => onOpenJob(j)} />
                  </li>
                  )}
                </ul><PaginationBar page={localPage} totalPages={totalLocalPages} onPage={setLocalPage} /></>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Profile Page ============
function ProfilePage({ user, profile, onSave, onNav, fetchWithAuth }) {
  const firstName = (user.name || '').split(' ')[0] || 'You';
  const [editing, setEditing] = useStateH(false);
  const [serverProfile, setServerProfile] = useStateH(null);
  const [loading, setLoading] = useStateH(true);

  const EXP_LABEL = { junior: 'Junior', middle: 'Mid-level', senior: 'Senior', lead: 'Lead / Expert' };
  const FORMAT_LABEL = { remote: 'Remote', hybrid: 'Hybrid', office: 'Office', relocation: 'Open to relocation' };

  // Завантажуємо актуальні дані профілю з сервера при монтуванні
  useEffectH(() => {
    if (user.isDevMock) {
      setServerProfile(profile);
      setLoading(false);
      return;
    }
    fetchWithAuth('http://127.0.0.1:8000/api/users/onboarding/')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setServerProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setServerProfile(profile);
        setLoading(false);
      });
  }, []);

  const isComplete = serverProfile && serverProfile.role && 
    serverProfile.skills?.length >= 3 && 
    serverProfile.experience && 
    serverProfile.formats?.length;

  // Визначаємо прогрес якщо не завершено
  const getProgress = () => {
  if (!serverProfile) return 1;
  if (!serverProfile.role) return 1;                          // крок 1: роль не заповнена
  if (!serverProfile.skills?.length || serverProfile.skills.length < 3) return 2;  // крок 2: скіли не заповнені
  return 3;                                                   // крок 3: преференції
};

  if (loading) {
    return (
      <div className="page-edit">
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading profile...
        </div>
      </div>
    );
  }

  // Режим перегляду завершеного профілю
  if (isComplete && !editing) {
    return (
      <div className="profile-edit">
        <header className="page-head">
          <div className="col gap-4">
            <div className="eyebrow row gap-6"><span className="live-dot"></span> Profile</div>
            <h1 className="page-hello">About&nbsp;<em>{firstName}</em>.</h1>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        </header>

        <section className="profile-id">
          <div className="profile-id-main">
            <div className="profile-id-name">{user.name}</div>
            <div className="profile-id-email">{user.email}</div>
          </div>
          <div className="profile-id-meter">
            <div className="profile-id-meter-label">Profile completeness</div>
            <div className="profile-id-meter-row">
              <div className="profile-id-meter-track">
                <div className="profile-id-meter-fill" style={{ width: '100%' }}></div>
              </div>
              <span className="profile-id-meter-pct">100%</span>
            </div>
          </div>
        </section>

        {/* Картки з даними */}
        <div className="col gap-16" style={{ marginTop: 24 }}>
          
          <div className="stat" style={{ padding: '20px 24px', borderRadius: 16 }}>
            <div className="l" style={{ marginBottom: 8 }}>Looking for</div>
            <div className="v" style={{ fontSize: 22 }}>{serverProfile.role}</div>
            <div className="muted" style={{ marginTop: 4 }}>
              {EXP_LABEL[serverProfile.experience] || serverProfile.experience}
            </div>
          </div>

          <div className="stat" style={{ padding: '20px 24px', borderRadius: 16 }}>
            <div className="l" style={{ marginBottom: 10 }}>Skills ({serverProfile.skills.length})</div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              {serverProfile.skills.map(s => (
                <span key={s} className="tag">{s}</span>
              ))}
            </div>
          </div>

          <div className="row gap-16" style={{ flexWrap: 'wrap' }}>
            <div className="stat" style={{ flex: 1, minWidth: 160, padding: '20px 24px', borderRadius: 16 }}>
              <div className="l" style={{ marginBottom: 8 }}>Work format</div>
              <div className="row gap-6" style={{ flexWrap: 'wrap', marginTop: 4 }}>
                {serverProfile.formats.map(f => (
                  <span key={f} className="tag">{FORMAT_LABEL[f] || f}</span>
                ))}
              </div>
            </div>
            <div className="stat" style={{ flex: 1, minWidth: 160, padding: '20px 24px', borderRadius: 16 }}>
              <div className="l" style={{ marginBottom: 8 }}>Expected salary</div>
              <div className="v" style={{ fontSize: 22 }}>${serverProfile.salary * 10}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>per month</div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Режим редагування / неповного профілю
  return (
    <div className="profile-edit">
      <header className="page-head">
        <div className="col gap-4">
          <div className="eyebrow row gap-6"><span className="live-dot"></span> Profile</div>
          <h1 className="page-hello">About&nbsp;<em>{firstName}</em>.</h1>
          {!isComplete && (
            <div className="page-subhello">
              {getProgress() === 0 && "Let's set up your profile to get better matches."}
              {getProgress() === 1 && "Almost there — pick your skills to continue."}
              {getProgress() === 2 && "One last step — set your preferences."}
            </div>
          )}
        </div>
        {editing && (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
            Cancel
          </button>
        )}
      </header>

      <section className="profile-id">
        <div className="profile-id-main">
          <div className="profile-id-name">{user.name}</div>
          <div className="profile-id-email">{user.email}</div>
        </div>
        {!isComplete && (
          <div className="profile-id-meter">
            <div className="profile-id-meter-label">Profile completeness</div>
            <div className="profile-id-meter-row">
              <div className="profile-id-meter-track">
                <div className="profile-id-meter-fill" 
                  style={{ width: `${[0, 33, 66, 100][getProgress()]}%` }}></div>
              </div>
              <span className="profile-id-meter-pct">{[0, 33, 66, 100][getProgress()]}%</span>
            </div>
          </div>
        )}
      </section>

      <section className="profile-form">
        {!loading && (  // ← додай цю перевірку
          <OnboardingPage
            profile={serverProfile || profile}
            embedded
            initialStep={getProgress()}   // ← без + 1, бо тепер повертає 1/2/3
            onSave={(p) => {
              setServerProfile(prev => ({ ...prev, ...p }));
              onSave(p);
              setEditing(false);
            }}
            onSkip={() => {
              if (editing) setEditing(false);
              else onNav('home');
            }}
          />
        )}
      </section>
    </div>
  );
}

// ============ Saved Page ============
function SavedPage({ user, jobs = [], savedIds, onOpenJob, onSave, fetchWithAuth }) {
  const [savedJobs, setSavedJobs] = useStateH([]);
  const [page, setPage] = useStateH(1);
  const [totalCount, setTotalCount] = useStateH(0);
  const [loading, setLoading] = useStateH(true);
  const PAGE_SIZE = 10;

  useEffectH(() => {
    if (user.isDevMock) {
      // dev mock: filter from jobs array
      setSavedJobs(jobs.filter(j => savedIds.includes(j.id)));
      setTotalCount(savedIds.length);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchWithAuth(`http://localhost:8000/api/users/saved-vacancies/?page=${page}&page_size=${PAGE_SIZE}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const items = Array.isArray(data) ? data : (data.results || []);
        // items have { id, job (job_id), title }
        // we need to enrich with full job data from the jobs array
        const enriched = items.map(sv => {
          const fullJob = jobs.find(j => j.id === sv.job);
          return fullJob || { id: sv.job, title: sv.title || 'Saved Job', company: '', match: 0, tags: [], salary: '', location: '', type: '', why: '' };
        });
        setSavedJobs(enriched);
        setTotalCount(Array.isArray(data) ? data.length : (data.count || 0));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, savedIds.length]); // re-fetch when page changes or saves change

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const avgMatch = savedJobs.length ? Math.round(savedJobs.reduce((s, j) => s + (j.match || 0), 0) / savedJobs.length) : 0;

  return (
    <div className="page-edit">
      <header className="page-head">
        <div className="col gap-4">
          <div className="eyebrow">Saved</div>
          <h1 className="page-hello">Your bookmarks.</h1>
          {totalCount > 0 &&
            <div className="page-subhello">
              {totalCount} {totalCount === 1 ? 'role' : 'roles'} saved
              {avgMatch > 0 && <> · avg. match <strong>{avgMatch}%</strong></>}. Open any to apply.
            </div>
          }
        </div>
      </header>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading saved jobs...</div>
      ) : savedJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">Nothing here yet</div>
          <div className="empty-state-text">Bookmark any role and it will appear here.</div>
        </div>
      ) : (
        <>
          <ul className="job-list">
            {savedJobs.map((j) =>
              <li key={j.id}>
                <JobCard job={j} saved
                  onSave={() => onSave(j.id)}
                  onOpen={() => onOpenJob(j)} />
              </li>
            )}
          </ul>
          {totalPages > 1 && (
            <PaginationBar page={page} totalPages={totalPages} onPage={setPage} />
          )}
        </>
      )}
    </div>
  );
}

function PaginationBar({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  
  const pages = [];
  const delta = 2;
  const left = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);
  
  if (left > 1) { pages.push(1); if (left > 2) pages.push('...'); }
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages) { if (right < totalPages - 1) pages.push('...'); pages.push(totalPages); }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, marginTop: 32, paddingBottom: 24
    }}>
      <button
        className="btn btn-ghost btn-sm"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        style={{ opacity: page === 1 ? 0.35 : 1 }}>
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: 13 }}>…</span>
        ) : (
          <button
            key={p}
            className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onPage(p)}
            style={{ minWidth: 36 }}>
            {p}
          </button>
        )
      )}
      <button
        className="btn btn-ghost btn-sm"
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        style={{ opacity: page === totalPages ? 0.35 : 1 }}>
        Next →
      </button>
    </div>
  );
}

// ============ Settings Page ============
function SettingsPage({ user, theme, onThemeChange, onLogout }) {
  const [pwOpen, setPwOpen] = useStateH(false);
  const [pwCurrent, setPwCurrent] = useStateH('');
  const [pwNew, setPwNew] = useStateH('');
  const [pwConfirm, setPwConfirm] = useStateH('');
  const [pwError, setPwError] = useStateH('');
  const [pwSuccess, setPwSuccess] = useStateH(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);
    
    if (!pwCurrent || !pwNew || !pwConfirm) {
      setPwError('Please fill in all fields.');
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwNew.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/users/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          old_password: pwCurrent, 
          new_password: pwNew 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // Витягуємо помилку з бекенду (наприклад, якщо старий пароль неправильний)
        const errorMsg = data.old_password?.[0] || data.new_password?.[0] || 'Failed to change password.';
        throw new Error(errorMsg);
      }

      setPwSuccess(true);
      setPwCurrent(''); 
      setPwNew(''); 
      setPwConfirm('');
    } catch (err) {
      setPwError(err.message);
    }
  };

  return (
    <div className="page-edit">
      <header className="page-head">
        <div className="col gap-4">
          <div className="eyebrow">Settings</div>
          <h1 className="page-hello">Preferences.</h1>
        </div>
      </header>

      <section className="settings-section">
        <div className="settings-group">
          <div className="settings-group-title">Appearance</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Theme</div>
              <div className="settings-row-sub">Choose how NextStep looks</div>
            </div>
            <div className="settings-theme-toggle">
              <button
                className={`settings-theme-btn ${theme === 'light' ? 'is-on' : ''}`}
                onClick={() => onThemeChange('light')}>
                <Icon.Sun /> Light
              </button>
              <button
                className={`settings-theme-btn ${theme === 'dark' ? 'is-on' : ''}`}
                onClick={() => onThemeChange('dark')}>
                <Icon.Moon /> Dark
              </button>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-group-title">Account</div>
          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">{user.name || user.username}</div>
              <div className="settings-row-sub">{user.email}</div>
            </div>
          </div>

          <div className="settings-row settings-row-expandable" style={{flexDirection: 'column', alignItems: 'stretch', gap: 0}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}
                 onClick={() => { setPwOpen(o => !o); setPwError(''); setPwSuccess(false); }}>
              <div className="settings-row-info">
                <div className="settings-row-label">Change password</div>
                <div className="settings-row-sub">Update your account password</div>
              </div>
              <button className="btn btn-ghost btn-sm" type="button"
                      onClick={e => { e.stopPropagation(); setPwOpen(o => !o); setPwError(''); setPwSuccess(false); }}>
                {pwOpen ? 'Cancel' : 'Change'}
              </button>
            </div>

            {pwOpen && (
              <form onSubmit={handlePasswordSubmit} style={{display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16}}>
                <input
                  className="auth2-input"
                  type="password"
                  placeholder="Current password"
                  value={pwCurrent}
                  onChange={e => setPwCurrent(e.target.value)}
                  autoComplete="current-password"
                />
                <input
                  className="auth2-input"
                  type="password"
                  placeholder="New password"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  autoComplete="new-password"
                />
                <input
                  className="auth2-input"
                  type="password"
                  placeholder="Confirm new password"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                {pwError && <div className="auth2-error">{pwError}</div>}
                {pwSuccess && <div style={{fontSize: 13, color: 'var(--accent-strong)', textAlign: 'center', padding: '6px 0'}}>Password updated successfully.</div>}
                <button className="auth2-cta" type="submit">Save new password</button>
              </form>
            )}
          </div>

          <div className="settings-row">
            <div className="settings-row-info">
              <div className="settings-row-label">Sign out</div>
              <div className="settings-row-sub">Log out of your account</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { HomePage, SearchPage, ProfilePage, SavedPage, SettingsPage });