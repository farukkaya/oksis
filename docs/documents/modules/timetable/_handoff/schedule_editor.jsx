/* OKSİS — Akademik · Ders Programı · Program Editörü
   Tam ekran çalışma yüzeyi: sürükle-bırak haftalık grid + yerleştirilmemiş
   dersler paneli + canlı doğrulama çubuğu. Hub (schedule.jsx) ile aynı dil. */
const { useState: useStateEd, useMemo: useMemoEd, useRef: useRefEd, useEffect: useEffectEd } = React;

/* ════════════════ Sabitler & örnek veri (Atlas Koleji · 9-A) ════════════════ */
const SED_DAYS = [
  ['Pzt', 'Pazartesi'], ['Sal', 'Salı'], ['Çar', 'Çarşamba'], ['Per', 'Perşembe'], ['Cum', 'Cuma'],
];
const SED_PERIODS = [
  { p: 1, a: '08:40', b: '09:20' }, { p: 2, a: '09:30', b: '10:10' },
  { p: 3, a: '10:20', b: '11:00' }, { p: 4, a: '11:10', b: '11:50' },
  { p: 5, a: '12:40', b: '13:20' }, { p: 6, a: '13:30', b: '14:10' },
  { p: 7, a: '14:20', b: '15:00' }, { p: 8, a: '15:10', b: '15:50' },
];
const SED_REQ = [1, 2, 3, 4, 5, 6];   /* zorunlu öğretim penceresi */

const SED_SUBJECTS = {
  mat: { ad: 'Matematik',          kod: 'MAT', c: '#2F4DA0', teacher: 'Ahmet Yılmaz', room: 'B-201',       target: 6 },
  tde: { ad: 'Türk Dili ve Ed.',   kod: 'TDE', c: '#A93B62', teacher: 'Selin Aydın',  room: 'B-201',       target: 5 },
  ing: { ad: 'İngilizce',          kod: 'İNG', c: '#5F6B16', teacher: 'Leyla Brown',  room: 'B-201',       target: 4 },
  fiz: { ad: 'Fizik',              kod: 'FİZ', c: '#5B45B0', teacher: 'Ayşe Demir',   room: 'Fizik Lab.',  target: 2 },
  kim: { ad: 'Kimya',              kod: 'KİM', c: '#0C6B66', teacher: 'Derya Koral',  room: 'Kimya Lab.',  target: 2 },
  biy: { ad: 'Biyoloji',           kod: 'BİY', c: '#2E7D36', teacher: 'Kemal Şahin',  room: 'B-201',       target: 2 },
  tar: { ad: 'Tarih',              kod: 'TAR', c: '#92600F', teacher: 'Hasan Kılıç',  room: 'B-201',       target: 2 },
  cog: { ad: 'Coğrafya',           kod: 'COĞ', c: '#146C94', teacher: 'Nazlı Güneş',  room: 'B-201',       target: 2 },
  din: { ad: 'Din Kültürü',        kod: 'DİN', c: '#6B5840', teacher: 'Fatma Sezer',  room: 'B-201',       target: 2 },
  bed: { ad: 'Beden Eğitimi',      kod: 'BED', c: '#B45A0C', teacher: 'Cenk Aral',    room: 'Spor Salonu', target: 2 },
  bil: { ad: 'Bilişim Tekn.',      kod: 'BİL', c: '#28617A', teacher: 'Tuna Berk',    room: 'Bilişim Lab.',target: 1 },
};
const SED_ROOMS = ['B-201', 'B-202', 'B-204', 'Fizik Lab.', 'Kimya Lab.', 'Bilişim Lab.', 'Spor Salonu', 'Konferans Salonu'];
const SED_TEACHERS = Object.values(SED_SUBJECTS).map((s) => ({ name: s.teacher, brans: s.ad }))
  .filter((t, i, a) => a.findIndex((x) => x.name === t.name) === i);

/* başlangıç yerleşimi — 28/30 dolu, 1 çakışma (Per·3), 2 boş (Cum·5,6) */
const SED_INIT_PLACE = {
  '0-1': { sub: 'mat', block: 'start' }, '0-2': { sub: 'mat', block: 'cont' }, '0-3': { sub: 'tde' }, '0-4': { sub: 'ing' }, '0-5': { sub: 'fiz' }, '0-6': { sub: 'cog' },
  '1-1': { sub: 'tde' }, '1-2': { sub: 'din' }, '1-3': { sub: 'kim' }, '1-4': { sub: 'bed', block: 'start' }, '1-5': { sub: 'bed', block: 'cont' }, '1-6': { sub: 'cog' },
  '2-1': { sub: 'ing' }, '2-2': { sub: 'ing' }, '2-3': { sub: 'mat' }, '2-4': { sub: 'biy' }, '2-5': { sub: 'tar' }, '2-6': { sub: 'tde' },
  '3-1': { sub: 'fiz' }, '3-2': { sub: 'tar' }, '3-3': { sub: 'mat', conflict: true, reason: 'Ahmet Yılmaz · aynı saatte 7-B Matematik dersinde' }, '3-4': { sub: 'tde' }, '3-5': { sub: 'ing' }, '3-6': { sub: 'din' },
  '4-1': { sub: 'biy' }, '4-2': { sub: 'tde' }, '4-3': { sub: 'mat' }, '4-4': { sub: 'kim' },
};
/* öğretmenin "müsait değil" işaretlediği kilitli slotlar (etüt bandı) */
const SED_LOCKS = { '3-7': 'Ayşe Demir · müsait değil', '4-7': 'Kurul saati', '4-8': 'Müsait değil', '0-8': 'Rehberlik' };
/* harici meşguliyet — bu öğretmen başka sınıfta; sürüklerken kırmızı verir */
const SED_BUSY = { mat: { '4-6': '7-B' }, bil: { '4-5': '10-B' }, fiz: { '3-8': '11-A' } };

