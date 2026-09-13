# K-02 · OS Push Bildirim Altyapısı — Karar ve Uygulama Planı

> **Durum:** ✅ Karara bağlandı
> **Tarih:** 2026-08-08
> **Ana dosya:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
> **Blokladıkları:** `K-01a` `K-01b` `K-01c` `E-05`
> **Kaynak envanter:** `oksis-api/docs/analysis/bildirim-teslim-ihtiyac-analizi.md` (531 satır)

---

## 1. Neden bu karar gerekliydi

OKSİS'in bildirim çekirdeği çalışıyor ama zincirin son halkası eksik: `src/Oksis.Infrastructure/DependencyInjection.cs:192`'de `INotificationChannel` olarak yalnız `InAppNotificationChannel` kayıtlı.

**Pratik sonucu:** Veli uygulamayı kendisi açmazsa telefonuna hiçbir şey düşmüyor. 14 handler / 16 çağrı noktası bildirim üretiyor, hepsi in-app listeye yazılıp orada kalıyor.

Bu, `mvp-scope-rules.md:14`'teki pilot çıkış kriterini — *"Veli push notification'ları doğru zamanda alıyor"* — **%0** karşılıyor. Devamsızlık sınırı aşımı gibi kritik bildirimlerin veliye ulaşmaması okul için hukuki ve itibari risk: okul "bildirdik" der, veli "görmedim" der, kayıt ikisini de haklı çıkarır.

Push bugüne dek her modül spec'inde kapsam dışı bırakıldı (Faz 2.6 `Debt-N2`, duyuru kararı `K-2`, bildirim `Faz 3+`) — çünkü **hiçbir modülün sahibi değil**. Bu karar o boşluğu kapatıyor.

---

## 2. Zeminde ne vardı

> [!info] Bu bir "bildirim sistemi kurma" işi değil
> Bir kanal implementasyonu + bir cihaz tablosu + mobil istemci katmanı. Mimariyi bozmuyor.

**Hazır ve yeniden kullanılacak olanlar:**

| Yapı | Konum |
|:--|:--|
| Fan-out motoru (`IEnumerable<INotificationChannel>` alıyor) | `Infrastructure/Notifications/NotificationDispatcher.cs` |
| Tenant-aware Hangfire job'u | `BackgroundJobs/Jobs/DispatchNotificationJob.cs` |
| Post-commit kuyruklama | `Notifications/HangfireNotificationEnqueuer.cs` |
| Alıcı çözümleme (veli/öğretmen/şube/idare) | `Notifications/NotificationRecipientResolver.cs` |
| İdempotentlik indeksi | `(SchoolId, EventId, RecipientAccountId, Channel)` unique |
| `NotificationChannel.Push` enum değeri | `Domain/Modules/Notifications/Enums/` |
| SignalR canlı hattı + mobil abonelik | `Api/Hubs/NotificationHub.cs`, `apps/mobile/.../use-notifications-realtime.ts` |
| Deep link tüketim mantığı | `apps/mobile/.../notif-list-screen.tsx:219-224` |

**Eksik olanlar:** cihaz token tablosu, FCM/APNs paketi, mobilde `expo-notifications`, teslim durumu/hata kaydı.

---

## 3. Verilen kararlar

### K1 — Paket B: Expo istemci + doğrudan sağlayıcı

İstemcide yalnız `expo-notifications` (**native device token**, Expo push token değil). Backend Android'e FirebaseAdmin ile FCM v1, iOS'a doğrudan APNs HTTP/2 gönderir.

**Gerekçe:**
- **Kırılganlığı en ucuz yere koyuyor.** Alternatif C'nin (RNFirebase) maliyeti istemci tarafında, Expo CNG kurulumunda. `apps/mobile`'da `ios/` ve `android/` gitignore'da — her şey config plugin üzerinden olmak zorunda ve RNFirebase config plugin'i SDK 55+ ile hâlâ açık sorunlu. Build kırılması mağaza gönderiminde patlar. B'nin maliyeti backend'de, tamamen kontrol edilen .NET kodunda.
- **Veri işleyen sayısını 2'ye indiriyor.** Google yalnız Android, Apple yalnız iOS. Expo sunucuları hiç devrede değil.
- **Ölçülebilirlik en yüksek.** Cihaz başına hata verdisi tek turda geliyor (`UNREGISTERED` / `410 Unregistered`). Expo'nun ticket/receipt modeli ikinci bir async tur demek — daha az kod değil, daha çok.
- iOS'ta `interruption-level` doğrudan kontrol ediliyor.

