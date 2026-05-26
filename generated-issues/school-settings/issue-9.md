# API-9 — CQRS: `GET/PUT /grade-levels`

## Description
Okulun aktif sınıf kademeleri için `GetSchoolGradeLevelsQuery` ve `UpdateSchoolGradeLevelsCommand` MediatR handler'larını yaz. BR-SS-010 (en az 1 aktif kademe) handler içinde uygulanır.

## Scope
- `oksis-api/src/Oksis.Application/Modules/Schools/Queries/GetSchoolGradeLevels/` (yeni)
- `oksis-api/src/Oksis.Application/Modules/Schools/Commands/UpdateSchoolGradeLevels/` (yeni)
- `oksis-api/src/Oksis.Application/Modules/Schools/DTOs/SchoolGradeLevelDto.cs`
- `oksis-api/src/Oksis.Application/Modules/Schools/Mappings/SchoolGradeLevelMappingProfile.cs` (Mapster)
- `oksis-api/tests/Oksis.Application.UnitTests/Modules/Schools/SchoolGradeLevels/`

## Implementation

### `GetSchoolGradeLevelsQuery`

```csharp
public sealed record GetSchoolGradeLevelsQuery() : IRequest<IReadOnlyList<SchoolGradeLevelDto>>;

public sealed record SchoolGradeLevelDto(
    Guid Id,
    Guid GradeLevelId,
    string GradeLevelCode,
    string GradeLevelName,
    string EducationLevel,
    bool IsActive,
    int DisplayOrder);
```

Handler: `db.SchoolGradeLevels.Where(x => !x.IsDeleted).Join(db.GradeLevels, ...).OrderBy(x => x.DisplayOrder).ProjectToType<SchoolGradeLevelDto>()`. Tenant filter otomatik EF Core'dan.

### `UpdateSchoolGradeLevelsCommand`

```csharp
public sealed record UpdateSchoolGradeLevelsCommand(IReadOnlyList<Guid> GradeLevelIds)
    : IRequest;
```

**Davranış (bulk diff):**
1. Mevcut tüm `SchoolGradeLevel` satırları yüklenir (tenant scope)
2. `GradeLevelIds`'de olup mevcut olmayan → yeni satır `Create(...)` insert
3. Mevcut olup `GradeLevelIds`'de olmayan → `Deactivate()` (soft, `IsActive=false`)
4. Mevcut ve hedefte olan → `Activate()` çağrılır (idempotent)
5. Sonuçta **aktif kademe sayısı 0 ise** `AtLeastOneGradeLevelRequiredException` fırlat
6. SaveChanges → handler bir kez `SchoolGradeLevelsChangedEvent(schoolId)` raise eder (helper aggregate veya outbox üzerinden — bu modülde aggregate root yok, dolayısıyla event'i `db.OutboxMessages.Add(...)` ile veya `IPublisher.Publish(...)` ile uygulama içi yaymak yeterli; ekibin mevcut event-publish konvansiyonu hangisi ise onu kullan).

### Validator (FluentValidation)

```csharp
RuleFor(x => x.GradeLevelIds).NotEmpty().WithMessage("En az bir sınıf kademesi seçilmelidir.");
RuleForEach(x => x.GradeLevelIds).NotEmpty();
// FK validation handler içinde db lookup ile (master 'grade_levels'ta var mı)
```

### Cache invalidation
- `oksis:tenant:{schoolId}:active-grade-levels` (ISSUE-12'de tanımlanan key) — handler sonunda `IDistributedCache.RemoveAsync` ile temizle. Veya `SchoolGradeLevelsChangedEvent` handler'ı bu işi devralırsa burada yapma.

## Acceptance Criteria
- [ ] `GetSchoolGradeLevelsQuery` handler tenant-scope'lu satırları döner, `displayOrder` ile sıralı
- [ ] DTO içinde `gradeLevelCode`, `gradeLevelName`, `educationLevel` master `grade_levels`'tan join ile gelir
- [ ] `UpdateSchoolGradeLevelsCommand` bulk diff yapar (insert/activate/deactivate)
- [ ] Geçersiz `GradeLevelId` (master'da yok) için domain hata fırlatır (validator veya handler)
- [ ] Aktif kademe 0'a düşerse `AtLeastOneGradeLevelRequiredException` fırlar (BR-SS-010)
- [ ] Başarılı update sonrası `SchoolGradeLevelsChangedEvent(schoolId)` raise edilir
- [ ] Mapster profile mevcut (AutoMapper YASAK)
- [ ] Unit testler yeşil

## Test Requirements
- `Get_ReturnsActiveAndInactive_OrderedByDisplayOrder`
- `Update_AddsNewActiveLevels_AndDeactivatesRemovedOnes`
- `Update_WithEmptyList_ThrowsValidationException`
- `Update_WhenAllExistingDeactivated_ThrowsAtLeastOneRequired`
- `Update_RaisesSchoolGradeLevelsChangedEvent`

## Out of Scope
- Endpoint (ISSUE-14)
- Cache (ISSUE-12)
- `update-academic-structure` permission attribute (ISSUE-14)

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
