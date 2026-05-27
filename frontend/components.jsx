/* global React */
const { useState, useEffect, useMemo, useRef } = React;

// ============ Icons ============
const Icon = {
  Search: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  Home: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></svg>,
  Spark: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>,
  Profile: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4.4 4.1-7 8-7s7.2 2.6 8 7" /></svg>,
  Saved: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 4h12v17l-6-4-6 4z" /></svg>,
  Bell: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>,
  Pin: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 13v8" /><path d="M5 8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4l-2 5H7L5 8z" /></svg>,
  Money: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>,
  Clock: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  Arrow: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>,
  Check: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5" /></svg>,
  Bookmark: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 4h12v17l-6-4-6 4z" /></svg>,
  X: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Filter: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 5h18" /><path d="M6 12h12" /><path d="M10 19h4" /></svg>,
  AI: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p} style={{ stroke: "rgb(0, 0, 0)" }}><path d="M12 2v3M12 19v3M5 12H2M22 12h-3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" style={{ stroke: "rgb(0, 0, 0)" }} /><circle cx="12" cy="12" r="4" /></svg>,
  Settings: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Moon: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
};

// ============ Logo ============
function Logo({ size = 28 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="assets/logo.svg" alt="NextStep" height={size} style={{ height: size, width: 'auto', display: 'block' }} />
      <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>NextStep</div>
    </div>);
}

// ============ Match Meter ============
function MatchMeter({ pct = 80, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (1 - pct / 100);
  return (
    <div className="meter" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle className="fill" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={dash} />
      </svg>
      <div className="label">{pct}%</div>
    </div>);
}

// ============ Avatar ============
function Avatar({ name = 'AB', size = 36 }) {
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, backgroundColor: "rgb(222, 222, 222)", color: "rgb(0, 0, 0)" }}>{initials}</span>;
}

// ============ Chip ============
function Chip({ on, onClick, children, removable, onRemove }) {
  return (
    <button type="button" className={`chip ${on ? 'is-on' : ''}`} onClick={onClick}>
      {on && <Icon.Check />}
      <span>{children}</span>
      {removable &&
        <span onClick={(e) => { e.stopPropagation(); onRemove && onRemove(); }} style={{ marginLeft: 2, opacity: 0.7, display: 'inline-flex' }}>
          <Icon.X width={12} height={12} />
        </span>
      }
    </button>);
}

