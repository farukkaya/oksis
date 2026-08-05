# Duyurular C2 — Sunucu Sayfalaması Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Duyuru envanterini ve gelen kutusunu sunucu sayfalamasına geçirmek; bunu yaparken özet kartı sayaçlarının, aramanın ve filtrelerin sayfa penceresine hapsolmasını önlemek.

**Architecture:** Filtreleme, arama, sıralama ve sayaçlar sunucuya taşınır. Envanter özet kartları listeden türetilemez hâle geldiği için ayrı bir `GET /announcements/summary` ucu açılır. Gelen kutusu bugün hiç sayfalanmıyor — `PagedResult` döndürecek şekilde değiştirilir. İstemcide `filterAnnouncements`/`filterInbox` **silinmez**: gelen kutusunun görünürlük kapısı (`INBOX_ANNOUNCEMENT_STATUSES`) savunma olarak yerinde kalır, yalnız sunucunun devraldığı filtre kolları çağrılmaz olur.

**Tech Stack:** .NET 10 / EF Core 10 / xUnit + Testcontainers (backend) · TanStack Query v5 + vitest (`packages/api`, `packages/core`) · MSW (`packages/api-mocks`) · Next.js 16 (`apps/web`) · Expo Router (`apps/mobile`)

## Global Constraints

- Kullanıcıya dönük her metin **Türkçe**dir.
- **`apps/web` ve `apps/mobile`'da test koşucusu YOKTUR.** Doğrulama `npm run typecheck` + `npm run lint` ve MSW üzerinden elle duman testidir. Test edilebilir mantık `packages/core` veya `packages/api`'ye taşınır.
- Commit formatı: `<type>(<scope>): türkçe açıklama` — sonda nokta yok.
- Backend commit'inden önce `dotnet format`.
- Backend test adlandırması: `Should_{ExpectedBehavior}_When_{Condition}`.
- Tenant izolasyonu: yeni sorguların hepsi `TenantEntity` global filtresine tabidir; `IgnoreQueryFilters()` **yasak**.
- **Sıralama tiebreaker'ı zorunludur.** `GetAnnouncementsQueryHandler` bugün `Pinned desc → (PublishedAt ?? CreatedAt) desc → Id asc` kullanıyor; eklenen her sayfalı sorgu aynı kalıbı izler. Tiebreaker'sız sayfalamada aynı satır iki sayfada görünebilir veya hiç görünmeyebilir.
- **Kabul edilmiş davranış değişikliği:** sunucu araması repo genelindeki kalıbı izler (`EF.Functions.Like(x.ToLower(), pattern)` — bkz. `ListStudentsQueryHandler.cs:47-64`). İstemcideki `foldTurkish` aksan katlaması (ş→s, ğ→g) sunucuda **yoktur**; "sube" yazarak "Şube"yi bulmak artık çalışmaz. Bu, deponun her listesindeki davranıştır ve bilinçli olarak devralınmıştır.
- Komutlar:
  - Backend test: `dotnet test --filter "FullyQualifiedName~<Sınıf>"`
  - Paket testi: `npm run test --workspace=@workspace/api` · `npm run test --workspace=@workspace/core`
  - Uygulama doğrulama: `npm run typecheck --workspace=<paket>` · `npm run lint --workspace=<paket>`

---

## File Structure

| Dosya | Sorumluluk |
|---|---|
| `src/Oksis.Application/.../Queries/GetAnnouncements/GetAnnouncementsQuery.cs` | Çoklu statü + genişletilmiş arama parametreleri |
| `src/Oksis.Application/.../Queries/GetAnnouncements/GetAnnouncementsQueryHandler.cs` | Filtre + sayfalama; hedef etiketi araması |
| `src/Oksis.Application/.../Queries/GetAnnouncementSummary/` (**yeni**, 2 dosya) | Özet kartı sayaçları — filtreden bağımsız, kapsam içi toplamlar |
| `src/Oksis.Application/.../DTOs/AnnouncementSummaryDto.cs` (**yeni**) | 5 sayaç |
| `src/Oksis.Application/.../Queries/GetAnnouncementInbox/*` | `PagedResult` döner, `Take` kazanır |
| `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs` | 3 imza değişikliği + 1 yeni action |
| `packages/api/src/announcements/endpoints.ts` | Sayfalı liste/gelen kutusu, özet ucu |
| `packages/api/src/announcements/queries.ts` | Parametreli hook'lar |
| `packages/api/src/client/query-keys.ts` | `list`/`inbox` anahtarları parametre taşır, `summary` eklenir |
| `packages/api-mocks/src/announcements/announcement-handlers.ts` | Sayfalama + filtre + özet mock'u |
| `packages/core/src/announcements/logic.ts` | `filterAnnouncements`'ın sunucuya devrettiği kollar belgelenir; `summarizeAnnouncements` emekliye ayrılır |
| `apps/web/features/announcements/{announcements-page,inventory-tab,archive-tab}.tsx` | Sunucu sayfası + sunucu filtresi |
| `apps/mobile/src/features/announcements/components/{admin-announcements-screen,announcement-inbox-screen}.tsx` | "Daha fazla yükle" |

---

### Task 1: Envanter sorgusu çoklu statü ve hedef etiketi araması kazanır

Özet kartı `last30` **üç** statüyü birden kapsıyor (`published`, `withdrawn`, `expired`); bugünkü `Status` tek değer aldığı için kart filtresi sunucuya taşınamıyor. Arama da ayrışıyor: istemci başlık + hedef etiketinde, sunucu başlık + metinde arıyor.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncements/GetAnnouncementsQuery.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncements/GetAnnouncementsQueryHandler.cs:81-108`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs:43-55`
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementsTests.cs`

**Interfaces:**
- Consumes: `AnnouncementEnumWire.ParseStatus(string)`, `AnnouncementTarget.Label` (`AnnouncementTargets` DbSet).
- Produces: `GetAnnouncementsQuery(string? Scope, IReadOnlyList<string>? Statuses, string? Type, string? PublisherId, bool? UrgentOnly, string? Q, int? Page, int? PageSize)`. Task 2 ve Task 4 bu imzayı kullanır.

- [ ] **Step 1: Testleri yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementsTests.cs` dosyasına ekleyin. Fixture kalıbını dosyanın mevcut testlerinden birebir kopyalayın (aynı `Arrange` yardımcıları, aynı tenant kurulumu):

```csharp
[Fact]
public async Task Should_ReturnAllRequestedStatuses_When_MultipleStatusesGiven()
{
    // Arrange: published + withdrawn + draft birer kayıt (dosyanın mevcut seed yardımcısıyla).
    // Act
    var result = await SendAsync(new GetAnnouncementsQuery(
        Scope: "school", Statuses: ["published", "withdrawn"], Type: null, PublisherId: null,
        UrgentOnly: null, Q: null, Page: 1, PageSize: 50));

    // Assert
    result.Value!.Items.Should().HaveCount(2);
    result.Value.Items.Should().OnlyContain(a => a.Status == "published" || a.Status == "withdrawn");
}

[Fact]
public async Task Should_IgnoreStatusFilter_When_StatusListIsEmpty()
{
    var result = await SendAsync(new GetAnnouncementsQuery(
        Scope: "school", Statuses: [], Type: null, PublisherId: null,
        UrgentOnly: null, Q: null, Page: 1, PageSize: 50));

    result.Value!.TotalCount.Should().BeGreaterThan(0);
}

[Fact]
public async Task Should_MatchAudienceLabel_When_QueryTargetsFrozenTargetText()
{
    // Arrange: hedefi "9-A velileri" olarak DONMUŞ bir duyuru + başka bir duyuru.
    var result = await SendAsync(new GetAnnouncementsQuery(
        Scope: "school", Statuses: null, Type: null, PublisherId: null,
        UrgentOnly: null, Q: "9-a veli", Page: 1, PageSize: 50));

    result.Value!.Items.Should().ContainSingle();
}

[Fact]
public async Task Should_BeCaseInsensitive_When_QueryUsesDifferentCasing()
{
    // Başlığı "Veli Toplantısı" olan kayıt "veli toplant" ile bulunur.
    var result = await SendAsync(new GetAnnouncementsQuery(
        Scope: "school", Statuses: null, Type: null, PublisherId: null,
        UrgentOnly: null, Q: "VELİ TOPLANT", Page: 1, PageSize: 50));

    result.Value!.Items.Should().NotBeEmpty();
}
```

