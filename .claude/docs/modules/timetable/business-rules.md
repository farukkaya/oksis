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
- Backend: `ApplyAutoGenerateDraftCommand(jobId, candidateId)` → yeni Taslak `Create`; çapraz çakışma DB
  filtreli unique index ile 409 (yalnız diğer canlı programlara karşı — K8). Dilim 1'de bloklar kapalı.
- Frontend: `AutoGenDrawer` "Editörde Aç" → apply → dönen yeni programId ile editöre yönlendirir; yayın ayrı
  `PublishDrawer` akışı.

---

### BR-TT-AG-4: Katı Mod Çözümsüzlüğü (HARD davranış)

**Kural:** Katı mod (strict) açıkken solver en iyi adayı hâlâ eksik bırakıyorsa (yerleşmemiş talep kalıyorsa) sonuç `NoSolution` + `RelaxationHints` döner; eksik aday taslağa zorla uygulanmaz.

**Sebep:** Katı modda kullanıcı tam çözüm ister; kısmi/eksik çözüm yerine gevşetme ipuçları sunmak daha dürüst.

**Uygulama:**
- Backend: `ScheduleSolver` adayları (MissingHours artan, Score azalan) sıralar; katı modda en iyi hâlâ eksikse NoSolution + hints üretir.
- Frontend: `AutoGenDrawer` çözüm-yok durumunda ipuçlarını gösterir.

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

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-05-15 | İlk modül iskeleti oluşturuldu | Sprint 2 başlangıç planlaması |
| 2026-05-26 | BR-TT-001 ile BR-TT-013 tanımlandı (13 kural) | İhtiyaç analizi sonrası kural setinin formalize edilmesi |
| 2026-05-26 | Temporal versiyonlama kararı | Yoklama referans bütünlüğünü korumak için Schedule satırı silinmez/yeniden yazılmaz, supersede edilir |
| 2026-05-26 | `Rooms` tablosu MVP'ye eklendi | `ClassroomName` string sapması ve derslik çakışma kontrolü için |
| 2026-06-15 | BR-TT-AG-1..4 (otomatik üretim) tanımlandı | Faz 3 Dilim-1 tek-sınıf otomatik program üretimi (solver + üret≠uygula + katı mod) |
| 2026-06-16 | BR-TT-PM-1..4 + BR-TT-AG-2/3 revize | Çok-taslak modeli (K1/K9), publish-swap (K3/K10), rezervasyon yalnız canlı (K8/K12), ilk düzenleme→Revize (K11), autogen sınıf-bazlı sıfırdan + yeni Taslak (K5/K6). Tasarım: `ders-programi-cok-taslak-otomatik-uretim-design.md` |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
