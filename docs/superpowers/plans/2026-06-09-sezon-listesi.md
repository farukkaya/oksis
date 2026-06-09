# Sezon Listesi (Season List) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/academic-sessions` artık doğrudan sihirbazı değil; aktif sezon + taslak + arşivi gösteren bir **Sezon Listesi** landing ekranını açar. "Yeni Sezon Aç" taslak-çakışma modalından geçerek sihirbaza (`/new`) yönlendirir.

**Architecture:** Backend'de mevcut iki query handler'ı sayım alanlarıyla genişletiyoruz (yeni endpoint yok). Frontend'de yeni `SeasonListPage` + alt component'ler + iki shadcn `Dialog` modalı ekliyoruz; mevcut `SeasonWizardPage`'i `/new` route'una taşıyoruz. Tüm veri mevcut React Query hook'larından gelir.

**Tech Stack:** Backend: .NET 10, MediatR/CQRS, EF Core 10, Mapster, xUnit + FluentAssertions (Infrastructure.IntegrationTests, DatabaseFixture). Frontend: React 18 + TS, React Query v5, React Router v6, Tailwind, shadcn `Dialog`, i18next, dayjs, vitest + Testing Library + MSW.

**Genel kurallar (her task'ta geçerli):**
- İki ayrı git repo: backend değişiklikleri `oksis-api/` içinde, frontend `oksis-web/` içinde commit'lenir. Commit mesajı OKSİS formatı: `YYYY-MM-DD <type>: Türkçe özet.` (bugün `2026-06-09`). Commit gövdesi sonuna `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Hardcode Türkçe string YOK (i18n). Default export YOK (named export). `any` YOK. Inline style YOK (Tailwind).
- Backend test komutu: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~<TestClass>"`.
- Frontend test komutu: `cd oksis-web && npm run test -- <path>`.

---

## File Structure

**Backend (`oksis-api/`):**
- Modify: `src/Oksis.Application/Modules/AcademicSessions/DTOs/CurrentSessionDto.cs` — `ActiveStudentCount` ekle.
- Modify: `src/Oksis.Application/Modules/AcademicSessions/DTOs/AcademicSessionDto.cs` — `StudentCount`, `GraduateCount` ekle.
- Modify: `.../Queries/GetCurrentSession/GetCurrentSessionQueryHandler.cs` — aktif öğrenci sayımı.
- Modify: `.../Queries/GetAcademicSessionList/GetAcademicSessionListQueryHandler.cs` — sezon başına öğrenci/mezun sayımı.
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetCurrentSessionStudentCountTests.cs` (yeni).
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAcademicSessionListCountsTests.cs` (yeni).

**Frontend (`oksis-web/`):**
- Modify: `src/portals/admin/academic-sessions/types/index.ts` — DTO alanları.
- Modify: `src/shared/i18n/locales/tr/academic-sessions.json` + `.../en/academic-sessions.json` — `list.*`, `dialogs.*`.
- Create: `src/portals/admin/academic-sessions/hooks/useSeasonListData.ts` (+ test).
- Create: `src/portals/admin/academic-sessions/components/list/ActiveSeasonHero.tsx` (+ test).
- Create: `src/portals/admin/academic-sessions/components/list/DraftSeasonCard.tsx` (+ test).
- Create: `src/portals/admin/academic-sessions/components/list/ArchiveSeasonGrid.tsx` (+ test).
- Create: `src/portals/admin/academic-sessions/components/list/DiscardDraftDialog.tsx` (+ test).
- Create: `src/portals/admin/academic-sessions/components/list/DeleteDraftDialog.tsx` (+ test).
- Create: `src/portals/admin/academic-sessions/pages/SeasonListPage.tsx` (+ test).
- Modify: `src/portals/admin/academic-sessions/index.ts` — `SeasonListPage` export.
- Modify: `src/app/routes.tsx:228-233` — index→list, `new`→wizard.
- Modify: `src/portals/admin/academic-sessions/pages/SeasonWizardPage.tsx` — "geri" hedefleri liste route'una.

**Docs (`oksis/` workspace repo):**
- Modify: `.claude/docs/modules/academic-years/ui-flows.md`, `api-contracts.md`, `completion_status.md`.

---

## Task 1: Backend — `CurrentSessionDto.ActiveStudentCount`

**Files:**
- Modify: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/DTOs/CurrentSessionDto.cs`
- Modify: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/Queries/GetCurrentSession/GetCurrentSessionQueryHandler.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetCurrentSessionStudentCountTests.cs`

- [ ] **Step 1: Write the failing test**

Create `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetCurrentSessionStudentCountTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Modules.AcademicSessions.Queries.GetCurrentSession;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// GET /academic-sessions/current → ActiveStudentCount: aktif sezonun şubelerindeki
/// LeftAt == null (aktif) atamaların distinct öğrenci sayısı. Mezun/ayrılan sayılmaz;
/// tenant izolasyonu (başka okul) sayıma karışmaz.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class GetCurrentSessionStudentCountTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    public GetCurrentSessionStudentCountTests(DatabaseFixture fixture) => _fixture = fixture;
    public async Task InitializeAsync() => await _fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<Guid> SeedCurrentSessionWithStudentsAsync(Guid schoolId)
    {
        await using var db = _fixture.CreateDbContext(schoolId);
        var termTypeIds = await db.AcademicTermTypes.AsNoTracking()
            .OrderBy(t => t.DisplayOrder).Take(2).Select(t => t.Id).ToListAsync();
        var gradeLevelId = await db.GradeLevels.AsNoTracking()
            .OrderBy(g => g.DisplayOrder).Select(g => g.Id).FirstAsync();

        var session = AcademicSession.Create(
            schoolId, "2025-2026",
            new DateOnly(2025, 9, 15), new DateOnly(2026, 6, 13),
            termTypeIds[0], new DateOnly(2025, 9, 15), new DateOnly(2026, 1, 23),
            termTypeIds[1], new DateOnly(2026, 2, 10), new DateOnly(2026, 6, 13));
        session.Activate(DateTimeOffset.UtcNow, previousSessionId: null);
        db.AcademicSessions.Add(session);

        var room = ClassRoom.Create(schoolId, session.Id, gradeLevelId, "9", "A", 30, requireApproval: false);
        var now = DateTimeOffset.UtcNow;
        room.AssignStudent(Guid.NewGuid(), now, AssignmentReason.Initial, null);     // aktif
        room.AssignStudent(Guid.NewGuid(), now, AssignmentReason.Initial, null);     // aktif
        var leaver = Guid.NewGuid();
        room.AssignStudent(leaver, now, AssignmentReason.Initial, null);
        room.RemoveStudent(leaver, now, AssignmentReason.Transfer, null);            // ayrıldı → sayılmaz
        db.ClassRooms.Add(room);

        await db.SaveChangesAsync();
        return session.Id;
    }

    [Fact]
    public async Task ActiveStudentCount_CountsOnlyActiveAssignmentsAsync()
    {
        var schoolId = Guid.NewGuid();
        await SeedCurrentSessionWithStudentsAsync(schoolId);

        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new GetCurrentSessionQueryHandler(db);

        var result = await handler.Handle(new GetCurrentSessionQuery(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.ActiveStudentCount.Should().Be(2);
    }

    [Fact]
    public async Task ActiveStudentCount_IsTenantIsolatedAsync()
    {
        var schoolA = Guid.NewGuid();
        var schoolB = Guid.NewGuid();
        await SeedCurrentSessionWithStudentsAsync(schoolA);
        await SeedCurrentSessionWithStudentsAsync(schoolB);

        await using var db = _fixture.CreateDbContext(schoolA);
        var handler = new GetCurrentSessionQueryHandler(db);

        var result = await handler.Handle(new GetCurrentSessionQuery(), CancellationToken.None);

        result.Value!.ActiveStudentCount.Should().Be(2); // sadece schoolA
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetCurrentSessionStudentCountTests"`
Expected: BUILD FAILURE veya FAIL — `CurrentSessionDto` `ActiveStudentCount` üyesi yok.

- [ ] **Step 3: Add `ActiveStudentCount` to `CurrentSessionDto`**

`CurrentSessionDto.cs` record'una son parametre olarak ekle:

```csharp
public sealed record CurrentSessionDto(
    Guid Id,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    string Status,
    bool IsCurrent,
    AcademicTermDto? CurrentTerm,
    AcademicTermDto[] Terms,
    int ActiveStudentCount);
```

- [ ] **Step 4: Compute count in `GetCurrentSessionQueryHandler`**

`GetCurrentSessionQueryHandler.cs` içinde, `return Result<CurrentSessionDto>.Success(...)` çağrısından ÖNCE sayımı ekle ve son argümanı geçir:

```csharp
        var activeStudentCount = await db.ClassRooms
            .AsNoTracking()
            .Where(c => c.AcademicSessionId == session.Id)
            .SelectMany(c => c.Students)
            .Where(cs => cs.LeftAt == null)
            .Select(cs => cs.StudentId)
            .Distinct()
            .CountAsync(cancellationToken);

        return Result<CurrentSessionDto>.Success(new CurrentSessionDto(
            session.Id,
            session.Name,
            session.StartDate,
            session.EndDate,
            session.Status.ToString(),
            session.IsCurrent,
            currentTerm,
            terms,
            activeStudentCount));
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetCurrentSessionStudentCountTests"`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: CurrentSessionDto'ya aktif öğrenci sayısı (ActiveStudentCount) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Backend — `AcademicSessionDto` öğrenci/mezun sayıları

**Files:**
- Modify: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/DTOs/AcademicSessionDto.cs`
- Modify: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/Queries/GetAcademicSessionList/GetAcademicSessionListQueryHandler.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAcademicSessionListCountsTests.cs`

- [ ] **Step 1: Write the failing test**

Create `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAcademicSessionListCountsTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Modules.AcademicSessions.Queries.GetAcademicSessionList;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// GET /academic-sessions → StudentCount (sezona kayıtlı distinct öğrenci, ayrılanlar dahil)
/// ve GraduateCount (Reason == Graduation ile kapatılmış atama) sayımı; tenant izolasyonu.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class GetAcademicSessionListCountsTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    public GetAcademicSessionListCountsTests(DatabaseFixture fixture) => _fixture = fixture;
    public async Task InitializeAsync() => await _fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task SeedArchivedSessionAsync(Guid schoolId)
    {
        await using var db = _fixture.CreateDbContext(schoolId);
        var termTypeIds = await db.AcademicTermTypes.AsNoTracking()
            .OrderBy(t => t.DisplayOrder).Take(2).Select(t => t.Id).ToListAsync();
        var gradeLevelId = await db.GradeLevels.AsNoTracking()
            .OrderBy(g => g.DisplayOrder).Select(g => g.Id).FirstAsync();

        var session = AcademicSession.Create(
            schoolId, "2024-2025",
            new DateOnly(2024, 9, 15), new DateOnly(2025, 6, 13),
            termTypeIds[0], new DateOnly(2024, 9, 15), new DateOnly(2025, 1, 23),
            termTypeIds[1], new DateOnly(2025, 2, 10), new DateOnly(2025, 6, 13));
        session.Activate(DateTimeOffset.UtcNow, previousSessionId: null);
        db.AcademicSessions.Add(session);

        var room = ClassRoom.Create(schoolId, session.Id, gradeLevelId, "12", "A", 30, requireApproval: false);
        var now = DateTimeOffset.UtcNow;
        room.AssignStudent(Guid.NewGuid(), now, AssignmentReason.Initial, null);  // aktif kalan
        var grad1 = Guid.NewGuid();
        var grad2 = Guid.NewGuid();
        room.AssignStudent(grad1, now, AssignmentReason.Initial, null);
        room.AssignStudent(grad2, now, AssignmentReason.Initial, null);
        room.RemoveStudent(grad1, now, AssignmentReason.Graduation, null);        // mezun
        room.RemoveStudent(grad2, now, AssignmentReason.Graduation, null);        // mezun
        db.ClassRooms.Add(room);

        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task List_ReportsStudentAndGraduateCountsAsync()
    {
        var schoolId = Guid.NewGuid();
        await SeedArchivedSessionAsync(schoolId);

        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new GetAcademicSessionListQueryHandler(db);

        var result = await handler.Handle(new GetAcademicSessionListQuery(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        var dto = result.Value!.Single(s => s.Name == "2024-2025");
        dto.StudentCount.Should().Be(3);    // 1 aktif + 2 mezun (distinct)
        dto.GraduateCount.Should().Be(2);
    }

    [Fact]
    public async Task List_CountsAreTenantIsolatedAsync()
    {
        var schoolA = Guid.NewGuid();
        var schoolB = Guid.NewGuid();
        await SeedArchivedSessionAsync(schoolA);
        await SeedArchivedSessionAsync(schoolB);

        await using var db = _fixture.CreateDbContext(schoolA);
        var handler = new GetAcademicSessionListQueryHandler(db);

        var result = await handler.Handle(new GetAcademicSessionListQuery(), CancellationToken.None);

        result.Value!.Single(s => s.Name == "2024-2025").StudentCount.Should().Be(3);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAcademicSessionListCountsTests"`
Expected: BUILD FAILURE — `AcademicSessionDto` `StudentCount`/`GraduateCount` üyesi yok.

- [ ] **Step 3: Add fields to `AcademicSessionDto`**

```csharp
public sealed record AcademicSessionDto(
    Guid Id,
    string Name,
    DateOnly StartDate,
    DateOnly EndDate,
    string Status,
    bool IsCurrent,
    DateTimeOffset? ActivatedAt,
    DateTimeOffset? ArchivedAt,
    int StudentCount,
    int GraduateCount);
```

- [ ] **Step 4: Compute counts in `GetAcademicSessionListQueryHandler`**

Handler gövdesini, sezon başına sayımları tek sorguda çekecek şekilde değiştir (`Adapt` artık DTO'yu tam dolduramaz çünkü sayımlar entity'de yok — `with` ile zenginleştir):

```csharp
    public async Task<Result<AcademicSessionDto[]>> Handle(
        GetAcademicSessionListQuery request,
        CancellationToken cancellationToken)
    {
        var sessions = await db.AcademicSessions
            .AsNoTracking()
            .OrderByDescending(s => s.StartDate)
            .ToListAsync(cancellationToken);

        // Sezon başına öğrenci/mezun sayıları (tek sorgu, in-memory grupla).
        var enrollments = await db.ClassRooms
            .AsNoTracking()
            .SelectMany(c => c.Students.Select(cs => new
            {
                c.AcademicSessionId,
                cs.StudentId,
                cs.LeftAt,
                cs.Reason,
            }))
            .ToListAsync(cancellationToken);

        var bySession = enrollments
            .GroupBy(e => e.AcademicSessionId)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    StudentCount = g.Select(e => e.StudentId).Distinct().Count(),
                    GraduateCount = g.Count(e => e.LeftAt != null && e.Reason == AssignmentReason.Graduation),
                });

        var dtos = sessions
            .Select(s =>
            {
                var dto = s.Adapt<AcademicSessionDto>();
                if (bySession.TryGetValue(s.Id, out var counts))
                {
                    dto = dto with { StudentCount = counts.StudentCount, GraduateCount = counts.GraduateCount };
                }
                return dto;
            })
            .ToArray();

        return Result<AcademicSessionDto[]>.Success(dtos);
    }
```

`AssignmentReason` enum'ı için using ekle: `using Oksis.Domain.Modules.AcademicSessions.Enums;`

- [ ] **Step 5: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAcademicSessionListCountsTests"`
Expected: PASS (2 test).

- [ ] **Step 6: Run full session query suite (regression)**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AcademicSession"`
Expected: PASS (yeni + mevcut `GetCurrentSessionQueryHandlerTests` dahil).

- [ ] **Step 7: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: AcademicSessionDto'ya sezon öğrenci ve mezun sayıları (StudentCount, GraduateCount) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Frontend — TS DTO tiplerini senkronla

**Files:**
- Modify: `oksis-web/src/portals/admin/academic-sessions/types/index.ts`

- [ ] **Step 1: Update `AcademicSessionDto`**

`AcademicSessionDto` interface'ine iki alan ekle:

```typescript
export interface AcademicSessionDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicSessionStatus;
  isCurrent: boolean;
  activatedAt: string | null;
  archivedAt: string | null;
  studentCount: number;
  graduateCount: number;
}
```

- [ ] **Step 2: Update `CurrentSessionDto`**

`CurrentSessionDto` interface'ine bir alan ekle:

```typescript
export interface CurrentSessionDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicSessionStatus;
  isCurrent: boolean;
  currentTerm: AcademicTermDto | null;
  terms: AcademicTermDto[];
  activeStudentCount: number;
}
```

- [ ] **Step 3: Verify typecheck**

Run: `cd oksis-web && npx tsc --noEmit`
Expected: Hata YOK (mevcut testlerdeki mock'lar opsiyonel alanlarla derlenmeye devam eder; gerekirse Task 11/12 testlerinde güncellenir).

- [ ] **Step 4: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat: Sezon DTO tiplerine öğrenci/mezun sayım alanları eklendi (frontend sync).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Frontend — i18n anahtarları (`list.*`, `dialogs.*`)

**Files:**
- Modify: `oksis-web/src/shared/i18n/locales/tr/academic-sessions.json`
- Modify: `oksis-web/src/shared/i18n/locales/en/academic-sessions.json`

- [ ] **Step 1: Add `list` ve `dialogs` blokları (TR)**

`tr/academic-sessions.json` içinde `academic-sessions` objesine, mevcut `wizard` bloğunun yanına ekle (sondaki `}` öncesi, virgül dengesine dikkat):

```json
    "list": {
      "title": "Sezon Yönetimi",
      "subtitle": "Aktif sezonu yönetin, taslakları sürdürün ve geçmiş sezonları görüntüleyin.",
      "breadcrumb-root": "Yönetim",
      "breadcrumb-current": "Sezon Yönetimi",
      "academic-calendar": "Akademik Takvim",
      "new-season": "Yeni Sezon Aç",
      "active-section": "Aktif Sezon",
      "draft-section": "Taslak Sezonlar",
      "archive-section": "Arşiv Sezonlar",
      "active-tag": "Aktif Sezon",
      "stat-current-term": "Aktif dönem",
      "stat-active-students": "Aktif öğrenci",
      "stat-days-left": "Dönem bitişine",
      "stat-days-unit": "{{count}} gün",
      "term-progress": "{{term}} ilerlemesi",
      "go-to-calendar": "Akademik Takvime Git",
      "no-active-title": "Aktif sezon yok",
      "no-active-body": "Henüz aktif bir sezon yok. Yeni bir sezon açıp aktive ederek başlayın.",
      "draft-badge": "Taslak",
      "draft-meta": "Adım {{step}} / {{total}} · {{label}} · kaynak {{source}}",
      "draft-delete": "Sil",
      "draft-continue": "Taslağa Devam Et",
      "draft-empty-title": "Taslak sezon yok",
      "draft-empty-body": "Yeni bir sezon açmaya başladığınızda taslağınız burada görünür ve kaldığınız yerden devam edebilirsiniz.",
      "archive-badge": "Arşiv",
      "archive-students": "{{count}} öğrenci",
      "archive-graduates": "{{count}} mezun",
      "archive-readonly": "Salt-okunur",
      "archive-view": "Görüntüle",
      "archive-empty": "Arşivlenmiş sezon yok."
    },
    "dialogs": {
      "discard-title": "Mevcut taslağınız kaybolacak",
      "discard-sub": "Devam etmeden önce ne yapmak istediğinizi seçin.",
      "discard-body": "Yeni bir sezon açarsanız mevcut taslağınızdaki seçimler kalıcı olarak silinecek. Aktif sezon bundan etkilenmez.",
      "discard-cancel": "Vazgeç",
      "discard-continue": "Taslağa Devam Et",
      "discard-confirm": "Sil ve Yeni Aç",
      "delete-title": "Taslağı sil",
      "delete-sub": "Bu işlem geri alınamaz.",
      "delete-body": "Taslak sezon ve içindeki tüm seçimler kalıcı olarak silinecek. Aktif sezon bundan etkilenmez.",
      "delete-cancel": "Vazgeç",
      "delete-confirm": "Taslağı Sil",
      "delete-error": "Taslak silinemedi.",
      "draft-mini-step": "Adım {{step}} / {{total}}"
    }
```

- [ ] **Step 2: Add the same blocks (EN)**

`en/academic-sessions.json` içine eşleşen İngilizce karşılıklarla ekle:

```json
    "list": {
      "title": "Season Management",
      "subtitle": "Manage the active season, resume drafts, and view past seasons.",
      "breadcrumb-root": "Administration",
      "breadcrumb-current": "Season Management",
      "academic-calendar": "Academic Calendar",
      "new-season": "Start New Season",
      "active-section": "Active Season",
      "draft-section": "Draft Seasons",
      "archive-section": "Archived Seasons",
      "active-tag": "Active Season",
      "stat-current-term": "Active term",
      "stat-active-students": "Active students",
      "stat-days-left": "To term end",
      "stat-days-unit": "{{count}} days",
      "term-progress": "{{term}} progress",
      "go-to-calendar": "Go to Academic Calendar",
      "no-active-title": "No active season",
      "no-active-body": "There is no active season yet. Start by opening and activating a new season.",
      "draft-badge": "Draft",
      "draft-meta": "Step {{step}} / {{total}} · {{label}} · source {{source}}",
      "draft-delete": "Delete",
      "draft-continue": "Resume Draft",
      "draft-empty-title": "No draft season",
      "draft-empty-body": "When you start opening a new season, your draft appears here so you can resume where you left off.",
      "archive-badge": "Archived",
      "archive-students": "{{count}} students",
      "archive-graduates": "{{count}} graduates",
      "archive-readonly": "Read-only",
      "archive-view": "View",
      "archive-empty": "No archived seasons."
    },
    "dialogs": {
      "discard-title": "Your current draft will be lost",
      "discard-sub": "Choose what you want to do before continuing.",
      "discard-body": "If you open a new season, the selections in your current draft will be permanently deleted. The active season is unaffected.",
      "discard-cancel": "Cancel",
      "discard-continue": "Resume Draft",
      "discard-confirm": "Delete and Open New",
      "delete-title": "Delete draft",
      "delete-sub": "This action cannot be undone.",
      "delete-body": "The draft season and all its selections will be permanently deleted. The active season is unaffected.",
      "delete-cancel": "Cancel",
      "delete-confirm": "Delete Draft",
      "delete-error": "Could not delete the draft.",
      "draft-mini-step": "Step {{step}} / {{total}}"
    }
```

- [ ] **Step 3: Verify JSON validity**

Run: `cd oksis-web && node -e "require('./src/shared/i18n/locales/tr/academic-sessions.json');require('./src/shared/i18n/locales/en/academic-sessions.json');console.log('ok')"`
Expected: `ok` (geçersiz JSON yoksa).

- [ ] **Step 4: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat: Sezon Listesi ve taslak modalları için i18n anahtarları (list, dialogs) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Frontend — `useSeasonListData` türetme hook'u

Aktif sezon, taslak ve arşivi tek yerden derler; ilerleme % ve kalan günü hesaplar. Saf hesaplama fonksiyonlarını ayrı export ederek test edilebilir tutar.

**Files:**
- Create: `oksis-web/src/portals/admin/academic-sessions/hooks/useSeasonListData.ts`
- Test: `oksis-web/src/portals/admin/academic-sessions/hooks/__tests__/useSeasonListData.test.ts`

- [ ] **Step 1: Write the failing test**

Create `hooks/__tests__/useSeasonListData.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { computeTermProgress, computeDaysLeft } from '../useSeasonListData';

describe('computeTermProgress', () => {
  it('returns 0 before the term starts', () => {
    expect(computeTermProgress('2099-01-01', '2099-06-01', new Date('2098-12-01'))).toBe(0);
  });
  it('returns 100 after the term ends', () => {
    expect(computeTermProgress('2020-01-01', '2020-06-01', new Date('2021-01-01'))).toBe(100);
  });
  it('returns a clamped midpoint percentage', () => {
    const pct = computeTermProgress('2025-01-01', '2025-01-11', new Date('2025-01-06'));
    expect(pct).toBe(50);
  });
  it('returns null when dates are missing', () => {
    expect(computeTermProgress(undefined, '2025-01-01', new Date())).toBeNull();
  });
});

describe('computeDaysLeft', () => {
  it('counts whole days until the date', () => {
    expect(computeDaysLeft('2025-01-20', new Date('2025-01-10'))).toBe(10);
  });
  it('returns null for missing date', () => {
    expect(computeDaysLeft(null, new Date())).toBeNull();
  });
  it('can be negative when the date has passed', () => {
    expect(computeDaysLeft('2025-01-01', new Date('2025-01-05'))).toBe(-4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/hooks/__tests__/useSeasonListData.test.ts`
Expected: FAIL — `computeTermProgress`/`computeDaysLeft` export edilmemiş.

- [ ] **Step 3: Implement the hook + pure helpers**

Create `hooks/useSeasonListData.ts`:

```typescript
import dayjs from 'dayjs';
import { useAcademicSessionsQuery, useCurrentSessionQuery } from './useAcademicSessionsQuery';
import { useSeasonDraftQuery } from './useSeasonWizard';
import type { AcademicSessionDto, CurrentSessionDto, SeasonDraftDto } from '../types';

/** Dönem ilerleme yüzdesi (0–100), tarih dışında null. */
export function computeTermProgress(
  start: string | undefined | null,
  end: string | undefined | null,
  now: Date = new Date(),
): number | null {
  if (!start || !end) return null;
  const startMs = dayjs(start).valueOf();
  const endMs = dayjs(end).valueOf();
  if (endMs <= startMs) return null;
  const ratio = (now.getTime() - startMs) / (endMs - startMs);
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100);
}

/** Verilen tarihe kalan tam gün; tarih yoksa null (geçmişte negatif olabilir). */
export function computeDaysLeft(date: string | undefined | null, now: Date = new Date()): number | null {
  if (!date) return null;
  return dayjs(date).startOf('day').diff(dayjs(now).startOf('day'), 'day');
}

export interface SeasonListData {
  active: CurrentSessionDto | null;
  termProgress: number | null;
  daysLeft: number | null;
  draft: SeasonDraftDto | null;
  archived: AcademicSessionDto[];
  isLoading: boolean;
}

export function useSeasonListData(): SeasonListData {
  const currentQuery = useCurrentSessionQuery();
  const sessionsQuery = useAcademicSessionsQuery();
  const draftQuery = useSeasonDraftQuery();

  const active = currentQuery.data ?? null;
  const term = active?.currentTerm ?? null;

  return {
    active,
    termProgress: computeTermProgress(term?.startDate, term?.endDate),
    daysLeft: computeDaysLeft(term?.endDate ?? active?.endDate),
    draft: draftQuery.data ?? null,
    archived: (sessionsQuery.data ?? []).filter((s) => s.status === 'Archived'),
    isLoading: currentQuery.isLoading || sessionsQuery.isLoading || draftQuery.isLoading,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/hooks/__tests__/useSeasonListData.test.ts`
Expected: PASS (7 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: Sezon Listesi türetme hook'u (useSeasonListData) ve ilerleme/kalan gün hesaplayıcıları eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Frontend — `ActiveSeasonHero` component

Aktif sezon hero kartı (bölüm A). Brand-gradient sol panel + 3 stat + ilerleme bar + takvim linki. Aktif sezon yoksa boş durum gösterir.

**Files:**
- Create: `oksis-web/src/portals/admin/academic-sessions/components/list/ActiveSeasonHero.tsx`
- Test: `oksis-web/src/portals/admin/academic-sessions/components/list/__tests__/ActiveSeasonHero.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/list/__tests__/ActiveSeasonHero.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../../../../shared/i18n';
import { ActiveSeasonHero } from '../ActiveSeasonHero';
import type { CurrentSessionDto } from '../../../types';

const active: CurrentSessionDto = {
  id: 's1', name: '2025–2026', startDate: '2025-09-01', endDate: '2026-06-30',
  status: 'Active', isCurrent: true,
  currentTerm: { id: 't2', academicSessionId: 's1', termTypeId: 'tt2', startDate: '2026-02-08', endDate: '2026-06-25', status: 'Active', closedAt: null },
  terms: [], activeStudentCount: 1248,
};

describe('ActiveSeasonHero', () => {
  it('renders the season name and active student count', () => {
    render(<ActiveSeasonHero active={active} termProgress={78} daysLeft={18} onGoToCalendar={vi.fn()} />);
    expect(screen.getByText('2025–2026')).toBeInTheDocument();
    expect(screen.getByText('1248')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('calls onGoToCalendar when the calendar button is clicked', async () => {
    const onGo = vi.fn();
    render(<ActiveSeasonHero active={active} termProgress={78} daysLeft={18} onGoToCalendar={onGo} />);
    screen.getByRole('button', { name: /Akademik Takvime Git/i }).click();
    expect(onGo).toHaveBeenCalledOnce();
  });

  it('shows an empty state when there is no active season', () => {
    render(<ActiveSeasonHero active={null} termProgress={null} daysLeft={null} onGoToCalendar={vi.fn()} />);
    expect(screen.getByText(/Aktif sezon yok/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/ActiveSeasonHero.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: Implement the component**

Create `components/list/ActiveSeasonHero.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { CalendarRange } from 'lucide-react';
import type { CurrentSessionDto } from '../../types';

interface ActiveSeasonHeroProps {
  active: CurrentSessionDto | null;
  termProgress: number | null;
  daysLeft: number | null;
  onGoToCalendar: () => void;
}

export function ActiveSeasonHero({ active, termProgress, daysLeft, onGoToCalendar }: ActiveSeasonHeroProps) {
  const { t } = useTranslation('academic-sessions');

  if (!active) {
    return (
      <div className="rounded-[14px] border border-dashed border-[#E6E9F2] bg-white p-8 text-center">
        <div className="text-base font-extrabold text-gray-900">{t('list.no-active-title')}</div>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{t('list.no-active-body')}</p>
      </div>
    );
  }

  const range = `${dayjs(active.startDate).format('MMM YYYY')} – ${dayjs(active.endDate).format('MMM YYYY')}`;
  const termName = active.currentTerm
    ? t('detail.term-index', { index: active.terms.findIndex((x) => x.id === active.currentTerm!.id) + 1 || 1 })
    : t('card.no-active-term');

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-[14px] border border-[#E6E9F2] bg-white shadow-sm md:grid-cols-[270px_1fr]">
      <div className="flex flex-col justify-center gap-2 bg-[linear-gradient(135deg,#1B2B5E_0%,#4F6BFF_100%)] p-6 text-white">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_2px_rgba(110,231,183,0.7)]" />
          {t('list.active-tag')}
        </span>
        <div className="text-[32px] font-extrabold leading-none">{active.name}</div>
        <div className="text-sm text-white/80">{range}</div>
      </div>

      <div className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-3 gap-3">
          <Stat value={termName} label={t('list.stat-current-term')} />
          <Stat value={String(active.activeStudentCount)} label={t('list.stat-active-students')} />
          <Stat
            value={daysLeft !== null ? t('list.stat-days-unit', { count: daysLeft }) : '—'}
            label={t('list.stat-days-left')}
          />
        </div>

        {termProgress !== null && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-bold text-gray-600">
              <span>{t('list.term-progress', { term: termName })}</span>
              <span>{termProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EEF1FA]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#1B2B5E_0%,#4F6BFF_100%)]"
                style={{ width: `${termProgress}%` }}
              />
            </div>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={onGoToCalendar}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E6E9F2] px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <CalendarRange size={16} /> {t('list.go-to-calendar')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[11px] bg-[#F4F6FB] p-3">
      <div className="text-xl font-extrabold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
```

NOT: İlerleme bar'ında dinamik genişlik için `style={{ width }}` kullanımı kaçınılmaz (Tailwind arbitrary değer runtime'da üretilemez); inline-style yasağının kabul edilen istisnası — yalnızca hesaplanmış yüzde için.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/ActiveSeasonHero.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: ActiveSeasonHero component (aktif sezon hero kartı + boş durum) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Frontend — `DraftSeasonCard` component

Taslak varsa info-tint kart (devam/sil aksiyonları), yoksa dashed boş durum.

**Files:**
- Create: `oksis-web/src/portals/admin/academic-sessions/components/list/DraftSeasonCard.tsx`
- Test: `oksis-web/src/portals/admin/academic-sessions/components/list/__tests__/DraftSeasonCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/list/__tests__/DraftSeasonCard.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../../../../shared/i18n';
import { DraftSeasonCard } from '../DraftSeasonCard';
import type { SeasonDraftDto } from '../../types';

const draft: SeasonDraftDto = {
  id: 'd1', name: '2026–2027', sourceSessionId: 's1', currentStep: 2,
  copyTerms: true, copyBranches: true, copyHolidays: true, copyAssignments: true, copySchedule: true,
  excludePassiveStudents: true, termDatesJson: null, branchMapJson: null, holidaysJson: null,
};

describe('DraftSeasonCard', () => {
  it('renders draft name and continue/delete actions', () => {
    render(<DraftSeasonCard draft={draft} onContinue={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText('2026–2027')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Taslağa Devam Et/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sil$/i })).toBeInTheDocument();
  });

  it('fires callbacks', () => {
    const onContinue = vi.fn();
    const onDelete = vi.fn();
    render(<DraftSeasonCard draft={draft} onContinue={onContinue} onDelete={onDelete} />);
    screen.getByRole('button', { name: /Taslağa Devam Et/i }).click();
    screen.getByRole('button', { name: /^Sil$/i }).click();
    expect(onContinue).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('renders empty state when there is no draft', () => {
    render(<DraftSeasonCard draft={null} onContinue={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/Taslak sezon yok/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/DraftSeasonCard.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: Implement the component**

Create `components/list/DraftSeasonCard.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Pencil, Play, Trash2 } from 'lucide-react';
import { WIZARD_STEP_KEYS, WIZARD_STEP_COUNT } from '../wizard/wizardSteps';
import type { SeasonDraftDto } from '../../types';

interface DraftSeasonCardProps {
  draft: SeasonDraftDto | null;
  onContinue: () => void;
  onDelete: () => void;
}

export function DraftSeasonCard({ draft, onContinue, onDelete }: DraftSeasonCardProps) {
  const { t } = useTranslation('academic-sessions');

  if (!draft) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[14px] border border-dashed border-[#E6E9F2] bg-white p-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#EEF1FA] text-[#9AA3B2]">
          <Pencil size={18} />
        </span>
        <div className="text-base font-extrabold text-gray-900">{t('list.draft-empty-title')}</div>
        <p className="max-w-md text-sm text-gray-500">{t('list.draft-empty-body')}</p>
      </div>
    );
  }

  const stepIndex = Math.min(draft.currentStep, WIZARD_STEP_COUNT - 1);
  const stepKey = WIZARD_STEP_KEYS[stepIndex];
  const pct = Math.round(((stepIndex + 1) / WIZARD_STEP_COUNT) * 100);

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-[#C9D2F2] bg-white p-5 md:flex-row md:items-center">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#EEF1FA] text-[#4F6BFF]">
        <Pencil size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-extrabold text-gray-900">{draft.name}</span>
          <span className="rounded-full bg-[#EEF1FA] px-2 py-0.5 text-xs font-bold text-[#4F6BFF]">
            {t('list.draft-badge')}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-gray-500">
          {t('list.draft-meta', {
            step: stepIndex + 1,
            total: WIZARD_STEP_COUNT,
            label: t(`wizard.steps.${stepKey}.title`),
            source: draft.sourceSessionId ? draft.name : '—',
          })}
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EEF1FA]">
          <div className="h-full rounded-full bg-[#4F6BFF]" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-md border border-[#E6E9F2] px-3 py-2 text-sm font-semibold text-gray-600 hover:border-[#FCA5A5] hover:bg-[#FEE2E2] hover:text-[#991B1B]"
        >
          <Trash2 size={15} /> {t('list.draft-delete')}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-1 rounded-md bg-[#1B2B5E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14224A]"
        >
          <Play size={15} /> {t('list.draft-continue')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/DraftSeasonCard.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: DraftSeasonCard component (taslak kartı + boş durum) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Frontend — `ArchiveSeasonGrid` component

Arşiv sezonları responsive grid; her kart yıl + tarih + öğrenci/mezun + görüntüle linki.

**Files:**
- Create: `oksis-web/src/portals/admin/academic-sessions/components/list/ArchiveSeasonGrid.tsx`
- Test: `oksis-web/src/portals/admin/academic-sessions/components/list/__tests__/ArchiveSeasonGrid.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/list/__tests__/ArchiveSeasonGrid.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../../../../shared/i18n';
import { ArchiveSeasonGrid } from '../ArchiveSeasonGrid';
import type { AcademicSessionDto } from '../../types';

const archived: AcademicSessionDto[] = [
  { id: 'a1', name: '2024–2025', startDate: '2024-09-01', endDate: '2025-06-30', status: 'Archived', isCurrent: false, activatedAt: null, archivedAt: '2025-07-01T00:00:00Z', studentCount: 1196, graduateCount: 52 },
];

describe('ArchiveSeasonGrid', () => {
  it('renders archive cards with counts', () => {
    render(<ArchiveSeasonGrid sessions={archived} onView={vi.fn()} />);
    expect(screen.getByText('2024–2025')).toBeInTheDocument();
    expect(screen.getByText(/1196 öğrenci/i)).toBeInTheDocument();
    expect(screen.getByText(/52 mezun/i)).toBeInTheDocument();
  });

  it('calls onView with the session id', () => {
    const onView = vi.fn();
    render(<ArchiveSeasonGrid sessions={archived} onView={onView} />);
    screen.getByRole('button', { name: /Görüntüle/i }).click();
    expect(onView).toHaveBeenCalledWith('a1');
  });

  it('renders an empty message when there are no archived seasons', () => {
    render(<ArchiveSeasonGrid sessions={[]} onView={vi.fn()} />);
    expect(screen.getByText(/Arşivlenmiş sezon yok/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/ArchiveSeasonGrid.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: Implement the component**

Create `components/list/ArchiveSeasonGrid.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Calendar, GraduationCap, Award, Lock, ArrowRight } from 'lucide-react';
import type { AcademicSessionDto } from '../../types';

interface ArchiveSeasonGridProps {
  sessions: AcademicSessionDto[];
  onView: (sessionId: string) => void;
}

export function ArchiveSeasonGrid({ sessions, onView }: ArchiveSeasonGridProps) {
  const { t } = useTranslation('academic-sessions');

  if (sessions.length === 0) {
    return <p className="rounded-[14px] border border-dashed border-[#E6E9F2] bg-white p-6 text-center text-sm text-gray-500">{t('list.archive-empty')}</p>;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(248px,1fr))] gap-3">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="group flex flex-col gap-2 rounded-[14px] border border-[#E6E9F2] bg-white p-4 transition hover:-translate-y-px hover:border-[#4F6BFF]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-extrabold text-gray-900">{s.name}</span>
            <span className="rounded-full bg-[#F4F6FB] px-2 py-0.5 text-xs font-bold text-gray-500">{t('list.archive-badge')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={14} />
            {dayjs(s.startDate).format('MMM YYYY')} – {dayjs(s.endDate).format('MMM YYYY')}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1"><GraduationCap size={14} /> {t('list.archive-students', { count: s.studentCount })}</span>
            <span className="flex items-center gap-1"><Award size={14} /> {t('list.archive-graduates', { count: s.graduateCount })}</span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-[#EFF1F8] pt-2">
            <span className="flex items-center gap-1 text-xs text-gray-400"><Lock size={12} /> {t('list.archive-readonly')}</span>
            <button
              type="button"
              onClick={() => onView(s.id)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F6BFF]"
            >
              {t('list.archive-view')} <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/ArchiveSeasonGrid.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: ArchiveSeasonGrid component (arşiv sezon kartları) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Frontend — `DiscardDraftDialog` (3-aksiyonlu çakışma modalı)

**Files:**
- Create: `oksis-web/src/portals/admin/academic-sessions/components/list/DiscardDraftDialog.tsx`
- Test: `oksis-web/src/portals/admin/academic-sessions/components/list/__tests__/DiscardDraftDialog.test.tsx`

İlk olarak mevcut shadcn `Dialog` API'sini doğrula (props isimleri için):

- [ ] **Step 0: Inspect the shared Dialog**

Run: `cd oksis-web && sed -n '1,40p' src/app/components/ui/dialog.tsx`
Expected: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` export'larını gör. Aşağıdaki kod bu isimleri kullanır; farklıysa import'u uyarlayın.

- [ ] **Step 1: Write the failing test**

Create `components/list/__tests__/DiscardDraftDialog.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../../../../shared/i18n';
import { DiscardDraftDialog } from '../DiscardDraftDialog';
import type { SeasonDraftDto } from '../../types';

const draft: SeasonDraftDto = {
  id: 'd1', name: '2026–2027', sourceSessionId: 's1', currentStep: 1,
  copyTerms: true, copyBranches: true, copyHolidays: true, copyAssignments: true, copySchedule: true,
  excludePassiveStudents: true, termDatesJson: null, branchMapJson: null, holidaysJson: null,
};

describe('DiscardDraftDialog', () => {
  const setup = () => {
    const onCancel = vi.fn();
    const onContinue = vi.fn();
    const onConfirm = vi.fn();
    render(<DiscardDraftDialog open draft={draft} onCancel={onCancel} onContinue={onContinue} onConfirm={onConfirm} isDeleting={false} />);
    return { onCancel, onContinue, onConfirm };
  };

  it('shows the warning title and the three actions', () => {
    setup();
    expect(screen.getByText(/Mevcut taslağınız kaybolacak/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Vazgeç$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Taslağa Devam Et/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sil ve Yeni Aç/i })).toBeInTheDocument();
  });

  it('routes each action to its callback', () => {
    const { onCancel, onContinue, onConfirm } = setup();
    screen.getByRole('button', { name: /^Vazgeç$/i }).click();
    screen.getByRole('button', { name: /Taslağa Devam Et/i }).click();
    screen.getByRole('button', { name: /Sil ve Yeni Aç/i }).click();
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onContinue).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/DiscardDraftDialog.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: Implement the component**

Create `components/list/DiscardDraftDialog.tsx` (Step 0'da gördüğün gerçek export isimlerini kullan):

```tsx
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Play, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../../../app/components/ui/dialog';
import { WIZARD_STEP_COUNT } from '../wizard/wizardSteps';
import type { SeasonDraftDto } from '../../types';

interface DiscardDraftDialogProps {
  open: boolean;
  draft: SeasonDraftDto | null;
  isDeleting: boolean;
  onCancel: () => void;
  onContinue: () => void;
  onConfirm: () => void;
}

export function DiscardDraftDialog({ open, draft, isDeleting, onCancel, onContinue, onConfirm }: DiscardDraftDialogProps) {
  const { t } = useTranslation('academic-sessions');
  const stepIndex = draft ? Math.min(draft.currentStep, WIZARD_STEP_COUNT - 1) : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#FEF3C7] text-[#B05A0A]">
            <AlertTriangle size={20} />
          </div>
          <DialogTitle>{t('dialogs.discard-title')}</DialogTitle>
          <DialogDescription>{t('dialogs.discard-sub')}</DialogDescription>
        </DialogHeader>

        <p className="text-sm text-gray-600">{t('dialogs.discard-body')}</p>

        {draft && (
          <div className="rounded-[12px] border border-[#E6E9F2] bg-[#F4F6FB] p-3">
            <div className="text-sm font-extrabold text-gray-900">{draft.name}</div>
            <div className="text-xs text-gray-500">{t('dialogs.draft-mini-step', { step: stepIndex + 1, total: WIZARD_STEP_COUNT })}</div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <button type="button" onClick={onCancel}
            className="rounded-md border border-[#E6E9F2] px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            {t('dialogs.discard-cancel')}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onContinue}
              className="inline-flex items-center gap-1 rounded-md border border-[#E6E9F2] px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <Play size={15} /> {t('dialogs.discard-continue')}
            </button>
            <button type="button" onClick={onConfirm} disabled={isDeleting}
              className="inline-flex items-center gap-1 rounded-md bg-[#991B1B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7F1616] disabled:opacity-50">
              <Trash2 size={15} /> {t('dialogs.discard-confirm')}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/DiscardDraftDialog.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: DiscardDraftDialog (taslak çakışma modalı, 3 aksiyon) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Frontend — `DeleteDraftDialog` (2-aksiyonlu silme modalı)

**Files:**
- Create: `oksis-web/src/portals/admin/academic-sessions/components/list/DeleteDraftDialog.tsx`
- Test: `oksis-web/src/portals/admin/academic-sessions/components/list/__tests__/DeleteDraftDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/list/__tests__/DeleteDraftDialog.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '../../../../../../shared/i18n';
import { DeleteDraftDialog } from '../DeleteDraftDialog';

describe('DeleteDraftDialog', () => {
  it('shows the delete title and two actions', () => {
    render(<DeleteDraftDialog open isDeleting={false} onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText(/Taslağı sil/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Vazgeç$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Taslağı Sil/i })).toBeInTheDocument();
  });

  it('fires the confirm callback', () => {
    const onConfirm = vi.fn();
    render(<DeleteDraftDialog open isDeleting={false} onCancel={vi.fn()} onConfirm={onConfirm} />);
    screen.getByRole('button', { name: /Taslağı Sil/i }).click();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/DeleteDraftDialog.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: Implement the component**

Create `components/list/DeleteDraftDialog.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../../../../app/components/ui/dialog';

interface DeleteDraftDialogProps {
  open: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteDraftDialog({ open, isDeleting, onCancel, onConfirm }: DeleteDraftDialogProps) {
  const { t } = useTranslation('academic-sessions');
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#FEE2E2] text-[#991B1B]">
            <Trash2 size={20} />
          </div>
          <DialogTitle>{t('dialogs.delete-title')}</DialogTitle>
          <DialogDescription>{t('dialogs.delete-sub')}</DialogDescription>
        </DialogHeader>

        <p className="text-sm text-gray-600">{t('dialogs.delete-body')}</p>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel}
            className="rounded-md border border-[#E6E9F2] px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            {t('dialogs.delete-cancel')}
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting}
            className="inline-flex items-center gap-1 rounded-md bg-[#991B1B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7F1616] disabled:opacity-50">
            <Trash2 size={15} /> {t('dialogs.delete-confirm')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/list/__tests__/DeleteDraftDialog.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: DeleteDraftDialog (taslak silme modalı) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Frontend — `SeasonListPage` (landing + modal orkestrasyonu)

Tüm parçaları birleştirir; "Yeni Sezon Aç" taslak varsa modal, yoksa direkt navigate; sil akışı.

**Files:**
- Create: `oksis-web/src/portals/admin/academic-sessions/pages/SeasonListPage.tsx`
- Test: `oksis-web/src/portals/admin/academic-sessions/pages/__tests__/SeasonListPage.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `pages/__tests__/SeasonListPage.test.tsx` (mevcut `SeasonWizardPage.test.tsx`'in MSW/store kalıbını izler):

```tsx
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { Toaster } from 'sonner';
import '../../../../../shared/i18n';
import { server } from '../../../../../test/mswServer';
import { useAuthStore } from '../../../../../shared/store/authStore';
import { UserRole } from '../../../../../modules/identity/types/user.types';
import { ADMIN_PERMISSIONS } from '../../../../../test/authFixtures';
import { SeasonListPage } from '../SeasonListPage';

const mockNavigate = vi.fn();
vi.mock('react-router', async (orig) => ({
  ...(await orig<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}));

const activeSession = {
  id: 's1', name: '2025-2026', startDate: '2025-09-01', endDate: '2026-06-30',
  status: 'Active', isCurrent: true, currentTerm: null, terms: [], activeStudentCount: 1248,
};

const draft = {
  id: 'd1', name: '2026-2027', sourceSessionId: 's1', currentStep: 2,
  copyTerms: true, copyBranches: true, copyHolidays: true, copyAssignments: true, copySchedule: true,
  excludePassiveStudents: true, termDatesJson: null, branchMapJson: null, holidaysJson: null,
};

function seedHandlers(draftBody: unknown) {
  server.use(
    http.get('*/academic-sessions/current', () => HttpResponse.json({ data: activeSession })),
    http.get('*/academic-sessions', () => HttpResponse.json({ data: [
      { id: 'a1', name: '2024-2025', startDate: '2024-09-01', endDate: '2025-06-30', status: 'Archived', isCurrent: false, activatedAt: null, archivedAt: '2025-07-01T00:00:00Z', studentCount: 1196, graduateCount: 52 },
    ] })),
    http.get('*/season-drafts/current', () => HttpResponse.json({ data: draftBody })),
    http.delete('*/season-drafts/current', () => new HttpResponse(null, { status: 204 })),
  );
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <Toaster />
        <SeasonListPage />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('SeasonListPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    useAuthStore.setState({
      user: { id: 'u1', schoolId: 'school-1', firstName: 'T', lastName: 'U', email: 'a@b.c',
        role: UserRole.SchoolAdmin, firstLoginRequired: false, permissions: ADMIN_PERMISSIONS },
      accessToken: 'jwt', firstLoginRequired: false,
    });
  });

  it('renders active hero, draft card and archive grid', async () => {
    seedHandlers(draft);
    renderPage();
    expect(await screen.findByText('2025-2026')).toBeInTheDocument();
    expect(await screen.findByText('2026-2027')).toBeInTheDocument();
    expect(await screen.findByText('2024-2025')).toBeInTheDocument();
  });

  it('opens the discard modal when a draft exists and "Yeni Sezon Aç" is clicked', async () => {
    seedHandlers(draft);
    renderPage();
    (await screen.findByRole('button', { name: /Yeni Sezon Aç/i })).click();
    expect(await screen.findByText(/Mevcut taslağınız kaybolacak/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates straight to the wizard when no draft exists', async () => {
    seedHandlers(null);
    renderPage();
    (await screen.findByRole('button', { name: /Yeni Sezon Aç/i })).click();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('new'));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/pages/__tests__/SeasonListPage.test.tsx`
Expected: FAIL — modül yok.

- [ ] **Step 3: Implement the page**

Create `pages/SeasonListPage.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { ChevronRight, Plus, CalendarRange, Star, Pencil, Archive } from 'lucide-react';
import { useSeasonListData } from '../hooks/useSeasonListData';
import { useDeleteSeasonDraftMutation } from '../hooks/useSeasonWizard';
import { ActiveSeasonHero } from '../components/list/ActiveSeasonHero';
import { DraftSeasonCard } from '../components/list/DraftSeasonCard';
import { ArchiveSeasonGrid } from '../components/list/ArchiveSeasonGrid';
import { DiscardDraftDialog } from '../components/list/DiscardDraftDialog';
import { DeleteDraftDialog } from '../components/list/DeleteDraftDialog';

type ModalKind = 'discard' | 'delete' | null;

export function SeasonListPage() {
  const { t } = useTranslation('academic-sessions');
  const navigate = useNavigate();
  const { active, termProgress, daysLeft, draft, archived } = useSeasonListData();
  const deleteDraft = useDeleteSeasonDraftMutation();
  const [modal, setModal] = useState<ModalKind>(null);

  const handleNewSeason = () => {
    if (draft) setModal('discard');
    else navigate('new');
  };

  const handleDiscardConfirm = async () => {
    try {
      await deleteDraft.mutateAsync();
      setModal(null);
      navigate('new');
    } catch {
      toast.error(t('dialogs.delete-error'));
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDraft.mutateAsync();
      setModal(null);
    } catch {
      toast.error(t('dialogs.delete-error'));
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <nav className="flex items-center gap-1 text-xs text-gray-400">
            <span>{t('list.breadcrumb-root')}</span>
            <ChevronRight size={13} />
            <span className="text-gray-600">{t('list.breadcrumb-current')}</span>
          </nav>
          <h1 className="mt-1 text-2xl font-extrabold text-gray-900">{t('list.title')}</h1>
          <p className="text-sm text-gray-500">{t('list.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/admin/academic-calendar')}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E6E9F2] px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <CalendarRange size={16} /> {t('list.academic-calendar')}
          </button>
          <button type="button" onClick={handleNewSeason}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1B2B5E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14224A]">
            <Plus size={16} /> {t('list.new-season')}
          </button>
        </div>
      </div>

      <section className="space-y-3">
        <SectionHead icon={<Star size={16} />} title={t('list.active-section')} count={active ? 1 : 0} />
        <ActiveSeasonHero active={active} termProgress={termProgress} daysLeft={daysLeft}
          onGoToCalendar={() => navigate('/admin/academic-calendar')} />
      </section>

      <section className="space-y-3">
        <SectionHead icon={<Pencil size={16} />} title={t('list.draft-section')} count={draft ? 1 : 0} />
        <DraftSeasonCard draft={draft} onContinue={() => navigate('new')} onDelete={() => setModal('delete')} />
      </section>

      <section className="space-y-3">
        <SectionHead icon={<Archive size={16} />} title={t('list.archive-section')} count={archived.length} />
        <ArchiveSeasonGrid sessions={archived} onView={(id) => navigate(`/admin/academic-sessions?view=${id}`)} />
      </section>

      <DiscardDraftDialog
        open={modal === 'discard'} draft={draft} isDeleting={deleteDraft.isPending}
        onCancel={() => setModal(null)}
        onContinue={() => { setModal(null); navigate('new'); }}
        onConfirm={handleDiscardConfirm}
      />
      <DeleteDraftDialog
        open={modal === 'delete'} isDeleting={deleteDraft.isPending}
        onCancel={() => setModal(null)} onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

function SectionHead({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#1B2B5E]">{icon}</span>
      <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
      <span className="rounded-full bg-[#F4F6FB] px-2 py-0.5 text-xs font-bold text-gray-500">{count}</span>
    </div>
  );
}
```

NOT: Arşiv "Görüntüle" şimdilik liste route'una `?view=` query'si ile gider; arşiv salt-okunur detay ekranı bu işin kapsamı dışında (ileride). Bağlantı kırık değildir — liste sayfası query'i yok sayar.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/pages/__tests__/SeasonListPage.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: SeasonListPage (landing) — aktif/taslak/arşiv bölümleri + taslak modalları orkestrasyonu eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Frontend — Route ayrımı + index export + sihirbaz geri-dönüş hedefi

**Files:**
- Modify: `oksis-web/src/portals/admin/academic-sessions/index.ts`
- Modify: `oksis-web/src/app/routes.tsx`
- Modify: `oksis-web/src/portals/admin/academic-sessions/pages/SeasonWizardPage.tsx`

- [ ] **Step 1: Export `SeasonListPage` from the module index**

`index.ts`'in ilk satırını şu iki satırla değiştir:

```typescript
export { SeasonListPage } from './pages/SeasonListPage';
export { SeasonWizardPage } from './pages/SeasonWizardPage';
```

- [ ] **Step 2: Update the route import + children**

`src/app/routes.tsx:72` import satırını güncelle:

```tsx
import { SeasonListPage, SeasonWizardPage } from "../portals/admin/academic-sessions";
```

`src/app/routes.tsx:228-233` `academic-sessions` route'unun `children`'ını değiştir:

```tsx
            children: [
              { index: true, Component: SeasonListPage },
              { path: "new", Component: SeasonWizardPage },
            ],
```

- [ ] **Step 3: Point wizard "back" actions to the list route**

`SeasonWizardPage.tsx` içinde iki yeri güncelle:

`navigate('/admin')` çağrısını (header'daki "back-to-panel" butonu):
```tsx
            <button type="button" onClick={() => navigate('/admin/academic-sessions')}
```

`WizSuccessScreen` `onDone` halen state reset ediyor; bunun yerine listeye dön:
```tsx
        <WizSuccessScreen
          seasonName={methods.getValues('name')}
          onGoToCalendar={() => navigate('/admin/academic-calendar')}
          onDone={() => navigate('/admin/academic-sessions')}
        />
```

- [ ] **Step 4: Update existing wizard test expectations if needed**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/pages/__tests__/SeasonWizardPage.test.tsx`
Eğer test `navigate('/admin')` veya success `onDone` davranışına bağlıysa, yeni hedeflere (`/admin/academic-sessions`, `/admin/academic-calendar`) göre güncelle. Aksi halde değişiklik gerekmez.
Expected: PASS.

- [ ] **Step 5: Typecheck + targeted test sweep**

Run: `cd oksis-web && npx tsc --noEmit && npm run test -- src/portals/admin/academic-sessions`
Expected: Tüm academic-sessions testleri PASS, tip hatası yok.

- [ ] **Step 6: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat: Sezon Yönetimi route ayrımı — index=Sezon Listesi, /new=sihirbaz; sihirbaz geri-dönüşleri listeye yönlendirildi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Dokümantasyon güncellemesi

**Files (workspace `oksis/` repo):**
- Modify: `.claude/docs/modules/academic-years/ui-flows.md`
- Modify: `.claude/docs/modules/academic-years/api-contracts.md`
- Modify: `.claude/docs/modules/academic-years/completion_status.md`

- [ ] **Step 1: ui-flows.md — liste→sihirbaz akışı**

`ui-flows.md`'e yeni bir bölüm ekle: "Sezon Listesi (landing)" — üç bölüm (Aktif hero / Taslak / Arşiv), "Yeni Sezon Aç" davranışı (taslak varsa DiscardDraftDialog 3 aksiyon, yoksa direkt `/new`), taslak "Sil" → DeleteDraftDialog, route ayrımı (`index`=liste, `/new`=sihirbaz). Mevcut sihirbaz akışı korunur, yalnızca giriş noktası listeye taşındı.

- [ ] **Step 2: api-contracts.md — yeni DTO alanları**

`GET /academic-sessions` ve `GET /academic-sessions/current` yanıt şemalarına ekle:
- `current` → `activeStudentCount: int` (aktif sezonda LeftAt==null distinct öğrenci).
- list → `studentCount: int` (sezona kayıtlı distinct öğrenci), `graduateCount: int` (Reason==Graduation kapatılmış atama).

- [ ] **Step 3: completion_status.md — ilerleme**

`Güncel` tarihini `2026-06-09` yap; "Sezon Listesi landing ekranı + route ayrımı + taslak modalları + sayım alanları (backend)" satırını ✅ bölümüne taşı/ekle. İlerleme çubuğunu güncelle.

- [ ] **Step 4: Commit (workspace repo)**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs/modules/academic-years && git commit -m "$(cat <<'EOF'
2026-06-09 docs: Sezon Listesi ekranı — ui-flows, api-contracts (sayım alanları) ve completion_status güncellendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

- [ ] Backend tüm sezon testleri: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AcademicSession"` → PASS.
- [ ] Frontend modül testleri: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions` → PASS.
- [ ] Frontend typecheck: `cd oksis-web && npx tsc --noEmit` → temiz.
- [ ] Manuel doğrulama: `/admin/academic-sessions` artık liste açar; "Yeni Sezon Aç" (taslak varken) modal, (taslak yokken) `/new` sihirbaz; sihirbaz "geri" listeye döner.
