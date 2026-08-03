# Duyurular A2 — Yaşam Döngüsü ve Moderasyon Implementation Plan (3/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Bu dosya Görev 12–16'yı içerir.** Header, Global Constraints, plan-seviyesi düzeltmeler (**özellikle D-1 ve D-2**), dosya yapısı ve görev listesi **`2026-08-03-duyurular-a2-yasam-dongusu.md`**'dedir — **önce onu oku.** Görev 1–6 orada, Görev 7–11 `-2.md`'de.

Görev 12–16 spec dilim **5**'i (moderasyon) getirir ve A2'yi kapatır.

---

### Task 12: `SchoolSettings.AnnouncementModeration` kolonu + migration

Moderasyon modu **yeni bir tablo değildir.** `RequireApprovalForClassRoomCreation` ile aynı cinsten bir okul politikasıdır ve aynı yere gider (spec §3.3).

**Files:**
- Modify: `src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Schools/SchoolSettingsConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Migrations/<timestamp>_20260803_announcements_moderation_setting.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Schools/Entities/SchoolSettingsTests.cs` (mevcut)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementModerationPersistenceTests.cs`

**Interfaces:**
- Consumes: `SchoolSettings.CreateDefault(Guid schoolId)`, `SchoolSettingsUpdatedEvent(Guid schoolId, string changeKind)`, `AnnouncementModeration` (Open=0, Thresholded=1), `TenantEntity`
- Produces:
  - `AnnouncementModeration SchoolSettings.AnnouncementModeration { get; private set; }` — varsayılan `Open`
  - `void SchoolSettings.UpdateAnnouncementModeration(AnnouncementModeration mode)`
  - DB kolonu `school.school_settings.announcement_moderation` (int, default 0)

- [ ] **Step 1: Failing testleri yaz**

`tests/Oksis.Domain.UnitTests/Modules/Schools/Entities/SchoolSettingsTests.cs`'e ekle:

```csharp
/// <summary>
/// Duyuru moderasyonu varsayılan olarak SERBEST'tir (KR-01). Eşikli mod bir okul kararıdır
/// ve açıkça açılır — varsayılanı <c>Thresholded</c> yapmak, hiçbir okulun istemediği bir
/// onay kuyruğunu bütün öğretmenlere dayatırdı.
/// </summary>
[Fact]
public void Should_DefaultToOpenModeration_When_SettingsAreCreated()
{
    var settings = SchoolSettings.CreateDefault(Guid.NewGuid());

    settings.AnnouncementModeration.Should().Be(AnnouncementModeration.Open);
}

[Fact]
public void Should_UpdateModeration_When_UpdateAnnouncementModerationIsCalled()
{
    var settings = SchoolSettings.CreateDefault(Guid.NewGuid());
    settings.ClearDomainEvents();

    settings.UpdateAnnouncementModeration(AnnouncementModeration.Thresholded);

    settings.AnnouncementModeration.Should().Be(AnnouncementModeration.Thresholded);
    settings.DomainEvents.OfType<SchoolSettingsUpdatedEvent>().Should().ContainSingle();
}
```

`using Oksis.Domain.Modules.Announcements.Enums;` ve `using Oksis.Domain.Modules.Schools.Events;` ekle. `ClearDomainEvents()` adı dosyanın mevcut kullanımına göre düzeltilir (Görev 4 Step 2'de doğrulandı).

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementModerationPersistenceTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Schools.Entities;
using Oksis.Domain.Modules.Schools.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 12 — moderasyon modu <c>SchoolSettings</c>'te bir KOLONDUR, ayrı tablo değil
/// (spec §3.3: <c>RequireApprovalForClassRoomCreation</c> ile aynı cinsten bir okul politikası).
/// Bu test kolonun gerçekten yazılıp okunduğunu ve varsayılanının <c>Open</c> olduğunu
/// AYRI iki DbContext üzerinden kanıtlar — tek context'te değişiklik izleyicisi yanıltırdı.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AnnouncementModerationPersistenceTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public AnnouncementModerationPersistenceTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Should_PersistModerationMode_When_SettingsAreSavedAndReloaded()
    {
        var school = School.Create(
            $"Mod-{Guid.NewGuid():N}"[..16], $"MD-{Guid.NewGuid():N}"[..12], SchoolType.HighSchool);

        await using (var ctx = _database.CreateDbContext())
        {
            ctx.Schools.Add(school);
            ctx.SchoolSettings.Add(SchoolSettings.CreateDefault(school.Id));
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _database.CreateDbContext(school.Id))
        {
            var settings = await ctx.SchoolSettings.SingleAsync(s => s.SchoolId == school.Id);
            settings.AnnouncementModeration.Should().Be(AnnouncementModeration.Open,
                "varsayilan SERBEST'tir (KR-01)");

            settings.UpdateAnnouncementModeration(AnnouncementModeration.Thresholded);
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _database.CreateDbContext(school.Id))
        {
            var reloaded = await ctx.SchoolSettings.AsNoTracking()
                .SingleAsync(s => s.SchoolId == school.Id);
            reloaded.AnnouncementModeration.Should().Be(AnnouncementModeration.Thresholded);
        }
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SchoolSettingsTests"
```
Expected: FAIL — derleme hatası (`AnnouncementModeration` property yok).

- [ ] **Step 3: Entity'ye alan ve metot ekle**

`SchoolSettings.cs`:

1. `using Oksis.Domain.Modules.Announcements.Enums;` ekle (aynı assembly, `Oksis.Domain`).
2. `DutyDayPattern DutyDayPattern` property'sinin altına:

```csharp
    /// <summary>
    /// Okul geneli duyuru moderasyonu (KR-01). <see cref="AnnouncementModeration.Open"/> =
    /// serbest yayın (varsayılan); <see cref="AnnouncementModeration.Thresholded"/> = eşikli —
    /// öğretmenin VELİLERE gönderdiği duyuru yönetim onayına düşer (INV-5).
    ///
    /// <para><b>Neden burada:</b> bu bir okul politikasıdır, tıpkı
    /// <see cref="RequireApprovalForClassRoomCreation"/> gibi. Ayrı bir tablo açmak, tek
    /// satırlık bir enum için bir aggregate daha ve bir tenant filtresi daha demek olurdu.
    /// <c>GET/PUT /announcements/moderation</c> ucu bunu okur ve Ayarlar › Bildirimler ekranı
    /// ileride AYNI ucu tüketir — ayar duyuru domainine aittir, iki yerde tanımlanmaz.</para>
    /// </summary>
    public AnnouncementModeration AnnouncementModeration { get; private set; }
```

3. `CreateDefault`'un object initializer'ına (`DutyDayPattern = DutyDayPattern.Spread,` satırının altına):

```csharp
            AnnouncementModeration = AnnouncementModeration.Open,
```

4. `UpdateDutiesConfiguration`'ın altına:

```csharp
    /// <summary>
    /// Okul geneli duyuru moderasyon modunu değiştirir (KR-01). <c>announcements.moderate</c>
    /// izniyle korunur (<c>UpdateAnnouncementModerationCommand</c>).
    /// </summary>
    public void UpdateAnnouncementModeration(AnnouncementModeration mode)
    {
        AnnouncementModeration = mode;
        Raise(new SchoolSettingsUpdatedEvent(SchoolId, nameof(UpdateAnnouncementModeration)));
    }
```

- [ ] **Step 4: EF configuration**

`SchoolSettingsConfiguration.cs` — nöbet politikası bloğunun altına:

```csharp
        // Duyuru moderasyonu (A2 dilim 5). Nöbet enum'larıyla AYNI kalıp: int'e çevrilir,
        // varsayılanı Open (serbest yayın) — mevcut okullar migration sonrası da serbest kalır.
        builder.Property(x => x.AnnouncementModeration)
            .IsRequired()
            .HasConversion<int>()
            .HasDefaultValue(Oksis.Domain.Modules.Announcements.Enums.AnnouncementModeration.Open);
```

- [ ] **Step 5: Migration üret**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet ef migrations add 20260803_announcements_moderation_setting \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet format
```

> **`dotnet format` migration'dan HEMEN SONRA, test derlemesinden ÖNCE.** EF'in şablonu bu deponun IDE0161 analizörünü (error seviyesi) kırar — A1 Görev 6'nın kayıtlı operasyonel dersi.

Üretilen dosyayı **oku** ve doğrula:
- Yalnız `school_settings` tablosuna `AddColumn` var; başka tablo değişmiyor.
- Kolon adı `announcement_moderation`, tip `int`, `nullable: false`, `defaultValue: 0`.
- `Down` metodu `DropColumn` yapıyor.

Beklenenin dışında bir şey varsa **DUR ve bildir** — özellikle başka bir modülün bekleyen model değişikliği bu migration'a sızmışsa.

- [ ] **Step 6: Testler**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~SchoolSettingsTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementModerationPersistenceTests"
```
Expected: PASS.

- [ ] **Step 7: Mevcut `SchoolSettings` süitinin bozulmadığını doğrula**

```bash
dotnet test tests/Oksis.Domain.UnitTests
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~SchoolSettings"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SchoolSettings"
```
Expected: PASS. `SchoolSettingsUniqueIndexTests` ve `SchoolSettingsMappingsTests` **özellikle** yeşil kalmalı — mapping'e yeni alan eklenmedi ve eklenmemelidir (`SchoolSettingsDetailDto`'ya moderasyon **KOYULMAZ**; ayarın tek okuma yüzeyi `/announcements/moderation`'dır, spec §3.3).

- [ ] **Step 8: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs \
        src/Oksis.Infrastructure/Persistence/Configurations/Schools/SchoolSettingsConfiguration.cs \
        src/Oksis.Infrastructure/Persistence/Migrations/ tests/
git commit -m "feat(core): duyuru moderasyon modu okul ayarina eklendi

Yeni tablo DEGIL: RequireApprovalForClassRoomCreation ile ayni cinsten bir okul
politikasi ve ayni yere gidiyor (spec 3.3). Varsayilan Open -- migration sonrasi
mevcut okullar serbest yayinda kalir. SchoolSettingsDetailDto'ya EKLENMEDI: ayarin
tek okuma yuzeyi /announcements/moderation'dir."
```

---

### Task 13: `GET | PUT /announcements/moderation`

> **D-1 UYGULANIR (bkz. ana dosya).** `GET` izni **`announcements.create`**'tir, `moderate` DEĞİL — aksi hâlde öğretmen compose ekranı 403 alır, istemci `?? "open"` varsayılanına düşer ve öğretmene "yayınlanacak" denip duyuru onay kuyruğuna düşer. `PUT` izni `announcements.moderate`'tir.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementModerationDto.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementModeration/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Commands/UpdateAnnouncementModeration/{Command,Handler,Validator}.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Modify: `tests/.../AnnouncementPermissionSurfaceTests.cs`, `AnnouncementAudienceFixture.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementModerationEndpointTests.cs`

**Interfaces:**
- Consumes: `SchoolSettings.{AnnouncementModeration, UpdateAnnouncementModeration}` (Görev 12), `IApplicationDbContext.SchoolSettings`, `AnnouncementEnumWire.ToWire(AnnouncementModeration)` (mevcut)
- Produces:
  - `sealed record AnnouncementModerationDto { required string Mode { get; init; } }`
  - `sealed record GetAnnouncementModerationQuery() : IQuery<AnnouncementModerationDto>` — `[Tenancy(Required)]` + `[RequirePermission("announcements.create")]`
  - `sealed record UpdateAnnouncementModerationCommand(string Mode) : ICommand<AnnouncementModerationDto>` — `[Tenancy(Required)]` + `[RequirePermission("announcements.moderate")]`
  - `static AnnouncementModeration AnnouncementEnumWire.ParseModeration(string wire)` — **YENİ**, mevcut `Parse*` ailesine eklenir
  - `sealed record UpdateModerationRequestBody(string Mode)`
  - Fixture yardımcıları: `Task<string> GetModerationAsync(Guid asAccountId)`, `Task<string> SetModerationAsync(Guid asAccountId, string mode)`

- [ ] **Step 1: Failing testleri yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementModerationEndpointTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 13 — <c>GET | PUT /announcements/moderation</c>.
///
/// <para><b>İki ayrı izin, bilinçli olarak.</b> Okuma <c>announcements.create</c> ile açılır
/// çünkü ÖĞRETMEN compose ekranında bu modu okumak ZORUNDADIR: istemci
/// <c>requiresApproval({ isTeacher, moderation, selections })</c> ile "bu duyuru onaya mı
/// düşecek" sorusunu cevaplar. Öğretmen 403 alsaydı istemci <c>?? "open"</c> varsayılanına
/// düşer ve öğretmene "yayınlanacak" denip duyuru onay kuyruğuna düşerdi — spec §11'in
/// açıkça yasakladığı istemci/sunucu ayrışması. Yazma ise yönetimde kalır
/// (<c>announcements.moderate</c>).</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AnnouncementModerationEndpointTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public AnnouncementModerationEndpointTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Should_ReturnOpen_When_SchoolHasNotChangedModeration()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        (await fixture.GetModerationAsync(fixture.AdminAccountId)).Should().Be("open");
    }

    /// <summary>
    /// <b>D-1'in testi.</b> Öğretmen modu OKUYABİLİR. Bu test silinirse compose ekranının
    /// sessiz ayrışması geri gelir; izni <c>moderate</c>'e çevirmek YALNIZ bu testi kırar.
    /// </summary>
    [Fact]
    public async Task Should_AllowRead_When_TeacherAsksForModeration()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        (await fixture.GetModerationAsync(fixture.TeacherAccountId)).Should().Be("open");
    }

    /// <summary>
    /// Veli/öğrenci modu okuyamaz — onların yayın yüzeyi yoktur. <b>İzolasyon:</b> velinin
    /// <c>announcements.view</c> izni VARDIR ve gelen kutusunu okuyabilir; 403'ün tek
    /// açıklaması <c>announcements.create</c>'in yokluğudur.
    /// </summary>
    [Fact]
    public async Task Should_Forbid_When_ParentAsksForModeration()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var act = async () => await fixture.GetModerationAsync(fixture.ParentAccountId);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Error.Forbidden*");
    }

    [Fact]
    public async Task Should_PersistNewMode_When_ManagerUpdatesModeration()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var updated = await fixture.SetModerationAsync(fixture.AdminAccountId, "thresholded");

        updated.Should().Be("thresholded");
        (await fixture.GetModerationAsync(fixture.AdminAccountId)).Should().Be("thresholded");
    }

    /// <summary>
    /// Öğretmen modu DEĞİŞTİREMEZ. <b>İzolasyon:</b> öğretmen aynı ucu OKUYABİLİYOR
    /// (üstteki test) — 403'ün tek açıklaması <c>announcements.moderate</c>'in yokluğudur,
    /// uca hiç erişememesi değil.
    /// </summary>
    [Fact]
    public async Task Should_Forbid_When_TeacherUpdatesModeration()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var act = async () => await fixture.SetModerationAsync(fixture.TeacherAccountId, "thresholded");

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Error.Forbidden*");
    }

    [Fact]
    public async Task Should_Fail_When_ModeIsUnknown()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var act = async () => await fixture.SetModerationAsync(fixture.AdminAccountId, "strict");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Announcements.Moderation.Invalid*");
    }
}
```

