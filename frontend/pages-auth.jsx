/* global React, SKILL_GROUPS, JOBS, Icon, Logo, MatchMeter, Avatar, Chip, JobCard */
const { useState: useStateP, useMemo: useMemoP, useEffect: useEffectP } = React;

// ============ Login Page ============
function LoginPage({ onLogin }) {
  const [mode, setMode] = useStateP('signin');
  const [email, setEmail] = useStateP('');
  const [name, setName] = useStateP('');
  const [password, setPassword] = useStateP('');
  const [error, setError] = useStateP('');
  const [flying, setFlying] = useStateP(false);

  const API_BASE_URL = 'http://127.0.0.1:8000/api/users';
  const GOOGLE_CLIENT_ID = "80208761057-im8lepibi8b7doe94q4t02hat5kbkr0p.apps.googleusercontent.com";

  useEffectP(() => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse
    });
    
    window.google.accounts.id.renderButton(
      document.getElementById("google-btn-div"),
      { theme: "outline", size: "large", width: 400, shape: "rectangular" }
    );
  }, []);

  const handleGoogleResponse = async (response) => {
    if (flying) return;
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google authorization error');
      }

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      setFlying(true);
      setTimeout(() => {
        onLogin(data.user);
      }, 700);

    } catch (err) {
      setError(err.message);
    }
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (flying) return;
    setError('');

    const endpoint = mode === 'signin' ? '/login/' : '/register/';

    const payload = mode === 'signin'
    ? { email: email, password: password } // <-- Changed 'username' to 'email'
    : {
        username: name || email.split('@')[0],
        email: email,
        password: password
      };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.detail || (data.email && data.email[0]) || 'Authorization error';
        throw new Error(errorMsg);
      }

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      setFlying(true);
      setTimeout(() => { onLogin(data.user); }, 700);

    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setFlying(true);
        setTimeout(() => {
          onLogin({ name: name || (email.split('@')[0] || 'User'), email: email || 'user@example.com' });
        }, 700);
        return;
      }
      setError(err.message);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
  };

  return (
    <div className={`auth2 ${flying ? 'is-flying' : ''}`}>
      <header className="auth2-top">
        <div className="auth2-brand">
          <img src="assets/logo.svg" alt="" height={26} style={{ height: 26, width: 'auto', display: 'block' }} />
          <span>NextStep</span>
        </div>
        <a href="#" className="auth2-help">Need help?</a>
      </header>

      <main className="auth2-main">
        <h1 className="auth2-headline">
          Find your<br/>next move.
        </h1>
        <p className="auth2-sub">AI-matched jobs, sorted by what fits you.</p>

        <div className="auth2-card">
          <div 
            id="google-btn-div" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: '40px' }}
          ></div>

          <div className="auth2-or" style={{ marginTop: 12 }}><span>OR</span></div>

          <form className="auth2-form" onSubmit={submit}>
            {mode === 'signup' && (
              <input
                className="auth2-input"
                placeholder="Your name"
                value={name}
                onChange={e=>setName(e.target.value)}
                required
              />
            )}
            <input
              className="auth2-input"
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              required
            />
            <input
              className="auth2-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
            />

            {error && <div className="auth2-error" style={{ color: '#EA4335', fontSize: '14px', textAlign: 'center', backgroundColor: '#FCE8E6', padding: '8px', borderRadius: '8px', marginBottom: '12px' }}>{error}</div>}

            <button type="submit" className="auth2-cta">
              {mode === 'signin' ? 'Continue with email' : 'Create account'}
            </button>
          </form>

          <p className="auth2-fineprint">
            By continuing, you acknowledge NextStep's <a href="#">Privacy Policy</a>.
          </p>
        </div>

        <button type="button" className="auth2-switch" onClick={switchMode}>
          {mode === 'signin' ? (
            <>New to NextStep? <strong>Create an account</strong></>
          ) : (
            <>Already have an account? <strong>Sign in</strong></>
          )}
        </button>
      </main>

      <footer className="auth2-foot">© 2026 NextStep</footer>
    </div>
  );
}

