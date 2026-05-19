/* global React, JOBS, Icon, Logo, MatchMeter, Avatar, Chip, JobCard, EXP_LEVELS */
const { useState: useStateH, useMemo: useMemoH, useEffect: useEffectH } = React;

// ============ Home / Recommendations ============
function HomePage({ user, profile, jobs = [], onOpenJob, savedIds, onSave, onNav }) {
  const recommended = useMemoH(() => {
    return [...jobs].sort((a,b)=>b.match-a.match).slice(0, 5);
  }, [jobs]);
  
  const topMatch = recommended[0];
  // БЕЗПЕЧНА ПЕРЕВІРКА: щоб не було ділення на 0 (NaN)
  const matchAvg = recommended.length > 0 
    ? Math.round(recommended.reduce((s,j)=>s+j.match,0) / recommended.length) 
    : 0;

  const firstName = (user.name || '').split(' ')[0] || 'Anna';

  return (
    <div className="col gap-32">
      <div className="topbar">
        <div className="col gap-4">
          <div className="eyebrow row gap-6"><span className="live-dot"></span> Today's picks</div>
          <div className="h1">Hi, {firstName}.</div>
        </div>
        <div className="row gap-12">
          <button className="btn btn-ghost btn-sm"><Icon.Bell /></button>
          <Avatar name={user.name} />
        </div>
      </div>

      <div className="greeting-card">
        <div className="blob"></div>
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, position: 'relative'}}>
          <div className="col gap-8" style={{maxWidth: 460}}>
            <div className="eyebrow">Top match</div>
            {/* БЕЗПЕЧНА ПЕРЕВІРКА: додано знаки питання (?.) */}
            <div className="h2">{topMatch?.title || 'Завантаження...'}</div>
            <div className="muted">{topMatch ? `${topMatch.company} · ${topMatch.location} · ${topMatch.salary}` : 'Шукаємо вакансії...'}</div>
            <div style={{fontSize: 14, lineHeight: 1.5, marginTop: 6}}>
              AI thinks this job matches your profile
              by <strong>{topMatch?.match || 0}%</strong>. Apply with a tailored resume in one click.
            </div>
            <div className="row gap-10" style={{marginTop: 14}}>
              <button className="btn btn-primary" onClick={() => topMatch && onOpenJob(topMatch)} disabled={!topMatch}>
                View <Icon.Arrow />
              </button>
              <button className="btn btn-ghost" onClick={()=>onNav('search')}>
                All jobs
              </button>
            </div>
          </div>
          <MatchMeter pct={topMatch?.match || 0} size={120} stroke={8} />
        </div>
      </div>

      <div className="row gap-16">
        <div className="stat" style={{flex: 1}}>
          <div className="l">New today</div>
          <div className="v">{recommended.length > 0 ? recommended.length + 3 : 0}</div>
        </div>
        <div className="stat" style={{flex: 1}}>
          <div className="l">Avg. match</div>
          <div className="v">{matchAvg}%</div>
        </div>
        <div className="stat" style={{flex: 1}}>
          <div className="l">Applications this month</div>
          <div className="v">4</div>
        </div>
        <div className="stat" style={{flex: 1}}>
          <div className="l">Saved</div>
          <div className="v">{savedIds.length}</div>
        </div>
      </div>

      <div className="col gap-16">
        <div className="row" style={{justifyContent: 'space-between'}}>
          <div className="col gap-4">
            <div className="h2" style={{fontSize: 22}}>Recommended jobs</div>
            <div className="muted" style={{fontSize: 13}}>Sorted by match with your profile</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>onNav('search')}>
            All jobs <Icon.Arrow />
          </button>
        </div>

        <div className="col gap-12">
          {/* БЕЗПЕЧНА ПЕРЕВІРКА: показуємо текст, якщо масив порожній */}
          {recommended.length > 0 ? (
            recommended.map(j => (
              <JobCard key={j.id} job={j}
                saved={savedIds.includes(j.id)}
                onSave={()=>onSave(j.id)}
                onOpen={()=>onOpenJob(j)} />
            ))
          ) : (
             <div className="muted" style={{padding: '20px 0'}}>Вакансії ще завантажуються або їх немає в базі...</div>
          )}
        </div>
      </div>

      <div style={{
        padding: 24, borderRadius: 18,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 24, flexWrap: 'wrap'
      }}>
        <div className="col gap-4">
          <div className="h4">Want more accurate matches?</div>
          <div className="muted" style={{fontSize: 13}}>Complete your profile — takes just a few minutes.</div>
        </div>
        <button className="btn btn-mint" onClick={()=>onNav('profile')}>Update profile</button>
      </div>
    </div>
  );
}