> **İzin kapısı nerede?** Fixture handler'ı doğrudan çağırır ve `[RequirePermission]` UYGULANMAZ (A1'in kayıtlı kalıbı). Bu yüzden **handler'ın kendisi** izni sorar — `GetAnnouncementModerationQueryHandler` `CanUseInventoryAsync` (yani `announcements.create`), `UpdateAnnouncementModerationCommandHandler` ise `HasPermissionAsync("announcements.moderate")` çağırır. Öznitelik bu kontrolü **tekrarlar**, yerine geçmez: öznitelik MediatR yolunda erken keser, handler kontrolü ise doğrudan çağrıya karşı korur ve test edilebilirdir. İki katman kasıtlıdır (spec §4: "izin ucu açar, handler kapsamı belirler").

- [ ] **Step 2: Fixture'a iki yardımcı ekle**

```csharp
    /// <summary>Görev 13 — <c>GET /announcements/moderation</c> ucunu çalıştırır.</summary>
    public async Task<string> GetModerationAsync(Guid asAccountId)
    {
        var tenant = new FakeTenantContext(AdminScope.SchoolId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));

        var handler = new GetAnnouncementModerationQueryHandler(_context, tenant, permissionReader);
        var result = await handler.Handle(new GetAnnouncementModerationQuery(), CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"GetModerationAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!.Mode;
    }

    /// <summary>Görev 13 — <c>PUT /announcements/moderation</c> ucunu çalıştırır.</summary>
    public async Task<string> SetModerationAsync(Guid asAccountId, string mode)
    {
        var tenant = new FakeTenantContext(AdminScope.SchoolId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));

        var handler = new UpdateAnnouncementModerationCommandHandler(_context, tenant, permissionReader);
        var result = await handler.Handle(
            new UpdateAnnouncementModerationCommand(mode), CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"SetModerationAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!.Mode;
    }
```

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementModerationEndpointTests"`
Expected: FAIL — derleme hatası.

- [ ] **Step 4: `ParseModeration`'ı ekle**

`AnnouncementEnumWire.cs` — `ParseType`'ın altına:

```csharp
    public static AnnouncementModeration ParseModeration(string wire) => wire switch
    {
        "open" => AnnouncementModeration.Open,
        "thresholded" => AnnouncementModeration.Thresholded,
        _ => throw new ArgumentOutOfRangeException(nameof(wire), wire, "Bilinmeyen moderasyon modu."),
    };
```

`tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementEnumWireTests.cs`'e — mevcut ToWire/Parse ters-eşleme testlerinin kalıbını izleyerek:

```csharp
[Theory]
[InlineData(AnnouncementModeration.Open, "open")]
[InlineData(AnnouncementModeration.Thresholded, "thresholded")]
public void Should_RoundTripModeration_When_ConvertedBothWays(AnnouncementModeration value, string wire)
{
    AnnouncementEnumWire.ToWire(value).Should().Be(wire);
    AnnouncementEnumWire.ParseModeration(wire).Should().Be(value);
}

[Fact]
public void Should_Throw_When_ModerationWireIsUnknown()
{
    var act = () => AnnouncementEnumWire.ParseModeration("strict");

    act.Should().Throw<ArgumentOutOfRangeException>();
}
```

- [ ] **Step 5: DTO + sorgu + handler**

`DTOs/AnnouncementModerationDto.cs`:

```csharp
namespace Oksis.Application.Modules.Announcements.DTOs;

/// <summary>
/// Okul geneli moderasyon ayarı — <c>contract.ts</c>'teki <c>AnnouncementModerationDto</c>
/// ve <c>UpdateModerationBody</c> ile birebir (ikisi de tek alanlı: <c>mode</c>).
/// Tel'de string anahtar: <c>"open"</c> | <c>"thresholded"</c>.
/// </summary>
public sealed record AnnouncementModerationDto
{
    public required string Mode { get; init; }
}
```

`Queries/GetAnnouncementModeration/GetAnnouncementModerationQuery.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementModeration;

/// <summary>
/// Okul geneli moderasyon modunu okur.
///
/// <para><b>İzni <c>announcements.create</c>'tir, <c>moderate</c> DEĞİL</b> (plan düzeltmesi
/// D-1). Öğretmen compose ekranında bu modu okumak ZORUNDADIR — <c>requiresApproval</c> saf
/// fonksiyonu onu girdi alır. <c>moderate</c> ile korunsaydı öğretmen 403 alır, istemci
/// <c>?? "open"</c> varsayılanına düşer ve öğretmene "yayınlanacak" denip duyuru onay
/// kuyruğuna düşerdi. Yazma yetkisi ise yönetimde kalır (<c>UpdateAnnouncementModerationCommand</c>).</para>
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.create")]
public sealed record GetAnnouncementModerationQuery : IQuery<AnnouncementModerationDto>;
```

`Queries/GetAnnouncementModeration/GetAnnouncementModerationQueryHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementModeration;

/// <summary>
/// Moderasyon modunu <c>SchoolSettings</c>'ten okur (spec §3.3 — ayrı tablo yok).
///
/// <para>Ayar satırı yoksa <c>Open</c> döner: okul kurulumu <c>SchoolSettings.CreateDefault</c>
/// ile satırı her zaman açar, ama eksik bir satır yüzünden compose ekranını 500'e düşürmek
/// yerine SERBEST varsayılanına düşmek doğru davranıştır — eşikli mod açık bir okul kararıdır
/// ve kaza eseri açılamaz.</para>
/// </summary>
public sealed class GetAnnouncementModerationQueryHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IPermissionReader permissionReader)
    : IQueryHandler<GetAnnouncementModerationQuery, AnnouncementModerationDto>
{
    public async Task<Result<AnnouncementModerationDto>> Handle(
        GetAnnouncementModerationQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementModerationDto>.Forbidden();
        }

        // Yayınlayan yüzeyi — veli/öğrencide announcements.view vardır ama moderasyon
        // onların sorusu değildir (bkz. CanUseInventoryAsync doc'u, aynı ayrım).
        if (!await AnnouncementCallerResolver.CanUseInventoryAsync(permissionReader, cancellationToken))
        {
            return Result<AnnouncementModerationDto>.Forbidden();
        }

        var mode = await db.SchoolSettings.AsNoTracking()
            .Where(s => s.SchoolId == schoolId)
            .Select(s => (AnnouncementModeration?)s.AnnouncementModeration)
            .FirstOrDefaultAsync(cancellationToken) ?? AnnouncementModeration.Open;

        return Result<AnnouncementModerationDto>.Success(
            new AnnouncementModerationDto { Mode = AnnouncementEnumWire.ToWire(mode) });
    }
}
```

- [ ] **Step 6: Komut + validator + handler**

`Commands/UpdateAnnouncementModeration/UpdateAnnouncementModerationCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementModeration;

/// <summary>
/// Okul geneli moderasyon modunu değiştirir. Gövde <c>contract.ts</c>'teki
/// <c>UpdateModerationBody</c> ile birebir: tek alan, <c>mode</c>.
/// Yazma yönetimde kalır — okuma ise <c>announcements.create</c> ile açıktır (D-1).
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.moderate")]
public sealed record UpdateAnnouncementModerationCommand(string Mode)
    : ICommand<AnnouncementModerationDto>;
```

`UpdateAnnouncementModerationCommandValidator.cs`:

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementModeration;

/// <summary>
/// <c>AnnouncementEnumWire.ParseModeration</c> bilinmeyen bir anahtarda
/// <see cref="ArgumentOutOfRangeException"/> fırlatır ve o istisna
/// <c>ExceptionHandlingMiddleware</c>'in hiçbir kolunu tutturamayıp 500'e düşerdi
/// (A1 Görev 12'nin aynı bulgusu). Bu kural onu 400'de keser.
/// </summary>
public sealed class UpdateAnnouncementModerationCommandValidator
    : AbstractValidator<UpdateAnnouncementModerationCommand>
{
    private static readonly HashSet<string> _validModes = ["open", "thresholded"];

    public UpdateAnnouncementModerationCommandValidator()
    {
        RuleFor(x => x.Mode).NotNull().Must(_validModes.Contains)
            .WithMessage("announcements.errors.moderation-invalid");
    }
}
```

`UpdateAnnouncementModerationCommandHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.UpdateAnnouncementModeration;

