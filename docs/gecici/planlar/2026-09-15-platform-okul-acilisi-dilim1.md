# Platform Okul Açılışı — Dilim 1 Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Platform hesabıyla giriş yapan OKSİS personeli tek ekrandan yeni okul tanımlar; okul müdürüne davet e-postası gider; müdür o e-postayla hesabını açıp sezonsuz, seed'siz bir okulu sıfırdan kurmaya başlar.

**Architecture:** Okulsuz **platform hesabı** ayrı bir kimlik varlığı ve ayrı giriş ucudur; token'ı `school_id` taşımaz, `token_kind=platform` taşır ve tenant komutlarına giremez (`TenancyMode.PlatformOnly`). Okul açma komutu okulu yaratır, dar kurulum bağlamına geçer (`SetForLoginFlow`), ayarlara okul türünü yazıp kademeleri türetir, ilk yöneticiyi kişi olarak açar ve **sezonsuz** `SCHOOL_ADMIN` daveti üretir; e-posta mevcut `UserInvitedEvent → UserInvitedEmailHandler` zinciriyle gider. Okul yöneticisi rolü **okul düzeyinde** atanır (0020): `RoleAssignment.SeasonId` ve `Invitation.SeasonId` boş olabilir, boş = tüm sezonlarda geçerli; izin çözümleyici boş sezonlu atamayı her sezonda sayar.

**Tech Stack:** .NET 10 / C# 13, EF Core 10 (SQL Server), MediatR + FluentValidation, Argon2id (`IPasswordHasher`), JWT (`JwtOptions`), Hangfire (davet e-postası), Mailpit (dev SMTP), Next.js (app router) + openapi-fetch + TanStack Query.

**Spec:** Kararlar: `docs/domain/kararlar/0008-super-yonetici-platform-roludur.md`, `0019-platform-rol-seti-uc-rol.md` (ertelendi; yalnız `PLATFORM_ADMIN` hesabı bu dilimde), `0020-okul-yoneticisi-sezonsuz-atanir.md`. Karar panosu: `docs/bulgular/OKSİS - Yapısal Kararlar ve Eksikler.md` `K-27` (kapsam daraltması dâhil). Ölçüm: `docs/teknik-analizler/platform-kimligi/super-admin-izleri-envanteri.md`. Kapanacak bulgular: `E-24`, `TB-162`; ilerleyen: `TB-165`.

## Global Constraints

- Kod yalnız `oksis-api` (`~/Repositories/oksis-api`, branch `master` @ `4fb82833`) ve `oksis-ui` (`~/Repositories/oksis-ui` @ `aecfd09`) depolarına yazılır; belge, plan, rapor yalnız `~/Repositories/oksis/docs/` altına.
- `~/Repositories/antre` OKSİS değildir; dokunma.
- Tenant izolasyonu: `IgnoreQueryFilters()` yalnız gerekçe yorumu ile; `IsSuperAdmin` kısa devresine bu dilimde DOKUNULMAZ (`TB-139` kendi turunda).
- AutoMapper yok (Mapster); repository sarmalayıcı yok; controller'da `DbContext` yok (`ISender.Send`); domain'de EF/DataAnnotations yok; lazy loading yok; `async void` / `.Result` / `.Wait()` yok.
- Identifier'lar İngilizce, kullanıcıya görünen metin Türkçe (ö/ü/ş/ç/ğ/ı ile). Hata kodları `MODUL_...` biçiminde büyük harf; `_DUPLICATE` son eki 409'a eşlenir.
- Test koşumu: `./scripts/test-changed.sh` (birim + mimari bekçiler); entegrasyon `./scripts/test-changed.sh --integration` (Docker gerekir). Tam paket `dotnet test` yalnız bilinçli.
- Göç adı `<YYYYMMDD_name>`: `dotnet ef migrations add 20260916_<name> --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`; API göç uygulamaz, `dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api` şart.
- Commit öncesi `dotnet format`. Commit biçimi `<type>(<scope>): türkçe açıklama` (sonda nokta yok), gövde sonunda:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01W8ksrYqz3prgzeNCARapcp
  ```
- Dal: `feature/platform-okul-acilisi` (master'dan). Her görev kendi commit'i.
- Dev ortam: `docker compose up` (SQL Server, Redis, Mailpit 1025/8025), API `dotnet run --project src/Oksis.Api` → `http://localhost:5112`, web `pnpm dev` → `http://localhost:3000` (API'ye `/api/*` rewrite ile proxy).

---

## Dosya Haritası

**oksis-api — yeni**
- `src/Oksis.Domain/Modules/Identity/SchoolLevelRoles.cs` — okul-düzeyi rol kodları (0020)
- `src/Oksis.Application/Modules/Users/Common/SeasonScopeRule.cs` — rolün türüne göre sezon çözümü (davet + atama ortak)
- `src/Oksis.Domain/Modules/Platform/Entities/PlatformAccount.cs`, `.../Exceptions/PlatformDomainException.cs`
- `src/Oksis.Infrastructure/Persistence/Configurations/Platform/PlatformAccountConfiguration.cs`
- `src/Oksis.Infrastructure/Platform/{PlatformBootstrapOptions,PlatformAccountBootstrapper,PlatformContext,PlatformTokenIssuer}.cs`
- `src/Oksis.Infrastructure/Identity/JwtSigningCredentials.cs` — imza üretimi iki issuer için ortak
- `src/Oksis.Application/Modules/Platform/Abstractions/{IPlatformContext,IPlatformTokenIssuer,PlatformClaims}.cs`
- `src/Oksis.Application/Modules/Platform/Common/PlatformErrorCodes.cs`
- `src/Oksis.Application/Modules/Platform/Commands/PlatformLogin/{PlatformLoginCommand,PlatformLoginCommandValidator,PlatformLoginCommandHandler,PlatformAuthResult}.cs`
- `src/Oksis.Application/Modules/Platform/Queries/GetPlatformMe/{GetPlatformMeQuery,GetPlatformMeQueryHandler,PlatformMeDto}.cs`
- `src/Oksis.Application/Modules/Platform/Commands/CreateSchool/{CreateSchoolCommand,CreateSchoolCommandValidator,CreateSchoolCommandHandler,CreateSchoolResult}.cs`
- `src/Oksis.Application/Modules/Platform/Queries/ListSchools/{ListSchoolsQuery,ListSchoolsQueryHandler,PlatformSchoolListItemDto}.cs`
- `src/Oksis.Api/Contracts/Platform/PlatformLoginBody.cs`
- `src/Oksis.Api/Controllers/V1/{PlatformAuthController,PlatformSchoolsController}.cs`
- Göçler: `20260916_school_level_role_assignments`, `20260916_platform_accounts`

**oksis-api — değişen**
- `RoleAssignment.cs`, `Invitation.cs`, `Users/Events/{RoleAssignedEvent,RoleRevokedEvent,RoleAssignmentExpiredEvent,UserInvitedEvent}.cs` — `SeasonId` → `Guid?`
- `RoleAssignmentConfiguration.cs`, `InvitationConfiguration.cs` — `SeasonId` zorunlu değil
- `InvitationCreationHelper.cs`, `CreateInvitation*`, `BulkCreateInvitations*`, `CreateRoleAssignment*`, `GetPersonRoleAssignmentsQueryHandler.cs`, `ListInvitationsQueryHandler.cs`, `RoleAssignmentDto.cs`, `InvitationListItemDto.cs`, `UsersErrorCodes.cs`, `ListDevQuickLoginAccountsQueryHandler.cs`, `AccountPermissionResolver.cs`, `IdentityDevSeeder.cs`
- `TenancyAttribute.cs` (`SuperAdminOnly` → `PlatformOnly`), `TenantContextBehavior.cs`, `TenantContextMiddleware.cs`
- `IApplicationDbContext.cs`, `OksisDbContext.cs` (`PlatformAccounts`), `JwtOptions.cs`, `AccountTokenIssuer.cs`, `DependencyInjection.cs`, `Program.cs`, `appsettings.json`, `appsettings.Development.json`, `ErrorMessageCatalog.cs`

**oksis-ui — yeni**
- `packages/api/src/platform/{endpoints,queries}.ts`
- `apps/web/app/(platform)/layout.tsx`, `apps/web/app/(platform)/platform/login/page.tsx`, `apps/web/app/(platform)/platform/schools/page.tsx`
- `apps/web/features/platform/{index.ts,platform-login-screen.tsx,platform-schools-page.tsx,platform.css}`

**oksis-ui — değişen**
- `packages/api/src/index.ts`, `packages/api/src/client/query-keys.ts`, `packages/api/src/generated/schema.ts` (codegen), `packages/api/src/client/mutation-error.ts` (yorum), davet ve rol listelerinde sezon adı boşsa "Tüm sezonlar"

---

### Task 1: Okul-düzeyi rol ataması — sezon boş olabilir (0020)

**Files:**
- Create: `src/Oksis.Domain/Modules/Identity/SchoolLevelRoles.cs`
- Create: `src/Oksis.Application/Modules/Users/Common/SeasonScopeRule.cs`
- Modify: `src/Oksis.Domain/Modules/Users/Entities/RoleAssignment.cs:22,43-55`
- Modify: `src/Oksis.Domain/Modules/Users/Entities/Invitation.cs:27,57-73`
- Modify: `src/Oksis.Domain/Modules/Users/Events/RoleAssignedEvent.cs`, `RoleRevokedEvent.cs`, `RoleAssignmentExpiredEvent.cs`, `UserInvitedEvent.cs` (`Guid SeasonId` → `Guid? SeasonId`)
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Users/RoleAssignmentConfiguration.cs:27`, `InvitationConfiguration.cs:33`
- Modify: `src/Oksis.Application/Modules/Users/Common/InvitationCreationHelper.cs:36`
- Modify: `src/Oksis.Application/Modules/Users/Common/UsersErrorCodes.cs`
- Modify: `src/Oksis.Application/Modules/Users/Commands/CreateInvitation/{CreateInvitationCommand,CreateInvitationCommandValidator,CreateInvitationCommandHandler}.cs`
- Modify: `src/Oksis.Application/Modules/Users/Commands/BulkCreateInvitations/{BulkCreateInvitationsCommand,BulkCreateInvitationsCommandValidator,BulkCreateInvitationsCommandHandler}.cs`
- Modify: `src/Oksis.Application/Modules/Users/Commands/CreateRoleAssignment/{CreateRoleAssignmentCommand,CreateRoleAssignmentCommandValidator,CreateRoleAssignmentCommandHandler}.cs`
- Modify: `src/Oksis.Application/Modules/Users/DTOs/RoleAssignmentDto.cs:10`, `InvitationListItemDto.cs:10`
- Modify: `src/Oksis.Application/Modules/Users/Queries/GetPersonRoleAssignments/GetPersonRoleAssignmentsQueryHandler.cs:27-58`
- Modify: `src/Oksis.Application/Modules/Users/Queries/ListInvitations/ListInvitationsQueryHandler.cs:61-83`
- Modify: `src/Oksis.Application/Modules/Identity/Queries/ListDevQuickLoginAccounts/ListDevQuickLoginAccountsQueryHandler.cs:80-82`
- Modify: `src/Oksis.Infrastructure/Identity/AccountPermissionResolver.cs:38-41`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/IdentityDevSeeder.cs:404-408`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Users/SchoolLevelAssignmentTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/SchoolLevelRoleAssignmentTests.cs`

**Interfaces:**
- Produces: `SchoolLevelRoles.SchoolAdminCode == "SCHOOL_ADMIN"`, `SchoolLevelRoles.IsSchoolLevel(string roleCode)`.
- Produces: `RoleAssignment.Create(Guid schoolId, Guid personId, Guid systemRoleId, Guid? seasonId, Guid assignedBy, string? scopeAttributes = null, DateTimeOffset? validUntil = null)`.
- Produces: `Invitation.Create(Guid schoolId, Guid personId, Guid targetSystemRoleId, Guid? seasonId, InvitationChannel channel, string tokenHash, string plainTokenForEvent, int expiresInDays, string consentBundleVersion, DateTimeOffset now, Guid? batchId = null)`.
- Produces: `InvitationCreationHelper.CreateForPersonAsync(IApplicationDbContext db, Guid schoolId, Person person, Guid targetSystemRoleId, Guid? seasonId, InvitationChannel channel, int expiresInDays, string consentBundleVersion, IInvitationTokenFactory tokenFactory, DateTimeOffset now, Guid? batchId, CancellationToken ct)` → `Result<InvitationCreationResult>` (`.Invitation`, `.RawToken`).
- Produces: `SeasonScopeRule.ResolveAsync(IApplicationDbContext db, string roleCode, Guid? requestedSeasonId, string requiredErrorCode, string notFoundErrorCode, CancellationToken ct)` → `Result<Guid?>`.

- [ ] **Step 1: Domain birim testini yaz (kırmızı)**

`tests/Oksis.Domain.UnitTests/Modules/Users/SchoolLevelAssignmentTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Identity;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Domain.Modules.Users.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Users;

/// <summary>0020 — okul yöneticisi okul düzeyinde (sezonsuz) atanır; boş sezon = tüm sezonlar.</summary>
public sealed class SchoolLevelAssignmentTests
{
    [Fact(DisplayName = "0020: rol ataması sezonsuz kurulabilir")]
    public void RoleAssignment_Create_WithNullSeason_Succeeds()
    {
        var assignment = RoleAssignment.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), seasonId: null, assignedBy: Guid.NewGuid());

        assignment.SeasonId.Should().BeNull();
        assignment.IsActive.Should().BeTrue();
    }

    [Fact(DisplayName = "0020: boş GUID sezon hâlâ reddedilir — null ile karıştırılmaz")]
    public void RoleAssignment_Create_WithEmptySeason_Throws()
    {
        var act = () => RoleAssignment.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.Empty, Guid.NewGuid());

        act.Should().Throw<UsersDomainException>();
    }

    [Fact(DisplayName = "0020: davet sezonsuz kurulabilir")]
    public void Invitation_Create_WithNullSeason_Succeeds()
    {
        var invitation = Invitation.Create(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), seasonId: null,
            InvitationChannel.Email, "hash", "raw", 7, "v2026.05.01", DateTimeOffset.UtcNow);

        invitation.SeasonId.Should().BeNull();
    }

    [Fact(DisplayName = "0020: okul-düzeyi rol kümesi MVP'de yalnız SCHOOL_ADMIN")]
    public void SchoolLevelRoles_OnlySchoolAdmin()
    {
        SchoolLevelRoles.IsSchoolLevel("SCHOOL_ADMIN").Should().BeTrue();
        SchoolLevelRoles.IsSchoolLevel("TEACHER").Should().BeFalse();
        SchoolLevelRoles.IsSchoolLevel("SUPER_ADMIN").Should().BeFalse();
    }
}
```

- [ ] **Step 2: Testin derlenmediğini gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter SchoolLevelAssignmentTests`
Expected: derleme hatası (`SchoolLevelRoles` yok; `Create` `Guid?` almıyor).

- [ ] **Step 3: `SchoolLevelRoles` ve domain değişikliklerini yaz**

`src/Oksis.Domain/Modules/Identity/SchoolLevelRoles.cs`:

```csharp
namespace Oksis.Domain.Modules.Identity;

/// <summary>
/// Okul düzeyinde (sezonsuz) atanan sistem rolleri — karar 0020. Bu rollerde
/// <c>RoleAssignment.SeasonId</c> ve <c>Invitation.SeasonId</c> boş kalır; boş sezon
/// "tüm sezonlarda geçerli" demektir. Hangi sezonlarda görev yapıldığı atamanın
/// tarih aralığı ile sezon tarihlerinin kesişiminden türer. MVP'de yalnız okul yöneticisi.
/// </summary>
public static class SchoolLevelRoles
{
    public const string SchoolAdminCode = "SCHOOL_ADMIN";

    private static readonly HashSet<string> _codes = new(StringComparer.Ordinal) { SchoolAdminCode };

    public static bool IsSchoolLevel(string roleCode) =>
        !string.IsNullOrWhiteSpace(roleCode) && _codes.Contains(roleCode);
}
```

`RoleAssignment.cs` — alanı ve fabrikayı değiştir:

