# Öğrenci Kayıt — Faz 3A (Yenileme Niyeti Toplama) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aktif sezondaki öğrenciler için veli yenileme niyetini (Renewing/Undecided/Leaving) toplayan BE query+komut+REST ve `reenroll.jsx` birebir portu FE ekranını canlıya almak.

**Architecture:** Vertical slice CQRS. Yeni `ListRenewalCandidatesQuery` (cari sezon `Active` enrollment'lar + KPI dağılımı) ve `BulkSetRenewalIntentCommand` (mevcut `StudentEnrollment.SetRenewalIntent` entity metodunu sarar) yazılır; iki REST ucu yeni `EnrollmentsController`'da açılır. FE'de handoff `reenroll.jsx` tam-sayfa ekran olarak (sheet/sihirbaz değil) gerçek hook'lara bağlanarak port edilir. Hiçbir enrollment açılmaz, hiçbir koltuk değiştirilmez — yalnız `Intent` alanı set edilir.

**Tech Stack:** .NET 10 · MediatR · FluentValidation · EF Core 10 · Result pattern · React 19 · Vite · TS · TanStack React Query · Axios · i18next · vitest.

**Tasarım dokümanı (bağlayıcı):** `.claude/specs/ogrenci-kayit-faz3a-yenileme-niyeti-design.md`
**Şemsiye spec:** `.claude/specs/ogrenci-kayit-enrollment-spec.md` (E6.1, E7, E8, E9, E12.2)
**Handoff:** `Oksis Layout - Ennrollment.zip → app/reenroll.jsx` (213 satır) + `app/flows.css`

## Global Constraints

- **Multi-tenant izolasyon asla bypass edilmez.** BE: EF Core global query filter otomatik (`StudentEnrollment : TenantEntity`); `IgnoreQueryFilters()` YASAK. FE: tüm React Query key'leri `tenantScopedKey(schoolId, [...])` ile prefix'lenir.
- **İzin:** Tüm yeni query/komut `[RequirePermission("students.renew")]` taşır (izin Faz 1A'da seed'li). İzin yok → 403.
- **Naming:** `Mark`≠`Grade`. Component/identifier İngilizce PascalCase (`RenewalPage`, `RenewalCandidateDto`); UI metni Türkçe ama **hardcoded YASAK** → `t("renewal.*")` i18n.
- **Entity alanı `StudentPersonId`** (StudentId değil): `StudentEnrollment.StudentPersonId → Person.Id`.
- **Domain saf:** entity'de EF attribute/DataAnnotations yok; mevcut `SetRenewalIntent(RenewalIntent)` (StudentEnrollment.cs:~102) kullanılır, yeni domain davranışı eklenmez.
- **Commit formatı:** `YYYY-MM-DD <type>: Türkçe özet.` + `Co-Authored-By` / `Claude-Session` trailer'ları. Bugünün tarihi commit anında kullanılır.
- **3A dışı (→3B), bu planda YOK:** `OpenRenewalPeriod`, `RenewEnrollment`, `PromoteStudents` E6.3 gating, `ActivateSeasonRollover` entegrasyonu, `EnrollmentRenewedEvent`, SourceClassRoomId tabanlı gerçek terfi. FE'de "Yenilemeyi Başlat" + "Dışa Aktar" **pasif** (`notReadyHint`).
- **Build/format kapıları:** BE değişiminden sonra `dotnet build` + `dotnet format`; FE değişiminden sonra `npm run build` + `npm run test`.

---

## File Structure

**Backend (`oksis-api/`)**
- Create: `src/Oksis.Application/Modules/Students/Queries/ListRenewalCandidates/ListRenewalCandidatesQuery.cs` — query record + DTO + result record
- Create: `src/Oksis.Application/Modules/Students/Queries/ListRenewalCandidates/ListRenewalCandidatesQueryHandler.cs`
- Create: `src/Oksis.Application/Modules/Students/Commands/BulkSetRenewalIntent/BulkSetRenewalIntentCommand.cs` — command + result record
- Create: `src/Oksis.Application/Modules/Students/Commands/BulkSetRenewalIntent/BulkSetRenewalIntentCommandHandler.cs`
- Create: `src/Oksis.Application/Modules/Students/Commands/BulkSetRenewalIntent/BulkSetRenewalIntentCommandValidator.cs`
- Create: `src/Oksis.Api/Controllers/V1/EnrollmentsController.cs`
- Create tests: `tests/Oksis.Infrastructure.IntegrationTests/Students/Renewal/ListRenewalCandidatesTests.cs`, `.../Renewal/BulkSetRenewalIntentTests.cs`, `.../Renewal/RenewalScenario.cs`

**Frontend (`oksis-web/`)**
- Create: `src/portals/admin/students/api/renewalApi.ts`
- Modify: `src/portals/admin/students/keys/studentKeys.ts` (renewal key ekle)
- Create: `src/portals/admin/students/hooks/useRenewalCandidatesQuery.ts`, `.../hooks/useSetRenewalIntentMutation.ts`
- Create: `src/portals/admin/students/renewal/RenewalPage.tsx`, `.../renewal/index.ts`, `.../renewal/renewal.css`
- Create FE alt-bileşenler: `.../renewal/parts/RenewalKpiStrip.tsx`, `.../renewal/parts/RenewalSeasonBridge.tsx`, `.../renewal/parts/RenewalTable.tsx`, `.../renewal/parts/RenewalToolbar.tsx`, `.../renewal/parts/RenewalSelectionBar.tsx`
- Modify: `src/app/routes.tsx` (`students/renewal` route)
- Modify: `src/portals/admin/students/StudentsPage.tsx` ("Kayıt Yenileme" navigasyon butonu)
- Modify: `src/shared/i18n/locales/tr/students.json`, `src/shared/i18n/locales/en/students.json` (`renewal.*` blok)
- Create tests: `src/portals/admin/students/__tests__/renewalApi.test.ts`, `.../__tests__/RenewalPage.test.tsx`

**Docs (`oksis/`)**
- Modify: `.claude/docs/modules/students/{api-contracts,completion_status,business-rules}.md`

---

## Task B1: ListRenewalCandidatesQuery + Handler (çekirdek liste)

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Queries/ListRenewalCandidates/ListRenewalCandidatesQuery.cs`
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Queries/ListRenewalCandidates/ListRenewalCandidatesQueryHandler.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/Renewal/RenewalScenario.cs` (seed helper)
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/Renewal/ListRenewalCandidatesTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext` (DbSets `StudentEnrollments`, `Persons`, `Profiles`, `ClassRooms`, `AcademicSessions`); `IQueryHandler<TQuery,TResult>`; `[Tenancy]`/`[RequirePermission]`; `EnrollmentStatus`, `RenewalIntent`, `AcademicSessionStatus`, `Gender` enums; `StudentProfile`.
- Produces:
  - `ListRenewalCandidatesQuery(Guid? SessionId, int? GradeLevel, RenewalIntent? Intent, string? Search, int Page=1, int PageSize=20) : IQuery<RenewalCandidatesResult>`
  - `RenewalCandidateDto(Guid EnrollmentId, Guid StudentPersonId, string? StudentNumber, string FirstName, string LastName, string Gender, int GradeLevel, Guid? ClassRoomId, string? ClassRoomName, string? CurrentIntent)`
  - `RenewalCandidatesResult(IReadOnlyCollection<RenewalCandidateDto> Items, int Page, int PageSize, int TotalCount, int RenewingCount, int UndecidedCount, int LeavingCount)`

- [ ] **Step 1: Seed helper'ı yaz** (`RenewalScenario.cs`)

`tests/.../Students/Lifecycle/LifecycleScenario.cs`'i referans al (aynı dizinde okunabilir; okul+sezon+şube+person+profile+enrollment tohumlama desenini birebir izle). Bir aktif sezonlu okul + N öğrenci (verilen intent ile) tohumlayan helper:

```csharp
using Oksis.Domain.Modules.Students.Enums;

namespace Oksis.Infrastructure.IntegrationTests.Students.Renewal;

internal static class RenewalScenario
{
    internal sealed record SeededCandidate(Guid EnrollmentId, Guid StudentPersonId);

    // LifecycleScenario.SeedActiveStudentAsync desenini izleyerek okul+sezon kur.
    // Aktif sezon Status=AcademicSessionStatus.Active + IsCurrent=true olmalı.
    public static async Task<(Guid SchoolId, Guid SessionId)> SeedSchoolWithActiveSessionAsync(DatabaseFixture fixture)
    {
        // LifecycleScenario'daki SeedSchoolSessionAsync eşdeğerini birebir uygula
        // (okul, AcademicSession.Create(...) + Activate, CreateDbContext(schoolId) ile kaydet).
        // Dönüş: (schoolId, sessionId).
        throw new NotImplementedException("LifecycleScenario seed desenini buraya port et.");
    }

    // Verilen sezona Active bir enrollment + Person/StudentProfile ekler; intent verilmişse SetRenewalIntent uygular.
    public static async Task<SeededCandidate> SeedActiveCandidateAsync(
        DatabaseFixture fixture, Guid schoolId, Guid sessionId,
        string firstName, string lastName, int gradeLevel,
        RenewalIntent? intent = null, string? studentNumber = null, Gender gender = Gender.Male)
    {
        // LifecycleScenario'daki öğrenci seed desenini izle: Person.Create + StudentProfile +
        // StudentEnrollment.Create(...) → Activate() (Status=Active). intent != null ise enrollment.SetRenewalIntent(intent.Value).
        // CreateDbContext(schoolId) ile kaydet. Dönüş: (enrollmentId, studentPersonId).
        throw new NotImplementedException("LifecycleScenario öğrenci seed desenini buraya port et.");
    }
}
```

> Not: `RenewalScenario`'nun gövdesi `LifecycleScenario.cs`'in seed mantığının birebir kopyası/uyarlamasıdır — implementer o dosyayı okuyup aynı factory çağrılarıyla doldurur. `NotImplementedException` Step 3 sonunda kalmaz.

- [ ] **Step 2: Failing test yaz** (`ListRenewalCandidatesTests.cs`)

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Students.Queries.ListRenewalCandidates;
using Oksis.Domain.Modules.Students.Enums;

namespace Oksis.Infrastructure.IntegrationTests.Students.Renewal;

[Collection(DatabaseCollection.Name)]
public sealed class ListRenewalCandidatesTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Lists_only_active_enrollments_of_active_session()
    {
        var (schoolId, sessionId) = await RenewalScenario.SeedSchoolWithActiveSessionAsync(fixture);
        await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "Ada", "Yilmaz", 5);
        // Frozen/terminal kayıt aday DEĞİL: pasif bir kayıt eklensin (Active olmayan).
        var inactive = await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "Bora", "Kaya", 6);
        await using (var mut = fixture.CreateDbContext(schoolId))
        {
            var e = await mut.StudentEnrollments.SingleAsync(x => x.Id == inactive.EnrollmentId);
            e.Freeze();
            await mut.SaveChangesAsync();
        }

        await using var db = fixture.CreateDbContext(schoolId);
        var handler = new ListRenewalCandidatesQueryHandler(db);
        var result = await handler.Handle(new ListRenewalCandidatesQuery(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.TotalCount.Should().Be(1);
        result.Value.Items.Should().ContainSingle(i => i.FirstName == "Ada" && i.LastName == "Yilmaz");
    }

    [Fact]
    public async Task Isolates_tenant()
    {
        var (schoolId, sessionId) = await RenewalScenario.SeedSchoolWithActiveSessionAsync(fixture);
        await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "Ada", "Yilmaz", 5);
        var (other, otherSession) = await RenewalScenario.SeedSchoolWithActiveSessionAsync(fixture);
        await RenewalScenario.SeedActiveCandidateAsync(fixture, other, otherSession, "Cem", "Demir", 5);

        await using var db = fixture.CreateDbContext(schoolId);
        var handler = new ListRenewalCandidatesQueryHandler(db);
        var result = await handler.Handle(new ListRenewalCandidatesQuery(), CancellationToken.None);

        result.Value!.Items.Should().OnlyContain(i => i.FirstName == "Ada");
    }

    [Fact]
    public async Task Returns_not_found_when_explicit_session_missing()
    {
        var (schoolId, _) = await RenewalScenario.SeedSchoolWithActiveSessionAsync(fixture);
        await using var db = fixture.CreateDbContext(schoolId);
        var handler = new ListRenewalCandidatesQueryHandler(db);
        var result = await handler.Handle(new ListRenewalCandidatesQuery(SessionId: Guid.NewGuid()), CancellationToken.None);
        result.IsSuccess.Should().BeFalse();
    }
}
```

- [ ] **Step 3: Testi çalıştır, FAIL gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ListRenewalCandidatesTests"`
Expected: FAIL — `ListRenewalCandidatesQuery`/`Handler` yok (derlenmez) ve `RenewalScenario` `NotImplementedException`. Önce Step 1 seed gövdesini doldur (LifecycleScenario'dan), sonra query+handler'ı yaz.

- [ ] **Step 4: Query + DTO + Result yaz** (`ListRenewalCandidatesQuery.cs`)

```csharp
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Common.Security;
using Oksis.Application.Common.Tenancy;
using Oksis.Domain.Modules.Students.Enums;

namespace Oksis.Application.Modules.Students.Queries.ListRenewalCandidates;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.renew")]
public sealed record ListRenewalCandidatesQuery(
    Guid? SessionId = null,
    int? GradeLevel = null,
    RenewalIntent? Intent = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 20) : IQuery<RenewalCandidatesResult>;

public sealed record RenewalCandidateDto(
    Guid EnrollmentId,
    Guid StudentPersonId,
    string? StudentNumber,
    string FirstName,
    string LastName,
    string Gender,
    int GradeLevel,
    Guid? ClassRoomId,
    string? ClassRoomName,
    string? CurrentIntent);

public sealed record RenewalCandidatesResult(
    IReadOnlyCollection<RenewalCandidateDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int RenewingCount,
    int UndecidedCount,
    int LeavingCount);
```

> `[Tenancy]`/`[RequirePermission]`/`IQuery<T>` namespace'lerini `ListStudentsQuery.cs`'teki `using`'lerden birebir doğrula (aynı dizin komşusu); farklıysa oradakini kullan.

- [ ] **Step 5: Handler yaz** (`ListRenewalCandidatesQueryHandler.cs`)

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Queries.ListRenewalCandidates;

public sealed class ListRenewalCandidatesQueryHandler(IApplicationDbContext db)
    : IQueryHandler<ListRenewalCandidatesQuery, RenewalCandidatesResult>
{
    public async Task<Result<RenewalCandidatesResult>> Handle(
        ListRenewalCandidatesQuery request, CancellationToken ct)
    {
        Guid? seasonId = request.SessionId;
        if (seasonId is null)
        {
            seasonId = await db.AcademicSessions.AsNoTracking()
                .Where(s => s.Status == AcademicSessionStatus.Active)
                .Select(s => (Guid?)s.Id)
                .FirstOrDefaultAsync(ct);
        }
        else
        {
            var exists = await db.AcademicSessions.AsNoTracking()
                .AnyAsync(s => s.Id == seasonId, ct);
            if (!exists) return Result<RenewalCandidatesResult>.NotFound();
        }
        if (seasonId is null)
            return Result<RenewalCandidatesResult>.Success(
                new RenewalCandidatesResult([], request.Page, request.PageSize, 0, 0, 0, 0));

        var filtered =
            from e in db.StudentEnrollments.AsNoTracking()
            where e.AcademicSessionId == seasonId && e.Status == EnrollmentStatus.Active
            join p in db.Persons.AsNoTracking() on e.StudentPersonId equals p.Id
            select new { e, p };

        if (request.GradeLevel is { } gl)
            filtered = filtered.Where(x => x.e.GradeLevel == gl);
        if (request.Intent is { } it)
            filtered = filtered.Where(x => x.e.Intent == it);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var pattern = $"%{request.Search.Trim().ToLower()}%";
            var numberMatchIds = db.Profiles.OfType<StudentProfile>()
                .Where(sp => sp.StudentNumber != null
                    && EF.Functions.Like(sp.StudentNumber.ToLower(), pattern))
                .Select(sp => sp.PersonId);
            filtered = filtered.Where(x =>
                EF.Functions.Like(x.p.Name.First.ToLower(), pattern) ||
                EF.Functions.Like(x.p.Name.Last.ToLower(), pattern) ||
                numberMatchIds.Contains(x.p.Id));
        }

        var totalCount = await filtered.CountAsync(ct);
        var renewingCount = await filtered.CountAsync(x => x.e.Intent == RenewalIntent.Renewing, ct);
        var undecidedCount = await filtered.CountAsync(x => x.e.Intent == RenewalIntent.Undecided, ct);
        var leavingCount = await filtered.CountAsync(x => x.e.Intent == RenewalIntent.Leaving, ct);

        var rows = await filtered
            .OrderBy(x => x.p.Name.First).ThenBy(x => x.p.Name.Last)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new
            {
                x.e.Id,
                x.e.StudentPersonId,
                x.e.GradeLevel,
                x.e.ClassRoomId,
                x.e.Intent,
                FirstName = x.p.Name.First,
                LastName = x.p.Name.Last,
                x.p.Gender,
                StudentNumber = db.Profiles.OfType<StudentProfile>()
                    .Where(sp => sp.PersonId == x.e.StudentPersonId)
                    .Select(sp => sp.StudentNumber).FirstOrDefault(),
                ClassRoomName = db.ClassRooms.AsNoTracking()
                    .Where(c => c.Id == x.e.ClassRoomId)
                    .Select(c => c.Name).FirstOrDefault(),
            })
            .ToListAsync(ct);

        var items = rows.Select(r => new RenewalCandidateDto(
            r.Id, r.StudentPersonId, r.StudentNumber,
            r.FirstName, r.LastName,
            r.Gender.HasValue ? r.Gender.Value.ToString() : string.Empty,
            r.GradeLevel, r.ClassRoomId, r.ClassRoomName,
            r.Intent.HasValue ? r.Intent.Value.ToString() : null)).ToList();

        return Result<RenewalCandidatesResult>.Success(new RenewalCandidatesResult(
            items, request.Page, request.PageSize, totalCount,
            renewingCount, undecidedCount, leavingCount));
    }
}
```

> `ClassRoom.Name` / `Person.Name.First` / `StudentProfile.StudentNumber` alan adlarını mevcut entity'lerden doğrula (BE keşif: PersonName.First/Last; StudentProfile.StudentNumber; ListStudents `ClassName` üretiyor → ClassRoom.Name). Farklı isim varsa uyarlayıp testle.

- [ ] **Step 6: Testi çalıştır, PASS gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ListRenewalCandidatesTests"`
Expected: 3 test PASS.

