# Kimlik Doğrulama — Database Schema

> Bu modülün tabloları, kolonları, FK, index ve constraint'leri.
> Tenant tabloları kaynağı: teknik analiz Bölüm 11. **Cross-module FK kurulmaz** (`person_id`, `school_id`, `season_id` salt Id).
> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Master Tablolar (tenant-agnostik) — UYGULANMIŞ

Platform genelinde paylaşılır; `SchoolId` taşımaz. Migration `20260523222901` ile `HasData()` seed. Deterministik GUID'ler (`SeedGuid.From(...)` → MD5) sayesinde FK ilişkileri stabil.

### `system_roles` (7 satır seed)
SUPER_ADMIN, SCHOOL_ADMIN, VICE_PRINCIPAL, TEACHER, COUNSELOR, PARENT, STUDENT. Kolonlar: `id, code, display_name, portal_type, is_system, description` + audit/soft-delete/row_version. `ux_system_roles_code` unique (where is_deleted=0).

### `permissions` (32 satır seed)
`id, module, action, code ({module}.{action} lower), description` + audit standardı. `ux_permissions_code` unique, `ix_permissions_module_action`.

### `role_permissions` (66 satır seed)
`id, role_id, permission_id` + audit. FK → system_roles, permissions (`DeleteBehavior.Restrict`). `ux_role_permissions_role_permission` unique. `Id = SeedGuid.From($"rp:{roleId:N}:{permissionId:N}")`.

---

## Tenant Tablolar — HEDEF (schema: `identity`)

> EF Core code-first, Fluent API (attribute yok). Karmaşık/yüksek hacimli lookup'larda Dapper. Anlık lockout/rate-limit Redis'te; kalıcı `failed_login_count`/`locked_until` DB'de denetim için yedeklenir.

### `identity.accounts`

```sql
CREATE TABLE identity.accounts (
    id                       UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    person_id                UNIQUEIDENTIFIER NOT NULL,   -- users.persons.id (Id ref, FK YOK)
    school_id                UNIQUEIDENTIFIER NOT NULL,
    password_hash            NVARCHAR(512)    NOT NULL,
    last_active_profile_type NVARCHAR(64)     NULL,
    last_active_child_id     UNIQUEIDENTIFIER NULL,
    last_login_at            DATETIMEOFFSET   NULL,
    last_login_ip            NVARCHAR(64)     NULL,
    failed_login_count       INT              NOT NULL DEFAULT 0,
    locked_until             DATETIMEOFFSET   NULL,
    require_password_change  BIT              NOT NULL DEFAULT 0,
    two_factor_enabled       BIT              NOT NULL DEFAULT 0,
    is_active                BIT              NOT NULL DEFAULT 1,
    password_policy_version  INT              NOT NULL DEFAULT 1,
    consent_bundle_version   INT              NULL,
    created_at               DATETIMEOFFSET   NOT NULL,
    updated_at               DATETIMEOFFSET   NOT NULL,
    row_version              ROWVERSION
);
CREATE UNIQUE INDEX ux_accounts_person ON identity.accounts(person_id);
CREATE INDEX ix_accounts_school ON identity.accounts(school_id);
```

### `identity.refresh_tokens`

```sql
CREATE TABLE identity.refresh_tokens (
    id                      UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    account_id              UNIQUEIDENTIFIER NOT NULL,
    token_hash              NVARCHAR(256)    NOT NULL,    -- plain saklanmaz
    expires_at              DATETIMEOFFSET   NOT NULL,
    created_at              DATETIMEOFFSET   NOT NULL,
    created_by_ip           NVARCHAR(64)     NULL,
    revoked_at              DATETIMEOFFSET   NULL,
    revoked_by_ip           NVARCHAR(64)     NULL,
    replaced_by_token_hash  NVARCHAR(256)    NULL,        -- rotation zinciri / reuse detection
    device_label            NVARCHAR(128)    NULL,
    CONSTRAINT fk_rt_account FOREIGN KEY (account_id) REFERENCES identity.accounts(id)
);
CREATE INDEX ix_rt_account_active ON identity.refresh_tokens(account_id) WHERE revoked_at IS NULL;
CREATE INDEX ix_rt_token_hash ON identity.refresh_tokens(token_hash);
```

### `identity.password_reset_tokens` (tek kullanımlık)
`id, account_id, token_hash, channel (Email/Sms), expires_at, consumed_at`. Token hash'li. *(mevcut kodda iskelet var)*

### `identity.otp_challenges` (Sprint 5 iskeleti)
`id, account_id, code_hash, purpose (Login/Reset), attempts, expires_at`.

### `identity.login_audit` (opsiyonel sıcak kopya)
Asıl audit Elasticsearch'te (Bölüm 13); bu tablo isteğe bağlı yerel sıcak kopya.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | system_roles, permissions, role_permissions ilk seed |
| 2026-05-24 | `20260523224508_add_school_settings_permissions` | +10 SCHOOL_SETTINGS izni + bağ |
| 2026-05-24 | `20260524121808_add_invitation_tokens` | davet token tablosu (mevcut User akışı) |
| {{TBD}} | `*_add_identity_accounts` | `identity.accounts`, `refresh_tokens` (HEDEF) |
| {{TBD}} | `*_add_identity_password_reset_otp` | reset + otp tabloları (HEDEF) |

---

## Yasaklar

- ❌ Cross-module FK (`person_id`, `school_id`, `season_id` salt Id).
- ❌ `system_roles.code` değiştirme (JWT claim bağımlılığı).
- ❌ Refresh/reset/otp token'ı plain saklamak (her zaman hash).
- ❌ `role_permissions` cascade delete (`Restrict` zorunlu).
- ❌ Master tablodan satır DELETE (soft-delete tercih).

> Detay: `backend/database-rules.md`.
