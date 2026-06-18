/* ============================================================
   OKSİS — Action modals (domain operations as real dialogs)
   ============================================================ */
const { useState: useStateM, useEffect: useEffectM, useMemo: useMemoM } = React;

const M_CLASSES = ['5-A','5-B','6-A','6-B','7-A','7-B','8-A','8-B'];
const M_BRANS = ['Matematik','Türkçe','Fen Bilimleri','İngilizce','Sosyal Bilgiler','Beden Eğitimi','Görsel Sanatlar','Müzik','Bilişim Teknolojileri','Din Kültürü','Rehberlik'];
const M_ROLES = ['Yönetici','Muhasebe','Operasyon','Öğretmen','Veli','Öğrenci'];
const M_ROLE_TONE = { 'Yönetici':'navy','Muhasebe':'navy','Operasyon':'navy','Öğretmen':'teacher','Veli':'parent','Öğrenci':'student' };
/* mevcut velilerde arama için örnek havuz (kardeş senaryosu) */
const M_GUARDIAN_POOL = [
  { name:'Zeynep Kaya', rel:'Anne', phone:'0532 414 22 18', kids:'Elif Kaya · 8-A' },
  { name:'Murat Aksoy', rel:'Baba', phone:'0533 201 55 09', kids:'Deniz Aksoy · 5-B' },
  { name:'Aslı Çelik', rel:'Anne', phone:'0535 660 19 23', kids:'Zeynep Çelik · 7-A' },
  { name:'Hakan Demir', rel:'Baba', phone:'0542 778 31 64', kids:'Yusuf Demir · 8-B' },
  { name:'Pınar Şahin', rel:'Anne', phone:'0505 332 88 70', kids:'Ada Şahin · 6-A' },
  { name:'Volkan Koç', rel:'Baba', phone:'0544 121 09 56', kids:'Emir Koç · 8-A' },
];
const mAv = (n) => 'av-' + ((n.length % 6) + 1);
const mInit = (n) => n.split(' ').map((w) => w[0]).join('').slice(0,2).toUpperCase();

