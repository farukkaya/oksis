# Duyurular A2 — Yaşam Döngüsü ve Moderasyon Implementation Plan (2/3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Bu dosya Görev 7–11'i içerir.** Header, Global Constraints, plan-seviyesi düzeltmeler (D-1/D-2/D-3), dosya yapısı ve görev listesi **`2026-08-03-duyurular-a2-yasam-dongusu.md`**'dedir — **önce onu oku.** Görev 1–6 orada, Görev 12–16 `-3.md`'de.

Görev 7–11 spec dilim **4**'ü (yaşam döngüsü) tamamlar: düzeltme, geri çekme, geri alma, denetim izi.

---

### Task 7: `PUT /announcements/{id}` — düzeltme ucu

Yayın sonrası düzeltme. **Hedef GÖNDERİLMEZ** (INV-2) — kontrat gövdesi (`AmendAnnouncementBody`) yalnız `title`, `body`, `silent` taşır.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Commands/AmendAnnouncement/AmendAnnouncementCommand.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Commands/AmendAnnouncement/AmendAnnouncementCommandHandler.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Commands/AmendAnnouncement/AmendAnnouncementCommandValidator.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Events/Notifications/AnnouncementAmendedNotificationHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Modify: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementPermissionSurfaceTests.cs` (tablo + sayı)
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAudienceFixture.cs` (yardımcı)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AmendAnnouncementTests.cs`

**Interfaces:**
- Consumes: `Announcement.Amend(string title, string body, bool silent, DateTimeOffset now)` (Görev 4), `AnnouncementLifecycleGuard.{ResolveCallerAsync, CanActOn}` + `AnnouncementCaller` (Görev 6), `AnnouncementAuditWriter.Write(...)` (Görev 6), `NotificationKind.AnnouncementAmended` (Görev 6), `AnnouncementMapper.ToDto(Announcement, IReadOnlyList<AnnouncementTarget>, bool? isRead, IReadOnlyList<Guid> childIds, int? seenCount)`, `IDateTimeProvider.UtcNow`, `INotificationRecipientResolver.ResolvePersonAccountsMapAsync(Guid schoolId, IReadOnlyList<Guid> personIds, CancellationToken)`, `INotificationEnqueuer.Enqueue(Guid eventId, Guid schoolId, NotificationKind kind, string title, string body, string? deepLink, IReadOnlyList<Guid> recipientAccountIds)`, `DeterministicGuid.Combine(params object[])`, `DomainEventNotification<T>` (`Oksis.Application.Common.Events`)
- Produces:
  - `sealed record AmendAnnouncementCommand(Guid Id, string Title, string Body, bool Silent) : ICommand<AnnouncementDto>` — `[Tenancy(TenancyMode.Required)]` + `[RequirePermission("announcements.update")]`
  - `sealed record AmendAnnouncementRequestBody(string Title, string Body, bool Silent)` (controller dosyasının sonunda)
  - Fixture yardımcısı: `Task<AnnouncementDto> AmendAsync(Guid asAccountId, Guid announcementId, string title, string body, bool silent)`

- [ ] **Step 1: Failing testleri yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AmendAnnouncementTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 7 — <c>PUT /announcements/{id}</c>. Dört özellik: hedef GÖNDERİLMEZ (INV-2,
/// kontrat gövdesinde alan yok), yalnız yayındaki duyuru düzeltilir, öğretmen yalnız kendi
/// kaydını düzeltir, sessiz düzeltme rozet açmaz. Kalıp: <see cref="AnnouncementAudienceFixture"/>
/// + Testcontainers MSSQL.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AmendAnnouncementTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public AmendAnnouncementTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Should_UpdateTextAndSetAmendedBadge_When_ManagerAmendsPublished()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis saatleri", "Servisler bir saat erken kalkacaktir.",
            [("all", "all", "student")], asDraft: false);

        var amended = await fixture.AmendAsync(
            fixture.AdminAccountId, Guid.Parse(created.Id),
            "Servis saatleri (guncel)", "Servisler iki saat erken kalkacaktir.", silent: false);

        amended.Title.Should().Be("Servis saatleri (guncel)");
        amended.Body.Should().Be("Servisler iki saat erken kalkacaktir.");
        amended.Amended.Should().BeTrue();
        amended.UpdatedAt.Should().NotBeNull("AuditingInterceptor duzeltmede UpdatedAt yazar");
    }

    /// <summary>
    /// Sessiz düzeltme rozeti AÇMAZ (sözlük: <c>silentAmendment</c>) ama metni değiştirir.
    /// <b>İzolasyon:</b> üstteki test tek başına, <c>silent</c> bayrağı hiç okunmasa ve
    /// <c>Amended</c> koşulsuz yazılsa bile geçerdi; ikisi birlikte bayrağın okunduğunu kanıtlar.
    /// </summary>
    [Fact]
    public async Task Should_NotSetAmendedBadge_When_AmendIsSilent()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis saatleri", "Servisler bir saat erken kalkacaktir.",
            [("all", "all", "student")], asDraft: false);

        var amended = await fixture.AmendAsync(
            fixture.AdminAccountId, Guid.Parse(created.Id),
            "Servis saatleri", "Servisler bir saat erken kalkacaktır.", silent: true);

        amended.Amended.Should().BeFalse();
        amended.Body.Should().Be("Servisler bir saat erken kalkacaktır.");
    }

    /// <summary>
    /// Hedef kitle DEĞİŞMEZ (INV-2). Gövdede alan olmadığı için "gönderilse ne olurdu"
    /// sorulamaz; sınanabilir olan, düzeltmenin donmuş hedefleri ve alıcı listesini
    /// OLDUĞU GİBİ bırakmasıdır — bir sonraki geliştirici <c>Amend</c>'e yeniden
    /// materyalizasyon eklerse bu test kırılır.
    /// </summary>
    [Fact]
    public async Task Should_LeaveTargetsAndRecipientsUntouched_When_Amended()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis saatleri", "Servisler bir saat erken kalkacaktir.",
            [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);

        var targetsBefore = await fixture.Db.AnnouncementTargets.AsNoTracking()
            .Where(t => t.AnnouncementId == id).Select(t => t.Id).OrderBy(x => x).ToListAsync();
        var recipientsBefore = await fixture.Db.AnnouncementRecipients.AsNoTracking()
            .Where(r => r.AnnouncementId == id).Select(r => r.PersonId).OrderBy(x => x).ToListAsync();

        await fixture.AmendAsync(fixture.AdminAccountId, id,
            "Yeni baslik", "Yeni govde metni yeterince uzundur.", silent: false);

        var targetsAfter = await fixture.Db.AnnouncementTargets.AsNoTracking()
            .Where(t => t.AnnouncementId == id).Select(t => t.Id).OrderBy(x => x).ToListAsync();
        var recipientsAfter = await fixture.Db.AnnouncementRecipients.AsNoTracking()
            .Where(r => r.AnnouncementId == id).Select(r => r.PersonId).OrderBy(x => x).ToListAsync();

        targetsAfter.Should().Equal(targetsBefore);
        recipientsAfter.Should().Equal(recipientsBefore);
    }

    /// <summary>
    /// Öğretmen BAŞKASININ duyurusunu düzeltemez. <b>İzolasyon:</b> duyuruyu YÖNETİM yayınlar
    /// (dolayısıyla <c>PublisherId != TeacherPersonId</c>) ve öğretmenin
    /// <c>announcements.update</c> izni VARDIR — 403'ün tek açıklaması sahiplik kapısıdır,
    /// izin eksikliği değil.
    /// </summary>
    [Fact]
    public async Task Should_Forbid_When_TeacherAmendsSomeoneElsesAnnouncement()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Idare duyurusu", "Yonetimin yayinladigi bir duyuru metni.",
            [("all", "all", "student")], asDraft: false);

        var act = async () => await fixture.AmendAsync(
            fixture.TeacherAccountId, Guid.Parse(created.Id),
            "Ele gecirildi", "Baskasinin duyurusunu duzeltmeye calisiyorum.", silent: false);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Error.Forbidden*");
    }

    /// <summary>
    /// Öğretmen KENDİ duyurusunu düzeltebilir — üstteki testin pozitif eşi. İkisi olmadan
    /// "öğretmen hiç düzeltemiyor" hatası da yeşil kalırdı.
    /// </summary>
    [Fact]
    public async Task Should_Allow_When_TeacherAmendsOwnAnnouncement()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A duyurusu", "Yarin sinav yapilacaktir.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        var amended = await fixture.AmendAsync(
            fixture.TeacherAccountId, Guid.Parse(created.Id),
            "9-A duyurusu (guncel)", "Sinav bir hafta ertelenmistir.", silent: false);

        amended.Amended.Should().BeTrue();
    }

    /// <summary>
    /// Yalnız YAYINDAKİ duyuru düzeltilir. Taslak ayrı akışla düzenlenir; onay bekleyen
    /// henüz yayınlanmamıştır. Hata kodu <c>InvalidStatus</c>'tür → <c>MapStatusCode</c> 409.
    /// </summary>
    [Fact]
    public async Task Should_Fail_When_AmendingDraft()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Taslak", "Henuz yayinlanmamis bir taslak metni.",
            [("all", "all", "student")], asDraft: true);

        var act = async () => await fixture.AmendAsync(
            fixture.AdminAccountId, Guid.Parse(created.Id),
            "Yeni baslik", "Yeni govde metni yeterince uzundur.", silent: false);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Announcements.Amend.InvalidStatus*");
    }

    /// <summary>Var olmayan duyuru 404 — "yetkin yok" demek varlığı sızdırırdı.</summary>
    [Fact]
    public async Task Should_ReturnNotFound_When_AnnouncementDoesNotExist()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var act = async () => await fixture.AmendAsync(
            fixture.AdminAccountId, Guid.NewGuid(),
            "Yeni baslik", "Yeni govde metni yeterince uzundur.", silent: false);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Error.NotFound*");
    }

    /// <summary>
    /// Denetim izi HER düzeltmede yazılır — sessizde de. "Sessiz" ALICIYA sessizdir,
    /// denetime değil (sözlük: <c>silentAmendment</c> → "denetim izine yazılır").
    /// </summary>
    [Fact]
    public async Task Should_WriteAuditEntry_When_AmendIsSilent()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);

        await fixture.AmendAsync(fixture.AdminAccountId, id,
            "Servis", "Servisler erken kalkacaktır.", silent: true);

        var entries = await fixture.Db.AnnouncementAuditEntries.AsNoTracking()
            .Where(e => e.AnnouncementId == id).OrderBy(e => e.At).ToListAsync();

        entries.Should().HaveCount(2, "yayin izi + duzeltme izi");
        entries[1].Action.Should().Be("duyuruyu düzeltti");
        entries[1].Tag.Should().Be("Sessiz düzeltme — alıcıya bildirim gönderilmedi");
        entries[1].ActorId.Should().Be(fixture.AdminPersonId);
    }
}
```