// ============ Sidebar ============
function Sidebar({ page, onNav, user }) {
  const items = [
    { id: 'home', label: 'Home', icon: <Icon.Home /> },
    { id: 'search', label: 'Search', icon: <Icon.Search /> },
    { id: 'saved', label: 'Saved', icon: <Icon.Saved /> },
    { id: 'profile', label: 'Profile', icon: <Icon.Profile /> },
    { id: 'settings', label: 'Settings', icon: <Icon.Settings /> }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <Logo size={28} />
      </div>
      <nav className="col gap-4" style={{ flex: 1 }}>
        {items.map((it) =>
          <div key={it.id}
            className={`nav-item ${page === it.id ? 'is-active' : ''}`}
            onClick={() => onNav(it.id)}>
            <span className="dot"></span>
            {it.icon}
            <span>{it.label}</span>
          </div>
        )}
      </nav>
      <div className="row gap-10" style={{ padding: '12px 8px', borderTop: '1px solid rgba(15,67,23,0.10)' }}>
        <Avatar name={user.name} size={32} />
        <div className="col" style={{ lineHeight: 1.2, minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.role || user.title || 'Candidate'}</div>
        </div>
      </div>
    </aside>);
}

// ============ Job Card (editorial list row) ============
function JobCard({ job, saved, onSave, onOpen }) {
  return (
    <div className="job-row" onClick={onOpen}>
      <div className="job-row-main">
        <div className="job-row-title">{job.title}</div>
        <div className="job-row-meta">
          <span className="job-row-company">{job.company}</span>
          <span aria-hidden="true">·</span>
          <span>{job.location}</span>
          <span aria-hidden="true">·</span>
          <span>{job.salary}</span>
        </div>
      </div>
      <div className="job-row-side">
        <button
          type="button"
          className={`job-row-save ${saved ? 'is-on' : ''}`}
          onClick={(e) => { e.stopPropagation(); onSave && onSave(); }}
          aria-label={saved ? 'Remove from saved' : 'Save'}>
          <Icon.Bookmark />
        </button>
        <span className="job-row-pct">{job.match}%</span>
        <span className="job-row-arrow"><Icon.Arrow /></span>
      </div>
    </div>);
}

// ============ Job Detail Modal ============
function JobDetail({ job, onClose, saved, onSave }) {
  if (!job) return null;

  const getDomainName = (url) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch (e) {
      return 'website';
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.6)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      
      {/* Головний контейнер модалки */}
      <div 
        className="job-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1C1C1C', // Темно-сірий фон як на скріні
          border: '1px solid #333',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 640,
          color: '#E0E0E0',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Хедер модалки */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#888', textTransform: 'uppercase' }}>
              {job.match}% match
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 500, color: '#FFF', margin: 0, lineHeight: 1.2 }}>
              {job.title}
            </h2>
            <div style={{ fontSize: 14, color: '#A0A0A0' }}>
              {job.company} · {job.location} · {job.type}
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 4 
            }}
          >
            <Icon.X size={20} />
          </button>
        </div>

        {/* Блок Why this match */}
        <div style={{
          marginTop: 24, padding: 16, background: '#262626', 
          border: '1px solid #333', borderRadius: 8,
          display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#888', textTransform: 'uppercase' }}>
            Why this match
          </span>
          <span style={{ fontSize: 14, color: '#D4D4D4', lineHeight: 1.5 }}>
            {job.why || `Matched from ${getDomainName(job.url)} listings. Tags overlap with your profile: ${job.tags?.slice(0, 3).join(', ')}.`}
          </span>
        </div>

        {/* Статистика (Salary, Format, Posted) */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Salary', value: job.salary || 'Negotiable' },
            { label: 'Format', value: job.type || 'remote' },
            { label: 'Posted', value: job.posted || 'Recently' }
          ].map((stat, idx) => (
            <div key={idx} style={{ 
              flex: 1, minWidth: 140, background: '#262626', 
              border: '1px solid #333', borderRadius: 8, padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 4
            }}>
              <div style={{ fontSize: 12, color: '#888' }}>{stat.label}</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#FFF' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* About the role */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#888', textTransform: 'uppercase' }}>
            About the role
          </div>
          <div style={{ fontSize: 14, color: '#D4D4D4', lineHeight: 1.6 }}>
            {job.description || `View full job description on ${getDomainName(job.url)}.`}
          </div>
        </div>

        {/* Key skills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#888', textTransform: 'uppercase' }}>
            Key skills
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {job.tags?.map((t) => (
              <span key={t} style={{ 
                padding: '4px 12px', background: 'transparent', 
                border: '1px solid #444', borderRadius: 100, 
                fontSize: 13, color: '#CCC' 
              }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* --- AI Block --- */}
        <div style={{
          marginTop: 24, padding: '16px 20px',
          background: '#1A2A20', // Більш точний темний зелений фон
          border: '1px solid #233A2B',
          borderRadius: 12,
          display: 'flex', gap: 12, alignItems: 'flex-start',
          textAlign: 'left'
        }}>
          <span style={{ color: '#72B87D', flexShrink: 0, marginTop: 2 }}>
            <Icon.Spark size={18} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            <div style={{ fontWeight: 500, fontSize: 14, color: '#72B87D', margin: 0 }}>
              AI tailors your resume
            </div>
            <div style={{ fontSize: 13, color: '#72B87D', opacity: 0.8, lineHeight: 1.5, margin: 0 }}>
              We'll highlight relevant projects and skills, and reframe your experience to fit the role.
            </div>
          </div>
        </div>

        {/* Футер з кнопками */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button 
            onClick={onSave}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', color: '#A0A0A0',
              cursor: 'pointer', padding: '8px 16px', fontSize: 14, fontWeight: 500
            }}
          >
            <Icon.Bookmark size={16} /> {saved ? 'Saved' : 'Save'}
          </button>
          
          <button 
            onClick={() => job.url && window.open(job.url, '_blank')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#FFF', color: '#000',
              border: 'none', borderRadius: 100,
              padding: '10px 20px', fontSize: 14, fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            View on {getDomainName(job.url)} <Icon.Arrow size={16} />
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