- [ ] **Step 7: Build + format + commit**

```bash
cd oksis-api && dotnet build && dotnet format
git add src/Oksis.Application/Modules/Students/Queries/ListRenewalCandidates tests/Oksis.Infrastructure.IntegrationTests/Students/Renewal
git commit -m "$(date +%Y-%m-%d) feat,test: ListRenewalCandidates sorgusu — cari sezon aktif yenileme adayları + tenant izolasyon testleri.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Task B2: KPI dağılımı + filtreler (gradeLevel/intent/search) testleri

**Files:**
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Students/Renewal/ListRenewalCandidatesTests.cs`

> Handler kodu B1'de KPI sayımları ve filtreleri zaten içeriyor. Bu task onları **kanıtlayan** testleri ekler (TDD: davranış sözleşmesini kilitler).

**Interfaces:**
- Consumes: B1'in `ListRenewalCandidatesQuery` / `RenewalCandidatesResult` / `RenewalScenario`.

- [ ] **Step 1: Failing testleri ekle**

```csharp
[Fact]
public async Task Kpi_counts_reflect_full_set_not_page()
{
    var (schoolId, sessionId) = await RenewalScenario.SeedSchoolWithActiveSessionAsync(fixture);
    await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "A", "A", 5, RenewalIntent.Renewing);
    await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "B", "B", 5, RenewalIntent.Renewing);
    await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "C", "C", 5, RenewalIntent.Undecided);
    await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "D", "D", 5, RenewalIntent.Leaving);
    await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "E", "E", 5); // intent null

    await using var db = fixture.CreateDbContext(schoolId);
    var handler = new ListRenewalCandidatesQueryHandler(db);
    var result = await handler.Handle(new ListRenewalCandidatesQuery(PageSize: 2), CancellationToken.None);

    result.Value!.Items.Should().HaveCount(2);          // sayfa
    result.Value.TotalCount.Should().Be(5);             // tüm küme
    result.Value.RenewingCount.Should().Be(2);
    result.Value.UndecidedCount.Should().Be(1);         // null SAYILMAZ
    result.Value.LeavingCount.Should().Be(1);
}

[Fact]
public async Task Filters_by_grade_intent_and_search()
{
    var (schoolId, sessionId) = await RenewalScenario.SeedSchoolWithActiveSessionAsync(fixture);
    await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "Ada", "Yilmaz", 5, RenewalIntent.Renewing, "202500001");
    await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "Bora", "Kaya", 6, RenewalIntent.Leaving, "202500002");

    await using var db = fixture.CreateDbContext(schoolId);
    var handler = new ListRenewalCandidatesQueryHandler(db);

    (await handler.Handle(new ListRenewalCandidatesQuery(GradeLevel: 5), CancellationToken.None))
        .Value!.Items.Should().OnlyContain(i => i.GradeLevel == 5);
    (await handler.Handle(new ListRenewalCandidatesQuery(Intent: RenewalIntent.Leaving), CancellationToken.None))
        .Value!.Items.Should().OnlyContain(i => i.CurrentIntent == "Leaving");
    (await handler.Handle(new ListRenewalCandidatesQuery(Search: "202500001"), CancellationToken.None))
        .Value!.Items.Should().ContainSingle(i => i.StudentNumber == "202500001");
    (await handler.Handle(new ListRenewalCandidatesQuery(Search: "bora"), CancellationToken.None))
        .Value!.Items.Should().ContainSingle(i => i.FirstName == "Bora");
}
```