// ============ Search Page ============
function SearchPage({ user, profile, jobs = [], onOpenJob, savedIds, onSave }) {
  const [query, setQuery] = useStateH('');
  const [minMatch, setMinMatch] = useStateH(0);
  const [activeTags, setActiveTags] = useStateH([]);
  const [format, setFormat] = useStateH('all');
  const [useAI, setUseAI] = useStateH(true);

  const allTags = useMemoH(() => {
    const t = new Set();
    jobs.forEach(j => j.tags.forEach(x => t.add(x)));
    return [...t];
  }, [jobs]);

  const toggleTag = (t) => setActiveTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);

  const results = useMemoH(() => {
    let r = [...jobs];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.join(' ').toLowerCase().includes(q)
      );
    }
    if (activeTags.length) {
      r = r.filter(j => activeTags.some(t => j.tags.includes(t)));
    }
    if (format !== 'all') {
      r = r.filter(j => j.location.toLowerCase().includes(format));
    }
    r = r.filter(j => j.match >= minMatch);
    r.sort((a,b)=>b.match-a.match);
    return r;
  }, [query, activeTags, minMatch, format, jobs]);

  return (
    <div className="col gap-24">
      <div className="topbar">
        <div className="col gap-4">
          <div className="eyebrow">Search</div>
          <div className="h1" style={{fontSize: 32}}>Find the right job</div>
        </div>
        <Avatar name={user.name} />
      </div>

      <div className="search-hero">
        <div className="search-bar">
          <Icon.Search />
          <input placeholder="e.g. React, product designer, analyst..."
            value={query} onChange={e=>setQuery(e.target.value)} />
          <button className="btn btn-primary btn-sm">
            Search
          </button>
        </div>
        <div className="row" style={{justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 12}}>
          <div className="row gap-8" style={{flexWrap: 'wrap'}}>
            {profile.skills && profile.skills.slice(0, 5).map(s => (
              <Chip key={s} on={activeTags.includes(s)} onClick={()=>toggleTag(s)}>{s}</Chip>
            ))}
            {(!profile.skills || profile.skills.length === 0) && allTags.slice(0,5).map(s => (
              <Chip key={s} on={activeTags.includes(s)} onClick={()=>toggleTag(s)}>{s}</Chip>
            ))}
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

      <div style={{display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'flex-start'}}>
        <div className="filter-card">
          <div className="row" style={{justifyContent: 'space-between', marginBottom: 14}}>
            <div className="h4" style={{fontSize: 14}}>Filters</div>
            <button className="arrow-link" onClick={()=>{ setActiveTags([]); setMinMatch(0); setFormat('all'); }}>Reset</button>
          </div>

          <div className="col gap-8" style={{marginBottom: 18}}>
            <div className="eyebrow">Min. match</div>
            <div className="row" style={{justifyContent: 'space-between'}}>
              <div className="muted" style={{fontSize: 12}}>0%</div>
              <div style={{fontWeight: 700, fontSize: 14}}>{minMatch}%+</div>
              <div className="muted" style={{fontSize: 12}}>100%</div>
            </div>
            <input type="range" min={0} max={100} step={5} value={minMatch}
              onChange={e=>setMinMatch(+e.target.value)}
              style={{accentColor: 'var(--accent-strong)'}} />
          </div>

          <div className="col gap-8" style={{marginBottom: 18}}>
            <div className="eyebrow">Format</div>
            <div className="col gap-6">
              {[
                {id: 'all', label: 'All'},
                {id: 'remote', label: 'Remote'},
                {id: 'hybrid', label: 'Hybrid'},
                {id: 'office', label: 'Office'}
              ].map(f => (
                <label key={f.id} className="row gap-8" style={{fontSize: 13, cursor: 'pointer'}}>
                  <input type="radio" name="fmt" checked={format===f.id} onChange={()=>setFormat(f.id)}
                    style={{accentColor: 'var(--accent-strong)'}} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div className="col gap-8">
            <div className="eyebrow">Skills</div>
            <div className="row gap-6" style={{flexWrap: 'wrap'}}>
              {allTags.map(t => (
                <Chip key={t} on={activeTags.includes(t)} onClick={()=>toggleTag(t)}>{t}</Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="col gap-12">
          <div className="row" style={{justifyContent: 'space-between'}}>
            <div className="muted" style={{fontSize: 13}}>
              Found <strong style={{color: 'var(--text)'}}>{results.length}</strong> jobs
              {activeTags.length > 0 && ` · by skills: ${activeTags.join(', ')}`}
            </div>
            <div className="seg">
              <button className="is-on">By match</button>
              <button>Recent</button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="card" style={{padding: 40, textAlign: 'center'}}>
              <div className="h3" style={{marginBottom: 6}}>No results found</div>
              <div className="muted">Try removing some filters.</div>
            </div>
          ) : (
            <div className="col gap-12">
              {results.map(j => (
                <JobCard key={j.id} job={j}
                  saved={savedIds.includes(j.id)}
                  onSave={()=>onSave(j.id)}
                  onOpen={()=>onOpenJob(j)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Profile Page (Skills/Experience editor) ============
function ProfilePage({ user, profile, onSave, onNav }) {
  return (
    <div className="col gap-24">
      <div className="topbar">
        <div className="col gap-4">
          <div className="eyebrow">Profile</div>
          <div className="h1" style={{fontSize: 32}}>Your skills & experience</div>
        </div>
        <Avatar name={user.name} />
      </div>

      <div style={{
        padding: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        display: 'flex', gap: 16, alignItems: 'center'
      }}>
        <Avatar name={user.name} size={56} />
        <div className="col gap-4" style={{flex: 1}}>
          <div className="h3">{user.name}</div>
          <div className="muted" style={{fontSize: 13}}>{user.email}</div>
        </div>
        <div className="col gap-4" style={{alignItems: 'flex-end'}}>
          <div style={{fontSize: 12, color: 'var(--text-muted)', fontWeight: 600}}>Profile completeness</div>
          <div className="row gap-8">
            <div style={{width: 120, height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden'}}>
              <div style={{width: '78%', height: '100%', background: 'var(--accent-strong)'}}></div>
            </div>
            <span style={{fontWeight: 700, fontSize: 13}}>78%</span>
          </div>
        </div>
      </div>

      <OnboardingPage
        profile={profile}
        embedded
        onSave={(p)=>{ onSave(p); onNav('home'); }}
        onSkip={()=>onNav('home')}
      />
    </div>
  );
}

// ============ Saved Page ============
function SavedPage({ user, jobs = [], savedIds, onOpenJob, onSave }) {
  const saved = jobs.filter(j => savedIds.includes(j.id));
  return (
    <div className="col gap-24">
      <div className="topbar">
        <div className="col gap-4">
          <div className="eyebrow">Saved</div>
          <div className="h1" style={{fontSize: 32}}>Bookmarks</div>
        </div>
        <Avatar name={user.name} />
      </div>

      {saved.length === 0 ? (
        <div className="card" style={{padding: 48, textAlign: 'center'}}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px',
            borderRadius: 16, background: 'var(--accent-soft)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-strong)'
          }}>
            <Icon.Bookmark width={24} height={24} />
          </div>
          <div className="h3" style={{marginBottom: 6}}>Nothing here yet</div>
          <div className="muted">Click "Save" on any job and it will appear here.</div>
        </div>
      ) : (
        <div className="col gap-12">
          {saved.map(j => (
            <JobCard key={j.id} job={j} saved
              onSave={()=>onSave(j.id)}
              onOpen={()=>onOpenJob(j)} />
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { HomePage, SearchPage, ProfilePage, SavedPage });