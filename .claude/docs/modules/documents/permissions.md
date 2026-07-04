# Documents (Dosya Yönetimi) — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.
> Kaynak: `.claude/specs/dosya-yonetimi-spec.md` § 4 (bağlayıcı, birebir aktarıldı).

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## ✅ Backend Bağlaması — Faz 3'te UYGULANDI

Bu dosyadaki matris **Faz 3'te backend'e bağlandı**: seed (`MasterSeedIds`/`PermissionSeedData`/`RolePermissionSeedData`, migration `20260704065241_20260704_files_permissions`, 20 `role_permission` satırı) + her komut/sorguda `[RequirePermission("files.*")]` + `[Tenancy(Required)]` (commit `10acbfa` + Task 2-3). `permission-matrix.md` (proje kökü) satırları eklendi. Frontend `usePermission`/`RequirePermission` gate'leri henüz yok (Faz 5, web `shared/files` ile birlikte).

**Secretary seed boşluğu:** Aşağıdaki matriste Secretary→`files.view/upload/download` "Kapsamlı" olarak tanımlı, ancak Secretary rolü **MVP seed'inde yok** (Issue #1, 5-rol seti). Bu satırlar Secretary'ye seed'lenmedi — hedef/gelecek tasarımdır (DUTIES modülü emsali). Diğer 5 rol (SuperAdmin/SchoolAdmin/Teacher/Parent/Student) matrisle birebir seed'lendi. Detay: `completion_status.md → Spec Dışına Çıkılanlar`.

---

## Permission Kodları

Format `{module}.{action}`; **Default Deny** — matriste açıkça verilmeyen izin YOKTUR.

| Kod | Anlam |
|---|---|
| `files.view` | Dosya metadata listesi/detay görüntüleme |
| `files.upload` | Yükleme (proxy + presigned initiate/confirm) |
| `files.download` | İndirme (presigned URL üretimi) |
| `files.delete` | Silme (soft) |
| `files.quota.view` | Okul kota kullanımını görüntüleme |
| `files.policies.manage` | `FileCategoryPolicy` yönetimi (SuperAdmin-only, kod-içi registry — Faz 1'de UI yok) |

---

## Rol Eşleştirmeleri (spec § 4 birebir)

> "Tam": rol, tenant filtresi dışında kısıtsız. "Kapsamlı": izin var ancak resource-level scope uygulanır (bkz. aşağı). "—": izin yok (403).

| İzin Anahtarı | SuperAdmin | SchoolAdmin | Teacher | Parent | Student | Secretary |
|---|---|---|---|---|---|---|
| `files.view` | Tam | Tam (okul) | Kapsamlı | Kapsamlı | Kapsamlı | Kapsamlı |
| `files.upload` | — | Tam (okul) | Kapsamlı | Kapsamlı | Kapsamlı | Kapsamlı |
| `files.download` | Tam | Tam (okul) | Kapsamlı | Kapsamlı | Kapsamlı | Kapsamlı |
| `files.delete` | — | Tam (okul) | Kapsamlı | — | Kapsamlı | — |
| `files.quota.view` | Tam | Tam (okul) | — | — | — | — |
| `files.policies.manage` | Tam | — | — | — | — | — |

> SuperAdmin `files.view`/`files.download` yalnızca `X-Tenant-Override` + audit ile (denetim amaçlı); upload/delete yapamaz.

---

## Resource-Level Scope Kuralları (spec § 4.1)

Permission yetmez, kapsam (scope) da kontrol edilir:

1. **Teacher** → yalnızca kendi görevlendirildiği ders/şube/kulüp entity'lerine bağlı dosyalar (Görevlendirmeler modülü kaynak).
2. **Parent** → yalnızca `ParentStudents` üzerinden bağlı olduğu çocuğun entity'lerine bağlı dosyalar; çoklu çocukta `X-Active-Child-Id`.
3. **Student** → yalnızca kendi entity'lerine bağlı dosyalar; kendi teslimini silebilir (teslim süresi kapanana kadar — ilgili modülün kuralı).
4. Kapsam ihlali **404** döner (kaynağın varlığını sızdırmamak için); izin yokluğu **403** döner.
5. Her presigned GET üretimi audit loguna yazılır: kim, hangi dosya, ne zaman.

---

## Default Deny

Matriste açıkça verilmemiş = **erişim yok**. Yeni permission eklendiğinde tüm rollere default `—` gelir.

> Detay: `permission-matrix.md` § 7 (bu modülün satırları eklendi — Faz 3, bkz. "Documents (Dosya Yönetimi)" bölümü).
