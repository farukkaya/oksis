# Kullanıcı Yönetimi — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

> **Konvansiyon:** snake_case tablo/kolon, `nvarchar` (unicode), `datetimeoffset` (UTC), `uniqueidentifier` PK, soft delete (`is_deleted` + `deleted_at` + `deleted_by`), optimistic concurrency (`row_version`).

---

## Genel Audit & Tenant Kolonları

Aşağıdaki tablo örneklerinde **her tabloda tekrar eden** standart kolonlar kısaltma olarak `-- AUDIT --` ile gösterilmiştir. Tam haliyle:

```sql
created_at      datetimeoffset    not null,
created_by      uniqueidentifier  not null,
updated_at      datetimeoffset    null,
updated_by      uniqueidentifier  null,
is_deleted      bit               not null  constraint df_{table}_is_deleted default 0,
deleted_at      datetimeoffset    null,
deleted_by      uniqueidentifier  null,
row_version     rowversion        not null
```

---

## Tablolar

### `persons`

Modülün **birincil aggregate root** tablosu. Bir okul ekosistemine ait bir kişiyi temsil eder. Login credential burada değildir (`identity.accounts` üzerinden bağlanır).

```sql
CREATE TABLE persons (
    id                       uniqueidentifier  not null  constraint pk_persons primary key,
    school_id                uniqueidentifier  not null,
    first_name               nvarchar(100)     not null,
    last_name                nvarchar(100)     not null,
    gender                   nvarchar(20)      not null,
    birth_date               date              null,
    national_id_hash         varbinary(32)     null,
    national_id_encrypted    varbinary(256)    null,
    primary_email            nvarchar(320)     null,
    primary_phone            nvarchar(20)      null,
    lifecycle_state          nvarchar(20)      not null  constraint df_persons_lifecycle_state default 'Draft',
    linked_account_id        uniqueidentifier  null,
    -- AUDIT --
);
```

**Index'ler:**

```sql
-- Tenant filtre (zorunlu, her sorgu burayı kullanır)
CREATE INDEX ix_persons_school_id
  ON persons(school_id)
  WHERE is_deleted = 0;

-- Aynı okulda TCKN tekrarını engellemek için
CREATE UNIQUE INDEX ux_persons_school_id_national_id_hash
  ON persons(school_id, national_id_hash)
  WHERE is_deleted = 0 AND national_id_hash IS NOT NULL;

-- Email ile arama (tenant scope'lu)
CREATE INDEX ix_persons_school_id_primary_email
  ON persons(school_id, primary_email)
  WHERE is_deleted = 0 AND primary_email IS NOT NULL;

-- Lifecycle state filtresi (admin listeleri için)
CREATE INDEX ix_persons_school_id_lifecycle_state
  ON persons(school_id, lifecycle_state)
  WHERE is_deleted = 0;

-- Ad-soyad arama (admin paneli search)
CREATE INDEX ix_persons_school_id_last_name_first_name
  ON persons(school_id, last_name, first_name)
  WHERE is_deleted = 0;
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `linked_account_id` | `identity.accounts(id)` | `SET NULL` |

**Check Constraint'ler:**

```sql
ALTER TABLE persons
ADD CONSTRAINT ck_persons_lifecycle_state
  CHECK (lifecycle_state IN
    ('Draft','Invited','Active','Suspended','Graduated','Transferred','Archived'));

ALTER TABLE persons
ADD CONSTRAINT ck_persons_gender
  CHECK (gender IN ('Male','Female','Unspecified'));

ALTER TABLE persons
ADD CONSTRAINT ck_persons_birth_date_range
  CHECK (birth_date IS NULL OR (birth_date > '1900-01-01' AND birth_date <= GETUTCDATE()));
```

---

### `student_profiles`

```sql
CREATE TABLE student_profiles (
    person_id            uniqueidentifier  not null  constraint pk_student_profiles primary key,
    school_id            uniqueidentifier  not null,
    student_number       nvarchar(50)      not null,
    previous_school      nvarchar(200)     null,
    blood_type           nvarchar(5)       null,
    emergency_contact_name   nvarchar(150) null,
    emergency_contact_phone  nvarchar(20)  null,
    emergency_contact_relation nvarchar(50) null,
    enrolled_at          date              not null,
    graduated_at         date              null,
    is_active_student    bit               not null  constraint df_student_profiles_is_active_student default 1,
    -- AUDIT --
);
```

**Index'ler:**

```sql
CREATE UNIQUE INDEX ux_student_profiles_school_id_student_number
  ON student_profiles(school_id, student_number)
  WHERE is_deleted = 0;

