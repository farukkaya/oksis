# Ders Programı — Faz 3: Otomatik Program Üretimi (Tasarım)

> **Durum:** Tasarım onaylandı (2026-06-15, kullanıcı). Bağlayıcı spec:
> `.claude/specs/ders-programi-modulu-spec.md` §34 (Faz 3 = `IScheduleSolver` + Hangfire otomatik üretim
> + toplu yeniden atama + Redis önbellek). Kaynak: `Oksis_DersProgrami_Teknik_Analiz.docx` §7,
> `Oksis_Ders_Programi_Ihtiyac_Analizi.docx` §9.

---

## 1. Amaç ve Kapsam

Faz 3'ün başlıca değeri: idarecinin bir sınıfın programını sıfırdan elle dizmek yerine, **çakışmasız güçlü
bir başlangıç taslağı** otomatik üretmesi ("saatlerden dakikalara"). Bu dilim yalnız **otomatik üretim**i
kapsar.

### Kapsam içi
- `IScheduleSolver` portu + **özel sezgisel** impl (saf C#: graph-coloring + forward-checking + backtracking
  + hafif yerel-arama skorlama).
- `IAvailabilityProvider` portu (**no-op** impl; Faz 4 doldurur).
- Hangfire `AutoGenerateScheduleJob` + `EnqueueAutoGenerateCommand`/`GetAutoGenerateStatusQuery`.
- `schedule_generation_jobs` durum tablosu (poll edilir).
- Web: Draft programda "Otomatik Oluştur" → onay → ilerleme (poll) → sonuç → "Editörde Aç". i18n.

### Kapsam dışı (Faz 3'ün diğer dilimleri / Debt — ayrı döngüler)
- **Toplu yeniden atama** (`BulkReassignTeacher`) → ayrı Faz 3 dilimi.
- **Redis okuma önbelleği** → ayrı Faz 3 dilimi.
- **Müsaitlik/tercih** (Faz 4) → solver no-op port arkasında çalışır → **Debt-AG-1**.
- **Branşa-özel oda-türü** (lab/salon) — subject→room-type verisi kodda yok → ev-dersliği atanır → **Debt-AG-2**.
- **Çoklu aday taslak** (1-3 + skor + seçim UI) → MVP tek taslak → **Debt-AG-3**.
- **SignalR job-push** (Teknik Analiz §7) → MVP poll → **Debt-AG-4**.
- **Tüm-okul toplu üretim** → MVP tek sınıf → **Debt-AG-5**.
- **Esnek-kural optimizasyon derinliği** → MVP temel skorlama (greedy + tie-break + hafif yerel arama) → **Debt-AG-6**.

---

## 2. Uçtan uca akış

```
İdareci Draft programda "Otomatik Oluştur"
 → EnqueueAutoGenerateCommand(programId): schedule_generation_jobs satırı (queued) + Hangfire enqueue → jobId
 → AutoGenerateScheduleJob: tenant set → girdileri topla → IScheduleSolver.Solve → hedef programa Draft yerleşim uygula
 → job satırı: done + özet (yerleşen X/Y, skor, yerleşemeyenler) | failed + sebep
Web: jobId'yi GetAutoGenerateStatusQuery ile poll → done'da sonuç → "Editörde Aç" (mevcut editör)
```

- **Hedef:** tek sınıfın `ScheduleProgram`'ı. **Published'a autogen çalışmaz** (yalnız Draft/Revising).
- **Davranış (onaylı):** autogen programı **sıfırdan doldurur** — mevcut aktif (draft) yerleşimleri temizler
  (occupancy serbest bırakılır) → solver sonucunu uygular. İdareci editörde ince ayar + yayın yapar.

---

## 3. Solver mimarisi (saf, test edilebilir)

### 3.1 Portlar (Application)
- **`IScheduleSolver`**: `SolveResult Solve(SolveInput input)` — **saf**, DB yok. İmpl saf C#.
- **`IAvailabilityProvider`**: `IReadOnlySet<TimeSlot> BlockedSlots(Guid teacherId)` — **no-op** şimdi (boş set).

