/* global React, ReactDOM, LoginPage, OnboardingPage, HomePage, SearchPage, ProfilePage, SavedPage, Sidebar, JobDetail, Toast, JOBS */
const { useState, useEffect, useMemo } = React;

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
  const [profile, setProfile] = useState({
    role: '',
    skills: [],
    experience: 'middle',
    formats: ['remote'],
    salary: 200,
    onboardingDone: false
  });
  const [page, setPage] = useState('home');
  const [openJob, setOpenJob] = useState(null);
  const [toast, setToast] = useState('');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  const [savedVacancies, setSavedVacancies] = useState([]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToast('Session expired. Please log in again.');
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
            headers['Authorization'] = `Bearer ${data.access}`;
            response = await fetch(url, { ...options, headers });
          } else {
            handleLogout();
          }
        } catch (error) {
          handleLogout();
        }
      } else {
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
    
    fetch('http://localhost:8000/api/jobs/')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const formattedJobs = data.map(j => ({
          id: j.id,
          title: j.title,
          company: j.company?.name || 'Unknown',
          logo: j.company?.logo_letter || '?',
          location: j.location,
          salary: j.salary || 'Negotiable',
          type: j.employment_type || 'Full-time',
          tags: j.tags || [],
          url: j.original_url,
          posted: 'Recently', 
          match: Math.floor(Math.random() * (98 - 65 + 1)) + 65,
          featured: false
        }));
        setJobs(formattedJobs);
      })
      .catch(err => {
        console.error('Failed to fetch jobs:', err);
        setToast('Failed to load jobs from database.');
      })
      .finally(() => {
        setIsLoadingJobs(false);
      });
      
    const token = localStorage.getItem('access_token') || user.access_token || user.access;
    
    if (user && !user.isDevMock) {
      fetchWithAuth('http://localhost:8000/api/users/saved-vacancies/')
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch saved vacancies'))
        .then(data => {
          setSavedVacancies(data);
        })
        .catch(err => console.error("Помилка завантаження збережених вакансій:", err));
    }
  }, [user]);

  const handleLogin = (u) => {
    const userData = u.user ? { ...u.user, access: u.access } : u;
    
    if (u.access) localStorage.setItem('access_token', u.access);
    if (u.refresh) localStorage.setItem('refresh_token', u.refresh);

    setUser({ ...userData, title: 'Frontend Developer' });
    
    if (userData.saved_vacancies) {
      setSavedVacancies(userData.saved_vacancies);
    }

    setNeedsOnboarding(!userData.onboarding_done && !userData.isDevMock);
  };

  const handleSaveOnboarding = (p) => {
    setProfile(prev => ({ ...prev, ...p }));
    setNeedsOnboarding(false);
    setPage('home');
    setToast('Profile saved. Feed updated.');
  };

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
    content = <SearchPage user={user} profile={profile} jobs={jobs}
      onOpenJob={setOpenJob} savedIds={savedIds} onSave={toggleSave} />;
  } else if (page === 'profile') {
    content = <ProfilePage user={user} profile={profile} jobs={jobs}
      onSave={(p) => { setProfile(prev => ({...prev, ...p})); setToast('Profile updated.'); }}
      onNav={setPage} />;
  } else if (page === 'saved') {
    content = <SavedPage user={user} jobs={jobs} savedIds={savedIds}
      onOpenJob={setOpenJob} onSave={toggleSave} />;
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