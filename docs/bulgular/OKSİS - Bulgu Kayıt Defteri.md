# OKSİS — Bulgu Kayıt Defteri

> **Ne bu dosya:** ölçülmüş ve **hâlâ açık** olan bulgular. Bir madde kapandığında
> bloğu [[OKSİS - Bulgu Arşivi]]'ne taşınır; burada iz bırakmaz.
> **Kapanmış her şey:** [[OKSİS - Bulgu Arşivi]] — kanıtlar, commit'ler, kapanış turları.
> Aşağıdaki metinlerde geçen kapanmış madde ID'leri (`B-20`, `TB-88`, `X-15` gibi) orada aranır.
> **Karar bekleyenler:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
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

**Sıradaki boş ID:** `B-51` · `D-19` · `V-04` · `X-22` · `TB-140` · `E-24` · `ENG-03`
*(`E-##` sayacı [[OKSİS - Yapısal Kararlar ve Eksikler]] ile ortaktır.)*

**Yazma kuralı:** yeni ID vermeden önce hem bu dosyada hem
[[OKSİS - Yapısal Kararlar ve Eksikler]]'de, hem de [[OKSİS - Bulgu Arşivi]]'nde `grep` at —
sayaçlar üçü arasında ortak.

---

## Özet

| Öncelik | Adet | Kapsam |
|---|---|---|
| 🔴 Kritik | 1 | Tenant izolasyonu / güvenlik (`TB-139`) |
| 🟠 Yüksek | 4 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 17 | İşlev eksik ama alternatif yol var; borç birikiyor |
| ⚪🟢 Düşük | 13 | Kozmetik, temizlik, adlandırma |
| ❓ Netleşmemiş | 0 | — |
| **Toplam** | **35** | |

**Modül dağılımı:** Notlar 5 · Ödevler 4 · Bildirimler 6 · Nöbet 1 · Çapraz kesen 19 (sınav maddeleri dahil)

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

---
### `TB-137` · Oturum diyaloglarında gerekçe alanı eylem listesinin altında kalıyordu ⚪

Gözetmen, derslik ekleme ve birleştirme diyaloglarında eylem düğmesi ayakta değil
**listenin içindedir** ("Seç" / "Ekle" / satır seçimi) ve takvim yayındayken gerekçe
boşken kapalıdır. Gerekçe alanı listenin ALTINA yerleştirilmişti: yönetici on altı
satırlık derslik listesinde kapalı "Ekle" düğmesine basıyor, sebebi ekranın
kaydırılmamış alt kısmında duruyordu.

Tasarım bu üç diyalogda gerekçeyi listeden ÖNCE koyuyordu; ortak diyalog kabuğu
yazılırken alan sabit biçimde sona alınmış ve fark gözden kaçmıştı.

2026-09-13'te Görev 8.1'in uçtan uca doğrulamasında görüldü.

✅ Kapatıldı: `DialogShell`e `reasonFirst` eklendi, üç liste diyaloğu onu kullanıyor.

---
### `TB-138` · "Derslik ekle" metni gözetmenin türemeyeceğini söylüyordu ⚪

Diyalog şunu yazıyordu: *"Burada eklenen derslik kimsenin sınıfı değildir: gözetmenini
yönetici yazar."* Yanlış. Yönetici aday listesinden **gerçek bir şube dersliği** seçer
(liste okulun dersliklerinden gelir) ve türetme o derslikte ders yapan öğretmeni
bulabilir. Doğrulamada elle eklenen 10-A Dersliği'ne **Kübra Aslan türetildi**.

Toast da aynı yanlışı taşıyordu ("gözetmeni elle yazılmalı").

`TB-134`'ün ailesinden: tasarımın kural hakkındaki cümlesi sunucunun davranışıyla
uyuşmuyordu ve ekran o cümleyi kopyalamıştı. Faz 2a'da bu dördüncü örnek — plan tasarımın
ÜÇ uyumsuzluğunu listeliyordu, gerçek sayı beş.

