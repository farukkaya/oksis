# Okul Ayarları — Database Schema (Güncellenmiş)

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Mevcut Tablolar (değişmeden korunur)

### `school_settings` (1:1 `schools`) — MEVCUT + YENİ KOLONLAR

Tek satır per tenant. Mevcut kolonlar değişmez. **5 yeni kolon** eklenir:

**Mevcut kolonlar (değişmez):**
- Kurumsal: `official_name`, `meb_code`, `tax_number`, `tax_office`
- İletişim (owned VO): `contact_info_phone/fax/email/website`
- Adres (owned VO): `address_country_id/province_id/district_id/neighborhood_id`, `address_full_address`, `address_postal_code`
- Tema (owned VO): `theme_logo_url`, `theme_primary_color`, `theme_secondary_color`, `theme_favicon_url`
- Akademik Yapı: `school_type`, `education_language`, `weekly_lesson_days`, `daily_lesson_count`, `student_number_prefix`, `student_number_length`, `timezone`

**Yeni kolonlar (Sprint 1 migration):**

```sql
-- Not sistemi (2B kararı)
ALTER TABLE school_settings
  ADD default_grade_scale_id  uniqueidentifier  null
      constraint fk_school_settings_grade_scales
        foreign key references grade_scales(id);

ALTER TABLE school_settings
  ADD default_passing_score    decimal(6,2)  not null  default 50;

-- Parametrik iş akışı (academic-sessions BR-AS-007/008/009)
ALTER TABLE school_settings
  ADD graduated_data_retention_years         int  not null  default 5
      constraint ck_ss_retention check (graduated_data_retention_years between 1 and 30);

ALTER TABLE school_settings
  ADD require_approval_for_classroom_creation  bit  not null  default 0;

ALTER TABLE school_settings
  ADD auto_publish_report_cards                bit  not null  default 1;
```

> `default_grade_scale_id` nullable çünkü mevcut okulların migration sırasında henüz skala seçimi yok; ilk oturum açtıklarında seçmeleri istenir (frontend onboarding nudge).

### `school_bell_schedules` — DEĞİŞMEZ

Mevcut yapı korunur. `school_id` + `slot_type` + `start_time/end_time` + `display_order`.

### `school_module_configs` — DEĞİŞMEZ

6 modül satırı tenant başına. Mevcut yapı korunur.

### `school_notification_configs` — DEĞİŞMEZ (Sprint 2'de genişler)

Mevcut yapı korunur. Sprint 2'de `notification_frequency` enum kolonu eklenecek.

### `school_holidays` — MEVCUT + YENİ KOLON

```sql
ALTER TABLE school_holidays
  ADD academic_session_id  uniqueidentifier  null
      constraint fk_school_holidays_academic_sessions
        foreign key references academic_sessions(id);

CREATE INDEX ix_school_holidays_session
  ON school_holidays(academic_session_id) WHERE is_deleted = 0 AND academic_session_id IS NOT NULL;
```

> **Nullable geçiş dönemi.** Mevcut tatil kayıtları `academic_session_id = NULL` olarak kalır. Yeni tatil eklenirken aktif sezon otomatik atanır. Sprint 4+'ta zorunlu hale getirilir (migration: mevcut NULL kayıtlar en yakın sezona bağlanır veya silinir).

---

## Yeni Tablolar (Sprint 1)

### `school_grade_levels` (junction — okul aktif sınıf kademeleri)

Okulun hangi sınıf seviyelerini çalıştırdığını belirler. `academic-sessions` şube oluştururken grade level dropdown'ını filtreler.

```sql
CREATE TABLE school_grade_levels (
    id              uniqueidentifier  not null  constraint pk_school_grade_levels primary key,
    school_id       uniqueidentifier  not null,
    grade_level_id  uniqueidentifier  not null,
    is_active       bit               not null  default 1,
    display_order   int               not null,
    -- audit + soft-delete + row_version

    constraint fk_sgl_schools
      foreign key (school_id) references schools(id),
    constraint fk_sgl_grade_levels
      foreign key (grade_level_id) references grade_levels(id)
);

CREATE UNIQUE INDEX ux_school_grade_levels_school_grade
  ON school_grade_levels(school_id, grade_level_id)
  WHERE is_deleted = 0;
```

**Seed mantığı:** Okul oluşturulduğunda `school_type`'a göre otomatik seed:
- `PrimarySchool` → 1-4. sınıf
- `MiddleSchool` → 5-8. sınıf
- `HighSchool` → 9-12. sınıf
- `Preschool` → Anaokulu
- `K12` (veya birden fazla seçim) → ilgili tüm seviyeler

