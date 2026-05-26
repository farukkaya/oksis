# API-13 — `CreateHoliday` handler: `ICurrentSessionProvider` ile session-id otomasyonu

## Description
Mevcut `CreateHolidayCommandHandler` `ICurrentSessionProvider.GetCurrentSessionIdOrNull()` (academic-sessions modülünden) ile aktif sezonun ID'sini otomatik atayacak (BR-SS-013). Aktif sezon yoksa `null` kalır.

## Scope
- `oksis-api/src/Oksis.Application/Modules/Schools/Commands/CreateHoliday/CreateHolidayCommandHandler.cs` — güncelleme
- `oksis-api/src/Oksis.Application/Modules/Schools/Commands/UpdateHoliday/UpdateHolidayCommandHandler.cs` — opsiyonel: değişmeden bırak (mevcut session-id korunur)
- `oksis-api/tests/Oksis.Application.UnitTests/Modules/Schools/CreateHoliday/CreateHolidayCommandHandlerTests.cs` — yeni testler

## Implementation

### Handler değişimi

```csharp
public sealed class CreateHolidayCommandHandler(
    IApplicationDbContext db,
    ICurrentSessionProvider sessionProvider) // YENİ
    : IRequestHandler<CreateHolidayCommand, Guid>
{
    public async Task<Guid> Handle(CreateHolidayCommand cmd, CancellationToken ct)
    {
        var sessionId = await sessionProvider.GetCurrentSessionIdOrNullAsync(ct); // YENİ

        var holiday = Holiday.Create(
            cmd.Name,
            cmd.Date,
            cmd.HolidayType,
            // ...
            academicSessionId: sessionId); // YENİ parametre (ISSUE-2'de eklendi)

        db.Holidays.Add(holiday);
        await db.SaveChangesAsync(ct);
        return holiday.Id;
    }
}
```

> `ICurrentSessionProvider` `academic-sessions` modülünde tanımlı (Application abstraction). Implementation `Oksis.Infrastructure.Services.AcademicSessions.CurrentSessionProvider`.

## Acceptance Criteria
- [ ] `CreateHolidayCommandHandler` `ICurrentSessionProvider` inject eder
- [ ] Aktif sezon varsa `Holiday.AcademicSessionId == sessionId`
- [ ] Aktif sezon yoksa `Holiday.AcademicSessionId == null` (BR-SS-013 geçiş dönemi)
- [ ] `UpdateHolidayCommandHandler` değişmez (mevcut `AcademicSessionId` korunur)
- [ ] Frontend payload değişmez — `academic_session_id` request body'sinde yok (`ui-flows.md` "Frontend'de sezon seçimi gösterilmez")
- [ ] Unit testler yeşil

## Test Requirements
- `Handler_WithActiveSession_SetsAcademicSessionId`
- `Handler_WithoutActiveSession_LeavesSessionIdNull`
- `Handler_DoesNotAcceptSessionIdFromRequestBody` (idempotent — handler request'ten okumaz)

## Out of Scope
- UI değişikliği yok (transparent)
- Sprint 4+ migration (NULL kayıtları sezona bağlama)

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
