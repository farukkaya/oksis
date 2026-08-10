# Karne — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## Permission Kodları

| Kod | Anlam |
|---|---|
| `report-cards.view` | Liste görüntüleme |
| `report-cards.view-detail` | Detay görüntüleme |
| `report-cards.create` | Oluşturma |
| `report-cards.update` | Güncelleme |
| `report-cards.delete` | Silme (soft) |
| `report-cards.{{TBD}}` | {{TBD}} |

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine ait | 🚫 = yok | ⚙ = yapılandırılabilir

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `report-cards.view` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `report-cards.create` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `report-cards.update` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `report-cards.delete` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |

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
