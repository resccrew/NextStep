/* global React, JOBS, Icon, Logo, MatchMeter, Avatar, Chip, JobCard, EXP_LEVELS */
const { useState: useStateH, useMemo: useMemoH, useEffect: useEffectH } = React;

// ============ Home / Recommendations ============
function HomePage({ user, profile, onOpenJob, savedIds, onSave, onNav }) {
  const recommended = useMemoH(() => {
    return [...JOBS].sort((a,b)=>b.match-a.match).slice(0, 5);
  }, []);
  const topMatch = recommended[0];
  const matchAvg = Math.round(recommended.reduce((s,j)=>s+j.match,0) / recommended.length);

  const firstName = (user.name || '').split(' ')[0] || 'Анна';

  return (
    <div className="col gap-32">
      <div className="topbar">
        <div className="col gap-4">
          <div className="eyebrow row gap-6"><span className="live-dot"></span> Подборка на сегодня</div>
          <div className="h1">Привет, {firstName}.</div>
        </div>
        <div className="row gap-12">
          <button className="btn btn-ghost btn-sm"><Icon.Bell /></button>
          <Avatar name={user.name} />
        </div>
      </div>

      <div className="greeting-card">
        <div className="blob"></div>
        <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, position: 'relative'}}>
          <div className="col gap-8" style={{maxWidth: 460}}>
            <div className="eyebrow">Топ совпадение</div>
            <div className="h2">{topMatch.title}</div>
            <div className="muted">{topMatch.company} · {topMatch.location} · {topMatch.salary}</div>
            <div style={{fontSize: 14, lineHeight: 1.5, marginTop: 6}}>
              AI считает, что эта вакансия совпадает с вашим профилем
              на <strong>{topMatch.match}%</strong>. Можно откликнуться с адаптированным
              резюме в один клик.
            </div>
            <div className="row gap-10" style={{marginTop: 14}}>
              <button className="btn btn-primary" onClick={()=>onOpenJob(topMatch)}>
                Посмотреть <Icon.Arrow />
              </button>
              <button className="btn btn-ghost" onClick={()=>onNav('search')}>
                Все вакансии
              </button>
            </div>
          </div>
          <MatchMeter pct={topMatch.match} size={120} stroke={8} />
        </div>
      </div>

      <div className="row gap-16">
        <div className="stat" style={{flex: 1}}>
          <div className="l">Новых сегодня</div>
          <div className="v">{recommended.length + 3}</div>
        </div>
        <div className="stat" style={{flex: 1}}>
          <div className="l">Средняя релевантность</div>
          <div className="v">{matchAvg}%</div>
        </div>
        <div className="stat" style={{flex: 1}}>
          <div className="l">Откликов в этом месяце</div>
          <div className="v">4</div>
        </div>
        <div className="stat" style={{flex: 1}}>
          <div className="l">Сохранено</div>
          <div className="v">{savedIds.length}</div>
        </div>
      </div>

      <div className="col gap-16">
        <div className="row" style={{justifyContent: 'space-between'}}>
          <div className="col gap-4">
            <div className="h2" style={{fontSize: 22}}>Рекомендуемые вакансии</div>
            <div className="muted" style={{fontSize: 13}}>Отсортированы по совпадению с вашим профилем</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>onNav('search')}>
            Все вакансии <Icon.Arrow />
          </button>
        </div>

        <div className="col gap-12">
          {recommended.map(j => (
            <JobCard key={j.id} job={j}
              saved={savedIds.includes(j.id)}
              onSave={()=>onSave(j.id)}
              onOpen={()=>onOpenJob(j)} />
          ))}
        </div>
      </div>

      <div style={{
        padding: 24, borderRadius: 18,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 24, flexWrap: 'wrap'
      }}>
        <div className="col gap-4">
          <div className="h4">Хотите более точные подборки?</div>
          <div className="muted" style={{fontSize: 13}}>Дополните профиль — займёт пару минут.</div>
        </div>
        <button className="btn btn-mint" onClick={()=>onNav('profile')}>Обновить профиль</button>
      </div>
    </div>
  );
}