- [ ] **Step 2: Fixture'a `AmendAsync` ekle**

`AnnouncementAudienceFixture.cs` — `WriteAuditAsync`'in altına:

```csharp
    /// <summary>
    /// Görev 7 — <c>PUT /announcements/{id}</c> ucunu VERİLEN hesap kimliğiyle çalıştırır.
    /// Handler'ı doğrudan çağırır (MediatR pipeline devre dışı — <c>RequirePermission</c>
    /// burada UYGULANMAZ; izin yüzeyi <c>AnnouncementPermissionSurfaceTests</c>'te ayrıca
    /// sabitlenir). Asıl sınırlar (sahiplik + statü) handler'ın kendi kapılarıyla sınanır.
    /// </summary>
    public async Task<AnnouncementDto> AmendAsync(
        Guid asAccountId, Guid announcementId, string title, string body, bool silent)
    {
        var tenant = new FakeTenantContext(AdminScope.SchoolId);
        var currentUser = new FakeCurrentUser(asAccountId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));
        var clock = new FixedClock(DateTimeOffset.UtcNow);

        var handler = new AmendAnnouncementCommandHandler(
            _context, tenant, currentUser, permissionReader, clock);

        var result = await handler.Handle(
            new AmendAnnouncementCommand(announcementId, title, body, silent), CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"AmendAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!;
    }
```

`using Oksis.Application.Modules.Announcements.Commands.AmendAnnouncement;` dosyanın başına ekle.

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AmendAnnouncementTests"`
Expected: FAIL — derleme hatası (komut/handler yok).

- [ ] **Step 4: Komutu ve validator'ı yaz**

`Commands/AmendAnnouncement/AmendAnnouncementCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.AmendAnnouncement;

/// <summary>
/// Yayın sonrası düzeltme. Gövde <c>packages/api/.../contract.ts</c> içindeki
/// <c>AmendAnnouncementBody</c> ile birebirdir: <c>title</c>, <c>body</c>, <c>silent</c>.
///
/// <para><b>INV-2 — hedef alanı YOKTUR ve eklenmeyecektir.</b> Alıcı listesi yayın anında
/// donar; hedefi yanlış seçilmiş duyuru geri çekilip yeniden yayınlanır. Domain metodu
/// (<c>Announcement.Amend</c>) da hedef parametresi almaz ve bunu bir yansıma testi kilitler.</para>
///
/// <para><see cref="Silent"/> = sessiz düzeltme (sözlük: <c>silentAmendment</c>) — anlamı
/// değiştirmeyen imla/biçim düzeltmesi. Alıcıya bildirim GİTMEZ ve "Güncellendi" rozeti
/// açılmaz; denetim izine YAZILIR.</para>
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.update")]
public sealed record AmendAnnouncementCommand(
    Guid Id,
    string Title,
    string Body,
    bool Silent) : ICommand<AnnouncementDto>;
```

`Commands/AmendAnnouncement/AmendAnnouncementCommandValidator.cs`:

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Announcements.Commands.AmendAnnouncement;

/// <summary>
/// Girdi doğrulaması. Domain (<c>Announcement.Amend</c> → <c>NormalizeTitle/NormalizeBody</c>)
/// AYNI sınırları yeniden uygular — bu kopya değil, katman görevidir: validator 400 üretir,
/// domain ise handler doğrudan çağrıldığında (testler) son savunma hattıdır.
/// Sınır değerleri <c>Announcement.TitleMinLength/TitleMaxLength/BodyMinLength</c> ile aynıdır.
/// </summary>
public sealed class AmendAnnouncementCommandValidator : AbstractValidator<AmendAnnouncementCommand>
{
    public AmendAnnouncementCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty()
            .WithMessage("announcements.errors.id-required");

        RuleFor(x => x.Title).NotEmpty().Length(3, 90)
            .WithMessage("announcements.errors.title-invalid");

        RuleFor(x => x.Body).NotEmpty().MinimumLength(6)
            .WithMessage("announcements.errors.body-invalid");
    }
}
```

- [ ] **Step 5: Handler'ı yaz**

`Commands/AmendAnnouncement/AmendAnnouncementCommandHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.AmendAnnouncement;

/// <summary>
/// Yayın sonrası düzeltme (spec dilim 4).
///
/// <para><b>Hedef ve alıcı listesine DOKUNMAZ</b> (INV-2) — burada yeniden materyalizasyon
/// yoktur ve olmayacaktır. Duyurunun kime gittiği yayın anında dondu.</para>
///
/// <para>Sahiplik kapısı <see cref="AnnouncementLifecycleGuard.CanActOn"/>'dadır: öğretmen
/// yalnız kendi kaydını düzeltir. <c>announcements.update</c> izni ucu AÇAR, hangi kayda
/// dokunulabileceğini bu kapı söyler — iki katman birbirinin yerine geçmez.</para>
/// </summary>
public sealed class AmendAnnouncementCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader,
    IDateTimeProvider clock)
    : ICommandHandler<AmendAnnouncementCommand, AnnouncementDto>
{
    public async Task<Result<AnnouncementDto>> Handle(
        AmendAnnouncementCommand request, CancellationToken cancellationToken)
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

        var announcement = await db.Announcements
            .SingleOrDefaultAsync(a => a.Id == request.Id && a.SchoolId == schoolId, cancellationToken);

        if (announcement is null)
        {
            return Result<AnnouncementDto>.NotFound();
        }

        if (!AnnouncementLifecycleGuard.CanActOn(announcement, caller))
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        try
        {
            announcement.Amend(request.Title, request.Body, request.Silent);
        }
        catch (AnnouncementDomainException ex)
        {
            return Result<AnnouncementDto>.Failure(new Error(ex.Code, ex.Message));
        }

        // Denetim izi HER düzeltmede yazılır — sessizde de. "Sessiz" ALICIYA sessizdir,
        // denetime değil: sözlükteki silentAmendment tanımı bunu açıkça söyler.
        AnnouncementAuditWriter.Write(
            db, schoolId, announcement.Id, caller,
            action: "duyuruyu düzeltti",
            at: clock.UtcNow,
            field: null,
            tag: request.Silent ? "Sessiz düzeltme — alıcıya bildirim gönderilmedi" : "Güncellendi olarak işaretlendi",
            tone: null);

        await db.SaveChangesAsync(cancellationToken);

        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => t.AnnouncementId == announcement.Id)
            .ToListAsync(cancellationToken);

        var seenCount = await db.AnnouncementRecipients.AsNoTracking()
            .CountAsync(r => r.AnnouncementId == announcement.Id && r.IsRead, cancellationToken);

        return Result<AnnouncementDto>.Success(AnnouncementMapper.ToDto(
            announcement, targets, isRead: null, childIds: [], seenCount: seenCount));
    }
}
```

- [ ] **Step 6: Bildirim handler'ını yaz**

`Events/Notifications/AnnouncementAmendedNotificationHandler.cs`:

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
/// Duyuru düzeltildiğinde ALICILARA in-app bildirim gönderir — düzeltme, okunan metnin
/// anlamının değiştiği demektir.
///
/// <para><b>Sessiz düzeltmede HİÇBİR ŞEY yapmaz</b> (sözlük: <c>silentAmendment</c>).
/// Erken dönüş, bu handler'ın var oluş sebebinin yarısıdır: bildirim kararı domain'de
/// değil burada verilir, çünkü domain kayıt tutmayı hiçbir hâlde bırakmaz.</para>
///
/// <para><b>Dedup anahtarı zamanı İÇERİR.</b> Bir duyuru birden çok kez düzeltilebilir ve
/// her düzeltme ayrı bir haberdir; <c>AnnouncementPublished</c>'ın (bir kez yayınlanır)
/// aksine sabit bir anahtar ikinci düzeltmeyi sessizce yutardı.</para>
/// </summary>
public sealed class AnnouncementAmendedNotificationHandler(
    IApplicationDbContext db,
    INotificationRecipientResolver resolver,
    INotificationEnqueuer enqueuer)
    : INotificationHandler<DomainEventNotification<AnnouncementAmendedEvent>>
{
    public async Task Handle(
        DomainEventNotification<AnnouncementAmendedEvent> notification, CancellationToken cancellationToken)
    {
        var e = notification.DomainEvent;

        if (e.Silent)
        {
            return;
        }

        var personIds = await db.AnnouncementRecipients.AsNoTracking()
            .Where(r => r.SchoolId == e.SchoolId && r.AnnouncementId == e.AnnouncementId)
            .Select(r => r.PersonId)
            .ToListAsync(cancellationToken);

        if (personIds.Count == 0)
        {
            return;
        }

        var accountMap = await resolver.ResolvePersonAccountsMapAsync(
            e.SchoolId, personIds, cancellationToken);

        if (accountMap.Count == 0)
        {
            return;
        }

        var eventId = DeterministicGuid.Combine(
            e.SchoolId, e.AnnouncementId, "ANNOUNCEMENT_AMENDED", e.OccurredAt.UtcTicks);

        enqueuer.Enqueue(
            eventId, e.SchoolId, NotificationKind.AnnouncementAmended,
            e.Title,
            "Bu duyuru güncellendi.",
            $"/announcements/{e.AnnouncementId}",
            accountMap.Values.Distinct().ToList());
    }
}
```

