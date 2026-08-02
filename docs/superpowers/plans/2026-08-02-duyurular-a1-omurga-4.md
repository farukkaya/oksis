# Duyurular A1 — Omurga Implementation Plan (4/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Bu dosya `2026-08-02-duyurular-a1-omurga.md`'nin devamıdır.** Global Constraints ve dosya
> yapısı orada tanımlıdır. Görev 1–12 tamamlanmış olmalıdır.

**Bu dosyanın kapsamı:** Görev 13–18 — envanter, detay, gelen kutusu, okundu damgası, bildirim zinciri ve uçtan uca duman testi. A1 bu dosyanın sonunda **çalışan yazılım** üretir.

---

### Task 13: `GET /announcements` — envanter, filtre, sayfalama

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncements/GetAnnouncementsQuery.cs`
- Create: `.../GetAnnouncementsQueryHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementsTests.cs`

**Interfaces:**
- Consumes: Task 8 `AnnouncementDto`, Task 12 `AnnouncementMapper`, Task 11 `AnnouncementCallerResolver`
- Produces: `GetAnnouncementsQuery(string? Scope, string? Status, string? Type, string? PublisherId, bool? UrgentOnly, string? Q, int? Page, int? PageSize) : IQuery<PagedResult<AnnouncementDto>>`

> **`scope` üç değer alır:** `school` (tüm okul envanteri), `mine` (yalnız yayınlayan kendisi),
> `archive` (`expired` + `withdrawn`). Öğretmen `school` isterse **403** — filtre değil,
> güvenlik sınırı.

- [ ] **Step 1: Sayfalama zarfını doğrula**

Run:
```bash
cd /Users/farukkaya/Repositories/oksis-api
grep -rn "class PagedResult\|record PagedResult" src/Oksis.Shared src/Oksis.Application | head -3
grep -n "totalCount\|hasNextPage" /Users/farukkaya/Repositories/oksis-ui/packages/api/src/announcements/paths.ts | head -5
```
Expected: Mevcut `PagedResult<T>` tipi ve frontend'in beklediği `items/page/pageSize/totalCount/totalPages/hasPreviousPage/hasNextPage` alanları. Var olanı kullan, yenisini yazma.

- [ ] **Step 2: Failing test yaz**

```csharp
using FluentAssertions;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

public sealed class GetAnnouncementsTests
{
    [Fact]
    public async Task Should_ReturnOnlyOwnRecords_When_ScopeIsMine()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        await fixture.CreateAnnouncementAsync("Yönetici duyurusu", "Yönetim tarafından yayınlandı.",
            [("all", "all", "parent")], asDraft: false);
        await fixture.CreateAnnouncementAsAsync(fixture.TeacherAccountId, "Öğretmen duyurusu",
            "Öğretmen tarafından yayınlandı.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        var mine = await fixture.ListAsync(asAccountId: fixture.TeacherAccountId, scope: "mine");

        mine.Items.Should().ContainSingle().Which.Title.Should().Be("Öğretmen duyurusu");
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_TeacherRequestsSchoolScope()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var act = () => fixture.ListAsync(asAccountId: fixture.TeacherAccountId, scope: "school");

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task Should_ReturnExpiredAndWithdrawnOnly_When_ScopeIsArchive()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        await fixture.CreateAnnouncementAsync("Yayında", "Bu duyuru yayindadir.",
            [("all", "all", "parent")], asDraft: false);
        var expired = await fixture.CreateAnnouncementAsync("Süresi dolan", "Bu duyurunun suresi doldu.",
            [("all", "all", "parent")], asDraft: false);
        await fixture.ForceStatusAsync(Guid.Parse(expired.Id), "expired");

        var archive = await fixture.ListAsync(asAccountId: fixture.AdminAccountId, scope: "archive");

        archive.Items.Should().ContainSingle().Which.Title.Should().Be("Süresi dolan");
    }

    [Fact]
    public async Task Should_MatchTitleAndBody_When_QueryGiven()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        await fixture.CreateAnnouncementAsync("Veli toplantısı", "12 Kasım Salı günü yapılacaktır.",
            [("all", "all", "parent")], asDraft: false);
        await fixture.CreateAnnouncementAsync("Servis saati", "Servisler erken kalkacaktır.",
            [("all", "all", "parent")], asDraft: false);

        var found = await fixture.ListAsync(fixture.AdminAccountId, scope: "school", q: "toplantı");

        found.Items.Should().ContainSingle().Which.Title.Should().Be("Veli toplantısı");
    }

    [Fact]
    public async Task Should_ReturnForbidden_When_ParentRequestsInventory()
    {
        // Velinin announcements.view izni VARDIR ama o izin gelen kutusu içindir.
        // Envanter bir yönetim yüzeyidir: açılsaydı veli okul geneli duyuru listesini,
        // taslakları ve yayınlayan bilgisini görürdü.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var act = () => fixture.ListAsync(asAccountId: fixture.ParentAccountId, scope: "school");

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task Should_CapPageSize_When_ClientAsksForTooMany()
    {
        // Sayfalama gerçek olmalıdır: 200. duyurudan sonrası sessizce kaybolamaz.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var page = await fixture.ListAsync(fixture.AdminAccountId, scope: "school", pageSize: 5000);

        page.PageSize.Should().BeLessThanOrEqualTo(200);
    }
}
```

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementsTests"`
Expected: FAIL — sorgu yok.

- [ ] **Step 4: Query ve handler'ı yaz**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncements;

/// <summary>
/// Duyuru envanteri. <c>scope</c>: <c>school</c> (tüm okul) | <c>mine</c> (yalnız
/// yayınlayan kendisi) | <c>archive</c> (expired + withdrawn). Varsayılan <c>school</c>.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.view")]
public sealed record GetAnnouncementsQuery(
    string? Scope, string? Status, string? Type, string? PublisherId,
    bool? UrgentOnly, string? Q, int? Page, int? PageSize)
    : IQuery<PagedResult<AnnouncementDto>>;
