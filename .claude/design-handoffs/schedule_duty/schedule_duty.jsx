/* OKSİS — Ders Programı · ÖĞRETMEN · "Nöbet & Vekâlet"
   Ağırlıkla salt-okunur. NÖBET = planlı/tekrarlayan görev (yer+gün+saat),
   VEKÂLET = yedek ders (kimin yerine + sınıf + ders + saat + derslik).
   Vekâlette yalnız onay/itiraz; nöbet yalnız görüntüleme. */
const { useState: useStateDy } = React;

/* görevler — zaman sıralı (bugün = Salı 25 Kasım) */
const DUTY_LIST = [
  { id: 'd1', type: 'vekalet', day: 'Salı', today: true, hr: '09:30', per: '2. ders', title: '9-A · Matematik', room: 'B-201', yerine: 'Ayşe Demir', conflict: '09:30 · 8-B Matematik dersinle çakışıyor' },
  { id: 'd2', type: 'vekalet', day: 'Salı', today: true, hr: '11:10', per: '4. ders', title: '10-B · Matematik', room: 'B-204', yerine: 'Burak Tekin', next: true },
  { id: 'd3', type: 'nobet', day: 'Çarşamba', hr: '12:40', per: 'Öğle arası', title: 'Kat-2 nöbeti', room: 'B blok · 2. kat koridoru' },
  { id: 'd4', type: 'nobet', day: 'Cuma', hr: '13:30', per: '1. teneffüs', title: 'Bahçe nöbeti', room: 'Zemin kat · bahçe' },
];
/* bu hafta tamamlanan/geçmiş (özet sayımı için) */
const DUTY_PAST = [{ type: 'nobet', day: 'Pzt', title: 'Bahçe nöbeti' }];

const DUTY_DAYS = [['Pzt', 'Pazartesi'], ['Sal', 'Salı'], ['Çar', 'Çarşamba'], ['Per', 'Perşembe'], ['Cum', 'Cuma']];
const DUTY_PER = [{ p: 1, a: '08:40' }, { p: 2, a: '09:30' }, { p: 3, a: '10:20' }, { p: 4, a: '11:10' }, { p: 5, a: '12:40' }, { p: 6, a: '13:30' }, { p: 7, a: '14:20' }];
/* haftalık takvim katmanı: dersler (soluk) + nöbet/vekâlet (vurgulu) */
const DUTY_WEEK = {
  '0-1': { k: 'lesson', m: '8-A', s: 'Matematik' }, '0-6': { k: 'nobet', m: 'Bahçe', s: 'nöbet' },
  '1-1': { k: 'lesson', m: '8-A', s: 'Matematik' }, '1-2': { k: 'conflict', m: '9-A vekâlet', s: '8-B ile çakışma' }, '1-4': { k: 'vekalet', m: '10-B', s: 'B. Tekin yerine' }, '1-5': { k: 'lesson', m: '7-B', s: 'Matematik' },
  '2-1': { k: 'lesson', m: '8-A', s: 'Matematik' }, '2-5': { k: 'nobet', m: 'Kat-2', s: 'nöbet' },
  '3-1': { k: 'lesson', m: '7-B', s: 'Matematik' }, '3-3': { k: 'lesson', m: '8-B', s: 'Matematik' },
  '4-1': { k: 'lesson', m: '8-B', s: 'Matematik' }, '4-6': { k: 'nobet', m: 'Bahçe', s: 'nöbet' },
};