// ============ Search Page ============
function SearchPage({ user, profile, onOpenJob, savedIds, onSave }) {
  const [query, setQuery] = useStateH('');
  const [minMatch, setMinMatch] = useStateH(0);
  const [activeTags, setActiveTags] = useStateH([]);
  const [format, setFormat] = useStateH('all');
  const [useAI, setUseAI] = useStateH(true);

  const allTags = useMemoH(() => {
    const t = new Set();
    JOBS.forEach(j => j.tags.forEach(x => t.add(x)));
    return [...t];
  }, []);

  const toggleTag = (t) => setActiveTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);

  const results = useMemoH(() => {
    let r = [...JOBS];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.join(' ').toLowerCase().includes(q)
      );
    }
    if (activeTags.length) {
      r = r.filter(j => activeTags.some(t => j.tags.includes(t)));
    }
    if (format !== 'all') {
      r = r.filter(j => j.location.toLowerCase().includes(format));
    }
    r = r.filter(j => j.match >= minMatch);
    r.sort((a,b)=>b.match-a.match);
    return r;
  }, [query, activeTags, minMatch, format]);

  return (
    <div className="col gap-24">
      <div className="topbar">
        <div className="col gap-4">
          <div className="eyebrow">Поиск</div>
          <div className="h1" style={{fontSize: 32}}>Найти подходящую вакансию</div>
        </div>
        <Avatar name={user.name} />
      </div>

      <div className="search-hero">
        <div className="search-bar">
          <Icon.Search />
          <input placeholder="Например, React, продакт-дизайнер, аналитик..."
            value={query} onChange={e=>setQuery(e.target.value)} />
          <button className="btn btn-primary btn-sm">
            Искать
          </button>
        </div>
        <div className="row" style={{justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 12}}>
          <div className="row gap-8" style={{flexWrap: 'wrap'}}>
            {profile.skills && profile.skills.slice(0, 5).map(s => (
              <Chip key={s} on={activeTags.includes(s)} onClick={()=>toggleTag(s)}>{s}</Chip>
            ))}
            {(!profile.skills || profile.skills.length === 0) && allTags.slice(0,5).map(s => (
              <Chip key={s} on={activeTags.includes(s)} onClick={()=>toggleTag(s)}>{s}</Chip>
            ))}
          </div>
          <label className="row gap-8" style={{fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none'}}>
            <input type="checkbox" checked={useAI} onChange={e=>setUseAI(e.target.checked)}
              style={{accentColor: 'var(--accent-strong)'}} />
            <span style={{display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-strong)'}}>
              <Icon.AI /> AI-семантический поиск
            </span>
          </label>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, alignItems: 'flex-start'}}>
        <div className="filter-card">
          <div className="row" style={{justifyContent: 'space-between', marginBottom: 14}}>
            <div className="h4" style={{fontSize: 14}}>Фильтры</div>
            <button className="arrow-link" onClick={()=>{ setActiveTags([]); setMinMatch(0); setFormat('all'); }}>Сбросить</button>
          </div>

          <div className="col gap-8" style={{marginBottom: 18}}>
            <div className="eyebrow">Минимальное совпадение</div>
            <div className="row" style={{justifyContent: 'space-between'}}>
              <div className="muted" style={{fontSize: 12}}>0%</div>
              <div style={{fontWeight: 700, fontSize: 14}}>{minMatch}%+</div>
              <div className="muted" style={{fontSize: 12}}>100%</div>
            </div>
            <input type="range" min={0} max={100} step={5} value={minMatch}
              onChange={e=>setMinMatch(+e.target.value)}
              style={{accentColor: 'var(--accent-strong)'}} />
          </div>

          <div className="col gap-8" style={{marginBottom: 18}}>
            <div className="eyebrow">Формат</div>
            <div className="col gap-6">
              {[
                {id: 'all', label: 'Все'},
                {id: 'удалён', label: 'Удалённо'},
                {id: 'гибрид', label: 'Гибрид'},
                {id: 'офис', label: 'Офис'}
              ].map(f => (
                <label key={f.id} className="row gap-8" style={{fontSize: 13, cursor: 'pointer'}}>
                  <input type="radio" name="fmt" checked={format===f.id} onChange={()=>setFormat(f.id)}
                    style={{accentColor: 'var(--accent-strong)'}} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          <div className="col gap-8">
            <div className="eyebrow">Навыки</div>
            <div className="row gap-6" style={{flexWrap: 'wrap'}}>
              {allTags.map(t => (
                <Chip key={t} on={activeTags.includes(t)} onClick={()=>toggleTag(t)}>{t}</Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="col gap-12">
          <div className="row" style={{justifyContent: 'space-between'}}>
            <div className="muted" style={{fontSize: 13}}>
              Найдено <strong style={{color: 'var(--text)'}}>{results.length}</strong> вакансий
              {activeTags.length > 0 && ` · по навыкам: ${activeTags.join(', ')}`}
            </div>
            <div className="seg">
              <button className="is-on">По совпадению</button>
              <button>Свежие</button>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="card" style={{padding: 40, textAlign: 'center'}}>
              <div className="h3" style={{marginBottom: 6}}>Ничего не найдено</div>
              <div className="muted">Попробуйте снять часть фильтров.</div>
            </div>
          ) : (
            <div className="col gap-12">
              {results.map(j => (
                <JobCard key={j.id} job={j}
                  saved={savedIds.includes(j.id)}
                  onSave={()=>onSave(j.id)}
                  onOpen={()=>onOpenJob(j)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Profile Page (Skills/Experience editor) ============
function ProfilePage({ user, profile, onSave, onNav }) {
  return (
    <div className="col gap-24">
      <div className="topbar">
        <div className="col gap-4">
          <div className="eyebrow">Профиль</div>
          <div className="h1" style={{fontSize: 32}}>Ваши навыки и опыт</div>
        </div>
        <Avatar name={user.name} />
      </div>

      <div style={{
        padding: 20,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 18,
        display: 'flex', gap: 16, alignItems: 'center'
      }}>
        <Avatar name={user.name} size={56} />
        <div className="col gap-4" style={{flex: 1}}>
          <div className="h3">{user.name}</div>
          <div className="muted" style={{fontSize: 13}}>{user.email}</div>
        </div>
        <div className="col gap-4" style={{alignItems: 'flex-end'}}>
          <div style={{fontSize: 12, color: 'var(--text-muted)', fontWeight: 600}}>Полнота профиля</div>
          <div className="row gap-8">
            <div style={{width: 120, height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden'}}>
              <div style={{width: '78%', height: '100%', background: 'var(--accent-strong)'}}></div>
            </div>
            <span style={{fontWeight: 700, fontSize: 13}}>78%</span>
          </div>
        </div>
      </div>

      <OnboardingPage
        profile={profile}
        embedded
        onSave={(p)=>{ onSave(p); onNav('home'); }}
        onSkip={()=>onNav('home')}
      />
    </div>
  );
}

// ============ Saved Page ============
function SavedPage({ user, savedIds, onOpenJob, onSave }) {
  const saved = JOBS.filter(j => savedIds.includes(j.id));
  return (
    <div className="col gap-24">
      <div className="topbar">
        <div className="col gap-4">
          <div className="eyebrow">Сохранённые</div>
          <div className="h1" style={{fontSize: 32}}>Закладки</div>
        </div>
        <Avatar name={user.name} />
      </div>

      {saved.length === 0 ? (
        <div className="card" style={{padding: 48, textAlign: 'center'}}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px',
            borderRadius: 16, background: 'var(--accent-soft)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-strong)'
          }}>
            <Icon.Bookmark width={24} height={24} />
          </div>
          <div className="h3" style={{marginBottom: 6}}>Здесь пока пусто</div>
          <div className="muted">Нажмите «Сохранить» на любой вакансии — и она появится тут.</div>
        </div>
      ) : (
        <div className="col gap-12">
          {saved.map(j => (
            <JobCard key={j.id} job={j} saved
              onSave={()=>onSave(j.id)}
              onOpen={()=>onOpenJob(j)} />
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { HomePage, SearchPage, ProfilePage, SavedPage });
