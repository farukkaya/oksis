/* OKSİS — Akademik · Ders Programı · ÖĞRETMEN MÜSAİTLİĞİ (ADMIN)
   schedule_avail.jsx · AvailabilityScreen
   Admin bir öğretmen seçer, o öğretmenin haftalık müsaitlik/tercih durumunu
   3-durumlu ızgarada işaretler, kaydeder. Otomatik üretim ve editör bunları
   dikkate alır. Hub (schedule.jsx) ve Editör (schedule_editor.jsx) ile BİREBİR
   aynı dil: PageTop + iki-kolon yerleşim, editör grid görseli, SchStatus rozeti. */
const { useState: useStateSav, useMemo: useMemoSav, useEffect: useEffectSav, useRef: useRefSav } = React;

/* ════════════════ Sabitler ════════════════ */
const SAV_DAYS = [
  ['Pzt', 'Pazartesi'], ['Sal', 'Salı'], ['Çar', 'Çarşamba'], ['Per', 'Perşembe'], ['Cum', 'Cuma'],
];
const SAV_PERIODS = [
  { p: 1, a: '08:40', b: '09:20' }, { p: 2, a: '09:30', b: '10:10' },
  { p: 3, a: '10:20', b: '11:00' }, { p: 4, a: '11:10', b: '11:50' },
  { p: 5, a: '12:40', b: '13:20' }, { p: 6, a: '13:30', b: '14:10' },
  { p: 7, a: '14:20', b: '15:00' }, { p: 8, a: '15:10', b: '15:50' },
];

/* Üç durum — renk + ikon BİRLİKTE (erişilebilirlik). Sıra: döngüsel tıklama. */
const SAV_STATES = ['avail', 'prefer', 'unavail'];
const SAV_META = {
  avail:   { lbl: 'Müsait',       short: 'Müsait',  ico: 'check', tone: 'avail' },
  prefer:  { lbl: 'Tercih Etmez', short: 'Tercih',  ico: 'minus', tone: 'prefer' },
  unavail: { lbl: 'Müsait Değil', short: 'Olamaz',  ico: 'ban',   tone: 'unavail' },
};

/* ── Öğretmen havuzu (Atlas Koleji · Lise). defined: müsaitlik girilmiş mi? ── */
const SAV_TEACHERS = [
  { id: 't01', ad: 'Ahmet Yılmaz', brans: 'mat', defined: true,
    cells: { '3-5': 'unavail', '3-6': 'unavail', '4-1': 'unavail', '0-7': 'prefer', '1-7': 'prefer', '2-7': 'prefer', '4-8': 'prefer' } },
  { id: 't02', ad: 'Burak Tekin', brans: 'mat', defined: true,
    cells: { '3-1': 'unavail', '3-2': 'unavail', '0-8': 'prefer', '4-8': 'prefer' } },
  { id: 't03', ad: 'Ayşe Demir', brans: 'fiz', defined: true,
    cells: { '3-7': 'unavail', '4-7': 'unavail', '4-8': 'unavail', '2-1': 'prefer', '0-1': 'prefer' } },
  { id: 't04', ad: 'Selin Aydın', brans: 'tde', defined: true,
    cells: { '0-8': 'prefer', '1-8': 'prefer', '2-8': 'prefer', '4-6': 'unavail' } },
  { id: 't06', ad: 'Derya Koral', brans: 'kim', defined: false, cells: {} },
  { id: 't08', ad: 'Hasan Kılıç', brans: 'tar', defined: true,
    cells: { '4-6': 'unavail', '4-7': 'unavail', '4-8': 'unavail' } },
  { id: 't09', ad: 'Nazlı Güneş', brans: 'cog', defined: false, cells: {} },
  { id: 't10', ad: 'Leyla Brown', brans: 'ing', defined: true,
    cells: { '0-1': 'prefer', '1-1': 'prefer', '2-1': 'prefer', '3-1': 'prefer' } },
  { id: 't13', ad: 'Cenk Aral', brans: 'bed', defined: false, cells: {} },
  { id: 't15', ad: 'Tuna Berk', brans: 'bil', defined: false, cells: {} },
  { id: 't16', ad: 'Melis Akman', brans: 'muz', defined: false, cells: {} },
];