```csharp
    /// <summary>Boş = okul-düzeyi atama, tüm sezonlarda geçerli (0020).</summary>
    public Guid? SeasonId { get; private set; }
```

```csharp
    public static RoleAssignment Create(
        Guid schoolId,
        Guid personId,
        Guid systemRoleId,
        Guid? seasonId,
        Guid assignedBy,
        string? scopeAttributes = null,
        DateTimeOffset? validUntil = null)
    {
        if (personId == Guid.Empty || systemRoleId == Guid.Empty)
        {
            throw new UsersDomainException("Kişi ve rol kimlikleri zorunludur.");
        }

        if (seasonId == Guid.Empty)
        {
            throw new UsersDomainException(
                "Sezon kimliği boş GUID olamaz; okul-düzeyi atama için sezon verilmez.");
        }
```

`Invitation.cs` — aynı biçimde `public Guid? SeasonId { get; private set; }`, `Create(... Guid? seasonId ...)` ve guard:

```csharp
        if (personId == Guid.Empty || targetSystemRoleId == Guid.Empty)
        {
            throw new UsersDomainException("Kişi ve hedef rol kimlikleri zorunludur.");
        }

        if (seasonId == Guid.Empty)
        {
            throw new UsersDomainException(
                "Sezon kimliği boş GUID olamaz; okul-düzeyi rol daveti için sezon verilmez.");
        }
```

Dört olay kaydında `Guid SeasonId,` → `Guid? SeasonId,` (`RoleAssignedEvent`, `RoleRevokedEvent`, `RoleAssignmentExpiredEvent`, `UserInvitedEvent`). Olayları tüketen hiçbir handler `SeasonId` okumuyor (ölçüldü: `grep -rn "\.SeasonId" $(grep -rln "RoleAssignedEvent\|UserInvitedEvent" src/Oksis.Application src/Oksis.Infrastructure --include='*.cs')` boş).

- [ ] **Step 4: Domain testini yeşile çevir**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter SchoolLevelAssignmentTests`
Expected: 4 PASS.

- [ ] **Step 5: EF konfigürasyonları ve yardımcıyı güncelle**

`RoleAssignmentConfiguration.cs:27` ve `InvitationConfiguration.cs:33`: `builder.Property(x => x.SeasonId).IsRequired();` → `builder.Property(x => x.SeasonId);`. İndeksler olduğu gibi kalır (SQL Server tekil indekste boş değeri tek satır sayar → kişi-rol başına bir okul-düzeyi atama).

`InvitationCreationHelper.cs:36`: `Guid seasonId,` → `Guid? seasonId,`. Gövde değişmez (`i.SeasonId == seasonId` EF'te boş parametre için `IS NULL` üretir).

`UsersErrorCodes.cs`'e ekle:

```csharp
    public const string InvitationSeasonRequired = "USERS_INVITATION_SEASON_REQUIRED";
    public const string RoleAssignmentSeasonRequired = "USERS_ROLE_ASSIGNMENT_SEASON_REQUIRED";
```

`src/Oksis.Application/Modules/Users/Common/SeasonScopeRule.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.Identity;
using Oksis.Shared;

namespace Oksis.Application.Modules.Users.Common;

/// <summary>
/// Davet ve rol atamasının ortak sezon kuralı (0020): okul-düzeyi rolde sezon yok sayılır
/// ve boş döner; sezon-bağlı rolde sezon zorunludur ve çağıranın okulunda var olmalıdır
/// (küresel süzgeç başka okulun sezonunu göstermez → bulunamadı).
/// </summary>
public static class SeasonScopeRule
{
    public static async Task<Result<Guid?>> ResolveAsync(
        IApplicationDbContext db,
        string roleCode,
        Guid? requestedSeasonId,
        string requiredErrorCode,
        string notFoundErrorCode,
        CancellationToken ct)
    {
        if (SchoolLevelRoles.IsSchoolLevel(roleCode))
        {
            return Result<Guid?>.Success(null);
        }

        if (requestedSeasonId is not { } seasonId || seasonId == Guid.Empty)
        {
            return Result<Guid?>.Failure(new Error(
                requiredErrorCode, "Bu rol sezona bağlıdır; sezon seçilmelidir."));
        }

        var exists = await db.AcademicSessions.AsNoTracking()
            .AnyAsync(s => s.Id == seasonId, ct);
        if (!exists)
        {
            return Result<Guid?>.Failure(new Error(
                notFoundErrorCode, "Belirtilen sezon bu okulda bulunamadı."));
        }

        return Result<Guid?>.Success(seasonId);
    }
}
```

- [ ] **Step 6: Komutları, validator'ları ve işleyicileri güncelle**

`CreateInvitationCommand`: `Guid SeasonId,` → `Guid? SeasonId,`. `CreateInvitationCommandValidator.cs:15` satırını (`RuleFor(x => x.SeasonId).NotEmpty()...`) sil. `CreateInvitationCommandHandler.cs:36-49` (rol var mı + sezon var mı blokları) şununla değiştir:

```csharp
        var roleCode = await db.SystemRoles.AsNoTracking()
            .Where(r => r.Id == request.TargetSystemRoleId)
            .Select(r => r.Code)
            .FirstOrDefaultAsync(cancellationToken);
        if (roleCode is null)
        {
            return Result<CreateInvitationResult>.Failure(new Error(
                UsersErrorCodes.InvitationRoleNotFound, "Belirtilen sistem rolü bulunamadı."));
        }

        var seasonScope = await SeasonScopeRule.ResolveAsync(
            db, roleCode, request.SeasonId,
            UsersErrorCodes.InvitationSeasonRequired, UsersErrorCodes.InvitationSeasonNotFound,
            cancellationToken);
        if (seasonScope.IsFailure)
        {
            return Result<CreateInvitationResult>.Failure(seasonScope.Error);
        }
```

ve `CreateForPersonAsync(... request.TargetSystemRoleId, request.SeasonId, ...)` çağrısında `request.SeasonId` → `seasonScope.Value`.

`BulkCreateInvitationsCommand`: `Guid? SeasonId`; validator'daki `RuleFor(x => x.SeasonId).NotEmpty()` satırını sil; handler'da rol kontrolü + sezon kontrolü (satır 25-40) aynı kalıpla `roleCode` + `SeasonScopeRule` olur, `CreateForPersonAsync(... request.SeasonId ...)` → `seasonScope.Value`.

`CreateRoleAssignmentCommand`: `Guid? SeasonId`; validator'daki `RuleFor(x => x.SeasonId).NotEmpty()` satırını sil. Handler'da `targetRole` zaten yükleniyor (satır ~21); sezon var-mı bloğunu (satır ~29-36, `RoleAssignmentSeasonNotFound` dönen) şununla değiştir:

```csharp
        var seasonScope = await SeasonScopeRule.ResolveAsync(
            db, targetRole.Code, request.SeasonId,
            UsersErrorCodes.RoleAssignmentSeasonRequired, UsersErrorCodes.RoleAssignmentSeasonNotFound,
            cancellationToken);
        if (seasonScope.IsFailure)
        {
            return Result<Guid>.Failure(seasonScope.Error);
        }
        var seasonId = seasonScope.Value;
```

Mükerrer kontrolünde `a.SeasonId == request.SeasonId` → `a.SeasonId == seasonId`; `RoleAssignment.Create(... request.SeasonId ...)` → `seasonId`. Mükerrer mesajı "Bu kişi için aynı sezon ve rolde bir atama zaten var." olarak kalır.

`RoleAssignmentDto.cs:10` ve `InvitationListItemDto.cs:10`: `Guid SeasonId,` → `Guid? SeasonId,`.

`GetPersonRoleAssignmentsQueryHandler.cs`:

```csharp
        var seasonIds = assignments
            .Where(a => a.SeasonId.HasValue)
            .Select(a => a.SeasonId!.Value)
            .Distinct()
            .ToList();
```

ve projeksiyonda:

```csharp
                roles.TryGetValue(a.SystemRoleId, out var role);
                var season = a.SeasonId is { } seasonId && seasons.TryGetValue(seasonId, out var found)
                    ? found
                    : null;
```

(`season?.Name`, `season?.StartDate ?? DateOnly.MinValue` satırları aynen kalır; okul-düzeyi atama sezon adı boş döner.)

`ListInvitationsQueryHandler.cs`: `seasonIds` aynı `Where(HasValue).Select(Value)` kalıbı; `seasons.GetValueOrDefault(i.SeasonId)` → `i.SeasonId is { } seasonId ? seasons.GetValueOrDefault(seasonId) : null`.

`ListDevQuickLoginAccountsQueryHandler.cs:80-82`:

```csharp
            .Where(r => !currentSessionBySchool.TryGetValue(r.SchoolId, out var currentSeasonId)
                        || r.SeasonId == currentSeasonId
                        || r.SeasonId == null)
```

`AccountPermissionResolver.cs:38-41`:

```csharp
        if (activeSeasonId is { } seasonId)
        {
            // 0020: okul-düzeyi (sezonsuz) atama her sezonda geçerlidir.
            roleIdsQuery = roleIdsQuery.Where(ra => ra.SeasonId == seasonId || ra.SeasonId == null);
        }
```

`IdentityDevSeeder.cs:406-407` — okul yöneticisi dev seed'de de okul düzeyinde:

```csharp
            Guid? seasonId = roleId == MasterSeedIds.Roles.SchoolAdmin ? null : _currentSeasonId;
            db.RoleAssignments.Add(RoleAssignment.Create(
                schoolId, person.Id, roleId, seasonId, assignedBy: SystemUserId));
```

- [ ] **Step 7: Derle ve birim testleri koştur**

Run: `dotnet build && ./scripts/test-changed.sh`
Expected: derleme temiz; `ActivateSeasonRolloverCommandHandler` (`ra.SeasonId == sourceSessionId`, `Create(... targetSessionId ...)`) değişmeden derlenir. Birim testler yeşil.

- [ ] **Step 8: Göçü üret ve incele**

Run:
```bash
dotnet ef migrations add 20260916_school_level_role_assignments --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Üretilen dosyada yalnız iki `AlterColumn<Guid>(name: "season_id", schema: "identity", table: "role_assignments"/"invitations", nullable: true, oldNullable: false)` olmalı (indeks dokunuşu olabilir). Fazlası varsa model snapshot bayat demektir; durup nedenini bul. Ardından `dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`.

- [ ] **Step 9: Entegrasyon testini yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/SchoolLevelRoleAssignmentTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Users.Commands.CreateInvitation;
using Oksis.Application.Modules.Users.Common;
using Oksis.Domain.Modules.Identity;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.ValueObjects;
using Oksis.Infrastructure.Identity;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;
using InvitationChannel = Oksis.Domain.Modules.Users.Enums.InvitationChannel;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>0020 — okul yöneticisi okul düzeyinde atanır; boş sezon her sezonda geçerli.</summary>
[Collection(DatabaseCollection.Name)]
public sealed class SchoolLevelRoleAssignmentTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    public SchoolLevelRoleAssignmentTests(DatabaseFixture fixture) => _fixture = fixture;
    public async Task InitializeAsync() => await _fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private sealed class TestTenantContext(Guid schoolId) : ITenantContext
    {
        public Guid? CurrentSchoolId => schoolId;
        public bool IsSuperAdmin => false;
        public bool HasTenant => true;
        public void OverrideForSuperAdmin(Guid id) { }
        public void SetForLoginFlow(Guid id) { }
    }

    [Fact(DisplayName = "Sezonsuz SCHOOL_ADMIN ataması, aktif sezon ne olursa olsun izin verir")]
    public async Task Resolver_IncludesSchoolLevelAssignment_ForAnySeasonAsync()
    {
        var schoolId = Guid.NewGuid();
        await using var db = _fixture.CreateDbContext(schoolId);
        var roleId = await db.SystemRoles.AsNoTracking()
            .Where(r => r.Code == SchoolLevelRoles.SchoolAdminCode).Select(r => r.Id).SingleAsync();
        var person = Person.Create(schoolId, PersonName.Create("Ayşe", "Müdür"));
        person.AttachProfile(StaffProfile.Create(department: "Okul Yönetimi", position: "Müdür"));
        db.Persons.Add(person);
        db.RoleAssignments.Add(RoleAssignment.Create(schoolId, person.Id, roleId, seasonId: null, assignedBy: Guid.NewGuid()));
        await db.SaveChangesAsync();

        var resolver = new AccountPermissionResolver(db);
        var withoutSeason = await resolver.ResolveAsync(Guid.NewGuid(), person.Id, "Staff", null, CancellationToken.None);
        var withRandomSeason = await resolver.ResolveAsync(Guid.NewGuid(), person.Id, "Staff", Guid.NewGuid(), CancellationToken.None);

        withoutSeason.Should().Contain("academic-sessions.create");
        withRandomSeason.Should().Contain("academic-sessions.create");
    }

    [Fact(DisplayName = "Kişi-rol başına tek okul-düzeyi atama: ikinci boş sezon tekil indekse takılır")]
    public async Task UniqueIndex_AllowsSingleNullSeasonPerPersonRoleAsync()
    {
        var schoolId = Guid.NewGuid();
        await using var db = _fixture.CreateDbContext(schoolId);
        var roleId = await db.SystemRoles.AsNoTracking()
            .Where(r => r.Code == SchoolLevelRoles.SchoolAdminCode).Select(r => r.Id).SingleAsync();
        var person = Person.Create(schoolId, PersonName.Create("Ali", "Vekil"));
        db.Persons.Add(person);
        db.RoleAssignments.Add(RoleAssignment.Create(schoolId, person.Id, roleId, null, Guid.NewGuid()));
        await db.SaveChangesAsync();

        db.RoleAssignments.Add(RoleAssignment.Create(schoolId, person.Id, roleId, null, Guid.NewGuid()));
        var act = () => db.SaveChangesAsync();

        await act.Should().ThrowAsync<DbUpdateException>();
    }

    [Fact(DisplayName = "SCHOOL_ADMIN daveti sezonu yok sayar; TEACHER daveti sezonsuz reddedilir")]
    public async Task CreateInvitation_SeasonRuleFollowsRoleAsync()
    {
        var schoolId = Guid.NewGuid();
        await using var db = _fixture.CreateDbContext(schoolId);
        var adminRoleId = await db.SystemRoles.AsNoTracking()
            .Where(r => r.Code == SchoolLevelRoles.SchoolAdminCode).Select(r => r.Id).SingleAsync();
        var teacherRoleId = await db.SystemRoles.AsNoTracking()
            .Where(r => r.Code == "TEACHER").Select(r => r.Id).SingleAsync();
        var admin = Person.Create(schoolId, PersonName.Create("Ayşe", "Müdür"));
        var teacher = Person.Create(schoolId, PersonName.Create("Can", "Hoca"));
        db.Persons.AddRange(admin, teacher);
        await db.SaveChangesAsync();
        var handler = new CreateInvitationCommandHandler(db, new TestTenantContext(schoolId), new InvitationTokenFactory());

        var adminResult = await handler.Handle(
            new CreateInvitationCommand(admin.Id, adminRoleId, Guid.NewGuid(), InvitationChannel.Email, 7, "v2026.05.01"),
            CancellationToken.None);
        var teacherResult = await handler.Handle(
            new CreateInvitationCommand(teacher.Id, teacherRoleId, null, InvitationChannel.Email, 7, "v2026.05.01"),
            CancellationToken.None);

        adminResult.IsSuccess.Should().BeTrue();
        (await db.Invitations.AsNoTracking().SingleAsync(i => i.PersonId == admin.Id)).SeasonId.Should().BeNull();
        teacherResult.IsFailure.Should().BeTrue();
        teacherResult.Error.Code.Should().Be(UsersErrorCodes.InvitationSeasonRequired);
    }
}
```

`CreateInvitationCommandHandler` yapıcı imzası mevcut `InvitationHandlerIntegrationTests` ile aynıdır (`db, tenant, tokenFactory`); `SaveChangesAsync` handler'ın kendi içindedir.

- [ ] **Step 10: Entegrasyonu koştur**

Run: `./scripts/test-changed.sh --integration --filter SchoolLevelRoleAssignmentTests`
Expected: 3 PASS. Ayrıca `--filter "InvitationHandlerIntegrationTests|RoleAssignmentHandlerIntegrationTests|RoleAuthorizationEngineTests|AcceptInvitationIntegrationTests"` yeşil (imza değişimi davranışı bozmadı).

- [ ] **Step 11: Commit**

```bash
dotnet format
git add -A
git commit -m "feat(users): okul yöneticisi rolü okul düzeyinde sezonsuz atanır (0020)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01W8ksrYqz3prgzeNCARapcp"
```

---

### Task 2: Platform hesabı — varlık, tablo, tek seferlik kurulum

**Files:**
- Create: `src/Oksis.Domain/Modules/Platform/Exceptions/PlatformDomainException.cs`
- Create: `src/Oksis.Domain/Modules/Platform/Entities/PlatformAccount.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Platform/PlatformAccountConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Platform/PlatformBootstrapOptions.cs`, `PlatformAccountBootstrapper.cs`
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` (DbSet), `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (DbSet)
- Modify: `src/Oksis.Infrastructure/DependencyInjection.cs:116-119` (options), `:462` yakını (bootstrapper kaydı)
- Modify: `src/Oksis.Api/Program.cs:297-303` (LocationSeeder bloğundan sonra)
- Modify: `src/Oksis.Api/appsettings.json`, `appsettings.Development.json`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Platform/PlatformAccountTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Platform/PlatformAccountBootstrapperTests.cs`

