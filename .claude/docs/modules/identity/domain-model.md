# Kimlik Doğrulama — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, aggregate root'lar, invariants, domain event'ler.

---

## Master Entity'ler (tenant-agnostik)

Hepsi `MasterEntity` taban sınıfından türer (`Audit + SoftDelete + RowVersion`). Tüm tenantlar paylaşır.

### `SystemRole`

**Sorumluluk:** Platform genelinde tanımlı sabit rol. JWT claim'lerindeki `role` alanı bu entity'nin `Code` değerini taşır.

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK (deterministik MD5 seed) |
| `Code` | `string` | Makine okunabilir kod (örn. "SCHOOL_ADMIN"), unique |
| `DisplayName` | `string` | UI ad (Türkçe) |
| `PortalType` | `PortalType` enum | Platform/Admin/Teacher/Parent/Student — login sonrası layout |
| `IsSystem` | `bool` | True ise silinemez/kodu değiştirilemez |
| `Description` | `string?` | Açıklama |

**Davranış:** `Create(id, code, displayName, portalType, isSystem, description?)` — Static factory.

### `Permission`

**Sorumluluk:** Tüm korumalı endpoint'lerin authorization policy anahtarı.

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `Module` | `string` | Modül adı (örn. "USERS", "SCHOOL_SETTINGS") — UPPER_CASE |
| `Action` | `string` | Aksiyon (örn. "READ", "WRITE", "VIEW") — UPPER_CASE |
| `Code` | `string` | `{module}.{action}` formatı, lower-case (örn. "users.read"), unique |
| `Description` | `string` | Açıklama |

**Davranış:** `Create(id, module, action, code, description)`.

### `RolePermission`

**Sorumluluk:** SystemRole ↔ Permission çoka-çok join (platform-default).

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK (`SeedGuid.From($"rp:{roleId:N}:{permissionId:N}")`) |
| `RoleId` | `Guid` | FK |
| `PermissionId` | `Guid` | FK |

**Davranış:** `Create(id, roleId, permissionId)`.

---

## Enum'lar

### `PortalType`

```csharp
public enum PortalType
{
    Platform = 0,  // Süper admin
    Admin = 1,     // SchoolAdmin, VicePrincipal
    Teacher = 2,   // Teacher, Counselor
    Parent = 3,
    Student = 4
}
```

EF Core'da `HasConversion<string>()` ile string olarak persist edilir (snapshot stabilitesi).

---

## Tenant Entity'ler (Sprint 1+ — planlanan)

Henüz uygulanmamış; planlanan:

### `User` (TenantEntity)

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `SchoolId` | `Guid` | Tenant FK |
| `Email` | `Email` (VO) | Cross-tenant unique (planlanan) |
| `FirstName`, `LastName` | `string` | |
| `PhoneNumber` | `PhoneNumber?` (VO) | |
| `PasswordHash` | `string` | Argon2id |
| `Status` | `UserStatus` enum | Active/Locked/Disabled |
| `LockedUntil` | `DateTimeOffset?` | 5 fail → 15 dk lock |
| `LastLoginAt` | `DateTimeOffset?` | |

### `UserRole` (TenantEntity)

`(SchoolId, UserId, RoleId)` unique. Kullanıcının okul içindeki rollerini taşır (bir kullanıcı birden fazla rol alabilir).

### `RefreshToken` (TenantEntity)

JWT refresh token rotasyonu için. `Token` hash'lenmiş tutulur, kullanılınca revoke + yenisi üretilir.

---

## Invariants

- `SystemRole.Code` immutable (JWT claim bağımlılığı).
- `Permission.Code` formatı `{module-lower}.{action-lower}` zorunlu.
- Bir okul içinde aynı kullanıcı aynı role iki kez atanamaz (`(SchoolId, UserId, RoleId)` unique).
- `RefreshToken.RevokedAt` set edildiyse `IsRevoked = true`.

---

## Domain Event'ler (Sprint 1+)

- `UserInvitedEvent(UserId, Email, InvitedByUserId)` → davet e-postası
- `UserPasswordResetRequestedEvent(UserId)` → reset token e-postası
- `UserAccountLockedEvent(UserId, Reason)` → admin uyarısı
- `LoginFromNewDeviceEvent(UserId, DeviceInfo)` → kullanıcı uyarısı

> Detay: `notifications.md` (bu klasörde) ve `notification-matrix.md`.

---

## Seed Data

Migration `20260523222901_add_global_seed_master_data` ile:
- 7 `SystemRole` (deterministik MD5 GUID)
- 22 `Permission`
- 56 `RolePermission` (default matrix)

Migration `20260523224508_add_school_settings_permissions` ile:
- +10 `Permission` (SCHOOL_SETTINGS modülü)
- +10 `RolePermission` (SCHOOL_ADMIN bağı)

**Toplam:** 7 + 32 + 66 = **105 satır** Identity master data.
