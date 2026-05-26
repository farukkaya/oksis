# API-10 — CQRS: `PUT /academic-policy` + cache invalidation

## Description
`UpdateAcademicPolicyCommand` MediatR handler + validator (BR-SS-012 skala-aralığı kontrolü) + `AcademicPolicyUpdatedEvent` handler (cache invalidation).

## Scope
- `oksis-api/src/Oksis.Application/Modules/Schools/Commands/UpdateAcademicPolicy/` (yeni)
- `oksis-api/src/Oksis.Application/Modules/Schools/Events/AcademicPolicyUpdated/AcademicPolicyUpdatedCacheInvalidationHandler.cs`
- `oksis-api/tests/Oksis.Application.UnitTests/Modules/Schools/UpdateAcademicPolicy/`

## Implementation

### Command

```csharp
public sealed record UpdateAcademicPolicyCommand(
    Guid? DefaultGradeScaleId,
    decimal DefaultPassingScore,
    int GraduatedDataRetentionYears,
    bool RequireApprovalForClassRoomCreation,
    bool AutoPublishReportCards) : IRequest;
```

### Validator

```csharp
RuleFor(x => x.GraduatedDataRetentionYears).InclusiveBetween(1, 30);
RuleFor(x => x.DefaultPassingScore).GreaterThanOrEqualTo(0);
// Skala-aralığı (BR-SS-012) handler içinde dinamik kontrol edilir (master grade_scales'tan min/max)
```

### Handler

1. `SchoolSettings`'i yükle (tenant)
2. `DefaultGradeScaleId != null` ise master `grade_scales`'tan satırı yükle; yoksa `EntityNotFoundException`
3. `DefaultPassingScore` skala `min_value`/`max_value` aralığında mı kontrol et (HARFLI skala için open-question Q8 — Sprint 1'de HARFLI desteklenmiyor, validator'da `gradeScale.MinValue != null` ön-kontrolü yap; null ise kabul et)
4. `settings.UpdateAcademicPolicy(...)` çağır → domain event raise eder
5. `SaveChangesAsync`

### Cache invalidation handler

```csharp
public sealed class AcademicPolicyUpdatedCacheInvalidationHandler(IDistributedCache cache)
    : INotificationHandler<AcademicPolicyUpdatedEvent>
{
    public async Task Handle(AcademicPolicyUpdatedEvent ev, CancellationToken ct)
    {
        await cache.RemoveAsync($"oksis:tenant:{ev.SchoolId}:academic-policy", ct);
        await cache.RemoveAsync($"oksis:tenant:{ev.SchoolId}:grade-scale-resolver", ct);
    }
}
```

## Acceptance Criteria
- [ ] Command handler `SchoolSettings.UpdateAcademicPolicy(...)` çağırır
- [ ] `DefaultGradeScaleId` master'da yoksa `EntityNotFoundException`
- [ ] `DefaultPassingScore` skala aralığı dışıysa `ValidationException` (BR-SS-012)
- [ ] `GraduatedDataRetentionYears` 1-30 dışı validator hatası
- [ ] `AcademicPolicyUpdatedEvent` raise edilir
- [ ] Event handler 2 Redis cache key'ini siler
- [ ] Mapster (AutoMapper YASAK)
- [ ] Unit testler yeşil

## Test Requirements
- `Handler_WithInvalidGradeScaleId_ThrowsEntityNotFound`
- `Handler_WithPassingScoreOutOfRange_ThrowsValidation`
- `Handler_WithValidInputs_UpdatesAndRaisesEvent`
- `Validator_RetentionAbove30_Fails`
- `CacheInvalidationHandler_RemovesTwoKeys`

## Out of Scope
- Endpoint (ISSUE-14)
- Grade-level scale endpoint'i (ISSUE-11)
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