**Interfaces:**
- Produces: `PlatformAccount.Create(string email, PasswordHash passwordHash, string displayName)`, `NormalizeEmail(string)`, `IsCurrentlyLocked(DateTimeOffset now)`, `RegisterSuccessfulLogin(DateTimeOffset now)`, `RegisterFailedLogin(DateTimeOffset now)`; alanlar `Email`, `PasswordHash`, `DisplayName`, `IsActive`, `FailedLoginCount`, `LockedUntil`, `LastLoginAt`.
- Produces: `IApplicationDbContext.PlatformAccounts : DbSet<PlatformAccount>`.
- Produces: `PlatformAccountBootstrapper.EnsureAsync(CancellationToken)` → `bool` (üretildi mi).
- Consumes: `Oksis.Domain.Modules.Identity.ValueObjects.PasswordHash.FromEncoded(string)`, `IPasswordHasher.Hash(string)`.

- [ ] **Step 1: Domain testini yaz (kırmızı)**

`tests/Oksis.Domain.UnitTests/Modules/Platform/PlatformAccountTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Identity.ValueObjects;
using Oksis.Domain.Modules.Platform.Entities;
using Oksis.Domain.Modules.Platform.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Platform;

public sealed class PlatformAccountTests
{
    private static readonly PasswordHash Hash = PasswordHash.FromEncoded("$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA");

    [Fact(DisplayName = "E-posta küçük harfe ve boşluksuz normalize edilir")]
    public void Create_NormalizesEmail()
    {
        var account = PlatformAccount.Create("  Platform@Oksis.Net ", Hash, "OKSİS Platform");

        account.Email.Should().Be("platform@oksis.net");
        account.IsActive.Should().BeTrue();
        account.FailedLoginCount.Should().Be(0);
    }

    [Fact(DisplayName = "Geçersiz e-posta reddedilir")]
    public void Create_InvalidEmail_Throws()
    {
        var act = () => PlatformAccount.Create("not-an-email", Hash, "X");
        act.Should().Throw<PlatformDomainException>().Which.Code.Should().Be("PLATFORM.ACCOUNT_EMAIL_INVALID");
    }

    [Fact(DisplayName = "Beş hatalı giriş 15 dakika kilitler; başarılı giriş sayacı sıfırlar")]
    public void FailedLogins_LockAfterFive_SuccessResets()
    {
        var now = new DateTimeOffset(2026, 9, 16, 9, 0, 0, TimeSpan.Zero);
        var account = PlatformAccount.Create("p@oksis.net", Hash, "P");

        for (var i = 0; i < PlatformAccount.MaxFailedAttempts; i++)
        {
            account.RegisterFailedLogin(now);
        }

        account.IsCurrentlyLocked(now).Should().BeTrue();
        account.IsCurrentlyLocked(now.Add(PlatformAccount.LockoutDuration)).Should().BeFalse();

        account.RegisterSuccessfulLogin(now.AddHours(1));
        account.FailedLoginCount.Should().Be(0);
        account.LockedUntil.Should().BeNull();
        account.LastLoginAt.Should().Be(now.AddHours(1));
    }
}
```

- [ ] **Step 2: Kırmızıyı gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter PlatformAccountTests`
Expected: derleme hatası (tipler yok).

- [ ] **Step 3: Domain'i yaz**

`src/Oksis.Domain/Modules/Platform/Exceptions/PlatformDomainException.cs`:

```csharp
namespace Oksis.Domain.Modules.Platform.Exceptions;

public sealed class PlatformDomainException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
```

`src/Oksis.Domain/Modules/Platform/Entities/PlatformAccount.cs`:

```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Identity.ValueObjects;
using Oksis.Domain.Modules.Platform.Exceptions;

namespace Oksis.Domain.Modules.Platform.Entities;

/// <summary>
/// OKSİS personelinin okula bağlı olmayan platform hesabı (K-27 (a), 0019). Tenant varlığı
/// DEĞİLDİR: <see cref="IHasTenant"/> uygulamaz, küresel süzgece girmez, <c>school_id</c>
/// taşımaz. Bu dilimde tek rol vardır (platform yöneticisi); rol tablosu 0019 uygulanınca gelir.
/// </summary>
public sealed class PlatformAccount : AggregateRoot, IAuditableEntity
{
    public const int MaxFailedAttempts = 5;
    public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public string Email { get; private set; } = default!;
    public PasswordHash PasswordHash { get; private set; } = default!;
    public string DisplayName { get; private set; } = default!;
    public bool IsActive { get; private set; }
    public int FailedLoginCount { get; private set; }
    public DateTimeOffset? LockedUntil { get; private set; }
    public DateTimeOffset? LastLoginAt { get; private set; }

    public DateTimeOffset CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }

    private PlatformAccount() { }

    public static PlatformAccount Create(string email, PasswordHash passwordHash, string displayName)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@') || email.Trim().Length > 256)
        {
            throw new PlatformDomainException(
                "PLATFORM.ACCOUNT_EMAIL_INVALID", "Platform hesabı için geçerli bir e-posta zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(displayName))
        {
            throw new PlatformDomainException(
                "PLATFORM.ACCOUNT_DISPLAY_NAME_REQUIRED", "Görünen ad zorunludur.");
        }

        return new PlatformAccount
        {
            Email = NormalizeEmail(email),
            PasswordHash = passwordHash ?? throw new PlatformDomainException(
                "PLATFORM.PASSWORD_HASH_REQUIRED", "Parola hash'i zorunludur."),
            DisplayName = displayName.Trim(),
            IsActive = true,
            FailedLoginCount = 0
        };
    }

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public bool IsCurrentlyLocked(DateTimeOffset now) =>
        LockedUntil is not null && LockedUntil.Value > now;

    public void RegisterSuccessfulLogin(DateTimeOffset now)
    {
        if (!IsActive)
        {
            throw new PlatformDomainException("PLATFORM.ACCOUNT_INACTIVE", "Hesap pasif.");
        }

        FailedLoginCount = 0;
        LockedUntil = null;
        LastLoginAt = now;
    }

    public void RegisterFailedLogin(DateTimeOffset now)
    {
        FailedLoginCount++;
        if (FailedLoginCount >= MaxFailedAttempts)
        {
            LockedUntil = now.Add(LockoutDuration);
        }
    }
}
```

- [ ] **Step 4: Domain testini yeşile çevir**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter PlatformAccountTests`
Expected: 3 PASS.

- [ ] **Step 5: EF konfigürasyonu, DbSet'ler, göç**

`src/Oksis.Infrastructure/Persistence/Configurations/Platform/PlatformAccountConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Identity.ValueObjects;
using Oksis.Domain.Modules.Platform.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Platform;

public sealed class PlatformAccountConfiguration : IEntityTypeConfiguration<PlatformAccount>
{
    public void Configure(EntityTypeBuilder<PlatformAccount> builder)
    {
        builder.ToTable("accounts", OksisSchemas.Platform);

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.HasIndex(x => x.Email).IsUnique().HasDatabaseName("ux_platform_account_email");

        builder.Property(x => x.PasswordHash)
            .HasConversion(v => v.Encoded, v => PasswordHash.FromEncoded(v))
            .HasColumnName("password_hash")
            .HasMaxLength(512)
            .IsRequired();

        builder.Property(x => x.DisplayName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.IsActive).IsRequired().HasDefaultValue(true);
        builder.Property(x => x.FailedLoginCount).IsRequired().HasDefaultValue(0);
        builder.Property(x => x.LockedUntil);
        builder.Property(x => x.LastLoginAt);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.UpdatedAt);
        builder.Property(x => x.UpdatedBy);

        builder.Ignore(x => x.DomainEvents);
    }
}
```

`IApplicationDbContext.cs`'e (Accounts DbSet'inin yanına) `DbSet<PlatformAccount> PlatformAccounts { get; }`; `OksisDbContext.cs`'e `public DbSet<PlatformAccount> PlatformAccounts => Set<PlatformAccount>();`. Konfigürasyon `ApplyConfigurationsFromAssembly` ile otomatik alınır (`OksisDbContext.cs:233`).

Run:
```bash
dotnet build
dotnet ef migrations add 20260916_platform_accounts --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```
Expected: göç `EnsureSchema("platform")` + `CreateTable platform.accounts` + tekil e-posta indeksi içerir; başka tablo dokunuşu yok.

- [ ] **Step 6: Bootstrapper testini yaz (kırmızı)**

`tests/Oksis.Infrastructure.IntegrationTests/Platform/PlatformAccountBootstrapperTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Oksis.Infrastructure.Identity;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Oksis.Infrastructure.Platform;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Platform;

[Collection(DatabaseCollection.Name)]
public sealed class PlatformAccountBootstrapperTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    public PlatformAccountBootstrapperTests(DatabaseFixture fixture) => _fixture = fixture;
    public async Task InitializeAsync() => await _fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private static PlatformAccountBootstrapper Build(
        Oksis.Infrastructure.Persistence.OksisDbContext db, string? email, string? password) =>
        new(db, new PasswordHasher(),
            Options.Create(new PlatformBootstrapOptions { Email = email, Password = password, DisplayName = "Test" }),
            NullLogger<PlatformAccountBootstrapper>.Instance);

    [Fact(DisplayName = "Tek seferlik: ilk çağrı hesabı üretir, ikinci çağrı dokunmaz")]
    public async Task EnsureAsync_CreatesOnce_ThenNoopsAsync()
    {
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        await db.PlatformAccounts.ExecuteDeleteAsync();

        var first = await Build(db, "Platform@Oksis.Local", "Oksis1234!").EnsureAsync();
        var second = await Build(db, "baska@oksis.local", "Farkli1234!").EnsureAsync();

        first.Should().BeTrue();
        second.Should().BeFalse();
        var accounts = await db.PlatformAccounts.AsNoTracking().ToListAsync();
        accounts.Should().ContainSingle().Which.Email.Should().Be("platform@oksis.local");
        new PasswordHasher().Verify("Oksis1234!", accounts[0].PasswordHash.Encoded).Should().BeTrue();
    }

    [Fact(DisplayName = "Ayar boşsa hesap üretmez, hata da atmaz")]
    public async Task EnsureAsync_EmptyOptions_NoopAsync()
    {
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        await db.PlatformAccounts.ExecuteDeleteAsync();

        var created = await Build(db, null, null).EnsureAsync();

        created.Should().BeFalse();
        (await db.PlatformAccounts.AnyAsync()).Should().BeFalse();
    }
}
```

(`DatabaseFixture` tek veritabanını paylaşır; bu yüzden testler başta tabloyu boşaltır.)

- [ ] **Step 7: Kırmızıyı gör**

Run: `dotnet build tests/Oksis.Infrastructure.IntegrationTests`
Expected: derleme hatası (`PlatformBootstrapOptions`, `PlatformAccountBootstrapper` yok).

- [ ] **Step 8: Options + bootstrapper + kayıt + ayar dosyaları**

`src/Oksis.Infrastructure/Platform/PlatformBootstrapOptions.cs`:

```csharp
namespace Oksis.Infrastructure.Platform;

/// <summary>
/// İlk platform hesabının tek seferlik kaynağı (K-27 kararı: yapılandırmadan). Veritabanında
/// en az bir platform hesabı varsa bu ayar bir daha OKUNMAZ; parola değişimi buradan yapılmaz.
/// Production'da <c>PlatformBootstrap__Email</c> / <c>PlatformBootstrap__Password</c> ortam
/// değişkenleriyle verilir, dosyaya yazılmaz.
/// </summary>
public sealed class PlatformBootstrapOptions
{
    public const string SectionName = "PlatformBootstrap";

    public string? Email { get; set; }
    public string? Password { get; set; }
    public string DisplayName { get; set; } = "OKSİS Platform";
}
```

`src/Oksis.Infrastructure/Platform/PlatformAccountBootstrapper.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.Identity.ValueObjects;
using Oksis.Domain.Modules.Platform.Entities;

namespace Oksis.Infrastructure.Platform;

/// <summary>Uygulama açılışında bir kez koşar; platform hesabı yoksa ayardan üretir.</summary>
public sealed class PlatformAccountBootstrapper(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IOptions<PlatformBootstrapOptions> options,
    ILogger<PlatformAccountBootstrapper> logger)
{
    public async Task<bool> EnsureAsync(CancellationToken ct = default)
    {
        if (await db.PlatformAccounts.AnyAsync(ct))
        {
            return false;
        }

        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.Email) || string.IsNullOrWhiteSpace(settings.Password))
        {
            logger.LogWarning(
                "PlatformBootstrap ayarı boş; ilk platform hesabı üretilmedi. Platform girişi bu hâlde çalışmaz.");
            return false;
        }

        var account = PlatformAccount.Create(
            settings.Email,
            PasswordHash.FromEncoded(passwordHasher.Hash(settings.Password)),
            settings.DisplayName);

        db.PlatformAccounts.Add(account);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("İlk platform hesabı üretildi email={Email}", account.Email);
        return true;
    }
}
```

`DependencyInjection.cs`: options bloğuna (satır 116-119 civarı) `services.Configure<Platform.PlatformBootstrapOptions>(configuration.GetSection(Platform.PlatformBootstrapOptions.SectionName));`; seeder kayıtlarının yanına (satır 462 civarı) `services.AddScoped<Platform.PlatformAccountBootstrapper>();`.

`Program.cs` — LocationSeeder bloğundan hemen sonra:

```csharp
    // İlk platform hesabı — production dâhil her açılışta tek seferlik (K-27): hesap varsa dokunmaz.
    {
        await using var scope = app.Services.CreateAsyncScope();
        var bootstrapper = scope.ServiceProvider.GetRequiredService<Oksis.Infrastructure.Platform.PlatformAccountBootstrapper>();
        await bootstrapper.EnsureAsync();
    }
```

`appsettings.Development.json` — `"App"` bölümünden sonra:

```json
  "PlatformBootstrap": {
    "Email": "platform@oksis.local",
    "Password": "Oksis1234!",
    "DisplayName": "OKSİS Platform"
  },
```

`appsettings.json` — aynı anahtarlar boş: `"PlatformBootstrap": { "Email": "", "Password": "", "DisplayName": "OKSİS Platform" }`.

- [ ] **Step 9: Testleri koştur**

Run: `./scripts/test-changed.sh --integration --filter PlatformAccountBootstrapperTests`
Expected: 2 PASS. Sonra `dotnet run --project src/Oksis.Api` ile açılışta log'da "İlk platform hesabı üretildi email=platform@oksis.local" görülür; ikinci açılışta görülmez.

- [ ] **Step 10: Commit**

```bash
dotnet format
git add -A
git commit -m "feat(platform): okulsuz platform hesabı ve appsettings'ten tek seferlik ilk hesap

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01W8ksrYqz3prgzeNCARapcp"
```

---

### Task 3: Platform kimliği — token, tenant kapısı, giriş ucu

