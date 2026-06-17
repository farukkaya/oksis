/* OKSİS — Akademik modülü: ortak veri + yardımcı bileşenler
   (Dersler & Branşlar + Görevlendirmeler ekranları paylaşır) */

/* ── Branşlar ── soft dolgu + koyu metin; nötr modda gri rozet + renkli nokta */
const ACA_BRANCHES = [
  { id: 'mat', ad: 'Matematik',                        meb: '1245', bg: '#E4EBFE', fg: '#2F4DA0', durum: 'Aktif' },
  { id: 'tde', ad: 'Türk Dili ve Edebiyatı',           meb: '2353', bg: '#FCE7EE', fg: '#A93B62', durum: 'Aktif' },
  { id: 'fiz', ad: 'Fizik',                            meb: '1715', bg: '#EBE5FB', fg: '#5B45B0', durum: 'Aktif' },
  { id: 'kim', ad: 'Kimya',                            meb: '1203', bg: '#DCF3F1', fg: '#0C6B66', durum: 'Aktif' },
  { id: 'biy', ad: 'Biyoloji',                         meb: '1207', bg: '#DFF2DF', fg: '#2E7D36', durum: 'Aktif' },
  { id: 'tar', ad: 'Tarih',                            meb: '2510', bg: '#FAEEDC', fg: '#92600F', durum: 'Aktif' },
  { id: 'cog', ad: 'Coğrafya',                         meb: '1119', bg: '#E0F1FA', fg: '#146C94', durum: 'Aktif' },
  { id: 'ing', ad: 'İngilizce',                        meb: '1524', bg: '#EFF3DC', fg: '#5F6B16', durum: 'Aktif' },
  { id: 'alm', ad: 'Almanca',                          meb: '1083', bg: '#E8F0E0', fg: '#4E7A1E', durum: 'Aktif' },
  { id: 'din', ad: 'Din Kült. ve Ahlak Bilgisi',       meb: '1310', bg: '#EFEAE3', fg: '#6B5840', durum: 'Aktif' },
  { id: 'fel', ad: 'Felsefe',                          meb: '1390', bg: '#F4E5F5', fg: '#8E3B98', durum: 'Aktif' },
  { id: 'bed', ad: 'Beden Eğitimi',                    meb: '1115', bg: '#FDEBDD', fg: '#B45A0C', durum: 'Aktif' },
  { id: 'bil', ad: 'Bilişim Teknolojileri',            meb: '2143', bg: '#E3EEF2', fg: '#28617A', durum: 'Aktif' },
  { id: 'muz', ad: 'Müzik',                            meb: '1822', bg: '#FBE5F2', fg: '#A82B7E', durum: 'Aktif' },
  { id: 'gor', ad: 'Görsel Sanatlar',                  meb: '1426', bg: '#F0E9F9', fg: '#6D4E9E', durum: 'Pasif' },
  { id: 'jap', ad: 'Japonca',                          meb: '',     bg: '#FBEAE5', fg: '#9C4830', durum: 'Aktif' },
];
const ACA_BR = Object.fromEntries(ACA_BRANCHES.map((b) => [b.id, b]));

/* ── Öğretmenler ── brans: ana branş · yan: yan branşlar (uyum kontrolünü besler) */
const ACA_TEACHERS = [
  ['t01', 'Ahmet Yılmaz',  'mat', []],
  ['t02', 'Burak Tekin',   'mat', ['fiz']],
  ['t03', 'Ayşe Demir',    'fiz', ['mat']],
  ['t04', 'Selin Aydın',   'tde', []],
  ['t05', 'Murat Eren',    'tde', []],
  ['t06', 'Derya Koral',   'kim', ['biy']],
  ['t07', 'Kemal Şahin',   'biy', ['kim']],
  ['t08', 'Hasan Kılıç',   'tar', []],
  ['t09', 'Nazlı Güneş',   'cog', ['tar']],
  ['t10', 'Leyla Brown',   'ing', []],
  ['t11', 'Oğuz Karan',    'ing', ['alm']],
  ['t12', 'Fatma Sezer',   'din', []],
  ['t13', 'Cenk Aral',     'bed', []],
  ['t14', 'Ebru Saygın',   'fel', []],
  ['t15', 'Tuna Berk',     'bil', []],
  ['t16', 'Melis Akman',   'muz', []],
].map((r, i) => ({
  id: r[0], ad: r[1], brans: r[2], yan: r[3], n: i + 1,
  initials: r[1].split(' ').map((x) => x[0]).join('').toUpperCase(),
}));
const ACA_T = Object.fromEntries(ACA_TEACHERS.map((t) => [t.id, t]));

