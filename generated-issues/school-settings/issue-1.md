# API-1 — Domain: `SchoolSettings` akademik politika genişletmesi

## Description
`SchoolSettings` aggregate root'una akademik politika ayarlarını ekle: varsayılan not skalası FK'si, varsayılan geçme notu, ve bunları güncelleyen davranış + domain event.

`GraduatedDataRetentionYears`, `RequireApprovalForClassRoomCreation`, `AutoPublishReportCards` zaten entity'de mevcut — bunlar `UpdateAcademicPolicy(...)` davranışının parametreleri olarak dahil edilir ama property eklemesi gerekmez.

## Scope
- `oksis-api/src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs` — 2 yeni property + 1 yeni davranış
- `oksis-api/src/Oksis.Domain/Modules/Schools/Events/AcademicPolicyUpdatedEvent.cs` — yeni event
- `oksis-api/tests/Oksis.Domain.UnitTests/Modules/Schools/SchoolSettingsTests.cs` — yeni davranış testleri

## Implementation

### Yeni properties (private setter)

| İsim | Tip | Default |
|---|---|---|
| `DefaultGradeScaleId` | `Guid?` | null (henüz seçilmemiş) |
| `DefaultPassingScore` | `decimal` | 50 |

### Yeni davranış

```csharp
public void UpdateAcademicPolicy(
    Guid? defaultGradeScaleId,
    decimal defaultPassingScore,
    int graduatedDataRetentionYears,
    bool requireApprovalForClassRoomCreation,
    bool autoPublishReportCards)
{
    if (graduatedDataRetentionYears is < 1 or > 30)
        throw new DomainException("Mezun veri saklama süresi 1-30 yıl arası olmalıdır.");

    DefaultGradeScaleId = defaultGradeScaleId;
    DefaultPassingScore = defaultPassingScore;
    GraduatedDataRetentionYears = graduatedDataRetentionYears;
    RequireApprovalForClassRoomCreation = requireApprovalForClassRoomCreation;
    AutoPublishReportCards = autoPublishReportCards;

    Raise(new AcademicPolicyUpdatedEvent(SchoolId));
}
```

> `DefaultPassingScore` skalaya bağlı min/max kontrolü **handler katmanında** yapılır (BR-SS-012) — domain `grade_scales` master'ı bilmemeli. Burada sadece domain invariant'ı (retention 1-30) zorlanır.

### Yeni event

```csharp
public sealed record AcademicPolicyUpdatedEvent(Guid SchoolId) : IDomainEvent;
```

### `CreateDefault` güncellemesi
Yeni property'ler için default değer atanır (`DefaultGradeScaleId = null`, `DefaultPassingScore = 50m`).

## Acceptance Criteria
- [ ] `SchoolSettings.DefaultGradeScaleId` (`Guid?`) ve `DefaultPassingScore` (`decimal`) private setter ile eklenmiş
- [ ] `CreateDefault(schoolId)` çağrısı yeni property'leri default değerlerle doldurur (null + 50)
- [ ] `UpdateAcademicPolicy(...)` retention < 1 veya > 30 için `DomainException` fırlatır
- [ ] `UpdateAcademicPolicy(...)` başarılı çağrıda `AcademicPolicyUpdatedEvent(SchoolId)` raise eder
- [ ] `Oksis.Domain` projesinin EF Core / DataAnnotations referansı yok (mevcut kural korunur)
- [ ] `dotnet test tests/Oksis.Domain.UnitTests` yeşil

## Test Requirements
- `UpdateAcademicPolicy_WithRetentionBelowOne_ThrowsDomainException`
- `UpdateAcademicPolicy_WithRetentionAbove30_ThrowsDomainException`
- `UpdateAcademicPolicy_WithValidInputs_UpdatesPropertiesAndRaisesEvent`
- `CreateDefault_SetsAcademicPolicyDefaults` (DefaultGradeScaleId == null, DefaultPassingScore == 50)

## Out of Scope
- Migration (ISSUE-5)
- `passing_score` skala aralığı kontrolü (handler/validator katmanı — ISSUE-10)
- Cache invalidation handler (ISSUE-10)
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
