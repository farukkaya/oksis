# OKSİS — Bildirim Altyapısı İnceleme Raporu

> **Tarih:** 2026-09-10
> **Kapsam:** Backend bildirim zinciri — kanallar, modül kapsamı, eksik yüzeyler
> **Ölçüm kaynağı:** `oksis-api` @ `61808d25` (dal: `feature/exam-session`)
> **Yöntem:** kod okuması; her iddia dosya/satır düzeyinde doğrulandı
> **Doğan bulgular:** `TB-125` · `TB-126` · `TB-127` · `E-23` → [OKSİS - Bulgu Kayıt Defteri](../bugs-and-decisions/OKS%C4%B0S%20-%20Bulgu%20Kay%C4%B1t%20Defteri.md) §11
> **İlgili kararlar:** [K-01 - Bildirim Matrisi](../bugs-and-decisions/Kararlar/K-01%20-%20Bildirim%20Matrisi.md) · [K-02 - OS Push Altyapısı](../bugs-and-decisions/Kararlar/K-02%20-%20OS%20Push%20Altyap%C4%B1s%C4%B1.md)

---

## 0. Yönetici özeti

Bildirim **zinciri sağlam**, **kapsamı dar**, **ayar yüzeyi ise teslimatla kopuk**.

Üç cümlede:

1. **Zincir ayakta.** Domain olayı → commit sonrası kuyruk → Hangfire → dispatcher → kanal
   → teslim kaydı. Idempotentlik, tenant izolasyonu, yeniden deneme ve ölü token ayıklama
   yazılmış durumda. Bu taramada zincirin kendisinde bir kusur bulunmadı.
2. **Dört kanaldan biri tam çalışıyor.** In-app 39 bildirim tipinin hepsinde çalışıyor;
   push ve e-posta yalnız **14 tipte** ve ikisi de yapılandırma eksiğiyle duruyor;
   SMS'in hiçbir uygulaması yok.
3. **Ayarların yarısı teslimatı etkilemiyor.** Okul yöneticisinin bildirim matrisinde
   gördüğü kapıların önemli kısmı gönderim yolunda hiç okunmuyor — `TB-43`'ün kapattığı
   "sahte toggle" sınıfının kalan yarısı (`TB-125`, `TB-126`).

**En kritik tek madde:** `TB-125` — *"bildirimleri tümden kapat"* ana anahtarı, 39
bildirim tipinin **25**'inde hiç uygulanmıyor.

---

## 1. Zincirin mimarisi (ölçülmüş hâli)

```
[Domain Event]
    ↓  MediatR notification handler (modül başına)
[INotificationEnqueuer.Enqueue]
    ↓  IPostCommitDispatcher — transaction commit SONRASINA ertelenir
[Hangfire · DispatchNotificationJob]   (5 deneme; Hangfire kapalıysa bellek içi fallback)
    ↓
[NotificationDispatcher]  — kanal × alıcı fan-out, (EventId, AccountId, Channel) idempotent
    ├─ InAppNotificationChannel   → Notification satırı + SignalR canlı push
    ├─ PushNotificationChannel    → 5 kapı → FcmSender (FCM HTTP v1)
    └─ EmailNotificationChannel   → 4 kapı → SmtpEmailSender
    ↓
[notification_delivery_logs]  — yalnız kanal "ULAŞTI" derse yazılır (Ruling-28)
```

**Kayıt sırası yük taşıyor.** `NotificationChannelRegistration` in-app'i **ilk** kaydeder;
push'un payload'ındaki `notificationId` anahtarı in-app'in yazdığı satırdan okunur. Sıra
tersine dönerse "dokununca okundu işaretle" sessizce ölür — `NotificationChannelOrderTests`
bunu ölçüyor.

**Sağlam bulunan noktalar:**

- Teslim satırı yalnız gerçekten ulaşınca yazılıyor; kapsam genişletildiğinde eski satırlar
  gerçek gönderimi engellemiyor (Ruling-28).
- `FcmSender` bozuk/eksik yapılandırmada **fırlatmıyor** — singleton olduğu için fırlatsaydı
  tek bir ortam değişkeni hatası in-app dahil tüm bildirimleri durdururdu.
- Ölü token ayrımı doğru: yalnız `UNREGISTERED` cihazı kapatıyor, `INVALID_ARGUMENT` dahil
  diğer her şey geçici sayılıyor. Bu ayrım olmasaydı bir sağlayıcı kesintisi tüm cihazları
  sessizce silerdi.