/* ── Dersler ── [id, ad, kod, brans, seviye[], tür, önerilen haftalık saat, durum] */
const ACA_COURSES_INIT = [
  ['mat',  'Matematik',                            'MAT', 'mat', [9, 10, 11, 12], 'Zorunlu', 6, 'Aktif'],
  ['tde',  'Türk Dili ve Edebiyatı',               'TDE', 'tde', [9, 10, 11, 12], 'Zorunlu', 5, 'Aktif'],
  ['fiz',  'Fizik',                                'FİZ', 'fiz', [9, 10, 11, 12], 'Zorunlu', 2, 'Aktif'],
  ['kim',  'Kimya',                                'KİM', 'kim', [9, 10],         'Zorunlu', 2, 'Aktif'],
  ['biy',  'Biyoloji',                             'BİY', 'biy', [9, 10],         'Zorunlu', 2, 'Aktif'],
  ['tar',  'Tarih',                                'TAR', 'tar', [9, 10, 11],     'Zorunlu', 2, 'Aktif'],
  ['ink',  'T.C. İnkılap Tarihi ve Atatürkçülük',  'İNK', 'tar', [12],            'Zorunlu', 2, 'Aktif'],
  ['cog',  'Coğrafya',                             'COĞ', 'cog', [9, 10],         'Zorunlu', 2, 'Aktif'],
  ['ing',  'İngilizce',                            'İNG', 'ing', [9, 10, 11, 12], 'Zorunlu', 4, 'Aktif'],
  ['alm',  'Almanca (2. Yabancı Dil)',             'ALM', 'alm', [9, 10, 11, 12], 'Seçmeli', 2, 'Aktif'],
  ['din',  'Din Kültürü ve Ahlak Bilgisi',         'DİN', 'din', [9, 10, 11, 12], 'Zorunlu', 2, 'Aktif'],
  ['fel',  'Felsefe',                              'FEL', 'fel', [10, 11],        'Zorunlu', 2, 'Aktif'],
  ['bed',  'Beden Eğitimi ve Spor',                'BED', 'bed', [9, 10, 11, 12], 'Zorunlu', 2, 'Aktif'],
  ['bil',  'Bilgisayar Bilimi',                    'BİL', 'bil', [9, 10],         'Seçmeli', 2, 'Aktif'],
  ['muz',  'Müzik',                                'MÜZ', 'muz', [9, 10],         'Seçmeli', 1, 'Aktif'],
  ['gor',  'Görsel Sanatlar',                      'GÖR', 'gor', [9, 10],         'Seçmeli', 1, 'Pasif'],
].map((r) => ({ id: r[0], ad: r[1], kod: r[2], brans: r[3], seviye: r[4], tur: r[5], saat: r[6], durum: r[7], aciklama: '' }));

/* ── Sınıflar (görevlendirme hedefi: haftalık toplam saat) ── */
const ACA_CLASSES = [
  { id: '9A',  name: '9-A',  grade: 9,  hedef: 30 },
  { id: '9B',  name: '9-B',  grade: 9,  hedef: 30 },
  { id: '9C',  name: '9-C',  grade: 9,  hedef: 30 },
  { id: '10A', name: '10-A', grade: 10, hedef: 30 },
  { id: '10B', name: '10-B', grade: 10, hedef: 30 },
  { id: '11A', name: '11-A', grade: 11, hedef: 30 },
  { id: '11B', name: '11-B', grade: 11, hedef: 30 },
  { id: '12A', name: '12-A', grade: 12, hedef: 30 },
  { id: '12B', name: '12-B', grade: 12, hedef: 30 },
];

/* ── Görevlendirmeler ── sınıf → [ders, öğretmen, saat] */
const ACA_ASSIGN_RAW = {
  '9A':  [['mat','t01',5],['tde','t04',4],['fiz','t03',2],['kim','t06',2],['biy','t07',2],['tar','t09',2],['cog','t09',2],['ing','t10',4],['din','t12',2],['bed','t13',2],['bil','t01',1]],
  '9B':  [['mat','t02',5],['tde','t04',4],['fiz','t03',2],['kim','t06',2],['biy','t07',2],['ing','t10',4],['din','t12',2],['bed','t13',2],['tar','t08',1]],
  '9C':  [['mat','t01',6],['tde','t05',5],['fiz','t03',2],['kim','t06',2],['biy','t07',2],['tar','t08',2],['cog','t09',2],['ing','t11',4],['din','t12',2],['bed','t13',2],['bil','t15',1]],
  '10A': [['mat','t02',6],['tde','t04',5],['fiz','t03',2],['kim','t06',2],['biy','t07',2],['tar','t08',2],['cog','t09',2],['ing','t10',4],['fel','t14',2],['din','t12',2],['bed','t13',1]],
  '10B': [['mat','t01',5],['tde','t05',5],['fiz','t03',2],['kim','t06',2],['biy','t07',2],['tar','t08',2],['ing','t10',3],['fel','t14',2],['din','t12',2],['bed','t13',2]],
  '11A': [['mat','t02',7],['tde','t04',6],['fiz','t03',4],['tar','t08',2],['ing','t11',4],['fel','t14',2],['din','t12',2],['bed','t13',2],['alm','t11',3]],
  '11B': [],
  '12A': [['mat','t01',6],['tde','t05',5],['fiz','t03',4],['ink','t08',2],['ing','t10',4],['din','t12',2],['bed','t13',2],['bil','t15',2],['muz','t16',1],['alm','t11',2]],
  '12B': [['mat','t02',6],['tde','t04',5],['ink','t08',2],['ing','t10',3],['din','t12',2]],
};
let __acaSeq = 0;
const ACA_ASSIGN_INIT = Object.entries(ACA_ASSIGN_RAW).flatMap(([cls, rows]) =>
  rows.map(([course, teacher, saat]) => ({ id: 'a' + (++__acaSeq), cls, course, teacher, saat }))
);

