# Sezon Rollover (Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sezon Yönetimi sihirbazının backend orkestrasyonunu kurmak — taslak kalıcılığı, önceki sezondan kopyalayarak sezon açma, aktivasyonda toplu öğrenci terfisi ve öğretmen görevlendirme kopyası.

**Architecture:** İki fazlı. Sihirbaz boyunca hafif `SeasonDraft` (tenant başına 1). "Sezonu Aç" → `OpenSeasonFromDraft` Setup sezon + dönemler + boş şubeler + tatilleri tek transaction'da materyalize eder. "Aktifleştir" → `ActivateSeasonRollover` orkestratörü mevcut Activate'i sarmalar ve bağımsız `PromoteStudents` (§4.9) + `CopyAssignmentsToNewSeason` (§5.9) slice'larını çağırır. Provenance için her yeni `ClassRoom`'a `SourceClassRoomId` eklenir.

**Tech Stack:** .NET 10 · EF Core 10 · MediatR · FluentValidation · Mapster · SQL Server · xUnit (Infrastructure.IntegrationTests). Mevcut `AcademicSessions` modül pattern'i (CreateAcademicSession slice) referanstır.

**Spec:** `docs/superpowers/specs/2026-06-08-sezon-rollover-design.md`. §4.9/§5.9 bağlayıcı (CLAUDE.md Absolute Rule #6).

**Kapsam dışı:** Frontend sihirbaz (ayrı plan: `2026-06-08-sezon-rollover-frontend.md`). Akademik Takvim etkinlikleri (Faz 2).

**Genel kurallar (her task için geçerli):**
- Her handler `async` + `CancellationToken`. Mapster (AutoMapper YOK). Repository wrapper YOK — `IApplicationDbContext`.
- Komut attribute'ları: `[Tenancy(TenancyMode.Required)]` + `[RequirePermission("...")]` (bkz. `CreateAcademicSessionCommand`).
- Build doğrulaması: her implementation adımından sonra `dotnet build` temiz olmalı.
- Commit formatı (OKSİS): `2026-06-08 <type>: Türkçe özet.` + ayrı satırda `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Çalışma dizini: `oksis-api/`. Migration komutu: `dotnet ef migrations add <YYYYMMDD_name> --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`.

**Bağımlılık sırası:** Task 1–3 (temel) → 4 → 5,6 (paralel) → 7 → 8.

---

## Task 1: `SeasonDraft` varlık + EF config + migration

**Files:**
- Create: `src/Oksis.Domain/Modules/AcademicSessions/Entities/SeasonDraft.cs`
- Create: `src/Oksis.Domain/Modules/AcademicSessions/ValueObjects/SeasonDraftId.cs`
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` (+`DbSet<SeasonDraft> SeasonDrafts`)
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (DbSet property)
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Academic/SeasonDraftConfiguration.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/AcademicSessions/SeasonDraftTests.cs`

- [ ] **Step 1: Write the failing test** — `SeasonDraftTests.cs`

```csharp
using Oksis.Domain.Modules.AcademicSessions.Entities;

namespace Oksis.Domain.UnitTests.Modules.AcademicSessions;

public sealed class SeasonDraftTests
{
    private static readonly Guid School = Guid.NewGuid();
    private static readonly Guid Source = Guid.NewGuid();

    [Fact]
    public void Create_sets_defaults_with_all_copy_flags_on()
    {
        var draft = SeasonDraft.Create(School, "2026-2027", Source);

        Assert.Equal("2026-2027", draft.Name);
        Assert.Equal(Source, draft.SourceSessionId);
        Assert.Equal(0, draft.CurrentStep);
        Assert.True(draft.CopyTerms);
        Assert.True(draft.CopyBranches);
        Assert.True(draft.CopyHolidays);
        Assert.True(draft.CopyAssignments);
        Assert.True(draft.CopySchedule);
        Assert.True(draft.ExcludePassiveStudents);
    }

    [Fact]
    public void UpdateProgress_overwrites_step_flags_and_json_payloads()
    {
        var draft = SeasonDraft.Create(School, "2026-2027", Source);

        draft.UpdateProgress(
            name: "2026-2027",
            currentStep: 3,
            copyTerms: true, copyBranches: false, copyHolidays: true,
            copyAssignments: false, copySchedule: false, excludePassive: false,
            termDatesJson: "{\"t1\":\"x\"}", branchMapJson: "[{\"to\":\"7-A\"}]", holidaysJson: null);

        Assert.Equal(3, draft.CurrentStep);
        Assert.False(draft.CopyBranches);
        Assert.False(draft.ExcludePassiveStudents);
        Assert.Equal("[{\"to\":\"7-A\"}]", draft.BranchMapJson);
        Assert.Null(draft.HolidaysJson);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SeasonDraftTests"`
Expected: FAIL — `SeasonDraft` does not exist (compile error).

- [ ] **Step 3: Create `SeasonDraftId.cs`** (strongly-typed id, mevcut `AcademicSessionId` deseni)

```csharp
namespace Oksis.Domain.Modules.AcademicSessions.ValueObjects;

public readonly record struct SeasonDraftId(Guid Value)
{
    public static SeasonDraftId New() => new(Guid.NewGuid());
    public static SeasonDraftId From(Guid value) => new(value);
}
```

- [ ] **Step 4: Create `SeasonDraft.cs`**

```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.AcademicSessions.ValueObjects;

namespace Oksis.Domain.Modules.AcademicSessions.Entities;

/// <summary>
/// Sezon Yönetimi sihirbazının sunucu tarafı taslağı. Tenant başına en fazla 1 kayıt
/// ("sıradaki planlama sezonu"). Ağır kayıt yazılmaz; yalnızca sihirbaz state'i tutulur.
/// "Sezonu Aç" sonrası silinir. Akademik Takvim "Planlanmamış↔Taslak" rozeti bunun varlığına bakar.
/// </summary>
public sealed class SeasonDraft : TenantEntity
{
    public const int MinNameLength = 4;
    public const int MaxNameLength = 20;

    public string Name { get; private set; } = default!;
    public Guid SourceSessionId { get; private set; }
    public int CurrentStep { get; private set; }
    public bool CopyTerms { get; private set; }
    public bool CopyBranches { get; private set; }
    public bool CopyHolidays { get; private set; }
    public bool CopyAssignments { get; private set; }
    public bool CopySchedule { get; private set; }
    public bool ExcludePassiveStudents { get; private set; }
    public string? TermDatesJson { get; private set; }
    public string? BranchMapJson { get; private set; }
    public string? HolidaysJson { get; private set; }

    private SeasonDraft() { } // EF Core

    public static SeasonDraft Create(Guid schoolId, string name, Guid sourceSessionId)
    {
        ValidateName(name);
        if (sourceSessionId == Guid.Empty)
            throw new ArgumentException("Kaynak sezon zorunludur.", nameof(sourceSessionId));

        return new SeasonDraft
        {
            Id = SeasonDraftId.New().Value,
            SchoolId = schoolId,
            Name = name.Trim(),
            SourceSessionId = sourceSessionId,
            CurrentStep = 0,
            CopyTerms = true,
            CopyBranches = true,
            CopyHolidays = true,
            CopyAssignments = true,
            CopySchedule = true,
            ExcludePassiveStudents = true
        };
    }

    public void UpdateProgress(
        string name, int currentStep,
        bool copyTerms, bool copyBranches, bool copyHolidays,
        bool copyAssignments, bool copySchedule, bool excludePassive,
        string? termDatesJson, string? branchMapJson, string? holidaysJson)
    {
        ValidateName(name);
        Name = name.Trim();
        CurrentStep = currentStep < 0 ? 0 : currentStep;
        CopyTerms = copyTerms;
        CopyBranches = copyBranches;
        CopyHolidays = copyHolidays;
        CopyAssignments = copyAssignments;
        CopySchedule = copySchedule;
        ExcludePassiveStudents = excludePassive;
        TermDatesJson = termDatesJson;
        BranchMapJson = branchMapJson;
        HolidaysJson = holidaysJson;
    }

    private static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Taslak adı boş olamaz.", nameof(name));
        var trimmed = name.Trim();
        if (trimmed.Length < MinNameLength || trimmed.Length > MaxNameLength)
            throw new ArgumentException($"Taslak adı {MinNameLength}-{MaxNameLength} karakter olmalı.", nameof(name));
    }
}
```

- [ ] **Step 5: Run domain test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SeasonDraftTests"`
Expected: PASS (2 tests).

- [ ] **Step 6: Add DbSet to `IApplicationDbContext`** — after `DbSet<ClassRoom> ClassRooms { get; }` (line ~75) add:

```csharp
    // Sezon Yönetimi sihirbaz taslağı (tenant başına 1). "Sezonu Aç" sonrası silinir.
    DbSet<SeasonDraft> SeasonDrafts { get; }
```

- [ ] **Step 7: Add DbSet to `OksisDbContext`** — mirror the interface property (copy existing `ClassRooms` DbSet declaration pattern in that file, name it `SeasonDrafts`).

- [ ] **Step 8: Create `SeasonDraftConfiguration.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.AcademicSessions.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Academic;

public sealed class SeasonDraftConfiguration : IEntityTypeConfiguration<SeasonDraft>
{
    public void Configure(EntityTypeBuilder<SeasonDraft> builder)
    {
        builder.ToAcademicTable("season_drafts");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(SeasonDraft.MaxNameLength).IsRequired();
        builder.Property(x => x.SourceSessionId).IsRequired();
        builder.Property(x => x.CurrentStep).IsRequired();
        builder.Property(x => x.CopyTerms).IsRequired();
        builder.Property(x => x.CopyBranches).IsRequired();
        builder.Property(x => x.CopyHolidays).IsRequired();
        builder.Property(x => x.CopyAssignments).IsRequired();
        builder.Property(x => x.CopySchedule).IsRequired();
        builder.Property(x => x.ExcludePassiveStudents).IsRequired();
        builder.Property(x => x.TermDatesJson);
        builder.Property(x => x.BranchMapJson);
        builder.Property(x => x.HolidaysJson);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        // Tenant başına 1 taslak (soft-delete hariç)
        builder.HasIndex(x => x.SchoolId)
            .IsUnique()
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ux_season_drafts_school");
    }
}
```

> Not: `ToAcademicTable` extension'ının `[academic]` şemasına yazdığını mevcut `ClassRoomConfiguration` doğrular; aynı helper kullanılır.

- [ ] **Step 9: Build**

Run: `dotnet build`
Expected: Build succeeded, 0 error.

- [ ] **Step 10: Create migration**

Run: `dotnet ef migrations add 20260608_add_season_drafts --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`
Expected: migration dosyası oluşur, `season_drafts` tablosu + `ux_season_drafts_school` index içerir.

- [ ] **Step 11: Commit**

```bash
git add src/Oksis.Domain/Modules/AcademicSessions/Entities/SeasonDraft.cs \
        src/Oksis.Domain/Modules/AcademicSessions/ValueObjects/SeasonDraftId.cs \
        src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs \
        src/Oksis.Infrastructure/Persistence/OksisDbContext.cs \
        src/Oksis.Infrastructure/Persistence/Configurations/Academic/SeasonDraftConfiguration.cs \
        src/Oksis.Infrastructure/Persistence/Migrations/ \
        tests/Oksis.Domain.UnitTests/Modules/AcademicSessions/SeasonDraftTests.cs
git commit -m "$(printf '2026-06-08 feat: SeasonDraft varlığı, EF config ve migration eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 2: `ClassRoom.SourceClassRoomId` provenance + migration

**Files:**
- Modify: `src/Oksis.Domain/Modules/AcademicSessions/Entities/ClassRoom.cs` (yeni nullable prop + Create overload param)
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Academic/ClassRoomConfiguration.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/AcademicSessions/ClassRoomTests.cs` (mevcutsa ekle; yoksa oluştur)

- [ ] **Step 1: Write the failing test**

```csharp
[Fact]
public void Create_with_source_classroom_sets_provenance()
{
    var source = Guid.NewGuid();
    var cr = ClassRoom.Create(
        schoolId: Guid.NewGuid(),
        academicSessionId: Guid.NewGuid(),
        gradeLevelId: Guid.NewGuid(),
        gradeLevelCode: "7",
        section: "A",
        capacity: 30,
        sourceClassRoomId: source);

    Assert.Equal(source, cr.SourceClassRoomId);
}

[Fact]
public void Create_without_source_leaves_provenance_null()
{
    var cr = ClassRoom.Create(
        Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "5", "A", 30, sourceClassRoomId: null);

    Assert.Null(cr.SourceClassRoomId);
}
```

> Mevcut `ClassRoom.Create` imzasını (line ~50) test'e göre uyarlayın; eski testler `sourceClassRoomId` argümanı eklenince kırılırsa onları `null` ile güncelleyin (geriye dönük varsayılan).

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~ClassRoomTests.Create_with_source"`
Expected: FAIL — `SourceClassRoomId` / yeni parametre yok.

- [ ] **Step 3: Add property + extend `Create`** in `ClassRoom.cs`

Property ekleyin (diğer prop'ların yanına, ~line 36):
```csharp
    /// <summary>
    /// Köken bağı: bu şube hangi kaynak şubeden terfi/klonla üretildi (Sezon Rollover).
    /// "Yeni şube" satırlarında null. Aktivasyondaki öğrenci terfisi bunu izler.
    /// </summary>
    public Guid? SourceClassRoomId { get; private set; }
```

`Create` factory'sine `Guid? sourceClassRoomId = null` parametresi ekleyin (son parametre) ve oluşturulan nesnede set edin:
```csharp
            SourceClassRoomId = sourceClassRoomId,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~ClassRoomTests"`
Expected: PASS.

- [ ] **Step 5: Map the column** in `ClassRoomConfiguration.cs` — after `HomeroomTeacherId` property (line ~35) add:

```csharp
        builder.Property(x => x.SourceClassRoomId);

        builder.HasIndex(x => x.SourceClassRoomId)
            .HasFilter("is_deleted = 0 AND source_class_room_id IS NOT NULL")
            .HasDatabaseName("ix_class_rooms_source");
```

- [ ] **Step 6: Build**

Run: `dotnet build`
Expected: 0 error (varsa CreateClassRoom handler'ı yeni opsiyonel parametreyle uyumlu — değişiklik gerekmez, default null).

- [ ] **Step 7: Create migration**

Run: `dotnet ef migrations add 20260608_add_classroom_source --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`
Expected: `source_class_room_id` nullable kolon + index.

- [ ] **Step 8: Commit**

```bash
git add src/Oksis.Domain/Modules/AcademicSessions/Entities/ClassRoom.cs \
        src/Oksis.Infrastructure/Persistence/Configurations/Academic/ClassRoomConfiguration.cs \
        src/Oksis.Infrastructure/Persistence/Migrations/ \
        tests/Oksis.Domain.UnitTests/Modules/AcademicSessions/ClassRoomTests.cs
git commit -m "$(printf '2026-06-08 feat: ClassRoom köken bağı (SourceClassRoomId) ve migration eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 3: SeasonDraft CQRS slice (Save / Get / Delete) + controller

**Files:**
- Create: `src/Oksis.Application/Modules/AcademicSessions/DTOs/SeasonDraftDto.cs`
- Create: `Commands/SaveSeasonDraft/SaveSeasonDraftCommand.cs` (+ `Handler.cs`, `Validator.cs`)
- Create: `Commands/DeleteSeasonDraft/DeleteSeasonDraftCommand.cs` (+ `Handler.cs`)
- Create: `Queries/GetSeasonDraft/GetSeasonDraftQuery.cs` (+ `Handler.cs`)
- Create: `src/Oksis.Api/Controllers/V1/SeasonDraftsController.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/SeasonDraftSliceTests.cs`

(Tüm namespace prefix'i: `Oksis.Application.Modules.AcademicSessions`)

- [ ] **Step 1: Write the failing integration test** — upsert-then-read round trip

```csharp
using Oksis.Application.Modules.AcademicSessions.Commands.SaveSeasonDraft;
using Oksis.Application.Modules.AcademicSessions.Queries.GetSeasonDraft;
// Harness: mevcut GetCurrentSessionQueryHandlerTests.cs ile aynı fixture/tenant kurulumunu izleyin.

public sealed class SeasonDraftSliceTests // : IClassFixture<...> (mevcut harness)
{
    [Fact]
    public async Task Save_then_Get_returns_persisted_draft()
    {
        // Arrange: tenant + bir aktif AcademicSession (sourceSessionId) seed'i — mevcut harness helper'ı.
        var sourceId = await SeedActiveSessionAsync();

        await Sender.Send(new SaveSeasonDraftCommand(
            Name: "2026-2027", SourceSessionId: sourceId, CurrentStep: 2,
            CopyTerms: true, CopyBranches: false, CopyHolidays: true,
            CopyAssignments: true, CopySchedule: true, ExcludePassiveStudents: false,
            TermDatesJson: null, BranchMapJson: "[]", HolidaysJson: null));

        var result = await Sender.Send(new GetSeasonDraftQuery());

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(2, result.Value!.CurrentStep);
        Assert.False(result.Value.CopyBranches);
    }

    [Fact]
    public async Task Save_twice_keeps_single_draft_per_tenant()
    {
        var sourceId = await SeedActiveSessionAsync();
        await Sender.Send(new SaveSeasonDraftCommand("2026-2027", sourceId, 1, true, true, true, true, true, true, null, null, null));
        await Sender.Send(new SaveSeasonDraftCommand("2026-2027", sourceId, 4, true, true, true, true, true, true, null, null, null));

        var count = await DbContext.SeasonDrafts.CountAsync();
        Assert.Equal(1, count);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SeasonDraftSliceTests"`
Expected: FAIL — komut/query tipleri yok.

- [ ] **Step 3: Create `SeasonDraftDto.cs`**

```csharp
namespace Oksis.Application.Modules.AcademicSessions.DTOs;

public sealed record SeasonDraftDto(
    Guid Id, string Name, Guid SourceSessionId, int CurrentStep,
    bool CopyTerms, bool CopyBranches, bool CopyHolidays, bool CopyAssignments, bool CopySchedule,
    bool ExcludePassiveStudents,
    string? TermDatesJson, string? BranchMapJson, string? HolidaysJson);
```

- [ ] **Step 4: Create `SaveSeasonDraftCommand.cs` + Validator**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.AcademicSessions.Commands.SaveSeasonDraft;

/// <summary>Sihirbaz taslağını upsert eder (tenant başına 1). "Taslağı Kaydet".</summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("academic-sessions.manage")]
public sealed record SaveSeasonDraftCommand(
    string Name, Guid SourceSessionId, int CurrentStep,
    bool CopyTerms, bool CopyBranches, bool CopyHolidays, bool CopyAssignments, bool CopySchedule,
    bool ExcludePassiveStudents,
    string? TermDatesJson, string? BranchMapJson, string? HolidaysJson) : ICommand<Guid>;
```

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.AcademicSessions.Commands.SaveSeasonDraft;

public sealed class SaveSeasonDraftCommandValidator : AbstractValidator<SaveSeasonDraftCommand>
{
    public SaveSeasonDraftCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(20).MinimumLength(4);
        RuleFor(x => x.SourceSessionId).NotEmpty();
        RuleFor(x => x.CurrentStep).InclusiveBetween(0, 5);
    }
}
```

- [ ] **Step 5: Create `SaveSeasonDraftCommandHandler.cs`** (upsert)

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.AcademicSessions.Commands.SaveSeasonDraft;

public sealed class SaveSeasonDraftCommandHandler(IApplicationDbContext db, ITenantContext tenant)
    : ICommandHandler<SaveSeasonDraftCommand, Guid>
{
    public async Task<Result<Guid>> Handle(SaveSeasonDraftCommand request, CancellationToken cancellationToken)
    {
        var schoolId = tenant.CurrentSchoolId;
        if (schoolId is null) return Result<Guid>.Forbidden();

        var existing = await db.SeasonDrafts.FirstOrDefaultAsync(cancellationToken);
        if (existing is null)
        {
            existing = SeasonDraft.Create(schoolId.Value, request.Name, request.SourceSessionId);
            db.SeasonDrafts.Add(existing);
        }

        existing.UpdateProgress(
            request.Name, request.CurrentStep,
            request.CopyTerms, request.CopyBranches, request.CopyHolidays,
            request.CopyAssignments, request.CopySchedule, request.ExcludePassiveStudents,
            request.TermDatesJson, request.BranchMapJson, request.HolidaysJson);

        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(existing.Id);
    }
}
```

> Tenant global query filter sayesinde `FirstOrDefaultAsync` yalnızca aktif okulun taslağını döndürür; `ux_season_drafts_school` tekilliği garanti eder.

- [ ] **Step 6: Create `GetSeasonDraftQuery.cs` + Handler** (Mapster ile DTO)

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.DTOs;

namespace Oksis.Application.Modules.AcademicSessions.Queries.GetSeasonDraft;

[Tenancy(TenancyMode.Required)]
[RequirePermission("academic-sessions.manage")]
public sealed record GetSeasonDraftQuery : IQuery<SeasonDraftDto?>;
```

```csharp
using Mapster;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.AcademicSessions.Queries.GetSeasonDraft;

public sealed class GetSeasonDraftQueryHandler(IApplicationDbContext db)
    : IQueryHandler<GetSeasonDraftQuery, SeasonDraftDto?>
{
    public async Task<Result<SeasonDraftDto?>> Handle(GetSeasonDraftQuery request, CancellationToken cancellationToken)
    {
        var draft = await db.SeasonDrafts.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        return Result<SeasonDraftDto?>.Success(draft?.Adapt<SeasonDraftDto>());
    }
}
```

> `IQuery`/`IQueryHandler` ve `Result` imzalarını mevcut `GetCurrentSessionQuery` ile birebir hizalayın (nullable T desteği için `GetCurrentSession` handler'ına bakın).

- [ ] **Step 7: Create `DeleteSeasonDraftCommand.cs` + Handler**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.AcademicSessions.Commands.DeleteSeasonDraft;

[Tenancy(TenancyMode.Required)]
[RequirePermission("academic-sessions.manage")]
public sealed record DeleteSeasonDraftCommand : ICommand;
```

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Shared;

namespace Oksis.Application.Modules.AcademicSessions.Commands.DeleteSeasonDraft;

public sealed class DeleteSeasonDraftCommandHandler(IApplicationDbContext db)
    : ICommandHandler<DeleteSeasonDraftCommand>
{
    public async Task<Result> Handle(DeleteSeasonDraftCommand request, CancellationToken cancellationToken)
    {
        var draft = await db.SeasonDrafts.FirstOrDefaultAsync(cancellationToken);
        if (draft is not null)
        {
            db.SeasonDrafts.Remove(draft); // soft-delete interceptor → is_deleted = 1
            await db.SaveChangesAsync(cancellationToken);
        }
        return Result.Success();
    }
}
```

> `ICommand` (dönüşsüz) ve `Result.Success()` imzasını mevcut `DeleteSchoolHoliday` slice'ından doğrulayın.

- [ ] **Step 8: Create `SeasonDraftsController.cs`** (mevcut `AcademicSessionsController` deseni)

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oksis.Api.Contracts;
using Oksis.Api.Extensions;
using Oksis.Application.Modules.AcademicSessions.Commands.DeleteSeasonDraft;
using Oksis.Application.Modules.AcademicSessions.Commands.SaveSeasonDraft;
using Oksis.Application.Modules.AcademicSessions.DTOs;
using Oksis.Application.Modules.AcademicSessions.Queries.GetSeasonDraft;

namespace Oksis.Api.Controllers.V1;

[ApiController]
[Route("api/v1/season-drafts")]
[Authorize]
[Produces("application/json")]
public sealed class SeasonDraftsController(ISender sender) : ControllerBase
{
    [HttpGet("current")]
    [ProducesResponseType(typeof(ApiResponse<SeasonDraftDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrentAsync(CancellationToken ct)
        => (await sender.Send(new GetSeasonDraftQuery(), ct)).ToHttpResult(HttpContext);

    [HttpPut("current")]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SaveAsync([FromBody] SaveSeasonDraftCommand command, CancellationToken ct)
        => (await sender.Send(command, ct)).ToHttpResult(HttpContext);

    [HttpDelete("current")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteAsync(CancellationToken ct)
        => (await sender.Send(new DeleteSeasonDraftCommand(), ct)).ToHttpResult(HttpContext);
}
```

- [ ] **Step 9: Run integration test to verify it passes**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SeasonDraftSliceTests"`
Expected: PASS (2 tests).

- [ ] **Step 10: Commit**

```bash
git add src/Oksis.Application/Modules/AcademicSessions/{DTOs,Commands,Queries} \
        src/Oksis.Api/Controllers/V1/SeasonDraftsController.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/SeasonDraftSliceTests.cs
git commit -m "$(printf '2026-06-08 feat: SeasonDraft CQRS slice (Save/Get/Delete) ve controller eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 4: `GetSeasonRolloverPreview` query (terfi haritası)

**Files:**
- Create: `Queries/GetSeasonRolloverPreview/GetSeasonRolloverPreviewQuery.cs` (+ `Handler.cs`)
- Create: `DTOs/SeasonRolloverPreviewDto.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AcademicSessionsController.cs` (yeni GET endpoint)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/SeasonRolloverPreviewTests.cs`

**Algoritma:** Kaynak sezonun aktif `ClassRoom`'larını al; her biri için okulun sunduğu (`SchoolGradeLevels`) bir üst `DisplayOrder`'lı grade'i bul → varsa **promote**, yoksa **graduate**. Okulun en alt grade'ine ait kaynak şubeleri **newBranch** olarak işaretle (öğrencileri yeni gelir). Öğrenci sayısı = `ClassRoomStudent` aktif (`LeftAt == null`) sayısı.

- [ ] **Step 1: Write the failing integration test**

```csharp
[Fact]
public async Task Preview_promotes_middle_grades_and_graduates_top_grade()
{
    // Arrange: okul 5..8 grade sunar; kaynak sezonda 6-A(29), 7-A(30), 8-A(28) şubeleri.
    var (sourceId, _) = await SeedSchoolWithBranchesAsync();

    var result = await Sender.Send(new GetSeasonRolloverPreviewQuery(sourceId));

    Assert.True(result.IsSuccess);
    var rows = result.Value!.Rows;
    Assert.Contains(rows, r => r.FromLabel == "6-A" && r.ToSection == "A" && r.Kind == "Promote");
    Assert.Contains(rows, r => r.FromLabel == "8-A" && r.Kind == "Graduate");
    Assert.Equal(28, result.Value.Summary.GraduatingStudents);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SeasonRolloverPreviewTests"`
Expected: FAIL — query yok.

- [ ] **Step 3: Create `SeasonRolloverPreviewDto.cs`**

```csharp
namespace Oksis.Application.Modules.AcademicSessions.DTOs;

public sealed record SeasonRolloverPreviewRowDto(
    Guid SourceClassRoomId, string FromLabel, int StudentCount,
    Guid? ToGradeLevelId, string? ToSection, string Kind); // Kind: "Promote" | "Graduate" | "NewBranch"

public sealed record SeasonRolloverSummaryDto(
    int PromotedBranches, int GraduatingStudents, int NewBottomBranches);

public sealed record SeasonRolloverPreviewDto(
    IReadOnlyList<SeasonRolloverPreviewRowDto> Rows, SeasonRolloverSummaryDto Summary);
```

- [ ] **Step 4: Create `GetSeasonRolloverPreviewQuery.cs`**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.DTOs;

namespace Oksis.Application.Modules.AcademicSessions.Queries.GetSeasonRolloverPreview;

[Tenancy(TenancyMode.Required)]
[RequirePermission("academic-sessions.manage")]
public sealed record GetSeasonRolloverPreviewQuery(Guid SourceSessionId) : IQuery<SeasonRolloverPreviewDto>;
```

- [ ] **Step 5: Create `GetSeasonRolloverPreviewQueryHandler.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.DTOs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.AcademicSessions.Queries.GetSeasonRolloverPreview;

public sealed class GetSeasonRolloverPreviewQueryHandler(IApplicationDbContext db)
    : IQueryHandler<GetSeasonRolloverPreviewQuery, SeasonRolloverPreviewDto>
{
    public async Task<Result<SeasonRolloverPreviewDto>> Handle(
        GetSeasonRolloverPreviewQuery request, CancellationToken cancellationToken)
    {
        // Okulun sunduğu grade'ler (DisplayOrder ile sıralı). master.grade_levels join.
        var grades = await (
            from sgl in db.SchoolGradeLevels.AsNoTracking()
            join gl in db.GradeLevels.AsNoTracking() on sgl.GradeLevelId equals gl.Id
            orderby gl.DisplayOrder
            select new { gl.Id, gl.Code, gl.DisplayOrder }).ToListAsync(cancellationToken);

        if (grades.Count == 0)
            return Result<SeasonRolloverPreviewDto>.Failure(
                new Error("academic-sessions.errors.no-grade-levels", "Okul için sınıf kademesi tanımlı değil."));

        var minOrder = grades.Min(g => g.DisplayOrder);
        var byOrder = grades.ToDictionary(g => g.DisplayOrder);

        var branches = await db.ClassRooms.AsNoTracking()
            .Where(c => c.AcademicSessionId == request.SourceSessionId
                        && c.Status == ClassRoomStatus.Active)
            .Select(c => new
            {
                c.Id, c.Section, c.GradeLevelId,
                Active = c.Students.Count(s => s.LeftAt == null)
            })
            .ToListAsync(cancellationToken);

        var rows = new List<SeasonRolloverPreviewRowDto>();
        foreach (var b in branches)
        {
            var grade = grades.First(g => g.Id == b.GradeLevelId);
            var fromLabel = $"{grade.Code}-{b.Section}";

            if (grade.DisplayOrder == minOrder)
            {
                rows.Add(new SeasonRolloverPreviewRowDto(
                    b.Id, fromLabel, b.Active, grade.Id, b.Section, "NewBranch"));
                continue;
            }
            if (byOrder.TryGetValue(grade.DisplayOrder + 1, out var next))
            {
                rows.Add(new SeasonRolloverPreviewRowDto(
                    b.Id, fromLabel, b.Active, next.Id, b.Section, "Promote"));
            }
            else
            {
                rows.Add(new SeasonRolloverPreviewRowDto(
                    b.Id, fromLabel, b.Active, null, null, "Graduate"));
            }
        }

        var summary = new SeasonRolloverSummaryDto(
            PromotedBranches: rows.Count(r => r.Kind == "Promote"),
            GraduatingStudents: rows.Where(r => r.Kind == "Graduate").Sum(r => r.StudentCount),
            NewBottomBranches: rows.Count(r => r.Kind == "NewBranch"));

        return Result<SeasonRolloverPreviewDto>.Success(new SeasonRolloverPreviewDto(rows, summary));
    }
}
```

> NewBranch satırı: en alt kademe kaynağın boş klonu (aynı section) için hedef üretir; gelen öğrenciler aktivasyonda değil, yıl içi kayıtla doldurulur.

- [ ] **Step 6: Add controller endpoint** in `AcademicSessionsController.cs` (using ekleyin + action):

```csharp
    [HttpGet("{sourceId:guid}/rollover-preview")]
    [ProducesResponseType(typeof(ApiResponse<SeasonRolloverPreviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRolloverPreviewAsync(Guid sourceId, CancellationToken ct)
        => (await sender.Send(new GetSeasonRolloverPreviewQuery(sourceId), ct)).ToHttpResult(HttpContext);
```

- [ ] **Step 7: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SeasonRolloverPreviewTests"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/Oksis.Application/Modules/AcademicSessions/Queries/GetSeasonRolloverPreview \
        src/Oksis.Application/Modules/AcademicSessions/DTOs/SeasonRolloverPreviewDto.cs \
        src/Oksis.Api/Controllers/V1/AcademicSessionsController.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/SeasonRolloverPreviewTests.cs
git commit -m "$(printf '2026-06-08 feat: Sezon rollover terfi haritası önizleme query'\''si eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 5: `OpenSeasonFromDraft` komutu (yapı materyalizasyonu)

**Files:**
- Create: `Commands/OpenSeasonFromDraft/OpenSeasonFromDraftCommand.cs` (+ `Handler.cs`, `Validator.cs`)
- Create: `DTOs/BranchMapEntry.cs` (taslak JSON deserialize tipi)
- Modify: `AcademicSessionsController.cs` (POST `open-from-draft`)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/OpenSeasonFromDraftTests.cs`

**Davranış (tek transaction):** Taslağı oku → `AcademicSession.Create` (Setup) → `CopyBranches` ise nihai haritadaki her **hedefli** satır için `ClassRoom.Create(..., sourceClassRoomId)` → `CopyHolidays` ise taslak tatilleri + resmi tatiller (Task 8 sonrası) → taslağı sil → tek `SaveChangesAsync`.

- [ ] **Step 1: Write the failing integration test**

```csharp
[Fact]
public async Task Open_creates_setup_session_with_empty_promoted_branches_and_clears_draft()
{
    var sourceId = await SeedSchoolWithBranchesAsync(); // 6-A,7-A,8-A
    await Sender.Send(new SaveSeasonDraftCommand(
        "2026-2027", sourceId, 5, true, true, true, true, true, true,
        TermDatesJson: ValidTermDatesJson(), BranchMapJson: null, HolidaysJson: null));

    var result = await Sender.Send(new OpenSeasonFromDraftCommand());

    Assert.True(result.IsSuccess);
    var newSession = await DbContext.AcademicSessions
        .FirstAsync(s => s.Id == result.Value);
    Assert.Equal(AcademicSessionStatus.Setup, newSession.Status);

    var newBranches = await DbContext.ClassRooms
        .Where(c => c.AcademicSessionId == result.Value).ToListAsync();
    Assert.Contains(newBranches, c => c.FullName == "7-A" && c.SourceClassRoomId != null); // 6-A→7-A
    Assert.DoesNotContain(newBranches, c => c.FullName.StartsWith("9")); // 8-A graduates, no 9
    Assert.Equal(0, await DbContext.SeasonDrafts.CountAsync()); // draft cleared
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~OpenSeasonFromDraftTests"`
Expected: FAIL — komut yok.

- [ ] **Step 3: Create `BranchMapEntry.cs`** (override JSON şeması; preview row ile uyumlu)

```csharp
namespace Oksis.Application.Modules.AcademicSessions.DTOs;

/// <summary>Taslak BranchMapJson satırı. Override edilmemişse handler preview'i yeniden hesaplar.</summary>
public sealed record BranchMapEntry(
    Guid SourceClassRoomId, Guid? ToGradeLevelId, string? ToSection, int Capacity, string Kind);
```

- [ ] **Step 4: Create `OpenSeasonFromDraftCommand.cs` + Validator**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.AcademicSessions.Commands.OpenSeasonFromDraft;

/// <summary>"Sezonu Aç": taslaktan Setup sezon + dönemler + boş şubeler + tatiller materyalize eder.</summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("academic-sessions.create")]
public sealed record OpenSeasonFromDraftCommand : ICommand<Guid>;
```

```csharp
using FluentValidation;
namespace Oksis.Application.Modules.AcademicSessions.Commands.OpenSeasonFromDraft;
// Parametre yok — validasyon handler'da taslak içeriği üzerinden (taslak gevşek tutulur).
public sealed class OpenSeasonFromDraftCommandValidator : AbstractValidator<OpenSeasonFromDraftCommand>
{
    public OpenSeasonFromDraftCommandValidator() { }
}
```

- [ ] **Step 5: Create `OpenSeasonFromDraftCommandHandler.cs`**

```csharp
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.DTOs;
using Oksis.Application.Modules.AcademicSessions.Queries.GetSeasonRolloverPreview;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.AcademicSessions.Exceptions;
using Oksis.Shared;
using MediatR;

namespace Oksis.Application.Modules.AcademicSessions.Commands.OpenSeasonFromDraft;

/// <summary>
/// Taslaktan Setup sezon materyalize eder (yapı: dönemler + boş şubeler + tatiller).
/// Öğrenci terfisi/görevlendirme KOPYALANMAZ — onlar aktivasyonda (Task 7).
/// Tek transaction: tüm Add'ler tek SaveChangesAsync ile atomik yazılır.
/// </summary>
public sealed class OpenSeasonFromDraftCommandHandler(
    IApplicationDbContext db, ITenantContext tenant, ISender sender)
    : ICommandHandler<OpenSeasonFromDraftCommand, Guid>
{
    private record TermDates(DateOnly Start, DateOnly End,
        DateOnly T1Start, DateOnly T1End, DateOnly T2Start, DateOnly T2End);

    public async Task<Result<Guid>> Handle(OpenSeasonFromDraftCommand request, CancellationToken cancellationToken)
    {
        var schoolId = tenant.CurrentSchoolId;
        if (schoolId is null) return Result<Guid>.Forbidden();

        var draft = await db.SeasonDrafts.FirstOrDefaultAsync(cancellationToken);
        if (draft is null)
            return Result<Guid>.Failure(new Error("academic-sessions.errors.no-draft", "Açılacak sezon taslağı yok."));

        if (await db.AcademicSessions.AsNoTracking().AnyAsync(s => s.Name == draft.Name, cancellationToken))
            return Result<Guid>.Conflict("academic-sessions.errors.duplicate-name");

        if (draft.TermDatesJson is null)
            return Result<Guid>.Failure(new Error("academic-sessions.errors.term-dates-missing", "Dönem tarihleri eksik."));
        var td = JsonSerializer.Deserialize<TermDates>(draft.TermDatesJson)!;

        var termTypes = await db.AcademicTermTypes.AsNoTracking()
            .OrderBy(t => t.DisplayOrder).Take(2).Select(t => t.Id).ToListAsync(cancellationToken);
        if (termTypes.Count < 2)
            return Result<Guid>.Failure(new Error("academic-sessions.errors.term-types-missing", "Dönem tipleri seed edilmemiş."));

        AcademicSession session;
        try
        {
            session = AcademicSession.Create(
                schoolId.Value, draft.Name, td.Start, td.End,
                termTypes[0], td.T1Start, td.T1End, termTypes[1], td.T2Start, td.T2End);
        }
        catch (AcademicSessionsDomainException ex)
        {
            return Result<Guid>.Failure(new Error(ex.Code, ex.Message));
        }
        db.AcademicSessions.Add(session);

        if (draft.CopyBranches)
        {
            var map = await ResolveBranchMap(draft, cancellationToken);
            if (map.IsFailure) return Result<Guid>.Failure(map.Error);
            foreach (var entry in map.Value!.Where(e => e.ToGradeLevelId is not null))
            {
                var code = await db.GradeLevels.AsNoTracking()
                    .Where(g => g.Id == entry.ToGradeLevelId!.Value).Select(g => g.Code)
                    .FirstAsync(cancellationToken);
                var cr = ClassRoom.Create(
                    schoolId.Value, session.Id, entry.ToGradeLevelId!.Value, code,
                    entry.ToSection!, entry.Capacity <= 0 ? 30 : entry.Capacity,
                    sourceClassRoomId: entry.SourceClassRoomId);
                db.ClassRooms.Add(cr);
            }
        }

        // Tatiller: CopyHolidays açıksa taslak HolidaysJson + resmi tatiller (Task 8) burada eklenir.
        // (Task 8 tamamlanınca bu blok official-holiday üretimini de çağırır.)

        db.SeasonDrafts.Remove(draft);
        await db.SaveChangesAsync(cancellationToken);
        return Result<Guid>.Success(session.Id);
    }

    /// Override map (BranchMapJson) varsa onu; yoksa preview'i yeniden hesaplayıp BranchMapEntry'e çevirir.
    private async Task<Result<List<BranchMapEntry>>> ResolveBranchMap(SeasonDraft draft, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(draft.BranchMapJson))
        {
            var entries = JsonSerializer.Deserialize<List<BranchMapEntry>>(draft.BranchMapJson!)!;
            return Result<List<BranchMapEntry>>.Success(entries);
        }
        var preview = await sender.Send(new GetSeasonRolloverPreviewQuery(draft.SourceSessionId), ct);
        if (preview.IsFailure) return Result<List<BranchMapEntry>>.Failure(preview.Error);
        var mapped = preview.Value!.Rows.Select(r =>
            new BranchMapEntry(r.SourceClassRoomId, r.ToGradeLevelId, r.ToSection, 30, r.Kind)).ToList();
        return Result<List<BranchMapEntry>>.Success(mapped);
    }
}
```

> Transaction: MediatR `TransactionBehavior` (pipeline, commands only) tüm handler'ı tek DB transaction'da sarar — `architecture-rules.md`. Ek `BeginTransaction` gerekmez.

- [ ] **Step 6: Add controller endpoint**

```csharp
    [HttpPost("open-from-draft")]
    [ProducesResponseType(typeof(ApiResponse<Guid>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> OpenFromDraftAsync(CancellationToken ct)
    {
        var result = await sender.Send(new OpenSeasonFromDraftCommand(), ct);
        if (result.IsSuccess)
        {
            var correlationId = HttpContext.Response.Headers["X-Correlation-Id"].ToString();
            return StatusCode(StatusCodes.Status201Created,
                ApiResponse<object>.Ok(new { id = result.Value, status = "Setup" }, correlationId));
        }
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 7: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~OpenSeasonFromDraftTests"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/Oksis.Application/Modules/AcademicSessions/Commands/OpenSeasonFromDraft \
        src/Oksis.Application/Modules/AcademicSessions/DTOs/BranchMapEntry.cs \
        src/Oksis.Api/Controllers/V1/AcademicSessionsController.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/OpenSeasonFromDraftTests.cs
git commit -m "$(printf '2026-06-08 feat: OpenSeasonFromDraft komutu (yapı materyalizasyonu) eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 6: `PromoteStudents` slice (§4.9) — bağımsız, idempotent

**Files:**
- Create: `src/Oksis.Application/Modules/Students/Commands/PromoteStudents/PromoteStudentsCommand.cs` (+ `Handler.cs`)
- Create: `src/Oksis.Application/Modules/Students/` klasör yapısı (yoksa)
- Modify: `PermissionSeedData.cs` + `RolePermissionSeedData.cs` (`students.promote` izni + admin grant) + migration
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/PromoteStudentsTests.cs`

**Davranış:** Hedef sezonun (`targetSessionId`) boş şubelerini `SourceClassRoomId` ile indeksle. Kaynak sezonun aktif `ClassRoomStudent`'larını gez: kaynağın hedefi varsa (Promote) → hedef `ClassRoom.AssignStudent(studentId, now, Reason.Initial, null)`. Hedefi yoksa (Graduate/terminal) → kaynak `ClassRoom.RemoveStudent(studentId, now, Reason.Graduation, null)`. `excludePassive` → pasif öğrenci atla. **Idempotent:** hedefte zaten aktif kaydı olan öğrenciyi atlar (domain zaten `AlreadyAssigned` fırlatır; handler önce kontrol eder).

- [ ] **Step 1: Write the failing integration test**

```csharp
[Fact]
public async Task Promote_moves_active_students_to_target_branches_and_graduates_terminal()
{
    // Arrange: kaynak sezon 6-A(2 öğrenci), 8-A(1 öğrenci); hedef sezon Open'dan gelen boş 7-A (SourceClassRoomId=6-A).
    var (sourceId, targetId) = await SeedSourceAndOpenedTargetAsync();

    var result = await Sender.Send(new PromoteStudentsCommand(targetId, ExcludePassive: true));

    Assert.True(result.IsSuccess);
    Assert.Equal(2, result.Value!.Promoted);
    Assert.Equal(1, result.Value.Graduated);

    var target7A = await DbContext.ClassRooms.Include("_students")
        .FirstAsync(c => c.AcademicSessionId == targetId && c.FullName == "7-A");
    Assert.Equal(2, target7A.Students.Count(s => s.IsActive));
}

[Fact]
public async Task Promote_is_idempotent_on_second_run()
{
    var (_, targetId) = await SeedSourceAndOpenedTargetAsync();
    await Sender.Send(new PromoteStudentsCommand(targetId, true));
    var second = await Sender.Send(new PromoteStudentsCommand(targetId, true));
    Assert.True(second.IsSuccess);
    Assert.Equal(0, second.Value!.Promoted); // already promoted
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~PromoteStudentsTests"`
Expected: FAIL — komut yok.

- [ ] **Step 3: Create `PromoteStudentsCommand.cs`**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Students.Commands.PromoteStudents;

/// <summary>
/// §4.9 Sezon terfisi: kaynak sezonun aktif Enrollment'larını hedef sezonun şubelerine
/// (SourceClassRoomId eşlemesiyle) taşır; terminal kademeyi mezun eder. Idempotent.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("students.promote")]
public sealed record PromoteStudentsCommand(Guid TargetSessionId, bool ExcludePassive)
    : ICommand<PromoteStudentsResult>;

public sealed record PromoteStudentsResult(int Promoted, int Graduated, int Skipped);
```

- [ ] **Step 4: Create `PromoteStudentsCommandHandler.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Students.Commands.PromoteStudents;

public sealed class PromoteStudentsCommandHandler(
    IApplicationDbContext db, ITenantContext tenant, TimeProvider clock)
    : ICommandHandler<PromoteStudentsCommand, PromoteStudentsResult>
{
    public async Task<Result<PromoteStudentsResult>> Handle(
        PromoteStudentsCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is null) return Result<PromoteStudentsResult>.Forbidden();
        var now = clock.GetUtcNow();

        var target = await db.AcademicSessions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == request.TargetSessionId, cancellationToken);
        if (target is null)
            return Result<PromoteStudentsResult>.NotFound("academic-sessions.errors.not-found");

        // Hedef şubeler (boş, Open'dan): SourceClassRoomId → target ClassRoom (tracked + Students, AssignStudent için).
        var targetBranches = await db.ClassRooms
            .Include(c => c.Students)
            .Where(c => c.AcademicSessionId == request.TargetSessionId && c.SourceClassRoomId != null)
            .ToListAsync(cancellationToken);
        var bySource = targetBranches.ToDictionary(c => c.SourceClassRoomId!.Value);

        // Kaynak şubeler: hedeflerin SourceClassRoomId'leri (tracked + Students — RemoveStudent için).
        var sourceClassRoomIds = bySource.Keys.ToList();
        var sources = await db.ClassRooms
            .Include(c => c.Students)
            .Where(c => sourceClassRoomIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        // Pasif öğrenci filtresi için aktif olmayan Person id'leri.
        var passiveIds = request.ExcludePassive
            ? await db.Persons.AsNoTracking()
                .Where(p => p.LifecycleState != PersonLifecycleState.Active)
                .Select(p => p.Id).ToListAsync(cancellationToken)
            : new List<Guid>();
        var passiveSet = passiveIds.ToHashSet();

        int promoted = 0, graduated = 0, skipped = 0;

        foreach (var src in sources)
        {
            var activeStudents = src.Students.Where(s => s.IsActive).Select(s => s.StudentId).ToList();
            bySource.TryGetValue(src.Id, out var dest); // null → graduate

            foreach (var studentId in activeStudents)
            {
                if (passiveSet.Contains(studentId)) { skipped++; continue; }

                if (dest is not null)
                {
                    if (dest.Students.Any(s => s.StudentId == studentId && s.IsActive)) { skipped++; continue; }
                    dest.AssignStudent(studentId, now, AssignmentReason.Initial, null);
                    promoted++;
                }
                else
                {
                    src.RemoveStudent(studentId, now, AssignmentReason.Graduation, null);
                    graduated++;
                }
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return Result<PromoteStudentsResult>.Success(new PromoteStudentsResult(promoted, graduated, skipped));
    }
}
```

> `Students` owned koleksiyonu `PropertyAccessMode.Field` ile map'li; tracked sorgularda `.Include(c => c.Students)` ile yüklenir (yukarıda yapıldı). Test'te de `Include(c => c.Students)` kullanın.
>
> `PersonLifecycleState.Active` ve `Person.LifecycleState` imzasını `Person.cs` ile doğrulayın. `TimeProvider clock` DI'ı mevcut handler'larda kullanılıyorsa onu izleyin; yoksa `DateTimeOffset.UtcNow`.

- [ ] **Step 5: Add `students.promote` permission seed** in `PermissionSeedData.cs` (mevcut `academic-sessions.*` izin satır desenini izleyerek bir kayıt ekleyin) ve `RolePermissionSeedData.cs`'te School_Admin rolüne grant edin. Sonra:

Run: `dotnet ef migrations add 20260608_add_students_promote_permission --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`

- [ ] **Step 6: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~PromoteStudentsTests"`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add src/Oksis.Application/Modules/Students/Commands/PromoteStudents \
        src/Oksis.Infrastructure/Persistence/Seed/ \
        src/Oksis.Infrastructure/Persistence/Migrations/ \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/PromoteStudentsTests.cs
git commit -m "$(printf '2026-06-08 feat: PromoteStudents toplu sezon terfi komutu (§4.9) eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 7: `CopyAssignmentsToNewSeason` slice (§5.9)

**Files:**
- Create: `src/Oksis.Application/Modules/Teachers/Commands/CopyAssignmentsToNewSeason/CopyAssignmentsToNewSeasonCommand.cs` (+ `Handler.cs`)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/CopyAssignmentsTests.cs`

**Davranış:** Kaynak sezonun aktif `TeachingAssignment`'larını gez; her birinin `ClassRoomId`'sine karşılık gelen hedef şubeyi `SourceClassRoomId == sourceClassRoomId` ile bul. Hedef varsa `TeachingAssignment.Create(schoolId, targetSessionId, teacherId, targetClassRoomId, subjectId, weeklyHours)`. Mezun olan (hedefsiz) şubenin görevlendirmesi taşınmaz. Idempotent: hedef sezonda aynı (teacher, class, subject) aktif varsa atla.

- [ ] **Step 1: Write the failing integration test**

```csharp
[Fact]
public async Task Copy_clones_active_assignments_to_target_branches()
{
    // Arrange: kaynak sezonda 6-A Matematik (Ahmet, 4 saat); hedefte boş 7-A (SourceClassRoomId=6-A).
    var (sourceId, targetId) = await SeedAssignmentsAndOpenedTargetAsync();

    var result = await Sender.Send(new CopyAssignmentsToNewSeasonCommand(sourceId, targetId));

    Assert.True(result.IsSuccess);
    Assert.Equal(1, result.Value!.Copied);
    var copied = await DbContext.TeachingAssignments
        .FirstAsync(a => a.AcademicSessionId == targetId && a.IsActive);
    Assert.Equal(4, copied.WeeklyHours);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CopyAssignmentsTests"`
Expected: FAIL — komut yok.

- [ ] **Step 3: Create `CopyAssignmentsToNewSeasonCommand.cs`**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Teachers.Commands.CopyAssignmentsToNewSeason;

/// <summary>§5.9: kaynak sezonun aktif görevlendirmelerini hedef sezonun şubelerine klonlar.</summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("teachers.assign")]
public sealed record CopyAssignmentsToNewSeasonCommand(Guid SourceSessionId, Guid TargetSessionId)
    : ICommand<CopyAssignmentsResult>;

public sealed record CopyAssignmentsResult(int Copied, int Skipped);
```

> `teachers.assign` izninin var olduğunu `PermissionSeedData.cs`'te doğrulayın; yoksa Task 6 desenine göre seed + migration ekleyin.

- [ ] **Step 4: Create `CopyAssignmentsToNewSeasonCommandHandler.cs`**

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Teachers.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Teachers.Commands.CopyAssignmentsToNewSeason;

public sealed class CopyAssignmentsToNewSeasonCommandHandler(IApplicationDbContext db, ITenantContext tenant)
    : ICommandHandler<CopyAssignmentsToNewSeasonCommand, CopyAssignmentsResult>
{
    public async Task<Result<CopyAssignmentsResult>> Handle(
        CopyAssignmentsToNewSeasonCommand request, CancellationToken cancellationToken)
    {
        var schoolId = tenant.CurrentSchoolId;
        if (schoolId is null) return Result<CopyAssignmentsResult>.Forbidden();

        // Hedef şubeler: SourceClassRoomId → targetClassRoomId eşlemesi.
        var targetMap = await db.ClassRooms.AsNoTracking()
            .Where(c => c.AcademicSessionId == request.TargetSessionId && c.SourceClassRoomId != null)
            .Select(c => new { Source = c.SourceClassRoomId!.Value, Target = c.Id })
            .ToListAsync(cancellationToken);
        var bySource = targetMap.ToDictionary(x => x.Source, x => x.Target);

        var sourceAssignments = await db.TeachingAssignments.AsNoTracking()
            .Where(a => a.AcademicSessionId == request.SourceSessionId && a.RevokedAt == null)
            .ToListAsync(cancellationToken);

        var existingTargets = await db.TeachingAssignments.AsNoTracking()
            .Where(a => a.AcademicSessionId == request.TargetSessionId && a.RevokedAt == null)
            .Select(a => new { a.TeacherId, a.ClassRoomId, a.SubjectId })
            .ToListAsync(cancellationToken);
        var existingSet = existingTargets
            .Select(x => (x.TeacherId, x.ClassRoomId, x.SubjectId)).ToHashSet();

        int copied = 0, skipped = 0;
        foreach (var a in sourceAssignments)
        {
            if (!bySource.TryGetValue(a.ClassRoomId, out var targetClassRoomId)) { skipped++; continue; } // mezun şube
            if (existingSet.Contains((a.TeacherId, targetClassRoomId, a.SubjectId))) { skipped++; continue; }

            db.TeachingAssignments.Add(TeachingAssignment.Create(
                schoolId.Value, request.TargetSessionId, a.TeacherId, targetClassRoomId, a.SubjectId, a.WeeklyHours));
            copied++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return Result<CopyAssignmentsResult>.Success(new CopyAssignmentsResult(copied, skipped));
    }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CopyAssignmentsTests"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/Oksis.Application/Modules/Teachers/Commands/CopyAssignmentsToNewSeason \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/CopyAssignmentsTests.cs
git commit -m "$(printf '2026-06-08 feat: CopyAssignmentsToNewSeason görevlendirme kopyalama (§5.9) eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 8: `ActivateSeasonRollover` orkestratörü + resmi tatil üretimi

**Files:**
- Create: `Commands/ActivateSeasonRollover/ActivateSeasonRolloverCommand.cs` (+ `Handler.cs`)
- Modify: `AcademicSessionsController.cs` (POST `{id}/activate-rollover`, `{id}/promote-students`, `{id}/copy-assignments`)
- Modify: `OpenSeasonFromDraftCommandHandler.cs` (Task 5'teki tatil bloğunu OfficialHoliday üretimiyle doldur)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/ActivateSeasonRolloverTests.cs`

**Orkestratör davranışı (tek transaction):** Hedef sezonu Setup'tan Active'e al (`session.Activate`), eski aktif sezonu arşivle (mevcut `ActivateAcademicSession` mantığı), sonra `PromoteStudents` + `CopyAssignmentsToNewSeason`'ı `ISender` ile çağır. Hepsi tek pipeline transaction'ında.

- [ ] **Step 1: Write the failing integration test**

```csharp
[Fact]
public async Task ActivateRollover_activates_archives_previous_and_promotes()
{
    var (previousActiveId, setupTargetId) = await SeedActivePlusOpenedSetupAsync();

    var result = await Sender.Send(new ActivateSeasonRolloverCommand(setupTargetId, ConfirmArchivePrevious: true));

    Assert.True(result.IsSuccess);
    var target = await DbContext.AcademicSessions.FirstAsync(s => s.Id == setupTargetId);
    var previous = await DbContext.AcademicSessions.FirstAsync(s => s.Id == previousActiveId);
    Assert.Equal(AcademicSessionStatus.Active, target.Status);
    Assert.True(target.IsCurrent);
    Assert.Equal(AcademicSessionStatus.Archived, previous.Status);
    // promotion ran:
    Assert.True(await DbContext.ClassRooms.AnyAsync(c =>
        c.AcademicSessionId == setupTargetId && c.Students.Any(s => s.LeftAt == null)));
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ActivateSeasonRolloverTests"`
Expected: FAIL — komut yok.

- [ ] **Step 3: Create `ActivateSeasonRolloverCommand.cs`**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.AcademicSessions.Commands.ActivateSeasonRollover;

/// <summary>
/// "Aktifleştir": Setup sezonu Active'e alır, eski aktif sezonu arşivler, ardından
/// öğrenci terfisi (§4.9) + görevlendirme kopyası (§5.9) çalıştırır. Tek transaction.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("academic-sessions.activate")]
public sealed record ActivateSeasonRolloverCommand(Guid TargetSessionId, bool ConfirmArchivePrevious)
    : ICommand<ActivateSeasonRolloverResult>;

public sealed record ActivateSeasonRolloverResult(int Promoted, int Graduated, int AssignmentsCopied);
```

- [ ] **Step 4: Create `ActivateSeasonRolloverCommandHandler.cs`**

```csharp
using MediatR;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.Commands.ActivateAcademicSession;
using Oksis.Application.Modules.Students.Commands.PromoteStudents;
using Oksis.Application.Modules.Teachers.Commands.CopyAssignmentsToNewSeason;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.AcademicSessions.Commands.ActivateSeasonRollover;

public sealed class ActivateSeasonRolloverCommandHandler(IApplicationDbContext db, ISender sender)
    : ICommandHandler<ActivateSeasonRolloverCommand, ActivateSeasonRolloverResult>
{
    public async Task<Result<ActivateSeasonRolloverResult>> Handle(
        ActivateSeasonRolloverCommand request, CancellationToken cancellationToken)
    {
        // Kaynak sezon: hedef şubelerin SourceClassRoomId'lerinin sezonu (önceki aktif).
        var sourceSessionId = await db.ClassRooms.AsNoTracking()
            .Where(c => c.AcademicSessionId == request.TargetSessionId && c.SourceClassRoomId != null)
            .Join(db.ClassRooms.AsNoTracking(), t => t.SourceClassRoomId, s => s.Id, (t, s) => s.AcademicSessionId)
            .FirstOrDefaultAsync(cancellationToken);

        // 1) Activate + archive previous (mevcut komut mantığını yeniden kullan).
        var activate = await sender.Send(
            new ActivateAcademicSessionCommand(request.TargetSessionId, request.ConfirmArchivePrevious), cancellationToken);
        if (activate.IsFailure) return Result<ActivateSeasonRolloverResult>.Failure(activate.Error);

        // 2) Promote students (§4.9).
        var promote = await sender.Send(new PromoteStudentsCommand(request.TargetSessionId, ExcludePassive: true), cancellationToken);
        if (promote.IsFailure) return Result<ActivateSeasonRolloverResult>.Failure(promote.Error);

        // 3) Copy assignments (§5.9).
        var copy = sourceSessionId == Guid.Empty
            ? new CopyAssignmentsResult(0, 0)
            : (await sender.Send(new CopyAssignmentsToNewSeasonCommand(sourceSessionId, request.TargetSessionId), cancellationToken))
                .Value ?? new CopyAssignmentsResult(0, 0);

        return Result<ActivateSeasonRolloverResult>.Success(
            new ActivateSeasonRolloverResult(promote.Value!.Promoted, promote.Value.Graduated, copy.Copied));
    }
}
```

> Nested `ISender.Send`'lerin TEK transaction'da kalması: `TransactionBehavior` her command için yeni transaction açıyorsa nested çağrılar aynı `DbContext` (scoped) üzerinden gider ve dış transaction'a katılır — `architecture-rules.md`'de doğrulayın. Eğer behavior her komutta `BeginTransaction` çağırıyorsa, alt komutları handler içinden `ISender` yerine doğrudan handler örneğiyle değil, aynı DbContext'i paylaşacak şekilde çağırmaya devam edin (scoped DbContext bunu sağlar). Belirsizse: alt mantığı paylaşılan internal service'e çıkarıp orkestratör + iki bağımsız komut o service'i çağırsın.

- [ ] **Step 5: Fill official-holiday generation** in `OpenSeasonFromDraftCommandHandler.cs` tatil bloğu — `CopyHolidays` açıksa `OfficialHolidays` master'ından sezon yılına denk gelen sabit-tarihli tatilleri `SchoolHoliday(PublicHoliday)` olarak ekle; taslak `HolidaysJson` okul tatillerini ekle. (Mevcut `OfficialHoliday` şemasını `OfficialHolidayConfiguration.cs`'ten okuyup alan adlarını eşleyin.)

- [ ] **Step 6: Add 3 controller endpoints** in `AcademicSessionsController.cs`

```csharp
    [HttpPost("{id:guid}/activate-rollover")]
    [ProducesResponseType(typeof(ApiResponse<ActivateSeasonRolloverResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ActivateRolloverAsync(Guid id, [FromBody] ActivateAcademicSessionBody body, CancellationToken ct)
        => (await sender.Send(new ActivateSeasonRolloverCommand(id, body.ConfirmArchivePrevious), ct)).ToHttpResult(HttpContext);

    [HttpPost("{id:guid}/promote-students")]
    [ProducesResponseType(typeof(ApiResponse<PromoteStudentsResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PromoteStudentsAsync(Guid id, CancellationToken ct)
        => (await sender.Send(new PromoteStudentsCommand(id, ExcludePassive: true), ct)).ToHttpResult(HttpContext);

    [HttpPost("{id:guid}/copy-assignments")]
    [ProducesResponseType(typeof(ApiResponse<CopyAssignmentsResult>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CopyAssignmentsAsync(Guid id, [FromQuery] Guid sourceSessionId, CancellationToken ct)
        => (await sender.Send(new CopyAssignmentsToNewSeasonCommand(sourceSessionId, id), ct)).ToHttpResult(HttpContext);
```

(İlgili `using` ifadelerini ekleyin.)

- [ ] **Step 7: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ActivateSeasonRolloverTests"`
Expected: PASS.

- [ ] **Step 8: Run full suite + format**

Run: `dotnet test && dotnet format`
Expected: tüm testler PASS, format temiz.

- [ ] **Step 9: Commit**

```bash
git add src/Oksis.Application/Modules/AcademicSessions/Commands/ActivateSeasonRollover \
        src/Oksis.Application/Modules/AcademicSessions/Commands/OpenSeasonFromDraft/OpenSeasonFromDraftCommandHandler.cs \
        src/Oksis.Api/Controllers/V1/AcademicSessionsController.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/ActivateSeasonRolloverTests.cs
git commit -m "$(printf '2026-06-08 feat: ActivateSeasonRollover orkestratörü ve resmi tatil üretimi eklendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Task 9: Modül dokümanlarını güncelle

**Files:**
- Modify: `.claude/docs/modules/academic-years/completion_status.md` (ilerleme, ✅/⏳ taşı)
- Modify: `.claude/docs/modules/academic-years/api-contracts.md` (yeni 8 endpoint)
- Modify: `.claude/docs/modules/academic-years/README.md` (Last Updated, Files checkbox)
- Modify: `.claude/docs/permission-matrix.md` (`students.promote` ekle)

- [ ] **Step 1:** `api-contracts.md`'e 8 yeni endpoint (season-drafts ×3, rollover-preview, open-from-draft, activate-rollover, promote-students, copy-assignments) tablo satırı + permission + örnek body ekleyin.
- [ ] **Step 2:** `completion_status.md`: ilerlemeyi bump et, "Sezon Rollover" yapılarını ✅'a taşı, `season-management-gap-analysis.md` eksiklerini kapandı işaretle.
- [ ] **Step 3:** `permission-matrix.md`'e `students.promote` (School_Admin) satırı ekle.
- [ ] **Step 4: Commit (workspace repo: oksis)**

```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/modules/academic-years/ .claude/docs/permission-matrix.md
git commit -m "$(printf '2026-06-08 docs: Sezon Rollover endpoint/izin/durum dokümanları güncellendi.\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Açık riskler / uygulama sırasında doğrulanacaklar

1. **Nested transaction (Task 8):** `TransactionBehavior`'ın nested `ISender.Send` davranışı — aynı scoped DbContext'i paylaşıp tek transaction'da kalmalı. Belirsizse alt mantığı paylaşılan internal service'e çıkar (orkestratör + iki bağımsız komut aynı service'i çağırır). **Task 8 Step 4 başlamadan `architecture-rules.md` + mevcut bir orkestratör handler'ı oku.**
2. **`Result` yardımcıları:** `Forbidden()`, `NotFound()`, `Conflict()`, `Failure(Error)`, `Success(...)` imzalarını `Oksis.Shared.Result` ile doğrula (mevcut handler'larda kullanım var).
3. **`TimeProvider` vs `DateTimeOffset.UtcNow`:** mevcut handler konvansiyonunu izle (Task 6).
4. **Owned `Students` Include:** terfi/preview tracked sorgularında `.Include(c => c.Students)` şart.
5. **`OfficialHoliday` şeması:** alan adları Task 8 Step 5'te config'ten okunarak eşlenecek (dini bayramlar kapsam dışı — manuel).
</content>
