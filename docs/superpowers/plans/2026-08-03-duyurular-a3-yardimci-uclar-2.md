# Duyurular A3 — Yardımcı Uçlar, Job'lar ve Ek Dosya (Görev 7–12)

> Bu dosya `2026-08-03-duyurular-a3-yardimci-uclar.md`'nin devamıdır.
> **Global Constraints, doğrulanmış şekiller ve D-1..D-4 düzeltmeleri o dosyadadır ve
> buradaki her görev için de bağlayıcıdır.** Görev dosyası ayrımı yalnız uzunluk içindir.

---

## Görev 7: `GET /publishers` — yayınlayan filtresi

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementPublisherDto.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementPublishers/GetAnnouncementPublishersQuery.cs`
- Create: `.../GetAnnouncementPublishersQueryHandler.cs`
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementPublishersTests.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs`

**Interfaces:**
- Consumes: `AnnouncementCallerResolver.CanUseInventoryAsync(permissionReader, ct)` (mevcut).
- Produces: `AnnouncementPublisherDto { Id, Name }`, `GetAnnouncementPublishersQuery()`.
  Görev 9 controller'dan çağırır.

**Kontrat gerçeği:** `paths.ts:332` — `GET /api/v1/announcements/publishers` →
`Wrapped<AnnouncementPublisherDto[]>`. `contract.ts:126`:

```ts
/** Yayınlayan filtresi seçenekleri — listeyle aynı istekte dönmez, ayrı uç. */
export interface AnnouncementPublisherDto {
  id: string
  name: string
}
```

**D-2 uygulanır:** izin `announcements.view`, ama handler envantere daraltır. Gerekçeyi
ana dosyadan oku — özet: `announcements.view` VELİDE ve ÖĞRENCİDE de vardır (gelen kutusu
için); daraltmasız bir `/publishers` her veliye okulun personel listesini ve `Person.Id`
kümesini verirdi.

- [ ] **Step 1: Failing entegrasyon testlerini yaz**

> **PLAN DÜZELTMESİ (2026-08-04, kontrolör).** Bu adımın önceki sürümü
> `AnnouncementAudienceFixture.BuildAsync(_db)` ve bir `Scene` tipi kullanıyordu.
> **İKİSİ DE YOKTUR — uydurmaydı.** Fixture'ın gerçek yüzeyi depodan okundu:
>
> | Uydurma (SİLİNDİ) | Gerçek |
> |---|---|
> | `AnnouncementAudienceFixture.BuildAsync(db)` | `AnnouncementAudienceFixture.CreateAsync(DatabaseFixture database, bool teacherIsAlsoParent = false)` — fixture'ın KENDİSİNİ döner, `IAsyncDisposable` |
> | `Scene` tipi, `_scene.SchoolId` | `fixture.AdminScope.SchoolId` (`AudienceScope`) |
> | `_scene.TeacherPersonId` / `AdminPersonId` | `fixture.TeacherPersonId` / `fixture.AdminPersonId` (doğru, aynen var) |
> | elle `SeedPublishedAsync` yazmak | `fixture.CreateAnnouncementAsync(title, body, audience, asDraft:)` (yönetici imzasıyla yayınlar) ve `fixture.CreateAnnouncementAsAsync(accountId, title, body, audience, asDraft:, scheduledAt:, urgent:)` |
>
> `audience` parametresi `IReadOnlyList<(string Dimension, string Key, string Bucket)>`'tır —
> örnek: `[("all", "all", "parent")]`.
>
> `FakeCurrentUser` / `FakePermissionReader` / `FakeTenantContext` bu depoda **paylaşılan
> tipler değildir**; her test dosyası kendi `private sealed class`'ını yazar
> (`Attendance/AttendanceExcuseTests.cs` emsali). Sen de öyle yap.
>
> **Kurulum kalıbının tek doğru emsali `GetAnnouncementsTests.cs`'tir — ONU OKU ve izle.**
> **`AnnouncementAudienceFixture.cs`'ye SATIR EKLEME** (A1'de bu iki kez sessizce altı testi
> kırdı).

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementPublishersTests.cs`
oluştur. **Aşağıdaki yedi testin ADLARI ve DOC YORUMLARI plan-mandated'dır** — birebir
kullan, zayıflatma, silme. Kurulum kodunu `GetAnnouncementsTests.cs`'ten alarak sen yaz.

```csharp
/// <summary>
/// Yayınlayan filtresi seçenekleri (A3 dilim 6). Envanter listesindeki `?publisherId=`
/// filtresinin seçenek kaynağıdır — yani bir YÖNETİM yüzeyidir.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class GetAnnouncementPublishersTests(DatabaseFixture database)
{
    // Kurulum: GetAnnouncementsTests kalıbı. Her test kendi fixture'ını kurar:
    //   await using var fixture = await AnnouncementAudienceFixture.CreateAsync(database);
    // Handler doğrudan kurulur:
    //   await using var db = database.CreateDbContext(fixture.AdminScope.SchoolId);
    //   var handler = new GetAnnouncementPublishersQueryHandler(db, tenant, permissions);

    /// <summary>
    /// D-2: `announcements.view` velide ve öğrencide de vardır. Envanter yetkisi olmayan
    /// çağıran okulun personel listesini GÖRMEZ — bu bir roster sızıntısı olurdu.
    /// </summary>
    [Fact]
    public async Task Should_ReturnForbidden_When_CallerCannotUseInventory() { }

    /// <summary>Aynı kişi iki duyuru yayınladıysa filtrede BİR kez görünür.</summary>
    [Fact]
    public async Task Should_ReturnDistinctPublishers_When_OnePersonPublishedTwice() { }

    /// <summary>
    /// Kurumsal duyuruda `PublisherLabel` "Okul Müdürlüğü"dür — filtre etiketi olarak
    /// kullanılırsa üç farklı yönetici tek satıra çöker ve `publisherId` filtresi
    /// anlamsızlaşır. Bu yüzden ad `PublisherRealName`'den gelir.
    /// </summary>
    [Fact]
    public async Task Should_UseRealName_When_PublisherLabelIsInstitutional() { }

    /// <summary>Gerçek ad yoksa etikete düşülür.</summary>
    [Fact]
    public async Task Should_FallBackToLabel_When_RealNameIsNull() { }

    /// <summary>
    /// Filtre seçenekleri BAŞKA OKULUN yayınlayanlarını içeremez. Bu testin ayırt ediciliği,
    /// handler'ın `SchoolId` yüklemini gerçekten taşıdığını göstermesidir.
    /// İkinci bir okul için İKİNCİ bir `AnnouncementAudienceFixture.CreateAsync` çağır —
    /// her çağrı kendi okulunu kurar.
    /// </summary>
    [Fact]
    public async Task Should_ExcludePublishers_When_TheyBelongToAnotherSchool() { }

    /// <summary>
    /// TASLAK duyurunun yayınlayanı filtrede GÖRÜNMEZ — filtre, envanterde GÖRÜNEN
    /// duyuruların yayınlayanlarıdır; hiç yayınlanmamış bir taslağın sahibi bir filtre
    /// seçeneği değildir ve seçilirse boş sonuç verirdi.
    /// (`asDraft: true` ile kur.)
    /// </summary>
    [Fact]
    public async Task Should_ExcludePublisher_When_TheyOnlyHaveDrafts() { }

    /// <summary>Seçenekler ada göre sıralı döner.</summary>
    [Fact]
    public async Task Should_OrderByName_When_PublishersAreReturned() { }
}
```

> **Doc yorumlarındaki her iddiayı harfiyen sına.** "Benzer bir şey" yazma, iddiayı
> zayıflatma. `Should_FallBackToLabel_When_RealNameIsNull` için `PublisherRealName`'i
> null olan bir satıra ihtiyacın var — fixture bunu üretmiyorsa duyuruyu fixture ile
> oluşturup ardından `PublisherRealName`'i doğrudan veritabanında null'a çekmen
> gerekebilir; hangi yolu seçtiğini rapora yaz.

- [ ] **Step 2: Testlerin DERLENMEDİĞİNİ doğrula**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementPublishersTests"
```

Beklenen: derleme hatası.

- [ ] **Step 3: DTO'yu yaz**

```csharp
namespace Oksis.Application.Modules.Announcements.DTOs;

/// <summary>
/// Yayınlayan filtresi seçeneği — <c>contract.ts</c>'teki <c>AnnouncementPublisherDto</c>
/// ile BİREBİR (iki alan). Envanter listesindeki <c>?publisherId=</c> parametresinin
/// seçenek kaynağıdır; listeyle aynı istekte dönmez, ayrı uçtur.
/// </summary>
public sealed record AnnouncementPublisherDto
{
    public required string Id { get; init; }
    public required string Name { get; init; }
}
```

- [ ] **Step 4: Sorguyu ve handler'ı yaz**

`GetAnnouncementPublishersQuery.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementPublishers;

/// <summary>
/// Envanter filtresinin yayınlayan seçenekleri.
///
/// <para><b>İzin <c>announcements.view</c>, ama handler ENVANTERE daraltır (A3 D-2).</b>
/// Spec §6 tablosu bu uca <c>view</c> yazar ve ek daraltma kolonu boştur; ama
/// <c>announcements.view</c> VELİDE ve ÖĞRENCİDE de vardır (gelen kutusu için).
/// Daraltmasız bir <c>/publishers</c> her veliye okulun tüm personelinin adını ve
/// <c>Person.Id</c>'sini verirdi — bir roster sızıntısı. <c>GetAnnouncementsQuery</c> tam
/// olarak aynı kalıbı kullanır: <c>view</c> ilan eder, envanteri <c>create</c> ile kapatır.
/// İki katman birbirinin yerine geçmez (spec §4).</para>
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.view")]
public sealed record GetAnnouncementPublishersQuery : IQuery<IReadOnlyList<AnnouncementPublisherDto>>;
```

`GetAnnouncementPublishersQueryHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementPublishers;

/// <summary>
/// Envanterde GÖRÜNEN duyuruların yayınlayanları.
///
/// <para><b>Taslak dışlanır:</b> hiç yayınlanmamış bir taslağın sahibi bir filtre seçeneği
/// değildir — seçilirse boş sonuç verirdi. Geri çekilmiş ve süresi dolmuş duyurular ise
/// envanterde DURUR (yönetim onları görür), dolayısıyla yayınlayanları da filtrede kalır.</para>
///
/// <para><b>Ad <c>PublisherRealName</c>'den gelir</b>, <c>PublisherLabel</c>'den değil:
/// kurumsal duyuruda etiket "Okul Müdürlüğü"dür ve üç farklı yöneticiyi tek satıra
/// çökertirdi. Etiket yalnız gerçek ad yoksa yedek olarak kullanılır.</para>
/// </summary>
public sealed class GetAnnouncementPublishersQueryHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IPermissionReader permissionReader)
    : IQueryHandler<GetAnnouncementPublishersQuery, IReadOnlyList<AnnouncementPublisherDto>>
{
    public async Task<Result<IReadOnlyList<AnnouncementPublisherDto>>> Handle(
        GetAnnouncementPublishersQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<IReadOnlyList<AnnouncementPublisherDto>>.Forbidden();
        }

        // A3 D-2 — envanter yüzeyi. Veli/öğrenci `announcements.view` taşır ama bu liste
        // onların değildir.
        if (!await AnnouncementCallerResolver.CanUseInventoryAsync(permissionReader, cancellationToken))
        {
            return Result<IReadOnlyList<AnnouncementPublisherDto>>.Forbidden();
        }

        var rows = await db.Announcements.AsNoTracking()
            .Where(a => a.SchoolId == schoolId && a.Status != AnnouncementStatus.Draft)
            .Select(a => new
            {
                a.PublisherId,
                Name = a.PublisherRealName ?? a.PublisherLabel,
            })
            .Distinct()
            .ToListAsync(cancellationToken);

        // Aynı kişi hem kurumsal hem sınıf imzasıyla yayınladıysa `Distinct` iki satır
        // döndürür (adlar farklı). Kimlik başına TEK satır garantisi burada verilir.
        var publishers = rows
            .GroupBy(r => r.PublisherId)
            .Select(g => new AnnouncementPublisherDto
            {
                Id = g.Key.ToString(),
                Name = g.Select(x => x.Name).OrderBy(n => n, StringComparer.Ordinal).First(),
            })
            .OrderBy(p => p.Name, StringComparer.CurrentCulture)
            .ToList();

        return Result<IReadOnlyList<AnnouncementPublisherDto>>.Success(publishers);
    }
}
```