function DutyObjectModal({ duty, onClose, onDone }) {
  const [reason, setReason] = useStateDy('cakisma');
  const [done, setDone] = useStateDy(false);
  if (done) {
    return (
      <div className="tdy-modal-scrim" onClick={onClose}>
        <div className="tdy-modal" onClick={(e) => e.stopPropagation()}>
          <div className="done-body">
            <div className="ci"><Icon name="check" size={26} strokeWidth={2.4} /></div>
            <h3>İtirazın iletildi</h3>
            <p>{duty.day} {duty.hr} · {duty.title} vekâleti için itirazın idareye gönderildi. İzin & Değişiklik Talebi olarak takip edebilirsin; idare yeni bir vekil atayacak.</p>
          </div>
          <div className="tdy-modal-foot"><button className="btn btn-primary" onClick={onClose} style={{ flex: 'none', marginLeft: 'auto' }}>Tamam</button></div>
        </div>
      </div>
    );
  }
  const reasons = [['cakisma', 'Mevcut dersimle çakışıyor'], ['izin', 'O gün izinliyim / okulda olmayacağım'], ['mazeret', 'Kişisel mazeret'], ['diger', 'Diğer']];
  return (
    <div className="tdy-modal-scrim" onClick={onClose}>
      <div className="tdy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tdy-modal-head">
          <span className="mi"><Icon name="alert-triangle" size={19} /></span>
          <div><h3>Vekâlete itiraz et</h3><div className="s">{duty.day} {duty.hr} · {duty.title} · {duty.yerine} yerine</div></div>
        </div>
        <div className="tdy-modal-body">
          <div className="fld-l" style={{ marginBottom: 9 }}>İtiraz nedeni</div>
          <div className="tdy-reason">
            {reasons.map(([k, l]) => (
              <button key={k} className={'tdy-reason-opt' + (reason === k ? ' on' : '')} onClick={() => setReason(k)}>
                <span className="rd"></span>{l}
              </button>
            ))}
          </div>
          <div className="fld">
            <div className="fld-l">Açıklama <span className="opt">· opsiyonel</span></div>
            <textarea className="inp" placeholder="Kısa açıklama — idare yeni vekil ararken yardımcı olur…"></textarea>
          </div>
          <div className="aca-note" style={{ marginTop: 4, marginBottom: 0 }}><Icon name="info" size={14} /><span>İtirazın <b>İzin & Değişiklik Talebi</b> akışına düşer; onaylanınca vekâlet kaldırılır.</span></div>
        </div>
        <div className="tdy-modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
          <button className="btn btn-danger" onClick={() => setDone(true)}><Icon name="send" size={16} /> İtirazı Gönder</button>
        </div>
      </div>
    </div>
  );
}

