/* global React, ReactDOM, LoginPage, OnboardingPage, HomePage, SearchPage, ProfilePage, SavedPage, Sidebar, JobDetail, Toast */
const { useState, useEffect, useMemo } = React;

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

  // Стейт для збережених вакансій (масив об'єктів з БД)
  const [savedVacancies, setSavedVacancies] = useState([]);

  // Допоміжний масив лише з ID робіт, щоб дочірні компоненти розуміли, що збережено
  const savedIds = useMemo(() => savedVacancies.map(sv => sv.job), [savedVacancies]);

  useEffect(() => {
    // Не робимо запит, якщо юзер ще не залогінився
    if (!user) return;

    setIsLoadingJobs(true);
    
    // 1. Завантажуємо загальний список вакансій
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
      
    // 2. Завантажуємо збережені вакансії поточного користувача
    const token = localStorage.getItem('access_token') || user.access_token || user.access;
    
    if (token) {
      fetch('http://localhost:8000/api/users/saved-vacancies/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch saved vacancies');
          return res.json();
        })
        .then(data => {
          setSavedVacancies(data);
        })
        .catch(err => console.error("Помилка завантаження збережених вакансій:", err));
    }

  }, [user]); // Запускається щоразу, коли змінюється стан `user`

  const handleLogin = (u) => {
    // u - це відповідь від CustomTokenObtainPairView { access, refresh, user: {...} }
    const userData = u.user ? { ...u.user, access: u.access } : u;
    
    setUser({ ...userData, title: 'Frontend Developer' });
    
    // Якщо бекенд при логіні повертає збережені вакансії, одразу їх записуємо
    if (userData.saved_vacancies) {
      setSavedVacancies(userData.saved_vacancies);
    }

    setNeedsOnboarding(!userData.onboarding_done);
  };

  const handleSaveOnboarding = (p) => {
    setProfile(prev => ({ ...prev, ...p }));
    setNeedsOnboarding(false);
    setPage('home');
    setToast('Profile saved. Feed updated.');
  };

  // ОНОВЛЕНА ЛОГІКА ЗБЕРЕЖЕННЯ / ВИДАЛЕННЯ З БД
  const toggleSave = (jobId) => {
    const existingSave = savedVacancies.find(sv => sv.job === jobId);

    if (existingSave) {
      // Видаляємо збережену вакансію (DELETE)
      const token = localStorage.getItem('access_token') || user.access_token || user.access;
      fetch(`http://localhost:8000/api/users/saved-vacancies/${existingSave.id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
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
      // Додаємо збережену вакансію (POST)
      const jobData = jobs.find(j => j.id === jobId);
      const token = localStorage.getItem('access_token') || user.access_token || user.access;
      fetch(`http://localhost:8000/api/users/saved-vacancies/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
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

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (needsOnboarding) {
    return (
      <div style={{minHeight: '100vh', background: 'var(--bg)'}}>
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
    content = <HomePage 
      user={user} 
      profile={profile}
      jobs={jobs} 
      onOpenJob={setOpenJob}
      savedIds={savedIds}
      onSave={toggleSave}
      onNav={setPage} 
    />;
  } else if (page === 'search') {
    content = <SearchPage user={user} profile={profile}
      jobs={jobs}
      onOpenJob={setOpenJob}
      savedIds={savedIds}
      onSave={toggleSave} />;
  } else if (page === 'profile') {
    content = <ProfilePage user={user} profile={profile}
      jobs={jobs}
      onSave={(p) => { setProfile(prev => ({...prev, ...p})); setToast('Profile updated.'); }}
      onNav={setPage} />;
  } else if (page === 'saved') {
    content = <SavedPage 
      user={user} 
      jobs={jobs} 
      savedIds={savedIds}
      onOpenJob={setOpenJob} 
      onSave={toggleSave} 
    />;
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
      
      <JobDetail 
        job={openJob}
        saved={openJob ? savedIds.includes(openJob.id) : false}
        onSave={() => openJob && toggleSave(openJob.id)}
        onClose={() => setOpenJob(null)} 
      />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);