- [ ] **Step 5: İzin yüzeyi tablosuna satır ekle**

```csharp
        yield return [typeof(GetAnnouncementPublishersQuery), "announcements.view"];
```

- [ ] **Step 6: Testleri koş**

```bash
docker compose up -d garage && ./scripts/init-garage.sh
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementPublishersTests"
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementPermissionSurfaceTests"
```

- [ ] **Step 7: Mutasyon denetimi — D-2 daraltmasının ayırt edici olduğunu kanıtla**

`CanUseInventoryAsync` kontrolünü GEÇİCİ olarak kaldır ve testi koş.
Beklenen: `Should_ReturnForbidden_When_CallerCannotUseInventory` **FAIL**, diğerleri PASS.
Mutasyonu GERİ AL, tekrar koş (hepsi PASS) ve iki gözlemi de rapora yaz.

- [ ] **Step 8: Dört süiti koş, deltaları doğrula, commit**

```bash
git add src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementPublisherDto.cs \
        src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementPublishers/ tests/
git commit -m "feat(api): yayinlayan filtresi ucu eklendi

Izin announcements.view (spec §6) ama handler envantere daraltir: o izin velide ve
ogrencide de var, daraltmasiz uc okulun personel listesini sizdirirdi. Ad
PublisherRealName'den gelir, kurumsal etiket uc yoneticiyi tek satira cokertirdi."
```

---

## Görev 8: `GET /{id}/delivery-report` — gönderim raporu

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/DTOs/DeliveryReportDto.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementDeliveryReport/GetAnnouncementDeliveryReportQuery.cs`
- Create: `.../GetAnnouncementDeliveryReportQueryHandler.cs`
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementDeliveryReportTests.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs`

**Interfaces:**
- Consumes: `AnnouncementLifecycleGuard.ResolveCallerAsync` + `CanActOn` (mevcut).
- Produces: `DeliveryReportDto`, `GetAnnouncementDeliveryReportQuery(Guid Id)`.

**Kontrat gerçeği:** `contract.ts:65`

```ts
export interface DeliveryReportDto {
  announcementId: string
  total: number
  reached: number
  seen: number
  channels: Array<{ channel: DeliveryChannel; sent: number; of: number }>
  unreachable: Array<{ name: string; roleLabel: string; reason: string }>
}
```

**Spec §10 — açıkça sınırlı rapor.** Teknik analiz §3.6 seçenek (A):

- `channels` **TEK satır** döner (`inApp`). Frontend tek kanal gördüğünde kanal tablosunu
  GİZLER. Yönetici gitmemiş bir e-postayı "gönderildi" olarak okumaz.
- `unreachable` **bugün gerçek veri üretir**: `Person.LinkedAccountId == null` olan alıcılar
  = "uygulamayı hiç kurmamış". `reason` = "Hesap bağlı değil".
- **D-4:** `unreachable` listesi en çok **100** satır döner; kesin sayı `total - reached`
  ile türetilir. Sessiz kısaltma yasaktır — sınır testle sabitlenir.

**Yetki:** izin `announcements.report.view` (spec §6). Öğretmen yalnız KENDİ duyurusunun
raporunu görür → `AnnouncementLifecycleGuard.CanActOn` (sahip VEYA yönetim).
`GetAnnouncementAuditTrailQueryHandler` aynı kalıbı kullanır — **onu OKU ve birebir izle**.

