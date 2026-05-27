/* global React, ReactDOM, LoginPage, OnboardingPage, HomePage, SearchPage, ProfilePage, SavedPage, Sidebar, JobDetail, Toast, JOBS */
const { useState, useEffect, useMemo, useCallback } = React;

function DevJump({ onLogin, onJump }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Dev shortcuts"
        style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 9999,
          width: 36, height: 36, borderRadius: 999,
          border: '1px solid rgba(15,67,23,0.18)', background: '#fff',
          fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
        }}>⚡</button>
    );
  }
  const btn = {
    padding: '6px 10px', borderRadius: 8,
    border: '1px solid rgba(15,67,23,0.18)', background: '#fff',
    fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
    color: 'var(--text)', cursor: 'pointer'
  };
  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: 12, borderRadius: 14,
      background: 'rgba(255,255,255,0.85)',
      border: '1px solid rgba(15,67,23,0.14)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
      maxWidth: 220
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span style={{fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)'}}>Dev preview</span>
        <button onClick={() => setOpen(false)} style={{border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14}}>×</button>
      </div>
      <button style={btn} onClick={onLogin}>→ Onboarding</button>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6}}>
        <button style={btn} onClick={() => onJump('home')}>Home</button>
        <button style={btn} onClick={() => onJump('search')}>Search</button>
        <button style={btn} onClick={() => onJump('saved')}>Saved</button>
        <button style={btn} onClick={() => onJump('profile')}>Profile</button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState({
    role: '',
    skills: [],
    experience: 'middle',
    formats: ['remote'],
    salary: 200,
    onboardingDone: false
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [openJob, setOpenJob] = useState(null);
  const [toast, setToast] = useState('');
  const [searchMeta, setSearchMeta] = useState({ count: 0, next: null, previous: null });
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const [savedVacancies, setSavedVacancies] = useState([]);

  const [theme, setTheme] = useState(() => {
  return user?.theme || localStorage.getItem('theme') || 'dark';
  });

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

const searchJobs = async (query, workMode = '', page = 1) => {
  const q = query.trim().toLowerCase();
  if (!q) return;

  setSearchQuery(q);
  setSearchStatus('pending');
  if (page === 1) setSearchResults([]);

  const params = new URLSearchParams({ q, page });
  if (workMode) params.append('work_mode', workMode);

  try {
    const res = await fetch(`http://localhost:8000/api/jobs/search/?${params}`);
    const data = await res.json();

    if (data.status === 'completed') {
      setSearchResults(data.results.map(formatJob));
      setSearchMeta({ count: data.count || 0, next: data.next, previous: data.previous });
      setSearchStatus('completed');
    } else if (data.status === 'pending') {
      pollSearchStatus(q, workMode, 0);
    } else {
      setSearchStatus('failed');
    }
  } catch (err) {
    console.error('Search error:', err);
    setSearchStatus('failed');
    setToast('Search failed. Please try again.');
  }
};

const pollSearchStatus = (query, workMode, attempts) => {
  if (attempts >= MAX_POLLS) {
    setSearchStatus('failed');
    setToast('Search is taking too long. Try again later.');
    return;
  }

  setTimeout(async () => {
    try {
      const res = await fetch(
        `http://localhost:8000/api/jobs/search/status/?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (data.status === 'completed') {
        const params = new URLSearchParams({ q: query });
        if (workMode) params.append('work_mode', workMode);

        const jobsRes = await fetch(`http://localhost:8000/api/jobs/search/?${params}`);
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
        setToast('Scraping failed. Please try again.');
      } else {
        setPollAttempts(attempts + 1);
        pollSearchStatus(query, workMode, attempts + 1);
      }
    } catch (err) {
      console.error('Poll error:', err);
      pollSearchStatus(query, workMode, attempts + 1);
    }
  }, POLL_INTERVAL_MS);
};

const formatJob = (j) => {
  const tags = j.tags || [];
  const matchScore = Math.floor(Math.random() * (98 - 65 + 1)) + 65;
  const why = tags.length
    ? `Matched from ${j.source_name || 'job board'} listings. Tags overlap with your profile: ${tags.slice(0, 3).join(', ')}.`
    : 'Strong match based on your profile and experience level.';
  return {
    id: j.id,
    title: j.title,
    company: j.company?.name || j.company || 'Unknown',
    logo: j.company?.logo_letter || j.logo || '?',
    location: j.location,
    salary: j.salary || 'Negotiable',
    type: j.work_mode || j.employment_type || 'Full-time',
    tags,
    description: j.description || '',
    url: j.original_url || j.url,
    posted: 'Recently',
    match: matchScore,
    why,
    featured: false
  };
};

  const handleLogout = () => {
    setUser(null);
    setPage('home');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
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

    setToast('Successfully signed out.');
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
          const refreshRes = await fetch('http://localhost:8000/api/token/refresh/', {
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
        const res = await fetch(url);
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
        setToast('Failed to load jobs from database.');
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

  const saveSearchPreference = useMemo(() => {
  let timer;
  return (data) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!user || user.isDevMock) return;
      fetchWithAuth('http://localhost:8000/api/users/search-preference/', {
        method: 'PATCH',
        body: JSON.stringify(data)
      }).catch(err => console.error('Failed to save search preference:', err));
    }, 1000);
  };
}, [user]);

  const handleSaveOnboarding = (p) => {
    setProfile(prev => ({ ...prev, ...p }));
    setNeedsOnboarding(false);
    setPage('search');
    setToast('Profile saved. Feed updated.');
    if (p.role) {
      searchJobs(p.role, p.formats?.includes('remote') ? 'remote' : '');
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
          setToast('Removed from saved.');
        } else {
          setToast('Failed to remove job.');
        }
      })
      .catch(err => console.error("Помилка видалення:", err));
    } else {
      const jobData = jobs.find(j => j.id === jobId);
      fetchWithAuth(`http://localhost:8000/api/users/saved-vacancies/`, {
        method: 'POST',
        body: JSON.stringify({ 
          job: jobId,
          title: jobData ? jobData.title : 'Saved Job' 
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to save');
        return res.json();
      })
      .then(newSavedVacancy => {
        setSavedVacancies(prev => [...prev, newSavedVacancy]);
        setToast('Job saved!');
      })
      .catch(err => {
        console.error("Помилка збереження:", err);
        setToast('Failed to save job.');
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
        background: 'var(--bg)', color: 'var(--text-muted)',
        fontSize: 14
      }}>
        Loading...
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
      <div className="on-green" style={{minHeight: '100vh', background: '#EDF8DF'}}>
        <OnboardingPage
          profile={profile}
          onSave={handleSaveOnboarding}
          onSkip={() => { setNeedsOnboarding(false); setPage('home'); }}
        />
      </div>
    );
  }

  let content;
  if (page === 'home') {
    content = <HomePage user={user} profile={profile} jobs={jobs}
      onOpenJob={setOpenJob} savedIds={savedIds} onSave={toggleSave} onNav={setPage} />;
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
    onSearchPage={(page) => searchJobs(searchQuery, '', page)}
    profileFilters={{ ...profile }}
    onSavePreference={saveSearchPreference}
  />;
  } else if (page === 'profile') {
  content = <ProfilePage 
    user={user} 
    profile={profile} 
    jobs={jobs}
    onSave={(p) => { setProfile(prev => ({...prev, ...p})); setToast('Profile updated.'); }}
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
    />;
  } else if (page === 'settings') {
    content = <SettingsPage user={user} theme={theme} onThemeChange={setTheme}  
      onLogout={handleLogout} />;
  }

  return (
    <div className="shell" data-screen-label={`NextStep — ${page}`}>
      <Sidebar page={page} onNav={setPage} user={user} />
      <main className="main">
        {isLoadingJobs && page !== 'profile' ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading jobs from database...
          </div>
        ) : (
          content
        )}
      </main>
      <JobDetail job={openJob}
        saved={openJob ? savedIds.includes(openJob.id) : false}
        onSave={() => openJob && toggleSave(openJob.id)}
        onClose={() => setOpenJob(null)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);