### K2 — Web Push kapsam dışı, kapı açık

`user_devices` tablosunda `Platform` (Ios/Android/Web) + `Provider` (Apns/Fcm) kolonları **baştan** bulunur.

**Gerekçe:** Web push mobil kalitesini **düşürmez** — ayrı taşıma katmanıdır. Dışarıda bırakma sebebi mobil değil, web'in kendi maliyeti:
- `apps/web`'de PWA/service worker **sıfır**. Next.js 16 App Router'a SW eklemek bir özellik değil, uygulama geneli mimari değişiklik (cache, routing, deploy).
- iOS Safari'de web push için sitenin ana ekrana eklenmiş olması şart → veli tarafında pratikte sıfır kullanım.
- Web'in gerçek personası (Yönetici/Öğretmen) masa başında, sekmesi açık. Onlar için doğru çözüm hazır duran SignalR hattını web'e bağlamak.
- `NFR-07` hesap başına 5 cihazla sınırlı — tarayıcılar bu bütçeyi yer.

İleride web push gerekirse FCM Web SDK token'ı, Android için zaten kurulan `FirebaseAdmin` gönderme yolundan gider → **backend'de ek maliyet neredeyse sıfır**, iş tamamen frontend'de kalır.

### K3 — Cihaz başına tek aktif hesap

Token kaydı o an giriş yapılmış Account'a bağlanır; register çağrısı **aynı token'ın diğer hesaplardaki satırlarını siler**.

**Gerekçe:** `Account.SchoolId` değişmez. İki okulda çocuğu olan veli = iki ayrı Account, ama telefonda tek token. Bu model sızıntıyı imkânsız kılar ve deep link'in her zaman geçerli olmasını garanti eder.

> [!warning] Kabul edilen kısıt
> İki okullu veli, yalnız **girişli olduğu** okulun push'unu alır. Platformda zaten hesap değiştirme UI'ı yok. Bu kısıt belgelenir.

### K4 — Android önce, iOS Apple hesabı gelince

**Gerekçe:** iOS push, ücretli Apple Developer hesabı olmadan **hiçbir şekilde** geliştirilemez — APNs token alınamaz, `.p8` üretilemez, gerçek cihazda test edilemez. Buna karşılık Android push **bugün, hiçbir mağaza hesabı olmadan** uçtan uca yazılıp test edilebilir: Firebase projesi + dev build yeter.

K1 sayesinde iki gönderim yolu zaten ayrı olduğu için Android hattı tek başına yazılır, test edilir ve kendini kanıtlar.

---

## 4. Değerlendirilen alternatifler

| Seçenek | Artı | Eksi |
|:--|:--|:--|
| **B — Expo istemci + doğrudan FCM/APNs** ✅ | Hafif native kurulum · 2 veri işleyen · cihaz başına hata tek turda · iOS `interruption-level` kontrolü · Android tek başına ilerleyebilir | Backend'de iki gönderici (FirebaseAdmin + APNs HTTP/2) |
| **C — Firebase tam yığın** (RNFirebase + notifee) | Backend'de tek entegrasyon · kanonik `notification-rules.md`'nin tarif ettiği yol | Expo CNG'de ağır native kurulum · config plugin riski · iOS de Google'dan geçer · iOS yine Apple hesabına bağlı, Android'i ayırmak daha zor |
| **A — Expo Push Service** | En az kod | EAS bağımlılığı · **üçüncü** bir veri işleyen (KVKK) · ticket/receipt iki turlu hata modeli · teslimat Expo altyapısına bağlı |
| **OneSignal** | Hazır segmentasyon/zamanlama/analitik | Hedeflemeyi ve öğrenci/veli verisini ABD SaaS'ına taşır · OKSİS'in olgun tenant-izole alıcı çözümleyicisini çöpe atar · KVKK'yı belirgin kötüleştirir |

---

## 5. KVKK kabul kararı (R-03)

Push için Google (Android) ve Apple (iOS) altyapısından geçiş **yapısal olarak zorunludur** ve `security-rules.md:278`'deki *"veri TR'de tutulur (sözleşme)"* maddesiyle çelişir.

> [!important] Bu gözden kaçmış bir uyumsuzluk değil, bilinçli bir istisna kabulüdür
> K1, isteğe bağlı üçüncü bir işleyiciyi (Expo) devre dışı bırakarak bu istisnanın yüzeyini asgariye indirir.

