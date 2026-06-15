/* OKSİS — Akademik · Ders Programı · Otomatik Oluştur
   İki aşamalı sihirbaz drawer: 1) Üretim ayarları → 2) Önizleme & karşılaştırma.
   Hub/editör/yayınlama ile aynı dil. Bir taslak seçmek YAYINLAMAZ; editöre
   taslak olarak yükler — insan elle ince ayar yapar. */
const { useState: useStateAg, useEffect: useEffectAg, useRef: useRefAg } = React;

/* mini-grid için örnek branş renkleri */
const AG_COLORS = ['#2F4DA0', '#A93B62', '#5F6B16', '#5B45B0', '#0C6B66', '#2E7D36', '#92600F', '#146C94', '#6B5840', '#B45A0C', '#28617A'];
/* deterministik mini-hafta üretir (5 gün × 8 saat) — seed'e göre değişir */
function agMiniWeek(seed, conflictAt) {
  const cells = [];
  for (let p = 0; p < 6; p++) for (let d = 0; d < 5; d++) {
    const i = p * 5 + d;
    if ((i * 13 + seed * 5) % 11 === 0) { cells.push('empty'); continue; }
    cells.push(AG_COLORS[(i * 3 + seed) % AG_COLORS.length]);
  }
  if (conflictAt != null) cells[conflictAt] = 'conflict';
  return cells;
}

/* taslak verisi (Atlas Koleji · gerçekçi skorlar) */
const AG_DRAFTS = [
  { id: 'A', name: 'Taslak A', score: 'good', scoreLabel: 'İyi', rec: true,  conf: 0, miss: 0, bos: 2.0, pref: 88, denge: 'Dengeli', seed: 2 },
  { id: 'B', name: 'Taslak B', score: 'good', scoreLabel: 'İyi', rec: false, conf: 0, miss: 1, bos: 3.0, pref: 81, denge: 'Orta',    seed: 5 },
  { id: 'C', name: 'Taslak C', score: 'mid',  scoreLabel: 'Orta', rec: false, conf: 1, miss: 0, bos: 2.0, pref: 76, denge: 'Dengeli', seed: 8, conflictAt: 12 },
];

