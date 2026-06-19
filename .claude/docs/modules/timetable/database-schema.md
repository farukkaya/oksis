# Ders Programı — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

> **REVİZE (2026-06-12, K0.2/K0.3):** Geçerli şema **`schedule_programs` + `lesson_placements`**'tir
> (Faz 1A migration `20260612_add_schedule_programs`). Aşağıdaki eski `schedules` (StartTime/EndTime)
> bölümü *süperseded*'tir. Domain'de eski `Schedule` entity'si yok; period-modeline geçildiğinden
> filtreli unique index artık **kullanılabilir** (eski "kullanılamaz" notu geçersiz).

---

## Tablolar (geçerli — Faz 1A)

### `schedule_programs`
Bir Sınıf+Dönem programının kökü.

| Kolon | Tip | Not |
|---|---|---|
| `id` | uniqueidentifier PK | |
| `school_id` | uniqueidentifier | tenant, immutable |
| `academic_year_id`, `academic_term_id`, `branch_id` | uniqueidentifier | immutable |
| `status` | int | 0=Draft, 1=Revising, 2=Published |
| `version` | int | default 1 |
| `generated_from_job_id` | uniqueidentifier **NULL** | **(YENİ 2026-06-17, K-D2-4)** programı türeten otomatik üretim işinin (`schedule_generation_jobs.id`) damgası; manuel programlarda NULL. Autogen apply idempotency + izlenebilirlik. `ScheduleProgram.StampGeneratedFrom(jobId)` set eder. |
| `conflict_count` | int | **(YENİ 2026-06-17)** denormalize çakışma sayısı; `IScheduleProgramStatsRecomputer` tarafından yazma-anında güncellenir. |
| `missing_hours` | int | **(YENİ 2026-06-17)** denormalize eksik saat sayısı (5 gün × zil ders periyodu − dolu hücre). |
| `availability_violation_count` | int | **(YENİ 2026-06-17, Faz 4/D1)** programdaki `Unavailable` slot ihlali sayısı. `ScheduleProgram.SetAvailabilityViolationCount` setter; `IScheduleProgramStatsRecomputer` tarafından yerleşim-anında güncellenir. Migration `20260617_add_availability_violation_count`. |
| `row_version` | rowversion | optimistic concurrency |
| + audit (`created_at/by`, `is_deleted`, ...) | | |

- **Unique (REVİZE 2026-06-16, K9):** `ux_schedule_programs_class_term`
  `(school_id, academic_term_id, branch_id) WHERE status >= 1 AND is_deleted = 0` — bir sınıf+dönem'e
  en fazla **tek canlı** (Yayında *veya* Revize) program; **Taslak (status=0) sınırsız**. Eski
  koşulsuz/`is_deleted=0`-yalnız index `status >= 1` filtresine genişletildi (migration
  `20260616_schedule_program_live_unique`). "İkinci program yaratma" reddi `CreateProgram`'dan kalktı
  (K2); tek-canlı garantisi bu filtreli index + publish-swap (K3/K10) ile sağlanır.
- **Index (YENİ 2026-06-17, K-D2-4):** `ix_schedule_programs_generated_from`
  `(school_id, generated_from_job_id)` — autogen apply idempotency aramasını (bir job+branch için zaten
  Taslak var mı) hızlandırır. Migration `20260617_schedule_program_generated_from`.

### `lesson_placements`
Programdaki tek bir yerleşim (4 boyut + zaman). `academic_term_id`/`branch_id` index için `program`'dan denormalize.

| Kolon | Tip | Not |
|---|---|---|
| `id` | uniqueidentifier PK | |
| `school_id`, `program_id`, `academic_term_id`, `branch_id` | uniqueidentifier | |
| `day_of_week` | int | |
| `period` | int | `CHECK ck_placement_period BETWEEN 1 AND 20` |
| `subject_id`, `teacher_id` | uniqueidentifier | |
| `room_id` | uniqueidentifier NULL | |
| `is_block`, `block_group_id` | bit, uniqueidentifier NULL | |
| `is_active` | bit | default 1; Remove → 0 |
| `is_reserving` | bit | **(YENİ 2026-06-16, K8/K12)** default 0; sahip programın `status ∈ {Revising(1), Published(2)}` (yani canlı) olduğunda 1. Program canlıya girince/çıkınca aggregate içinde tüm yerleşimlerinde senkronlanır (`school_id/term/branch` denormalizasyon desenini izler). |

**Filtreli unique index'ler (rezervasyon DB-seviye garanti — REVİZE 2026-06-16, K8):**
```sql
ux_placement_teacher_slot  (school_id, academic_term_id, teacher_id, day_of_week, period)  WHERE is_active = 1 AND is_deleted = 0 AND is_reserving = 1
ux_placement_room_slot     (school_id, academic_term_id, room_id, day_of_week, period)     WHERE is_active = 1 AND is_deleted = 0 AND is_reserving = 1 AND room_id IS NOT NULL
ux_placement_class_slot    (school_id, academic_term_id, branch_id, day_of_week, period)   WHERE is_active = 1 AND is_deleted = 0 AND is_reserving = 1
```