/// <summary>
/// Moderasyon modunu <c>SchoolSettings</c> üzerinde günceller. Okul geneli bir karardır —
/// kişi/kapsam daraltması YOKTUR, yalnız <c>announcements.moderate</c> izni vardır.
/// </summary>
public sealed class UpdateAnnouncementModerationCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IPermissionReader permissionReader)
    : ICommandHandler<UpdateAnnouncementModerationCommand, AnnouncementModerationDto>
{
    public async Task<Result<AnnouncementModerationDto>> Handle(
        UpdateAnnouncementModerationCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementModerationDto>.Forbidden();
        }

        if (!await permissionReader.HasPermissionAsync("announcements.moderate", cancellationToken))
        {
            return Result<AnnouncementModerationDto>.Forbidden();
        }

        // Validator aynı kümeyi 400'de keser; burası handler doğrudan çağrıldığında
        // (testler) ArgumentOutOfRangeException'ın 500'e sızmasını engelleyen savunma hattı.
        if (request.Mode is not ("open" or "thresholded"))
        {
            return Result<AnnouncementModerationDto>.Failure(
                new Error("Announcements.Moderation.Invalid", "Bilinmeyen moderasyon modu."));
        }

        var settings = await db.SchoolSettings
            .SingleOrDefaultAsync(s => s.SchoolId == schoolId, cancellationToken);

        if (settings is null)
        {
            return Result<AnnouncementModerationDto>.NotFound();
        }

        settings.UpdateAnnouncementModeration(AnnouncementEnumWire.ParseModeration(request.Mode));
        await db.SaveChangesAsync(cancellationToken);

        return Result<AnnouncementModerationDto>.Success(
            new AnnouncementModerationDto
            {
                Mode = AnnouncementEnumWire.ToWire(settings.AnnouncementModeration),
            });
    }
}
```

- [ ] **Step 7: Controller uçları**

```csharp
    /// <summary>
    /// Okul geneli moderasyon modu. <b>Okuma <c>announcements.create</c> ile açıktır</b> —
    /// öğretmen compose ekranı bu modu okumak zorundadır (bkz. sorgu sınıfının doc'u).
    /// </summary>
    [HttpGet("moderation")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementModerationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetModerationAsync(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnnouncementModerationQuery(), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }

    /// <summary>Moderasyon modunu değiştirir — yalnız <c>announcements.moderate</c>.</summary>
    [HttpPut("moderation")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementModerationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateModerationAsync(
        [FromBody] UpdateModerationRequestBody body, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new UpdateAnnouncementModerationCommand(body.Mode), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

Dosya sonuna: `public sealed record UpdateModerationRequestBody(string Mode);`

> **Rota sırası uyarısı.** `moderation` ve `approvals` gibi sabit segmentler `{id:guid}` ile ÇAKIŞMAZ çünkü `:guid` kısıtı onları eler. Yine de yeni uçları `audience`/`inbox` ile aynı bölgeye, `{id:guid}` uçlarından **önce** yerleştir — mevcut dosyanın düzeni budur.

- [ ] **Step 8: İzin yüzeyi tablosunu güncelle**

```csharp
yield return [typeof(GetAnnouncementModerationQuery), "announcements.create"];
yield return [typeof(UpdateAnnouncementModerationCommand), "announcements.moderate"];
```
Keşif sayısı **12**.

- [ ] **Step 9: Testler**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~Announcement"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementModerationEndpointTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests
```
Expected: PASS (6 moderasyon ucu testi). Tam süitte Görev 16'ya bırakılan controller bekçisi + Documents/S3 tabanı.

- [ ] **Step 10: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Application/Modules/Announcements/ src/Oksis.Api/Controllers/V1/AnnouncementsController.cs tests/
git commit -m "feat(api): moderasyon okuma ve yazma uclari eklendi

Okuma izni announcements.create -- spec 6 ikisini de moderate'e bagliyordu ama o,
ogretmen compose ekranini kirardi: istemci requiresApproval'i moderasyon moduyla
hesapliyor ve 403'te ?? open varsayilanina duserek ogretmene yayinlanacak derken
duyuruyu onay kuyruguna dusururdu. Yazma yonetimde kaldi."
```

---

### Task 14: `IAnnouncementModerationPolicy` (INV-5) + yayın akışına bağlanması

**INV-5:** `pendingApproval` yalnız **`thresholded` mod + öğretmen → veli** hâlinde doğar.

**Bağlayıcı taraf backend'dir** (spec §11). İstemcideki saf fonksiyon (`packages/core/.../logic.ts` → `requiresApproval`) 20 birim testiyle korunuyor; backend farklı davranırsa öğretmene "yayınlanacak" denip duyuru kuyruğa düşer. Bu görev **aynı vakaları** backend'de tekrarlar.

Kontrat (istemci, kelimesi kelimesine):
```ts
if (!input.isTeacher || input.moderation !== "thresholded") return false
return input.selections.some((s) => s.bucket === "parent")
```

Backend çevirisi:
- `isTeacher` → `scopedPublisherId is not null` (yönetim yetkisi olmayan yayınlayan). **Rol SORULMAZ** — `IsInRole` ölü koddur.
- `selections` → **HAYATTA KALAN** seçim kümesi (Görev 1). Süzülmemiş girdiye bakmak, düşürülmüş bir veli seçiminin duyuruyu gereksiz yere kuyruğa sokmasına yol açardı.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Abstractions/IAnnouncementModerationPolicy.cs`
- Create: `src/Oksis.Infrastructure/Announcements/AnnouncementModerationPolicy.cs`
- Create: `src/Oksis.Domain/Modules/Announcements/Events/AnnouncementSubmittedForApprovalEvent.cs`
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs` (`MarkPendingApproval` olay yayar)
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Events/Notifications/AnnouncementSubmittedForApprovalNotificationHandler.cs`
- Modify: DI kaydı (Step 4'te tespit edilir)
- Modify: `tests/.../AnnouncementAudienceFixture.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementModerationPolicyTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/ThresholdedModerationTests.cs`

**Interfaces:**
- Consumes: `Announcement.MarkPendingApproval()` (mevcut), `AudienceSelectionBody` (`Dimension`, `Key`, `Bucket`), `SchoolSettings.AnnouncementModeration` (Görev 12), `NotificationKind.AnnouncementSubmittedForApproval` (Görev 6)
- Produces:
  - `interface IAnnouncementModerationPolicy { Task<bool> RequiresApprovalAsync(Guid schoolId, bool isScopedPublisher, IReadOnlyList<AudienceSelectionBody> selections, CancellationToken ct); }`
  - `sealed record AnnouncementSubmittedForApprovalEvent(Guid SchoolId, Guid AnnouncementId, string Title, Guid PublisherId, DateTimeOffset OccurredAt) : IDomainEvent`
  - `CreateAnnouncementCommandHandler` yeni ctor parametresi: `IAnnouncementModerationPolicy policy` (**altıncı sıradan sonra, `IDateTimeProvider clock`'tan ÖNCE** — fixture bunu bilmelidir)
  - Fixture: `Task SetModerationDirectAsync(AnnouncementModeration mode)`

- [ ] **Step 1: Politika için failing test yaz**

`tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementModerationPolicyTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

/// <summary>
/// INV-5 — <c>pendingApproval</c> YALNIZ <c>thresholded</c> + öğretmen → veli hâlinde doğar.
///
/// <para><b>Bu tablo istemcideki saf fonksiyonun (<c>packages/core/src/announcements/logic.ts</c>
/// → <c>requiresApproval</c>) AYNI vakalarıdır.</b> Spec §11: ikisi ayrışırsa öğretmene
/// "yayınlanacak" denip duyuru onay kuyruğuna düşer. Backend bağlayıcı olan taraftır, ama
/// bağlayıcı olmak ayrışmayı engellemez — bunu bu tablo engeller.</para>
///
/// <para>Karar SAFTIR: girdiler (mod, kapsam, seçimler) verildiğinde sonuç bellidir.
/// Bu yüzden burada veritabanı yoktur; entegrasyon (mod okuma + yayın akışına bağlanma)
/// <c>ThresholdedModerationTests</c>'te sınanır.</para>
/// </summary>
public sealed class AnnouncementModerationPolicyTests
{
    private static AudienceSelectionBody Sel(string dimension, string key, string bucket) =>
        new() { Dimension = dimension, Key = key, Bucket = bucket };

    public static IEnumerable<object[]> Cases()
    {
        // mod, isScopedPublisher (öğretmen), seçimler, beklenen
        yield return [AnnouncementModeration.Open, true, new[] { ("role", "parent", "parent") }, false];
        yield return [AnnouncementModeration.Thresholded, false, new[] { ("role", "parent", "parent") }, false];
        yield return [AnnouncementModeration.Thresholded, true, new[] { ("role", "parent", "parent") }, true];
        yield return [AnnouncementModeration.Thresholded, true, new[] { ("section", "9-A", "student") }, false];
        yield return [AnnouncementModeration.Thresholded, true, new[] { ("section", "9-A", "teacher") }, false];
        // Karışık seçim: TEK BİR veli kovası yeter.
        yield return [AnnouncementModeration.Thresholded, true,
            new[] { ("section", "9-A", "student"), ("section", "9-B", "parent") }, true];
        yield return [AnnouncementModeration.Thresholded, true, Array.Empty<(string, string, string)>(), false];
    }

    [Theory]
    [MemberData(nameof(Cases))]
    public void Should_MatchClientRule_When_DecisionIsEvaluated(
        AnnouncementModeration mode, bool isScopedPublisher,
        (string Dimension, string Key, string Bucket)[] selections, bool expected)
    {
        var result = AnnouncementModerationPolicyRule.RequiresApproval(
            mode, isScopedPublisher,
            selections.Select(s => Sel(s.Dimension, s.Key, s.Bucket)).ToList());

        result.Should().Be(expected);
    }

    /// <summary>
    /// <c>all</c> katmanı KOVADAN BAĞIMSIZDIR (A1 Görev 10 kilidi) ve öğretmen havuzunda
    /// zaten HİÇ YOKTUR — dolayısıyla öğretmenin gövdesinde görünse bile hayatta kalan
    /// seçimlere giremez. Yine de kural, taşıdığı kovaya göre karar verir: bu satır,
    /// politikanın <c>dimension</c>'a değil <c>bucket</c>'a baktığını sabitler.
    /// </summary>
    [Fact]
    public void Should_LookAtBucketNotDimension_When_SelectionIsAllLayer()
    {
        AnnouncementModerationPolicyRule.RequiresApproval(
            AnnouncementModeration.Thresholded, isScopedPublisher: true,
            [Sel("all", "all", "parent")]).Should().BeTrue();

        AnnouncementModerationPolicyRule.RequiresApproval(
            AnnouncementModeration.Thresholded, isScopedPublisher: true,
            [Sel("all", "all", "student")]).Should().BeFalse();
    }
}
```

> Saf kural `AnnouncementModerationPolicyRule` adıyla **Application/Common**'da durur; `IAnnouncementModerationPolicy` ise onu okulun modunu okuyarak besleyen ince bir kabuktur. Ayrım kasıtlıdır: karar test edilebilir ve saf kalır, I/O ayrı yaşar.

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementModerationPolicyTests"`
Expected: FAIL — derleme hatası.

- [ ] **Step 3: Saf kuralı, arayüzü ve implementasyonu yaz**

`src/Oksis.Application/Modules/Announcements/Common/AnnouncementModerationPolicyRule.cs`:

```csharp
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// INV-5'in SAF kararı. İstemcideki <c>requiresApproval</c> (packages/core) ile kelimesi
/// kelimesine aynı kuraldır ve <c>AnnouncementModerationPolicyTests</c> aynı vakaları tutar.
///
/// <para><b>Rol SORULMAZ.</b> "Öğretmen mi" sorusu <c>isScopedPublisher</c> ile gelir:
/// yönetim yetkisi (<c>announcements.approve</c>) olmayan yayınlayan. <c>ICurrentUser.Roles</c>
/// bu depoda her zaman boştur ve <c>IsInRole</c> ölü koddur.</para>
/// </summary>
public static class AnnouncementModerationPolicyRule
{
    public static bool RequiresApproval(
        AnnouncementModeration mode,
        bool isScopedPublisher,
        IReadOnlyList<AudienceSelectionBody> selections)
    {
        if (!isScopedPublisher || mode is not AnnouncementModeration.Thresholded)
        {
            return false;
        }

        // Kova'ya bakılır, katmana DEĞİL: öğretmenin veli kovasına giden HERHANGİ bir
        // seçimi duyuruyu onaya düşürür. Öğrencilere gidenler serbest yayınlanır.
        return selections.Any(s => s.Bucket == "parent");
    }
}
```

`src/Oksis.Application/Modules/Announcements/Abstractions/IAnnouncementModerationPolicy.cs`:

```csharp
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Abstractions;

/// <summary>
/// Okulun moderasyon modunu okuyup INV-5 kararını veren ince kabuk. Kararın kendisi
/// <c>AnnouncementModerationPolicyRule</c>'da SAFTIR ve orada test edilir; bu arayüz yalnız
/// I/O'yu (okul ayarını okumak) soyutlar — handler'ın <c>SchoolSettings</c>'i tanımasına
/// gerek kalmaz.
/// </summary>
public interface IAnnouncementModerationPolicy
{
    /// <param name="isScopedPublisher">
    /// Yayınlayanın kapsamı kendi kayıtlarına daralmış mı (yönetim yetkisi YOK).
    /// Çağıran bunu <c>AnnouncementCallerResolver.ResolveScopedPublisherIdAsync</c>'in
    /// <c>null</c> OLMAMASINDAN türetir — rolden DEĞİL.
    /// </param>
    /// <param name="selections">
    /// <b>HAYATTA KALAN</b> seçimler (etiketi çözülmüş olanlar). Süzülmemiş girdiye bakmak,
    /// düşürülmüş bir veli seçiminin duyuruyu gereksiz yere kuyruğa sokmasına yol açardı.
    /// </param>
    Task<bool> RequiresApprovalAsync(
        Guid schoolId,
        bool isScopedPublisher,
        IReadOnlyList<AudienceSelectionBody> selections,
        CancellationToken ct);
}
```

`src/Oksis.Infrastructure/Announcements/AnnouncementModerationPolicy.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Announcements.Abstractions;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Infrastructure.Announcements;

/// <inheritdoc cref="IAnnouncementModerationPolicy"/>
public sealed class AnnouncementModerationPolicy(IApplicationDbContext db)
    : IAnnouncementModerationPolicy
{
    public async Task<bool> RequiresApprovalAsync(
        Guid schoolId,
        bool isScopedPublisher,
        IReadOnlyList<AudienceSelectionBody> selections,
        CancellationToken ct)
    {
        // Yönetim yayınlıyorsa veya seçimlerde veli kovası yoksa ayarı OKUMAYA GEREK YOKTUR —
        // sonuç zaten false. Sorgu, kararı gerçekten değiştirebilecek hâlde yapılır.
        if (!isScopedPublisher || !selections.Any(s => s.Bucket == "parent"))
        {
            return false;
        }

        var mode = await db.SchoolSettings.AsNoTracking()
            .Where(s => s.SchoolId == schoolId)
            .Select(s => (AnnouncementModeration?)s.AnnouncementModeration)
            .FirstOrDefaultAsync(ct) ?? AnnouncementModeration.Open;

        return AnnouncementModerationPolicyRule.RequiresApproval(mode, isScopedPublisher, selections);
    }
}
```

- [ ] **Step 4: DI kaydını bul ve ekle**

Run:
```bash
cd /Users/farukkaya/Repositories/oksis-api
grep -rn "IAudienceResolver" src/Oksis.Infrastructure --include=*.cs | grep -i "add\|register"
```

`AudienceResolver`'ın kaydedildiği yeri bul ve **hemen yanına** aynı ömürle ekle:

```csharp
services.AddScoped<IAnnouncementModerationPolicy, AnnouncementModerationPolicy>();
```

Kaydı bulamazsan `grep -rn "AudienceResolver>" src/` ile ara. **Kayıt yapılmazsa uygulama ayağa kalkarken patlar** — Görev 16'nın duman testi bunu yakalar, ama burada kapat.

- [ ] **Step 5: Domain — `MarkPendingApproval` olay yaysın**

`src/Oksis.Domain/Modules/Announcements/Events/AnnouncementSubmittedForApprovalEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Announcements.Events;

/// <summary>
/// Duyuru onay kuyruğuna düştü (INV-5 — eşikli moderasyon). Tüketicisi YÖNETİME bildirim
/// gönderir: onay kuyruğunda bekleyen iş vardır.
///
/// <para><see cref="PublisherId"/> taşınır çünkü onaylayan yönetici, kuyrukta kimin
/// duyurusunun beklediğini bilmelidir; bildirim gövdesi bunu kullanmasa da
/// <c>:approve</c>/<c>:reject</c> olayları aynı alanı taşır ve üçü tutarlı kalır.</para>
/// </summary>
public sealed record AnnouncementSubmittedForApprovalEvent(
    Guid SchoolId,
    Guid AnnouncementId,
    string Title,
    Guid PublisherId,
    DateTimeOffset OccurredAt) : IDomainEvent;
```

`Announcement.cs` — `MarkPendingApproval()`'ın gövdesine `Status = ...` satırından sonra:

```csharp
        Status = AnnouncementStatus.PendingApproval;

        Raise(new AnnouncementSubmittedForApprovalEvent(
            SchoolId, Id, Title, PublisherId, DateTimeOffset.UtcNow));
```

Domain testi ekle (`AnnouncementLifecycleTests.cs`):

```csharp
    [Fact]
    public void Should_RaiseSubmittedForApprovalEvent_When_MarkedPendingApproval()
    {
        var a = Draft();

        a.MarkPendingApproval();

        a.DomainEvents.OfType<AnnouncementSubmittedForApprovalEvent>().Should().ContainSingle()
            .Which.PublisherId.Should().Be(a.PublisherId);
    }
```

> **Mevcut `AnnouncementTests`'i kontrol et:** `MarkPendingApproval` için "hiç olay yaymaz" diyen bir test varsa **DUR ve bildir** — A1 böyle bir iddiada bulunmadıysa değişiklik güvenlidir, ama varsayma.

- [ ] **Step 6: Yayın akışına bağla**

`CreateAnnouncementCommandHandler.cs`:

1. Ctor'a parametre ekle — `IAudienceResolver resolver`'dan **sonra**, `IDateTimeProvider clock`'tan **önce**:

```csharp
public sealed class CreateAnnouncementCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader,
    IAudienceResolver resolver,
    IAnnouncementModerationPolicy moderationPolicy,
    IDateTimeProvider clock)
```

2. Görev 1'in bıraktığı `// A2 GİRİŞ NOKTASI` yorumunu (zamanlanmış bloğun hemen ardında) şununla değiştir — `var survivingSelections = ...` satırından **sonra**, `resolver.ResolveAsync` çağrısından **önce** durmalıdır:

```csharp
            var survivingSelections = surviving.Select(x => x.Selection).ToList();

            // INV-5 — eşikli moderasyon. Karar HAYATTA KALAN seçimlere bakar: düşürülmüş bir
            // veli seçimi (öğretmen kapsamı dışı, hedef olarak da donmayan) duyuruyu kuyruğa
            // sokmamalıdır. `scopedPublisherId is not null` = "yayınlayanın kapsamı kendine
            // daralmış" = istemcideki `isTeacher`; rol SORULMAZ, IsInRole bu depoda ölü koddur.
            if (await moderationPolicy.RequiresApprovalAsync(
                    schoolId, scopedPublisherId is not null, survivingSelections, cancellationToken))
            {
                // Zamanlanmış duyuruyla AYNI davranış: hedefler DONAR, alıcı MATERYALİZE
                // EDİLMEZ. Liste onay anında sabitlenir — onay ile yayın arasında geçen sürede
                // sınıf mevcudu değişebilir ve kuyruktaki bir sayıya güvenmek yanlış olurdu.
                announcement.MarkPendingApproval();

                AnnouncementAuditWriter.Write(
                    db, schoolId, announcement.Id,
                    new AnnouncementCaller(myPersonId,
                        await ResolveRealNameAsync(db, myPersonId, cancellationToken) ?? "Bilinmeyen",
                        IsManager: false),
                    action: "duyuruyu onaya gönderdi",
                    at: clock.UtcNow,
                    field: "Eşikli moderasyon — velilere giden öğretmen duyurusu",
                    tag: null,
                    tone: "warning");

                await db.SaveChangesAsync(cancellationToken);
                return Result<AnnouncementDto>.Success(
                    AnnouncementMapper.ToDto(announcement, targets, null, [], null));
            }

            var recipients = await resolver.ResolveAsync(
                scopeForLabels, survivingSelections, cancellationToken);
```

`using Oksis.Application.Modules.Announcements.Abstractions;` zaten var (`IAudienceResolver` için).

> `AnnouncementAuditWriter` `Guid.Empty` aktöre karşı domain guard'ıyla korunur; `myPersonId` bu noktada zaten `null` olamaz (handler başında sert durduruldu).

- [ ] **Step 7: Bildirim handler'ı**

`Events/Notifications/AnnouncementSubmittedForApprovalNotificationHandler.cs`:

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
/// Duyuru onay kuyruğuna düştüğünde YÖNETİME bildirim gönderir.
///
/// <para><b>Alıcı kümesi <c>announcements.approve</c> iznine sahip kişilerdir</b> — rolden
/// DEĞİL. Bu depoda rol sorusu sorulamaz (<c>ICurrentUser.Roles</c> boş), ama izin→rol→kişi
/// zinciri veritabanında okunabilir: <c>RoleAssignment</c> → <c>SystemRole</c> →
/// <c>RolePermission</c>. Kuyruğu göremeyecek birine bildirim göndermek gürültüdür.</para>
/// </summary>
public sealed class AnnouncementSubmittedForApprovalNotificationHandler(
    IApplicationDbContext db,
    INotificationRecipientResolver resolver,
    INotificationEnqueuer enqueuer)
    : INotificationHandler<DomainEventNotification<AnnouncementSubmittedForApprovalEvent>>
{
    public async Task Handle(
        DomainEventNotification<AnnouncementSubmittedForApprovalEvent> notification,
        CancellationToken cancellationToken)
    {
        var e = notification.DomainEvent;

        var approverPersonIds = await ApproverPersonIdsAsync(db, e.SchoolId, cancellationToken);
        if (approverPersonIds.Count == 0)
        {
            return;
        }

        var accountMap = await resolver.ResolvePersonAccountsMapAsync(
            e.SchoolId, approverPersonIds, cancellationToken);

        if (accountMap.Count == 0)
        {
            return;
        }

        var eventId = DeterministicGuid.Combine(
            e.SchoolId, e.AnnouncementId, "ANNOUNCEMENT_SUBMITTED_FOR_APPROVAL");

        enqueuer.Enqueue(
            eventId, e.SchoolId, NotificationKind.AnnouncementSubmittedForApproval,
            "Onay bekleyen duyuru",
            e.Title,
            "/announcements/approvals",
            accountMap.Values.Distinct().ToList());
    }

    /// <summary>
    /// <c>announcements.approve</c> iznine sahip AKTİF rol atamalarının kişileri.
    ///
    /// <para><b>Alan adları depodan doğrulanmıştır</b> (plan yazımı sırasında, 2026-08-03):
    /// <c>Permission.Code</c> (<c>Key</c> DEĞİL), <c>RoleAssignment.SystemRoleId</c>
    /// (<c>RoleId</c> DEĞİL), ve <c>RoleAssignment.Status</c> bir enum'dur —
    /// <c>IsActive</c> hesaplanmış bir property'dir ve LINQ-to-Entities'e çevrilemez.</para>
    ///
    /// <para><c>IPermissionReader</c> burada KULLANILAMAZ: o yalnız ÇAĞIRANIN izinlerini
    /// okur, başka kişilerinkini soramaz. Zincir bu yüzden elle kurulur.</para>
    /// </summary>
    private static async Task<List<Guid>> ApproverPersonIdsAsync(
        IApplicationDbContext db, Guid schoolId, CancellationToken ct)
    {
        var roleIds = await db.RolePermissions.AsNoTracking()
            .Where(rp => db.Permissions.Any(p => p.Id == rp.PermissionId
                && p.Code == "announcements.approve"))
            .Select(rp => rp.RoleId)
            .Distinct()
            .ToListAsync(ct);

        if (roleIds.Count == 0)
        {
            return [];
        }

        // Süresi dolmuş / iptal edilmiş atama onay kuyruğunu göremez — ona bildirim
        // göndermek gürültüdür. Status enum'u sorgulanabilir; IsActive property'si DEĞİL.
        return await db.RoleAssignments.AsNoTracking()
            .Where(ra => ra.SchoolId == schoolId
                && roleIds.Contains(ra.SystemRoleId)
                && ra.Status == RoleAssignmentStatus.Active)
            .Select(ra => ra.PersonId)
            .Distinct()
            .ToListAsync(ct);
    }
}
```

`using Oksis.Domain.Modules.Users.Enums;` (veya `RoleAssignmentStatus`'ün gerçek namespace'i) ekle.

- [ ] **Step 8: Onaylayan zincirini KOŞARAK doğrula**

Yukarıdaki alan adları plan yazımında doğrulandı, ama depo değişmiş olabilir. Derleme geçse bile **anlamı** doğrula:

```bash
cd /Users/farukkaya/Repositories/oksis-api
grep -n "RolePermissions\|RoleAssignments\|DbSet<Permission>" src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs
grep -rn "class RoleAssignment" -A 25 src/Oksis.Domain | grep -n "SystemRoleId\|PersonId\|Status"
grep -rn "class Permission" -A 20 src/Oksis.Domain | grep -n "Code\|Key"
grep -rn "enum RoleAssignmentStatus" -A 8 src/Oksis.Domain
```

Beklenen: `Permission.Code`, `RoleAssignment.SystemRoleId`, `RoleAssignment.PersonId`, `RoleAssignment.Status`, `RoleAssignmentStatus.Active`.

Ardından zincirin gerçekten kişi bulduğunu bir testle sabitle — `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementNotificationsTests.cs`'e (A1'in dosyası, kalıbı oradan al):

```csharp
/// <summary>
/// Onay kuyruğu bildiriminin alıcı zinciri: izin → rol → aktif atama → kişi. Zincirin bir
/// halkası kopsa (yanlış alan adı, eksik Status filtresi) sorgu SESSİZCE boş döner ve
/// handler erken çıkar — hiçbir test kırılmaz. Bu test boş dönüşü hata sayar.
/// </summary>
[Fact]
public async Task Should_ResolveApproverPersons_When_PermissionChainIsWalked()
{
    await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

    var roleIds = await fixture.Db.RolePermissions.AsNoTracking()
        .Where(rp => fixture.Db.Permissions.Any(p => p.Id == rp.PermissionId
            && p.Code == "announcements.approve"))
        .Select(rp => rp.RoleId)
        .Distinct()
        .ToListAsync();

    roleIds.Should().NotBeEmpty(
        "announcements.approve en az SCHOOL_ADMIN'e seed'lenmistir (A1 Gorev 7)");
}
```

> **Zincir doğrulanamazsa DUR ve bildir.** Alternatif: `AnnouncementSubmittedForApproval` bildirimini **A3'e ertele** ve onay kuyruğunun bugün yalnız ekrandaki sayı rozetiyle keşfedildiğini ledger'a yaz. **Uydurma bir zincir yazma.**

- [ ] **Step 9: Eşikli akış için failing test yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/ThresholdedModerationTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 14 — INV-5 uçtan uca. Eşikli modda öğretmenin VELİLERE gönderdiği duyuru onay
/// kuyruğuna düşer; öğrencilere gidenler ve yönetimin duyuruları serbest yayınlanır.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class ThresholdedModerationTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public ThresholdedModerationTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Should_QueueForApproval_When_TeacherTargetsParentsInThresholdedMode()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await fixture.SetModerationDirectAsync(AnnouncementModeration.Thresholded);

        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A veli duyurusu", "Veli toplantisi carsamba gunu.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        created.Status.Should().Be("pendingApproval");
        created.RecipientCount.Should().BeNull("alici listesi onay aninda sabitlenir, kuyrukta degil");

        var id = Guid.Parse(created.Id);
        (await fixture.Db.AnnouncementRecipients.AsNoTracking().CountAsync(r => r.AnnouncementId == id))
            .Should().Be(0, "kuyruktaki duyuru henuz kimseye gitmedi");
        (await fixture.Db.AnnouncementTargets.AsNoTracking().CountAsync(t => t.AnnouncementId == id))
            .Should().BeGreaterThan(0, "hedefler DONAR — onay aninda ayni kitleye cozulur");
    }

    /// <summary>
    /// Öğrencilere giden öğretmen duyurusu SERBEST yayınlanır (KR-01). <b>İzolasyon:</b>
    /// üstteki testle tek farkı <c>bucket</c>'tır — mod da, yayınlayan da, katman da aynı.
    /// Politika kovaya bakmasaydı bu test kırılırdı.
    /// </summary>
    [Fact]
    public async Task Should_PublishDirectly_When_TeacherTargetsStudentsInThresholdedMode()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await fixture.SetModerationDirectAsync(AnnouncementModeration.Thresholded);

        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A ogrenci duyurusu", "Yarin sinav yapilacaktir.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "student")], asDraft: false);

        created.Status.Should().Be("published");
    }

    /// <summary>
    /// YÖNETİMİN veli duyurusu eşikli modda da serbest yayınlanır — onay kuyruğu yöneticinin
    /// kendi kendini onaylamasını gerektirmez. <b>İzolasyon:</b> ilk testle tek farkı
    /// yayınlayandır.
    /// </summary>
    [Fact]
    public async Task Should_PublishDirectly_When_ManagerTargetsParentsInThresholdedMode()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await fixture.SetModerationDirectAsync(AnnouncementModeration.Thresholded);

        var created = await fixture.CreateAnnouncementAsync(
            "Okul geneli veli duyurusu", "Veli toplantisi carsamba gunu.",
            [("role", "parent", "parent")], asDraft: false);

        created.Status.Should().Be("published");
    }

    /// <summary>
    /// SERBEST modda öğretmenin veli duyurusu doğrudan yayınlanır. İlk testle tek farkı
    /// moddur — politikanın modu gerçekten okuduğunun kanıtı.
    /// </summary>
    [Fact]
    public async Task Should_PublishDirectly_When_ModerationIsOpen()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A veli duyurusu", "Veli toplantisi carsamba gunu.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        created.Status.Should().Be("published");
    }

    [Fact]
    public async Task Should_WriteAuditEntry_When_QueuedForApproval()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await fixture.SetModerationDirectAsync(AnnouncementModeration.Thresholded);

        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A veli duyurusu", "Veli toplantisi carsamba gunu.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        var entries = await fixture.Db.AnnouncementAuditEntries.AsNoTracking()
            .Where(e => e.AnnouncementId == Guid.Parse(created.Id)).ToListAsync();

        entries.Should().ContainSingle()
            .Which.Action.Should().Be("duyuruyu onaya gönderdi");
    }

    /// <summary>
    /// Taslak eşikli modda da TASLAKTIR — onay kuyruğuna düşmez. Taslak henüz bir yayın
    /// niyeti değildir; kuyruğa sokmak öğretmenin hazırlık defterini yönetimin masasına
    /// taşırdı.
    /// </summary>
    [Fact]
    public async Task Should_StayDraft_When_TeacherSavesDraftInThresholdedMode()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await fixture.SetModerationDirectAsync(AnnouncementModeration.Thresholded);

        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A veli duyurusu", "Veli toplantisi carsamba gunu.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: true);

        created.Status.Should().Be("draft");
    }
}
```

- [ ] **Step 10: Fixture'ı güncelle**

1. `CreateAnnouncementAsync` ve `CreateAnnouncementAsAsync`'teki `new CreateAnnouncementCommandHandler(...)` çağrılarına yeni parametreyi ekle:
   `new CreateAnnouncementCommandHandler(_context, tenant, currentUser, permissionReader, Resolver, new AnnouncementModerationPolicy(_context), clock)`
2. Yeni yardımcı:

```csharp
    /// <summary>
    /// Görev 14 — okulun moderasyon modunu doğrudan ayarlar. <c>SetModerationAsync</c>'ten
    /// (Görev 13) farkı, uç yerine entity'yi kullanmasıdır: bu testlerin konusu moderasyon
    /// UCU değil, modun YAYIN AKIŞINA etkisidir; ucu araya sokmak testi ikinci bir sebebe
    /// bağımlı kılardı.
    /// </summary>
    public async Task SetModerationDirectAsync(AnnouncementModeration mode)
    {
        var settings = await _context.SchoolSettings.SingleAsync(s => s.SchoolId == AdminScope.SchoolId);
        settings.UpdateAnnouncementModeration(mode);
        await _context.SaveChangesAsync();
    }
```

`using Oksis.Infrastructure.Announcements;` zaten var; `using Oksis.Domain.Modules.Announcements.Enums;` ekle.

- [ ] **Step 11: Testler**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementLifecycleTests"
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementModerationPolicyTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~ThresholdedModerationTests"
```
Expected: PASS (9 politika + 6 eşikli akış).

- [ ] **Step 12: İstemci kuralıyla eşleşmeyi GÖZLE doğrula**

`oksis-ui/packages/core/src/announcements/logic.ts` içindeki `requiresApproval`'ı aç ve `AnnouncementModerationPolicyRule.RequiresApproval` ile **satır satır** karşılaştır. Ayrıca `logic.test.ts`'teki `requiresApproval` vakalarını oku ve Step 1'in tablosunda **hepsinin** karşılığı olduğunu doğrula. Eksik vaka varsa tabloya ekle.

Bu adım manueldir ve **atlanamaz**: spec §11'in "backend bağlayıcı olan taraftır" cümlesi ancak iki kural aynıysa güvenlidir. Bulguyu ledger'a yaz.

- [ ] **Step 13: Tam süit**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests && dotnet test tests/Oksis.Application.UnitTests && dotnet test tests/Oksis.Domain.UnitTests`
Expected: Görev 16'ya bırakılan controller bekçisi + Documents/S3 tabanı dışında sıfır hata.

- [ ] **Step 14: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/ tests/
git commit -m "feat(api): esikli moderasyon yayin akisina baglandi

INV-5: esikli modda ogretmenin VELILERE giden duyurusu onay kuyruguna duser.
Karar saf bir kuralda (AnnouncementModerationPolicyRule) durur ve istemcideki
requiresApproval ile ayni vaka tablosuna sahiptir -- spec 11'in baglayici taraf
notu ancak iki kural ayniysa guvenlidir. Karar HAYATTA KALAN secimlere bakar:
dusurulmus bir veli secimi duyuruyu gereksiz yere kuyruga sokmaz. Kuyruktaki
duyuruda hedefler DONAR, alicilar onay aninda materyalize edilir."
```

---

### Task 15: `GET /announcements/approvals` + `:approve` + `:reject`

Onay kuyruğu ve kararı. **D-2 uygulanır:** red gerekçesi `WithdrawReason`'a **yazılmaz** — denetim izine ve bildirim gövdesine gider.

**Files:**
- Create: `src/Oksis.Domain/Modules/Announcements/Events/{AnnouncementApprovedEvent,AnnouncementRejectedEvent}.cs`
- Modify: `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs` (`Approve`, `Reject`)
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementReachRule.cs`
- Modify: `src/Oksis.Application/Modules/Announcements/Commands/CreateAnnouncement/CreateAnnouncementCommandHandler.cs` (reach kuralını ortak yere taşı)
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementApprovals/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Commands/{ApproveAnnouncement,RejectAnnouncement}/…`
- Create: `src/Oksis.Application/Modules/Announcements/Events/Notifications/AnnouncementDecisionNotificationHandlers.cs`
- Modify: controller, izin yüzeyi tablosu, fixture
- Test: `tests/Oksis.Domain.UnitTests/.../AnnouncementLifecycleTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementApprovalTests.cs`

**Interfaces:**
- Consumes: `Announcement.{Publish, MarkPendingApproval, PublisherId, AcademicSessionId, Type}`, `AnnouncementTarget.{Dimension, Key, Bucket}`, `IAudienceResolver.ResolveAsync`, `AnnouncementEnumWire.ToWire(AudienceDimension|AudienceBucket)`, Görev 6'nın üç parçası
- Produces:
  - `void Announcement.Approve(AnnouncementReach reach, int recipientCount, DateTimeOffset now)`
  - `void Announcement.Reject(string reason, Guid rejectedBy, DateTimeOffset now)`
  - `sealed record AnnouncementApprovedEvent(Guid SchoolId, Guid AnnouncementId, string Title, Guid PublisherId, DateTimeOffset OccurredAt) : IDomainEvent`
  - `sealed record AnnouncementRejectedEvent(Guid SchoolId, Guid AnnouncementId, string Title, Guid PublisherId, string Reason, DateTimeOffset OccurredAt) : IDomainEvent`
  - `static AnnouncementReach AnnouncementReachRule.From(IEnumerable<string> dimensions)`
  - `sealed record GetAnnouncementApprovalsQuery : IQuery<IReadOnlyList<AnnouncementDto>>` — `[RequirePermission("announcements.approve")]`
  - `sealed record ApproveAnnouncementCommand(Guid Id) : ICommand<AnnouncementDto>` — `[RequirePermission("announcements.approve")]`
  - `sealed record RejectAnnouncementCommand(Guid Id, string Reason) : ICommand<AnnouncementDto>` — `[RequirePermission("announcements.approve")]`
  - Fixture: `ApprovalsAsync`, `ApproveAsync`, `RejectAsync`

- [ ] **Step 1: Domain için failing test yaz**

`AnnouncementLifecycleTests.cs`'e ekle:

```csharp
    // ═══════════ Onay kararı ═══════════

    private static Announcement PendingApproval()
    {
        var a = Draft();
        a.MarkPendingApproval();
        a.ClearDomainEvents();
        return a;
    }

    [Fact]
    public void Should_PublishAndRaiseBothEvents_When_Approved()
    {
        var a = PendingApproval();

        a.Approve(AnnouncementReach.ClassScoped, recipientCount: 24, _now);

        a.Status.Should().Be(AnnouncementStatus.Published);
        a.RecipientCountSnapshot.Should().Be(24);
        a.PublishedAt.Should().Be(_now);

        // Onay İKİ haber üretir: alıcılar yeni duyuruyu, öğretmen kararı öğrenir.
        a.DomainEvents.OfType<AnnouncementPublishedEvent>().Should().ContainSingle();
        a.DomainEvents.OfType<AnnouncementApprovedEvent>().Should().ContainSingle();
    }

    [Theory]
    [InlineData(AnnouncementStatus.Draft)]
    [InlineData(AnnouncementStatus.Published)]
    public void Should_Throw_When_ApprovingNonPendingAnnouncement(AnnouncementStatus status)
    {
        var a = Draft();
        if (status is AnnouncementStatus.Published)
        {
            a.Publish(AnnouncementReach.SchoolWide, 1, _now);
        }

        var act = () => a.Approve(AnnouncementReach.ClassScoped, 1, _now);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Approve.InvalidStatus");
    }

    /// <summary>
    /// Reddedilen duyuru TASLAĞA döner — silinmez (INV-1) ve öğretmen düzeltip yeniden
    /// gönderebilir.
    /// </summary>
    [Fact]
    public void Should_ReturnToDraft_When_Rejected()
    {
        var a = PendingApproval();

        a.Reject("Ifade uygun degil.", _actor, _now);

        a.Status.Should().Be(AnnouncementStatus.Draft);
    }

    /// <summary>
    /// <b>D-2:</b> red gerekçesi <c>WithdrawReason</c>'a YAZILMAZ. O alan iki uygulamada da
    /// "Geri çekme gerekçesi" olarak etiketlidir (mobil detay ekranı birebir bu metni basar);
    /// red gerekçesini oraya koymak kaydı yanlış anlatırdı. Kalıcı yeri denetim izidir.
    /// </summary>
    [Fact]
    public void Should_NotWriteWithdrawReason_When_Rejected()
    {
        var a = PendingApproval();

        a.Reject("Ifade uygun degil.", _actor, _now);

        a.WithdrawReason.Should().BeNull();
        a.WithdrawnAt.Should().BeNull();
        a.WithdrawnBy.Should().BeNull();
    }

    [Fact]
    public void Should_RaiseRejectedEventWithReason_When_Rejected()
    {
        var a = PendingApproval();

        a.Reject("Ifade uygun degil.", _actor, _now);

        a.DomainEvents.OfType<AnnouncementRejectedEvent>().Should().ContainSingle()
            .Which.Reason.Should().Be("Ifade uygun degil.");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Should_Throw_When_RejectReasonIsBlank(string reason)
    {
        var a = PendingApproval();

        var act = () => a.Reject(reason, _actor, _now);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Reject.ReasonRequired");
    }

    [Fact]
    public void Should_Throw_When_RejectingNonPendingAnnouncement()
    {
        var a = Published();

        var act = () => a.Reject("Gerekce metni.", _actor, _now);

        act.Should().Throw<AnnouncementDomainException>()
            .Which.Code.Should().Be("Announcements.Reject.InvalidStatus");
    }
```

- [ ] **Step 2: Domain metotlarını ve olayları yaz**

`Events/AnnouncementApprovedEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Announcements.Events;

/// <summary>
/// Onay kuyruğundaki duyuru onaylandı ve yayınlandı. Tüketicisi YAYINLAYAN ÖĞRETMENE
/// bildirim gönderir; alıcılara giden "yeni duyuru" haberi ayrı bir olaydan
/// (<see cref="AnnouncementPublishedEvent"/>) gelir — onay iki farklı kişiye iki farklı
/// şey söyler ve bunları tek olaya sıkıştırmak ikisini de bulanıklaştırırdı.
/// </summary>
public sealed record AnnouncementApprovedEvent(
    Guid SchoolId, Guid AnnouncementId, string Title, Guid PublisherId,
    DateTimeOffset OccurredAt) : IDomainEvent;
```

`Events/AnnouncementRejectedEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Announcements.Events;

/// <summary>
/// Onay kuyruğundaki duyuru reddedildi ve taslağa döndü (silinmedi — INV-1).
///
/// <para><see cref="Reason"/> olayda taşınır çünkü öğretmenin kararı öğrenmesinin bugünkü
/// TEK yolu bildirim gövdesidir. Gerekçe <c>Announcement.WithdrawReason</c>'a YAZILMAZ:
/// o alan iki uygulamada da "Geri çekme gerekçesi" olarak etiketlidir. Kalıcı kaydı denetim
/// izidir.</para>
/// </summary>
public sealed record AnnouncementRejectedEvent(
    Guid SchoolId, Guid AnnouncementId, string Title, Guid PublisherId, string Reason,
    DateTimeOffset OccurredAt) : IDomainEvent;
```

`Announcement.cs` — `Restore()`'un altına:

```csharp
    /// <summary>
    /// Onay kuyruğundaki duyuruyu onaylar ve yayınlar (INV-5 akışının sonu).
    ///
    /// <para><see cref="Publish"/>'i ÇAĞIRIR (kopyalamaz): yayın durumu tek yerde değişir,
    /// aksi hâlde iki yol zamanla ayrışırdı. Bu yüzden onay HEM
    /// <see cref="AnnouncementPublishedEvent"/> (alıcılara yeni duyuru) HEM
    /// <see cref="AnnouncementApprovedEvent"/> (öğretmene karar) yayar.</para>
    /// </summary>
    public void Approve(AnnouncementReach reach, int recipientCount, DateTimeOffset now)
    {
        if (Status is not AnnouncementStatus.PendingApproval)
        {
            throw new AnnouncementDomainException(
                "Announcements.Approve.InvalidStatus",
                "Yalnız onay bekleyen duyuru onaylanabilir.");
        }

        Publish(reach, recipientCount, now);

        Raise(new AnnouncementApprovedEvent(SchoolId, Id, Title, PublisherId, DateTimeOffset.UtcNow));
    }

    /// <summary>
    /// Onay kuyruğundaki duyuruyu reddeder — TASLAĞA döndürür, SİLMEZ (INV-1). Öğretmen
    /// düzeltip yeniden gönderebilir.
    ///
    /// <para><b>Gerekçe entity'ye YAZILMAZ.</b> <see cref="WithdrawReason"/> yalnız geri
    /// çekmeye aittir ve iki uygulamada da öyle etiketlidir. Red gerekçesinin kalıcı yeri
    /// denetim izi, iletim yolu ise <see cref="Events.AnnouncementRejectedEvent"/> üzerinden
    /// giden bildirimdir.</para>
    /// </summary>
    public void Reject(string reason, Guid rejectedBy, DateTimeOffset now)
    {
        if (Status is not AnnouncementStatus.PendingApproval)
        {
            throw new AnnouncementDomainException(
                "Announcements.Reject.InvalidStatus",
                "Yalnız onay bekleyen duyuru reddedilebilir.");
        }

        var normalizedReason = (reason ?? string.Empty).Trim();
        if (normalizedReason.Length == 0)
        {
            throw new AnnouncementDomainException(
                "Announcements.Reject.ReasonRequired", "Red gerekçesi zorunludur.");
        }

        if (rejectedBy == Guid.Empty)
        {
            throw new AnnouncementDomainException(
                "Announcements.Reject.ActorRequired", "Reddeden kişi zorunludur.");
        }

        Status = AnnouncementStatus.Draft;

        Raise(new AnnouncementRejectedEvent(
            SchoolId, Id, Title, PublisherId, normalizedReason, DateTimeOffset.UtcNow));
    }
```

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementLifecycleTests"`
Expected: PASS.

- [ ] **Step 3: `reach` kuralını ortak yere taşı**

Onay anında `reach` yeniden hesaplanır (donmuş hedeflerden) ve bu, kuralın **ikinci** tüketicisidir. İki yerde ayrı yazılırsa zamanla ayrışır.

`src/Oksis.Application/Modules/Announcements/Common/AnnouncementReachRule.cs`:

```csharp
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// Duyurunun erişim kapsamı, hedef KATMANLARINDAN türetilir: <c>all</c> veya <c>role</c>
/// içeren her seçim okul genelidir, gerisi sınıf kapsamlıdır.
///
/// <para><b>İki tüketici, tek kural:</b> yayın (<c>CreateAnnouncementCommandHandler</c>) ve
/// onay (<c>ApproveAnnouncementCommandHandler</c>). Onay anında kural donmuş
/// <c>AnnouncementTarget</c> satırlarından yeniden uygulanır; iki yerde ayrı yazılsaydı
/// onaylanan duyuru yayınlananla farklı bir <c>reach</c> alabilirdi ve <c>ChildPersonId</c>
/// davranışı (okul genelinde null'lanır) ikisinde ayrışırdı.</para>
/// </summary>
public static class AnnouncementReachRule
{
    public static AnnouncementReach From(IEnumerable<string> wireDimensions) =>
        wireDimensions.Any(d => d is "all" or "role")
            ? AnnouncementReach.SchoolWide
            : AnnouncementReach.ClassScoped;
}
```

`CreateAnnouncementCommandHandler.cs` — Görev 1'in bıraktığı satırı değiştir:

```csharp
            var reach = AnnouncementReachRule.From(survivingSelections.Select(a => a.Dimension));
```

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~CreateAnnouncementTests"`
Expected: PASS — Görev 1'in testi dâhil davranış değişmedi.

- [ ] **Step 4: Onay uçları için failing test yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementApprovalTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 15 — onay kuyruğu ve kararı. Kuyruk YALNIZ eşikli modda dolar; onay alıcıları
/// O ANDA materyalize eder (kuyruğa girerken değil), red ise duyuruyu taslağa döndürür.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AnnouncementApprovalTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public AnnouncementApprovalTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    private static async Task<(AnnouncementAudienceFixture Fixture, Guid Id)> QueuedAsync(
        DatabaseFixture database)
    {
        var fixture = await AnnouncementAudienceFixture.CreateAsync(database);
        await fixture.SetModerationDirectAsync(AnnouncementModeration.Thresholded);
        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A veli duyurusu", "Veli toplantisi carsamba gunu.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);
        return (fixture, Guid.Parse(created.Id));
    }

    [Fact]
    public async Task Should_ListQueuedAnnouncements_When_ManagerReadsApprovals()
    {
        var (fixture, id) = await QueuedAsync(_database);
        await using var _ = fixture;

        var queue = await fixture.ApprovalsAsync(fixture.AdminAccountId);

        queue.Should().ContainSingle().Which.Id.Should().Be(id.ToString());
    }

    /// <summary>
    /// Kuyruk SERBEST modda BOŞTUR — hiçbir duyuru onaya düşmediği için. İzolasyon: aynı
    /// öğretmen, aynı hedef, tek fark mod.
    /// </summary>
    [Fact]
    public async Task Should_ReturnEmptyQueue_When_ModerationIsOpen()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A veli duyurusu", "Veli toplantisi carsamba gunu.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        (await fixture.ApprovalsAsync(fixture.AdminAccountId)).Should().BeEmpty();
    }

    /// <summary>
    /// Öğretmen onay kuyruğunu GÖREMEZ. <b>İzolasyon:</b> öğretmenin <c>announcements.view</c>
    /// ve <c>create</c> izinleri VARDIR — 403'ün tek açıklaması <c>announcements.approve</c>'un
    /// yokluğudur.
    /// </summary>
    [Fact]
    public async Task Should_Forbid_When_TeacherReadsApprovals()
    {
        var (fixture, _) = await QueuedAsync(_database);
        await using var _d = fixture;

        var act = async () => await fixture.ApprovalsAsync(fixture.TeacherAccountId);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Error.Forbidden*");
    }

    /// <summary>
    /// Onay duyuruyu YAYINLAR ve alıcıları O ANDA materyalize eder. Kuyrukta sıfır alıcı
    /// vardı (Görev 14 testi) — bu test onların onayla doğduğunu kanıtlar.
    /// </summary>
    [Fact]
    public async Task Should_PublishAndMaterializeRecipients_When_Approved()
    {
        var (fixture, id) = await QueuedAsync(_database);
        await using var _ = fixture;

        var approved = await fixture.ApproveAsync(fixture.AdminAccountId, id);

        approved.Status.Should().Be("published");
        approved.RecipientCount.Should().BeGreaterThan(0);
        approved.Reach.Should().Be("classScoped", "donmus hedefler sube kapsamliydi");

        (await fixture.Db.AnnouncementRecipients.AsNoTracking().CountAsync(r => r.AnnouncementId == id))
            .Should().Be(approved.RecipientCount);
    }

    /// <summary>
    /// Onaylanan duyuru VELİNİN gelen kutusuna düşer — akışın gerçekten uçtan uca
    /// çalıştığının tek kanıtı. Alıcı sayısının sıfırdan büyük olması, doğru KİŞİLERE
    /// gittiğini söylemez.
    /// </summary>
    [Fact]
    public async Task Should_ReachParentInbox_When_Approved()
    {
        var (fixture, id) = await QueuedAsync(_database);
        await using var _ = fixture;

        await fixture.ApproveAsync(fixture.AdminAccountId, id);

        var inbox = await fixture.InboxAsync(fixture.HighSchoolParentAccountId);
        inbox.Should().Contain(a => a.Id == id.ToString());
    }

    /// <summary>
    /// İmza ONAYLA DEĞİŞMEZ: duyuru öğretmenin duyurusudur, yönetim yalnız izin verdi.
    /// Onaylayanın adının imzaya geçmesi, alıcıya yanlış kaynağı gösterirdi.
    /// </summary>
    [Fact]
    public async Task Should_KeepOriginalPublisherSignature_When_Approved()
    {
        var (fixture, id) = await QueuedAsync(_database);
        await using var _ = fixture;

        var approved = await fixture.ApproveAsync(fixture.AdminAccountId, id);

        approved.PublisherId.Should().Be(fixture.TeacherPersonId.ToString());
        approved.PublisherLabel.Should().Be("Elif Öğretmen");
        approved.Type.Should().Be("classroom");
    }

    [Fact]
    public async Task Should_ReturnToDraft_When_Rejected()
    {
        var (fixture, id) = await QueuedAsync(_database);
        await using var _ = fixture;

        var rejected = await fixture.RejectAsync(fixture.AdminAccountId, id, "Ifade uygun degil.");

        rejected.Status.Should().Be("draft");
        (await fixture.ApprovalsAsync(fixture.AdminAccountId)).Should().BeEmpty();
    }

    /// <summary>
    /// <b>D-2:</b> red gerekçesi <c>withdrawReason</c>'a SIZMAZ — o alan mobil detay
    /// ekranında birebir "Geri çekme gerekçesi: …" olarak basılır ve reddedilmiş bir taslak
    /// için bu yanlış olurdu. Gerekçenin kalıcı yeri denetim izidir.
    /// </summary>
    [Fact]
    public async Task Should_WriteReasonToAuditTrailOnly_When_Rejected()
    {
        var (fixture, id) = await QueuedAsync(_database);
        await using var _ = fixture;

        var rejected = await fixture.RejectAsync(fixture.AdminAccountId, id, "Ifade uygun degil.");

        rejected.WithdrawReason.Should().BeNull();

        var trail = await fixture.AuditTrailAsync(fixture.AdminAccountId, id);
        trail.Should().Contain(e => e.Action == "duyuruyu reddetti"
            && e.Field == "Gerekçe: Ifade uygun degil."
            && e.Tone == "danger");
    }

    /// <summary>Reddedilen duyuru öğretmenin kendi listesinde TASLAK olarak durur — silinmez (INV-1).</summary>
    [Fact]
    public async Task Should_RemainInTeacherInventoryAsDraft_When_Rejected()
    {
        var (fixture, id) = await QueuedAsync(_database);
        await using var _ = fixture;

        await fixture.RejectAsync(fixture.AdminAccountId, id, "Ifade uygun degil.");

        var mine = await fixture.ListAsync(fixture.TeacherAccountId, scope: "mine");
        mine.Items.Should().Contain(a => a.Id == id.ToString() && a.Status == "draft");
    }

    [Fact]
    public async Task Should_Forbid_When_TeacherApprovesOwnAnnouncement()
    {
        var (fixture, id) = await QueuedAsync(_database);
        await using var _ = fixture;

        var act = async () => await fixture.ApproveAsync(fixture.TeacherAccountId, id);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Error.Forbidden*");
    }

    [Fact]
    public async Task Should_Fail_When_ApprovingNonPendingAnnouncement()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);

        var act = async () => await fixture.ApproveAsync(fixture.AdminAccountId, Guid.Parse(created.Id));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Announcements.Approve.InvalidStatus*");
    }
}
```

> **`HighSchoolParentAccountId` fixture'da YOKTUR.** Sahne lise velilerine `Guid.NewGuid()` ile hesap bağlıyor ama dışarı açmıyor. Step 5 onu açar — **yeni kişi eklemez**, yalnız var olan hesabı property olarak yayımlar; `AudienceResolver` sayılarına dokunmaz.

- [ ] **Step 5: Fixture'ı genişlet**

1. `highParentOne.LinkAccount(Guid.NewGuid());` satırını, üstte tanımlanan bir `var highSchoolParentAccountId = Guid.NewGuid();` değişkenini kullanacak şekilde değiştir; ctor'a ve property'ye taşı:

```csharp
    /// <summary>
    /// Görev 15 — <c>HighSchoolParentIds[0]</c>'a (Gökhan, 9-A velisi) bağlı hesap.
    /// Sahneye YENİ KİŞİ EKLEMEZ: bu kişi ve hesabı zaten vardı, yalnız dışarı açılmadı —
    /// dolayısıyla <c>AudienceResolverTests</c>'in sabit sayıları ETKİLENMEZ.
    /// Onaylanan öğretmen duyurusunun gerçekten veli gelen kutusuna düştüğünün tek kanıtı.
    /// </summary>
    public Guid HighSchoolParentAccountId { get; }