/* ── Uyum kuralı: ana branş = uyumlu · yan branş = yan · diğer = uyumsuz ── */
function acaUyum(bransId, teacher) {
  if (!teacher) return 'no';
  if (teacher.brans === bransId) return 'ok';
  if (teacher.yan.indexOf(bransId) !== -1) return 'yan';
  return 'no';
}

/* Saat durumu tonu: eksik → amber · tam → yeşil · fazla → kırmızı */
function acaHoursTone(toplam, hedef) {
  if (toplam === 0) return 'zero';
  if (toplam < hedef) return 'low';
  if (toplam > hedef) return 'over';
  return 'ok';
}

/* ─────────────── Ortak küçük bileşenler ─────────────── */
function BranchBadge({ id, neutral }) {
  const b = ACA_BR[id];
  if (!b) return null;
  if (neutral) {
    return (
      <span className="aca-branch neutral">
        <span className="bd" style={{ background: b.fg }}></span>{b.ad}
      </span>
    );
  }
  return <span className="aca-branch" style={{ background: b.bg, color: b.fg }}>{b.ad}</span>;
}

const ACA_UYUM_META = {
  ok:  { cls: 'ok',  ic: 'check',          label: 'Uyumlu' },
  yan: { cls: 'yan', ic: 'alert-triangle', label: 'Yan branş' },
  no:  { cls: 'no',  ic: 'x',              label: 'Uyumsuz' },
};
function UyumBadge({ kind }) {
  const m = ACA_UYUM_META[kind] || ACA_UYUM_META.no;
  return (
    <span className={'aca-uyum ' + m.cls}>
      <Icon name={m.ic} size={12} strokeWidth={2.6} /> {m.label}
    </span>
  );
}

function AcaStatus({ on }) {
  return (
    <span className={'aca-status' + (on ? ' on' : '')}>
      <span className="dot"></span>{on ? 'Aktif' : 'Pasif'}
    </span>
  );
}

/* Form drawer kabuğu — mevcut .drawer sistemini kullanır */
function AcaDrawer({ icon, title, sub, onClose, foot, children }) {
  return (
    <React.Fragment>
      <div className="drawer-scrim" onClick={onClose}></div>
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <button className="drawer-close" onClick={onClose} aria-label="Kapat"><Icon name="x" size={18} /></button>
          <div className="drawer-id">
            <div className="fdr-ic"><Icon name={icon} size={22} /></div>
            <div className="di">
              <div className="nm">{title}</div>
              <div className="no">{sub}</div>
            </div>
          </div>
        </div>
        <div className="drawer-body">{children}</div>
        <div className="drawer-foot aca-foot">{foot}</div>
      </aside>
    </React.Fragment>
  );
}

/* Satır sonu üç-nokta menüsü */
function AcaRowMenu({ items }) {
  const { useState, useRef, useEffect } = React;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div className="rmenu" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button className="ra-btn" title="Daha fazla" onClick={() => setOpen((o) => !o)}>
        <Icon name="more-horizontal" size={16} />
      </button>
      {open && (
        <div className="rmenu-pop">
          {items.map((it, i) => it.sep
            ? <div className="rmenu-sep" key={i}></div>
            : (
              <button
                key={i}
                className={'rmenu-item' + (it.danger ? ' danger' : '') + (it.disabled ? ' disabled' : '')}
                title={it.tip || undefined}
                onClick={() => { if (it.disabled) return; setOpen(false); it.onClick && it.onClick(); }}
              >
                <Icon name={it.icon} size={15} /> {it.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  ACA_BRANCHES, ACA_BR, ACA_TEACHERS, ACA_T, ACA_COURSES_INIT, ACA_CLASSES, ACA_ASSIGN_INIT,
  acaUyum, acaHoursTone, BranchBadge, UyumBadge, AcaStatus, AcaDrawer, AcaRowMenu,
});