> **K8/K12 — Rezervasyon yalnız canlı programa daralır:** Üç index'in filtresine `is_reserving = 1`
> eklendi (migration `20260616_add_lesson_placement_is_reserving`). Öğretmen/derslik/sınıf-slot
> tekilliği yalnızca **rezerve eden** (canlı: Yayında/Revize) yerleşimlere uygulanır; **Taslaklar
> rezerve etmez ve serbestçe çakışır**. Bir taslak kendi sınıfının canlı programıyla çakışmaz —
> yalnız **diğer şubelerin** canlı yerleşimleriyle çakışabilir (publish-swap eski canlıyı devre dışı
> bırakıp kaynağını boşaltacağı için). Çakışma yayında/yayınlamada ve doluluk ön-kontrolünde
> (`is_reserving=1 AND branch_id != X`) yüzeye çıkar.
> Occupancy (Redis) hız katmanıdır; **kaynak doğruluk bu DB index'leridir** — yarış durumunda ikinci yazımı reddeder.
> `rooms` tablosu (rooms-first dilimi) korunur; eski `schedules` migration'ı varsa ScheduleProgram'a geçişte drop/replace edilir (dev, üretim verisi yok).

### `schedule_exceptions` (Faz 2.5A — geçici değişiklik)

Yayınlanmış programa tek-güne özel overlay (iptal / öğretmen vekaleti / derslik değişikliği). Yayınlanmış snapshot'ı **değiştirmez**.

Kolonlar: `id, school_id, program_id, branch_id, academic_term_id, date, type (int: 0 Cancellation / 1 TeacherSubstitution / 2 RoomChange), target_placement_id, day_of_week (int), period, original_teacher_id, original_room_id?, new_teacher_id?, new_room_id?, reason, revoked_at?, revoked_reason?` + audit + `row_version`.

```
ix_schedule_exceptions_program_date    (school_id, program_id, date)                  WHERE is_deleted = 0
ix_schedule_exceptions_branch_date     (school_id, branch_id, date)                   WHERE is_deleted = 0
ux_schedule_exceptions_placement_date  (school_id, target_placement_id, date)         WHERE revoked_at IS NULL AND is_deleted = 0
```

> Filtreli unique: aynı yerleşim + aynı gün için **tek aktif** geçici değişiklik (geri alma soft → yeni aktif kayda izin verir).
> Migration `20260613_add_schedule_exceptions`. İzin `timetable.override` (migration `20260613_add_timetable_override_permission`).
> Not: Aşağıdaki eski `schedule_overrides` (StartTime/EndTime) **superseded**'dir; geçerli model bu tablodur.

### `schedule_generation_jobs` (Faz 3 — otomatik üretim job'u)

Otomatik üretim (kapsam-bazlı, sıfırdan) işinin durum + aday/ipucu deposu. `[academic]` şeması.

| Kolon | Tip | Not |
|---|---|---|
| `id` | uniqueidentifier PK | jobId |
| `school_id` | uniqueidentifier | tenant, immutable |
| `branch_id` | uniqueidentifier **NULL** | **(NULLABLE 2026-06-17, K-D2)** yalnız `scope=Single` (tek sınıf) kapsamında dolu; bulk (Kademe/Tümü) job sınıf-bağımsız |
| `academic_term_id`, `academic_year_id` | uniqueidentifier | **(RE-KEY 2026-06-16, K6)** job bir döneme + yıla bağlı (kapsam çözümlemesi için) |
| `scope` | int | **(2026-06-17, K-D2)** 0=Single (tek sınıf), 1=GradeLevel (kademe), 2=All (tümü); default 0 |
| `grade_level` | int **NULL** | **(YENİ 2026-06-17, K-D2)** yalnız `scope=GradeLevel` kapsamında dolu (kademe `DisplayOrder`) |
| `status` | int | 0=Queued, 1=Running, 2=Done, 3=NoSolution, 4=Failed |
| `weights_json`, `strict` | nvarchar(max), bit | solver girdileri (ağırlıklar + katı mod) |
| `candidates_json`, `hints_json` | nvarchar(max) NULL | aday(lar) — placement'lar **`branchId` etiketli** + per-class metrik (K-D2-5) / gevşetme ipuçları |
| + audit + `row_version` | | |

> **KAPSAM (2026-06-17, K-D2-1…6):** Job artık tek sınıfa değil bir **kapsama** (tek/kademe/tümü) bağlanır.
> `scope`/`grade_level` eklendi ve `branch_id` nullable yapıldı. Mevcut satırlar additive migration ile
> `scope=0 (Single)` varsayar (default 0; backfill basit). Migration `20260617_schedule_gen_job_scope`.

