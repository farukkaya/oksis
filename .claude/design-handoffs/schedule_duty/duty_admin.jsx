/* OKSİS — Akademik · Ders Programı · NÖBET & VEKÂLET YÖNETİMİ (ADMIN)
   schedule_duty modülünün YÖNETİCİ/KOORDİNATÖR yüzeyi.
   schedule_avail (AvailabilityScreen) ile birebir aynı kalıp:
   PageTop → aca-tabs (3 sekme) → stu-inner. Üç sekme:
     · cizelge   — Nöbet Çizelgesi (bölge × gün ızgarası + yük/adalet + oto. dağıtım)
     · vekalet   — Vekâlet (Bugün) — bkz. duty_admin_more.jsx
     · politika  — Bölgeler & Politika — bkz. duty_admin_more.jsx
   NÖBET = gün + kat/bölge (ders-slotu DEĞİL); gözetim teneffüs/öğle pencerelerinde.
   YANCILIK = okul-bazlı parametre; açıksa öğle arası kısa gözetim devri gösterilir. */
const { useState: useStateDta, useMemo: useMemoDta, useEffect: useEffectDta } = React;

/* ════════════════ Sabitler & örnek veri (Atlas Koleji · Lise) ════════════════ */
const DTA_DAYS = [['Pzt', 'Pazartesi'], ['Sal', 'Salı'], ['Çar', 'Çarşamba'], ['Per', 'Perşembe'], ['Cum', 'Cuma']];
const DTA_TODAY = 1; /* Salı */

/* Öğretmen kadrosu (academicsBase ile tutarlı). muaf: nöbet dışı. */
const DTA_TEACHERS = [
  { id: 't01', ad: 'Ahmet Yılmaz', brans: 'mat' },
  { id: 't02', ad: 'Burak Tekin', brans: 'mat' },
  { id: 't03', ad: 'Ayşe Demir', brans: 'fiz' },
  { id: 't04', ad: 'Selin Aydın', brans: 'tde', muaf: true },
  { id: 't05', ad: 'Murat Eren', brans: 'tde' },
  { id: 't06', ad: 'Derya Koral', brans: 'kim' },
  { id: 't07', ad: 'Kemal Şahin', brans: 'biy' },
  { id: 't08', ad: 'Hasan Kılıç', brans: 'tar' },
  { id: 't09', ad: 'Nazlı Güneş', brans: 'cog' },
  { id: 't10', ad: 'Leyla Brown', brans: 'ing' },
  { id: 't11', ad: 'Oğuz Karan', brans: 'ing' },
  { id: 't12', ad: 'Fatma Sezer', brans: 'din', muaf: true },
  { id: 't13', ad: 'Cenk Aral', brans: 'bed' },
  { id: 't14', ad: 'Ebru Saygın', brans: 'fel', muaf: true },
  { id: 't15', ad: 'Tuna Berk', brans: 'bil' },
  { id: 't16', ad: 'Melis Akman', brans: 'muz', muaf: true },
];
const DTA_T = Object.fromEntries(DTA_TEACHERS.map((t) => [t.id, t]));

const DTA_AV_COLORS = ['#2F4DA0', '#A93B62', '#5B45B0', '#0C6B66', '#2E7D36', '#92600F', '#146C94', '#5F6B16', '#B45A0C', '#28617A'];
const dtaAv = (s) => DTA_AV_COLORS[(s.charCodeAt(0) + s.length) % DTA_AV_COLORS.length];
const dtaIni = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const dtaBrans = (id) => (window.ACA_BR && window.ACA_BR[id] ? window.ACA_BR[id].ad : id);
const dtaBransFg = (id) => (window.ACA_BR && window.ACA_BR[id] ? window.ACA_BR[id].fg : 'var(--text-faint)');

/* Nöbet bölgeleri (okula özel katalog) */
const DTA_REGIONS = [
  { id: 'kat1', ad: '1. Kat Koridoru', tip: 'Koridor', ico: 'building', cap: 1, aktif: true },
  { id: 'kat2', ad: '2. Kat Koridoru', tip: 'Koridor', ico: 'building', cap: 1, aktif: true },
  { id: 'kat3', ad: '3. Kat Koridoru', tip: 'Koridor', ico: 'building', cap: 1, aktif: true },
  { id: 'kantin', ad: 'Kantin / Yemekhane', tip: 'Yoğun alan', ico: 'utensils', cap: 1, aktif: true },
  { id: 'bahce', ad: 'Bahçe / Açık Alan', tip: 'Açık alan', ico: 'sun', cap: 2, aktif: true },
  { id: 'kapi', ad: 'Giriş-Çıkış Kapısı', tip: 'Güvenlik', ico: 'door-open', cap: 1, aktif: true },
];

/* Çizelge — `bölge-günIndex` → nöbetçi öğretmen. conflict: ders/müsaitlik çakışması. */
const DTA_SCHED_INIT = {
  'kat1-0': { t: 't01' }, 'kat2-0': { t: 't06' }, 'kat3-0': { t: 't09' }, 'kantin-0': { t: 't13' }, 'bahce-0': { t: 't10' }, 'kapi-0': { t: 't15' },
  'kat1-1': { t: 't02' }, 'kat2-1': { t: 't07' }, 'kat3-1': { t: 't11' }, 'kantin-1': { t: 't05' }, 'bahce-1': { t: 't03', conflict: 'Ayşe Demir bugün raporlu — vekâlet sekmesine bkz.' }, 'kapi-1': { t: 't08' },
  'kat1-2': { t: 't06' }, 'kat2-2': { t: 't01' }, 'kat3-2': { t: 't08' }, 'kantin-2': { t: 't15' }, 'bahce-2': { t: 't09' }, 'kapi-2': { t: 't13' },
  'kat1-3': { t: 't10' }, 'kat2-3': { t: 't05' }, 'kat3-3': { t: 't07' }, 'kantin-3': { t: 't11' }, 'bahce-3': { t: 't02' }, 'kapi-3': { t: 't03' },
  'kat1-4': { t: 't08' }, 'kat2-4': { t: 't13' }, 'kat3-4': { t: 't01' }, 'kantin-4': { t: 't06' }, 'bahce-4': { t: 't15' }, 'kapi-4': { t: 't10' },
};
/* Yancı (öğle arası gözetim devri) — deterministik; nöbetçi dışı, o gün boş öğretmen */
const DTA_YANCI = {
  'kat1-0': 't05', 'kat2-0': 't11', 'kat3-0': 't08', 'kantin-0': 't07', 'bahce-0': 't02', 'kapi-0': 't09',
  'kat1-1': 't10', 'kat2-1': 't15', 'kat3-1': 't13', 'kantin-1': 't09', 'bahce-1': 't06', 'kapi-1': 't11',
  'kat1-2': 't13', 'kat2-2': 't05', 'kat3-2': 't11', 'kantin-2': 't10', 'bahce-2': 't07', 'kapi-2': 't08',
  'kat1-3': 't15', 'kat2-3': 't09', 'kat3-3': 't08', 'kantin-3': 't13', 'bahce-3': 't10', 'kapi-3': 't06',
  'kat1-4': 't09', 'kat2-4': 't05', 'kat3-4': 't11', 'kantin-4': 't02', 'bahce-4': 't07', 'kapi-4': 't13',
};

