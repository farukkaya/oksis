# Akademik Yıl / Sezon — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Master Tablolar (tenant-agnostik)

Migration `20260523222901_add_global_seed_master_data` ile HasData() seed.

### `academic_term_types` (2 satır seed)

Dönem tipleri sabit lookup.

```sql
CREATE TABLE academic_term_types (
    id            uniqueidentifier  not null  constraint pk_academic_term_types primary key,
    code          nvarchar(10)      not null,   -- T1, T2
    name          nvarchar(50)      not null,   -- "1. Dönem", "2. Dönem"
    display_order int               not null,
    -- audit + soft-delete + row_version
);

CREATE UNIQUE INDEX ux_academic_term_types_code
  ON academic_term_types(code) WHERE is_deleted = 0;
```

**Seed:** T1 (1. Dönem), T2 (2. Dönem).

### `official_holidays` (6 satır seed)

Tarihi sabit ulusal resmi tatiller. Yılla değişmediği için `(month, day)` çifti tutulur — gerçek tarih runtime hesaplanır.

```sql
CREATE TABLE official_holidays (
    id                uniqueidentifier  not null  constraint pk_official_holidays primary key,
    name              nvarchar(150)     not null,
    month             int               not null,   -- 1-12
    day               int               not null,   -- 1-31
    is_annual         bit               not null,
    holiday_category  nvarchar(30)      not null,   -- "NATIONAL" sabit
    display_order     int               not null,
    -- audit + soft-delete + row_version
);

CREATE INDEX ix_official_holidays_month_day
  ON official_holidays(month, day);
```

**Seed (Türkiye Cumhuriyeti):**
| Date | Name |
|---|---|
| 1 Ocak | Yılbaşı |
| 23 Nisan | Ulusal Egemenlik ve Çocuk Bayramı |
| 1 Mayıs | Emek ve Dayanışma Günü |
| 19 Mayıs | Atatürk'ü Anma, Gençlik ve Spor Bayramı |
| 30 Ağustos | Zafer Bayramı |
| 29 Ekim | Cumhuriyet Bayramı |

> **Dini bayramlar (Ramazan, Kurban) burada DEĞİL** — Hicri takvime göre yılla değiştiği için her akademik yıl açılışında okul yöneticisi `school_holidays` tenant tablosuna manuel ekler.

---

## Tenant Tablolar (Sprint 1+ — planlanan)

### `academic_years` (tenant)

Bir okulun aktif **tek** sezon kaydı (`IsCurrent = true`). Properties: `SchoolId`, `Name` (örn. "2025-2026"), `StartDate`, `EndDate`, `IsCurrent`.

### `academic_terms` (tenant)

Sezona bağlı dönemler. `AcademicYearId` + `TermTypeId` (FK master `academic_term_types`) + `StartDate` + `EndDate`.

### `school_holidays` (tenant, mevcut)

Okul-spesifik tatil günleri. Detay: `modules/school-settings/database-schema.md`.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | `academic_term_types` (2) + `official_holidays` (6) master tablolar + seed |

---

## Yasaklar

- ❌ `academic_term_types.code` değiştirme.
- ❌ `official_holidays` tablosuna dini bayram eklemek (yılla değişir → tenant scope).
- ❌ Master tabloya tenant scope kolonu eklemek.

> Detay: `backend/database-rules.md`.