- [ ] **Step 1: Failing entegrasyon testlerini yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementDeliveryReportTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Announcements.Queries.GetAnnouncementDeliveryReport;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// Gönderim raporu (A3 dilim 6, spec §10 — <b>açıkça sınırlı</b>).
///
/// <para>Rapor yalnız <c>inApp</c> + görülme ile çıkar. Kanal kırılımı tablosu gizlenir:
/// <c>channels</c> TEK satır döner ve frontend tek kanal gördüğünde tabloyu göstermez.
/// Sunucuda <c>INotificationChannel</c> olarak yalnız <c>InAppNotificationChannel</c>
/// kayıtlıdır; e-posta/push kanalı YOKTUR. Rapor bu sınırı GİZLEMEZ.</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class GetAnnouncementDeliveryReportTests : IAsyncLifetime
{
    // ... fixture kurulumu GetAnnouncementAuditTrailTests ile AYNI kalıpta ...

    /// <summary>
    /// Üç sayı üç FARKLI kümeden gelir ve testin ayırt ediciliği bunların birbirine
    /// eşitlenmemesindedir: 5 alıcı, 3'ünün hesabı bağlı, 2'si okumuş.
    /// </summary>
    [Fact]
    public async Task Should_CountTotalReachedAndSeenIndependently_When_ReportIsBuilt()
    {
        // 5 alıcı: 3 bağlı hesaplı (ikisi okumuş), 2 hesapsız
        // → total 5, reached 3, seen 2
        // (Kurulum, alıcıların Person.LinkedAccountId'sini AÇIKÇA ayarlar.)
    }

    /// <summary>
    /// <c>channels</c> TEK satır — kanal kırılımı bugün üretilemez ve rapor onu uydurmaz
    /// (spec §10). Duyuru <c>email</c>/<c>push</c> kanalı seçmiş olsa BİLE tek satır döner:
    /// seçilen kanal ile ÇALIŞAN kanal aynı şey değildir.
    /// </summary>
    [Fact]
    public async Task Should_ReturnSingleInAppChannelRow_When_AnnouncementSelectedMultipleChannels()
    {
        // Duyuru inApp + email + push ile yayınlanır.
        // report.Channels.Should().ContainSingle();
        // report.Channels[0].Channel.Should().Be("inApp");
        // report.Channels[0].Sent.Should().Be(report.Reached);
        // report.Channels[0].Of.Should().Be(report.Total);
    }

    /// <summary>
    /// <c>unreachable</c> gerçek veridir: bağlı hesabı olmayan alıcı "uygulamayı hiç
    /// kurmamış"tır. Gerekçe uydurma değildir ve tek bir dize kullanır.
    /// </summary>
    [Fact]
    public async Task Should_ListUnreachableRecipients_When_TheyHaveNoLinkedAccount()
    {
        // report.Unreachable.Should().ContainSingle();
        // report.Unreachable[0].Name.Should().Be("<alıcının adı>");
        // report.Unreachable[0].RoleLabel.Should().Be("<AnnouncementRecipient.RoleAtPublish>");
        // report.Unreachable[0].Reason.Should().Be("Hesap bağlı değil");
    }

    /// <summary>
    /// D-4: liste 100 satırla SINIRLIDIR ve bu sınır sessiz değildir — kesin sayı
    /// <c>total - reached</c> ile türetilebilir ve bu test onu da doğrular. Sınır olmasaydı
    /// 1200 kişilik bir okulun okul geneli duyurusu binlerce satırlık bir yanıt üretirdi.
    /// </summary>
    [Fact]
    public async Task Should_CapUnreachableListAt100_While_KeepingCountsExact()
    {
        // 105 hesapsız alıcı kurulur.
        // report.Unreachable.Should().HaveCount(100);
        // (report.Total - report.Reached).Should().Be(105);
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_AnnouncementBelongsToAnotherSchool() { }

    /// <summary>
    /// Öğretmen BAŞKASININ duyurusunun raporunu göremez. <c>CanActOn</c> sahip VEYA yönetim
    /// der; bu test sahiplik kolunu izole eder (yönetim kolu ayrı testte).
    /// </summary>
    [Fact]
    public async Task Should_ReturnForbidden_When_TeacherRequestsAnotherPublishersReport() { }

    [Fact]
    public async Task Should_Succeed_When_ManagerRequestsAnotherPublishersReport() { }

    /// <summary>
    /// Taslakta alıcı YOKTUR (materyalizasyon yayın anındadır). Rapor sıfırlarla döner,
    /// patlamaz — yönetici taslağın raporunu açtığında 500 görmemelidir.
    /// </summary>
    [Fact]
    public async Task Should_ReturnZeroes_When_AnnouncementIsStillADraft() { }
}
```

> **UYARI — bu testler İSKELETTİR ve implementer onları DOLDURUR.** Bu, planın başka
> hiçbir yerinde yapılmayan bir istisnadır ve gerekçesi şudur: kurulum kodu tamamen
> `AnnouncementAudienceFixture`'ın gerçek şekline bağlıdır ve o şekli plan yazarken
> tam olarak kopyalamak, uydurma bir API'yi plana yazma riskini taşırdı (A1'de dokuz
> tahminin dokuzu da yanlış çıkmıştı).
>
> **Implementer'ın yükümlülüğü:** `GetAnnouncementAuditTrailTests.cs` ile
> `MarkAnnouncementReadTests.cs`'yi OKU (ikisi de alıcı satırı kuran testlerdir), kurulum
> kalıbını oradan al, ve **yukarıdaki her testin doc yorumundaki iddiayı harfiyen sına**.
> Doc yorumları plan-mandated'dır: silme, zayıflatma, "benzer bir şey" yazma.
> `Should_CapUnreachableListAt100_While_KeepingCountsExact` testinde 105 alıcı kurmak
> pahalıysa sınırı `internal const int` yapıp testte ondan oku — ama sınırı test etmeden
> geçme.

- [ ] **Step 2: Testlerin DERLENMEDİĞİNİ doğrula**

- [ ] **Step 3: DTO'yu yaz**

`src/Oksis.Application/Modules/Announcements/DTOs/DeliveryReportDto.cs`:

```csharp
namespace Oksis.Application.Modules.Announcements.DTOs;

/// <summary>
/// Gönderim raporu — <c>contract.ts</c>'teki <c>DeliveryReportDto</c> ile BİREBİR.
///
/// <para><b>Açıkça sınırlıdır (spec §10).</b> <see cref="Channels"/> TEK satır döner
/// (<c>inApp</c>): sunucuda kayıtlı tek <c>INotificationChannel</c> odur. Frontend tek kanal
/// gördüğünde kırılım tablosunu gizler — yönetici gitmemiş bir e-postayı "gönderildi" diye
/// okumaz. Kanal kırılımı, teslim kanalları (D fazı) geldiğinde gerçek veriyle dolar.</para>
/// </summary>
public sealed record DeliveryReportDto
{
    public required string AnnouncementId { get; init; }

    /// <summary>Materyalize edilmiş alıcı satırı sayısı.</summary>
    public required int Total { get; init; }

    /// <summary>Bağlı hesabı olan alıcı sayısı — bildirimin ULAŞABİLDİĞİ küme.</summary>
    public required int Reached { get; init; }

    /// <summary>Duyuruyu açmış alıcı sayısı (<c>AnnouncementRecipient.IsRead</c>).</summary>
    public required int Seen { get; init; }

    public required IReadOnlyList<DeliveryChannelStatDto> Channels { get; init; }

    /// <summary>
    /// Ulaşılamayan alıcılar. <b>En çok <see cref="UnreachableLimit"/> satır</b> döner
    /// (A3 D-4) — kesin sayı <c>Total - Reached</c> ile türetilir. Sınır olmasaydı 1200
    /// kişilik bir okulun okul geneli duyurusu binlerce satırlık bir yanıt üretirdi.
    /// </summary>
    public required IReadOnlyList<UnreachableRecipientDto> Unreachable { get; init; }

    /// <summary>A3 D-4 — <see cref="Unreachable"/> listesinin üst sınırı.</summary>
    public const int UnreachableLimit = 100;
}

public sealed record DeliveryChannelStatDto
{
    public required string Channel { get; init; }
    public required int Sent { get; init; }
    public required int Of { get; init; }
}

public sealed record UnreachableRecipientDto
{
    public required string Name { get; init; }
    public required string RoleLabel { get; init; }
    public required string Reason { get; init; }
}
```

- [ ] **Step 4: Sorguyu ve handler'ı yaz**

`GetAnnouncementDeliveryReportQuery.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementDeliveryReport;

/// <summary>
/// Duyurunun gönderim raporu. Öğretmen yalnız KENDİ duyurusunun raporunu görür
/// (spec §6 — denetim iziyle aynı daraltma).
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.report.view")]
public sealed record GetAnnouncementDeliveryReportQuery(Guid Id) : IQuery<DeliveryReportDto>;
```

`GetAnnouncementDeliveryReportQueryHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementDeliveryReport;

/// <summary>
/// Gönderim raporu (spec §10 — seçenek A).
///
/// <para><b>Üç sayı ÜÇ FARKLI kümeden gelir</b> ve birbirine eşitlenemez:
/// <c>Total</c> materyalize alıcı satırı sayısı, <c>Reached</c> bağlı hesabı olanlar,
/// <c>Seen</c> okuyanlar. "Ulaştı" ile "görüldü" arasındaki fark, raporun bütün değeridir.</para>
///
/// <para><b>Kanal kırılımı GİZLENİR:</b> <c>Channels</c> tek satır döner. Duyuru
/// <c>email</c>/<c>push</c> seçmiş olsa bile — seçilen kanal ile ÇALIŞAN kanal aynı şey
/// değildir ve sunucuda kayıtlı tek kanal <c>InAppNotificationChannel</c>'dır. Bu sınır
/// yazılı beyandır (spec §16), gizlenmez.</para>
/// </summary>
public sealed class GetAnnouncementDeliveryReportQueryHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader)
    : IQueryHandler<GetAnnouncementDeliveryReportQuery, DeliveryReportDto>
{
    public async Task<Result<DeliveryReportDto>> Handle(
        GetAnnouncementDeliveryReportQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<DeliveryReportDto>.Forbidden();
        }

        var callerResult = await AnnouncementLifecycleGuard.ResolveCallerAsync(
            db, currentUser, permissionReader, cancellationToken);
        if (callerResult.IsFailure)
        {
            return Result<DeliveryReportDto>.Forbidden();
        }

        var caller = callerResult.Value!;

        var announcement = await db.Announcements.AsNoTracking()
            .SingleOrDefaultAsync(a => a.Id == request.Id && a.SchoolId == schoolId, cancellationToken);

        if (announcement is null)
        {
            return Result<DeliveryReportDto>.NotFound();
        }

        if (!AnnouncementLifecycleGuard.CanActOn(announcement, caller))
        {
            return Result<DeliveryReportDto>.Forbidden();
        }

        // Alıcı satırları ile Person tek sorguda birleşir: alıcı başına ayrı sorgu N+1
        // üretirdi (okul geneli duyuruda 1200 sorgu).
        var rows = await (
            from r in db.AnnouncementRecipients.AsNoTracking()
            join p in db.Persons.AsNoTracking() on r.PersonId equals p.Id
            where r.AnnouncementId == announcement.Id && r.SchoolId == schoolId
            select new
            {
                r.IsRead,
                r.RoleAtPublish,
                HasAccount = p.LinkedAccountId != null,
                Name = p.Name.First + " " + p.Name.Last,
            }).ToListAsync(cancellationToken);

        var total = rows.Count;
        var reached = rows.Count(r => r.HasAccount);
        var seen = rows.Count(r => r.IsRead);

        var unreachable = rows
            .Where(r => !r.HasAccount)
            .OrderBy(r => r.Name, StringComparer.CurrentCulture)
            .Take(DeliveryReportDto.UnreachableLimit)
            .Select(r => new UnreachableRecipientDto
            {
                Name = r.Name,
                RoleLabel = r.RoleAtPublish,
                // Tek gerekçe: bugün ulaşılamamanın tek gerçek nedeni budur. E-posta geri
                // dönüşü (bounce) teslim kanalları (D) geldiğinde ikinci bir gerekçe ekler.
                Reason = "Hesap bağlı değil",
            })
            .ToList();

        return Result<DeliveryReportDto>.Success(new DeliveryReportDto
        {
            AnnouncementId = announcement.Id.ToString(),
            Total = total,
            Reached = reached,
            Seen = seen,
            Channels =
            [
                new DeliveryChannelStatDto
                {
                    Channel = AnnouncementEnumWire.ToWire(DeliveryChannel.InApp),
                    Sent = reached,
                    Of = total,
                },
            ],
            Unreachable = unreachable,
        });
    }
}
```

> **Implementer'a not:** `p.Name.First`/`p.Name.Last` erişiminin LINQ'e çevrildiğini
> `CreateAnnouncementCommandHandler.ResolveRealNameAsync` zaten kanıtlıyor (aynı projeksiyon).
> `AnnouncementEnumWire.ToWire(DeliveryChannel)` overload'ının VAR olduğunu dosyadan doğrula
> — yoksa doğru metot adını kullan ve rapora yaz.

- [ ] **Step 5: İzin yüzeyi tablosuna satır ekle**

```csharp
        yield return [typeof(GetAnnouncementDeliveryReportQuery), "announcements.report.view"];
```

- [ ] **Step 6: Testleri koş**

- [ ] **Step 7: Zorunlu mutasyon denetimi — üç sayının ayrıştığını kanıtla**

`Reached = reached` yerine GEÇİCİ olarak `Reached = total` yaz ve testleri koş.
Beklenen: `Should_CountTotalReachedAndSeenIndependently_When_ReportIsBuilt` **VE**
`Should_ReturnSingleInAppChannelRow_...` (`Sent == Reached` iddiası) kırılır.
**Tam olarak kaç testin öldüğünü** rapora yaz — "hiçbiri" veya "hepsi" cevabı, testlerin
üç sayıyı gerçekten ayırmadığını gösterir ve bu durumda testler DÜZELTİLİR.
Mutasyonu GERİ AL.

- [ ] **Step 8: Dört süiti koş, deltaları doğrula, commit**

```bash
git add src/Oksis.Application/Modules/Announcements/DTOs/DeliveryReportDto.cs \
        src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementDeliveryReport/ tests/
git commit -m "feat(api): gonderim raporu ucu eklendi

Spec §10 secenek A: kanal kirilimi tek satir doner ve frontend tabloyu gizler.
Ulasilamayanlar gercek veridir (LinkedAccountId null) ve liste 100 satirla
sinirlidir; kesin sayi total-reached ile turetilir."
```

---

## Görev 9: Controller'a iki uç + 403 ilanları + sayı 15→17

**Files:**
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Modify: `tests/Oksis.Api.UnitTests/Controllers/V1/AnnouncementsControllerTests.cs`

**Interfaces:**
- Consumes: Görev 7 ve 8'in sorguları.
- Produces: `/api/v1/announcements/publishers` ve `/api/v1/announcements/{id}/delivery-report`.

**Bu görev A2'nin fix-next maddelerinden birini de kapatır:** controller'larda
`ProducesResponseType(403)` eksikti. Generated OpenAPI B fazını besler; eksik ilan orada
sessiz bir hataya dönüşür.

**`NotContain(HttpDeleteAttribute)` assertion'ı DEĞİŞMEZ.** Yalnız SAYI 15→17 olur — ve
testin kendi doc'u bunu zaten öngörüyor: *"A3 üç şablon ucu + publishers + delivery-report
ekleyecek ve bu testi kıracaktır; kırılması İSTENİR"*. Şablon uçları Görev 6'da AYRI
controller'a gitti (D-1), dolayısıyla bu controller'a yalnız İKİ uç eklenir.

- [ ] **Step 1: Failing controller testini güncelle**

`AnnouncementsControllerTests.cs`:

```csharp
    /// <summary>
    /// INV-1'in API yüzeyindeki tek otomatik kanıtı: 17 endpoint (A1'in 6'sı + A2'nin 9'u +
    /// A3'ün 2'si) ve hiçbiri <c>[HttpDelete]</c> DEĞİL. Sayı 17'nin DIŞINA çıkarsa VEYA biri
    /// <c>HttpDeleteAttribute</c> taşırsa test kırılır.
    ///
    /// <para><b>A3 güncellemesi (D-1):</b> şablon uçları BU CONTROLLER'A EKLENMEDİ. Şablon
    /// silinebilir bir kayıttır (INV-1 duyuruyu korur, metin kalıbını değil) ve silme ucunu
    /// buraya koymak aşağıdaki <c>NotContain</c> assertion'ını gevşetmeyi gerektirirdi.
    /// Şablonlar <see cref="AnnouncementTemplatesController"/>'a taşındı; o controller'ın
    /// kendi simetrik bekçisi vardır (tam bir DELETE). Bu assertion GEVŞETİLMEDİ.</para>
    /// </summary>
    [Fact]
    public void Controller_ShouldExpose_ExactlySeventeenEndpoints_And_NoneIsHttpDelete()
    {
        var httpMethods = _controllerType
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .Where(m => m.GetCustomAttributes().OfType<HttpMethodAttribute>().Any())
            .ToList();

        httpMethods.Should().HaveCount(17,
            "duyuru kurumsal kayıttır — endpoint yüzeyi yalnız BİLİNÇLİ olarak büyür");

        httpMethods.SelectMany(m => m.GetCustomAttributes().OfType<HttpMethodAttribute>())
            .Should().NotContain(attr => attr is HttpDeleteAttribute,
                "INV-1: duyuru SİLİNMEZ — yanlış duyuru yalnız :withdraw ile geri çekilir");
    }
