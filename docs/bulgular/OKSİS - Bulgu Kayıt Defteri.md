# OKSİS — Bulgu Kayıt Defteri

> **Ne bu dosya:** ölçülmüş ve **hâlâ açık** olan bulgular. Bir madde kapandığında
> bloğu [[OKSİS - Bulgu Arşivi]]'ne taşınır; burada iz bırakmaz.
> **Kapanmış her şey:** [[OKSİS - Bulgu Arşivi]] — kanıtlar, commit'ler, kapanış turları.
> Aşağıdaki metinlerde geçen kapanmış madde ID'leri (`B-20`, `TB-88`, `X-15` gibi) orada aranır.
> **Karar bekleyenler:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
> **Son düzeltme:** 2026-09-15 (kapanış turu ön ölçümü) — defterdeki her madde koda karşı
> ölçüldü. `TB-147`, `TB-149` ve `TB-146` **kodda zaten kapalıydı**, defter satırları
> yazılmamıştı; üçü de arşive taşındı ([[OKSİS - Bulgu Arşivi]] §46). `TB-124` yarıya indi:
> `EX-H07` yazılmış (`CreateExamWindowCommandHandler:48`), yalnız `EX-H02` kaldı.
> Ayrıca defterin kendi kuralı işletildi: **kapanmış 15 madde** arşive taşındı
> ([[OKSİS - Bulgu Arşivi]] §47) — kapanmış maddenin açık listesinde durması, listeyi
> okunmaz hâle getiriyordu. Defter **39**.
>
> **Son ekleme:** 2026-09-15 — Altınay Anadolu Lisesi sıfırdan açılış hazırlığı: `E-24`
> (yeni okul açmanın yolu yok 🟠) ve `TB-162` (taze okulda kademe oluşmuyor 🟡), ikisi de §12.
> Kapatma yolu platform kimliği kararına bağlı: [[OKSİS - Yapısal Kararlar ve Eksikler]] `K-27` ⬜.
> Aynı gün önce: sınav takvimi ekran testi (Bölüm B, görüş penceresi ve ilk
> gerçek push turu): `TB-154`…`TB-158`. Kapananlar: `TB-155` (tarih/saat bitişikliği),
> `TB-157` (mükerrer push + yanıltıcı sıra gövdesi). `TB-158` yarı kapandı: kanal kuruldu
> ve ölçüldü, gösterim belirtisi sürüyor.
> Açık kalanlar: `TB-154` (karar bekliyor), `TB-156`. Önceki gün `TB-143`…`TB-153`.
> Ek olarak `TB-159` (kelebek oturumu taşınamıyor). Bir de `TB-160` (gözetmen çizelgesi ters koşul, kapandı). Ve `TB-161` (serpiştirme oturumdan oturuma değişiyor, kapandı). Defter **55**.
> Önceki: 2026-09-13 — Faz 2b ön ölçümü (`oksis-api` @ `20ab14bd`): `TB-140` açıldı
> (çağıran çözümleyicilerinin Attendance/Announcements ikizleri) ve `TB-139`'a kısa devrenin
> bugün erişilemez olduğu ölçümü eklendi. `TB-140` aynı gün kapandı
> (`oksis-api` @ `1905abbc`). Defter **35**.
> **Son yeniden düzenleme:** 2026-09-13 — belge merkezi yeniden yapılandırması
> (`oksis-api` @ `294ffe6`): `X-21` kapandı ([[OKSİS - Bulgu Arşivi]] §45); özet tablosu ve
> sıradaki boş ID başlıklar sayılarak yeniden hesaplandı. Defter **35**.
> Önceki: 2026-09-11 — sınav bildirim dilimi
> (`oksis-api` @ `7f716bb6`): Faz 2a Görev 6.1 ve 8.2 — `TB-128`…`TB-131` ve `X-21` eklendi.
> Defter **28**.
> Önceki: 2026-09-10 — bildirim altyapısı taraması
> (`oksis-api` @ `61808d25`): §11 Bildirimler açıldı, `TB-125`/`TB-126`/`TB-127` ve
> `E-23` eklendi. Defter **23**.
> Önceki: 2026-09-03 — Notlar ve Ödevler domain-map taramaları
> (`oksis-api` @ `b72c819`): `TB-105`…`TB-113` ve `X-20` eklendi. Defter **12**.
> Önceki: 2026-09-01 — `TB-48`/`X-03` bayat çıktı ([[OKSİS - Bulgu Arşivi]] §39); `K-12 §A1` hükümsüz.

**Sıralama mantığı:** modül bazlı gruplandı, modüller risk ağırlığına göre sıralandı
(aktif çalışılan ve akış bloklayan modül en üstte).

**ID şeması** (yeni partilerde devam eder):
- `B-##` → Fonksiyonel bulgu
- `D-##` → Tasarım / UX bulgusu
- `V-##` → Validasyon & iş kuralı bulgusu
- `X-##` → Çapraz kesen iş
- `TB-##` → Teknik borç (kod taramasından)
- `E-##` → Eksik özellik · `ENG-##` → Engel

**Sıradaki boş ID:** `B-51` · `D-19` · `V-04` · `X-22` · `TB-163` · `E-25` · `ENG-03`
*(`K-##` karar sayacı: sıradaki `K-28` — `K-16`…`K-26` modül belgelerinde kullanılmış.)*
*(`E-##` sayacı [[OKSİS - Yapısal Kararlar ve Eksikler]] ile ortaktır.)*

**Yazma kuralı:** yeni ID vermeden önce hem bu dosyada hem
[[OKSİS - Yapısal Kararlar ve Eksikler]]'de, hem de [[OKSİS - Bulgu Arşivi]]'nde `grep` at —
sayaçlar üçü arasında ortak.

---

## Özet

| Öncelik | Adet | Kapsam |
|---|---|---|
| 🔴 Kritik | 2 | Tenant izolasyonu / güvenlik (`TB-139`) · uygulama geneli çıktı kaybı (`TB-150`) |
| 🟠 Yüksek | 7 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 20 | İşlev eksik ama alternatif yol var; borç birikiyor |
| ⚪🟢 Düşük | 10 | Kozmetik, temizlik, adlandırma |
| ❓ Netleşmemiş | 0 | — |
| **Toplam** | **41** | |

**Modül dağılımı:** Notlar 5 · Ödevler 4 · Bildirimler 6 · Nöbet 1 · Çapraz kesen 25 (sınav ve okul açılışı maddeleri dahil)

**Senin kararını bekleyenler:** `TB-109` (vekâleten yayında sahiplik devri) ve `TB-111`
(tarihi ileri alınan ödevin yeniden hatırlatılması) ürün kararıdır; teknik borç olarak
kaydedildi çünkü ikisinin de kodda bilinçli bir "yapılmadı" gerekçesi var.

`K-13`/`K-14`/`K-15` 2026-09-01'de bağlandı — kayıt: [[OKSİS - Yapısal Kararlar ve Eksikler]].
Önceki tur: [[K-12 - Defter Sıfırlama Karar Turu]].

**Zincirler — hangi madde hangisini bekliyor**

```
X-06  ──►  ortak koşum kurulmadan yazılan her handler yeni borç ekler
```
*(Önceki turların zincirleri kapanan maddelerle birlikte arşive taşındı.)*

---

## 8. Nöbet & Vekalet 🟠

### `TB-19` · Geçici muafiyetin TÜKETİM noktası yok 🟡 *(dağıtım ayağı kapandı — 2026-08-31)*

✅ **Kapanan yarı (2026-08-31, `oksis-api` @ `8ed7024`).** Dağıtım işi muafiyeti
`CoversDay(today)` — **yöneticinin butona bastığı gün** — ile süzüyordu; koddaki yorum
ise baştan beri *"dönem-kapsayan Temporary"* diyordu. Canlıda ölçülen tablo (2026-08-12)
tam olarak bu ayrışmaydı: 3–14 Ağustos dönemi 12 Ağustos'ta koşturulunca 11–13 Ağustos
muafiyetli öğretmen havuzdan düştü, 13–14 Ağustos muafiyetli düşmedi.
`DutyExemption.CoversPeriod` eklendi: haftalık-tekrarlı çizelgeden çıkarma ölçütü
**dönemin tamamını** kapsayan muafiyettir. Naif "kesişiyor mu" düzeltmesi testle birlikte
elendi — beş aylık dönemde iki gün muaf olanı 20 haftalık nöbetten muaf tutardı
(`duty_assignments` tarih değil `day_of_week` taşır). İki nöbet okuma ucunun "bugün"ü de
UTC'den **okulun gününe** çevrildi.

⬜ **Açık kalan yarı — bir YÜZEY gerekiyor, bir düzeltme değil.** `K-12` §C2 kararı
*"öğretmen çizelgede kalsın, o tarihlerde yerine vekil geçsin"* diyor. Bunun için
**"3 Kasım'da hangi bölgede kim nöbetçi?"** diye soran bir tüketim noktası şart ve bugün
yok: çizelge `day_of_week` taşıyor, `GetMyDuties` tarihsiz dönüyor. Model hazır
(`DutyAssignment.RelieverId` var), eksik olan tarih eksenli sorgu ve onu gösteren ekran.

🚫 **Uç yazılıp ekran yazılmadı ve bu bilinçli:** bu tur aynı deseni üç kez ölçtü
(`E-22`, `TB-100`, `TB-82`) — *çağrılmayan uç, arkasındaki kusuru da saklar*. Yüzey
kararı verildiğinde ikisi birlikte yazılmalı.

---

## 9. Notlar 🟡

Kaynak: domain-map taraması, `oksis-api` @ `b72c819` (2026-09-03). Modülün haritası
[[Notlar]] notunda; dört madde de oradaki "Açık Sorular"dan deftere taşındı.

### `TB-105` · Kademe bazlı not ölçeği override'ının tüketicisi yok 🟡

