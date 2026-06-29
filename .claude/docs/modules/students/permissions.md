# Öğrenci — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## Permission Kodları

Faz 1A'da seed edilen 8 izin (`STUDENTS` modülü, `RolePermissionSeedData`):

| Kod | Anlam |
|---|---|
| `students.view` | Öğrenci listesi görüntüleme |
| `students.view-detail` | Öğrenci detayı görüntüleme |
| `students.create` | Yeni kayıt / transfer-in oluşturma |
| `students.update` | Öğrenci bilgisi güncelleme |
| `students.renew` | Sezon yenileme (Renewal kaydı) |
| `students.manage` | Kayıt dondur / çek / nakil çıkışı (yaşam-döngüsü yönetimi) |
| `students.import` | Toplu öğrenci aktarımı (Faz 2) |
| `students.export` | Öğrenci dışa aktarma (Excel/PDF) |

> **Not:** `students.delete` (soft-delete) bu modülde **yok**. Öğrenci kaydı silinmez; yaşam-döngüsü `students.manage` → Withdrawn/Archived ile yönetilir.

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine ait / kapsam kısıtlı | 🚫 = yok

**Faz 1A seed gerçeği:** SuperAdmin + SchoolAdmin tüm 8 izni alır. Teacher yalnız `view` + `view-detail` alır (kendi sınıfı kapsamında). Diğer roller (SchoolStaff, Parent, Student, Secretary) Faz 1A seed'inde **yok** — aşağıdaki tablo hedef/tasarım durumunu da gösterir.

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `students.view` | ✅ | ✅ | ✅ | 👁 (kendi sınıfları) | 👁 (kendi çocukları) | 👁 (kendisi) | ✅ |
| `students.view-detail` | ✅ | ✅ | ✅ | 👁 (kendi sınıfları) | 👁 (kendi çocukları) | 👁 (kendisi) | ✅ |
| `students.create` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| `students.update` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| `students.renew` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| `students.manage` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `students.import` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |
| `students.export` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ |

> **MVP seed notu (2026-06-29):** SchoolStaff, Secretary rolleri MVP seed'de henüz yok (`Secretary` rolü okul ortamında ileride; tablodaki değerler hedef tasarım). Bkz. `permission-matrix.md` § 1 MVP notu.

---

## Resource-Level Scope Kuralları

Permission yetmez, kapsam (scope) da kontrol edilir:

- **Teacher** → sadece atandığı sınıflardaki öğrenciler üzerinde (`teacher.AssignedClasses.Contains(classId)`)
- **Parent** → sadece kendi çocukları (`studentParent.ParentId == currentUserId`)
- **Student** → sadece kendisi (`student.PersonId == currentUser.PersonId`)
- **SchoolAdmin / SchoolStaff / Secretary** → tenant filter ile kendi okulu (tüm öğrenciler)
- **SuperAdmin** → cross-tenant; `X-Tenant-Override` header ile belirli okul

---

## Default Deny

Matriste açıkça verilmemiş = **erişim yok**. Yeni permission eklendiğinde tüm rollere default `🚫` gelir.

> Detay: `permission-matrix.md` § 7.