```

`PermissionsFor`'a ekle:

```csharp
        if (accountId == HighSchoolParentAccountId)
        {
            return ["announcements.view"];
        }
```

2. Üç yardımcı:

```csharp
    /// <summary>Görev 15 — <c>GET /announcements/approvals</c> ucunu çalıştırır.</summary>
    public async Task<IReadOnlyList<AnnouncementDto>> ApprovalsAsync(Guid asAccountId)
    {
        var tenant = new FakeTenantContext(AdminScope.SchoolId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));

        var handler = new GetAnnouncementApprovalsQueryHandler(_context, tenant, permissionReader);
        var result = await handler.Handle(new GetAnnouncementApprovalsQuery(), CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"ApprovalsAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!;
    }

    /// <summary>Görev 15 — <c>POST /announcements/{id}:approve</c> ucunu çalıştırır.</summary>
    public async Task<AnnouncementDto> ApproveAsync(Guid asAccountId, Guid announcementId)
    {
        var tenant = new FakeTenantContext(AdminScope.SchoolId);
        var currentUser = new FakeCurrentUser(asAccountId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));
        var clock = new FixedClock(DateTimeOffset.UtcNow);

        var handler = new ApproveAnnouncementCommandHandler(
            _context, tenant, currentUser, permissionReader, Resolver, clock);

        var result = await handler.Handle(
            new ApproveAnnouncementCommand(announcementId), CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"ApproveAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!;
    }

    /// <summary>Görev 15 — <c>POST /announcements/{id}:reject</c> ucunu çalıştırır.</summary>
    public async Task<AnnouncementDto> RejectAsync(Guid asAccountId, Guid announcementId, string reason)
    {
        var tenant = new FakeTenantContext(AdminScope.SchoolId);
        var currentUser = new FakeCurrentUser(asAccountId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));
        var clock = new FixedClock(DateTimeOffset.UtcNow);

        var handler = new RejectAnnouncementCommandHandler(
            _context, tenant, currentUser, permissionReader, clock);

        var result = await handler.Handle(
            new RejectAnnouncementCommand(announcementId, reason), CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"RejectAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!;
    }
