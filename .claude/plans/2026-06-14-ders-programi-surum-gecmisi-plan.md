# Ders Programı — Sürüm Geçmişi (B-1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Yayınlanmış ders programı sürümlerini listele, ardışık sürümler arası diff göster ve seçilen sürümü aktif programa Draft olarak geri yükle — full-stack (oksis-api + oksis-web).

**Architecture:** `ScheduleVersion` (mevcut snapshot entity) ve `PublishedScheduleSnapshot` (mevcut DTO) yeniden kullanılır. BE'de 3 dikey dilim (`ListScheduleVersions` query, `GetScheduleVersionDiff` query, `RestoreScheduleVersion` command) + domain `ScheduleProgram.RestoreFrom`. FE'de `VersionHistoryDrawer` + Hub `RowMenu`/editör ⋯ menüsü tetikleyicileri. Yeni tablo/migration/izin YOK (`timetable.manage` zaten seed'li).

**Tech Stack:** .NET 10 · MediatR (`ICommandHandler`/`IQueryHandler`) · EF Core · `Result`/`Result<T>` · React 18 + TS · React Query v5 · Radix Popover · vitest/xunit.

**Tasarım:** `.claude/plans/2026-06-14-ders-programi-surum-gecmisi-design.md`.

---

## Genel kurallar
- BE çalışma dizini `oksis-api/`, FE `oksis-web/`. Branch `dersprog` (her iki repo).
- TDD: kırmızı test → minimal impl → yeşil. Commit her task sonunda (OKSİS format `2026-06-14 <type>: <Türkçe>.`).
- BE test: `dotnet test --filter "FullyQualifiedName~<X>"`; build `dotnet build Oksis.slnx --no-restore`. DB testleri için `ASPNETCORE_ENVIRONMENT=Mac-Development` (docker `oksis-mssql` ayakta).
- FE test: `npm run test -- <path>`; build `npm run build`.
- `any`/default-export/inline-style yasak (FE); i18n zorunlu. EF generated migration yok (bu slice'ta tablo değişmiyor).

---

## Dosya Yapısı

**Backend (yeni):**
- `src/Oksis.Application/Modules/Timetable/Serialization/ScheduleSnapshotSerializer.cs` — paylaşılan deserialize/options (DRY).
- `src/Oksis.Domain/Modules/Timetable/Entities/ScheduleProgram.cs` (modify) — `RestoreFrom`.
- `src/Oksis.Domain/Modules/Timetable/ValueObjects/RestorePlacementInput.cs` — domain restore girdisi.
- `src/Oksis.Domain/Modules/Timetable/Events/ScheduleProgramRestoredEvent.cs`.
- `src/Oksis.Application/Modules/Timetable/Queries/ListScheduleVersions/{Query,Handler}.cs` + `DTOs/ScheduleVersionDtos.cs`.
- `src/Oksis.Application/Modules/Timetable/Queries/GetScheduleVersionDiff/{Query,Handler}.cs` + saf `ScheduleVersionDiff.cs` (ComputeVersionDiff).
- `src/Oksis.Application/Modules/Timetable/Commands/RestoreScheduleVersion/{Command,Handler}.cs`.
- `src/Oksis.Api/Controllers/V1/SchedulingController.cs` (modify) — 3 route + body yok (path param).

**Backend (test):**
- `tests/Oksis.Domain.UnitTests/...ScheduleProgramRestoreTests.cs`
- `tests/Oksis.Application.UnitTests/...VersionDiffTests.cs` + handler testleri (mevcut timetable test desenine göre).

**Frontend (yeni/modify):**
- `src/portals/admin/timetable/types.ts` (modify) — version DTO'ları.
- `src/portals/admin/timetable/api/timetableApi.ts` (modify) — 3 wrapper.
- `src/portals/admin/timetable/components/VersionHistoryDrawer.tsx` + test.
- `src/portals/admin/timetable/components/RowMenu.tsx` (modify) — `history` ikonu.
- `src/portals/admin/timetable/ScheduleHubPage.tsx` / `ClassProgramsTable.tsx` (modify) — RowMenu item + drawer state.
- `src/portals/admin/timetable/editor/components/EditorMoreMenu.tsx` + `EditorToolbar.tsx` (modify) — ⋯ menü + item.
- `src/portals/admin/timetable/ScheduleEditorPage.tsx` (modify) — drawer state.
- `src/shared/i18n/locales/{tr,en}/timetable.json` (modify) — `versions.*`.

---

## Task 1 (BE): Paylaşılan snapshot serializer + RestorePlacementInput + RestoredEvent

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/Serialization/ScheduleSnapshotSerializer.cs`
- Create: `src/Oksis.Domain/Modules/Timetable/ValueObjects/RestorePlacementInput.cs`
- Create: `src/Oksis.Domain/Modules/Timetable/Events/ScheduleProgramRestoredEvent.cs`

- [ ] **Step 1: RestorePlacementInput (domain record)**
```csharp
namespace Oksis.Domain.Modules.Timetable.ValueObjects;

/// <summary>Bir sürüm snapshot'ından programı geri yüklemek için tek yerleşim girdisi.</summary>
public sealed record RestorePlacementInput(
    DayOfWeek Day,
    int Period,
    Guid SubjectId,
    Guid TeacherId,
    Guid? RoomId,
    bool IsBlock,
    Guid? BlockGroupId);
```

- [ ] **Step 2: ScheduleProgramRestoredEvent**
Mevcut `ScheduleProgramPublishedEvent` dosyasını oku (`src/Oksis.Domain/Modules/Timetable/Events/`) ve aynı desende:
```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Timetable.Events;

public sealed record ScheduleProgramRestoredEvent(
    Guid SchoolId,
    Guid ProgramId,
    int RestoredFromVersion) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
```
> `IDomainEvent.OccurredAt` gereklidir (gerçeklik notu). Eğer mevcut event'ler `OccurredAt`'i farklı set ediyorsa onların desenini birebir izle.

- [ ] **Step 3: ScheduleSnapshotSerializer (DRY helper)**
`PublishedScheduleQueryHandler.TryDeserialize` (satır ~321) ve `PublishProgramCommandHandler` aynı `JsonSerializerOptions(JsonSerializerDefaults.Web)` + `PublishedScheduleSnapshot` kullanıyor. Tek noktaya çıkar:
```csharp
using System.Text.Json;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Serialization;

public static class ScheduleSnapshotSerializer
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static PublishedScheduleSnapshot? TryDeserialize(string json)
    {
        try { return JsonSerializer.Deserialize<PublishedScheduleSnapshot>(json, Options); }
        catch (JsonException) { return null; }
    }
}
```
(Bu task yalnız helper'ı ekler; mevcut iki kullanıcıyı buna geçirmek ZORUNLU değil — yeni diff/restore bunu kullanacak. İstersen mevcutları da geçir ama kapsam dışı.)

- [ ] **Step 4: Build**
Run: `dotnet build Oksis.slnx --no-restore`
Expected: temiz.

- [ ] **Step 5: Commit**
```bash
git add src/Oksis.Application/Modules/Timetable/Serialization/ src/Oksis.Domain/Modules/Timetable/ValueObjects/RestorePlacementInput.cs src/Oksis.Domain/Modules/Timetable/Events/ScheduleProgramRestoredEvent.cs
git commit -m "2026-06-14 feat: Sürüm geçmişi temel parçaları — paylaşılan snapshot serializer + RestorePlacementInput + RestoredEvent."
```

---

## Task 2 (BE): Domain `ScheduleProgram.RestoreFrom`

**Files:**
- Modify: `src/Oksis.Domain/Modules/Timetable/Entities/ScheduleProgram.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Timetable/ScheduleProgramRestoreTests.cs`

Domain bağlamı (doğrulandı): `_placements` (List), `ActivePlacements` (filtre), `Place` `LessonPlacement.Create(this, slot, subjectId, teacherId, roomId)` çağırır; `LessonPlacement.MarkBlock(blockGroupId)` ve `Deactivate()` **internal**; `TimeSlot` = `(DayOfWeek Day, int Period)`; `Raise(event)` var.

- [ ] **Step 1: Failing test** — `ScheduleProgramRestoreTests.cs`
Mevcut bir domain testini (`tests/Oksis.Domain.UnitTests/Modules/Timetable/` altında, ör. ScheduleProgram place/publish testi) oku ve kurulum desenini (Create + Place) izle. Test:
```csharp
using Oksis.Domain.Modules.Timetable.Entities;
using Oksis.Domain.Modules.Timetable.ValueObjects;
using Oksis.Domain.Modules.Timetable.Events;

public class ScheduleProgramRestoreTests
{
    private static ScheduleProgram NewProgram() =>
        ScheduleProgram.Create(/* mevcut testlerdeki Create argümanları: schoolId, yearId, termId, branchId */);

    [Fact]
    public void RestoreFrom_replaces_active_placements_with_snapshot()
    {
        var p = NewProgram();
        var t1 = Guid.NewGuid(); var s1 = Guid.NewGuid();
        p.Place(new TimeSlot(DayOfWeek.Monday, 1), s1, t1, null); // eski yerleşim

        var s2 = Guid.NewGuid(); var t2 = Guid.NewGuid();
        var snapshot = new[]
        {
            new RestorePlacementInput(DayOfWeek.Tuesday, 3, s2, t2, null, false, null),
        };

        p.RestoreFrom(snapshot);

        Assert.Single(p.ActivePlacements);
        var only = p.ActivePlacements[0];
        Assert.Equal(DayOfWeek.Tuesday, only.Day);
        Assert.Equal(3, only.Period);
        Assert.Equal(s2, only.SubjectId);
        Assert.Equal(t2, only.TeacherId);
        Assert.Equal(ScheduleProgramStatus.Revising, p.Status);
    }

    [Fact]
    public void RestoreFrom_reconstructs_block_groups()
    {
        var p = NewProgram();
        var grp = Guid.NewGuid(); var subj = Guid.NewGuid(); var tch = Guid.NewGuid();
        var snapshot = new[]
        {
            new RestorePlacementInput(DayOfWeek.Wednesday, 4, subj, tch, null, true, grp),
            new RestorePlacementInput(DayOfWeek.Wednesday, 5, subj, tch, null, true, grp),
        };
        p.RestoreFrom(snapshot);
        var blocks = p.ActivePlacements.Where(x => x.IsBlock).ToList();
        Assert.Equal(2, blocks.Count);
        Assert.Single(blocks.Select(b => b.BlockGroupId).Distinct()); // tek grup
        Assert.NotNull(blocks[0].BlockGroupId);
    }

    [Fact]
    public void RestoreFrom_raises_restored_event()
    {
        var p = NewProgram();
        p.RestoreFrom(new[] { new RestorePlacementInput(DayOfWeek.Monday, 1, Guid.NewGuid(), Guid.NewGuid(), null, false, null) });
        Assert.Contains(p.DomainEvents, e => e is ScheduleProgramRestoredEvent);
    }
}
```
> `NewProgram()` argümanlarını ve `DomainEvents` erişimini mevcut domain testlerinden bire bir al (ScheduleProgram.Create imzası + event koleksiyonu adı). `ActivePlacements[0].Day/Period/SubjectId/TeacherId/IsBlock/BlockGroupId` public alanlardır (GridCell BE tarafı kullanıyor).

- [ ] **Step 2: Test kırmızı**
Run: `ASPNETCORE_ENVIRONMENT=Mac-Development dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~ScheduleProgramRestore"`
Expected: FAIL (RestoreFrom yok).

- [ ] **Step 3: RestoreFrom implement** — `ScheduleProgram.cs` içine (Publish'ten sonra):
```csharp
/// <summary>Bir sürüm snapshot'ından programı yeniden kurar: mevcut aktif yerleşimleri pasifleştirir,
/// snapshot'taki yerleşimleri ekler, blok gruplarını yeniden oluşturur, durumu Revising yapar.</summary>
public void RestoreFrom(IReadOnlyCollection<RestorePlacementInput> snapshot)
{
    foreach (var active in ActivePlacements.ToList())
    {
        active.Deactivate();
    }

    var byOldGroup = new Dictionary<Guid, List<Guid>>();
    foreach (var item in snapshot)
    {
        var placement = LessonPlacement.Create(
            this, new TimeSlot(item.Day, item.Period), item.SubjectId, item.TeacherId, item.RoomId);
        _placements.Add(placement);
        if (item is { IsBlock: true, BlockGroupId: { } g })
        {
            (byOldGroup.TryGetValue(g, out var list) ? list : byOldGroup[g] = []).Add(placement.Id);
        }
    }

    foreach (var group in byOldGroup.Values.Where(ids => ids.Count >= 2))
    {
        SetBlock(group);
    }

    Status = ScheduleProgramStatus.Revising;
    Raise(new ScheduleProgramRestoredEvent(SchoolId, Id, Version));
}
```
> `using Oksis.Domain.Modules.Timetable.ValueObjects;` + `Events;` ekle. `SetBlock` zaten yeni `placement.Id`'leri kabul eder ve yeni `BlockGroupId` üretir (mevcut davranış). INV-1 snapshot geçerli olduğu için bozulmaz.

- [ ] **Step 4: Test yeşil**
Run: aynı filtre.
Expected: PASS (3 test). Gerekirse `dotnet format` ile düzelt.

- [ ] **Step 5: Commit**
```bash
git add src/Oksis.Domain/Modules/Timetable/Entities/ScheduleProgram.cs tests/Oksis.Domain.UnitTests/Modules/Timetable/ScheduleProgramRestoreTests.cs
git commit -m "2026-06-14 feat,test: ScheduleProgram.RestoreFrom — snapshot'tan yeniden kurar + blok grupları + Revising + RestoredEvent."
```

---

## Task 3 (BE): `ListScheduleVersions` query + DTO + handler

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/DTOs/ScheduleVersionDtos.cs`
- Create: `src/Oksis.Application/Modules/Timetable/Queries/ListScheduleVersions/ListScheduleVersionsQuery.cs`
- Create: `.../ListScheduleVersions/ListScheduleVersionsQueryHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/ListScheduleVersionsTests.cs`

Desen: `ListScheduleExceptionsQuery`/`Handler` (okundu) — `IQueryHandler`, `db.AsNoTracking()`, `Result<T>`, `[Tenancy]`+`[RequirePermission]`.

- [ ] **Step 1: DTO** — `ScheduleVersionDtos.cs`
```csharp
namespace Oksis.Application.Modules.Timetable.DTOs;

public sealed record ScheduleVersionListItemDto(
    int Version,
    DateTimeOffset PublishedAt,
    string PublishedByName,
    string? Note,
    int PlacementCount);
```

- [ ] **Step 2: Query**
```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Queries.ListScheduleVersions;

[Tenancy(TenancyMode.Required)]
[RequirePermission("timetable.manage")]
public sealed record ListScheduleVersionsQuery(Guid ProgramId)
    : IQuery<IReadOnlyList<ScheduleVersionListItemDto>>;
```

- [ ] **Step 3: Failing test** — handler testi
Mevcut bir timetable query handler testini (`tests/Oksis.Application.UnitTests/Modules/Timetable/`) oku; `BuildMockDbSet` / NSubstitute desenini izle (gerçeklik notu: `.Returns(BuildMockDbSet())` inline KIRILIR → önce değişkene al). Test, iki `ScheduleVersion` verip `Version` desc sıralı döndüğünü ve `PublishedByName`'in çözüldüğünü (kişi yoksa "—") doğrular. Handler imzasını Step 4'ten al.

- [ ] **Step 4: Handler**
```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Timetable.Queries.ListScheduleVersions;

public sealed class ListScheduleVersionsQueryHandler(IApplicationDbContext db, ITenantContext tenant)
    : IQueryHandler<ListScheduleVersionsQuery, IReadOnlyList<ScheduleVersionListItemDto>>
{
    public async Task<Result<IReadOnlyList<ScheduleVersionListItemDto>>> Handle(
        ListScheduleVersionsQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result<IReadOnlyList<ScheduleVersionListItemDto>>.Forbidden();
        }

        var versions = await db.ScheduleVersions.AsNoTracking()
            .Where(v => v.ProgramId == request.ProgramId)
            .OrderByDescending(v => v.Version)
            .ToListAsync(cancellationToken);

        // PublishedBy (Guid) → kişi adı. Mevcut bir isim-çözüm desenini (ör. users/persons) izle;
        // çözülemeyen id → "—". Toplu çöz (N+1 yok): publishedBy id'lerini topla, tek sorgu.
        var personIds = versions.Select(v => v.PublishedBy).Distinct().ToList();
        var names = await ResolvePersonNames(db, personIds, cancellationToken); // Dictionary<Guid,string>

        var items = versions
            .Select(v => new ScheduleVersionListItemDto(
                v.Version, v.PublishedAt,
                names.TryGetValue(v.PublishedBy, out var n) ? n : "—",
                v.Note, v.PlacementCount))
            .ToList();

        return Result<IReadOnlyList<ScheduleVersionListItemDto>>.Success(items);
    }
}
```
> `ResolvePersonNames`: `db` üzerinden kişi/kullanıcı tablosundan ad çöz. Mevcut handler'larda (ör. `PublishedScheduleQueryHandler` veya available-teachers) öğretmen adı nasıl çözülüyorsa aynı tabloyu/deseni kullan. Çözüm tablosu bulunamıyorsa tüm adlar "—" (Debt notu) — ama önce `GetAvailableTeachers`'ın isim çözümünü incele, muhtemelen `db.Persons`/`db.Users` var.

- [ ] **Step 5: Test yeşil** + `dotnet build`
Run: `ASPNETCORE_ENVIRONMENT=Mac-Development dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~ListScheduleVersions"`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/Oksis.Application/Modules/Timetable/DTOs/ScheduleVersionDtos.cs src/Oksis.Application/Modules/Timetable/Queries/ListScheduleVersions/ tests/Oksis.Application.UnitTests/Modules/Timetable/ListScheduleVersionsTests.cs
git commit -m "2026-06-14 feat,test: ListScheduleVersions sorgusu — sürüm listesi (version desc) + publishedBy ad çözümü."
```

---

## Task 4 (BE): Saf `ComputeVersionDiff` + `GetScheduleVersionDiff` query

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/Queries/GetScheduleVersionDiff/ScheduleVersionDiff.cs` (saf)
- Create: `.../GetScheduleVersionDiff/GetScheduleVersionDiffQuery.cs`
- Create: `.../GetScheduleVersionDiff/GetScheduleVersionDiffQueryHandler.cs`
- DTO ekle: `ScheduleVersionDtos.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/VersionDiffTests.cs`

- [ ] **Step 1: DTO** — `ScheduleVersionDtos.cs` sonuna ekle
```csharp
public sealed record ScheduleVersionDiffRow(int Day, int Period, string SlotLabel, string? Was, string? Now);

public sealed record ScheduleVersionDiffDto(int Version, bool IsFirstVersion, IReadOnlyList<ScheduleVersionDiffRow> Rows);
```

- [ ] **Step 2: Saf diff fonksiyonu + failing test**
`ScheduleVersionDiff.cs` (saf, isim çözümü dışarıda — id'ler eşlenmiş gelir):
```csharp
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Queries.GetScheduleVersionDiff;

public static class ScheduleVersionDiff
{
    /// <summary>(Day,Period) anahtarına göre iki snapshot'ı kıyaslar. Değişen/eklenen/kaldırılan slotları
    /// "was"/"now" metinleriyle döndürür. `describe` bir placement'ı insanca metne çevirir (ders·öğretmen·derslik).</summary>
    public static IReadOnlyList<(int Day, int Period, string? Was, string? Now)> Compute(
        IReadOnlyList<PublishedLessonPlacementSnapshot> prev,
        IReadOnlyList<PublishedLessonPlacementSnapshot> cur,
        Func<PublishedLessonPlacementSnapshot, string> describe)
    {
        var prevBy = prev.ToDictionary(p => ((int)p.Day, p.Period));
        var curBy = cur.ToDictionary(p => ((int)p.Day, p.Period));
        var slots = prevBy.Keys.Union(curBy.Keys).OrderBy(k => k.Item1).ThenBy(k => k.Item2);

        var rows = new List<(int, int, string?, string?)>();
        foreach (var (day, period) in slots)
        {
            prevBy.TryGetValue((day, period), out var a);
            curBy.TryGetValue((day, period), out var b);
            var was = a is null ? null : describe(a);
            var now = b is null ? null : describe(b);
            if (was != now) rows.Add((day, period, was, now));
        }
        return rows;
    }
}
```
Test `VersionDiffTests.cs`:
```csharp
[Fact]
public void Compute_reports_changed_added_removed_slots()
{
    string D(PublishedLessonPlacementSnapshot p) => $"{p.SubjectId}|{p.TeacherId}";
    var t1 = Guid.NewGuid(); var t2 = Guid.NewGuid(); var s = Guid.NewGuid();
    var prev = new[] { Snap(DayOfWeek.Monday, 1, s, t1), Snap(DayOfWeek.Monday, 2, s, t1) };
    var cur  = new[] { Snap(DayOfWeek.Monday, 1, s, t2) /* changed */ /* (2 removed) */ };
    var rows = ScheduleVersionDiff.Compute(prev, cur, D);
    Assert.Equal(2, rows.Count); // 1 changed + 1 removed
    Assert.Contains(rows, r => r.Day == 1 && r.Period == 1 && r.Was != r.Now);
    Assert.Contains(rows, r => r.Period == 2 && r.Now is null);
}
// Snap = küçük helper: new PublishedLessonPlacementSnapshot(Guid.NewGuid(), day, period, subj, tch, null, false, null)
```

- [ ] **Step 3: Test kırmızı → yeşil** (saf fonksiyon)
Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~VersionDiff"`

- [ ] **Step 4: Query + Handler**
Query (`GetScheduleVersionDiffQuery(Guid ProgramId, int Version) : IQuery<ScheduleVersionDiffDto>` + `[Tenancy]`+`[RequirePermission("timetable.manage")]`).
Handler:
```csharp
public sealed class GetScheduleVersionDiffQueryHandler(IApplicationDbContext db, ITenantContext tenant)
    : IQueryHandler<GetScheduleVersionDiffQuery, ScheduleVersionDiffDto>
{
    public async Task<Result<ScheduleVersionDiffDto>> Handle(GetScheduleVersionDiffQuery request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null) return Result<ScheduleVersionDiffDto>.Forbidden();

        var cur = await db.ScheduleVersions.AsNoTracking()
            .FirstOrDefaultAsync(v => v.ProgramId == request.ProgramId && v.Version == request.Version, ct);
        if (cur is null) return Result<ScheduleVersionDiffDto>.NotFound();

        var curSnap = ScheduleSnapshotSerializer.TryDeserialize(cur.SnapshotJson);
        if (curSnap is null) return Result<ScheduleVersionDiffDto>.NotFound();

        var prev = await db.ScheduleVersions.AsNoTracking()
            .Where(v => v.ProgramId == request.ProgramId && v.Version < request.Version)
            .OrderByDescending(v => v.Version).FirstOrDefaultAsync(ct);

        if (prev is null)
        {
            return Result<ScheduleVersionDiffDto>.Success(
                new ScheduleVersionDiffDto(request.Version, true, []));
        }
        var prevSnap = ScheduleSnapshotSerializer.TryDeserialize(prev.SnapshotJson)!;

        // İsim sözlükleri (subject/teacher/room) — mevcut isim çözümü desenini kullan.
        var describe = await BuildDescriber(db, curSnap, prevSnap, ct); // Func<snapshot, string> "Ders·Öğretmen·Derslik"
        var diff = ScheduleVersionDiff.Compute(prevSnap.Placements, curSnap.Placements, describe);
        var rows = diff.Select(r => new ScheduleVersionDiffRow(
            r.Day, r.Period, $"{(DayOfWeek)r.Day} {r.Period}", r.Was, r.Now)).ToList();
        return Result<ScheduleVersionDiffDto>.Success(new ScheduleVersionDiffDto(request.Version, false, rows));
    }
}
```
> `BuildDescriber`: subject/teacher/room id'lerini topla, adlarını toplu çöz (ListScheduleVersions'taki ad çözümüyle aynı tablolar; room için `db.Rooms`), `p => "{subject}·{teacher}{·room?}"`. SlotLabel basit; FE i18n weekday ile yeniden adlandırabilir (Day index taşınıyor).

- [ ] **Step 5: Build + Commit**
```bash
git add src/Oksis.Application/Modules/Timetable/Queries/GetScheduleVersionDiff/ src/Oksis.Application/Modules/Timetable/DTOs/ScheduleVersionDtos.cs tests/Oksis.Application.UnitTests/Modules/Timetable/VersionDiffTests.cs
git commit -m "2026-06-14 feat,test: GetScheduleVersionDiff — vN vs v(N-1) satır-satır fark (saf Compute + handler, v1 ilk-yayın)."
```

---

## Task 5 (BE): `RestoreScheduleVersion` command + handler

**Files:**
- Create: `.../Commands/RestoreScheduleVersion/RestoreScheduleVersionCommand.cs`
- Create: `.../Commands/RestoreScheduleVersion/RestoreScheduleVersionCommandHandler.cs`
- DTO ekle: `ScheduleVersionDtos.cs` → `RestoreVersionResultDto`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/RestoreScheduleVersionTests.cs`

Desen: `RevokeScheduleExceptionCommandHandler` (okundu) + placement mutasyonu için `PlaceLessonCommandHandler`/`RemoveLessonCommandHandler`'daki occupancy + program yükleme (`db.SchedulePrograms.Include(p => p.Placements)`) desenini izle.

- [ ] **Step 1: DTO + Command**
```csharp
// ScheduleVersionDtos.cs
public sealed record RestoreVersionResultDto(Guid ProgramId, int RestoredFromVersion, string Status);
```
```csharp
[Tenancy(TenancyMode.Required)]
[RequirePermission("timetable.manage")]
public sealed record RestoreScheduleVersionCommand(Guid ProgramId, int Version)
    : ICommand<RestoreVersionResultDto>;
```

- [ ] **Step 2: Failing test** — `RestoreScheduleVersionTests.cs`
Mevcut bir command handler testini (transaction/db mock) izle. Kapsa: (a) başarı → program Revising + placement'lar snapshot'a eşit; (b) sürüm yok → NotFound; (c) çakışma (DB unique ihlali simülasyonu / domain) → Conflict. (Integration testi gerekiyorsa `Infrastructure.IntegrationTests`'te gerçek DB ile; birim seviyesinde mock db ile başarı + NotFound yeterli, conflict integration'a bırakılabilir — mevcut 2.5A exception integration test desenini izle.)

- [ ] **Step 3: Handler**
```csharp
public sealed class RestoreScheduleVersionCommandHandler(IApplicationDbContext db, ITenantContext tenant)
    : ICommandHandler<RestoreScheduleVersionCommand, RestoreVersionResultDto>
{
    public async Task<Result<RestoreVersionResultDto>> Handle(RestoreScheduleVersionCommand request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null) return Result<RestoreVersionResultDto>.Forbidden();

        var program = await db.SchedulePrograms
            .Include(p => p.Placements)
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId, ct);
        if (program is null) return Result<RestoreVersionResultDto>.NotFound();

        var version = await db.ScheduleVersions.AsNoTracking()
            .FirstOrDefaultAsync(v => v.ProgramId == request.ProgramId && v.Version == request.Version, ct);
        if (version is null) return Result<RestoreVersionResultDto>.NotFound();

        var snap = ScheduleSnapshotSerializer.TryDeserialize(version.SnapshotJson);
        if (snap is null) return Result<RestoreVersionResultDto>.NotFound();

        var inputs = snap.Placements
            .Select(p => new RestorePlacementInput(p.Day, p.Period, p.SubjectId, p.TeacherId, p.RoomId, p.IsBlock, p.BlockGroupId))
            .ToList();

        try
        {
            program.RestoreFrom(inputs);
            await db.SaveChangesAsync(ct); // DB filtreli unique index = çapraz çakışma backstop
        }
        catch (DbUpdateException)
        {
            return Result<RestoreVersionResultDto>.Conflict("timetable.errors.restore-conflict");
        }
        catch (Oksis.Domain.Modules.Timetable.Exceptions.TimetableDomainException ex)
        {
            return Result<RestoreVersionResultDto>.Conflict(ex.Code);
        }

        return Result<RestoreVersionResultDto>.Success(
            new RestoreVersionResultDto(program.Id, request.Version, program.Status.ToString()));
    }
}
```
> Occupancy index senkronu: `PlaceLessonCommandHandler`'da occupancy nasıl reserve/release ediliyorsa restore'da da eski aktifler için release + yeniler için reserve ekle (kaynak doğruluk DB index). Eğer occupancy entegrasyonu karmaşıksa, DB unique index zaten otoriter backstop (spec §7) — occupancy'yi rebuild/skip edip integration testiyle doğrula; bunu DONE_WITH_CONCERNS olarak raporla.

- [ ] **Step 4: Test yeşil + build**
- [ ] **Step 5: Commit**
```bash
git add src/Oksis.Application/Modules/Timetable/Commands/RestoreScheduleVersion/ src/Oksis.Application/Modules/Timetable/DTOs/ScheduleVersionDtos.cs tests/Oksis.Application.UnitTests/Modules/Timetable/RestoreScheduleVersionTests.cs
git commit -m "2026-06-14 feat,test: RestoreScheduleVersion komutu — snapshot'ı aktif programa Draft olarak yazar; çakışma 409, atomik."
```

---

## Task 6 (BE): Controller routes (3)

**Files:**
- Modify: `src/Oksis.Api/Controllers/V1/SchedulingController.cs`

- [ ] **Step 1: 3 route ekle** (mevcut exceptions route'larının hemen ardına, `ListExceptionsAsync` desenini izle):
```csharp
[HttpGet("programs/{id:guid}/versions")]
[ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ScheduleVersionListItemDto>>), StatusCodes.Status200OK)]
public async Task<IActionResult> ListVersionsAsync(Guid id, CancellationToken cancellationToken)
{
    var result = await sender.Send(new ListScheduleVersionsQuery(id), cancellationToken);
    return result.ToHttpResult(HttpContext);
}