> **RE-KEY (2026-06-16, K6):** Önceki sürüm tabloyu `program_id`'ye anahtarlıyordu (autogen mevcut bir
> programa uygulanıyordu). Yeni model autogen'i **sıfırdan, sınıf-bazlı** çalıştırır; `program_id`
> kaldırıldı, yerine `branch_id` + `academic_term_id` + `academic_year_id` geldi. Aday uygulandığında
> **yeni bir Taslak `ScheduleProgram` yaratılır** (mevcut programa dokunulmaz). Migration
> `20260616_rekey_schedule_generation_jobs_to_branch` (ilk tablo `20260615_add_schedule_generation_jobs`).

### `teacher_availabilities` (Faz 4/Dilim-1 — müsaitlik aggregate)

Bir öğretmenin bir dönemdeki haftalık müsaitlik/tercih kaydı. Seyrek: yalnız `PrefersNot`/`Unavailable` slotlar `teacher_availability_slots`'a yazılır; kayıt yoksa `Available` varsayılır. `[academic]` şeması.

| Kolon | Tip | Not |
|---|---|---|
| `id` | uniqueidentifier PK | |
| `school_id` | uniqueidentifier | tenant, immutable |
| `academic_year_id`, `academic_term_id`, `teacher_id` | uniqueidentifier | immutable |
| + audit (`created_at/by`, `updated_at/by`, `is_deleted`, ...) + `row_version` | | |

```
ux_teacher_availabilities_term_teacher  (school_id, academic_term_id, teacher_id)  WHERE is_deleted = 0
```

Migration `20260617_add_teacher_availabilities`.

### `teacher_availability_slots` (owned — EF OwnsMany)

`TeacherAvailability` aggregate'ine ait seyrek slot koleksiyonu. Yalnız `PrefersNot`/`Unavailable` girişler saklanır; `Available` satırı bulunmaz.

| Kolon | Tip | Not |
|---|---|---|
| `id` | uniqueidentifier PK (shadow, EF) | |
| `teacher_availability_id` | uniqueidentifier FK → teacher_availabilities.id (cascade delete) | |
| `day_of_week` | int | DayOfWeek (0=Pazar..6=Cumartesi; modül 0=Pzt..4=Cuma) |
| `period` | int | 1-indexed periyot numarası |
| `status` | int | 1=PrefersNot, 2=Unavailable (0=Available depolanmaz) |

```
ux_teacher_availability_slots_slot  (teacher_availability_id, day_of_week, period)  — koşulsuz unique (slot başına tek kayıt)
```

> **Sapma:** Slot-seviye `teacher_id`/`school_id` denormalizasyonu eklenmedi (YAGNI). Provider/recomputer `TeacherId`'yi parent aggregate üzerinden okur; join gerekmez. Tekillik `(teacher_availability_id, day, period)` unique ile sağlanır.

---

## Nöbet Çizelgesi Tabloları (Faz 4/Dilim 2a — ✅ canlı)

Tüm tablolar `[academic]` şemasında. Migrations: `20260619_add_duties_roster`, `20260619_add_duties_permissions`.

### `duty_locations`

Okula özgü nöbet bölgeleri (kat koridoru, kantin, bahçe, kapı…). Kapasite = paralel nöbetçi sayısı üst sınırı (INV-D3, K-2a-3).

| Kolon | Tip | Not |
|---|---|---|
| `id` | uniqueidentifier PK | |
| `school_id` | uniqueidentifier | tenant, immutable |
| `name` | nvarchar(120) NOT NULL | |
| `type` | int NOT NULL | 0=Floor, 1=Canteen, 2=Garden, 3=Gate, 4=Hall, 5=Other |
| `icon` | nvarchar(40) NULL | ikon kodu (UI tarafından yorumlanır) |
| `capacity` | int NOT NULL | 1..4 (domain invariant `MaxCapacity=4`) |
| `is_active` | bit NOT NULL | pasifleştirme; soft-delete değil |
| `template_id` | uniqueidentifier NULL | `duty_location_templates.id` FK (opsiyonel klonlama referansı) |
| + audit (`created_at/by`, `is_deleted`, `row_version`) | | |

```
ix_duty_locations_school_active  (school_id, is_active)  WHERE is_deleted = 0
```

### `duty_exemptions`

Öğretmenin nöbetten muafiyeti (sürekli veya tarih aralıklı geçici). Çizelge dağıtım aşamasında bu tablo kontrol edilir (INV-D1).

| Kolon | Tip | Not |
|---|---|---|
| `id` | uniqueidentifier PK | |
| `school_id` | uniqueidentifier | tenant, immutable |
| `teacher_id` | uniqueidentifier NOT NULL | |
| `type` | int NOT NULL | 0=Permanent, 1=Temporary |
| `from` | date NULL | yalnız Temporary; NULL = Permanent |
| `to` | date NULL | yalnız Temporary; NULL = Permanent |
| `reason` | nvarchar(200) NOT NULL | zorunlu (domain) |
| + audit (`created_at/by`, `is_deleted`, `row_version`) | | |

