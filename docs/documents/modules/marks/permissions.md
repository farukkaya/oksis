# Not — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## Permission Kodları

| Kod | Anlam |
|---|---|
| `marks.view` | Liste görüntüleme |
| `marks.view-detail` | Detay görüntüleme |
| `marks.create` | Oluşturma |
| `marks.update` | Güncelleme |
| `marks.delete` | Silme (soft) |
| `marks.{{TBD}}` | {{TBD}} |

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine ait | 🚫 = yok | ⚙ = yapılandırılabilir

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `marks.view` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `marks.create` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `marks.update` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `marks.delete` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |

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