**Takip işleri (bu kararın parçası değil, ayrı):**
- [ ] Pilot sözleşmesi öncesi hukuk görüşü
- [ ] Aydınlatma metninin cihaz token'ı toplanmasını kapsayacak şekilde güncellenmesi
- [ ] `ConsentRecord(type=DataProcessing)` kapısının push kaydında uygulanması

**Bildirim gövdesi kuralları (bağlayıcı):** Öğrenci adı serbest (çok çocuklu veli için zorunlu). T.C., adres, telefon, sağlık bilgisi, disiplin kararı, tam not değeri, devamsızlık sayısı **yasak**. Deep link URL'inde token **yasak**. Push gövdesi kilit ekranında görünür kabul edilir.

---

## 6. Mimari

Mevcut zincir **değişmiyor**. Fan-out'a ikinci bir kanal ve ona veri sağlayan bir cihaz kaydı ekleniyor:

```
domain event → MediatR → IPostCommitDispatcher → Hangfire
  → DispatchNotificationJob (tenant set eder)
  → NotificationDispatcher (fan-out)
      ├─ InAppNotificationChannel      ← mevcut, dokunulmuyor
      └─ PushNotificationChannel       ← YENİ
           ├─ okul ayarı kapısı (NotificationConfig.PushEnabled)
           ├─ sessiz saat kapısı (QuietHours* + School.TimeZone)
           ├─ user_devices → aktif token'lar
           ├─ Platform'a göre: FcmSender (Android) | ApnsSender (iOS)
           └─ cihaz başına sonuç kaydı + geçersiz token soft-delete
```

> [!tip] Kritik tasarım noktası
> `INotificationChannel.SendAsync` `Task` döndürüyor ve delivery-log'u `NotificationDispatcher` yazıyor (`NotificationDispatcher.cs:52`). Push'ta alıcı başına N cihaz olduğu için cihaz başına sonuç gerekiyor.
>
> **Çözüm: arayüz değişmez.** Dispatcher'ın `(EventId, RecipientAccountId, Channel)` satırı mantıksal teslimin idempotency işareti olarak kalır; push kanalı cihaz başına sonucu kendi içinde kaydeder. Böylece in-app kanalına ve 16 çağrı noktasına **hiç dokunulmaz.**

### Payload deseni

Faz 2'de SignalR için kanıtlanmış **"sinyal + deep link"** deseni birebir taşınıyor:

- `notification` bloğu → OS'un gösterdiği kısa, PII'sız başlık/gövde
- `data` bloğu → `{ notificationId, kind, deepLink, schoolId, accountId }`
- İstemci push alınca `qk.notifications.lists()` + `unreadCount()` invalidate eder — tek doğru kaynak `GET /api/v1/notifications` olarak kalır
- `data.accountId` aktif hesapla eşleşmiyorsa istemci bildirimi bastırır (K3 için savunma katmanı)

Bu desen aynı hamlede üç problemi çözüyor: KVKK PII yasağı, FCM 4KB payload limiti, yetki/kapsam filtresinin backend'de kalması.

---

## 7. Kapsam

### ✅ İçinde

- `UserDevice` entity + configuration + migration + register/unregister uçları
- `PushNotificationChannel` + `IPushSender` soyutlaması + `FcmSender`
- `NotificationDeliveryLog` genişletmesi: `Status`, `FailedAt`, `Error`, `ProviderMessageId`, `DeviceId` *(nullable — in-app NULL kalır, push cihaz başına satır yazar)*
- **`NotificationConfig.PushEnabled` gönderim yolunda okunur.** Aksi halde push için **ikinci bir sahte toggle** sevk etmiş oluruz — envanterin `Y-05` olarak işaretlediği hatanın tekrarı
- **Asgari sessiz saat kapısı.** `QuietHours*` + `School.TimeZone` okunur; kritik olmayan push sabah 07:00'ye ertelenir, in-app satırı anında yazılır
- Mobil: `expo-notifications`, config plugin, izin akışı, token kayıt/silme, deep link tüketimi (cold start dahil), Android notification channel
- `logout` ve `auth.clear()` akışlarına token silme kancası *(bugün yok)*

### ❌ Dışında

| Kapsam dışı | Gerekçe |
|:--|:--|
| Web Push | K2 |
| APNs göndericisi + iOS yapılandırması | K4 — Apple hesabı sonrası ikinci parti |
| Genel throttle / cooldown | `S-6` önceliklendirme kararına bağlı. **Risk açık kalıyor** — aşağıya bak |
| Olay×kanal matrisi, hayalet olay temizliği, ayar ekranına Push toggle'ı | `S-8`'e bağlı, ayar ekranı işi |
| Kullanıcı bazlı tercih tabloları | `S-1`'e bağlı. OS seviyesi izin app store şartını karşılıyor |
| Outbox pattern | `S-3`. Push mükerrer teslim riskini artırıyor — kabul kararı bilinçli yenilenmeli |
| Şablon tablosu, SMS, analitik, retention job | Envanter K-2/K-5/K-7/K-8/K-10 |

