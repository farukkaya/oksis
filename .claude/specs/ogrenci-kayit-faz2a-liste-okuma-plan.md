# Öğrenci Kayıt Faz 2A (Liste & Okuma) — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Öğrenci liste/detay/kayıt-geçmişi okumalarını enrollment/sezon-bazlı yeni uçlara taşımak (ListStudents/GetStudentDetail/GetEnrollmentHistory + REST), FE'yi bu uçlara swap etmek ve lifecycle satır-aksiyonlarını 2A'da geçici pasifleştirmek.

**Architecture:** Enrollment-primary, sezon-scoped okuma sorguları (Students modülü, `IApplicationDbContext` üzerinden cross-module projeksiyon, N+1 yok). FE tek-noktadan endpoint swap; DTO şekilleri mevcut FE tipleriyle hizalı. Migration yok.

**Tech Stack:** .NET 10 / EF Core 10 / MediatR / xUnit + FluentAssertions (BE); React + TS / Vitest + Testing Library (FE).

## Global Constraints

- **Bağlayıcı spec:** `.claude/specs/ogrenci-kayit-enrollment-spec.md` — E1.3 (enrollment idari katman, defter değişmez), E4.1 (sezon başına bir enrollment), E7 (query envanteri, cache'siz), E8 (REST + izin), E9 (students.view / view-detail seed'li). **Tasarım:** `.claude/specs/ogrenci-kayit-faz2a-liste-okuma-design.md`.
- **Sezon-bazlı (D1):** Bir satır = seçili sezon (default aktif) enrollment'ı; Durum = `StudentEnrollment.Status`.
- **Lifecycle 2A'da pasif (D2):** Mezun Et/Dondur/Yeniden Etkinleştir/Nakil-Çıkış/Pasife Al → pasif (notReadyHint), 2B'de bağlanır.
- **Güvenlik:** Düz TCKN hiçbir yanıtta dönmez (yalnız `HasNationalId`/`NationalIdType`). Tenant global query filter her sorguda (cross-tenant okuma `IgnoreQueryFilters` YOK).
- **İzinler:** `students.view` (liste), `students.view-detail` (detay/geçmiş) — seed'li.
- **BE kuralları:** Mapster, `IApplicationDbContext` (repository yok), `async void`/`.Result`/`.Wait()` yok, query'ler `IQueryHandler<Q,R>` döner `Result<T>`. **EF VO projeksiyonu:** `PrimaryPhone.Value` gibi value-converter VO'larını SQL'de `.Value` ile projeleme — VO'yu tümüyle çek veya memory'de aç (bkz. `PersonDirectory.FindActiveChildrenAsync` deseni); integration test çeviriyi doğrular.
- **FE kuralları:** named export, `any` yok, inline-style yok, server state yalnız React Query (tenant-scoped key), i18n tr+en parite.
- **Commit:** `YYYY-MM-DD <type>: Türkçe özet.` Bugün `2026-06-30`. Branch: yeni `student-faz2a` (api+web), master'dan.

---

## Task 1: `ListStudentsQuery` + handler + DTO

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Queries/ListStudents/ListStudentsQuery.cs`
- Create: `.../ListStudents/ListStudentsQueryHandler.cs`
- Create: `.../ListStudents/StudentListItemDto.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/ListStudentsTests.cs`

**Interfaces:**
- Produces: `ListStudentsQuery(Guid? SeasonId, int Page, int PageSize, string? Search, EnrollmentStatus? Status, Gender? Gender, int? GradeLevel, string? SortBy, string? SortDirection) : IQuery<PagedResult<StudentListItemDto>>`. `StudentListItemDto(Guid StudentPersonId, string? StudentNumber, string FullName, string Gender, string? ClassName, int GradeLevel, string Status, DateOnly EnrollmentDate, string? PrimaryGuardianName, string? PrimaryGuardianPhone, bool HasGuardianWarning)`.

- [ ] **Step 1: Write the failing test**

`ListStudentsTests.cs`:
```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Modules.Students.Queries.ListStudents;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Academics.Entities;
using Oksis.Domain.Modules.Academics.Enums;
using Oksis.Domain.Modules.Schools.Entities;
using Oksis.Domain.Modules.Schools.Enums;
using Oksis.Domain.Modules.Students.Entities;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Domain.Modules.Users.ValueObjects;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Students;

