# Bildirim — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Master Tablolar (tenant-agnostik)

Migration `20260523222901_add_global_seed_master_data` ile HasData() seed.

### `notification_types` (9 satır seed)

Tüm push/email/SMS bildirimlerinin platform geneli kataloğu. Her tipin hangi kanallardan iletileceği `Channels` flag enum kolonunda, varsayılan açık/kapalı durumu `DefaultEnabled` kolonunda.

```sql
CREATE TABLE notification_types (
    id                uniqueidentifier  not null  constraint pk_notification_types primary key,
    code              nvarchar(50)      not null,
    name              nvarchar(100)     not null,
    channels          int               not null,   -- NotificationChannel flag enum (Push=1, Email=2, Sms=4, InApp=8)
    default_enabled   bit               not null,
    description       nvarchar(300)     null,
    -- audit + soft-delete + row_version
);

CREATE UNIQUE INDEX ux_notification_types_code
  ON notification_types(code) WHERE is_deleted = 0;
```

**Seed satırları:**
| Code | Channels (kombinasyon) | Default |
|---|---|---|
| ATT_ABSENT | Push + Email | true |
| GRADE_PUBLISHED | Push | true |
| HOMEWORK_CREATED | Push | true |
| HOMEWORK_DUE | Push | true |
| ANNOUNCEMENT | Push | true |
| DUTY_ASSIGNED | Push + Email | true |
| YEAR_PUBLISHED | Push + Email | true |
| INVITE_SENT | Email | true |
| MESSAGE_RECEIVED | Push | true |

---

## Enum: `NotificationChannel` (Flags)

```csharp
[Flags]
public enum NotificationChannel
{
    None = 0,
    Push = 1,
    Email = 2,
    Sms = 4,
    InApp = 8
}
```

Bitwise kombinasyon (`Push | Email` = 3). EF Core'da `HasConversion<int>()` ile persist.

---

## Tenant Tablolar (mevcut + Sprint 2 planı)

### `school_notification_configs` (tenant, mevcut)

Tenant başına global `notification_types`'i override eder. Properties: `SchoolId`, `NotificationTypeId` (FK master), `Channels` override, `IsEnabled`, `CooldownMinutes`, `QuietHoursStartHour`, `QuietHoursEndHour`.

> Detay: `modules/school-settings/database-schema.md`.

### `notifications` (tenant, Sprint 2+)

Gönderilen her bildirimin kaydı. Properties: `SchoolId`, `UserId`, `EventType`, `Channel`, `Priority`, `PayloadJson`, `Status` (Pending/Sent/Failed/Skipped), `ScheduledAt`, `SentAt`, `FailureReason`, `ResourceType`, `ResourceId`, `CorrelationId`.

### `user_notification_preferences` (tenant, Sprint 2+)

Kullanıcı seviyesinde bildirim tercihleri (kanal aç/kapa, quiet hours override).

### `notification_delivery_log` (tenant, Sprint 2+)

Idempotency için: `(OutboxMessageId, UserId, Channel)` unique. Bir event'in aynı kullanıcıya aynı kanaldan iki kez gönderilmesini engeller.

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | `notification_types` master tablosu + 9 satır seed |

---

## Yasaklar

- ❌ `notification_types.code` değiştirme — recipient resolver'lar ve event mapping bozulur.
- ❌ Master tabloya tenant scope kolonu eklemek (tenant override `school_notification_configs`).
- ❌ Notification gönderim history'sini master tabloda tutmak (her zaman tenant scope).
- ❌ `Channels` flag enum'a tenant-spesifik kanal eklemek (FCM/SMTP provider seviyesinde yapılır).

> Detay: `backend/database-rules.md`, `notification-matrix.md`.
