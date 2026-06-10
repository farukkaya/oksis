# Setup Sezonu Sihirbaza Geri Alma (Reopen-to-Draft) — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "Hazır" (Setup) sezonun Düzenle/Sil butonlarını çalışır hale getirmek: taslak açılışta silinmek yerine sezona linklenir; reopen Setup sezonu geri alıp sihirbaza döner, cancel-setup ikisini de siler.

**Architecture:** `SeasonDraft.OpenedSessionId` nullable kolonu taslak↔Setup sezon linkini tutar. `OpenSeasonFromDraft` taslağı silmek yerine `MarkOpened` çağırır; yeni `ReopenSeasonToDraft` ve `CancelSetupSeason` komutları ortak `SetupSeasonReverter` helper'ı ile sezonu (şubeler + tatiller, soft-delete) geri alır; `ActivateSeasonRollover` aktivasyon sonunda bağlı taslağı siler. Frontend'de bağlı taslak kartı gizlenir, Düzenle/Sil onay dialoglarına bağlanır, Hazır sezon varken "Yeni Sezon Aç" bloklanır.

**Tech Stack:** .NET 10 + EF Core 10 + MediatR + xUnit/FluentAssertions (oksis-api) · React 18 + React Query + vitest/MSW (oksis-web).

**Spec:** `docs/superpowers/specs/2026-06-10-setup-sezon-reopen-design.md` (workspace root)

