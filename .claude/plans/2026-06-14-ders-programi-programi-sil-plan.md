# Programı Sil (B grubu B-2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin bir ders programını (taslak veya yayında) Hub satır menüsünden ya da editör ⋯ menüsünden, iki kademeli teyitle silebilsin; program soft-delete edilir, yerleşimler/sürümler/istisnalar temizlenir, occupancy serbest bırakılır ve aynı sınıf+döneme yeni program açılabilir.

**Architecture:** Full-stack vertical slice (B-1 Sürüm Geçmişi aynası). Backend: `ScheduleProgram.Delete()` domain davranışı + `DeleteScheduleProgram` command + `GetDeleteProgramPreview` query + yeni `timetable.delete` izni + 2 uç. Frontend: paylaşılan `Modal` shell üzerine `DeleteScheduleModal` + Hub `RowMenu` ve editör `EditorMoreMenu` tetikleyicileri.

**Tech Stack:** .NET 10 · MediatR · EF Core 10 · xUnit + FluentAssertions + NSubstitute + MockQueryable · React 18 + TS · React Query v5 · Vitest + Testing Library · i18next.

**Tasarım kaynağı:** `.claude/plans/2026-06-14-ders-programi-programi-sil-design.md` + handoff `schedule_more_actions.jsx` `DeleteScheduleModal`.

**Çalışma dizinleri:** Backend `oksis-api/`, Frontend `oksis-web/`.

---

## Önemli pattern notları (uygulamadan önce oku)

- Domain event API'si **`Raise(evt)`** (AggregateRoot), `AddDomainEvent` değil.
- Command/Query record'larında izin **`[Tenancy(TenancyMode.Required)]` + `[RequirePermission("...")]`**; controller'da sadece `[Authorize]`.
- Handler primary-ctor: `(IApplicationDbContext db, ITenantContext tenant, ...)`. `Result<T>.Forbidden()/.NotFound()/.Conflict(code)/.Success(...)` (namespace `Oksis.Shared`).
- Controller endpoint: `var result = await sender.Send(...); return result.ToHttpResult(HttpContext);` (envelope + status otomatik).
- Soft-delete: `db.X.Remove(entity)` → `SoftDeleteInterceptor` → `IsDeleted=true`. `ScheduleVersion`/`ScheduleException` `TenantEntity` (soft-deletable). `LessonPlacement` owned child → program `Remove`'unda EF cascade ile **hard-delete** olur; ayrıca domain `Delete()` `is_active=false` yapar (açık niyet + savunma). Bu davranışın net sonucu **Task 5 integration testiyle** doğrulanır.
- Frontend Modal: paylaşılan `src/shared/components/modal/Modal.tsx` (`iconTone="danger"` mevcut). `DeleteScheduleModal` `.stu` kapsamı içinde mount edilmeli (token cascade) — `NewProgramModal` gibi.
- `react-router` (NOT `react-router-dom`).
- i18n namespace kökü `timetable`.

---

# BÖLÜM A — BACKEND (oksis-api)

## Task 1: `ScheduleProgramDeletedEvent` + `ScheduleProgram.Delete()`

**Files:**
- Create: `src/Oksis.Domain/Modules/Timetable/Events/ScheduleProgramDeletedEvent.cs`
- Modify: `src/Oksis.Domain/Modules/Timetable/Entities/ScheduleProgram.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Timetable/ScheduleProgramDeleteTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Oksis.Domain.UnitTests/Modules/Timetable/ScheduleProgramDeleteTests.cs
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.Events;
using Oksis.Domain.Modules.Timetable.ValueObjects;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Timetable;

public sealed class ScheduleProgramDeleteTests
{
    private static ScheduleProgram NewProgram() =>
        ScheduleProgram.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

    [Fact]
    public void Delete_deactivates_all_active_placements()
    {
        var p = NewProgram();
        p.Place(new TimeSlot(DayOfWeek.Monday, 1), Guid.NewGuid(), Guid.NewGuid(), null);
        p.Place(new TimeSlot(DayOfWeek.Tuesday, 2), Guid.NewGuid(), Guid.NewGuid(), null);

        p.Delete();

        Assert.Empty(p.ActivePlacements);
    }

    [Fact]
    public void Delete_raises_deleted_event()
    {
        var p = NewProgram();
        p.Place(new TimeSlot(DayOfWeek.Monday, 1), Guid.NewGuid(), Guid.NewGuid(), null);

        p.Delete();

        var evt = Assert.IsType<ScheduleProgramDeletedEvent>(
            Assert.Single(p.DomainEvents, e => e is ScheduleProgramDeletedEvent));
        Assert.Equal(p.Id, evt.ProgramId);
        Assert.Equal(p.BranchId, evt.BranchId);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~ScheduleProgramDeleteTests"`
Expected: FAIL — `ScheduleProgramDeletedEvent` ve `Delete()` yok (compile error).

- [ ] **Step 3a: Create the event**

```csharp
// src/Oksis.Domain/Modules/Timetable/Events/ScheduleProgramDeletedEvent.cs
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Timetable.Events;

/// <summary>Ders programı silindiğinde (soft-delete) tetiklenen domain olayı.
/// Bildirim dağıtımı Faz 2.6'da bağlanır (Debt).</summary>
public sealed record ScheduleProgramDeletedEvent(
    Guid SchoolId,
    Guid ProgramId,
    Guid BranchId,
    int Version) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
```

