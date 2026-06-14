# Öğretmen — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Tablolar

> **Müfredat Saati çekirdeği** (spec `gorevlendirme-hub-spec.md` §2.2). Hub'ın hedef saatini
> (`targetHours`) besler. `subjects`/`academic-years` ile sınırda — ileride bağımsız `curriculum`
> modülü açılırsa oraya taşınabilir; şimdilik Görevlendirme Hub'ı tükettiği için burada belgelenir.
> Master tablo `master` şemasında (tenant-agnostik, MEB çizelgesi), override tablo `academic`
> şemasında (tenant). `IRequiredHoursResolver` ikisini katmanlar (override > master).

### `master.curriculum_hour_templates` (MASTER — tenant-agnostik)

MEB Haftalık Ders Çizelgesi şablonu (kademe × seviye × ders → zorunlu/seçmeli haftalık saat, sürümlü). `SchoolId` **taşımaz**.

```sql
CREATE TABLE master.curriculum_hour_templates (
    id                uniqueidentifier  not null  constraint pk_curriculum_hour_templates primary key,
    education_level   nvarchar(30)      not null,  -- enum string: Primary/Middle/High
    grade_level_code  nvarchar(10)      not null,  -- "5","9"... (GradeLevel.Code ile hizalı)
    subject_id        uniqueidentifier  not null,
    weekly_hours      int               not null,  -- 1..40
    is_elective       bit               not null,
    meb_decision      nvarchar(50)      not null,  -- "2025/04 TTK"
    version           nvarchar(20)      not null,  -- "2025.04" (aktif sürüm sabiti)
    created_at        datetimeoffset    not null,
    created_by        uniqueidentifier  not null,
    updated_at        datetimeoffset    null,
    updated_by        uniqueidentifier  null,
    is_deleted        bit               not null  constraint df_curriculum_hour_templates_is_deleted default 0,
    row_version       rowversion        not null
);

-- Sürüm × seviye × ders tekilliği (aktif satırlar):
CREATE UNIQUE INDEX ux_curriculum_hour_templates_ver_grade_subject
  ON master.curriculum_hour_templates(version, grade_level_code, subject_id)
  WHERE is_deleted = 0;

CREATE INDEX ix_curriculum_hour_templates_ver_grade
  ON master.curriculum_hour_templates(version, grade_level_code);
```

**Seed:** `MebCurriculumSeed_2025_04` — deterministik `SeedGuid.From("curr:{version}:{grade}:{subjectId}")`.
Şu an **yalnız ortaokul 5. sınıf** (zorunlu toplam 29). Kural: bir seviye ya tam ya hiç seed edilir;
eksik seviye resolver'da 0 → hub `Undefined`/gri (yanlış toplam üretilmez). Tam TTK seed follow-up iş.

### `academic.school_weekly_hour_overrides` (TENANT)

Okula özel haftalık saat override'ı. Effective çözümde master'ın önüne geçer. Bu spec'te **yazma yolu yok** (S-6); resolver okur.

```sql
CREATE TABLE academic.school_weekly_hour_overrides (
    id                  uniqueidentifier  not null  constraint pk_school_weekly_hour_overrides primary key,
    school_id           uniqueidentifier  not null,
    academic_session_id uniqueidentifier  not null,
    grade_level_code    nvarchar(10)      not null,
    subject_id          uniqueidentifier  not null,
    weekly_hours        int               not null,  -- 0..40
    reason              nvarchar(500)     null,
    created_at          datetimeoffset    not null,
    created_by          uniqueidentifier  not null,
    updated_at          datetimeoffset    null,
    updated_by          uniqueidentifier  null,
    is_deleted          bit               not null  constraint df_school_weekly_hour_overrides_is_deleted default 0,
    row_version         rowversion        not null
);

-- Okul × sezon × seviye × ders tekilliği (aktif satırlar):
CREATE UNIQUE INDEX ux_school_weekly_hour_overrides_active
  ON academic.school_weekly_hour_overrides(school_id, academic_session_id, grade_level_code, subject_id)
  WHERE is_deleted = 0;
```

> Migration: `20260614_gorevlendirme_hub` (iki tablo + index + yeni izin/seed satırları).
> `school_weekly_hour_overrides` tenant query filter'a tabi; `curriculum_hour_templates` master (filtre yok).

---

### `{{TBD_table_name}}`

```sql
CREATE TABLE {{TBD_table_name}} (
    id              uniqueidentifier  not null  constraint pk_{{TBD_table_name}} primary key,
    school_id       uniqueidentifier  not null,
    {{TBD_column}}  {{TBD_type}}      {{TBD_null}},
    created_at      datetimeoffset    not null,
    created_by      uniqueidentifier  not null,
    updated_at      datetimeoffset    null,
    updated_by      uniqueidentifier  null,
    is_deleted      bit               not null  constraint df_{{TBD_table_name}}_is_deleted default 0,
    deleted_at      datetimeoffset    null,
    deleted_by      uniqueidentifier  null,
    row_version     rowversion        not null
);
```

**Index'ler:**

```sql
CREATE INDEX ix_{{TBD_table_name}}_school_id
  ON {{TBD_table_name}}(school_id)
  WHERE is_deleted = 0;

-- Composite (örnek):
CREATE INDEX ix_{{TBD_table_name}}_school_id_status
  ON {{TBD_table_name}}(school_id, status)
  WHERE is_deleted = 0;
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `{{TBD}}_id` | `{{TBD}}({{TBD}})` | {{TBD}} |

**Check Constraint'ler:**

```sql
ALTER TABLE {{TBD_table_name}}
ADD CONSTRAINT ck_{{TBD_table_name}}_{{TBD_rule}}
  CHECK ({{TBD_condition}});
```

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-15 | `20260515_add_{{TBD_table_name}}` | İlk tablo oluşturuldu |
| 2026-06-14 | `20260614_gorevlendirme_hub` | `master.curriculum_hour_templates` + `academic.school_weekly_hour_overrides` tabloları + filtreli unique index'ler + MEB seed (ortaokul 5) + `teaching-assignments.copy-season` / `curriculum-hours.view` izin & rol satırları |

---

## Yasaklar

- ❌ `varchar` (non-unicode) — `nvarchar` zorunlu.
- ❌ `datetime` / `datetime2` UTC olmadan — `datetimeoffset`.
- ❌ Tenant tablosunda `school_id` yokluğu.
- ❌ Composite index'te ilk kolon `school_id` değilse.

> Detay: `backend/database-rules.md`.
