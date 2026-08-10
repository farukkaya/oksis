# Kimlik Doğrulama — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, aggregate root'lar, invariants, domain event'ler.
> Hedef tasarım kaynağı: teknik analiz Bölüm 3. Yerleşim: `Oksis.Domain/Modules/Identity` (modüler monolit — teknik analizdeki ayrı `Oksis.Identity.Domain` projesi **bu repoda alt klasör** olarak uygulanır; bkz. `open-questions.md` OQ-identity-002).

---

## Master Entity'ler (tenant-agnostik)

Hepsi `MasterEntity` taban sınıfından türer (`Audit + SoftDelete + RowVersion`). Tüm tenantlar paylaşır. **Bunlar zaten uygulanmış ve seed edilmiştir** (bkz. `database-schema.md`).

### `SystemRole`

**Sorumluluk:** Platform genelinde tanımlı sabit rol. JWT claim'lerindeki `role` alanı bu entity'nin `Code` değerini taşır.

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK (deterministik MD5 seed) |
| `Code` | `string` | Makine okunabilir kod (örn. "SCHOOL_ADMIN"), unique, **immutable** |
| `DisplayName` | `string` | UI ad (Türkçe) |
| `PortalType` | `PortalType` enum | Platform/Admin/Teacher/Parent/Student |
| `IsSystem` | `bool` | True ise silinemez/kodu değiştirilemez |
| `Description` | `string?` | Açıklama |

### `Permission`

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `Module` | `string` | UPPER_CASE modül adı |
| `Action` | `string` | UPPER_CASE aksiyon |
| `Code` | `string` | `{module}.{action}` lower-case, unique |
| `Description` | `string` | Açıklama |

### `RolePermission`

SystemRole ↔ Permission çoka-çok join. `Id = SeedGuid.From($"rp:{roleId:N}:{permissionId:N}")` — deterministik.

---

## Account Aggregate Root (tenant entity — hedef model)

> **Karar notu:** Teknik analiz, authentication ve oturum durumunun tek sahibi olarak `Account` aggregate'ini tanımlar; `users.persons` ile `LinkedAccountId` köprüsüyle ilişkilenir (FK kurulmaz). Mevcut kodda bu sorumluluk `User` entity'sindedir. `User` → `Account` geçişi / uzlaştırma kararı OQ-identity-001'de. Aşağıdaki tasarım **hedef** modeldir.