- [ ] **Step 3b: Add `Delete()` to the aggregate** (`SetBlock` metodundan SONRA, `ActivePlacement` private helper'ından ÖNCE ekle)

```csharp
    /// <summary>Programı siler: tüm aktif yerleşimleri pasifleştirir (filtreli unique index'ler
    /// <c>WHERE is_active=1</c> üzerinde olduğundan slotları serbest bırakmak için zorunlu) ve
    /// silme olayını üretir. Aggregate'in kendi soft-delete'i (IsDeleted) application katmanında
    /// <c>db.Remove</c> ile yapılır.</summary>
    public void Delete()
    {
        foreach (var active in ActivePlacements.ToList())
        {
            active.Deactivate();
        }

        Raise(new ScheduleProgramDeletedEvent(SchoolId, Id, BranchId, Version));
    }
```

> `LessonPlacement.Deactivate()` `internal` — aynı assembly olduğu için erişilebilir (RestoreFrom de kullanıyor).

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~ScheduleProgramDeleteTests"`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
cd oksis-api && git add -A && git commit -m "2026-06-14 feat,test: ScheduleProgram.Delete() domain davranışı + ScheduleProgramDeletedEvent."
```

---

## Task 2: `timetable.delete` izni — seed (3 dosya) + migration

**Files:**
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/MasterSeedIds.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/PermissionSeedData.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/RolePermissionSeedData.cs`
- Create (generated): migration `*_20260614_add_timetable_delete_permission.cs`

- [ ] **Step 1: Add the permission GUID** (`MasterSeedIds.cs`, `TimetableOverride` satırından sonra)

```csharp
        public static Guid TimetableDelete { get; } = SeedGuid.From("perm:timetable.delete");
```

- [ ] **Step 2: Add the permission definition** (`PermissionSeedData.cs`, `TimetableOverride` Row'undan sonra)

```csharp
        Row(MasterSeedIds.Permissions.TimetableDelete, "TIMETABLE", "DELETE", "timetable.delete", "Ders programını sil (taslak veya yayında)"),
```

- [ ] **Step 3: Assign to admin roles** (`RolePermissionSeedData.cs`, `TimetableOverride` yield'inden sonra)

```csharp
        yield return MasterSeedIds.Permissions.TimetableDelete;
```

- [ ] **Step 4: Generate the migration**

Run:
```bash
cd oksis-api && dotnet ef migrations add 20260614_add_timetable_delete_permission \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Expected: yeni migration dosyası oluşur; `Up()` içinde `identity.permissions`'a `timetable.delete` satırı + `identity.role_permissions`'a admin rolleri için satırlar (InsertData), `Down()` DeleteData. (GUID'ler `SeedGuid`'den deterministik üretilir — elle yazma.)

- [ ] **Step 5: Build to verify**

Run: `cd oksis-api && dotnet build Oksis.slnx --no-restore`
Expected: temiz (0 error).

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add -A && git commit -m "2026-06-14 feat: timetable.delete izni — seed (3 dosya) + migration. (spec §8 dışı, onaylı sapma)"
```

---

## Task 3: `GetDeleteProgramPreview` query + handler + DTO

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/DTOs/DeleteProgramPreviewDto.cs`
- Create: `src/Oksis.Application/Modules/Timetable/Queries/GetDeleteProgramPreview/GetDeleteProgramPreviewQuery.cs`
- Create: `src/Oksis.Application/Modules/Timetable/Queries/GetDeleteProgramPreview/GetDeleteProgramPreviewQueryHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/GetDeleteProgramPreviewTests.cs`

- [ ] **Step 1: Write the DTO**

```csharp
// src/Oksis.Application/Modules/Timetable/DTOs/DeleteProgramPreviewDto.cs
namespace Oksis.Application.Modules.Timetable.DTOs;

/// <summary>Silme onay diyaloğu etki kutuları. VersionCount + TeacherCount gerçek;
/// StudentCount/ParentCount şimdilik 0 (Debt-BE-1, publish-preview ile aynı borç).</summary>
public sealed record DeleteProgramPreviewDto(
    string Status,
    int Version,
    int VersionCount,
    int TeacherCount,
    int StudentCount,
    int ParentCount);
```

- [ ] **Step 2: Write the failing test**

```csharp
// tests/Oksis.Application.UnitTests/Modules/Timetable/GetDeleteProgramPreviewTests.cs
using FluentAssertions;
using MockQueryable.NSubstitute;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Timetable.Queries.GetDeleteProgramPreview;
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.ValueObjects;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Timetable;

public sealed class GetDeleteProgramPreviewTests
{
    private static readonly Guid SchoolId = Guid.NewGuid();

    [Fact(DisplayName = "Preview: teacher/version sayısı gerçek, student/parent 0")]
    public async Task Returns_real_teacher_and_version_counts()
    {
        var program = ScheduleProgram.Create(SchoolId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        var teacherA = Guid.NewGuid();
        program.Place(new TimeSlot(DayOfWeek.Monday, 1), Guid.NewGuid(), teacherA, null);
        program.Place(new TimeSlot(DayOfWeek.Tuesday, 2), Guid.NewGuid(), teacherA, null); // aynı öğretmen
        program.Place(new TimeSlot(DayOfWeek.Wednesday, 3), Guid.NewGuid(), Guid.NewGuid(), null);

        var v1 = ScheduleVersion.Create(program, 1, "{}", 3, Guid.NewGuid(), DateTimeOffset.UtcNow, null);

        var db = Substitute.For<IApplicationDbContext>();
        var programs = new[] { program }.AsQueryable().BuildMockDbSet();
        var versions = new[] { v1 }.AsQueryable().BuildMockDbSet();
        db.SchedulePrograms.Returns(programs);
        db.ScheduleVersions.Returns(versions);
        var tenant = Substitute.For<ITenantContext>();
        tenant.CurrentSchoolId.Returns(SchoolId);

        var handler = new GetDeleteProgramPreviewQueryHandler(db, tenant);
        var result = await handler.Handle(new GetDeleteProgramPreviewQuery(program.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.TeacherCount.Should().Be(2);
        result.Value.VersionCount.Should().Be(1);
        result.Value.StudentCount.Should().Be(0);
        result.Value.ParentCount.Should().Be(0);
    }

    [Fact(DisplayName = "Preview: program yoksa NotFound")]
    public async Task Returns_notfound_when_program_missing()
    {
        var db = Substitute.For<IApplicationDbContext>();
        db.SchedulePrograms.Returns(Array.Empty<ScheduleProgram>().AsQueryable().BuildMockDbSet());
        db.ScheduleVersions.Returns(Array.Empty<ScheduleVersion>().AsQueryable().BuildMockDbSet());
        var tenant = Substitute.For<ITenantContext>();
        tenant.CurrentSchoolId.Returns(SchoolId);

        var handler = new GetDeleteProgramPreviewQueryHandler(db, tenant);
        var result = await handler.Handle(new GetDeleteProgramPreviewQuery(Guid.NewGuid()), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Error.NotFound");
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetDeleteProgramPreviewTests"`
Expected: FAIL — query/handler yok (compile error).

- [ ] **Step 4: Write the query + handler**

```csharp
// src/Oksis.Application/Modules/Timetable/Queries/GetDeleteProgramPreview/GetDeleteProgramPreviewQuery.cs
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Queries.GetDeleteProgramPreview;

[Tenancy(TenancyMode.Required)]
[RequirePermission("timetable.delete")]
public sealed record GetDeleteProgramPreviewQuery(Guid ProgramId) : IQuery<DeleteProgramPreviewDto>;
```

```csharp
// src/Oksis.Application/Modules/Timetable/Queries/GetDeleteProgramPreview/GetDeleteProgramPreviewQueryHandler.cs
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Timetable.Queries.GetDeleteProgramPreview;

public sealed class GetDeleteProgramPreviewQueryHandler(IApplicationDbContext db, ITenantContext tenant)
    : IQueryHandler<GetDeleteProgramPreviewQuery, DeleteProgramPreviewDto>
{
    public async Task<Result<DeleteProgramPreviewDto>> Handle(
        GetDeleteProgramPreviewQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result<DeleteProgramPreviewDto>.Forbidden();
        }

        var program = await db.SchedulePrograms
            .AsNoTracking()
            .Include(p => p.Placements)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId, cancellationToken);
        if (program is null)
        {
            return Result<DeleteProgramPreviewDto>.NotFound();
        }

        var versionCount = await db.ScheduleVersions
            .AsNoTracking()
            .CountAsync(v => v.ProgramId == request.ProgramId, cancellationToken);

        var teacherCount = program.ActivePlacements.Select(p => p.TeacherId).Distinct().Count();

        return Result<DeleteProgramPreviewDto>.Success(new DeleteProgramPreviewDto(
            program.Status.ToString(),
            program.Version,
            versionCount,
            teacherCount,
            StudentCount: 0,
            ParentCount: 0));
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetDeleteProgramPreviewTests"`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add -A && git commit -m "2026-06-14 feat,test: GetDeleteProgramPreview query — sürüm+öğretmen sayısı (öğrenci/veli Debt-BE-1=0)."
```

---

## Task 4: `DeleteScheduleProgram` command + handler (occupancy release)

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/DTOs/DeleteProgramResultDto.cs`
- Create: `src/Oksis.Application/Modules/Timetable/Commands/DeleteScheduleProgram/DeleteScheduleProgramCommand.cs`
- Create: `src/Oksis.Application/Modules/Timetable/Commands/DeleteScheduleProgram/DeleteScheduleProgramCommandHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/DeleteScheduleProgramTests.cs`

- [ ] **Step 1: Write the result DTO**

```csharp
// src/Oksis.Application/Modules/Timetable/DTOs/DeleteProgramResultDto.cs
namespace Oksis.Application.Modules.Timetable.DTOs;

public sealed record DeleteProgramResultDto(Guid ProgramId, Guid BranchId);
```

- [ ] **Step 2: Write the failing test**

```csharp
// tests/Oksis.Application.UnitTests/Modules/Timetable/DeleteScheduleProgramTests.cs
using FluentAssertions;
using MockQueryable.NSubstitute;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Timetable.Commands.DeleteScheduleProgram;
using Oksis.Application.Modules.Timetable.Ports;
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.ValueObjects;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Timetable;

public sealed class DeleteScheduleProgramTests
{
    private static readonly Guid SchoolId = Guid.NewGuid();

    [Fact(DisplayName = "Delete: program/versions/exceptions kaldırılır, occupancy release edilir")]
    public async Task Deletes_program_and_releases_occupancy()
    {
        var program = ScheduleProgram.Create(SchoolId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        var teacher = Guid.NewGuid();
        program.Place(new TimeSlot(DayOfWeek.Monday, 1), Guid.NewGuid(), teacher, null);

        var version = ScheduleVersion.Create(program, 1, "{}", 1, Guid.NewGuid(), DateTimeOffset.UtcNow, null);

        var db = Substitute.For<IApplicationDbContext>();
        var programs = new[] { program }.AsQueryable().BuildMockDbSet();
        var versions = new[] { version }.AsQueryable().BuildMockDbSet();
        var exceptions = Array.Empty<ScheduleException>().AsQueryable().BuildMockDbSet();
        db.SchedulePrograms.Returns(programs);
        db.ScheduleVersions.Returns(versions);
        db.ScheduleExceptions.Returns(exceptions);
        var tenant = Substitute.For<ITenantContext>();
        tenant.CurrentSchoolId.Returns(SchoolId);
        var occupancy = Substitute.For<IOccupancyIndex>();

        var handler = new DeleteScheduleProgramCommandHandler(db, tenant, occupancy);
        var result = await handler.Handle(new DeleteScheduleProgramCommand(program.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.ProgramId.Should().Be(program.Id);
        programs.Received(1).Remove(program);
        versions.Received(1).RemoveRange(Arg.Any<IEnumerable<ScheduleVersion>>());
        await db.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
        await occupancy.Received(1).ReleaseAsync(
            SchoolId, program.AcademicTermId, teacher, null, DayOfWeek.Monday, 1, Arg.Any<CancellationToken>());
    }

    [Fact(DisplayName = "Delete: program yoksa NotFound")]
    public async Task Returns_notfound_when_program_missing()
    {
        var db = Substitute.For<IApplicationDbContext>();
        db.SchedulePrograms.Returns(Array.Empty<ScheduleProgram>().AsQueryable().BuildMockDbSet());
        db.ScheduleVersions.Returns(Array.Empty<ScheduleVersion>().AsQueryable().BuildMockDbSet());
        db.ScheduleExceptions.Returns(Array.Empty<ScheduleException>().AsQueryable().BuildMockDbSet());
        var tenant = Substitute.For<ITenantContext>();
        tenant.CurrentSchoolId.Returns(SchoolId);

        var handler = new DeleteScheduleProgramCommandHandler(db, tenant, Substitute.For<IOccupancyIndex>());
        var result = await handler.Handle(new DeleteScheduleProgramCommand(Guid.NewGuid()), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("Error.NotFound");
    }
}
```

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~DeleteScheduleProgramTests"`
Expected: FAIL — command/handler yok (compile error).

- [ ] **Step 4: Write the command + handler**

```csharp
// src/Oksis.Application/Modules/Timetable/Commands/DeleteScheduleProgram/DeleteScheduleProgramCommand.cs
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Commands.DeleteScheduleProgram;

/// <summary>Bir ders programını soft-delete eder: aktif yerleşimleri pasifler, sürüm
/// snapshot'larını ve aktif istisnaları kaldırır, occupancy index'i temizler. Aynı
/// sınıf+döneme yeni program açılabilir (filtreli unique index serbest kalır).</summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("timetable.delete")]
public sealed record DeleteScheduleProgramCommand(Guid ProgramId) : ICommand<DeleteProgramResultDto>;
```

```csharp
// src/Oksis.Application/Modules/Timetable/Commands/DeleteScheduleProgram/DeleteScheduleProgramCommandHandler.cs
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;
using Oksis.Application.Modules.Timetable.Ports;
using Oksis.Shared;

namespace Oksis.Application.Modules.Timetable.Commands.DeleteScheduleProgram;

public sealed class DeleteScheduleProgramCommandHandler(
    IApplicationDbContext db, ITenantContext tenant, IOccupancyIndex occupancy)
    : ICommandHandler<DeleteScheduleProgramCommand, DeleteProgramResultDto>
{
    public async Task<Result<DeleteProgramResultDto>> Handle(
        DeleteScheduleProgramCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result<DeleteProgramResultDto>.Forbidden();
        }

        var program = await db.SchedulePrograms
            .Include(p => p.Placements)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId, cancellationToken);
        if (program is null)
        {
            return Result<DeleteProgramResultDto>.NotFound();
        }

        // Occupancy release için aktif slotları silmeden ÖNCE yakala.
        var releases = program.ActivePlacements
            .Select(p => (p.TeacherId, p.RoomId, p.Day, p.Period))
            .ToList();
        var schoolId = program.SchoolId;
        var termId = program.AcademicTermId;
        var branchId = program.BranchId;

        program.Delete();

        var versions = await db.ScheduleVersions
            .Where(v => v.ProgramId == request.ProgramId)
            .ToListAsync(cancellationToken);
        db.ScheduleVersions.RemoveRange(versions);

        var exceptions = await db.ScheduleExceptions
            .Where(e => e.ProgramId == request.ProgramId)
            .ToListAsync(cancellationToken);
        db.ScheduleExceptions.RemoveRange(exceptions);

        db.SchedulePrograms.Remove(program); // SoftDeleteInterceptor → IsDeleted=true

        await db.SaveChangesAsync(cancellationToken);

        // Kaynak doğruluk DB; occupancy (Redis) hız katmanını da temizle (D5).
        foreach (var (teacherId, roomId, day, period) in releases)
        {
            await occupancy.ReleaseAsync(schoolId, termId, teacherId, roomId, day, period, cancellationToken);
        }

        return Result<DeleteProgramResultDto>.Success(new DeleteProgramResultDto(program.Id, branchId));
    }
}
```

> `LessonPlacement.Day`/`.Period` mevcut (SetBlock kullanıyor). `roomId` `Guid?`.

- [ ] **Step 5: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~DeleteScheduleProgramTests"`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add -A && git commit -m "2026-06-14 feat,test: DeleteScheduleProgram command — soft-delete + versions/exceptions + occupancy release."
```

---

## Task 5: Controller endpoints + integration test (yeniden oluşturulabilirlik)

**Files:**
- Modify: `src/Oksis.Api/Controllers/V1/SchedulingController.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Modules/Timetable/DeleteScheduleProgramIntegrationTests.cs`

- [ ] **Step 1: Add the two endpoints** (`SchedulingController.cs` — `RestoreVersionAsync` metodundan SONRA, sınıf kapanış `}`'den önce)

```csharp
    // ── Programı sil (B-2) — izin: timetable.delete ──
    [HttpGet("programs/{id:guid}/delete-preview")]
    [ProducesResponseType(typeof(ApiResponse<DeleteProgramPreviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePreviewAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDeleteProgramPreviewQuery(id), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }

    [HttpDelete("programs/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<DeleteProgramResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProgramAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteScheduleProgramCommand(id), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

Ayrıca dosyanın başına using ekle:
```csharp
using Oksis.Application.Modules.Timetable.Commands.DeleteScheduleProgram;
using Oksis.Application.Modules.Timetable.Queries.GetDeleteProgramPreview;
```

- [ ] **Step 2: Write the failing integration test** (mevcut timetable integration test dosyalarındaki fixture/kurulum desenini birebir izle — gerçek SQL Server/EF; `WebApplicationFactory` veya proje fixture'ı)

```csharp
// tests/Oksis.Infrastructure.IntegrationTests/Modules/Timetable/DeleteScheduleProgramIntegrationTests.cs
// NOT: Bu projedeki MEVCUT timetable integration test dosyasının (filtreli unique index testi —
// completion_status'ta geçen) kurulum/fixture desenini AYNEN kullan (DbContext oluşturma, tenant,
// SaveChanges). Aşağıdaki gövde o desene uyarlanmalı.
//
// Senaryo: 9-A/term programı kur + yayınla (1 öğretmen Pazartesi-1) → sil →
//   (a) aynı school/term/branch'e yeni ScheduleProgram + aynı slot eklenebilir (unique index serbest),
//   (b) aynı öğretmen aynı slotta yeni programda kullanılabilir.
//
// Assert: DeleteScheduleProgramCommand sonrası, yeni program.Place(...) + SaveChanges DbUpdateException
// FIRLATMAZ; eski program db'de IsDeleted=true (IgnoreQueryFilters ile doğrulanır).
```

- [ ] **Step 3: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~DeleteScheduleProgramIntegrationTests"`
Expected: FAIL (önce derleme/senaryo kurulana kadar). Bu test **soft-delete + owned cascade davranışının** end-to-end doğrulayıcısıdır: silinen programın yerleşimleri (owned, cascade hard-delete) + `is_active=0` ile unique index serbest kalmalı.

- [ ] **Step 4: Implement test body & run to verify it passes**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~DeleteScheduleProgramIntegrationTests"`
Expected: PASS. Eğer EF owned-cascade ile `program.Delete()`'in `Deactivate` (Modified) durumu çakışıp hata verirse: `Delete()`'ten `Deactivate` döngüsünü kaldırıp yalnız event'e indir (cascade hard-delete zaten slotları serbest bırakır) ve Task 1 testini buna göre güncelle. Test yeşil olana dek bu karar burada kesinleşir.

- [ ] **Step 5: Full backend gate**

Run: `cd oksis-api && dotnet build Oksis.slnx --no-restore && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~Timetable" && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~Timetable" && dotnet test tests/Oksis.Tests --filter "FullyQualifiedName~RequirePermissionSeedCoverage"`
Expected: hepsi yeşil. Seed coverage testi `timetable.delete`'in seed'li olduğunu doğrular (Task 2 eksikse kırmızı).

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add -A && git commit -m "2026-06-14 feat,test: Sil uçları (DELETE /programs/{id} + delete-preview) + yeniden-oluşturulabilirlik integration testi."
```

---

# BÖLÜM B — FRONTEND (oksis-web)

## Task 6: Types + API wrappers + api test

**Files:**
- Modify: `src/portals/admin/timetable/types.ts`
- Modify: `src/portals/admin/timetable/api/timetableApi.ts`
- Test: `src/portals/admin/timetable/api/__tests__/deleteApi.test.ts`

- [ ] **Step 1: Add types** (`types.ts` sonuna)

```ts
// ── Programı Sil (B-2) ──

/** `GET /programs/:id/delete-preview` yanıtı. */
export interface DeleteProgramPreviewDto {
  status: ScheduleProgramStatus;
  version: number;
  versionCount: number;
  teacherCount: number;
  studentCount: number;
  parentCount: number;
}

/** `DELETE /programs/:id` yanıtı. */
export interface DeleteProgramResultDto {
  programId: string;
  branchId: string;
}
```

- [ ] **Step 2: Write the failing api test**

```ts
// src/portals/admin/timetable/api/__tests__/deleteApi.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../../../../shared/api/httpClient";
import { timetableApi } from "../timetableApi";

vi.mock("../../../../../shared/api/httpClient", () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

describe("timetableApi delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getDeletePreview GETs the delete-preview route and unwraps", async () => {
    (httpClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { data: { status: "Published", version: 4, versionCount: 4, teacherCount: 11, studentCount: 0, parentCount: 0 } },
    });
    const res = await timetableApi.getDeletePreview("p1");
    expect(httpClient.get).toHaveBeenCalledWith("/timetable/programs/p1/delete-preview", { signal: undefined });
    expect(res.versionCount).toBe(4);
  });

  it("deleteProgram DELETEs the program route", async () => {
    (httpClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { data: { programId: "p1", branchId: "b1" } },
    });
    const res = await timetableApi.deleteProgram("p1");
    expect(httpClient.delete).toHaveBeenCalledWith("/timetable/programs/p1");
    expect(res.branchId).toBe("b1");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/api/__tests__/deleteApi.test.ts`
Expected: FAIL — `getDeletePreview`/`deleteProgram` yok.

- [ ] **Step 4: Add wrappers** (`timetableApi.ts` — `restoreVersion`'dan sonra; ayrıca type import satırına `DeleteProgramPreviewDto, DeleteProgramResultDto` ekle)

```ts
  getDeletePreview: async (
    programId: string,
    signal?: AbortSignal,
  ): Promise<DeleteProgramPreviewDto> => {
    const res = await httpClient.get<ApiEnvelope<DeleteProgramPreviewDto>>(
      `/timetable/programs/${programId}/delete-preview`,
      { signal },
    );
    return res.data.data;
  },

  deleteProgram: async (programId: string): Promise<DeleteProgramResultDto> => {
    const res = await httpClient.delete<ApiEnvelope<DeleteProgramResultDto>>(
      `/timetable/programs/${programId}`,
    );
    return res.data.data;
  },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/api/__tests__/deleteApi.test.ts`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-14 feat,test: timetable Sil API wrapper'ları (getDeletePreview, deleteProgram) + tipler."
```

---

## Task 7: i18n — Sil anahtarları (tr/en)

**Files:**
- Modify: `src/shared/i18n/locales/tr/timetable.json`
- Modify: `src/shared/i18n/locales/en/timetable.json`

- [ ] **Step 1: Add `rowMenu.delete` + `delete` block (TR)** (`rowMenu` bloğuna `delete` ekle; `versions` bloğunun yanına `delete` bloğu ekle)

`rowMenu` içine:
```json
      "delete": "Programı Sil"
```
Yeni blok (örn. `versions`'tan sonra, virgülle):
```json
    "delete": {
      "title": "Programı Sil",
      "subDraft": "{{name}} · v{{version}} · taslak",
      "subLive": "{{name}} · v{{version}} · yayında bir sürüm var",
      "warnDraftTitle": "Bu işlem geri alınamaz",
      "warnDraftBody": "Bu taslak ve içindeki yerleşim kalıcı olarak silinir. Yayında bir sürüm olmadığı için kimse etkilenmez.",
      "warnLiveTitle": "Bu programın yayında bir sürümü var",
      "warnLiveBody": "{{name}} programının yayındaki sürümü yoklama, öğretmen ve veli ekranlarını besliyor. Silmek bu taslağı, yayını ve tüm sürüm geçmişini kaldırır — sınıf programsız kalır.",
      "impactVersions": "Sürüm",
      "impactStudents": "Öğrenci",
      "impactTeachers": "Öğretmen",
      "impactParents": "Veli",
      "ackDraft": "Bu taslağın kalıcı olarak silineceğini ve geri alınamayacağını anlıyorum.",
      "ackLive": "Yoklama kayıtlarının bu çizelgeye bağlı olduğunu ve silindikten sonra geri yüklenemeyeceğini anlıyorum.",
      "confirmLabel": "Onaylamak için sınıf adını yazın: {{name}}",
      "cancel": "Vazgeç",
      "submit": "Kalıcı Olarak Sil",
      "deleting": "Siliniyor",
      "deleted": "{{name}} programı silindi.",
      "failed": "Program silinemedi."
    }
```

- [ ] **Step 2: Add EN equivalents** (`en/timetable.json`)

`rowMenu` içine:
```json
      "delete": "Delete Schedule"
```
Yeni blok:
```json
    "delete": {
      "title": "Delete Schedule",
      "subDraft": "{{name}} · v{{version}} · draft",
      "subLive": "{{name}} · v{{version}} · has a published version",
      "warnDraftTitle": "This action cannot be undone",
      "warnDraftBody": "This draft and its placements are permanently deleted. No published version exists, so no one is affected.",
      "warnLiveTitle": "This schedule has a published version",
      "warnLiveBody": "The published version of {{name}} feeds attendance, teacher and parent screens. Deleting removes this draft, the published version and all version history — the class is left without a schedule.",
      "impactVersions": "Versions",
      "impactStudents": "Students",
      "impactTeachers": "Teachers",
      "impactParents": "Parents",
      "ackDraft": "I understand this draft will be permanently deleted and cannot be undone.",
      "ackLive": "I understand attendance records depend on this schedule and cannot be restored after deletion.",
      "confirmLabel": "Type the class name to confirm: {{name}}",
      "cancel": "Cancel",
      "submit": "Delete Permanently",
      "deleting": "Deleting",
      "deleted": "Schedule {{name}} deleted.",
      "failed": "Could not delete the schedule."
    }
```

- [ ] **Step 3: Verify JSON validity & build**

Run: `cd oksis-web && node -e "require('./src/shared/i18n/locales/tr/timetable.json');require('./src/shared/i18n/locales/en/timetable.json');console.log('ok')"`
Expected: `ok` (geçerli JSON, virgüller doğru).

- [ ] **Step 4: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-14 feat: timetable.delete i18n anahtarları (tr/en) + rowMenu.delete."
```

---

## Task 8: `DeleteScheduleModal` + CSS + test

**Files:**
- Create: `src/portals/admin/timetable/components/DeleteScheduleModal.tsx`
- Modify: `src/portals/admin/timetable/timetable.css` (`.del-*` kuralları)
- Test: `src/portals/admin/timetable/components/__tests__/DeleteScheduleModal.test.tsx`

- [ ] **Step 1: Port the CSS** (`timetable.css` sonuna ekle — handoff `schedule_more_actions.css`'ten)

```css
.del-warn { display: flex; gap: 13px; padding: 14px; border-radius: 13px; background: var(--warning-bg); border: 1px solid color-mix(in srgb, var(--warning) 22%, transparent); }
.del-warn.hard { background: var(--danger-bg); border-color: color-mix(in srgb, var(--danger) 24%, transparent); }
.del-warn-ic { width: 40px; height: 40px; border-radius: 11px; background: #fff; color: var(--warning); display: grid; place-items: center; flex-shrink: 0; }
.del-warn.hard .del-warn-ic { color: var(--danger); }
.del-warn-tx .t { font-size: 14.5px; font-weight: 800; color: var(--text); }
.del-warn.hard .del-warn-tx .t { color: #7A1515; }
.del-warn-tx .s { font-size: 12.5px; color: var(--text-body); line-height: 1.5; margin-top: 4px; }
.del-impact { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 14px; }
.del-impact .box { background: var(--surface); border: 1px solid var(--line-soft); border-radius: 11px; padding: 11px 8px; text-align: center; }
.del-impact .box .v { font-size: 19px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.del-impact .box .l { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
.del-ack { display: flex; align-items: flex-start; gap: 10px; width: 100%; text-align: left; margin-top: 14px; padding: 11px 13px; border-radius: 11px; border: 1.5px solid var(--line); background: var(--bg-elev); transition: var(--t-fast); }
.del-ack:hover { border-color: color-mix(in srgb, var(--danger) 40%, var(--line)); }
.del-ack.on { border-color: var(--danger); background: var(--danger-bg); }
.del-ack .cb { width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--line); display: grid; place-items: center; color: #fff; flex-shrink: 0; margin-top: 1px; transition: var(--t-fast); }
.del-ack .cb svg { opacity: 0; }
.del-ack.on .cb { background: var(--danger); border-color: var(--danger); }
.del-ack.on .cb svg { opacity: 1; }
.del-ack > span { font-size: 12.5px; color: var(--text-body); line-height: 1.5; }
.del-inp { font-variant-numeric: tabular-nums; }
.del-inp.bad { border-color: var(--danger); box-shadow: 0 0 0 3px var(--danger-bg); }
.del-inp.ok { border-color: var(--success); box-shadow: 0 0 0 3px var(--success-bg); }
```

- [ ] **Step 2: Write the failing test**

```tsx
// src/portals/admin/timetable/components/__tests__/DeleteScheduleModal.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import "../../../../../shared/i18n";

vi.mock("../../../../../shared/store/authStore", () => ({
  useAuthStore: (sel: (s: { user: { schoolId: string } }) => unknown) =>
    sel({ user: { schoolId: "school1" } }),
}));

const getDeletePreview = vi.fn();
const deleteProgram = vi.fn();
vi.mock("../../api/timetableApi", () => ({
  timetableApi: {
    getDeletePreview: (...a: unknown[]) => getDeletePreview(...a),
    deleteProgram: (...a: unknown[]) => deleteProgram(...a),
  },
}));

import { DeleteScheduleModal } from "../DeleteScheduleModal";

function wrap({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  getDeletePreview.mockReset().mockResolvedValue({
    status: "Published", version: 4, versionCount: 4, teacherCount: 11, studentCount: 0, parentCount: 0,
  });
  deleteProgram.mockReset().mockResolvedValue({ programId: "p1", branchId: "b1" });
});

const base = { programId: "p1", className: "9-A", onClose: vi.fn(), onDeleted: vi.fn() };

describe("DeleteScheduleModal", () => {
  it("taslak: yalnız onay kutusu → sil butonu aktifleşir", () => {
    render(<DeleteScheduleModal {...base} status="Draft" version={1} />, { wrapper: wrap });
    const submit = screen.getByRole("button", { name: /Kalıcı Olarak Sil/ });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByText(/kalıcı olarak silineceğini/));
    expect(submit).not.toBeDisabled();
  });

  it("yayında: onay kutusu + doğru ad yazımı gerekir", async () => {
    render(<DeleteScheduleModal {...base} status="Published" version={4} />, { wrapper: wrap });
    const submit = screen.getByRole("button", { name: /Kalıcı Olarak Sil/ });
    fireEvent.click(screen.getByText(/geri yüklenemeyeceğini/));
    expect(submit).toBeDisabled(); // ad henüz yazılmadı
    fireEvent.change(screen.getByPlaceholderText("9-A"), { target: { value: "9-A" } });
    expect(submit).not.toBeDisabled();
  });

  it("sil → deleteProgram çağrılır ve onDeleted tetiklenir", async () => {
    const onDeleted = vi.fn();
    render(<DeleteScheduleModal {...base} onDeleted={onDeleted} status="Draft" version={1} />, { wrapper: wrap });
    fireEvent.click(screen.getByText(/kalıcı olarak silineceğini/));
    fireEvent.click(screen.getByRole("button", { name: /Kalıcı Olarak Sil/ }));
    await waitFor(() => expect(deleteProgram).toHaveBeenCalledWith("p1"));
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/components/__tests__/DeleteScheduleModal.test.tsx`
Expected: FAIL — bileşen yok.

- [ ] **Step 4: Write the component**

```tsx
// src/portals/admin/timetable/components/DeleteScheduleModal.tsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Check, Trash2 } from "lucide-react";
import { Modal } from "../../../../shared/components/modal/Modal";
import { tenantScopedKey } from "../../../../shared/config/tenant";
import { useAuthStore } from "../../../../shared/store/authStore";
import { cn } from "../../../../lib/utils";
import { timetableApi } from "../api/timetableApi";
import { timetableKeys } from "../keys/timetableKeys";
import type { ScheduleProgramStatus } from "../types";

interface Props {
  programId: string;
  className: string;
  status: ScheduleProgramStatus;
  version: number;
  onClose: () => void;
  /** Silme başarıyla tamamlandı (Hub: refetch; editör: Hub'a yönlendir). */
  onDeleted: () => void;
}

/**
 * Programı Sil onay diyaloğu (handoff DeleteScheduleModal). İki kademeli teyit:
 * taslak (yayında sürüm yok) → yalnız onay kutusu; yayında → onay kutusu + etki kutuları
 * (delete-preview) + sınıf adını yazarak teyit. Soft-delete; UI'da geri alma yok.
 */
export function DeleteScheduleModal({ programId, className, status, version, onClose, onDeleted }: Props) {
  const { t } = useTranslation("timetable");
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const queryClient = useQueryClient();

  const live = status !== "Draft";
  const [typed, setTyped] = useState("");
  const [ack, setAck] = useState(false);

  const preview = useQuery({
    queryKey: tenantScopedKey(schoolId, ["timetable", "delete-preview", programId]),
    queryFn: ({ signal }) => timetableApi.getDeletePreview(programId, signal),
    enabled: Boolean(schoolId) && live,
  });

  const del = useMutation({
    mutationFn: () => timetableApi.deleteProgram(programId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timetableKeys.all(schoolId) });
      onDeleted();
    },
  });

  const nameOk = typed.trim() === className;
  const ready = ack && (!live || nameOk) && !del.isPending;

  return (
    <Modal
      icon={Trash2}
      iconTone="danger"
      title={t("delete.title")}
      sub={live
        ? t("delete.subLive", { name: className, version })
        : t("delete.subDraft", { name: className, version })}
      onClose={del.isPending ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={del.isPending}>
            {t("delete.cancel")}
          </button>
          <div className="spacer" />
          <button
            type="button"
            className={cn("btn btn-danger", !ready && "disabled")}
            disabled={!ready}
            onClick={() => del.mutate()}
          >
            {del.isPending ? <span className="btn-spin" /> : <Trash2 size={16} />}{" "}
            {del.isPending ? t("delete.deleting") : t("delete.submit")}
          </button>
        </>
      }
    >
      <div className={cn("del-warn", live && "hard")}>
        <div className="del-warn-ic"><AlertTriangle size={20} /></div>
        <div className="del-warn-tx">
          <div className="t">{live ? t("delete.warnLiveTitle") : t("delete.warnDraftTitle")}</div>
          <div className="s">
            {live ? t("delete.warnLiveBody", { name: className }) : t("delete.warnDraftBody")}
          </div>
        </div>
      </div>

      {live && (
        <div className="del-impact">
          <div className="box"><div className="v">{preview.data?.versionCount ?? "–"}</div><div className="l">{t("delete.impactVersions")}</div></div>
          <div className="box"><div className="v">{preview.data?.studentCount ?? "–"}</div><div className="l">{t("delete.impactStudents")}</div></div>
          <div className="box"><div className="v">{preview.data?.teacherCount ?? "–"}</div><div className="l">{t("delete.impactTeachers")}</div></div>
          <div className="box"><div className="v">{preview.data?.parentCount ?? "–"}</div><div className="l">{t("delete.impactParents")}</div></div>
        </div>
      )}

      <button type="button" className={cn("del-ack", ack && "on")} onClick={() => setAck((v) => !v)}>
        <span className="cb"><Check size={13} strokeWidth={3} /></span>
        <span>{live ? t("delete.ackLive") : t("delete.ackDraft")}</span>
      </button>

      {live && (
        <div className="fld" style={{ marginTop: 14 }}>
          <div className="fld-l">{t("delete.confirmLabel", { name: className })}</div>
          <input
            className={cn("inp del-inp", typed && !nameOk && "bad", nameOk && "ok")}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={className}
          />
        </div>
      )}

      {del.isError && <div className="fld-hint" style={{ marginTop: 10, color: "var(--danger)" }}>{t("delete.failed")}</div>}
    </Modal>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/components/__tests__/DeleteScheduleModal.test.tsx`
Expected: PASS (3 test).

- [ ] **Step 6: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-14 feat,test: DeleteScheduleModal (iki kademeli teyit) + .del-* CSS port."
```

---

## Task 9: Hub tetikleyici — RowMenu danger + ClassProgramsTable + ScheduleHubPage

**Files:**
- Modify: `src/portals/admin/timetable/components/RowMenu.tsx`
- Modify: `src/portals/admin/timetable/components/ClassProgramsTable.tsx`
- Modify: `src/portals/admin/timetable/ScheduleHubPage.tsx`
- Modify: `src/portals/admin/timetable/timetable.css` (`.rmenu-item.danger`)
- Test: `src/portals/admin/timetable/__tests__/RowMenu.test.tsx` (mevcut testi genişlet)

- [ ] **Step 1: Extend RowMenu** (`RowMenu.tsx`)

`import` satırına `Trash2` ekle:
```tsx
import { MoreHorizontal, PencilRuler, UploadCloud, History, Trash2, type LucideIcon } from "lucide-react";
```
`IconName` + `ICONS`:
```tsx
type IconName = "open" | "publish" | "history" | "delete";
const ICONS: Record<IconName, LucideIcon> = {
  open: PencilRuler,
  publish: UploadCloud,
  history: History,
  delete: Trash2,
};
```
`RowMenuItem`'a `danger`:
```tsx
export interface RowMenuItem {
  key: string;
  icon: IconName;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  separatorBefore?: boolean;
  danger?: boolean;
}
```
`className`'e danger ekle (mevcut `cn("rmenu-item", it.disabled && "disabled")` → ):
```tsx
                      className={cn("rmenu-item", it.disabled && "disabled", it.danger && "danger")}
```

- [ ] **Step 2: Add danger CSS** (`timetable.css`)

```css
.rmenu-item.danger { color: var(--danger); }
.rmenu-item.danger:hover { background: var(--danger-bg); }
```

- [ ] **Step 3: Wire ClassProgramsTable** — `onOpenHistory` deseninin yanına `onDelete` ekle.

Props interface'ine ekle: `onDelete: (row: ProgramRowVM) => void;`. Satır menüsü `items` dizisine (history item'ından sonra) ekle:
```tsx
            {
              key: "delete",
              icon: "delete",
              label: t("rowMenu.delete"),
              danger: true,
              separatorBefore: true,
              onClick: () => onDelete(row),
            },
```
> `t` zaten `useTranslation("timetable")` ile mevcut; değilse mevcut desene göre ekle. `RowMenu`'ya `items` aktaran çağrıya yeni item dahil olur.

- [ ] **Step 4: Wire ScheduleHubPage**

State (mevcut `historyRow` yanına):
```tsx
  const [deleteRow, setDeleteRow] = useState<ProgramRowVM | null>(null);
```
`ClassProgramsTable`'a prop:
```tsx
              onDelete={setDeleteRow}
```
Conditional render (mevcut `historyRow` bloğunun yanına; import ekle `import { DeleteScheduleModal } from "./components/DeleteScheduleModal";`):
```tsx
      {deleteRow && (
        <DeleteScheduleModal
          programId={deleteRow.id}
          className={deleteRow.className}
          status={deleteRow.status}
          version={deleteRow.version}
          onClose={() => setDeleteRow(null)}
          onDeleted={() => {
            setDeleteRow(null);
            void hub.refetch();
          }}
        />
      )}
```

- [ ] **Step 5: Extend RowMenu test** (`RowMenu.test.tsx`)

```tsx
  it("danger öğe danger sınıfıyla render edilir ve onClick çağırır", () => {
    const onDelete = vi.fn();
    render(
      <RowMenu items={[{ key: "delete", icon: "delete", label: "Programı Sil", danger: true, onClick: onDelete }]} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Daha fazla" }));
    const item = screen.getByText("Programı Sil").closest("button")!;
    expect(item.className).toContain("danger");
    fireEvent.click(item);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
```

- [ ] **Step 6: Run tests**

Run: `cd oksis-web && npx vitest run src/portals/admin/timetable/__tests__/RowMenu.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-14 feat,test: Hub RowMenu Programı Sil (danger) + DeleteScheduleModal mount."
```

---

## Task 10: Editör tetikleyici — EditorMoreMenu + EditorToolbar + ScheduleEditorPage

**Files:**
- Modify: `src/portals/admin/timetable/editor/components/EditorMoreMenu.tsx`
- Modify: `src/portals/admin/timetable/editor/components/EditorToolbar.tsx`
- Modify: `src/portals/admin/timetable/ScheduleEditorPage.tsx`

- [ ] **Step 1: Add delete item to EditorMoreMenu**

`import`'a `Trash2`:
```tsx
import { MoreHorizontal, History, Trash2 } from "lucide-react";
```
Props:
```tsx
interface Props {
  onOpenHistory: () => void;
  onDelete: () => void;
}
export function EditorMoreMenu({ onOpenHistory, onDelete }: Props) {
```
`Popover.Content` içine (History item'ından SONRA) ekle:
```tsx
          <button
            type="button"
            className="sed-cmenu-item danger"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 size={15} /> {t("rowMenu.delete")}
          </button>
```
CSS (`editor.css`'e ekle):
```css
.sed-cmenu-item.danger { color: var(--danger); }
.sed-cmenu-item.danger:hover { background: var(--danger-bg); }
```

- [ ] **Step 2: Thread `onDelete` through EditorToolbar**

Props'a ekle: `onDelete: () => void;`. Destructure'a `onDelete` ekle. `<EditorMoreMenu onOpenHistory={onOpenHistory} />` → `<EditorMoreMenu onOpenHistory={onOpenHistory} onDelete={onDelete} />`.

- [ ] **Step 3: Wire ScheduleEditorPage**

`import` ekle:
```tsx
import { useNavigate } from "react-router";
import { DeleteScheduleModal } from "./components/DeleteScheduleModal";
```
State + navigate (mevcut `historyOpen` yanına):
```tsx
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
```
`EditorToolbar`'a prop:
```tsx
        onDelete={() => setDeleteOpen(true)}
```
Conditional render (mevcut `historyOpen` bloğunun yanına; `data.status`/`data.version` null guard'lı):
```tsx
      {deleteOpen && data.status !== null && data.version !== null && (
        <DeleteScheduleModal
          programId={id}
          className={data.className}
          status={data.status}
          version={data.version}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => navigate("/admin/schedule")}
        />
      )}
```

- [ ] **Step 4: Build + full web test gate**

Run: `cd oksis-web && npm run build && npx vitest run src/portals/admin/timetable`
Expected: build temiz; tüm timetable testleri yeşil.

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "2026-06-14 feat: Editör ⋯ menüsüne Programı Sil + silmede Hub'a yönlendirme."
```

---

## Task 11: Dokümantasyon + final gate

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md`
- Modify: `.claude/docs/modules/timetable/permissions.md` (yeni `timetable.delete` izni)
- Modify: `.claude/docs/permission-matrix.md` (workspace root — yeni izin)

- [ ] **Step 1: Update completion_status.md**

- Üstteki ilerleme/`Güncel` tarihini güncelle (2026-06-14).
- `✅ Tamamlanan Yapılar`'a "Programı Sil (B-2)" özeti ekle (BE: `Delete()` + command/preview + 2 uç + `timetable.delete` izni; FE: `DeleteScheduleModal` + Hub/editör tetikleyiciler; occupancy release; test sayıları).
- `⚠️ Spec Dışına Çıkılanlar`'a ekle:
  - `2026-06-14 · timetable.delete izni (spec §8 dışı): §8 izin listesi "değişmez" sayar; silme için yeni timetable.delete tanımlandı + seed + migration. Onay: kullanıcı.`
- `⏳ Eksik / Bekleyen`'e Debt ekle:
  - `Debt-BE-8 (silme bildirimi): ScheduleProgramDeletedEvent fırlatılır; dağıtım Faz 2.6 (K0.5).`
  - Silme etki sayısında öğrenci/veli `0` → mevcut Debt-BE-1 kapsamı (not düş).

- [ ] **Step 2: Update permissions.md + permission-matrix.md**

`timetable.delete` iznini ekle (kod, açıklama, admin rolleri). permission-matrix.md'de TIMETABLE satırına `delete` sütunu/işareti.

- [ ] **Step 3: Full final gate (her iki repo)**

Run:
```bash
cd oksis-api && dotnet build Oksis.slnx --no-restore && dotnet test --filter "FullyQualifiedName~Timetable|FullyQualifiedName~RequirePermissionSeedCoverage"
cd ../oksis-web && npm run build && npm run test
```
Expected: backend build + timetable/seed testleri yeşil; web build temiz + tam vitest paketi yeşil.

- [ ] **Step 4: Commit (docs — workspace root repo)**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs && git commit -m "2026-06-14 docs: Programı Sil (B-2) tamam — completion_status + permissions (timetable.delete §8 sapması) + Debt-BE-8."
```

---

## Self-Review (plan ↔ spec/design)

- **Soft-delete + indeks serbestliği** → Task 1 (`Delete()` deactivate) + Task 5 (integration: yeniden oluşturulabilirlik). ✔
- **delete-preview (öğretmen+sürüm gerçek, öğrenci/veli 0)** → Task 3. ✔
- **timetable.delete izni + seed + migration + coverage** → Task 2 + Task 5 Step 5. ✔
- **occupancy release (D5)** → Task 4 handler + test. ✔
- **iki kademeli teyit (taslak/yayında)** → Task 8. ✔
- **Hub + editör tetikleyiciler; editörden Hub'a yönlendirme** → Task 9, Task 10. ✔
- **i18n tr/en** → Task 7. ✔
- **completion_status + §8 sapma + Debt** → Task 11. ✔
- **Tip tutarlılığı:** `DeleteProgramPreviewDto`/`DeleteProgramResultDto` (BE record ↔ FE interface) alan adları camelCase eşleşir; `deleteProgram(id)`/`getDeletePreview(id)` Task 6/8'de tutarlı. ✔
- **Açık risk:** EF owned-cascade ↔ `Delete()` deactivate etkileşimi Task 5 Step 4'te kesinleşir (gerekirse `Delete()` event-only'e indirilir). Plan bu kararı integration testiyle bağlar.
