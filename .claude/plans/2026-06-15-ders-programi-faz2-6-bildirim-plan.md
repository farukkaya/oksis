# Ders Programı — Faz 2.6: Bildirim & SignalR Fan-out — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Timetable'ın 5 domain event'ini gerçek bildirime bağla; bunun için genel ama minimal bir in-app + SignalR bildirim altyapısı kur (silo değil).

**Architecture:** Mevcut Davet (Invitation) güvenilirlik modeli taban: domain event → MediatR `INotificationHandler<DomainEventNotification<TEvent>>` (commit sonrası) → `IBackgroundJobClient.Enqueue` Hangfire job → `INotificationDispatcher` → `InAppNotificationChannel` (kalıcı `notifications` satırı + `NotificationHub` SignalR push). İdempotentlik `notification_delivery_log` unique index ile. Outbox YOK (Teknik Analiz §10 "event→Hangfire" yeterli; Debt-N1).

**Tech Stack:** .NET 10 · EF Core · MediatR · Hangfire · SignalR · MSSQL — React + Vite · React Query v5 · Zustand · `@microsoft/signalr` (yeni, onaylı) · shadcn/ui (Popover/Badge) · i18next.

**Bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` §33-34. **Tasarım:** `.claude/plans/2026-06-15-ders-programi-faz2-6-bildirim-design.md`.

---

## Önemli pattern notları (uygulamadan önce oku — koddan doğrulandı 2026-06-15)

- **Kimlik eşlemesi:** Bildirim alıcısı = **Account.Id** (= JWT `sub`/NameIdentifier = `ICurrentUser.Id` = SignalR accountId). Domain person id (`TeacherId`, öğrenci/veli PersonId) → `Person.LinkedAccountId` (1:1, unique) ile Account.Id'ye çözülür. `Person` = `src/Oksis.Domain/Modules/Users/Entities/Person.cs` (`Id`, `SchoolId`, `LinkedAccountId`).
- **TeacherId = Person.Id** (`LessonPlacement.TeacherId`, event'lerdeki `OriginalTeacherId`/`NewTeacherId` hepsi Person.Id).
- **Şube öğrencileri:** `db.Profiles.OfType<StudentProfile>()` → `CurrentClassroomId == branchId && IsActiveStudent` → `PersonId`. (StudentProfile: `src/Oksis.Domain/Modules/Users/Entities/StudentProfile.cs`.)
- **Veli:** `db.ParentStudentRelationships` → `RevokedAt == null && StudentPersonId in (...)` → `ParentPersonId`.
- **Event yayını:** `DomainEventInterceptor.SavedChangesAsync` (commit SONRASI) her event'i `DomainEventNotification<TEvent>` (INotification) olarak `IPublisher.Publish` eder. Handler = `INotificationHandler<DomainEventNotification<TEvent>>`. Wrapper: `src/Oksis.Application/Common/Events/DomainEventNotification.cs`.
- **Hangfire enqueue:** `IBackgroundJobClient.Enqueue<TJob>(j => j.SendAsync(args, CancellationToken.None))`. Job `AddTransient`. Davet örneği: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/SendInvitationNotificationJob.cs`.
- **Hangfire job içinde tenant context:** HTTP yok → job başında `tenantContext.SetForLoginFlow(schoolId)` çağrılır (yoksa EF query filter + `TenantSaveChangesInterceptor` SchoolId dolduramaz). `ITenantContext`: `src/Oksis.Infrastructure/Identity/TenantContext.cs`.
- **TenantEntity** base: `src/Oksis.Domain/Common/TenantEntity.cs` — `SchoolId` (protected init), audit + soft-delete + `RowVersion`. `AggregateRoot`tan türer (DomainEvents taşır → config'te `Ignore(x => x.DomainEvents)`).
- **EF config deseni:** `builder.ToAcademicTable("...")` timetable için `[academic]` şema; bizimkiler **`[identity]` veya yeni şema** değil — bkz. Task A2 kararı. Snake_case kolon, `HasFilter("is_deleted = 0")`, `HasDatabaseName("ix_...")`.
- **Migration:** `ASPNETCORE_ENVIRONMENT=Mac-Development dotnet ef migrations add YYYYMMDDHHmmss_YYYYMMDD_desc --project src/Oksis.Infrastructure --startup-project src/Oksis.Api`. Sonra generated dosyayı `dotnet format` ile file-scoped namespace'e çevir.
- **Test ortamı:** DB/integration testleri için `ASPNETCORE_ENVIRONMENT=Mac-Development` (docker `oksis-mssql` ayakta, sa/localhost,1433).
- **DI:** Infrastructure `src/Oksis.Infrastructure/DependencyInjection.cs`; API SignalR `src/Oksis.Api/Program.cs` (`AddSignalR()` satır ~132, `MapHub` satır ~249).
- **SignalR mevcut:** `SessionHub` (`[Authorize]`, grup `{schoolId}:{accountId}`, claim parse: `school_id` + `sub`/NameIdentifier). Aynı grup adı konvansiyonu kullanılacak.
- **Permission YOK:** notifications self-scope (recipient = current account). Yeni izin/seed gerekmez.
- **FE:** mevcut `src/app/components/shell/NotificationMenu.tsx` mock placeholder zaten var (Bell + ping + Popover + tab'lar) → **refactor** edilecek, sıfırdan değil. httpClient `src/shared/api/httpClient.ts` (baseURL `/api/v1`, Bearer interceptor, zarf `res.data.data`). Auth store `src/shared/store/authStore.ts` (`user.schoolId`, `user.id`). i18n `src/shared/i18n/index.ts`.

---

# BÖLÜM A — BE: Bildirim Domain + Persistence

## Task A1: `Notification` + `NotificationDeliveryLog` domain entities (+test)

**Files:**
- Create: `src/Oksis.Domain/Modules/Notifications/Entities/Notification.cs`
- Create: `src/Oksis.Domain/Modules/Notifications/Entities/NotificationDeliveryLog.cs`
- Create: `src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Notifications/NotificationTests.cs`

- [ ] **Step 1: Failing test yaz**

```csharp
// NotificationTests.cs
using Oksis.Domain.Modules.Notifications.Entities;
using Oksis.Domain.Modules.Notifications.Enums;

public class NotificationTests
{
    [Fact]
    public void Create_sets_unread_and_fields()
    {
        var n = Notification.Create(
            recipientAccountId: Guid.NewGuid(),
            kind: NotificationKind.TimetablePublished,
            title: "📅 Program yayınlandı",
            body: "Haftalık programınız hazır.",
            deepLink: "/teacher/schedule");

        n.IsRead.Should().BeFalse();
        n.ReadAt.Should().BeNull();
        n.Title.Should().Be("📅 Program yayınlandı");
        n.Kind.Should().Be(NotificationKind.TimetablePublished);
    }

    [Fact]
    public void MarkAsRead_sets_flag_and_timestamp_idempotently()
    {
        var n = Notification.Create(Guid.NewGuid(), NotificationKind.TimetableException, "t", "b", null);
        var at = DateTimeOffset.UtcNow;

        n.MarkAsRead(at);
        n.IsRead.Should().BeTrue();
        n.ReadAt.Should().Be(at);

        // ikinci çağrı ilk timestamp'i korur (idempotent)
        n.MarkAsRead(at.AddMinutes(5));
        n.ReadAt.Should().Be(at);
    }
}
```

- [ ] **Step 2: Testi çalıştır, fail gör**

Run: `cd oksis-api && dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~NotificationTests"`
Expected: FAIL — `Notification` tanımlı değil.

- [ ] **Step 3: Enum + entity'leri yaz**

```csharp
// NotificationKind.cs
namespace Oksis.Domain.Modules.Notifications.Enums;

public enum NotificationKind
{
    TimetablePublished = 1,
    TimetableException = 2,        // vekalet/derslik değişikliği
    TimetableCancelled = 3,        // ders iptali
    TimetableExceptionRevoked = 4, // geçici değişiklik geri alındı
    TimetableProgramDeleted = 5,
}
```

```csharp
// Notification.cs
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Notifications.Enums;

namespace Oksis.Domain.Modules.Notifications.Entities;

public sealed class Notification : TenantEntity
{
    private Notification() { } // EF

    public Guid RecipientAccountId { get; private set; }
    public NotificationKind Kind { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Body { get; private set; } = string.Empty;
    public string? DeepLink { get; private set; }
    public bool IsRead { get; private set; }
    public DateTimeOffset? ReadAt { get; private set; }

    public static Notification Create(
        Guid recipientAccountId,
        NotificationKind kind,
        string title,
        string body,
        string? deepLink)
    {
        return new Notification
        {
            Id = Guid.NewGuid(),
            RecipientAccountId = recipientAccountId,
            Kind = kind,
            Title = title,
            Body = body,
            DeepLink = deepLink,
            IsRead = false,
        };
    }

    public void MarkAsRead(DateTimeOffset at)
    {
        if (IsRead) return; // idempotent — ilk okunma zamanını koru
        IsRead = true;
        ReadAt = at;
    }
}
```

```csharp
// NotificationDeliveryLog.cs
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Notifications.Entities;

/// <summary>
/// İdempotentlik backstop'u: (SchoolId, EventId, RecipientAccountId, Channel) unique.
/// Aynı event aynı alıcıya aynı kanaldan iki kez teslim edilemez.
/// </summary>
public sealed class NotificationDeliveryLog : TenantEntity
{
    private NotificationDeliveryLog() { }

    public Guid EventId { get; private set; }
    public Guid RecipientAccountId { get; private set; }
    public string Channel { get; private set; } = string.Empty;
    public DateTimeOffset DeliveredAt { get; private set; }

    public static NotificationDeliveryLog Create(Guid eventId, Guid recipientAccountId, string channel, DateTimeOffset at)
        => new()
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            RecipientAccountId = recipientAccountId,
            Channel = channel,
            DeliveredAt = at,
        };
}
```

- [ ] **Step 4: Testi çalıştır, pass gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~NotificationTests"`
Expected: PASS (2 test).

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Domain/Modules/Notifications tests/Oksis.Domain.UnitTests/Modules/Notifications
git commit -m "2026-06-15 feat,test: Bildirim — Notification + NotificationDeliveryLog domain entity (in-app çekirdek)."
```

---

## Task A2: EF config + DbSet + IApplicationDbContext + migration

**Karar — şema:** Bildirim tabloları modüle ait değil; `[identity]` veya `[dbo]` yerine **kendi `[notifications]` şeması** kullanılır (timetable `[academic]` desenine paralel). Yeni `ToNotificationsTable` extension'ı yoksa `builder.ToTable("notifications", "notifications")` doğrudan yazılır.

**Files:**
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Notifications/NotificationConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Notifications/NotificationDeliveryLogConfiguration.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (DbSet'ler)
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` (DbSet expose)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Notifications/NotificationDeliveryLogIndexTests.cs`

- [ ] **Step 1: Config'leri yaz**

```csharp
// NotificationConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Notifications.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Notifications;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications", "notifications");
        builder.HasKey(x => x.Id);
        builder.Ignore(x => x.DomainEvents);

        builder.Property(x => x.RecipientAccountId).IsRequired();
        builder.Property(x => x.Kind).IsRequired();
        builder.Property(x => x.Title).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Body).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.DeepLink).HasMaxLength(500);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Zil listesi sorgusu: alıcı + okunmamış + zaman
        builder.HasIndex(x => new { x.SchoolId, x.RecipientAccountId, x.IsRead, x.CreatedAt })
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ix_notifications_recipient_unread");
    }
}
```

```csharp
// NotificationDeliveryLogConfiguration.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Notifications.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Notifications;

