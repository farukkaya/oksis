# Vekâlet İş Akışı — Backend Implementation Plan (Faz 4 / Dilim 2b)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend for the substitution (vekâlet) workflow on top of the existing Faz 2.5 `ScheduleException` core: an ad-hoc "today's substitution board" query, a ranked substitute-candidate query (free + branch-fit + fairness + vekil-vekil exclusion), and create / study-hall / revoke commands — all behind `/api/v1/duties/substitution/*`, gated by `duties.substitute`. **No new aggregate.**

**Architecture:** New Application slices under `Oksis.Application/Modules/Duties/Substitution/` that read the published schedule + existing `ScheduleException` (TeacherSubstitution / Cancellation) and create/revoke those exceptions **directly in-domain** (not via the `timetable.override`-gated `CreateScheduleExceptionCommand`). Candidate ranking reuses P28's structural free-set, **closes the vekil-vekil same-slot debt**, derives branch-fit from `Subject.Category` + `TeachingAssignment` + `BranchMatching`, and computes this-week substitution load from `ScheduleExceptions`. Availability (Dilim 1) is **never consulted** (K-2a-2). Notification is already automatic via `ScheduleExceptionCreatedEvent`.

**Tech Stack:** .NET 10, C# 13, EF Core 10, MediatR, FluentValidation, Mapster, SQL Server, xUnit.

**Design doc:** `.claude/specs/ders-programi-faz4-dilim2b-vekalet-design.md`
**Prior slice:** `.claude/specs/ders-programi-faz4-dilim2a-nobet-cizelge-plan-be.md` (Duties module + `duties.substitute` permission already seeded)
**Handoff:** `.claude/design-handoffs/schedule_duty/duty_admin_more.jsx` (`DtaVekalet`/`DtmLesson`/`DtmCandidate`)

## Global Constraints