**Files:**
- Create: `src/Oksis.Application/Modules/Platform/Abstractions/PlatformClaims.cs`, `IPlatformContext.cs`, `IPlatformTokenIssuer.cs`
- Create: `src/Oksis.Application/Modules/Platform/Commands/PlatformLogin/{PlatformLoginCommand,PlatformAuthResult,PlatformLoginCommandValidator,PlatformLoginCommandHandler}.cs`
- Create: `src/Oksis.Application/Modules/Platform/Queries/GetPlatformMe/{GetPlatformMeQuery,PlatformMeDto,GetPlatformMeQueryHandler}.cs`
- Create: `src/Oksis.Infrastructure/Identity/JwtSigningCredentials.cs`, `src/Oksis.Infrastructure/Platform/{PlatformContext,PlatformTokenIssuer}.cs`
- Create: `src/Oksis.Api/Contracts/Platform/PlatformLoginBody.cs`, `src/Oksis.Api/Controllers/V1/PlatformAuthController.cs`
- Modify: `src/Oksis.Application/Common/Attributes/TenancyAttribute.cs:13`, `src/Oksis.Application/Common/Behaviors/TenantContextBehavior.cs`
- Modify: `src/Oksis.Api/Middleware/TenantContextMiddleware.cs:22-25`
- Modify: `src/Oksis.Infrastructure/Identity/JwtOptions.cs`, `AccountTokenIssuer.cs:112-131`, `DependencyInjection.cs:152`
- Test: `tests/Oksis.Application.UnitTests/Common/Behaviors/TenantContextBehaviorTests.cs`
- Test: `tests/Oksis.Api.UnitTests/Middleware/TenantContextMiddlewareTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Platform/PlatformLoginCommandHandlerTests.cs`

**Interfaces:**
- Produces: `PlatformClaims.TokenKind = "token_kind"`, `PlatformClaims.PlatformKind = "platform"`.
- Produces: `IPlatformContext { bool IsPlatformRequest; Guid? PlatformAccountId; }`.
- Produces: `IPlatformTokenIssuer.Issue(PlatformAccount account)` → `PlatformIssuedToken(string AccessToken, DateTimeOffset ExpiresAt, string Jti)`.
- Produces: `TenancyMode.PlatformOnly` (eski `SuperAdminOnly` yerine; hiçbir istek kullanmıyordu).
- Produces: `POST api/v1/platform/auth/login` → `PlatformAuthResult(AccessToken, ExpiresAt, ExpiresInSeconds, DisplayName, Email)`; `GET api/v1/platform/auth/me` → `PlatformMeDto(Id, Email, DisplayName)`.
- Consumes: Task 2'nin `PlatformAccount`, `IApplicationDbContext.PlatformAccounts`.

- [ ] **Step 1: Behavior testini yaz (kırmızı)**

`tests/Oksis.Application.UnitTests/Common/Behaviors/TenantContextBehaviorTests.cs`:

```csharp
using FluentAssertions;
using MediatR;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Behaviors;
using Oksis.Application.Common.Exceptions;
using Oksis.Application.Modules.Platform.Abstractions;
using Xunit;

namespace Oksis.Application.UnitTests.Common.Behaviors;

/// <summary>
/// K-27 (a): platform token'ı tenant komutuna giremez; tenant token'ı platform komutuna giremez.
/// Süper yönetici muafiyeti (`IsSuperAdmin`) bu kapıdan kaldırıldı — üründe zaten hiç true olmuyordu.
/// </summary>
public sealed class TenantContextBehaviorTests
{
    [Tenancy(TenancyMode.Required)]
    private sealed record TenantRequest : IRequest<int>;

    [Tenancy(TenancyMode.PlatformOnly)]
    private sealed record PlatformRequest : IRequest<int>;

    [Tenancy(TenancyMode.Optional)]
    private sealed record OptionalRequest : IRequest<int>;

    private readonly ITenantContext _tenant = Substitute.For<ITenantContext>();
    private readonly IPlatformContext _platform = Substitute.For<IPlatformContext>();

    private TenantContextBehavior<TRequest, int> Sut<TRequest>() where TRequest : notnull =>
        new(_tenant, _platform);

    [Fact(DisplayName = "Required: okul bağlamı varsa geçer")]
    public async Task Required_WithSchool_PassesAsync()
    {
        _tenant.CurrentSchoolId.Returns(Guid.NewGuid());
        _platform.IsPlatformRequest.Returns(false);

        var result = await Sut<TenantRequest>().Handle(new TenantRequest(), _ => Task.FromResult(42), CancellationToken.None);

        result.Should().Be(42);
    }

    [Fact(DisplayName = "Required: okul bağlamı yoksa TenantRequiredException")]
    public async Task Required_WithoutSchool_ThrowsAsync()
    {
        _tenant.CurrentSchoolId.Returns((Guid?)null);
        _platform.IsPlatformRequest.Returns(false);

        var act = () => Sut<TenantRequest>().Handle(new TenantRequest(), _ => Task.FromResult(1), CancellationToken.None);

        await act.Should().ThrowAsync<TenantRequiredException>();
    }

    [Fact(DisplayName = "Required: platform token'ı okul komutu çalıştıramaz")]
    public async Task Required_PlatformToken_ThrowsAsync()
    {
        _tenant.CurrentSchoolId.Returns(Guid.NewGuid());
        _platform.IsPlatformRequest.Returns(true);

        var act = () => Sut<TenantRequest>().Handle(new TenantRequest(), _ => Task.FromResult(1), CancellationToken.None);

        await act.Should().ThrowAsync<TenantRequiredException>();
    }

    [Fact(DisplayName = "PlatformOnly: platform token'ı geçer, okul token'ı Forbidden")]
    public async Task PlatformOnly_GateAsync()
    {
        _platform.IsPlatformRequest.Returns(true);
        (await Sut<PlatformRequest>().Handle(new PlatformRequest(), _ => Task.FromResult(7), CancellationToken.None)).Should().Be(7);

        _platform.IsPlatformRequest.Returns(false);
        var act = () => Sut<PlatformRequest>().Handle(new PlatformRequest(), _ => Task.FromResult(7), CancellationToken.None);
        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact(DisplayName = "Optional: her iki token da geçer")]
    public async Task Optional_PassesForBothAsync()
    {
        _platform.IsPlatformRequest.Returns(true);
        _tenant.CurrentSchoolId.Returns((Guid?)null);

        (await Sut<OptionalRequest>().Handle(new OptionalRequest(), _ => Task.FromResult(3), CancellationToken.None)).Should().Be(3);
    }
}
```

- [ ] **Step 2: Kırmızıyı gör**

Run: `dotnet build tests/Oksis.Application.UnitTests`
Expected: derleme hatası (`IPlatformContext`, `PlatformOnly`, yeni yapıcı yok).

- [ ] **Step 3: Application soyutlamaları ve tenant kapısı**

`src/Oksis.Application/Modules/Platform/Abstractions/PlatformClaims.cs`:

```csharp
namespace Oksis.Application.Modules.Platform.Abstractions;

/// <summary>Platform token'ının ayırt edici talebi. Okul token'ında bu talep YOKTUR.</summary>
public static class PlatformClaims
{
    public const string TokenKind = "token_kind";
    public const string PlatformKind = "platform";
}
```

`IPlatformContext.cs`:

```csharp
namespace Oksis.Application.Modules.Platform.Abstractions;

/// <summary>
/// İsteğin bir platform hesabından gelip gelmediği (K-27 (a)). Süper yöneticilik artık bir
/// rol talebi değil, token'ın türüdür; okul bağlamıyla (<c>ITenantContext</c>) karışmaz.
/// </summary>
public interface IPlatformContext
{
    bool IsPlatformRequest { get; }
    Guid? PlatformAccountId { get; }
}
```

`IPlatformTokenIssuer.cs`:

```csharp
using Oksis.Domain.Modules.Platform.Entities;

namespace Oksis.Application.Modules.Platform.Abstractions;

public sealed record PlatformIssuedToken(string AccessToken, DateTimeOffset ExpiresAt, string Jti);

public interface IPlatformTokenIssuer
{
    PlatformIssuedToken Issue(PlatformAccount account);
}
```

`TenancyAttribute.cs`: enum `{ Required, Optional, PlatformOnly }` (`SuperAdminOnly` silinir).

`TenantContextBehavior.cs` tamamı:

```csharp
using System.Reflection;
using MediatR;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Exceptions;
using Oksis.Application.Modules.Platform.Abstractions;

namespace Oksis.Application.Common.Behaviors;

/// <summary>
/// Tenant kapısı. <c>Required</c>: okul bağlamı şart ve platform token'ı geçemez (K-27 (a) —
/// platform okulun içine komutla girmez). <c>PlatformOnly</c>: yalnız platform token'ı.
/// <c>Optional</c>: ikisi de geçer. Süper yönetici muafiyeti burada yoktur.
/// </summary>
public sealed class TenantContextBehavior<TRequest, TResponse>(
    ITenantContext tenantContext,
    IPlatformContext platformContext)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var tenancyAttr = typeof(TRequest).GetCustomAttribute<TenancyAttribute>();
        var mode = tenancyAttr?.Mode ?? TenancyMode.Required;

        switch (mode)
        {
            case TenancyMode.Required when platformContext.IsPlatformRequest:
                throw new TenantRequiredException();
            case TenancyMode.Required when tenantContext.CurrentSchoolId is null:
                throw new TenantRequiredException();
            case TenancyMode.PlatformOnly when !platformContext.IsPlatformRequest:
                throw new ForbiddenException("This operation requires a platform account.");
        }

        return await next();
    }
}
```

`TenantContextMiddleware.cs:22-25`:

```csharp
        var isPlatform = context.User.HasClaim(PlatformClaims.TokenKind, PlatformClaims.PlatformKind);
        var schoolIdClaim = context.User.FindFirst("school_id")?.Value;

        if (!isPlatform && string.IsNullOrEmpty(schoolIdClaim))
```

(`using Oksis.Application.Modules.Platform.Abstractions;` eklenir; `IsInRole("SuperAdmin")` satırı silinir — üründe hiç true olmuyordu, envanter V3.)

- [ ] **Step 4: Behavior testini yeşile çevir**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter TenantContextBehaviorTests`
Expected: 5 PASS.

- [ ] **Step 5: Middleware testini yaz ve koştur**

`tests/Oksis.Api.UnitTests/Middleware/TenantContextMiddlewareTests.cs`:

```csharp
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Oksis.Api.Middleware;
using Oksis.Application.Modules.Platform.Abstractions;
using Xunit;

namespace Oksis.Api.UnitTests.Middleware;

public sealed class TenantContextMiddlewareTests
{
    private static DefaultHttpContext Context(params Claim[] claims)
    {
        var ctx = new DefaultHttpContext();
        ctx.Request.Path = "/api/v1/platform/schools";
        ctx.User = new ClaimsPrincipal(new ClaimsIdentity(claims, authenticationType: "Test"));
        return ctx;
    }

    [Fact(DisplayName = "Platform token'ı school_id olmadan geçer")]
    public async Task PlatformToken_WithoutSchool_PassesAsync()
    {
        var called = false;
        var middleware = new TenantContextMiddleware(_ => { called = true; return Task.CompletedTask; });
        var ctx = Context(new Claim(PlatformClaims.TokenKind, PlatformClaims.PlatformKind));

        await middleware.InvokeAsync(ctx);

        called.Should().BeTrue();
        ctx.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact(DisplayName = "Okul token'ı school_id olmadan 403")]
    public async Task SchoolToken_WithoutSchool_ForbiddenAsync()
    {
        var called = false;
        var middleware = new TenantContextMiddleware(_ => { called = true; return Task.CompletedTask; });
        var ctx = Context(new Claim("sub", Guid.NewGuid().ToString()));

        await middleware.InvokeAsync(ctx);

        called.Should().BeFalse();
        ctx.Response.StatusCode.Should().Be(StatusCodes.Status403Forbidden);
    }
}
```

Run: `dotnet test tests/Oksis.Api.UnitTests --filter TenantContextMiddlewareTests` → 2 PASS.

- [ ] **Step 6: Infrastructure — bağlam, imza, token üretici**

`src/Oksis.Infrastructure/Identity/JwtSigningCredentials.cs` (AccountTokenIssuer'daki `BuildSigningCredentials` gövdesi buraya taşınır; issuer artık `JwtSigningCredentials.Build(_options)` çağırır):

```csharp
using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;

namespace Oksis.Infrastructure.Identity;

/// <summary>Okul ve platform token üreticilerinin ortak imza kaynağı (RS256 PEM ya da dev HS256).</summary>
internal static class JwtSigningCredentials
{
    public static SigningCredentials Build(JwtOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.PrivateKeyPem))
        {
            var rsa = RSA.Create();
            rsa.ImportFromPem(options.PrivateKeyPem);
            return new SigningCredentials(new RsaSecurityKey(rsa), SecurityAlgorithms.RsaSha256);
        }

        if (!string.IsNullOrWhiteSpace(options.SecretKey))
        {
            var keyBytes = System.Text.Encoding.UTF8.GetBytes(options.SecretKey);
            return new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);
        }

        throw new InvalidOperationException(
            "Jwt:PrivateKeyPem veya Jwt:SecretKey appsettings'te ayarlanmalı; ikisi de boş.");
    }
}
```

`JwtOptions.cs`'e: `public int PlatformAccessTokenMinutes { get; set; } = 480;` (platform token'ının refresh'i yoktur; süre dolunca yeniden giriş — bilinçli sadeleştirme, `K-27` ilk dilim).

`src/Oksis.Infrastructure/Platform/PlatformContext.cs`:

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Oksis.Application.Modules.Platform.Abstractions;

namespace Oksis.Infrastructure.Platform;

public sealed class PlatformContext(IHttpContextAccessor httpContextAccessor) : IPlatformContext
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public bool IsPlatformRequest =>
        User?.HasClaim(PlatformClaims.TokenKind, PlatformClaims.PlatformKind) ?? false;

    public Guid? PlatformAccountId
    {
        get
        {
            if (!IsPlatformRequest)
            {
                return null;
            }

            // JwtBearer varsayılan claim eşlemesi `sub`'ı NameIdentifier'a taşır; ikisine de bak.
            var raw = User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                ?? User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
```

`src/Oksis.Infrastructure/Platform/PlatformTokenIssuer.cs`:

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Oksis.Application.Modules.Platform.Abstractions;
using Oksis.Domain.Modules.Platform.Entities;
using Oksis.Infrastructure.Identity;

namespace Oksis.Infrastructure.Platform;

/// <summary>
/// Platform token'ı: <c>sub</c>=platform hesabı, <c>jti</c>, <c>token_kind=platform</c>, <c>email</c>.
/// <c>school_id</c>, <c>perms_ver</c>, rol talebi YOKTUR — Program.cs'teki perms_ver bayatlık
/// kontrolü bu token'ı doğal olarak atlar, jti kara listesi çalışmaya devam eder.
/// </summary>
public sealed class PlatformTokenIssuer(IOptions<JwtOptions> options) : IPlatformTokenIssuer
{
    private readonly JwtOptions _options = options.Value;

    public PlatformIssuedToken Issue(PlatformAccount account)
    {
        var nowUtc = DateTime.UtcNow;
        var expires = nowUtc.AddMinutes(_options.PlatformAccessTokenMinutes);
        var jti = Guid.NewGuid().ToString("N");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, account.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, jti),
            new(PlatformClaims.TokenKind, PlatformClaims.PlatformKind),
            new(JwtRegisteredClaimNames.Email, account.Email),
        };

        var jwt = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: nowUtc,
            expires: expires,
            signingCredentials: JwtSigningCredentials.Build(_options));

        return new PlatformIssuedToken(
            new JwtSecurityTokenHandler().WriteToken(jwt),
            new DateTimeOffset(expires, TimeSpan.Zero),
            jti);
    }
}
```

`DependencyInjection.cs` (satır 152 yanına):

```csharp
        services.AddScoped<Application.Modules.Platform.Abstractions.IPlatformContext, Platform.PlatformContext>();
        services.AddScoped<Application.Modules.Platform.Abstractions.IPlatformTokenIssuer, Platform.PlatformTokenIssuer>();