```

- [ ] **Step 6: Kuyruk sorgusunu yaz**

`Queries/GetAnnouncementApprovals/GetAnnouncementApprovalsQuery.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementApprovals;

/// <summary>
/// Onay bekleyen duyurular. YALNIZ eşikli modda dolar (INV-5) — serbest modda hiçbir duyuru
/// <c>pendingApproval</c>'a düşmediği için sorgu doğal olarak boş döner; ayrıca mod kontrolü
/// YAPILMAZ, çünkü mod değişse bile kuyruktaki eski kayıtlar karara muhtaçtır.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.approve")]
public sealed record GetAnnouncementApprovalsQuery : IQuery<IReadOnlyList<AnnouncementDto>>;
```

`Queries/GetAnnouncementApprovals/GetAnnouncementApprovalsQueryHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementApprovals;

/// <summary>
/// Onay kuyruğu — en eskisi ÜSTTE. Bekleme süresi kuyruğun anlamıdır (istemci
/// <c>approvalWaitLabel</c> ile "2 saattir bekliyor" der); en yeniyi öne almak, en uzun
/// bekleyeni listenin dibine iterdi.
/// </summary>
public sealed class GetAnnouncementApprovalsQueryHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    IPermissionReader permissionReader)
    : IQueryHandler<GetAnnouncementApprovalsQuery, IReadOnlyList<AnnouncementDto>>
{
    public async Task<Result<IReadOnlyList<AnnouncementDto>>> Handle(
        GetAnnouncementApprovalsQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<IReadOnlyList<AnnouncementDto>>.Forbidden();
        }

        // Kuyruk bir KARAR yüzeyidir: onu görebilen, üzerinde karar verebilendir.
        if (!await AnnouncementCallerResolver.IsManagerAsync(permissionReader, cancellationToken))
        {
            return Result<IReadOnlyList<AnnouncementDto>>.Forbidden();
        }

        var rows = await db.Announcements.AsNoTracking()
            .Where(a => a.SchoolId == schoolId && a.Status == AnnouncementStatus.PendingApproval)
            .OrderBy(a => a.UpdatedAt ?? a.CreatedAt)
            .ThenBy(a => a.Id)
            .ToListAsync(cancellationToken);

        var ids = rows.Select(a => a.Id).ToList();

        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => ids.Contains(t.AnnouncementId))
            .ToListAsync(cancellationToken);

        IReadOnlyList<AnnouncementDto> items = rows.Select(a => AnnouncementMapper.ToDto(
            a,
            targets.Where(t => t.AnnouncementId == a.Id).ToList(),
            isRead: null,
            childIds: [],
            // Kuyruktaki duyuru henüz yayınlanmadı; görülme sayısı YOKTUR (0 değil, null) —
            // 0 "kimse görmedi" der, oysa doğru cevap "henüz gönderilmedi"dir.
            seenCount: null)).ToList();

        return Result<IReadOnlyList<AnnouncementDto>>.Success(items);
    }
}
```

- [ ] **Step 7: `:approve` komut + handler**

`Commands/ApproveAnnouncement/ApproveAnnouncementCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.ApproveAnnouncement;

