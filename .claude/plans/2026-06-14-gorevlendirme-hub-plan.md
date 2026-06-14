# Görevlendirme Hub'ı (Sınıf-Merkezli) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin, sınıf-merkezli "Akademik / Görevlendirmeler" hub ekranından sezon özetini, kademe-gruplu sınıf listesini (doluluk rozetiyle) ve seçili sınıfın görevlendirme tablosunu (branş-uyum rozetiyle) görebilsin; sınıftan yeni görevlendirme yapabilsin ve önceki sezonu kopyalayabilsin. Hedef saat, bu spec'te geliştirilen Müfredat Saati çekirdeğinden gerçek değer olarak gelir.

**Architecture:** Mevcut `TeachingAssignment` çekirdeği korunur (entity/assign/unassign/event/izinler). Eklenen: (1) Müfredat Saati çekirdeği — `CurriculumHourTemplate` (master) + `SchoolWeeklyHourOverride` (tenant) + `IRequiredHoursResolver`; (2) Hub okuma query'leri (summary/classes/by-class, EF projection, branchMatch bellekte); (3) `CopyAssignmentsToNewSeason` command; (4) yeni controller `api/v1/teaching-assignments`; (5) web hub sayfası `src/portals/admin/assignments/`. Dapper KULLANILMAZ.

**Tech Stack:** .NET 10 · MediatR · EF Core 10 · xUnit + FluentAssertions + NSubstitute + MockQueryable · React 18 + TS · React Query v5 · RHF + Zod · Vitest + Testing Library · i18next.

**Tasarım kaynağı:** `.claude/specs/gorevlendirme-hub-spec.md` (bağlayıcı) + Müfredat Saati Teknik Analizi (docx) + handoff `handoff_gorevlendirmeler_kademe/`.

**Çalışma dizinleri:** Backend `oksis-api/`, Frontend `oksis-web/`.

---

## Önemli pattern notları (uygulamadan önce oku — koddan doğrulandı)