```

- [ ] **Step 7: Giriş komutu testini yaz (kırmızı)**

`tests/Oksis.Infrastructure.IntegrationTests/Platform/PlatformLoginCommandHandlerTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Oksis.Application.Modules.Identity.Errors;
using Oksis.Application.Modules.Platform.Abstractions;
using Oksis.Application.Modules.Platform.Commands.PlatformLogin;
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Identity.ValueObjects;
using Oksis.Domain.Modules.Platform.Entities;
using Oksis.Infrastructure.Identity;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Platform;

[Collection(DatabaseCollection.Name)]
public sealed class PlatformLoginCommandHandlerTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    public PlatformLoginCommandHandlerTests(DatabaseFixture fixture) => _fixture = fixture;
    public async Task InitializeAsync() => await _fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private sealed class FakeIssuer : IPlatformTokenIssuer
    {
        public PlatformIssuedToken Issue(PlatformAccount account) =>
            new("token-" + account.Id, DateTimeOffset.UtcNow.AddHours(8), "jti");
    }

    private sealed class FixedClock(DateTimeOffset now) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow => now;
        public DateOnly Today => DateOnly.FromDateTime(now.UtcDateTime);
    }

    private static async Task<string> SeedAccountAsync(Oksis.Infrastructure.Persistence.OksisDbContext db)
    {
        var email = $"p-{Guid.NewGuid():N}@oksis.local";
        db.PlatformAccounts.Add(PlatformAccount.Create(
            email, PasswordHash.FromEncoded(new PasswordHasher().Hash("Oksis1234!")), "Test"));
        await db.SaveChangesAsync();
        return email;
    }

    [Fact(DisplayName = "Doğru parola → token; yanlış parola → invalid-credentials ve sayaç artar")]
    public async Task Login_RightAndWrongPasswordAsync()
    {
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var email = await SeedAccountAsync(db);
        var handler = new PlatformLoginCommandHandler(
            db, new PasswordHasher(), new FakeIssuer(), new FixedClock(DateTimeOffset.UtcNow),
            NullLogger<PlatformLoginCommandHandler>.Instance);

        var ok = await handler.Handle(new PlatformLoginCommand(email.ToUpperInvariant(), "Oksis1234!", "127.0.0.1"), CancellationToken.None);
        var bad = await handler.Handle(new PlatformLoginCommand(email, "yanlis", "127.0.0.1"), CancellationToken.None);

        ok.IsSuccess.Should().BeTrue();
        ok.Value!.AccessToken.Should().StartWith("token-");
        bad.IsFailure.Should().BeTrue();
        bad.Error.Should().Be(AccountErrors.InvalidCredentials);
        (await db.PlatformAccounts.AsNoTracking().SingleAsync(a => a.Email == email)).FailedLoginCount.Should().Be(1);
    }

    [Fact(DisplayName = "Beş yanlış parola kilitler; altıncı deneme locked döner")]
    public async Task Login_LocksAfterFiveFailuresAsync()
    {
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var email = await SeedAccountAsync(db);
        var handler = new PlatformLoginCommandHandler(
            db, new PasswordHasher(), new FakeIssuer(), new FixedClock(DateTimeOffset.UtcNow),
            NullLogger<PlatformLoginCommandHandler>.Instance);

        for (var i = 0; i < PlatformAccount.MaxFailedAttempts; i++)
        {
            await handler.Handle(new PlatformLoginCommand(email, "yanlis", null), CancellationToken.None);
        }
        var locked = await handler.Handle(new PlatformLoginCommand(email, "Oksis1234!", null), CancellationToken.None);

        locked.IsFailure.Should().BeTrue();
        locked.Error.Should().Be(AccountErrors.Locked);
    }

    [Fact(DisplayName = "Bilinmeyen e-posta da invalid-credentials (varlık sızdırılmaz)")]
    public async Task Login_UnknownEmail_InvalidCredentialsAsync()
    {
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var handler = new PlatformLoginCommandHandler(
            db, new PasswordHasher(), new FakeIssuer(), new FixedClock(DateTimeOffset.UtcNow),
            NullLogger<PlatformLoginCommandHandler>.Instance);

        var result = await handler.Handle(new PlatformLoginCommand("yok@oksis.local", "x", null), CancellationToken.None);

        result.Error.Should().Be(AccountErrors.InvalidCredentials);
    }
}
```

- [ ] **Step 8: Komut, validator, işleyici, sorgu**

`PlatformLoginCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Platform.Commands.PlatformLogin;

/// <summary>Platform hesabı girişi — okul bağlamı yok, izin gerektirmez (anonim uç).</summary>
[Tenancy(TenancyMode.Optional)]
public sealed record PlatformLoginCommand(string Email, string Password, string? Ip) : ICommand<PlatformAuthResult>;
```

`PlatformAuthResult.cs`:

```csharp
namespace Oksis.Application.Modules.Platform.Commands.PlatformLogin;

public sealed record PlatformAuthResult(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    int ExpiresInSeconds,
    string DisplayName,
    string Email);
```

`PlatformLoginCommandValidator.cs`:

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Platform.Commands.PlatformLogin;

public sealed class PlatformLoginCommandValidator : AbstractValidator<PlatformLoginCommand>
{
    public PlatformLoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MaximumLength(256);
    }
}
```

`PlatformLoginCommandHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Identity.Errors;
using Oksis.Application.Modules.Platform.Abstractions;
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Platform.Entities;
using Oksis.Shared;

namespace Oksis.Application.Modules.Platform.Commands.PlatformLogin;

/// <summary>
/// Hata sözleşmesi okul girişiyle aynıdır (<see cref="AccountErrors"/>): bilinmeyen e-posta ve
/// yanlış parola aynı cevabı verir; kilitliyse <c>Locked</c>. Zamanlama sızıntısına karşı
/// bulunamayan hesapta da bir hash doğrulaması yapılır.
/// </summary>
public sealed class PlatformLoginCommandHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IPlatformTokenIssuer tokenIssuer,
    IDateTimeProvider clock,
    ILogger<PlatformLoginCommandHandler> logger)
    : ICommandHandler<PlatformLoginCommand, PlatformAuthResult>
{
    private readonly string _dummyHash = passwordHasher.Hash("platform-dummy-" + Guid.NewGuid());

    public async Task<Result<PlatformAuthResult>> Handle(PlatformLoginCommand request, CancellationToken cancellationToken)
    {
        var email = PlatformAccount.NormalizeEmail(request.Email);
        var now = clock.UtcNow;

        var account = await db.PlatformAccounts
            .FirstOrDefaultAsync(a => a.Email == email, cancellationToken);

        if (account is null || !account.IsActive)
        {
            _ = passwordHasher.Verify(request.Password, _dummyHash);
            logger.LogWarning("Platform login not-found-or-inactive email={Email}", email);
            return Result<PlatformAuthResult>.Failure(AccountErrors.InvalidCredentials);
        }

        if (account.IsCurrentlyLocked(now))
        {
            _ = passwordHasher.Verify(request.Password, _dummyHash);
            logger.LogWarning("Platform login locked accountId={AccountId} until={Until:o}", account.Id, account.LockedUntil);
            return Result<PlatformAuthResult>.Failure(AccountErrors.Locked);
        }

        if (!passwordHasher.Verify(request.Password, account.PasswordHash.Encoded))
        {
            account.RegisterFailedLogin(now);
            await db.SaveChangesAsync(cancellationToken);
            logger.LogWarning("Platform login bad-password accountId={AccountId} failed={Failed}", account.Id, account.FailedLoginCount);
            return Result<PlatformAuthResult>.Failure(AccountErrors.InvalidCredentials);
        }

        account.RegisterSuccessfulLogin(now);
        await db.SaveChangesAsync(cancellationToken);

        var token = tokenIssuer.Issue(account);
        logger.LogInformation("Platform login success accountId={AccountId} jti={Jti} ip={Ip}", account.Id, token.Jti, request.Ip ?? "(none)");

        return Result<PlatformAuthResult>.Success(new PlatformAuthResult(
            token.AccessToken,
            token.ExpiresAt,
            (int)Math.Max(0, (token.ExpiresAt - now).TotalSeconds),
            account.DisplayName,
            account.Email));
    }
}
```

`GetPlatformMeQuery.cs` / `PlatformMeDto.cs` / `GetPlatformMeQueryHandler.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Platform.Queries.GetPlatformMe;

[Tenancy(TenancyMode.PlatformOnly)]
public sealed record GetPlatformMeQuery : IQuery<PlatformMeDto>;

public sealed record PlatformMeDto(Guid Id, string Email, string DisplayName);
```

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Platform.Abstractions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Platform.Queries.GetPlatformMe;

public sealed class GetPlatformMeQueryHandler(IApplicationDbContext db, IPlatformContext platform)
    : IQueryHandler<GetPlatformMeQuery, PlatformMeDto>
{
    public async Task<Result<PlatformMeDto>> Handle(GetPlatformMeQuery request, CancellationToken cancellationToken)
    {
        if (platform.PlatformAccountId is not { } accountId)
        {
            return Result<PlatformMeDto>.Failure(Error.Unauthorized);
        }

        var me = await db.PlatformAccounts.AsNoTracking()
            .Where(a => a.Id == accountId && a.IsActive)
            .Select(a => new PlatformMeDto(a.Id, a.Email, a.DisplayName))
            .FirstOrDefaultAsync(cancellationToken);

        return me is null ? Result<PlatformMeDto>.Failure(Error.Unauthorized) : Result<PlatformMeDto>.Success(me);
    }
}
```

- [ ] **Step 9: Giriş testini yeşile çevir**

Run: `./scripts/test-changed.sh --integration --filter PlatformLoginCommandHandlerTests`
Expected: 3 PASS.

- [ ] **Step 10: Controller ve sözleşme**

`src/Oksis.Api/Contracts/Platform/PlatformLoginBody.cs`:

```csharp
namespace Oksis.Api.Contracts.Platform;

public sealed record PlatformLoginBody(string Email, string Password);
```

`src/Oksis.Api/Controllers/V1/PlatformAuthController.cs`:

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oksis.Api.Contracts;
using Oksis.Api.Contracts.Platform;
using Oksis.Api.Extensions;
using Oksis.Application.Modules.Platform.Commands.PlatformLogin;
using Oksis.Application.Modules.Platform.Queries.GetPlatformMe;

namespace Oksis.Api.Controllers.V1;

/// <summary>Platform hesabı kimlik uçları (K-27 (a)). Okul giriş akışından ayrıdır; refresh yoktur.</summary>
[ApiController]
[Route("api/v1/platform/auth")]
[Produces("application/json")]
public sealed class PlatformAuthController(ISender sender) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<PlatformAuthResult>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status423Locked)]
    public async Task<IActionResult> LoginAsync([FromBody] PlatformLoginBody body, CancellationToken ct)
    {
        var result = await sender.Send(
            new PlatformLoginCommand(body.Email, body.Password, HttpContext.Connection.RemoteIpAddress?.ToString()), ct);
        return result.ToHttpResult(HttpContext);
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<PlatformMeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> MeAsync(CancellationToken ct)
    {
        var result = await sender.Send(new GetPlatformMeQuery(), ct);
        return result.ToHttpResult(HttpContext);
    }
}
```

- [ ] **Step 11: Elle doğrula**

API'yi başlat, sonra:

```bash
curl -s -X POST http://localhost:5112/api/v1/platform/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"platform@oksis.local","password":"Oksis1234!"}'
```
Expected: 200, `data.accessToken` dolu, `data.email = platform@oksis.local`. Token ile `GET /api/v1/platform/auth/me` → 200 ve aynı e-posta. Aynı token ile `GET /api/v1/school-settings` → 403 (`TenantRequired`, platform token'ı okul komutuna giremez). Yanlış parola → 401.

- [ ] **Step 12: Commit**

```bash
dotnet format
git add -A
git commit -m "feat(platform): platform token'ı, tenant kapısında PlatformOnly ve platform girişi

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01W8ksrYqz3prgzeNCARapcp"
```

---

### Task 4: Okul açma komutu, okul listesi, platform uçları

**Files:**
- Create: `src/Oksis.Application/Modules/Platform/Common/PlatformErrorCodes.cs`
- Create: `src/Oksis.Application/Modules/Platform/Commands/CreateSchool/{CreateSchoolCommand,CreateSchoolResult,CreateSchoolCommandValidator,CreateSchoolCommandHandler}.cs`
- Create: `src/Oksis.Application/Modules/Platform/Queries/ListSchools/{ListSchoolsQuery,PlatformSchoolListItemDto,ListSchoolsQueryHandler}.cs`
- Create: `src/Oksis.Api/Controllers/V1/PlatformSchoolsController.cs`
- Modify: `src/Oksis.Api/Errors/ErrorMessageCatalog.cs` (yeni anahtar)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Platform/CreateSchoolCommandHandlerTests.cs`

**Interfaces:**
- Produces: `CreateSchoolCommand(string Name, string Code, SchoolType Type, string? TimeZone, string AdminFirstName, string AdminLastName, string AdminEmail)` → `CreateSchoolResult(Guid SchoolId, Guid AdminPersonId, Guid InvitationId, DateTimeOffset InvitationExpiresAt)`.
- Produces: `ListSchoolsQuery` → `IReadOnlyList<PlatformSchoolListItemDto(Guid Id, string Name, string Code, string Type, string Status, DateTimeOffset CreatedAt, string? AdminEmail, string? InvitationStatus, DateTimeOffset? InvitationExpiresAt)>`.
- Produces: `POST api/v1/platform/schools` (201), `GET api/v1/platform/schools` (200).
- Consumes: Task 1 `InvitationCreationHelper.CreateForPersonAsync(... Guid? seasonId ...)`, `SchoolLevelRoles.SchoolAdminCode`; Task 3 `TenancyMode.PlatformOnly`; mevcut `SeedSchoolGradeLevelsHandler.SeedForSchoolAsync(db, schoolId, ct)`, `SchoolSettings.CreateDefault(schoolId)`, `UpdateBasicInfo(...)`, `UpdateAcademicStructure(...)`.

- [ ] **Step 1: Entegrasyon testini yaz (kırmızı)**

`tests/Oksis.Infrastructure.IntegrationTests/Platform/CreateSchoolCommandHandlerTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Platform.Commands.CreateSchool;
using Oksis.Application.Modules.Platform.Common;
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Identity;
using Oksis.Domain.Modules.Schools.Enums;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Infrastructure.Identity;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Platform;

/// <summary>
/// K-27 ilk dilim: platform bağlamında (okulsuz) okul açılır, kurulum bağlamına geçilir,
/// tür ayara yazılıp kademeler türer (TB-162), ilk yönetici sezonsuz SCHOOL_ADMIN daveti alır (0020).
/// Fixture'da DomainEventInterceptor YOK; bu yüzden handler ayarları olaya bırakmaz, kendisi güvenceye alır.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class CreateSchoolCommandHandlerTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    public CreateSchoolCommandHandlerTests(DatabaseFixture fixture) => _fixture = fixture;
    public async Task InitializeAsync() => await _fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    /// <summary>Platform isteği: okul bağlamı yok; SetForLoginFlow gerçekten bağlam kurar.</summary>
    private sealed class PlatformTenantContext : ITenantContext
    {
        public Guid? CurrentSchoolId { get; private set; }
        public bool IsSuperAdmin => false;
        public bool HasTenant => CurrentSchoolId is not null;
        public void OverrideForSuperAdmin(Guid schoolId) { }
        public void SetForLoginFlow(Guid schoolId) => CurrentSchoolId = schoolId;
    }

    private sealed class Clock : IDateTimeProvider
    {
        public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
        public DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);
    }

    private static CreateSchoolCommand Command(string code) => new(
        "Altınay Anadolu Lisesi", code, SchoolType.HighSchool, null, "Ayşe", "Yılmaz", $"mudur-{code.ToLowerInvariant()}@example.com");

    [Fact(DisplayName = "Okul + ayar(tür) + kademeler + müdür kişi + sezonsuz SCHOOL_ADMIN daveti tek komutta")]
    public async Task Handle_CreatesSchoolAndInvitesAdminAsync()
    {
        var tenant = new PlatformTenantContext();
        var code = $"ALT{Guid.NewGuid():N}"[..10].ToUpperInvariant();
        Guid schoolId;
        await using (var db = _fixture.CreateDbContext(tenant))
        {
            var handler = new CreateSchoolCommandHandler(
                db, tenant, new InvitationTokenFactory(), new Clock(), NullLogger<CreateSchoolCommandHandler>.Instance);

            var result = await handler.Handle(Command(code), CancellationToken.None);

            result.IsSuccess.Should().BeTrue(result.Error.Message);
            schoolId = result.Value!.SchoolId;
        }

        await using var verify = _fixture.CreateDbContext(schoolId);
        var school = await verify.Schools.AsNoTracking().SingleAsync(s => s.Id == schoolId);
        school.Code.Should().Be(code);
        school.Status.Should().Be(TenantStatus.Setup);

        var settings = await verify.SchoolSettings.AsNoTracking().SingleAsync(s => s.SchoolId == schoolId);
        settings.SchoolTypes.Should().Equal(SchoolType.HighSchool);
        (await verify.SchoolGradeLevels.AsNoTracking().CountAsync(g => g.SchoolId == schoolId)).Should().BeGreaterThan(0, "TB-162: tür bilinince kademeler türer");

        var person = await verify.Persons.AsNoTracking().Include(p => p.Profiles).SingleAsync(p => p.SchoolId == schoolId);
        person.LifecycleState.Should().Be(PersonLifecycleState.Invited);
        person.PrimaryEmail!.Value.Should().Be($"mudur-{code.ToLowerInvariant()}@example.com");

        var invitation = await verify.Invitations.AsNoTracking().SingleAsync(i => i.SchoolId == schoolId);
        invitation.SeasonId.Should().BeNull("0020: okul yöneticisi okul düzeyinde davet edilir");
        invitation.Status.Should().Be(InvitationStatus.Created);
        var roleCode = await verify.SystemRoles.AsNoTracking().Where(r => r.Id == invitation.TargetSystemRoleId).Select(r => r.Code).SingleAsync();
        roleCode.Should().Be(SchoolLevelRoles.SchoolAdminCode);
    }

    [Fact(DisplayName = "Aynı okul kodu ikinci kez → PLATFORM_SCHOOL_CODE_DUPLICATE")]
    public async Task Handle_DuplicateCode_FailsAsync()
    {
        // DİKKAT: db ile handler AYNI tenant nesnesini paylaşmalı — SetForLoginFlow'u handler çağırır,
        // TenantSaveChangesInterceptor ise db'nin bağlamını okur. Ayrı nesne verilirse ayarlar
        // "Tenant mismatch on insert" ile düşer.
        var code = $"DUP{Guid.NewGuid():N}"[..10].ToUpperInvariant();
        var firstTenant = new PlatformTenantContext();
        await using (var db = _fixture.CreateDbContext(firstTenant))
        {
            var handler = new CreateSchoolCommandHandler(db, firstTenant, new InvitationTokenFactory(), new Clock(), NullLogger<CreateSchoolCommandHandler>.Instance);
            (await handler.Handle(Command(code), CancellationToken.None)).IsSuccess.Should().BeTrue();
        }

        var secondTenant = new PlatformTenantContext();
        await using var db2 = _fixture.CreateDbContext(secondTenant);
        var second = new CreateSchoolCommandHandler(db2, secondTenant, new InvitationTokenFactory(), new Clock(), NullLogger<CreateSchoolCommandHandler>.Instance);

        var result = await second.Handle(Command(code.ToLowerInvariant()), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be(PlatformErrorCodes.SchoolCodeDuplicate);
    }
}
```

Bu test `DatabaseFixture.CreateDbContext(ITenantContext)` aşırı yüklemesine ihtiyaç duyar; fixture'da `CreateDbContext(FakeTenantContext, IInterceptor?)` private. `DatabaseFixture.cs`'e ekle:

```csharp
    /// <summary>Kendi tenant bağlamını getiren testler için (platform bağlamı gibi). Prod interceptor seti aynen.</summary>
    public OksisDbContext CreateDbContext(ITenantContext tenantContext)
    {
        var options = new DbContextOptionsBuilder<OksisDbContext>()
            .UseSqlServer(_connectionString)
            .UseSnakeCaseNamingConvention()
            .AddInterceptors(
                new TenantSaveChangesInterceptor(tenantContext),
                new StudentClassroomSyncInterceptor())
            .Options;

        return new OksisDbContext(options, tenantContext);
    }