- [ ] **Step 7: Controller ucunu ekle**

`AnnouncementsController.cs` — `CreateAsync`'in altına:

```csharp
    /// <summary>
    /// Yayın sonrası düzeltme. Gövde HEDEF TAŞIMAZ (INV-2) — alıcı listesi yayın anında
    /// dondu; hedefi yanlış seçilmiş duyuru <c>:withdraw</c> ile geri çekilip yeniden
    /// yayınlanır.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AmendAsync(
        Guid id, [FromBody] AmendAnnouncementRequestBody body, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new AmendAnnouncementCommand(id, body.Title, body.Body, body.Silent), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

ve dosyanın **sonuna** (sınıfın dışına, `AttendanceController` kalıbı):

```csharp
/// <summary>
/// <c>PUT /announcements/{id}</c> gövdesi. <c>contract.ts</c>'teki
/// <c>AmendAnnouncementBody</c> ile birebir — <c>id</c> rotadan gelir, gövdede YOKTUR
/// (komut kaydını doğrudan <c>[FromBody]</c> ile bağlamak generated OpenAPI'ye gövdede
/// olmayan bir <c>id</c> alanı yazardı ve kontrat drift'i üretirdi).
/// </summary>
public sealed record AmendAnnouncementRequestBody(string Title, string Body, bool Silent);
```

`using Oksis.Application.Modules.Announcements.Commands.AmendAnnouncement;` ekle.

- [ ] **Step 8: İzin yüzeyi tablosunu güncelle**

`AnnouncementPermissionSurfaceTests.cs`:
- `ExpectedPermissions()`'a satır ekle: `yield return [typeof(AmendAnnouncementCommand), "announcements.update"];`
- `Should_DiscoverAllSixRequests_When_ReflectionRuns`'ı **7** yap ve adını `Should_DiscoverAllRequests_When_ReflectionRuns` olarak değiştir (sayı artık her görevde değişecek).
- `using` ekle.

- [ ] **Step 9: Testlerin geçtiğini doğrula**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~Announcement"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AmendAnnouncementTests"
```
Expected: PASS (8 amend testi + izin yüzeyi).

- [ ] **Step 10: Sahiplik kapısının gerçekten sınandığını KANITLA**

`AnnouncementLifecycleGuard.CanActOn`'daki `caller.IsManager ||` kısmını geçici olarak `true ||` yap, testleri çalıştır, `Should_Forbid_When_TeacherAmendsSomeoneElsesAnnouncement`'ın **kırıldığını** gör, `git checkout --` ile geri al, tekrar çalıştır → PASS. Sonucu ledger'a yaz.

- [ ] **Step 11: Tam süit**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests
dotnet test tests/Oksis.Api.UnitTests
```
Expected: Documents/S3 tabanı dışında sıfır hata. **`AnnouncementsControllerTests` KIRILACAK** — uç sayısı 6'dan 7'ye çıktı. Bu **beklenen**: o bekçi Görev 16'da tek seferde güncellenir. Kırılan test adını ledger'a yaz ve **düzeltme** (Görev 16'nın işi); başka bir şey kırıldıysa DUR.

- [ ] **Step 12: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Application/Modules/Announcements/Commands/AmendAnnouncement/ \
        src/Oksis.Application/Modules/Announcements/Events/Notifications/AnnouncementAmendedNotificationHandler.cs \
        src/Oksis.Api/Controllers/V1/AnnouncementsController.cs \
        tests/
git commit -m "feat(api): duyuru duzeltme ucu eklendi

PUT /announcements/{id} -- govde HEDEF TASIMAZ (INV-2) ve hedef/alici listesine
hic dokunulmaz. Ogretmen yalniz kendi kaydini duzeltir (izin ucu acar, sahiplik
kapisi hangi kayda dokunulacagini soyler). Sessiz duzeltme rozet acmaz ve alici
bildirimi uretmez, ama denetim izine YAZILIR."
```

---

### Task 8: `POST /announcements/{id}:withdraw`

Geri çekme — **gerekçe zorunlu**, `StatusBeforeWithdraw` saklanır (INV-4'ün yarısı; diğer yarısı Görev 9).

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Commands/WithdrawAnnouncement/{Command,Handler,Validator}.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Events/Notifications/AnnouncementWithdrawnNotificationHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Modify: `tests/.../AnnouncementPermissionSurfaceTests.cs`, `AnnouncementAudienceFixture.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/WithdrawAnnouncementTests.cs`

**Interfaces:**
- Consumes: `Announcement.Withdraw(string reason, Guid withdrawnBy, DateTimeOffset now)` (Görev 5), Görev 6'nın üç parçası, Görev 7'nin kurduğu handler kalıbı
- Produces:
  - `sealed record WithdrawAnnouncementCommand(Guid Id, string Reason) : ICommand<AnnouncementDto>` — `[Tenancy(Required)]` + `[RequirePermission("announcements.withdraw")]`
  - `sealed record AnnouncementReasonRequestBody(string Reason)` (controller sonunda; Görev 15 `:reject` de bunu kullanır)
  - Fixture yardımcısı: `Task<AnnouncementDto> WithdrawAsync(Guid asAccountId, Guid announcementId, string reason)`

- [ ] **Step 1: Failing testleri yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/WithdrawAnnouncementTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 8 — <c>POST /announcements/{id}:withdraw</c>. Duyuru SİLİNMEZ (INV-1); geri
/// çekilen kayıt arşivde "geri çekildi" olarak kalır, alıcı yüzeyinden ise HİÇ YOKMUŞ gibi
/// düşer (INV-7).
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class WithdrawAnnouncementTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public WithdrawAnnouncementTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Should_MarkWithdrawnAndKeepReason_When_ManagerWithdrawsPublished()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);

        var withdrawn = await fixture.WithdrawAsync(
            fixture.AdminAccountId, Guid.Parse(created.Id), "Yanlis tarih yazilmis.");

        withdrawn.Status.Should().Be("withdrawn");
        withdrawn.WithdrawReason.Should().Be("Yanlis tarih yazilmis.");

        var row = await fixture.Db.Announcements.AsNoTracking()
            .SingleAsync(a => a.Id == Guid.Parse(created.Id));
        row.StatusBeforeWithdraw.Should().Be(AnnouncementStatus.Published,
            "INV-4: geri alma icin onceki statu saklanir");
        row.WithdrawnBy.Should().Be(fixture.AdminPersonId);
    }

    /// <summary>
    /// <b>INV-1 — kayıt SİLİNMEZ.</b> Geri çekme bir <c>DELETE</c> değildir: satır, hedefleri,
    /// alıcıları ve denetim izi yerinde kalır. Bu test tam olarak "geri çekme = silme"
    /// yanlışını yakalar.
    /// </summary>
    [Fact]
    public async Task Should_KeepAllRowsInPlace_When_Withdrawn()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);

        var recipientsBefore = await fixture.Db.AnnouncementRecipients.AsNoTracking()
            .CountAsync(r => r.AnnouncementId == id);

        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Gerekce metni.");

        (await fixture.Db.Announcements.AsNoTracking().CountAsync(a => a.Id == id))
            .Should().Be(1, "duyuru SILINMEZ");
        (await fixture.Db.AnnouncementRecipients.AsNoTracking().CountAsync(r => r.AnnouncementId == id))
            .Should().Be(recipientsBefore, "alici satirlari da silinmez");
        (await fixture.Db.AnnouncementTargets.AsNoTracking().CountAsync(t => t.AnnouncementId == id))
            .Should().BeGreaterThan(0, "donmus hedefler kalir");
    }

    /// <summary>
    /// <b>INV-7 — alıcı yüzeyinden düşer.</b> Geri çekilen duyuru gelen kutusunda GÖRÜNMEZ.
    /// <b>İzolasyon:</b> aynı veli, geri çekmeden ÖNCE duyuruyu görüyordu (ilk assertion);
    /// tek değişken statüdür.
    /// </summary>
    [Fact]
    public async Task Should_DisappearFromInbox_When_Withdrawn()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("role", "parent", "parent")], asDraft: false);
        var id = Guid.Parse(created.Id);

        var before = await fixture.InboxAsync(fixture.ParentAccountId);
        before.Should().Contain(a => a.Id == created.Id, "geri cekmeden once goruyordu");

        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Gerekce metni.");

        var after = await fixture.InboxAsync(fixture.ParentAccountId);
        after.Should().NotContain(a => a.Id == created.Id, "INV-7: geri cekilen duyuru okuyucuda YOKTUR");
    }

    [Fact]
    public async Task Should_WriteAuditEntryWithDangerTone_When_Withdrawn()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);

        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Yanlis tarih yazilmis.");

        var entries = await fixture.Db.AnnouncementAuditEntries.AsNoTracking()
            .Where(e => e.AnnouncementId == id).OrderBy(e => e.At).ToListAsync();

        entries.Should().HaveCount(2);
        entries[1].Action.Should().Be("duyuruyu geri çekti");
        entries[1].Field.Should().Be("Gerekçe: Yanlis tarih yazilmis.");
        entries[1].Tone.Should().Be("danger");
    }

    /// <summary>
    /// Öğretmen BAŞKASININ duyurusunu geri çekemez. İzolasyon Görev 7'dekiyle aynı:
    /// duyuruyu yönetim yayınlar, öğretmenin <c>announcements.withdraw</c> izni VARDIR.
    /// </summary>
    [Fact]
    public async Task Should_Forbid_When_TeacherWithdrawsSomeoneElsesAnnouncement()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Idare duyurusu", "Yonetimin yayinladigi bir duyuru.",
            [("all", "all", "student")], asDraft: false);

        var act = async () => await fixture.WithdrawAsync(
            fixture.TeacherAccountId, Guid.Parse(created.Id), "Begenmedim.");

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Error.Forbidden*");
    }

    [Fact]
    public async Task Should_Allow_When_TeacherWithdrawsOwnAnnouncement()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A duyurusu", "Yarin sinav yapilacaktir.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        var withdrawn = await fixture.WithdrawAsync(
            fixture.TeacherAccountId, Guid.Parse(created.Id), "Sinav iptal edildi.");

        withdrawn.Status.Should().Be("withdrawn");
    }

    [Fact]
    public async Task Should_Fail_When_WithdrawingDraft()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Taslak", "Henuz yayinlanmamis bir taslak.", [("all", "all", "student")], asDraft: true);

        var act = async () => await fixture.WithdrawAsync(
            fixture.AdminAccountId, Guid.Parse(created.Id), "Gerekce metni.");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Announcements.Withdraw.InvalidStatus*");
    }

    [Fact]
    public async Task Should_Fail_When_ReasonIsBlank()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);

        var act = async () => await fixture.WithdrawAsync(
            fixture.AdminAccountId, Guid.Parse(created.Id), "   ");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Announcements.Withdraw.ReasonRequired*");
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_AnnouncementDoesNotExist()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var act = async () => await fixture.WithdrawAsync(
            fixture.AdminAccountId, Guid.NewGuid(), "Gerekce metni.");

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Error.NotFound*");
    }
}
```

- [ ] **Step 2: Fixture'a `WithdrawAsync` ekle**

```csharp
    /// <summary>Görev 8 — <c>POST /announcements/{id}:withdraw</c> ucunu çalıştırır.</summary>
    public async Task<AnnouncementDto> WithdrawAsync(Guid asAccountId, Guid announcementId, string reason)
    {
        var tenant = new FakeTenantContext(AdminScope.SchoolId);
        var currentUser = new FakeCurrentUser(asAccountId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));
        var clock = new FixedClock(DateTimeOffset.UtcNow);

        var handler = new WithdrawAnnouncementCommandHandler(
            _context, tenant, currentUser, permissionReader, clock);

        var result = await handler.Handle(
            new WithdrawAnnouncementCommand(announcementId, reason), CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"WithdrawAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!;
    }
