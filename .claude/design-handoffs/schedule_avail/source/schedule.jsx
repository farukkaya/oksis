/* OKSİS — Akademik · Ders Programı (hub)
   "Dersler & Branşlar" ile birebir aynı kalıp: PageTop → özet şeridi →
   sekmeler (üç mercek) → filtre çubuğu → tablo. Üç mercek aynı dönem
   verisinin farklı bakışları; sekme değişince filtre + sütunlar uyarlanır. */
const { useState: useStateSch, useMemo: useMemoSch } = React;

const SchFilter = window.StuFilter;

/* ════════════════ Örnek veri — Atlas Koleji ════════════════ */
/* Sınıf programları: [sınıf, kademe, durum, çakışma, eksikSaat, sonGünc, sürüm] */
const SCH_CLASSES = [
  { id: '9A',  ad: '9-A',  kademe: 9,  durum: 'pub',   conf: 0, miss: 0, avail: 1, upd: 'Bugün · 09:14',  who: 'A. Yılmaz',  ver: 4 },
  { id: '9B',  ad: '9-B',  kademe: 9,  durum: 'pub',   conf: 0, miss: 0, avail: 0, upd: 'Dün · 16:42',     who: 'A. Yılmaz',  ver: 2 },
  { id: '9C',  ad: '9-C',  kademe: 9,  durum: 'rev',   conf: 1, miss: 0, avail: 2, upd: 'Bugün · 11:08',   who: 'S. Aydın',   ver: 4 },
  { id: '10A', ad: '10-A', kademe: 10, durum: 'taslak',conf: 2, miss: 4, avail: 3, upd: '9 Haz · 14:20',   who: 'M. Eren',    ver: 1 },
  { id: '10B', ad: '10-B', kademe: 10, durum: 'pub',   conf: 0, miss: 0, avail: 0, upd: '8 Haz · 10:05',   who: 'D. Koral',   ver: 5 },
  { id: '11A', ad: '11-A', kademe: 11, durum: 'taslak',conf: 0, miss: 6, avail: 1, upd: '7 Haz · 15:33',   who: 'H. Kılıç',   ver: 1 },
  { id: '11B', ad: '11-B', kademe: 11, durum: 'taslak',conf: 3, miss: 8, avail: 4, upd: '6 Haz · 09:50',   who: 'N. Güneş',   ver: 1 },
  { id: '12A', ad: '12-A', kademe: 12, durum: 'pub',   conf: 0, miss: 0, avail: 0, upd: '5 Haz · 17:12',   who: 'L. Brown',   ver: 3 },
  { id: '12B', ad: '12-B', kademe: 12, durum: 'rev',   conf: 1, miss: 2, avail: 1, upd: 'Bugün · 08:36',   who: 'L. Brown',   ver: 2 },
];

/* Öğretmen programları: branş ACA_BR'den; [öğretmen, yük, boş, nöbet, durum] */
const SCH_TEACHERS = [
  { id: 't01', ad: 'Ahmet Yılmaz', brans: 'mat', yuk: 28, bos: 2, nobet: 'Pzt · Bahçe',  durum: 'pub' },
  { id: 't02', ad: 'Burak Tekin',  brans: 'mat', yuk: 30, bos: 0, nobet: 'Çar · Kat-2',  durum: 'pub' },
  { id: 't03', ad: 'Ayşe Demir',   brans: 'fiz', yuk: 22, bos: 6, nobet: '—',            durum: 'pub' },
  { id: 't04', ad: 'Selin Aydın',  brans: 'tde', yuk: 26, bos: 3, nobet: 'Sal · Yemekh.',durum: 'rev' },
  { id: 't06', ad: 'Derya Koral',  brans: 'kim', yuk: 18, bos: 8, nobet: '—',            durum: 'taslak' },
  { id: 't08', ad: 'Hasan Kılıç',  brans: 'tar', yuk: 24, bos: 4, nobet: 'Per · Bahçe',  durum: 'pub' },
  { id: 't09', ad: 'Nazlı Güneş',  brans: 'cog', yuk: 20, bos: 7, nobet: '—',            durum: 'taslak' },
  { id: 't10', ad: 'Leyla Brown',  brans: 'ing', yuk: 27, bos: 2, nobet: 'Cum · Kat-1',  durum: 'pub' },
  { id: 't13', ad: 'Cenk Aral',    brans: 'bed', yuk: 25, bos: 5, nobet: 'Pzt · Spor S.', durum: 'pub' },
  { id: 't15', ad: 'Tuna Berk',    brans: 'bil', yuk: 16, bos: 9, nobet: '—',            durum: 'rev' },
];

