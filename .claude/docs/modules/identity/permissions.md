# Kimlik Doğrulama — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## Permission Kodları (32 izin · seed edilmiş)

Backend `permissions` tablosunda HasData() ile seed edilir. Format: `{module}.{action}` (küçük harf).

### USERS (5)

| Kod | Anlam |
|---|---|
| `users.read` | Kullanıcı listesini görüntüle |
| `users.create` | Kullanıcı ekle |
| `users.update` | Kullanıcı düzenle |
| `users.delete` | Kullanıcı sil (soft) |
| `users.import` | Excel'den toplu aktar |

### ATTENDANCE (2)

| Kod | Anlam |
|---|---|
| `attendance.read` | Yoklama görüntüle |
| `attendance.write` | Yoklama gir |

### GRADES (3)

| Kod | Anlam |
|---|---|
| `grades.read` | Not görüntüle |
| `grades.write` | Not gir |
| `grades.publish` | Not yayınla |

### SCHEDULE (2)

| Kod | Anlam |
|---|---|
| `schedule.read` | Ders programı görüntüle |
| `schedule.manage` | Ders programı düzenle |

### ANNOUNCEMENTS (2)

| Kod | Anlam |
|---|---|
| `announcements.read` | Duyuru görüntüle |
| `announcements.manage` | Duyuru yönet |

### REPORTS (2)

| Kod | Anlam |
|---|---|
| `reports.read` | Rapor görüntüle |
| `reports.export` | Rapor dışa aktar |

### SETTINGS (2 — genel)

| Kod | Anlam |
|---|---|
| `settings.read` | Genel ayarları görüntüle |
| `settings.manage` | Genel ayarları yönet |

### DUTY (2)

| Kod | Anlam |
|---|---|
| `duty.read` | Nöbet görüntüle |
| `duty.manage` | Nöbet yönet |

### HOMEWORK (2)

| Kod | Anlam |
|---|---|
| `homework.read` | Ödev görüntüle |
| `homework.manage` | Ödev yönet |

### SCHOOL_SETTINGS (10 — endpoint bazlı detay)

`SchoolSettingsController` endpoint'leri için detay kırılım. Detay: `modules/school-settings/permissions.md`.

| Kod | Anlam |
|---|---|
| `school-settings.view` | Tüm okul ayarları sekmelerini görüntüle |
| `school-settings.update-basic` | Temel bilgiler güncelle |
| `school-settings.update-contact` | İletişim bilgileri güncelle |
| `school-settings.update-address` | Adres güncelle |
| `school-settings.update-theme` | Tema güncelle |
| `school-settings.upload-logo` | Logo yükle/sil |
| `school-settings.manage-bell` | Zil programı yönet |
| `school-settings.manage-holidays` | Tatil günleri yönet |
| `school-settings.manage-modules` | Modül aktif/pasif toggle |
| `school-settings.manage-notifications` | Bildirim tercihleri yönet |

---

## Rol Default Matrisi

Backend `role_permissions` seed dağılımı (66 satır):

| Rol | Toplam İzin | Modüller |
|---|---|---|
| SUPER_ADMIN | (cross-tenant, izin bypass + `X-Tenant-Override`) | — |
| SCHOOL_ADMIN | 32 | USERS (5) + ATTENDANCE (2) + GRADES (3) + SCHEDULE (2) + ANNOUNCEMENTS (2) + REPORTS (2) + SETTINGS (2) + DUTY (2) + HOMEWORK (2) + SCHOOL_SETTINGS (10) |
| VICE_PRINCIPAL | 12 | USERS (3: read/create/update) + ATTENDANCE (2) + GRADES (1: read) + SCHEDULE (2) + ANNOUNCEMENTS (2) + DUTY (2) |
| TEACHER | 8 | ATTENDANCE (2) + GRADES (3) + SCHEDULE (1: read) + ANNOUNCEMENTS (1: read) + HOMEWORK (2) |
| COUNSELOR | 4 | ATTENDANCE (1: read) + GRADES (1: read) + REPORTS (1: read) + ANNOUNCEMENTS (1: read) |
| PARENT | 4 | ATTENDANCE (1: read) + GRADES (1: read) + HOMEWORK (1: read) + ANNOUNCEMENTS (1: read) |
| STUDENT | 5 | GRADES (1: read) + ATTENDANCE (1: read) + HOMEWORK (1: read) + ANNOUNCEMENTS (1: read) + SCHEDULE (1: read) |

> Tam matrix için: `permission-matrix.md`.

---

## Resource-Level Scope

İzin sahibi olmak yetmez — kapsam (scope) kontrolü `Application/Common/Behaviors/AuthorizationBehavior` + handler içi `IResourceAuthorizationService` ile yapılır:

- **Teacher** → atandığı sınıflar
- **Parent** → kendi çocukları
- **Student** → kendisi
- **SchoolAdmin/VicePrincipal/Counselor** → tek okul (EF tenant filter)
- **SuperAdmin** → cross-tenant (`X-Tenant-Override` header + audit log)

---

## Default Deny

Matriste açıkça verilmemiş = **erişim yok**. `[HasPermission("x.y")]` attribute'ı yoksa endpoint default `[Authorize]` ile sadece JWT validate eder; ek yetki kontrolü açıkça eklenmeli.

> Detay: `permission-matrix.md` § 7, `backend/security-rules.md`.