const SED_AVCOL = ['#2F4DA0', '#A93B62', '#5B45B0', '#0C6B66', '#2E7D36', '#92600F', '#146C94', '#5F6B16', '#B45A0C', '#28617A'];
const sedAv = (n) => SED_AVCOL[(n.charCodeAt(0) + n.length) % SED_AVCOL.length];
const sedIni = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
const roomIcon = (r) => /Lab/.test(r) ? 'flask-conical' : /Salon/.test(r) ? 'building' : 'map-pin';

/* ════════════════ Sol panel — ders çipi ════════════════ */
function SubjectChip({ id, rem, onDragStart, onDragEnd, dragging }) {
  const s = SED_SUBJECTS[id];
  const done = rem <= 0;
  return (
    <div
      className={'sed-chip' + (done ? ' done' : '') + (dragging ? ' dragging' : '')}
      style={{ '--c': s.c, borderLeftColor: s.c }}
      draggable={!done}
      onDragStart={done ? undefined : (e) => onDragStart(id, e)}
      onDragEnd={onDragEnd}
    >
      <div className="ci">
        <div className="cn">{s.ad}</div>
        <div className="ct">{s.teacher} · {s.kod}</div>
      </div>
      {done
        ? <span className="rem"><Icon name="check" size={12} strokeWidth={3} /></span>
        : <span className="rem">{rem}sa</span>}
      <Icon name="grip-vertical" size={16} className="grip" />
    </div>
  );
}

