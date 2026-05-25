# Akademik Sezon — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Master Tablolar (tenant-agnostik, mevcut)

Bu master tablolar `20260523222901_add_global_seed_master_data` migration ile zaten kurulmuştur. **Değiştirilmez, sadece referans için listeniyor.**

### `academic_term_types` (2 satır seed) — DEĞİŞMEZ

Dönem tipleri sabit lookup. Seed: T1 (1. Dönem), T2 (2. Dönem).

### `official_holidays` (6 satır seed) — DEĞİŞMEZ

Türkiye Cumhuriyeti sabit ulusal tatilleri (1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 30 Ağustos, 29 Ekim). Hicri dini bayramlar **buraya değil**, tenant `school_holidays` tablosuna her sezon için manuel girilir.

### `grade_levels` (13 satır seed) — DEĞİŞMEZ

Sınıf kademeleri (Anaokulu + 1-12. sınıf).

---

## Tenant Tablolar (Sprint 1'de eklenecek)

### `academic_sessions` (tenant)

Bir okulun eğitim yılları. Aktif tek bir kayıt kuralı filtered unique ile zorlanır.

```sql
CREATE TABLE academic_sessions (
    id              uniqueidentifier  not null  constraint pk_academic_sessions primary key,
    school_id       uniqueidentifier  not null,
    name            nvarchar(20)      not null,    -- "2025-2026"
    start_date      date              not null,
    end_date        date              not null,
    is_current      bit               not null  default 0,
    status          nvarchar(20)      not null,    -- AcademicSessionStatus enum: Setup|Active|Archived
    activated_at    datetimeoffset    null,
    archived_at     datetimeoffset    null,
    -- audit + soft-delete + row_version (base class)
    created_at      datetimeoffset    not null,
    created_by      uniqueidentifier  not null,
    updated_at      datetimeoffset    not null,
    updated_by      uniqueidentifier  not null,
    is_deleted      bit               not null  default 0,
    row_version     rowversion        not null,

    constraint ck_academic_sessions_dates
      check (start_date < end_date),
    constraint fk_academic_sessions_schools
      foreign key (school_id) references schools(id)
);

-- Aktif sezon tekildir
CREATE UNIQUE INDEX ux_academic_sessions_current
  ON academic_sessions(school_id)
  WHERE is_current = 1 AND is_deleted = 0;

-- Sezon adı tenant içinde tekildir
CREATE UNIQUE INDEX ux_academic_sessions_school_name
  ON academic_sessions(school_id, name)
  WHERE is_deleted = 0;

CREATE INDEX ix_academic_sessions_school_status
  ON academic_sessions(school_id, status) WHERE is_deleted = 0;
```

**EF Core Enum mapping:**
```csharp
public enum AcademicSessionStatus { Setup = 0, Active = 1, Archived = 2 }
// HasConversion<string>() — stored as "Setup"|"Active"|"Archived"
```

---

### `academic_terms` (tenant)

Sezona bağlı dönemler. Bir sezonda T1 ve T2 birer kez.

```sql
CREATE TABLE academic_terms (
    id                     uniqueidentifier  not null  constraint pk_academic_terms primary key,
    school_id              uniqueidentifier  not null,
    academic_session_id    uniqueidentifier  not null,
    term_type_id           uniqueidentifier  not null,    -- FK academic_term_types
    start_date             date              not null,
    end_date               date              not null,
    status                 nvarchar(20)      not null,    -- NotStarted|Active|Closed
    closed_at              datetimeoffset    null,
    -- audit + soft-delete + row_version

    constraint ck_academic_terms_dates
      check (start_date < end_date),
    constraint fk_academic_terms_sessions
      foreign key (academic_session_id) references academic_sessions(id),
    constraint fk_academic_terms_types
      foreign key (term_type_id) references academic_term_types(id)
);

-- Bir sezonda T1 ve T2 birer kez
CREATE UNIQUE INDEX ux_academic_terms_session_type
  ON academic_terms(academic_session_id, term_type_id)
  WHERE is_deleted = 0;

CREATE INDEX ix_academic_terms_school_status
  ON academic_terms(school_id, status) WHERE is_deleted = 0;
```

---

### `class_rooms` (tenant)

