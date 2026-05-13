/* global React, SKILL_GROUPS, JOBS, Icon, Logo, MatchMeter, Avatar, Chip, JobCard */
const { useState: useStateP, useMemo: useMemoP, useEffect: useEffectP } = React;

// ============ Login Page ============
// Diagonal flowing arcs sweeping across the screen — different look from vertical stalks.
const STALKS = (() => {
  const arr = [];
  const N = 5;
  // each line: starts off-bottom-left, arcs up and to the right, exits top-right
  const configs = [
    { y0:1200, c1x: 200, c1y:1040, c2x: 700, c2y: 560, x1: 1100, y1: 700 },
    { y0:1080, c1x: 320, c1y: 860, c2x: 820, c2y: 380, x1: 1300, y1: 540 },
    { y0: 940, c1x: 440, c1y: 660, c2x: 940, c2y: 200, x1: 1480, y1: 380 },
    { y0: 780, c1x: 560, c1y: 480, c2x:1060, c2y:  40, x1: 1560, y1: 220 },
    { y0: 600, c1x: 680, c1y: 300, c2x:1180, c2y:-140, x1: 1640, y1:  60 },
    { y0: 420, c1x: 800, c1y: 120, c2x:1300, c2y:-320, x1: 1720, y1:-100 },
  ];
  configs.forEach((c, i) => {
    const x0 = -80 + i * 20;
    const d = `M ${x0} ${c.y0} C ${c.c1x} ${c.c1y}, ${c.c2x} ${c.c2y}, ${c.x1} ${c.y1}`;
    const width = 22 - i * 2.5;
    const opacity = 0.55 + (i % 3) * 0.08;
    const stroke = i % 2 === 0 ? '#A8F0AE' : '#7FE38B';
    const len = 2200 + i * 100;
    const delay = (i * 0.12).toFixed(2);
    const flyDelay = ((N - 1 - i) * 0.08).toFixed(2);
    arr.push({ d, width, opacity, stroke, len, delay, flyDelay, i });
  });
  return arr;
})();

