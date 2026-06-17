# Öğretmen Müsaitlik & Tercih — Backend Implementation Plan (Faz 4 / Dilim 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make teacher availability (hard-block) and preference (soft) real across solver, editor commands, queries, and Hub stats in `oksis-api`.

**Architecture:** New `TeacherAvailability` aggregate (`[academic]` schema, sparse storage). A real `TeacherAvailabilityProvider` replaces `NoopAvailabilityProvider` (closes Debt-AG-1) and also feeds disliked slots to a new `CandidateScorer` preference component. Editor placement commands gain an `AllowUnavailable` override gated at runtime by `timetable.override`. Hub gets a denormalized `availability_violation_count` recomputed by the existing `IScheduleProgramStatsRecomputer`.

**Tech Stack:** .NET 10, C# 13, EF Core 10, MediatR, FluentValidation, Mapster, SQL Server, xUnit.

**Design doc:** `.claude/specs/ders-programi-faz4-dilim1-musaitlik-design.md`
**Handoff:** `.claude/design-handoffs/schedule_avail/`

## Global Constraints

- Working dir: `oksis-api/`. Solution: `Oksis.slnx`. All paths below are relative to `oksis-api/`.
- Multi-tenant: every new entity is `IHasTenant` via `TenantEntity`; never use `IgnoreQueryFilters()`. `SchoolId` auto-filled by `TenantSaveChangesInterceptor`.
- Domain purity: no EF Core / DataAnnotations in `Oksis.Domain`; mapping only in `Infrastructure/Persistence/Configurations/`.
- Naming: `Mark`=grade/score, `Grade`=year level, `Branch`=class section. Don't conflate.
- Mapster (NOT AutoMapper). No repository wrapper over EF Core. No lazy loading. No `async void`/`.Result`/`.Wait()`.
- Permissions are hardcoded strings on `[RequirePermission("...")]`. Existing: `timetable.manage`, `timetable.override` (both seeded). Do NOT add new permission slugs (spec §195 — izinler değişmez).
- Backend returns i18n **codes** only (e.g. `"timetable.errors.teacher-unavailable"`); user-facing translation is frontend.
- Schema helper: `builder.ToAcademicTable("name")` → `[academic]` schema.
- Commit format (husky-enforced): `YYYY-MM-DD <type>[,type]: Türkçe özet.` Date prefix `2026-06-17`.
- Run `dotnet format` before every commit. Build: `dotnet build`. Test: `dotnet test`.

---

## File Structure

**Domain (`src/Oksis.Domain/Modules/Timetable/`)**
- Create `Enums/AvailabilityStatus.cs` — `Available=0, PrefersNot=1, Unavailable=2`.
- Create `ValueObjects/TeacherAvailabilityId.cs` — strongly-typed id.
- Create `ValueObjects/AvailabilitySlot.cs` — `(DayOfWeek Day, int Period, AvailabilityStatus Status)` value object.
- Create `Entities/TeacherAvailability.cs` — aggregate root (`TenantEntity`), sparse slot list + behavior.

**Persistence (`src/Oksis.Infrastructure/Persistence/`)**
- Create `Configurations/Timetable/TeacherAvailabilityConfiguration.cs`.
- Modify `OksisDbContext.cs` — add `DbSet<TeacherAvailability> TeacherAvailabilities`.
- Migration `20260617_add_teacher_availabilities` (generated).
- Migration `20260617_add_availability_violation_count` (generated; new ScheduleProgram column).

**Provider (`src/Oksis.Infrastructure/Timetable/`)**
- Delete `NoopAvailabilityProvider.cs`; create `TeacherAvailabilityProvider.cs`.
- Modify `src/Oksis.Application/Modules/Timetable/Ports/IAvailabilityProvider.cs` — add `GetDislikedSlotsAsync`.
- Modify `src/Oksis.Infrastructure/DependencyInjection.cs:319` — swap registration.

**Solver (`src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/`)**
- Modify `SolverContracts.cs` — `SolverWeights.RespectTeacherPreference`, `SolveInput.TeacherDislikedSlots`.
- Modify `CandidateScorer.cs` — preference component.
- Modify `src/Oksis.Application/Modules/Timetable/Commands/EnqueueAutoGenerate/EnqueueAutoGenerateCommand.cs` — `AutoGenWeightsRequest.RespectTeacherPreference`.
- Modify `.../EnqueueAutoGenerate/EnqueueAutoGenerateCommandHandler.cs` — pass it.
- Modify `src/Oksis.Infrastructure/BackgroundJobs/Jobs/AutoGenerateScheduleJob.cs` — call `GetDislikedSlotsAsync`, pass to `SolveInput`.

**Application — Availability slice (`src/Oksis.Application/Modules/Timetable/`)**
- Create `DTOs/TeacherAvailabilityDto.cs`, `DTOs/AvailabilitySlotDto.cs`, `DTOs/TermTeacherAvailabilityDto.cs`.
- Create `Queries/GetTeacherAvailability/{Query,Handler}.cs`.
- Create `Queries/GetTermTeacherAvailability/{Query,Handler}.cs`.
- Create `Commands/SaveTeacherAvailability/{Command,Handler,Validator}.cs`.

**Editor override (`src/Oksis.Application/Modules/Timetable/Commands/`)**
- Modify `PlaceLesson/{Command,Handler}.cs`, `MoveLesson/{Command,Handler}.cs`, `AssignTeacher/{Command,Handler}.cs` — `AllowUnavailable` + override guard + availability block check.

**Hub stats (`src/Oksis.Application/Modules/Timetable/Services/`)**
- Modify `IScheduleProgramStatsRecomputer.cs` (no signature change) + `ScheduleProgramStatsRecomputer.cs` — compute `availability_violation_count`.
- Modify `src/Oksis.Domain/Modules/Timetable/Entities/ScheduleProgram.cs` — `AvailabilityViolationCount` + `SetAvailabilityViolations`.
- Modify `Configurations/Timetable/ScheduleProgramConfiguration.cs` — map column.

**API (`src/Oksis.Api/Controllers/`)**
- Modify (or create) the timetable controller — 3 availability endpoints.

---

## Task 1: AvailabilityStatus enum + TeacherAvailabilityId

**Files:**
- Create: `src/Oksis.Domain/Modules/Timetable/Enums/AvailabilityStatus.cs`
- Create: `src/Oksis.Domain/Modules/Timetable/ValueObjects/TeacherAvailabilityId.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Timetable/AvailabilityStatusTests.cs`

**Interfaces:**
- Produces: `enum AvailabilityStatus { Available=0, PrefersNot=1, Unavailable=2 }`; `readonly record struct TeacherAvailabilityId(Guid Value)` with `New()`/`From(Guid)`.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Domain.Modules.Timetable.Enums;
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Domain.UnitTests.Modules.Timetable;

public class AvailabilityStatusTests
{
    [Fact]
    public void Enum_HasThreeStableValues()
    {
        Assert.Equal(0, (int)AvailabilityStatus.Available);
        Assert.Equal(1, (int)AvailabilityStatus.PrefersNot);
        Assert.Equal(2, (int)AvailabilityStatus.Unavailable);
    }