Okulun her sezona ait şubeleri. **Yıl-scope'lu** (BR-AS-010).

```sql
CREATE TABLE class_rooms (
    id                     uniqueidentifier  not null  constraint pk_class_rooms primary key,
    school_id              uniqueidentifier  not null,
    academic_session_id    uniqueidentifier  not null,
    grade_level_id         uniqueidentifier  not null,    -- FK master grade_levels
    section                nvarchar(3)       not null,    -- "A", "B", ...
    full_name              nvarchar(20)      not null,    -- "9-A" (stored, computed at insert)
    homeroom_teacher_id    uniqueidentifier  null,
    capacity               int               not null,
    status                 nvarchar(20)      not null,    -- Draft|PendingApproval|Active|Archived
    -- audit + soft-delete + row_version

    constraint ck_class_rooms_capacity
      check (capacity between 1 and 100),
    constraint fk_class_rooms_sessions
      foreign key (academic_session_id) references academic_sessions(id),
    constraint fk_class_rooms_grade_levels
      foreign key (grade_level_id) references grade_levels(id)
);

-- Aynı sezonda iki "9-A" olamaz
CREATE UNIQUE INDEX ux_class_rooms_session_grade_section
  ON class_rooms(academic_session_id, grade_level_id, section)
  WHERE is_deleted = 0;

CREATE INDEX ix_class_rooms_school_session
  ON class_rooms(school_id, academic_session_id) WHERE is_deleted = 0;

CREATE INDEX ix_class_rooms_homeroom
  ON class_rooms(homeroom_teacher_id) WHERE is_deleted = 0 AND homeroom_teacher_id IS NOT NULL;
```

> `homeroom_teacher_id` üzerinde explicit FK **yok** (Teacher modülü ayrı aggregate, ID-only referans — `domain-model-rules.md` § 1).

---

### `class_room_students` (tenant — history-aware)

Şube ↔ öğrenci atama. Üzerine yazılmaz, tarihsel kayıt olarak korunur.

```sql
CREATE TABLE class_room_students (
    id              uniqueidentifier  not null  constraint pk_class_room_students primary key,
    school_id       uniqueidentifier  not null,
    class_room_id   uniqueidentifier  not null,
    student_id      uniqueidentifier  not null,
    assigned_at     datetimeoffset    not null,
    left_at         datetimeoffset    null,
    reason          nvarchar(20)      not null,    -- Initial|Transfer|NewEnrollment|Graduation|Archive
    notes           nvarchar(500)     null,
    -- audit + soft-delete + row_version

    constraint fk_class_room_students_class_room
      foreign key (class_room_id) references class_rooms(id)
);

-- Bir öğrenci aktif şubede en fazla 1 (filtered unique)
CREATE UNIQUE INDEX ux_class_room_students_active_assignment
  ON class_room_students(school_id, student_id)
  WHERE left_at IS NULL AND is_deleted = 0;

-- Şube içi aktif öğrenciler için hızlı sorgu
CREATE INDEX ix_class_room_students_class_room_active
  ON class_room_students(class_room_id)
  INCLUDE (student_id)
  WHERE left_at IS NULL AND is_deleted = 0;

-- Tarihsel sorgular için (öğrencinin tüm geçmiş atamaları)
CREATE INDEX ix_class_room_students_student_history
  ON class_room_students(student_id, assigned_at DESC) WHERE is_deleted = 0;
```

**EF Core enum mapping:**
```csharp
public enum AssignmentReason { Initial = 0, Transfer = 1, NewEnrollment = 2, Graduation = 3, Archive = 4 }
// HasConversion<string>()
```

---

### `school_holidays` (tenant)

Sezon-scope'lu tatil tanımları (dini bayramlar, okul-spesifik tatiller, yarıyıl tatili).

> **Not:** Bu tablo şu an `school-settings` modülünde "planlanan" olarak duruyor. Bu modülün altına taşınmalı çünkü `AcademicSessionId` zorunlu.