`Account`, `TenantEntity`'den türer (`SchoolId` + Audit + SoftDelete + RowVersion). `PersonId` ve `SchoolId` yalnızca **referans Id**'dir — cross-module FK kurulmaz.

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `AccountId` (Guid VO) | Aggregate kimliği |
| `PersonId` | `Guid` | `users.persons` referansı (FK değil, Id) |
| `SchoolId` | `Guid` | Tenant referansı |
| `PasswordHash` | `PasswordHash` (VO) | Argon2id hash + salt + parametreler (TQ-auth-003) |
| `LastActiveProfileType` | `string?` | Switch sonrası güncellenir |
| `LastActiveChildId` | `Guid?` | Parent için default çocuk |
| `LastLoginAt` | `DateTimeOffset?` | Audit + dormant tespiti |
| `LastLoginIp` | `string?` | Anomali tespiti |
| `FailedLoginCount` | `int` | Lockout sayacı (DB yedeği; anlık değer Redis'te) |
| `LockedUntil` | `DateTimeOffset?` | Lockout bitişi |
| `RequirePasswordChange` | `bool` | Admin reset / politika değişimi |
| `TwoFactorEnabled` | `bool` | TOTP aktif mi (Sprint 6) |
| `IsActive` | `bool` | Identity-level suspend bayrağı |
| `PasswordPolicyVersion` | `int` | Politika değişti mi karşılaştırması |
| `ConsentBundleVersion` | `int?` | Onaylanan bundle versiyonu |

**Davranışlar (anemic model değil — domain method'ları):**
- `RegisterSuccessfulLogin(ip, profileType, now)` → sayaç sıfırlar, `LastLogin*` günceller, `LoginSucceeded` event üretir.
- `RegisterFailedLogin(now, policy)` → `FailedLoginCount++`, eşik aşılırsa `LockedUntil` set eder, `AccountLocked` event üretir.
- `IsCurrentlyLocked(now)` → bool.
- `Unlock(byPersonId)` → admin müdahalesi.
- `ChangePassword(newHash, now)` → `RequirePasswordChange=false`, `PasswordChanged` event, **tüm refresh token revoke** sinyali.
- `RecordActiveProfile(profileType)` / `RecordActiveChild(childId)`.

> Parola doğrulama (`Verify`) domain'de değil, `IPasswordHasher` portu üzerinden Application'da çağrılır; domain saf kalır.

---

## RefreshToken Entity (Account altında)

| Property | Tip | Açıklama |
|---|---|---|
| `Id` | `Guid` | PK |
| `AccountId` | `AccountId` | Sahip (FK) |
| `TokenHash` | `string` | Token DB'de **plain tutulmaz**, hash'lenir |
| `ExpiresAt` | `DateTimeOffset` | |
| `CreatedAt` / `CreatedByIp` | | |
| `RevokedAt` / `RevokedByIp` | `?` | |
| `ReplacedByTokenHash` | `string?` | Rotation zinciri (reuse detection) |
| `DeviceLabel` | `string?` | Eş zamanlı oturum limiti için |

---

## Diğer Entity / Value Object

- **`PasswordResetToken`** — tek kullanımlık, kısa ömürlü (örn. 30 dk), `Channel` (Email/Sms), `ConsumedAt`. *(mevcut kodda iskelet var)*
- **`OtpChallenge`** — Sprint 5 iskeleti: `Code` (hash), `Purpose` (Login/Reset), `Attempts`, `ExpiresAt`.
- **Value Objects:** `AccountId`, `Identifier` (raw + `IdentifierType`), `NationalIdHash` (tenant-tuzlu hash), `PasswordHash`.

---

## Enum'lar

### `PortalType` (mevcut)

```csharp
public enum PortalType { Platform = 0, Admin = 1, Teacher = 2, Parent = 3, Student = 4 }
```
EF Core'da `HasConversion<string>()` ile persist edilir.

### Yeni enum'lar (hedef)

```csharp
public enum IdentifierType { Email, Phone, Tckn, Unknown }
public enum LoginFailureReason { NotFound, BadPassword, Locked, RateLimited, Suspended, ConsentRequired }
public enum LogoutReason { Manual, Expired, Suspended, ConsentRevoked, PasswordChanged }
```

---

## Invariants

- `SystemRole.Code` immutable (JWT claim bağımlılığı).
- `Permission.Code` formatı `{module-lower}.{action-lower}` zorunlu.
- `Account` ↔ `Person` 1:1 (`ux_accounts_person` unique).
- `Account.SchoolId` immutable (tenant interceptor).
- Login akışında **TCKN reddedilir** (TR-auth-002); recovery'de tenant-tuzlu hash ile aranır.
- `RefreshToken.RevokedAt` set edildiyse token kullanılamaz; reuse tespitinde tüm zincir revoke edilir.

---

## Domain Event'ler

`LoginSucceeded`, `LoginFailed`, `AccountLocked`, `PasswordChanged`, `PasswordResetRequested`, `ProfileSwitched`, `ChildContextSwitched`, `SeasonSwitched`, `LoggedOut`, `AllSessionsLoggedOut`, `SuspiciousTokenReuse`, `PermissionDenied`, `LoginBlockedDueToSuspension`.

Bunlar MediatR `INotification` olarak yayınlanır; audit handler'ları Elasticsearch'e yazar (bkz. `notifications.md`). Domain event'ler **altyapı tipi taşımaz**.

> **Not:** `ConsentRecord` ve `Person.LifecycleState` **users** modülünün domain'inde yaşar. Identity bunları read-port üzerinden **okur**, sahiplenmez.

---

## Seed Data (mevcut)

| Migration | İçerik |
|---|---|
| `20260523222901_add_global_seed_master_data` | 7 `SystemRole`, 22 `Permission`, 56 `RolePermission` |
| `20260523224508_add_school_settings_permissions` | +10 `Permission` (SCHOOL_SETTINGS), +10 `RolePermission` |

**Toplam:** 7 + 32 + 66 = **105 satır** Identity master data.