```

(Mevcut private `CreateDbContext(FakeTenantContext, IInterceptor?)` gövdesiyle aynı; `UseSqlServer` çağrısını oradaki hâliyle birebir kopyala.)

- [ ] **Step 2: Kırmızıyı gör**

Run: `dotnet build tests/Oksis.Infrastructure.IntegrationTests`
Expected: derleme hatası (komut/handler yok).

- [ ] **Step 3: Hata kodları, komut, validator**

`PlatformErrorCodes.cs`:

```csharp
namespace Oksis.Application.Modules.Platform.Common;

public static class PlatformErrorCodes
{
    public const string SchoolCodeDuplicate = "PLATFORM_SCHOOL_CODE_DUPLICATE";
    public const string SchoolAdminRoleMissing = "PLATFORM_SCHOOL_ADMIN_ROLE_MISSING";
    public const string ConsentBundleMissing = "PLATFORM_CONSENT_BUNDLE_MISSING";
    public const string ValidationFailed = "PLATFORM_VALIDATION_FAILED";
}
```

`CreateSchoolCommand.cs` + `CreateSchoolResult.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Domain.Modules.Schools.Enums;

namespace Oksis.Application.Modules.Platform.Commands.CreateSchool;

/// <summary>
/// Platformdan yeni okul (K-27 ilk dilim): okul + ayarlarda tür + kademeler + ilk yönetici kişisi +
/// sezonsuz SCHOOL_ADMIN daveti. Sezonu müdür kendisi açar (0020).
/// </summary>
[Tenancy(TenancyMode.PlatformOnly)]
public sealed record CreateSchoolCommand(
    string Name,
    string Code,
    SchoolType Type,
    string? TimeZone,
    string AdminFirstName,
    string AdminLastName,
    string AdminEmail) : ICommand<CreateSchoolResult>;

public sealed record CreateSchoolResult(
    Guid SchoolId,
    Guid AdminPersonId,
    Guid InvitationId,
    DateTimeOffset InvitationExpiresAt);
```

`CreateSchoolCommandValidator.cs`:

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Platform.Commands.CreateSchool;

public sealed class CreateSchoolCommandValidator : AbstractValidator<CreateSchoolCommand>
{
    public CreateSchoolCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Code).NotEmpty().Length(3, 50)
            .Matches("^[A-Za-z0-9-]+$").WithMessage("platform.errors.school-code-format");
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.TimeZone).MaximumLength(64);
        RuleFor(x => x.AdminFirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.AdminLastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.AdminEmail).NotEmpty().EmailAddress().MaximumLength(256);
    }
}
```

`ErrorMessageCatalog.cs`'e (mevcut sözlüğe): `["platform.errors.school-code-format"] = "Okul kodu 3-50 karakter olmalı; yalnız harf, rakam ve tire içerebilir.",`

- [ ] **Step 4: İşleyici**

`CreateSchoolCommandHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Platform.Common;
using Oksis.Application.Modules.Schools.Events.SchoolCreated;
using Oksis.Application.Modules.Users.Common;
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Identity;
using Oksis.Domain.Modules.Schools.Entities;
using Oksis.Domain.Modules.Schools.Enums;
using Oksis.Domain.Modules.Schools.Exceptions;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.Enums;
using Oksis.Domain.Modules.Users.ValueObjects;
using Oksis.Shared;

namespace Oksis.Application.Modules.Platform.Commands.CreateSchool;

/// <summary>
/// Sıra: (1) okul (tenant varlığı değil) → (2) kurulum bağlamı (SetForLoginFlow: platform token'ında
/// school_id yok, geçiş serbest) → (3) ayarlar: olay dinleyicisi kurmuş olabilir, yoksa burada kurulur;
/// tür yazılır, kademeler türetilir (TB-162) → (4) müdür kişisi (Staff) → (5) sezonsuz SCHOOL_ADMIN
/// daveti (0020). E-posta <c>UserInvitedEvent → UserInvitedEmailHandler</c> ile kuyruğa girer;
/// burada ayrıca gönderilmez. Adımlar tek transaction'dadır (TransactionBehavior).
/// </summary>
public sealed class CreateSchoolCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IInvitationTokenFactory tokenFactory,
    IDateTimeProvider clock,
    ILogger<CreateSchoolCommandHandler> logger)
    : ICommandHandler<CreateSchoolCommand, CreateSchoolResult>
{
    private const int InvitationTtlDays = 7;

    public async Task<Result<CreateSchoolResult>> Handle(CreateSchoolCommand request, CancellationToken cancellationToken)
    {
        var code = request.Code.Trim().ToUpperInvariant();

        if (await db.Schools.AsNoTracking().AnyAsync(s => s.Code == code, cancellationToken))
        {
            return Result<CreateSchoolResult>.Failure(new Error(
                PlatformErrorCodes.SchoolCodeDuplicate, "Bu okul kodu zaten kullanılıyor."));
        }

        var schoolAdminRoleId = await db.SystemRoles.AsNoTracking()
            .Where(r => r.Code == SchoolLevelRoles.SchoolAdminCode)
            .Select(r => (Guid?)r.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (schoolAdminRoleId is null)
        {
            return Result<CreateSchoolResult>.Failure(new Error(
                PlatformErrorCodes.SchoolAdminRoleMissing, "Okul yöneticisi rolü seed'de bulunamadı."));
        }

        var consentVersion = await db.ConsentBundles.AsNoTracking()
            .Where(b => b.IsCurrent)
            .Select(b => b.Version)
            .FirstOrDefaultAsync(cancellationToken);
        if (consentVersion is null)
        {
            return Result<CreateSchoolResult>.Failure(new Error(
                PlatformErrorCodes.ConsentBundleMissing, "Güncel KVKK rıza paketi bulunamadı."));
        }

        // (1) Okul
        School school;
        try
        {
            school = School.Create(request.Name, code, request.Type, PlanCode.Free, request.TimeZone);
        }
        catch (SchoolDomainException ex)
        {
            return Result<CreateSchoolResult>.Failure(new Error(PlatformErrorCodes.ValidationFailed, ex.Message));
        }

        db.Schools.Add(school);

        // (2) Kurulum bağlamı — bundan sonraki her tenant satırı bu okula yazılır.
        tenant.SetForLoginFlow(school.Id);
        await db.SaveChangesAsync(cancellationToken);

        // (3) Ayarlar + tür + kademeler
        var settings = await db.SchoolSettings
            .FirstOrDefaultAsync(s => s.SchoolId == school.Id, cancellationToken);
        if (settings is null)
        {
            settings = SchoolSettings.CreateDefault(school.Id);
            settings.UpdateBasicInfo(
                officialName: school.Name, mebCode: null, displayName: null, ownershipType: null, foundingYear: null);
            db.SchoolSettings.Add(settings);
        }

        settings.UpdateAcademicStructure(
            [request.Type],
            settings.EducationLanguage,
            settings.WeeklyLessonDays,
            settings.StudentNumberPrefix,
            settings.StudentNumberLength);
        await db.SaveChangesAsync(cancellationToken);

        var gradeLevels = await SeedSchoolGradeLevelsHandler.SeedForSchoolAsync(db, school.Id, cancellationToken);

        // (4) Müdür kişisi
        var person = Person.Create(
            school.Id,
            PersonName.Create(request.AdminFirstName.Trim(), request.AdminLastName.Trim()),
            primaryEmail: Email.Create(request.AdminEmail.Trim()));
        person.AttachProfile(StaffProfile.Create(department: "Okul Yönetimi", position: "Müdür"));
        db.Persons.Add(person);

        // (5) Sezonsuz davet
        var created = await InvitationCreationHelper.CreateForPersonAsync(
            db, school.Id, person, schoolAdminRoleId.Value, seasonId: null,
            InvitationChannel.Email, InvitationTtlDays, consentVersion,
            tokenFactory, clock.UtcNow, batchId: null, cancellationToken);
        if (created.IsFailure)
        {
            return Result<CreateSchoolResult>.Failure(created.Error);
        }

        await db.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Platform: okul açıldı schoolId={SchoolId} code={Code} gradeLevels={GradeLevels} invitationId={InvitationId}",
            school.Id, school.Code, gradeLevels, created.Value.Invitation.Id);

        return Result<CreateSchoolResult>.Success(new CreateSchoolResult(
            school.Id, person.Id, created.Value.Invitation.Id, created.Value.Invitation.ExpiresAt));
    }
}
```

`SeedSchoolGradeLevelsHandler` `Oksis.Application.Modules.Schools.Events.SchoolCreated` ad alanındadır; `SeedForSchoolAsync` public static ve kendi `SaveChangesAsync`'ini yapar (ölçüldü). `Email` VO `Oksis.Domain.Modules.Users.ValueObjects.Email`; `Person.Create`'in altıncı parametresi `primaryEmail` adlıdır.

- [ ] **Step 5: Testi yeşile çevir**

Run: `./scripts/test-changed.sh --integration --filter CreateSchoolCommandHandlerTests`
Expected: 2 PASS. Kademe sayısı `HighSchool` için sıfırdan büyük (`SchoolTypeToGradeLevelCodes` eşlemesi).

- [ ] **Step 6: Okul listesi sorgusu**

`ListSchoolsQuery.cs` + `PlatformSchoolListItemDto.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;

namespace Oksis.Application.Modules.Platform.Queries.ListSchools;

[Tenancy(TenancyMode.PlatformOnly)]
public sealed record ListSchoolsQuery : IQuery<IReadOnlyList<PlatformSchoolListItemDto>>;

public sealed record PlatformSchoolListItemDto(
    Guid Id,
    string Name,
    string Code,
    string Type,
    string Status,
    DateTimeOffset CreatedAt,
    string? AdminEmail,
    string? InvitationStatus,
    DateTimeOffset? InvitationExpiresAt);
```

`ListSchoolsQueryHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Platform.Queries.ListSchools;

/// <summary>
/// Platform okul listesi: okul HAKKINDA veri (0008). <c>School</c> tenant varlığı değil, doğrudan okunur.
/// İlk yönetici davetinin durumu ve e-postası için <c>Invitations</c>/<c>Persons</c> tenant süzgecini
/// aşmak gerekir — platform isteğinde <c>CurrentSchoolId</c> yoktur, süzgeç 0 satır verirdi.
/// <b>IgnoreQueryFilters gerekçesi:</b> yalnız sezonsuz (okul-düzeyi) davet satırı ve kişinin e-postası
/// seçilir; okul içi başka hiçbir satır yüklenmez, sonuç kişisel ayrıntı taşımaz.
/// </summary>
public sealed class ListSchoolsQueryHandler(IApplicationDbContext db)
    : IQueryHandler<ListSchoolsQuery, IReadOnlyList<PlatformSchoolListItemDto>>
{
    public async Task<Result<IReadOnlyList<PlatformSchoolListItemDto>>> Handle(
        ListSchoolsQuery request, CancellationToken cancellationToken)
    {
        var schools = await db.Schools.AsNoTracking()
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new { s.Id, s.Name, s.Code, s.Type, s.Status, s.CreatedAt })
            .ToListAsync(cancellationToken);

        var schoolIds = schools.Select(s => s.Id).ToList();

        var invitations = await (
            from i in db.Invitations.IgnoreQueryFilters().AsNoTracking()
            join p in db.Persons.IgnoreQueryFilters().AsNoTracking() on i.PersonId equals p.Id
            where schoolIds.Contains(i.SchoolId) && i.SeasonId == null && !i.IsDeleted && !p.IsDeleted
            select new { i.SchoolId, i.Status, i.ExpiresAt, i.CreatedAt, p.PrimaryEmail })
            .ToListAsync(cancellationToken);

        var latestBySchool = invitations
            .GroupBy(i => i.SchoolId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(i => i.CreatedAt).First());

        var items = schools.Select(s =>
        {
            latestBySchool.TryGetValue(s.Id, out var inv);
            return new PlatformSchoolListItemDto(
                s.Id, s.Name, s.Code, s.Type.ToString(), s.Status.ToString(), s.CreatedAt,
                inv?.PrimaryEmail?.Value, inv?.Status.ToString(), inv?.ExpiresAt);
        }).ToList();

        return Result<IReadOnlyList<PlatformSchoolListItemDto>>.Success(items);
    }
}
```