Okul ayarlarında kademe başına ölçek seçilebiliyor ("ilkokul 5'lik, lise 100'lük") ve
bunu çözen bir servis yazılmış (`IGradeScaleResolver`, BR-SS-011 zinciri, Redis cache'li).
**Sembol referansıyla ölçüldü:** servisin kod tabanında tek tüketicisi yok — yalnız kendi
uygulaması ve DI kaydı. Not girişi (`GradeWriteContextFactory.ReadScaleMaxAsync`) ve
politika ucu doğrudan `SchoolSettings.DefaultGradeScaleId`'yi okuyor. Sonuç: override
ekranda seçiliyor, hiçbir davranışı değiştirmiyor; 5'lik ilkokulda üst sınır 100 kalıyor.
⬜ İki yol var: servisi not modülüne bağlamak (öğrencinin kademesi roster'dan biliniyor)
ya da override'ı ayar yüzeyinden kaldırmak. Geçme notu zinciri de aynı serviste ve aynı
şekilde ölü.

### `TB-106` · Akademik politikanın not alanları tüketicisiz 🟡

`TB-46` ağırlığı tek yere indirdi ama tüketici gelmedi: `WrittenWeight` /
`PerformanceWeight` politika ucunda (`GET /grades/policy`) istemciye dönüyor, hiçbir
hesaba girmiyor — dönem içi ders ortalaması bilinçli olarak ağırlıksız (`GradeMath`).
`WrittenExamCount` / `PerformanceCount` (1–3 doğrulayıcılı) ve `RoundingRule` de
okunmuyor; sütun kataloğu master sınav türlerinden geliyor, "üç yazılı" seçen okul üçüncü
sütunu açamıyor. ⬜ Bu alanların gerçek tüketicisi karne / dönem sonu notu; o modül
gelene kadar ekranda "çalışıyormuş gibi görünen" üç ayar var. Ya ayar yüzeyinden gizlenir
ya da karne kararına bağlanır.

### `TB-107` · Not yayın bildirimi kademe kapısını şubenin ilk öğrencisinden okuyor ⚪

`AssessmentPublishedNotificationHandler` "öğrenciye bildirim gitsin mi" sorusunu
`students[0].GradeLevel` ile tek kez cevaplıyor. Şube tek kademeli olduğu sürece doğru;
karma kademeli şube modelde yasak değil. Bugün belirti üretmez, varsayım koda yazılmamış.

### `TB-108` · Harf ölçeği seçilebiliyor ama not girişi harf kabul etmiyor 🟡

Master katalogda `HARFLI` ölçek var ve okul onu varsayılan seçebiliyor. Not girişi
`MarkValue.FromWire` ile yalnız sayı ve `G`/`M` tanıyor; harf ölçeğinin `MaxValue`'su
boş olduğundan üst sınır sessizce 100'e düşüyor. Harf sistemi seçen okulda öğretmen "A"
girince 400 alır, "85" girince kabul edilir. ⬜ Ya harf ölçeği katalogdan/seçimden
kaldırılır ya da harfli giriş ve ortalama kuralı tasarlanır ([[Not Ölçeği]] açık sorusu).

### `TB-113` · Not modülü "bugün"ü sunucu saatinden okuyor, okul takviminden değil ⚪

Gecikme rozeti (`GradeMath.IsOverdue`) ve yazma sonrası DTO'daki tarih
`DateTimeOffset.Now.LocalDateTime` ile hesaplanıyor (`ListMyGradeBooksQueryHandler` ve
altı yer daha). Ödev modülü aynı hesabı `ISchoolCalendarService.GetLocalNowAsync` ile
yapıyor ve kendi ARCHITECTURE notunda bunu "Grades'te bilinen sapma" diye işaretlemiş
ki "diğer modül böyle yapıyor" gerekçesiyle geri alınmasın. Bugün UTC+3'te tek okul
varken belirti üretmez; sunucu UTC'de koşarsa gece 00:00–03:00 arasında sütunlar bir
gün erken/geç "gecikmiş" görünür. ⬜ Yedi çağrı yeri tek servise bağlanır.

---

## 10. Ödevler 🟡

Kaynak: domain-map taraması, `oksis-api` @ `b72c819` (2026-09-03). Modülün haritası
[[Ödevler]] notunda. Dört madde de kodun kendi ARCHITECTURE notunda "açık madde" olarak
duruyordu ama defterde kaydı yoktu; ikisi ürün kararı bekliyor.

### `TB-109` · Vekâleten yayınlanan ödevin sahibi ayrılmış öğretmen kalıyor 🟡

Uç 4 (`:publish-for`) ayrılmış öğretmenin taslağını idare adına yayınlıyor ama
`OwnerTeacherPersonId`'yi değiştirmiyor. Takip ızgarasını işaretleme ve toplu tamamlama
`HomeworkWriteGate`'ten (sahip-only) geçtiği için **idare kendi yayınladığı ödevin
ızgarasını işaretleyemez**; kapatma ve iptal de sahibinindir. Teknik analiz §3 sahiplik
devri demiyor, spec'e uyuldu — ama ayrılmış öğretmen bir daha giriş yapmayacağı için o
ödev sonsuza dek "işaretlenmemiş" kalır ve kontrol bekleyenler panosunda yaşar.
⬜ Ürün kararı: sahiplik idareye mi devredilir, yoksa yönetme izni işaretleme kapısını
da açar mı? İkincisi Kulüpler'deki "kendi kulübüne bakan müdür yardımcısı danışman
görür" kalıbının kardeşidir.

### `TB-110` · İdari teslim kaldırma kapanmış ödevde 409 🟡

Uç 23 (`AdminRemoveHomeworkSubmission`) Faz 3'ün `Homework.RemoveSubmission`
sarmalayıcısından geçiyor ve o, ödev `Published` değilken `SubmissionClosedException`
atıyor. Sonuç: idare kapanmış ya da iptal edilmiş ödevin yanlış yüklenmiş (KVKK'ya
aykırı, başkasına ait) dosyasını kaldıramaz; tek yol ödevi yeniden açmak, o da yok.
Kural bilinçli olarak gevşetilmedi — ikinci bir kaldırma yolu aynı kuralı iki yerde
ayrıştırırdı. ⬜ Domain metoduna "idari" kolu eklenir (gerekçeli kaldırma durum kapısını
atlar) ya da kapanmış ödevde kaldırma ürün olarak kabul edilir.

### `TB-111` · Son teslim tarihi ileri alınan ödev ikinci kez hatırlatılmaz 🟡

`HomeworkTracking.DueReminderSentAt` satır başına idempotency damgası; `UpdateContent`
`DueDate`'i değiştirse bile sıfırlanmıyor. Öğretmen teslimi bir hafta ertelerse yeni
tarihin öncesinde hatırlatma gitmez. Sıfırlamak tersini yapardı: tarih bir gün
kaydırılınca herkese ikinci bildirim. ⬜ Ürün kararı; orta yol "tarih en az N gün
ileri alındıysa sıfırla" da mümkün.

### `TB-112` · Ödev denetim kaydı yazılıyor, okuyan uç yok ⚪

`HomeworkAuditEntry` beş olay tipiyle yazılıyor (yayın, adına yayın, iptal, toplu
tamamlama, idari kaldırma); sözleşmede `/homework/{id}/audit` bildirilmediği için hiçbir
ekranda görünmüyor. Not modülünün denetim ucu emsal (`grades.manage`). Çağrılmayan uç
arkasındaki kusuru da saklar — ucu yazmadan satırların şekli doğrulanamaz.

---

## 11. Bildirimler 🟠

Kaynak: `oksis-api` @ `61808d25` bildirim altyapısı taraması (2026-09-10). Zincirin
kendisi (olay → Hangfire → dispatcher → kanal → teslim kaydı) ayakta; bulgular
**ayar yüzeyi ile teslimat arasındaki kopukluk** üzerinde toplanıyor — `TB-43`'ün
kapattığı sahte toggle sınıfının kalan hâli.

### `TB-125` · Okulun bildirim ana anahtarı ve Portal kararı, kapsam eşlemesi dışındaki tiplerde hiç uygulanmıyor 🟠

`InAppNotificationChannel` iki kapısını da (`NotificationConfig.IsEnabled` ana anahtarı
ve `NotificationRuleConfig.PortalEnabled`) `PushEventKeyMap.TryGetEventKey` **başarılı
olursa** çalıştırıyor; eşlemede karşılığı olmayan tip `if` bloğunu atlıyor ve satır
koşulsuz yazılıyor. Eşlemede bugün 14 tip var, `NotificationKind` 39 değer taşıyor.

Kodun gerekçesi "eşlemede olmayan tipin matriste satırı da yoktur" — **bu artık doğru
değil.** Katalogda satırı olan ve gerçekten bildirim üreten beş olay eşlemenin dışında:
`ATT_THRESHOLD`, `ATT_DAILY_SUMMARY`, `ANNOUNCEMENT`, `HOMEWORK_MISSING`,
`EXAM_WINDOW_PUBLISHED`. Yönetici bu beşinin Portal sütununu kapatıyor, bildirim yine
düşüyor. Aynı sebeple **"bildirimleri tümden kapat" düğmesi** bu tipler ve eşleme dışı
kalan 20 tip (ders programı, nöbet, mazeret, düzeltme, izin, duyurunun sekiz hâli,
kayıt yenileme) için de çalışmıyor — kapının tek durağı in-app kanalıydı.

⬜ Kapı eşlemeden bağımsızlaştırılmalı: ana anahtar her tipte, Portal kararı ise
katalogda satırı olan her olayda uygulanmalı. `PushEventKeyMap` push kapsamının kaynağı
olarak kalır; matris kapısının kaynağı olmaktan çıkar.

### `TB-126` · Katalogda `email: true` seed edilen üç olay e-posta üretmiyor 🟡

`EmailNotificationChannel`'ın 1. kapısı da aynı eşlemedir: `PushEventKeyMap`'te olmayan
tip e-posta atmaz. Seed ise `ATT_THRESHOLD`, `HOMEWORK_MISSING` ve `ANNOUNCEMENT_URGENT`
satırlarını `email: true` ile yazıyor — yani "uyarı eşiği aşıldı e-postaya da gider"
kararı her okulun `notification_rule_configs` tablosunda yazılı, karşılığı yok.
`HOMEWORK_MISSING`'in kendi seed yorumu bunu ayrıca vurguluyor ("e-posta YALNIZ burada
açık: velinin kaçırmaması gereken tek ödev haberi").

Fiilen e-posta üreten tek katalog varsayılanı `GRADE_PUBLISHED`. Kalan 13 eşlemeli olay
e-postayı okul açarsa gönderir. `ANNOUNCEMENT_URGENT` zaten `delivered: false` ile
işaretli, diğer ikisi `true` — yani ekran onları "çalışıyor" diye gösteriyor.
⬜ `TB-125` ile aynı kapı düzeltmesine bağlı.

### `E-23` · SMS kanalının hiçbir uygulaması yok; matris sütunu, okul ayarı ve kota kartı sahte yüzey 🟡

`ISmsSender` bir arayüz olarak duruyor ("MVP'de concrete provider yok"), `Infrastructure`
altında implementasyonu ve DI kaydı **yok**; tek çağıranı da yorum satırı
(`RequestLoginOtpCommandHandler`). `INotificationChannel` uygulayan üç sınıfın hiçbiri
SMS değil. Buna karşılık sunucu yüzeyi SMS'i tam ciddiyetle taşıyor:
`NotificationChannel` enum'unda `Sms = 4`, katalogda `SupportsSms` + `DefaultSmsEnabled`,
altı olayda `supportsSms: true`, `PAYMENT_REMINDER`'da `sms: true` varsayılan,
`UpdateNotificationConfig`'te `SmsEnabled` + `DailySmsLimit`, ve `GET /schools/sms-quota`
sabit bir kota kartı döndürüyor (`IsPlaceholder: true`, 1000 kontör, gönderici başlığı
"OKUL").

`K-06` (2026-08-16) davet kanalı için "SMS/WhatsApp seçilemez" demişti ama matris sütunu
o kararla birlikte kaldırılmadı. ⬜ İki yoldan biri: sağlayıcı (Netgsm/İletimerkezi)
bağlanıp `SmsNotificationChannel` yazılır, ya da sütun ayar yüzeyinden gizlenip
`SupportsSms` katalogda `false`'a çekilir. Arada kalan hâl, yöneticiye kontör harcadığını
düşündüren bir toggle.

### `TB-127` · Kulübün dört katalog satırı hâlâ `delivered: false`, üreticileri var ⚪

`NotificationEventTypeSeedData` dört `CLUB_*` satırını `delivered: false` ile yazıyor ve
yorumu "handler'lar Faz 5'te yazıldığında bayrak kendi migration'ıyla `true`'ya çevrilir"
diyor. Faz 5 geldi: dört bildirim handler'ı da (`ClubActivityPublished`,
`ClubActivityCancelled`, `ClubAnnouncementPublished`, `ClubApplicationDecided`) yazılı ve
`PushEventKeyMap` kapısı da açık. Bayrağı çeviren migration yazılmamış — model
snapshot'ta dördü hâlâ `IsDelivered = false`.

Zararı `TB-24`'ün tersi yönde: ekran çalışan bir bildirimi "henüz teslim edilmiyor" diye
gösteriyor. ⬜ Tek satırlık seed düzeltmesi + migration (emsal: `20260828130231`).

---

### `TB-128` · Sınav bildirimlerinin alıcı çözümü öğrenci başına iki sorgu koşuyor ⚪

`ExamNotificationAudience.StudentConsumersAsync` her öğrenci için ayrı ayrı veli çözümlemesi
yapıyor — öğrenci sayısı kadar resolver çağrısı, her çağrı iki sorgu. Bir kelebek oturumunun
takvimi yayınlandığında oturumdaki öğrenci sayısı yüzleri bulabilir; bildirim üretimi o anda
lineer sayıda gidiş-dönüş yapar.

2026-09-11'de Faz 2a Görev 6.1'in uygulamasında ölçüldü. Bugün ısırmıyor çünkü üretim arka
planda (`Enqueue`) koşuyor ve kimse beklemiyor; borç, sınıf mevcudu değil **oturum mevcudu**
büyüdükçe birikiyor.

⬜ Kapatma yolu: veli çözümleyici port'una toplu bir uç eklemek
(`ResolveGuardiansByStudentMapAsync(IEnumerable<Guid>)` → `Dictionary<Guid, Guid[]>`), çağrıyı
tek sorguya indirmek.

---
### `TB-129` · Sınav modülünün Faz 1 bildirim işleyicileri testsiz ⚪

`Modules/Exams/Events/Notifications/` altındaki üç Faz 1 işleyicisi —
`ExamWindowPublishedNotificationHandler`, `ExamHourRequestedNotificationHandler`,
`ExamHourAnsweredNotificationHandler` — hiçbir testte ölçülmüyor (`tests/` altında karşılık
gelen dosya yok). Faz 2a Görev 6.1'de eklenen üç işleyicinin (`ExamInvigilatorChanged`,
`ExamSeatingChanged`, `ExamSessionSectionsChanged`) testi var; eski üçü boşlukta.

