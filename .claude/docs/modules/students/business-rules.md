# Öğrenci — Business Rules

> Bu modüle özel iş kuralları. Yazılım dünyasından gelen genel kurallar değil — **OKSİS'te Öğrenci için spesifik** kararlar.

> Genel iş kuralları için bkz. proje kökündeki `business-rules.md`.

---

## Kurallar

### BR-students-001: Öğrencinin güncel şubesi tek doğruluk kaynağından türetilir

**Kural:** Bir öğrencinin "güncel şubesi"nin **tek doğruluk kaynağı (single source of
truth)** `academic.class_room_students` atama defteridir. Aktif atama, `left_at IS NULL`
olan satırdır (unique index gereği bir öğrencide en fazla 1 aktif satır olabilir).
`StudentProfile.CurrentClassroomId` (`[identity].profiles.current_classroom_id`) bu
defterden **türetilen denormalize bir ayna alandır** — okuma kolaylığı için tutulur,
ayrı bir yazım kaynağı değildir.

**Sebep:** İki ayrı yere (defter + ayna alan) elle yazıldığında zamanla **drift**
(tutarsızlık) oluşuyordu. Tek bir mekanizmaya indirgeyerek drift'i yapısal olarak
imkânsız kılmak gerekti.

**Uygulama:**
- Backend: `CurrentClassroomId` artık komut handler'larında **manuel senkronlanmaz**.
  `StudentClassroomSyncInterceptor` (EF Core `SaveChangesInterceptor`) defter her
  değiştiğinde (atama/transfer/çıkarma komutları **veya** doğrudan `ClassRoomStudent`
  ekleyen seeder gibi yan yollar) ilgili öğrencinin aktif atama satırından
  `current_classroom_id`'yi **aynı transaction içinde** set eder (aktif atama yoksa
  `null`). Tek mekanizma olduğu için iki-yazım drift'i imkânsızdır.
