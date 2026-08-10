# Kullanıcı Yönetimi — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, aggregate root'lar, invariants, domain event'ler.

> **Sınır kuralı:** Bu modül **kişiyi (Person)** ve **profillerini** yönetir. **Login credential** (parola, refresh token), **SystemRole** ve **Permission** master tabloları `identity` modülündedir. Users ↔ Identity sınırı `RoleAssignment.SystemRoleId` üzerinden köprülenir.

---

## Aggregate Yapısı

```
Person (AR)
  ├─ StudentProfile (1:0..1)
  ├─ TeacherProfile (1:0..1)
  ├─ ParentProfile  (1:0..1)
  └─ StaffProfile   (1:0..1)
       (bir Person birden fazla profil taşıyabilir — öğretmen-veli aynı kişi olabilir)

ParentStudentRelationship (AR)  — many-to-many bağlayıcı
RoleAssignment            (AR)  — sezona bağlı rol bağlayıcısı
Invitation                (AR)  — davet iş akışı
ConsentRecord             (AR)  — KVKK onay/rıza kaydı
AccountLifecycleEvent     (AR)  — yaşam döngüsü event store
```

---

## Aggregate Root'lar

### `Person` (TenantEntity, AR)

**Sorumluluk:** Okul ekosistemine ait bir gerçek kişinin değişmez kimlik bilgilerini tutar. Login credential **buraya değil** `identity` modülündeki `Account`'a aittir.

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu, immutable |
| `FirstName` | `PersonName` (VO) | Ad | NotEmpty, max 100 |
| `LastName` | `PersonName` (VO) | Soyad | NotEmpty, max 100 |
| `NationalIdHash` | `string?` | TCKN'nin SHA-256 hash'i (search için) | Nullable, deterministik hash |
| `NationalIdEncrypted` | `byte[]?` | TCKN şifrelenmiş hali (gösterim için) | AES-256-GCM |
| `Gender` | `Gender` enum | Male/Female/Unspecified | |
| `BirthDate` | `DateOnly?` | Doğum tarihi | <= today |
| `PrimaryEmail` | `Email?` (VO) | Birincil iletişim e-postası | Nullable |
| `PrimaryPhone` | `PhoneNumber?` (VO) | Birincil telefon | Nullable |
| `LifecycleState` | `PersonLifecycleState` enum | Yaşam döngüsü durumu | Aşağıda |
| `LinkedAccountId` | `Guid?` | `identity.Account` FK (henüz yoksa null) | Davet kabulünden sonra set edilir |

**Invariants:**
- `NationalIdHash` aynı `SchoolId` içinde unique (çift kayıt önlemi).
- `LifecycleState` durum geçişleri sadece state machine üzerinden (aşağıda).
- En az **bir profil** olmadan `Person` aktif edilemez (`LifecycleState != Draft` ise en az 1 profile zorunlu).
- `BirthDate` set ise > 1900-01-01 ve <= today.

**Davranışlar:**
- `Create(schoolId, firstName, lastName, ...)` — Static factory, `LifecycleState = Draft`.
- `AttachProfile(profile)` — Yeni profil ekler, profil tipini kontrol eder (aynı tipte iki profil olamaz).
- `LinkToAccount(accountId)` — Davet kabulü sonrası çağrılır, `LinkedAccountId` set edilir.
- `Suspend(reason)` — `Active → Suspended`.
- `Archive(reason)` — `Active|Suspended → Archived`, KVKK anonimleştirme tetikler.
- `Activate()` — `Draft → Active` (en az 1 profile zorunlu kontrolü).

### Profile Entity'leri (Person aggregate altında)