public sealed class NotificationDeliveryLogConfiguration : IEntityTypeConfiguration<NotificationDeliveryLog>
{
    public void Configure(EntityTypeBuilder<NotificationDeliveryLog> builder)
    {
        builder.ToTable("notification_delivery_log", "notifications");
        builder.HasKey(x => x.Id);
        builder.Ignore(x => x.DomainEvents);

        builder.Property(x => x.Channel).IsRequired().HasMaxLength(40);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // İdempotentlik backstop
        builder.HasIndex(x => new { x.SchoolId, x.EventId, x.RecipientAccountId, x.Channel })
            .IsUnique()
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ux_notification_delivery_log_event_recipient_channel");
    }
}
```

- [ ] **Step 2: DbSet + interface ekle**

`OksisDbContext.cs` içine:
```csharp
public DbSet<Notification> Notifications => Set<Notification>();
public DbSet<NotificationDeliveryLog> NotificationDeliveryLogs => Set<NotificationDeliveryLog>();
```
`IApplicationDbContext.cs` içine:
```csharp
DbSet<Notification> Notifications { get; }
DbSet<NotificationDeliveryLog> NotificationDeliveryLogs { get; }
```
> Not: Mevcut `NotificationConfig`/`NotificationType` (config entity) ile ad çakışması yok — bunlar farklı sınıflar. Using'leri net tut.

- [ ] **Step 3: Derleme**

Run: `cd oksis-api && dotnet build Oksis.slnx --no-restore`
Expected: 0 error.

- [ ] **Step 4: Migration üret + format**

Run:
```bash
cd oksis-api
ASPNETCORE_ENVIRONMENT=Mac-Development dotnet ef migrations add 20260615120000_20260615_add_notifications \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet format
```
Expected: `notifications` + `notification_delivery_log` tabloları + 2 index migration'da. `[notifications]` şeması oluşturulur.

- [ ] **Step 5: Integration test — unique index gerçekten çift teslimi engelliyor mu**

```csharp
// NotificationDeliveryLogIndexTests.cs (mevcut integration test base'ini kullan — ScheduleException testindeki gibi)
[Fact]
public async Task Second_active_delivery_for_same_event_recipient_channel_is_rejected()
{
    var eventId = Guid.NewGuid();
    var account = Guid.NewGuid();
    Db.NotificationDeliveryLogs.Add(NotificationDeliveryLog.Create(eventId, account, "in-app", DateTimeOffset.UtcNow));
    await Db.SaveChangesAsync();

    Db.NotificationDeliveryLogs.Add(NotificationDeliveryLog.Create(eventId, account, "in-app", DateTimeOffset.UtcNow));
    var act = async () => await Db.SaveChangesAsync();

    await act.Should().ThrowAsync<DbUpdateException>();
}
```

Run: `ASPNETCORE_ENVIRONMENT=Mac-Development dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~NotificationDeliveryLogIndexTests"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "2026-06-15 feat,test: Bildirim — EF config + [notifications] şema migration + idempotency unique index (integration test)."
```

---

# BÖLÜM B — BE: Bildirim Soyutlaması + Kanal + Hub + Dispatch Job

## Task B1: Application port'ları (dispatcher, resolver, channel, message)

**Files:**
- Create: `src/Oksis.Application/Modules/Notifications/Abstractions/NotificationMessage.cs`
- Create: `src/Oksis.Application/Modules/Notifications/Abstractions/NotificationRequest.cs`
- Create: `src/Oksis.Application/Modules/Notifications/Abstractions/INotificationChannel.cs`
- Create: `src/Oksis.Application/Modules/Notifications/Abstractions/INotificationDispatcher.cs`
- Create: `src/Oksis.Application/Modules/Notifications/Abstractions/INotificationRecipientResolver.cs`

- [ ] **Step 1: Port tiplerini yaz**

```csharp
// NotificationMessage.cs
using Oksis.Domain.Modules.Notifications.Enums;
namespace Oksis.Application.Modules.Notifications.Abstractions;

public sealed record NotificationMessage(
    NotificationKind Kind,
    string Title,
    string Body,
    string? DeepLink);