- Frontend: Yalnızca okur (örn. veli child-switcher'da çocuğun güncel şubesi); yazmaz.
- DB: `current_classroom_id` denormalize ayna kolon; otoritesi `class_room_students`'tır.

**Edge case'ler:**
- Öğrencinin aktif ataması yoksa (hiç atanmamış / şubeden çıkarılmış) → `CurrentClassroomId = null`.
- Doğrudan `ClassRoomStudent` ekleyen seeder/yan yollar da interceptor'ı tetikler →
  ayna alan handler dışı değişimlerde bile tutarlı kalır.

**Test referansı:** `StudentClassroomSyncInterceptor` (Infrastructure.IntegrationTests fixture'ında kayıtlı)

---

### BR-students-002: Öğrenci kaydı yaşam-döngüsü — koordineli iki-eksen geçiş

**Kural:** Her lifecycle komutu `enrollment.Status` ve `Person.LifecycleState` eksenlerini koordineli mutasyona uğratır. Şube koltuğu (`ClassRoomStudent`) da komuta göre kapatılır ya da tutulur. Her komut, mutasyondan önce her iki ekseni de doğrular.

**Geçiş Tablosu:**

| Komut | Gerekli enrollment.Status | Gerekli Person.LifecycleState | Yeni enrollment.Status | ClassRoomStudent | Yeni Person.LifecycleState |
|---|---|---|---|---|---|
| `:freeze` | Active | Active | Frozen | Korunur (koltuk açık kalır) | Suspended |
| `:resume` | Frozen | Suspended | Active | Korunur | Active |
| `:withdraw` | Active | Active | Withdrawn | Kapatılır; `CurrentClassroomId → null`; `IsActiveStudent=false` | Suspended |
| `:transfer-out` | Active | Active | TransferredOut | Kapatılır; `CurrentClassroomId → null` | Transferred |
| `:graduate` | Active | Active | Graduated | Kapatılır; `CurrentClassroomId → null` | Graduated |

**Kısıtlar:**

1. **Frozen öğrenci terminal geçiş yapamaz.** `Frozen` durumundaki bir öğrenci doğrudan `Withdrawn` / `TransferredOut` / `Graduated` statüsüne geçirilemez; önce `:resume` çağrılmalıdır. Bu kısıt entity guard'larında uygulanır (`enrollment.Status == Active` zorunlu kılar).
2. **İkili eksen koruması.** Her komut handler'ı mutasyondan önce hem `enrollment.Status` hem `person.LifecycleState`'i doğrular. Bu sayede legacy person endpoint'leri ile enrollment ekseni arasındaki olası sapma, 500 yerine 409 Conflict'e dönüştürülür.
3. **Hata kodu.** Geçersiz geçiş → `409 Conflict`, `Error.Conflict("students.errors.invalid-lifecycle-transition")`.

**`Person.Transfer(Guid?)` — nullable hedef okul.**

`:transfer-out` komutu `targetSchoolId?: Guid?` kabul eder. `null` = OKSİS dışı (harici okul) nakil. `Person.Transfer(Guid?)` Faz 2B'de nullable yapıldı.

**`AssignmentReason` genişlemesi.**

`AssignmentReason.Withdrawal` ve `AssignmentReason.TransferOut` değerleri Faz 2B'de eklendi; şube koltuğu kapatma işlemleri bu nedenlerle loglanır.

**MVP kısıtı.** `ArchiveEnrollment` (terminal → Archived geçişi) Faz 2B kapsamı dışında bırakıldı; UI ve endpoint yok (bkz. `completion_status.md` ⚠️ Spec Dışına Çıkılanlar).

---

### BR-students-003: Yenileme niyeti yalnız cari sezon aktif kayda set edilir

**Kural:** `Intent` (`RenewalIntent?`) yalnız `Status==Active` + cari (aktif) sezon enrollment'a set edilebilir (mevcut `StudentEnrollment.SetRenewalIntent` metodu). Frozen / terminal (`Withdrawn`, `TransferredOut`, `Graduated`, `Archived`) durumundaki kayıtlara intent set edilemez; toplu komutta (`BulkSetRenewalIntent`) bu id'ler **sessizce atlanır** (`updatedCount` gerçekten güncellenen sayıyı verir).

**`null` intent ≠ `Undecided`:** `Intent == null` = "hiç işaretlenmemiş" (henüz sınıflandırılmamış aday). `Intent == Undecided` = açıkça kararsız olarak işaretlenmiş. KPI sayıları (`renewingCount` / `undecidedCount` / `leavingCount`) tüm filtrelenmiş aday kümesinden hesaplanır; `null` intentli adaylar hiçbir KPI kategorisine dahil edilmez.

**Bildirim yok:** Niyet set etmek domain event veya bildirim **üretmez**. `EnrollmentRenewedEvent` (sezon geçişini tetikleyecek olaylar) Faz 3B'ye aittir; Faz 3A yalnız niyet toplama (intent collection) faz'ıdır.

**İzin:** `students.renew` — `BulkSetRenewalIntent` komutu ve `ListRenewalCandidates` query'si bu izni gerektirir.

---

### BR-students-004: Yenileme köprüsü — taslak-sürücülü gating, terminal-kademe eleme, idempotency

**Kural:** `RenewEnrollment` (cari aktif sezon → hedef Setup sezon) yalnız `Status==Active` + `Intent==Renewing` kayıtlar için hedef sezonda `Type=Renewal, Status=Draft, ClassRoomId=null` idari taslak açar. `PromoteStudents`'ın terfi köprüsü (E6.3), hedef sezonun `RenewalPeriodOpenedAt` bayrağına göre **koşullu** çalışır — köprü **taslak-sürücülü**dür: tek doğruluk kaynağı enrollment defteridir, roster'ın kendisi değil.

**S2 — Gating (taslak-sürücülü):**
- Hedef sezonda `RenewalPeriodOpenedAt != null` (dönem AÇIK) → `PromoteStudentsCommandHandler` yalnız hedef sezonda `Type=Renewal, Status=Draft` taslağı olan roster öğrencisini koltuğa yerleştirir; yerleştirirken taslağı `Draft→Active` + `ClassRoomId` (yeni koltuk) olarak aktive eder (`StudentEnrollment.Activate(Guid)`, E1.3 — `ClassRoomStudent` defteri tek doğruluk kaynağı, enrollment mirror'lar). Taslağı **olmayan** roster öğrencisi atlanır (`Skipped`) — koltuk taşınmaz.
- Hedef sezonda `RenewalPeriodOpenedAt == null` (dönem KAPALI) → **legacy davranış aynen korunur**: tüm roster terfi eder/mezun olur, `StudentEnrollment`'a hiç dokunulmaz. Bu, E6.3'ün "korunur" ibaresiyle birebir — geriye uyumluluk.
- Mezuniyet/terminal-kademe mantığı (bir üst kademe teklif edilmiyorsa mezun et) her iki modda da **değişmez**.

**Terminal-kademe eleme (RenewEnrollment içinde, `PromoteStudents` ile aynı mekanizma):** `SchoolGradeLevels.IsActive` üzerinden `GradeLevel.DisplayOrder` kümesinde `kaynak.GradeLevel + 1` teklif edilmiyorsa (bir üst kademe yok — öğrenci mezun olacak) aday **atlanır** (`Skipped`), taslak açılmaz.

**İdempotency:** `RenewEnrollment` ikinci kez aynı hedef sezona çağrılırsa, hedef sezonda o `StudentPersonId` için zaten `Type=Renewal` kaydı olan öğrenciler tekrar taslak açmaz (`Skipped`). `PromoteStudents` gated modda da idempotenttir: taslak zaten `Active` ise (ilk çalıştırmada aktive edilmiş) tekrar `Activate` çağrılmaz (guard: yalnız hâlâ `Draft` ise).

**S3 — yalnız Renewing→taslak:** `RenewEnrollment` yalnız `Intent==Renewing` kayıtları işler. `Leaving`/`Undecided`/`null` intent'li kayıtlar **no-op** — otomatik `Withdraw` **yapılmaz** (cari aktif sezon kaydını kapatmak riskli bir otomasyon; admin gerekirse Faz 2B `:withdraw` ile manuel kapatır). `StudentNumber` değişmez (E4.4.2) — taslak yeni numara üretmez, mevcut `StudentProfile.StudentNumber` korunur.

**`EnrollmentRenewedEvent`:** Her taslak için `RenewEnrollment` **anında** (taslak SaveChanges'i ile aynı transaction, Outbox pattern) raise edilir — "yenileme" eylemi taslağın kendisidir, promote/aktivasyon anını beklemez. Veliye taslakta koltuk olmadığından **sınıfsız** bildirim gider (S4, bkz. `domain-model.md` Domain Events).

**Sebep:** Tek doğruluk kaynağı ilkesi (E1.3) korunurken, sezon geçişi (`ActivateSeasonRollover`/`PromoteStudents`) toplanan yenileme niyetiyle **köprülenir** (E6.2/E6.3). Roster'ın kendisini sürücü almak (örn. "hedef sezonda şube var mı" gibi dolaylı sinyaller) çift-kaynak riski taşırdı; taslak enrollment tek gerçek kaynak olarak seçildi.

**Test referansı:** `OpenRenewalPeriodCommandHandlerTests`, `RenewEnrollmentCommandHandlerTests`, `PromoteStudentsCommandHandlerTests` (gating senaryoları), `ActivateSeasonRolloverCommandHandlerTests` (uçtan uca gated promote)

---

### BR-students-005: Öğrenci numarası — yılsız üretim, okul-yapılandırılabilir format, global benzersizlik

**Kural:** Öğrenci numarası artık **yıl içermez**. `StudentNumberGenerator.NextAsync(schoolId, ct)` okulun `SchoolSettings.StudentNumberPrefix`/`StudentNumberLength` ayarını okur (`length ?? 3`) ve `{prefix}{sıra:min-length}` üretir; sayaç okul-ömür-boyu tek monoton sıra olup **100'den** başlar (`100, 101, … 999, 1000, …` — tükenmez, `length` tavan değil minimum genişliktir). Ayar boşsa (`prefix=null`, `length=null`): öneksiz, min 3 hane, 100'den başlar (default).

**Benzersizlik:** `(SchoolId, StudentNumber)` **global** UNIQUE — bir okulda hiçbir numara (otomatik veya manuel) daha önce kullanılmamış olmalı.

**Manuel/import kabul:** `IStudentNumberValidator.ValidateAsync(schoolId, candidate, ct)` — hem format hem benzersizlik doğrular: (a) ayar doluysa `{prefix}{≥length hane rakam}` pattern'ine uymalı; ayar boşsa salt-rakam, sayısal değer **≥100** (min 3 hane); (b) `(SchoolId, StudentNumber)` içinde bu numara hiç yok. Geçersiz format → `students.errors.student-number-invalid-format`; zaten kullanılan numara → `students.errors.duplicate-student-number`. `EnrollStudentCommand.StudentNumber : string?` — boş → otomatik üretim (generator); dolu → validator ile doğrulanır, geçerliyse aynen kullanılır.

**Okul-farkında login:** `IdentifierResolver` — `SchoolHint` mevcut okulun `StudentNumberPrefix`'i doluysa ve girdi bu prefix ile **başlıyorsa** → doğrudan öğrenci-no çözümü (tam stored değer, prefix dahil, `IgnoreQueryFilters` ile pre-auth tek-tenant scope, `PersonDirectory` BR-identity-001 deseniyle aynı). Aksi halde mevcut şekil-tabanlı sınıflandırma (salt-rakam 1-9 hane → öğrenci-no; 10-13 → telefon; 11 → TCKN) korunur.

**Mevcut numaralar değişmez:** Bu değişiklik yalnız **bundan sonraki üretimi** etkiler; `StudentNumberLength` migration'ı mevcut tüm satırları `NULL`'a çeker ama zaten üretilmiş/atanmış numaralar (`StudentProfile.StudentNumber`) **dokunulmaz** (immutability korunur, E4.4.2). Bir okulda eski format (`{yıl}{5-hane}`) ile yeni format (`100…`) **karışık** bulunabilir — kabul edilen bir durum, renumber kapsam dışı.

**Sebep:** Sabit `{yıl}{5-hane}` formatı okul-yapılandırılabilir ve import'a hazır bir sisteme dönüştürüldü; `SchoolSettings.StudentNumberPrefix/Length` alanları zaten vardı ama generator onları görmezden geliyordu — bu kural o boşluğu kapatır.

**Detay/kararlar:** `.claude/specs/ogrenci-numarasi-format-design.md` (bağlayıcı mini-spec, K1-K7).

**Test referansı:** `StudentNumberGeneratorTests`, `StudentNumberValidatorTests`, `EnrollStudentCommandHandlerTests` (manuel-no yolu), `IdentifierResolverTests` (prefix'li giriş)

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| Frozen öğrenciye doğrudan `:withdraw` | 409 Conflict (`students.errors.invalid-lifecycle-transition`) |
| Cari sezon enrollment yok | 404 Not Found |
| `students.manage` izni yok | 403 Forbidden |
| `person.LifecycleState` ile `enrollment.Status` birbirinden sapmış (eski person uçlarından kaynaklı) | 409 Conflict — iki-eksen koruması devreye girer |
| `targetSchoolId=null` ile `:transfer-out` | OKSİS dışı nakil — geçerli; `Person.LifecycleState` = Transferred |
| Hedef sezonda `RenewalPeriodOpenedAt != null` ama öğrencinin yenileme taslağı yok | `PromoteStudents` bu öğrenciyi atlar (`Skipped`); koltuk taşınmaz |
| `RenewEnrollment` aynı hedef sezona ikinci kez çağrılır | Zaten taslağı olan öğrenciler `Skipped` — yeni taslak açılmaz (idempotent) |
| `RenewEnrollment` sırasında öğrencinin bir üst kademesi yok (terminal) | `Skipped` — taslak açılmaz (mezuniyet mantığıyla hizalı) |
| Manuel öğrenci-no <100 veya harf içeriyor (ayar boşken) | `400`, `students.errors.student-number-invalid-format` |
| Manuel öğrenci-no zaten başka öğrencide kullanılıyor | `400`, `students.errors.duplicate-student-number` |
| Öğrenci-no boş bırakılır | Otomatik üretim (`generator.NextAsync`) — okulun ayarına göre |
| Login'de girdi okulun `StudentNumberPrefix`'i ile başlıyor | Öğrenci-no çözümü (okul-farkında dal); prefix eşleşmezse şekil-tabanlı sınıflandırmaya düşer |

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-05-15 | İlk kurallar tanımlandı | İlk implementasyon |
| 2026-06-28 | BR-students-001: güncel şube tek doğruluk kaynağı `class_room_students`; `CurrentClassroomId` `StudentClassroomSyncInterceptor` ile ondan türetilen ayna alan oldu (manuel senkron kaldırıldı) | İki-yazım drift'ini yapısal olarak engelleme |
| 2026-06-30 | BR-students-002: beş lifecycle komutu koordineli iki-eksen (enrollment.Status + Person.LifecycleState) geçiş kuralı; Frozen→terminal kısıtı; ikili eksen koruması; `Person.Transfer(Guid?)` nullable; `AssignmentReason.Withdrawal/TransferOut` eklendi | Faz 2B lifecycle implementasyonu |
| 2026-06-30 | BR-students-003: Yenileme niyeti yalnız cari sezon aktif kayda set edilir; `null` intent ≠ `Undecided`; KPI tüm kümeden; niyet set bildirim üretmez (event Faz 3B) | Faz 3A yenileme niyeti implementasyonu |
| 2026-07-01 | BR-students-004: Yenileme köprüsü — `PromoteStudents` E6.3 gating taslak-sürücülü (S2); terminal-kademe eleme; `RenewEnrollment` idempotency; yalnız Renewing→taslak (S3); `EnrollmentRenewedEvent` RenewEnrollment anında | Faz 3B yenileme + rollover köprüsü implementasyonu |
| 2026-07-01 | BR-students-005: Öğrenci no yılsız + okul-yapılandırılabilir format (`{prefix?}{sıra,min-length,100'den}`); global benzersizlik; `IStudentNumberValidator` manuel/import kabul; okul-farkında login prefix çözümü; mevcut numaralar immutable/karışık format kabul | Öğrenci Numarası Format mini-spec implementasyonu (`.claude/specs/ogrenci-numarasi-format-design.md`) |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