```
ix_duty_exemptions_school_teacher  (school_id, teacher_id)  WHERE is_deleted = 0
```

### `duty_rosters`

Bir dönemin nöbet çizelgesi (aggregate root). Temporal versiyonlama: yeni yayın mevcut canlıyı Superseded yapar.

| Kolon | Tip | Not |
|---|---|---|
| `id` | uniqueidentifier PK | |
| `school_id` | uniqueidentifier | tenant, immutable |
| `academic_year_id`, `academic_term_id` | uniqueidentifier NOT NULL | immutable |
| `status` | int NOT NULL | 0=Draft, 1=Published, 2=Superseded |
| `version` | int NOT NULL | sürüm zinciri numarası |
| `effective_from` | date NULL | yayın tarihi |
| `effective_to` | date NULL | supersede tarihi (Superseded olunca set edilir) |
| `previous_version_id` | uniqueidentifier NULL | önceki sürüm FK (self-referential) |
| `note` | nvarchar(500) NULL | yayın notu |
| + audit (`created_at/by`, `is_deleted`, `row_version`) | | |

**Filtreli unique index (K-2a-4 tek canlı):**
```
ux_duty_roster_live  (school_id, academic_term_id)  WHERE status = 1 AND effective_to IS NULL AND is_deleted = 0
```
Garantisi: bir dönemde en fazla tek "yürürlükte" (Published + kapanmamış) çizelge.

```
ix_duty_rosters_term_status  (school_id, academic_term_id, status)
```

### `duty_assignments`

`DutyRoster` aggregate'ine ait owned entity (EF Core `OwnsMany`). Öğretmen×gün×bölge ataması, opsiyonel yancı.

| Kolon | Tip | Not |
|---|---|---|
| `id` | uniqueidentifier PK | |
| `duty_roster_id` | uniqueidentifier FK | → `duty_rosters.id` (cascade delete) |
| `school_id` | uniqueidentifier NOT NULL | gerçek CLR property (shadow prop değil; Guid.Empty bug kaçınımı) |
| `academic_term_id` | uniqueidentifier NOT NULL | gerçek CLR property (aynı neden) |
| `teacher_id` | uniqueidentifier NOT NULL | |
| `day_of_week` | int NOT NULL | DayOfWeek (0=Pazar..6=Cumartesi) |
| `location_id` | uniqueidentifier NOT NULL | → `duty_locations.id` |
| `reliever_id` | uniqueidentifier NULL | yancı öğretmen (opsiyonel) |
| `is_active` | bit | shadow prop; filtreli index için |
| `is_deleted` | bit | shadow prop; filtreli index için |

**Filtreli unique index (K-2a-3 kapasite-farkındalıklı; aggregate count ≤ Capacity ile birlikte çalışır):**
```
ux_duty_assignment_teacher_cell
  (school_id, academic_term_id, duty_roster_id, day_of_week, location_id, teacher_id)
  WHERE is_active = 1 AND is_deleted = 0
```
Aynı öğretmen aynı roster'da aynı gün+bölge'ye ikinci kez yazılamaz. Kapasite kontrolü (`count ≤ Capacity`) aggregate Assign() metodunda (INV-D3).

```
ix_duty_assignments_teacher  (school_id, academic_term_id, teacher_id)
```

> **Sapma K-2a-3 (onaylı):** Teknik analiz orijinal olarak tek-nöbetçi (school,term,day,location) unique index öngörmüştü. Uygulanan model roster + öğretmen sütununu ekleyerek (school,term,roster,day,location,teacher) + aggregate count ≤ Capacity kombinasyonu kullanır; bu K-2a-3 binding kararıdır. Bkz. completion_status.md ⚠️ sapma kaydı.

---

### SchoolSettings Nöbet Kolonu Eklentileri (Faz 4/Dilim 2a)

`school_settings` tablosuna 3 yeni kolon (migration `20260619_add_duties_roster` kapsamında):

| Kolon | Tip | Not |
|---|---|---|
| `duties_reliever_enabled` | bit NOT NULL default 0 | yancı modülü aktif mi |
| `duty_weekly_frequency` | int NOT NULL default 1 | 0=TwicePerWeek, 1=OncePerWeek, 2=OnceEveryTwoWeeks — **2a'da inert** (2c solver girdisi) |
| `duty_day_pattern` | int NOT NULL default 0 | 0=Spread (haftaya yayılı), 1=Consecutive (ardışık) — **2a'da inert** |

---

## (SÜPERSEDED — Faz 1A öncesi)

### `schedules`

