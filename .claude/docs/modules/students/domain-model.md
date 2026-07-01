# Öğrenci — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, aggregate root'lar, invariants, domain event'ler.

---

## Aggregate Root(lar)

### `StudentEnrollment`

**Sorumluluk:** Bir öğrencinin belirli bir akademik sezondaki kayıt kaydı. Student × Season ekseninde idari kayıt; durum makinesi (Draft→Active→Frozen/TransferredOut/Withdrawn/Graduated→Archived) bu aggregate üzerinden yönetilir.

**Namespace:** `Oksis.Domain.Modules.Students`

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu, immutable |
| `StudentPersonId` | `Guid` | FK → Persons (Person entity) | Zorunlu, immutable |
| `AcademicSessionId` | `Guid` | FK → academic_sessions | Zorunlu, immutable |
| `GradeLevel` | `int` | Kademe numarası (denormalize — `GradeLevel.DisplayOrder` ile aynı sayı uzayı, FK değil) | Zorunlu |
| `Type` | `EnrollmentType` | Kayıt türü (New / TransferIn / Renewal) | Zorunlu |
| `Status` | `EnrollmentStatus` | Durum makinesi alanı | Zorunlu, başlangıç Draft |
| `ClassRoomId` | `Guid?` | Atandığı şube FK → class_rooms | Nullable |
| `Intent` | `RenewalIntent?` | Yenileme niyeti (`Renewing`/`Undecided`/`Leaving`) — bkz. aşağıdaki naming notu | Nullable; `SetRenewalIntent(RenewalIntent)` ile set edilir |
| `PreviousSchool` | `string?` | Nakil kayıtlarda önceki okul adı | Nullable; TransferIn için zorunlu |
| `EnrollmentDate` | `DateOnly` | Kayıt tarihi | Zorunlu |