```

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~WithdrawAnnouncementTests"`
Expected: FAIL — derleme hatası.

- [ ] **Step 4: Komut + validator**

`Commands/WithdrawAnnouncement/WithdrawAnnouncementCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.WithdrawAnnouncement;

/// <summary>
/// Geri çekme (sözlük: <c>withdraw</c>) — <c>delete</c> DEĞİL. Kayıt arşivde "geri çekildi"
/// olarak kalır (INV-1) ve alıcı yüzeyinden düşer (INV-7).
/// Gövde <c>contract.ts</c>'teki <c>ReasonBody</c> ile birebirdir.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.withdraw")]
public sealed record WithdrawAnnouncementCommand(Guid Id, string Reason) : ICommand<AnnouncementDto>;
```

`WithdrawAnnouncementCommandValidator.cs`:

```csharp
using FluentValidation;

namespace Oksis.Application.Modules.Announcements.Commands.WithdrawAnnouncement;

/// <summary>
/// Gerekçe ZORUNLUDUR. Domain (<c>Announcement.Withdraw</c>) aynı kuralı son savunma hattı
/// olarak yeniden uygular; bu sınıf onu 400'e çevirir (domain hatası 400'e düşerdi ama
/// mesajı istemci sözleşmesindeki anahtar olmazdı).
/// </summary>
public sealed class WithdrawAnnouncementCommandValidator : AbstractValidator<WithdrawAnnouncementCommand>
{
    public WithdrawAnnouncementCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("announcements.errors.id-required");
        RuleFor(x => x.Reason).NotEmpty().WithMessage("announcements.errors.reason-required");
    }
}
```

- [ ] **Step 5: Handler**

`Commands/WithdrawAnnouncement/WithdrawAnnouncementCommandHandler.cs` — Görev 7'nin handler'ıyla **aynı iskelet**; farklar işaretli:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.WithdrawAnnouncement;

/// <summary>
/// Yayındaki (veya süresi dolmuş) duyuruyu alıcı listelerinden kaldırır. <b>SİLMEZ</b> —
/// INV-1: <c>db.Announcements.Remove(...)</c> bu modülde hiçbir yerde çağrılmaz ve bir
/// kaynak taraması (<c>AnnouncementsControllerTests</c>) bunu kilitler.
/// </summary>
public sealed class WithdrawAnnouncementCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader,
    IDateTimeProvider clock)
    : ICommandHandler<WithdrawAnnouncementCommand, AnnouncementDto>
{
    public async Task<Result<AnnouncementDto>> Handle(
        WithdrawAnnouncementCommand request, CancellationToken cancellationToken)
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

        var announcement = await db.Announcements
            .SingleOrDefaultAsync(a => a.Id == request.Id && a.SchoolId == schoolId, cancellationToken);

        if (announcement is null)
        {
            return Result<AnnouncementDto>.NotFound();
        }

        if (!AnnouncementLifecycleGuard.CanActOn(announcement, caller))
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        var previousStatus = AnnouncementEnumWire.ToWire(announcement.Status);

        try
        {
            announcement.Withdraw(request.Reason, caller.PersonId, clock.UtcNow);
        }
        catch (AnnouncementDomainException ex)
        {
            return Result<AnnouncementDto>.Failure(new Error(ex.Code, ex.Message));
        }

        AnnouncementAuditWriter.Write(
            db, schoolId, announcement.Id, caller,
            action: "duyuruyu geri çekti",
            at: clock.UtcNow,
            field: $"Gerekçe: {announcement.WithdrawReason}",
            tag: $"Durum: {previousStatus} → withdrawn",
            tone: "danger");

        await db.SaveChangesAsync(cancellationToken);

        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => t.AnnouncementId == announcement.Id)
            .ToListAsync(cancellationToken);

        var seenCount = await db.AnnouncementRecipients.AsNoTracking()
            .CountAsync(r => r.AnnouncementId == announcement.Id && r.IsRead, cancellationToken);

        return Result<AnnouncementDto>.Success(AnnouncementMapper.ToDto(
            announcement, targets, isRead: null, childIds: [], seenCount: seenCount));
    }
}
```

> `announcement.WithdrawReason` denetim izine **domain'in normalize ettiği** hâliyle yazılır (`request.Reason` ham hâliyle DEĞİL) — kayıt, entity'de duran değerin aynısını anlatmalıdır.

- [ ] **Step 6: Bildirim handler'ı**

`Events/Notifications/AnnouncementWithdrawnNotificationHandler.cs`:

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
/// Duyuru geri çekildiğinde <b>YALNIZ YAYINLAYANA</b> bildirim gönderir — alıcılara DEĞİL.
///
/// <para>İhtiyaç analizi §16.3: <i>"sessizce kaybolsun; yanlış duyurunun izinin alıcıda
/// kalması kafa karıştırır. İz yönetim tarafında tutulur."</i> Alıcıya "az önce gördüğün
/// duyuru geri çekildi" demek, geri çekmenin amacını (duyuruyu ortadan kaldırmak) bozardı.</para>
///
/// <para><b>Kendi kaydını geri çeken kişiye bildirim GİTMEZ</b> — kendi eyleminin haberi
/// gürültüdür. Bildirim öğretmenin duyurusunu YÖNETİM geri çektiğinde anlamlıdır.</para>
/// </summary>
public sealed class AnnouncementWithdrawnNotificationHandler(
    IApplicationDbContext db,
    INotificationRecipientResolver resolver,
    INotificationEnqueuer enqueuer)
    : INotificationHandler<DomainEventNotification<AnnouncementWithdrawnEvent>>
{
    public async Task Handle(
        DomainEventNotification<AnnouncementWithdrawnEvent> notification, CancellationToken cancellationToken)
    {
        var e = notification.DomainEvent;

        var row = await db.Announcements.AsNoTracking()
            .Where(a => a.SchoolId == e.SchoolId && a.Id == e.AnnouncementId)
            .Select(a => new { a.PublisherId, a.WithdrawnBy })
            .FirstOrDefaultAsync(cancellationToken);

        if (row is null || row.WithdrawnBy == row.PublisherId)
        {
            return;
        }

        var accountMap = await resolver.ResolvePersonAccountsMapAsync(
            e.SchoolId, [row.PublisherId], cancellationToken);

        if (accountMap.Count == 0)
        {
            return;
        }

        var eventId = DeterministicGuid.Combine(
            e.SchoolId, e.AnnouncementId, "ANNOUNCEMENT_WITHDRAWN", e.OccurredAt.UtcTicks);

        enqueuer.Enqueue(
            eventId, e.SchoolId, NotificationKind.AnnouncementWithdrawn,
            $"Duyurunuz geri çekildi: {e.Title}",
            $"Gerekçe: {e.Reason}",
            $"/announcements/{e.AnnouncementId}",
            accountMap.Values.Distinct().ToList());
    }
}
```

- [ ] **Step 7: Controller ucu**