```

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncements;

public sealed class GetAnnouncementsQueryHandler(
    IApplicationDbContext db, ITenantContext tenant, ICurrentUser currentUser,
    IPermissionReader permissionReader)
    : IQueryHandler<GetAnnouncementsQuery, PagedResult<AnnouncementDto>>
{
    private const int DefaultPageSize = 50;
    private const int MaxPageSize = 200;

    public async Task<Result<PagedResult<AnnouncementDto>>> Handle(
        GetAnnouncementsQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<PagedResult<AnnouncementDto>>.Forbidden();
        }

        // Envanter bir YÖNETİM yüzeyidir. Veli ve öğrencide de `announcements.view` izni
        // vardır — ama o izin GELEN KUTUSU içindir. Envanter onlara hiç açılmaz; açılsaydı
        // okul geneli duyuru listesini, taslakları ve yayınlayan bilgisini görürlerdi.
        // İzin ucu açar, bu kontrol yüzeyi ayırır.
        if (!await AnnouncementCallerResolver.CanUseInventoryAsync(permissionReader, cancellationToken))
        {
            return Result<PagedResult<AnnouncementDto>>.Forbidden();
        }

        var scope = request.Scope ?? "school";

        // Yönetim yetkisi yoksa (öğretmen) kapsam kendi kayıtlarına daralır. İzinden
        // sorulur, rolden DEĞİL — IsInRole bu depoda ölü koddur.
        var scopedPublisherId = await AnnouncementCallerResolver.ResolveScopedPublisherIdAsync(
            db, currentUser, permissionReader, cancellationToken);

        var myPersonId = await AnnouncementCallerResolver.ResolveMyPersonIdAsync(
            db, currentUser.Id, cancellationToken) ?? Guid.Empty;

        // Öğretmen okul envanterini GÖREMEZ — bu bir filtre değil güvenlik sınırıdır.
        // announcements.view izni onda vardır ama kapsamı kendi kayıtlarıdır.
        if (scopedPublisherId is not null && scope is "school")
        {
            return Result<PagedResult<AnnouncementDto>>.Forbidden();
        }

        var query = db.Announcements.AsNoTracking().Where(a => a.SchoolId == schoolId);

        query = scope switch
        {
            "mine" => query.Where(a => a.PublisherId == myPersonId),
            "archive" => query.Where(a => a.Status == AnnouncementStatus.Expired
                || a.Status == AnnouncementStatus.Withdrawn),
            _ => query,
        };

        if (scopedPublisherId is { } tid && scope is not "mine")
        {
            query = query.Where(a => a.PublisherId == tid);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = AnnouncementEnumWire.ParseStatus(request.Status);
            query = query.Where(a => a.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Type))
        {
            var type = AnnouncementEnumWire.ParseType(request.Type);
            query = query.Where(a => a.Type == type);
        }

        if (!string.IsNullOrWhiteSpace(request.PublisherId)
            && Guid.TryParse(request.PublisherId, out var publisherId))
        {
            query = query.Where(a => a.PublisherId == publisherId);
        }

        if (request.UrgentOnly is true)
        {
            query = query.Where(a => a.Urgent);
        }

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var q = request.Q.Trim();
            query = query.Where(a => EF.Functions.Like(a.Title, $"%{q}%")
                || EF.Functions.Like(a.Body, $"%{q}%"));
        }

        var page = Math.Max(1, request.Page ?? 1);
        var pageSize = Math.Clamp(request.PageSize ?? DefaultPageSize, 1, MaxPageSize);

        var totalCount = await query.CountAsync(cancellationToken);

        // Sabitlenenler üstte, sonra yayın anına göre yeniden eskiye; taslaklarda
        // PublishedAt null olduğu için oluşturulma anı yedek sıralamadır.
        var rows = await query
            .OrderByDescending(a => a.Pinned)
            .ThenByDescending(a => a.PublishedAt ?? a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var ids = rows.Select(a => a.Id).ToList();

        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => ids.Contains(t.AnnouncementId))
            .ToListAsync(cancellationToken);

        var seenCounts = await db.AnnouncementRecipients.AsNoTracking()
            .Where(r => ids.Contains(r.AnnouncementId) && r.IsRead)
            .GroupBy(r => r.AnnouncementId)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count, cancellationToken);

        var items = rows.Select(a => AnnouncementMapper.ToDto(
            a,
            targets.Where(t => t.AnnouncementId == a.Id).ToList(),
            isRead: null,
            childIds: [],
            seenCount: a.PublishedAt is null ? null : seenCounts.GetValueOrDefault(a.Id, 0))).ToList();

        // PagedResult'ın konumsal yapıcısı YOKTUR — yalnız init-only property'ler
        // (src/Oksis.Shared/PagedResult.cs). TotalPages/HasPreviousPage/HasNextPage
        // hesaplanmış property'lerdir, verilmez.
        return Result<PagedResult<AnnouncementDto>>.Success(
            new PagedResult<AnnouncementDto>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
            });
    }
}
```

- [ ] **Step 5: `AnnouncementEnumWire`'a parse metotlarını ekle**

Task 8'de yazdığın dosyaya:

```csharp
    public static AnnouncementStatus ParseStatus(string wire) => wire switch
    {
        "draft" => AnnouncementStatus.Draft,
        "scheduled" => AnnouncementStatus.Scheduled,
        "pendingApproval" => AnnouncementStatus.PendingApproval,
        "published" => AnnouncementStatus.Published,
        "expired" => AnnouncementStatus.Expired,
        "withdrawn" => AnnouncementStatus.Withdrawn,
        "archived" => AnnouncementStatus.Archived,
        _ => throw new ArgumentOutOfRangeException(nameof(wire), wire, "Bilinmeyen duyuru statüsü."),
    };

    public static AnnouncementType ParseType(string wire) => wire switch
    {
        "institutional" => AnnouncementType.Institutional,
        "classroom" => AnnouncementType.Classroom,
        _ => throw new ArgumentOutOfRangeException(nameof(wire), wire, "Bilinmeyen duyuru türü."),
    };
```

- [ ] **Step 6: Controller'a ucu ekle**

```csharp
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AnnouncementDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(
        [FromQuery] string? scope, [FromQuery] string? status, [FromQuery] string? type,
        [FromQuery] string? publisherId, [FromQuery] bool? urgentOnly, [FromQuery] string? q,
        [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetAnnouncementsQuery(scope, status, type, publisherId, urgentOnly, q, page, pageSize),
            cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 7: Testleri çalıştır ve commit**

Run: `docker compose up -d && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementsTests"`
Expected: PASS (6 test)

```bash
dotnet format
git add src/Oksis.Application/Modules/Announcements/ src/Oksis.Api/ tests/
git commit -m "feat(announcements): envanter listesi, filtreler ve sayfalama eklendi

Ogretmen scope=school isterse 403 doner: announcements.view izni onda
vardir ama kapsami kendi kayitlaridir — bu bir filtre degil guvenlik
sinirdir. pageSize 200'e clamp edilir; sabit 200 limiti 200. duyurudan
sonrasini sessizce kaybediyordu."
```

---