```

```csharp
// NotificationRequest.cs
namespace Oksis.Application.Modules.Notifications.Abstractions;

/// <summary>Tek bir bildirim niyeti: bir mesaj + alıcı account id kümesi + idempotency anahtarı (event id).</summary>
public sealed record NotificationRequest(
    Guid EventId,
    Guid SchoolId,
    IReadOnlyList<Guid> RecipientAccountIds,
    NotificationMessage Message);
```

```csharp
// INotificationChannel.cs
namespace Oksis.Application.Modules.Notifications.Abstractions;

public interface INotificationChannel
{
    string Name { get; } // "in-app"
    Task SendAsync(Guid eventId, Guid recipientAccountId, NotificationMessage message, CancellationToken ct);
}
```

```csharp
// INotificationDispatcher.cs
namespace Oksis.Application.Modules.Notifications.Abstractions;

public interface INotificationDispatcher
{
    Task DispatchAsync(NotificationRequest request, CancellationToken ct);
}
```

```csharp
// INotificationRecipientResolver.cs
namespace Oksis.Application.Modules.Notifications.Abstractions;

/// <summary>Şube/öğretmen kapsamından login Account.Id kümesi üretir (Person.LinkedAccountId üzerinden).</summary>
public interface INotificationRecipientResolver
{
    Task<IReadOnlyList<Guid>> ResolveBranchConsumersAsync(Guid schoolId, Guid branchId, CancellationToken ct);
    Task<Guid?> ResolveTeacherAccountAsync(Guid schoolId, Guid teacherPersonId, CancellationToken ct);
}
```

- [ ] **Step 2: Derleme**

Run: `dotnet build Oksis.slnx --no-restore`
Expected: 0 error.

- [ ] **Step 3: Commit**

```bash
git add src/Oksis.Application/Modules/Notifications/Abstractions
git commit -m "2026-06-15 feat: Bildirim — Application port'ları (dispatcher/channel/resolver/message)."
```

---

## Task B2: `NotificationRecipientResolver` impl (+test)

**Files:**
- Create: `src/Oksis.Infrastructure/Notifications/NotificationRecipientResolver.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Notifications/NotificationRecipientResolverTests.cs`

> Resolver Infrastructure'da çünkü `IApplicationDbContext` üzerinden çoklu modül tablosuna (Persons/Profiles/ParentStudentRelationships) erişir. Test, `IApplicationDbContext`'i MockQueryable ile besler.

- [ ] **Step 1: Failing test yaz**

```csharp
// NotificationRecipientResolverTests.cs
[Fact]
public async Task ResolveBranchConsumers_returns_student_and_parent_account_ids()
{
    var schoolId = Guid.NewGuid();
    var branchId = Guid.NewGuid();
    var studentPerson = Guid.NewGuid();
    var studentAccount = Guid.NewGuid();
    var parentPerson = Guid.NewGuid();
    var parentAccount = Guid.NewGuid();

    var persons = new[]
    {
        MakePerson(studentPerson, schoolId, studentAccount),
        MakePerson(parentPerson, schoolId, parentAccount),
    };
    var profiles = new[] { MakeStudentProfile(studentPerson, branchId, active: true) };
    var rels = new[] { MakeParentRel(schoolId, parentPerson, studentPerson, revoked: false) };

    var db = BuildDb(persons, profiles, rels);
    var sut = new NotificationRecipientResolver(db);

    var result = await sut.ResolveBranchConsumersAsync(schoolId, branchId, CancellationToken.None);

    result.Should().BeEquivalentTo(new[] { studentAccount, parentAccount });
}

[Fact]
public async Task ResolveBranchConsumers_skips_persons_without_linked_account()
{
    // LinkedAccountId == null olan öğrenci elenir
}

[Fact]
public async Task ResolveBranchConsumers_skips_revoked_parent_relationships() { }

[Fact]
public async Task ResolveTeacherAccount_maps_person_to_linked_account() { }
```
> `MakePerson`/`MakeStudentProfile`/`MakeParentRel`/`BuildDb` helper'ları: mevcut `PublishedScheduleQueryHandlerTests` veya benzeri test fixture desenini izle (NSubstitute + MockQueryable `.Returns(BuildMockDbSet())` — **inline kırılır, önce değişkene al**).

- [ ] **Step 2: Testi çalıştır, fail gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~NotificationRecipientResolverTests"`
Expected: FAIL — sınıf yok.

- [ ] **Step 3: Resolver'ı yaz**

```csharp
// NotificationRecipientResolver.cs
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Notifications.Abstractions;
using Oksis.Domain.Modules.Users.Entities;

namespace Oksis.Infrastructure.Notifications;

public sealed class NotificationRecipientResolver(IApplicationDbContext db) : INotificationRecipientResolver
{
    public async Task<IReadOnlyList<Guid>> ResolveBranchConsumersAsync(Guid schoolId, Guid branchId, CancellationToken ct)
    {
        // 1) şubedeki aktif öğrenci PersonId'leri
        var studentPersonIds = await db.Profiles.OfType<StudentProfile>().AsNoTracking()
            .Where(sp => sp.CurrentClassroomId == branchId && sp.IsActiveStudent)
            .Select(sp => sp.PersonId)
            .ToListAsync(ct);

        // 2) öğrenci hesapları
        var studentAccounts = await db.Persons.AsNoTracking()
            .Where(p => studentPersonIds.Contains(p.Id) && p.LinkedAccountId != null)
            .Select(p => p.LinkedAccountId!.Value)
            .ToListAsync(ct);

        // 3) veli PersonId'leri (aktif ilişki)
        var parentPersonIds = await db.ParentStudentRelationships.AsNoTracking()
            .Where(r => r.RevokedAt == null && studentPersonIds.Contains(r.StudentPersonId))
            .Select(r => r.ParentPersonId)
            .Distinct()
            .ToListAsync(ct);

        // 4) veli hesapları
        var parentAccounts = await db.Persons.AsNoTracking()
            .Where(p => parentPersonIds.Contains(p.Id) && p.LinkedAccountId != null)
            .Select(p => p.LinkedAccountId!.Value)
            .ToListAsync(ct);

        return studentAccounts.Concat(parentAccounts).Distinct().ToList();
    }

    public async Task<Guid?> ResolveTeacherAccountAsync(Guid schoolId, Guid teacherPersonId, CancellationToken ct)
    {
        return await db.Persons.AsNoTracking()
            .Where(p => p.Id == teacherPersonId && p.LinkedAccountId != null)
            .Select(p => (Guid?)p.LinkedAccountId!.Value)
            .FirstOrDefaultAsync(ct);
    }
}
```
> `db.Persons`/`db.Profiles`/`db.ParentStudentRelationships` `IApplicationDbContext`'te zaten var (consumer sorguları kullanıyor); yoksa interface'e ekle.

- [ ] **Step 4: Testi çalıştır, pass gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~NotificationRecipientResolverTests"`
Expected: PASS (4 test).

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Infrastructure/Notifications/NotificationRecipientResolver.cs tests/Oksis.Application.UnitTests/Modules/Notifications
git commit -m "2026-06-15 feat,test: Bildirim — recipient resolver (şube öğrenci+veli & öğretmen → Account.Id)."
```

---

## Task B3: `NotificationHub` (SignalR) + mapping

**Files:**
- Create: `src/Oksis.Api/Hubs/NotificationHub.cs`
- Modify: `src/Oksis.Api/Program.cs` (`MapHub`)

- [ ] **Step 1: Hub'ı yaz** (SessionHub deseni birebir)

```csharp
// NotificationHub.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Oksis.Api.Hubs;

[Authorize]
public sealed class NotificationHub : Hub
{
    public const string ReceiveMethod = "ReceiveNotification";

    public static string GroupName(Guid schoolId, Guid accountId) => $"{schoolId}:{accountId}";