/* Derslik doluluğu: [derslik, tür, doluluk%, çakışma] */
const SCH_ROOMS = [
  { id: 'B-201', ad: 'B-201', tur: 'normal', occ: 92, conf: 0 },
  { id: 'B-202', ad: 'B-202', tur: 'normal', occ: 88, conf: 0 },
  { id: 'B-204', ad: 'B-204', tur: 'normal', occ: 96, conf: 1 },
  { id: 'B-205', ad: 'B-205', tur: 'normal', occ: 74, conf: 0 },
  { id: 'LAB-F', ad: 'Fizik Lab.',     tur: 'lab',   occ: 64, conf: 0 },
  { id: 'LAB-K', ad: 'Kimya Lab.',     tur: 'lab',   occ: 58, conf: 0 },
  { id: 'LAB-B', ad: 'Bilişim Lab.',   tur: 'lab',   occ: 81, conf: 2 },
  { id: 'SLN-K', ad: 'Konferans Salonu', tur: 'salon', occ: 41, conf: 0 },
  { id: 'SLN-S', ad: 'Spor Salonu',      tur: 'salon', occ: 86, conf: 1 },
  { id: 'MUZ',   ad: 'Müzik Odası',      tur: 'normal', occ: 52, conf: 0 },
];

const SCH_AV_COLORS = ['#2F4DA0', '#A93B62', '#5B45B0', '#0C6B66', '#2E7D36', '#92600F', '#146C94', '#5F6B16', '#B45A0C', '#28617A'];
const schAvColor = (s) => SCH_AV_COLORS[(s.charCodeAt(0) + s.length) % SCH_AV_COLORS.length];
const schInitials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const SCH_DURUM_META = {
  pub:    { cls: 'pub',   label: 'Yayın' },
  taslak: { cls: 'draft', label: 'Taslak' },
  rev:    { cls: 'rev',   label: 'Revize ediliyor' },
};
const SCH_TUR_META = {
  normal: { cls: '',      icon: 'grid',       label: 'Normal' },
  lab:    { cls: 'lab',   icon: 'flask-conical', label: 'Laboratuvar' },
  salon:  { cls: 'salon', icon: 'building',   label: 'Salon' },
};

/* ════════════════ Küçük bileşenler ════════════════ */
function SchStatus({ kind }) {
  const m = SCH_DURUM_META[kind] || SCH_DURUM_META.taslak;
  return <span className={'sch-st ' + m.cls}><span className="d"></span>{m.label}</span>;
}
function SchCount({ n, kind }) {
  const z = n === 0;
  return (
    <span className={'sch-cnt ' + (z ? 'zero' : kind)}>
      <Icon name={kind === 'conf' ? 'alert-triangle' : 'clock'} size={13} />{n}
    </span>
  );
}
/* Müsaitlik ihlali sayacı — amber (çakışmanın kırmızısından ayrı). 0 → nötr zero. */
function SchAvail({ n }) {
  const z = n === 0;
  return (
    <span className={'sch-cnt avail' + (z ? ' zero' : '')} title={z ? 'Müsaitlik ihlali yok' : n + ' müsaitlik ihlali'}>
      <Icon name="ban" size={13} />{n}
    </span>
  );
}
function SchTur({ tur }) {
  const m = SCH_TUR_META[tur] || SCH_TUR_META.normal;
  return <span className={'sch-tur ' + m.cls}><Icon name={m.icon} size={13} />{m.label}</span>;
}
function SchOcc({ pct }) {
  const tone = pct >= 90 ? 'high' : pct >= 75 ? 'mid' : '';
  return (
    <div className="sch-occ">
      <div className="track"><div className={'fill ' + tone} style={{ width: pct + '%' }}></div></div>
      <span className="pct">%{pct}</span>
    </div>
  );
}

