/* global React, Icon, Logo, MatchMeter, Avatar, Chip, JobCard, EXP_LEVELS */
const { useState: useStateH, useMemo: useMemoH, useEffect: useEffectH } = React;

// ============ Home / Recommendations ============
function HomePage({ user, profile, jobs = [], onOpenJob, savedIds, onSave, onNav }) {
  const recommended = useMemoH(() => {
    return [...jobs].sort((a, b) => b.match - a.match).slice(0, 5);
  }, [jobs]);
  
  const topMatch = recommended[0];
  const rest = recommended.slice(1);

  const firstName = (user.name || '').split(' ')[0] || 'Anna';
  
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
function SearchPage({ user, profile, jobs = [], onOpenJob, savedIds, onSave }) {
  const [query, setQuery] = useStateH('');
  const [minMatch, setMinMatch] = useStateH(0);
  const [activeTags, setActiveTags] = useStateH([]);
  const [format, setFormat] = useStateH('all');
  const [useAI, setUseAI] = useStateH(true); // Відновлено з вашого старого коду

  const allTags = useMemoH(() => {
    const t = new Set();
    jobs.forEach((j) => j.tags.forEach((x) => t.add(x)));
    return [...t];
  }, [jobs]);

  const toggleTag = (t) => setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const results = useMemoH(() => {
    let r = [...jobs];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.join(' ').toLowerCase().includes(q)
      );
    }
    if (activeTags.length) {
      r = r.filter((j) => activeTags.some((t) => j.tags.includes(t)));
    }
    if (format !== 'all') {
      r = r.filter((j) => j.location.toLowerCase().includes(format));
    }
    r = r.filter((j) => j.match >= minMatch);
    r.sort((a, b) => b.match - a.match);
    return r;
  }, [query, activeTags, minMatch, format, jobs]);

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
          <input placeholder="e.g. React, product designer, analyst..."
            value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label="Clear"><Icon.X /></button>
          )}
        </div>
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'center', marginTop: 12, flexWrap: 'wrap', gap: 12}}>
          <div className="search-quickchips" style={{marginTop: 0}}>
            {profile.skills && profile.skills.slice(0, 5).map((s) =>
              <Chip key={s} on={activeTags.includes(s)} onClick={() => toggleTag(s)}>{s}</Chip>
            )}
            {(!profile.skills || profile.skills.length === 0) && allTags.slice(0, 5).map((s) =>
              <Chip key={s} on={activeTags.includes(s)} onClick={() => toggleTag(s)}>{s}</Chip>
            )}
          </div>
          
          <label className="row gap-8" style={{fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none'}}>
            <input type="checkbox" checked={useAI} onChange={e=>setUseAI(e.target.checked)}
              style={{accentColor: 'var(--accent-strong)'}} />
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-strong)'}}>
              <Icon.AI /> AI semantic search
            </span>
          </label>
        </div>
      </div>

      <div className="search-layout">
        <aside className="filters">
          <div className="filters-head">
            <span className="eyebrow">Filters</span>
            <button type="button" className="filters-reset"
              onClick={() => { setActiveTags([]); setMinMatch(0); setFormat('all'); }}>Reset</button>
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
                { id: 'all', label: 'All' },
                { id: 'remote', label: 'Remote' },
                { id: 'hybrid', label: 'Hybrid' },
                { id: 'office', label: 'Office' }
              ].map((f) =>
                <label key={f.id} className="filters-radio">
                  <input type="radio" name="fmt" checked={format === f.id} onChange={() => setFormat(f.id)} />
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
            </span>
            <div className="seg-mini">
              <button className="is-on">By match</button>
              <button>Recent</button>
            </div>
          </div>

          {results.length === 0 ?
            <div className="empty-state">
              <div className="empty-state-title">No matches</div>
              <div className="empty-state-text">Try removing some filters.</div>
            </div> :
            <ul className="job-list">
              {results.map((j) =>
                <li key={j.id}>
                  <JobCard job={j}
                    saved={savedIds.includes(j.id)}
                    onSave={() => onSave(j.id)}
                    onOpen={() => onOpenJob(j)} />
                </li>
              )}
            </ul>
          }
        </div>
      </div>
    </div>);
}

// ============ Profile Page ============
function ProfilePage({ user, profile, onSave, onNav }) {
  const firstName = (user.name || '').split(' ')[0] || 'You';
  return (
    <div className="profile-edit">
      <header className="page-head">
        <div className="col gap-4">
          <div className="eyebrow row gap-6"><span className="live-dot"></span> Profile</div>
          <h1 className="page-hello">About&nbsp;<em>{firstName}</em>.</h1>
        </div>
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
              <div className="profile-id-meter-fill" style={{ width: '78%' }}></div>
            </div>
            <span className="profile-id-meter-pct">78%</span>
          </div>
        </div>
      </section>

      <section className="profile-form">
        <OnboardingPage
          profile={profile}
          embedded
          onSave={(p) => { onSave(p); onNav('home'); }}
          onSkip={() => onNav('home')} />
      </section>
    </div>
  );
}

// ============ Saved Page ============
function SavedPage({ user, jobs = [], savedIds, onOpenJob, onSave }) {
  const saved = jobs.filter((j) => savedIds.includes(j.id));
  const avgMatch = saved.length ? Math.round(saved.reduce((s, j) => s + j.match, 0) / saved.length) : 0;
  
  return (
    <div className="page-edit">
      <header className="page-head">
        <div className="col gap-4">
          <div className="eyebrow">Saved</div>
          <h1 className="page-hello">Your bookmarks.</h1>
          {saved.length > 0 &&
            <div className="page-subhello">
              {saved.length} {saved.length === 1 ? 'role' : 'roles'} saved · avg. match&nbsp;
              <strong>{avgMatch}%</strong>. Open any to apply.
            </div>
          }
        </div>
      </header>

      {saved.length === 0 ?
        <div className="empty-state">
          <div className="empty-state-title">Nothing here yet</div>
          <div className="empty-state-text">Bookmark any role and it will appear here.</div>
        </div> :
        <ul className="job-list">
          {saved.map((j) =>
            <li key={j.id}>
              <JobCard job={j} saved
                onSave={() => onSave(j.id)}
                onOpen={() => onOpenJob(j)} />
            </li>
          )}
        </ul>
      }
    </div>
  );
}

Object.assign(window, { HomePage, SearchPage, ProfilePage, SavedPage });