# API-11 — CQRS: `GET/PUT /grade-level-scales`

## Description
Seviye-bazlı not skalası için `GetSchoolGradeLevelScalesQuery` ve `UpdateSchoolGradeLevelScalesCommand` (bulk upsert). BR-SS-012 skala-aralığı kontrolü uygulanır.

## Scope
- `oksis-api/src/Oksis.Application/Modules/Schools/Queries/GetSchoolGradeLevelScales/` (yeni)
- `oksis-api/src/Oksis.Application/Modules/Schools/Commands/UpdateSchoolGradeLevelScales/` (yeni)
- `oksis-api/src/Oksis.Application/Modules/Schools/DTOs/SchoolGradeLevelScaleDto.cs`
- `oksis-api/src/Oksis.Application/Modules/Schools/Events/SchoolGradeLevelScaleChanged/SchoolGradeLevelScaleChangedCacheHandler.cs`
- `oksis-api/tests/Oksis.Application.UnitTests/Modules/Schools/SchoolGradeLevelScales/`

## Implementation

### `GetSchoolGradeLevelScalesQuery`

```csharp
public sealed record GetSchoolGradeLevelScalesQuery() : IRequest<IReadOnlyList<SchoolGradeLevelScaleDto>>;

public sealed record SchoolGradeLevelScaleDto(
    Guid Id,
    Guid GradeLevelId,
    string GradeLevelName,
    Guid GradeScaleId,
    string GradeScaleCode,
    string GradeScaleName,
    decimal? PassingScore);
```

### `UpdateSchoolGradeLevelScalesCommand`

```csharp
public sealed record UpdateSchoolGradeLevelScalesCommand(IReadOnlyList<ScaleEntry> Scales) : IRequest;

public sealed record ScaleEntry(Guid GradeLevelId, Guid GradeScaleId, decimal? PassingScore);
```

**Davranış (bulk upsert):**
1. Mevcut satırları yükle (tenant scope)
2. Gelen `Scales` listesindeki her entry için:
   - Var olan satır varsa `UpdateScale(...)`
   - Yoksa `Create(...)` insert
3. Gelmeyen `GradeLevelId`'leri **silmeme** — explicit delete endpoint Sprint 2+
4. Her değişiklik için `SchoolGradeLevelScaleChangedEvent(schoolId, gradeLevelId)` raise et
5. SaveChanges

### Validator

```csharp
RuleFor(x => x.Scales).NotEmpty();
RuleFor(x => x.Scales).Must(HaveDistinctGradeLevels).WithMessage("Aynı sınıf seviyesi iki kez gönderilemez.");
RuleForEach(x => x.Scales).ChildRules(s =>
{
    s.RuleFor(e => e.GradeLevelId).NotEmpty();
    s.RuleFor(e => e.GradeScaleId).NotEmpty();
});
// FK + skala-aralığı validasyonu handler içinde (BR-SS-012)
```

### Handler iş kuralları
- Her `GradeLevelId` `school_grade_levels` tablosunda **aktif** olmalı (BR-SS-010 ile tutarlı), değilse `ValidationException("Sınıf kademesi okul için aktif değil.")`
- Her `GradeScaleId` master `grade_scales`'ta mevcut olmalı
- `PassingScore` null değilse, `GradeScale.MinValue/MaxValue` aralığında olmalı (HARFLI null ise atla — open-question Q8)

### Cache invalidation handler

```csharp
public sealed class SchoolGradeLevelScaleChangedCacheHandler(IDistributedCache cache)
    : INotificationHandler<SchoolGradeLevelScaleChangedEvent>
{
    public Task Handle(SchoolGradeLevelScaleChangedEvent ev, CancellationToken ct)
        => cache.RemoveAsync($"oksis:tenant:{ev.SchoolId}:grade-scale-resolver", ct);
}
```

## Acceptance Criteria
- [ ] Get handler DTO listesi döner (master join'li)
- [ ] Update handler bulk upsert yapar
- [ ] Aynı `GradeLevelId` iki kez gönderilirse validator hatası
- [ ] Aktif olmayan sınıf seviyesi için `ValidationException`
- [ ] `PassingScore` skala aralığı dışıysa `ValidationException` (BR-SS-012)
- [ ] Her değişen entry için `SchoolGradeLevelScaleChangedEvent` raise edilir
- [ ] Cache invalidation handler key'i siler
- [ ] Mapster
- [ ] Unit testler yeşil

## Test Requirements
- `Get_ReturnsAllScalesWithMasterDataJoined`
- `Update_InsertsNewAndUpdatesExisting`
- `Update_DuplicateGradeLevel_ThrowsValidation`
- `Update_InactiveGradeLevel_ThrowsValidation`
- `Update_PassingScoreOutOfScaleRange_ThrowsValidation`
- `Update_RaisesEventPerChangedEntry`
- `CacheHandler_RemovesResolverKey`

## Out of Scope
- DELETE endpoint (Sprint 2+)
- `IGradeScaleResolver` consumer (ISSUE-12)
- Endpoint (ISSUE-14)

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