```sql
CREATE TABLE schedules (
    id                    uniqueidentifier  not null  constraint pk_schedules primary key,
    school_id             uniqueidentifier  not null,
    academic_year_id      uniqueidentifier  not null,
    academic_term_id      uniqueidentifier  not null,
    branch_id             uniqueidentifier  not null,
    course_id             uniqueidentifier  not null,
    teacher_id            uniqueidentifier  not null,
    room_id               uniqueidentifier  null,                  -- yeni (Sprint 2)
    classroom_name        nvarchar(100)     null,                  -- DEPRECATED, room_id'ye geçiş bitince düşecek
    day_of_week           tinyint           not null,               -- 0=Sunday..6=Saturday
    start_time            time(0)           not null,
    end_time              time(0)           not null,
    lesson_order          int               not null,
    is_block_lesson       bit               not null  constraint df_schedules_is_block_lesson default 0,
    block_group_id        uniqueidentifier  null,
    status                tinyint           not null  constraint df_schedules_status default 0,  -- 0=Draft,1=Published,2=Archived
    version               int               not null  constraint df_schedules_version default 1,
    effective_from        date              not null,
    effective_to          date              null,
    previous_version_id   uniqueidentifier  null,
    created_at            datetimeoffset    not null,
    created_by            uniqueidentifier  not null,
    updated_at            datetimeoffset    null,
    updated_by            uniqueidentifier  null,
    is_deleted            bit               not null  constraint df_schedules_is_deleted default 0,
    deleted_at            datetimeoffset    null,
    deleted_by            uniqueidentifier  null,
    row_version           rowversion        not null
);
```

**Index'ler:**

```sql
-- Tenant scope ana index (her sorguda ilk filtre)
CREATE INDEX ix_schedules_school_id
  ON schedules(school_id)
  WHERE is_deleted = 0;

-- Şube haftalık görünüm — en sık sorgu (parent, student, admin)
CREATE INDEX ix_schedules_school_branch_term_day_active
  ON schedules(school_id, branch_id, academic_term_id, day_of_week)
  INCLUDE (course_id, teacher_id, room_id, start_time, end_time, lesson_order, status)
  WHERE is_deleted = 0 AND status = 1;  -- Published

-- Öğretmen haftalık görünüm
CREATE INDEX ix_schedules_school_teacher_term_day_active
  ON schedules(school_id, teacher_id, academic_term_id, day_of_week)
  INCLUDE (branch_id, course_id, room_id, start_time, end_time, lesson_order)
  WHERE is_deleted = 0 AND status = 1;

-- Derslik haftalık görünüm
CREATE INDEX ix_schedules_school_room_term_day_active
  ON schedules(school_id, room_id, academic_term_id, day_of_week)
  INCLUDE (branch_id, course_id, teacher_id, start_time, end_time)
  WHERE is_deleted = 0 AND status = 1 AND room_id IS NOT NULL;

-- Çakışma kontrolü (tek-okul, tek-dönem, tek-gün öğretmen+saat aralığı taraması)
CREATE INDEX ix_schedules_conflict_teacher
  ON schedules(school_id, academic_term_id, teacher_id, day_of_week, start_time, end_time)
  WHERE is_deleted = 0 AND status = 1;

CREATE INDEX ix_schedules_conflict_branch
  ON schedules(school_id, academic_term_id, branch_id, day_of_week, start_time, end_time)
  WHERE is_deleted = 0 AND status = 1;

-- Versiyon zinciri takibi
CREATE INDEX ix_schedules_previous_version
  ON schedules(previous_version_id)
  WHERE previous_version_id IS NOT NULL AND is_deleted = 0;

-- Blok ders grupları
CREATE INDEX ix_schedules_block_group
  ON schedules(school_id, block_group_id)
  WHERE block_group_id IS NOT NULL AND is_deleted = 0;
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `academic_year_id` | `academic_years(id)` | `NO ACTION` |
| `academic_term_id` | `academic_terms(id)` | `NO ACTION` |
| `branch_id` | `branches(id)` | `NO ACTION` |
| `course_id` | `courses(id)` | `NO ACTION` |
| `teacher_id` | `teachers(id)` | `NO ACTION` |
| `room_id` | `rooms(id)` | `NO ACTION` (nullable) |
| `previous_version_id` | `schedules(id)` | `NO ACTION` (self-ref) |

**Check Constraint'ler:**

```sql
-- Saat sırası
ALTER TABLE schedules
ADD CONSTRAINT ck_schedules_time_order
  CHECK (start_time < end_time);

-- Effective tarih sırası
ALTER TABLE schedules
ADD CONSTRAINT ck_schedules_effective_range
  CHECK (effective_to IS NULL OR effective_to >= effective_from);

-- DayOfWeek 0..6
ALTER TABLE schedules
ADD CONSTRAINT ck_schedules_day_of_week
  CHECK (day_of_week BETWEEN 0 AND 6);