### Task 14: `GET /announcements/{id}`

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementById/GetAnnouncementByIdQuery.cs`
- Create: `.../GetAnnouncementByIdQueryHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementByIdTests.cs`

**Interfaces:**
- Produces: `GetAnnouncementByIdQuery(Guid Id) : IQuery<AnnouncementDto>`

> **Çift kural:** çağıran yönetim/yayınlayan ise tam kayıt döner. Çağıran yalnızca ALICI ise
> gelen kutusu kuralı uygulanır — yalnız `published`/`expired` görünür (INV-7) ve `isRead`
> dolu gelir. Geri çekilmiş duyuru alıcıya **404** döner, "kaldırıldı" bile denmez.

- [ ] **Step 1: Failing test yaz**

```csharp
using FluentAssertions;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

public sealed class GetAnnouncementByIdTests
{
    [Fact]
    public async Task Should_ReturnFullRecord_When_CallerIsAdmin()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var created = await fixture.CreateAnnouncementAsync("Servis", "Servisler erken kalkacaktir.",
            [("all", "all", "parent")], asDraft: false);

        var dto = await fixture.GetByIdAsync(fixture.AdminAccountId, Guid.Parse(created.Id));

        dto.Title.Should().Be("Servis");
        dto.IsRead.Should().BeNull("yönetim yüzeyinde okuyucu diye bir taraf yoktur");
        dto.RecipientCount.Should().NotBeNull();
    }

    [Fact]
    public async Task Should_CarryIsRead_When_CallerIsRecipient()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var created = await fixture.CreateAnnouncementAsync("Servis", "Servisler erken kalkacaktir.",
            [("all", "all", "parent")], asDraft: false);

        var dto = await fixture.GetByIdAsync(fixture.ParentAccountId, Guid.Parse(created.Id));

        dto.IsRead.Should().BeFalse();
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_RecipientRequestsWithdrawnAnnouncement()
    {
        // INV-7: geri çekilen duyuru okuyucu yüzeyinde HİÇ bulunmaz.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var created = await fixture.CreateAnnouncementAsync("Yanlış duyuru", "Bu duyuru hatalidir.",
            [("all", "all", "parent")], asDraft: false);
        await fixture.ForceStatusAsync(Guid.Parse(created.Id), "withdrawn");

        var act = () => fixture.GetByIdAsync(fixture.ParentAccountId, Guid.Parse(created.Id));

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_CallerIsNeitherRecipientNorPublisher()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var created = await fixture.CreateAnnouncementAsync("Veli duyurusu", "Yalniz velilere gonderildi.",
            [("all", "all", "parent")], asDraft: false);

        var act = () => fixture.GetByIdAsync(fixture.UnrelatedStudentAccountId, Guid.Parse(created.Id));

        await act.Should().ThrowAsync<Exception>();
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementByIdTests"`
Expected: FAIL

- [ ] **Step 3: Query ve handler'ı yaz**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementById;

/// <summary>
/// Duyuru detayı. <c>announcements.view</c> izni yedi rolün tamamında vardır — veli ve
/// öğrenci de kendi duyurusunu okur. İzin ucu AÇAR; hangi kaydı göreceğini handler'daki
/// alıcı/yayınlayan eşleşmesi belirler.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.view")]
public sealed record GetAnnouncementByIdQuery(Guid Id) : IQuery<AnnouncementDto>;
```

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementById;

/// <summary>
/// İki görünürlük kuralı tek uçta: yönetim/yayınlayan tam kaydı görür, ALICI ise gelen
/// kutusu kuralına tabidir (yalnız published + expired — INV-7).
///
/// <para>Geri çekilmiş duyuru alıcıya <b>404</b> döner; "kaldırıldı" bile denmez.
/// İhtiyaç analizi §16.3: "sessizce kaybolsun; yanlış duyurunun izinin alıcıda kalması
/// kafa karıştırır. İz yönetim tarafında tutulur."</para>
/// </summary>
public sealed class GetAnnouncementByIdQueryHandler(
    IApplicationDbContext db, ITenantContext tenant, ICurrentUser currentUser,
    IPermissionReader permissionReader)
    : IQueryHandler<GetAnnouncementByIdQuery, AnnouncementDto>
{
    private static readonly AnnouncementStatus[] ReaderVisible =
        [AnnouncementStatus.Published, AnnouncementStatus.Expired];

    public async Task<Result<AnnouncementDto>> Handle(
        GetAnnouncementByIdQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var announcement = await db.Announcements.AsNoTracking()
            .SingleOrDefaultAsync(a => a.Id == request.Id && a.SchoolId == schoolId, cancellationToken);

        if (announcement is null)
        {
            return Result<AnnouncementDto>.NotFound();
        }

        var myPersonId = await AnnouncementCallerResolver.ResolveMyPersonIdAsync(
            db, currentUser.Id, cancellationToken) ?? Guid.Empty;

        var myRow = await db.AnnouncementRecipients.AsNoTracking()
            .Where(r => r.AnnouncementId == announcement.Id && r.PersonId == myPersonId)
            .Select(r => new { r.IsRead, r.ChildPersonId })
            .FirstOrDefaultAsync(cancellationToken);

        // Sahiplik VEYA yönetim yetkisi — Attendance'ın `isOwner || HasPermissionAsync(manage)`
        // kalıbının birebir karşılığı (GetSessionRosterQueryHandler:30-40). Rol kontrolü
        // YAPILMAZ: IsInRole bu depoda ölü koddur (JWT'ye ClaimTypes.Role claim'i hiç
        // yazılmaz), sessizce false döner ve yöneticiyi okuyucu sanırdı.
        var isPublisher = announcement.PublisherId == myPersonId;
        var canSeeFullRecord = isPublisher
            || await AnnouncementCallerResolver.IsManagerAsync(permissionReader, cancellationToken);

        if (!canSeeFullRecord)
        {
            // Alıcı değilse ya da okuyucuya kapalı bir statüdeyse duyuru HİÇ YOKTUR.
            if (myRow is null || !ReaderVisible.Contains(announcement.Status))
            {
                return Result<AnnouncementDto>.NotFound();
            }
        }

        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => t.AnnouncementId == announcement.Id)
            .ToListAsync(cancellationToken);

        var seenCount = announcement.PublishedAt is null
            ? (int?)null
            : await db.AnnouncementRecipients.AsNoTracking()
                .CountAsync(r => r.AnnouncementId == announcement.Id && r.IsRead, cancellationToken);

        return Result<AnnouncementDto>.Success(AnnouncementMapper.ToDto(
            announcement, targets,
            isRead: canSeeFullRecord ? null : myRow!.IsRead,
            childIds: myRow?.ChildPersonId is { } childId ? [childId] : [],
            seenCount: canSeeFullRecord ? seenCount : null));
    }
}
```