```csharp
    /// <summary>
    /// Geri çekme. Rota iki nokta ile biter (<c>{id}:withdraw</c>) — yaşam döngüsü fiili,
    /// generic PATCH değil. <b>DELETE ucu YOKTUR</b> (INV-1): yanlış duyuru silinmez,
    /// geri çekilir ve arşivde kalır.
    /// </summary>
    [HttpPost("{id:guid}:withdraw")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> WithdrawAsync(
        Guid id, [FromBody] AnnouncementReasonRequestBody body, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new WithdrawAnnouncementCommand(id, body.Reason), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

ve dosyanın sonuna:

```csharp
/// <summary>
/// Gerekçe taşıyan gövdelerin ortak şekli — <c>contract.ts</c>'teki <c>ReasonBody</c>.
/// <c>:withdraw</c> ve <c>:reject</c> AYNI şekli kullanır (kontrat da öyle yapar).
/// </summary>
public sealed record AnnouncementReasonRequestBody(string Reason);
```

- [ ] **Step 8: İzin yüzeyi tablosunu güncelle**

`ExpectedPermissions()`'a: `yield return [typeof(WithdrawAnnouncementCommand), "announcements.withdraw"];`
Keşif sayısını **8** yap.

- [ ] **Step 9: Testler**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~Announcement"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~WithdrawAnnouncementTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests
```
Expected: PASS (9 withdraw testi). Tam süitte yalnız `AnnouncementsControllerTests`'in uç sayısı bekçisi kırık (Görev 16'da kapanır) + Documents/S3 tabanı.

- [ ] **Step 10: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Application/Modules/Announcements/Commands/WithdrawAnnouncement/ \
        src/Oksis.Application/Modules/Announcements/Events/Notifications/AnnouncementWithdrawnNotificationHandler.cs \
        src/Oksis.Api/Controllers/V1/AnnouncementsController.cs \
        tests/
git commit -m "feat(api): duyuru geri cekme ucu eklendi