CREATE INDEX ix_student_profiles_school_id
  ON student_profiles(school_id)
  WHERE is_deleted = 0;
```

**FK:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `person_id` | `persons(id)` | `CASCADE` (profile Person'a sıkı bağlı) |
| `school_id` | `schools(id)` | `NO ACTION` |

---

### `teacher_profiles`

```sql
CREATE TABLE teacher_profiles (
    person_id              uniqueidentifier  not null  constraint pk_teacher_profiles primary key,
    school_id              uniqueidentifier  not null,
    employee_number        nvarchar(50)      not null,
    branch                 nvarchar(100)     not null,
    contract_type          nvarchar(20)      not null,
    meb_registry_number    nvarchar(50)      null,
    education_level        nvarchar(30)      null,
    hired_at               date              not null,
    terminated_at          date              null,
    -- AUDIT --
);
```

**Index'ler:**

```sql
CREATE UNIQUE INDEX ux_teacher_profiles_school_id_employee_number
  ON teacher_profiles(school_id, employee_number)
  WHERE is_deleted = 0;

CREATE INDEX ix_teacher_profiles_school_id_branch
  ON teacher_profiles(school_id, branch)
  WHERE is_deleted = 0;
```

**Check:**

```sql
ALTER TABLE teacher_profiles
ADD CONSTRAINT ck_teacher_profiles_contract_type
  CHECK (contract_type IN ('FullTime','PartTime','Hourly','Substitute'));
```

---

### `parent_profiles`

```sql
CREATE TABLE parent_profiles (
    person_id          uniqueidentifier  not null  constraint pk_parent_profiles primary key,
    school_id          uniqueidentifier  not null,
    occupation         nvarchar(100)     null,
    work_place         nvarchar(200)     null,
    address_line1      nvarchar(200)     null,
    address_line2      nvarchar(200)     null,
    city               nvarchar(100)     null,
    district           nvarchar(100)     null,
    postal_code        nvarchar(20)      null,
    country            nvarchar(50)      not null  constraint df_parent_profiles_country default N'Türkiye',
    marital_status     nvarchar(20)      null,
    -- AUDIT --
);
```

**Check:**

```sql
ALTER TABLE parent_profiles
ADD CONSTRAINT ck_parent_profiles_marital_status
  CHECK (marital_status IS NULL OR marital_status IN ('Married','Divorced','Widowed','Single','Other'));
```

---

### `staff_profiles`

```sql
CREATE TABLE staff_profiles (
    person_id          uniqueidentifier  not null  constraint pk_staff_profiles primary key,
    school_id          uniqueidentifier  not null,
    department         nvarchar(100)     not null,
    employee_number    nvarchar(50)      not null,
    contract_type      nvarchar(20)      not null,
    -- AUDIT --
);
```

**Index:**

```sql
CREATE UNIQUE INDEX ux_staff_profiles_school_id_employee_number
  ON staff_profiles(school_id, employee_number)
  WHERE is_deleted = 0;
```

---

### `parent_student_relationships`

**Many-to-many bağlayıcı + yetki tipleri.** Bir öğrencinin birden fazla velisi olabilir; bir velinin birden fazla öğrencisi olabilir.

```sql
CREATE TABLE parent_student_relationships (
    id                        uniqueidentifier  not null  constraint pk_parent_student_relationships primary key,
    school_id                 uniqueidentifier  not null,
    parent_person_id          uniqueidentifier  not null,
    student_person_id         uniqueidentifier  not null,
    relation_type             nvarchar(30)      not null,
    can_view_info             bit               not null  constraint df_psr_can_view_info default 1,
    can_make_decisions        bit               not null  constraint df_psr_can_make_decisions default 1,
    is_payment_responsible    bit               not null  constraint df_psr_is_payment_responsible default 0,
    can_pickup                bit               not null  constraint df_psr_can_pickup default 1,
    is_primary_contact        bit               not null  constraint df_psr_is_primary_contact default 0,
    valid_from                date              not null,
    valid_until               date              null,
    -- AUDIT --
);
```

**Index'ler:**

```sql
CREATE UNIQUE INDEX ux_psr_school_parent_student
  ON parent_student_relationships(school_id, parent_person_id, student_person_id)
  WHERE is_deleted = 0;

