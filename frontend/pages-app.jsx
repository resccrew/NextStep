/* global React, Icon, Logo, MatchMeter, Avatar, Chip, JobRow, JobCard, STATUS, STATUS_ORDER, EXP_LEVELS */
const { useState: useStateH, useMemo: useMemoH, useEffect: useEffectH, useCallback: useCallbackH } = React;

// ============ local-only status store (backend only knows "saved") ============
// try/catch-guarded localStorage used for everything the API does not model:
// application status beyond "Zapisana", hidden jobs, viewed jobs, saved searches.
function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}

function useJobStatuses() {
  const [statuses, setStatuses] = useStateH(() => readLocal('ns_job_statuses', {}));
  const setStatus = useCallbackH((jobId, status) => {
    setStatuses(prev => {
      const next = { ...prev };
      if (status) next[jobId] = status; else delete next[jobId];
      writeLocal('ns_job_statuses', next);
      return next;
    });
  }, []);
  return [statuses, setStatus];
}

function useHiddenJobs() {
  const [hidden, setHidden] = useStateH(() => readLocal('ns_hidden_jobs', []));
  const hide = useCallbackH((jobId) => {
    setHidden(prev => { const next = [...new Set([...prev, jobId])]; writeLocal('ns_hidden_jobs', next); return next; });
  }, []);
  const unhide = useCallbackH((jobId) => {
    setHidden(prev => { const next = prev.filter(id => id !== jobId); writeLocal('ns_hidden_jobs', next); return next; });
  }, []);
  return [hidden, hide, unhide];
}

function useViewedJobs() {
  const [viewed, setViewed] = useStateH(() => readLocal('ns_viewed_jobs', []));
  const markViewed = useCallbackH((jobId) => {
    setViewed(prev => prev.includes(jobId) ? prev : (() => { const next = [...prev, jobId]; writeLocal('ns_viewed_jobs', next); return next; })());
  }, []);
  return [viewed, markViewed];
}