/// <summary>Onay kuyruğundaki duyuruyu onaylar ve yayınlar. Gövdesi yoktur (kontrat da öyle).</summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.approve")]
public sealed record ApproveAnnouncementCommand(Guid Id) : ICommand<AnnouncementDto>;
```

`ApproveAnnouncementCommandHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Abstractions;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.ApproveAnnouncement;

/// <summary>
/// Onay kuyruğundaki duyuruyu yayınlar. Alıcılar <b>ŞİMDİ</b> materyalize edilir — kuyruğa
/// girerken değil (zamanlanmış duyuruyla aynı ilke, DYR-K-15): onay ile yayın arasında
/// geçen sürede sınıf mevcudu değişebilir ve kuyrukta dondurulmuş bir listeye güvenmek
/// yanlış olurdu.
///
/// <para><b>Hedefler yeniden SEÇİLMEZ</b> (INV-2): donmuş <c>AnnouncementTarget</c> satırları
/// yeniden çözümlenir. Yönetici duyuruyu onaylar, yeniden hedeflemez.</para>
///
/// <para><b>İmza DEĞİŞMEZ.</b> Duyuru öğretmenindir; yönetim yalnız izin verdi. Bu yüzden
/// alıcı çözümleme kapsamı da ÖĞRETMENİN kapsamıdır (<c>PublisherId</c>) — yöneticininki
/// değil. Kuyruğa yalnız öğretmen→veli duyuruları düşer (INV-5), dolayısıyla yayınlayan
/// her zaman kapsamı daralmış bir kişidir.</para>
/// </summary>
public sealed class ApproveAnnouncementCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader,
    IAudienceResolver resolver,
    IDateTimeProvider clock)
    : ICommandHandler<ApproveAnnouncementCommand, AnnouncementDto>
{
    public async Task<Result<AnnouncementDto>> Handle(
        ApproveAnnouncementCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var callerResult = await AnnouncementLifecycleGuard.ResolveCallerAsync(
            db, currentUser, permissionReader, cancellationToken);
        if (callerResult.IsFailure)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var caller = callerResult.Value!;

        // Onay bir YÖNETİM kararıdır — sahiplik burada yetmez. Öğretmen kendi duyurusunu
        // onaylayamaz; onaylayabilseydi eşikli moderasyon hiçbir şey ifade etmezdi.
        if (!caller.IsManager)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var announcement = await db.Announcements
            .SingleOrDefaultAsync(a => a.Id == request.Id && a.SchoolId == schoolId, cancellationToken);

        if (announcement is null)
        {
            return Result<AnnouncementDto>.NotFound();
        }

        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => t.AnnouncementId == announcement.Id)
            .ToListAsync(cancellationToken);

        // Donmuş hedefler → seçim gövdeleri. Kayıt kendini anlatır (Dimension/Key/Bucket
        // yayın anında donduruldu), bu yüzden gövde yeniden kurulabilir.
        var selections = targets.Select(t => new AudienceSelectionBody
        {
            Dimension = AnnouncementEnumWire.ToWire(t.Dimension),
            Key = t.Key,
            Bucket = AnnouncementEnumWire.ToWire(t.Bucket),
        }).ToList();

        var scope = new AudienceScope(schoolId, announcement.AcademicSessionId, announcement.PublisherId);
        var recipients = await resolver.ResolveAsync(scope, selections, cancellationToken);

        var reach = AnnouncementReachRule.From(selections.Select(s => s.Dimension));

        db.AnnouncementRecipients.AddRange(recipients.Select(r =>
            AnnouncementRecipient.Create(
                schoolId, announcement.Id, r.PersonId, r.RoleAtPublish,
                reach == AnnouncementReach.SchoolWide ? null : r.ChildPersonId)));

        try
        {
            announcement.Approve(reach, recipients.Count, clock.UtcNow);
        }
        catch (AnnouncementDomainException ex)
        {
            return Result<AnnouncementDto>.Failure(new Error(ex.Code, ex.Message));
        }

        AnnouncementAuditWriter.Write(
            db, schoolId, announcement.Id, caller,
            action: "duyuruyu onayladı",
            at: clock.UtcNow,
            field: $"Durum: pendingApproval → published",
            tag: null,
            tone: null);

        await db.SaveChangesAsync(cancellationToken);

        return Result<AnnouncementDto>.Success(AnnouncementMapper.ToDto(
            announcement, targets, isRead: null, childIds: [], seenCount: 0));
    }
}
```

> **Sıra önemlidir:** alıcı satırları `Approve()`'tan **önce** eklenir ama `SaveChangesAsync` ikisinden de sonradır — hepsi tek transaction'dadır (`TransactionBehavior` komutları sarar). `Approve()` başarısız olursa hiçbir satır yazılmaz.

- [ ] **Step 8: `:reject` komut + validator + handler**

`Commands/RejectAnnouncement/RejectAnnouncementCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.RejectAnnouncement;