- [ ] **Step 2: Testleri çalıştır, kırmızı olduğunu doğrula**

```bash
dotnet test --filter "FullyQualifiedName~GetAnnouncementsTests"
```

Beklenen: FAIL — `GetAnnouncementsQuery` `Statuses` parametresi tanımıyor (derleme hatası).

- [ ] **Step 3: Sorgu kaydını değiştir**

`GetAnnouncementsQuery.cs`:

```csharp
/// <summary>
/// Duyuru envanteri. <c>scope</c>: <c>school</c> (tüm okul) | <c>mine</c> (yalnız
/// yayınlayan kendisi) | <c>archive</c> (expired + withdrawn). Varsayılan <c>school</c>.
///
/// <para><c>Statuses</c> ÇOKLUDUR: istemcinin "Son 30 günde yayınlanan" özet kartı üç
/// statüyü birden kapsar (<c>published</c>/<c>withdrawn</c>/<c>expired</c>) ve tek
/// değerli bir filtreyle sunucuya taşınamazdı. Boş liste = filtre yok.</para>
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.view")]
public sealed record GetAnnouncementsQuery(
    string? Scope, IReadOnlyList<string>? Statuses, string? Type, string? PublisherId,
    bool? UrgentOnly, string? Q, int? Page, int? PageSize)
    : IQuery<PagedResult<AnnouncementDto>>;
```

- [ ] **Step 4: Handler'daki statü ve arama kollarını değiştir**

`GetAnnouncementsQueryHandler.cs`, mevcut `if (!string.IsNullOrWhiteSpace(request.Status))` bloğunu şununla değiştirin:

```csharp
        if (request.Statuses is { Count: > 0 })
        {
            // Wire değerleri ENUM'a burada çevrilir; bilinmeyen değer ParseStatus
            // tarafından kesilir ve sorguya hiç girmez.
            var statuses = request.Statuses.Select(AnnouncementEnumWire.ParseStatus).ToList();
            query = query.Where(a => statuses.Contains(a.Status));
        }
```

Arama kolunu (mevcut `EF.Functions.Like(a.Title, …) || EF.Functions.Like(a.Body, …)`) şununla değiştirin:

```csharp
        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            // Kalıp deponun geri kalanıyla AYNI: ToLower() + LIKE (bkz.
            // ListStudentsQueryHandler). İstemcideki `foldTurkish` aksan katlaması
            // (ş→s, ğ→g) BURADA YOKTUR ve bilinçli olarak devralınmamıştır — depoda
            // hiçbir sunucu araması onu yapmıyor, duyuruda yapmak tek başına bir
            // istisna olurdu.
            //
            // Hedef ETİKETİ de aranır: kullanıcı "9-A velileri" yazıp duyuruyu
            // bulabilmelidir (arama kutusunun vaadi budur). Etiket duyurunun
            // kendisinde değil, yayın anında donmuş AnnouncementTarget satırlarındadır.
            var pattern = $"%{request.Q.Trim().ToLowerInvariant()}%";
            query = query.Where(a =>
                EF.Functions.Like(a.Title.ToLower(), pattern)
                || EF.Functions.Like(a.Body.ToLower(), pattern)
                || db.AnnouncementTargets.Any(t =>
                    t.AnnouncementId == a.Id && EF.Functions.Like(t.Label.ToLower(), pattern)));
        }
```

> `AnnouncementTarget`'ın etiket alanının gerçek adı `Label` değilse (`AnnouncementTargetConfiguration.cs`'e bakın) o adı kullanın; sorgu şekli değişmez.

- [ ] **Step 5: Controller imzasını güncelle**

`AnnouncementsController.cs:46-54`:

```csharp
    public async Task<IActionResult> ListAsync(
        [FromQuery] string? scope, [FromQuery] string[]? status, [FromQuery] string? type,
        [FromQuery] string? publisherId, [FromQuery] bool? urgentOnly, [FromQuery] string? q,
        [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken cancellationToken)
    {
        // `?status=published&status=withdrawn` biçimi dizi olarak bağlanır; tek değer
        // gönderen eski istemci de tek elemanlı dizi olarak bağlanır — kırılma yok.
        var result = await sender.Send(
            new GetAnnouncementsQuery(scope, status, type, publisherId, urgentOnly, q, page, pageSize),
            cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 6: Testleri çalıştır, yeşil olduğunu doğrula**

```bash
dotnet format && dotnet test --filter "FullyQualifiedName~GetAnnouncementsTests"
```

Beklenen: PASS. Derleyici `GetAnnouncementsQuery`'yi çağıran başka yerleri gösterirse (varsa job'lar veya testler) `Statuses` alanını `null` geçirerek uyarlayın.

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "feat(announcements): envanter sorgusu coklu statu ve hedef etiketi aramasi kazandi"
```

---

### Task 2: Özet kartı sayaçları için ayrı uç

`summarizeAnnouncements` bugün **yüklenen satırları** sayıyor. Sayfalamadan sonra "Yayında 12" yerine "bu sayfada 8" yazacak. Sayaçlar filtreden bağımsız, kapsam içi toplamlardır ve sunucudan gelmelidir.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementSummaryDto.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementSummary/GetAnnouncementSummaryQuery.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementSummary/GetAnnouncementSummaryQueryHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementSummaryTests.cs`

**Interfaces:**
- Consumes: `AnnouncementCallerResolver.CanUseInventoryAsync`, `.ResolveMyPersonIdAsync`, `.ResolveScopedPublisherIdAsync` (`GetAnnouncementsQueryHandler`'ın kullandığı üçlü), `IClock` (varsa; yoksa `DateTimeOffset.UtcNow`).
- Produces: `GET /api/v1/announcements/summary?scope=` → `AnnouncementSummaryDto { Published, Scheduled, Draft, Last30, UrgentThisMonth }`. Task 5 ve Task 7 bunu tüketir.

> **Kapsam kuralı `GET /announcements` ile birebir aynıdır.** Öğretmen `scope=school` isterse 403, `scope` verilmezse kendi kayıtları. Aksi hâlde kartlar öğretmene okul geneli sayı gösterip liste kendi kayıtlarını gösterirdi.

- [ ] **Step 1: Testi yaz**

Create `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementSummaryTests.cs`. Sınıf iskeletini `GetAnnouncementsTests.cs`'ten kopyalayın (aynı fixture, aynı `SendAsync` yardımcısı):

```csharp
[Fact]
public async Task Should_CountAllRowsInScope_When_ListIsPaged()
{
    // Arrange: 12 published + 3 scheduled + 2 draft.
    // Act: sayfa boyutu 5 olsa bile sayaçlar TOPLAMI söyler.
    var summary = await SendAsync(new GetAnnouncementSummaryQuery(Scope: "school"));

    summary.Value!.Published.Should().Be(12);
    summary.Value.Scheduled.Should().Be(3);
    summary.Value.Draft.Should().Be(2);
}

