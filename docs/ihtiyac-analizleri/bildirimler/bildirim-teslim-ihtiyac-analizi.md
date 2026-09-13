# Bildirim Teslim Kanalı — İhtiyaç Analizi

| | |
|---|---|
| **Belge türü** | İhtiyaç analizi (ürün + iş perspektifi) |
| **Kapsam** | oksis-api + oksis-ui/apps/mobile |
| **Kanal kapsamı** | Push (FCM) + E-posta. SMS: hazırlık var, gönderim yok. |
| **Tarih** | 2026-07-31 |
| **Durum** | Karar bekliyor (Bölüm 8) |
| **Sonraki adım** | Teknik analiz (ayrı oturum) — bu belge "nasıl" sorusuna cevap vermez |

> **Not (belge formatı):** `../oksis/.claude/docs/analysis_standards.md` OKSİS teknik
> analizlerinin `.docx` üretilmesini şart koşar. Bu belge **teknik analiz değil,
> ihtiyaç belgesidir** ve kullanıcı açıkça markdown + repo içi yol istemiştir.
> Bir sonraki oturumda üretilecek **teknik analiz** o standarda uymalıdır
> (`bildirim_sistemi_analiz.docx`).

---

## 1. Yönetici Özeti

OKSİS'in bildirim çekirdeği çalışıyor: 14 event handler bildirim üretiyor, Hangfire
kuyruğu bunları taşıyor, alıcılar doğru çözümleniyor, in-app satırı yazılıyor ve
SignalR ile canlı basılıyor. Ancak zincirin son halkası tek kanaldan ibaret:
`Infrastructure/DependencyInjection.cs:191`'de `INotificationChannel` olarak **yalnız
`InAppNotificationChannel`** kayıtlı. Bunun pratik sonucu şudur: bir veli bildirimi
görmek için uygulamayı **kendisi açmak zorundadır**. Telefonuna hiçbir şey düşmez,
e-posta gitmez. Yoklama modülünün ürettiği tüm bildirimler — devamsızlık, mazeret
kararı, devamsızlık sınırı aşımı dahil — bugün ancak "veli merak edip uygulamaya
girerse" görülmektedir. Buna ek olarak Okul Ayarları ekranındaki bildirim
toggle'ları (E-posta, SMS, sessiz saatler, günlük SMS limiti) veritabanına
yazılmakta ama **gönderim yolunda hiç okunmamaktadır** — yönetici ayar yaptığını
sanmakta, ayarın hiçbir etkisi olmamaktadır.

**Bu iş bitmeden pilot çıkamayız, çünkü:**

1. `mvp-scope-rules.md:14` pilot başarı kriteri olarak *"Veli push notification'ları
   doğru zamanda alıyor"* maddesini sayıyor. Bugün veli **hiç** push almıyor —
   kriter %0 karşılanıyor, kısmen değil.
2. Devamsızlık sınırı aşımı bildirimi (`notification-priority.skill:60`'ta
   **Critical** sınıflandırılmış) bugün sessizce in-app listeye düşüyor. Veliye
   ulaşmayan bir "kritik" bildirim, okul için hukuki ve itibari risktir — okul
   "bildirdik" der, veli "görmedim" der, kayıt ikisini de haklı çıkarır.
3. Yönetici ekranında etkisi olmayan toggle göstermek, pilot okulun ürüne
   güvenini ilk haftada kırar. Ayar ya çalışmalı ya ekranda olmamalıdır — bu
   düzeltme kanal işinden ayrılamaz, çünkü toggle'ın anlamı ancak kanal varken
   doğar.

---

## 2. Sorunun Tanımı

### 2.1 Somut senaryo — "Elif 3. derste yok yazıldı"

**Bugün ne oluyor:**

Öğretmen 3. ders yoklamasını kaydediyor →
`AttendanceSubmittedEvent` raise ediliyor →
`AttendanceSubmittedNotificationHandler` çalışıyor
(`src/Oksis.Application/Modules/Attendance/Events/Notifications/AttendanceSubmittedNotificationHandler.cs:137`) →
ancak bu handler **yalnız 1. ders (Period=1) devamsızlığında** anlık bildirim
üretir (aynı dosya `:18`). Elif 3. derste yok yazıldığı için **anlık hiçbir şey
olmaz.** Elif'in velisi, gün sonunda `CloseDailySessionsJob` içindeki
`AttendanceDailySummaryNotifier` (`:104`) bir "Günlük Devamsızlık Özeti" satırı
yazana kadar hiçbir sinyal almaz. O satır da yalnızca in-app'tir: veli
uygulamayı açmazsa, telefonunda hiçbir iz kalmaz. Ertesi sabah uygulamayı
açarsa, zil rozetinde "Öğrencinizin bugünkü devamsızlık durumu güncellendi."
metnini görür (`AttendanceNotificationContent.cs:17`) — hangi çocuğu, hangi
dersi, kaç saat olduğu yazmaz.

Elif'in velisi iki çocuk sahibiyse, metin hangi çocuk için olduğunu da söylemez.

**Olması gereken:**

Aynı akış, dispatcher fan-out'unda in-app'in yanına push kanalını da alır. Veli
en geç birkaç dakika içinde telefonunda "Devamsızlık Bildirimi — Elif bugün
derse gelmedi" başlıklı bir push görür; dokununca uygulama doğrudan Elif'in o
günkü yoklama detayına açılır. Okulun sessiz saat ayarı 22:00–07:00 ise ve olay
gece yarısı üretildiyse push sabah 07:00'de düşer; devamsızlık sınırı aşımı
gibi kritik bir olay ise sessiz saati deler. Okul yöneticisi "E-posta"
toggle'ını kapatmışsa e-posta gitmez — ve bu kez toggle gerçekten çalışır.

### 2.2 Öğretmen tarafı

Öğretmen bir dersin yoklamasını girmemişse `SessionNotTakenNotificationHandler`
(`:73`) bir hatırlatma üretir. Bugün bu hatırlatma da yalnız in-app'tir:
öğretmen zaten uygulamada değilse hatırlatmayı göremez — yani hatırlatmanın
tek işlevsel amacı (uygulamada olmayan öğretmeni geri çağırmak) karşılanmıyor.

### 2.3 Kök neden

Sorun bildirim üretiminde değil, **teslimde**. Üretim tarafı olgun: idempotency,
tenant izolasyonu, post-commit enqueue, alıcı çözümleme hepsi yerinde. Eksik
olan tek şey, `INotificationChannel` arayüzünün ikinci ve üçüncü
implementasyonu ile bu implementasyonların ihtiyaç duyduğu üç veri parçası:
cihaz token'ı, alıcı tercihi ve gönderim durumu.

---

## 3. Mevcut Durum Envanteri

### 3.1 VAR — çalışan yapılar