/* ════════════════ Hücre bağlam menüsü ════════════════ */
function CellMenu({ cell, onClose, onAction }) {
  const [sub, setSub] = useStateEd(null);   /* 'teacher' | 'room' */
  const s = SED_SUBJECTS[cell.sub];
  const curT = cell.teacher || s.teacher;
  const curR = cell.room || s.room;
  if (sub === 'teacher') {
    return (
      <div className="sed-cmenu sed-cmenu-sub" onClick={(e) => e.stopPropagation()}>
        <div className="h">Öğretmen seç</div>
        {SED_TEACHERS.map((t) => (
          <button key={t.name} className={'sed-cmenu-opt' + (t.name === curT ? ' on' : '')} onClick={() => onAction('teacher', t.name)}>
            <span className="dot" style={{ background: sedAv(t.name) }}></span>{t.name}
            {t.name === curT && <Icon name="check" size={14} className="ck" />}
          </button>
        ))}
      </div>
    );
  }
  if (sub === 'room') {
    return (
      <div className="sed-cmenu sed-cmenu-sub" onClick={(e) => e.stopPropagation()}>
        <div className="h">Derslik seç</div>
        {SED_ROOMS.map((r) => (
          <button key={r} className={'sed-cmenu-opt' + (r === curR ? ' on' : '')} onClick={() => onAction('room', r)}>
            <Icon name={roomIcon(r)} size={14} />{r}
            {r === curR && <Icon name="check" size={14} className="ck" />}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="sed-cmenu" onClick={(e) => e.stopPropagation()}>
      <button className="sed-cmenu-item" onClick={() => setSub('teacher')}><Icon name="user" size={15} /> Öğretmen değiştir <Icon name="chevron-right" size={14} className="chev" /></button>
      <button className="sed-cmenu-item" onClick={() => setSub('room')}><Icon name="map-pin" size={15} /> Derslik değiştir <Icon name="chevron-right" size={14} className="chev" /></button>
      {cell.block && <button className="sed-cmenu-item" onClick={() => onAction('split')}><Icon name="scissors" size={15} /> Bloğu böl</button>}
      <div className="sed-cmenu-sep"></div>
      <button className="sed-cmenu-item danger" onClick={() => onAction('remove')}><Icon name="trash-2" size={15} /> Kaldır</button>
    </div>
  );
}

/* ════════════════ Grid hücresi ════════════════ */
function GridCell({ ky, cell, locked, optional, missing, drag, view, tv, onDragOver, onDragLeave, onDrop, onOpenMenu, menuOpen, onMenuAction, onMenuClose, flash }) {
  const cls = ['sed-cell'];
  let body = null;

  /* öğretmen görünümü (salt-okunur) */
  if (view === 'ogretmen') {
    if (tv === 'mine') {
      const s = SED_SUBJECTS[cell.sub];
      cls.push('filled', 'tv-mine');
      return (
        <div className={cls.join(' ')} style={{ '--c': s.c }} data-key={ky}>
          <div className="cc-name">{s.ad}</div>
          <div className="cc-meta">9-A</div>
          <div className="cc-room"><Icon name={roomIcon(cell.room || s.room)} size={10} />{cell.room || s.room}</div>
        </div>
      );
    }
    const tvReset = { borderLeftColor: 'var(--line)', borderLeftWidth: '1.5px' };
    if (tv === 'busy') {
      cls.push('tv-busy');
      return <div className={cls.join(' ')} style={tvReset} data-key={ky}><span className="b">Başka<br />sınıf</span></div>;
    }
    if (tv === 'lock') { cls.push('locked'); return <div className={cls.join(' ')} style={tvReset} data-key={ky}><span className="lk"><Icon name="lock" size={13} />Müsait<br />değil</span></div>; }
    cls.push(optional ? 'optional' : 'tv-other');
    return <div className={cls.join(' ')} style={tvReset} data-key={ky}></div>;
  }

  /* sınıf görünümü */
  if (locked) {
    cls.push('locked');
    return <div className={cls.join(' ')} data-key={ky} title={locked}><span className="lk"><Icon name="lock" size={13} />{locked.split(' · ')[0]}</span></div>;
  }
  if (cell) {
    const s = SED_SUBJECTS[cell.sub];
    cls.push('filled');
    if (cell.conflict) cls.push('conflict');
    if (cell.block === 'start') cls.push('block-start');
    if (cell.block === 'cont') cls.push('block-cont');
    if (flash) cls.push('flash');
    body = (
      <React.Fragment>
        {cell.conflict && <span className="cf"><Icon name="alert-triangle" size={11} strokeWidth={2.6} /> Çakışma</span>}
        <div className="cc-name">{s.ad}</div>
        {cell.block !== 'cont' && <div className="cc-meta">{cell.teacher || s.teacher}</div>}
        {cell.block !== 'cont' && <div className="cc-room"><Icon name={roomIcon(cell.room || s.room)} size={10} />{cell.room || s.room}</div>}
        {cell.block && <span className="block-tag">BLOK</span>}
        <button className="cc-more" onClick={(e) => { e.stopPropagation(); onOpenMenu(ky); }}><Icon name="more-horizontal" size={15} /></button>
        {menuOpen && <CellMenu cell={cell} onClose={onMenuClose} onAction={(a, v) => onMenuAction(ky, a, v)} />}
      </React.Fragment>
    );
    return (
      <div className={cls.join(' ') + (drag ? (drag.ok ? ' drop-ok' : ' drop-bad') : '')} style={{ '--c': s.c }} data-key={ky}
        onClick={(e) => { e.stopPropagation(); onOpenMenu(ky); }}>
        {body}
      </div>
    );
  }
  /* boş hücre (drop hedefi) */
  if (drag) cls.push(drag.ok ? 'drop-ok' : 'drop-bad');
  else if (missing) cls.push('missing');
  else cls.push(optional ? 'optional' : 'empty');
  if (flash) cls.push('flash');
  return (
    <div className={cls.join(' ')} data-key={ky}
      onDragOver={(e) => onDragOver(ky, e)} onDragLeave={onDragLeave} onDrop={(e) => onDrop(ky, e)}>
      {drag && drag.reason && <div className={'drop-tip' + (drag.ok ? ' ok' : '')}>{drag.reason}</div>}
      {!drag && missing && <span className="m"><Icon name="clock" size={14} /> Boş<br />ders bekleniyor</span>}
    </div>
  );
}

/* ════════════════ Yayınla modalı ════════════════ */
function EdPublishModal({ meta, conflicts, missing, onClose, onConfirm }) {
  const SModal = window.Modal;
  const [notifyT, setNotifyT] = useStateEd(true);
  const [notifyV, setNotifyV] = useStateEd(true);
  const [note, setNote] = useStateEd('');
  const [done, setDone] = useStateEd(false);
  const blocked = conflicts > 0;
  if (done) {
    return (
      <SModal icon="check-circle" iconTone="success" title="Program Yayınlandı" onClose={onClose}
        footer={<React.Fragment><div className="spacer"></div><button className="btn btn-primary" onClick={onClose}>Tamam</button></React.Fragment>}>
        <SuccessBody title={meta.ad + ' · sürüm ' + (meta.ver + 1) + ' yayında'} text={'Program yayınlandı. ' + (notifyT ? '11 öğretmen' : '') + (notifyT && notifyV ? ' ve ' : '') + (notifyV ? '24 veli' : '') + (notifyT || notifyV ? ' bilgilendirildi. ' : '') + 'Yoklama ekranı artık bu çizelgeyi kullanıyor.'} />
      </SModal>
    );
  }
  return (
    <SModal icon="upload-cloud" iconTone={blocked ? 'danger' : 'accent'} title="Programı Yayınla"
      sub={meta.ad + ' · sürüm ' + meta.ver + ' → ' + (meta.ver + 1)} onClose={onClose}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
        <div className="spacer"></div>
        <button className={'btn btn-primary' + (blocked ? ' disabled' : '')} disabled={blocked} onClick={() => { onConfirm({ notifyT, notifyV, note }); setDone(true); }}>
          <Icon name="upload-cloud" size={17} /> Yayınla
        </button>
      </React.Fragment>}>
      {blocked ? (
        <div className="aca-note" style={{ marginTop: 0, marginBottom: 14, background: 'var(--danger-bg)', borderColor: 'color-mix(in srgb, var(--danger) 22%, transparent)', color: '#7A1515' }}>
          <Icon name="alert-triangle" size={15} style={{ color: 'var(--danger)' }} />
          <span><b>{conflicts} açık çakışma</b> çözülmeden yayınlanamaz. Grid'de kırmızı hücreyi düzeltin.</span>
        </div>
      ) : missing > 0 ? (
        <div className="aca-note" style={{ marginTop: 0, marginBottom: 14 }}>
          <Icon name="clock" size={15} />
          <span><b>{missing} eksik saat</b> var. Yine de yayınlayabilirsiniz; eksik saatler taslakta işaretli kalır.</span>
        </div>
      ) : (
        <div className="aca-note ok" style={{ marginTop: 0, marginBottom: 14 }}>
          <Icon name="check-circle" size={15} /><span>Çakışma ve eksik yok — yayınlamaya hazır.</span>
        </div>
      )}
      <div className="fld-l" style={{ marginBottom: 7 }}>Etkilenen kişiler</div>
      <div className="sed-impact">
        <div className="box"><div className="v">24</div><div className="l">Öğrenci</div></div>
        <div className="box"><div className="v">11</div><div className="l">Öğretmen</div></div>
        <div className="box"><div className="v">24</div><div className="l">Veli</div></div>
      </div>
      <div className="fld-l" style={{ marginBottom: 7 }}>Bildirim kapsamı</div>
      <div className="sed-notify">
        <div className="sed-notify-row">
          <span className="ni"><Icon name="briefcase" size={16} /></span>
          <div className="nt"><div className="t">Öğretmenlere bildir</div><div className="s">Programları değişen 11 öğretmen</div></div>
          <button className={'sed-toggle' + (notifyT ? ' on' : '')} onClick={() => setNotifyT((v) => !v)}><i></i></button>
        </div>
        <div className="sed-notify-row">
          <span className="ni"><Icon name="users" size={16} /></span>
          <div className="nt"><div className="t">Velilere bildir</div><div className="s">9-A şubesindeki 24 veli</div></div>
          <button className={'sed-toggle' + (notifyV ? ' on' : '')} onClick={() => setNotifyV((v) => !v)}><i></i></button>
        </div>
      </div>
      <div className="fld">
        <div className="fld-l">Sürüm notu <span className="opt">· opsiyonel</span></div>
        <textarea className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="örn. Cuma son iki saat eklendi, fizik dersliği güncellendi…"></textarea>
      </div>
    </SModal>
  );
}

/* ════════════════ Geri / kaydedilmemiş uyarısı ════════════════ */
function BackConfirmModal({ onClose, onDiscard, onSave }) {
  const SModal = window.Modal;
  return (
    <SModal icon="alert-triangle" iconTone="warning" title="Kaydedilmemiş değişiklikler" sub="Bu programda kaydedilmemiş değişiklikler var" onClose={onClose}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={onClose}>İptal</button>
        <div className="spacer"></div>
        <button className="btn btn-ghost" onClick={onDiscard}>Kaydetmeden çık</button>
        <button className="btn btn-primary" onClick={onSave}><Icon name="check" size={16} /> Kaydet ve çık</button>
      </React.Fragment>}>
      <p style={{ fontSize: 14.5, color: 'var(--text-body)', lineHeight: 1.6 }}>Hub'a dönerseniz son düzenlemeleriniz kaybolur. Çıkmadan önce kaydetmek ister misiniz?</p>
    </SModal>
  );
}

/* ════════════════ Ana ekran ════════════════ */
function ScheduleEditorScreen({ role, t, onNavigate }) {
  const isNew = typeof window !== 'undefined' && window.__schNew === true;
  const isDraft = typeof window !== 'undefined' && window.__schDraft != null;
  const draftId = isDraft ? window.__schDraft : null;
  const targetId = (typeof window !== 'undefined' && window.__schTarget) || '9A';
  const META = { '9A': { ad: '9-A', kademe: 9 }, '9B': { ad: '9-B', kademe: 9 }, '9C': { ad: '9-C', kademe: 9 }, '10A': { ad: '10-A', kademe: 10 }, '10B': { ad: '10-B', kademe: 10 }, '11A': { ad: '11-A', kademe: 11 }, '11B': { ad: '11-B', kademe: 11 }, '12A': { ad: '12-A', kademe: 12 }, '12B': { ad: '12-B', kademe: 12 } };
  const baseMeta = META[targetId] || META['9A'];

  const statePv = t && t.schEditState;            /* 'normal' | 'boş' | 'yükleniyor' */
  const forceLoading = statePv === 'yükleniyor';
  const startEmpty = isNew || statePv === 'boş';

  const [place, setPlace] = useStateEd(() => (startEmpty && !isDraft) ? {} : Object.fromEntries(Object.entries(SED_INIT_PLACE).map(([k, v]) => [k, { ...v }])));
  const [status, setStatus] = useStateEd((startEmpty || isDraft) ? 'taslak' : 'rev');
  const [ver, setVer] = useStateEd(startEmpty ? 1 : 4);
  const [dirty, setDirty] = useStateEd(isDraft);
  const [saving, setSaving] = useStateEd(false);
  const [savedFlash, setSavedFlash] = useStateEd(false);
  const [view, setView] = useStateEd('sinif');
  const [selT, setSelT] = useStateEd(SED_TEACHERS[0].name);
  const [drag, setDrag] = useStateEd(null);        /* {sub} sürüklenen */
  const [over, setOver] = useStateEd(null);        /* {key, ok, reason} */
  const [menu, setMenu] = useStateEd(null);        /* açık hücre menüsü key */
  const [verifyOpen, setVerifyOpen] = useStateEd(false);
  const [flash, setFlash] = useStateEd(null);
  const [modal, setModal] = useStateEd(null);
  const [toast, setToast] = useStateEd(null);
  const [moreMenu, setMoreMenu] = useStateEd(false);
  const mainRef = useRefEd(null);
  const loading = forceLoading;

  function fire(msg, kind) { setToast({ msg, kind }); clearTimeout(window.__sedT); window.__sedT = setTimeout(() => setToast(null), 2800); }

  /* türetilenler */
  const placedCount = useMemoEd(() => {
    const m = {}; Object.values(place).forEach((c) => { m[c.sub] = (m[c.sub] || 0) + 1; }); return m;
  }, [place]);
  const totalPlaced = Object.keys(place).length;
  const remaining = useMemoEd(() => {
    const r = {}; Object.keys(SED_SUBJECTS).forEach((id) => { r[id] = SED_SUBJECTS[id].target - (placedCount[id] || 0); }); return r;
  }, [placedCount]);
  const unplacedIds = Object.keys(SED_SUBJECTS).filter((id) => remaining[id] > 0);
  const allPlaced = unplacedIds.length === 0;

  const conflicts = useMemoEd(() => Object.entries(place).filter(([, c]) => c.conflict).map(([k, c]) => ({ k, c })), [place]);
  const missingCells = useMemoEd(() => {
    const out = [];
    SED_DAYS.forEach((d, di) => SED_REQ.forEach((p) => {
      const k = di + '-' + p;
      if (!place[k] && !SED_LOCKS[k]) out.push(k);
    }));
    return out;
  }, [place]);
  const clean = conflicts.length === 0 && missingCells.length === 0;
  const pubIssues = [
    ...conflicts.map(({ k, c }) => { const [d, p] = k.split('-').map(Number); return { kind: 'bad', title: 'Çakışma · ' + SED_DAYS[d][1] + ' · ' + p + '. ders — ' + SED_SUBJECTS[c.sub].ad, sub: c.reason, cellKey: k }; }),
    ...missingCells.map((k) => { const [d, p] = k.split('-').map(Number); return { kind: 'warn', title: 'Eksik saat · ' + SED_DAYS[d][1] + ' · ' + p + '. ders', sub: 'Boş bırakıldı — bir ders yerleştirin', cellKey: k }; }),
  ];

  /* ── sürükle-bırak ── */
  function dragStart(sub) { setDrag({ sub }); setMenu(null); }
  function dragEnd() { setDrag(null); setOver(null); }
  function cellDragOver(ky, e) {
    if (!drag) return;
    e.preventDefault();
    const sub = drag.sub;
    let ok = true, reason = 'Buraya bırak';
    if (SED_LOCKS[ky]) { ok = false; reason = 'Slot kilitli — öğretmen müsait değil'; }
    else if (SED_BUSY[sub] && SED_BUSY[sub][ky]) { ok = false; reason = SED_SUBJECTS[sub].teacher + ' · ' + SED_BUSY[sub][ky] + "'de meşgul"; }
    if (!over || over.key !== ky || over.ok !== ok) setOver({ key: ky, ok, reason });
  }
  function cellDragLeave() { /* bırakınca diğer hücre devralır */ }
  function cellDrop(ky, e) {
    e.preventDefault();
    if (!drag) return;
    const sub = drag.sub;
    if (SED_LOCKS[ky] || (SED_BUSY[sub] && SED_BUSY[sub][ky])) {
      fire(<span><b>Yerleştirilemedi</b> · {SED_LOCKS[ky] ? 'slot kilitli' : SED_SUBJECTS[sub].teacher + ' meşgul'}</span>, 'bad');
      setDrag(null); setOver(null); return;
    }
    setPlace((pl) => ({ ...pl, [ky]: { sub } }));
    setDirty(true); setDrag(null); setOver(null);
    fire(<span><b>{SED_SUBJECTS[sub].ad}</b> yerleştirildi</span>, 'ok');
  }

  /* ── hücre menüsü ── */
  function menuAction(ky, action, val) {
    const cell = place[ky];
    if (!cell) return;
    if (action === 'remove') {
      setPlace((pl) => {
        const n = { ...pl }; delete n[ky];
        if (cell.block) { const [d, p] = ky.split('-').map(Number); const partner = d + '-' + (cell.block === 'start' ? p + 1 : p - 1); delete n[partner]; }
        return n;
      });
    } else if (action === 'split') {
      setPlace((pl) => {
        const n = { ...pl }; const [d, p] = ky.split('-').map(Number);
        const partner = d + '-' + (cell.block === 'start' ? p + 1 : p - 1);
        if (n[ky]) n[ky] = { ...n[ky], block: undefined };
        if (n[partner]) n[partner] = { ...n[partner], block: undefined };
        return n;
      });
    } else if (action === 'teacher') {
      setPlace((pl) => ({ ...pl, [ky]: { ...pl[ky], teacher: val } }));
    } else if (action === 'room') {
      setPlace((pl) => ({ ...pl, [ky]: { ...pl[ky], room: val } }));
    }
    setDirty(true); setMenu(null);
  }

  /* ── kaydet / yayınla / geri ── */
  function save(after) {
    setSaving(true);
    setTimeout(() => {
      setSaving(false); setDirty(false); setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
      if (after === 'exit') onNavigate('schedule');
      else fire(<span>Değişiklikler <b>kaydedildi</b></span>, 'ok');
    }, 750);
  }
  function publish() { setModal({ type: 'publish' }); setMoreMenu(false); }
  function onPublished(opts) { setStatus('pub'); setVer((v) => v + 1); setDirty(false); }
  function back() { if (dirty) setModal({ type: 'back' }); else onNavigate('schedule'); }
  function verify() {
    setVerifyOpen((o) => !o);
    if (!verifyOpen) fire(clean ? <span><b>Doğrulandı</b> · sorun yok</span> : <span>{conflicts.length} çakışma · {missingCells.length} eksik saat</span>, clean ? 'ok' : 'bad');
  }
  function flashTo(ky) {
    setFlash(ky); setView('sinif');
    setTimeout(() => {
      const el = mainRef.current && mainRef.current.querySelector('[data-key="' + ky + '"]');
      if (el && mainRef.current) mainRef.current.scrollTo({ top: Math.max(0, el.offsetTop - 90), behavior: 'smooth' });
    }, 30);
    setTimeout(() => setFlash(null), 1500);
  }

  useEffectEd(() => {
    if (!menu && !moreMenu) return;
    const onDoc = (e) => {
      if (e.target.closest && e.target.closest('.sed-cmenu, .rmenu, .cc-more')) return;
      setMenu(null); setMoreMenu(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menu, moreMenu]);

  /* öğretmen görünümü: seçilen öğretmenin durumu */
  function teacherCellState(ky) {
    const cell = place[ky];
    if (cell && (cell.teacher || SED_SUBJECTS[cell.sub].teacher) === selT) return 'mine';
    /* harici meşgul mü? */
    const busySub = Object.keys(SED_BUSY).find((s) => SED_SUBJECTS[s].teacher === selT && SED_BUSY[s][ky]);
    if (busySub) return 'busy';
    if (SED_LOCKS[ky] && SED_LOCKS[ky].indexOf(selT.split(' ')[0]) !== -1) return 'lock';
    return cell ? 'other' : 'none';
  }

  const statusMeta = { pub: { cls: 'pub', label: 'Yayın' }, taslak: { cls: 'draft', label: 'Taslak' }, rev: { cls: 'rev', label: 'Revize ediliyor' } }[status];

  /* ── grid satırlarını dizilimle (ara satırlar dahil) ── */
  function renderRows() {
    const rows = [];
    SED_PERIODS.forEach((per, idx) => {
      rows.push(
        <React.Fragment key={'p' + per.p}>
          <div className="sed-time"><span className="p">{per.p}</span><span className="h">{per.a}<br />{per.b}</span></div>
          {SED_DAYS.map((d, di) => {
            const ky = di + '-' + per.p;
            const cell = place[ky];
            const locked = SED_LOCKS[ky];
            const optional = !SED_REQ.includes(per.p);
            const missing = !cell && !locked && SED_REQ.includes(per.p);
            const dg = over && over.key === ky ? over : null;
            return (
              <GridCell key={view + '-' + ky} ky={ky} cell={cell} locked={view === 'sinif' ? locked : null}
                optional={optional} missing={view === 'sinif' ? missing : false}
                drag={view === 'sinif' ? dg : null} view={view} tv={view === 'ogretmen' ? teacherCellState(ky) : null}
                onDragOver={cellDragOver} onDragLeave={cellDragLeave} onDrop={cellDrop}
                onOpenMenu={(k) => setMenu(k)} menuOpen={menu === ky} onMenuAction={menuAction} onMenuClose={() => setMenu(null)}
                flash={flash === ky} />
            );
          })}
        </React.Fragment>
      );
      if (per.p === 2 || per.p === 6) rows.push(<div className="sed-break" key={'br' + per.p}><span className="ln"></span><span className="lbl"><Icon name="coffee" size={11} /> Teneffüs</span><span className="ln"></span></div>);
      if (per.p === 4) rows.push(<div className="sed-break lunch" key="lunch"><span className="ln"></span><span className="lbl"><Icon name="utensils" size={11} /> Öğle Arası</span><span className="ln"></span></div>);
    });
    return rows;
  }

  return (
    <div className="sched-ed" data-screen-label={'Program Editörü · ' + baseMeta.ad}>
      {/* ── üst şerit ── */}
      <div className="sed-top">
        <button className="sed-back" onClick={back} title="Hub'a dön"><Icon name="chevron-left" size={20} /></button>
        <div className="sed-id">
          <div className="breadcrumb">
            <button onClick={() => onNavigate('schedule')}>Akademik</button>
            <Icon name="chevron-right" size={13} className="sep" />
            <button onClick={() => onNavigate('schedule')}>Ders Programı</button>
            <Icon name="chevron-right" size={13} className="sep" />
            <span>{baseMeta.ad}</span>
          </div>
          <div className="sed-title">
            <h1>{baseMeta.ad} · Sınıf Programı</h1>
            <span className={'sch-st ' + statusMeta.cls}><span className="d"></span>{statusMeta.label}</span>
            <span className="sch-ver">v{ver}</span>
          </div>
        </div>
        <div className="sed-grow"></div>
        <div className="sed-seg">
          <button className={view === 'sinif' ? 'on' : ''} onClick={() => setView('sinif')}><Icon name="grid" size={15} /> Sınıf görünümü</button>
          <button className={view === 'ogretmen' ? 'on' : ''} onClick={() => { setView('ogretmen'); setMenu(null); }}><Icon name="user" size={15} /> Öğretmen görünümü</button>
        </div>
        <div className="sed-acts">
          <button className="btn btn-ghost" onClick={verify}><Icon name="shield-check" size={16} /> Doğrula</button>
          <button className={'btn btn-ghost sed-save' + (dirty ? '' : ' disabled')} disabled={!dirty || saving} onClick={() => save()}>
            {saving ? <span className="btn-spin"></span> : <Icon name={savedFlash ? 'check' : 'save'} size={16} />}
            {saving ? 'Kaydediliyor' : savedFlash ? 'Kaydedildi' : 'Kaydet'}
            {dirty && !saving && <span className="dirty"><Icon name="circle-dot" size={9} /></span>}
          </button>
          <button className="btn btn-primary" onClick={publish}><Icon name="upload-cloud" size={17} /> Yayınla</button>
          <div className="rmenu" onClick={(e) => e.stopPropagation()}>
            <button className="tb-icon-btn" onClick={() => setMoreMenu((o) => !o)}><Icon name="more-horizontal" size={18} /></button>
            {moreMenu && (
              <div className="rmenu-pop">
                <button className="rmenu-item"><Icon name="copy" size={15} /> Programı çoğalt</button>
                <button className="rmenu-item"><Icon name="history" size={15} /> Sürüm geçmişi</button>
                <button className="rmenu-item"><Icon name="download" size={15} /> PDF dışa aktar</button>
                <div className="rmenu-sep"></div>
                <button className="rmenu-item danger"><Icon name="trash-2" size={15} /> Programı sil</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── gövde ── */}
      <div className="sed-body">
        {/* sol panel */}
        <aside className="sed-side">
          <div className="sed-side-head">
            <div className="t">Yerleştirilmemiş dersler</div>
            <div className="s">Çipi grid'e sürükleyin</div>
            <div className="sed-prog">
              <div className="sed-prog-top">
                <span className="v">{loading ? '—' : totalPlaced} <span>/ 30 saat</span></span>
                <span className="pct">{loading ? '' : '%' + Math.round(totalPlaced / 30 * 100)}</span>
              </div>
              <div className="sed-prog-bar"><div className={'sed-prog-fill' + (allPlaced ? ' done' : '')} style={{ width: (loading ? 0 : totalPlaced / 30 * 100) + '%' }}></div></div>
            </div>
          </div>
          <div className="sed-chips">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="sed-sk" style={{ height: 52 }}></div>)
            ) : allPlaced ? (
              <div className="sed-chips-empty">
                <div className="ic"><Icon name="check" size={22} strokeWidth={2.4} /></div>
                Tüm dersler yerleşti.<br />30 / 30 saat tamamlandı.
              </div>
            ) : (
              Object.keys(SED_SUBJECTS).map((id) => (
                <SubjectChip key={id} id={id} rem={remaining[id]} dragging={drag && drag.sub === id} onDragStart={dragStart} onDragEnd={dragEnd} />
              ))
            )}
          </div>
        </aside>

        {/* orta grid */}
        <div className="sed-main" ref={mainRef}>
          {view === 'ogretmen' && !loading && (
            <div className="sed-teacher-bar">
              <div className="sed-tsel">
                <span className="av" style={{ background: sedAv(selT) }}>{sedIni(selT)}</span>
                <select value={selT} onChange={(e) => setSelT(e.target.value)}>
                  {SED_TEACHERS.map((tc) => <option key={tc.name} value={tc.name}>{tc.name} · {tc.brans}</option>)}
                </select>
              </div>
              <span className="sed-ro-note"><Icon name="eye" size={14} /> Salt-okunur · {baseMeta.ad} merceği</span>
            </div>
          )}
          {view === 'sinif' && !loading && (
            startEmpty && totalPlaced === 0
              ? <div className="sed-hint" style={{ alignItems: 'center' }}><Icon name="info" size={15} /> Boş program — soldaki ders çiplerini sürükleyerek başlayın ya da <button onClick={() => setModal({ type: 'auto' })} style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'underline', padding: 0 }}>otomatik oluşturun</button>. 30 saat yerleştirilmeli.</div>
              : <div className="sed-hint"><Icon name="info" size={15} /> Bir dersi sürüklerken hedef hücre uygunsa <b>yeşil</b>, çakışıyorsa <b>kırmızı</b> yanar.</div>
          )}

          {loading ? (
            <div className="sed-grid">
              <div></div>
              {SED_DAYS.map((d) => <div key={d[0]} className="sed-sk" style={{ height: 40 }}></div>)}
              {Array.from({ length: 8 }).map((_, ri) => (
                <React.Fragment key={ri}>
                  <div className="sed-sk" style={{ height: 60, width: 36, justifySelf: 'end' }}></div>
                  {SED_DAYS.map((d) => <div key={d[0]} className="sed-sk" style={{ height: 62 }}></div>)}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="sed-cal">
              <div className="sed-grid sed-grid-head">
                <div className="sed-gh time"></div>
                {SED_DAYS.map((d) => <div key={d[0]} className={'sed-gh day' + (d[0] === 'Sal' ? ' today' : '')}><div className="d">{d[0]}</div><div className="n">{d[1]}</div></div>)}
              </div>
              <div className="sed-grid sed-grid-body">
                {renderRows()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── alt doğrulama çubuğu ── */}
      <div className="sed-valbar">
        {verifyOpen && !loading && (
          <div className="sed-issues">
            <div className="sed-issues-h">Doğrulama · {conflicts.length + missingCells.length} sorun</div>
            {clean && <div className="sed-issue-ok"><Icon name="check-circle" size={17} /> Çakışma yok, tüm saatler yerleşti — yayına hazır.</div>}
            {conflicts.map(({ k, c }) => {
              const [d, p] = k.split('-').map(Number);
              return (
                <button key={k} className="sed-issue bad" onClick={() => flashTo(k)}>
                  <span className="ii"><Icon name="alert-triangle" size={15} /></span>
                  <span className="it"><span className="t">Çakışma · {SED_DAYS[d][1]} · {p}. ders — {SED_SUBJECTS[c.sub].ad}</span><span className="s">{c.reason}</span></span>
                  <span className="go">Hücreye git <Icon name="arrow-right" size={13} /></span>
                </button>
              );
            })}
            {missingCells.map((k) => {
              const [d, p] = k.split('-').map(Number);
              return (
                <button key={k} className="sed-issue warn" onClick={() => flashTo(k)}>
                  <span className="ii"><Icon name="clock" size={15} /></span>
                  <span className="it"><span className="t">Eksik saat · {SED_DAYS[d][1]} · {p}. ders</span><span className="s">Boş bırakıldı — bir ders yerleştirin</span></span>
                  <span className="go">Hücreye git <Icon name="arrow-right" size={13} /></span>
                </button>
              );
            })}
          </div>
        )}
        <div className="sed-valbar-main">
          <div className="sed-status">
            {loading ? <span className="sch-upd">Doğrulama bekleniyor…</span>
              : clean ? <span className="pill ok"><Icon name="check-circle" size={15} /> Yayına hazır</span>
                : <React.Fragment>
                  {conflicts.length > 0 && <span className="pill bad"><Icon name="alert-triangle" size={15} /> {conflicts.length} çakışma</span>}
                  {missingCells.length > 0 && <span className="pill warn"><Icon name="clock" size={15} /> {missingCells.length} eksik saat</span>}
                </React.Fragment>}
          </div>
          <div className="sed-val-grow"></div>
          <div className="sed-legend">
            <span className="sed-leg ok"><span className="sw"></span> Uygun</span>
            <span className="sed-leg bad"><span className="sw"></span> Çakışma</span>
            <span className="sed-leg warn"><span className="sw"></span> Boş / eksik</span>
            <span className="sed-leg lock"><span className="sw"></span> Müsait değil</span>
          </div>
          <button className={'sed-doverify' + (verifyOpen ? ' on' : '')} onClick={verify} disabled={loading}>
            <Icon name="shield-check" size={16} /> Doğrula {!clean && !loading && <span style={{ fontWeight: 800 }}>· {conflicts.length + missingCells.length}</span>}
          </button>
        </div>
      </div>

      {modal && modal.type === 'publish' && <PublishFlow meta={{ ad: baseMeta.ad, ver }} conflicts={conflicts.length} missing={missingCells.length} issues={pubIssues} affected={{ teachers: 3, students: 28, parents: 26 }} onGotoCell={(k) => { setModal(null); flashTo(k); }} onClose={() => setModal(null)} onPublished={onPublished} />}
      {modal && modal.type === 'back' && <BackConfirmModal onClose={() => setModal(null)} onDiscard={() => onNavigate('schedule')} onSave={() => { setModal(null); save('exit'); }} />}
      {modal && modal.type === 'auto' && <AutoGenFlow defaultClass={targetId} classes={Object.keys(META).map((k) => ({ id: k, ad: META[k].ad, kademe: META[k].kademe }))} onClose={() => setModal(null)} onUseDraft={(clsId, draftId) => { setPlace(Object.fromEntries(Object.entries(SED_INIT_PLACE).map(([k, v]) => [k, { ...v }]))); setStatus('taslak'); setDirty(true); setModal(null); fire(<span><b>Taslak {draftId}</b> editöre yüklendi — elle ince ayar yapabilirsiniz.</span>, 'ok'); }} />}

      {toast && (
        <div className={'sed-toast' + (toast.kind === 'ok' ? ' ok' : toast.kind === 'bad' ? ' bad' : '')}>
          <span className="ti"><Icon name={toast.kind === 'ok' ? 'check' : toast.kind === 'bad' ? 'x' : 'arrow-right'} size={16} strokeWidth={2.6} /></span>
          <span className="tx">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ScheduleEditorScreen });