-- Status 0..2
ALTER TABLE schedules
ADD CONSTRAINT ck_schedules_status
  CHECK (status IN (0, 1, 2));

-- Archived ise effective_to zorunlu
ALTER TABLE schedules
ADD CONSTRAINT ck_schedules_archived_has_end
  CHECK (status <> 2 OR effective_to IS NOT NULL);

-- Block lesson ise block_group_id zorunlu
ALTER TABLE schedules
ADD CONSTRAINT ck_schedules_block_requires_group
  CHECK (is_block_lesson = 0 OR block_group_id IS NOT NULL);

-- Lesson order pozitif
ALTER TABLE schedules
ADD CONSTRAINT ck_schedules_lesson_order_positive
  CHECK (lesson_order >= 1);
```

> **Not:** Çakışma kuralları (öğretmen / şube / derslik aynı slot) DB seviyesinde **filtered unique** ile garanti edilemez (aralık çakışması — overlap kontrolü). Bunlar **application + Dapper sorgusu** ile kontrol edilir. SQL Server 2022'ye geçilirse `WITHOUT OVERLAPS` constraint düşünülebilir.

---

### `rooms`

```sql
CREATE TABLE rooms (
    id              uniqueidentifier  not null  constraint pk_rooms primary key,
    school_id       uniqueidentifier  not null,
    code            nvarchar(20)      not null,
    name            nvarchar(150)     not null,
    type            tinyint           not null,                                  -- 0=Classroom,1=Lab,2=Gym,3=Music,4=Art,5=Auditorium,6=Workshop,7=Other
    capacity        int               not null,
    building        nvarchar(50)      null,
    floor           int               null,
    features        nvarchar(max)     null,                                     -- JSON: { smartBoard: true, projector: false, ... }
    status          tinyint           not null  constraint df_rooms_status default 0,  -- 0=Active,1=Passive
    created_at      datetimeoffset    not null,
    created_by      uniqueidentifier  not null,
    updated_at      datetimeoffset    null,
    updated_by      uniqueidentifier  null,
    is_deleted      bit               not null  constraint df_rooms_is_deleted default 0,
    deleted_at      datetimeoffset    null,
    deleted_by      uniqueidentifier  null,
    row_version     rowversion        not null
);
```

**Index'ler:**

```sql
CREATE INDEX ix_rooms_school_id
  ON rooms(school_id)
  WHERE is_deleted = 0;

-- Code unique (SchoolId scope)
CREATE UNIQUE INDEX uq_rooms_school_id_code
  ON rooms(school_id, code)
  WHERE is_deleted = 0;

-- Tipe göre filtreleme (örn. "boş laboratuvar")
CREATE INDEX ix_rooms_school_type_status
  ON rooms(school_id, type, status)
  INCLUDE (code, name, capacity)
  WHERE is_deleted = 0;
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |

**Check Constraint'ler:**

```sql
ALTER TABLE rooms
ADD CONSTRAINT ck_rooms_capacity_positive
  CHECK (capacity > 0 AND capacity <= 200);

ALTER TABLE rooms
ADD CONSTRAINT ck_rooms_type_valid
  CHECK (type BETWEEN 0 AND 7);

ALTER TABLE rooms
ADD CONSTRAINT ck_rooms_status_valid
  CHECK (status IN (0, 1));

ALTER TABLE rooms
ADD CONSTRAINT ck_rooms_features_is_json
  CHECK (features IS NULL OR ISJSON(features) = 1);
```

---

### `schedule_overrides`

```sql
CREATE TABLE schedule_overrides (
    id                      uniqueidentifier  not null  constraint pk_schedule_overrides primary key,
    school_id               uniqueidentifier  not null,
    original_schedule_id    uniqueidentifier  not null,
    override_date           date              not null,
    override_type           tinyint           not null,                          -- 0=Cancellation,1=TeacherSubstitution,2=RoomChange,3=TimeChange,4=Combined
    new_teacher_id          uniqueidentifier  null,
    new_room_id             uniqueidentifier  null,
    new_start_time          time(0)           null,
    new_end_time            time(0)           null,
    reason                  nvarchar(500)     null,
    status                  tinyint           not null  constraint df_schedule_overrides_status default 0,  -- 0=Active,1=Reverted
    created_at              datetimeoffset    not null,
    created_by              uniqueidentifier  not null,
    updated_at              datetimeoffset    null,
    updated_by              uniqueidentifier  null,
    is_deleted              bit               not null  constraint df_schedule_overrides_is_deleted default 0,
    deleted_at              datetimeoffset    null,
    deleted_by              uniqueidentifier  null,
    row_version             rowversion        not null
);
```

**Index'ler:**