| # | Yapı | Kanıt | Not |
|---|---|---|---|
| V-01 | `Notification` entity (in-app satırı) | `src/Oksis.Domain/Modules/Notifications/Entities/Notification.cs:10` | Kind, Title, Body, DeepLink, IsRead, ReadAt |
| V-02 | `NotificationDeliveryLog` entity | `.../Entities/NotificationDeliveryLog.cs:9` | Yalnız **başarı** satırı; hata/durum alanı yok |
| V-03 | `NotificationChannel` `[Flags]` enum | `.../Enums/NotificationChannel.cs:8-15` | `None=0, Push=1, Email=2, Sms=4, InApp=8` |
| V-04 | `NotificationKind` enum — 15 değer | `.../Enums/NotificationKind.cs` | Timetable 5, Duty 1, Enrollment 1, Attendance 8 |
| V-05 | `NotificationDispatcher` (fan-out) | `src/Oksis.Infrastructure/Notifications/NotificationDispatcher.cs:21` | Kanal × alıcı döngüsü; kanal listesi DI'dan |
| V-06 | `InAppNotificationChannel` | `.../Notifications/InAppNotificationChannel.cs:13` | `Name => "in-app"` |
| V-07 | `NotificationRecipientResolver` | `.../Notifications/NotificationRecipientResolver.cs:19` | Şube / öğretmen / veli / okul yöneticisi çözümleme, açık `SchoolId` filtresi |
| V-08 | `HangfireNotificationEnqueuer` (post-commit) | `.../Notifications/HangfireNotificationEnqueuer.cs:21` | `IPostCommitDispatcher` ile commit sonrasına ertelenir |
| V-09 | `DispatchNotificationJob` (Hangfire) | `src/Oksis.Infrastructure/BackgroundJobs/Jobs/DispatchNotificationJob.cs:16` | Tenant context'i job içinde set eder |
| V-10 | `NotificationHub` (SignalR) | `src/Oksis.Api/Hubs/NotificationHub.cs:17`, map: `Program.cs:277` | `[Authorize]`, grup `{schoolId}:{accountId}` |
| V-11 | `SignalRNotificationPusher` | `src/Oksis.Api/Hubs/SignalRNotificationPusher.cs:11`, DI: `Program.cs:151` | Application portu `INotificationRealtimePusher` |
| V-12 | `NotificationsController` — 4 uç | `src/Oksis.Api/Controllers/V1/NotificationsController.cs:25,39,47,56` | Liste, unread-count, read, read-all. Self-scope, permission yok (`:17`) |
| V-13 | `NotificationConfig` (okul bazlı ayar) | `src/Oksis.Domain/Modules/Schools/Entities/NotificationConfig.cs:11-43` | `PushEnabled`, `EmailEnabled`, `SmsEnabled`, `LateArrivalNotify`, `QuietHours*`, `DailySmsLimit`, eşikler |
| V-14 | `NotificationRuleConfig` (olay×kanal matrisi) | `.../Schools/Entities/NotificationRuleConfig.cs:11-26` | Okul bazlı, olay başına satır. **Portal/E-posta/SMS var; Push kolonu YOK** |
| V-15 | Ayar uçları (`SchoolSettingsController`) | `:550` GET, `:563` PUT `notification-config`; `:579` GET `sms-quota` | |
| V-16 | `NotificationEventType` master kataloğu — 8 olay | `src/Oksis.Infrastructure/Persistence/Seed/MasterData/NotificationEventTypeSeedData.cs:14-38` | `ATT_THRESHOLD`, `ATT_DAILY_SUMMARY`, `GRADE_PUBLISHED`, `REPORT_CARD_PUBLISHED`, `PAYMENT_REMINDER`, `PAYMENT_RECEIVED`, `ANNOUNCEMENT`, `ANNOUNCEMENT_URGENT` |
| V-17 | `NotificationType` master kataloğu — 10 kod | `.../MasterData/NotificationTypeSeedData.cs:7-23` | Her satırda `Channels` flag'i (ör. `ATT_ABSENT = Push\|Email`) |
| V-18 | `IEmailSender` + `SmtpEmailSender` (MailKit) | `src/Oksis.Application/Common/Abstractions/IEmailSender.cs:19`, `src/Oksis.Infrastructure/Email/SmtpEmailSender.cs:17`, DI: `DependencyInjection.cs:115-116` | **Kayıtlı ve çalışır durumda.** `SmtpOptions.Enabled=false` ise sessizce no-op |
| V-19 | Redis cooldown (devamsızlık eşiği) | `src/Oksis.Application/Modules/Attendance/Abstractions/IAbsenceCalculator.cs:9-10`, `src/Oksis.Infrastructure/Attendance/AbsenceCalculator.cs:34` | Anahtar `attendance:threshold-cooldown:{studentPersonId}`, TTL 24h |
| V-20 | `School.TimeZone` | `src/Oksis.Domain/Modules/Schools/Entities/School.cs:55,97` | Default `Europe/Istanbul` — sessiz saat için kaynak mevcut |
| V-21 | KVKK rıza altyapısı | `src/Oksis.Domain/Modules/Users/Enums/ConsentType.cs:6-12`, `.../Entities/ConsentRecord.cs`, `ConsentBundle.cs`, `src/Oksis.Infrastructure/Identity/ConsentGate.cs` | Tipler: `DataProcessing`, `Marketing`, `PhotoUsage`, `HealthData` |
| V-22 | Bildirim metin sınıfları (kodda) | `AttendanceNotificationContent.cs:7`, `DutyNotificationContent.cs:7`, `TimetableNotificationContent.cs:10`, `Students/Events/RenewalNotificationContent.cs` | Sabit TR metinleri, parametresiz |
| V-23 | Mobil bildirim listesi ekranı | `oksis-ui/apps/mobile/src/app/notifications.tsx`, `.../features/notifications/components/notif-list-screen.tsx` | Rol-agnostik tek liste |
| V-24 | Mobil canlı abonelik (SignalR) | `oksis-ui/apps/mobile/src/features/notifications/use-notifications-realtime.ts`, `oksis-ui/packages/api/src/notifications/realtime.ts` | Test: `packages/api/src/notifications/realtime.test.ts` |
| V-25 | Web bildirim ayar ekranı | `oksis-ui/apps/web/features/settings/notification-tab.tsx` | Matris (Portal/E-posta/SMS), sessiz saat, günlük SMS limiti, SMS kotası kartı |
| V-26 | Teknik borç kaydı (registry) | `../oksis/.claude/docs/modules/notifications/completion_status.md:43-48` | **Debt-N1…N5 listeli.** `Debt-N6` bu listede yok |

### 3.2 YOK — kritik boşluklar

| # | Eksik | Kanıt | Etki |
|---|---|---|---|
| Y-01 | **Push (FCM) kanalı** | `DependencyInjection.cs:190-196` — yalnız `InAppNotificationChannel` kayıtlı. `FirebaseAdmin`/`FirebaseMessaging` paketi hiçbir `.csproj`'da yok; `FCM` kelimesi kodda tek yerde, o da yorum: `NotificationConfig.cs:21` | Veli hiç push almıyor — pilot kriteri karşılanmıyor |
| Y-02 | **E-posta bildirim kanalı** (`INotificationChannel` impl'i) | Aynı DI bloğu. `IEmailSender` **var** (V-18) ama bildirim dispatch'ine bağlı değil | E-posta altyapısı hazır, bildirimle bağı yok |
| Y-03 | **Cihaz token tablosu** | `UserDevice` / `DeviceToken` araması tüm `src/` altında boş döndü | Push kime gönderileceği bilinemiyor |
| Y-04 | **Bildirim şablon tablosu** | `NotificationTemplate` / `notification_templates` araması boş. Metinler C# sabitleri (V-22) | Okula özel metin, i18n, kanal-başına metin imkânsız (Debt-N2) |
| Y-05 | **Ayar toggle'larının gönderim yolunda okunması** | `NotificationConfigs` / `NotificationRuleConfigs` DbSet'lerine **yalnız** Schools modülünden erişiliyor: `GetNotificationConfigQueryHandler.cs:35,58`, `UpdateNotificationConfigCommandHandler.cs:49,111`, `GetSchoolSettingsQueryHandler.cs:66`. `NotificationDispatcher.cs`, `InAppNotificationChannel.cs`, `DispatchNotificationJob.cs`, `HangfireNotificationEnqueuer.cs`, `NotificationRecipientResolver.cs` dosyalarının **hiçbirinde** bu isimler geçmiyor | **Ayar ekranı sahte.** Yönetici E-posta'yı kapatır, hiçbir şey değişmez |
| Y-06 | **Kullanıcı bazlı bildirim tercihi** | Yalnız okul bazlı `NotificationConfig` + `NotificationRuleConfig` var; kullanıcı/hesap kırılımlı tablo yok (Debt-N5) | Veli "sadece devamsızlık istiyorum" diyemez |
| Y-07 | **Genel cooldown / throttle** | Cooldown yalnız devamsızlık eşiği için (V-19) ve o da domain-event **üretimini** kısıtlar, kanal teslimini değil. Dispatch yolunda hiçbir throttle yok (Debt-N3) | Bildirim yağmuru riski; `notification-priority.skill:96-103` bunu yasaklıyor |
| Y-08 | **Sessiz saat uygulaması** | `QuietHours*` alanları yalnız CRUD'da (Y-05 ile aynı kanıt). Dispatch yolunda saat kontrolü yok | 22:00'de push gider; kural `notification-matrix.md:30` |
| Y-09 | **Outbox tablosu** | `NotificationDispatcher.cs:15` XML doc'unda **Debt-N1** olarak açıkça kayıtlı; kodda outbox tablosu yok | Çökme penceresinde mükerrer/kayıp teslim (Debt-N6, `NotificationDispatcher.cs:31-40`) |
| Y-10 | **Teslim durumu / hata kaydı** | `NotificationDeliveryLog.cs:13-19` — alanlar yalnız `EventId, RecipientAccountId, Channel, DeliveredAt`. `sent_at`/`failed_at`/`error`/`provider_msg_id` yok (`notification-rules.md:204-217` bunları şart koşuyor) | Push başarısız oldu mu bilinemez; ölçüm ve destek imkânsız |
| Y-11 | **Mobilde push altyapısı** | `oksis-ui/apps/mobile/package.json`'da `expo-notifications` yok (`expo-device` var, `:13`). `apps/mobile/app.json` plugin listesinde push eklentisi ve `google-services` yapılandırması yok | Cihaz token üretilemiyor, push alınamıyor (Debt-N4) |
| Y-12 | **Push deep-link yönlendirmesi** | `apps/mobile/app.json` `android.intentFilters` yalnız `/invite` prefix'ini kapsıyor; iOS `associatedDomains: applinks:app.oksis.net` genel | Push'a dokununca doğru ekrana gitmez |
| Y-13 | **Web ayar ekranında Push toggle'ı** | `pushEnabled` API sözleşmesinde ve core tiplerinde var (`oksis-ui/packages/core/src/notifications/types.ts:61,103`) ama `apps/web/features/settings/notification-tab.tsx` içinde hiç render edilmiyor | Ayarın UI karşılığı bile yok |
| Y-14 | **Alıcı e-posta adresinin bildirim yolunda çözümlenmesi** | E-posta `Person.PrimaryEmail` üzerinde (`src/Oksis.Domain/Modules/Users/Entities/Person.cs:27`). `NotificationRecipientResolver` yalnız `Account.Id` döndürüyor (`:46,55,69`) | E-posta kanalı adres bulamaz |
| Y-15 | **Kullanıcı dili / saat dilimi** | `Account.cs`'te dil veya saat dilimi alanı yok; yalnız `School.TimeZone` (V-20) | Kişi bazlı sessiz saat ve dil imkânsız — okul bazlı zorunlu |

### 3.3 Brief'teki tespitlerin doğrulama sonucu

Görev tanımındaki tespitleri kod üzerinde doğruladım. Dördü düzeltme gerektiriyor:

| Brief'te yazan | Doğrulama | Düzeltme |
|---|---|---|
| "18 handler `INotificationEnqueuer` kullanıyor" | **14 handler sınıfı, 16 `Enqueue` çağrı noktası** | 4 sınıf iki farklı alıcı grubuna ayrı çağrı yapıyor (`AbsenceThresholdReached` veli+idare, `AmendmentRequestDecided` öğretmen+veli). Ayrıca brief'te sayılmayan `AttendanceDailySummaryNotifier` var. Tam liste Bölüm 3.4'te |
| "Cooldown / throttle mekanizması YOK" | **Kısmen yanlış** | Devamsızlık eşiği için Redis cooldown VAR (V-19). Eksik olan, dispatch yolunda **genel** bir throttle (Y-07) |
| "Debt'leri listeleyen bir registry YOK" | **Yanlış** | `../oksis/.claude/docs/modules/notifications/completion_status.md:43-48` Debt-N1…N5'i listeliyor. `Debt-N6` bu listede eksik (kodda `NotificationDispatcher.cs:31`, `SessionNotTakenNotificationHandler.cs:25`, `AttendanceSession.cs`'te geçiyor) |
| "Kullanıcı bazlı bildirim tercihi YOK (yalnız okul bazlı config var)" | **Doğru, ama eksik** | Okul bazlı ayar tek katman değil: **iki** katman var — genel `NotificationConfig` (V-13) **ve** olay×kanal matrisi `NotificationRuleConfig` (V-14). İkisi de okunmuyor |

