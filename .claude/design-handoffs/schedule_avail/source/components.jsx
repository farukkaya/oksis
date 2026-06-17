/* OKSİS — Shell components (Sidebar, Topbar, Content) + dashboard widgets */
const { useState, useRef, useEffect } = React;

/* ───────────── STANDART ÜST BAĞLAM BARI (clx-top deseni) ─────────────
   Tüm ekranlar bu deseni kullanır: solda breadcrumb + başlık, sağda
   ekrana özgü özet sayaçlar (summary) ve aksiyon butonları (actions).
   crumbs: [{label, onClick?}], summary: [{v, l, dot?}], actions/mid: JSX */
function PageTop({ crumbs, title, sub, summary, actions, mid }) {
  /* yüksekliğini ekran köküne --pt-h olarak yazar — sayfa içi yapışkan
     öğeler (tablo başlıkları vb.) sticky başlığın altından hizalanır */
  const ptRef = useRef(null);
  useEffect(() => {
    const el = ptRef.current;
    if (!el || !el.parentElement) return;
    const parent = el.parentElement;
    const apply = () => parent.style.setProperty('--pt-h', el.offsetHeight + 'px');
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => { ro.disconnect(); parent.style.removeProperty('--pt-h'); };
  }, []);
  return (
    <div ref={ptRef} className="clx-top page-top">
      <div className="clx-top-id">
        <div className="breadcrumb">
          {(crumbs || []).map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Icon name="chevron-right" size={13} className="sep" />}
              {c.onClick ? <button className="bc-link" onClick={c.onClick}>{c.label}</button> : <span>{c.label}</span>}
            </React.Fragment>
          ))}
        </div>
        <h1>{title}</h1>
        {sub && <div className="pt-sub">{sub}</div>}
      </div>
      {mid}
      <div className="clx-spacer"></div>
      {summary && summary.length > 0 && (
        <div className="clx-summary">
          {summary.map((s, i) => (
            <div className="clx-sum" key={i}>
              <div className="v">{s.dot && <span className="occ-dot" style={{ background: s.dot }}></span>}{s.v}</div>
              <div className="l">{s.l}</div>
            </div>
          ))}
        </div>
      )}
      {actions && <div className="clx-actions">{actions}</div>}
    </div>
  );
}