- **Result API** (`Oksis.Shared`): `Result<T>.Success(v)`, `.NotFound()`, `.Conflict("kod")`, `.Failure(new Error("kod","msg"))`; non-generic `Result.Success()`, `Result.NotFound()`.
- **CQRS marker'ları:** record `... : ICommand`, `ICommand<T>`, `IQuery<T>` + sınıf attribute'ları `[Tenancy(TenancyMode.Required)]` + `[RequirePermission("...")]`. Namespace: `Oksis.Application.Common.Attributes`, `Oksis.Application.Common.Cqrs`.
- **Handler interface'leri:** `ICommandHandler<TCmd>`, `ICommandHandler<TCmd,T>`, `IQueryHandler<TQuery,T>`. Primary-ctor: `(IApplicationDbContext db, ...)`. Ek bağımlılıklar: `ICacheService cache` (`cache.RemoveByPrefixAsync("teachers:workload:", ct)`), `IDateTimeProvider clock` (`clock.UtcNow`).
- **Domain event API:** `Raise(evt)` (AggregateRoot/MasterEntity/TenantEntity), `AddDomainEvent` DEĞİL.
- **DbSet adları** (`IApplicationDbContext`): `GradeLevels`, `Subjects`, `ClassRooms`, `AcademicSessions`, `TeachingAssignments`, `Persons`, `Profiles`, `Permissions`, `RolePermissions`. Yeni eklenecek: `CurriculumHourTemplates`, `SchoolWeeklyHourOverrides`.
- **Öğretmen kimliği:** `TeachingAssignment.TeacherId == Person.Id` (== `TeacherProfile.PersonId`). Ad: `db.Persons` → `person.Name.First`/`.Last`. Branş: `db.Profiles.OfType<TeacherProfile>()` → `profile.Branch` (nullable string).
- **Master tablo:** `MasterEntity` (SchoolId YOK) + `builder.ToMasterTable("...")` + seed `HasData(...)` deterministik `SeedGuid.From("...")` + `SeedAudit.CreatedAt`/`SeedAudit.SystemUserId`. Enum `HasConversion<string>()`. Unique index `HasFilter("is_deleted = 0")`. `builder.Ignore(x => x.DomainEvents)`.
- **Tenant tablo:** `TenantEntity` (SchoolId zorunlu) + `builder.ToAcademicTable("...")` (`academic` şeması).
- **Controller:** `[Authorize]` (izin attribute command/query'de). Endpoint tek satır: `var result = await sender.Send(...); return result.ToHttpResult(HttpContext);`.
- **ClassRoomStatus:** `Draft=0, PendingApproval=1, Active=2, Archived=3`. Hub yalnız `Active` (ve gerekirse `PendingApproval`) şubeleri sayar; `Archived` hariç.
- **AcademicSession:** aktif sezon `s.IsCurrent == true`.
- **Test stack (API):** xUnit + FluentAssertions; domain testleri saf; handler testleri `MockQueryable` ile `IApplicationDbContext` mock'lanır (mevcut Teachers testlerini referans al: `tests/Oksis.Application.UnitTests/Modules/Teachers/`).
- **Frontend mirror dosyaları** (birebir desen): `oksis-web/src/portals/admin/teachers/{api/teachersApi.ts, keys/teacherKeys.ts, hooks/useTeacherAssignments.ts, types/index.ts}`. Import yolları: `httpClient` → `shared/api/httpClient`; `tenantScopedKey` → `shared/config/tenant`; `DataTable` → `shared/components/DataTable/DataTable`; `RequirePermission` → `shared/components/auth/RequirePermission`; `usePermission` → `shared/hooks/usePermission`; izin sabitleri → `shared/auth/permissions.constants`. `react-router` (NOT `react-router-dom`). Named export zorunlu.

---

# BÖLÜM A — MÜFREDAT SAATİ ÇEKİRDEĞİ (oksis-api)

## Task A1: MasterSeedIds — yeni Guid katalog girişleri

**Files:**
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/MasterSeedIds.cs`

- [ ] **Step 1: İzin ve curriculum seed Guid'lerini ekle**

`Permissions` static class'ına (mevcut `TeachingAssignmentsAssign` yanına) ekle:

```csharp
public static Guid TeachingAssignmentsCopySeason { get; } = SeedGuid.From("perm:teaching-assignments.copy-season");
public static Guid CurriculumHoursView { get; } = SeedGuid.From("perm:curriculum-hours.view");
```

Aynı dosyada yeni bir static class ekle (curriculum template satır Id'leri deterministik üretilecek; ayrı katalog gerekmez — Id'ler seed'de `SeedGuid.From($"curr:{grade}:{subjectCode}")` ile üretilecek, bkz A5). Bu task yalnız iki izin Guid'i ekler.

- [ ] **Step 2: Derleme doğrulaması**

Run: `dotnet build src/Oksis.Infrastructure`
Expected: 0 error.

- [ ] **Step 3: Commit**

```bash
git add src/Oksis.Infrastructure/Persistence/Seed/MasterData/MasterSeedIds.cs
git commit -m "2026-06-14 feat: Görevlendirme Hub — copy-season + curriculum-hours.view izin seed Id'leri."
```

---

## Task A2: `CurriculumHourTemplate` master entity (+test)

**Files:**
- Create: `src/Oksis.Domain/Modules/Academics/Entities/CurriculumHourTemplate.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/CurriculumHourTemplateTests.cs`

- [ ] **Step 1: Failing test yaz**

```csharp
// tests/Oksis.Domain.UnitTests/Modules/Academics/CurriculumHourTemplateTests.cs
using FluentAssertions;
using Oksis.Domain.Modules.Academics.Entities;
using Oksis.Domain.Modules.Academics.Enums;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Academics;

public sealed class CurriculumHourTemplateTests
{
    [Fact]
    public void Create_sets_fields()
    {
        var id = Guid.NewGuid();
        var subjectId = Guid.NewGuid();

        var t = CurriculumHourTemplate.Create(
            id, EducationLevel.Middle, "5", subjectId, weeklyHours: 6,
            isElective: false, mebDecision: "2025/04 TTK", version: "2025.04");

        t.Id.Should().Be(id);
        t.EducationLevel.Should().Be(EducationLevel.Middle);
        t.GradeLevelCode.Should().Be("5");
        t.SubjectId.Should().Be(subjectId);
        t.WeeklyHours.Should().Be(6);
        t.IsElective.Should().BeFalse();
        t.Version.Should().Be("2025.04");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(41)]
    public void Create_rejects_out_of_range_hours(int hours)
    {
        var act = () => CurriculumHourTemplate.Create(
            Guid.NewGuid(), EducationLevel.High, "9", Guid.NewGuid(), hours,
            false, "2025/04 TTK", "2025.04");

        act.Should().Throw<AcademicsDomainException>();
    }
}
```

- [ ] **Step 2: Testi çalıştır, fail gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~CurriculumHourTemplateTests"`
Expected: FAIL — `CurriculumHourTemplate` yok.

- [ ] **Step 3: Entity'yi yaz**

```csharp
// src/Oksis.Domain/Modules/Academics/Entities/CurriculumHourTemplate.cs
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Academics.Enums;
using Oksis.Domain.Modules.Academics.Exceptions;

namespace Oksis.Domain.Modules.Academics.Entities;

/// <summary>
/// MEB Haftalık Ders Çizelgesi master şablonu (tenant-agnostik, sürümlü).
/// (Kademe × Seviye × Ders) için zorunlu/seçmeli haftalık saat. Subjects seed
/// mantığıyla paylaşılır; SchoolId taşımaz. Effective saat çözümü için
/// <see cref="SchoolWeeklyHourOverride"/> ile katmanlanır (override > master).
/// </summary>
public sealed class CurriculumHourTemplate : MasterEntity
{
    public const int MinWeeklyHours = 1;
    public const int MaxWeeklyHours = 40;

    public EducationLevel EducationLevel { get; private set; }
    public string GradeLevelCode { get; private set; } = default!;
    public Guid SubjectId { get; private set; }
    public int WeeklyHours { get; private set; }
    public bool IsElective { get; private set; }
    public string MebDecision { get; private set; } = default!;
    public string Version { get; private set; } = default!;

    private CurriculumHourTemplate() { } // EF Core

    public static CurriculumHourTemplate Create(
        Guid id,
        EducationLevel educationLevel,
        string gradeLevelCode,
        Guid subjectId,
        int weeklyHours,
        bool isElective,
        string mebDecision,
        string version)
    {
        if (string.IsNullOrWhiteSpace(gradeLevelCode))
            throw new AcademicsDomainException("CurriculumHourTemplate.GradeLevelCode.Empty", "Sınıf kodu boş olamaz.");
        if (subjectId == Guid.Empty)
            throw new AcademicsDomainException("CurriculumHourTemplate.SubjectId.Empty", "Ders kimliği boş olamaz.");
        if (weeklyHours < MinWeeklyHours || weeklyHours > MaxWeeklyHours)
            throw new AcademicsDomainException("CurriculumHourTemplate.WeeklyHours.OutOfRange", "Haftalık saat 1-40 aralığında olmalıdır.");
        if (string.IsNullOrWhiteSpace(version))
            throw new AcademicsDomainException("CurriculumHourTemplate.Version.Empty", "Sürüm boş olamaz.");

        return new CurriculumHourTemplate
        {
            Id = id,
            EducationLevel = educationLevel,
            GradeLevelCode = gradeLevelCode.Trim(),
            SubjectId = subjectId,
            WeeklyHours = weeklyHours,
            IsElective = isElective,
            MebDecision = mebDecision?.Trim() ?? string.Empty,
            Version = version.Trim()
        };
    }
}
```

- [ ] **Step 4: Testi çalıştır, pass gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~CurriculumHourTemplateTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Domain/Modules/Academics/Entities/CurriculumHourTemplate.cs tests/Oksis.Domain.UnitTests/Modules/Academics/CurriculumHourTemplateTests.cs
git commit -m "2026-06-14 feat,test: Müfredat Saati çekirdeği — CurriculumHourTemplate master entity."
```

---

## Task A3: `SchoolWeeklyHourOverride` tenant entity

**Files:**
- Create: `src/Oksis.Domain/Modules/Academics/Entities/SchoolWeeklyHourOverride.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/SchoolWeeklyHourOverrideTests.cs`

- [ ] **Step 1: Failing test yaz**

```csharp
// tests/Oksis.Domain.UnitTests/Modules/Academics/SchoolWeeklyHourOverrideTests.cs
using FluentAssertions;
using Oksis.Domain.Modules.Academics.Entities;
using Oksis.Domain.Modules.Academics.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Academics;

public sealed class SchoolWeeklyHourOverrideTests
{
    [Fact]
    public void Create_sets_fields()
    {
        var o = SchoolWeeklyHourOverride.Create(
            Guid.NewGuid(), Guid.NewGuid(), "5", Guid.NewGuid(), 7, "Seçmeli artırıldı");

        o.GradeLevelCode.Should().Be("5");
        o.WeeklyHours.Should().Be(7);
        o.Reason.Should().Be("Seçmeli artırıldı");
    }

    [Fact]
    public void Create_rejects_empty_grade()
    {
        var act = () => SchoolWeeklyHourOverride.Create(
            Guid.NewGuid(), Guid.NewGuid(), " ", Guid.NewGuid(), 7, null);
        act.Should().Throw<AcademicsDomainException>();
    }
}
```

- [ ] **Step 2: Testi çalıştır, fail gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SchoolWeeklyHourOverrideTests"`
Expected: FAIL.

- [ ] **Step 3: Entity'yi yaz**

```csharp
// src/Oksis.Domain/Modules/Academics/Entities/SchoolWeeklyHourOverride.cs
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Academics.Exceptions;

namespace Oksis.Domain.Modules.Academics.Entities;

/// <summary>
/// Okula özel haftalık saat override'ı (tenant). Effective saat çözümünde
/// master <see cref="CurriculumHourTemplate"/>'in önüne geçer. Bu spec'te
/// yazma yolu YOK (S-6); yalnız resolver okur. Yönetim UI'ı tam Müfredat
/// modülünde gelir.
/// </summary>
public sealed class SchoolWeeklyHourOverride : TenantEntity
{
    public const int MinWeeklyHours = 0;
    public const int MaxWeeklyHours = 40;

    public Guid AcademicSessionId { get; private set; }
    public string GradeLevelCode { get; private set; } = default!;
    public Guid SubjectId { get; private set; }
    public int WeeklyHours { get; private set; }
    public string? Reason { get; private set; }

    private SchoolWeeklyHourOverride() { } // EF Core

    public static SchoolWeeklyHourOverride Create(
        Guid schoolId,
        Guid academicSessionId,
        string gradeLevelCode,
        Guid subjectId,
        int weeklyHours,
        string? reason)
    {
        if (string.IsNullOrWhiteSpace(gradeLevelCode))
            throw new AcademicsDomainException("SchoolWeeklyHourOverride.GradeLevelCode.Empty", "Sınıf kodu boş olamaz.");
        if (subjectId == Guid.Empty)
            throw new AcademicsDomainException("SchoolWeeklyHourOverride.SubjectId.Empty", "Ders kimliği boş olamaz.");
        if (weeklyHours < MinWeeklyHours || weeklyHours > MaxWeeklyHours)
            throw new AcademicsDomainException("SchoolWeeklyHourOverride.WeeklyHours.OutOfRange", "Haftalık saat 0-40 aralığında olmalıdır.");

        return new SchoolWeeklyHourOverride
        {
            SchoolId = schoolId,
            AcademicSessionId = academicSessionId,
            GradeLevelCode = gradeLevelCode.Trim(),
            SubjectId = subjectId,
            WeeklyHours = weeklyHours,
            Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim()
        };
    }
}
```

> Not: `TenantEntity`'nin `SchoolId` setter'ı erişilebilir değilse (private), mevcut tenant entity factory desenini izle (örn. `ClassRoom.Create` `SchoolId = schoolId` atıyor → erişilebilir). Aynı şekilde ata.

- [ ] **Step 4: Testi çalıştır, pass gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SchoolWeeklyHourOverrideTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Domain/Modules/Academics/Entities/SchoolWeeklyHourOverride.cs tests/Oksis.Domain.UnitTests/Modules/Academics/SchoolWeeklyHourOverrideTests.cs
git commit -m "2026-06-14 feat,test: Müfredat Saati — SchoolWeeklyHourOverride tenant entity."
```

---

## Task A4: EF config + DbSet + seed wiring

**Files:**
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Academics/CurriculumHourTemplateConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Academics/SchoolWeeklyHourOverrideConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/CurriculumHourSeedData.cs`
- Create: `src/Oksis.Domain/Modules/Academics/CurriculumVersions.cs`
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/ApplicationDbContext.cs` (DbSet implementasyonu — mevcut dosyadaki desene göre)

- [ ] **Step 1: Aktif sürüm sabiti**

```csharp
// src/Oksis.Domain/Modules/Academics/CurriculumVersions.cs
namespace Oksis.Domain.Modules.Academics;

/// <summary>Aktif MEB çizelge sürümü (çekirdek: tek aktif sürüm). Tam modülde sürüm seçimi gelir.</summary>
public static class CurriculumVersions
{
    public const string Active = "2025.04";
    public const string ActiveDecision = "2025/04 TTK";
}
```

- [ ] **Step 2: Seed verisi (CurriculumHourSeedData)**

`SubjectSeedData` desenini birebir izle. **Kural:** Bir seviye için ya TÜM dersleri seed et (toplam = analiz §8.1 kademe toplamı) ya da hiç etme (resolver 0 → Undefined). Aşağıda ortaokul 5. sınıf TAM set (analiz §8.2, zorunlu toplam 29) worked-example olarak verilmiştir; 6-7-8 ve 9-12 aynı yapıyla analiz §8.1/§8.2/§8.3 değerlerinden tamamlanır. `MasterSeedIds.Subjects.*` mevcut ders Id'leridir.

```csharp
// src/Oksis.Infrastructure/Persistence/Seed/MasterData/CurriculumHourSeedData.cs
using Oksis.Domain.Modules.Academics;
using Oksis.Domain.Modules.Academics.Enums;

namespace Oksis.Infrastructure.Persistence.Seed.MasterData;

internal static class CurriculumHourSeedData
{
    public static IEnumerable<object> Rows() =>
    [
        // --- Ortaokul 5. sınıf (analiz §8.2 — zorunlu toplam 29) ---
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.Turkish,    6, false),
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.Math,       5, false),
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.Science,    4, false),
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.Social,     3, false),
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.English,    3, false),
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.Religion,   2, false),
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.Computing,  2, false),
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.PhysicalEd, 2, false),
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.Visual,     1, false),
        Row(EducationLevel.Middle, "5", MasterSeedIds.Subjects.Music,      1, false),
        // TODO(seed): 6,7,8 (Middle) ve 9-12 (High) aynı desenle analiz §8.1/§8.2/§8.3'ten tamamlanır.
        // Her seviyenin seed satır toplamı analiz §8.1 kademe toplamına eşit olmalı; aksi halde
        // seviye HİÇ seed edilmez (resolver Undefined döner — bilinçli gri durum).
    ];

    private static object Row(EducationLevel level, string grade, Guid subjectId, int hours, bool isElective) => new
    {
        Id = SeedGuid.From($"curr:{CurriculumVersions.Active}:{grade}:{subjectId}"),
        EducationLevel = level,
        GradeLevelCode = grade,
        SubjectId = subjectId,
        WeeklyHours = hours,
        IsElective = isElective,
        MebDecision = CurriculumVersions.ActiveDecision,
        Version = CurriculumVersions.Active,
        CreatedAt = SeedAudit.CreatedAt,
        CreatedBy = SeedAudit.SystemUserId,
        IsDeleted = false,
    };
}
```

> **Not (no-placeholder istisnası):** Yukarıdaki `TODO(seed)` bir kod placeholder'ı değil, seed VERİSİ tamamlama talimatıdır (model gerçek, çekirdek 5. sınıfla doğrulanır). Plan kabul kriteri: en az ortaokul 5 tam seed + resolver testi yeşil. Diğer seviyeler aynı `Row(...)` ile eklenir.

- [ ] **Step 3: Master config**

```csharp
// src/Oksis.Infrastructure/Persistence/Configurations/Academics/CurriculumHourTemplateConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Academics.Entities;
using Oksis.Infrastructure.Persistence.Seed.MasterData;

namespace Oksis.Infrastructure.Persistence.Configurations.Academics;

public sealed class CurriculumHourTemplateConfiguration : IEntityTypeConfiguration<CurriculumHourTemplate>
{
    public void Configure(EntityTypeBuilder<CurriculumHourTemplate> builder)
    {
        builder.ToMasterTable("curriculum_hour_templates");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.EducationLevel).HasConversion<string>().HasMaxLength(30).IsRequired();
        builder.Property(x => x.GradeLevelCode).IsRequired().HasMaxLength(10);
        builder.Property(x => x.SubjectId).IsRequired();
        builder.Property(x => x.WeeklyHours).IsRequired();
        builder.Property(x => x.IsElective).IsRequired();
        builder.Property(x => x.MebDecision).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Version).IsRequired().HasMaxLength(20);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        builder.HasIndex(x => new { x.Version, x.GradeLevelCode, x.SubjectId })
            .IsUnique()
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ux_curriculum_hour_templates_ver_grade_subject");

        builder.HasIndex(x => new { x.Version, x.GradeLevelCode })
            .HasDatabaseName("ix_curriculum_hour_templates_ver_grade");

        builder.HasData(CurriculumHourSeedData.Rows());
    }
}
```

- [ ] **Step 4: Tenant config**

```csharp
// src/Oksis.Infrastructure/Persistence/Configurations/Academics/SchoolWeeklyHourOverrideConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Academics.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Academics;

