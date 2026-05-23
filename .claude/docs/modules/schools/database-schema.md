# Okul / Tenant Yönetimi — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Tablolar

### `schools` (tenant root, kendisi tenant olduğu için `IHasTenant` değil)

```sql
CREATE TABLE schools (
    id           uniqueidentifier  not null  constraint pk_schools primary key,
    name         nvarchar(200)     not null,
    code         nvarchar(50)      not null,   -- global unique, "ATA-IST" gibi
    type         int               not null,   -- SchoolType enum
    status       int               not null,   -- TenantStatus enum (Setup/Active/Suspended/Archived)
    plan         int               not null,   -- PlanCode enum (Free/Standard/Premium)
    time_zone    nvarchar(100)     not null,   -- IANA, default "Europe/Istanbul"
    created_at   datetimeoffset    not null,
    created_by   uniqueidentifier  not null,
    updated_at   datetimeoffset    null,
    updated_by   uniqueidentifier  null,
    row_version  rowversion        not null
);

CREATE UNIQUE INDEX ux_schools_code ON schools(code);
```

> Soft delete YOK — okul `Archived` statüsüyle terminal hale getirilir, satır silinmez.

### `school_onboarding_status` (tenant — bu çalışmada eklenen Layer 3 tablosu)

```sql
CREATE TABLE school_onboarding_status (
    id            uniqueidentifier  not null  constraint pk_school_onboarding_status primary key,
    school_id     uniqueidentifier  not null,
    step          nvarchar(30)      not null,   -- SchoolInfo|GradeSetup|TeacherImport|StudentImport|ScheduleSetup|Publish
    status        nvarchar(30)      not null,   -- Pending|InProgress|Completed|Skipped
    started_at    datetimeoffset    null,
    completed_at  datetimeoffset    null,
    notes         nvarchar(500)     null,
    created_at    datetimeoffset    not null,
    created_by    uniqueidentifier  not null,
    updated_at    datetimeoffset    null,
    updated_by    uniqueidentifier  null,
    is_deleted    bit               not null  constraint df_school_onboarding_status_is_deleted default 0,
    deleted_at    datetimeoffset    null,
    deleted_by    uniqueidentifier  null,
    row_version   rowversion        not null
);

CREATE UNIQUE INDEX ux_school_onboarding_status_school_step
  ON school_onboarding_status(school_id, step) WHERE is_deleted = 0;

CREATE INDEX ix_school_onboarding_status_school_id
  ON school_onboarding_status(school_id) WHERE is_deleted = 0;
```

**Otomatik seed:** Yeni okul oluştuğunda `SchoolCreatedOnboardingStatusHandler` (MediatR `INotificationHandler<DomainEventNotification<SchoolCreatedEvent>>`) **6 satır** üretir — her bir `OnboardingStep` enum değeri için Pending durumunda. Idempotent (var olanlar atlanır).

### İlgili tenant tablolar

Bu modüle bağlı diğer okul-yapılandırma tabloları `school-settings` modülünde detaylandırılmıştır:

- `school_settings` — 1:1 `schools` (BR-SS-001)
- `school_bell_schedules`
- `school_holidays`
- `school_module_configs`
- `school_notification_configs`

> Detay: `modules/school-settings/database-schema.md`.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-15 | İlk `schools` tablosu (önceki sprint) | — |
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | `school_onboarding_status` tablosu (seed YOK, tenant init runtime'da) |

---

## Yasaklar

- ❌ `schools` satırını hard delete — `status = Archived` ile terminal.
- ❌ `SchoolId` değiştirme — `TenantSaveChangesInterceptor` enforce eder.
- ❌ `school_onboarding_status` satırını manuel insert — handler üretir.
- ❌ `school_id` taşımayan tenant tablosu (bu modülde sadece `schools` istisna — kendisi tenant root).

> Detay: `backend/database-rules.md`.