Gerekce zorunlu, StatusBeforeWithdraw saklanir (INV-4'un yarisi). Kayit SILINMEZ
(INV-1): satir, hedefler, alicilar ve denetim izi yerinde kalir; yalniz okuyucu
yuzeyinden duser (INV-7). Bildirim ALICIYA DEGIL yayinlayana gider ve kendi
kaydini geri ceken kisiye hic gitmez."
```

---

### Task 9: `POST /announcements/{id}:restore`

**INV-4:** ÖNCEKİ statüye döner, koşulsuz `published` YAPMAZ. Domain bunu Görev 5'te kanıtladı; bu görev ucu açar ve **uçtan uca** aynı kanıtı üretir.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/Commands/RestoreAnnouncement/{Command,Handler}.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Modify: `tests/.../AnnouncementPermissionSurfaceTests.cs`, `AnnouncementAudienceFixture.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/RestoreAnnouncementTests.cs`

**Interfaces:**
- Consumes: `Announcement.Restore()` ve `Announcement.Expire()` (Görev 5), Görev 6'nın üç parçası
- Produces:
  - `sealed record RestoreAnnouncementCommand(Guid Id) : ICommand<AnnouncementDto>` — `[Tenancy(Required)]` + `[RequirePermission("announcements.withdraw")]`
  - Fixture yardımcıları: `Task<AnnouncementDto> RestoreAsync(Guid asAccountId, Guid announcementId)` ve `Task ExpireAsync(Guid announcementId)`

> **Validator YOKTUR.** Gövde yoktur, tek alan rota `Guid`'idir ve `{id:guid}` kısıtı onu zaten doğrular. Üç satırlık bir validator eklemek katman üretmek olurdu (Global: *"Don't create a layer for 3 lines of logic"*).

> **İzin `withdraw`'dur, ayrı bir `restore` anahtarı YOKTUR.** Spec §6 ikisini tek satırda birleştirir ve seed'de böyle bir anahtar yoktur — geri alma, geri çekmenin geri alınmasıdır; onu yapabilen onu geri de alabilir.

- [ ] **Step 1: Failing testleri yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/RestoreAnnouncementTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 9 — <c>POST /announcements/{id}:restore</c> (toast'taki "Geri al").
///
/// <para><b>INV-4 uçtan uca:</b> geri alma ÖNCEKİ statüye döner. MSW mock'u bugün koşulsuz
/// <c>published</c> yazar (<c>api-mocks/.../announcement-handlers.ts:220-226</c>) — backend
/// bağlayıcı olan taraftır ve B fazında istemci gerçek uca bağlandığında doğru davranış
/// sunucudan gelir.</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class RestoreAnnouncementTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public RestoreAnnouncementTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Should_ReturnToPublished_When_RestoringWithdrawnPublishedAnnouncement()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);
        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Yanlislikla yayinlandi.");

        var restored = await fixture.RestoreAsync(fixture.AdminAccountId, id);

        restored.Status.Should().Be("published");
        restored.WithdrawReason.Should().BeNull("geri cekme izleri temizlenir");
    }

    /// <summary>
    /// <b>INV-4'ün AYIRT EDİCİ testi, uçtan uca.</b> Süresi dolmuş bir duyuru geri çekilip
    /// geri alınırsa <c>expired</c>'a döner. Handler koşulsuz <c>published</c> yazsaydı
    /// YALNIZ bu test kırılırdı — üstteki test iki uygulamada da aynı sonucu verir.
    /// </summary>
    [Fact]
    public async Task Should_ReturnToExpired_When_RestoringWithdrawnExpiredAnnouncement()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);

        await fixture.ExpireAsync(id);                                        // GERÇEK domain yolu
        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Arsivden de kaldirilmali.");

        var restored = await fixture.RestoreAsync(fixture.AdminAccountId, id);

        restored.Status.Should().Be("expired",
            "INV-4: geri alma ONCEKI statuye doner, kosulsuz published'a DEGIL");
    }

    /// <summary>
    /// Geri alınan duyuru gelen kutusuna GERİ DÖNER (INV-7'nin diğer yönü). Geri çekme
    /// alıcıdan sildi; geri alma geri getirir — aksi hâlde geri alma bir işe yaramazdı.
    /// </summary>
    [Fact]
    public async Task Should_ReappearInInbox_When_Restored()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("role", "parent", "parent")], asDraft: false);
        var id = Guid.Parse(created.Id);
        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Gerekce metni.");

        (await fixture.InboxAsync(fixture.ParentAccountId))
            .Should().NotContain(a => a.Id == created.Id);

        await fixture.RestoreAsync(fixture.AdminAccountId, id);

        (await fixture.InboxAsync(fixture.ParentAccountId))
            .Should().Contain(a => a.Id == created.Id);
    }

    [Fact]
    public async Task Should_WriteAuditEntry_When_Restored()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);
        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Gerekce metni.");

        await fixture.RestoreAsync(fixture.AdminAccountId, id);

        var entries = await fixture.Db.AnnouncementAuditEntries.AsNoTracking()
            .Where(e => e.AnnouncementId == id).OrderBy(e => e.At).ToListAsync();

        entries.Should().HaveCount(3, "yayin + geri cekme + geri alma");
        entries[2].Action.Should().Be("geri çekmeyi geri aldı");
        entries[2].Tone.Should().BeNull("geri alma bir uyari degildir");
    }

    [Fact]
    public async Task Should_Fail_When_RestoringNonWithdrawnAnnouncement()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);

        var act = async () => await fixture.RestoreAsync(fixture.AdminAccountId, Guid.Parse(created.Id));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Announcements.Restore.InvalidStatus*");
    }

    /// <summary>
    /// Öğretmen başkasının geri çekilmiş duyurusunu geri alamaz. Sahiplik kapısı geri
    /// çekmedeki ile AYNI olmalıdır — biri diğerinden gevşek olsaydı öğretmen kendi
    /// duyurusunu geri çektiremediği hâlde başkasınınkini yayına döndürebilirdi.
    /// </summary>
    [Fact]
    public async Task Should_Forbid_When_TeacherRestoresSomeoneElsesAnnouncement()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Idare duyurusu", "Yonetimin yayinladigi bir duyuru.",
            [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);
        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Gerekce metni.");

        var act = async () => await fixture.RestoreAsync(fixture.TeacherAccountId, id);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Error.Forbidden*");
    }
}
```

- [ ] **Step 2: Fixture'a `RestoreAsync` ve `ExpireAsync` ekle**

```csharp
    /// <summary>Görev 9 — <c>POST /announcements/{id}:restore</c> ucunu çalıştırır.</summary>
    public async Task<AnnouncementDto> RestoreAsync(Guid asAccountId, Guid announcementId)
    {
        var tenant = new FakeTenantContext(AdminScope.SchoolId);
        var currentUser = new FakeCurrentUser(asAccountId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));
        var clock = new FixedClock(DateTimeOffset.UtcNow);

        var handler = new RestoreAnnouncementCommandHandler(
            _context, tenant, currentUser, permissionReader, clock);

        var result = await handler.Handle(
            new RestoreAnnouncementCommand(announcementId), CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"RestoreAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!;
    }

    /// <summary>
    /// Görev 9 — süresi dolmuş bir duyuru sahnesini <b>GERÇEK domain metoduyla</b> kurar
    /// (<c>Announcement.Expire</c>). Bunu çağıran <c>ExpireAnnouncementsJob</c> A3'ün
    /// kapsamındadır; test sahnesi job'ı beklemez ama <see cref="ForceStatusAsync"/> gibi
    /// bir arka kapı da KULLANMAZ — INV-4'ün ayırt edici testi arşiv durumuna gerçek
    /// yoldan ulaşmayı gerektirir (Görev 11 bu ayrımı bütün testlere yayar).
    /// </summary>
    public async Task ExpireAsync(Guid announcementId)
    {
        var entity = await _context.Announcements.SingleAsync(a => a.Id == announcementId);
        entity.Expire();
        await _context.SaveChangesAsync();
    }
```

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~RestoreAnnouncementTests"`
Expected: FAIL — derleme hatası.

- [ ] **Step 4: Komut**

`Commands/RestoreAnnouncement/RestoreAnnouncementCommand.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Commands.RestoreAnnouncement;

/// <summary>
/// Geri çekmeyi geri alır (toast'taki "Geri al"). Gövdesi YOKTUR — kontrat da öyle der
/// (<c>restoreAnnouncement(id)</c>, gövde göndermez).
///
/// <para>İzni <c>announcements.withdraw</c>'dur; ayrı bir "restore" anahtarı YOKTUR ve
/// olmayacaktır — geri alma, geri çekmenin geri alınmasıdır. Sekiz seed'li anahtar arasında
/// da böyle bir anahtar bulunmaz (spec §4).</para>
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.withdraw")]
public sealed record RestoreAnnouncementCommand(Guid Id) : ICommand<AnnouncementDto>;
```

- [ ] **Step 5: Handler**

`Commands/RestoreAnnouncement/RestoreAnnouncementCommandHandler.cs` — Görev 8'in iskeleti, iki fark: `Restore()` çağrılır ve **bildirim yoktur** (Görev 5 domain testi olayın yayılmadığını kilitledi).

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Domain.Modules.Announcements.Exceptions;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Commands.RestoreAnnouncement;

/// <summary>
/// Geri çekmeyi geri alır. <b>INV-4:</b> <c>Announcement.Restore</c> ÖNCEKİ statüye döner —
/// bu handler statü seçimine hiç karışmaz, çünkü karışsaydı domain'deki tek doğru ile
/// buradaki ikinci bir yargı zamanla ayrışabilirdi.
///
/// <para><b>Bildirim YOKTUR.</b> Alıcı duyuruyu zaten görmüştü ve geri çekilme sırasında
/// listeden düştü; geri gelmesi yeni bir haber değildir. Domain de olay yaymaz.</para>
/// </summary>
public sealed class RestoreAnnouncementCommandHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader,
    IDateTimeProvider clock)
    : ICommandHandler<RestoreAnnouncementCommand, AnnouncementDto>
{
    public async Task<Result<AnnouncementDto>> Handle(
        RestoreAnnouncementCommand request, CancellationToken cancellationToken)
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

        var announcement = await db.Announcements
            .SingleOrDefaultAsync(a => a.Id == request.Id && a.SchoolId == schoolId, cancellationToken);

        if (announcement is null)
        {
            return Result<AnnouncementDto>.NotFound();
        }

        if (!AnnouncementLifecycleGuard.CanActOn(announcement, caller))
        {
            return Result<AnnouncementDto>.Forbidden();
        }

        try
        {
            announcement.Restore();
        }
        catch (AnnouncementDomainException ex)
        {
            return Result<AnnouncementDto>.Failure(new Error(ex.Code, ex.Message));
        }

        AnnouncementAuditWriter.Write(
            db, schoolId, announcement.Id, caller,
            action: "geri çekmeyi geri aldı",
            at: clock.UtcNow,
            field: $"Durum: withdrawn → {AnnouncementEnumWire.ToWire(announcement.Status)}",
            tag: null,
            tone: null);

        await db.SaveChangesAsync(cancellationToken);

        var targets = await db.AnnouncementTargets.AsNoTracking()
            .Where(t => t.AnnouncementId == announcement.Id)
            .ToListAsync(cancellationToken);

        var seenCount = await db.AnnouncementRecipients.AsNoTracking()
            .CountAsync(r => r.AnnouncementId == announcement.Id && r.IsRead, cancellationToken);

        return Result<AnnouncementDto>.Success(AnnouncementMapper.ToDto(
            announcement, targets, isRead: null, childIds: [], seenCount: seenCount));
    }
}
```

- [ ] **Step 6: Controller ucu**

```csharp
    /// <summary>Geri çekmeyi geri alır. <b>INV-4:</b> ÖNCEKİ statüye döner, koşulsuz
    /// <c>published</c> YAPMAZ — süresi dolmuş bir duyuru <c>expired</c>'a geri döner.</summary>
    [HttpPost("{id:guid}:restore")]
    [ProducesResponseType(typeof(ApiResponse<AnnouncementDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RestoreAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RestoreAnnouncementCommand(id), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 7: İzin yüzeyi tablosunu güncelle**

`yield return [typeof(RestoreAnnouncementCommand), "announcements.withdraw"];` — keşif sayısı **9**.

- [ ] **Step 8: Testler + INV-4 mutasyon denetimi**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~RestoreAnnouncementTests"
```
Expected: 6 PASS.

Sonra `Announcement.Restore`'daki `Status = previous;` satırını `Status = AnnouncementStatus.Published;` yap, bu dosyayı çalıştır, **yalnız** `Should_ReturnToExpired_...`'ın kırıldığını gör, `git checkout --` ile geri al. Sonucu ledger'a yaz.

- [ ] **Step 9: Tam süit**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests && dotnet test tests/Oksis.Application.UnitTests`
Expected: Documents/S3 tabanı + `AnnouncementsControllerTests` uç sayısı bekçisi (Görev 16) dışında sıfır hata.

- [ ] **Step 10: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Application/Modules/Announcements/Commands/RestoreAnnouncement/ \
        src/Oksis.Api/Controllers/V1/AnnouncementsController.cs tests/
git commit -m "feat(api): geri cekmeyi geri alma ucu eklendi

INV-4 uctan uca: :restore ONCEKI statuye doner. Ayirt edici test suresi dolmus
bir duyuruyu (gercek Expire() metoduyla, ForceStatusAsync arka kapisiyla degil)
geri ceker ve geri alir -- published'tan geri cekilen senaryo kosulsuz published
yazan bir implementasyonda da yesil kalirdi. Bildirim uretilmez."
```

---

### Task 10: `GET /announcements/{id}/audit-trail`

Denetim izi — **değiştirilemez** işlem geçmişi. Kontrat şekli (`AnnouncementAuditEntryDto`): `actorName`, `actorInitials`, `action`, `at`, `field`, `tag`, `tone`.

`actorInitials` entity'de **yoktur** ve olmayacaktır: baş harfler addan türetilir ve ad zaten dondurulmuştur. Sunum türevini kalıcı kaydın kolonu yapmak, aynı bilgiyi iki kez saklamak olurdu.

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementAuditEntryDto.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementAuditTrail/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Common/ActorInitials.cs`
- Modify: `src/Oksis.Api/Controllers/V1/AnnouncementsController.cs`
- Modify: `tests/.../AnnouncementPermissionSurfaceTests.cs`, `AnnouncementAudienceFixture.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Announcements/ActorInitialsTests.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementAuditTrailTests.cs`

**Interfaces:**
- Consumes: `AnnouncementAuditEntry` (`AnnouncementId`, `ActorId`, `ActorName`, `Action`, `At`, `Field`, `Tag`, `Tone`), `AnnouncementLifecycleGuard`, Görev 7–9'un yazdığı izler
- Produces:
  - `sealed record AnnouncementAuditEntryDto { required string ActorName; required string ActorInitials; required string Action; required string At; string? Field; string? Tag; string? Tone; }`
  - `sealed record GetAnnouncementAuditTrailQuery(Guid Id) : IQuery<IReadOnlyList<AnnouncementAuditEntryDto>>` — `[Tenancy(Required)]` + `[RequirePermission("announcements.report.view")]`
  - `static string ActorInitials.From(string name)`
  - Fixture yardımcısı: `Task<IReadOnlyList<AnnouncementAuditEntryDto>> AuditTrailAsync(Guid asAccountId, Guid announcementId)`

- [ ] **Step 1: `ActorInitials` için failing test yaz**

`tests/Oksis.Application.UnitTests/Modules/Announcements/ActorInitialsTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Announcements.Common;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

/// <summary>
/// Denetim izi avatarındaki baş harfler. Türkçe kültür PİNLENİR — invariant kültürde
/// "İlkay" → "I" olur (noktasız), tr-TR'de "İ" kalır. A1 Görev 9 aynı tuzağı
/// <c>AnnouncementAudienceRules</c>'ta kapatmıştı; burada da aynı kural geçerlidir.
/// </summary>
public sealed class ActorInitialsTests
{
    [Theory]
    [InlineData("Okul Müdürü", "OM")]
    [InlineData("Elif Öğretmen", "EÖ")]
    [InlineData("ilkay şahin", "İŞ")]
    [InlineData("Ayşe", "A")]
    [InlineData("Ayşe Nur Yılmaz", "AY")]
    public void Should_ProduceInitials_When_NameIsGiven(string name, string expected)
    {
        ActorInitials.From(name).Should().Be(expected);
    }

    /// <summary>
    /// <c>ActorName</c> domain'de boş olamaz ama bu saf fonksiyon kendi başına da güvenli
    /// olmalıdır — çağrı yerinde null kontrolü dağıtmak yerine burada tek yerde biter.
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Should_ReturnEmpty_When_NameIsBlank(string? name)
    {
        ActorInitials.From(name!).Should().BeEmpty();
    }

    /// <summary>
    /// Üç kelimelik adda İLK ve SON alınır (ortadaki göbek adı değil) — "Ayşe Nur Yılmaz"
    /// için "AY". Bu, iki kelimelik ada uygulanan kuralın doğal genişlemesidir ve avatar
    /// baş harflerinin soyadı taşımasını garanti eder.
    /// </summary>
    [Fact]
    public void Should_UseFirstAndLastWord_When_NameHasMiddleWords()
    {
        ActorInitials.From("Mehmet Akif Ersoy").Should().Be("ME");
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~ActorInitialsTests"`
Expected: FAIL — derleme hatası.

- [ ] **Step 3: `ActorInitials`'ı yaz**

`src/Oksis.Application/Modules/Announcements/Common/ActorInitials.cs`:

```csharp
using System.Globalization;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// Denetim izi avatarının baş harfleri. <b>Entity'de saklanmaz</b> — ad zaten dondurulmuştur
/// (<c>AnnouncementAuditEntry.ActorName</c>) ve baş harf onun sunum türevidir; kolon açmak
/// aynı bilgiyi iki kez saklamak ve ikisinin ayrışmasına izin vermek olurdu.
/// </summary>
public static class ActorInitials
{
    // tr-TR PİNLENİR: invariant kültürde "ilkay" → "I" (noktasız) olurdu. A1 Görev 9'un
    // AnnouncementAudienceRules'ta kapattığı aynı tuzak.
    private static readonly CultureInfo _turkish = new("tr-TR");

    public static string From(string name)
    {
        var words = (name ?? string.Empty)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        return words.Length switch
        {
            0 => string.Empty,
            1 => First(words[0]),
            // Üç kelimelik adda İLK ve SON alınır: göbek adı değil soyadı taşınmalıdır.
            _ => First(words[0]) + First(words[^1]),
        };
    }

    private static string First(string word) =>
        word.Length == 0 ? string.Empty : _turkish.TextInfo.ToUpper(word[0].ToString());
}
```

- [ ] **Step 4: `ActorInitials` testinin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~ActorInitialsTests"`
Expected: 9 PASS. Türkçe vakalarının (`ilkay şahin` → `İŞ`) gerçekten geçtiğini gör — geçmiyorsa kültür pinlemesi çalışmıyordur.

- [ ] **Step 5: Denetim izi ucu için failing test yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementAuditTrailTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// A2 Görev 10 — <c>GET /announcements/{id}/audit-trail</c>. Denetim izi DEĞİŞTİRİLEMEZ
/// ve kayıtla birlikte yaşar; bu uç onu okur, üretmez. Satırlar Görev 7–9'un yazdıklarıdır.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class GetAnnouncementAuditTrailTests : IAsyncLifetime
{
    private readonly DatabaseFixture _database;

    public GetAnnouncementAuditTrailTests(DatabaseFixture database) => _database = database;

    public async Task InitializeAsync() => await _database.EnsureDatabaseCreatedAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    /// <summary>
    /// Tam yaşam döngüsünün izi, ESKİDEN YENİYE. Sıra sabittir: denetim izi bir tarihçedir
    /// ve tarihçe ters okunmaz.
    /// </summary>
    [Fact]
    public async Task Should_ReturnEntriesInChronologicalOrder_When_LifecycleIsComplete()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);

        await fixture.AmendAsync(fixture.AdminAccountId, id, "Servis (guncel)",
            "Servisler iki saat erken kalkacaktir.", silent: false);
        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Yanlis tarih yazilmis.");
        await fixture.RestoreAsync(fixture.AdminAccountId, id);

        var trail = await fixture.AuditTrailAsync(fixture.AdminAccountId, id);

        trail.Select(e => e.Action).Should().Equal(
            "duyuruyu yayınladı", "duyuruyu düzeltti", "duyuruyu geri çekti", "geri çekmeyi geri aldı");
    }

    [Fact]
    public async Task Should_ProjectActorInitialsAndTone_When_TrailIsRead()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Servis", "Servisler erken kalkacaktir.", [("all", "all", "student")], asDraft: false);
        var id = Guid.Parse(created.Id);
        await fixture.WithdrawAsync(fixture.AdminAccountId, id, "Yanlis tarih yazilmis.");

        var trail = await fixture.AuditTrailAsync(fixture.AdminAccountId, id);

        var withdrawEntry = trail.Single(e => e.Action == "duyuruyu geri çekti");
        withdrawEntry.ActorName.Should().Be("Okul Müdürü");
        withdrawEntry.ActorInitials.Should().Be("OM");
        withdrawEntry.Tone.Should().Be("danger");
        withdrawEntry.Field.Should().Be("Gerekçe: Yanlis tarih yazilmis.");
        withdrawEntry.At.Should().NotBeNullOrWhiteSpace();
    }

    /// <summary>
    /// Öğretmen BAŞKASININ izini okuyamaz (spec §6: "Öğretmen yalnız kendi kaydı").
    /// <b>İzolasyon:</b> öğretmenin <c>announcements.report.view</c> izni VARDIR — 403'ün
    /// tek açıklaması sahiplik kapısıdır.
    /// </summary>
    [Fact]
    public async Task Should_Forbid_When_TeacherReadsSomeoneElsesTrail()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsync(
            "Idare duyurusu", "Yonetimin yayinladigi bir duyuru.",
            [("all", "all", "student")], asDraft: false);

        var act = async () => await fixture.AuditTrailAsync(
            fixture.TeacherAccountId, Guid.Parse(created.Id));

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Error.Forbidden*");
    }

    [Fact]
    public async Task Should_Allow_When_TeacherReadsOwnTrail()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);
        var created = await fixture.CreateAnnouncementAsAsync(
            fixture.TeacherAccountId, "9-A duyurusu", "Yarin sinav yapilacaktir.",
            [("section", fixture.HighSchoolClassRoomId.ToString(), "parent")], asDraft: false);

        var trail = await fixture.AuditTrailAsync(fixture.TeacherAccountId, Guid.Parse(created.Id));

        trail.Should().ContainSingle().Which.ActorName.Should().Be("Elif Öğretmen");
    }

    [Fact]
    public async Task Should_ReturnNotFound_When_AnnouncementDoesNotExist()
    {
        await using var fixture = await AnnouncementAudienceFixture.CreateAsync(_database);

        var act = async () => await fixture.AuditTrailAsync(fixture.AdminAccountId, Guid.NewGuid());

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("*Error.NotFound*");
    }
}
```

- [ ] **Step 6: Fixture'a `AuditTrailAsync` ekle**

```csharp
    /// <summary>Görev 10 — <c>GET /announcements/{id}/audit-trail</c> ucunu çalıştırır.</summary>
    public async Task<IReadOnlyList<AnnouncementAuditEntryDto>> AuditTrailAsync(
        Guid asAccountId, Guid announcementId)
    {
        var tenant = new FakeTenantContext(AdminScope.SchoolId);
        var currentUser = new FakeCurrentUser(asAccountId);
        var permissionReader = new FakePermissionReader(PermissionsFor(asAccountId));

        var handler = new GetAnnouncementAuditTrailQueryHandler(
            _context, tenant, currentUser, permissionReader);

        var result = await handler.Handle(
            new GetAnnouncementAuditTrailQuery(announcementId), CancellationToken.None);

        if (result.IsFailure)
        {
            throw new InvalidOperationException(
                $"AuditTrailAsync başarısız: {result.Error.Code} — {result.Error.Message}");
        }

        return result.Value!;
    }
