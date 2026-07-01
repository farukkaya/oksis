# Permission Matrix

> Yetki sistemi **bu dosya üzerinden tek noktadan yönetilir**. AI yeni bir endpoint / sayfa / aksiyon eklerken **mutlaka** bu matrise göre `[RequirePermission(...)]` veya menü filtresi uygular.

---

## 1. Roller

| Kod | Tanım | Tenant Scope |
|---|---|---|
| `SuperAdmin` | OKSİS firma yöneticisi | Cross-tenant (sistem geneli) |
| `SchoolAdmin` | Okul müdürü / yönetici | Tek okul |
| `SchoolStaff` | Müdür yardımcısı, koordinatör | Tek okul |
| `Teacher` | Öğretmen | Tek okul |
| `Parent` | Veli | Tek okul (çocuğu/çocukları üzerinden) |
| `Student` | Öğrenci | Tek okul |
| `Secretary` | Sekreter / idari | Tek okul (sınırlı) |
| `Accountant` | Muhasebe | Tek okul (sadece finans) |

> **⚠️ MVP seed = 5 rol (2026-06-05, Issue #1).** Backend `system_roles` seed'i MVP'de yalnızca şu 5 rolü içerir: **`SuperAdmin, SchoolAdmin, Teacher, Parent, Student`**. `SchoolStaff`, `Secretary`, `Accountant` (ve eski seed'deki `VicePrincipal`/`Counselor`) **henüz seed'de yok**; MVP sonrasına ertelendi. Bu tablodaki ve aşağıdaki matristeki o sütunlar **hedef/gelecek durumu** dokümante eder — runtime'da bu roller atanamaz. Yeni rol eklendiğinde seed (`SystemRoleSeedData`/`RolePermissionSeedData`) + bu matris birlikte güncellenir. Detay: `modules/identity/completion_status.md → Spec Dışına Çıkılanlar`.

---

## 2. İzin Sistemi (Permission)

İzinler **string sabit**, format: `{module}.{action}`

Aksiyonlar:
- `view` — listele/oku
- `view-detail` — detay görüntüle
- `create` — oluştur
- `update` — düzenle
- `delete` — sil
- `publish` — yayınla (taslaktan canlıya)
- `export` — dışa aktar (PDF, Excel)
- `import` — içe aktar
- `manage` — full kontrol (bu modülde her şey)

---

## 3. İzin Matrisi (Modül × Rol)

> ✅ = full | 👁 = sadece kendine ait | 🚫 = yok | ⚙ = yapılandırılabilir

### Identity / User Management

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `users.view` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| `users.create` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.update` | ✅ | ✅ | 🚫 | 👁 (self) | 👁 (self) | 👁 (self) | 🚫 |
| `users.delete` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.view-detail` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| `users.view-all` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.suspend` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.graduate` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.transfer` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.archive` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.invite` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.revoke-invite` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `roles.manage` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `roles.assign` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `consents.manage` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

> **`users.view-all` (ABAC broad scope):** `users.view-detail` "detay görebilir mi?" RBAC sorusudur; `users.view-all` ise kaynak-seviyesi kapsam kontrolünde (`PersonAccessGuard`) "kapsam kısıtı olmadan tenant içindeki **herkesi** görebilir mi?" anlamına gelir. Bu izni olmayan (veli/öğretmen) yalnız ilişkili kişileri görür (veli→CanViewInfo'lu çocuk, öğretmen→kendi sınıfı). TQ-auth-002 sonrası guard rolü JWT'den değil bu izinden okur.

### Schools (Tenant)

| İzin | SuperAdmin | SchoolAdmin | Diğer |
|---|---|---|---|
| `schools.create` | ✅ | 🚫 | 🚫 |
| `schools.update` | ✅ | 👁 (own school config) | 🚫 |
| `schools.suspend` | ✅ | 🚫 | 🚫 |
| `academicyears.manage` | 🚫 | ✅ | 🚫 |

### School Settings (endpoint bazlı detay yetki)

Backend `SchoolSettingsController` (20 yetkili endpoint) için endpoint kırılımlı izinler. Backend seed: `permissions` tablosunda `SCHOOL_SETTINGS` modülü altında 13 satır, `role_permissions` tablosunda (manage-authority hariç tümü) SCHOOL_ADMIN'e otomatik atanır. `school-settings.manage-authority` yalnız SuperAdmin'e seed edilir (K5).

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `school-settings.view` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| `school-settings.update-basic` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.update-contact` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.update-address` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.update-theme` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.upload-logo` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.manage-bell` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.manage-holidays` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.manage-modules` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.manage-notifications` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.update-academic-structure` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.update-academic-policy` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `school-settings.manage-authority` | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

> **Not:** `schools.update` ile `school-settings.*` paralel — bu izinler özellikle Okul Ayarları ekranındaki sekme bazlı yetki kırılımı için. Detay: `modules/school-settings/permissions.md`.

### Class Rooms (Derslik / fiziksel Room)

`CLASS_ROOMS` modülü. `class-rooms.view` + `class-rooms.manage` Okul Ayarları Derslikler sekmesini (RoomsTab CRUD) besler; endpoint bağlama BE-3'te yapılır. Backend seed: SuperAdmin + SchoolAdmin (master `AllPermissionIds()` kataloğu). Şube/öğrenci atama gibi diğer `class-rooms.*` slug'ları AcademicSessions modülünde tanımlı.

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `class-rooms.view` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `class-rooms.manage` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `class-rooms.archive` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | <!-- Şube arşivleme (soft-delete) — POST /class-rooms/{id}/archive. rename/status ile aynı yetki seviyesi (yalnız admin). Backend seed: PermissionSeedData.cs:114. 2026-06-28 eklendi (FE şube arşivleme). -->
| `class-rooms.delete` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | <!-- Şube kalıcı silme (hard delete) — DELETE /class-rooms/{id} → is_deleted=1, slot serbest (aynı isim yeniden açılabilir). archive ile aynı yetki seviyesi (yalnız admin). 409: aktif öğrenci (ClassRoom.HasActiveStudents). Backend seed: PermissionSeedData.cs + migration 20260628_add_class_rooms_delete_permission (SuperAdmin+SchoolAdmin). 2026-06-28 eklendi (FE+BE şube kalıcı silme). -->


### Students

> Faz 1A seed (2026-06-29): SuperAdmin + SchoolAdmin tüm 8 izni alır; Teacher view+view-detail. SchoolStaff/Secretary/Parent/Student hedef tasarım (MVP seed'de henüz yok). `students.delete` **yoktur** — yaşam-döngüsü `students.manage` ile yönetilir.

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `students.view` | ✅ | ✅ | ✅ | 👁 (sınıflarındakiler) | 👁 (çocukları) | 👁 (kendisi) | ✅ |
| `students.view-detail` | ✅ | ✅ | ✅ | 👁 (sınıflarındakiler) | 👁 (çocukları) | 👁 (kendisi) | ✅ |
| `students.create` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| `students.update` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| `students.renew` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ | <!-- Sezon yenileme (Renewal). Faz 1A seed. 2026-06-29 eklendi. -->
| `students.manage` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | <!-- Kayıt dondur/çek/nakil çıkışı (yaşam-döngüsü). Faz 1A seed. 2026-06-29 eklendi. -->
| `students.import` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| `students.export` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ | <!-- Dışa aktarma (Excel/PDF). Faz 1A seed. 2026-06-29 eklendi. -->
| `season.student.promote` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | <!-- Sezon terfisi (§4.9). 2026-06-09 eklendi; ActivateSeasonRollover + bağımsız uç. -->

### Teachers

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `teachers.view` | ✅ | ✅ | ✅ | ✅ | 👁 (çocuğunun) | 👁 (kendisinin) | ✅ |
| `teachers.create` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `teachers.update` | 🚫 | ✅ | ✅ | 👁 (self) | 🚫 | 🚫 | 🚫 |
| `teachers.delete` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `teaching-assignments.view` | ✅ | ✅ | ✅ | 👁 (kendi yükü) | 🚫 | 🚫 | ✅ | <!-- Görevlendirme hub okuma (summary/list) + öğretmen yükü. Mevcut izin. -->
| `teaching-assignments.assign` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | <!-- Görevlendirme yaz (assign/unassign). Mevcut izin. -->
| `teaching-assignments.copy-season` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | <!-- Önceki sezondan görevlendirme kopyala. SuperAdmin'e VERİLMEZ (gorevlendirme-hub-spec §2.5). 2026-06-14 eklendi. -->
| `curriculum-hours.view` | 👁 (oku) | ✅ | 🚫 | 👁 (oku) | 🚫 | 🚫 | 🚫 | <!-- Müfredat haftalık saat (hedef saat + ders×seviye satırları) okuma. SchoolAdmin tam, SuperAdmin/Teacher oku. 2026-06-14 eklendi. -->
| `curriculum-hours.override` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | <!-- Ders × seviye haftalık saat override (okul/sezon) yazma. YALNIZ SchoolAdmin (SuperAdmin salt-oku — view'da). 2026-06-26 (B0.2H) eklendi. .import-template hâlâ ertelendi. -->

### Academic Calendar

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `academic-calendar.manage` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | <!-- Akademik Takvim yönetim aksiyonları (etkinlik ekle/dışa aktar/sezon ekseni). Ekran süperadmin hariç TÜM rollerde görünür ama salt-okunur; bu izin yalnız yönetimi açar. SchoolStaff okul ayarına göre kısıtlanabilir. 2026-06-09 eklendi. -->
| `season.archive.view` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | <!-- switch-season ile geçmiş/arşiv sezona salt-okunur geçiş (B2). Setup sezona geçiş `season.update` ister; current sezon izinsiz. Yalnız SuperAdmin+SchoolAdmin seed (ACADEMIC_SESSIONS/ARCHIVE_VIEW). 2026-06-22 eklendi. -->
| `season.renewal.open` | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | <!-- Sezonun yenileme (rollover köprüsü) dönemini aç — POST /academic-sessions/{id}/open-renewal-period. YALNIZ Setup statüde, idempotent. Faz 3B (öğrenci kayıt yenileme köprüsü) yeni izin — DEFAULT-DENY, hiçbir role seed'de verilmedi (bilinçli en-az-yetki kararı, S5). Backend seed: PermissionSeedData.cs. 2026-07-01 eklendi. -->

### Classes / Timetable

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `classes.view` | ✅ | ✅ | ✅ | ✅ | 👁 (çocuğun şubesi) | 👁 (kendi şubesi) | ✅ |
| `classes.manage` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `timetable.view` | ✅ | ✅ | ✅ | 👁 (kendi dersleri) | 👁 (çocukları) | 👁 (kendisi) | ✅ |
| `timetable.manage` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `timetable.publish` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `timetable.delete` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `timetable.override` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

### Attendance

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `attendance.view` | ✅ | ✅ | ✅ | 👁 (kendi dersleri) | 👁 (çocukları) | 👁 (kendisi) | 🚫 |
| `attendance.create` | 🚫 | ✅ (geçmiş gün) | 🚫 | ✅ (kendi dersleri, o gün) | 🚫 | 🚫 | 🚫 |
| `attendance.update` | 🚫 | ✅ | ✅ | ✅ (kendi dersleri, o gün) | 🚫 | 🚫 | 🚫 |
| `attendance.export` | 🚫 | ✅ | ✅ | 👁 (kendi sınıfları) | 🚫 | 🚫 | 🚫 |

### Grades (Mark)

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `marks.view` | ✅ | ✅ | ✅ | 👁 (kendi dersleri) | 👁 (çocukları, sadece Published) | 👁 (kendi, sadece Published) | 🚫 |
| `marks.create` | 🚫 | 🚫 | 🚫 | ✅ (kendi dersleri) | 🚫 | 🚫 | 🚫 |
| `marks.update` | 🚫 | ✅ (Locked dahil, audit ile) | 🚫 | ✅ (kendi dersleri, Locked değilse) | 🚫 | 🚫 | 🚫 |
| `marks.publish` | 🚫 | ✅ | 🚫 | ✅ (kendi dersleri) | 🚫 | 🚫 | 🚫 |
| `marks.delete` | 🚫 | ✅ (audit) | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `reportcards.view` | ✅ | ✅ | ✅ | 👁 (kendi sınıfları) | 👁 (çocukları) | 👁 (kendisi) | 🚫 |
| `reportcards.publish` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

### Homework

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `homework.view` | ✅ | ✅ | ✅ | 👁 (kendi atadığı) | 👁 (çocukları) | 👁 (kendisi) | 🚫 |
| `homework.create` | 🚫 | 🚫 | 🚫 | ✅ | 🚫 | 🚫 | 🚫 |
| `homework.update` | 🚫 | 🚫 | 🚫 | ✅ (kendi atadığı) | 🚫 | 🚫 | 🚫 |
| `homework.delete` | 🚫 | ✅ | 🚫 | ✅ (kendi atadığı, teslim yoksa) | 🚫 | 🚫 | 🚫 |
| `homework.submit` | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ (kendisi) | 🚫 |
| `homework.grade` | 🚫 | 🚫 | 🚫 | ✅ (kendi atadığı) | 🚫 | 🚫 | 🚫 |

### Announcements

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `announcements.view` | ✅ | ✅ | ✅ | ✅ | ✅ (kendisine hedefli) | ✅ (kendisine hedefli) | ✅ |
| `announcements.create` | 🚫 | ✅ (her hedef) | ✅ (her hedef) | ✅ (sadece kendi sınıfları) | 🚫 | 🚫 | 🚫 |
| `announcements.update` | 🚫 | ✅ | ✅ | ✅ (kendi oluşturduğu) | 🚫 | 🚫 | 🚫 |
| `announcements.delete` | 🚫 | ✅ | ✅ | ✅ (kendi oluşturduğu) | 🚫 | 🚫 | 🚫 |

### Messaging

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `messages.send-to-parent` | 🚫 | ✅ | ✅ | ✅ | — | 🚫 | 🚫 |
| `messages.send-to-teacher` | 🚫 | ✅ | ✅ | ✅ | ✅ | ⚙ (default 🚫) | 🚫 |
| `messages.send-to-student` | 🚫 | ✅ | ✅ | ⚙ (default 🚫) | — | 🚫 | 🚫 |
| `messages.view-all` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

### Notifications

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `notifications.view` | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 | 👁 |
| `notifications.broadcast` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

### Dashboard

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `dashboard.admin` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 👁 (limited) |
| `dashboard.teacher` | 🚫 | 🚫 | 🚫 | ✅ | 🚫 | 🚫 | 🚫 |
| `dashboard.parent` | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | 🚫 | 🚫 |
| `dashboard.student` | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | ✅ | 🚫 |

### Duties (Nöbet & Vekâlet) — Faz 4/Dilim 2a

> Bağlayıcı karar K-2a-6 (2026-06-19): SuperAdmin salt-okunur; manage+substitute yalnız SchoolAdmin.
> Secretary→duties.view eşlemesi ertelendi (seed'li Secretary rolü yok — Debt).

| İzin | SuperAdmin | SchoolAdmin | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|
| `duties.view` | ✅ | ✅ | 👁 (yalnız kendi D15) | 🚫 | 🚫 | 🚫 (ertelendi) |
| `duties.manage` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `duties.substitute` | 🚫 | ✅ | 🚫 (S6/me erişimi Dilim 2b FE'de değerlendirilecek) | 🚫 | 🚫 | 🚫 |
| `duties.view-load` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |

### Finance (Sprint 5+, taslak)

| İzin | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Accountant |
|---|---|---|---|---|---|---|---|
| `finance.view` | 🚫 | ✅ | 🚫 | 🚫 | 👁 (çocukları) | 🚫 | ✅ |
| `finance.manage` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |

---

## 4. Erişim Kapsam Kuralları (Resource-level)

İzin sahibi olmak yetmez — **kapsam (scope)** kontrolü de yapılır:

### Teacher
- Sadece **kendi atandığı dersler / sınıflar** üzerinde işlem yapabilir.
- DbContext sorgusu: `teacher.AssignedClasses.Contains(classId)`
- Implementation: `IResourceAuthorizationService.CanAccessClassAsync(teacherId, classId)`

### Parent
- Sadece **kendi çocuklarının** verisine erişebilir.
- DbContext: `studentParent.ParentId == currentUserId`
- Birden fazla çocuk varsa **child switcher** ile aktif çocuk seçilir; istek başlığında `X-Active-Child-Id` opsiyonel.

### Student
- Sadece **kendisinin** verisine erişebilir.
- `student.UserId == currentUserId`

### SchoolAdmin / SchoolStaff / Secretary
- Sadece **kendi okulunun** verisine erişebilir (tenant filter zaten uygular).

### SuperAdmin
- Tüm okullara erişebilir, ancak default davranış: tek bir okul seçili (header: `X-Tenant-Override`).
- Audit log: SuperAdmin her tenant override işlemini kaydeder.

---

## 5. Backend Implementation Patern'i

```csharp
// Pipeline behavior'da otomatik kontrol
[RequirePermission("students.view")]
public sealed record GetStudentByIdQuery(Guid Id) : IRequest<Result<StudentDetailDto>>;

// Resource-level scope için handler içinde
public async Task<Result<StudentDetailDto>> Handle(...)
{
    var canAccess = await _resourceAuth.CanAccessStudentAsync(_currentUser.Id, request.Id);
    if (!canAccess) return Result.Forbidden();
    // ...
}
```

---

## 6. Frontend Implementation Pattern'i

```tsx
// Hook
const { hasPermission } = usePermission();
if (!hasPermission('students.create')) return null;

// Component
<RequirePermission permission="students.manage">
  <ManageButton />
</RequirePermission>

// Menu
const menu = MENU_ITEMS.filter(item => hasPermission(item.permission));
```

---

## 7. Default Deny Prensibi

- **İzin matriste açıkça verilmemişse → erişim YOK.**
- Yeni bir izin eklendiğinde tüm rollere default `🚫` olarak gelir; her rol için açıkça izin eklenmeli.
- "🚫" durumunda API: **403 Forbidden** (404 değil — kullanıcı kaynağı görüp izin almak için talep edebilsin).
- "👁" durumunda kaynağa erişim yoksa: **404 Not Found** (kaynağın varlığını sızdırmamak için).