Diğer tüm tespitler doğrulandı.

### 3.4 Bildirim üreten handler'lar (tam envanter)

`INotificationEnqueuer.Enqueue` çağıran 14 sınıf, 16 çağrı noktası. Öncelik sütunu
`notification-priority.skill:53-75` ve `notification-matrix.md:38-44` ile
eşleştirilmiştir; **`—` işareti o olayın kanonik matriste karşılığı olmadığını**
gösterir (Bölüm 4.3).

| # | Handler (dosya:satır) | Olay | `NotificationKind` | Alıcı grubu | Kanonik öncelik |
|---|---|---|---|---|---|
| 1 | `Timetable/.../SchedulePublishedNotificationHandler.cs:38` | Ders programı yayınlandı | `TimetablePublished` | Şube tüketicileri (öğrenci + veli) | — |
| 2 | `Timetable/.../ScheduleExceptionCreatedNotificationHandler.cs:63` | Vekalet / derslik değişikliği veya ders iptali | `TimetableException` / `TimetableCancelled` (`:56-57`) | Şube tüketicileri + eski/yeni öğretmen | — |
| 3 | `Timetable/.../ScheduleExceptionRevokedNotificationHandler.cs:38` | Geçici değişiklik geri alındı | `TimetableExceptionRevoked` | Şube tüketicileri | — |
| 4 | `Timetable/.../ScheduleProgramDeletedNotificationHandler.cs:39` | Program silindi | `TimetableProgramDeleted` | Şube tüketicileri | — |
| 5 | `Duties/.../DutyRosterPublishedNotificationHandler.cs:46` | Nöbet çizelgesi yayınlandı | `DutyRosterPublished` | Öğretmen | — |
| 6 | `Students/Events/EnrollmentRenewedEventHandler.cs:44` | Kayıt yenilendi | `EnrollmentRenewed` | Veli | — |
| 7 | `Attendance/.../AttendanceSubmittedNotificationHandler.cs:137` | 1. ders devamsızlığı | `AttendanceAbsent` | Veli | **Instant** (`skill:59`) |
| 8 | `Attendance/.../AttendanceDailySummaryNotifier.cs:104` | Gün sonu devamsızlık özeti | `AttendanceDailySummary` | Veli | **Batched / Low** (`matrix:44`) |
| 9 | `Attendance/.../SessionNotTakenNotificationHandler.cs:73` | Yoklama girilmedi (gün içi dürtme) | `AttendanceReminder` | Öğretmen | — |
| 10 | `Attendance/.../ExcuseDecidedNotificationHandler.cs:62` | Mazeret onay / red | `ExcuseDecided` | Veli | — |
| 11a | `Attendance/.../AmendmentRequestDecidedNotificationHandler.cs:53` | Düzeltme talebi kararı | `AmendmentRequestDecided` | **Öğretmen** (talebi açan) | — |
| 11b | `Attendance/.../AmendmentRequestDecidedNotificationHandler.cs:78` | Düzeltme talebi kararı | `AmendmentRequestDecided` | **Veli** | — |
| 12 | `Attendance/.../DailyLeaveGrantedNotificationHandler.cs:56` | Gün içi izin verildi | `DailyLeaveGranted` | Veli | — |
| 13 | `Attendance/.../ActivityBulkExcusedNotificationHandler.cs:76` | Etkinlik toplu mazereti | `ActivityBulkExcused` | Veli | — |
| 14a | `Attendance/.../AbsenceThresholdReachedNotificationHandler.cs:64` | Devamsızlık eşiği / sınır aşımı | `AbsenceThresholdReached` | **Veli** | **Critical** (`skill:60`) |
| 14b | `Attendance/.../AbsenceThresholdReachedNotificationHandler.cs:86` | Devamsızlık sınırı **aşıldı** | `AbsenceThresholdReached` | **Okul yöneticisi** | **Critical** (`skill:60`) |

**Okuma:** 16 çağrı noktasının **yalnız 4'ünün** kanonik matriste öncelik karşılığı
var. Kalan 12'si için kanal ve öncelik kararı henüz verilmemiştir (Bölüm 8, S-6).

---

## 4. Paydaş İhtiyaçları

### 4.1 Rol bazlı ihtiyaç tablosu