public sealed class SchoolWeeklyHourOverrideConfiguration : IEntityTypeConfiguration<SchoolWeeklyHourOverride>
{
    public void Configure(EntityTypeBuilder<SchoolWeeklyHourOverride> builder)
    {
        builder.ToAcademicTable("school_weekly_hour_overrides");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AcademicSessionId).IsRequired();
        builder.Property(x => x.GradeLevelCode).IsRequired().HasMaxLength(10);
        builder.Property(x => x.SubjectId).IsRequired();
        builder.Property(x => x.WeeklyHours).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(500);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        builder.HasIndex(x => new { x.SchoolId, x.AcademicSessionId, x.GradeLevelCode, x.SubjectId })
            .IsUnique()
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ux_school_weekly_hour_overrides_active");
    }
}
```

- [ ] **Step 5: DbSet'leri ekle**

`IApplicationDbContext.cs` (Academics master grubuna yakın) ekle:

```csharp
DbSet<CurriculumHourTemplate> CurriculumHourTemplates { get; }
DbSet<SchoolWeeklyHourOverride> SchoolWeeklyHourOverrides { get; }
```

`ApplicationDbContext.cs`'te karşılık gelen `public DbSet<...> X => Set<...>();` (mevcut dosyadaki birebir desen) ve gerekli `using` ekle.

- [ ] **Step 6: Derleme**

Run: `dotnet build`
Expected: 0 error (migration henüz yok — Task B2'de).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Müfredat Saati — EF config (master+tenant) + seed + DbSet + sürüm sabiti."
```

---

## Task A5: `IRequiredHoursResolver` (abstraction + impl + integration test)

**Files:**
- Create: `src/Oksis.Application/Modules/Academics/Curriculum/IRequiredHoursResolver.cs`
- Create: `src/Oksis.Infrastructure/Academics/RequiredHoursResolver.cs`
- Modify: DI kaydı — `src/Oksis.Infrastructure/DependencyInjection.cs` (mevcut servis kayıt deseni neyse oraya `services.AddScoped<IRequiredHoursResolver, RequiredHoursResolver>();`)
- Test: `tests/Oksis.Application.UnitTests/Modules/Academics/RequiredHoursResolverTests.cs`

- [ ] **Step 1: Abstraction**

```csharp
// src/Oksis.Application/Modules/Academics/Curriculum/IRequiredHoursResolver.cs
namespace Oksis.Application.Modules.Academics.Curriculum;

/// <summary>
/// Bir seviyenin gerekli haftalık toplam saatini (hedef) çözer:
/// override (tenant) > master (MEB şablonu). Seed yoksa o seviye dict'te
/// bulunmaz → çağıran 0/Undefined kabul eder.
/// </summary>
public interface IRequiredHoursResolver
{
    Task<IReadOnlyDictionary<string, int>> GetRequiredTotalHoursAsync(
        Guid academicSessionId,
        IReadOnlyCollection<string> gradeLevelCodes,
        CancellationToken cancellationToken);
}
```

- [ ] **Step 2: Failing test (MockQueryable ile)**

Mevcut `tests/Oksis.Application.UnitTests/Modules/Teachers/*` testlerindeki `IApplicationDbContext` mock kurulumunu birebir referans al (`Substitute.For<IApplicationDbContext>()` + `.CurriculumHourTemplates.Returns(list.BuildMockDbSet())`). Resolver impl `IApplicationDbContext` aldığı için Application testinde mock'lanır.

```csharp
// tests/Oksis.Application.UnitTests/Modules/Academics/RequiredHoursResolverTests.cs
using FluentAssertions;
using MockQueryable;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.Academics;
using Oksis.Domain.Modules.Academics.Entities;
using Oksis.Domain.Modules.Academics.Enums;
using Oksis.Infrastructure.Academics; // RequiredHoursResolver
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Academics;

public sealed class RequiredHoursResolverTests
{
    private static CurriculumHourTemplate Tpl(string grade, Guid subjectId, int hours) =>
        CurriculumHourTemplate.Create(Guid.NewGuid(), EducationLevel.Middle, grade, subjectId, hours, false, "2025/04 TTK", CurriculumVersions.Active);

    [Fact]
    public async Task Sums_master_hours_per_grade()
    {
        var s1 = Guid.NewGuid(); var s2 = Guid.NewGuid();
        var templates = new[] { Tpl("5", s1, 6), Tpl("5", s2, 5) };
        var db = Substitute.For<IApplicationDbContext>();
        db.CurriculumHourTemplates.Returns(templates.BuildMockDbSet());
        db.SchoolWeeklyHourOverrides.Returns(Array.Empty<SchoolWeeklyHourOverride>().BuildMockDbSet());
        var sut = new RequiredHoursResolver(db);

        var result = await sut.GetRequiredTotalHoursAsync(Guid.NewGuid(), new[] { "5" }, default);

        result["5"].Should().Be(11);
    }

    [Fact]
    public async Task Override_takes_precedence_over_master()
    {
        var subj = Guid.NewGuid();
        var session = Guid.NewGuid();
        var templates = new[] { Tpl("5", subj, 6) };
        var overrides = new[] { SchoolWeeklyHourOverride.Create(Guid.NewGuid(), session, "5", subj, 9, null) };
        var db = Substitute.For<IApplicationDbContext>();
        db.CurriculumHourTemplates.Returns(templates.BuildMockDbSet());
        db.SchoolWeeklyHourOverrides.Returns(overrides.BuildMockDbSet());
        var sut = new RequiredHoursResolver(db);

        var result = await sut.GetRequiredTotalHoursAsync(session, new[] { "5" }, default);

        result["5"].Should().Be(9);
    }

    [Fact]
    public async Task Unseeded_grade_absent_from_dict()
    {
        var db = Substitute.For<IApplicationDbContext>();
        db.CurriculumHourTemplates.Returns(Array.Empty<CurriculumHourTemplate>().BuildMockDbSet());
        db.SchoolWeeklyHourOverrides.Returns(Array.Empty<SchoolWeeklyHourOverride>().BuildMockDbSet());
        var sut = new RequiredHoursResolver(db);

        var result = await sut.GetRequiredTotalHoursAsync(Guid.NewGuid(), new[] { "9" }, default);

        result.ContainsKey("9").Should().BeFalse();
    }
}
```

- [ ] **Step 3: Testi çalıştır, fail gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~RequiredHoursResolverTests"`
Expected: FAIL — `RequiredHoursResolver` yok.

- [ ] **Step 4: Impl yaz**

```csharp
// src/Oksis.Infrastructure/Academics/RequiredHoursResolver.cs
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Academics.Curriculum;
using Oksis.Domain.Modules.Academics;

namespace Oksis.Infrastructure.Academics;

public sealed class RequiredHoursResolver(IApplicationDbContext db) : IRequiredHoursResolver
{
    public async Task<IReadOnlyDictionary<string, int>> GetRequiredTotalHoursAsync(
        Guid academicSessionId,
        IReadOnlyCollection<string> gradeLevelCodes,
        CancellationToken cancellationToken)
    {
        var codes = gradeLevelCodes.Distinct().ToArray();
        if (codes.Length == 0)
        {
            return new Dictionary<string, int>();
        }

        var templates = await db.CurriculumHourTemplates
            .AsNoTracking()
            .Where(t => t.Version == CurriculumVersions.Active && codes.Contains(t.GradeLevelCode))
            .Select(t => new { t.GradeLevelCode, t.SubjectId, t.WeeklyHours })
            .ToListAsync(cancellationToken);

        var overrides = await db.SchoolWeeklyHourOverrides
            .AsNoTracking()
            .Where(o => o.AcademicSessionId == academicSessionId && codes.Contains(o.GradeLevelCode))
            .Select(o => new { o.GradeLevelCode, o.SubjectId, o.WeeklyHours })
            .ToListAsync(cancellationToken);

        var overrideMap = overrides.ToDictionary(o => (o.GradeLevelCode, o.SubjectId), o => o.WeeklyHours);

        var totals = new Dictionary<string, int>();
        foreach (var t in templates)
        {
            var effective = overrideMap.TryGetValue((t.GradeLevelCode, t.SubjectId), out var ov)
                ? ov
                : t.WeeklyHours;
            totals[t.GradeLevelCode] = totals.GetValueOrDefault(t.GradeLevelCode) + effective;
        }

        return totals;
    }
}
```

> Perf notu: Redis uzun-TTL cache (spec §2.2) bilinçli olarak ertelendi — hub sık-çağrılan bir uç değil, veri küçük. Cache eklendiğinde anahtar `curriculum:{version}:{grade}` olur.

- [ ] **Step 5: DI kaydı + test pass**

`DependencyInjection.cs`'e `services.AddScoped<IRequiredHoursResolver, RequiredHoursResolver>();` ekle.
Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~RequiredHoursResolverTests"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat,test: Müfredat Saati — IRequiredHoursResolver (override>master, seviye toplamı)."
```

---

# BÖLÜM B — HUB BACKEND (oksis-api)

## Task B1: İzin + RolePermission seed

**Files:**
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/PermissionSeedData.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/RolePermissionSeedData.cs` (mevcut dosya — teaching-assignments.assign eşlemesinin yanına)

- [ ] **Step 1: Permission satırları ekle**

`PermissionSeedData.Rows()` içine (mevcut `TeachingAssignmentsAssign` satırının yanına):

```csharp
Row(MasterSeedIds.Permissions.TeachingAssignmentsCopySeason, "TEACHING_ASSIGNMENTS", "COPY_SEASON", "teaching-assignments.copy-season", "Önceki sezondan görevlendirme kopyala"),
Row(MasterSeedIds.Permissions.CurriculumHoursView,           "CURRICULUM_HOURS",     "VIEW",        "curriculum-hours.view",           "Müfredat haftalık saat görüntüleme"),
```

- [ ] **Step 2: RolePermission eşlemeleri ekle**

`RolePermissionSeedData` içinde, mevcut `teaching-assignments.assign` → SCHOOL_ADMIN eşlemesinin yanına aynı `Row(roleId, permissionId)` deseniyle:
- `Roles.SchoolAdmin` → `Permissions.TeachingAssignmentsCopySeason`
- `Roles.SchoolAdmin` → `Permissions.CurriculumHoursView`
- `Roles.SuperAdmin` → `Permissions.CurriculumHoursView` (read-only audit)
- `Roles.Teacher` → `Permissions.CurriculumHoursView` (kendi yükü ekranında dolaylı okuma)

