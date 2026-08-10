# Öğrenci — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Schema

Tablolar `academic` schema'sında oluşturulur (migration: `20260629_student_enrollment_core`).

---

## Tablolar

### `academic.student_enrollments`

Bir öğrencinin akademik sezondaki kayıt kaydı (Student × Season).

```sql
CREATE TABLE academic.student_enrollments (
    id                   uniqueidentifier   not null  constraint pk_student_enrollments primary key,
    school_id            uniqueidentifier   not null,
    student_id           uniqueidentifier   not null,   -- FK → identity.persons(id)
    academic_session_id  uniqueidentifier   not null,   -- FK → academic.academic_sessions(id)
    type                 nvarchar(20)       not null,   -- New | TransferIn | Renewal
    status               nvarchar(20)       not null  constraint df_student_enrollments_status default 'Draft',
    class_room_id        uniqueidentifier   null,       -- FK → academic.class_rooms(id)
    student_number       nvarchar(10)       null,       -- {year}{5 hane}, bir kez set edilir
    intent               nvarchar(500)      null,
    previous_school      nvarchar(200)      null,       -- TransferIn için zorunlu
    enrollment_date      date               not null,
    created_at           datetimeoffset     not null,
    created_by           uniqueidentifier   not null,
    updated_at           datetimeoffset     null,
    updated_by           uniqueidentifier   null,
    is_deleted           bit                not null  constraint df_student_enrollments_is_deleted default 0,
    deleted_at           datetimeoffset     null,
    deleted_by           uniqueidentifier   null,
    row_version          rowversion         not null
);
```

**Index'ler:**

```sql
-- Tenant filtresi
CREATE INDEX ix_student_enrollments_school_id
  ON academic.student_enrollments(school_id)
  WHERE is_deleted = 0;

-- Student × Session tekil kayıt (UX index)
CREATE UNIQUE INDEX ux_student_enrollments_student_session
  ON academic.student_enrollments(student_id, academic_session_id)
  WHERE is_deleted = 0;
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `dbo.schools(id)` | `NO ACTION` |
| `student_id` | `identity.persons(id)` | `NO ACTION` |
| `academic_session_id` | `academic.academic_sessions(id)` | `NO ACTION` |
| `class_room_id` | `academic.class_rooms(id)` | `NO ACTION` |

---

### `academic.student_documents`

Öğrenciye ait belge meta-data kaydı. Fiziksel dosya blob/S3'te.

```sql
CREATE TABLE academic.student_documents (
    id             uniqueidentifier   not null  constraint pk_student_documents primary key,
    school_id      uniqueidentifier   not null,
    student_id     uniqueidentifier   not null,   -- FK → identity.persons(id)
    enrollment_id  uniqueidentifier   null,       -- FK → academic.student_enrollments(id)
    type           nvarchar(20)       not null,   -- IdentityDoc | ResidenceDoc | HealthReport | TransferDoc | Photo | Other
    file_url       nvarchar(1000)     not null,
    file_name      nvarchar(255)      not null,
    description    nvarchar(500)      null,
    created_at     datetimeoffset     not null,
    created_by     uniqueidentifier   not null,
    updated_at     datetimeoffset     null,
    updated_by     uniqueidentifier   null,
    is_deleted     bit                not null  constraint df_student_documents_is_deleted default 0,
    deleted_at     datetimeoffset     null,
    deleted_by     uniqueidentifier   null,
    row_version    rowversion         not null
);
```

**Index'ler:**

```sql
CREATE INDEX ix_student_documents_school_id
  ON academic.student_documents(school_id)
  WHERE is_deleted = 0;

CREATE INDEX ix_student_documents_student_id
  ON academic.student_documents(student_id)
  WHERE is_deleted = 0;
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `dbo.schools(id)` | `NO ACTION` |
| `student_id` | `identity.persons(id)` | `NO ACTION` |
| `enrollment_id` | `academic.student_enrollments(id)` | `NO ACTION` |

---

### `academic.enrollment_idempotency`

`EnrollStudentCommand` idempotency deposu. `ClientRequestId` → başarı sonucu JSON.

```sql
CREATE TABLE academic.enrollment_idempotency (
    id                 uniqueidentifier   not null  constraint pk_enrollment_idempotency primary key,
    school_id          uniqueidentifier   not null,
    client_request_id  uniqueidentifier   not null,
    result_json        nvarchar(max)      not null,   -- EnrollStudentResult JSON
    created_at         datetimeoffset     not null
    -- Soft-delete YOK: kayıtlar TTL veya manual temizlik ile silinir
);
```

**Index'ler:**

```sql
-- Idempotency lookup (UX index)
CREATE UNIQUE INDEX ux_enrollment_idempotency_client_request_id
  ON academic.enrollment_idempotency(school_id, client_request_id);
```

---

### `academic.student_number_counters`

Okul × Yıl bazında öğrenci numarası sıra sayacı. IHasTenant entity DEĞİL — composite PK, soft-delete yok.

```sql
CREATE TABLE academic.student_number_counters (
    school_id     uniqueidentifier   not null,
    year          int                not null,
    next_counter  int                not null  constraint df_student_number_counters_next default 1,
    constraint pk_student_number_counters primary key (school_id, year)
);
```

**Not:** `next_counter` atomic artırımı için `UPDATE ... OUTPUT INSERTED.next_counter WHERE school_id=... AND year=...` + optimistic concurrency veya `sp_executesql` ile serializable transaction kullanılır.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-06-29 | `20260629_student_enrollment_core` | İlk enrollment tabloları: `student_enrollments`, `student_documents`, `enrollment_idempotency`, `student_number_counters` (academic schema) |

---

## Yasaklar

- ❌ `varchar` (non-unicode) — `nvarchar` zorunlu.
- ❌ `datetime` / `datetime2` UTC olmadan — `datetimeoffset`.
- ❌ Tenant tablosunda `school_id` yokluğu.
- ❌ Composite index'te ilk kolon `school_id` değilse.
- ❌ `student_number` güncellenmesi (mezuniyet dahil sabit — E2.3).

> Detay: `backend/database-rules.md`.
