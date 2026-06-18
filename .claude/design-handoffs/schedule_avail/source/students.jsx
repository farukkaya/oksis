/* OKSİS — Öğrenciler (Students) screen */
const { useState: useStateS, useMemo: useMemoS } = React;
const StuPageTop = window.PageTop;

/* ── Sample dataset ── [ad, soyad, cinsiyet, sınıf, veli, tel, devamsızlık, ortalama, durum, kayıt] */
const STU_RAW = [
  ['Elif','Kaya','K','8-A','Zeynep Kaya','0532 414 22 18',2,92,'Aktif','12.09.2022'],
  ['Deniz','Aksoy','E','5-B','Murat Aksoy','0533 201 55 09',0,88,'Aktif','08.09.2025'],
  ['Yusuf','Demir','E','8-B','Hakan Demir','0542 778 31 64',5,74,'Aktif','15.09.2021'],
  ['Zeynep','Çelik','K','7-A','Aslı Çelik','0535 660 19 23',1,95,'Aktif','10.09.2023'],
  ['Mert','Yıldız','E','7-B','Selim Yıldız','0532 990 47 11',7,61,'Aktif','11.09.2023'],
  ['Ada','Şahin','K','6-A','Pınar Şahin','0505 332 88 70',0,90,'Aktif','09.09.2024'],
  ['Emir','Koç','E','8-A','Volkan Koç','0544 121 09 56',3,83,'Aktif','12.09.2022'],
  ['Defne','Arslan','K','6-B','Ebru Arslan','0533 754 60 12',1,87,'Aktif','09.09.2024'],
  ['Kerem','Doğan','E','5-A','Onur Doğan','0532 408 73 39',2,79,'Aktif','08.09.2025'],
  ['Ela','Yılmaz','K','7-A','Derya Yılmaz','0506 219 44 81',0,94,'Aktif','10.09.2023'],
  ['Ömer','Aydın','E','8-B','Cem Aydın','0535 877 26 04',6,68,'Pasif','15.09.2021'],
  ['Nehir','Kurt','K','6-A','Gül Kurt','0542 330 91 27',1,86,'Aktif','09.09.2024'],
  ['Berk','Öztürk','E','7-B','Tolga Öztürk','0532 145 78 60',4,72,'Aktif','11.09.2023'],
  ['Ceren','Aslan','K','8-A','Sibel Aslan','0533 902 14 38',0,96,'Aktif','12.09.2022'],
  ['Arda','Polat','E','5-B','Kaan Polat','0544 671 23 95',3,80,'Aktif','08.09.2025'],
  ['Naz','Erdoğan','K','6-B','Yasemin Erdoğan','0505 488 17 52',2,85,'Aktif','09.09.2024'],
  ['Efe','Korkmaz','E','7-A','Barış Korkmaz','0532 256 09 73',8,58,'Aktif','10.09.2023'],
  ['İrem','Acar','K','8-B','Funda Acar','0535 713 64 29',1,91,'Aktif','15.09.2021'],
  ['Kaan','Şimşek','E','6-A','Emre Şimşek','0542 119 80 46',0,89,'Aktif','09.09.2024'],
  ['Lara','Bulut','K','5-A','Ceyda Bulut','0506 374 55 18',2,82,'Aktif','08.09.2025'],
  ['Tarık','Güneş','E','7-B','Serkan Güneş','0533 640 27 91',5,70,'Aktif','11.09.2023'],
  ['Melis','Aktaş','K','8-A','Nalan Aktaş','0532 905 38 14',0,93,'Aktif','12.09.2022'],
  ['Burak','Çetin','E','6-B','Levent Çetin','0544 217 66 03',4,76,'Aktif','09.09.2024'],
  ['Sena','Yavuz','K','7-A','Hande Yavuz','0535 481 92 57',1,88,'Aktif','10.09.2023'],
  ['Doruk','Eren','E','5-B','Tunç Eren','0505 660 31 28',3,77,'Aktif','08.09.2025'],
  ['Ayşe','Tekin','K','8-B','Meral Tekin','0532 738 14 60',6,64,'Pasif','15.09.2021'],
  ['Can','Özdemir','E','6-A','Ufuk Özdemir','0542 503 87 19',0,90,'Aktif','09.09.2024'],
  ['Duru','Sönmez','K','7-B','Esra Sönmez','0533 192 45 76',2,84,'Aktif','11.09.2023'],
  ['Ege','Avcı','E','8-A','Burak Avcı','0544 826 50 31',1,87,'Aktif','12.09.2022'],
  ['Nil','Karaca','K','5-A','Şule Karaca','0506 437 29 80',0,92,'Aktif','08.09.2025'],
];
const STUDENTS = STU_RAW.map((r, i) => ({
  id: i + 1,
  no: '2025' + String(1043 + i * 7).padStart(4, '0'),
  ad: r[0], soyad: r[1], gender: r[2], cls: r[3],
  veli: r[4], tel: r[5], dev: r[6], avg: r[7], durum: r[8], kayit: r[9],
  initials: (r[0][0] + r[1][0]).toUpperCase(),
}));