---

## 8. Hesap hazırlığı — takvimin uzun ayağı

> [!danger] Bugün elde hiçbir mağaza hesabı yok
> Apple Developer hiç olmadı · Play Console 2024'te etkinsizlik gerekçesiyle kapatılmış · Firebase yok

| Hesap | Maliyet | Not |
|:--|:--|:--|
| **D-U-N-S numarası** | Ücretsiz | **İlk iş.** Hem Apple hem Google kurumsal hesabı istiyor — tek başvuru ikisini birden açar. Günler–haftalar sürebiliyor |
| **Apple Developer** (kurumsal) | 99 USD/yıl | D-U-N-S sonrası. Bireysel hesap D-U-N-S istemiyor ve hızlı ama uygulama şahıs adına yayımlanır — okullara satılan B2B ürün için önerilmez |
| **Google Play Console** | 25 USD tek seferlik | Kapatılan hesabın durumunu destekten teyit et. *"Kullanılmadı"* gerekçeli kapatma yeni kayda engel değil; politika ihlali kaynaklı olan engeller. Kurumsal hesap kapalı test zorunluluğundan muaf |
| **Firebase projesi** | Ücretsiz | Dakikalar sürer. Parti 1 ve 2 **yalnız bunu** bekler |

> [!note] Yan etki
> Apple hesabının yokluğu **universal link'leri de bloke ediyor** — legacy repodaki `apple-app-site-association` dosyasında Team ID hâlâ `<TEAMID>` placeholder'ı. Push'a dokununca doğru ekrana gitme iOS'ta buna bağımlı. Android'de `assetlinks.json` için imza parmak izi yeterli.

---

## 9. İş parçaları

### Parti 0 — Hazırlık *(kodla paralel, bloke etmez)*

- [ ] D-U-N-S başvurusu başlat
- [ ] Firebase projesi aç → service account JSON + `google-services.json`
- [ ] Play Console hesap durumunu destekten teyit et
- [ ] Apple Developer başvurusu *(D-U-N-S sonrası)*

### Parti 1 — Backend, Android hattı

- [ ] `UserDevice` entity + configuration + migration `20260808_add_user_devices`
- [ ] `PushNotificationChannel` — şablon: `InAppNotificationChannel.cs`
- [ ] `FcmSender` — `SendEachForMulticastAsync`, 500 token/batch
- [ ] `NotificationDeliveryLog` genişletmesi + unique index güncellemesi
- [ ] DI kaydı — `DependencyInjection.cs:192` yanına tek satır
- [ ] `POST /api/v1/notifications/devices` + `DELETE .../{token}`
- [ ] `NotificationConfig.PushEnabled` + sessiz saat kapısı

**Hata politikası:** `UNREGISTERED`/`INVALID_ARGUMENT` → cihaz soft-delete, **retry yok**. Throttle/5xx → retry. Hangfire zaten yazılı: 5 deneme, 1m/5m/15m/1h/6h.

