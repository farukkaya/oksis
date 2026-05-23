# OKSİS — Backend Notification Rules

> Notification OKSİS'in **ürün omurgası**. Yanlış bildirim = veli güveninin kaybı. Bu dosya **sunucu tarafı** bildirim mimarisini tanımlar. Kim → ne → ne zaman matrisi için `notification-matrix.md`. UI standartları için `frontend/notification-ui.skill`.

---

## 1. Mimari Genel Bakış

```
[Domain Event]
    ↓ (SaveChangesInterceptor)
[Outbox Table]   ← tek transaction içinde
    ↓ (Hangfire poll)
[Notification Handler]
    ↓
[Recipient Resolver]  →  [Preference & Quiet Hours Filter]  →  [Cooldown Check]
    ↓
[Channel Dispatch]
   ├─ Push (FCM)
   ├─ In-App (DB + SignalR)
   ├─ Email (SMTP/SES)
   └─ Real-time (SignalR only)
    ↓
[Delivery Log]
```

---

## 2. Domain Event → Notification Job

Domain event raise edildiğinde **direkt** push gönderilmez. Outbox'a yazılır, Hangfire worker okur.

```csharp
public sealed record MarkPublished(
    SchoolId SchoolId,
    MarkBookId MarkBookId,
    StudentId StudentId,
    MarkType Type,
    decimal Score) : IDomainEvent;

// SaveChangesInterceptor (sadeleştirilmiş)
foreach (var entry in changeTracker.Entries<IHasDomainEvents>())
{
    foreach (var evt in entry.Entity.DomainEvents)
    {
        outbox.Add(new OutboxMessage
        {
            Id = Guid.NewGuid(),
            SchoolId = entry.Entity is IHasTenant t ? t.SchoolId : null,
            Type = evt.GetType().AssemblyQualifiedName!,
            Payload = JsonSerializer.SerializeToDocument(evt),
            CreatedAt = clock.UtcNow,
        });
    }
    entry.Entity.ClearDomainEvents();
}
```

> Detay outbox şeması: `backend/database-rules.md` §10.

---

## 3. INotificationDispatcher

```csharp
public interface INotificationDispatcher
{
    Task DispatchAsync(NotificationEnvelope env, CancellationToken ct);
}

public sealed record NotificationEnvelope(
    Guid Id,
    SchoolId SchoolId,
    string EventType,                       // "MarkPublished"
    NotificationPriority Priority,
    UserId RecipientUserId,
    NotificationChannel[] Channels,         // [Push, InApp]
    NotificationTemplate Template,          // localized
    Dictionary<string, string> Data,        // deep-link payload
    DateTimeOffset? ScheduledAt = null);    // null = immediate

public enum NotificationPriority { Critical, High, Normal, Low }
public enum NotificationChannel { Push, InApp, Email, SignalR }
```

---

## 4. Recipient Resolver

Her event tipi için **kim alacak** mantığı ayrı resolver'da:

```csharp
public interface INotificationRecipientResolver<TEvent> where TEvent : IDomainEvent
{
    Task<IReadOnlyList<NotificationRecipient>> ResolveAsync(TEvent evt, CancellationToken ct);
}

public sealed record NotificationRecipient(
    UserId UserId,
    NotificationChannel[] PreferredChannels,
    string LanguageCode);

// Örnek: Mark Published → ilgili öğrencinin velisi(ler) + öğrenci (varsa)
public sealed class MarkPublishedRecipientResolver(IOksisDbContext db) : INotificationRecipientResolver<MarkPublished>
{
    public async Task<IReadOnlyList<NotificationRecipient>> ResolveAsync(MarkPublished e, CancellationToken ct)
    {
        var recipients = new List<NotificationRecipient>();

        // Veliler (notifications opt-in olanlar)
        var parents = await db.StudentParents
            .Where(sp => sp.StudentId == e.StudentId && sp.ReceivesNotifications)
            .Join(db.Parents, sp => sp.ParentId, p => p.Id, (sp, p) => p.UserId)
            .ToListAsync(ct);

        foreach (var userId in parents)
            recipients.Add(new(userId, new[] { Push, InApp }, await GetLang(userId, ct)));

        // Öğrenci
        var studentUserId = await db.Students
            .Where(s => s.Id == e.StudentId).Select(s => s.UserId).FirstOrDefaultAsync(ct);

        if (studentUserId is not null)
            recipients.Add(new(studentUserId.Value, new[] { Push, InApp }, await GetLang(studentUserId.Value, ct)));

        return recipients;
    }
}
```