```

Eski `Controller_ShouldExpose_ExactlyFifteenEndpoints_And_NoneIsHttpDelete` metodu
YENİDEN ADLANDIRILIR (silinip yeniden yazılmaz — git diff'te bir yeniden adlandırma
olarak okunmalıdır).

`ExpectedEndpoints()` tablosuna iki satır:

```csharp
        yield return ["GetPublishersAsync", "GET", "publishers"];
        yield return ["GetDeliveryReportAsync", "GET", "{id:guid}/delivery-report"];
```

Ve YENİ bir bekçi testi — 403 ilanları için:

```csharp
    /// <summary>
    /// A2 nihai incelemesi devri: yazma ve daraltma yapan uçların HİÇBİRİ 403 ilan etmiyordu.
    /// Generated OpenAPI B fazını besler; eksik ilan, kontrat-senkron istemcide "bu uç 403
    /// dönemez" varsayımına dönüşür ve hata yolu hiç yazılmaz.
    ///
    /// <para>Kapsam: <c>[Authorize]</c> sınıf düzeyindedir, yani HER uç 403 dönebilir.
    /// Bu test hepsini ister — istisna yoktur, çünkü istisna listesi zamanla bayatlar.</para>
    /// </summary>
    [Theory]
    [MemberData(nameof(ExpectedEndpoints))]
    public void Controller_ShouldDeclare_Forbidden_When_EndpointIsExposed(
        string actionName, string _, string __)
    {
        var method = _controllerType.GetMethod(actionName, BindingFlags.Public | BindingFlags.Instance);

        method!.GetCustomAttributes<ProducesResponseTypeAttribute>()
            .Select(a => a.StatusCode)
            .Should().Contain(StatusCodes.Status403Forbidden,
                $"{actionName} yetkisiz çağıranda 403 döner ve bunu ilan etmelidir");
    }