[Fact]
public async Task Should_CountOnlyLastThirtyDays_When_Last30IsComputed()
{
    // Arrange: 31 gün önce yayınlanmış 1, dün yayınlanmış 1 kayıt.
    var summary = await SendAsync(new GetAnnouncementSummaryQuery(Scope: "school"));

    summary.Value!.Last30.Should().Be(1);
}

[Fact]
public async Task Should_NarrowToOwnRows_When_CallerIsScopedPublisher()
{
    // Arrange: öğretmen olarak oturum; biri kendisinin, biri başkasının 2 published kayıt.
    var summary = await SendAsync(new GetAnnouncementSummaryQuery(Scope: null));

    summary.Value!.Published.Should().Be(1);
}

[Fact]
public async Task Should_ReturnForbidden_When_ScopedPublisherAsksForSchoolScope()
{
    var summary = await SendAsync(new GetAnnouncementSummaryQuery(Scope: "school"));

    summary.IsSuccess.Should().BeFalse();
}
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
dotnet test --filter "FullyQualifiedName~GetAnnouncementSummaryTests"
```

Beklenen: FAIL — tip bulunamadı.

- [ ] **Step 3: DTO'yu yaz**

Create `src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementSummaryDto.cs`:

```csharp
namespace Oksis.Application.Modules.Announcements.DTOs;

/// <summary>
/// Envanter özet kartlarının sayaçları. Alan adları istemcideki
/// <c>AnnouncementSummary</c> (packages/core) ile BİREBİR aynıdır — kart
/// bileşeni sayacı adıyla okur, eşleme tablosu yoktur.
///
/// <para>Sayaçlar FİLTREDEN BAĞIMSIZDIR: kart "yayında kaç duyuru var" sorusuna
/// cevap verir, "seçili filtreye göre kaç tane" sorusuna değil — kartın kendisi
/// bir filtre kısayoludur, filtrenin sonucu olamaz.</para>
/// </summary>
public sealed record AnnouncementSummaryDto
{
    public required int Published { get; init; }
    public required int Scheduled { get; init; }
    public required int Draft { get; init; }
    /// <summary>Son 30 günde yayınlanan: published + withdrawn + expired.</summary>
    public required int Last30 { get; init; }
    /// <summary>İçinde bulunulan takvim ayında yayınlanan acil duyurular.</summary>
    public required int UrgentThisMonth { get; init; }
}
```

- [ ] **Step 4: Sorgu ve handler'ı yaz**

Create `GetAnnouncementSummaryQuery.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementSummary;

/// <summary>
/// Envanter özet kartlarının sayaçları. Kapsam kuralı <see cref="GetAnnouncements.GetAnnouncementsQuery"/>
/// ile BİREBİR aynıdır — kartlarla listenin farklı kapsamlara bakması, kullanıcıya
/// "12 yayında" deyip 3 satır göstermek demektir.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.view")]
public sealed record GetAnnouncementSummaryQuery(string? Scope)
    : IQuery<AnnouncementSummaryDto>;
```

Create `GetAnnouncementSummaryQueryHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementSummary;

public sealed class GetAnnouncementSummaryQueryHandler(
    IApplicationDbContext db, ITenantContext tenant, ICurrentUser currentUser,
    IPermissionReader permissionReader)
    : IQueryHandler<GetAnnouncementSummaryQuery, AnnouncementSummaryDto>
{
    public async Task<Result<AnnouncementSummaryDto>> Handle(
        GetAnnouncementSummaryQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementSummaryDto>.Forbidden();
        }

        // Üç kapı da GetAnnouncementsQueryHandler'daki SIRAYLA aynıdır; kopyalanmış
        // değil, aynı yardımcılardan okunmuştur — kapsam kuralı tek yerde tanımlıdır.
        if (!await AnnouncementCallerResolver.CanUseInventoryAsync(permissionReader, cancellationToken))
        {
            return Result<AnnouncementSummaryDto>.Forbidden();
        }

        var myPersonId = await AnnouncementCallerResolver.ResolveMyPersonIdAsync(
            db, currentUser.Id, cancellationToken);
        if (myPersonId is null)
        {
            return Result<AnnouncementSummaryDto>.Forbidden();
        }

        var scopedPublisherId = await AnnouncementCallerResolver.ResolveScopedPublisherIdAsync(
            permissionReader, myPersonId.Value, cancellationToken);

        var scope = request.Scope ?? (scopedPublisherId is null ? "school" : "mine");
        if (scopedPublisherId is not null && scope is "school")
        {
            return Result<AnnouncementSummaryDto>.Forbidden();
        }

        var query = db.Announcements.AsNoTracking().Where(a => a.SchoolId == schoolId);
        if (scope is "mine" || scopedPublisherId is not null)
        {
            query = query.Where(a => a.PublisherId == myPersonId.Value);
        }

        var now = DateTimeOffset.UtcNow;
        var thirtyDaysAgo = now.AddDays(-30);
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);

        // TEK sorgu: beş sayaç için beş round-trip yapmak, kart satırının render
        // gecikmesini beş katına çıkarırdı.
        var counts = await query
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Published = g.Count(a => a.Status == AnnouncementStatus.Published),
                Scheduled = g.Count(a => a.Status == AnnouncementStatus.Scheduled),
                Draft = g.Count(a => a.Status == AnnouncementStatus.Draft),
                Last30 = g.Count(a =>
                    (a.Status == AnnouncementStatus.Published
                        || a.Status == AnnouncementStatus.Withdrawn
                        || a.Status == AnnouncementStatus.Expired)
                    && a.PublishedAt != null && a.PublishedAt >= thirtyDaysAgo),
                UrgentThisMonth = g.Count(a =>
                    a.Urgent && a.PublishedAt != null && a.PublishedAt >= monthStart),
            })
            .FirstOrDefaultAsync(cancellationToken);

        // Hiç kayıt yoksa GroupBy boş küme döndürür — sıfırlarla cevap verilir, hata değil.
        return Result<AnnouncementSummaryDto>.Success(new AnnouncementSummaryDto
        {
            Published = counts?.Published ?? 0,
            Scheduled = counts?.Scheduled ?? 0,
            Draft = counts?.Draft ?? 0,
            Last30 = counts?.Last30 ?? 0,
            UrgentThisMonth = counts?.UrgentThisMonth ?? 0,
        });
    }
}
```

- [ ] **Step 5: Controller action'ını ekle**

`AnnouncementsController.cs`, `GetAudienceAsync`'in hemen üstüne:

```csharp
    /// <summary>Envanter özet kartlarının sayaçları. Kapsam kuralı <c>GET /announcements</c> ile aynıdır.</summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSummaryAsync(
        [FromQuery] string? scope, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnnouncementSummaryQuery(scope), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

> Rota sırası önemli: `summary` sabit segmenti, `{id}` yakalayıcısından **önce** tanımlı olmalıdır. `audience`/`inbox`/`moderation` zaten öyle konumlanmış — yeni action'ı onların arasına koyun.

- [ ] **Step 6: Testi çalıştır, yeşil olduğunu doğrula**

```bash
dotnet format && dotnet test --filter "FullyQualifiedName~GetAnnouncementSummaryTests"
```

Beklenen: PASS.

- [ ] **Step 7: Commit**

