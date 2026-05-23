# Sınıf / Şube — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Master Tablolar (tenant-agnostik)

### `grade_levels` (13 satır seed)

Sınıf kademeleri (Anaokulu + 1-12. sınıf). Tüm okullar paylaşır.

> **Naming reminder:** "Grade" = sınıf seviyesi (5. sınıf), "Mark" = not. Karıştırma kuralı — bkz. `naming-conventions.md`.

```sql
CREATE TABLE grade_levels (
    id              uniqueidentifier  not null  constraint pk_grade_levels primary key,
    code            nvarchar(10)      not null,   -- "0" Anaokulu, "1" 1.sınıf, ..., "12" 12.sınıf
    name            nvarchar(50)      not null,   -- "Anaokulu", "1. Sınıf", ..., "12. Sınıf"
    display_order   int               not null,
    education_level nvarchar(30)      not null,   -- EducationLevel enum string: Preschool|Primary|Middle|High
    -- audit + soft-delete + row_version
);

CREATE UNIQUE INDEX ux_grade_levels_code
  ON grade_levels(code) WHERE is_deleted = 0;

CREATE INDEX ix_grade_levels_display_order ON grade_levels(display_order);
```

**Seed dağılımı:**
- 0 → Anaokulu (Preschool)
- 1-4 → İlkokul (Primary)
- 5-8 → Ortaokul (Middle)
- 9-12 → Lise (High)

---

## Enum: `EducationLevel`

```csharp
public enum EducationLevel { Preschool = 0, Primary = 1, Middle = 2, High = 3 }
```

EF Core'da `HasConversion<string>()`.

---

## Tenant Tablolar (Sprint 1+ — planlanan)

### `classrooms` / `class_rooms` (tenant)

Okulun her şubesi (örn. 5-A, 9-B). `SchoolId` + `GradeLevelId` + `Section` (A/B/C...) + `AcademicYearId`.

### `class_room_students` (tenant)

Şube ↔ öğrenci atama. Bir öğrenci aktif sezonda **tek bir** şubeye atanır.

> Detay tasarım Sprint 1 sonunda gelecek.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | `grade_levels` master tablosu + 13 satır seed |

---

## Yasaklar

- ❌ `grade_levels.code` değiştirme — frontend i18n key, müfredat join (`subject_grade_levels`), şube template'leri bozulur.
- ❌ Master tabloya tenant scope kolonu eklemek.
- ❌ "Grade" ile "Mark" karıştırmak (`naming-conventions.md`).

> Detay: `backend/database-rules.md`.