const gradeTone = (a) => (a >= 85 ? 'success' : a >= 70 ? 'warning' : 'danger');
const attTone = (d) => (d <= 2 ? 'success' : d <= 5 ? 'warning' : 'danger');
const avClass = (id) => 'av-' + ((id % 6) + 1);
const CLASS_OPTIONS = [...new Set(STUDENTS.map((s) => s.cls))].sort();
const SEnrollModal = window.EnrollStudentModal;
const SAssignClass = window.AssignClassModal;
const SLinkGuardian = window.LinkGuardianModal;

/* ── KPI strip ── */
function KpiStrip() {
  const kpis = [
    { icon: 'graduation-cap', v: '1.248', l: 'Toplam Öğrenci' },
    { icon: 'check-circle', v: '1.232', l: 'Aktif', tone: 'success' },
    { icon: 'user', v: '24', l: 'Bu Ay Yeni Kayıt' },
    { icon: 'alert-triangle', v: '18', l: 'Devamsızlık Riski', tone: 'warning' },
  ];
  return (
    <div className="kpi-row">
      {kpis.map((k, i) => (
        <div className="kpi" key={i}>
          <div className={'kpi-ico' + (k.tone ? ' ' + k.tone : '')}><Icon name={k.icon} size={20} /></div>
          <div className="kpi-body"><div className="v">{k.v}</div><div className="l">{k.l}</div></div>
        </div>
      ))}
    </div>
  );
}

/* ── Checkbox ── */
function Check({ on, indeterminate }) {
  return (
    <span className={'ckbox' + (on || indeterminate ? ' on' : '')}>
      <Icon name={indeterminate ? 'more-horizontal' : 'check'} size={13} strokeWidth={3} />
    </span>
  );
}