✅ Kapatıldı 2026-09-13: metin ikisini de söylüyor ("türeyebilir de türemeyebilir de; yoksa
delik kalır ve yayından önce elle yazılır"), toast artık gözetmen hakkında iddia kurmuyor —
türemediyse satır zaten "Gözetmen eksik" rozetiyle ve `EX-H10` ile görünür.

---
### `TB-136` · Öğretmen kendi programında okulun BÜTÜN sınav etiketlerini görüyordu 🟠

`GetExamBadgesQueryHandler` kapsamı şöyle kuruyordu:

```csharp
var canSeeAnySection =
    await permissions.HasPermissionAsync("exams.manage", ...)
    || await permissions.HasPermissionAsync("exams.place", ...);
...
else if (!canSeeAnySection)   // ← öğretmen kolu
{
    query = query.Where(x => x.OwnerTeacherId == teacherId || ...);
}
```

**`exams.place` HER öğretmende vardır.** Dolayısıyla `canSeeAnySection` öğretmende her
zaman `true` ve öğretmen kolu **hiç çalışmıyordu**. Şube istenmediğinde (kendi haftalık
programı; `schedule-read-page` `sectionId` göndermez) sorgu **hiç süzülmüyor** ve okulun
tarih aralığındaki bütün yerleşmiş sınavları dönüyordu.

Ekrandaki hâli: beş şubeli bir kelebek oturumunun beş etiketi, o şubelerin hiçbirini
okutmayan öğretmenin tek hücresine üst üste biniyordu.

İznin adı doğru, kullanımı yanlıştı: `canSeeAnySection` "istediğim şubeyi **sorabilirim**"
demektir; "şube sormadığımda **hepsini görürüm**" demez. İlki `request.SectionId` kapısıdır
ve orada doğru kullanılıyor.

**Testin neden yakalamadığı ayrıca öğretici.** `ExamBadgeSessionModeTests` izin okuyucusunu
şöyle kuruyordu — kendi yorumuyla:

> Çağıran ne idaredir ne yerleştirici… İzin okuyucusu bu yüzden ikisine de "hayır" der.

Yani test, **üründe var olamayan** bir kişiyi modelliyordu: `exams.place`'i olmayan bir
öğretmen. Fikstür gerçek rolün izinlerini taşımayınca, role bağlı bir dal test edilmiş
görünüp hiç koşmuyor.

2026-09-13'te Görev 7.6'nın tarayıcı doğrulamasında bulundu.

✅ Kapatıldı: kapsam dalı `!canSeeAnySection` kapısından çıkarıldı — şube istenmediğinde
kapsam her zaman çağıranın kendisidir. Fikstüre `canPlace` eklendi ve gerçek öğretmeni
modelleyen test yazıldı (`Should_ScopeToOwnRows_When_CallerIsTeacherWithPlacePermission`);
düzeltmeden önce kırmızı olduğu görüldü.

**Ders:** rol davranışını ölçen testin fikstürü, o rolün ÜRÜNDEKİ izinlerini taşımalı.
Krş. [[eksik-ekran-eksik-yetkiyi-gizler]] — bunun test tarafındaki eşi.

---
### `TB-135` · Sınav penceresi kendi döneminin dışına kurulabiliyor 🟡

`CreateExamWindowCommandHandler` pencerenin `StartDate`/`EndDate`'ini bağlı olduğu
`AcademicTerm`'ün sınırlarına karşı **doğrulamıyor**. Dev verisinde üç pencereden ikisi
dönemin dışında — biri Faz 1'in kendi seed'inden geliyor:

| Pencere | Tarih | Dönem | |
|---|---|---|---|
| 1. Sınav | 21–25 Eyl | 17 Ağu – 30 Eyl | içinde |
| 2. Sınav | 28 Eyl – 2 Eki | 17 Ağu – 30 Eyl | **dışında** |
| 3. Sınav | 5–9 Eki | 17 Ağu – 30 Eyl | **dışında** |

**Sonucu sessiz:** sınav makinesi çalışmaya devam ediyor, çünkü derslik/gözetmen türetmesi
ve `GetPlacementSlots` tarihi değil **haftanın gününü** kullanıyor — dönemin yayınlanmış
programından okuyorlar. Ama ders programı EKRANI dönemin dışındaki haftayı hiç çizmiyor
("Bu hafta dönemin dışında"). Yani o pencerede kurulan sınav:

- oturum olarak kuruluyor, derslik ve gözetmen türüyor, pano gösteriyor;
- ama öğrencinin/öğretmenin **ders programında hiç görünmüyor** — etiket katmanının
  ulaşamadığı bir tarihte duruyor.

2026-09-12'de Görev 7.6'nın tarayıcı doğrulamasında bulundu: gözetmenlik etiketini
doğrulamak için öğretmenin programına gidildi, hafta dönemin dışında çıktı.

✅ Kapatıldı 2026-09-13: `CreateExamWindowCommandHandler` dönemin sınırlarını sezon
kimliğiyle AYNI turda okuyor ve `StartDate < term.StartDate || EndDate > term.EndDate`
ise `Conflict` dönüyor. Hata cümlesi dönemin kendi aralığını da söylüyor — kullanıcı
hangi tarihlere sığacağını denemeyle değil ekrandan öğreniyor. Sınıra OTURAN pencere
geçerlidir (kural kapsayıcı). Testler: üç ret senaryosu (`Theory`) + sınır senaryosu.

**Revizyon yolu YOK:** pencerenin tarihlerini değiştiren ikinci bir komut aranıp
bulunamadı; `CreateExamWindow` tek giriş noktası.

**Dev verisi kendiliğinden düzelmiş:** veritabanı okundu, dönem artık 17 Ağu – 31 Eki ve
üç pencerenin üçü de içeride. Defterin tablosu o gün doğruydu ama bugün bayat — seed'de
düzeltilecek bir şey kalmadı. Ayrıca kodda sınav penceresi yazan bir seed sınıfı hiç yok;
üç pencere ekrandan kurulmuş.

---
### `TB-134` · Oturum tasarımı "elle gözetmen korunmaz" diyor, sunucu tersini yapıyor ⚪

Faz 2a oturum ayrıntısı tasarımı (`web/exam-session.jsx`) iki yerde şunu yazıyor:

> Elle yazılan gözetmen **yeniden üretmede korunmaz**.

Sunucu tam tersini yapıyor. `ExamInvigilatorDeriver` başlığında yazılı:

> **Yöneticinin eli ezilmez (Kısıt 19):** `InvigilatorSource.Manual` olan derslik ATLANIR
> — ne üzerine yazılır, ne delik sayılır.

`PUT /rooms/{id}/invigilator` belgesi de aynı şeyi söylüyor: "Yazılan gözetmen her zaman
'elle' işaretlenir ve **yeniden besteleme onu bozmaz**."

2026-09-12'de Görev 7.5'in tarayıcı doğrulamasında görüldü: elle yazılan gözetmen
(Hatice Doğan) yeniden üretmeden sonra yerinde durdu, oysa ekranın onay metni silineceğini
söylüyordu.

**Neden önemli:** yanlış olan metin yöneticiyi *yanlış yöne* iter. "Korunmaz" okuyan
yönetici, gözetmen deliğini doldurduktan sonra yerleşimi yeniden üretmekten kaçınır —
oysa güvenle üretebilir. Kuralı ekranın uydurması değil, ekranın sunucunun yapmadığı bir
kuralı **anlatması** hâli. Krş. [[kural-ekranda-degil-sunucuda]] — bu onun aynadaki hâli.

Plan Görev 7.5'te tasarımın **üç** uyumsuzluğunu listeliyordu (gerekçe eşiği 10 vs 15,
`EX-S07` vs `EX-S06`, gözetmen deliğinin istemcide hesaplanması); bu **dördüncüsü** ve
plan onu görmemişti.

