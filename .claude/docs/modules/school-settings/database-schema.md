# Okul Ayarları — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Tablolar (tenant scope — `school_id` zorunlu)

### `school_settings` (1:1 `schools`)

Tek satır per tenant. `SchoolCreatedEventHandler` tarafından okul oluşturulduğunda otomatik insert (BR-SS-001 idempotent).

**Önemli kolonlar:**
- Kurumsal: `official_name`, `meb_code`, `tax_number`, `tax_office`
- İletişim (owned VO): `contact_info_phone/fax/email/website`
- Adres (owned VO): `address_country_id`, `address_province_id`, `address_district_id`, `address_neighborhood_id` (lookup FK), `address_full_address`, `address_postal_code`
- Tema (owned VO): `theme_logo_url`, `theme_primary_color`, `theme_secondary_color`, `theme_favicon_url`
- Akademik: `school_type`, `education_language`, `weekly_lesson_days`, `daily_lesson_count`, `student_number_prefix`, `student_number_length`, `timezone`
- Audit + soft-delete + `row_version`

**Index:** `ux_school_settings_school_id` (unique, filtered `is_deleted = 0`).

### `school_bell_schedules`

Zil/ders saati programı. `school_id` + `slot_type` + `start_time/end_time` + `display_order`.

### `school_holidays`

Okul-spesifik tatil günleri (resmi tatiller global `official_holidays`'tedir). Frontend zod şeması ile birebir kolon adları: `title`, `holiday_date`, `end_date`, `holiday_type` (enum string), `is_recurring`, `description`.

**Index:** `ix_school_holidays_school_id_holiday_date`.

### `school_module_configs`

Tenant başına 6 modül satırı (`attendance, marks, announcements, homework, messaging, reports`). Migration `20260523140000_seed_default_module_configs` her mevcut okul için cross-join ile seed eder.

**Index:** `ux_school_module_configs_school_module` (unique `school_id + module_name`).

### `school_notification_configs`

Global `notification_types` kataloğunu tenant bazında override eder. Tenant başına izin verilen kanal/cooldown/quiet-hours kuralları.

---

## İlgili Lookup Tablolar (global, master)

| Tablo | Modül | Açıklama |
|---|---|---|
| `countries`, `provinces`, `districts`, `neighborhoods` | `locations` | Adres cascade selectbox |
| `official_holidays` | `academic-years` | Sabit ulusal tatiller (read-only, salt-okunur Calendar widget) |
| `notification_types` | `notifications` | Bildirim katalogu — `school_notification_configs`'in referansı |
| `system_settings` | `platform` | `JWT_*`, `MAX_FILE_UPLOAD_MB` vb. platform default'ları |

> Detay tablo şemaları için ilgili modüllerin `database-schema.md` dosyalarına bakınız.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-20 | `20260517184554_create_school_settings_tables` | school_settings + bell_schedules + holidays + module_configs + notification_configs |
| 2026-05-20 | `20260517184600_seed_default_school_settings` | Mevcut okullar için varsayılan satır |
| 2026-05-22 | `20260522122811_create_locations_and_refactor_address` | Adres alanları lookup FK'lere geçti |
| 2026-05-22 | `20260522193445_add_entity_base_columns` | Audit + soft-delete + row_version standardı |
| 2026-05-23 | `20260523121013_align_holiday_with_frontend` | `school_holidays` kolon adları frontend zod ile hizalandı |
| 2026-05-23 | `20260523140000_seed_default_module_configs` | 6 modül × her okul |
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | Global master tablolar + `school_onboarding_status` (tenant) |
| 2026-05-24 | `20260523224508_add_school_settings_permissions` | 10 school-settings.* izni + SCHOOL_ADMIN bağı |

---

## Yasaklar

- ❌ `varchar` — `nvarchar` (Türkçe karakter).
- ❌ `datetime`/`datetime2` UTC olmadan — `datetimeoffset`.
- ❌ `school_id` yokluğu (bu modülün tüm tabloları tenant scope).
- ❌ Composite index ilk kolonu `school_id` değil.
- ❌ `school_settings` çoğul satır per tenant (filtered unique index korur).

> Detay: `backend/database-rules.md`.
