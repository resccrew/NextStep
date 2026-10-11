/* global React */
const { useState, useEffect, useMemo, useRef } = React;

// ============ Icons ============
const Icon = {
  Search: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  Home: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></svg>,
  Briefcase: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Spark: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></svg>,
  Profile: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c.8-4.4 4.1-7 8-7s7.2 2.6 8 7" /></svg>,
  Saved: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 4h12v17l-6-4-6 4z" /></svg>,
  Bell: (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>,
  Pin: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 13v8" /><path d="M5 8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4l-2 5H7L5 8z" /></svg>,
  Money: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>,
  Clock: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  Arrow: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>,
  Check: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5" /></svg>,
  Bookmark: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 4h12v17l-6-4-6 4z" /></svg>,
  X: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>,
  Filter: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 5h18" /><path d="M6 12h12" /><path d="M10 19h4" /></svg>,
  AI: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2v3M12 19v3M5 12H2M22 12h-3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /><circle cx="12" cy="12" r="4" /></svg>,
  Settings: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Moon: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
};

// ============ Status helpers (DESIGN.md §2 — application status colors) ============
const STATUS = {
  saved:     { label: 'Zapisana',  color: '#9AA59E' },
  sent:      { label: 'Wysłana',   color: '#5B8DEF' },
  interview: { label: 'Rozmowa',   color: '#E3A93B' },
  offer:     { label: 'Oferta',    color: '#2DBE49' },
  rejected:  { label: 'Odrzucona', color: '#D9534F' }
};
const STATUS_ORDER = ['saved', 'sent', 'interview', 'offer', 'rejected'];

// ============ Logo ============
function Logo({ size = 28, dark = false }) {
  return (
    <div className="logo-row" aria-label="NextStep" style={{ fontSize: size / 0.73 }}>
      <img src="assets/logo.svg" alt="" className="logo-mark" style={{ filter: dark ? 'brightness(0) invert(1)' : undefined }} />
      <span className="logo-text">extstep</span>
    </div>
  );
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
  const initials = (name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials}</span>;
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
function Sidebar({ page, onNav, user, completeness = 0, theme, onToggleTheme, onOpenRecs }) {
  const items = [
    { id: 'home', label: 'Home', icon: <Icon.Home /> },
    { id: 'search', label: 'Oferty', icon: <Icon.Briefcase /> },
    { id: 'saved', label: 'Aplikacje', icon: <Icon.Saved /> },
    { id: 'profile', label: 'Profil', icon: <Icon.Profile /> },
    { id: 'settings', label: 'Ustawienia', icon: <Icon.Settings /> }
  ];
  const initials = (user.name || user.username || user.email || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="sidebar">
      <div className="brand-row">
        <Logo size={24} />
      </div>
      <nav className="col gap-4" style={{ flex: 1 }}>
        {items.map((it) =>
          <button key={it.id} type="button"
            className={`nav-item ${page === it.id ? 'is-active' : ''}`}
            onClick={() => onNav(it.id)}>
            {it.icon}
            <span className="nav-label">{it.label}</span>
          </button>
        )}
        <button type="button" className="recs-btn" onClick={onOpenRecs}>▶ Rekomendacje</button>
      </nav>
      <div className="sidebar-spacer"></div>
      <button type="button" className="completeness-card" onClick={() => onNav('profile')}>
        <span className="completeness-row">
          <span style={{ fontWeight: 600 }}>Profil uzupełniony</span>
          <span className="muted">{completeness}%</span>
        </span>
        <span className="completeness-track"><span className="completeness-fill" style={{ width: `${completeness}%` }}></span></span>
      </button>
      <div className="sidebar-user">
        <Avatar name={initials} size={32} />
        <div className="who">
          <span className="name">{user.name || user.username || 'Użytkownik'}</span>
          <span className="email">{user.email}</span>
        </div>
        <button type="button" className="theme-btn" title="Zmień motyw" onClick={onToggleTheme}>
          {theme === 'dark' ? <Icon.Sun /> : <Icon.Moon />}
        </button>
      </div>
    </aside>);
}

// ============ Job Row (editorial list row, DESIGN.md §5) ============
function JobRow({ job, saved, status, onSave, onOpen, onHide, detailed = true, seen = false }) {
  const st = status ? STATUS[status] : null;
  return (
    <div className={`job-row ${seen ? 'is-seen' : ''}`} onClick={onOpen}>
      <span className={`match-pill ${job.match >= 80 ? 'is-high' : ''}`}>{job.match}%</span>
      <div className="job-row-main">
        <div className="job-row-title-line">
          <span className="job-row-title">{job.title}</span>
          {job.featured && <span className="badge-tag is-new">NOWA</span>}
        </div>
        <div className="job-row-meta">
          {job.company} · {job.location} · {job.type} · <strong>{job.salary}</strong>
        </div>
        {detailed && job.tags?.length > 0 && (
          <div className="job-row-skills">
            <span className="have">✓ {job.tags.slice(0, 3).join(', ')}</span>
          </div>
        )}
      </div>
      <div className="job-row-side">
        <span className="job-row-posted">{job.posted}</span>
        {st ? (
          <span className="job-row-status"><span className="dot" style={{ background: st.color }}></span>{st.label}</span>
        ) : (
          <button type="button" className={`job-row-save ${saved ? 'is-on' : ''}`}
            onClick={(e) => { e.stopPropagation(); onSave && onSave(); }}>
            <Icon.Bookmark />{saved ? 'Zapisano' : 'Zapisz'}
          </button>
        )}
        {onHide && (
          <button type="button" className="job-row-hide" title="Nie interesuje mnie"
            onClick={(e) => { e.stopPropagation(); onHide(); }}>×</button>
        )}
      </div>
    </div>);
}
// Backwards-compatible alias used by earlier pages.
const JobCard = JobRow;

// ============ Job Detail Modal ============
function JobDetail({ job, onClose, saved, onSave, status, onStatusChange }) {
  if (!job) return null;

  const getDomainName = (url) => {
    try { return new URL(url).hostname.replace('www.', ''); }
    catch (e) { return 'praca.pl'; }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div className="col gap-6" style={{ minWidth: 0, flex: 1 }}>
            <span className="eyebrow">{job.match}% dopasowania</span>
            <h2 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2 }}>{job.title}</h2>
            <div className="muted" style={{ fontSize: 14 }}>{job.company} · {job.location} · {job.type}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 6 }}><Icon.X /></button>
        </div>

        <div className="col gap-8" style={{ marginTop: 20, padding: 16, background: 'var(--surface2)', borderRadius: 8 }}>
          <span className="eyebrow">Dlaczego to dopasowanie</span>
          <span style={{ fontSize: 14, lineHeight: 1.5 }}>{job.why}</span>
        </div>

        <div className="row gap-12" style={{ marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Wynagrodzenie', value: job.salary || 'do negocjacji' },
            { label: 'Format', value: job.type || 'remote' },
            { label: 'Dodano', value: job.posted || 'Niedawno' }
          ].map((stat, idx) => (
            <div key={idx} className="col gap-4" style={{ flex: 1, minWidth: 140, background: 'var(--surface2)', borderRadius: 8, padding: '12px 16px' }}>
              <div className="muted" style={{ fontSize: 12 }}>{stat.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="col gap-8" style={{ marginTop: 20 }}>
          <span className="eyebrow">O ofercie</span>
          <div className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
            {job.description || `Pełny opis stanowiska znajdziesz na ${getDomainName(job.url)}.`}
          </div>
        </div>

        <div className="col gap-10" style={{ marginTop: 20 }}>
          <span className="eyebrow">Wymagane umiejętności</span>
          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            {job.tags?.map((t) => <span key={t} className="pill">{t}</span>)}
          </div>
        </div>

        {onStatusChange && (
          <div className="col gap-6" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <span className="eyebrow">STATUS</span>
            <div className="stage-list" style={{ borderTop: 'none', paddingTop: 0 }}>
              {STATUS_ORDER.map(key => (
                <button key={key} type="button"
                  className={`stage-btn ${status === key ? 'is-active' : ''}`}
                  onClick={() => onStatusChange(key)}>
                  <span className="dot" style={{ background: STATUS[key].color }}></span>
                  <span className="label">{STATUS[key].label}</span>
                  {status === key && <Icon.Check />}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="row gap-12" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onSave} className="btn btn-ghost">
            <Icon.Bookmark /> {saved ? 'Zapisano' : 'Zapisz'}
          </button>
          <button onClick={() => job.url && window.open(job.url, '_blank')} className="btn btn-mint">
            Aplikuj na {getDomainName(job.url)} <Icon.Arrow />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Toast ============
function Toast({ message, actionLabel, onAction, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onDone(), 3200);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div className="toast">
      <Icon.Check /> {message}
      {actionLabel && onAction && (
        <button className="undo-btn" onClick={() => { onAction(); onDone(); }}>{actionLabel}</button>
      )}
    </div>
  );
}

Object.assign(window, { Icon, Logo, MatchMeter, Avatar, Chip, Sidebar, JobRow, JobCard, JobDetail, Toast, STATUS, STATUS_ORDER });