| Rol | Hangi bildirim | Hangi kanal | Ne kadar hızlı | Neyi kapatabilmeli |
|---|---|---|---|---|
| **Veli** | Devamsızlık sınırı aşıldı (`AbsenceThresholdReached`) | Push + In-app + E-posta | Olaydan itibaren **≤ 2 dk**, sessiz saat delinerek | **Kapatamaz** (kritik/kurumsal) |
| **Veli** | Çocuk derse gelmedi (`AttendanceAbsent`) | Push + In-app | **≤ 5 dk** | Kanal bazında kapatabilir; olay olarak kapatamaz |
| **Veli** | Gün sonu devamsızlık özeti (`AttendanceDailySummary`) | Push (tek, gün sonu) + In-app | Gün sonu toplu, **aynı gün içinde** | Kapatabilir |
| **Veli** | Mazeret / düzeltme kararı (`ExcuseDecided`, `AmendmentRequestDecided`) | Push + In-app | **≤ 15 dk** | Kapatabilir |
| **Veli** | Gün içi izin, etkinlik mazereti (`DailyLeaveGranted`, `ActivityBulkExcused`) | In-app (push opsiyonel) | Aynı gün | Kapatabilir |
| **Veli** | Ders programı / vekalet değişikliği (`Timetable*`) | Push + In-app | **≤ 30 dk** | Kapatabilir |
| **Veli** | Kayıt yenilendi (`EnrollmentRenewed`) | E-posta + In-app | Aynı gün | E-postayı kapatabilir |
| **Öğretmen** | Yoklama girilmedi hatırlatması (`AttendanceReminder`) | Push + In-app | **≤ 5 dk** (ders süresi kısa; geç bildirim değersiz) | Kapatabilir |
| **Öğretmen** | Düzeltme talebi kararı | Push + In-app | ≤ 30 dk | Kapatabilir |
| **Öğretmen** | Nöbet çizelgesi yayınlandı (`DutyRosterPublished`) | Push + In-app + E-posta | Aynı gün | Push'u kapatabilir, e-postayı kapatamaz (operasyonel kayıt) |
| **Öğretmen** | Ders programı değişikliği (kendi dersini etkileyen) | Push + In-app | **≤ 15 dk** | Kapatamaz (görevi doğrudan etkiler) |
| **Yönetici (SchoolAdmin)** | Devamsızlık sınırı aşıldı | In-app + E-posta (günlük özet) | Aynı gün | Push'u kapatabilir |
| **Yönetici** | Okul geneli kanal/olay ayarı yönetimi | (ayar ekranı — bildirim değil) | — | Okul adına tüm kanalları kapatabilir |
| **Öğrenci** | Ders programı / vekalet değişikliği | In-app (+ push, hesabı varsa) | ≤ 30 dk | Kapatabilir |
| **Öğrenci** | Kendi devamsızlığı | In-app | Aynı gün | Kapatabilir |

### 4.2 Alıcı çözümleme sınırı (mevcut kod)

`NotificationRecipientResolver` bugün 4 alıcı tipi çözüyor: şube tüketicileri
(öğrenci + veli), öğretmen, veli listesi, okul yöneticisi (`:22,49,58,98`).
Yukarıdaki tabloda yeni bir alıcı tipi ihtiyacı **yoktur** — mevcut çözümleyici
bu ihtiyaçları karşılar. Eksik olan tek şey, e-posta kanalı için hesap→adres
eşlemesidir (Y-14).

### 4.3 `notification-matrix.md` ile çelişkiler ⚠

Kanonik matris, kodun bugünkü gerçekliğiyle üç noktada çelişiyor. Bunlar
düzeltilmeden kanal kararı verilemez:

| # | Çelişki | Kanonik kaynak | Koddaki gerçek |
|---|---|---|---|
| **Ç-1** | **Matris, olmayan modülleri tarif ediyor.** Kanonik matrisin Yoklama dışındaki tüm blokları (Not, Ödev, Duyuru, Mesajlaşma) henüz kodda karşılığı olmayan event'lerdir | `notification-matrix.md:46-104` | Kodda `MarkPublishedEvent`, `HomeworkAssignedEvent`, `AnnouncementPublishedEvent` yok |
| **Ç-2** | **Kodun ürettiği olayların çoğu matriste yok.** Timetable (5), Duty (1), Enrollment (1), mazeret/izin/düzeltme (5) — toplam 12 olay için kanonik matriste satır yok | `notification-matrix.md:36-44` yalnız 5 yoklama satırı içeriyor | Bölüm 3.4'teki 16 çağrı noktası |
| **Ç-3** | **Ayar matrisi kataloğu ile üretilen olaylar örtüşmüyor.** Ayarlar ekranındaki 8 olayın yalnız 2'si (`ATT_THRESHOLD`, `ATT_DAILY_SUMMARY`) gerçekten üretiliyor; `GRADE_PUBLISHED`, `REPORT_CARD_PUBLISHED`, `PAYMENT_REMINDER`, `PAYMENT_RECEIVED`, `ANNOUNCEMENT`, `ANNOUNCEMENT_URGENT` için kod hiç bildirim üretmiyor | `NotificationEventTypeSeedData.cs:14-38` | Bölüm 3.4 |

**Ç-3'ün pratik sonucu:** Yönetici bugün ayar ekranında **6 hayalet olay** için
toggle çeviriyor, buna karşılık gerçekten üretilen **13 olay** için hiç toggle
göremiyor. Bu, Y-05'ten (toggle'ın okunmaması) bağımsız ikinci bir kırıklıktır ve
Y-05 düzeltilse bile kendiliğinden çözülmez.

**Ek çelişki (kaynak içi):** Kanonik matrisin kendi içinde de iki farklı
sınıflandırma var — `notification-matrix.md:22-28` dört seviye
(`Critical/High/Normal/Low`), `notification-priority.skill:20-26` başka dört
seviye (`Critical/Instant/Batched/Silent`) tanımlıyor. Bunlar birebir eşlenmiyor
(`Batched` ile `Low` aynı şey mi?). Tek bir sınıflandırmaya indirilmelidir
(Bölüm 8, S-6).

---

## 5. Fonksiyonel Gereksinimler

| Kod | Gereksinim | Rol | Öncelik | Kabul kriteri |
|---|---|---|---|---|
| **FR-01** | Sistem, bildirimi in-app'e ek olarak **push (FCM)** kanalından da teslim eder | Veli, Öğretmen, Öğrenci | **Zorunlu** | Test okulunda 1. ders devamsızlığı kaydedildikten sonra, uygulaması kapalı velinin telefonunda **60 sn içinde** push bildirimi görünür |
| **FR-02** | Sistem, kullanıcının **cihaz push token'ını** kaydeder ve günceller | Tüm roller | **Zorunlu** | Kullanıcı mobil uygulamaya giriş yaptıktan sonra sunucuda o hesap için geçerli bir token kaydı bulunur; token değiştiğinde eski kayıt gönderim için kullanılmaz |
| **FR-03** | Bir kullanıcının **birden fazla cihazı** olabilir; bildirim tüm geçerli cihazlara gider | Tüm roller | **Zorunlu** | İki cihazdan giriş yapmış velinin her iki cihazında da aynı bildirim görünür |
| **FR-04** | Sağlayıcı "token geçersiz" yanıtı verdiğinde o cihaz kaydı **gönderim dışına alınır** | Tüm roller | **Zorunlu** | Uygulaması silinmiş cihaz için ikinci bir gönderim denemesi yapılmaz; sistem bu cihazı 24 saat içinde kullanmaz |
| **FR-05** | Sistem, bildirimi **e-posta** kanalından da teslim eder | Veli, Öğretmen, Yönetici | **Zorunlu** | E-posta kanalı açık bir olayda, alıcının kayıtlı adresine **5 dk içinde** e-posta ulaşır; ulaşmazsa hata olarak kayıtlanır |
| **FR-06** | E-posta adresi olmayan alıcı için gönderim **sessizce atlanır**, hata üretmez, diğer kanalları etkilemez | Tüm roller | **Zorunlu** | Adresi olmayan 1 alıcı içeren 10 kişilik bir gönderimde 9 e-posta gider, 1 atlanır, push 10 kişiye gider |
| **FR-07** | `NotificationConfig` kanal toggle'ları (**PushEnabled / EmailEnabled**) gönderim yolunda **okunur ve uygulanır** | Yönetici (ayarlayan), tüm roller (etkilenen) | **Zorunlu** | Yönetici "E-posta"yı kapatıp kaydettikten sonra üretilen bir sonraki bildirim için hiç e-posta gönderilmez; push ve in-app gitmeye devam eder |
| **FR-08** | Olay×kanal matrisi (`NotificationRuleConfig`) gönderim yolunda **okunur ve uygulanır** | Yönetici, tüm roller | **Zorunlu** | Yönetici "Uyarı eşiği aşıldı" olayı için E-posta'yı kapattığında, o olayda e-posta gitmez; diğer olaylarda e-posta gitmeye devam eder |
| **FR-09** | Ayar ekranındaki olay listesi, sistemin **gerçekten ürettiği** olayları gösterir; üretilmeyen olay listelenmez | Yönetici | **Zorunlu** | Ayar ekranında listelenen her olay için, sistemde o olayı üreten en az bir handler vardır (Ç-3 kapanır) |
| **FR-10** | Ayar ekranı **Push kanalını** da gösterir ve yönetilebilir kılar | Yönetici | **Zorunlu** | Ayar ekranında Push için bir toggle bulunur; kapatıldığında hiçbir push gönderilmez (Y-13 kapanır) |
| **FR-11** | Sessiz saat aralığında üretilen **kritik olmayan** push bildirimleri ertelenir | Veli, Öğretmen, Öğrenci | **Zorunlu** | Sessiz saati 22:00–07:00 olan okulda 23:00'te üretilen normal öncelikli bildirim, telefona ertesi gün 07:00–07:15 arasında düşer; in-app satırı 23:00'te yazılmıştır |
| **FR-12** | **Kritik** bildirimler sessiz saati deler | Veli, Yönetici | **Zorunlu** | Sessiz saatte üretilen devamsızlık sınırı aşımı bildirimi, telefona **2 dk içinde** düşer |
| **FR-13** | Aynı alıcıya aynı olay tipinden kısa aralıkla tekrar eden push, **bastırılır** | Tüm roller | **Zorunlu** | Aynı veliye aynı olay tipinden 5 dk içinde 2. bildirim üretilirse ikincisi push olarak gönderilmez, in-app listede görünür ve "bastırıldı" olarak kayıtlanır |
| **FR-14** | Her kanal denemesinin **sonucu** (gönderildi / başarısız / atlandı + sebep) kayıt altına alınır | Yönetici, destek ekibi | **Zorunlu** | Bir push gönderimi başarısız olduğunda, hangi alıcı / hangi kanal / hangi hata bilgisi sorgulanabilir durumdadır |
| **FR-15** | Geçici hatada gönderim **yeniden denenir**; kalıcı hatada denenmez | — (sistem) | **Zorunlu** | Sağlayıcı 5xx döndüğünde en az 3 kez artan aralıkla tekrar denenir; "token geçersiz" yanıtında hiç tekrar denenmez |
| **FR-16** | Push'a dokunulduğunda uygulama **ilgili ekrana** açılır | Veli, Öğretmen, Öğrenci | **Zorunlu** | Devamsızlık push'una dokunan veli, doğrudan ilgili yoklama ekranına düşer; uygulama kapalıyken de aynı davranır |
| **FR-17** | Kullanıcı, uygulama içinden **bildirim izni** verebilir; izin yoksa uygulama bunu açıkça belirtir | Tüm roller | **Önemli** | Bildirim izni kapalı kullanıcıya uygulama içinde "bildirimler kapalı" uyarısı ve ayarlara yönlendirme gösterilir |
| **FR-18** | Bildirim gövdesinde **hangi çocuk** olduğu belirtilir (çok çocuklu veli) | Veli | **Önemli** | İki çocuğu olan velinin aldığı devamsızlık bildiriminde çocuğun adı yer alır ve doğru çocuğu gösterir |
| **FR-19** | Yönetici, bir bildirimin **teslim edilip edilmediğini** görebilir | Yönetici | **İsteğe bağlı** | Yönetici bir olayı seçip "kaç kişiye gitti, kaçı başarısız" bilgisini görüntüleyebilir |
| **FR-20** | SMS kanalı için **hazırlık** yapılır; gönderim yapılmaz | Yönetici | **İsteğe bağlı** | Ayar ekranındaki SMS toggle'ı ve kota kartı, gerçek gönderim olmadığını kullanıcıya açıkça bildirir (bugün `IsPlaceholder=true` ile veri düzeyinde var, `GetSmsQuotaQueryHandler.cs:37`) |