```

- [ ] **Step 7: DTO, sorgu ve handler'ı yaz**

`DTOs/AnnouncementAuditEntryDto.cs`:

```csharp
namespace Oksis.Application.Modules.Announcements.DTOs;

/// <summary>
/// Denetim izi satırı — <c>contract.ts</c>'teki <c>AnnouncementAuditEntryDto</c> ile BİREBİR.
/// <c>Tone</c> tel'de <c>"danger" | "warning" | null</c>'dır; başka bir değer yazılmaz.
/// </summary>
public sealed record AnnouncementAuditEntryDto
{
    public required string ActorName { get; init; }

    /// <summary>Avatar baş harfleri — entity'de saklanmaz, <c>ActorName</c>'den türetilir.</summary>
    public required string ActorInitials { get; init; }

    public required string Action { get; init; }

    /// <summary>ISO-8601 ("O") — diğer duyuru DTO'larıyla aynı biçim.</summary>
    public required string At { get; init; }

    public string? Field { get; init; }
    public string? Tag { get; init; }
    public string? Tone { get; init; }
}
```

`Queries/GetAnnouncementAuditTrail/GetAnnouncementAuditTrailQuery.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.DTOs;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementAuditTrail;

/// <summary>
/// Duyurunun değiştirilemez işlem geçmişi. İzni <c>announcements.report.view</c>'dur
/// (spec §6, gönderim raporuyla aynı satır); öğretmende de vardır ama handler onu kendi
/// kayıtlarına daraltır.
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("announcements.report.view")]
public sealed record GetAnnouncementAuditTrailQuery(Guid Id)
    : IQuery<IReadOnlyList<AnnouncementAuditEntryDto>>;
```

`Queries/GetAnnouncementAuditTrail/GetAnnouncementAuditTrailQueryHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Application.Modules.Announcements.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Announcements.Queries.GetAnnouncementAuditTrail;

