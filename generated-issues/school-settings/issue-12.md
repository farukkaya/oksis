# API-12 — Service: `IGradeScaleResolver` + `ISchoolSettingsReader.GetActiveGradeLevelIdsAsync`

## Description
Diğer modüller (marks, attendance, academic-sessions) bu okul ayarlarını okumak için interface'leri kullanır. BR-SS-011 fallback zinciri + Redis cache (TTL 24h).

## Scope
- `oksis-api/src/Oksis.Application/Modules/Schools/Abstractions/IGradeScaleResolver.cs`
- `oksis-api/src/Oksis.Application/Modules/Schools/Abstractions/ISchoolSettingsReader.cs` (mevcutsa genişlet)
- `oksis-api/src/Oksis.Infrastructure/Services/Schools/GradeScaleResolver.cs`
- `oksis-api/src/Oksis.Infrastructure/Services/Schools/SchoolSettingsReader.cs`
- `oksis-api/src/Oksis.Infrastructure/DependencyInjection.cs` — `Scoped` registration
- `oksis-api/tests/Oksis.Application.UnitTests/Modules/Schools/Services/`

## Implementation

### `IGradeScaleResolver`

```csharp
public interface IGradeScaleResolver
{
    Task<GradeScaleInfo> ResolveAsync(Guid schoolId, Guid gradeLevelId, CancellationToken ct);
}

public sealed record GradeScaleInfo(Guid GradeScaleId, string Code, decimal? MinValue, decimal? MaxValue, decimal PassingScore);
```

**Fallback zinciri (BR-SS-011):**
1. `school_grade_level_scales` (schoolId, gradeLevelId) → varsa onu kullan; `PassingScore` null ise `school_settings.default_passing_score`'a düş
2. Yoksa → `school_settings.default_grade_scale_id` + `default_passing_score`
3. O da null ise → master `grade_scales` WHERE code = 'TR_100' (hardcoded final fallback) + `default_passing_score = 50`

**Cache:** Redis key `oksis:tenant:{schoolId}:grade-scale-resolver:{gradeLevelId}`, TTL 24h. Invalidation `AcademicPolicyUpdatedEvent` ve `SchoolGradeLevelScaleChangedEvent` handler'larından gelir (ISSUE-10, ISSUE-11).

### `ISchoolSettingsReader` genişletme

Mevcut interface varsa (`GetAsync` v.s.) genişlet, yoksa oluştur:

```csharp
public interface ISchoolSettingsReader
{
    Task<SchoolSettingsDto> GetAsync(Guid schoolId, CancellationToken ct);
    Task<IReadOnlyList<Guid>> GetActiveGradeLevelIdsAsync(Guid schoolId, CancellationToken ct);
}
```

`GetActiveGradeLevelIdsAsync`:
- `db.SchoolGradeLevels.Where(x => x.SchoolId == schoolId && x.IsActive && !x.IsDeleted).Select(x => x.GradeLevelId).ToListAsync()`
- Cache: `oksis:tenant:{schoolId}:active-grade-levels`, TTL 24h. Invalidation `SchoolGradeLevelsChangedEvent` handler.

### `SchoolGradeLevelsChangedEvent` cache invalidation handler

```csharp
public sealed class SchoolGradeLevelsChangedCacheHandler(IDistributedCache cache)
    : INotificationHandler<SchoolGradeLevelsChangedEvent>
{
    public Task Handle(SchoolGradeLevelsChangedEvent ev, CancellationToken ct)
        => cache.RemoveAsync($"oksis:tenant:{ev.SchoolId}:active-grade-levels", ct);
}
```

## Acceptance Criteria
- [ ] `IGradeScaleResolver` interface `Application` katmanında, implementation `Infrastructure`'da
- [ ] Fallback zinciri tam 3 adım sırayla denenir
- [ ] Cache miss → DB hit → cache set; cache hit → DB hit yok
- [ ] `SchoolGradeLevelsChangedEvent` handler `active-grade-levels` cache'ini siler
- [ ] `AcademicPolicyUpdatedEvent` + `SchoolGradeLevelScaleChangedEvent` (ISSUE-10/11'de) resolver cache'ini siler — burada handler eklenmez
- [ ] `ISchoolSettingsReader.GetActiveGradeLevelIdsAsync` cache'li
- [ ] DI'ye `Scoped` olarak kayıtlı
- [ ] Tenant scope log context içine (`SchoolId`) eklenmiş
- [ ] Unit testler yeşil

## Test Requirements
- `Resolve_LevelSpecificScaleExists_ReturnsThat`
- `Resolve_NoLevelSpecific_FallsBackToDefault`
- `Resolve_NoDefault_FallsBackToMasterTR100`
- `Resolve_CacheHit_DoesNotQueryDatabase`
- `GetActiveGradeLevelIds_ReturnsOnlyIsActiveTrue`
- `SchoolGradeLevelsChangedCacheHandler_RemovesKey`

## Out of Scope
- HARFLI skala için open-question Q8 — Sprint 1'de TR_100 + TR_5 ile sınırlı
- `marks` modülünün consumer entegrasyonu (Sprint 2)

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
