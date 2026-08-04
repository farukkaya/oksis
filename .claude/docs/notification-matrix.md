# Notification Matrix

> Hangi olayda kime nasıl bildirim gider — **tek kaynak** burası. AI bildirim eklerken bu matrisi günceller.

---

## 1. Bildirim Kanalları

| Kanal | Açıklama | Cihaz |
|---|---|---|
| `Push` | FCM ile cihaza push | Mobile + Web (FCM Web SDK) |
| `InApp` | Uygulama içinde bildirim merkezi | Tüm portallar |
| `SignalR` | Real-time UI update | Web ön plan, mobile ön plan |
| `Email` | Transactional e-posta | Tüm kullanıcılar |
| `SMS` | (MVP'de yok, sonra) | — |

> **Default davranış**: Tüm "kritik" eventlerde aynı anda `Push` + `InApp` + `SignalR` (kullanıcı online ise) gönderilir.

---

## 2. Bildirim Önceliği

| Seviye | Davranış |
|---|---|
| `Critical` | Sessiz saatlerde dahi anında gönderilir. Push + InApp + SignalR. |
| `High` | Anında. Sessiz saatlerde push 07:00'de. InApp + SignalR hep. |
| `Normal` | Sessiz saatler dışında anında; sessizde dijest (sabah toplu). |
| `Low` | Günlük dijest (varsayılan 07:00). Standalone push gitmez. |

Sessiz saatler: **22:00 – 07:00** (kullanıcının zaman dilimi, default `Europe/Istanbul`).

---

## 3. Event → Bildirim Matrisi

### Yoklama (Attendance)

| Event | Tetik | Hedef | Kanal | Öncelik | Cooldown |
|---|---|---|---|---|---|
| `AttendanceTakenEvent` | Öğretmen yoklama kaydetti | — (sadece audit) | — | — | — |
| `StudentMarkedAbsent` | Öğrenci `Absent` işaretlendi | Veli | Push + InApp | `High` | Aynı gün 1 push |
| `AttendanceThresholdReached` | Dönem devamsızlığı eşiği aştı | Veli + SchoolAdmin | Push + InApp + Email | `Critical` | 24 saatte 1 |
| `AttendanceLateMarked` | Öğrenci `Late` işaretlendi | Veli | InApp | `Normal` | — |
| `DailyAttendanceDigest` | Her gün 18:00 | Veli | Push + InApp | `Low` | Günlük |

### Not (Mark)

| Event | Tetik | Hedef | Kanal | Öncelik | Cooldown |
|---|---|---|---|---|---|
| `MarkDraftCreated` | Not taslak oluşturuldu | — | — | — | — |
| `MarkPublishedEvent` | Not yayınlandı | Veli + Öğrenci | Push + InApp + SignalR | `High` | — |
| `MarkUpdatedEvent` | Yayınlanmış not değişti | Veli + Öğrenci | Push + InApp | `Normal` | 24 saatte max 2 |
| `MarkDeletedEvent` | Not silindi | Veli + Öğrenci | InApp | `Normal` | — |
| `ReportCardPublishedEvent` | Karne yayınlandı | Veli + Öğrenci | Push + InApp + Email | `Critical` | — |

### Ödev (Homework)

| Event | Tetik | Hedef | Kanal | Öncelik | Cooldown |
|---|---|---|---|---|---|
| `HomeworkAssignedEvent` | Ödev oluşturuldu/atandı | Öğrenci + Veli | Push + InApp | `High` | — |
| `HomeworkDueReminderEvent` | Teslim tarihinden 24 saat önce | Öğrenci | Push + InApp | `Normal` | 1 kere |
| `HomeworkSubmittedEvent` | Öğrenci teslim etti | Öğretmen | Push + InApp + SignalR | `Normal` | — |
| `HomeworkOverdueEvent` | Teslim tarihi geçti, teslim yok | Veli + Öğrenci | Push + InApp | `High` | 24 saatte 1 |
| `HomeworkGradedEvent` | Ödev notlandı | Öğrenci + Veli | Push + InApp | `Normal` | — |

### Duyuru (Announcement)

> Bu bölüm **`NotificationKind` enum'unun gerçek değerleriyle** hizalıdır
> (`Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs`, 16–23). Alıcı sütunu
> enum'un kendi XML doc'undan alınmıştır — **duyuru bildirimlerinin yarısı alıcılara değil,
> yayınlayana ya da yönetime gider**; bu ayrım tesadüf değil, ihtiyaç analizi §16.3'ün
> kararıdır.

| `NotificationKind` | Tetik | Hedef | Kanal | Öncelik | Cooldown |
|---|---|---|---|---|---|
| `AnnouncementPublished` (16) | Duyuru yayınlandı | **Alıcılar** (materyalize `AnnouncementRecipient` kümesi) | InApp | — | Dedup: `(schoolId, announcementId, kind)` |
| `AnnouncementWithdrawn` (17) | Duyuru geri çekildi | **Yalnız yayınlayan** — alıcıya GİTMEZ | InApp | — | aynı |
| `AnnouncementAmended` (18) | Yayın sonrası düzeltme | **Alıcılar** | InApp | — | aynı |
| `AnnouncementSubmittedForApproval` (19) | Eşikli moderasyonda onaya düştü (INV-5) | **Yönetim** (onay kuyruğu sahipleri) | InApp | — | aynı |
| `AnnouncementApproved` (20) | Onaylandı ve yayınlandı | **Yayınlayan öğretmen** | InApp | — | aynı |
| `AnnouncementRejected` (21) | Reddedildi, taslağa döndü | **Yayınlayan öğretmen** — gövde red gerekçesini taşır | InApp | — | aynı |
| `AnnouncementScheduledExecuted` (22) | Zamanlanmış duyuru yayına çıktı | **Yayınlayan** — alıcılara zaten 16 gitti | InApp | — | aynı |
| `AnnouncementScheduleFailed` (23) | Zamanlanmış yayın anında hedef kimseye çözülmedi; duyuru `scheduled` kalır | **Yayınlayan** | InApp | — | aynı |

**Bu tablonun okunmasında üç tuzak:**

- **`Withdrawn` alıcıya gitmez.** İhtiyaç analizi §16.3: geri çekilen duyuru alıcıda
  "sessizce kaybolur" — alıcı duyuruyu *hiç görmemiş gibi* olmalıdır. İz yönetim tarafında
  (denetim izi) tutulur. Yayınlayan ise bilgilendirilir, çünkü duyurusunu yönetim geri
  çekmiş olabilir.
- **`Amended` sessiz düzeltmede ÜRETİLMEZ.** `silentAmendment` (sözlük) tanımı gereği
  alıcıya haber gitmez; yalnız denetim izine yazılır.
- **`ScheduledExecuted` ile `Published` ayrı kalır** çünkü derin bağlantıları ayrıdır:
  alıcı duyuruyu **okumaya**, yayınlayan **gönderim raporuna** gider.

> **Kanal ve öncelik sütunları neden düz:** bu satırlar tasarım niyeti değil, **bugünkü
> gerçek**. Sunucuda `INotificationChannel` olarak yalnız `InAppNotificationChannel`
> kayıtlıdır; `NotificationPriority` **enum'u yoktur** ve `INotificationEnqueuer.Enqueue`
> imzasında öncelik parametresi bulunmaz. `NotificationConfig.QuietHours*` alanları mevcut
> ama gönderim anında tüketen kod yoktur — yani **acil duyuru teslim davranışını
> DEĞİŞTİRMEZ** (`urgent` yalnız istemcide görsel vurgudur). Bu yalnız duyuruda değil, tüm
> bildirimlerde böyledir; yukarıdaki diğer bölümlerin `Push`/`Email`/`Critical` değerleri
> **hedef durumdur, mevcut durum değil**. Kaynak: duyuru spec'i §8.3 ve §16.

### Mesajlaşma (Messaging)

| Event | Tetik | Hedef | Kanal | Öncelik | Cooldown |
|---|---|---|---|---|---|
| `MessageReceivedEvent` | Yeni mesaj | Alıcı | Push + InApp + SignalR | `High` | Konuşma başına 5 dk'da 1 |
| `MessageThreadDigest` | (varsayılan kapalı) 1 saat içinde okunmamış 3+ mesaj | Alıcı | Push | `Normal` | 1 saatte 1 |

### Identity / Hesap

| Event | Tetik | Hedef | Kanal | Öncelik | Cooldown |
|---|---|---|---|---|---|
| `UserInvitedEvent` | Kullanıcı davet edildi | Davet edilen | Email | `Critical` | — |
| `PasswordResetRequestedEvent` | Şifre sıfırlama talebi | Kullanıcı | Email | `Critical` | 5 dk'da 1 |
| `PasswordChangedEvent` | Şifre değişti | Kullanıcı | Email + InApp | `High` | — |
| `LoginFromNewDeviceEvent` | Yeni cihazdan giriş | Kullanıcı | Email + InApp | `High` | — |
| `AccountLockedEvent` | Hesap kilitlendi | Kullanıcı + SchoolAdmin | Email + InApp | `Critical` | — |

### Tenant / Okul

| Event | Tetik | Hedef | Kanal | Öncelik |
|---|---|---|---|---|
| `SchoolSuspendedEvent` | Okul askıya alındı | Tüm okul kullanıcıları (login bannerı) | InApp | `Critical` |
| `AcademicYearTransitionStartedEvent` | Sezon geçişi başladı | SchoolAdmin | InApp + Email | `High` |

### Sistem / Background

| Event | Tetik | Hedef | Kanal | Öncelik |
|---|---|---|---|---|
| `ExcelImportCompletedEvent` | Excel import bitti | İşi başlatan | InApp + SignalR | `Normal` |
| `ExcelImportFailedEvent` | Excel import hata | İşi başlatan | InApp + Email | `High` |
| `BackupCompletedEvent` | Sistem yedeği | SuperAdmin | InApp | `Low` |

---

## 4. Hedef Kitle Çözümleme (Resolution)

Event publish edildiğinde **alıcılar runtime'da hesaplanır**:

```csharp
public interface INotificationRecipientResolver
{
    Task<IReadOnlyCollection<UserId>> ResolveAsync(INotification @event, CancellationToken ct);
}
```

Örnek: `MarkPublishedEvent` → öğrencinin kendisi + tüm aktif velileri (StudentParent join).

### Standart Çözümleyiciler

- `StudentRelatedResolver` → öğrenci + aktif veliler
- `ClassRelatedResolver` → şubedeki tüm öğrenciler + velileri
- `RoleBasedResolver` → belirli rol(ler)deki tüm kullanıcılar (okul içi)
- `INotificationRecipientResolver.ResolvePersonAccountsMapAsync(schoolId, personIds, ct)`
  → verilen `PersonId` listesini `Account.Id`'ye çevirir (tek toplu sorgu, N+1 yok); bağlı
  hesabı olmayan kişiler dışlanır. **Duyuru bildirimleri bunu kullanır.**

> **Düzeltme (2026-08-03):** bu listede daha önce `AnnouncementTargetResolver → duyurunun
> `Targets` alanına göre` satırı vardı. **Öyle bir tip hiç yazılmadı ve gerekli değildir.**
> Duyuruda alıcı kümesi runtime'da çözülmez — yayın anında `AnnouncementRecipient`
> satırlarına **materyalize edilir** (fan-out duyuru modülünün içindedir, bildirim
> çekirdeğinde değil). Bildirim katmanının tek ihtiyacı, o `PersonId` kümesini hesaba
> çevirmektir; onu da yukarıdaki `ResolvePersonAccountsMapAsync` yapar. Kaynak: duyuru
> spec'i §8.1 ve `AnnouncementPublishedNotificationHandler`'ın doc'u.

---

## 5. Cooldown Mantığı

Cooldown key formatı: `notif:cooldown:{userId}:{eventType}:{resourceId}`

Redis'te SETNX + TTL.

```csharp
var key = $"notif:cooldown:{userId}:{eventType}:{resourceId}";
var acquired = await _redis.SetIfNotExistsAsync(key, "1", ttl: cooldownDuration);
if (!acquired) return; // skip
```

---

## 6. Sessiz Saat Kuralları

- User profile'da `QuietHoursStart` ve `QuietHoursEnd` (default `22:00` – `07:00`).
- User zaman dilimi: `User.TimeZone` (default `Europe/Istanbul`).
- `Critical` → her halükarda gönderilir.
- `High`, `Normal` → sessiz saatlerde **push ertelenir**; sabah 07:00'de tek bir özet push olarak gönderilir.
- `Low` → sadece günlük dijest saatinde (default 07:00).

---

## 7. Kullanıcı Tercih Yönetimi

Kullanıcı profilinde tercih ayarları:

```
Notification Preferences:
  ✅ Attendance updates
  ✅ Grades published
  ✅ Homework assigned
  ☐ Homework reminders
  ✅ Announcements (school-wide)
  ☐ Messages digest
  
Channels:
  Push:  ✅ Mobile  ✅ Web
  Email: ☐ All     ✅ Critical only
```

- Tercihler `User.NotificationPreferences` JSON kolonunda.
- `Critical` bildirimler **opt-out edilemez** (güvenlik, hesap, vs.).
- Tercih değişikliği → cache invalidate.

---

## 8. Bildirim Audit & Delivery Logging

Her bildirim için kayıt:

```
notifications
  id, school_id, user_id, event_type, channel, priority,
  payload_json, status (Pending/Sent/Failed/Skipped),
  scheduled_at, sent_at, failure_reason,
  resource_type, resource_id, correlation_id, created_at
```

- 30 günden eski bildirim arşivlenir (read-only kolonu).
- 6 ay sonra hard delete (yalnızca audit özet kalır).
