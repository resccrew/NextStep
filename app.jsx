/* global React, ReactDOM, LoginPage, OnboardingPage, HomePage, SearchPage, ProfilePage, SavedPage, Sidebar, JobDetail, Toast */
const { useState, useEffect } = React;

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
  const [savedIds, setSavedIds] = useState([2, 4]);
  const [toast, setToast] = useState('');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const handleLogin = (u) => {
    setUser({ ...u, title: 'Frontend-разработчик' });
    setNeedsOnboarding(true);
  };

  const handleSaveOnboarding = (p) => {
    setProfile(prev => ({ ...prev, ...p }));
    setNeedsOnboarding(false);
    setPage('home');
    setToast('Профиль сохранён. Подборка обновлена.');
  };

  const toggleSave = (id) => {
    setSavedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
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
    content = <HomePage user={user} profile={profile}
      onOpenJob={setOpenJob}
      savedIds={savedIds}
      onSave={toggleSave}
      onNav={setPage} />;
  } else if (page === 'search') {
    content = <SearchPage user={user} profile={profile}
      onOpenJob={setOpenJob}
      savedIds={savedIds}
      onSave={toggleSave} />;
  } else if (page === 'profile') {
    content = <ProfilePage user={user} profile={profile}
      onSave={(p) => { setProfile(prev => ({...prev, ...p})); setToast('Профиль обновлён.'); }}
      onNav={setPage} />;
  } else if (page === 'saved') {
    content = <SavedPage user={user} savedIds={savedIds}
      onOpenJob={setOpenJob} onSave={toggleSave} />;
  }

  return (
    <div className="shell" data-screen-label={`NextStep — ${page}`}>
      <Sidebar page={page} onNav={setPage} user={user} />
      <main className="main">{content}</main>
      <JobDetail job={openJob}
        saved={openJob ? savedIds.includes(openJob.id) : false}
        onSave={() => openJob && toggleSave(openJob.id)}
        onClose={() => setOpenJob(null)} />
      <Toast message={toast} onDone={() => setToast('')} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
