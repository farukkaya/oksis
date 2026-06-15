# Ders Programı — Faz 2.6: Bildirim & SignalR Fan-out (Tasarım)

> **Durum:** Tasarım onaylandı (2026-06-15, kullanıcı). Bağlayıcı spec:
> `.claude/specs/ders-programi-modulu-spec.md` §33-34 (Faz 2 = "...SignalR fan-out + bildirim...").
> Kaynak analizler: `Oksis_Ders_Programi_Ihtiyac_Analizi.docx` §11, `Oksis_DersProgrami_Teknik_Analiz.docx` §8-10.

---

## 1. Amaç ve Kapsam

Faz 2'nin tek eksik dilimi: **timetable domain event'lerini gerçek bildirime bağlamak.** Şu an 5 event
fırlatılıyor ama dinleyen yok (Debt-BE-3/6/8). Bu dilim, **genel ama minimal** bir bildirim altyapısı
kurar (silo değil) ve timetable event'lerini ona bağlar.

### Kapsam içi
- Genel `INotificationDispatcher` + `INotificationRecipientResolver<TEvent>` soyutlaması.
- **Uygulama-içi (in-app) kanal:** kalıcı `notifications` tablosu + canlı **SignalR** push.
- **İdempotentlik:** `notification_delivery_log` (event-id + user + channel unique).
- Timetable 5 event'inin recipient resolver + handler'ları (4'ü bildirir, Restored sessiz).
- Web FE: header zil ikonu + okunmamış rozeti + liste + "okundu işaretle" + SignalR canlı artış.
- `timetable/notifications.md` matrisini yeni `ScheduleProgram*` event adlarına güncelle.

### Kapsam dışı (Debt — gerekçeli)
- **Transactional Outbox tablosu + SaveChangesInterceptor.** Teknik Analiz §10 "event → Hangfire job"
  diyor, Outbox şart koşmuyor; mevcut Davet (Invitation) pattern'i de Outbox'suz. Outbox tüm modülleri
  ilgilendiren ayrı bir güvenilirlik sertleştirmesi → **Debt-N1**.
- **FCM push (mobil) + e-posta kanalı.** FCM altyapısı yok, mobil tüketici ekranları yok → şu an teslim
  edilemez. İhtiyaç Analizi §11 e-postayı "gerekirse" sayıyor → **Debt-N2**.
- **Quiet hours (22:00-07:00) + cooldown (Redis).** Yayın sezon-başı tek-tetik olduğundan acil değeri
  düşük → **Debt-N3**.
- **Mobil bildirim ekranları** (ayrı tier) → **Debt-N4**.
- **Bildirim tercih tabloları** (`notification_preferences`) — kullanıcı kanal tercihi → **Debt-N5**.

---

## 2. Mevcut Durum (kod doğrulaması, 2026-06-15)

| Parça | Durum | Kanıt |
|---|---|---|
| 5 timetable event | ✅ tanımlı + fırlatılıyor, dinleyen yok | `src/Oksis.Domain/Modules/Timetable/Events/*` |
| Genel dispatcher/resolver | ❌ yok | yalnız `IInvitationNotificationDispatcher` (izole) |
| In-app kanal (DB+SignalR) | ❌ yok | — |
| `notifications` tablosu | ❌ yok | `OksisDbContext` yalnız `NotificationConfig`/`NotificationType` |
| `notification_delivery_log` | ❌ yok | — |
| SignalR Hub | kısmi | `SessionHub` (forced-logout), grup `{schoolId}:{accountId}` |
| Çalışan örnek | Davet (e-posta) | event → MediatR handler → Hangfire job → dispatcher → channel |

**Taban alınan pattern (Davet):** `InvitationCreatedEvent` → `InvitationCreatedEventHandler` →
`SendInvitationNotificationJob` (Hangfire) → `IInvitationNotificationDispatcher` → `EmailInvitationChannel`.
Aynı güvenilirlik modeli (commit sonrası MediatR handler Hangfire job kuyruğa atar) — fark: **genel**
dispatcher/resolver soyutlaması.

---

## 3. Mimari

### 3.1. Akış
```
Domain event (ör. ScheduleProgramPublishedEvent)
  │  (mevcut DomainEventInterceptor → MediatR publish, commit sonrası)
  ▼
INotificationHandler<TEvent>  (Application — her event için ince handler)
  │  Hangfire enqueue: DispatchNotificationJob(eventEnvelope)
  ▼
DispatchNotificationJob  (Infrastructure — Hangfire, retry+backoff)
  │  1) INotificationRecipientResolver<TEvent>.ResolveAsync → alıcı kümesi
  │  2) her alıcı × kanal: delivery_log idempotency kontrolü (atla/yaz)
  ▼
INotificationChannel  →  InAppNotificationChannel
  │  a) notifications tablosuna satır yaz (kalıcı)
  │  b) NotificationHub üzerinden SignalR push (tenant:{schoolId}:user:{userId})
```

### 3.2. Yeni soyutlamalar (Application/Ports)
- `INotificationDispatcher` — bir bildirim niyetini (recipients + içerik) kanallara dağıtır.
- `INotificationRecipientResolver<TEvent>` — event → `IReadOnlyList<NotificationRecipient>`.
- `INotificationChannel` — `SendAsync(NotificationMessage, recipient)`; impl: `InAppNotificationChannel`.
- `NotificationMessage` (VO): Title, Body, Type (enum), DeepLink, Priority.

### 3.3. Domain (yeni)
- `Notification` (tenant entity): Id, RecipientUserId, Type, Title, Body, DeepLink, IsRead, ReadAt,
  CreatedAt. Davranış: `MarkAsRead()`. (Kullanıcının zil listesinde gördüğü kalıcı satır.)
- `NotificationDeliveryLog` (tenant entity): EventId (Guid), RecipientUserId, Channel, DeliveredAt.
  Unique: `(SchoolId, EventId, RecipientUserId, Channel)` → idempotency.

> **İsim notu:** Mevcut `NotificationType` (config entity) ile çakışmamak için yeni event-tipi enum'ı
> `NotificationKind` adıyla (TimetablePublished / TimetableException / TimetableCancelled /
> TimetableProgramDeleted). Uygulama sırasında mevcut adlarla netleşecek.

---

## 4. Hedefleme (recipient resolution)

Teknik Analiz §9-10: **"etkilenen küme yayın diff'inden"** — tüm okula değil.

| Event | Bildirir mi | Alıcılar | Kaynak |
|---|---|---|---|
| `ScheduleProgramPublished` | ✅ | **v1:** şubenin tüm öğretmen+veli+öğrencisi. **vN:** `GetScheduleVersionDiff` ile yalnız değişen öğretmenler + şube veli/öğrenci | diff sorgusu B-1'de mevcut |
| `ScheduleExceptionCreated` | ✅ (BR-TT-010 HARD) | vekil + asıl öğretmen, şubenin veli + öğrenci | exception.TeacherId/SubstituteTeacherId + şube |
| `ScheduleExceptionRevoked` | ✅ | aynı küme (geri-alma) | aynı |
| `ScheduleProgramDeleted` | ✅ (Debt-BE-8) | şubenin tüketicileri ("program kaldırıldı") | şube |
| `ScheduleProgramRestored` | ❌ **sessiz** | — (yeni sürüm üretmez; yalnız sonraki yayınla yansır) | — |

**Alıcı çözüm desenleri (Faz 2.3 tüketici sorgularından yeniden kullanım):**
- Öğretmen = event'teki yerleşim `TeacherId`.
- Öğrenci = şube (`StudentProfile.CurrentClassroomId == branchId`).
- Veli = `ParentStudentRelationship` + `CanViewInfo == true` (ilişkisiz çocuk elenir).
- Pasif/silinmiş kullanıcılar elenir.

> **Debt-BE-2 ilişkisi:** veli read-model'i Faz 2.3'te bağlandı (consumer query'lerinde kullanılıyor),
> bu yüzden veli alıcı çözümü mümkün. (publish-preview'daki "0 veli" ayrı bir sayım borcu, alıcı
> çözümünü engellemiyor.)

**İçerik (Teknik Analiz §10: "ne değişti, ne zamandan geçerli"):** `timetable/notifications.md`
matrisindeki TR şablonları kullanılır (yeni event adlarına güncellenmiş). i18n: bildirim gövdesi
backend'de üretilir (alıcı diline göre değil, şimdilik TR; çok-dil → Debt).

---

## 5. SignalR

- Yeni `NotificationHub : Hub` (Api/Hubs). Grup: `tenant:{schoolId}:user:{userId}`
  (mevcut `SessionHub` `{schoolId}:{accountId}` desenini örnek alır; tenant prefix zorunlu).
- Bağlanınca client kendi grubuna eklenir (`OnConnectedAsync`).
- `InAppNotificationChannel`, DB satırını yazdıktan sonra `IHubContext<NotificationHub>` ile
  `ReceiveNotification(payload)` push eder.
- **Tenant izolasyonu:** grup adı `SchoolId` taşır; cross-tenant push imkânsız.

---

## 6. API (yeni uçlar — self-scope)

| Uç | Açıklama | İzin |
|---|---|---|
| `GET /api/v1/notifications?unreadOnly&page` | Kendi bildirimleri (sayfalı) | auth (recipient = current user) |
| `GET /api/v1/notifications/unread-count` | Okunmamış sayısı (rozet) | auth |
| `POST /api/v1/notifications/{id}/read` | Tek bildirim okundu | auth + sahiplik |
| `POST /api/v1/notifications/read-all` | Tümünü okundu | auth |

**IDOR:** handler her zaman `RecipientUserId == currentUserId` filtreler; yeni özel izin yok (self-scope).

---

## 7. Frontend (web)

- **Modül:** `src/modules/notifications/` (consumer deseni — types/keys/api/hooks). Tenant-scope React
  Query key'leri (`tenantScopedKey`).
- **Header zil:** `NotificationBell` (okunmamış rozeti + popover liste). SignalR client (`@microsoft/signalr`)
  ile `ReceiveNotification` dinler → React Query cache invalidate / optimistic artış.
- **Liste:** okunmamış vurgulu, tıkla → `deepLink` route + okundu işaretle. "Tümünü okundu" aksiyonu.
- **Durum varyantları:** boş / yükleniyor (skeleton) / hata.
- **i18n:** `notifications.*` (tr/en) — hardcoded Türkçe yok.
- **SignalR bağımlılığı:** `@microsoft/signalr` paketi (yeni kütüphane → uygulamadan önce kullanıcı onayı).

> **Not:** Mevcut bir SignalR client altyapısı (SessionHub için) varsa onu örnek/temel al; yoksa
> minimal bağlantı yönetimi (auth token + reconnect) eklenir.

---

## 8. Güvenlik & Çok-kiracılık

- Tüm `notifications`/`notification_delivery_log` satırları `TenantEntity` → EF global query filter +
  `TenantSaveChangesInterceptor` ile `SchoolId` otomatik.
- SignalR grubu `SchoolId` taşır.
- Hangfire job tenant-scope'lu çalışır (event envelope `SchoolId` taşır).
- API self-scope (recipient = current user).

---

## 9. Test Stratejisi (TDD)

- **Domain:** `Notification.MarkAsRead()`, `NotificationDeliveryLog` unique davranışı.
- **Resolver birim testleri:** her event → doğru alıcı kümesi (öğretmen/öğrenci/veli; pasif eleme;
  ilişkisiz veli eleme; v1 vs vN diff hedefleme).
- **Dispatcher/idempotency:** aynı event iki kez → tek satır (delivery_log backstop).
- **Handler testleri:** event → Hangfire enqueue (fake dispatcher).
- **Integration:** `notification_delivery_log` unique index gerçekten çift teslimi engelliyor mu.
- **Web vitest:** bell rozeti, liste okundu, SignalR mesajı → liste artışı, durum varyantları.

---

## 10. Spec Dışına Çıkılanlar (completion_status'a işlenecek)

- **Outbox atlandı (Debt-N1):** CLAUDE.md "Outbox pattern" tarif eder; Teknik Analiz §10 yalnız
  "event → Hangfire" ister. Davet pattern'iyle (Outbox'suz) hizalandı. Onay: kullanıcı (2026-06-15).
- **FCM push + e-posta ertelendi (Debt-N2):** FCM/mobil yok → şimdilik teslim edilemez. Teknik Analiz §10
  kanal listesinden sapma. Onay: kullanıcı (2026-06-15).
- **Quiet hours + cooldown ertelendi (Debt-N3):** sezon-başı tek-tetik → acil değil. Onay: kullanıcı.
- **Restore bildirimi yok:** yeni sürüm üretmez → sessiz (Debt-BE-6 ile tutarlı). Onay: kullanıcı.

---

## 11. Teslim Sırası (yüksek seviye — detay plan writing-plans'te)

1. **BE altyapı:** domain (`Notification`, `NotificationDeliveryLog`) + EF config + migration.
2. **BE soyutlama:** dispatcher + resolver + `InAppNotificationChannel` + Hangfire job + DI.
3. **BE SignalR:** `NotificationHub` + push.
4. **BE event bağlama:** 5 event'in resolver + handler'ları (4 bildirir).
5. **BE API:** 4 uç (list/unread-count/read/read-all).
6. **FE:** notifications modülü + bell + SignalR client + i18n + testler.
7. **Doküman:** `timetable/notifications.md` event adı güncellemesi + `notifications/completion_status.md`
   + timetable `completion_status.md` Faz 2.6 tamam + Debt-BE-3/6/8 kapanışı.