```sql
CREATE INDEX ix_schedule_overrides_school_id
  ON schedule_overrides(school_id)
  WHERE is_deleted = 0;

-- "Bu Schedule'ın bu gününde aktif override var mı?" sorgusu
CREATE INDEX ix_schedule_overrides_lookup_active
  ON schedule_overrides(school_id, original_schedule_id, override_date)
  INCLUDE (override_type, new_teacher_id, new_room_id, new_start_time, new_end_time)
  WHERE is_deleted = 0 AND status = 0;

-- "Bu tarih aralığında okuldaki tüm override'lar" — günlük operasyonel görünüm
CREATE INDEX ix_schedule_overrides_school_date_active
  ON schedule_overrides(school_id, override_date)
  WHERE is_deleted = 0 AND status = 0;

-- Yerine giren öğretmen sorgusu
CREATE INDEX ix_schedule_overrides_new_teacher_active
  ON schedule_overrides(school_id, new_teacher_id, override_date)
  WHERE is_deleted = 0 AND status = 0 AND new_teacher_id IS NOT NULL;

-- Aynı (schedule, date) için tek aktif override garantisi
CREATE UNIQUE INDEX uq_schedule_overrides_one_active_per_day
  ON schedule_overrides(original_schedule_id, override_date)
  WHERE is_deleted = 0 AND status = 0;
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `original_schedule_id` | `schedules(id)` | `NO ACTION` |
| `new_teacher_id` | `teachers(id)` | `NO ACTION` (nullable) |
| `new_room_id` | `rooms(id)` | `NO ACTION` (nullable) |

**Check Constraint'ler:**

```sql
-- Override tipi geçerli
ALTER TABLE schedule_overrides
ADD CONSTRAINT ck_schedule_overrides_type_valid
  CHECK (override_type BETWEEN 0 AND 4);

-- Cancellation → tüm yeni değerler null
ALTER TABLE schedule_overrides
ADD CONSTRAINT ck_schedule_overrides_cancellation_no_new_values
  CHECK (
    override_type <> 0
    OR (new_teacher_id IS NULL AND new_room_id IS NULL AND new_start_time IS NULL AND new_end_time IS NULL)
  );

-- TeacherSubstitution → new_teacher_id zorunlu
ALTER TABLE schedule_overrides
ADD CONSTRAINT ck_schedule_overrides_substitution_has_teacher
  CHECK (override_type <> 1 OR new_teacher_id IS NOT NULL);

-- RoomChange → new_room_id zorunlu
ALTER TABLE schedule_overrides
ADD CONSTRAINT ck_schedule_overrides_room_has_room
  CHECK (override_type <> 2 OR new_room_id IS NOT NULL);

-- TimeChange → new_start_time + new_end_time zorunlu ve sıralı
ALTER TABLE schedule_overrides
ADD CONSTRAINT ck_schedule_overrides_time_change_complete
  CHECK (
    override_type <> 3
    OR (new_start_time IS NOT NULL AND new_end_time IS NOT NULL AND new_start_time < new_end_time)
  );

-- Status 0..1
ALTER TABLE schedule_overrides
ADD CONSTRAINT ck_schedule_overrides_status_valid
  CHECK (status IN (0, 1));
```

> `override_date >= today` ve `<= today + 30` kontrolü **application layer** (BR-TT-011), çünkü `today` deterministik değil — DB check constraint kullanılmaz.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2025-XX-XX | `XXXX_add_schedules` (Sprint 1) | İlk `schedules` tablosu — temel atama alanları (`TenantId`, `BranchId`, `CourseId`, `TeacherId`, `DayOfWeek`, `StartTime`, `EndTime`, `LessonOrder`, `ClassroomName`) |
| 2026-05-26 | `20260526_add_rooms` | Yeni `rooms` tablosu |
| 2026-05-26 | `20260526_evolve_schedules_for_versioning` | `schedules` tablosuna: `room_id` (nullable FK), `is_block_lesson`, `block_group_id`, `status`, `version`, `effective_from`, `effective_to`, `previous_version_id`. Mevcut satırlar için: `status=1` (Published), `effective_from=academic_term.start_date`, diğer alanlar null. `school_id` kolonu mevcutsa rename değil; rename gerekiyorsa ayrı migration. |
| 2026-05-26 | `20260526_evolve_schedules_indexes` | Yukarıdaki performans index'leri |
| 2026-XX-XX | `XXXXXXXX_add_schedule_overrides` (Sprint 3) | `schedule_overrides` tablosu |
| Faz 2 | `XXXXXXXX_drop_schedules_classroom_name` | `room_id` migration veri tamamlanınca `classroom_name` kolonu drop |
| 2026-06-15 | `20260615_add_schedule_generation_jobs` | İlk `schedule_generation_jobs` tablosu (autogen) |
| 2026-06-16 | `20260616_schedule_program_live_unique` | `ux_schedule_programs_class_term` filtresi `status >= 1`'e genişletildi (K9 — tek canlı + çok taslak) |
| 2026-06-16 | `20260616_add_lesson_placement_is_reserving` | `lesson_placements.is_reserving` + üç yerleşim unique index'ine `is_reserving = 1` filtresi (K8 — rezervasyon yalnız canlı) |
| 2026-06-16 | `20260616_rekey_schedule_generation_jobs_to_branch` | `schedule_generation_jobs`: `program_id` → `branch_id` + `academic_term_id` + `academic_year_id` (K6) |
| 2026-06-17 | `20260617_schedule_gen_job_scope` | `schedule_generation_jobs`: `scope` (int, default 0=Single) + `grade_level` (nullable int) eklendi; `branch_id` nullable yapıldı (mevcut satırlar → Single) (K-D2) |
| 2026-06-17 | `20260617_schedule_program_generated_from` | `schedule_programs.generated_from_job_id` (nullable) + index `ix_schedule_programs_generated_from` (autogen apply idempotency, K-D2-4) |

---

## Sorgu Örnekleri (Dapper — Yüksek Performanslı Read'ler)

### Şube haftalık programı (en sık sorgu)

```sql
SELECT
    s.id,
    s.day_of_week,
    s.start_time,
    s.end_time,
    s.lesson_order,
    c.id   AS course_id,    c.name AS course_name,    c.code AS course_code,
    t.id   AS teacher_id,   t.full_name AS teacher_name,
    r.id   AS room_id,      r.code AS room_code,      r.name AS room_name
