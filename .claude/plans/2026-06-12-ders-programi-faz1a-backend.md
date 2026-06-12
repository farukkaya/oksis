# Ders Programı — Faz 1A (Backend Çekirdek) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **ÖNCE OKU:** `.claude/specs/ders-programi-modulu-spec.md` (bağlayıcı spec, K0.x kararları). Bu plan onun Faz 1A kısmını uygular.
> **Pattern referansı:** Mevcut `Room` dilimi — `oksis-api/src/Oksis.Domain/Modules/Timetable/Entities/Room.cs`, `Application/Modules/Timetable/Commands/CreateRoom/*`, `Infrastructure/Persistence/Configurations/Timetable/RoomConfiguration.cs`, `Api/Controllers/V1/RoomsController.cs`. Yeni kod bu desenlere birebir uyar.

**Goal:** Çakışmasız manuel ders programı taslağı kurulup kaydedilebilen backend çekirdeği (domain + persistence + occupancy + editör komut/sorguları + endpoint'ler).

**Architecture:** `ScheduleProgram` aggregate (bir Sınıf+Dönem'in tüm programı) `LessonPlacement` entity'lerini sahiplenir; ayrık `TimeSlot(Day,Period)`. Sınıf-tekilliği aggregate içi invariant; öğretmen/derslik çift-rezervasyonu iki katmanlı korunur — `IOccupancyIndex` (Redis, O(1) ön-kontrol) + DB filtreli unique index (son savunma). CQRS/MediatR, EF write + Dapper hub read.

**Tech Stack:** .NET 10 · EF Core 10 · MSSQL · MediatR · FluentValidation · StackExchange.Redis · Dapper · xUnit (mevcut test deseni).

**Kapsam dışı (sonraki fazlar):** Yayın/versiyon/snapshot, override, tüketici görünümleri, otomatik üretim, bildirim. `ScheduleProgramStatus.Published` enum'da tanımlı ama egzersiz edilmez.

---

## Çalışma kuralı (her task)
- **TDD:** önce kırmızı test → minimal implementasyon → yeşil → commit.
- Çalışma dizini `oksis-api/`. Test: `dotnet test`, tek test `dotnet test --filter "FullyQualifiedName~<Name>"`.
- Commit öncesi `dotnet format`. Commit formatı: `2026-06-12 <type>: Türkçe özet.` + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- i18n: hata kodları sabit string key (örn. `"timetable.errors.slot-occupied"`), Türkçe metin domain exception'da.

---

## Dosya yapısı (oluşturulacak/değişecek)

**Domain** (`src/Oksis.Domain/Modules/Timetable/`)
- `ValueObjects/ScheduleProgramId.cs`, `ValueObjects/LessonPlacementId.cs`, `ValueObjects/TimeSlot.cs`, `ValueObjects/WeeklyHourRequirement.cs` (create)
- `Enums/ScheduleProgramStatus.cs` (create)
- `Exceptions/InvalidScheduleProgramException.cs`, `Exceptions/SlotConflictException.cs` (create)
- `Entities/LessonPlacement.cs`, `Entities/ScheduleProgram.cs` (create)
- `Events/ScheduleProgramCreatedEvent.cs`, `Events/LessonPlacedEvent.cs`, `Events/LessonRemovedEvent.cs` (create)
- `Services/ConflictRules.cs` (create — specification benzeri saf kurallar)

**Application** (`src/Oksis.Application/Modules/Timetable/`)
- `Ports/IOccupancyIndex.cs`, `Ports/IBellScheduleProvider.cs`, `Ports/IWeeklyHourRequirementProvider.cs`, `Ports/ITeachingAssignmentSource.cs` (create)
- `Commands/CreateProgram/*`, `PlaceLesson/*`, `MoveLesson/*`, `RemoveLesson/*`, `AssignTeacher/*`, `AssignRoom/*`, `SetBlock/*`, `SaveDraft/*` (create)
- `Queries/PreCheckPlacement/*`, `GetProgramForEdit/*`, `GetUnplacedLessons/*`, `ListClassPrograms/*`, `GetHubSummary/*` (create)
- `DTOs/ScheduleProgramDtos.cs`, `DTOs/PlacementDto.cs`, `DTOs/ConflictResult.cs` (create)

**Infrastructure** (`src/Oksis.Infrastructure/`)
- `Persistence/Configurations/Timetable/ScheduleProgramConfiguration.cs`, `LessonPlacementConfiguration.cs` (create)
- `Persistence/Migrations/<gen>_add_schedule_programs.cs` (generated)
- `Timetable/RedisOccupancyIndex.cs` (create)
- `Timetable/BellScheduleProvider.cs`, `Timetable/StubWeeklyHourRequirementProvider.cs`, `Timetable/TeachingAssignmentSource.cs` (create)
- DI registration (`DependencyInjection.cs` veya modül registrar — mevcut deseni izle)

**Api** (`src/Oksis.Api/Controllers/V1/`)
- `SchedulingController.cs` (create)

**Application abstractions**
- `Common/Abstractions/IApplicationDbContext.cs` (modify — DbSet'ler ekle)
- `Infrastructure/Persistence/ApplicationDbContext.cs` (modify — DbSet'ler)

**Tests**
- `tests/Oksis.Domain.UnitTests/Modules/Timetable/Entities/ScheduleProgramTests.cs`
- `tests/Oksis.Domain.UnitTests/Modules/Timetable/ValueObjects/TimeSlotTests.cs`
- `tests/Oksis.Application.UnitTests/Modules/Timetable/Commands/*HandlerTests.cs`
- `tests/Oksis.Application.UnitTests/Modules/Timetable/Queries/PreCheckPlacementHandlerTests.cs`
- `tests/Oksis.Infrastructure.IntegrationTests/Persistence/LessonPlacementUniqueIndexTests.cs`
- `tests/Oksis.Infrastructure.IntegrationTests/Timetable/RedisOccupancyIndexTests.cs`

**Docs** (`oksis/.claude/docs/modules/timetable/`)
- `domain-model.md`, `database-schema.md` (revise → yeni model), `completion_status.md` (güncelle)

---

## Task 0: Feature branch

- [ ] **Step 1: Branch aç**
```bash
cd oksis-api && git checkout -b feature/ders-programi-faz1a
```
Expected: `Switched to a new branch 'feature/ders-programi-faz1a'`

---

## Task 1: Value objects + enum + exceptions

**Files:** Create `ScheduleProgramId.cs`, `LessonPlacementId.cs`, `TimeSlot.cs`, `WeeklyHourRequirement.cs`, `Enums/ScheduleProgramStatus.cs`, `Exceptions/InvalidScheduleProgramException.cs`, `Exceptions/SlotConflictException.cs`. Test: `ValueObjects/TimeSlotTests.cs`.

- [ ] **Step 1: TimeSlot failing test**
`tests/Oksis.Domain.UnitTests/Modules/Timetable/ValueObjects/TimeSlotTests.cs`
```csharp
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Domain.UnitTests.Modules.Timetable.ValueObjects;

public sealed class TimeSlotTests
{
    [Fact]
    public void Equality_is_by_value()
    {
        var a = new TimeSlot(DayOfWeek.Monday, 3);
        var b = new TimeSlot(DayOfWeek.Monday, 3);
        Assert.Equal(a, b);
    }

    [Fact]
    public void Period_below_one_throws()
    {
        Assert.Throws<InvalidScheduleProgramException>(() => new TimeSlot(DayOfWeek.Monday, 0));
    }
}
```

- [ ] **Step 2: Run, expect FAIL (types missing)**
Run: `dotnet test --filter "FullyQualifiedName~TimeSlotTests"` → FAIL (does not compile).

- [ ] **Step 3: Implement types**

`Exceptions/InvalidScheduleProgramException.cs` (Room'un `InvalidRoomException` desenini izle — bkz. `Modules/Timetable/Exceptions/TimetableDomainException.cs` taban sınıfı; aynı taban kullanılır):
```csharp
namespace Oksis.Domain.Modules.Timetable.Exceptions;

public sealed class InvalidScheduleProgramException(string code, string message)
    : TimetableDomainException(code, message);
```
`Exceptions/SlotConflictException.cs`:
```csharp
namespace Oksis.Domain.Modules.Timetable.Exceptions;

public sealed class SlotConflictException(string code, string message)
    : TimetableDomainException(code, message);
```
> Not: `TimetableDomainException` taban sınıfının imzasını doğrula (`InvalidRoomException` nasıl türüyorsa aynısı). Eğer taban `(string code, string message)` ctor almıyorsa, `InvalidRoomException` ile birebir aynı şekilde türet.

`Enums/ScheduleProgramStatus.cs`:
```csharp
namespace Oksis.Domain.Modules.Timetable.Enums;

public enum ScheduleProgramStatus
{
    Draft = 0,
    Revising = 1,
    Published = 2
}
```
`ValueObjects/ScheduleProgramId.cs` ve `LessonPlacementId.cs` (RoomId deseni birebir):
```csharp
namespace Oksis.Domain.Modules.Timetable.ValueObjects;

public readonly record struct ScheduleProgramId(Guid Value)
{
    public static ScheduleProgramId New() => new(Guid.NewGuid());
    public static ScheduleProgramId From(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}
```
(LessonPlacementId aynı şablon.)

`ValueObjects/TimeSlot.cs`:
```csharp
using Oksis.Domain.Modules.Timetable.Exceptions;

namespace Oksis.Domain.Modules.Timetable.ValueObjects;

/// <summary>Programın atomik birimi: (Gün, Period). Period 1..N (zil çizelgesi sırası).</summary>
public readonly record struct TimeSlot
{
    public const int MinPeriod = 1;
    public const int MaxPeriod = 20;

    public DayOfWeek Day { get; }
    public int Period { get; }

    public TimeSlot(DayOfWeek day, int period)
    {
        if (period < MinPeriod || period > MaxPeriod)
        {
            throw new InvalidScheduleProgramException(
                "timetable.errors.invalid-period",
                $"Ders saati (period) {MinPeriod}-{MaxPeriod} arası olmalı.");
        }
        Day = day;
        Period = period;
    }
}
```
`ValueObjects/WeeklyHourRequirement.cs`:
```csharp
namespace Oksis.Domain.Modules.Timetable.ValueObjects;

/// <summary>Müfredattan gelen zorunlu haftalık saat (ders başına). Faz 1'de stub provider besler.</summary>
public readonly record struct WeeklyHourRequirement(Guid SubjectId, int RequiredHours);
```

- [ ] **Step 4: Run, expect PASS**
Run: `dotnet test --filter "FullyQualifiedName~TimeSlotTests"` → PASS.

- [ ] **Step 5: Commit**
```bash
dotnet format
git add src/Oksis.Domain/Modules/Timetable tests/Oksis.Domain.UnitTests/Modules/Timetable/ValueObjects
git commit -m "2026-06-12 feat,test: Ders Programı domain value object/enum iskeleti (TimeSlot, ScheduleProgramStatus).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: `LessonPlacement` entity

**Files:** Create `Entities/LessonPlacement.cs`. (Testi Task 3'te ScheduleProgram üzerinden dolaylı; kendi başına public davranışı yok.)

- [ ] **Step 1: Implement**
```csharp
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Domain.Modules.Timetable.Entities;

/// <summary>ScheduleProgram aggregate'i içindeki tek bir yerleşim (4 boyut + zaman).</summary>
public sealed class LessonPlacement
{
    public Guid Id { get; private set; }
    public Guid ProgramId { get; private set; }
    public Guid SchoolId { get; private set; }
    public Guid AcademicTermId { get; private set; }   // denorm (index için)
    public Guid BranchId { get; private set; }         // denorm (index için)
    public DayOfWeek Day { get; private set; }
    public int Period { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid TeacherId { get; private set; }
    public Guid? RoomId { get; private set; }
    public bool IsBlock { get; private set; }
    public Guid? BlockGroupId { get; private set; }
    public bool IsActive { get; private set; }

    private LessonPlacement() { } // EF Core

    internal static LessonPlacement Create(
        ScheduleProgram program, TimeSlot slot, Guid subjectId, Guid teacherId, Guid? roomId)
    {
        return new LessonPlacement
        {
            Id = LessonPlacementId.New().Value,
            ProgramId = program.Id,
            SchoolId = program.SchoolId,
            AcademicTermId = program.AcademicTermId,
            BranchId = program.BranchId,
            Day = slot.Day,
            Period = slot.Period,
            SubjectId = subjectId,
            TeacherId = teacherId,
            RoomId = roomId,
            IsActive = true
        };
    }

    internal TimeSlot Slot => new(Day, Period);
    internal void MoveTo(TimeSlot slot) { Day = slot.Day; Period = slot.Period; }
    internal void ChangeTeacher(Guid teacherId) => TeacherId = teacherId;
    internal void ChangeRoom(Guid? roomId) => RoomId = roomId;
    internal void MarkBlock(Guid blockGroupId) { IsBlock = true; BlockGroupId = blockGroupId; }
    internal void Deactivate() => IsActive = false;
}
```

- [ ] **Step 2: Build**
Run: `dotnet build` → success (testler Task 3'te).

- [ ] **Step 3: Commit**
```bash
dotnet format && git add src/Oksis.Domain/Modules/Timetable/Entities/LessonPlacement.cs
git commit -m "2026-06-12 feat: LessonPlacement entity (ScheduleProgram aggregate içi).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `ScheduleProgram` aggregate + INV-1/INV-2

**Files:** Create `Entities/ScheduleProgram.cs`, `Events/*`. Test: `Entities/ScheduleProgramTests.cs`.

- [ ] **Step 1: Failing tests**
`tests/Oksis.Domain.UnitTests/Modules/Timetable/Entities/ScheduleProgramTests.cs`
```csharp
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.Exceptions;
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Domain.UnitTests.Modules.Timetable.Entities;

public sealed class ScheduleProgramTests
{
    private static ScheduleProgram NewProgram() =>
        ScheduleProgram.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void Place_adds_placement()
    {
        var p = NewProgram();
        p.Place(new TimeSlot(DayOfWeek.Monday, 1), Guid.NewGuid(), Guid.NewGuid(), null);
        Assert.Single(p.Placements);
    }

    [Fact]
    public void Place_same_slot_twice_violates_class_uniqueness() // INV-1
    {
        var p = NewProgram();
        var slot = new TimeSlot(DayOfWeek.Monday, 1);
        p.Place(slot, Guid.NewGuid(), Guid.NewGuid(), null);
        Assert.Throws<SlotConflictException>(
            () => p.Place(slot, Guid.NewGuid(), Guid.NewGuid(), null));
    }

    [Fact]
    public void SetBlock_requires_two_consecutive_placements() // INV-2
    {
        var p = NewProgram();
        var id1 = p.Place(new TimeSlot(DayOfWeek.Monday, 1), Guid.NewGuid(), Guid.NewGuid(), null);
        Assert.Throws<InvalidScheduleProgramException>(
            () => p.SetBlock(new[] { id1 }));
    }

    [Fact]
    public void Remove_deactivates_placement()
    {
        var p = NewProgram();
        var id = p.Place(new TimeSlot(DayOfWeek.Tuesday, 2), Guid.NewGuid(), Guid.NewGuid(), null);
        p.Remove(id);
        Assert.Empty(p.Placements); // Placements yalnız aktifleri döner
    }
}
```

- [ ] **Step 2: Run, expect FAIL**
Run: `dotnet test --filter "FullyQualifiedName~ScheduleProgramTests"` → FAIL (compile).

- [ ] **Step 3: Implement aggregate**

`Events/ScheduleProgramCreatedEvent.cs`, `LessonPlacedEvent.cs`, `LessonRemovedEvent.cs` — mevcut domain event deseni (bkz. `Modules/Timetable` veya `AcademicSessions/Events/*`; `IDomainEvent`/`DomainEvent` taban neyse onu kullan):
```csharp
namespace Oksis.Domain.Modules.Timetable.Events;
public sealed record ScheduleProgramCreatedEvent(Guid SchoolId, Guid ProgramId, Guid BranchId, Guid AcademicTermId) : IDomainEvent;
```
(LessonPlacedEvent: `(Guid SchoolId, Guid ProgramId, Guid PlacementId, DayOfWeek Day, int Period, Guid TeacherId, Guid? RoomId)`; LessonRemovedEvent: `(Guid SchoolId, Guid ProgramId, Guid PlacementId)`. `IDomainEvent` arayüzünü `Room`/`ClassRoom` event'lerinden doğrula.)

`Entities/ScheduleProgram.cs`:
```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Timetable.Enums;
using Oksis.Domain.Modules.Timetable.Events;
using Oksis.Domain.Modules.Timetable.Exceptions;
using Oksis.Domain.Modules.Timetable.ValueObjects;

namespace Oksis.Domain.Modules.Timetable.Entities;

/// <summary>
/// Bir Sınıf (Branch) + Dönem (AcademicTerm) için programın tamamı; LessonPlacement'ların sahibi.
/// Sınıf-tekilliği (INV-1) ve blok bütünlüğü (INV-2) burada güçlü tutarlılıkla zorlanır.
/// Öğretmen/derslik çapraz çakışması aggregate sınırını aşar → application (occupancy + DB unique).
/// </summary>
public sealed class ScheduleProgram : TenantEntity
{
    private readonly List<LessonPlacement> _placements = new();

    public Guid AcademicYearId { get; private set; }
    public Guid AcademicTermId { get; private set; }
    public Guid BranchId { get; private set; }
    public ScheduleProgramStatus Status { get; private set; }
    public int Version { get; private set; }

    /// <summary>Yalnızca aktif yerleşimler.</summary>
    public IReadOnlyList<LessonPlacement> Placements =>
        _placements.Where(p => p.IsActive).ToList();

    private ScheduleProgram() { } // EF Core

    public static ScheduleProgram Create(Guid schoolId, Guid academicYearId, Guid academicTermId, Guid branchId)
    {
        var program = new ScheduleProgram
        {
            Id = ScheduleProgramId.New().Value,
            SchoolId = schoolId,
            AcademicYearId = academicYearId,
            AcademicTermId = academicTermId,
            BranchId = branchId,
            Status = ScheduleProgramStatus.Draft,
            Version = 1
        };
        program.Raise(new ScheduleProgramCreatedEvent(schoolId, program.Id, branchId, academicTermId));
        return program;
    }

    /// <summary>Yerleşim ekler; INV-1 (sınıf tekilliği) korunur. PlacementId döner.</summary>
    public Guid Place(TimeSlot slot, Guid subjectId, Guid teacherId, Guid? roomId)
    {
        if (Placements.Any(p => p.Slot == slot))
        {
            throw new SlotConflictException(
                "timetable.errors.class-slot-occupied",
                $"Bu sınıfın {slot.Day} {slot.Period}. saatinde zaten bir ders var.");
        }
        var placement = LessonPlacement.Create(this, slot, subjectId, teacherId, roomId);
        _placements.Add(placement);
        Raise(new LessonPlacedEvent(SchoolId, Id, placement.Id, slot.Day, slot.Period, teacherId, roomId));
        return placement.Id;
    }

    public void Move(Guid placementId, TimeSlot newSlot)
    {
        var placement = ActivePlacement(placementId);
        if (placement.Slot != newSlot && Placements.Any(p => p.Slot == newSlot))
        {
            throw new SlotConflictException("timetable.errors.class-slot-occupied",
                $"Bu sınıfın {newSlot.Day} {newSlot.Period}. saatinde zaten bir ders var.");
        }
        placement.MoveTo(newSlot);
    }

    public void Remove(Guid placementId)
    {
        var placement = ActivePlacement(placementId);
        placement.Deactivate();
        Raise(new LessonRemovedEvent(SchoolId, Id, placement.Id));
    }

    public void AssignTeacher(Guid placementId, Guid teacherId) => ActivePlacement(placementId).ChangeTeacher(teacherId);
    public void AssignRoom(Guid placementId, Guid? roomId) => ActivePlacement(placementId).ChangeRoom(roomId);

    /// <summary>INV-2: en az 2 yerleşim + ardışık period + aynı gün → blok grubu.</summary>
    public void SetBlock(IReadOnlyCollection<Guid> placementIds)
    {
        if (placementIds.Count < 2)
        {
            throw new InvalidScheduleProgramException(
                "timetable.errors.block-needs-two",
                "Blok ders en az 2 ardışık saatten oluşmalı.");
        }
        var placements = placementIds.Select(ActivePlacement).OrderBy(p => p.Period).ToList();
        if (placements.Select(p => p.Day).Distinct().Count() != 1)
        {
            throw new InvalidScheduleProgramException("timetable.errors.block-same-day", "Blok dersin saatleri aynı günde olmalı.");
        }
        for (var i = 1; i < placements.Count; i++)
        {
            if (placements[i].Period != placements[i - 1].Period + 1)
            {
                throw new InvalidScheduleProgramException("timetable.errors.block-consecutive", "Blok dersin saatleri ardışık olmalı.");
            }
        }
        var groupId = Guid.NewGuid();
        foreach (var p in placements) p.MarkBlock(groupId);
    }

    private LessonPlacement ActivePlacement(Guid placementId) =>
        _placements.FirstOrDefault(p => p.Id == placementId && p.IsActive)
        ?? throw new InvalidScheduleProgramException("timetable.errors.placement-not-found", "Yerleşim bulunamadı.");
}
```
> `Raise(...)` / `DomainEvents` API'sini `TenantEntity`/`Entity` tabanından doğrula (Room `DomainEvents`'i Ignore ediyor → taban event mekanizması var). Taban metodun adı farklıysa (örn. `AddDomainEvent`) ona uyarla.

- [ ] **Step 4: Run, expect PASS**
Run: `dotnet test --filter "FullyQualifiedName~ScheduleProgramTests"` → PASS (4 test).

- [ ] **Step 5: Commit**
```bash
dotnet format
git add src/Oksis.Domain/Modules/Timetable tests/Oksis.Domain.UnitTests/Modules/Timetable/Entities
git commit -m "2026-06-12 feat,test: ScheduleProgram aggregate — INV-1 sınıf tekilliği, INV-2 blok bütünlüğü.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Çakışma kuralları (saf domain servisi)

**Files:** Create `Services/ConflictRules.cs`. Test: `Services/ConflictRulesTests.cs`.

Katı kuralların saf, test edilebilir karşılığı. (Öğretmen/derslik tekilliği occupancy/DB ile; burada **branş uyumu** ve **mekân türü** gibi tek-girdiyle hesaplanabilenler.)

- [ ] **Step 1: Failing test**
```csharp
using Oksis.Domain.Modules.Timetable.Services;
using Oksis.Domain.Modules.Timetable.Enums;

namespace Oksis.Domain.UnitTests.Modules.Timetable.Services;

public sealed class ConflictRulesTests
{
    [Fact]
    public void Lab_subject_in_classroom_is_unsuitable()
    {
        Assert.False(ConflictRules.IsRoomTypeSuitable(requiresLab: true, RoomType.Classroom));
        Assert.True(ConflictRules.IsRoomTypeSuitable(requiresLab: true, RoomType.Lab));
    }
}
```

- [ ] **Step 2: Run → FAIL.** `dotnet test --filter "FullyQualifiedName~ConflictRulesTests"`

- [ ] **Step 3: Implement**
```csharp
using Oksis.Domain.Modules.Timetable.Enums;

namespace Oksis.Domain.Modules.Timetable.Services;

/// <summary>Tek-girdiyle hesaplanabilen katı kurallar (saf, yan etkisiz). Çapraz-kaynak
/// tekilliği (öğretmen/derslik) application katmanında occupancy + DB unique ile.</summary>
public static class ConflictRules
{
    public static bool IsRoomTypeSuitable(bool requiresLab, RoomType roomType)
        => !requiresLab || roomType is RoomType.Lab;

    /// <summary>Yerleşim sayısı müfredat saatine eşit mi (eksik/fazla uyarısı için).</summary>
    public static int WeeklyHourDelta(int placedCount, int requiredHours) => placedCount - requiredHours;
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** (`feat,test: çakışma kuralları saf domain servisi`).

---

## Task 5: EF config + DbContext bağlama

**Files:** Create `ScheduleProgramConfiguration.cs`, `LessonPlacementConfiguration.cs`. Modify `IApplicationDbContext.cs`, `ApplicationDbContext.cs`.

- [ ] **Step 1: Config — ScheduleProgram**
`src/Oksis.Infrastructure/Persistence/Configurations/Timetable/ScheduleProgramConfiguration.cs` (RoomConfiguration desenini izle):
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Timetable.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Timetable;

public sealed class ScheduleProgramConfiguration : IEntityTypeConfiguration<ScheduleProgram>
{
    public void Configure(EntityTypeBuilder<ScheduleProgram> builder)
    {
        builder.ToAcademicTable("schedule_programs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AcademicYearId).IsRequired();
        builder.Property(x => x.AcademicTermId).IsRequired();
        builder.Property(x => x.BranchId).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.Version).IsRequired().HasDefaultValue(1);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        // backing field koleksiyonu
        builder.Metadata.FindNavigation(nameof(ScheduleProgram.Placements))!
            .SetPropertyAccessMode(PropertyAccessMode.Field);
        builder.HasMany<LessonPlacement>("_placements")
            .WithOne()
            .HasForeignKey(p => p.ProgramId)
            .OnDelete(DeleteBehavior.Cascade);

        // Bir sınıf+dönem'e tek program
        builder.HasIndex(x => new { x.SchoolId, x.AcademicTermId, x.BranchId })
            .IsUnique()
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ux_schedule_programs_class_term");
    }
}
```
> Backing-field navigation EF mapping'i OKSİS'te nasıl yapılıyorsa (ClassRoom→ClassRoomStudent koleksiyonu var) o deseni doğrula; `ClassRoomConfiguration.cs`'e bak ve birebir uygula. Yukarıdaki `HasMany("_placements")` deseni ClassRoom'unkiyle hizalanmalı.

- [ ] **Step 2: Config — LessonPlacement** (filtreli unique index — K0.2)
`LessonPlacementConfiguration.cs`:
```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Timetable.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Timetable;

public sealed class LessonPlacementConfiguration : IEntityTypeConfiguration<LessonPlacement>
{
    public void Configure(EntityTypeBuilder<LessonPlacement> builder)
    {
        builder.ToAcademicTable("lesson_placements");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.ProgramId).IsRequired();
        builder.Property(x => x.AcademicTermId).IsRequired();
        builder.Property(x => x.BranchId).IsRequired();
        builder.Property(x => x.Day).HasConversion<int>().IsRequired();
        builder.Property(x => x.Period).IsRequired();
        builder.Property(x => x.SubjectId).IsRequired();
        builder.Property(x => x.TeacherId).IsRequired();
        builder.Property(x => x.RoomId);
        builder.Property(x => x.IsBlock).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.BlockGroupId);
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);

        // K0.2 — filtreli unique index'ler (yalnız aktif yerleşimler)
        builder.HasIndex(x => new { x.SchoolId, x.AcademicTermId, x.TeacherId, x.Day, x.Period })
            .IsUnique().HasFilter("is_active = 1")
            .HasDatabaseName("ux_placement_teacher_slot");
        builder.HasIndex(x => new { x.SchoolId, x.AcademicTermId, x.RoomId, x.Day, x.Period })
            .IsUnique().HasFilter("is_active = 1 AND room_id IS NOT NULL")
            .HasDatabaseName("ux_placement_room_slot");
        builder.HasIndex(x => new { x.SchoolId, x.AcademicTermId, x.BranchId, x.Day, x.Period })
            .IsUnique().HasFilter("is_active = 1")
            .HasDatabaseName("ux_placement_class_slot");

        builder.ToTable(t => t.HasCheckConstraint("ck_placement_period", "[period] BETWEEN 1 AND 20"));
    }
}
```

- [ ] **Step 3: DbSet'ler** — `IApplicationDbContext.cs` ve `ApplicationDbContext.cs`'e ekle (mevcut `Rooms` DbSet deseni gibi):
```csharp
DbSet<ScheduleProgram> SchedulePrograms { get; }
DbSet<LessonPlacement> LessonPlacements { get; }
```

- [ ] **Step 4: Build** → `dotnet build` success.
- [ ] **Step 5: Commit** (`feat: ScheduleProgram/LessonPlacement EF config + filtreli unique index`).

---

## Task 6: Migration + eski `schedules` tablosu uzlaştırması

**Files:** generated migration.

- [ ] **Step 1: Mevcut schedules migration var mı kontrol**
```bash
ls src/Oksis.Infrastructure/Persistence/Migrations | grep -i schedule
```
Eğer eski `schedules` tablosu yaratan migration varsa: yeni migration'da `migrationBuilder.DropTable(name: "schedules", schema: "academic");` eklenir (dev — veri yok). Yoksa adım atlanır.

- [ ] **Step 2: Migration üret**
```bash
dotnet ef migrations add 20260612_add_schedule_programs \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
- [ ] **Step 3: Migration'ı incele** — `schedule_programs` + `lesson_placements` + 3 filtreli unique index + check constraint üretildiğini doğrula; gerekiyorsa `Up()`'a `DropTable("schedules")` ekle.
- [ ] **Step 4: Uygula + build**
```bash
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet build
```
- [ ] **Step 5: Commit** (`feat: schedule_programs + lesson_placements migration; eski schedules drop`).

---

## Task 7: Filtreli unique index integration testi (çift-rezervasyon backstop)

**Files:** `tests/Oksis.Infrastructure.IntegrationTests/Persistence/LessonPlacementUniqueIndexTests.cs`. (Mevcut `AssignStudentToClassRoomTests.cs` integration test altyapısını/fixture'ını birebir kullan.)

- [ ] **Step 1: Failing test**
```csharp
// Fixture: mevcut integration test base (DbContext + tenant) neyse onu kullan.
[Fact]
public async Task Second_teacher_double_booking_is_rejected_by_db()
{
    // Arrange: aynı tenant+term+teacher+day+period ile iki ayrı program'a yerleşim
    var teacherId = Guid.NewGuid();
    var slotDay = DayOfWeek.Monday; var period = 1;
    var p1 = ScheduleProgram.Create(SchoolId, YearId, TermId, Guid.NewGuid());
    p1.Place(new TimeSlot(slotDay, period), Guid.NewGuid(), teacherId, null);
    Db.SchedulePrograms.Add(p1);
    await Db.SaveChangesAsync();

    var p2 = ScheduleProgram.Create(SchoolId, YearId, TermId, Guid.NewGuid());
    p2.Place(new TimeSlot(slotDay, period), Guid.NewGuid(), teacherId, null);
    Db.SchedulePrograms.Add(p2);

    // Act + Assert: DB unique index ihlali
    await Assert.ThrowsAsync<DbUpdateException>(() => Db.SaveChangesAsync());
}
```
- [ ] **Step 2: Run → PASS** (index zaten Task 5/6'da kuruldu; bu test garantiyi kanıtlar). Eğer FAIL ederse index filtresi/kolonları düzelt.
- [ ] **Step 3: Commit** (`test: öğretmen çift-rezervasyonu DB filtreli unique index ile engelleniyor`).

---

## Task 8: Application port'ları

**Files:** Create `Ports/IOccupancyIndex.cs`, `IBellScheduleProvider.cs`, `IWeeklyHourRequirementProvider.cs`, `ITeachingAssignmentSource.cs`. `DTOs/ConflictResult.cs`.

- [ ] **Step 1: Implement port'lar**
```csharp
namespace Oksis.Application.Modules.Timetable.Ports;

public interface IOccupancyIndex
{
    /// <summary>Slot dolu mu? (teacher/room için ön-kontrol, yazmaz.) Dolu ise sebep döner.</summary>
    Task<OccupancyResult> CheckAsync(Guid schoolId, Guid termId, Guid teacherId, Guid? roomId, DayOfWeek day, int period, Guid? ignoreProgramId, CancellationToken ct);
    Task ReserveAsync(Guid schoolId, Guid termId, Guid teacherId, Guid? roomId, DayOfWeek day, int period, CancellationToken ct);
    Task ReleaseAsync(Guid schoolId, Guid termId, Guid teacherId, Guid? roomId, DayOfWeek day, int period, CancellationToken ct);
}

public readonly record struct OccupancyResult(bool IsBlocked, string? Reason)
{
    public static OccupancyResult Free => new(false, null);
    public static OccupancyResult Blocked(string reason) => new(true, reason);
}
```
```csharp
namespace Oksis.Application.Modules.Timetable.Ports;
public interface IBellScheduleProvider
{
    /// <summary>Şubenin kademesine göre geçerli period sayısı (1..N).</summary>
    Task<int> GetPeriodCountAsync(Guid schoolId, Guid branchId, CancellationToken ct);
}
```
```csharp
using Oksis.Domain.Modules.Timetable.ValueObjects;
namespace Oksis.Application.Modules.Timetable.Ports;
public interface IWeeklyHourRequirementProvider
{
    /// <summary>Şube+dönem için ders başına zorunlu haftalık saat (müfredat). Faz 1: stub.</summary>
    Task<IReadOnlyList<WeeklyHourRequirement>> GetAsync(Guid schoolId, Guid branchId, Guid termId, CancellationToken ct);
}
```
```csharp
namespace Oksis.Application.Modules.Timetable.Ports;
public interface ITeachingAssignmentSource
{
    /// <summary>Şube+dönem görevlendirmeleri: kim hangi dersi kaç saat verir (Teachers modülünden).</summary>
    Task<IReadOnlyList<AssignmentLine>> GetForBranchAsync(Guid schoolId, Guid branchId, Guid termId, CancellationToken ct);
}
public readonly record struct AssignmentLine(Guid SubjectId, Guid TeacherId, int WeeklyHours);
```
- [ ] **Step 2: Build** → success.
- [ ] **Step 3: Commit** (`feat: Timetable application port'ları (occupancy, bell, müfredat, görevlendirme)`).

---

## Task 9: Infrastructure impl'leri + DI

**Files:** Create `Timetable/RedisOccupancyIndex.cs`, `BellScheduleProvider.cs`, `StubWeeklyHourRequirementProvider.cs`, `TeachingAssignmentSource.cs`. DI registration.

- [ ] **Step 1: RedisOccupancyIndex** (StackExchange.Redis; mevcut Redis kullanan servisin DI/connection desenini izle — `IConnectionMultiplexer`)
```csharp
using StackExchange.Redis;
using Oksis.Application.Modules.Timetable.Ports;

namespace Oksis.Infrastructure.Timetable;

public sealed class RedisOccupancyIndex(IConnectionMultiplexer redis) : IOccupancyIndex
{
    private static string TeacherKey(Guid t, Guid term, Guid sch) => $"sched:{sch}:{term}:occ:teacher:{t}";
    private static string RoomKey(Guid r, Guid term, Guid sch) => $"sched:{sch}:{term}:occ:room:{r}";
    private static string Field(DayOfWeek d, int p) => $"{(int)d}:{p}";

    public async Task<OccupancyResult> CheckAsync(Guid schoolId, Guid termId, Guid teacherId, Guid? roomId, DayOfWeek day, int period, Guid? ignoreProgramId, CancellationToken ct)
    {
        var db = redis.GetDatabase();
        if (await db.HashExistsAsync(TeacherKey(teacherId, termId, schoolId), Field(day, period)))
            return OccupancyResult.Blocked("timetable.errors.teacher-slot-occupied");
        if (roomId is { } rid && await db.HashExistsAsync(RoomKey(rid, termId, schoolId), Field(day, period)))
            return OccupancyResult.Blocked("timetable.errors.room-slot-occupied");
        return OccupancyResult.Free;
    }

    public async Task ReserveAsync(Guid schoolId, Guid termId, Guid teacherId, Guid? roomId, DayOfWeek day, int period, CancellationToken ct)
    {
        var db = redis.GetDatabase();
        await db.HashSetAsync(TeacherKey(teacherId, termId, schoolId), Field(day, period), 1);
        if (roomId is { } rid) await db.HashSetAsync(RoomKey(rid, termId, schoolId), Field(day, period), 1);
    }

    public async Task ReleaseAsync(Guid schoolId, Guid termId, Guid teacherId, Guid? roomId, DayOfWeek day, int period, CancellationToken ct)
    {
        var db = redis.GetDatabase();
        await db.HashDeleteAsync(TeacherKey(teacherId, termId, schoolId), Field(day, period));
        if (roomId is { } rid) await db.HashDeleteAsync(RoomKey(rid, termId, schoolId), Field(day, period));
    }
}
```
> **Kaynak doğruluk DB'dir** (spec §4.4); Redis hız katmanı. Occupancy bayatlarsa DB unique index yine korur.

- [ ] **Step 2: BellScheduleProvider** — `GetBellSchedules` query/DbContext'ten period sayısı türet (gerçek entegrasyon). `StubWeeklyHourRequirementProvider` — boş liste veya seed döner + log "Debt: müfredat saati stub". `TeachingAssignmentSource` — `GetTeacherAssignments` / `teaching_assignments` tablosundan şube+dönem satırları.
```csharp
namespace Oksis.Infrastructure.Timetable;
public sealed class StubWeeklyHourRequirementProvider : IWeeklyHourRequirementProvider
{
    // DEBT (K0.5): müfredat saati kaynağı (Subjects curriculum hours) yok. Boş döner → INV-3 no-op.
    public Task<IReadOnlyList<WeeklyHourRequirement>> GetAsync(Guid s, Guid b, Guid t, CancellationToken ct)
        => Task.FromResult<IReadOnlyList<WeeklyHourRequirement>>(Array.Empty<WeeklyHourRequirement>());
}
```
- [ ] **Step 3: DI** — Infrastructure `DependencyInjection.cs`'te kaydet:
```csharp
services.AddScoped<IOccupancyIndex, RedisOccupancyIndex>();
services.AddScoped<IBellScheduleProvider, BellScheduleProvider>();
services.AddScoped<IWeeklyHourRequirementProvider, StubWeeklyHourRequirementProvider>();
services.AddScoped<ITeachingAssignmentSource, TeachingAssignmentSource>();
```
- [ ] **Step 4: RedisOccupancyIndex integration test** (`RedisOccupancyIndexTests.cs`) — reserve → check blocked → release → check free. (Test Redis fixture'ı mevcut Redis kullanan integration testlerden alınır; yoksa `[Trait]` ile koşullu.)
- [ ] **Step 5: Commit** (`feat,test: occupancy/bell/görevlendirme infrastructure impl + müfredat stub (Debt)`).

---

## Task 10: `CreateProgram` komutu

**Files:** `Commands/CreateProgram/{CreateProgramCommand,Handler,Validator}.cs`. Test: `CreateProgramCommandHandlerTests.cs`. (CreateRoom desenini birebir izle.)

- [ ] **Step 1: Failing handler test** (mevcut `CreateClassRoomCommandHandlerTests` mocking desenini izle — `ITenantContext`, in-memory/fake `IApplicationDbContext`)
```csharp
[Fact]
public async Task Creates_draft_program_for_branch_term()
{
    // tenant.CurrentSchoolId set; aynı branch+term'de program yok
    var result = await _handler.Handle(new CreateProgramCommand(YearId, TermId, BranchId), default);
    Assert.True(result.IsSuccess);
}

[Fact]
public async Task Duplicate_branch_term_returns_conflict()
{
    // önceden aynı branch+term program eklenmiş
    var result = await _handler.Handle(new CreateProgramCommand(YearId, TermId, BranchId), default);
    Assert.True(result.IsConflict);
}
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** (CreateRoomCommandHandler deseni):
```csharp
public sealed record CreateProgramCommand(Guid AcademicYearId, Guid AcademicTermId, Guid BranchId) : ICommand<Guid>;

public sealed class CreateProgramCommandHandler(IApplicationDbContext db, ITenantContext tenant)
    : ICommandHandler<CreateProgramCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateProgramCommand request, CancellationToken ct)
    {
        var schoolId = tenant.CurrentSchoolId;
        if (schoolId is null) return Result<Guid>.Forbidden();

        var exists = await db.SchedulePrograms.AsNoTracking()
            .AnyAsync(p => p.AcademicTermId == request.AcademicTermId && p.BranchId == request.BranchId, ct);
        if (exists) return Result<Guid>.Conflict("timetable.errors.program-exists");

        var program = ScheduleProgram.Create(schoolId.Value, request.AcademicYearId, request.AcademicTermId, request.BranchId);
        db.SchedulePrograms.Add(program);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Success(program.Id);
    }
}
```
Validator: `AcademicYearId/AcademicTermId/BranchId` NotEmpty (CreateRoom validator deseni).
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** (`feat,test: CreateProgram komutu`).

---

## Task 11: `PlaceLesson` komutu (occupancy + domain + DB backstop)

**Files:** `Commands/PlaceLesson/*`. Test: `PlaceLessonCommandHandlerTests.cs`.

- [ ] **Step 1: Failing tests**
```csharp
[Fact]
public async Task Places_when_slot_free()
{
    _occupancy.Setup(...CheckAsync...).ReturnsAsync(OccupancyResult.Free);
    var result = await _handler.Handle(new PlaceLessonCommand(ProgramId, (int)DayOfWeek.Monday, 1, SubjectId, TeacherId, null), default);
    Assert.True(result.IsSuccess);
}

[Fact]
public async Task Rejects_when_occupancy_blocked()
{
    _occupancy.Setup(...).ReturnsAsync(OccupancyResult.Blocked("timetable.errors.teacher-slot-occupied"));
    var result = await _handler.Handle(new PlaceLessonCommand(ProgramId, (int)DayOfWeek.Monday, 1, SubjectId, TeacherId, null), default);
    Assert.True(result.IsConflict);
}
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement**
```csharp
public sealed record PlaceLessonCommand(Guid ProgramId, int Day, int Period, Guid SubjectId, Guid TeacherId, Guid? RoomId) : ICommand<Guid>;

public sealed class PlaceLessonCommandHandler(IApplicationDbContext db, ITenantContext tenant, IOccupancyIndex occupancy)
    : ICommandHandler<PlaceLessonCommand, Guid>
{
    public async Task<Result<Guid>> Handle(PlaceLessonCommand request, CancellationToken ct)
    {
        var schoolId = tenant.CurrentSchoolId;
        if (schoolId is null) return Result<Guid>.Forbidden();

        var program = await db.SchedulePrograms
            .Include("_placements")
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId, ct);
        if (program is null) return Result<Guid>.NotFound("timetable.errors.program-not-found");

        var day = (DayOfWeek)request.Day;
        // 1) çapraz çakışma ön-kontrolü (occupancy)
        var occ = await occupancy.CheckAsync(schoolId.Value, program.AcademicTermId, request.TeacherId, request.RoomId, day, request.Period, program.Id, ct);
        if (occ.IsBlocked) return Result<Guid>.Conflict(occ.Reason!);

        // 2) aggregate (INV-1 sınıf tekilliği) — SlotConflictException → Conflict
        Guid placementId;
        try
        {
            placementId = program.Place(new TimeSlot(day, request.Period), request.SubjectId, request.TeacherId, request.RoomId);
        }
        catch (SlotConflictException ex) { return Result<Guid>.Conflict(ex.Code); }

        // 3) DB unique index son savunma (DbUpdateException → Conflict)
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException) { return Result<Guid>.Conflict("timetable.errors.slot-occupied"); }

        await occupancy.ReserveAsync(schoolId.Value, program.AcademicTermId, request.TeacherId, request.RoomId, day, request.Period, ct);
        return Result<Guid>.Success(placementId);
    }
}
```
> `Include("_placements")` shadow/backing-field navigation'ı; Task 5'teki mapping'e göre doğru string'i kullan. `Schedule­ProgramException.Code` property'sinin var olduğunu doğrula (TimetableDomainException'da `Code` olmalı — InvalidRoomException'da var).
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** (`feat,test: PlaceLesson — occupancy ön-kontrol + INV-1 + DB backstop`).

---

## Task 12: Düzenleme komutları — Move/Remove/AssignTeacher/AssignRoom/SetBlock/SaveDraft

**Files:** her biri `Commands/<Name>/{Command,Handler,Validator}.cs` + `*HandlerTests.cs`. Hepsi Task 10/11 desenini izler: tenant guard → program yükle → domain method → (gerekirse occupancy reserve/release) → save → Result.

Her komut için **bir test** (mutlu yol) + ilgili reddetme:

- [ ] **MoveLesson** `(Guid ProgramId, Guid PlacementId, int Day, int Period)` → occupancy check(yeni slot) + `program.Move`; eski slot release, yeni reserve. Test: `Moves_to_free_slot`, `Rejects_occupied_target`.
- [ ] **RemoveLesson** `(Guid ProgramId, Guid PlacementId)` → `program.Remove` + occupancy release. Test: `Removes_placement`.
- [ ] **AssignTeacher** `(Guid ProgramId, Guid PlacementId, Guid TeacherId)` → occupancy check(yeni teacher, mevcut slot) + `program.AssignTeacher` + reserve/release. Test: `Assigns_when_free`, `Rejects_when_teacher_busy`.
- [ ] **AssignRoom** `(Guid ProgramId, Guid PlacementId, Guid? RoomId)` → occupancy check(room) + `program.AssignRoom`. Test: `Assigns_room`, `Rejects_when_room_busy`.
- [ ] **SetBlock** `(Guid ProgramId, Guid[] PlacementIds)` → `program.SetBlock`; INV-2 ihlali → Conflict/Validation. Test: `Sets_block`, `Rejects_non_consecutive`.
- [ ] **SaveDraft** `(Guid ProgramId)` → no-op semantik (program zaten Draft; ileride toplu kaydet). Faz 1'de `Status` Draft kalır, `updated_at` dokunur. Test: `Save_keeps_draft_status`.

Her biri için 5 adım (failing test → fail → impl → pass → commit). Implementasyon iskeleti (AssignTeacher örneği, diğerleri analog):
```csharp
public sealed record AssignTeacherCommand(Guid ProgramId, Guid PlacementId, Guid TeacherId) : ICommand;
public sealed class AssignTeacherCommandHandler(IApplicationDbContext db, ITenantContext tenant, IOccupancyIndex occupancy)
    : ICommandHandler<AssignTeacherCommand>
{
    public async Task<Result> Handle(AssignTeacherCommand request, CancellationToken ct)
    {
        var schoolId = tenant.CurrentSchoolId;
        if (schoolId is null) return Result.Forbidden();
        var program = await db.SchedulePrograms.Include("_placements").FirstOrDefaultAsync(p => p.Id == request.ProgramId, ct);
        if (program is null) return Result.NotFound("timetable.errors.program-not-found");
        var placement = program.Placements.FirstOrDefault(p => p.Id == request.PlacementId);
        if (placement is null) return Result.NotFound("timetable.errors.placement-not-found");
        var occ = await occupancy.CheckAsync(schoolId.Value, program.AcademicTermId, request.TeacherId, placement.RoomId, placement.Day, placement.Period, program.Id, ct);
        if (occ.IsBlocked) return Result.Conflict(occ.Reason!);
        var oldTeacher = placement.TeacherId;
        program.AssignTeacher(request.PlacementId, request.TeacherId);
        try { await db.SaveChangesAsync(ct); } catch (DbUpdateException) { return Result.Conflict("timetable.errors.slot-occupied"); }
        await occupancy.ReleaseAsync(schoolId.Value, program.AcademicTermId, oldTeacher, placement.RoomId, placement.Day, placement.Period, ct);
        await occupancy.ReserveAsync(schoolId.Value, program.AcademicTermId, request.TeacherId, placement.RoomId, placement.Day, placement.Period, ct);
        return Result.Success();
    }
}
```
> `ICommand`/`ICommandHandler<T>` (sonuçsuz) ve `Result` (generic olmayan) varyantlarının OKSİS'te var olduğunu doğrula (DeleteRoom/UpdateRoom'a bak — `Result` non-generic kullanıyor olmalı).
- [ ] **Son adım: Commit** her komut ayrı commit (`feat,test: <Komut>`), veya mantıksal grup halinde.

---

## Task 13: Sorgular — PreCheckPlacement / GetProgramForEdit / GetUnplacedLessons

**Files:** `Queries/PreCheckPlacement/*`, `GetProgramForEdit/*`, `GetUnplacedLessons/*` + testler. `DTOs/*`.

- [ ] **PreCheckPlacement** `(Guid ProgramId, int Day, int Period, Guid TeacherId, Guid? RoomId)` → yazmaz; occupancy + program sınıf-tekilliği kontrolü → `ConflictResult { bool Ok, string? Reason }`. Test: `Returns_blocked_when_teacher_busy`, `Returns_ok_when_free`.
```csharp
public sealed record PreCheckPlacementQuery(Guid ProgramId, int Day, int Period, Guid TeacherId, Guid? RoomId) : IQuery<ConflictResult>;
// Handler: program yükle → occupancy.CheckAsync → ek olarak sınıf slot dolu mu (program.Placements) → ConflictResult
```
- [ ] **GetProgramForEdit** `(Guid ProgramId)` → program + aktif placements DTO (editör için). EF projection. Test: `Returns_program_with_placements`.
- [ ] **GetUnplacedLessons** `(Guid ProgramId)` → `ITeachingAssignmentSource.GetForBranchAsync` − halihazırda yerleşmiş (subject×count) = yerleşmemiş dersler. Test: `Returns_assignments_minus_placed`.
- [ ] Her sorgu: failing test → impl → pass → commit.

`DTOs/ConflictResult.cs`:
```csharp
namespace Oksis.Application.Modules.Timetable.DTOs;
public sealed record ConflictResult(bool Ok, string? Reason, IReadOnlyList<string> Warnings);
```

---

## Task 14: Hub sorguları (Dapper) — ListClassPrograms / GetHubSummary

**Files:** `Queries/ListClassPrograms/*`, `GetHubSummary/*` + testler. (Dapper kullanan mevcut bir okuma var mı kontrol et; yoksa EF projection ile başla, performans gerekçesi spec §5'te.)

- [ ] **ListClassPrograms** `(filtre: termId?, durum?, sayfa)` → sınıf bazlı program satırları + durum + placement sayısı + çakışma/eksik-saat rozet verisi. Test: `Lists_programs_for_term`.
- [ ] **GetHubSummary** → sayaçlar: toplam program, taslak, eksik-saatli, çakışmalı. Test: `Summarizes_counts`.
- [ ] Her biri: failing test → impl → pass → commit.

> Faz 1'de "çakışma rozeti" hesaplama maliyetli olabilir; basit yaklaşım: program başına aktif placement sayısı + müfredat hedefi (stub → 0) farkı. Gerçek çakışma DB unique ile zaten engellendiği için Hub'da "çakışma" çoğunlukla 0; eksik-saat asıl rozet.

---

## Task 15: `SchedulingController` endpoint'leri

**Files:** Create `Api/Controllers/V1/SchedulingController.cs`. (RoomsController desenini izle: `ISender`, `ToHttpResult`, `ApiResponse<T>`, `[Authorize]`.)

- [ ] **Step 1: Implement controller** — spec §6 tablosu:
```csharp
[ApiController]
[Route("api/v1/timetable")]
[Authorize]
[Produces("application/json")]
public sealed class SchedulingController(ISender sender) : ControllerBase
{
    [HttpGet("programs")]                       // timetable.view-all
    public async Task<IActionResult> ListAsync([FromQuery] Guid? termId, [FromQuery] int page, CancellationToken ct)
        => (await sender.Send(new ListClassProgramsQuery(termId, page), ct)).ToHttpResult(HttpContext);

    [HttpGet("programs/{id:guid}")]             // timetable.manage
    public async Task<IActionResult> GetAsync(Guid id, CancellationToken ct)
        => (await sender.Send(new GetProgramForEditQuery(id), ct)).ToHttpResult(HttpContext);

    [HttpPost("programs")]                        // CreateProgram
    public async Task<IActionResult> CreateAsync([FromBody] CreateProgramCommand cmd, CancellationToken ct) { /* 201 deseni RoomsController gibi */ }

    [HttpPost("programs/{id:guid}/placements")]   // PlaceLesson
    [HttpPut("programs/{id:guid}/placements/{pid:guid}")] // Move/AssignTeacher/AssignRoom/SetBlock (body ile ayrım)
    [HttpDelete("programs/{id:guid}/placements/{pid:guid}")] // RemoveLesson
    [HttpPost("programs/{id:guid}/precheck")]     // PreCheckPlacement
    [HttpGet("programs/{id:guid}/unplaced")]      // GetUnplacedLessons
    [HttpGet("programs/{id:guid}/conflicts")]     // (Faz 1: eksik-saat raporu)
}
```
- [ ] **Step 2: İzin** — endpoint'lere policy/attribute ile `timetable.manage` / `timetable.view-all`. (Mevcut permission attribute deseni neyse onu kullan — RoomsController `[Authorize]` + handler/policy; OKSİS permission kontrolü pipeline'da olabilir. `permission-matrix.md` + mevcut bir korumalı controller'a bak.)
- [ ] **Step 3: Manuel smoke** — `dotnet run` + Scalar'dan bir program oluştur → placement ekle → precheck. (Veya minimal API integration testi.)
- [ ] **Step 4: Commit** (`feat: SchedulingController — Faz 1 editör/hub endpoint'leri`).

---

## Task 16: Modül dokümanları revizyonu + completion_status

**Files:** `oksis/.claude/docs/modules/timetable/domain-model.md`, `database-schema.md`, `completion_status.md`. (workspace repo — master'a docs commit.)

- [ ] **Step 1: `domain-model.md`** — satır-`Schedule` modelini `ScheduleProgram` aggregate + `LessonPlacement` + `TimeSlot(Day,Period)` modeliyle değiştir. INV-1/INV-2/INV-3, domain event'ler, port'lar (IOccupancyIndex/IBellScheduleProvider/IWeeklyHourRequirementProvider) güncel.
- [ ] **Step 2: `database-schema.md`** — `schedules` (StartTime/EndTime) yerine `schedule_programs` + `lesson_placements` + 3 filtreli unique index. Eski "filtered unique kullanılamaz" notunu kaldır (artık period model → kullanılıyor).
- [ ] **Step 3: `completion_status.md`** — Faz 1A backend ✅ bölümüne taşı, ilerleme %'sini güncelle (örn. %30 → %50), Güncel tarihi.
- [ ] **Step 4: Commit** (workspace repo, master): `2026-06-12 docs: timetable domain/şema dokümanları ScheduleProgram modeline revize; Faz 1A backend işlendi.`

---

## Task 17: Bitiş — format, tüm testler, PR

- [ ] **Step 1:** `dotnet format` (oksis-api).
- [ ] **Step 2:** `dotnet test` → tüm yeşil. Çıktıyı doğrula (kanıt).
- [ ] **Step 3:** Branch push + PR (kullanıcı onayıyla):
```bash
git push -u origin feature/ders-programi-faz1a
gh pr create --title "Ders Programı Faz 1A — backend çekirdek" --body "..."
```
- [ ] **Step 4:** `requesting-code-review` skill ile self-review / review checkpoint.

---

## Self-review (yazım sonrası — plan ↔ spec)

- **Spec §3 domain** → Task 1-4 ✅ · **§4 persistence + filtreli index** → Task 5-7 ✅ · **§4.4 occupancy** → Task 8-9 ✅ · **§5 slice'lar** → Task 10-14 ✅ · **§6 endpoint** → Task 15 ✅ · **§10 bağımlılık (gerçek/stub)** → Task 9 ✅ · **§11 kabul kriterleri** → Task 7 (unique index testi), Task 3 (INV testleri), Task 15 (endpoint) ✅ · **K0.3 doküman revizyonu** → Task 16 ✅.
- **Boşluk:** Yayın/override/tüketici = kapsam dışı (Faz 2), bilinçli. INV-3 haftalık-saat doğrulaması stub nedeniyle no-op (Debt, kayıtlı).
- **Tip tutarlılığı:** `ScheduleProgram.Place(...)` → `Guid` döner (placementId); handler'lar `program.AcademicTermId` kullanır; occupancy imzası tüm çağrılarda aynı (schoolId, termId, teacherId, roomId?, day, period, ignoreProgramId?, ct). ✅
- **Doğrulanacak varsayımlar (impl sırasında):** `TimetableDomainException` ctor imzası + `Code` property; `TenantEntity` event API (`Raise`/`AddDomainEvent`); backing-field navigation mapping (ClassRoom deseni); `Result`/`Result<T>` `NotFound/Conflict/Forbidden` üyeleri; permission attribute deseni. Her biri ilgili mevcut dosyaya bakılarak netleştirilecek (uydurMA — CLAUDE.md davranış #3).

---

*Plan · Ders Programı Faz 1A (backend) · 2026-06-12*