Admin sonradan düzenleyebilir (UI: multi-select checkbox).

---

### `school_grade_level_scales` (junction — seviye bazlı not skalası)

Eğitim seviyesine göre farklı not skalası. İlkokul 5'lik, lise 100'lük kullanabilir.

```sql
CREATE TABLE school_grade_level_scales (
    id              uniqueidentifier  not null  constraint pk_sgls primary key,
    school_id       uniqueidentifier  not null,
    grade_level_id  uniqueidentifier  not null,
    grade_scale_id  uniqueidentifier  not null,
    passing_score   decimal(6,2)      null,      -- null ise school_settings.default_passing_score kullanılır
    -- audit + soft-delete + row_version

    constraint fk_sgls_schools
      foreign key (school_id) references schools(id),
    constraint fk_sgls_grade_levels
      foreign key (grade_level_id) references grade_levels(id),
    constraint fk_sgls_grade_scales
      foreign key (grade_scale_id) references grade_scales(id)
);

CREATE UNIQUE INDEX ux_sgls_school_grade
  ON school_grade_level_scales(school_id, grade_level_id)
  WHERE is_deleted = 0;
```

**Kullanım mantığı:**
1. `marks` modülü not girilirken öğrencinin sınıf seviyesine bakar
2. `school_grade_level_scales`'ta eşleşme varsa → o skalayı kullanır
3. Eşleşme yoksa → `school_settings.default_grade_scale_id` + `default_passing_score` fallback
4. O da yoksa → TR_100 master default

---

## Sprint 2'de Eklenecek Tablolar (planlama)

### `school_exam_type_overrides` (Sprint 2 — sınav ağırlığı override)

```sql
CREATE TABLE school_exam_type_overrides (
    id                    uniqueidentifier  not null  constraint pk_seto primary key,
    school_id             uniqueidentifier  not null,
    exam_type_id          uniqueidentifier  not null,
    custom_weight_percent int               not null,
    -- audit + soft-delete + row_version

    constraint ck_seto_weight check (custom_weight_percent between 0 and 100),
    constraint fk_seto_schools foreign key (school_id) references schools(id),
    constraint fk_seto_exam_types foreign key (exam_type_id) references exam_types(id)
);

CREATE UNIQUE INDEX ux_seto_school_exam
  ON school_exam_type_overrides(school_id, exam_type_id)
  WHERE is_deleted = 0;
```

### Devamsızlık eşik kolonları (Sprint 2 — school_settings tablosuna)

```sql
ALTER TABLE school_settings ADD absence_warning_threshold   int  not null  default 5;
ALTER TABLE school_settings ADD absence_critical_threshold  int  not null  default 10;
ALTER TABLE school_settings ADD absence_max_threshold       int  not null  default 20;
ALTER TABLE school_settings ADD count_late_as_absence       bit  not null  default 0;
ALTER TABLE school_settings ADD late_to_absence_ratio       int  not null  default 3;
```

---

## İlgili Lookup Tablolar (global, master — DEĞİŞMEZ)

| Tablo | Açıklama |
|---|---|
| `countries`, `provinces`, `districts`, `neighborhoods` | Adres cascade selectbox |
| `official_holidays` | Sabit ulusal tatiller (6 satır seed) |
| `grade_levels` | 13 sınıf kademesi (Anaokulu + 1-12) |
| `grade_scales` | 3 not skalası (TR_100, TR_5, HARFLI) |
| `exam_types` | 7 sınav türü + ağırlıkları |
| `notification_types` | Bildirim kataloğu |

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| Mevcut | `20260523_initial_school_settings` | `school_settings` + `school_bell_schedules` + `school_holidays` + `school_module_configs` + `school_notification_configs` |
| Mevcut | `20260523224508_add_school_settings_permissions` | 10 permission + role_permissions seed |
| TBD | `XXXX_add_school_grade_levels` | `school_grade_levels` junction tablosu + mevcut okullar için seed |
| TBD | `XXXX_add_school_grade_level_scales` | `school_grade_level_scales` junction tablosu |
| TBD | `XXXX_add_academic_policy_columns` | `school_settings` 5 yeni kolon (grade_scale_id, passing_score, 3 parametrik) |
| TBD | `XXXX_add_holidays_session_fk` | `school_holidays.academic_session_id` nullable FK |
| TBD | `XXXX_add_academic_structure_permissions` | 2 yeni permission seed + mevcut endpoint permission taşıma |

> **Migration sıralaması:** `school_grade_levels` önce (bağımsız), sonra `school_grade_level_scales` (grade_scales FK'ye ihtiyaç duyar), sonra kolon eklemeler.