FROM schedules s
INNER JOIN courses  c ON c.id = s.course_id  AND c.is_deleted = 0
INNER JOIN teachers t ON t.id = s.teacher_id AND t.is_deleted = 0
LEFT  JOIN rooms    r ON r.id = s.room_id    AND r.is_deleted = 0
WHERE s.school_id        = @schoolId
  AND s.academic_term_id = @termId
  AND s.branch_id        = @branchId
  AND s.status           = 1                                  -- Published
  AND s.is_deleted       = 0
  AND s.effective_from   <= @asOfDate
  AND (s.effective_to IS NULL OR s.effective_to >= @asOfDate)
ORDER BY s.day_of_week, s.lesson_order;
```

> `ix_schedules_school_branch_term_day_active` covering index ile **tek seek + sıralı tarama**, P95 hedefi < 50ms.

### Öğretmen çakışma kontrolü (atama öncesi)

```sql
SELECT TOP 1 id
FROM schedules
WHERE school_id        = @schoolId
  AND academic_term_id = @termId
  AND teacher_id       = @teacherId
  AND day_of_week      = @dayOfWeek
  AND status           = 1
  AND is_deleted       = 0
  AND id              <> @currentScheduleId          -- update senaryosunda kendini hariç tut
  AND start_time       < @endTime                    -- overlap
  AND end_time         > @startTime;
```

### Bugünkü override'lar (operasyonel görünüm)

```sql
SELECT
    o.id, o.original_schedule_id, o.override_type, o.reason,
    s.branch_id, s.course_id, s.teacher_id, s.start_time, s.end_time,
    o.new_teacher_id, o.new_room_id, o.new_start_time, o.new_end_time
FROM schedule_overrides o
INNER JOIN schedules s ON s.id = o.original_schedule_id
WHERE o.school_id     = @schoolId
  AND o.override_date = @today
  AND o.status        = 0
  AND o.is_deleted    = 0;
```

---

## Tahmini Veri Hacmi (Kapasite Planlaması)

Orta-büyük özel okul (1.500 öğrenci, 60 şube, ~35 ders/şube/hafta):

| Tablo | Yıllık satır | 5 yıllık | Notlar |
|---|---|---|---|
| `schedules` (sadece Published, aktif) | ~2.100 | ~10.500 | Sezon başı kurulan ana satırlar |
| `schedules` (versiyonlu archived dahil) | ~5.000–8.000 | ~25.000–40.000 | Sezon ortası 1-3x değişiklik tahmini |
| `rooms` | ~50 | ~50 | Yıllar arası değişim minimal |
| `schedule_overrides` (yıl boyu) | ~300–800 | ~1.500–4.000 | Günlük 1-2 değişiklik tipik |

→ Hiçbir tablo "büyük" değil, partitioning gereksiz. Index strategy yeterli.

---

## Yasaklar

- ❌ `varchar` (non-unicode) — `nvarchar` zorunlu.
- ❌ `datetime` / `datetime2` UTC olmadan — `datetimeoffset`.
- ❌ Tenant tablosunda `school_id` yokluğu.
- ❌ Composite index'te ilk kolon `school_id` değilse.
- ❌ Schedule fiziksel `DELETE` — yoklama bağı kırılır. Sadece `Archive(...)`.
- ❌ Room fiziksel `DELETE` — geçmiş Schedule referansı kırılır. `Status = Passive` yeterli.
- ❌ Aralık (`start_time`/`end_time`) çakışmasını filtered unique index ile zorlamak — yanlış sonuç verir, application layer kontrol eder.

> Detay: `backend/database-rules.md`.