const AG_DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum'];
const AG_SUBJ = ['Matematik', 'Türk D.', 'İngilizce', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Din K.', 'Beden', 'Bilişim'];
const AG_TEACH = ['A. Yılmaz', 'S. Aydın', 'L. Brown', 'A. Demir', 'D. Koral', 'K. Şahin', 'H. Kılıç', 'N. Güneş', 'F. Sezer', 'C. Aral', 'T. Berk'];

function AgMini({ seed, conflictAt }) {
  const cells = agMiniWeek(seed, conflictAt);
  return (
    <div className="ag-mini">
      <div className="ag-mini-days">{AG_DAYS.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="ag-mini-grid">
        {cells.map((c, i) => (
          <div key={i} className={'ag-mini-cell' + (c === 'conflict' ? ' conflict' : c === 'empty' ? ' empty' : c ? ' f' : '')} style={c && c !== 'conflict' && c !== 'empty' ? { '--mc': c } : null}></div>
        ))}
      </div>
    </div>
  );
}

/* büyük önizleme overlay */
function AgPreview({ draft, onClose }) {
  const cells = agMiniWeek(draft.seed, draft.conflictAt);
  return (
    <div className="ag-preview-scrim" onClick={onClose}>
      <div className="ag-preview" onClick={(e) => e.stopPropagation()}>
        <div className="ag-preview-head">
          <span className={'ag-card-score ' + draft.score}><Icon name={draft.score === 'good' ? 'check-circle' : 'alert-triangle'} size={13} /> {draft.scoreLabel}</span>
          <div className="t">{draft.name} · büyük önizleme</div>
          <div className="grow"></div>
          <button className="tb-icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="ag-preview-body">
          <div className="ag-pv-grid">
            <div className="ag-pv-h"></div>
            {AG_DAYS.map((d) => <div className="ag-pv-h" key={d}>{d}</div>)}
            {Array.from({ length: 6 }).map((_, p) => (
              <React.Fragment key={p}>
                <div className="ag-pv-t">{p + 1}</div>
                {AG_DAYS.map((d, di) => {
                  const i = p * 5 + di;
                  const c = cells[i];
                  if (c === 'conflict') return <div className="ag-pv-cell conflict" key={di}><div className="nm" style={{ color: 'var(--danger)' }}>{AG_SUBJ[(i + draft.seed) % AG_SUBJ.length]}</div><div className="tn">Çakışma</div></div>;
                  if (c === 'empty' || !c) return <div className="ag-pv-cell empty" key={di}></div>;
                  return <div className="ag-pv-cell" key={di} style={{ '--mc': c }}><div className="nm">{AG_SUBJ[(i + draft.seed) % AG_SUBJ.length]}</div><div className="tn">{AG_TEACH[(i * 2 + draft.seed) % AG_TEACH.length]}</div></div>;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* tek taslak kartı */
function AgCard({ draft, onOpen, onPreview }) {
  return (
    <div className={'ag-card' + (draft.rec ? ' recommended' : '')}>
      {draft.rec && <span className="ag-card-rec"><Icon name="sparkles" size={11} /> Önerilen</span>}
      <div className="ag-card-head">
        <span className="cn">{draft.name}</span>
        <span className={'ag-card-score ' + draft.score}><Icon name={draft.score === 'good' ? 'check-circle' : 'alert-triangle'} size={13} /> {draft.scoreLabel}</span>
      </div>
      <div className="ag-metrics">
        <div className="ag-metric"><span className="ml"><Icon name="alert-triangle" /> Çakışma</span><span className={'mv ' + (draft.conf === 0 ? 'good' : 'bad')}>{draft.conf}</span></div>
        <div className="ag-metric"><span className="ml"><Icon name="clock" /> Eksik saat</span><span className={'mv ' + (draft.miss === 0 ? 'good' : 'warn')}>{draft.miss}</span></div>
        <div className="ag-metric"><span className="ml"><Icon name="square-dashed" /> Ort. boş saat</span><span className="mv">{draft.bos.toFixed(1)}</span></div>
        <div className="ag-metric"><span className="ml"><Icon name="heart" /> Tercih uyumu</span><span className={'mv ' + (draft.pref >= 85 ? 'good' : '')}>%{draft.pref}</span></div>
        <div className="ag-metric"><span className="ml"><Icon name="bar-chart" /> Günlük denge</span><span className="mv">{draft.denge}</span></div>
      </div>
      <AgMini seed={draft.seed} conflictAt={draft.conflictAt} />
      <div className="ag-card-foot">
        <button className="btn btn-primary" onClick={() => onOpen(draft)}><Icon name="pencil-ruler" size={15} /> Editörde Aç</button>
        <button className="btn btn-ghost ag-btn-ico" title="Büyük önizleme" onClick={() => onPreview(draft)}><Icon name="maximize" size={16} /></button>
      </div>
    </div>
  );
}

/* ════════════════ Ana akış ════════════════ */
function AutoGenFlow({ classes, defaultClass, onClose, onUseDraft }) {
  const CLS = classes || [
    { id: '9A', ad: '9-A', kademe: 9 }, { id: '9B', ad: '9-B', kademe: 9 }, { id: '9C', ad: '9-C', kademe: 9 },
    { id: '10A', ad: '10-A', kademe: 10 }, { id: '10B', ad: '10-B', kademe: 10 },
    { id: '11A', ad: '11-A', kademe: 11 }, { id: '11B', ad: '11-B', kademe: 11 },
    { id: '12A', ad: '12-A', kademe: 12 }, { id: '12B', ad: '12-B', kademe: 12 },
  ];
  const [stage, setStage] = useStateAg('settings');   /* settings · generating · results · nosolution */
  const [scope, setScope] = useStateAg(defaultClass ? 'single' : 'kademe');
  const [single, setSingle] = useStateAg(defaultClass || '9A');
  const [kademe, setKademe] = useStateAg(9);
  const [w, setW] = useStateAg({ sabah: 'orta', pencere: 'yuksek', denge: 'orta', blok: true });
  const [strict, setStrict] = useStateAg(false);
  const [genMsg, setGenMsg] = useStateAg(0);
  const [preview, setPreview] = useStateAg(null);
  const setWeight = (k, v) => setW((s) => ({ ...s, [k]: v }));

  const targetClasses = scope === 'single' ? CLS.filter((c) => c.id === single)
    : scope === 'kademe' ? CLS.filter((c) => c.kademe === kademe) : CLS;
  const bulk = scope !== 'single' && targetClasses.length > 1;

  /* üretiliyor animasyonu */
  const GEN_MSGS = ['Görevlendirmeler okunuyor…', 'Öğretmen müsaitlikleri kontrol ediliyor…', 'Kısıtlar çözülüyor…', 'Çakışmalar gideriliyor…', 'Taslaklar puanlanıyor…'];
  useEffectAg(() => {
    if (stage !== 'generating') return;
    setGenMsg(0);
    const iv = setInterval(() => setGenMsg((m) => Math.min(m + 1, GEN_MSGS.length - 1)), 320);
    const tm = setTimeout(() => { clearInterval(iv); setStage(strict ? 'nosolution' : 'results'); }, 1650);
    return () => { clearInterval(iv); clearTimeout(tm); };
  }, [stage, strict]);

  function generate() { setStage('generating'); }
  function useDraft(draft) { onUseDraft && onUseDraft(targetClasses[0] ? targetClasses[0].id : '9A', draft.id); }

  /* toplu sonuç satırları (sınıf bazlı özet) */
  const bulkRows = targetClasses.map((c, i) => {
    const seed = (c.id.charCodeAt(1) + i) % 7;
    const conf = seed === 3 ? 1 : 0;
    const miss = seed % 4 === 1 ? 2 : 0;
    return { ...c, conf, miss, pref: 74 + (seed * 3) % 20, seed };
  });

  return (
    <React.Fragment>
      <div className="drawer-scrim" onClick={onClose}></div>
      <aside className="ag-drawer" role="dialog" aria-modal="true">
        <div className="ag-head">
          <div className="ht">
            <span className="ic"><Icon name="sparkles" size={20} /></span>
            <div>
              <h3>Otomatik Program Oluştur</h3>
              <div className="hs">Görevlendirmelerden çakışmasız taslaklar üret.</div>
            </div>
          </div>
          <button className="ag-x" onClick={onClose}><Icon name="x" size={18} /></button>
          <div className="ag-steps">
            <div className={'ag-step' + (stage === 'settings' ? ' on' : ' done')}><span className="n">{stage === 'settings' ? '1' : <Icon name="check" size={12} strokeWidth={3} />}</span> Ayarlar</div>
            <span className={'ag-step-sep' + (stage !== 'settings' ? ' on' : '')}></span>
            <div className={'ag-step' + (stage !== 'settings' ? ' on' : '')}><span className="n">2</span> Önizleme</div>
          </div>
        </div>

        <div className="ag-body">
          {/* ───── AŞAMA 1 ───── */}
          {stage === 'settings' && (
            <React.Fragment>
              <div className="ag-sec">
                <div className="ag-sec-h">Kapsam</div>
                <div className="ag-scope">
                  <button className={'ag-scope-opt' + (scope === 'single' ? ' on' : '')} onClick={() => setScope('single')}>
                    <span className="st"><Icon name="square" size={15} className="ico" /> Tek sınıf</span>
                    <span className="ss">Seçilen şube için üret</span>
                  </button>
                  <button className={'ag-scope-opt' + (scope === 'kademe' ? ' on' : '')} onClick={() => setScope('kademe')}>
                    <span className="st"><Icon name="layers" size={15} className="ico" /> Kademe</span>
                    <span className="ss">Bir seviyenin tüm şubeleri</span>
                  </button>
                  <button className={'ag-scope-opt' + (scope === 'all' ? ' on' : '')} onClick={() => setScope('all')}>
                    <span className="st"><Icon name="grid" size={15} className="ico" /> Tümü</span>
                    <span className="ss">Okuldaki bütün sınıflar</span>
                  </button>
                </div>
                <div className="ag-scope-pick">
                  {scope === 'single' && (<React.Fragment><label>Şube</label><select value={single} onChange={(e) => setSingle(e.target.value)}>{CLS.map((c) => <option key={c.id} value={c.id}>{c.ad}</option>)}</select></React.Fragment>)}
                  {scope === 'kademe' && (<React.Fragment><label>Kademe</label><select value={kademe} onChange={(e) => setKademe(Number(e.target.value))}>{[9, 10, 11, 12].map((k) => <option key={k} value={k}>{k}. Sınıf</option>)}</select></React.Fragment>)}
                  <span className="ag-scope-feed"><Icon name="info" size={14} /> {targetClasses.length} sınıf · müfredat saatleri ve görevlendirmelerden beslenir</span>
                </div>
              </div>

              <div className="ag-sec">
                <div className="ag-sec-h">Kısıtlar</div>
                <div className="ag-constraint">
                  <span className="ci"><Icon name="shield-check" size={18} /></span>
                  <div className="cx">
                    <div className="t">Otomatik üretim şunları dikkate alır</div>
                    <div className="s">Öğretmen müsaitlikleri, derslik uygunluğu ve haftalık ders saatleri. Öğretmenlerin <b>"müsait değil"</b> işaretleri kesin engel olarak uygulanır — bu slotlara ders yerleştirilmez.</div>
                  </div>
                </div>
              </div>

              <div className="ag-sec">
                <div className="ag-sec-h">Optimizasyon tercihleri</div>
                <div className="ag-weights">
                  <div className="ag-weight">
                    <span className="wi"><Icon name="sunrise" size={17} /></span>
                    <div className="wt"><div className="t">Zor dersleri sabaha topla</div><div className="s">Mat, Fizik gibi dersler ilk saatlere</div></div>
                    <div className="ag-wseg">{['düşük', 'orta', 'yüksek'].map((v) => <button key={v} className={w.sabah === v ? 'on' : ''} onClick={() => setWeight('sabah', v)}>{v}</button>)}</div>
                  </div>
                  <div className="ag-weight">
                    <span className="wi"><Icon name="square-dashed" size={17} /></span>
                    <div className="wt"><div className="t">Öğretmen boş saatini azalt</div><div className="s">Programda pencere (boşluk) en aza insin</div></div>
                    <div className="ag-wseg">{['düşük', 'orta', 'yüksek'].map((v) => <button key={v} className={w.pencere === v ? 'on' : ''} onClick={() => setWeight('pencere', v)}>{v}</button>)}</div>
                  </div>
                  <div className="ag-weight">
                    <span className="wi"><Icon name="bar-chart" size={17} /></span>
                    <div className="wt"><div className="t">Günlük yükü dengele</div><div className="s">Dersler günlere eşit dağılsın</div></div>
                    <div className="ag-wseg">{['düşük', 'orta', 'yüksek'].map((v) => <button key={v} className={w.denge === v ? 'on' : ''} onClick={() => setWeight('denge', v)}>{v}</button>)}</div>
                  </div>
                  <div className="ag-weight">
                    <span className="wi"><Icon name="layers" size={17} /></span>
                    <div className="wt"><div className="t">Blok dersleri koru</div><div className="s">Ardışık 2 saatlik bloklar bölünmesin</div></div>
                    <button className={'ag-wtoggle' + (w.blok ? ' on' : '')} onClick={() => setWeight('blok', !w.blok)}><i></i></button>
                  </div>
                </div>
                <div className="ag-strict">
                  <span className="wi" style={{ background: 'transparent', color: 'var(--warning)' }}><Icon name="lock" size={17} /></span>
                  <div className="wt"><div className="t">Katı kısıt modu</div><div className="s">Hiçbir tercihten ödün verme — çözüm bulunamayabilir</div></div>
                  <button className={'ag-wtoggle' + (strict ? ' on' : '')} onClick={() => setStrict((s) => !s)} style={strict ? { background: 'var(--warning)' } : null}><i></i></button>
                </div>
              </div>
            </React.Fragment>
          )}

          {/* ───── AŞAMA 2: üretiliyor ───── */}
          {stage === 'generating' && (
            <div className="ag-gen">
              <div className="ag-gen-top">
                <div className="ag-gen-spin"></div>
                <div className="gt">Taslaklar üretiliyor…</div>
                <div className="gs">{GEN_MSGS[genMsg]}</div>
                <div className="ag-gen-bar"><i></i></div>
              </div>
              <div className="ag-gen-cards">
                {[0, 1, 2].map((i) => (
                  <div className="ag-sk-card" key={i}>
                    <div className="ag-sk" style={{ height: 18, width: '55%' }}></div>
                    <div className="ag-sk" style={{ height: 90 }}></div>
                    <div className="ag-sk" style={{ height: 32 }}></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ───── AŞAMA 2: sonuç ───── */}
          {stage === 'results' && (
            <React.Fragment>
              <div className="ag-result-top">
                <div>
                  <div className="rt">{bulk ? targetClasses.length + ' sınıf için taslak üretildi' : (targetClasses[0] ? targetClasses[0].ad : '') + ' için 3 taslak seçeneği'}</div>
                  <div className="rs">{bulk ? 'Her sınıf için en iyi skorlu taslak seçildi' : 'En iyi skorlu taslak "Önerilen" olarak işaretlendi'}</div>
                </div>
                <div className="grow"></div>
                <button className="btn btn-ghost" onClick={() => setStage('settings')}><Icon name="chevron-left" size={16} /> Ayarlara dön</button>
                <button className="btn btn-ghost" onClick={() => setStage('generating')}><Icon name="rotate-ccw" size={15} /> Yeniden üret</button>
              </div>

              {bulk ? (
                <div className="ag-bulk">
                  {bulkRows.map((c) => (
                    <div className="ag-bulk-row" key={c.id}>
                      <span className="tag">{c.ad}</span>
                      <div className="bm"><div className="t">{c.ad} · Taslak hazır</div><div className="s">Tercih uyumu %{c.pref} · ort. {1 + c.seed % 3} boş saat</div></div>
                      <div className="ag-bulk-mini">
                        <span className={'ag-bulk-stat ' + (c.conf > 0 ? 'bad' : 'good')}><Icon name={c.conf > 0 ? 'alert-triangle' : 'check'} size={12} />{c.conf} çakışma</span>
                        {c.miss > 0 && <span className="ag-bulk-stat warn"><Icon name="clock" size={12} />{c.miss} eksik</span>}
                        <button className="btn btn-primary" style={{ height: 34, padding: '0 12px', fontSize: 12.5 }} onClick={() => onUseDraft && onUseDraft(c.id, 'A')}><Icon name="pencil-ruler" size={14} /> Aç</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ag-cards">
                  {AG_DRAFTS.map((d) => <AgCard key={d.id} draft={d} onOpen={useDraft} onPreview={setPreview} />)}
                </div>
              )}

              <div className="ag-handnote">
                <Icon name="info" size={16} />
                <div className="t">Otomatik üretim insanı devre dışı bırakmaz. Bir taslağı <b>"Editörde Aç"</b> ile seçtiğinizde program editöre <b>taslak</b> olarak yüklenir — elle ince ayar yapabilirsiniz. Taslak seçmek onu <b>yayınlamaz</b>.</div>
              </div>
            </React.Fragment>
          )}

          {/* ───── çözüm bulunamadı ───── */}
          {stage === 'nosolution' && (
            <div className="ag-nosol">
              <div className="ic"><Icon name="alert-triangle" size={30} /></div>
              <h4>Tüm kısıtlar aynı anda sağlanamadı</h4>
              <p>Katı kısıt modunda çakışmasız bir program bulunamadı. Aşağıdaki kısıtlardan birini gevşeterek tekrar deneyin.</p>
              <div className="ag-nosol-list">
                <div className="ag-nosol-row"><span className="ni"><Icon name="square-dashed" size={15} /></span><div className="nt"><div className="t">"Öğretmen boş saatini azalt" → orta'ya çek</div><div className="s">Yüksek ağırlık 3 sınıfta çözümü engelliyor</div></div></div>
                <div className="ag-nosol-row"><span className="ni"><Icon name="layers" size={15} /></span><div className="nt"><div className="t">"Blok dersleri koru" → kapat</div><div className="s">2 derslikte blok yerleşimi mümkün değil</div></div></div>
                <div className="ag-nosol-row"><span className="ni"><Icon name="lock" size={15} /></span><div className="nt"><div className="t">Katı kısıt modunu kapat</div><div className="s">Yumuşak kısıtlarla en iyi yaklaşım üretilir</div></div></div>
              </div>
            </div>
          )}
        </div>

        {/* alt aksiyon çubuğu */}
        <div className="ag-foot">
          {stage === 'settings' && (
            <React.Fragment>
              <button className="btn btn-ghost" onClick={onClose}>İptal</button>
              <div className="grow"></div>
              <button className="btn btn-primary" onClick={generate}><Icon name="sparkles" size={17} /> Taslak Üret</button>
            </React.Fragment>
          )}
          {stage === 'generating' && (<React.Fragment><div className="grow"></div><button className="btn btn-ghost" onClick={() => setStage('settings')}>İptal</button></React.Fragment>)}
          {stage === 'results' && (<React.Fragment><button className="btn btn-ghost" onClick={onClose}>Kapat</button><div className="grow"></div><span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Bir taslak seçince editöre yüklenir</span></React.Fragment>)}
          {stage === 'nosolution' && (<React.Fragment><button className="btn btn-ghost" onClick={onClose}>İptal</button><div className="grow"></div><button className="btn btn-primary" onClick={() => { setStrict(false); setStage('settings'); }}><Icon name="sliders" size={16} /> Ayarları Gevşet</button></React.Fragment>)}
        </div>
      </aside>

      {preview && <AgPreview draft={preview} onClose={() => setPreview(null)} />}
    </React.Fragment>
  );
}

Object.assign(window, { AutoGenFlow });
