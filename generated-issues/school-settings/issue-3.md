# API-3 — Domain: `SchoolGradeLevel` entity

## Description
Yeni tenant-scope entity: okulun aktif çalıştırdığı sınıf kademeleri (junction `school` ↔ master `grade_levels`). `academic-sessions` modülü şube oluştururken bu listeyi filtre olarak kullanacak.

## Scope
- `oksis-api/src/Oksis.Domain/Modules/Schools/Entities/SchoolGradeLevel.cs`
- `oksis-api/src/Oksis.Domain/Modules/Schools/ValueObjects/SchoolGradeLevelId.cs` (strongly-typed ID, `record struct`)
- `oksis-api/src/Oksis.Domain/Modules/Schools/Events/SchoolGradeLevelsChangedEvent.cs`
- `oksis-api/src/Oksis.Domain/Modules/Schools/Exceptions/AtLeastOneGradeLevelRequiredException.cs`
- `oksis-api/tests/Oksis.Domain.UnitTests/Modules/Schools/SchoolGradeLevelTests.cs`

## Implementation

### Properties

| İsim | Tip | Açıklama |
|---|---|---|
| `Id` | `SchoolGradeLevelId` | PK |
| `SchoolId` | `Guid` (TenantEntity'den) | Tenant |
| `GradeLevelId` | `Guid` | FK master `grade_levels` |
| `IsActive` | `bool` | Aktif mi (default true) |
| `DisplayOrder` | `int` | Sıralama |

### Davranışlar

- `static Create(schoolId, gradeLevelId, displayOrder)` — yeni satır oluşturur
- `Deactivate()` — `IsActive = false`. BR-SS-010 invariant'ı tek satır seviyesinde kontrol edilemez (aggregate boundary tek SchoolGradeLevel) — bu sebeple "son aktif kademe" kontrolü handler/repository katmanında yapılır; ama burada `Deactivate()` davranışı domain'de tanımlı kalır.
- `Activate()` — `IsActive = true`
- `Reorder(int newOrder)` — `DisplayOrder` günceller

### Event
```csharp
public sealed record SchoolGradeLevelsChangedEvent(Guid SchoolId) : IDomainEvent;
```
> Tekil entity event'i değil, bulk değişikliklerden sonra handler katmanı tek bir `SchoolGradeLevelsChangedEvent` raise edecek (ISSUE-9). Yine de event sınıfı domain katmanında tanımlanır.

### Exception
```csharp
public sealed class AtLeastOneGradeLevelRequiredException : DomainException
{
    public AtLeastOneGradeLevelRequiredException()
        : base("En az bir sınıf kademesi aktif olmalıdır.") { }
}
```

## Acceptance Criteria
- [ ] `SchoolGradeLevel : TenantEntity` ve `IHasTenant` (TenantEntity'den miras) implement eder
- [ ] `SchoolGradeLevelId` `record struct` olarak `New()` ve `From(Guid)` static metotlarıyla tanımlı
- [ ] `Create(...)` `IsActive = true`, verilen `displayOrder` ile satır oluşturur
- [ ] `Deactivate()` `IsActive = false` yapar; tekrar çağrılırsa idempotent
- [ ] `Activate()` ve `Reorder(int)` davranışları mevcut
- [ ] Tüm property setter'ları private
- [ ] `Oksis.Domain` EF Core / DataAnnotations referansı yok

## Test Requirements
- `Create_SetsActiveTrueAndDisplayOrder`
- `Deactivate_SetsIsActiveFalse`
- `Activate_AfterDeactivate_SetsIsActiveTrue`
- `Deactivate_Twice_IsIdempotent`
- `Reorder_UpdatesDisplayOrder`

## Out of Scope
- EF Core config + migration (ISSUE-6)
- `SchoolCreatedEvent` ile auto-seed (ISSUE-6)
- BR-SS-010 son-aktif-kademe kontrolü (ISSUE-9 — handler)
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
