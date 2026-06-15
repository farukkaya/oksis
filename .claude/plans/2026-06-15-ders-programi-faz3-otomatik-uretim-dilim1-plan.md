# Ders Programı — Faz 3 Otomatik Üretim · Dilim 1 (tek-sınıf) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bir Draft sınıf programı için, ağırlıklı/strict sezgisel solver ile **3 çeşitlilikli çakışmasız aday taslak** üret; idareci handoff sihirbazında birini seçip "Editörde Aç" ile programa Draft olarak uygular.

**Architecture:** Saf `IScheduleSolver` (graph-coloring + forward-checking + backtracking + ağırlıklı skor + 3 strateji) Application'da; Hangfire `AutoGenerateScheduleJob` girdileri toplayıp solver'ı çalıştırır, adayları `schedule_generation_jobs` satırına JSON saklar; CQRS Enqueue/Status/ApplyDraft; ApplyDraft mevcut `ScheduleProgram.RestoreFrom`'u yeniden kullanır. Web: `schedule_autogen.jsx`+`.css` handoff'u port edilir, gerçek API'ye bağlanır (poll), kademe/tümü disabled.

**Tech Stack:** .NET 10 · EF Core · MediatR/CQRS · Hangfire · MSSQL — React+Vite+TS · React Query v5 · react-router · lucide-react · i18next.

**Bağlayıcı:** spec `.claude/specs/ders-programi-modulu-spec.md` §34 · tasarım `.claude/plans/2026-06-15-ders-programi-faz3-otomatik-uretim-design.md` · handoff `.claude/design-handoffs/schedule_autogen.{jsx,css}`.

---

## Önemli kod gerçekleri (uygulamadan önce oku — koddan doğrulandı 2026-06-15)