CREATE INDEX ix_psr_school_id_student_person_id
  ON parent_student_relationships(school_id, student_person_id)
  WHERE is_deleted = 0;

CREATE INDEX ix_psr_school_id_parent_person_id
  ON parent_student_relationships(school_id, parent_person_id)
  WHERE is_deleted = 0;

-- Birincil iletişim hızlı sorgu (bildirim yönlendirme)
CREATE INDEX ix_psr_school_student_primary_contact
  ON parent_student_relationships(school_id, student_person_id)
  INCLUDE (parent_person_id, is_primary_contact)
  WHERE is_deleted = 0 AND is_primary_contact = 1;
```

**FK:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `parent_person_id` | `persons(id)` | `NO ACTION` |
| `student_person_id` | `persons(id)` | `NO ACTION` |

**Check:**

```sql
ALTER TABLE parent_student_relationships
ADD CONSTRAINT ck_psr_not_self
  CHECK (parent_person_id <> student_person_id);

ALTER TABLE parent_student_relationships
ADD CONSTRAINT ck_psr_valid_range
  CHECK (valid_until IS NULL OR valid_until >= valid_from);

ALTER TABLE parent_student_relationships
ADD CONSTRAINT ck_psr_relation_type
  CHECK (relation_type IN ('Mother','Father','Guardian','Grandparent','Stepparent','Sibling','Other'));
```

---

### `role_assignments`

**Sezona bağlı rol atamaları.** `SystemRole` master tablosu `identity` modülündedir; burası sadece atama köprüsüdür.

```sql
CREATE TABLE role_assignments (
    id                     uniqueidentifier  not null  constraint pk_role_assignments primary key,
    school_id              uniqueidentifier  not null,
    person_id              uniqueidentifier  not null,
    system_role_id         uniqueidentifier  not null,
    season_id              uniqueidentifier  not null,
    status                 nvarchar(20)      not null  constraint df_role_assignments_status default 'Active',
    assigned_at            datetimeoffset    not null,
    assigned_by_person_id  uniqueidentifier  not null,
    revoked_at             datetimeoffset    null,
    revoked_reason         nvarchar(500)     null,
    scope_attributes       nvarchar(max)     null,  -- JSON (ABAC)
    -- AUDIT --
);
```

**Index'ler:**

```sql
CREATE UNIQUE INDEX ux_role_assignments_person_role_season
  ON role_assignments(school_id, person_id, system_role_id, season_id)
  WHERE is_deleted = 0;

CREATE INDEX ix_role_assignments_school_id_season_id
  ON role_assignments(school_id, season_id)
  WHERE is_deleted = 0;

CREATE INDEX ix_role_assignments_school_id_person_id
  ON role_assignments(school_id, person_id)
  WHERE is_deleted = 0;