/* ════════════════ Yeni Program modalı (sınıf seçimi → editör) ════════════════ */
function NewProgramModal({ onClose, onGo }) {
  const SModal = window.Modal;
  const [sel, setSel] = useStateSch(null);
  return (
    <SModal
      icon="calendar-plus" title="Yeni Program" sub="Bir sınıf seçin — Program Editörü boş bir haftalık çizelgeyle açılır"
      onClose={onClose}
      footer={
        <React.Fragment>
          <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
          <div className="spacer"></div>
          <button className={'btn btn-primary' + (sel ? '' : ' disabled')} disabled={!sel} onClick={() => onGo(sel)}>
            <Icon name="arrow-right" size={17} /> Editöre Geç
          </button>
        </React.Fragment>
      }
    >
      <div className="fld-l" style={{ marginBottom: 8 }}>Sınıf / Şube</div>
      <div className="sch-pick">
        {SCH_CLASSES.map((c) => (
          <button key={c.id} className={'sch-pick-row' + (sel === c.id ? ' on' : '')} onClick={() => setSel(c.id)}>
            <span className="tag">{c.ad}</span>
            <span className="meta">
              <span className="t">{c.ad} programı</span>
              <span className="s">{c.kademe}. sınıf · {SCH_DURUM_META[c.durum].label} · sürüm {c.ver}</span>
            </span>
            <span className="ck"><Icon name="check" size={13} strokeWidth={3} /></span>
          </button>
        ))}
      </div>
    </SModal>
  );
}

/* ════════════════ Otomatik Oluştur modalı (taslak önizleme) ════════════════ */
function AutoGenModal({ onClose, onBuild }) {
  const SModal = window.Modal;
  const [lvl, setLvl] = useStateSch([9, 10, 11, 12]);
  const toggle = (l) => setLvl((s) => s.indexOf(l) !== -1 ? s.filter((x) => x !== l) : [...s, l].sort((a, b) => a - b));
  const targets = SCH_CLASSES.filter((c) => lvl.indexOf(c.kademe) !== -1);
  return (
    <SModal
      icon="sparkles" iconTone="accent" title="Otomatik Oluştur" sub="Görevlendirmeler ve zil programından çakışmasız taslak üretir"
      onClose={onClose}
      footer={
        <React.Fragment>
          <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
          <div className="spacer"></div>
          <button className={'btn btn-primary' + (targets.length ? '' : ' disabled')} disabled={!targets.length} onClick={() => onBuild(targets.length)}>
            <Icon name="wand-2" size={17} /> {targets.length} Sınıf İçin Taslak Üret
          </button>
        </React.Fragment>
      }
    >
      <div className="fld">
        <div className="fld-l">Kapsam — kademeler</div>
        <div className="chip-grid">
          {[9, 10, 11, 12].map((l) => (
            <button key={l} className={'chip-pick' + (lvl.indexOf(l) !== -1 ? ' on' : '')} onClick={() => toggle(l)}>
              <span className="ck"><Icon name="check" size={11} strokeWidth={3} /></span>{l}. Sınıf
            </button>
          ))}
        </div>
      </div>
      <div className="fld-l" style={{ marginTop: 4, marginBottom: 6 }}>Üretilecek programlar <span className="opt">· {targets.length} sınıf</span></div>
      <div className="sch-auto-list">
        {targets.length === 0 && <div className="aca-note" style={{ marginTop: 0 }}><Icon name="info" size={15} /><span>En az bir kademe seçin.</span></div>}
        {targets.slice(0, 5).map((c) => (
          <div className="sch-auto-row" key={c.id}>
            <span className="tag">{c.ad}</span>
            <div className="gr">
              <div><b>{c.ad}</b> · 30 saat yerleşecek</div>
              <div className="sch-auto-bar"><i style={{ width: (60 + (c.id.charCodeAt(1) % 35)) + '%' }}></i></div>
            </div>
          </div>
        ))}
        {targets.length > 5 && <div className="sch-upd" style={{ paddingLeft: 4 }}>+{targets.length - 5} sınıf daha…</div>}
      </div>
      <div className="aca-note" style={{ marginBottom: 0 }}>
        <Icon name="info" size={15} />
        <span>Üretilen programlar <b>Taslak</b> olarak kaydedilir; yayınlamadan önce çakışmaları gözden geçirebilirsiniz.</span>
      </div>
    </SModal>
  );
}