- [ ] **Step 2: Çalıştır, PASS gör** (handler B1'de hazır)

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ListRenewalCandidatesTests"`
Expected: tüm testler PASS. FAIL olursa B1 handler'ındaki ilgili dalı düzelt.

- [ ] **Step 3: Commit**

```bash
cd oksis-api && git add tests/Oksis.Infrastructure.IntegrationTests/Students/Renewal/ListRenewalCandidatesTests.cs
git commit -m "$(date +%Y-%m-%d) test: ListRenewalCandidates KPI dağılımı (tüm küme) + grade/intent/search filtre testleri.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Task B3: BulkSetRenewalIntentCommand + Validator + Handler

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Commands/BulkSetRenewalIntent/BulkSetRenewalIntentCommand.cs`
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Commands/BulkSetRenewalIntent/BulkSetRenewalIntentCommandValidator.cs`
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Commands/BulkSetRenewalIntent/BulkSetRenewalIntentCommandHandler.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/Renewal/BulkSetRenewalIntentTests.cs`

**Interfaces:**
- Consumes: `ICommand<T>`, `ICommandHandler<TCommand,TResult>`, `IApplicationDbContext`, `RenewalScenario`, `RenewalIntent`, `EnrollmentStatus`, `AcademicSessionStatus`, `Result<T>`.
- Produces:
  - `BulkSetRenewalIntentCommand(IReadOnlyList<Guid> EnrollmentIds, RenewalIntent Intent) : ICommand<BulkSetRenewalIntentResult>`
  - `BulkSetRenewalIntentResult(int UpdatedCount)`

- [ ] **Step 1: Failing test yaz** (`BulkSetRenewalIntentTests.cs`)

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Modules.Students.Commands.BulkSetRenewalIntent;
using Oksis.Domain.Modules.Students.Enums;

namespace Oksis.Infrastructure.IntegrationTests.Students.Renewal;

[Collection(DatabaseCollection.Name)]
public sealed class BulkSetRenewalIntentTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private BulkSetRenewalIntentCommandHandler Handler(Guid schoolId)
        => new(fixture.CreateDbContext(schoolId));

    [Fact]
    public async Task Sets_intent_for_multiple_active_enrollments()
    {
        var (schoolId, sessionId) = await RenewalScenario.SeedSchoolWithActiveSessionAsync(fixture);
        var a = await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "A", "A", 5);
        var b = await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "B", "B", 5);

        var result = await Handler(schoolId).Handle(
            new BulkSetRenewalIntentCommand([a.EnrollmentId, b.EnrollmentId], RenewalIntent.Renewing),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.UpdatedCount.Should().Be(2);

        await using var verify = fixture.CreateDbContext(schoolId);
        (await verify.StudentEnrollments.AsNoTracking().Where(e => e.AcademicSessionId == sessionId).ToListAsync())
            .Should().OnlyContain(e => e.Intent == RenewalIntent.Renewing);
    }

    [Fact]
    public async Task Sets_intent_for_single_enrollment()
    {
        var (schoolId, sessionId) = await RenewalScenario.SeedSchoolWithActiveSessionAsync(fixture);
        var a = await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "A", "A", 5);

        var result = await Handler(schoolId).Handle(
            new BulkSetRenewalIntentCommand([a.EnrollmentId], RenewalIntent.Leaving), CancellationToken.None);

        result.Value!.UpdatedCount.Should().Be(1);
        await using var verify = fixture.CreateDbContext(schoolId);
        (await verify.StudentEnrollments.AsNoTracking().SingleAsync(e => e.Id == a.EnrollmentId))
            .Intent.Should().Be(RenewalIntent.Leaving);
    }

    [Fact]
    public async Task Skips_non_active_or_unknown_ids_and_counts_only_updated()
    {
        var (schoolId, sessionId) = await RenewalScenario.SeedSchoolWithActiveSessionAsync(fixture);
        var active = await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "A", "A", 5);
        var frozen = await RenewalScenario.SeedActiveCandidateAsync(fixture, schoolId, sessionId, "B", "B", 5);
        await using (var mut = fixture.CreateDbContext(schoolId))
        {
            var e = await mut.StudentEnrollments.SingleAsync(x => x.Id == frozen.EnrollmentId);
            e.Freeze();
            await mut.SaveChangesAsync();
        }

        var result = await Handler(schoolId).Handle(
            new BulkSetRenewalIntentCommand([active.EnrollmentId, frozen.EnrollmentId, Guid.NewGuid()],
                RenewalIntent.Renewing), CancellationToken.None);

        result.Value!.UpdatedCount.Should().Be(1); // yalnız Active güncellenir
    }
}
```

- [ ] **Step 2: Çalıştır, FAIL gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~BulkSetRenewalIntentTests"`
Expected: FAIL — komut/handler yok (derlenmez).

