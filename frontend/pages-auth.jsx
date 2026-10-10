/* global React, SKILL_GROUPS, JOBS, Icon, Logo, MatchMeter, Avatar, Chip, JobRow */
const { useState: useStateP, useMemo: useMemoP, useEffect: useEffectP } = React;

// ============ Login Page (DESIGN.md §6 — split screen, mint brand panel + staircase) ============
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

    const isDark = localStorage.getItem('theme') === 'dark';
    window.google.accounts.id.renderButton(
      document.getElementById("google-btn-div"),
      { theme: isDark ? "filled_black" : "outline", size: "large", width: 360, shape: "rectangular" }
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
        throw new Error(data.error || 'Błąd autoryzacji Google');
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
    ? { email: email, password: password }
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
        const errorMsg = data.detail || (data.email && data.email[0]) || 'Błąd autoryzacji';
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
          onLogin({ name: name || (email.split('@')[0] || 'Użytkownik'), email: email || 'user@example.com' });
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
    <div className="auth-split" style={{ opacity: flying ? 0.5 : 1, transition: 'opacity .3s' }}>
      <div className="auth-brand-panel">
        <Logo size={26} />
        <div className="auth-brand-headline">
          <h1>Znajdź swój next&nbsp;step.</h1>
          <p>Oferty IT z polskich portali, posortowane według tego, jak bardzo do Ciebie pasują.</p>
        </div>
        <div className="auth-staircase">
          <span style={{ height: 45, background: '#D6FFD8' }}></span>
          <span style={{ height: 90, background: '#fff' }}></span>
          <span style={{ height: 135, background: '#2DBE49' }}></span>
          <span style={{ height: 180, background: '#0B1F12' }}></span>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="inner">
          <h2 style={{ fontSize: 28, marginBottom: 6 }}>
            {mode === 'signin' ? 'Zaloguj się' : 'Stwórz konto'}
          </h2>

          <div id="google-btn-div" style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: 40 }}></div>

          <div className="auth-divider"><span className="line"></span>lub<span className="line"></span></div>

          <form className="col gap-10" onSubmit={submit}>
            {mode === 'signup' && (
              <input className="auth2-input" placeholder="Twoje imię" value={name}
                onChange={e => setName(e.target.value)} required />
            )}
            <input className="auth2-input" type="text" placeholder="Adres e-mail" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <input className="auth2-input" type="password" placeholder="Hasło" value={password}
              onChange={e => setPassword(e.target.value)} required />

            {error && <div className="auth2-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
              {mode === 'signin' ? 'Kontynuuj z e-mailem' : 'Utwórz konto'}
            </button>
          </form>

          <p className="muted" style={{ fontSize: 12, textAlign: 'center' }}>
            Kontynuując, akceptujesz <a href="#">Politykę prywatności</a> NextStep.
          </p>

          <button type="button" className="auth-switch-btn" onClick={switchMode}>
            {mode === 'signin' ? (
              <>Nowy w NextStep? <strong style={{ color: 'var(--ink)' }}>Stwórz konto</strong></>
            ) : (
              <>Masz już konto? <strong style={{ color: 'var(--ink)' }}>Zaloguj się</strong></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Onboarding Page (3 steps: stanowisko+poziom → umiejętności → format+wynagrodzenie) ============
const EXP_LEVELS = [
  { id: 'junior',   label: 'Junior',        years: '0 – 1 rok',    pct: 15 },
  { id: 'middle',   label: 'Mid-level',     years: '1 – 3 lata',   pct: 40 },
  { id: 'senior',   label: 'Senior',        years: '3 – 6 lat',    pct: 70 },
  { id: 'lead',     label: 'Lead / Expert', years: '6+ lat',       pct: 95 }
];

const FORMAT_OPTS = [
  { id: 'remote', label: 'Zdalnie' },
  { id: 'hybrid', label: 'Hybrydowo' },
  { id: 'office', label: 'Biuro' },
  { id: 'relocation', label: 'Otwarty na relokację' }
];

function OnboardingPage({ profile, onSave, onSkip, embedded = false, initialStep = 1 }) {
  const [step, setStep] = useStateP(initialStep);
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
        throw new Error('Nie udało się zapisać danych na serwerze');
      }

      onSave(dataToSave);

    } catch (error) {
      console.error('Error:', error);
      alert('Nie udało się zapisać danych. Sprawdź połączenie z serwerem.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveStepToServer = async (data) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      await fetch('http://127.0.0.1:8000/api/users/onboarding/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error('Failed to save step:', err);
    }
  };

  const titles = {
    1: { title: 'Zacznijmy od podstaw.', sub: 'Powiedz nam, czego szukasz. Im więcej szczegółów, tym lepsze dopasowania.' },
    2: { title: 'Twoje umiejętności', sub: 'Wybierz co najmniej trzy. AI uwzględni też powiązane technologie.' },
    3: { title: 'Jak lubisz pracować?', sub: 'To pomaga odfiltrować oferty, które się nie liczą.' }
  };

  const body = (
    <div className="col gap-20">
      <div className="steps" style={{ justifyContent: embedded ? 'flex-start' : 'space-between' }}>
        {!embedded && <Logo size={22} />}
        {!embedded && (
          <div className="row gap-10">
            <span className="muted" style={{ fontSize: 13 }}>Krok {step} z 3</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onSkip}>Pomiń na razie</button>
          </div>
        )}
      </div>
      <div className="ob-bars">
        <span className={step >= 1 ? 'is-on' : ''}></span>
        <span className={step >= 2 ? 'is-on' : ''}></span>
        <span className={step >= 3 ? 'is-on' : ''}></span>
      </div>

      <div className="col gap-6">
        <h1 style={{ fontSize: 30 }}>{titles[step].title}</h1>
        <p className="muted" style={{ fontSize: 15, margin: 0 }}>{titles[step].sub}</p>
      </div>

      <div className="ob-card">
        {step === 1 && (
          <>
            <div className="field">
              <label className="field-label">Stanowisko</label>
              <input className="input" placeholder="np. Frontend Developer"
                value={role} onChange={e=>setRole(e.target.value)} />
              <div className="field-hint">Podobne tytuły (Front-end Engineer, UI Engineer) uwzględnimy automatycznie.</div>
            </div>
            <div className="field">
              <label className="field-label">Poziom</label>
              <div className="level-grid">
                {EXP_LEVELS.map(l => (
                  <button key={l.id} type="button" className={`level-opt ${exp===l.id ? 'is-on' : ''}`} onClick={()=>setExp(l.id)}>
                    <div className="lbl">{l.label}</div>
                    <div className="yrs">{l.years}</div>
                  </button>
                ))}
              </div>
              <div className="completeness-track" style={{ marginTop: 10 }}>
                <div className="completeness-fill" style={{ width: `${expPct}%` }}></div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="field">
              <label className="field-label">Wybrane ({skills.length}) · minimum 3</label>
            </div>
            <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
              {SKILL_GROUPS.map(g => (
                <button key={g.name} type="button"
                  className={`chip ${activeGroup===g.name ? 'is-on' : ''}`}
                  onClick={()=>setActiveGroup(g.name)}>
                  {g.name}
                </button>
              ))}
            </div>
            <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
              {SKILL_GROUPS.find(g=>g.name===activeGroup).skills.map(s => (
                <Chip key={s} on={skills.includes(s)} onClick={()=>toggleSkill(s)}>{s}</Chip>
              ))}
            </div>
            {skills.length > 0 && (
              <div className="col gap-8">
                <div className="eyebrow">Wybrane umiejętności</div>
                <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
                  {skills.map(s => (
                    <Chip key={s} on={true} removable onRemove={()=>toggleSkill(s)} onClick={()=>{}}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="field">
              <label className="field-label">Format pracy</label>
              <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
                {FORMAT_OPTS.map(f => (
                  <Chip key={f.id} on={formats.includes(f.id)} onClick={()=>toggleFormat(f.id)}>{f.label}</Chip>
                ))}
              </div>
            </div>
            <div className="field">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <label className="field-label">Oczekiwane wynagrodzenie (min.)</label>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{salary * 10} zł</span>
              </div>
              <input type="range" min={60} max={500} step={10} value={salary}
                onChange={e=>setSalary(+e.target.value)} />
            </div>
            <div className="ob-match-box">
              <span style={{ color: 'var(--accentInk)', marginTop: 2 }}><Icon.AI /></span>
              <div className="col gap-4">
                <div style={{ fontWeight: 700, fontSize: 14 }}>Gotowi do dopasowania</div>
                <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
                  Znajdziemy {Math.max(8, skills.length * 4)} ofert z dopasowaniem ponad 70%. Aktualizowane codziennie.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="row" style={{ justifyContent: 'space-between' }}>
        {step === 1 ? (
          embedded ? <button className="btn btn-ghost" onClick={onSkip}>Pomiń</button> : <span></span>
        ) : (
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Wstecz</button>
        )}
        {step === 1 && (
          <button className="btn btn-primary" disabled={!canNext1} onClick={async () => {
            await saveStepToServer({ role, experience: exp });
            setStep(2);
          }}>Dalej <Icon.Arrow /></button>
        )}
        {step === 2 && (
          <button className="btn btn-primary" disabled={!canNext2} onClick={async () => {
            await saveStepToServer({ role, experience: exp, skills });
            setStep(3);
          }}>Dalej <Icon.Arrow /></button>
        )}
        {step === 3 && (
          <button className="btn btn-mint btn-lg" onClick={handleSaveData} disabled={isSaving}>
            {isSaving ? 'Zapisywanie...' : 'Pokaż oferty'} <Icon.Arrow />
          </button>
        )}
      </div>
    </div>
  );

  if (embedded) return body;
  return <div className="ob-shell">{body}</div>;
}

Object.assign(window, { LoginPage, OnboardingPage, EXP_LEVELS, FORMAT_OPTS });