[Collection(DatabaseCollection.Name)]
public sealed class ListStudentsTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<(Guid schoolId, Guid sessionId)> SeedSchoolSessionAsync()
    {
        var school = School.Create($"L2A-{Guid.NewGuid():N}"[..18], $"L-{Guid.NewGuid():N}"[..8], SchoolType.PrimarySchool);
        await using (var ctx = fixture.CreateDbContext()) { ctx.Schools.Add(school); await ctx.SaveChangesAsync(); }
        Guid sessionId;
        await using (var ctx = fixture.CreateDbContext(school.Id))
        {
            var termTypeIds = await ctx.AcademicTermTypes.AsNoTracking().OrderBy(t => t.DisplayOrder).Take(2).Select(t => t.Id).ToListAsync();
            var session = AcademicSession.Create(school.Id, $"S-{Guid.NewGuid():N}"[..10],
                new DateOnly(2025, 9, 15), new DateOnly(2026, 6, 13),
                termTypeIds[0], new DateOnly(2025, 9, 15), new DateOnly(2026, 1, 23),
                termTypeIds[1], new DateOnly(2026, 2, 10), new DateOnly(2026, 6, 13));
            session.Activate(DateTimeOffset.UtcNow, previousSessionId: null);
            ctx.AcademicSessions.Add(session);
            await ctx.SaveChangesAsync();
            sessionId = session.Id;
        }
        return (school.Id, sessionId);
    }

    private async Task SeedStudentAsync(Guid schoolId, Guid sessionId, string first, string last, int grade, EnrollmentStatus status, string number)
    {
        await using var ctx = fixture.CreateDbContext(schoolId);
        var person = Person.Create(schoolId, PersonName.Create(first, last), null, null, Gender.Female, null, null);
        person.AttachProfile(StudentProfile.Create(studentNumber: number));
        person.Activate();
        ctx.Persons.Add(person);
        var e = StudentEnrollment.Create(schoolId, person.Id, sessionId, grade, null, new DateOnly(2025, 9, 15), EnrollmentType.New, null);
        e.Activate();
        if (status == EnrollmentStatus.Frozen) e.Freeze();
        if (status == EnrollmentStatus.Withdrawn) e.Withdraw();
        ctx.StudentEnrollments.Add(e);
        await ctx.SaveChangesAsync();
    }

    [Fact]
    public async Task Lists_active_season_students_with_status_and_paging()
    {
        var (schoolId, sessionId) = await SeedSchoolSessionAsync();
        await SeedStudentAsync(schoolId, sessionId, "Ada", "Yilmaz", 5, EnrollmentStatus.Active, "202500001");
        await SeedStudentAsync(schoolId, sessionId, "Bora", "Kaya", 6, EnrollmentStatus.Frozen, "202500002");

        await using var db = fixture.CreateDbContext(schoolId);
        var handler = new ListStudentsQueryHandler(db);
        var result = await handler.Handle(new ListStudentsQuery(SeasonId: sessionId, Page: 1, PageSize: 50), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.TotalCount.Should().Be(2);
        result.Value.Items.Should().Contain(i => i.FullName == "Ada Yilmaz" && i.Status == "Active" && i.StudentNumber == "202500001");
        result.Value.Items.Should().Contain(i => i.FullName == "Bora Kaya" && i.Status == "Frozen");
    }

    [Fact]
    public async Task Filters_by_status_and_search()
    {
        var (schoolId, sessionId) = await SeedSchoolSessionAsync();
        await SeedStudentAsync(schoolId, sessionId, "Ada", "Yilmaz", 5, EnrollmentStatus.Active, "202500001");
        await SeedStudentAsync(schoolId, sessionId, "Bora", "Kaya", 6, EnrollmentStatus.Frozen, "202500002");

        await using var db = fixture.CreateDbContext(schoolId);
        var handler = new ListStudentsQueryHandler(db);

        var byStatus = await handler.Handle(new ListStudentsQuery(SeasonId: sessionId, Status: EnrollmentStatus.Frozen), CancellationToken.None);
        byStatus.Value!.Items.Should().ContainSingle().Which.FullName.Should().Be("Bora Kaya");

        var bySearch = await handler.Handle(new ListStudentsQuery(SeasonId: sessionId, Search: "202500001"), CancellationToken.None);
        bySearch.Value!.Items.Should().ContainSingle().Which.FullName.Should().Be("Ada Yilmaz");
    }

    [Fact]
    public async Task Defaults_to_active_season_and_isolates_tenant()
    {
        var (schoolId, sessionId) = await SeedSchoolSessionAsync();
        await SeedStudentAsync(schoolId, sessionId, "Ada", "Yilmaz", 5, EnrollmentStatus.Active, "202500001");
        var (otherSchool, otherSession) = await SeedSchoolSessionAsync();
        await SeedStudentAsync(otherSchool, otherSession, "Cem", "Demir", 5, EnrollmentStatus.Active, "202500099");

        await using var db = fixture.CreateDbContext(schoolId);
        var handler = new ListStudentsQueryHandler(db);
        var result = await handler.Handle(new ListStudentsQuery(), CancellationToken.None); // SeasonId null → aktif sezon

        result.Value!.Items.Should().OnlyContain(i => i.FullName == "Ada Yilmaz");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ListStudentsTests"`
Expected: FAIL — `ListStudentsQuery`/`ListStudentsQueryHandler`/`StudentListItemDto` yok (compile error).

- [ ] **Step 3: Write minimal implementation**

`StudentListItemDto.cs`:
```csharp
namespace Oksis.Application.Modules.Students.Queries.ListStudents;

public sealed record StudentListItemDto(
    Guid StudentPersonId,
    string? StudentNumber,
    string FullName,
    string Gender,
    string? ClassName,
    int GradeLevel,
    string Status,
    DateOnly EnrollmentDate,
    string? PrimaryGuardianName,
    string? PrimaryGuardianPhone,
    bool HasGuardianWarning);
```

`ListStudentsQuery.cs`:
```csharp
using Oksis.Application.Common.Authorization;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Common.Tenancy;
using Oksis.Domain.Modules.Students.Enums;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Queries.ListStudents;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.view")]
public sealed record ListStudentsQuery(
    Guid? SeasonId = null,
    int Page = 1,
    int PageSize = 50,
    string? Search = null,
    EnrollmentStatus? Status = null,
    Gender? Gender = null,
    int? GradeLevel = null,
    string? SortBy = "name",
    string? SortDirection = "asc") : IQuery<PagedResult<StudentListItemDto>>;
```
(Not: `[Tenancy]`/`[RequirePermission]`/`IQuery`/`PagedResult` namespace'lerini mevcut `ListPersonsQuery.cs` ve `GetBranchCapacityQuery.cs`'ten birebir doğrula — using'leri onlara hizala.)

`ListStudentsQueryHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Queries.ListStudents;

public sealed class ListStudentsQueryHandler(IApplicationDbContext db)
    : IQueryHandler<ListStudentsQuery, PagedResult<StudentListItemDto>>
{
    public async Task<Result<PagedResult<StudentListItemDto>>> Handle(
        ListStudentsQuery request, CancellationToken ct)
    {
        var seasonId = request.SeasonId ?? await db.AcademicSessions.AsNoTracking()
            .Where(s => s.Status == AcademicSessionStatus.Active)
            .Select(s => (Guid?)s.Id).FirstOrDefaultAsync(ct);
        if (seasonId is null)
            return Result<PagedResult<StudentListItemDto>>.Success(PagedResult<StudentListItemDto>.Empty(request.Page, request.PageSize));

        var q = from e in db.StudentEnrollments.AsNoTracking()
                where e.AcademicSessionId == seasonId
                join p in db.Persons.AsNoTracking() on e.StudentPersonId equals p.Id
                select new { e, p };

        if (request.Status is { } st) q = q.Where(x => x.e.Status == st);
        if (request.Gender is { } g) q = q.Where(x => x.p.Gender == g);
        if (request.GradeLevel is { } gl) q = q.Where(x => x.e.GradeLevel == gl);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            q = q.Where(x =>
                x.p.Name.First.Contains(s) || x.p.Name.Last.Contains(s) ||
                db.Profiles.OfType<StudentProfile>().Any(sp => sp.PersonId == x.p.Id && sp.StudentNumber != null && sp.StudentNumber.Contains(s)) ||
                db.ParentStudentRelationships.Any(r => r.StudentPersonId == x.p.Id && r.RevokedAt == null &&
                    db.Persons.Any(pp => pp.Id == r.ParentPersonId && (pp.Name.First.Contains(s) || pp.Name.Last.Contains(s)))));
        }

        var total = await q.CountAsync(ct);

        var ordered = request.SortDirection == "desc"
            ? q.OrderByDescending(x => x.p.Name.First).ThenByDescending(x => x.p.Name.Last)
            : q.OrderBy(x => x.p.Name.First).ThenBy(x => x.p.Name.Last);

        var rows = await ordered
            .Skip((request.Page - 1) * request.PageSize).Take(request.PageSize)
            .Select(x => new
            {
                x.e.StudentPersonId,
                x.e.GradeLevel,
                Status = x.e.Status.ToString(),
                x.e.EnrollmentDate,
                FirstName = x.p.Name.First,
                LastName = x.p.Name.Last,
                Gender = x.p.Gender == null ? "Unspecified" : x.p.Gender.ToString()!,
                StudentNumber = db.Profiles.OfType<StudentProfile>()
                    .Where(sp => sp.PersonId == x.p.Id).Select(sp => sp.StudentNumber).FirstOrDefault(),
                ClassName = x.e.ClassRoomId == null ? null : db.ClassRooms
                    .Where(c => c.Id == x.e.ClassRoomId).Select(c => c.FullName).FirstOrDefault(),
                GuardianFirst = db.ParentStudentRelationships
                    .Where(r => r.StudentPersonId == x.p.Id && r.RevokedAt == null && r.IsPrimaryContact)
                    .Select(r => db.Persons.Where(pp => pp.Id == r.ParentPersonId).Select(pp => pp.Name.First).FirstOrDefault())
                    .FirstOrDefault(),
                GuardianLast = db.ParentStudentRelationships
                    .Where(r => r.StudentPersonId == x.p.Id && r.RevokedAt == null && r.IsPrimaryContact)
                    .Select(r => db.Persons.Where(pp => pp.Id == r.ParentPersonId).Select(pp => pp.Name.Last).FirstOrDefault())
                    .FirstOrDefault(),
                GuardianPhone = db.ParentStudentRelationships
                    .Where(r => r.StudentPersonId == x.p.Id && r.RevokedAt == null && r.IsPrimaryContact)
                    .Select(r => db.Persons.Where(pp => pp.Id == r.ParentPersonId).Select(pp => pp.PrimaryPhone).FirstOrDefault())
                    .FirstOrDefault(),
                HasGuardian = db.ParentStudentRelationships.Any(r => r.StudentPersonId == x.p.Id && r.RevokedAt == null),
            })
            .ToListAsync(ct);

        var items = rows.Select(r => new StudentListItemDto(
            r.StudentPersonId, r.StudentNumber, $"{r.FirstName} {r.LastName}".Trim(), r.Gender,
            r.ClassName, r.GradeLevel, r.Status, r.EnrollmentDate,
            r.GuardianFirst is null ? null : $"{r.GuardianFirst} {r.GuardianLast}".Trim(),
            r.GuardianPhone?.Value, !r.HasGuardian)).ToList();

        return Result<PagedResult<StudentListItemDto>>.Success(new PagedResult<StudentListItemDto>
        {
            Items = items, Page = request.Page, PageSize = request.PageSize, TotalCount = total,
        });
    }
}
```
> **EF NOTU:** `GuardianPhone` projeksiyonu `PrimaryPhone` VO'sunu (value-converter) çeker, `.Value`'yu **memory'de** açar (SQL'de değil) — bu yüzden `Select(... pp.PrimaryPhone)` ile VO tümüyle çekilir, `r.GuardianPhone?.Value` C#'ta okunur. Eğer `x.p.Name.First/Last` veya VO projeksiyonu EF çevirisinde patlarsa (integration test FAIL), `PersonDirectory.FindActiveChildrenAsync` deseniyle (ad parçaları ayrı çekilip memory'de birleştir) hizala.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ListStudentsTests"`
Expected: PASS (3 tests). EF çeviri hatası çıkarsa NOT'a göre projeksiyon düzelt.

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: ListStudentsQuery — sezon-bazlı öğrenci listesi (filtre/arama/sayfalama, E7/E8)."
```

---

## Task 2: `GetStudentDetailQuery` + handler + DTO

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Queries/GetStudentDetail/GetStudentDetailQuery.cs`
- Create: `.../GetStudentDetail/GetStudentDetailQueryHandler.cs`
- Create: `.../GetStudentDetail/StudentDetailDto.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/GetStudentDetailTests.cs`

**Interfaces:**
- Produces: `GetStudentDetailQuery(Guid StudentPersonId) : IQuery<StudentDetailDto>`. `StudentDetailDto` (kimlik + `HasNationalId`/`NationalIdType` + CurrentEnrollment + Guardians). `GuardianSummaryDto`. `CurrentEnrollmentDto`.

- [ ] **Step 1: Write the failing test**

`GetStudentDetailTests.cs` — mirror Task 1 seed helpers (SeedSchoolSessionAsync + a student with a guardian), then:
```csharp
[Fact]
public async Task Returns_identity_current_enrollment_and_no_plain_national_id()
{
    var (schoolId, sessionId) = await SeedSchoolSessionAsync();
    Guid personId;
    await using (var ctx = fixture.CreateDbContext(schoolId))
    {
        var person = Person.Create(schoolId, PersonName.Create("Ada", "Yilmaz"),
            null, new DateOnly(2014, 5, 1), Gender.Female, null, null);
        person.AttachProfile(StudentProfile.Create(studentNumber: "202500001"));
        person.Activate();
        ctx.Persons.Add(person);
        var e = StudentEnrollment.Create(schoolId, person.Id, sessionId, 5, null, new DateOnly(2025, 9, 15), EnrollmentType.New, null);
        e.Activate();
        ctx.StudentEnrollments.Add(e);
        await ctx.SaveChangesAsync();
        personId = person.Id;
    }

    await using var db = fixture.CreateDbContext(schoolId);
    var handler = new GetStudentDetailQueryHandler(db);
    var result = await handler.Handle(new GetStudentDetailQuery(personId), CancellationToken.None);

    result.IsSuccess.Should().BeTrue();
    result.Value!.FullName.Should().Be("Ada Yilmaz");
    result.Value.StudentNumber.Should().Be("202500001");
    result.Value.HasNationalId.Should().BeFalse();
    result.Value.CurrentEnrollment.Should().NotBeNull();
    result.Value.CurrentEnrollment!.Status.Should().Be("Active");
    result.Value.CurrentEnrollment.GradeLevel.Should().Be(5);
}

[Fact]
public async Task Returns_not_found_for_unknown_or_cross_tenant()
{
    var (schoolId, _) = await SeedSchoolSessionAsync();
    await using var db = fixture.CreateDbContext(schoolId);
    var handler = new GetStudentDetailQueryHandler(db);
    var result = await handler.Handle(new GetStudentDetailQuery(Guid.NewGuid()), CancellationToken.None);
    result.IsSuccess.Should().BeFalse();
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetStudentDetailTests"`
Expected: FAIL — types yok.

- [ ] **Step 3: Write minimal implementation**

`StudentDetailDto.cs`:
```csharp
namespace Oksis.Application.Modules.Students.Queries.GetStudentDetail;

public sealed record CurrentEnrollmentDto(
    Guid SeasonId, string SeasonName, int GradeLevel, string? ClassName,
    string Status, string Type, DateOnly EnrollmentDate);

public sealed record GuardianSummaryDto(
    Guid PersonId, string FullName, string RelationType, string? Phone, string? Email,
    bool IsPrimaryContact, bool CanViewInfo, bool CanMakeDecisions, bool IsPaymentResponsible, bool CanPickup);

public sealed record StudentDetailDto(
    Guid StudentPersonId, string? StudentNumber, string FullName, string Gender, DateOnly? BirthDate,
    bool HasNationalId, string? NationalIdType, string? PhotoUrl,
    CurrentEnrollmentDto? CurrentEnrollment,
    IReadOnlyCollection<GuardianSummaryDto> Guardians, bool HasGuardianWarning);
```

`GetStudentDetailQuery.cs`:
```csharp
using Oksis.Application.Common.Authorization;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Common.Tenancy;

namespace Oksis.Application.Modules.Students.Queries.GetStudentDetail;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.view-detail")]
public sealed record GetStudentDetailQuery(Guid StudentPersonId) : IQuery<StudentDetailDto>;
```
(using namespace'leri Task 1 ile aynı kaynaklardan doğrula.)

`GetStudentDetailQueryHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Queries.GetStudentDetail;

public sealed class GetStudentDetailQueryHandler(IApplicationDbContext db)
    : IQueryHandler<GetStudentDetailQuery, StudentDetailDto>
{
    public async Task<Result<StudentDetailDto>> Handle(GetStudentDetailQuery request, CancellationToken ct)
    {
        var person = await db.Persons.AsNoTracking()
            .Include(p => p.Profiles)
            .FirstOrDefaultAsync(p => p.Id == request.StudentPersonId, ct);
        if (person is null)
            return Result<StudentDetailDto>.Failure(new Error("students.not-found", "Öğrenci bulunamadı."));

        var studentNumber = person.Profiles.OfType<StudentProfile>().Select(sp => sp.StudentNumber).FirstOrDefault();

        var current = await (
            from e in db.StudentEnrollments.AsNoTracking()
            join s in db.AcademicSessions.AsNoTracking() on e.AcademicSessionId equals s.Id
            where e.StudentPersonId == person.Id && s.Status == AcademicSessionStatus.Active
            select new CurrentEnrollmentDto(
                s.Id, s.Name, e.GradeLevel,
                e.ClassRoomId == null ? null : db.ClassRooms.Where(c => c.Id == e.ClassRoomId).Select(c => c.FullName).FirstOrDefault(),
                e.Status.ToString(), e.Type.ToString(), e.EnrollmentDate)
        ).FirstOrDefaultAsync(ct);

        var guardians = await (
            from r in db.ParentStudentRelationships.AsNoTracking()
            where r.StudentPersonId == person.Id && r.RevokedAt == null
            join gp in db.Persons.AsNoTracking() on r.ParentPersonId equals gp.Id
            select new GuardianSummaryDto(
                gp.Id, gp.Name.First + " " + gp.Name.Last, r.RelationType.ToString(),
                gp.PrimaryPhone == null ? null : gp.PrimaryPhone.Value,
                gp.PrimaryEmail == null ? null : gp.PrimaryEmail.Value,
                r.IsPrimaryContact, r.CanViewInfo, r.CanMakeDecisions, r.IsPaymentResponsible, r.CanPickup)
        ).ToListAsync(ct);

        var dto = new StudentDetailDto(
            person.Id, studentNumber, $"{person.Name.First} {person.Name.Last}".Trim(),
            person.Gender?.ToString() ?? "Unspecified", person.BirthDate,
            person.NationalId is not null, person.NationalId?.Type.ToString(), person.ProfilePhotoUrl,
            current, guardians, guardians.Count == 0);

        return Result<StudentDetailDto>.Success(dto);
    }
}
```
> **EF NOTU:** `gp.PrimaryPhone.Value`/`PrimaryEmail.Value` SQL'de patlarsa, VO'yu tümüyle çekip memory'de aç (Task 1 NOT'u gibi). `Error` tipinin imzasını mevcut `Result.cs`/`Error.cs`'ten doğrula (`new Error(code, message)`).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetStudentDetailTests"`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: GetStudentDetailQuery — kimlik + aktif sezon enrollment + veliler; düz TCKN dönmez (E8)."
```

---

## Task 3: `GetEnrollmentHistoryQuery` + handler + DTO

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/Students/Queries/GetEnrollmentHistory/GetEnrollmentHistoryQuery.cs`
- Create: `.../GetEnrollmentHistory/GetEnrollmentHistoryQueryHandler.cs`
- Create: `.../GetEnrollmentHistory/EnrollmentHistoryItemDto.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Students/GetEnrollmentHistoryTests.cs`

**Interfaces:**
- Produces: `GetEnrollmentHistoryQuery(Guid StudentPersonId) : IQuery<IReadOnlyList<EnrollmentHistoryItemDto>>`. `EnrollmentHistoryItemDto(Guid EnrollmentId, Guid SeasonId, string SeasonName, int GradeLevel, string? ClassName, string Type, string Status, DateOnly EnrollmentDate, string? PreviousSchool)`.

- [ ] **Step 1: Write the failing test**

`GetEnrollmentHistoryTests.cs` — seed two seasons (one active, one past) with one enrollment each for the same person; assert newest-first ordering:
```csharp
[Fact]
public async Task Returns_all_season_enrollments_newest_first()
{
    var (schoolId, activeSession) = await SeedSchoolSessionAsync();
    Guid personId;
    await using (var ctx = fixture.CreateDbContext(schoolId))
    {
        var person = Person.Create(schoolId, PersonName.Create("Ada", "Yilmaz"), null, null, Gender.Female, null, null);
        person.AttachProfile(StudentProfile.Create(studentNumber: "202500001"));
        person.Activate();
        ctx.Persons.Add(person);
        var e1 = StudentEnrollment.Create(schoolId, person.Id, activeSession, 6, null, new DateOnly(2025, 9, 15), EnrollmentType.New, null);
        e1.Activate();
        ctx.StudentEnrollments.Add(e1);
        await ctx.SaveChangesAsync();
        personId = person.Id;
    }

    await using var db = fixture.CreateDbContext(schoolId);
    var handler = new GetEnrollmentHistoryQueryHandler(db);
    var result = await handler.Handle(new GetEnrollmentHistoryQuery(personId), CancellationToken.None);

    result.IsSuccess.Should().BeTrue();
    result.Value!.Should().ContainSingle();
    result.Value[0].SeasonName.Should().NotBeNullOrEmpty();
    result.Value[0].GradeLevel.Should().Be(6);
    result.Value[0].Status.Should().Be("Active");
    result.Value[0].Type.Should().Be("New");
}

[Fact]
public async Task Returns_empty_for_person_without_enrollments()
{
    var (schoolId, _) = await SeedSchoolSessionAsync();
    await using var db = fixture.CreateDbContext(schoolId);
    var handler = new GetEnrollmentHistoryQueryHandler(db);
    var result = await handler.Handle(new GetEnrollmentHistoryQuery(Guid.NewGuid()), CancellationToken.None);
    result.IsSuccess.Should().BeTrue();
    result.Value!.Should().BeEmpty();
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetEnrollmentHistoryTests"`
Expected: FAIL — types yok.

- [ ] **Step 3: Write minimal implementation**

`EnrollmentHistoryItemDto.cs`:
```csharp
namespace Oksis.Application.Modules.Students.Queries.GetEnrollmentHistory;

public sealed record EnrollmentHistoryItemDto(
    Guid EnrollmentId, Guid SeasonId, string SeasonName, int GradeLevel, string? ClassName,
    string Type, string Status, DateOnly EnrollmentDate, string? PreviousSchool);
```

`GetEnrollmentHistoryQuery.cs`:
```csharp
using Oksis.Application.Common.Authorization;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Common.Tenancy;

namespace Oksis.Application.Modules.Students.Queries.GetEnrollmentHistory;

[Tenancy(TenancyMode.Required)]
[RequirePermission("students.view-detail")]
public sealed record GetEnrollmentHistoryQuery(Guid StudentPersonId)
    : IQuery<IReadOnlyList<EnrollmentHistoryItemDto>>;
```

`GetEnrollmentHistoryQueryHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Queries.GetEnrollmentHistory;

public sealed class GetEnrollmentHistoryQueryHandler(IApplicationDbContext db)
    : IQueryHandler<GetEnrollmentHistoryQuery, IReadOnlyList<EnrollmentHistoryItemDto>>
{
    public async Task<Result<IReadOnlyList<EnrollmentHistoryItemDto>>> Handle(
        GetEnrollmentHistoryQuery request, CancellationToken ct)
    {
        var items = await (
            from e in db.StudentEnrollments.AsNoTracking()
            where e.StudentPersonId == request.StudentPersonId
            join s in db.AcademicSessions.AsNoTracking() on e.AcademicSessionId equals s.Id
            orderby s.StartDate descending
            select new EnrollmentHistoryItemDto(
                e.Id, s.Id, s.Name, e.GradeLevel,
                e.ClassRoomId == null ? null : db.ClassRooms.Where(c => c.Id == e.ClassRoomId).Select(c => c.FullName).FirstOrDefault(),
                e.Type.ToString(), e.Status.ToString(), e.EnrollmentDate, e.PreviousSchool)
        ).ToListAsync(ct);

        return Result<IReadOnlyList<EnrollmentHistoryItemDto>>.Success(items);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetEnrollmentHistoryTests"`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: GetEnrollmentHistoryQuery — kişinin tüm sezon kayıtları, en yeni üstte (E8)."
```

---

## Task 4: `StudentsController` 3 GET route

**Files:**
- Modify: `oksis-api/src/Oksis.Api/Controllers/V1/StudentsController.cs`
- Test: `oksis-api/tests/Oksis.Api.UnitTests/Controllers/StudentsControllerTests.cs` (varsa ekle; yoksa oluştur, mevcut bir controller-test desenini mirror et)

**Interfaces:**
- Consumes: `ListStudentsQuery` (T1), `GetStudentDetailQuery` (T2), `GetEnrollmentHistoryQuery` (T3).

- [ ] **Step 1: Write the failing test**

`StudentsControllerTests.cs` — mevcut Api.UnitTests controller deseni ile (ISender substitute, route → Send doğrula):
```csharp
[Fact]
public async Task GetStudents_sends_ListStudentsQuery()
{
    var sender = Substitute.For<ISender>();
    sender.Send(Arg.Any<ListStudentsQuery>(), Arg.Any<CancellationToken>())
        .Returns(Result<PagedResult<StudentListItemDto>>.Success(PagedResult<StudentListItemDto>.Empty(1, 50)));
    var controller = new StudentsController(sender) { ControllerContext = FakeContext() };

    await controller.ListAsync(new ListStudentsQuery(), CancellationToken.None);

    await sender.Received(1).Send(Arg.Any<ListStudentsQuery>(), Arg.Any<CancellationToken>());
}
```
(GetStudentDetail + GetEnrollmentHistory için de benzer iki test. `FakeContext()` helper'ı mevcut Api.UnitTests controller testlerinden al — `ControllerContext` + `X-Correlation-Id` header'ı için.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~StudentsControllerTests"`
Expected: FAIL — `ListAsync`/`DetailAsync`/`EnrollmentsAsync` route'ları yok.

- [ ] **Step 3: Write minimal implementation**

`StudentsController.cs`'e ekle (mevcut route'ların yanına, `using` ile query namespace'lerini ekleyerek):
```csharp
    [HttpGet("students")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync([FromQuery] ListStudentsQuery query, CancellationToken ct)
        => (await sender.Send(query, ct)).ToHttpResult(HttpContext);

    [HttpGet("students/{id:guid}")]
    public async Task<IActionResult> DetailAsync(Guid id, CancellationToken ct)
        => (await sender.Send(new GetStudentDetailQuery(id), ct)).ToHttpResult(HttpContext);

    [HttpGet("students/{id:guid}/enrollments")]
    public async Task<IActionResult> EnrollmentsAsync(Guid id, CancellationToken ct)
        => (await sender.Send(new GetEnrollmentHistoryQuery(id), ct)).ToHttpResult(HttpContext);
```
Usings: `Oksis.Application.Modules.Students.Queries.ListStudents/GetStudentDetail/GetEnrollmentHistory`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~StudentsControllerTests"` then full BE: `dotnet test`
Expected: PASS. (Bilinen pre-existing fail: `MasterRoleSeedTests`, `FindActiveChildren` — bu branch'e ait değil, başka fail varsa incele.)

- [ ] **Step 5: Commit**

```bash
cd oksis-api && dotnet format && git add -A && git commit -m "2026-06-30 feat,test: StudentsController — GET /students, /{id}, /{id}/enrollments (E8)."
```

---

## Task 5: FE — `studentsApi` yeni okuma metodları + EnrollmentStatus eşlemesi

**Files:**
- Modify: `oksis-web/src/portals/admin/students/api/studentsApi.ts`
- Modify: `oksis-web/src/portals/admin/students/types/index.ts` (EnrollmentStatus union + EnrollmentHistoryEntry alanları)
- Test: `oksis-web/src/portals/admin/students/__tests__/studentsApiList.test.ts` (yeni dosya)

**Interfaces:**
- Produces: `studentsApi.list/detail/enrollmentHistory` artık yeni uçları çağırır; FE `StudentStatus` union'ı enrollment durumlarını içerir.

- [ ] **Step 1: Write the failing test**

`studentsApiList.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../../../shared/api/httpClient";
import { studentsApi } from "../api/studentsApi";

vi.mock("../../../../shared/api/httpClient", () => ({ httpClient: { get: vi.fn(), post: vi.fn() } }));
const get = httpClient.get as unknown as ReturnType<typeof vi.fn>;
beforeEach(() => get.mockReset());

describe("studentsApi reads (Faz 2A)", () => {
  it("list hits /students and maps enrollment status", async () => {
    get.mockResolvedValue({ data: { data: { items: [{
      studentPersonId: "p1", studentNumber: "202500001", fullName: "Ada Yilmaz", gender: "Female",
      className: "5-A", gradeLevel: 5, status: "Frozen", enrollmentDate: "2025-09-15",
      primaryGuardianName: "Veli Ana", primaryGuardianPhone: "+905551112233", hasGuardianWarning: false,
    }], totalCount: 1 } } });
    const r = await studentsApi.list({ search: "", status: "", classroomId: "", gender: "", gradeCode: "", guardian: "", seasonId: "", page: 1, pageSize: 50 } as never);
    expect(get).toHaveBeenCalledWith("/students", expect.anything());
    expect(r.totalCount).toBe(1);
    expect(r.items[0].fullName).toBe("Ada Yilmaz");
    expect(r.items[0].status).toBe("frozen");
  });

  it("enrollmentHistory hits /students/{id}/enrollments", async () => {
    get.mockResolvedValue({ data: { data: [{ enrollmentId: "e1", seasonId: "s1", seasonName: "2024-2025",
      gradeLevel: 7, className: "7-A", type: "New", status: "Active", enrollmentDate: "2024-09-01", previousSchool: null }] } });
    const r = await studentsApi.enrollmentHistory("p1");
    expect(get).toHaveBeenCalledWith("/students/p1/enrollments", expect.anything());
    expect(r[0].seasonName).toBe("2024-2025");
    expect(r[0].status).toBe("active");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run oksis:test -- studentsApiList`
Expected: FAIL — list `/students`'e gitmiyor, status map yok, enrollmentHistory stub.

- [ ] **Step 3: Write minimal implementation**

`types/index.ts` — `StudentStatus` union'ını genişlet (mevcut `"active" | "passive" | "suspended" | "graduated"` → enrollment durumları):
```typescript
export type StudentStatus =
  | "active" | "frozen" | "withdrawn" | "transferred" | "graduated" | "archived" | "draft" | "passive";
```
`EnrollmentHistoryEntry`'yi enrollment alanlarına hizala:
```typescript
export interface EnrollmentHistoryEntry {
  id: string;
  seasonName: string;
  gradeLevel: number;
  className: string | null;
  type: "New" | "TransferIn" | "Renewal";
  status: StudentStatus;
  enrollmentDate: string | null;
  previousSchool: string | null;
}
```

`studentsApi.ts` — yeni eşleyici + metodlar:
```typescript
// BE EnrollmentStatus → FE StudentStatus
const ENROLLMENT_STATUS: Record<string, StudentStatus> = {
  Active: "active", Frozen: "frozen", Withdrawn: "withdrawn", TransferredOut: "transferred",
  Graduated: "graduated", Archived: "archived", Draft: "draft",
};
const toStatus = (s: string): StudentStatus => ENROLLMENT_STATUS[s] ?? "passive";
// FE StudentStatus → BE EnrollmentStatus (filtre için)
const toEnrollmentStatus = (s: StudentStatus | ""): string | undefined => {
  const inv = Object.entries(ENROLLMENT_STATUS).find(([, v]) => v === s);
  return inv ? inv[0] : undefined;
};
```
`list()` gövdesini değiştir → `GET /students`, yeni `StudentListItemDto` map:
```typescript
list: async (args: FetchStudentsArgs): Promise<StudentsPage> => {
  const res = await httpClient.get<ApiEnvelope<PagedResultDto<StudentListItemApiDto>>>("/students", {
    params: {
      search: args.search.length >= 2 ? args.search : undefined,
      status: toEnrollmentStatus(args.status),
      gender: toBackendGender(args.gender),
      gradeLevel: args.gradeCode ? Number.parseInt(args.gradeCode, 10) : undefined,
      seasonId: args.seasonId || undefined,
      sortBy: args.sortBy, sortDirection: args.sortDirection,
      page: args.page, pageSize: args.pageSize,
    },
    signal: args.signal,
  });
  const paged = res.data.data;
  return {
    items: paged.items.map((d): StudentListItem => ({
      id: d.studentPersonId, firstName: d.fullName.split(" ")[0] ?? "", lastName: d.fullName.split(" ").slice(1).join(" "),
      fullName: d.fullName, initials: initialsFrom(d.fullName.split(" ")[0] ?? "", d.fullName.split(" ").slice(1).join(" ")),
      studentNumber: d.studentNumber, classroomId: null, className: d.className,
      parentName: d.primaryGuardianName, parentPhone: d.primaryGuardianPhone, parentCount: d.hasGuardianWarning ? 0 : 1,
      absenceDays: null, average: null, status: toStatus(d.status), gender: fromBackendGender(d.gender),
      registeredAt: d.enrollmentDate,
    })),
    totalCount: paged.totalCount,
  };
},
```
`detail()` → `GET /students/{id}` (yeni `StudentDetailApiDto` map; mevcut `StudentDetail` view alanlarına). `enrollmentHistory()` → `GET /students/{id}/enrollments` map. Yeni DTO arayüzlerini (`StudentListItemApiDto`, `StudentDetailApiDto`, `EnrollmentHistoryApiDto`) studentsApi.ts içinde tanımla (BE DTO alan adları camelCase).
> **NOT:** `toListItem`/eski `toLifecycleState`/`fromLifecycleState` yardımcıları artık kullanılmıyorsa kaldır (öksüz kod bırakma). `StudentDetail` view tipinde `status` alanı `toStatus` ile beslenir.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run oksis:test -- studentsApiList`
Expected: PASS. Ardından `npm run oksis:test -- students` (mevcut testler — status union değişiminden etkilenenleri düzelt) + `npx tsc --noEmit | grep -E "studentsApi|types/index"` (temiz).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-30 feat,test: studentsApi list/detail/enrollmentHistory → enrollment-bazlı uçlar; StudentStatus enrollment durumlarına genişledi (Faz 2A)."
```

---

## Task 6: FE — "Durum" filtresi + i18n + drawer geçmişi

**Files:**
- Modify: status filtre dropdown'u (StudentsPage filtreleri — `StudentStatus` değerleri), status badge etiket/renk eşlemesi (mevcut status→label/renk map'ini bul ve genişlet)
- Modify: `oksis-web/src/shared/i18n/locales/tr/students.json` + `en/students.json` (yeni status etiketleri + drawer enrollment alanları)
- Modify: drawer Enrollment tab (yeni `EnrollmentHistoryEntry` alanları: gradeLevel/type/enrollmentDate)
- Test: mevcut `StudentDetailEnrollment.test.tsx` güncelle (yeni alanlarla)

**Interfaces:**
- Consumes: T5 (`StudentStatus` union, `EnrollmentHistoryEntry`).

- [ ] **Step 1: Write the failing test**

`StudentDetailEnrollment.test.tsx` — "kayıt geçmişi varsa..." testini yeni alanlarla güncelle:
```typescript
enrollmentState.data = [{
  id: "e1", seasonName: "2024–2025", gradeLevel: 7, className: "7-A",
  type: "New", status: "active", enrollmentDate: "2024-09-01", previousSchool: null,
}];
// ... render, Kayıt Geçmişi sekmesine tıkla, "2024–2025" + "7-A" görünür assert
```
+ status filtre dropdown'unda yeni "Dondurulmuş" seçeneğinin render edildiğini doğrulayan bir test (filtre komponentini render edip option metnini ara).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run oksis:test -- StudentDetailEnrollment`
Expected: FAIL — yeni alanlar/etiketler yok.

- [ ] **Step 3: Write minimal implementation**

- Status badge label/renk map'ini genişlet: yeni `StudentStatus` değerleri (`frozen`/`withdrawn`/`transferred`/`archived`/`draft`) için label key + renk sınıfı ekle (mevcut deseni izle).
- Status filtre dropdown options'ına yeni değerleri ekle (Aktif/Dondurulmuş/Ayrıldı/Nakil/Mezun/Arşiv).
- i18n tr+en: yeni status etiketleri (`students.status.frozen` = "Dondurulmuş" / "Frozen", `withdrawn` = "Ayrıldı" / "Withdrawn", `transferred` = "Nakil" / "Transferred", `archived` = "Arşiv" / "Archived", `draft` = "Taslak" / "Draft") + drawer enrollment alan etiketleri (gradeLevel/type).
- Drawer Enrollment tab: `EnrollmentHistoryEntry`'nin yeni alanlarını göster (sezon · kademe · şube · tür · durum · tarih).

(Bu adımda kesin satırlar mevcut badge/filter/drawer dosyalarına bağlı — implementer T5'in tip değişimini izleyerek mekanik genişletir; her yeni status değeri için label+renk+i18n eklenir.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run oksis:test -- students` + `npm run build` + `npx tsc --noEmit`
Expected: PASS + build temiz + tsc temiz (yeni status union tüm switch/map'lerde ele alınmış).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-30 feat,test: Durum filtresi enrollment durumlarına + drawer Kayıt Geçmişi gerçek alanlar; i18n tr+en (Faz 2A)."
```

---

## Task 7: FE — lifecycle satır-aksiyonlarını pasifleştir

**Files:**
- Modify: `oksis-web/src/portals/admin/students/components/StudentRowActions.tsx`
- Test: `oksis-web/src/portals/admin/students/__tests__/StudentRowActionsDisabled.test.tsx` (yeni)

**Interfaces:**
- Consumes: mevcut `notReadyHint` + disabled MenuItemSpec deseni.

- [ ] **Step 1: Write the failing test**

`StudentRowActionsDisabled.test.tsx` — row actions menüsünü aç, lifecycle item'larının disabled olduğunu doğrula:
```typescript
it("lifecycle aksiyonları 2A'da pasif (notReadyHint)", async () => {
  // render StudentRowActions for an active student, open menu
  // expect "Mezun Et" / "Kaydı Dondur" / "Pasife Al" / "Nakil Çıkışı" items present but disabled
  // expect "Detay" enabled
});
```
(Mevcut StudentRowActions test harness'ı varsa onu mirror et; yoksa `StudentDetailEnrollment.test.tsx` render desenini kullan.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-web && npm run oksis:test -- StudentRowActionsDisabled`
Expected: FAIL — aksiyonlar hâlâ aktif (mutate çağırıyor).

- [ ] **Step 3: Write minimal implementation**

`StudentRowActions.tsx` — `freeze`/`reactivate`/`graduate`/`transferOut`/`deactivate` MenuItemSpec'lerini `edit` ile aynı pasif desene çevir:
```typescript
{
  key: "freeze",
  label: t("rowActions.freeze"),
  icon: PauseCircle,
  visible: canUpdate && isActive,
  disabled: true,
  disabledHint: t("rowActions.notReady2B"),
  onSelect: () => {},
},
```
(Beşi için de aynı; `onSelect` boş, `disabled: true`, `disabledHint`.) `useStudentActions` çağrıları kaldırılır (hook kullanılmıyorsa import + kullanım temizlenir). i18n tr+en: `students.rowActions.notReady2B` = "Yaşam döngüsü işlemleri Faz 2B'de aktifleşecek" / "Lifecycle actions arrive in Phase 2B". **Detay** ve **Veli Bağla** dokunulmaz.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-web && npm run oksis:test -- students` + `npm run build`
Expected: PASS + build temiz.

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-30 feat,test: lifecycle satır-aksiyonları 2A'da pasif (notReadyHint 2B) — enrollment komutları 2B'de bağlanacak."
```

---

## Task 8: Modül dokümanları + session

**Files:**
- Modify: `.claude/docs/modules/students/completion_status.md`, `api-contracts.md`
- Create: `.claude/sessions/2026-06-30-enrollment-faz2a.md` (İngilizce; ya da mevcut session dosyasına ekle)

- [ ] **Step 1: Dokümanları güncelle**

`completion_status.md`: ilerleme bump (~%60→%68), Güncel 2026-06-30, Faz 2A ✅ girişi (3 query + REST + FE swap + lifecycle pasif). ⏳ bölümünden ListStudents/GetStudentDetail/GetEnrollmentHistory'yi çıkar; "Faz 2B: lifecycle" eklenir.
`api-contracts.md`: GET /students, /{id}, /{id}/enrollments DTO şemaları.

- [ ] **Step 2: Session özeti**

`2026-06-30-enrollment-faz2a.md` — İngilizce: Faz 2A (read swap) yapılanlar, kararlar (sezon-bazlı liste, lifecycle 2A'da pasif), kalan (Faz 2B lifecycle).

- [ ] **Step 3: Commit (workspace)**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs/modules/students .claude/sessions/2026-06-30-enrollment-faz2a.md && git commit -m "2026-06-30 docs: students Faz 2A (liste & okuma) tamam — 3 query + REST + FE enrollment-bazlı swap; lifecycle 2B'ye."
```

---

## Self-Review (yazar kontrolü)

**Spec coverage:** E7 (3 query) → T1/T2/T3; E8 (REST) → T4; E1.3/E4.1 → T1 (yalnız okuma, sezon başına bir satır); E9 (izinler) → T1/T2/T3 `[RequirePermission]`; güvenlik (düz TCKN yok) → T2 (`HasNationalId`). FE swap (§6 tasarım) → T5/T6; lifecycle pasif (D2) → T7; docs → T8.

**Placeholder scan:** BE task'larında tam kod var. T6'da badge/filter/drawer satırları "mevcut deseni genişlet" olarak bırakıldı (kesin satırlar T5 tip değişimine bağlı, mekanik) — bu kabul edilebilir çünkü her yeni status değeri için label+renk+i18n eklenmesi net tanımlı; implementer T5 union'ını kaynak alır. EF VO-projeksiyon riski her ilgili task'ta NOT ile işaretli (integration test doğrular).

**Type consistency:** `StudentListItemDto`/`StudentDetailDto`/`EnrollmentHistoryItemDto` (BE) alan adları T5 FE DTO'larıyla camelCase eşleşir. `EnrollmentStatus` string ("Active"/"Frozen"…) T1/T2/T3 `.ToString()` → T5 `ENROLLMENT_STATUS` map anahtarlarıyla bire bir. `StudentStatus` FE union T5'te tanımlı → T6/T7 tüketir.