Her profil bir `Person`'a bağlıdır ve **Person aggregate root'unun parçasıdır** (Person AR'ı dışında bağımsız değiştirilemez).

#### `StudentProfile`

| Property | Tip | Açıklama |
|---|---|---|
| `PersonId` | `Guid` | FK + PK |
| `StudentNumber` | `string` | Okul içi öğrenci numarası, unique (`SchoolId`, `StudentNumber`) |
| `PreviousSchool` | `string?` | Nakil için |
| `BloodType` | `BloodType?` enum | A+, B+, vb. |
| `EmergencyContact` | `EmergencyContact` (VO) | Acil durum iletişimi |
| `EnrolledAt` | `DateOnly` | İlk kayıt tarihi |
| `GraduatedAt` | `DateOnly?` | Mezuniyet tarihi |
| `IsActiveStudent` | `bool` | Hesap login yapabilir mi (yaş bazlı; küçük yaşta `false`) |

#### `TeacherProfile`

| Property | Tip | Açıklama |
|---|---|---|
| `PersonId` | `Guid` | FK + PK |
| `EmployeeNumber` | `string` | Okul içi sicil no, unique |
| `Branch` | `string` | Branş (Matematik, Türkçe, vb.) |
| `ContractType` | `ContractType` enum | FullTime, PartTime, Hourly, Substitute |
| `MebRegistryNumber` | `string?` | MEB sicil no |
| `EducationLevel` | `EducationLevel` enum | Lisans/YüksekLisans/Doktora |
| `HiredAt` | `DateOnly` | İşe başlama |
| `TerminatedAt` | `DateOnly?` | Ayrılma |

#### `ParentProfile`

| Property | Tip | Açıklama |
|---|---|---|
| `PersonId` | `Guid` | FK + PK |
| `Occupation` | `string?` | Meslek |
| `WorkPlace` | `string?` | İş yeri |
| `Address` | `Address` (VO) | İletişim adresi |
| `MaritalStatus` | `MaritalStatus` enum | Married/Divorced/Widowed/Other |

#### `StaffProfile`

| Property | Tip | Açıklama |
|---|---|---|
| `PersonId` | `Guid` | FK + PK |
| `Department` | `string` | Muhasebe, Sekreterlik, Teknik, vb. |
| `EmployeeNumber` | `string` | Sicil no |
| `ContractType` | `ContractType` enum | |

---

### `ParentStudentRelationship` (TenantEntity, AR)

**Sorumluluk:** Veli ↔ Öğrenci many-to-many ilişkisini ve bu ilişkinin **yetki tipini** taşır. Boşanmış aileler, vasi, üvey ebeveyn senaryolarını burada modelleriz.

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `SchoolId` | `Guid` | Tenant |
| `ParentPersonId` | `Guid` | FK → `Person` (ParentProfile zorunlu) |
| `StudentPersonId` | `Guid` | FK → `Person` (StudentProfile zorunlu) |
| `RelationType` | `RelationType` enum | Mother, Father, Guardian, Grandparent, Stepparent, Other |
| `CanViewInfo` | `bool` | Öğrenci bilgilerini görür mü |
| `CanMakeDecisions` | `bool` | İzin/onay verebilir mi (gezi, etkinlik) |
| `IsPaymentResponsible` | `bool` | Fatura/dekont muhatabı |
| `CanPickup` | `bool` | Okuldan teslim alma yetkisi |
| `IsPrimaryContact` | `bool` | Birincil iletişim (bildirimler önce buna gider) |
| `ValidFrom` | `DateOnly` | İlişki başlangıcı |
| `ValidUntil` | `DateOnly?` | İlişki bitişi (mahkeme kararı vb.) |

**Invariants:**
- Bir öğrenci için en az **bir** `IsPrimaryContact = true` veli olmalı (aktif öğrenciyse).
- `ParentPersonId == StudentPersonId` olamaz.
- Aynı (`ParentPersonId`, `StudentPersonId`) çifti aynı `SchoolId` içinde unique.
- `ValidUntil >= ValidFrom`.

**Davranışlar:**
- `Create(...)`, `Promote(...)` (yetki yükseltme), `Revoke(...)` (mahkeme kararı), `UpdatePermissions(...)`.

---

### `RoleAssignment` (TenantEntity, AR)

**Sorumluluk:** Bir `Person`'a belirli bir **sezonda** belirli bir **sistem rolü** atar. Sezon bittiğinde otomatik olarak `Inactive` olur; aynı kişi farklı sezonda farklı rol alabilir.

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `SchoolId` | `Guid` | Tenant |
| `PersonId` | `Guid` | FK → `Person` |
| `SystemRoleId` | `Guid` | FK → `identity.SystemRole` |
| `SeasonId` | `Guid` | FK → `seasons.Season` |
| `Status` | `RoleAssignmentStatus` enum | Active, Inactive, Revoked |
| `AssignedAt` | `DateTimeOffset` | |
| `AssignedByPersonId` | `Guid` | Kim atadı (audit) |
| `RevokedAt` | `DateTimeOffset?` | |
| `RevokedReason` | `string?` | |
| `ScopeAttributes` | `JsonDocument?` | ABAC scope'u (örn. `{ "branchId": "...", "gradeLevel": 9 }`) |

**Invariants:**
- Aynı (`PersonId`, `SystemRoleId`, `SeasonId`) çifti unique.
- `SeasonId` geçerli ve aynı tenant'a ait olmak zorunda.
- `Status = Active` ise `RevokedAt` null olmalı.

**Davranışlar:**
- `Create(...)`, `Revoke(reason)`, `Reactivate()`, `UpdateScope(attributes)`.

---

### `Invitation` (TenantEntity, AR)

**Sorumluluk:** Davet iş akışını uçtan uca yönetir. Bir davet bir Person'a bağlıdır (önceden Draft olarak oluşturulmuş Person). State machine ile durum geçişleri korunur.

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `SchoolId` | `Guid` | Tenant |
| `PersonId` | `Guid` | Davet edilen kişi |
| `TargetSystemRoleId` | `Guid` | FK → `identity.SystemRole` (hangi rol için davet) |
| `SeasonId` | `Guid` | FK → `seasons.Season` |
| `TokenHash` | `string` | SHA-256 hash (token plain text **DB'de tutulmaz**) |
| `Channel` | `InvitationChannel` enum | Email, Sms, Both |
| `ExpiresAt` | `DateTimeOffset` | Genelde 7 gün |
| `Status` | `InvitationStatus` enum | Aşağıda state machine |
| `BatchId` | `Guid?` | Toplu davet ise grup ID'si |
| `SentAt` | `DateTimeOffset?` | |
| `OpenedAt` | `DateTimeOffset?` | İlk tıklama (audit + UX metric) |
| `AcceptedAt` | `DateTimeOffset?` | |
| `RevokedAt` | `DateTimeOffset?` | |
| `RevokedReason` | `string?` | |
| `RetryCount` | `int` | Tekrar davet sayısı |
| `ConsentBundleVersion` | `string` | Hangi KVKK paket versiyonu sunuldu |

**State machine:**

```
Created ──Send──► Sent ──Open──► Opened ──Accept──► Accepted (terminal)
   │                │                │
   │                │                ├──Expire──► Expired (terminal)
   │                ├──Expire──► Expired (terminal)
   │                ├──Revoke──► Revoked (terminal)
   └──Revoke──► Revoked (terminal)
```

**Invariants:**
- `Accepted` olduğunda `PersonId.LinkedAccountId` set edilmiş olmak zorunda.
- `ExpiresAt > CreatedAt`, en fazla 30 gün.
- Aynı `PersonId` + `SeasonId` için **en fazla bir aktif** davet (`Status ∈ {Created, Sent, Opened}`).
- `TokenHash` global unique (cross-tenant — token rakipsiz olmalı).

**Davranışlar:**
- `Create(personId, targetRoleId, seasonId, channel, consentBundleVersion)` — token plain + hash döner; plain sadece mail/sms'e gider.
- `MarkSent()`, `MarkOpened()`, `Accept(personConfirmedData)`, `Expire()`, `Revoke(reason)`, `Resend()` (yeni token + RetryCount++).

---

### `ConsentRecord` (TenantEntity, AR)

**Sorumluluk:** KVKK aydınlatma metni + açık rıza onaylarının versiyonlanmış kaydı. Bir kişi bir versiyona "onay verdi" / "geri çekti" demek için bu tablo kullanılır.

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `SchoolId` | `Guid` | Tenant |
| `PersonId` | `Guid` | Kimin onayı |
| `ConsentType` | `ConsentType` enum | DataProcessing, Marketing, PhotoUsage, MedicalSharing, vb. |
| `BundleVersion` | `string` | Onay paket versiyonu (`v2026.05.01`) |
| `Status` | `ConsentStatus` enum | Granted, Revoked, Expired |
| `GrantedAt` | `DateTimeOffset?` | |
| `RevokedAt` | `DateTimeOffset?` | |
| `RevokedReason` | `string?` | |
| `EvidenceHash` | `string` | Onay anındaki HTML/PDF içeriğin hash'i (hukuki kanıt) |
| `IpAddress` | `string?` | Onay verilen IP |
| `UserAgent` | `string?` | Onay verilen cihaz |

**Invariants:**
- Aynı (`PersonId`, `ConsentType`, `BundleVersion`) çifti unique.
- `Revoked` ise `RevokedAt` zorunlu, `RevokedReason` zorunlu.

**Davranışlar:**
- `Grant(...)`, `Revoke(reason)`, `RotateVersion(newVersion)` (yeni versiyon sunulduğunda eskileri `Expired` olur).

---

## Enum'lar

### `PersonLifecycleState`

```csharp
public enum PersonLifecycleState
{
    Draft     = 0, // Oluşturuldu, davet edilmedi
    Invited   = 1, // Davet gönderildi
    Active    = 2, // Hesap aktif, sisteme dahil
    Suspended = 3, // Geçici askıya alındı
    Graduated = 4, // (Sadece öğrenci) Mezun
    Transferred = 5, // Nakil çıktı
    Archived  = 6  // Anonimleştirilmiş, salt-okunur
}
```

State machine geçişleri:
```
Draft → Invited → Active → Suspended → Active
                     │
                     ├──► Graduated   (öğrenci)
                     ├──► Transferred
                     └──► Archived    (anonimleştirilmiş)
```

### `InvitationStatus`, `InvitationChannel`, `ConsentType`, `ConsentStatus`, `RelationType`, `RoleAssignmentStatus`

EF Core'da hepsi `HasConversion<string>()` ile persist edilir.

---

## Value Objects

### `PersonName`

`Value: string` — Trim'lenmiş, en az 2 karakter, en fazla 100 karakter, sadece harf + boşluk + tire + apostrof.

### `Email`

RFC 5322 doğrulamalı, lowercase normalize.

### `PhoneNumber`

E.164 format. TR için +90 prefix zorunlu.

### `EmergencyContact`

`{ FullName, Relation, PhoneNumber }`.

### `Address`

`{ Line1, Line2?, City, District, PostalCode?, Country }`.

---

## Domain Events

| Event | Tetiklenme Anı | Payload |
|---|---|---|
| `PersonCreatedEvent` | `Person.Create` sonrası | `PersonId, SchoolId, CreatedBy` |
| `PersonActivatedEvent` | `Draft → Active` | `PersonId, SchoolId` |
| `PersonSuspendedEvent` | `Active → Suspended` | `PersonId, SchoolId, Reason` |
| `PersonArchivedEvent` | `→ Archived` | `PersonId, SchoolId, Reason` — KVKK anonimleştirme job'ı tetikler |
| `ProfileAttachedEvent` | `AttachProfile` | `PersonId, ProfileType` |
| `ParentStudentLinkedEvent` | `Create ParentStudentRelationship` | `RelationshipId, ParentPersonId, StudentPersonId, RelationType` |
| `ParentStudentRevokedEvent` | `Revoke` | `RelationshipId, Reason` |
| `RoleAssignedEvent` | `RoleAssignment.Create` | `PersonId, SystemRoleId, SeasonId` |
| `RoleRevokedEvent` | `RoleAssignment.Revoke` | `PersonId, SystemRoleId, SeasonId, Reason` |
| `UserInvitedEvent` | `Invitation.Create` (Sent'e geçince) | `InvitationId, PersonId, TargetRoleId, TokenPlain` — **TokenPlain sadece notification pipeline'da, log'a yazılmaz** |
| `InvitationOpenedEvent` | `Opened` | `InvitationId` |
| `InvitationAcceptedEvent` | `Accepted` | `InvitationId, PersonId, AccountId` |
| `InvitationExpiredEvent` | `Expired` | `InvitationId` |
| `InvitationRevokedEvent` | `Revoked` | `InvitationId, Reason` |
| `ConsentGrantedEvent` | `ConsentRecord.Grant` | `PersonId, ConsentType, BundleVersion` |
| `ConsentRevokedEvent` | `ConsentRecord.Revoke` | `PersonId, ConsentType, BundleVersion, Reason` — downstream modüllere veri erişim kapatma sinyali |
| `StudentGraduatedEvent` | `Graduated` | `PersonId, SeasonId, GraduatedAt` |
| `StudentTransferredEvent` | `Transferred` | `PersonId, FromSeasonId, ToSchoolId?, Reason` |

> Event'lerin bildirim akışları için bkz. `notifications.md`.

---

## İlişkiler

```
Person (AR)
  ├── (1:0..1) → StudentProfile  ─┐
  ├── (1:0..1) → TeacherProfile  ─┤  (Person aggregate'inin parçası)
  ├── (1:0..1) → ParentProfile   ─┤
  ├── (1:0..1) → StaffProfile    ─┘
  ├── (1:N)    → RoleAssignment      (sezona bağlı)
  ├── (1:N)    → ConsentRecord       (versiyonlu)
  ├── (1:N)    → ParentStudentRelationship (parent veya student olarak)
  ├── (0..1:1) → identity.Account    (LinkedAccountId)
  └── (1:N)    → Invitation
```

---

## Yasaklar

- ❌ Public setter — constructor / factory üzerinden domain'e giriş zorunlu.
- ❌ `Person` aggregate'i içinden `RoleAssignment` veya `Invitation` collection'ı tutmak — bunlar ayrı AR'lar, sadece ID üzerinden referans.
- ❌ Domain'de EF Core attribute (Fluent API'de `Infrastructure/Persistence/Configurations/`).
- ❌ DataAnnotations.
- ❌ TCKN'i plain text saklamak — `NationalIdHash` (deterministik) + `NationalIdEncrypted` (AES-GCM) zorunlu.
- ❌ Domain event payload'ında TCKN, parola, token plain text.
- ❌ Profile entity'lerini Person'dan bağımsız repository ile çekmek — AR root'tan inilir.
- ❌ Cross-tenant referans: `RoleAssignment.PersonId` ile `SystemRole.SchoolId` farklı tenant'tan gelemez (master rol ise SchoolId yoktur; tenant entity ise eşleşmek zorunda).

> Genel domain kuralları için bkz. `backend/domain-model-rules.md`.