- [ ] **Step 4: `Result<T>.NotFound()` varlığını doğrula**

Run: `grep -n "NotFound\|Forbidden" src/Oksis.Shared/Result.cs | head`
Expected: İkisi de var. Yoksa mevcut hata kalıbını kullan (`Result<T>.Failure(new Error("...NotFound", "..."))`).

- [ ] **Step 5: Controller'a ucu ekle**

```csharp
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnnouncementByIdQuery(id), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 6: Testleri çalıştır ve commit**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementByIdTests"`
Expected: PASS (4 test)

```bash
dotnet format
git add src/Oksis.Application/Modules/Announcements/ src/Oksis.Api/ tests/
git commit -m "feat(announcements): duyuru detay ucu eklendi

Iki gorunurluk kurali tek ucta: yonetim/yayinlayan tam kaydi gorur,
alici gelen kutusu kuralina tabidir (INV-7). Geri cekilen duyuru
aliciya 404 doner, 'kaldirildi' bile denmez — iz yonetim tarafinda
tutulur (ihtiyac analizi §16.3)."
```

---

### Task 15: `GET /announcements/inbox` — self-only

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementInbox/GetAnnouncementInboxQuery.cs`
- Create: `.../GetAnnouncementInboxQueryHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementInboxTests.cs`

**Interfaces:**
- Produces: `GetAnnouncementInboxQuery(Guid? ChildId) : IQuery<IReadOnlyList<AnnouncementDto>>`

> **Bu ucun tamamı bir güvenlik sınırıdır.** Sorgu `AnnouncementRecipient`'tan yürür,
> `Announcement`'tan değil. İzin özniteliği **taşımaz** — veli/öğrenci `announcements.view`
> iznine sahip değildir; sınır alıcı satırı eşleşmesidir.

- [ ] **Step 1: Failing test yaz**

```csharp
using FluentAssertions;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

public sealed class GetAnnouncementInboxTests
{
    [Fact]
    public async Task Should_ReturnOnlyMyRows_When_ParentReadsInbox()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        await fixture.CreateAnnouncementAsync("9-A velilerine", "Sinav takvimi guncellendi.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        var inbox = await fixture.InboxAsync(fixture.PrimaryParentAccountId);

        inbox.Should().BeEmpty("ilkokul velisi 9-A duyurusunun alıcısı değildir");
    }

    [Fact]
    public async Task Should_ExcludeWithdrawn_When_InboxRead()
    {
        // INV-7: geri çekilen duyuru gelen kutusunda HİÇ bulunmaz.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var created = await fixture.CreateAnnouncementAsync("Yanlış", "Bu duyuru hatalidir.",
            [("all", "all", "parent")], asDraft: false);
        await fixture.ForceStatusAsync(Guid.Parse(created.Id), "withdrawn");

        var inbox = await fixture.InboxAsync(fixture.ParentAccountId);