/* ───────────────────────── SIDEBAR ───────────────────────── */
function Sidebar({ role, collapsed, onToggle, currentPage, onNavigate, onLogout, hideSoon }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="portal-chip">
          <span className="portal-dot"></span>
          <span className="portal-chip-text">
            <span className="k">Portal</span>
            <span className="v">{role.portalLabel}</span>
          </span>
        </div>
        <button className="collapse-btn" onClick={onToggle} title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'} aria-label="Menüyü daralt/genişlet">
          <Icon name="chevrons-left" size={19} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {role.nav.map((group, gi) => (
          <div className="nav-group" key={gi}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map((it, ii) => {
              if (it.soon) {
                if (hideSoon) return null;
                return (
                  <button key={ii} className="nav-item soon" data-tip={it.label + ' · Yakında'} aria-disabled="true">
                    <Icon name={it.icon} size={20} className="nav-ico" strokeWidth={2} />
                    <span className="nav-text">{it.label}</span>
                    <span className="nav-soon">Yakında</span>
                  </button>
                );
              }
              const isActive = it.page ? it.page === currentPage : false;
              return (
                <button
                  key={ii}
                  className={'nav-item' + (isActive ? ' active' : '')}
                  data-tip={it.label}
                  onClick={() => it.page && onNavigate(it.page)}
                >
                  <Icon name={it.icon} size={20} className="nav-ico" strokeWidth={isActive ? 2.2 : 2} />
                  <span className="nav-text">{it.label}</span>
                  {it.badge && <span className="nav-badge">{it.badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <button className="nav-item" data-tip="Yardım & Destek">
          <Icon name="help-circle" size={20} className="nav-ico" />
          <span className="nav-text">Yardım & Destek</span>
        </button>
        <button className="nav-item" data-tip="Çıkış Yap" onClick={onLogout}>
          <Icon name="log-out" size={20} className="nav-ico" />
          <span className="nav-text">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}

/* ───────────────────── USER MENU (topbar dropdown) ───────────────────── */
function UserMenu({ role, currentPage, onNavigate, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const p = role.profile || {};
  const go = (page) => { setOpen(false); onNavigate(page); };

  return (
    <div className="user-menu-wrap" ref={wrapRef}>
      <button
        className={'user-chip' + (open ? ' open' : '')}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={'avatar' + (role.platform ? '' : ' accent')}>{role.user.initials}</span>
        <span className="user-meta">
          <span className="n">{role.user.name}</span>
          <span className="r">{role.user.title}</span>
        </span>
        <Icon name="chevron-down" size={16} className="user-caret" style={{ color: 'var(--text-faint)' }} />
      </button>

      {open && (
        <div className="user-menu" role="menu">
          <div className="um-head">
            <span className={'avatar lg' + (role.platform ? '' : ' accent')}>{role.user.initials}</span>
            <div className="um-id">
              <div className="n">{role.user.name}</div>
              <div className="e">{p.email || role.user.title}</div>
              <span className="um-role">{role.roleName || role.user.title}</span>
            </div>
          </div>

          <div className="um-sep"></div>

          <button className={'um-item' + (currentPage === 'profile' ? ' active' : '')} role="menuitem" onClick={() => go('profile')}>
            <Icon name="user" size={18} />
            <span>Profilim</span>
            <Icon name="chevron-right" size={15} className="um-chev" />
          </button>
          <button className="um-item" role="menuitem" onClick={() => go('profile')}>
            <Icon name="settings" size={18} />
            <span>Hesap Ayarları</span>
          </button>
          <button className="um-item" role="menuitem" onClick={() => setOpen(false)}>
            <Icon name="bell" size={18} />
            <span>Bildirim Tercihleri</span>
          </button>
          <button className="um-item" role="menuitem" onClick={() => setOpen(false)}>
            <Icon name="shield-check" size={18} />
            <span>Gizlilik & Güvenlik</span>
          </button>

          <div className="um-sep"></div>

          <button className="um-item danger" role="menuitem" onClick={() => { setOpen(false); onLogout(); }}>
            <Icon name="log-out" size={18} />
            <span>Çıkış Yap</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── TOPBAR ───────────────────────── */
function Topbar({ role, currentPage, onNavigate, onLogout, childCtx }) {
  return (
    <header className="topbar">
      <div className="brand-strip"></div>

      <div className="brand-lockup">
        <OksisMark size={38} idSuffix={'hdr-' + role.key} />
        <span className="wordmark">Oksis</span>
      </div>

      <div className="brand-div"></div>

      <div className="school-chip">
        <div className="school-logo">
          {role.platform
            ? <Icon name="grid" size={20} />
            : <image-slot id="oksis-school-logo" shape="rounded" placeholder="Okul logosu"></image-slot>}
        </div>
        <div className="school-text">
          <span className="n">{role.school.name}</span>
          <span className="s">{role.school.sub}</span>
        </div>
      </div>

      <label className="topbar-search">
        <Icon name="search" size={18} />
        <input placeholder="Ara — öğrenci, sınıf, sayfa…" />
        <span className="kbd">⌘K</span>
      </label>

      <div className="topbar-right">
        {role.key === 'parent' && childCtx && window.ChildSwitch && (
          <window.ChildSwitch childCtx={childCtx} onNavigate={onNavigate} />
        )}
        <div className="season-pill" title="Aktif dönem">
          <span className="dot"></span>
          <Icon name="calendar" size={15} />
          <span className="txt">{role.season}</span>
        </div>
        <button className="icon-btn" aria-label="Bildirimler">
          <Icon name="bell" size={20} />
          <span className="ping"></span>
        </button>
        <UserMenu role={role} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />
      </div>
    </header>
  );
}

/* ───────────────────────── WIDGETS ───────────────────────── */
function StatTile({ s }) {
  return (
    <div className="stat-tile">
      <div className="stat-top">
        <div className={'stat-ico' + (s.tone ? ' ' + s.tone : '')}>
          <Icon name={s.icon} size={21} />
        </div>
        {s.delta && (
          <span className={'delta ' + (s.dir || 'up')}>
            <Icon name={s.dir === 'down' ? 'arrow-down-right' : 'arrow-up-right'} size={13} strokeWidth={2.5} />
            {s.delta}
          </span>
        )}
      </div>
      <div>
        <div className="stat-val">{s.value}</div>
        <div className="stat-label">{s.label}</div>
      </div>
    </div>
  );
}

function CardHead({ title, meta, link, noLink }) {
  return (
    <div className="card-head">
      <h3>{title}</h3>
      {meta && <span className="meta">{meta}</span>}
      {!noLink && <a className="link">{link || 'Tümü'} <Icon name="chevron-right" size={15} /></a>}
    </div>
  );
}

function TableBlock({ b }) {
  return (
    <div className="card">
      <CardHead title={b.title} meta={b.meta} />
      <table className="tbl">
        <thead>
          <tr>{b.columns.map((c, i) => <th key={i}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {b.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className={ci > 0 && ci < row.length - 1 ? 'num' : ''}>
                  {cell && typeof cell === 'object'
                    ? <span className={'badge ' + cell.tone}>{cell.b}</span>
                    : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScheduleBlock({ b }) {
  return (
    <div className="card">
      <CardHead title={b.title} meta={b.meta} />
      <div className="sched">
        {b.items.map((it, i) => (
          <div className={'sched-row' + (it.now ? ' now' : '')} key={i}>
            <div className="sched-time">{it.time}</div>
            <div className={'sched-mark' + (it.done ? ' done-dot' : '')}></div>
            <div className="sched-body">
              <div className="t">{it.title}</div>
              <div className="s">{it.sub}</div>
            </div>
            {it.now && <span className="badge accent sched-stat">Şimdi</span>}
            {it.done && <span className="badge success sched-stat">Bitti</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ b }) {
  return (
    <div className="card">
      <CardHead title={b.title} meta={b.meta} />
      <div className="lst">
        {b.items.map((it, i) => {
          const isGrade = it.meta && /^\d+$/.test(String(it.meta));
          return (
            <div className="lst-row" key={i}>
              <div className={'lst-ico' + (it.tone ? ' ' + it.tone : '')}>
                <Icon name={it.icon} size={19} />
              </div>
              <div className="lst-body">
                <div className="t">{it.title}</div>
                <div className="s">{it.sub}</div>
              </div>
              {isGrade
                ? <span className={'lst-grade ' + (it.tone || 'success')}>{it.meta}</span>
                : <span className="lst-meta">{it.meta}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnnouncementsBlock({ b }) {
  return (
    <div className="card">
      <CardHead title={b.title} link="Tümü" />
      <div className="ann">
        {b.items.map((it, i) => (
          <div className="ann-row" key={i}>
            <div className={'ann-bar ' + (it.tone || 'muted')}></div>
            <div className="ann-body">
              <div className="t">{it.title}</div>
              <div className="s">{it.sub}</div>
            </div>
            <div className="ann-time">{it.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBlock({ b }) {
  return (
    <div className="card">
      <CardHead title={b.title} />
      <div className="prog">
        {b.items.map((it, i) => (
          <div className="prog-row" key={i}>
            <div className="prog-top">
              <span className="l">{it.label}</span>
              <span className="v">{it.value}</span>
            </div>
            <div className="prog-bar">
              <div className={'prog-fill ' + (it.tone || '')} style={{ width: it.value + '%' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Block({ b }) {
  switch (b.type) {
    case 'table': return <TableBlock b={b} />;
    case 'schedule': return <ScheduleBlock b={b} />;
    case 'list': return <ListBlock b={b} />;
    case 'announcements': return <AnnouncementsBlock b={b} />;
    case 'progress': return <ProgressBlock b={b} />;
    default: return null;
  }
}

/* ───────────────────────── PROFILE SCREEN ───────────────────────── */
function ProfileScreen({ role, onNavigate }) {
  const p = role.profile || {};
  const info = p.info || [];
  const account = [
    { icon: 'shield', label: 'Rol', value: role.roleName || role.user.title },
    { icon: 'mail', label: 'E-posta', value: p.email || '—' },
    { icon: 'contact', label: 'Telefon', value: p.phone || '—' },
    { icon: 'clock', label: 'Son Giriş', value: p.lastLogin || '—' },
  ];

  return (
    <div className="content">
      <PageTop
        crumbs={[{ label: role.portalLabel, onClick: () => onNavigate('dashboard') }, { label: 'Profilim' }]}
        title="Profilim"
        sub="Hesap bilgilerini görüntüle ve güncelle."
        actions={<React.Fragment>
          <button className="btn btn-ghost" onClick={() => onNavigate('dashboard')}><Icon name="chevron-left" size={18} strokeWidth={2.2} /> Panele Dön</button>
          <button className="btn btn-primary"><Icon name="pencil" size={17} strokeWidth={2.2} /> Profili Düzenle</button>
        </React.Fragment>}
      />
      <div className="content-inner" key={'profile-' + role.key}>
        <div className="profile-hero">
          <span className={'profile-av' + (role.platform ? '' : ' accent')}>{role.user.initials}</span>
          <div className="profile-id">
            <div className="ph-name">{role.user.name}</div>
            <div className="ph-role">{role.user.title}</div>
            <div className="ph-meta">
              <span><Icon name="building" size={14} /> {role.school.name}</span>
              <span className="d"></span>
              <span><Icon name="mail" size={14} /> {p.email}</span>
            </div>
          </div>
          <span className="profile-status"><span className="dot"></span> Aktif</span>
        </div>

        <div className="profile-grid">
          <div className="card">
            <CardHead title="Kişisel Bilgiler" noLink />
            <div className="info-rows">
              {info.map((it, i) => (
                <div className="info-row" key={i}>
                  <div className="info-ico"><Icon name={it.icon} size={18} /></div>
                  <div className="info-l">{it.label}</div>
                  <div className="info-v">{it.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-col">
            <div className="card">
              <CardHead title="Hesap & Erişim" noLink />
              <div className="info-rows">
                {account.map((it, i) => (
                  <div className="info-row" key={i}>
                    <div className="info-ico"><Icon name={it.icon} size={18} /></div>
                    <div className="info-l">{it.label}</div>
                    <div className="info-v">{it.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <CardHead title="Güvenlik" noLink />
              <div className="sec-rows">
                <div className="sec-row">
                  <div className="sec-ico"><Icon name="lock" size={18} /></div>
                  <div className="sec-body">
                    <div className="t">Parola</div>
                    <div className="s">90 gün önce güncellendi</div>
                  </div>
                  <button className="sec-act">Değiştir</button>
                </div>
                <div className="sec-row">
                  <div className="sec-ico"><Icon name="fingerprint" size={18} /></div>
                  <div className="sec-body">
                    <div className="t">İki Adımlı Doğrulama</div>
                    <div className="s">SMS ile koruma aktif</div>
                  </div>
                  <span className="badge success">Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── CONTENT ───────────────────────── */
function Content({ role, currentPage, t, onNavigate, childCtx }) {
  if (currentPage === 'students') {
    return <StudentsScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'classes') {
    return <ClassesScreenV2 role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'courses') {
    return <CoursesScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'assignments') {
    return <AssignmentsScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'schedule') {
    return <ScheduleScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'myschedule') {
    return <TeacherScheduleScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'studentSchedule') {
    return <StudentScheduleScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'parentSchedule') {
    return <ParentScheduleScreen role={role} t={t} onNavigate={onNavigate} childCtx={childCtx} />;
  }
  if (currentPage === 'requests') {
    return <TeacherRequestsScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'scheduleEditor') {
    return <ScheduleEditorScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'attendance') {
    return <AttendanceScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'grades') {
    return <GradesScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'teachers') {
    return <TeachersScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'parents') {
    return <ParentsScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'users') {
    return <UsersScreen role={role} onNavigate={onNavigate} />;
  }
  if (currentPage === 'calendar') {
    return <CalendarScreen role={role} onNavigate={onNavigate} />;
  }
  if (currentPage === 'season') {
    return <SeasonWizardScreen t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'announcements') {
    return <AnnouncementsScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'settings') {
    return <SettingsScreen role={role} t={t} onNavigate={onNavigate} />;
  }
  if (currentPage === 'profile') {
    return <ProfileScreen role={role} onNavigate={onNavigate} />;
  }
  return (
    <div className="content">
      <PageTop
        crumbs={[{ label: role.portalLabel }, { label: role.page.title }]}
        title={role.page.title}
        sub={role.page.subtitle}
        actions={<button className="btn btn-primary"><Icon name={role.page.action.icon} size={18} strokeWidth={2.2} /> {role.page.action.label}</button>}
      />
      <div className="content-inner" key={role.key}>
        {role.childPicker && (
          <div className="child-picker">
            <span className="ca">{role.childPicker.initials}</span>
            <div className="ct">
              <div className="n">{role.childPicker.name}</div>
              <div className="s">{role.childPicker.cls} · Atlas Koleji</div>
            </div>
            <button className="switch">Çocuk değiştir <Icon name="chevron-down" size={15} /></button>
          </div>
        )}

        <div className="stat-grid">
          {role.stats.map((s, i) => <StatTile s={s} key={i} />)}
        </div>

        <div className="dash">
          <div className="dash-col">
            <Block b={role.primary} />
          </div>
          <div className="dash-col">
            {role.side.map((b, i) => <Block b={b} key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── APP SHELL ───────────────────────── */
function AppShell({ role, collapsed, onToggle, t, currentPage, onNavigate, onLogout, childCtx }) {
  return (
    <div
      className={'oksis-app' + (collapsed ? ' collapsed' : '')}
      data-portal={role.key}
      data-density={t.density}
      data-search={String(t.showSearch)}
      data-strip={String(t.brandStrip)}
    >
      <Sidebar role={role} collapsed={collapsed} onToggle={onToggle} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} hideSoon={t.acaYakinda === 'gizle'} />
      <div className="main-col">
        <Topbar role={role} currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} childCtx={childCtx} />
        <Content role={role} currentPage={currentPage} t={t} onNavigate={onNavigate} childCtx={childCtx} />
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, UserMenu, ProfileScreen, Content, AppShell, StatTile, Block, PageTop });
