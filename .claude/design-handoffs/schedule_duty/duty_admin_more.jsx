/* OKSİS — Nöbet & Vekâlet Yönetimi (ADMIN) · Vekâlet + Politika sekmeleri
   duty_admin.jsx içindeki DutyAdminScreen tarafından kullanılır.
   Paylaşılan veri/yardımcılar window üzerinden gelir (DTA_T, DTA_REGIONS, ...). */
const { useState: useStateDtm, useMemo: useMemoDtm } = React;

/* ════════════════ VEKÂLET (BUGÜN) ════════════════
   Gelmeyen öğretmen → bugünkü dersleri → o saatte boştakiler arasından
   branş + adalet (vekâlet yükü) sıralı vekil önerisi → atama.
   Teknik zemin: Faz 2.5 ScheduleException/TeacherSubstitution (öner+kayıt+rapor). */
const DTM_ABSENT = [
  {
    id: 'a1', t: 't03', reason: 'Rapor · tüm gün',
    lessons: [
      { id: 'l1', hr: '09:30', per: '2. ders', cls: '9-A', ders: 'Fizik', room: 'A-201', status: 'open',
        suggest: [{ id: 't07', fit: 'ok', yuk: 1 }, { id: 't06', fit: 'yan', yuk: 0 }, { id: 't01', fit: 'no', yuk: 2 }] },
      { id: 'l2', hr: '11:10', per: '4. ders', cls: '10-A', ders: 'Fizik', room: 'Fizik Lab.', status: 'covered', vekil: 't07' },
      { id: 'l3', hr: '13:30', per: '6. ders', cls: '11-A', ders: 'Fizik', room: 'A-203', status: 'open',
        suggest: [{ id: 't06', fit: 'yan', yuk: 0 }, { id: 't15', fit: 'no', yuk: 1 }, { id: 't09', fit: 'no', yuk: 1 }] },
    ],
  },
  {
    id: 'a2', t: 't02', reason: 'Hizmet içi seminer · tüm gün',
    lessons: [
      { id: 'l4', hr: '08:40', per: '1. ders', cls: '6-A', ders: 'Matematik', room: 'B-110', status: 'covered', vekil: 't01' },
      { id: 'l5', hr: '10:20', per: '3. ders', cls: '9-B', ders: 'Matematik', room: 'B-201', status: 'open',
        suggest: [{ id: 't01', fit: 'ok', yuk: 2 }, { id: 't15', fit: 'no', yuk: 1 }, { id: 't10', fit: 'no', yuk: 3 }] },
      { id: 'l6', hr: '12:40', per: '5. ders', cls: '10-A', ders: 'Matematik', room: 'B-204', status: 'etut' },
    ],
  },
];
const DTM_FIT = { ok: { lbl: 'Aynı branş', ico: 'check' }, yan: { lbl: 'Yan branş', ico: 'circle-dot' }, no: { lbl: 'Farklı branş', ico: 'minus' } };

function DtmCandidate({ c, best, onAssign }) {
  const t = window.DTA_T[c.id];
  const f = DTM_FIT[c.fit];
  return (
    <div className={'dta-cand' + (best ? ' best' : '')}>
      <window.DtaAvatar id={c.id} size={32} />
      <div className="cinfo">
        <div className="nm">{t ? t.ad : ''}</div>
        <div className="meta">
          <span className={'dta-fit ' + c.fit}><Icon name={f.ico} size={10} strokeWidth={c.fit === 'no' ? 3 : 2.4} /> {f.lbl}</span>
          <span className="load"><Icon name="shield" size={11} style={{ verticalAlign: '-2px' }} /> bu hafta {c.yuk} vekâlet</span>
        </div>
      </div>
      <div className="grow"></div>
      {best && <span className="best-tag"><Icon name="sparkles" size={12} /> Önerilen</span>}
      <button className="assign" onClick={onAssign}><Icon name="user-check" size={14} /> Ata</button>
    </div>
  );
}