**Özet:** 16 Zorunlu · 2 Önemli · 2 İsteğe bağlı.

---

## 6. Fonksiyonel Olmayan Gereksinimler

| Kod | Gereksinim | Hedef / Sınır | Ölçüm |
|---|---|---|---|
| **NFR-01** | **Teslim gecikmesi — kritik** | Olay üretiminden cihazda görünmeye kadar **p95 ≤ 60 sn**, p99 ≤ 120 sn | Olay zamanı ile sağlayıcıya teslim zamanı arasındaki fark |
| **NFR-02** | **Teslim gecikmesi — normal** | p95 ≤ 5 dk | Aynı ölçüm |
| **NFR-03** | **Teslim gecikmesi — e-posta** | p95 ≤ 10 dk | SMTP kabul zamanı |
| **NFR-04** | **Başarı oranı — push** | Geçerli token'a sahip alıcılar için sağlayıcıya başarılı teslim **≥ %98** | Başarılı / (başarılı + kalıcı hata) |
| **NFR-05** | **Başarı oranı — e-posta** | SMTP kabul **≥ %99** | Aynı |
| **NFR-06** | **Retry davranışı** | Geçici hatada en az 3, en çok 5 deneme; artan aralık; toplam pencere ≤ 6 saat. Kalıcı hatada (geçersiz token, geçersiz adres) **tekrar yok** | Denemeler kayıtlanır |
| **NFR-07** | **Çoklu cihaz** | Hesap başına en az **5** aktif cihaz desteklenir; en eski token'lar bunun üzerinde düşürülür | Cihaz sayısı |
| **NFR-08** | **Mükerrer teslim** | Aynı (olay, alıcı, kanal) üçlüsü için **en fazla bir** teslim. Bugünkü garanti steady-state'te sağlanıyor (`NotificationDispatcher.cs:11-13`), çökme penceresinde sağlanmıyor (Debt-N6, `:31-40`) | Teslim kaydı tekilliği |
| **NFR-09** | **Dil** | Bildirim metinleri **yalnız Türkçe**. Çok dil MVP dışı (`mvp-scope-rules.md:117`) | — |
| **NFR-10** | **Saat dilimi** | Sessiz saat hesabı **okulun** saat diliminde yapılır (`School.TimeZone`, `School.cs:55`), sunucu UTC'sinde değil | Sınır saatlerinde test |
| **NFR-11** | **PII — bildirim gövdesi** | Bkz. Bölüm 7. Gövdede T.C. kimlik no, adres, telefon, e-posta, sağlık verisi, disiplin kararı, tam not değeri **yer alamaz** | Metin denetimi |
| **NFR-12** | **PII — log** | Bildirim gövdesi ve alıcı adresi production log'una yazılmaz (`notification-rules.md:359`, `security-rules.md:289`) | Log denetimi |
| **NFR-13** | **Sessiz saat** | Varsayılan 22:00–07:00 (`notification-matrix.md:30`). Kritik olaylar delilir. Sessiz saatte in-app satırı **her hâlükârda** yazılır — ertelenen yalnız push/e-postadır | Davranış testi |
| **NFR-14** | **Gönderim penceresi** | Ertelenen bildirimler sabah **07:00–07:15** arasında dağıtılır (tek anda değil — sağlayıcı sınırı ve kullanıcı yorgunluğu) | Zaman dağılımı |
| **NFR-15** | **Tenant izolasyonu** | Cihaz token'ı, tercih ve teslim kaydı dahil tüm yeni veri okul bazlı izole edilir; cross-tenant teslim **imkânsız** olmalıdır | Cross-tenant testi (`security-rules.md:11`) |
| **NFR-16** | **Sağlayıcı kesintisi** | Push sağlayıcısı erişilemez olduğunda in-app ve e-posta teslimi **etkilenmez** | Kanal izolasyon testi |
| **NFR-17** | **Günlük hacim** | Bkz. 6.1 — steady state ≈ **1.100 teslim/gün**, tepe ≈ **4.000 teslim/dk** | Kapasite testi |

### 6.1 Günlük hacim tahmini

Pilot okul büyüklüğü ne `mvp-scope-rules.md`'de ne `project-context.md`'de sayı
olarak yazılıdır — **aşağıdaki rakamlar açıkça belirtilmiş varsayımlara
dayanır**, doğrulanmış veri değildir. Varsayımlar pilot sözleşmesi netleşince
güncellenmelidir.

**Varsayımlar:** 2 pilot okul · okul başına 600 öğrenci · öğrenci başına 1,6 aktif
veli hesabı · okul başına 45 öğretmen · günlük devamsızlık oranı %5 · cihaz başına
1,3 aktif token.

| Olay | Günlük olay | Alıcı çarpanı | Günlük teslim (2 okul) |
|---|---|---|---|
| 1. ders devamsızlığı (`AttendanceAbsent`) | 60 öğrenci/okul | ×1,6 veli | ≈ 192 |
| Gün sonu özeti (`AttendanceDailySummary`) | 95 öğrenci/okul | ×1,6 veli | ≈ 304 |
| Öğretmen yoklama hatırlatması | ≈ 16 oturum/okul | ×1 öğretmen | ≈ 32 |
| Mazeret / izin / düzeltme / etkinlik | ≈ 15/okul | ×1,6 | ≈ 48 |
| Devamsızlık eşiği (veli + idare) | ≈ 3/okul | ×1,6 + idare | ≈ 15 |
| Ders programı / vekalet (günlük ortalama) | ≈ 4 değişiklik/okul | ×şube (~30 öğrenci ×2,6 hesap) | ≈ 600 |
| Nöbet / kayıt yenileme | seyrek | — | ≈ 20 |
| **Toplam (hesap bazında)** | | | **≈ 1.210 teslim/gün** |
| **Push cihaz bazında** (×1,3 token) | | | **≈ 1.100 push/gün** (in-app hariç) |
| **Aylık** (20 okul günü) | | | **≈ 24.000 teslim/ay** |

