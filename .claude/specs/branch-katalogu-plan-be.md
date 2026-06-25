# Branş Kataloğu — Backend Uygulama Planı (plan-be)

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` (önerilen) veya
> `superpowers:executing-plans` ile task-by-task uygula. Adımlar `- [ ]` checkbox.
> Spec: `.claude/specs/branch-katalogu-spec.md` (bağlayıcı). FE planı ayrı: `branch-katalogu-plan-fe.md`
> (BE merge sonrası). **Önce bu plan.**

**Goal:** Branşı iki-katmanlı backend modeline (`master.branches` global + `school.branches` tenant)
çıkarmak; CRUD + `BranchesController` (`api/v1/branches`); öğretmen branşını `branchId` FK'ye taşımak;
eşleşme mantığını semantik bozmadan uyarlamak.

**Architecture:** `MasterBranch : MasterEntity` (global, master şema, 16 MEB seed) + `Branch : TenantEntity`
(school şema, `MebBranchId` FK ile MEB-kaynak ayrımı + kilit guard). CQRS/MediatR komut-sorgu; thin
`BranchesController` ISender'a delege. TeacherProfile string branş → `BranchId` + `SecondaryBranchIds`
(join). Eşleşme (`SubjectBranchMatch`/`BranchFitResolver`) handler'da `branchId`→ad resolve ile korunur.

**Tech Stack:** .NET 10, EF Core 10 (SQL Server, snake_case), MediatR, FluentValidation, Mapster,
xUnit + FluentAssertions + NSubstitute + MockQueryable, Testcontainers (MsSql).

## Global Constraints

- **Multi-tenant asla bypass edilmez:** `Branch : TenantEntity` (IHasTenant) → global query filter +
  `TenantSaveChangesInterceptor` otomatik. `MasterBranch` global (yalnız soft-delete filter).
- **Şemasız tablo YOK:** `master.branches` (master şema), `school.branches` (school şema),
  `identity.teacher_secondary_branches` (identity şema, join).
- **Mark=not, Grade=kademe** karıştırma (bu işte ikisi de yok).
- Repository pattern YOK — handler `IApplicationDbContext`'e doğrudan bağlı. AutoMapper YOK (Mapster).
- `async void`/`.Result`/`.Wait()` YOK. Hardcoded Türkçe string → domain exception mesajları Türkçe (OK).
- İzin: `school-settings.update-academic-structure` (mevcut). Lookup query'leri `[Tenancy(Optional/Required)]`.
- Migration adı: `YYYYMMDD_YYYYMMDD_<aciklama>`; komut `dotnet ef migrations add <ad>
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`. Asla prod'da auto-migrate.
- Her task sonu: `dotnet build` + ilgili `dotnet test` yeşil + `dotnet format`.
- Commit: OKSİS formatı `YYYY-MM-DD <type>: Türkçe özet.`

## Dosya Yapısı (oluşturulacak/değişecek)

```
src/Oksis.Domain/Modules/Academics/Entities/
  MasterBranch.cs            (yeni — MasterEntity)
  Branch.cs                  (yeni — TenantEntity, MebBranchId guard)
src/Oksis.Domain/Modules/Users/Entities/TeacherProfile.cs   (değişir — BranchId/SecondaryBranchIds)
src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs  (değişir — DbSet ekle)
src/Oksis.Application/Modules/Academics/Branches/
  Dtos/{BranchDto.cs, MebBranchDto.cs}
  Queries/ListSchoolBranches/{Query,Handler}.cs
  Queries/ListMebBranches/{Query,Handler}.cs
  Commands/CreateBranch/{Command,Handler,Validator}.cs
  Commands/UpdateBranch/{Command,Handler,Validator}.cs
  Commands/SetBranchStatus/{Command,Handler}.cs
  Commands/DeleteBranch/{Command,Handler}.cs
  Commands/ImportMebBranches/{Command,Handler}.cs
src/Oksis.Infrastructure/Persistence/Configurations/Academics/
  MasterBranchConfiguration.cs, BranchConfiguration.cs   (yeni)
