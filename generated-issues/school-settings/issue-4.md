# API-4 — Domain: `SchoolGradeLevelScale` entity

## Description
Yeni tenant-scope entity: sınıf seviyesi bazlı not skalası override. İlkokul 5'lik, lise 100'lük kullanabilsin (BR-SS-011 fallback zincirinin 1. adımı).

## Scope
- `oksis-api/src/Oksis.Domain/Modules/Schools/Entities/SchoolGradeLevelScale.cs`
- `oksis-api/src/Oksis.Domain/Modules/Schools/ValueObjects/SchoolGradeLevelScaleId.cs`
- `oksis-api/src/Oksis.Domain/Modules/Schools/Events/SchoolGradeLevelScaleChangedEvent.cs`
- `oksis-api/tests/Oksis.Domain.UnitTests/Modules/Schools/SchoolGradeLevelScaleTests.cs`

## Implementation

### Properties

| İsim | Tip | Açıklama |
|---|---|---|
| `Id` | `SchoolGradeLevelScaleId` | PK |
| `SchoolId` | `Guid` | Tenant |
| `GradeLevelId` | `Guid` | FK master `grade_levels` |
| `GradeScaleId` | `Guid` | FK master `grade_scales` |
| `PassingScore` | `decimal?` | null ise `SchoolSettings.DefaultPassingScore` kullanılır |

### Davranışlar
- `static Create(schoolId, gradeLevelId, gradeScaleId, passingScore)`
- `UpdateScale(gradeScaleId, passingScore)` — skala/geçme notu değişimi
> Skala-aralığı kontrolü (BR-SS-012) handler katmanında (ISSUE-11) yapılır; domain `grade_scales` master tablosuna bağımlı olmamalı.

### Event
```csharp
public sealed record SchoolGradeLevelScaleChangedEvent(Guid SchoolId, Guid GradeLevelId) : IDomainEvent;
```

## Acceptance Criteria
- [ ] `SchoolGradeLevelScale : TenantEntity`
- [ ] `SchoolGradeLevelScaleId` `record struct`
- [ ] `Create(...)` ve `UpdateScale(...)` davranışları implemente
- [ ] Tüm property setter'ları private
- [ ] `PassingScore` nullable
- [ ] `Oksis.Domain` EF Core / DataAnnotations referansı yok

## Test Requirements
- `Create_WithoutPassingScore_LeavesPassingScoreNull`
- `Create_WithPassingScore_PersistsValue`
- `UpdateScale_ChangesScaleAndPassingScore`

## Out of Scope
- EF Core config + migration (ISSUE-7)
- Skala-aralığı validasyonu (ISSUE-11)
- `(SchoolId, GradeLevelId)` unique constraint (DB seviyesinde, ISSUE-7)
- Endpoint (ISSUE-14)
- `IGradeScaleResolver` (ISSUE-12)

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