    public override async Task OnConnectedAsync()
    {
        var group = TryGetGroupName();
        if (group is not null)
            await Groups.AddToGroupAsync(Context.ConnectionId, group);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var group = TryGetGroupName();
        if (group is not null)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, group);
        await base.OnDisconnectedAsync(exception);
    }

    private string? TryGetGroupName()
    {
        var user = Context.User;
        var schoolRaw = user?.FindFirstValue("school_id");
        var accountRaw = user?.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? user?.FindFirstValue("sub")
            ?? user?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(schoolRaw, out var schoolId) && Guid.TryParse(accountRaw, out var accountId))
            return GroupName(schoolId, accountId);
        return null;
    }
}
```

- [ ] **Step 2: MapHub ekle**

`Program.cs` `MapHub<SessionHub>` satırının yanına:
```csharp
app.MapHub<Oksis.Api.Hubs.NotificationHub>("/hubs/notifications");
```

- [ ] **Step 3: Derleme + commit**

Run: `dotnet build Oksis.slnx --no-restore` → 0 error.
```bash
git add src/Oksis.Api/Hubs/NotificationHub.cs src/Oksis.Api/Program.cs
git commit -m "2026-06-15 feat: Bildirim — NotificationHub (SignalR, grup {schoolId}:{accountId}) + /hubs/notifications."
```

---

## Task B4: `InAppNotificationChannel` (DB satırı + SignalR push)

**Files:**
- Create: `src/Oksis.Infrastructure/Notifications/InAppNotificationChannel.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Notifications/InAppNotificationChannelTests.cs`

> SignalR push, `IHubContext<NotificationHub>` ile yapılır. Channel Api projesindeki Hub'a Infrastructure'dan erişemez (katman yönü). **Çözüm:** Hub tipine bağımlılığı kırmak için Application'da `INotificationRealtimePusher` portu tanımla, Api'de `IHubContext<NotificationHub>` ile implemente et.

- [ ] **Step 1: Realtime pusher portu (Application) + Api impl**

Create `src/Oksis.Application/Modules/Notifications/Abstractions/INotificationRealtimePusher.cs`:
```csharp
namespace Oksis.Application.Modules.Notifications.Abstractions;

public interface INotificationRealtimePusher
{
    Task PushAsync(Guid schoolId, Guid accountId, object payload, CancellationToken ct);
}
```

Create `src/Oksis.Api/Hubs/SignalRNotificationPusher.cs`:
```csharp
using Microsoft.AspNetCore.SignalR;
using Oksis.Application.Modules.Notifications.Abstractions;

namespace Oksis.Api.Hubs;

public sealed class SignalRNotificationPusher(IHubContext<NotificationHub> hub) : INotificationRealtimePusher
{
    public Task PushAsync(Guid schoolId, Guid accountId, object payload, CancellationToken ct)
        => hub.Clients.Group(NotificationHub.GroupName(schoolId, accountId))
              .SendAsync(NotificationHub.ReceiveMethod, payload, ct);
}
```
Register in `Program.cs`: `builder.Services.AddScoped<INotificationRealtimePusher, SignalRNotificationPusher>();`

- [ ] **Step 2: Channel'ı yaz**

```csharp
// InAppNotificationChannel.cs
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Notifications.Abstractions;
using Oksis.Domain.Modules.Notifications.Entities;

namespace Oksis.Infrastructure.Notifications;

public sealed class InAppNotificationChannel(
    IApplicationDbContext db,
    INotificationRealtimePusher pusher,
    ITenantContextReader tenant) : INotificationChannel
{
    public string Name => "in-app";

    public async Task SendAsync(Guid eventId, Guid recipientAccountId, NotificationMessage message, CancellationToken ct)
    {
        var schoolId = tenant.CurrentSchoolId ?? throw new InvalidOperationException("Tenant yok.");

        var notification = Notification.Create(recipientAccountId, message.Kind, message.Title, message.Body, message.DeepLink);
        db.Notifications.Add(notification);
        await db.SaveChangesAsync(ct); // SchoolId TenantSaveChangesInterceptor tarafından doldurulur

        var payload = new
        {
            id = notification.Id,
            kind = message.Kind.ToString(),
            title = message.Title,
            body = message.Body,
            deepLink = message.DeepLink,
            createdAt = notification.CreatedAt,
        };
        await pusher.PushAsync(schoolId, recipientAccountId, payload, ct);
    }
}
```
> `ITenantContextReader` = mevcut `ITenantContext`'in `CurrentSchoolId` okuyan yüzü; mevcut arayüzü kullan (Infrastructure `TenantContext`). İsim uyumunu uygulama anında doğrula.

- [ ] **Step 3: Integration test**

```csharp
[Fact]
public async Task SendAsync_persists_notification_row_for_recipient()
{
    var pusher = Substitute.For<INotificationRealtimePusher>();
    SetTenant(schoolId); // fixture helper: tenant context schoolId
    var sut = new InAppNotificationChannel(Db, pusher, TenantReader);
    var account = Guid.NewGuid();

    await sut.SendAsync(Guid.NewGuid(), account,
        new NotificationMessage(NotificationKind.TimetablePublished, "t", "b", "/x"), CancellationToken.None);

    (await Db.Notifications.CountAsync(n => n.RecipientAccountId == account)).Should().Be(1);
    await pusher.Received(1).PushAsync(schoolId, account, Arg.Any<object>(), Arg.Any<CancellationToken>());
}
```

Run: `ASPNETCORE_ENVIRONMENT=Mac-Development dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~InAppNotificationChannelTests"`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "2026-06-15 feat,test: Bildirim — InAppNotificationChannel (DB satırı + SignalR push) + realtime pusher portu."
```

---

## Task B5: `NotificationDispatcher` (idempotency + çok alıcı) (+test)

**Files:**
- Create: `src/Oksis.Infrastructure/Notifications/NotificationDispatcher.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Notifications/NotificationDispatcherTests.cs`

- [ ] **Step 1: Failing test**

```csharp
[Fact]
public async Task Dispatch_writes_one_notification_per_recipient_and_logs_delivery()
{
    var a1 = Guid.NewGuid(); var a2 = Guid.NewGuid();
    var req = new NotificationRequest(Guid.NewGuid(), schoolId, new[] { a1, a2 },
        new NotificationMessage(NotificationKind.TimetablePublished, "t", "b", "/x"));

    await Dispatcher.DispatchAsync(req, default);

    (await Db.Notifications.CountAsync()).Should().Be(2);
    (await Db.NotificationDeliveryLogs.CountAsync()).Should().Be(2);
}

[Fact]
public async Task Dispatch_is_idempotent_for_same_event_and_recipient()
{
    var eventId = Guid.NewGuid(); var a1 = Guid.NewGuid();
    var req = new NotificationRequest(eventId, schoolId, new[] { a1 },
        new NotificationMessage(NotificationKind.TimetablePublished, "t", "b", null));

    await Dispatcher.DispatchAsync(req, default);
    await Dispatcher.DispatchAsync(req, default); // tekrar — atlanır

    (await Db.Notifications.CountAsync(n => n.RecipientAccountId == a1)).Should().Be(1);
}
```

- [ ] **Step 2: Testi çalıştır, fail gör** → FAIL.

- [ ] **Step 3: Dispatcher'ı yaz**

```csharp
// NotificationDispatcher.cs
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Notifications.Abstractions;
using Oksis.Domain.Modules.Notifications.Entities;

namespace Oksis.Infrastructure.Notifications;