/* ════════════════ Yayınla onay modalı ════════════════ */
function PublishModal({ row, onClose, onConfirm }) {
  const SModal = window.Modal;
  const [done, setDone] = useStateSch(false);
  const blocked = row.conf > 0;
  if (done) {
    return (
      <SModal icon="check-circle" iconTone="success" title="Program Yayınlandı" onClose={onClose}
        footer={<React.Fragment><div className="spacer"></div><button className="btn btn-primary" onClick={onClose}>Tamam</button></React.Fragment>}>
        <SuccessBody title={row.ad + ' programı yayınlandı'} text="Sürüm artırıldı. Öğretmen ve veli portallarındaki haftalık programlar güncellendi; ilgili kullanıcılara bildirim gönderildi." />
      </SModal>
    );
  }
  return (
    <SModal
      icon="upload-cloud" iconTone={blocked ? 'danger' : 'accent'} title="Programı Yayınla"
      sub={row.ad + ' · sürüm ' + row.ver + ' → ' + (row.ver + 1)} onClose={onClose}
      footer={
        <React.Fragment>
          <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
          <div className="spacer"></div>
          <button className={'btn btn-primary' + (blocked ? ' disabled' : '')} disabled={blocked} onClick={() => { onConfirm(); setDone(true); }}>
            <Icon name="upload-cloud" size={17} /> Yayınla
          </button>
        </React.Fragment>
      }
    >
      <p style={{ fontSize: 14.5, color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 12 }}>
        <b>{row.ad}</b> sınıf programı yayınlanınca öğretmen ve veli portallarında görünür hâle gelir ve yoklama ekranı bu çizelgeyi kullanır.
      </p>
      {blocked ? (
        <div className="aca-note" style={{ marginTop: 0, marginBottom: 0, background: 'var(--danger-bg)', borderColor: 'color-mix(in srgb, var(--danger) 22%, transparent)', color: '#7A1515' }}>
          <Icon name="alert-triangle" size={15} style={{ color: 'var(--danger)' }} />
          <span><b>{row.conf} açık çakışma</b> var — yayınlamadan önce Program Editörü'nde çözülmeli.</span>
        </div>
      ) : row.miss > 0 ? (
        <div className="aca-note" style={{ marginTop: 0, marginBottom: 0 }}>
          <Icon name="clock" size={15} />
          <span><b>{row.miss} eksik saat</b> var. Yine de yayınlayabilirsiniz; eksikler taslak olarak işaretli kalır.</span>
        </div>
      ) : (
        <div className="aca-note ok" style={{ marginTop: 0, marginBottom: 0 }}>
          <Icon name="check-circle" size={15} />
          <span>Çakışma ve eksik saat yok — yayınlamaya hazır.</span>
        </div>
      )}
    </SModal>
  );
}