/* Muafiyetler (politika sekmesi + adil dağıtımda dışlanır) */
const DTA_MUAF_INIT = [
  { id: 'm1', t: 't04', sebep: 'Müdür yardımcısı — idari görev', tur: 'surekli', tarih: 'Sürekli' },
  { id: 'm2', t: 't12', sebep: 'Rehberlik / psikolojik danışmanlık', tur: 'surekli', tarih: 'Sürekli' },
  { id: 'm3', t: 't14', sebep: 'Sağlık durumu — hekim raporu', tur: 'gecici', tarih: '10–24 Kas' },
  { id: 'm4', t: 't16', sebep: 'Yarı zamanlı — haftada 6 saat', tur: 'surekli', tarih: 'Sürekli' },
];

/* Nöbet defteri kayıtları */
const DTA_LOG = [
  { id: 'g1', kind: 'olay', t: 't08', region: 'Giriş-Çıkış Kapısı', tm: 'Bugün · 08:25', note: '7-B’den iki öğrenci geç geldi, rehberlik servisine yönlendirildi. Veli bilgilendirmesi idareye iletildi.' },
  { id: 'g2', kind: 'normal', t: 't02', region: '1. Kat Koridoru', tm: 'Bugün · 10:15', note: 'Teneffüs sakin geçti, olağan dışı durum yok.' },
  { id: 'g3', kind: 'devir', t: 't07', region: 'Kantin / Yemekhane', tm: 'Dün · 12:45', note: 'Öğle arası gözetim Kemal Şahin’e devredildi (yancılık). Yoğunluk normal seviyedeydi.' },
  { id: 'g4', kind: 'olay', t: 't10', region: 'Bahçe / Açık Alan', tm: 'Dün · 13:20', note: 'Basamakta düşme — hafif sıyrık. Revire yönlendirildi, veli arandı. Tutanak tutuldu.' },
];

/* Çizelge sürümleri — yürürlük tarihli, supersede (silme YOK), geçmiş korunur (NÖ-10).
   Ders programının ScheduleVersion/EffectiveTo modeliyle hizalı. */
const DTA_VERSIONS_INIT = [
  { v: 2, from: '18 Kas 2025', to: null, status: 'aktif', who: 'A. Yılmaz', when: '17 Kas · 14:20', note: 'Kimya öğretmeni Derya Koral kadroya katıldı; 2. kat ve kantin nöbetleri yeniden dengelendi.' },
  { v: 1, from: '15 Eyl 2025', to: '17 Kas 2025', status: 'superseded', who: 'A. Yılmaz', when: '12 Eyl · 09:05', note: 'Dönem başı ilk nöbet çizelgesi.' },
];

/* ════════════════ Yardımcılar ════════════════ */
function dtaCounts(sched, yanciOn) {
  /* öğretmen başına nöbet + yancı sayısı */
  const c = {};
  DTA_TEACHERS.forEach((t) => { if (!t.muaf) c[t.id] = { nob: 0, yan: 0 }; });
  Object.values(sched).forEach((cell) => { if (cell && c[cell.t]) c[cell.t].nob++; });
  if (yanciOn) Object.values(DTA_YANCI).forEach((tid) => { if (c[tid]) c[tid].yan++; });
  return c;
}

/* ════════════════ Avatar mini bileşen ════════════════ */
function DtaAvatar({ id, size = 26, cls }) {
  const t = DTA_T[id];
  if (!t) return null;
  return <span className={'av' + (cls ? ' ' + cls : '')} style={{ background: dtaAv(t.ad), width: size, height: size }}>{dtaIni(t.ad)}</span>;
}