```bash
git add src tests
git commit -m "feat(announcements): ozet karti sayaclari icin summary ucu eklendi"
```

---

### Task 3: Gelen kutusu sayfalanır

`GetAnnouncementInboxQueryHandler`'da `Take` yok, uç `pageSize` parametresi bile kabul etmiyor ve `IReadOnlyList` döndürüyor. Bir veli üç yıl sonra tüm duyuru geçmişini tek istekte çekiyor.

**Files:**
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementInbox/GetAnnouncementInboxQuery.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementInbox/GetAnnouncementInboxQueryHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs:67-75`
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementInboxTests.cs`

**Interfaces:**
- Consumes: `AnnouncementReaderVisibility.ReaderVisibleStatuses`, `AnnouncementMapper.ToDto`.
- Produces: `GetAnnouncementInboxQuery(Guid? ChildId, int? Page, int? PageSize) : IQuery<PagedResult<AnnouncementDto>>`. Task 4 ve Task 8 bunu tüketir.

- [ ] **Step 1: Testleri yaz**

`GetAnnouncementInboxTests.cs`'e ekleyin:

```csharp
[Fact]
public async Task Should_ReturnFirstPageOnly_When_PageSizeIsSmallerThanTotal()
{
    // Arrange: alıcı satırı olan 7 published duyuru.
    var result = await SendAsync(new GetAnnouncementInboxQuery(ChildId: null, Page: 1, PageSize: 3));

    result.Value!.Items.Should().HaveCount(3);
    result.Value.TotalCount.Should().Be(7);
    result.Value.HasNextPage.Should().BeTrue();
}

[Fact]
public async Task Should_NotRepeatOrDropRows_When_PagesAreWalked()
{
    var first = await SendAsync(new GetAnnouncementInboxQuery(null, Page: 1, PageSize: 3));
    var second = await SendAsync(new GetAnnouncementInboxQuery(null, Page: 2, PageSize: 3));
    var third = await SendAsync(new GetAnnouncementInboxQuery(null, Page: 3, PageSize: 3));

    var ids = first.Value!.Items.Concat(second.Value!.Items).Concat(third.Value!.Items)
        .Select(a => a.Id).ToList();

    ids.Should().OnlyHaveUniqueItems();
    ids.Should().HaveCount(7);
}

[Fact]
public async Task Should_ClampPageSize_When_CallerAsksForTooMany()
{
    var result = await SendAsync(new GetAnnouncementInboxQuery(null, Page: 1, PageSize: 5000));

    result.Value!.PageSize.Should().Be(200);
}
```

- [ ] **Step 2: Testleri çalıştır, kırmızı olduğunu doğrula**

```bash
dotnet test --filter "FullyQualifiedName~GetAnnouncementInboxTests"
```

Beklenen: FAIL — derleme hatası (fazla parametre).

- [ ] **Step 3: Sorguyu ve handler'ı değiştir**

`GetAnnouncementInboxQuery.cs` — dönüş tipi ve parametreler:

```csharp
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.view")]
public sealed record GetAnnouncementInboxQuery(Guid? ChildId, int? Page, int? PageSize)
    : IQuery<PagedResult<AnnouncementDto>>;
```

`GetAnnouncementInboxQueryHandler.cs`:

- Sınıf imzasındaki `IQueryHandler<GetAnnouncementInboxQuery, IReadOnlyList<AnnouncementDto>>` → `IQueryHandler<GetAnnouncementInboxQuery, PagedResult<AnnouncementDto>>`, `Handle`'ın dönüş tipi de aynı şekilde.
- Erken dönüşler: `Result<...>.Forbidden()` aynı; `myPersonId is null` dalı `Result<PagedResult<AnnouncementDto>>.Success(PagedResult<AnnouncementDto>.Empty(page, pageSize))` döner.
- Sınıfın başına `GetAnnouncementsQueryHandler` ile **aynı** sabitleri ekleyin:

```csharp
    private const int DefaultPageSize = 50;
    private const int MaxPageSize = 200;
```

- LINQ sorgusunu ikiye ayırın; `orderby` satırına **tiebreaker** ekleyin:

```csharp
        var page = Math.Max(1, request.Page ?? 1);
        var pageSize = Math.Clamp(request.PageSize ?? DefaultPageSize, 1, MaxPageSize);

        var baseQuery =
            from r in db.AnnouncementRecipients.AsNoTracking()
            join a in db.Announcements.AsNoTracking() on r.AnnouncementId equals a.Id
            where r.SchoolId == schoolId
                && r.PersonId == myPersonId.Value
                && AnnouncementReaderVisibility.ReaderVisibleStatuses.Contains(a.Status)
                && (request.ChildId == null
                    || r.ChildPersonId == null
                    || r.ChildPersonId == request.ChildId)
            select new { Announcement = a, r.IsRead, r.ChildPersonId };

        var totalCount = await baseQuery.CountAsync(cancellationToken);

        // Id son kırıcıdır: aynı anda yayınlanan iki duyurunun sıralama anahtarları
        // EŞİTTİR ve eşit anahtarlarda satır sırası garanti edilmez — tiebreaker'sız
        // bir kayıt iki sayfada birden görünebilir veya hiç görünmeyebilir
        // (GetAnnouncementsQueryHandler'daki aynı not).
        var rows = await baseQuery
            .OrderByDescending(x => x.Announcement.Pinned)
            .ThenByDescending(x => x.Announcement.PublishedAt)
            .ThenBy(x => x.Announcement.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
```

- Sonda `Result<...>.Success(items)` yerine:

```csharp
        return Result<PagedResult<AnnouncementDto>>.Success(new PagedResult<AnnouncementDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
        });
```

> `targets` yüklemesi ve `AnnouncementMapper.ToDto` çağrısı **aynen** korunur; yalnız artık sayfa satırları üzerinde çalışır — bu zaten istenen davranıştır (N+1 yok, sayfa başına tek sorgu).

- [ ] **Step 4: Controller'ı güncelle**

```csharp
    [HttpGet("inbox")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<AnnouncementDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetInboxAsync(
        [FromQuery] Guid? childId, [FromQuery] int? page, [FromQuery] int? pageSize,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetAnnouncementInboxQuery(childId, page, pageSize), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 5: Testleri çalıştır, yeşil olduğunu doğrula**

```bash
dotnet format && dotnet test --filter "FullyQualifiedName~Announcement"
```

Beklenen: PASS. Gelen kutusunu çağıran başka test/handler varsa derleyici gösterir; `Page: null, PageSize: null` geçirerek uyarlayın.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "feat(announcements): gelen kutusu sayfalandi ve ust sinir kazandi"
```

---

### Task 4: İstemci uçları sayfalı hâle gelir

**Files:**
- Modify: `packages/api/src/announcements/endpoints.ts:216-250`
- Modify: `packages/api/src/announcements/endpoints.test.ts`
- Modify: `packages/api/src/client/query-keys.ts:193-206`

**Interfaces:**
- Consumes: `unwrapPaged` (`packages/api/src/client/request.ts`), Task 1-3'ün ürettiği uçlar.
- Produces:
  ```ts
  export interface AnnouncementPage { rows: Announcement[]; page: number; pageSize: number; totalCount: number; hasNextPage: boolean }
  export interface AnnouncementListParams { scope?: AnnouncementScope; q?: string; statuses?: AnnouncementStatus[]; type?: AnnouncementType | null; publisherId?: string | null; urgentOnly?: boolean; page?: number; pageSize?: number }
  export function getAnnouncements(params?: AnnouncementListParams): Promise<AnnouncementPage>
  export function getAnnouncementSummary(scope?: AnnouncementScope): Promise<AnnouncementSummary>
  export function getAnnouncementInbox(params?: { childId?: string; page?: number; pageSize?: number }): Promise<AnnouncementPage>
  ```
  Task 5, 6, 7, 8 bu imzaları kullanır.