src/Oksis.Infrastructure/Persistence/Configurations/Users/TeacherProfileConfiguration.cs  (değişir)
src/Oksis.Infrastructure/Persistence/Configurations/TableBuilderExtensions.cs  (ToSchoolTable ekle)
src/Oksis.Infrastructure/Persistence/Seed/MasterData/BranchSeedData.cs  (yeni)
src/Oksis.Infrastructure/Persistence/OksisSchemas.cs  (School sabiti — yoksa ekle)
src/Oksis.Infrastructure/Persistence/Migrations/*_branches_catalog.cs        (yeni)
src/Oksis.Infrastructure/Persistence/Migrations/*_teacher_branch_fk.cs       (yeni)
src/Oksis.Api/Controllers/V1/BranchesController.cs   (yeni)
src/Oksis.Application/Modules/Academics/Assignments/Commands/AssignSubjectTeachers/*Handler.cs (değişir)
src/Oksis.Application/Modules/Duties/Substitution/Queries/GetAvailableSubstitutes/*Handler.cs (değişir)
tests/Oksis.Domain.UnitTests/Modules/Academics/{MasterBranchTests,BranchTests}.cs
tests/Oksis.Application.UnitTests/Modules/Academics/BranchCommandHandlerTests.cs
tests/Oksis.Infrastructure.IntegrationTests/Persistence/BranchTenantIsolationTests.cs
```

> **Not (önce keşif):** Aşağıdaki bazı yerler (`OksisSchemas` içinde `School` var mı, `ToSchoolTable`
> helper'ı, `Result<T>.Conflict/NotFound` imzaları, `BranchMatching` public mi) task başında 1 dk
> grep'le doğrulanmalı; varsa mevcut adı kullan, yoksa task içinde ekle.

---

### Task 1: `MasterBranch` entity (global master)

**Files:**
- Create: `src/Oksis.Domain/Modules/Academics/Entities/MasterBranch.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/MasterBranchTests.cs`

**Interfaces:**
- Produces: `MasterBranch.Create(Guid id, string name, string? mebCode, int displayOrder) : MasterBranch`;
  props `Name, MebCode, IsActive, DisplayOrder`; `Activate()/Deactivate()`.

- [ ] **Step 1: Failing test**
```csharp
public sealed class MasterBranchTests
{
    [Fact]
    public void Create_trims_and_sets_fields()
    {
        var b = MasterBranch.Create(Guid.NewGuid(), "  Matematik ", "1245", 10);
        b.Name.Should().Be("Matematik");
        b.MebCode.Should().Be("1245");
        b.DisplayOrder.Should().Be(10);
        b.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Create_empty_name_throws()
    {
        var act = () => MasterBranch.Create(Guid.NewGuid(), " ", "1", 1);
        act.Should().Throw<AcademicsDomainException>();
    }

    [Fact]
    public void Create_allows_null_mebCode()
    {
        var b = MasterBranch.Create(Guid.NewGuid(), "Japonca", null, 99);
        b.MebCode.Should().BeNull();
    }
}
```
- [ ] **Step 2: Run → FAIL** `dotnet test tests/Oksis.Domain.UnitTests --filter MasterBranchTests` (derlenmez/fail).
- [ ] **Step 3: Implement**
```csharp
namespace Oksis.Domain.Modules.Academics.Entities;

public sealed class MasterBranch : MasterEntity
{
    public string Name { get; private set; } = default!;
    public string? MebCode { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;

    private MasterBranch() { } // EF Core

    public static MasterBranch Create(Guid id, string name, string? mebCode, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new AcademicsDomainException("MasterBranch.Name.Empty", "Branş adı boş olamaz.");
        return new MasterBranch
        {
            Id = id,
            Name = name.Trim(),
            MebCode = string.IsNullOrWhiteSpace(mebCode) ? null : mebCode.Trim(),
            DisplayOrder = displayOrder,
            IsActive = true,
        };
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
}
```
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `git add ... && git commit -m "2026-06-26 feat: MasterBranch entity eklendi."`

---

### Task 2: `Branch` entity (school, MebBranchId + kilit guard)

**Files:**
- Create: `src/Oksis.Domain/Modules/Academics/Entities/Branch.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/BranchTests.cs`

**Interfaces:**
- Produces: `Branch.CreateCustom(string name, string? mebCode, int displayOrder)`,
  `Branch.CreateFromMeb(string name, string? mebCode, Guid mebBranchId, int displayOrder)`;
  `UpdateCustom(string name, string? mebCode)` (MEB-kaynaklıda throw); `Activate()/Deactivate()`;
  props `Name, MebCode, MebBranchId(Guid?), IsActive, DisplayOrder, SchoolId`. `IsMebSourced => MebBranchId != null`.

- [ ] **Step 1: Failing test**
```csharp
public sealed class BranchTests
{
    [Fact]
    public void CreateCustom_has_null_mebBranchId()
    {
        var b = Branch.CreateCustom("Robotik", null, 50);
        b.MebBranchId.Should().BeNull();
        b.IsMebSourced.Should().BeFalse();
        b.Name.Should().Be("Robotik");
    }

    [Fact]
    public void CreateFromMeb_sets_mebBranchId_and_is_locked()
    {
        var mebId = Guid.NewGuid();
        var b = Branch.CreateFromMeb("Matematik", "1245", mebId, 10);
        b.MebBranchId.Should().Be(mebId);
        b.IsMebSourced.Should().BeTrue();
    }

    [Fact]
    public void UpdateCustom_on_meb_sourced_throws()
    {
        var b = Branch.CreateFromMeb("Matematik", "1245", Guid.NewGuid(), 10);
        var act = () => b.UpdateCustom("Yeni", "9999");
        act.Should().Throw<AcademicsDomainException>()
            .Where(e => e.Code == "Branch.MebSourced.Immutable");
    }

    [Fact]
    public void UpdateCustom_on_custom_updates()
    {
        var b = Branch.CreateCustom("Robotik", null, 50);
        b.UpdateCustom("  Robotik+ ", "RBT");
        b.Name.Should().Be("Robotik+");
        b.MebCode.Should().Be("RBT");
    }
}
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement**
```csharp
namespace Oksis.Domain.Modules.Academics.Entities;

public sealed class Branch : TenantEntity
{
    public string Name { get; private set; } = default!;
    public string? MebCode { get; private set; }
    public Guid? MebBranchId { get; private set; }
    public int DisplayOrder { get; private set; }
    public bool IsActive { get; private set; } = true;

    public bool IsMebSourced => MebBranchId is not null;

    private Branch() { } // EF Core

    public static Branch CreateCustom(string name, string? mebCode, int displayOrder)
        => Build(name, mebCode, mebBranchId: null, displayOrder);

    public static Branch CreateFromMeb(string name, string? mebCode, Guid mebBranchId, int displayOrder)
        => Build(name, mebCode, mebBranchId, displayOrder);

    private static Branch Build(string name, string? mebCode, Guid? mebBranchId, int displayOrder)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new AcademicsDomainException("Branch.Name.Empty", "Branş adı boş olamaz.");
        return new Branch
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            MebCode = string.IsNullOrWhiteSpace(mebCode) ? null : mebCode.Trim(),
            MebBranchId = mebBranchId,
            DisplayOrder = displayOrder,
            IsActive = true,
        };
    }

    public void UpdateCustom(string name, string? mebCode)
    {
        if (IsMebSourced)
            throw new AcademicsDomainException("Branch.MebSourced.Immutable",
                "MEB kaynaklı branş düzenlenemez.");
        if (string.IsNullOrWhiteSpace(name))
            throw new AcademicsDomainException("Branch.Name.Empty", "Branş adı boş olamaz.");
        Name = name.Trim();
        MebCode = string.IsNullOrWhiteSpace(mebCode) ? null : mebCode.Trim();
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;
}
```
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `"2026-06-26 feat: Branch (school) entity + MEB kilit guard eklendi."`

---

### Task 3: EF config + `school` şema helper + `IApplicationDbContext` DbSet'leri

**Files:**
- Modify: `src/Oksis.Infrastructure/Persistence/OksisSchemas.cs` (yoksa `School = "school"` ekle)
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/TableBuilderExtensions.cs` (`ToSchoolTable`)
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Academics/MasterBranchConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Academics/BranchConfiguration.cs`
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (DbSet property'leri)

**Interfaces:**
- Produces: `db.MasterBranches`, `db.Branches` DbSet'leri; `ToSchoolTable(name)` extension.

- [ ] **Step 1: `OksisSchemas.School` kontrol/ekle** — grep `OksisSchemas`; `Master`/`Identity` yanına
  `public const string School = "school";` (yoksa).
- [ ] **Step 2: `ToSchoolTable` helper ekle** (`ToMasterTable` deseni)
```csharp
public static EntityTypeBuilder<T> ToSchoolTable<T>(this EntityTypeBuilder<T> builder, string name)
    where T : class => builder.ToTable(name, OksisSchemas.School);
```
- [ ] **Step 3: `MasterBranchConfiguration`**
```csharp
public sealed class MasterBranchConfiguration : IEntityTypeConfiguration<MasterBranch>
{
    public void Configure(EntityTypeBuilder<MasterBranch> b)
    {
        b.ToMasterTable("branches");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).IsRequired().HasMaxLength(100);
        b.Property(x => x.MebCode).HasMaxLength(20);
        b.Property(x => x.DisplayOrder).IsRequired();
        b.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
        b.Property(x => x.CreatedAt).IsRequired();
        b.Property(x => x.CreatedBy).IsRequired();
        b.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        b.Property(x => x.RowVersion).IsRowVersion();
        b.Ignore(x => x.DomainEvents);
        b.HasIndex(x => x.Name).IsUnique().HasFilter("is_deleted = 0").HasDatabaseName("ux_master_branches_name");
        b.HasData(BranchSeedData.MasterRows()); // Task 4
    }
}
```
- [ ] **Step 4: `BranchConfiguration`** (school + filtered unique)
```csharp
public sealed class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> b)
    {
        b.ToSchoolTable("branches");
        b.HasKey(x => x.Id);
        b.Property(x => x.SchoolId).IsRequired();
        b.Property(x => x.Name).IsRequired().HasMaxLength(100);
        b.Property(x => x.MebCode).HasMaxLength(20);
        b.Property(x => x.MebBranchId);
        b.Property(x => x.DisplayOrder).IsRequired();
        b.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
        b.Property(x => x.CreatedAt).IsRequired();
        b.Property(x => x.CreatedBy).IsRequired();
        b.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        b.Property(x => x.RowVersion).IsRowVersion();
        b.Ignore(x => x.DomainEvents);
        b.HasOne<MasterBranch>().WithMany().HasForeignKey(x => x.MebBranchId)
            .OnDelete(DeleteBehavior.Restrict);
        // Filtered unique: çoklu null (özel) çakışmasın
        b.HasIndex(x => new { x.SchoolId, x.MebBranchId }).IsUnique()
            .HasFilter("meb_branch_id IS NOT NULL AND is_deleted = 0")
            .HasDatabaseName("ux_school_branches_meb");
        b.HasIndex(x => new { x.SchoolId, x.Name }).IsUnique()
            .HasFilter("is_deleted = 0").HasDatabaseName("ux_school_branches_name");
    }
}
```
- [ ] **Step 5: `IApplicationDbContext` + `OksisDbContext`** — `DbSet<MasterBranch> MasterBranches { get; }`
  ve `DbSet<Branch> Branches { get; }` ekle (her iki dosyaya).
- [ ] **Step 6: Build** `dotnet build` → derlenir (seed Task 4'te dolacak; geçici `MasterRows()` boş dönebilir).
- [ ] **Step 7: Commit** `"2026-06-26 feat: Branch EF config + school şema helper + DbSet'ler."`

---

### Task 4: Seed data (16 MEB branşı) + migration

**Files:**
- Create: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/BranchSeedData.cs`
- Modify: `MasterSeedIds` (stable GUID'ler — mevcut `MasterSeedIds` dosyasına `Branches` ekle)
- Migration: `dotnet ef migrations add 20260626_20260626_branches_catalog ...`

**Interfaces:**
- Produces: `BranchSeedData.MasterRows() : IEnumerable<object>` (16 satır, sabit GUID).

- [ ] **Step 1: `MasterSeedIds.Branches` sabit GUID'leri** (mevcut `MasterSeedIds.Subjects` deseni) —
  16 branş için statik `Guid` sabitleri (FE `seed.ts` adları/MEB kodları: Matematik 1245, Türk Dili ve
  Edebiyatı 2353, Fizik 1715, Kimya 1203, Biyoloji 1207, Tarih 2510, Coğrafya 1119, İngilizce 1524,
  Almanca 1083, Din Kültürü ve Ahlak Bilgisi 1310, Felsefe 1390, Beden Eğitimi 1115, Bilişim
  Teknolojileri 2143, Müzik 1822, Görsel Sanatlar 1426 [pasif], Japonca [mebCode yok]).
- [ ] **Step 2: `BranchSeedData.MasterRows()`** (SubjectSeedData deseni)
```csharp
internal static class BranchSeedData
{
    public static IEnumerable<object> MasterRows() =>
    [
        Row(MasterSeedIds.Branches.Math, "Matematik", "1245", 10, true),
        Row(MasterSeedIds.Branches.Turkish, "Türk Dili ve Edebiyatı", "2353", 20, true),
        // ... 16 satır; Görsel Sanatlar isActive:false; Japonca mebCode:null
    ];

    private static object Row(Guid id, string name, string? mebCode, int displayOrder, bool isActive) => new
    {
        Id = id, Name = name, MebCode = mebCode, DisplayOrder = displayOrder,
        IsActive = isActive, CreatedAt = SeedAudit.CreatedAt, CreatedBy = SeedAudit.SystemUserId,
        IsDeleted = false,
    };
}
```
- [ ] **Step 3: Migration üret** `dotnet ef migrations add 20260626_20260626_branches_catalog
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api` — `master.branches`, `school.branches`
  + 16 seed üretilir. Migration'ı incele (şemalar, filtered index, FK doğru mu).
- [ ] **Step 4: Idempotent script doğrula** `dotnet ef migrations script <önceki> 20260626_..._branches_catalog
  -o /tmp/branches.sql --idempotent` → şema/seed/index içeriyor.
- [ ] **Step 5: Build + (varsa) Infrastructure integration test DB'sine uygula** `dotnet build` yeşil.
- [ ] **Step 6: Commit** `"2026-06-26 feat: master.branches + school.branches migration + 16 MEB seed."`

---

### Task 5: Query'ler — `ListSchoolBranches` (tenant) + `ListMebBranches` (master) + DTO'lar

**Files:**
- Create: `.../Branches/Dtos/BranchDto.cs`, `.../Dtos/MebBranchDto.cs`
- Create: `.../Branches/Queries/ListSchoolBranches/{ListSchoolBranchesQuery,Handler}.cs`
- Create: `.../Branches/Queries/ListMebBranches/{ListMebBranchesQuery,Handler}.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Academics/BranchCommandHandlerTests.cs` (query kısmı)

**Interfaces:**
- Produces: `BranchDto(Guid Id, string Name, string? MebCode, Guid? MebBranchId, bool IsMebSourced, bool IsActive, int DisplayOrder)`;
  `MebBranchDto(Guid Id, string Name, string? MebCode, int DisplayOrder)`;
  `ListSchoolBranchesQuery(bool IncludeInactive) : IQuery<IReadOnlyList<BranchDto>>`;
  `ListMebBranchesQuery : IQuery<IReadOnlyList<MebBranchDto>>`.

- [ ] **Step 1: Failing test (school list aktif filtre)**
```csharp
[Fact(DisplayName = "ListSchoolBranches: includeInactive=false → yalnız aktif")]
public async Task ListSchool_active_only()
{
    var active = Branch.CreateCustom("A", null, 1);
    var passive = Branch.CreateCustom("B", null, 2); passive.Deactivate();
    var set = new[] { active, passive }.AsQueryable().BuildMockDbSet();
    _db.Branches.Returns(set);
    var sut = new ListSchoolBranchesQueryHandler(_db);

    var res = await sut.Handle(new ListSchoolBranchesQuery(IncludeInactive: false), CancellationToken.None);

    res.Value.Should().HaveCount(1);
    res.Value[0].Name.Should().Be("A");
}
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: DTO + Query + Handler** (ListSubjects deseni; `[Tenancy(Required)]` school, `[Tenancy(Optional)]` meb)
```csharp
// ListSchoolBranchesQuery.cs
[Tenancy(TenancyMode.Required)]
[RequirePermission("school-settings.update-academic-structure")]
public sealed record ListSchoolBranchesQuery(bool IncludeInactive) : IQuery<IReadOnlyList<BranchDto>>;

// Handler
public sealed class ListSchoolBranchesQueryHandler(IApplicationDbContext db)
    : IQueryHandler<ListSchoolBranchesQuery, IReadOnlyList<BranchDto>>
{
    public async Task<Result<IReadOnlyList<BranchDto>>> Handle(ListSchoolBranchesQuery q, CancellationToken ct)
    {
        var items = await db.Branches.AsNoTracking()
            .Where(x => q.IncludeInactive || x.IsActive)
            .OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
            .Select(x => new BranchDto(x.Id, x.Name, x.MebCode, x.MebBranchId,
                x.MebBranchId != null, x.IsActive, x.DisplayOrder))
            .ToListAsync(ct);
        return Result<IReadOnlyList<BranchDto>>.Success(items);
    }
}
```
  `ListMebBranches` benzer: `db.MasterBranches.Where(x => x.IsActive)` → `MebBranchDto`.
- [ ] **Step 4: Run → PASS.** + `dotnet build`.
- [ ] **Step 5: Commit** `"2026-06-26 feat: Branş list query'leri (school + MEB) eklendi."`

---

### Task 6: `CreateBranch` (özel) + `UpdateBranch` (kilit guard) komutları

**Files:**
- Create: `.../Commands/CreateBranch/{Command,Handler,Validator}.cs`
- Create: `.../Commands/UpdateBranch/{Command,Handler,Validator}.cs`
- Test: aynı `BranchCommandHandlerTests.cs`

**Interfaces:**
- Produces: `CreateBranchCommand(string Name, string? MebCode, int DisplayOrder) : ICommand<Guid>`;
  `UpdateBranchCommand(Guid Id, string Name, string? MebCode) : ICommand`.

- [ ] **Step 1: Failing tests**
```csharp
[Fact(DisplayName = "CreateBranch: aynı ad varsa Conflict")]
public async Task Create_dup_name_conflict()
{
    var existing = Branch.CreateCustom("Matematik", null, 1);
    _db.Branches.Returns(new[] { existing }.AsQueryable().BuildMockDbSet());
    var sut = new CreateBranchCommandHandler(_db);
    var res = await sut.Handle(new CreateBranchCommand("matematik", null, 2), CancellationToken.None);
    res.IsSuccess.Should().BeFalse();
}

[Fact(DisplayName = "UpdateBranch: MEB-kaynaklı → hata")]
public async Task Update_meb_sourced_fails()
{
    var meb = Branch.CreateFromMeb("Matematik", "1245", Guid.NewGuid(), 1);
    _db.Branches.Returns(new[] { meb }.AsQueryable().BuildMockDbSet());
    var sut = new UpdateBranchCommandHandler(_db);
    var res = await sut.Handle(new UpdateBranchCommand(meb.Id, "X", null), CancellationToken.None);
    res.IsSuccess.Should().BeFalse(); // entity guard exception → handler Result.Failure'a çevirir
}
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** (CreateSubject deseni; `[Tenancy(Required)]` + `[RequirePermission(...)]`)
```csharp
// CreateBranchCommandHandler
public async Task<Result<Guid>> Handle(CreateBranchCommand r, CancellationToken ct)
{
    var name = r.Name.Trim();
    var dup = await db.Branches.AnyAsync(b =>
        b.Name.ToLower() == name.ToLower() && !b.IsDeleted, ct);
    if (dup) return Result<Guid>.Conflict("Bu branş adı zaten kayıtlı.");
    var branch = Branch.CreateCustom(r.Name, r.MebCode, r.DisplayOrder);
    db.Branches.Add(branch);
    await db.SaveChangesAsync(ct);
    return Result<Guid>.Success(branch.Id);
}

// UpdateBranchCommandHandler
public async Task<Result> Handle(UpdateBranchCommand r, CancellationToken ct)
{
    var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == r.Id && !b.IsDeleted, ct);
    if (branch is null) return Result.NotFound("Branş bulunamadı.");
    if (branch.IsMebSourced) return Result.Failure(new Error("Branch.MebSourced.Immutable", "MEB kaynaklı branş düzenlenemez."));
    branch.UpdateCustom(r.Name, r.MebCode);
    await db.SaveChangesAsync(ct);
    return Result.Success();
}
```
  Validator: `Name NotEmpty MaxLength(100)`, `MebCode MaxLength(20)`, Create'te `DisplayOrder` >= 0
  (öneri: handler max+1 atarsa command'dan kaldır — bu işte FE gönderiyor, `GreaterThanOrEqualTo(0)`).
- [ ] **Step 4: Run → PASS** + build.
- [ ] **Step 5: Commit** `"2026-06-26 feat: CreateBranch + UpdateBranch (kilit guard) komutları."`

---

### Task 7: `SetBranchStatus` + `DeleteBranch` (in-use guard)

**Files:**
- Create: `.../Commands/SetBranchStatus/{Command,Handler}.cs`
- Create: `.../Commands/DeleteBranch/{Command,Handler}.cs`
- Test: `BranchCommandHandlerTests.cs`

**Interfaces:**
- Produces: `SetBranchStatusCommand(Guid Id, bool IsActive) : ICommand`;
  `DeleteBranchCommand(Guid Id) : ICommand`.
- Consumes: `db.Teachers`/`TeacherProfile.BranchId` (Task 9 sonrası gerçek; bu task in-use guard'ı
  Task 9'a bağımlı → **Task 9'dan sonra çalıştır** veya guard'ı geçici `false` bırakıp Task 9'da bağla).

- [ ] **Step 1: Failing test (in-use → silinemez)**
```csharp
[Fact(DisplayName = "DeleteBranch: öğretmende kullanılıyorsa Conflict")]
public async Task Delete_in_use_conflict()
{
    var branch = Branch.CreateCustom("Matematik", null, 1);
    _db.Branches.Returns(new[] { branch }.AsQueryable().BuildMockDbSet());
    var teacher = /* TeacherProfile.BranchId == branch.Id olan stub */;
    _db.Profiles.Returns(new[] { teacher }.AsQueryable().BuildMockDbSet());
    var sut = new DeleteBranchCommandHandler(_db);
    var res = await sut.Handle(new DeleteBranchCommand(branch.Id), CancellationToken.None);
    res.IsSuccess.Should().BeFalse();
}
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement**
```csharp
// DeleteBranchCommandHandler
public async Task<Result> Handle(DeleteBranchCommand r, CancellationToken ct)
{
    var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == r.Id && !b.IsDeleted, ct);
    if (branch is null) return Result.NotFound("Branş bulunamadı.");
    var inUse = await db.Profiles.OfType<TeacherProfile>()
        .AnyAsync(t => t.BranchId == r.Id || t.SecondaryBranchIds.Contains(r.Id), ct);
    if (inUse) return Result.Conflict("Bu branş bir öğretmende kullanılıyor; silinemez. Pasife alabilirsiniz.");
    branch.IsDeleted = true; // soft-delete (ISoftDeletable)
    await db.SaveChangesAsync(ct);
    return Result.Success();
}
// SetBranchStatusCommandHandler: branch.Activate()/Deactivate()
```
- [ ] **Step 4: Run → PASS** + build.
- [ ] **Step 5: Commit** `"2026-06-26 feat: SetBranchStatus + DeleteBranch (in-use guard)."`