- [ ] **Step 3: Command + Result yaz** (`BulkSetRenewalIntentCommand.cs`)

```csharp
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Common.Security;
using Oksis.Application.Common.Tenancy;
using Oksis.Domain.Modules.Students.Enums;

namespace Oksis.Application.Modules.Students.Commands.BulkSetRenewalIntent;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.renew")]
public sealed record BulkSetRenewalIntentCommand(
    IReadOnlyList<Guid> EnrollmentIds,
    RenewalIntent Intent) : ICommand<BulkSetRenewalIntentResult>;

public sealed record BulkSetRenewalIntentResult(int UpdatedCount);
```

> `using` namespace'lerini `FreezeEnrollmentCommand.cs`'ten doğrula.

- [ ] **Step 4: Validator yaz** (`BulkSetRenewalIntentCommandValidator.cs`)

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Students.Commands.BulkSetRenewalIntent;

public sealed class BulkSetRenewalIntentCommandValidator : AbstractValidator<BulkSetRenewalIntentCommand>
{
    public BulkSetRenewalIntentCommandValidator()
    {
        RuleFor(x => x.EnrollmentIds)
            .NotEmpty().WithMessage("students.errors.renewal-ids-required")
            .Must(ids => ids.Count <= 500).WithMessage("students.errors.renewal-ids-too-many");
        RuleFor(x => x.Intent).IsInEnum().WithMessage("students.errors.renewal-intent-invalid");
    }
}
```

- [ ] **Step 5: Handler yaz** (`BulkSetRenewalIntentCommandHandler.cs`)

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Commands.BulkSetRenewalIntent;

public sealed class BulkSetRenewalIntentCommandHandler(IApplicationDbContext db)
    : ICommandHandler<BulkSetRenewalIntentCommand, BulkSetRenewalIntentResult>
{
    public async Task<Result<BulkSetRenewalIntentResult>> Handle(
        BulkSetRenewalIntentCommand request, CancellationToken ct)
    {
        var sessionId = await db.AcademicSessions
            .Where(s => s.Status == AcademicSessionStatus.Active)
            .Select(s => (Guid?)s.Id)
            .FirstOrDefaultAsync(ct);
        if (sessionId is null)
            return Result<BulkSetRenewalIntentResult>.Success(new BulkSetRenewalIntentResult(0));

        var enrollments = await db.StudentEnrollments
            .Where(e => request.EnrollmentIds.Contains(e.Id)
                && e.AcademicSessionId == sessionId
                && e.Status == EnrollmentStatus.Active)
            .ToListAsync(ct);

        foreach (var enrollment in enrollments)
            enrollment.SetRenewalIntent(request.Intent);

        await db.SaveChangesAsync(ct);
        return Result<BulkSetRenewalIntentResult>.Success(
            new BulkSetRenewalIntentResult(enrollments.Count));
    }
}
```

> `ICommandHandler<TCommand,TResult>` arayüz adını `FreezeEnrollmentCommandHandler.cs`'ten doğrula (orada `ICommandHandler<FreezeEnrollmentCommand>` parametresiz Result; burada `Result<T>` döndüğü için generic ikili form gerekir — komşu bir `ICommand<T>` handler'ı varsa onun arayüzünü kullan, yoksa `IRequestHandler<BulkSetRenewalIntentCommand, Result<BulkSetRenewalIntentResult>>`).

- [ ] **Step 6: Çalıştır, PASS gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~BulkSetRenewalIntentTests"`
Expected: 3 test PASS.

- [ ] **Step 7: Build + format + commit**