/// <summary>
/// Onay kuyruğundaki duyuruyu reddeder — TASLAĞA döndürür, silmez (INV-1).
/// Gövde <c>contract.ts</c>'teki <c>ReasonBody</c> ile birebirdir; gerekçe ZORUNLUDUR.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.approve")]
public sealed record RejectAnnouncementCommand(Guid Id, string Reason) : ICommand<AnnouncementDto>;
```

`Commands/RejectAnnouncement/RejectAnnouncementCommandValidator.cs`:

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Announcements.Commands.RejectAnnouncement;

/// <summary>
/// Red gerekçesi ZORUNLUDUR — öğretmenin kararı öğrenmesinin tek yolu odur.
/// Domain (<c>Announcement.Reject</c>) aynı kuralı son savunma hattı olarak uygular.
/// </summary>
public sealed class RejectAnnouncementCommandValidator : AbstractValidator<RejectAnnouncementCommand>
{
    public RejectAnnouncementCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("announcements.errors.id-required");
        RuleFor(x => x.Reason).NotEmpty().WithMessage("announcements.errors.reason-required");
    }
}
```

`Commands/RejectAnnouncement/RejectAnnouncementCommandHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.RejectAnnouncement;

/// <summary>
/// Onay kuyruğundaki duyuruyu reddeder ve TASLAĞA döndürür — silmez (INV-1). Öğretmen
/// düzeltip yeniden gönderebilir.
///
/// <para><b>Yönetim kapısı, sahiplik DEĞİL.</b> Diğer yaşam döngüsü uçları
/// <c>AnnouncementLifecycleGuard.CanActOn</c> ile "kendi kaydı VEYA yönetim" sorar; burada
/// sahiplik YETMEZ — öğretmen kendi duyurusunu reddedebilseydi eşikli moderasyon hiçbir şey
/// ifade etmezdi. <c>:approve</c> ile aynı kapı.</para>
///
/// <para><b>Gerekçe entity'ye YAZILMAZ</b> (plan düzeltmesi D-2): <c>WithdrawReason</c> iki
/// uygulamada da "Geri çekme gerekçesi" olarak etiketlidir. Gerekçenin kalıcı yeri denetim
/// izi, öğretmene iletim yolu ise <c>AnnouncementRejectedEvent</c> üzerinden giden bildirimdir.</para>
/// </summary>
public sealed class RejectAnnouncementCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader,
    IDateTimeProvider clock)
    : ICommandHandler<RejectAnnouncementCommand, AnnouncementDto>
{
    public async Task<Result<AnnouncementDto>> Handle(
        RejectAnnouncementCommand request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var callerResult = await AnnouncementLifecycleGuard.ResolveCallerAsync(
            db, currentUser, permissionReader, cancellationToken);
        if (callerResult.IsFailure)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var caller = callerResult.Value!;

        // Red bir YÖNETİM kararıdır — CanActOn (sahiplik VEYA yönetim) burada KULLANILMAZ.
        if (!caller.IsManager)
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var announcement = await db.Announcements
            .SingleOrDefaultAsync(a => a.Id == request.Id && a.SchoolId == schoolId, cancellationToken);

        if (announcement is null)
        {
            return Result<AnnouncementDto>.NotFound();
        }

        try
        {
            announcement.Reject(request.Reason, caller.PersonId, clock.UtcNow);
        }
        catch (AnnouncementDomainException ex)
        {
            return Result<AnnouncementDto>.Failure(new Error(ex.Code, ex.Message));
        }

        AnnouncementAuditWriter.Write(
            db, schoolId, announcement.Id, caller,
            action: "duyuruyu reddetti",
            at: clock.UtcNow,
            // D-2: gerekçe entity'ye YAZILMAZ. Kalıcı yeri BURASI.
            field: $"Gerekçe: {request.Reason.Trim()}",
            tag: "Taslağa döndürüldü",
            tone: "danger");

        await db.SaveChangesAsync(cancellationToken);

        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => t.AnnouncementId == announcement.Id)
            .ToListAsync(cancellationToken);

        // Taslağa dönen duyuru hiç yayınlanmadı — görülme sayısı 0 değil, YOKTUR.
        return Result<AnnouncementDto>.Success(AnnouncementMapper.ToDto(
            announcement, targets, isRead: null, childIds: [], seenCount: null));
    }
}
```

- [ ] **Step 9: Karar bildirimleri**

`Events/Notifications/AnnouncementDecisionNotificationHandlers.cs` — iki handler, aynı dosyada (birlikte değişirler):

```csharp
using MediatR;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Events;
using Oksis.Application.Common.Utilities;
using Oksis.Application.Modules.Notifications.Abstractions;
using Oksis.Domain.Modules.Announcements.Events;
using Oksis.Domain.Modules.Notifications.Enums;

namespace Oksis.Application.Modules.Announcements.Events.Notifications;

/// <summary>
/// Onay kararı YAYINLAYAN ÖĞRETMENE bildirilir. Alıcılara giden "yeni duyuru" haberi ayrı
/// bir handler'ın (<c>AnnouncementPublishedNotificationHandler</c>) işidir — onay iki farklı
/// kişiye iki farklı şey söyler.
/// </summary>
public sealed class AnnouncementApprovedNotificationHandler(
    INotificationRecipientResolver resolver,
    INotificationEnqueuer enqueuer)
    : INotificationHandler<DomainEventNotification<AnnouncementApprovedEvent>>
{
    public async Task Handle(
        DomainEventNotification<AnnouncementApprovedEvent> notification, CancellationToken cancellationToken)
    {
        var e = notification.DomainEvent;

        var accountMap = await resolver.ResolvePersonAccountsMapAsync(
            e.SchoolId, [e.PublisherId], cancellationToken);

        if (accountMap.Count == 0)
        {
            return;
        }

        enqueuer.Enqueue(
            DeterministicGuid.Combine(e.SchoolId, e.AnnouncementId, "ANNOUNCEMENT_APPROVED"),
            e.SchoolId, NotificationKind.AnnouncementApproved,
            "Duyurunuz onaylandı",
            e.Title,
            $"/announcements/{e.AnnouncementId}",
            accountMap.Values.Distinct().ToList());
    }
}

/// <summary>
/// Red kararı yayınlayan öğretmene bildirilir ve <b>GEREKÇEYİ gövdesinde taşır</b>.
///
/// <para>Bugün öğretmenin gerekçeyi öğrenmesinin TEK yolu budur: gerekçe
/// <c>Announcement.WithdrawReason</c>'a yazılmaz (o alan iki uygulamada da "Geri çekme
/// gerekçesi" olarak etiketlidir) ve denetim izi ucu öğretmen detay ekranına henüz bağlı
/// değildir — bu, C fazına devredilen bilinçli bir frontend boşluğudur (plan düzeltmesi D-2).</para>
///
/// <para>Dedup anahtarı zamanı İÇERİR: aynı duyuru düzeltilip yeniden gönderilebilir ve
/// tekrar reddedilebilir; sabit bir anahtar ikinci reddi sessizce yutardı.</para>
/// </summary>
public sealed class AnnouncementRejectedNotificationHandler(
    INotificationRecipientResolver resolver,
    INotificationEnqueuer enqueuer)
    : INotificationHandler<DomainEventNotification<AnnouncementRejectedEvent>>
{
    public async Task Handle(
        DomainEventNotification<AnnouncementRejectedEvent> notification, CancellationToken cancellationToken)
    {
        var e = notification.DomainEvent;

        var accountMap = await resolver.ResolvePersonAccountsMapAsync(
            e.SchoolId, [e.PublisherId], cancellationToken);

        if (accountMap.Count == 0)
        {
            return;
        }

        enqueuer.Enqueue(
            DeterministicGuid.Combine(
                e.SchoolId, e.AnnouncementId, "ANNOUNCEMENT_REJECTED", e.OccurredAt.UtcTicks),
            e.SchoolId, NotificationKind.AnnouncementRejected,
            $"Duyurunuz reddedildi: {e.Title}",
            $"Gerekçe: {e.Reason}",
            "/announcements",
            accountMap.Values.Distinct().ToList());
    }
}
```

- [ ] **Step 10: Controller uçları**

```csharp
    /// <summary>Onay bekleyen duyurular — yalnız eşikli modda dolar (INV-5).</summary>
    [HttpGet("approvals")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AnnouncementDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetApprovalsAsync(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnnouncementApprovalsQuery(), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }

    /// <summary>Onaylar ve yayınlar. Alıcılar ŞİMDİ materyalize edilir, kuyruğa girerken değil.</summary>
    [HttpPost("{id:guid}:approve")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ApproveAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ApproveAnnouncementCommand(id), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }

    /// <summary>Reddeder ve TASLAĞA döndürür — silmez (INV-1). Gerekçe zorunludur.</summary>
    [HttpPost("{id:guid}:reject")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RejectAsync(
        Guid id, [FromBody] AnnouncementReasonRequestBody body, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RejectAnnouncementCommand(id, body.Reason), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 11: İzin yüzeyi tablosunu güncelle**

Üç satır (`GetAnnouncementApprovalsQuery`, `ApproveAnnouncementCommand`, `RejectAnnouncementCommand` → hepsi `"announcements.approve"`). Keşif sayısı **15**.

- [ ] **Step 12: Testler**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementLifecycleTests"
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~Announcement"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementApprovalTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests
```
Expected: PASS (12 onay testi). Tam süitte Görev 16'ya bırakılan controller bekçisi + Documents/S3 tabanı.

- [ ] **Step 13: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/ tests/
git commit -m "feat(api): onay kuyrugu ve karar uclari eklendi