[HttpGet("programs/{id:guid}/versions/{version:int}/diff")]
[ProducesResponseType(typeof(ApiResponse<ScheduleVersionDiffDto>), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
public async Task<IActionResult> GetVersionDiffAsync(Guid id, int version, CancellationToken cancellationToken)
{
    var result = await sender.Send(new GetScheduleVersionDiffQuery(id, version), cancellationToken);
    return result.ToHttpResult(HttpContext);
}

[HttpPost("programs/{id:guid}/versions/{version:int}/restore")]
[ProducesResponseType(typeof(ApiResponse<RestoreVersionResultDto>), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
[ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
public async Task<IActionResult> RestoreVersionAsync(Guid id, int version, CancellationToken cancellationToken)
{
    var result = await sender.Send(new RestoreScheduleVersionCommand(id, version), cancellationToken);
    return result.ToHttpResult(HttpContext);
}
```
Gerekli `using` (DTO + Query/Command namespace'leri) ekle.

- [ ] **Step 2: Build** `dotnet build Oksis.slnx --no-restore` → temiz.
- [ ] **Step 3: Tüm timetable testleri** `ASPNETCORE_ENVIRONMENT=Mac-Development dotnet test tests/Oksis.Application.UnitTests tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~Timetable"` → yeşil.
- [ ] **Step 4: Commit**
```bash
git add src/Oksis.Api/Controllers/V1/SchedulingController.cs
git commit -m "2026-06-14 feat: Sürüm geçmişi uçları — GET versions, GET versions/{v}/diff, POST versions/{v}/restore."
```

---

## Task 7 (FE): Tipler + API wrapper'ları

**Files:**
- Modify: `src/portals/admin/timetable/types.ts`
- Modify: `src/portals/admin/timetable/api/timetableApi.ts`
- Test: `src/portals/admin/timetable/api/__tests__/versionsApi.test.ts`

- [ ] **Step 1: types.ts sonuna ekle**
```ts
export interface ScheduleVersionListItemDto {
  version: number;
  publishedAt: string;
  publishedByName: string;
  note: string | null;
  placementCount: number;
}
export interface ScheduleVersionDiffRow {
  day: number; period: number; slotLabel: string; was: string | null; now: string | null;
}
export interface ScheduleVersionDiffDto {
  version: number; isFirstVersion: boolean; rows: ScheduleVersionDiffRow[];
}
export interface RestoreVersionResultDto { programId: string; restoredFromVersion: number; status: string; }
```

- [ ] **Step 2: Failing test** — `versionsApi.test.ts`
`exceptionsApi.test.ts` desenini birebir izle (httpClient mock, `{ data: { data } }` unwrap). 3 test: `listVersions` GET `/timetable/programs/p1/versions`; `getVersionDiff` GET `.../versions/3/diff`; `restoreVersion` POST `.../versions/3/restore`.

- [ ] **Step 3: timetableApi.ts'e ekle** (`createException` sonrası)
```ts
  listVersions: async (programId: string, signal?: AbortSignal): Promise<ScheduleVersionListItemDto[]> => {
    const res = await httpClient.get<ApiEnvelope<ScheduleVersionListItemDto[]>>(
      `/timetable/programs/${programId}/versions`, { signal });
    return res.data.data;
  },
  getVersionDiff: async (programId: string, version: number, signal?: AbortSignal): Promise<ScheduleVersionDiffDto> => {
    const res = await httpClient.get<ApiEnvelope<ScheduleVersionDiffDto>>(
      `/timetable/programs/${programId}/versions/${version}/diff`, { signal });
    return res.data.data;
  },
  restoreVersion: async (programId: string, version: number): Promise<RestoreVersionResultDto> => {
    const res = await httpClient.post<ApiEnvelope<RestoreVersionResultDto>>(
      `/timetable/programs/${programId}/versions/${version}/restore`, {});
    return res.data.data;
  },
```
İmport bloğuna yeni tipleri ekle.

- [ ] **Step 4: Test yeşil** `npm run test -- src/portals/admin/timetable/api/__tests__/versionsApi.test.ts`
- [ ] **Step 5: Commit**
```bash
git add src/portals/admin/timetable/types.ts src/portals/admin/timetable/api/timetableApi.ts src/portals/admin/timetable/api/__tests__/versionsApi.test.ts
git commit -m "2026-06-14 feat,test: Sürüm geçmişi FE tipleri + API wrapper'ları (listVersions/getVersionDiff/restoreVersion)."
```

---

## Task 8 (FE): i18n `versions.*`

**Files:**
- Modify: `src/shared/i18n/locales/tr/timetable.json` + `en/timetable.json`

- [ ] **Step 1: tr kök `timetable` objesine `versions` ekle**
```json
"versions": {
  "title": "Sürüm Geçmişi",
  "count": "{{count}} sürüm",
  "current": "Aktif çalışma",
  "editingNow": "Şu an bu sürümü düzenliyorsun",
  "compare": "Karşılaştır",
  "hideCompare": "Karşılaştırmayı gizle",
  "restore": "Geri yükle",
  "restoreConfirm": "v{{version}} geri yüklensin mi? Aktif taslağın üzerine yazılır, kaydedilmemiş değişiklikler kaybolur.",
  "restoring": "Geri yükleniyor…",
  "cancel": "Vazgeç",
  "diffTitle": "v{{version}}'te değişenler",
  "firstVersion": "İlk yayın",
  "was": "eski", "now": "yeni", "removed": "kaldırıldı", "added": "eklendi",
  "footerNote": "Her yayın yeni bir sürüm üretir. Geri yükleme mevcut taslağa kopyalanır — geçmiş silinmez.",
  "empty": "Henüz yayınlanmış sürüm yok.",
  "loadFailed": "Sürümler yüklenemedi.",
  "menuItem": "Sürüm geçmişi",
  "byLine": "{{name}} · {{when}}",
  "restoreFailed": "Sürüm geri yüklenemedi.",
  "restoreConflict": "Bu sürüm geri yüklenemiyor — öğretmen/derslik başka bir programda çakışıyor."
}
```

- [ ] **Step 2: en'e aynı yapıda İngilizce** (örn `"title":"Version History"`, `"menuItem":"Version history"`, `"restore":"Restore"`, `"compare":"Compare"`, vb.).

- [ ] **Step 3: JSON geçerli + `npm run build`** temiz.
- [ ] **Step 4: Commit**
```bash
git add src/shared/i18n/locales/tr/timetable.json src/shared/i18n/locales/en/timetable.json
git commit -m "2026-06-14 feat: Sürüm geçmişi i18n (timetable.versions.* tr/en)."
```

---

## Task 9 (FE): `VersionHistoryDrawer`

**Files:**
- Create: `src/portals/admin/timetable/components/VersionHistoryDrawer.tsx`
- Test: `src/portals/admin/timetable/components/__tests__/VersionHistoryDrawer.test.tsx`
- **Port kaynağı:** `/tmp/oksis_ders_v2/oksis-layout/project/app/schedule_more_actions.jsx` satır 170-269 (`VersionHistoryDrawer`). CSS sınıfları `.vh-*` — `PublishDrawer`/`tempChanges.css` desenine uygun yeni stiller `timetable.css`'e eklenir (bu task'ta inline değil; küçük bir `.vh-*` blok ekle veya mevcut drawer stillerini uyarla).

Props:
```ts
interface VersionHistoryDrawerProps {
  programId: string;
  className: string;          // "9-A"
  currentStatus: "Draft" | "Revising" | "Published";
  currentVersion: number;
  onClose: () => void;
  onRestored?: () => void;    // restore başarısında (program refetch)
}
```

- [ ] **Step 1: Failing test** (i18n import **6 seviye** `../../../../../shared/i18n` — bu dosya `components/__tests__/`'te, 5 seviye; DİKKAT: doğru derinliği `npm run test` ile doğrula, SubstituteModal testi `editor/components/__tests__` 6 seviyeydi; bu dosya `timetable/components/__tests__` → `../../../../../shared/i18n` (5 seviye)). React Query wrapper gerekir (mevcut `ScheduleHubPage.test.tsx`'teki QueryClientProvider helper'ını kullan). Test, `listVersions` mock'u 2 sürüm döndürünce sürümlerin render edildiğini + "Karşılaştır" tıklanınca `getVersionDiff` çağrıldığını + "Geri yükle" → teyit → `restoreVersion` mutation'ını doğrular.

- [ ] **Step 2: Implement** `VersionHistoryDrawer.tsx`:
- React Query: `useQuery` `listVersions(programId)` (tenant-scope key `["timetable","versions",programId]`).
- Sağ çekmece (`drawer-scrim` + `aside.stu.vh-drawer`), başlık `t("versions.title")` + `t("versions.count",{count})` + kapat (Escape + scrim).
- `currentStatus !== "Published"` ise en üste sentetik "Aktif çalışma" satırı (`t("versions.current")` + `t("versions.editingNow")`, pill `v{currentVersion}`; diff/restore yok).
- Her sürüm: pill `v{version}` + kim/ne zaman (`t("versions.byLine")`) + not. **Karşılaştır** toggle → lazy `useQuery` enabled-on-open `getVersionDiff(programId, version)` → satırlar (`was → now`, removed/added i18n). **Geri yükle** → inline teyit (`t("versions.restoreConfirm",{version})`) → `useMutation` `restoreVersion` → onSuccess invalidate `["timetable","versions",programId]` + program key + `onRestored?.()` + `onClose()`. Hata → `t("versions.restoreFailed")` / 409 kodu → `t("versions.restoreConflict")`.
- Durum varyantları: yükleniyor (skeleton), hata (retry `t("versions.loadFailed")`), boş (`t("versions.empty")`).
- Footer note `t("versions.footerNote")`. Tüm string i18n. `cn()` ile sınıflar.

- [ ] **Step 3: Test yeşil** + `npm run build`.
- [ ] **Step 4: Commit**
```bash
git add src/portals/admin/timetable/components/VersionHistoryDrawer.tsx src/portals/admin/timetable/components/__tests__/VersionHistoryDrawer.test.tsx src/portals/admin/timetable/timetable.css
git commit -m "2026-06-14 feat,test: VersionHistoryDrawer — sürüm zaman çizelgesi + lazy diff (Karşılaştır) + geri-yükle teyitli mutation."
```

---

## Task 10 (FE): Tetikleyiciler — Hub RowMenu + editör ⋯ menüsü

**Files:**
- Modify: `src/portals/admin/timetable/components/RowMenu.tsx` (`history` ikonu)
- Modify: `src/portals/admin/timetable/components/ClassProgramsTable.tsx` + `ScheduleHubPage.tsx` (RowMenu item + drawer state)
- Create: `src/portals/admin/timetable/editor/components/EditorMoreMenu.tsx`
- Modify: `src/portals/admin/timetable/editor/components/EditorToolbar.tsx` (⋯ menü) + `ScheduleEditorPage.tsx` (drawer state)
- Test: `src/portals/admin/timetable/__tests__/RowMenu.test.tsx` (mevcut — `history` item ekle) + `EditorMoreMenu` testi

- [ ] **Step 1: RowMenu `history` ikonu** — `RowMenu.tsx`:
`IconName` tipine `"history"` ekle; `ICONS`'a `history: History` (lucide-react `History`). Mevcut `RowMenu.test.tsx`'i oku; yeni icon'lu item render testini ekle (kırmızı→yeşil).

- [ ] **Step 2: Hub wiring** — `ClassProgramsTable`/`ScheduleHubPage`:
Satır menüsüne `{ key: "history", icon: "history", label: t("versions.menuItem"), onClick: () => openHistory(row.id) }`. Sayfada `const [historyProgramId, setHistoryProgramId] = useState<string | null>(null);` + render `{historyProgramId && <VersionHistoryDrawer programId={historyProgramId} className={...} currentStatus={...} currentVersion={...} onClose={() => setHistoryProgramId(null)} onRestored={refetch} />}`. (className/status/version row VM'den.)

- [ ] **Step 3: EditorMoreMenu** — `EditorMoreMenu.tsx` (Radix Popover, CellMenu portal `.stu` desenini izle):
⋯ tetikleyici + tek item "Sürüm geçmişi" (`t("versions.menuItem")`, `History` ikonu) → `onOpenHistory()`. (PDF/Sil render edilmez.) Küçük bileşen + test.

- [ ] **Step 4: Editor wiring** — `EditorToolbar` ⋯ butonu `EditorMoreMenu`'yü açar; `ScheduleEditorPage`'e `const [historyOpen, setHistoryOpen] = useState(false);` + render `{historyOpen && <VersionHistoryDrawer programId={id} className={data.className} currentStatus={data.status} currentVersion={data.version} onClose={() => setHistoryOpen(false)} onRestored={data.refetch} />}`.

- [ ] **Step 5: Testler yeşil** (`npm run test -- src/portals/admin/timetable`) + `npm run build`.
- [ ] **Step 6: Commit**
```bash
git add src/portals/admin/timetable/components/RowMenu.tsx src/portals/admin/timetable/components/ClassProgramsTable.tsx src/portals/admin/timetable/ScheduleHubPage.tsx src/portals/admin/timetable/editor/components/EditorMoreMenu.tsx src/portals/admin/timetable/editor/components/EditorToolbar.tsx src/portals/admin/timetable/ScheduleEditorPage.tsx src/portals/admin/timetable/__tests__/RowMenu.test.tsx src/portals/admin/timetable/editor/components/__tests__/EditorMoreMenu.test.tsx
git commit -m "2026-06-14 feat,test: Sürüm geçmişi tetikleyicileri — Hub RowMenu item + editör ⋯ menüsü (EditorMoreMenu)."
```

---

## Task 11: Tam paket + build + completion_status

- [ ] **Step 1: BE** `ASPNETCORE_ENVIRONMENT=Mac-Development dotnet test tests/Oksis.Application.UnitTests tests/Oksis.Domain.UnitTests` yeşil + `dotnet build Oksis.slnx --no-restore` temiz.
- [ ] **Step 2: FE** `npm run test` (tam) yeşil + `npm run build` temiz.
- [ ] **Step 3: completion_status güncelle** (`oksis` workspace repo): ilerleme bump (%95→~%96, Güncel 2026-06-14); ✅'a Sürüm Geçmişi (BE 3 uç + domain RestoreFrom; FE drawer + tetikleyiciler); ⚠️ sapma "Çoğalt iptal (öğretmen-tekilliği + zorunlu TeacherId)"; Debt "restore bildirimi Faz 2.6".
- [ ] **Step 4: api-contracts.md** (`modules/timetable/`): 3 yeni uç (P30/P31/P32) eklenir.
- [ ] **Step 5: Commit (workspace repo)**
```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/modules/timetable/completion_status.md .claude/docs/modules/timetable/api-contracts.md
git commit -m "2026-06-14 docs: Ders Programı Sürüm Geçmişi tamam — 3 uç + RestoreFrom + drawer; Çoğalt iptal sapması + Debt."
```

---

## Self-Review Notları
- **Spec coverage:** Tasarım §2 domain→T2; §3 application (3 slice)→T3/T4/T5; §4 API→T6; §5 FE→T7/T8/T9/T10; §6 test→her task+T11; §7 Debt/sapma→T11. DRY serializer→T1. ✅
- **Tip tutarlılığı:** `ScheduleVersionListItemDto`/`ScheduleVersionDiffDto`/`RestoreVersionResultDto` T3/T4/T5'te tanımlı, T6 controller + T7 FE'de aynı isimlerle. `RestorePlacementInput` T1'de, T2/T5'te kullanılır. `RestoreFrom` imzası T2'de, T5'te çağrılır. ✅
- **Placeholder:** Handler boilerplate "mevcut X handler'ını taklit et" + tam record/DTO/route/test ile somutlandı (kod tabanına özgü isim-çözümü `ResolvePersonNames`/`BuildDescriber` mevcut desene yönlendirildi — vague TODO değil, gerçek referans). İsim-çözüm tablosu implementer tarafından `GetAvailableTeachers`'tan doğrulanacak.
- **Bilinen risk:** Occupancy senkronu restore'da (T5) — DB unique index otoriter backstop; occupancy best-effort, integration testiyle doğrulanır (DONE_WITH_CONCERNS olası).