- [ ] **Step 1: Testleri yaz**

`packages/api/src/announcements/endpoints.test.ts`'e ekleyin (dosyanın mevcut `fetchMock` kurulum kalıbını kullanın):

```ts
describe("getAnnouncements — sayfalama", () => {
  it("sayfa parametrelerini sorgu dizesine yazar", async () => {
    fetchMock.mockResolvedValueOnce(pagedResponse([], { page: 2, pageSize: 25, totalCount: 60 }))
    await getAnnouncements({ scope: "school", page: 2, pageSize: 25 })
    const url = fetchMock.mock.calls[0]![0] as string
    expect(url).toContain("page=2")
    expect(url).toContain("pageSize=25")
  })

  it("çoklu statüyü tekrarlı anahtar olarak gönderir", async () => {
    fetchMock.mockResolvedValueOnce(pagedResponse([], { page: 1, pageSize: 50, totalCount: 0 }))
    await getAnnouncements({ statuses: ["published", "withdrawn"] })
    const url = fetchMock.mock.calls[0]![0] as string
    expect(url).toContain("status=published")
    expect(url).toContain("status=withdrawn")
  })

  it("boş statü listesini hiç göndermez", async () => {
    fetchMock.mockResolvedValueOnce(pagedResponse([], { page: 1, pageSize: 50, totalCount: 0 }))
    await getAnnouncements({ statuses: [] })
    expect(fetchMock.mock.calls[0]![0] as string).not.toContain("status=")
  })

  it("hasNextPage'i toplamdan türetir", async () => {
    fetchMock.mockResolvedValueOnce(pagedResponse([], { page: 1, pageSize: 10, totalCount: 25 }))
    const result = await getAnnouncements({ page: 1, pageSize: 10 })
    expect(result.hasNextPage).toBe(true)
    expect(result.totalCount).toBe(25)
  })
})
```

`pagedResponse` yardımcısını dosyanın mevcut zarf yardımcısının yanına ekleyin:

```ts
function pagedResponse(
  items: unknown[],
  meta: { page: number; pageSize: number; totalCount: number },
) {
  return jsonResponse({
    data: {
      items,
      page: meta.page,
      pageSize: meta.pageSize,
      totalCount: meta.totalCount,
      totalPages: Math.ceil(meta.totalCount / meta.pageSize),
      hasPreviousPage: meta.page > 1,
      hasNextPage: meta.page * meta.pageSize < meta.totalCount,
    },
  })
}
```

> `jsonResponse` dosyanın mevcut yardımcısıdır; adı farklıysa oradaki adı kullanın.

- [ ] **Step 2: Testleri çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/api -- announcements/endpoints
```

Beklenen: FAIL.

- [ ] **Step 3: `getAnnouncements`'ı değiştir**

`packages/api/src/announcements/endpoints.ts`, mevcut `AnnouncementListParams` ve `getAnnouncements` bloğunun yerine:

```ts
export type AnnouncementScope = "school" | "mine" | "archive"

export interface AnnouncementListParams {
  /** `mine` = öğretmenin kendi duyuruları, `archive` = süresi dolmuş/geri çekilmiş. */
  scope?: AnnouncementScope
  q?: string
  /** Çoklu — özet kartı `last30` üç statüyü birden kapsar. Boş dizi = filtre yok. */
  statuses?: AnnouncementStatus[]
  type?: AnnouncementType | null
  publisherId?: string | null
  urgentOnly?: boolean
  page?: number
  pageSize?: number
}

export interface AnnouncementPage {
  rows: Announcement[]
  page: number
  pageSize: number
  totalCount: number
  hasNextPage: boolean
}

/**
 * Duyuru envanteri — SUNUCU SAYFALI (C2). Filtreleme, arama ve sıralama
 * sunucudadır; `packages/core`'daki `filterAnnouncements` yalnız gelen kutusu
 * savunması olarak kalır, envanterde çağrılmaz.
 */
export async function getAnnouncements(
  params: AnnouncementListParams = {},
): Promise<AnnouncementPage> {
  const page = await unwrap<S["PagedResultOfAnnouncementDto"]>(
    await getClient().GET("/api/v1/announcements", {
      params: {
        query: {
          scope: params.scope,
          q: params.q || undefined,
          // Boş dizi gönderilmez: `status=` biçiminde boş bir anahtar sunucuda
          // "tek elemanlı, boş" bir filtreye dönüşür ve hiçbir kaydı eşlemez.
          status: params.statuses?.length ? params.statuses : undefined,
          type: params.type ?? undefined,
          publisherId: params.publisherId ?? undefined,
          urgentOnly: params.urgentOnly || undefined,
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 25,
        },
      },
    }),
  )
  const pageNo = num(page?.page) || 1
  const pageSize = num(page?.pageSize) || 25
  const totalCount = num(page?.totalCount) || 0
  return {
    rows: (page?.items ?? []).map(toAnnouncement),
    page: pageNo,
    pageSize,
    totalCount,
    // `hasNextPage` alanı zarfta VAR ama .NET onu bazen string olarak yayınlıyor
    // (int alanlarındaki aynı davranış); türetmek daha ucuz ve daha kesin.
    hasNextPage: pageNo * pageSize < totalCount,
  }
}
```

> `num()` bu dosyada zaten tanımlı sayısal daraltıcıdır (`Number(v) || 0`). `AnnouncementStatus`/`AnnouncementType` tiplerini `@workspace/core` import bloğuna ekleyin.

- [ ] **Step 4: Özet ve gelen kutusu uçlarını yaz**

Aynı dosyaya, `getAnnouncements`'ın hemen altına:

```ts
/**
 * Envanter özet kartlarının sayaçları. Listeden TÜRETİLEMEZ: sayfalamadan
 * sonra istemcinin elinde yalnız bir sayfa vardır ve "Yayında 12" yerine
 * "bu sayfada 8" yazardı.
 */
export async function getAnnouncementSummary(
  scope: AnnouncementScope = "school",
): Promise<AnnouncementSummary> {
  const dto = await unwrap<S["AnnouncementSummaryDto"]>(
    await getClient().GET("/api/v1/announcements/summary", { params: { query: { scope } } }),
  )
  return {
    published: num(dto?.published),
    scheduled: num(dto?.scheduled),
    draft: num(dto?.draft),
    last30: num(dto?.last30),
    urgentThisMonth: num(dto?.urgentThisMonth),
  }
}

/**
 * Veli/öğrenci gelen kutusu — SUNUCU SAYFALI (C2). Görünürlük kuralı sunucuda
 * uygulanır ama core `filterInbox` aynı kapıyı istemcide de tutar: geri
 * çekilmiş bir duyuru hiçbir hatada okuyucuya düşmesin diye kural iki tarafta
 * da aynı sabitten (`INBOX_ANNOUNCEMENT_STATUSES`) okunur.
 *
 * `childId` verilmezse velinin tüm çocuklarının kapsamı döner ("Tümü").
 */
