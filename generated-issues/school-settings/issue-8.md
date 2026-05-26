# API-8 — Migration: 2 yeni permission seed + `update-academic-structure` taşıma

## Description
2 yeni permission seed et ve mevcut `UpdateAcademicStructure` endpoint'inin permission bağlantısını `school-settings.update-basic`'ten `school-settings.update-academic-structure`'a taşı (BR-SS-015 — breaking change).

## Scope
- Yeni migration: `20260527_add_school_settings_academic_permissions`
- (İsteğe bağlı) `oksis-api/src/Oksis.Infrastructure/Seed/PermissionSeedData.cs` güncellemesi (eğer ayrı bir static seed listesi varsa, yeni iki kod eklenir)

## Implementation

### Yeni permission'lar (`permissions` tablosu)

| Kod | Action |
|---|---|
| `school-settings.update-academic-structure` | UPDATE_ACADEMIC_STRUCTURE |
| `school-settings.update-academic-policy` | UPDATE_ACADEMIC_POLICY |

### Role mapping (`role_permissions`)

- `SCHOOL_ADMIN` rolüne **her ikisi** otomatik atanır
- Diğer roller manual

### Endpoint permission taşıma

Bu migration **veri seviyesinde** taşıma yapmaz — kod seviyesinde `SchoolSettingsController.UpdateAcademicStructure` action'ının `[HasPermission("...update-basic")]` attribute'u ISSUE-14'te güncellenir. Migration ise yalnızca yeni permission'ı ortama kazandırır.

> Eğer `role_permissions` tablosunda eski `(SCHOOL_ADMIN, school-settings.update-basic)` satırı *yalnızca* akademik yapı için kullanılıyorsa silinmez — başka endpoint'ler (basic info güncelleme) `update-basic`'i kullanmaya devam ediyor.

### Migration SQL
```sql
-- Permission seed (idempotent: NOT EXISTS koruması)
INSERT INTO permissions (id, code, description, is_active, ...)
SELECT NEWID(), 'school-settings.update-academic-structure', N'Akademik yapı (sınıf kademesi, ders günleri) güncelleme', 1, ...
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'school-settings.update-academic-structure');

INSERT INTO permissions (id, code, description, is_active, ...)
SELECT NEWID(), 'school-settings.update-academic-policy', N'Akademik politika (skala, geçme notu) güncelleme', 1, ...
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'school-settings.update-academic-policy');

-- SCHOOL_ADMIN rolüne map
INSERT INTO role_permissions (role_id, permission_id, ...)
SELECT r.id, p.id, ...
FROM roles r CROSS JOIN permissions p
WHERE r.code = 'SCHOOL_ADMIN'
  AND p.code IN ('school-settings.update-academic-structure', 'school-settings.update-academic-policy')
  AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.role_id = r.id AND rp.permission_id = p.id);
```

### `Down()` SQL
- `role_permissions` satırları → DELETE WHERE permission.code IN (...)
- `permissions` satırları → DELETE WHERE code IN (...)

## Acceptance Criteria
- [ ] Migration idempotent (tekrar çalıştırılırsa hata vermez)
- [ ] `permissions` tablosunda 2 yeni satır mevcut
- [ ] `role_permissions` tablosunda `(SCHOOL_ADMIN, school-settings.update-academic-structure)` ve `(SCHOOL_ADMIN, school-settings.update-academic-policy)` satırları mevcut
- [ ] Diğer roller (TEACHER, PARENT, STUDENT, SUPER_ADMIN) bu iki permission'a sahip değil
- [ ] Down migration her şeyi temizler
- [ ] Integration test: SCHOOL_ADMIN kullanıcısı 2 yeni permission'a sahip
- [ ] Integration test: TEACHER kullanıcısı 2 yeni permission'a sahip değil

## Test Requirements
- `Migration_SchoolAdmin_HasNewPermissions`
- `Migration_Teacher_DoesNotHaveNewPermissions`
- `Migration_Idempotent_NoDuplicates`

## Out of Scope
- Controller attribute güncellemesi (ISSUE-14)
- UI permission gate (web tarafı zaten attribute'u atlar)

## Commit Requirement (ZORUNLU)

> ?? Bu b�l�m her generated issue'da **aynen** yer almak zorundadir. Issue tamamlandiginda **ayri bir commit** atilmadik�a issue "Done" sayilmaz.

- [ ] Issue tamamlandiginda **yalnizca bu issue'a ait dosyalar** stage edilir (`git add <path>`); baska issue'larin degisiklikleri ayni commit'e karismaz.
- [ ] Commit, **OKSIS commit kuralina** uygun formatta atilir: `YYYY-MM-DD <type>[,type]: T�rk�e �zet.` � kanonik kural `.claude/docs/git-commit-rules.md`.
- [ ] Issue-linked commit prefix'i kullanilir: `Issue #<no> YYYY-MM-DD <type>: ...` (issue numarasi `gh issue list` veya dosya adindan alinir, �r. `issue-7.md` ? `Issue #7`).
- [ ] Commit **dogru repoda** atilir: API issue'lari ? `oksis-api`, web issue'lari ? `oksis-web`, mobile issue'lari ? `oksis-mobile`. Workspace root (`oksis/`) repo'sunda **kod commit'i atilmaz**.
- [ ] Husky `commit-msg` hook (`oksis-api`) formati zorlar; `--no-verify` **YASAK**. Hook fail olursa root cause'u d�zelt, sonra yeniden commit at � `--amend` ile ge�mis commit'i degistirme; yeni commit at.
- [ ] **Bir issue = bir commit**. Ayni issue i�inde test + implementation ayni commit'e girer (type: `feat,test`). Birden fazla issue tek commit'e birlestirilmez; "mod�l� bitirince hepsini tek commit yapayim" yaklasimi YASAK.
- [ ] Commit mesajinin body'sinde (opsiyonel) Acceptance Criteria'dan tamamlanan kalemler madde madde �zetlenebilir; uzun a�iklamalar PR description'ina birakilir.

**�rnek (tek issue commit'i):**

```
Issue #7 2026-05-24 feat,test: ChangePasswordCommand ve unit testleri eklendi.

- Mevcut parola BCrypt.Verify ile dogrulanir
- PasswordPolicy.Validate �agrisi yeni parola i�in zorunlu
- Basarili degisimde t�m refresh token'lar revoke edilir
- 3 handler testi + 1 validator testi yesil
```

**Kabul edilmeyen anti-pattern'ler:**

- ? 12 API issue'sunu tek "users mod�l� backend" commit'inde toplamak.
- ? Birden fazla repoya tek bir summary commit atmak.
- ? `update stuff` / `WIP` / T�rk�e olmayan / tarihsiz / nokta'siz mesaj.
- ? `--no-verify` veya hook bypass.