### 3.2 SolveInput (handler DB'den toplar, port'a geçirir)
- `LessonDemand[]` — yerleştirilecek dersler: her biri `{ SubjectId, TeacherId, RequiredRoomType?, IsBlockMember, BlockGroupKey? }`. Sayı = müfredat haftalık saati (Görevlendirme `IRequiredHoursResolver`).
- `TimeSlot[]` AvailableSlots — zil-grid (Lesson period'ları; Break/Lunch hariç).
- `OccupiedSlot[]` ExternalOccupancy — bu program HARİÇ dönemdeki tüm aktif yerleşimler (öğretmen+derslik dolulukları). (Mevcut `IOccupancyIndex` / external-occupancy P29 deseninden.)
- `HomeRoomId` — sınıfın ev-dersliği.
- `BellCapacity` — her gün period sayısı (sınıf tekilliği için).

### 3.3 SolveResult
- `PlannedPlacement[] Placements` — `{ Day, Period, SubjectId, TeacherId, RoomId, IsBlock, BlockGroupKey? }`.
- `LessonDemand[] Unplaced` — yerleştirilemeyenler (kısıt nedeniyle).
- `int Score` — esnek-kural memnuniyeti (yüksek=iyi).
- `bool IsComplete => Unplaced boş`.

### 3.4 Sezgisel algoritma (saf birimler — plan TDD ile böler)
1. **`BuildLessonDemands`** — müfredat saatlerinden + görevlendirmeden talep listesi (blok grupları işaretli).
2. **`SlotFeasibility`** — bir (talep, slot) için: sınıf-slot boş mu · öğretmen boş mu (external occupancy + draft-içi) · derslik boş mu · oda-türü uygun mu (MVP: ev-dersliği) · müsaitlik (no-op) · blok ardışıklığı.
3. **`OrderByMostConstrained`** — en-kısıtlı-önce (az feasible slotu olan, blok, yüksek-yüklü öğretmen).
4. **`BacktrackingSolver`** — forward-checking + geri-izleme; tıkanınca geri al. Determinist (test için seed yok; sıralama deterministik).
5. **`SoftScore`** — zor dersler sabaha · aynı ders günlere dağılmış · öğretmen pencere (gap) azaltma · blok korundu. MVP: greedy yerleştirmede tie-break + tek yerel-arama iyileştirme turu.

> Karmaşıklık sınırı: backtracking'e **deterministik düğüm/süre bütçesi** (ör. max N adım) — bütçe aşılırsa
> o ana dek en iyi kısmi çözümü "Unplaced ile" döndür (sıkı-kısıtlı okulda asılı kalmaz). Bu MVP-kabul.

---

## 4. Backend dilimleri

### 4.1 Persistence — `schedule_generation_jobs` (yeni, `[academic]` şema)
`{ Id, SchoolId, ProgramId, Status (Queued/Running/Done/Failed), PlacedCount, TotalCount, Score, UnplacedSummary (string?), FailureReason (string?), CreatedAt, CompletedAt }`. TenantEntity. Migration.

### 4.2 CQRS
- **`EnqueueAutoGenerateCommand(ProgramId)`** → doğrula (program var + Draft/Revising + sahiplik) → job satırı (Queued) → `IBackgroundJobClient.Enqueue<AutoGenerateScheduleJob>` → **jobId döner**.
- **`GetAutoGenerateStatusQuery(JobId)`** → job satırı (self/sahiplik scope) → status + özet DTO.

### 4.3 Hangfire `AutoGenerateScheduleJob.RunAsync(jobId, schoolId, programId)`
- `SetForLoginFlow(schoolId)`; job→Running.
- Girdileri topla: program + görevlendirme + müfredat saati (`IRequiredHoursResolver`) + bell + external occupancy + ev-dersliği.
- `IScheduleSolver.Solve(input)`.
- Sonucu hedef programa uygula: mevcut aktif yerleşimleri pasifle (occupancy release) → planlanan yerleşimleri ekle (occupancy reserve + DB filtreli unique index backstop). Domain: programın mevcut `Place`/`SetBlock` davranışları yeniden kullanılır (yeni "apply draft" domain metodu gerekebilir — plan netleştirir).
- job→Done + özet (PlacedCount/Total/Score/Unplaced) | hata→Failed + sebep.

### 4.4 İzin
Yeni izin yok — `timetable.manage` (Draft düzenleme yetkisi autogen'i kapsar).

---

## 5. Frontend (autogen UI)

- **Tetik:** Hub `RowMenu` + editör `EditorMoreMenu` (⋯) → "Otomatik Oluştur" (yalnız Draft/Revising programda aktif).
- **Modal akışı:** özet/onay → enqueue (jobId) → **ilerleme** (poll `GetAutoGenerateStatusQuery`, ~1-2 sn aralık, queued/running) → **sonuç** (yerleşen X/Y saat + skor + yerleşemeyenler listesi; tam/kısmi/başarısız varyantları) → **"Editörde Aç"** (mevcut `/admin/schedule/:id/edit`).
- **Modül:** mevcut `src/portals/admin/timetable/` içine autogen api/hook/bileşen. React Query key tenant-scope; poll `refetchInterval` ile (job done/failed olunca durur).
- **i18n:** `timetable.autogen.*` (tr/en) — hardcoded Türkçe yok.
- **Tasarım:** `schedule_autogen.jsx` handoff verilmedi → mevcut editör/Hub stiline (PageHeader, modal, durum varyantları) uygun fonksiyonel UI; handoff sonradan gelirse hizalanır.

---

## 6. Güvenlik & çok-kiracılık

- `schedule_generation_jobs` TenantEntity → global query filter + interceptor SchoolId.
- Hangfire job tenant context'i set eder (HTTP yok).
- Status query sahiplik/scope (job'u tetikleyen okul + program). Solver saf — tenant'a dokunmaz (girdi handler'dan).
- Çapraz-program çakışma DB filtreli unique index ile garanti (solver atlasa bile kabul edilmez).

---

## 7. Test stratejisi (TDD)

- **Solver saf birim testleri (yoğun):** `BuildLessonDemands` (saat sayısı doğru), `SlotFeasibility` (her kısıt ayrı), `OrderByMostConstrained`, `BacktrackingSolver` (basit feasible senaryo tam çözüm; sıkı senaryo → kısmi + Unplaced; bütçe aşımı → asılı kalmaz), `SoftScore` (zor-ders-sabah vb. tercih edilen düzen daha yüksek skor).
- **Handler testleri:** Enqueue (Draft değilse / Published'da reddet; job satırı + enqueue), Status (scope/sahiplik).
- **Integration:** job uçtan uca bir sınıfı doldurur; çapraz-program occupancy çakışması yok (DB unique index); tekrar çalıştırma idempotent değil ama tutarlı (önce temizler).
- **Web vitest:** modal akışı (enqueue→poll→done), durum varyantları, "Editörde Aç" yönlendirme.

---

## 8. Spec Dışına Çıkılanlar / Debt (completion_status'a işlenecek)

- **Debt-AG-1:** Müsaitlik no-op (Faz 4 girdisi) — autogen müsaitliğe saygı duymaz; idareci taslakta düzeltir. (Spec §104 ile tutarlı; onaylı 2026-06-15.)
- **Debt-AG-2:** Branşa-özel oda-türü yok → ev-dersliği atanır (subject→room-type verisi gelince). Onaylı.
- **Debt-AG-3:** Tek aday taslak (çoklu+skor+seçim sonraki dilim). Onaylı.
- **Debt-AG-4:** Job durumu poll (SignalR push sonraki iş). Onaylı.
- **Debt-AG-5:** Tek sınıf (tüm-okul toplu üretim sonraki iş). Onaylı.
- **Debt-AG-6:** Esnek-kural optimizasyonu temel (greedy+tie-break+1 yerel-arama turu); gelişmiş optimizasyon/OR-Tools port arkasında sonra.

---

## 9. Teslim sırası (yüksek seviye — detay plan writing-plans'te)

1. **Solver çekirdeği (saf, BE):** portlar + SolveInput/Result + sezgisel birimler (BuildDemands/Feasibility/Order/Backtrack/Score) — yoğun birim test.
2. **No-op availability provider** + DI.
3. **Persistence:** `schedule_generation_jobs` + migration.
4. **CQRS + Job:** Enqueue/Status + `AutoGenerateScheduleJob` (girdi toplama + solver + uygula) + DI.
5. **Web:** autogen api/hook + modal (enqueue→poll→sonuç) + "Editörde Aç" + i18n + testler.
6. **Doküman:** timetable `business-rules`/`api-contracts`/`completion_status` (Faz 3 dilim-1 + Debt-AG-1..6).