(SuperAdmin'e copy-season VERİLMEZ — spec §2.5.)

- [ ] **Step 3: Derleme**

Run: `dotnet build src/Oksis.Infrastructure`
Expected: 0 error.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub — copy-season + curriculum-hours.view izin/rol seed."
```

---

## Task B2: Migration (curriculum tabloları + yeni izinler)

**Files:**
- Create (generated): `src/Oksis.Infrastructure/Persistence/Migrations/<ts>_20260614_gorevlendirme_hub.cs`

- [ ] **Step 1: Migration üret**

Run:
```bash
cd oksis-api
dotnet ef migrations add 20260614_gorevlendirme_hub \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```

- [ ] **Step 2: Migration'ı doğrula**

Üretilen dosyada şunlar OLMALI:
- `master.curriculum_hour_templates` + `academic.school_weekly_hour_overrides` `CreateTable`.
- `ux_curriculum_hour_templates_ver_grade_subject` (filtered) + `ux_school_weekly_hour_overrides_active` (filtered) index.
- `master.permissions` ve `master.role_permissions`'a yeni satır `InsertData` (copy-season, curriculum-hours.view + rol eşlemeleri).
- `master.curriculum_hour_templates`'a seed satır `InsertData` (ortaokul 5 set).

Beklenmedik tablo değişikliği YOKSA devam et. Varsa entity/config'i düzelt, migration'ı `dotnet ef migrations remove` ile geri al ve yeniden üret.

- [ ] **Step 3: Derleme + tüm testler**

Run: `dotnet build && dotnet test`
Expected: build 0 error; mevcut testler + A bölümü testleri yeşil.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub — migration (curriculum tabloları + index + izin/seed)."
```

---

## Task B3: `AssignSubjectClass` — branşsız öğretmen hard-block (+test)

**Files:**
- Modify: `src/Oksis.Application/Modules/Teachers/Commands/AssignSubjectClass/AssignSubjectClassCommandHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Teachers/AssignSubjectClassCommandHandlerTests.cs` (mevcutsa genişlet, yoksa oluştur)

- [ ] **Step 1: Failing test ekle**

Mevcut handler testindeki mock kurulumunu izle (ClassRooms/Subjects/Profiles/TeachingAssignments mock'lanır). Branş'ı boş bir `TeacherProfile` ile:

```csharp
[Fact]
public async Task Rejects_teacher_without_branch()
{
    // arrange: classRoom Active, subject var, teacherProfile.Branch = null, IsTerminated=false
    // (mevcut testteki BuildHandler/seed helper'larını kullan)
    var result = await handler.Handle(
        new AssignSubjectClassCommand(teacherId, classRoomId, subjectId, 4), default);

    result.IsFailure.Should().BeTrue();
    result.Error.Code.Should().Be("teaching-assignments.errors.teacher-no-branch");
}
```

- [ ] **Step 2: Testi çalıştır, fail gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AssignSubjectClassCommandHandlerTests"`
Expected: FAIL (şu an branşsız öğretmen geçiyor).

- [ ] **Step 3: Handler'a kontrol ekle**

`IsTerminated` kontrolünün hemen ardına:

```csharp
// §5.8: branşı tanımsız öğretmene görevlendirme yapılamaz (önce branş tanımlanmalı).
if (string.IsNullOrWhiteSpace(teacherProfile.Branch))
{
    return Result<Guid>.Conflict("teaching-assignments.errors.teacher-no-branch");
}
```

- [ ] **Step 4: Testi çalıştır, pass gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AssignSubjectClassCommandHandlerTests"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat,test: Görevlendirme — branşsız öğretmene atama hard-block (§5.8)."
```

---

## Task B4: `AssignmentsCopiedEvent` domain event

**Files:**
- Create: `src/Oksis.Domain/Modules/Teachers/Events/AssignmentsCopiedEvent.cs`

- [ ] **Step 1: Event'i yaz**

```csharp
// src/Oksis.Domain/Modules/Teachers/Events/AssignmentsCopiedEvent.cs
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Teachers.Events;

/// <summary>Önceki sezondan görevlendirme kopyalama tamamlandığında yayınlanır (Dashboard/Audit).</summary>
public sealed record AssignmentsCopiedEvent(
    Guid SchoolId,
    Guid SourceSessionId,
    Guid TargetSessionId,
    int CopiedCount) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
```

> `IDomainEvent.OccurredAt` mevcut event'lerde (`TeachingAssignmentChangedEvent`) nasıl set ediliyorsa ona uy (mevcut event `DateTimeOffset.UtcNow` kullanıyor).

- [ ] **Step 2: Derleme**

Run: `dotnet build src/Oksis.Domain`
Expected: 0 error.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme — AssignmentsCopiedEvent."
```

---

## Task B5: `CopyAssignmentsToNewSeasonCommand` (+handler+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Teachers/TeachingAssignments/Commands/CopyAssignmentsToNewSeason/CopyAssignmentsToNewSeasonCommand.cs`
- Create: `.../CopyAssignmentsToNewSeasonCommandHandler.cs`
- Create: `src/Oksis.Application/Modules/Teachers/TeachingAssignments/DTOs/CopyAssignmentsResult.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Teachers/CopyAssignmentsToNewSeasonCommandHandlerTests.cs`

- [ ] **Step 1: DTO + Command**

```csharp
// .../DTOs/CopyAssignmentsResult.cs
namespace Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;

public sealed record SkippedAssignment(string Reason, Guid SourceClassRoomId, Guid SubjectId, Guid TeacherId);

public sealed record CopyAssignmentsResult(int CopiedCount, IReadOnlyList<SkippedAssignment> Skipped);
```

```csharp
// .../Commands/CopyAssignmentsToNewSeason/CopyAssignmentsToNewSeasonCommand.cs
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;

namespace Oksis.Application.Modules.Teachers.TeachingAssignments.Commands.CopyAssignmentsToNewSeason;

/// <summary>
/// Kaynak sezonun aktif görevlendirmelerini hedef sezona kopyalar (spec §2.3).
/// Şube eşlemesi hedef ClassRoom.SourceClassRoomId == kaynak ClassRoomId üzerinden.
/// Terminated öğretmen / arşiv şube / hedefte mevcut atama atlanır (idempotent).
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("teaching-assignments.copy-season")]
public sealed record CopyAssignmentsToNewSeasonCommand(
    Guid SourceSessionId,
    Guid TargetSessionId) : ICommand<CopyAssignmentsResult>;
```

- [ ] **Step 2: Failing test**

```csharp
// tests/.../CopyAssignmentsToNewSeasonCommandHandlerTests.cs
// Mock kurulumu mevcut Teachers handler testlerini izler.
// Senaryolar:
//  1) Tek aktif görevlendirme (kaynak şube S, hedef şube T.SourceClassRoomId==S) → CopiedCount==1.
//  2) Hedefte aynı (T, subject) aktif atama var → atlanır, Skipped "already-exists".
//  3) Öğretmen IsTerminated → atlanır, Skipped "teacher-terminated".
//  4) Hedef şube Archived → atlanır, Skipped "class-archived".
//  5) Eşleşen hedef şube yok (SourceClassRoomId hiçbir hedefe denk gelmiyor) → Skipped "no-target-class".
[Fact]
public async Task Copies_active_assignment_to_mapped_target_class()
{
    // arrange ... 
    var result = await handler.Handle(new CopyAssignmentsToNewSeasonCommand(sourceSession, targetSession), default);
    result.IsSuccess.Should().BeTrue();
    result.Value!.CopiedCount.Should().Be(1);
}
```

(5 senaryonun her biri ayrı `[Fact]` — mock veri kurulumunu mevcut test helper'larıyla yaz.)

- [ ] **Step 3: Testi çalıştır, fail gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CopyAssignmentsToNewSeasonCommandHandlerTests"`
Expected: FAIL.

- [ ] **Step 4: Handler yaz**

```csharp
// .../Commands/CopyAssignmentsToNewSeason/CopyAssignmentsToNewSeasonCommandHandler.cs
using Microsoft.EntityFrameworkCore;
using MediatR;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Common.Events; // DomainEventNotification<T>
using Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Teachers.Entities;
using Oksis.Domain.Modules.Teachers.Events;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Teachers.TeachingAssignments.Commands.CopyAssignmentsToNewSeason;

public sealed class CopyAssignmentsToNewSeasonCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICacheService cache,
    IPublisher publisher)
    : ICommandHandler<CopyAssignmentsToNewSeasonCommand, CopyAssignmentsResult>
{
    public async Task<Result<CopyAssignmentsResult>> Handle(
        CopyAssignmentsToNewSeasonCommand request,
        CancellationToken cancellationToken)
    {
        var sourceAssignments = await db.TeachingAssignments
            .AsNoTracking()
            .Where(a => a.AcademicSessionId == request.SourceSessionId && a.RevokedAt == null)
            .ToListAsync(cancellationToken);

        // Hedef şubeler: SourceClassRoomId → hedef ClassRoom haritası.
        var targetClasses = await db.ClassRooms
            .AsNoTracking()
            .Where(c => c.AcademicSessionId == request.TargetSessionId)
            .Select(c => new { c.Id, c.SourceClassRoomId, c.Status })
            .ToListAsync(cancellationToken);
        var targetBySource = targetClasses
            .Where(c => c.SourceClassRoomId != null)
            .ToDictionary(c => c.SourceClassRoomId!.Value, c => c);

        // Hedef sezonda zaten var olan aktif (class, subject) ikilileri.
        var existingTargets = await db.TeachingAssignments
            .AsNoTracking()
            .Where(a => a.AcademicSessionId == request.TargetSessionId && a.RevokedAt == null)
            .Select(a => new { a.ClassRoomId, a.SubjectId })
            .ToListAsync(cancellationToken);
        var existingSet = existingTargets.Select(x => (x.ClassRoomId, x.SubjectId)).ToHashSet();

        var teacherIds = sourceAssignments.Select(a => a.TeacherId).Distinct().ToArray();
        var terminatedTeachers = await db.Profiles
            .AsNoTracking()
            .OfType<TeacherProfile>()
            .Where(p => teacherIds.Contains(p.PersonId) && p.TerminatedAt != null)
            .Select(p => p.PersonId)
            .ToListAsync(cancellationToken);
        var terminatedSet = terminatedTeachers.ToHashSet();

        var skipped = new List<SkippedAssignment>();
        var toAdd = new List<TeachingAssignment>();

        foreach (var a in sourceAssignments)
        {
            if (terminatedSet.Contains(a.TeacherId))
            {
                skipped.Add(new SkippedAssignment("teacher-terminated", a.ClassRoomId, a.SubjectId, a.TeacherId));
                continue;
            }
            if (!targetBySource.TryGetValue(a.ClassRoomId, out var target))
            {
                skipped.Add(new SkippedAssignment("no-target-class", a.ClassRoomId, a.SubjectId, a.TeacherId));
                continue;
            }
            if (target.Status == ClassRoomStatus.Archived)
            {
                skipped.Add(new SkippedAssignment("class-archived", a.ClassRoomId, a.SubjectId, a.TeacherId));
                continue;
            }
            if (existingSet.Contains((target.Id, a.SubjectId)))
            {
                skipped.Add(new SkippedAssignment("already-exists", a.ClassRoomId, a.SubjectId, a.TeacherId));
                continue;
            }

            toAdd.Add(TeachingAssignment.Create(
                tenant.SchoolId, request.TargetSessionId, a.TeacherId, target.Id, a.SubjectId, a.WeeklyHours));
            existingSet.Add((target.Id, a.SubjectId)); // aynı çağrıda tekrar eklemeyi önle
        }

        if (toAdd.Count > 0)
        {
            db.TeachingAssignments.AddRange(toAdd);
            await db.SaveChangesAsync(cancellationToken);
            await cache.RemoveByPrefixAsync("teachers:workload:", cancellationToken);
            await publisher.Publish(
                new DomainEventNotification<AssignmentsCopiedEvent>(new AssignmentsCopiedEvent(
                    tenant.SchoolId, request.SourceSessionId, request.TargetSessionId, toAdd.Count)),
                cancellationToken);
        }

        return Result<CopyAssignmentsResult>.Success(new CopyAssignmentsResult(toAdd.Count, skipped));
    }
}
```

> **Önemli (event yayını):** Domain event'leri nasıl yayınlandığını mevcut bir command handler'dan doğrula. İki olasılık: (a) `IPublisher publisher` + `DomainEventNotification<T>` sarmalı (`new DomainEventNotification<AssignmentsCopiedEvent>(evt)`); (b) entity üzerinde `Raise(evt)` + `SaveChanges` interceptor outbox. `CopyAssignments` aggregate-dışı toplu işlem olduğu için **(a)** uygun: `publisher.Publish(new DomainEventNotification<AssignmentsCopiedEvent>(evt), ct)`. Yukarıdaki `DomainEventNotificationWrapperFor` yer tutucusunu, kodda gerçek tip olan `DomainEventNotification<AssignmentsCopiedEvent>` ile değiştir (namespace `Oksis.Application.Common.Events`). `ITenantContext` namespaceّını mevcut handler'lardan al (`Oksis.Application.Common.Abstractions`).

- [ ] **Step 5: Testi çalıştır, pass gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~CopyAssignmentsToNewSeasonCommandHandlerTests"`
Expected: PASS (5 senaryo).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat,test: Görevlendirme Hub — CopyAssignmentsToNewSeason (eşleme + atlama + idempotency)."
```

---

## Task B6: `GetAssignmentSummaryQuery` (+handler+test)

**Files:**
- Create: `.../TeachingAssignments/Queries/GetAssignmentSummary/{Query,Handler}.cs`
- Create: `.../TeachingAssignments/DTOs/AssignmentSummaryDto.cs`
- Test: `tests/.../GetAssignmentSummaryQueryHandlerTests.cs`

- [ ] **Step 1: DTO + Query**

```csharp
// DTOs/AssignmentSummaryDto.cs
namespace Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;
public sealed record AssignmentSummaryDto(int TotalAssignments, int MissingClasses, int MismatchedAssignments);
```

```csharp
// Queries/GetAssignmentSummary/GetAssignmentSummaryQuery.cs
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;

namespace Oksis.Application.Modules.Teachers.TeachingAssignments.Queries.GetAssignmentSummary;

[Tenancy(TenancyMode.Required)]
[RequirePermission("teaching-assignments.view")]
public sealed record GetAssignmentSummaryQuery(Guid? SessionId) : IQuery<AssignmentSummaryDto>;
```

- [ ] **Step 2: Failing test**

Senaryolar (mock): 3 aktif atama; 1'i yan branş (teacher.Branch != subject.Name) → `MismatchedAssignments==1`, `TotalAssignments==3`; seed'li seviyede hedef 11, sınıf toplamı 8 → `MissingClasses` o sınıfı sayar; hedefsiz seviye sayılmaz.

- [ ] **Step 3: Testi çalıştır, fail gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetAssignmentSummaryQueryHandlerTests"`
Expected: FAIL.

- [ ] **Step 4: Handler yaz**

```csharp
// Queries/GetAssignmentSummary/GetAssignmentSummaryQueryHandler.cs
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Academics.Curriculum;
using Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;
using Oksis.Application.Modules.Teachers.TeachingAssignments.Internal; // BranchMatching (Task B8'de)
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Teachers.TeachingAssignments.Queries.GetAssignmentSummary;

public sealed class GetAssignmentSummaryQueryHandler(
    IApplicationDbContext db,
    IRequiredHoursResolver requiredHours)
    : IQueryHandler<GetAssignmentSummaryQuery, AssignmentSummaryDto>
{
    public async Task<Result<AssignmentSummaryDto>> Handle(
        GetAssignmentSummaryQuery request, CancellationToken cancellationToken)
    {
        var sessionId = request.SessionId
            ?? await db.AcademicSessions.AsNoTracking()
                .Where(s => s.IsCurrent).Select(s => (Guid?)s.Id)
                .FirstOrDefaultAsync(cancellationToken);
        if (sessionId is null)
            return Result<AssignmentSummaryDto>.Success(new AssignmentSummaryDto(0, 0, 0));

        // Aktif atamalar + branş + ders adı (branchMatch için ham alanlar).
        var rows = await db.TeachingAssignments.AsNoTracking()
            .Where(a => a.AcademicSessionId == sessionId && a.RevokedAt == null)
            .Join(db.Profiles.OfType<TeacherProfile>().AsNoTracking(),
                a => a.TeacherId, p => p.PersonId, (a, p) => new { a, p.Branch })
            .Join(db.Subjects.AsNoTracking(),
                x => x.a.SubjectId, s => s.Id, (x, s) => new
                {
                    x.a.ClassRoomId, x.a.WeeklyHours, x.Branch, SubjectName = s.Name
                })
            .ToListAsync(cancellationToken);

        var total = rows.Count;
        var mismatched = rows.Count(r => !BranchMatching.IsMatch(r.Branch, r.SubjectName));

        // Şube hedefleri için: aktif şubeler + gradeLevelCode.
        var classes = await db.ClassRooms.AsNoTracking()
            .Where(c => c.AcademicSessionId == sessionId && c.Status != ClassRoomStatus.Archived)
            .Join(db.GradeLevels.AsNoTracking(),
                c => c.GradeLevelId, g => g.Id, (c, g) => new { c.Id, g.Code })
            .ToListAsync(cancellationToken);

        var hoursByClass = rows.GroupBy(r => r.ClassRoomId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.WeeklyHours));

        var targets = await requiredHours.GetRequiredTotalHoursAsync(
            sessionId.Value, classes.Select(c => c.Code).Distinct().ToArray(), cancellationToken);

        var missing = classes.Count(c =>
            targets.TryGetValue(c.Code, out var target) && target > 0
            && hoursByClass.GetValueOrDefault(c.Id) < target);

        return Result<AssignmentSummaryDto>.Success(new AssignmentSummaryDto(total, missing, mismatched));
    }
}
```

- [ ] **Step 5: Testi çalıştır, pass gör** (Task B8 `BranchMatching` önce gelmeli — bkz. not)

> **Sıra notu:** `BranchMatching` helper'ı Task B8'de oluşturuluyor ama B6/B7 de kullanıyor. **B8'i B6'dan ÖNCE uygula** (yalnız `BranchMatching` statik helper'ını). Plan sırası: B5 → **B8-helper** → B6 → B7 → B8-query. Basitlik için: B6'ya başlamadan `Internal/BranchMatching.cs`'i (Task B8 Step 1) oluştur.

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetAssignmentSummaryQueryHandlerTests"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat,test: Görevlendirme Hub — GetAssignmentSummary (gerçek hedefle eksik-sınıf + uyumsuz)."
```

---

## Task B7: `ListAssignmentClassesQuery` (sol panel) (+handler+test)

**Files:**
- Create: `.../TeachingAssignments/Queries/ListAssignmentClasses/{Query,Handler}.cs`
- Create: `.../TeachingAssignments/DTOs/AssignmentClassDto.cs`
- Test: `tests/.../ListAssignmentClassesQueryHandlerTests.cs`

- [ ] **Step 1: DTO + Query + FillStatus enum**

```csharp
// DTOs/AssignmentClassDto.cs
namespace Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;

public enum FillStatus { Undefined = 0, Empty = 1, Below = 2, OnTarget = 3, Over = 4 }

public sealed record AssignmentClassDto(
    Guid ClassRoomId, string FullName, string GradeLevelCode, string EducationLevel,
    int SubjectCount, int TotalWeeklyHours, int TargetHours, FillStatus FillStatus);
```

```csharp
// Queries/ListAssignmentClasses/ListAssignmentClassesQuery.cs
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;

namespace Oksis.Application.Modules.Teachers.TeachingAssignments.Queries.ListAssignmentClasses;

[Tenancy(TenancyMode.Required)]
[RequirePermission("teaching-assignments.view")]
public sealed record ListAssignmentClassesQuery(Guid? SessionId) : IQuery<IReadOnlyList<AssignmentClassDto>>;
```

- [ ] **Step 2: Failing test**

Senaryolar: 2 şube; biri toplam 11 hedef 11 → `OnTarget`; biri toplam 8 hedef 11 → `Below`; hedefsiz şube → `Undefined`; 0 atamalı şube → `Empty`. `EducationLevel` string ("Middle").

- [ ] **Step 3: Testi çalıştır, fail gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~ListAssignmentClassesQueryHandlerTests"`
Expected: FAIL.

- [ ] **Step 4: Handler yaz**

```csharp
// Queries/ListAssignmentClasses/ListAssignmentClassesQueryHandler.cs
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Academics.Curriculum;
using Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;
using Oksis.Domain.Modules.AcademicSessions.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Teachers.TeachingAssignments.Queries.ListAssignmentClasses;

public sealed class ListAssignmentClassesQueryHandler(
    IApplicationDbContext db,
    IRequiredHoursResolver requiredHours)
    : IQueryHandler<ListAssignmentClassesQuery, IReadOnlyList<AssignmentClassDto>>
{
    public async Task<Result<IReadOnlyList<AssignmentClassDto>>> Handle(
        ListAssignmentClassesQuery request, CancellationToken cancellationToken)
    {
        var sessionId = request.SessionId
            ?? await db.AcademicSessions.AsNoTracking()
                .Where(s => s.IsCurrent).Select(s => (Guid?)s.Id)
                .FirstOrDefaultAsync(cancellationToken);
        if (sessionId is null)
            return Result<IReadOnlyList<AssignmentClassDto>>.Success(Array.Empty<AssignmentClassDto>());

        var classes = await db.ClassRooms.AsNoTracking()
            .Where(c => c.AcademicSessionId == sessionId && c.Status != ClassRoomStatus.Archived)
            .Join(db.GradeLevels.AsNoTracking(), c => c.GradeLevelId, g => g.Id,
                (c, g) => new { c.Id, c.FullName, g.Code, g.EducationLevel })
            .ToListAsync(cancellationToken);

        var agg = await db.TeachingAssignments.AsNoTracking()
            .Where(a => a.AcademicSessionId == sessionId && a.RevokedAt == null)
            .GroupBy(a => a.ClassRoomId)
            .Select(g => new { ClassRoomId = g.Key, Count = g.Count(), Hours = g.Sum(x => x.WeeklyHours) })
            .ToListAsync(cancellationToken);
        var aggByClass = agg.ToDictionary(x => x.ClassRoomId);

        var targets = await requiredHours.GetRequiredTotalHoursAsync(
            sessionId.Value, classes.Select(c => c.Code).Distinct().ToArray(), cancellationToken);

        var result = classes
            .Select(c =>
            {
                var count = aggByClass.GetValueOrDefault(c.Id)?.Count ?? 0;
                var hours = aggByClass.GetValueOrDefault(c.Id)?.Hours ?? 0;
                var target = targets.GetValueOrDefault(c.Code);
                var status = ComputeFill(hours, target);
                return new AssignmentClassDto(c.Id, c.FullName, c.Code, c.EducationLevel.ToString(), count, hours, target, status);
            })
            .OrderBy(d => d.GradeLevelCode).ThenBy(d => d.FullName)
            .ToList();

        return Result<IReadOnlyList<AssignmentClassDto>>.Success(result);
    }

    private static FillStatus ComputeFill(int hours, int target)
    {
        if (target <= 0) return FillStatus.Undefined;
        if (hours == 0) return FillStatus.Empty;
        if (hours < target) return FillStatus.Below;
        if (hours > target) return FillStatus.Over;
        return FillStatus.OnTarget;
    }
}
```

- [ ] **Step 5: Testi çalıştır, pass gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~ListAssignmentClassesQueryHandlerTests"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat,test: Görevlendirme Hub — ListAssignmentClasses (kademe + doluluk durumu)."
```

---

## Task B8: `BranchMatching` helper + `ListClassAssignmentsQuery` (sağ panel) (+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Teachers/TeachingAssignments/Internal/BranchMatching.cs`
- Create: `.../Queries/ListClassAssignments/{Query,Handler}.cs`
- Create: `.../DTOs/ClassAssignmentRowDto.cs`
- Test: `tests/.../BranchMatchingTests.cs`, `tests/.../ListClassAssignmentsQueryHandlerTests.cs`

- [ ] **Step 1: BranchMatching helper + test (B6/B7'den ÖNCE uygula)**

```csharp
// Internal/BranchMatching.cs
using System.Globalization;

namespace Oksis.Application.Modules.Teachers.TeachingAssignments.Internal;

/// <summary>
/// Öğretmen branşı ↔ ders adı uyumu (spec §2.1, S-3). Normalize string karşılaştırması,
/// SQL'e çevrilemez → bellekte çağrılır.
/// </summary>
public static class BranchMatching
{
    public static bool IsMatch(string? teacherBranch, string subjectName)
    {
        if (string.IsNullOrWhiteSpace(teacherBranch)) return false;
        return Normalize(teacherBranch) == Normalize(subjectName);
    }

    private static string Normalize(string value) =>
        string.Concat(value.Trim().ToUpper(new CultureInfo("tr-TR")).Where(c => !char.IsWhiteSpace(c)));
}
```

```csharp
// tests/.../BranchMatchingTests.cs
using FluentAssertions;
using Oksis.Application.Modules.Teachers.TeachingAssignments.Internal;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Teachers;

public sealed class BranchMatchingTests
{
    [Theory]
    [InlineData("Matematik", "Matematik", true)]
    [InlineData("matematik", "Matematik", true)]
    [InlineData(" Fen Bilimleri ", "Fen Bilimleri", true)]
    [InlineData("Coğrafya", "Tarih", false)]
    [InlineData(null, "Matematik", false)]
    public void IsMatch_normalizes(string? branch, string subject, bool expected)
        => BranchMatching.IsMatch(branch, subject).Should().Be(expected);
}
```

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~BranchMatchingTests"` → önce FAIL, helper sonrası PASS.

- [ ] **Step 2: DTO + Query**

```csharp
// DTOs/ClassAssignmentRowDto.cs
namespace Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;

public sealed record ClassAssignmentRowDto(
    Guid Id, Guid SubjectId, string SubjectName, string SubjectCategory,
    Guid TeacherId, string TeacherName, string? TeacherBranch,
    bool BranchMatch, int WeeklyHours);
```

```csharp
// Queries/ListClassAssignments/ListClassAssignmentsQuery.cs
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;

namespace Oksis.Application.Modules.Teachers.TeachingAssignments.Queries.ListClassAssignments;

[Tenancy(TenancyMode.Required)]
[RequirePermission("teaching-assignments.view")]
public sealed record ListClassAssignmentsQuery(Guid ClassRoomId, Guid? SessionId) : IQuery<IReadOnlyList<ClassAssignmentRowDto>>;
```

- [ ] **Step 3: Failing test**

Senaryolar: branş==ders → `BranchMatch true`; Coğrafya öğretmeni → Tarih dersi → `BranchMatch false`; teacherName "Ahmet Yılmaz" (Person.Name.First+Last).

- [ ] **Step 4: Handler yaz**

```csharp
// Queries/ListClassAssignments/ListClassAssignmentsQueryHandler.cs
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Teachers.TeachingAssignments.DTOs;
using Oksis.Application.Modules.Teachers.TeachingAssignments.Internal;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Teachers.TeachingAssignments.Queries.ListClassAssignments;

public sealed class ListClassAssignmentsQueryHandler(IApplicationDbContext db)
    : IQueryHandler<ListClassAssignmentsQuery, IReadOnlyList<ClassAssignmentRowDto>>
{
    public async Task<Result<IReadOnlyList<ClassAssignmentRowDto>>> Handle(
        ListClassAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var sessionId = request.SessionId
            ?? await db.AcademicSessions.AsNoTracking()
                .Where(s => s.IsCurrent).Select(s => (Guid?)s.Id)
                .FirstOrDefaultAsync(cancellationToken);
        if (sessionId is null)
            return Result<IReadOnlyList<ClassAssignmentRowDto>>.Success(Array.Empty<ClassAssignmentRowDto>());

        // Ham projeksiyon (branchMatch bellekte hesaplanır — SQL'e çevrilemez).
        var raw = await db.TeachingAssignments.AsNoTracking()
            .Where(a => a.ClassRoomId == request.ClassRoomId
                     && a.AcademicSessionId == sessionId && a.RevokedAt == null)
            .Join(db.Subjects.AsNoTracking(), a => a.SubjectId, s => s.Id,
                (a, s) => new { a, SubjectName = s.Name, SubjectCategory = s.Category })
            .Join(db.Persons.AsNoTracking(), x => x.a.TeacherId, p => p.Id,
                (x, p) => new { x.a, x.SubjectName, x.SubjectCategory, First = p.Name.First, Last = p.Name.Last })
            .Join(db.Profiles.OfType<TeacherProfile>().AsNoTracking(), x => x.a.TeacherId, tp => tp.PersonId,
                (x, tp) => new
                {
                    x.a.Id, x.a.SubjectId, x.SubjectName, x.SubjectCategory,
                    x.a.TeacherId, x.First, x.Last, tp.Branch, x.a.WeeklyHours
                })
            .ToListAsync(cancellationToken);

        var result = raw
            .Select(r => new ClassAssignmentRowDto(
                r.Id, r.SubjectId, r.SubjectName, r.SubjectCategory.ToString(),
                r.TeacherId, $"{r.First} {r.Last}", r.Branch,
                BranchMatching.IsMatch(r.Branch, r.SubjectName), r.WeeklyHours))
            .OrderBy(d => d.SubjectName)
            .ToList();

        return Result<IReadOnlyList<ClassAssignmentRowDto>>.Success(result);
    }
}
```

- [ ] **Step 5: Testi çalıştır, pass gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~ListClassAssignmentsQueryHandlerTests"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat,test: Görevlendirme Hub — ListClassAssignments + BranchMatching helper."
```

---

## Task B9: Controller `TeachingAssignmentsHubController`

**Files:**
- Create: `src/Oksis.Api/Controllers/V1/TeachingAssignmentsHubController.cs`
- Create: `src/Oksis.Api/Controllers/V1/Models/CopyAssignmentsBody.cs` (mevcut body-model deseni neyse ona göre; inline record de olur)

- [ ] **Step 1: Controller yaz**

Mevcut `TeachingAssignmentsController.cs` desenini birebir izle (`[ApiController]`, `[Route("api/v1/teaching-assignments")]`, `[Authorize]`, `ISender sender`, her uç `sender.Send` + `ToHttpResult(HttpContext)`).

```csharp
// src/Oksis.Api/Controllers/V1/TeachingAssignmentsHubController.cs
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oksis.Application.Modules.Teachers.TeachingAssignments.Commands.CopyAssignmentsToNewSeason;
using Oksis.Application.Modules.Teachers.TeachingAssignments.Queries.GetAssignmentSummary;
using Oksis.Application.Modules.Teachers.TeachingAssignments.Queries.ListAssignmentClasses;
using Oksis.Application.Modules.Teachers.TeachingAssignments.Queries.ListClassAssignments;

namespace Oksis.Api.Controllers.V1;

[ApiController]
[Authorize]
[Route("api/v1/teaching-assignments")]
public sealed class TeachingAssignmentsHubController(ISender sender) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary([FromQuery] Guid? sessionId, CancellationToken ct)
    {
        var result = await sender.Send(new GetAssignmentSummaryQuery(sessionId), ct);
        return result.ToHttpResult(HttpContext);
    }

    [HttpGet("classes")]
    public async Task<IActionResult> Classes([FromQuery] Guid? sessionId, CancellationToken ct)
    {
        var result = await sender.Send(new ListAssignmentClassesQuery(sessionId), ct);
        return result.ToHttpResult(HttpContext);
    }

    [HttpGet("by-class/{classRoomId:guid}")]
    public async Task<IActionResult> ByClass(Guid classRoomId, [FromQuery] Guid? sessionId, CancellationToken ct)
    {
        var result = await sender.Send(new ListClassAssignmentsQuery(classRoomId, sessionId), ct);
        return result.ToHttpResult(HttpContext);
    }

    [HttpPost("copy-season")]
    public async Task<IActionResult> CopySeason([FromBody] CopyAssignmentsToNewSeasonCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        return result.ToHttpResult(HttpContext);
    }
}
```

> `ToHttpResult` extension namespace'ini mevcut controller'dan al (using ekle).

- [ ] **Step 2: Derleme + tüm API testleri**

Run: `dotnet build && dotnet test`
Expected: build 0 error; tüm testler yeşil.

- [ ] **Step 3: dotnet format**

Run: `dotnet format`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub — controller (summary/classes/by-class/copy-season)."
```

---

# BÖLÜM C — HUB FRONTEND (oksis-web)

> Tüm dosyalar `src/portals/admin/assignments/` altında. Mirror desen: `src/portals/admin/teachers/`. Named export, `any` yasak, inline style yasak, server state yalnız React Query.

## Task C1: İzin sabitleri + tipler

**Files:**
- Modify: `src/shared/auth/permissions.constants.ts`
- Create: `src/portals/admin/assignments/types/index.ts`

- [ ] **Step 1: İzin sabitleri**

`permissions.constants.ts`'e ekle:

```typescript
TEACHING_ASSIGNMENTS_COPY_SEASON: 'teaching-assignments.copy-season',
CURRICULUM_HOURS_VIEW: 'curriculum-hours.view',
```

- [ ] **Step 2: Tipler (backend DTO ayna)**

```typescript
// src/portals/admin/assignments/types/index.ts
export type FillStatus = 'Undefined' | 'Empty' | 'Below' | 'OnTarget' | 'Over';
export type EducationLevel = 'Preschool' | 'Primary' | 'Middle' | 'High';

export interface AssignmentSummary {
  totalAssignments: number;
  missingClasses: number;
  mismatchedAssignments: number;
}

export interface AssignmentClass {
  classRoomId: string;
  fullName: string;
  gradeLevelCode: string;
  educationLevel: EducationLevel;
  subjectCount: number;
  totalWeeklyHours: number;
  targetHours: number;
  fillStatus: FillStatus;
}

export interface ClassAssignmentRow {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCategory: string;
  teacherId: string;
  teacherName: string;
  teacherBranch: string | null;
  branchMatch: boolean;
  weeklyHours: number;
}

export interface CopyAssignmentsInput {
  sourceSessionId: string;
  targetSessionId: string;
}

export interface CopyAssignmentsResult {
  copiedCount: number;
  skipped: { reason: string; sourceClassRoomId: string; subjectId: string; teacherId: string }[];
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub web — izin sabitleri + tipler."
```

---

## Task C2: API modülü + keys

**Files:**
- Create: `src/portals/admin/assignments/api/assignmentsApi.ts`
- Create: `src/portals/admin/assignments/keys/assignmentKeys.ts`

- [ ] **Step 1: keys** (mirror `teacherKeys.ts`)

```typescript
// keys/assignmentKeys.ts
import { tenantScopedKey } from "../../../../shared/config/tenant";

export const assignmentKeys = {
  summary: (schoolId: string | null | undefined, sessionId: string | null) =>
    tenantScopedKey(schoolId, ["teaching-assignments", "summary", sessionId] as const),
  classes: (schoolId: string | null | undefined, sessionId: string | null) =>
    tenantScopedKey(schoolId, ["teaching-assignments", "classes", sessionId] as const),
  classRows: (schoolId: string | null | undefined, classId: string, sessionId: string | null) =>
    tenantScopedKey(schoolId, ["teaching-assignments", "class", classId, sessionId] as const),
};
```

- [ ] **Step 2: api** (mirror `teachersApi.ts`; `ApiEnvelope` tipini mevcut dosyadan al)

```typescript
// api/assignmentsApi.ts
import { httpClient } from "../../../../shared/api/httpClient";
import type {
  AssignmentClass, AssignmentSummary, ClassAssignmentRow,
  CopyAssignmentsInput, CopyAssignmentsResult,
} from "../types";

type Envelope<T> = { data: T };

export const assignmentsApi = {
  summary: async (sessionId: string | null, signal?: AbortSignal): Promise<AssignmentSummary> => {
    const res = await httpClient.get<Envelope<AssignmentSummary>>("/teaching-assignments/summary", {
      params: sessionId ? { sessionId } : undefined, signal,
    });
    return res.data.data;
  },
  classes: async (sessionId: string | null, signal?: AbortSignal): Promise<AssignmentClass[]> => {
    const res = await httpClient.get<Envelope<AssignmentClass[]>>("/teaching-assignments/classes", {
      params: sessionId ? { sessionId } : undefined, signal,
    });
    return res.data.data;
  },
  classRows: async (classId: string, sessionId: string | null, signal?: AbortSignal): Promise<ClassAssignmentRow[]> => {
    const res = await httpClient.get<Envelope<ClassAssignmentRow[]>>(`/teaching-assignments/by-class/${classId}`, {
      params: sessionId ? { sessionId } : undefined, signal,
    });
    return res.data.data;
  },
  copySeason: async (input: CopyAssignmentsInput): Promise<CopyAssignmentsResult> => {
    const res = await httpClient.post<Envelope<CopyAssignmentsResult>>("/teaching-assignments/copy-season", input);
    return res.data.data;
  },
};
```

> `Envelope<T>` yerine mevcut `ApiEnvelope` tipi varsa onu import et (teachersApi'deki `ApiEnvelope`).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub web — api + react-query keys."
```

---

## Task C3: Hooks + Zod şema

**Files:**
- Create: `src/portals/admin/assignments/hooks/useAssignmentHub.ts`
- Create: `src/portals/admin/assignments/schemas/assignSchema.ts`

- [ ] **Step 1: Zod şema**

```typescript
// schemas/assignSchema.ts
import { z } from "zod";

export const assignSchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  weeklyHours: z.coerce.number().int().min(1).max(40),
});

export type AssignFormValues = z.infer<typeof assignSchema>;
```

- [ ] **Step 2: Hooks** (mirror `useTeacherAssignments.ts`; aktif sezon + tenant schoolId mevcut store/hook'tan — `useActiveSessionId`/`useTenantSchoolId` neyse onu kullan; yoksa teachers feature'ında sezon nasıl alınıyorsa aynısı)

```typescript
// hooks/useAssignmentHub.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsApi } from "../api/assignmentsApi";
import { assignmentKeys } from "../keys/assignmentKeys";
import type { CopyAssignmentsInput } from "../types";

export function useAssignmentSummary(schoolId: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: assignmentKeys.summary(schoolId, sessionId),
    queryFn: ({ signal }) => assignmentsApi.summary(sessionId, signal),
  });
}

export function useAssignmentClasses(schoolId: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: assignmentKeys.classes(schoolId, sessionId),
    queryFn: ({ signal }) => assignmentsApi.classes(sessionId, signal),
  });
}

