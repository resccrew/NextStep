/* global React, ReactDOM, LoginPage, OnboardingPage, HomePage, SearchPage, ProfilePage, SavedPage, Sidebar, JobDetail, Toast */
const { useState, useEffect } = React;

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
  const [savedIds, setSavedIds] = useState([2, 4]);
  const [toast, setToast] = useState('');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const handleLogin = (u) => {
    setUser({ ...u, title: 'Frontend Developer' });
    setNeedsOnboarding(true);
  };

  const handleSaveOnboarding = (p) => {
    setProfile(prev => ({ ...prev, ...p }));
    setNeedsOnboarding(false);
    setPage('home');
    setToast('Profile saved. Feed updated.');
  };

  const toggleSave = (id) => {
    setSavedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };

  const devJump = (target) => {
    setUser({ name: 'Dev User', email: 'dev@nextstep.local', title: 'Frontend Developer' });
    setNeedsOnboarding(false);
    setProfile(prev => ({ ...prev, role: 'Frontend Developer', skills: ['React', 'TypeScript', 'CSS'], onboardingDone: true }));
    setPage(target);
  };

  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <DevJump
          onLogin={() => handleLogin({ name: 'Dev User', email: 'dev@nextstep.local' })}
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
      onSave={(p) => { setProfile(prev => ({...prev, ...p})); setToast('Profile updated.'); }}
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