```bash
cd oksis-api && dotnet build && dotnet format
git add src/Oksis.Application/Modules/Students/Commands/BulkSetRenewalIntent tests/Oksis.Infrastructure.IntegrationTests/Students/Renewal/BulkSetRenewalIntentTests.cs
git commit -m "$(date +%Y-%m-%d) feat,test: BulkSetRenewalIntent komutu — cari sezon aktif kayıtlara niyet (tekil+toplu), Active-dışı atlanır.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Task B4: EnrollmentsController (2 REST ucu)

**Files:**
- Create: `oksis-api/src/Oksis.Api/Controllers/V1/EnrollmentsController.cs`

**Interfaces:**
- Consumes: `ISender`, `ToHttpResult(HttpContext)` (ResultExtensions), `ListRenewalCandidatesQuery`, `BulkSetRenewalIntentCommand`.

- [ ] **Step 1: Controller yaz** (`EnrollmentsController.cs`)

`StudentsController.cs`'i referans al (aynı dizin; `[ApiController] [Route("api/v1")] [Authorize]`, ctor `(ISender sender)`, `ToHttpResult(HttpContext)` deseni).

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Oksis.Api.Extensions;
using Oksis.Application.Modules.Students.Commands.BulkSetRenewalIntent;
using Oksis.Application.Modules.Students.Queries.ListRenewalCandidates;

namespace Oksis.Api.Controllers.V1;

[ApiController]
[Route("api/v1")]
[Authorize]
public sealed class EnrollmentsController(ISender sender) : ControllerBase
{
    [HttpGet("enrollments/renewal-candidates")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ListRenewalCandidatesAsync(
        [FromQuery] ListRenewalCandidatesQuery query, CancellationToken ct)
        => (await sender.Send(query, ct)).ToHttpResult(HttpContext);

    [HttpPost("enrollments:set-intent")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SetIntentAsync(
        [FromBody] BulkSetRenewalIntentCommand command, CancellationToken ct)
        => (await sender.Send(command, ct)).ToHttpResult(HttpContext);
}
```

> `using` (özellikle `Oksis.Api.Extensions` ToHttpResult ve `MediatR`/`ISender`) `StudentsController.cs` ile birebir aynı olmalı; farkı oraya bakıp düzelt.

- [ ] **Step 2: Build + smoke test**

Run: `cd oksis-api && dotnet build`
Expected: derlenir. Route çakışması yok (`enrollments/*` yeni). İstersen API'yi çalıştırıp (`dotnet run --project src/Oksis.Api`) `GET /api/v1/enrollments/renewal-candidates` izinsiz JWT ile 403, izinli ile 200 döndüğünü doğrula (Faz 3B/E2E'de tam doğrulanacak).

- [ ] **Step 3: format + commit**

```bash
cd oksis-api && dotnet format
git add src/Oksis.Api/Controllers/V1/EnrollmentsController.cs
git commit -m "$(date +%Y-%m-%d) feat: EnrollmentsController — renewal-candidates (GET) + :set-intent (POST), students.renew izni.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Task F1: renewalApi.ts (REST client)

**Files:**
- Create: `oksis-web/src/portals/admin/students/api/renewalApi.ts`
- Test: `oksis-web/src/portals/admin/students/__tests__/renewalApi.test.ts`

**Interfaces:**
- Consumes: `httpClient` (`../../../../shared/api/httpClient`); BE `RenewalCandidatesResult` / `RenewalCandidateDto` şekli.
- Produces:
  - `type RenewalIntentValue = "Renewing" | "Undecided" | "Leaving"`
  - `interface RenewalCandidate { enrollmentId; studentPersonId; studentNumber: string|null; firstName; lastName; gender; gradeLevel; classRoomId: string|null; classRoomName: string|null; currentIntent: RenewalIntentValue|null }`
  - `interface RenewalCandidatesPage { items: RenewalCandidate[]; page; pageSize; totalCount; renewingCount; undecidedCount; leavingCount }`
  - `interface RenewalCandidatesArgs { sessionId?; gradeLevel?; intent?; search?; page?; pageSize?; signal? }`
  - `renewalApi.candidates(args): Promise<RenewalCandidatesPage>`
  - `renewalApi.setIntent(enrollmentIds: string[], intent: RenewalIntentValue): Promise<{ updatedCount: number }>`

- [ ] **Step 1: Failing test yaz** (`renewalApi.test.ts`)

`__tests__/studentsApi.lifecycle.test.ts`'i referans al (httpClient mock deseni; mock yolu `../../../../../shared/api/httpClient`).

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renewalApi } from "../api/renewalApi";
import { httpClient } from "../../../../../shared/api/httpClient";

vi.mock("../../../../../shared/api/httpClient", () => ({
  httpClient: { get: vi.fn(), post: vi.fn() },
}));

describe("renewalApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("candidates GET unwraps envelope data", async () => {
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { data: { items: [], page: 1, pageSize: 20, totalCount: 0, renewingCount: 0, undecidedCount: 0, leavingCount: 0 } },
    });
    const page = await renewalApi.candidates({ gradeLevel: 5 });
    expect(httpClient.get).toHaveBeenCalledWith("/enrollments/renewal-candidates", expect.objectContaining({ params: expect.objectContaining({ gradeLevel: 5 }) }));
    expect(page.totalCount).toBe(0);
  });

  it("setIntent posts ids + intent", async () => {
    (httpClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { data: { updatedCount: 2 } } });
    const res = await renewalApi.setIntent(["e1", "e2"], "Renewing");
    expect(httpClient.post).toHaveBeenCalledWith("/enrollments:set-intent", { enrollmentIds: ["e1", "e2"], intent: "Renewing" });
    expect(res.updatedCount).toBe(2);
  });
});
```

- [ ] **Step 2: Çalıştır, FAIL gör**

Run: `cd oksis-web && npx vitest run src/portals/admin/students/__tests__/renewalApi.test.ts`
Expected: FAIL — `renewalApi` yok.

- [ ] **Step 3: renewalApi.ts yaz**

```typescript
import { httpClient } from "../../../../shared/api/httpClient";

export type RenewalIntentValue = "Renewing" | "Undecided" | "Leaving";

export interface RenewalCandidate {
  enrollmentId: string;
  studentPersonId: string;
  studentNumber: string | null;
  firstName: string;
  lastName: string;
  gender: string;
  gradeLevel: number;
  classRoomId: string | null;
  classRoomName: string | null;
  currentIntent: RenewalIntentValue | null;
}

export interface RenewalCandidatesPage {
  items: RenewalCandidate[];
  page: number;
  pageSize: number;
  totalCount: number;
  renewingCount: number;
  undecidedCount: number;
  leavingCount: number;
}

export interface RenewalCandidatesArgs {
  sessionId?: string;
  gradeLevel?: number;
  intent?: RenewalIntentValue;
  search?: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}

interface ApiEnvelope<T> { data: T }

export const renewalApi = {
  async candidates(args: RenewalCandidatesArgs): Promise<RenewalCandidatesPage> {
    const { signal, ...params } = args;
    const res = await httpClient.get<ApiEnvelope<RenewalCandidatesPage>>(
      "/enrollments/renewal-candidates",
      { params, signal },
    );
    return res.data.data;
  },
  async setIntent(enrollmentIds: string[], intent: RenewalIntentValue): Promise<{ updatedCount: number }> {
    const res = await httpClient.post<ApiEnvelope<{ updatedCount: number }>>(
      "/enrollments:set-intent",
      { enrollmentIds, intent },
    );
    return res.data.data;
  },
};
```

> `ApiEnvelope`/unwrap (`res.data.data`) ve `httpClient` import yolunu `api/studentsApi.ts`'ten birebir doğrula.

- [ ] **Step 4: Çalıştır, PASS gör**

Run: `cd oksis-web && npx vitest run src/portals/admin/students/__tests__/renewalApi.test.ts`
Expected: 2 test PASS.

- [ ] **Step 5: Commit**

