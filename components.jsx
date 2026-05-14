/* global React */
const { useState, useEffect, useMemo, useRef } = React;

// ============ Icons ============
const Icon = {
  Search: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>),
  Home: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>),
  Spark: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>),
  Profile: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.4 4.1-7 8-7s7.2 2.6 8 7"/></svg>),
  Saved: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 4h12v17l-6-4-6 4z"/></svg>),
  Bell: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>),
  Pin: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 13v8"/><path d="M5 8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4l-2 5H7L5 8z"/></svg>),
  Money: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>),
  Clock: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  Arrow: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>),
  Check: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>),
  Bookmark: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 4h12v17l-6-4-6 4z"/></svg>),
  X: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>),
  Filter: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 5h18"/><path d="M6 12h12"/><path d="M10 19h4"/></svg>),
  AI: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2v3M12 19v3M5 12H2M22 12h-3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="4"/></svg>),
};

// ============ Logo ============
function Logo({ size = 28 }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap: 10}}>
      <img src="assets/logo.png" alt="NextStep" width={size} height={size} style={{borderRadius: size * 0.22, display:'block'}} />
      <div style={{fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em'}}>NextStep</div>
    </div>
  );
}

// ============ Match Meter ============
function MatchMeter({ pct = 80, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - pct / 100);
  return (
    <div className="meter" style={{width: size, height: size}}>
      <svg width={size} height={size}>
        <circle className="track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} fill="none" />
        <circle className="fill" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={dash} />
      </svg>
      <div className="label">{pct}%</div>
    </div>
  );
}

// ============ Avatar ============
function Avatar({ name = 'AB', size = 36 }) {
  const initials = name.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
  return <span className="avatar" style={{width: size, height: size, fontSize: size * 0.36}}>{initials}</span>;
}

// ============ Chip ============
function Chip({ on, onClick, children, removable, onRemove }) {
  return (
    <button type="button" className={`chip ${on ? 'is-on' : ''}`} onClick={onClick}>
      {on && <Icon.Check />}
      <span>{children}</span>
      {removable && (
        <span onClick={(e)=>{ e.stopPropagation(); onRemove && onRemove(); }} style={{marginLeft: 2, opacity: 0.7, display:'inline-flex'}}>
          <Icon.X width={12} height={12} />
        </span>
      )}
    </button>
  );
}

// ============ Sidebar ============
function Sidebar({ page, onNav, user }) {
  const items = [
    { id: 'home', label: 'Home', icon: <Icon.Home /> },
    { id: 'search', label: 'Job Search', icon: <Icon.Search /> },
    { id: 'profile', label: 'My Profile', icon: <Icon.Profile /> },
    { id: 'saved', label: 'Saved', icon: <Icon.Saved /> },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo size={28} />
      </div>
      <nav className="col gap-4" style={{flex: 1}}>
        {items.map(it => (
          <div key={it.id}
            className={`nav-item ${page === it.id ? 'is-active' : ''}`}
            onClick={() => onNav(it.id)}>
            <span className="dot"></span>
            {it.icon}
            <span>{it.label}</span>
          </div>
        ))}
      </nav>
      <div style={{
        padding: 14, borderRadius: 14, background: 'var(--accent-soft)',
        display: 'flex', flexDirection: 'column', gap: 8
      }}>
        <div style={{fontSize: 12, fontWeight: 700, color: 'var(--accent-ink)'}}>AI Assistant</div>
        <div style={{fontSize: 12, color: 'var(--accent-ink)', lineHeight: 1.4, opacity: 0.85}}>
          We'll find jobs and tailor your resume for each one.
        </div>
        <button className="btn btn-mint btn-sm" onClick={() => onNav('profile')}>
          Set up
        </button>
      </div>
      <div className="row gap-10" style={{padding: '12px 8px 0', borderTop: '1px solid var(--border)', marginTop: 4}}>
        <Avatar name={user.name} size={32} />
        <div className="col" style={{lineHeight: 1.2}}>
          <div style={{fontSize: 13, fontWeight: 600}}>{user.name}</div>
          <div style={{fontSize: 11, color: 'var(--text-muted)'}}>{user.title || 'Candidate'}</div>
        </div>
      </div>
    </aside>
  );
}