2026-09-11'de Görev 6.1'in ön uçuşunda ölçüldü, kapsam genişlemesi olacağı için o göreve
alınmadı.

Pratik anlamı: bu üçünün alıcı kümesi, eşiği ve gövde metni yalnız kod okumasıyla
doğrulanmış durumda. Bir refactor sessizce kitleyi daraltsa ya da bildirimi hiç üretmese
paket yeşil kalır.

⬜ Kapatma yolu: Görev 6.1'in `ExamSessionNotificationTests` deseni birebir uygulanabilir —
sarmalayıcıyı yayınla, `Sent` kümesini ve `Kind`'ı ölç. Üç dosya, yaklaşık altı test.

---

## 12. Çapraz Kesen İşler ✳️

Tek bir ekranın değil, bir **sınıfın** işi. Kapanışları da merkezî olmak zorunda
([[yamalama-kabul-degil]]).

### `E-24` · Yeni okul açmanın ve ilk okul yöneticisini yaratmanın üründe yolu yok 🟠

Altınay Anadolu Lisesi sıfırdan açılış hazırlığında ölçüldü (2026-09-15, `oksis-api` @
`20f5765f`). Bir okul OKSİS ile anlaştığı gün yapılacak ilk iş üründe yapılamıyor:

| Kapı | Durum |
|---|---|
| `School.Create` | Domain'de var; **üretim kodunda hiç çağrılmıyor**, yalnız testler |
| Okul/tenant/platform controller'ı | **Yok** — V1'deki `SchoolSettings`, `SchoolHolidays`, `PublicSchoolLogo` var olan okulu düzenler |
| Dev okulları | `DevDataSeeder` okulu ham SQL ile yazıyor (`DevDataSeeder.cs:95`); `School.Create` ve `SchoolCreatedEvent` hiç koşmuyor — seed'li hiçbir okul gerçek açılış yolunu ölçmüyor |
| İlk yönetici | `CreateInvitationCommandHandler:21` okulu çağıranın bağlamından alıyor; yeni okulda daveti gönderecek hesap yok (kısır döngü) |
| Kurulum sihirbazı | `OnboardingStatus`'un altı satırı olayla açılıyor ama okuyan/ilerleten uç ve ekran **yok** |
| Platform yüzeyi | İzin kataloğunda platform modülü yok; web'de platform rolü/rotası yok |

**Sonucu:** pilot okul geliştirici müdahalesi olmadan açılamaz.

⬜ **Kapatma yolu seçildi, kimlik kararı bekliyor.** 0008'in yalnız "okul kaydı" öbeği
uygulanacak (okul oluştur + kademe/sezon iskeleti + ilk yönetici daveti); tasarımı
[[OKSİS - Yapısal Kararlar ve Eksikler]] `K-27`'ye (platform kimliği) bağlı.

### `TB-162` · Taze okulda kademeler hiç oluşmuyor — tohumlayıcı boş listeye bakıyor 🟡

`SeedSchoolGradeLevelsHandler` kademeleri `SchoolSettings.SchoolTypes`'tan türetiyor ve
liste boşsa hiçbir şey yapmadan dönüyor (`SeedSchoolGradeLevelsHandler.cs:76`). Aynı olayın
`SchoolCreatedEventHandler`'ı ayarı `SchoolSettings.CreateDefault` ile açıyor ve okul türünü
yazmıyor; olay da türü taşımıyor (`SchoolCreatedEvent(Guid SchoolId, string Name)`). Yani
gerçek `School.Create` yolunda tohumlayıcı **her zaman** boş döner. Dev okullarında
görünmüyor, çünkü `ClassRoomDevSeeder:84` onu ayar yazıldıktan sonra elle çağırıyor —
`E-24`'teki "seed gerçek yolu ölçmüyor" kalıbının ilk somut kurbanı.