public sealed class NotificationDispatcher(
    IApplicationDbContext db,
    IEnumerable<INotificationChannel> channels) : INotificationDispatcher
{
    public async Task DispatchAsync(NotificationRequest request, CancellationToken ct)
    {
        foreach (var channel in channels)
        {
            foreach (var accountId in request.RecipientAccountIds.Distinct())
            {
                // idempotency: bu event+alıcı+kanal daha önce teslim edildiyse atla
                var already = await db.NotificationDeliveryLogs.AsNoTracking()
                    .AnyAsync(l => l.EventId == request.EventId
                                && l.RecipientAccountId == accountId
                                && l.Channel == channel.Name, ct);
                if (already) continue;

                await channel.SendAsync(request.EventId, accountId, request.Message, ct);

                db.NotificationDeliveryLogs.Add(
                    NotificationDeliveryLog.Create(request.EventId, accountId, channel.Name, DateTimeOffset.UtcNow));
                await db.SaveChangesAsync(ct);
            }
        }
    }
}
```
> Yarış durumunda DB unique index (Task A2) son savunma; `DbUpdateException` yakalanıp atlanabilir (sertleştirme — şimdilik AnyAsync yeterli, çift teslim nadirdir). Bunu Debt-N6 olarak not et.

- [ ] **Step 4: Pass + commit**

Run: `ASPNETCORE_ENVIRONMENT=Mac-Development dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~NotificationDispatcherTests"` → PASS.
```bash
git add -A
git commit -m "2026-06-15 feat,test: Bildirim — NotificationDispatcher (alıcı başına teslim + idempotency log)."
```

---

## Task B6: `DispatchNotificationJob` (Hangfire) + DI

**Files:**
- Create: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/DispatchNotificationJob.cs`
- Modify: `src/Oksis.Infrastructure/DependencyInjection.cs`

> Job, event handler'ından çağrılan tek giriş noktası. Tenant context'i set eder (HTTP yok), sonra dispatcher'ı çağırır. Argümanlar Hangfire ile serialize edilebilir olmalı (primitive + Guid + string).

- [ ] **Step 1: Job'ı yaz**

```csharp
// DispatchNotificationJob.cs
using Microsoft.Extensions.Logging;
using Oksis.Application.Modules.Notifications.Abstractions;
using Oksis.Domain.Modules.Notifications.Enums;
using Oksis.Infrastructure.Identity;

namespace Oksis.Infrastructure.BackgroundJobs.Jobs;

public sealed class DispatchNotificationJob(
    INotificationDispatcher dispatcher,
    ITenantContext tenantContext,
    ILogger<DispatchNotificationJob> logger)
{
    public async Task RunAsync(
        Guid eventId, Guid schoolId, NotificationKind kind,
        string title, string body, string? deepLink,
        Guid[] recipientAccountIds, CancellationToken ct)
    {
        if (recipientAccountIds.Length == 0) return;
        tenantContext.SetForLoginFlow(schoolId); // EF query filter + interceptor bağlamı

        var request = new NotificationRequest(eventId, schoolId, recipientAccountIds,
            new NotificationMessage(kind, title, body, deepLink));

        await dispatcher.DispatchAsync(request, ct);
        logger.LogInformation("Notification dispatched {EventId} kind {Kind} to {Count} accounts",
            eventId, kind, recipientAccountIds.Length);
    }
}
```

- [ ] **Step 2: DI kayıtları**

`DependencyInjection.cs` (Invitation deseninin yanına):
```csharp
services.AddScoped<INotificationRecipientResolver, Notifications.NotificationRecipientResolver>();
services.AddScoped<INotificationChannel, Notifications.InAppNotificationChannel>();
services.AddScoped<INotificationDispatcher, Notifications.NotificationDispatcher>();
services.AddTransient<BackgroundJobs.Jobs.DispatchNotificationJob>();
```

- [ ] **Step 3: Derleme + commit**

Run: `dotnet build Oksis.slnx --no-restore` → 0 error.
```bash
git add -A
git commit -m "2026-06-15 feat: Bildirim — DispatchNotificationJob (Hangfire, tenant set) + DI kayıtları."
```

---

# BÖLÜM C — BE: Event Handler'ları (5 event, 4 bildirir)

> Her handler `INotificationHandler<DomainEventNotification<TEvent>>`; recipient resolver ile alıcıları bulur, `IBackgroundJobClient.Enqueue<DispatchNotificationJob>` ile job kuyruğa atar. Content TR (i18n çok-dil Debt). Handler'lar `src/Oksis.Application/Modules/Timetable/Events/Notifications/` altında.

## Task C1: `ScheduleProgramPublished` handler (v1 tüm şube / vN diff) (+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/Events/Notifications/SchedulePublishedNotificationHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Timetable/Notifications/SchedulePublishedNotificationHandlerTests.cs`

- [ ] **Step 1: Failing test**

```csharp
[Fact]
public async Task Publish_v1_enqueues_dispatch_for_all_branch_consumers()
{
    var ev = new ScheduleProgramPublishedEvent(schoolId, programId, branchId, termId,
        Version: 1, PlacementCount: 10, PublishedBy: Guid.NewGuid());
    resolver.ResolveBranchConsumersAsync(schoolId, branchId, Arg.Any<CancellationToken>())
        .Returns(new[] { acc1, acc2 });

    await handler.Handle(new DomainEventNotification<ScheduleProgramPublishedEvent>(ev), default);

    jobs.Received(1).Enqueue(Arg.Any<Expression<Func<DispatchNotificationJob, Task>>>());
}

[Fact]
public async Task Publish_with_no_recipients_does_not_enqueue() { /* boş resolver → Enqueue çağrılmaz */ }
```
> Hangfire `IBackgroundJobClient.Enqueue` expression-based; doğrulama "çağrıldı mı" düzeyinde (Davet testindeki gibi). vN diff hedefleme detayını C1b'de ayır (aşağıda not).

- [ ] **Step 2: Fail gör** → FAIL.

- [ ] **Step 3: Handler'ı yaz**

```csharp
// SchedulePublishedNotificationHandler.cs
using System.Linq.Expressions;
using Hangfire;
using MediatR;
using Oksis.Application.Common.Events;
using Oksis.Application.Modules.Notifications.Abstractions;
using Oksis.Domain.Modules.Notifications.Enums;
using Oksis.Domain.Modules.Timetable.Events;
using Oksis.Infrastructure.BackgroundJobs.Jobs; // veya job referansı Application'a taşınmışsa oradan

namespace Oksis.Application.Modules.Timetable.Events.Notifications;

public sealed class SchedulePublishedNotificationHandler(
    INotificationRecipientResolver resolver,
    IBackgroundJobClient jobs)
    : INotificationHandler<DomainEventNotification<ScheduleProgramPublishedEvent>>
{
    public async Task Handle(DomainEventNotification<ScheduleProgramPublishedEvent> n, CancellationToken ct)
    {
        var e = n.DomainEvent;
        var recipients = await resolver.ResolveBranchConsumersAsync(e.SchoolId, e.BranchId, ct);
        if (recipients.Count == 0) return;

        var title = e.Version == 1 ? "📅 Ders programı yayınlandı" : "📅 Ders programınızda güncelleme var";
        var body = e.Version == 1 ? "Haftalık programınız hazır." : "Programınızda değişiklik yapıldı.";

        jobs.Enqueue<DispatchNotificationJob>(job => job.RunAsync(
            e.ProgramId, e.SchoolId, NotificationKind.TimetablePublished,
            title, body, "/schedule", recipients.ToArray(), CancellationToken.None));
    }
}
```
> **EventId seçimi:** idempotency anahtarı olarak event başına stabil bir id gerekir. `ProgramId` + `Version` kombinasyonu tek yayını temsil eder; ama `NotificationRequest.EventId` tek Guid. **Karar:** `EventId = deterministic GUID(ProgramId, Version)` — veya basitçe her yayın için domain event'e `EventId` alanı ekle. **Bu plana not (RİSK):** Mevcut event'lerde stabil bir EventId yok; `ProgramId` tek başına tekrar-yayında idempotency'yi YANLIŞ tetikler (ikinci yayın atlanır). **Çözüm:** `DispatchNotificationJob`'a geçilen idempotency anahtarı `ProgramId` değil **`Guid.NewGuid()` her handler tetiklenişinde** OLMAMALI (o zaman idempotency anlamsız). Doğru: handler `eventId = Deterministic(ProgramId, Version)` üretir. Uygulamada `GuidUtil.Combine(programId, version)` helper'ı yaz (Task C0).