**Tepe yük:** Ders programı yayınlama tek işlemde tüm okulu vurur — 600 öğrenci ×
2,6 hesap ≈ **1.560 alıcı**, iki okul aynı hafta yayınlarsa dakikalar içinde
≈ **4.000 teslim**. Kapasite planı, günlük ortalamaya değil **bu tepeye** göre
yapılmalıdır.

**E-posta hacmi:** Yalnızca e-posta açık olaylarda. Bugünkü varsayılanlar
(`NotificationEventTypeSeedData.cs:17,25,29,31,37`) korunursa e-posta hacmi
günlük ≈ 20 civarında kalır — SMTP için kayda değer bir yük değildir. Bu, sağlayıcı
seçiminde SMTP'yi güçlü aday yapar (Bölüm 8, S-4).

---

## 7. KVKK ve İzin Gereksinimleri

### 7.1 Mevcut durum

OKSİS'te KVKK rıza altyapısı **kuruludur**: `ConsentBundle` (yürürlükteki
aydınlatma metni versiyonu, `ConsentBundleSeedData.cs:16-22`), `ConsentRecord`
(kişi bazlı rıza kaydı) ve `ConsentGate` (`src/Oksis.Infrastructure/Identity/ConsentGate.cs`).
Rıza tipleri: `DataProcessing`, `Marketing`, `PhotoUsage`, `HealthData`
(`ConsentType.cs:6-12`). `DataProcessing` davet kabulü için zorunludur (aynı
dosya `:5`).

**Kritik gözlem:** Rıza tipleri arasında **iletişim / bildirim rızası yoktur.**

### 7.2 Değerlendirme — açık rıza gerekir mi?

Bu, kesin cevabını hukuk danışmanının vermesi gereken bir sorudur; aşağıdaki
değerlendirme karar için hazırlıktır, hukuki görüş yerine geçmez.

Veliye giden bildirimlerin niteliği **işlemsel/sözleşmesel**dir: okul-veli
ilişkisinin ifasıdır (devamsızlık bildirimi, mazeret kararı). KVKK m.5/2(c)
"sözleşmenin ifası" istisnası bu bildirimleri kapsıyor görünmektedir — yani
**ayrı bir açık rıza gerekmeyebilir**, aydınlatma yükümlülüğü yeterli olabilir.
Buna karşılık:

- **Kanal seçimi rıza gerektirebilir.** Özellikle e-posta ve (ileride) SMS için
  "ticari elektronik ileti" mevzuatı (İYS) ile sınır belirsizdir. İşlemsel
  bildirim İYS kapsamı dışıdır, ancak sınırın nerede olduğu değerlendirilmelidir.
- **Cihaz token'ı kişisel veridir.** Toplanması aydınlatma metninde açıkça yer
  almalıdır; bugünkü `ConsentBundle` metninin bunu kapsayıp kapsamadığı
  doğrulanmamıştır (metin içeriği repoda yok, yalnız hash var —
  `ConsentBundleSeedData.cs:11-12`).
- **Mobil işletim sistemi izni ≠ KVKK rızası.** iOS/Android bildirim izni teknik
  bir izindir; KVKK aydınlatması ayrıca gereklidir.

### 7.3 Bildirim içeriği kuralları

| Kural | Karar | Dayanak |
|---|---|---|
| Öğrenci **adı** bildirim gövdesinde geçebilir mi? | **Evet, gerekli.** Alıcı zaten o öğrencinin velisidir; ad olmadan çok çocuklu veli bildirimi kullanamaz (FR-18). Ad, alıcının zaten bildiği veridir | `notification-priority.skill:214` yalnız **hassas içeriği** yasaklar, kimliği değil |
| T.C. kimlik no, adres, telefon | **Yasak** | `notification-rules.md:356` |
| Sağlık bilgisi (mazeret sebebi: rapor, hastalık) | **Yasak** — "mazeret onaylandı" yazılır, sebebi yazılmaz. Bugünkü metin zaten uyumlu (`AttendanceNotificationContent.cs:25`) | `notification-priority.skill:214`, `ConsentType.HealthData` ayrı rıza gerektiriyor |
| Disiplin kararı | **Yasak** (bu modülde zaten üretilmiyor) | `notification-priority.skill:214` |
| Tam not / puan değeri | **Yasak** — özet + deep link | `notification-priority.skill:214` |
| Devamsızlık **sayısı** (ör. "12 gün") | **Karar gerekli.** Sayı tek başına hassas değil ama kilit ekranında görünür ve öğrenci hakkında hüküm içerir. Öneri: gövdede sayı yok, "sınır aşıldı" + deep link | Bölüm 8, S-7 |
| Push gövdesinin **kilit ekranında** görünmesi | Gövde, telefonu eline alan herkes tarafından okunabilir kabul edilmelidir. Bu, "hassas içerik yasağı"nın gerçek gerekçesidir | — |
| Deep-link URL'inde token | **Yasak** | `notification-rules.md:357`, `security-rules.md:305` |

### 7.4 Veri yurt dışına aktarımı

`security-rules.md:278` açık: **"Sınır ötesi transfer: Veri TR'de tutulur
(sözleşme)."** Bu, kanal sağlayıcı seçimini doğrudan kısıtlar:

- **FCM (Google):** Push token ve bildirim gövdesi Google altyapısından geçer,
  yurt dışında işlenir. Push için pratik alternatif yoktur (Android'de FCM
  zorunlu, iOS'ta APNs). Bu, sözleşme metniyle **açıkça uzlaştırılması gereken
  bir istisnadır** — sessizce geçilemez.
- **E-posta:** SendGrid/SES yurt dışıdır. TR'de barındırılan SMTP bu kısıtı
  doğal olarak karşılar. Bölüm 8, S-4'ün KVKK boyutu budur ve maliyetten daha
  belirleyicidir.

### 7.5 Saklama ve silme

`notification-matrix.md:190-191`: bildirim 30 gün sonra arşivlenir, 6 ay sonra
sert silinir. Bugün kodda böyle bir temizlik işi **yoktur** (`Notification` ve
`NotificationDeliveryLog` için retention job bulunamadı). Cihaz token'ı için de
saklama süresi tanımlı değildir. Bu bir gereksinimdir, ancak MVP'de zorunlu
değildir — pilot 6 aydan kısa sürecektir. **Not olarak kayda geçirilir.**

---

## 8. Karar Gerektiren Sorular

> Bu tablodaki hiçbir soruya bu belge cevap **vermez**. Kararlar alınmadan
> teknik analize geçilmemelidir.

| # | Soru | Seçenekler | Önerim + gerekçe | Kim karar verir |
|---|---|---|---|---|
| **S-1** | Kullanıcı bazlı bildirim tercihi MVP'de mi, okul bazlı config yeterli mi? | **A)** Yalnız okul bazlı (mevcut iki katman çalışır hâle getirilir) · **B)** Kullanıcı bazlı tercih tablosu eklenir · **C)** Kullanıcı yalnız "tüm push'ları kapat" diyebilir, olay kırılımı yok | **C.** `mvp-guard.skill:126` net: *"Push customization: Türü değil sadece açık/kapalı toggle. Granular V2."* Ancak salt okul bazlı (A) yetersiz — veli kendi telefonundaki bildirimi kapatamamak kabul edilemez ve app store politikalarıyla da gerilimlidir. C, bu boşluğu tek alanla kapatır. Kanonik `notification-rules.md:135-150` B'yi tarif ediyor; bu, hedef mimari ile MVP arasında bilinçli bir sapmadır ve `completion_status.md`'ye Debt olarak yazılmalıdır | Ürün sahibi |
| **S-2** | Bildirim şablonları DB'ye mi taşınsın, kodda mı kalsın? | **A)** Kodda kalsın (mevcut) · **B)** DB'ye taşınsın (`notification-rules.md:283` tarif ediyor) · **C)** Kodda kalsın ama parametreleştirilsin (öğrenci adı, tarih değişken olsun) | **C.** B, okula özel metin düzenleme demektir — `mvp-guard.skill:149` bunu "configürasyon Sprint 5+" olarak işaretliyor ve MVP'de talep eden müşteri yok. Ama mevcut metinler tamamen sabit; FR-18 (hangi çocuk) sabit metinle karşılanamaz. C, FR-18'i minimum maliyetle çözer ve B'ye giden yolu kapatmaz | Ürün sahibi + teknik lider |
| **S-3** | Outbox pattern (Debt-N1) şimdi mi kapatılsın, sonra mı? | **A)** Şimdi — kanal işiyle birlikte · **B)** Sonra — mevcut event→Hangfire deseni korunur · **C)** Sonra, ama Debt-N6 çökme penceresi ayrıca daraltılır | **B.** Debt-N1 in-app için 2026-06-15'te kullanıcı onayıyla kabul edildi (`completion_status.md:52-55`). Push kanalı bu riski **artırır** (in-app mükerrer satır rahatsız edici, mükerrer push kullanıcı kaybettirir) — ancak Outbox'ı aynı işte kapatmak kapsamı en az iki katına çıkarır ve pilot tarihini riske atar. Kritik nokta: **bu bir kabul edilen risktir, unutulmuş bir eksik değil** — kararın `completion_status.md`'de açıkça yenilenmesi gerekir. C'yi ara çözüm olarak değerlendirmeye değer | Teknik lider (ürün sahibi bilgilendirilir) |
| **S-4** | E-posta sağlayıcısı: SMTP / SendGrid / SES? | **A)** TR'de barındırılan SMTP (mevcut `SmtpEmailSender` zaten hazır) · **B)** SendGrid · **C)** AWS SES | **A.** Üç gerekçe: (1) **KVKK** — `security-rules.md:278` veriyi TR'de tutmayı sözleşme gereği kılıyor; B ve C yurt dışıdır ve ek sözleşme/değerlendirme gerektirir. (2) **Maliyet** — tahmini hacim günde ≈20 e-posta (Bölüm 6.1); bu hacimde B/C'nin ücretsiz katmanı yeterli olurdu ama kurulum ve sözleşme maliyeti hacimle orantısız. (3) **Hazır olma** — `SmtpEmailSender` (`Infrastructure/Email/SmtpEmailSender.cs:17`) zaten kayıtlı ve çalışır durumda; sıfır entegrasyon işi. Karşı argüman: SMTP'de teslimat (deliverability) ve spam itibarı yönetimi okul/hosting sağlayıcısına kalır — pilotta kabul edilebilir, ölçeklenince yeniden değerlendirilir | Ürün sahibi + hukuk (KVKK boyutu) |
| **S-5** | Sessiz saatlerde biriken bildirim: ertelensin mi, düşsün mü, özetlensin mi? | **A)** Ertelensin — sabah 07:00'de tek tek gönderilsin · **B)** Düşsün — in-app'te kalsın, push hiç gitmesin · **C)** Özetlensin — sabah tek bir "3 yeni bildiriminiz var" push'u | **C.** `notification-matrix.md:149` *"sabah 07:00'de tek bir özet push"* diyor, `notification-priority.skill:107-123` batching algoritmasını tarif ediyor. A, sabah 07:00'de 5 push'la kullanıcıyı bunaltır ve `notification-priority.skill:141-147` yorgunluk metriklerini ihlal eder. B en ucuz ama bildirim değerini yok eder. **Ancak C, MVP için ek iş demektir** (özet metni üretimi + gruplama) — A ile başlayıp C'ye geçmek de savunulabilir bir yol. Gece üretilen bildirim hacminin düşük olduğuna dikkat: yoklama olayları okul saatlerinde üretilir | Ürün sahibi |
| **S-6** | Öncelik sınıflandırması hangisi olacak ve 16 çağrı noktasının 12'si için kanal/öncelik ne? | **A)** `notification-matrix.md:22-28` (Critical/High/Normal/Low) · **B)** `notification-priority.skill:20-26` (Critical/Instant/Batched/Silent) · **C)** Yeni, ikisini birleştiren tek liste | **Karar şart, öneri veremiyorum** — iki kanonik kaynak çelişiyor (Bölüm 4.3) ve hangisinin üstün olduğu belirsiz. Bu karar verilmeden FR-11/FR-12/FR-13 uygulanamaz, çünkü "kritik" tanımı yok. Kararla birlikte **Bölüm 3.4'teki 12 eşleşmemiş olay için** kanal + öncelik + cooldown atanmalı ve `notification-matrix.md` güncellenmelidir | Ürün sahibi + teknik lider |
| **S-7** | Bildirim gövdesinde devamsızlık **sayısı** yer alabilir mi? | **A)** Evet — "Elif 12 gün devamsız" · **B)** Hayır — "Elif devamsızlık sınırını aştı" + deep link · **C)** Yalnız e-postada evet, push'ta hayır | **B.** Push gövdesi kilit ekranında görünür; sayı, öğrenci hakkında hüküm içeren ve üçüncü kişilerce okunabilen bir veridir. `notification-priority.skill:214` "özet + deep link" diyor. C teknik olarak mümkün ama iki ayrı metin bakımı getirir — S-2'nin C seçeneği kabul edilirse tekrar değerlendirilebilir | Ürün sahibi + KVKK sorumlusu |
| **S-8** | Ayar ekranındaki 6 hayalet olay (`GRADE_PUBLISHED`, `REPORT_CARD_PUBLISHED`, `PAYMENT_*`, `ANNOUNCEMENT*`) ne olacak? | **A)** Ekrandan kaldırılsın, üretildikçe eklensin · **B)** Kalsın, "yakında" etiketiyle gösterilsin · **C)** Kalsın, gerçek olaylar da eklensin (13 olay daha) | **A.** Çalışmayan ayar göstermek Y-05'in tekrarıdır. Ancak bu, ayar ekranının olay listesini 8'den 2'ye düşürür — ürün sahibi bunun ekranı "boş" göstereceğinden endişe edebilir. C, ekranı 15 satıra çıkarır ve `mvp-guard.skill:126` granular tercih uyarısıyla gerilir. Karar S-1'e bağlıdır | Ürün sahibi |

---

## 9. Kapsam Sınırı — Bu İş NE DEĞİL

```
[mvp-guard]
Talep: Bildirim teslim kanalı (push + e-posta)
Sprint kapsamı: Sprint 2 — "Notification altyapısı (FCM provider, recipient resolver)"
                (mvp-scope-rules.md:51). Recipient resolver teslim edildi,
                FCM provider edilmedi.
Gerekçe:
- Müşteri karar faktörü: EVET — pilot çıkış kriteri (mvp-scope-rules.md:14)
- Operasyonel kritiklik: YÜKSEK — kritik bildirim veliye ulaşmıyor
- Alternatif: YOK — manuel telefon araması ölçeklenmez
Öneri: MVP'de yapalım — ancak aşağıdaki 8 madde kapsam DIŞI tutularak.
```

Aşağıdakiler bu işin parçası **değildir**. Kapsam büyütme talebi gelirse bu
listeye atıfla reddedilir:

| # | Kapsam dışı | Gerekçe |
|---|---|---|
| **K-1** | **Web push** (FCM Web SDK) | Kullanıcı kapsam kararı: yalnız oksis-api + apps/mobile. Web'de zaten SignalR canlı bildirim var |
| **K-2** | **SMS gönderimi** | `mvp-guard.skill:105` — *"SMS bildirimi: Maliyet + entegrasyon, push yeterli → V2."* Şema hazırlığı (`DailySmsLimit`, `supportsSms`, kota kartı) korunur, sağlayıcı entegrasyonu yapılmaz. Sprint 5+ |
| **K-3** | **Bildirim merkezi yeniden tasarımı** | Mevcut in-app liste ve 4 uç çalışıyor (V-12, V-23). Yeniden tasarım ayrı bir UX işidir |
| **K-4** | **Yeni bildirim event tipi** | Kullanıcı kapsam kararı. Mevcut 16 çağrı noktasının teslimi konusudur. Not, ödev, duyuru event'leri kendi modülleriyle gelir |
| **K-5** | **Digest / özet e-posta** (haftalık, günlük) | `notification-rules.md:268` bunu açıkça **V2** olarak işaretliyor. S-5'in C seçeneği push özetidir, e-posta digest'i değildir — karıştırılmamalıdır |
| **K-6** | **Kullanıcı bazlı granular tercih** (olay×kanal kırılımı) | `mvp-guard.skill:126` — açık/kapalı yeterli, granular V2. S-1'in çıktısına bağlı |
| **K-7** | **Okula özel şablon düzenleme ekranı** | `mvp-guard.skill:149` — configürasyon Sprint 5+. S-2'nin B seçeneği reddedilirse zaten gündeme gelmez |
| **K-8** | **Bildirim analitiği / açılma oranı dashboard'u** | `notification-priority.skill:141-148` bunu tarif ediyor ama `mvp-guard.skill:107` — *"Önce basic metric, sonra deep dive."* FR-14 (teslim kaydı) yeterlidir; dashboard V2 |
| **K-9** | **Outbox pattern** | S-3'ün B seçeneği kabul edilirse kapsam dışı. Karar verilene kadar belirsiz |
| **K-10** | **Bildirim saklama / arşivleme job'u** | Bölüm 7.5 — pilot 6 aydan kısa; gereksinim kayda geçirilir, bu işte yapılmaz |