/* ── Filter dropdown ── */
function Filter({ icon, label, value, options, onChange }) {
  return (
    <label className={'flt' + (value ? ' on' : '')}>
      <Icon name={icon} size={16} />
      <span>{value || label}</span>
      <Icon name="chevron-down" size={14} className="cv" />
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{label} (tümü)</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

/* ── Guardian synthesis — Veliler ekranı YOK, ilişki ağı burada yaşar (§4.7) ──
   İlişki çoka-çok; tip (anne/baba/vasi) + birincil mi bilgisi taşır. */
function studentGuardians(s) {
  const list = [{
    name: s.veli, rel: s.gender === 'K' ? 'Anne' : 'Baba', primary: true,
    phone: s.tel, initials: s.veli.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
  }];
  /* bazı öğrencilerde ikinci veli (çoka-çok örneği) */
  if (s.id % 3 === 0) {
    const second = s.gender === 'K' ? 'Baba' : 'Anne';
    const surname = s.veli.split(' ').slice(-1)[0];
    const fname = second === 'Anne' ? 'Gülşen' : 'Orhan';
    list.push({ name: fname + ' ' + surname, rel: second, primary: false, phone: '05' + (30 + s.id % 9) + ' ' + (200 + s.id).toString().slice(0,3) + ' ' + (10 + s.id % 80).toString().padStart(2,'0') + ' ' + (s.id % 90).toString().padStart(2,'0'), initials: (fname[0] + surname[0]).toUpperCase() });
  }
  return list;
}

/* ── Drawer — Genel · Veliler · Akademik · Devamsızlık · Kayıt Geçmişi · Belgeler · Hesap (§4.6) ── */
function StudentDrawer({ s, onClose, onNavigate, onAction }) {
  const [tab, setTab] = useStateS('genel');
  const tabs = [['genel','Genel'],['veliler','Veliler'],['akademik','Akademik'],['dev','Devamsızlık'],['gecmis','Kayıt Geçmişi'],['belge','Belgeler'],['hesap','Hesap']];
  const guardians = studentGuardians(s);
  const seviye = parseInt(s.cls) <= 4 ? 'İlkokul' : parseInt(s.cls) <= 8 ? 'Ortaokul' : 'Lise';
  const enrollYear = parseInt(s.kayit.split('.')[2]);
  const seasons = [];
  for (let y = 2025; y >= enrollYear; y--) {
    const gradeNow = parseInt(s.cls);
    const g = gradeNow - (2025 - y);
    const sec = s.cls.split('-')[1] || 'A';
    if (g >= 1) seasons.push([y + '–' + (y + 1), g + '-' + sec + (y === 2025 ? ' · aktif' : '')]);
  }
  return (
    <React.Fragment>
      <div className="drawer-scrim" onClick={onClose}></div>
      <aside className="drawer wide" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <button className="drawer-close" onClick={onClose} aria-label="Kapat"><Icon name="x" size={18} /></button>
          <div className="drawer-id">
            <div className="drawer-av">{s.initials}</div>
            <div className="di">
              <div className="nm">{s.ad} {s.soyad}</div>
              <div className="no">No: {s.no} · {s.cls}</div>
              <span className={'badge ' + (s.durum === 'Aktif' ? 'success' : 'muted')}>{s.durum}</span>
            </div>
          </div>
        </div>

        <div className="drawer-tabs scroll">
          {tabs.map(([k, l]) => (
            <button key={k} className={'drawer-tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        <div className="drawer-body">
          {tab === 'genel' && (
            <React.Fragment>
              {guardians.length === 0 && (
                <div className="drawer-note amber"><Icon name="alert-triangle" size={15} /><span>Veli eksik — bu öğrenciye henüz veli bağlanmamış.</span></div>
              )}
              <div className="facts">
                <div className="fact"><div className="l">Sınıf / Şube</div><div className="v">{s.cls}</div></div>
                <div className="fact"><div className="l">Kademe</div><div className="v">{seviye}</div></div>
                <div className="fact"><div className="l">Cinsiyet</div><div className="v">{s.gender === 'K' ? 'Kız' : 'Erkek'}</div></div>
                <div className="fact"><div className="l">Öğrenci No</div><div className="v">{s.no}</div></div>
                <div className="fact"><div className="l">Genel Ortalama</div><div className="v" style={{ color: 'var(--' + gradeTone(s.avg) + ')' }}>{s.avg}</div></div>
                <div className="fact"><div className="l">Devamsızlık</div><div className="v">{s.dev} gün</div></div>
                <div className="fact full"><div className="l">Kesin Kayıt</div><div className="v">{s.kayit}</div></div>
              </div>
            </React.Fragment>
          )}

          {tab === 'veliler' && (
            <React.Fragment>
              <div className="drawer-note"><Icon name="users-round" size={15} /><span>Ayrı veli ekranı yoktur — veli ilişki ağı burada yaşar. İlişki <b>çoka-çok</b>: kardeşler aynı veliyi paylaşabilir.</span></div>
              <div className="assign-head"><h4>Bağlı Veliler ({guardians.length})</h4><button className="mini-add" onClick={() => onAction({ type: 'guardian', s })}><Icon name="user-plus" size={14} /> Veli Ekle</button></div>
              <div className="guardian-list">
                {guardians.map((g, i) => (
                  <div className="guardian-row" key={i}>
                    <span className={'guardian-av ' + avClass(s.id + i + 1)}>{g.initials}</span>
                    <div className="gr-body">
                      <div className="gr-top"><span className="gr-name">{g.name}</span>{g.primary && <span className="primary-tag"><Icon name="star" size={11} /> Birincil</span>}</div>
                      <div className="gr-meta">{g.rel} · {g.phone}</div>
                    </div>
                    <button className="ar-x" title="Veli ilişkisini kaldır"><Icon name="unlink" size={15} /></button>
                  </div>
                ))}
              </div>
              <p className="acct-hint">Veli ekleme akışı önce mevcut velilerde arar (kardeş kayıtlıysa bağlar); yoksa yeni veli + arka planda hesap/davet açar.</p>
            </React.Fragment>
          )}

          {tab === 'akademik' && (
            <React.Fragment>
              <div className="ro-banner"><Icon name="file-text" size={16} /> Salt-okunur · Notlar & Karne modülünden</div>
              <div className="mini-card" style={{ marginTop: 14 }}>
                <h4>Ders Ortalamaları</h4>
                {['Matematik', 'Türkçe', 'Fen Bilimleri', 'İngilizce'].map((d, i) => {
                  const v = Math.max(45, Math.min(100, s.avg + [4, 1, -8, 6][i]));
                  return <div className="mini-stat-row" key={d}><span className="l">{d}</span><span className="v" style={{ color: 'var(--' + gradeTone(v) + ')' }}>{v}</span></div>;
                })}
              </div>
            </React.Fragment>
          )}

          {tab === 'dev' && (
            <React.Fragment>
              <div className="ro-banner"><Icon name="clipboard-check" size={16} /> Salt-okunur · Devamsızlık modülünden</div>
              <div className="mini-card" style={{ marginTop: 14 }}>
                <h4>Bu Dönem Devamsızlık · {s.dev} gün</h4>
                <div className="mini-stat-row"><span className="l">Özürlü</span><span className="v">{Math.max(0, s.dev - 1)} gün</span></div>
                <div className="mini-stat-row"><span className="l">Özürsüz</span><span className="v">{Math.min(1, s.dev)} gün</span></div>
                <div className="mini-stat-row"><span className="l">Geç giriş</span><span className="v">{s.id % 3} kez</span></div>
              </div>
            </React.Fragment>
          )}

          {tab === 'gecmis' && (
            <React.Fragment>
              <div className="drawer-note"><Icon name="history" size={15} /><span>Öğrenci ≠ Kayıt. Her sezon ayrı bir <b>Enrollment</b> kaydıdır; kişi değişmeden sınıf ilerler.</span></div>
              <div className="hist-list">
                {seasons.map(([yr, cls], i) => (
                  <div className="hist-row" key={i}>
                    <div className="hist-dot" style={i > 0 ? { background: 'var(--text-faint)', boxShadow: '0 0 0 4px var(--surface)' } : {}}></div>
                    <div className="hist-body"><div className="hs">{yr}</div><div className="hd">{cls}</div></div>
                  </div>
                ))}
              </div>
            </React.Fragment>
          )}

          {tab === 'belge' && (
            <div className="doc-list">
              {[['Nüfus Cüzdanı','PDF · 420 KB'],['Sağlık Raporu','PDF · 1.1 MB'],['Önceki Okul Belgesi','PDF · 680 KB']].map(([n, m], i) => (
                <div className="doc-row" key={i}>
                  <div className="doc-ico"><Icon name="file-text" size={18} /></div>
                  <div className="doc-body"><div className="dn">{n}</div><div className="dm">{m}</div></div>
                  <button className="doc-dl"><Icon name="arrow-down-right" size={15} /></button>
                </div>
              ))}
              <button className="mini-add" style={{ marginTop: 6 }}><Icon name="plus" size={14} /> Belge Ekle</button>
            </div>
          )}

          {tab === 'hesap' && (
            <div className="acct-card">
              <div className="acct-row"><div className="l">Kullanıcı Adı</div><div className="v">{s.no}</div></div>
              <div className="acct-row"><div className="l">Durum</div><div className="v"><span className="badge success">Aktif</span></div></div>
              <div className="acct-row"><div className="l">Son Giriş</div><div className="v">Bugün · 08:35</div></div>
              <button className="link-btn full" onClick={() => { onClose(); onNavigate && onNavigate('users'); }}><Icon name="arrow-up-right" size={15} /> Kullanıcılar'da yönet</button>
              <p className="acct-hint">Öğrenci girişi kullanıcı adı = öğrenci no, ilk girişte zorunlu şifre değişimi. Giriş/şifre/güvenlik Kullanıcılar ekranında yönetilir.</p>
            </div>
          )}
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={() => onAction({ type: 'class', s })}><Icon name="grid" size={17} /> Sınıf Ata</button>
          <button className="btn btn-ghost" onClick={() => onAction({ type: 'guardian', s })}><Icon name="user-plus" size={17} /> Veli Bağla</button>
          <button className="btn btn-primary"><Icon name="pencil" size={17} /> Düzenle</button>
        </div>
      </aside>
    </React.Fragment>
  );
}

/* ── Loading skeleton rows ── */
function SkeletonRows() {
  return (
    <tbody>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr className="skel-row" key={i}>
          <td className="col-check"><span className="skel" style={{ width: 18, height: 18, borderRadius: 5, display: 'block' }}></span></td>
          <td><div style={{ display: 'flex', gap: 11, alignItems: 'center' }}><span className="skel skel-av"></span><div style={{ flex: 1 }}><div className="skel skel-line" style={{ width: '60%', marginBottom: 6 }}></div><div className="skel skel-line" style={{ width: '35%', height: 9 }}></div></div></div></td>
          <td><div className="skel skel-line" style={{ width: 44 }}></div></td>
          <td><div className="skel skel-line" style={{ width: '70%' }}></div></td>
          <td><div className="skel skel-line" style={{ width: 52 }}></div></td>
          <td><div className="skel skel-line" style={{ width: 32 }}></div></td>
          <td><div className="skel skel-line" style={{ width: 56 }}></div></td>
          <td><div className="skel skel-line" style={{ width: 72 }}></div></td>
        </tr>
      ))}
    </tbody>
  );
}

/* ── Main screen ── */
function StudentsScreen({ role, t, onNavigate }) {
  const [q, setQ] = useStateS('');
  const [fCls, setFCls] = useStateS('');
  const [fDurum, setFDurum] = useStateS('');
  const [fCins, setFCins] = useStateS('');
  const [view, setView] = useStateS('table');
  const [sort, setSort] = useStateS({ key: 'ad', dir: 'asc' });
  const [selected, setSelected] = useStateS(() => new Set());
  const [pageIdx, setPageIdx] = useStateS(0);
  const [drawer, setDrawer] = useStateS(null);
  const [modal, setModal] = useStateS(null);
  const pageSize = view === 'table' ? 8 : 9;

  const stateMap = { 'yükleniyor': 'loading', 'boş': 'empty', 'hata': 'error' };
  const forced = stateMap[t.studentState];

  const filtered = useMemoS(() => {
    let list = STUDENTS.filter((s) => {
      if (fCls && s.cls !== fCls) return false;
      if (fDurum && s.durum !== fDurum) return false;
      if (fCins && (s.gender === 'K' ? 'Kız' : 'Erkek') !== fCins) return false;
      if (q) {
        const hay = (s.ad + ' ' + s.soyad + ' ' + s.no + ' ' + s.veli).toLocaleLowerCase('tr');
        if (!hay.includes(q.toLocaleLowerCase('tr'))) return false;
      }
      return true;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      let x = a[sort.key], y = b[sort.key];
      if (sort.key === 'ad') { x = a.ad + a.soyad; y = b.ad + b.soyad; }
      if (typeof x === 'number') return (x - y) * dir;
      return String(x).localeCompare(String(y), 'tr') * dir;
    });
    return list;
  }, [q, fCls, fDurum, fCins, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageClamped = Math.min(pageIdx, totalPages - 1);
  const pageItems = filtered.slice(pageClamped * pageSize, pageClamped * pageSize + pageSize);

  const activeFilters = [
    fCls && { k: 'cls', label: 'Sınıf: ' + fCls, clear: () => setFCls('') },
    fDurum && { k: 'durum', label: 'Durum: ' + fDurum, clear: () => setFDurum('') },
    fCins && { k: 'cins', label: fCins, clear: () => setFCins('') },
  ].filter(Boolean);

  function resetPage(fn) { return (v) => { fn(v); setPageIdx(0); }; }
  function clearAll() { setFCls(''); setFDurum(''); setFCins(''); setQ(''); setPageIdx(0); }

  function toggleSel(id) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  const pageIds = pageItems.map((s) => s.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id)) && !allOnPage;
  function toggleAll() {
    setSelected((prev) => {
      const n = new Set(prev);
      if (allOnPage) pageIds.forEach((id) => n.delete(id));
      else pageIds.forEach((id) => n.add(id));
      return n;
    });
  }

  function sortBy(key) {
    setSort((s) => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  }
  const Th = ({ k, children, cls }) => (
    <th className={'sortable ' + (cls || '') + (sort.key === k ? ' sorted' : '')} onClick={() => sortBy(k)}>
      {children}<Icon name="chevron-down" size={13} className="sort-ico" style={{ transform: sort.key === k && sort.dir === 'asc' ? 'rotate(180deg)' : 'none' }} />
    </th>
  );

  const isEmpty = forced === 'empty' || (forced !== 'loading' && filtered.length === 0);

  return (
    <div className="stu">
      <StuPageTop
        crumbs={[{ label: 'Okul' }, { label: 'Öğrenciler' }]}
        title="Öğrenciler"
        sub="1.248 aktif öğrenci · 2025–2026 eğitim-öğretim yılı"
        actions={<React.Fragment>
          <button className="btn btn-ghost"><Icon name="file-text" size={17} /> Dışa Aktar</button>
          <button className="btn btn-primary" onClick={() => setModal({ type: 'enroll' })}><Icon name="plus" size={18} strokeWidth={2.2} /> Yeni Öğrenci</button>
        </React.Fragment>}
      />
      <div className="stu-inner">
        <KpiStrip />

        {/* Toolbar */}
        <div className="stu-toolbar">
          <label className="stu-search">
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => resetPage(setQ)(e.target.value)} placeholder="Ad, öğrenci no veya veli ara…" />
          </label>
          <Filter icon="grid" label="Sınıf" value={fCls} options={CLASS_OPTIONS} onChange={resetPage(setFCls)} />
          <Filter icon="check-circle" label="Durum" value={fDurum} options={['Aktif', 'Pasif', 'Mezun']} onChange={resetPage(setFDurum)} />
          <Filter icon="user" label="Cinsiyet" value={fCins} options={['Kız', 'Erkek']} onChange={resetPage(setFCins)} />
          <div className="tb-spacer"></div>
          <div className="tb-right">
            <div className="view-toggle">
              <button className={view === 'table' ? 'on' : ''} onClick={() => setView('table')}><Icon name="list-checks" size={16} /> Tablo</button>
              <button className={view === 'cards' ? 'on' : ''} onClick={() => setView('cards')}><Icon name="grid" size={16} /> Kart</button>
            </div>
            <button className="tb-icon-btn" title="Kolon ayarları"><Icon name="sliders" size={18} /></button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="filter-chips">
            <span className="lbl">Filtreler:</span>
            {activeFilters.map((f) => (
              <span className="fchip" key={f.k}>{f.label}<button onClick={f.clear} aria-label="Kaldır"><Icon name="x" size={13} /></button></span>
            ))}
            <button className="fchip-clear" onClick={clearAll}>Tümünü temizle</button>
          </div>
        )}

        {/* Selection bar */}
        {selected.size > 0 && (
          <div className="sel-bar">
            <span className="cnt"><span className="n">{selected.size}</span> öğrenci seçildi</span>
            <div className="sb-spacer"></div>
            <button className="sel-act" onClick={() => setModal({ type: 'class', s: { ...pageItems[0], ad: 'Toplu', soyad: selected.size + ' öğrenci', no: selected.size + ' kayıt', cls: '—' } })}><Icon name="grid" size={16} /> Sınıf Ata</button>
            <button className="sel-act"><Icon name="bell" size={16} /> Bildirim Gönder</button>
            <button className="sel-act"><Icon name="file-text" size={16} /> Dışa Aktar</button>
            <button className="sel-act danger"><Icon name="x" size={16} /> Pasifleştir</button>
            <button className="sel-clear" onClick={() => setSelected(new Set())}>Seçimi temizle</button>
          </div>
        )}

        {/* Content */}
        {forced === 'error' ? (
          <div className="stu-card-wrap">
            <div className="stu-state err">
              <div className="se-ico"><Icon name="alert-triangle" size={28} /></div>
              <h3>Liste yüklenemedi</h3>
              <p>Öğrenci verisi alınırken bir sorun oluştu. Lütfen tekrar deneyin.</p>
              <button className="btn btn-primary"><Icon name="activity" size={17} /> Tekrar Dene</button>
            </div>
          </div>
        ) : view === 'table' ? (
          <div className="stu-card-wrap">
            <table className="stu-tbl">
              <thead>
                <tr>
                  <th className="col-check"><span onClick={toggleAll} style={{ cursor: 'pointer', display: 'inline-flex' }}><Check on={allOnPage} indeterminate={someOnPage} /></span></th>
                  <Th k="ad">Öğrenci</Th>
                  <Th k="cls">Sınıf</Th>
                  <th>Veli</th>
                  <Th k="dev">Devamsızlık</Th>
                  <Th k="avg">Ortalama</Th>
                  <Th k="durum">Durum</Th>
                  <Th k="kayit" cls="col-reg">Kayıt</Th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              {forced === 'loading' ? <SkeletonRows /> : isEmpty ? null : (
                <tbody>
                  {pageItems.map((s) => (
                    <tr key={s.id} className={selected.has(s.id) ? 'sel' : ''} onClick={() => setDrawer(s)}>
                      <td className="col-check" onClick={(e) => { e.stopPropagation(); toggleSel(s.id); }}><Check on={selected.has(s.id)} /></td>
                      <td>
                        <div className="stu-cell">
                          <span className={'stu-av ' + avClass(s.id)}>{s.initials}</span>
                          <div><div className="nm">{s.ad} {s.soyad}</div><div className="no">No: {s.no}</div></div>
                        </div>
                      </td>
                      <td><span className="cls-chip">{s.cls}</span></td>
                      <td className="parent-cell"><div className="pn">{s.veli}</div><div className="pp">{s.tel}</div></td>
                      <td><span className={'badge ' + attTone(s.dev)}>{s.dev} gün</span></td>
                      <td><span className={'grade ' + gradeTone(s.avg)}>{s.avg}</span></td>
                      <td><span className={'badge ' + (s.durum === 'Aktif' ? 'success' : 'muted')}>{s.durum}</span></td>
                      <td className="num col-reg">{s.kayit}</td>
                      <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                        <div className="row-actions">
                          <button className="ra-btn" title="Görüntüle" onClick={() => setDrawer(s)}><Icon name="maximize" size={16} /></button>
                          <button className="ra-btn" title="Düzenle"><Icon name="pencil" size={16} /></button>
                          <button className="ra-btn" title="Daha fazla"><Icon name="more-horizontal" size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>

            {isEmpty && forced !== 'loading' && (
              <div className="stu-state">
                <div className="se-ico"><Icon name="search" size={28} /></div>
                <h3>Sonuç bulunamadı</h3>
                <p>Arama veya filtre kriterlerine uyan öğrenci yok. Filtreleri temizleyip tekrar deneyin.</p>
                <button className="btn btn-ghost" onClick={clearAll}><Icon name="x" size={16} /> Filtreleri Temizle</button>
              </div>
            )}

            {!isEmpty && forced !== 'loading' && (
              <Pager page={pageClamped} totalPages={totalPages} count={filtered.length} pageSize={pageSize} onPage={setPageIdx} />
            )}
          </div>
        ) : (
          /* Cards view */
          isEmpty ? (
            <div className="stu-card-wrap"><div className="stu-state"><div className="se-ico"><Icon name="search" size={28} /></div><h3>Sonuç bulunamadı</h3><p>Arama veya filtre kriterlerine uyan öğrenci yok.</p><button className="btn btn-ghost" onClick={clearAll}><Icon name="x" size={16} /> Filtreleri Temizle</button></div></div>
          ) : (
            <React.Fragment>
              <div className="stu-cards">
                {pageItems.map((s) => (
                  <div key={s.id} className={'scard' + (selected.has(s.id) ? ' sel' : '')} onClick={() => setDrawer(s)}>
                    <span className="scard-check" onClick={(e) => { e.stopPropagation(); toggleSel(s.id); }}><Check on={selected.has(s.id)} /></span>
                    <div className="scard-top">
                      <span className={'stu-av ' + avClass(s.id)}>{s.initials}</span>
                      <div className="scard-id"><div className="nm">{s.ad} {s.soyad}</div><div className="no">No: {s.no}</div></div>
                    </div>
                    <div className="scard-meta">
                      <span className="cls-chip">{s.cls}</span>
                      <span className={'badge ' + (s.durum === 'Aktif' ? 'success' : 'muted')}>{s.durum}</span>
                    </div>
                    <div className="scard-stats">
                      <div className="scard-stat"><div className="l">Ortalama</div><div className="v" style={{ color: 'var(--' + gradeTone(s.avg) + ')' }}>{s.avg}</div></div>
                      <div className="scard-stat"><div className="l">Devamsızlık</div><div className="v" style={{ color: 'var(--' + attTone(s.dev) + ')' }}>{s.dev} gün</div></div>
                    </div>
                    <div className="scard-foot"><span className="pn"><b>Veli:</b> {s.veli}</span><Icon name="chevron-right" size={16} style={{ color: 'var(--text-faint)' }} /></div>
                  </div>
                ))}
              </div>
              <div className="stu-card-wrap" style={{ marginTop: 14 }}>
                <Pager page={pageClamped} totalPages={totalPages} count={filtered.length} pageSize={pageSize} onPage={setPageIdx} />
              </div>
            </React.Fragment>
          )
        )}
      </div>

      {drawer && <StudentDrawer s={drawer} onClose={() => setDrawer(null)} onNavigate={onNavigate} onAction={(a) => { setDrawer(null); setModal(a); }} />}

      {modal && modal.type === 'enroll' && <SEnrollModal onClose={() => setModal(null)} />}
      {modal && modal.type === 'class' && <SAssignClass s={modal.s} onClose={() => setModal(null)} />}
      {modal && modal.type === 'guardian' && <SLinkGuardian s={modal.s} onClose={() => setModal(null)} />}
    </div>
  );
}

function Pager({ page, totalPages, count, pageSize, onPage, noun }) {
  const from = count === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(count, (page + 1) * pageSize);
  const pages = Array.from({ length: totalPages }, (_, i) => i).slice(Math.max(0, page - 2), Math.max(0, page - 2) + 5);
  return (
    <div className="pager">
      <span className="info"><b>{from}–{to}</b> / {count} {noun || 'öğrenci'}</span>
      <div className="pg-spacer"></div>
      <span className="psize">Sayfa başına {pageSize}</span>
      <div className="pg-nav">
        <button className="pg-btn" disabled={page === 0} onClick={() => onPage(page - 1)}><Icon name="chevron-right" size={15} style={{ transform: 'rotate(180deg)' }} /></button>
        {pages.map((p) => <button key={p} className={'pg-btn' + (p === page ? ' on' : '')} onClick={() => onPage(p)}>{p + 1}</button>)}
        <button className="pg-btn" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}><Icon name="chevron-right" size={15} /></button>
      </div>
    </div>
  );
}

Object.assign(window, { StudentsScreen, StuFilter: Filter, StuCheck: Check, StuPager: Pager, stuAvClass: avClass });