```bash
cd oksis-web
git add src/portals/admin/students/api/renewalApi.ts src/portals/admin/students/__tests__/renewalApi.test.ts
git commit -m "$(date +%Y-%m-%d) feat,test: renewalApi — renewal-candidates + set-intent istemcisi + envelope unwrap testleri.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Task F2: studentKeys (renewal key) + hook'lar

**Files:**
- Modify: `oksis-web/src/portals/admin/students/keys/studentKeys.ts`
- Create: `oksis-web/src/portals/admin/students/hooks/useRenewalCandidatesQuery.ts`
- Create: `oksis-web/src/portals/admin/students/hooks/useSetRenewalIntentMutation.ts`

**Interfaces:**
- Consumes: `tenantScopedKey`, `useAuthStore`, `useQuery`/`useMutation`/`useQueryClient`, `keepPreviousData`, `renewalApi`.
- Produces:
  - `studentKeys.renewalCandidates(schoolId, params)`
  - `useRenewalCandidatesQuery(args): UseQueryResult<RenewalCandidatesPage>`
  - `useSetRenewalIntentMutation(): { mutateAsync(({ enrollmentIds, intent })) }` (stabil mutateAsync, invalidate)

- [ ] **Step 1: studentKeys'e renewal key ekle**

`keys/studentKeys.ts` içindeki mevcut `list`/`detail` deseninin yanına:

```typescript
  renewalCandidates: (schoolId: string | null | undefined, params: unknown) =>
    tenantScopedKey(schoolId, ["students", "renewal-candidates", params]),
```

- [ ] **Step 2: useRenewalCandidatesQuery yaz**

`hooks/useStudentsQuery.ts`'i birebir izle:

```typescript
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { studentKeys } from "../keys/studentKeys";
import { renewalApi, type RenewalCandidatesArgs, type RenewalCandidatesPage } from "../api/renewalApi";

export function useRenewalCandidatesQuery(args: RenewalCandidatesArgs) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery<RenewalCandidatesPage>({
    queryKey: studentKeys.renewalCandidates(schoolId, args),
    queryFn: ({ signal }) => renewalApi.candidates({ ...args, signal }),
    enabled: Boolean(schoolId),
    placeholderData: keepPreviousData,
  });
}
```

> `useAuthStore` import yolu/şeklini `hooks/useStudentsQuery.ts`'ten doğrula.

- [ ] **Step 3: useSetRenewalIntentMutation yaz**

`hooks/useStudentLifecycle.ts` invalidate desenini izle:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { studentKeys } from "../keys/studentKeys";
import { renewalApi, type RenewalIntentValue } from "../api/renewalApi";

export function useSetRenewalIntentMutation() {
  const queryClient = useQueryClient();
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useMutation({
    mutationFn: ({ enrollmentIds, intent }: { enrollmentIds: string[]; intent: RenewalIntentValue }) =>
      renewalApi.setIntent(enrollmentIds, intent),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: studentKeys.all(schoolId) });
    },
  });
}
```

> Memory kuralı: mutation **nesnesini** bileşen hook deps'ine koyma; `mutateAsync` (stabil referans) kullan.

- [ ] **Step 4: typecheck**

Run: `cd oksis-web && npx tsc --noEmit`
Expected: hata yok.

- [ ] **Step 5: Commit**

