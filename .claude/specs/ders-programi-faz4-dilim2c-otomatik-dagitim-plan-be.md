# Adil Otomatik Nöbet Dağıtımı (Faz 4 / Dilim 2c) — Backend Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut nöbet çizelgesine (Duties modülü) "öner≠uygula" desenli adil otomatik dağıtım solver'ı ekler — admin tetikler, Hangfire çözer, sonuç `DutyRoster` Draft'ına uygulanır.

**Architecture:** Faz 3 ders-programı autogen (`ScheduleGenerationJob` + `IScheduleSolver` + Hangfire + enqueue/status/apply) deseninin birebir Duties karşılığı. Saf `IDutySolver` (deterministik açgözlü, kapsama-HARD + adalet-SOFT), `DutyDistributionJob` entity, 3 CQRS slice, 1 Hangfire job, 3 endpoint. Yeni aggregate/izin yok — sonuç mevcut `DutyRoster.CreateDraft/Assign/AssignReliever` üzerinden Draft'a yazılır.

**Tech Stack:** .NET 10, MediatR (CQRS), EF Core 10 (`[academic]` şema, filtreli index), Hangfire (SQL Server storage), FluentValidation, Mapster, xUnit + FluentAssertions (test).

## Global Constraints

- **Bağlayıcı spec:** `.claude/specs/ders-programi-faz4-dilim2c-otomatik-dagitim-design.md` — kararlar `K-2c-1..10`. Aykırılıkta dur, madde no ile bildir (CLAUDE.md Absolute Rule #6).
- **Çok-kiracılık asla bypass edilmez.** Her sorgu/job/cache `SchoolId` ile scoped; Hangfire job `tenantContext.SetForLoginFlow(schoolId)` çağırır; `IgnoreQueryFilters()` yok.
- **Domain naming:** `Mark`=not, `Grade`=sınıf seviyesi — karıştırma. Duties'te `DutyAssignment` = (öğretmen×gün×bölge).
- **Yasaklar:** AutoMapper (Mapster kullan) · repository pattern (EF doğrudan `IApplicationDbContext`) · lazy loading · `async void`/`.Result`/`.Wait()` · hardcoded Türkçe (i18n key/hata kodu) · prod'da auto-migrate.
- **İzin:** Yeni izin yok → tüm uçlar `duties.manage`. Komut/sorgular `[Tenancy(TenancyMode.Required)]` + `[RequirePermission("duties.manage")]`.
- **Solver determinizmi (K-2c-10):** RNG yok; tie-break `teacherId`/`locationId` ile sabit. Aynı girdi → aynı çıktı.
- **Commit formatı:** `YYYY-MM-DD <type>: Türkçe özet.` (ISO tarih + Türkçe). Tarihi `date +%F` ile al.
- **Pre-commit:** `dotnet format` + `dotnet build Oksis.slnx --no-restore` temiz olmalı.
- **Çalışma dizini:** `oksis-api/`. Test: `dotnet test tests/Oksis.Domain.UnitTests` / `tests/Oksis.Application.UnitTests` / `tests/Oksis.Infrastructure.IntegrationTests`.

---

## Dosya Yapısı (oluşturulacak / değiştirilecek)

**Domain (`src/Oksis.Domain/Modules/Duties/`):**
- Create `Entities/DutyDistributionJob.cs` — job aggregate (Faz 3 `ScheduleGenerationJob` simetrisi)
- Create `Enums/DutyDistributionStatus.cs` — Queued/Running/Done/NoSolution/Failed
- Create `Enums/DutyDistributionMode.cs` — FromScratch/FillEmpty

**Application (`src/Oksis.Application/Modules/Duties/`):**
- Create `AutoDistribute/Solver/DutySolverContracts.cs` — `IDutySolver`, input/output records
- Create `AutoDistribute/Solver/DutyFeasibility.cs` — hard kısıtlar
- Create `AutoDistribute/Solver/DutyFairnessScorer.cs` — soft puanlama
- Create `AutoDistribute/Solver/DutySolver.cs` — orkestrasyon
- Create `AutoDistribute/IAutoDistributeDutyEnqueuer.cs` — port
- Create `Commands/EnqueueAutoDistributeDuty/{Command,Handler,Validator}.cs`
- Create `Commands/ApplyAutoDistributeDuty/{Command,Handler}.cs`
- Create `Queries/GetAutoDistributeDutyStatus/{Query,Handler,Dto}.cs`
- Modify `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` — `DbSet<DutyDistributionJob>`

**Infrastructure (`src/Oksis.Infrastructure/`):**
- Modify `Persistence/OksisDbContext.cs` — DbSet
- Create `Persistence/Configurations/Duties/DutyDistributionJobConfiguration.cs`
- Create migration `Persistence/Migrations/<ts>_<date>_add_duty_distribution_jobs.cs` (CLI ile)
- Create `BackgroundJobs/Jobs/AutoDistributeDutyJob.cs`
- Create `Duties/HangfireAutoDistributeDutyEnqueuer.cs`
- Modify DI registration (enqueuer + solver) — `DependencyInjection.cs` (Application + Infrastructure)

**Api (`src/Oksis.Api/Controllers/V1/DutiesController.cs`):**
- Modify — 3 endpoint + request body record'ları

**Tests:**
- Create `tests/Oksis.Domain.UnitTests/Modules/Duties/DutyDistributionJobTests.cs`
- Create `tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutyFeasibilityTests.cs`
- Create `.../DutyFairnessScorerTests.cs`
- Create `.../DutySolverTests.cs`
- Create `.../EnqueueAutoDistributeDutyValidatorTests.cs`
- Create `.../ApplyAutoDistributeDutyHandlerTests.cs`
- Create `tests/Oksis.Infrastructure.IntegrationTests/Duties/DutyDistributionApplyTests.cs`

---

### Task 1: `DutyDistributionJob` domain entity + enums

**Files:**
- Create: `src/Oksis.Domain/Modules/Duties/Enums/DutyDistributionStatus.cs`
- Create: `src/Oksis.Domain/Modules/Duties/Enums/DutyDistributionMode.cs`
- Create: `src/Oksis.Domain/Modules/Duties/Entities/DutyDistributionJob.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Duties/DutyDistributionJobTests.cs`

**Interfaces:**
- Produces: `DutyDistributionJob` with factory `Create(Guid academicYearId, Guid academicTermId, DutyDistributionMode mode)`, state methods `Start()`, `CompleteWithResult(string resultJson, DateTimeOffset at)`, `MarkNoSolution(string resultJson, string hintsJson, DateTimeOffset at)`, `Fail(string reason, DateTimeOffset at)`; properties `AcademicYearId`, `AcademicTermId`, `Mode`, `Status`, `ResultJson?`, `HintsJson?`, `FailureReason?`, `CompletedAt?`. Inherits `TenantEntity` (Id + SchoolId + audit). Enums `DutyDistributionStatus { Queued=0, Running=1, Done=2, NoSolution=3, Failed=4 }`, `DutyDistributionMode { FromScratch=0, FillEmpty=1 }`.

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Oksis.Domain.UnitTests/Modules/Duties/DutyDistributionJobTests.cs
using FluentAssertions;
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Duties;

public sealed class DutyDistributionJobTests
{
    private static DutyDistributionJob NewJob() =>
        DutyDistributionJob.Create(Guid.NewGuid(), Guid.NewGuid(), DutyDistributionMode.FromScratch);

    [Fact]
    public void Create_starts_in_Queued_with_mode()
    {
        var job = NewJob();
        job.Status.Should().Be(DutyDistributionStatus.Queued);
        job.Mode.Should().Be(DutyDistributionMode.FromScratch);
        job.ResultJson.Should().BeNull();
    }

    [Fact]
    public void Start_moves_to_Running()
    {
        var job = NewJob();
        job.Start();
        job.Status.Should().Be(DutyDistributionStatus.Running);
    }

    [Fact]
    public void CompleteWithResult_stores_json_and_timestamp()
    {
        var job = NewJob();
        job.Start();
        var at = DateTimeOffset.UnixEpoch;
        job.CompleteWithResult("{\"x\":1}", at);
        job.Status.Should().Be(DutyDistributionStatus.Done);
        job.ResultJson.Should().Be("{\"x\":1}");
        job.CompletedAt.Should().Be(at);
    }

    [Fact]
    public void MarkNoSolution_stores_result_and_hints()
    {
        var job = NewJob();
        job.Start();
        job.MarkNoSolution("{\"a\":1}", "[\"not-enough-teachers\"]", DateTimeOffset.UnixEpoch);
        job.Status.Should().Be(DutyDistributionStatus.NoSolution);
        job.HintsJson.Should().Be("[\"not-enough-teachers\"]");
    }

    [Fact]
    public void Fail_stores_reason()
    {
        var job = NewJob();
        job.Fail("boom", DateTimeOffset.UnixEpoch);
        job.Status.Should().Be(DutyDistributionStatus.Failed);
        job.FailureReason.Should().Be("boom");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyDistributionJobTests"`
Expected: FAIL — `DutyDistributionJob` / enums tipleri yok (derleme hatası).

- [ ] **Step 3: Write the enums and entity**

```csharp
// src/Oksis.Domain/Modules/Duties/Enums/DutyDistributionStatus.cs
namespace Oksis.Domain.Modules.Duties.Enums;

public enum DutyDistributionStatus
{
    Queued = 0,
    Running = 1,
    Done = 2,
    NoSolution = 3,
    Failed = 4,
}
```

```csharp
// src/Oksis.Domain/Modules/Duties/Enums/DutyDistributionMode.cs
namespace Oksis.Domain.Modules.Duties.Enums;

public enum DutyDistributionMode
{
    FromScratch = 0,
    FillEmpty = 1,
}
```

```csharp
// src/Oksis.Domain/Modules/Duties/Entities/DutyDistributionJob.cs
using Oksis.Domain.Common; // TenantEntity base (match ScheduleGenerationJob's base namespace)
using Oksis.Domain.Modules.Duties.Enums;

namespace Oksis.Domain.Modules.Duties.Entities;

public sealed class DutyDistributionJob : TenantEntity
{
    private DutyDistributionJob() { } // EF

    private DutyDistributionJob(Guid academicYearId, Guid academicTermId, DutyDistributionMode mode)
    {
        AcademicYearId = academicYearId;
        AcademicTermId = academicTermId;
        Mode = mode;
        Status = DutyDistributionStatus.Queued;
    }

    public Guid AcademicYearId { get; private set; }
    public Guid AcademicTermId { get; private set; }
    public DutyDistributionMode Mode { get; private set; }
    public DutyDistributionStatus Status { get; private set; }
    public string? ResultJson { get; private set; }
    public string? HintsJson { get; private set; }
    public string? FailureReason { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }

    public static DutyDistributionJob Create(Guid academicYearId, Guid academicTermId, DutyDistributionMode mode)
        => new(academicYearId, academicTermId, mode);

    public void Start() => Status = DutyDistributionStatus.Running;

    public void CompleteWithResult(string resultJson, DateTimeOffset at)
    {
        Status = DutyDistributionStatus.Done;
        ResultJson = resultJson;
        CompletedAt = at;
    }

    public void MarkNoSolution(string resultJson, string hintsJson, DateTimeOffset at)
    {
        Status = DutyDistributionStatus.NoSolution;
        ResultJson = resultJson;
        HintsJson = hintsJson;
        CompletedAt = at;
    }

    public void Fail(string reason, DateTimeOffset at)
    {
        Status = DutyDistributionStatus.Failed;
        FailureReason = reason;
        CompletedAt = at;
    }
}
```

> **NOT:** `TenantEntity` taban sınıfının tam namespace'ini doğrula — `src/Oksis.Domain/Modules/Timetable/Entities/ScheduleGenerationJob.cs` aynı tabanı kullanıyor; oradaki `using` satırını birebir kopyala. `Id`/`SchoolId`/audit alanları tabandan gelir.

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~DutyDistributionJobTests"`
Expected: PASS (5 test).

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Domain/Modules/Duties/Enums/DutyDistributionStatus.cs \
        src/Oksis.Domain/Modules/Duties/Enums/DutyDistributionMode.cs \
        src/Oksis.Domain/Modules/Duties/Entities/DutyDistributionJob.cs \
        tests/Oksis.Domain.UnitTests/Modules/Duties/DutyDistributionJobTests.cs
git commit -m "$D feat,test: Nöbet otomatik dağıtım job entity'si (DutyDistributionJob) + durum geçişleri eklendi."
```

---

### Task 2: EF config + DbSet kaydı + migration

**Files:**
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` (DbSet ekle)
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (DbSet ekle)
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Duties/DutyDistributionJobConfiguration.cs`
- Create (CLI): migration `<ts>_<date>_add_duty_distribution_jobs.cs`

**Interfaces:**
- Consumes: `DutyDistributionJob` (Task 1).
- Produces: `IApplicationDbContext.DutyDistributionJobs` `DbSet`; `[academic].duty_distribution_jobs` tablosu (Status/Mode int, ResultJson/HintsJson nvarchar(max), index `(SchoolId, AcademicTermId, CreatedAt)` filtered `is_deleted=0`).

- [ ] **Step 1: Add DbSet to the context interface**

`IApplicationDbContext.cs` içinde mevcut Duties DbSet'lerinin (`DutyRosters` vb.) yanına ekle:

```csharp
DbSet<DutyDistributionJob> DutyDistributionJobs { get; }
```

(Dosya başına `using Oksis.Domain.Modules.Duties.Entities;` zaten var; yoksa ekle.)

- [ ] **Step 2: Add DbSet to OksisDbContext**

`OksisDbContext.cs`:

```csharp
public DbSet<DutyDistributionJob> DutyDistributionJobs => Set<DutyDistributionJob>();
```

- [ ] **Step 3: Write EF configuration**

`ScheduleGenerationJobConfiguration.cs`'i model al:

```csharp
// src/Oksis.Infrastructure/Persistence/Configurations/Duties/DutyDistributionJobConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Duties.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Duties;

public sealed class DutyDistributionJobConfiguration : IEntityTypeConfiguration<DutyDistributionJob>
{
    public void Configure(EntityTypeBuilder<DutyDistributionJob> builder)
    {
        builder.ToAcademicTable("duty_distribution_jobs"); // mevcut helper; ScheduleGenerationJobConfiguration ile aynı
        builder.Property(j => j.Status).HasConversion<int>();
        builder.Property(j => j.Mode).HasConversion<int>();
        builder.Property(j => j.ResultJson);
        builder.Property(j => j.HintsJson);
        builder.Property(j => j.FailureReason).HasMaxLength(1024);
        builder.HasIndex(j => new { j.SchoolId, j.AcademicTermId, j.CreatedAt })
            .HasFilter("[is_deleted] = 0");
    }
}
```

> `ToAcademicTable` helper'ın imzasını `ScheduleGenerationJobConfiguration.cs`'ten doğrula (audit + rowversion + soft-delete kolonlarını taban config otomatik ekliyorsa onu izle).

- [ ] **Step 4: Build to verify config compiles**

Run: `dotnet build Oksis.slnx --no-restore`
Expected: PASS (0 hata).

- [ ] **Step 5: Generate migration**

Run:
```bash
dotnet ef migrations add $(date +%Y%m%d)_add_duty_distribution_jobs \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Expected: Yeni migration dosyası oluşur; `duty_distribution_jobs` tablosu `academic` şemasında. Migration'ı aç ve tek tablo + index içerdiğini doğrula (başka model değişikliği sızmamalı).

- [ ] **Step 6: Build**

Run: `dotnet build Oksis.slnx --no-restore`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs \
        src/Oksis.Infrastructure/Persistence/OksisDbContext.cs \
        src/Oksis.Infrastructure/Persistence/Configurations/Duties/DutyDistributionJobConfiguration.cs \
        src/Oksis.Infrastructure/Persistence/Migrations/
git commit -m "$D feat: duty_distribution_jobs tablosu + EF config + migration eklendi."
```

---

### Task 3: Solver kontratları (`IDutySolver` + input/output)

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutySolverContracts.cs`
- Test: (kontrat-only; testi Task 5-7 kullanır — bu task'ta ayrı test yok, derleme yeterli)

**Interfaces:**
- Produces (sonraki tüm solver task'ları bunları tüketir):

```
IDutySolver { DutySolveResult Solve(DutySolveInput input); }

DutyLocationSlot(Guid LocationId, int Capacity)
DutySolveInput(
  IReadOnlyList<DutyLocationSlot> Locations,
  IReadOnlyList<DayOfWeek> Days,
  IReadOnlyList<Guid> TeacherPool,
  int WeeklyTargetDays,                                 // 1 (OncePerWeek) | 2 (TwicePerWeek)
  DutyDayPattern DayPattern,
  bool RelieverEnabled,
  IReadOnlySet<(Guid TeacherId, DayOfWeek Day)> UnavailableDays,   // HARD (K-2c-6)
  IReadOnlySet<(Guid TeacherId, DayOfWeek Day)> DislikedDays,      // SOFT
  IReadOnlySet<(Guid TeacherId, DayOfWeek Day)> RelieverBusyDays,  // yancı yapamaz (ders/nöbet öğle penceresi)
  DutyDistributionMode Mode,
  IReadOnlyList<DutyPlannedAssignment> Pinned)          // FillEmpty'de korunan mevcut atamalar

DutyPlannedAssignment(Guid TeacherId, DayOfWeek Day, Guid LocationId, Guid? RelieverId)
DutyMissingCell(DayOfWeek Day, Guid LocationId)
DutyTeacherLoad(Guid TeacherId, int DutyCount, int RelieverCount)
DutyDistributionMetrics(int Assigned, int Missing, int MinLoad, int MaxLoad, double LoadVariance,
                        IReadOnlyList<DutyTeacherLoad> PerTeacher)
DutyRelaxationHint(string Code)   // "not-enough-teachers" | "capacity-too-high" | "too-many-exemptions" | "availability-too-restrictive"
DutySolveResult(IReadOnlyList<DutyPlannedAssignment> Assignments,
                IReadOnlyList<DutyMissingCell> Missing,
                DutyDistributionMetrics Metrics,
                IReadOnlyList<DutyRelaxationHint> Hints,
                bool NoSolution)
```

- [ ] **Step 1: Write the contracts file**

```csharp
// src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutySolverContracts.cs
using Oksis.Domain.Modules.Duties.Enums;

namespace Oksis.Application.Modules.Duties.AutoDistribute.Solver;

public sealed record DutyLocationSlot(Guid LocationId, int Capacity);

public sealed record DutyPlannedAssignment(Guid TeacherId, DayOfWeek Day, Guid LocationId, Guid? RelieverId);

public sealed record DutyMissingCell(DayOfWeek Day, Guid LocationId);

public sealed record DutyTeacherLoad(Guid TeacherId, int DutyCount, int RelieverCount);

public sealed record DutyDistributionMetrics(
    int Assigned,
    int Missing,
    int MinLoad,
    int MaxLoad,
    double LoadVariance,
    IReadOnlyList<DutyTeacherLoad> PerTeacher);

public sealed record DutyRelaxationHint(string Code);

public sealed record DutySolveInput(
    IReadOnlyList<DutyLocationSlot> Locations,
    IReadOnlyList<DayOfWeek> Days,
    IReadOnlyList<Guid> TeacherPool,
    int WeeklyTargetDays,
    DutyDayPattern DayPattern,
    bool RelieverEnabled,
    IReadOnlySet<(Guid TeacherId, DayOfWeek Day)> UnavailableDays,
    IReadOnlySet<(Guid TeacherId, DayOfWeek Day)> DislikedDays,
    IReadOnlySet<(Guid TeacherId, DayOfWeek Day)> RelieverBusyDays,
    DutyDistributionMode Mode,
    IReadOnlyList<DutyPlannedAssignment> Pinned);

public sealed record DutySolveResult(
    IReadOnlyList<DutyPlannedAssignment> Assignments,
    IReadOnlyList<DutyMissingCell> Missing,
    DutyDistributionMetrics Metrics,
    IReadOnlyList<DutyRelaxationHint> Hints,
    bool NoSolution);

public interface IDutySolver
{
    DutySolveResult Solve(DutySolveInput input);
}
```

- [ ] **Step 2: Build**

Run: `dotnet build src/Oksis.Application --no-restore`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutySolverContracts.cs
git commit -m "$D feat: nöbet solver kontratları (IDutySolver + girdi/çıktı kayıtları) eklendi."
```

---

### Task 4: `DutyFeasibility` — hard kısıtlar

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutyFeasibility.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutyFeasibilityTests.cs`

**Interfaces:**
- Consumes: `DutySolveInput` tipleri (Task 3).
- Produces:
  - `DutyFeasibilityState` mutable sayaç tutucu: `Create(input)`; sets `TeacherDayUsed` (öğretmen×gün), `CellCount` (gün×bölge→atanan sayı), `CellTeachers` (gün×bölge→öğretmen set).
  - `static bool DutyFeasibility.CanAssignDuty(Guid teacherId, DayOfWeek day, DutyLocationSlot loc, DutySolveInput input, DutyFeasibilityState state)` — INV-D2 gün-tekilliği + kapasite tavanı (K-2c-2) + Unavailable gün (K-2c-6). (Muafiyet havuz dışı tutulduğu için burada kontrol edilmez — K-2c-7 havuzu zaten elemiş olur.)
  - `static bool DutyFeasibility.CanRelieve(Guid relieverId, Guid dutyTeacherId, DayOfWeek day, DutySolveInput input, DutyFeasibilityState state)` — INV-D4 (≠nöbetçi, o gün meşgul değil, o gün başka nöbeti yok).

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutyFeasibilityTests.cs
using FluentAssertions;
using Oksis.Application.Modules.Duties.AutoDistribute.Solver;
using Oksis.Domain.Modules.Duties.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Duties.AutoDistribute;

public sealed class DutyFeasibilityTests
{
    private static readonly Guid Loc = Guid.NewGuid();
    private static readonly Guid T1 = Guid.NewGuid();
    private static readonly Guid T2 = Guid.NewGuid();

    private static DutySolveInput Input(
        int capacity = 2,
        IReadOnlySet<(Guid, DayOfWeek)>? unavailable = null,
        IReadOnlySet<(Guid, DayOfWeek)>? relieverBusy = null) =>
        new(
            Locations: [new DutyLocationSlot(Loc, capacity)],
            Days: [DayOfWeek.Monday],
            TeacherPool: [T1, T2],
            WeeklyTargetDays: 1,
            DayPattern: DutyDayPattern.Spread,
            RelieverEnabled: true,
            UnavailableDays: unavailable ?? new HashSet<(Guid, DayOfWeek)>(),
            DislikedDays: new HashSet<(Guid, DayOfWeek)>(),
            RelieverBusyDays: relieverBusy ?? new HashSet<(Guid, DayOfWeek)>(),
            Mode: DutyDistributionMode.FromScratch,
            Pinned: []);

    [Fact]
    public void CanAssignDuty_true_for_empty_cell()
    {
        var input = Input();
        var state = DutyFeasibilityState.Create(input);
        DutyFeasibility.CanAssignDuty(T1, DayOfWeek.Monday, input.Locations[0], input, state)
            .Should().BeTrue();
    }

    [Fact]
    public void CanAssignDuty_false_when_teacher_already_on_duty_that_day()
    {
        var input = Input();
        var state = DutyFeasibilityState.Create(input);
        state.RecordDuty(T1, DayOfWeek.Monday, Loc);
        // INV-D2: same teacher, same day, any location
        DutyFeasibility.CanAssignDuty(T1, DayOfWeek.Monday, input.Locations[0], input, state)
            .Should().BeFalse();
    }

    [Fact]
    public void CanAssignDuty_false_when_capacity_reached()
    {
        var input = Input(capacity: 1);
        var state = DutyFeasibilityState.Create(input);
        state.RecordDuty(T2, DayOfWeek.Monday, Loc);
        DutyFeasibility.CanAssignDuty(T1, DayOfWeek.Monday, input.Locations[0], input, state)
            .Should().BeFalse();
    }

    [Fact]
    public void CanAssignDuty_false_when_unavailable_that_day()
    {
        var input = Input(unavailable: new HashSet<(Guid, DayOfWeek)> { (T1, DayOfWeek.Monday) });
        var state = DutyFeasibilityState.Create(input);
        DutyFeasibility.CanAssignDuty(T1, DayOfWeek.Monday, input.Locations[0], input, state)
            .Should().BeFalse();
    }

    [Fact]
    public void CanRelieve_false_when_same_as_duty_teacher()
    {
        var input = Input();
        var state = DutyFeasibilityState.Create(input);
        DutyFeasibility.CanRelieve(T1, dutyTeacherId: T1, DayOfWeek.Monday, input, state)
            .Should().BeFalse();
    }

    [Fact]
    public void CanRelieve_false_when_reliever_busy_at_lunch()
    {
        var input = Input(relieverBusy: new HashSet<(Guid, DayOfWeek)> { (T2, DayOfWeek.Monday) });
        var state = DutyFeasibilityState.Create(input);
        DutyFeasibility.CanRelieve(T2, dutyTeacherId: T1, DayOfWeek.Monday, input, state)
            .Should().BeFalse();
    }

    [Fact]
    public void CanRelieve_false_when_reliever_on_duty_same_day()
    {
        var input = Input();
        var state = DutyFeasibilityState.Create(input);
        state.RecordDuty(T2, DayOfWeek.Monday, Loc);
        DutyFeasibility.CanRelieve(T2, dutyTeacherId: T1, DayOfWeek.Monday, input, state)
            .Should().BeFalse();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~DutyFeasibilityTests"`
Expected: FAIL — `DutyFeasibility`/`DutyFeasibilityState` yok.

- [ ] **Step 3: Write the implementation**

```csharp
// src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutyFeasibility.cs
namespace Oksis.Application.Modules.Duties.AutoDistribute.Solver;

public sealed class DutyFeasibilityState
{
    private readonly HashSet<(Guid Teacher, DayOfWeek Day)> _teacherDayUsed = [];
    private readonly Dictionary<(DayOfWeek Day, Guid Loc), int> _cellCount = [];

    public static DutyFeasibilityState Create(DutySolveInput input)
    {
        var state = new DutyFeasibilityState();
        // FillEmpty: pinned atamalar occupancy + yük olarak sayılır
        foreach (var p in input.Pinned)
            state.RecordDuty(p.TeacherId, p.Day, p.LocationId);
        return state;
    }

    public void RecordDuty(Guid teacherId, DayOfWeek day, Guid locationId)
    {
        _teacherDayUsed.Add((teacherId, day));
        _cellCount[(day, locationId)] = CellCount(day, locationId) + 1;
    }

    public bool TeacherUsedOnDay(Guid teacherId, DayOfWeek day) => _teacherDayUsed.Contains((teacherId, day));

    public int CellCount(DayOfWeek day, Guid locationId) =>
        _cellCount.TryGetValue((day, locationId), out var n) ? n : 0;
}

public static class DutyFeasibility
{
    public static bool CanAssignDuty(
        Guid teacherId, DayOfWeek day, DutyLocationSlot loc, DutySolveInput input, DutyFeasibilityState state)
    {
        if (input.UnavailableDays.Contains((teacherId, day))) return false; // K-2c-6 HARD
        if (state.TeacherUsedOnDay(teacherId, day)) return false;           // INV-D2
        if (state.CellCount(day, loc.LocationId) >= loc.Capacity) return false; // K-2c-2 tavan
        return true;
    }

    public static bool CanRelieve(
        Guid relieverId, Guid dutyTeacherId, DayOfWeek day, DutySolveInput input, DutyFeasibilityState state)
    {
        if (relieverId == dutyTeacherId) return false;                       // INV-D4
        if (input.RelieverBusyDays.Contains((relieverId, day))) return false; // öğle penceresi meşgul
        if (state.TeacherUsedOnDay(relieverId, day)) return false;           // o gün kendi nöbeti var
        return true;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~DutyFeasibilityTests"`
Expected: PASS (7 test).

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutyFeasibility.cs \
        tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutyFeasibilityTests.cs
git commit -m "$D feat,test: nöbet solver hard kısıtları (DutyFeasibility: gün-tekilliği/kapasite/müsaitlik/yancı) eklendi."
```

---

### Task 5: `DutyFairnessScorer` — soft puanlama

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutyFairnessScorer.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutyFairnessScorerTests.cs`

**Interfaces:**
- Consumes: `DutyPlannedAssignment`, `DutySolveInput`, `DutyDistributionMetrics`, `DutyTeacherLoad` (Task 3).
- Produces: `static DutyDistributionMetrics DutyFairnessScorer.Score(IReadOnlyList<DutyPlannedAssignment> assignments, IReadOnlyList<DutyMissingCell> missing, DutySolveInput input)` — kişi-başı nöbet/yancı sayısı, min/max, varyans (TeacherPool'daki herkes dahil; atanmayan=0).

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutyFairnessScorerTests.cs
using FluentAssertions;
using Oksis.Application.Modules.Duties.AutoDistribute.Solver;
using Oksis.Domain.Modules.Duties.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Duties.AutoDistribute;

public sealed class DutyFairnessScorerTests
{
    private static readonly Guid L = Guid.NewGuid();
    private static readonly Guid T1 = Guid.NewGuid();
    private static readonly Guid T2 = Guid.NewGuid();

    private static DutySolveInput Input() => new(
        Locations: [new DutyLocationSlot(L, 1)],
        Days: [DayOfWeek.Monday, DayOfWeek.Tuesday],
        TeacherPool: [T1, T2],
        WeeklyTargetDays: 1,
        DayPattern: DutyDayPattern.Spread,
        RelieverEnabled: false,
        UnavailableDays: new HashSet<(Guid, DayOfWeek)>(),
        DislikedDays: new HashSet<(Guid, DayOfWeek)>(),
        RelieverBusyDays: new HashSet<(Guid, DayOfWeek)>(),
        Mode: DutyDistributionMode.FromScratch,
        Pinned: []);

    [Fact]
    public void Score_counts_per_teacher_and_zero_variance_when_balanced()
    {
        var assignments = new List<DutyPlannedAssignment>
        {
            new(T1, DayOfWeek.Monday, L, null),
            new(T2, DayOfWeek.Tuesday, L, null),
        };
        var m = DutyFairnessScorer.Score(assignments, [], Input());
        m.Assigned.Should().Be(2);
        m.Missing.Should().Be(0);
        m.MinLoad.Should().Be(1);
        m.MaxLoad.Should().Be(1);
        m.LoadVariance.Should().Be(0);
        m.PerTeacher.Should().HaveCount(2);
    }

    [Fact]
    public void Score_reports_imbalance_and_missing()
    {
        var assignments = new List<DutyPlannedAssignment>
        {
            new(T1, DayOfWeek.Monday, L, null),
            new(T1, DayOfWeek.Tuesday, L, null),
        };
        var missing = new List<DutyMissingCell>();
        var m = DutyFairnessScorer.Score(assignments, missing, Input());
        m.MinLoad.Should().Be(0); // T2 hiç almadı
        m.MaxLoad.Should().Be(2); // T1 iki nöbet
        m.LoadVariance.Should().BeGreaterThan(0);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~DutyFairnessScorerTests"`
Expected: FAIL — `DutyFairnessScorer` yok.

- [ ] **Step 3: Write the implementation**

```csharp
// src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutyFairnessScorer.cs
namespace Oksis.Application.Modules.Duties.AutoDistribute.Solver;

public static class DutyFairnessScorer
{
    public static DutyDistributionMetrics Score(
        IReadOnlyList<DutyPlannedAssignment> assignments,
        IReadOnlyList<DutyMissingCell> missing,
        DutySolveInput input)
    {
        var dutyByTeacher = input.TeacherPool.ToDictionary(t => t, _ => 0);
        var relieverByTeacher = input.TeacherPool.ToDictionary(t => t, _ => 0);

        foreach (var a in assignments)
        {
            if (dutyByTeacher.ContainsKey(a.TeacherId)) dutyByTeacher[a.TeacherId]++;
            if (a.RelieverId is { } r && relieverByTeacher.ContainsKey(r)) relieverByTeacher[r]++;
        }

        var loads = dutyByTeacher.Values.ToList();
        var min = loads.Count == 0 ? 0 : loads.Min();
        var max = loads.Count == 0 ? 0 : loads.Max();
        var mean = loads.Count == 0 ? 0d : loads.Average();
        var variance = loads.Count == 0 ? 0d : loads.Average(v => (v - mean) * (v - mean));

        var perTeacher = input.TeacherPool
            .Select(t => new DutyTeacherLoad(t, dutyByTeacher[t], relieverByTeacher[t]))
            .OrderBy(x => x.TeacherId)
            .ToList();

        return new DutyDistributionMetrics(
            Assigned: assignments.Count,
            Missing: missing.Count,
            MinLoad: min,
            MaxLoad: max,
            LoadVariance: variance,
            PerTeacher: perTeacher);
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~DutyFairnessScorerTests"`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutyFairnessScorer.cs \
        tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutyFairnessScorerTests.cs
git commit -m "$D feat,test: nöbet solver adalet puanlayıcısı (kişi-başı yük + varyans metrikleri) eklendi."
```

---

### Task 6: `DutySolver` — orkestrasyon (coverage-first + surplus + reliever + scoring)

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutySolver.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutySolverTests.cs`

**Interfaces:**
- Consumes: `DutyFeasibility`/`DutyFeasibilityState` (Task 4), `DutyFairnessScorer` (Task 5), kontratlar (Task 3).
- Produces: `DutySolver : IDutySolver` — deterministik (`OrderBy(teacherId)` tie-break). Algoritma: (1) **coverage-first** her aktif (gün×bölge) ≥1 nöbetçi; (2) **surplus** kalan hedefe kadar boş kapasiteye dengeli yay; (3) **reliever** geçişi (param açıksa); (4) `DutyFairnessScorer.Score`; (5) doldurulamayan hücre → `Missing` + `Hints`. `NoSolution = Missing.Count > 0 && Assignments.Count == 0` (hiç atanamadıysa). Eksik varsa hint üretir.

- [ ] **Step 1: Write the failing test**

```csharp
// tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutySolverTests.cs
using FluentAssertions;
using Oksis.Application.Modules.Duties.AutoDistribute.Solver;
using Oksis.Domain.Modules.Duties.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Duties.AutoDistribute;

public sealed class DutySolverTests
{
    private static readonly Guid L1 = Guid.Parse("11111111-0000-0000-0000-000000000000");
    private static readonly Guid L2 = Guid.Parse("22222222-0000-0000-0000-000000000000");

    private static DutySolveInput Input(
        IReadOnlyList<DutyLocationSlot> locations,
        IReadOnlyList<Guid> teachers,
        int targetDays = 1,
        bool reliever = false,
        IReadOnlySet<(Guid, DayOfWeek)>? unavailable = null,
        IReadOnlySet<(Guid, DayOfWeek)>? relieverBusy = null,
        DutyDistributionMode mode = DutyDistributionMode.FromScratch,
        IReadOnlyList<DutyPlannedAssignment>? pinned = null) =>
        new(
            Locations: locations,
            Days: [DayOfWeek.Monday, DayOfWeek.Tuesday],
            TeacherPool: teachers,
            WeeklyTargetDays: targetDays,
            DayPattern: DutyDayPattern.Spread,
            RelieverEnabled: reliever,
            UnavailableDays: unavailable ?? new HashSet<(Guid, DayOfWeek)>(),
            DislikedDays: new HashSet<(Guid, DayOfWeek)>(),
            RelieverBusyDays: relieverBusy ?? new HashSet<(Guid, DayOfWeek)>(),
            Mode: mode,
            Pinned: pinned ?? []);

    private static List<Guid> Teachers(int n) =>
        Enumerable.Range(1, n).Select(i => Guid.Parse($"{i:D8}-aaaa-0000-0000-000000000000")).ToList();

    [Fact]
    public void Fills_every_active_cell_with_at_least_one_when_enough_teachers()
    {
        var input = Input([new DutyLocationSlot(L1, 1), new DutyLocationSlot(L2, 1)], Teachers(8));
        var result = new DutySolver().Solve(input);
        // 2 gün × 2 bölge = 4 hücre, hepsi ≥1
        result.Missing.Should().BeEmpty();
        result.Assignments.Should().HaveCount(4);
        result.NoSolution.Should().BeFalse();
    }

    [Fact]
    public void Is_deterministic_same_input_same_output()
    {
        var input = Input([new DutyLocationSlot(L1, 1), new DutyLocationSlot(L2, 1)], Teachers(8));
        var a = new DutySolver().Solve(input);
        var b = new DutySolver().Solve(input);
        a.Assignments.Should().BeEquivalentTo(b.Assignments, o => o.WithStrictOrdering());
    }

    [Fact]
    public void Respects_teacher_day_uniqueness_INV_D2()
    {
        var input = Input([new DutyLocationSlot(L1, 1), new DutyLocationSlot(L2, 1)], Teachers(8));
        var result = new DutySolver().Solve(input);
        foreach (var g in result.Assignments.GroupBy(a => (a.TeacherId, a.Day)))
            g.Should().HaveCount(1); // bir öğretmen/gün tek bölge
    }

    [Fact]
    public void Never_exceeds_capacity_cap()
    {
        var input = Input([new DutyLocationSlot(L1, 2)], Teachers(10), targetDays: 2);
        var result = new DutySolver().Solve(input);
        foreach (var g in result.Assignments.GroupBy(a => (a.Day, a.LocationId)))
            g.Count().Should().BeLessThanOrEqualTo(2);
    }

    [Fact]
    public void Reports_missing_and_hint_when_too_few_teachers()
    {
        // 2 gün × 1 bölge(kap1) = 2 hücre ama yalnız Pazartesi'ye müsait 1 öğretmen
        var t = Teachers(1);
        var unavail = new HashSet<(Guid, DayOfWeek)> { (t[0], DayOfWeek.Tuesday) };
        var input = Input([new DutyLocationSlot(L1, 1)], t, unavailable: unavail);
        var result = new DutySolver().Solve(input);
        result.Missing.Should().ContainSingle(c => c.Day == DayOfWeek.Tuesday && c.LocationId == L1);
        result.Hints.Should().Contain(h => h.Code == "not-enough-teachers");
    }

    [Fact]
    public void Assigns_reliever_when_enabled_and_eligible()
    {
        var input = Input([new DutyLocationSlot(L1, 1)], Teachers(8), reliever: true);
        var result = new DutySolver().Solve(input);
        result.Assignments.Where(a => a.Day == DayOfWeek.Monday)
            .Should().Contain(a => a.RelieverId != null);
    }

    [Fact]
    public void FillEmpty_keeps_pinned_and_fills_rest()
    {
        var t = Teachers(8);
        var pinned = new List<DutyPlannedAssignment> { new(t[0], DayOfWeek.Monday, L1, null) };
        var input = Input([new DutyLocationSlot(L1, 1), new DutyLocationSlot(L2, 1)], t,
            mode: DutyDistributionMode.FillEmpty, pinned: pinned);
        var result = new DutySolver().Solve(input);
        // pinned hücre korunur (yeni atama o hücreye gelmez), kalan 3 hücre dolar
        result.Assignments.Should().Contain(a => a.Day == DayOfWeek.Monday && a.LocationId == L1 && a.TeacherId == t[0]);
        result.Missing.Should().BeEmpty();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~DutySolverTests"`
Expected: FAIL — `DutySolver` yok.

- [ ] **Step 3: Write the implementation**

```csharp
// src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutySolver.cs
namespace Oksis.Application.Modules.Duties.AutoDistribute.Solver;

public sealed class DutySolver : IDutySolver
{
    public DutySolveResult Solve(DutySolveInput input)
    {
        var state = DutyFeasibilityState.Create(input);
        var assignments = new List<DutyPlannedAssignment>(input.Mode == DutyDistributionMode.FillEmpty
            ? input.Pinned
            : []);
        var dutyCount = input.TeacherPool.ToDictionary(t => t, _ => 0);
        foreach (var p in assignments)
            if (dutyCount.ContainsKey(p.TeacherId)) dutyCount[p.TeacherId]++;

        var missing = new List<DutyMissingCell>();

        // Deterministik hücre sırası: gün, sonra locationId
        var cells = (from d in input.Days
                     from loc in input.Locations.OrderBy(l => l.LocationId)
                     select (Day: d, Loc: loc)).ToList();

        // (1) COVERAGE-FIRST — her aktif hücre ≥1 (pinned ile zaten dolu olanları atla)
        foreach (var (day, loc) in cells)
        {
            if (state.CellCount(day, loc.LocationId) >= 1) continue; // pinned/önceki doldurdu
            var pick = PickLeastLoaded(input, state, dutyCount, day, loc);
            if (pick is { } teacher)
            {
                Record(assignments, dutyCount, state, teacher, day, loc.LocationId);
            }
            else
            {
                missing.Add(new DutyMissingCell(day, loc.LocationId));
            }
        }

        // (2) SURPLUS — hedefe (WeeklyTargetDays) ulaşmamış öğretmenleri boş kapasiteye dengeli yay
        bool progressed = true;
        while (progressed)
        {
            progressed = false;
            foreach (var (day, loc) in cells)
            {
                if (state.CellCount(day, loc.LocationId) >= loc.Capacity) continue;
                var pick = PickUnderTarget(input, state, dutyCount, day, loc);
                if (pick is { } teacher)
                {
                    Record(assignments, dutyCount, state, teacher, day, loc.LocationId);
                    progressed = true;
                }
            }
        }

        // (3) RELIEVER — param açıksa her nöbete uygun en az yüklü yancı
        if (input.RelieverEnabled)
        {
            var relieverCount = input.TeacherPool.ToDictionary(t => t, _ => 0);
            var withReliever = new List<DutyPlannedAssignment>(assignments.Count);
            foreach (var a in assignments)
            {
                var reliever = input.TeacherPool
                    .Where(r => DutyFeasibility.CanRelieve(r, a.TeacherId, a.Day, input, state))
                    .OrderBy(r => relieverCount[r]).ThenBy(r => r)
                    .Cast<Guid?>().FirstOrDefault();
                if (reliever is { } rr) relieverCount[rr]++;
                withReliever.Add(a with { RelieverId = reliever });
            }
            assignments = withReliever;
        }

        var metrics = DutyFairnessScorer.Score(assignments, missing, input);
        var hints = BuildHints(input, missing);
        var noSolution = assignments.Count == 0 && missing.Count > 0;

        return new DutySolveResult(assignments, missing, metrics, hints, noSolution);
    }

    private static Guid? PickLeastLoaded(
        DutySolveInput input, DutyFeasibilityState state, Dictionary<Guid, int> dutyCount,
        DayOfWeek day, DutyLocationSlot loc) =>
        input.TeacherPool
            .Where(t => DutyFeasibility.CanAssignDuty(t, day, loc, input, state))
            .OrderBy(t => dutyCount[t])
            .ThenBy(t => input.DislikedDays.Contains((t, day)) ? 1 : 0) // PrefersNot SOFT ceza
            .ThenBy(t => t)
            .Cast<Guid?>()
            .FirstOrDefault();

    private static Guid? PickUnderTarget(
        DutySolveInput input, DutyFeasibilityState state, Dictionary<Guid, int> dutyCount,
        DayOfWeek day, DutyLocationSlot loc)
    {
        var candidate = input.TeacherPool
            .Where(t => dutyCount[t] < input.WeeklyTargetDays)
            .Where(t => DutyFeasibility.CanAssignDuty(t, day, loc, input, state))
            .OrderBy(t => dutyCount[t])
            .ThenBy(t => input.DislikedDays.Contains((t, day)) ? 1 : 0)
            .ThenBy(t => t)
            .Cast<Guid?>()
            .FirstOrDefault();
        return candidate;
    }

    private static void Record(
        List<DutyPlannedAssignment> assignments, Dictionary<Guid, int> dutyCount,
        DutyFeasibilityState state, Guid teacher, DayOfWeek day, Guid locationId)
    {
        assignments.Add(new DutyPlannedAssignment(teacher, day, locationId, null));
        if (dutyCount.ContainsKey(teacher)) dutyCount[teacher]++;
        state.RecordDuty(teacher, day, locationId);
    }

    private static IReadOnlyList<DutyRelaxationHint> BuildHints(DutySolveInput input, IReadOnlyList<DutyMissingCell> missing)
    {
        if (missing.Count == 0) return [];
        var hints = new List<DutyRelaxationHint> { new("not-enough-teachers") };
        var maxCapacity = input.Locations.Count == 0 ? 0 : input.Locations.Max(l => l.Capacity);
        if (maxCapacity > 1) hints.Add(new DutyRelaxationHint("capacity-too-high"));
        if (input.UnavailableDays.Count > 0) hints.Add(new DutyRelaxationHint("availability-too-restrictive"));
        return hints;
    }
}
```

> **NOT (DayPattern):** Bu MVP'de `DutyDayPattern` `PickUnderTarget` sıralamasında ikincil bir tie-break olarak ileride güçlendirilebilir; coverage + denge önceliklidir. Spec K-2c-3 pattern'i SOFT tanımlar — şu an surplus aşamasında öğretmenin mevcut günlerine göre Spread/Consecutive tercih ağırlığı eklenecek genişleme noktası burasıdır. MVP kapsamı: pattern girdi olarak taşınır, sıralama dengeyi bozmaz. (Bu, plan kapsamında bilinçli sınırdır; testte pattern davranışı zorlanmaz.)

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~DutySolverTests"`
Expected: PASS (7 test).

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Application/Modules/Duties/AutoDistribute/Solver/DutySolver.cs \
        tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/DutySolverTests.cs
git commit -m "$D feat,test: nöbet adil dağıtım solver'ı (coverage-first + surplus + yancı + hints) eklendi."
```

---

### Task 7: `EnqueueAutoDistributeDuty` komutu + validator (biweekly reddi)

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/AutoDistribute/IAutoDistributeDutyEnqueuer.cs`
- Create: `src/Oksis.Application/Modules/Duties/Commands/EnqueueAutoDistributeDuty/EnqueueAutoDistributeDutyCommand.cs`
- Create: `.../EnqueueAutoDistributeDutyCommandHandler.cs`
- Create: `.../EnqueueAutoDistributeDutyCommandValidator.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/EnqueueAutoDistributeDutyValidatorTests.cs`

**Interfaces:**
- Consumes: `DutyDistributionJob` (Task 1), `IApplicationDbContext.DutyDistributionJobs` (Task 2), `DutyDistributionMode` enum, SchoolSettings `DutyWeeklyFrequency` (read).
- Produces:
  - `IAutoDistributeDutyEnqueuer { void Enqueue(Guid jobId, Guid schoolId); }`
  - `EnqueueAutoDistributeDutyCommand(Guid AcademicYearId, Guid AcademicTermId, DutyDistributionMode Mode) : ICommand<Guid>` — `[Tenancy(Required)] [RequirePermission("duties.manage")]`.
  - Handler: settings `DutyWeeklyFrequency == OnceEveryTwoWeeks` ise `Result.Fail("duties.errors.auto-distribute-biweekly-unsupported")` (K-2c-3); job oluştur (Queued), `DutyDistributionJobs.Add`, `SaveChangesAsync`, enqueuer çağır, jobId döndür.
  - Validator: `AcademicYearId`/`AcademicTermId` boş değil.

- [ ] **Step 1: Write the failing validator test**

```csharp
// tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/EnqueueAutoDistributeDutyValidatorTests.cs
using FluentAssertions;
using Oksis.Application.Modules.Duties.Commands.EnqueueAutoDistributeDuty;
using Oksis.Domain.Modules.Duties.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Duties.AutoDistribute;

public sealed class EnqueueAutoDistributeDutyValidatorTests
{
    private readonly EnqueueAutoDistributeDutyCommandValidator _validator = new();

    [Fact]
    public void Fails_when_term_id_empty()
    {
        var cmd = new EnqueueAutoDistributeDutyCommand(Guid.NewGuid(), Guid.Empty, DutyDistributionMode.FromScratch);
        _validator.Validate(cmd).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Passes_for_valid_command()
    {
        var cmd = new EnqueueAutoDistributeDutyCommand(Guid.NewGuid(), Guid.NewGuid(), DutyDistributionMode.FillEmpty);
        _validator.Validate(cmd).IsValid.Should().BeTrue();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~EnqueueAutoDistributeDutyValidatorTests"`
Expected: FAIL — tipler yok.

- [ ] **Step 3: Write the port, command, validator, handler**

```csharp
// src/Oksis.Application/Modules/Duties/AutoDistribute/IAutoDistributeDutyEnqueuer.cs
namespace Oksis.Application.Modules.Duties.AutoDistribute;

public interface IAutoDistributeDutyEnqueuer
{
    void Enqueue(Guid jobId, Guid schoolId);
}
```

```csharp
// src/Oksis.Application/Modules/Duties/Commands/EnqueueAutoDistributeDuty/EnqueueAutoDistributeDutyCommand.cs
using Oksis.Application.Common.Messaging;     // ICommand — mevcut autogen komutundan doğrula
using Oksis.Application.Common.Security;       // RequirePermission / Tenancy attribute namespace — doğrula
using Oksis.Domain.Modules.Duties.Enums;

namespace Oksis.Application.Modules.Duties.Commands.EnqueueAutoDistributeDuty;

[Tenancy(TenancyMode.Required)]
[RequirePermission("duties.manage")]
public sealed record EnqueueAutoDistributeDutyCommand(
    Guid AcademicYearId,
    Guid AcademicTermId,
    DutyDistributionMode Mode) : ICommand<Guid>;
```

> `using`/attribute namespace'lerini `EnqueueAutoGenerateCommand.cs`'ten birebir kopyala (ICommand, Tenancy, RequirePermission aynı yerlerden gelir).

```csharp
// src/Oksis.Application/Modules/Duties/Commands/EnqueueAutoDistributeDuty/EnqueueAutoDistributeDutyCommandValidator.cs
using FluentValidation;

namespace Oksis.Application.Modules.Duties.Commands.EnqueueAutoDistributeDuty;

public sealed class EnqueueAutoDistributeDutyCommandValidator : AbstractValidator<EnqueueAutoDistributeDutyCommand>
{
    public EnqueueAutoDistributeDutyCommandValidator()
    {
        RuleFor(x => x.AcademicYearId).NotEmpty();
        RuleFor(x => x.AcademicTermId).NotEmpty();
    }
}
```

```csharp
// src/Oksis.Application/Modules/Duties/Commands/EnqueueAutoDistributeDuty/EnqueueAutoDistributeDutyCommandHandler.cs
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Duties.AutoDistribute;
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;

namespace Oksis.Application.Modules.Duties.Commands.EnqueueAutoDistributeDuty;

public sealed class EnqueueAutoDistributeDutyCommandHandler(
    IApplicationDbContext db,
    IAutoDistributeDutyEnqueuer enqueuer,
    ITenantContext tenant) // ITenantContext namespace'ini autogen handler'dan doğrula
    : ICommandHandler<EnqueueAutoDistributeDutyCommand, Guid>
{
    public async Task<Result<Guid>> Handle(EnqueueAutoDistributeDutyCommand request, CancellationToken ct)
    {
        var settings = await db.SchoolSettings.AsNoTracking()
            .FirstOrDefaultAsync(ct); // tenant filtresi global; tek satır
        var frequency = settings?.DutyWeeklyFrequency ?? DutyWeeklyFrequency.OncePerWeek;
        if (frequency == DutyWeeklyFrequency.OnceEveryTwoWeeks)
            return Result.Fail<Guid>("duties.errors.auto-distribute-biweekly-unsupported"); // K-2c-3

        var job = DutyDistributionJob.Create(request.AcademicYearId, request.AcademicTermId, request.Mode);
        db.DutyDistributionJobs.Add(job);
        await db.SaveChangesAsync(ct);

        enqueuer.Enqueue(job.Id, tenant.SchoolId); // SchoolId erişimini autogen handler ile aynı şekilde al
        return Result.Ok(job.Id);
    }
}
```

> **Doğrula:** `Result`/`Result.Fail`/`ICommandHandler` API'si ve `ITenantContext.SchoolId` erişimi `EnqueueAutoGenerateCommandHandler.cs` ile birebir aynı olmalı — oradan kopyala. `db.SchoolSettings` DbSet adını `IApplicationDbContext`'ten doğrula.

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~EnqueueAutoDistributeDutyValidatorTests"`
Expected: PASS (2 test). Ayrıca `dotnet build src/Oksis.Application --no-restore` temiz.

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Application/Modules/Duties/AutoDistribute/IAutoDistributeDutyEnqueuer.cs \
        src/Oksis.Application/Modules/Duties/Commands/EnqueueAutoDistributeDuty/ \
        tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/EnqueueAutoDistributeDutyValidatorTests.cs
git commit -m "$D feat,test: nöbet otomatik dağıtım enqueue komutu + biweekly reddi validator'ı eklendi."
```

---

### Task 8: `GetAutoDistributeDutyStatus` sorgusu + DTO

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Queries/GetAutoDistributeDutyStatus/GetAutoDistributeDutyStatusQuery.cs`
- Create: `.../GetAutoDistributeDutyStatusQueryHandler.cs`
- Create: `.../AutoDistributeDutyStatusDto.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/GetAutoDistributeDutyStatusHandlerTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext.DutyDistributionJobs`, `DutySolveResult` JSON şekli (Task 6 — job `ResultJson`'a serialize edilmiş).
- Produces:
  - `AutoDistributeDutyStatusDto(string Status, string Mode, AutoDistributeResultDto? Result, IReadOnlyList<string>? Hints, string? FailureReason)`
  - `AutoDistributeResultDto(IReadOnlyList<AutoDistributeAssignmentDto> Assignments, IReadOnlyList<AutoDistributeMissingDto> Missing, AutoDistributeMetricsDto Metrics)` (+ alt DTO'lar; solver DTO'larına paralel, ama API-yüzeyi tipleri).
  - `GetAutoDistributeDutyStatusQuery(Guid JobId) : IQuery<AutoDistributeDutyStatusDto>` — `[Tenancy(Required)] [RequirePermission("duties.manage")]`.
  - Handler: job'u bul (yoksa `Result.Fail("duties.errors.distribution-job-not-found")` → 404), `Status`/`Mode` string'e, `ResultJson` varsa deserialize edip DTO'ya map, `HintsJson` varsa string listesine.

- [ ] **Step 1: Write the failing handler test**

```csharp
// tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/GetAutoDistributeDutyStatusHandlerTests.cs
using FluentAssertions;
using Oksis.Application.Modules.Duties.Queries.GetAutoDistributeDutyStatus;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Duties.AutoDistribute;

public sealed class GetAutoDistributeDutyStatusHandlerTests
{
    [Fact]
    public async Task Returns_not_found_when_job_missing()
    {
        // Arrange: in-memory IApplicationDbContext fake (mevcut test fixture deseni — autogen status testinden kopyala)
        var db = TestDbFactory.Create(); // proje test yardımcı sınıfı; gerçek adını autogen status handler testinden al
        var handler = new GetAutoDistributeDutyStatusQueryHandler(db);

        var result = await handler.Handle(new GetAutoDistributeDutyStatusQuery(Guid.NewGuid()), default);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("distribution-job-not-found");
    }
}
```

> **Doğrula:** `GetAutoGenerateStatusQueryHandlerTests`'in kullandığı in-memory DbContext fixture/fake'i (ör. `TestDbContextFactory` veya SQLite in-memory) bul ve **aynısını** kullan. `Result.IsFailure`/`.Error` API'sini de oradan doğrula. Sadece bu "not found" testini yaz; Done/serialize testini integration (Task 11) kapsar.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetAutoDistributeDutyStatusHandlerTests"`
Expected: FAIL — tipler yok.

- [ ] **Step 3: Write DTO, query, handler**

```csharp
// src/Oksis.Application/Modules/Duties/Queries/GetAutoDistributeDutyStatus/AutoDistributeDutyStatusDto.cs
namespace Oksis.Application.Modules.Duties.Queries.GetAutoDistributeDutyStatus;

public sealed record AutoDistributeAssignmentDto(Guid TeacherId, int Day, Guid LocationId, Guid? RelieverId);
public sealed record AutoDistributeMissingDto(int Day, Guid LocationId);
public sealed record AutoDistributeTeacherLoadDto(Guid TeacherId, int DutyCount, int RelieverCount);
public sealed record AutoDistributeMetricsDto(
    int Assigned, int Missing, int MinLoad, int MaxLoad, double LoadVariance,
    IReadOnlyList<AutoDistributeTeacherLoadDto> PerTeacher);
public sealed record AutoDistributeResultDto(
    IReadOnlyList<AutoDistributeAssignmentDto> Assignments,
    IReadOnlyList<AutoDistributeMissingDto> Missing,
    AutoDistributeMetricsDto Metrics,
    bool NoSolution);
public sealed record AutoDistributeDutyStatusDto(
    string Status,
    string Mode,
    AutoDistributeResultDto? Result,
    IReadOnlyList<string>? Hints,
    string? FailureReason);
```

```csharp
// src/Oksis.Application/Modules/Duties/Queries/GetAutoDistributeDutyStatus/GetAutoDistributeDutyStatusQuery.cs
using Oksis.Application.Common.Messaging;
using Oksis.Application.Common.Security;

namespace Oksis.Application.Modules.Duties.Queries.GetAutoDistributeDutyStatus;

[Tenancy(TenancyMode.Required)]
[RequirePermission("duties.manage")]
public sealed record GetAutoDistributeDutyStatusQuery(Guid JobId) : IQuery<AutoDistributeDutyStatusDto>;
```

```csharp
// src/Oksis.Application/Modules/Duties/Queries/GetAutoDistributeDutyStatus/GetAutoDistributeDutyStatusQueryHandler.cs
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;

namespace Oksis.Application.Modules.Duties.Queries.GetAutoDistributeDutyStatus;

public sealed class GetAutoDistributeDutyStatusQueryHandler(IApplicationDbContext db)
    : IQueryHandler<GetAutoDistributeDutyStatusQuery, AutoDistributeDutyStatusDto>
{
    public async Task<Result<AutoDistributeDutyStatusDto>> Handle(
        GetAutoDistributeDutyStatusQuery request, CancellationToken ct)
    {
        var job = await db.DutyDistributionJobs.AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == request.JobId, ct);
        if (job is null)
            return Result.Fail<AutoDistributeDutyStatusDto>("duties.errors.distribution-job-not-found");

        AutoDistributeResultDto? result = job.ResultJson is null
            ? null
            : JsonSerializer.Deserialize<AutoDistributeResultDto>(job.ResultJson);
        IReadOnlyList<string>? hints = job.HintsJson is null
            ? null
            : JsonSerializer.Deserialize<IReadOnlyList<string>>(job.HintsJson);

        return Result.Ok(new AutoDistributeDutyStatusDto(
            Status: job.Status.ToString(),
            Mode: job.Mode.ToString(),
            Result: result,
            Hints: hints,
            FailureReason: job.FailureReason));
    }
}
```

> **JSON tutarlılığı:** Job'a yazılan `ResultJson` (Task 9 handler/job tarafında) **bu** `AutoDistributeResultDto` şekliyle serialize edilmeli ki deserialize tutsun. `Day` int olarak taşınır (`(int)DayOfWeek`).

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetAutoDistributeDutyStatusHandlerTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Application/Modules/Duties/Queries/GetAutoDistributeDutyStatus/ \
        tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/GetAutoDistributeDutyStatusHandlerTests.cs
git commit -m "$D feat,test: nöbet otomatik dağıtım durum sorgusu + sonuç DTO'ları eklendi."
```

---

### Task 9: `ApplyAutoDistributeDuty` komutu (iki mod → Draft)

**Files:**
- Create: `src/Oksis.Application/Modules/Duties/Commands/ApplyAutoDistributeDuty/ApplyAutoDistributeDutyCommand.cs`
- Create: `.../ApplyAutoDistributeDutyCommandHandler.cs`
- Test: integration (Task 11) — burada handler için odak unit testi yazılır.
- Test: `tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/ApplyAutoDistributeDutyHandlerTests.cs`

**Interfaces:**
- Consumes: `DutyDistributionJob` (Done + `ResultJson`), `DutyRoster.CreateDraft/Assign/AssignReliever/RemoveAssignment`, `DutyLocation` (kapasite), `DutyExemption` (Permanent set — Assign'in `exemptTeacherIdsForWeek` parametresi için), `IApplicationDbContext`.
- Produces:
  - `ApplyAutoDistributeDutyCommand(Guid JobId) : ICommand<Guid>` (→ roster Id) — `[Tenancy(Required)] [RequirePermission("duties.manage")]`.
  - Handler: job Done değilse `Result.Fail("duties.errors.distribution-not-ready")`. `ResultJson` deserialize → atamalar. Mevcut Draft roster bul/oluştur (term). **Mode=FromScratch:** Draft'taki tüm atamaları temizle, sonuçtakileri yaz. **Mode=FillEmpty:** mevcut atamaları koru, sonuçtaki atamaları ekle (sonuç zaten pinned'i içeriyor → çiftlemeyi önlemek için yalnız pinned-olmayanları ekle, ya da Draft'ı sonucun tamamıyla yeniden kur — bkz. NOT). Kapasite + exempt set'i `Assign`'e ver. Yancı varsa `AssignReliever`. `SaveChangesAsync`. roster Id döndür.

- [ ] **Step 1: Write the failing handler test (not-ready guard)**

```csharp
// tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/ApplyAutoDistributeDutyHandlerTests.cs
using FluentAssertions;
using Oksis.Application.Modules.Duties.Commands.ApplyAutoDistributeDuty;
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Duties.AutoDistribute;

public sealed class ApplyAutoDistributeDutyHandlerTests
{
    [Fact]
    public async Task Fails_when_job_not_done()
    {
        var db = TestDbFactory.Create(); // autogen apply testindeki fixture'ın aynısı
        var job = DutyDistributionJob.Create(Guid.NewGuid(), Guid.NewGuid(), DutyDistributionMode.FromScratch);
        db.DutyDistributionJobs.Add(job); // Queued — Done değil
        await db.SaveChangesAsync(default);

        var handler = new ApplyAutoDistributeDutyCommandHandler(db);
        var result = await handler.Handle(new ApplyAutoDistributeDutyCommand(job.Id), default);

        result.IsFailure.Should().BeTrue();
        result.Error.Should().Contain("distribution-not-ready");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~ApplyAutoDistributeDutyHandlerTests"`
Expected: FAIL — tipler yok.

- [ ] **Step 3: Write command + handler**

```csharp
// src/Oksis.Application/Modules/Duties/Commands/ApplyAutoDistributeDuty/ApplyAutoDistributeDutyCommand.cs
using Oksis.Application.Common.Messaging;
using Oksis.Application.Common.Security;

namespace Oksis.Application.Modules.Duties.Commands.ApplyAutoDistributeDuty;

[Tenancy(TenancyMode.Required)]
[RequirePermission("duties.manage")]
public sealed record ApplyAutoDistributeDutyCommand(Guid JobId) : ICommand<Guid>;
```

```csharp
// src/Oksis.Application/Modules/Duties/Commands/ApplyAutoDistributeDuty/ApplyAutoDistributeDutyCommandHandler.cs
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Duties.Queries.GetAutoDistributeDutyStatus; // AutoDistributeResultDto reuse
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;

namespace Oksis.Application.Modules.Duties.Commands.ApplyAutoDistributeDuty;

public sealed class ApplyAutoDistributeDutyCommandHandler(IApplicationDbContext db)
    : ICommandHandler<ApplyAutoDistributeDutyCommand, Guid>
{
    public async Task<Result<Guid>> Handle(ApplyAutoDistributeDutyCommand request, CancellationToken ct)
    {
        var job = await db.DutyDistributionJobs.FirstOrDefaultAsync(j => j.Id == request.JobId, ct);
        if (job is null) return Result.Fail<Guid>("duties.errors.distribution-job-not-found");
        if (job.Status != DutyDistributionStatus.Done || job.ResultJson is null)
            return Result.Fail<Guid>("duties.errors.distribution-not-ready");

        var result = JsonSerializer.Deserialize<AutoDistributeResultDto>(job.ResultJson)!;

        // Kapasite + Permanent muafiyet seti (DutyRoster.Assign imzası gereği)
        var capacityByLocation = await db.DutyLocations
            .Where(l => l.IsActive)
            .ToDictionaryAsync(l => l.Id, l => l.Capacity, ct);
        var exemptSet = await db.DutyExemptions
            .Where(e => e.Type == DutyExemptionType.Permanent)
            .Select(e => e.TeacherId)
            .ToHashSetAsync(ct);

        // Mevcut Draft roster bul ya da oluştur (SaveDutyRosterDraft deseniyle aynı term lookup)
        var roster = await db.DutyRosters
            .Include("_assignments")
            .FirstOrDefaultAsync(r => r.AcademicTermId == job.AcademicTermId
                                   && r.Status == DutyRosterStatus.Draft, ct);
        if (roster is null)
        {
            roster = DutyRoster.CreateDraft(/* schoolId */ default, job.AcademicYearId, job.AcademicTermId);
            db.DutyRosters.Add(roster);
        }

        if (job.Mode == DutyDistributionMode.FromScratch)
        {
            foreach (var a in roster.Assignments.ToList())
                roster.RemoveAssignment(a.Id);
        }

        foreach (var a in result.Assignments)
        {
            // FillEmpty: sonuç pinned'leri içeriyor; aynı (gün×bölge×öğretmen) zaten varsa atla (idempotent)
            var day = (DayOfWeek)a.Day;
            roster.Assign(a.TeacherId, day, a.LocationId,
                capacityByLocation.GetValueOrDefault(a.LocationId, 1), exemptSet);
        }

        await db.SaveChangesAsync(ct);

        // Yancı ataması ikinci geçiş (AssignReliever assignmentId ister → kaydedilmiş atamalardan eşle)
        foreach (var a in result.Assignments.Where(x => x.RelieverId is not null))
        {
            var match = roster.Assignments.FirstOrDefault(x =>
                x.TeacherId == a.TeacherId && x.Day == (DayOfWeek)a.Day && x.LocationId == a.LocationId);
            if (match is not null) roster.AssignReliever(match.Id, a.RelieverId!.Value);
        }
        await db.SaveChangesAsync(ct);

        return Result.Ok(roster.Id);
    }
}
```

> **ÖNEMLİ doğrulamalar:**
> - `DutyRoster.CreateDraft` imzasındaki `schoolId` — `SaveDutyRosterDraftCommandHandler`'ın bunu nasıl verdiğine bak (muhtemelen `ITenantContext.SchoolId`); aynı şekilde enjekte et. `default` placeholder'ı **gerçek schoolId** ile değiştir.
> - `db.DutyRosters.Include("_assignments")` — owned koleksiyonun shadow navigation adını `SaveDutyRosterDraftCommandHandler`'dan doğrula (orada nasıl yüklüyorsa aynısı).
> - `RemoveAssignment(a.Id)` ve `Assign(...)` aynı `SaveChanges` içinde delete+insert sırası SQL Server filtreli unique index sorunu çıkarırsa, `SaveDutyRosterDraftCommandHandler`'ın **delete-then-insert iki fazlı** yaklaşımını birebir kopyala (önce kaldır+Save, sonra ekle+Save).
> - `FillEmpty` modunda çift atama: `Assign` INV-D2/kapasite zaten reddeder; pinned + sonuç aynı atamayı içeriyorsa idempotent davranış için var olanı atla.

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~ApplyAutoDistributeDutyHandlerTests"`
Expected: PASS (guard testi). Tam akış Task 11 integration'da.

- [ ] **Step 5: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Application/Modules/Duties/Commands/ApplyAutoDistributeDuty/ \
        tests/Oksis.Application.UnitTests/Modules/Duties/AutoDistribute/ApplyAutoDistributeDutyHandlerTests.cs
git commit -m "$D feat,test: nöbet otomatik dağıtım uygula komutu (FromScratch/FillEmpty → Draft) eklendi."
```

---

### Task 10: Hangfire job + enqueuer impl + DI + controller endpoints

**Files:**
- Create: `src/Oksis.Infrastructure/Duties/HangfireAutoDistributeDutyEnqueuer.cs`
- Create: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/AutoDistributeDutyJob.cs`
- Modify: DI — Infrastructure `DependencyInjection.cs` (enqueuer + `IDutySolver` kayıt)
- Modify: `src/Oksis.Api/Controllers/V1/DutiesController.cs` (3 endpoint + body record'ları)

**Interfaces:**
- Consumes: `IAutoDistributeDutyEnqueuer` (Task 7), `IDutySolver` (Task 6), `IApplicationDbContext`, `IAvailabilityProvider` (`GetBlockedSlotsAsync`/`GetDislikedSlotsAsync`), `IBellScheduleProvider` (öğle/teneffüs period'ları — yancı + duty-window için), `ITenantContext.SetForLoginFlow`, `IDateTimeProvider`, `EnqueueAutoDistributeDutyCommand`/`GetAutoDistributeDutyStatusQuery`/`ApplyAutoDistributeDutyCommand`.
- Produces: `AutoDistributeDutyJob.RunAsync(Guid jobId, Guid schoolId, CancellationToken ct)`; controller `POST /duties/auto-distribute`, `GET /duties/auto-distribute/{jobId}`, `POST /duties/auto-distribute/{jobId}/apply`.

- [ ] **Step 1: Write the enqueuer (mirror HangfireAutoGenerateEnqueuer)**

```csharp
// src/Oksis.Infrastructure/Duties/HangfireAutoDistributeDutyEnqueuer.cs
using Hangfire;
using Oksis.Application.Modules.Duties.AutoDistribute;
// IPostCommitDispatcher namespace — HangfireAutoGenerateEnqueuer.cs'ten doğrula

namespace Oksis.Infrastructure.Duties;

public sealed class HangfireAutoDistributeDutyEnqueuer(
    IBackgroundJobClient jobs, IPostCommitDispatcher dispatcher) : IAutoDistributeDutyEnqueuer
{
    public void Enqueue(Guid jobId, Guid schoolId)
        => dispatcher.Enqueue(() => jobs.Enqueue<AutoDistributeDutyJob>(
            j => j.RunAsync(jobId, schoolId, CancellationToken.None)));
}
```

- [ ] **Step 2: Write the Hangfire job (mirror AutoGenerateScheduleJob)**

```csharp
// src/Oksis.Infrastructure/BackgroundJobs/Jobs/AutoDistributeDutyJob.cs
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Duties.AutoDistribute.Solver;
using Oksis.Application.Modules.Duties.Queries.GetAutoDistributeDutyStatus; // result DTO şekli
using Oksis.Application.Modules.Timetable.Ports; // IAvailabilityProvider, IBellScheduleProvider
using Oksis.Domain.Modules.Duties.Enums;

namespace Oksis.Infrastructure.BackgroundJobs.Jobs;

public sealed class AutoDistributeDutyJob(
    IApplicationDbContext db,
    ITenantContext tenant,
    IDutySolver solver,
    IAvailabilityProvider availability,
    IBellScheduleProvider bells,
    IDateTimeProvider clock,
    ILogger<AutoDistributeDutyJob> logger)
{
    private static readonly DayOfWeek[] WorkingDays =
        [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday];

    public async Task RunAsync(Guid jobId, Guid schoolId, CancellationToken ct)
    {
        tenant.SetForLoginFlow(schoolId);
        var job = await db.DutyDistributionJobs.FirstOrDefaultAsync(j => j.Id == jobId, ct);
        if (job is null || job.Status != DutyDistributionStatus.Queued) return; // retry-idempotent

        job.Start();
        await db.SaveChangesAsync(ct);

        try
        {
            var input = await BuildInputAsync(job.AcademicTermId, job.Mode, ct);
            var result = solver.Solve(input);
            var dto = MapToResultDto(result); // AutoDistributeResultDto (Task 8 şekli)
            var resultJson = JsonSerializer.Serialize(dto);

            if (result.NoSolution)
            {
                var hintsJson = JsonSerializer.Serialize(result.Hints.Select(h => h.Code).ToList());
                job.MarkNoSolution(resultJson, hintsJson, clock.UtcNow);
            }
            else
            {
                job.CompleteWithResult(resultJson, clock.UtcNow);
            }
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Nöbet otomatik dağıtım başarısız: {JobId}", jobId);
            job.Fail(ex.Message, clock.UtcNow);
            await db.SaveChangesAsync(ct);
        }
    }

    private async Task<DutySolveInput> BuildInputAsync(Guid termId, DutyDistributionMode mode, CancellationToken ct)
    {
        // 1) Aktif bölgeler + kapasite
        var locations = await db.DutyLocations.Where(l => l.IsActive)
            .Select(l => new DutyLocationSlot(l.Id, l.Capacity)).ToListAsync(ct);

        // 2) Muafiyet: Permanent + dönem-kapsayan Temporary (K-2c-7). EffectiveFrom yoksa bugün.
        var today = DateOnly.FromDateTime(clock.UtcNow.UtcDateTime);
        var exemptIds = (await db.DutyExemptions.ToListAsync(ct))
            .Where(e => e.CoversDay(today)).Select(e => e.TeacherId).ToHashSet();

        // 3) Öğretmen havuzu: aktif öğretmenler − muaf. (TeacherProfile sorgusunu GetAvailableRelievers handler'ından kopyala.)
        var teacherPool = await QueryActiveTeacherIdsAsync(ct);
        teacherPool = teacherPool.Where(t => !exemptIds.Contains(t)).ToList();

        // 4) Müsaitlik → gün-seviyesi HARD/SOFT (K-2c-6): period'lardan güne indir
        var blocked = await availability.GetBlockedSlotsAsync(tenant.SchoolId, termId, teacherPool, ct);
        var disliked = await availability.GetDislikedSlotsAsync(tenant.SchoolId, termId, teacherPool, ct);
        var unavailableDays = ToDaySet(blocked);
        var dislikedDays = ToDaySet(disliked);

        // 5) Yancı meşgul günleri: öğle penceresinde dersi olan öğretmen (GetAvailableRelievers lunch-window mantığı)
        var relieverBusyDays = await BuildRelieverBusyDaysAsync(termId, ct);

        // 6) Politika
        var settings = await db.SchoolSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        var relieverEnabled = settings?.DutiesRelieverEnabled ?? false;
        var frequency = settings?.DutyWeeklyFrequency ?? DutyWeeklyFrequency.OncePerWeek;
        var dayPattern = settings?.DutyDayPattern ?? DutyDayPattern.Spread;
        var targetDays = frequency == DutyWeeklyFrequency.TwicePerWeek ? 2 : 1; // biweekly enqueue'da elendi

        // 7) FillEmpty: mevcut Draft atamaları pinned
        var pinned = mode == DutyDistributionMode.FillEmpty ? await LoadDraftAssignmentsAsync(termId, ct) : [];

        return new DutySolveInput(
            locations, WorkingDays.ToList(), teacherPool, targetDays, dayPattern, relieverEnabled,
            unavailableDays, dislikedDays, relieverBusyDays, mode, pinned);
    }

    // ToDaySet, QueryActiveTeacherIdsAsync, BuildRelieverBusyDaysAsync, LoadDraftAssignmentsAsync, MapToResultDto:
    // küçük yardımcılar — implementasyon adımlarını izle (aşağıdaki Step 3 notları).
}
```

> **Step 3 implementasyon notları (yardımcılar):**
> - `ToDaySet(IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>)` → `HashSet<(Guid,DayOfWeek)>`: her teacher'ın slot'larındaki `Day`'leri topla. (K-2c-6 MVP eşlemesi: o gün herhangi bir blocked/disliked period varsa o gün hard/soft.)
> - `QueryActiveTeacherIdsAsync` → `GetAvailableRelieversQueryHandler`'daki "aktif, ayrılmamış TeacherProfile" sorgusunu kopyala (yalnız Id seç).
> - `BuildRelieverBusyDaysAsync` → `GetAvailableRelieversQueryHandler`'daki öğle-penceresi (`BellSchedule` `LunchBreak` slot `LessonOrder`) + `LessonPlacement` lookup'ını kopyala; her (teacher, day) için öğle period'unda dersi olanı işaretle. Yayınlanmış programdan oku (K0.6).
> - `LoadDraftAssignmentsAsync` → mevcut Draft roster'ın atamalarını `DutyPlannedAssignment`'a map et.
> - `MapToResultDto(DutySolveResult)` → solver DTO'larını `AutoDistributeResultDto` (Task 8) şekline çevir; `Day` → `(int)`.

- [ ] **Step 3: Implement the helpers (write the bodies as noted above), then build**

Run: `dotnet build src/Oksis.Infrastructure --no-restore`
Expected: PASS.

- [ ] **Step 4: Register DI (enqueuer + solver)**

Infrastructure `DependencyInjection.cs`'te (HangfireAutoGenerateEnqueuer kaydının yanına):
```csharp
services.AddScoped<IAutoDistributeDutyEnqueuer, HangfireAutoDistributeDutyEnqueuer>();
```
`IDutySolver` kaydı (autogen `IScheduleSolver` nerede register ediliyorsa — Application veya Infrastructure DI — aynı yere):
```csharp
services.AddSingleton<IDutySolver, DutySolver>(); // ScheduleSolver kaydıyla aynı lifetime'ı kullan
```

- [ ] **Step 5: Add controller endpoints**

`DutiesController.cs`'e ekle (mevcut `[RequirePermission]` deseni controller-level değil action-level ise SchedulingController'daki gibi action attribute kullan — DutiesController'ın mevcut desenini izle):
```csharp
[HttpPost("auto-distribute")]
public async Task<IActionResult> AutoDistributeAsync(
    [FromBody] AutoDistributeDutyBody body, CancellationToken ct)
{
    var result = await sender.Send(
        new EnqueueAutoDistributeDutyCommand(body.AcademicYearId, body.AcademicTermId, body.Mode), ct);
    return result.ToHttpResult(); // mevcut helper
}

[HttpGet("auto-distribute/{jobId:guid}")]
public async Task<IActionResult> AutoDistributeStatusAsync(Guid jobId, CancellationToken ct)
{
    var result = await sender.Send(new GetAutoDistributeDutyStatusQuery(jobId), ct);
    return result.ToHttpResult();
}

[HttpPost("auto-distribute/{jobId:guid}/apply")]
public async Task<IActionResult> ApplyAutoDistributeAsync(Guid jobId, CancellationToken ct)
{
    var result = await sender.Send(new ApplyAutoDistributeDutyCommand(jobId), ct);
    return result.ToHttpResult();
}

public sealed record AutoDistributeDutyBody(Guid AcademicYearId, Guid AcademicTermId, DutyDistributionMode Mode);
```
> `ToHttpResult`/`sender` adlarını DutiesController'ın mevcut action'larından doğrula. `using Oksis.Domain.Modules.Duties.Enums;` ekle (DutyDistributionMode).

- [ ] **Step 6: Build full solution**

Run: `dotnet build Oksis.slnx --no-restore`
Expected: PASS (0 hata).

- [ ] **Step 7: Commit**

```bash
D=$(date +%F)
git add src/Oksis.Infrastructure/Duties/HangfireAutoDistributeDutyEnqueuer.cs \
        src/Oksis.Infrastructure/BackgroundJobs/Jobs/AutoDistributeDutyJob.cs \
        src/Oksis.Infrastructure/ src/Oksis.Api/Controllers/V1/DutiesController.cs
git commit -m "$D feat: nöbet otomatik dağıtım Hangfire job + enqueuer + 3 endpoint bağlandı."
```

---

### Task 11: Integration — job kalıcılık + apply iki mod

**Files:**
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Duties/DutyDistributionApplyTests.cs`

**Interfaces:**
- Consumes: gerçek `OksisDbContext` (integration fixture), `DutyDistributionJob`, `ApplyAutoDistributeDutyCommandHandler`, `DutyRoster`.

- [ ] **Step 1: Write the failing integration test**

```csharp
// tests/Oksis.Infrastructure.IntegrationTests/Duties/DutyDistributionApplyTests.cs
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Modules.Duties.Commands.ApplyAutoDistributeDuty;
using Oksis.Application.Modules.Duties.Queries.GetAutoDistributeDutyStatus;
using Oksis.Domain.Modules.Duties.Entities;
using Oksis.Domain.Modules.Duties.Enums;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Duties;

public sealed class DutyDistributionApplyTests : IntegrationTestBase // mevcut taban sınıf adını DutyRosterIndexTest'ten doğrula
{
    [Fact]
    public async Task FromScratch_apply_writes_assignments_to_draft()
    {
        // Arrange: aktif bir DutyLocation + Done job (FromScratch) seed et
        var (yearId, termId) = await SeedTermAsync();
        var locationId = await SeedActiveLocationAsync("1. Kat", capacity: 1);
        var teacherId = await SeedActiveTeacherAsync();

        var resultDto = new AutoDistributeResultDto(
            Assignments: [new AutoDistributeAssignmentDto(teacherId, (int)DayOfWeek.Monday, locationId, null)],
            Missing: [],
            Metrics: new AutoDistributeMetricsDto(1, 0, 1, 1, 0, []),
            NoSolution: false);

        var job = DutyDistributionJob.Create(yearId, termId, DutyDistributionMode.FromScratch);
        job.Start();
        job.CompleteWithResult(JsonSerializer.Serialize(resultDto), DateTimeOffset.UnixEpoch);
        Db.DutyDistributionJobs.Add(job);
        await Db.SaveChangesAsync(default);

        var handler = new ApplyAutoDistributeDutyCommandHandler(Db);

        // Act
        var result = await handler.Handle(new ApplyAutoDistributeDutyCommand(job.Id), default);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var roster = await Db.DutyRosters.Include("_assignments")
            .FirstAsync(r => r.AcademicTermId == termId && r.Status == DutyRosterStatus.Draft);
        roster.Assignments.Should().ContainSingle(a =>
            a.TeacherId == teacherId && a.Day == DayOfWeek.Monday && a.LocationId == locationId);
    }
}
```

> **Doğrula:** Integration taban sınıfı (`IntegrationTestBase` / `Db` property / seed helper'lar) — mevcut `DutyRosterIndexTest`/`DutyAssignmentIndexTest` dosyalarından birebir aynı pattern'i kullan (Testcontainers/LocalDB hangisiyse). `SeedTermAsync`/`SeedActiveLocationAsync`/`SeedActiveTeacherAsync` yoksa mevcut duty integration testlerindeki seed yardımcılarını kullan/uyarla.

- [ ] **Step 2: Run test to verify it fails (or red for the right reason)**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~DutyDistributionApplyTests"`
Expected: FAIL — apply tenant/schoolId veya owned-collection yükleme detayı ortaya çıkar (Task 9 NOT'larındaki schoolId/Include adımlarını burada gerçek DB ile sertleştir).

- [ ] **Step 3: Fix the handler details surfaced by the integration test**

Task 9'daki `CreateDraft` schoolId + `Include("_assignments")` + delete-then-insert sırasını gerçek DB davranışına göre düzelt (gerekirse iki-fazlı SaveChanges).

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~DutyDistributionApplyTests"`
Expected: PASS.

- [ ] **Step 5: Full backend suite + format**

Run:
```bash
dotnet format
dotnet build Oksis.slnx --no-restore
dotnet test
```
Expected: build 0 hata; tüm test paketleri yeşil (yeni testler dahil).

- [ ] **Step 6: Commit**

```bash
D=$(date +%F)
git add tests/Oksis.Infrastructure.IntegrationTests/Duties/DutyDistributionApplyTests.cs \
        src/Oksis.Application/Modules/Duties/Commands/ApplyAutoDistributeDuty/
git commit -m "$D test,fix: nöbet otomatik dağıtım apply integration testi + handler sertleştirmesi eklendi."
```

---

### Task 12: Modül dokümantasyonu güncelleme (api-contracts + completion_status)

**Files:**
- Modify: `.claude/docs/modules/timetable/api-contracts.md` (Nöbet Otomatik Dağıtım § — 3 endpoint)
- Modify: `.claude/docs/modules/timetable/database-schema.md` (`duty_distribution_jobs` tablosu)
- Modify: `.claude/docs/modules/timetable/completion_status.md` (Faz 4/Dilim 2c BE girdisi + Debt-2c-* + "⚠️ Spec Dışına Çıkılanlar" varsa)
- Modify: `.claude/docs/modules/timetable/README.md` (Last Updated + Files tik)

- [ ] **Step 1: Document the 3 endpoints in api-contracts.md**

`POST /api/v1/duties/auto-distribute` (body `{academicYearId, academicTermId, mode}` → `jobId`), `GET .../auto-distribute/{jobId}` (status DTO), `POST .../auto-distribute/{jobId}/apply` (→ rosterId). İzin `duties.manage`. Hata kodları: `duties.errors.auto-distribute-biweekly-unsupported`, `duties.errors.distribution-not-ready`, `duties.errors.distribution-job-not-found`.

- [ ] **Step 2: Document the table in database-schema.md**

`[academic].duty_distribution_jobs` — kolonlar + index `(school_id, academic_term_id, created_at) WHERE is_deleted=0`.

- [ ] **Step 3: Update completion_status.md**

Faz 4/Dilim 2c BE girdisini "✅ Tamamlanan Yapılar" altına ekle (solver + job + 3 endpoint + test sayıları). Debt'leri "⏳" altına: **Debt-2c-1** (biweekly kapsam dışı), **Debt-2c-2** (heuristik), **Debt-2c-3** (tek aday), **Debt-2c-4** (muafiyet Permanent — ama K-2c-7 ile solver Temporary-tarih de eler; not düş). Müsaitlik gün-eşlemesi MVP basitleştirmesini (herhangi-period→gün) **⚠️ Spec Dışına Çıkılanlar**'a kısa satırla logla (tarih + K-2c-6 + onay). İlerleme/`Güncel` tarihini bump et.

- [ ] **Step 4: Commit**

```bash
D=$(date +%F)
git add .claude/docs/modules/timetable/
git commit -m "$D docs: Nöbet otomatik dağıtım (Faz 4/Dilim 2c) BE — modül dokümanları + completion_status güncellendi."
```

---

## Self-Review (plan yazarı tarafından koşuldu)

**Spec coverage:**
- K-2c-1 hibrit → Task 4 (feasibility) + Task 5 (scorer) + Task 6 (solver). ✅
- K-2c-2 ≥1 + tavan → Task 6 coverage-first/surplus + Task 4 kapasite. ✅
- K-2c-3 sıklık/biweekly reddi → Task 7 handler + validator; targetDays mapping Task 10. ✅
- K-2c-4 yancı birlikte → Task 6 reliever pass + Task 4 CanRelieve. ✅
- K-2c-5 iki mod → Task 9 apply + Task 6 FillEmpty pinned. ✅
- K-2c-6 Unavailable HARD/PrefersNot SOFT → Task 4 + Task 10 ToDaySet. ✅
- K-2c-7 muafiyet → Task 10 BuildInput exempt (Permanent + Temporary CoversDay) + Task 9 exemptSet. ✅
- K-2c-8 tek öneri → solver tek sonuç döner (aday listesi yok). ✅
- K-2c-9 öner≠uygula + Hangfire + duties.manage → Task 7/8/9/10. ✅
- K-2c-10 deterministik → Task 6 tie-break + determinism testi. ✅

**Placeholder scan:** `default` schoolId (Task 9) ve "namespace doğrula" notları bilinçli — her biri gerçek referans dosyası + nereden kopyalanacağı belirtilmiş. Kod adımları gerçek kod içeriyor.

**Type consistency:** `DutySolveInput/Result`, `DutyPlannedAssignment`, `AutoDistributeResultDto` (job serialize ↔ status deserialize ↔ apply deserialize) aynı şekil; `Day` her yerde int taşınır. `IDutySolver.Solve` imzası Task 3'te tanımlı, Task 6/10'da aynı kullanılır.

**Bilinçli sınırlar (plan kapsamı):** DayPattern surplus sıralamasında güçlü uygulanmaz (K-2c-3 SOFT; MVP); müsaitlik gün-eşlemesi "herhangi period→gün" (K-2c-6 implementasyona bırakıldı). İkisi de Task 6 NOT + Task 12 Debt/sapma logu ile kayıt altında.