function TeacherDuty({ sv, onDetail }) {
  const [sub, setSub] = useStateDy('liste');     /* liste · takvim */
  const [acts, setActs] = useStateDy({});         /* id -> 'approved' | 'objected' */
  const [obj, setObj] = useStateDy(null);

  const list = sv === 'yok' ? [] : DUTY_LIST;
  const nobetCount = list.filter((d) => d.type === 'nobet').length + DUTY_PAST.length;
  const vekCount = list.filter((d) => d.type === 'vekalet').length;
  const next = list.find((d) => d.next) || list[0];
  const hasConflict = list.some((d) => d.conflict && acts[d.id] !== 'objected');

  if (sv === 'yükleniyor') {
    return (
      <React.Fragment>
        <div className="tdy-sk" style={{ height: 78, marginBottom: 20 }}></div>
        <div className="tdy-sk" style={{ height: 18, width: 180, marginBottom: 12, borderRadius: 8 }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map((i) => <div key={i} className="tdy-sk" style={{ height: 82 }}></div>)}
        </div>
      </React.Fragment>
    );
  }

  if (sv === 'yok') {
    return (
      <React.Fragment>
        <div style={{ marginBottom: 16 }}><div className="tdy-subseg"><button className="on"><Icon name="list" size={15} /> Liste</button><button onClick={() => setSub('takvim')}><Icon name="calendar-days" size={15} /> Takvim</button></div></div>
        <div className="tdy-empty"><div className="ic"><Icon name="check-circle" size={30} /></div><h3>Bu hafta nöbet veya vekâletin yok</h3><p>Şu an sana atanmış bir görev bulunmuyor. Yeni bir nöbet ya da vekâlet atandığında burada görünür ve sana bildirim gönderilir.</p></div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {/* bildirim / uyarı şeritleri */}
      {sv === 'yeni' && (
        <div className="tdy-newvek">
          <span className="ni"><Icon name="bell" size={18} /></span>
          <div className="nx"><div className="t">Sana yeni bir vekâlet atandı</div><div className="s">Bugün 11:10 · 10-B Matematik · Burak Tekin yerine — onayını bekliyor</div></div>
          <span className="pulse"></span>
        </div>
      )}
      {hasConflict && (
        <div className="tdy-conflict-strip">
          <span className="ci"><Icon name="alert-triangle" size={18} /></span>
          <div className="cx"><div className="t">Çakışan vekâlet var</div><div className="s">Bugün 09:30 · 9-A vekâleti, aynı saatteki 8-B Matematik dersinle çakışıyor — itiraz edebilirsin.</div></div>
        </div>
      )}

      {/* özet şeridi */}
      <div className="tdy-summary">
        <div className="tdy-stat nobet"><span className="si"><Icon name="shield" size={18} /></span><div><div className="sv">{nobetCount}</div><div className="sl">bu hafta nöbet</div></div></div>
        <div className="tdy-stat vekalet"><span className="si"><Icon name="user-check" size={18} /></span><div><div className="sv">{vekCount}</div><div className="sl">bu hafta vekâlet</div></div></div>
        {next && (
          <div className="tdy-next">
            <span className="ni"><Icon name={next.type === 'nobet' ? 'shield' : 'user-check'} size={20} /></span>
            <div className="nx"><div className="l">Sıradaki görev</div><div className="t">{next.today ? 'Bugün' : next.day} {next.hr} · {next.title}</div><div className="s">{next.type === 'vekalet' ? next.yerine + ' yerine' : next.room}</div></div>
            <div className="when"><div className="at">{next.hr}</div><div className="in">{next.type === 'vekalet' ? 'vekâlet' : 'nöbet'}</div></div>
          </div>
        )}
      </div>

      {/* alt-segment */}
      <div className="tdy-list-h">
        <span className="t">{sub === 'liste' ? 'Yaklaşan görevler' : 'Haftalık takvim'}</span>
        <div className="grow"></div>
        <div className="tdy-subseg">
          <button className={sub === 'liste' ? 'on' : ''} onClick={() => setSub('liste')}><Icon name="list" size={15} /> Liste</button>
          <button className={sub === 'takvim' ? 'on' : ''} onClick={() => setSub('takvim')}><Icon name="calendar-days" size={15} /> Takvim</button>
        </div>
      </div>

      {sub === 'takvim' ? (
        <DutyWeek />
      ) : (
        <div className="tdy-list">
          {list.map((d) => {
            const state = acts[d.id];
            const isConflict = d.conflict && state !== 'objected';
            return (
              <div key={d.id} className={'tdy-item ' + d.type + (isConflict ? ' conflict' : '') + (d.today ? ' is-today' : '')} onClick={() => onDetail && onDetail({ ders: d.type === 'vekalet' ? d.title.split(' · ')[1] : d.title, sinif: d.type === 'vekalet' ? d.title.split(' · ')[0] : d.room, room: d.room, a: d.hr, b: '', p: d.per, state: d.type === 'nobet' ? 'nobet' : 'up', roomChg: null })}>
                <span className="acc"></span>
                <div className="tdy-when">
                  <div className={'day' + (d.today ? ' today' : '')}>{d.today ? 'Bugün' : d.day}</div>
                  <div className="hr">{d.hr}</div>
                  <div className="sub">{d.per}</div>
                </div>
                <span className={'tdy-type ' + d.type}><Icon name={d.type === 'nobet' ? 'shield' : 'user-check'} size={13} /> {d.type === 'nobet' ? 'Nöbet' : 'Vekâlet'}</span>
                <div className="tdy-body">
                  <div className="t">{d.title}</div>
                  <div className="s">
                    <span className="it"><Icon name="map-pin" size={13} /> {d.room}</span>
                    {d.type === 'vekalet' && <span className="yerine"><Icon name="user-check" size={11} /> {d.yerine} yerine</span>}
                  </div>
                  {isConflict && <div className="conflict-note"><Icon name="alert-triangle" size={13} /> {d.conflict}</div>}
                </div>
                <div className="tdy-acts" onClick={(e) => e.stopPropagation()}>
                  {d.type === 'nobet' ? (
                    <span className="tdy-view-only"><Icon name="eye" size={13} /> Görüntüleme</span>
                  ) : state === 'approved' ? (
                    <span className="tdy-approved"><Icon name="check" size={13} strokeWidth={3} /> Onaylandı</span>
                  ) : state === 'objected' ? (
                    <span className="tdy-objected"><Icon name="clock" size={13} /> İtiraz iletildi</span>
                  ) : (
                    <React.Fragment>
                      <button className={'tdy-btn object' + (isConflict ? ' lead' : '')} onClick={() => setObj(d)}><Icon name="x" size={14} /> İtiraz et</button>
                      <button className="tdy-btn approve" onClick={() => setActs((a) => ({ ...a, [d.id]: 'approved' }))}><Icon name="check" size={14} strokeWidth={2.6} /> Onayla</button>
                    </React.Fragment>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {obj && <DutyObjectModal duty={obj} onClose={() => setObj(null)} onDone={() => {}} />}
    </React.Fragment>
  );
}

/* haftalık takvim — ders programı + nöbet/vekâlet katmanı (çakışma görünür) */
function DutyWeek() {
  const C = { Matematik: '#2F4DA0' };
  return (
    <React.Fragment>
      <div className="tdy-week-legend">
        <span className="lg"><span className="sw" style={{ background: '#2F4DA0', opacity: .55 }}></span> Dersin</span>
        <span className="lg"><span className="sw" style={{ background: 'var(--accent-bright)' }}></span> Nöbet</span>
        <span className="lg"><span className="sw" style={{ background: 'var(--warning)' }}></span> Vekâlet</span>
        <span className="lg"><span className="sw" style={{ background: 'var(--danger)' }}></span> Çakışma</span>
      </div>
      <div className="tdy-week">
        <div className="tdy-wgrid">
          <div></div>
          {DUTY_DAYS.map((d) => <div key={d[0]} className={'tdy-wh' + (d[0] === 'Sal' ? ' today' : '')}><div className="d">{d[0]}</div><div className="n">{d[1]}</div></div>)}
          {DUTY_PER.map((per) => (
            <React.Fragment key={per.p}>
              <div className="tdy-wt"><span className="p">{per.p}</span><span className="h">{per.a}</span></div>
              {DUTY_DAYS.map((d, di) => {
                const cell = DUTY_WEEK[di + '-' + per.p];
                if (!cell) return <div className="tdy-wc empty" key={di}></div>;
                if (cell.k === 'lesson') return <div className="tdy-wc lesson" key={di} style={{ '--c': C[cell.s] || 'var(--accent)' }}><div className="cn">{cell.m}</div><div className="cm">{cell.s}</div></div>;
                return (
                  <div className={'tdy-wc ' + cell.k} key={di}>
                    <span className="wtag"><Icon name={cell.k === 'nobet' ? 'shield' : cell.k === 'conflict' ? 'alert-triangle' : 'user-check'} size={9} /> {cell.k === 'nobet' ? 'Nöbet' : cell.k === 'conflict' ? 'Çakışma' : 'Vekâlet'}</span>
                    <div className="wmain">{cell.m}</div>
                    <div className="wsub">{cell.s}</div>
                  </div>
                );
              })}
              {(per.p === 2 || per.p === 4) && <div className="tdy-wbreak"><span className="ln"></span><span className="lbl"><Icon name={per.p === 4 ? 'utensils' : 'coffee'} size={9} /> {per.p === 4 ? 'Öğle' : 'Teneffüs'}</span><span className="ln"></span></div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { TeacherDuty });
