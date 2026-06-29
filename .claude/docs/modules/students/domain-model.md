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
| `StudentId` | `Guid` | FK → Persons (Person entity) | Zorunlu, immutable |
| `AcademicSessionId` | `Guid` | FK → academic_sessions | Zorunlu, immutable |
| `Type` | `EnrollmentType` | Kayıt türü (New / TransferIn / Renewal) | Zorunlu |
| `Status` | `EnrollmentStatus` | Durum makinesi alanı | Zorunlu, başlangıç Draft |
| `ClassRoomId` | `Guid?` | Atandığı şube FK → class_rooms | Nullable |
| `StudentNumber` | `string` | Öğrenci no (`{yıl}{5 hane}`, bir kez üretilir) | Nullable — kayıt sırasında atanır, mezuniyete kadar sabit (E2.3) |
| `Intent` | `string?` | Başvuru/kabul notu | Nullable, maks 500 karakter |
| `PreviousSchool` | `string?` | Nakil kayıtlarda önceki okul adı | Nullable; TransferIn için zorunlu |
| `EnrollmentDate` | `DateOnly` | Kayıt tarihi | Zorunlu |

**Invariants:**

- `PreviousSchool` → `EnrollmentType.TransferIn` olduğunda zorunludur.
- `StudentNumber` bir kez set edildikten sonra değiştirilemez (immutable after assignment).
- `Status` sadece izin verilen geçişler üzerinden ilerleyebilir (Draft→Active en temel; Faz 2'de diğer geçişler).
- Aynı Student × AcademicSession çifti için yalnızca bir aktif kayıt olabilir (UX index).

**Davranışlar (method'lar):**

- `Create(...)` — Static factory; Draft status ile başlar, `StudentEnrolledEvent` raise eder.
- `Activate()` — Draft → Active (E2.5; post-commit event işlendikten sonra çağrılabilir).
- Faz 2: `Freeze()`, `Withdraw()`, `TransferOut()`, `Graduate()`, `Archive()` — henüz yok.

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
| `StudentEnrolledEvent` | `StudentEnrollment.Create(...)` sonrası (`SaveChanges` öncesi — Outbox pattern) | `StudentId`, `EnrollmentId`, `SchoolId`, `ClassRoomId`, `GuardianChannel`, `GuardianEmails[]`, `TemporaryPassword` (şifreli değil — post-commit handler kullanır) |

> `StudentEnrolledEventHandler` (post-commit, `IPostCommitDispatcher`):
> 1. Veli(ler)e davet gönderir (`InvitationCreationHelper`, kanal event'ten gelir).
> 2. Öğrenci için hesap açar (`Account.Create`, `requirePasswordChange=true`; kullanıcı adı = öğrenci no; `person.LinkAccount`).
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