> **Mimari bağımlılık notu:** Handler Application'da ama `DispatchNotificationJob` Infrastructure'da → ters bağımlılık. **Çözüm:** Job referansını handler'ın `Enqueue<TJob>` generic'i için Application'ın Infrastructure'a referansı olmadığından, ya (a) job tipini Application'a taşı, ya (b) handler'ı Infrastructure'a koy. **Karar:** Davet pattern'inde sender Application abstraction, job Infrastructure. Aynı deseni izle: `INotificationEnqueuer` portu (Application) tanımla, Infrastructure'da `Enqueue<DispatchNotificationJob>` ile implemente et. Handler `INotificationEnqueuer` çağırır. **Bunu Task C0'da kur.**

- [ ] **Step 4: Pass + commit** (Task C0 tamamlandıktan sonra)

---

## Task C0: `INotificationEnqueuer` portu + GuidUtil (önkoşul — C1'den önce yapılır)

**Files:**
- Create: `src/Oksis.Application/Modules/Notifications/Abstractions/INotificationEnqueuer.cs`
- Create: `src/Oksis.Application/Common/Utilities/DeterministicGuid.cs`
- Create: `src/Oksis.Infrastructure/Notifications/HangfireNotificationEnqueuer.cs`
- Test: `tests/Oksis.Application.UnitTests/Common/DeterministicGuidTests.cs`

- [ ] **Step 1: Port + util + impl**

```csharp
// INotificationEnqueuer.cs
using Oksis.Domain.Modules.Notifications.Enums;
namespace Oksis.Application.Modules.Notifications.Abstractions;

public interface INotificationEnqueuer
{
    void Enqueue(Guid eventId, Guid schoolId, NotificationKind kind,
        string title, string body, string? deepLink, IReadOnlyList<Guid> recipientAccountIds);
}
```

```csharp
// DeterministicGuid.cs — (input1,input2) → stabil Guid (idempotency anahtarı)
using System.Security.Cryptography;
using System.Text;
namespace Oksis.Application.Common.Utilities;

public static class DeterministicGuid
{
    public static Guid Combine(params object[] parts)
    {
        var raw = string.Join("|", parts);
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(raw));
        return new Guid(hash);
    }
}
```

```csharp
// HangfireNotificationEnqueuer.cs
using Hangfire;
using Oksis.Application.Modules.Notifications.Abstractions;
using Oksis.Domain.Modules.Notifications.Enums;
using Oksis.Infrastructure.BackgroundJobs.Jobs;

namespace Oksis.Infrastructure.Notifications;

public sealed class HangfireNotificationEnqueuer(IBackgroundJobClient jobs) : INotificationEnqueuer
{
    public void Enqueue(Guid eventId, Guid schoolId, NotificationKind kind,
        string title, string body, string? deepLink, IReadOnlyList<Guid> recipientAccountIds)
    {
        jobs.Enqueue<DispatchNotificationJob>(job => job.RunAsync(
            eventId, schoolId, kind, title, body, deepLink, recipientAccountIds.ToArray(), CancellationToken.None));
    }
}
```
DI: `services.AddScoped<INotificationEnqueuer, Notifications.HangfireNotificationEnqueuer>();`

- [ ] **Step 2: DeterministicGuid test**

```csharp
[Fact]
public void Combine_is_stable_for_same_input()
{
    var id = Guid.NewGuid();
    DeterministicGuid.Combine(id, 1).Should().Be(DeterministicGuid.Combine(id, 1));
    DeterministicGuid.Combine(id, 1).Should().NotBe(DeterministicGuid.Combine(id, 2));
}
```

- [ ] **Step 3: Pass + commit**

```bash
git add -A
git commit -m "2026-06-15 feat,test: Bildirim — INotificationEnqueuer portu (Hangfire) + DeterministicGuid idempotency anahtarı."
```

> **C1 handler güncellemesi:** `IBackgroundJobClient` yerine `INotificationEnqueuer` enjekte; `eventId = DeterministicGuid.Combine(e.ProgramId, e.Version)`. Handler artık Infrastructure'a bağımlı değil. C1 test'i `INotificationEnqueuer` mock'lar (`enqueuer.Received(1).Enqueue(...)`).

---

## Task C2: `ScheduleExceptionCreated` handler (+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Timetable/Events/Notifications/ScheduleExceptionCreatedNotificationHandler.cs`
- Test: `.../ScheduleExceptionCreatedNotificationHandlerTests.cs`

Alıcılar: şube tüketicileri (`ResolveBranchConsumersAsync`) + asıl öğretmen (`OriginalTeacherId`) + varsa vekil (`NewTeacherId`). Kind: `Type == Cancellation ? TimetableCancelled : TimetableException`. EventId: `DeterministicGuid.Combine(ExceptionId, "created")`.

- [ ] **Step 1: Failing test** (şube + iki öğretmen account birleşik küme; Cancellation → TimetableCancelled kind)
- [ ] **Step 2: Fail gör**
- [ ] **Step 3: Handler'ı yaz** (resolver şube + `ResolveTeacherAccountAsync(OriginalTeacherId)` + `NewTeacherId` varsa; HashSet birleştir)
- [ ] **Step 4: Pass**
- [ ] **Step 5: Commit** — `2026-06-15 feat,test: Bildirim — geçici değişiklik (vekalet/iptal/derslik) handler → fan-out.`

---

## Task C3: `ScheduleExceptionRevoked` handler (+test)

**Files:**
- Create: `.../ScheduleExceptionRevokedNotificationHandler.cs` + test

Alıcılar: şube tüketicileri (revoke'da hangi öğretmen olduğu event'te tam yok — `ScheduleExceptionRevokedEvent` yalnız `SchoolId, ExceptionId, ProgramId, BranchId, Date, Type` taşır → şube tüketicileri yeterli). Kind: `TimetableExceptionRevoked`. EventId: `Combine(ExceptionId, "revoked")`.

- [ ] Steps 1-5 (C2 ile aynı iskelet) — Commit: `2026-06-15 feat,test: Bildirim — geçici değişiklik geri-al handler → fan-out.`

---

## Task C4: `ScheduleProgramDeleted` handler (+test)

**Files:**
- Create: `.../ScheduleProgramDeletedNotificationHandler.cs` + test

Alıcılar: şube tüketicileri. Kind: `TimetableProgramDeleted`. Title "📅 Ders programı kaldırıldı". EventId: `Combine(ProgramId, "deleted", Version)`.

- [ ] Steps 1-5 — Commit: `2026-06-15 feat,test: Bildirim — program silme handler → fan-out (Debt-BE-8 kapanışı).`

> **Restored:** handler YOK (sessiz — tasarım §4). Bu task'ta sadece doğrula: `ScheduleProgramRestoredEvent` için handler yazılmadığını teyit et, completion_status'a "Restored sessiz" not düş.

---

# BÖLÜM D — BE: Bildirim API (self-scope)

## Task D1: Sorgular + komutlar + controller (+test)

**Files:**
- Create: `src/Oksis.Application/Modules/Notifications/Queries/GetMyNotifications/*` (query+handler+dto+validator)
- Create: `src/Oksis.Application/Modules/Notifications/Queries/GetMyUnreadCount/*`
- Create: `src/Oksis.Application/Modules/Notifications/Commands/MarkNotificationRead/*`
- Create: `src/Oksis.Application/Modules/Notifications/Commands/MarkAllNotificationsRead/*`
- Create: `src/Oksis.Api/Controllers/NotificationsController.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Notifications/GetMyNotificationsHandlerTests.cs`, `MarkNotificationReadHandlerTests.cs`

> Tümü self-scope: handler `ICurrentUser.Id` (= Account.Id) ile `RecipientAccountId == currentUser.Id` filtreler. IDOR: başka kullanıcının bildirimi okunamaz/işaretlenemez.

