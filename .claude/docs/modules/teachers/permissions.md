# Öğretmen — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## Permission Kodları

| Kod | Anlam |
|---|---|
| `teachers.view` | Liste görüntüleme |
| `teachers.view-detail` | Detay görüntüleme |
| `teachers.create` | Oluşturma |
| `teachers.update` | Güncelleme |
| `teachers.delete` | Silme (soft) |
| `teaching-assignments.view` | Görevlendirme okuma (hub summary/list, öğretmen yükü) — *mevcut* |
| `teaching-assignments.assign` | Görevlendirme yaz (assign/unassign) — *mevcut* |
| `teaching-assignments.copy-season` | Önceki sezondan görevlendirme kopyala — *2026-06-14, yalnız SchoolAdmin* |
| `curriculum-hours.view` | Müfredat haftalık saat görüntüleme (hedef saat) — *2026-06-14* |
| `teachers.{{TBD}}` | {{TBD}} |

> `curriculum-hours.override` / `.import-template` izinleri tam Müfredat Saati modülünde eklenecek (ertelendi, spec §5b).

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine ait | 🚫 = yok | ⚙ = yapılandırılabilir

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|---|
| `teachers.view` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `teachers.create` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `teachers.update` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `teachers.delete` | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} | {{TBD}} |
| `teaching-assignments.copy-season` | 🚫 | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `curriculum-hours.view` | 👁 (oku) | ✅ | 🚫 | 👁 (oku) | 🚫 | 🚫 | 🚫 |

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
