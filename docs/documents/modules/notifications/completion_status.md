# Bildirim (Notifications) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓░░░░░` %45   ·   Status: in-progress   ·   Güncel: 2026-06-15

> Temel: **In-app bildirim çekirdeği teslim edildi** (Faz 2.6, 2026-06-15) — ilk olarak timetable
> event'leri tarafından sürülüyor. Genel ama minimal dispatcher + recipient resolver + in-app kanal +
> SignalR Hub + idempotency + self-scope API + web zili kuruldu. **Yalnız in-app + SignalR**; Outbox,
> FCM push, email, sessiz saat/cooldown, tercih tabloları ve mobil ekranlar henüz yok (aşağıdaki Debt).
> Doküman içeriği (`{{TBD}}` alanları) hâlâ büyük ölçüde dolmadı — bu ilerleme implementasyon çekirdeğini
> yansıtır, doküman dolumunu değil.

---

## ✅ Tamamlanan Yapılar

- 9 dosyalık doküman iskeleti oluşturuldu (içerik büyük ölçüde dolmadı).
- **In-app bildirim çekirdeği (Faz 2.6, 2026-06-15) — ilk sürücü: timetable event'leri:**
  - **Domain + migration:** `Notification` + `NotificationDeliveryLog` entity'leri + `NotificationKind` enum'u.
    Yeni `[notifications]` şeması, migration `20260615_add_notifications`, idempotency için filtreli unique
    index `(SchoolId, EventId, RecipientAccountId, Channel)`.
  - **Pipeline (general, event-driven):** domain event → MediatR `INotificationHandler<DomainEventNotification<TEvent>>`
    (commit-after) → `INotificationEnqueuer` (Hangfire) → `DispatchNotificationJob` (tenant `SetForLoginFlow`) →
    `NotificationDispatcher` (per-recipient delivery-log idempotency) → `InAppNotificationChannel`
    (`Notification` satırı + SignalR push). **Outbox YOK** (Invitation deseni — Debt-N1).
  - **SignalR:** `NotificationHub` @ `/hubs/notifications`, grup `{schoolId}:{accountId}`, metot
    `ReceiveNotification`. Push Application portu `INotificationRealtimePusher` (Api impl `SignalRNotificationPusher`).
  - **Recipient resolver:** `NotificationRecipientResolver` (şube → öğrenci/veli login Account.Id'leri
    `Person.LinkedAccountId` üzerinden; öğretmen Person→Account; açık per-tenant `SchoolId` filtresi).
  - **API (self-scope, IDOR-safe, yeni izin yok):** `GET /api/v1/notifications` (paged), `/unread-count`,
    `POST /{id}/read`, `/read-all` (`RecipientAccountId == current account`).
  - **Web:** `src/modules/notifications/` (types/keys/api/hooks) + SignalR client (`@microsoft/signalr` v10) +
    header zili (`NotificationMenu.tsx`) gerçek API'ye + canlı güncellemeye bağlı + `notifications` i18n (tr/en).
  - **İlk tüketici:** 5 timetable event'i bağlandı (4 bildirim + Restored sessiz) — detay
    `modules/timetable/notifications.md` + `modules/timetable/completion_status.md`.

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği (≈106 `{{TBD}}` alanı) — spec büyük ölçüde dolmadı.
- **Debt-N1 (Outbox yok):** Pipeline event→Hangfire; gerçek crash-safe exactly-once Outbox gerektirir.
- **Debt-N2 (yalnız in-app + SignalR):** FCM push + email yok (FCM altyapısı + mobil tier yok).
- **Debt-N3 (sessiz saat + cooldown yok):** Quiet hours (22:00–07:00) + Redis cooldown uygulanmadı.
- **Debt-N4 (mobil bildirim ekranı yok):** Push entegrasyonu + in-app ekran ayrı tier.
- **Debt-N5 (tercih tabloları yok):** Per-kanal/per-tip kullanıcı bildirim tercihleri yok.
- Diğer modül event'lerinin bağlanması (timetable dışı: attendance/marks/homework/announcements/messaging vb.).

## ⚠️ Spec Dışına Çıkılanlar

- 2026-06-15 · **In-app çekirdek Outbox'sız (event→Hangfire):** CLAUDE.md transactional Outbox tarif eder;
  Faz 2.6'da event→Hangfire (Invitation deseni) ile kuruldu. Sebep: ilk tüketici (timetable) için tam
  exactly-once gereksiz; Teknik Analiz §10 yalnız event→Hangfire ister. Onay: kullanıcı (2026-06-15).
  Etki: in-app için kabul edilebilir çift-bildirim penceresi (Debt-N1/N6).
- 2026-06-15 · **Yalnız in-app + SignalR kanalı:** FCM push + email ertelendi (altyapı + mobil tier yok).
  Onay: kullanıcı (2026-06-15). Etki: kanal genişlemesi sonraki iş (Debt-N2).