export async function getAnnouncementInbox(
  params: { childId?: string; page?: number; pageSize?: number } = {},
): Promise<AnnouncementPage> {
  const page = await unwrap<S["PagedResultOfAnnouncementDto"]>(
    await getClient().GET("/api/v1/announcements/inbox", {
      params: {
        query: {
          childId: params.childId,
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 25,
        },
      },
    }),
  )
  const pageNo = num(page?.page) || 1
  const pageSize = num(page?.pageSize) || 25
  const totalCount = num(page?.totalCount) || 0
  return {
    rows: (page?.items ?? []).map(toAnnouncement),
    page: pageNo,
    pageSize,
    totalCount,
    hasNextPage: pageNo * pageSize < totalCount,
  }
}
```

> `S["AnnouncementSummaryDto"]` ve gelen kutusunun `PagedResultOfAnnouncementDto` tipi **codegen sonrası** oluşur. Bu görevden önce backend Swagger'ı ayağa kaldırıp `packages/api/src/generated/schema.ts`'i yenileyin (B fazındaki codegen adımının aynısı); aksi hâlde typecheck bu iki tipi bulamaz.

- [ ] **Step 5: Query anahtarlarını güncelle**

`packages/api/src/client/query-keys.ts:193-206`:

```ts
  announcements: {
    all: () => ["announcements"] as const,
    /** Sunucu sayfalı: filtre + sayfa anahtarın PARÇASIDIR, aksi hâlde iki sayfa aynı cache satırını ezer. */
    list: (params: Record<string, unknown>) => ["announcements", "list", params] as const,
    summary: (scope: string) => ["announcements", "summary", scope] as const,
    /** `childId` yoksa "Tümü" — anahtar bunu `all` olarak taşır. */
    inbox: (childId: string | null, page: number) =>
      ["announcements", "inbox", childId ?? "all", page] as const,
    detail: (id: string) => ["announcements", "detail", id] as const,
    deliveryReport: (id: string) => ["announcements", "delivery-report", id] as const,
    auditTrail: (id: string) => ["announcements", "audit-trail", id] as const,
    approvals: () => ["announcements", "approvals"] as const,
    templates: () => ["announcements", "templates"] as const,
    audience: (scope: string) => ["announcements", "audience", scope] as const,
    publishers: () => ["announcements", "publishers"] as const,
    moderation: () => ["announcements", "moderation"] as const,
  },
```

- [ ] **Step 6: Testleri çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/api
```

Beklenen: PASS. Eski `getAnnouncements(...)` dönüşünü dizi sanan mevcut testler kırılırsa `.rows` üzerinden okuyacak şekilde güncelleyin.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src
git commit -m "feat(announcements): istemci uclari sunucu sayfalamasina gecti"
```

---

### Task 5: Hook'lar parametre taşır

**Files:**
- Modify: `packages/api/src/announcements/queries.ts:40-58`
- Modify: `packages/core/src/announcements/logic.ts` (`summarizeAnnouncements` emekliye ayrılır)
- Modify: `packages/core/src/announcements/logic.test.ts`

**Interfaces:**
- Consumes: Task 4'ün ürettiği üç fonksiyon.
- Produces:
  ```ts
  export function useAnnouncements(params?: AnnouncementListParams)   // -> UseQueryResult<AnnouncementPage>
  export function useAnnouncementSummary(scope?: AnnouncementScope)   // -> UseQueryResult<AnnouncementSummary>
  export function useAnnouncementInbox(childId?: string | null, page?: number)
  ```

- [ ] **Step 1: Hook'ları değiştir**

`packages/api/src/announcements/queries.ts`:

```ts
/**
 * Duyuru envanteri. Parametreler ANAHTARIN PARÇASIDIR: filtre veya sayfa
 * değiştiğinde yeni bir sorgu açılır ve önceki sayfa cache'te kalır — geri
 * dönüşte ağ isteği olmadan gösterilir.
 *
 * `placeholderData` ile eski sayfa yeni sayfa gelene kadar ekranda tutulur;
 * aksi hâlde her sayfa değişiminde tablo iskelete düşer ve liste zıplar.
 */
export function useAnnouncements(params: AnnouncementListParams = {}) {
  return useQuery({
    queryKey: qk.announcements.list(params as Record<string, unknown>),
    queryFn: () => getAnnouncements(params),
    placeholderData: (previous) => previous,
  })
}

/** Özet kartı sayaçları — filtreden bağımsız, yalnız kapsama bağlıdır. */
export function useAnnouncementSummary(scope: AnnouncementScope = "school") {
  return useQuery({
    queryKey: qk.announcements.summary(scope),
    queryFn: () => getAnnouncementSummary(scope),
  })
}

/**
 * Veli/öğrenci gelen kutusu. `childId` `null` iken tüm çocuklar ("Tümü",
 * varsayılan). Veli çocuk değiştirdiğinde yeni anahtarla yeni sorgu açılır —
 * her çocuğun listesi ayrı ayrı önbelleklenir.
 */
export function useAnnouncementInbox(childId: string | null = null, page = 1) {
  return useQuery({
    queryKey: qk.announcements.inbox(childId, page),
    queryFn: () => getAnnouncementInbox({ childId: childId ?? undefined, page }),
    placeholderData: (previous) => previous,
  })
}
```

Import bloğuna `getAnnouncementSummary` ve `type AnnouncementListParams` ekleyin.

- [ ] **Step 2: `summarizeAnnouncements`'ı emekliye ayır**

`packages/core/src/announcements/logic.ts` — fonksiyonu **silin** ve yerine bir yönlendirme yorumu bırakın:

```ts
// `summarizeAnnouncements` KALDIRILDI (C2, 2026-08-05). Sayaçlar artık
// `GET /api/v1/announcements/summary`'den gelir: sunucu sayfalamasından sonra
// istemcinin elinde yalnız BİR sayfa vardır ve satır sayarak üretilen sayaç
// "yayında 12" yerine "bu sayfada 8" derdi. Kart yapılandırması
// (`ANNOUNCEMENT_SUMMARY_CARD_CONFIG`) yerinde kalır — kartın hangi statüleri
// filtrelediğini hâlâ o söyler.
```

`isWithinDays` yardımcısının başka tüketicisi yoksa onu da silin (typecheck gösterir). `logic.test.ts`'teki `summarizeAnnouncements` describe bloğunu silin.

- [ ] **Step 3: `filterAnnouncements`'ın yeni rolünü belgele**

`packages/core/src/announcements/logic.ts`, `filterAnnouncements`'ın üstüne:

```ts
/**
 * ENVANTERDE ARTIK ÇAĞRILMAZ (C2): statü/tür/yayınlayan/acil/arama filtreleri
 * sunucuya taşındı. Fonksiyon, sunucu filtresi olmayan yüzeyler (onay kuyruğu,
 * şablondan gelen liste) ve testler için duruyor.
 *
 * Silinmedi çünkü `summaryCard` → statü kümesi eşlemesi hâlâ buradan okunuyor
 * ve aynı eşleme sunucu isteğini kurarken kullanılıyor — kural tek yerde.
 */