Onay alicilari O ANDA materyalize eder (kuyruga girerken degil, DYR-K-15 ile ayni
ilke) ve donmus hedefleri yeniden cozer -- yeniden HEDEFLEMEZ (INV-2). Imza
degismez: duyuru ogretmenindir, yonetim yalnizca izin verdi. Red gerekcesi
WithdrawReason'a YAZILMAZ (o alan iki uygulamada da Geri cekme gerekcesi olarak
etiketli); kalici yeri denetim izi, iletim yolu bildirim govdesi. reach kurali
tek ortak yere tasindi -- yayin ve onay ayni kurali uygular."
```

---

### Task 16: Uçtan uca duman testi + controller yüzey bekçisi

A2'yi kapatır. İki iş: **INV-1'in API bekçisini** yeni yüzeye göre güncellemek ve **tek bir testte** dilim 4+5'in gerçekten birlikte çalıştığını göstermek.

**Files:**
- Modify: `tests/Oksis.Api.UnitTests/Controllers/V1/AnnouncementsControllerTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementLifecycleEndToEndTests.cs`

**Interfaces:**
- Consumes: Görev 1–15'in tamamı
- Produces: yeni tip yok

- [ ] **Step 1: Controller yüzey bekçisini güncelle**

`AnnouncementsControllerTests.cs`:

1. `Controller_ShouldExpose_ExactlySixEndpoints_And_NoneIsHttpDelete`'i **15**'e çıkar ve adını `Controller_ShouldExpose_ExactlyFifteenEndpoints_And_NoneIsHttpDelete` yap. Doc yorumunu güncelle:

```csharp
    /// <summary>
    /// INV-1'in API yüzeyindeki tek otomatik kanıtı: 15 endpoint (A1'in 6'sı + A2'nin 9'u)
    /// ve hiçbiri <c>[HttpDelete]</c> DEĞİL. Sayı 15'in DIŞINA çıkarsa VEYA biri
    /// <c>HttpDeleteAttribute</c> taşırsa test kırılır — <c>db.Announcements.Remove(...)</c>'a
    /// giden bir <c>[HttpDelete("{id:guid}")]</c> ucu bu testi geçemez.
    ///
    /// <para><b>Sayı bilinçli olarak sabittir.</b> A3 üç şablon ucu + <c>publishers</c> +
    /// <c>delivery-report</c> ekleyecek ve bu testi kıracaktır; kırılması İSTENİR — duyuru
    /// yüzeyi yalnız BİLİNÇLİ olarak büyür.</para>
    /// </summary>
```

2. `ExpectedEndpoints()`'e dokuz satır ekle:

```csharp
        yield return ["AmendAsync", "PUT", "{id:guid}"];
        yield return ["WithdrawAsync", "POST", "{id:guid}:withdraw"];
        yield return ["RestoreAsync", "POST", "{id:guid}:restore"];
        yield return ["GetAuditTrailAsync", "GET", "{id:guid}/audit-trail"];
        yield return ["GetModerationAsync", "GET", "moderation"];
        yield return ["UpdateModerationAsync", "PUT", "moderation"];
        yield return ["GetApprovalsAsync", "GET", "approvals"];
        yield return ["ApproveAsync", "POST", "{id:guid}:approve"];
        yield return ["RejectAsync", "POST", "{id:guid}:reject"];
```

3. A1'in `[HttpDelete]` kaynak taramasını (varsa, `672c8a64` commit'i) **koru**; `.Remove(`/`.RemoveRange(` taraması A2'nin beş yeni handler'ını da kapsamalıdır. Tarama dosya listesi sabitse yeni handler dosyalarını ekle.

- [ ] **Step 2: Uçtan uca duman testi yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementLifecycleEndToEndTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 16 — dilim 4 ve 5'in TEK senaryoda birlikte çalıştığının kanıtı.
///
/// <para>Görev başına testler her kuralı tek tek doğrular ama hiçbiri "onaydan sonra
/// düzeltilip geri çekilen bir duyurunun denetim izi doğru mu" sorusunu soramaz — A1'in
/// nihai incelemesinin BLOCKER'ı tam olarak böyle, ancak parçalar yan yana konunca görülen
/// bir çelişkiydi.</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AnnouncementLifecycleEndToEndTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public AnnouncementLifecycleEndToEndTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    /// <summary>
    /// Eşikli modda öğretmenin veli duyurusunun tam hayatı:
    /// kuyruğa düşer → onaylanır → veliye ulaşır → düzeltilir → geri çekilir → geri alınır.
    /// Her adımda hem STATÜ hem VELİNİN GÖRDÜĞÜ doğrulanır; denetim izi altı satırla kapanır.
    /// </summary>
    [Fact]
    public async Task Should_CarryAnnouncementThroughFullLifecycle_When_ModerationIsThresholded()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await fixture.SetModerationDirectAsync(AnnouncementModeration.Thresholded);

        // 1) Öğretmen velilere duyuru yayınlamak ister → kuyruğa düşer (INV-5).
        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A veli toplantisi",
            "Veli toplantisi carsamba gunu saat 18:00'de yapilacaktir.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        var id = Guid.Parse(created.Id);
        created.Status.Should().Be("pendingApproval");
        (await fixture.InboxAsync(fixture.HighSchoolParentAccountId))
            .Should().NotContain(a => a.Id == created.Id, "kuyruktaki duyuru kimseye gitmedi");

        // 2) Yönetim onaylar → yayınlanır ve veliye ulaşır.
        var approved = await fixture.ApproveAsync(fixture.AdminAccountId, id);
        approved.Status.Should().Be("published");
        approved.PublisherLabel.Should().Be("Elif Öğretmen", "imza onayla DEGISMEZ");
        (await fixture.InboxAsync(fixture.HighSchoolParentAccountId))
            .Should().Contain(a => a.Id == created.Id);

        // 3) Veli okur → seenCount artar.
        await fixture.MarkReadAsync(fixture.HighSchoolParentAccountId, id);
        (await fixture.GetByIdAsync(fixture.AdminAccountId, id)).SeenCount.Should().Be(1);

        // 4) Öğretmen kendi duyurusunu düzeltir → "Güncellendi" rozeti açılır.
        var amended = await fixture.AmendAsync(
            fixture.TeacherAccountId, id, "9-A veli toplantisi (saat degisti)",
            "Veli toplantisi carsamba gunu saat 19:00'da yapilacaktir.", silent: false);
        amended.Amended.Should().BeTrue();

        // 5) Yönetim geri çeker → veliden HİÇ YOKMUŞ gibi düşer (INV-7), kayıt kalır (INV-1).
        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Toplanti ertelendi.");
        (await fixture.InboxAsync(fixture.HighSchoolParentAccountId))
            .Should().NotContain(a => a.Id == created.Id);
        (await fixture.Db.Announcements.AsNoTracking().CountAsync(a => a.Id == id))
            .Should().Be(1, "INV-1: duyuru SILINMEZ");

        // 6) Geri alınır → ÖNCEKİ statüye (published) döner ve veliye geri gelir (INV-4).
        var restored = await fixture.RestoreAsync(fixture.AdminAccountId, id);
        restored.Status.Should().Be("published");
        restored.Amended.Should().BeTrue("duzeltme rozeti geri almayla SILINMEZ");
        (await fixture.InboxAsync(fixture.HighSchoolParentAccountId))
            .Should().Contain(a => a.Id == created.Id);

        // 7) Denetim izi tam hikâyeyi eskiden yeniye anlatır.
        var trail = await fixture.AuditTrailAsync(fixture.AdminAccountId, id);
        trail.Select(e => e.Action).Should().Equal(
            "duyuruyu onaya gönderdi",
            "duyuruyu onayladı",
            "duyuruyu düzeltti",
            "duyuruyu geri çekti",
            "geri çekmeyi geri aldı");

        trail[0].ActorName.Should().Be("Elif Öğretmen", "onaya gonderen ogretmendir");
        trail[1].ActorName.Should().Be("Okul Müdürü", "onaylayan yonetimdir");
        trail.Should().OnlyContain(e => !string.IsNullOrWhiteSpace(e.ActorInitials));
    }

    /// <summary>
    /// Reddedilen duyurunun hayatı: kuyruğa düşer → reddedilir → öğretmenin taslağı olur →
    /// veliye HİÇ ULAŞMAZ. Red gerekçesi <c>withdrawReason</c>'a sızmaz (D-2).
    /// </summary>
    [Fact]
    public async Task Should_ReturnAnnouncementToDraft_When_RejectedInThresholdedMode()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        await fixture.SetModerationDirectAsync(AnnouncementModeration.Thresholded);

        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A veli toplantisi", "Veli toplantisi carsamba gunu.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);
        var id = Guid.Parse(created.Id);

        var rejected = await fixture.RejectAsync(fixture.AdminAccountId, id, "Ifade uygun degil.");

        rejected.Status.Should().Be("draft");
        rejected.WithdrawReason.Should().BeNull("D-2: red gerekcesi bu alana YAZILMAZ");

        (await fixture.InboxAsync(fixture.HighSchoolParentAccountId))
            .Should().NotContain(a => a.Id == created.Id);
        (await fixture.Db.AnnouncementRecipients.AsNoTracking().CountAsync(r => r.AnnouncementId == id))
            .Should().Be(0, "reddedilen duyuru hic materyalize edilmedi");

        var mine = await fixture.ListAsync(fixture.TeacherAccountId, scope: "mine");
        mine.Items.Should().Contain(a => a.Id == created.Id && a.Status == "draft");
    }
}
```

- [ ] **Step 3: Testler**

```bash
dotnet test tests/Oksis.Api.UnitTests --filter "FullyQualifiedName~AnnouncementsControllerTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementLifecycleEndToEndTests"
```
Expected: PASS.

- [ ] **Step 4: Uygulamanın gerçekten ayağa kalktığını doğrula**

DI kaydı eksikse (Görev 14 Step 4) hiçbir birim/entegrasyon testi bunu yakalamaz — hepsi handler'ları elle kurar.

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet run --project src/Oksis.Api &
sleep 25
curl -s http://localhost:5000/swagger/v1/swagger.json | python3 -c "
import json,sys
paths = json.load(sys.stdin)['paths']
ann = sorted(p for p in paths if 'announcements' in p)
print(len(ann), 'yol')
for p in ann: print(' ', p, sorted(paths[p].keys()))
print('DELETE var mi:', any('delete' in paths[p] for p in ann))
"
kill %1
```

Beklenen: **12 yol** (`/announcements`, `/{id}`, `/{id}:withdraw`, `/{id}:restore`, `/{id}:read`, `/{id}:approve`, `/{id}:reject`, `/{id}/audit-trail`, `/inbox`, `/audience`, `/moderation`, `/approvals`) ve **15 operasyon**; `DELETE var mi: False`.

Port farklıysa `launchSettings.json`'dan oku. Uygulama ayağa kalkmıyorsa hata mesajını oku — büyük ihtimalle `IAnnouncementModerationPolicy` kaydı eksiktir.

- [ ] **Step 5: Kontrat karşılaştırması (manuel, atlanamaz)**

`oksis-ui/packages/api/src/announcements/paths.ts`'i aç ve yayınlanan 12 yolu **birebir** karşılaştır: yol dizesi, HTTP metodu, gövde alanları, cevap şekli. Fark bulursan **backend'i DEĞİL** ledger'ı güncelle: B fazının drift bekçisi bu farkları zaten yakalayacaktır, ama beklenen farkların **önceden bilinmesi** o turu bir sürprizden bir kontrol listesine çevirir.

Bilinen ve **beklenen** farklar (bunlar hata değildir):
- `paths.ts` `POST /announcements` için `201` ilan eder; backend `200` döner (Görev 2 — istemci tarafı B'de düzelir).
- `contract.ts`'te `AudienceSelectionBody`'de `bucket` **yoktur**; backend'de vardır (A1 Görev 8 kaydı, spec §13 adım 4).
- `contract.ts`'te `CreateAnnouncementBody`'de `attachmentFileId` **yoktur**; backend'de vardır (spec §13 adım 4).
- `restore` mock'u koşulsuz `published` yazar; backend INV-4 uygular (D-3).

Yeni bir fark bulursan ledger'a yaz ve **A3 planına taşınmak üzere işaretle**.

- [ ] **Step 6: Tüm süitler**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet build
dotnet test tests/Oksis.Domain.UnitTests
dotnet test tests/Oksis.Application.UnitTests
dotnet test tests/Oksis.Api.UnitTests
dotnet test tests/Oksis.Infrastructure.IntegrationTests
```

Expected: yalnız ~37 Documents/S3 (Garage) hatası — Görev 1 Step 6'da not edilen tabanla **aynı sayı**. Duyuru, AudienceResolver, SchoolSettings ve Persistence'ta **sıfır** hata. Sayıları ledger'a yaz.

- [ ] **Step 7: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add tests/
git commit -m "test(announcements): uctan uca yasam dongusu ve API yuzey bekcisi

Yuzey bekcisi 6'dan 15 uca guncellendi ve hicbiri HttpDelete degil (INV-1). Uctan
uca test dilim 4 ve 5'i tek senaryoda birlestiriyor: esikli modda kuyruga dusen
ogretmen duyurusu onaylaniyor, veliye ulasiyor, okunuyor, duzeltiliyor, geri
cekiliyor ve geri aliniyor -- her adimda hem statu hem VELININ GORDUGU
dogrulaniyor, denetim izi bes satirla kapaniyor."
```

---

## A2 kapanışı — merge öncesi kontrol listesi

- [ ] Dört süit de yeşil; yalnız Documents/S3 tabanı kırık ve sayısı dal öncesiyle aynı.
- [ ] Swagger 12 duyuru yolu / 15 operasyon sunuyor, `DELETE` yok.
- [ ] `grep -rn "ForceStatusAsync" tests/` boş (Görev 11).
- [ ] `AnnouncementPermissionSurfaceTests` 15 istek keşfediyor ve tablosu tam (Görev 3).
- [ ] Nihai bir **dal-geneli** inceleme yapıldı (A1'in BLOCKER'ı yalnız beş handler yan yana konunca görülmüştü — A2'nin beş yeni handler'ı `AnnouncementLifecycleGuard`'ı paylaşıyor, ama incelemenin sorusu yine "hepsi aynı şeyi mi yapıyor" olmalı).
- [ ] Ledger'da (`oksis-api/.superpowers/sdd/2026-08-03-duyurular-a2-yasam-dongusu/progress.md`) her mutasyon denetiminin sonucu, her plan hatası ve A3'e taşınan her karar yazılı.

**A2 bittiğinde sıradaki A3'tür** (şablon CRUD, `GET /publishers`, `GET /{id}/delivery-report`, Hangfire job'ları, ek dosya). B (mock→gerçek geçiş) A3'ten sonra, tek seferde.