Okul türünü sonradan yazan `UpdateAcademicStructureCommand` de kademeyi yeniden türetmiyor
(`SchoolSettingsUpdatedEvent`'in kademeyle ilgili dinleyicisi yok). Yönetici kademeleri
`UpdateSchoolGradeLevelsCommand` ile elle seçmek zorunda — alternatif yol var, bu yüzden 🟡.

⬜ Kapatma `E-24`'ün okul kaydı dilimine girer: tür okul açılırken bilinir, tohumlama o anda
yapılabilir.

### `TB-159` · Kurulan kelebek oturumunun saati değiştirilemiyor, şubesi düzenlenemiyor 🟠

Ekran testinde çıktı (2026-09-15, Bölüm B9). Yayınlanmış bir kelebek penceresinde bir
oturumu başka güne/saate almanın **hiçbir yolu yok**. Dört kapı da kapalı:

| Kapı | Durum |
|---|---|
| `ExamSession.Date` / `Period` | `private set`; **onları değiştiren tek bir metot bile yok** |
| "Oturumu taşı" komutu | **Yok** — `Commands/` altında karşılığı bulunmuyor |
| `MoveExam` (tek sınavı taşır) | Sunucuda **var**, ama tek UI kapısı panonun `Liste` görünümü ve o görünüm oturum modunda **bilerek gizli** (`exam-board-screen.tsx:714`) |
| `UpdateSessionSections` (şube çıkar) | Sunucuda var, `packages/api`'de mutation'ı da var, **hiçbir ekran çağırmıyor** |

Son satır ayrıca kendi başına bir ölü kapı (`TB-151` ile aynı sınıf): uç ve istemci
sarmalayıcısı yazılmış, çağıran yüzey hiç yazılmamış.

**Pratik sonucu ağır.** Son şube çıkarıldığında oturum derslikleri ve sıralarıyla birlikte
siliniyor (`UpdateSessionSectionsCommandHandler:293`) — yani *silme* aslında var, ama ona
ulaşan bir düğme yok. Dolayısıyla yanlış saate kurulmuş bir oturum **kalıcıdır**. Takvim
yayınlandıktan sonra sınav saatinin hiç değiştirilememesi, modülün gerekçe/sürüm/revizyon
makinesiyle de çelişiyor: o makine "yayından sonra değişiklik olur, izi tutulur" varsayımı
üzerine kurulmuş (`ExamWindowRevision`, `EX-H08`, sürüm artışı) ama oturumun kendi zamanı o
makinenin kapsamı dışında kalmış.

Ders saati modunda (Faz 1) aynı sorun yok: orada `Liste` görünümü ve "Taşı" düğmesi duruyor.
Eksik yalnız kelebekte.

⬜ **Kapatma yolu kararla başlar.** İki seçenek var ve ikisi farklı şey:
① oturumu bütün olarak taşıyan bir komut (derslikler ve gözetmenler yeniden türer, sıralar
yeniden üretilir, revizyon kaydı düşer); ② oturum ekranına şube düzenleme yüzeyi (var olan
`UpdateSessionSections`'ı çağırır, son şube çıkınca oturum silinir). ①'siz ②, yöneticiyi
"sil ve yeniden kur"a mecbur bırakır ve öğretmen görüşleri ile elle yazılmış gözetmenler
her seferinde kaybolur.

### `TB-158` · Push tepsiye düşüyor ama ekranı uyandırmıyor 🟡

Aynı testte ölçüldü (2026-09-15): push telefona **düştü** ama **ekran uyanmadı**, bildirim
üste çıkmadı — kilit ekranında sessizce bekliyordu.

Android 8'den (API 26) beri bir bildirimin sesini, titreşimini ve üste çıkıp çıkmayacağını
**payload değil KANAL** belirler. İki uçta birden eksikti:

| Yer | Eksik |
|---|---|
| Sunucu (`FcmSender`) | Mesajda `AndroidConfig` **hiç yoktu** — öncelik, kanal kimliği, ses belirtilmiyordu; `ApnsConfig` de yoktu |
| Mobil | Kanal **hiç oluşturulmuyordu**; manifest'te `default_notification_channel_id` meta-verisi de yoktu |

Kanal yokken FCM kendi yedek kanalını kullanıyor ve onun önem derecesi düşük.

🟡 **YARI KAPANDI — belirti sürüyor.** Aşağıdaki iki uç da yapıldı ve ölçüldü, ama
**ekran hâlâ uyanmıyor, ses ve titreşim yok** (2026-09-15, Redmi M2003J15SC / MIUI).
Bildirim tepsiye düşüyor, üste çıkmıyor.

Kesin olan (ölçüldü):

| Ölçüm | Sonuç |
|---|---|
| Kanal cihazda var mı | ✅ `dumpsys notification` → `mId='oksis-default'`, **`mImportance=4`** (HIGH), `mOriginalImp=4`, `mUserLockedFields=0`, `mVibrationEnabled=true`, ses tanımlı |
| Sunucu gönderdi mi | ✅ `push_deliveries` → `Sent`, `error_code` boş |
| Bildirim sayısı | ✅ **tek** — mükerrerlik yok |

Yani Android'in kendi kayıtlarına göre kanal doğru, öncelik doğru, teslim başarılı; **kalan
şey gösterim.** Sınanmamış ilk şüpheli: MIUI'nin kanal önem derecesinin ÜSTÜNE binen kendi
"kayan bildirim" anahtarı — yeni kurulan uygulamalarda varsayılan kapalıdır ve Android'in
`mImportance` değerini değiştirmeden davranışı bastırır. **Doğrulanmadı**; sıradaki iş
cihazın uygulama bildirim ayarlarını açıp kanalın MIUI tarafındaki hâline bakmak, sonra
aynı yükü ikinci bir (MIUI olmayan) cihazda denemek. Kullanıcı kararı: bulgu açık kalsın,
sonra dönülecek.

Yapılan ve yerinde duran (kapatmanın ön koşulu, tek başına yetmedi) — tek kimlikle
(`oksis-default`):
- `FcmSender`: `AndroidConfig` (`Priority.High` + `ChannelId`) ve `ApnsConfig`
  (`apns-priority: 10`, `Sound = "default"`). Kimlik `FcmSender.AndroidChannelId` sabitinde.
- `apps/mobile/plugins/with-notification-channel.js`: `MainApplication.onCreate`'te
  `IMPORTANCE_HIGH` kanalını oluşturur, manifest'e varsayılan kanal meta-verisini yazar.
  **Config plugin olmak zorunda** — `android/` üretilir ve gitignore'dadır (`TB-90`).
  `expo prebuild` koşturularak çıktı doğrulandı.

**İki kimlik ayrışırsa sessizce gerilenir:** sunucu var olmayan bir kanal ister ve yine
yedek kanala düşülür — hata değil, sessiz kayıp. İkisi de kendi dosyasında bu gerekçeyle
yorumlandı.

⬜ **Kalan:** iOS'tan bugüne kadar **hiç cihaz kaydı gelmemiş** (17 kaydın 17'si Android).
Bu ayrı bir arıza ve muhtemelen Apple hesabı eksikliğine dayanıyor
([[magaza-hesaplari-yok]]); ayrıca ölçülmeli.

---

### `TB-154` · Yayın kapısının "gerekçe" kuralı ekranda ve sunucuda iki türlü 🟠

Ekran testinde çıktı (2026-09-15, Bölüm B7). Takvim yayınlarken hangi ihlalin **gerekçe**
istediği iki yerde ayrı tanımlanmış ve ikisi uyuşmuyor:

| | Engelleyen | Gerekçe isteyen |
|---|---|---|
| Sunucu (`PublishExamScheduleCommandHandler`) | sert kodlar − `EX-H08` | **yalnız** `EX-H08` ve `EX-S05` |
| Ekran (`ExamPublishScheduleModal`) | sert kodlar − `EX-H08` | **her yumuşak ihlal** (`warned.length > 0`) |

Engelleme tarafı tutarlı; ayrılık gerekçededir ve **iki yöne birden** kanıyor:

- **Ekran fazla sıkı.** `EX-S04` (karışmamış derslik) ve `EX-S06` (kapasite aşımı) için
  gerekçe dayatıyor — oysa sunucunun kendi yorumu açık: *"K-23 gereği ikisi de yalnız
  görünür, yayını kapatmaz ve **gerekçe de istemez**."* Ekran, kararın reddettiği kapıyı
  kuruyor.
- **Sunucu fazla gevşek.** `EX-S08` (çözülmemiş öğretmen görüşü) için gerekçe istemiyor;
  oysa kuralın kendi yorumu şöyle: *"Yorum sessizce gömülmez: yönetici ya 'ele aldım' der
  ya gerekçe yazar."* İkinci şık kurulmamış. Ekran dışından yapılan bir `POST
  windows/{id}:publish-schedule` çağrısı, çözülmemiş öğretmen görüşlerinin üzerinden
  **gerekçesiz** geçer.

Sınıf tanıdık: [[kural-ekranda-degil-sunucuda]] (`TB-32`). Ekranın uyguladığı kural,
sunucunun bilmediği kuraldır — ikinci bir istemci ya da düz uç çağrısı onu yok sayar.

⬜ **Kapatma yolu kararla başlar, kodla değil.** Önce tek bir soru cevaplanmalı: gerekçe
kapısı hangi kodlarda açılır? Cevap `packages/core`'da tek bir `examPublishNeedsReason(codes)`
yüklemine yazılır, ekran ve sunucu **onu** okur. Bugün liste iki dosyada elle tutuluyor;
üçüncü bir kod eklendiğinde yine ayrışır.

### `TB-156` · Görüş döngüsü açıldıktan sonra iki yönde de sessiz 🟡

Ekran testinde yakalandı (2026-09-15, Bölüm B7). Görüş penceresinin **tek** bildirimi var:
`ExamReviewOpened` (yönetici → öğretmenler). Döngünün geri kalanı sessiz:

| Olay | Bildirim | Sonuç |
|---|---|---|
| Yönetici görüşe açar | ✅ `ExamReviewOpened` | öğretmen zilden görür |
| Öğretmen görüş bırakır | ❌ yok | **yönetici haberdar olmaz** |
| Yönetici "çözüldü" işaretler | ❌ yok | öğretmen haberdar olmaz |

`SessionReviewComment.Resolve()` ve yorum ekleme yolu hiç olay üretmiyor (`Raise` çağrısı
yok, `NotificationKind`'da karşılığı yok).

**Ağır olan ikinci satır.** Görüş penceresi 3 gün açık; yönetici oturum ekranına girip
**Öğretmen Görüşleri** sekmesindeki sayaca bakmadıkça öğretmenin uyarısından haberi olmaz.
`EX-S08` de yayını kapatmadığı için (`TB-154`) takvim, okunmamış bir görüşün üzerine
yayınlanabilir. Öğretmene "görüşünü bırak" denip görüşün okunmaması, yüzeyi ölü hâle
getirir.

Üçüncü satır daha hafif ama kullanıcı testinde ilk fark edilen bu oldu: yönetici çözdüğünde
öğretmenin zili artmıyor; etiket yalnız sayfayı yeniden açarsa görünüyor.

⬜ Kapatma yolu: iki yeni `NotificationKind` (`ExamReviewCommentAdded` → oturumun yöneticisi,
`ExamReviewCommentResolved` → yorumun sahibi). İkisi de `Info`; "bekleyen iş" işaretlenmez —
`ExamReviewOpened`in gerekçesi burada da geçerli. Push haritasına **girmez**, zil yeter.

### `TB-152` · Ders programı yayınlanmamış şube sınav takviminden sessizce düşüyor 🟡

Ekran testinde yakalandı (2026-09-14, Bölüm B): kelebek oturumu kurarken Türkçe için
**5 şube** listeleniyor, oysa okulda 6 şube var ve altısının da Türkçe dersi tanımlı.
Eksik olan **12-A**. Pano da aynı şeyi söylüyor: toplam beklenti **49**, oysa
6 şube × 10 ders = **60** olmalıydı.

**Sebep ölçüldü ve DOĞRU davranış:** `ExamExpectationReader` beklentileri yalnız CANLI
ders programından türetir — `IsActive && IsReserving`. `IsReserving`, yerleşimin sahibi
programın `Published`/`Revising` olduğunu söyler; taslak programların yerleşimleri slot
rezerve etmez. 12-A'nın ders programı henüz **taslak** durumda:

| Süzgeç | Çift sayısı |
|---|---|
| `is_active = 1` | 59 |
| `is_active = 1 AND is_reserving = 1` (beklenti kaynağı) | **49** |
| Fark | **10 — hepsi 12-A** (o şubenin on dersinin tamamı) |

Yayınlanmamış bir programdan sınav saati türetmek yanlış olurdu; kural yerinde.

**Kusur, kuralın GÖRÜNMEZ olması.** Hiçbir yüzey 12-A'nın neden yok olduğunu söylemiyor:

| Yüzey | Ne diyor | Ne demesi gerekirdi |
|---|---|---|
| Pano KPI | `0/49` | 49'un neyi kapsadığı ve neyin dışarıda kaldığı |
| Oturum sihirbazı, ders kartı | *"5 şube bekliyor"* | 6 şubeden 5'i; 12-A'nın programı taslak |
| Oturum sihirbazı, şube adımı | 12-A satırı **hiç yok** | satır dursun, sebebiyle birlikte seçilemez olsun |
| Yayın ön kontrolü | `EX-S05` yalnız beklenen çiftleri sayar | beklentiye hiç girmeyen şube orada da görünmez |

Modülün kendi yazılı kuralı bunun tersini söylüyor — kâğıt çıktılarının üçüncü maddesi:
*"ÇIKTI SESSİZCE EKSİLTMEZ. Sırasız kalan öğrenci ve gözetmensiz derslik kâğıtta ADIYLA
yazılır."* Aynı ilke ekranda uygulanmamış.

**Zararı somut:** 12-A'nın öğrencileri o sınav döneminde hiçbir sınava girmez ve bunu
kimse fark etmez — ne yönetici panosunda bir uyarı çıkar, ne yayın kapısı ısırır. Sessiz
bir eksilme, yanlış bir sayıdan daha tehlikelidir çünkü kimse aramaz.

⬜ **Yapılacak:** beklenti okuyucusu, elenen şube × ders çiftlerini de SEBEBİYLE birlikte
döndürsün (canlı program yok / görevlendirme yok) ve üç yüzey bunu göstersin: pano bir
uyarı satırı, sihirbaz seçilemez bir satır, yayın ön kontrolü yumuşak bir kural. Kural
değişmez — yalnız görünür olur.

---
### `TB-151` · Taslak kelebek penceresinde "Oturum kur" ölü bir kapı 🟡

Ekran testinde yakalandı (2026-09-14, Bölüm B): yeni kurulan oturumlu pencerenin
panosunda sağ üstte **"Oturum kur"** düğmesi duruyor. Basınca modal açılıyor ve şunu
yazıyor:

> *"Bu pencerede yerleştirilmeyi bekleyen sınav yok; kurulacak oturum da yok."*

Düğme *"**0 şubeyle** oturumu kur"* olup devre dışı kalıyor. Yani kapı görünür, açılır ve
arkasında hiçbir şey yoktur.

**Zincir ölçüldü:**

| Halka | Ölçüm |
|---|---|
| Düğme koşulu | `isSession && view === "sessions" && w.status !== "locked"` → **taslakta çizilir** |
| Pano sorgusu | `useExamBoard(isDraft ? undefined : w.id)` → taslakta `enabled: false`, **hiç koşmaz** |
| Modalın kaynağı | panonun kendi yanıtı (`exams` prop'u, ikinci uç yok) → **boş dizi** |
| Sunucu | `CreateExamSession` yalnız `Locked`'ı reddeder (`ExamPlacementGuards`) → **taslakta oturum kurmaya İZİN VERİR** |

Yani ekran, sunucunun izin verdiği bir işi görünür bir düğmeyle vaat edip yapamıyor.
Beklenen satırların (`49` şube × ders) DB'de karşılığı yok — pano onları
`ExamExpectationReader` ile ders programından türetir ve taslakta o okuma hiç yapılmaz.

**İkinci kusur aynı ekranda:** taslak panosunun boş durum metni **mod körü**:

> *"Pencere yayınlanmadan planlı sınav üretilmez… Önce pencereyi yayınlayın, **öğretmenler
> sınavlarını yerleştirsin**."*

Kelebekte öğretmen yerleştirme yapmaz; oturumu **yönetici** kurar (domain notu §4: *"Oturum
iki yoldan doğar: öğretmen yerleştirdiğinde ya da yönetici şube listesiyle kurduğunda"*).
Cümle ders saati modundan devralınmış.

⬜ **Karar gerekiyor:** taslakta oturum kurulabilmeli mi?
- **(a) Hayır** → düğme taslakta **çizilmesin** (koşula `!isDraft` eklensin) ve boş durum
  metni kelebekte mod farkını söylesin. Ucuz; sunucu kapısı da `Draft`'ı reddetmeli
  ki [[kural-ekranda-degil-sunucuda]] ihlali kalmasın.
- **(b) Evet** → taslakta pano sorgusu koşsun (`enabled` kapısı kalksın); yönetici haftayı
  duyurmadan önce oturumları hazırlayabilsin. Kelebeğin akışına daha yakın, çünkü
  yerleştiren öğretmen yok.

**Bu tur için etkisi:** akış **önce "Pencereyi yayınla"** diyerek işliyor; test bloke
olmadı, ama yönetici önce ölü kapıya çarpıyor.

---
### `TB-150` · Devamsızlık'ın resmî yazı kuralı TÜM uygulamanın çıktısını gizliyor 🔴

Ekran testinde yakalandı (2026-09-14, A7): sınav takviminin *"Yazdır"* düğmesi tarayıcı
önizlemesini açıyor ama önizleme **bembeyaz** — tek boş A4, altında `localhost:3000/exams 1/1`.
Oysa diyaloğun arkasındaki ekranda kâğıt doğru çizilmiş durumda.

**Kök sebep — başka bir modülün kapsamsız baskı kuralı.** `threshold-letter.css`
(Devamsızlık › Eşik Aşımı Resmî Yazısı) şunu taşıyor:

```css
@media print {
  body > *:not(.tl-print-root) { display: none !important; }
}
```

Resmî yazı `document.body`'e portal atıldığı için kabuğu boşaltması doğrudur — **ama kural
o ekranın açık olmasına bağlı değil.** `globals.css` tüm stilleri tek pakette yüklüyor, yani
bu satır **her sayfada** yürürlükte. Uygulama kabuğu da `body`'nin doğrudan çocuğu
(`body > div.shell`). Sonuç: **hangi ekrandan basılırsa basılsın `.shell` `display:none`
oluyor** ve kâğıda hiçbir şey düşmüyor.

**Tarayıcıda ölçüldü** (Playwright, `emulateMedia({media:'print'})`, yönetici oturumu,
1. Sınav panosu → Yazdır görünümü):

| Ölçüm | Düzeltmeden önce | Sonra |
|---|---|---|
| `.shell` `display` | **`none`** | `block` |
| Belge yüksekliği | 823 px (tek görüntü alanı) | 2271 px |
| `.ex-pr-sheet` sayısı | 5 (DOM'da var, kâğıtta yok) | 5 |
| Üretilen PDF | boş | **5 sayfa, şube başına bir sayfa** |

**Kapsam tek modül değil.** Kural genel olduğu için yazdırma stili olan her yüzeyi
vuruyordu: sınav takviminin dört çıktısı (şube takvimi · kapı listesi · oturma planı ·
gözetmen çizelgesi) ve **Ders Programım** (`schedule-read.css`). İkisi de kendi
`@media print` bloğunu doğru yazmıştı; hiçbiri iş görmüyordu.

**Neden bugüne kadar görülmedi:** her iki ekranda da "yazdır" bir ÖNİZLEME görünümü açıyor
ve önizleme ekranda doğru çiziliyor. Doğrulama orada durmuş, **kâğıt hiç üretilmemişti**
(krş. [[besleyen-yuzey-olculmeden-kapanmaz]]). Bu, modülün Faz 1 çıktısının da hiç
çalışmamış olduğu anlamına gelir.

**İkinci, daha küçük kusur aynı turda ölçüldü:** kabuk `body { overflow: hidden }` ile
kilitli (ızgara `100vh`, kaydırma `.main`'de) ve gövdedeki taşma bildirimi CSS gereği
görüntü alanına yayılıp baskıda belgeyi tek sayfaya kırpıyor. Kabuk gizlenmeseydi bile
çıktı tek sayfada kalacaktı.

✅ **Düzeltildi** (`oksis-ui`, 2026-09-14):

1. `threshold-letter.css` kuralı sahibine bağlandı —
   `body:has(.tl-print-root) > *:not(.tl-print-root)`. Resmî yazı açıkken davranış
   birebir aynı (portal `body`'nin doğrudan çocuğu), kapalıyken kural hiç yok.
2. `shell.css`e tek bir **baskı tabanı** kuruldu: `html, body { overflow: visible;
   height: auto }`, ızgaranın çözülmesi, gezinme parçalarının gizlenmesi. `exam.css` ve
   `schedule-read.css` kopyaladıkları kabuk ezmelerini bıraktı, yalnız kendi parçalarını
   gizliyor. Blok dosyanın SONUNDADIR — `.shell { display: grid }` ile aynı özgüllükte
   olduğu için ondan sonra gelmek zorunda (başa konduğunda ızgara kazanıyordu, bu da
   ölçüldü).

Merkezî kapanış, [[yamalama-kabul-degil]] gereği.

⬜ **Kalan:** resmî yazı çıktısının kendisi (`.tl-print-root` yolu) gözle doğrulanmadı —
kapsam daraltması davranışı değiştirmemeli ama o ekrandan bir baskı alınmalı.

**Ders:** bir modülün `@media print` kuralı `body > *` gibi kökten seçici kullanıyorsa,
kendi kökünün varlığına bağlanmadıkça **uygulamanın tamamının** kuralıdır.

---
### `TB-148` · Öğretmen yerleştirdiği sınavı geri alamıyor — domainde var, üründe yok 🟡

Sınav saatini seçen öğretmen onu **yalnız değiştirebiliyor**; kaldırıp "henüz karar
vermedim" hâline döndüremiyor. Kullanıcının ekran testindeki tespiti (2026-09-14).

**Ölçüldü:** `ScheduledExam.Unplace()` domainde **yazılı ve eksiksiz** — tarihi, saati,
ev sahibi yerleşimini, ödünç saat bayrağını ve istek durumunu temizleyip satırı
`Unplaced`'a döndürüyor. Tek çağıranı `UpdateSessionSectionsCommandHandler` (kelebekte
şube oturumdan çıkarıldığında). Öğretmenin kullanabileceği bir komut, uç ya da düğme
**yok**.

`TB-132`/`TB-146` ailesinden: yetenek sunucuda duruyor, ürün ona hiç ulaşmıyor.

⬜ **Kullanıcı kararı (2026-09-14):** *"Takvim yayınlanmadığı sürece öğretmen geri
alabilmeli."* Yani kapı pencerenin durumudur: `Draft`/`WindowPublished`'da serbest,
`SchedulePublished`/`Locked`'da kapalı — yayınlanmış bir takvimden sınav çekmek
öğrencinin gördüğü satırı sessizce silmek olurdu; o iş zaten yöneticinin revizyon
yoludur.

**Kapsam kararı gereken üç ayrıntı:**
1. **Ödünç saat:** sınav başkasının saatine yerleşmişse geri alma o saati ev sahibine
   iade eder. Bekleyen (cevaplanmamış) bir istek varsa ne olur — iptal mi edilir,
   yoksa geri alma reddedilir mi?
2. **Kelebek modu:** oturumdaki sınavı geri almak şubeyi oturumdan çıkarmaktır ve
   derslik/sıra yeniden üretimi gerektirir (`UpdateSessionSections` yolu). Öğretmene
   açılacak mı, yoksa yönetici yolu mu kalacak?
3. **Bildirim:** pencere yayındayken geri alma öğrenciye/veliye haber verilmeli mi?
   (Takvim yayınlanmadığı için aile henüz saati görmüyor — muhtemelen hayır.)

### `TB-145` · "Sınav haftası" duyurusu okulun tamamına değil, tek şubeye gidiyor 🟡

`NotificationKind.ExamWindowPublished`'ın kendi dokümanı iki yerde okul geneli diyor:

> *"Alıcı okulun üç yüzü birden: öğrenci ve veli 'sınav haftası şu tarihlerde' bilgisini
> alır; öğretmen aynı cümleyle 'yerleştirme açıldı' haberini alır."*
> *"Push YOK — gerekçe fan-out'tur: tek işlemde **okulun tamamına** gider…"*

**Kod okulun tamamına göndermiyor.** `ExamWindowPublishedNotificationHandler` alıcı kümesini
BEKLENEN SINAV kümesinden (`ExamExpectationReader`) türetiyor: yalnız o pencerede sınavı
beklenen şubelerin öğrenci/velileri ve o sınavların sorumlu öğretmenleri.

Ölçüldü (2026-09-13, ekran testi, `s2` 1. Dönem penceresi): pencere yayınlandığında **25**
bildirim doğdu ve öğrenci tarafındaki alıcıların tamamı **tek şubedendi (11-A)** — çünkü o
dönemde beklenen 10 şube × ders çiftinin hepsi 11-A'nın. Ders programında 1. Dönem'de altı
şube (10-A, 10-B, 11-A, 11-B, 12-A, 12-B) olmasına rağmen 11-B öğrencisi
(`ogrenci.s2.001`) haberi hiç almadı. Testi yapan kişi "bildirim düşmedi" diye okudu;
düşmemesi doğruydu ama sebebi belgede yazmıyor.

**Neden önemli:** ② `ExamSchedulePublished`'ın doküman cümlesi *"`ExamWindowPublished`'dan
DARDIR — yalnız sınavı olan şubeler"* diyor. İkisi aynı kapsamı kullanıyorsa bu ayrım
yoktur; ① push'un kapsam dışı bırakılma gerekçesi (okul geneli fan-out) da gerçeğe
dayanmıyor — gerçek fan-out tek şube kadar.

⬜ **Karar gerekiyor:** ya kapsam okul geneline çıkarılır (o zaman push gerekçesi de doğru
olur), ya iki tipin doküman cümleleri gerçeğe çekilir ve "dar/geniş" ayrımı kaldırılır.
Ürün kararıdır: *sınavı olmayan şube "sınav haftası" haberini almalı mı?*

---
### `TB-144` · Taslak kartı ihlal sayısı gösteriyor ama açılacak yeri yok ⚪

Taslak pencerenin kartında **"1 İhlal"** yazıyor; panoya girince ekran
*"Pencere henüz yayınlanmadı — panonun gösterecek içeriği yok"* diyor ve ihlal listesi
hiç çizilmiyor. Yönetici sayıyı görüyor, karşılığını göremiyor.

Ölçüldü (2026-09-13, ekran testi, `s2` 1. Dönem): kartın `violationCount` alanı pencere
listesinin BEKLENEN kümesinden türüyor (`ExamPublishFacts.FromExpectations`) ve taslakta
tek satır `EX-S05` oluyor — "10 şube × ders için saat seçilmedi". Bu taslakta zaten
kaçınılmaz: hiçbir şey yerleşmemiştir.

**İki yol var, biri seçilmeli:**
- **(a)** Taslakta ihlal sayacını **gösterme** — sayı bilgi taşımıyor, yalnız kaygı üretiyor.
- **(b)** Panonun taslak boş-hâli ihlal listesini **yine de** çizsin (yalnız `EX-S05`).

(a) daha doğru görünüyor: taslağın anlamı "henüz kimse yerleştirmedi"dir ve bunu kart
zaten `0/10 · %0` ile söylüyor.

---
### `TB-143` · Pencere modali olmayan bir yola gönderiyor — sınav türü hiçbir yerden tanımlanamıyor 🟠

Dönemin sınav türleri tükendiğinde pencere kurma modali şunu yazıyor ve düğmeyi kapatıyor:

> *"Bu dönemin bütün sınav türleri için pencere zaten açılmış. **Yeni tür akademik
> takvimden tanımlanır.**"*

**Böyle bir yol yok.** Ölçüldü (2026-09-13, çalışan API): `exam-types` ucunun tek metodu
`GET`'tir; `ExamType` bir `MasterEntity`'dir ve depoda onu yazan hiçbir komut, hiçbir uç,
hiçbir ekran yoktur. "Akademik takvim" ekranlarında da dönem açma/kapama dışında bir şey
yok. Yani cümle kullanıcıyı var olmayan bir kapıya yolluyor.

**Somut sonucu ölçüldü:** `s2` (Atatürk AL) 2. Dönem'de üç tür de kullanılmış
(`1./2./3. Sınav`, hepsi `term_order = 2`); `Sözlü`/`Performans`/`Proje` ise
`term_order = 0` olduğu için listeye ZATEN girmez. Dolayısıyla o okulda o döneme
**dördüncü bir pencere kurmanın hiçbir yolu kalmıyor** — ne üründen, ne yönetimden.
Ekran testinde tam olarak buraya çarpıldı.

⬜ **Karar gerekiyor, iki yol var:**
- **(a) Cümleyi gerçeğe çevir:** "Bu dönemde açılabilecek tür kalmadı" de ve nokta koy.
  Ucuz, dürüst; ama sınırın kendisi (dönem başına üç sınav) kalır.
- **(b) Türü yönetilebilir yap:** platform/okul düzeyinde sınav türü tanımlama yüzeyi aç
  (`term_order` ile birlikte). `ExamType` master olduğu için bu bir **platform izin
  modülü** işidir — `TB-139`'un açacağı kapının aynısı.

Bu madde `TB-32` ailesindendir: **ekranın söylediği ile sunucunun yapabildiği ayrışmış.**
Farkı, buradaki yönün tersine olması — ekran bir kural uydurmuyor, olmayan bir yetenek
vaat ediyor.

**İkinci kez çarpıldı ve bu kez TESTİ BLOKE ETTİ** (2026-09-14, ekran testi Bölüm B):
kelebek/oturumlu takvimi taslaktan yayına kadar sürmek için yeni bir oturum penceresi
gerekiyordu; aktif dönemde açılabilecek tür kalmadığı için pencere kurulamadı. Kalan tek
tür (`VZ2`, 1. Dönem) GEÇMİŞ bir dönemde (3–14 Ağustos) ve oradan kurulacak pencere
görüş penceresini, yayın duyuru payını ve mobil okuma yüzlerini test edilemez kılıyor —
üçü de bugüne bakıyor. Yani sınır yalnız ürünü değil, ürünün doğrulanabilirliğini de
kapatıyor.

---
### `TB-142` · Alt-eylem (`:fiil`) yolu bir konumda yönlenmiyor — sessiz 404 ⚪

Faz 2b'nin uçtan uca doğrulamasında ölçüldü (2026-09-13, çalışan API):

| Yol | Ham iki nokta | `%3A` |
|---|---|---|
| `POST exams/windows/{id}:publish-window` | ✅ yönleniyor (422 = handler'a ulaştı) | — |
| `POST exams/windows/{id}:open-review` | ✅ yönleniyor | — |
| `POST exams/review-comments/{id}:resolve` | ❌ **404, `Content-Length: 0`** (yönlendirme 404'ü, handler'ın değil) | ✅ 200 |

İkisi de aynı kalıpta (`{param:guid}` + literal `:fiil`) yazılmıştı; biri yönleniyor,
öteki yönlenmiyor. **Neden ölçülmedi** — fark ya `review-comments` literalindeki tireden
ya da rota ağacındaki konumdan geliyor olabilir; iki hipotez de denenmedi.

**Ürün etkisi gerçekti:** istemci iki noktayı kodlamadan gönderir (`openapi-fetch` yol
parametresini yerine koyar, literali kodlamaz), yani uç üründe **ölü** olurdu. Birim
testleri yakalayamazdı: onlar `fetch`'i taklit ediyor, rota ağacını değil.

✅ Kapatıldı 2026-09-13: yol düz alt-kaynağa çevrildi
(`review-comments/{id}/resolve`). Alt-eylem kalıbı pencere komutlarında olduğu gibi
KALIR — orada ölçülmüş biçimde çalışıyor.

⬜ **Açık kalan soru:** kalıbın hangi koşulda kırıldığı. Yeni bir `:fiil` yolu
eklenmeden önce **gerçek sunucuda** bir kez denenmeli; sözleşme testinden geçmesi
yönlendiğini göstermiyor.

---
### `TB-141` · Çağıran çözümü depo genelinde okul süzmüyor — kalıbın kendisi 🟡

`TB-140` iki ORTAK çözümleyiciyi (Attendance, Announcements) düzeltti. Ama kalıp ortak bir
metotta yaşamıyor: **elle kopyalanmış** hâlleri sekiz modüle yayılmış.

Ölçüldü (2026-09-13, `oksis-api` @ `1905abbc` sonrası):
`src/Oksis.Application` içinde `p.LinkedAccountId == currentUser.Id` biçimli **17** çözüm
var; **16'sı okul yüklemi taşımıyor** (tek yüklemli olan `TB-140`'ta düzeltilen
`AttendanceCallerResolver`).

| Modül | Yüklemsiz | Nerede |
|---|---|---|
| Users | 5 | `PersonAccessGuard`, `GetMyProfile`, `UpdateMyProfile`, `GetMyConsents`, `RevokeMyConsent` |
| Duties | 3 | `GetMyDuties`, `GetMyDutyLoad`, `GetMySubstitutions` |
| Clubs | 2 | `ClubScope`, `ClubFamilyScope` |
| **Exams** | **2** | `PublishExamWindow`, `PublishExamSchedule` |
| Grades | 1 | `GradeBookScope` |
| Announcements | 1 | `AnnouncementLifecycleGuard` |
| Homework | 1 | `HomeworkScope` |
| Documents | 1 | `StudentDocumentEntityScopeResolver` |

**Turun asıl dersi burada.** `TB-130` sınav modülünü kapattı sayılıyordu; oysa kapattığı şey
`ExamCaller`'ın ÇAĞIRANLARIYDI. Yukarıdaki iki sınav handler'ı `ExamCaller`'ı hiç
çağırmıyor, kalıbın kendi kopyasını taşıyordu — yani **ortak metodun çağıranlarını taramak,
kalıbı taramak değildir**. Ölçüm bir sonraki turda sembolden değil **şekilden** yapılmalı.

✅ **Sınav modülünün ikisi hemen kapatıldı** (2026-09-13, Faz 2b Görev 1.2 turunda
bulunduğu yerde): iki handler `ExamCaller.ResolveAsync(db, currentUser, schoolId, ct)`
kullanıyor ve pencere okumaları açık `SchoolId` yüklemi taşıyor.

⬜ **Kalan 14 çağrı yedi modülde** açık. Kapanış merkezî olmalı
([[yamalama-kabul-degil]]): her modülün kendi `*Scope`/`*Guard` sınıfı zaten var, çözüm
oralara tek seferde girer. Bugün sızdırmıyor — `IsSuperAdmin` üründe hiçbir zaman `true`
olmuyor (`TB-139`) — ama yüklem aynı zamanda sorgunun kapsamını tutar (`M17`).

### `TB-139` · Küresel tenant süzgeci süper yöneticiyi BÜTÜN okullara açıyor 🔴

**Kullanıcı kararı (2026-09-13) rolü şöyle tarif etti:**

> Süper Yönetici rolü aslında OKSİS'in kendi personeli olacak. Yeni okul kaydı, mevcut
> okullar, destek paneli yönetimi gibi konularda aktif olacak; **okulların tamamını
> görebilen bir üst rol değildir. Okulların iç işlerindeki süreçleri görmeyecekler.**

Kod bunun tersini yapıyor. `OksisDbContext.ApplyTenantFilter`:

```csharp
IsSuperAdmin || (CurrentSchoolId.HasValue && e.SchoolId == CurrentSchoolId)
```

`IsSuperAdmin` süzgeci **tamamen kısa devre ediyor**. Ölçüldü:

- Süzgeç `IHasTenant` uygulayan HER varlığa takılıyor; `TenantEntity`/`PermanentTenantEntity`
  türeten **90 varlık** var — pratikte okul veri modelinin tamamı.
- `IsSuperAdmin` yalnız JWT'deki `SuperAdmin` rol talebidir.
- `OverrideForSuperAdmin(schoolId)` bir okulu "üstlenmeyi" sağlıyor ama **`IsSuperAdmin`
  true kalıyor**, yani üstlenme kapsamı DARALTMIYOR: süper yönetici bir okulu üstlenmişken
  de doksan varlığın hepsinde bütün okulların satırlarını görmeye devam ediyor.
- Yazma tarafında da aynı muafiyet var:
  `TenantSaveChangesInterceptor` → `!tenantContext.IsSuperAdmin && entry.Entity.SchoolId != ...`

**Bu bulgu `TB-130`, `TB-131` ve `TB-133`'ün kök nedenidir.** O üçü "açık `SchoolId` yüklemi
yok" diye işlenmişti; yüklemin neden gerektiği ise bu satır. Üçünü kapatmak doğru ve
gereklidir (yüklem aynı zamanda sorgunun KAPSAMINI tutar — `M17` dersi), ama sınav modülünü
düzeltmek sorunu çözmez: aynı açık diğer modüllerde de duruyor ve oralarda hiç aranmadı.

**Kaldırmanın önündeki engel ölçüldü, sanıldığı kadar büyük değil:**
`School` varlığı `IHasTenant` DEĞİL (`AggregateRoot, IAuditableEntity`), yani okul listesi
ve platform yüzeyi kısa devre kalkınca da çalışır. Arka plan işleri zaten
`CurrentSchoolId`'yi okula eşitliyor (`SessionMaterializer` notu: "IsSuperAdmin burada bir
muafiyet değildir"). Göç aracının tasarım zamanı bağlamı (`OksisDbContextFactory`)
`IsSuperAdmin => true` sabitliyor; o EF aracıdır, ürün yolu değil.

⚠️ **Ölçüm eklendi (2026-09-13, `oksis-api` @ `20ab14bd`) — kısa devre bugün ERİŞİLEMEZ.**
`TenantContext.IsSuperAdmin` tek bir şeye bakıyor: `User.IsInRole("SuperAdmin")`. Token'ı
üreten tek yer `AccountTokenIssuer` ve o JWT'ye **hiçbir rol talebi yazmıyor** (claim listesi:
`sub`, `jti`, `person_id`, `school_id`, `perms_ver`, `require_password_change`,
`active_profile_type`, `available_profiles`, `active_child_id?`, `active_season_id?`).
Depoda rol talebi yazan ikinci bir yol yok. Sonuçları:

- Çalışan üründe `IsSuperAdmin` **her zaman `false`** — yani bugün kısa devreden geçen
  canlı bir sızıntı yok; açık **gizil**dir.
- `OverrideForSuperAdmin` her çağrıda `SecurityException` atar: bugün "okul üstlenme"
  akışı hiç yok, kaldırılacak bir kullanım da yok.
- Kısa devreyi kaldırmanın maliyeti bu yüzden sanılandan **düşük**: kaldırma, bugün hiçbir
  isteğin girmediği bir dalı siler. Riski, üstlenmenin ürün tarafını kurmadan rol talebini
  eklemektir.
- Buna karşılık sınıfın kendisi gerçektir: `TB-130`/`TB-131`/`TB-133` ve `TB-140` rol talebi
  eklendiği gün aynı anda açılır. Yüklem ayrıca sorgunun kapsamını tutar (`M17` dersi).

**Kararlar alındı (2026-09-13):**
- Yol **(a)**: kısa devre kalkacak; süper yönetici tenant verisini ancak bir okulu
  ÜSTLENEREK görecek.
- **Üstlenme okulun ONAYINA bağlı olacak:** okul yöneticisi "destek erişimi aç" demeden
  OKSİS personeli okulun iç verisine giremez. Üstlenme sessiz bir metot değil, gerekçeli ve
  izli bir olaydır.
- **Zamanlama:** Faz 2a kapanışından sonra, kendi turunda. Faz 2a'nın içine alınmadı.

Rol tanımı [[0008-super-yonetici-platform-roludur]] karar notuna yazıldı (ilk yazıldığı
`permission-matrix.md` 2026-09-13'te belge merkezi yeniden yapılandırılırken kaldırıldı).

⬜ Turun ilk adımı ÖLÇÜMDÜR, kod değil: bugün süper yönetici kimliğiyle koşan ve **birden
çok okula** dokunan akışların çıkarılması (destek paneli, platform raporları, okullar arası
sweep'ler) ve `IgnoreQueryFilters()` kullanan yerlerin taranması. Kısa devre bunlar
bilinmeden kaldırılırsa sessizce boş dönen ekranlar üretir.

⬜ İkinci adım izin kümesinin TERSİNE kurulması: bugün "hepsi eksi 24". Doğrusu sıfırdan
başlayıp platformun işinin gerektirdiğini eklemek — bunun için önce **platform izin modülü**
açılmalı (`schools.*`, `tenants.*`, `support.*`); bugün katalogda hiç yok.

Kaldırmadan önce ölçülmesi gerekenler: bugün süper yönetici kimliğiyle koşan ve **birden
çok okula** dokunan akışlar (destek paneli, platform raporları, okullar arası sweep'ler)
ve `IgnoreQueryFilters()` kullanan yerler.

### `TB-114` · KPI kartlarının değişim/eğilim verisi hiçbir uçta yok ⚪

Claude Design'ın KPI kart kataloğu (`Oksis KPI Kartlari.dc.html`) her karoda üç alan
tanımlıyor: bir önceki döneme göre **değişim rozeti** ("+12 · bu ay", "%1,4 · geçen aya
göre"), yedi noktalı **eğilim çizgisi** (sparkline) ve **oran çubuğu**. Sunucuda üçünün
de karşılığı yok: `StudentStatsDto` yalnız `total`/`active`/`newThisMonth`,
`TeacherStatsDto` `total`/`active`, `UserStatsDto` beş anlık sayaç döndürüyor —
hiçbiri önceki dönemi ya da zaman serisini taşımıyor.

Port sırasında (2026-09-04, `oksis-ui`) kartlar bu üç alan **çizilmeden** teslim edildi:
uydurma delta göstermek `K-09`'un yasakladığı yer tutucu veriyi geri getirirdi. Bileşen
(`apps/web/components/shared/kpi-card.tsx`) `delta` prop'unu ve `kpi.css` `.dl` bloğunu
taşıyor ama hiçbir ekran doldurmuyor — uç açıldığında tek yerden bağlanır.

⬜ Kapatma yolu: sayaç uçlarına önceki dönem karşılaştırması eklenmesi (delta için tek
bir `previous` alanı yeter; sparkline ayrı bir zaman serisi ucu ister). Oran çubuğu için
payda gerekiyor — "hedef" kavramı finans dışında tanımlı değil.

---


### `TB-124` · `EX-H02` hiç yazılmamış — spec var, kod yok 🟡

> **2026-09-15 ölçümü — madde yarıya indi.** `EX-H07` (aynı dönemde pencere çakışması)
> **yazılmış**: `CreateExamWindowCommandHandler:48`, tarih aralığı kesişen ikinci pencereyi
> `Conflict` ile reddediyor. Aşağıdaki metin `EX-H07` için BAYATTIR; madde yalnız `EX-H02`
> içindir.

Sınav takvimi modülünün kural kataloğu omurga spec'inde on dört madde sayıyor
(`EX-H01`…`EX-H08`, `EX-S01`…`EX-S05` ve sonradan eklenenler). `ExamRuleInspector` bugün
**altı** tanesini taşıyor: `EX-H01`, `EX-H03`, `EX-H06`, `EX-H08`, `EX-S01`, `EX-S05`.

**Hiç yazılmamış olanlar:** `EX-H02` (şube × ders pencere içinde tek sınav), `EX-H07`
(aynı dönemde pencere çakışması), artı Faz 2a'nın kapsamına aldığı `EX-H05`, `EX-S04`,
`EX-S06` ve bilinçli olarak yazılmayacak `EX-H04`, `EX-S02`, `EX-S03`.

Bu madde yalnız **`EX-H02` ve `EX-H07`** içindir; diğerlerinin sahibi ya Faz 2a ya da
gerekçeli bir "yazılmayacak" kararı.

- **`EX-H02` — şube × ders pencere içinde tek sınav.** Bugün aynı şubeye aynı dersten iki
  sınav yazılabilir. Faz 1'in tembel satır modeli (`ScheduledExam` ilk yerleştirmede doğar)
  bunu kısmen zorlaştırıyor ama engellemiyor; `ExamExpectationReader` çifti tekil sayıyor,
  yazma yolu saymıyor.
- **`EX-H07` — aynı dönemde pencere çakışması.** İki sınav penceresinin tarih aralığı
  örtüşebiliyor. Kullanıcıya görünen belirtisi: aynı hafta iki pencere açılırsa öğrencinin
  takviminde iki ayrı "sınav haftası" görünür.

2026-09-10'da Faz 2a Görev 4.1'in brief ön uçuşunda ölçüldü — o görev "şu kuralları kaldır"
diyordu ve kaldırılacakların dördü kodda hiç yoktu.

⬜ Kapatma yolu: ikisi de `ExamRuleInspector`'a sert kural olarak eklenir ve yazma yollarında
(`PlaceExam`, `CreateExamWindow`) denetlenir. Faz 2a kapsamına **alınmadı** çünkü ikisi de
ders saati modunun kuralı; kelebek düzeni onlara dokunmuyor.

---
### `TB-123` · "Canlı program" yüklemi depoda on yerde elle yazılı 🟡

"Bu yerleşim geçerli mi" sorusunun cevabı — `IsActive && IsReserving` — kod tabanında **on
ayrı yerde** elle yazılıyor. Ortak bir yüklem, uzantı metodu ya da okuyucu yok.

Semantik bugün her yerde doğru; bulgu davranış değil **dayanıklılık**. Yükleme üçüncü bir
koşul eklendiğinde (ör. taslak program sürümü, geçici değişiklik penceresi) on çağrı yerinin
onunu da bulmak gerekiyor ve biri atlanırsa sessizce yanlış sonuç doğar — hata değil,
**eksik satır**.

Sınıfı tanıdık: `TB-119` aynı şeydi. Orada "hangi şube hangi dersi alıyor" iki yerde ayrı
tanımlanmıştı; sayaçlar çatallandı ve boş bir sınav penceresi yayın kapısından geçti. Bu
madde 2026-09-09'da Faz 2a Görev 2.4'ün gözden geçirmesinde sayıldı — o görev yüklemi
`ExamExpectationReader`'dan birebir aldığı için **on birinci kopya açılmadı**.

⬜ Kapatma yolu: yüklemi tek bir yere çıkarmak (`LessonPlacement` üzerinde bir `static
Expression<Func<LessonPlacement, bool>> IsLive` ya da paylaşılan bir uzantı) ve on çağrı
yerini ona bağlamak. Mekanik ama geniş; ayrı bir tur ister. Ara koruma olarak, ham
`IsReserving` kullanımını sayan bir mimari bekçi testi ucuz olur.

---
### `TB-122` · "Aktif mevcut" yüklemi iki yerde ayrı yazılı, ortak bir okuyucu yok 🟡

"Bu şubede şu an kim var" sorusunun cevabı iki yerde bağımsız tanımlanıyor:

- `AttendanceRosterBuilder` (Attendance) — `ClassRoomStudent.LeftAt == null` **ve**
  `StudentEnrollment.Status == Active`. Kanonik tanım budur.
- `ExamSeatingReader` (Exams, 2026-09-09) — aynı yüklemi **aynalayarak** uyguluyor.

Aynalama bilinçliydi ve gerekçesi kayıtlı: `AttendanceRosterBuilder` şube başına üç sorgu
atıyor (çok şubeli kelebek oturumunda N+1 olurdu) ve kurucusunda üç Attendance sağlayıcısı
istiyor. Sınıf dokümantasyonuna kanonik tanımın orası olduğu ve **sapmada oranın kazandığı**
yazıldı. Yani bugün doğru, ama koruması yalnız bir yorum.

Neden kayıtlı: bu, `TB-119`'un birebir sınıfı. Orada "hangi şube hangi dersi alıyor" iki
yerde ayrı tanımlanmıştı; sayaçlar sessizce çatallandı ve boş bir sınav penceresi yayın
kapısından geçti. Yüklem üçüncü bir tüketici kazandığında ya da kayıt durumlarına yeni bir
değer eklendiğinde (izinli, nakil bekliyor) aynı çatallanma tekrar doğar.

⬜ Kapatma yolu: yüklemi tek bir paylaşılan okuyucuya çıkarmak — ama nereye ait olduğu açık
değil (Attendance mı, AcademicSessions mı, ortak bir `Internal` mi) ve iki çağıranın sorgu
şekli farklı (biri tek şube, diğeri çok şube). **Yer kararı verilmeden başlamak yanlış.**
Ara koruma olarak, iki yüklemin eşitliğini ölçen tek bir bekçi testi ucuz olur.

---
### `TB-121` · Göçler hiçbir testte koşmuyor — entegrasyon fixture'ı modeli kuruyor ⚪

`DatabaseFixture` veritabanını `EnsureCreatedAsync()` ile kuruyor: şema **EF modelinden**
üretiliyor, göç dosyalarından değil. Sonucu şu — 1070 entegrasyon testinin hiçbiri göçün
`Up()` gövdesini koşturmuyor, `Down()` ise hiç koşturulmuyor.

Pratik anlamı: modelle göç arasında bir sapma (elle düzeltilmiş bir göç, unutulmuş bir kolon,
yanlış `DeleteBehavior`) **bütün testlerden geçer** ve yalnız gerçek veritabanında ortaya
çıkar. Bugün açığı kapatan tek şey, geliştiricinin `dotnet ef database update` çalıştırması —
ki o da otomatik değil ([[Göçler otomatik uygulanmıyor]], 2026-09-09'da yine elle koşuldu).

2026-09-09'da Faz 2a Görev 1.3'ün gözden geçirmesinde ölçüldü: "dizin testi göçü değil modeli
doğruluyor". O turda göç gerçek geliştirme veritabanına uygulandı, yani `Up()` fiilen koştu;
kanıtsız kalan `Down()` ve genel olarak model↔göç eşitliği.

⬜ Kapatma yolu tek değil, bu yüzden karar gerekiyor: (a) fixture'ı `MigrateAsync()`'e çevirmek —
şemayı göçlerden kurar, sapmayı imkânsızlaştırır, ama 1070 testin kurulum süresini uzatır;
(b) tek bir "model ile göç eşit mi" bekçi testi — `dotnet ef migrations has-pending-model-changes`
karşılığı, ucuz ama `Down()`'ı yine kapsamaz. **Tercih verilmeden başlamak yanlış.**

---
### `TB-120` · Şubenin dersliği zorunlu değil, türetme yapan her yer boşa düşüyor ⚪

`ClassRoom.RoomId` **nullable**. Şubenin fiziksel dersliği tanımlanmamış olabiliyor ve bunu
zorlayan bir kural yok — ne oluşturmada, ne şube sihirbazında, ne de okul kurulumunda.

Bugün bunun iki görünen sonucu var: sınav takvimi etiketleri `roomName: null` dönüyor
(Faz 1'de kapatılmadı), ve kelebek oturumunun derslik kümesi şubelerin kendi sınıflarından
türediği için (2026-09-09 kararı) derslik tanımsız olan şube oturuma derslik getiremiyor.
Türetmenin dayandığı alan isteğe bağlı olduğu sürece bu sınıf bulgu her yeni tüketicide
tekrar doğar.

Kullanıcı kararı (2026-09-09): **kural şubenin dersliğinin zorunlu olması yönünde**, ama iş
sınav takvimi modülünün içinde YAPILMAYACAK — modül bitince kendi turunda ele alınacak.

⬜ Kapatma yolu: alanın zorunluya çevrilmesi (göç + mevcut boş satırların doldurulması),
şube oluşturma/düzenleme akışlarında kapı, ve türetme yapan tüketicilerin (`Exams`,
`Timetable`) boş hâl dallarının kaldırılması. Kelebek oturumu bu kapanana kadar eksik
derslik için yöneticiye elle ekleme sunar — geçici köprü, kalıcı çözüm değil.

---
### `TB-117` · Depoda biriken biçim borcu her görevde commit'e sızıyor ⚪

`dotnet format` (pre-commit zorunlu) sınav takvimi görevlerinde **dokunulmamış** dosyalarda da
değişiklik üretiyor: `SchoolSettingsController.cs` using sırası ve
`20260907_grade_entry_reminders.cs` dosya kapsamlı namespace (IDE0161). Ayrıca `dotnet format
--verify-no-changes` depo genelinde `tests/Oksis.Tests/**` altındaki eski dosyalar yüzünden
IDE1006 ile kırmızı; bu 2026-09-07'de de görülmüş ve o turda da kapsam dışı bırakılmıştı.

Sonuç: her görevde uygulayıcı ya ilgisiz dosyaları commit'ine katıyor ya da elle geri alıyor
(2026-09-08, Görev 1.3'te geri alındı). İkisi de yanlış: birincisi commit'i bulandırır,
ikincisi borcu bir sonraki tura devreder.

⬜ Kapatma yolu: tek seferlik `dotnet format` turu, kendi commit'inde, kod değişikliği
içermeden. `tests/Oksis.Tests` IDE1006 ihlalleri ya düzeltilir ya da `.editorconfig`'te
gerekçesiyle susturulur — sessizce kırmızı bırakmak kapıyı işlevsiz kılıyor.

---
### `X-20` · Modül yapılandırması sunucuda hiçbir ucu kapılamıyor 🟠

[[Modül Yapılandırması]] notunun açık sorusu ("kapatma yalnız arayüzü mü gizliyor?")
bu taramada ölçüldü: **sunucuda modül kapısı yok.** `ModuleConfigurations` tablosunu
`Schools` dışında hiçbir modül okumuyor; pipeline'da `RequireModule` benzeri bir davranış
ya da attribute tanımlı değil. Okulun kapattığı ya da planının kapsamadığı modülün uçları
API'den aynen çalışır — plan kısıtı yalnız arayüzde bir kilit ikonudur. Notlar özelinde
bir de ad uyumsuzluğu var: seed anahtarı `marks`, rota ve izin ailesi `grades`. Ödevler
için seed'de anahtar **hiç yok** — okul ödev modülünü ayarlardan kapatamaz bile;
kapı geldiğinde anahtar kataloğu da modül listesiyle hizalanmalı.
⬜ Merkezî çözüm: `[RequirePermission]` ile aynı katmanda bir modül kapısı davranışı
(anahtar → modül eşlemesi tek yerde) — modül modül `if` yazmak [[yamalama-kabul-degil]]
sınıfına girer. Arşivdeki `moduleConfigs: []` ölçümüyle (2026-08-16) birlikte okunmalı:
satır da yok, kapı da yok.

### `X-06` geniş ayağı · Sorgu çevirisi 92 handler'da doğrulanmıyor 🟠

**Dar ayak kapandı** — EF-`Ignore` edilmiş hesaplanan property'lerin sorguya sızması
artık `EfIgnoredPropertyQueryTests` mimari testiyle yakalanıyor (`oksis-api` @ `329ba30`,
kanıt arşivde). Geniş ayak açık ve **artık ölçülü**:

| | Adet |
|---|---|
| Toplam query handler | 150 |
| Gerçek sağlayıcıya karşı en az bir testi olan | 58 |
| **Hiç doğrulanmamış** | **92** |

Sebep yapısal: handler birim testleri `MockQueryable` (LINQ-to-Objects) üzerinde koşuyor,
yani **çeviri hatalarına kör**. Bu deseni tam üç kez ısırdık (`B-15`, `X-07`, `X-04`):
**test yeşil, gerçek çağrı kırık.**

Neden kapatılmadı: 92 handler'a entegrasyon testi yazmak bir düzeltme değil, ayrı bir iş
kalemi. Kapatma yolu da tek değil — her handler'a test mi, yoksa birim testleri gerçek
sağlayıcıya çeviren ortak bir koşum mu? İkincisi tercih edilirse 92'nin tamamı tek hamlede
kapanır. ⬜ **Bu tercihi vermeden başlamak yanlış.**

---

---

## Not

`TB-##` maddeleri **kod taramasından** çıktı; bir kısmının kullanıcıya görünen belirtisi
olmayabilir — borç oldukları için kayıtlılar. `B-##` · `D-##` · `V-##` · `E-##` maddeleri
ise **ekranda ya da uçta ölçüldü**.

Defterin kendi dersleri (kapanmış turlardan damıtıldı, tamamı [[OKSİS - Bulgu Arşivi]]'nde):

- **Çağrılmayan uç, arkasındaki kusuru da saklar.** Ekran yazılır yazılmaz izin eksiği,
  çeviri anahtarı, katalog boşluğu arka arkaya dökülüyor.
- **Ekranın uyguladığı kural, sunucunun bilmediği kuraldır** — ekran değişirse ya da ikinci
  bir istemci gelirse kural yoktur.
- **İsim bir sözleşme taşımıyorsa**, yanlış seçim hata değil *sessiz eksilme* üretir.
- **Ekran bazlı yama değil, sınıfı kapatan merkezî çözüm** ([[yamalama-kabul-degil]]).