/* ════════════════ Hücre düzenle/kaldır popover ════════════════ */
function DtaCellMenu({ anchor, rg, di, sched, onAssign, onRemove, onClose }) {
  const [q, setQ] = useStateDta('');
  const ky = rg.id + '-' + di;
  const cell = sched[ky];
  const curId = cell ? cell.t : null;
  const counts = useMemoDta(() => dtaCounts(sched, false), [sched]);
  /* o gün başka bölgede nöbetçi olanlar — aynı güne ikinci nöbet yazılamaz */
  const busyDay = useMemoDta(() => {
    const s = {};
    DTA_REGIONS.forEach((r2) => { const c = sched[r2.id + '-' + di]; if (c && r2.id !== rg.id) s[c.t] = r2.ad; });
    return s;
  }, [sched, di, rg.id]);

  const list = DTA_TEACHERS.filter((t) => !t.muaf).filter((t) =>
    !q || t.ad.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr')) || dtaBrans(t.brans).toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr'))
  ).sort((a, b) => (a.id === curId ? -1 : b.id === curId ? 1 : (counts[a.id] ? counts[a.id].nob : 0) - (counts[b.id] ? counts[b.id].nob : 0)));

  /* konumlandırma */
  const W = 304;
  const vw = window.innerWidth, vh = window.innerHeight;
  let left = Math.min(anchor.left, vw - W - 12);
  left = Math.max(12, left);
  const estH = 380;
  let top = anchor.bottom + 6;
  let up = false;
  if (top + estH > vh - 12) { up = true; top = Math.max(12, anchor.top - 6 - estH); }

  return (
    <React.Fragment>
      <div className="dta-cm-scrim" onClick={onClose}></div>
      <div className={'dta-cm' + (up ? ' up' : '')} style={{ left, top }} onClick={(e) => e.stopPropagation()}>
        <div className="dta-cm-head">
          <span className="ci"><Icon name={rg.ico} size={17} /></span>
          <div className="cx">
            <div className="t">{rg.ad}</div>
            <div className="s">{DTA_DAYS[di][1]}{di === DTA_TODAY ? ' · Bugün' : ''} · {curId ? 'nöbetçiyi değiştir' : 'nöbetçi ata'}</div>
          </div>
          <button className="x" onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        <div className="dta-cm-search">
          <div className="wrap">
            <Icon name="search" size={15} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Öğretmen ara…" />
          </div>
        </div>

        <div className="dta-cm-lbl">{curId ? 'Yeni nöbetçi seç' : 'Nöbetçi öğretmen'}</div>
        <div className="dta-cm-list">
          {list.length === 0 && <div className="dta-cm-empty">Eşleşen öğretmen yok</div>}
          {list.map((t) => {
            const isCur = t.id === curId;
            const busyIn = busyDay[t.id];
            const n = counts[t.id] ? counts[t.id].nob : 0;
            return (
              <button key={t.id} className={'dta-cm-opt' + (isCur ? ' cur' : '')} disabled={!!busyIn && !isCur}
                onClick={() => { if (busyIn && !isCur) return; onAssign(t.id); }}
                title={busyIn && !isCur ? t.ad + ' · ' + DTA_DAYS[di][1] + ' günü ' + busyIn + ' nöbetinde' : t.ad}>
                <DtaAvatar id={t.id} size={30} />
                <div className="ox">
                  <div className="nm">{t.ad}</div>
                  <div className="br">{dtaBrans(t.brans)}</div>
                </div>
                {isCur ? <span className="dta-cm-curtag"><Icon name="check" size={12} strokeWidth={3} /> Atanmış</span>
                  : busyIn ? <span className="dta-cm-busy"><Icon name="alert-triangle" size={11} /> O gün dolu</span>
                  : <span className="dta-cm-load"><Icon name="shield" size={10} /> {n}</span>}
              </button>
            );
          })}
        </div>

        {curId && (
          <div className="dta-cm-foot">
            <button className="dta-cm-remove" onClick={onRemove}><Icon name="trash-2" size={15} /> Atamayı kaldır</button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

/* ════════════════ Çizelge sekmesi ════════════════ */
function DtaCizelge({ sched, setSched, yanciOn, cur, fire, onOpenAuto, onOpenDefter, onOpenHistory }) {
  const counts = useMemoDta(() => dtaCounts(sched, yanciOn), [sched, yanciOn]);
  const fairRows = useMemoDta(() => {
    return DTA_TEACHERS.filter((t) => !t.muaf).map((t) => ({ ...t, ...counts[t.id] }))
      .sort((a, b) => b.nob - a.nob || a.ad.localeCompare(b.ad, 'tr'));
  }, [counts]);
  const nobVals = fairRows.map((r) => r.nob);
  const maxNob = Math.max(...nobVals, 1);
  const minNob = Math.min(...nobVals);
  const spread = maxNob - minNob;
  const totalNobet = Object.keys(sched).length;
  const conflictCount = Object.values(sched).filter((c) => c && c.conflict).length;
  const [menu, setMenu] = useStateDta(null);

  function openMenu(e, rg, di) {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({ rg, di, anchor: { left: r.left, top: r.top, bottom: r.bottom, right: r.right, width: r.width } });
  }
  function assignCell(tid) {
    if (!menu) return;
    const ky = menu.rg.id + '-' + menu.di;
    const prev = sched[ky];
    setSched((s) => ({ ...s, [ky]: { t: tid } })); /* yeniden atama çakışma uyarısını temizler */
    const t = DTA_T[tid];
    fire(<span><b>{t ? t.ad : ''}</b> · {menu.rg.ad} · {DTA_DAYS[menu.di][1]} {prev ? 'olarak güncellendi' : 'nöbetçi atandı'}</span>, 'ok');
    setMenu(null);
  }
  function removeCell() {
    if (!menu) return;
    clearCell(menu.rg.id + '-' + menu.di);
    setMenu(null);
  }

  function clearCell(ky) {
    setSched((s) => { const n = { ...s }; delete n[ky]; return n; });
    fire(<span>Atama kaldırıldı — boş bırakıldı</span>, 'warn');
  }

  return (
    <React.Fragment>
      {/* özet */}
      <div className="dta-summary">
        <div className="dta-stat nob"><span className="si"><Icon name="shield" size={20} /></span><div><div className="sv">{totalNobet}</div><div className="sl">haftalık nöbet ataması</div></div></div>
        <div className="dta-stat adalet"><span className="si"><Icon name="gauge" size={20} /></span><div><div className="sv">{minNob}–{maxNob}</div><div className="sl">kişi başı nöbet aralığı</div></div></div>
        <div className="dta-stat muaf"><span className="si"><Icon name="user-x" size={20} /></span><div><div className="sv">{DTA_TEACHERS.filter((t) => t.muaf).length}</div><div className="sl">muaf öğretmen</div></div></div>
        <div className="dta-stat vek"><span className="si"><Icon name={conflictCount ? 'alert-triangle' : 'check-circle'} size={20} /></span><div><div className="sv">{conflictCount}</div><div className="sl">çakışma uyarısı</div></div></div>
      </div>

      {/* toolbar */}
      <div className="dta-toolbar">
        <div className="dta-donem">
          <Icon name="calendar" size={15} />
          <select defaultValue="2025–2026 Güz"><option>2025–2026 Güz</option><option>2025–2026 Bahar</option></select>
        </div>
        <div className="dta-verbar">
          <span className="vtag"><Icon name="shield-check" size={12} /> v{cur.v}</span>
          <span className="vfrom"><Icon name="calendar" size={13} /> {cur.from}’ten beri yürürlükte</span>
          <button className="vhist" onClick={onOpenHistory}><Icon name="history" size={13} /> Sürüm geçmişi</button>
        </div>
        {!yanciOn && <span className="dta-param-off"><Icon name="eye-off" size={13} /> Yancılık kapalı</span>}
        <div className="grow"></div>
        <button className="btn btn-ghost" onClick={onOpenDefter}><Icon name="book" size={16} /> Nöbet Defteri</button>
        <button className="btn btn-ghost" onClick={() => fire(<span>Çizelge PDF olarak dışa aktarılıyor…</span>)}><Icon name="download" size={16} /> Dışa Aktar</button>
        <button className="btn btn-primary" onClick={onOpenAuto}><Icon name="sparkles" size={16} /> Adil Otomatik Dağıt</button>
      </div>

      {/* lejant */}
      <div className="dta-legend">
        <span className="dta-leg nob"><span className="sw"></span> Nöbetçi öğretmen</span>
        {yanciOn && <span className="dta-leg yanci"><span className="sw"></span> Yancı · öğle arası gözetim devri</span>}
        <span className="dta-leg conflict"><span className="sw"></span> Çakışma — ders/müsaitlik</span>
        <span className="dta-leg empty"><span className="sw"></span> Boş — atama bekliyor</span>
      </div>

      {/* ızgara */}
      <div className="dta-gridwrap">
        <div className="dta-grid">
          <div className="dta-gh corner"><span className="ttl">Bölge</span><span className="sub">gün boyu · teneffüs/öğle</span></div>
          {DTA_DAYS.map((d, di) => (
            <div key={d[0]} className={'dta-gh' + (di === DTA_TODAY ? ' today' : '')}><div className="d">{d[0]}</div><div className="n">{di === DTA_TODAY ? 'Bugün' : d[1]}</div></div>
          ))}

          {DTA_REGIONS.filter((r) => r.aktif).map((rg) => (
            <React.Fragment key={rg.id}>
              <div className="dta-region">
                <span className="ri"><Icon name={rg.ico} size={17} /></span>
                <div><div className="rn">{rg.ad}</div><div className="rt">{rg.tip}</div></div>
                {rg.cap > 1 && <span className="cap">×{rg.cap}</span>}
              </div>
              {DTA_DAYS.map((d, di) => {
                const ky = rg.id + '-' + di;
                const cell = sched[ky];
                if (!cell) {
                  return (
                    <div key={di} className={'dta-cell empty' + (di === DTA_TODAY ? ' today' : '')}
                      onClick={(e) => openMenu(e, rg, di)}>
                      <span className="add"><Icon name="plus" size={14} /> Ata</span>
                    </div>
                  );
                }
                const t = DTA_T[cell.t];
                const yid = yanciOn ? DTA_YANCI[ky] : null;
                const yt = yid ? DTA_T[yid] : null;
                return (
                  <div key={di} className={'dta-cell' + (cell.conflict ? ' conflict' : '') + (di === DTA_TODAY ? ' today' : '')}
                    title={cell.conflict || (t ? t.ad : '')}
                    onClick={(e) => openMenu(e, rg, di)}>
                    <div className="dta-asg">
                      <DtaAvatar id={cell.t} size={26} />
                      <div style={{ minWidth: 0 }}>
                        <span className="nm">{t ? t.ad : ''}</span>
                        <span className="br" style={{ color: dtaBransFg(t && t.brans) }}>{dtaBrans(t && t.brans)}</span>
                      </div>
                    </div>
                    {cell.conflict && <span className="conf-tag"><Icon name="alert-triangle" size={11} /> Çakışma</span>}
                    {yt && (
                      <div className="dta-yanci" title={'Yancı: ' + yt.ad}>
                        <span className="yl"><Icon name="coffee" size={9} /> Yancı</span>
                        <span className="yn">{yt.ad}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* yük & adalet */}
      <div className="dta-fair">
        <div className="dta-fair-h">
          <span className="fi"><Icon name="gauge" size={18} /></span>
          <div><h3>Yük & Adalet</h3><div className="s">Bu dönem · kişi başı nöbet{yanciOn ? ' + yancı' : ''} dağılımı</div></div>
          <div className="grow"></div>
          <div className="dta-fair-spread">
            <span className={'dta-spread-pill ' + (spread <= 1 ? 'ok' : 'warn')}>
              <Icon name={spread <= 1 ? 'check-circle' : 'alert-triangle'} size={13} />
              {spread <= 1 ? 'Dengeli' : 'Dengesiz'} · fark {spread}
            </span>
          </div>
        </div>
        <div className="dta-fair-body">
          {fairRows.map((r) => {
            const hi = r.nob === maxNob && spread > 0;
            const lo = r.nob === minNob && spread > 0;
            return (
              <div className="dta-fair-row" key={r.id}>
                <div className="dta-fair-who">
                  <DtaAvatar id={r.id} size={28} />
                  <div style={{ minWidth: 0 }}>
                    <div className="nm">{r.ad}</div>
                    <div className="br">{dtaBrans(r.brans)}</div>
                  </div>
                </div>
                <div className={'dta-fair-bar' + (hi ? ' hi' : lo ? ' lo' : '')}><i style={{ width: (r.nob / maxNob * 100) + '%' }}></i></div>
                <div className="dta-fair-nums">
                  <span><span className="nob">{r.nob}</span> <span className="lbl">nöbet</span></span>
                  {yanciOn && <span><span className="vek">{r.yan}</span> <span className="lbl">yancı</span></span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {menu && (
        <DtaCellMenu
          anchor={menu.anchor} rg={menu.rg} di={menu.di} sched={sched}
          onAssign={assignCell} onRemove={removeCell} onClose={() => setMenu(null)}
        />
      )}
    </React.Fragment>
  );
}

/* ════════════════ Otomatik dağıtım modalı (öner ≠ uygula) ════════════════ */
function DtaAutoModal({ onClose, onApply }) {
  const [done, setDone] = useStateDta(false);
  const constraints = [
    { t: 'Ders saati çakışması', s: 'Öğretmenin o gün dersi nöbeti engellemez (gün-bazlı)', val: 'Aktif' },
    { t: 'Müsaitlik (Dilim 1)', s: '“Müsait değil” günler kapalı, “tercih etmez” yumuşak ceza', val: '12 kayıt' },
    { t: 'Muafiyet', s: 'Müdür yard., rehber, sağlık ve yarı zamanlı dışlanır', val: '4 muaf' },
    { t: 'Bölge kapasitesi', s: 'Her bölgenin gerektirdiği nöbetçi sayısı', val: '6 bölge' },
    { t: 'Yük dengesi (adalet)', s: 'Kişi başı nöbet sayısını eşitlemeye çalışır', val: 'Hedef' },
  ];
  return (
    <div className="dta-scrim" onClick={onClose}>
      <div className="dta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dta-modal-head">
          <span className="mi"><Icon name="sparkles" size={20} /></span>
          <div><h3>Adil otomatik nöbet dağıtımı</h3><div className="s">Kısıtları çözer, dengeli bir çizelge önerir — uygulamadan önce onayına sunar.</div></div>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="dta-modal-body">
          {!done ? (
            <React.Fragment>
              <div className="dta-constr">
                {constraints.map((c, i) => (
                  <div className="dta-constr-row" key={i}>
                    <span className="ci"><Icon name="check" size={14} strokeWidth={3} /></span>
                    <div className="ctx"><div className="t">{c.t}</div><div className="s">{c.s}</div></div>
                    <span className="val">{c.val}</span>
                  </div>
                ))}
              </div>
              <div className="dta-preview-box">
                <div className="ph">Önizleme · yük dengesi</div>
                <div className="dta-ba">
                  <div className="dta-ba-col"><div className="l">Mevcut fark</div><div className="v">2</div><div className="vv">2–4 nöbet aralığı</div></div>
                  <span className="arr"><Icon name="arrow-right" size={20} /></span>
                  <div className="dta-ba-col after"><div className="l">Öneri sonrası</div><div className="v">1</div><div className="vv">2–3 nöbet aralığı</div></div>
                </div>
              </div>
              <div className="dta-prop-note">
                <Icon name="info" size={15} />
                <span>Öneri <b>30 nöbet</b> + <b>30 yancı</b> atamasını yeniden dengeler; çakışan veya müsait olmayan hiçbir saate atama yapılmaz. Uygulamadan önce çizelgede gözden geçirebilirsiniz.</span>
              </div>
            </React.Fragment>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--success-bg)', color: 'var(--success)', margin: '0 auto 14px' }}><Icon name="check" size={28} strokeWidth={2.4} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Öneri uygulandı</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-body)', lineHeight: 1.55, marginTop: 8, maxWidth: 360, marginInline: 'auto' }}>Çizelge dengelendi (fark 1). Etkilenen öğretmenlere bildirim taslağı oluşturuldu; yayınladığınızda gönderilir.</p>
            </div>
          )}
        </div>
        <div className="dta-modal-foot">
          {!done && <span className="dta-param-off"><Icon name="shield" size={13} /> Öner ≠ uygula — son söz sizde</span>}
          <div className="grow"></div>
          {!done ? (
            <React.Fragment>
              <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
              <button className="btn btn-primary" onClick={() => { setDone(true); onApply && onApply(); }}><Icon name="check-check" size={16} /> Öneriyi Uygula</button>
            </React.Fragment>
          ) : (
            <button className="btn btn-primary" onClick={onClose} style={{ marginLeft: 'auto' }}>Tamam</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════ Nöbet defteri drawer ════════════════ */
function DtaDefterDrawer({ onClose, fire }) {
  const [log, setLog] = useStateDta(DTA_LOG);
  const [draft, setDraft] = useStateDta('');
  function add() {
    if (!draft.trim()) return;
    setLog((l) => [{ id: 'gx' + Date.now(), kind: 'normal', t: 't01', region: 'Yönetim notu', tm: 'Şimdi', note: draft.trim() }, ...l]);
    setDraft('');
    fire(<span>Nöbet defterine kayıt eklendi</span>, 'ok');
  }
  return (
    <React.Fragment>
      <div className="dta-drawer-scrim" onClick={onClose}></div>
      <aside className="dta-drawer">
        <div className="dta-drawer-head">
          <span className="di"><Icon name="book" size={19} /></span>
          <div><h3>Nöbet Defteri</h3><div className="s">Olay ve devir-teslim kayıtları</div></div>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="dta-drawer-body">
          <div className="dta-log">
            {log.map((g) => {
              const t = DTA_T[g.t];
              return (
                <div className={'dta-log-item ' + g.kind} key={g.id}>
                  <span className="li"><Icon name={g.kind === 'olay' ? 'alert-triangle' : g.kind === 'devir' ? 'repeat' : 'check'} size={15} /></span>
                  <div className="lx">
                    <div className="lt">
                      <span className="who">{t ? t.ad : 'Yönetim'}</span>
                      <span className="tm">{g.tm}</span>
                    </div>
                    <div className="rg">{g.region}</div>
                    <div className="nt">{g.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="dta-drawer-foot">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Yeni kayıt — olay, gözlem veya devir-teslim notu…"></textarea>
          <div className="row">
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Kapat</button>
            <button className="btn btn-primary" onClick={add} style={{ flex: 1, justifyContent: 'center' }}><Icon name="plus" size={16} /> Kayıt Ekle</button>
          </div>
        </div>
      </aside>
    </React.Fragment>
  );
}

/* ════════════════ Sürüm geçmişi drawer (NÖ-10 · geçmiş korunur) ════════════════ */
function DtaVersionDrawer({ versions, onClose, fire }) {
  return (
    <React.Fragment>
      <div className="dta-drawer-scrim" onClick={onClose}></div>
      <aside className="dta-drawer">
        <div className="dta-drawer-head">
          <span className="di"><Icon name="history" size={19} /></span>
          <div><h3>Sürüm Geçmişi</h3><div className="s">Yürürlük tarihli çizelge sürümleri</div></div>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="dta-drawer-body">
          <div className="aca-note ok" style={{ marginTop: 0, marginBottom: 16 }}>
            <Icon name="shield-check" size={14} />
            <span>Sezon-ortası değişiklikte çizelge <b>silinmez</b>; yeni sürüm yürürlüğe girer, eskisi o tarihte kapanır. Geçmiş korunur — “Mart’ta Pazartesi 1. katta kim nöbetçiydi?” her zaman yanıtlanabilir.</span>
          </div>
          <div className="dta-ver-list">
            {versions.map((v) => (
              <div className={'dta-ver-item ' + v.status} key={v.v}>
                <span className="vi">v{v.v}</span>
                <div className="vx">
                  <div className="vtop">
                    <span className="vrange">{v.from} → {v.to || 'şu an'}</span>
                    <span className={'dta-ver-badge ' + v.status}>
                      <Icon name={v.status === 'aktif' ? 'check-circle' : 'archive'} size={10} />
                      {v.status === 'aktif' ? 'Yürürlükte' : 'Kapandı'}
                    </span>
                  </div>
                  <div className="vwho">{v.who} · {v.when}</div>
                  <div className="vnote">{v.note}</div>
                  {v.status !== 'aktif' && (
                    <button className="vview" onClick={() => fire(<span><b>v{v.v}</b> ({v.from} → {v.to}) salt-okunur olarak açılıyor…</span>)}>
                      <Icon name="eye" size={12} /> Bu sürümü görüntüle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="dta-drawer-foot">
          <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>Kapat</button>
        </div>
      </aside>
    </React.Fragment>
  );
}

/* ════════════════ Yayınla modalı — yeni yürürlük tarihli sürüm (supersede) ════════════════ */
function DtaPublishModal({ curVer, onClose, onPublish }) {
  const [date, setDate] = useStateDta('2025-11-26');
  const [done, setDone] = useStateDta(false);
  const fmt = (iso) => {
    const m = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const [y, mo, d] = iso.split('-');
    return parseInt(d, 10) + ' ' + m[parseInt(mo, 10) - 1] + ' ' + y;
  };
  return (
    <div className="dta-scrim" onClick={onClose}>
      <div className="dta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dta-modal-head">
          <span className="mi"><Icon name="send" size={20} /></span>
          <div><h3>Çizelgeyi yayınla — yeni sürüm</h3><div className="s">Yürürlük tarihli sürüm oluşturulur; mevcut sürüm o tarihte kapanır.</div></div>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="dta-modal-body">
          {!done ? (
            <React.Fragment>
              <div className="dta-eff-field">
                <div className="efl">Yürürlük başlangıcı</div>
                <div className="efs">Yeni çizelge bu tarihten itibaren geçerli olur. Bu tarihe kadar mevcut sürüm yürürlükte kalır.</div>
                <div className="dta-eff-input">
                  <Icon name="calendar" size={16} />
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div className="dta-supersede">
                <div className="sc old"><div className="sv">v{curVer} <span className="sch-ver">kapanır</span></div><div className="sl">{fmt(date)} itibarıyla</div></div>
                <span className="arr"><Icon name="arrow-right" size={20} /></span>
                <div className="sc new"><div className="sv"><Icon name="shield-check" size={15} /> v{curVer + 1} yürürlükte</div><div className="sl">{fmt(date)}’ten itibaren</div></div>
              </div>
              <div className="dta-prop-note">
                <Icon name="info" size={15} />
                <span>Geçmiş <b>silinmez</b> — v{curVer} kayıtları “kim ne zaman nöbetçiydi” sorgusu için saklanır. Etkilenen öğretmenlere bildirim gönderilir.</span>
              </div>
            </React.Fragment>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--success-bg)', color: 'var(--success)', margin: '0 auto 14px' }}><Icon name="check" size={28} strokeWidth={2.4} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>v{curVer + 1} yayınlandı</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-body)', lineHeight: 1.55, marginTop: 8, maxWidth: 360, marginInline: 'auto' }}>{fmt(date)}’ten itibaren yürürlükte. v{curVer} kapandı ve geçmişte korunuyor; öğretmenlere bildirim gönderildi.</p>
            </div>
          )}
        </div>
        <div className="dta-modal-foot">
          {!done && <span className="dta-param-off"><Icon name="archive" size={13} /> Sürümle — silme yok</span>}
          <div className="grow"></div>
          {!done ? (
            <React.Fragment>
              <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
              <button className="btn btn-primary" onClick={() => { setDone(true); onPublish && onPublish(fmt(date)); }}><Icon name="send" size={16} /> Yayınla</button>
            </React.Fragment>
          ) : (
            <button className="btn btn-primary" onClick={onClose} style={{ marginLeft: 'auto' }}>Tamam</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════ Öğretmen Görünümü — salt-okunur önizleme (admin) ════════════════
   Admin'in canlı çizelgesinden (DTA_SCHED + DTA_YANCI) seçili öğretmenin
   gördüğü read-only nöbet & yancı görünümünü türetir. Öğretmen portalındaki
   deneyimin birebir önizlemesi; yürürlük sürümü de yansıtılır. */
function dtaTeacherItems(sched, yanciOn, tid) {
  const items = [];
  DTA_REGIONS.filter((r) => r.aktif).forEach((rg) => {
    DTA_DAYS.forEach((d, di) => {
      const ky = rg.id + '-' + di;
      const cell = sched[ky];
      if (cell && cell.t === tid) items.push({ day: di, region: rg, kind: 'nob' });
      if (yanciOn && DTA_YANCI[ky] === tid) items.push({ day: di, region: rg, kind: 'yan' });
    });
  });
  return items.sort((a, b) => a.day - b.day || (a.kind === 'nob' ? -1 : 1));
}

function DtaTeacherPreview({ sched, yanciOn, cur, onClose, fire }) {
  /* atanmış görevi olan öğretmenler arasından, en yüklüyü varsayılan seç */
  const candidates = useMemoDta(() => {
    return DTA_TEACHERS.filter((t) => !t.muaf)
      .map((t) => ({ ...t, n: dtaTeacherItems(sched, yanciOn, t.id).length }))
      .sort((a, b) => b.n - a.n);
  }, [sched, yanciOn]);
  const [tid, setTid] = useStateDta((candidates[0] && candidates[0].id) || 't01');

  const t = DTA_T[tid];
  const items = dtaTeacherItems(sched, yanciOn, tid);
  const nobN = items.filter((x) => x.kind === 'nob').length;
  const yanN = items.filter((x) => x.kind === 'yan').length;

  return (
    <div className="dta-scrim" onClick={onClose}>
      <div className="dta-tp" onClick={(e) => e.stopPropagation()}>
        <div className="dta-tp-head">
          <span className="ei"><Icon name="eye" size={20} /></span>
          <div><h3>Öğretmen Görünümü · Önizleme</h3><div className="s">Seçili öğretmenin kendi portalında gördüğü salt-okunur ekran</div></div>
          <div className="grow"></div>
          <div className="dta-tp-picker">
            <Icon name="user" size={15} />
            <select value={tid} onChange={(e) => setTid(e.target.value)}>
              {DTA_TEACHERS.filter((x) => !x.muaf).map((x) => <option key={x.id} value={x.id}>{x.ad}</option>)}
            </select>
          </div>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="dta-tp-banner">
          <Icon name="info" size={15} />
          <span>Bu, öğretmenin <b>kendi portalında</b> gördüğü ekranın önizlemesidir. Nöbet ve yancı <b>salt-okunurdur</b>; öğretmen yalnızca vekâlet tekliflerini onaylar veya itiraz eder.</span>
        </div>

        <div className="dta-tp-body">
          <div className="dta-tp-portal">
            <div className="dta-tp-who">
              <DtaAvatar id={tid} size={44} />
              <div>
                <div className="nm">{t ? t.ad : ''}</div>
                <div className="ro"><span className="tag"><Icon name="graduation-cap" size={11} /> {dtaBrans(t && t.brans)}</span> Öğretmen portalı</div>
              </div>
              <span className="verp"><Icon name="shield-check" size={12} /> Çizelge v{cur.v} · {cur.from}</span>
            </div>

            <div className="dta-tp-summary">
              <div className="dta-tp-sc nob"><span className="si"><Icon name="shield" size={18} /></span><div><div className="v">{nobN}</div><div className="l">bu hafta nöbetin</div></div></div>
              {yanciOn && <div className="dta-tp-sc yan"><span className="si"><Icon name="coffee" size={18} /></span><div><div className="v">{yanN}</div><div className="l">öğle arası yancılığın</div></div></div>}
            </div>

            {items.length === 0 ? (
              <div className="dta-tp-empty">
                <div className="ic"><Icon name="check-circle" size={26} /></div>
                <div className="t">Bu hafta nöbetin yok</div>
                <div className="s">Bu öğretmene yürürlükteki çizelgede görev atanmamış.</div>
              </div>
            ) : (
              <React.Fragment>
                <div className="dta-tp-sec">Haftalık görevlerin</div>
                <div className="dta-tp-list">
                  {items.map((it, i) => {
                    const isToday = it.day === DTA_TODAY;
                    return (
                      <div className={'dta-tp-item ' + it.kind} key={i}>
                        <div className="tp-day">
                          <div className={'d' + (isToday ? ' today' : '')}>{isToday ? 'Bugün' : DTA_DAYS[it.day][0]}</div>
                          <div className="w">{DTA_DAYS[it.day][1]}</div>
                        </div>
                        <span className={'tp-type ' + it.kind}>
                          <Icon name={it.kind === 'nob' ? 'shield' : 'coffee'} size={11} /> {it.kind === 'nob' ? 'Nöbet' : 'Yancı'}
                        </span>
                        <div className="tp-main">
                          <div className="t">{it.region.ad}</div>
                          <div className="s"><Icon name="clock" size={12} /> {it.kind === 'nob' ? 'Gün boyu · teneffüs / öğle / giriş-çıkış' : 'Öğle arası · kısa gözetim devri'}</div>
                        </div>
                        <span className="dta-tp-ro"><Icon name="eye" size={12} /> Görüntüleme</span>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            )}
          </div>
        </div>

        <div className="dta-tp-foot">
          <span className="note"><Icon name="bell" size={13} /> Çizelge yayınlandığında öğretmene bildirim gönderilir.</span>
          <div className="grow"></div>
          <button className="btn btn-ghost" onClick={() => { fire(<span><b>{t ? t.ad : ''}</b> · nöbet görünümü bağlantısı kopyalandı</span>); }}><Icon name="link" size={15} /> Bağlantıyı kopyala</button>
          <button className="btn btn-primary" onClick={onClose}>Kapat</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════ ANA EKRAN ════════════════ */
function DutyAdminScreen({ role, t, onNavigate }) {
  const state = (t && t.dutyAdminState) || 'normal';
  const loading = state === 'yükleniyor';
  const empty = state === 'boş';

  const [tab, setTab] = useStateDta((t && t.dutyAdminTab) || 'cizelge');
  const [yanciOn, setYanciOn] = useStateDta(((t && t.dutyYancilik) || 'açık') === 'açık');
  const [sched, setSched] = useStateDta(DTA_SCHED_INIT);
  const [versions, setVersions] = useStateDta(DTA_VERSIONS_INIT);
  /* Politika çalışma seti — Kaydet'e kadar taslak (dirty takibi PageTop'ta) */
  const POL_INIT = { regions: DTA_REGIONS, muaf: DTA_MUAF_INIT, siklik: '2hafta', duzen: 'yayili' };
  const [pol, setPol] = useStateDta(POL_INIT);
  const [polSaved, setPolSaved] = useStateDta(POL_INIT);
  const [yanciSaved, setYanciSaved] = useStateDta(yanciOn);
  const [auto, setAuto] = useStateDta(false);
  const [defter, setDefter] = useStateDta(false);
  const [history, setHistory] = useStateDta(false);
  const [publish, setPublish] = useStateDta(false);
  const [teacherView, setTeacherView] = useStateDta(false);
  const [toast, setToast] = useStateDta(null);

  const curVer = versions.find((v) => v.status === 'aktif') || versions[0];
  const polDirty = JSON.stringify({ ...pol, yanciOn }) !== JSON.stringify({ ...polSaved, yanciOn: yanciSaved });
  function savePolitika() {
    setPolSaved(pol);
    setYanciSaved(yanciOn);
    fire(<span>Politika kaydedildi — değişiklikler yeni dağıtımda geçerli</span>, 'ok');
  }

  function publishNewVersion(dateLabel) {
    setVersions((vs) => {
      const cur = vs.find((v) => v.status === 'aktif');
      const nextV = (cur ? cur.v : vs.length) + 1;
      const closed = vs.map((v) => v.status === 'aktif' ? { ...v, status: 'superseded', to: dateLabel } : v);
      return [{ v: nextV, from: dateLabel, to: null, status: 'aktif', who: 'A. Yılmaz', when: 'Şimdi', note: 'Sezon-ortası revizyon — yeni yürürlük tarihiyle yayınlandı.' }, ...closed];
    });
  }

  useEffectDta(() => { if (t && t.dutyAdminTab) setTab(t.dutyAdminTab); }, [t && t.dutyAdminTab]);
  useEffectDta(() => { setYanciOn(((t && t.dutyYancilik) || 'açık') === 'açık'); }, [t && t.dutyYancilik]);

  function fire(msg, kind) {
    setToast({ msg, kind });
    clearTimeout(window.__dtaT);
    window.__dtaT = setTimeout(() => setToast(null), 2800);
  }

  const TABS = [
    { k: 'cizelge', label: 'Nöbet Çizelgesi', cnt: Object.keys(sched).length },
    { k: 'vekalet', label: 'Vekâlet (Bugün)', cnt: 4 },
    { k: 'politika', label: 'Bölgeler & Politika', cnt: DTA_REGIONS.length },
  ];

  function renderBody() {
    if (loading) {
      return (
        <React.Fragment>
          <div className="dta-summary">{[0, 1, 2, 3].map((i) => <div key={i} className="dta-sk" style={{ height: 70 }}></div>)}</div>
          <div className="dta-sk" style={{ height: 38, width: 320, marginBottom: 14 }}></div>
          <div className="dta-sk" style={{ height: 380 }}></div>
        </React.Fragment>
      );
    }
    if (empty) {
      return (
        <div className="dta-state">
          <div className="se-ico warn"><Icon name="shield" size={28} /></div>
          <h3>Henüz nöbet bölgesi tanımlı değil</h3>
          <p>Nöbet çizelgesi kurabilmek için önce okulunuza özel nöbet bölgelerini (kat koridorları, kantin, bahçe, giriş kapısı…) tanımlayın.</p>
          <button className="btn btn-primary" onClick={() => setTab('politika')}><Icon name="plus" size={16} /> Bölge Tanımla</button>
        </div>
      );
    }
    if (tab === 'cizelge') {
      return <DtaCizelge sched={sched} setSched={setSched} yanciOn={yanciOn} cur={curVer} fire={fire} onOpenAuto={() => setAuto(true)} onOpenDefter={() => setDefter(true)} onOpenHistory={() => setHistory(true)} />;
    }
    if (tab === 'vekalet') {
      return <DtaVekalet fire={fire} />;
    }
    return <DtaPolitika pol={pol} setPol={setPol} yanciOn={yanciOn} setYanciOn={setYanciOn} fire={fire} />;
  }

  return (
    <div className="stu aca dta" data-screen-label="Nöbet & Vekâlet Yönetimi">
      <PageTop
        crumbs={[{ label: 'Akademik' }, { label: 'Ders Programı', onClick: () => onNavigate && onNavigate('schedule') }, { label: 'Nöbet & Vekâlet' }]}
        title="Nöbet & Vekâlet Yönetimi"
        sub="Nöbet çizelgesini ders programıyla çakışmadan kurun, gelmeyen öğretmen için adil vekil görevlendirin; bölge, muafiyet ve yancılık politikasını yönetin."
        actions={
          tab === 'politika' ? (
            <React.Fragment>
              {polDirty && <span className="dta-unsaved"><Icon name="alert-triangle" size={15} /> Kaydedilmemiş değişiklikleriniz bulunmaktadır</span>}
              <button className="btn btn-primary" disabled={!polDirty} onClick={savePolitika}><Icon name="check" size={16} strokeWidth={2.6} /> Kaydet</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <button className="btn btn-ghost" onClick={() => setTeacherView(true)}><Icon name="eye" size={16} /> Öğretmen Görünümü</button>
              <button className="btn btn-primary" onClick={() => setPublish(true)}><Icon name="send" size={16} /> Çizelgeyi Yayınla</button>
            </React.Fragment>
          )
        }
      />

      {/* sekmeler */}
      <div className="aca-tabs">
        {TABS.map((tb) => (
          <button key={tb.k} className={'aca-tab' + (tab === tb.k ? ' on' : '')} onClick={() => setTab(tb.k)}>
            {tb.label} <span className="cnt">{tb.cnt}</span>
          </button>
        ))}
      </div>

      <div className="stu-inner">
        <div className="dta-inner">
          {tab === 'cizelge' && !loading && !empty && (
            <div className="dta-info">
              <span className="ii"><Icon name="info" size={18} /></span>
              <div className="ix">
                <div className="t">Nöbet gün-bazlıdır — ders saatine yazılmaz</div>
                <div className="s"><b className="nob">Nöbet</b>, öğretmenin o gün belirli bir kat/bölgenin nöbetçisi olmasıdır; aktif gözetim teneffüs, öğle ve giriş-çıkış pencerelerinde olur. Sistem ders ve müsaitlik <b>çakışmalarını</b> engeller; dağıtımı adalet için dengeler.</div>
              </div>
            </div>
          )}
          {renderBody()}
        </div>
      </div>

      {auto && <DtaAutoModal onClose={() => setAuto(false)} onApply={() => fire(<span>Adil dağıtım önerisi uygulandı — çizelge dengelendi</span>, 'ok')} />}
      {defter && <DtaDefterDrawer onClose={() => setDefter(false)} fire={fire} />}
      {history && <DtaVersionDrawer versions={versions} onClose={() => setHistory(false)} fire={fire} />}
      {teacherView && <DtaTeacherPreview sched={sched} yanciOn={yanciOn} cur={curVer} onClose={() => setTeacherView(false)} fire={fire} />}
      {publish && <DtaPublishModal curVer={curVer.v} onClose={() => setPublish(false)} onPublish={(d) => { publishNewVersion(d); fire(<span>Çizelge <b>v{curVer.v + 1}</b> yayınlandı · {d}’ten itibaren yürürlükte</span>, 'ok'); }} />}

      {toast && (
        <div className={'sch-toast' + (toast.kind === 'ok' ? ' ok' : toast.kind === 'bad' ? ' bad' : toast.kind === 'warn' ? ' warn' : '')}>
          <span className="ti"><Icon name={toast.kind === 'ok' ? 'check' : toast.kind === 'bad' ? 'ban' : toast.kind === 'warn' ? 'minus' : 'arrow-right'} size={16} strokeWidth={2.6} /></span>
          <span className="tx">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  DutyAdminScreen, DtaCizelge, DtaCellMenu, DtaAutoModal, DtaDefterDrawer, DtaVersionDrawer, DtaPublishModal, DtaTeacherPreview, DtaAvatar,
  DTA_TEACHERS, DTA_T, DTA_REGIONS, DTA_MUAF_INIT, DTA_DAYS, DTA_VERSIONS_INIT,
  dtaAv, dtaIni, dtaBrans, dtaBransFg,
});
