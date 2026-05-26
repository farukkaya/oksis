# Ders Programı — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## Permission Kodları

| Kod | Anlam | İlgili Endpoint |
|---|---|---|
| `timetable.view` | Programı görüntüleme (scope-bağımlı — kendine veya kapsamına ait) | #1, #2, #10–14, #21, #26, #27 |
| `timetable.view-all` | Tüm okul matrisi (sınırsız scope) | #15 |
| `timetable.view-rooms` | Derslik listesi/detay görüntüleme | #16, #17 |
| `timetable.manage` | Schedule oluştur/güncelle/sil (Draft seviyesinde) | #3, #4, #5, #6, #7, #8 |
| `timetable.publish` | Taslak programı yayınlama (kritik aksiyon, SchoolAdmin) | #9 |
| `timetable.override` | Tek günlük değişiklik (iptal, yerine geçme, derslik/saat değişikliği) | #22, #23 |
| `timetable.manage-rooms` | Derslik CRUD | #18, #19, #20 |
| `timetable.import-excel` | Excel ile toplu içe aktarım tetikleme | #24, #25 |

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine ait (scope filtreli) | 🚫 = yok | ⚙ = yapılandırılabilir

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff (Koordinatör) | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `timetable.view` | ✅ | ✅ | ✅ | 👁 | 👁 | 👁 | 👁 (sadece derslik doluluk) |
| `timetable.view-all` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `timetable.view-rooms` | ✅ | ✅ | ✅ | ✅ | 🚫 | 🚫 | ✅ |
| `timetable.manage` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `timetable.publish` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `timetable.override` | 🚫 | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| `timetable.manage-rooms` | 🚫 | ✅ | ⚙ | 🚫 | 🚫 | 🚫 | 🚫 |
| `timetable.import-excel` | 🚫 | ✅ | ⚙ | 🚫 | 🚫 | 🚫 | 🚫 |

**Kararlar / Gerekçeler:**

- **`timetable.publish` sadece SchoolAdmin**: Yayın etkisi büyük (tüm okul + bildirim seli). Koordinatör Draft hazırlar, SchoolAdmin onaylar.
- **`timetable.override` koordinatöre açık**: Sezon içi öğretmen hastalığı gibi günlük operasyon hızlı yönetilmeli; SchoolAdmin onayını beklemek pratik değil.
- **`timetable.manage-rooms` koordinatöre `⚙`**: Çoğu okulda derslik envanteri yıllar arası stabil. Default kapalı, gerekirse SchoolAdmin açar.
- **`SuperAdmin` sadece view**: Cross-tenant impersonation dışında müdahale yok (KVKK + audit).
- **`Secretary` sadece derslik doluluk**: Veli toplantısı/etkinlik planlarken "boş derslik var mı" sorgusu için minimum erişim. Schedule içeriği görmez (öğretmen-ders eşleşmesini ifşa etmez).

---

## Resource-Level Scope Kuralları

Permission yetmez, kapsam (scope) da kontrol edilir. Handler `IScheduleAccessPolicy` üzerinden filtre uygular:

### Teacher

```
schedules.teacher_id == currentUser.TeacherId
  OR schedules.branch_id IN (
       SELECT branch_id FROM teacher_branches
       WHERE teacher_id = currentUser.TeacherId)
```

Yani: kendi dersleri **VEYA** rehber/idari görevli olduğu şubelerin tam programı.

### Parent

```
schedules.branch_id IN (
  SELECT students.branch_id
  FROM students
  INNER JOIN student_parents sp ON sp.student_id = students.id
  WHERE sp.parent_id = currentUser.Id
    AND sp.can_view_attendance = 1            -- velinin yetkisi var mı (parent modülünden gelen flag)
    AND students.is_deleted = 0
)
```

Çoklu çocuk: tüm çocukların şubeleri otomatik dahil. UI'da çocuk seçici filtre uygular ama backend her durumda yetki kontrolü yapar.

### Student

```
schedules.branch_id == currentUser.Student.BranchId
```

Tek şube. Geçmiş şube (sezon değişimi sonrası) görmez — sadece aktif kayıt olduğu şube.

### Secretary

```
endpoint == GET /api/v1/timetable/rooms/{roomId}/weekly
  AND scope == read-only
```

Sadece #12 endpoint'i. Diğer view endpoint'leri 403.

### SchoolAdmin / SchoolStaff (Koordinatör)

`SchoolId == currentUser.SchoolId` — tenant içi sınırsız.

### SuperAdmin

Cross-tenant okuma. Yazma yok. Impersonation aktif değilse audit log + ek confirmation.

---

## Permission Seeding

`SCHOOL_ADMIN` rolüne global `role_permissions` seed'i (yeni okul kurulduğunda otomatik atanır):

```sql
INSERT INTO role_permissions (role_id, permission_code) VALUES
  (@schoolAdminRoleId, 'timetable.view'),
  (@schoolAdminRoleId, 'timetable.view-all'),
  (@schoolAdminRoleId, 'timetable.view-rooms'),
  (@schoolAdminRoleId, 'timetable.manage'),
  (@schoolAdminRoleId, 'timetable.publish'),
  (@schoolAdminRoleId, 'timetable.override'),
  (@schoolAdminRoleId, 'timetable.manage-rooms'),
  (@schoolAdminRoleId, 'timetable.import-excel');

-- Koordinatör (SchoolStaff alt-rolü)
INSERT INTO role_permissions (role_id, permission_code) VALUES
  (@coordinatorRoleId, 'timetable.view'),
  (@coordinatorRoleId, 'timetable.view-all'),
  (@coordinatorRoleId, 'timetable.view-rooms'),
  (@coordinatorRoleId, 'timetable.manage'),
  (@coordinatorRoleId, 'timetable.override');
  -- publish, manage-rooms, import-excel default kapalı; SchoolAdmin elle açar

-- Teacher / Parent / Student / Secretary için sadece view (scope filtreli)
INSERT INTO role_permissions ... ('timetable.view') ...;
```

> Detay seed scripti `data-seed/role_permissions.sql` içinde.

---

## Default Deny

Matriste açıkça verilmemiş = **erişim yok**. Yeni permission eklendiğinde tüm rollere default `🚫` gelir; SchoolAdmin için manuel ekleme gerekir.

> Detay: `permission-matrix.md` § 7.
