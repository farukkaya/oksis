# Nöbet Çizelgesi Çekirdeği — Backend Implementation Plan (Faz 4 / Dilim 2a)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend for the duty roster core (`Duties` module): tenant duty locations, exemptions, a temporal `DutyRoster` aggregate with reliever assignments, school-level duty settings, the `duties.*` permission family, the CQRS slices behind `/api/v1/duties`, and the publish notification — in `oksis-api`.

**Architecture:** New `Oksis.Domain/Modules/Duties` aggregates (`DutyLocation`, `DutyExemption`, `DutyRoster`+`DutyAssignment`) next to the existing master `DutyLocationTemplate`. Roster is **temporal** (Draft→Published→Superseded; publish creates a new live version and supersedes the prior). All invariants live in the domain; cross-cutting safety is enforced by EF filtered unique indexes. Availability (Dilim 1) is **deliberately NOT consulted** for duties (binding K-2a-2). Reliever candidates come from actual lesson placements at the lunch window (NOT availability, K-2a-8). Duty settings live on the existing `SchoolSettings` aggregate.

**Tech Stack:** .NET 10, C# 13, EF Core 10, MediatR, FluentValidation, Mapster, SQL Server, xUnit.

**Design doc:** `.claude/specs/ders-programi-faz4-dilim2a-nobet-cizelge-design.md`
**Source analyses:** `Nobet-Vekalet-Ihtiyac-Analizi.docx`, `Nobet-Vekalet-Teknik-Analiz.docx`
**Handoff:** `oksis-layout/project/app/{duty_admin,duty_admin_more}.jsx`

## Global Constraints

- Working dir: `oksis-api/`. Solution: `Oksis.slnx`. All paths relative to `oksis-api/`.
- Multi-tenant: every tenant entity is `IHasTenant` via `TenantEntity`; never `IgnoreQueryFilters()`. `SchoolId` auto-filled by `TenantSaveChangesInterceptor`.
- Domain purity: no EF Core / DataAnnotations in `Oksis.Domain`; fluent mapping only in `Infrastructure/Persistence/Configurations/`.
- Naming: `Mark`=grade/score, `Grade`=year level, `Branch`=class section. Don't conflate. Duty domain identifiers in English; user copy in Turkish via i18n codes.
- Mapster (NOT AutoMapper). No repository wrapper over EF Core. No lazy loading. No `async void`/`.Result`/`.Wait()`.
- **K-2a-2 (CRITICAL):** Availability (`TeacherAvailability`, Dilim 1) is NOT an input to any duty/reliever logic. No duty handler may query `TeacherAvailabilities`.
- **K-2a-3 (CRITICAL):** Capacity-aware. Roster cell unique index is `(school_id, academic_term_id, duty_roster_id, day_of_week, location_id, teacher_id)`. Capacity (`count ≤ DutyLocation.Capacity`) is enforced in the aggregate — NOT a single-nöbetçi DB index.
- **K-2a-4 (CRITICAL):** No hard delete of rosters. `Publish` creates a new live version; the prior live version is superseded (`EffectiveTo` set). One live roster per term (DB filtered unique index backstop).
- **K-2a-8 (CRITICAL):** Reliever candidate = not exempt that day + no actual lesson in the lunch window that day + not already on a duty/reliever that day. Availability is irrelevant.
- Permissions are hardcoded strings on `[RequirePermission("...")]`. This dilim **adds** the `duties.*` family (new module — independent of `timetable.*`; spec §8 unaffected).
- Backend returns i18n **codes** only (e.g. `"duties.errors.teacher-exempt"`); translation is frontend.
- Schema helper: `builder.ToAcademicTable("name")` → `[academic]` schema.
- Domain exception type: `DutyDomainException(string code, string message)` (exists in `Oksis.Domain/Modules/Duties/Exceptions/`).
- Commit format (husky-enforced): `YYYY-MM-DD <type>[,type]: Türkçe özet.` Date prefix `2026-06-19`.
- Run `dotnet format` before every commit. Build: `dotnet build`. Test: `dotnet test`.

---

## File Structure

**Domain (`src/Oksis.Domain/Modules/Duties/`)** — existing: `Entities/DutyLocationTemplate.cs`, `Exceptions/DutyDomainException.cs`.
- Create `Enums/DutyLocationType.cs`, `Enums/DutyRosterStatus.cs`, `Enums/DutyExemptionType.cs`, `Enums/DutyWeeklyFrequency.cs`, `Enums/DutyDayPattern.cs`.
- Create `ValueObjects/DutyLocationId.cs`, `ValueObjects/DutyExemptionId.cs`, `ValueObjects/DutyRosterId.cs`, `ValueObjects/DutyAssignmentId.cs`.
- Create `Entities/DutyLocation.cs`, `Entities/DutyExemption.cs`, `Entities/DutyRoster.cs`, `Entities/DutyAssignment.cs`.
- Create `Events/DutyRosterPublishedEvent.cs`, `Events/DutyAssignmentChangedEvent.cs`, `Events/DutyExemptionChangedEvent.cs`.

**Domain (`src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs`)** — add 3 props + `UpdateDutiesConfiguration`.

**Persistence (`src/Oksis.Infrastructure/Persistence/`)**
- Create `Configurations/Duties/{DutyLocationConfiguration,DutyExemptionConfiguration,DutyRosterConfiguration}.cs`.
- Modify `OksisDbContext.cs` — add `DbSet`s; modify `SchoolSettingsConfiguration.cs` — 3 columns.
- Modify `Common/Abstractions/IApplicationDbContext.cs` — add `DbSet`s.
- Migration `20260619_add_duties_roster` (+ SchoolSettings columns).
- Seed: modify `Seed/MasterData/{MasterSeedIds,PermissionSeedData,RolePermissionSeedData}.cs`; migration `20260619_add_duties_permissions`.

**Application (`src/Oksis.Application/Modules/Duties/`)**
- `DTOs/`, `Mapping/DutiesMappingConfig.cs`.
- `Commands/` CreateDutyLocation, UpdateDutyLocation, DeleteDutyLocation, SetDutyExemption, RemoveDutyExemption, SaveDutyRosterDraft, AssignReliever, PublishDutyRoster, UpdateDutiesConfiguration.
- `Queries/` ListDutyLocations, ListDutyExemptions, GetDutyRosterForEdit, GetDutyRosterVersions, GetDutyHubSummary, GetAvailableRelievers, GetMyDuties.
- `Events/DutyRosterPublishedEventHandler.cs` (notification recipient resolution).

**API (`src/Oksis.Api/Controllers/V1/DutiesController.cs`)** — new thin controller, all endpoints.

---

## Task 1: Enums + strongly-typed IDs

**Files:**
- Create: `src/Oksis.Domain/Modules/Duties/Enums/DutyLocationType.cs`, `DutyRosterStatus.cs`, `DutyExemptionType.cs`, `DutyWeeklyFrequency.cs`, `DutyDayPattern.cs`
- Create: `src/Oksis.Domain/Modules/Duties/ValueObjects/DutyLocationId.cs`, `DutyExemptionId.cs`, `DutyRosterId.cs`, `DutyAssignmentId.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Duties/DutyEnumsTests.cs`

**Interfaces:**
- Produces: enums with stable int values; `readonly record struct DutyLocationId(Guid Value)` (+ `New()`/`From(Guid)`) and the three sibling IDs.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Duties.ValueObjects;

namespace Oksis.Domain.UnitTests.Modules.Duties;

public class DutyEnumsTests
{
    [Fact]
    public void Enums_HaveStableValues()
    {
        Assert.Equal(0, (int)DutyLocationType.Floor);
        Assert.Equal(3, (int)DutyLocationType.Gate);
        Assert.Equal(0, (int)DutyRosterStatus.Draft);
        Assert.Equal(1, (int)DutyRosterStatus.Published);
        Assert.Equal(2, (int)DutyRosterStatus.Superseded);
        Assert.Equal(0, (int)DutyExemptionType.Permanent);
        Assert.Equal(1, (int)DutyExemptionType.Temporary);
        Assert.Equal(0, (int)DutyWeeklyFrequency.TwicePerWeek);
        Assert.Equal(0, (int)DutyDayPattern.Spread);
    }

    [Fact]
    public void DutyRosterId_New_IsNonEmpty()
        => Assert.NotEqual(Guid.Empty, DutyRosterId.New().Value);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyEnumsTests"`
Expected: FAIL — types do not exist (compile error).

- [ ] **Step 3: Write the enums**

`Enums/DutyLocationType.cs`:
```csharp
namespace Oksis.Domain.Modules.Duties.Enums;

/// <summary>Nöbet bölgesi türü (handoff: building/utensils/sun/door-open...).</summary>
public enum DutyLocationType { Floor = 0, Canteen = 1, Garden = 2, Gate = 3, Hall = 4, Other = 5 }
```
`Enums/DutyRosterStatus.cs`:
```csharp
namespace Oksis.Domain.Modules.Duties.Enums;

/// <summary>Nöbet çizelgesi yaşam döngüsü. Yayın yeni canlı sürüm üretir; eski Superseded olur.</summary>
public enum DutyRosterStatus { Draft = 0, Published = 1, Superseded = 2 }
```
`Enums/DutyExemptionType.cs`:
```csharp
namespace Oksis.Domain.Modules.Duties.Enums;

public enum DutyExemptionType { Permanent = 0, Temporary = 1 }
```
`Enums/DutyWeeklyFrequency.cs`:
```csharp
namespace Oksis.Domain.Modules.Duties.Enums;

/// <summary>Okul-bazlı nöbet sıklığı politikası (2a'da inert; 2c solver girdisi).</summary>
public enum DutyWeeklyFrequency { TwicePerWeek = 0, OncePerWeek = 1, OnceEveryTwoWeeks = 2 }
```
`Enums/DutyDayPattern.cs`:
```csharp
namespace Oksis.Domain.Modules.Duties.Enums;

/// <summary>Nöbet günleri haftaya yayılı mı ardışık mı (2a'da inert; 2c girdisi).</summary>
public enum DutyDayPattern { Spread = 0, Consecutive = 1 }
```

- [ ] **Step 4: Write the IDs**

`ValueObjects/DutyLocationId.cs` (repeat the same shape for `DutyExemptionId`, `DutyRosterId`, `DutyAssignmentId`, changing the type name):
```csharp
namespace Oksis.Domain.Modules.Duties.ValueObjects;

public readonly record struct DutyLocationId(Guid Value)
{
    public static DutyLocationId New() => new(Guid.NewGuid());
    public static DutyLocationId From(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}
```
`ValueObjects/DutyExemptionId.cs`:
```csharp
namespace Oksis.Domain.Modules.Duties.ValueObjects;

public readonly record struct DutyExemptionId(Guid Value)
{
    public static DutyExemptionId New() => new(Guid.NewGuid());
    public static DutyExemptionId From(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}
```
`ValueObjects/DutyRosterId.cs`:
```csharp
namespace Oksis.Domain.Modules.Duties.ValueObjects;

public readonly record struct DutyRosterId(Guid Value)
{
    public static DutyRosterId New() => new(Guid.NewGuid());
    public static DutyRosterId From(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}
```
`ValueObjects/DutyAssignmentId.cs`:
```csharp
namespace Oksis.Domain.Modules.Duties.ValueObjects;

public readonly record struct DutyAssignmentId(Guid Value)
{
    public static DutyAssignmentId New() => new(Guid.NewGuid());
    public static DutyAssignmentId From(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyEnumsTests"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Domain/Modules/Duties/Enums/ src/Oksis.Domain/Modules/Duties/ValueObjects/ \
        tests/Oksis.Domain.UnitTests/Modules/Duties/DutyEnumsTests.cs
git commit -m "2026-06-19 feat: Nöbet modülü enum'ları ve strongly-typed kimlikleri eklendi."
```

---

## Task 2: DutyLocation aggregate

**Files:**
- Create: `src/Oksis.Domain/Modules/Duties/Entities/DutyLocation.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Duties/DutyLocationTests.cs`

**Interfaces:**
- Consumes: `DutyLocationType`, `TenantEntity`, `DutyDomainException`.
- Produces: `DutyLocation : TenantEntity` with factory `Create(Guid schoolId, string name, DutyLocationType type, string? icon, int capacity, Guid? templateId)`, `Update(string name, DutyLocationType type, string? icon, int capacity)`, `Activate()`/`Deactivate()`; props `Name`, `Type`, `Icon`, `Capacity`, `IsActive`, `TemplateId`.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Duties.Exceptions;

namespace Oksis.Domain.UnitTests.Modules.Duties;

public class DutyLocationTests
{
    [Fact]
    public void Create_SetsFields_DefaultsActive()
    {
        var loc = DutyLocation.Create(Guid.NewGuid(), "1. Kat Koridoru", DutyLocationType.Floor, "building", 1, null);
        Assert.Equal("1. Kat Koridoru", loc.Name);
        Assert.Equal(DutyLocationType.Floor, loc.Type);
        Assert.Equal(1, loc.Capacity);
        Assert.True(loc.IsActive);
    }

    [Fact]
    public void Create_BlankName_Throws()
        => Assert.Throws<DutyDomainException>(() =>
            DutyLocation.Create(Guid.NewGuid(), "  ", DutyLocationType.Floor, null, 1, null));

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    public void Create_CapacityOutOfRange_Throws(int cap)
        => Assert.Throws<DutyDomainException>(() =>
            DutyLocation.Create(Guid.NewGuid(), "Bahçe", DutyLocationType.Garden, null, cap, null));

