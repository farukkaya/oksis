# Okul Ayarları — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md` § School Settings.

---

## Permission Kodları (10 izin)

Backend `permissions` tablosunda `module = 'SCHOOL_SETTINGS'` ile seed edilir; her biri `SchoolSettingsController` üzerinde bir veya daha fazla endpoint'i koruma altına alır.

| Kod | Action enum | Endpoint(ler) | Anlam |
|---|---|---|---|
| `school-settings.view` | `VIEW` | `GET /school-settings`, `GET /bell-schedules`, `GET /holidays`, `GET /module-configs` | Okul ayarlarını sekme/liste görüntüle |
| `school-settings.update-basic` | `UPDATE_BASIC` | `PUT /basic-info` | Resmi ad, MEB kodu, vergi numarası, vergi dairesi |
| `school-settings.update-contact` | `UPDATE_CONTACT` | `PUT /contact-info` | Telefon, faks, e-posta, web sitesi |
| `school-settings.update-address` | `UPDATE_ADDRESS` | `PUT /address` | Ülke/il/ilçe/mahalle FK'leri + açık adres + posta kodu |
| `school-settings.update-theme` | `UPDATE_THEME` | `PUT /theme` | Logo URL, primary/secondary renk, favicon |
| `school-settings.upload-logo` | `UPLOAD_LOGO` | `POST /logo`, `DELETE /logo` | Logo dosyası (max 2 MB) yükle / sil |
| `school-settings.manage-bell` | `MANAGE_BELL` | `POST/PUT/DELETE /bell-schedules/*` + bulk | Zil/ders saati programı CRUD + bulk |
| `school-settings.manage-holidays` | `MANAGE_HOLIDAYS` | `POST/PUT/DELETE /holidays/*` | Okul-spesifik tatil günleri CRUD |
| `school-settings.manage-modules` | `MANAGE_MODULES` | `PATCH /modules/{moduleKey}` | Modül aktif/pasif toggle (PlanRestricted modüller hariç) |
| `school-settings.manage-notifications` | `MANAGE_NOTIFICATIONS` | `PUT /notification-config` | Bildirim tipi başına kanal/cooldown override |

> **Public branding endpoint** (`GET /public`) `[AllowAnonymous]` — yetkilendirme matrisinin dışında, login öncesi okul logosu / renkleri için.

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine ait | 🚫 = yok | ⚙ = yapılandırılabilir

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `school-settings.view` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.update-basic` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.update-contact` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.update-address` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.update-theme` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.upload-logo` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.manage-bell` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.manage-holidays` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.manage-modules` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.manage-notifications` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

**Backend seed:** `migration 20260523224508_20260524_add_school_settings_permissions` — 10 satır `permissions` + 10 satır `role_permissions` (SCHOOL_ADMIN → her bir izin).

---

## Sekme → İzin Haritası (Frontend)

`oksis-web/src/portals/admin/settings/` altındaki her sekme `<PermissionGate permission="...">` ile sarılır:

| Sekme / Component | Gerekli İzin(ler) | Notlar |
|---|---|---|
| Genel Bilgi sekmesi | `school-settings.view`, `school-settings.update-basic` | view yoksa sekme görünmez |
| İletişim sekmesi | `school-settings.view`, `school-settings.update-contact` | |
| Adres sekmesi | `school-settings.view`, `school-settings.update-address` | Lookup tablolarına bağlı cascade selectbox |
| Tema sekmesi | `school-settings.view`, `school-settings.update-theme`, `school-settings.upload-logo` | Logo yükleme ayrı izin |
| Zil Programı sekmesi | `school-settings.view`, `school-settings.manage-bell` | Bulk + per-row CRUD |
| Tatiller sekmesi (`HolidayFormModal`) | `school-settings.view`, `school-settings.manage-holidays` | Okul-spesifik tatil (`school_holidays`), global resmi tatiller (`official_holidays`) read-only |
| Modüller sekmesi (`ModuleConfigTab`) | `school-settings.view`, `school-settings.manage-modules` | Plan kısıtlı modüller (örn. `reports`) read-only badge |
| Bildirimler sekmesi | `school-settings.view`, `school-settings.manage-notifications` | Global `notification_types` master listeden okur |

---

## Resource-Level Scope Kuralları

- SchoolAdmin → sadece kendi okulu (tenant filter zaten EF Core query filter ile uygulanır). Cross-tenant erişim `SecurityException` ile 403.
- Tüm `school-settings.*` izinler tek-okul scope'ludur; SuperAdmin için cross-tenant override sadece `school-settings.view` üzerinde geçerli (denetim amaçlı).

---

## Default Deny

Matriste açıkça verilmemiş = **erişim yok**. SCHOOL_ADMIN dışında tüm rollere default `🚫` gelir.

> Detay: `permission-matrix.md` § 7.
