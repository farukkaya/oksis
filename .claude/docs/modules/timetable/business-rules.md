# Ders Programı — Business Rules

> Bu modüle özel iş kuralları. Yazılım dünyasından gelen genel kurallar değil — **OKSİS'te Ders Programı için spesifik** kararlar.

> Genel iş kuralları için bkz. proje kökündeki `business-rules.md`.

> **Kural sınıflandırması:** HARD = ihlal engellenir, isteğe rağmen geçilemez. SOFT = uyarı verilir, kullanıcı override edebilir.

---

## Kurallar

### BR-TT-001: Öğretmen Saat Çakışması (HARD)

**Kural:** Bir öğretmene aynı `(SchoolId, AcademicTermId, DayOfWeek)` ve **çakışan zaman aralığı** için ikinci bir aktif (`Status == Published`, `EffectiveFrom <= today <= EffectiveTo`) Schedule atanamaz.

**Sebep:** Bir insan aynı anda iki sınıfta olamaz. Çakışan atama yoklama, ders yapma ve veli bildirimini bozar. Bu pedagojik temel; her okul yönetim sistemi bunu garanti etmek zorunda.

**Uygulama:**
- Backend: Domain layer'da `Schedule.Create()` ve `Schedule.Supersede()` içinde `IScheduleConflictChecker` çağrısı. Dapper sorgusu `ix_schedules_conflict_teacher` index'i üzerinden P95 < 20ms.
- Frontend: Sürükle-bırak sırasında `POST /schedules/validate` debounce 300ms; kırmızı border + tooltip.
- DB: Aralık çakışması filtered unique ile garanti edilemediği için sadece application kontrolü; ancak `ix_schedules_conflict_teacher` index'i hızlı sorguyu garanti eder.

**Edge case'ler:**
- Update senaryosunda **kendi satırını** hariç tut (`WHERE id <> @currentScheduleId`).
- Block ders: aynı block grup içindeki ardışık 2 slot çakışma değil — `block_group_id` set edilmişse atla.
- Override scenario'sunda da kontrol: `TeacherSubstitution` override'ında yeni teacher için aynı kontrol o gün için yapılır.

**Test referansı:** `Oksis.Application.UnitTests/Timetable/ScheduleConflictTests.TeacherConflict_Should_Block_Overlapping_Assignment`

---

### BR-TT-002: Şube Saat Çakışması (HARD)

**Kural:** Bir şubeye aynı `(SchoolId, AcademicTermId, DayOfWeek)` ve çakışan zaman aralığı için ikinci aktif Schedule atanamaz.

**Sebep:** Bir sınıf aynı anda iki dersi alamaz. Çakışan atama yoklama mantığını ve öğrenci/veli görüntüsünü bozar.

**Uygulama:**
- Backend: BR-TT-001 ile aynı katmanlar; `ix_schedules_conflict_branch` index'i.
- Frontend: Aynı validation pipeline.
- DB: Application layer.