**Önemli kurallar (executor için):**
- Commit formatı: `2026-06-10 <type>[,type]: Türkçe özet.` (husky hook oksis-api'de zorlar; web/workspace'te de aynı format kullanılır).
- oksis-api, oksis-web ve workspace root **üç ayrı git repo** — commit'ler ilgili repo köklerinde atılır.
- oksis-api'de commit öncesi `dotnet format` çalıştır.
- Hardcoded Türkçe string YASAK (frontend'de i18n key; backend hata mesajları Error kaydında Türkçe olabilir — mevcut pattern bu).
- Soft-delete: `db.Remove(...)` çağrıları `SoftDeleteInterceptor` tarafından `IsDeleted=true`'ya çevrilir; FK Restrict'ler bu yüzden sorun çıkarmaz, testler "görünmez oldu" şeklinde assert eder (global query filter).

---

## Dosya Haritası

**oksis-api (değişen):**
- `src/Oksis.Domain/Modules/AcademicSessions/Entities/SeasonDraft.cs` — `OpenedSessionId` + `MarkOpened`/`ClearOpenedSession`
- `src/Oksis.Infrastructure/Persistence/Configurations/Academic/SeasonDraftConfiguration.cs` — kolon mapping
- `src/Oksis.Infrastructure/Persistence/Migrations/` — yeni migration
- `src/Oksis.Application/Modules/AcademicSessions/Commands/OpenSeasonFromDraft/OpenSeasonFromDraftCommandHandler.cs` — sil → linkle
- `src/Oksis.Application/Modules/AcademicSessions/DTOs/SeasonDraftDto.cs` — `OpenedSessionId` alanı
- `src/Oksis.Application/Modules/AcademicSessions/Commands/ActivateSeasonRollover/ActivateSeasonRolloverCommandHandler.cs` — bağlı taslağı sil
- `src/Oksis.Api/Controllers/V1/AcademicSessionsController.cs` — 2 yeni endpoint

**oksis-api (yeni):**
- `src/Oksis.Application/Modules/AcademicSessions/Shared/SetupSeasonReverter.cs`
- `src/Oksis.Application/Modules/AcademicSessions/Commands/ReopenSeasonToDraft/ReopenSeasonToDraftCommand.cs` + `ReopenSeasonToDraftCommandHandler.cs`
- `src/Oksis.Application/Modules/AcademicSessions/Commands/CancelSetupSeason/CancelSetupSeasonCommand.cs` + `CancelSetupSeasonCommandHandler.cs`
- `tests/Oksis.Infrastructure.IntegrationTests/Persistence/ReopenSeasonToDraftTests.cs`

**oksis-web (değişen):**
- `src/portals/admin/academic-sessions/types/index.ts` — `openedSessionId`
- `src/portals/admin/academic-sessions/api/academicSessionsApi.ts` — 2 yeni çağrı
- `src/portals/admin/academic-sessions/hooks/useSeasonWizard.ts` — 2 yeni mutation
- `src/portals/admin/academic-sessions/hooks/useSeasonListData.ts` — bağlı taslak gizleme
- `src/portals/admin/academic-sessions/pages/SeasonListPage.tsx` — dialog wiring + blok
- `src/portals/admin/academic-sessions/pages/SeasonWizardPage.tsx` — deep-link guard
- `src/modules/academic-calendar/pages/AcademicCalendarPage.tsx:104` — `hasDraft` koşulu
- `src/shared/i18n/locales/tr/academic-sessions.json` + `en/academic-sessions.json` — yeni dialog anahtarları

**oksis-web (yeni):**
- `src/portals/admin/academic-sessions/components/list/ReopenSeasonDialog.tsx` (+ test)
- `src/portals/admin/academic-sessions/components/list/CancelSetupDialog.tsx` (+ test)
- `src/portals/admin/academic-sessions/components/list/PendingBlocksNewSeasonDialog.tsx` (+ test)

**Workspace root:** `.claude/docs/modules/academic-years/{api-contracts.md, business-rules.md, completion_status.md}`

---

## Task 1: Domain — `SeasonDraft.OpenedSessionId` (oksis-api)

**Files:**
- Modify: `src/Oksis.Domain/Modules/AcademicSessions/Entities/SeasonDraft.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/AcademicSessions/SeasonDraftTests.cs`

- [ ] **Step 1: Failing testleri yaz** — `SeasonDraftTests.cs`'e mevcut test sınıfının içine ekle (sınıfın kullandığı kalıbı izle; `SeasonDraft.Create(schoolId, "2026-2027", sourceId)` ile kur):

```csharp
[Fact]
public void MarkOpened_Sets_OpenedSessionId()
{
    var draft = SeasonDraft.Create(Guid.NewGuid(), "2026-2027", Guid.NewGuid());
    var sessionId = Guid.NewGuid();

    draft.MarkOpened(sessionId);

    draft.OpenedSessionId.Should().Be(sessionId);
}

[Fact]
public void MarkOpened_Throws_WhenAlreadyOpened()
{
    var draft = SeasonDraft.Create(Guid.NewGuid(), "2026-2027", Guid.NewGuid());
    draft.MarkOpened(Guid.NewGuid());

    var act = () => draft.MarkOpened(Guid.NewGuid());

    act.Should().Throw<InvalidSeasonDraftException>()
        .Which.Code.Should().Be("SeasonDraft.AlreadyOpened");
}

[Fact]
public void MarkOpened_Throws_WhenSessionIdEmpty()
{
    var draft = SeasonDraft.Create(Guid.NewGuid(), "2026-2027", Guid.NewGuid());

    var act = () => draft.MarkOpened(Guid.Empty);

    act.Should().Throw<InvalidSeasonDraftException>()
        .Which.Code.Should().Be("SeasonDraft.OpenedSessionId.Empty");
}

[Fact]
public void ClearOpenedSession_Resets_Link()
{
    var draft = SeasonDraft.Create(Guid.NewGuid(), "2026-2027", Guid.NewGuid());
    draft.MarkOpened(Guid.NewGuid());

    draft.ClearOpenedSession();

    draft.OpenedSessionId.Should().BeNull();
}
```

Not: `InvalidSeasonDraftException`'ın `Code` property'si var mı kontrol et (`src/Oksis.Domain/Modules/AcademicSessions/Exceptions/InvalidSeasonDraftException.cs`); domain exception'lar `(code, message)` ctor kalıbını kullanıyor. Yoksa testteki assertion'ı sınıfın gerçek yapısına uyarla (ör. `.WithMessage(...)`).

- [ ] **Step 2: Testlerin FAIL ettiğini doğrula**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SeasonDraftTests"`
Expected: 4 yeni test FAIL (derleme hatası: `MarkOpened` yok) — derleme hatası da "fail" sayılır.

- [ ] **Step 3: Entity'yi güncelle** — `SeasonDraft.cs`:

Property bloğuna (`HolidaysJson`'dan sonra) ekle:

```csharp
    /// <summary>Taslaktan materyalize edilmiş Setup sezonun Id'si; null = sihirbaz devam ediyor.</summary>
    public Guid? OpenedSessionId { get; private set; }
```

Sınıfın sonuna (ValidateName'den önce) ekle:

```csharp
    /// <summary>"Sezonu Aç" başarılı olduğunda taslağı materyalize edilen sezona bağlar.</summary>
    public void MarkOpened(Guid sessionId)
    {
        if (sessionId == Guid.Empty)
            throw new InvalidSeasonDraftException("SeasonDraft.OpenedSessionId.Empty", "Sezon Id zorunludur.");
        if (OpenedSessionId is not null)
            throw new InvalidSeasonDraftException("SeasonDraft.AlreadyOpened", "Taslak zaten bir sezona açılmış.");
        OpenedSessionId = sessionId;
    }

    /// <summary>Setup sezon geri alındığında (reopen) linki temizler; sihirbaz taslağı yeniden devralır.</summary>
    public void ClearOpenedSession() => OpenedSessionId = null;
```

Sınıfın XML doc yorumunu güncelle: `"Sezonu Aç" sonrası silinir.` cümlesini şu ile değiştir:
`"Sezonu Aç" sonrası silinmez; OpenedSessionId ile Setup sezona bağlanır ve aktivasyonda silinir.`

- [ ] **Step 4: Testlerin PASS ettiğini doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SeasonDraftTests"`
Expected: PASS (mevcut + 4 yeni)

- [ ] **Step 5: Commit (oksis-api)**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-10 feat,test: SeasonDraft'a OpenedSessionId linki eklendi (MarkOpened/ClearOpenedSession)."
```

---

## Task 2: EF mapping + migration (oksis-api)

**Files:**
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Academic/SeasonDraftConfiguration.cs`
- Create: migration (otomatik üretilir)

- [ ] **Step 1: Configuration'a property ekle** — `builder.Property(x => x.HolidaysJson);` satırından sonra:

```csharp
        builder.Property(x => x.OpenedSessionId);
```

Sınıfın XML doc yorumundaki `Sihirbaz tamamlandığında ("Sezonu Aç") kayıt silinir.` cümlesini güncelle:
`Sihirbaz tamamlandığında kayıt OpenedSessionId ile Setup sezona bağlanır; aktivasyonda silinir.`

(FK constraint bilinçli olarak eklenmiyor — spec §3: link komutla yönetilir, cascade istenmez.)

- [ ] **Step 2: Migration üret**

Run: `dotnet ef migrations add 20260610_SeasonDraftOpenedSessionId --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`
Expected: yeni migration dosyası; içeriğinde yalnız `opened_session_id` (nullable Guid) kolonu `academic.season_drafts`'a eklenir. Başka tablo değişikliği görürsen DUR — model snapshot kirli demektir, kullanıcıya sor.

- [ ] **Step 3: Build doğrula**

Run: `dotnet build`
Expected: 0 error

- [ ] **Step 4: Commit**

```bash
dotnet format && git add -A && git commit -m "2026-06-10 feat: season_drafts tablosuna opened_session_id kolonu (migration) eklendi."
```

---

## Task 3: `OpenSeasonFromDraft` taslağı siler → linkler (oksis-api)

**Files:**
- Modify: `src/Oksis.Application/Modules/AcademicSessions/Commands/OpenSeasonFromDraft/OpenSeasonFromDraftCommandHandler.cs`
- Modify: `src/Oksis.Application/Modules/AcademicSessions/Commands/OpenSeasonFromDraft/OpenSeasonFromDraftCommand.cs` (doc yorumu)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/OpenSeasonFromDraftTests.cs`

- [ ] **Step 1: Mevcut testi güncelle + yeni guard testi yaz**

`OpenSeasonFromDraftTests.cs` içinde "Assert — taslak silindi" bloğunu (satır ~271-273) şu ile değiştir:

```csharp
        // Assert — taslak silinmedi; Setup sezona linklendi
        var keptDraft = await assertDb.SeasonDrafts.AsNoTracking().SingleAsync();
        keptDraft.OpenedSessionId.Should().Be(result.Value, "taslak açılan sezona bağlanmalıdır");
```

Aynı dosyaya yeni test ekle (mevcut helper'ları kullanır — `SeedSchoolAsync`, `SeedMinimalSourceSessionAsync`, `ValidTermDatesJson`):

```csharp
    [Fact]
    public async Task Handle_Returns_Conflict_WhenDraftAlreadyOpenedAsync()
    {
        var schoolId = await SeedSchoolAsync();
        var sourceSessionId = await SeedMinimalSourceSessionAsync(schoolId);
        var tenantCtx = new TestTenantContext(schoolId);

        await using var draftDb = _fixture.CreateDbContext(schoolId);
        var draft = SeasonDraft.Create(schoolId, "2026-2027", sourceSessionId);
        draft.UpdateProgress(
            name: "2026-2027", sourceSessionId: sourceSessionId, currentStep: 5,
            copyTerms: true, copyBranches: false, copyHolidays: false,
            copyAssignments: false, copySchedule: false, excludePassive: true,
            termDatesJson: ValidTermDatesJson(), branchMapJson: null, holidaysJson: null);
        draft.MarkOpened(Guid.NewGuid()); // zaten açılmış
        draftDb.SeasonDrafts.Add(draft);
        await draftDb.SaveChangesAsync();

        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new OpenSeasonFromDraftCommandHandler(db, tenantCtx);
        var result = await handler.Handle(new OpenSeasonFromDraftCommand(), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("academic-sessions.errors.draft-already-opened");
    }
```

- [ ] **Step 2: Testlerin FAIL ettiğini doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~OpenSeasonFromDraft"`
Expected: güncellenen test FAIL ("taslak açılan sezona bağlanmalıdır" — count 0) + yeni test FAIL (kod `no-draft` değil; ayrıca guard yok).

- [ ] **Step 3: Handler'ı güncelle** — `OpenSeasonFromDraftCommandHandler.cs`:

(a) Adım 2'nin (taslak yükleme, `if (draft is null)` bloğu) hemen ardına ekle:

```csharp
        if (draft.OpenedSessionId is not null)
        {
            return Result<Guid>.Conflict("academic-sessions.errors.draft-already-opened");
        }
```

(b) Adım 9'u değiştir:

```csharp
        // 9. Taslağı açılan sezona bağla (aktivasyonda silinecek) ve kaydet
        draft.MarkOpened(session.Id);
        await db.SaveChangesAsync(cancellationToken);
```

(c) Sınıfın XML doc yorumundaki `9. SeasonDraft sil; SaveChanges.` satırını
`9. Taslağı MarkOpened ile sezona bağla; SaveChanges. (Taslak aktivasyonda silinir.)` yap.
`OpenSeasonFromDraftCommand.cs` doc yorumundaki `ardından taslağı siler` ifadesini `ardından taslağı sezona bağlar (OpenedSessionId)` yap.

- [ ] **Step 4: Testlerin PASS ettiğini doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~OpenSeasonFromDraft"`
Expected: tüm dosya PASS

- [ ] **Step 5: Commit**

```bash
dotnet format && git add -A && git commit -m "2026-06-10 feat,test: Sezon açılışında taslak silinmek yerine OpenedSessionId ile sezona bağlanıyor."
```

---

## Task 4: DTO — `OpenedSessionId` dışa açılır (oksis-api)

**Files:**
- Modify: `src/Oksis.Application/Modules/AcademicSessions/DTOs/SeasonDraftDto.cs`

- [ ] **Step 1: Record'a alan ekle** (Mapster property-adıyla otomatik eşler; ekstra mapping gerekmez):

```csharp
public sealed record SeasonDraftDto(
    Guid Id, string Name, Guid SourceSessionId, int CurrentStep,
    bool CopyTerms, bool CopyBranches, bool CopyHolidays, bool CopyAssignments, bool CopySchedule,
    bool ExcludePassiveStudents,
    string? TermDatesJson, string? BranchMapJson, string? HolidaysJson,
    Guid? OpenedSessionId);
```

- [ ] **Step 2: Build + ilgili testler**

Run: `dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SeasonDraftSlice"`
Expected: PASS (SaveSeasonDraft/GetSeasonDraft slice testleri DTO'yu kullanıyorsa positional ctor çağrıları kırılabilir — kırılanlara `OpenedSessionId: null` argümanı ekle).

- [ ] **Step 3: Commit**

```bash
dotnet format && git add -A && git commit -m "2026-06-10 feat: SeasonDraftDto'ya openedSessionId alanı eklendi."
```

---

## Task 5: `ReopenSeasonToDraft` komutu + endpoint (oksis-api)

**Files:**
- Create: `src/Oksis.Application/Modules/AcademicSessions/Shared/SetupSeasonReverter.cs`
- Create: `src/Oksis.Application/Modules/AcademicSessions/Commands/ReopenSeasonToDraft/ReopenSeasonToDraftCommand.cs`
- Create: `src/Oksis.Application/Modules/AcademicSessions/Commands/ReopenSeasonToDraft/ReopenSeasonToDraftCommandHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AcademicSessionsController.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/ReopenSeasonToDraftTests.cs`

- [ ] **Step 1: Failing integration testlerini yaz** — yeni dosya `ReopenSeasonToDraftTests.cs`. Seed helper'larını `OpenSeasonFromDraftTests.cs`'ten kopyala (`TestTenantContext`, `SeedSchoolAsync`, `EnsureGradeLevelAsync`, `SeedSchoolGradeLevelsAsync`, `SeedSourceSessionAsync`, `ValidTermDatesJson` — private oldukları için paylaşılamaz; bu test projesinde kabul edilen kalıp). Senaryo kurulumunu gerçek akışla yap: taslak seed et → `OpenSeasonFromDraftCommandHandler` ile sezonu aç → reopen'ı test et.

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.AcademicSessions.Commands.OpenSeasonFromDraft;
using Oksis.Application.Modules.AcademicSessions.Commands.ReopenSeasonToDraft;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// ReopenSeasonToDraftCommand entegrasyon testleri.
/// Kurulum: taslak → OpenSeasonFromDraft (Setup sezon + şubeler + link) → reopen.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class ReopenSeasonToDraftTests : IAsyncLifetime
{
    // ... OpenSeasonFromDraftTests'ten kopyalanan fixture/ctor/helper blokları ...

    /// <summary>Taslak seed edip OpenSeasonFromDraft ile Setup sezonu açar; (draftId, sessionId) döner.</summary>
    private async Task<(Guid DraftId, Guid SessionId)> SeedOpenedSeasonAsync(Guid schoolId)
    {
        var grade6Id = await EnsureGradeLevelAsync("6", 6);
        var grade7Id = await EnsureGradeLevelAsync("7", 7);
        var grade8Id = await EnsureGradeLevelAsync("8", 8);
        await SeedSchoolGradeLevelsAsync(schoolId, [grade6Id, grade7Id, grade8Id]);
        var (sourceSessionId, _, _, _) = await SeedSourceSessionAsync(schoolId, grade6Id, grade7Id, grade8Id);

        await using var draftDb = _fixture.CreateDbContext(schoolId);
        var draft = SeasonDraft.Create(schoolId, "2026-2027", sourceSessionId);
        draft.UpdateProgress(
            name: "2026-2027", sourceSessionId: sourceSessionId, currentStep: 5,
            copyTerms: true, copyBranches: true, copyHolidays: false,
            copyAssignments: false, copySchedule: false, excludePassive: true,
            termDatesJson: ValidTermDatesJson(), branchMapJson: null, holidaysJson: null);
        draftDb.SeasonDrafts.Add(draft);
        await draftDb.SaveChangesAsync();

        await using var openDb = _fixture.CreateDbContext(schoolId);
        var openHandler = new OpenSeasonFromDraftCommandHandler(openDb, new TestTenantContext(schoolId));
        var open = await openHandler.Handle(new OpenSeasonFromDraftCommand(), CancellationToken.None);
        open.IsSuccess.Should().BeTrue();
        return (draft.Id, open.Value!);
    }

    [Fact]
    public async Task Handle_Reverts_SetupSeason_And_ClearsLinkAsync()
    {
        var schoolId = await SeedSchoolAsync();
        var (draftId, sessionId) = await SeedOpenedSeasonAsync(schoolId);

        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new ReopenSeasonToDraftCommandHandler(db, new TestTenantContext(schoolId));
        var result = await handler.Handle(new ReopenSeasonToDraftCommand(sessionId), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(draftId);

        await using var assertDb = _fixture.CreateDbContext(schoolId);
        (await assertDb.AcademicSessions.AnyAsync(s => s.Id == sessionId))
            .Should().BeFalse("Setup sezon geri alınmalı (soft-delete)");
        (await assertDb.ClassRooms.AnyAsync(c => c.AcademicSessionId == sessionId))
            .Should().BeFalse("sezonun şubeleri geri alınmalı");
        (await assertDb.Holidays.AnyAsync(h => h.AcademicSessionId == sessionId))
            .Should().BeFalse("sezonun tatil kayıtları geri alınmalı");

        var draft = await assertDb.SeasonDrafts.AsNoTracking().SingleAsync();
        draft.Id.Should().Be(draftId);
        draft.OpenedSessionId.Should().BeNull("link temizlenmeli");
        draft.Name.Should().Be("2026-2027", "taslak içeriği aynen korunmalı");
        draft.TermDatesJson.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Handle_Returns_NotFound_WhenSessionMissingAsync()
    {
        var schoolId = await SeedSchoolAsync();
        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new ReopenSeasonToDraftCommandHandler(db, new TestTenantContext(schoolId));

        var result = await handler.Handle(new ReopenSeasonToDraftCommand(Guid.NewGuid()), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_Returns_Conflict_WhenSessionNotSetupAsync()
    {
        var schoolId = await SeedSchoolAsync();
        var grade6Id = await EnsureGradeLevelAsync("6", 6);
        var grade7Id = await EnsureGradeLevelAsync("7", 7);
        var grade8Id = await EnsureGradeLevelAsync("8", 8);
        await SeedSchoolGradeLevelsAsync(schoolId, [grade6Id, grade7Id, grade8Id]);
        var (sourceSessionId, _, _, _) = await SeedSourceSessionAsync(schoolId, grade6Id, grade7Id, grade8Id);

        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new ReopenSeasonToDraftCommandHandler(db, new TestTenantContext(schoolId));
        var result = await handler.Handle(new ReopenSeasonToDraftCommand(sourceSessionId), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("academic-sessions.errors.not-setup");
    }

    [Fact]
    public async Task Handle_Returns_Conflict_WhenDraftLinkMismatchAsync()
    {
        var schoolId = await SeedSchoolAsync();
        var (_, sessionId) = await SeedOpenedSeasonAsync(schoolId);

        // Linki kopar — taslağı bambaşka bir sezona bağlıymış gibi göster
        await using var mutateDb = _fixture.CreateDbContext(schoolId);
        var draft = await mutateDb.SeasonDrafts.SingleAsync();
        draft.ClearOpenedSession();
        draft.MarkOpened(Guid.NewGuid());
        await mutateDb.SaveChangesAsync();

        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new ReopenSeasonToDraftCommandHandler(db, new TestTenantContext(schoolId));
        var result = await handler.Handle(new ReopenSeasonToDraftCommand(sessionId), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("academic-sessions.errors.reopen-mismatch");
    }

    [Fact]
    public async Task Handle_Returns_Conflict_WhenClassroomHasStudentsAsync()
    {
        var schoolId = await SeedSchoolAsync();
        var (_, sessionId) = await SeedOpenedSeasonAsync(schoolId);

        // Setup sezonun bir şubesine öğrenci ata (şubeler Active statüde oluşur)
        await using var mutateDb = _fixture.CreateDbContext(schoolId);
        var classRoom = await mutateDb.ClassRooms
            .Include(c => c.Students)
            .FirstAsync(c => c.AcademicSessionId == sessionId);
        classRoom.AssignStudent(Guid.NewGuid(), DateTimeOffset.UtcNow, AssignmentReason.Initial, null);
        await mutateDb.SaveChangesAsync();

        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new ReopenSeasonToDraftCommandHandler(db, new TestTenantContext(schoolId));
        var result = await handler.Handle(new ReopenSeasonToDraftCommand(sessionId), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("academic-sessions.errors.reopen-has-data");
    }
}
```

Not: `AssignStudent(Guid, DateTimeOffset, AssignmentReason, ...)` imzası `ActivateSeasonRolloverTests.SeedSeasonsAsync`'taki kullanımla aynıdır; `AssignmentReason` enum'unun using'ini oradan kopyala. Son parametre farklıysa entity'den (`ClassRoom.cs:235`) doğrula.

- [ ] **Step 2: FAIL doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ReopenSeasonToDraft"`
Expected: derleme hatası (komut/handler yok) → FAIL

- [ ] **Step 3: Helper + komut + handler'ı yaz**

`Shared/SetupSeasonReverter.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.AcademicSessions.Shared;

/// <summary>
/// Setup statüsündeki sezonu geri alır: şubeler + sezona bağlı tatiller + sezon
/// soft-delete edilir, bağlı taslağın OpenedSessionId linki temizlenir.
/// SaveChanges ÇAĞIRMAZ — komut handler'ı kaydeder (tek transaction).
/// Reopen ve CancelSetup komutlarının ortak çekirdeği.
/// </summary>
public static class SetupSeasonReverter
{
    /// <summary>Başarıda linki temizlenmiş (tracked) taslağı döner.</summary>
    public static async Task<Result<SeasonDraft>> RevertAsync(
        IApplicationDbContext db, Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await db.AcademicSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId, cancellationToken);
        if (session is null)
        {
            return Result<SeasonDraft>.NotFound();
        }

        if (session.Status != AcademicSessionStatus.Setup)
        {
            return Result<SeasonDraft>.Conflict("academic-sessions.errors.not-setup");
        }

        var draft = await db.SeasonDrafts.FirstOrDefaultAsync(cancellationToken);
        if (draft is null || draft.OpenedSessionId != session.Id)
        {
            return Result<SeasonDraft>.Conflict("academic-sessions.errors.reopen-mismatch");
        }

        // Setup şubeleri Active statüde oluştuğundan teorik olarak öğrenci atanmış olabilir;
        // veri varsa geri alma reddedilir (spec §4.2 guard 4).
        var classRooms = await db.ClassRooms
            .Include(c => c.Students)
            .Where(c => c.AcademicSessionId == session.Id)
            .ToListAsync(cancellationToken);

        var hasStudents = classRooms.Any(c => c.Students.Count > 0);
        var hasAssignments = await db.TeachingAssignments
            .AnyAsync(a => a.AcademicSessionId == session.Id, cancellationToken);
        if (hasStudents || hasAssignments)
        {
            return Result<SeasonDraft>.Conflict("academic-sessions.errors.reopen-has-data");
        }

        var holidays = await db.Holidays
            .Where(h => h.AcademicSessionId == session.Id)
            .ToListAsync(cancellationToken);

        db.ClassRooms.RemoveRange(classRooms);
        db.Holidays.RemoveRange(holidays);
        db.AcademicSessions.Remove(session);
        draft.ClearOpenedSession();

        return Result<SeasonDraft>.Success(draft);
    }
}
```

`Commands/ReopenSeasonToDraft/ReopenSeasonToDraftCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.AcademicSessions.Commands.ReopenSeasonToDraft;

/// <summary>
/// "Hazır" (Setup) sezonu sihirbaza geri alır: sezon + şubeleri + tatil kayıtları
/// geri alınır (soft-delete), bağlı taslağın linki temizlenir. Taslak Id döner.
/// Tek işlem — MediatR TransactionBehavior tarafından sarılır.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("academic-sessions.create")]
public sealed record ReopenSeasonToDraftCommand(Guid SessionId) : ICommand<Guid>;
```

`Commands/ReopenSeasonToDraft/ReopenSeasonToDraftCommandHandler.cs`:

```csharp
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.Shared;
using Oksis.Shared;

namespace Oksis.Application.Modules.AcademicSessions.Commands.ReopenSeasonToDraft;

public sealed class ReopenSeasonToDraftCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant)
    : ICommandHandler<ReopenSeasonToDraftCommand, Guid>
{
    public async Task<Result<Guid>> Handle(ReopenSeasonToDraftCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result<Guid>.Forbidden();
        }

        var revert = await SetupSeasonReverter.RevertAsync(db, request.SessionId, cancellationToken);
        if (revert.IsFailure)
        {
            return Result<Guid>.Failure(revert.Error);
        }

        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(revert.Value!.Id);
    }
}
```

Not: `Result.NotFound()/Conflict()/Failure(Error)` üyelerinin gerçek imzalarını `Oksis.Shared.Result` üzerinden doğrula; `Failure(revert.Error)` hata taşıma kalıbı `GetSeasonRolloverPreview`/`ActivateSeasonRollover`'daki mevcut kullanımla aynı olmalı. NotFound/Conflict status taşıyorsa hatayı aynen ilet (örn. `Result<Guid>.Conflict(revert.Error.Code)` yerine generic Failure yeterliyse onu kullan — mevcut Result API'sine uy).

- [ ] **Step 4: Controller endpoint'i ekle** — `AcademicSessionsController.cs`, `OpenFromDraftAsync`'in altına:

```csharp
    [HttpPost("{id:guid}/reopen-to-draft")]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReopenToDraftAsync(Guid id, CancellationToken cancellationToken)
        => (await sender.Send(new ReopenSeasonToDraftCommand(id), cancellationToken)).ToHttpResult(HttpContext);
```

Using bloğuna ekle: `using Oksis.Application.Modules.AcademicSessions.Commands.ReopenSeasonToDraft;`

- [ ] **Step 5: PASS doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ReopenSeasonToDraft"`
Expected: 5 test PASS

- [ ] **Step 6: Commit**

```bash
dotnet format && git add -A && git commit -m "2026-06-10 feat,test: Setup sezonu sihirbaza geri alan reopen-to-draft komutu ve endpoint'i eklendi."
```

---

## Task 6: `CancelSetupSeason` komutu + endpoint (oksis-api)

**Files:**
- Create: `src/Oksis.Application/Modules/AcademicSessions/Commands/CancelSetupSeason/CancelSetupSeasonCommand.cs`
- Create: `src/Oksis.Application/Modules/AcademicSessions/Commands/CancelSetupSeason/CancelSetupSeasonCommandHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AcademicSessionsController.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/ReopenSeasonToDraftTests.cs` (aynı dosyaya — fixture ortak)

- [ ] **Step 1: Failing test ekle** — `ReopenSeasonToDraftTests.cs`'e:

```csharp
    [Fact]
    public async Task CancelSetup_Deletes_Season_And_DraftAsync()
    {
        var schoolId = await SeedSchoolAsync();
        var (_, sessionId) = await SeedOpenedSeasonAsync(schoolId);

        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new CancelSetupSeasonCommandHandler(db, new TestTenantContext(schoolId));
        var result = await handler.Handle(new CancelSetupSeasonCommand(sessionId), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();

        await using var assertDb = _fixture.CreateDbContext(schoolId);
        (await assertDb.AcademicSessions.AnyAsync(s => s.Id == sessionId)).Should().BeFalse("sezon silinmeli");
        (await assertDb.SeasonDrafts.AnyAsync()).Should().BeFalse("taslak da silinmeli");
        (await assertDb.ClassRooms.AnyAsync(c => c.AcademicSessionId == sessionId)).Should().BeFalse();
    }
```

Using ekle: `using Oksis.Application.Modules.AcademicSessions.Commands.CancelSetupSeason;`

- [ ] **Step 2: FAIL doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CancelSetup"`
Expected: derleme hatası → FAIL

- [ ] **Step 3: Komut + handler yaz**

`CancelSetupSeasonCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.AcademicSessions.Commands.CancelSetupSeason;

/// <summary>
/// "Hazır" (Setup) sezonu tamamen iptal eder: sezon + şubeleri + tatilleri geri alınır
/// ve bağlı taslak da silinir. Tek işlem — MediatR TransactionBehavior tarafından sarılır.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("academic-sessions.create")]
public sealed record CancelSetupSeasonCommand(Guid SessionId) : ICommand;
```

`CancelSetupSeasonCommandHandler.cs`:

```csharp
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.Shared;
using Oksis.Shared;

namespace Oksis.Application.Modules.AcademicSessions.Commands.CancelSetupSeason;

public sealed class CancelSetupSeasonCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant)
    : ICommandHandler<CancelSetupSeasonCommand>
{
    public async Task<Result> Handle(CancelSetupSeasonCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result.Forbidden();
        }

        var revert = await SetupSeasonReverter.RevertAsync(db, request.SessionId, cancellationToken);
        if (revert.IsFailure)
        {
            return Result.Failure(revert.Error);
        }

        db.SeasonDrafts.Remove(revert.Value!);
        await db.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
```

Not: void `Result`'ın `Forbidden()/Failure(Error)/Success()` üyelerini `DeleteSeasonDraftCommandHandler`'daki mevcut kullanımla karşılaştırıp birebir aynı API'yi kullan. `ICommandHandler<T>` (tek generic) arayüz adını da oradan doğrula.

- [ ] **Step 4: Controller endpoint'i ekle** — `ReopenToDraftAsync`'in altına:

```csharp
    [HttpPost("{id:guid}/cancel-setup")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CancelSetupAsync(Guid id, CancellationToken cancellationToken)
        => (await sender.Send(new CancelSetupSeasonCommand(id), cancellationToken)).ToHttpResult(HttpContext);
```

Using ekle: `using Oksis.Application.Modules.AcademicSessions.Commands.CancelSetupSeason;`

- [ ] **Step 5: PASS doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ReopenSeasonToDraft"`
Expected: dosyadaki 6 test PASS

- [ ] **Step 6: Commit**

```bash
dotnet format && git add -A && git commit -m "2026-06-10 feat,test: Setup sezonu ve bağlı taslağı birlikte iptal eden cancel-setup komutu eklendi."
```

---

## Task 7: Aktivasyonda bağlı taslak silinir (oksis-api)

**Files:**
- Modify: `src/Oksis.Application/Modules/AcademicSessions/Commands/ActivateSeasonRollover/ActivateSeasonRolloverCommandHandler.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/ActivateSeasonRolloverTests.cs`

- [ ] **Step 1: Failing test ekle** — `ActivateSeasonRolloverTests.cs`'e, mevcut `Rollover_activates_session_promotes_students_and_copies_assignments` testinin altına (dosyadaki `SeedSchoolAsync`/`SeedStudentsAsync`/`SeedSeasonsAsync`/`TestTenantContext`/`FixedClock`/`_noOpCache` üyeleri aynen kullanılır; `using Oksis.Domain.Modules.AcademicSessions.Entities;` yoksa ekle):

```csharp
    [Fact]
    public async Task Rollover_deletes_linked_draft_on_success()
    {
        // Arrange — standart rollover kurulumu + hedef sezona bağlı taslak
        var schoolId = await SeedSchoolAsync();
        var (s1, s2, s3) = await SeedStudentsAsync(schoolId);
        var (_, targetSessionId, _, _) = await SeedSeasonsAsync(schoolId, s1, s2, s3);

        await using (var draftDb = _fixture.CreateDbContext(schoolId))
        {
            var draft = SeasonDraft.Create(schoolId, "2026-2027", targetSessionId);
            draft.MarkOpened(targetSessionId);
            draftDb.SeasonDrafts.Add(draft);
            await draftDb.SaveChangesAsync();
        }

        var tenantCtx = new TestTenantContext(schoolId);
        var clock = new FixedClock(DateTimeOffset.UtcNow);
        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new ActivateSeasonRolloverCommandHandler(db, tenantCtx, clock, _noOpCache);

        // Act
        var result = await handler.Handle(
            new ActivateSeasonRolloverCommand(targetSessionId, ConfirmArchivePrevious: true),
            CancellationToken.None);

        // Assert — aktivasyon başarılı VE bağlı taslak silindi
        result.IsSuccess.Should().BeTrue();
        await using var assertDb = _fixture.CreateDbContext(schoolId);
        (await assertDb.SeasonDrafts.AnyAsync())
            .Should().BeFalse("aktivasyon hedef sezona bağlı taslağı silmeli");
    }
```

Not: `_noOpCache` alanının dosyadaki gerçek adını doğrula (no-op `ICacheService` fake'i); farklıysa o adı kullan.

- [ ] **Step 2: FAIL doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ActivateSeasonRollover"`
Expected: yeni test FAIL (taslak hâlâ duruyor)

- [ ] **Step 3: Handler'ı güncelle** — `ActivateSeasonRolloverCommandHandler.Handle` içinde, adım 3'ün (görevlendirme kopyalama `if (previousId is not null) { ... }` bloğu) bitiminden sonra, `return Result<...>.Success(...)`'tan önce ekle:

```csharp
        // 4. Hedef sezona bağlı taslağı sil — taslak yaşam döngüsü aktivasyonla biter.
        //    Taslak yoksa sessizce geçilir (eski akışta açılışta silinmiş olabilir).
        var linkedDraft = await db.SeasonDrafts
            .FirstOrDefaultAsync(d => d.OpenedSessionId == request.TargetSessionId, cancellationToken);
        if (linkedDraft is not null)
        {
            db.SeasonDrafts.Remove(linkedDraft);
            await db.SaveChangesAsync(cancellationToken);
        }
```

Using ekle (yoksa): `using Microsoft.EntityFrameworkCore;`
Sınıfın XML doc yorumundaki "üç alt handler" ifadesini "üç alt handler + bağlı taslak temizliği" olarak güncelle.

- [ ] **Step 4: PASS doğrula + tam regresyon**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ActivateSeasonRollover"` → PASS
Run: `dotnet test` (tüm solution) → PASS. Kırılan başka test varsa (örn. taslağın silinmesini bekleyen eski assert'ler) bu plana göre güncelle: taslak artık açılışta silinmez, aktivasyonda silinir.

- [ ] **Step 5: Commit**

```bash
dotnet format && git add -A && git commit -m "2026-06-10 feat,test: Sezon aktivasyonunda hedef sezona bağlı taslak siliniyor."
```

---

## Task 8: Frontend altyapı — tip, API, hook, i18n (oksis-web)

**Files:**
- Modify: `src/portals/admin/academic-sessions/types/index.ts:109-123`
- Modify: `src/portals/admin/academic-sessions/api/academicSessionsApi.ts`
- Modify: `src/portals/admin/academic-sessions/hooks/useSeasonWizard.ts`
- Modify: `src/shared/i18n/locales/tr/academic-sessions.json` ve `src/shared/i18n/locales/en/academic-sessions.json`

- [ ] **Step 1: Tipi genişlet** — `SeasonDraftDto` interface'ine (`holidaysJson` satırından sonra):

```ts
  openedSessionId: string | null;
```

- [ ] **Step 2: API çağrılarını ekle** — `academicSessionsApi.ts` içine, `activateRollover`'ın yanına (dosyadaki `httpClient` kullanım kalıbıyla aynı):

```ts
  reopenToDraft: async (id: string): Promise<void> => {
    await httpClient.post(`/academic-sessions/${id}/reopen-to-draft`);
  },
  cancelSetup: async (id: string): Promise<void> => {
    await httpClient.post(`/academic-sessions/${id}/cancel-setup`);
  },
```

- [ ] **Step 3: Mutation hook'larını ekle** — `useSeasonWizard.ts` sonuna:

```ts
export const useReopenSeasonToDraftMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicSessionsApi.reopenToDraft(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seasonWizardKeys.draft() });
      qc.invalidateQueries({ queryKey: academicSessionsKeys.all() });
    },
  });
};

export const useCancelSetupSeasonMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicSessionsApi.cancelSetup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seasonWizardKeys.draft() });
      qc.invalidateQueries({ queryKey: academicSessionsKeys.all() });
    },
  });
};
```

- [ ] **Step 4: i18n anahtarlarını ekle** — `tr/academic-sessions.json` içindeki `"dialogs"` objesine (mevcut activate-* anahtarlarının yanına):

```json
      "reopen-title": "Sihirbaza geri al",
      "reopen-lead": "{{name}} sezonu düzenlemek için sihirbaza geri alınacak.",
      "reopen-warning": "Açılışta oluşturulan şubeler ve yarıyıl tatili kaydı geri alınacak; sihirbazı tamamladığınızda yeniden oluşturulurlar.",
      "reopen-cancel": "Vazgeç",
      "reopen-confirm": "Geri Al ve Düzenle",
      "reopen-error": "Sezon geri alınamadı. Lütfen tekrar deneyin.",
      "cancel-setup-title": "Hazır sezonu sil",
      "cancel-setup-lead": "{{name}} sezonu ve taslağı kalıcı olarak silinecek.",
      "cancel-setup-warning": "Bu işlem geri alınamaz. Sezon, şubeleri ve sihirbaz taslağı birlikte silinir.",
      "cancel-setup-cancel": "Vazgeç",
      "cancel-setup-confirm": "Sezonu Sil",
      "cancel-setup-error": "Sezon silinemedi. Lütfen tekrar deneyin.",
      "pending-blocks-title": "Önce hazır sezonu sonuçlandırın",
      "pending-blocks-body": "{{name}} aktifleştirilmeyi bekliyor. Yeni bir sezon açmadan önce onu aktifleştirin ya da düzenlemek için sihirbaza geri alın.",
      "pending-blocks-ok": "Anladım"
```

`en/academic-sessions.json`'a İngilizce karşılıkları aynı anahtarlarla ekle (örn. "reopen-title": "Reopen in wizard", "cancel-setup-title": "Delete ready season", "pending-blocks-title": "Finalize the ready season first" vb. — dosyadaki mevcut en çevirilerinin tonunu izle).

- [ ] **Step 5: Typecheck + mevcut testler**

Run: `cd oksis-web && npx tsc --noEmit && npm run test -- src/portals/admin/academic-sessions`
Expected: tip hatası yok; mevcut testler PASS (MSW mock'larındaki draft objelerine `openedSessionId` zorunlu değil — interface'e eklediğin için mock objeler kırılırsa `openedSessionId: null` ekle).

- [ ] **Step 6: Commit (oksis-web)**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-10 feat: Reopen/cancel-setup API çağrıları, mutation hook'ları ve i18n anahtarları eklendi."
```

---

## Task 9: Bağlı taslak listede gizlenir (oksis-web)

**Files:**
- Modify: `src/portals/admin/academic-sessions/hooks/useSeasonListData.ts:62`
- Test: `src/portals/admin/academic-sessions/pages/__tests__/SeasonListPage.test.tsx`

- [ ] **Step 1: Failing test yaz** — `SeasonListPage.test.tsx`'e (mevcut `draft` fixture'ının yanına `openedDraft` ekle):

```ts
const openedDraft = { ...draft, openedSessionId: 'setup1' };
```

Yeni test:

```ts
  it('hides the in-progress draft card when the draft is linked to a Setup season', async () => {
    seedHandlers(openedDraft);
    server.use(
      http.get('*/academic-sessions', () => HttpResponse.json({ data: [
        { id: 'setup1', name: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30', status: 'Setup', isCurrent: false, activatedAt: null, archivedAt: null, studentCount: 0, graduateCount: 0 },
      ] })),
    );
    renderPage();
    expect(await screen.findByText(/Hazır/)).toBeInTheDocument();
    // Devam-eden taslak kartının "Devam Et" butonu OLMAMALI (bağlı taslak gizli)
    expect(screen.queryByRole('button', { name: /Devam Et/i })).not.toBeInTheDocument();
  });
```

Not: DraftSeasonCard'ın buton etiketi `t('list.draft-continue')` — tr locale'deki gerçek karşılığını (`Devam Et` vb.) `tr/academic-sessions.json`'dan doğrula ve regex'i ona göre yaz.

- [ ] **Step 2: FAIL doğrula**

Run: `npm run test -- src/portals/admin/academic-sessions/pages/__tests__/SeasonListPage.test.tsx`
Expected: yeni test FAIL (bağlı taslak kartı görünüyor)

- [ ] **Step 3: Hook'u güncelle** — `useSeasonListData.ts:62`:

```ts
    // Bağlı (openedSessionId dolu) taslak "devam eden taslak" değildir; Hazır kart Setup sezondan beslenir.
    draft: draftQuery.data && !draftQuery.data.openedSessionId ? draftQuery.data : null,
```

- [ ] **Step 4: PASS doğrula**

Run: `npm run test -- src/portals/admin/academic-sessions/pages/__tests__/SeasonListPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "2026-06-10 feat,test: Setup sezona bağlı taslak listede devam-eden taslak olarak gösterilmiyor."
```

---

## Task 10: Üç yeni dialog bileşeni (oksis-web)

**Files:**
- Create: `src/portals/admin/academic-sessions/components/list/ReopenSeasonDialog.tsx`
- Create: `src/portals/admin/academic-sessions/components/list/CancelSetupDialog.tsx`
- Create: `src/portals/admin/academic-sessions/components/list/PendingBlocksNewSeasonDialog.tsx`
- Test: `src/portals/admin/academic-sessions/components/list/__tests__/ReopenSeasonDialog.test.tsx` (3 dialog tek dosyada test edilebilir — ayrı describe'lar)

- [ ] **Step 1: Failing testleri yaz** — mevcut `__tests__/ActivateSeasonDialog.test.tsx`'in render/i18n kurulum kalıbını birebir izle (i18n import + render). Çekirdek senaryolar:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../../../../shared/i18n';
import { ReopenSeasonDialog } from '../ReopenSeasonDialog';
import { CancelSetupDialog } from '../CancelSetupDialog';
import { PendingBlocksNewSeasonDialog } from '../PendingBlocksNewSeasonDialog';

describe('ReopenSeasonDialog', () => {
  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ReopenSeasonDialog open name="2027-2028" isPending={false} onCancel={() => {}} onConfirm={onConfirm} />);
    screen.getByRole('button', { name: /Geri Al ve Düzenle/i }).click();
    expect(onConfirm).toHaveBeenCalled();
  });

  it('disables confirm while pending', () => {
    render(<ReopenSeasonDialog open name="2027-2028" isPending onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole('button', { name: /Geri Al ve Düzenle/i })).toBeDisabled();
  });
});

describe('CancelSetupDialog', () => {
  it('calls onConfirm when the destructive button is clicked', () => {
    const onConfirm = vi.fn();
    render(<CancelSetupDialog open name="2027-2028" isPending={false} onCancel={() => {}} onConfirm={onConfirm} />);
    screen.getByRole('button', { name: /Sezonu Sil/i }).click();
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe('PendingBlocksNewSeasonDialog', () => {
  it('renders the blocking message with the season name and closes via OK', () => {
    const onClose = vi.fn();
    render(<PendingBlocksNewSeasonDialog open name="2027-2028" onClose={onClose} />);
    expect(screen.getByText(/2027-2028/)).toBeInTheDocument();
    screen.getByRole('button', { name: /Anladım/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: FAIL doğrula**

Run: `npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/ReopenSeasonDialog.test.tsx`
Expected: FAIL (bileşenler yok)

- [ ] **Step 3: Bileşenleri yaz** — `ActivateSeasonDialog.tsx`'in shell kalıbıyla (`Dialog/DialogContent/DialogHeader/DialogFooter`, aynı buton sınıfları):

`ReopenSeasonDialog.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Pencil, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../../../app/components/ui/dialog';

interface ReopenSeasonDialogProps {
  open: boolean;
  name: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ReopenSeasonDialog({ open, name, isPending, onCancel, onConfirm }: ReopenSeasonDialogProps) {
  const { t } = useTranslation('academic-sessions');
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#EEF1FA] text-[#1B2B5E]">
            <Pencil size={20} />
          </div>
          <DialogTitle>{t('dialogs.reopen-title')}</DialogTitle>
          <DialogDescription>{t('dialogs.reopen-lead', { name })}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex items-start gap-2 rounded-[10px] bg-[#FEF3C7] px-3 py-2.5 text-[12.5px] text-[#92400E]">
          <AlertTriangle size={15} className="mt-px shrink-0" />
          <span>{t('dialogs.reopen-warning')}</span>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel}
            className="rounded-md border border-[#E6E9F2] px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            {t('dialogs.reopen-cancel')}
          </button>
          <button type="button" onClick={onConfirm} disabled={isPending}
            className="inline-flex items-center gap-1 rounded-md bg-[#1B2B5E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14224A] disabled:opacity-50">
            <Pencil size={15} /> {t('dialogs.reopen-confirm')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

`CancelSetupDialog.tsx` — aynı shell; ikon `Trash2`, ikon kutusu `bg-[#FEE2E2] text-[#991B1B]`, confirm butonu danger (`bg-[#B91C1C] hover:bg-[#991B1B]`), metin anahtarları `dialogs.cancel-setup-*`:

```tsx
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../../../app/components/ui/dialog';

interface CancelSetupDialogProps {
  open: boolean;
  name: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CancelSetupDialog({ open, name, isPending, onCancel, onConfirm }: CancelSetupDialogProps) {
  const { t } = useTranslation('academic-sessions');
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#FEE2E2] text-[#991B1B]">
            <Trash2 size={20} />
          </div>
          <DialogTitle>{t('dialogs.cancel-setup-title')}</DialogTitle>
          <DialogDescription>{t('dialogs.cancel-setup-lead', { name })}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex items-start gap-2 rounded-[10px] bg-[#FEE2E2] px-3 py-2.5 text-[12.5px] text-[#991B1B]">
          <AlertTriangle size={15} className="mt-px shrink-0" />
          <span>{t('dialogs.cancel-setup-warning')}</span>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel}
            className="rounded-md border border-[#E6E9F2] px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            {t('dialogs.cancel-setup-cancel')}
          </button>
          <button type="button" onClick={onConfirm} disabled={isPending}
            className="inline-flex items-center gap-1 rounded-md bg-[#B91C1C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#991B1B] disabled:opacity-50">
            <Trash2 size={15} /> {t('dialogs.cancel-setup-confirm')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

`PendingBlocksNewSeasonDialog.tsx` — bilgi dialogu, tek buton:

```tsx
import { useTranslation } from 'react-i18next';
import { CalendarClock } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../../../app/components/ui/dialog';

interface PendingBlocksNewSeasonDialogProps {
  open: boolean;
  name: string;
  onClose: () => void;
}

export function PendingBlocksNewSeasonDialog({ open, name, onClose }: PendingBlocksNewSeasonDialogProps) {
  const { t } = useTranslation('academic-sessions');
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#EEF1FA] text-[#1B2B5E]">
            <CalendarClock size={20} />
          </div>
          <DialogTitle>{t('dialogs.pending-blocks-title')}</DialogTitle>
          <DialogDescription>{t('dialogs.pending-blocks-body', { name })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button" onClick={onClose}
            className="rounded-md bg-[#1B2B5E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14224A]">
            {t('dialogs.pending-blocks-ok')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: PASS doğrula**

Run: `npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/ReopenSeasonDialog.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "2026-06-10 feat,test: Reopen, cancel-setup ve yeni-sezon-blok dialog bileşenleri eklendi."
```

---

## Task 11: `SeasonListPage` wiring (oksis-web)

**Files:**
- Modify: `src/portals/admin/academic-sessions/pages/SeasonListPage.tsx`
- Test: `src/portals/admin/academic-sessions/pages/__tests__/SeasonListPage.test.tsx`

- [ ] **Step 1: Failing testleri yaz** — `SeasonListPage.test.tsx`'e (Task 9'daki `openedDraft` fixture'ı + Setup session mock'u kullanılır; `seedSetupHandlers` adıyla küçük bir yardımcı çıkarabilirsin):

```ts
  it('opens the reopen dialog from Düzenle and navigates to the wizard on confirm', async () => {
    seedHandlers(openedDraft);
    server.use(
      http.get('*/academic-sessions', () => HttpResponse.json({ data: [
        { id: 'setup1', name: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30', status: 'Setup', isCurrent: false, activatedAt: null, archivedAt: null, studentCount: 0, graduateCount: 0 },
      ] })),
      http.post('*/academic-sessions/setup1/reopen-to-draft', () => HttpResponse.json({ data: 'd1' })),
    );
    renderPage();
    await screen.findByText(/Hazır/);
    screen.getByRole('button', { name: /Düzenle/i }).click();
    expect(await screen.findByText(/sihirbaza geri alınacak/i)).toBeInTheDocument();
    screen.getByRole('button', { name: /Geri Al ve Düzenle/i }).click();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('new'));
  });

  it('opens the cancel-setup dialog from Sil and calls the endpoint on confirm', async () => {
    const cancelSpy = vi.fn();
    seedHandlers(openedDraft);
    server.use(
      http.get('*/academic-sessions', () => HttpResponse.json({ data: [
        { id: 'setup1', name: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30', status: 'Setup', isCurrent: false, activatedAt: null, archivedAt: null, studentCount: 0, graduateCount: 0 },
      ] })),
      http.post('*/academic-sessions/setup1/cancel-setup', () => { cancelSpy(); return new HttpResponse(null, { status: 204 }); }),
    );
    renderPage();
    await screen.findByText(/Hazır/);
    screen.getByRole('button', { name: /^Sil$/i }).click();
    expect(await screen.findByText(/geri alınamaz/i)).toBeInTheDocument();
    screen.getByRole('button', { name: /Sezonu Sil/i }).click();
    await waitFor(() => expect(cancelSpy).toHaveBeenCalled());
  });

  it('blocks "Yeni Sezon Aç" with an info dialog while a Setup season is pending', async () => {
    seedHandlers(openedDraft);
    server.use(
      http.get('*/academic-sessions', () => HttpResponse.json({ data: [
        { id: 'setup1', name: '2026-2027', startDate: '2026-09-01', endDate: '2027-06-30', status: 'Setup', isCurrent: false, activatedAt: null, archivedAt: null, studentCount: 0, graduateCount: 0 },
      ] })),
    );
    renderPage();
    await screen.findByText(/Hazır/);
    screen.getByRole('button', { name: /Yeni Sezon Aç/i }).click();
    expect(await screen.findByText(/aktifleştirilmeyi bekliyor/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
```

Not: "Yeni Sezon Aç" hem header'da hem hero köprüsünde var; `getByRole` çoklu eşleşirse `getAllByRole(...)[0]` kullan (mevcut testteki kalıba bak).

- [ ] **Step 2: FAIL doğrula**

Run: `npm run test -- src/portals/admin/academic-sessions/pages/__tests__/SeasonListPage.test.tsx`
Expected: 3 yeni test FAIL

- [ ] **Step 3: Sayfayı güncelle** — `SeasonListPage.tsx`:

(a) Import'lar:

```ts
import { useReopenSeasonToDraftMutation, useCancelSetupSeasonMutation } from '../hooks/useSeasonWizard';
import { ReopenSeasonDialog } from '../components/list/ReopenSeasonDialog';
import { CancelSetupDialog } from '../components/list/CancelSetupDialog';
import { PendingBlocksNewSeasonDialog } from '../components/list/PendingBlocksNewSeasonDialog';
```

(b) Modal türleri: `type ModalKind = 'discard' | 'delete' | 'activate' | 'activated' | 'reopen' | 'cancel-setup' | 'pending-blocks' | null;`

(c) Hook'lar (mevcutların yanına):

```ts
  const reopenSeason = useReopenSeasonToDraftMutation();
  const cancelSetup = useCancelSetupSeasonMutation();
```

(d) `handleNewSeason` güncelle:

```ts
  const handleNewSeason = () => {
    if (pendingActivation) setModal('pending-blocks');
    else if (draft) setModal('discard');
    else navigate('new');
  };
```

(e) Yeni handler'lar (`handleActivateConfirm`'ün yanına):

```ts
  const handleReopenConfirm = async () => {
    if (!pendingActivation || reopenSeason.isPending) return;
    try {
      await reopenSeason.mutateAsync(pendingActivation.id);
      setModal(null);
      navigate('new');
    } catch {
      toast.error(t('dialogs.reopen-error'));
    }
  };

  const handleCancelSetupConfirm = async () => {
    if (!pendingActivation || cancelSetup.isPending) return;
    try {
      await cancelSetup.mutateAsync(pendingActivation.id);
      setModal(null);
    } catch {
      toast.error(t('dialogs.cancel-setup-error'));
    }
  };
```

(f) `PendingSeasonCard` kullanımını güncelle (`onDelete` yorumu kaldırılır):

```tsx
        {pendingActivation && (
          <PendingSeasonCard
            session={pendingActivation}
            sourceLabel={active?.name ?? '—'}
            onActivate={() => setModal('activate')}
            onEdit={() => setModal('reopen')}
            onDelete={() => setModal('cancel-setup')}
          />
        )}
```

`PendingSeasonCardProps.onDelete`'i zorunlu yap (`onDelete: () => void;`) ve bileşendeki `{onDelete && (...)}` koşulunu kaldırıp butonu her zaman render et; prop doc yorumunu sil.

(g) Sayfa sonuna yeni dialoglar (mevcut dialogların yanına):

```tsx
      <ReopenSeasonDialog
        open={modal === 'reopen'}
        name={pendingActivation?.name ?? ''}
        isPending={reopenSeason.isPending}
        onCancel={() => setModal(null)}
        onConfirm={handleReopenConfirm}
      />
      <CancelSetupDialog
        open={modal === 'cancel-setup'}
        name={pendingActivation?.name ?? ''}
        isPending={cancelSetup.isPending}
        onCancel={() => setModal(null)}
        onConfirm={handleCancelSetupConfirm}
      />
      <PendingBlocksNewSeasonDialog
        open={modal === 'pending-blocks'}
        name={pendingActivation?.name ?? ''}
        onClose={() => setModal(null)}
      />
```

- [ ] **Step 4: PASS doğrula** (+ PendingSeasonCard testi `onDelete` zorunlu olduğu için kırılırsa prop ekle)

Run: `npm run test -- src/portals/admin/academic-sessions`
Expected: tüm modül testleri PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "2026-06-10 feat,test: Hazır sezon kartında Düzenle reopen akışına bağlandı, Sil görünür oldu, yeni sezon blokajı eklendi."
```

---

## Task 12: Wizard deep-link guard (oksis-web)

**Files:**
- Modify: `src/portals/admin/academic-sessions/pages/SeasonWizardPage.tsx:59-61`
- Test: `src/portals/admin/academic-sessions/pages/__tests__/SeasonWizardPage.test.tsx`

- [ ] **Step 1: Failing test yaz** — `SeasonWizardPage.test.tsx`'in mevcut render/mock kalıbını izleyerek:

```ts
  it('redirects to the season list when the draft is already opened into a Setup season', async () => {
    // draft mock'u openedSessionId: 'setup1' ile ver
    // render et; bekle:
    // await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/academic-sessions', { replace: true }));
  });
```

(Dosyadaki gerçek mock-draft fixture'ına `openedSessionId: 'setup1'` ekleyerek; assert satırı aynen yukarıdaki `waitFor`.)

- [ ] **Step 2: FAIL doğrula**

Run: `npm run test -- src/portals/admin/academic-sessions/pages/__tests__/SeasonWizardPage.test.tsx`
Expected: yeni test FAIL

- [ ] **Step 3: Guard ekle** — `SeasonWizardPage.tsx`'te mevcut `useEffect`'in (draft reset, satır 59-61) üstüne:

```ts
  // Bağlı taslak sihirbazda düzenlenemez — önce listeden "Geri Al" gerekir (deep-link koruması).
  useEffect(() => {
    if (draft?.openedSessionId) navigate('/admin/academic-sessions', { replace: true });
  }, [draft, navigate]);
```

- [ ] **Step 4: PASS doğrula**

Run: `npm run test -- src/portals/admin/academic-sessions/pages/__tests__/SeasonWizardPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "2026-06-10 feat,test: Sihirbaza deep-link koruması — bağlı taslakta liste sayfasına yönlendirilir."
```

---

## Task 13: Akademik Takvim rozet koşulu (oksis-web)

**Files:**
- Modify: `src/modules/academic-calendar/pages/AcademicCalendarPage.tsx:104`

- [ ] **Step 1: Koşulu güncelle**

```tsx
          hasDraft={Boolean(draftQuery.data && !draftQuery.data.openedSessionId)}
```

- [ ] **Step 2: Typecheck + takvim testleri**

Run: `npx tsc --noEmit && npm run test -- src/modules/academic-calendar`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "2026-06-10 fix: Akademik Takvim taslak rozeti açılmış (bağlı) taslağı taslak saymıyor."
```

---

## Task 14: Modül dokümantasyonu (workspace root)

**Files:**
- Modify: `.claude/docs/modules/academic-years/api-contracts.md`
- Modify: `.claude/docs/modules/academic-years/business-rules.md`
- Modify: `.claude/docs/modules/academic-years/completion_status.md`
- Modify: `.claude/docs/modules/academic-years/README.md` (Last Updated)

- [ ] **Step 1: api-contracts.md** — Sezon Rollover bölümüne ekle: `POST /api/v1/academic-sessions/{id}/reopen-to-draft` (200 → taslak Id; 404; 409 `not-setup|reopen-mismatch|reopen-has-data`) ve `POST /api/v1/academic-sessions/{id}/cancel-setup` (204; aynı hata kodları); `GET /season-drafts/current` yanıtına `openedSessionId` alanı; open-from-draft davranış değişikliği (taslak silinmez, linklenir; yeni 409 `draft-already-opened`). Dosyadaki mevcut endpoint tablo/format kalıbını izle.

- [ ] **Step 2: business-rules.md** — Taslak yaşam döngüsü kuralını ekle (dosyadaki BR numaralandırma şemasını izleyerek bir sonraki boş BR-AS-XXX numarasını kullan): taslak "Sezonu Aç" ile silinmez, `OpenedSessionId` ile Setup sezona bağlanır ve aktivasyonda silinir; Setup sezon yalnız şubelerine veri (öğrenci/görevlendirme) eklenmemişken sihirbaza geri alınabilir; Hazır (Setup) sezon varken yeni sezon/taslak açılamaz (UI blokajı + tek-taslak indeksi).

- [ ] **Step 3: completion_status.md** — `Güncel` tarihini ve progress'i güncelle; ✅ bölümüne tek madde: reopen-to-draft + cancel-setup + liste wiring özeti (tasarım/plan dosya referanslarıyla); satır 27'deki "Bilinen boşluk: Setup-sezon Sil gizli" notunu kaldır/kapat (çözüldü olarak işaretle). README'de `Last Updated`'ı 2026-06-10 yap.

- [ ] **Step 4: Commit (workspace root)**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs/modules/academic-years && git commit -m "2026-06-10 docs: Reopen-to-draft ve cancel-setup endpoint'leri academic-years modül dokümanlarına işlendi."
```

---

## Final doğrulama

- [ ] oksis-api: `dotnet test` → tümü PASS
- [ ] oksis-web: `npx tsc --noEmit && npm run test` → tümü PASS
- [ ] Manuel duman testi (mümkünse): sihirbazı tamamla → Hazır kart → Düzenle → sihirbaz dolu açılıyor → tekrar "Sezonu Aç" → Hazır kart geri geliyor → Aktifleştir → taslak silinmiş (DB/`GET /season-drafts/current` null).