```

- [ ] **Step 2: Testlerin KIRMIZI olduğunu doğrula**

```bash
dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~AnnouncementsControllerTests"
```

Beklenen: sayım testi FAIL (15 bulundu, 17 bekleniyor); iki `ExpectedEndpoints` satırı
FAIL (action yok); 403 Theory'sinin **her satırı** FAIL.

- [ ] **Step 3: İki ucu ekle**

`AnnouncementsController.cs` — `GetApprovalsAsync`'ten sonra:

```csharp
    /// <summary>
    /// Yayınlayan filtresi seçenekleri. İzin <c>announcements.view</c>'dur ama sorgu
    /// handler'ı envantere daraltır (A3 D-2) — veli/öğrenci bu listeyi görmez.
    /// </summary>
    [HttpGet("publishers")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AnnouncementPublisherDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPublishersAsync(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnnouncementPublishersQuery(), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

Ve `GetAuditTrailAsync`'ten sonra:

```csharp
    /// <summary>
    /// Gönderim raporu. <b>Açıkça sınırlıdır</b> (spec §10): kanal kırılımı tek satır döner
    /// çünkü sunucuda kayıtlı tek teslim kanalı in-app'tir. Öğretmen yalnız kendi duyurusunun
    /// raporunu görür.
    /// </summary>
    [HttpGet("{id:guid}/delivery-report")]
    [ProducesResponseType(typeof(ApiResponse<DeliveryReportDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDeliveryReportAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnnouncementDeliveryReportQuery(id), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

Gerekli `using`'leri ekle.

- [ ] **Step 4: Mevcut 15 ucun HEPSİNE `ProducesResponseType(403)` ekle**

Her uca:

```csharp
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
```

**Sadece 403 ekle** — başka bir ilan ekleme, mevcut ilanları değiştirme, sırayı değiştirme.
Bu tur SALT-ADDITIVE olmalıdır ki `git diff` okunabilir kalsın.

- [ ] **Step 5: Testleri koş**

```bash
dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~AnnouncementsControllerTests"
```

Beklenen: hepsi PASS.

- [ ] **Step 6: Uygulamanın ayağa kalktığını ve Swagger'ın 17 operasyon gösterdiğini doğrula**

```bash
dotnet run --project src/Oksis.Api &
sleep 20
curl -s http://localhost:5112/openapi/v1.json | python3 -c "
import json,sys
d=json.load(sys.stdin)
paths=[k for k in d['paths'] if 'announcement' in k.lower()]
ops=sum(len([m for m in d['paths'][p] if m in ('get','post','put','delete','patch')]) for p in paths)
print('yol:', len(paths), 'operasyon:', ops)
for p in sorted(paths): print(' ', p, sorted(m for m in d['paths'][p] if m in ('get','post','put','delete')))
"
kill %1
```

Beklenen: 17 (duyuru) + 4 (şablon) = **21 operasyon**. DELETE **tam olarak bir tane** ve o
da `/api/v1/announcements/templates/{id}`.

- [ ] **Step 7: Dört süiti koş, deltaları doğrula, commit**

```bash
git add src/Oksis.Api/Controllers/V1/AnnouncementsController.cs \
        tests/Oksis.Api.UnitTests/Controllers/V1/AnnouncementsControllerTests.cs
git commit -m "feat(api): yayinlayan ve gonderim raporu uclari controller'a baglandi

Uc sayisi 15'ten 17'ye cikti; HttpDelete yasagi DEGISMEDI (sablon uclari ayri
controller'da). A2 fix-next: tum uclara ProducesResponseType(403) eklendi —
generated OpenAPI B fazini besler."
```

---

## Görev 10: `AnnouncementPublicationService` çıkarımı

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementPublicationService.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/ApproveAnnouncement/ApproveAnnouncementCommandHandler.cs`

**Interfaces:**
- Consumes: `IAudienceResolver.ResolveAsync(AudienceScope, IReadOnlyList<AudienceSelectionBody>, ct)`,
  `AnnouncementReachRule.From(IEnumerable<string>)`, `AnnouncementEnumWire.ToWire(...)` (hepsi mevcut).
- Produces:
  ```csharp
  AnnouncementPublicationService.MaterializeAsync(
      IApplicationDbContext db, IAudienceResolver resolver, Announcement announcement,
      IReadOnlyList<AnnouncementTarget> targets, Guid schoolId, CancellationToken ct)
      → Task<MaterializationResult>   // record (AnnouncementReach Reach, int RecipientCount)
  ```
  Görev 11'in job'ı bunu KULLANIR.

**Bu bir REFACTOR'dür — davranış DEĞİŞMEZ.** Çıkış kriteri: mevcut testlerin tamamı
DEĞİŞMEDEN yeşil kalır. Yeni test EKLENMEZ (davranış yeni değil); değişikliğin doğruluğunu
var olan `AnnouncementApprovalTests` kanıtlar.

**Neden şimdi:** Görev 11'in job'ı "donmuş hedeflerden alıcı materyalize et" adımını
yapacak. Bu adım bugün `ApproveAnnouncementCommandHandler`'da yaşıyor. Job onu kopyalarsa
üçüncü kopya doğar ve spec §9 açıkça *"yayın mantığını tekrar etmez"* diyor. Çıkarımı
job'dan ÖNCE yapmak, job'ın kopyalayacak bir şey bulamamasını garanti eder.

- [ ] **Step 1: Servisi yaz**

`src/Oksis.Application/Modules/Announcements/Common/AnnouncementPublicationService.cs`:

```csharp
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Announcements.Abstractions;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>Materyalizasyonun sonucu: kökün mühürleyeceği iki değer.</summary>
public sealed record MaterializationResult(AnnouncementReach Reach, int RecipientCount);

/// <summary>
/// <b>Donmuş hedeflerden alıcı materyalize etmenin TEK yolu.</b>
///
/// <para>Bu adımın iki çağıranı vardır ve zamanla üçüncüsü gelmeyecektir:
/// <c>:approve</c> (yönetim onayı) ve <c>PublishScheduledAnnouncementsJob</c> (zamanlanmış
/// yayın). Spec §9 job için açıkça <i>"yayın mantığını tekrar etmez"</i> der; kopyalanmış bir
/// materyalizasyon iki yolun zamanla ayrışmasına ve aynı duyurunun onaydan geçince farklı,
/// zamandan geçince farklı bir alıcı kümesi almasına yol açardı.</para>
///
/// <para><b>Hedefler yeniden SEÇİLMEZ</b> (INV-2): donmuş <see cref="AnnouncementTarget"/>
/// satırları yeniden ÇÖZÜMLENİR. Kayıt kendini anlatır (Dimension/Key/Bucket yayın anında
/// donduruldu), bu yüzden seçim gövdesi yeniden kurulabilir.</para>
///
/// <para><b>Alıcılar ŞİMDİ materyalize edilir</b>, hedef donarken değil (DYR-K-15): onay/
/// zamanlama ile yayın arasında geçen sürede sınıf mevcudu değişebilir ve dondurulmuş bir
/// listeye güvenmek yanlış olurdu.</para>
///
/// <para><b><c>SaveChangesAsync</c> ÇAĞIRMAZ</b> — alıcı satırları, kökün statü değişimiyle
/// AYNI transaction'da commit olur (<see cref="AnnouncementAuditWriter"/> ile aynı ilke).</para>
/// </summary>
public static class AnnouncementPublicationService
{
    public static async Task<MaterializationResult> MaterializeAsync(
        IApplicationDbContext db,
        IAudienceResolver resolver,
        Announcement announcement,
        IReadOnlyList<AnnouncementTarget> targets,
        Guid schoolId,
        CancellationToken ct)
    {
        var selections = targets.Select(t => new AudienceSelectionBody
        {
            Dimension = AnnouncementEnumWire.ToWire(t.Dimension),
            Key = t.Key,
            Bucket = AnnouncementEnumWire.ToWire(t.Bucket),
        }).ToList();

        // Kapsam YAYINLAYANIN kapsamıdır, işlemi yapanın değil: duyuru öğretmenindir,
        // yönetim yalnız izin verdi / saat geldi.
        var scope = new AudienceScope(schoolId, announcement.AcademicSessionId, announcement.PublisherId);
        var recipients = await resolver.ResolveAsync(scope, selections, ct);

        var reach = AnnouncementReachRule.From(selections.Select(s => s.Dimension));

        // ChildPersonId yalnız SINIF KAPSAMLI duyuruda dolar: okul geneli reach'te
        // resolver'ın "ilk eşleşen çocuk" damgası BİLİNÇLİ olarak silinir — aksi hâlde çok
        // çocuklu veli, gelen kutusunu childId'ye göre daralttığında duyuruyu DİĞER
        // çocuğunun sekmesinden kaybederdi.
        db.AnnouncementRecipients.AddRange(recipients.Select(r =>
            AnnouncementRecipient.Create(
                schoolId, announcement.Id, r.PersonId, r.RoleAtPublish,
                reach == AnnouncementReach.SchoolWide ? null : r.ChildPersonId)));

        return new MaterializationResult(reach, recipients.Count);
    }
}
```

- [ ] **Step 2: `ApproveAnnouncementCommandHandler`'ı servise yönlendir**

Handler'daki `selections` / `scope` / `recipients` / `reach` / `AddRange` bloğu ŞUNUNLA
değiştirilir:

```csharp
        var materialization = await AnnouncementPublicationService.MaterializeAsync(
            db, resolver, announcement, targets, schoolId, cancellationToken);

        try
        {
            announcement.Approve(materialization.Reach, materialization.RecipientCount, clock.UtcNow);
        }
        catch (AnnouncementDomainException ex)
        {
            return Result<AnnouncementDto>.Failure(new Error(ex.Code, ex.Message));
        }
```

Kullanılmayan hâle gelen `using`'ler kaldırılır (IDE0005 build hatası üretir).

- [ ] **Step 3: Refactor'ün davranışı DEĞİŞTİRMEDİĞİNİ doğrula**

```bash
dotnet build Oksis.slnx
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementApprovalTests"
```

Beklenen: **TEK BİR TEST DEĞİŞMEDEN**, hepsi PASS. Bir test kırılıyorsa refactor davranışı
değiştirmiştir — DUR, testi düzeltme, refactor'ü düzelt.

- [ ] **Step 4: Zorunlu mutasyon denetimi — servisin gerçekten çağrıldığını kanıtla**

`MaterializeAsync` içindeki `db.AnnouncementRecipients.AddRange(...)` satırını GEÇİCİ
olarak kaldır ve `AnnouncementApprovalTests`'i koş.
Beklenen: en az bir test **FAIL** (onaylanan duyurunun alıcısı oluşmuyor).
Bu, handler'ın gerçekten servisten geçtiğini kanıtlar — yalnız "derlendi ve testler yeşil"
gözlemi, ölü bir servis yazmış olma ihtimalini dışlamaz.
Mutasyonu GERİ AL ve iki gözlemi de rapora yaz.

- [ ] **Step 5: Dört süiti koş, deltaları doğrula**

Beklenen: **DÖRT SÜİTTE DE DELTA SIFIR.** Bu bir refactor'dür; yeni test yok, kaybolan test
yok. Sayılardan biri oynadıysa DUR ve bildir.

- [ ] **Step 6: Commit**

```bash
git add src/Oksis.Application/Modules/Announcements/Common/AnnouncementPublicationService.cs \
        src/Oksis.Application/Modules/Announcements/Commands/ApproveAnnouncement/ApproveAnnouncementCommandHandler.cs
git commit -m "refactor(api): donmus hedeflerden materyalizasyon ortak servise cikarildi

Zamanlanmis yayin job'i (Gorev 11) ayni adimi yapacak; spec §9 'yayin mantigini
tekrar etmez' diyor. Cikarimi job'dan ONCE yapmak, job'in kopyalayacak bir sey
bulamamasini garanti eder. Davranis degismedi: dort suitte de delta sifir."
```

---

## Görev 11: `NotificationKind` 22/23 + `PublishScheduledAnnouncementsJob`

**Files:**
- Modify: `src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/NotificationKindContinuityTests.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Events/AnnouncementScheduleFailedEvent.cs`
- Create: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs`
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/PublishScheduledAnnouncementsJobTests.cs`
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs` (yalnız
  `RaiseScheduleFailed` — aşağıya bak)

**Interfaces:**
- Consumes: `AnnouncementPublicationService.MaterializeAsync` (Görev 10),
  `Announcement.Publish(reach, recipientCount, now)` (mevcut).
- Produces: `PublishScheduledAnnouncementsJob.RunAsync(CancellationToken) → Task<int>`
  (yayınlanan duyuru sayısı). Görev 13 Hangfire'a kaydeder.
- Produces: `NotificationKind.AnnouncementScheduledExecuted = 22`,
  `NotificationKind.AnnouncementScheduleFailed = 23`. Görev 12 handler'larını yazar.

**D-3 uygulanır** — ana dosyadan oku. Özet: §8.2 `AnnouncementScheduledExecuted`'ı sayar;
§9 ayrıca "hedef boş kalırsa yayınlamaz ve yayınlayana bildirim gider" der ve bu İKİNCİ bir
olaydır. 22 ve 23 eklenir, **araya ekleme yok**.

- [ ] **Step 1: Failing enum sürekliliği testini yaz**

`NotificationKindContinuityTests.cs`'yi OKU ve mevcut kalıbına uyacak şekilde 22/23'ü
beklenen kümeye ekle. Testin bugünkü iddiası (16–21 arası kesintisiz, 16 = `AnnouncementPublished`)
KORUNUR. Ek olarak:

```csharp
    /// <summary>
    /// A3 D-3: iki değer eklenir ve ARAYA EKLENMEZ. <c>notification_delivery_logs</c>
    /// int'leri kalıcıdır — 17'nin anlamını değiştiren bir ekleme, gönderilmiş bildirimlerin
    /// geçmişini yeniden yazardı.
    /// </summary>
    [Fact]
    public void Should_ContinueFromTwentyTwo_When_A3KindsAreAdded()
    {
        ((int)NotificationKind.AnnouncementScheduledExecuted).Should().Be(22);
        ((int)NotificationKind.AnnouncementScheduleFailed).Should().Be(23);
    }

    /// <summary>
    /// A1/A2'nin değerleri BİRE BİR yerinde kalır. Bu test, 22/23 eklemesinin
    /// mevcut hiçbir int'i kaydırmadığını kanıtlar.
    /// </summary>
    [Theory]
    [InlineData(NotificationKind.AnnouncementPublished, 16)]
    [InlineData(NotificationKind.AnnouncementWithdrawn, 17)]
    [InlineData(NotificationKind.AnnouncementAmended, 18)]
    [InlineData(NotificationKind.AnnouncementSubmittedForApproval, 19)]
    [InlineData(NotificationKind.AnnouncementApproved, 20)]
    [InlineData(NotificationKind.AnnouncementRejected, 21)]
    public void Should_PreserveExistingValues_When_NewKindsAreAdded(NotificationKind kind, int expected)
    {
        ((int)kind).Should().Be(expected);
    }
```

- [ ] **Step 2: Testin KIRMIZI olduğunu doğrula**

Beklenen: derleme hatası — `AnnouncementScheduledExecuted` yok.

- [ ] **Step 3: Enum değerlerini ekle**

`NotificationKind.cs` — `AnnouncementRejected = 21`'den SONRA:

```csharp
    /// <summary>
    /// Zamanlanmış duyuru yayına çıktı (A3). <b>YAYINLAYANA</b> gider: alıcılara zaten
    /// <see cref="AnnouncementPublished"/> gitmiştir; bu, yayınlayanın "planladığım şey oldu"
    /// bilgisidir. İkisi ayrı kalır çünkü derin bağlantıları da ayrıdır — alıcı duyuruyu
    /// okumaya, yayınlayan gönderim raporuna gider.
    /// </summary>
    AnnouncementScheduledExecuted = 22,

    /// <summary>
    /// Zamanlanmış duyuru yayınLANAMADI çünkü yayın anında hedefi kimseye çözülmedi (A3,
    /// spec §9 kenar durumu — ör. duyuru zamanlandıktan sonra şubenin tüm öğrencileri
    /// nakil oldu). Duyuru <c>scheduled</c> statüsünde KALIR ve <b>YAYINLAYANA</b> bildirim
    /// gider.
    ///
    /// <para><b>Neden 22 ile aynı değer DEĞİL:</b> "duyurun gitti" ile "duyurun gitmedi" aynı
    /// rozetten okunamaz; tek kind kullanmak bildirim gövdesini ve derin bağlantıyı
    /// belirsizleştirirdi (A3 D-3).</para>
    /// </summary>
    AnnouncementScheduleFailed = 23,
```

- [ ] **Step 4: Failing job testlerini yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/PublishScheduledAnnouncementsJobTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Announcements.Enums;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// Zamanlanmış yayın job'ı (A3 dilim 7, spec §9).
///
/// <para><b>Job yayın mantığını TEKRAR ETMEZ:</b> <c>Announcement.Publish()</c> domain
/// metodunu ve <c>AnnouncementPublicationService</c>'i çağırır. Bu, testlerin de
/// doğrulaması gereken şeydir — job'ın kendi statü ataması veya kendi alıcı sorgusu
/// OLMAMALIDIR.</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class PublishScheduledAnnouncementsJobTests : IAsyncLifetime
{
    // ... fixture kurulumu ...

    /// <summary>
    /// Saati gelen duyuru yayınlanır: statü <c>published</c>, <c>PublishedAt</c> dolu,
    /// alıcılar materyalize, <c>RecipientCountSnapshot</c> mühürlü. Dördü de ayrı ayrı
    /// assert edilir — yalnız statüye bakmak, alıcısız yayınlanmış bir duyuruyu "başarı"
    /// diye okurdu.
    /// </summary>
    [Fact]
    public async Task Should_PublishAndMaterialize_When_ScheduledTimeHasPassed() { }

    /// <summary>
    /// Saati GELMEMİŞ duyuruya DOKUNULMAZ. Bu testin ayırt ediciliği, job'ın
    /// <c>ScheduledAt &lt;= now</c> yüklemini gerçekten taşıdığını göstermesidir — yüklem
    /// düşerse gelecekteki her duyuru anında yayına çıkar.
    /// </summary>
    [Fact]
    public async Task Should_LeaveUntouched_When_ScheduledTimeIsInTheFuture() { }

    /// <summary>
    /// TASLAK duyuru job tarafından yayınlanMAZ — taslağın <c>ScheduledAt</c>'i dolu olsa
    /// bile. Statü yüklemi (<c>Status == Scheduled</c>) olmasaydı, kullanıcının kaydettiği
    /// ama göndermediği bir taslak kendiliğinden yayına çıkardı.
    /// </summary>
    [Fact]
    public async Task Should_LeaveUntouched_When_AnnouncementIsDraftWithScheduledAt() { }

    /// <summary>
    /// Onay bekleyen duyuru job tarafından yayınlanMAZ — eşikli moderasyonu atlatan bir
    /// yol açardı (INV-5 ihlali).
    /// </summary>
    [Fact]
    public async Task Should_LeaveUntouched_When_AnnouncementIsPendingApproval() { }

    /// <summary>
    /// Spec §9 kenar durumu: hedef yayın anında kimseye çözülmezse duyuru YAYINLANMAZ ve
    /// <c>scheduled</c> statüsünde KALIR. Sıfır alıcıyla "yayınlandı" demek, gönderim
    /// raporunda 0/0 gösteren ve yayınlayanın hiç fark etmeyeceği bir yalan üretirdi.
    /// </summary>
    [Fact]
    public async Task Should_NotPublish_When_AudienceResolvesToNobody() { }

    /// <summary>
    /// Boş hedef durumunda <c>AnnouncementScheduleFailedEvent</c> yayılır (Görev 12 onu
    /// bildirime çevirir). Bu test olayın KÖKTEN yayıldığını doğrular; bildirim içeriği
    /// Görev 12'nin işidir.
    /// </summary>
    [Fact]
    public async Task Should_RaiseScheduleFailedEvent_When_AudienceResolvesToNobody() { }

    /// <summary>
    /// Job TÜM okulları gezer (<c>ExpireRoleAssignmentsJob</c> kalıbı) — job id başına ayrı
    /// <c>SchoolId</c> parametresi yoktur. İki okulun zamanı gelmiş duyurusu TEK koşuda
    /// yayınlanır ve alıcılar KENDİ okullarına yazılır.
    /// </summary>
    [Fact]
    public async Task Should_ProcessAllSchools_When_MultipleTenantsHaveDueAnnouncements() { }

    /// <summary>
    /// İDEMPOTENT: ikinci koşu aynı duyuruyu YENİDEN yayınlamaz ve alıcıları
    /// İKİYE KATLAMAZ. Hangfire bir job'ı yeniden deneyebilir; ikinci koşuda
    /// <c>Status != Scheduled</c> olduğu için duyuru artık aday kümede değildir.
    /// </summary>
    [Fact]
    public async Task Should_BeIdempotent_When_JobRunsTwice() { }
}
```

> **Implementer'a not:** Testler iskelettir; her doc yorumundaki iddiayı harfiyen sına
> (Görev 8'in aynı yükümlülüğü). Kurulum için `CreateAnnouncementTests`'in zamanlanmış
> duyuru üreten yolunu emsal al — **statüyü elle set etme**, gerçek
> `CreateAnnouncementCommandHandler` ya da `Announcement.CreateDraft` + `MarkScheduled`
> kullan. `TimeProvider` için `Microsoft.Extensions.Time.Testing.FakeTimeProvider` bu
> depoda kullanılıyorsa onu kullan; yoksa mevcut job testlerinin saat sahteleme kalıbını
> OKU ve birebir izle.

- [ ] **Step 5: `AnnouncementScheduleFailedEvent` + kökteki yayıcıyı yaz**

`src/Oksis.Domain/Modules/Announcements/Events/AnnouncementScheduleFailedEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Announcements.Events;

/// <summary>
/// Zamanlanmış duyuru yayınlanamadı: yayın anında hedefi kimseye çözülmedi (spec §9).
/// Duyuru <c>scheduled</c> statüsünde kalır. Bildirim YAYINLAYANA gider.
/// </summary>
public sealed record AnnouncementScheduleFailedEvent(
    Guid SchoolId,
    Guid AnnouncementId,
    string Title,
    Guid PublisherId,
    DateTimeOffset OccurredAt) : IDomainEvent;
```

`Announcement.cs` — `Expire()`'dan sonra:

```csharp
    /// <summary>
    /// Zamanlanmış yayının BAŞARISIZ olduğunu bildirir: hedef yayın anında kimseye
    /// çözülmedi (spec §9 kenar durumu).
    ///
    /// <para><b>Statü DEĞİŞMEZ</b> — duyuru <c>scheduled</c> kalır. Bu bilinçlidir: yayınlayan
    /// hedefi düzeltip yeniden zamanlayabilmelidir ve job bir sonraki koşuda tekrar dener.
    /// Metot yalnız olayı yayar; bu yüzden adı bir durum geçişi gibi okunmaz.</para>
    ///
    /// <para>Saat parametresi ALMAZ: hiçbir iş zamanı yazmaz (Görev 4 kuralı).</para>
    /// </summary>
    public void RaiseScheduleFailed()
    {
        if (Status is not AnnouncementStatus.Scheduled)
        {
            throw new AnnouncementDomainException(
                "Announcements.Schedule.InvalidStatus",
                "Yalnız zamanlanmış duyurunun yayını başarısız olabilir.");
        }

        Raise(new AnnouncementScheduleFailedEvent(
            SchoolId, Id, Title, PublisherId, DateTimeOffset.UtcNow));
    }
```

Ve domain testine (`AnnouncementLifecycleTests.cs`) iki test ekle:

```csharp
    [Fact]
    public void Should_RaiseScheduleFailedEvent_When_ScheduledPublicationFinds NoAudience()
    {
        var announcement = /* CreateDraft + MarkScheduled */;
        announcement.ClearDomainEvents();

        announcement.RaiseScheduleFailed();

        announcement.Status.Should().Be(AnnouncementStatus.Scheduled,
            "başarısız yayın statüyü DEĞİŞTİRMEZ — yayınlayan hedefi düzeltip yeniden dener");
        announcement.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<AnnouncementScheduleFailedEvent>();
    }

    [Theory]
    [InlineData(/* Draft */)]
    [InlineData(/* Published */)]
    public void Should_Reject_When_ScheduleFailedIsRaisedOnNonScheduledAnnouncement(/* ... */)
    {
        // act.Should().Throw<AnnouncementDomainException>()
        //     .Where(e => e.Code == "Announcements.Schedule.InvalidStatus");
    }
```

> **Implementer'a not:** Yukarıdaki test adında bilerek bir boşluk var
> (`Finds NoAudience`) — derlenmez. Bunu `Should_RaiseScheduleFailedEvent_When_NoAudienceResolves`
> olarak düzelt; `Should_{ExpectedBehavior}_When_{Condition}` kalıbına uy. Theory'nin
> `InlineData`'larını gerçek statülerle doldur ve o statülere GERÇEK domain çağrılarıyla ulaş
> (`Publish()`, `MarkPendingApproval()`) — statü zorlayan bir kısayol KULLANMA.

> ═══ KONTROLÖR KARARI (Görev 10 incelemesinden, 2026-08-04) — BUNU OKUMADAN JOB'I YAZMA ═══
>
> `AnnouncementPublicationService.MaterializeAsync` artık **zorunlu** bir
> `Guid? scopeTeacherPersonId` parametresi alıyor. Bu alan `AudienceScope`'un üçüncü
> alanına gider ve anlamı **"havuz bu kişinin kendi şube/derslerine daraltılsın mı"** —
> bir kimlik değil, bir **karar**. `null` = daraltma yok (yönetim).
>
> **Job'a `announcement.PublisherId` GEÇİRME.** `MarkScheduled` yolu yöneticiye de açıktır
> (`CreateAnnouncementCommandHandler.cs:134-141` — moderasyon/rol kontrolü olmadan,
> `scheduledAt` gelecekteyse). `PublisherId` asla null olamaz, dolayısıyla müdürün
> zamanladığı okul geneli duyuru **müdürün kendi ders/şubelerine daralır** ve
> `AudienceResolver.cs:70` kapsam dışı seçimleri **sessizce `continue` ile atar** —
> istisna yok, log yok. Sonuç: duyuru sıfır alıcıyla kalır, job onu yayınlamaz,
> `scheduled` bırakır ve yayınlayana **"hedefin boş kaldı"** bildirimi gider — hâlbuki
> hedef doluydu. Bu arıza Görev 10'da mutasyonla **canlı olarak gösterildi** (yanlış
> kapsam → 0 alıcı, iki test öldü).
>
> **`ResolveScopedPublisherIdAsync`'i de KULLANMA.** O `IPermissionReader` üzerinden
> çalışır ve tek implementasyonu (`Infrastructure/Identity/PermissionReader.cs:24,42`)
> **`IHttpContextAccessor`'a bağlıdır**; arka plan job'ında `HttpContext` yoktur, boş küme
> döner, `IsManagerAsync` her zaman `false` olur ve **her yayınlayan için** (müdür dâhil)
> non-null değer üretir — yani tuzağa aynen düşer. Ayrıca o port "oturumdaki kullanıcıyı"
> okur; job'ın sorması gereken soru **"duyurunun YAYINLAYANI yönetim miydi"**, "job'ı kim
> tetikledi" değil.
>
> **KARAR: yayınlayanın yetkisini veritabanından çöz.**
> `IAccountPermissionResolver` (`Application/Modules/Identity/Abstractions/IAccountPermissionResolver.cs`)
> kullanılacak — implementasyonu `Infrastructure/Identity/AccountPermissionResolver.cs:16`
> yalnız `IApplicationDbContext` alır, **HttpContext'e bağlı DEĞİLDİR**, job'da çalışır.
>
> ```csharp
> Task<IReadOnlySet<string>> ResolveAsync(
>     Guid accountId, Guid personId, string? activeProfileType, Guid? activeSeasonId, CancellationToken ct);
> ```
>
> Job şunu yapar: `announcement.PublisherId` → `Person.LinkedAccountId` → `ResolveAsync(...)`
> → küme `"announcements.approve"` içeriyorsa **yönetim** (`null` geçir), içermiyorsa
> **kapsamlı** (`announcement.PublisherId` geçir).
>
> **Doğrulaman gerekenler (tahmin etme, kaynaktan oku ve rapora yaz):**
> - `activeProfileType` ve `activeSeasonId` parametrelerine ne geçilmeli? `null` ne anlama
>   geliyor? Sezon için `announcement.AcademicSessionId` doğru mu?
> - `Person.LinkedAccountId` **null olabilir** (yayınlayan okuldan ayrılmış olabilir).
>   O hâlde ne yapılacak? Kontrolör önerisi: **kapsamlı davran** (`PublisherId` geçir) —
>   fail-closed, çünkü "yetkisini doğrulayamadığım kişiye yönetim ayrıcalığı verme" bu
>   deponun A1'den beri uyguladığı ilke. Farklı düşünüyorsan gerekçesini yaz.
> - Bu ek sorgu job'ın **duyuru başına** çalıştığı yerde N+1 üretir mi? Aday duyuru sayısı
>   genelde küçüktür (dakikalık sweep), ama ölç ve rapora yaz.
>
> **Ayırt edici test ZORUNLU:** yöneticinin zamanladığı **okul geneli** bir duyuru, saati
> gelince **tam alıcı kümesiyle** yayınlansın. Bu test, yanlış kapsam geçilirse **kırılır**
> (0 alıcı → job yayınlamaz → statü `scheduled` kalır). Bu, yukarıdaki arızanın regresyon
> bekçisidir ve olmadan bu görev bitmiş sayılmaz.
>
> **`Announcement.Type` (institutional/class) bunun yerine KULLANILAMAZ** — sözlük
> `reach`/`type`/`scope`'un birbirinden bağımsız olduğunu açıkça söylüyor ve
> `{reach: classScoped, type: institutional}` gerçek bir hâldir.

- [ ] **Step 6: Job'ı yaz**

`src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Announcements.Abstractions;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Infrastructure.BackgroundJobs.Jobs;

/// <summary>
/// Zamanlanmış duyuruları yayınlar (spec §9, A3 dilim 7). Dakikalık sweep.
///
/// <para><b>Yayın mantığını TEKRAR ETMEZ:</b> alıcı materyalizasyonu için
/// <see cref="AnnouncementPublicationService"/>, statü geçişi için
/// <c>Announcement.Publish()</c> çağrılır. Job'ın kendi statü ataması ve kendi alıcı
/// sorgusu YOKTUR — olsaydı onaydan geçen duyuruyla zamandan geçen duyuru zamanla farklı
/// alıcı kümeleri alırdı.</para>
///
/// <para><b>Boş hedef kenar durumu (spec §9):</b> hedef yayın anında kimseye çözülmezse
/// duyuru YAYINLANMAZ, <c>scheduled</c> kalır ve yayınlayana bildirim gider
/// (<c>AnnouncementScheduleFailedEvent</c>). Sıfır alıcıyla "yayınlandı" demek, gönderim
/// raporunda 0/0 gösteren ve kimsenin fark etmeyeceği bir yalan üretirdi.</para>
///
/// <para>Tüm tenant'larda çalışır (<c>ExpireRoleAssignmentsJob</c> kalıbı): aday okulları
/// bulmak için tek bilinçli global-filter bypass'i, ardından okul başına tenant context
/// sabitleme. İdempotenttir — yayınlanan duyuru artık <c>Scheduled</c> olmadığı için ikinci
/// koşuda aday kümede değildir.</para>
/// </summary>
public sealed class PublishScheduledAnnouncementsJob(
    IApplicationDbContext db,
    ITenantContext tenantContext,
    IAudienceResolver resolver,
    TimeProvider timeProvider,
    ILogger<PublishScheduledAnnouncementsJob> logger)
{
    public async Task<int> RunAsync(CancellationToken cancellationToken)
    {
        var now = timeProvider.GetUtcNow();

        // SECURITY: sistem sweep'i henüz bir tenant context'inde değil. Aday okulları bulmak
        // için global filter bypass'i zorunlu — bilinçli, sınırlı tek bypass noktası.
        var dueSchoolIds = await db.Announcements
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(a => a.Status == AnnouncementStatus.Scheduled
                && a.ScheduledAt != null
                && a.ScheduledAt <= now)
            .Select(a => a.SchoolId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var totalPublished = 0;

        foreach (var schoolId in dueSchoolIds)
        {
            tenantContext.SetForLoginFlow(schoolId);

            var due = await db.Announcements
                .Where(a => a.Status == AnnouncementStatus.Scheduled
                    && a.ScheduledAt != null
                    && a.ScheduledAt <= now)
                .ToListAsync(cancellationToken);

            foreach (var announcement in due)
            {
                var targets = await db.AnnouncementTargets.AsNoTracking()
                    .Where(t => t.AnnouncementId == announcement.Id)
                    .ToListAsync(cancellationToken);

                var materialization = await AnnouncementPublicationService.MaterializeAsync(
                    db, resolver, announcement, targets, schoolId, cancellationToken);

                if (materialization.RecipientCount == 0)
                {
                    // Spec §9: yayınlama, scheduled bırak, yayınlayanı haberdar et.
                    announcement.RaiseScheduleFailed();

                    logger.LogWarning(
                        "Zamanlanmış duyuru yayınlanmadı — hedef kimseye çözülmedi "
                        + "(announcementId={AnnouncementId}, schoolId={SchoolId}).",
                        announcement.Id, schoolId);

                    continue;
                }

                announcement.Publish(materialization.Reach, materialization.RecipientCount, now);
                totalPublished++;
            }

            await db.SaveChangesAsync(cancellationToken);
        }

        logger.LogInformation(
            "Zamanlanmış duyuru sweep tamamlandı: {Count} duyuru yayınlandı ({SchoolCount} okul).",
            totalPublished, dueSchoolIds.Count);

        return totalPublished;
    }
}
```

> **Implementer'a DİKKAT — bir tasarım tuzağı:** `MaterializeAsync` alıcı satırlarını
> `db.AnnouncementRecipients`'a EKLER. Boş hedef durumunda eklenen satır olmadığı için
> sorun yoktur; ama sıfır olmayan bir sonuçtan sonra `Publish()` bir istisna atarsa
> (statü değişmişse) satırlar tracker'da kalır ve `SaveChangesAsync` onları YAZAR.
> Bu döngüde `Publish()` yalnız `Scheduled` statüsündeki duyurulara çağrılıyor ve
> `Publish` o statüyü kabul ediyor, dolayısıyla bugün gerçekleşemez — ama bunu **rapora
> yaz** ve gerekiyorsa `try/catch` ile duyuru bazında izole et. Sessizce geçme.

- [ ] **Step 7: DI kaydını ekle**

`src/Oksis.Infrastructure/DependencyInjection.cs` — diğer job kayıtlarının yanına:

```csharp
        services.AddTransient<BackgroundJobs.Jobs.PublishScheduledAnnouncementsJob>();
```

> **Implementer'a not:** Diğer job'ların GERÇEKTEN nasıl kaydedildiğini
> (`AddTransient`/`AddScoped`, tam namespace) dosyadan doğrula ve aynısını yap.
> Hangfire recurring KAYDI bu görevde YAPILMAZ — Görev 13'te iki job birlikte kaydedilir.

- [ ] **Step 8: Testleri koş**

```bash
docker compose up -d garage && ./scripts/init-garage.sh
dotnet build Oksis.slnx
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementLifecycleTests"
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~NotificationKindContinuityTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~PublishScheduledAnnouncementsJobTests"
```

- [ ] **Step 9: Zorunlu mutasyon denetimi — boş hedef kolunu kanıtla**

`if (materialization.RecipientCount == 0)` bloğunu GEÇİCİ olarak kaldır (yani sıfır alıcıyla
da yayınla) ve job testlerini koş.
Beklenen: `Should_NotPublish_When_AudienceResolvesToNobody` **VE**
`Should_RaiseScheduleFailedEvent_When_NoAudienceResolves` kırılır — **tam olarak ikisi**.
Başka bir test de kırılıyorsa o test spec §9'un kenar durumuna gizlice bağlıdır; rapora yaz.
Mutasyonu GERİ AL.

- [ ] **Step 10: Dört süiti koş, deltaları doğrula, commit**

```bash
git add src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs \
        src/Oksis.Domain/Modules/Announcements/Events/AnnouncementScheduleFailedEvent.cs \
        src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs \
        src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs \
        src/Oksis.Infrastructure/DependencyInjection.cs tests/
git commit -m "feat(api): zamanlanmis yayin job'i eklendi

NotificationKind 22/23 eklendi (araya ekleme yok). Job yayin mantigini tekrar
etmez: AnnouncementPublicationService + Announcement.Publish(). Hedef bos kalirsa
yayinlamaz, scheduled birakir ve yayinlayana olay yayar (spec §9)."
```

---

## Görev 12: Zamanlanmış yayın bildirim handler'ları

**Files:**
- Create: `src/Oksis.Domain/Modules/Announcements/Events/AnnouncementScheduledExecutedEvent.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Events/Notifications/AnnouncementScheduleNotificationHandlers.cs`
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementScheduleNotificationTests.cs`
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs` (`RaiseScheduledExecuted`)
- Modify: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs`
  (`Publish()`'ten sonra `RaiseScheduledExecuted()` çağrısı)
- Modify: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementLifecycleTests.cs`

**Interfaces:**
- Consumes: `AnnouncementScheduleFailedEvent` (Görev 11), `AnnouncementPublishedEvent` (mevcut),
  `INotificationRecipientResolver.ResolvePersonAccountsMapAsync`, `INotificationEnqueuer.Enqueue`.
- Produces: iki handler. Görev 13'ten sonra dal tamamlanır.

**BU GÖREV BİR TEKRARLAYAN KUSUR SINIFININ ÖNÜNÜ KESER.** Bu depoda bildirim handler'ı ÜÇ
KEZ testsiz gitti (A1 `Published`, A2 Görev 7 `Amended`, A2 Görev 14 `SubmittedForApproval`)
ve üçü de geriye dönük kapatıldı; üçüncüsü ancak nihai dal incelemesinde yakalandı.
**Bu görev, handler'ları YAZMAK ve TEST ETMEK üzere ayrı bir görev olarak vardır** —
Görev 11'in içine gömülseydi, "job yeşil, bitti" refleksiyle yine testsiz kalırdı.

**Neden iki handler:**

| Olay | Kind | Alıcı | İçerik |
|---|---|---|---|
| `AnnouncementPublishedEvent` (job'dan geldiğinde) | `AnnouncementScheduledExecuted` (22) | Yayınlayan | "Zamanlanmış duyurun yayınlandı" |
| `AnnouncementScheduleFailedEvent` | `AnnouncementScheduleFailed` (23) | Yayınlayan | "Zamanlanmış duyurun yayınlanamadı: hedefi kimse kalmadı" |

**Kritik tasarım sorusu — ve cevabı:** `AnnouncementPublishedEvent` ZATEN
`AnnouncementPublishedNotificationHandler` tarafından işleniyor ve ALICILARA gidiyor.
Aynı olaya ikinci bir handler bağlamak, o olayın job'dan mı yoksa `POST /announcements`'tan
mı geldiğini ayırt etmeyi gerektirir — **olay bu bilgiyi TAŞIMIYOR.**

**Karar:** `AnnouncementPublishedEvent`'e alan EKLENMEZ (A1'in kontratı; olayın altı
tüketicisi var). Bunun yerine job, yayınladığı her duyuru için kökten **ayrı** bir
`AnnouncementScheduledExecutedEvent` yaydırır. Yani `Announcement`'a ikinci bir yayıcı
gelir:

```csharp
    /// <summary>
    /// Zamanlanmış yayının GERÇEKLEŞTİĞİNİ bildirir. <c>PublishScheduledAnnouncementsJob</c>
    /// <see cref="Publish"/>'ten hemen SONRA çağırır.
    ///
    /// <para><b>Neden ayrı bir olay:</b> <see cref="Events.AnnouncementPublishedEvent"/>
    /// ALICILARA gider ve altı tüketicisi vardır; ona "bu yayın zamanlanmıştı" alanı eklemek
    /// o kontratı değiştirir ve her tüketiciyi ilgilendirmeyen bir ayrımı herkese dayatırdı.
    /// Zamanlanmış yayının bildirimi YAYINLAYANA gider ve derin bağlantısı farklıdır
    /// (gönderim raporu, duyuru detayı değil).</para>
    /// </summary>
    public void RaiseScheduledExecuted()
    {
        if (Status is not AnnouncementStatus.Published)
        {
            throw new AnnouncementDomainException(
                "Announcements.Schedule.InvalidStatus",
                "Yalnız yayınlanmış duyurunun zamanlanmış yayını bildirilebilir.");
        }

        Raise(new AnnouncementScheduledExecutedEvent(
            SchoolId, Id, Title, PublisherId, DateTimeOffset.UtcNow));
    }
```

Ve job'da `announcement.Publish(...)` satırından hemen sonra
`announcement.RaiseScheduledExecuted();` çağrılır.

- [ ] **Step 1: `AnnouncementScheduledExecutedEvent` + kökteki yayıcıyı yaz + domain testi**

Yukarıdaki `RaiseScheduledExecuted` metodunu ve olay kaydını yaz
(`AnnouncementScheduleFailedEvent` ile aynı şekil: `SchoolId, AnnouncementId, Title,
PublisherId, OccurredAt`). Domain testi:

```csharp
    [Fact]
    public void Should_RaiseScheduledExecutedEvent_When_ScheduledPublicationSucceeds()
    {
        var announcement = /* CreateDraft + MarkScheduled */;
        announcement.Publish(AnnouncementReach.ClassScoped, recipientCount: 12, DateTimeOffset.UtcNow);
        announcement.ClearDomainEvents();

        announcement.RaiseScheduledExecuted();

        announcement.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<AnnouncementScheduledExecutedEvent>();
    }

    [Fact]
    public void Should_Reject_When_ScheduledExecutedIsRaisedOnUnpublishedAnnouncement()
    {
        var announcement = /* CreateDraft + MarkScheduled — Publish ÇAĞRILMAZ */;

        var act = announcement.RaiseScheduledExecuted;

        act.Should().Throw<AnnouncementDomainException>()
            .Where(e => e.Code == "Announcements.Schedule.InvalidStatus");
    }
```

Job'a `announcement.RaiseScheduledExecuted();` satırını ekle.

- [ ] **Step 2: Failing bildirim testlerini yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementScheduleNotificationTests.cs`:

```csharp
/// <summary>
/// Zamanlanmış yayın bildirimleri (A3). <b>Bu sınıfın var olma sebebi bir tekrarlayan
/// kusur sınıfıdır:</b> bu depoda bildirim handler'ı ÜÇ KEZ testsiz gitti (A1 Published,
/// A2 Görev 7 Amended, A2 Görev 14 SubmittedForApproval) ve üçü de geriye dönük kapatıldı.
/// Bkz. <c>AnnouncementNotificationsTests.cs:16-19</c>.
///
/// <para>Buradaki her test handler'ı GERÇEKTEN örnekler ve alıcı kümesini TAM olarak
/// assert eder. Her sessizlik iddiası (<c>DidNotReceive</c>), alternatif açıklamayı
/// İMKÂNSIZ kılacak şekilde kurulur.</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AnnouncementScheduleNotificationTests : IAsyncLifetime
{
    /// <summary>
    /// Zamanlanmış yayın gerçekleştiğinde bildirim YALNIZ YAYINLAYANA gider.
    /// Alıcılara <c>AnnouncementPublished</c> zaten ayrı handler'dan gitti; bu, yayınlayanın
    /// "planladığım şey oldu" bilgisidir.
    ///
    /// <para><b>Pozitif assert:</b> <c>recipients.Count == 1 &amp;&amp;
    /// recipients.Contains(publisherAccountId)</c> — kitlenin listede OLMADIĞINI da kapsar.</para>
    /// </summary>
    [Fact]
    public async Task Should_NotifyOnlyThePublisher_When_ScheduledExecutedEventIsHandled() { }

    /// <summary>
    /// Yayınlayanın bağlı hesabı yoksa bildirim ÜRETİLMEZ ve handler patlamaz.
    ///
    /// <para><b>İzolasyon:</b> sahne bağlı hesaplı BAŞKA kişiler içerir ve test bunu olayı
    /// ateşlemeden ÖNCE assert eder — böylece sessizliği "hiç kimsenin hesabı yok"
    /// açıklayamaz.</para>
    /// </summary>
    [Fact]
    public async Task Should_EnqueueNothing_When_PublisherHasNoLinkedAccount() { }

    /// <summary>
    /// Dedup anahtarı <c>OccurredAt.UtcTicks</c> İÇERİR: zamanlanmış yayın TEKRARLANABİLİR
    /// bir eylemdir (yayınlayan hedefi düzeltip yeniden zamanlayabilir), dolayısıyla ikinci
    /// olay sessizce yutulmamalıdır.
    ///
    /// <para>Test iki anahtarı BAĞIMSIZ hesaplayıp GERÇEKTEN karşılaştırır —
    /// <c>Received(2)</c> saymak, aynı anahtarın iki kez gönderildiğini de "geçer" diye
    /// okurdu (A2 Görev 7 dersi).</para>
    /// </summary>
    [Fact]
    public async Task Should_ProduceDistinctDedupKeys_When_ScheduledExecutedFiresTwice() { }

    /// <summary>
    /// Başarısız zamanlanmış yayında bildirim YAYINLAYANA gider ve gövdesi hedefin boş
    /// kaldığını SÖYLER — "bir şeyler ters gitti" demek, yayınlayanın ne yapması gerektiğini
    /// gizlerdi.
    /// </summary>
    [Fact]
    public async Task Should_NotifyPublisherWithReason_When_ScheduleFailedEventIsHandled() { }

    /// <summary>
    /// İki handler AYRI <c>NotificationKind</c> kullanır (22 vs 23) — istemci "gitti" ile
    /// "gitmedi"yi rozetten ayırt eder (A3 D-3).
    /// </summary>
    [Fact]
    public async Task Should_UseDistinctKinds_When_BothScheduleOutcomesAreHandled() { }
}
```

> **Implementer'a not:** `AnnouncementSubmittedForApprovalNotificationTests.cs` ile
> `AnnouncementWithdrawnNotificationTests.cs`'yi OKU — ikisi de tam bu kalıbı uygular
> (NSubstitute ile `INotificationEnqueuer` yakalama, dedup anahtarı karşılaştırma,
> izolasyonlu sessizlik testi). Kurulumu oradan al. Doc yorumlarındaki iddiaları
> ZAYIFLATMA.

- [ ] **Step 3: Handler'ları yaz**

`AnnouncementScheduleNotificationHandlers.cs` — mevcut
`AnnouncementDecisionNotificationHandlers.cs`'yi (iki handler tek dosyada) emsal al.

```csharp
/// <summary>
/// Zamanlanmış yayın GERÇEKLEŞTİ → YAYINLAYANA. Derin bağlantı gönderim raporuna gider,
/// duyuru detayına değil: yayınlayanın merak ettiği "kime ulaştı"dır.
/// </summary>
public sealed class AnnouncementScheduledExecutedNotificationHandler(
    INotificationRecipientResolver resolver,
    INotificationEnqueuer enqueuer)
    : INotificationHandler<DomainEventNotification<AnnouncementScheduledExecutedEvent>>
{
    public async Task Handle(
        DomainEventNotification<AnnouncementScheduledExecutedEvent> notification, CancellationToken ct)
    {
        var e = notification.DomainEvent;

        var accountMap = await resolver.ResolvePersonAccountsMapAsync(
            e.SchoolId, [e.PublisherId], ct);

        if (!accountMap.TryGetValue(e.PublisherId, out var accountId))
        {
            // Yayınlayanın bağlı hesabı yok — gönderilecek yer yok. Sessizce çık.
            return;
        }

        // Tekrarlanabilir eylem: yayınlayan hedefi düzeltip yeniden zamanlayabilir, yani
        // AYNI duyuru ikinci kez yayınlanabilir. Dedup anahtarı bu yüzden OccurredAt.UtcTicks
        // İÇERİR — içermeseydi ikinci bildirim sessizce yutulurdu.
        var eventId = DeterministicGuid.Combine(
            e.SchoolId, e.AnnouncementId, $"ANNOUNCEMENT_SCHEDULED_EXECUTED:{e.OccurredAt.UtcTicks}");

        enqueuer.Enqueue(
            eventId, e.SchoolId, NotificationKind.AnnouncementScheduledExecuted,
            title: "Zamanlanmış duyurunuz yayınlandı",
            body: $"\"{e.Title}\" planlanan saatte yayınlandı.",
            deepLink: $"/announcements/{e.AnnouncementId}/delivery-report",
            recipientAccountIds: [accountId]);
    }
}

/// <summary>
/// Zamanlanmış yayın BAŞARISIZ → YAYINLAYANA, gerekçeyle. Duyuru <c>scheduled</c> kalır ve
/// job bir sonraki koşuda tekrar dener; yayınlayanın yapması gereken hedefi düzeltmektir,
/// bu yüzden derin bağlantı duyurunun kendisine gider.
/// </summary>
public sealed class AnnouncementScheduleFailedNotificationHandler(
    INotificationRecipientResolver resolver,
    INotificationEnqueuer enqueuer)
    : INotificationHandler<DomainEventNotification<AnnouncementScheduleFailedEvent>>
{
    public async Task Handle(
        DomainEventNotification<AnnouncementScheduleFailedEvent> notification, CancellationToken ct)
    {
        var e = notification.DomainEvent;

        var accountMap = await resolver.ResolvePersonAccountsMapAsync(
            e.SchoolId, [e.PublisherId], ct);

        if (!accountMap.TryGetValue(e.PublisherId, out var accountId))
        {
            return;
        }

        var eventId = DeterministicGuid.Combine(
            e.SchoolId, e.AnnouncementId, $"ANNOUNCEMENT_SCHEDULE_FAILED:{e.OccurredAt.UtcTicks}");

        enqueuer.Enqueue(
            eventId, e.SchoolId, NotificationKind.AnnouncementScheduleFailed,
            title: "Zamanlanmış duyurunuz yayınlanamadı",
            // Gerekçe AÇIK yazılır: "bir şeyler ters gitti" demek, yayınlayanın ne yapması
            // gerektiğini gizlerdi.
            body: $"\"{e.Title}\" duyurusunun hedefinde alıcı kalmadı. "
                + "Hedefi düzenleyip yeniden zamanlayabilirsiniz.",
            deepLink: $"/announcements/{e.AnnouncementId}",
            recipientAccountIds: [accountId]);
    }
}
```

> **KONTROLÖR DOĞRULAMASI (2026-08-04) — bunlar tahmin değil, kaynaktan okundu:**
>
> - Handler arayüzü **`INotificationHandler<DomainEventNotification<TEvent>>`**'dir — çıplak
>   olay tipi DEĞİL. Olay `notification.DomainEvent` ile açılır. (Planın önceki sürümü çıplak
>   tipi yazıyordu ve **derlenmezdi**.)
> - `INotificationEnqueuer.Enqueue(Guid eventId, Guid schoolId, NotificationKind kind,
>   string title, string body, string? deepLink, IReadOnlyList<Guid> recipientAccountIds)` —
>   `void`, async değil.
> - `DeterministicGuid.Combine(params object[] parts)` — tek overload.
> - Alıcı listesi kalıbı: `accountMap.Values.Distinct().ToList()`.
> - Erken çıkış kalıbı: `if (accountMap.Count == 0) { return; }`.
>
> **Emsal dosya `AnnouncementDecisionNotificationHandlers.cs`'tir — iki handler tek dosyada,
> aynı kalıp. ONU OKU ve birebir izle.** Derin bağlantı biçimi de oradan gelir
> (`$"/announcements/{e.AnnouncementId}"`). Derin bağlantı biçimini de oradan al —
> yukarıdaki dizeler yalnız NİYETİ gösterir; gerçek kalıp `AnnouncementPublishedNotificationHandler`
> ne kullanıyorsa odur.

- [ ] **Step 4: Testleri koş**

- [ ] **Step 5: Zorunlu mutasyon denetimi — testlerin handler'ı gerçekten sınadığını kanıtla**

Her iki handler'ın gövdesini sırayla `return Task.CompletedTask;` ile GEÇİCİ olarak boşalt
ve testleri koş.
Beklenen: her boşaltma, o handler'a ait TÜM pozitif testleri öldürür.
**Hiçbir test ölmüyorsa testler handler'ı örneklemiyordur** (A2 BLOCKER 3'ün tam hâli) —
DUR, testleri düzelt. Mutasyonları GERİ AL ve gözlemleri rapora yaz.

- [ ] **Step 6: Dört süiti koş, deltaları doğrula, commit**

```bash
git add src/Oksis.Domain/Modules/Announcements/ \
        src/Oksis.Application/Modules/Announcements/Events/Notifications/AnnouncementScheduleNotificationHandlers.cs \
        src/Oksis.Infrastructure/BackgroundJobs/Jobs/PublishScheduledAnnouncementsJob.cs tests/
git commit -m "feat(api): zamanlanmis yayin bildirim handler'lari eklendi

Iki ayri kind (22/23) ve iki ayri derin baglanti: 'gitti' rapora, 'gitmedi'
duyurunun kendisine goturur. AnnouncementPublishedEvent'e alan EKLENMEDI —
alti tuketicisi var; job kokten ayri bir olay yaydiriyor."
```

---

**Görev 13'ten itibaren:** `2026-08-03-duyurular-a3-yardimci-uclar-3.md`
