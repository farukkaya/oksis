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

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| Frozen öğrenciye doğrudan `:withdraw` | 409 Conflict (`students.errors.invalid-lifecycle-transition`) |
| Cari sezon enrollment yok | 404 Not Found |
| `students.manage` izni yok | 403 Forbidden |
| `person.LifecycleState` ile `enrollment.Status` birbirinden sapmış (eski person uçlarından kaynaklı) | 409 Conflict — iki-eksen koruması devreye girer |
| `targetSchoolId=null` ile `:transfer-out` | OKSİS dışı nakil — geçerli; `Person.LifecycleState` = Transferred |

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-05-15 | İlk kurallar tanımlandı | İlk implementasyon |
| 2026-06-28 | BR-students-001: güncel şube tek doğruluk kaynağı `class_room_students`; `CurrentClassroomId` `StudentClassroomSyncInterceptor` ile ondan türetilen ayna alan oldu (manuel senkron kaldırıldı) | İki-yazım drift'ini yapısal olarak engelleme |
| 2026-06-30 | BR-students-002: beş lifecycle komutu koordineli iki-eksen (enrollment.Status + Person.LifecycleState) geçiş kuralı; Frozen→terminal kısıtı; ikili eksen koruması; `Person.Transfer(Guid?)` nullable; `AssignmentReason.Withdrawal/TransferOut` eklendi | Faz 2B lifecycle implementasyonu |
| 2026-06-30 | BR-students-003: Yenileme niyeti yalnız cari sezon aktif kayda set edilir; `null` intent ≠ `Undecided`; KPI tüm kümeden; niyet set bildirim üretmez (event Faz 3B) | Faz 3A yenileme niyeti implementasyonu |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