✅ Kapatıldı 2026-09-12: iki metin de sunucunun davranışına çevrildi — gözetmen diyaloğunun
bilgi kutusu ve yeniden üretme onayının kontrol satırı artık "korunur" diyor ve gerekçesini
(türetme o dersliği atlar) yazıyor.

---
### `TB-133` · Yerleştirme saatleri sorgusu pencereyi okul süzmeden okuyor 🟡

`GetPlacementSlotsQueryHandler` (Faz 1) pencereyi yalnız kimlikle buluyor:

```csharp
var window = await db.ExamWindows.AsNoTracking()
    .FirstOrDefaultAsync(w => w.Id == request.WindowId, cancellationToken);
```

`windowId` istemciden geliyor ve sorguda açık `SchoolId` yüklemi yok. Tek koruma
küresel süzgeç; o da `IsSuperAdmin || (...)` biçiminde olduğu için süper yönetici
oturumunda **düşüyor**. Handler pencereyi bulduktan sonra `window.AcademicTermId` ile
şubenin hücrelerini okuyor — yani yabancı okulun penceresi, yabancı dönemin
hücrelerini çekebilir.

2026-09-12'de Görev 7.3'ün tarayıcı doğrulamasında, oturum saati ızgarasının hangi uçtan
besleneceği araştırılırken görüldü. `TB-130` ve `TB-131` ile **aynı sınıf**: Faz 1'in
sınav yüzeyi tenant izolasyonunda küresel süzgece güveniyor, süper yönetici yolunda
güvence yok.