---

## 5. User Preference

```sql
CREATE TABLE notification_preferences (
    school_id           uniqueidentifier not null,
    user_id             uniqueidentifier not null,
    event_type          nvarchar(100) not null,    -- "MarkPublished"
    push_enabled        bit not null default 1,
    in_app_enabled      bit not null default 1,
    email_enabled       bit not null default 0,
    quiet_hours_start   time null,                -- override default
    quiet_hours_end     time null,
    PRIMARY KEY (school_id, user_id, event_type)
);
```

- Default: tüm event'lerde push + in_app açık, email kapalı.
- Kullanıcı `/api/v1/me/notifications/preferences` ile yönetir.
- Resolver bunu okuyup `PreferredChannels`'i daraltır.

---

## 6. Quiet Hours

- **Sistem default:** 22:00–07:00 (okul time zone'unda).
- **Override yapılır:** Critical priority (örn. acil duyuru/güvenlik) quiet hours'a saygı **göstermez** ama use case açıkça doğrulanmalı.
- Normal/Low: quiet hours'a denk gelirse:
  - `ScheduledAt = nextMorning07:00` → re-enqueue.
- High: kullanıcı tercih ettiyse anında, etmediyse sabah.

```csharp
if (priority is Critical) → send now
else if (now in quietHours) → schedule at next 07:00
else → send now
```

---

## 7. Cooldown / Throttle

Aynı kullanıcıya kısa aralıkla benzer bildirim yağmasını engelle.

```csharp
// Redis key: "tenant:{schoolId}:cooldown:{userId}:{eventType}"
// TTL: event'e göre (örn. AttendanceAbsent = 30 dk)

var key = $"tenant:{schoolId}:cooldown:{userId}:{eventType}:{entityHash}";
if (await cache.ExistsAsync(key)) return; // skip
await cache.SetAsync(key, "1", TimeSpan.FromMinutes(30));
```

Default cooldown'lar (örnek):

| Event | Cooldown |
|-------|----------|
| AttendanceAbsent (aynı çocuk-aynı gün) | 60 dk (hatalı çoklu yoklama deduping) |
| HomeworkDueTomorrow (aynı ödev) | 24 saat |
| AnnouncementPublished | yok (her duyuru tekildir) |
| MarkPublished | yok |

> Detay event-cooldown matrisi: `notification-matrix.md`.

---

## 8. Idempotency

- Outbox `id` her bildirim için **unique** anahtardır.
- Dispatcher `notification_delivery_log` tablosunda `(outbox_id, user_id, channel)` tekilliğini garanti eder.
- Hangfire retry'da aynı outbox iki kez işlenebilir → idempotency check ile **2. kez gönderilmez.**

```sql
CREATE TABLE notification_delivery_log (
    id              uniqueidentifier primary key,
    school_id       uniqueidentifier not null,
    outbox_id       uniqueidentifier not null,
    user_id         uniqueidentifier not null,
    channel         nvarchar(20) not null,
    event_type      nvarchar(100) not null,
    sent_at         datetimeoffset null,
    delivered_at    datetimeoffset null,
    failed_at       datetimeoffset null,
    error           nvarchar(max) null,
    provider_msg_id nvarchar(200) null,           -- FCM message id
    UNIQUE (outbox_id, user_id, channel)
);
```

---

## 9. Channel Implementations

### 9.1 Push (Firebase FCM)

- Token'lar `user_devices` tablosunda. Aynı user'ın birden fazla device'ı olabilir.
- Token expire/invalid response → token soft-delete + bir sonraki gönderimde kullanılmaz.
- Batch gönderim: FCM `sendMulticast` (500 token/batch).
- Payload limit: 4KB. Aşımda kısalt + deep-link ile detail page.

```csharp
public sealed record FcmPayload(
    string Title,
    string Body,
    Dictionary<string, string> Data,
    string? ImageUrl,
    int Badge,
    string Sound = "default");
```

### 9.2 In-App + Real-time

- DB'ye `notifications` insert.
- SignalR `tenant:{schoolId}` grup'a `notification` event.
- UI bunu in-app listesinde gösterir ve badge sayısını günceller.

```sql
CREATE TABLE notifications (
    id                uniqueidentifier primary key,
    school_id         uniqueidentifier not null,
    user_id           uniqueidentifier not null,
    event_type        nvarchar(100) not null,
    title             nvarchar(200) not null,
    body              nvarchar(max) not null,
    data              nvarchar(max) /* JSON */ not null,        -- deep-link, ids
    priority          nvarchar(20) not null,
    created_at        datetimeoffset not null,
    read_at           datetimeoffset null
);
CREATE INDEX ix_notifications_school_user_unread
  ON notifications(school_id, user_id, created_at desc)
  WHERE read_at IS NULL;
```

### 9.3 Email (MVP'de minimal)

- SMTP/SendGrid/SES. Provider abstraction: `IEmailSender`.
- MVP'de sadece: welcome, password reset, weekly digest (V2).
- Per-event email gönderimi yok (sadece kullanıcı tercih ederse).

### 9.4 SignalR (Standalone, push-less olaylar)

- Liste güncellemeleri (yeni ödev kaydı, yoklama tamamlandı bilgisi).
- "Online" only. Push komplementeridir, replace değildir.

---

## 10. Template & Localization

Template'ler DB'de (gelecekte SchoolAdmin custom edit edebilsin):

```sql
CREATE TABLE notification_templates (
    school_id     uniqueidentifier null,                   -- NULL = global default
    event_type    nvarchar(100) not null,
    language      nvarchar(5) not null,         -- "tr-TR", "en-US"
    channel       nvarchar(20) not null,
    title         nvarchar(200) not null,
    body          nvarchar(max) not null,               -- {{StudentName}} {{Score}}
    PRIMARY KEY (school_id, event_type, language, channel)
);
```

Render: simple mustache. Variables `notification-matrix.md`'de event başına listelenir.

```csharp
public sealed class TemplateRenderer
{
    public NotificationTemplate Render(string eventType, string lang, NotificationChannel ch, Dictionary<string,string> data)
    {
        var raw = LoadTemplate(eventType, lang, ch); // tenant override > global default
        var title = Mustache(raw.Title, data);
        var body  = Mustache(raw.Body, data);
        return new(title, body);
    }
}
```

---

## 11. Retry & Failure

- Hangfire retry: **5** deneme, exponential backoff (1m, 5m, 15m, 1h, 6h).
- Final fail → `notification_delivery_log.failed_at` + error message.
- FCM "not registered" → device soft-delete, retry yok.
- FCM throttle → backoff, retry.
- Critical priority fail → SuperAdmin alert (ops kanalı).

---

## 12. Deep Link Payload

Her bildirimde `data` alanı deep-link bilgisi taşır:

```json
{
  "type": "mark.published",
  "schoolId": "...",
  "studentId": "...",
  "markBookId": "...",
  "url": "/parent/students/{studentId}/marks/{markBookId}"
}
```

Mobile/Web bunu tap'lediğinde ilgili sayfaya yönlendirir. Tenant claim ile auth kontrolü yapılır.

---

## 13. Test Zorunlulukları

- Recipient resolver unit test (mock DB) — kim listede, kim değil.
- Cooldown integration test — aynı event 2 kez tetiklenirse 2. atlanır.
- Quiet hours test — 23:00'te tetiklenen Normal priority → 07:00'a schedule.
- Idempotency test — outbox 2 kez işlenirse delivery log'da tek satır.
- FCM mock test — invalid token → device soft-delete.

---

## 14. Yasak Pratikler

- ❌ Handler içinde **doğrudan** FCM call. (Outbox → Hangfire → dispatcher).
- ❌ Send notification with tenant context yok.
- ❌ Tüm okullara `Clients.All.SendAsync`.
- ❌ Email'i her event için göndermek (user kontrolü olmadan).
- ❌ Template'i kod içinde string concat (`$"{user.Name} aldı: {score}"`).
- ❌ Notification içine ham PII (T.C., adres) koymak.
- ❌ Deep-link URL'inde authentication token query param.
- ❌ Retry sonsuz (DLQ veya final-fail mantığı eksik).
- ❌ Production'da debug log'da bildirim payload tamamı (PII sızar).

---

## 15. AI Direktifleri

1. Yeni event eklerken: domain event class'ı + recipient resolver + template + matrix tablosu güncellemesi → **4 dosya** birden.
2. Notification gönderirken pipeline'a `IDispatcher` çağrısı koy, asla `FcmClient.SendAsync` direkt çağırma.
3. Cooldown matrisini güncellemeden production'a alma.
4. Test: resolver + cooldown + idempotency, 3 test minimum.
5. Permission kontrolünü unutma: bir veli sadece **kendi çocuğunun** event'ini alacak (resolver sorumlu).