- [ ] **Step 1: GetMyNotifications query + handler + test**

```csharp
public sealed record GetMyNotificationsQuery(bool UnreadOnly, int Page, int PageSize) : IRequest<Result<PagedResult<NotificationDto>>>;
```
Handler:
```csharp
var q = db.Notifications.AsNoTracking().Where(n => n.RecipientAccountId == currentUser.Id);
if (request.UnreadOnly) q = q.Where(n => !n.IsRead);
q = q.OrderByDescending(n => n.CreatedAt);
// paged projection → NotificationDto (Id, Kind, Title, Body, DeepLink, IsRead, CreatedAt)
```
Test: iki bildirim seed; sadece current account'unkiler döner; unreadOnly filtreler; sayfalama doğru.

- [ ] **Step 2: GetMyUnreadCount + test** — `CountAsync(n => n.RecipientAccountId == currentUser.Id && !n.IsRead)`.

- [ ] **Step 3: MarkNotificationRead command + test**

```csharp
var n = await db.Notifications.FirstOrDefaultAsync(x => x.Id == request.Id && x.RecipientAccountId == currentUser.Id, ct);
if (n is null) return Result.NotFound(); // başka kullanıcınınki → NotFound (IDOR yok)
n.MarkAsRead(DateTimeOffset.UtcNow);
await db.SaveChangesAsync(ct);
```
Test: kendi bildirimini okur (IsRead true); başkasınınki → NotFound, değişmez.

- [ ] **Step 4: MarkAllNotificationsRead + test** — current account'un tüm okunmamışlarını bulk `MarkAsRead`.

- [ ] **Step 5: Controller**

```csharp
[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public sealed class NotificationsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool unreadOnly = false, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        => Ok(await sender.Send(new GetMyNotificationsQuery(unreadOnly, page, pageSize)));

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount() => Ok(await sender.Send(new GetMyUnreadCountQuery()));

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id) => Ok(await sender.Send(new MarkNotificationReadCommand(id)));

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead() => Ok(await sender.Send(new MarkAllNotificationsReadCommand()));
}
```
> Result→HTTP dönüşümü mevcut controller deseniyle hizala (ör. `Result` extension `.ToActionResult()` varsa onu kullan).

- [ ] **Step 6: Tüm BE testleri + commit**

Run: `cd oksis-api && dotnet test --filter "FullyQualifiedName~Notifications"` → tüm yeşil.
Run: `dotnet build Oksis.slnx --no-restore` → 0 error.
```bash
git add -A
git commit -m "2026-06-15 feat,test: Bildirim — API (list/unread-count/read/read-all, self-scope IDOR korumalı)."
```

---

# BÖLÜM E — FE: Bildirim Modülü + SignalR + Zil

## Task E1: `@microsoft/signalr` kur

- [ ] **Step 1:** `cd oksis-web && npm install @microsoft/signalr`
- [ ] **Step 2:** `npm run build` → temiz.
- [ ] **Step 3:** Commit: `2026-06-15 chore: @microsoft/signalr eklendi (bildirim realtime — kullanıcı onaylı).`

---

## Task E2: notifications modülü (types/keys/api/hooks)

**Files:** (timetable consumer modülü deseni — `src/modules/timetable/`)
- Create: `src/modules/notifications/types.ts`
- Create: `src/modules/notifications/keys.ts`
- Create: `src/modules/notifications/api/notificationsApi.ts`
- Create: `src/modules/notifications/hooks.ts`
- Create: `src/modules/notifications/index.ts`

- [ ] **Step 1: types.ts**

```typescript
export type NotificationKind =
  | 'TimetablePublished' | 'TimetableException' | 'TimetableCancelled'
  | 'TimetableExceptionRevoked' | 'TimetableProgramDeleted';

export interface NotificationDto {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  deepLink: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PagedNotificationsDto {
  items: NotificationDto[];
  total: number;
  page: number;
  pageSize: number;
}
```

- [ ] **Step 2: keys.ts** (tenant-scoped, timetable deseni)

```typescript
export const notificationKeys = {
  all: (schoolId: string | undefined) => ['notifications', schoolId ?? 'anonymous'] as const,
  list: (schoolId: string | undefined, unreadOnly: boolean) =>
    [...notificationKeys.all(schoolId), 'list', unreadOnly] as const,
  unreadCount: (schoolId: string | undefined) =>
    [...notificationKeys.all(schoolId), 'unread-count'] as const,
};
```

- [ ] **Step 3: api/notificationsApi.ts** (httpClient zarfı `res.data.data`)

```typescript
import { httpClient } from '../../../shared/api/httpClient';
import type { PagedNotificationsDto } from '../types';

interface Envelope<T> { data: T; }

export const notificationsApi = {
  list: async (unreadOnly: boolean, signal?: AbortSignal): Promise<PagedNotificationsDto> => {
    const res = await httpClient.get<Envelope<PagedNotificationsDto>>('/notifications', {
      params: { unreadOnly }, signal,
    });
    return res.data.data;
  },
  unreadCount: async (signal?: AbortSignal): Promise<number> => {
    const res = await httpClient.get<Envelope<number>>('/notifications/unread-count', { signal });
    return res.data.data;
  },
  markRead: async (id: string): Promise<void> => { await httpClient.post(`/notifications/${id}/read`); },
  markAllRead: async (): Promise<void> => { await httpClient.post('/notifications/read-all'); },
};
```

- [ ] **Step 4: hooks.ts** (useQuery + useMutation, invalidate)

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../shared/store/authStore';
import { notificationKeys } from './keys';
import { notificationsApi } from './api/notificationsApi';

function useScope() {
  return useAuthStore((s) => s.user?.schoolId ?? s.user?.id);
}

export function useNotifications(unreadOnly = false) {
  const scope = useScope();
  return useQuery({
    queryKey: notificationKeys.list(scope, unreadOnly),
    queryFn: ({ signal }) => notificationsApi.list(unreadOnly, signal),
    staleTime: 15_000,
  });
}

export function useUnreadCount() {
  const scope = useScope();
  return useQuery({
    queryKey: notificationKeys.unreadCount(scope),
    queryFn: ({ signal }) => notificationsApi.unreadCount(signal),
    staleTime: 15_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: notificationKeys.all(scope) }); },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  const scope = useScope();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: notificationKeys.all(scope) }); },
  });
}
```

- [ ] **Step 5: index.ts** (named export'lar) + **Commit**

```bash
git add src/modules/notifications
git commit -m "2026-06-15 feat: Bildirim web — notifications modülü (types/keys/api/hooks, tenant-scope)."
```

---

## Task E3: SignalR client (notification connection)

**Files:**
- Create: `src/modules/notifications/signalrClient.ts`
- Create: `src/modules/notifications/useNotificationSocket.ts`

- [ ] **Step 1: Connection factory**

```typescript
// signalrClient.ts
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { useAuthStore } from '../../shared/store/authStore';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const HUB_URL = BASE.replace(/\/api\/v1$/, '') + '/hubs/notifications';

export function buildNotificationConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: () => useAuthStore.getState().accessToken ?? '' })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
```

- [ ] **Step 2: Hook — bağlan, dinle, cache invalidate**

```typescript
// useNotificationSocket.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../shared/store/authStore';
import { notificationKeys } from './keys';
import { buildNotificationConnection } from './signalrClient';

export function useNotificationSocket() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const scope = useAuthStore((s) => s.user?.schoolId ?? s.user?.id);

  useEffect(() => {
    if (!token) return;
    const conn = buildNotificationConnection();
    conn.on('ReceiveNotification', () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all(scope) });
    });
    void conn.start().catch(() => { /* sessiz — polling fallback staleTime ile */ });
    return () => { void conn.stop(); };
  }, [token, scope, qc]);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/notifications/signalrClient.ts src/modules/notifications/useNotificationSocket.ts