// ============ Job Card ============
function JobCard({ job, saved, onSave, onOpen }) {
  return (
    <div className="card is-interactive" style={{padding: 20}} onClick={onOpen}>
      <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', gap: 16}}>
        <div className="row gap-12" style={{alignItems: 'flex-start', flex: 1, minWidth: 0}}>
          <div className="company-logo">{job.logo}</div>
          <div className="col gap-4" style={{minWidth: 0}}>
            <div className="row gap-8" style={{flexWrap: 'wrap'}}>
              <div className="h4" style={{fontSize: 16}}>{job.title}</div>
              {job.featured && <span className="tag mint">AI Pick</span>}
            </div>
            <div className="row gap-8 muted" style={{fontSize: 13}}>
              <span style={{fontWeight: 500, color: 'var(--text)'}}>{job.company}</span>
              <span>·</span>
              <span>{job.location}</span>
            </div>
          </div>
        </div>
        <div className="col gap-4" style={{alignItems: 'flex-end'}}>
          <MatchMeter pct={job.match} size={48} />
          <div style={{fontSize: 11, color: 'var(--text-muted)', fontWeight: 600}}>match</div>
        </div>
      </div>

      <div className="row gap-16" style={{marginTop: 14, flexWrap: 'wrap'}}>
        <span className="row gap-6 muted" style={{fontSize: 13}}><Icon.Money /> {job.salary}</span>
        <span className="row gap-6 muted" style={{fontSize: 13}}><Icon.Clock /> {job.posted}</span>
        <span className="row gap-6 muted" style={{fontSize: 13}}><Icon.Pin /> {job.type}</span>
      </div>

      <div className="row gap-8" style={{marginTop: 14, flexWrap: 'wrap'}}>
        {job.tags.map(t => <span key={t} className="tag">{t}</span>)}
      </div>

      <div style={{
        marginTop: 14, padding: '10px 12px',
        background: 'var(--surface)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12.5, color: 'var(--text-muted)'
      }}>
        <span style={{color: 'var(--accent-strong)', display:'inline-flex'}}><Icon.AI /></span>
        {job.why}
      </div>

      <div className="row" style={{marginTop: 16, justifyContent: 'space-between'}}>
        <button className="btn btn-ghost btn-sm" onClick={(e)=>{ e.stopPropagation(); onSave && onSave(); }}>
          <Icon.Bookmark /> {saved ? 'Saved' : 'Save'}
        </button>
        <button className="btn btn-primary btn-sm" onClick={(e)=>{ e.stopPropagation(); onOpen(); }}>
          Apply <Icon.Arrow />
        </button>
      </div>
    </div>
  );
}

// ============ Job Detail Modal ============
function JobDetail({ job, onClose, saved, onSave }) {
  if (!job) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(16,21,18,0.36)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(2px)'
    }} onClick={onClose}>
      <div className="card" style={{
        maxWidth: 640, width: '100%', maxHeight: '85vh', overflow: 'auto',
        background: '#fff', padding: 32
      }} onClick={(e)=>e.stopPropagation()}>
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <div className="row gap-16" style={{alignItems: 'flex-start'}}>
            <div className="company-logo" style={{width: 56, height: 56, fontSize: 22, borderRadius: 14}}>{job.logo}</div>
            <div className="col gap-4">
              <div className="h2" style={{fontSize: 22}}>{job.title}</div>
              <div className="muted">{job.company} · {job.location}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon.X /></button>
        </div>

        <div className="row gap-12" style={{marginTop: 20}}>
          <MatchMeter pct={job.match} size={64} stroke={5} />
          <div className="col gap-4">
            <div className="h4">Good match</div>
            <div className="muted" style={{fontSize: 13}}>{job.why}</div>
          </div>
        </div>

        <div className="row gap-12" style={{marginTop: 24, flexWrap: 'wrap'}}>
          <div className="stat" style={{flex: 1, minWidth: 140}}>
            <div className="l">Salary</div>
            <div className="v" style={{fontSize: 18}}>{job.salary}</div>
          </div>
          <div className="stat" style={{flex: 1, minWidth: 140}}>
            <div className="l">Format</div>
            <div className="v" style={{fontSize: 18}}>{job.type}</div>
          </div>
          <div className="stat" style={{flex: 1, minWidth: 140}}>
            <div className="l">Posted</div>
            <div className="v" style={{fontSize: 18}}>{job.posted}</div>
          </div>
        </div>

        <div className="col gap-8" style={{marginTop: 24}}>
          <div className="eyebrow">About the role</div>
          <div style={{fontSize: 14, lineHeight: 1.6}}>{job.description}</div>
        </div>

        <div className="col gap-8" style={{marginTop: 20}}>
          <div className="eyebrow">Key skills</div>
          <div className="row gap-8" style={{flexWrap: 'wrap'}}>
            {job.tags.map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        </div>

        <div style={{
          marginTop: 24, padding: 16,
          background: 'var(--accent-soft)', borderRadius: 14,
          display: 'flex', gap: 12, alignItems: 'flex-start'
        }}>
          <span style={{color: 'var(--accent-strong)', flexShrink: 0, marginTop: 2}}><Icon.AI /></span>
          <div className="col gap-4">
            <div style={{fontWeight: 600, fontSize: 13, color: 'var(--accent-ink)'}}>AI tailors your resume</div>
            <div style={{fontSize: 13, color: 'var(--accent-ink)', opacity: 0.85, lineHeight: 1.5}}>
              We'll highlight relevant projects and skills, and reframe your experience to fit the role.
            </div>
          </div>
        </div>

        <div className="row gap-12" style={{marginTop: 24, justifyContent: 'flex-end'}}>
          <button className="btn btn-ghost" onClick={onSave}>
            <Icon.Bookmark /> {saved ? 'Saved' : 'Save'}
          </button>
          <button className="btn btn-primary">
            Send tailored resume <Icon.Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Toast ============
function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onDone(), 2400);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return <div className="toast"><Icon.Check /> {message}</div>;
}

Object.assign(window, { Icon, Logo, MatchMeter, Avatar, Chip, Sidebar, JobCard, JobDetail, Toast });