**Sınırdaki maddeler (kapsam dışı değil, ama dikkat):** FR-09 ve FR-10 (ayar
ekranı düzeltmeleri) teknik olarak "kanal işi" değildir, ancak kanal olmadan
anlamsız, kanal varken de yanlış çalışan bir ekran bırakmak kabul edilemez.
Bunlar kapsamda tutulmuştur ve S-8'e bağlıdır.

---

## 10. Riskler

| # | Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|---|
| **R-01** | **Mükerrer push.** Debt-N6 çökme penceresi (`NotificationDispatcher.cs:31-40`) bugün in-app için kabul edilmiş; push'ta aynı hata kullanıcıyı doğrudan rahatsız eder ve güven kaybettirir | Orta | **Yüksek** | S-3 kararı bilinçli yenilensin; kanal gönderimi ile teslim kaydı arasındaki pencere daraltılsın; pilotta mükerrer teslim sayısı ölçülsün |
| **R-02** | **Bildirim yağmuru.** FR-13 (throttle) atlanır veya yetersiz kalırsa, ders programı yayınlama gibi tek işlem 1.560 alıcıya anında push atar (Bölüm 6.1 tepe yükü) | Orta | **Yüksek** | FR-13 zorunlu tutulsun; tepe yük senaryosu pilot öncesi test edilsin; `notification-priority.skill:141-147` yorgunluk metrikleri pilot boyunca izlensin |
| **R-03** | **KVKK — FCM veri aktarımı.** `security-rules.md:278` veriyi TR'de tutmayı sözleşme gereği kılıyor; FCM bunu yapısal olarak ihlal ediyor | **Yüksek** | **Yüksek** | Pilot sözleşmesi imzalanmadan hukuk görüşü alınsın; aydınlatma metni güncellensin; alternatifi olmadığı için bu bir *kabul kararı* olmalı, gözden kaçmış bir uyumsuzluk değil |
| **R-04** | **Karar tıkanması.** 8 açık sorunun 3'ü (S-1, S-5, S-6) birbirine bağlı; S-6 kararı verilmeden FR-11/12/13 tanımlanamaz | **Yüksek** | Orta | S-6 önce karara bağlansın; karar toplantısı tek oturumda yapılsın |
| **R-05** | **Sessiz saat yanlış hesabı.** Okul saat dilimi yerine sunucu UTC'si kullanılırsa bildirimler 3 saat kayar; velinin gece 01:00'de push alması pilotta en görünür hatadır | Orta | **Yüksek** | NFR-10 zorunlu; sınır saatlerinde (21:59 / 22:01 / 06:59 / 07:01) test edilsin |
| **R-06** | **Ölçülemezlik.** FR-14 (teslim durumu kaydı) atlanırsa, "push gitti mi" sorusuna cevap verilemez; pilot geri bildirimi ("bildirim gelmedi") doğrulanamaz | Orta | **Yüksek** | FR-14 zorunlu tutulsun; `NotificationDeliveryLog` bugün yalnız başarı satırı yazıyor (Y-10) |
| **R-07** | **Mobil sürüm bağımlılığı.** Push, mobil uygulamanın yeni sürümünü ve app store onayını gerektirir; API tarafı hazır olsa bile kullanıcıya ulaşmaz | **Yüksek** | Orta | Mobil iş erken başlatılsın; store onay süresi (iOS ~1-3 gün, ilk gönderimde daha uzun) plana yazılsın |
| **R-08** | **Bildirim izni reddi.** Kullanıcı iOS/Android bildirim iznini reddederse push hiç çalışmaz; oran genelde %20-40'tır | **Yüksek** | Orta | FR-17 (izin durumu görünürlüğü) uygulanısın; izin isteme anı bağlam içine yerleştirilsin (ilk devamsızlık bildiriminde, uygulama ilk açılışında değil) |
| **R-09** | **Hayalet ayar ekranı düzeltilmezse.** Y-05 ve Ç-3 kapatılmazsa, yönetici pilotun ilk haftasında ayarın çalışmadığını fark eder | **Yüksek** | Orta | FR-07/08/09/10 kapsamda tutuldu; S-8 karara bağlansın |
| **R-10** | **SMTP teslimat sorunu.** S-4'te SMTP seçilirse spam kutusuna düşme riski sağlayıcı itibarına bağlıdır | Orta | Düşük | SPF/DKIM/DMARC yapılandırması pilot öncesi doğrulansın; e-posta hacmi düşük (≈20/gün) olduğu için etki sınırlı |
| **R-11** | **Kapsam kayması.** "Madem bildirime dokunuyoruz, şablon ekranını da yapalım / duyuru event'ini de ekleyelim" baskısı | Orta | Orta | Bölüm 9 kapsam sınırı yazılı; her ek talep mvp-guard formatında değerlendirilsin |

---

## 11. Başarı Kriterleri

Bu iş "bitti" denildiğinde aşağıdakilerin hepsi doğru olmalıdır:

1. **Veli push alıyor.** Pilot okulda 1. ders devamsızlığı kaydedildiğinde,
   uygulaması kapalı velinin telefonunda **60 sn içinde** bildirim görünüyor;
   dokununca doğru ekran açılıyor. *(FR-01, FR-16, NFR-01)*

2. **Ayarlar gerçekten çalışıyor.** Yönetici bir kanalı veya bir olayı
   kapattığında, sonraki bildirimde o kanaldan **hiç** gönderim yapılmıyor;
   diğer kanallar etkilenmiyor. Ayar ekranında görünen her olayın sistemde
   karşılığı var, karşılığı olmayan olay listelenmiyor.
   *(FR-07, FR-08, FR-09, FR-10)*

3. **Sessiz saatler uygulanıyor.** 22:00–07:00 arasında üretilen kritik olmayan
   bildirim telefona sabah düşüyor, in-app satırı anında yazılıyor; kritik
   bildirim sessiz saati deliyor. Hesap okulun saat diliminde yapılıyor.
   *(FR-11, FR-12, NFR-10, NFR-13)*

4. **Teslim ölçülebilir.** Herhangi bir bildirim için "kime, hangi kanaldan,
   gitti mi, gitmediyse neden" sorusu veri üzerinden cevaplanabiliyor. Pilot
   ilk 2 haftasında push başarı oranı **≥ %98**. *(FR-14, FR-15, NFR-04)*

5. **Bildirim yağmuru yok.** Tepe yük senaryosunda (ders programı yayınlama,
   ~1.560 alıcı) sistem teslimi tamamlıyor ve aynı alıcıya aynı olay tipinden
   5 dk içinde ikinci push gitmiyor. *(FR-13, NFR-17)*

6. **KVKK uyumu yazılı.** Bildirim gövdelerinde yasaklı veri yok; cihaz token'ı
   toplanması aydınlatma metninde yer alıyor; FCM veri aktarımı için alınan
   karar (istisna kabulü) belgelenmiş durumda. *(NFR-11, NFR-12, Bölüm 7)*

---

## 12. Sonraki Adımlar

1. **Karar toplantısı** — Bölüm 8'deki 8 soru karara bağlanır. S-6 önce
   çözülmelidir (diğerleri ona bağlı).
2. **Kanonik doküman güncellemesi** — `notification-matrix.md` Bölüm 3.4'teki 16
   çağrı noktasıyla hizalanır; Ç-1/Ç-2/Ç-3 kapatılır.
3. **Teknik analiz** (ayrı oturum) — `analysis_standards.md` uyarınca
   `bildirim_sistemi_analiz.docx` üretilir.
4. **Borç kaydı güncellemesi** —
   `../oksis/.claude/docs/modules/notifications/completion_status.md`'ye `Debt-N6`
   eklenir (bugün eksik) ve S-1/S-3 kararları Debt olarak kayda geçer.

---

*OKSİS — Bildirim Teslim Kanalı İhtiyaç Analizi v1.0 · Temmuz 2026 · Gizli / Dahili*
*Bu belge "ne" ve "neden" sorularını yanıtlar. "Nasıl" sorusu teknik analizin konusudur.*