```

- [ ] **Step 4: Doğrula**

```bash
npm run test --workspace=@workspace/core && npm run test --workspace=@workspace/api
npm run typecheck --workspace=@workspace/core && npm run typecheck --workspace=@workspace/api
```

Beklenen: PASS. `apps/*` typecheck'i bu adımda **kırılır** — Task 7 ve 8 onları bağlayacak.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src packages/core/src
git commit -m "feat(announcements): hooklar sayfa ve filtre parametresi tasir"
```

---

### Task 6: MSW handler'ları sunucuyu taklit eder

Mock artık sunucu davranışını taklit etmezse ekranlar mock'ta çalışıp gerçekte kırılır. `paged()` yardımcısı bugün her şeyi tek sayfa olarak döndürüyor.

**Files:**
- Modify: `packages/api-mocks/src/announcements/announcement-handlers.ts:55-100`
- Modify: gelen kutusu ve liste handler'ları

**Interfaces:**
- Consumes: Task 1-3'ün uç sözleşmeleri.
- Produces: yok (yalnız mock).

- [ ] **Step 1: `paged` yardımcısını gerçek sayfalayıcı yap**

```ts
/** Sunucu davranışını taklit eder: filtre uygulanmış TÜM kümeden bir dilim. */
function paged<T>(items: T[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1)
  const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("pageSize") ?? 50) || 50))
  const totalCount = items.length
  const slice = items.slice((page - 1) * pageSize, page * pageSize)
  return {
    items: slice,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    hasPreviousPage: page > 1,
    hasNextPage: page * pageSize < totalCount,
  }
}
```

- [ ] **Step 2: Liste handler'ına sunucu filtrelerini ekle**

`GET */api/v1/announcements` handler'ında, `scopedRows(scope)` sonucunu döndürmeden önce:

```ts
    const url = new URL(request.url)
    const statuses = url.searchParams.getAll("status")
    const type = url.searchParams.get("type")
    const publisherId = url.searchParams.get("publisherId")
    const urgentOnly = url.searchParams.get("urgentOnly") === "true"
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase()

    // Sunucu aramasının AYNI kapsamı: başlık + metin + hedef etiketi, yalnız
    // küçük harfe indirgeme (aksan katlaması YOK — gerçek uçta da yok).
    const filtered = scopedRows(scope).filter((r) => {
      if (statuses.length > 0 && !statuses.includes(r.status)) return false
      if (type && r.type !== type) return false
      if (publisherId && r.publisherId !== publisherId) return false
      if (urgentOnly && !r.urgent) return false
      if (q) {
        const hay = `${r.title} ${r.body} ${r.audienceLabel}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })

    return HttpResponse.json(envelope(paged(filtered.map(toDto), url)))
```

Handler imzasını `({ request })` alacak şekilde güncelleyin.

- [ ] **Step 3: Özet handler'ını ekle**

Liste handler'ının yanına:

```ts
  http.get("*/api/v1/announcements/summary", ({ request }) => {
    const scope = new URL(request.url).searchParams.get("scope")
    const rows = scopedRows(scope)
    const now = Date.now()
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const within30 = (iso: string | null) =>
      iso !== null && now - Date.parse(iso) <= 30 * 24 * 60 * 60 * 1000

    return HttpResponse.json(
      envelope({
        published: rows.filter((r) => r.status === "published").length,
        scheduled: rows.filter((r) => r.status === "scheduled").length,
        draft: rows.filter((r) => r.status === "draft").length,
        last30: rows.filter(
          (r) =>
            ["published", "withdrawn", "expired"].includes(r.status) && within30(r.publishedAt),
        ).length,
        urgentThisMonth: rows.filter(
          (r) => r.urgent && r.publishedAt !== null && r.publishedAt >= monthStart,
        ).length,
      }),
    )
  }),
```

> **Rota sırası:** MSW handler'ları tanımlandıkları sırayla eşleşir. `summary` handler'ı, `:id` yakalayan handler'dan **önce** listelenmelidir.

- [ ] **Step 4: Gelen kutusu handler'ını sayfalı yap**

`GET */api/v1/announcements/inbox` handler'ında dönüşü `envelope(rows.map(toDto))` yerine `envelope(paged(rows.map(toDto), new URL(request.url)))` yapın; imzaya `({ request })` ekleyin.

- [ ] **Step 5: Doğrula**

```bash
npm run typecheck --workspace=@workspace/api-mocks && npm run lint --workspace=@workspace/api-mocks
```

Beklenen: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/api-mocks/src
git commit -m "feat(announcements): msw handlerlari sunucu sayfalamasini taklit eder"
```

---

### Task 7: Web envanteri ve arşivi sunucuya bağlanır

**Files:**
- Modify: `apps/web/features/announcements/announcements-page.tsx:100-116`
- Modify: `apps/web/features/announcements/inventory-tab.tsx:48,88-118,158-160,311-313`
- Modify: `apps/web/features/announcements/archive-tab.tsx`

**Interfaces:**
- Consumes: `useAnnouncements(params)`, `useAnnouncementSummary(scope)`, `AnnouncementPage`, `ANNOUNCEMENT_SUMMARY_CARD_CONFIG`.
- Produces: yok.

- [ ] **Step 1: Sayfa durumunu yukarı taşı**

`announcements-page.tsx` içinde sayfa numarası artık filtrelerle birlikte üst bileşende tutulur (iki sekme aynı kalıbı kullanır):

```tsx
  const [page, setPage] = useState(1)
  const [archivePage, setArchivePage] = useState(1)

  // Kart bir statü KÜMESİ seçer; sunucuya tam da o küme gider.
  const listParams = useMemo(
    () => ({
      scope: "school" as const,
      q: filters.query.trim() || undefined,
      statuses: filters.summaryCard
        ? ANNOUNCEMENT_SUMMARY_CARD_CONFIG[filters.summaryCard].statuses
        : filters.status
          ? [filters.status]
          : undefined,
      type: filters.type ?? undefined,
      publisherId: filters.publisherId ?? undefined,
      urgentOnly: filters.urgentOnly || undefined,
      page,
    }),
    [filters, page],
  )

  const listQuery = useAnnouncements(listParams)
  const summaryQuery = useAnnouncementSummary("school")
  const archiveQuery = useAnnouncements({ scope: "archive", page: archivePage })
```

Filtre değişince sayfayı 1'e döndürmek **olay anında** yapılır (mevcut `changeFilters` kalıbı); üst bileşendeki `onFilters` sarmalayıcısına `setPage(1)` ekleyin.

`InventoryTab` ve `ArchiveTab` prop'ları `rows: Announcement[]` yerine sayfa nesnesi ve sayaçları alır:

```tsx
<InventoryTab
  page={listQuery.data}
  summary={summaryQuery.data}
  loading={listQuery.isLoading}
  pageNo={page}
  onPageChange={setPage}
  /* mevcut diğer prop'lar aynen */
/>
```

- [ ] **Step 2: `InventoryTab`'ı sunucu sayfasına göre çiz**

`inventory-tab.tsx`:

```tsx
  // İstemci dilimlemesi KALKTI: satırlar zaten sunucudan tek sayfa geliyor.
  const rows = page?.rows ?? []
  const totalCount = page?.totalCount ?? 0
```

- `const summary = useMemo(() => summarizeAnnouncements(rows, now), …)` satırını **silin**; `summary` artık prop.
- `const visible = useMemo(() => sortAnnouncements(filterAnnouncements(rows, filters)), …)` satırını **silin**; sıralama ve filtre sunucuda.
- `const pageRows = visible.slice(...)` satırını **silin**; `rows` doğrudan çizilir. `pageRows.map(...)` → `rows.map(...)`, `pageRows.length` → `rows.length`.
- `PER_PAGE = 8` sabitini **silin**; `Pager` sunucu sayfasını sürer:

```tsx
        {!loading && rows.length > 0 && (
          <Pager
            page={pageNo}
            perPage={page?.pageSize ?? 25}
            count={totalCount}
            onPage={onPageChange}
          />
        )}
```

- Özet kartlarında `summary` yoksa iskelet gösterin: `{summary ? <div className="duy-sum">…</div> : <DuySummarySkeleton />}`.
- Arama kutusunun vaadini gerçeğe uydurun (satır 160):

```tsx
          placeholder="Başlık, metin veya hedef kitlede ara…"
```

> Arama kutusu artık her tuşta ağ isteği tetikler. `DuySearch` içinde debounce yoksa üst bileşende `onFilters` çağrısını 300 ms geciktirin; `filters.query` durumu anında güncellenir (kutu takılmasın), `listParams`'a giden değer gecikmelidir.

- [ ] **Step 3: `ArchiveTab`'ı aynı kalıba geçir**

`archive-tab.tsx`: `filterAnnouncements`/`sortAnnouncements`/`slice`/`PER_PAGE` kalkar; bileşen `page: AnnouncementPage | undefined`, `pageNo`, `onPageChange` prop'ları alır ve arama kutusu `onQueryChange` ile üst bileşene çıkar (sorgu artık sunucuya gider).

- [ ] **Step 4: Doğrula**

```bash
npm run typecheck --workspace=@workspace/web && npm run lint --workspace=@workspace/web
```

Beklenen: PASS.

- [ ] **Step 5: Duman testi**

```bash
npm run dev --workspace=@workspace/web
```

Elle doğrulayın:
1. Envanterde 25'ten fazla kayıt varken 2. sayfaya geçilebiliyor ve satırlar tekrar etmiyor.
2. "Yayında" kartındaki sayı, 2. sayfaya geçince **değişmiyor**.
3. Karta tıklayınca liste o statülere daralıyor ve sayfa 1'e dönüyor.
4. Aramada başlık, metin ve hedef kitle eşleşmesi çalışıyor.

- [ ] **Step 6: Commit**

```bash
git add apps/web/features/announcements
git commit -m "feat(announcements): web envanteri ve arsivi sunucu sayfalamasina baglandi"
```

---

### Task 8: Mobil envanter ve gelen kutusu "daha fazla yükle" kazanır

Mobilde sayfa numarası yerine biriktirmeli liste doğru kalıptır; tablo değil akış var.

**Files:**
- Modify: `apps/mobile/src/app/(tabs)/announcements.tsx`
- Modify: `apps/mobile/src/app/(tabs)/my-announcements.tsx`
- Modify: `apps/mobile/src/app/(tabs)/announcements-inbox.tsx`
- Modify: `apps/mobile/src/features/announcements/components/admin-announcements-screen.tsx:88-95`
- Modify: `apps/mobile/src/features/announcements/components/announcement-inbox-screen.tsx:151-161`

**Interfaces:**
- Consumes: `useAnnouncements(params)`, `useAnnouncementSummary(scope)`, `useAnnouncementInbox(childId, page)`.
- Produces: yok.

- [ ] **Step 1: Rota ekranlarında biriktirme durumu**

Üç ekranın her birinde aynı kalıp (`announcements.tsx` örneği):

```tsx
  const [page, setPage] = useState(1);
  const listQuery = useAnnouncements({ scope: 'school', page });
  const summaryQuery = useAnnouncementSummary('school');

  // Sayfalar biriktirilir: mobilde liste bir AKIŞTIR, sayfa numarası değil.
  // `placeholderData` sayesinde önceki sayfa ekranda kalır, bu yüzden
  // biriktirme sırasında liste zıplamaz.
  const [rows, setRows] = useState<Announcement[]>([]);
  useEffect(() => {
    const incoming = listQuery.data;
    if (!incoming) return;
    setRows((prev) =>
      incoming.page === 1 ? incoming.rows : [...prev, ...incoming.rows.filter(
        (r) => !prev.some((p) => p.id === r.id),
      )],
    );
  }, [listQuery.data]);
```

`AdminAnnouncementsScreen`'e `rows`, `summary={summaryQuery.data}`, `hasMore={listQuery.data?.hasNextPage ?? false}` ve `onLoadMore={() => setPage((p) => p + 1)}` prop'larını geçirin.

- [ ] **Step 2: `AdminAnnouncementsScreen`'i uyarlayın**

- `summarizeAnnouncements` çağrısını **silin**, `summary` prop olarak alın.
- `filterAnnouncements(source, { status, urgentOnly })` çağrısını kaldırıp bu iki değeri üst bileşene çıkarın; üst bileşen onları `useAnnouncements` parametrelerine yazar (`statuses: status ? [status] : undefined`, `urgentOnly`).
- Listenin sonuna:

```tsx
        {hasMore ? (
          <Pressable onPress={onLoadMore} disabled={loading}>
            <Note icon="download">{loading ? 'Yükleniyor…' : 'Daha fazla yükle'}</Note>
          </Pressable>
        ) : null}
```

- [ ] **Step 3: Gelen kutusunu uyarlayın**

`announcements-inbox.tsx` aynı biriktirme kalıbını `useAnnouncementInbox(activeChildId, page)` ile kurar. **Çocuk değişince biriktirme sıfırlanmalıdır:**

```tsx
  useEffect(() => {
    setPage(1);
    setRows([]);
  }, [activeChildId]);
```

`AnnouncementInboxScreen` içinde `filterInbox` çağrıları **kalır** — görünürlük kapısı (`INBOX_ANNOUNCEMENT_STATUSES`) ve çip/çocuk daraltması istemci savunmasıdır ve sunucu yanlış veri döndürse bile tutar. Yalnız `query` kolu artık boş geçilir; arama gelen kutusunda sunucuya taşınmaz (uçta `q` parametresi yoktur ve bu görev onu eklemez).

- [ ] **Step 4: Doğrula**

```bash
npm run typecheck --workspace=@workspace/mobile && npm run lint --workspace=@workspace/mobile
```

Beklenen: PASS.

- [ ] **Step 5: Duman testi**

```bash
npm run dev --workspace=@workspace/mobile
```

Elle doğrulayın: 25'ten fazla kayıtta "Daha fazla yükle" görünüyor, basınca liste büyüyor, tekrarlı satır yok; veli çocuk değiştirince liste baştan başlıyor.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(announcements): mobil liste ve gelen kutusu sayfa biriktirmeye gecti"
```

---

## Kapanış doğrulaması

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format && dotnet build && dotnet test --filter "FullyQualifiedName~Announcement"

cd /Users/farukkaya/Repositories/oksis-ui
npm run test --workspace=@workspace/core && npm run test --workspace=@workspace/api
npm run typecheck && npm run lint
```

Sonra `oksis` deposunda:
- `docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` §14'teki "Sayfalama (`pageSize` 200 sabit)" satırı **Yapıldı** olarak işaretlenir; §17'ye C2'de ölçülen riskler eklenir.
- Modül dokümanlarındaki uç envanterine `GET /announcements/summary` eklenir (18. operasyon).

> **DÜZELTME (2026-08-05, Task 8 gözden geçirmesi).** Bu bölümün ilk sürümü doküman
> yolunu `docs/modules/announcements/` diye veriyordu. **O dizin yok** — gerçek konum
> `.claude/docs/modules/announcements/`. Ayrıca ölçüldüğünde ortaya çıktı ki oradaki
> `api-contracts.md` hâlâ **jenerik CRUD şablonu**: `DELETE /api/v1/announcements/{id}`
> ve `announcements.view-detail` / `announcements.delete` izinlerini listeliyor.
> Üçü de spec §15'in temizlenmesini istediği artıklar ve INV-1 ile çelişiyor
> (duyuru silinmez, `DELETE` ucu yazılmadı). Yani modül dokümanı A/B/C fazlarının
> hiçbirinden sonra güncellenmemiş; `summary` eklemek tek başına yetmez, doküman
> gerçek uç envanterine göre yeniden yazılmalıdır. Bu C2'nin kapsamından büyük ve
> kullanıcı kararına bırakıldı.