- **Ders talebi kaynağı = `ITeachingAssignmentSource.GetForBranchAsync(schoolId, branchId, termId)`** → `AssignmentLine(Guid SubjectId, Guid TeacherId, int WeeklyHours)` (`src/Oksis.Application/Modules/Timetable/Ports/ITeachingAssignmentSource.cs`). Her AssignmentLine `WeeklyHours` kez yerleştirilecek ders demektir (`GetUnplacedLessonsQueryHandler` deseni). `IRequiredHoursResolver` grade-toplam verir (yalnız çapraz-kontrol; demand kaynağı DEĞİL).
- **Taslak uygulama = `ScheduleProgram.RestoreFrom(IReadOnlyCollection<RestorePlacementInput> snapshot, int restoredFromVersion)`** (`ScheduleProgram.cs`): aktif yerleşimleri Deactivate → snapshot'tan kur → blok grupları yeniden → `Revising`. Solver çıktısı `RestorePlacementInput(DayOfWeek Day, int Period, Guid SubjectId, Guid TeacherId, Guid? RoomId, bool IsBlock, Guid? BlockGroupId)` ile birebir eşleşir (`ValueObjects/RestorePlacementInput.cs`). **ApplyDraft bunu yeniden kullanır** (yeni domain metodu gerekmez; `restoredFromVersion` yerine 0/Version geçilir — Task ile netleşir).
- **Status enum:** `ScheduleProgramStatus { Draft=0, Revising=1, Published=2 }`. Autogen yalnız Draft/Revising'de; Published reddedilir.
- **External occupancy:** `GetExternalOccupancyQuery(ProgramId)` → `ExternalOccupancyDto(IReadOnlyList<OccupancySlotDto> Teachers, IReadOnlyList<OccupancySlotDto> Rooms)`, `OccupancySlotDto(Guid Id, int Day, int Period)` (Id = teacher/room id). Solver'a girdi: öğretmen/derslik başına dolu (Day,Period) kümeleri. Handler/dosya: `Queries/GetExternalOccupancy/`.
- **Bell:** `IBellScheduleProvider.GetPeriodCountAsync(schoolId, branchId)` → int (Lesson slot sayısı). Slotlar = 5 gün (Mon–Fri) × 1..count.
- **Ev-dersliği:** `ClassRoom.RoomId` (Guid?) — şube ev dersliği.
- **TimeSlot:** `readonly record struct TimeSlot(DayOfWeek Day, int Period)`; Period 1..20 validate.
- **Hangfire job deseni:** `src/Oksis.Infrastructure/BackgroundJobs/Jobs/DispatchNotificationJob.cs` — ctor inject + `RunAsync(...)`; **`tenantContext.SetForLoginFlow(schoolId)`** HTTP-dışı tenant; `IBackgroundJobClient.Enqueue<TJob>(j => j.RunAsync(...))`; job `AddTransient`.
- **Job-tracking şablonu:** `src/Oksis.Domain/Modules/Users/Entities/ImportJob.cs` (Status enum + progress + RowsJson + Start/Complete). `schedule_generation_jobs` buna benzer.
- **EF:** `builder.ToAcademicTable("...")` (`[academic]` şema), global snake_case convention, `[Cacheable]` yok; filtered index. Migration: `ASPNETCORE_ENVIRONMENT=Mac-Development dotnet ef migrations add YYYYMMDDHHmmss_YYYYMMDD_desc ...` + `dotnet format`.
- **Controller:** `SchedulingController` `[Route("api/v1/timetable")]`; izin attribute'leri **CQRS record üzerinde** (`[Tenancy(TenancyMode.Required)]` + `[RequirePermission("timetable.manage")]`); controller `ISender` + `result.ToHttpResult(HttpContext)`.
- **Test:** Application.UnitTests (solver saf + handler; MockQueryable `BuildMockDbSet()` **değişkene al** sonra `.Returns`). Integration: `ASPNETCORE_ENVIRONMENT=Mac-Development`.
- **Web:** modül `src/portals/admin/timetable/` (api `api/timetableApi.ts`, keys `keys/timetableKeys.ts` `tenantScopedKey`, i18n `timetable` ns). Drawer deseni `components/PublishDrawer.tsx` (`.drawer-scrim`+`.aside` slide-in). Tetik: Hub `components/RowMenu.tsx` + editör `editor/components/EditorMoreMenu.tsx`. Editör route `/admin/schedule/:id/edit` (`routes.tsx`), `useNavigate` (react-router). Branş renkleri **className `sub-cN`** (inline style YASAK → handoff'taki `style={{'--mc':c}}` yerine className). Poll: `useQuery refetchInterval` (kodda örnek yok, eklenecek). lucide-react (Sparkles vb.).

---

# BÖLÜM A — Solver çekirdeği (saf, Application, yoğun TDD)

> Solver tamamen saf C# — DB/tenant yok. Tüm girdiler `SolveInput`'ta; çıktı `SolveResult`. Application
> altında `Modules/Timetable/AutoGenerate/Solver/`. Yoğun birim test (Application.UnitTests).

## Task A1: Solver kontrat tipleri (input/output/weights)

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/SolverContracts.cs`

- [ ] **Step 1: Tipleri yaz** (saf record'lar; davranış yok → test gerektirmez, derleme gate)

```csharp
using Oksis.Domain.Modules.Timetable.ValueObjects;
namespace Oksis.Application.Modules.Timetable.AutoGenerate.Solver;

public enum WeightLevel { Low = 0, Mid = 1, High = 2 }

public sealed record SolverWeights(
    WeightLevel MorningHardSubjects,
    WeightLevel MinimizeGaps,
    WeightLevel DailyBalance,
    bool KeepBlocks)
{
    public static SolverWeights Default => new(WeightLevel.Mid, WeightLevel.High, WeightLevel.Mid, true);
}

/// <summary>Yerleştirilecek tek ders örneği (bir branşın bir saati).</summary>
public sealed record LessonDemand(Guid SubjectId, Guid TeacherId, bool IsHardSubject, int BlockGroupSeq);
// BlockGroupSeq: 0 = blok değil; >0 = aynı seq ardışık blok üyeleri (KeepBlocks ile).

public sealed record SolveInput(
    IReadOnlyList<LessonDemand> Demands,
    IReadOnlyList<TimeSlot> AvailableSlots,
    IReadOnlySet<(Guid TeacherId, DayOfWeek Day, int Period)> ExternalTeacherBusy,
    IReadOnlySet<(Guid RoomId, DayOfWeek Day, int Period)> ExternalRoomBusy,
    Guid? HomeRoomId,
    SolverWeights Weights,
    bool StrictMode,
    int CandidateCount,
    IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>> TeacherBlockedSlots);  // müsaitlik (no-op → boş)

public sealed record PlannedPlacement(
    DayOfWeek Day, int Period, Guid SubjectId, Guid TeacherId, Guid? RoomId, bool IsBlock, int BlockGroupSeq);

public sealed record CandidateMetrics(
    int ConflictCount, int MissingHours, double AvgTeacherGap, int PreferencePercent, string DailyBalanceLabel, int Score);

public sealed record SolveCandidate(
    string Id, IReadOnlyList<PlannedPlacement> Placements, CandidateMetrics Metrics, bool IsRecommended);

public enum RelaxationKind { MinimizeGaps, KeepBlocks, StrictMode }
public sealed record RelaxationHint(RelaxationKind Kind, string Reason);

public sealed record SolveResult(
    IReadOnlyList<SolveCandidate> Candidates,
    bool NoSolution,
    IReadOnlyList<RelaxationHint> RelaxationHints);

public interface IScheduleSolver { SolveResult Solve(SolveInput input); }
```

- [ ] **Step 2: Derleme** `cd oksis-api && dotnet build Oksis.slnx --no-restore` → 0 error.
- [ ] **Step 3: Commit** `2026-06-15 feat: Otomatik üretim — solver kontrat tipleri (SolveInput/Result/Weights/IScheduleSolver).`

---

## Task A2: `LessonDemandBuilder` — görevlendirmeden talep listesi (+test)

> Saf yardımcı: `AssignmentLine[]` + blok bilgisi → `LessonDemand[]` (her WeeklyHours bir demand).

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/LessonDemandBuilder.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/AutoGenerate/LessonDemandBuilderTests.cs`

- [ ] **Step 1: Failing test**

```csharp
public class LessonDemandBuilderTests
{
    [Fact]
    public void Expands_each_assignment_into_weekly_hour_demands()
    {
        var subj = Guid.NewGuid(); var teacher = Guid.NewGuid();
        var lines = new[] { new AssignmentLine(subj, teacher, 3) };
        var demands = LessonDemandBuilder.Build(lines, hardSubjectIds: new HashSet<Guid>());
        demands.Should().HaveCount(3);
        demands.Should().OnlyContain(d => d.SubjectId == subj && d.TeacherId == teacher && !d.IsHardSubject && d.BlockGroupSeq == 0);
    }

    [Fact]
    public void Marks_hard_subjects()
    {
        var subj = Guid.NewGuid();
        var lines = new[] { new AssignmentLine(subj, Guid.NewGuid(), 1) };
        var demands = LessonDemandBuilder.Build(lines, hardSubjectIds: new HashSet<Guid> { subj });
        demands.Single().IsHardSubject.Should().BeTrue();
    }
}
```
> `AssignmentLine` `Oksis.Application.Modules.Timetable.Ports`'tan. `hardSubjectIds` = "zor ders" kümesi (Mat/Fizik vb.) — kaynağı yoksa şimdilik boş geçilir (handler boş set verir; **Debt-AG-7: zor-ders işareti veri kaynağı yok**). BlockGroupSeq Dilim-1'de 0 (blok girdisi görevlendirmede yok → blok üretimi bu dilimde KAPALI; KeepBlocks skoru etkilemez. Debt-AG-8).

- [ ] **Step 2: Fail gör → Step 3: Build impl (her satırı WeeklyHours kez genişlet) → Step 4: Pass → Step 5: Commit**
`2026-06-15 feat,test: Otomatik üretim — LessonDemandBuilder (görevlendirme → talep listesi).`

---

## Task A3: `SlotFeasibility` — bir (demand, slot) için katı kısıt denetimi (+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/SlotFeasibility.cs`
- Test: `.../AutoGenerate/SlotFeasibilityTests.cs`

Kurallar (her biri ayrı test): sınıf-slot boş mu (draft-içi) · öğretmen external-busy değil · öğretmen draft-içi başka slotta değil · öğretmen müsaitlik-blok değil (no-op → her zaman geçer) · derslik (ev-dersliği) external-room-busy değil. (Oda-türü Dilim-1 dışı; ev-dersliği — Debt-AG-2.)

- [ ] **Step 1: Failing testler** (örnek)

```csharp
[Fact]
public void Blocks_when_teacher_externally_busy()
{
    var t = Guid.NewGuid();
    var ctx = FeasCtx(externalTeacherBusy: new() { (t, DayOfWeek.Monday, 1) });
    SlotFeasibility.CanPlace(new LessonDemand(Guid.NewGuid(), t, false, 0),
        new TimeSlot(DayOfWeek.Monday, 1), ctx).Should().BeFalse();
}

[Fact]
public void Blocks_when_class_slot_already_used_in_draft()
{
    // draft state'inde (Mon,1) dolu → aynı slota ikinci ders konamaz
}

[Fact]
public void Blocks_when_teacher_already_placed_same_slot_in_draft() { }

[Fact]
public void Allows_when_all_clear() { }
```
> `SlotFeasibility.CanPlace(demand, slot, ctx)` — `ctx` = işlenmekte olan draft durumu (sınıf-slot dolu mu, öğretmen hangi slotlarda) + external busy kümeleri + müsaitlik. `ctx` saf bir struct/record; backtracking sürücüsü günceller. Helper `FeasCtx(...)` test fixture.

- [ ] **Steps 2-5:** fail → impl → pass → commit
`2026-06-15 feat,test: Otomatik üretim — SlotFeasibility (sınıf/öğretmen/derslik katı kısıtları; müsaitlik no-op).`

---

## Task A4: `BacktrackingSolver` — tek aday üretimi (forward-checking + bütçe) (+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/BacktrackingSolver.cs`
- Test: `.../AutoGenerate/BacktrackingSolverTests.cs`

> Tek strateji için: talepleri **en-kısıtlı-önce** sırala, her talebe feasible slot seç (forward-checking),
> tıkanınca geri-al; **deterministik düğüm bütçesi** (`maxSteps`) aşılırsa o ana kadarki en iyi kısmi
> çözümü `Unplaced` ile döndür (asılı kalmaz). Strateji = slot-tercih sırasını belirleyen fonksiyon (Task A5).

- [ ] **Step 1: Failing testler**

```csharp
[Fact]
public void Places_all_when_feasible()
{
    // 2 ders, 5 gün × 4 period boş, çakışma yok → hepsi yerleşir, Unplaced boş
    var result = BacktrackingSolver.Solve(demands2, slots20, ctx, slotOrder: SlotOrders.Natural, maxSteps: 10_000);
    result.Placements.Should().HaveCount(2);
    result.Unplaced.Should().BeEmpty();
}

[Fact]
public void Reports_unplaced_when_overconstrained()
{
    // 3 ders aynı öğretmen + yalnız 2 slot → 1 yerleşemez (Unplaced)
}

[Fact]
public void Respects_step_budget_and_returns_partial_without_hanging()
{
    // çok sıkı senaryo + küçük maxSteps → döner (tam çözüm yok), Unplaced dolu, asılı kalmaz
}
```

- [ ] **Steps 2-5:** fail → impl (MRV-benzeri sıralama + recursion + budget) → pass → commit
`2026-06-15 feat,test: Otomatik üretim — BacktrackingSolver (forward-checking + bütçe; kısmi/Unplaced).`

---

## Task A5: `CandidateStrategies` (3 çeşitlilik) + `ScoreCandidate` (ağırlıklı metrikler) (+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/CandidateStrategies.cs`
- Create: `src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/CandidateScorer.cs`
- Test: `.../AutoGenerate/CandidateScorerTests.cs`

> 3 deterministik strateji (slot-tercih sırası): **MorningFirst** (zor dersler küçük period'a), **GapMinimizing**
> (öğretmenin mevcut slotlarına bitişik), **BalanceFirst** (günlere eşit dağıt). Her strateji A4 solver'ını farklı
> `slotOrder` ile çalıştırır → farklı aday. `ScoreCandidate(placements, weights, demandsTotal)` →
> `CandidateMetrics`: ConflictCount(=0 feasible), MissingHours(=Unplaced sayısı), AvgTeacherGap (öğretmen pencere
> ort.), PreferencePercent (ağırlıklı soft memnuniyet 0–100), DailyBalanceLabel ("Dengeli/Orta/Zayıf"), Score.

- [ ] **Step 1: Failing testler** (skor monotonluğu — davranışı sabitler)

```csharp
[Fact]
public void Morning_weight_high_scores_morning_placement_higher()
{
    var w = SolverWeights.Default with { MorningHardSubjects = WeightLevel.High };
    var morning = ScoreCandidate(hardSubjectAtPeriod1, w);
    var afternoon = ScoreCandidate(hardSubjectAtPeriod6, w);
    morning.Score.Should().BeGreaterThan(afternoon.Score);
}

[Fact]
public void Fewer_teacher_gaps_scores_higher_when_minimize_gaps_high() { }

[Fact]
public void MissingHours_equals_unplaced_count() { }

[Fact]
public void Strategies_produce_distinct_orderings() { /* 3 strateji slotOrder farklı sonuç verir */ }
```

- [ ] **Steps 2-5:** fail → impl → pass → commit
`2026-06-15 feat,test: Otomatik üretim — 3 strateji + ağırlıklı CandidateScorer (sabah/pencere/denge metrikleri).`

---

## Task A6: `ScheduleSolver` (IScheduleSolver impl) — orkestra + strict/nosolution/öneri (+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/AutoGenerate/Solver/ScheduleSolver.cs`
- Test: `.../AutoGenerate/ScheduleSolverTests.cs`

> 3 stratejiyi çalıştır → adaylar → skorla → en yüksek `IsRecommended`. **Strict:** herhangi aday `MissingHours>0`
> ise (tam feasible yok) → `NoSolution=true` + `RelaxationHints` (en kısıtlayıcı: KeepBlocks açıksa onu, MinimizeGaps
> High ise onu, son çare StrictMode). Strict değilse en iyi kısmi adayları döndür (MissingHours uyarı olarak kalır).
> Aynı (demand,slot) → çift teslim yok; çapraz-program occupancy backstop DB'de (job-apply anında).

- [ ] **Step 1: Failing testler**

```csharp
[Fact]
public void Returns_three_distinct_candidates_with_one_recommended_when_feasible()
{
    var r = sut.Solve(feasibleInput with { CandidateCount = 3 });
    r.NoSolution.Should().BeFalse();
    r.Candidates.Should().HaveCount(3);
    r.Candidates.Count(c => c.IsRecommended).Should().Be(1);
}

[Fact]
public void Strict_with_no_full_solution_sets_NoSolution_and_hints()
{
    var r = sut.Solve(overconstrainedInput with { StrictMode = true });
    r.NoSolution.Should().BeTrue();
    r.RelaxationHints.Should().NotBeEmpty();
}

[Fact]
public void NonStrict_overconstrained_returns_partial_candidates_with_missing_hours()
{
    var r = sut.Solve(overconstrainedInput with { StrictMode = false });
    r.NoSolution.Should().BeFalse();
    r.Candidates.Should().NotBeEmpty();
    r.Candidates.First().Metrics.MissingHours.Should().BeGreaterThan(0);
}
```

- [ ] **Steps 2-5:** fail → impl → pass → commit
`2026-06-15 feat,test: Otomatik üretim — ScheduleSolver orkestra (3 aday/öneri, strict→nosolution+öneri).`

---

# BÖLÜM B — Müsaitlik portu + Persistence

## Task B1: `IAvailabilityProvider` (no-op) + DI

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/Ports/IAvailabilityProvider.cs`
- Create: `src/Oksis.Infrastructure/Timetable/NoopAvailabilityProvider.cs`
- Modify: `src/Oksis.Infrastructure/DependencyInjection.cs`

- [ ] **Step 1:** port + no-op impl

```csharp
// IAvailabilityProvider.cs
using Oksis.Domain.Modules.Timetable.ValueObjects;
namespace Oksis.Application.Modules.Timetable.Ports;
public interface IAvailabilityProvider
{
    Task<IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>> GetBlockedSlotsAsync(
        Guid schoolId, Guid termId, IReadOnlyCollection<Guid> teacherIds, CancellationToken ct);
}
```
```csharp
// NoopAvailabilityProvider.cs — Faz 4'e kadar boş (herkes müsait)
public sealed class NoopAvailabilityProvider : IAvailabilityProvider
{
    public Task<IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>> GetBlockedSlotsAsync(
        Guid schoolId, Guid termId, IReadOnlyCollection<Guid> teacherIds, CancellationToken ct)
        => Task.FromResult<IReadOnlyDictionary<Guid, IReadOnlySet<TimeSlot>>>(
            new Dictionary<Guid, IReadOnlySet<TimeSlot>>());
}
```
DI: `services.AddScoped<IAvailabilityProvider, Timetable.NoopAvailabilityProvider>();` ayrıca `services.AddScoped<IScheduleSolver, ...AutoGenerate.Solver.ScheduleSolver>();` (solver saf ama DI'dan çözülür).

- [ ] **Step 2: Derleme → Step 3: Commit** `2026-06-15 feat: Otomatik üretim — IAvailabilityProvider no-op (Faz 4) + solver DI.`

---

## Task B2: `ScheduleGenerationJob` entity + EF config + migration (+integration test)

**Files:**
- Create: `src/Oksis.Domain/Modules/Timetable/Entities/ScheduleGenerationJob.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Timetable/ScheduleGenerationJobConfiguration.cs`
- Modify: `OksisDbContext.cs` + `IApplicationDbContext.cs` (DbSet)
- Migration + Test: `tests/Oksis.Infrastructure.IntegrationTests/Timetable/ScheduleGenerationJobPersistenceTests.cs`

> `ImportJob` deseni. Durum makinesi + adaylar JSON. TenantEntity.

- [ ] **Step 1: Failing test (entity davranışı — Domain.UnitTests)**

```csharp
[Fact]
public void Lifecycle_queued_running_done()
{
    var j = ScheduleGenerationJob.Create(programId, weightsJson: "{}", strict: false);
    j.Status.Should().Be(GenerationStatus.Queued);
    j.Start(now);
    j.Status.Should().Be(GenerationStatus.Running);
    j.CompleteWithCandidates(candidatesJson: "[...]", now);
    j.Status.Should().Be(GenerationStatus.Done);
    j.CandidatesJson.Should().NotBeNull();
}

[Fact]
public void NoSolution_and_Failed_transitions() { /* MarkNoSolution(hintsJson), Fail(reason) */ }
```
Entity: `{ Id, SchoolId(TenantEntity), ProgramId, Status(GenerationStatus: Queued/Running/Done/NoSolution/Failed), WeightsJson, Strict, CandidatesJson?, HintsJson?, FailureReason?, CreatedAt, CompletedAt? }` + `Create/Start/CompleteWithCandidates/MarkNoSolution/Fail`.

- [ ] **Step 2-4:** fail → entity impl → pass.
- [ ] **Step 5: EF config + DbSet + migration**

```csharp
builder.ToAcademicTable("schedule_generation_jobs");
builder.HasKey(x => x.Id); builder.Ignore(x => x.DomainEvents);
builder.Property(x => x.Status).IsRequired();
builder.Property(x => x.WeightsJson).IsRequired();
builder.Property(x => x.CandidatesJson); builder.Property(x => x.HintsJson); builder.Property(x => x.FailureReason).HasMaxLength(1000);
builder.HasIndex(x => new { x.SchoolId, x.ProgramId, x.CreatedAt }).HasFilter("is_deleted = 0").HasDatabaseName("ix_schedule_generation_jobs_program");
```
Migration: `... add 20260615HHmmss_20260615_add_schedule_generation_jobs ...` + `dotnet format`.

- [ ] **Step 6: Integration test** (job satırı yazılır/okunur, tenant dolu) → PASS.
- [ ] **Step 7: Commit** `2026-06-15 feat,test: Otomatik üretim — ScheduleGenerationJob entity + EF + migration.`

---

# BÖLÜM C — CQRS + Hangfire job

## Task C1: `EnqueueAutoGenerateCommand` (+handler+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/Commands/EnqueueAutoGenerate/*` (command + handler + body/weights dto)
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/AutoGenerate/EnqueueAutoGenerateHandlerTests.cs`

> Doğrula: program var + **Draft/Revising** (Published reddet) + sahiplik(tenant). Job satırı (Queued) + enqueue → jobId. Enqueue Hangfire portu (yeni `IAutoGenerateEnqueuer` veya doğrudan `IBackgroundJobClient` Infrastructure handler'da — Faz 2.6 `INotificationEnqueuer` deseni: Application port + Infra impl).

- [ ] **Step 1: Failing testler:** Published → `Result.Conflict/Validation`; Draft → job + enqueue çağrılır + jobId döner.
- [ ] **Steps 2-5:** fail → impl (port `IAutoGenerateEnqueuer` + Infra `HangfireAutoGenerateEnqueuer` enqueues `AutoGenerateScheduleJob`) → pass → commit
`2026-06-15 feat,test: Otomatik üretim — EnqueueAutoGenerate (Draft kontrol + job + enqueue → jobId).`

## Task C2: `GetAutoGenerateStatusQuery` (+handler+test)

**Files:** `src/Oksis.Application/Modules/Timetable/Queries/GetAutoGenerateStatus/*` + test.
> Self/scope: job sahiplik (tenant + program). Done → adaylar+metrikler DTO; NoSolution → hint DTO; Running/Queued → durum. `CandidatesJson` deserialize → DTO.
- [ ] TDD: status DTO döner; başka tenant job → NotFound. Commit
`2026-06-15 feat,test: Otomatik üretim — GetAutoGenerateStatus (adaylar/metrik/nosolution; scope).`

## Task C3: `ApplyAutoGenerateDraftCommand(jobId, candidateId)` (+handler+test)

**Files:** `src/Oksis.Application/Modules/Timetable/Commands/ApplyAutoGenerateDraft/*` + test.
> Job Done + aday var + program Draft/Revising → adayın `PlannedPlacement[]`'ını `RestorePlacementInput[]`'a çevir →
> `program.RestoreFrom(snapshot, restoredFromVersion: program.Version)` → SaveChanges. Occupancy: `RestoreFrom`
> sonrası DB filtreli unique index backstop (Debt-BE-7 deseni: occupancy senkronu ilk yazımda düzelir). Published → reddet.
- [ ] **Step 1: Failing testler:** aday programa uygulanır (RestoreFrom çağrılır, placements eşleşir); Published → reddet; bilinmeyen candidateId → NotFound.
- [ ] **Steps 2-5:** fail → impl → pass → commit
`2026-06-15 feat,test: Otomatik üretim — ApplyAutoGenerateDraft (seçilen aday → RestoreFrom → Draft).`

## Task C4: `AutoGenerateScheduleJob` (Hangfire) + controller uçları + DI

**Files:**
- Create: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/AutoGenerateScheduleJob.cs`
- Create: `src/Oksis.Infrastructure/Timetable/HangfireAutoGenerateEnqueuer.cs` (C1'de port tanımlandıysa burada impl)
- Modify: `src/Oksis.Api/Controllers/V1/SchedulingController.cs` (3 uç) + `DependencyInjection.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Timetable/AutoGenerateScheduleJobTests.cs`

> Job: `RunAsync(jobId, schoolId, programId)` → `SetForLoginFlow` → job.Start → girdi topla
> (`ITeachingAssignmentSource` + `IBellScheduleProvider` + `GetExternalOccupancy` mantığı + `ClassRoom.RoomId` +
> `IAvailabilityProvider`) → `SolveInput` kur → `IScheduleSolver.Solve` → `CompleteWithCandidates(json)` |
> `MarkNoSolution(hints)` | `Fail`. Adayları JSON serialize.
> Controller: `POST programs/{id}/auto-generate` (Enqueue) · `GET auto-generate/{jobId}` (Status) ·
> `POST auto-generate/{jobId}/apply` (ApplyDraft). İzin `timetable.manage` (CQRS record attribute).

- [ ] **Step 1: Integration test** — bir Draft sınıf için job uçtan uca koşar → job Done + 3 aday JSON; ApplyDraft sonrası program aktif yerleşim sayısı > 0, çapraz-program çakışma yok (DB index).
- [ ] **Steps 2-4:** job + enqueuer impl + controller uçları + DI → integration pass + `dotnet build` 0 error.
- [ ] **Step 5: Commit** `2026-06-15 feat,test: Otomatik üretim — AutoGenerateScheduleJob + controller (enqueue/status/apply) + DI.`

- [ ] **Step 6:** Tüm BE testleri: `cd oksis-api && dotnet test --filter "FullyQualifiedName~AutoGenerate|FullyQualifiedName~ScheduleGenerationJob"` yeşil; `dotnet build` temiz.

---

# BÖLÜM D — Web (handoff port, gerçek wiring)

## Task D1: api + keys + types (autogen)

**Files:**
- Modify: `src/portals/admin/timetable/api/timetableApi.ts` (3 metot) + `keys/timetableKeys.ts` (autogenJob key)
- Create: `src/portals/admin/timetable/autogen/types.ts`

- [ ] api: `enqueueAutoGenerate(programId, {weights, strict})`→`{jobId}` · `getAutoGenerateStatus(jobId)`→status DTO · `applyAutoGenerateDraft(jobId, candidateId)`→void. keys: `autogenJob(schoolId, jobId)` (tenant-scope). types: `AutoGenWeights`, `AutoGenStatusDto`, `AutoGenCandidateDto`, `AutoGenMetricsDto` (BE DTO ile eşleş). Build temiz. Commit
`2026-06-15 feat: Otomatik üretim web — api/keys/types.`

## Task D2: hook — enqueue + poll status (+test)

**Files:** `src/portals/admin/timetable/autogen/useAutoGenerate.ts` + test.
> `useAutoGenerate()` → `enqueue` mutation (jobId state) + `useQuery` status `refetchInterval: data.status running/queued ? 1200 : false` (Done/NoSolution/Failed durunca durur) + `applyDraft` mutation. tenant-scope key.
- [ ] TDD (mock api): enqueue→jobId; poll running→done; applyDraft çağrılır. Commit
`2026-06-15 feat,test: Otomatik üretim web — useAutoGenerate (enqueue + poll + apply).`

## Task D3: sihirbaz bileşenleri (handoff port) + CSS (+test)

**Files:**
- Create: `src/portals/admin/timetable/autogen/AutoGenDrawer.tsx` (+ `AgCard`/`AgMini`/`AgPreview` alt bileşenler)
- Create: `src/portals/admin/timetable/autogen/autogen.css` (`schedule_autogen.css` port; theme var'larıyla)
- Test: `src/portals/admin/timetable/autogen/__tests__/AutoGenDrawer.test.tsx`

> `.claude/design-handoffs/schedule_autogen.{jsx,css}`'i **birebir** port et: aşamalar settings/generating/results/
> nosolution + büyük önizleme. **Gerçek wiring** (`useAutoGenerate`): ayarlar(weights+strict)→enqueue→poll→gerçek
> adaylar+metrikler→"Editörde Aç"(applyDraft→`navigate(/admin/schedule/:id/edit)`). **Kademe/Tümü scope butonları
> disabled** + "sonraki sürüm" başlığı (honest). Müsaitlik metni dürüst ("Faz 4'te bağlanınca uygulanır").
> Branş renkleri **className `sub-cN`** (inline style YASAK — handoff'taki `style={{'--mc'}}` yerine). Drawer
> `.drawer-scrim`+`aside` (PublishDrawer deseni). lucide ikonları (Sparkles vb.). i18n `timetable.autogen.*`.
> Named export, `any` yok.

- [ ] **Step 1: Failing test** (mock useAutoGenerate): ayarlar render → "Taslak Üret" enqueue çağırır; status done → 3 aday kart + metrikler; "Editörde Aç" applyDraft+navigate; strict+nosolution → öneri paneli; kademe/tümü disabled.
- [ ] **Steps 2-5:** fail → port + wiring → pass → build temiz → commit
`2026-06-15 feat,test: Otomatik üretim web — sihirbaz drawer (handoff port, gerçek wiring, kademe/tümü disabled).`

## Task D4: tetik + i18n + tam paket

**Files:** Modify Hub `RowMenu`/`ScheduleHubPage` + editör `EditorMoreMenu` ("Otomatik Oluştur" → drawer; yalnız Draft/Revising) · `locales/{tr,en}/timetable.json` (`autogen.*`).
- [ ] tetikleri bağla (mevcut disabled "Otomatik Oluştur" gerçek drawer'a) + i18n anahtarları + `npm run test` tam paket yeşil + `npm run build` temiz. Commit
`2026-06-15 feat: Otomatik üretim web — Hub/editör tetik + autogen i18n (tr/en).`

---

# BÖLÜM E — Dokümantasyon

## Task E1: timetable modül dokümanları + completion_status

**Files:** `.claude/docs/modules/timetable/{business-rules,api-contracts,completion_status}.md`
- [ ] `business-rules`: otomatik üretim kuralları (BR-TT-AG-*: katı kısıtlar solver'da; müsaitlik no-op; üret≠uygula). `api-contracts`: 3 uç. `completion_status`: Faz 3 Dilim-1 ✅ + Debt-AG-1..8 + spec sapmaları (handoff'a göre zengin; kademe/tümü Dilim-2; ders-talebi görevlendirmeden). Commit
`2026-06-15 docs: Faz 3 Dilim-1 Otomatik Üretim tamam — business-rules/api-contracts/completion_status (Debt-AG-*).`

---

## Self-Review (plan yazımında kontrol edildi)
- **Spec kapsamı:** tasarım §1-10 → A(solver) + B(müsaitlik/persistence) + C(CQRS/job) + D(web handoff) + E(doküman). Her tasarım maddesi bir task'a bağlı. Kademe/Tümü Dilim-2 (kapsam dışı, disabled).
- **Düzeltme:** ders-talebi `ITeachingAssignmentSource` (tasarımdaki "IRequiredHoursResolver" yerine — gerçek demand kaynağı görevlendirme). Plan bunu kullanır; IRequiredHoursResolver yalnız ileride çapraz-kontrol.
- **Yeni Debt:** AG-7 (zor-ders işareti veri yok → boş set), AG-8 (blok girdisi görevlendirmede yok → Dilim-1 blok üretimi kapalı). completion_status'a eklenecek.
- **Tip tutarlılığı:** `SolveInput/SolveResult/PlannedPlacement/CandidateMetrics` A1'de tanımlı, A2-A6 + C4 boyunca tutarlı; `PlannedPlacement`→`RestorePlacementInput` eşlemesi C3'te.
- **Apply mekanizması:** mevcut `RestoreFrom` yeniden kullanılır (yeni domain metodu yok) — C3.
- **Risk:** solver bütçe ile asılı kalmaz (A4); strict→nosolution+öneri (A6). Global çok-sınıf Dilim-2.