✅ Kapatıldı 2026-09-13: `GetPlacementSlots` ve `GetMyExamPlacements` pencereyi artık
`w.SchoolId == schoolId` ile buluyor; `ExamPlacementLoader`'ın pencere/satır okumaları da
(yazılmış satır, koordinat penceresi, aynı koordinattaki mevcut satır) açık yüklem taşıyor.
Test: `ExamTenantScopeTests.Should_NotFindWindow_OfAnotherTenant` — düzeltmeden ÖNCE
kırmızı doğrulandı. `TB-130` + `TB-131` ile aynı turda kapandı.

---
### `TB-132` · Yöneticinin oturum kurma komutunun ekranı yok 🟡

Sunucuda `POST /api/v1/exams/sessions` (`CreateExamSession`, Faz 2a Görev 3.1,
izin `exams.manage`) var; yöneticinin kelebek oturumunu **elle** kurmasını sağlıyor.
İstemcide bu uca ne bir fonksiyon ne de bir ekran var, ve Faz 2a planının Dilim 7'sinde
de yoktu. Üründe oturum yalnız öğretmenin yerleştirmesiyle doğuyor.

2026-09-12'de Codex'in ürettiği `session-endpoints.ts` denetlenirken bulundu: on uç
yolunun onu da sunucuyla birebir eşleşiyordu, eksik olan tek şey bu uçtu — yani
uygulayıcının atlaması değil, planın kendisinin boşluğu.

[[eksik-ekran-eksik-yetkiyi-gizler]]: çağrılmayan uç, arkasındaki izin ve sözleşme
kusurlarını da saklar. Komut yazıldı ve testlendi ama hiçbir gerçek çağrıyla
doğrulanmadı; `exams.manage` kapısının bu uçta doğru davrandığı ekran üzerinden
hiç ölçülmedi.

⬜ Kapatma yolu: 2026-09-12 kullanıcı kararıyla plana **Görev 7.9** olarak eklendi —
panodan yöneticinin oturum kurması. Görev bitince bu madde kapanır.

---
### `TB-131` · Faz 1 sınav sayaçları pencereyi okul süzmeden okuyor 🟡