const SAV_AV_COLORS = ['#2F4DA0', '#A93B62', '#5B45B0', '#0C6B66', '#2E7D36', '#92600F', '#146C94', '#5F6B16', '#B45A0C', '#28617A'];
const savAv = (s) => SAV_AV_COLORS[(s.charCodeAt(0) + s.length) % SAV_AV_COLORS.length];
const savIni = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

/* ════════════════ Hücre üstü 3'lü mini-seçim ════════════════ */
function SavCellPicker({ cur, onPick }) {
  return (
    <div className="sav-pick" onClick={(e) => e.stopPropagation()}>
      {SAV_STATES.map((s) => {
        const m = SAV_META[s];
        return (
          <button key={s} className={'sav-pick-btn ' + s + (cur === s ? ' on' : '')}
            title={m.lbl} onClick={() => onPick(s)}>
            <Icon name={m.ico} size={13} strokeWidth={s === 'prefer' ? 3 : 2.2} />
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════ Gün başlığı doldur popover ════════════════ */
function SavDayMenu({ day, onFill, onClose }) {
  return (
    <div className="sav-daymenu" onClick={(e) => e.stopPropagation()}>
      <div className="h">{day} — tüm günü doldur</div>
      {SAV_STATES.map((s) => {
        const m = SAV_META[s];
        return (
          <button key={s} className={'sav-daymenu-opt ' + s} onClick={() => { onFill(s); onClose(); }}>
            <span className="sw"><Icon name={m.ico} size={12} strokeWidth={s === 'prefer' ? 3 : 2.2} /></span>{m.lbl}
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════ Ana ekran ════════════════ */
function AvailabilityScreen({ role, t, onNavigate }) {
  const state = (t && t.savState) || 'normal';   /* normal · loading · empty · error · noteacher */
  const loading = state === 'loading';

  const [donem, setDonem] = useStateSav('2025–2026 Güz');
  const [q, setQ] = useStateSav('');
  const [fBrans, setFBrans] = useStateSav('');
  const [selId, setSelId] = useStateSav(state === 'noteacher' ? null : 't01');
  const [cells, setCells] = useStateSav(() => {
    const tch = SAV_TEACHERS.find((x) => x.id === 't01');
    return tch ? { ...tch.cells } : {};
  });
  const [dirty, setDirty] = useStateSav(false);
  const [saving, setSaving] = useStateSav(false);
  const [savedFlash, setSavedFlash] = useStateSav(false);
  const [dayMenu, setDayMenu] = useStateSav(null);
  const [toast, setToast] = useStateSav(null);

  const sel = SAV_TEACHERS.find((x) => x.id === selId) || null;
  const branchName = (id) => (window.ACA_BR && window.ACA_BR[id] ? window.ACA_BR[id].ad : id);
  const branchColor = (id) => (window.ACA_BR && window.ACA_BR[id] ? window.ACA_BR[id].fg : 'var(--text-faint)');

  function fire(msg, kind) {
    setToast({ msg, kind });
    clearTimeout(window.__savT);
    window.__savT = setTimeout(() => setToast(null), 2800);
  }

  function selectTeacher(tch) {
    setSelId(tch.id);
    setCells({ ...tch.cells });
    setDirty(false);
    setDayMenu(null);
  }

  function setCell(ky, st) {
    setCells((c) => {
      const n = { ...c };
      if (st === 'avail') delete n[ky]; else n[ky] = st;
      return n;
    });
    setDirty(true);
  }
  function cycleCell(ky) {
    const cur = cells[ky] || 'avail';
    const nx = SAV_STATES[(SAV_STATES.indexOf(cur) + 1) % SAV_STATES.length];
    setCell(ky, nx);
  }
  function fillDay(di, st) {
    setCells((c) => {
      const n = { ...c };
      SAV_PERIODS.forEach((per) => {
        const ky = di + '-' + per.p;
        if (st === 'avail') delete n[ky]; else n[ky] = st;
      });
      return n;
    });
    setDirty(true);
    fire(<span><b>{SAV_DAYS[di][1]}</b> · tüm gün "{SAV_META[st].lbl}" yapıldı</span>, st === 'avail' ? 'ok' : st === 'unavail' ? 'bad' : 'warn');
  }
  function allAvailable() {
    setCells({});
    setDirty(true);
    fire(<span>Tüm hafta <b>Müsait</b> yapıldı</span>, 'ok');
  }
  function save() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false); setDirty(false); setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1700);
      fire(<span><b>{sel ? sel.ad : ''}</b> müsaitliği kaydedildi</span>, 'ok');
    }, 750);
  }

  /* sayaçlar */
  const counts = useMemoSav(() => {
    let u = 0, p = 0;
    Object.values(cells).forEach((v) => { if (v === 'unavail') u++; else if (v === 'prefer') p++; });
    return { unavail: u, prefer: p };
  }, [cells]);

  useEffectSav(() => {
    if (!dayMenu) return;
    const onDoc = (e) => { if (e.target.closest && e.target.closest('.sav-daymenu, .sav-gh.day')) return; setDayMenu(null); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [dayMenu]);

  /* filtrelenmiş öğretmen listesi */
  const visTeachers = useMemoSav(() => {
    const needle = q.toLocaleLowerCase('tr');
    return SAV_TEACHERS.filter((tc) => {
      if (fBrans && branchName(tc.brans) !== fBrans) return false;
      if (needle && (tc.ad + ' ' + branchName(tc.brans)).toLocaleLowerCase('tr').indexOf(needle) === -1) return false;
      return true;
    });
  }, [q, fBrans]);

  const activeBranches = (window.ACA_BRANCHES || []).filter((b) => b.durum === 'Aktif');

  /* ── sağ panel grid satırları ── */
  function renderGrid() {
    const rows = [];
    SAV_PERIODS.forEach((per) => {
      rows.push(
        <React.Fragment key={'p' + per.p}>
          <div className="sed-time"><span className="p">{per.p}</span><span className="h">{per.a}<br />{per.b}</span></div>
          {SAV_DAYS.map((d, di) => {
            const ky = di + '-' + per.p;
            const st = cells[ky] || 'avail';
            const m = SAV_META[st];
            return (
              <div key={ky} className={'sav-cell ' + st} data-key={ky}
                title={m.lbl} onClick={() => cycleCell(ky)}>
                <span className="ico"><Icon name={m.ico} size={13} strokeWidth={st === 'prefer' ? 3 : 2.2} /></span>
                <span className="lbl">{m.short}</span>
                <SavCellPicker cur={st} onPick={(s) => setCell(ky, s)} />
              </div>
            );
          })}
        </React.Fragment>
      );
      if (per.p === 2 || per.p === 6) rows.push(<div className="sed-break" key={'br' + per.p}><span className="ln"></span><span className="lbl"><Icon name="coffee" size={11} /> Teneffüs</span><span className="ln"></span></div>);
      if (per.p === 4) rows.push(<div className="sed-break lunch" key="lunch"><span className="ln"></span><span className="lbl"><Icon name="utensils" size={11} /> Öğle Arası</span><span className="ln"></span></div>);
    });
    return rows;
  }

  /* ── sağ panel gövdesi (duruma göre) ── */
  function renderRightBody() {
    if (loading) {
      return (
        <div className="sav-grid-card">
          <div className="sed-grid">
            <div></div>
            {SAV_DAYS.map((d) => <div key={d[0]} className="sed-sk" style={{ height: 40 }}></div>)}
            {Array.from({ length: 8 }).map((_, ri) => (
              <React.Fragment key={ri}>
                <div className="sed-sk" style={{ height: 56, width: 36, justifySelf: 'end' }}></div>
                {SAV_DAYS.map((d) => <div key={d[0]} className="sed-sk" style={{ height: 58 }}></div>)}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    }
    if (state === 'empty') {
      return (
        <div className="sav-state">
          <div className="se-ico warn"><Icon name="calendar-x" size={28} /></div>
          <h3>Ders saati (zil programı) tanımlı değil</h3>
          <p>Bu dönem için zil programı oluşturulmadığından müsaitlik ızgarası çizilemez. Önce dönemin ders saatlerini tanımlayın.</p>
          <button className="btn btn-primary" onClick={() => onNavigate && onNavigate('settings')}><Icon name="clock" size={16} /> Zil Programını Tanımla</button>
        </div>
      );
    }
    if (state === 'error') {
      return (
        <div className="sav-state">
          <div className="se-ico danger"><Icon name="alert-triangle" size={28} /></div>
          <h3>Müsaitlik verisi yüklenemedi</h3>
          <p>Sunucuya ulaşılamadı. Bağlantınızı kontrol edip yeniden deneyin.</p>
          <button className="btn btn-ghost" onClick={() => fire(<span>Yeniden deneniyor…</span>)}><Icon name="rotate-ccw" size={16} /> Yeniden Dene</button>
        </div>
      );
    }
    if (!sel) {
      return (
        <div className="sav-state">
          <div className="se-ico"><Icon name="user" size={28} /></div>
          <h3>Soldan bir öğretmen seçin</h3>
          <p>Haftalık müsaitlik ve tercihleri görüntülemek ve düzenlemek için listeden bir öğretmen seçin.</p>
        </div>
      );
    }
    /* normal — grid */
    return (
      <React.Fragment>
        <div className="sav-bulkbar">
          <button className="sav-bulk" onClick={allAvailable}><Icon name="check-check" size={15} /> Tüm haftayı Müsait yap</button>
          <span className="sav-bulk-hint"><Icon name="info" size={13} /> Gün başlığına tıkla → o günü tek durumla doldur</span>
          <div className="grow"></div>
          <button className="sav-bulk ghost" onClick={() => fire(<span>Başka güne kopyala — gün seçici açılır</span>)}><Icon name="copy" size={15} /> Başka güne kopyala</button>
          <button className="sav-bulk ghost" onClick={() => fire(<span>Önceki dönemden (2024–2025 Bahar) müsaitlik kopyalanır</span>)}><Icon name="history" size={15} /> Önceki dönemden kopyala</button>
        </div>

        <div className="sav-legend">
          <span className="sav-leg avail"><span className="sw"><Icon name="check" size={10} strokeWidth={3} /></span> Müsait <em>· varsayılan</em></span>
          <span className="sav-leg prefer"><span className="sw"><Icon name="minus" size={10} strokeWidth={3.4} /></span> Tercih Etmez <em>· yumuşak uyarı</em></span>
          <span className="sav-leg unavail"><span className="sw"><Icon name="ban" size={10} /></span> Müsait Değil <em>· kesin engel</em></span>
        </div>

        <div className="sav-grid-card">
          <div className="sed-cal">
            <div className="sed-grid sed-grid-head">
              <div className="sed-gh time"></div>
              {SAV_DAYS.map((d, di) => (
                <div key={d[0]} className="sed-gh day sav-dayhead" onClick={(e) => { e.stopPropagation(); setDayMenu(dayMenu === di ? null : di); }}>
                  <div className="d">{d[0]}</div><div className="n">{d[1]}</div>
                  <Icon name="chevron-down" size={12} className="sav-dh-caret" />
                  {dayMenu === di && <SavDayMenu day={d[1]} onFill={(s) => fillDay(di, s)} onClose={() => setDayMenu(null)} />}
                </div>
              ))}
            </div>
            <div className="sed-grid sed-grid-body">
              {renderGrid()}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <div className="stu aca sav" data-screen-label="Öğretmen Müsaitliği">
      <PageTop
        crumbs={[{ label: 'Akademik' }, { label: 'Ders Programı', onClick: () => onNavigate && onNavigate('schedule') }, { label: 'Öğretmen Müsaitliği' }]}
        title="Öğretmen Müsaitliği & Tercihleri"
        sub="Öğretmenlerin uygun olmadığı ve tercih etmediği saatleri belirleyin; otomatik üretim ve editör bunları dikkate alır."
        actions={
          <React.Fragment>
            <div className="sav-donem">
              <Icon name="calendar" size={15} />
              <select value={donem} onChange={(e) => setDonem(e.target.value)}>
                <option>2025–2026 Güz</option>
                <option>2025–2026 Bahar</option>
                <option>2024–2025 Bahar</option>
              </select>
            </div>
            <button className="btn btn-ghost" onClick={() => fire(<span>Toplu içe aktar — Excel/CSV şablonu yüklenir</span>)}>
              <Icon name="upload" size={16} /> Toplu İçe Aktar
            </button>
          </React.Fragment>
        }
      />

      <div className="sav-layout">
        {/* ── SOL: öğretmen seçici ── */}
        <aside className="sav-side">
          <div className="sav-side-toolbar">
            <label className="stu-search">
              <Icon name="search" size={17} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Öğretmen ara…" />
            </label>
            <div className="sav-branchchips">
              <button className={'sav-bchip' + (fBrans === '' ? ' on' : '')} onClick={() => setFBrans('')}>Tümü</button>
              {activeBranches.map((b) => (
                <button key={b.id} className={'sav-bchip' + (fBrans === b.ad ? ' on' : '')} onClick={() => setFBrans(fBrans === b.ad ? '' : b.ad)}>
                  <span className="bd" style={{ background: b.fg }}></span>{b.ad}
                </button>
              ))}
            </div>
          </div>
          <div className="sav-tlist">
            {visTeachers.length === 0 ? (
              <div className="sav-tlist-empty"><Icon name="search" size={20} /><span>Eşleşen öğretmen yok</span></div>
            ) : visTeachers.map((tc) => (
              <button key={tc.id} className={'sav-trow' + (selId === tc.id ? ' on' : '')} onClick={() => selectTeacher(tc)}>
                <span className="av" style={{ background: savAv(tc.ad) }}>{savIni(tc.ad)}</span>
                <span className="tx">
                  <span className="nm">{tc.ad}</span>
                  <span className="br"><span className="bd" style={{ background: branchColor(tc.brans) }}></span>{branchName(tc.brans)}</span>
                </span>
                {tc.defined
                  ? <span className="sav-defined"><span className="d"></span>Tanımlı</span>
                  : <span className="sav-undef">—</span>}
              </button>
            ))}
          </div>
        </aside>

        {/* ── SAĞ: haftalık müsaitlik ızgarası ── */}
        <div className="sav-main">
          <div className="sav-head">
            {sel ? (
              <React.Fragment>
                <span className="av" style={{ background: savAv(sel.ad) }}>{savIni(sel.ad)}</span>
                <div className="hid">
                  <div className="nm">{sel.ad}</div>
                  <div className="meta">
                    <span className="br"><span className="bd" style={{ background: branchColor(sel.brans) }}></span>{branchName(sel.brans)}</span>
                    <span className="dot"></span>
                    <span className="dn">{donem}</span>
                  </div>
                </div>
                {!loading && state === 'normal' && (
                  <div className="sav-head-counts">
                    <span className="sav-cnt unavail"><Icon name="ban" size={13} /> {counts.unavail} müsait değil</span>
                    <span className="sav-cnt prefer"><Icon name="minus" size={13} strokeWidth={3} /> {counts.prefer} tercih etmez</span>
                  </div>
                )}
                <div className="grow"></div>
                <span className={'sav-savestate' + (saving ? ' saving' : dirty ? ' dirty' : savedFlash ? ' saved' : '')}>
                  {saving ? <React.Fragment><span className="btn-spin"></span> Kaydediliyor…</React.Fragment>
                    : dirty ? <React.Fragment><Icon name="circle-dot" size={13} /> Kaydedilmemiş değişiklik</React.Fragment>
                      : savedFlash ? <React.Fragment><Icon name="check" size={14} /> Kaydedildi</React.Fragment>
                        : <React.Fragment><Icon name="check-circle" size={14} /> Güncel</React.Fragment>}
                </span>
                <button className={'btn btn-primary' + (dirty && !saving ? '' : ' disabled')} disabled={!dirty || saving} onClick={save}>
                  <Icon name="save" size={16} /> Kaydet
                </button>
              </React.Fragment>
            ) : (
              <div className="sav-head-empty"><Icon name="user" size={17} /> Öğretmen seçilmedi</div>
            )}
          </div>

          <div className="sav-body">
            {renderRightBody()}
          </div>
        </div>
      </div>

      {toast && (
        <div className={'sch-toast' + (toast.kind === 'ok' ? ' ok' : toast.kind === 'bad' ? ' bad' : toast.kind === 'warn' ? ' warn' : '')}>
          <span className="ti"><Icon name={toast.kind === 'ok' ? 'check' : toast.kind === 'bad' ? 'ban' : toast.kind === 'warn' ? 'minus' : 'arrow-right'} size={16} strokeWidth={2.6} /></span>
          <span className="tx">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AvailabilityScreen });
