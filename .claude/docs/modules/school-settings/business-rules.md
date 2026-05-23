# Okul Ayarları — Business Rules

> Modüle özel iş kuralları. Genel `business-rules.md` üzerinde override yapılamaz; bu dosya o kurallara özelleştirme ekler.

---

## BR-SS-001 — Tenant başına tek SchoolSettings

Bir okul için **tam olarak bir** `school_settings` satırı vardır. `SchoolCreatedEvent` yayınlandığında `SchoolCreatedEventHandler` otomatik insert eder; idempotent (varsa atlar, race condition için filtered unique index son savunma).

---

## BR-SS-002 — Adres lookup FK opsiyonel

Adres FK'leri (`address_country_id`, `address_province_id`, `address_district_id`, `address_neighborhood_id`) nullable; okul kurulum sihirbazının ilk adımında boş kalabilir. FK constraint uygulama seviyesinde doğrulanır, EF Core query filter ile çakışmasın diye DB seviyesinde RESTRICT.

---

## BR-SS-003 — Logo dosyası 2 MB üst sınır

`UploadLogo` endpoint'i `[RequestSizeLimit(2_097_152)]` ile sınırlandırılır. Daha büyük dosya HTTP 413. Backend kontrolü zorunlu — frontend client-side max boyut sadece UX için.

---

## BR-SS-004 — Modül kataloğu seed önceliği

Yeni okul oluşturulduğunda 6 modül satırı (`attendance, marks, announcements, homework, messaging, reports`) seed edilir. Plan kısıtlı modüller (`PlanRestricted = true`) için `IsEnabled = false` ile başlar; SchoolAdmin bunu PATCH ile değiştiremez (403). Premium plana geçildiğinde modül otomatik açılmaz — SuperAdmin manuel müdahale gerekir (Sprint 5+ otomasyon).

---

## BR-SS-005 — Bell schedule sıralama tutarlılığı

`BulkCreateBellSchedules` her transaction'da tüm satırları silmeden önce eski sırayı korumalı: `display_order` ile sıralı kayıt. Sıra çakışmasına izin verilmez; aynı `display_order` ile iki satır insert edilemez.

---

## BR-SS-006 — PATCH module endpoint yalnızca toggle

`PATCH /modules/{moduleKey}` body **yalnızca** `{ isEnabled: bool }` kabul eder. `module_name` route'tan alınır, body'de gönderilemez. Diğer alanlar (PlanRestricted, ModuleKey değişimi) bu endpoint'in scope'unda değildir; gerekirse ayrı bir admin endpoint açılır.

---

## BR-SS-007 — Tatil günü ile resmi tatil ayrımı

- `school_holidays` (tenant) → okul-spesifik tatiller (yarıyıl, ara tatil, okul etkinliği, dini bayramlar — yılla değişen).
- `official_holidays` (global) → tarihi sabit ulusal tatiller (1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 30 Ağustos, 29 Ekim).
- UI takvim widget'ı her ikisini birlikte render eder; admin sadece `school_holidays`'i düzenleyebilir, `official_holidays` salt-okunur badge ile gösterilir.

---

## BR-SS-008 — Tema renkleri hex doğrulama

`PrimaryColor` ve `SecondaryColor` `#RRGGBB` formatında. Zod regex: `/^#[0-9A-Fa-f]{6}$/`. PrimaryColor zorunlu, SecondaryColor opsiyonel.

---

## BR-SS-009 — Public branding endpoint'in scope'u

`GET /public` anonim erişim için yalnızca:
- Okul adı
- Tema renkleri
- Logo URL

Hassas veri (vergi numarası, MEB kodu, adres detayı) **dönmez**. `X-Tenant-Code` header zorunlu — yoksa 400.

---

## BR-SS-010 — SchoolSettingsUpdatedEvent payload'u

Her `Update*` davranışı `SchoolSettingsUpdatedEvent(SchoolId, SectionName)` yayar. SectionName değerleri:
- `UpdateBasicInfo`
- `UpdateContactInfo`
- `UpdateAddress`
- `UpdateTheme`
- `UpdateAcademicStructure`

Audit log handler (Sprint 2+) bu event'leri yakalayıp `audit_logs` tablosuna detaylı diff yazar.
