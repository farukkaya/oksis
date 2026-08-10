# Sınıf / Şube — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## Permission Kodları

| Kod | Anlam |
|---|---|
| `classrooms.view` | Liste görüntüleme |
| `classrooms.view-detail` | Detay görüntüleme |
| `classrooms.create` | Oluşturma |
| `classrooms.update` | Güncelleme |
| `classrooms.delete` | Silme (soft) |
| `class-rooms.archive` | Şube arşivleme (soft-delete; canlı uç `POST /class-rooms/{id}/archive`) |
| `class-rooms.delete` | Şube kalıcı silme (hard delete; canlı uç `DELETE /class-rooms/{id}` → `is_deleted=1`, slot serbest) |
| `classrooms.{{TBD}}` | {{TBD}} |

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine ait | 🚫 = yok | ⚙ = yapılandırılabilir

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `classrooms.view` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `classrooms.create` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `classrooms.update` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `classrooms.delete` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `class-rooms.archive` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `class-rooms.delete` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

> `class-rooms.delete` seed: `PermissionSeedData.cs` + migration
> `20260628_add_class_rooms_delete_permission` (SuperAdmin + SchoolAdmin).

---

## Resource-Level Scope Kuralları

Permission yetmez, kapsam (scope) da kontrol edilir:

- **Teacher** → sadece atandığı sınıflar üzerinde (`teacher.AssignedClasses.Contains(classId)`)
- **Parent** → sadece kendi çocuğu (`studentParent.ParentId == currentUserId`)
- **Student** → sadece kendisi (`student.UserId == currentUserId`)
- **Diğer:** {{TBD}}

---

## Default Deny

Matriste açıkça verilmemiş = **eri̇şi̇m yok**. Yeni permission eklendiğinde tüm rollere default `🚫` gelir.

> Detay: `permission-matrix.md` § 7.