/// <summary>
/// Denetim izini ESKİDEN YENİYE döner — tarihçe ters okunmaz.
///
/// <para>Duyurunun varlığı ÖNCE doğrulanır: iz satırı olmayan bir duyuru (henüz hiçbir
/// eylem yapılmamış taslak) boş dizi dönmelidir, var olmayan bir duyuru ise 404. Doğrudan
/// iz tablosuna sorulsaydı ikisi ayırt edilemezdi.</para>
/// </summary>
public sealed class GetAnnouncementAuditTrailQueryHandler(
    IApplicationDbContext db,
    ITenantContext tenant,
    ICurrentUser currentUser,
    IPermissionReader permissionReader)
    : IQueryHandler<GetAnnouncementAuditTrailQuery, IReadOnlyList<AnnouncementAuditEntryDto>>
{
    public async Task<Result<IReadOnlyList<AnnouncementAuditEntryDto>>> Handle(
        GetAnnouncementAuditTrailQuery request, CancellationToken cancellationToken)
    {
        if (tenant.CurrentSchoolId is not { } schoolId)
        {
            return Result<IReadOnlyList<AnnouncementAuditEntryDto>>.Forbidden();
        }

        var callerResult = await AnnouncementLifecycleGuard.ResolveCallerAsync(
            db, currentUser, permissionReader, cancellationToken);
        if (callerResult.IsFailure)
        {
            return Result<IReadOnlyList<AnnouncementAuditEntryDto>>.Forbidden();
        }

        var caller = callerResult.Value!;

        var announcement = await db.Announcements.AsNoTracking()
            .SingleOrDefaultAsync(a => a.Id == request.Id && a.SchoolId == schoolId, cancellationToken);

        if (announcement is null)
        {
            return Result<IReadOnlyList<AnnouncementAuditEntryDto>>.NotFound();
        }

        if (!AnnouncementLifecycleGuard.CanActOn(announcement, caller))
        {
            return Result<IReadOnlyList<AnnouncementAuditEntryDto>>.Forbidden();
        }

        var rows = await db.AnnouncementAuditEntries.AsNoTracking()
            .Where(e => e.SchoolId == schoolId && e.AnnouncementId == request.Id)
            .OrderBy(e => e.At)
            .ThenBy(e => e.Id)
            .ToListAsync(cancellationToken);

        IReadOnlyList<AnnouncementAuditEntryDto> items = rows.Select(e => new AnnouncementAuditEntryDto
        {
            ActorName = e.ActorName,
            ActorInitials = ActorInitials.From(e.ActorName),
            Action = e.Action,
            At = e.At.ToString("O"),
            Field = e.Field,
            Tag = e.Tag,
            Tone = e.Tone,
        }).ToList();

        return Result<IReadOnlyList<AnnouncementAuditEntryDto>>.Success(items);
    }
}
```

> `ThenBy(e => e.Id)`: aynı `FixedClock` altında yazılan iki iz satırının `At`'i eşit olabilir (Görev 6'nın fixture yardımcısı bunu `AddSeconds(1)` ile kırıyor, ama gerçek akışta bir handler tek `clock.UtcNow` ile iki satır yazabilir). Görev 2'deki sayfalama tiebreaker'ıyla aynı gerekçe.

- [ ] **Step 8: Controller ucu**

```csharp
    /// <summary>Denetim izi — değiştirilemez işlem geçmişi, eskiden yeniye.</summary>
    [HttpGet("{id:guid}/audit-trail")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AnnouncementAuditEntryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAuditTrailAsync(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetAnnouncementAuditTrailQuery(id), cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
```

- [ ] **Step 9: İzin yüzeyi tablosunu güncelle**

`yield return [typeof(GetAnnouncementAuditTrailQuery), "announcements.report.view"];` — keşif sayısı **10**.

- [ ] **Step 10: Testler**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~Announcement"
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetAnnouncementAuditTrailTests"
dotnet test tests/Oksis.Infrastructure.IntegrationTests
```
Expected: PASS (5 iz testi). Tam süitte Görev 16'ya bırakılan controller bekçisi + Documents/S3 tabanı.

- [ ] **Step 11: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementAuditEntryDto.cs \
        src/Oksis.Application/Modules/Announcements/Queries/GetAnnouncementAuditTrail/ \
        src/Oksis.Application/Modules/Announcements/Common/ActorInitials.cs \
        src/Oksis.Api/Controllers/V1/AnnouncementsController.cs tests/
git commit -m "feat(api): duyuru denetim izi ucu eklendi

Iz eskiden yeniye doner. actorInitials entity'de SAKLANMAZ -- ad zaten dondurulmus
durumda ve bas harf onun sunum turevi; kolon acmak ayni bilgiyi iki kez saklamak
olurdu. tr-TR kulturu pinlendi (invariant kulturde ilkay -> I, noktasiz)."
```

---

### Task 11: `ForceStatusAsync` emekliye ayrılır — arşiv testleri gerçek yoldan

A1 Görev 13'ün kayıtlı borcunu kapatır: *"`ForceStatusAsync` kabul edilmiş bir test-only dikiştir (henüz Withdraw/Expire domain metodu yok) ama Task 14+ gerçek metotları getirince, arşiv durumuna GERÇEK yoldan ulaşan eş testler ekle."*

Gerçek metotlar Görev 5'te geldi. **Bu görev `ForceStatusAsync`'i tamamen kaldırır** — "eş test ekle" yerine "arka kapıyı kapat", çünkü kapı açık kalırsa bir sonraki görev yine oradan girer.

**Files:**
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAudienceFixture.cs`
- Modify: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetAnnouncementsTests.cs`
- Modify: her `ForceStatusAsync` çağıran diğer test dosyası (Step 1'de tespit edilir)

**Interfaces:**
- Consumes: `AnnouncementAudienceFixture.{WithdrawAsync, ExpireAsync}` (Görev 8, 9)
- Produces: `ForceStatusAsync` **silinir**. `ForceChildAsync` **KALIR** — o farklı bir dikiştir (`ChildPersonId`'yi belirli bir değere sabitler) ve onun gerçek bir domain karşılığı yoktur.

- [ ] **Step 1: Çağrı yerlerini bul**

Run:
```bash
cd /Users/farukkaya/Repositories/oksis-api
grep -rn "ForceStatusAsync" tests/
```

Beklenen: `AnnouncementAudienceFixture.cs`'teki tanım + `GetAnnouncementsTests.cs`'teki arşiv kapsam testi (A1 Görev 13). Başka çağrı çıkarsa hepsini listele — **hiçbiri atlanmayacak.**

- [ ] **Step 2: Her çağrıyı gerçek yola çevir**

Her çağrı için:

| Eski | Yeni |
|---|---|
| `ForceStatusAsync(id, "withdrawn")` | `await fixture.WithdrawAsync(fixture.AdminAccountId, id, "<anlamlı gerekçe>")` |
| `ForceStatusAsync(id, "expired")` | `await fixture.ExpireAsync(id)` |
| `ForceStatusAsync(id, "<diğer>")` | **DUR ve bildir** — o statüye giden gerçek bir yol A2'de yoktur (`archived` A3'ün konusu) |

Değiştirilen testin doc yorumuna şu notu ekle:

```csharp
/// <para><b>A2 Görev 11:</b> statü artık GERÇEK domain yoluyla kurulur (<c>Withdraw()</c> /
/// <c>Expire()</c>) — eski <c>ForceStatusAsync</c> arka kapısı kaldırıldı. Fark önemsiz
/// değildir: arka kapı yalnız kolonu yazıyordu, gerçek yol ise geri çekme alanlarını,
/// <c>StatusBeforeWithdraw</c>'ı ve denetim izini de üretir — yani bu test artık ürünün
/// gerçekten ürettiği veriye bakıyor.</para>
```

> **Beklenen yan etki:** geri çekme artık denetim izi satırı da yazar. `AnnouncementAuditEntries` sayısını okuyan bir assertion varsa güncellenmelidir. Bu bir regresyon değil, testin **daha gerçek** hâle gelmesidir.

- [ ] **Step 3: `ForceStatusAsync`'i sil**

`AnnouncementAudienceFixture.cs`'ten metodu ve XML-doc'unu tamamen kaldır. `ForceChildAsync`'e **dokunma**; onun doc yorumundaki *"<see cref="ForceStatusAsync"/> ile AYNI kalıp"* atfını şununla değiştir:

```csharp
    /// domain invariant'ı DEĞİLDİR, yalnız test sahnesi kurar; prod kod yolunda asla
    /// kullanılmaz. (Kardeşi <c>ForceStatusAsync</c> A2 Görev 11'de KALDIRILDI — statü
    /// geçişlerinin artık gerçek domain metotları var. Bu dikişin ise domain karşılığı
    /// yoktur: <c>AudienceResolver</c> çok çocuklu velide "ilk eşleşen çocuğu" yazar ve
    /// hangisinin ilk olacağı sorgu sırasına bağlıdır.)
```

- [ ] **Step 4: Arka kapının geri gelmeyeceğini bir testle kilitle**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementAuditWriterTests.cs`'e ekle:

```csharp
/// <summary>
/// A2 Görev 11 — statü zorlayan test-only arka kapı KALDIRILDI ve geri gelmemelidir.
/// Bir sonraki geliştirici "hızlıca bir arşiv sahnesi kurayım" diye onu yeniden eklerse
/// bu test kırılır ve gerçek yolun (<c>Withdraw()</c>/<c>Expire()</c>) var olduğunu
/// hatırlatır. A1'de bu dikiş, henüz domain metodu olmadığı için MEŞRUYDU; artık değil.
/// </summary>
[Fact]
public void Should_NotExposeStatusForcingSeam_When_FixtureIsInspected()
{
    typeof(AnnouncementAudienceFixture)
        .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
        .Should().NotContain(m => m.Name.Contains("ForceStatus", StringComparison.Ordinal),
            "statu gecisleri artik gercek domain metotlariyla kurulur");
}
```

`using System.Reflection;` ekle. `AnnouncementAudienceFixture` `internal` olduğu için aynı assembly'den erişilebilir.

- [ ] **Step 5: Testler**

```bash
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Announcement"
grep -rn "ForceStatusAsync" tests/ || echo "TEMIZ"
```
Expected: PASS + `TEMIZ`.

- [ ] **Step 6: Tam integration projesi**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests`
Expected: Documents/S3 tabanı + Görev 16'ya bırakılan controller bekçisi dışında sıfır hata. **Paylaşılan fixture değişti** — `AudienceResolverTests` sayılarını özellikle kontrol et.

- [ ] **Step 7: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add tests/
git commit -m "test(announcements): statu zorlayan test dikisi kaldirildi

A1'de ForceStatusAsync mesru bir gecici dikisti (Withdraw/Expire domain metotlari
henuz yoktu). Artik varlar: arsiv sahneleri gercek yoldan kuruluyor ve bu, sadece
kolonu yazan arka kapinin uretmedigi seyleri de uretiyor -- StatusBeforeWithdraw,
geri cekme alanlari ve denetim izi. Bir yansima testi kapinin geri gelmesini
engelliyor."
```

---

> **Görev 12'den itibaren `2026-08-03-duyurular-a2-yasam-dongusu-3.md`'ye devam et.**
