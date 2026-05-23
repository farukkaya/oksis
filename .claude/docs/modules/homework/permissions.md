# Ödev — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## Permission Kodları

| Kod | Anlam |
|---|---|
| `homework.view` | Liste görüntüleme |
| `homework.view-detail` | Detay görüntüleme |
| `homework.create` | Oluşturma |
| `homework.update` | Güncelleme |
| `homework.delete` | Silme (soft) |
| `homework.{{TBD}}` | {{TBD}} |

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine ait | 🚫 = yok | ⚙ = yapılandırılabilir

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `homework.view` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `homework.create` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `homework.update` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `homework.delete` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |

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