export function useClassAssignmentRows(schoolId: string | null, classId: string | null, sessionId: string | null) {
  return useQuery({
    queryKey: classId ? assignmentKeys.classRows(schoolId, classId, sessionId) : ["noop"],
    queryFn: ({ signal }) => assignmentsApi.classRows(classId as string, sessionId, signal),
    enabled: Boolean(classId),
  });
}

export function useCopySeason(schoolId: string | null, sessionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CopyAssignmentsInput) => assignmentsApi.copySeason(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentKeys.summary(schoolId, sessionId) });
      qc.invalidateQueries({ queryKey: assignmentKeys.classes(schoolId, sessionId) });
    },
  });
}
```

> "Yeni Görevlendirme" yazma işlemi MEVCUT `teachersApi.assign`/`useAssignmentMutations`'ı yeniden kullanır (POST `/teachers/{teacherId}/assignments`). Modal başarısında `assignmentKeys.classes` + `classRows(classId)` + `summary` invalidate edilir.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub web — hooks + Zod şema."
```

---

## Task C4: Bileşenler — Sidebar (kademe gruplu) + doluluk rozeti

**Files:**
- Create: `src/portals/admin/assignments/components/FillBadge.tsx`
- Create: `src/portals/admin/assignments/components/ClassSidebar.tsx`
- Create: `src/portals/admin/assignments/lib/kademe.ts`