// ============ Onboarding Page (Skills + Experience) ============
const EXP_LEVELS = [
  { id: 'junior',   label: 'Junior',        years: '0 – 1 year',   pct: 15 },
  { id: 'middle',   label: 'Mid-level',     years: '1 – 3 years',  pct: 40 },
  { id: 'senior',   label: 'Senior',        years: '3 – 6 years',  pct: 70 },
  { id: 'lead',     label: 'Lead / Expert', years: '6+ years',     pct: 95 }
];

function OnboardingPage({ profile, onSave, onSkip, embedded = false }) {
  const [step, setStep] = useStateP(profile.onboardingStep || 1);
  const [activeGroup, setActiveGroup] = useStateP(SKILL_GROUPS[0].name);
  const [skills, setSkills] = useStateP(profile.skills || []);
  const [exp, setExp] = useStateP(profile.experience || 'middle');
  const [formats, setFormats] = useStateP(profile.formats || ['remote']);
  const [salary, setSalary] = useStateP(profile.salary || 200);
  const [role, setRole] = useStateP(profile.role || '');

  const [isSaving, setIsSaving] = useStateP(false);

  const toggleSkill = (s) => setSkills(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s]);
  const toggleFormat = (f) => setFormats(prev => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev, f]);

  const expIndex = EXP_LEVELS.findIndex(e=>e.id===exp);
  const expPct = EXP_LEVELS[expIndex]?.pct || 50;

  const canNext1 = !!role.trim();
  const canNext2 = skills.length >= 3;

  const handleSaveData = async () => {
    setIsSaving(true);

    const dataToSave = {
      role: role,
      experience: exp,
      skills: skills,
      formats: formats,
      salary: salary,
      onboarding_done: true
    };

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/users/onboarding/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSave)
      });

      if (!response.ok) {
        throw new Error('Failed to save data on the server');
      }

      onSave(dataToSave);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save data. Please check your server connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{maxWidth: 760, margin: '0 auto', padding: embedded ? '0' : '48px 24px'}}>
      {!embedded && (
        <div className="row" style={{justifyContent: 'space-between', marginBottom: 24}}>
          <Logo size={28} />
          <button className="btn btn-ghost btn-sm" onClick={onSkip}>Skip for now</button>
        </div>
      )}

      <div className="steps" style={{marginBottom: 20}}>
        <span className={`pill ${step>=1 ? 'is-on' : ''}`}>1 · About you</span>
        <span style={{width: 16, height: 1, background: 'rgba(15,67,23,0.18)'}}></span>
        <span className={`pill ${step>=2 ? 'is-on' : ''}`}>2 · Skills</span>
        <span style={{width: 16, height: 1, background: 'rgba(15,67,23,0.18)'}}></span>
        <span className={`pill ${step>=3 ? 'is-on' : ''}`}>3 · Preferences</span>
      </div>

      {step === 1 && (
        <div className="col gap-20">
          <div className="col gap-6">
            <div className="h1" style={{fontSize: 34}}>Let's start simple.</div>
            <div className="muted" style={{fontSize: 15}}>
              Tell us what you're looking for. The more specific, the smarter the matches.
            </div>
          </div>

          <div className="field">
            <label className="field-label">What kind of job are you looking for?</label>
            <input className="input" placeholder="e.g. Frontend Developer"
              value={role} onChange={e=>setRole(e.target.value)} />
            <div className="field-hint">AI understands similar titles: Front-end Engineer, JS Developer, UI Engineer.</div>
          </div>

          <div className="field">
            <label className="field-label">Your level</label>
            <div className="row gap-8" style={{flexWrap: 'wrap', marginTop: 4}}>
              {EXP_LEVELS.map(l => (
                <button key={l.id} className={`chip ${exp===l.id ? 'is-on' : ''}`} onClick={()=>setExp(l.id)}>
                  <span style={{fontWeight: 600}}>{l.label}</span>
                  <span style={{opacity: 0.7, fontWeight: 500}}>· {l.years}</span>
                </button>
              ))}
            </div>
            <div className="track" style={{marginTop: 16}}>
              <div className="fill" style={{width: `${expPct}%`}}></div>
            </div>
          </div>

          <div className="row" style={{justifyContent: 'flex-end', marginTop: 12}}>
            <button className="btn btn-primary" disabled={!canNext1} onClick={()=>setStep(2)} style={{opacity: canNext1?1:0.5}}>
              Next <Icon.Arrow />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="col gap-20">
          <div className="col gap-6">
            <div className="h1" style={{fontSize: 34}}>Your skills</div>
            <div className="muted" style={{fontSize: 15}}>
              Select at least three. AI will account for related technologies automatically.
            </div>
          </div>

          <div className="row gap-8" style={{flexWrap: 'wrap'}}>
            {SKILL_GROUPS.map(g => (
              <button key={g.name}
                className={`chip ${activeGroup===g.name ? 'is-on' : ''}`}
                onClick={()=>setActiveGroup(g.name)}>
                {g.name}
              </button>
            ))}
          </div>

          <div style={{
            padding: 20,
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(15,67,23,0.10)',
            borderRadius: 18,
            minHeight: 200
          }}>
            <div className="skill-cloud">
              {SKILL_GROUPS.find(g=>g.name===activeGroup).skills.map(s => (
                <Chip key={s} on={skills.includes(s)} onClick={()=>toggleSkill(s)}>{s}</Chip>
              ))}
            </div>
          </div>

          {skills.length > 0 && (
            <div className="col gap-8">
              <div className="eyebrow">Selected ({skills.length})</div>
              <div className="row gap-6" style={{flexWrap: 'wrap'}}>
                {skills.map(s => (
                  <Chip key={s} on={true} removable onRemove={()=>toggleSkill(s)} onClick={()=>{}}>
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className="row" style={{justifyContent: 'space-between', marginTop: 12}}>
            <button className="btn btn-ghost" onClick={()=>setStep(1)}>Back</button>
            <button className="btn btn-primary" disabled={!canNext2} onClick={()=>setStep(3)} style={{opacity: canNext2?1:0.5}}>
              Next <Icon.Arrow />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="col gap-20">
          <div className="col gap-6">
            <div className="h1" style={{fontSize: 34}}>How do you like to work?</div>
            <div className="muted" style={{fontSize: 15}}>
              This helps filter out irrelevant offers.
            </div>
          </div>

          <div className="field">
            <label className="field-label">Work format</label>
            <div className="row gap-8" style={{flexWrap: 'wrap', marginTop: 4}}>
              {[
                {id: 'remote', label: 'Remote'},
                {id: 'hybrid', label: 'Hybrid'},
                {id: 'office', label: 'Office'},
                {id: 'relocation', label: 'Open to relocation'}
              ].map(f => (
                <Chip key={f.id} on={formats.includes(f.id)} onClick={()=>toggleFormat(f.id)}>{f.label}</Chip>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Expected salary</label>
            <div className="row" style={{justifyContent: 'space-between'}}>
              <div className="muted" style={{fontSize: 13}}>from $1,000</div>
              <div style={{fontWeight: 700, fontSize: 16}}>${salary * 10}</div>
              <div className="muted" style={{fontSize: 13}}>up to $10,000</div>
            </div>
            <input type="range" min={60} max={500} step={10} value={salary}
              onChange={e=>setSalary(+e.target.value)}
              style={{width: '100%', accentColor: 'var(--accent-strong)'}} />
          </div>

          <div style={{
            padding: 20, borderRadius: 18,
            background: 'rgba(255,255,255,0.55)',
            border: '1px solid rgba(15,67,23,0.12)',
            display: 'flex', gap: 14, alignItems: 'flex-start'
          }}>
            <span style={{color: 'var(--text)', marginTop: 2}}><Icon.AI /></span>
            <div className="col gap-4">
              <div style={{fontWeight: 700, fontSize: 14, color: 'var(--text)'}}>Ready to match</div>
              <div style={{fontSize: 13, color: 'rgba(15,67,23,0.7)', lineHeight: 1.5}}>
                We'll find {Math.max(8, skills.length * 4)} jobs with over 70% relevance.
                Updated daily.
              </div>
            </div>
          </div>

          <div className="row" style={{justifyContent: 'space-between', marginTop: 12}}>
            <button className="btn btn-ghost" onClick={()=>setStep(2)}>Back</button>
            <button 
              className="btn btn-mint btn-lg" 
              onClick={handleSaveData} 
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Show jobs'} <Icon.Arrow />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { LoginPage, OnboardingPage, EXP_LEVELS });