**Güvenlik:** Service account JSON appsettings'e **gömülmez** — ortam değişkeni/secret.
*(Yan bulgu: `appsettings.json`'da mevcut düz metin SMTP parolası var. Bu işin parçası değil ama kayda geçsin → yeni `TB` maddesi olabilir.)*

### Parti 2 — Mobil istemci *(Android üzerinden kanıtlanır)*

- [ ] `expo-notifications` + `app.json` plugin + `android.googleServicesFile`
- [ ] Token kaydı: `getDevicePushTokenAsync()` — `expo-device` zaten kurulu
- [ ] İzin isteme anı **bağlam içine** yerleştirilir, ilk açılışta değil *(red oranı %20-40)*
- [ ] Deep link tüketimi — `openNotif` mantığı yeniden kullanılır; cold start'ta `getLastNotificationResponseAsync()` + auth hydrate sırası beklenir
- [ ] Token silme: `more-screen.tsx:233` logout + `authMiddleware`'in `auth.clear()` dalı
- [ ] `assetlinks.json` üretilip `app.oksis.net/.well-known/` altında **gerçekten sunulur** *(bugün hiçbir yerde barındırılmıyor)*

> [!warning] `ios/` ve `android/` gitignore'da
> Elle native düzenleme ilk `expo prebuild --clean`'de uçar. Her şey config plugin üzerinden.

### Parti 3 — iOS *(Apple hesabı geldiğinde)*

- [ ] `ApnsSender : IPushSender` — `.p8` ile ES256 JWT (~1 saat ömürlü, yeniden kullanılır) + HTTP/2 POST. `dotAPNS` (MIT) ya da elle
- [ ] `apns-push-type`, `apns-priority`, `apns-collapse-id`, `apns-expiration` başlıkları
- [ ] Kritik bildirimlerde `interruption-level: time-sensitive` *(entitlement gerekir, serbestçe alınabilir — kısıtlı "critical alerts" değil)*
- [ ] `410 Unregistered` → cihaz soft-delete
- [ ] `apple-app-site-association`'daki `<TEAMID>` doldurulur ve dosya sunulur

---

## 10. Doğrulama

1. Birim/entegrasyon — şablon: `tests/Oksis.Infrastructure.IntegrationTests/Notifications/NotificationDispatcherTests.cs`. Test isimleri Türkçe `[Fact(DisplayName = "...")]`
2. **Tenant izolasyon testi** — `multi-tenant-rules.md` §9 gereği her yeni tenant entity için 3 test zorunlu, CI gate. `UserDevice` bunu tetikler
3. **K3 testi** — aynı token iki farklı Account'a kaydedilir; ikinci kayıttan sonra birinci hesap için gönderimde o cihaz kullanılmaz
4. **Geçersiz token testi** — `UNREGISTERED` yanıtında cihaz soft-delete, ikinci deneme yapılmaz
5. **Sessiz saat sınır testi** — okul saat diliminde 21:59 / 22:01 / 06:59 / 07:01. Kritik olay sessiz saati deler, in-app satırı her hâlükârda anında yazılır
6. `dotnet build` · `dotnet test` · `dotnet format`

> [!success] Bu işin bittiğinin tek ölçüsü
> Öğretmen 1. ders yoklamasında bir öğrenciyi "Gelmedi" işaretler → uygulaması **kapalı** velinin telefonunda **60 sn içinde** push görünür → dokununca **doğru yoklama ekranı** açılır.

---

## 11. Açık kalan / takip edilecek

| Konu | Not |
|:--|:--|
| **`S-6` öncelik sınıflandırması** | İki kanonik kaynak çelişiyor (`notification-matrix.md` Critical/High/Normal/Low vs `notification-priority.skill` Critical/Instant/Batched/Silent). Bu plan tek girdili bir "kritik mi" haritasıyla ilerliyor (`AbsenceThresholdReached`). **Transport kararını bloke etmiyor** ama `K-01` matrisi için çözülmeli |
| **Bildirim yağmuru** | Kapsam dışı bırakıldı ama **pilot öncesi kapatılmalı** — ders programı yayınlama tek işlemde ~1.560 alıcıya push atıyor |
| **SignalR Redis backplane** | Hâlâ eklenmemiş (`Program.cs:145-147` yorumu). Çoklu instance'ta açık. Bu işin parçası değil → ayrı `TB` maddesi |
| **Web'in bildirim boşluğu** | `packages/api/src/notifications/realtime.ts` hazır ama web'de bilinçli olarak bağlanmamış (Next dev proxy'de hub 404). K2'nin telafisi olarak ayrı iş kalemi |
| **Ayar ekranı sahte** | `NotificationConfig`/`NotificationRuleConfig` gönderim yolunda hiç okunmuyor. Push için düzeltiliyor; e-posta ve olay matrisi hâlâ sahte |

---

## 12. Doğan işler

- [ ] `K-01a/b/c` bildirim matrisinin **kanal ekseni** artık doldurulabilir → bu kararın asıl çıktısı
- [ ] `E-05` çözülebilir hale geldi
- [ ] ADR-002 yazılsın → `oksis/.claude/specs/adr-002-os-push-altyapisi.md` *(mevcut `adr-001` yanına)*
- [ ] `modules/notifications/completion_status.md` — `Debt-N2`/`N4` güncellensin, eksik olan **`Debt-N6` eklensin**, K3 kısıtı kaydedilsin
- [ ] `docs/analysis/bildirim-teslim-ihtiyac-analizi.md` durumu *"Karar bekliyor"*dan güncellensin
- [ ] Yeni `TB` maddesi: `appsettings.json`'da düz metin SMTP parolası
