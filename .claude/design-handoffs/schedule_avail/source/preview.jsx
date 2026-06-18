/* OKSİS — Öğretmen Müsaitliği (schedule_avail) · Handoff önizleme köprüsü
   Yalnızca referans/önizleme. Tam app shell'i (Sidebar/Topbar) yüklemeden
   dört parçayı doğrudan render eder:
     1) Ana ekran — AvailabilityScreen (admin 3-durumlu müsaitlik ızgarası)
     2) Editör entegrasyonu — ScheduleEditorScreen (override diyaloğu, sarı tercih, ihlal paneli)
     3) Otomatik Oluştur — AutoGenFlow (yeni "Öğretmen tercihlerine uy" ağırlığı)
     4) Hub rozeti — ScheduleScreen ("Müsaitlik ihlali: N" sayacı)
   Production'da bu köprü kullanılmaz — ekranlar hedef kod tabanının routing'ine bağlanır. */
const { useState: usePv } = React;

const PV_ROLE = { key: 'admin', label: 'Yönetim' };
const PV_SAV_STATES = [
  ['normal', 'Normal'], ['loading', 'Yükleniyor'], ['empty', 'Boş (zil yok)'], ['error', 'Hata'], ['noteacher', 'Öğretmen seçilmemiş'],
];

function PreviewRoot() {
  const [page, setPage] = usePv('avail');     /* avail · editor · autogen · hub */
  const [savState, setSavState] = usePv('normal');
  const onNavigate = (p) => {
    if (p === 'scheduleEditor') { window.__schTarget = '9A'; window.__schNew = false; window.__schDraft = null; setPage('editor'); }
    else if (p === 'schedule') setPage('hub');
    else if (p === 'availability') setPage('avail');
    else setPage(p);
  };

  return (
    <div className="pv-shell">
      <div className="pv-bar">
        <span className="pv-brand"><b>OKSİS</b> · Öğretmen Müsaitliği — Handoff</span>
        <div className="pv-seg">
          <button className={page === 'avail' ? 'on' : ''} onClick={() => setPage('avail')}>1 · Müsaitlik Ekranı</button>
          <button className={page === 'editor' ? 'on' : ''}
            onClick={() => { window.__schTarget = '9A'; window.__schNew = false; window.__schDraft = null; setPage('editor'); }}>2 · Editör Entegrasyonu</button>
          <button className={page === 'autogen' ? 'on' : ''} onClick={() => setPage('autogen')}>3 · Otomatik Oluştur</button>
          <button className={page === 'hub' ? 'on' : ''} onClick={() => setPage('hub')}>4 · Hub Rozeti</button>
        </div>
        {page === 'avail' && (
          <div className="pv-sub">
            <span className="lbl">Durum:</span>
            {PV_SAV_STATES.map(([k, l]) => (
              <button key={k} className={savState === k ? 'on' : ''} onClick={() => setSavState(k)}>{l}</button>
            ))}
          </div>
        )}
        <span className="pv-note">Önizleme köprüsü · gerçek shell değildir</span>
      </div>

      <div className="pv-stage">
        {page === 'avail' && <AvailabilityScreen role={PV_ROLE} t={{ savState }} onNavigate={onNavigate} />}
        {page === 'editor' && <ScheduleEditorScreen role={PV_ROLE} t={{}} onNavigate={onNavigate} />}
        {page === 'hub' && <ScheduleScreen role={PV_ROLE} t={{}} onNavigate={onNavigate} />}
        {page === 'autogen' && (
          <React.Fragment>
            <ScheduleScreen role={PV_ROLE} t={{}} onNavigate={onNavigate} />
            <AutoGenFlow defaultClass="9A"
              classes={[{ id: '9A', ad: '9-A', kademe: 9 }, { id: '9B', ad: '9-B', kademe: 9 }, { id: '10A', ad: '10-A', kademe: 10 }]}
              onClose={() => setPage('hub')} onUseDraft={() => setPage('hub')} />
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PreviewRoot />);
