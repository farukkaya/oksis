# Ders Programı — Çok-Sınıf Otomatik Üretim (Faz 3 / Dilim 2) Tasarımı

**Durum:** Tasarım kararları onaylandı (brainstorming, kullanıcı onayı 2026-06-17)
**Tarih:** 2026-06-17
**İlgili bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` (Faz yol haritası §1, Faz 3)
**Önceki dilim:** `.claude/specs/ders-programi-cok-taslak-otomatik-uretim-design.md` (Dilim 1 — tek sınıf, tamam)
**Modül:** `timetable` (`.claude/docs/modules/timetable/`)
**Kapsam:** Faz 3 / Dilim 2 — Otomatik Üretim, çok-sınıf (Kademe & Tümü)

---

## 1. Amaç & Bağlam

Faz 3 / Dilim 1 tek sınıf için sıfırdan otomatik program üretimini teslim etti (header akışı,
3 aday, ağırlıklar, katı mod). `AutoGenDrawer`'daki **Kademe** ve **Tümü** kapsam seçenekleri
Dilim 1'de bilinçli olarak `disabled` bırakılmıştı (Debt-AG-5). Dilim 2 bunları aktive eder:
bir kademenin tüm şubeleri ya da okuldaki görevlendirmesi olan tüm sınıflar için **tek seferde,
birbiriyle koordineli** taslak üretimi.

**Çekirdek zorluk:** Çok sınıf aynı anda üretilirken **öğretmen ve derslik paylaşılan kaynaktır** —
9-A Pzt-1'de ders veren öğretmen 9-B Pzt-1'de veremez; aynı derslik aynı slotta iki sınıfta
kullanılamaz. Sınıfları bağımsız üretmek devasa çapraz çakışma yaratır. Bu yüzden üretim
**joint (ortak) solver** ile yapılır (K-D2-1).

Tasarım handoff'u: `.claude/design-handoffs/schedule_autogen.jsx` (Kapsam bölümü `:174-193`,
bulk sonuç satırları `ag-bulk` `:274-287`, kademe/tümü seçici `:180-191`).

---

## 2. Bağlayıcı Kararlar (kullanıcı onaylı — 2026-06-17)

- **K-D2-1 — Joint (ortak) solver.** Çok sınıf, **tek koordineli açgözlü geçişte** birlikte çözülür;
  öğretmen/derslik doluluğu global tutulur, sınıflar arası serpiştirilir. Sıralı/birikimli yaklaşım
  (her sınıfı tek tek üretip öncekini "dolu" girdi yapmak) **reddedildi** — sıra önyargısı yaratır.
  Joint en iyi global kaliteyi verir; karşılığında solver çekirdeği çok-sınıflı hâle genelleştirilir.

- **K-D2-2 — Tek sınıf = N=1 özel hâli.** Mevcut tek-sınıf solver davranışı bozulmaz; çok-sınıf
  genelleştirmesi tek sınıfı kapsayan bir özel durumdur. Tek sınıf kapsamının FE akışı (3 aday kartı,
  kullanıcı seçer) **aynen korunur**.

- **K-D2-3 — Seçmeli apply.** Bulk sonuç ekranı, üretilen her sınıf için bir satır gösterir. Üç
  kalıcılaştırma yolu (kullanıcı talebi):
  1. **Satır "Editörde Aç"** → yalnız o sınıfın Taslağı yaratılır + o programa navigate edilir.
  2. **"Tümünü Taslak Kaydet"** → üretilen tüm sınıfların Taslakları yaratılır (navigate yok).
  3. **Satır checkbox'ları + "Seçilenleri Kaydet"** → yalnız seçili sınıfların Taslakları yaratılır.

- **K-D2-4 — Idempotent apply + izlenebilirlik.** Yeni `ScheduleProgram`, üretildiği job'a
  `GeneratedFromJobId` (nullable) ile damgalanır. Apply, bir `(JobId, BranchId)` için zaten Taslak
  varsa **yeniden yaratmaz, mevcudunu döndürür** ("Aç" sonra "Tümünü Kaydet" senaryosunda çift taslak
  olmaz; çift tıklama güvenli).

- **K-D2-5 — Bulk'ta sınıf-başına aday seçimi yok.** Joint çözüm sınıfları birbirine bağladığından,
  bir sınıfın stratejisi diğerlerinden bağımsız değiştirilemez. Bulk modda 3 strateji global olarak
  koşar, en iyi global aday **önerilen** seçilir ve **sınıf-bazlı parçalanmış** gösterilir (handoff:
  "Her sınıf için en iyi skorlu taslak seçildi"). Per-sınıf A/B/C kartı yoktur. Tek sınıf modda 3 kart
  korunur (K-D2-2).

- **K-D2-6 — Süregelen Debt (Dilim 1 ile aynı duruş).** Blok üretimi **kapalı** (Debt-AG-8); öğretmen
  müsaitliği **no-op** (Debt-AG-1); zil çizelgesi **okul-geneli tek grid** (tüm sınıflar aynı periyot
  ızgarasını paylaşır — Debt-FE-3 / AS-2); joint optimizasyon yine açgözlü-heuristik, OR-Tools ileride
  (Debt-AG-6).

---

## 3. Parça A — Solver çekirdeği (joint çok-sınıf)

Mevcut saf solver (`Modules/Timetable/AutoGenerate/Solver/`) çok-sınıflı hâle genelleştirilir.
Tek-sınıf davranışı N=1 özel hâli olarak korunur (K-D2-2).

### 3.1 Sözleşme değişiklikleri (`SolverContracts.cs`)
- **`LessonDemand`** → `BranchId` alanı eklenir: `(Guid BranchId, Guid SubjectId, Guid TeacherId, bool IsHardSubject, int BlockGroupSeq)`.
- **`PlannedPlacement`** → `BranchId` alanı eklenir: `(Guid BranchId, DayOfWeek Day, int Period, Guid SubjectId, Guid TeacherId, Guid? RoomId, bool IsBlock, int BlockGroupSeq)`.
- **`SolveInput`** → `HomeRoomId` (tek `Guid?`) yerine **`IReadOnlyDictionary<Guid, Guid?> HomeRoomByBranch`** (branch → ev-dersliği). `AvailableSlots` paylaşılır (tüm sınıflar aynı grid — K-D2-6).
- **`CandidateMetrics`** → mevcut global metrikler korunur (sıralama için aggregate). Yeni:
  per-class metrik için sınıf-bazlı bir liste taşınır (3.4).
- **`SolveCandidate`** → `IReadOnlyList<ClassMetrics> PerClass` eklenir (her biri `BranchId` + o sınıfın
  `CandidateMetrics`'i). Tek sınıfta liste tek elemanlıdır ve aggregate == o eleman.

### 3.2 `GreedyState` (`GreedySolver.cs`)
- `TeacherOccupied: (TeacherId, Day, Period)` — **global, değişmez** (paylaşılan kaynak).
- `RoomOccupied: (RoomId, Day, Period)` — **global, değişmez**.
- `ClassOccupied` → **`(BranchId, Day, Period)`** (sınıf-bazlı).
- `DailySubjectCount` → **`(BranchId, Day, SubjectId)`** (BR-TT-014 sınıf-bazlı).
- `ClassSubjectAt` → **`(BranchId, Day, Period)`** (BR-TT-015 blok-eğilimi sınıf-bazlı komşuluk).

### 3.3 MRV + yerleştirme
- MRV sıralaması **tüm sınıfların talepleri arasında** ortak çalışır: en az uygun-slotu olan talep
  (hangi sınıftan olursa olsun) önce yerleşir. Talep `BranchId` taşıdığı için `CountFeasible` ve
  `SlotFeasibility.CanPlace` branch-bağlamını kullanır.
- `SlotFeasibility.CanPlace`: sınıf-slot tekilliği + ev-dersliği branch'e özel (demand.BranchId);
  öğretmen tekilliği + dış öğretmen meşguliyeti + derslik tekilliği global; günlük-aynı-ders
  (BR-TT-014) branch-bazlı sayaçtan. `FeasibilityContext` branch-farkında olur.
- Strateji delegeleri (`CandidateStrategies` A/B/C) demand'ın branch bağlamıyla aynı mantıkla çalışır;
  GapMinimizing öğretmenin **global** yerleşimlerine bakar (sınıflar arası boşluk azaltma doğal kazanım).

### 3.4 Puanlama (`CandidateScorer.cs`)
- **Per-class metrik:** Her branch için ayrı çakışma(0)/eksik-saat/ort-boş-saat/tercih-uyumu%/günlük-denge
  hesaplanır (handoff bulk satırlarındaki rozetler için).
- **Aggregate skor:** Sıralama için toplam eksik (Σ MissingHours) ve ağırlıklı ortalama skor. Üç
  strateji `(Σ MissingHours ↑, aggregate Score ↓)` ile sıralanır; en iyi = önerilen.
- Strict modda en iyi adayın **toplam** eksik saati > 0 ise → `NoSolution` + `RelaxationHints`
  (mevcut hint mantığı; handoff nosolution ekranı). Non-strict → her zaman sonuç; eksik saatler
  per-class rozetlerde görünür.

### 3.5 `LessonDemandBuilder`
- `Build`, artık branch → assignment-line gruplarını alır ve her talebe `BranchId` damgalar.
  Bloklar kapalı (Debt-AG-8) → `BlockGroupSeq` her zaman 0 (değişmedi).

---

## 4. Parça B — Job, akış, persistence

### 4.1 `ScheduleGenerationJob` entity
- Eklenir: **`Scope`** enum (`Single = 0`, `GradeLevel = 1`, `All = 2`), **`GradeLevel`** (nullable int —
  yalnız `GradeLevel` kapsamında dolu).
- `BranchId` **nullable** olur (yalnız `Single` kapsamında dolu; bulk'ta job sınıf-bağımsız).
  `AcademicTermId` + `AcademicYearId` korunur (kapsam çözümlemesi için).
- `CandidatesJson` artık placement'ları **`BranchId` etiketli** + per-class metrikleri taşır.
- Migration: `<YYYYMMDD>_schedule_gen_job_scope` (kolon ekleri + `BranchId` nullable; mevcut Single
  satırları `Scope = Single` ile uyumlu — backfill basit).

### 4.2 `EnqueueAutoGenerateCommand`
- İmza: `(Scope Scope, Guid? BranchId, int? GradeLevel, Guid AcademicYearId, Guid AcademicTermId, AutoGenWeightsRequest Weights, bool Strict)`.
- Doğrulama: `Single` → `BranchId` zorunlu; `GradeLevel` → `GradeLevel` zorunlu; `All` → ikisi de boş.
  Kapsamdaki sınıf kümesi çözülür (görevlendirmesi olan şubeler); küme boşsa anlamlı hata
  (`autogen-no-classes`). İzin `timetable.manage` (korunur).

### 4.3 `AutoGenerateScheduleJob` (Hangfire arka plan)
- `RunAsync(jobId, schoolId, ct)` — job satırından scope/term/year/gradeLevel okunur.
- **Kapsamdaki sınıfları çöz:** görevlendirmesi olan şubeler (Single → 1, GradeLevel → o seviyeninkiler,
  All → hepsi). Her sınıf için: görevlendirmeleri (`ITeachingAssignmentSource`) + ev-dersliği
  (`ClassRoom.RoomId`). Talepler tüm sınıflar için tek listede toplanır (`BranchId` damgalı).
- **Dış doluluk (K12):** kapsam **dışındaki** sınıfların rezerve-eden (Yayında/Revize) yerleşimleri.
  Kapsam içindeki sınıflar joint çözüldüğü için birbirini global occupancy ile zaten dışlar; yalnız
  kapsam dışı canlı programlar dış-busy olarak eklenir.
- Solver `SolveInput` (çok-sınıf) ile koşulur; en iyi global aday job satırına yazılır
  (`CompleteWithCandidates` / `MarkNoSolution` / `Fail`). İdempotency guard korunur (yalnız Queued koşar).

### 4.4 `ApplyAutoGenerateDraftsCommand` (apply — seçmeli)
- Eski `ApplyAutoGenerateDraftCommand(JobId, CandidateId)` → **`ApplyAutoGenerateDraftsCommand(JobId, IReadOnlyList<Guid> BranchIds)`**.
  (Bulk'ta tek aday vardır — önerilen; tek sınıfta FE seçilen `CandidateId`'yi taşımaya devam eder →
  bkz. 4.5 DTO uyumluluğu.)
- Her `BranchId` için: job'un en iyi adayındaki o sınıfın yerleşim dilimi → **yeni Taslak `ScheduleProgram`**
  (`ScheduleProgram.Create` + `ApplyGeneratedDraft`), `GeneratedFromJobId = jobId` damgası, stats recompute
  (`IScheduleProgramStatsRecomputer`).
- **Idempotency (K-D2-4):** `(GeneratedFromJobId == jobId && BranchId == b)` Taslağı zaten varsa yeniden
  yaratma, mevcut programId'yi döndür.
- Dönüş: `IReadOnlyList<AppliedDraftDto> { Guid BranchId, Guid ProgramId }`.
- Migration: `<YYYYMMDD>_schedule_program_generated_from` (nullable `GeneratedFromJobId` kolonu + index).

### 4.5 API (SchedulingController)
- `POST .../auto-generate` body: `{ scope, branchId?, gradeLevel?, academicYearId, academicTermId, weights, strict }` → jobId. (Single için mevcut body genişler; geriye uyum: `scope` yoksa `Single` varsayılır.)
- `GET .../auto-generate/{jobId}` — `AutoGenStatusDto` genişler: `Scope` + adayların placement'ları
  `BranchId` taşır + `PerClass` metrik listesi. Tek sınıf yolu mevcut alanları okumaya devam eder.
- `POST .../auto-generate/{jobId}/apply` body: `{ branchIds: Guid[] }` (tek sınıf → tek elemanlı) → `[{branchId, programId}]`.
  - Tek sınıf modda FE, seçilen `CandidateId`'yi (A/B/C) hâlâ seçebildiği için: tek-sınıf apply,
    seçilen adayın dilimini uygular. **Çözüm:** apply body'sine opsiyonel `candidateId` eklenir
    (yalnız Single'da anlamlı; bulk'ta önerilen aday sabit). Single dışında yok sayılır.
- `GET .../auto-generate/classes` — mevcut; kademe filtresi için opsiyonel `gradeLevel` query eklenebilir
  (FE kademe seçiminde listeyi daraltmak için; sunucu zaten `GradeLevel` döndürüyor → FE'de de filtrelenebilir,
  tercih FE filtresi → yeni sunucu işi yok).

---

## 5. Parça C — Frontend (`oksis-web`)

- **`AutoGenDrawer`:** Kapsam bölümü aktive (`single`/`kademe`/`all`); `single` → şube seçici (mevcut),
  `kademe` → kademe seçici (görevlendirmeli sınıfların `gradeLevel`'larından), `all` → seçici yok.
  Geri besleme: "{n} sınıf · görevlendirmelerden beslenir".
- **Sonuç ekranı:**
  - `single` → mevcut **3 aday kartı** akışı (korunur, K-D2-2/K-D2-5).
  - `kademe`/`all` (bulk) → **per-class satırlar** (`ag-bulk`): her satırda **checkbox** + sınıf adı +
    "Taslak hazır" + tercih%/ort-boş + çakışma/eksik rozeti + **"Editörde Aç"**.
  - Footer (bulk): **"Tümünü Taslak Kaydet"** + (seçim varsa) **"Seçilenleri Kaydet"**. Kaydet → `apply(branchIds)`
    → başarı durumu (kaç taslak oluştu); "Aç" → `apply([branchId])` → `/admin/schedule/{newId}/edit`.
- **`useAutoGenerate`:** `enqueue({scope, branchId?, gradeLevel?, ...})`, `apply(branchIds[])`. Poll değişmez.
- **i18n `timetable.autogen.*`** genişler (kapsam etiketleri, bulk başlık/satır, kaydet butonları,
  başarı metni) — tr/en, hardcoded Türkçe yok.
- Tek-sınıf testleri ve davranışı regresyona karşı korunur.

---

## 6. Testler (TDD)

**Backend (Application/Domain birim + Infrastructure integration):**
- Solver: iki sınıf aynı öğretmeni/dersliği aynı slotta isteyince **biri kayar** (çapraz çakışma engellenir);
  tek-sınıf regresyon (N=1) eski sonuçları korur; per-class metrikler doğru hesaplanır.
- MRV: çok-sınıf karışık taleplerde en kısıtlı önce yerleşir (deterministik).
- `EnqueueAutoGenerate`: scope doğrulama (Single→branchId zorunlu, GradeLevel→gradeLevel zorunlu, All);
  kapsamda sınıf yoksa hata; geçerli kapsam → Queued job + doğru Scope/GradeLevel.
- `ApplyAutoGenerateDrafts`: çoklu branch → N yeni Taslak (her biri `GeneratedFromJobId` damgalı);
  **idempotent** (aynı job+branch ikinci apply yeni taslak yaratmaz, mevcudu döner); tek branch → id + navigate verisi.
- `AutoGenerateScheduleJob` integration: kademe/tümü girdileriyle Done + branch-etiketli adaylar; kapsam-dışı
  canlı program dış-busy olarak saygı görür.
- Migration'lar: scope kolonları + `GeneratedFromJobId` uygulanır; mevcut Single satırları bozulmaz.

**Frontend (vitest):**
- `AutoGenDrawer`: kapsam seçici 3 seçenek aktif; `kademe` → kademe seçici; bulk sonuç satırları + checkbox
  render; "Tümünü kaydet" → apply(tüm branchId'ler); "Seçilenleri kaydet" → apply(seçili); satır "Aç" →
  apply([branch]) + navigate(yeni id).
- Tek sınıf: 3 kart akışı + apply(candidateId) **korunur** (regresyon).

---

## 7. Doküman Etkileri

- `modules/timetable/`: `database-schema.md` (job scope kolonları + `GeneratedFromJobId`),
  `api-contracts.md` (enqueue scope body + apply branchIds + status DTO genişlemesi),
  `business-rules.md` (joint çok-sınıf çakışma kuralı; seçmeli apply), `ui-flows.md` (bulk kapsam akışı),
  `completion_status.md` (Dilim-2 ✅ + `⚠️ Spec Dışına Çıkılanlar` kayıtları + Debt-AG-5 kapanışı +
  ilerleme/Güncel tarih).
- `ders-programi-modulu-spec.md`: Faz 3 satırı — Dilim 2 tamam notu.

---

## 8. Sıralama & Kapsam Dışı

**Sıralama:** (1) Parça A (solver joint genelleştirme — N=1 regresyonu yeşil tutularak) →
(2) Parça B (job/enqueue/apply + migration'lar) → (3) Parça C (FE kapsam + bulk + kaydet).

**Kapsam dışı (Faz 4 / sonra):** Öğretmen müsaitliği girdisi (Debt-AG-1); blok üretimi (Debt-AG-8);
kademe-bazlı farklı zil çizelgesi (AS-2); Hub'da grup/expand görünümü (program-başına düz satır yeterli);
joint global optimizasyon iyileştirmesi / OR-Tools (Debt-AG-6); SignalR job-push (Debt-AG-4).

---

*Oksis — Ders Programı Modülü · Faz 3 / Dilim 2 (Çok-Sınıf Otomatik Üretim) · v1 · 2026-06-17*