        inbox.Should().BeEmpty();
    }

    [Fact]
    public async Task Should_IncludeExpired_When_InboxRead()
    {
        // Süresi dolan duyuru arşive iner ama okunabilir kalır.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var created = await fixture.CreateAnnouncementAsync("Eski duyuru", "Suresi dolmus duyuru.",
            [("all", "all", "parent")], asDraft: false);
        await fixture.ForceStatusAsync(Guid.Parse(created.Id), "expired");

        var inbox = await fixture.InboxAsync(fixture.ParentAccountId);

        inbox.Should().ContainSingle().Which.Status.Should().Be("expired");
    }

    [Fact]
    public async Task Should_ShowSchoolWideOnce_When_ParentHasTwoChildren()
    {
        // DYR-F-20: üç çocuklu veli okul geneli duyuruyu TEK kez görür.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        await fixture.CreateAnnouncementAsync("Okul geneli", "Tum velilere gonderildi.",
            [("all", "all", "parent")], asDraft: false);

        var inbox = await fixture.InboxAsync(fixture.TwoChildParentAccountId);

        inbox.Should().ContainSingle();
    }

    [Fact]
    public async Task Should_FilterByChild_When_ChildIdGiven()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        await fixture.CreateAnnouncementAsync("9-A velilerine", "Sube duyurusu.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        var otherChild = fixture.PrimaryStudentIds[0];
        var inbox = await fixture.InboxAsync(fixture.TwoChildParentAccountId, childId: otherChild);

        inbox.Should().BeEmpty("bu çocuk 9-A'da değildir");
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementInboxTests"`
Expected: FAIL

- [ ] **Step 3: Query ve handler'ı yaz**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementInbox;

/// <summary>
/// Veli/öğrenci gelen kutusu. <c>ChildId</c> yalnız velide anlamlıdır; verilmezse
/// tüm çocuklar ("Tümü" — mobil varsayılanı).
///
/// <para><b>İki katmanlı sınır.</b> <c>announcements.view</c> izni ucu AÇAR — veli ve
/// öğrenci de bu izne sahiptir. HANGİ satırları göreceğini ise self-only alıcı eşleşmesi
/// belirler: sorgu <c>AnnouncementRecipient</c>'tan yürür ve <c>PersonId</c> ile kesilir.
/// Biri diğerinin yerine geçmez.</para>
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.view")]
public sealed record GetAnnouncementInboxQuery(Guid? ChildId) : IQuery<IReadOnlyList<AnnouncementDto>>;
```

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementInbox;

/// <summary>
/// Gelen kutusu — okuyucu yüzeyi. Sorgu <c>AnnouncementRecipient</c>'tan YÜRÜR,
/// <c>Announcement</c>'tan değil: hedef listesi üzerinden istemci tarafında daraltma
/// YAPILMAZ (§4 self-only kuralı).
///
/// <para>Yalnız <c>published</c> + <c>expired</c> döner (INV-7) — geri çekilen duyuru
/// bu yüzeyde HİÇ bulunmaz.</para>
/// </summary>
public sealed class GetAnnouncementInboxQueryHandler(
    IApplicationDbContext db, ITenantContext tenant, ICurrentUser currentUser)
    : IQueryHandler<GetAnnouncementInboxQuery, IReadOnlyList<AnnouncementDto>>
{
    private static readonly AnnouncementStatus[] Visible =
        [AnnouncementStatus.Published, AnnouncementStatus.Expired];

    public async Task<Result<IReadOnlyList<AnnouncementDto>>> Handle(
        GetAnnouncementInboxQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<IReadOnlyList<AnnouncementDto>>.Forbidden();
        }

        var myPersonId = await AnnouncementCallerResolver.ResolveMyPersonIdAsync(
            db, currentUser.Id, cancellationToken);

        if (myPersonId is null)
        {
            // Bağlı kişisi olmayan hesabın gelen kutusu boştur — hata değil.
            return Result<IReadOnlyList<AnnouncementDto>>.Success([]);
        }

        var rows = await (
            from r in db.AnnouncementRecipients.AsNoTracking()
            join a in db.Announcements.AsNoTracking() on r.AnnouncementId equals a.Id
            where r.SchoolId == schoolId
                && r.PersonId == myPersonId.Value
                && Visible.Contains(a.Status)
                && (request.ChildId == null
                    || r.ChildPersonId == null
                    || r.ChildPersonId == request.ChildId)
            orderby a.Pinned descending, a.PublishedAt descending
            select new { Announcement = a, r.IsRead, r.ChildPersonId })
            .ToListAsync(cancellationToken);

        var ids = rows.Select(x => x.Announcement.Id).ToList();
        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => ids.Contains(t.AnnouncementId))
            .ToListAsync(cancellationToken);

        var items = rows.Select(x => AnnouncementMapper.ToDto(
            x.Announcement,
            targets.Where(t => t.AnnouncementId == x.Announcement.Id).ToList(),
            isRead: x.IsRead,
            // Boş dizi "tüm çocuklar" demektir — okul geneli duyuruda ChildPersonId null
            // bırakıldığı için üç çocuklu veli duyuruyu üç kez GÖRMEZ (DYR-F-20).
            childIds: x.ChildPersonId is { } c ? [c] : [],
            seenCount: null)).ToList();

        return Result<IReadOnlyList<AnnouncementDto>>.Success(items);
    }
}
```

- [ ] **Step 4: Controller'a ucu ekle**

```csharp
    [HttpGet("inbox")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AnnouncementDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetInboxAsync(
        [FromQuery] Guid? childId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnnouncementInboxQuery(childId), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
}
```

- [ ] **Step 5: Testleri çalıştır ve commit**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementInboxTests"`
Expected: PASS (6 test)

```bash
dotnet format
git add src/Oksis.Application/Modules/Announcements/ src/Oksis.Api/ tests/
git commit -m "feat(announcements): gelen kutusu ucu eklendi (self-only)

Sorgu AnnouncementRecipient'tan yurur, Announcement'tan degil: hedef
listesi uzerinden istemci daraltmasi yapilmaz. Izin oznitelik TASIMAZ
cunku veli/ogrenci announcements.view iznine sahip degildir; sinir
alici satiri eslesmesidir. Yalniz published + expired doner (INV-7)."
```

---

### Task 16: `POST /{id}:read` — okundu damgası

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Commands/MarkAnnouncementRead/MarkAnnouncementReadCommand.cs`
- Create: `.../MarkAnnouncementReadCommandHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/MarkAnnouncementReadTests.cs`

**Interfaces:**
- Produces: `MarkAnnouncementReadCommand(Guid Id) : ICommand<AnnouncementDto>`

- [ ] **Step 1: Failing test yaz**

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

public sealed class MarkAnnouncementReadTests
{
    [Fact]
    public async Task Should_MarkOnlyOwnRow_When_RecipientReads()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var created = await fixture.CreateAnnouncementAsync("Servis", "Servisler erken kalkacaktir.",
            [("all", "all", "parent")], asDraft: false);

        await fixture.MarkReadAsync(fixture.ParentAccountId, Guid.Parse(created.Id));

        var rows = await fixture.Db.AnnouncementRecipients
            .Where(r => r.AnnouncementId == Guid.Parse(created.Id)).ToListAsync();

        rows.Count(r => r.IsRead).Should().Be(1, "yalnız çağıranın kendi satırı işaretlenir");
    }

    [Fact]
    public async Task Should_BeIdempotent_When_ReadTwice()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var created = await fixture.CreateAnnouncementAsync("Servis", "Servisler erken kalkacaktir.",
            [("all", "all", "parent")], asDraft: false);

        await fixture.MarkReadAsync(fixture.ParentAccountId, Guid.Parse(created.Id));
        var first = await fixture.Db.AnnouncementRecipients
            .Where(r => r.AnnouncementId == Guid.Parse(created.Id) && r.IsRead)
            .Select(r => r.ReadAt).SingleAsync();

        fixture.Db.ChangeTracker.Clear();
        await fixture.MarkReadAsync(fixture.ParentAccountId, Guid.Parse(created.Id));
        var second = await fixture.Db.AnnouncementRecipients
            .Where(r => r.AnnouncementId == Guid.Parse(created.Id) && r.IsRead)
            .Select(r => r.ReadAt).SingleAsync();

        second.Should().Be(first);
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_CallerIsNotARecipient()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();
        var created = await fixture.CreateAnnouncementAsync("Veli duyurusu", "Yalniz velilere.",
            [("all", "all", "parent")], asDraft: false);

        var act = () => fixture.MarkReadAsync(fixture.UnrelatedStudentAccountId, Guid.Parse(created.Id));

        await act.Should().ThrowAsync<Exception>();
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~MarkAnnouncementReadTests"`
Expected: FAIL

- [ ] **Step 3: Komut ve handler'ı yaz**

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.MarkAnnouncementRead;

/// <summary>
/// Okundu damgası. Duyuru AÇILDIĞINDA çağrılır — ayrı bir "okudum" eylemi değildir
/// (o V2'dedir, KR-02). <c>announcements.view</c> ucu açar; hangi satırın işaretleneceğini
/// self-only eşleşmesi belirler — sorgu <c>PersonId</c> ile kesilir, id ile değil.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.view")]
public sealed record MarkAnnouncementReadCommand(Guid Id) : ICommand<AnnouncementDto>;
```

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Common;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.MarkAnnouncementRead;

/// <summary>
/// Yalnız ÇAĞIRANIN KENDİ alıcı satırını işaretler (§4 self-only). Başkasının satırını
/// işaretleme yolu yoktur — sorgu <c>PersonId</c> ile kesilir, id ile değil.
/// </summary>
public sealed class MarkAnnouncementReadCommandHandler(
    IApplicationDbContext db, ITenantContext tenant, ICurrentUser currentUser, IDateTimeProvider clock)
    : ICommandHandler<MarkAnnouncementReadCommand, AnnouncementDto>
{
    public async Task<Result<AnnouncementDto>> Handle(
        MarkAnnouncementReadCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var myPersonId = await AnnouncementCallerResolver.ResolveMyPersonIdAsync(
            db, currentUser.Id, cancellationToken);

        if (myPersonId is null)
        {
            return Result<AnnouncementDto>.NotFound();
        }

        var row = await db.AnnouncementRecipients
            .SingleOrDefaultAsync(
                r => r.AnnouncementId == request.Id
                    && r.PersonId == myPersonId.Value
                    && r.SchoolId == schoolId,
                cancellationToken);

        if (row is null)
        {
            // Alıcı olmayan için duyuru YOKTUR — "yetkin yok" demek varlığını sızdırır.
            return Result<AnnouncementDto>.NotFound();
        }

        row.MarkRead(clock.UtcNow); // idempotent
        await db.SaveChangesAsync(cancellationToken);

        var announcement = await db.Announcements.AsNoTracking()
            .SingleAsync(a => a.Id == request.Id, cancellationToken);

        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => t.AnnouncementId == request.Id)
            .ToListAsync(cancellationToken);

        return Result<AnnouncementDto>.Success(AnnouncementMapper.ToDto(
            announcement, targets, isRead: true,
            childIds: row.ChildPersonId is { } c ? [c] : [],
            seenCount: null));
    }
}
```

- [ ] **Step 4: Controller'a ucu ekle**

Lifecycle fiili iki nokta ile ifade edilir; ASP.NET route şablonunda `:` literal karakterdir:

```csharp
    [HttpPost("{id:guid}:read")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkReadAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new MarkAnnouncementReadCommand(id), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 5: İki nokta içeren rotanın çalıştığını doğrula**

Run:
```bash
dotnet run --project src/Oksis.Api &
sleep 8
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Authorization: Bearer $PARENT_TOKEN" \
  "http://localhost:5000/api/v1/announcements/$ANNOUNCEMENT_ID:read"
```
Expected: `200`. **404 alırsan** route şablonu `:` karakterini yutuyordur — `[HttpPost("{id}:read")]`
(constraint'siz) dene ve handler'da `Guid.Parse` yap. Kontrat bu yolu gerektirir, değiştirme.

- [ ] **Step 6: Testleri çalıştır ve commit**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~MarkAnnouncementReadTests"`
Expected: PASS (3 test)

```bash
dotnet format
git add src/Oksis.Application/Modules/Announcements/ src/Oksis.Api/ tests/
git commit -m "feat(announcements): okundu damgasi ucu eklendi (self-only)

Sorgu PersonId ile kesilir, id ile degil: baskasinin satirini
isaretleme yolu yoktur. Alici olmayana 404 doner — 'yetkin yok' demek
duyurunun varligini sizdirirdi. MarkRead idempotenttir, okuma ekrani
her acilista cagirir."
```

---

### Task 17: Bildirim zinciri

**Files:**
- Modify: `src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs`
- Modify: `src/Oksis.Application/Modules/Notifications/Abstractions/INotificationRecipientResolver.cs`
- Modify: `src/Oksis.Infrastructure/Notifications/NotificationRecipientResolver.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Events/Notifications/AnnouncementPublishedNotificationHandler.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/ResolvePersonAccountsMapTests.cs`

**Interfaces:**
- Produces:
  - `NotificationKind.AnnouncementPublished` (yeni değer — **mevcut değerlerin SONUNA**, araya ekleme)
  - `INotificationRecipientResolver.ResolvePersonAccountsMapAsync(Guid schoolId, IReadOnlyList<Guid> personIds, CancellationToken ct) → Task<IReadOnlyDictionary<Guid, Guid>>`

> A2/A3 kalan 6 `NotificationKind` değerini (`Withdrawn`, `Amended`, `SubmittedForApproval`,
> `Approved`, `Rejected`, `ScheduledExecuted`) kendi görevlerinde ekleyecektir. A1 yalnız
> `AnnouncementPublished`'ı ekler.

- [ ] **Step 1: Mevcut son enum değerini oku**

Run: `cat src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs`
Expected: 15 değer. Yeni değeri **en büyük mevcut değer + 1** olarak ekle; araya ekleme
kalıcı bildirim kayıtlarını bozar.

- [ ] **Step 2: Failing test yaz**

```csharp
using FluentAssertions;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

public sealed class ResolvePersonAccountsMapTests
{
    [Fact]
    public async Task Should_MapMixedRoles_When_PersonIdsSpanThreeRoles()
    {
        // Duyuru "tüm okul" hedefiyle öğretmen + öğrenci + veliyi birden kapsar;
        // mevcut resolver metotları yalnız dar hâlleri biliyordu.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var personIds = fixture.AllParentIds
            .Concat(fixture.HighSchoolStudentIds)
            .Append(fixture.TeacherPersonId)
            .ToList();

        var map = await fixture.RecipientResolver.ResolvePersonAccountsMapAsync(
            fixture.SchoolId, personIds, CancellationToken.None);

        map.Keys.Should().BeSubsetOf(personIds);
        map.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Should_ExcludePeopleWithoutLinkedAccount_When_Mapped()
    {
        // Guardian resolver'larıyla AYNI ilke: bağlı hesabı olmayan kişi dışlanır.
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var map = await fixture.RecipientResolver.ResolvePersonAccountsMapAsync(
            fixture.SchoolId, [fixture.PersonWithoutAccountId], CancellationToken.None);

        map.Should().BeEmpty();
    }

    [Fact]
    public async Task Should_UseSingleQuery_When_ManyPersonIdsGiven()
    {
        // N+1 sigortası: metot toplu çalışmalıdır (bkz. ResolveGuardianAccountsMapAsync yorumu).
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var many = Enumerable.Range(0, 100).Select(_ => Guid.NewGuid())
            .Concat(fixture.AllParentIds).ToList();

        var map = await fixture.RecipientResolver.ResolvePersonAccountsMapAsync(
            fixture.SchoolId, many, CancellationToken.None);

        map.Count.Should().Be(fixture.AllParentIds.Count);
    }
}
```

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ResolvePersonAccountsMapTests"`
Expected: FAIL — metot yok.

- [ ] **Step 4: Arayüze metodu ekle**

`INotificationRecipientResolver.cs`:

```csharp
    /// <summary>
    /// Rol ayrımı YAPMAYAN genel <c>Person.Id → Account.Id</c> çevirisi. Duyuru "tüm okul"
    /// hedefiyle öğretmen + öğrenci + veliyi birden kapsar; mevcut metotlar yalnız dar
    /// hâlleri (veli/öğretmen/şube/idare) bilir.
    ///
    /// <para>Bağlı hesabı olmayan kişiler DIŞLANIR — guardian resolver'larıyla aynı ilke.
    /// TEK toplu sorgudur (N+1 için bkz. <see cref="ResolveGuardianAccountsMapAsync"/>).</para>
    /// </summary>
    Task<IReadOnlyDictionary<Guid, Guid>> ResolvePersonAccountsMapAsync(
        Guid schoolId, IReadOnlyList<Guid> personIds, CancellationToken ct);
```

- [ ] **Step 5: Implementasyonu ekle**

`NotificationRecipientResolver.cs`:

```csharp
    public async Task<IReadOnlyDictionary<Guid, Guid>> ResolvePersonAccountsMapAsync(
        Guid schoolId, IReadOnlyList<Guid> personIds, CancellationToken ct)
    {
        if (personIds.Count == 0)
        {
            return new Dictionary<Guid, Guid>();
        }

        return await db.Persons.AsNoTracking()
            .Where(p => p.SchoolId == schoolId
                && personIds.Contains(p.Id)
                && p.LinkedAccountId != null)
            .ToDictionaryAsync(p => p.Id, p => p.LinkedAccountId!.Value, ct);
    }
```

- [ ] **Step 6: `NotificationKind`'a değeri ekle**

Step 1'de okuduğun en büyük değerin bir fazlasıyla:

```csharp
    /// <summary>
    /// Duyuru yayınlandı. Acil duyuruda bildirim başlığı "Acil duyuru: …" ön eki alır;
    /// TESLİM DAVRANIŞI DEĞİŞMEZ — bu depoda öncelik kavramı ve gönderim anında sessiz
    /// saat kontrolü yoktur (bkz. spec §8.3). Olay `Urgent` alanını taşır, böylece teslim
    /// kanalları geldiğinde handler değişmeden bağlanabilir.
    /// </summary>
    AnnouncementPublished = 16, // mevcut en büyük değer 15; Step 1'de teyit et
```

- [ ] **Step 7: Bildirim handler'ını yaz**

```csharp
using MediatR;
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Events;
using Oksis.Application.Common.Utilities;
using Oksis.Application.Modules.Notifications.Abstractions;
using Oksis.Domain.Modules.Announcements.Events;
using Oksis.Domain.Modules.Notifications.Enums;

namespace Oksis.Application.Modules.Announcements.Events.Notifications;

/// <summary>
/// Duyuru yayınlandığında alıcılara in-app bildirim fan-out eder.
///
/// <para><b>Teslim sınırı:</b> bugün yalnız <c>InAppNotificationChannel</c> kayıtlıdır ve
/// mobilde <c>expo-notifications</c> kurulu değildir. Yani duyuru "yayınlanır" ama alıcı
/// uygulamayı kendisi açmazsa telefonuna DÜŞMEZ. Bu bilinçli bir MVP sınırıdır
/// (spec 2026-08-02 §16); push zinciri geldiğinde bu handler değişmez, kanal eklenir.</para>
///
/// <para>Alıcılar <c>AnnouncementRecipient</c>'tan okunur — fan-out duyuru modülünde
/// yapıldığı için ayrı bir <c>AnnouncementTargetResolver</c>'a GEREK YOKTUR.</para>
/// </summary>
public sealed class AnnouncementPublishedNotificationHandler(
    IApplicationDbContext db,
    INotificationRecipientResolver resolver,
    INotificationEnqueuer enqueuer)
    : INotificationHandler<DomainEventNotification<AnnouncementPublishedEvent>>
{
    public async Task Handle(
        DomainEventNotification<AnnouncementPublishedEvent> notification, CancellationToken cancellationToken)
    {
        var e = notification.DomainEvent;

        var personIds = await db.AnnouncementRecipients.AsNoTracking()
            .Where(r => r.SchoolId == e.SchoolId && r.AnnouncementId == e.AnnouncementId)
            .Select(r => r.PersonId)
            .ToListAsync(cancellationToken);

        if (personIds.Count == 0)
        {
            return;
        }

        // Tek toplu çeviri — alıcı başına ayrı resolver çağrısı N+1 üretirdi.
        var accountMap = await resolver.ResolvePersonAccountsMapAsync(
            e.SchoolId, personIds, cancellationToken);

        if (accountMap.Count == 0)
        {
            return;
        }

        var eventId = DeterministicGuid.Combine(e.SchoolId, e.AnnouncementId, "ANNOUNCEMENT_PUBLISHED");

        // Bildirim duyuru DETAYINA gider, ara listeye düşmez (DYR-F-18).
        var deepLink = $"/announcements/{e.AnnouncementId}";

        enqueuer.Enqueue(
            eventId, e.SchoolId, NotificationKind.AnnouncementPublished,
            e.Urgent ? $"Acil duyuru: {e.Title}" : e.Title,
            "Okul yönetimi yeni bir duyuru yayınladı.",
            deepLink,
            accountMap.Values.Distinct().ToList());
    }
}
```

- [ ] **Step 8: `INotificationEnqueuer.Enqueue` imzasını teyit et**

Run: `grep -rn -A12 "interface INotificationEnqueuer" src/Oksis.Application`

**Doğrulanmış (2026-08-02):** imza tam olarak yukarıda kullanılan sıradadır ve **öncelik
parametresi YOKTUR**:

```csharp
void Enqueue(Guid eventId, Guid schoolId, NotificationKind kind,
    string title, string body, string? deepLink, IReadOnlyList<Guid> recipientAccountIds);
```

Senkrondur (`void`, `Task` değil) ve alıcılar `IReadOnlyList<Guid>` hesap kimlikleridir.
**Öncelik/sessiz saat için parametre arama, uydurma da ekleme** — bu depoda `NotificationPriority`
enum'u yok ve `InAppNotificationChannel` sessiz saate hiç bakmıyor (spec §8.3). Acil işaretinin
teslimdeki tek etkisi başlıktaki "Acil duyuru: " ön ekidir. Gerçek şekil bundan farklıysa DUR
ve bildir.

- [ ] **Step 9: Testleri çalıştır ve commit**

Run: `dotnet build && dotnet test`
Expected: PASS

```bash
dotnet format
git add src/Oksis.Domain/Modules/Notifications/ src/Oksis.Application/ src/Oksis.Infrastructure/Notifications/ tests/
git commit -m "feat(announcements): yayin bildirimi zinciri eklendi

Genel Person -> Account cevirisi eklendi: duyuru 'tum okul' hedefiyle
ogretmen + ogrenci + veliyi birden kapsar, mevcut resolver yalniz dar
halleri biliyordu. Tek toplu sorgudur. Bildirim duyuru DETAYINA gider,
ara listeye dusmez (DYR-F-18). Teslim siniri: yalniz in-app kanal
kayitli, alici uygulamayi acmazsa telefona dusmez."
```

---

### Task 18: Uçtan uca duman testi

A1'in bittiğini kanıtlar: **yönetici yayınlar → veli görür → okur → yönetici görülme sayısını okur.**

**Files:**
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementEndToEndTests.cs`

- [ ] **Step 1: Duman testini yaz**

```csharp
using FluentAssertions;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A1 kabul testi. Senaryo A'nın (spec §7.1) in-app kısmı: yayın → gelen kutusu →
/// okuma → görülme sayısı. Push adımı KAPSAM DIŞIDIR ve burada test edilmez.
/// </summary>
public sealed class AnnouncementEndToEndTests
{
    [Fact]
    public async Task Should_ReachParentAndCountAsSeen_When_AdminPublishesToAllParents()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        // 1 — Yönetici yayınlar
        var published = await fixture.CreateAnnouncementAsync(
            title: "Veli toplantısı",
            body: "12 Kasım Salı günü saat 18:00'de veli toplantısı yapılacaktır.",
            audience: [("all", "all", "parent")],
            asDraft: false);

        published.Status.Should().Be("published");
        published.RecipientCount.Should().Be(fixture.AllParentIds.Count);
        published.PublisherLabel.Should().Be("Okul Müdürlüğü");

        // 2 — Veli gelen kutusunda görür, okunmamış
        var inbox = await fixture.InboxAsync(fixture.ParentAccountId);
        inbox.Should().ContainSingle();
        inbox[0].Id.Should().Be(published.Id);
        inbox[0].IsRead.Should().BeFalse();

        // 3 — Veli okur
        var read = await fixture.MarkReadAsync(fixture.ParentAccountId, Guid.Parse(published.Id));
        read.IsRead.Should().BeTrue();

        // 4 — Gelen kutusu artık okunmuş gösterir
        var afterRead = await fixture.InboxAsync(fixture.ParentAccountId);
        afterRead[0].IsRead.Should().BeTrue();

        // 5 — Yönetici görülme sayısını okur
        var detail = await fixture.GetByIdAsync(fixture.AdminAccountId, Guid.Parse(published.Id));
        detail.SeenCount.Should().Be(1);
        detail.IsRead.Should().BeNull("yönetim yüzeyinde okuyucu diye bir taraf yoktur");
    }

    [Fact]
    public async Task Should_NotReachPrimaryStudents_When_PublishedToAllStudents()
    {
        // Kabul kriteri: "İlkokul velisine giden duyuru ilkokul öğrenci hesabında görünmez."
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        await fixture.CreateAnnouncementAsync(
            title: "Öğrencilere duyuru", body: "Tum ogrencilere gonderildi.",
            audience: [("role", "student", "student")], asDraft: false);

        var primaryInbox = await fixture.InboxAsync(fixture.PrimaryStudentAccountId);
        var highInbox = await fixture.InboxAsync(fixture.HighSchoolStudentAccountId);

        primaryInbox.Should().BeEmpty();
        highInbox.Should().ContainSingle();
    }

    [Fact]
    public async Task Should_ShowOnceInInbox_When_ParentHasTwoChildrenAndSchoolWidePublished()
    {
        // Kabul kriteri: "Üç çocuklu veli okul geneli duyuruyu tek kez görür."
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        await fixture.CreateAnnouncementAsync(
            title: "Okul geneli", body: "Tum velilere gonderildi.",
            audience: [("all", "all", "parent")], asDraft: false);

        var inbox = await fixture.InboxAsync(fixture.TwoChildParentAccountId);

        inbox.Should().ContainSingle();
    }

    [Fact]
    public async Task Should_HideAllOptionFromTeacher_When_AudiencePoolRequested()
    {
        // Kabul kriteri: "Öğretmen hedef kitle seçicisinde kendi sınıfları dışında bir
        // seçenek göremez."
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync();

        var pool = await fixture.AudiencePoolAsync(fixture.TeacherAccountId);

        pool.All.Should().BeNull();
        pool.Role.Should().BeNull();
        pool.SchoolStage.Should().BeNull();
        pool.GradeLevel.Should().BeNull();
        pool.Section.Should().NotBeNullOrEmpty();
    }
}
```

- [ ] **Step 2: Testi çalıştır**

Run:
```bash
docker compose up -d
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementEndToEndTests"
```
Expected: PASS (4 test)

- [ ] **Step 3: Tüm test paketini çalıştır**

Run: `dotnet build && dotnet test`
Expected: PASS — hiçbir mevcut testte regresyon yok.

- [ ] **Step 4: Swagger'da 6 ucun göründüğünü doğrula**

Run:
```bash
dotnet run --project src/Oksis.Api &
sleep 8
curl -s http://localhost:5000/swagger/v1/swagger.json | jq -r '.paths | keys[]' | grep announcements
```
Expected — tam olarak bu 6 yol:
```
/api/v1/announcements
/api/v1/announcements/audience
/api/v1/announcements/inbox
/api/v1/announcements/{id}
/api/v1/announcements/{id}:read
```
**`DELETE /api/v1/announcements/{id}` GÖRÜNMEMELİDİR** (INV-1). Görünüyorsa DUR.

- [ ] **Step 5: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementEndToEndTests.cs
git commit -m "test(announcements): A1 uctan uca duman testi eklendi

Senaryo A'nin in-app kismi: yayin -> gelen kutusu -> okuma -> gorulme
sayisi. Ayrica uc kabul kriteri: ilkokul ogrencisi duyuru almaz, cok
cocuklu veli okul geneli duyuruyu tek kez gorur, ogretmen hedef
secicide tum okulu goremez."
```

---

## A1 Tamamlanma Ölçütü

Aşağıdakilerin **tamamı** doğruysa A1 bitmiştir ve B planına geçilebilir:

- [ ] `dotnet build && dotnet test` yeşil — regresyon yok
- [ ] Swagger'da 5 duyuru yolu var, `DELETE` **yok**
- [ ] `announcements` tablolarında `is_deleted` kolonu **yok**
- [ ] 8 granüler izin anahtarı seed edilmiş, `read`/`manage`/`delete` **yok**
- [ ] `permission-matrix.md` güncellenmiş
- [ ] Yönetici yayınlar → veli gelen kutusunda görür → okur → yönetici görülme sayısını okur
- [ ] İlkokul öğrencisi duyuru **almaz**, lise öğrencisi alır
- [ ] Öğretmen `scope=school` isterse **403**, hedef havuzunda "tüm okul" **yok**
- [ ] Çok çocuklu veli okul geneli duyuruyu **tek kez** görür

**Sonraki plan:** A2 — yaşam döngüsü (`amend`/`withdraw`/`restore`/`audit-trail`) ve
eşikli moderasyon (`moderation`/`approvals`/`approve`/`reject`).