**Edge case'ler:**
- Kombinatorik sınıf (örn. seçmeli — 9-A'nın bir grubu seçmeli müzik, bir grubu seçmeli görsel sanatlar) **şu MVP'de desteklenmiyor** — açık soru OQ-TT-004'te.
- Bütün şubeler aynı anda törende (örn. milli bayram) → bunlar zaten tatil/etkinlik günü, Schedule oluşturulmamış olmalı.

**Test referansı:** `Oksis.Application.UnitTests/Timetable/ScheduleConflictTests.BranchConflict_Should_Block_Overlapping_Assignment`

---

### BR-TT-003: Derslik Saat Çakışması (HARD, RoomId set edildiğinde)

**Kural:** `RoomId != null` olan bir Schedule için aynı `(SchoolId, AcademicTermId, RoomId, DayOfWeek)` ve çakışan zaman aralığında ikinci aktif Schedule atanamaz.

**Sebep:** Fiziksel mekân tek seferde tek kullanıma açıktır. Özellikle laboratuvar, spor salonu, müzik odası gibi paylaşımlı mekânlarda çakışma haftalık kaos yaratır.

**Uygulama:**
- Backend: `IScheduleConflictChecker` üçüncü kuralı. RoomId null ise atlanır (Schedule'a derslik atanmamış).
- Frontend: Validation aynı pipeline.
- DB: `ix_schedules_conflict_room` filtered index (sadece `room_id IS NOT NULL`).

**Edge case'ler:**
- Aynı dersliği aynı slotta iki şube paylaşan ders (örn. birleştirilmiş ders) **MVP'de desteklenmiyor** — açık soru OQ-TT-006.
- Pasifleşen derslik: aktif Schedule'ları etkilemez (BR-TT-009 koruması), yeni atama yapılamaz.

**Test referansı:** `RoomConflict_Should_Block_When_RoomId_Set`

---

### BR-TT-004: Tatil Günü Yasağı (HARD)

**Kural:** `EffectiveFrom` tarihi veya devamında okulun tatil olarak işaretlediği günlere ders atanamaz. Sezon içi tatil eklenirse, o güne denk gelen Schedule'lar otomatik askıya alınmaz (operasyonel karar `school-settings.holidays` üzerinden); ancak yeni Schedule **oluşturma anında** kontrol edilir.

**Sebep:** Resmi tatiller, dini bayramlar, yerel etkinlikler (okul özel günü) ders yapılamaz. Bildirim ve yoklama açısından yanlış sinyal yaratır.

**Uygulama:**
- Backend: Domain port `IHolidayChecker.IsHolidayAsync(schoolId, date)` — `school-settings.holidays` + `academic-years.official_holidays` birleşimi.
- Frontend: Tarih seçici UI'da tatil günleri disable + tooltip "Tatil günü".
- DB: Application layer (deterministik tatil tablosu sorgusu).

**Edge case'ler:**
- Tatilden sonra eklenmiş Schedule, sezon içinde yeni tatil eklenirse → otomatik etkilenmiyor; yönetim manuel `ScheduleOverride(Cancellation)` oluşturmalı (telafi planlanacaksa Faz 2 telafi modülünden). Şu an mantık: "tatil günü açıkça eklenmedi" varsayımı.
- Yarım gün tatil (örn. 15 Şubat 13:00'da kapanış) → MVP'de desteklenmiyor; tüm gün tatil/değil ikilisi var.

**Test referansı:** `HolidayCheck_Should_Block_Schedule_On_Holiday`

---

### BR-TT-005: Zil Saati Slot Uyumu (HARD)

**Kural:** `StartTime` ve `EndTime`, okulun `school-settings.bell-schedules` içinde tanımlı zaman dilimlerinden birine **tam denk gelmek zorundadır**. Teneffüs/break dilimlerine ders atanamaz.

**Sebep:** Zil saatleri okulun operasyonel temel ritmidir. Programın bunu ihlal etmesi öğrenci/öğretmen geçiş süresini bozar, servis ve yemekhane planını sarsar.

**Uygulama:**
- Backend: `IBellScheduleProvider.GetSlotsAsync(schoolId, day)` ile slot listesi alınır; yeni Schedule'ın `(startTime, endTime)` çifti slotlardan birini **tam** karşılamalı.
- Frontend: Form'da saat seçici **dropdown** (zil saatleri listesi); manuel giriş yok.
- DB: Application layer (zil saatleri ayrı tabloda, FK constraint pratik değil).

**Edge case'ler:**
- Blok ders: 2 ardışık slot tek Schedule olarak değil, **iki Schedule + ortak `block_group_id`** olarak modelleme. (`isBlockLesson = true` flag pedagojik bilgi.)
- Zil saati sezon ortası değişirse → mevcut Schedule'lar otomatik invalide edilmez; manuel düzeltme. UI uyarı verir.
- Cumartesi telafi günü farklı zil → `bell_schedules.day_of_week` farklı satırla yönetilir.

**Test referansı:** `BellSlot_Should_Match_Exact_Slot`

---

### BR-TT-006: Öğretmen Branş Uyumu (SOFT — uyarı)

**Kural:** Atanan öğretmenin `Specialty` (branş) alanı, atanan dersin `Course.GradeLevel`/kategori bilgisiyle uyumlu olmalı. Uyumsuzluk **engellenmez**, sadece uyarı verilir.

**Sebep:** Çoğu okul matematik öğretmenine matematik atar — ama küçük okullarda istisna olabilir (örn. matematik öğretmeni 5. sınıfa fen okuturken yardım eder). Sert kural ihlali esnekliği kaldırır; uyarı yeterli.

**Uygulama:**
- Backend: `IScheduleSoftValidator.CheckTeacherBranch(...)` — response'a `softWarnings[]` ekler.
- Frontend: Hücre üstünde sarı badge + tooltip; modal'da "branş uyumsuz; yine de kaydet" toggle (default açık, kapatınca form blocking değil ama sebep sorulur).
- DB: Kural yok.

**Edge case'ler:**
- Çoklu branş öğretmeni (örn. Fen + Biyoloji) — `Teacher.Specialty` tek string; Faz 2'de çoklu branş desteği planlanıyor.
- Branş alanı boş öğretmen → uyarı verilmez (eski veri).

**Test referansı:** `TeacherBranch_Soft_Warning_When_Mismatch`

---

### BR-TT-007: Müfredat Kotası Uyarısı (SOFT — uyarı, force-publish hakkı var)

**Kural:** Şube × ders × dönem için müfredat planında belirlenmiş haftalık ders saati (`CurriculumPlans.WeeklyHour` — Faz 2 tablosu) ile Schedule'da gerçekleşen saat sayısı **eşit olmalı**. Eşit değilse yayın anında uyarı verilir; SchoolAdmin "yine de yayınla" hakkına sahiptir.

**Sebep:** MEB ve okul içi müfredat çerçevesinde "9. sınıfta haftada 6 matematik" gibi hedefler vardır. Pratikte sezon başında bu hedefe %95-100 ulaşmak istenir ama nadir esnek durumlar (telafi, seçmeli denkleme) olabilir.

**Uygulama:**
- Backend: `IPublishGuardian.CheckCurriculumQuota(termId)` — `POST /timetable/publish` öncesi çalışır; uyumsuz şube × ders kombinasyonları listelenir.
- Frontend: Yayın modal'ında uyarı listesi: "9-A Matematik: hedef 6, atanan 5". "Yine de yayınla" butonu mevcut.
- DB: `curriculum_plans` tablosu (Faz 2; MVP'de bu kural pasif).

**Edge case'ler:**
- `CurriculumPlans` tablosu boşsa → uyarı verilmez (kural inaktif kabul edilir).
- Atanan > hedef → yine uyarı verilir, ancak farklı tonla ("9-A Matematik: hedef 6, atanan 7 — fazlalık").

**Test referansı:** `CurriculumQuota_Warns_But_Does_Not_Block_Publish`

---

### BR-TT-008: Yayınlanmış Schedule Silinemez (HARD)

**Kural:** `Status == Published` bir Schedule fiziksel olarak (`DELETE`) silinemez. Yalnızca `Archive(...)` ile statü değişir (`EffectiveTo` set edilir, `Status = Archived`).

**Sebep:** Yoklama kayıtları (`attendances.schedule_id`) bu Schedule'a referans verir. Fiziksel silme yoklama bütünlüğünü kırar ve sınıf rapor/karne üretimini imkânsızlaştırır.

**Uygulama:**
- Backend: `DeleteScheduleCommand` handler `Status == Draft` kontrolü — değilse `ConflictException` (409, `TT-CANNOT-DELETE-PUBLISHED`).
- Frontend: Sil butonu Published satırlarda **görünmez veya disabled**; tooltip "Arşivle" butonuna yönlendirir.
- DB: `is_deleted = 1` set edilebilir ama uygulama tarafı bunu Published için engeller.

**Edge case'ler:**
- Draft satır silinebilir (henüz yayında olmadığı için yoklama referansı yok).
- Hard delete superadmin için bile yok — KVKK 6 ay sonrası purge'ü ayrı süreç.

**Test referansı:** `Delete_Should_Throw_When_Published`

---

### BR-TT-009: Yoklama Referansı Olan Schedule Korunur (HARD)

**Kural:** Bir Schedule'a en az bir `attendance` kaydı bağlı ise, fiziksel silme yasak; sadece `Archive(...)` üzerinden statü değişir. Bu kural BR-TT-008'in genişletmiş hâli (sadece Published değil, herhangi bir Schedule için).

**Sebep:** Yoklama hem yasal hem operasyonel önemde. Geçmişe dönük rapor (devamsızlık özeti, karne) için Schedule referansı **canlı** kalmak zorunda.

**Uygulama:**
- Backend: `IScheduleRepository.HasAttendancesAsync(scheduleId)` kontrolü; varsa 409 (`TT-HAS-ATTENDANCES`).
- Frontend: Aynı görsel kural (sil disabled). Detayda "Bu satırın {N} yoklama kaydı var" bilgisi.
- DB: Database trigger değil — application enforcement.

**Edge case'ler:**
- Draft Schedule'a yoklama olmaz (yoklama Published'a referans verir). Yine de güvenlik için her ihtimale karşı kontrol.

**Test referansı:** `Delete_Should_Throw_When_Has_Attendances`

---

### BR-TT-010: Sezon Ortası Değişiklikte Bildirim Zorunlu (HARD)

**Kural:** `Schedule.Supersede(...)` ya da `ScheduleOverride.Create(...)` işlemi başarılı olduğunda, etkilenen rollere (Teacher eski + yeni + Parent + Student) **bildirim event'i fırlatılır**. Bildirim atılmaması bir bug'dır; sessizce kabul edilmez.

**Sebep:** "Programınız değişti ama haberin yok" — veli/öğretmen güveni en hızlı kaybeden yer burası. Pilot okulun ilk haftalarında bu kuralın ihlali = kullanıcı kaybı.

**Uygulama:**
- Backend: Handler aggregate `Supersede` çağrısı içinde `ScheduleSupersededEvent` yayınlar (MediatR domain event); `INotificationDispatcher` Hangfire job'ı tetikler.
- Frontend: Override formunda preview: "{N} kişiye bildirim gönderilecek". Onay sonrası toast'ta "{N} bildirim kuyruğa alındı".
- DB: Event outbox pattern (eğer kullanılıyorsa) garanti eder — yayın commit'i ile event commit'i atomik.

**Edge case'ler:**
- Initial publish: tek dijest (yüzlerce push değil) — bkz. notifications.md.
- Bildirim job hata verirse Hangfire retry; 3 deneme sonrası DLQ + ops alarm.

**Test referansı:** `Supersede_Should_Raise_ScheduleSupersededEvent`

---

### BR-TT-011: Override Tarih Sınırı (HARD)

**Kural:** `ScheduleOverride.OverrideDate` değeri `today..today + 30 days` arasında olmalı.

**Sebep:**
- Geçmişe override = manipülasyon riski; geçmiş bildirim atılmaz, mantıksız.
- 30 günden uzun ileriye override = sezon ortası planlama; bunun yerine `Supersede` ile yapısal değişiklik daha doğru.

**Uygulama:**
- Backend: `CreateScheduleOverrideCommand` validation (FluentValidation + domain).
- Frontend: Tarih seçici min=today, max=today+30; disabled aralık dışı.
- DB: Application (today deterministik değil).

**Edge case'ler:**
- Cumartesi telafi planı 35 gün sonra → Override değil, yapısal program değişikliği gerek (`Supersede`).
- Yıllık planlamada uzun vadeli iptal → akademik koordinatör Schedule'ı doğrudan günceller.

**Test referansı:** `Override_Should_Reject_Past_Date`, `Override_Should_Reject_More_Than_30_Days`

---

### BR-TT-012: Öğretmen Günlük Yük Uyarısı (SOFT)

**Kural:** Bir öğretmenin tek günde toplam ders saati 8'i aşarsa uyarı verilir.

**Sebep:** Pedagojik tükenmişlik + MEB öneri çerçevesi. Sert kural değil çünkü küçük okullarda (yarı zamanlı öğretmenler az) zorunlu olabilir.

**Uygulama:**
- Backend: `IScheduleSoftValidator.CheckTeacherDailyLoad(teacherId, day)` — toplam slot süresi hesaplanır.
- Frontend: Atama anında uyarı; öğretmen detay sayfasında günlük yük heatmap (Faz 2).
- DB: Yok.

**Edge case'ler:**
- Blok ders aynı saat aralığı sayar (1 block = 80 dk değil, 2 × 40 dk).
- 8 saat = `start_time..end_time` farkı toplam dakika / 40 (default ders süresi); okul ayarına göre değişebilir (Faz 2 yapılandırılabilir).

**Test referansı:** `TeacherDailyLoad_Warn_Over_8_Hours`

---

### BR-TT-013: Şube Aynı Ders Günlük Tekrar Uyarısı (SOFT)

**Kural:** Bir şubeye aynı günde aynı dersten 2'den fazla atama uyarı verir.

**Sebep:** Aynı sınıfa aynı gün 3+ matematik dersi pedagojik olarak sağlıksız (öğrenci konsantrasyon dağılımı). Küçük şubelerde ve hazırlık sınıflarında (yoğun dil) istisna olabilir, bu yüzden SOFT.

**Uygulama:**
- Backend: `IScheduleSoftValidator.CheckDailySameSubject(branchId, courseId, day)`.
- Frontend: Atama anında uyarı.
- DB: Yok.

**Edge case'ler:**
- Block ders 1 olarak sayılır (`block_group_id` aynı satırlar tek atama).
- Hazırlık sınıfı yabancı dil: 4 saat aynı gün normal olabilir; eşik yapılandırılabilir (Faz 2).

**Test referansı:** `DailySameCourse_Warn_Over_2`

---

### BR-TT-014: Otomatik Üretim — Günde Aynı Ders ≤2 (KESİN; Faz 3)

**Kural:** Otomatik program üretiminde (autogen) bir sınıf, bir günde aynı dersi (subject) en fazla **2** kez alır. 3.'sü o güne yerleştirilmez (3+ ardışığı da dolaylı önler). Yer bulunamazsa o saat **eksik saat** olarak işaretlenir.

**Sebep:** Solver bazen 3-4 saat aynı dersi arka arkaya/aynı güne yığıyordu — uygulanabilir değil. BR-TT-013'ün (editörde SOFT uyarı, per-gün) autogen'deki **kesin (HARD)** karşılığı.

**Uygulama:**
- Backend: solver feasibility — `SlotFeasibility.CanPlace` günlük `(gün, subject)` sayacı ≥2 ise slotu reddeder. `SolverWeights.LimitDailySameSubject` (varsayılan `true`) ile aç/kapa.
- Frontend: Otomatik Üretim sihirbazı (`AutoGenDrawer`) "Aynı dersi günde en fazla 2 saat" toggle'ı (varsayılan açık). Hazırlık/yoğun dil sınıfı gibi istisnalar için kapatılabilir.

**Edge case'ler:**
- Kapatıldığında eski davranış (sınırsız) geçerli.
- Blok ders (Faz 3 Dilim-1'de kapalı): 2'lik blok = 2 sayılır, serbest.

**Test referansı:** `SlotFeasibilityTests.Blocks_when_daily_same_subject_limit_reached`, `GreedySolverTests.Limits_same_subject_to_two_per_day_when_enabled`

---

### BR-TT-015: Otomatik Üretim — 2'şer Saat Blok Eğilimi (SOFT; Faz 3)

**Kural:** Autogen, aynı dersi mümkünse aynı günde **yan yana** (period±1) yerleştirmeye eğilim gösterir → çok-saatli dersler doğal olarak **2'şer saat blok** halinde dizilir. 1 haftalık saatli dersler (Müzik, Rehberlik, Koçluk vb.) eşleştirecek ikinci saat olmadığından tek kalır.

**Sebep:** Türk okul programlarının yaygın deseni (resmi `aSc Ders Dağıtım` çıktısı da böyle): dersler ikişer saat bloklanır. BR-TT-014 (günde ≤2) ile birlikte: 4 saatlik ders → 2 gün × 2'şer; 3 saatlik → 1 blok + 1 tek.

**Uygulama:**
- Backend: `GreedySolver` slot sırasını, aynı dersin mevcut bir saatinin komşusu olan slotları **kararlı** biçimde öne alarak yeniden sıralar (strateji içi sıra korunur). **Yumuşak** — zorlamaz, eksik saat üretmez. `SolverWeights.PreferBlockPairing` (varsayılan `true`).
- Frontend: Sihirbazda "Dersleri 2'şer saat blok diz" toggle'ı (varsayılan açık).

**Edge case'ler:**
- 1 saatlik dersler tek kalır (doğal).
- Günde ≤2 limiti (BR-TT-014) blok boyunu 2 ile sınırlar (3'lü blok oluşmaz).

**Test referansı:** `GreedySolverTests.Pairing_forms_consecutive_doubles_even_with_a_spreading_order`

---

### BR-TT-AG-1: Otomatik Üretim Katı Kısıtları (HARD)

**Kural:** Otomatik üretim solver'ı (`IScheduleSolver`) bir adayı üretirken katı kısıtları (`SlotFeasibility`) ihlal edemez: aynı slotta sınıf/öğretmen/derslik tekilliği. Öğretmen müsaitliği bu dilimde **no-op** (Faz 4 girdisi — Debt-AG-1) → müsaitlik henüz kısıt değildir.

**Sebep:** Üretilen aday taslağa uygulandığında write-time hard guard + DB filtreli unique index'ten geçecektir; solver bu kısıtları baştan sayarak çakışmasız aday üretir.

**Uygulama:**
- Backend: `GreedySolver` her talep için yalnız `SlotFeasibility`'nin uygun bulduğu slotlara yerleştirir; ders talepleri görevlendirmelerden (`ITeachingAssignmentSource`), slotlar zil periyot sayısından, dış doluluk çapraz-program sorgusundan gelir.

---

### BR-TT-AG-2: Otomatik Üretim Sınıf-Bazlı & Sıfırdan (HARD — REVİZE 2026-06-16, K6)

**Kural:** Otomatik üretim bir programa değil, bir **sınıfa (şube) + döneme** bağlı çalışır ve **sıfırdan**
üretir. Tetiklemek için o sınıfın aktif dönemde **görevlendirmesi olmalı** (yoksa anlamlı hata).

**Sebep:** Doğru model autogen'i mevcut bir Taslak/Revize programa uygulamak yerine sıfırdan üretip sonucu
**yeni bir Taslak** olarak kaydetmektir; bu yüzden "program düzenlenebilir mi" kontrolü anlamsızlaştı.

**Uygulama:**
- Backend: `EnqueueAutoGenerateCommand` `{ branchId, academicYearId, academicTermId, ... }` alır; eski
  "program Draft/Revising mi / Published değil mi" kontrolü kaldırıldı, yerine görevlendirme varlığı doğrulanır.

> **Eski kural (geçersiz):** Bir önceki sürüm "otomatik üretim yalnız Draft/Revising program için; Published
> reddedilir (409)" diyordu — autogen mevcut programa uygulanıyordu. Bu, sınıf-bazlı sıfırdan üretim
> modelinde geçersizdir.

---

### BR-TT-AG-3: Üret ≠ Uygula → Yeni Taslak (HARD — REVİZE 2026-06-16, K6)

**Kural:** Otomatik üretim aday üretir; adayın yazılması ayrı bir `apply` adımıdır. Apply, seçilen adayı
mevcut bir programa yazmaz; job'un branch+term'i için `ScheduleProgram.Create` + adayın yerleşimleriyle
**yeni bir Taslak `ScheduleProgram`** oluşturur ve **yeni programId** döner; **yayın değildir** — admin
sonra ince-ayar yapıp ayrıca yayınlar.

**Sebep:** Otomatik üretimin sonucu öneridir; admin onayı + ince-ayar + bilinçli yayın akışı korunur.
Mevcut programa dokunmamak, çok-taslak modeliyle uyumludur.

**Uygulama:**
- Backend: `ApplyAutoGenerateDraftsCommand(jobId, branchIds[], candidateId?)` → branch-başına yeni Taslak
  `Create` + `StampGeneratedFrom` (REVİZE 2026-06-17, K-D2 — bkz. BR-TT-AG-6); çapraz çakışma DB filtreli
  unique index ile 409 (yalnız diğer canlı programlara karşı — K8). Bloklar kapalı (Debt-AG-8).
- Frontend: `AutoGenDrawer` "Editörde Aç" → apply([branch]) → dönen yeni programId ile editöre yönlendirir;
  bulk "Tümünü/Seçilenleri Kaydet" → apply(branchIds); yayın ayrı `PublishDrawer` akışı.

---

### BR-TT-AG-4: Katı Mod Çözümsüzlüğü (HARD davranış)

**Kural:** Katı mod (strict) açıkken solver en iyi adayı hâlâ eksik bırakıyorsa (yerleşmemiş talep kalıyorsa) sonuç `NoSolution` + `RelaxationHints` döner; eksik aday taslağa zorla uygulanmaz.

**Sebep:** Katı modda kullanıcı tam çözüm ister; kısmi/eksik çözüm yerine gevşetme ipuçları sunmak daha dürüst.

**Uygulama:**
- Backend: `ScheduleSolver` adayları (MissingHours artan, Score azalan) sıralar; katı modda en iyi hâlâ eksikse NoSolution + hints üretir.
- Frontend: `AutoGenDrawer` çözüm-yok durumunda ipuçlarını gösterir.

---

### BR-TT-AG-5: Joint Çok-Sınıf Çakışma (HARD — 2026-06-17, K-D2-1)

**Kural:** Otomatik üretim kapsamı birden çok sınıf içerdiğinde (Kademe/Tümü) tüm kapsam sınıfları **tek
koordineli (joint) açgözlü geçişte birlikte** çözülür. Öğretmen ve derslik **paylaşılan kaynaktır** ve
doluluk **global** tutulur: aynı öğretmen/derslik aynı slotta iki farklı kapsam-sınıfında kullanılamaz
(çapraz çakışma engellenir). Sınıf-slot tekilliği, günlük-aynı-ders (BR-TT-014), blok-komşuluğu (BR-TT-015)
ve ev-dersliği ise **sınıf-bazlı** (`BranchId`) tutulur. **Tek sınıf = N=1 özel hâlidir** (regresyon korunur).

**Sebep:** Sınıfları bağımsız üretmek devasa çapraz çakışma yaratır; sıralı/birikimli üretim sıra önyargısı
doğurur. Joint çözüm en iyi global kaliteyi verir ve çapraz öğretmen/derslik tekilliğini global garanti eder.

**Uygulama:**
- Backend: `GreedyState`/`FeasibilityContext` branch-keyed (`ClassOccupied`/`DailySubjectCount`/`ClassSubjectAt`/
  ev-dersliği `(BranchId, …)`), `TeacherOccupied`/`RoomOccupied` global; MRV tüm sınıfların talepleri arasında
  ortak çalışır. **Dış doluluk** = yalnız kapsam **dışındaki** sınıfların rezerve eden (canlı) yerleşimleri —
  kapsam içi sınıflar joint çözümle birbirini global occupancy ile zaten dışlar (K8/K12). Puanlama
  `CandidateScorer.ScorePerClass` (per-class metrik) + aggregate sıralama (`Σ MissingHours`, ağırlıklı skor).
- Frontend: `AutoGenDrawer` kapsam seçici (Tek sınıf/Kademe/Tümü); bulk sonuç per-class satır (çakışma/eksik rozet).

---

### BR-TT-AG-6: Seçmeli/Toplu Apply + Idempotency (HARD davranış — 2026-06-17, K-D2-3/K-D2-4)

**Kural:** Bulk üretim sonucundan apply **branch-başına** yapılır: kullanıcı bir satırı "Editörde Aç"
(tek branch), "Tümünü Kaydet" (tüm branch'ler) veya "Seçilenleri Kaydet" (checkbox seçili branch'ler) ile
uygular. Her uygulanan branch için job'un en iyi (önerilen) adayındaki o sınıfın yerleşim dilimi → **yeni
Taslak `ScheduleProgram`** olur, `GeneratedFromJobId = jobId` ile damgalanır. **İdempotent:** bir
`(GeneratedFromJobId == jobId, BranchId)` için zaten Taslak varsa yeniden yaratılmaz, mevcut programId döner
(çift tıklama / "Aç" sonra "Tümünü Kaydet" çift taslak üretmez). Tüm branch'ler **tek transaction** içinde
atomik. **Bulk modda sınıf-başına aday seçimi yoktur** (joint çözüm sınıfları bağlar — K-D2-5); tek sınıf
modunda A/B/C aday seçimi (`candidateId`) korunur.

**Sebep:** Joint en iyi global aday sınıfları birbirine bağlar; her sınıf bağımsız strateji seçemez. Damga,
admin-tıklama UX'inde güvenli tekrar (idempotent) sağlar (DB-unique değil, app-level — bu UX için yeterli).

**Uygulama:**
- Backend: `ApplyAutoGenerateDraftsCommand(JobId, BranchIds[], CandidateId?)` → `IReadOnlyList<AppliedDraftDto>`
  (`{BranchId, ProgramId}`); `ScheduleProgram.StampGeneratedFrom` + `IScheduleProgramStatsRecomputer`; izin
  `timetable.manage`; çapraz çakışma DB filtreli unique index → 409 (yalnız diğer canlı programlara karşı, K8).
- Frontend: bulk footer "Tümünü Kaydet"/"Seçilenleri Kaydet" + satır "Aç"; başarı banner'ı; Hub listesi
  kaydetmede invalidate edilir.

---

### BR-TT-PM-1: Tek Canlı + Çok Taslak Program (HARD — 2026-06-16, K1/K9)

**Kural:** Bir sınıf+dönem için en fazla **bir canlı** (Yayında *veya* Revize) program olabilir; yanında
**sınırsız Taslak** program bulunabilir. Eski "sınıf+dönem başına tek program" kuralı revize edildi.

**Sebep:** Çok-taslak modeli (alternatif senaryolar, autogen çıktıları) gerekiyordu; tek-canlı kısıtı
tüketici tarafında belirsizliği önler.

**Uygulama:**
- Backend: `CreateProgramCommandHandler`'dan `program-exists` reddi **kaldırıldı** ("Yeni Program" her zaman
  yeni Taslak yaratır). Tek-canlı garantisi filtreli DB unique index (`status >= 1`) + publish-swap ile.
- DB: `ux_schedule_programs_class_term WHERE status >= 1 AND is_deleted = 0` (bkz. `database-schema.md`).

---

### BR-TT-PM-2: Publish-Swap (HARD — 2026-06-16, K3/K10)

**Kural:** Bir Taslak yayınlanırken aynı (dönem, sınıf) için zaten **canlı** (Yayında *veya* Revize) bir
kardeş program varsa, kullanıcıya swap-uyarısı gösterilir; onaylanırsa **engellenmeden**, tek transaction
içinde önce o kardeş **Taslağa indirilir** (`RevertToDraft()` — silinmez), sonra bu program yayınlanır.

**Sebep:** "İkinci program yaratma" reddi yayınlamaya taşındı (K2); tek-canlı kuralı yayın anında swap ile
zorlanır, eski çalışma kaybedilmez.

**Uygulama:**
- Backend: `PublishProgramCommandHandler` kardeş predicate'i `Status ∈ {Published, Revising}`; MediatR
  `TransactionBehavior` ile atomik. `GetPublishPreviewQueryHandler` `replacedPublishedProgramId/Version` döner.
- **Re-publish sürüm türetimi:** Yayın sürümü programın kendi `ScheduleVersion` geçmişinden (max+1) alınır →
  demote edilmiş bir program yeniden yayınlanırken sürüm çakışmaz.
- Frontend: `PublishDrawer` swap-uyarısı + onay adımı (onaysız yayınlamaz, onaylı engellemez).

---

### BR-TT-PM-3: Rezervasyon Yalnız Canlı Programa (HARD — 2026-06-16, K8/K12)

**Kural:** Öğretmen/derslik/sınıf-slot tekilliği yalnız **rezerve eden** yerleşimlere uygulanır: sahibi
programın `Status ∈ {Published, Revising}` (canlı) olduğu yerleşimler (`is_reserving=1`). **Taslaklar rezerve
etmez ve serbestçe çakışır.** Bir taslak kendi sınıfının canlı programıyla çakışmaz — yalnız **diğer
şubelerin** canlı programlarıyla çakışabilir.

**Sebep:** Çok-taslak modelinde aynı sınıfın iki dolu programı (canlı + taslak) bir arada var olmalı; eski
program-bağımsız unique index'ler bunu imkânsız kılıyordu. Yayınlanınca swap eski canlıyı boşaltacağı için
kendi sınıfının canlısıyla çakışma sayılmaz.

**Uygulama:**
- DB: `lesson_placements.is_reserving` denormalize bayrağı; üç yerleşim unique index filtresi
  `... AND is_reserving = 1`. Program canlıya girince/çıkınca aggregate içinde senkronlanır.
- Çakışma yayında/yayınlamada ve doluluk ön-kontrolünde (`is_reserving=1 AND branch_id != X`) yüzeye çıkar.

---

### BR-TT-PM-4: İlk Düzenlemede Published → Revising (HARD davranış — 2026-06-16, K11)

**Kural:** Yayındaki (`Published`) bir programa yapılan **ilk düzenleme kaydedildiğinde** program
`Published → Revising`'e geçer. Salt görüntüleme Revize'ye geçirmez. Canlı yayın snapshot'ı
(`ScheduleVersion`) swap'e/yeniden-yayına kadar tüketicilere bozulmadan kalır.

**Sebep:** Yayındaki program üzerinde çalışmaya başlandığını işaretlemek; tüketici kaynağı (snapshot)
korunurken çalışma kopyası ayrışır. Rezervasyon değişmez (her iki durum da rezerve eder).

**Uygulama:**
- Backend: Yalnız düzenleme komutları (Move/Place/Remove/AssignTeacher/AssignRoom/SetBlock) bir Published
  programda çalışınca durumu Revising'e çevirir. (Diğer mevcut tetik: `RestoreScheduleVersion` → Revising.)

---

---

### BR-TT-AV-1: Öğretmen Müsaitliği — Üç Durum (2026-06-17, Faz 4/Dilim-1)

**Kural:** Bir öğretmenin bir dönemdeki her (gün, periyot) slotu üç durumdan birindedir:
- **Available (0):** Müsait (varsayılan; DB'de saklanmaz — seyrek depolama).
- **PrefersNot (1):** Tercih etmiyor — SOFT. Solver düşük puan verir; editörde uyarı; yerleşim **engellenmez**.
- **Unavailable (2):** Müsait değil — HARD. Solver bu slota yerleştirmez; editörde hata; yerleşim **engellenir** (override olmadan).

**Sebep:** Türk devlet okullarında öğretmen saatlik engel genel; özel okullarda tercih önemi yüksek. Üç durum solver kalite + editör gerçekliğini birlikte kapsar.

**Uygulama:**
- Backend: `TeacherAvailability` aggregate + `AvailabilitySlot` owned entity; `IAvailabilityProvider` → `TeacherAvailabilityProvider` (DB'den okur). `SlotFeasibility.CanPlace` `Unavailable` → hard red; `PrefersNot` → `RespectTeacherPreference` soft bileşeni (ağırlıklı puan düşüşü).
- Editör: `PlaceLesson`/`MoveLesson` `Unavailable` slotta `AllowUnavailable=false` → `timetable.errors.teacher-unavailable` (409 benzeri); öğretmen tercih uyarısı ayrı.
- Hub denormalize: `schedule_programs.availability_violation_count` ihlal sayısını yansıtır (`IScheduleProgramStatsRecomputer`).

---

### BR-TT-AV-2: Hard-Block Override (2026-06-17)

**Kural:** `Unavailable` slota yerleşim, **admin kararı** ile `AllowUnavailable=true` bayrağı geçilerek **override edilebilir**. Bu bayrağı set etmek `timetable.override` iznini gerektirir. Override edilmiş yerleşimler ihlal sayacına (`availability_violation_count`) yansır ve otomatik üretimde görmezden gelinmez.

**Sebep:** Öğretmen hastalık/geçici durum; acil vekalet; idari zorunluluk. Sistemin hard blok'u aşması için yetkili admin kararı gerekir.

**Uygulama:**
- Backend: `PlaceLessonCommandHandler`/`MoveLessonCommandHandler` `AllowUnavailable=true` + `timetable.override` permission check → ihlali izin verir, sayaca ekler.
- Yayın: Müsaitlik ihlalleri yayını **bloklamaz** (publish gate değil). Editörde uyarı rozeti gösterilir.

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| Sezon ortası akademik dönem değişimi (1. → 2. dönem) | Eski dönem `Status = Archived` toplu, yeni dönem için yeni Draft set başlatılır. UI sihirbazı yönlendirir. |
| Pilot okulun sezonu yıl içinde başlamış (geç başlangıç) | `EffectiveFrom` `academic_term.start_date`'ten ileri olabilir; geçmiş bölüm "boş" kabul edilir. |
| Tatil günü Override (örn. tatilde özel etkinlik dersi) | Engellenir — tatil günü BR-TT-004 ile zaten ihlal. Önce tatil günü `school-settings.holidays`'tan kaldırılmalı veya Faz 2 etkinlik modülü. |
| Yarım gün tatil | MVP'de yok; ya tüm gün tatil ya değil. Faz 2'de saatlik tatil önerilir. |
| Öğretmenin işten ayrılması | `Teacher.Status = Left` set edilir; aktif Schedule'lar otomatik kalır. Akademik koordinatör manuel `Supersede` veya `Override(Substitution)` yapar — sistem alarm verir ("3 aktif Schedule'ı olan öğretmen ayrıldı"). |
| Yeni dersliğin sonradan açılması | `Room.Create` → mevcut Schedule'lar otomatik etkilenmez. Akademik koordinatör manuel reatama. |
| KVKK silme talebi → öğrencinin Schedule görüntüleri | Schedule kişisel veri değil (şube bazlı). Öğrencinin User'ı silinse de Schedule etkilenmez. Yoklama detayları başka modülün KVKK kapsamında. |
| İki SchoolAdmin aynı anda Publish basıyor | İlk commit kazanır, ikinci 412 Precondition Failed (RowVersion concurrency); "Lütfen sayfayı yenileyin" mesajı. |

---

### BR-TT-DAY-1: Gün Konvansiyonu — Gerçek System.DayOfWeek (HARD)

**Kural:** Tüm program ve nöbet `Day` alanları (`TimeSlot`, `LessonPlacement`, `DutyAssignment`, `AvailabilitySlot`, `ScheduleException`) **gerçek `System.DayOfWeek`** değerleri tutar: Pazartesi=1, Salı=2, Çarşamba=3, Perşembe=4, Cuma=5. Sistem yalnız hafta içi (1–5) destekler; Cmt=6 / Paz=0 program/nöbet gününe atanamaz. Tip `DayOfWeek` olarak kalır; `(DayOfWeek)request.Day` cast'i FE 1-tabanlı değer gönderdiği için semantik doğrudur.

**Görüntü:** Takvim/ızgara Pazartesi-ilk gösterir (sayısal değer 1 ise de ilk sütun Pazartesi). `dayShort[day-1]` / `dayLong[day-1]` indekslemesi kullanılır.

**Sebep:** Gerçek tarih–gün karşılaştırmaları (`date.DayOfWeek == placement.Day`) herhangi bir dönüşüm yardımcısı olmadan doğal doğru çalışır; 0-tabanlı saklama ile gerçek `date.DayOfWeek` (Pzt=1) karşılaştırıldığında doğan off-by-one sınıfını yapısal olarak ortadan kaldırır. Spec §106 `TimeSlot = (DayOfWeek Day, int Period)` zaten `DayOfWeek` yazar; 0-tabanlı hack spec niyetinden sapmaktı.

**Uygulama:**
- BE: `(DayOfWeek)request.Day` cast doğal doğru (FE Pzt=1 gönderir). Validasyon: 1–5 dışı ret. Solver: `[DayOfWeek.Monday..Friday]` (=1..5).
- FE: `EDITOR_DAYS`/`DUTY_DAYS` = `[1,2,3,4,5]`; gün dizisi `dayShort[day-1]` ile erişilir; `useDutyContext.today` = JS `getDay()` (Paz=0…Cmt=6, Pzt=1 zaten System ile aynı).
- DB: `lesson_placements.day`, `duty_assignments.day_of_week`, `schedule_exceptions.day`, `teacher_availability_slots.day_of_week` + `schedule_versions` snapshot JSON `Day` değerleri +1 migration ile kaydırıldı (EF migration `<ts>_align_day_to_system_dayofweek`).

**Tarihçe:** 2026-06-20 — 0-tabanlı (Pzt=0…Cum=4) konvansiyondan hizalandı. Önceki `9d74f5b` 0-tabanlı WorkingDays interim fix'i bu migration ile yerini aldı.

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-05-15 | İlk modül iskeleti oluşturuldu | Sprint 2 başlangıç planlaması |
| 2026-05-26 | BR-TT-001 ile BR-TT-013 tanımlandı (13 kural) | İhtiyaç analizi sonrası kural setinin formalize edilmesi |
| 2026-05-26 | Temporal versiyonlama kararı | Yoklama referans bütünlüğünü korumak için Schedule satırı silinmez/yeniden yazılmaz, supersede edilir |
| 2026-05-26 | `Rooms` tablosu MVP'ye eklendi | `ClassroomName` string sapması ve derslik çakışma kontrolü için |
| 2026-06-15 | BR-TT-AG-1..4 (otomatik üretim) tanımlandı | Faz 3 Dilim-1 tek-sınıf otomatik program üretimi (solver + üret≠uygula + katı mod) |
| 2026-06-16 | BR-TT-PM-1..4 + BR-TT-AG-2/3 revize | Çok-taslak modeli (K1/K9), publish-swap (K3/K10), rezervasyon yalnız canlı (K8/K12), ilk düzenleme→Revize (K11), autogen sınıf-bazlı sıfırdan + yeni Taslak (K5/K6). Tasarım: `ders-programi-cok-taslak-otomatik-uretim-design.md` |
| 2026-06-17 | BR-TT-AG-5/6 eklendi + BR-TT-AG-3 revize | Faz 3 Dilim-2 çok-sınıf: joint solver çapraz öğretmen/derslik tekilliği (K-D2-1), seçmeli/toplu apply + GeneratedFromJobId idempotency (K-D2-3/4). Tasarım: `ders-programi-cok-sinif-otomatik-uretim-design.md` |
| 2026-06-17 | BR-TT-AV-1/2 eklendi | Faz 4/Dilim-1 müsaitlik & tercih: üç durum (Available/PrefersNot/Unavailable), hard-block (Unavailable) vs soft (PrefersNot), admin override `timetable.override`. **Debt-AG-1 kapandı.** |
| 2026-06-19 | INV-D1..D5 + BR-D kuralları eklendi | Faz 4/Dilim 2a Nöbet Çizelgesi backend tamamlandı. |
| 2026-06-19 | K-2b-1..7 + BR-Vek kuralları eklendi | Faz 4/Dilim 2b Vekâlet backend tamamlandı: ad-hoc devamsızlık entity yok, ScheduleException yeniden kullanımı, BranchFit (Subject.Category), vekil-vekil dışlama (K-2b-6), published-only board, teacher view salt-okunur, revoke 409. |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.

---

## Nöbet Çizelgesi Kuralları (Faz 4/Dilim 2a)

### INV-D1: Muaf Öğretmene Nöbet Atanamaz (HARD)

**Kural:** `DutyExemption.CoversDay(today)` true olan öğretmene çizelge ataması yapılamaz.

**Uygulama:**
- Domain: `DutyRoster.Assign(teacherId, ..., exemptTeacherIdsForWeek)` — INV-D1 domain seviyesinde fırlatır (`DutyDomainException: duties.errors.teacher-exempt`).
- Application: `SaveDutyRosterDraftCommandHandler` dönemin tüm aktif muafiyetlerini yükleyip `IReadOnlySet<Guid>` olarak iletir.
- Read model: `GetDutyRosterForEditQueryHandler` atama dönüşünde `conflict="duties.conflict.teacher-exempt"` alanı doldurur (mevcut atamanın geçerliliğini gösterir).

**Kural tipi:** HARD — domain exception → 422 Unprocessable Entity (ExceptionHandlingMiddleware DomainException kolu).

---

### INV-D2: Aynı Öğretmen Aynı Güne İkinci Nöbet Alamaz (HARD)

**Kural:** Bir öğretmen aynı `(roster, day)` kombinasyonunda en fazla bir kez nöbetçi atanabilir.

**Uygulama:**
- Domain: `DutyRoster.Assign` — `_assignments.Any(a => a.TeacherId == teacherId && a.Day == day)` kontrolü → `duties.errors.teacher-day-duplicate`.
- DB backstop: `ux_duty_assignment_teacher_cell (school_id, academic_term_id, duty_roster_id, day_of_week, location_id, teacher_id)` filtreli unique index.

**Kural tipi:** HARD.

---

### INV-D3: Bölge Kapasitesi Aşılamaz (HARD)

**Kural:** Bir nöbet bölgesinde `(roster, day)` için aktif atama sayısı `DutyLocation.Capacity`'yi geçemez. Kapasite 1–4 arasındadır (K-2a-3 binding decision).

**Uygulama:**
- Domain: `DutyRoster.Assign` — `_assignments.Count(a => a.Day == day && a.LocationId == locationId) >= locationCapacity` kontrolü → `duties.errors.location-capacity-full`.
- Not: Filtreli unique index `ux_duty_assignment_teacher_cell` öğretmen başına tek kayıt garantisi verir; kapasite sayısı aggregate içinde kontrol edilir.

**Kural tipi:** HARD.

---

### INV-D4: Yancı, Nöbetçinin Kendisi Olamaz (HARD)

**Kural:** `AssignReliever(assignmentId, relieverId)` çağrısında `relieverId == assignment.TeacherId` olamaz. Ayrıca yancı adayı aynı günde başka nöbetçi veya yancı olamaz.

**Uygulama:**
- Domain: `DutyRoster.AssignReliever` — iki kontrol:
  1. `a.TeacherId == relieverId` → `duties.errors.reliever-same-as-teacher`.
  2. `_assignments.Any(x => x.Id != a.Id && x.Day == a.Day && (x.TeacherId == relieverId || x.RelieverId == relieverId))` → `duties.errors.reliever-already-busy`.

**Kural tipi:** HARD.

---

### INV-D5: Çizelge Taslak Değilse Düzenlenemez (HARD)

**Kural:** `DutyRoster.Assign`, `RemoveAssignment`, `AssignReliever`, `ClearReliever` yalnız `Status == Draft` rosters üzerinde çalışır. Published/Superseded roster değiştirilemez — yeni taslak sürüm oluşturulmalıdır (`Supersede()` ile).

**Uygulama:**
- Domain: `EnsureDraft()` metodu her mutasyon başında fırlatır → `duties.errors.roster-not-draft`.

**Kural tipi:** HARD.

---

### BR-D-TEMPORAL-1: Temporal Versiyonlama — Canlı Sürümü Süperse Et (HARD)

**Kural:** Bir dönemin yeni çizelgesi yayınlandığında, o dönemde zaten `Published` + `EffectiveTo IS NULL` olan mevcut çizelge otomatik olarak `Superseded` + `EffectiveTo = effectiveFrom` yapılır. İki çizelge aynı anda "canlı" (Published + açık) olamaz. (`ux_duty_roster_live` filtreli unique index DB-seviye garanti verir.)

**Uygulama:**
- Application: `PublishDutyRosterCommandHandler` önce mevcut canlı roster'ı sorgular; varsa `CloseAsOf(effectiveFrom)` ile kapatır, sonra bu roster'ı `Publish()` eder. Atomik transaction içinde.
- DB backstop: `ux_duty_roster_live (school_id, academic_term_id) WHERE status = 1 AND effective_to IS NULL AND is_deleted = 0`.

**Kural tipi:** HARD.

---

### BR-D-CONFLICT-1: Çakışma = Öğretmen Muaf Read Model Kuralı (SOFT/BİLGİ)

**Kural:** `GetDutyRosterForEdit` handler'ında: eğer bir atamanın öğretmeni o dönemde muafsa, `DutyAssignmentDto.conflict = "duties.conflict.teacher-exempt"` dolu gelir. Bu atama çizelgede var ama muafiyet sonradan eklenmiş veya çakışıyor. UI uyarı gösterebilir.

**Uygulama:** Handler `exemptSet.Contains(a.TeacherId) ? "duties.conflict.teacher-exempt" : null` kontrolü yapar.

**Kural tipi:** SOFT (bilgi amaçlı — yazma engellemez; mevcut veri için uyarı).

---

### BR-D-RELIEVER-1: Yancı Adayı Eligibility Kuralı

**Kural:** `GetAvailableRelieversQuery` yancı adayını şöyle tanımlar:
- Dönemde `Permanent` muafiyeti **olmayan** öğretmen.
- Sorgulanılan `(day, locationId)` kombinasyonunda zaten nöbetçi veya yancı **olmayan** öğretmen.

**K-2a-2 (bağlayıcı karar):** Müsaitlik (Faz 4/Dilim 1) slot bilgisi yancı adayı hesabına girdi değildir. `Unavailable` slotu olan ama o günde başka nöbet/yancı görevi olmayan öğretmen aday listesine dahil edilir.

**Debt:** Geçici muafiyet (`Temporary`) olan öğretmen yancı adayı olabilir — yalnız Permanent muafiyeti dışlanır. Bu BR-12 weekly-template kararıyla tutarlı. Geçici-muaf-bugün kontrolü ertelendi.

**Kural tipi:** SOFT kılavuz (application layer yancı listesini filtreler; kullanıcı listedekini seçer, domain INV-D4 son kontrol).

---

## Vekâlet Kuralları (Faz 4/Dilim 2b)

> Vekâlet = öğretmen devamsızlığında o ders için başka bir öğretmenin atanması veya dersin "serbest ders" yapılması.
> Uygulama altyapısı: `ScheduleException` aggregate (Dilim 2a atyapısı) yeniden kullanılır.

---

### K-2b-1: Ad-Hoc Devamsızlık — Entity Yok (ONAYLANDI: kullanıcı 2026-06-19)

**Kural:** Öğretmen devamsızlığı için bağımsız bir entity (örn. `TeacherAbsence` tablosu) tutulmaz. Admin "yok öğretmen + sebep" seçer; yalnız sonuçlanan `ScheduleException` kayıtları kalıcıdır. Vekil panosu (`SubstitutionBoardDto`) mevcut Published||Revising programdaki yerleşimleri temel alarak oluşturulur — devamsız öğretmen filtresinde daraltılır.

**Kural tipi:** DESIGN (sapma kaydı var — bkz. completion_status.md ⚠️ K-2b-1).

---

### K-2b-1/K0.6: Published-Only Board ve Vekil Sorgusu (HARD)

**Kural:** Vekâlet panosu (`GetTodaysSubstitutionBoard`) ve vekil aday listesi (`GetAvailableSubstitutes`) yalnız `Published` veya `Revising` statüsündeki programları sorgular. Taslak programlar dahil edilmez.

**Uygulama:** Query handler'lar `Status == Published || Status == Revising` filtresi uygular.

**Kural tipi:** HARD.

---

### K-2b-2/K-2b-3: ScheduleException Yeniden Kullanımı (ONAYLANDI)

**Kural:** Vekâlet komutları (`CreateSubstitution`, `MarkStudyHall`, `RevokeSubstitution`) ayrı aggregate yerine `ScheduleException` entity'sini kullanır:
- `CreateSubstitution` → `ScheduleException` type `TeacherSubstitution`.
- `MarkStudyHall` → `ScheduleException` type `Cancellation` (reason="study-hall").
- `RevokeSubstitution` → mevcut exception'ı soft-revoke eder.

Bu komutlar `duties.substitute` kapısı altında çalışır (timetable.override komutlarından bağımsız endpoint).

**Kural tipi:** DESIGN.

---

### K-2b-4: BranchFit Hesabı (Subject.Category Üzerinden)

**Kural:** Vekil adayının branş uygunluğu (`BranchFit`) `Subject.Category` karşılaştırmasıyla belirlenir:
- `Same` (2): Vekil öğretmenin uzmanlık kategori alanı, dersin kategorisiyle tam eşleşiyor.
- `Near` (1): Kategori-ailesi eşleşmesi (örn. aynı fen grubu veya sosyal bilimler grubu).
- `Different` (0): Hiçbir eşleşme yok.

Yeni seed/config gerekmez. `GetAvailableSubstitutes` sorgusu `SubstituteCandidateDto { branchFit }` ile döner; UI sıralarken BranchFit'i önceliklendirir.

**Uyarı (Debt-BE-Vek-1):** `Subject.Category` `GetValueOrDefault` → Language fallback yanlış pozitif farklılık üretebilir; explicit Different-tier test assertion eksik.

**Kural tipi:** SOFT kılavuz (BranchFit; admin üzerine yazabilir).

---

### K-2b-6: Vekil-Vekil Dışlama (HARD)

**Kural:** Bir öğretmen aynı gün ve period'da zaten başka bir derse vekil atanmışsa ikinci vekil ataması kabul edilmez.

**Uygulama:**
- `GetAvailableSubstitutes`: Sorgulanan `(programId, placementId, date)` için öğretmenin o gün+period'da yapısal veya mevcut vekil ataması olup olmadığı kontrol edilir (KD-vekil-vekil filtresi).
- `CreateSubstitution` validator: İkinci kez aynı kontrol yapılır (vekil listesi ile create arası yarış koruması).

**Kural tipi:** HARD.

---

### K-2b-7: Öğretmen Görünümü Salt-Okunur (Ertelendi)

**Kural:** Öğretmen itiraz/onay akışı (`schedule_requests` diliminde) ertelendi. 2b kapsamında öğretmen yalnız kendi vekâlet atamalarını görebilir (`GetMySubstitutions`), itiraz/ret edememektedir.

**Kural tipi:** DESIGN (erteleme kararı).

---

### BR-Vek-REVOKE-1: Zaten-Revoked → 409 (NotFound Değil)

**Kural:** `RevokeSubstitution` zaten revoke edilmiş bir exception üzerinde çağrılırsa 409 Conflict döner (404 değil). Bu `RevokeScheduleException` (timetable.override) davranışıyla tutarlıdır.

**Kural tipi:** HARD.