- [ ] **Step 1: kademe yardımcısı** (handoff `ACA_KADEME` mantığı — EducationLevel'dan türetilir)

```typescript
// lib/kademe.ts
import type { AssignmentClass, EducationLevel } from "../types";

const KADEME_ORDER: { level: EducationLevel; label: string }[] = [
  { level: "Preschool", label: "Anaokulu" },
  { level: "Primary", label: "İlkokul" },
  { level: "Middle", label: "Ortaokul" },
  { level: "High", label: "Lise" },
];

export interface KademeGroup { level: EducationLevel; label: string; classes: AssignmentClass[]; }

export function groupByKademe(classes: AssignmentClass[]): KademeGroup[] {
  return KADEME_ORDER
    .map((k) => ({ ...k, classes: classes.filter((c) => c.educationLevel === k.level) }))
    .filter((g) => g.classes.length > 0);
}
```

- [ ] **Step 2: FillBadge** (renk: Undefined→gri, Empty→gri, Below→amber, OnTarget→yeşil, Over→kırmızı; Tailwind, inline style yok)

```tsx
// components/FillBadge.tsx
import { cn } from "../../../../shared/lib/cn"; // mevcut cn util yolu
import type { AssignmentClass } from "../types";

const TONE: Record<string, string> = {
  Undefined: "bg-muted text-muted-foreground",
  Empty: "bg-muted text-muted-foreground",
  Below: "bg-amber-100 text-amber-800",
  OnTarget: "bg-emerald-100 text-emerald-800",
  Over: "bg-red-100 text-red-800",
};

export function FillBadge({ cls }: { cls: AssignmentClass }) {
  const label = cls.targetHours > 0 ? `${cls.totalWeeklyHours}/${cls.targetHours}` : `${cls.totalWeeklyHours}/—`;
  return <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", TONE[cls.fillStatus])}>{label}</span>;
}
```

> `cn` util'in gerçek yolunu mevcut bir component'ten doğrula (`shared/lib/utils` veya `shared/lib/cn`).

- [ ] **Step 3: ClassSidebar** (arama + kademe-gruplu seviye çipleri + sınıf listesi; seçili sınıf prop ile)

```tsx
// components/ClassSidebar.tsx
import { useMemo, useState } from "react";
import { cn } from "../../../../shared/lib/cn";
import type { AssignmentClass } from "../types";
import { groupByKademe } from "../lib/kademe";
import { FillBadge } from "./FillBadge";

interface Props {
  classes: AssignmentClass[];
  selectedClassId: string | null;
  onSelect: (classId: string) => void;
}

export function ClassSidebar({ classes, selectedClassId, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  const filtered = useMemo(
    () => classes.filter((c) =>
      (!search || c.fullName.toLowerCase().includes(search.toLowerCase())) &&
      (!levelFilter || c.gradeLevelCode === levelFilter)),
    [classes, search, levelFilter],
  );
  const groups = useMemo(() => groupByKademe(filtered), [filtered]);
  const levelGroups = useMemo(() => groupByKademe(classes), [classes]);

  return (
    <aside className="flex w-72 flex-col gap-3 border-r p-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Sınıf ara…"
        className="rounded border px-2 py-1 text-sm"
      />
      <div className="flex flex-col gap-2">
        {levelGroups.map((g) => (
          <div key={g.level}>
            <div className="mb-1 text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">{g.label}</div>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(g.classes.map((c) => c.gradeLevelCode))].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLevelFilter(levelFilter === code ? null : code)}
                  className={cn("rounded px-2 py-0.5 text-xs", levelFilter === code ? "bg-primary text-primary-foreground" : "bg-muted")}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-1 overflow-auto">
        {groups.flatMap((g) => g.classes).map((c) => (
          <li key={c.classRoomId}>
            <button
              type="button"
              onClick={() => onSelect(c.classRoomId)}
              className={cn("flex w-full items-center justify-between rounded px-2 py-2 text-sm",
                selectedClassId === c.classRoomId ? "bg-accent" : "hover:bg-muted")}
            >
              <span>{c.fullName}<span className="ml-2 text-xs text-muted-foreground">{c.subjectCount} ders</span></span>
              <FillBadge cls={c} />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

> Tailwind sınıfları mevcut tasarım token'larına göre ince ayar yapılır (handoff `academics.css`/`brand.css` referans); yapı/sınıf adları yukarıdaki gibi.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub web — ClassSidebar (kademe gruplu) + FillBadge."
```

---

## Task C5: Bileşenler — Özet metrikler + sağ panel tablo (branş rozeti)

**Files:**
- Create: `src/portals/admin/assignments/components/AssignmentSummaryBar.tsx`
- Create: `src/portals/admin/assignments/components/BranchMatchBadge.tsx`
- Create: `src/portals/admin/assignments/components/AssignmentTable.tsx`

- [ ] **Step 1: AssignmentSummaryBar** (3 metrik: Görevlendirme / Eksik Sınıf / Uyumsuz Atama)

```tsx
// components/AssignmentSummaryBar.tsx
import type { AssignmentSummary } from "../types";

export function AssignmentSummaryBar({ summary }: { summary: AssignmentSummary }) {
  const items = [
    { label: "Görevlendirme", value: summary.totalAssignments, tone: "text-foreground" },
    { label: "Eksik Sınıf", value: summary.missingClasses, tone: "text-amber-600" },
    { label: "Uyumsuz Atama", value: summary.mismatchedAssignments, tone: "text-red-600" },
  ];
  return (
    <div className="flex gap-6">
      {items.map((i) => (
        <div key={i.label} className="text-center">
          <div className={`text-2xl font-bold ${i.tone}`}>{i.value}</div>
          <div className="text-xs text-muted-foreground">{i.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: BranchMatchBadge**

```tsx
// components/BranchMatchBadge.tsx
export function BranchMatchBadge({ match }: { match: boolean }) {
  return match
    ? <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">✓ Uyumlu</span>
    : <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">⚠ Yan branş</span>;
}
```

- [ ] **Step 3: AssignmentTable** (shadcn `DataTable` wrapper; kolonlar DERS/ÖĞRETMEN/BRANŞ UYUMU/HAFTALIK SAAT + kaldır aksiyonu)

`DataTable` kullanımını mevcut `teachers/components/TeachersTable.tsx`'ten birebir desenle. Kolonlar:
- DERS: `subjectName` + kategori renkli nokta
- ÖĞRETMEN: avatar (baş harf) + `teacherName` + `teacherBranch`
- BRANŞ UYUMU: `<BranchMatchBadge match={row.branchMatch} />`
- HAFTALIK SAAT: `weeklyHours`
- rowActions: "Kaldır" → mevcut `teachersApi.unassign(teacherId, id)` (izin `TEACHING_ASSIGNMENTS_ASSIGN`); başarıda `classRows`+`classes`+`summary` invalidate.

Durum varyantları DataTable `isLoading`/`error` + boş slot ("Bu sınıfa henüz görevlendirme yok").

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub web — özet metrikler + sağ panel tablo + branş rozeti."
```

---

## Task C6: Yeni Görevlendirme modal (RHF + Zod) + Önceki Sezondan Kopyala

**Files:**
- Create: `src/portals/admin/assignments/components/NewAssignmentModal.tsx`
- Create: `src/portals/admin/assignments/components/CopySeasonButton.tsx`

- [ ] **Step 1: NewAssignmentModal** (RHF + `assignSchema`; ders/öğretmen seçimi mevcut `useSubjectOptionsQuery`/öğretmen listesi; seçili sınıf prop'tan sabit; submit → `teachersApi.assign(teacherId, {classRoomId, subjectId, weeklyHours})`)

Form alanları: Ders (select, mevcut `useSubjectOptionsQuery`), Öğretmen (select — mevcut öğretmen listesi hook'u), Haftalık Saat (number 1-40). `useForm({ resolver: zodResolver(assignSchema) })`. Hata mesajları Türkçe. Başarıda modal kapanır + invalidate.

> Sınıf seçimi modalda kademe `optgroup`'lu olabilir (handoff §4.2) ama hub'da sınıf zaten seçili → `classId` sabit, gizli alan. Çok-sınıf desteği istenirse handoff `optgroup` deseni eklenir.

- [ ] **Step 2: CopySeasonButton** (hedef = aktif sezon; kaynak sezon seçimi basit select; `useCopySeason`; başarıda sonuç toast "N kopyalandı, M atlandı"; izin `TEACHING_ASSIGNMENTS_COPY_SEASON` → `RequirePermission` ile gate)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub web — Yeni Görevlendirme (RHF+Zod) + Önceki Sezondan Kopyala."
```

---

## Task C7: Sayfa + route + sidebar + i18n

**Files:**
- Create: `src/portals/admin/assignments/AssignmentsPage.tsx`
- Create: `src/portals/admin/assignments/index.ts` (barrel)
- Modify: admin router (mevcut `src/portals/admin` route tanımı) — `assignments` route'u
- Modify: admin sidebar nav config — "Görevlendirmeler" öğesi (Akademik grubu)
- Modify: i18n — `assignments` namespace anahtarları (mevcut i18n dosya düzenine göre)

- [ ] **Step 1: AssignmentsPage** (master-detail kompozisyon: üst şerit + SummaryBar + CopySeasonButton + NewAssignment + ClassSidebar + AssignmentTable)

```tsx
// AssignmentsPage.tsx (iskelet — alt bileşenler Task C4-C6)
import { useState } from "react";
import { useAssignmentSummary, useAssignmentClasses, useClassAssignmentRows } from "./hooks/useAssignmentHub";
// ... tenant schoolId + aktif sessionId mevcut hook'lardan
export function AssignmentsPage() {
  const schoolId = /* useTenantSchoolId() */ null;
  const sessionId = /* useActiveSessionId() */ null;
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const summary = useAssignmentSummary(schoolId, sessionId);
  const classes = useAssignmentClasses(schoolId, sessionId);
  const rows = useClassAssignmentRows(schoolId, selectedClassId, sessionId);
  // üst şerit + iki panel; durum varyantları (skeleton/hata/boş)
  // ...
  return (/* JSX */ null);
}
```

> `useTenantSchoolId`/`useActiveSessionId` gerçek isimlerini teachers feature'ından doğrula ve kullan. Seçili sınıf + sezon URL search-param'a da yazılır (`useSearchParams`, `react-router`).

- [ ] **Step 2: Route + sidebar + i18n** — mevcut admin route ve nav config desenine göre "Akademik > Görevlendirmeler" (`/admin/.../assignments`), `RequirePermission permission={PERMISSIONS.TEACHING_ASSIGNMENTS_VIEW}` guard. i18n anahtarları (`assignments.title`, kolonlar, durumlar, butonlar) Türkçe.

- [ ] **Step 3: Build + lint**

Run: `cd oksis-web && npm run build`
Expected: 0 error.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "2026-06-14 feat: Görevlendirme Hub web — sayfa + route + sidebar + i18n."
```

---

## Task C8: Frontend testler (vitest)

**Files:**
- Create: `src/portals/admin/assignments/__tests__/ClassSidebar.test.tsx`
- Create: `src/portals/admin/assignments/__tests__/FillBadge.test.tsx`
- Create: `src/portals/admin/assignments/__tests__/AssignmentsPage.test.tsx`

- [ ] **Step 1: Testleri yaz**

- `FillBadge`: her FillStatus için doğru etiket/renk sınıfı; `Undefined` → "—".
- `ClassSidebar`: çok-kademe (Ortaokul+Lise) gruplama görünür; tek kademe → tek başlık; seviye çipi filtreler; sınıf seçimi `onSelect` çağırır.
- `AssignmentsPage`: MSW/mock ile boş/yükleniyor/hata/dolu varyantları; izin yokken "Yeni Görevlendirme" render edilmez.

(Mevcut `teachers/__tests__/*` test kurulumunu — QueryClient wrapper, mock httpClient — birebir referans al.)

- [ ] **Step 2: Çalıştır**

Run: `cd oksis-web && npm run test`
Expected: yeni testler dahil tüm suite yeşil.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "2026-06-14 test: Görevlendirme Hub web — sidebar/badge/sayfa testleri."
```

---

# BÖLÜM D — DOKÜMANTASYON

## Task D1: Modül dokümanları + completion_status

**Files:**
- Modify: `.claude/docs/modules/teachers/completion_status.md`
- Modify: `.claude/docs/modules/teachers/api-contracts.md` (yeni 4 uç)
- Modify: `.claude/docs/modules/teachers/database-schema.md` (curriculum tabloları + override)
- Modify: `.claude/docs/modules/teachers/permissions.md` + `.claude/docs/permission-matrix.md` (copy-season, curriculum-hours.view)
- (gerekirse) Create: `.claude/docs/modules/curriculum/` iskeleti veya teachers altına curriculum notu

- [ ] **Step 1: completion_status güncelle**

- Progress bar + `Güncel` tarih (2026-06-14).
- ✅'a taşı: sınıf-merkezli hub (summary/classes/by-class), copy-season, branchMatch, müfredat çekirdeği, branşsız hard-block.
- **Debt-BE:** "İzinli öğretmen engeli (leave-status modeli yok)".
- **⚠️ Spec Dışına Çıkılanlar:** S-1 (HomeroomAssignment iptal — ClassRoom'da mevcut), S-2 (rename gereksiz), S-5 (SchoolKind→EducationLevel), S-6 (override yazma ertelendi), Dapper→EF projection, copy-season yalnız SourceClassRoomId eşlemesi.
- **Ertelenen (ayrı iş):** Müfredat Saati tam modülü (yönetim ekranı/override-UI/import/INV-3/ince SchoolKind/tam TTK seed).

- [ ] **Step 2: api-contracts + database-schema + permissions güncelle**

Yeni uçlar (`/teaching-assignments/summary|classes|by-class|copy-season`), yeni tablolar (`curriculum_hour_templates` master, `school_weekly_hour_overrides` tenant) + index'ler, yeni izinler permission-matrix'e.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "2026-06-14 docs: Görevlendirme Hub + Müfredat çekirdeği — completion_status + api/schema/permissions güncel."
```

---

## Final doğrulama

- [ ] `cd oksis-api && dotnet build && dotnet test && dotnet format --verify-no-changes`
- [ ] `cd oksis-web && npm run build && npm run test`
- [ ] Manuel: hub açılır, kademe grupları görünür, sınıf seçilince sağ panel dolar, branş rozetleri doğru, yeni görevlendirme + kaldır çalışır, önceki sezondan kopyala raporu döner, doluluk rozeti seed'li seviyede gerçek hedef gösterir.

---

*Oksis — Görevlendirme Hub Implementation Plan · 2026-06-14*