git commit -m "2026-06-15 feat: Bildirim web — SignalR client (notification hub) + canlı cache invalidation."
```

---

## Task E4: `NotificationBell` — mevcut placeholder'ı gerçek veriye bağla

**Files:**
- Modify/Replace: `src/app/components/shell/NotificationMenu.tsx` → gerçek hooks (mock veriyi kaldır)
- Test: `src/app/components/shell/__tests__/NotificationMenu.test.tsx`

- [ ] **Step 1: Failing test (mock hooks)**

```typescript
// timetable consumer test deseni (vi.hoisted + vi.mock)
const h = vi.hoisted(() => ({
  useNotifications: vi.fn(), useUnreadCount: vi.fn(), useMarkRead: vi.fn(), useMarkAllRead: vi.fn(),
  useNotificationSocket: vi.fn(),
}));
vi.mock('../../../../modules/notifications', () => h);

it('okunmamış sayısını rozet olarak gösterir', () => {
  h.useUnreadCount.mockReturnValue({ data: 3 });
  h.useNotifications.mockReturnValue({ data: { items: [], total: 0 }, isLoading: false });
  // ... render + assert rozet "3"
});

it('bildirim tıklanınca okundu işaretler', () => { /* useMarkRead mutate çağrılır */ });
```

- [ ] **Step 2: Fail gör** → mock veri hâlâ render ediliyor / yeni hooks yok.

- [ ] **Step 3: NotificationMenu'yu refactor et**

- `MOCK_NOTIFICATIONS` sabitini kaldır.
- `useUnreadCount()` → ping rozeti + sayı.
- `useNotifications(unreadOnly)` → liste (tab: Tümü/Okunmamış).
- Liste öğesi tıkla → `useMarkRead().mutate(id)` + `deepLink` varsa `navigate(deepLink)`.
- "Tümünü okundu" → `useMarkAllRead().mutate()`.
- En üst seviyede `useNotificationSocket()` çağır (canlı).
- Boş/yükleniyor durum varyantları (skeleton — spinner YASAK).
- `kind` → kategori ikonu/rozet eşlemesi (lucide-react). i18n `notifications.*`.
- **Kurallar:** named export, inline style yok, `any` yok.

- [ ] **Step 4: Pass + build**

Run: `npm run test -- NotificationMenu` → PASS. `npm run build` → temiz.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/shell/NotificationMenu.tsx src/app/components/shell/__tests__/NotificationMenu.test.tsx
git commit -m "2026-06-15 feat,test: Bildirim web — header zil gerçek API+SignalR'a bağlandı (mock kaldırıldı)."
```

---

## Task E5: i18n `notifications` namespace

**Files:**
- Create: `src/shared/i18n/locales/tr/notifications.json`
- Create: `src/shared/i18n/locales/en/notifications.json`
- Modify: `src/shared/i18n/index.ts` (import + ns + resources tr/en)

- [ ] **Step 1: JSON'lar** (panel başlığı, tab'lar, "Tümünü okundu", boş durum, kind→etiket).

```json
// tr/notifications.json
{ "notifications": {
  "title": "Bildirimler",
  "tabs": { "all": "Tümü", "unread": "Okunmamış" },
  "empty": "Bildiriminiz yok.",
  "markAllRead": "Tümünü okundu işaretle",
  "kind": {
    "TimetablePublished": "Ders programı",
    "TimetableException": "Program değişikliği",
    "TimetableCancelled": "Ders iptali",
    "TimetableExceptionRevoked": "Değişiklik geri alındı",
    "TimetableProgramDeleted": "Program kaldırıldı"
  }
}}
```
(en/notifications.json: İngilizce karşılıklar.)

- [ ] **Step 2: index.ts kaydı** (import + `ns: [..., 'notifications']` + resources tr/en) — mevcut `timetable` deseni.

- [ ] **Step 3: build + commit**

Run: `npm run build` → temiz.
```bash
git add src/shared/i18n
git commit -m "2026-06-15 feat: Bildirim web — notifications i18n namespace (tr/en)."
```

---

## Task E6: FE tam paket + smoke

- [ ] **Step 1:** `npm run test` → tüm vitest yeşil (yeni testler dahil).
- [ ] **Step 2:** `npm run build` → temiz.
- [ ] **Step 3:** (opsiyonel) browser smoke: login → zil görünür, console error yok.
- [ ] **Step 4:** Commit yoksa atla.

---

# BÖLÜM F — Dokümantasyon

## Task F1: notifications.md güncelle + completion_status'ları kapat

**Files:**
- Modify: `.claude/docs/modules/timetable/notifications.md` (eski event adları → yeni)
- Modify: `.claude/docs/modules/timetable/completion_status.md`
- Modify: `.claude/docs/modules/notifications/completion_status.md`

- [ ] **Step 1: timetable/notifications.md** — `SchedulePublishedEvent`→`ScheduleProgramPublishedEvent`, `ScheduleSupersededEvent`/`ScheduleOverrideCreatedEvent` → `ScheduleExceptionCreated/Revoked`+`ScheduleProgramDeleted`; in-app+SignalR fiili teslim; push/e-posta "Debt-N2" notu.

- [ ] **Step 2: timetable/completion_status.md** — ilerleme %98→%100 (Faz 2 tam), "✅ Faz 2.6 Bildirim & SignalR fan-out" bölümü ekle; **Debt-BE-3 / Debt-BE-6(restore sessiz) / Debt-BE-8 KAPANDI** olarak işaretle; yeni Debt'ler: Debt-N1 (Outbox yok), Debt-N2 (push/e-posta), Debt-N3 (quiet hours/cooldown), Debt-N4 (mobil), Debt-N5 (tercih), Debt-N6 (dispatch yarış sertleştirme). "⚠️ Spec Dışına Çıkılanlar"a tasarım §10 maddelerini ekle (Outbox/FCM/quiet-hours, onay 2026-06-15).

- [ ] **Step 3: notifications/completion_status.md** — %0→ "in-app çekirdek teslim (timetable event'leri)"; altyapı durumunu güncelle (dispatcher/resolver/in-app channel/Hub var; Outbox/FCM/e-posta/quiet-hours yok).

- [ ] **Step 4: Commit**

```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/modules/timetable/notifications.md .claude/docs/modules/timetable/completion_status.md .claude/docs/modules/notifications/completion_status.md
git commit -m "2026-06-15 docs: Faz 2.6 Bildirim tamam — notifications.md event adları + completion_status (Debt-BE-3/6/8 kapandı, Debt-N1..N6)."
```

---

## Self-Review Notları (plan yazımında kontrol edildi)

- **Spec kapsamı:** Tasarım §1-11 → A1-A2 (altyapı), B1-B6 (dispatch+kanal+hub), C0-C4 (5 event, Restored sessiz), D1 (API), E1-E6 (FE), F1 (doküman). Tüm tasarım maddeleri bir task'a bağlı.
- **Kritik risk — idempotency anahtarı:** Event'lerde stabil EventId yok → `DeterministicGuid.Combine(ProgramId, Version)` (publish) / `Combine(ExceptionId, "created"|"revoked")` ile çözüldü (Task C0). Tekrar-yayın (yeni Version) yeni idempotency anahtarı üretir → yanlış atlama yok.
- **Mimari bağımlılık:** Handler(Application) → Job(Infrastructure) ters bağımlılığı `INotificationEnqueuer` portuyla kırıldı (Task C0). C1 buna güncellendi.
- **Kimlik eşlemesi:** her resolver `Person.LinkedAccountId` → Account.Id; bildirim/SignalR/API hep Account.Id uzayında tutarlı.
- **Tip tutarlılığı:** `NotificationKind` (domain enum) FE'de string union ile eşlenir; `NotificationMessage`/`NotificationRequest`/`INotification*` imzaları bölümler arası tutarlı.
- **Tenant:** tüm entity `TenantEntity`; Hangfire job `SetForLoginFlow`; SignalR grup SchoolId taşır; API self-scope.
```
