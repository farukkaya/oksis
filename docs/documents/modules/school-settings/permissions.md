# Okul Ayarları — Permissions (Güncellenmiş)

> Mevcut 10 permission korunur, 2 yeni eklenir. Toplam: **12 permission**.

---

## Permission Kodları (12 izin)

| # | Kod | Action | Endpoint(ler) | Durum |
|---|---|---|---|---|
| 1 | `school-settings.view` | VIEW | GET endpoints | Mevcut |
| 2 | `school-settings.update-basic` | UPDATE_BASIC | PUT /basic-info | Mevcut |
| 3 | `school-settings.update-contact` | UPDATE_CONTACT | PUT /contact-info | Mevcut |
| 4 | `school-settings.update-address` | UPDATE_ADDRESS | PUT /address | Mevcut |
| 5 | `school-settings.update-theme` | UPDATE_THEME | PUT /theme | Mevcut |
| 6 | `school-settings.upload-logo` | UPLOAD_LOGO | POST/DELETE /logo | Mevcut |
| 7 | `school-settings.manage-bell` | MANAGE_BELL | bell-schedules CRUD + bulk | Mevcut |
| 8 | `school-settings.manage-holidays` | MANAGE_HOLIDAYS | holidays CRUD | Mevcut |
| 9 | `school-settings.manage-modules` | MANAGE_MODULES | PATCH /modules/{key} | Mevcut |
| 10 | `school-settings.manage-notifications` | MANAGE_NOTIFICATIONS | PUT /notification-config | Mevcut |
| **11** | **`school-settings.update-academic-structure`** | UPDATE_ACADEMIC_STRUCTURE | PUT /academic-structure, PUT /grade-levels | **⭐ YENİ** |
| **12** | **`school-settings.update-academic-policy`** | UPDATE_ACADEMIC_POLICY | PUT /academic-policy, PUT /grade-level-scales | **⭐ YENİ** |

> ⚠️ `UpdateAcademicStructure` endpoint (#6) permission'ı `update-basic`'ten `update-academic-structure`'a taşındı (BR-SS-015).

---

## Rol Matrisi (güncellenmiş)

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| `view` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `update-basic` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `update-contact` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `update-address` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `update-theme` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `upload-logo` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `manage-bell` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `manage-holidays` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `manage-modules` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `manage-notifications` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| **`update-academic-structure`** ⭐ | 🚫 | ✅ | ⚙️ | 🚫 | 🚫 | 🚫 |
| **`update-academic-policy`** ⭐ | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

**Notlar:**
- `update-academic-structure` ⚙️ SchoolStaff'a verilebilir (konfigüre edilebilir) — müdür yardımcısı kademe/yapı düzenleyebilir
- `update-academic-policy` sadece SchoolAdmin'e — geçme notu, skala gibi kritik kararlar müdür sorumluluğunda

**Migration seed:** 2 yeni permission + 2 yeni role_permission (SCHOOL_ADMIN → her ikisi).