- Kuyruğa alma commit sonrasına ertelenmiş — geri alınan bir işlem bildirim üretmiyor.

**Bilinen ve kayıtlı borç:** kesin exactly-once yok (Debt-N1/N6). Kanal gönderimi ile teslim
kaydı arasında çökme olursa retry mükerrer teslim edebilir. Kabul edilmiş; Outbox ile
kapanacak.

---

## 2. Kanalların gerçek durumu

| Kanal | Uygulama | Kapsam | Yapılandırma | Sonuç |
|---|---|---|---|---|
| **In-App** | `InAppNotificationChannel` + `SignalRNotificationPusher` | **39/39 tip** | — | ✅ Tam çalışıyor |
| **Push** | `PushNotificationChannel` + `FcmSender` (FirebaseAdmin, 500'lük parti) | **14/39 tip** | `Firebase.ServiceAccountJson` ve `ProjectId` **boş** | ⚠️ Kod hazır, gönderim yok |
| **E-posta** | `EmailNotificationChannel` + `SmtpEmailSender` | **14/39 tip** | dev `localhost:1025`; prod parolası `CHANGE_ME` | ⚠️ Taşıyıcı bağlı, kapsam dar |
| **SMS** | — yalnız `ISmsSender` arayüzü | **0** | — | ❌ Hiç yok |

### 2.1 In-App — tek eksiksiz kanal

Her bildirim tipi kalıcı `Notification` satırı yazıyor ve alıcının SignalR grubuna canlı
push gidiyor. Okuma yüzü tam: liste, özet, okunmamış sayacı, tekil ve toplu okundu işaretleme.

### 2.2 Push — beş kapılı, ama Firebase yapılandırılmamış

Kapılar ucuzdan pahalıya sıralı: kapsam eşlemesi → okulun ana anahtarı → okulun olay bazlı
kararı → kullanıcının kendi tercihi → sessiz saat. Sessiz saatte gönderim `DeferredPushJob`
ile ertelenir; erteleme bellek içi olduğu için dispatcher teslim satırı **yazmaz** (Ruling-33)
— bedeli mükerrer bildirim ihtimali, kazancı sessiz kayıp riskinin ortadan kalkması.

Kapsam kararının ölçüsü **fan-out büyüklüğü**, modül değil: `TIMETABLE_PUBLISHED` ve
`EXAM_WINDOW_PUBLISHED` tek işlemde okulun tamamına gittiği ve **throttle hâlâ yazılmadığı**
için bilinçli olarak dışarıda.

`Firebase` ayarları boş olduğu için `FcmSender` bugün hiçbir cihaza gönderim yapmıyor,
yalnız uyarı logluyor. **Push'un uçtan uca doğrulaması henüz hiç yapılmadı.**

### 2.3 E-posta — bağlandı ama dar kapsamda

`TB-43` ile kanal yazıldı. Kapıları push'un birebir karşılığı: kapsam → okulun ana anahtarı
→ okulun olay kararı → alıcının `PrimaryEmail` adresi. Sessiz saat kapısı **bilinçli yok**
(e-posta telefonu titretmez). Kullanıcı tercihi kapısı da yok — `NotificationPreference`
bugün yalnız `PushEnabled` taşıyor.

Fiilen e-posta üreten tek katalog varsayılanı `GRADE_PUBLISHED`. Kalan 13 eşlemeli olayda
e-posta ancak okul matristen açarsa gider.

### 2.4 SMS — baştan sona sahte yüzey

Sunucu SMS'i tam ciddiyetle taşıyor:

- `NotificationChannel` enum'unda `Sms = 4`
- Katalogda `SupportsSms` + `DefaultSmsEnabled` kolonları; **altı olayda** `supportsSms: true`
- `PAYMENT_REMINDER` satırında `sms: true` varsayılan
- Okul ayarında `SmsEnabled` + `DailySmsLimit`, doğrulayıcısıyla birlikte
- `GET /schools/sms-quota` sabit bir kota kartı döndürüyor: 1000 kontör, gönderici başlığı
  "OKUL", `IsPlaceholder: true`

Arkasında: `ISmsSender` arayüzü, **implementasyon yok, DI kaydı yok**, tek çağıranı bir yorum
satırı (`RequestLoginOtpCommandHandler`). `INotificationChannel` uygulayan üç sınıfın hiçbiri
SMS değil.

→ `E-23`

---

## 3. Modül modül bildirim kapsamı

| Modül | Tip sayısı | Push kapsamında | Bildirimler |
|---|---:|---:|---|
| **Yoklama** | 8 | 0 | Devamsızlık · günlük özet · öğretmen dürtmesi · mazeret kararı · düzeltme kararı · gün içi izin · toplu mazeret · eşik aşımı |
| **Duyurular** | 8 | 0 | Yayın · geri çekme · düzeltme · onaya düşme · onay · red · zamanlanmış yayın · zamanlanmış yayın başarısız |
| **Sınav** | 7 | 6 | Pencere yayını · yerleştirme hatırlatması · saat isteği · saat cevabı · takvim yayını · sınav taşındı · yarın sınav |
| **Ders Programı** | 5 | 0 | Yayın · vekâlet/derslik değişikliği · ders iptali · değişiklik geri alma · program silme |
| **Kulüpler** | 4 | 4 | Etkinlik yayını · etkinlik iptali · kulüp duyurusu · başvuru sonucu |
| **Ödevler** | 3 | 2 | Yayın · son teslim yaklaşıyor · eksik ödev |
| **Notlar** | 2 | 2 | Not yayını · eksik not girişi hatırlatması |
| **Nöbet** | 1 | 0 | Çizelge yayınlandı |
| **Öğrenci** | 1 | 0 | Kayıt yenilendi |
| **Toplam** | **39** | **14** | |

**Gözlem — Sınav modülü emsal.** Yedi tipin altısı push kapsamında, yedisi de
`delivered: true`, katalog satırları üreticileriyle aynı commit'te doğmuş, hatırlatma
sweep'i yazılmış. Yeni modüller bu şablonu izlemeli.

**Gözlem — Yoklama ve Duyurular'da hiç push yok.** İkisi de OKSİS'in en yüksek hacimli
bildirim üreticisi ve ikisi de yalnız in-app. "Çocuğun bugün derse girmedi" haberi bugün
ancak veli uygulamayı açarsa görülüyor.

---

## 4. Bildirimi olmayan ama olması gereken yerler

### 4.1 Karara bağlanmış, uygulanmamış

[K-01 - Bildirim Matrisi](../bugs-and-decisions/Kararlar/K-01%20-%20Bildirim%20Matrisi.md) §8'deki "doğan işler" listesi hâlâ açık; kodla doğrulandı:

| Alan | Karar | Koddaki durum |
|---|---|---|
| **Nöbet — atama değişikliği** | Atamanın iki tarafına anlık | `DutyAssignmentChangedEvent` üretiliyor, **bildirim handler'ı yok** |
| **Nöbet — muafiyet onay/red** | Karar sahibine anlık, gövdede red gerekçesi | `DutyExemptionChangedEvent` üretiliyor, **handler yok** |
| **Nöbet — yancı ataması** | Kendi satırını alır, gövde **bölge adını** taşır | Olay da, kind de, handler da **yok** |
| **Nöbet — çizelge yayını alıcıları** | Nöbetçiler **ve yancılar** | Handler var, **alıcı listesinde yancı yok** |
| **Nöbet günü hatırlatması** | Bir gün önce 17:00 | Zamanlanmış job **yok** |
| **Program — revizyon özeti** | Gün sonu tek özet | Toplayıcı job **yok**, her şey anlık akıyor |
| **Program — ders iptali** | Anlık, **sessiz saati deler** | Depoda öncelik kavramı **hiç yok**; sessiz saat kapısında satır bazlı "deler" işareti yok |
| **Sezon — dört yönetici bildirimi** | Açılış, kapanış, devir, devir hatası (+e-posta) | `AcademicSessions`'ta 13 domain olayı var, bildirim handler'ı **sıfır** |
| **Toplu gönderim throttle'ı** | `K-01b` push kararının ön koşulu | **Yazılmadı** — `TIMETABLE_PUBLISHED` ve `EXAM_WINDOW_PUBLISHED` bu yüzden push dışı |

### 4.2 Modülü olmadığı için boş duran katalog satırları

Üçü de `delivered: false` ile dürüstçe işaretli — ekranda yer tutucu olduğu belli:

- `REPORT_CARD_PUBLISHED` — karne modülü yok
- `PAYMENT_REMINDER` — taksit hatırlatması; finans modülü yok
- `PAYMENT_RECEIVED` — ödeme alındı; finans modülü yok

### 4.3 Hiç düşünülmemiş

- **Mesajlaşma** — `Modules/Messaging` boş, README'si "henüz yazılmadı" diyor. Yazıldığında
  bildirimsiz kullanılamaz; bugün kataloğunda satırı bile yok.
- **Belgeler** — modül çalışıyor (yükleme, ekleme, çıkarma, virüs taraması, küçük resim) ama
  veliyle paylaşılan belge/form için hiçbir bildirim üretmiyor.
- **Kimlik/Kullanıcılar** — davet ve şifre sıfırlama e-postaları var, ama bunlar bildirim
  zincirinden değil doğrudan `IEmailSender`'dan geçiyor. Bilinçli ve doğru; yalnız
  "hesabınız açıldı" tarzı bir in-app karşılığı yok.

---

## 5. Ayar yüzeyi ile teslimat arasındaki kopukluk

Bu bölüm raporun en önemli bulgusunu taşıyor.

### 5.1 `TB-125` — matris kapısı 25 tipte hiç uygulanmıyor 🟠

`InAppNotificationChannel` iki kapısını da — okulun **ana anahtarı** (`NotificationConfig.IsEnabled`)
ve olay bazlı **Portal kararı** (`NotificationRuleConfig.PortalEnabled`) — yalnız
`PushEventKeyMap.TryGetEventKey` **başarılı olursa** çalıştırıyor. Eşlemede karşılığı olmayan
tip `if` bloğunu atlıyor ve satır koşulsuz yazılıyor.

Eşlemede **14** tip var; `NotificationKind` **39** değer taşıyor.

Kodun gerekçesi *"eşlemede olmayan tipin matriste satırı da yoktur, yani yöneticinin
kapatabileceği bir şey yoktur"* — **bu artık doğru değil.** Katalogda satırı olan ve gerçekten
bildirim üreten **beş olay** eşlemenin dışında:

| Olay anahtarı | Bildirim | Matriste görünür | Portal kapısı işliyor mu |
|---|---|:--:|:--:|
| `ATT_THRESHOLD` | Uyarı eşiği aşıldı | ✅ | ❌ |
| `ATT_DAILY_SUMMARY` | Günlük yoklama özeti | ✅ | ❌ |
| `ANNOUNCEMENT` | Yeni duyuru | ✅ | ❌ |
| `HOMEWORK_MISSING` | Eksik ödev bildirimi | ✅ | ❌ |
| `EXAM_WINDOW_PUBLISHED` | Sınav haftası duyuruldu | ✅ | ❌ |

Aynı sebeple **"bildirimleri tümden kapat" ana anahtarı** bu beş tip ve eşleme dışı kalan
diğer 20 tip için de çalışmıyor: ders programının beşi, nöbet, mazeret, düzeltme, gün içi
izin, toplu mazeret, duyurunun sekiz hâli, kayıt yenileme. Kapının tek durağı in-app kanalıydı.

**Düzeltme yönü:** kapı eşlemeden bağımsızlaştırılmalı — ana anahtar her tipte, Portal kararı
katalogda satırı olan her olayda uygulanmalı. `PushEventKeyMap` push kapsamının kaynağı olarak
kalır, matris kapısının kaynağı olmaktan çıkar. Merkezî düzeltme; ekran bazlı yama kabul değil.

### 5.2 `TB-126` — `email: true` seed edilen üç olay e-posta üretmiyor 🟡

`EmailNotificationChannel`'ın 1. kapısı da aynı eşleme. Seed ise şu üç satırı `email: true`
ile yazıyor:

- `ATT_THRESHOLD` — "uyarı eşiği aşıldı e-postaya da gider" kararı her okulun
  `notification_rule_configs` tablosunda **yazılı**, karşılığı yok
- `HOMEWORK_MISSING` — seed yorumu bunu özellikle vurguluyor: *"e-posta YALNIZ burada açık:
  eksik ödev, velinin kaçırmaması gereken tek ödev haberidir"*
- `ANNOUNCEMENT_URGENT` — zaten `delivered: false` ile işaretli, yani ekran dürüst

İlk ikisi `delivered: true` — ekran onları "çalışıyor" diye gösteriyor. `TB-125` ile aynı kapı
düzeltmesine bağlı.

### 5.3 `TB-127` — kulübün dört satırı ters yönde yanlış ⚪

`NotificationEventTypeSeedData` dört `CLUB_*` satırını `delivered: false` ile yazıyor; yorumu
*"handler'lar Faz 5'te yazıldığında bayrak kendi migration'ıyla `true`'ya çevrilir"* diyor.
Faz 5 geldi: dört handler da yazılı, `PushEventKeyMap` kapısı da açık. Bayrağı çeviren
migration yazılmamış — model snapshot'ta dördü hâlâ `IsDelivered = false`.

Zararı `TB-24`'ün **tersi** yönde: ekran çalışan bir bildirimi "henüz teslim edilmiyor" diye
gösteriyor. Tek satırlık seed düzeltmesi + migration (emsal: `20260828130231`).

---

## 6. Önerilen sıra

| # | İş | Gerekçe | Ağırlık |
|:--:|---|---|---|
| 1 | **`TB-125`** — matris kapısını eşlemeden kopar | Yöneticinin en temel düğmesi ("tümden kapat") 25 tipte çalışmıyor. Merkezî düzeltme; tek dokunuşla `TB-126` da kapanır | 🟠 |
| 2 | **`TB-127`** — `CLUB_*` bayrakları | Tek satır + migration; ekran yalan söylemeyi bırakır | ⚪ |
| 3 | **Firebase yapılandırması + uçtan uca push doğrulaması** | Push kodu hazır ama **hiç ölçülmedi**. eşik/çalışma değeri gerçek koşuda ölçülür — gerçek koşu olmadan çalıştığı söylenemez | 🟠 |
| 4 | **Toplu gönderim throttle'ı** | `TIMETABLE_PUBLISHED` ve `EXAM_WINDOW_PUBLISHED`'ın ön koşulu; `K-01b` bunu isteğe bağlı olmaktan çıkardı | 🟡 |
| 5 | **Nöbet bildirimleri** (`K-01` §8, ilk dört madde) | Olaylar zaten üretiliyor, yalnız handler yok — en ucuz kapsam genişlemesi | 🟡 |
| 6 | **`E-23`** — SMS kararı | Ya sağlayıcı bağlanır ya sütun gizlenir. Arada kalan hâl, yöneticiye kontör harcadığını düşündürüyor | 🟡 |
| 7 | **Program gün sonu özeti + sessiz saat "deler" işareti** | `K-01b`'nin zamanlama tarafı; öncelik kavramı depoda hiç yok | 🟡 |
| 8 | **Sezon yönetimi bildirimleri** | `K-01c`; 13 domain olayı hazır bekliyor | 🟡 |

---

## 7. Ölçüm izi

Rapordaki her iddianın dayanağı:

| İddia | Kaynak |
|---|---|
| Kanal kayıt sırası ve üç kanal | `Infrastructure/Notifications/NotificationChannelRegistration.cs` |
| In-app kapılarının eşlemeye bağlı olması | `InAppNotificationChannel.cs` — kapılar `if (TryGetEventKey…)` bloğunun içinde |
| E-posta kapılarının eşlemeye bağlı olması | `EmailNotificationChannel.cs` — Kapı 1 |
| Push kapsamı 14 tip | `Application/Modules/Notifications/Internal/PushEventKeyMap.cs` |
| Toplam 39 bildirim tipi | `Domain/Modules/Notifications/Enums/NotificationKind.cs` |
| Katalog satırları ve `delivered` bayrakları | `Infrastructure/Persistence/Seed/MasterData/NotificationEventTypeSeedData.cs` |
| Firebase yapılandırmasının boş olması | `src/Oksis.Api/appsettings.json` → `Firebase` |
| SMS'in implementasyonu olmaması | `Application/Common/Abstractions/ISmsSender.cs` + `Infrastructure/DependencyInjection.cs`'de kayıt yokluğu |
| SMS kota kartının sabit olması | `Modules/Schools/Queries/GetSmsQuota/GetSmsQuotaQueryHandler.cs` |
| Nöbet/sezon handler eksikleri | `Domain/Modules/Duties/Events/` ve `Domain/Modules/AcademicSessions/Events/` ↔ `Application/…/Events/Notifications/` karşılaştırması |
| Zamanlanmış iş listesi | `Infrastructure/BackgroundJobs/Jobs/` (27 job; nöbet hatırlatması ve program özeti yok) |
| Fan-out ve throttle gerekçeleri | `PushEventKeyMap` remarks + [K-02 - OS Push Altyapısı](../bugs-and-decisions/Kararlar/K-02%20-%20OS%20Push%20Altyap%C4%B1s%C4%B1.md) §11 |