---

### Task 8: `ImportMebBranches` (toplu + dedupe + idempotent)

**Files:**
- Create: `.../Commands/ImportMebBranches/{Command,Handler}.cs`
- Test: `BranchCommandHandlerTests.cs`

**Interfaces:**
- Produces: `ImportMebBranchesCommand : ICommand<ImportMebResult>`;
  `ImportMebResult(int Added, int Skipped)`.

- [ ] **Step 1: Failing test (dedupe + idempotent)**
```csharp
[Fact(DisplayName = "ImportMeb: mevcut mebBranchId atlanır, yenisi eklenir")]
public async Task Import_dedupes()
{
    var mebMat = MasterBranch.Create(Guid.NewGuid(), "Matematik", "1245", 10);
    var mebFiz = MasterBranch.Create(Guid.NewGuid(), "Fizik", "1715", 20);
    _db.MasterBranches.Returns(new[] { mebMat, mebFiz }.AsQueryable().BuildMockDbSet());
    var alreadyMat = Branch.CreateFromMeb("Matematik", "1245", mebMat.Id, 10);
    _db.Branches.Returns(new[] { alreadyMat }.AsQueryable().BuildMockDbSet());
    var sut = new ImportMebBranchesCommandHandler(_db);

    var res = await sut.Handle(new ImportMebBranchesCommand(), CancellationToken.None);

    res.Value.Added.Should().Be(1);   // Fizik
    res.Value.Skipped.Should().Be(1); // Matematik
    _db.Branches.Received(1).Add(Arg.Is<Branch>(b => b.Name == "Fizik" && b.MebBranchId == mebFiz.Id));
}
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement**
```csharp
public async Task<Result<ImportMebResult>> Handle(ImportMebBranchesCommand _, CancellationToken ct)
{
    var meb = await db.MasterBranches.AsNoTracking()
        .Where(m => m.IsActive).OrderBy(m => m.DisplayOrder).ToListAsync(ct);
    var existingMebIds = await db.Branches
        .Where(b => b.MebBranchId != null && !b.IsDeleted)
        .Select(b => b.MebBranchId!.Value).ToListAsync(ct);
    var existing = existingMebIds.ToHashSet();
    int added = 0, skipped = 0;
    foreach (var m in meb)
    {
        if (existing.Contains(m.Id)) { skipped++; continue; }
        db.Branches.Add(Branch.CreateFromMeb(m.Name, m.MebCode, m.Id, m.DisplayOrder));
        added++;
    }
    if (added > 0) await db.SaveChangesAsync(ct);
    return Result<ImportMebResult>.Success(new ImportMebResult(added, skipped));
}
```
- [ ] **Step 4: Run → PASS** + build.
- [ ] **Step 5: Commit** `"2026-06-26 feat: ImportMebBranches (toplu + dedupe + idempotent)."`

---

### Task 9: TeacherProfile `BranchId` + `SecondaryBranchIds` FK + migration

**Files:**
- Modify: `src/Oksis.Domain/Modules/Users/Entities/TeacherProfile.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Users/TeacherProfileConfiguration.cs`
- Migration: `dotnet ef migrations add 20260626_20260626_teacher_branch_fk ...`
- Test: `tests/Oksis.Domain.UnitTests/.../TeacherProfileTests.cs` (varsa) veya yeni

**Interfaces:**
- Produces: `TeacherProfile.BranchId : Guid?`, `SecondaryBranchIds : IReadOnlyList<Guid>`;
  `SetBranch(Guid? branchId)`, `SetSecondaryBranchIds(IEnumerable<Guid>? ids)` (ana branşı dışlar, dedupe).

- [ ] **Step 1: Failing test**
```csharp
[Fact]
public void SetSecondaryBranchIds_excludes_primary_and_dedupes()
{
    var primary = Guid.NewGuid(); var a = Guid.NewGuid();
    var t = TeacherProfile.Create();
    t.SetBranch(primary);
    t.SetSecondaryBranchIds(new[] { a, a, primary });
    t.SecondaryBranchIds.Should().BeEquivalentTo(new[] { a });
}
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — `Branch`(string)/`SecondaryBranches`(string[]) alanlarını kaldır,
  `BranchId: Guid?` + `SecondaryBranchIds: IReadOnlyList<Guid>` ekle; `SetBranch`/`SetSecondaryBranchIds`
  (mevcut `SetSecondaryBranches` mantığını Guid'e uyarlayıp ana branş `BranchId`'yi dışla). `Create`
  imzasını `string? branch` yerine `Guid? branchId` ile güncelle.
