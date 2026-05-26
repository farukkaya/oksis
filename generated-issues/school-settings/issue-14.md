# API-14 — Controller: 5 yeni endpoint + `#6` permission attribute taşıma + integration testler

## Description
`SchoolSettingsController`'a 5 yeni action ekle; mevcut `UpdateAcademicStructure` action'ının permission attribute'unu `update-basic` → `update-academic-structure`'a taşı (BR-SS-015 — breaking change). Hepsi için integration test yaz.

## Scope
- `oksis-api/src/Oksis.Api/Controllers/V1/SchoolSettingsController.cs`
- `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Modules/Schools/SchoolSettings/` (yeni testler)

## Implementation

### Yeni action'lar

| # | Action | Method | Route | Permission | Komut/Query |
|---|---|---|---|---|---|
| 22 | `GetGradeLevels` | GET | `/grade-levels` | `school-settings.view` | `GetSchoolGradeLevelsQuery` |
| 23 | `UpdateGradeLevels` | PUT | `/grade-levels` | `school-settings.update-academic-structure` | `UpdateSchoolGradeLevelsCommand` |
| 24 | `UpdateAcademicPolicy` | PUT | `/academic-policy` | `school-settings.update-academic-policy` | `UpdateAcademicPolicyCommand` |
| 25 | `GetGradeLevelScales` | GET | `/grade-level-scales` | `school-settings.view` | `GetSchoolGradeLevelScalesQuery` |
| 26 | `UpdateGradeLevelScales` | PUT | `/grade-level-scales` | `school-settings.update-academic-policy` | `UpdateSchoolGradeLevelScalesCommand` |

### Action template

```csharp
[HttpGet("grade-levels")]
[HasPermission("school-settings.view")]
public async Task<ActionResult<ApiResponse<IReadOnlyList<SchoolGradeLevelDto>>>> GetGradeLevels(CancellationToken ct)
    => Ok(ApiResponse.Success(await Sender.Send(new GetSchoolGradeLevelsQuery(), ct)));

[HttpPut("grade-levels")]
[HasPermission("school-settings.update-academic-structure")]
public async Task<ActionResult> UpdateGradeLevels([FromBody] UpdateSchoolGradeLevelsCommand cmd, CancellationToken ct)
{
    await Sender.Send(cmd, ct);
    return NoContent();
}

// ... aynı pattern diğer 3 endpoint için
```

### Breaking change — `UpdateAcademicStructure` permission taşıma

```csharp
// ESKİ:
// [HasPermission("school-settings.update-basic")]
// YENİ:
[HasPermission("school-settings.update-academic-structure")]
[HttpPut("academic-structure")]
public async Task<ActionResult> UpdateAcademicStructure(...) { ... }
```

> Migration ISSUE-8'de SCHOOL_ADMIN rolüne yeni permission otomatik eklenir. Diğer rollerde manual ekleme gerekir; release notes'a not düş.

## Acceptance Criteria
- [ ] 5 yeni action `SchoolSettingsController`'da mevcut
- [ ] Her action'ın `[HasPermission(...)]` attribute'u doğru
- [ ] `UpdateAcademicStructure` action permission'ı `update-academic-structure`'a taşındı
- [ ] Request/Response `ApiResponse<T>` standard'ına uyumlu
- [ ] Postman collection (`oksis-api/docs/postman/`) 5 yeni request ile güncellendi
- [ ] Integration testler her endpoint için: happy path + 403 (permission yok) + 401 (tenant claim yok) + cross-tenant okuma boş döner
- [ ] `dotnet test` yeşil

## Test Requirements
- `GetGradeLevels_AsSchoolAdmin_Returns200`
- `GetGradeLevels_AsTeacher_Returns403` (sadece `view` izni teacher'da yok)
- `UpdateGradeLevels_WithEmptyList_Returns400`
- `UpdateGradeLevels_AsSchoolAdmin_Returns204_AndPersistsDiff`
- `UpdateAcademicPolicy_WithRetention35_Returns400`
- `UpdateAcademicPolicy_AsSchoolAdmin_Returns204`
- `UpdateAcademicStructure_WithOldUpdateBasicPermissionOnly_Returns403` (breaking change kanıtı)
- `GetGradeLevelScales_CrossTenant_ReturnsEmpty`
- `UpdateGradeLevelScales_WithDuplicateGradeLevel_Returns400`

## Out of Scope
- Web tarafı (ISSUE-15..22)
- Mobile (kapsam dışı)
- Postman collection generation otomasyonu

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