/* ════════════════ Tablo gövdeleri (mercek başına) ════════════════ */
function ClassRows({ rows, onOpen, onPublish }) {
  return (
    <tbody>
      {rows.map((c) => (
        <tr key={c.id} onClick={() => onOpen(c)}>
          <td>
            <span className="sch-cls">
              <span className="tag">{c.ad}</span>
              <span className="tx"><span className="nm">{c.ad}</span><span className="sb">Atlas Koleji · Lise</span></span>
            </span>
          </td>
          <td><span className="sch-lvl">{c.kademe}</span></td>
          <td><SchStatus kind={c.durum} /></td>
          <td><SchCount n={c.conf} kind="conf" /></td>
          <td><SchCount n={c.miss} kind="miss" /></td>
          <td><SchAvail n={c.avail} /></td>
          <td><span className="sch-upd"><b>{c.upd}</b></span></td>
          <td><span className="sch-ver">v{c.ver}</span></td>
          <td className="col-actions" onClick={(e) => e.stopPropagation()}>
            <div className="sch-rowacts">
              <button className="sch-link go" onClick={() => onOpen(c)}><Icon name="pencil-ruler" size={14} /> Aç</button>
              {c.durum !== 'pub' && (
                <button className="sch-link pub" onClick={() => onPublish(c)}><Icon name="upload-cloud" size={14} /> Yayınla</button>
              )}
              <AcaRowMenu items={[
                { icon: 'pencil-ruler', label: 'Editörde Aç', onClick: () => onOpen(c) },
                { icon: 'upload-cloud', label: 'Yayınla', disabled: c.durum === 'pub', tip: c.durum === 'pub' ? 'Zaten yayında' : undefined, onClick: () => onPublish(c) },
                { icon: 'copy', label: 'Çoğalt' },
                { icon: 'history', label: 'Sürüm geçmişi' },
                { sep: true },
                { icon: 'download', label: 'PDF dışa aktar' },
              ]} />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

function TeacherRows({ rows, onView }) {
  return (
    <tbody>
      {rows.map((t) => {
        const br = ACA_BR[t.brans] || { ad: '—', fg: 'var(--text-faint)' };
        return (
          <tr key={t.id} onClick={() => onView(t)}>
            <td>
              <span className="sch-t">
                <span className="sch-av" style={{ background: schAvColor(t.ad) }}>{schInitials(t.ad)}</span>
                <span className="tx"><span className="tn">{t.ad}</span><span className="tb">Atlas Koleji</span></span>
              </span>
            </td>
            <td><span className="aca-branch neutral"><span className="bd" style={{ background: br.fg }}></span>{br.ad}</span></td>
            <td><span className="sch-load">{t.yuk} <span>/ 30 sa</span></span></td>
            <td><span className={'sch-win' + (t.bos <= 2 ? ' calm' : '')}><Icon name="square-dashed" size={14} />{t.bos} saat</span></td>
            <td>{t.nobet === '—'
              ? <span className="sch-nobet"><span className="none">Atanmadı</span></span>
              : <span className="sch-nobet on"><Icon name="shield" size={13} />{t.nobet}</span>}</td>
            <td><SchStatus kind={t.durum} /></td>
            <td className="col-actions" onClick={(e) => e.stopPropagation()}>
              <div className="sch-rowacts">
                <button className="sch-link" onClick={() => onView(t)}><Icon name="eye" size={14} /> Görüntüle</button>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}

function RoomRows({ rows, onView }) {
  return (
    <tbody>
      {rows.map((r) => (
        <tr key={r.id} onClick={() => onView(r)}>
          <td><span style={{ fontWeight: 700, color: 'var(--text)' }}>{r.ad}</span></td>
          <td><SchTur tur={r.tur} /></td>
          <td><SchOcc pct={r.occ} /></td>
          <td><SchCount n={r.conf} kind="conf" /></td>
          <td className="col-actions" onClick={(e) => e.stopPropagation()}>
            <div className="sch-rowacts">
              <button className="sch-link" onClick={() => onView(r)}><Icon name="eye" size={14} /> Görüntüle</button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/* ════════════════ Ana ekran ════════════════ */
function ScheduleScreen({ role, t, onNavigate }) {
  const [lens, setLens] = useStateSch('sinif');          /* sinif · ogretmen · derslik */
  const [q, setQ] = useStateSch('');
  const [fLvl, setFLvl] = useStateSch([]);
  const [fDurum, setFDurum] = useStateSch('');
  const [fBrans, setFBrans] = useStateSch('');
  const [fTur, setFTur] = useStateSch('');
  const [flag, setFlag] = useStateSch('');               /* özet şeridi hızlı filtresi */
  const [modal, setModal] = useStateSch(null);
  const [toast, setToast] = useStateSch(null);

  const statePreview = t && t.schState;                  /* 'normal' | 'boş' | 'yükleniyor' */
  const loading = statePreview === 'yükleniyor';
  const forceEmpty = statePreview === 'boş';

  function fire(msg, ok) {
    setToast({ msg, ok });
    clearTimeout(window.__schToast);
    window.__schToast = setTimeout(() => setToast(null), 3200);
  }
  function openEditor(c) { window.__schTarget = c.id; window.__schNew = false; window.__schDraft = null; onNavigate('scheduleEditor'); }
  function viewTeacher(t) { fire(<span><b>{t.ad}</b> · haftalık program görüntüleniyor…</span>); }
  function viewRoom(r) { fire(<span><b>{r.ad}</b> · derslik doluluk takvimi açılıyor…</span>); }

  /* özet sayaçları (sınıf merceğine ait — her zaman görünür) */
  const sum = useMemoSch(() => ({
    pub:   SCH_CLASSES.filter((c) => c.durum === 'pub').length,
    draft: SCH_CLASSES.filter((c) => c.durum === 'taslak').length,
    conf:  SCH_CLASSES.filter((c) => c.conf > 0).length,
    miss:  SCH_CLASSES.filter((c) => c.miss > 0).length,
    avail: SCH_CLASSES.filter((c) => c.avail > 0).length,
  }), []);

  /* mercek başına filtrelenmiş satırlar */
  const visClasses = useMemoSch(() => {
    if (forceEmpty) return [];
    const needle = q.toLocaleLowerCase('tr');
    return SCH_CLASSES.filter((c) => {
      if (fLvl.length && fLvl.indexOf(c.kademe) === -1) return false;
      if (fDurum === 'Yayın' && c.durum !== 'pub') return false;
      if (fDurum === 'Taslak' && c.durum === 'pub') return false;
      if (flag === 'pub' && c.durum !== 'pub') return false;
      if (flag === 'draft' && c.durum !== 'taslak') return false;
      if (flag === 'conf' && c.conf === 0) return false;
      if (flag === 'miss' && c.miss === 0) return false;
      if (flag === 'avail' && c.avail === 0) return false;
      if (needle && (c.ad + ' ' + c.who).toLocaleLowerCase('tr').indexOf(needle) === -1) return false;
      return true;
    });
  }, [q, fLvl, fDurum, flag, forceEmpty]);

  const visTeachers = useMemoSch(() => {
    if (forceEmpty) return [];
    const needle = q.toLocaleLowerCase('tr');
    return SCH_TEACHERS.filter((tc) => {
      const br = ACA_BR[tc.brans] || {};
      if (fBrans && br.ad !== fBrans) return false;
      if (fDurum === 'Yayın' && tc.durum !== 'pub') return false;
      if (fDurum === 'Taslak' && tc.durum === 'pub') return false;
      if (needle && (tc.ad + ' ' + (br.ad || '')).toLocaleLowerCase('tr').indexOf(needle) === -1) return false;
      return true;
    });
  }, [q, fBrans, fDurum, forceEmpty]);

  const visRooms = useMemoSch(() => {
    if (forceEmpty) return [];
    const needle = q.toLocaleLowerCase('tr');
    return SCH_ROOMS.filter((r) => {
      if (fTur && SCH_TUR_META[r.tur].label !== fTur) return false;
      if (needle && r.ad.toLocaleLowerCase('tr').indexOf(needle) === -1) return false;
      return true;
    });
  }, [q, fTur, forceEmpty]);

  const counts = { sinif: forceEmpty ? 0 : SCH_CLASSES.length, ogretmen: forceEmpty ? 0 : SCH_TEACHERS.length, derslik: forceEmpty ? 0 : SCH_ROOMS.length };
  const activeRows = lens === 'sinif' ? visClasses : lens === 'ogretmen' ? visTeachers : visRooms;
  const sourceCount = lens === 'sinif' ? SCH_CLASSES.length : lens === 'ogretmen' ? SCH_TEACHERS.length : SCH_ROOMS.length;
  const anyFilter = q || fLvl.length || fDurum || fBrans || fTur || flag;

  function clearFilters() { setQ(''); setFLvl([]); setFDurum(''); setFBrans(''); setFTur(''); setFlag(''); }
  function toggleFLvl(l) { setFLvl((s) => (s.indexOf(l) !== -1 ? s.filter((x) => x !== l) : [...s, l])); }
  function clickSum(key) { setLens('sinif'); setFlag((f) => (f === key ? '' : key)); }

  /* tablo başlıkları (mercek başına) */
  const heads = lens === 'sinif'
    ? ['Sınıf / Şube', 'Kademe', 'Durum', 'Çakışma', 'Eksik Saat', 'Müsaitlik', 'Son Güncelleme', 'Sürüm', '']
    : lens === 'ogretmen'
      ? ['Öğretmen', 'Branş', 'Haftalık Yük', 'Boş Saat', 'Nöbet', 'Durum', '']
      : ['Derslik', 'Tür', 'Doluluk Oranı', 'Çakışma', ''];
  const colCount = heads.length;

  return (
    <div className="stu aca" data-screen-label="Ders Programı">
      <PageTop
        crumbs={[{ label: 'Akademik' }, { label: 'Ders Programı' }]}
        title="Ders Programı"
        sub="Sınıf, öğretmen ve derslik programlarını oluşturun, doğrulayın ve yayınlayın."
        actions={
          <React.Fragment>
            <button className="btn btn-ghost" onClick={() => setModal({ type: 'auto' })}>
              <Icon name="sparkles" size={17} /> Otomatik Oluştur
            </button>
            <button className="btn btn-primary" onClick={() => setModal({ type: 'new' })}>
              <Icon name="plus" size={18} strokeWidth={2.2} /> Yeni Program
            </button>
          </React.Fragment>
        }
      />

      {/* ── Özet şeridi ── */}
      <div className="sch-summary">
        <button className={'sch-sum t-pub' + (flag === 'pub' ? ' on' : '')} onClick={() => clickSum('pub')}>
          <span className="dot"></span><span className="l">Yayında</span><span className="n">{sum.pub}</span>
        </button>
        <button className={'sch-sum t-draft' + (flag === 'draft' ? ' on' : '')} onClick={() => clickSum('draft')}>
          <span className="dot"></span><span className="l">Taslak</span><span className="n">{sum.draft}</span>
        </button>
        <button className={'sch-sum t-conf' + (flag === 'conf' ? ' on' : '')} onClick={() => clickSum('conf')}>
          <span className="dot"></span><span className="l">Açık çakışma</span><span className="n">{sum.conf}</span>
        </button>
        <button className={'sch-sum t-miss' + (flag === 'miss' ? ' on' : '')} onClick={() => clickSum('miss')}>
          <span className="dot"></span><span className="l">Eksik saat</span><span className="n">{sum.miss}</span>
        </button>
        <button className={'sch-sum t-avail' + (flag === 'avail' ? ' on' : '')} onClick={() => clickSum('avail')}>
          <span className="dot"></span><span className="l">Müsaitlik ihlali</span><span className="n">{sum.avail}</span>
        </button>
        {flag && <button className="sch-sum-clear" onClick={() => setFlag('')}><Icon name="x" size={14} /> Filtreyi kaldır</button>}
        <span className="sch-sum-grow"></span>
        <span className="sch-sum-hint"><Icon name="info" size={14} /> Bir rozete tıklayın — tablo filtrelenir</span>
      </div>

      {/* ── Sekmeler (üç mercek) ── */}
      <div className="aca-tabs">
        <button className={'aca-tab' + (lens === 'sinif' ? ' on' : '')} onClick={() => setLens('sinif')}>
          Sınıf Programları <span className="cnt">{counts.sinif}</span>
        </button>
        <button className={'aca-tab' + (lens === 'ogretmen' ? ' on' : '')} onClick={() => { setLens('ogretmen'); setFlag(''); }}>
          Öğretmen Programları <span className="cnt">{counts.ogretmen}</span>
        </button>
        <button className={'aca-tab' + (lens === 'derslik' ? ' on' : '')} onClick={() => { setLens('derslik'); setFlag(''); }}>
          Derslik Doluluğu <span className="cnt">{counts.derslik}</span>
        </button>
      </div>

      <div className="stu-inner">
        {/* ── Filtre çubuğu (mercek başına uyarlanır) ── */}
        <div className="stu-toolbar">
          <label className="stu-search">
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={lens === 'sinif' ? 'Sınıf, öğretmen veya derslik ara…' : lens === 'ogretmen' ? 'Öğretmen veya branş ara…' : 'Derslik ara…'} />
          </label>

          {lens === 'sinif' && (
            <React.Fragment>
              <div className="asg-lvls" style={{ gap: 5 }}>
                {[9, 10, 11, 12].map((l) => (
                  <button key={l} className={'asg-lvl-chip' + (fLvl.indexOf(l) !== -1 ? ' on' : '')}
                    style={{ flex: '0 0 auto', padding: '0 11px' }} onClick={() => toggleFLvl(l)}>{l}</button>
                ))}
              </div>
              <SchFilter icon="circle-dot" label="Durum" value={fDurum} options={['Taslak', 'Yayın']} onChange={setFDurum} />
            </React.Fragment>
          )}
          {lens === 'ogretmen' && (
            <React.Fragment>
              <SchFilter icon="briefcase" label="Branş" value={fBrans}
                options={ACA_BRANCHES.filter((b) => b.durum === 'Aktif').map((b) => b.ad)} onChange={setFBrans} />
              <SchFilter icon="circle-dot" label="Durum" value={fDurum} options={['Taslak', 'Yayın']} onChange={setFDurum} />
            </React.Fragment>
          )}
          {lens === 'derslik' && (
            <SchFilter icon="layers" label="Tür" value={fTur} options={['Normal', 'Laboratuvar', 'Salon']} onChange={setFTur} />
          )}

          <div className="tb-spacer"></div>
          <button className="tb-icon-btn" title="Kolon ve filtre ayarları"><Icon name="sliders" size={18} /></button>
        </div>

        {/* ── Tablo ── */}
        <div className="stu-card-wrap">
          <table className="stu-tbl">
            <thead>
              <tr>
                {heads.map((h, i) => (
                  <th key={i} className={i === colCount - 1 ? 'col-actions' : ''}>{h}</th>
                ))}
              </tr>
            </thead>

            {loading ? (
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {heads.map((_, ci) => (
                      <td key={ci}><div className="sch-skel" style={{ width: ci === 0 ? '70%' : ci === colCount - 1 ? '54px' : '46%' }}></div></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : activeRows.length > 0 ? (
              lens === 'sinif' ? <ClassRows rows={visClasses} onOpen={openEditor} onPublish={(c) => setModal({ type: 'pub', row: c })} />
                : lens === 'ogretmen' ? <TeacherRows rows={visTeachers} onView={viewTeacher} />
                  : <RoomRows rows={visRooms} onView={viewRoom} />
            ) : null}
          </table>

          {!loading && activeRows.length === 0 && (
            forceEmpty || sourceCount === 0 ? (
              <div className="stu-state">
                <div className="se-ico"><Icon name="calendar-range" size={28} /></div>
                <h3>Henüz program oluşturulmadı</h3>
                <p>İlk sınıf programınızı oluşturun veya görevlendirmelerden otomatik taslak üretin.</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button className="btn btn-ghost" onClick={() => setModal({ type: 'auto' })}><Icon name="sparkles" size={16} /> Otomatik Oluştur</button>
                  <button className="btn btn-primary" onClick={() => setModal({ type: 'new' })}><Icon name="plus" size={17} strokeWidth={2.2} /> İlk Programı Oluştur</button>
                </div>
              </div>
            ) : (
              <div className="stu-state">
                <div className="se-ico"><Icon name="search" size={28} /></div>
                <h3>Sonuç bulunamadı</h3>
                <p>Arama veya filtre kriterlerine uyan kayıt yok.</p>
                <button className="btn btn-ghost" onClick={clearFilters}><Icon name="x" size={16} /> Filtreleri Temizle</button>
              </div>
            )
          )}
        </div>
      </div>

      {modal && modal.type === 'new' && <NewProgramModal onClose={() => setModal(null)} onGo={(id) => { const c = SCH_CLASSES.find((x) => x.id === id); window.__schTarget = id; window.__schNew = true; window.__schDraft = null; setModal(null); onNavigate('scheduleEditor'); }} />}
      {modal && modal.type === 'auto' && <AutoGenFlow classes={SCH_CLASSES.map((c) => ({ id: c.id, ad: c.ad, kademe: c.kademe }))} onClose={() => setModal(null)} onUseDraft={(clsId, draftId) => { window.__schTarget = clsId; window.__schNew = false; window.__schDraft = draftId; setModal(null); onNavigate('scheduleEditor'); }} />}
      {modal && modal.type === 'pub' && (() => {
        const r = modal.row;
        const issues = [];
        for (let i = 0; i < r.conf; i++) issues.push({ kind: 'bad', title: 'Açık çakışma #' + (i + 1), sub: 'Öğretmen veya derslik aynı saatte meşgul', cellKey: null });
        for (let i = 0; i < Math.min(r.miss, 3); i++) issues.push({ kind: 'warn', title: 'Eksik ders saati', sub: 'Haftalık planda boş saat', cellKey: null });
        return <PublishFlow meta={{ ad: r.ad, ver: r.ver }} conflicts={r.conf} missing={r.miss} issues={issues} onGotoCell={() => { window.__schTarget = r.id; window.__schNew = false; onNavigate('scheduleEditor'); }} onClose={() => setModal(null)} onPublished={() => {}} />;
      })()}

      {toast && (
        <div className={'sch-toast' + (toast.ok ? ' ok' : '')}>
          <span className="ti"><Icon name={toast.ok ? 'check' : 'arrow-right'} size={16} strokeWidth={2.6} /></span>
          <span className="tx">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ScheduleScreen });