- [ ] **Step 4: EF config** — `teacher_branch`/`teacher_secondary_branches`(json) kaldır;
  `BranchId` → `teacher_branch_id` (FK → `school.branches`, `OnDelete.Restrict`); `SecondaryBranchIds`
  → ayrı join `identity.teacher_secondary_branches` (owned many veya skip-nav). En basit: owned collection
```csharp
builder.Property(x => x.BranchId).HasColumnName("teacher_branch_id");
builder.HasOne<Branch>().WithMany().HasForeignKey(x => x.BranchId).OnDelete(DeleteBehavior.Restrict);
builder.OwnsMany(x => x.SecondaryBranchIds, /* value Guid */ ...) // veya PrimitiveCollection<Guid>
```
  *(Not: EF Core 10 `PrimitiveCollection<Guid>` JSON da kabul edilebilir; ama spec D6 join tablosu
  istiyor → join. Karar: join tablosu `identity.teacher_secondary_branches(teacher_id, branch_id)`.)*
- [ ] **Step 5: Migration** `dotnet ef migrations add 20260626_20260626_teacher_branch_fk ...` —
  eski kolonları düş, `teacher_branch_id` + join tablo ekle. İncele (FK'ler, şema).
- [ ] **Step 6: Build** (referans veren yerler — TeacherProfile.Create çağrıları, seed — Task 11/eşleşme
  Task 10 derlenene kadar kırmızı olabilir; bu task tek başına derlenmeyebilir → Task 10 ile birlikte
  derle/commit). `dotnet build`.
- [ ] **Step 7: Commit** `"2026-06-26 feat: TeacherProfile branş FK (branchId + secondaryBranchIds) + migration."`

---

### Task 10: Eşleşme uyarlaması (görevlendirme + vekalet) — branchId→ad resolve

**Files:**
- Modify: `.../Academics/Assignments/Commands/AssignSubjectTeachers/AssignSubjectTeachersCommandHandler.cs`
- Modify: `.../Duties/Substitution/Queries/GetAvailableSubstitutes/GetAvailableSubstitutesQueryHandler.cs`
- Test: ilgili handler test dosyaları (mevcut testleri güncelle)

**Interfaces:**
- Consumes: `TeacherProfile.BranchId`, `db.Branches`; mevcut `SubjectBranchMatch.Resolve(string?, IEnumerable<string>, string)` ve `BranchFitResolver.Resolve(...)`.

- [ ] **Step 1: Failing test (regresyon — FK'den ad resolve → aynı sonuç)**
```csharp
[Fact(DisplayName = "AssignSubjectTeachers: branchId ders adıyla eşleşince Matched, justification gerekmez")]
public async Task Assign_resolves_branch_name_matched()
{
    // teacher.BranchId -> "Matematik" branch; subject.Name "Matematik"
    // beklenen: match == Matched, justification null
}

[Fact(DisplayName = "AssignSubjectTeachers: branchId null → hard-block")]
public async Task Assign_null_branch_blocks() { /* Result.Failure "teacher-no-branch" */ }
```
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — handler'da öğretmen `BranchId`/`SecondaryBranchIds`'i `db.Branches`'ten
  **ada** resolve et (tek sorguda map), mevcut `SubjectBranchMatch.Resolve(branchName, secondaryNames,
  subject.Name)`'e ver. Hard-block: `BranchId is null`. Aynısı `GetAvailableSubstitutes`'ta aday branş adı.
```csharp
// örnek resolve
var branchNames = await db.Branches.AsNoTracking()
    .Where(b => ids.Contains(b.Id))
    .ToDictionaryAsync(b => b.Id, b => b.Name, ct);
var primaryName = teacher.BranchId is Guid bid ? branchNames.GetValueOrDefault(bid) : null;
var secondaryNames = teacher.SecondaryBranchIds.Select(id => branchNames.GetValueOrDefault(id)).Where(n => n != null)!;
var match = SubjectBranchMatch.Resolve(primaryName, secondaryNames!, subject.Name);
```
- [ ] **Step 4: Run → PASS** + `dotnet build` (Task 9 ile birlikte derlenir).
- [ ] **Step 5: Commit** `"2026-06-26 refactor: görevlendirme/vekalet branş eşleşmesi FK→ad resolve ile korundu."`

---

### Task 11: Greenfield seed güncellemesi (okul branşları + öğretmen branchId)

**Files:**
- Modify: dev/seed akışı (okul oluşturma seed'i — `*SeedData`/seeder nerede ise) + öğretmen seed.

**Interfaces:**
- Consumes: `ImportMebBranchesCommand` mantığı veya doğrudan `Branch.CreateFromMeb`.

- [ ] **Step 1:** Okul seed'inde, okul oluşturulunca `school.branches`'e MEB 16 import (master'dan kopya).
- [ ] **Step 2:** Öğretmen seed'i artık `branchId` (o okulun branş Id'si) ile üretir; string branş kaldırılır.
- [ ] **Step 3:** Build + seed'i çalıştırıp (dev DB) öğretmenlerin `branchId`'li olduğunu doğrula.
- [ ] **Step 4: Commit** `"2026-06-26 chore: greenfield seed — okul branşları + öğretmen branchId."`

---

### Task 12: `BranchesController` (`api/v1/branches`)

**Files:**
- Create: `src/Oksis.Api/Controllers/V1/BranchesController.cs`
- Test: (controller ince; kapsam Application testlerinde — opsiyonel Api.UnitTests smoke)

**Interfaces:**
- Consumes: tüm Branch komut/sorguları.

- [ ] **Step 1: Implement** (AcademicsController deseni, ISender, ApiResponse, ToHttpResult)
```csharp
[ApiController]
[Route("api/v1/branches")]
[Authorize]
[Produces("application/json")]
public sealed class BranchesController(ISender sender) : ControllerBase
{
    [HttpGet] // ?includeInactive=true
    public async Task<IActionResult> ListAsync([FromQuery] bool includeInactive = true, CancellationToken ct = default)
        => (await sender.Send(new ListSchoolBranchesQuery(includeInactive), ct)).ToHttpResult(HttpContext);

    [HttpGet("meb")]
    public async Task<IActionResult> ListMebAsync(CancellationToken ct)
        => (await sender.Send(new ListMebBranchesQuery(), ct)).ToHttpResult(HttpContext);

    [HttpPost]
    public async Task<IActionResult> CreateAsync([FromBody] CreateBranchCommand cmd, CancellationToken ct)
        => (await sender.Send(cmd, ct)).ToHttpResult(HttpContext); // 201

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAsync(Guid id, [FromBody] UpdateBranchCommand cmd, CancellationToken ct)
        => (await sender.Send(cmd with { Id = id }, ct)).ToHttpResult(HttpContext);

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> StatusAsync(Guid id, [FromBody] SetBranchStatusBody body, CancellationToken ct)
        => (await sender.Send(new SetBranchStatusCommand(id, body.IsActive), ct)).ToHttpResult(HttpContext);

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAsync(Guid id, CancellationToken ct)
        => (await sender.Send(new DeleteBranchCommand(id), ct)).ToHttpResult(HttpContext);

    [HttpPost("import-meb")]
    public async Task<IActionResult> ImportAsync(CancellationToken ct)
        => (await sender.Send(new ImportMebBranchesCommand(), ct)).ToHttpResult(HttpContext);
}
public sealed record SetBranchStatusBody(bool IsActive);
```
- [ ] **Step 2: Build** + manuel smoke (`dotnet run` + curl GET /api/v1/branches token'la → 200).
- [ ] **Step 3: Commit** `"2026-06-26 feat: BranchesController (api/v1/branches) eklendi."`

---

### Task 13: Integration test — tenant izolasyonu + import + in-use guard (gerçek DB)

**Files:**
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/BranchTenantIsolationTests.cs`

- [ ] **Step 1: Failing test (izolasyon)**
```csharp
[Collection(DatabaseCollection.Name)]
public sealed class BranchTenantIsolationTests(DatabaseFixture fixture)
{
    [Fact(DisplayName = "Okul A branşı, Okul B context'inde görünmez")]
    public async Task Branch_is_tenant_isolated()
    {
        var schoolA = Guid.NewGuid(); var schoolB = Guid.NewGuid();
        await using (var ctxA = fixture.CreateDbContext(schoolA))
        { ctxA.Branches.Add(Branch.CreateCustom("A-Özel", null, 1)); await ctxA.SaveChangesAsync(); }

        await using var ctxB = fixture.CreateDbContext(schoolB);
        (await ctxB.Branches.CountAsync()).Should().Be(0); // global query filter
    }
}
```
- [ ] **Step 2: Run → FAIL/PASS** (filter zaten otomatik → muhtemelen PASS; yine de regresyon kanıtı).
- [ ] **Step 3:** (Gerekirse) import idempotent + in-use guard'ı gerçek DB'de doğrulayan testler ekle.
- [ ] **Step 4: Run → PASS** (`dotnet test tests/Oksis.Infrastructure.IntegrationTests`).
- [ ] **Step 5: Commit** `"2026-06-26 test: Branş tenant izolasyonu + integration testleri."`

---

## Kapanış (BE)
- [ ] `dotnet build` + `dotnet test` (tüm projeler) yeşil + `dotnet format`.
- [ ] Spec güncelle: `subjects-cekirdek-genisletme-spec.md` D6'ya "ezildi — branch-katalogu-spec.md" notu;
  `modules/subjects/completion_status.md` + `modules/teachers/completion_status.md` "Spec Dışına Çıkılanlar".
- [ ] `superpowers:finishing-a-development-branch` ile tamamla.

## Self-Review (plan-be ↔ spec)
- Spec §3 veri modeli → Task 1-4 ✓ · §4 backend → Task 5-12 ✓ · §6 teacher FK → Task 9-10 ✓ ·
  §8 test → Task 1-13 + integration ✓ · D3 kilit guard → Task 2/6 ✓ · D4 import → Task 8 ✓ ·
  D5 CRUD → Task 6-7 ✓ · D7 eşleşme → Task 10 ✓ · D8 greenfield → Task 11 ✓ · D10 controller → Task 12 ✓.
- Açık bağımlılık: Task 7 (in-use guard) Task 9'a (teacher FK) bağlı → sıra: ...6 → **9 → 10 → 7** → 8 →
  11 → 12 → 13. (Task 7'yi Task 9-10'dan sonraya al.)