> **`Intent` naming notu (Faz 3B doküman borcu kapatıldı, 2026-07-01):** Bu dosyanın önceki sürümü `Intent`'i `string?` tipli bir "başvuru/kabul notu" alanı olarak tanımlıyordu. **Kod gerçeği farklı:** `StudentEnrollment.Intent` alanı, entity'nin ilk implementasyonundan (Faz 2B, 2026-06-29) beri `RenewalIntent?` (yenileme niyeti enum'u) tipindedir; bu entity üzerinde ayrı bir string "başvuru notu" alanı **hiç var olmadı** — `EnrollStudentCommand`'da da böyle bir parametre yok (bkz. `api-contracts.md` `students:enroll` örneğindeki `"intent"` alanı da bu yüzden bayat/kod dışı; ayrı bir düzeltme gerektirir, bu görevin kapsamı dışıdır). Kısacası: **tek `Intent` alanı var, tipi `RenewalIntent?`, anlamı yenileme niyeti** — çakışan iki ayrı kavram yoktur, önceki doküman satırı yanlıştı.
>
> `StudentNumber` bu entity'de **yoktur** — öğrenci numarası `Oksis.Domain.Modules.Users.Entities.StudentProfile.StudentNumber` üzerinde tutulur (Users modülü); `RenewEnrollment` taslak açarken numaraya dokunmaz (E4.4.2).

**Invariants:**

- `PreviousSchool` → `EnrollmentType.TransferIn` olduğunda zorunludur.
- `Status` sadece izin verilen geçişler üzerinden ilerleyebilir (bkz. `EnrollmentStatus` tablosu — tam durum makinesi Faz 2B ile canlı).
- Aynı Student × AcademicSession çifti için yalnızca bir aktif kayıt olabilir (UX index).
- `Intent` yalnız `Status==Active` kayıtta set edilebilir (bkz. `business-rules.md` BR-students-003).

**Davranışlar (method'lar):**

- `Create(...)` — Static factory; Draft status ile başlar (`Type=New/TransferIn/Renewal`), `RaiseEnrolled(...)` ile event dışarıdan raise edilir.
- `Activate()` — Draft → Active, koltuk değişmez (E2.5; post-commit event işlendikten sonra çağrılabilir).
- `Activate(Guid classRoomId)` — **(Faz 3B)** Yenileme taslağını (`Type=Renewal`, `ClassRoomId=null`) bir şubeye yerleştirerek aktive eder: Draft → Active + `ClassRoomId` set. `PromoteStudents` E6.3 gating tarafından kullanılır (E1.3 — `ClassRoomStudent` defteri tek doğruluk kaynağı, bu çağrı onu mirror'lar).
- `Freeze()` — Active → Frozen (Faz 2B).
- `Resume()` — Frozen → Active (Faz 2B).
- `Withdraw()` — Active → Withdrawn (Faz 2B).
- `TransferOut()` — Active → TransferredOut (Faz 2B).
- `Graduate()` — Active → Graduated (Faz 2B).
- `Archive()` — Graduated/Withdrawn/TransferredOut → Archived (Faz 2B; UI/uç yok — Debt, bkz. `completion_status.md`).
- `SetClassRoom(Guid? classRoomId)` — `ClassRoomId`'yi doğrudan set eder (Faz 2B lifecycle handler'ları tarafından kullanılır).
- `SetRenewalIntent(RenewalIntent intent)` — **(Faz 3A)** `Intent` alanını set eder; guard uygulama katmanında (yalnız `Status==Active` — bkz. BR-students-003).
- `RaiseEnrolled(StudentEnrolledEvent e)` — `AggregateRoot.Raise` protected olduğundan event raise etmeyi dışarı açan köprü metot (`EnrollStudentCommand` orkestrasyonu için).
- `RaiseRenewed(EnrollmentRenewedEvent e)` — **(Faz 3B)** `RenewEnrollment` için event raise köprüsü; `SourceEnrollmentId`/`GuardianPersonIds` entity tarafından çözülemediğinden uygulama katmanı sağlar.

---

### `StudentDocument`

**Sorumluluk:** Öğrenciye ait yüklenen belge kaydı (meta-data only; fiziksel dosya blob/S3'te). Faz 1A'da model oluşturuldu, CQRS handler'ı ve UI Faz 2'de.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu, immutable |
| `StudentId` | `Guid` | FK → Persons | Zorunlu |
| `EnrollmentId` | `Guid?` | FK → student_enrollments (hangi kayıtta yüklendi) | Nullable |
| `Type` | `DocumentType` | Belge türü (IdentityDoc, ResidenceDoc, HealthReport, TransferDoc, Photo, Other) | Zorunlu |
| `FileUrl` | `string` | Blob/S3 path | Zorunlu |
| `FileName` | `string` | Orijinal dosya adı | Zorunlu |
| `Description` | `string?` | Ek açıklama | Nullable |

---

### `EnrollmentIdempotency`

**Sorumluluk:** `EnrollStudentCommand` idempotency anahtarı. `ClientRequestId` ile aynı isteğin ikinci kez atılmasını önler; sonucu JSON olarak saklar ve tekrarda geri döner.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu |
| `ClientRequestId` | `Guid` | İstemci tekil istek ID'si | Zorunlu, unique (UX index) |
| `ResultJson` | `string` | Başarı sonucu (EnrollStudentResult) JSON | Zorunlu |
| `CreatedAt` | `DateTimeOffset` | Kayıt zamanı | Zorunlu |

---

### `StudentNumberCounter` (POCO)

**Sorumluluk:** Okul+yıl bazında öğrenci numarası sıra sayacı. `IStudentNumberGenerator` implementasyonu bu tablodan atomic increment ile alır. IHasTenant entity DEĞİL — composite PK üzerinden yönetilir; soft-delete yoktur.

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `SchoolId` | `Guid` | Okul ID (composite PK parça 1) | Zorunlu |
| `Year` | `int` | Kayıt yılı (composite PK parça 2) | Zorunlu |
| `NextCounter` | `int` | Sıradaki sayaç değeri (atomik artırılır) | Zorunlu, başlangıç 1 |

**`IStudentNumberGenerator`:** `GenerateAsync(schoolId, year)` → `"{year}{counter:D5}"` formatında string döner; her çağrıda `NextCounter` atomic increment ile artar, per-tenant izole.

---

## Enums

### `EnrollmentType`

| Değer | Anlam |
|---|---|
| `New` | Yeni kayıt (ilk defa bu okula) |
| `TransferIn` | Nakil gelen (başka okuldan) |
| `Renewal` | Dönem yenileme (aynı öğrenci yeni sezon) |

### `EnrollmentStatus`

| Değer | Anlam | İzin Verilen Sonraki Durum |
|---|---|---|
| `Draft` | Taslak (kayıt başladı, henüz tamamlanmadı) | `Active` |
| `Active` | Aktif öğrenci | `Frozen`, `TransferredOut`, `Withdrawn`, `Graduated` |
| `Frozen` | Kayıt donduruldu | `Active` |
| `TransferredOut` | Nakil çıkışı yapıldı | `Archived` |
| `Withdrawn` | Ayrıldı / çekildi | `Archived` |
| `Graduated` | Mezun oldu | `Archived` |
| `Archived` | Arşivlendi | — (terminal) |

### `DocumentType`

| Değer | Anlam |
|---|---|
| `IdentityDoc` | Kimlik / nüfus cüzdanı |
| `ResidenceDoc` | İkametgah belgesi |
| `HealthReport` | Sağlık raporu |
| `TransferDoc` | Nakil belgesi |
| `Photo` | Fotoğraf |
| `Other` | Diğer |

---

## Domain Events

| Event | Tetiklenme Anı | Payload |
|---|---|---|
| `StudentEnrolledEvent` | `StudentEnrollment.Create(...)` sonrası (`SaveChanges` öncesi — Outbox pattern) | `StudentId`, `EnrollmentId`, `SchoolId`, `ClassRoomId`, `GuardianChannel`, `GuardianEmails[]` (öğrenci hesabı + geçici şifre payload alanı Faz 1B'de eklenecek — E2.6/E2.7) |
| `EnrollmentRenewedEvent` **(Faz 3B)** | `RenewEnrollmentCommand` içinde, her yenileme taslağı (`Type=Renewal, Status=Draft`) oluşturulduğunda `RaiseRenewed(...)` ile (`SaveChanges` öncesi — Outbox pattern) | `EnrollmentId`, `SchoolId`, `StudentPersonId`, `AcademicSessionId` (hedef Setup sezon), `SourceEnrollmentId` (cari sezondaki kaynak kayıt), `GuardianPersonIds: IReadOnlyList<Guid>` |

> `StudentEnrolledEventHandler` (post-commit, `IPostCommitDispatcher`):
> 1. Veli(ler)e davet gönderir (`InvitationCreationHelper`, kanal event'ten gelir). — Faz 1A
> 2. (Faz 1B) Öğrenci için hesap açar (`Account.Create`, `requirePasswordChange=true`; kullanıcı adı = öğrenci no; `person.LinkAccount`). E2.6 (küçük-kademe yalnız veli) + E2.7 (kullanıcı-adı = öğrenci-no giriş yolu) gereği ertelendi.
>
> `EnrollmentRenewedEventHandler` **(Faz 3B)** — `INotificationHandler<DomainEventNotification<EnrollmentRenewedEvent>>` (Hangfire kuyruk üzerinden, senkron iş yapmaz — E10): `GuardianPersonIds` boşsa no-op; değilse `INotificationRecipientResolver.ResolveGuardianAccountsAsync` ile veli hesapları çözülür, `RenewalNotificationContent.Renewed()` ile başlık/gövde üretilir (sınıf bilgisi YOK — taslakta koltuk yok, S4) ve `INotificationEnqueuer.Enqueue(...)` ile in-app bildirim kuyruklanır (`NotificationKind.EnrollmentRenewed`). Bildirim metni sabit Türkçe — bkz. `completion_status.md` ⚠️ Spec Dışına Çıkılanlar (Debt-N2).
>
> Event'lerin bildirim akışları için bkz. `notifications.md`.

---

## İlişkiler

```
StudentEnrollment (aggregate)
  ├── (N:1) → Person (StudentId — Persons tablosu)
  ├── (N:1) → AcademicSession (AcademicSessionId)
  ├── (N:1) → ClassRoom (ClassRoomId — nullable)
  └── (1:N) → StudentDocument (StudentId üzerinden)

StudentDocument
  └── (N:1) → StudentEnrollment (EnrollmentId — nullable)

EnrollmentIdempotency
  └── (standalone, SchoolId tenant scope)

StudentNumberCounter
  └── (composite PK: SchoolId + Year, no FK)
```

---

## Yasaklar

- ❌ Public setter (constructor / factory üzerinden)
- ❌ Domain'de EF Core attribute (Fluent API'de yapılır — `Infrastructure/Persistence/Configurations/`)
- ❌ DataAnnotations
- ❌ Public collection ekleme/çıkarma (method üzerinden)
- ❌ `StudentNumber` değişikliği kayıt sonrası (mezuniyet dahil sabit — E2.3)

> Genel domain kuralları için bkz. `backend/domain-model-rules.md`.