```sql
CREATE TABLE school_holidays (
    id                     uniqueidentifier  not null  constraint pk_school_holidays primary key,
    school_id              uniqueidentifier  not null,
    academic_session_id    uniqueidentifier  not null,
    name                   nvarchar(150)     not null,
    start_date             date              not null,
    end_date               date              not null,
    holiday_type           nvarchar(30)      not null,    -- PublicHoliday|SchoolEvent|ClosedDay|SemesterBreak
    is_recurring           bit               not null  default 0,
    description            nvarchar(500)     null,
    -- audit + soft-delete + row_version

    constraint ck_school_holidays_dates
      check (start_date <= end_date),
    constraint fk_school_holidays_sessions
      foreign key (academic_session_id) references academic_sessions(id)
);

CREATE INDEX ix_school_holidays_session_dates
  ON school_holidays(academic_session_id, start_date, end_date)
  WHERE is_deleted = 0;
```

---

## `school_settings` — Eklenecek Kolonlar (BR-AS-007, 008, 009)

Bu modülün parametrik kararları `school_settings` tablosuna 3 yeni kolon ekler. Migration ayrı bir migration olarak yazılır (`Add_AcademicSession_SchoolSettings_Columns`).

```sql
ALTER TABLE school_settings
  ADD graduated_data_retention_years        int  not null  default 5
      constraint ck_school_settings_retention_years
        check (graduated_data_retention_years between 1 and 30);

ALTER TABLE school_settings
  ADD require_approval_for_classroom_creation  bit  not null  default 0;

ALTER TABLE school_settings
  ADD auto_publish_report_cards               bit  not null  default 1;
```

**Domain mapping (SchoolSettings value object'inde):**
```csharp
public sealed record SchoolSettings
{
    // ...existing properties...
    public int GraduatedDataRetentionYears { get; init; } = 5;
    public bool RequireApprovalForClassRoomCreation { get; init; } = false;
    public bool AutoPublishReportCards { get; init; } = true;
}
```

> `school-settings/database-schema.md` ve `school-settings/business-rules.md` dosyalarına da cross-reference eklenmeli (bu üç ayar oraya ait).

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | Master tablolar + seed (`academic_term_types`, `official_holidays`, `grade_levels`, `subjects`, `subject_grade_levels`) — **mevcut, değişmez** |
| TBD | `XXXXXXXXXXXX_add_academic_sessions` | `academic_sessions` + `academic_terms` tabloları |
| TBD | `XXXXXXXXXXXX_add_class_rooms` | `class_rooms` + `class_room_students` tabloları |
| TBD | `XXXXXXXXXXXX_add_school_holidays` | `school_holidays` tablosu |
| TBD | `XXXXXXXXXXXX_add_academic_session_school_settings_columns` | `school_settings` üç yeni kolon (BR-AS-007/008/009) |

> **Migration sıralaması önemli:** `academic_sessions` önce, çünkü `academic_terms`, `class_rooms`, `school_holidays` ona FK taşır.

---

## Yasaklar

- ❌ `academic_sessions.is_current` üzerinde unique constraint **`WHERE` clause olmadan** koymak (multi-tenant'ta yanlış davranır).
- ❌ `class_rooms.academic_term_id` kolonu eklemek (kullanıcının açık kararı — şube yıl-scope'lu, dönem-scope'lu değil).
- ❌ `class_room_students` üzerinde UPDATE (history-aware: kapatma `LeftAt` set ile, yeni atama INSERT ile).
- ❌ `school_holidays.academic_session_id`'yi nullable yapmak (tatil daima bir sezona aittir).
- ❌ Mevcut master tablolara (`academic_term_types`, `official_holidays`, `grade_levels`) tenant scope eklemek veya seed verilerini değiştirmek.

> Detay: `backend/database-rules.md`.

---

## Notlar — Sprint 1 Implementasyon Sırası

1. `academic_sessions` + `academic_terms` migration → seed yok (tenant-specific).
2. `class_rooms` + `class_room_students` migration.
3. `school_holidays` migration.
4. `school_settings` 3 kolon ekleme migration.
5. EF Core Configurations (`OksisDbContext` ICRUD configurations).
6. Global query filter: tüm yeni tablolar `SchoolId` filtreli olmalı (`ITenantContext` interceptor ile).
7. Smoke test: yeni okul oluşturulduğunda boş tablolar; ilk `AcademicSession.Create()` ile T1 + T2 otomatik insert.