function LoginPage({ onLogin }) {
  const [mode, setMode] = useStateP('signin');
  const [email, setEmail] = useStateP('');
  const [name, setName] = useStateP('');
  const [flying, setFlying] = useStateP(false);

  const submit = (e) => {
    if (e) e.preventDefault();
    if (flying) return;
    setFlying(true);
    setTimeout(() => {
      onLogin({ name: name || (email.split('@')[0] || 'Анна Орлова'), email: email || 'anna@example.com' });
    }, 1700);
  };

  return (
    <div className={`auth-wrap ${flying ? 'is-flying' : ''}`}>
      <div className="auth-bg" aria-hidden="true">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice">
          <g>
            {STALKS.map(s => (
              <path key={s.i} className="stalk" d={s.d}
                stroke={s.stroke} strokeWidth={s.width} opacity={s.opacity}
                style={{ '--len': s.len, '--delay': `${s.delay}s`, '--fly-delay': `${s.flyDelay}s` }} />
            ))}
          </g>
        </svg>
      </div>

      <div className="auth-top">
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <img src="assets/logo.png" alt="" width={28} height={28} style={{borderRadius: 7, display:'block'}} />
          <div style={{fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em'}}>NextStep</div>
        </div>
        <a href="#" style={{fontSize: 13, color: 'var(--text-muted)', fontWeight: 500}}>Нужна помощь?</a>
      </div>

      <div className="auth-stage">
        <div className="auth-card">
          <img src="assets/logo.png" alt="NextStep" className="auth-logo-hero" />

          <div className="col gap-6" style={{textAlign: 'center'}}>
            <div className="h2" style={{fontSize: 26}}>
              {mode === 'signin' ? 'С возвращением' : 'Создайте аккаунт'}
            </div>
            <div className="muted" style={{fontSize: 14}}>
              {mode === 'signin'
                ? 'Войдите, чтобы увидеть свежие подборки.'
                : 'Это займёт пару минут.'}
            </div>
          </div>

          <div className="seg" style={{alignSelf: 'center'}}>
            <button className={mode==='signin' ? 'is-on' : ''} onClick={()=>setMode('signin')}>Вход</button>
            <button className={mode==='signup' ? 'is-on' : ''} onClick={()=>setMode('signup')}>Регистрация</button>
          </div>

          <form className="col gap-14" onSubmit={submit}>
            {mode === 'signup' && (
              <div className="field">
                <label className="field-label">Как к вам обращаться</label>
                <input className="input" placeholder="Анна Орлова" value={name} onChange={e=>setName(e.target.value)} />
              </div>
            )}
            <div className="field">
              <label className="field-label">Электронная почта</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Пароль</label>
              <input className="input" type="password" placeholder="••••••••" defaultValue="demo1234" />
              {mode === 'signin' && (
                <div className="row" style={{justifyContent: 'flex-end'}}>
                  <a href="#" style={{fontSize: 12, color: 'var(--text-muted)', fontWeight: 500}}>Забыли пароль?</a>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{width: '100%', marginTop: 4}}>
              {mode === 'signin' ? 'Войти' : 'Создать аккаунт'} <Icon.Arrow />
            </button>

            <div className="divider">или</div>

            <button type="button" className="btn btn-ghost" style={{width: '100%'}} onClick={submit}>
              <span style={{
                width: 16, height: 16, borderRadius: 4,
                background: 'conic-gradient(from 0deg, #EA4335, #FBBC05, #34A853, #4285F4, #EA4335)'
              }}></span>
              Продолжить с Google
            </button>
          </form>
        </div>
      </div>

      <div className="auth-foot">© 2026 NextStep · MVP</div>
    </div>
  );
}

// ============ Onboarding Page (Skills + Experience) ============
const EXP_LEVELS = [
  { id: 'junior',   label: 'Начинающий',  years: '0 – 1 год',   pct: 15 },
  { id: 'middle',   label: 'Средний',     years: '1 – 3 года',  pct: 40 },
  { id: 'senior',   label: 'Опытный',     years: '3 – 6 лет',   pct: 70 },
  { id: 'lead',     label: 'Лид / Эксперт',  years: '6+ лет',    pct: 95 }
];

function OnboardingPage({ profile, onSave, onSkip, embedded = false }) {
  const [step, setStep] = useStateP(profile.onboardingStep || 1);
  const [activeGroup, setActiveGroup] = useStateP(SKILL_GROUPS[0].name);
  const [skills, setSkills] = useStateP(profile.skills || []);
  const [exp, setExp] = useStateP(profile.experience || 'middle');
  const [formats, setFormats] = useStateP(profile.formats || ['remote']);
  const [salary, setSalary] = useStateP(profile.salary || 200);
  const [role, setRole] = useStateP(profile.role || '');

  const toggleSkill = (s) => setSkills(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s]);
  const toggleFormat = (f) => setFormats(prev => prev.includes(f) ? prev.filter(x=>x!==f) : [...prev, f]);

  const expIndex = EXP_LEVELS.findIndex(e=>e.id===exp);
  const expPct = EXP_LEVELS[expIndex]?.pct || 50;

  const canNext1 = !!role.trim();
  const canNext2 = skills.length >= 3;
  const canFinish = true;

  return (
    <div style={{maxWidth: 760, margin: '0 auto', padding: embedded ? '0' : '48px 24px'}}>
      {!embedded && (
        <div className="row" style={{justifyContent: 'space-between', marginBottom: 24}}>
          <Logo size={28} />
          <button className="btn btn-ghost btn-sm" onClick={onSkip}>Пропустить пока</button>
        </div>
      )}

      <div className="steps" style={{marginBottom: 20}}>
        <span className={`pill ${step>=1 ? 'is-on' : ''}`}>1 · О вас</span>
        <span style={{width: 16, height: 1, background: 'var(--border)'}}></span>
        <span className={`pill ${step>=2 ? 'is-on' : ''}`}>2 · Навыки</span>
        <span style={{width: 16, height: 1, background: 'var(--border)'}}></span>
        <span className={`pill ${step>=3 ? 'is-on' : ''}`}>3 · Предпочтения</span>
      </div>

      {step === 1 && (
        <div className="col gap-20">
          <div className="col gap-6">
            <div className="h1" style={{fontSize: 34}}>Начнём с простого.</div>
            <div className="muted" style={{fontSize: 15}}>
              Расскажите, кого вы ищете. Чем точнее — тем умнее подборки.
            </div>
          </div>

          <div className="field">
            <label className="field-label">Какую работу вы ищете?</label>
            <input className="input" placeholder="Например, Frontend-разработчик"
              value={role} onChange={e=>setRole(e.target.value)} />
            <div className="field-hint">AI поймёт близкие названия: Front-end Engineer, JS-разработчик, UI Engineer.</div>
          </div>

          <div className="field">
            <label className="field-label">Ваш уровень</label>
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
              Дальше <Icon.Arrow />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="col gap-20">
          <div className="col gap-6">
            <div className="h1" style={{fontSize: 34}}>Ваши навыки</div>
            <div className="muted" style={{fontSize: 15}}>
              Отметьте минимум три. AI учтёт близкие технологии автоматически.
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
            background: 'var(--surface)',
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
              <div className="eyebrow">Вы выбрали ({skills.length})</div>
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
            <button className="btn btn-ghost" onClick={()=>setStep(1)}>Назад</button>
            <button className="btn btn-primary" disabled={!canNext2} onClick={()=>setStep(3)} style={{opacity: canNext2?1:0.5}}>
              Дальше <Icon.Arrow />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="col gap-20">
          <div className="col gap-6">
            <div className="h1" style={{fontSize: 34}}>Как любите работать?</div>
            <div className="muted" style={{fontSize: 15}}>
              Это поможет отфильтровать неподходящие предложения.
            </div>
          </div>

          <div className="field">
            <label className="field-label">Формат работы</label>
            <div className="row gap-8" style={{flexWrap: 'wrap', marginTop: 4}}>
              {[
                {id: 'remote', label: 'Удалённо'},
                {id: 'hybrid', label: 'Гибрид'},
                {id: 'office', label: 'Офис'},
                {id: 'relocation', label: 'Готов(а) к релокации'}
              ].map(f => (
                <Chip key={f.id} on={formats.includes(f.id)} onClick={()=>toggleFormat(f.id)}>{f.label}</Chip>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Ожидаемая зарплата</label>
            <div className="row" style={{justifyContent: 'space-between'}}>
              <div className="muted" style={{fontSize: 13}}>от 60 000 ₽</div>
              <div style={{fontWeight: 700, fontSize: 16}}>{salary * 1000} ₽</div>
              <div className="muted" style={{fontSize: 13}}>до 500 000 ₽</div>
            </div>
            <input type="range" min={60} max={500} step={10} value={salary}
              onChange={e=>setSalary(+e.target.value)}
              style={{width: '100%', accentColor: 'var(--accent-strong)'}} />
          </div>

          <div style={{
            padding: 20, borderRadius: 18,
            background: 'var(--accent-soft)',
            display: 'flex', gap: 14, alignItems: 'flex-start'
          }}>
            <span style={{color: 'var(--accent-strong)', marginTop: 2}}><Icon.AI /></span>
            <div className="col gap-4">
              <div style={{fontWeight: 700, fontSize: 14, color: 'var(--accent-ink)'}}>Готово к подбору</div>
              <div style={{fontSize: 13, color: 'var(--accent-ink)', opacity: 0.85, lineHeight: 1.5}}>
                Найдём {Math.max(8, skills.length * 4)} вакансий с релевантностью выше 70%.
                Подборка обновляется ежедневно.
              </div>
            </div>
          </div>

          <div className="row" style={{justifyContent: 'space-between', marginTop: 12}}>
            <button className="btn btn-ghost" onClick={()=>setStep(2)}>Назад</button>
            <button className="btn btn-mint btn-lg" onClick={()=>onSave({
              role, experience: exp, skills, formats, salary, onboardingDone: true
            })}>
              Показать вакансии <Icon.Arrow />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { LoginPage, OnboardingPage, EXP_LEVELS });