```bash
cd oksis-web
git add src/portals/admin/students/keys/studentKeys.ts src/portals/admin/students/hooks/useRenewalCandidatesQuery.ts src/portals/admin/students/hooks/useSetRenewalIntentMutation.ts
git commit -m "$(date +%Y-%m-%d) feat: renewal key + useRenewalCandidatesQuery/useSetRenewalIntentMutation (tenant-scoped, invalidate).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Task F3: i18n renewal.* blokları

**Files:**
- Modify: `oksis-web/src/shared/i18n/locales/tr/students.json`
- Modify: `oksis-web/src/shared/i18n/locales/en/students.json`

**Interfaces:**
- Produces: `renewal.*` anahtarları (`useTranslation("students")` → `t("renewal.title")` vb.)

- [ ] **Step 1: tr/students.json'a `renewal` bloğu ekle** (mevcut kök objeye yeni anahtar)

```json
"renewal": {
  "breadcrumb": { "school": "Okul", "students": "Öğrenciler", "renewal": "Kayıt Yenileme" },
  "title": "Kayıt Yenileme",
  "subtitle": "{{season}} sezonu için yenileme taahhütleri",
  "actions": { "backToStudents": "Öğrencilere Dön", "export": "Dışa Aktar", "start": "Yenilemeyi Başlat" },
  "bridge": {
    "current": "Mevcut sezon", "target": "Hedef sezon", "draft": "Taslak",
    "noTarget": "Hedef taslak sezon yok",
    "note": "Yenileme veli taahhüdüdür; sınıf terfisi taahhütten sonra otomatik uygulanır."
  },
  "concept": {
    "renewTitle": "Yenileme", "renewTag": "veli taahhüdü",
    "renewDesc": "Velinin gelecek sezon devam kararı. Bu ekran yalnızca bunu toplar.",
    "promoTitle": "Terfi", "promoTag": "akademik",
    "promoDesc": "Sınıf yükseltme (8-A → 9-A). Yenileme onaylanınca sistem uygular — ayrı kavram."
  },
  "kpi": { "renewing": "Yenileyen", "renewingSub": "taahhüt verildi", "undecided": "Kararsız", "undecidedSub": "takip gerekiyor", "leaving": "Ayrılıyor", "leavingSub": "çıkış planlı", "capacity": "Tahmini doluluk" },
  "toolbar": { "search": "Ad veya öğrenci no ara…", "classFilter": "Sınıf", "statusFilter": "Durum", "all": "(tümü)" },
  "selection": { "count": "{{count}} öğrenci seçildi · toplu işaretle", "clear": "Seçimi temizle" },
  "table": { "student": "Öğrenci", "currentClass": "Mevcut Sınıf", "nextClass": "Terfi Sonrası", "status": "Yenileme Durumu", "no": "No: {{no}}", "detail": "Detay" },
  "segment": { "renewing": "Yeniler", "undecided": "Kararsız", "leaving": "Ayrılıyor" },
  "states": {
    "errorTitle": "Liste yüklenemedi", "errorBody": "Yenileme listesi alınamadı. Lütfen tekrar deneyin.", "retry": "Tekrar Dene",
    "emptyClosedTitle": "Yenileme dönemi henüz açılmadı", "emptyClosedBody": "Gelecek sezon taslak aşamasında. Yenileme dönemi başlatıldığında aktif öğrenciler burada listelenir.",
    "emptyFilterTitle": "Sonuç bulunamadı", "emptyFilterBody": "Arama veya filtre kriterlerine uyan öğrenci yok.", "clearFilters": "Filtreleri Temizle"
  },
  "footer": { "count": "{{shown}} / {{total}} aktif öğrenci", "promoNote": "Terfi, yenileme onayından sonra otomatik uygulanır" },
  "notReadyHint": "Bu işlem Faz 3B ile etkinleşecek."
}
```

- [ ] **Step 2: en/students.json'a İngilizce karşılıkları ekle** (aynı anahtar ağacı; değerler İngilizce, ör. `"title": "Re-enrollment"`, `"start": "Start Renewal"`, `"renewing": "Renewing"`, `"undecided": "Undecided"`, `"leaving": "Leaving"` vb.)

- [ ] **Step 3: JSON geçerliliği + build**

Run: `cd oksis-web && node -e "JSON.parse(require('fs').readFileSync('src/shared/i18n/locales/tr/students.json','utf8')); JSON.parse(require('fs').readFileSync('src/shared/i18n/locales/en/students.json','utf8')); console.log('OK')"`
Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
cd oksis-web
git add src/shared/i18n/locales/tr/students.json src/shared/i18n/locales/en/students.json
git commit -m "$(date +%Y-%m-%d) feat: renewal.* i18n blokları (tr+en) — kayıt yenileme ekranı metinleri.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Task F4: RenewalPage + parçalar + CSS (handoff birebir port)

**Files:**
- Create: `oksis-web/src/portals/admin/students/renewal/RenewalPage.tsx`
- Create: `oksis-web/src/portals/admin/students/renewal/index.ts`
- Create: `oksis-web/src/portals/admin/students/renewal/renewal.css`
- Create: `oksis-web/src/portals/admin/students/renewal/parts/RenewalSeasonBridge.tsx`, `RenewalKpiStrip.tsx`, `RenewalToolbar.tsx`, `RenewalSelectionBar.tsx`, `RenewalTable.tsx`
- Test: `oksis-web/src/portals/admin/students/__tests__/RenewalPage.test.tsx`

**Handoff kaynağı (birebir):** `reenroll.jsx` (213 satır) + `flows.css` reenroll sınıfları. Faz 1B `enroll/` portu (`EnrollStudentSheet` + scoped `enroll.css`) referans port örneğidir — aynı yöntem: JSX→TSX, mock veri→hook, `flows.css` ilgili kuralları `renewal.css`'e scoped (`.reenroll` kök sınıfı altında) port.

**Interfaces:**
- Consumes: `useRenewalCandidatesQuery`, `useSetRenewalIntentMutation`, `RenewalCandidate`, `RenewalIntentValue`, `useTranslation("students")`, `useSearchParams` (filtre/sayfa URL state), `useNavigate`.
- Produces: `RenewalPage` (default + named export via `index.ts`).

- [ ] **Step 1: CSS port** (`renewal.css`)

`Oksis Layout - Ennrollment.zip → app/flows.css` içindeki reenroll kuralları (`.reenroll`, `.re-inner`, `.re-bridge`, `.rb-*`, `.concept-split`, `.concept`, `.cn-*`, `.re-kpis`, `.re-kpi`, `.rk-*`, `.ren-seg`, `.promo-chip`, `.cls-chip`, `.pa`, `.nb`) `renewal.css`'e kopyalanır. Faz 1B dersine uy: stillerin gerçekten uygulandığını doğrula (gerekirse `.reenroll` kök sınıfı altında scope'la). `RenewalPage.tsx` üstünde `import "./renewal.css";`.

> Çıkarılmış handoff: `/private/tmp/.../scratchpad/handoff_zip/app/flows.css` (zip'ten). Yoksa zip'ten tekrar çıkar: `unzip -o "Oksis Layout - Ennrollment.zip" "app/flows.css" -d <tmp>`.

- [ ] **Step 2: Failing test yaz** (`RenewalPage.test.tsx`)

`__tests__/StudentsEnrollIntegration.test.tsx` wrapper desenini (QueryClient + I18nextProvider + MemoryRouter) birebir izle; hook'ları `vi.mock` ile sahte verle.

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { I18nextProvider } from "react-i18next";
import { i18n } from "../../../../shared/i18n";
import { RenewalPage } from "../renewal/RenewalPage";

const mutateAsync = vi.fn().mockResolvedValue({ updatedCount: 1 });
vi.mock("../hooks/useSetRenewalIntentMutation", () => ({
  useSetRenewalIntentMutation: () => ({ mutateAsync, isPending: false }),
}));
const candidatesMock = vi.fn();
vi.mock("../hooks/useRenewalCandidatesQuery", () => ({
  useRenewalCandidatesQuery: () => candidatesMock(),
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter><RenewalPage /></MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

const page = (over = {}) => ({
  data: { items: [{ enrollmentId: "e1", studentPersonId: "p1", studentNumber: "202500001", firstName: "Ada", lastName: "Yilmaz", gender: "Female", gradeLevel: 8, classRoomId: "c1", classRoomName: "8-A", currentIntent: null }],
    page: 1, pageSize: 20, totalCount: 1, renewingCount: 0, undecidedCount: 0, leavingCount: 0 },
  isLoading: false, isError: false, ...over });

describe("RenewalPage", () => {
  it("renders KPI counts from query data", () => {
    candidatesMock.mockReturnValue(page({ data: { ...page().data, renewingCount: 3, undecidedCount: 1, leavingCount: 2 } }));
    renderPage();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText(/Ada Yilmaz/)).toBeInTheDocument();
  });

  it("shows error state", () => {
    candidatesMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderPage();
    expect(screen.getByText(/Liste yüklenemedi/i)).toBeInTheDocument();
  });

  it("shows empty state when no candidates", () => {
    candidatesMock.mockReturnValue({ data: { items: [], page: 1, pageSize: 20, totalCount: 0, renewingCount: 0, undecidedCount: 0, leavingCount: 0 }, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText(/Yenileme dönemi henüz açılmadı|Sonuç bulunamadı/i)).toBeInTheDocument();
  });

  it("clicking a segment button calls setIntent mutation with single id", async () => {
    candidatesMock.mockReturnValue(page());
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Yeniler" }));
    expect(mutateAsync).toHaveBeenCalledWith({ enrollmentIds: ["e1"], intent: "Renewing" });
  });

  it("'Yenilemeyi Başlat' is disabled (3B deferred)", () => {
    candidatesMock.mockReturnValue(page());
    renderPage();
    expect(screen.getByRole("button", { name: /Yenilemeyi Başlat/i })).toBeDisabled();
  });
});
```

- [ ] **Step 3: Çalıştır, FAIL gör**

Run: `cd oksis-web && npx vitest run src/portals/admin/students/__tests__/RenewalPage.test.tsx`
Expected: FAIL — `RenewalPage` yok.

- [ ] **Step 4: Parça bileşenleri + RenewalPage yaz**