    [Fact]
    public void TeacherAvailabilityId_New_IsNonEmpty()
    {
        var id = TeacherAvailabilityId.New();
        Assert.NotEqual(Guid.Empty, id.Value);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AvailabilityStatusTests"`
Expected: FAIL — types do not exist (compile error).

- [ ] **Step 3: Write minimal implementation**

`Enums/AvailabilityStatus.cs`:
```csharp
namespace Oksis.Domain.Modules.Timetable.Enums;

/// <summary>
/// Öğretmenin bir slottaki durumu. Available depolanmaz (varsayılan); PrefersNot soft (uyarı/ağırlık),
/// Unavailable hard (engel — admin override edilebilir).
/// </summary>
public enum AvailabilityStatus
{
    Available = 0,
    PrefersNot = 1,
    Unavailable = 2,
}
```

`ValueObjects/TeacherAvailabilityId.cs`:
```csharp
namespace Oksis.Domain.Modules.Timetable.ValueObjects;

/// <summary>TeacherAvailability aggregate'i için strongly-typed kimlik.</summary>
public readonly record struct TeacherAvailabilityId(Guid Value)
{
    public static TeacherAvailabilityId New() => new(Guid.NewGuid());
    public static TeacherAvailabilityId From(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AvailabilityStatusTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
dotnet format
git add src/Oksis.Domain/Modules/Timetable/Enums/AvailabilityStatus.cs \
        src/Oksis.Domain/Modules/Timetable/ValueObjects/TeacherAvailabilityId.cs \
        tests/Oksis.Domain.UnitTests/Modules/Timetable/AvailabilityStatusTests.cs
git commit -m "2026-06-17 feat: Öğretmen müsaitlik durum enum'u ve aggregate kimliği eklendi."
```

---

## Task 2: TeacherAvailability aggregate + AvailabilitySlot

**Files:**
- Create: `src/Oksis.Domain/Modules/Timetable/ValueObjects/AvailabilitySlot.cs`
- Create: `src/Oksis.Domain/Modules/Timetable/Entities/TeacherAvailability.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Timetable/TeacherAvailabilityTests.cs`

**Interfaces:**
- Consumes: `AvailabilityStatus`, `TeacherAvailabilityId`, `TimeSlot` (existing, `MinPeriod=1`,`MaxPeriod=20`), `TenantEntity`.
- Produces:
  - `readonly record struct AvailabilitySlot(DayOfWeek Day, int Period, AvailabilityStatus Status)`
  - `TeacherAvailability : TenantEntity` with:
    - factory `static TeacherAvailability Create(Guid schoolId, Guid academicYearId, Guid academicTermId, Guid teacherId)`
    - props `Guid AcademicYearId`, `Guid AcademicTermId`, `Guid TeacherId`, `IReadOnlyList<AvailabilitySlot> Slots`
    - `void SetSlot(DayOfWeek day, int period, AvailabilityStatus status)` (Available removes; else upserts)
    - `void ReplaceAll(IEnumerable<AvailabilitySlot> slots)` (replaces non-Available set)

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.Enums;
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Domain.UnitTests.Modules.Timetable;

public class TeacherAvailabilityTests
{
    private static TeacherAvailability New() =>
        TeacherAvailability.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void SetSlot_StoresNonAvailableSparsely()
    {
        var a = New();
        a.SetSlot(DayOfWeek.Monday, 1, AvailabilityStatus.Unavailable);
        a.SetSlot(DayOfWeek.Monday, 2, AvailabilityStatus.PrefersNot);

        Assert.Equal(2, a.Slots.Count);
        Assert.Contains(a.Slots, s => s.Day == DayOfWeek.Monday && s.Period == 1 && s.Status == AvailabilityStatus.Unavailable);
    }

    [Fact]
    public void SetSlot_Available_RemovesExistingRow()
    {
        var a = New();
        a.SetSlot(DayOfWeek.Monday, 1, AvailabilityStatus.Unavailable);
        a.SetSlot(DayOfWeek.Monday, 1, AvailabilityStatus.Available);

        Assert.Empty(a.Slots);
    }

    [Fact]
    public void SetSlot_SamePeriodTwice_Upserts()
    {
        var a = New();
        a.SetSlot(DayOfWeek.Tuesday, 3, AvailabilityStatus.PrefersNot);
        a.SetSlot(DayOfWeek.Tuesday, 3, AvailabilityStatus.Unavailable);

        Assert.Single(a.Slots);
        Assert.Equal(AvailabilityStatus.Unavailable, a.Slots[0].Status);
    }

    [Fact]
    public void ReplaceAll_DropsAvailableAndReplacesSet()
    {
        var a = New();
        a.SetSlot(DayOfWeek.Monday, 1, AvailabilityStatus.Unavailable);
        a.ReplaceAll(new[]
        {
            new AvailabilitySlot(DayOfWeek.Friday, 5, AvailabilityStatus.PrefersNot),
            new AvailabilitySlot(DayOfWeek.Friday, 6, AvailabilityStatus.Available), // ignored
        });

        Assert.Single(a.Slots);
        Assert.Equal(DayOfWeek.Friday, a.Slots[0].Day);
        Assert.Equal(AvailabilityStatus.PrefersNot, a.Slots[0].Status);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~TeacherAvailabilityTests"`
Expected: FAIL — `TeacherAvailability`/`AvailabilitySlot` not defined.

- [ ] **Step 3: Write minimal implementation**

`ValueObjects/AvailabilitySlot.cs`:
```csharp
using Oksis.Domain.Modules.Timetable.Enums;

namespace Oksis.Domain.Modules.Timetable.ValueObjects;

/// <summary>
/// Öğretmenin bir (Gün, Period) slotundaki müsaitlik durumu. Değere göre eşitlik taşır.
/// Yalnız non-Available durumlar saklanır (seyrek depolama).
/// </summary>
public readonly record struct AvailabilitySlot(DayOfWeek Day, int Period, AvailabilityStatus Status);
```

`Entities/TeacherAvailability.cs`:
```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Timetable.Enums;
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Domain.Modules.Timetable.Entities;

/// <summary>
/// Bir öğretmenin bir dönemdeki haftalık müsaitlik/tercih durumu (seyrek: yalnız
/// PrefersNot/Unavailable saklanır; satır yokluğu = Available). Solver hard/soft girdisi,
/// editör uyarı/engel kaynağı. Tek izin yüzeyi: admin (timetable.manage).
/// </summary>
public sealed class TeacherAvailability : TenantEntity
{
    private readonly List<AvailabilitySlot> _slots = [];

    private TeacherAvailability() { } // EF

    private TeacherAvailability(Guid schoolId, Guid academicYearId, Guid academicTermId, Guid teacherId)
    {
        Id = TeacherAvailabilityId.New().Value;
        SchoolId = schoolId;
        AcademicYearId = academicYearId;
        AcademicTermId = academicTermId;
        TeacherId = teacherId;
    }

    public Guid AcademicYearId { get; private set; }
    public Guid AcademicTermId { get; private set; }
    public Guid TeacherId { get; private set; }
    public IReadOnlyList<AvailabilitySlot> Slots => _slots.AsReadOnly();

    public static TeacherAvailability Create(Guid schoolId, Guid academicYearId, Guid academicTermId, Guid teacherId)
        => new(schoolId, academicYearId, academicTermId, teacherId);

    /// <summary>Bir slotu işaretler. Available → varsa satırı kaldırır; diğerleri upsert.</summary>
    public void SetSlot(DayOfWeek day, int period, AvailabilityStatus status)
    {
        _ = new TimeSlot(day, period); // period aralık doğrulaması (1..MaxPeriod)
        _slots.RemoveAll(s => s.Day == day && s.Period == period);
        if (status != AvailabilityStatus.Available)
        {
            _slots.Add(new AvailabilitySlot(day, period, status));
        }
    }

    /// <summary>Tüm seti değiştirir; Available girişleri yok sayılır (seyrek depolama).</summary>
    public void ReplaceAll(IEnumerable<AvailabilitySlot> slots)
    {
        ArgumentNullException.ThrowIfNull(slots);
        _slots.Clear();
        foreach (var s in slots)
        {
            if (s.Status == AvailabilityStatus.Available)
            {
                continue;
            }

            _ = new TimeSlot(s.Day, s.Period);
            _slots.RemoveAll(x => x.Day == s.Day && x.Period == s.Period);
            _slots.Add(s);
        }
    }
}
```

> Note: `TenantEntity` exposes settable `SchoolId { get; protected init; }`. If `Id` is not on `TenantEntity`/`AggregateRoot` as settable, mirror the existing entity's id assignment pattern — check `ScheduleProgram` (it sets `Id` in its factory). Use the same base member.

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~TeacherAvailabilityTests"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
dotnet format
git add src/Oksis.Domain/Modules/Timetable/ValueObjects/AvailabilitySlot.cs \
        src/Oksis.Domain/Modules/Timetable/Entities/TeacherAvailability.cs \
        tests/Oksis.Domain.UnitTests/Modules/Timetable/TeacherAvailabilityTests.cs
git commit -m "2026-06-17 feat: TeacherAvailability aggregate (seyrek slot depolama) eklendi."
```

---

## Task 3: EF Core configuration + DbSet + migration

**Files:**
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Timetable/TeacherAvailabilityConfiguration.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (add DbSet near line 84-90)
- Migration: generated under `src/Oksis.Infrastructure/Persistence/Migrations/`

**Interfaces:**
- Consumes: `TeacherAvailability`, `AvailabilitySlot`, `IHasTenant` filter.
- Produces: `DbSet<TeacherAvailability> TeacherAvailabilities` on `OksisDbContext`; tables `[academic].teacher_availabilities` + `[academic].teacher_availability_slots` (owned). Unique index `(school_id, academic_term_id, teacher_id, day_of_week, period)` on slots.

- [ ] **Step 1: Add the DbSet**

In `OksisDbContext.cs`, after the existing Timetable DbSets (near line 90):
```csharp
// Öğretmen müsaitlik/tercih (Faz 4 / Dilim 1). Slots owned child — aggregate üzerinden.
DbSet<TeacherAvailability> TeacherAvailabilities => Set<TeacherAvailability>();
```
Add `using Oksis.Domain.Modules.Timetable.Entities;` if not present.

- [ ] **Step 2: Write the configuration**

`Configurations/Timetable/TeacherAvailabilityConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Timetable.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Timetable;

public sealed class TeacherAvailabilityConfiguration : IEntityTypeConfiguration<TeacherAvailability>
{
    public void Configure(EntityTypeBuilder<TeacherAvailability> builder)
    {
        builder.ToAcademicTable("teacher_availabilities");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AcademicYearId).IsRequired();
        builder.Property(x => x.AcademicTermId).IsRequired();
        builder.Property(x => x.TeacherId).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.Ignore(x => x.DomainEvents);

        // Bir öğretmen × dönem için tek müsaitlik kaydı.
        builder.HasIndex(x => new { x.SchoolId, x.AcademicTermId, x.TeacherId })
            .IsUnique()
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ux_teacher_availabilities_term_teacher");

        // Owned: seyrek slot listesi (field-backed).
        builder.OwnsMany<Oksis.Domain.Modules.Timetable.ValueObjects.AvailabilitySlot>("_slots", slot =>
        {
            slot.ToAcademicTable("teacher_availability_slots");
            slot.WithOwner().HasForeignKey("teacher_availability_id");
            slot.Property<Guid>("id");
            slot.HasKey("id");

            slot.Property(s => s.Day).HasColumnName("day_of_week").HasConversion<int>().IsRequired();
            slot.Property(s => s.Period).HasColumnName("period").IsRequired();
            slot.Property(s => s.Status).HasColumnName("status").HasConversion<int>().IsRequired();

            // teacher_id denormalize: provider join'siz okusun.
            slot.Property<Guid>("teacher_id");
            slot.Property<Guid>("school_id");

            slot.HasIndex("school_id", "teacher_availability_id", "day_of_week", "period")
                .IsUnique()
                .HasDatabaseName("ux_teacher_availability_slots_slot");
            slot.HasIndex("school_id", "teacher_id")
                .HasDatabaseName("ix_teacher_availability_slots_teacher");
        });

        builder.Metadata.FindNavigation("_slots")!.SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}
```

> The `teacher_id`/`school_id` shadow properties on slots are populated in the Save command handler (Task 8) via the change tracker, OR set them as real owned columns fed from the parent. If the shadow-property fill proves awkward, fold `TeacherId`/`SchoolId` as explicit fields on `AvailabilitySlot` and set them in `SetSlot`. Decide during implementation; the unique slot index must include `school_id` for tenant safety.

- [ ] **Step 3: Build to verify config compiles**

Run: `dotnet build`
Expected: build succeeds (model builds; `ApplyConfigurationsFromAssembly` auto-discovers the config).

- [ ] **Step 4: Generate the migration**

Run:
```bash
dotnet ef migrations add 20260617_add_teacher_availabilities \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Expected: two tables created in migration `Up()` — `teacher_availabilities` and `teacher_availability_slots` with the unique indexes. Inspect the generated file to confirm `[academic]` schema and indexes.

- [ ] **Step 5: Verify migration applies (integration DB)**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Migration" ` (or the project's DB-bootstrap test). If none, run `dotnet build` and rely on Task 4's integration test to exercise the schema.
Expected: no pending-model-changes error.

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Infrastructure/Persistence/Configurations/Timetable/TeacherAvailabilityConfiguration.cs \
        src/Oksis.Infrastructure/Persistence/OksisDbContext.cs \
        src/Oksis.Infrastructure/Persistence/Migrations/*add_teacher_availabilities*
git commit -m "2026-06-17 feat: teacher_availabilities + slots tabloları ve migration eklendi."
```

---

## Task 4: TeacherAvailabilityProvider (hard + soft), replaces Noop

**Files:**
- Modify: `src/Oksis.Application/Modules/Timetable/Ports/IAvailabilityProvider.cs`
- Delete: `src/Oksis.Infrastructure/Timetable/NoopAvailabilityProvider.cs`
- Create: `src/Oksis.Infrastructure/Timetable/TeacherAvailabilityProvider.cs`
- Modify: `src/Oksis.Infrastructure/DependencyInjection.cs:319`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Timetable/TeacherAvailabilityProviderTests.cs`

**Interfaces:**
- Consumes: `TeacherAvailabilities` DbSet, `TimeSlot`, `AvailabilityStatus`.
- Produces: `IAvailabilityProvider` with existing `GetBlockedSlotsAsync` (now reads `Status==Unavailable`) **plus new** `Task<IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>> GetDislikedSlotsAsync(Guid schoolId, Guid termId, IReadOnlyCollection<Guid> teacherIds, CancellationToken ct)` (reads `Status==PrefersNot`).

- [ ] **Step 1: Extend the port**

In `IAvailabilityProvider.cs`, add the second method to the interface:
```csharp
public interface IAvailabilityProvider
{
    /// <summary>Hard engel: Status == Unavailable slotları.</summary>
    Task<IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>> GetBlockedSlotsAsync(
        Guid schoolId, Guid termId, IReadOnlyCollection<Guid> teacherIds, CancellationToken ct);

    /// <summary>Soft: Status == PrefersNot slotları (skorlama cezası; engel değil).</summary>
    Task<IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>> GetDislikedSlotsAsync(
        Guid schoolId, Guid termId, IReadOnlyCollection<Guid> teacherIds, CancellationToken ct);
}
```

- [ ] **Step 2: Write the failing integration test**

```csharp
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.Enums;
using Oksis.Domain.Modules.Timetable.ValueObjects;
// uses the project's integration test base that provides a seeded DbContext + tenant

namespace Oksis.Infrastructure.IntegrationTests.Timetable;

public class TeacherAvailabilityProviderTests : IntegrationTestBase // mirror existing base class name
{
    [Fact]
    public async Task GetBlockedSlots_ReturnsOnlyUnavailable()
    {
        var termId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();
        var a = TeacherAvailability.Create(SchoolId, Guid.NewGuid(), termId, teacherId);
        a.SetSlot(DayOfWeek.Monday, 1, AvailabilityStatus.Unavailable);
        a.SetSlot(DayOfWeek.Monday, 2, AvailabilityStatus.PrefersNot);
        Db.TeacherAvailabilities.Add(a);
        await Db.SaveChangesAsync(default);

        var provider = new TeacherAvailabilityProvider(Db);
        var blocked = await provider.GetBlockedSlotsAsync(SchoolId, termId, new[] { teacherId }, default);

        Assert.True(blocked[teacherId].Contains(new TimeSlot(DayOfWeek.Monday, 1)));
        Assert.False(blocked[teacherId].Contains(new TimeSlot(DayOfWeek.Monday, 2)));
    }

    [Fact]
    public async Task GetDislikedSlots_ReturnsOnlyPrefersNot()
    {
        var termId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();
        var a = TeacherAvailability.Create(SchoolId, Guid.NewGuid(), termId, teacherId);
        a.SetSlot(DayOfWeek.Monday, 2, AvailabilityStatus.PrefersNot);
        Db.TeacherAvailabilities.Add(a);
        await Db.SaveChangesAsync(default);

        var provider = new TeacherAvailabilityProvider(Db);
        var disliked = await provider.GetDislikedSlotsAsync(SchoolId, termId, new[] { teacherId }, default);

        Assert.True(disliked[teacherId].Contains(new TimeSlot(DayOfWeek.Monday, 2)));
    }
}
```

> Match the integration base class, `Db`, and `SchoolId` accessors to the project's existing convention (read one sibling test under `tests/Oksis.Infrastructure.IntegrationTests/Timetable/`).

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~TeacherAvailabilityProviderTests"`
Expected: FAIL — `TeacherAvailabilityProvider` not defined.

- [ ] **Step 4: Implement the provider; delete Noop; swap DI**

Delete `NoopAvailabilityProvider.cs`. Create `TeacherAvailabilityProvider.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Timetable.Ports;
using Oksis.Domain.Modules.Timetable.Enums;
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Infrastructure.Timetable;

/// <summary>
/// Müsaitlik tablosundan solver girdilerini okur. Unavailable → hard-block (GetBlockedSlots);
/// PrefersNot → soft tercih (GetDislikedSlots). Debt-AG-1'i kapatır (Noop yerine).
/// </summary>
public sealed class TeacherAvailabilityProvider(IApplicationDbContext db) : IAvailabilityProvider
{
    public Task<IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>> GetBlockedSlotsAsync(
        Guid schoolId, Guid termId, IReadOnlyCollection<Guid> teacherIds, CancellationToken ct)
        => QueryByStatusAsync(termId, teacherIds, AvailabilityStatus.Unavailable, ct);

    public Task<IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>> GetDislikedSlotsAsync(
        Guid schoolId, Guid termId, IReadOnlyCollection<Guid> teacherIds, CancellationToken ct)
        => QueryByStatusAsync(termId, teacherIds, AvailabilityStatus.PrefersNot, ct);

    private async Task<IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>> QueryByStatusAsync(
        Guid termId, IReadOnlyCollection<Guid> teacherIds, AvailabilityStatus status, CancellationToken ct)
    {
        if (teacherIds.Count == 0)
        {
            return new Dictionary<Guid, IReadOnlySet<TimeSlot>>();
        }

        // Tenant filtresi global query filter ile uygulanır (SchoolId).
        var rows = await db.TeacherAvailabilities
            .AsNoTracking()
            .Where(a => a.AcademicTermId == termId && teacherIds.Contains(a.TeacherId))
            .Select(a => new { a.TeacherId, Slots = a.Slots })
            .ToListAsync(ct);

        var result = new Dictionary<Guid, IReadOnlySet<TimeSlot>>();
        foreach (var row in rows)
        {
            var set = row.Slots
                .Where(s => s.Status == status)
                .Select(s => new TimeSlot(s.Day, s.Period))
                .ToHashSet();
            result[row.TeacherId] = set;
        }

        return result;
    }
}
```

In `DependencyInjection.cs:319`, replace:
```csharp
services.AddScoped<IAvailabilityProvider, Timetable.NoopAvailabilityProvider>();
```
with:
```csharp
// Müsaitlik artık gerçek tablodan okunur (Debt-AG-1 kapandı).
services.AddScoped<IAvailabilityProvider, Timetable.TeacherAvailabilityProvider>();
```

- [ ] **Step 5: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~TeacherAvailabilityProviderTests"`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Timetable/Ports/IAvailabilityProvider.cs \
        src/Oksis.Infrastructure/Timetable/TeacherAvailabilityProvider.cs \
        src/Oksis.Infrastructure/DependencyInjection.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Timetable/TeacherAvailabilityProviderTests.cs
git rm src/Oksis.Infrastructure/Timetable/NoopAvailabilityProvider.cs
git commit -m "2026-06-17 feat: TeacherAvailabilityProvider gerçeklendi, Noop kaldırıldı (Debt-AG-1 kapandı)."
```

---

## Task 5: Solver soft path — weights + scorer preference component

**Files:**
- Modify: `src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/SolverContracts.cs`
- Modify: `src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/CandidateScorer.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/AutoGenerate/CandidateScorerPreferenceTests.cs`

**Interfaces:**
- Consumes: `WeightLevel`, `PlannedPlacement` (existing), `SolverWeights`.
- Produces:
  - `SolverWeights` gains positional `WeightLevel RespectTeacherPreference` (added as the 7th param, **before** the trailing bool block to keep boolean grouping — see exact order below) and `Default` sets it `Mid`.
  - `SolveInput` gains trailing `IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>> TeacherDislikedSlots`.
  - `CandidateScorer.Score(...)` gains a parameter `IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>> dislikedByTeacher` and folds preference satisfaction into `weightedSum`.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Application.Modules.Timetable.AutoGenerate.Solver;
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Application.UnitTests.Modules.Timetable.AutoGenerate;

public class CandidateScorerPreferenceTests
{
    private static readonly Guid T1 = Guid.NewGuid();

    private static PlannedPlacement P(DayOfWeek day, int period) =>
        new(Guid.NewGuid() /*BranchId*/, Guid.NewGuid() /*SubjectId*/, T1 /*TeacherId*/, (int)day, period);
    // ^ adjust to the real PlannedPlacement constructor (check SolverContracts.cs)

    [Fact]
    public void DislikedSlotPlacement_LowersPreferencePercent()
    {
        var placements = new[] { P(DayOfWeek.Monday, 1), P(DayOfWeek.Monday, 2) };
        var weights = SolverWeights.Default with { RespectTeacherPreference = WeightLevel.High };
        var hard = new HashSet<Guid>();

        var noDislike = CandidateScorer.Score(
            placements, missingHours: 0, weights, hard, periodCount: 8,
            dislikedByTeacher: new Dictionary<Guid, IReadOnlySet<TimeSlot>>());

        var withDislike = CandidateScorer.Score(
            placements, missingHours: 0, weights, hard, periodCount: 8,
            dislikedByTeacher: new Dictionary<Guid, IReadOnlySet<TimeSlot>>
            {
                [T1] = new HashSet<TimeSlot> { new(DayOfWeek.Monday, 1) },
            });

        Assert.True(withDislike.PreferencePercent < noDislike.PreferencePercent,
            $"disliked={withDislike.PreferencePercent} should be < clean={noDislike.PreferencePercent}");
    }
}
```

> Adjust `PlannedPlacement` construction to its real signature in `SolverContracts.cs`. The existing `Score` is `static class CandidateScorer` with `Weight(level)=(int)level+1` and `wMorning*morningScore + wGaps*gapScore + wBalance*balanceScore` over `totalWeight`.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CandidateScorerPreferenceTests"`
Expected: FAIL — `RespectTeacherPreference`/new `Score` overload not defined.

- [ ] **Step 3: Implement — SolverContracts**

In `SolverContracts.cs`, change `SolverWeights` to:
```csharp
public sealed record SolverWeights(
    WeightLevel MorningHardSubjects,
    WeightLevel MinimizeGaps,
    WeightLevel DailyBalance,
    WeightLevel RespectTeacherPreference,
    bool KeepBlocks,
    bool LimitDailySameSubject,
    bool PreferBlockPairing)
{
    public static SolverWeights Default =>
        new(WeightLevel.Mid, WeightLevel.High, WeightLevel.Mid, WeightLevel.Mid,
            KeepBlocks: true, LimitDailySameSubject: true, PreferBlockPairing: true);
}
```
And extend `SolveInput` with a trailing param:
```csharp
public sealed record SolveInput(
    IReadOnlyList<LessonDemand> Demands,
    IReadOnlyList<TimeSlot> AvailableSlots,
    IReadOnlyDictionary<(Guid TeacherId, DayOfWeek Day, int Period), Guid> ExternalTeacherOwner,
    IReadOnlyDictionary<(Guid RoomId, DayOfWeek Day, int Period), Guid> ExternalRoomOwner,
    IReadOnlyDictionary<Guid, Guid?> HomeRoomByBranch,
    SolverWeights Weights,
    bool StrictMode,
    int CandidateCount,
    IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>> TeacherBlockedSlots,
    IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>> TeacherDislikedSlots);
```

- [ ] **Step 4: Implement — CandidateScorer preference component**

In `CandidateScorer.cs`, change the `Score` signature and body:
```csharp
public static CandidateMetrics Score(
    IReadOnlyList<PlannedPlacement> placements,
    int missingHours,
    SolverWeights weights,
    IReadOnlySet<Guid> hardSubjectIds,
    int periodCount,
    IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>> dislikedByTeacher)
{
    ArgumentNullException.ThrowIfNull(placements);
    ArgumentNullException.ThrowIfNull(weights);
    ArgumentNullException.ThrowIfNull(hardSubjectIds);
    ArgumentNullException.ThrowIfNull(dislikedByTeacher);

    var avgTeacherGap = ComputeAvgTeacherGap(placements);
    var effectivePeriodCount = periodCount > 0
        ? periodCount
        : (placements.Count > 0 ? placements.Max(p => p.Period) : 0);

    var morningScore = ComputeMorningScore(placements, hardSubjectIds, effectivePeriodCount);
    var gapScore = 1.0 / (1.0 + avgTeacherGap);
    var balanceScore = ComputeBalanceScore(placements);
    var preferenceScore = ComputePreferenceScore(placements, dislikedByTeacher);

    var wMorning = Weight(weights.MorningHardSubjects);
    var wGaps = Weight(weights.MinimizeGaps);
    var wBalance = Weight(weights.DailyBalance);
    var wPref = Weight(weights.RespectTeacherPreference);

    var weightedSum = (wMorning * morningScore) + (wGaps * gapScore)
        + (wBalance * balanceScore) + (wPref * preferenceScore);
    var totalWeight = wMorning + wGaps + wBalance + wPref;
    var preferencePercent = (int)Math.Round(100.0 * weightedSum / totalWeight, MidpointRounding.AwayFromZero);

    var label = balanceScore >= 0.75 ? "Dengeli" : balanceScore >= 0.5 ? "Orta" : "Zayıf";

    return new CandidateMetrics(
        ConflictCount: 0,
        MissingHours: missingHours,
        AvgTeacherGap: avgTeacherGap,
        PreferencePercent: preferencePercent,
        DailyBalanceLabel: label,
        Score: preferencePercent);
}

/// <summary>
/// Tercih-edilmeyen slota düşmeyen yerleşim oranı (1 = hiç ihlal yok). Disliked yoksa 1.0.
/// </summary>
private static double ComputePreferenceScore(
    IReadOnlyList<PlannedPlacement> placements,
    IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>> dislikedByTeacher)
{
    if (placements.Count == 0 || dislikedByTeacher.Count == 0)
    {
        return 1.0;
    }

    var violations = placements.Count(p =>
        dislikedByTeacher.TryGetValue(p.TeacherId, out var set)
        && set.Contains(new TimeSlot((DayOfWeek)p.Day, p.Period)));

    return 1.0 - ((double)violations / placements.Count);
}
```

> If `PlannedPlacement.Day` is already a `DayOfWeek`, drop the cast. Verify the property name/type in `SolverContracts.cs`.

- [ ] **Step 5: Fix the per-class scorer call**

`CandidateScorer.ScorePerClass(...)` also calls `Score(...)`. Add a `dislikedByTeacher` parameter to `ScorePerClass` and forward it to each `Score` call. Update its signature accordingly (it currently passes `(classPlacements, missing, weights, hardSubjectIds, periodCount)`). Add the dictionary as the final param and pass it through.

- [ ] **Step 6: Run tests**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CandidateScorer"`
Expected: PASS (new test + existing scorer tests still green after callers updated). If `GreedySolver.cs`/`ScheduleSolver.cs` call `Score`/`ScorePerClass`, update those call sites to pass `input.TeacherDislikedSlots` (next step covers the input wiring).

- [ ] **Step 7: Wire solver internals**

In `ScheduleSolver.cs`/`GreedySolver.cs`, where `Score`/`ScorePerClass` are invoked, pass `input.TeacherDislikedSlots`. Build to confirm all call sites compile.

Run: `dotnet build` → Expected: success.

- [ ] **Step 8: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/*.cs \
        tests/Oksis.Application.UnitTests/Modules/Timetable/AutoGenerate/CandidateScorerPreferenceTests.cs
git commit -m "2026-06-17 feat: Solver tercih (soft) bileşeni — RespectTeacherPreference ağırlığı eklendi."
```

---

## Task 6: Autogen wiring — request DTO + handler + job

**Files:**
- Modify: `src/Oksis.Application/Modules/Timetable/Commands/EnqueueAutoGenerate/EnqueueAutoGenerateCommand.cs`
- Modify: `.../EnqueueAutoGenerate/EnqueueAutoGenerateCommandHandler.cs:51-57`
- Modify: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/AutoGenerateScheduleJob.cs:102-118`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/EnqueueAutoGenerateWeightsTests.cs`

**Interfaces:**
- Consumes: `SolverWeights` (now 7-arg), `IAvailabilityProvider.GetDislikedSlotsAsync`, `SolveInput` (now 10-arg).
- Produces: `AutoGenWeightsRequest` gains `WeightLevel RespectTeacherPreference`; the job populates `TeacherDislikedSlots`.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Application.Modules.Timetable.AutoGenerate.Solver;
using Oksis.Application.Modules.Timetable.Commands.EnqueueAutoGenerate;

namespace Oksis.Application.UnitTests.Modules.Timetable;

public class EnqueueAutoGenerateWeightsTests
{
    [Fact]
    public void WeightsRequest_MapsRespectTeacherPreference()
    {
        var req = new AutoGenWeightsRequest(
            WeightLevel.Mid, WeightLevel.High, WeightLevel.Mid,
            RespectTeacherPreference: WeightLevel.High,
            KeepBlocks: true, LimitDailySameSubject: true, PreferBlockPairing: true);

        var weights = new SolverWeights(
            req.MorningHardSubjects, req.MinimizeGaps, req.DailyBalance,
            req.RespectTeacherPreference, req.KeepBlocks, req.LimitDailySameSubject, req.PreferBlockPairing);

        Assert.Equal(WeightLevel.High, weights.RespectTeacherPreference);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~EnqueueAutoGenerateWeightsTests"`
Expected: FAIL — `RespectTeacherPreference` not on `AutoGenWeightsRequest`.

- [ ] **Step 3: Implement DTO + handler mapping**

In `EnqueueAutoGenerateCommand.cs`, update `AutoGenWeightsRequest`:
```csharp
public sealed record AutoGenWeightsRequest(
    WeightLevel MorningHardSubjects,
    WeightLevel MinimizeGaps,
    WeightLevel DailyBalance,
    WeightLevel RespectTeacherPreference,
    bool KeepBlocks,
    bool LimitDailySameSubject,
    bool PreferBlockPairing);
```
In `EnqueueAutoGenerateCommandHandler.cs:51-57`, update the `new SolverWeights(...)`:
```csharp
var weights = new SolverWeights(
    request.Weights.MorningHardSubjects,
    request.Weights.MinimizeGaps,
    request.Weights.DailyBalance,
    request.Weights.RespectTeacherPreference,
    request.Weights.KeepBlocks,
    request.Weights.LimitDailySameSubject,
    request.Weights.PreferBlockPairing);
```

- [ ] **Step 4: Wire the job**

In `AutoGenerateScheduleJob.cs`, after the `blocked` fetch (line 103-104) add:
```csharp
var disliked = await availability.GetDislikedSlotsAsync(
    schoolId, job.AcademicTermId, teacherIds, ct);
```
And update the `new SolveInput(...)` (line 109-118) to pass `disliked` as the trailing arg:
```csharp
var input = new SolveInput(
    allDemands,
    slots,
    extTeacher,
    extRoom,
    homeRoomByBranch,
    weights,
    job.Strict,
    CandidateCount,
    blocked,
    disliked);
```

- [ ] **Step 5: Run tests + build**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~EnqueueAutoGenerateWeightsTests"` → PASS.
Run: `dotnet build` → success (all `SolveInput`/`SolverWeights` callers updated).

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Timetable/Commands/EnqueueAutoGenerate/*.cs \
        src/Oksis.Infrastructure/BackgroundJobs/Jobs/AutoGenerateScheduleJob.cs \
        tests/Oksis.Application.UnitTests/Modules/Timetable/EnqueueAutoGenerateWeightsTests.cs
git commit -m "2026-06-17 feat: Otomatik üretim tercih ağırlığı uçtan uca bağlandı (job disliked slot besler)."
```

---

## Task 7: Queries — GetTeacherAvailability + GetTermTeacherAvailability

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/DTOs/AvailabilitySlotDto.cs`
- Create: `src/Oksis.Application/Modules/Timetable/DTOs/TeacherAvailabilityDto.cs`
- Create: `src/Oksis.Application/Modules/Timetable/DTOs/TermTeacherAvailabilityDto.cs`
- Create: `src/Oksis.Application/Modules/Timetable/Queries/GetTeacherAvailability/{GetTeacherAvailabilityQuery.cs,GetTeacherAvailabilityQueryHandler.cs}`
- Create: `src/Oksis.Application/Modules/Timetable/Queries/GetTermTeacherAvailability/{GetTermTeacherAvailabilityQuery.cs,GetTermTeacherAvailabilityQueryHandler.cs}`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/GetTeacherAvailabilityQueryTests.cs` (or integration if DbContext needed)

**Interfaces:**
- Consumes: `TeacherAvailabilities` DbSet, `IApplicationDbContext`, `IQuery<T>`/`IQueryHandler<,>`, `Result<T>`.
- Produces:
  - `record AvailabilitySlotDto(int Day, int Period, int Status)`
  - `record TeacherAvailabilityDto(Guid TeacherId, Guid TermId, IReadOnlyList<AvailabilitySlotDto> Slots)`
  - `record TermTeacherAvailabilityDto(Guid TermId, IReadOnlyList<TeacherAvailabilityDto> Teachers)`
  - `GetTeacherAvailabilityQuery(Guid TeacherId, Guid TermId) : IQuery<TeacherAvailabilityDto>` `[RequirePermission("timetable.manage")]`
  - `GetTermTeacherAvailabilityQuery(Guid TermId) : IQuery<TermTeacherAvailabilityDto>` `[RequirePermission("timetable.manage")]`

- [ ] **Step 1: Write the DTOs**

`AvailabilitySlotDto.cs`:
```csharp
namespace Oksis.Application.Modules.Timetable.DTOs;

/// <summary>Tek slot: Day (DayOfWeek int), Period (1..N), Status (AvailabilityStatus int).</summary>
public sealed record AvailabilitySlotDto(int Day, int Period, int Status);
```
`TeacherAvailabilityDto.cs`:
```csharp
namespace Oksis.Application.Modules.Timetable.DTOs;

public sealed record TeacherAvailabilityDto(Guid TeacherId, Guid TermId, IReadOnlyList<AvailabilitySlotDto> Slots);
```
`TermTeacherAvailabilityDto.cs`:
```csharp
namespace Oksis.Application.Modules.Timetable.DTOs;

public sealed record TermTeacherAvailabilityDto(Guid TermId, IReadOnlyList<TeacherAvailabilityDto> Teachers);
```

- [ ] **Step 2: Write the failing handler test (integration)**

```csharp
using Oksis.Application.Modules.Timetable.Queries.GetTeacherAvailability;
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.Enums;

namespace Oksis.Application.IntegrationTests.Modules.Timetable; // or Infrastructure.IntegrationTests

public class GetTeacherAvailabilityQueryTests : IntegrationTestBase
{
    [Fact]
    public async Task ReturnsSparseSlotsForTeacher()
    {
        var termId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();
        var a = TeacherAvailability.Create(SchoolId, Guid.NewGuid(), termId, teacherId);
        a.SetSlot(DayOfWeek.Monday, 1, AvailabilityStatus.Unavailable);
        Db.TeacherAvailabilities.Add(a);
        await Db.SaveChangesAsync(default);

        var handler = new GetTeacherAvailabilityQueryHandler(Db);
        var result = await handler.Handle(new GetTeacherAvailabilityQuery(teacherId, termId), default);

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!.Slots);
        Assert.Equal((int)AvailabilityStatus.Unavailable, result.Value!.Slots[0].Status);
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test --filter "FullyQualifiedName~GetTeacherAvailabilityQueryTests"`
Expected: FAIL — query/handler not defined.

- [ ] **Step 4: Implement queries + handlers**

`GetTeacherAvailability/GetTeacherAvailabilityQuery.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Queries.GetTeacherAvailability;

/// <summary>Bir öğretmenin bir dönemdeki müsaitlik/tercih ızgarası (seyrek). İzin: timetable.manage.</summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("timetable.manage")]
public sealed record GetTeacherAvailabilityQuery(Guid TeacherId, Guid TermId)
    : IQuery<TeacherAvailabilityDto>;
```
`GetTeacherAvailability/GetTeacherAvailabilityQueryHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Common.Results;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Queries.GetTeacherAvailability;

public sealed class GetTeacherAvailabilityQueryHandler(IApplicationDbContext db)
    : IQueryHandler<GetTeacherAvailabilityQuery, TeacherAvailabilityDto>
{
    public async Task<Result<TeacherAvailabilityDto>> Handle(
        GetTeacherAvailabilityQuery request, CancellationToken cancellationToken)
    {
        var entity = await db.TeacherAvailabilities
            .AsNoTracking()
            .FirstOrDefaultAsync(
                a => a.TeacherId == request.TeacherId && a.AcademicTermId == request.TermId,
                cancellationToken);

        var slots = entity is null
            ? new List<AvailabilitySlotDto>()
            : entity.Slots.Select(s => new AvailabilitySlotDto((int)s.Day, s.Period, (int)s.Status)).ToList();

        return Result<TeacherAvailabilityDto>.Success(
            new TeacherAvailabilityDto(request.TeacherId, request.TermId, slots));
    }
}
```
`GetTermTeacherAvailability/GetTermTeacherAvailabilityQuery.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Queries.GetTermTeacherAvailability;

/// <summary>Dönemdeki tüm öğretmenlerin müsaitlik haritası (editör tüketir). İzin: timetable.manage.</summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("timetable.manage")]
public sealed record GetTermTeacherAvailabilityQuery(Guid TermId)
    : IQuery<TermTeacherAvailabilityDto>;
```
`GetTermTeacherAvailability/GetTermTeacherAvailabilityQueryHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Common.Results;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Queries.GetTermTeacherAvailability;

public sealed class GetTermTeacherAvailabilityQueryHandler(IApplicationDbContext db)
    : IQueryHandler<GetTermTeacherAvailabilityQuery, TermTeacherAvailabilityDto>
{
    public async Task<Result<TermTeacherAvailabilityDto>> Handle(
        GetTermTeacherAvailabilityQuery request, CancellationToken cancellationToken)
    {
        var entities = await db.TeacherAvailabilities
            .AsNoTracking()
            .Where(a => a.AcademicTermId == request.TermId)
            .ToListAsync(cancellationToken);

        var teachers = entities.Select(a => new TeacherAvailabilityDto(
            a.TeacherId,
            request.TermId,
            a.Slots.Select(s => new AvailabilitySlotDto((int)s.Day, s.Period, (int)s.Status)).ToList()))
            .ToList();

        return Result<TermTeacherAvailabilityDto>.Success(
            new TermTeacherAvailabilityDto(request.TermId, teachers));
    }
}
```
> Confirm the `Result<T>` namespace (`Oksis.Application.Common.Results` vs `Oksis.Application.Common.Cqrs`) by checking `ListRoomsQueryHandler.cs` imports; match it.

- [ ] **Step 5: Run test to verify it passes**

Run: `dotnet test --filter "FullyQualifiedName~GetTeacherAvailabilityQueryTests"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Timetable/DTOs/*Availability*.cs \
        src/Oksis.Application/Modules/Timetable/Queries/GetTeacherAvailability/ \
        src/Oksis.Application/Modules/Timetable/Queries/GetTermTeacherAvailability/ \
        tests/**/GetTeacherAvailabilityQueryTests.cs
git commit -m "2026-06-17 feat: Müsaitlik sorguları (öğretmen + dönem geneli) eklendi."
```

---

## Task 8: SaveTeacherAvailabilityCommand + recompute trigger

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/Commands/SaveTeacherAvailability/{SaveTeacherAvailabilityCommand.cs,SaveTeacherAvailabilityCommandHandler.cs,SaveTeacherAvailabilityCommandValidator.cs}`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Timetable/SaveTeacherAvailabilityCommandTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext`, `ITenantContext`, `IScheduleProgramStatsRecomputer.SaveTermWithStatsAsync` (existing), `TeacherAvailability`.
- Produces: `SaveTeacherAvailabilityCommand(Guid TeacherId, Guid AcademicYearId, Guid TermId, IReadOnlyList<AvailabilitySlotDto> Slots) : ICommand` `[RequirePermission("timetable.manage")]`. Upserts the aggregate (sparse), then triggers term stats recompute so Hub availability counts refresh.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Application.Modules.Timetable.Commands.SaveTeacherAvailability;
using Oksis.Application.Modules.Timetable.DTOs;
using Oksis.Domain.Modules.Timetable.Enums;

namespace Oksis.Application.IntegrationTests.Modules.Timetable;

public class SaveTeacherAvailabilityCommandTests : IntegrationTestBase
{
    [Fact]
    public async Task Upserts_StoresOnlyNonAvailableSlots()
    {
        var termId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();
        var cmd = new SaveTeacherAvailabilityCommand(teacherId, Guid.NewGuid(), termId, new[]
        {
            new AvailabilitySlotDto((int)DayOfWeek.Monday, 1, (int)AvailabilityStatus.Unavailable),
            new AvailabilitySlotDto((int)DayOfWeek.Monday, 2, (int)AvailabilityStatus.Available), // dropped
        });

        var result = await Sender.Send(cmd); // use the project's test sender/dispatcher
        Assert.True(result.IsSuccess);

        var saved = await Db.TeacherAvailabilities.FirstAsync(a => a.TeacherId == teacherId);
        Assert.Single(saved.Slots);
        Assert.Equal(AvailabilityStatus.Unavailable, saved.Slots[0].Status);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test --filter "FullyQualifiedName~SaveTeacherAvailabilityCommandTests"`
Expected: FAIL — command not defined.

- [ ] **Step 3: Implement command + validator + handler**

`SaveTeacherAvailabilityCommand.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Commands.SaveTeacherAvailability;

/// <summary>
/// Bir öğretmenin dönem müsaitlik/tercihlerini kaydeder (upsert, seyrek). Available slotlar yok sayılır.
/// Kaydın ardından dönemdeki canlı programların availability istatistiği yeniden hesaplanır. İzin: timetable.manage.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("timetable.manage")]
public sealed record SaveTeacherAvailabilityCommand(
    Guid TeacherId,
    Guid AcademicYearId,
    Guid TermId,
    IReadOnlyList<AvailabilitySlotDto> Slots) : ICommand;
```
`SaveTeacherAvailabilityCommandValidator.cs`:
```csharp
using FluentValidation;
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Application.Modules.Timetable.Commands.SaveTeacherAvailability;

public sealed class SaveTeacherAvailabilityCommandValidator : AbstractValidator<SaveTeacherAvailabilityCommand>
{
    public SaveTeacherAvailabilityCommandValidator()
    {
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.TermId).NotEmpty();
        RuleFor(x => x.AcademicYearId).NotEmpty();
        RuleForEach(x => x.Slots).ChildRules(s =>
        {
            s.RuleFor(x => x.Period)
                .InclusiveBetween(TimeSlot.MinPeriod, TimeSlot.MaxPeriod);
            s.RuleFor(x => x.Status).InclusiveBetween(0, 2);
            s.RuleFor(x => x.Day).InclusiveBetween(0, 6);
        });
    }
}
```
`SaveTeacherAvailabilityCommandHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Common.Results;
using Oksis.Application.Modules.Timetable.Services;
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.Enums;
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Application.Modules.Timetable.Commands.SaveTeacherAvailability;

public sealed class SaveTeacherAvailabilityCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IScheduleProgramStatsRecomputer stats)
    : ICommandHandler<SaveTeacherAvailabilityCommand>
{
    public async Task<Result> Handle(SaveTeacherAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var schoolId = tenant.CurrentSchoolId;
        if (schoolId is null)
        {
            return Result.Forbidden();
        }

        var entity = await db.TeacherAvailabilities
            .FirstOrDefaultAsync(
                a => a.TeacherId == request.TeacherId && a.AcademicTermId == request.TermId,
                cancellationToken);

        var slots = request.Slots
            .Select(s => new AvailabilitySlot((DayOfWeek)s.Day, s.Period, (AvailabilityStatus)s.Status));

        if (entity is null)
        {
            entity = TeacherAvailability.Create(schoolId.Value, request.AcademicYearId, request.TermId, request.TeacherId);
            entity.ReplaceAll(slots);
            db.TeacherAvailabilities.Add(entity);
        }
        else
        {
            entity.ReplaceAll(slots);
        }

        await db.SaveChangesAsync(cancellationToken);

        // Müsaitlik değişti → dönemdeki canlı programların availability ihlal sayıları tazelenmeli.
        await stats.SaveTermWithStatsAsync(schoolId.Value, request.TermId, cancellationToken);

        return Result.Success();
    }
}
```
> Verify `ICommandHandler<TCommand>` (no result) and `Result` (non-generic) exist as used by `MoveLessonCommandHandler` (which is `ICommand` → `ICommandHandler<MoveLessonCommand>`). Match those exact types.

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test --filter "FullyQualifiedName~SaveTeacherAvailabilityCommandTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Timetable/Commands/SaveTeacherAvailability/ \
        tests/**/SaveTeacherAvailabilityCommandTests.cs
git commit -m "2026-06-17 feat: SaveTeacherAvailability komutu + dönem stats recompute tetiği eklendi."
```

---

## Task 9: Hub denormalized availability_violation_count

**Files:**
- Modify: `src/Oksis.Domain/Modules/Timetable/Entities/ScheduleProgram.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Timetable/ScheduleProgramConfiguration.cs`
- Migration: `20260617_add_availability_violation_count`
- Modify: `src/Oksis.Application/Modules/Timetable/Services/ScheduleProgramStatsRecomputer.cs`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Timetable/AvailabilityViolationStatsTests.cs`

**Interfaces:**
- Consumes: `IAvailabilityProvider.GetBlockedSlotsAsync`/`GetDislikedSlotsAsync` (or direct table read), `ScheduleProgram.Placements`.
- Produces: `ScheduleProgram.AvailabilityViolationCount { get; private set; }` + `void SetAvailabilityViolations(int count)`; column `availability_violation_count` on `schedule_programs`; recomputer fills it during `SaveTermWithStatsAsync`/`SaveProgramWithStatsAsync`.

- [ ] **Step 1: Write the failing test**

```csharp
namespace Oksis.Application.IntegrationTests.Modules.Timetable;

public class AvailabilityViolationStatsTests : IntegrationTestBase
{
    [Fact]
    public async Task Recompute_CountsUnavailableViolationsOnLiveProgram()
    {
        // Arrange: a live ScheduleProgram with one placement at Mon/1 for teacher T,
        // and T marked Unavailable at Mon/1. After SaveTermWithStatsAsync the program's
        // AvailabilityViolationCount should be 1.
        // (Build using existing program/placement test helpers + TeacherAvailability.)
        // ... see existing ScheduleProgramStatsRecomputer tests for the live-program setup ...
        Assert.True(true); // replace with real assertions mirroring stats-recomputer test style
    }
}
```
> Open the existing recomputer test (search `tests` for `ScheduleProgramStatsRecomputer`/`conflict_count`) and clone its live-program arrangement; assert `program.AvailabilityViolationCount == 1`.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test --filter "FullyQualifiedName~AvailabilityViolationStatsTests"`
Expected: FAIL — `AvailabilityViolationCount` not defined.

- [ ] **Step 3: Domain — add the property + setter**

In `ScheduleProgram.cs`, add near `ConflictCount`/`MissingHours`:
```csharp
public int AvailabilityViolationCount { get; private set; }

/// <summary>Denormalize: bu programdaki yerleşimlerin öğretmen "müsait değil" ihlali sayısı (Hub okur).</summary>
public void SetAvailabilityViolations(int count)
    => AvailabilityViolationCount = count < 0 ? 0 : count;
```

- [ ] **Step 4: Config + migration**

In `ScheduleProgramConfiguration.cs`, after the `MissingHours` property mapping:
```csharp
builder.Property(x => x.AvailabilityViolationCount).IsRequired().HasDefaultValue(0);
```
Generate the migration:
```bash
dotnet ef migrations add 20260617_add_availability_violation_count \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Expected: adds `availability_violation_count INT NOT NULL DEFAULT 0` to `[academic].schedule_programs`.

- [ ] **Step 5: Recomputer — compute the count**

In `ScheduleProgramStatsRecomputer.cs`, inside the per-program stats application (where `program.SetStats(conflictCount, missingHours)` is called), add an availability lookup. Load the term's `Unavailable` slots once per term recompute (keyed by `TeacherId`), then for each program:
```csharp
// Müsaitlik ihlali: programdaki aktif yerleşimlerden, öğretmenin "müsait değil" slotuna düşenler.
var violations = program.ActivePlacements.Count(p =>
    unavailableByTeacher.TryGetValue(p.TeacherId, out var set)
    && set.Contains(new TimeSlot(p.Slot.Day, p.Slot.Period)));
program.SetAvailabilityViolations(violations);
```
Where `unavailableByTeacher` is built from a single query over `db.TeacherAvailabilities` for the term (mirror the provider's status filter). Inject nothing new if the recomputer already has `IApplicationDbContext`; otherwise read via the existing context field.
> Confirm `LessonPlacement` exposes `TeacherId` and a `Slot` (`TimeSlot`) — adjust property access to the real names (the entity has `Place(slot, subjectId, teacherId, roomId)`, so placement carries these).

- [ ] **Step 6: Run test to verify it passes**

Run: `dotnet test --filter "FullyQualifiedName~AvailabilityViolationStatsTests"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
dotnet format
git add src/Oksis.Domain/Modules/Timetable/Entities/ScheduleProgram.cs \
        src/Oksis.Infrastructure/Persistence/Configurations/Timetable/ScheduleProgramConfiguration.cs \
        src/Oksis.Infrastructure/Persistence/Migrations/*availability_violation_count* \
        src/Oksis.Application/Modules/Timetable/Services/ScheduleProgramStatsRecomputer.cs \
        tests/**/AvailabilityViolationStatsTests.cs
git commit -m "2026-06-17 feat: Hub müsaitlik ihlali denormalize sayacı + recompute eklendi."
```

---

## Task 10: Editor override — AllowUnavailable on Place/Move/AssignTeacher

**Files:**
- Modify: `src/Oksis.Application/Modules/Timetable/Commands/PlaceLesson/{PlaceLessonCommand.cs,PlaceLessonCommandHandler.cs}`
- Modify: `src/Oksis.Application/Modules/Timetable/Commands/MoveLesson/{MoveLessonCommand.cs,MoveLessonCommandHandler.cs}`
- Modify: `src/Oksis.Application/Modules/Timetable/Commands/AssignTeacher/{AssignTeacherCommand.cs,AssignTeacherCommandHandler.cs}`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Timetable/PlaceLessonOverrideTests.cs`

**Interfaces:**
- Consumes: `IPermissionReader.HasPermissionAsync(string, CancellationToken)`, `IApplicationDbContext`, `TimeSlot`, `AvailabilityStatus`.
- Produces: each command gains `bool AllowUnavailable` (default `false`). Handler: if the target slot is `Unavailable` for the teacher → block with `"timetable.errors.teacher-unavailable"` unless `AllowUnavailable == true` **and** `IPermissionReader.HasPermissionAsync("timetable.override")` returns true (else `Result.Forbidden()`).

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Application.Modules.Timetable.Commands.PlaceLesson;
using Oksis.Domain.Modules.Timetable.Enums;

namespace Oksis.Application.IntegrationTests.Modules.Timetable;

public class PlaceLessonOverrideTests : IntegrationTestBase
{
    [Fact]
    public async Task Place_OnUnavailableSlot_BlockedWithoutOverride()
    {
        var (programId, teacherId, subjectId, termId) = await SeedProgramWithTeacherAsync();
        await MarkTeacherUnavailableAsync(teacherId, termId, DayOfWeek.Monday, 1);

        var result = await Sender.Send(new PlaceLessonCommand(
            programId, (int)DayOfWeek.Monday, 1, subjectId, teacherId, null) { AllowUnavailable = false });

        Assert.False(result.IsSuccess); // Conflict: teacher-unavailable
    }

    [Fact]
    public async Task Place_OnUnavailableSlot_AllowedWithOverridePermission()
    {
        var (programId, teacherId, subjectId, termId) = await SeedProgramWithTeacherAsync();
        await MarkTeacherUnavailableAsync(teacherId, termId, DayOfWeek.Monday, 1);
        GrantPermission("timetable.override"); // test harness helper

        var result = await Sender.Send(new PlaceLessonCommand(
            programId, (int)DayOfWeek.Monday, 1, subjectId, teacherId, null) { AllowUnavailable = true });

        Assert.True(result.IsSuccess);
    }
}
```
> `AllowUnavailable` as an init-only extra property keeps the positional ctor stable. If the test harness can't set `timetable.override` granularly, assert the Forbidden path by stubbing `IPermissionReader`. Mirror existing command tests for `Sender`/seed helpers.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test --filter "FullyQualifiedName~PlaceLessonOverrideTests"`
Expected: FAIL — `AllowUnavailable` not defined / no block logic.

- [ ] **Step 3: Add the flag to commands**

In `PlaceLessonCommand.cs`, add an init property (keeps positional ctor):
```csharp
[Tenancy(TenancyMode.Required)]
[RequirePermission("timetable.manage")]
public sealed record PlaceLessonCommand(
    Guid ProgramId,
    int Day,
    int Period,
    Guid SubjectId,
    Guid TeacherId,
    Guid? RoomId) : ICommand<Guid>
{
    /// <summary>"Müsait değil" slota override yerleştirme (ek olarak timetable.override ister).</summary>
    public bool AllowUnavailable { get; init; }
}
```
Do the same for `MoveLessonCommand` and `AssignTeacherCommand`.

- [ ] **Step 4: Add the guard to PlaceLessonCommandHandler**

Inject `IPermissionReader permissions` into the handler ctor. After resolving `schoolId` and loading `program`, before the occupancy check, add:
```csharp
// Müsaitlik hard-block: öğretmen bu slotta "müsait değil" ise engelle (override timetable.override ister).
var blockedSlot = await db.TeacherAvailabilities
    .AsNoTracking()
    .Where(a => a.TeacherId == request.TeacherId && a.AcademicTermId == program.AcademicTermId)
    .SelectMany(a => a.Slots)
    .AnyAsync(s => s.Day == day && s.Period == request.Period
        && s.Status == AvailabilityStatus.Unavailable, cancellationToken);

if (blockedSlot)
{
    if (!request.AllowUnavailable)
    {
        return Result<Guid>.Conflict("timetable.errors.teacher-unavailable");
    }

    if (!await permissions.HasPermissionAsync("timetable.override", cancellationToken))
    {
        return Result<Guid>.Forbidden();
    }
}
```
Add `using Oksis.Domain.Modules.Timetable.Enums;`. For `MoveLessonCommandHandler` (target slot = `request.Day`/`request.Period`, teacher = the placement's teacher — load it) and `AssignTeacherCommandHandler` (slot = the placement's existing slot, teacher = `request.TeacherId`), apply the same guard with the appropriate teacher/slot source. Each returns the non-generic `Result.Conflict(...)` / `Result.Forbidden()` matching its handler's result type.

- [ ] **Step 5: Run test to verify it passes**

Run: `dotnet test --filter "FullyQualifiedName~PlaceLessonOverrideTests"`
Expected: PASS (2 tests). Also run the existing Place/Move/AssignTeacher tests to confirm no regression: `dotnet test --filter "FullyQualifiedName~LessonCommand"`.

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Timetable/Commands/PlaceLesson/ \
        src/Oksis.Application/Modules/Timetable/Commands/MoveLesson/ \
        src/Oksis.Application/Modules/Timetable/Commands/AssignTeacher/ \
        tests/**/PlaceLessonOverrideTests.cs
git commit -m "2026-06-17 feat: Editör müsaitlik hard-block + timetable.override ile admin override eklendi."
```

---

## Task 11: API endpoints

**Files:**
- Modify (or create): the timetable controller under `src/Oksis.Api/Controllers/` (find the existing one that hosts `POST /programs/{id}/placements` — likely `TimetableController.cs` or `SchedulesController.cs`).
- Test: `tests/Oksis.Api.UnitTests/...` (controller delegates to `ISender.Send`; mirror existing controller tests).

**Interfaces:**
- Consumes: `GetTeacherAvailabilityQuery`, `GetTermTeacherAvailabilityQuery`, `SaveTeacherAvailabilityCommand`, `ISender`.
- Produces: 3 routes (all under the existing timetable area):
  - `GET  /api/v1/timetable/availability/teachers/{teacherId}?termId=...`
  - `GET  /api/v1/timetable/availability?termId=...`
  - `PUT  /api/v1/timetable/availability/teachers/{teacherId}`

- [ ] **Step 1: Locate the controller**

Run: `grep -rn "programs/{id}/placements\|[Route(\"api/v1/timetable" src/Oksis.Api/Controllers/`
Open the matching controller; mirror its `ISender` injection, `ProblemDetails` error mapping, and `Result`→`ActionResult` extension usage.

- [ ] **Step 2: Add the endpoints**

Add to that controller (adjust the `Result`→action helper to the project's existing one, e.g. `this.ToActionResult(result)`):
```csharp
[HttpGet("availability/teachers/{teacherId:guid}")]
public async Task<IActionResult> GetTeacherAvailability(Guid teacherId, [FromQuery] Guid termId, CancellationToken ct)
    => (await sender.Send(new GetTeacherAvailabilityQuery(teacherId, termId), ct)).ToActionResult();

[HttpGet("availability")]
public async Task<IActionResult> GetTermAvailability([FromQuery] Guid termId, CancellationToken ct)
    => (await sender.Send(new GetTermTeacherAvailabilityQuery(termId), ct)).ToActionResult();

[HttpPut("availability/teachers/{teacherId:guid}")]
public async Task<IActionResult> SaveTeacherAvailability(
    Guid teacherId, [FromBody] SaveTeacherAvailabilityRequest body, CancellationToken ct)
    => (await sender.Send(new SaveTeacherAvailabilityCommand(
            teacherId, body.AcademicYearId, body.TermId, body.Slots), ct)).ToActionResult();
```
Add a request body record (in the controller's contracts folder or inline):
```csharp
public sealed record SaveTeacherAvailabilityRequest(
    Guid AcademicYearId, Guid TermId, IReadOnlyList<AvailabilitySlotDto> Slots);
```

- [ ] **Step 3: Build + smoke test**

Run: `dotnet build` → success.
Run: `dotnet test tests/Oksis.Api.UnitTests` (if controller tests exist for the timetable controller, add one asserting the route delegates to `ISender`; else rely on the Application-layer tests).

- [ ] **Step 4: Commit**

```bash
dotnet format
git add src/Oksis.Api/Controllers/*.cs tests/Oksis.Api.UnitTests/**
git commit -m "2026-06-17 feat: Müsaitlik API uçları (GET/PUT) eklendi."
```

---

## Task 12: Full suite + docs

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md`
- Modify: `.claude/docs/modules/timetable/business-rules.md`, `permissions.md`, `database-schema.md`, `api-contracts.md`

- [ ] **Step 1: Run the full backend suite**

Run: `dotnet build && dotnet test`
Expected: all green. Fix any regressions in solver/command call sites surfaced by the record signature changes.

- [ ] **Step 2: Update module docs**

- `completion_status.md`: bump `Güncel` date to 2026-06-17; mark **Debt-AG-1 KAPANDI**; move D1 backend items to ✅. Log under "⚠️ Spec Dışına Çıkılanlar" the override-permission decision (override `timetable.override` ile, 2026-06-17, onay: kullanıcı).
- `business-rules.md`: add the three-state availability rule (hard/soft) + override gating.
- `permissions.md`: note `timetable.override` now also gates availability override (no new slug).
- `database-schema.md`: add `teacher_availabilities`, `teacher_availability_slots`, `schedule_programs.availability_violation_count`.
- `api-contracts.md`: add the 3 availability endpoints.

- [ ] **Step 3: Commit**

```bash
git add .claude/docs/modules/timetable/
git commit -m "2026-06-17 docs: Müsaitlik & tercih (Faz 4/Dilim 1) backend — modül dokümanları + Debt-AG-1 kapanışı."
```

---

## Self-Review

**Spec coverage** (design doc §3-§12):
- §3 Domain & Persistence → Tasks 1, 2, 3 ✓
- §4 Solver hard+soft → Tasks 4, 5, 6 ✓
- §5 Editor (override gating, block check; FE visuals are in the FE plan) → Task 10 ✓ (server side)
- §7 Hub denormalized count + recompute trigger → Tasks 8 (trigger), 9 (column+compute) ✓
- §8 API → Task 11 ✓ (+ queries/command in 7, 8)
- §10 Tests → each task is TDD ✓
- §11 Debt-AG-1 closes → Task 4 ✓
- §12 acceptance → Task 12 docs ✓
- §6 admin screen, §5 editor visuals, §9 i18n FE → **frontend plan (separate)**.

**Placeholder scan:** Code blocks are concrete. Three flagged verification points (not placeholders — explicit "confirm against existing sibling" notes): (a) base member for `Id` assignment on the aggregate, (b) owned-collection shadow column fill strategy in Task 3, (c) `PlannedPlacement`/`LessonPlacement` exact property names. These are real lookups the implementer does against named existing files, with a stated fallback — acceptable per "follow established patterns."

**Type consistency:** `SolverWeights` 7-arg order (Morning, Gaps, Balance, **RespectTeacherPreference**, KeepBlocks, LimitDailySameSubject, PreferBlockPairing) is identical in SolverContracts (Task 5), `AutoGenWeightsRequest` (Task 6), and the handler `new SolverWeights(...)` (Task 6). `SolveInput` trailing `TeacherDislikedSlots` consistent in Task 5 (definition) and Task 6 (job construction). `AvailabilityStatus` int mapping (0/1/2) consistent across DTOs (Task 7), validator (Task 8), provider (Task 4). `GetTermTeacherAvailabilityQuery`/`SaveTeacherAvailabilityCommand` names consistent across Tasks 7, 8, 11.

---

## Execution Handoff

Backend plan complete. The **frontend plan** (`oksis-web`: `schedule_avail.jsx` screen, editor override dialog/badge/yellow, autogen weight row, Hub `SchAvail` badge, i18n) is written separately and depends on Task 11's endpoints.
