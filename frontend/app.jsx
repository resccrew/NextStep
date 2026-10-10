/* global React, ReactDOM, LoginPage, OnboardingPage, HomePage, SearchPage, ProfilePage, SavedPage, SettingsPage, RecommendationsFeed, Sidebar, JobDetail, Toast, JOBS, STATUS, useJobStatuses */
const { useState, useEffect, useMemo, useCallback } = React;

function DevJump({ onLogin, onJump }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return <button className="dev-jump-trigger" title="Dev shortcuts" onClick={() => setOpen(true)}>⚡</button>;
  }
  return (
    <div className="dev-jump-panel">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow">Dev preview</span>
        <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', fontSize: 14 }}>×</button>
      </div>
      <button onClick={onLogin}>→ Onboarding</button>
      <div className="dev-jump-grid">
        <button onClick={() => onJump('home')}>Home</button>
        <button onClick={() => onJump('search')}>Oferty</button>
        <button onClick={() => onJump('saved')}>Aplikacje</button>
        <button onClick={() => onJump('profile')}>Profil</button>
        <button onClick={() => onJump('settings')}>Ustawienia</button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    role: '',
    skills: [],
    experience: 'middle',
    formats: ['remote'],
    salary: 200,
    onboardingDone: false
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('search');
  const [openJob, setOpenJob] = useState(null);
  const [feedOpen, setFeedOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', actionLabel: '', action: null });
  const [searchMeta, setSearchMeta] = useState({ count: 0, next: null, previous: null });
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const [savedVacancies, setSavedVacancies] = useState([]);
  const [statuses, setJobStatus] = useJobStatuses();

  const [theme, setTheme] = useState(() => {
    return user?.theme || localStorage.getItem('theme') || 'dark';
  });

  const showToast = useCallback((msg, actionLabel, action) => {
    setToast({ msg, actionLabel: actionLabel || '', action: action || null });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');

    if (!token && !refresh) {
      setAuthLoading(false);
      return;
    }

    fetch('http://127.0.0.1:8000/api/users/onboarding/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(async res => {
      if (res.ok) return res.json();

      // Токен протух — спробувати refresh
      if (res.status === 401 && refresh) {
        const refreshRes = await fetch('http://localhost:8000/api/users/token/refresh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh })
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem('access_token', refreshData.access);

          return fetch('http://127.0.0.1:8000/api/users/onboarding/', {
            headers: { 'Authorization': `Bearer ${refreshData.access}` }
          }).then(r => r.ok ? r.json() : Promise.reject('failed'));
        }
      }
      return Promise.reject('no valid token');
    })
    .then(profileData => {
      const savedUser = JSON.parse(localStorage.getItem('nextstep_user') || 'null');

      if (!savedUser) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return;
      }
      setUser(savedUser);
      setProfile(prev => ({ ...prev, ...profileData }));

      if (savedUser.theme) setTheme(savedUser.theme);

      if (savedUser.search_preference) {
        const pref = savedUser.search_preference;
        setSearchQuery(pref.query || '');
        setProfile(prev => ({ ...prev, searchPreference: pref }));
      }

      setNeedsOnboarding(!savedUser.onboarding_done);
    })
    .catch(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('nextstep_user');
    })
    .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    if (user && !user.isDevMock) {
      const token = localStorage.getItem('access_token') || user.access;
      fetch('http://127.0.0.1:8000/api/users/settings/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme: theme })
      }).catch(err => console.error("Failed to save theme to server:", err));
    }
  }, [theme, user]);

  const [searchStatus, setSearchStatus] = useState('idle'); // 'idle' | 'pending' | 'completed' | 'failed'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pollAttempts, setPollAttempts] = useState(0);

  const POLL_INTERVAL_MS = 4000;
  const MAX_POLLS = 30;

  const [lastSearchMode, setLastSearchMode] = useState('classic');

  const searchJobs = async ({ query, workMode = '', page = 1, mode = 'classic' } = {}) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return;

    setSearchQuery(q);
    setSearchStatus('pending');
    setLastSearchMode(mode);
    if (page === 1) setSearchResults([]);

    const params = new URLSearchParams({ q, page, mode });
    if (workMode) params.append('work_mode', workMode);

    try {
      const res = await fetchWithAuth(`http://localhost:8000/api/jobs/search/?${params}`);
      const data = await res.json();

      if (data.status === 'completed') {
        setSearchResults(data.results.map(formatJob));
        setSearchMeta({ count: data.count || 0, next: data.next, previous: data.previous });
        setSearchStatus('completed');
      } else if (data.status === 'pending') {
        pollSearchStatus(q, workMode, 0, mode);
      } else {
        setSearchStatus('failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchStatus('failed');
      showToast('Wyszukiwanie nie powiodło się. Spróbuj ponownie.');
    }
  };

  const pollSearchStatus = (query, workMode, attempts, mode = 'classic') => {
    if (attempts >= MAX_POLLS) {
      setSearchStatus('failed');
      showToast('Wyszukiwanie trwa zbyt długo. Spróbuj później.');
      return;
    }

    setTimeout(async () => {
      try {
        const res = await fetchWithAuth(
          `http://localhost:8000/api/jobs/search/status/?q=${encodeURIComponent(query)}&mode=${mode}`
        );
        const data = await res.json();

        if (data.status === 'completed') {
          const params = new URLSearchParams({ q: query, mode });
          if (workMode) params.append('work_mode', workMode);

          const jobsRes = await fetchWithAuth(`http://localhost:8000/api/jobs/search/?${params}`);
          const jobsData = await jobsRes.json();

          setSearchResults((jobsData.results || []).map(formatJob));
          setSearchMeta({
            count: jobsData.count || 0,
            next: jobsData.next || null,
            previous: jobsData.previous || null,
          });
          setSearchStatus('completed');
          setPollAttempts(0);
        } else if (data.status === 'failed') {
          setSearchStatus('failed');
          showToast('Pobieranie ofert nie powiodło się. Spróbuj ponownie.');
        } else {
          setPollAttempts(attempts + 1);
          pollSearchStatus(query, workMode, attempts + 1, mode);
        }
      } catch (err) {
        console.error('Poll error:', err);
        pollSearchStatus(query, workMode, attempts + 1, mode);
      }
    }, POLL_INTERVAL_MS);
  };

  const formatJob = (j) => {
    const tags = j.tags || [];
    const matchScore = j.match_percent || 0;
    const sourceName = j.source_name || 'praca.pl';

    const why = j.reasoning || (tags.length
      ? `Dopasowano z ofert ${sourceName}. Wspólne tagi z Twoim profilem: ${tags.slice(0, 3).join(', ')}.`
      : 'Silne dopasowanie na podstawie Twojego profilu i poziomu doświadczenia.');

    return {
      id: j.id,
      title: j.title,
      company: j.company?.name || j.company || 'Nieznana firma',
      logo: j.company?.logo_letter || j.logo || '?',
      location: j.location,
      salary: j.salary || 'do negocjacji',
      type: j.work_mode || j.employment_type || 'pełny etat',
      tags,
      description: j.description || '',
      url: j.original_url || j.url,
      sourceName: sourceName,
      posted: j.published_at || 'Niedawno',
      match: matchScore,
      why,
      featured: matchScore >= 85
    };
  };

  const handleLogout = () => {
    setUser(null);
    setPage('search');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('nextstep_user');

    setSearchQuery('');
    setSearchStatus('idle');
    setSearchResults([]);
    setSearchMeta({ count: 0, next: null, previous: null });
    setPollAttempts(0);

    setProfile({
      role: '',
      skills: [],
      experience: 'middle',
      formats: ['remote'],
      salary: 200,
      onboardingDone: false
    });

    showToast('Wylogowano.');
  };

  const fetchWithAuth = async (url, options = {}) => {
    let accessToken = localStorage.getItem('access_token') || (user && (user.access_token || user.access));
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch('http://localhost:8000/api/users/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('access_token', data.access);
            const savedUser = JSON.parse(localStorage.getItem('nextstep_user') || '{}');
            localStorage.setItem('nextstep_user', JSON.stringify({ ...savedUser, access: data.access }));

            headers['Authorization'] = `Bearer ${data.access}`;
            response = await fetch(url, { ...options, headers });
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
      else {
        handleLogout();
      }
    }
    return response;
  };

  const savedIds = useMemo(() => savedVacancies.map(sv => sv.job), [savedVacancies]);

  useEffect(() => {
    if (!user) return;

    if (user.isDevMock) return;

    setIsLoadingJobs(true);

    const fetchAllJobs = async () => {
      let url = 'http://localhost:8000/api/jobs/?page_size=100';
      let allJobs = [];
      while (url) {
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.results || []);
        allJobs = [...allJobs, ...items.map(formatJob)];
        url = Array.isArray(data) ? null : data.next;
      }
      return allJobs;
    };

    setIsLoadingJobs(true);
    fetchAllJobs()
      .then(allJobs => setJobs(allJobs))
      .catch(err => {
        console.error('Failed to fetch jobs:', err);
        showToast('Nie udało się wczytać ofert z bazy danych.');
      })
      .finally(() => setIsLoadingJobs(false));


    const token = localStorage.getItem('access_token') || user.access_token || user.access;

    if (user && !user.isDevMock) {
      fetchWithAuth('http://localhost:8000/api/users/saved-vacancies/?page_size=100')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch saved vacancies'))
        .then(data => {
          const items = Array.isArray(data) ? data : (data.results || []);
          setSavedVacancies(items);
        })
        .catch(err => console.error("Error loading saved vacancies:", err));
    }
  }, [user]);

  const handleLogin = (u) => {
    const userData = u.user ? { ...u.user, access: u.access } : u;

    if (u.access) localStorage.setItem('access_token', u.access);
    if (u.refresh) localStorage.setItem('refresh_token', u.refresh);

    localStorage.setItem('nextstep_user', JSON.stringify(userData));

    setUser({ ...userData, title: userData.role || userData.title || '' });

    if (userData.saved_vacancies) setSavedVacancies(userData.saved_vacancies);
    if (userData.theme) setTheme(userData.theme);

    if (userData.search_preference) {
      const pref = userData.search_preference;
      setSearchQuery(pref.query || '');
      setProfile(prev => ({ ...prev, searchPreference: pref }));
    }

    setNeedsOnboarding(!userData.onboarding_done && !userData.isDevMock);
  };

  const handleSaveOnboarding = (p) => {
    setProfile(prev => ({ ...prev, ...p }));
    setNeedsOnboarding(false);
    setPage('search');
    showToast('Profil zapisany. Lista ofert zaktualizowana.');
    if (p.role) {
      searchJobs({
        query: p.role,
        workMode: p.formats?.includes('remote') ? 'remote' : '',
        mode: 'ai',
      });
    }
  };

  const saveSearchPreference = useCallback((data) => {
    if (!user || user.isDevMock) return;

    clearTimeout(saveSearchPreference._timer);
    saveSearchPreference._timer = setTimeout(() => {
      fetchWithAuth('http://localhost:8000/api/users/search-preference/', {
        method: 'PATCH',
        body: JSON.stringify(data)
      }).catch(err => console.error('Failed to save search preference:', err));
    }, 1000);
  }, [user]);

  const toggleSave = (jobId) => {
    const existingSave = savedVacancies.find(sv => sv.job === jobId);
    const token = localStorage.getItem('access_token') || (user && (user.access_token || user.access));

    if (!token && user?.isDevMock) {
      if (existingSave) {
        setSavedVacancies(prev => prev.filter(sv => sv.job !== jobId));
      } else {
        setSavedVacancies(prev => [...prev, { id: Date.now(), job: jobId }]);
      }
      return;
    }

    if (existingSave) {
      fetchWithAuth(`http://localhost:8000/api/users/saved-vacancies/${existingSave.id}/`, {
        method: 'DELETE'
      })
      .then(res => {
        if (res.ok) {
          setSavedVacancies(prev => prev.filter(sv => sv.id !== existingSave.id));
          showToast('Usunięto z zapisanych.', 'Cofnij', () => toggleSave(jobId));
        } else {
          showToast('Nie udało się usunąć oferty.');
        }
      })
      .catch(err => console.error("Помилка видалення:", err));
    } else {
      const jobData = jobs.find(j => j.id === jobId);
      fetchWithAuth(`http://localhost:8000/api/users/saved-vacancies/`, {
        method: 'POST',
        body: JSON.stringify({
          job: jobId,
          title: jobData ? jobData.title : 'Zapisana oferta'
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save');
        return res.json();
      })
      .then(newSavedVacancy => {
        setSavedVacancies(prev => [...prev, newSavedVacancy]);
        showToast('Oferta zapisana!', 'Cofnij', () => toggleSave(jobId));
      })
      .catch(err => {
        console.error("Помилка збереження:", err);
        showToast('Nie udało się zapisać oferty.');
      });
    }
  };

  const devJump = (target) => {
    setUser({ name: 'Dev User', email: 'dev@nextstep.local', title: 'Frontend Developer', isDevMock: true });
    setNeedsOnboarding(false);
    setProfile(prev => ({ ...prev, role: 'Frontend Developer', skills: ['React', 'TypeScript', 'CSS'], onboardingDone: true }));
    if (typeof JOBS !== 'undefined' && jobs.length === 0) {
      setJobs(JOBS);
    }
    setPage(target);
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--muted)',
        fontSize: 14
      }}>
        Wczytywanie...
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <DevJump
          onLogin={() => handleLogin({ name: 'Dev User', email: 'dev@nextstep.local', isDevMock: true })}
          onJump={devJump}
        />
      </>
    );
  }

  if (needsOnboarding) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <OnboardingPage
          profile={profile}
          onSave={handleSaveOnboarding}
          onSkip={() => { setNeedsOnboarding(false); setPage('search'); }}
        />
      </div>
    );
  }

  const completeness = (() => {
    let pct = 20;
    if (profile.role) pct += 20;
    if (profile.skills?.length) pct += Math.min(30, profile.skills.length * 6);
    if (profile.experience) pct += 10;
    if (profile.formats?.length) pct += 10;
    if (profile.salary) pct += 10;
    return Math.min(100, pct);
  })();

  let content;
  if (page === 'home') {
    content = <HomePage user={user} profile={profile} jobs={jobs}
      onOpenJob={setOpenJob} savedIds={savedIds} onSave={toggleSave} onNav={setPage}
      onOpenRecs={() => setFeedOpen(true)} />;
  } else if (page === 'search') {
    content = <SearchPage
      user={user}
      userId={user?.id}
      profile={profile}
      jobs={jobs}
      onOpenJob={setOpenJob}
      savedIds={savedIds}
      onSave={toggleSave}
      onSearch={searchJobs}
      searchStatus={searchStatus}
      searchResults={searchResults}
      searchQuery={searchQuery}
      pollAttempts={pollAttempts}
      searchMeta={searchMeta}
      onSearchPage={(page) => searchJobs({ query: searchQuery, page, mode: lastSearchMode })}
      profileFilters={{ ...profile }}
      onSavePreference={saveSearchPreference}
      onToast={showToast}
      onOpenRecs={() => setFeedOpen(true)}
    />;
  } else if (page === 'profile') {
    content = <ProfilePage
      user={user}
      profile={profile}
      jobs={jobs}
      onSave={(p) => { setProfile(prev => ({ ...prev, ...p })); showToast('Profil zaktualizowany.'); }}
      onNav={setPage}
      fetchWithAuth={fetchWithAuth}
    />;
  } else if (page === 'saved') {
    content = <SavedPage
      user={user}
      jobs={jobs}
      savedIds={savedIds}
      onOpenJob={setOpenJob}
      onSave={toggleSave}
      fetchWithAuth={fetchWithAuth}
      onToast={showToast}
    />;
  } else if (page === 'settings') {
    content = <SettingsPage user={user} theme={theme} onThemeChange={setTheme}
      onLogout={handleLogout} onToast={showToast} />;
  }

  return (
    <div className="shell" data-screen-label={`NextStep — ${page}`}>
      <Sidebar page={page} onNav={setPage} user={user} completeness={completeness}
        theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onOpenRecs={() => setFeedOpen(true)} />
      <main className="main">
        <div className="main-inner">
          {isLoadingJobs && page !== 'profile' ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              Wczytywanie ofert z bazy danych...
            </div>
          ) : (
            content
          )}
        </div>
      </main>
      <JobDetail job={openJob}
        saved={openJob ? savedIds.includes(openJob.id) : false}
        status={openJob ? statuses[openJob.id] : null}
        onStatusChange={openJob ? (s) => setJobStatus(openJob.id, s) : null}
        onSave={() => openJob && toggleSave(openJob.id)}
        onClose={() => setOpenJob(null)} />
      {feedOpen && (
        <RecommendationsFeed
          jobs={jobs}
          savedIds={savedIds}
          onSave={toggleSave}
          onOpenJob={(j) => { setOpenJob(j); }}
          onClose={() => setFeedOpen(false)}
        />
      )}
      <Toast message={toast.msg} actionLabel={toast.actionLabel} onAction={toast.action}
        onDone={() => setToast({ msg: '', actionLabel: '', action: null })} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