- Working dir: `oksis-api/`. Solution: `Oksis.slnx`. All paths relative to `oksis-api/`.
- Multi-tenant: `IHasTenant` global query filter applies to `ScheduleException`, `SchedulePrograms`, `Persons`, `Subjects`, `TeachingAssignments` automatically; never `IgnoreQueryFilters()`. Resolve `tenant.CurrentSchoolId` and `Forbidden()` if null (matches every existing handler).
- **Permission EXACT `duties.substitute`** on every slice (`[RequirePermission("duties.substitute")]`). The permission is already defined + role-seeded (2a Task 8: SchoolAdmin only). Do NOT add a new permission.
- **No new aggregate.** Reuse `ScheduleException` (Faz 2.5). The substitution commands create/revoke `ScheduleException` **directly** (handler builds `ScheduleException.Create(...)` / calls `.Revoke(...)`), NOT by sending the existing `CreateScheduleExceptionCommand` (which is `timetable.override`-gated). Authority equivalence is by design (K-2b-3).
- **K-2a-2 (CRITICAL):** never query `TeacherAvailabilities` anywhere in substitution logic.
- **K-2b-6 (CRITICAL):** `GetAvailableSubstitutes` MUST exclude a teacher who already has an active `ScheduleException` of type `TeacherSubstitution` at the **same date + (day,period)** — closes P28's documented vekil-vekil debt. Dedicated test required.
- **FullName rule (CRITICAL — this caused a runtime crash in 2a):** NEVER project `Person.Name.FullName` inside an EF Core `Select` (`FullName` is `Ignore`d/computed). Materialize `p.Name` first (`.Select(p => new { p.Id, p.Name }).ToListAsync()`) then read `.FullName` in memory. (Note: the existing P28 `GetAvailableTeachersQueryHandler` line 56 projects `p.Name.FullName` inside the Select — do NOT copy that; it shares the latent bug. Use the safe pattern.)
- **Branch-fit from existing data only (K-2b-4):** `BranchMatching.IsMatch(teacherBranch, subjectName)` (exists, `Modules/Teachers/TeachingAssignments/Internal/BranchMatching.cs`) for "Same"; `Subject.Category` overlap (via the candidate's `TeachingAssignment.SubjectId` → `Subject.Category`) for "Near". No new seed/config.
- **TransactionBehavior gotcha:** it commits on a non-exception return and rolls back only on a thrown exception. Validate BEFORE any destructive write; never `return Result.Conflict(...)` after a committed mutation. (Substitution create/study-hall are single-SaveChanges, so validate-then-create.)
- Backend returns i18n **codes** only (e.g. `"duties.errors.substitute-busy"`); translation is frontend.
- Domain exception for substitution validation: reuse `DutyDomainException(code, message)` (extends `DomainException` → middleware maps to 422, per 2a BE-14) OR map `ScheduleException`'s own validation via `Result.Conflict`. Prefer returning `Result.Conflict(code)` from handlers for app-level checks; let domain `ScheduleException.Create` throw its own `InvalidScheduleExceptionException` only as a backstop (catch → `Conflict`).
- Commit format (husky-enforced): `YYYY-MM-DD <type>[,type]: Türkçe özet.` Date prefix `2026-06-19`. Run `dotnet format` before every commit. Build: `dotnet build`. Test: `dotnet test`. SQL Server runs in Docker (`oksis-mssql`) for integration tests.

---

## File Structure

**Application (`src/Oksis.Application/Modules/Duties/Substitution/`)**
- `DTOs/SubstitutionDtos.cs` — `BranchFit` enum, `SubstituteCandidateDto`, `SubstitutionBoardDto`, `SubstitutionLessonDto`.
- `Internal/BranchFitResolver.cs` — pure helper: (absentSubject, candidate's subjects+branch) → `BranchFit`.
- `Queries/GetTodaysSubstitutionBoard/{Query,Handler}.cs`
- `Queries/GetAvailableSubstitutes/{Query,Handler}.cs`
- `Commands/CreateSubstitution/{Command,Handler,Validator}.cs`
- `Commands/MarkLessonStudyHall/{Command,Handler,Validator}.cs`
- `Commands/RevokeSubstitution/{Command,Handler}.cs`

**API** — extend `src/Oksis.Api/Controllers/V1/DutiesController.cs` (created in 2a) with the 5 substitution endpoints.

**Tests**
- `tests/Oksis.Application.UnitTests/Modules/Duties/Substitution/BranchFitResolverTests.cs`
- `tests/Oksis.Application.UnitTests/Modules/Duties/Substitution/{CreateSubstitutionValidatorTests,MarkLessonStudyHallValidatorTests}.cs`
- `tests/Oksis.Infrastructure.IntegrationTests/Modules/Duties/Substitution/{GetAvailableSubstitutesTests,CreateSubstitutionTests,SubstitutionBoardTests}.cs`

> No domain/EF/migration/permission tasks — all reused from Faz 2.5 + 2a.

---

## Task 1: DTOs + BranchFit enum

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Substitution/DTOs/SubstitutionDtos.cs`

**Interfaces:**
- Produces (FE contract — exact names/casing matter, must match the FE plan):
  - `enum BranchFit { Same = 0, Near = 1, Different = 2 }`
  - `SubstituteCandidateDto(Guid Id, string Name, string? Branch, BranchFit Fit, int CurrentWeekSubstitutionLoad)`
  - `SubstitutionLessonDto(Guid PlacementId, int Day, int Period, string ClassName, string SubjectName, string? RoomName, string Status, Guid? SubstituteTeacherId, string? SubstituteTeacherName, Guid? ExceptionId)` — `Status` ∈ `"open" | "covered" | "study-hall"`.
  - `SubstitutionBoardDto(Guid AbsentTeacherId, string AbsentTeacherName, string? AbsentTeacherBranch, DateOnly Date, IReadOnlyList<SubstitutionLessonDto> Lessons)`

- [ ] **Step 1: Write the DTOs**

```csharp
namespace Oksis.Application.Modules.Duties.Substitution.DTOs;

public enum BranchFit { Same = 0, Near = 1, Different = 2 }

public sealed record SubstituteCandidateDto(
    Guid Id, string Name, string? Branch, BranchFit Fit, int CurrentWeekSubstitutionLoad);

public sealed record SubstitutionLessonDto(
    Guid ProgramId, Guid PlacementId, int Day, int Period, string? Time, string ClassName, string SubjectName,
    string? Room, string Status /* "open"|"covered"|"study-hall" */,
    Guid? SubstituteId, string? SubstituteName, string? SubstituteBranch, Guid? ExceptionId);

public sealed record SubstitutionBoardDto(
    Guid AbsentTeacherId, string AbsentTeacherName, string? AbsentTeacherBranch,
    DateOnly Date, IReadOnlyList<SubstitutionLessonDto> Lessons);

// Teacher read-only view (GetMySubstitutions, Task 4) — separate from MyDutiesDto
public sealed record MySubstitutionDto(
    DateOnly Date, int Day, int Period, string? Time, string ClassName, string SubjectName,
    string? Room, Guid OriginalTeacherId, string OriginalTeacherName);
```
> `ProgramId` on `SubstitutionLessonDto` is required: the FE calls `GET substitution/candidates?programId=…` per open lesson. `Time` = bell-schedule start (nullable). `SubstituteTeacherBranch` shows under the covered state. `Status` is the string `"open"|"covered"|"study-hall"` (matches FE `SubstitutionLessonStatus`).

- [ ] **Step 2: Build** — `dotnet build` → 0/0.
- [ ] **Step 3: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Substitution/DTOs/SubstitutionDtos.cs
git commit -m "2026-06-19 feat: Vekâlet DTO'ları ve BranchFit enum eklendi."
```

---

## Task 2: BranchFitResolver (pure helper) + TDD

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Substitution/Internal/BranchFitResolver.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/Substitution/BranchFitResolverTests.cs`

**Interfaces:**
- Consumes: `BranchMatching.IsMatch(string? teacherBranch, string subjectName)` (`Oksis.Application.Modules.Teachers.TeachingAssignments.Internal`), `SubjectCategory`.
- Produces: `BranchFitResolver.Resolve(string? candidateBranch, IReadOnlyCollection<(Guid SubjectId, SubjectCategory Category)> candidateSubjects, Guid absentSubjectId, string absentSubjectName, SubjectCategory absentCategory) : BranchFit`.

**Logic (K-2b-4):**
- **Same** if the candidate teaches the absent lesson's `SubjectId` (candidateSubjects contains `absentSubjectId`) OR `BranchMatching.IsMatch(candidateBranch, absentSubjectName)`.
- **Near** if not Same AND any candidate subject's `Category == absentCategory`.
- **Different** otherwise.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Application.Modules.Duties.Substitution.DTOs;
using Oksis.Application.Modules.Duties.Substitution.Internal;
using Oksis.Domain.Modules.Academics.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Duties.Substitution;

public class BranchFitResolverTests
{
    private static readonly Guid Mat = Guid.NewGuid();
    private static readonly Guid Fiz = Guid.NewGuid();
    private static readonly Guid Kim = Guid.NewGuid();

    [Fact]
    public void SameSubject_IsSame()
    {
        var fit = BranchFitResolver.Resolve("Fizik",
            new[] { (Fiz, SubjectCategory.Science) }, Fiz, "Fizik", SubjectCategory.Science);
        Assert.Equal(BranchFit.Same, fit);
    }

    [Fact]
    public void BranchStringMatch_IsSame()
    {
        var fit = BranchFitResolver.Resolve("Matematik",
            new[] { (Guid.NewGuid(), SubjectCategory.Math) }, Mat, "Matematik", SubjectCategory.Math);
        Assert.Equal(BranchFit.Same, fit);
    }

    [Fact]
    public void SameCategory_DifferentSubject_IsNear()
    {
        // candidate teaches Kimya (Science), absent lesson is Fizik (Science)
        var fit = BranchFitResolver.Resolve("Kimya",
            new[] { (Kim, SubjectCategory.Science) }, Fiz, "Fizik", SubjectCategory.Science);
        Assert.Equal(BranchFit.Near, fit);
    }

    [Fact]
    public void NoOverlap_IsDifferent()
    {
        var fit = BranchFitResolver.Resolve("Beden Eğitimi",
            new[] { (Guid.NewGuid(), SubjectCategory.Sports) }, Fiz, "Fizik", SubjectCategory.Science);
        Assert.Equal(BranchFit.Different, fit);
    }
}
```

- [ ] **Step 2: Run → fail** — `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~BranchFitResolverTests"` → FAIL (resolver missing).

- [ ] **Step 3: Implement**

```csharp
using Oksis.Application.Modules.Duties.Substitution.DTOs;
using Oksis.Application.Modules.Teachers.TeachingAssignments.Internal;
using Oksis.Domain.Modules.Academics.Enums;

namespace Oksis.Application.Modules.Duties.Substitution.Internal;

public static class BranchFitResolver
{
    public static BranchFit Resolve(
        string? candidateBranch,
        IReadOnlyCollection<(Guid SubjectId, SubjectCategory Category)> candidateSubjects,
        Guid absentSubjectId,
        string absentSubjectName,
        SubjectCategory absentCategory)
    {
        var teachesSameSubject = candidateSubjects.Any(s => s.SubjectId == absentSubjectId);
        if (teachesSameSubject || BranchMatching.IsMatch(candidateBranch, absentSubjectName))
            return BranchFit.Same;

        if (candidateSubjects.Any(s => s.Category == absentCategory))
            return BranchFit.Near;

        return BranchFit.Different;
    }
}
```

> `BranchMatching.IsMatch` is internal `public static` in the Teachers module; if its accessibility/namespace differs, adjust the `using`. If `Subject` exposes the display name as `Name`, use it; if only `Code` exists, pass `Code` as `absentSubjectName` and document it (the resolver only string-compares).

- [ ] **Step 4: Run → pass.** **Step 5: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Substitution/Internal/BranchFitResolver.cs tests/Oksis.Application.UnitTests/Modules/Duties/Substitution/BranchFitResolverTests.cs
git commit -m "2026-06-19 feat,test: Branş-uyumu (Same/Near/Different) çözücü eklendi."
```

---

## Task 3: GetAvailableSubstitutes query (free + vekil-vekil eleme + branş-fit + adalet)

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Substitution/Queries/GetAvailableSubstitutes/{GetAvailableSubstitutesQuery,GetAvailableSubstitutesQueryHandler}.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Modules/Duties/Substitution/GetAvailableSubstitutesTests.cs`

**Interfaces:**
- Produces: `GetAvailableSubstitutesQuery(Guid ProgramId, DateOnly Date, int Day, int Period, Guid AbsentTeacherId) : IQuery<IReadOnlyList<SubstituteCandidateDto>>` — `[RequirePermission("duties.substitute")]`, `[Tenancy(TenancyMode.Required)]`.

**Handler logic:**
1. Resolve `schoolId`; load `program` (NotFound if missing) → `AcademicTermId`.
2. **Structural busy set** (mirror P28): teacher ids with an active `LessonPlacement` at `(Day, Period)` in any program of the same term.
3. **Vekil-vekil set (K-2b-6):** teacher ids that are the `NewTeacherId` of an active (`RevokedAt == null`) `ScheduleException` of type `TeacherSubstitution` whose `Date == request.Date` and `Day == day` and `Period == request.Period`. (Also exclude exceptions whose `OriginalTeacherId` frees a slot — not needed for candidacy; only NewTeacherId occupies.) Union into the excluded set.
4. **Absent lesson's subject:** from the target placement (resolve via `program.Placements` where `Day,Period` and `TeacherId == AbsentTeacherId`) → `SubjectId`; load `Subject` → `(Name/Code, Category)`.
5. **Candidates:** active non-terminated teachers (P28 pattern) minus excluded set. Materialize `(PersonId, Name, TeacherProfile.Branch)` — **`Name` materialized, `.FullName` in memory** (FullName rule).
6. **Candidate subjects + category:** for the candidate set, load their `TeachingAssignment`s (`RevokedAt == null`) → `SubjectId`s → join `Subject.Category`. Build `Dictionary<Guid teacherId, List<(Guid SubjectId, SubjectCategory)>>` in memory.
7. **Substitution load (K-2b-5):** count active `ScheduleException` (TeacherSubstitution, `NewTeacherId == candidate`, `Date` within the ISO week of `request.Date`, `RevokedAt == null`) grouped by teacher.
8. For each candidate: `Fit = BranchFitResolver.Resolve(branch, subjects, absentSubjectId, absentSubjectName, absentCategory)`; `CurrentWeekSubstitutionLoad = loadMap.GetValueOrDefault(id)`.
9. **Order:** `Fit` asc (Same=0 first) → `CurrentWeekSubstitutionLoad` asc → `Name`. Project `SubstituteCandidateDto`.
10. **NEVER** touch `TeacherAvailabilities` (K-2a-2).

- [ ] **Step 1: Write the failing integration test** (against live MSSQL — mirror the 2a duty integration harness `IntegrationTestBase` + `CreateSchoolAsync`/seed helpers):

```csharp
namespace Oksis.Infrastructure.IntegrationTests.Modules.Duties.Substitution;

public class GetAvailableSubstitutesTests : IntegrationTestBase
{
    [Fact]
    public async Task ExcludesBusyAndExistingSubstitute_RanksByBranchThenLoad_IgnoresAvailability()
    {
        // Seed: a published program with a placement for the ABSENT teacher at (Mon, period 3), subject Fizik (Science).
        // Candidates:
        //   T_same  — teaches Fizik (Same), 0 load, FREE at slot
        //   T_near  — teaches Kimya (Science → Near), 0 load, FREE
        //   T_busy  — FREE branch-wise but has a lesson at (Mon,3) → excluded (structural)
        //   T_subbed— already NewTeacherId of an active TeacherSubstitution at this date+slot → excluded (K-2b-6)
        //   T_unavail — has a TeacherAvailability Unavailable at (Mon,3) but NO lesson → MUST still be a candidate (K-2a-2)
        // Act: handler.Handle(new GetAvailableSubstitutesQuery(programId, date(Mon), 1 /*Mon*/, 3, absentTeacherId))
        // Assert:
        //   - result excludes T_busy and T_subbed
        //   - result INCLUDES T_unavail (availability ignored)
        //   - first item is T_same (Fit=Same), then T_near (Fit=Near)
    }
}
```

> Use the project's day convention for the `Day` int (match P28: `(DayOfWeek)request.Day`). Flesh out the seed with the existing harness builders; assert exclusion + inclusion + ordering explicitly. This test is the K-2b-6 + K-2a-2 proof.

- [ ] **Step 2: Run → fail.** **Step 3: Implement the handler** per logic above. **Step 4: Run → pass** (`dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAvailableSubstitutesTests"`). **Step 5: `dotnet build` 0/0. Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Substitution/Queries/GetAvailableSubstitutes/ tests/Oksis.Infrastructure.IntegrationTests/Modules/Duties/Substitution/GetAvailableSubstitutesTests.cs
git commit -m "2026-06-19 feat,test: GetAvailableSubstitutes (boşta + vekil-vekil eleme + branş-fit + adalet sıralama) eklendi."
```

---

## Task 4: GetTodaysSubstitutionBoard query

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Substitution/Queries/GetTodaysSubstitutionBoard/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Substitution/Queries/GetMySubstitutions/{Query,Handler}.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Modules/Duties/Substitution/SubstitutionBoardTests.cs` (+ a `GetMySubstitutions` self-only test)

**Interfaces:**
- Produces: `GetTodaysSubstitutionBoardQuery(Guid TermId, DateOnly Date, Guid AbsentTeacherId) : IQuery<SubstitutionBoardDto>` — `[RequirePermission("duties.substitute")]`, `[Tenancy(TenancyMode.Required)]`.
- Produces: `GetMySubstitutionsQuery(Guid TermId) : IQuery<IReadOnlyList<MySubstitutionDto>>` — `[RequirePermission("duties.view")]`, `[Tenancy(TenancyMode.Required)]`, **self-only** (resolves caller's teacher via `Person.LinkedAccountId == currentUser.Id`, mirroring 2a `GetMyDuties`). Teacher read-only view source (FE consumes; NOT a `MyDutiesDto` extension). `MySubstitutionDto(DateOnly Date, int Day, int Period, string? Time, string ClassName, string SubjectName, string? Room, Guid OriginalTeacherId, string OriginalTeacherName)`. Handler: active `ScheduleException`s (Type==TeacherSubstitution, `NewTeacherId == me`, term's date range, `RevokedAt==null`); resolve original teacher `Person.Name` (materialize → `.FullName` in memory), class/subject/room from the target placement; project. Empty list if none.

**Handler logic (board):**
1. Resolve `schoolId`. Load the absent teacher's `Person.Name` (materialize → `.FullName` in memory) + `TeacherProfile.Branch`.
2. Load the absent teacher's active `LessonPlacement`s for the term where `Day == Date.DayOfWeek` (across that teacher's programs); resolve class name (branch/classroom), subject name, room name — all via in-memory joins (FullName rule N/A here but apply the same materialize-then-map discipline).
3. For each placement, find the active `ScheduleException` (`TargetPlacementId == placement.Id`, `Date == request.Date`, `RevokedAt == null`): if `Type == TeacherSubstitution` → `Status = "covered"`, fill `SubstituteTeacherId/Name` + `ExceptionId`; if `Type == Cancellation` → `Status = "study-hall"`, `ExceptionId`; else `Status = "open"`.
4. Project `SubstitutionBoardDto`.

- [ ] **Step 1: failing integration test** — seed absent teacher + 2 lessons on the date; one covered by a TeacherSubstitution exception, one open; assert statuses + substitute name resolves. **Step 2: fail → Step 3: implement (board) → Step 4: pass.**
- [ ] **Step 5: GetMySubstitutions** — implement the self-only query + a test seeding a TeacherSubstitution where `NewTeacherId == caller` and asserting it returns with the original-teacher name resolved (and another teacher's substitution is NOT returned). **Step 6: build + commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Substitution/Queries/GetTodaysSubstitutionBoard/ \
        src/Oksis.Application/Modules/Duties/Substitution/Queries/GetMySubstitutions/ \
        tests/Oksis.Infrastructure.IntegrationTests/Modules/Duties/Substitution/SubstitutionBoardTests.cs
git commit -m "2026-06-19 feat,test: GetTodaysSubstitutionBoard + GetMySubstitutions (öğretmen salt-okunur) eklendi."
```

---

## Task 5: CreateSubstitutionCommand (+validator) + integration test

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Substitution/Commands/CreateSubstitution/{CreateSubstitutionCommand,CreateSubstitutionCommandHandler,CreateSubstitutionCommandValidator}.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/Substitution/CreateSubstitutionValidatorTests.cs`, `tests/Oksis.Infrastructure.IntegrationTests/Modules/Duties/Substitution/CreateSubstitutionTests.cs`

**Interfaces:**
- Produces: `CreateSubstitutionCommand(Guid ProgramId, Guid TargetPlacementId, DateOnly Date, Guid SubstituteTeacherId, string Reason) : ICommand<Guid>` — `[RequirePermission("duties.substitute")]`, `[Tenancy(TenancyMode.Required)]`. Returns the new `ScheduleException` id.

**Handler logic (validate-before-write; TransactionBehavior gotcha):**
1. Resolve `schoolId`. Load `program` (NotFound) + the target `LessonPlacement` (NotFound if not in program / inactive) → `OriginalTeacherId`, `Day`, `Period`, `BranchId`, `AcademicTermId`, `OriginalRoomId`.
2. **Validate candidate is assignable BEFORE creating:** `SubstituteTeacherId != OriginalTeacherId` (else `Conflict("duties.errors.substitute-same-teacher")`); candidate not structurally busy at `(Day,Period)` in the term (else `Conflict("duties.errors.substitute-busy")`); candidate not already a vekil at this date+slot (K-2b-6) (else `Conflict("duties.errors.substitute-already-assigned")`). (Reuse the exclusion logic from Task 3 — extract a shared internal checker or inline the two existence checks.)
3. Build `ScheduleException.Create(schoolId, ProgramId, branchId, academicTermId, Date, ScheduleExceptionType.TeacherSubstitution, TargetPlacementId, day, period, originalTeacherId, originalRoomId, newTeacherId: SubstituteTeacherId, newRoomId: null, reason: Reason)` (match the exact `Create` parameter order in `ScheduleException.cs`). Catch `InvalidScheduleExceptionException` → `Conflict(ex code)` as a backstop.
4. `db.ScheduleExceptions.Add(ex)`; `SaveChangesAsync` → `ScheduleExceptionCreatedEvent` fires (notification reused). Return `Result<Guid>.Success(ex.Id)`. Catch `DbUpdateException` → **throw** (do not return — TransactionBehavior must roll back) or map to a thrown `DutyDomainException("duties.errors.substitute-conflict", ...)`.
- Validator: `ProgramId`/`TargetPlacementId`/`SubstituteTeacherId` NotEmpty; `Reason` NotEmpty + MaxLength(500) (ScheduleException reason cap).

- [ ] **Step 1: validator unit test** (NotEmpty/Reason rules) — fail → implement → pass.
- [ ] **Step 2: integration test** — seed program + placement + a free same-branch teacher; create substitution; assert a TeacherSubstitution `ScheduleException` exists with correct fields; then assert creating for a busy teacher → Conflict, and for an already-subbed teacher → Conflict. fail → implement → pass.
- [ ] **Step 3: build + commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Substitution/Commands/CreateSubstitution/ tests/Oksis.Application.UnitTests/Modules/Duties/Substitution/CreateSubstitutionValidatorTests.cs tests/Oksis.Infrastructure.IntegrationTests/Modules/Duties/Substitution/CreateSubstitutionTests.cs
git commit -m "2026-06-19 feat,test: CreateSubstitution (duties.substitute, ScheduleException üretir, boşta/vekil-vekil reddi) eklendi."
```

---

## Task 6: MarkLessonStudyHall + RevokeSubstitution commands

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Substitution/Commands/MarkLessonStudyHall/{Command,Handler,Validator}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Substitution/Commands/RevokeSubstitution/{Command,Handler}.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/Substitution/MarkLessonStudyHallValidatorTests.cs`; extend `CreateSubstitutionTests` (or a `RevokeSubstitutionTests`) with revoke.

**Interfaces:**
- `MarkLessonStudyHallCommand(Guid ProgramId, Guid TargetPlacementId, DateOnly Date, string Reason) : ICommand<Guid>` — `duties.substitute`. Creates `ScheduleException.Create(... ScheduleExceptionType.Cancellation ...)` (newTeacherId/newRoomId null) = etüt/serbest. Returns exception id.
- `RevokeSubstitutionCommand(Guid ExceptionId, string Reason) : ICommand` (non-generic `ICommand`/`Result`, matching the project's void-command convention — see 2a `DeleteDutyLocationCommand`) — `duties.substitute`. Loads the `ScheduleException` (NotFound), calls `.Revoke(Reason, <now>)`, `SaveChangesAsync`. (Use the project's clock/`DateTimeOffset` source the existing revoke path uses; check `RevokeScheduleExceptionCommandHandler`.)

- [ ] **Step 1: validator + handlers (TDD)** — MarkStudyHall validator (Reason required); integration: study-hall creates a Cancellation exception; revoke sets `RevokedAt` and frees the lesson (board shows "open" again). **Step 2: build + commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Substitution/Commands/MarkLessonStudyHall/ src/Oksis.Application/Modules/Duties/Substitution/Commands/RevokeSubstitution/ tests/Oksis.Application.UnitTests/Modules/Duties/Substitution/MarkLessonStudyHallValidatorTests.cs
git commit -m "2026-06-19 feat,test: Vekâlet etüt/serbest (Cancellation) + geri-al (revoke) komutları eklendi."
```

---

## Task 7: DutiesController — substitution endpoints

**Files:**
- Modify: `src/Oksis.Api/Controllers/V1/DutiesController.cs` (created in 2a)

**Interfaces:** thin actions, `(...) => (await sender.Send(new XCommand/Query(...), ct)).ToHttpResult(HttpContext)`. Verify arg order against each command/query ctor.

| Verb + route | Sends |
|---|---|
| `GET  substitution/board?termId=&date=&teacherId=` | `GetTodaysSubstitutionBoardQuery(termId, date, teacherId)` |
| `GET  substitution/candidates?programId=&date=&day=&period=&absentTeacherId=` | `GetAvailableSubstitutesQuery(programId, date, day, period, absentTeacherId)` |
| `GET  substitution/me?termId=` | `GetMySubstitutionsQuery(termId)` (teacher self, `duties.view`) |
| `POST substitution` (body) | `CreateSubstitutionCommand(...)` → 201 `ApiResponse<Guid>.Ok` (mirror 2a create convention) |
| `POST substitution/study-hall` (body) | `MarkLessonStudyHallCommand(...)` |
| `POST substitution/{exceptionId}/revoke` (body `{reason}`) | `RevokeSubstitutionCommand(exceptionId, reason)` |

- [ ] **Step 1: add the 5 endpoints + body records** (mirror SchedulingController/DutiesController style). **Step 2:** `dotnet build` 0/0; `dotnet test tests/Oksis.Api.UnitTests` (reflection-based controller tests, project convention) green. **Step 3: commit**

```bash
dotnet format
git add src/Oksis.Api/Controllers/V1/DutiesController.cs
git commit -m "2026-06-19 feat: DutiesController vekâlet uçları (board/candidates/create/study-hall/revoke) eklendi."
```

---

## Task 8: Module docs + full suite

**Files:** `.claude/docs/modules/timetable/{completion_status,api-contracts,business-rules,permissions}.md` (workspace repo).

- [ ] **Step 1:** `dotnet build` 0/0; `dotnet test` FULL suite → 0 failures (report counts). If any NEW failure → STOP/BLOCKED.
- [ ] **Step 2:** Docs (workspace repo): `completion_status.md` mark 2b backend ✅; `api-contracts.md` the 5 `/duties/substitution/*` endpoints + DTOs; `business-rules.md` substitution rules (branch-fit tiers, vekil-vekil exclusion, study-hall=Cancellation, K-2a-2 not-availability); `permissions.md` note `duties.substitute` now exercised. Log any deviation/debt.
- [ ] **Step 3: commit** (workspace repo)

```bash
git -C /Users/farukkaya/Projects/oksis add .claude/docs/modules/timetable/
git -C /Users/farukkaya/Projects/oksis commit -m "2026-06-19 docs: Vekâlet (Faz 4/Dilim 2b) backend — modül dokümanları + sözleşme."
```

---

## Self-Review

**Spec coverage (design §3/§5):** board query → Task 4 ✓; candidates (free + vekil-vekil K-2b-6 + branch-fit K-2b-4 + load K-2b-5) → Tasks 2,3 ✓; CreateSubstitution (duties.substitute, in-domain ScheduleException) → Task 5 ✓; study-hall (Cancellation) + revoke → Task 6 ✓; endpoints → Task 7 ✓; notification reused (no task) ✓; docs → Task 8 ✓. Teacher-view + approve = frontend (FE plan), itiraz deferred (K-2b-7).

**Placeholder scan:** Task 3/4 integration tests describe seed+assert intent rather than full literal code (the harness builders are project-specific) — flagged as a read-first step, consistent with 2a's integration-test tasks; the assertions (exclusion/inclusion/ordering) are explicit.

**Type consistency:** `BranchFit {Same,Near,Different}` and `SubstituteCandidateDto`/`SubstitutionBoardDto`/`SubstitutionLessonDto` names/fields are used identically across DTOs (Task 1), resolver (Task 2), queries (Tasks 3-4), controller (Task 7) — and MUST match the FE plan's TS contract. `duties.substitute` permission string identical on all slices. `ScheduleException.Create(...)` call uses the real factory signature (Task 5 references the exact param order in the entity).

**Open assumptions:**
- `Subject` display name field (`Name` vs `Code`) for branch-string match + DTO `SubjectName` — verify; resolver only string-compares so either works, but DTO should carry the human name.
- The absent-teacher's lessons span their programs; `GetTodaysSubstitutionBoard` resolves placements by teacher across the term's programs — confirm the query path (placement → program → class) against the existing today-schedule handler.
- `RevokeSubstitution` clock source — mirror `RevokeScheduleExceptionCommandHandler`'s `DateTimeOffset` source.
- Whether to extract a shared `SubstituteEligibility` internal helper used by both `GetAvailableSubstitutes` (Task 3) and `CreateSubstitution` validation (Task 5) to avoid duplicating the busy + vekil-vekil checks — recommended.
