# Not — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

> **Naming reminder:** "Mark" = not (sayı/harf değer). "Grade" = sınıf seviyesi (5. sınıf). Karıştırmayın.

---

## Master Tablolar (tenant-agnostik)

Migration `20260523222901_add_global_seed_master_data` ile HasData() seed.

### `exam_types` (7 satır seed)

Sınav türleri ve ağırlıkları (varsayılan MEB yönetmeliği).

```sql
CREATE TABLE exam_types (
    id              uniqueidentifier  not null  constraint pk_exam_types primary key,
    code            nvarchar(20)      not null,   -- VZ1, VZ2, SZ, PER, VZ3, VZ4, PRJ
    name            nvarchar(100)     not null,   -- "1. Yazılı", "Sözlü" ...
    weight_percent  int               not null,   -- 0-100
    term_order      int               not null,   -- 0=her dönem | 1=1.dönem | 2=2.dönem
    display_order   int               not null,
    description     nvarchar(300)     null,
    -- audit + soft-delete + row_version
);

CREATE UNIQUE INDEX ux_exam_types_code
  ON exam_types(code) WHERE is_deleted = 0;
```

**Seed satırları:**
| Code | Name | Weight | Term |
|---|---|---|---|
| VZ1 | 1. Yazılı | 30 | 1 |
| VZ2 | 2. Yazılı | 30 | 1 |
| SZ | Sözlü | 20 | 0 (her dönem) |
| PER | Performans | 20 | 0 |
| VZ3 | 3. Yazılı | 30 | 2 |
| VZ4 | 4. Yazılı | 30 | 2 |
| PRJ | Proje | 20 | 0 |

> Okul bazlı ağırlık override Sprint 2+ konusu.

### `grade_scales` (3 satır seed)

Not skalası seçenekleri. Okul kurulum sihirbazında tek skala seçilir; tüm not girişleri bu skalaya göre validate edilir.

```sql
CREATE TABLE grade_scales (
    id           uniqueidentifier  not null  constraint pk_grade_scales primary key,
    code         nvarchar(20)      not null,   -- TR_100, TR_5, HARFLI
    name         nvarchar(100)     not null,
    min_value    decimal(6,2)      null,       -- HARFLI için null
    max_value    decimal(6,2)      null,
    pass_value   nvarchar(20)      not null,   -- sayısal veya harf ("50", "3", "C")
    description  nvarchar(300)     null,
    -- audit + soft-delete + row_version
);

CREATE UNIQUE INDEX ux_grade_scales_code
  ON grade_scales(code) WHERE is_deleted = 0;
```

**Seed satırları:**
| Code | Name | Min | Max | Pass |
|---|---|---|---|---|
| TR_100 | 100'lük Sistem | 0 | 100 | 50 |
| TR_5 | 5'lik Sistem | 1 | 5 | 3 |
| HARFLI | Harf Sistemi | null | null | C |

---

## Tenant Tablolar (Sprint 1-2 — planlanan)

- `marks` — `SchoolId`, `StudentId`, `SubjectId`, `ExamTypeId` (FK master), `Score`, `Status` (Draft/Published/Locked), `PublishedAt`, `LockedAt`
- `report_cards` — dönem sonu özeti

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | `exam_types` (7) + `grade_scales` (3) master tablolar + seed |

---

## Yasaklar

- ❌ `exam_types.code`, `grade_scales.code` değiştirme.
- ❌ Master tabloya tenant scope kolonu eklemek.
- ❌ `grade_scales` 4. satır eklemek (skala katalog kapalı; özelleştirme Sprint 2+ tenant tablosunda).
- ❌ Not (`marks`) tenant tablosuna `Grade` kolonu adlandırmak (Mark/Grade karışıklığı yaratır).

> Detay: `backend/database-rules.md`.