    [Fact]
    public void Deactivate_SetsInactive()
    {
        var loc = DutyLocation.Create(Guid.NewGuid(), "Kantin", DutyLocationType.Canteen, null, 1, null);
        loc.Deactivate();
        Assert.False(loc.IsActive);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyLocationTests"`
Expected: FAIL — `DutyLocation` not defined.

- [ ] **Step 3: Write the aggregate**

`Entities/DutyLocation.cs`:
```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Duties.Exceptions;
using Oksis.Domain.Modules.Duties.ValueObjects;

namespace Oksis.Domain.Modules.Duties.Entities;

/// <summary>
/// Okula özel nöbet bölgesi (kat koridoru, kantin, bahçe, kapı...). <see cref="DutyLocationTemplate"/>
/// master listesinden klonlanabilir ya da serbest tanımlanır. Kapasite paralel nöbetçi sayısıdır (K-2a-3).
/// </summary>
public sealed class DutyLocation : TenantEntity
{
    private const int MaxCapacity = 4;

    public string Name { get; private set; } = string.Empty;
    public DutyLocationType Type { get; private set; }
    public string? Icon { get; private set; }
    public int Capacity { get; private set; }
    public bool IsActive { get; private set; }
    public Guid? TemplateId { get; private set; }

    private DutyLocation() { } // EF Core

    public static DutyLocation Create(Guid schoolId, string name, DutyLocationType type, string? icon, int capacity, Guid? templateId)
    {
        Validate(name, capacity);
        return new DutyLocation
        {
            Id = DutyLocationId.New().Value,
            SchoolId = schoolId,
            Name = name.Trim(),
            Type = type,
            Icon = icon?.Trim(),
            Capacity = capacity,
            IsActive = true,
            TemplateId = templateId,
        };
    }

    public void Update(string name, DutyLocationType type, string? icon, int capacity)
    {
        Validate(name, capacity);
        Name = name.Trim();
        Type = type;
        Icon = icon?.Trim();
        Capacity = capacity;
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;

    private static void Validate(string name, int capacity)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DutyDomainException("duties.errors.location-name-required", "Nöbet bölgesi adı zorunludur.");
        if (capacity is < 1 or > MaxCapacity)
            throw new DutyDomainException("duties.errors.location-capacity-range", "Kapasite 1 ile 4 arasında olmalıdır.");
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyLocationTests"`
Expected: PASS (5 cases).

- [ ] **Step 5: Commit**

```bash
dotnet format
git add src/Oksis.Domain/Modules/Duties/Entities/DutyLocation.cs \
        tests/Oksis.Domain.UnitTests/Modules/Duties/DutyLocationTests.cs
git commit -m "2026-06-19 feat: DutyLocation aggregate (kapasite-farkındalıklı nöbet bölgesi) eklendi."
```

---

## Task 3: DutyExemption aggregate

**Files:**
- Create: `src/Oksis.Domain/Modules/Duties/Entities/DutyExemption.cs`
- Create: `src/Oksis.Domain/Modules/Duties/Events/DutyExemptionChangedEvent.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Duties/DutyExemptionTests.cs`

**Interfaces:**
- Produces: `DutyExemption : TenantEntity` with `Create(Guid schoolId, Guid teacherId, DutyExemptionType type, DateOnly? from, DateOnly? to, string reason)`; props `TeacherId`, `Type`, `From`, `To`, `Reason`; method `bool CoversDay(DateOnly date)`.
- `record DutyExemptionChangedEvent(Guid SchoolId, Guid ExemptionId, Guid TeacherId)`.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Duties.Exceptions;

namespace Oksis.Domain.UnitTests.Modules.Duties;

public class DutyExemptionTests
{
    [Fact]
    public void Permanent_CoversAnyDay()
    {
        var ex = DutyExemption.Create(Guid.NewGuid(), Guid.NewGuid(), DutyExemptionType.Permanent, null, null, "İdari görev");
        Assert.True(ex.CoversDay(new DateOnly(2026, 3, 2)));
    }

    [Fact]
    public void Temporary_CoversOnlyInRange()
    {
        var ex = DutyExemption.Create(Guid.NewGuid(), Guid.NewGuid(), DutyExemptionType.Temporary,
            new DateOnly(2026, 3, 1), new DateOnly(2026, 3, 10), "Sağlık raporu");
        Assert.True(ex.CoversDay(new DateOnly(2026, 3, 5)));
        Assert.False(ex.CoversDay(new DateOnly(2026, 3, 20)));
    }

    [Fact]
    public void Temporary_WithoutRange_Throws()
        => Assert.Throws<DutyDomainException>(() =>
            DutyExemption.Create(Guid.NewGuid(), Guid.NewGuid(), DutyExemptionType.Temporary, null, null, "x"));

    [Fact]
    public void BlankReason_Throws()
        => Assert.Throws<DutyDomainException>(() =>
            DutyExemption.Create(Guid.NewGuid(), Guid.NewGuid(), DutyExemptionType.Permanent, null, null, " "));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyExemptionTests"`
Expected: FAIL — `DutyExemption` not defined.

- [ ] **Step 3: Write the event + aggregate**

`Events/DutyExemptionChangedEvent.cs`:
```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Duties.Events;

public sealed record DutyExemptionChangedEvent(Guid SchoolId, Guid ExemptionId, Guid TeacherId) : IDomainEvent;
```
> Verify `IDomainEvent` is the marker used by `ScheduleExceptionCreatedEvent` (check `Oksis.Domain/Modules/Timetable/Events/`); use the same marker interface/base.

`Entities/DutyExemption.cs`:
```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Duties.Events;
using Oksis.Domain.Modules.Duties.Exceptions;
using Oksis.Domain.Modules.Duties.ValueObjects;

namespace Oksis.Domain.Modules.Duties.Entities;

/// <summary>Öğretmenin nöbetten muafiyeti (sürekli/geçici). Dağıtım bu öğretmeni dışlar.</summary>
public sealed class DutyExemption : TenantEntity
{
    public Guid TeacherId { get; private set; }
    public DutyExemptionType Type { get; private set; }
    public DateOnly? From { get; private set; }
    public DateOnly? To { get; private set; }
    public string Reason { get; private set; } = string.Empty;

    private DutyExemption() { } // EF Core

    public static DutyExemption Create(Guid schoolId, Guid teacherId, DutyExemptionType type, DateOnly? from, DateOnly? to, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new DutyDomainException("duties.errors.exemption-reason-required", "Muafiyet sebebi zorunludur.");
        if (type == DutyExemptionType.Temporary && (from is null || to is null))
            throw new DutyDomainException("duties.errors.exemption-range-required", "Geçici muafiyet için tarih aralığı zorunludur.");
        if (type == DutyExemptionType.Temporary && from > to)
            throw new DutyDomainException("duties.errors.exemption-range-invalid", "Başlangıç tarihi bitişten sonra olamaz.");

        var ex = new DutyExemption
        {
            Id = DutyExemptionId.New().Value,
            SchoolId = schoolId,
            TeacherId = teacherId,
            Type = type,
            From = type == DutyExemptionType.Permanent ? null : from,
            To = type == DutyExemptionType.Permanent ? null : to,
            Reason = reason.Trim(),
        };
        ex.Raise(new DutyExemptionChangedEvent(schoolId, ex.Id, teacherId));
        return ex;
    }

    /// <summary>Verilen gün bu muafiyet kapsamında mı (sürekli = her zaman; geçici = aralıkta).</summary>
    public bool CoversDay(DateOnly date)
        => Type == DutyExemptionType.Permanent || (From <= date && date <= To);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyExemptionTests"`
Expected: PASS (4 cases).

- [ ] **Step 5: Commit**

```bash
dotnet format
git add src/Oksis.Domain/Modules/Duties/Entities/DutyExemption.cs \
        src/Oksis.Domain/Modules/Duties/Events/DutyExemptionChangedEvent.cs \
        tests/Oksis.Domain.UnitTests/Modules/Duties/DutyExemptionTests.cs
git commit -m "2026-06-19 feat: DutyExemption aggregate (sürekli/geçici muafiyet) eklendi."
```

---

## Task 4: DutyRoster aggregate + DutyAssignment + invariants + temporal versioning

**Files:**
- Create: `src/Oksis.Domain/Modules/Duties/Entities/DutyAssignment.cs`
- Create: `src/Oksis.Domain/Modules/Duties/Entities/DutyRoster.cs`
- Create: `src/Oksis.Domain/Modules/Duties/Events/DutyRosterPublishedEvent.cs`, `DutyAssignmentChangedEvent.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Duties/DutyRosterTests.cs`

**Interfaces:**
- Consumes: `DutyRosterStatus`, `DutyLocationId`, `DutyAssignmentId`, `TenantEntity`, `DutyDomainException`.
- Produces:
  - `DutyAssignment` (entity): `TeacherId`, `Day` (DayOfWeek), `LocationId` (Guid), `RelieverId` (Guid?). Internal mutators `SetReliever(Guid?)`.
  - `DutyRoster : TenantEntity`: `AcademicYearId`, `AcademicTermId`, `Status`, `Version`, `EffectiveFrom`/`EffectiveTo` (DateOnly?), `PreviousVersionId` (Guid?), `IReadOnlyList<DutyAssignment> Assignments`.
  - factory `CreateDraft(Guid schoolId, Guid academicYearId, Guid academicTermId)`.
  - `Assign(Guid teacherId, DayOfWeek day, Guid locationId, int locationCapacity, IReadOnlySet<Guid> exemptTeacherIdsForWeek)`.
  - `RemoveAssignment(Guid assignmentId)`.
  - `AssignReliever(Guid assignmentId, Guid relieverId)`, `ClearReliever(Guid assignmentId)`.
  - `Publish(DateOnly effectiveFrom)` (raises `DutyRosterPublishedEvent`).
  - `DutyRoster Supersede(DateOnly asOf)` → returns the new draft clone, sets self `Superseded`+`EffectiveTo`.
- Events: `DutyRosterPublishedEvent(Guid SchoolId, Guid RosterId, Guid AcademicTermId, int Version, DateOnly EffectiveFrom, IReadOnlyCollection<Guid> AffectedTeacherIds)`; `DutyAssignmentChangedEvent(Guid SchoolId, Guid RosterId, Guid TeacherId)`.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Duties.Events;
using Oksis.Domain.Modules.Duties.Exceptions;

namespace Oksis.Domain.UnitTests.Modules.Duties;

public class DutyRosterTests
{
    private static readonly Guid Loc1 = Guid.NewGuid();
    private static readonly Guid Loc2 = Guid.NewGuid();
    private static readonly IReadOnlySet<Guid> NoExempt = new HashSet<Guid>();

    private static DutyRoster Draft() =>
        DutyRoster.CreateDraft(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void Assign_AddsAssignment()
    {
        var r = Draft();
        var t = Guid.NewGuid();
        r.Assign(t, DayOfWeek.Monday, Loc1, locationCapacity: 1, NoExempt);
        Assert.Single(r.Assignments);
    }

    [Fact] // INV-D1
    public void Assign_ExemptTeacher_Throws()
    {
        var r = Draft();
        var t = Guid.NewGuid();
        Assert.Throws<DutyDomainException>(() =>
            r.Assign(t, DayOfWeek.Monday, Loc1, 1, new HashSet<Guid> { t }));
    }

    [Fact] // INV-D2: aynı öğretmen aynı güne ikinci nöbet
    public void Assign_SameTeacherSameDay_Throws()
    {
        var r = Draft();
        var t = Guid.NewGuid();
        r.Assign(t, DayOfWeek.Monday, Loc1, 1, NoExempt);
        Assert.Throws<DutyDomainException>(() =>
            r.Assign(t, DayOfWeek.Monday, Loc2, 1, NoExempt));
    }

    [Fact] // INV-D3: kapasite
    public void Assign_OverCapacity_Throws()
    {
        var r = Draft();
        r.Assign(Guid.NewGuid(), DayOfWeek.Monday, Loc1, locationCapacity: 1, NoExempt);
        Assert.Throws<DutyDomainException>(() =>
            r.Assign(Guid.NewGuid(), DayOfWeek.Monday, Loc1, locationCapacity: 1, NoExempt));
    }

    [Fact] // capacity 2 allows two distinct teachers
    public void Assign_WithinCapacity2_Succeeds()
    {
        var r = Draft();
        r.Assign(Guid.NewGuid(), DayOfWeek.Monday, Loc1, locationCapacity: 2, NoExempt);
        r.Assign(Guid.NewGuid(), DayOfWeek.Monday, Loc1, locationCapacity: 2, NoExempt);
        Assert.Equal(2, r.Assignments.Count);
    }

    [Fact] // INV-D4: yancı ≠ nöbetçi
    public void AssignReliever_SameAsTeacher_Throws()
    {
        var r = Draft();
        var t = Guid.NewGuid();
        r.Assign(t, DayOfWeek.Monday, Loc1, 1, NoExempt);
        var a = r.Assignments[0];
        Assert.Throws<DutyDomainException>(() => r.AssignReliever(a.Id, t));
    }

    [Fact]
    public void Publish_SetsStatusAndEffectiveFrom_RaisesEvent()
    {
        var r = Draft();
        var t = Guid.NewGuid();
        r.Assign(t, DayOfWeek.Monday, Loc1, 1, NoExempt);
        r.Publish(new DateOnly(2026, 9, 15), null);
        Assert.Equal(DutyRosterStatus.Published, r.Status);
        Assert.Equal(new DateOnly(2026, 9, 15), r.EffectiveFrom);
        Assert.Contains(r.DomainEvents, e => e is DutyRosterPublishedEvent);
    }

    [Fact]
    public void Supersede_ClosesOldAndClonesAssignmentsToNewDraft()
    {
        var r = Draft();
        var t = Guid.NewGuid();
        r.Assign(t, DayOfWeek.Monday, Loc1, 1, NoExempt);
        r.Publish(new DateOnly(2026, 9, 15), null);

        var next = r.Supersede(new DateOnly(2026, 11, 17));

        Assert.Equal(DutyRosterStatus.Superseded, r.Status);
        Assert.Equal(new DateOnly(2026, 11, 17), r.EffectiveTo);
        Assert.Equal(DutyRosterStatus.Draft, next.Status);
        Assert.Equal(r.Version + 1, next.Version);
        Assert.Equal(r.Id, next.PreviousVersionId);
        Assert.Single(next.Assignments); // assignments cloned
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyRosterTests"`
Expected: FAIL — types not defined.

- [ ] **Step 3: Write the events**

`Events/DutyRosterPublishedEvent.cs`:
```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Duties.Events;

public sealed record DutyRosterPublishedEvent(
    Guid SchoolId,
    Guid RosterId,
    Guid AcademicTermId,
    int Version,
    DateOnly EffectiveFrom,
    IReadOnlyCollection<Guid> AffectedTeacherIds) : IDomainEvent;
```
`Events/DutyAssignmentChangedEvent.cs`:
```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Duties.Events;

public sealed record DutyAssignmentChangedEvent(Guid SchoolId, Guid RosterId, Guid TeacherId) : IDomainEvent;
```

- [ ] **Step 4: Write DutyAssignment**

`Entities/DutyAssignment.cs`:
```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Duties.ValueObjects;

namespace Oksis.Domain.Modules.Duties.Entities;

/// <summary>Bir nöbet ataması: (öğretmen × gün × bölge), opsiyonel yancı (parametre açıksa).</summary>
public sealed class DutyAssignment : Entity
{
    public Guid TeacherId { get; private set; }
    public DayOfWeek Day { get; private set; }
    public Guid LocationId { get; private set; }
    public Guid? RelieverId { get; private set; }

    private DutyAssignment() { } // EF Core

    internal DutyAssignment(Guid teacherId, DayOfWeek day, Guid locationId)
    {
        Id = DutyAssignmentId.New().Value;
        TeacherId = teacherId;
        Day = day;
        LocationId = locationId;
    }

    internal void SetReliever(Guid? relieverId) => RelieverId = relieverId;
}
```
> Verify `Entity` base exposes a settable `Id` (mirror how `LessonPlacement` sets `Id` inside `ScheduleProgram`). If placements use a different base/id pattern, match it exactly.

- [ ] **Step 5: Write DutyRoster**

`Entities/DutyRoster.cs`:
```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Duties.Events;
using Oksis.Domain.Modules.Duties.Exceptions;
using Oksis.Domain.Modules.Duties.ValueObjects;

namespace Oksis.Domain.Modules.Duties.Entities;

/// <summary>
/// Bir dönemin nöbet çizelgesi (gün × bölge atamaları). Temporal: Publish yeni canlı sürüm üretir,
/// önceki canlı sürüm Supersede ile kapanır (silme yok, K-2a-4). Kapasite & gün-tekilliği & muafiyet
/// invariant'ları aggregate içinde (INV-D1..D4).
/// </summary>
public sealed class DutyRoster : TenantEntity
{
    private readonly List<DutyAssignment> _assignments = [];

    public Guid AcademicYearId { get; private set; }
    public Guid AcademicTermId { get; private set; }
    public DutyRosterStatus Status { get; private set; }
    public int Version { get; private set; }
    public DateOnly? EffectiveFrom { get; private set; }
    public DateOnly? EffectiveTo { get; private set; }
    public Guid? PreviousVersionId { get; private set; }
    public IReadOnlyList<DutyAssignment> Assignments => _assignments.AsReadOnly();

    private DutyRoster() { } // EF Core

    public static DutyRoster CreateDraft(Guid schoolId, Guid academicYearId, Guid academicTermId)
        => new()
        {
            Id = DutyRosterId.New().Value,
            SchoolId = schoolId,
            AcademicYearId = academicYearId,
            AcademicTermId = academicTermId,
            Status = DutyRosterStatus.Draft,
            Version = 1,
        };

    /// <summary>Nöbetçi atar. INV-D1 (muaf), INV-D2 (gün-tekilliği), INV-D3 (kapasite).</summary>
    public void Assign(Guid teacherId, DayOfWeek day, Guid locationId, int locationCapacity, IReadOnlySet<Guid> exemptTeacherIdsForWeek)
    {
        EnsureDraft();

        if (exemptTeacherIdsForWeek.Contains(teacherId))
            throw new DutyDomainException("duties.errors.teacher-exempt", "Muaf öğretmene nöbet atanamaz.");

        // INV-D2: aynı öğretmen aynı güne ikinci nöbet alamaz
        if (_assignments.Any(a => a.TeacherId == teacherId && a.Day == day))
            throw new DutyDomainException("duties.errors.teacher-day-duplicate", "Öğretmen o gün zaten nöbetçi.");

        // INV-D3: kapasite
        var cellCount = _assignments.Count(a => a.Day == day && a.LocationId == locationId);
        if (cellCount >= locationCapacity)
            throw new DutyDomainException("duties.errors.location-capacity-full", "Bu bölgenin o günkü kapasitesi dolu.");

        _assignments.Add(new DutyAssignment(teacherId, day, locationId));
        Raise(new DutyAssignmentChangedEvent(SchoolId, Id, teacherId));
    }

    public void RemoveAssignment(Guid assignmentId)
    {
        EnsureDraft();
        var a = _assignments.FirstOrDefault(x => x.Id == assignmentId)
            ?? throw new DutyDomainException("duties.errors.assignment-not-found", "Atama bulunamadı.");
        _assignments.Remove(a);
    }

    /// <summary>Yancı atar. INV-D4 (yancı ≠ nöbetçi). Aday uygunluğu (ders/gün-tekilliği) application'da (K-2a-8).</summary>
    public void AssignReliever(Guid assignmentId, Guid relieverId)
    {
        EnsureDraft();
        var a = _assignments.FirstOrDefault(x => x.Id == assignmentId)
            ?? throw new DutyDomainException("duties.errors.assignment-not-found", "Atama bulunamadı.");
        if (a.TeacherId == relieverId)
            throw new DutyDomainException("duties.errors.reliever-same-as-teacher", "Yancı, nöbetçinin kendisi olamaz.");
        a.SetReliever(relieverId);
    }

    public void ClearReliever(Guid assignmentId)
    {
        EnsureDraft();
        var a = _assignments.FirstOrDefault(x => x.Id == assignmentId)
            ?? throw new DutyDomainException("duties.errors.assignment-not-found", "Atama bulunamadı.");
        a.SetReliever(null);
    }

    /// <summary>Taslağı yürürlüğe alır. Çağıran, varsa önceki canlı sürümü ayrıca Supersede etmelidir.</summary>
    public void Publish(DateOnly effectiveFrom)
    {
        EnsureDraft();
        if (_assignments.Count == 0)
            throw new DutyDomainException("duties.errors.roster-empty", "Boş çizelge yayınlanamaz.");

        Status = DutyRosterStatus.Published;
        EffectiveFrom = effectiveFrom;
        Raise(new DutyRosterPublishedEvent(
            SchoolId, Id, AcademicTermId, Version, effectiveFrom,
            _assignments.Select(a => a.TeacherId).Distinct().ToList()));
    }

    /// <summary>Bu canlı sürümü kapatır ve atamaları kopyalanmış yeni bir Taslak sürüm döndürür (K-2a-4).</summary>
    public DutyRoster Supersede(DateOnly asOf)
    {
        if (Status != DutyRosterStatus.Published)
            throw new DutyDomainException("duties.errors.roster-not-live", "Yalnız yürürlükteki sürüm supersede edilebilir.");

        Status = DutyRosterStatus.Superseded;
        EffectiveTo = asOf;

        var next = new DutyRoster
        {
            Id = DutyRosterId.New().Value,
            SchoolId = SchoolId,
            AcademicYearId = AcademicYearId,
            AcademicTermId = AcademicTermId,
            Status = DutyRosterStatus.Draft,
            Version = Version + 1,
            PreviousVersionId = Id,
        };
        foreach (var a in _assignments)
        {
            var clone = new DutyAssignment(a.TeacherId, a.Day, a.LocationId);
            clone.SetReliever(a.RelieverId);
            next._assignments.Add(clone);
        }
        return next;
    }

    private void EnsureDraft()
    {
        if (Status != DutyRosterStatus.Draft)
            throw new DutyDomainException("duties.errors.roster-not-draft", "Yalnız taslak çizelge düzenlenebilir.");
    }
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyRosterTests"`
Expected: PASS (8 tests).

- [ ] **Step 7: Commit**

```bash
dotnet format
git add src/Oksis.Domain/Modules/Duties/Entities/DutyRoster.cs \
        src/Oksis.Domain/Modules/Duties/Entities/DutyAssignment.cs \
        src/Oksis.Domain/Modules/Duties/Events/DutyRosterPublishedEvent.cs \
        src/Oksis.Domain/Modules/Duties/Events/DutyAssignmentChangedEvent.cs \
        tests/Oksis.Domain.UnitTests/Modules/Duties/DutyRosterTests.cs
git commit -m "2026-06-19 feat: DutyRoster aggregate (atama + kapasite/gün-tekilliği invariant + temporal supersede) eklendi."
```

---

## Task 5: SchoolSettings duty configuration

**Files:**
- Modify: `src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Schools/SchoolSettingsDutyConfigTests.cs`

**Interfaces:**
- Consumes: `DutyWeeklyFrequency`, `DutyDayPattern` (from `Oksis.Domain.Modules.Duties.Enums`).
- Produces: props `bool DutiesRelieverEnabled`, `DutyWeeklyFrequency DutyWeeklyFrequency`, `DutyDayPattern DutyDayPattern`; method `UpdateDutiesConfiguration(bool relieverEnabled, DutyWeeklyFrequency weeklyFrequency, DutyDayPattern dayPattern)`.

- [ ] **Step 1: Write the failing test**

```csharp
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Schools.Entities;

namespace Oksis.Domain.UnitTests.Modules.Schools;

public class SchoolSettingsDutyConfigTests
{
    [Fact]
    public void UpdateDutiesConfiguration_SetsValues()
    {
        var s = SchoolSettings.CreateDefault(Guid.NewGuid()); // verify the real factory name (see file)
        s.UpdateDutiesConfiguration(true, DutyWeeklyFrequency.TwicePerWeek, DutyDayPattern.Consecutive);

        Assert.True(s.DutiesRelieverEnabled);
        Assert.Equal(DutyWeeklyFrequency.TwicePerWeek, s.DutyWeeklyFrequency);
        Assert.Equal(DutyDayPattern.Consecutive, s.DutyDayPattern);
    }

    [Fact]
    public void Defaults_RelieverDisabled()
    {
        var s = SchoolSettings.CreateDefault(Guid.NewGuid());
        Assert.False(s.DutiesRelieverEnabled);
    }
}
```
> Replace `SchoolSettings.CreateDefault(...)` with the real factory used elsewhere (the file has a `Create`/default factory near line 100-120 — read it). The defaults are set there; add the three new defaults to that factory body.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SchoolSettingsDutyConfigTests"`
Expected: FAIL — members not defined.

- [ ] **Step 3: Add props + method + defaults**

In `SchoolSettings.cs`, add near the other academic props:
```csharp
public bool DutiesRelieverEnabled { get; private set; }
public DutyWeeklyFrequency DutyWeeklyFrequency { get; private set; }
public DutyDayPattern DutyDayPattern { get; private set; }
```
Add `using Oksis.Domain.Modules.Duties.Enums;` at the top. In the default factory body (where `RequireApprovalForClassRoomCreation = false` is set, ~line 115), add:
```csharp
DutiesRelieverEnabled = false,
DutyWeeklyFrequency = DutyWeeklyFrequency.OncePerWeek,
DutyDayPattern = DutyDayPattern.Spread,
```
Add the method (mirror `UpdateAcademicSessionParameters` shape, raising the existing event):
```csharp
/// <summary>Nöbet politikası: yancılık + haftalık sıklık + gün düzeni (K-2a-5).</summary>
public void UpdateDutiesConfiguration(bool relieverEnabled, DutyWeeklyFrequency weeklyFrequency, DutyDayPattern dayPattern)
{
    DutiesRelieverEnabled = relieverEnabled;
    DutyWeeklyFrequency = weeklyFrequency;
    DutyDayPattern = dayPattern;
    Raise(new SchoolSettingsUpdatedEvent(SchoolId, nameof(UpdateDutiesConfiguration)));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SchoolSettingsDutyConfigTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
dotnet format
git add src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs \
        tests/Oksis.Domain.UnitTests/Modules/Schools/SchoolSettingsDutyConfigTests.cs
git commit -m "2026-06-19 feat: SchoolSettings'e nöbet politikası (yancılık/sıklık/gün düzeni) eklendi."
```

---

## Task 6: EF configurations + DbSets + migration

**Files:**
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Duties/DutyLocationConfiguration.cs`, `DutyExemptionConfiguration.cs`, `DutyRosterConfiguration.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Schools/SchoolSettingsConfiguration.cs` (3 columns; verify path/name)
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (DbSets)
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` (DbSets)
- Migration: `20260619_add_duties_roster`

**Interfaces:**
- Produces: `DbSet<DutyLocation> DutyLocations`, `DbSet<DutyExemption> DutyExemptions`, `DbSet<DutyRoster> DutyRosters` on both `OksisDbContext` and `IApplicationDbContext`; tables `[academic].duty_locations`, `duty_exemptions`, `duty_rosters`, `duty_assignments` (owned) with the indexes from design §3.3.

- [ ] **Step 1: Add DbSets to IApplicationDbContext + OksisDbContext**

In `IApplicationDbContext.cs`, near the existing duties line (`DbSet<DutyLocationTemplate> DutyLocationTemplates`):
```csharp
DbSet<DutyLocation> DutyLocations { get; }
DbSet<DutyExemption> DutyExemptions { get; }
DbSet<DutyRoster> DutyRosters { get; }
```
In `OksisDbContext.cs`, add the matching expression-bodied sets:
```csharp
DbSet<DutyLocation> DutyLocations => Set<DutyLocation>();
DbSet<DutyExemption> DutyExemptions => Set<DutyExemption>();
DbSet<DutyRoster> DutyRosters => Set<DutyRoster>();
```
Add `using Oksis.Domain.Modules.Duties.Entities;` where needed.

- [ ] **Step 2: Write DutyLocationConfiguration**

`Configurations/Duties/DutyLocationConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Duties.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Duties;

public sealed class DutyLocationConfiguration : IEntityTypeConfiguration<DutyLocation>
{
    public void Configure(EntityTypeBuilder<DutyLocation> builder)
    {
        builder.ToAcademicTable("duty_locations");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.Name).IsRequired().HasMaxLength(120);
        builder.Property(x => x.Type).IsRequired().HasConversion<int>();
        builder.Property(x => x.Icon).HasMaxLength(40);
        builder.Property(x => x.Capacity).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.TemplateId);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        builder.HasIndex(x => new { x.SchoolId, x.IsActive })
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ix_duty_locations_school_active");
    }
}
```

- [ ] **Step 3: Write DutyExemptionConfiguration**

`Configurations/Duties/DutyExemptionConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Duties.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Duties;

public sealed class DutyExemptionConfiguration : IEntityTypeConfiguration<DutyExemption>
{
    public void Configure(EntityTypeBuilder<DutyExemption> builder)
    {
        builder.ToAcademicTable("duty_exemptions");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.TeacherId).IsRequired();
        builder.Property(x => x.Type).IsRequired().HasConversion<int>();
        builder.Property(x => x.From);
        builder.Property(x => x.To);
        builder.Property(x => x.Reason).IsRequired().HasMaxLength(200);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        builder.HasIndex(x => new { x.SchoolId, x.TeacherId })
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ix_duty_exemptions_school_teacher");
    }
}
```

- [ ] **Step 4: Write DutyRosterConfiguration (with owned assignments + filtered unique indexes)**

`Configurations/Duties/DutyRosterConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Duties.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Duties;

public sealed class DutyRosterConfiguration : IEntityTypeConfiguration<DutyRoster>
{
    public void Configure(EntityTypeBuilder<DutyRoster> builder)
    {
        builder.ToAcademicTable("duty_rosters");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AcademicYearId).IsRequired();
        builder.Property(x => x.AcademicTermId).IsRequired();
        builder.Property(x => x.Status).IsRequired().HasConversion<int>();
        builder.Property(x => x.Version).IsRequired();
        builder.Property(x => x.EffectiveFrom);
        builder.Property(x => x.EffectiveTo);
        builder.Property(x => x.PreviousVersionId);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        // K-2a-4: aynı dönemde tek canlı (Published & EffectiveTo == null) roster.
        builder.HasIndex(x => new { x.SchoolId, x.AcademicTermId })
            .IsUnique()
            .HasFilter("status = 1 AND effective_to IS NULL AND is_deleted = 0")
            .HasDatabaseName("ux_duty_roster_live");

        builder.HasIndex(x => new { x.SchoolId, x.AcademicTermId, x.Status })
            .HasDatabaseName("ix_duty_rosters_term_status");

        // Owned: atamalar
        builder.OwnsMany<DutyAssignment>("_assignments", a =>
        {
            a.ToAcademicTable("duty_assignments");
            a.WithOwner().HasForeignKey("duty_roster_id");
            a.HasKey(x => x.Id);

            a.Property(x => x.TeacherId).HasColumnName("teacher_id").IsRequired();
            a.Property(x => x.Day).HasColumnName("day_of_week").HasConversion<int>().IsRequired();
            a.Property(x => x.LocationId).HasColumnName("location_id").IsRequired();
            a.Property(x => x.RelieverId).HasColumnName("reliever_id");

            // index/tenant için denormalize gölge kolonlar
            a.Property<Guid>("school_id");
            a.Property<Guid>("academic_term_id");
            a.Property<bool>("is_active").HasDefaultValue(true);
            a.Property<bool>("is_deleted").HasDefaultValue(false);

            // K-2a-3: aynı öğretmen aynı hücrede (roster,gün,bölge) iki kez yazılamaz (kapasite domain'de)
            a.HasIndex("school_id", "academic_term_id", "duty_roster_id", "day_of_week", "location_id", "teacher_id")
                .IsUnique()
                .HasFilter("is_active = 1 AND is_deleted = 0")
                .HasDatabaseName("ux_duty_assignment_teacher_cell");

            a.HasIndex("school_id", "academic_term_id", "teacher_id")
                .HasDatabaseName("ix_duty_assignments_teacher");
        });

        builder.Metadata.FindNavigation("_assignments")!.SetPropertyAccessMode(PropertyAccessMode.Field);
    }
}
```
> The `school_id`/`academic_term_id` shadow props on assignments must be filled from the parent at save time. Mirror how `LessonPlacement` denormalizes `academic_term_id`/`branch_id` from its program (read `LessonPlacementConfiguration.cs` + its save path). If that uses an interceptor or explicit set in the aggregate, follow the same approach; otherwise set them in the `SaveDutyRosterDraft` handler via the change tracker before `SaveChangesAsync`.

- [ ] **Step 5: Map SchoolSettings columns**

In `SchoolSettingsConfiguration.cs` (verify exact path under `Configurations/Schools/`), add:
```csharp
builder.Property(x => x.DutiesRelieverEnabled).IsRequired().HasDefaultValue(false);
builder.Property(x => x.DutyWeeklyFrequency).IsRequired().HasConversion<int>().HasDefaultValue(Oksis.Domain.Modules.Duties.Enums.DutyWeeklyFrequency.OncePerWeek);
builder.Property(x => x.DutyDayPattern).IsRequired().HasConversion<int>().HasDefaultValue(Oksis.Domain.Modules.Duties.Enums.DutyDayPattern.Spread);
```

- [ ] **Step 6: Build, then generate migration**

Run: `dotnet build` → Expected: success (configs auto-discovered via `ApplyConfigurationsFromAssembly`).
Run:
```bash
dotnet ef migrations add 20260619_add_duties_roster \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Expected: migration creates `duty_locations`, `duty_exemptions`, `duty_rosters`, `duty_assignments` (in `[academic]`), the filtered unique indexes, and the 3 new `school_settings` columns. Inspect the generated file to confirm `ux_duty_roster_live` and `ux_duty_assignment_teacher_cell` filters.

- [ ] **Step 7: Commit**

```bash
dotnet format
git add src/Oksis.Infrastructure/Persistence/Configurations/Duties/ \
        src/Oksis.Infrastructure/Persistence/Configurations/Schools/SchoolSettingsConfiguration.cs \
        src/Oksis.Infrastructure/Persistence/OksisDbContext.cs \
        src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs \
        src/Oksis.Infrastructure/Persistence/Migrations/*add_duties_roster*
git commit -m "2026-06-19 feat: Nöbet tabloları (location/exemption/roster/assignment) + filtreli index'ler + migration eklendi."
```

---

## Task 7: Filtered unique index integration test

**Files:**
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Duties/DutyRosterIndexTests.cs`

**Interfaces:**
- Consumes: `DutyRoster`, `DbSet<DutyRoster>`, the integration test base (mirror a sibling under `tests/Oksis.Infrastructure.IntegrationTests/Timetable/` for `Db`/`SchoolId`).

- [ ] **Step 1: Write the failing/contract test**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Duties.Entities;

namespace Oksis.Infrastructure.IntegrationTests.Duties;

public class DutyRosterIndexTests : IntegrationTestBase
{
    [Fact]
    public async Task TwoLiveRostersSameTerm_SecondRejectedByDb()
    {
        var termId = Guid.NewGuid();
        var yearId = Guid.NewGuid();

        var r1 = DutyRoster.CreateDraft(SchoolId, yearId, termId);
        r1.Assign(Guid.NewGuid(), DayOfWeek.Monday, Guid.NewGuid(), 1, new HashSet<Guid>());
        r1.Publish(new DateOnly(2026, 9, 15), null);
        Db.DutyRosters.Add(r1);
        await Db.SaveChangesAsync(default);

        var r2 = DutyRoster.CreateDraft(SchoolId, yearId, termId);
        r2.Assign(Guid.NewGuid(), DayOfWeek.Tuesday, Guid.NewGuid(), 1, new HashSet<Guid>());
        r2.Publish(new DateOnly(2026, 9, 16), null);
        Db.DutyRosters.Add(r2);

        await Assert.ThrowsAsync<DbUpdateException>(() => Db.SaveChangesAsync(default));
    }
}
```
> Match the base class name, `Db`, `SchoolId` to the project convention (read one sibling integration test first). If the shadow `school_id`/`academic_term_id` on assignments aren't auto-filled, this test will surface it — fix the fill path (Task 6 Step 4 note) before moving on.

- [ ] **Step 2: Run test to verify behavior**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~DutyRosterIndexTests"`
Expected: PASS (DB rejects 2nd live roster).

- [ ] **Step 3: Commit**

```bash
dotnet format
git add tests/Oksis.Infrastructure.IntegrationTests/Duties/DutyRosterIndexTests.cs
git commit -m "2026-06-19 test: Tek-canlı-roster filtreli unique index entegrasyon testi eklendi."
```

---

## Task 8: Permissions — duties.* family + role mappings + migration

**Files:**
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/MasterSeedIds.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/PermissionSeedData.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/RolePermissionSeedData.cs`
- Migration: `20260619_add_duties_permissions`

**Interfaces:**
- Produces seeded permissions `duties.view`, `duties.manage`, `duties.substitute`, `duties.view-load`; SchoolAdmin → view+manage+substitute+view-load; Teacher → view; SuperAdmin/Secretary → view.

- [ ] **Step 1: Add seed IDs**

In `MasterSeedIds.cs` (Permissions class, near `TimetableManage`):
```csharp
public static Guid DutiesView { get; } = SeedGuid.From("perm:duties.view");
public static Guid DutiesManage { get; } = SeedGuid.From("perm:duties.manage");
public static Guid DutiesSubstitute { get; } = SeedGuid.From("perm:duties.substitute");
public static Guid DutiesViewLoad { get; } = SeedGuid.From("perm:duties.view-load");
```

- [ ] **Step 2: Add permission rows**

In `PermissionSeedData.cs`, after the timetable rows (~line 52):
```csharp
Row(MasterSeedIds.Permissions.DutiesView,       "DUTIES", "VIEW",       "duties.view",       "Nöbet çizelgesi / özet görüntüleme"),
Row(MasterSeedIds.Permissions.DutiesManage,     "DUTIES", "MANAGE",     "duties.manage",     "Bölge/çizelge/yayın/muafiyet/yancı yönetimi"),
Row(MasterSeedIds.Permissions.DutiesSubstitute, "DUTIES", "SUBSTITUTE", "duties.substitute", "Vekalet görevlendirme (Dilim 2b)"),
Row(MasterSeedIds.Permissions.DutiesViewLoad,   "DUTIES", "VIEW_LOAD",  "duties.view-load",  "Nöbet/vekalet yük & adalet raporu (Dilim 2d)"),
```

- [ ] **Step 3: Map to roles**

In `RolePermissionSeedData.cs`, find the SchoolAdmin permission yield block (mirror the `TimetableManage` location ~line 132) and add:
```csharp
yield return MasterSeedIds.Permissions.DutiesView;
yield return MasterSeedIds.Permissions.DutiesManage;
yield return MasterSeedIds.Permissions.DutiesSubstitute;
yield return MasterSeedIds.Permissions.DutiesViewLoad;
```
In the Teacher block, add `yield return MasterSeedIds.Permissions.DutiesView;`. In the SuperAdmin and Secretary blocks (if present), add `yield return MasterSeedIds.Permissions.DutiesView;`.
> Read how the role blocks are structured (per-role methods/switch). Match exactly. Self-only scoping for Teacher is enforced at query level (Task 14), not via permission.

- [ ] **Step 4: Generate the permission migration**

Run:
```bash
dotnet ef migrations add 20260619_add_duties_permissions \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Expected: migration inserts 4 permission rows + role_permission rows (mirrors `20260612_add_timetable_permissions`). If the seed is applied via `HasData`, the migration is the diff; inspect it.

- [ ] **Step 5: Build**

Run: `dotnet build` → Expected: success.

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Infrastructure/Persistence/Seed/MasterData/MasterSeedIds.cs \
        src/Oksis.Infrastructure/Persistence/Seed/MasterData/PermissionSeedData.cs \
        src/Oksis.Infrastructure/Persistence/Seed/MasterData/RolePermissionSeedData.cs \
        src/Oksis.Infrastructure/Persistence/Migrations/*add_duties_permissions*
git commit -m "2026-06-19 feat: duties.* izin ailesi seed + rol eşlemesi + migration eklendi."
```

---

## Task 9: DTOs + Mapster config

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/DTOs/DutyDtos.cs`
- Create: `src/Oksis.Application/Modules/Duties/Mapping/DutiesMappingConfig.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/DutiesMappingTests.cs`

**Interfaces:**
- Produces records:
  - `DutyLocationDto(Guid Id, string Name, int Type, string? Icon, int Capacity, bool IsActive)`
  - `DutyLocationTemplateDto(Guid Id, string Code, string Name, string? Description)`
  - `DutyExemptionDto(Guid Id, Guid TeacherId, string TeacherName, int Type, DateOnly? From, DateOnly? To, string Reason)`
  - `DutyAssignmentDto(Guid Id, Guid TeacherId, string TeacherName, string? TeacherBranch, int Day, Guid LocationId, Guid? RelieverId, string? RelieverName)`
  - `DutyAssignmentDto(... , string? Conflict)` — `Conflict` is a nullable i18n code (or null) computed in `GetDutyRosterForEdit` for forward-looking warnings (e.g. teacher became exempt after assignment, AS-2a-1); FE renders it as the cell conflict tag.
  - `DutyRosterDto(Guid RosterId, Guid TermId, int Status, int Version, DateOnly? EffectiveFrom, IReadOnlyList<DutyAssignmentDto> Assignments)` — field `RosterId` (matches FE).
  - `DutyRosterVersionDto(Guid RosterId, int Version, int Status, DateOnly? EffectiveFrom, DateOnly? EffectiveTo, DateTimeOffset CreatedAt, string CreatedByName, string? Note)` — `RosterId` + `Note` (publish reason; matches FE version drawer).
  - `DutyHubSummaryDto(int TotalAssignments, int MinDuty, int MaxDuty, int ExemptCount, int ConflictCount)` — min/max = kişi başı nöbet aralığı (handoff özet şeridi; FE shape).
  - `DutyLoadRowDto(Guid TeacherId, string TeacherName, string? Branch, int DutyCount, int RelieverCount)`
  - `AvailableRelieverDto(Guid Id, string Name, string? Branch, int CurrentDutyLoad)`
  - `MyDutyItemDto(int Day, Guid LocationId, string LocationName, string Kind /* "duty"|"reliever" */)`
  - `MyDutiesDto(Guid TermId, int Version, DateOnly? EffectiveFrom, IReadOnlyList<MyDutyItemDto> Items)` — wrapper the FE teacher view consumes (matches FE `MyDutiesDto`).
  - `DutyPolicyDto(bool RelieverEnabled, int WeeklyFrequency, int DayPattern)` — duty policy (matches FE `DutyPolicyDto`).

- [ ] **Step 1: Write the DTOs**

`DTOs/DutyDtos.cs`:
```csharp
namespace Oksis.Application.Modules.Duties.DTOs;

public sealed record DutyLocationDto(Guid Id, string Name, int Type, string? Icon, int Capacity, bool IsActive);
public sealed record DutyLocationTemplateDto(Guid Id, string Code, string Name, string? Description);
public sealed record DutyExemptionDto(Guid Id, Guid TeacherId, string TeacherName, int Type, DateOnly? From, DateOnly? To, string Reason);
public sealed record DutyAssignmentDto(Guid Id, Guid TeacherId, string TeacherName, string? TeacherBranch, int Day, Guid LocationId, Guid? RelieverId, string? RelieverName, string? Conflict);
public sealed record DutyRosterDto(Guid RosterId, Guid TermId, int Status, int Version, DateOnly? EffectiveFrom, IReadOnlyList<DutyAssignmentDto> Assignments);
public sealed record DutyRosterVersionDto(Guid RosterId, int Version, int Status, DateOnly? EffectiveFrom, DateOnly? EffectiveTo, DateTimeOffset CreatedAt, string CreatedByName, string? Note);
public sealed record DutyHubSummaryDto(int TotalAssignments, int MinDuty, int MaxDuty, int ExemptCount, int ConflictCount);
public sealed record DutyLoadRowDto(Guid TeacherId, string TeacherName, string? Branch, int DutyCount, int RelieverCount);
public sealed record AvailableRelieverDto(Guid Id, string Name, string? Branch, int CurrentDutyLoad);
public sealed record MyDutyItemDto(int Day, Guid LocationId, string LocationName, string Kind);
public sealed record MyDutiesDto(Guid TermId, int Version, DateOnly? EffectiveFrom, IReadOnlyList<MyDutyItemDto> Items);
public sealed record DutyPolicyDto(bool RelieverEnabled, int WeeklyFrequency, int DayPattern);
```

- [ ] **Step 2: Write the Mapster config**

`Mapping/DutiesMappingConfig.cs`:
```csharp
using Mapster;
using Oksis.Application.Modules.Duties.DTOs;
using Oksis.Domain.Modules.Duties.Entities;

namespace Oksis.Application.Modules.Duties.Mapping;

/// <summary>Nöbet modülü DTO eşlemeleri (Mapster — AutoMapper YASAK).</summary>
public sealed class DutiesMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<DutyLocation, DutyLocationDto>()
            .Map(d => d.Type, s => (int)s.Type);
        config.NewConfig<DutyLocationTemplate, DutyLocationTemplateDto>();
    }
}
```
> Teacher names/branches in the other DTOs are resolved via explicit projection in each query handler (the `GetAvailableTeachers` two-phase pattern), not Mapster — entities hold only `TeacherId`.

- [ ] **Step 3: Write the mapping test**

```csharp
using Mapster;
using Oksis.Application.Modules.Duties.DTOs;
using Oksis.Application.Modules.Duties.Mapping;
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;

namespace Oksis.Application.UnitTests.Modules.Duties;

public class DutiesMappingTests
{
    [Fact]
    public void MapsDutyLocation()
    {
        var cfg = new TypeAdapterConfig();
        new DutiesMappingConfig().Register(cfg);
        var loc = DutyLocation.Create(Guid.NewGuid(), "Kantin", DutyLocationType.Canteen, "utensils", 1, null);

        var dto = loc.Adapt<DutyLocationDto>(cfg);

        Assert.Equal("Kantin", dto.Name);
        Assert.Equal((int)DutyLocationType.Canteen, dto.Type);
    }
}
```

- [ ] **Step 4: Run test**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~DutiesMappingTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/DTOs/ src/Oksis.Application/Modules/Duties/Mapping/ \
        tests/Oksis.Application.UnitTests/Modules/Duties/DutiesMappingTests.cs
git commit -m "2026-06-19 feat: Nöbet DTO'ları ve Mapster eşlemesi eklendi."
```

---

## Task 10: DutyLocation slices (CRUD) + ListDutyLocations query

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Commands/CreateDutyLocation/{CreateDutyLocationCommand,CreateDutyLocationCommandHandler,CreateDutyLocationCommandValidator}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Commands/UpdateDutyLocation/{...}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Commands/DeleteDutyLocation/{...}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Queries/ListDutyLocations/{ListDutyLocationsQuery,ListDutyLocationsQueryHandler}.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/CreateDutyLocationValidatorTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext`, `ITenantContext`, `Result<T>`, `[Tenancy(TenancyMode.Required)]`, `[RequirePermission(...)]`, `ICommand<T>`/`IQuery<T>` + handlers.
- Produces:
  - `CreateDutyLocationCommand(string Name, int Type, string? Icon, int Capacity, Guid? TemplateId) : ICommand<Guid>` — `duties.manage`.
  - `UpdateDutyLocationCommand(Guid Id, string Name, int Type, string? Icon, int Capacity, bool IsActive) : ICommand<Unit>` — `duties.manage`.
  - `DeleteDutyLocationCommand(Guid Id) : ICommand<Unit>` — `duties.manage` (soft delete).
  - `ListDutyLocationsQuery() : IQuery<IReadOnlyList<DutyLocationDto>>` — `duties.view`.

- [ ] **Step 1: Write the validator test**

```csharp
using Oksis.Application.Modules.Duties.Commands.CreateDutyLocation;

namespace Oksis.Application.UnitTests.Modules.Duties;

public class CreateDutyLocationValidatorTests
{
    private readonly CreateDutyLocationCommandValidator _v = new();

    [Fact]
    public void BlankName_Invalid()
    {
        var r = _v.Validate(new CreateDutyLocationCommand("", 0, null, 1, null));
        Assert.False(r.IsValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(5)]
    public void CapacityOutOfRange_Invalid(int cap)
        => Assert.False(_v.Validate(new CreateDutyLocationCommand("Bahçe", 2, null, cap, null)).IsValid);

    [Fact]
    public void Valid_Passes()
        => Assert.True(_v.Validate(new CreateDutyLocationCommand("1. Kat", 0, "building", 1, null)).IsValid);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CreateDutyLocationValidatorTests"`
Expected: FAIL — types not defined.

- [ ] **Step 3: Write Create slice**

`Commands/CreateDutyLocation/CreateDutyLocationCommand.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Duties.Commands.CreateDutyLocation;

[Tenancy(TenancyMode.Required)]
[RequirePermission("duties.manage")]
public sealed record CreateDutyLocationCommand(string Name, int Type, string? Icon, int Capacity, Guid? TemplateId)
    : ICommand<Guid>;
```
`CreateDutyLocationCommandValidator.cs`:
```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Duties.Commands.CreateDutyLocation;

public sealed class CreateDutyLocationCommandValidator : AbstractValidator<CreateDutyLocationCommand>
{
    public CreateDutyLocationCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Type).InclusiveBetween(0, 5);
        RuleFor(x => x.Capacity).InclusiveBetween(1, 4);
        RuleFor(x => x.Icon).MaximumLength(40);
    }
}
```
`CreateDutyLocationCommandHandler.cs`:
```csharp
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Duties.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Duties.Commands.CreateDutyLocation;

public sealed class CreateDutyLocationCommandHandler(IApplicationDbContext db, ITenantContext tenant)
    : ICommandHandler<CreateDutyLocationCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateDutyLocationCommand request, CancellationToken ct)
    {
        var schoolId = tenant.CurrentSchoolId;
        if (schoolId is null)
            return Result<Guid>.Forbidden();

        try
        {
            var loc = DutyLocation.Create(schoolId.Value, request.Name, (DutyLocationType)request.Type, request.Icon, request.Capacity, request.TemplateId);
            db.DutyLocations.Add(loc);
            await db.SaveChangesAsync(ct);
            return Result<Guid>.Success(loc.Id);
        }
        catch (DutyDomainException ex)
        {
            return Result<Guid>.Conflict(ex.Code);
        }
    }
}
```

- [ ] **Step 4: Write Update + Delete slices**

`Commands/UpdateDutyLocation/UpdateDutyLocationCommand.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using MediatR;

namespace Oksis.Application.Modules.Duties.Commands.UpdateDutyLocation;

[Tenancy(TenancyMode.Required)]
[RequirePermission("duties.manage")]
public sealed record UpdateDutyLocationCommand(Guid Id, string Name, int Type, string? Icon, int Capacity, bool IsActive)
    : ICommand<Unit>;
```
> Verify whether the codebase uses `Unit` (MediatR) or a project `Result` without a value for void commands. Check an existing void command (e.g. `RevokeScheduleException`); match its return type exactly (it may be `ICommand` non-generic). Use that convention for Update/Delete/AssignReliever/Publish/RemoveExemption/UpdateDutiesConfiguration.

`UpdateDutyLocationCommandHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using MediatR;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Duties.Enums;
using Oksis.Domain.Modules.Duties.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Duties.Commands.UpdateDutyLocation;

public sealed class UpdateDutyLocationCommandHandler(IApplicationDbContext db, ITenantContext tenant)
    : ICommandHandler<UpdateDutyLocationCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateDutyLocationCommand request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null)
            return Result<Unit>.Forbidden();

        var loc = await db.DutyLocations.FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (loc is null)
            return Result<Unit>.NotFound();

        try
        {
            loc.Update(request.Name, (DutyLocationType)request.Type, request.Icon, request.Capacity);
            if (request.IsActive) loc.Activate(); else loc.Deactivate();
            await db.SaveChangesAsync(ct);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (DutyDomainException ex)
        {
            return Result<Unit>.Conflict(ex.Code);
        }
    }
}
```
Add a `UpdateDutyLocationCommandValidator` mirroring the create validator (Id `NotEmpty`, Name, Type, Capacity rules).

`Commands/DeleteDutyLocation/DeleteDutyLocationCommand.cs` + handler: load by id; if null → `NotFound`; soft delete by setting `IsDeleted` through the standard soft-delete mechanism (check how other entities soft-delete — likely `db.DutyLocations.Remove(loc)` is intercepted to soft-delete, OR an entity method. Mirror `RevokeScheduleException`/an existing delete). Permission `duties.manage`. Removing a location should also drop its assignments from the current draft roster — but per design §5 the UI confirms; in 2a keep it simple: soft-delete the location only; document that draft assignments referencing a deleted location are filtered out by `GetDutyRosterForEdit` (Task 12) joining only active locations.

- [ ] **Step 5: Write ListDutyLocations query**

`Queries/ListDutyLocations/ListDutyLocationsQuery.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Duties.DTOs;

namespace Oksis.Application.Modules.Duties.Queries.ListDutyLocations;

[Tenancy(TenancyMode.Required)]
[RequirePermission("duties.view")]
public sealed record ListDutyLocationsQuery() : IQuery<IReadOnlyList<DutyLocationDto>>;
```
`ListDutyLocationsQueryHandler.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Duties.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Duties.Queries.ListDutyLocations;

public sealed class ListDutyLocationsQueryHandler(IApplicationDbContext db, ITenantContext tenant)
    : IQueryHandler<ListDutyLocationsQuery, IReadOnlyList<DutyLocationDto>>
{
    public async Task<Result<IReadOnlyList<DutyLocationDto>>> Handle(ListDutyLocationsQuery request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null)
            return Result<IReadOnlyList<DutyLocationDto>>.Forbidden();

        var rows = await db.DutyLocations.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new DutyLocationDto(x.Id, x.Name, (int)x.Type, x.Icon, x.Capacity, x.IsActive))
            .ToListAsync(ct);

        return Result<IReadOnlyList<DutyLocationDto>>.Success(rows);
    }
}
```

- [ ] **Step 6: Run tests + build**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CreateDutyLocationValidatorTests"` → PASS.
Run: `dotnet build` → success.

- [ ] **Step 7: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Commands/CreateDutyLocation/ \
        src/Oksis.Application/Modules/Duties/Commands/UpdateDutyLocation/ \
        src/Oksis.Application/Modules/Duties/Commands/DeleteDutyLocation/ \
        src/Oksis.Application/Modules/Duties/Queries/ListDutyLocations/ \
        tests/Oksis.Application.UnitTests/Modules/Duties/CreateDutyLocationValidatorTests.cs
git commit -m "2026-06-19 feat: Nöbet bölgesi CRUD slice'ları (create/update/delete/list) eklendi."
```

---

## Task 11: DutyExemption slices (Set/Remove) + ListDutyExemptions

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Commands/SetDutyExemption/{Command,Handler,Validator}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Commands/RemoveDutyExemption/{Command,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Queries/ListDutyExemptions/{Query,Handler}.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/SetDutyExemptionValidatorTests.cs`

**Interfaces:**
- Produces:
  - `SetDutyExemptionCommand(Guid TeacherId, int Type, DateOnly? From, DateOnly? To, string Reason) : ICommand<Guid>` — `duties.manage`.
  - `RemoveDutyExemptionCommand(Guid Id) : ICommand<Unit>` — `duties.manage`.
  - `ListDutyExemptionsQuery() : IQuery<IReadOnlyList<DutyExemptionDto>>` — `duties.view`.

- [ ] **Step 1: Write the validator test**

```csharp
using Oksis.Application.Modules.Duties.Commands.SetDutyExemption;

namespace Oksis.Application.UnitTests.Modules.Duties;

public class SetDutyExemptionValidatorTests
{
    private readonly SetDutyExemptionCommandValidator _v = new();

    [Fact]
    public void Temporary_RequiresRange()
        => Assert.False(_v.Validate(new SetDutyExemptionCommand(Guid.NewGuid(), 1, null, null, "Sağlık")).IsValid);

    [Fact]
    public void Permanent_NoRange_Valid()
        => Assert.True(_v.Validate(new SetDutyExemptionCommand(Guid.NewGuid(), 0, null, null, "İdari görev")).IsValid);

    [Fact]
    public void ShortReason_Invalid()
        => Assert.False(_v.Validate(new SetDutyExemptionCommand(Guid.NewGuid(), 0, null, null, "x")).IsValid);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~SetDutyExemptionValidatorTests"`
Expected: FAIL.

- [ ] **Step 3: Implement SetDutyExemption**

`SetDutyExemptionCommand.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Duties.Commands.SetDutyExemption;

[Tenancy(TenancyMode.Required)]
[RequirePermission("duties.manage")]
public sealed record SetDutyExemptionCommand(Guid TeacherId, int Type, DateOnly? From, DateOnly? To, string Reason)
    : ICommand<Guid>;
```
`SetDutyExemptionCommandValidator.cs`:
```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Duties.Commands.SetDutyExemption;

public sealed class SetDutyExemptionCommandValidator : AbstractValidator<SetDutyExemptionCommand>
{
    public SetDutyExemptionCommandValidator()
    {
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.Type).InclusiveBetween(0, 1);
        RuleFor(x => x.Reason).NotEmpty().MinimumLength(3).MaximumLength(200);
        When(x => x.Type == 1, () =>
        {
            RuleFor(x => x.From).NotNull();
            RuleFor(x => x.To).NotNull();
            RuleFor(x => x).Must(x => x.From <= x.To).WithMessage("duties.errors.exemption-range-invalid");
        });
    }
}
```
`SetDutyExemptionCommandHandler.cs`: resolve `schoolId`; `DutyExemption.Create(...)`; `db.DutyExemptions.Add(ex)`; `SaveChangesAsync`; return `Result<Guid>.Success(ex.Id)`; wrap `DutyDomainException` → `Conflict(ex.Code)`. (Mirror Task 10 Step 3 handler shape, casting `(DutyExemptionType)request.Type`.)

- [ ] **Step 4: Implement RemoveDutyExemption + ListDutyExemptions**

`RemoveDutyExemptionCommand` (`duties.manage`): load by id → `NotFound` if null → soft-delete (same mechanism as DeleteDutyLocation). Return `Result<Unit>`.

`ListDutyExemptionsQuery` (`duties.view`): two-phase like `GetAvailableTeachers` — load exemptions, collect `TeacherId`s, resolve names from `db.Persons` (active), project to `DutyExemptionDto`. Example:
```csharp
var exemptions = await db.DutyExemptions.AsNoTracking().ToListAsync(ct);
var teacherIds = exemptions.Select(e => e.TeacherId).Distinct().ToList();
var names = await db.Persons.AsNoTracking()
    .Where(p => teacherIds.Contains(p.Id))
    .Select(p => new { p.Id, p.Name.FullName })
    .ToDictionaryAsync(p => p.Id, p => p.FullName, ct);
var dtos = exemptions
    .Select(e => new DutyExemptionDto(e.Id, e.TeacherId, names.GetValueOrDefault(e.TeacherId, ""), (int)e.Type, e.From, e.To, e.Reason))
    .ToList();
```

- [ ] **Step 5: Run tests + build**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~SetDutyExemptionValidatorTests"` → PASS.
Run: `dotnet build` → success.

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Commands/SetDutyExemption/ \
        src/Oksis.Application/Modules/Duties/Commands/RemoveDutyExemption/ \
        src/Oksis.Application/Modules/Duties/Queries/ListDutyExemptions/ \
        tests/Oksis.Application.UnitTests/Modules/Duties/SetDutyExemptionValidatorTests.cs
git commit -m "2026-06-19 feat: Muafiyet slice'ları (set/remove/list) eklendi."
```

---

## Task 12: Roster edit — GetDutyRosterForEdit + SaveDutyRosterDraft

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Queries/GetDutyRosterForEdit/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Commands/SaveDutyRosterDraft/{Command,Handler,Validator}.cs`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Duties/SaveDutyRosterDraftTests.cs`

**Interfaces:**
- Produces:
  - `GetDutyRosterForEditQuery(Guid TermId) : IQuery<DutyRosterDto>` — `duties.view`. Returns the live (Published, EffectiveTo==null) roster if present else the latest Draft else an empty draft shell (`RosterId` `Guid.Empty`, Status 0).
  - `SaveDutyRosterDraftCommand(Guid TermId, Guid AcademicYearId, IReadOnlyList<DutyAssignmentInput> Assignments) : ICommand<Guid>` — `duties.manage`, where `DutyAssignmentInput(Guid TeacherId, int Day, Guid LocationId, Guid? RelieverId)`. Replays the buffered assignment set onto a Draft roster (creates one if none), enforcing domain invariants + exemptions.

- [ ] **Step 1: Write the integration test**

```csharp
using Oksis.Application.Modules.Duties.Commands.SaveDutyRosterDraft;
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;

namespace Oksis.Application.IntegrationTests.Modules.Duties;

public class SaveDutyRosterDraftTests : IntegrationTestBase
{
    [Fact]
    public async Task ExemptTeacher_IsRejected()
    {
        var termId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();
        var locId = Guid.NewGuid();

        Db.DutyLocations.Add(DutyLocation.Create(SchoolId, "Kantin", DutyLocationType.Canteen, null, 1, null) /* set Id=locId via reflection or use returned id */);
        Db.DutyExemptions.Add(DutyExemption.Create(SchoolId, teacherId, DutyExemptionType.Permanent, null, null, "İdari"));
        await Db.SaveChangesAsync(default);

        var handler = new SaveDutyRosterDraftCommandHandler(Db, Tenant);
        var result = await handler.Handle(
            new SaveDutyRosterDraftCommand(termId, Guid.NewGuid(),
                new[] { new DutyAssignmentInput(teacherId, (int)DayOfWeek.Monday, locId, null) }),
            default);

        Assert.True(result.IsFailure);
        Assert.Equal("duties.errors.teacher-exempt", result.Error); // verify Result error accessor name
    }
}
```
> Adjust `IntegrationTestBase`/`Db`/`SchoolId`/`Tenant` and `Result` error accessor to the project convention. To pin the location id, query it back after save, or expose the created id.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.IntegrationTests --filter "FullyQualifiedName~SaveDutyRosterDraftTests"`
Expected: FAIL — types not defined.

- [ ] **Step 3: Implement GetDutyRosterForEdit**

Query loads the live roster (`Status==Published && EffectiveTo==null`) else latest `Draft` (max Version) for the term, with assignments; resolves teacher/reliever names + branches via the two-phase pattern; projects to `DutyRosterDto`. For each assignment compute `Conflict` (nullable i18n code): set to `"duties.conflict.teacher-exempt"` when the assignment's `TeacherId` has an active (Permanent, or Temporary covering today) `DutyExemption` — the forward-looking warning of AS-2a-1 (assign happened, exemption added later); otherwise `null`. (No availability/lesson conflict for nöbet — K-2a-2/K-2a-1.) If no roster, return an empty shell DTO (`RosterId == Guid.Empty`, Status 0, empty assignments). `duties.view`.

- [ ] **Step 4: Implement SaveDutyRosterDraft**

`SaveDutyRosterDraftCommand.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Duties.Commands.SaveDutyRosterDraft;

public sealed record DutyAssignmentInput(Guid TeacherId, int Day, Guid LocationId, Guid? RelieverId);

[Tenancy(TenancyMode.Required)]
[RequirePermission("duties.manage")]
public sealed record SaveDutyRosterDraftCommand(Guid TermId, Guid AcademicYearId, IReadOnlyList<DutyAssignmentInput> Assignments)
    : ICommand<Guid>;
```
Handler logic:
1. Resolve `schoolId`; load active `DutyLocations` into `Dictionary<Guid, int capacity>`.
2. Build exempt set for the week: `db.DutyExemptions` where `Type==Permanent` (always) — temporary exemptions are date-bound; for a weekly roster treat any teacher with a Permanent exemption as exempt; Temporary exemptions do NOT block the weekly template (they apply per-date at consumption). Document this: `exemptForWeek = permanent exemptions only`.
3. Find existing Draft roster for the term, else `DutyRoster.CreateDraft(schoolId, AcademicYearId, TermId)` and `Add`.
4. Clear its current assignments (remove all) and replay each input via `roster.Assign(...)`, then `AssignReliever` for inputs with `RelieverId` (only if `SchoolSettings.DutiesRelieverEnabled`; otherwise ignore reliever). Wrap `DutyDomainException` → `Conflict(ex.Code)`.
5. Before `SaveChangesAsync`, fill the `school_id`/`academic_term_id` shadow props on assignments (per Task 6 Step 4 note) if not handled by interceptor.
6. Return `Result<Guid>.Success(roster.Id)`. Catch `DbUpdateException` → `Conflict("duties.errors.assignment-duplicate")`.

> Reliever candidate validity (lesson conflict / day-uniqueness) is enforced at the `AssignReliever` query/UI; the domain only guards INV-D4. Keep SaveDraft authoritative for INV-D1/D2/D3.

- [ ] **Step 5: Run tests + build**

Run: `dotnet test tests/Oksis.Application.IntegrationTests --filter "FullyQualifiedName~SaveDutyRosterDraftTests"` → PASS.
Run: `dotnet build` → success.

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Queries/GetDutyRosterForEdit/ \
        src/Oksis.Application/Modules/Duties/Commands/SaveDutyRosterDraft/ \
        tests/Oksis.Application.IntegrationTests/Modules/Duties/SaveDutyRosterDraftTests.cs
git commit -m "2026-06-19 feat: Nöbet çizelgesi düzenleme (get-for-edit + save-draft + invariant zorlaması) eklendi."
```

---

## Task 13: AssignReliever + GetAvailableRelievers (lunch-window, NOT availability)

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Commands/AssignReliever/{Command,Handler,Validator}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Queries/GetAvailableRelievers/{Query,Handler}.cs`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Duties/GetAvailableRelieversTests.cs`

**Interfaces:**
- Produces:
  - `AssignRelieverCommand(Guid RosterId, Guid AssignmentId, Guid? RelieverId) : ICommand<Unit>` — `duties.manage`. Returns `Conflict("duties.errors.reliever-disabled")` if `!DutiesRelieverEnabled`. `RelieverId==null` clears.
  - `GetAvailableRelieversQuery(Guid TermId, int Day, Guid LocationId) : IQuery<IReadOnlyList<AvailableRelieverDto>>` — `duties.manage`. Candidates = teachers NOT exempt (permanent) + NOT already on a duty/reliever that day in the live/draft roster + NO lesson at the lunch-window period(s) that day. **Must NOT query `TeacherAvailabilities` (K-2a-2).**

- [ ] **Step 1: Write the integration test**

```csharp
using Oksis.Application.Modules.Duties.Queries.GetAvailableRelievers;

namespace Oksis.Application.IntegrationTests.Modules.Duties;

public class GetAvailableRelieversTests : IntegrationTestBase
{
    [Fact]
    public async Task ExcludesTeacherWithLessonInLunchWindow_ButIgnoresAvailability()
    {
        // Arrange: term with a bell schedule whose lunch window maps to period P.
        // Teacher A has a LessonPlacement at (Monday, P) → excluded.
        // Teacher B has an Unavailable availability slot at (Monday, P) but NO lesson → still INCLUDED (K-2a-2).
        // (Build via the project's seeding helpers; see SaveDutyRosterDraftTests for entity creation patterns.)

        var handler = new GetAvailableRelieversQueryHandler(Db, Tenant /*, IBellScheduleProvider*/);
        var result = await handler.Handle(new GetAvailableRelieversQuery(TermId, (int)DayOfWeek.Monday, LocationId), default);

        Assert.True(result.IsSuccess);
        Assert.DoesNotContain(result.Value!, r => r.Id == TeacherAId);
        Assert.Contains(result.Value!, r => r.Id == TeacherBId);
    }
}
```
> This test encodes the K-2a-2 guarantee. Fill `TermId`/`LocationId`/`TeacherAId`/`TeacherBId` and bell-schedule setup from project helpers. If a full bell-schedule fixture is heavy, at minimum assert the availability-ignoring behavior with a teacher who has an `Unavailable` slot but no lesson.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.IntegrationTests --filter "FullyQualifiedName~GetAvailableRelieversTests"`
Expected: FAIL — types not defined.

- [ ] **Step 3: Implement GetAvailableRelievers**

Handler:
1. Resolve `schoolId`; resolve the lunch-window period(s) for the term from the bell schedule. Use the existing bell-schedule access the timetable module uses (`IBellScheduleProvider` per spec §10 / `GetBellSchedules`). Determine `lunchPeriods` = periods adjacent to/overlapping the öğle arası. **Assumption (AS-2a-2):** if the bell-schedule lunch metadata is not directly queryable, derive `lunchPeriods` as the configured midday break period(s); document the exact source chosen during implementation.
2. `busy` = teacher ids with an active `LessonPlacement` at `(day, p)` for any `p in lunchPeriods` in the term (mirror `GetAvailableTeachers` busy-set query, looping periods).
3. `onDuty` = teacher ids that already hold a duty or reliever on `day` in the term's live/draft roster.
4. `exempt` = teacher ids with a Permanent `DutyExemption`.
5. Candidates = active teachers (same `TeacherProfile`/`Persons` projection as `GetAvailableTeachers`) minus `busy ∪ onDuty ∪ exempt`. Include `CurrentDutyLoad` (count of duties that week from the roster). Project to `AvailableRelieverDto`, order by load then name.
6. **Do NOT touch `db.TeacherAvailabilities`.**

`GetAvailableRelieversQuery.cs`:
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Duties.DTOs;

namespace Oksis.Application.Modules.Duties.Queries.GetAvailableRelievers;

[Tenancy(TenancyMode.Required)]
[RequirePermission("duties.manage")]
public sealed record GetAvailableRelieversQuery(Guid TermId, int Day, Guid LocationId)
    : IQuery<IReadOnlyList<AvailableRelieverDto>>;
```

- [ ] **Step 4: Implement AssignReliever**

Handler: resolve `schoolId`; if `!DutiesRelieverEnabled` (read `SchoolSettings`) → `Conflict("duties.errors.reliever-disabled")`. Load the Draft roster by `RosterId` → `NotFound` if null/not-draft. If `RelieverId` is null → `roster.ClearReliever(AssignmentId)` else `roster.AssignReliever(AssignmentId, RelieverId.Value)`. Wrap `DutyDomainException` → `Conflict`. `SaveChangesAsync`. Validator: `RosterId`/`AssignmentId` NotEmpty.

- [ ] **Step 5: Run tests + build**

Run: `dotnet test tests/Oksis.Application.IntegrationTests --filter "FullyQualifiedName~GetAvailableRelieversTests"` → PASS.
Run: `dotnet build` → success.

- [ ] **Step 6: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Commands/AssignReliever/ \
        src/Oksis.Application/Modules/Duties/Queries/GetAvailableRelievers/ \
        tests/Oksis.Application.IntegrationTests/Modules/Duties/GetAvailableRelieversTests.cs
git commit -m "2026-06-19 feat: Yancı atama + aday sorgusu (ders penceresine bakar, müsaitliğe bakmaz) eklendi."
```

---

## Task 14: Publish + Versions + HubSummary + MyDuties + DutiesConfiguration

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Commands/PublishDutyRoster/{Command,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Commands/UpdateDutiesConfiguration/{Command,Handler,Validator}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Queries/GetDutiesConfiguration/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Queries/GetDutyRosterVersions/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Queries/GetDutyHubSummary/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Duties/Queries/GetMyDuties/{Query,Handler}.cs`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Duties/PublishDutyRosterTests.cs`, `tests/Oksis.Application.IntegrationTests/Modules/Duties/GetMyDutiesTests.cs`

**Interfaces:**
- Produces:
  - `PublishDutyRosterCommand(Guid TermId, DateOnly EffectiveFrom, string? Note) : ICommand<Guid>` — `duties.manage`. Publishes the term's Draft; if a live roster exists, supersedes it (`CloseAsOf(EffectiveFrom)`). `Note` is the optional publish reason stored on the roster and surfaced in the version drawer. Returns published roster id.
  - `UpdateDutiesConfigurationCommand(bool RelieverEnabled, int WeeklyFrequency, int DayPattern) : ICommand<DutyPolicyDto>` — `duties.manage`. Returns the updated config (so the FE PUT can refresh its cache without a second round-trip).
  - `GetDutiesConfigurationQuery() : IQuery<DutyPolicyDto>` — `duties.view`. Reads the tenant `SchoolSettings` duty fields. `DutyPolicyDto(bool RelieverEnabled, int WeeklyFrequency, int DayPattern)` — field names/casing must match the FE `DutyPolicyDto` (`relieverEnabled`, `weeklyFrequency`, `dayPattern`); enums serialized as their int values.
  - `GetDutyRosterVersionsQuery(Guid TermId) : IQuery<IReadOnlyList<DutyRosterVersionDto>>` — `duties.view`.
  - `GetDutyHubSummaryQuery(Guid TermId) : IQuery<DutyHubSummaryDto>` — `duties.view`, `[Cacheable]`.
  - `GetMyDutiesQuery(Guid TermId) : IQuery<MyDutiesDto>` — `duties.view`, **self-only** (uses current user's teacher id).

- [ ] **Step 1: Write the publish integration test**

```csharp
using Oksis.Application.Modules.Duties.Commands.PublishDutyRoster;
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;

namespace Oksis.Application.IntegrationTests.Modules.Duties;

public class PublishDutyRosterTests : IntegrationTestBase
{
    [Fact]
    public async Task Publish_SupersedesPriorLive_AndKeepsHistory()
    {
        var termId = Guid.NewGuid();
        var yearId = Guid.NewGuid();
        var locId = Guid.NewGuid();
        Db.DutyLocations.Add(DutyLocation.Create(SchoolId, "Kantin", DutyLocationType.Canteen, null, 1, null));
        await Db.SaveChangesAsync(default);

        // v1 live
        var r1 = DutyRoster.CreateDraft(SchoolId, yearId, termId);
        r1.Assign(Guid.NewGuid(), DayOfWeek.Monday, locId, 1, new HashSet<Guid>());
        r1.Publish(new DateOnly(2026, 9, 15), null);
        Db.DutyRosters.Add(r1);
        await Db.SaveChangesAsync(default);

        // new draft (v-staged) then publish with supersede
        var draft = DutyRoster.CreateDraft(SchoolId, yearId, termId);
        draft.Assign(Guid.NewGuid(), DayOfWeek.Tuesday, locId, 1, new HashSet<Guid>());
        Db.DutyRosters.Add(draft);
        await Db.SaveChangesAsync(default);

        var handler = new PublishDutyRosterCommandHandler(Db, Tenant);
        var result = await handler.Handle(new PublishDutyRosterCommand(termId, new DateOnly(2026, 11, 17), null), default);

        Assert.True(result.IsSuccess);
        var all = Db.DutyRosters.IgnoreQueryFilters().Where(x => x.AcademicTermId == termId).ToList();
        Assert.Contains(all, x => x.Status == DutyRosterStatus.Superseded && x.EffectiveTo == new DateOnly(2026, 11, 17));
        Assert.Single(all.Where(x => x.Status == DutyRosterStatus.Published && x.EffectiveTo == null));
    }
}
```
> `IgnoreQueryFilters()` here is test-only to read history; production handlers never use it.

- [ ] **Step 2: Run to verify it fails**

Run: `dotnet test tests/Oksis.Application.IntegrationTests --filter "FullyQualifiedName~PublishDutyRosterTests"`
Expected: FAIL.

- [ ] **Step 3: Implement PublishDutyRoster**

Handler logic:
1. Resolve `schoolId`. Load the term's **Draft** roster (the one being published) → `NotFound` if none.
2. Load the term's current live roster (`Published && EffectiveTo==null`), if any.
3. If a live roster exists and it's a different entity, call `live.Supersede(EffectiveFrom)` — but `Supersede` returns a *new* draft clone; here we already HAVE the draft to publish. So instead: set `live` to superseded directly. To avoid two code paths, expose a domain method `CloseAsOf(DateOnly asOf)` on `DutyRoster` that sets `Status=Superseded; EffectiveTo=asOf` (used when a separately-authored draft is published). Add this method in Task 4 if not present — **add it now** (small domain edit + a unit test asserting it sets the fields and throws if not Published).
4. Set the draft's `PreviousVersionId = live?.Id`, bump its `Version = (live?.Version ?? 0) + 1` via a domain method `PrepareSupersession(int newVersion, Guid? previousId)` OR compute version in `CreateDraft`. Simplest: add domain method `Publish(DateOnly effectiveFrom, int version, Guid? previousVersionId)` overload — adjust Task 4. (If you prefer, keep `Publish(effectiveFrom)` and add `SetVersionChain(int version, Guid? previousVersionId)`.)
5. `draft.Publish(EffectiveFrom, Note)`; `SaveChangesAsync` in one transaction (the pipeline Transaction behavior wraps commands). The `DutyRosterPublishedEvent` is raised by `Publish`. (`Publish` stores the optional `Note` publish reason on the roster — surfaced by the version drawer.)
6. Return `Result<Guid>.Success(draft.Id)`. Catch `DutyDomainException` → `Conflict`; `DbUpdateException` (two-live race) → `Conflict("duties.errors.roster-live-conflict")`.

> **Domain follow-up:** This task requires, on `DutyRoster` (Task 4 file): (a) a `Note` property (string?, max 500) set by `Publish`; (b) `Publish(DateOnly effectiveFrom, string? note)` — sets `Status=Published`, `EffectiveFrom`, `Note`, raises `DutyRosterPublishedEvent`; (c) `CloseAsOf(DateOnly asOf)` — sets `Status=Superseded; EffectiveTo=asOf` (throws if not Published); (d) version-chain setters (`Version`, `PreviousVersionId`). Add unit tests in `DutyRosterTests` (`CloseAsOf_SetsSupersededAndEffectiveTo`, `Publish_StoresNoteAndRaisesEvent`). Keep `Supersede(asOf)` for the in-aggregate clone path (used by 2c later); the publish flow here uses the separately-authored draft + `CloseAsOf` on the old live. Update the Task 4 `DutyRoster` definition/tests accordingly. Commit the domain addition together with this task.

- [ ] **Step 4: Implement the queries**

- `GetDutyRosterVersionsQuery`: load all rosters for the term (incl. superseded) ordered by `Version` desc; resolve `CreatedBy` → name; project `DutyRosterVersionDto` (incl. `RosterId`, `Note`). `duties.view`.
- `GetDutyHubSummaryQuery` (`[Cacheable]`, `duties.view`): from the live/draft roster compute `TotalAssignments` (assignment count), per-teacher duty counts → `MinDuty`/`MaxDuty` (kişi başı nöbet aralığı; over non-exempt teachers who have ≥1 duty, else 0), `ExemptCount` (active exemptions), `ConflictCount` (count of assignments whose `Conflict != null`; 0 in the common 2a case). Add the `[Cacheable]` attribute exactly as timetable cacheable queries do (check `GetHubSummary`/an existing `[Cacheable]` query for the attribute name + key pattern; key must carry tenant + termId).
- `GetMyDutiesQuery` (`duties.view`, self-only): resolve the current user's teacher/person id from `ITenantContext`/current-user accessor (check how other self-only queries get the caller's id — e.g. a `ICurrentUser`/`tenant.CurrentUserId` + teacher profile lookup). Load the live roster; select assignments where `TeacherId == me` (kind "duty") plus assignments where `RelieverId == me` (kind "reliever", only if `DutiesRelieverEnabled`); join active locations for names; wrap in `MyDutiesDto(TermId, roster.Version, roster.EffectiveFrom, items)`. If no live roster, return `MyDutiesDto(termId, 0, null, [])`.

- [ ] **Step 5: Implement UpdateDutiesConfiguration**

`UpdateDutiesConfigurationCommand(bool RelieverEnabled, int WeeklyFrequency, int DayPattern)` (`duties.manage`). Handler: load `SchoolSettings` for tenant; `settings.UpdateDutiesConfiguration(RelieverEnabled, (DutyWeeklyFrequency)WeeklyFrequency, (DutyDayPattern)DayPattern)`; `SaveChangesAsync`; return `Result<DutyPolicyDto>.Success(new(settings.DutiesRelieverEnabled, (int)settings.DutyWeeklyFrequency, (int)settings.DutyDayPattern))`. Validator: `WeeklyFrequency` 0..2, `DayPattern` 0..1.

Also implement **`GetDutiesConfigurationQuery`** (`duties.view`): load the tenant `SchoolSettings` (single row); project `DutyPolicyDto(settings.DutiesRelieverEnabled, (int)settings.DutyWeeklyFrequency, (int)settings.DutyDayPattern)`. If no settings row exists yet, return the domain defaults (`false, OncePerWeek(1), Spread(0)`). This is the GET the FE `getPolicy` consumes; without it the Politika tab cannot load current values.

- [ ] **Step 6: Write GetMyDuties self-only test**

```csharp
namespace Oksis.Application.IntegrationTests.Modules.Duties;

public class GetMyDutiesTests : IntegrationTestBase
{
    [Fact]
    public async Task ReturnsOnlyCallersDuties()
    {
        // live roster with assignments for the current caller (me) and another teacher.
        // Assert result contains only `me`'s duty/reliever items.
    }
}
```
> Flesh out with the project's current-user test harness (how `IntegrationTestBase` sets the acting user). Assert no other teacher's items leak.

- [ ] **Step 7: Run tests + build**

Run: `dotnet test tests/Oksis.Application.IntegrationTests --filter "FullyQualifiedName~PublishDutyRosterTests|FullyQualifiedName~GetMyDutiesTests"` → PASS.
Run: `dotnet build` → success.

- [ ] **Step 8: Commit**

```bash
dotnet format
git add src/Oksis.Application/Modules/Duties/Commands/PublishDutyRoster/ \
        src/Oksis.Application/Modules/Duties/Commands/UpdateDutiesConfiguration/ \
        src/Oksis.Application/Modules/Duties/Queries/GetDutiesConfiguration/ \
        src/Oksis.Application/Modules/Duties/Queries/GetDutyRosterVersions/ \
        src/Oksis.Application/Modules/Duties/Queries/GetDutyHubSummary/ \
        src/Oksis.Application/Modules/Duties/Queries/GetMyDuties/ \
        src/Oksis.Domain/Modules/Duties/Entities/DutyRoster.cs \
        tests/Oksis.Application.IntegrationTests/Modules/Duties/PublishDutyRosterTests.cs \
        tests/Oksis.Application.IntegrationTests/Modules/Duties/GetMyDutiesTests.cs \
        tests/Oksis.Domain.UnitTests/Modules/Duties/DutyRosterTests.cs
git commit -m "2026-06-19 feat: Yayınla (supersede) + sürümler + hub özeti + nöbetlerim (self) + politika ayarı slice'ları eklendi."
```

---

## Task 15: DutiesController + publish notification handler

**Files:**
- Create: `src/Oksis.Api/Controllers/V1/DutiesController.cs`
- Create: `src/Oksis.Application/Modules/Duties/Events/DutyRosterPublishedEventHandler.cs`
- Test: `tests/Oksis.Api.UnitTests/Controllers/DutiesControllerTests.cs` (if the project unit-tests controllers; else an integration smoke test)

**Interfaces:**
- Consumes: every command/query above via `ISender`.
- Produces: `/api/v1/duties` endpoints (design §5) + `DutyRosterPublishedEvent` notification fan-out (Outbox → existing dispatcher).

- [ ] **Step 1: Write the controller**

`DutiesController.cs` (mirror `SchedulingController` exactly — `[ApiController]`, `[Authorize]`, `ISender`, `ToHttpResult(HttpContext)`):
```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
// + using directives for each command/query + body records

namespace Oksis.Api.Controllers.V1;

[ApiController]
[Route("api/v1/duties")]
[Authorize]
public sealed class DutiesController(ISender sender) : ControllerBase
{
    // --- Locations ---
    [HttpGet("locations")]
    public async Task<IActionResult> ListLocations(CancellationToken ct)
        => (await sender.Send(new ListDutyLocationsQuery(), ct)).ToHttpResult(HttpContext);

    [HttpPost("locations")]
    public async Task<IActionResult> CreateLocation([FromBody] CreateDutyLocationCommand body, CancellationToken ct)
        => (await sender.Send(body, ct)).ToHttpResult(HttpContext);

    [HttpPut("locations/{id:guid}")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateDutyLocationBody body, CancellationToken ct)
        => (await sender.Send(new UpdateDutyLocationCommand(id, body.Name, body.Type, body.Icon, body.Capacity, body.IsActive), ct)).ToHttpResult(HttpContext);

    [HttpDelete("locations/{id:guid}")]
    public async Task<IActionResult> DeleteLocation(Guid id, CancellationToken ct)
        => (await sender.Send(new DeleteDutyLocationCommand(id), ct)).ToHttpResult(HttpContext);

    // --- Exemptions ---
    [HttpGet("exemptions")]
    public async Task<IActionResult> ListExemptions(CancellationToken ct)
        => (await sender.Send(new ListDutyExemptionsQuery(), ct)).ToHttpResult(HttpContext);

    [HttpPost("exemptions")]
    public async Task<IActionResult> SetExemption([FromBody] SetDutyExemptionCommand body, CancellationToken ct)
        => (await sender.Send(body, ct)).ToHttpResult(HttpContext);

    [HttpDelete("exemptions/{id:guid}")]
    public async Task<IActionResult> RemoveExemption(Guid id, CancellationToken ct)
        => (await sender.Send(new RemoveDutyExemptionCommand(id), ct)).ToHttpResult(HttpContext);

    // --- Roster ---
    [HttpGet("roster")]
    public async Task<IActionResult> GetRoster([FromQuery] Guid termId, CancellationToken ct)
        => (await sender.Send(new GetDutyRosterForEditQuery(termId), ct)).ToHttpResult(HttpContext);

    [HttpPut("roster")]
    public async Task<IActionResult> SaveRoster([FromBody] SaveDutyRosterDraftCommand body, CancellationToken ct)
        => (await sender.Send(body, ct)).ToHttpResult(HttpContext);

    [HttpPost("roster/reliever")]
    public async Task<IActionResult> AssignReliever([FromBody] AssignRelieverCommand body, CancellationToken ct)
        => (await sender.Send(body, ct)).ToHttpResult(HttpContext);

    [HttpPost("roster/publish")]
    public async Task<IActionResult> Publish([FromBody] PublishDutyRosterCommand body, CancellationToken ct)
        => (await sender.Send(body, ct)).ToHttpResult(HttpContext);

    [HttpGet("roster/versions")]
    public async Task<IActionResult> Versions([FromQuery] Guid termId, CancellationToken ct)
        => (await sender.Send(new GetDutyRosterVersionsQuery(termId), ct)).ToHttpResult(HttpContext);

    // --- Summary / candidates / self ---
    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] Guid termId, CancellationToken ct)
        => (await sender.Send(new GetDutyHubSummaryQuery(termId), ct)).ToHttpResult(HttpContext);

    [HttpGet("available-relievers")]
    public async Task<IActionResult> AvailableRelievers([FromQuery] Guid termId, [FromQuery] int day, [FromQuery] Guid locationId, CancellationToken ct)
        => (await sender.Send(new GetAvailableRelieversQuery(termId, day, locationId), ct)).ToHttpResult(HttpContext);

    [HttpGet("me")]
    public async Task<IActionResult> MyDuties([FromQuery] Guid termId, CancellationToken ct)
        => (await sender.Send(new GetMyDutiesQuery(termId), ct)).ToHttpResult(HttpContext);
}

public sealed record UpdateDutyLocationBody(string Name, int Type, string? Icon, int Capacity, bool IsActive);
```
The duties-settings endpoints live on the schools settings controller (design §5). Add **both** GET (FE `getPolicy`) and PUT to the existing settings controller:
```csharp
[HttpGet("settings/duties")]
public async Task<IActionResult> GetDutiesSettings(CancellationToken ct)
    => (await sender.Send(new GetDutiesConfigurationQuery(), ct)).ToHttpResult(HttpContext);

[HttpPut("settings/duties")]
public async Task<IActionResult> UpdateDutiesSettings([FromBody] UpdateDutiesConfigurationCommand body, CancellationToken ct)
    => (await sender.Send(body, ct)).ToHttpResult(HttpContext);  // returns the updated DutyPolicyDto
```
> Match `ToHttpResult` usage + `ApiResponse`/201 conventions from `SchedulingController` precisely (some POSTs there return `StatusCode(201, ApiResponse<T>.Ok(...))`). Mirror that for create endpoints if that's the house style.

- [ ] **Step 2: Write the publish notification handler**

`Events/DutyRosterPublishedEventHandler.cs`: an `INotificationHandler<DutyRosterPublishedEvent>` (or the project's domain-event handler abstraction — check how `ScheduleExceptionCreatedEvent` is handled/dispatched via Outbox). It resolves recipients = `AffectedTeacherIds` and enqueues an in-app/SignalR/FCM notification "Nöbet çizelgesi güncellendi" via the existing `INotificationDispatcher`/recipient-resolver pattern. Return i18n code for the message; do not hardcode Turkish in a way that bypasses i18n.
> Mirror the existing notification wiring exactly (recipient resolver registration, Outbox). If duties notifications are large, the minimal 2a deliverable is: event handled + dispatched to affected teachers. If the dispatch infra needs a resolver registration, add it next to the timetable ones.

- [ ] **Step 3: Build + smoke test**

Run: `dotnet build` → success.
Run: `dotnet test` → all green (full suite).

- [ ] **Step 4: Commit**

```bash
dotnet format
git add src/Oksis.Api/Controllers/V1/DutiesController.cs \
        src/Oksis.Application/Modules/Duties/Events/DutyRosterPublishedEventHandler.cs \
        src/Oksis.Api/Controllers/ # settings controller change
git commit -m "2026-06-19 feat: DutiesController (/api/v1/duties) + nöbet yayın bildirimi eklendi."
```

---

## Task 16: Module docs + full suite

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md`, `business-rules.md`, `permissions.md`, `database-schema.md`, `api-contracts.md`; `.claude/docs/permission-matrix.md`. Create the `Duties` module doc set if the module guide requires it.

- [ ] **Step 1: Run the full suite**

Run: `dotnet build && dotnet test`
Expected: build OK, all tests green.

- [ ] **Step 2: Update docs**

- `completion_status.md`: add Dilim 2a section; mark BE items ✅; under **⚠️ Spec Dışına Çıkılanlar** log: (a) K-2a-2 müsaitlik nöbete girdi DEĞİL (teknik analiz §3.4/§8.2 geçersiz, kullanıcı onayı 2026-06-19), (b) K-2a-3 kapasite-farkındalıklı index (tek-nöbetçi index yerine), (c) yeni `duties.*` izin ailesi + yeni SchoolSettings anahtarları.
- `permissions.md` + `permission-matrix.md`: add `duties.view/manage/substitute/view-load` + role mapping.
- `database-schema.md`: 4 new tables + indexes. `api-contracts.md`: the 15 endpoints. `business-rules.md`: INV-D1..D5 + temporal supersede.

- [ ] **Step 3: Commit**

```bash
git add .claude/docs/
git commit -m "2026-06-19 docs: Nöbet çizelgesi (Faz 4/Dilim 2a) backend — modül dokümanları + spec sapmaları işlendi."
```

---

## Self-Review

**Spec coverage (design doc → task):**
- §3.1 DutyLocation → Task 2; DutyExemption → Task 3; DutyRoster+DutyAssignment+INV-D1..D5+temporal → Task 4; enums/IDs → Task 1. ✓
- §3.2 SchoolSettings duty config → Task 5. ✓
- §3.3 tables + filtered unique indexes + migration → Task 6; index backstop test → Task 7. ✓
- §2 K-2a-6 permissions → Task 8. ✓
- §5 CQRS slices: locations CRUD+list → Task 10; exemptions → Task 11; roster get/save → Task 12; reliever+available-relievers → Task 13; publish/versions/summary/me/settings → Task 14. DTOs/Mapster → Task 9. ✓
- §5 controller (15 endpoints) + §8 notification → Task 15. ✓
- §10 tests: domain invariants (Tasks 2-4), index integ (Task 7), command rejection (Task 12), available-relievers ignores availability (Task 13), my-duties self-only (Task 14). ✓
- §12 docs → Task 16. ✓
- **Out of scope (correctly deferred):** auto-distribute (2c), vekâlet (2b), nöbet defteri + load report (2d), `GetDutyLoadReport`/`DutyLoadRowDto` defined as DTO only (Task 9) but no query — acceptable forward-decl; flagged.

**Critical-constraint coverage:** K-2a-2 enforced + tested (Task 13 explicitly includes a teacher with an `Unavailable` slot but no lesson → still a candidate). K-2a-3 capacity in aggregate (Task 4 `Assign`) + index shape (Task 6) + tests (Task 4 capacity cases, Task 7 index). K-2a-4 supersede/CloseAsOf + one-live index + test (Task 14, Task 7). K-2a-8 reliever query (Task 13).

**Placeholder scan:** No "TBD/TODO". Several steps say "mirror the existing X / verify the real signature" — these are real, named-file lookups (Result void-return convention, soft-delete mechanism, `[Cacheable]` attribute name, bell-schedule lunch source, current-user accessor, notification dispatch) with the exact sibling file named. Flagged because the codebase's exact conventions for these must be read, not invented.

**Type consistency:** `DutyLocationType`/`DutyRosterStatus`/`DutyExemptionType` int values consistent across enum (Task 1), domain (Tasks 2-4), DTOs (Task 9, `int` fields), validators (ranges). `Assign(... int locationCapacity, IReadOnlySet<Guid> exemptTeacherIdsForWeek)` signature consistent between Task 4 (definition) and Task 12 (caller). `DutyAssignmentInput(Guid,int,Guid,Guid?)` consistent Task 12↔15. `DutyRosterPublishedEvent` shape consistent Task 4↔15.

**Open assumptions made (also in design §13):**
1. **Void-command return type** (`ICommand<Unit>` vs a non-generic `ICommand`/`Result`): must match the project's existing convention (read `RevokeScheduleException`). Used `Unit` as placeholder.
2. **Soft-delete mechanism** for locations/exemptions: assumed an interceptor on `Remove(...)` or an entity flag — must mirror existing entities.
3. **Lunch-window → period mapping** for `GetAvailableRelievers` (AS-2a-2): bell-schedule source to be confirmed; assumed configured midday break period(s).
4. **`[Cacheable]` attribute** name/key pattern for `GetDutyHubSummary`: mirror an existing cacheable query.
5. **Current-user/teacher-id accessor** for `GetMyDuties` self-only: mirror an existing self-only query.
6. **Publish version-chaining**: requires small domain additions to `DutyRoster` (`CloseAsOf`, version-chain setter) folded into Task 14 with a unit test.
7. **Notification dispatch** wiring for `DutyRosterPublishedEvent`: mirror `ScheduleExceptionCreatedEvent`'s Outbox/resolver path.