`ExamPlacementCounter`'ın üç Faz 1 metodu — `CountPendingRequestsAsync`,
`GetFirstExamDateAsync`, `FindDayLimitBreachesAsync` — yalnız `examWindowId` alıyor
(`IExamPlacementCounter`'daki imzalarda okul kimliği **hiç yok**) ve sorgularında açık
`SchoolId` yüklemi taşımıyorlar. Tek koruma küresel süzgeç; o da `IsSuperAdmin || (...)`
biçiminde olduğu için süper yönetici oturumunda **düşüyor**.

Bunlar yayın kapısının besleyicileri: bekleyen ödünç saat isteği sayısı (`EX-H09`), ilk
sınav tarihi (`EX-H08`) ve günlük sınav limiti (`EX-H01`). Süper yönetici bir okulu
üstlendiğinde bu sayaçlar yabancı okulun satırlarını da görebilir; sonucu yanlış bir
yayın engeli ya da engelin yanlış yerde düşmesidir.

2026-09-11'de Faz 2a'nın kapanış düzeltmesinde ölçüldü. Aynı turda **Faz 2a'nın kendi**
kapsam sorgularına açık yüklem eklendi (commit `68bdccdc`); açık kalan Faz 1 yüzeyi.
Uygulayıcının süper yönetici testi bu yüzden `BeEmpty()` diyemiyor, yalnız kendi
kodlarıyla sınırlı `NotContain` diyebiliyor — testin ifade gücü bu boşluk yüzünden kısıtlı.

Kardeşi `TB-130` (`ExamCaller.ResolveAsync`). İkisi aynı sınıf: **Faz 1'in sınav yüzeyi
tenant izolasyonunda küresel süzgece güveniyor, süper yönetici yolunda güvence yok.**

✅ Kapatıldı 2026-09-13 — ama **imzalar değişmedi**. Defterin önerdiği yol "üç imzaya okul
kimliğini al"dı; uygulanan yol okulu `ITenantContext`'ten okumak oldu, çünkü sınıf onu zaten
alıyordu ve `CountUnplacedAsync` emsali oradan okuyordu. Arayüze okul eklemek, kuralı taklit
eden bütün birim testlerini gereksizce kırardı — sayaç ZATEN tek bir okul bağlamında koşuyor.

Kapsam da üçten yediye çıktı: `CountExamsAsync`, `HasExamOnAdjacentDayAsync`,
`GetTermIdAsync`, `CountPendingRequestsAsync`, `GetFirstExamDateAsync`,
`FindDayLimitBreachesAsync` ve `ReadSessionRoomMixAsync` — Faz 1 yüzeyinin yükemsiz kalan
her sorgusu. Okul bağlamı yoksa sayım yapılmaz ve nötr değer döner (0 / `false` / boş);
`GetTermIdAsync` tek istisnadır, dönem kimliği nötr bir değere indirgenemez.

Test: `ExamTenantScopeTests.Should_NotCountForeignWindow_When_SuperAdminHoldsASchool` —
"kendi pencerem GERÇEKTEN sayılıyor" ÖNCE durumuyla birlikte.

---
### `TB-130` · `ExamCaller.ResolveAsync` çağıranı okul süzmeden çözüyor 🟡

`src/Oksis.Application/Modules/Exams/Internal/ExamCaller.cs` çağıranın `Person` satırını
yalnız hesap bağıyla buluyor:

```csharp
db.Persons.AsNoTracking()
  .Where(p => p.LinkedAccountId == currentUser.Id)   // açık SchoolId yüklemi YOK
```

Küresel süzgeç `IsSuperAdmin || (...)` biçiminde, yani süper yönetici için **düşüyor**.
Süper yönetici bir okulu üstlendiğinde çağıran, hesabının bağlı olduğu **başka okuldaki**
kişiye çözülebiliyor; o kimlikle koşan "benim sınavlarım" / "benim gözetmenliklerim"
okumaları yanlış okulun kapsamında çalışır.

Faz 1 boşluğu; 2026-09-11'de Faz 2a Görev 5.2-5.5'in uygulamasında ölçüldü. Sınav modülünün
**yeni** okuma uçları (5.1, 5.2, 5.6) kendi açık `SchoolId` yüklemlerini taşıyor ve o yolu
kapatıyor — hatta üç süper yönetici testi bu hâli *kullanarak* kuruluyor. Açık olan
`ExamCaller`'ın kendisi.

Sıradan kullanıcı için ısırmaz (onun küresel süzgeci düşmez); etki süper yönetici oturumuyla
sınırlı, bu yüzden 🟠 değil 🟡.

✅ Kapatıldı 2026-09-13: imza `ResolveAsync(db, currentUser, schoolId, ct)` oldu ve yükleme
`p.SchoolId == schoolId` eklendi. Çağıran sayısı beş değil **on dört** çıktı; üçü okul
kimliğini bağlamak için ayrıca elden geçti (`ListHourRequests`, `GetExamBadges`,
`ExamPlacementLoader`). Okul, yükleyicide alan değil METOT PARAMETRESİ — tek bir yükleyici
örneği iki farklı okul bağlamında yanlışlıkla paylaşılamasın diye.

Aynı turda `ListHourRequests`'in üç sorgusuna da (istekler, sınav satırları, pencereler)
açık yüklem eklendi: kapsamı yalnız çağıran kimliğine bırakmak, okulu sınır saymamaktı.

Test: `ExamTenantScopeTests.Should_NotResolveCaller_When_PersonBelongsToAnotherSchool` —
düzeltmeden ÖNCE kırmızı doğrulandı.

**Yan etki — güvence bir kat yukarı taşındı.** `GetMyExamDutiesQueryHandlerTests`'in iki
`R55` testi "çağıran yabancı kişiye çözülür ama sorgunun yüklemi satırı eler" hâlini
ölçüyordu (`IsSuccess == true`, liste boş). Artık kimlik hiç çözülmüyor ve uç `Forbidden`
dönüyor; testler bu daha güçlü cevaba göre güncellendi. Ölçülen kırmızı çizgi aynı.

---
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


### `TB-124` · Sınav kural tablosunun yarısı hiç yazılmamış — spec var, kod yok 🟡

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
