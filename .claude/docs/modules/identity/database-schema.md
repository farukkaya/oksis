# Kimlik Doğrulama — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Master Tablolar (tenant-agnostik)

Bu üç tablo platform genelinde paylaşılır; `SchoolId` taşımaz. Migration `20260523222901_add_global_seed_master_data` ile HasData() üzerinden seed edilir. Deterministik GUID'ler (`SeedGuid.From("role:SCHOOL_ADMIN")` → MD5 hash) sayesinde migration tekrar üretilse FK ilişkileri bozulmaz.

### `system_roles` (7 satır seed)

```sql
CREATE TABLE system_roles (
    id            uniqueidentifier  not null  constraint pk_system_roles primary key,
    code          nvarchar(50)      not null,
    display_name  nvarchar(100)     not null,
    portal_type   nvarchar(30)      not null,  -- Platform | Admin | Teacher | Parent | Student
    is_system     bit               not null,
    description   nvarchar(300)     null,
    created_at    datetimeoffset    not null,
    created_by    uniqueidentifier  not null,
    updated_at    datetimeoffset    null,
    updated_by    uniqueidentifier  null,
    is_deleted    bit               not null  constraint df_system_roles_is_deleted default 0,
    deleted_at    datetimeoffset    null,
    deleted_by    uniqueidentifier  null,
    row_version   rowversion        not null
);

CREATE UNIQUE INDEX ux_system_roles_code
  ON system_roles(code) WHERE is_deleted = 0;
```

**Seed satırları:** SUPER_ADMIN, SCHOOL_ADMIN, VICE_PRINCIPAL, TEACHER, COUNSELOR, PARENT, STUDENT.

### `permissions` (32 satır seed = 22 başlangıç + 10 school-settings)

```sql
CREATE TABLE permissions (
    id           uniqueidentifier  not null  constraint pk_permissions primary key,
    module       nvarchar(50)      not null,
    action       nvarchar(50)      not null,
    code         nvarchar(100)     not null,  -- {module}.{action} lower-case
    description  nvarchar(300)     not null,
    -- audit & soft delete standartı (created_at/by, updated_at/by, is_deleted, deleted_at/by, row_version)
);

CREATE UNIQUE INDEX ux_permissions_code
  ON permissions(code) WHERE is_deleted = 0;

CREATE INDEX ix_permissions_module_action
  ON permissions(module, action);
```

**Modül başına dağılım:** USERS (5), ATTENDANCE (2), GRADES (3), SCHEDULE (2), ANNOUNCEMENTS (2), REPORTS (2), SETTINGS (2), DUTY (2), HOMEWORK (2), SCHOOL_SETTINGS (10).

### `role_permissions` (66 satır seed)

```sql
CREATE TABLE role_permissions (
    id             uniqueidentifier  not null  constraint pk_role_permissions primary key,
    role_id        uniqueidentifier  not null,
    permission_id  uniqueidentifier  not null,
    -- audit & soft delete standartı

    constraint fk_role_permissions_system_roles_role_id
      foreign key (role_id) references system_roles(id),
    constraint fk_role_permissions_permissions_permission_id
      foreign key (permission_id) references permissions(id)
);

CREATE UNIQUE INDEX ux_role_permissions_role_permission
  ON role_permissions(role_id, permission_id) WHERE is_deleted = 0;
```

**Dağılım:** SCHOOL_ADMIN: 32, VICE_PRINCIPAL: 12, TEACHER: 8, COUNSELOR: 4, PARENT: 4, STUDENT: 5.

**Join ID stratejisi:** `Id = SeedGuid.From($"rp:{roleId:N}:{permissionId:N}")` — deterministik, idempotent.

---

## Tenant Tablolar (Sprint 1+ — planlanan)

Henüz oluşturulmamış:
- `users` — kullanıcı kaydı (`SchoolId` taşır, email global unique)
- `user_roles` — kullanıcı ↔ rol bağı (`SchoolId` + `UserId` + `RoleId`)
- `refresh_tokens` — JWT refresh token rotasyonu (hash'li token, revoked_at)

> Detay tasarım: `domain-model.md`.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | `system_roles`, `permissions`, `role_permissions` ilk seed (22 izin) |
| 2026-05-24 | `20260523224508_add_school_settings_permissions` | +10 `SCHOOL_SETTINGS` izni + SCHOOL_ADMIN bağı |

---

## Yasaklar

- ❌ `system_roles.code` değiştirme — JWT claim bağımlılığı, eski token'lar bozulur.
- ❌ `role_permissions` cascade delete — `OnDelete(DeleteBehavior.Restrict)` zorunlu.
- ❌ Master tablodan satır DELETE etmek — `IsDeleted = 1` soft-delete tercih.
- ❌ HasData() seed satırlarında dinamik `CreatedAt` — `SeedAudit.CreatedAt` sabit `2026-05-24 00:00:00 UTC`.

> Detay: `backend/database-rules.md`.