`Invitation`/`Person` `TenantEntity` türetir, `IsDeleted` alanı vardır (soft-delete süzgeci de `IgnoreQueryFilters` ile düştüğü için elle eklendi).

- [ ] **Step 7: Controller**

`src/Oksis.Api/Controllers/V1/PlatformSchoolsController.cs`:

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oksis.Api.Contracts;
using Oksis.Api.Extensions;
using Oksis.Application.Modules.Platform.Commands.CreateSchool;
using Oksis.Application.Modules.Platform.Queries.ListSchools;

namespace Oksis.Api.Controllers.V1;

/// <summary>Platform okul yüzeyi (0008 "okul kaydı" öbeği). Yalnız platform token'ı (PlatformOnly).</summary>
[ApiController]
[Route("api/v1/platform/schools")]
[Authorize]
[Produces("application/json")]
public sealed class PlatformSchoolsController(ISender sender) : ControllerBase
{
    [HttpGet("")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PlatformSchoolListItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAsync(CancellationToken ct)
    {
        var result = await sender.Send(new ListSchoolsQuery(), ct);
        return result.ToHttpResult(HttpContext);
    }

    [HttpPost("")]
    [ProducesResponseType(typeof(ApiResponse<CreateSchoolResult>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateAsync([FromBody] CreateSchoolCommand command, CancellationToken ct)
    {
        var result = await sender.Send(command, ct);
        if (result.IsSuccess)
        {
            var correlationId = HttpContext.Response.Headers["X-Correlation-Id"].ToString();
            return StatusCode(StatusCodes.Status201Created, ApiResponse<CreateSchoolResult>.Ok(result.Value!, correlationId));
        }

        return result.ToHttpResult(HttpContext);
    }
}
```

- [ ] **Step 8: Elle doğrula (e-posta dâhil)**

`docker compose up -d` (Mailpit dâhil), API çalışırken platform token'ı ile:

```bash
curl -s -X POST http://localhost:5112/api/v1/platform/schools \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Altınay Anadolu Lisesi","code":"ALTINAY","type":"HighSchool","timeZone":null,"adminFirstName":"Ayşe","adminLastName":"Yılmaz","adminEmail":"mudur@altinay.test"}'
```
Expected: 201, `data.schoolId`, `data.invitationId`. `GET /api/v1/platform/schools` → listede okul, `invitationStatus: "Sent"` (Hangfire işi koştuktan sonra). Mailpit `http://localhost:8025` → "mudur@altinay.test" adresine davet e-postası, bağlantı `http://localhost:3000/invitations/<token>`. Aynı kodla ikinci POST → 409.

- [ ] **Step 9: Commit**

```bash
dotnet format
git add -A
git commit -m "feat(platform): platformdan okul açma — ayarlar, kademeler ve sezonsuz müdür daveti

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01W8ksrYqz3prgzeNCARapcp"
```

---

### Task 5: Müdürün davetle hesap açıp sezonsuz okula girmesi (uçtan uca doğrulama)

**Files:**
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Platform/SchoolAdminOnboardingFlowTests.cs`

**Interfaces:**
- Consumes: Task 4 `CreateSchoolCommandHandler`; mevcut `AcceptInvitationCommandHandler(db, tenant, IAccountProvisioner, logger)`, `AcceptInvitationCommand(RawToken, Password, FirstName?, LastName?, IReadOnlyList<ConsentGrantRequest>)`, `InvitationAccountProvisioner(db, IPasswordHasher)`, `AccountPermissionResolver(db)`.

- [ ] **Step 1: Akış testini yaz**

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Utilities;
using Oksis.Application.Modules.Identity.Services;
using Oksis.Application.Modules.Platform.Commands.CreateSchool;
using Oksis.Application.Modules.Users.Commands.AcceptInvitation;
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Schools.Enums;
using Oksis.Infrastructure.Identity;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;
using ConsentType = Oksis.Domain.Modules.Users.Enums.ConsentType;

namespace Oksis.Infrastructure.IntegrationTests.Platform;

/// <summary>
/// K-27 ilk dilimin senaryosu: platform okulu açar → müdür daveti kabul eder → müdürün izinleri
/// sezonsuz okulda çözülür ve sezon açma izni vardır. Sezonu platform DEĞİL müdür açar (0020).
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class SchoolAdminOnboardingFlowTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    public SchoolAdminOnboardingFlowTests(DatabaseFixture fixture) => _fixture = fixture;
    public async Task InitializeAsync() => await _fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    /// <summary>
    /// db ile handler AYNI nesneyi paylaşır: handler SetForLoginFlow'u çağırır, interceptor
    /// db'nin bağlamını okur. Platform adımı okulsuz başlar; kabul adımı okulu bilerek başlar.
    /// </summary>
    private sealed class SettableTenantContext(Guid? initialSchoolId = null) : ITenantContext
    {
        public Guid? CurrentSchoolId { get; private set; } = initialSchoolId;
        public bool IsSuperAdmin => false;
        public bool HasTenant => CurrentSchoolId is not null;
        public void OverrideForSuperAdmin(Guid schoolId) { }
        public void SetForLoginFlow(Guid schoolId) => CurrentSchoolId = schoolId;
    }

    /// <summary>Ham token'ı testin bilmesi için sabit üreten fabrika (üretimde rastgele).</summary>
    private sealed class FixedTokenFactory(string raw) : IInvitationTokenFactory
    {
        public InvitationTokenPair Create() => new(raw, TokenHasher.Sha256Hex(raw));
    }

    private sealed class Clock : IDateTimeProvider
    {
        public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
        public DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow);
    }

    [Fact(DisplayName = "Okul aç → davet kabul → müdür sezonsuz okulda sezon açma iznine sahip")]
    public async Task PlatformCreatesSchool_AdminAccepts_HasSeasonPermissionAsync()
    {
        var rawToken = $"raw-{Guid.NewGuid():N}";
        var code = $"FLW{Guid.NewGuid():N}"[..10].ToUpperInvariant();
        Guid schoolId;
        Guid personId;

        var platformTenant = new SettableTenantContext();
        await using (var createDb = _fixture.CreateDbContext(platformTenant))
        {
            var create = new CreateSchoolCommandHandler(
                createDb, platformTenant, new FixedTokenFactory(rawToken), new Clock(),
                NullLogger<CreateSchoolCommandHandler>.Instance);
            var created = await create.Handle(
                new CreateSchoolCommand("Akış Lisesi", code, SchoolType.HighSchool, null, "Ayşe", "Yılmaz", $"ayse-{code.ToLowerInvariant()}@example.com"),
                CancellationToken.None);
            created.IsSuccess.Should().BeTrue(created.Error.Message);
            schoolId = created.Value!.SchoolId;
            personId = created.Value.AdminPersonId;
        }

        Guid accountId;
        var acceptTenant = new SettableTenantContext(schoolId);
        await using (var db = _fixture.CreateDbContext(acceptTenant))
        {
            var accept = new AcceptInvitationCommandHandler(
                db, acceptTenant, new InvitationAccountProvisioner(db, new PasswordHasher()),
                NullLogger<AcceptInvitationCommandHandler>.Instance);
            var accepted = await accept.Handle(
                new AcceptInvitationCommand(rawToken, "Mudur1234!", null, null,
                    [new ConsentGrantRequest(ConsentType.DataProcessing, true)]),
                CancellationToken.None);
            accepted.IsSuccess.Should().BeTrue(accepted.Error.Message);
            accountId = accepted.Value!.AccountId;
        }

        await using var verify = _fixture.CreateDbContext(schoolId);
        var assignment = await verify.RoleAssignments.AsNoTracking().SingleAsync(a => a.PersonId == personId);
        assignment.SeasonId.Should().BeNull();
        (await verify.AcademicSessions.AsNoTracking().AnyAsync(s => s.SchoolId == schoolId)).Should().BeFalse("sezonu müdür açar");

        var permissions = await new AccountPermissionResolver(verify)
            .ResolveAsync(accountId, personId, "Staff", activeSeasonId: null, CancellationToken.None);
        permissions.Should().Contain("academic-sessions.create");
        permissions.Should().Contain("school-settings.view");
    }
}
```

`AcceptInvitation` `SetForLoginFlow(invitation.SchoolId)` çağırır; `SettableTenantContext` bunu gerçekten uygular, interceptor okulu tanır. `TokenHasher` `Oksis.Application.Common.Utilities` ad alanındadır (mevcut kabul testi aynı `using`'i taşır).

- [ ] **Step 2: Koştur**

Run: `./scripts/test-changed.sh --integration --filter SchoolAdminOnboardingFlowTests`
Expected: PASS. Kırmızıysa nedenini `AcceptInvitation`'ın sezon beklentisinde ara (`invitation.SeasonId` artık `Guid?` — Task 1'de `RoleAssignment.Create` çağrısı derleme hatası vermeden geçmiş olmalı).

- [ ] **Step 3: Commit**

```bash
dotnet format
git add -A
git commit -m "test(platform): okul açılıştan müdür girişine uçtan uca akış ölçüldü

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01W8ksrYqz3prgzeNCARapcp"
```

---

### Task 6: Web — platform girişi ve okul tanımlama ekranı

Depo: `~/Repositories/oksis-ui`. Dal: `feature/platform-okul-acilisi`.

**Files:**
- Modify: `packages/api/src/generated/schema.ts` (codegen ile)
- Create: `packages/api/src/platform/endpoints.ts`, `packages/api/src/platform/queries.ts`
- Modify: `packages/api/src/index.ts` (export), `packages/api/src/client/query-keys.ts` (`platform` anahtarları), `packages/api/src/client/mutation-error.ts:50` (yorum metni)
- Create: `apps/web/app/(platform)/layout.tsx`, `apps/web/app/(platform)/platform/login/page.tsx`, `apps/web/app/(platform)/platform/schools/page.tsx`
- Create: `apps/web/features/platform/index.ts`, `platform-login-screen.tsx`, `platform-schools-page.tsx`, `platform.css`
- Modify: davet listesi ve rol atama listesi bileşenlerinde sezon adı boşsa "Tüm sezonlar" (dosyayı `grep -rn "seasonName" apps/web/features/invitations apps/web/features/users` ile bul)

**Interfaces:**
- Consumes: `POST /api/v1/platform/auth/login` (`PlatformLoginBody` → `PlatformAuthResult`), `GET /api/v1/platform/auth/me` (`PlatformMeDto`), `GET|POST /api/v1/platform/schools` (`PlatformSchoolListItemDto[]`, `CreateSchoolCommand` → `CreateSchoolResult`).
- Consumes: `getConfig().auth.setTokens({ accessToken, refreshToken, accessExpiresAt })`, `getClient()`, `unwrap<T>(result)`, `qk`.

- [ ] **Step 1: Şemayı yeniden üret**

API çalışırken (`dotnet run --project src/Oksis.Api`):

```bash
cd ~/Repositories/oksis-ui && pnpm --filter @workspace/api codegen
git diff --stat packages/api/src/generated/schema.ts
```
Expected: `PlatformLoginBody`, `PlatformAuthResult`, `PlatformMeDto`, `CreateSchoolCommand`, `CreateSchoolResult`, `PlatformSchoolListItemDto` şemaya girdi; `InvitationListItemDto.seasonId` ve `RoleAssignmentDto.seasonId` nullable oldu.

- [ ] **Step 2: API paketi — uçlar ve sorgular**

`packages/api/src/client/query-keys.ts` içindeki `qk` nesnesine:

```ts
  platform: {
    me: () => ["platform", "me"] as const,
    schools: () => ["platform", "schools"] as const,
  },
```

`packages/api/src/platform/endpoints.ts`:

```ts
import type { components } from "../generated/schema"
import { getClient } from "../client/client"
import { unwrap } from "../client/request"

type S = components["schemas"]
export type PlatformLoginBody = S["PlatformLoginBody"]
export type PlatformAuthResult = S["PlatformAuthResult"]
export type PlatformMeDto = S["PlatformMeDto"]
export type CreateSchoolCommand = S["CreateSchoolCommand"]
export type CreateSchoolResult = S["CreateSchoolResult"]
export type PlatformSchoolListItemDto = S["PlatformSchoolListItemDto"]

/** Web'de okul türü seçenekleri; backend enum'u PascalCase string kabul eder (JsonStringEnumConverter). */
export const PLATFORM_SCHOOL_TYPES = [
  { value: "Preschool", label: "Anaokulu" },
  { value: "PrimarySchool", label: "İlkokul" },
  { value: "MiddleSchool", label: "Ortaokul" },
  { value: "HighSchool", label: "Lise" },
] as const

export async function platformLogin(body: PlatformLoginBody): Promise<PlatformAuthResult> {
  const result = await getClient().POST("/api/v1/platform/auth/login", { body })
  return unwrap<PlatformAuthResult>(result)
}

export async function getPlatformMe(): Promise<PlatformMeDto> {
  const result = await getClient().GET("/api/v1/platform/auth/me")
  return unwrap<PlatformMeDto>(result)
}

export async function listPlatformSchools(): Promise<PlatformSchoolListItemDto[]> {
  const result = await getClient().GET("/api/v1/platform/schools")
  return unwrap<PlatformSchoolListItemDto[]>(result)
}

export async function createPlatformSchool(body: CreateSchoolCommand): Promise<CreateSchoolResult> {
  const result = await getClient().POST("/api/v1/platform/schools", { body })
  return unwrap<CreateSchoolResult>(result)
}
```

`packages/api/src/platform/queries.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getConfig } from "../client/config"
import { qk } from "../client/query-keys"
import {
  createPlatformSchool,
  getPlatformMe,
  listPlatformSchools,
  platformLogin,
  type PlatformAuthResult,
} from "./endpoints"

function persistPlatformToken(result: PlatformAuthResult): void {
  // Platform token'ının refresh'i yok (K-27 ilk dilim); süre dolunca yeniden giriş.
  getConfig().auth.setTokens({
    accessToken: result.accessToken,
    refreshToken: "",
    accessExpiresAt: result.expiresAt,
  })
}

export function usePlatformLogin() {
  return useMutation({ mutationFn: platformLogin, onSuccess: persistPlatformToken })
}

export function usePlatformMe() {
  return useQuery({ queryKey: qk.platform.me(), queryFn: getPlatformMe, retry: false })
}

export function usePlatformSchools() {
  return useQuery({ queryKey: qk.platform.schools(), queryFn: listPlatformSchools })
}

export function useCreatePlatformSchool() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPlatformSchool,
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.platform.schools() }),
  })
}
```

`packages/api/src/index.ts`'e: `export * from "./platform/endpoints"` ve `export * from "./platform/queries"` (dosyadaki mevcut modül export kalıbıyla aynı satır biçimi).

`packages/api/src/client/mutation-error.ts:50` yorumundaki `"This operation requires SuperAdmin privileges."` → `"This operation requires a platform account."`; `mutation-error.test.ts:146,158`'deki aynı metni de güncelle (test kendi mesajını besler, sınıflandırma değişmez).

- [ ] **Step 3: Rota ve düzen**

`apps/web/app/(platform)/layout.tsx`:

```tsx
import "@workspace/ui/styles/auth.css"
import "@/features/platform/platform.css"

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <div className="pf-root">{children}</div>
}
```

`apps/web/app/(platform)/platform/login/page.tsx`:

```tsx
import { PlatformLoginScreen } from "@/features/platform"

export default function Page() {
  return <PlatformLoginScreen />
}
```

`apps/web/app/(platform)/platform/schools/page.tsx`:

```tsx
import { PlatformSchoolsPage } from "@/features/platform"

export default function Page() {
  return <PlatformSchoolsPage />
}
```

`apps/web/features/platform/index.ts`:

```ts
// OKSİS Platform — feature public API (yalnız rota-seviyesi bileşenler).
export { PlatformLoginScreen } from "./platform-login-screen"
export { PlatformSchoolsPage } from "./platform-schools-page"
```

- [ ] **Step 4: Giriş ekranı**

`apps/web/features/platform/platform-login-screen.tsx`:

```tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { usePlatformLogin } from "@workspace/api"
import { AuthShell } from "@/features/auth"

export function PlatformLoginScreen() {
  const router = useRouter()
  const login = usePlatformLogin()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await login.mutateAsync({ email, password })
      router.replace("/platform/schools")
    } catch {
      setError("E-posta ya da parola hatalı.")
    }
  }

  return (
    <AuthShell>
      <form className="pf-form" onSubmit={submit} noValidate>
        <h1 className="pf-title">Platform girişi</h1>
        <p className="pf-lead">OKSİS personeli içindir. Okul hesabıyla giriş için ana giriş sayfasını kullanın.</p>
        <label className="pf-field">
          <span>E-posta</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="pf-field">
          <span>Parola</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p className="pf-error" role="alert">{error}</p> : null}
        <button type="submit" className="pf-button" disabled={login.isPending}>
          {login.isPending ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>
    </AuthShell>
  )
}
```

- [ ] **Step 5: Okul tanımlama ekranı**

`apps/web/features/platform/platform-schools-page.tsx`:

```tsx
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  PLATFORM_SCHOOL_TYPES,
  useCreatePlatformSchool,
  usePlatformMe,
  usePlatformSchools,
  type CreateSchoolCommand,
} from "@workspace/api"

const INITIAL = {
  name: "",
  code: "",
  type: "HighSchool",
  adminFirstName: "",
  adminLastName: "",
  adminEmail: "",
}

export function PlatformSchoolsPage() {
  const router = useRouter()
  const me = usePlatformMe()
  const schools = usePlatformSchools()
  const create = useCreatePlatformSchool()
  const [form, setForm] = React.useState(INITIAL)
  const [message, setMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (me.isError) router.replace("/platform/login")
  }, [me.isError, router])

  const set = (key: keyof typeof INITIAL) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const body = {
      name: form.name,
      code: form.code,
      type: form.type,
      timeZone: null,
      adminFirstName: form.adminFirstName,
      adminLastName: form.adminLastName,
      adminEmail: form.adminEmail,
    } as unknown as CreateSchoolCommand
    try {
      const result = await create.mutateAsync(body)
      setMessage(`Okul açıldı. Müdüre davet gönderildi; davet ${new Date(result.invitationExpiresAt).toLocaleDateString("tr-TR")} tarihine kadar geçerli.`)
      setForm(INITIAL)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Okul açılamadı.")
    }
  }

  if (me.isPending) return <p className="pf-lead">Yükleniyor…</p>
  if (!me.data) return null

  return (
    <main className="pf-page">
      <header className="pf-header">
        <h1 className="pf-title">Okullar</h1>
        <span className="pf-lead">{me.data.displayName} · {me.data.email}</span>
      </header>

      <section className="pf-card">
        <h2>Yeni okul</h2>
        <form className="pf-form" onSubmit={submit}>
          <label className="pf-field"><span>Okul adı</span><input value={form.name} onChange={set("name")} required maxLength={200} /></label>
          <label className="pf-field"><span>Okul kodu</span><input value={form.code} onChange={set("code")} required minLength={3} maxLength={50} pattern="[A-Za-z0-9-]+" placeholder="ALTINAY" /></label>
          <label className="pf-field"><span>Okul türü</span>
            <select value={form.type} onChange={set("type")}>
              {PLATFORM_SCHOOL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <fieldset className="pf-fieldset">
            <legend>Okul müdürü</legend>
            <label className="pf-field"><span>Ad</span><input value={form.adminFirstName} onChange={set("adminFirstName")} required maxLength={100} /></label>
            <label className="pf-field"><span>Soyad</span><input value={form.adminLastName} onChange={set("adminLastName")} required maxLength={100} /></label>
            <label className="pf-field"><span>E-posta</span><input type="email" value={form.adminEmail} onChange={set("adminEmail")} required /></label>
          </fieldset>
          {message ? <p className="pf-message" role="status">{message}</p> : null}
          <button type="submit" className="pf-button" disabled={create.isPending}>
            {create.isPending ? "Açılıyor…" : "Okulu aç ve müdürü davet et"}
          </button>
        </form>
      </section>

      <section className="pf-card">
        <h2>Kayıtlı okullar</h2>
        {schools.isPending ? <p>Yükleniyor…</p> : null}
        {schools.data?.length === 0 ? <p>Henüz okul yok.</p> : null}
        {schools.data && schools.data.length > 0 ? (
          <table className="pf-table">
            <thead><tr><th>Ad</th><th>Kod</th><th>Tür</th><th>Durum</th><th>Müdür e-postası</th><th>Davet</th></tr></thead>
            <tbody>
              {schools.data.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td><td>{s.code}</td><td>{s.type}</td><td>{s.status}</td>
                  <td>{s.adminEmail ?? "—"}</td><td>{s.invitationStatus ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </main>
  )
}
```

`apps/web/features/platform/platform.css`:

```css
.pf-root { min-height: 100vh; background: #f6f7fb; }
.pf-page { max-width: 960px; margin: 0 auto; padding: 32px 16px; display: grid; gap: 24px; }
.pf-header { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; }
.pf-title { font-size: 24px; font-weight: 600; margin: 0; }
.pf-lead { color: #5b6470; margin: 4px 0 16px; }
.pf-card { background: #fff; border: 1px solid #e3e6ec; border-radius: 12px; padding: 20px; }
.pf-form { display: grid; gap: 12px; }
.pf-field { display: grid; gap: 4px; font-size: 14px; }
.pf-field input, .pf-field select { padding: 8px 10px; border: 1px solid #c9ced8; border-radius: 8px; font: inherit; }
.pf-fieldset { border: 1px solid #e3e6ec; border-radius: 8px; padding: 12px; display: grid; gap: 12px; }
.pf-button { padding: 10px 14px; border: 0; border-radius: 8px; background: #1b2b5e; color: #fff; font: inherit; cursor: pointer; }
.pf-button:disabled { opacity: .6; cursor: default; }
.pf-error { color: #b42318; margin: 0; }
.pf-message { color: #1b2b5e; margin: 0; }
.pf-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.pf-table th, .pf-table td { text-align: left; padding: 8px; border-bottom: 1px solid #e3e6ec; }
```

Görsel cila bu dilimin dışıdır; ekranın işi senaryoyu yürütmektir.

- [ ] **Step 6: "Tüm sezonlar" gösterimi**

```bash
cd ~/Repositories/oksis-ui && grep -rn "seasonName" apps/web/features/invitations apps/web/features/users packages/api/src/invitations packages/core/src | head
```
Her gösterim yerinde `dto.seasonName ?? "Tüm sezonlar"` (adaptörde `season: dto.seasonName ?? "Tüm sezonlar"` gibi tek noktada yapılıyorsa orada). Davet sihirbazında hedef rol `SCHOOL_ADMIN` seçilince sezon alanı zorunlu olmaktan çıkar: sihirbazın sezon doğrulamasını `role.code === "SCHOOL_ADMIN"` ise atla (doğrulama `packages/core/src/invitations` altındaysa oraya, aksi hâlde `apps/web/features/invitations/wizard.tsx`'e).

- [ ] **Step 7: Tip ve test kontrolü**

Run: `pnpm -w typecheck && pnpm --filter @workspace/api test && pnpm --filter web lint`
Expected: hepsi temiz (komut adları `package.json` script'leriyle aynı değilse `pnpm run` listesinden eşdeğerini kullan).

- [ ] **Step 8: Tarayıcıda doğrula**

`pnpm dev` ile `http://localhost:3000/platform/login` → `platform@oksis.local` / `Oksis1234!` → `/platform/schools` açılır → formu doldur → "Okul açıldı" mesajı → listede okul → Mailpit'te davet.

- [ ] **Step 9: Commit (oksis-ui)**

```bash
git add -A
git commit -m "feat(platform): platform girişi ve okul tanımlama ekranı; sezonsuz davetler 'Tüm sezonlar'

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01W8ksrYqz3prgzeNCARapcp"
```

---

### Task 7: Uçtan uca senaryo, bulgu ve belge kapanışı

**Files (yalnız `oksis` deposu):**
- Modify: `docs/bulgular/OKSİS - Bulgu Kayıt Defteri.md` (`E-24`, `TB-162` blokları arşive; `TB-165` notu; başlık ve özet sayıları)
- Modify: `docs/bulgular/OKSİS - Bulgu Arşivi.md` (yeni bölüm: "K-27 ilk dilim kapanışı")
- Modify: `docs/bulgular/OKSİS - Yapısal Kararlar ve Eksikler.md` (`K-27` ilk dilim uygulandı; ilk platform hesabı kararı: appsettings'ten tek seferlik)
- Modify: `docs/domain/kararlar/0020-okul-yoneticisi-sezonsuz-atanir.md` (Uygulama durumu), `docs/domain/kavramlar/Rol Ataması.md`, `Sistem Rolü.md`, `Davet.md`, `Okul.md`; Create: `docs/domain/kavramlar/Platform Hesabı.md` (domain-map skill ile)
- Modify: `docs/teknik/kurallar/ortak/api-sozlesmesi.md` (claim listesi: `token_kind`; `school_id` istisnası "SuperAdmin" yerine platform token'ı), `docs/teknik/mimari/multi-tenant-rules.md` (`TenancyMode.PlatformOnly`)
- Modify: `docs/teknik-analizler/platform-kimligi/super-admin-izleri-envanteri.md` (§6'ya "uygulanan" sütunu: middleware V3 kaldırıldı, `SuperAdminOnly` → `PlatformOnly`, `Required` muafiyeti kalktı)

- [ ] **Step 1: Sıfırdan senaryo — seed'siz okul**

1. `docker compose up -d`; API ve web çalışıyor; Mailpit `http://localhost:8025`.
2. `/platform/login` → giriş → "Altınay Anadolu Lisesi", kod `ALTINAY`, tür Lise, müdür Ayşe Yılmaz `mudur@altinay.test`.
3. Mailpit'te davet e-postasını aç, bağlantıya git (`/invitations/<token>`), parola belirle, KVKK onayı ver.
4. `/login` → `mudur@altinay.test` ile giriş. Beklenen: giriş başarılı, profil "Staff", aktif sezon yok.
5. Gözle ve **defterin §12'sine yaz**: müdür sezonsuz okulda hangi ekranla karşılaşıyor, hangi ekranlar boş sezonda kırılıyor (konsol ve ağ 4xx/5xx'leri), sezon açma ekranına yol var mı, kademeler görünüyor mu (TB-162 kapanışının kanıtı), kurulum sihirbazı yok (bilinen; `OnboardingStatus` okuyan ekran yok).
6. Sezonu müdür olarak aç (`/academic-sessions`); sonra `GetPersonRoleAssignments` (`/users` → müdür → roller) satırında "Tüm sezonlar" görüldüğünü doğrula.

Ölçülen her kırık ayrı `TB-###` olarak açılır (sıradaki sayaç defterin başında); ekran görüntüleri `docs/bulgular/kanit/` altına.

- [ ] **Step 2: Defter ve karar panosu**

- `E-24`: kapandı — okul kaydı yolu var. Bloğu `OKSİS - Bulgu Arşivi.md`'ye taşı (yeni bölüm başlığı "§49 · K-27 ilk dilim — platformdan okul açılışı (2026-09-16)"), kanıt: commit hash'leri, `CreateSchoolCommandHandlerTests`, Mailpit ekran görüntüsü.
- `TB-162`: kapandı — `CreateSchoolCommandHandler` türü ayara yazıp `SeedForSchoolAsync` çağırıyor; test `BeGreaterThan(0)`. Arşive taşı. Not: gerçek `School.Create` olay yolu hâlâ türü taşımıyor (`SchoolCreatedEvent(SchoolId, Name)`); okul açmanın tek üretim yolu bu komut olduğu için kapanış geçerli, olaya tür eklemek 0019 turuna kalır — bu cümleyi arşiv bloğuna yaz.
- `TB-165`: açık kalır; not ekle: "Platform yüzeyi geldi (`/platform/schools`) ama K5 düzenleme ucu hâlâ `SUPER_ADMIN` izninde; 0019 uygulanınca Operasyon rolüne geçer."
- Defter başlığındaki "Son ekleme" satırı ve Özet tablosu güncellenir (kapananlar düşülür, yeni TB'ler eklenir).
- `K-27` Karar Alanı: "İlk platform hesabı: `PlatformBootstrap` ayarından tek seferlik (2026-09-15 kararı)"; Durum: "✅ Karara bağlandı · ilk dilim **uygulandı** (`oksis-api` @ <hash>, `oksis-ui` @ <hash>)"; pano satırı aynı.

- [ ] **Step 3: Domain notları (domain-map skill)**

`domain-map` skill'ini çağır; kapsam: Platform Hesabı (yeni kavram: `PlatformAccount` alias, `platform.accounts` tablosu, okulsuz, tek hesap bootstrap, token türü), Okul (platformdan açılış, `Setup` durumu, tür → kademeler), Davet (sezon boş olabilir, okul-düzeyi rol), Rol Ataması (0020 uygulandı: kural satırı "sezon kimliği zorunlu" kaldırılır, boş = tüm sezonlar), Sistem Rolü (okul-düzeyi rol kümesi `SchoolLevelRoles`). 0020 notunun "Uygulama durumu" bölümü "uygulandı (`oksis-api` @ <hash>)". Skill'in onay adımına uy: yazmadan önce değişiklik listesini sun.

- [ ] **Step 4: Kural belgeleri**

`api-sozlesmesi.md:208` claim listesi: `sub`, `jti`, `school_id`, `perms_ver`, … ve **platform token'ı**: `sub`, `jti`, `token_kind=platform`, `email`; `:246` "Kimliği doğrulanmış her istek `school_id` taşımalıdır. Platform token'ı (`token_kind=platform`) bu kuralın istisnasıdır." `multi-tenant-rules.md:195` enum satırı `{ Required, Optional, PlatformOnly }`; `:179-182` davranış: `Required` platform token'ını reddeder. Envanter §6 tablosuna "Uygulanan (dilim 1)" sütunu.

- [ ] **Step 5: Bellek**

`~/.claude/projects/-Users-farukkaya-Repositories-oksis-api/memory/k-27-ayri-platform-hesabi.md`'ye: ilk dilim uygulandı, giriş bilgileri (`platform@oksis.local` / `Oksis1234!`, `/platform/login`), sezonsuz müdür akışı ölçüldü; `dev-ortam-giris-bilgileri.md`'ye platform satırı.

- [ ] **Step 6: Commit (oksis)**

```bash
cd ~/Repositories/oksis && git add -A
git commit -m "docs(platform): K-27 ilk dilim kapanışı — E-24 ve TB-162 arşive, domain notları, kural belgeleri

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01W8ksrYqz3prgzeNCARapcp"
```

---

## Bilinçli kapsam dışı (bu dilimde YAPILMAZ)

- `SUPER_ADMIN` → `PLATFORM_ADMIN` yeniden adlandırması, Operasyon/Destek rolleri, platform izin modülü, üstlenme (0019 — ertelendi).
- `TB-139` kısa devresinin kaldırılması, `TenantSaveChangesInterceptor` muafiyeti (kendi turunda).
- Platform token'ı için refresh; parola değiştirme; ikinci platform hesabı açma.
- Kurulum sihirbazı ekranı (`OnboardingStatus` okuyan yüz yok — senaryo tam olarak bunu görmek için).
- Okulu `Active`'e çekme (`School.Activate`) — müdürün kurulumu bitirdiğini söyleyecek yüzey yok.
- Eski `UserRole` enum'u ve `POST api/v1/users` (envanter §2.3) — ayrı karar.
- Platform giriş ucunda hız sınırı politikası (okul girişindeki `UseRateLimiter` politikası platform ucuna bağlanmadı) — uygulama sonunda `TB-###` olarak deftere yazılır.
- `identity-dev-seed.sql` silinmesi ve bayat yorumlar (`TB-164`) — küçük temizlik, bu dilime karıştırılmaz.