// ============ Home ============
function HomePage({ user, profile, jobs = [], onOpenJob, savedIds, onSave, onNav, onOpenRecs }) {
  const [statuses] = useJobStatuses();

  const recommended = useMemoH(() => [...jobs].sort((a, b) => b.match - a.match), [jobs]);
  const top3 = recommended.slice(0, 3);

  const firstName = (user.name || user.username || '').split(' ')[0] || 'Ty';

  const counts = useMemoH(() => {
    const values = Object.values(statuses);
    return {
      newMatches: recommended.filter(j => j.match >= 80).length,
      sent: values.filter(s => s === 'sent').length,
      interview: values.filter(s => s === 'interview').length,
      offer: values.filter(s => s === 'offer').length
    };
  }, [statuses, recommended]);

  const completeness = useMemoH(() => {
    let pct = 20;
    if (profile.role) pct += 20;
    if (profile.skills && profile.skills.length) pct += Math.min(30, profile.skills.length * 6);
    if (profile.experience) pct += 10;
    if (profile.formats && profile.formats.length) pct += 10;
    if (profile.salary) pct += 10;
    return Math.min(100, pct);
  }, [profile]);

  const todos = useMemoH(() => {
    const list = [];
    if (completeness < 100) list.push({ color: 'var(--green)', title: 'Uzupełnij profil', sub: `${completeness}% gotowe · lepsze dopasowania`, go: () => onNav('profile') });
    if (top3.length) list.push({ color: '#5B8DEF', title: `${top3.length} nowe oferty czekają`, sub: 'Sprawdź najlepsze dopasowania', go: () => onNav('search') });
    list.push({ color: '#E3A93B', title: 'Rzuć oko na Rekomendacje', sub: 'Pełnoekranowy przegląd ofert', go: onOpenRecs });
    return list;
  }, [completeness, top3, onNav, onOpenRecs]);

  const todayLabel = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="col gap-20">
      <div className="page-head">
        <div className="col gap-4">
          <span className="muted" style={{ fontSize: 13, textTransform: 'capitalize' }}>{todayLabel}</span>
          <h1 className="page-title">Cześć, {firstName}</h1>
          <span className="page-sub">
            {recommended.length ? `${counts.newMatches} ofert z dopasowaniem 80%+ czeka na Ciebie.` : 'Szukamy dla Ciebie najlepszych ofert...'}
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => onNav('search')}>Przeglądaj oferty →</button>
      </div>

      <div className="stats-strip">
        <button className="stats-cell" onClick={() => onNav('search')}>
          <span className="stats-label"><span className="dot-mint"></span>Nowe dopasowania</span>
          <span className="stats-value">{counts.newMatches}</span>
        </button>
        <button className="stats-cell" onClick={() => onNav('saved')}>
          <span className="stats-label"><span className="dot-mint" style={{ background: '#5B8DEF' }}></span>Wysłane</span>
          <span className="stats-value">{counts.sent}</span>
        </button>
        <button className="stats-cell" onClick={() => onNav('saved')}>
          <span className="stats-label"><span className="dot-mint" style={{ background: '#E3A93B' }}></span>Rozmowy</span>
          <span className="stats-value">{counts.interview}</span>
        </button>
        <button className="stats-cell" onClick={() => onNav('saved')}>
          <span className="stats-label"><span className="dot-mint" style={{ background: '#2DBE49' }}></span>Oferty</span>
          <span className="stats-value">{counts.offer}</span>
        </button>
      </div>

      <div className="row gap-20" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="col gap-20" style={{ flex: '999 1 440px', minWidth: 0 }}>
          <div className="panel">
            <div className="panel-head"><span>Do zrobienia</span></div>
            {todos.map((d, i) => (
              <button key={i} type="button" className="todo-row" onClick={d.go}>
                <span className="dot" style={{ background: d.color }}></span>
                <span className="body">
                  <span className="t">{d.title}</span>
                  <span className="s">{d.sub}</span>
                </span>
                <span className="muted">›</span>
              </button>
            ))}
          </div>

          <div className="panel">
            <div className="panel-head">
              <span>Najlepsze nowe oferty</span>
              <button onClick={() => onNav('search')}>Wszystkie →</button>
            </div>
            {top3.length > 0 ? top3.map(j => (
              <div key={j.id} className="job-row" onClick={() => onOpenJob(j)} style={{ padding: '12px 18px' }}>
                <span className={`match-pill ${j.match >= 80 ? 'is-high' : ''}`} style={{ width: 46 }}>{j.match}%</span>
                <div className="job-row-main">
                  <span className="job-row-title">{j.title}</span>
                  <span className="job-row-meta">{j.company} · {j.location} · {j.salary}</span>
                </div>
                <span className="job-row-posted">{j.posted}</span>
              </div>
            )) : (
              <div className="muted" style={{ padding: 20 }}>Oferty wciąż się wczytują...</div>
            )}
          </div>
        </div>

        <div className="col gap-20" style={{ flex: '1 1 280px' }}>
          <div className="panel" style={{ padding: 18, gap: 14, display: 'flex', flexDirection: 'column' }}>
            <div className="row gap-12">
              <Avatar name={user.name || user.email} size={44} />
              <div className="col" style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{user.name || user.username}</span>
                <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNav('profile')}>Edytuj</button>
            </div>
            <div className="col gap-6">
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 13 }}>
                <span className="muted">Profil uzupełniony</span><span style={{ fontWeight: 600 }}>{completeness}%</span>
              </div>
              <div className="completeness-track"><div className="completeness-fill" style={{ width: `${completeness}%` }}></div></div>
            </div>
            <div className="col" style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
              {[
                { k: 'Stanowisko', v: profile.role || '—' },
                { k: 'Poziom', v: EXP_LEVELS.find(e => e.id === profile.experience)?.label || '—' },
                { k: 'Format', v: (profile.formats || []).join(', ') || '—' },
                { k: 'Wynagrodzenie', v: profile.salary ? `od ${profile.salary * 10} zł` : '—' }
              ].map(f => (
                <div key={f.k} className="row" style={{ justifyContent: 'space-between', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                  <span className="muted">{f.k}</span><span style={{ fontWeight: 500, textAlign: 'right' }}>{f.v}</span>
                </div>
              ))}
            </div>
            <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
              {(profile.skills || []).slice(0, 6).map(k => <span key={k} className="chip is-on" style={{ cursor: 'default' }}>{k}</span>)}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span>Zapisane wyszukiwania</span>
              <button onClick={() => onNav('settings')}>Zarządzaj</button>
            </div>
            <div className="muted" style={{ padding: '16px 18px', fontSize: 13 }}>
              Brak zapisanych wyszukiwań. Użyj „Zapisz jako alert” na liście ofert.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Oferty (main offers screen) ============
const COLLECTIONS = [
  { id: 'all', label: 'Dla Ciebie' },
  { id: 'new', label: 'Nowe' },
  { id: 'remote', label: 'Remote' },
  { id: 'high', label: 'Wysokie zarobki' },
  { id: 'junior', label: 'Bez doświadczenia' }
];

function SearchPage({ user, userId, profile, jobs = [], onOpenJob, savedIds, onSave,
  onSearch, searchStatus, searchResults, searchQuery, pollAttempts, searchMeta,
  onSearchPage, profileFilters, onSavePreference, onToast, onOpenRecs }) {

  const [statuses] = useJobStatuses();
  const [hidden, hideJob, unhideJob] = useHiddenJobs();
  const [viewed, markViewed] = useViewedJobs();

  const [query, setQuery] = useStateH(profileFilters?.role || '');
  const [minMatch, setMinMatch] = useStateH(profileFilters?.searchPreference?.min_match || 0);
  const [activeTags, setActiveTags] = useStateH(
    profileFilters?.searchPreference?.active_tags || profileFilters?.skills || []);
  const [format, setFormat] = useStateH(
    profileFilters?.searchPreference?.format ||
    (profileFilters?.formats?.length ? profileFilters.formats[0] : 'all')
  );
  const [useAI, setUseAI] = useStateH(true);
  const [collection, setCollection] = useStateH('all');
  const [view, setView] = useStateH('detailed'); // detailed | compact
  const [sort, setSort] = useStateH('match'); // match | recent
  const [localPage, setLocalPage] = useStateH(1);
  const LOCAL_PAGE_SIZE = 10;

  useEffectH(() => {
    if (!userId) { setQuery(''); setMinMatch(0); setActiveTags([]); setFormat('all'); return; }
    const pref = profileFilters?.searchPreference;
    setQuery(pref?.query || profileFilters?.role || '');
    setMinMatch(pref?.min_match || 0);
    setActiveTags(pref?.active_tags || profileFilters?.skills || []);
    setFormat(pref?.format || (profileFilters?.formats?.[0]) || 'all');
  }, [userId]);

  useEffectH(() => {
    if (onSavePreference && userId) {
      onSavePreference({ query, active_tags: activeTags, format, min_match: minMatch });
    }
  }, [query, minMatch, activeTags, format]);

  const isLiveSearch = searchStatus !== 'idle' && searchQuery === query.trim().toLowerCase();
  const sourceJobs = isLiveSearch && searchStatus === 'completed' ? searchResults : jobs;
  useEffectH(() => { setLocalPage(1); }, [query, activeTags, minMatch, format, collection, sort]);

  useEffectH(() => {
    if (profileFilters?.role && searchStatus === 'idle') {
      setQuery(profileFilters.role);
      setActiveTags(profileFilters.skills || []);
      if (profileFilters.formats?.length) setFormat(profileFilters.formats[0]);
      if (onSearch) {
        onSearch({
          query: profileFilters.role,
          workMode: profileFilters.formats?.includes('remote') ? 'remote' : '',
          mode: useAI ? 'ai' : 'classic',
        });
      }
    }
  }, [profileFilters]);

  const allTags = useMemoH(() => {
    const t = new Set(activeTags);
    sourceJobs.forEach((j) => j.tags.forEach((x) => t.add(x)));
    return [...t];
  }, [sourceJobs, activeTags]);

  const toggleTag = (t) => setActiveTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const visibleJobs = useMemoH(() => sourceJobs.filter(j => !hidden.includes(j.id)), [sourceJobs, hidden]);

  const collectionCounts = useMemoH(() => ({
    all: visibleJobs.length,
    new: visibleJobs.filter(j => j.featured).length,
    remote: visibleJobs.filter(j => (j.location || '').toLowerCase().includes('remote') || (j.type || '').toLowerCase().includes('remote')).length,
    high: visibleJobs.filter(j => j.match >= 80).length,
    junior: visibleJobs.filter(j => (j.tags || []).length <= 2).length
  }), [visibleJobs]);

  const results = useMemoH(() => {
    if (isLiveSearch && searchStatus === 'pending') return [];
    let r = [...visibleJobs];
    if (query.trim() && !isLiveSearch) {
      const q = query.toLowerCase();
      r = r.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.tags.join(' ').toLowerCase().includes(q));
    }
    if (activeTags.length) r = r.filter((j) => activeTags.some((t) => j.tags.includes(t)));
    if (format !== 'all') r = r.filter((j) => j.location.toLowerCase().includes(format) || (j.type || '').toLowerCase().includes(format));
    r = r.filter((j) => j.match >= minMatch);
    if (collection === 'new') r = r.filter(j => j.featured);
    if (collection === 'remote') r = r.filter(j => (j.location || '').toLowerCase().includes('remote') || (j.type || '').toLowerCase().includes('remote'));
    if (collection === 'high') r = r.filter(j => j.match >= 80);
    if (collection === 'junior') r = r.filter(j => (j.tags || []).length <= 2);
    if (profileFilters?.salary) {
      r = r.filter(j => {
        if (!j.salary || j.salary === 'Negotiable') return true;
        const num = parseInt(j.salary.replace(/\D/g, ''));
        return isNaN(num) || num >= profileFilters.salary * 10;
      });
    }
    r.sort((a, b) => sort === 'match' ? b.match - a.match : (b.id - a.id));
    return r;
  }, [query, activeTags, minMatch, format, visibleJobs, isLiveSearch, searchStatus, collection, sort, profileFilters]);

  const pagedResults = useMemoH(() => {
    const start = (localPage - 1) * LOCAL_PAGE_SIZE;
    return results.slice(start, start + LOCAL_PAGE_SIZE);
  }, [results, localPage]);
  const totalLocalPages = Math.ceil(results.length / LOCAL_PAGE_SIZE);
  const hasActives = activeTags.length > 0 || format !== 'all' || minMatch > 0;

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      onSearch({ query: query.trim(), workMode: format !== 'all' ? format : '', mode: useAI ? 'ai' : 'classic' });
    }
  };

  const handleHide = (job) => {
    hideJob(job.id);
    onToast && onToast('Ukryto ofertę.', 'Cofnij', () => unhideJob(job.id));
  };

  const saveAsAlert = () => {
    const alerts = readLocal('ns_saved_searches', []);
    const entry = { id: Date.now(), q: query || '(wszystkie)', format, minMatch, tags: activeTags, notify: true };
    writeLocal('ns_saved_searches', [...alerts, entry]);
    onToast && onToast('Zapisano jako alert.');
  };

  const todayLabel = results.filter(j => j.featured).length;

  return (
    <div className="col gap-20">
      <div className="page-head">
        <div className="col gap-6">
          <span className="row gap-8" style={{ fontSize: 13 }}><span className="live-dot"></span><span className="muted">Na żywo z praca.pl · zaktualizowano niedawno</span></span>
          <h1 className="page-title">Oferty</h1>
          <span style={{ fontSize: 15 }}>
            <strong>Dziś {jobs.length} nowych ofert</strong>
            <span className="muted"> · {results.filter(j => j.match >= 80).length} z dopasowaniem 80%+</span>
          </span>
        </div>
        <button className="btn btn-mint" onClick={onOpenRecs}>▶ Rekomendacje</button>
      </div>

      <div className="search-box">
        <div className="search-box-row">
          <div className="search-field">
            <div className="search-field-inner">
              <Icon.Search style={{ color: 'var(--muted)' }} />
              <input
                placeholder="np. React, product designer, analityk..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {query && <button type="button" className="clear-btn" onClick={() => setQuery('')}>×</button>}
            </div>
          </div>
          <div className="segmented">
            <button className={useAI ? 'is-on' : ''} onClick={() => setUseAI(true)}>Dopasowanie AI</button>
            <button className={!useAI ? 'is-on' : ''} onClick={() => setUseAI(false)}>Słowa kluczowe</button>
          </div>
          <button className="btn btn-primary" onClick={handleSearch} disabled={searchStatus === 'pending' || !query.trim()}>
            {searchStatus === 'pending' ? 'Szukam...' : 'Szukaj'}
          </button>
        </div>
        <div className="mode-help">
          <span className="tag">{useAI ? 'AI' : 'SŁOWA KLUCZOWE'}</span>
          <span>{useAI ? 'AI rozumie podobne stanowiska i umiejętności, nawet jeśli nie są wpisane dosłownie.' : 'Szukamy dokładnych słów w tytule, firmie i tagach.'}</span>
        </div>
      </div>

      <div className="collections-tabs">
        {COLLECTIONS.map(c => (
          <button key={c.id} className={collection === c.id ? 'is-active' : ''} onClick={() => setCollection(c.id)}>
            {c.label}<span className="count">{collectionCounts[c.id] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          {['all', 'remote', 'hybrid', 'office'].map(f => (
            <button key={f} className={`filter-chip ${format === f ? 'is-on' : ''}`} onClick={() => setFormat(f)}>
              {f === 'all' ? 'Wszystkie' : f === 'remote' ? 'Zdalnie' : f === 'hybrid' ? 'Hybrydowo' : 'Biuro'}
            </button>
          ))}
          <span className="filter-sep"></span>
          {[0, 60, 80].map(m => (
            <button key={m} className={`filter-chip ${minMatch === m ? 'is-on' : ''}`} onClick={() => setMinMatch(m)}>
              {m === 0 ? 'Każde dopasowanie' : `${m}%+`}
            </button>
          ))}
        </div>
        <div className="row gap-8">
          <div className="view-toggle">
            <button className={view === 'detailed' ? 'is-on' : ''} onClick={() => setView('detailed')}>Szczegóły</button>
            <button className={view === 'compact' ? 'is-on' : ''} onClick={() => setView('compact')}>Kompakt</button>
          </div>
          <div className="sort-toggle">
            <button className={sort === 'match' ? 'is-on' : ''} onClick={() => setSort('match')}>Dopasowanie</button>
            <button className={sort === 'recent' ? 'is-on' : ''} onClick={() => setSort('recent')}>Najnowsze</button>
          </div>
        </div>
      </div>

      {hasActives && (
        <div className="actives-row">
          <span className="muted" style={{ fontSize: 13 }}>Aktywne:</span>
          {activeTags.map(t => (
            <button key={t} className="active-chip" onClick={() => toggleTag(t)}>{t}<span className="x">×</span></button>
          ))}
          {format !== 'all' && <button className="active-chip" onClick={() => setFormat('all')}>{format}<span className="x">×</span></button>}
          {minMatch > 0 && <button className="active-chip" onClick={() => setMinMatch(0)}>{minMatch}%+<span className="x">×</span></button>}
          <button className="reset-link" onClick={() => { setActiveTags([]); setMinMatch(0); setFormat('all'); }}>Wyczyść</button>
          <button className="save-search-btn" onClick={saveAsAlert}>🔔 Zapisz jako alert</button>
        </div>
      )}

      <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
        {(profile.skills?.length ? profile.skills : allTags).slice(0, 6).map((s) =>
          <Chip key={s} on={activeTags.includes(s)} onClick={() => toggleTag(s)}>{s}</Chip>
        )}
      </div>

      <div className="muted" style={{ fontSize: 13 }}><strong style={{ color: 'var(--ink)' }}>{results.length}</strong> {results.length === 1 ? 'oferta' : 'ofert'}</div>

      {isLiveSearch && searchStatus === 'pending' && (
        <div className="col gap-8">
          <div className="pending-banner"><span className="live-dot"></span>
            {useAI ? 'AI szuka najlepszych dopasowań' : 'Pobieramy świeże oferty'} dla „{searchQuery}”...
            {pollAttempts > 0 && <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>próba {pollAttempts}/30</span>}
          </div>
          <div className="pending-skel"></div>
          <div className="pending-skel"></div>
        </div>
      )}
      {isLiveSearch && searchStatus === 'failed' && (
        <div className="auth2-error">✕ Wyszukiwanie nie powiodło się. Spróbuj ponownie.</div>
      )}

      {!(isLiveSearch && searchStatus === 'pending') && (
        results.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-title">Brak ofert dla tych kryteriów</span>
            <span className="muted">Spróbuj usunąć część filtrów albo wyszukać w sieci.</span>
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => { setActiveTags([]); setMinMatch(0); setFormat('all'); setCollection('all'); }}>Pokaż wszystkie oferty</button>
          </div>
        ) : (
          <div className="col gap-20">
            <div className="panel">
              {pagedResults.map(j => (
                <JobRow key={j.id} job={j} saved={savedIds.includes(j.id)} status={statuses[j.id]}
                  detailed={view === 'detailed'} seen={viewed.includes(j.id)}
                  onSave={() => onSave(j.id)}
                  onHide={() => handleHide(j)}
                  onOpen={() => { markViewed(j.id); onOpenJob(j); }} />
              ))}
            </div>
            <PaginationBar page={localPage} totalPages={totalLocalPages} onPage={setLocalPage} />
            {localPage >= totalLocalPages && (
              <div className="end-of-list">
                <span style={{ fontWeight: 600 }}>To wszystkie oferty dla tych kryteriów</span>
                <span className="muted" style={{ fontSize: 13 }}>Nowe pojawiają się kilka razy dziennie. Włącz alert, aby nic nie przegapić.</span>
                <div className="row gap-8"><button className="btn btn-ghost" onClick={saveAsAlert}>🔔 Ustaw alert</button></div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

// ============ Profile ============
function ProfilePage({ user, profile, onSave, onNav, fetchWithAuth }) {
  const [editing, setEditing] = useStateH(false);
  const [serverProfile, setServerProfile] = useStateH(null);
  const [loading, setLoading] = useStateH(true);

  const EXP_LABEL = { junior: 'Junior', middle: 'Mid-level', senior: 'Senior', lead: 'Lead / Expert' };
  const FORMAT_LABEL = { remote: 'Zdalnie', hybrid: 'Hybrydowo', office: 'Biuro', relocation: 'Otwarty na relokację' };

  useEffectH(() => {
    if (user.isDevMock) { setServerProfile(profile); setLoading(false); return; }
    fetchWithAuth('http://127.0.0.1:8000/api/users/onboarding/')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => { setServerProfile(data); setLoading(false); })
      .catch(() => { setServerProfile(profile); setLoading(false); });
  }, []);

  const checklist = useMemoH(() => {
    const p = serverProfile || profile;
    return [
      { label: 'Stanowisko', done: !!p.role },
      { label: 'Umiejętności (min. 3)', done: (p.skills || []).length >= 3 },
      { label: 'Poziom', done: !!p.experience },
      { label: 'Format i wynagrodzenie', done: !!(p.formats || []).length && !!p.salary }
    ];
  }, [serverProfile, profile]);
  const checkDone = checklist.filter(c => c.done).length;
  const completeness = Math.round((checkDone / checklist.length) * 100);
  const isComplete = checkDone === checklist.length;

  const getProgress = () => {
    const p = serverProfile || profile;
    if (!p.role) return 1;
    if (!(p.skills || []).length || p.skills.length < 3) return 2;
    return 3;
  };

  if (loading) return <div className="col gap-20"><div className="muted" style={{ padding: 40, textAlign: 'center' }}>Wczytywanie profilu...</div></div>;

  const p = serverProfile || profile;

  return (
    <div className="col gap-20" style={{ maxWidth: 820 }}>
      <div className="col gap-4">
        <h1 className="page-title">Profil</h1>
        <span className="page-sub">Na tej podstawie liczymy dopasowanie. Zmiany zapisują się od razu.</span>
      </div>

      <div className="completeness-panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Profil uzupełniony w {completeness}%</span>
          <span className="muted" style={{ fontSize: 13 }}>{checkDone} z {checklist.length}</span>
        </div>
        <div className="completeness-track"><div className="completeness-fill" style={{ width: `${completeness}%` }}></div></div>
        <div className="checklist-grid">
          {checklist.map(c => (
            <div key={c.label} className="checklist-item">
              <span className={`checklist-mark ${c.done ? 'is-done' : 'is-todo'}`}>{c.done ? '✓' : ''}</span>
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {isComplete && !editing ? (
        <div className="profile-table">
          <div className="profile-field-row"><span>Stanowisko</span><span>{p.role}</span></div>
          <div className="profile-field-row"><span>Poziom</span><span>{EXP_LABEL[p.experience] || p.experience}</span></div>
          <div className="profile-field-row">
            <span>Umiejętności</span>
            <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
              {(p.skills || []).map(s => <span key={s} className="skill-pill-on" style={{ cursor: 'default' }}>{s}</span>)}
            </div>
          </div>
          <div className="profile-field-row">
            <span>Format pracy</span>
            <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
              {(p.formats || []).map(f => <span key={f} className="chip is-on" style={{ cursor: 'default' }}>{FORMAT_LABEL[f] || f}</span>)}
            </div>
          </div>
          <div className="profile-field-row"><span>Wynagrodzenie</span><span>od {p.salary * 10} zł brutto / mies.</span></div>
          <div style={{ padding: 20 }}>
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edytuj profil</button>
          </div>
        </div>
      ) : (
        <div className="ob-card">
          {editing && <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-end' }} onClick={() => setEditing(false)}>Anuluj</button>}
          <OnboardingPage
            profile={p}
            embedded
            initialStep={getProgress()}
            onSave={(data) => { setServerProfile(prev => ({ ...prev, ...data })); onSave(data); setEditing(false); }}
            onSkip={() => { if (editing) setEditing(false); else onNav('home'); }}
          />
        </div>
      )}
    </div>
  );
}

// ============ Aplikacje (pipeline across statuses) ============
const APP_TABS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'saved', label: 'Zapisane' },
  { id: 'sent', label: 'Wysłane' },
  { id: 'interview', label: 'Rozmowa' },
  { id: 'offer', label: 'Oferta' },
  { id: 'rejected', label: 'Odrzucone' }
];

function SavedPage({ user, jobs = [], savedIds, onOpenJob, onSave, fetchWithAuth, onToast }) {
  const [statuses, setStatus] = useJobStatuses();
  const [tab, setTab] = useStateH('all');
  const [menuFor, setMenuFor] = useStateH(null);
  const [loading, setLoading] = useStateH(true);
  const [savedJobs, setSavedJobs] = useStateH([]);

  useEffectH(() => {
    if (user.isDevMock) { setSavedJobs(jobs.filter(j => savedIds.includes(j.id))); setLoading(false); return; }
    setLoading(true);
    fetchWithAuth('http://localhost:8000/api/users/saved-vacancies/?page_size=200')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const items = Array.isArray(data) ? data : (data.results || []);
        const enriched = items.map(sv => {
          const fullJob = jobs.find(j => j.id === sv.job);
          return fullJob || { id: sv.job, title: sv.title || 'Zapisana oferta', company: '', match: 0, tags: [], salary: '', location: '', type: '', why: '', posted: '' };
        });
        setSavedJobs(enriched);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [savedIds.length]);

  const rows = useMemoH(() => savedJobs.map(j => ({ job: j, status: statuses[j.id] || 'saved' })), [savedJobs, statuses]);
  const counts = useMemoH(() => {
    const c = { all: rows.length, saved: 0, sent: 0, interview: 0, offer: 0, rejected: 0 };
    rows.forEach(r => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [rows]);
  const filtered = tab === 'all' ? rows : rows.filter(r => r.status === tab);

  const changeStatus = (jobId, status) => {
    setStatus(jobId, status);
    setMenuFor(null);
    onToast && onToast(`Status zmieniony na „${STATUS[status].label}”.`, 'Cofnij', () => setStatus(jobId, 'saved'));
  };

  return (
    <div className="col gap-20">
      <div className="col gap-4">
        <h1 className="page-title">Aplikacje</h1>
        <span className="page-sub">Wszystkie oferty, które zapisałaś lub na które aplikowałaś — w jednym miejscu.</span>
      </div>

      <div className="collections-tabs">
        {APP_TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'is-active' : ''} onClick={() => setTab(t.id)}>
            {t.label}<span className="count">{counts[t.id] || 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="muted" style={{ padding: 40, textAlign: 'center' }}>Wczytywanie zapisanych ofert...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-title">Nic tu jeszcze nie ma</span>
          <span className="muted">Zapisz ofertę lub oznacz aplikację na stronie oferty.</span>
        </div>
      ) : (
        <div className="apps-table">
          <div className="apps-table-head">
            <span>Oferta</span><span>Dopas.</span><span>Status</span><span>Zmiana</span>
          </div>
          {filtered.map(({ job: j, status }) => (
            <div key={j.id} className="apps-row">
              <button className="apps-row-title" onClick={() => onOpenJob(j)}>
                <span className="t">{j.title}</span>
                <span className="s">{j.company} · {j.location}</span>
              </button>
              <span className="apps-row-match">{j.match}%</span>
              <div style={{ position: 'relative' }}>
                <button className="status-select-btn" onClick={() => setMenuFor(menuFor === j.id ? null : j.id)}>
                  <span className="dot" style={{ background: STATUS[status].color }}></span>
                  <span style={{ flex: 1 }}>{STATUS[status].label}</span>
                  <span className="muted">▾</span>
                </button>
                {menuFor === j.id && (
                  <div className="status-menu">
                    {STATUS_ORDER.map(key => (
                      <button key={key} className="status-menu-item" onClick={() => changeStatus(j.id, key)}>
                        <span className="dot" style={{ background: STATUS[key].color }}></span>{STATUS[key].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span className="muted" style={{ fontSize: 13 }}>{j.posted || '—'}</span>
            </div>
          ))}
        </div>
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
    <div className="row gap-6" style={{ justifyContent: 'center', marginTop: 8, paddingBottom: 12 }}>
      <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => onPage(page - 1)} style={{ opacity: page === 1 ? 0.35 : 1 }}>← Wstecz</button>
      {pages.map((p, i) => p === '...' ? (
        <span key={`e-${i}`} className="muted" style={{ padding: '0 4px', fontSize: 13 }}>…</span>
      ) : (
        <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onPage(p)} style={{ minWidth: 36 }}>{p}</button>
      ))}
      <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => onPage(page + 1)} style={{ opacity: page === totalPages ? 0.35 : 1 }}>Dalej →</button>
    </div>
  );
}

// ============ Ustawienia ============
function SettingsPage({ user, theme, onThemeChange, onLogout, onToast }) {
  const [pwOpen, setPwOpen] = useStateH(false);
  const [pwCurrent, setPwCurrent] = useStateH('');
  const [pwNew, setPwNew] = useStateH('');
  const [pwConfirm, setPwConfirm] = useStateH('');
  const [pwError, setPwError] = useStateH('');
  const [pwSuccess, setPwSuccess] = useStateH(false);
  const [savedSearches, setSavedSearches] = useStateH(() => readLocal('ns_saved_searches', []));
  const [threshold, setThreshold] = useStateH(() => readLocal('ns_notif_threshold', 70));
  const [emailDigest, setEmailDigest] = useStateH(() => readLocal('ns_email_digest', true));

  useEffectH(() => writeLocal('ns_notif_threshold', threshold), [threshold]);
  useEffectH(() => writeLocal('ns_email_digest', emailDigest), [emailDigest]);

  const toggleSearchNotify = (id) => {
    setSavedSearches(prev => {
      const next = prev.map(s => s.id === id ? { ...s, notify: !s.notify } : s);
      writeLocal('ns_saved_searches', next);
      return next;
    });
  };
  const removeSearch = (id) => {
    setSavedSearches(prev => {
      const next = prev.filter(s => s.id !== id);
      writeLocal('ns_saved_searches', next);
      return next;
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess(false);

    if (!pwCurrent || !pwNew || !pwConfirm) { setPwError('Wypełnij wszystkie pola.'); return; }
    if (pwNew !== pwConfirm) { setPwError('Nowe hasła nie są identyczne.'); return; }
    if (pwNew.length < 8) { setPwError('Nowe hasło musi mieć min. 8 znaków.'); return; }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/api/users/change-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ old_password: pwCurrent, new_password: pwNew })
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.old_password?.[0] || data.new_password?.[0] || 'Nie udało się zmienić hasła.';
        throw new Error(errorMsg);
      }
      setPwSuccess(true);
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err) {
      setPwError(err.message);
    }
  };

  return (
    <div className="col gap-20" style={{ maxWidth: 820 }}>
      <h1 className="page-title">Ustawienia</h1>

      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Zapisane wyszukiwania</div>
            <div className="settings-row-sub">Powiadomimy Cię o nowych ofertach z dopasowaniem od {threshold}%.</div>
          </div>
        </div>
        {savedSearches.length === 0 ? (
          <div className="settings-row"><span className="muted" style={{ fontSize: 13 }}>Brak zapisanych wyszukiwań. Użyj „Zapisz jako alert” na liście ofert.</span></div>
        ) : savedSearches.map(s => (
          <div key={s.id} className="saved-search-row">
            <div className="saved-search-main">
              <span className="q">„{s.q}”</span>
              <span className="meta">{s.format !== 'all' ? s.format + ' · ' : ''}{s.minMatch}%+</span>
            </div>
            <span className="muted" style={{ fontSize: 12 }}>Powiadomienia</span>
            <button type="button" className={`toggle ${s.notify ? 'is-on' : ''}`} onClick={() => toggleSearchNotify(s.id)}><span className="knob"></span></button>
            <button type="button" onClick={() => removeSearch(s.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>×</button>
          </div>
        ))}
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 500 }}>Minimalne dopasowanie dla powiadomień</span>
            <span style={{ fontWeight: 600 }}>{threshold}%</span>
          </div>
          <input type="range" min={50} max={95} step={5} value={threshold} onChange={e => setThreshold(+e.target.value)} />
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-row">
          <span className="settings-row-label">Motyw</span>
          <div className="segmented">
            <button className={theme === 'light' ? 'is-on' : ''} onClick={() => onThemeChange('light')}><Icon.Sun /> Jasny</button>
            <button className={theme === 'dark' ? 'is-on' : ''} onClick={() => onThemeChange('dark')}><Icon.Moon /> Ciemny</button>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">E-mail z podsumowaniem</div>
            <div className="settings-row-sub">Codziennie rano, tylko gdy są nowe oferty</div>
          </div>
          <button type="button" className={`toggle ${emailDigest ? 'is-on' : ''}`} onClick={() => setEmailDigest(v => !v)}><span className="knob"></span></button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-row">
          <div>
            <div className="settings-row-label">{user.name || user.username}</div>
            <div className="settings-row-sub">{user.email}</div>
          </div>
        </div>
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="settings-row-label">Zmień hasło</div>
              <div className="settings-row-sub">Zaktualizuj hasło do konta</div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button"
              onClick={() => { setPwOpen(o => !o); setPwError(''); setPwSuccess(false); }}>
              {pwOpen ? 'Anuluj' : 'Zmień'}
            </button>
          </div>
          {pwOpen && (
            <form onSubmit={handlePasswordSubmit} className="col gap-10" style={{ paddingTop: 16 }}>
              <input className="auth2-input" type="password" placeholder="Aktualne hasło" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} autoComplete="current-password" />
              <input className="auth2-input" type="password" placeholder="Nowe hasło" value={pwNew} onChange={e => setPwNew(e.target.value)} autoComplete="new-password" />
              <input className="auth2-input" type="password" placeholder="Potwierdź nowe hasło" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} autoComplete="new-password" />
              {pwError && <div className="auth2-error">{pwError}</div>}
              {pwSuccess && <div style={{ fontSize: 13, color: 'var(--accentInk)', textAlign: 'center', padding: '6px 0' }}>Hasło zmienione.</div>}
              <button className="btn btn-primary" type="submit">Zapisz nowe hasło</button>
            </form>
          )}
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Wyloguj się</span>
          <button className="danger-btn" onClick={onLogout}>Wyloguj</button>
        </div>
      </div>
    </div>
  );
}

// ============ Rekomendacje — fullscreen vertical feed ============
function RecommendationsFeed({ jobs = [], savedIds, onSave, onClose, onOpenJob }) {
  const [hidden, hideJob] = useHiddenJobs();
  const [tab, setTab] = useStateH('all'); // all | new

  const cards = useMemoH(() => {
    let list = [...jobs].sort((a, b) => b.match - a.match);
    if (tab === 'new') list = list.filter(j => j.featured);
    return list.slice(0, 40);
  }, [jobs, tab]);

  useEffectH(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (cards.length === 0) {
    return (
      <div className="feed-overlay">
        <div className="feed-scroll" style={{ display: 'flex' }}>
          <div className="feed-slide">
            <div className="feed-empty">
              <h2>Brak ofert do pokazania</h2>
              <span className="muted" style={{ color: '#B7BFBA' }}>Wróć, gdy pojawią się nowe dopasowania.</span>
              <button className="btn btn-ghost" onClick={onClose} style={{ color: '#F3F5F4', borderColor: 'rgba(255,255,255,0.2)' }}>Zamknij</button>
            </div>
          </div>
        </div>
        <button className="feed-close" style={{ position: 'absolute', top: 16, right: 24 }} onClick={onClose}>×</button>
      </div>
    );
  }

  return (
    <div className="feed-overlay">
      <div className="feed-scroll">
        {cards.map((c, i) => {
          const have = (c.tags || []).slice(0, 3);
          const miss = [];
          const isHidden = hidden.includes(c.id);
          return (
            <section key={c.id} className="feed-slide">
              <div className="feed-slide-inner">
                <div className={`feed-card ${isHidden ? 'is-hidden-dim' : ''}`}>
                  <span className="feed-reason">✦ Dopasowano do Twojego profilu</span>
                  <div className="feed-match">
                    <span className="pct">{c.match}%</span>
                    <span className="lbl">dopasowania</span>
                  </div>
                  <h2 className="feed-title">{c.title}</h2>
                  <span className="feed-meta">{c.company} · {c.location} · {c.type} · {c.posted}</span>
                  <span className="feed-salary">{c.salary}</span>
                  <div className="feed-skills">
                    {have.map(k => <span key={k} className="feed-skill-have">✓ {k}</span>)}
                    {miss.map(k => <span key={k} className="feed-skill-miss">{k}</span>)}
                  </div>
                  <p className="feed-why">{c.why}</p>
                  {c.featured && <div className="feed-badges"><span>NOWA</span></div>}
                  {isHidden && <div className="feed-hidden-overlay">Ukryto — pokażemy mniej takich ofert</div>}
                </div>
                <div className="feed-actions">
                  <button className="feed-action-btn" onClick={() => onSave(c.id)}>
                    <span className={`circle ${savedIds.includes(c.id) ? 'is-mint' : ''}`}>{savedIds.includes(c.id) ? '✓' : '＋'}</span>
                    <span className="lbl">{savedIds.includes(c.id) ? 'Zapisano' : 'Zapisz'}</span>
                  </button>
                  <button className="feed-action-btn" onClick={() => hideJob(c.id)}>
                    <span className="circle">✕</span><span className="lbl">Nie dla mnie</span>
                  </button>
                  <button className="feed-action-btn" onClick={() => onOpenJob(c)}>
                    <span className="circle" style={{ fontWeight: 700 }}>i</span><span className="lbl">Szczegóły</span>
                  </button>
                  <button className="feed-action-btn" onClick={() => c.url && window.open(c.url, '_blank')}>
                    <span className="circle is-light">↗</span><span className="lbl">Aplikuj</span>
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="feed-topbar">
        <div className="logo-row"><Logo size={22} dark /></div>
        <div className="feed-tabs">
          <button className={tab === 'all' ? 'is-on' : ''} onClick={() => setTab('all')}>Wszystkie</button>
          <button className={tab === 'new' ? 'is-on' : ''} onClick={() => setTab('new')}>Nowe</button>
        </div>
        <div className="row gap-12">
          <span className="feed-counter">{cards.length} ofert</span>
          <button className="feed-close" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="feed-hints">↑ ↓ przewijaj · S zapisz · H nie dla mnie · ENTER szczegóły · ESC zamknij</div>
    </div>
  );
}

Object.assign(window, { HomePage, SearchPage, ProfilePage, SavedPage, SettingsPage, RecommendationsFeed, COLLECTIONS, APP_TABS, readLocal, writeLocal, useJobStatuses, useHiddenJobs, useViewedJobs });
