/* OKSİS — Akademik · Ders Programı · Onay & Yayınlama adımı
   Editör veya hub'daki "Yayınla" → sağdan açılan adım paneli (drawer).
   Doğrulama kapısı → etki özeti → değişiklik özeti → yayın türü →
   sürüm notu → bildirim kanalları → onay teyidi → yayınlanıyor → başarı. */
const { useState: useStatePub, useEffect: useEffectPub } = React;

/* örnek değişiklik özeti (v4 → v5) */
const PUB_CHANGES_DEMO = [
  { when: 'Salı · 3. saat', was: 'Fizik', now: 'Kimya' },
  { when: 'Çarşamba · 5. saat', was: 'Derslik B-204', now: 'Fizik Lab.' },
  { when: 'Perşembe · 2. saat', was: 'N. Güneş', now: 'H. Kılıç' },
];

function PublishFlow({ meta, conflicts, missing, issues, affected, changes, onClose, onPublished, onGotoCell }) {
  const cf = conflicts || 0;
  const ms = missing || 0;
  const aff = affected || { teachers: 3, students: 28, parents: 26 };
  const chgs = changes || PUB_CHANGES_DEMO;
  const issueList = issues || [];
  const ready = cf === 0 && ms === 0;
  const blocked = cf > 0;
  const forceOnly = cf === 0 && ms > 0;   /* yalnızca eksik saat → "Yine de yayınla" */

  const [pubType, setPubType] = useStatePub('kalici');
  const [date, setDate] = useStatePub('2026-02-16');
  const [note, setNote] = useStatePub('');
  const [chInapp, setChInapp] = useStatePub(true);
  const [chPush, setChPush] = useStatePub(false);
  const [chEmail, setChEmail] = useStatePub(false);
  const [step, setStep] = useStatePub('form');   /* form · confirm · publishing · done */
  const [undo, setUndo] = useStatePub(9);

  const total = aff.teachers + aff.students + aff.parents;

  /* yayınlanıyor → başarı */
  useEffectPub(() => {
    if (step !== 'publishing') return;
    const tm = setTimeout(() => setStep('done'), 1300);
    return () => clearTimeout(tm);
  }, [step]);
  /* geri-al penceresi sayacı */
  useEffectPub(() => {
    if (step !== 'done') return;
    if (undo <= 0) return;
    const tm = setTimeout(() => setUndo((u) => u - 1), 1000);
    return () => clearTimeout(tm);
  }, [step, undo]);

  function doPublish() { onPublished && onPublished({ pubType, date, note, channels: { chInapp, chPush, chEmail } }); setStep('publishing'); }

  /* ── onay teyidi ── */
  if (step === 'confirm') {
    return (
      <React.Fragment>
        <div className="drawer-scrim" onClick={onClose}></div>
        <aside className="pub-drawer" role="dialog" aria-modal="true">
          <div className="pub-head">
            <div className="pt"><h3>Yayını Onayla</h3></div>
            <button className="pub-x" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>
          <div className="pub-body">
            <div className="pub-confirm">
              <div className="ci"><Icon name="upload-cloud" size={26} /></div>
              <h4>{meta.ad} programı v{meta.ver + 1} olarak yayınlanacak</h4>
              <p>Bu işlem yeni sürümü <b>{total} kişiye</b> bildirir ve programı öğretmen, öğrenci ve veli görünümlerinde anında günceller.</p>
              <div className="recap">
                <div className="recap-row"><span className="l">Sürüm</span><span className="v">v{meta.ver} → v{meta.ver + 1}</span></div>
                <div className="recap-row"><span className="l">Yayın türü</span><span className="v">{pubType === 'kalici' ? 'Kalıcı yayın' : 'Geçici · ' + date}</span></div>
                <div className="recap-row"><span className="l">Bildirilecek</span><span className="v">{total} kişi</span></div>
              </div>
            </div>
          </div>
          <div className="pub-foot">
            <button className="btn btn-ghost" onClick={() => setStep('form')}><Icon name="chevron-left" size={17} /> Geri</button>
            <div className="grow"></div>
            <button className="btn btn-primary" onClick={doPublish}><Icon name="check" size={17} /> Onayla ve Yayınla</button>
          </div>
        </aside>
      </React.Fragment>
    );
  }

  /* ── yayınlanıyor ── */
  if (step === 'publishing') {
    return (
      <React.Fragment>
        <div className="drawer-scrim"></div>
        <aside className="pub-drawer" role="dialog" aria-modal="true">
          <div className="pub-publishing">
            <div className="pub-spin"></div>
            <div className="pt">Yayınlanıyor…</div>
            <div className="ps">Sürüm oluşturuluyor ve bildirimler hazırlanıyor</div>
            <div className="pub-progress"><i></i></div>
          </div>
        </aside>
      </React.Fragment>
    );
  }

  /* ── başarı + geri-al ── */
  if (step === 'done') {
    const R = 13, C = 2 * Math.PI * R, off = C * (1 - undo / 9);
    return (
      <React.Fragment>
        <div className="drawer-scrim" onClick={onClose}></div>
        <aside className="pub-drawer" role="dialog" aria-modal="true">
          <div className="pub-head">
            <div className="pt"><h3>Yayınlandı</h3></div>
            <button className="pub-x" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>
          <div className="pub-body">
            <div className="pub-done">
              <div className="dc"><Icon name="check" size={36} strokeWidth={2.4} /></div>
              <h4>{meta.ad} · Sınıf Programı</h4>
              <div className="dv"><span className="sch-st pub"><span className="d"></span>Yayın</span><span className="sch-ver">v{meta.ver + 1}</span></div>
              <div className="dsub">{pubType === 'kalici' ? 'Yeni sürüm yayında.' : 'Geçici değişiklik ' + date + ' için uygulandı.'} {total} kişiye bildirim gönderildi. Programlar tüm görünümlerde güncellendi.</div>
              {undo > 0 ? (
                <div className="pub-undo">
                  <div className="ut"><div className="t">Bu yayını geri alabilirsiniz</div><div className="s">v{meta.ver}'e dön · {undo}sn kaldı</div></div>
                  <div className="ring">
                    <svg width="30" height="30"><circle cx="15" cy="15" r={R} fill="none" stroke="var(--line)" strokeWidth="3" /><circle cx="15" cy="15" r={R} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} /></svg>
                    <span className="num">{undo}</span>
                  </div>
                  <button className="btn btn-ghost" onClick={() => { setStep('form'); setUndo(9); }}><Icon name="rotate-ccw" size={15} /> Geri Al</button>
                </div>
              ) : (
                <div className="pub-undo"><div className="ut"><div className="t">Geri alma süresi doldu</div><div className="s">Değişiklik için yeni bir yayın yapın</div></div></div>
              )}
            </div>
          </div>
          <div className="pub-foot">
            <div className="grow"></div>
            <button className="btn btn-primary" onClick={() => { onClose(); }}><Icon name="arrow-right" size={16} /> Hub'a Dön</button>
          </div>
        </aside>
      </React.Fragment>
    );
  }

  /* ── ana form ── */
  return (
    <React.Fragment>
      <div className="drawer-scrim" onClick={onClose}></div>
      <aside className="pub-drawer" role="dialog" aria-modal="true">
        <div className="pub-head">
          <div className="crumb">
            <span>Ders Programı</span><Icon name="chevron-right" size={12} className="sep" />
            <span>{meta.ad}</span><Icon name="chevron-right" size={12} className="sep" />
            <span>Yayınla</span>
          </div>
          <div className="pt">
            <h3>Programı Yayınla</h3>
            <span className="ver">{meta.ad} · v{meta.ver} <Icon name="arrow-right" size={13} /> <b>v{meta.ver + 1}</b></span>
          </div>
          <button className="pub-x" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="pub-body">
          {/* 1) doğrulama kapısı */}
          <div className="pub-sec">
            {ready ? (
              <div className="pub-gate ok">
                <div className="pub-gate-top">
                  <div className="pub-gate-ic"><Icon name="check-circle" size={20} /></div>
                  <div className="pub-gate-tx"><div className="t">Yayına hazır</div><div className="s">Çakışma veya eksik saat yok — program tüm doğrulamalardan geçti.</div></div>
                </div>
              </div>
            ) : (
              <div className={'pub-gate ' + (blocked ? 'bad' : 'warn')}>
                <div className="pub-gate-top">
                  <div className="pub-gate-ic"><Icon name="alert-triangle" size={19} /></div>
                  <div className="pub-gate-tx">
                    <div className="t">{[cf > 0 ? cf + ' çakışma' : null, ms > 0 ? ms + ' eksik saat' : null].filter(Boolean).join(' · ')} bulundu</div>
                    <div className="s">{blocked ? 'Açık çakışmalar çözülmeden program yayınlanamaz.' : 'Eksik saatler var; isterseniz eksik bırakarak yayınlayabilirsiniz.'}</div>
                  </div>
                </div>
                <div className="pub-issues">
                  {issueList.map((it, i) => (
                    <button key={i} className={'pub-issue ' + it.kind} onClick={() => onGotoCell && onGotoCell(it.cellKey)}>
                      <span className="pi"><Icon name={it.kind === 'bad' ? 'alert-triangle' : 'clock'} size={14} /></span>
                      <span className="ix"><span className="t">{it.title}</span><span className="s">{it.sub}</span></span>
                      {onGotoCell && <span className="go">Hücreye git <Icon name="arrow-right" size={12} /></span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2) etki özeti */}
          <div className="pub-sec">
            <div className="pub-sec-h"><span className="step">1</span> Bu yayından etkilenecekler</div>
            <div className="pub-impact">
              <div className="box"><div className="ic"><Icon name="briefcase" size={16} /></div><div className="v">{aff.teachers}</div><div className="l">Öğretmen</div></div>
              <div className="box"><div className="ic"><Icon name="graduation-cap" size={16} /></div><div className="v">{aff.students}</div><div className="l">Öğrenci</div></div>
              <div className="box"><div className="ic"><Icon name="users" size={16} /></div><div className="v">{aff.parents}</div><div className="l">Veli</div></div>
            </div>
            <div className="pub-note-line"><Icon name="info" size={14} /><span>Yayınlandığında bu program, öğretmen · öğrenci · veli görünümlerinde anında güncellenir.</span></div>
          </div>

          {/* 3) değişiklik özeti */}
          <div className="pub-sec">
            <div className="pub-sec-h"><span className="step">2</span> v{meta.ver}'e göre değişenler</div>
            <div className="pub-diff">
              {chgs.slice(0, 3).map((c, i) => (
                <div className="pub-diff-row" key={i}>
                  <span className="when">{c.when}</span>
                  <span className="chg"><span className="was">{c.was}</span><Icon name="arrow-right" size={13} className="arr" /><span className="now">{c.now}</span></span>
                </div>
              ))}
              {chgs.length > 3 && <div className="pub-diff-more">ve {chgs.length - 3} değişiklik daha…</div>}
            </div>
          </div>

          {/* 4) yayın türü */}
          <div className="pub-sec">
            <div className="pub-sec-h"><span className="step">3</span> Yayın türü</div>
            <div className="pub-seg">
              <button className={'pub-seg-opt' + (pubType === 'kalici' ? ' on' : '')} onClick={() => setPubType('kalici')}>
                <span className="ot"><span className="rd"></span> Kalıcı yayın</span>
                <span className="os">Yeni sürüm oluşturur, programı kalıcı günceller.</span>
              </button>
              <button className={'pub-seg-opt' + (pubType === 'gecici' ? ' on' : '')} onClick={() => setPubType('gecici')}>
                <span className="ot"><span className="rd"></span> Geçici değişiklik</span>
                <span className="os">Yalnızca seçilen tarih için; kalıcı programı bozmaz.</span>
              </button>
            </div>
            {pubType === 'gecici' && (
              <div className="pub-date">
                <span className="dl"><Icon name="calendar" size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />Tarih</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            )}
          </div>

          {/* 5) sürüm notu */}
          <div className="pub-sec">
            <div className="pub-sec-h"><span className="step">4</span> Sürüm notu <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-faint)', fontWeight: 600 }}>· opsiyonel</span></div>
            <textarea className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Değişiklik açıklaması (ör. Şubat revizyonu, matematik öğretmeni değişikliği)…"></textarea>
          </div>

          {/* 6) bildirim kanalları */}
          <div className="pub-sec">
            <div className="pub-sec-h"><span className="step">5</span> Bildirim kanalları</div>
            <div className="pub-ch">
              <div className={'pub-ch-row' + (chInapp ? ' on' : '')} onClick={() => setChInapp((v) => !v)}>
                <span className="cb"><Icon name="check" size={13} strokeWidth={3} /></span>
                <span className="ci"><Icon name="bell" size={16} /></span>
                <span className="ct"><span className="t">Uygulama içi bildirim</span><span className="s">Portallarda anlık görünür</span></span>
                <span className="def">Varsayılan</span>
              </div>
              <div className={'pub-ch-row' + (chPush ? ' on' : '')} onClick={() => setChPush((v) => !v)}>
                <span className="cb"><Icon name="check" size={13} strokeWidth={3} /></span>
                <span className="ci"><Icon name="smartphone" size={16} /></span>
                <span className="ct"><span className="t">Push bildirimi</span><span className="s">Mobil uygulamaya anlık gönderim</span></span>
              </div>
              <div className={'pub-ch-row' + (chEmail ? ' on' : '')} onClick={() => setChEmail((v) => !v)}>
                <span className="cb"><Icon name="check" size={13} strokeWidth={3} /></span>
                <span className="ci"><Icon name="mail" size={16} /></span>
                <span className="ct"><span className="t">E-posta</span><span className="s">Özet e-posta gönderilir</span></span>
              </div>
            </div>
            <div className="pub-ch-recipients"><Icon name="users" size={14} /><span>Etkilenen <b>{aff.teachers} öğretmen</b>, <b>{aff.students} öğrenci</b>, <b>{aff.parents} veli</b>{(chInapp || chPush || chEmail) ? '' : ' · bildirim kapalı'}</span></div>
          </div>
        </div>

        {/* alt aksiyon çubuğu */}
        <div className="pub-foot">
          <button className="btn btn-ghost" onClick={onClose}>{ready ? 'İptal' : 'Taslakta Kal'}</button>
          <div className="grow"></div>
          {ready ? (
            <button className="btn btn-primary" onClick={() => setStep('confirm')}><Icon name="upload-cloud" size={17} /> Yayınla</button>
          ) : blocked ? (
            <button className="btn btn-primary disabled" disabled title="Çakışmalar çözülmeli"><Icon name="upload-cloud" size={17} /> Yayınla</button>
          ) : (
            <button className="btn btn-warn" onClick={() => setStep('confirm')}><Icon name="alert-triangle" size={16} /> Yine de Yayınla</button>
          )}
        </div>
      </aside>
    </React.Fragment>
  );
}

Object.assign(window, { PublishFlow });