`reenroll.jsx`'i birebir port et (tam-sayfa; sheet/sihirbaz DEĞİL). Yapı:
- `RenewalSeasonBridge.tsx` — `.re-bridge` (mevcut→hedef sezon, taslak rozeti, not). Hedef sezon prop'tan; yoksa `renewal.bridge.noTarget`.
- `RenewalKpiStrip.tsx` — `.re-kpis` 4 kart; sayılar **prop'tan** (`renewingCount/undecidedCount/leavingCount`, `capacity = Math.round(((ren + und*0.5)/total)*100)` — handoff formülü).
- `RenewalToolbar.tsx` — `.stu-toolbar` arama + Sınıf + Durum filtreleri (URL search-param'lara bağlı).
- `RenewalSelectionBar.tsx` — `.sel-bar` toplu işaretle (Yeniler/Kararsız/Ayrılıyor) + temizle; `onBulk(intent)`.
- `RenewalTable.tsx` — `.stu-tbl.re-tbl` satırlar; sütunlar: seçim, Öğrenci (avatar+no), Mevcut Sınıf (`.cls-chip`), Terfi Sonrası (`.promo-chip` `next = gradeLevel+1` + aynı şube harfi; sınıf adından harf çıkar: `classRoomName?.split("-")[1]`), Yenileme Durumu (`.ren-seg` segment butonları → `onSetIntent(enrollmentId, intent)`), detay. Loading skeleton + empty + error handoff'taki gibi.
- `RenewalPage.tsx` — `useRenewalCandidatesQuery` + `useSetRenewalIntentMutation`; segment ve toplu bar **aynı** `mutateAsync({ enrollmentIds, intent })`'i çağırır (tekil → `[id]`); KPI'lar query data'dan; PageTop (breadcrumb + başlık + aksiyonlar). **"Yenilemeyi Başlat" + "Dışa Aktar" `disabled` + `title={t("renewal.notReadyHint")}` (3B)**. "Öğrencilere Dön" → `navigate("/admin/students")`. Tüm metinler `t("renewal.*")`.

> Intent string eşlemesi: segment → `RenewalIntentValue` (`"Renewing"|"Undecided"|"Leaving"`); UI etiketleri `t("renewal.segment.*")`. BE `currentIntent` enum string'i (`"Renewing"` vb.) ile birebir; aktif segment `currentIntent === value`.

- [ ] **Step 5: index.ts yaz**

```typescript
export { RenewalPage } from "./RenewalPage";
```

- [ ] **Step 6: Çalıştır, PASS gör**

Run: `cd oksis-web && npx vitest run src/portals/admin/students/__tests__/RenewalPage.test.tsx`
Expected: 5 test PASS. (Buton/etiket adlarını testteki beklentilerle hizala.)

- [ ] **Step 7: typecheck + build + commit**

```bash
cd oksis-web && npx tsc --noEmit && npm run build
git add src/portals/admin/students/renewal src/portals/admin/students/__tests__/RenewalPage.test.tsx
git commit -m "$(date +%Y-%m-%d) feat,test: RenewalPage — reenroll.jsx birebir port (KPI/segment/toplu/sezon köprüsü), 3B butonları pasif.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Task F5: Route + StudentsPage navigasyon

**Files:**
- Modify: `oksis-web/src/app/routes.tsx`
- Modify: `oksis-web/src/portals/admin/students/StudentsPage.tsx`
- Test: `oksis-web/src/portals/admin/students/__tests__/RenewalPage.test.tsx` (navigasyon assertion ekle — opsiyonel)

**Interfaces:**
- Consumes: `lazyPage` (routes.tsx), `RenewalPage` (`renewal/index.ts`), `useNavigate`/`Link`.

- [ ] **Step 1: Route ekle** (`app/routes.tsx`, mevcut `students` route'unun yanına)

```typescript
{
  path: "students/renewal",
  lazy: lazyPage(
    () => import("../portals/admin/students/renewal"),
    "RenewalPage",
  ),
},
```

> `lazyPage(...)` imzasını mevcut `students` route'undan birebir doğrula (named export "RenewalPage" `index.ts`'te mevcut).

- [ ] **Step 2: StudentsPage'e "Kayıt Yenileme" butonu ekle**

Mevcut "Yeni Öğrenci" butonunun (PageTop actions) yanına `navigate("/admin/students/renewal")` tetikleyen buton:

```tsx
<button
  type="button"
  className="btn btn-ghost"
  onClick={() => navigate("/admin/students/renewal")}
>
  <Repeat size={18} strokeWidth={2.2} /> {t("actions.renewal")}
</button>
```

`tr/students.json` `actions`'a `"renewal": "Kayıt Yenileme"`, `en` karşılığı `"renewal": "Re-enrollment"`. `Repeat` ikonunu mevcut import deseniyle ekle (lucide-react). `useNavigate` zaten varsa kullan; yoksa import et.

- [ ] **Step 3: Çalıştır (FE testleri) + build**

Run: `cd oksis-web && npx vitest run src/portals/admin/students && npm run build`
Expected: students suite + renewal testleri PASS; build temiz.

- [ ] **Step 4: Commit**

```bash
cd oksis-web
git add src/app/routes.tsx src/portals/admin/students/StudentsPage.tsx src/shared/i18n/locales/tr/students.json src/shared/i18n/locales/en/students.json
git commit -m "$(date +%Y-%m-%d) feat: /admin/students/renewal route + StudentsPage 'Kayıt Yenileme' navigasyonu.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Task F6: Tüm test + build doğrulama (kapı)

**Files:** yok (doğrulama).

- [ ] **Step 1: BE tam test**

Run: `cd oksis-api && dotnet build && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Renewal"`
Expected: tüm Renewal testleri PASS.

- [ ] **Step 2: FE tam test + build**

Run: `cd oksis-web && npm run test && npm run build`
Expected: tüm suite yeşil (renewalApi + RenewalPage dahil), build temiz.

- [ ] **Step 3: (yeşilse) ara commit gerekmez** — kod commit'leri task'larda atıldı.

---

## Task D1: Modül dokümanları güncelle

**Files:**
- Modify: `oksis/.claude/docs/modules/students/api-contracts.md`
- Modify: `oksis/.claude/docs/modules/students/business-rules.md`
- Modify: `oksis/.claude/docs/modules/students/completion_status.md`

- [ ] **Step 1: api-contracts.md** — "Faz 3A (Canlı)" bölümü ekle: `GET /api/v1/enrollments/renewal-candidates` (`students.renew`) + `POST /api/v1/enrollments:set-intent` (`students.renew`); request/response şemaları (`RenewalCandidatesResult` + KPI alanları; `:set-intent` body `{enrollmentIds, intent}` → `{updatedCount}`); 403/404 kuralları. Faz 3+ tablosundan bu iki ucu canlıya taşı.

- [ ] **Step 2: business-rules.md** — `BR-students-003: Yenileme niyeti yalnız cari sezon aktif kayda set edilir` kuralını ekle: yalnız `Status==Active` + cari (aktif) sezon enrollment'a `Intent` set edilir; `null` intent ("hiç işaretlenmemiş") ≠ `Undecided`; KPI sayıları tüm aday kümesinden; niyet set bildirim üretmez (event 3B). Tarihsel nota satır ekle.

- [ ] **Step 3: completion_status.md** — ilerleme yüzdesini güncelle; "Faz 3A tamam" satırı; ✅'ye 3A yapıları; ⏳'den 3A çıkar; **⚠️ Spec Dışına Çıkılanlar**'a 3 madde (D2 KPI BE meta'dan; D3 SetRenewalIntent tekil komutu açılmadı; docx §5.1 yerine spec E6.3) + Güncel tarih.

- [ ] **Step 4: Commit** (oksis kök repo)

```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/modules/students/api-contracts.md .claude/docs/modules/students/business-rules.md .claude/docs/modules/students/completion_status.md .claude/specs/ogrenci-kayit-faz3a-yenileme-niyeti-design.md .claude/specs/ogrenci-kayit-faz3a-yenileme-niyeti-plan.md
git commit -m "$(date +%Y-%m-%d) docs: Öğrenci kayıt Faz 3A (yenileme niyeti) — tasarım+plan + students modül dokümanları (api-contracts/BR-003/completion_status).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0158bwsSmCVUed6NqkpaQe7c"
```

---

## Self-Review Notları (yazım sonrası)

- **Spec kapsamı:** E6.1 (Set/BulkSetIntent) → B3; E7/E8 (ListRenewalCandidates + :set-intent uçları) → B1/B4; E9 (`students.renew`) → tüm query/komut attribute; E12.2 (reenroll port) → F4; E12.4 (stack) → F1/F2/F4. **3A dışı E6.2/E6.3 bilinçli ertelendi (3B).** ✅
- **Tip tutarlılığı:** `RenewalCandidatesResult`/`RenewalCandidateDto`/`BulkSetRenewalIntentResult`/`RenewalIntentValue` tüm task'larda aynı alan adlarıyla; BE enum string (`"Renewing"`) ↔ FE `RenewalIntentValue` birebir.
- **Bilinen doğrulama noktaları (implementer kod tabanından teyit eder):** `ICommandHandler<TCommand,TResult>` (Result<T>) arayüz tam adı; `IQueryHandler` namespace; `[Tenancy]`/`[RequirePermission]` namespace; `ClassRoom.Name` / `PersonName.First/Last` / `StudentProfile.StudentNumber`; `LifecycleScenario` seed factory çağrıları. Her biri ilgili task'ta "doğrula" notuyla işaretli.
- **Placeholder:** `RenewalScenario` seed gövdesi B1-Step1'de `LifecycleScenario`'dan doldurulur (NotImplementedException Step 3 öncesi kalkar) — bu kasıtlı "oku-ve-uyarla", boş placeholder değil.