/* ── Shell ── */
function Modal({ title, sub, icon, iconTone, onClose, children, footer, size }) {
  useEffectM(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal' + (size === 'lg' ? ' lg' : '')} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className={'modal-ico' + (iconTone ? ' ' + iconTone : '')}><Icon name={icon} size={22} /></div>
          <div className="modal-ht"><h3>{title}</h3>{sub && <div className="sub">{sub}</div>}</div>
          <button className="modal-x" onClick={onClose} aria-label="Kapat"><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function SuccessBody({ title, text }) {
  return (
    <div className="modal-success">
      <div className="ms-ico"><Icon name="check" size={30} strokeWidth={2.6} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

/* ════════════════════════ ÖĞRENCİ ════════════════════════ */

/* Yeni Öğrenci — EnrollStudent (+ ilk Enrollment + User provizyonu) */
function EnrollStudentModal({ onClose }) {
  const [f, setF] = useStateM({ ad:'', soyad:'', cins:'K', dogum:'', cls:'', veli:'' });
  const [done, setDone] = useStateM(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target ? e.target.value : e }));
  const valid = f.ad && f.soyad && f.cls;
  const newNo = '2025' + String(1100 + Math.floor(Math.random() * 800)).padStart(4, '0');
  if (done) {
    return (
      <Modal icon="graduation-cap" title="Öğrenci Kaydedildi" onClose={onClose}
        footer={<React.Fragment><div className="spacer"></div><button className="btn btn-primary" onClick={onClose}>Tamam</button></React.Fragment>}>
        <SuccessBody title={f.ad + ' ' + f.soyad + ' kaydedildi'} text="Aktif sezon Enrollment kaydı oluşturuldu. StudentEnrolled event'i ile Identity modülü hesabı açtı." />
        <div className="cred-box">
          <div className="cred-row"><span className="l">Öğrenci No (kullanıcı adı)</span><span className="v">{newNo}</span></div>
          <div className="cred-row"><span className="l">Geçici şifre</span><span className="v">Atlas-{newNo.slice(-4)}</span></div>
        </div>
        <div className="fld-hint" style={{ marginTop: 12 }}><Icon name="shield" size={14} /><span>Öğrenci istisnası: e-posta yok → kullanıcı adı = öğrenci no, ilk girişte zorunlu şifre değişimi.</span></div>
      </Modal>
    );
  }
  return (
    <Modal icon="graduation-cap" title="Yeni Öğrenci" sub="EnrollStudent · aktif sezon kaydı açılır" onClose={onClose}
      footer={<React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn btn-primary' + (valid ? '' : ' disabled')} disabled={!valid} onClick={() => setDone(true)}><Icon name="check" size={17} /> Kaydet</button></React.Fragment>}>
      <div className="fld-row">
        <div className="fld"><div className="fld-l">Ad <span className="req">*</span></div><input className="inp" value={f.ad} onChange={set('ad')} placeholder="Öğrenci adı" /></div>
        <div className="fld"><div className="fld-l">Soyad <span className="req">*</span></div><input className="inp" value={f.soyad} onChange={set('soyad')} placeholder="Soyadı" /></div>
      </div>
      <div className="fld-row">
        <div className="fld"><div className="fld-l">Cinsiyet</div><div className="seg">{['K','E'].map((g) => <button key={g} className={f.cins === g ? 'on' : ''} onClick={() => setF((p) => ({ ...p, cins: g }))}>{g === 'K' ? 'Kız' : 'Erkek'}</button>)}</div></div>
        <div className="fld"><div className="fld-l">Doğum Tarihi <span className="opt">· ops.</span></div><input className="inp" value={f.dogum} onChange={set('dogum')} placeholder="gg.aa.yyyy" /></div>
      </div>
      <div className="fld"><div className="fld-l">Sınıf / Şube <span className="req">*</span></div>
        <select className="sel" value={f.cls} onChange={set('cls')}><option value="">Sınıf seç…</option>{M_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
      </div>
      <div className="fld"><div className="fld-l">Birincil Veli <span className="opt">· sonra da bağlanabilir</span></div><input className="inp" value={f.veli} onChange={set('veli')} placeholder="Veli adı ara veya boş bırak" /></div>
      <div className="fld-hint"><Icon name="users-round" size={14} /><span>Velisiz kaydedilebilir; "veli eksik" uyarısı görünür. Öğrenci no tenant + sezon bazında otomatik üretilir ve değişmez.</span></div>
    </Modal>
  );
}

/* Sınıf Ata / Değiştir — AssignClass / TransferClass */
function AssignClassModal({ s, onClose }) {
  const [cls, setCls] = useStateM('');
  const valid = cls && cls !== s.cls;
  return (
    <Modal icon="grid" title="Sınıf Ata / Değiştir" sub={s.ad + ' ' + s.soyad + ' · ' + s.no} onClose={onClose}
      footer={<React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn btn-primary' + (valid ? '' : ' disabled')} disabled={!valid} onClick={onClose}><Icon name="check" size={17} /> Uygula</button></React.Fragment>}>
      <div className="fld-row">
        <div className="fld"><div className="fld-l">Mevcut Sınıf</div><div className="inp" style={{ display:'flex', alignItems:'center', background:'var(--surface)', fontWeight:700 }}>{s.cls}</div></div>
        <div className="fld"><div className="fld-l">Yeni Sınıf <span className="req">*</span></div><select className="sel" value={cls} onChange={(e) => setCls(e.target.value)}><option value="">Seç…</option>{M_CLASSES.filter((c) => c !== s.cls).map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
      </div>
      <div className="impact"><div className="impact-ic"><Icon name="history" size={18} /></div><div className="impact-tx">Bu değişiklik <b>yalnızca aktif sezon</b> Enrollment kaydını etkiler — geçmiş yıl kayıtları değişmez.</div></div>
    </Modal>
  );
}

/* Veli Bağla — LinkGuardian (önce mevcut ara → yoksa yeni) §4.7 */
function LinkGuardianModal({ s, onClose }) {
  const [mode, setMode] = useStateM('ara');
  const [q, setQ] = useStateM('');
  const [picked, setPicked] = useStateM(null);
  const [rel, setRel] = useStateM('Anne');
  const [primary, setPrimary] = useStateM(false);
  const [nf, setNf] = useStateM({ ad:'', rel:'Anne', tel:'', email:'' });
  const results = useMemoM(() => M_GUARDIAN_POOL.filter((g) => g.name.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr'))), [q]);
  const setN = (k) => (e) => setNf((p) => ({ ...p, [k]: e.target.value }));

  const footer = mode === 'ara'
    ? <React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn btn-primary' + (picked ? '' : ' disabled')} disabled={!picked} onClick={onClose}><Icon name="link" size={16} /> Veliyi Bağla</button></React.Fragment>
    : <React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn btn-primary' + (nf.ad && nf.tel ? '' : ' disabled')} disabled={!nf.ad || !nf.tel} onClick={onClose}><Icon name="user-plus" size={16} /> Oluştur & Bağla</button></React.Fragment>;

  return (
    <Modal icon="users-round" title="Veli Bağla" sub={s.ad + ' ' + s.soyad + ' için veli ilişkisi'} onClose={onClose} footer={footer}>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={mode === 'ara' ? 'on' : ''} onClick={() => setMode('ara')}><Icon name="search" size={15} /> Mevcut Veli Ara</button>
        <button className={mode === 'yeni' ? 'on' : ''} onClick={() => setMode('yeni')}><Icon name="user-plus" size={15} /> Yeni Veli</button>
      </div>

      {mode === 'ara' ? (
        <React.Fragment>
          <div className="fld-hint" style={{ marginTop: 0, marginBottom: 10 }}><Icon name="users-round" size={14} /><span>Önce mevcut velilerde aranır — kardeş zaten kayıtlıysa aynı veli bağlanır (çoka-çok).</span></div>
          <div className="inp-icon"><Icon name="search" size={17} /><input className="inp" value={q} onChange={(e) => { setQ(e.target.value); setPicked(null); }} placeholder="Veli adı ara…" /></div>
          <div className="lookup-results">
            {results.length === 0 ? <div className="lookup-empty">Eşleşen veli yok — "Yeni Veli" ile oluşturabilirsiniz.</div> : results.map((g, i) => (
              <div key={i} className={'lookup-row' + (picked === g ? ' on' : '')} onClick={() => setPicked(g)} style={picked === g ? { borderColor:'var(--accent)', background:'var(--accent-soft)' } : {}}>
                <span className={'lookup-av ' + mAv(g.name)}>{mInit(g.name)}</span>
                <div className="lookup-body"><div className="t">{g.name}</div><div className="s">{g.rel} · {g.phone} · {g.kids}</div></div>
                {picked === g ? <Icon name="check-circle" size={18} className="lookup-go" style={{ color:'var(--accent)' }} /> : <Icon name="plus" size={17} className="lookup-go" />}
              </div>
            ))}
          </div>
          {picked && (
            <div className="fld-row" style={{ marginTop: 14 }}>
              <div className="fld" style={{ marginBottom: 0 }}><div className="fld-l">İlişki Tipi</div><select className="sel" value={rel} onChange={(e) => setRel(e.target.value)}>{['Anne','Baba','Vasi','Diğer'].map((r) => <option key={r}>{r}</option>)}</select></div>
              <div className="fld" style={{ marginBottom: 0 }}><div className="fld-l">Birincil Veli</div><div className="seg">{[['Evet',true],['Hayır',false]].map(([l, v]) => <button key={l} className={primary === v ? 'on' : ''} onClick={() => setPrimary(v)}>{l}</button>)}</div></div>
            </div>
          )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="fld"><div className="fld-l">Ad Soyad <span className="req">*</span></div><input className="inp" value={nf.ad} onChange={setN('ad')} placeholder="Veli adı soyadı" /></div>
          <div className="fld-row">
            <div className="fld"><div className="fld-l">İlişki Tipi</div><select className="sel" value={nf.rel} onChange={setN('rel')}>{['Anne','Baba','Vasi','Diğer'].map((r) => <option key={r}>{r}</option>)}</select></div>
            <div className="fld"><div className="fld-l">Telefon <span className="req">*</span></div><input className="inp" value={nf.tel} onChange={setN('tel')} placeholder="05xx xxx xx xx" /></div>
          </div>
          <div className="fld"><div className="fld-l">E-posta <span className="opt">· davet için</span></div><input className="inp" value={nf.email} onChange={setN('email')} placeholder="veli@ornek.com" /></div>
          <div className="fld-hint"><Icon name="mail-check" size={14} /><span>Yeni veli için arka planda User hesabı açılır ve davet gönderilir (invite-first). Şifreyi veli kendi kurar.</span></div>
        </React.Fragment>
      )}
    </Modal>
  );
}

/* ════════════════════════ ÖĞRETMEN ════════════════════════ */

/* Yeni Öğretmen — HireTeacher */
function HireTeacherModal({ onClose }) {
  const [f, setF] = useStateM({ ad:'', soyad:'', hire:'', gorev:'Branş Öğr.' });
  const [brans, setBrans] = useStateM([]);
  const [done, setDone] = useStateM(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggleB = (b) => setBrans((p) => p.includes(b) ? p.filter((x) => x !== b) : [...p, b]);
  const valid = f.ad && f.soyad;
  const sicil = 'ÖĞR-' + (4500 + Math.floor(Math.random() * 400));
  if (done) {
    return (
      <Modal icon="briefcase" title="Öğretmen İşe Alındı" onClose={onClose}
        footer={<React.Fragment><div className="spacer"></div><button className="btn btn-primary" onClick={onClose}>Tamam</button></React.Fragment>}>
        <SuccessBody title={f.ad + ' ' + f.soyad + ' kaydedildi"'.replace('"','')} text="TeacherHired event'i ile Identity hesabı açtı ve e-posta daveti gönderildi. Görevlendirme henüz yapılmadı (Görevsiz)." />
        {brans.length === 0 && <div className="impact warn"><div className="impact-ic"><Icon name="alert-triangle" size={18} /></div><div className="impact-tx">Branş eksik — görevlendirme yapılamaz. Düzenle'den branş ekleyin.</div></div>}
      </Modal>
    );
  }
  return (
    <Modal icon="briefcase" title="Yeni Öğretmen" sub="HireTeacher · hesap provizyonu otomatik" onClose={onClose}
      footer={<React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn btn-primary' + (valid ? '' : ' disabled')} disabled={!valid} onClick={() => setDone(true)}><Icon name="check" size={17} /> İşe Al</button></React.Fragment>}>
      <div className="fld-row">
        <div className="fld"><div className="fld-l">Ad <span className="req">*</span></div><input className="inp" value={f.ad} onChange={set('ad')} placeholder="Öğretmen adı" /></div>
        <div className="fld"><div className="fld-l">Soyad <span className="req">*</span></div><input className="inp" value={f.soyad} onChange={set('soyad')} placeholder="Soyadı" /></div>
      </div>
      <div className="fld-row">
        <div className="fld"><div className="fld-l">Sicil No</div><div className="inp" style={{ display:'flex', alignItems:'center', background:'var(--surface)', fontWeight:700, color:'var(--text-muted)' }}>{sicil} · otomatik</div></div>
        <div className="fld"><div className="fld-l">İşe Giriş <span className="opt">· ops.</span></div><input className="inp" value={f.hire} onChange={set('hire')} placeholder="aa.yyyy" /></div>
      </div>
      <div className="fld"><div className="fld-l">Görev Tipi</div><div className="seg">{['Sınıf Öğr.','Branş Öğr.','Rehber'].map((g) => <button key={g} className={f.gorev === g ? 'on' : ''} onClick={() => setF((p) => ({ ...p, gorev: g }))}>{g}</button>)}</div></div>
      <div className="fld"><div className="fld-l">Branş(lar) <span className="opt">· sonra da eklenebilir</span></div>
        <div className="chip-grid">{M_BRANS.slice(0, 8).map((b) => <button key={b} className={'chip-pick' + (brans.includes(b) ? ' on' : '')} onClick={() => toggleB(b)}><span className="ck"><Icon name="check" size={11} strokeWidth={3.5} /></span>{b}</button>)}</div>
      </div>
    </Modal>
  );
}

/* Ders/Sınıf Görevlendir — AssignSubjectClass (Teacher × Class × Subject + saat) §5.7 */
function AssignSubjectClassModal({ t, onClose }) {
  const [cls, setCls] = useStateM('');
  const [sub, setSub] = useStateM(t.bransOf[0] || '');
  const [hours, setHours] = useStateM(4);
  const newLoad = t.load + (cls ? Number(hours) : 0);
  const pct = Math.round((newLoad / t.cap) * 100);
  const over = newLoad > t.cap;
  const valid = cls && sub && hours > 0;
  return (
    <Modal icon="layers" title="Ders / Sınıf Görevlendir" sub={t.ad + ' ' + t.soyad + ' · ' + t.no} onClose={onClose}
      footer={<React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn btn-primary' + (valid ? '' : ' disabled')} disabled={!valid} onClick={onClose}><Icon name="check" size={17} /> Görevlendir</button></React.Fragment>}>
      <div className="fld-row three">
        <div className="fld"><div className="fld-l">Sınıf <span className="req">*</span></div><select className="sel" value={cls} onChange={(e) => setCls(e.target.value)}><option value="">Seç…</option>{M_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className="fld"><div className="fld-l">Ders <span className="req">*</span></div><select className="sel" value={sub} onChange={(e) => setSub(e.target.value)}>{(t.bransOf.length ? t.bransOf : M_BRANS).map((b) => <option key={b}>{b}</option>)}</select></div>
        <div className="fld"><div className="fld-l">Saat/Hafta <span className="req">*</span></div><input className="inp" type="number" min="1" max="12" value={hours} onChange={(e) => setHours(e.target.value)} /></div>
      </div>
      <div className="load-preview">
        <div className="lp-head"><span className="l">Görevlendirme sonrası haftalık yük</span><span className="v" style={over ? { color:'var(--danger)' } : {}}>{newLoad} / {t.cap} saat · %{pct}</span></div>
        <div className={'lp-bar' + (over ? ' over' : '')}>
          <div className="lp-cur" style={{ width: Math.min(100, (t.load / t.cap) * 100) + '%' }}></div>
          <div className="lp-add" style={{ width: Math.min(100 - (t.load / t.cap) * 100, ((newLoad - t.load) / t.cap) * 100) + '%' }}></div>
        </div>
      </div>
      {over && <div className="impact warn" style={{ marginTop: 12 }}><div className="impact-ic"><Icon name="alert-triangle" size={18} /></div><div className="impact-tx">Kapasite aşımı (yumuşak uyarı) — sert engel değil, yine de görevlendirebilirsiniz.</div></div>}
      <div className="fld-hint" style={{ marginTop: 12 }}><Icon name="calendar-clock" size={14} /><span>Bu ekran <b>kim hangi dersi verecek</b> sorusunu çözer. Saatin gün/saate yerleşmesi Ders Programı modülünde olur (AssignmentChanged event).</span></div>
    </Modal>
  );
}

/* Sınıf Öğretmeni Ata — SetHomeroom */
function SetHomeroomModal({ t, onClose }) {
  const [cls, setCls] = useStateM(t.homeroom || '');
  const free = ['9-A','9-B','10-A','10-B','11-A'];
  return (
    <Modal icon="award" title="Sınıf Öğretmeni Ata" sub={t.ad + ' ' + t.soyad} onClose={onClose}
      footer={<React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn btn-primary' + (cls ? '' : ' disabled')} disabled={!cls} onClick={onClose}><Icon name="check" size={17} /> Ata</button></React.Fragment>}>
      <div className="fld"><div className="fld-l">Sorumlu Şube <span className="req">*</span></div>
        <select className="sel" value={cls} onChange={(e) => setCls(e.target.value)}><option value="">Şube seç…</option>{(t.homeroom ? [t.homeroom, ...free] : free).map((c) => <option key={c} value={c}>{c}{c === t.homeroom ? ' · mevcut' : ' · rehbersiz'}</option>)}</select>
      </div>
      <div className="fld-hint"><Icon name="shield" size={14} /><span>Sınıf öğretmenliği ders vermekten bağımsız idari atamadır: bir öğretmen 0/1 şube, bir şube tek sınıf öğretmeni.</span></div>
    </Modal>
  );
}

/* ════════════════════════ KULLANICI ════════════════════════ */

/* Yeni Kullanıcı — InviteUser (invite-first) */
function InviteUserModal({ onClose }) {
  const [f, setF] = useStateM({ ad:'', soyad:'', contact:'' });
  const [roles, setRoles] = useStateM([]);
  const [done, setDone] = useStateM(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggleR = (r) => setRoles((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);
  const valid = f.ad && f.soyad && f.contact && roles.length > 0;
  if (done) {
    return (
      <Modal icon="mail-check" title="Davet Gönderildi" onClose={onClose}
        footer={<React.Fragment><div className="spacer"></div><button className="btn btn-primary" onClick={onClose}>Tamam</button></React.Fragment>}>
        <SuccessBody title={f.ad + ' ' + f.soyad + ' davet edildi'} text={'Davet ' + f.contact + ' adresine gönderildi. Kullanıcı kendi şifresini kuracak — yönetici şifre belirlemez (invite-first).'} />
      </Modal>
    );
  }
  return (
    <Modal icon="user-plus" title="Yeni Kullanıcı" sub="InviteUser · idari/personel hesabı" onClose={onClose}
      footer={<React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn btn-primary' + (valid ? '' : ' disabled')} disabled={!valid} onClick={() => setDone(true)}><Icon name="send" size={16} /> Davet Gönder</button></React.Fragment>}>
      <div className="fld-row">
        <div className="fld"><div className="fld-l">Ad <span className="req">*</span></div><input className="inp" value={f.ad} onChange={set('ad')} placeholder="Ad" /></div>
        <div className="fld"><div className="fld-l">Soyad <span className="req">*</span></div><input className="inp" value={f.soyad} onChange={set('soyad')} placeholder="Soyad" /></div>
      </div>
      <div className="fld"><div className="fld-l">E-posta veya Telefon <span className="req">*</span></div><div className="inp-icon"><Icon name="mail" size={17} /><input className="inp" value={f.contact} onChange={set('contact')} placeholder="kisi@atlaskoleji.k12.tr" /></div></div>
      <div className="fld"><div className="fld-l">Rol(ler) <span className="req">*</span></div>
        <div className="chip-grid">{M_ROLES.map((r) => <button key={r} className={'chip-pick' + (roles.includes(r) ? ' on' : '')} onClick={() => toggleR(r)}><span className="ck"><Icon name="check" size={11} strokeWidth={3.5} /></span>{r}</button>)}</div>
      </div>
      <div className="fld-hint"><Icon name="shield" size={14} /><span>Öğrenci/öğretmen/veli hesapları kendi domain ekranlarında doğar. Bu ekran tipik olarak Yönetici/Muhasebe/Operasyon gibi domain'siz hesaplar üretir.</span></div>
    </Modal>
  );
}

/* Rol Ata — AssignRoles */
function AssignRolesModal({ u, onClose }) {
  const [roles, setRoles] = useStateM(u.roller);
  const toggleR = (r) => setRoles((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);
  const multi = roles.length > 1;
  return (
    <Modal icon="shield" title="Rolleri Düzenle" sub={u.ad + ' ' + u.soyad} onClose={onClose}
      footer={<React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn btn-primary' + (roles.length ? '' : ' disabled')} disabled={!roles.length} onClick={onClose}><Icon name="check" size={17} /> Kaydet</button></React.Fragment>}>
      <div className="fld-hint" style={{ marginTop: 0, marginBottom: 12 }}><Icon name="shield" size={14} /><span>Rol <b>tanımları</b> "Roller ve İzinler"de yapılır; burada yalnızca atanır. Bir kişi birden çok role/profile sahip olabilir.</span></div>
      <div className="chip-grid">{M_ROLES.map((r) => <button key={r} className={'chip-pick' + (roles.includes(r) ? ' on' : '')} onClick={() => toggleR(r)}><span className="ck"><Icon name="check" size={11} strokeWidth={3.5} /></span>{r}</button>)}</div>
      {multi && <div className="impact" style={{ marginTop: 16 }}><div className="impact-ic"><Icon name="users" size={18} /></div><div className="impact-tx">Çoklu rol: tek hesap, birden çok profile bağlı (örn. Öğretmen + Veli). Pasife alma tüm rolleri etkiler.</div></div>}
    </Modal>
  );
}

/* Genel onay modalı — şifre sıfırla / daveti yenile / askıya al / pasife al */
function ConfirmModal({ icon, iconTone, title, sub, message, hint, confirmLabel, confirmIcon, danger, onConfirm, onClose }) {
  const [done, setDone] = useStateM(false);
  if (done) {
    return (
      <Modal icon="check" title={title} onClose={onClose}
        footer={<React.Fragment><div className="spacer"></div><button className="btn btn-primary" onClick={onClose}>Tamam</button></React.Fragment>}>
        <SuccessBody title="İşlem tamamlandı" text={message} />
      </Modal>
    );
  }
  return (
    <Modal icon={icon} iconTone={iconTone} title={title} sub={sub} onClose={onClose}
      footer={<React.Fragment><button className="btn btn-ghost" onClick={onClose}>Vazgeç</button><div className="spacer"></div><button className={'btn ' + (danger ? 'btn-danger' : 'btn-primary')} onClick={() => setDone(true)}><Icon name={confirmIcon || 'check'} size={17} /> {confirmLabel}</button></React.Fragment>}>
      <p style={{ fontSize: 14.5, color: 'var(--text-body)', lineHeight: 1.6 }}>{message}</p>
      {hint && <div className="fld-hint" style={{ marginTop: 14 }}><Icon name="shield" size={14} /><span>{hint}</span></div>}
    </Modal>
  );
}

Object.assign(window, {
  Modal, SuccessBody, EnrollStudentModal, AssignClassModal, LinkGuardianModal,
  HireTeacherModal, AssignSubjectClassModal, SetHomeroomModal,
  InviteUserModal, AssignRolesModal, ConfirmModal,
});