-- Aktif rolleri hızla çek (login sonrası token claim'leri için)
CREATE INDEX ix_role_assignments_school_person_active
  ON role_assignments(school_id, person_id)
  INCLUDE (system_role_id, season_id, scope_attributes)
  WHERE is_deleted = 0 AND status = 'Active';
```

**FK:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `person_id` | `persons(id)` | `NO ACTION` |
| `system_role_id` | `identity.system_roles(id)` | `NO ACTION` |
| `season_id` | `seasons(id)` | `NO ACTION` |

**Check:**

```sql
ALTER TABLE role_assignments
ADD CONSTRAINT ck_role_assignments_status
  CHECK (status IN ('Active','Inactive','Revoked'));

ALTER TABLE role_assignments
ADD CONSTRAINT ck_role_assignments_revoked_consistency
  CHECK ((status = 'Revoked' AND revoked_at IS NOT NULL)
      OR (status <> 'Revoked' AND revoked_at IS NULL));

ALTER TABLE role_assignments
ADD CONSTRAINT ck_role_assignments_scope_json
  CHECK (scope_attributes IS NULL OR ISJSON(scope_attributes) = 1);
```

---

### `invitations`

**Davet iş akışı.** Token plain text **asla** burada tutulmaz; sadece SHA-256 hash'i saklanır.

```sql
CREATE TABLE invitations (
    id                        uniqueidentifier  not null  constraint pk_invitations primary key,
    school_id                 uniqueidentifier  not null,
    person_id                 uniqueidentifier  not null,
    target_system_role_id     uniqueidentifier  not null,
    season_id                 uniqueidentifier  not null,
    token_hash                varbinary(32)     not null,
    channel                   nvarchar(20)      not null,
    expires_at                datetimeoffset    not null,
    status                    nvarchar(20)      not null  constraint df_invitations_status default 'Created',
    batch_id                  uniqueidentifier  null,
    sent_at                   datetimeoffset    null,
    opened_at                 datetimeoffset    null,
    accepted_at               datetimeoffset    null,
    revoked_at                datetimeoffset    null,
    revoked_reason            nvarchar(500)     null,
    retry_count               int               not null  constraint df_invitations_retry_count default 0,
    consent_bundle_version    nvarchar(50)      not null,
    -- AUDIT --
);
```

**Index'ler:**

```sql
-- Token lookup global unique (cross-tenant; token rakipsiz olmalı)
CREATE UNIQUE INDEX ux_invitations_token_hash
  ON invitations(token_hash)
  WHERE is_deleted = 0;

CREATE INDEX ix_invitations_school_id_person_id
  ON invitations(school_id, person_id)
  WHERE is_deleted = 0;

-- Aktif davetler (aynı PersonId + SeasonId için en fazla bir aktif kuralı buradan kontrol edilir)
CREATE INDEX ix_invitations_school_person_season_active
  ON invitations(school_id, person_id, season_id)
  INCLUDE (status)
  WHERE is_deleted = 0 AND status IN ('Created','Sent','Opened');

-- Toplu davet izleme
CREATE INDEX ix_invitations_school_id_batch_id
  ON invitations(school_id, batch_id)
  WHERE is_deleted = 0 AND batch_id IS NOT NULL;

-- Expiry sweep job'ı (Hangfire)
CREATE INDEX ix_invitations_expires_at_status
  ON invitations(expires_at)
  INCLUDE (id, school_id, status)
  WHERE is_deleted = 0 AND status IN ('Created','Sent','Opened');
```

**FK:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `person_id` | `persons(id)` | `NO ACTION` |
| `target_system_role_id` | `identity.system_roles(id)` | `NO ACTION` |
| `season_id` | `seasons(id)` | `NO ACTION` |

**Check:**

```sql
ALTER TABLE invitations
ADD CONSTRAINT ck_invitations_status
  CHECK (status IN ('Created','Sent','Opened','Accepted','Expired','Revoked'));

ALTER TABLE invitations
ADD CONSTRAINT ck_invitations_channel
  CHECK (channel IN ('Email','Sms','Both'));

ALTER TABLE invitations
ADD CONSTRAINT ck_invitations_expiry
  CHECK (expires_at > created_at AND DATEDIFF(day, created_at, expires_at) <= 30);
```

---

### `consent_records`

```sql
CREATE TABLE consent_records (
    id                  uniqueidentifier  not null  constraint pk_consent_records primary key,
    school_id           uniqueidentifier  not null,
    person_id           uniqueidentifier  not null,
    consent_type        nvarchar(50)      not null,
    bundle_version      nvarchar(50)      not null,
    status              nvarchar(20)      not null,
    granted_at          datetimeoffset    null,
    revoked_at          datetimeoffset    null,
    revoked_reason      nvarchar(500)     null,
    evidence_hash       varbinary(32)     not null,
    ip_address          nvarchar(45)      null,
    user_agent          nvarchar(500)     null,
    -- AUDIT --
);
```

**Index'ler:**

```sql
CREATE UNIQUE INDEX ux_consent_records_person_type_version
  ON consent_records(school_id, person_id, consent_type, bundle_version)
  WHERE is_deleted = 0;

CREATE INDEX ix_consent_records_school_id_person_id
  ON consent_records(school_id, person_id)
  WHERE is_deleted = 0;
```

**FK:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `person_id` | `persons(id)` | `NO ACTION` |

**Check:**

```sql
ALTER TABLE consent_records
ADD CONSTRAINT ck_consent_records_status
  CHECK (status IN ('Granted','Revoked','Expired'));

ALTER TABLE consent_records
ADD CONSTRAINT ck_consent_records_consent_type
  CHECK (consent_type IN
    ('DataProcessing','Marketing','PhotoUsage','MedicalSharing','ThirdPartyShare','SmsContact','EmailContact'));

ALTER TABLE consent_records
ADD CONSTRAINT ck_consent_records_granted_consistency
  CHECK (status <> 'Granted' OR granted_at IS NOT NULL);

ALTER TABLE consent_records
ADD CONSTRAINT ck_consent_records_revoked_consistency
  CHECK (status <> 'Revoked' OR (revoked_at IS NOT NULL AND revoked_reason IS NOT NULL));
```

---

### `account_lifecycle_events` (append-only)

Person'un yaşam döngüsü olaylarının değişmez kaydı. Audit ve geri-izleme için.

```sql
CREATE TABLE account_lifecycle_events (
    id              uniqueidentifier  not null  constraint pk_account_lifecycle_events primary key,
    school_id       uniqueidentifier  not null,
    person_id       uniqueidentifier  not null,
    event_type      nvarchar(50)      not null,
    from_state      nvarchar(20)      null,
    to_state        nvarchar(20)      not null,
    season_id       uniqueidentifier  null,
    reason          nvarchar(500)     null,
    metadata        nvarchar(max)     null,  -- JSON
    occurred_at     datetimeoffset    not null,
    triggered_by_person_id  uniqueidentifier  null,
    -- AUDIT (sadece created_at, created_by; bu tablo soft-delete'siz, append-only)
    created_at      datetimeoffset    not null,
    created_by      uniqueidentifier  not null,
    row_version     rowversion        not null
);
```

**Index'ler:**

```sql
CREATE INDEX ix_ale_school_id_person_id_occurred_at
  ON account_lifecycle_events(school_id, person_id, occurred_at DESC);

CREATE INDEX ix_ale_school_id_event_type_occurred_at
  ON account_lifecycle_events(school_id, event_type, occurred_at DESC);
```

> **Not:** Bu tablo append-only olduğu için soft-delete ve update kolonları yoktur. Düzeltme gerekiyorsa yeni event eklenir, eski silinmez.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| {{TBD}} | `20260601_add_persons_and_profiles` | `persons`, `student_profiles`, `teacher_profiles`, `parent_profiles`, `staff_profiles` |
| {{TBD}} | `20260601_add_parent_student_relationships` | `parent_student_relationships` |
| {{TBD}} | `20260601_add_role_assignments` | `role_assignments` |
| {{TBD}} | `20260601_add_invitations` | `invitations` |
| {{TBD}} | `20260601_add_consent_records` | `consent_records` |
| {{TBD}} | `20260601_add_account_lifecycle_events` | `account_lifecycle_events` |

---

## Yasaklar

- ❌ `varchar` (non-unicode) — `nvarchar` zorunlu (TR karakter).
- ❌ `datetime` / `datetime2` UTC olmadan — `datetimeoffset` zorunlu.
- ❌ Tenant tablosunda `school_id` yokluğu — multi-tenant leak riski.
- ❌ Composite index'te ilk kolon `school_id` değilse — tenant scan riski.
- ❌ TCKN'i plain `nvarchar` saklamak — `national_id_hash` (varbinary 32) + `national_id_encrypted` (varbinary, AES-GCM) zorunlu.
- ❌ Invitation `token_plain` kolonu — sadece hash saklanır.
- ❌ `ON DELETE CASCADE` Person → Invitation/RoleAssignment yönünde — yaşam döngüsü olayları audit için korunmalı.
- ❌ `consent_records` üzerinde UPDATE/DELETE (Granted/Revoked statüsü hariç) — KVKK kanıt zinciri kırılır.

> Detay: `backend/database-rules.md`.