function DtmLesson({ lesson, fire }) {
  const [st, setSt] = useStateDtm(lesson.status);
  const [vekil, setVekil] = useStateDtm(lesson.vekil || null);
  const [open, setOpen] = useStateDtm(false);

  function assign(c) {
    setVekil(c.id);
    setSt('covered');
    setOpen(false);
    const t = window.DTA_T[c.id];
    fire(<span><b>{t ? t.ad : ''}</b> vekil atandı — {lesson.cls} {lesson.ders} · öğretmene ve sınıfa bildirim gönderildi</span>, 'ok');
  }
  function etut() {
    setSt('etut');
    setVekil(null);
    fire(<span>{lesson.cls} {lesson.ders} · <b>etüt/serbest</b> olarak işaretlendi</span>, 'warn');
  }
  function undo() {
    setSt('open'); setVekil(null);
    fire(<span>Vekâlet kaldırıldı — ders yeniden açık</span>, 'warn');
  }

  const vt = vekil ? window.DTA_T[vekil] : null;
  const cands = lesson.suggest || [];

  return (
    <div className="dta-lesson">
      <div className="dta-lesson-top">
        <div className="when"><div className="hr">{lesson.hr}</div><div className="per">{lesson.per}</div></div>
        <div className="what">
          <div className="t">{lesson.cls} · {lesson.ders}</div>
          <div className="s"><span className="it"><Icon name="map-pin" size={13} /> {lesson.room}</span></div>
        </div>
        <div className="st">
          {st === 'open' && <span className="dta-lst-pill open"><Icon name="alert-triangle" size={13} /> Açık</span>}
          {st === 'covered' && <span className="dta-lst-pill covered"><Icon name="user-check" size={13} /> Vekil atandı</span>}
          {st === 'etut' && <span className="dta-lst-pill etut"><Icon name="book" size={13} /> Etüt / serbest</span>}
        </div>
      </div>

      {st === 'covered' && vt && (
        <div className="dta-covered">
          <window.DtaAvatar id={vekil} size={28} />
          <div className="cx"><div className="t">{vt.ad}</div><div className="s">{window.dtaBrans(vt.brans)} · vekil olarak görevlendirildi</div></div>
          <div className="grow"></div>
          <span className="notif"><Icon name="bell" size={12} /> Bildirildi</span>
          <button className="undo" onClick={undo}><Icon name="rotate-ccw" size={13} /> Geri al</button>
        </div>
      )}

      {st === 'etut' && (
        <div className="dta-covered" style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
          <span className="av" style={{ background: 'var(--text-faint)' }}><Icon name="book" size={14} /></span>
          <div className="cx"><div className="t" style={{ color: 'var(--text-body)' }}>Etüt / serbest çalışma</div><div className="s">Vekil atanmadı — sınıf etüt olarak geçecek</div></div>
          <div className="grow"></div>
          <button className="undo" onClick={undo}><Icon name="rotate-ccw" size={13} /> Geri al</button>
        </div>
      )}

      {st === 'open' && (
        <div className="dta-sugg">
          <div className="dta-sugg-h">
            <Icon name="sparkles" size={13} /> Önerilen vekiller
            <div className="grow"></div>
            <span className="why"><Icon name="info" size={12} /> o saatte boşta · branş uyumu + adalet sırası</span>
          </div>
          <div className="dta-cands">
            {(open ? cands : cands.slice(0, 1)).map((c, i) => (
              <DtmCandidate key={c.id} c={c} best={i === 0} onAssign={() => assign(c)} />
            ))}
          </div>
          <div className="dta-sugg-foot">
            {cands.length > 1 && (
              <button className="dta-mini-btn" onClick={() => setOpen((o) => !o)}>
                <Icon name={open ? 'chevron-down' : 'users-round'} size={14} /> {open ? 'Daha az göster' : 'Diğer ' + (cands.length - 1) + ' aday'}
              </button>
            )}
            <button className="dta-mini-btn" onClick={etut}><Icon name="book" size={14} /> Etüt/serbest yap</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DtaVekalet({ fire }) {
  /* özet sayımları (statik başlangıç durumuna göre) */
  const allLessons = DTM_ABSENT.flatMap((a) => a.lessons);
  const openN = allLessons.filter((l) => l.status === 'open').length;
  const covN = allLessons.filter((l) => l.status === 'covered').length;
  const etutN = allLessons.filter((l) => l.status === 'etut').length;

  return (
    <React.Fragment>
      <div className="dta-vk-daybar">
        <span className="di"><Icon name="user-x" size={22} /></span>
        <div className="dx"><div className="l">Bugün · Salı 25 Kasım</div><div className="t">{DTM_ABSENT.length} öğretmen gelmedi · {allLessons.length} ders etkilendi</div></div>
        <div className="vk-counts">
          <div className="dta-vk-cpill"><span className="v">{openN}</span><span className="k">açık</span></div>
          <div className="dta-vk-cpill"><span className="v">{covN}</span><span className="k">kapatıldı</span></div>
          <div className="dta-vk-cpill"><span className="v">{etutN}</span><span className="k">etüt</span></div>
        </div>
      </div>

      <div className="dta-info">
        <span className="ii"><Icon name="info" size={18} /></span>
        <div className="ix">
          <div className="t">Boş ders = vekâlet adayı (nöbetten farklı)</div>
          <div className="s">Gelmeyen öğretmenin dersini, <b>o saatte dersi olmayan</b> bir öğretmen doldurur. Öneriler branş uyumu ve <b>adil yük</b> (bu haftaki vekâlet sayısı) sırasına göre dizilir. Derste olan öğretmene aynı saate vekâlet atanamaz.</div>
        </div>
      </div>

      <div className="dta-absent">
        {DTM_ABSENT.map((a) => {
          const t = window.DTA_T[a.t];
          return (
            <div className="dta-abs-card" key={a.id}>
              <div className="dta-abs-head">
                <window.DtaAvatar id={a.t} size={40} />
                <div>
                  <div className="nm">{t ? t.ad : ''}</div>
                  <div className="meta"><span className="bd" style={{ background: window.dtaBransFg(t && t.brans) }}></span>{window.dtaBrans(t && t.brans)} öğretmeni · {a.lessons.length} ders</div>
                </div>
                <span className="dta-abs-reason"><Icon name="user-x" size={13} /> {a.reason}</span>
              </div>
              <div className="dta-lessons">
                {a.lessons.map((l) => <DtmLesson key={l.id} lesson={l} fire={fire} />)}
              </div>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
}

/* ════════════════ BÖLGE EKLE / DÜZENLE MODALI ════════════════ */
const DTM_REGION_ICONS = ['building', 'utensils', 'sun', 'door-open', 'map-pin', 'book'];
const DTM_REGION_TIPS = ['Koridor', 'Yoğun alan', 'Açık alan', 'Güvenlik', 'Diğer'];

function DtaRegionModal({ initial, onClose, onSave }) {
  const edit = !!initial;
  const [ad, setAd] = useStateDtm(initial ? initial.ad : '');
  const [tip, setTip] = useStateDtm(initial ? initial.tip : 'Koridor');
  const [ico, setIco] = useStateDtm(initial ? initial.ico : 'building');
  const [cap, setCap] = useStateDtm(initial ? initial.cap : 1);
  const [aktif, setAktif] = useStateDtm(initial ? initial.aktif : true);
  const valid = ad.trim().length > 1;

  return (
    <div className="dta-scrim" onClick={onClose}>
      <div className="dta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dta-modal-head">
          <span className="mi"><Icon name={edit ? 'pencil' : 'map-pin'} size={20} /></span>
          <div><h3>{edit ? 'Bölgeyi düzenle' : 'Yeni nöbet bölgesi'}</h3><div className="s">{edit ? initial.ad : 'Okula özel gözetim noktası tanımlayın'}</div></div>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="dta-modal-body">
          <div className="dtaf">
            <div className="dtaf-field">
              <div className="l">Bölge adı</div>
              <div className="dtaf-input"><Icon name="map-pin" size={16} /><input autoFocus value={ad} onChange={(e) => setAd(e.target.value)} placeholder="örn. 4. Kat Koridoru" /></div>
            </div>
            <div className="dtaf-field">
              <div className="l">Tür</div>
              <div className="dta-seg wide" style={{ flexWrap: 'wrap' }}>
                {DTM_REGION_TIPS.map((x) => <button key={x} className={tip === x ? 'on' : ''} onClick={() => setTip(x)}>{x}</button>)}
              </div>
            </div>
            <div className="dtaf-row">
              <div className="dtaf-field">
                <div className="l">Simge</div>
                <div className="dtaf-icons">
                  {DTM_REGION_ICONS.map((ic) => (
                    <button key={ic} className={'dtaf-ico' + (ico === ic ? ' on' : '')} onClick={() => setIco(ic)}><Icon name={ic} size={19} /></button>
                  ))}
                </div>
              </div>
              <div className="dtaf-field" style={{ flex: '0 0 auto' }}>
                <div className="l">Eşzamanlı nöbetçi</div>
                <div className="s">Paralel gözetim</div>
                <div className="dtaf-step">
                  <button onClick={() => setCap((c) => Math.max(1, c - 1))} disabled={cap <= 1}><Icon name="minus" size={16} /></button>
                  <span className="v">{cap}</span>
                  <button onClick={() => setCap((c) => Math.min(4, c + 1))} disabled={cap >= 4}><Icon name="plus" size={16} /></button>
                </div>
              </div>
            </div>
            <div className={'dta-toggle-row' + (aktif ? ' on' : '')} style={{ marginTop: 2 }}>
              <span className="tg-ico" style={{ background: 'var(--info-bg)', color: 'var(--accent-bright)' }}><Icon name="shield" size={17} /></span>
              <div className="tx"><div className="t">Bölge {aktif ? 'aktif' : 'pasif'}</div><div className="s">{aktif ? 'Çizelgede nöbetçi atanabilir.' : 'Çizelgede görünmez, atama yapılmaz.'}</div></div>
              <button className={'dta-switch' + (aktif ? ' on' : '')} onClick={() => setAktif((v) => !v)}></button>
            </div>
          </div>
        </div>
        <div className="dta-modal-foot">
          <div className="grow"></div>
          <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
          <button className="btn btn-primary" disabled={!valid} onClick={() => onSave({ ad: ad.trim(), tip, ico, cap, aktif })}>
            <Icon name="check" size={16} strokeWidth={2.6} /> {edit ? 'Güncelle' : 'Bölge ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════ BÖLGE SİLME ONAYI ════════════════ */
function DtaConfirm({ icon, tone, title, body, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="dta-scrim" onClick={onCancel}>
      <div className="dta-modal sm" onClick={(e) => e.stopPropagation()}>
        <div className="dta-modal-body">
          <div className="dta-confirm">
            <div className={'ci ' + (tone || 'danger')}><Icon name={icon || 'trash-2'} size={24} /></div>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        </div>
        <div className="dta-modal-foot">
          <div className="grow"></div>
          <button className="btn btn-ghost" onClick={onCancel}>Vazgeç</button>
          <button className="btn btn-danger" onClick={onConfirm}><Icon name="trash-2" size={16} /> {confirmLabel || 'Sil'}</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════ MUAFİYET EKLE MODALI ════════════════ */
function DtaMuafModal({ existing, onClose, onSave }) {
  const eligible = window.DTA_TEACHERS.filter((t) => !existing.includes(t.id));
  const [tid, setTid] = useStateDtm(eligible[0] ? eligible[0].id : '');
  const [tur, setTur] = useStateDtm('surekli');
  const [tarih, setTarih] = useStateDtm('');
  const [sebep, setSebep] = useStateDtm('');
  const valid = tid && sebep.trim().length > 2 && (tur === 'surekli' || tarih.trim().length > 1);

  return (
    <div className="dta-scrim" onClick={onClose}>
      <div className="dta-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dta-modal-head">
          <span className="mi"><Icon name="user-x" size={20} /></span>
          <div><h3>Muafiyet ekle</h3><div className="s">Öğretmeni nöbet dağıtımının dışında tutar</div></div>
          <button className="x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="dta-modal-body">
          {eligible.length === 0 ? (
            <div className="dta-tp-empty" style={{ padding: '24px 10px' }}>
              <div className="ic"><Icon name="check-circle" size={26} /></div>
              <div className="t">Tüm öğretmenler zaten muaf</div>
              <div className="s">Eklenebilecek başka öğretmen yok.</div>
            </div>
          ) : (
            <div className="dtaf">
              <div className="dtaf-field">
                <div className="l">Öğretmen</div>
                <div className="dtaf-select">
                  <select value={tid} onChange={(e) => setTid(e.target.value)}>
                    {eligible.map((x) => <option key={x.id} value={x.id}>{x.ad} · {window.dtaBrans(x.brans)}</option>)}
                  </select>
                  <span className="chev"><Icon name="chevron-down" size={16} /></span>
                </div>
              </div>
              <div className="dtaf-field">
                <div className="l">Muafiyet türü</div>
                <div className="dta-seg wide">
                  <button className={tur === 'surekli' ? 'on' : ''} onClick={() => setTur('surekli')}><Icon name="lock" size={13} /> Sürekli</button>
                  <button className={tur === 'gecici' ? 'on' : ''} onClick={() => setTur('gecici')}><Icon name="clock" size={13} /> Geçici</button>
                </div>
              </div>
              {tur === 'gecici' && (
                <div className="dtaf-field">
                  <div className="l">Tarih aralığı</div>
                  <div className="dtaf-input"><Icon name="calendar" size={16} /><input value={tarih} onChange={(e) => setTarih(e.target.value)} placeholder="örn. 10–24 Kas" /></div>
                </div>
              )}
              <div className="dtaf-field">
                <div className="l">Sebep</div>
                <div className="dtaf-input"><Icon name="pencil" size={16} /><input value={sebep} onChange={(e) => setSebep(e.target.value)} placeholder="örn. İdari görev · sağlık · yarı zamanlı" /></div>
              </div>
            </div>
          )}
        </div>
        {eligible.length > 0 && (
          <div className="dta-modal-foot">
            <span className="dta-param-off"><Icon name="info" size={13} /> Muaf öğretmen dağıtıma alınmaz</span>
            <div className="grow"></div>
            <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
            <button className="btn btn-primary" disabled={!valid} onClick={() => onSave({ t: tid, tur, tarih: tur === 'surekli' ? 'Sürekli' : tarih.trim(), sebep: sebep.trim() })}>
              <Icon name="plus" size={16} /> Muafiyet ekle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════ BÖLGELER & POLİTİKA ════════════════ */
function DtaPolitika({ pol, setPol, yanciOn, setYanciOn, fire }) {
  const { regions, muaf, siklik, duzen } = pol;
  const setField = (k, v) => setPol((p) => ({ ...p, [k]: v }));
  const [regionModal, setRegionModal] = useStateDtm(null); /* {mode, region} */
  const [delRegion, setDelRegion] = useStateDtm(null);
  const [muafModal, setMuafModal] = useStateDtm(false);

  function toggleRegion(id) {
    setField('regions', regions.map((r) => r.id === id ? { ...r, aktif: !r.aktif } : r));
  }
  function saveRegion(data) {
    if (regionModal.mode === 'edit') {
      setField('regions', regions.map((r) => r.id === regionModal.region.id ? { ...r, ...data } : r));
      fire(<span><b>{data.ad}</b> güncellendi</span>, 'ok');
    } else {
      const id = 'rg' + Date.now();
      setField('regions', [...regions, { id, ...data }]);
      fire(<span><b>{data.ad}</b> bölgesi eklendi</span>, 'ok');
    }
    setRegionModal(null);
  }
  function removeRegion() {
    setField('regions', regions.filter((r) => r.id !== delRegion.id));
    fire(<span><b>{delRegion.ad}</b> bölgesi silindi</span>, 'warn');
    setDelRegion(null);
  }
  function addMuaf(data) {
    setField('muaf', [...muaf, { id: 'm' + Date.now(), ...data }]);
    const t = window.DTA_T[data.t];
    fire(<span><b>{t ? t.ad : ''}</b> muaf olarak eklendi</span>, 'ok');
    setMuafModal(false);
  }
  function removeMuaf(id) {
    setField('muaf', muaf.filter((x) => x.id !== id));
    fire(<span>Muafiyet kaldırıldı</span>, 'warn');
  }
  function toggleYanci() {
    setYanciOn((v) => !v);
    fire(yanciOn ? <span>Yancılık <b>kapatıldı</b> — tüm ekranlardan kaldırıldı</span> : <span>Yancılık <b>açıldı</b> — nöbetlere yancı gösterilecek</span>, yanciOn ? 'warn' : 'ok');
  }

  return (
    <div className="dta-pol">
      {/* SOL: bölge kataloğu */}
      <div>
        <div className="dta-card">
          <div className="dta-card-h">
            <span className="hi"><Icon name="map-pin" size={17} /></span>
            <div><h3>Nöbet Bölgeleri</h3><div className="s">Okula özel · gözetim noktaları</div></div>
            <div className="grow"></div>
            <button className="add" onClick={() => setRegionModal({ mode: 'add' })}><Icon name="plus" size={14} /> Bölge ekle</button>
          </div>
          <div className="dta-rg-list">
            {regions.map((r) => (
              <div className={'dta-rg-row' + (r.aktif ? '' : ' off')} key={r.id}>
                <span className="ri"><Icon name={r.ico} size={18} /></span>
                <div className="rx">
                  <div className="nm">{r.ad}</div>
                  <div className="meta">{r.tip}<span className="dot"></span>{r.cap} nöbetçi{r.cap > 1 ? ' (paralel)' : ''}</div>
                </div>
                <div className="acts">
                  <button className={'dta-switch' + (r.aktif ? ' on' : '')} onClick={() => toggleRegion(r.id)} title={r.aktif ? 'Aktif' : 'Pasif'}></button>
                  <button className="dta-icobtn" onClick={() => setRegionModal({ mode: 'edit', region: r })} title="Düzenle"><Icon name="pencil" size={15} /></button>
                  <button className="dta-icobtn danger" onClick={() => setDelRegion(r)} title="Sil"><Icon name="trash-2" size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Muafiyetler */}
        <div className="dta-card" style={{ marginTop: 18 }}>
          <div className="dta-card-h">
            <span className="hi"><Icon name="user-x" size={17} /></span>
            <div><h3>Muafiyetler</h3><div className="s">Nöbetten muaf tutulan öğretmenler</div></div>
            <div className="grow"></div>
            <button className="add" onClick={() => setMuafModal(true)}><Icon name="plus" size={14} /> Muafiyet ekle</button>
          </div>
          <div className="dta-muaf-list">
            {muaf.map((m) => {
              const t = window.DTA_T[m.t];
              return (
                <div className="dta-muaf-row" key={m.id}>
                  <window.DtaAvatar id={m.t} size={34} />
                  <div className="mx">
                    <div className="nm">{t ? t.ad : ''}</div>
                    <div className="rs">{m.sebep}</div>
                  </div>
                  <span className={'dta-muaf-tur ' + m.tur}><Icon name={m.tur === 'surekli' ? 'lock' : 'clock'} size={11} /> {m.tur === 'surekli' ? 'Sürekli' : 'Geçici · ' + m.tarih}</span>
                  <button className="dta-icobtn danger" onClick={() => removeMuaf(m.id)} title="Kaldır"><Icon name="x" size={15} /></button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SAĞ: politika */}
      <div className="dta-card">
        <div className="dta-card-h">
          <span className="hi"><Icon name="sliders" size={17} /></span>
          <div><h3>Nöbet Politikası</h3><div className="s">Okul bazlı · dağıtımı yönlendirir</div></div>
        </div>
        <div className="dta-pol-body">
          <div className="dta-fld">
            <div className="fl">Haftalık nöbet sıklığı</div>
            <div className="fs">Öğretmen kadrosuna göre kişi başı nöbet günü sayısı. Bu okulda öğretmen açığı nedeniyle haftada 2 gün.</div>
            <div className="dta-seg wide">
              {[['2hafta', '2 gün / hafta'], ['1hafta', '1 gün / hafta'], ['2haftada1', '2 haftada 1']].map(([k, l]) => (
                <button key={k} className={(siklik === k ? 'on' : '')} onClick={() => setField('siklik', k)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="dta-fld">
            <div className="fl">Gün düzeni</div>
            <div className="fs">Nöbet günleri ardışık mı verilsin, yoksa haftaya yayılsın mı?</div>
            <div className="dta-seg wide">
              {[['ardisik', 'Ardışık günler'], ['yayili', 'Haftaya yayılı']].map(([k, l]) => (
                <button key={k} className={(duzen === k ? 'on' : '')} onClick={() => setField('duzen', k)}>{l}</button>
              ))}
            </div>
          </div>

          <div className="dta-fld">
            <div className="fl">Öğle arası yancılığı</div>
            <div className="fs">Nöbetçi öğle yemeğindeyken (15–20 dk) bölgesine bakacak yancı öğretmen planlansın mı? Kapalıysa kavram hiçbir ekranda görünmez.</div>
            <div className={'dta-toggle-row' + (yanciOn ? ' on' : '')}>
              <span className="tg-ico"><Icon name="coffee" size={17} /></span>
              <div className="tx">
                <div className="t">Yancılık görevi {yanciOn ? 'açık' : 'kapalı'}</div>
                <div className="s">{yanciOn ? 'Nöbetlere yancı atanır ve çizelge, öğretmen görünümü ve bildirimlerde gösterilir.' : 'Yancı ataması ve gösterimi yapılmaz.'}</div>
              </div>
              <button className={'dta-switch' + (yanciOn ? ' on' : '')} onClick={toggleYanci}></button>
            </div>
          </div>

          <div className="aca-note ok">
            <Icon name="shield-check" size={14} />
            <span>Müsait olmayan saate nöbet yazılmaz; muaf öğretmenler dağıtıma alınmaz. Politika değişiklikleri yalnızca yeni dağıtımı etkiler — yayınlanmış çizelge korunur.</span>
          </div>
        </div>
      </div>

      {regionModal && <DtaRegionModal initial={regionModal.mode === 'edit' ? regionModal.region : null} onClose={() => setRegionModal(null)} onSave={saveRegion} />}
      {delRegion && <DtaConfirm icon="trash-2" tone="danger" title="Bölgeyi sil" body={<span><b>{delRegion.ad}</b> bölgesi silinsin mi? Bu bölgeye bağlı nöbet atamaları çizelgeden kaldırılır. Bu işlem geri alınamaz.</span>} confirmLabel="Bölgeyi sil" onCancel={() => setDelRegion(null)} onConfirm={removeRegion} />}
      {muafModal && <DtaMuafModal existing={muaf.map((m) => m.t)} onClose={() => setMuafModal(false)} onSave={addMuaf} />}
    </div>
  );
}

Object.assign(window, { DtaVekalet, DtaPolitika, DtaRegionModal, DtaMuafModal, DtaConfirm, DtmLesson, DtmCandidate });
