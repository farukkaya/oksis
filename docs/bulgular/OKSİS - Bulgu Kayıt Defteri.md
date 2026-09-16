# OKSİS — Bulgu Kayıt Defteri

> **Ne bu dosya:** ölçülmüş ve **hâlâ açık** olan bulgular. Bir madde kapandığında
> bloğu [[OKSİS - Bulgu Arşivi]]'ne taşınır; burada iz bırakmaz.
> **Kapanmış her şey:** [[OKSİS - Bulgu Arşivi]] — kanıtlar, commit'ler, kapanış turları.
> Aşağıdaki metinlerde geçen kapanmış madde ID'leri (`B-20`, `TB-88`, `X-15` gibi) orada aranır.
> **Karar bekleyenler:** [[OKSİS - Yapısal Kararlar ve Eksikler]]
> **Son kapanış turu:** 2026-09-15 — sınav takvimi kapanış turu: **10 madde kapandı**
> ([[OKSİS - Bulgu Arşivi]] §48). Altı ürün kararı bağlandı. İkisi (`TB-124`, `TB-129`'un bir
> ayağı) kod yazılmadan, ÖLÇÜLEREK kapandı. `TB-152` de aynı gün tamamlandı (eleme `EX-S09`
> ile görünür + sihirbazda dipnot) — **11 madde**. Defter **30**.
>
> **Önceki düzeltme:** 2026-09-15 (kapanış turu ön ölçümü) — defterdeki her madde koda karşı
> ölçüldü. `TB-147`, `TB-149` ve `TB-146` **kodda zaten kapalıydı**, defter satırları
> yazılmamıştı; üçü de arşive taşındı ([[OKSİS - Bulgu Arşivi]] §46). `TB-124` yarıya indi:
> `EX-H07` yazılmış (`CreateExamWindowCommandHandler:48`), yalnız `EX-H02` kaldı.
> Ayrıca defterin kendi kuralı işletildi: **kapanmış 15 madde** arşive taşındı
> ([[OKSİS - Bulgu Arşivi]] §47) — kapanmış maddenin açık listesinde durması, listeyi
> okunmaz hâle getiriyordu. Defter **39**.
>
> **Son ekleme:** 2026-09-16 (Ayarlar ekran revizyonu) — `TB-199` (ikon adı tipi hiçbir şeyi
> korumuyor; olmayan ada sessizce boş ikon çiziliyor ⚪), §12. Bulgu, Akademik Yapı'nın katalog
> sekme şeridinde `icon: "doc"` adının aylardır ikonsuz çizilmesiyle görüldü; o ayak aynı turda
> düzeltildi, tipin kendisi açık kaldı. Defter **70**.
> **Önceki:** 2026-09-16 (gece düzeltme turu, kullanıcı uyurken) — Altınay saha testinde işaretlenen
> bulgular ve defterin karar-dışı maddeleri toplu olarak kapatıldı. **Kapanan 20 madde** (hepsi kodda,
> **commit bekliyor**; dallar `oksis-api` `fix/ilk-sezon-acilisi`, `oksis-ui` `fix/davet-olu-riza-anahtarlari`):
> `TB-174` · `TB-175` · `TB-125` · `TB-176` · `TB-177` · `D-19` · `B-51` · `D-20` (ekran ayağı) · `TB-166` ·
> `TB-180` · `TB-163 (a)` · `TB-164` · `TB-169` · `TB-107` · `TB-112` · `TB-150` (veri ayağı) · `TB-113` ·
> `TB-123` · `TB-141` · `TB-182` · `TB-172` · `TB-127`; ayrıca `TB-171`'in görünen ad ayağı. **Açılan 5 madde:** `TB-180` (aynı turda düzeltildi), `TB-181` (karar),
> `TB-182` (aynı turda düzeltildi), `TB-183`, `TB-184`. Altınay'ın iki somut engeli kalktı: bildirim satırı
> onarıldı (`1/1/1/0/1`) ve 2–3 Kasım'ı tatil sayan görünmez kayıt silindi. Ağacın son hâli: `dotnet build`
> **EXIT=0**, birim testler tamamen yeşil (Domain 1072 · Application 2711 · Api 442 · `Oksis.Tests` 64),
> entegrasyon **1456/1457** (kalan tek kırmızı `TB-184`, izole koşuda yeşil). Karar bekleyen maddeler ve
> onlara bağlı olanlar bilerek atlandı; `K-28` için uygulama planı çıkarıldı
> ([[2026-09-16-kurum-yetkilisi-k28]]). Defter **69**.
> Önceki: 2026-09-15 (gece) — Altınay saha testi B1.3 (müdür davet kabulü): `TB-170`
> (davetteki duyuru ve fotoğraf anahtarları hiçbir şeye bağlı değil 🟡), §11 · B2.1: `TB-171` (platformdan
> açılan okulda görünen ad ve kurum yetkilisi boş 🟡), §12 · B1.2: `TB-172` (okul kodu tekilliği DB'de
> zorlanmıyor ⚪), §12 · ilk ekran: `TB-173` (sezonsuz topbar seçici "—", mobil başlık satırı yok 🟡) +
> `TB-168`'e pano kartı envanteri eklendi. Kararlar: `TB-170` kaldırma (kodda, merge bekliyor) ·
> `TB-171` → `K-28` (a) · B2.3: `TB-174` (Yarım Gün zil şablonu hiçbir okulda kaydedilemiyor, 500 🟠; Cuma yoklaması sessizce
> üretilmeyecek), `D-19` (zil ekranı: boşken "Yeniden Üret", stilsiz modal çarpısı, Enter akışı 🟡), `B-51`
> (elle teneffüs/öğle arası yok 🟡), `E-25` (güne göre adlandırılmış zil şablonu yok 🟡, karar bekliyor) · B2.2:
> `TB-175` (bildirim ana ayarı tohumlanmıyor; ilk "Kaydet" uygulama içi dahil bütün bildirimleri kapatıyor,
> geri açacak kontrol yok — 🟡'dan 🟠'ye), `X-20`'ye istemci menüsü ölçümü · B2.4: `TB-176` (sezonsuz eklenen
> tatil görünmez/silinemez ama yoklamada tatil sayılır 🟠), `TB-177` (tatil listesi dini bayramları 5× gösteriyor 🟡),
> `E-26` (ara tatil girilemiyor 🟡, karar), `D-20` (tatil ekranı sezonsuz/form hataları 🟡) · `D-21` (liste
> ekranları `D-10`'u uygulamıyor 🟡, kodda düzeltildi) · B3: **`ENG-03` (ilk sezon açılamıyor — kaynak sezon zorunlu
> 🟠, engel)**, `TB-178` (sihirbaz tatilleri hiç yazılmıyor 🟠), `D-22` (sihirbaz anahtarları/doğrulama 🟡), `E-27`
> (ilk sezonda öğrenci adımı işlevsiz 🟡, karar); `E-26` düzeltildi. Defter **62**.
> Önceki (gece): `K-27` **ilk dilim uygulandı** (`oksis-api` `e91711bd`…`74427aa3`,
> `oksis-ui` `bd8d0f6`/`47d6059`): platformdan okul açma ve sezonsuz müdür daveti. **Kapandı:** `E-24`, `TB-162`, bir de
> senaryoda bulunup aynı gün düzeltilen `TB-167` (web davet kabulü rıza göndermiyordu, her kabul
> 400) → [[OKSİS - Bulgu Arşivi]] §49. **Açıldı:** `TB-168` (sezonsuz okulda pano kartı hata
> çiziyor 🟡), `TB-169` (platform girişinde hız sınırı yok ⚪). `TB-165`'e not düşüldü. Defter **44**.
> Önceki (akşam): `K-27` **(a) ayrı platform hesabı** olarak bağlandı;
> planlama öncesi süper yönetici izleri üç depoda kazındı
> ([[super-admin-izleri-envanteri]]). Kazımadan üç madde: `TB-164` (ölü SQL seed ⚪),
> `TB-165` (K5 ucu erişilemez, portal süzgeci `Platform`'u eliyor 🟡), `TB-166` (web mock
> rol satırı yanlış ⚪), üçü de §12. Defter **44**.
> Önceki: 2026-09-15 — Altınay Anadolu Lisesi sıfırdan açılış hazırlığı: `E-24`
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

**Sıradaki boş ID:** `B-53` · `D-23` · `V-04` · `X-22` · `TB-200` · `E-30` · `ENG-04`
*(`K-##` karar sayacı: sıradaki `K-29` — `K-16`…`K-26` modül belgelerinde kullanılmış.)*
*(`E-##` sayacı [[OKSİS - Yapısal Kararlar ve Eksikler]] ile ortaktır.)*

**Yazma kuralı:** yeni ID vermeden önce hem bu dosyada hem
[[OKSİS - Yapısal Kararlar ve Eksikler]]'de, hem de [[OKSİS - Bulgu Arşivi]]'nde `grep` at —
sayaçlar üçü arasında ortak.

---

## Özet

| Öncelik | Adet | Kapsam |
|---|---|---|
| 🔴 Kritik | 3 | Tenant izolasyonu (`TB-139`, **`TB-191`**) · uygulama geneli çıktı kaybı (`TB-150`) |
| 🟠 Yüksek | 13 | İşlev yanlış çalışıyor, veri/yetki güveni zedeleniyor |
| 🟡 Orta | 39 | İşlev eksik ama alternatif yol var; borç birikiyor |
| ⚪🟢 Düşük | 19 | Kozmetik, temizlik, adlandırma |
| ❓ Netleşmemiş | 0 | — |
| **Toplam** | **74** | |

> **Sayaç düzeltmesi (2026-09-16):** tablo 76 diyordu, defterdeki gerçek blok sayısı **65**'ti — gün içindeki
> hızlı eklemelerde sayaç elle artırıldığı için şişmişti. Sayılar `grep '^### \`'` ile **yeniden sayılarak**
> hizalandı; bugünkü dokuz yeni madde de bu gerçek sayımın üstüne eklendi. Kapanmış maddeler hâlâ defterde
> duruyor (merge sonrası arşive taşınacak), yani bu sayı "açık iş" değil "defterdeki blok" sayısıdır.

**Modül dağılımı:** Notlar 5 · Ödevler 4 · Bildirimler 6 · Nöbet 1 · Çapraz kesen 48 (sınav, okul açılışı ve platform kimliği maddeleri dahil)

> **2026-09-16 gece düzeltme turu sürüyor.** Kodda düzeltilip **commit bekleyen** maddeler (dallar
> `oksis-api` `fix/ilk-sezon-acilisi`, `oksis-ui` `fix/davet-olu-riza-anahtarlari`): `TB-174`, `D-19`,
> `B-51`, `D-20` (ekran ayağı), `TB-166`, `TB-180`. Bloklarında ✅ notu var; merge edilince arşive
> taşınacaklar. Karar bekleyenler ve onlara bağlı olanlar bu turda bilerek atlandı.

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

➕ **2026-09-16 · sunucu ayağı kapandı, madde EKRAN için açık kalıyor (gece turu, commit bekliyor).**
Tarih eksenli tüketim yüzeyi yazıldı: `GetOnDutyForDateQuery` → `GET duties/on-duty?date=…`
(`duties.view`, yeni izin ve göç gerekmedi). Kurallar: sürüm seçimi `Published ∪ Superseded` +
`EffectiveFrom <= date <= EffectiveTo` ve **kapanış gününde ardıl sürüm kazanır** (yayın, canlı sürümü
ardılın `EffectiveFrom`'uyla kapattığı için o gün iki sürüme birden düşüyor — testle ölçüldü); muafiyet
ölçütü tüketim anı metodu `CoversDay` (dağıtımın `CoversPeriod`'u değil) ve muaf öğretmen çizelgeden
**düşmüyor**, satırda işaretleniyor; vekâlet `RelieverId` ile çözülüyor, yancı da muafsa ya da okul
parametresi kapalıysa satır `uncovered` — açık nöbet sessizce kaybolmuyor. **`ISchoolCalendarService`
Duties'e ilk kez bağlandı:** tatilde "kimse nöbetçi değil" ile "o gün okul yok" artık ayrı (ikinci bir
tatil okuyucusu yazılmadı, `TB-176`/`TB-177` sonrası tek kaynak). Testler: 4 senaryo yeşil (geçmiş tarih
doğru sürümden, muaf → yancı, yancılık kapalı → uncovered, tatil), Api 444 · Application 2711 yeşil.
⬜ **Açık kalan:** ucun **tüketicisi yok** — ekran yazılmadı ve oksis-ui codegen'i çalıştırılmadı.
Defterin kendi dersi gereği (çağrılmayan uç arkasındaki kusuru saklar) madde yüzey gelene kadar kapanmaz.

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

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** Politika `GradeVisibilityResolver.ReadPolicyAsync` ile
**tek sorguda** okunuyor, eleme bellekte **öğrenci başına** yapılıyor (öğrenci başına sorgu atan yol seçilmedi,
N+1 olurdu). Üç test: karma şube iki sırayla (`InlineData` — "ilk öğrenci" kusurunun şansa geçmemesi için) ve
tüm kademeler gizliyken öğrenci çözümünün hiç çağrılmaması.

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

✅ **`TB-113` · 2026-09-16 kapandı (gece turu, commit bekliyor).** Notlar modülünün gün kararı artık okul
takviminden geliyor: yeni `Grades/Internal/GradeCalendar.SchoolTodayAsync` (Ödevler'deki kardeşinin birebir
eşi), **8 çağrı yeri** bağlandı. Bunlardan biri defterde sayılmamıştı ama taşınması zorunluydu:
`SendGradeEntryReminders` `clock.Today` kullanıyordu ve pano "bugün hatırlatıldı" rozetini `SentOn == today` ile
okuyor — yalnız panoyu çevirmek, yazan uçla okuyan ucun farklı gün kullanmasına ve düğmenin gece yarısından
sonra bir gün yanlış durumda kalmasına yol açardı ([[besleyen-yuzey-olculmeden-kapanmaz]]). UTC damgalar
(`PublishedAt`, denetim izi, göreli etiket) bilinçli olarak UTC kaldı: **gün kararı yerel, mutlak an mutlak.**
Test saat dilimi farkını gerçekten ölçüyor (aynı an, okul UTC+3'te ertesi güne geçmiş → gecikme eşiği aşılıyor).

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

✅ **Karar (2026-09-16, kullanıcı): yönetme izni işaretleme kapısını da açar.** Sahiplik devredilmez — ödevi kimin
yazdığı bilgisi bozulmadan kalır; ödev yönetme izni taşıyan idare, sahibi olmasa da işaretleme ve kapatma
yapabilir. Kulüplerdeki danışman kalıbının kardeşi.

✅ **Uygulandı — 2026-09-16 (doğrulama sürüyor, commit bekliyor).** Kapı tek yerde: `HomeworkWriteGate.OpenAsync`
artık **varsayılanı olmayan zorunlu** bir erişim kipi parametresi alıyor (`OwnerOnly` / `OwnerOrManager`) — isteğe
bağlı olsaydı yeni bir yazma ucu hiçbir şey yazmadan kapıyı sessizce gevşetebilirdi; zorunlu olması yedi çağrı
noktasının hepsini yüzeye çıkardı ve politika tek `grep`'le denetlenebilir hâle geldi. İdare kolu
`homework.manage` ile açılıyor; sıra "önce sahiplik", kapsam dışı hâlâ 404. **Sahiplik devredilmiyor**, denetim izi
işlemi gerçekten yapanı (idareyi) yazıyor ve `GET homework/{id}/audit` orada gösteriyor.

➕ **Karar (2026-09-16, kullanıcı) — kapsam genişledi:**
1. **İptal de idareye açılır** (`OwnerOnly` → `OwnerOrManager`); bulgu metni zaten "kapatma ve iptal de
   sahibinindir" diye şikâyet ediyordu.
2. **İdari kapatma denetim izine yazılır** — bugün kapatma hiçbir yerde iz bırakmıyor; yeni bir denetim türü
   değeri gerekiyor (enum sonuna eklenir, göç gerekmez).
3. **İdare ödeve başka bir öğretmen atayabilmeli** — ayrılan öğretmenin ödevi yeni bir sahibe geçebilsin.
   Bu ayrı bir özellik: `E-28`.

✅ **Genişleyen kapsam da uygulandı — 2026-09-16 (commit bekliyor).** İptal `OwnerOrManager` oldu: vekâleten
yayınlanmış ya da sahibi ayrılmış ödevde **yanlış verilmiş bir ödevi geri çekebilecek kimse kalmıyordu**,
idarenin tek aracı kapatmaktı ve kapatma öğrenciye açıklama bırakmaz. İdari kapatma için yeni denetim türü
`ClosedByManager` (enum **sonuna** eklendi; göç gerekmediği ölçüldü — kolon düz `int`, check constraint yok ve
`TB-121` bekçisi değişiklikten sonra yeşil koştu). **Yalnız sahibi olmayan kapattığında** satır yazılıyor:
sahibinin kapatmasında "kim" sorusunun cevabı zaten belli, her kapatmaya satır yazmak denetim ekranını bilgi
taşımayan satırlarla doldurup `Cancelled`/`SubmissionRemoved` gibi gerçekten bakılması gereken satırları boğardı
(emsal `PublishedOnBehalf`). Testler: Domain 108 · Application 302 · Api 42 (süzgeçli) yeşil.
⬜ **Arayüz borcu:** denetim ekranı yeni `"closed-by-manager"` etiketini tanımıyorsa satırı ham gösterir; ayrıca
idarenin **iptal düğmesini görüp görmediği** ölçülmedi — sunucu artık izin veriyor ama ekran düğmeyi sahip-only
gizliyor olabilir.

### `TB-110` · İdari teslim kaldırma kapanmış ödevde 409 🟡

Uç 23 (`AdminRemoveHomeworkSubmission`) Faz 3'ün `Homework.RemoveSubmission`
sarmalayıcısından geçiyor ve o, ödev `Published` değilken `SubmissionClosedException`
atıyor. Sonuç: idare kapanmış ya da iptal edilmiş ödevin yanlış yüklenmiş (KVKK'ya
aykırı, başkasına ait) dosyasını kaldıramaz; tek yol ödevi yeniden açmak, o da yok.
Kural bilinçli olarak gevşetilmedi — ikinci bir kaldırma yolu aynı kuralı iki yerde
ayrıştırırdı. ⬜ Domain metoduna "idari" kolu eklenir (gerekçeli kaldırma durum kapısını
atlar) ya da kapanmış ödevde kaldırma ürün olarak kabul edilir.

✅ **Karar (2026-09-16, kullanıcı): idari kaldırma açılır.** Kapanmış ödevde de ödev yönetme izni taşıyan idare
teslim dosyasını kaldırabilir. Gerekçe KVKK: başkasına ait ya da yanlış yüklenmiş bir dosya bugün kalıcı kalıyor
ve ödevi yeniden açmanın yolu da yok. Domain metoduna gerekçeli **idari kol** eklenecek; durum kapısı yalnız bu
kol için atlanacak, öğretmenin kendi yolu değişmeyecek. Kaldırma zaten denetim izine yazılıyor (`TB-112`'nin ucu
onu gösteriyor).

✅ **Uygulandı — 2026-09-16 (commit bekliyor).** `Homework.RemoveSubmission` artık **varsayılanı olmayan zorunlu**
bir `removal` parametresi alıyor (`Self` | `Administrative`) — `TB-109`'un kapı kalıbının aynısı; isteğe bağlı
olsaydı yeni bir kaldırma yolu kapıyı sessizce atlayabilirdi. Durum kapısı **yalnız `Self`** kolunda uygulanıyor,
yani öğrencinin kendi yolu kapanmış ödevde hâlâ reddediliyor. Gevşeyen tek şey durum kapısı: soft-delete, zorunlu
gerekçe, ikinci kaldırmanın reddi, kapsam kapısı (başkasının satırında 404) ve denetim satırı aynen duruyor.
Enum kalıcı değil — kolon değil, metot parametresi; ikinci bir gerçek üretilmedi. 11 test yeşil.

### `TB-111` · Son teslim tarihi ileri alınan ödev ikinci kez hatırlatılmaz 🟡

`HomeworkTracking.DueReminderSentAt` satır başına idempotency damgası; `UpdateContent`
`DueDate`'i değiştirse bile sıfırlanmıyor. Öğretmen teslimi bir hafta ertelerse yeni
tarihin öncesinde hatırlatma gitmez. Sıfırlamak tersini yapardı: tarih bir gün
kaydırılınca herkese ikinci bildirim. ⬜ Ürün kararı; orta yol "tarih en az N gün
ileri alındıysa sıfırla" da mümkün.

✅ **`TB-111` karar (2026-09-16, kullanıcı): her erteleme yeniden hatırlatsın.** Son teslim tarihi değiştiğinde
`DueReminderSentAt` damgası sıfırlanır ve yeni tarihin öncesinde hatırlatma yeniden gider. Eşik konmadı: kullanıcı
öngörülebilirliği seçti, yani öğretmen saati düzeltse bile bildirim gider. **Ölçülecek yan etki:** aynı ödevde
arka arkaya yapılan küçük düzeltmeler bildirim yığını üretebilir; sahada gözlenip gerekirse eşik sonradan eklenir.

✅ **Uygulandı — 2026-09-16 (commit bekliyor).** Son teslim tarihi **değiştiyse** (ileri ya da geri) bütün takip
satırlarının hatırlatma damgası sıfırlanıyor; tarih değişmediyse damga duruyor.
**Besleyen yüzey ölçülüp düzeltildi** ([[besleyen-yuzey-olculmeden-kapanmaz]]): `UpdateHomework` kapıyı
`includeTracking: false` ile açıyordu, yani koleksiyon yüklenmediği için sıfırlama boş liste üzerinde dönüp
**sessizce hiç olmayacaktı**. Hatırlatmanın gerçekten yeniden gittiği üç kapıda ayrı ayrı ölçüldü: satır süzgeci
(`Unmarked && DueReminderSentAt == null`), hatırlatma penceresinin yeni tarihe taşınması ve bildirim
tekilleştirme anahtarının farklı güne düşmesi. Tamamlamış öğrenciye ikinci hatırlatma yine gitmiyor. 6 + 3 test.
⬜ **Ölçüm borcu:** `includeTracking: true` değişikliği birim testiyle yakalanamıyor (mock agregatın koleksiyonu
zaten dolu geliyor); gerçek koruma entegrasyon koşusu, o da bu makinede bellek yüzünden koşturulamadı.

### `TB-112` · Ödev denetim kaydı yazılıyor, okuyan uç yok ⚪

`HomeworkAuditEntry` beş olay tipiyle yazılıyor (yayın, adına yayın, iptal, toplu
tamamlama, idari kaldırma); sözleşmede `/homework/{id}/audit` bildirilmediği için hiçbir
ekranda görünmüyor. Not modülünün denetim ucu emsal (`grades.manage`). Çağrılmayan uç
arkasındaki kusuru da saklar — ucu yazmadan satırların şekli doğrulanamaz.

---

✅ **`TB-112` · 2026-09-16 kapandı (gece turu, commit bekliyor).** Notlar'daki `GetGradeBookAudit` kalıbı birebir
Homework'e taşındı: yeni `Homework/Queries/GetHomeworkAudit/` + `GET homework/{id}/audit`, izin **mevcut**
`homework.manage` (yeni izin açılmadı, göç gerekmedi), okul süzgeci açıkça yazılı, başka okulun ödevi 404.
Dört test: sıralama ve alan eşlemesi, **başka okulun satırının sızmaması**, yabancı ödevde 404, okul bağlamı
yokken 403.

### `E-28` · Ayrılan öğretmenin ödevi başka bir öğretmene atanamıyor 🟡

Kullanıcı isteği (2026-09-16, `TB-109` karar turunda): *"İdare, denetim yetkisiyle birlikte ayrılan öğretmenin
yerine başka bir öğretmen de atayabilsin."*

`TB-109` sahipliğin **devredilmemesine** karar verdi — "kim yazdı" bilgisi bozulmasın diye. Ama okul gerçeğinde
öğretmen ayrıldığında ödevin bir sahibi olmalı: bugün ödev, artık okulda olmayan bir kişinin üstünde kalıyor ve
yeni öğretmen onu kendi listesinde görmüyor. `TB-109`'un açtığı idari kapı (`homework.manage` ile işaretleme,
kapatma, iptal) bu boşluğu yönetsel olarak kapatıyor ama **öğretmen tarafını** kapatmıyor.

⬜ Tasarlanacak: ödevin sorumlu öğretmenini idarenin değiştirebildiği bir yol.
- Sahiplik geçmişi korunmalı: "kim yazdı" ile "kim sorumlu" ayrı iki bilgi olabilir (`TB-109`'un kararıyla
  çelişmemeli).
- Denetim izine yazılmalı (kim, ne zaman, kimden kime).
- Öğrenciye bildirim gitmeli mi, ödev listesi/panosu nasıl güncellenir — ürün kararı.
- Aynı sınıfın kardeşi: vekâleten yayınlama (`:publish-for`) ve nöbet vekâleti; oradaki dil ve kalıp emsal alınmalı.
- Öğretmen ayrılışının kendisi bir olay mı (toplu devir), yoksa ödev ödev mi yapılır — ölçülmeli.

✅ **Tasarlandı ve kararları bağlandı — 2026-09-16.** Plan: [[2026-09-16-odev-devri-e28]]. Uygulama sürüyor.
**Ölçümden iki dayanak:** (1) vekâleten yayın bugün sahibe **hiç dokunmuyor**, "kim yaptı" bilgisini denetim satırı
taşıyor; ders vekâleti de devri ayrı bir kayıtta tutup öğretmeni devretmiyor — yani OKSİS'te "başkası adına iş"
sahipliği ezerek değil **ikinci bir olgu eklenerek** taşınıyor. (2) **Öğretmen ayrılışının kodda olayı yok**
(`Terminate` düz bir setter, olay yayınlamıyor), yani "ayrıldı → hepsini devret" otomatiği olmayan bir olayı icat
etmeyi gerektirirdi → toplu devir kapsam dışı.
**Kullanıcı kararları:** sorumlu ayrı nullable alan (`OwnerTeacherPersonId` dokunulmaz, `TB-109` ile çelişmez) ·
devri yalnız idare yapar · **yeni sorumlu tam sahip yetkisi alır** (taslağı düzeltip kendi yayınlayabilir) ·
yalnız `Draft`/`Published` · **gerekçe koşullu: ödevi yazan öğretmen hâlâ çalışıyorsa zorunlu, ayrılmışsa isteğe
bağlı** (çalışan birinin ödevini elinden almak açıklama ister) · denetim kaydına **kimden/kime** kolonları + göç ·
ders programı kontrolü zorunlu değil (yerine geçen öğretmen programa işlenmeden önce devri imkânsız kılardı) ·
v1'de bildirim yok · **öğrenci ve veli ekranında yeni sorumlu görünür, ayrı bir alanla** (mevcut alanın anlamını
değiştirmek `TB-188`'in "tek alanda iki politika" hatasının kardeşi olurdu) · geri alma aynı uçta `null` ile.

✅ **Uygulandı ve kapandı — 2026-09-16 (commit edildi ve push edildi).** Sunucu ve yüzey **aynı turda**
(`TB-188`'in dersi). Domain: nullable sorumlu alanı, etkin sorumlu türetmesi tek yerde; sahibine geri verme alanı
**boşaltıyor** — "hiç devredilmemiş" ile "geri verilmiş" tek durum, ikinci gerçek doğmuyor.
**Kaçınılmaz ikiz ve bekçisi:** EF-Ignore property sunucu sorgusuna konulamaz ama "Ödevlerim" soruyu veritabanına
sormak zorunda; SQL yüklemi ayrı yazıldı ve ikisinin ayrışmasını bir test çarpım gezerek kilitliyor, ayrıca
property EF-Ignore bekçisinin listesine eklendi — **bu bekçi ilk kez gerçek bir işte konuştu** (bkz. aşağıdaki
yanlış pozitif notu).
Kapı: üçüncü erişim kipi ve kip eşlemesi **birlikte** yazıldı; eşleme unutulsaydı detay ucu çalışma zamanında
patlardı, iki bekçi testi bunu kilitliyor. Devirden sonra ödevi yazan artık sahip değil (testle kilitli).
Gerekçe kuralı handler'da (öğretmenin çalışma durumu DB'den okunuyor), doğrulayıcı yalnız biçimi denetliyor;
arayüzdeki koşullu alan **aynı kaynaktan** besleniyor ve sunucunun reddini olduğu gibi gösteriyor.
Uç yanıtı bilinçli olarak detay DTO'su **değil**: uç taslakta da çalışıyor, oysa detay ucu taslağı idareye 404
veriyor — detay dönseydi başarılı bir devir istemciye hata gibi görünürdü.
Testler: Domain 121 · Application 363 · Api 44 (ödev süzgeçli) · `Oksis.Tests` 65/65 · core 46 · api-mocks 137.
⬜ **Kalan iki ayak:** denetim kaydının "kimden/kime" alanları istemciye bağlanmadı — çünkü **ödev denetim izinin
hiç tüketicisi yok** (`TB-112`'nin devamı); ve ödev yönetme izni olan biri ödevi kendi yazdıysa detay ekranında
devir düğmesini görmüyor (idare listesinde görüyor) — yönü güvenli, kayıtlı.
➕ **Yol boyunca iki kusur düzeltildi:** yeni test dosyası hiç derlenmediği için beş ölçümü bir kez bile
koşmamıştı (`TB-190`), ve EF-Ignore bekçisi bir **yanlış pozitif** verdi — erişim sorguda değil, sorguyu açan
`if` koşulundaydı; bekçiye muafiyet eklemek yerine erişim ayrı deyime alındı, yani bekçi delinmedi.

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

✅ **2026-09-16 · `TB-175` ile birlikte kapandı (gece turu, commit bekliyor).** Ana anahtar kapısı
`TryGetEventKey` bloğunun dışına alındı — eşlemede olmayan ~25 tip de kapıya uyuyor. Portal kararının
kaynağı yeni `NotificationEventKeyMap` (katalogda satırı olan 22 tip), `PushEventKeyMap` yalnız push
kapsamı olarak kaldı; e-posta ve push kanallarına da ana anahtar kapısı eklendi ve `config is null` dalı
"kapalı" yerine varsayılana düşüyor. Uygulama içi kanal dış kanal anahtarlarına bakmıyor. Ölçüm ve
varsayımlar `TB-175` bloğunda. `TB-126` bilinçli olarak kapsam dışı: e-posta kanalının kapsam kapısını
`NotificationEventKeyMap`'e çevirmek bazı olaylarda **gerçekten e-posta göndermeye başlamak** demek —
teslimat davranışı değişikliği, ayrı ürün kararı.

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

### `TB-127` · Kulübün dört katalog satırı hâlâ `delivered: false`, üreticileri var ⚪ *(kapandı — 2026-09-16)*

`NotificationEventTypeSeedData` dört `CLUB_*` satırını `delivered: false` ile yazıyor ve
yorumu "handler'lar Faz 5'te yazıldığında bayrak kendi migration'ıyla `true`'ya çevrilir"
diyor. Faz 5 geldi: dört bildirim handler'ı da (`ClubActivityPublished`,
`ClubActivityCancelled`, `ClubAnnouncementPublished`, `ClubApplicationDecided`) yazılı ve
`PushEventKeyMap` kapısı da açık. Bayrağı çeviren migration yazılmamış — model
snapshot'ta dördü hâlâ `IsDelivered = false`.

Zararı `TB-24`'ün tersi yönde: ekran çalışan bir bildirimi "henüz teslim edilmiyor" diye
gösteriyor. ⬜ Tek satırlık seed düzeltmesi + migration (emsal: `20260828130231`).

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** Önce açık olduğu ölçüldü (dev DB'de dördü de
`is_delivered = 0`, buna karşılık dört üretici de yazılı ve `PushEventKeyMap`'te dört anahtar da açık), sonra seed
bayrağı çevrildi ve göç `20260916051021_20260916_club_event_types_delivered` dev DB'ye uygulandı (`Up()` yalnız
dört `UpdateData`, şema komutu sıfır — sızıntı iki eksende kontrol edildi). `default_push_enabled` değişmedi,
yalnız teslim bayrağı çevrildi. **Bekçi ters yöndeydi:** `NotificationMatrixPushTests` dördünün teslim
edilmediğini zorluyordu; iddia tersine çevrildi ve komşu testin bayat docblock'u düzeltildi. Sözleşme
değişmediği için arayüzde "henüz teslim edilmiyor" rozeti kendiliğinden düşecek.

### `TB-170` · Davet kabulündeki "Duyuru bildirimleri" ve "Fotoğraf kullanım izni" anahtarları hiçbir şeye bağlı değil 🟡

Altınay saha testinde (B1.3, müdür davet kabulü, 2026-09-15) soruldu, `oksis-api` @ `60e65caf`
ve `oksis-ui` @ `1bf6a51` üzerinde ölçüldü. Onay adımı iki isteğe bağlı anahtarı **rolden
bağımsız** herkese gösteriyor (`invite-screen.tsx:415-450`, mobil `invite-accept-screen.tsx:180-186`)
ve `buildConsentGrants` bunları rıza kaydına çeviriyor:

| Anahtar | Yazılan kayıt | Okuyan kod |
|---|---|---|
| Duyuru bildirimleri | `ConsentRecord` · `Marketing` | **Yok** |
| Fotoğraf kullanım izni | `ConsentRecord` · `PhotoUsage` | **Yok** |

API'de `ConsentRecords`'u okuyan her yol yalnız `DataProcessing`'e bakıyor (`ConsentGate`,
giriş akışı) ya da kaydı listeliyor (`GetMyConsents`/`GetPersonConsents`). Sonuç:

- **Duyuru anahtarı kapatılsa da duyuru bildirimi düşer.** Duyurunun teslimatı rızaya değil
  bildirim zincirine bağlı; kişi bazlı tercihin gerçek yeri `NotificationPreference` ve o
  yalnız push için, yalnız `PushEventKeyMap` anahtarlarında okunuyor
  (`PushNotificationChannel.cs:172`) — `ANNOUNCEMENT` eşlemede yok, duyuru bugün yalnız in-app.
- **Eşleme anlamca yanlış.** `Marketing` ticari elektronik ileti rızasıdır; kurumsal duyuru
  rıza konusu değil tercih konusudur. İstemci kodunun kendi yorumu da "ayrı rıza tipi yok, en
  yakını budur" diyor (`packages/core/src/invitations/logic.ts:254`).
- **Açıklama olmayan kanal vaat ediyor:** "e-posta/SMS bildirimleri" — SMS kanalı yok (`E-23`).
- **Fotoğraf rızası ölü veri.** "Hayır" kayda geçiyor ama ürünün hiçbir yüzeyi ona bakmıyor;
  öğrenci için rızayı kimin vereceği (veli) de tanımlı değil.

`TB-43`/`TB-44`'ün kapattığı sahte toggle sınıfının davet ekranındaki hâli.
✅ **Karar (2026-09-15, kullanıcı):** iki anahtar da davetten **kaldırılır**. Bir rıza tipi
ancak onu okuyan bir tüketiciyle birlikte geri gelir.

🔄 **Kodda kaldırıldı, commit bekliyor:** `oksis-ui` dalı `fix/davet-olu-riza-anahtarlari`.
`buildConsentGrants` yalnız `DataProcessing` gönderiyor; web `invite-screen.tsx` ve mobil
`invite-accept-screen.tsx` iki satırı kaybetti, `preference-row.tsx` silindi, şemalar ve iki dilin
sözlüğü temizlendi, 2. adım başlığı "Onaylar". Web + core + mobil typecheck, üç lint ve core
testleri (551) geçti. Backend'e dokunulmadı (`ConsentType` enum'u rıza kaydının sözleşmesi olarak
kalır). Kapanış: merge + Altınay B6.3 öğretmen davetinde ekranda ölçüm.

## 12. Çapraz Kesen İşler ✳️

Tek bir ekranın değil, bir **sınıfın** işi. Kapanışları da merkezî olmak zorunda
([[yamalama-kabul-degil]]).

### `TB-164` · Ölü SQL seed'i okul-bağlı bir süper yönetici vadediyor ⚪

`K-27` ön kazımasında ölçüldü (2026-09-15, `oksis-api` @ `4fb82833`;
[[super-admin-izleri-envanteri]] §2.2). `infra/scripts/identity-dev-seed.sql` var olmayan
`users` tablosuna (`OksisDbContextModelSnapshot`'ta sıfır geçiş) `school_id = @SchoolId` ile
`superadmin@oksis.local` yazıyor — süper yöneticinin **bir okulun kullanıcısı** olduğu eski
tanımın en saf hâli. Dosya başlığı "tercih edilen yol `IdentityDevSeeder`" diyor; o seeder
ise süper yönetici hesabı hiç üretmiyor (başlığı: müdür, müdür yardımcısı, öğretmen,
öğrenci, veli). Buna rağmen `Program.cs:305` ve `DependencyInjection.cs:464` yorumları
hâlâ "1 SuperAdmin + 2 SchoolAdmin + …" vadediyor.

Zarar: yeni gelen "süper yönetici seed'i var" sanıp bulamıyor ya da SQL dosyasını
çalıştırıp tablo-yok hatasıyla karşılaşıyor.

⬜ SQL dosyası silinir, iki yorum `IdentityDevSeeder`'ın gerçek kadrosuna göre düzeltilir.
`K-27 (a)` uygulamasında platform hesabının dev seed'i ayrıca tasarlanır.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** `infra/scripts/identity-dev-seed.sql` silindi;
`Program.cs` ve `DependencyInjection.cs` yorumları `IdentityDevSeeder`'ın gerçek kadrosuna göre yazıldı
(okul başına müdür + müdür yardımcısı, 15 öğretmen — 5'i aynı zamanda veli —, 60 öğrenci, 50 veli; süper
yönetici ya da platform hesabı **seed edilmez**). Belgedeki atıflar da düzeltildi
(`teknik/ortamlar/seed-runbook.md`). Kalan iki atıf tarihsel kayıt niteliğinde
(`super-admin-izleri-envanteri`, `gecici/planlar/2026-09-15-…`), dokunulmadı.

### `TB-165` · K5 Kurum Yetkilisi ucu üründe erişilemez — izin atanmamış bir rolde 🟡

Aynı kazımada ölçüldü ([[super-admin-izleri-envanteri]] §3). `UpdateSchoolAuthorityCommand`
`school-settings.manage-authority` istiyor; seed bu izni **yalnız `SUPER_ADMIN`**'e veriyor
(`RolePermissionSeedData.cs:111`, `MasterSeedIds.cs:129`). `SUPER_ADMIN` rolünü hiçbir seed
hiçbir kişiye atamıyor ve üründe rol atayacak yol da yok (`ListAssignableRoles` seviye
süzgeci onu okul yöneticisinden gizler). Dolayısıyla `PUT school-settings/authority` bugün
**kimse tarafından çağrılamaz**; web ve mobil kart bu yüzden salt-okunur
(`general-tab.tsx:491`, `school-identity-screen.tsx:234`).

İkinci katman: rol elle bir kişiye atansa bile `AccountPermissionResolver.MapProfileToPortal`
(`:72-90`) `Platform` portalını hiçbir profile eşlemiyor; aktif profil varken **portal
süzgeci `Platform` rolünün bütün izinlerini eler**. Yani platform rolü bugünkü izin çözümü
üzerinden hiçbir izin taşıyamaz — `K-27 (a)`'nın "ayrı izin çözümü" gereksiniminin ölçümü.

Alternatif yol var (kurum yetkilisi seed'de/DB'de elle yazılabilir), bu yüzden 🟡.

⬜ Kapanış `K-27 (a)` platform yüzeyiyle gelir: kurum yetkilisi düzenleme platform izin
modülüne taşınır; portal süzgeci platform token'ı için ayrı ele alınır.

➕ **2026-09-15 · `K-27` ilk dilim sonrası:** platform yüzeyi geldi (`/platform/schools`,
`oksis-api` `e91711bd`…`74427aa3`), ancak K5 düzenleme ucu hâlâ `SUPER_ADMIN` izninde ve platform token'ı
okul komutlarına giremiyor (`TenancyMode.Required`). Madde açık kalır. `0019` uygulanınca
K5 düzenlemesi Okul Operasyonu rolünün platform komutuna taşınır.

➕ **2026-09-15 · `K-28` (a):** yetkiliyi platform açılışta sorar ve sonradan platform düzenler;
okul tarafındaki uç ve `school-settings.manage-authority` emekli olur, kart salt-okunur kalır.
Madde `K-28` uygulamasıyla kapanır, `0019`'u beklemez.

### `TB-166` · Web MSW mock'u süper yönetici rolünü dört alanda yanlış tanımlıyor ⚪

`oksis-ui/apps/web/mocks/permissions-handlers.ts:12-31` rolü `code: "SuperAdmin"`,
`displayName: "Kurum Yetkilisi"`, `level: 0`, `portalType: "Super"` diye veriyor. Backend:
`SUPER_ADMIN` / "Süper Admin" / **100** / `Platform` (`SystemRoleSeedData.cs:11`). Dosya
başlığı "portalType değerleri gerçek backend'inkilerle aynı" diyor — değil. "Kurum
Yetkilisi" K5'in adıdır, rolün değil; mock'la geliştiren biri iki kavramı karıştırır.
Seviye 0 ise "en yetkisiz" demek (yüksek = yetkili).

⬜ `K-27 (a)` web kabuğu yazılırken mock backend satırına eşitlenir; o güne kadar en azından
seviye ve kod düzeltilir.

✅ **2026-09-16 · kodda düzeltildi (gece turu, `oksis-ui`, commit bekliyor).** Mock satırı seed'e eşitlendi
(`SUPER_ADMIN` / "Süper Admin" / 100 / `Platform`), başlık yorumu düzeltildi. Eşitleme **gerçek bir kusuru** açığa
çıkardı: `packages/core/src/permissions/constants.ts` `BACKEND_PORTAL_TO_KEY` `Platform` portalını tanımıyordu ve
sessizce "school"a düşürüyordu (`platform: "system"` eklendi, testli). `0019` platform rol modeli gelince satır
yeniden gözden geçirilecek.

### `TB-168` · Sezonsuz okulda pano "Devamsızlık riski yüklenemedi" diyor 🟡

`K-27` ilk dilim senaryosunda ölçüldü (2026-09-15, platformdan açılan okulun müdürü ilk
girişte). `AttendanceRiskCard` (`oksis-ui/apps/web/features/dashboard/attendance-risk-card.tsx:49`)
aktif sezonu okuyan sorgu 404 dönünce ya da dönem kimliği yoksa **hata durumu** çiziyor:
"Devamsızlık riski yüklenemedi · Tekrar dene". Oysa ortada hata yok; okulun henüz sezonu
yok ve bu, platformdan açılan **her** okulun ilk günü. "Tekrar dene" hiçbir zaman başarıya
dönmez. Seed'li okullarda sezon hep olduğu için görünmüyordu (`E-24`'ün "seed gerçek yolu
ölçmüyor" kalıbı).

Aynı ekranın yan kartları doğru davranıyor ("Aktif sezon yok", "Bugün ders günü değil").
Alternatif yol var, müdür sezonu açınca kart düzelir. Bu yüzden 🟡.
Kanıt: `kanit/k27-mudur-ilk-ekran.png`.

⬜ Kapatma yolu: sezon/dönem yokluğu hata değil **boş durum** olarak ayrılsın ("Aktif sezon
yok, sezon açıldığında risk burada görünür"). Kural tek kartın değil, sezona bağlı bütün pano
kartlarının; [[yamalama-kabul-degil]] gereği sezon-yok durumu ortak bir bileşene çekilmeli.

✅ **Karar (2026-09-16, kullanıcı): ortak boş durum bileşeni.** Sezona bağlı bütün yüzeyler tek bir
"sezon yok / kurulumda" bileşenine bağlanacak — pano kartları, topbar seçicisi, mobil başlık ve tatil
ekranı aynı dili konuşacak. Sunucu tarafındaki sözleşme çelişkisi de hizalanacak: aynı kök durum için bir
uç `404`, benzeri `200` + boş DTO dönüyor. **En az dört durum var:** sezon yok · sezon kurulumda (`Setup`)
· sezon aktif ama dönem yok · sezon ve dönem aktif. `TB-173` ve `D-20`'nin "— Sezonu" başlığı bu kararla
kapanır.

✅ **İstemci ayağı uygulandı — 2026-09-16 (commit bekliyor).** Durum tek çözücüde:
`packages/core/src/academic-sessions/season-state.ts` → `resolveSeasonState` (dört durum, testli) + kanca
`useSeasonState`. **`setup` ile `noSeason` ayrımı yalnız sezon listesi ucundan çıkıyor** — `current` ucu `Setup`
sezonu hiç döndürmüyor. Yüzey bileşeni `SeasonStateEmpty`: `EmptyState`i sarıyor, kendi markup'ını yazmıyor, yeni
CSS yok; **"Tekrar dene" asla sunmuyor** (hiçbir zaman başarıya dönmeyecek bir eylemdi), gerçek ağ/500 hatası hâlâ
hata olarak çiziliyor. Bağlanan yüzeyler: devamsızlık riski (asıl bulgu), canlı yoklama, bugünkü devam KPI, not
girişi, sezon geri sayımı, topbar seçicisi, tatil ekranı başlığı, mobil başlık ve bağlam modalı.
Topbar'da üç yeni davranış: **kurulumdaki sezon artık yöneticiye kilitli satır + "Kurulumda" rozetiyle listeleniyor**
(eski "taslak yıl hiç listelenmez" kararı, müdürün sezonu açtığı hâlde "—" görmesinin sebebiydi), seçiciye
"Sezon Aç / Aktifleştir" yolu eklendi (bugüne dek tek giriş panodaki geri sayım kartıydı), durum noktası renk taşıyor.
Ayrıca `seasonHeaderLine` core'dan **silindi** — sezon yokken `null` döndürüyordu, mobil başlık satırının kaybolma
sebebi oydu. core 628 test yeşil (yeni 13), typecheck ve lint 6 pakette temiz.

⬜ **Sunucu hizalaması açık ve sıraya alındı.** Aynı kök durum için **altı farklı sözleşme** ölçüldü: `current` 404,
sezon listesi 200+`[]`, dönem listesi 200+`[]`, `attendance/risk` 404, `grades/summary` 200+boş DTO, `attendance/board`
200+bayrak; ayrıca sınıf listesi `warning` alanı, dosya yükleme 422, kullanıcı/duyuru 409. İstemci artık bu
dağınıklığa **bağışık** (durumu cevabın şeklinden değil sezon verisinden türetiyor), yani hizalama istemciyi
kırmaz. Ölçümden çıkan iki somut kusur ayrı madde oldu: `TB-185`, `TB-186`.

✅ **Sunucu ayağı da kapandı — 2026-09-16 (commit bekliyor).** Ölçüm: `AttendanceTermResolver` dönem
çözemediğinde üç yoklama rapor ucu **404** dönüyordu; not modülünün altı ucu aynı kök durumda **200 + boş**
dönüyor. Üç ucun da "dönem var ama veri yok" hâlinde **zaten** 200 + boş cevabı var, yani boş cevap o uçların
meşru şekli. Hiçbir test 404 beklemiyordu ve istemcide bu uçların **404 kolu yoktu** — 404 doğrudan hata
durumuna düşüyordu, `TB-168`'in "Devamsızlık riski yüklenemedi · Tekrar dene" belirtisi tam olarak buydu.
Üç ucun "dönem yok" dalı boş başarı cevabına çekildi; **kıran değişiklik değil** (yeni şekil yok, alan
kaldırılmadı, yalnız hata dalı tanımlı duruma bağlandı). Yazma yolu 404 olarak **bırakıldı** — dönemsiz yazmak
gerçekten mümkün değil. `SeasonlessReadContractTests` 2 test. `oksis-ui`'de değişiklik gerekmedi.
⬜ Tablodaki iki sözleşme bilerek dokunulmadan kaldı: sınıf listesinin `warning` alanı (zaten 200) ve dosya
yüklemenin 422'si (yazma yolu).

➕ **2026-09-15 · Altınay saha testi, pano kartı envanteri** (`oksis-ui` @ `1bf6a51`, sezonsuz
PLT-DOGRULAMA ve seed `s1` müdürüyle canlı GET): panonun 11 kartından
- **sezondan bağımsız 2:** öğrenci ve öğretmen KPI (`student-stats`/`teacher-stats`, gerçek sıfır),
- **doğru boş durum çizen 4:** sezon geri sayımı ("Aktif sezon yok", `summary-kpis.tsx:75`),
  bugünkü devam ve canlı yoklama (`board` → `isSchoolDay:false`), not girişi (`grades/summary`
  dönem yoksa 200 + boş DTO),
- **yanlış hata çizen 1:** devamsızlık riski (bu madde),
- **sabit örnek veri 4 (`K-09` rozeti):** son etkinlikler, bekleyen işlemler, yaklaşan takvim,
  bugünkü nöbet (`dashboard-static.ts:46/111/155/193`). Nöbet ve bekleyen işlemler için
  gerçek hook'lar var ama kartlara bağlı değil; etkinlik akışı ve takvim için uç yok.

Aynı kök durum (dönem yok) için **sunucu sözleşmesi de ikiye ayrık**: `GetRiskStudentsQueryHandler:36`
`NotFound` (404), `grades/summary` `Success` + boş DTO. İstemcide üç ayrı strateji var (sabit
"—" metni, `isSchoolDay` bayrağı, `termId` yoksa hata dalı). Merkezi bir "sezonsuz" bileşeni ya da
kapısı yok. Topbar ve mobil başlığın aynı eksikliği: `TB-173`.

### `TB-169` · Platform giriş ucunda hız sınırı politikası yok ⚪

`K-27` ilk diliminde bilinçli olarak dışarıda bırakıldı ve plan gereği deftere yazıldı.
`POST api/v1/platform/auth/login` okul girişindeki `UseRateLimiter` politikasına bağlı değil.
Hesap kilidi var: 5 hatalı denemede 15 dakika (`PlatformAccount.MaxFailedAttempts`), yani tek
hesaba kaba kuvvet sınırlı. Ama IP bazlı sınır yok ve bilinmeyen e-postalar sayaca girmiyor,
dolayısıyla hesap avı sınırsız. Şimdilik yalnız bir platform hesabı olduğu ve dev ortamında
koştuğu için ⚪.

⬜ Kapatma yolu: okul girişinin politikası platform ucuna da uygulanır. `0019` rolleri gelip
platform hesap sayısı artmadan yapılmalı.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor) — ve bulgu sanılandan genişti.** Ölçüm: depoda
**tek bir `[EnableRateLimiting]` yoktu**, yani `Program.cs`'teki üç politika tanımlıydı ama hiçbir uca bağlı
değildi; **okul girişi de korumasızdı**. Ayrıca `authenticated`/`anonymous` politikaları **bölümlenmemiş tek
kova**ydı: okul girişine bağlansaydı tek saldırgan bütün okulun girişini kilitlerdi. Bu yüzden yeni
`Api/Extensions/RateLimitingSetup.cs` ile **IP bölümlü** iki politika yazıldı: `school-login` (60/dk/IP) ve
`platform-login` (10/dk/IP, ayrı kova). Bağlananlar: okul girişi, parola unuttum ve sıfırlama (üçü de anonim ve
hesap hedefli), bir de platform girişi. Ret yanıtı standart `ApiResponse` zarfı (`RATE_LIMITED`) + `Retry-After`.
Test: gerçek Kestrel üzerinde sınır 2'ye indirilip 3. istekte 429 ve iki kovanın ayrı olduğu ölçüldü (6 test).
⬜ **Açık kalan:** `ForwardedHeaders` kurulu değil — API bir ters vekil arkasında koşarsa tüm istekler tek IP
görünür ve bölümleme fiilen tekleşir (kodda yorumla işaretli, ayrı iş). Davet kabulü için yazılmış
`invitation-public` politikası da hâlâ bağsız.

### `TB-171` · Platformdan açılan okulda görünen ad ve kurum yetkilisi boş kalıyor 🟡

Altınay saha testinde (B2.1, 2026-09-15) ölçüldü. `CreateSchoolCommandHandler`
`SchoolSettings.CreateDefault(school.Id)` ile ayar satırı açıyor. `official_name` okul adıyla
doluyor, ama `display_name` ile `authority_full_name`/`authority_title`/`authority_email` **NULL**
kalıyor. `CreateSchoolCommand` bu alanları sormuyor bile (yalnız ad, kod, tür, saat dilimi ve müdür).

- **Görünen ad:** Ayarlar → Genel Bilgiler önizlemesi `values.displayName || "—"` okuduğu için
  (`general-tab.tsx:204`) yeni okul "?" rozeti ve "—" adıyla açılıyor. Müdürün ilk işi, okulun
  adını ikinci kez yazmak oluyor.
- **Kurum yetkilisi:** Kart boş ve kilitli. Düzenleme ucu (`PUT school-settings/authority`) hâlâ
  `SUPER_ADMIN` izninde, platform token'ı okul komutuna giremiyor (`TB-165`). Platformda da okul
  düzenleme ucu yok (`PlatformSchoolsController`: yalnız liste + oluştur). Sonuç: taze okulun
  kurum yetkilisi **hiçbir yoldan** doldurulamıyor.

⬜ Kapatma yolu **`K-28` (a)** ile bağlandı (2026-09-15): platform açılışta sorar, sonradan
platform düzenler, müdür yalnız görür. Görünen adın okul adından tohumlanması K-28'in açık
sorusu olarak uygulama planında sorulacak.

➕ **2026-09-16 · görünen ad ayağı kapandı (gece turu, commit bekliyor).** `CreateSchoolCommandHandler` artık
`displayName: school.Name` geçiyor (NULL bırakan tek satır oydu) ve veri göçü
`20260916042550_20260916_school_settings_display_name_backfill` mevcut NULL satırları okul adıyla dolduruyor —
müdürün yazdığı ad **ezilmiyor** (`display_name IS NULL` süzgeci). Dev DB ölçümü: NULL sayısı **1 → 0**; tek
dokunulan satır `PLT-DOGRULAMA` oldu. **Altınay'ın görünen adı zaten doluydu**, yani saha testindeki "—" rozeti
kurulumun ilk anına aitti.
⬜ **Kurum yetkilisi ayağı açık ve kullanıcı kararı bekliyor:** platformun açılışta sorması, sonradan düzenleme
ucu ve K5 ucunun emekliliği **sözleşme değiştiriyor**. Uygulama planı hazır:
[[2026-09-16-kurum-yetkilisi-k28]] (Adım 3–8). Altınay'ın yetkilisi hâlâ boş; plan gereği platform ekranından
elle doldurulacak.

### `TB-172` · Okul kodunun tekilliği yalnız uygulama katmanında; DB'de tekil indeks yok ⚪

Altınay saha testinde (B1.2, 2026-09-15) ölçüldü. `CreateSchoolCommandHandler:40-45` kodu kırpıp
büyük harfe çeviriyor ve `AnyAsync(s => s.Code == code)` ile arıyor; canlı denemede `altinay-al`
**409** `PLATFORM_SCHOOL_CODE_DUPLICATE` aldı, satır yazılmadı. Ama `school.schools` tablosunda
yalnız `pk_schools` var; EF model snapshot'ında da `School.Code` için `HasIndex` **tanımlı değil**
(eksik göç değil, hiç modellenmemiş kısıt).

Sonuçları:
- **Yarış:** Aynı kodla eşzamanlı iki açılış, ikisi de `AnyAsync`'ten boş dönüp iki satır yazabilir.
- **Kod okulu çözmek için kullanılıyor:** Giriş öncesi marka sorgusu (`GetPublicSchoolBrandingQueryHandler:49-51`)
  `Where(Code == code).FirstOrDefault` ile okul seçiyor; ikinci satır sessizce görünmez olur.
- **Elle DB müdahalesi** (saha testinde kod `ALTNY-TEST` → `ALTINAY-AL` elle değiştirildi) hiçbir
  kısıta takılmıyor.

Bugün tek platform hesabı olduğu için eşzamanlı açılış pratikte yok → ⚪.
⬜ Kapatma yolu: `SchoolConfiguration`'a `HasIndex(s => s.Code).IsUnique()` + göç; handler'daki ön
denetim kullanıcıya okunur hata için kalır, DB ihlali (`2601`) aynı `SCHOOL_CODE_DUPLICATE`'e
eşlenir. `0019` rolleriyle platform hesap sayısı artmadan yapılmalı.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** Ölçümde planlanandan bir adım fazlası çıktı:
`School.Code` **`nvarchar(max)`** idi ve SQL Server bunun üstüne tekil indeks kuramıyor. Göç
`20260916041531_20260916_school_code_unique_index` önce iki **savunma sorgusu** koşuyor (50'den uzun ya da
yinelenen kod varsa `RAISERROR` ile durur — ayrı `Sql()` komutları olduğu için şema değişmeden durulur), sonra
`AlterColumn` (max → 50), sonra süzgeçsiz `CreateIndex` (tabloda `is_deleted` yok). Dev DB'de uygulandı ve
doğrulandı: `code` artık `nvarchar(50)`, `ux_schools_code` `is_unique=1`. `School` için ayrı yapılandırma dosyası
olmadığından kayıt `OksisDbContext`'teki satır içi bloğa yazıldı.
İhlal eşlemesi bu gecenin `BellScheduleIndex` kalıbıyla aynı: yeni `SchoolCodeIndex` ihlali **indeks adından**
tanıyor, SQL hata numarasından değil. Ön denetim okunur hata için duruyor; **yalnız ilk** `SaveChangesAsync`
sarıldı ve aynı `PLATFORM_SCHOOL_CODE_DUPLICATE` koduna (409) eşlendi. Yarış kolu gerçekten ölçüldü: bir
`SaveChanges` interceptor'ı ön denetimle kaydetme arasındaki pencerenin ortasında rakip satırı yazıyor, handler
500 değil 409 dönüyor.

### `TB-173` · Sezonsuz okulda topbar sezon seçicisi "—", mobil başlık satırı hiç yok 🟡

Altınay saha testinde (2026-09-15) müdürün ilk ekranında görüldü, kodla ve sezonsuz
PLT-DOGRULAMA müdürüyle canlı ölçüldü (`academic-sessions/current` **404** `NO_ACTIVE_SESSION`,
`academic-sessions` ve `terms` **200 `[]`**).

| Yüzey | Bugün | Neden |
|---|---|---|
| Web seçici, kapalı | `● 📅 — ⌄` | `season-context-picker.tsx:138` ad zincirinin sonu `"—"`; nokta durum göstermiyor, sabit aksan |
| Web seçici, yıl bölümü | Yalnız başlık, satır yok | Boş liste için metin tanımlı değil |
| Web seçici, dönem bölümü | "Bu yıla ait dönem bulunmuyor." (`:318`) | Yıl yokken "bu yıl" diyor |
| Web seçici, bilgi kutusu | "Tam yetki… hazırlanmakta olan yıl sezon sihirbazından yönetilir." | Sezon var/yok ayrımı yapmıyor; sihirbaza bağlantı yok |
| Mobil başlık | Bağlam satırı **tamamen kayboluyor** | `seasonHeaderLine(null)` → `null`, `app-header.tsx:103` satırı çizmiyor |
| Mobil bağlam modalı | Yıl listesi boş, dönem bölümü gizli | Boş durum metni yok |

Sezonu açma yolu seçicide yok; tek yol panodaki "Sezon geri sayımı" kartına tıklamak
(`summary-kpis.tsx:76` → `/academic-sessions`). Her yeni okulun ilk ekranı → 🟡.
Aynı sınıfın pano ayağı `TB-168`; ikisi aynı merkezi "sezonsuz" kuralıyla kapanmalı
([[yamalama-kabul-degil]]).

⬜ Kapatma yolu: pano ve bağlam seçicisi için ortak sezonsuz durum kararı (ürün kararı bekliyor).

✅ **Karar (2026-09-16, kullanıcı):** `TB-168` ile ortak — sezona bağlı bütün yüzeyler tek bir boş durum
bileşenine bağlanır, dört durum ayrılır (yok · kurulumda · aktif-dönemsiz · aktif). İkisi tek turda kapanacak.

✅ **İstemci ayağı uygulandı — 2026-09-16 (commit bekliyor).** Ayrıntı `TB-168` bloğunda. Bu maddenin tablosundaki
altı yüzeyin hepsi kapandı: seçici kapalı hâli, yıl bölümü boş metni, dönem bölümünün "bu yıl" yanlışı, bilgi
kutusunun durum körlüğü, **mobil başlığın tamamen kaybolması** ve mobil modalın boş durumu. Sezonu açma yolu da
seçiciye eklendi.

➕ **2026-09-16 · ara durum ölçüldü:** Altınay'da sezon açıldı ama `Setup` (henüz aktifleştirilmedi). `academic-sessions/current`
yalnız `Active` sezonu döndürdüğü için topbar seçicisi hâlâ **"—"**; Redis'te `current-session` `NO_ACTIVE_SESSION` önbellekte.
Yani önerilen üç kademeli kurala dördüncü bir durum eklenmeli: **"Sezon kurulumda"** (var, aktifleştirilmemiş) — kullanıcı
az önce sezonu açtığı hâlde ekran "sezon yok" gibi davranıyor.

### `TB-174` · Yarım Gün zil şablonu hiçbir okulda kaydedilemiyor — tekil indeks şablonu kapsamıyor (500) 🟠

Altınay saha testinde (B2.3, 2026-09-15) müdür Tam Gün çizelgesini kaydettikten sonra Yarım
Gün'e geçip kaydedince `POST school-settings/bell-schedules/bulk` **500 `InternalError`** döndü
(correlationId `683a5b14…`). Sunucu günlüğü:
`SqlException: Cannot insert duplicate key row … unique index 'ux_school_bell_schedules_school_order'. The duplicate key value is (b38c8595-…, 6)`.

**Kök neden:** `5a1250af` (2026-06-24, "Zil şablon (TemplateKey) + BellDayAssignment") şablon
kolonunu ekledi ama tekil indeksi eski hâlinde bıraktı: `(school_id, lesson_order)`, süzgeç
`is_deleted = 0` (`BellScheduleConfiguration.cs:57-60`). `BulkCreateBellScheduleCommandHandler:40-42`
yalnız **gelen şablonun** satırlarını siliyor, sonra 1'den başlayan `lessonOrder`'larla ekliyor →
Tam Gün satırları aynı sıraları tuttuğu için çakışıyor. DB ölçümü: **beş okulun hiçbirinde tek bir
`HalfDay` satırı yok** — özellik yazıldığı günden beri hiç çalışmamış. İhlal okunur bir hataya
eşlenmediği için ekrana 500 düşüyor.

**Yalnız indeksi düzeltmek yetmez — şablona bakmayan beş tüketici var:**

| Tüketici | Bugün | Yarım Gün satırı yazılınca |
|---|---|---|
| `GetTodaysSubstitutionBoardQueryHandler` (Step 4) | `ToDictionary(LessonOrder)` | Aynı anahtar iki kez → `ArgumentException` → **vekâlet panosu 500** |
| `GetMySubstitutionsQueryHandler` (Step 5) | `ToDictionary(LessonOrder)` | Aynı → **"vekâletlerim" 500** |
| `GetAvailableRelieversQueryHandler` | Öğle arası sıraları şablon karışık toplanıyor | Yanlış öğretmen meşgul sayılır |
| `AutoDistributeDutyJob` | Aynı öğle arası birleşimi | Nöbet dağıtımı yanlış çakışma görür |
| `BellScheduleProvider.GetPeriodCountAsync` | Tüm `Lesson` satırlarını sayıyor | Günlük ders sayısı iki şablonun toplamı olur |

Şablonu gün atamasıyla çözen tüketiciler doğru: `AttendanceDayLessons`, `SessionMaterializer`,
`ExamPeriodLabeller`, `PublishedScheduleQueryHandler`.

⬜ Kapatma yolu: indeks `(school_id, template_key, lesson_order)` + göç; şablon çözümü tek bir
yardımcıya çekilip (gün → `BellDayAssignment` → şablon) beş tüketici ona bağlanır; kısıt ihlali
okunur bir koda eşlenir. Tüketiciler düzelmeden indeks değişirse vekâlet ekranları kırılır — ikisi
aynı commit'te gitmeli.

➕ **Sessiz ikinci etki (DB ölçümü):** Altınay'ın gün atamaları kaydedildi — Pzt–Per `FullDay`,
**Cuma `HalfDay`** — ama `HalfDay` şablonunda satır yok. Gün atama komutu satırsız şablona atamayı
reddetmiyor. `SessionMaterializer.GetLessonBellsAsync` (`:265-296`) ve `AttendanceDayLessons` şablonu
gün atamasından çözdüğü için Cuma'nın ders listesi **boş** döner → Cuma günleri yoklama oturumu
hatasız ve sessizce hiç üretilmez (koddan çıkarıldı; sezon açılınca C1.1'de ölçülecek).
⬜ Ek kapatma: satırı olmayan şablona gün atanamasın ya da ekran uyarsın.

✅ **2026-09-16 · sunucu ayağı kodda düzeltildi (gece turu, `oksis-api` `fix/ilk-sezon-acilisi`, commit bekliyor).**
Göç `20260915222342_20260916_bell_schedule_template_order_index`: indeks `(school_id, template_key, lesson_order)`,
`is_deleted = 0` süzgeci korundu — dev DB'ye uygulandı, `sys.indexes`'te doğrulandı. Şablon çözümü tek yardımcıda:
`Application/Modules/Schools/Common/BellDayTemplates.cs` (gün → `BellDayAssignment` → şablon → o şablonun zilleri,
1..N ordinal ders listesi, haftalık ızgara şablonu) + `BellScheduleIndex.cs` (indeks adından ihlal tanıma).
Bağlanan tüketiciler: defterdeki beşi, **ayrıca envanterde çıkan iki kırık daha** — `PublishedScheduleQueryHandler`
(defterde "doğru" sayılmıştı, şablona bakmıyordu) ve `GetSchoolSettingsQueryHandler.DailyLessonCount`; doğru çalışan üçü
(`AttendanceDayLessons`, `SessionMaterializer`, `ExamPeriodLabeller`) davranışları korunarak aynı yardımcıya geçti.
İki açık politika: yoklama/oturum üretimi yalnız açık atamayı şablon sayar, saat/öğle/ızgara okuyanlar atama yoksa Tam
Gün'e düşer. Gün bilgisi olmayan bağlamlar (ders sayısı, yayınlı ızgara) "haftaya atanmış en uzun şablon"u okur — gün
bazlı ızgara sözleşme değişikliği ister, `E-25` kararına bırakıldı. Ayrıca vekâlet panosu ham `lesson_order` ile
eşliyordu, teneffüs sıra tükettiğinde saat kayıyordu; artık ordinal eşleme. Kısıt ihlali bulk'ta `ConflictException`
(409 + katalog cümlesi) — başarısız `Result` dönseydi `ExecuteDeleteAsync` COMMIT edilip şablon boşalırdı.
Canlı ölçüm (seed okul `TST-AL`, Altınay'a dokunulmadı): FullDay 204 → **HalfDay 204** (bulgudaki 500 kapandı) →
tekrar 204; Cuma=HalfDay atamasıyla vekâlet panosu gün bazlı saat döndürdü; `dailyLessonCount` 8 (iki şablonun toplamı
12 değil). Ölçüm verisi geri alındı. Birim: Domain 1067 · Application 2663 · Api 435 · mimari 7 yeşil.
**Açık:** entegrasyon koşusunun özeti alınamadı (ClamAV testi ortam kaynaklı düşüyor, madde dışı), `dotnet format`
koşulmadı, "satırsız şablona gün atanamasın" sunucu kuralı yazılmadı — ekran uyarısı var (`B-51` notu).

### `D-19` · Zil programı ekranı: boşken "Yeniden Üret", çarpısı stilsiz modal, Enter ile ilerlemiyor 🟡

Altınay saha testi (B2.3, 2026-09-15), `oksis-ui` @ `1bf6a51` üzerinde ölçüldü.

| Gözlem | Bugün | Neden |
|---|---|---|
| Buton metni | Hiç satır yokken de "Çizelgeyi Yeniden Üret"; modal "mevcut **0** satırın üzerine yazar" | `bell-schedule-tab.tsx:354` sabit metin; `:446` 0 satır durumunu ayırmıyor |
| Onay modalı çarpısı | Sol üstte çıplak | `AModal` (`features/settings/parts.tsx:598-650`) yalnız ayarlar ekranına özel; `className="ayr-mx"` (`:583`, `:626`) için **hiç CSS kuralı yok** |
| Enter tuşu | Saat alanlarında hiçbir şey yapmıyor | `bell-schedule-tab.tsx:213-230` `onKeyDown` yok; sayfada `<form>` yok |

Çarpı tek ekranın sorunu değil: uygulamada 25'ten fazla özellik kendi kapatma sınıfını yazmış
(`.snf-mclose`, `.dx`, `.grv-drawer-x`, `.gb-x` …), paylaşılan bir `Dialog` yok. Bileşen envanteri
`ConfirmDialog` ve `FormDialog`'u zaten **⬜ planned** olarak listeliyor (`frontend/bilesenler/_envanter.md:20-21`).
Enter ile hücreden hücreye geçişin tek emsali ekrana gömülü: `grade-grid-screen.tsx:511-554` `onCellKey`.

⬜ Kapatma yolu ([[yamalama-kabul-degil]]): `ConfirmDialog` paylaşılan bileşen olarak yazılır, `AModal`
ona geçer (diğer modallar kademeli); Enter ile ilerleme ortak bir hook'a çekilir (`onCellKey` deseninden);
buton/modal metni satır sayısına göre "Çizelge Oluştur" / "Yeniden Üret" ayrılır.

✅ **2026-09-16 · kodda düzeltildi (gece düzeltme turu, `oksis-ui` `fix/davet-olu-riza-anahtarlari`, commit bekliyor).**
Paylaşılan `Dialog` + `ConfirmDialog` (`apps/web/components/shared/`, `packages/ui/src/styles/dialog.css`); `AModal`
ve `ADrawer` artık `Dialog` sarmalayıcısı (6 çağrı yeri prop değişmeden; çekmece çarpısı da aynı stilsizlikteydi).
Enter ile ilerleme ortak `useGridEnterNav` (`packages/ui/src/hooks/use-grid-enter-nav.ts`: başlangıç → bitiş → sonraki
satır; son hücrede yeni satır açar, Shift+Enter geri). Satır yokken "Çizelge Oluştur" onaysız, varken "Çizelgeyi Yeniden
Üret" + `ConfirmDialog` "mevcut 15 satır". Altınay'da kaydetmeden tarayıcıda ölçüldü; core 580/580, typecheck temiz.
Açık kalan: 25+ özel modal kademeli taşınacak (envanterde not), `FormDialog` ⬜; `grade-grid-screen` `onCellKey` farklı
anlamda (Enter aşağı, G/M/ok tuşları) olduğu için hook'a taşınmadı. Madde merge ile arşive gider.

### `B-51` · Zil programında teneffüs ve öğle arası elle eklenemiyor 🟡

Altınay saha testi (B2.3, 2026-09-15). "+ Ders Ekle" (`bell-schedule-tab.tsx:87-100` `addRow`) satırı
sabit `type: "ders"` ile açıyor; satırın tipini sonradan değiştiren bir kontrol yok (rozet tıklanamayan
`<span>`). Teneffüs ve öğle arası yalnız otomatik üreticiyle doğuyor — elle çizelge kuran okul molasını
giremiyor. Sunucu engel değil: `BulkCreateBellScheduleCommandValidator` `Lesson`/`Break`/`LunchBreak`
üçünü de kabul ediyor. Saf istemci eksikliği.

⬜ Kapatma yolu: satıra tip seçici (mevcut `ASeg`) ya da "+ Ders / + Teneffüs / + Öğle Arası" ekleme
seçenekleri. Öğle arasının tüketicileri var (`GetAvailableRelievers`, `AutoDistributeDutyJob`) — elle
girilen öğle arası da onlara doğru ulaşmalı (`TB-174` tüketici düzeltmesiyle birlikte ölçülür).

✅ **2026-09-16 · kodda düzeltildi (commit bekliyor).** Her satırda Ders / Teneffüs / Öğle Arası `ASeg`'i; ekleme
butonu "Satır Ekle". Tip değişimi ve varsayılan süre `packages/core` `changeBellRowType`/`bellRowDefaultDuration`
(testli). Tarayıcıda kaydetmeden ölçüldü (Teneffüs 10 dk, Öğle Arası 60 dk). Mobil zil ekranı salt-okunur, kusuru
taşımıyor. `TB-174`'ün ekran ayağı da aynı turda: Gün Atamaları'nda ders satırı olmayan şablona atanmış gün ⚠ ve
"O gün ders oturumu açılmaz ve yoklama alınamaz" bandı (web + mobil; Altınay'da Cuma canlı görünüyor). Sunucu hâlâ
satırsız şablona atamayı reddetmiyor — `TB-174` sunucu ayağında değerlendirilir.

### `E-25` · Zil şablonları sabit ikili (Tam Gün / Yarım Gün); güne göre adlandırılmış program yok 🟡

Altınay saha testi (B2.3, 2026-09-15). Okul Pazartesi–Perşembe bir, Cuma farklı bir zil programı
uyguluyor. Şablon hem sunucuda (`BellTemplateKey` enum) hem istemcide
(`packages/core/src/bell-schedule/{types,constants}.ts`) yalnız `FullDay`/`HalfDay`; `BellDayAssignment`
her güne bu ikiliden birini ya da "kapalı" atıyor. Üçüncü ya da adlandırılmış şablonun yolu yok.

Ölçüm: `TB-174` düzeltilince Cuma'yı "Yarım Gün" şablonuna atamak **hesapça** güvenli — devamsızlığın
yarım gün eşiği (`HalfDayLessonThresholdPercent`, `AbsenceDayEquivalenceCalculator:29-56`) şablon adına
değil o günün gerçek oturum oranına bakıyor. Sorun **anlam**: Cuma programı yarım gün değil; ekranda,
raporda ve öğretmenin programında "Yarım Gün" yazması yanlış bilgi.

⬜ Ürün kararı bekliyor: (a) şablonlar okulun adlandırdığı serbest kayıtlara dönüşür (ör. "Pzt–Per",
"Cuma"), gün ataması onlara bağlanır; (b) ikili kalır, yalnız etiketler nötrleşir ("Program A / B");
(c) bugünkü gibi kalır, Cuma "Yarım Gün" olarak kullanılır.

### `TB-175` · Okul açılışında bildirim ana ayarı tohumlanmıyor; ilk "Kaydet" okulun bütün bildirimlerini kapatıyor 🟠

Altınay saha testi (B2.2, 2026-09-15). `SchoolCreated` handler'ları modül ayarlarını
(`SeedDefaultModuleConfigsHandler`), olay kurallarını (`SeedDefaultNotificationRulesHandler`, 27 satır)
ve kademeleri tohumluyor — **okulun bildirim ana ayarını (`NotificationConfig`) tohumlayan yok.** Satırı
yalnız `UpdateNotificationConfigCommandHandler:50-62` müdür ilk kez kaydedince yaratıyor.

DB ölçümü (`school.school_notification_configs`): Altınay ve PLT-DOGRULAMA'da **satır yok**; seed
okullarından yalnız `ATA-AL`'da var.

Satır yokken üç yüzey üç farklı şey söylüyor:

| Yüzey | Satır yokken |
|---|---|
| Ayar ekranı (`GetNotificationConfigQueryHandler:75-78`) | Ana anahtar, e-posta, push **kapalı** (`?? false`) |
| E-posta ve push kanalları (`EmailNotificationChannel:76`, `PushNotificationChannel:137`) | `config is null` → **gönderilmez** |
| Uygulama içi kanal (`InAppNotificationChannel:56`) | `config is not null && !IsEnabled` → satır yokken **engellenmez, gönderilir** |

Müdür ekranda "bildirimler kapalı" görüyor, kullanıcılar zile yine bildirim alıyor. E-posta ve push ise
müdür bu sekmeyi bir kez kaydetmeden hiçbir okulda çalışmıyor — kimse bunun gerektiğini bilmiyor.

**Bayat ipucu:** Sessiz saatlerin yanında "Hazırlanıyor — gönderim henüz bu aralığa bakmıyor"
(`notification-tab.tsx:227`, `TB-45` dönemi). Artık doğru değil: push kanalı aralığı uyguluyor ve
bildirimi aralık sonuna erteliyor (`PushNotificationChannel.cs:186-190`, `PushQuietHours`). Uygulama içi
ve e-posta kanalları bakmıyor.

⬜ Kapatma yolu: `SchoolCreated`'a varsayılan `NotificationConfig` tohumu (ana anahtar + uygulama içi açık;
e-posta/push varsayılanı ürün kararı) + mevcut satırsız okullar için göç/backfill; ipucu "yalnız push
bildirimlerini erteler" olarak düzeltilir.

➕ **2026-09-15 · ilk kaydın zinciri ölçüldü → 🟠.** Ekranda (web ve mobil) okulun kanal ana
anahtarlarını düzenleyen **hiçbir kontrol yok**; `buildNotificationPayload`
(`packages/core/src/notifications/logic.ts`) `pushEnabled`/`emailEnabled`/`smsEnabled`/`lateArrivalNotify`'ı
formdan değil **okunan matristen aynen geri yolluyor** (echo). Satır yokken okuma dördünü `false`
döndürdüğü için ilk PUT dördünü `false` gönderiyor → `UpdateNotificationConfigCommandHandler:50-62`
satırı yaratıyor → `NotificationConfig.Create:70` `IsEnabled = push || email || sms || lateArrival` =
**`false`** → `InAppNotificationChannel:56` artık `config is not null && !IsEnabled` dalına giriyor →
**uygulama içi bildirim de kesilir.**

| An | E-posta | Push | Uygulama içi |
|---|---|---|---|
| Okul açıldı, ayar hiç kaydedilmedi | ❌ | ❌ | ✅ |
| Müdür Bildirim Ayarları'nda bir kez **Kaydet** (matris, sessiz saat — ne değişirse) | ❌ | ❌ | ❌ |
| Sonrası | Açacak kontrol yok | Açacak kontrol yok | Açacak kontrol yok |

Yani ekran matriste "Portal ✅" gösterirken okul sessizce tamamen bildirimsiz kalıyor ve bunu geri
alacak bir yüzey yok. Seed okullarında görünmüyordu: `ATA-AL`'ın satırı seed'den `1/1/1` geliyor,
diğerlerinde ekran hiç kaydedilmemiş.

⬜ Kapatma yolu genişledi: (1) `SchoolCreated`'a varsayılan satır tohumu + satırsız okullara backfill;
(2) `IsEnabled` "en az bir kanal açık" türevinden çıkarılıp gerçek ana anahtara dönüşür **ya da** uygulama
içi kanal bu türevi okumayı bırakır (uygulama içi, dış kanalların kapalı olmasıyla susmamalı);
(3) kanal ana anahtarları ya ekrana gelir ya da echo'dan çıkarılır — ekranın göstermediği bir alanı
kör geri yazmak bu hatayı üretiyor.

✅ **Karar (2026-09-15, kullanıcı):** geçici DB düzeltmesi yapılmaz; madde Altınay düzeltme turuna girer ve
**C1 (sezon yaşam döngüsü) başlamadan kapanır**. Altınay'ın `is_enabled=0` satırı o düzeltmenin
backfill'iyle onarılır.

✅ **2026-09-16 · kapandı, canlı doğrulandı (gece turu, commit bekliyor).** Beş ayak da yazıldı:
1. **`IsEnabled` gerçek ana anahtar** — `push || email || sms || lateArrival` türevi kaldırıldı; `Update` üç durumlu
   (`null` = dokunma).
2. **`TB-125` ile birlikte kapandı** — ana anahtar kapısı `TryGetEventKey` bloğunun dışına çıktı, eşlemede olmayan
   ~25 tip de kapıya uyuyor; Portal kararının kaynağı yeni `NotificationEventKeyMap` (katalogda satırı olan 22 tip),
   `PushEventKeyMap` yalnız push kapsamı olarak kaldı. **Uygulama içi kanal artık dış kanallara bakmıyor** — okulun
   push'u kapatması zili susturmuyor.
3. **Tohum + backfill** — `SeedDefaultNotificationConfigHandler` (`SchoolCreated`) + göç
   `20260916004157_20260916_notification_config_seed_backfill` (yalnız veri; `Up()` boş üretildi, gövdeye iki
   `migrationBuilder.Sql` yazıldı). Dev DB ölçümü: **öncesi 6 okul / 2 satır** (`ALTINAY-AL` `0/0/0/0/0`,
   `ATA-AL` `1/1/1/0/1`), **sonrası 6 satır**, hepsi `1/1/1/0/1`; 4 tohum + 1 onarım, echo kurbanı kalmadı.
   `ATA-AL`'a dokunulmadı (koşul dört kanalın da 0 olmasını şart koşuyor → okulun bilinçli kararı ezilmiyor).
   **Altınay onarıldı: `1/1/1/0/1`.**
4. **Echo kaldırıldı** — `buildNotificationPayload` kanal ana anahtarlarını göndermiyor, sunucu `null` gelince mevcut
   değeri koruyor.
5. **Bayat sessiz saat ipucu** düzeltildi (web + mobil): aralık yalnız push'u erteler.

Canlı ölçüm (seed müdürü): gövdesinde kanal anahtarı olmayan `PUT` → 204, ardından `GET` → `isEnabled: true`,
push/e-posta açık; DB `1/1/1/0/1`. **"Kaydet" artık okulu kapatmıyor** — maddenin kapanış ölçütü.
Testler: Application 2671 · Api 435 · mimari 7 yeşil; bildirim entegrasyon testleri 4/4; core 602; UI typecheck ve
lint temiz (codegen elle düzeltmeyle birebir aynı çıktı).

**Varsayım (ürün kararı, tek dönüş noktası):** e-posta/push varsayılanı `ATA-AL`'ın satırıyla hizalandı — ana anahtar
açık, push açık, e-posta açık, **SMS kapalı** (`E-23`: uygulaması yok), geç gelme açık. Tersi seçilirse yalnız
`src/Oksis.Domain/Modules/Schools/NotificationConfigDefaults.cs` değişir (tohum, backfill, okuma yüzü ve üç kanal
aynı sabitleri okuyor) + bir düzeltme SQL'i.

✅ **Karar (2026-09-16, kullanıcı):** varsayım **onaylandı** — okul açılışında ana anahtar açık, push açık,
e-posta açık, SMS kapalı, geç gelme açık. Kodda uygulanan hâli geçerli.
**Operasyonel not:** göç DB'ye doğrudan yazdığı için Redis `notification-config` anahtarı bayat kaldı; ekran ilk
`PUT`'a kadar eski değeri gösterdi. Göçle veri değiştiren her turda ilgili önbellek anahtarı temizlenmeli.

### `TB-176` · Sezonsuz eklenen okul tatili ayar ekranında görünmüyor, silinemiyor — ama yoklama takvimi onu tatil sayıyor 🟠

Altınay saha testi (B2.4, 2026-09-15), web'den canlı ölçüldü. Sezonu olmayan okulda Ayarlar → Tatil
Takvimi → "Yeni Tatil" ile "Saha Testi Tatili (silinecek)" (2–3 Kasım 2026) eklendi: ekran "Yeni okul
tatili eklendi" dedi, liste **"Kayıt yok · 0"** kaldı. DB:
`academic.school_holidays` → `holiday_type=ClosedDay`, **`academic_session_id = NULL`**.

Neden: `CreateHolidayCommandHandler:52` sezonu `GetCurrentSessionIdOrNullAsync` ile çözüyor, sezon yoksa
`null` yazıyor. Okuyucular bu kaydı iki farklı biçimde görüyor:

| Okuyucu | Süzgeç | Sezonsuz kayıt |
|---|---|---|
| Ayar listesi `GetHolidaysQueryHandler:45` | `AcademicSessionId == seasonId` | **Görünmez** — düzenlenemez, silinemez |
| Sezon tatil sorgusu `GetSchoolHolidaysForSessionQueryHandler:29` | `AcademicSessionId == session.Id` | **Görünmez** |
| Takvim okuyucusu `HolidayCalendarReader:42` (yoklama `SchoolCalendarService`, program istisnası planlayıcısı, yayınlı program) | `SchoolId == schoolId` | **Tatil sayılır** |

Ekranda hiç görünmeyen ve silinemeyen bir kayıt, o günleri yoklamada ders dışı gün yapar. Sezonu sonradan
açmak kaydı sezona bağlamaz. Aynı durum sezon açıldıktan sonra ise olmaz — her yeni okulun **ilk
gününe** özgü, ama müdürün tatil takvimini sezondan önce doldurması doğal bir sıra.

⬜ Kapatma yolu: sezonsuz okulda tatil oluşturma reddedilir ("önce sezonu açın") **ya da** tarih hangi
sezona düşüyorsa ona bağlanır / sezon açılışında sezonsuz tatiller sezona devralınır; okuyucuların sezon
süzgeci tek kurala çekilir. Mevcut sezonsuz satırlar için veri düzeltmesi.
**Altınay notu:** deneme satırı (`432b4adc-…`) B3 sezon açılışında görünürlüğü ölçmek için bilerek
bırakıldı; C1'den önce silinmeli, yoksa 2–3 Kasım yoklamada tatil sayılır.

➕ **2026-09-16 · sezon açıldıktan sonra ölçüldü:** Altınay'da `2026-2027` sezonu açıldı; deneme satırı hâlâ
`academic_session_id = NULL` — sezon açılışı sezonsuz tatilleri devralmıyor. Ayar listesi sezon kimliğiyle süzdüğü için
kayıt görünmez kalıyor, takvim okuyucusu okul kimliğiyle okuduğu için yoklamada tatil sayılacak. Madde doğrulandı.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** Sezon artık **tatilin tarihinden** çözülüyor: yeni
`HolidaySeasonResolver` (tek kural, iki yazma yolu da onu çağırır). `Setup` sezon kabul (müdürün takvimi sezon
açılmadan doldurması doğal); **arşivlenmiş sezon reddedilir**; hiçbir sezona düşmüyorsa istek reddedilir —
`school-settings.errors.holiday.no-season-for-date`. Güncellemede tarih değişirse `Holiday.RebindSeason` ile bağ
tazeleniyor (yoksa taşınan tatil eski sezonda kalıp aynı maddeyi üretiyordu). Okuyucu tek kurala çekildi:
`HolidayCalendarReader` artık `AcademicSessionId != null` süzüyor — **müdürün göremediği kayıt devamsızlığı da
etkileyemez.** Göç `20260916015053_20260916_holiday_session_backfill` sezonsuz satırları tarihini kapsayan arşiv-dışı
sezona bağlıyor (resolver'la birebir aynı kural; hiçbirine düşmeyen `NULL` kalıyor, okuyucu onları zaten saymıyor).
Yan kazanç: aktif sezon varken *gelecek* sezona ait tarihe girilen tatil de artık doğru sezona bağlanıyor. Ayrıca
`CreateHolidayCommandHandler`'da yıllardır duran ve **her zaman `false` dönen** `IsDateInArchivedAcademicYear` stub'ı
silindi; sözlükteki `holiday.archived-year` anahtarı ilk kez gerçekten üretiliyor.
Ölçüm: dev DB'de sezonsuz canlı satır **1 → 0**; testler 4199 birim yeşil (28 yeni), `dotnet format` temiz.
**Altınay deneme satırı (`432b4adc-…`) silindi** — önce göçün yükleminin onu `2026-2027`'ye bağladığı önizlemeyle
doğrulandı, sonra SQL ile soft-delete edildi (müdür parolası bilinmediği için ürün yolu kullanılamadı); 2–3 Kasım
artık tatil değil, Altınay'ın diğer üç tatili bozulmadı. **C1 engeli kalktı.**
**Tuzak notu:** `dotnet ef database update --no-build` bayat DLL yükleyip `EXIT=0` ve "Done." dedi, hiçbir şey
yapmadan — göç assembly'de yoktu. Temiz derlemeyle tekrarlandı. Bu bayrak göç uygularken kullanılmamalı.

### `TB-177` · Tatil Takvimi resmî tatilleri yıl ve bitiş tarihine bakmadan birleştiriyor — her dini bayram 5 kez 🟡

Seed okulu `s1` (sezon 2026-09-15 → 2027-06-13) ile canlı ölçüldü: `GET school-settings/holidays?seasonId=…`
25 resmî kayıt döndürüyor; **Ramazan Bayramı, arifesi, Kurban Bayramı ve arifesi dörder değil beşer kez**
(ör. Ramazan Bayramı: 2027-02-04, 02-14, 02-26, 03-09, 03-19). Hepsinde `endDate = null`.

Neden: katalog (`master.official_holidays`) dini bayramları **yıla özgü satırlar** olarak tutuyor
(2026–2030, `year` dolu, `is_annual=0`, çok günlülerde `end_month/end_day`, arifede `is_half_day=1`).
`GetHolidaysQueryHandler:83-110` yalnız `Id, Name, Month, Day` seçip her satırı sezonun her yılına
yansıtıyor: `Year`, `EndMonth/EndDay`, `IsHalfDay`, `IsAnnual` yok sayılıyor. Böylece 2026, 2028, 2029 ve
2030'un bayram tarihleri de 2027'ye düşüyor; çok günlü bayram tek gün, arife tam gün görünüyor.

Yoklamanın okuduğu `HolidayCalendarReader:60`, `GetSchoolHolidaysForSession:46` ve
`GetOfficialHolidaysInRange:27` bu alanların hepsini okuyor — yani **devamsızlık hesabı doğru, müdürün
gördüğü tatil listesi yanlış.** Aynı kavramın iki birleştirme mantığı var.

⬜ Kapatma yolu: ayar listesi resmî tatilleri kendi döngüsüyle değil `HolidayCalendarReader`/ortak
çözücüyle üretir; tek kaynak.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** `GetHolidaysQueryHandler` kendi döngüsünü bıraktı,
yoklamanın okuduğu **aynı** `OfficialHolidayResolver.ResolveForRange`'i kullanıyor; çözücüye eksik alanlar taşındı
(`Id`, `IsAnnual`, `IsHalfDay`). Sözleşme: `HolidayDto` ve `HolidayCalendarDto` artık `isHalfDay` taşıyor (arife tipi
`PublicHoliday` kalıyor — `HalfDay` yazmak istemcinin kategori eşlemesini bozup arifeyi "düzenlenebilir" gösterirdi).
Canlı ölçüm (seed `s1`, önbellek temizlendikten sonra): **25 resmî kayıt → 9**, tekrar yok; Ramazan 8–11 Mart 2027,
Kurban 15–19 Mayıs 2027, arifeler yarım gün; `isRecurring` artık katalogdan (millî `true`, dinî `false`).
Arayüzde `countHolidayDays` yarım günleri saymıyor, yeni `formatHolidayDuration` arifeyi "Yarım gün" yazıyor
(web + mobil); core 605 test yeşil, typecheck ve lint temiz.
**Varsayım (onay bekliyor):** yan karttaki "Toplam N gün" *tam kapalı* gün sayısıdır, arife eklenmiyor (okul o gün
açık). 0,5 saymak da savunulabilirdi.

✅ **Karar (2026-09-16, kullanıcı) — varsayım DEĞİŞTİ:** yarım gün (arife) toplam süreye **0,5 gün** olarak
girer: `Toplam gün = tam gün sayısı + (yarım gün sayısı × 0,5)`. Kullanıcının koyduğu ayrım da yüzeye taşınacak:
**"kaç tarih tatil"** ile **"toplam tatil süresi"** aynı şey değildir (3 yarım gün = 3 kayıt ama 1,5 gün).
Gösterim Türkçe ondalıkla ("11,5 gün"). Uygulama `oksis-ui`'de yapılıyor.

✅ **Uygulandı — 2026-09-16 (commit bekliyor).** Çekirdek tek yerde: `holidayWeightsByDay()` takvim günü → ağırlık
haritası kuruyor (yarım gün 0,5, tam gün 1); **çakışan günler iki kez sayılmıyor, en yüksek ağırlık kazanıyor** (arifenin
üstüne okul tatili girilmişse o gün 1'dir, 1,5 değil). Dört soru dört ayrı alan oldu: kaç kayıt · kaç tarih · kaçı yarım
gün · toplam kaç gün süre (`countHolidayDates` yeni). Biçimlendirme tek yerde (`formatDayCount`): "11,5 gün", tam sayıda
",0" kuyruğu yok; `toLocaleString` kullanılmadı (core'un RN/Hermes gerekçeli mevcut kuralı). Yan kart artık "Tatil Günü
13 tarih · Yarım Gün 3 tarih · Toplam Süre 11,5 gün" gösteriyor, aynı üç satır mobil ekrana da eklendi (orada daha önce
hiç toplam yoktu). core 615 test yeşil (tatil mantığı 13 → 23), typecheck ve lint üç pakette temiz.
**Varsayım:** `isHalfDay` kayıt düzeyinde tek bir bayrak olduğu için çok günlü bir yarım gün kaydında bütün günler 0,5
sayılır; arife katalogda zaten kendi tek günlük kaydı olduğundan bu durum pratikte oluşmuyor.
**Altınay ekranında yeniden ölçüm yapılmadı** — müdür parolası bilinmiyor; aynı katalog ve çözücü Altınay'a da
uygulandığı için "Resmî 25 / Toplam 47 gün" sayaçlarının düzelmesi bekleniyor, uyanınca ekrandan teyit edilmeli.

➕ **2026-09-16 · Altınay ekranında ölçüldü** (sezon `2026-2027` açıldıktan sonra Ayarlar → Tatil Takvimi): "Resmî 25";
Ramazan Bayramı ve arifesi 3–4 Şubat, 13–14 Şubat, 25–26 Şubat, 8–9 Mart, 18–19 Mart; Kurban Bayramı ve arifesi 13–14 Nisan,
23–24 Nisan, 4–5 Mayıs, 15–16 Mayıs, 25–26 Mayıs. Doğrusu (MEB/İstanbul takvimi ve katalogun 2027 satırı) yalnız Ramazan
8–11 Mart, Kurban 15–19 Mayıs. Yan kartın **"Toplam 47 gün"** sayacı bu sahte satırlarla şişiyor.

### `E-26` · Ara tatil girilemiyor: okul oluşturamıyor, onu üreten kaynak da yok 🟡

Altınay saha testi (B2.4). Tatil ekranı "Resmî, ara tatil ve yarıyıl kayıtları MEB takviminden gelir
ve kilitlidir — yalnızca Okul kategorisi düzenlenebilir" diyor ve "Ara Tatil" çipi taşıyor. Ölçüm:
`HolidayType.IntermediateBreak` kilitli tip (`HolidaySourceClassifier`), okul oluşturamıyor; ama bu tipte
satır **üreten tek bir kod yok**. Yarıyıl tatili (`SemesterBreak`) yalnız sezon sihirbazında taslakta
tarih verilirse yazılıyor (`OpenSeasonFromDraftCommandHandler:307-335`); ara tatil için sihirbazda alan da
yok. Resmî tatil kataloğunda da ara tatil/yarıyıl kategorisi yok (yalnız `NATIONAL`/`RELIGIOUS`).

Sonuç: Kasım ve Nisan ara tatilleri OKSİS'e "ara tatil" olarak girilemiyor; "Ara Tatil" çipi her okulda
kalıcı olarak 0. Tek yol okul kategorisinde "kapalı gün" eklemek — bu da raporda ve takvimde yanlış tür.

➕ **Düzeltme (2026-09-15, B3):** "sihirbazda ara tatil için alan yok" ifadesi yanlıştı. Sihirbazın 4. adımında
serbest tatil listesi **var** ("Tatil Ekle"), ama yazılmıyor (`TB-178`). Ara tatilin doğal girişi bu liste;
`TB-178` kapanınca `E-26`'nın (a) seçeneği fiilen gerçekleşir. Ölçülen takvim (MEB 2026/68): 16–20 Kasım 2026 ve
8–12 Mart 2027 (2. dönem ara tatili Mart'ta, Nisan'da değil).

⬜ Ürün kararı bekliyor: (a) sezon sihirbazına ara tatil aralıkları eklenir; (b) MEB çalışma takvimi
(ara tatil + yarıyıl) yıllık katalog olarak platformdan beslenir; (c) okul ara tatili kendisi girebilir
(tip kilidi kalkar).

### `D-20` · Tatil Takvimi sezonsuz okulda: "— Sezonu", sabit "Aktif" rozeti, açılır açılmaz hata gösteren form 🟡

Altınay saha testi (B2.4), ekran görüntüsüyle ölçüldü.
- Kart başlığı "**— Sezonu Tatilleri**" (`holiday-tab.tsx:80,100`), yan kart "Sezon: —".
- "Sezon Özeti" rozeti koşulsuz yeşil **"Aktif"** (`holiday-tab.tsx:235`) — ortada sezon yokken.
- `useHolidays` sezon yokken hiç çalışmıyor (`enabled: Boolean(seasonId)`): resmî tatiller de gösterilmiyor,
  eklenen tatil de (`TB-176`).
- Boş durum "Tümü" seçiliyken de "**Bu kategoride** tatil kaydı bulunmuyor" (`:140-142`).
- "Yeni Okul Tatili" penceresi açılır açılmaz kırmızı "En az 2 karakter" ve "Başlangıç tarihi zorunludur"
  gösteriyor: ayar formlarına `D-09` ile getirilen "dokunulduktan sonra göster" kuralı pencere formunda yok.
  Çarpı yine sol üstte stilsiz (`D-19`).

⬜ Kapatma yolu: sezonsuz durum `TB-168`/`TB-173` ortak kararına bağlanır; `D-09` kuralı `AModal` formlarına
da uygulanır; rozet sezon durumundan türer.

➕ **2026-09-16:** sezon açıldıktan sonra başlık "2026-2027 Sezonu Tatilleri" oldu, ama sezon **`Setup`** iken "Sezon Özeti"
rozeti hâlâ **"Aktif"** — rozetin sezon durumundan türemediği canlı ölçüldü.

✅ **2026-09-16 · ekran ayağı kodda düzeltildi (gece turu, `oksis-ui`, commit bekliyor).** Rozet `sessionStatusBadge`
(`packages/core/src/academic-sessions/constants.ts`) ile sezon durumundan türüyor (`Setup` → "Hazır", sezon yoksa rozet
hiç çizilmiyor); boş durum ortak `EmptyState`/`AEmpty` `filtered` desenine geçti ("Tümü"nde artık "bu kategoride"
demiyor); **`D-09` kuralı merkezîleşti**: `AModal`/`ADrawer` bir `FieldRevealContext` sağlıyor, `AFld` hatayı blur ya da
gönderim denemesine dek gizliyor, yeni `ASubmit` geçersiz formda tıklanabilir ama istek atmıyor — derslik çekmecesindeki
yerel kopya da bu yola taşındı. Yan düzeltme: `Dialog` odağı `autoFocus`'tan çalıyordu, artık çalmıyor ve kapanışta açan
düğmeye dönüyor. "Toplam N gün" sayacı `countHolidayDays` ile farklı takvim günlerinin birleşimi (çok günlü aralık uçlar
dahil; yarım gün alanı sözleşmede yok, `TB-177` ile gelince tek dokunuş noktası). core 598 test yeşil.
**Kapsam dışı kalanlar:** "— Sezonu" başlığı ve sezonsuz görünüm (`TB-168`/`TB-173` kararı), sunucu ayağı
(`TB-176`/`TB-177`). **Canlı doğrulama borcu:** Chrome uzantısı bu turda sayfaya betik enjekte edemedi (bekleyen izin
istemi olabilir), ekran ölçümü kullanıcı uyanınca yapılmalı.

### `D-21` · Liste ekranları "hiç kayıt yok" ile "filtreyle eşleşme yok"u ayırmıyor (`D-10` yalnız ayarlarda uygulanmış) 🟡

Altınay saha testi (2026-09-15): kaydı olmayan okulda Öğrenciler ekranı, hiçbir arama/filtre yokken
"Sonuç bulunamadı · Arama veya filtre ölçütlerinizle eşleşen öğrenci yok · Filtreleri Temizle" gösterdi.
`D-10`'un kuralı yalnız ayarlara özel `AEmpty`'de (`features/settings/parts.tsx`); boş durum JSX'i Öğrenciler
(`students-page.tsx:235-254`), Öğretmenler (`teachers-page.tsx:288-307`), Veliler (`parents-page.tsx:193-213`)
ve Kullanıcılar/Davetler/Etkinlikler'de ayrı ayrı kopyalanmış, hepsi koşulsuz "Sonuç bulunamadı". Envanterde
`EmptyState` hâlâ `⬜ planned`. Liste arama kutularında erişilebilir etiket yok.

Aynı denetimde ürün kararı bekleyen veli ekranı noktaları (düzeltmeye alınmadı): arama placeholder'ı
"telefon" ve "öğrenci" vaat ediyor ama `ListPersonsQueryHandler:55-76` telefonla ve öğrenci→veli yönünde
aramıyor; "Yakınlık" ve "Sınıf" filtreleri sunucuya gitmiyor, yalnız ekrandaki sayfada süzüyor.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-15):** `apps/web/components/shared/empty-state.tsx`
(`filtered` sözleşmesi, `page`/`compact` varyantı, yeni CSS yok). Yedi ekran geçti: Öğrenciler, Öğretmenler,
Veliler, Kullanıcılar, Davetler, Etkinlikler, Dağıtım Kısıtları. Ayarların `AEmpty`'si artık onun ince sarmalayıcısı.
Arama kutularına `aria-label`. Envanterde `EmptyState` ✅, `bilesen-ve-stil-kurallari.md` §5 güncellendi.
Web `tsc`/`eslint`/`prettier` temiz. Tarayıcıda Altınay'da (kayıt yok) ölçüldü: Öğrenciler "Henüz öğrenci
kaydı yok · Yeni Öğrenci", Veliler "Henüz veli kaydı yok", filtre temizle düğmesi yok; Veliler'de arama
("zzqx", 300 ms debounce sonrası) "Sonuç bulunamadı · Filtreleri Temizle" dalına geçti.
Aynı düzeltmede kapanan iki yan hata: Etkinlikler "Yaklaşan" sekmesi boşken sezonda etkinlik olsa da
"Bu sezonda etkinlik tanımlanmamış" diyordu; Davetler davet yokken temizlenemeyen filtre dalına düşebiliyordu.

➕ **Ölçülmemiş aday:** `apps/web/features/attendance/session-roster-page.tsx:487` `visible.length === 0`'da filtre
olup olmadığına bakmadan "Öğrenci bulunamadı · Filtreleri Temizle" çiziyor. Döküm hiç öğrenci tutmuyorsa
aynı `D-10` ihlali; C1.1 yoklama testinde ekranda ölçülecek.

### `ENG-03` · İlk sezon açılamıyor — kaynak sezon altı katmanda zorunlu 🟠

Altınay saha testi (B3.1, 2026-09-15). Platformdan açılan, hiç sezonu olmayan okulda müdür sihirbazı
kaynak sezon seçmeden doldurdu; `PUT season-drafts/current` **400**:
`$.sourceSessionId: The JSON value could not be converted…` (gövdede `"sourceSessionId": ""`).
**Her yeni okulun ilk sezonu açılamıyor** — seed okullarında sezon hep önceden var olduğu için hiç görünmedi.

Kaynak sezonu zorunlu tutan katmanlar (`oksis-api` @ `60e65caf`, `oksis-ui` @ `1bf6a51`):

| Katman | Yer |
|---|---|
| Sihirbaz | `wizard.tsx:186` "Kaynak Sezon *", `:189-197` yalnız mevcut sezonları listeleyen `<select>` |
| Taslak yükü | `packages/core/src/academic-sessions/logic.ts:593` boş dizeyi aynen yolluyor |
| Komut | `SaveSeasonDraftCommand` `Guid SourceSessionId` (boş olamaz) → model binding 400 |
| Doğrulayıcı | `SaveSeasonDraftCommandValidator:17` `NotEmpty` |
| Domain | `SeasonDraft.Create:54`, `UpdateProgress:83` `Guid.Empty` → istisna |
| DB | `SeasonDraftConfiguration:21` `IsRequired`, `academic.season_drafts.source_session_id NOT NULL` |

Açılış işleyicisi de kaynağı varsayıyor: `CopyBranches=true` ve harita boşsa şube haritasını kaynak sezondan
hesaplıyor (`OpenSeasonFromDraftCommandHandler:170-190`) → kaynaksız okulda "Şube haritası boş" hatası.

⬜ Kapatma yolu: kaynak sezon isteğe bağlı (`Guid?`, göç); kopyalama bayraklarından biri açıksa zorunlu
(doğrulayıcı + domain); sihirbazda kaynak yokken kopyalama anahtarları kapalı ve devre dışı.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-16):** `oksis-api` dalı `fix/ilk-sezon-acilisi` + `oksis-ui` dalı
`fix/davet-olu-riza-anahtarlari`. `SeasonDraft.SourceSessionId` `Guid?`; kural tek yerde
(`SeasonDraft.RequiresSourceSession`: kopyalama bayrağı açıksa kaynak zorunlu, `Guid.Empty` reddedilir); doğrulayıcı
aynı kuralı okuyor; göç `20260915203011_20260915_season_draft_source_optional` dev DB'ye uygulandı (kolon nullable,
`has-pending-model-changes` temiz). `OpenSeasonFromDraft` kaynağa dayanan dalları kaynak yokken çalıştırmıyor
(`source-required`). Aktivasyon (`ActivateSeasonRollover`, `PromoteStudents`, `SetupSeasonReverter`) taslağın kaynağını
okumuyor — değişiklik gerekmedi. `generated/schema.ts` elle düzenlendi; canlı API'den üretilen şemayla karşılaştırıldı,
yalnız satır bölme farkı var.
Doğrulama: `dotnet build` 0 · `test-changed.sh` 0 (Domain 1067 · Application 2658 · Api 435 · mimari 7) ·
entegrasyon `--filter Draft` 77/77 · web/core/api `tsc` 0 · core vitest 559/559 · api vitest 6/6 · eslint/prettier 0.
API yeniden başlatıldı; tarayıcıda Altınay'da ölçüldü: sihirbaz "Kaynak yok · İlk sezon", açılır listede "Kaynak sezon yok
(ilk sezon)", 1. adımın beş kopyalama anahtarı kapalı + soluk + "Kaynak sezon seçilmedi — kopyalanacak önceki sezon yok".
Kapanış: müdürün sihirbazla sezonu uçtan uca açması (B3.1).

✅ **Uçtan uca ölçüldü (2026-09-16):** Altınay müdürü kaynak sezonsuz sihirbazı doldurdu, sezon açıldı. DB: `2026-2027`
`Setup` (14.09.2026–25.06.2027), iki dönem `NotStarted` (14.09.2026–22.01.2027, 08.02.2027–25.06.2027), taslak
`source_session_id=NULL`, kopyalama bayrakları 0, `opened_session_id` sezona bağlı; şube/kayıt 0. Başlangıcın geçmiş tarih
olması engel olmadı. Arşive taşıma: merge sonrası.

### `TB-178` · Sihirbazda girilen okul tatilleri sezon açılınca hiç yazılmıyor; liste "kopyala" anahtarına bağlı 🟠

Altınay saha testi (B3). Sihirbazın 4. adımında "Tatil Ekle" ile satır girilebiliyor (müdür 1. ve 2. dönem ara
tatillerini girdi) ve satırlar taslağa `HolidaysJson` olarak kaydediliyor. Ama **`HolidaysJson`'u okuyan tek bir
kod yok**: `grep` yalnız domain alanı, DTO, komut ve kaydetme işleyicisini buluyor; `OpenSeasonFromDraftCommandHandler`
yarıyılı (`TermDates.BreakStart/End`) ve `CopyHolidays` ile kaynak sezonun okul tatillerini yazıyor, listeyi hiç
okumuyor. Girilen tatiller sezon açılınca sessizce kaybolur.

İkinci kusur: liste ekranda ve yükte "Okul tatillerini kopyala" anahtarına bağlı (`wizard.tsx:493`
`{form.copyHolidays && …}`, `logic.ts:581-582`). Kopyalanacak önceki sezonu olmayan okul, kendi tatilini girmek için
anlamsız bir "kopyala" anahtarını açmak zorunda.

⬜ Kapatma yolu: açılış işleyicisi `HolidaysJson` satırlarını yeni sezona bağlı `Holiday` olarak yazar; liste
kopyalama anahtarından ayrılır.

✅ **Karar (2026-09-15, kullanıcı):** sihirbaz tatilleri **`IntermediateBreak` (Ara Tatil), kilitli** olarak yazılır;
Tatil Takvimi'nde "Ara Tatil" çipinde görünür, ayarlardan düzenlenmez.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-16):** `OpenSeasonFromDraftCommandHandler` 8c adımı `HolidaysJson`'u okuyor:
adı/başlangıcı boş satır atlanır, bitiş boşsa tek gün; okunamayan tarih `holidays-invalid`, bitiş < başlangıç
`holiday-range-invalid`, sezon dışı `holiday-outside-session` (mesaj tatil adını içerir); geçerli satır
`IntermediateBreak` ve yeni sezona bağlı yazılır; yarıyılla aynı aralık ikinci kez yazılmaz; `holidays:reader:{schoolId}`
önbelleği temizlenir. Sihirbazda liste kopyalama anahtarından bağımsız ve "Ara Tatil olarak yazılır" diyor.
Entegrasyon testleri: iki satır `IntermediateBreak` + doğru sezon; sezon dışı tarih reddi. Kalan not: adı boş ama tarihi
dolu satır sunucuda sessizce atlanıyor, istemcide satır doğrulaması yok.

✅ **Uçtan uca ölçüldü (2026-09-16):** Altınay sezon açılışında `academic.school_holidays`: "1. Ara Tatil" 16–20.11.2026 ve
"2. Ara Tatil" 08–12.03.2027 `IntermediateBreak`, "Yarıyıl Tatili" 25.01–05.02.2027 `SemesterBreak` — üçü de yeni sezona
bağlı. Arşive taşıma: merge sonrası.

### `D-22` · Sezon sihirbazı: kaynaksızken kopyalama anahtarları açık, kilitli anahtar kilitli görünmüyor, tarih doğrulaması kopyalamaya bağlı 🟡

Altınay saha testi (B3).
- **Kopyalama anahtarları:** kaynak sezon yokken de 1. adımdaki "Kopyalanacak Bağlam" anahtarları, 2. adımdaki
  "Önceki sezonun dönem yapısını kopyala", 4. adımdaki "Okul tatillerini kopyala" ve 5. adımdaki "Öğretmen
  görevlendirmelerini kopyala" açılabiliyor (`wizard.tsx:201-213`, `:270-276`, `:486-490`, `:578-583`). Varsayılanda
  `copyBranches` ve `copyHolidays` açık (`logic.ts:533`).
- **Kilitli anahtar:** 5. adımda "Aktif öğrencileri terfi ettir" `on locked` sabit (`wizard.tsx:565-570`); `SznToggle`
  `.locked`/`.lock` sınıfı ekliyor ama bu sınıflar için CSS kuralı yok — anahtar tıklanabilir görünüyor, değişmiyor.
  İlk sezonda "0 aktif öğrenci için yeni sezon kaydı… 0 öğrenci mezun edilir" şeridi de anlamsız.
- **Tarih doğrulaması:** `next()` ve `submit()` dönem tarihlerini yalnız `form.copyTerms` açıkken doğruluyor
  (`wizard.tsx:747`, `:781`). Tarihleri elle giren okulun hatalı tarihi istemcide yakalanmıyor.

⬜ Kapatma yolu: kaynak yokken kopyalama anahtarları kapalı + devre dışı + açıklamalı; kilitli anahtar stili;
tarih doğrulaması koşulsuz.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-16):** kaynak yokken 1./2./3./4./5. adımlardaki kopyalama ve terfi anahtarları
kapalı + `disabled`/`aria-disabled` + açıklamalı; kaynak kaldırılınca bayraklar `false`'a çekilir (`sourceSessionPatch`);
`SznToggle` devre dışı görünümü (`screens.css` `.szn-toggle` bölümü, soluk + `not-allowed`); dönem tarihi doğrulaması
`next()` ve `submit()`'te koşulsuz; kaynak yokken terfi önizlemesi çağrılmıyor; 5. adım ilk sezon şeridi ("öğrenciler sezon
açıldıktan sonra Öğrenciler ekranından aktarılır", `E-27` geçici). 1. adım tarayıcıda ölçüldü. Kalan not: kaynaksızken
"Pasif öğrencileri hariç tut" ekranda kapalı görünse de yükte `true` gidiyor (kopyalama bayrağı değil, aktivasyon zaten
pasifleri hariç tutuyor).

### `E-27` · İlk sezonda sihirbazın Öğrenciler adımı işlevsiz 🟡

Altınay saha testi (B3). Kaynak sezonu olmayan okulda 5. adım yalnız terfi ve görevlendirme kopyalama anahtarlarını
gösteriyor; hepsi önceki sezonu varsayıyor. Kullanıcının beklentisi: ilk sezonda bu adımda öğrencilerin Excel'den
yüklenmesi.

✅ **Karar (2026-09-15, kullanıcı):** ilk sezonda sihirbaza **Excel ile öğrenci yükleme adımı** eklenir. Ayrı iş olarak
tasarlanır (sezon henüz yokken kayıt/şube sırası çözülmeli). Geçici: `ENG-03` düzeltmesinde 5. adım kaynaksız sezonda
kopyalama anahtarlarını devre dışı bırakıp öğrencilerin sezon açıldıktan sonra aktarılacağını söyler; Altınay öğrencileri
B7'de yüklenir.

### `B-52` · Sezon sihirbazı tarih yazılırken resmî tatil sorgusunu her tuşta, yarım yılla atıyor (422 seli) 🟡

Altınay saha testi (B3, 2026-09-16), müdürün DevTools ekran görüntüsüyle: 2. dönem bitişi yazılırken
`GET official-holidays?start=2026-09-14&end=0002-06-25`, `…0020-06-25`, `…0202-06-25` istekleri tekrar tekrar
**422**, sonunda `…2027-06-25` 200. Tarayıcının `<input type="date">`'i yıl yazılırken biçimce geçerli ara değerler
bildiriyor; `useOfficialHolidays` yalnız "değer boş değil" kapısıyla (`enabled: Boolean(start) && Boolean(end)`)
çalışıyor, sihirbaz iki yerde (`Step4` ve sihirbaz gövdesi) ham form tarihini veriyordu.

🔄 **Kodda düzeltildi, merge bekliyor (2026-09-16, `oksis-ui` dalı `fix/davet-olu-riza-anahtarlari`):**
- `packages/core/src/date/tr-date.ts`: `isCompleteIsoDate` (YYYY-MM-DD, 1900–2999, takvimde var olan gün) ve
  `isIsoDateRange`; testleri `iso-date-validity.test.ts`.
- `packages/api` `useOfficialHolidays` `enabled: isIsoDateRange(start, end)` — kapı kancada, iki çağrı yeri birden.
- `packages/ui/src/hooks/use-debounced-value.ts`: paylaşılan `useDebouncedValue` (paketin ilk kancası); sihirbaz iki
  çağrıda tarihleri 400 ms gecikmeli veriyor.
- Doğrulama: core/api/ui/web `tsc` 0 · core tarih testleri 14/14 · eslint 0 · prettier 0. Tarayıcıda Altınay'da ölçüldü:
  bitiş `25062027` tuş tuş yazıldı → **tek istek**, `end=2027-06-25`, 200.
- Aday (düzeltilmedi): veliler araması kendi `setTimeout` debounce'unu yazıyor (`parents-page.tsx:45-48`); paylaşılan
  kancaya geçirilebilir.

### `TB-179` · Sezon aktifleşince tarihi gelmiş dönem başlamıyor — topbar "1. Dönem", sunucu "yürürlükte dönem yok" 🟡

Altınay saha testi (B3.3, 2026-09-16). Müdür sezonu aktifleştirdi (`ActivateSeasonRollover` 200, günlükte hata yok): sezon
`Active`/`is_current=1`, taslak silindi, müdürün sezonsuz `SCHOOL_ADMIN` ataması aktif. Ama iki dönem de **`NotStarted`**
kaldı — 1. dönemin başlangıcı (14.09.2026) iki gün önce geçmiş olmasına rağmen.

Dönem durumu tasarım gereği yöneticinin elinde: `AcademicTerm.Activate` yalnız `ActivateAcademicTermCommandHandler:40`'tan
çağrılıyor (`POST academic-sessions/{sessionId}/terms/{termId}/activate`, web Sezon Yönetimi'nde "… etkinleştirilsin mi?"
onayı). Kusur iki yerde:

| Yüzey | Dönemi nasıl çözüyor | Altınay'da bugün |
|---|---|---|
| Topbar seçici (`season-context-picker.tsx:114-148`, `resolvePlanningTerm` `logic.ts:69-85`) | **Tarih aralığı** | "2026-2027 · **1. Dönem**" |
| `GetCurrentSessionQueryHandler:38-42` | **`Status == Active`** | `CurrentTerm: null` |
| Yoklama `AttendanceTermResolver:89` | **`Status == Active`** | Dönem yok → yoklama dönem çözemez |

Sonuç: müdür topbar'da "1. Dönem"i görüp dönemin yürürlükte olduğunu sanıyor; sunucu ve yoklama ise dönem yok diyor. Sezon
aktivasyonu, başlangıç tarihi geçmiş dönemi etkinleştirmeyi ne öneriyor ne hatırlatıyor. Seed okullarında dönemler seed'le
`Active` geldiği için görünmüyordu.

⬜ Kapatma yolu (ürün kararı): (a) sezon aktivasyonunda başlangıcı geçmiş dönem otomatik `Active` olur; (b) aktivasyon
sonrası ve panoda "1. dönemi başlatın" uyarısı; (c) dönem çözümü tek kurala çekilir (topbar da `Status` okur ya da sunucu da
tarih okur) — iki gerçek kalmamalı.

✅ **Karar (2026-09-16, kullanıcı): (a) otomatik başlatma.** Sezon aktifleşirken başlangıç tarihi gelmiş dönem
kendiliğinden `Active` olur; müdürün ek adımı kalmaz ve topbar ile sunucu aynı şeyi söyler. Elle etkinleştirme
yolu duruyor (erken ya da geç başlatmak isteyen okul için). Kural `ActivateAcademicTerm`'ün iş kuralıyla ortak bir
yere çekilecek, kopyalanmayacak; gün kararı okul yerel takviminden okunacak. Altınay'ın 1. dönemi sezon zaten
`Active` olduğu için yeni kuralın dışında kalıyor, ayrıca onarılacak. Uygulama sürüyor.

✅ **(a) uygulandı — 2026-09-16 (commit bekliyor).** Kural tek yerde: yeni `AcademicSessions/Shared/AcademicTermStarter.cs`
(`SetupSeasonReverter` kalıbı; `SaveChanges` çağırmaz). **Elle etkinleştirme yolu da artık aynı çekirdeği çağırıyor**,
yani ön koşullar, idempotanslık ve olay yayını tek yerde. Sezon aktifleşirken yalnız **bugünü kapsayan** dönem başlar;
bitmiş dönem `NotStarted` bırakılır — `Close()` yalnız `Active` dönemde çalışıyor ve `AcademicTermClosedEvent` ile
**otomatik karne üretimini** tetikliyor (BR-AS-009), yani hiç işlenmemiş dönemi kapatmak karne üretmek olurdu. Sezonda
zaten aktif bir dönem varsa dokunulmaz; kapsayan dönem `Closed` ise aktivasyon hata vermez. Gün okul-yerel
(`ISchoolCalendarService.GetLocalNowAsync`), sunucunun UTC günü değil. 13 yeni test (UTC'de hâlâ dünken okul gününde
dönemin başladığı vakası dâhil); Application 2721 · Api 444 · Domain 1072 yeşil.

**Altınay düzeltmesi:** 1. dönem zaten `Active` idi — SQL'de `updated_by` müdürün kimliği, damga 2026-09-15 21:58 UTC,
yani **kullanıcı ürünün kendi komutuyla elle başlatmıştı**. Göç ya da elle veri düzeltmesi gerekmedi; Redis
`current-session` anahtarı yine de temizlendi.

⬜ **Açık kalan iki ayak:**
1. **2. dönem kendiliğinden başlamıyor.** Ölçüldü: Hangfire'daki 18 yinelenen işin hiçbiri sezon/dönem yaşam
   döngüsüne dokunmuyor ve mevcut bir işe iliştirmek yanlış sahiplik olurdu (`ExamDailySweepJob` sınav modülünün işi).
   Doğru çözüm aynı iskelette ~60 satırlık kardeş bir günlük süpürme işi; gövdesi yine `AcademicTermStarter`.
   O gelene kadar 2. dönem elle başlatılır. Diğer okullarda da bayat dönem durumu var (`DEV-OKUL`, `ATA-AL`, `TST-AL`).
2. **(c) iki gerçek sürüyor:** topbar dönemi tarih aralığından, sunucu `Status`'tan çözüyor. Bu düzeltme ikisini
   *aktivasyon anında* hizalıyor, kalıcı olarak birleştirmiyor — 8 Şubat 2027'de topbar "2. Dönem" derken sunucu hâlâ
   1. dönemi aktif görecek.

### `TB-191` · Ders kataloğu GLOBAL — okul yöneticisinin ders eklemesi bütün okullara yansıyor 🔴

Altınay B4 ölçümünde çıktı (2026-09-16). `POST /api/v1/academics/subjects` okul yöneticisinin izniyle
(`school-settings.update-academic-structure`, `[Tenancy(Required)]`) korunuyor — **ama handler `master.subjects`'e
yazıyor.** Tablo `school_id` taşımıyor (`Subject : MasterEntity`), tenant süzgeci yok, ders kodu benzersizliği
(`ux_subjects_code`) **global**. Aynı durum güncelleme, silme ve durum değiştirme uçlarında da geçerli;
`UpdateSubjectCommandHandler`'ın kendi yorumu bunu kabul ediyor: *"Subject GLOBAL master olduğundan tenant
filtresi yok."*

Sonuçları:
- Bir okulun müdürü ders eklerse **bütün tenantlar** o dersi görür; pasifleştirirse **hepsinden** kalkar.
- Bir okul "MAT" kodunu aldıysa başka okul aynı kodu **kullanamaz**.
- Platform tarafında katalog yönetimi için ayrı bir uç **yok**, yani bu yetki başka yere taşınmış da değil.

Tenant ihlali deponun kırmızı çizgisidir (`CLAUDE.md`); üstelik bu, izin kapısının doğru ama **veri sahipliğinin
yanlış** olduğu bir sınıf — `TB-139`'un kardeşi.

⬜ Kapatma yolu: ders kataloğu ya okul kapsamına taşınır (master satırları çekirdek, okul kendi satırını ekler —
branşlardaki `school.branches` + `import-meb` deseni birebir emsal) ya da yazma uçları okul yöneticisinden alınıp
platform yüzeyine taşınır. Karar verilmeden uçlar açık bırakılmamalı.

✅ **Karar (2026-09-16, kullanıcı): okul kapsamına taşınır.** Master katalog **çekirdek** olarak kalır, okul kendi
dersini kendi tablosuna ekler, içe aktarımla başlar — yani branşlardaki desenin aynısı. Gerekçe: okulun kendi
dersini ekleme ihtiyacı gerçek (Altınay'ın edebiyat ve müzik dersleri `TB-192` yüzünden katalogda yok) ve yazma
yetkisini platforma almak o ihtiyacı karşılamazdı. Ders kodu benzersizliği **okul içine** iner.
**Bu karar `TB-192`'yi de güvenli kılıyor:** eksik dersleri eklemek artık başka okulları etkilemeyecek.
Uygulama sürüyor; mevcut kataloğun okullara devri göçle yapılacak — hiçbir okul ders kaybetmemeli.

✅ **Kapandı — 2026-09-16 (commit edildi ve push edildi).** Master katalog `MasterSubject` olarak **çekirdek**
kaldı (tablo, satırlar, kimlikler, seed aynen; `subject_branches` ve `curriculum_hour_templates` dokunulmadan
geçerli kaldı); `Subject` artık tenant varlığı, benzersizlik **okul içine** indi.
**Branş emsalinde olmayan ayak:** kademe eşlemesi de tenant'a taşındı — eski kod onu master'da **tam-replace**
ediyordu, yani bir okulun kademe düzenlemesi bütün okulların eşlemesini siliyordu. Sızıntının en sessiz ayağı buydu.
**Düzenlenebilirlik bilinçli olarak branştan ayrışıyor:** branşta MEB satırı tamamen kilitli, derste yalnız katalog
kimliği donduruldu (kod/ad/kategori/seçmelilik); sıra, açıklama, kademeler, aktiflik ve silme okulun kararı —
aksi hâlde içe aktarılan 21 dersin hepsi kalıcı kilitlenir ve okul kendi kataloğunu düzenleyemezdi. Kural
handler'da değil **domain'de**.
**Merkezî çözüm:** veri kümesi adı korunduğu için dersi okuyan **45 sorgu değişmeden** tenant süzgecine girdi;
çekirdek kimlikte kalan iki tablo için çeviri tek yerde toplandı, sekiz çağrı yeri ona bağlandı ve bir bekçi
çevirisiz okumayı yasakladı.
**Göç üretilirken EF'in iki kusuru yakalandı:** bir yapılandırma satırı eski tipi işaret ettiği için master
tablosunun yabancı anahtarı **sessizce okul tablosuna kaydırılıyordu**, ve `Down()` `Up()`'ın hiç dokunmadığı bir
kısıtı düşürüyordu. İkisi de düzeltildi — üretilen göç okunmadan uygulansaydı şema sessizce bozulacaktı.
**Ölçüm:** altı okulun her birinde **21 ders** (Altınay dahil), okul tablosunda 126 ders + 816 kademe eşlemesi,
master tabloları değişmedi, **çapraz tenant satır 0**, hiçbir okul ders kaybetmedi.
**Kanıt testleri:** gerçek SQL Server'a karşı 6 tenant izolasyon testi — bir okulun dersi öbüründe **görünmüyor**,
iki okul **aynı kodu kullanabiliyor**. Mimari bekçiler 11/11, ders süzgeçli 71 birim testi, arayüzde 314 test.
**Bonus:** katalog artık tenant varlığı olduğu için önbellek temizleme kapısından geçiyor; eskiden hiçbir yazma o
anahtarı düşüremiyordu, tek emniyet 24 saatlik ömürdü.
➕ Arayüzde iki gerçek hata çıktı: ders yönetimi ekranı **arama ucunu** çağırıp yönetim verisi sanıyordu (gerçek
API'de bütün dersler pasif ve seviyesiz görünecekti; yalnız zengin mock verisi gizliyordu) ve aynı kanca ders
programı editörünü de besliyordu — hepsini yönetim ucuna yöneltmek o ekranı 403'e düşürürdü.

➕ **Push kapısı üç testi yakaladı — ve kırılma öğretici.** Ders süzgeçli koşu (71/71) yeşildi ama **tam takım
kırmızıydı**: süzgeç, çeviriyi *tüketen* müfredat saat testlerini adı eşleşmediği için hiç koşturmuyordu.
Asıl mesele eksik sahtelik değildi: testler şablona ve okul override'ına **aynı ders kimliğini** veriyordu, yani
çevirinin köprü kurduğu iki kimlik uzayını hiç ayırmamışlardı — **o hâlleriyle çeviri tümüyle silinse bile
geçerlerdi.** Kurulum gerçeğe uyduruldu (okulun ders satırı kendi kimliğiyle ve çekirdek bağıyla kuruluyor),
beklenen değerler gevşetilmedi ve çeviri **sahtelenip atlanmadı** — atlansaydı bu maddenin kapattığı "override
sessizce yok sayılır" hatası bir daha hiç yakalanamazdı. Sonuç: Application 2827/2827, Api 448, Domain 1094,
bekçiler 66/66. Bu, `TB-184`/`TB-187`/`TB-190` ailesinin dördüncü örneği: **dar süzgeç, yeşil görünen gerçek.**

### `TB-192` · Lise müfredatında Türk Dili ve Edebiyatı yok; saat şablonu kendini "doğrulanmadı" ilan ediyor 🟠

Altınay B4 ölçümünde çıktı (2026-09-16). `master.curriculum_hour_templates` lise için 9–12 × 11 ders taşıyor,
her kademe toplam **30 saat**. Ama:
- **Türk Dili ve Edebiyatı katalogda yok.** Yalnız `TR` "Türkçe" var ve o **1–8**'e bağlı. Aynı şekilde **Müzik ve
  Görsel Sanatlar da yalnız 1–8**'de. Yani Anadolu Lisesi'nin edebiyat ve müzik öğretmenine verilecek ders
  katalogda **bulunmuyor**.
- Her satırın `meb_decision` sütunu **"Doğrulanmadı — MEB çizelgesi bekleniyor"** diyor; şablon kendi doğruluğunu
  garanti etmiyor. Toplam 30 saat duruyor, MEB ortaöğretim çizelgesinin 2026–2027 kırılımı **doğrulanmalı**.

Belirtisi somut: Altınay ders kataloğunu ekrandan tamamlamak zorunda kalacak — ve bugün o ekleme `TB-191`
yüzünden bütün okulları etkiliyor.

⬜ Kapatma yolu: lise müfredat şablonu MEB çizelgesine göre tamamlanıp doğrulanmış olarak işaretlenir; eksik
dersler kademe eşlemeleriyle birlikte katalogda yerini alır.

### `TB-193` · Platformdan açılan okulun branş kataloğu boş doğuyor 🟠

Altınay B4 ölçümünde çıktı (2026-09-16). Altınay `school.branches` = **0 satır**; seed okullarının her birinde
15 satır var. Sebep ölçüldü: `SchoolCreated` akışı **kademeleri tohumluyor ama branşları tohumlamıyor**; seed'deki
15 satır dev seeder'dan geliyor, açılış akışından değil. `PLT-DOGRULAMA`'da da 0 satır — yani **platformdan açılan
her okul** branşsız doğuyor.

Etkisi zincirleme: branş olmadan öğretmene branş atanamaz, branşsız öğretmene de görevlendirme yapılamıyor
(`assignments.teacher-no-branch`). Yani kusur B6'da değil, **B9'da** patlıyor.

İyi haber: branş tarafı ders tarafının tersine doğru kurgulanmış — `school.branches` tenant kapsamlı ve
**`POST /api/v1/branches/import-meb`** idempotent toplu aktarım var.

⬜ Kapatma yolu: `SchoolCreated` branşları da tohumlasın (MEB içe aktarımının aynısını açılışta çalıştırmak
yeterli). Mevcut boş okullar için backfill.

✅ **Karar (2026-09-16, kullanıcı): Altınay'ın engeli ürünün kendi yolundan kalkacak** — kullanıcı "MEB branşlarını
içe aktar" düğmesini **ekrandan kendisi** kullanacak, Rehberlik'i de elle ekleyecek. Gerekçe: saha testinin amacı
gerçek kullanıcı yolunu ölçmek; veriyi arkadan doldurmak o ölçümü yok ederdi.
⬜ **Madde açık kalıyor:** açılış akışı hâlâ branşları tohumlamıyor, yani **bundan sonra açılan her okul** yine
branşsız doğacak. Kalıcı düzeltme (açılışta tohum + mevcut boş okullara backfill) sıradaki turlarda yapılacak.

### `TB-194` · Müfredat saat kataloğu okulun kademelerini yok sayıyor 🟡

Altınay B4 ölçümünde çıktı (2026-09-16). `GetCatalogWeeklyHoursQueryHandler` bütün `subject_grade_levels`
satırlarını okuyup ders başına **global** min–max veriyor; okulun `school_grade_levels` listesi süzgeç olarak
kullanılmıyor ve uçta `gradeLevelCode` parametresi **tanımlı bile değil** (gönderilse sessizce yok sayılır).

Canlı ölçüm (lise okulu): katalog **Türkçe 5, Fen Bilimleri 4, Sosyal Bilgiler 3, Müzik, Görsel Sanatlar** döndü —
hepsi ortaokul satırları. Yani Ders Kataloğu ekranı lisede ortaokul saatlerini gösteriyor.

⬜ Kapatma yolu: katalog sorgusu okulun kademe listesiyle süzsün; kademe parametresi ya sözleşmeye girsin ya da
kaldırılsın (bugün ikisi de değil).

✅ **Kapandı — 2026-09-16 (commit edildi, `6cefeed8`).** Sorgu okulun aktif kademe listesiyle süzüyor;
`TB-191`'in çeviri katmanı olduğu gibi kullanıldı, **ikinci bir çeviri yazılmadı**. Kademe parametresi
**sözleşmeye alındı** (kaldırmak seçenek değildi: tanımlı değildi ama gönderilince sessizce yok sayılıyordu);
artık gerçekten süzüyor ve okulun listesinde olmayan kod boş liste döndürüyor. 2 yeni test.
➕ **Kusurun neden fark edilmediği kayda değer:** gösterilen sayılar "yanlış" değildi, **başka okul türünün doğru
sayılarıydı** — lise ekranında ortaokul saatleri. Yanlış veri değil, yanlış bağlam.

### `TB-195` · Sınav türü kataloğu global ve okul tarafından değiştirilemiyor 🟠

Altınay B4 ölçümünde çıktı (2026-09-16). `master.exam_types` 8 satır ve `ExamType : MasterEntity` — `school_id`
yok. Okulun kendi sınav türünü eklemesi için komut ya da uç **yok**; tür yalnız master tabloya satır eklenerek
doğuyor.

**Canlı kanıt:** `VZ5` "3. Sınav" 2026-09-12'de **bir seed okulu için elle** eklenmiş; tablo global olduğu için o
satır bugün **Altınay'da da duruyor**. Yani Altınay 2. dönemde üç yazılı görüyor, kimse istemeden.

`TB-191` ile aynı sınıf: katalog global, yazma yolu ya yanlış yerde ya hiç yok.

⬜ Kapatma yolu: sınav türleri okul kapsamına taşınır (master çekirdek + okul eklemesi) ya da değiştirme yetkisi
açıkça platforma verilir. Global tabloya elle satır eklemek bugün **bütün okulların** sınav yapısını değiştiriyor.

✅ **Katalog ayağı kapandı — 2026-09-16 (commit edildi, `6cefeed8`).** `TB-191`'in deseni birebir uygulandı:
çekirdek tablo, satırları ve kimlikleri **aynen** korundu; okul kapsamlı tablo geldi, benzersizlik okul içine
indi, içe aktarım tek yerde ve açılışta tohumlanıyor (`TB-193` dersi: dev okulları ham SQL'le doğduğu için o yola
da bağlandı). **Tip adı ve oluşturma imzası korunduğu için türü okuyan ~20 sorgu değişmeden** tenant süzgecine
girdi.
**Çeviri katmanı gerekmedi ve gerekçesi yazıldı:** türü anahtarlayan iki tablonun ikisi de tenant tablosu, göç
onları okulun kimliklerine çevirdi — yani iki kimlik uzayı ürün kodunda bir arada yaşamıyor. Derste çeviri şarttı
çünkü orada iki **platform** tablosu çekirdek kimlikte kalmıştı.
Göç ölçümü: altı okulun her birinde **8 tür** (Altınay dâhil), çekirdek 8 satır kaldı, 4 sınav penceresi ve 18
değerlendirme kendi okulunun satırına bağlandı, **çapraz tenant satır 0**.

✅ **Yönetim ayağı da kapandı — 2026-09-16.** Dört komut + liste sorgusu (`ExamsController` üzerinde, yeni izin
yok: okuma `school-settings.view`, yazma `school-settings.update-academic-structure`). Pencere formunun listesi
**dokunulmadı**; yönetim listesi ondan üç noktada bilinçli ayrılıyor (pasif türler görünür, dönemsiz türler
görünür, kullanılan tür düşmez) — yönetim listesi bir seçim kutusu değil, kataloğun kendisi.
**Çekirdek–okul ayrımı:** `IsMasterSourced` satırda `Code`, `Name` **ve `TermOrder`** donuk; `DisplayOrder`,
`Description`, `IsActive` ve silme okulun kararı. Dönemin de donması `TB-191`'den bilinçli ayrılış: derste
**kademe** okula bırakılmıştı çünkü aynı ders okuldan okula farklı kademede okutulur; sınav türünde dönem
**adın kendisidir** ("1. Sınav" = birinci dönemin ilk yazılısı) ve seçenek listesi yalnız `TermOrder` ile
süzüldüğü için serbest bırakılsaydı kullanıcı bunu ancak yanlış dönemde beliren yanlış adlı bir seçenek olarak
görürdü. Kural **domainde** (`ExamType.Update`), handler yalnız 409'a çeviriyor.
**Silme ve pasifleştirme ayrı:** silme `ExamTypeUsageInspector` kapısından geçer (kullanımdaysa 409), pasifleştirme
her zaman serbest — kullanımdaki tür de düşürülebilir, satır durur ve eski pencereler adını okumaya devam eder.
Kapıda durum süzgeci **yok** ve bu bilinçli: tüketici pencerenin kendisi, kilitli pencere de türünün adını
gösteriyor. Bekçi: `ExamTypeUsageCoverageTests` — `ExamTypeId` taşıyan yeni kalıcı varlık kapıya eklenmezse kırmızı.
**Arayüz:** Ayarlar › Akademik Yapı › **Sınav Türü Kataloğu** sekmesi (liste, arama, "Çekirdekten Getir", yeni tür,
düzenleme çekmecesi — çekirdek satırda kilitli alanlar ipucuyla, pasife al/yeniden aç, iki adımlı silme), mock'lar
ve onları kilitleyen testler aynı turda (`TB-188` dersi).
⬜ **İki borç:** (a) tenant izolasyonu gerçek SQL'e karşı ölçülmedi — `IgnoreQueryFilters()` yok ve hepsi
`db.ExamTypes` üzerinden gidiyor ama bellek içi test DB kısıtını zorlamaz; (b) ekran tarayıcıda gezilmedi.
⬜ **Doğrulanmamış ürün farkı:** yönetim uçları `ExamsController`'da olduğu için `active-season-write` politikasına
tabi — **arşiv sezonda katalog yazılamıyor**, oysa ders kataloğu (`AcademicsController`) bu kısıta tabi değil.

### `E-29` · İdareci / müdür yardımcısı rolü yok — idari yetki vermek tam yönetici yapmak demek 🟡

Altınay B6 ön ölçümünde çıktı (2026-09-16). Yapı çoklu profili destekliyor (`Person` birden çok `Profile` taşıyor,
`RoleAssignment` çoklu aktif rol destekliyor, profil değiştirme komutu var) — yani "hem öğretmen hem idareci"
teknik olarak mümkün. **Ama rol kataloğunda ara rol yok:** yalnız `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`,
`PARENT`, `STUDENT`. Müdür yardımcısına idari yetki vermek = ona **okulun tamamına erişim** vermek.
`StaffProfile.Position` serbest metin ve yetkiyle ilişkili değil.

Altınay'da somut: kadroda müdür yardımcısı var ve hem ders veriyor hem idari iş yapıyor.

⬜ Ürün kararı: (a) `VICE_PRINCIPAL` rolü açılır ve izin kümesi tanımlanır (Issue #1'de "MVP sonrasına ertelendi"
notu var, yani yol açık) · (b) `SCHOOL_ADMIN` verilir ve fark kabul edilir · (c) izinler rolden ayrılıp kişiye
verilebilir hâle gelir (büyük iş).

### `TB-196` · Şube açarken okulun kendi kademe listesi denetlenmiyor 🟡

Altınay B4/B5 ölçümünde çıktı (2026-09-16). `CreateClassRoomCommandHandler` `GradeLevelId`'yi **master'daki 13
kademeye** karşı doğruluyor, okulun `school_grade_levels` listesine karşı değil. Yani Anadolu Lisesi olan
Altınay'da **"2-A" şubesi açılabilir**. `SchoolGradeLevel` entity belgesi "bu liste filtre olarak kullanılır"
diyor; kod bunu yapmıyor.

İkinci ayak (Altınay'ı etkilemiyor, ama aynı eşleşme kusuru): `SeedSchoolGradeLevelsHandler` anaokulu için `"AN"`
kodunu arıyor, master'da anaokulunun kodu `"0"` → **saf anaokulu açılışında sıfır kademe** tohumlanır, sessizce.

⬜ Kapatma yolu: şube oluşturma okulun kademe listesini süzgeç olarak kullansın; kademe kodu eşlemesi tek yerden
okunsun.

✅ **Kapandı — 2026-09-16 (commit edildi, `6cefeed8`).** Şube oluşturma artık okulun **aktif** kademe listesiyle
süzüyor (açık `SchoolId`); pasifleştirilmiş kademe de dışarıda kalıyor, master yalnız kod için join'leniyor.
İkinci ayak için **tek kaynak** çıkarıldı: okul türü → kademe kodu eşlemesi artık tek bir kuralda yaşıyor ve
tohumlama handler'ındaki kopya kaldırıldı — yamalama değil merkezî çözüm, ikinci bir çağıran aynı yanlışı
kopyalayamaz. 3 test: liste dışı kademe reddedilir, pasif kademe reddedilir, saf anaokulu açılışı kademesini alır.

### `TB-197` · Rehber öğretmen doğrulaması stub — daima "var" diyor 🟡

Altınay B5 ön ölçümünde çıktı (2026-09-16). Şube oluşturmada rehber öğretmenin varlığını denetleyen
`TeacherExistsAsync` **gövdesi sabit `true` dönen bir stub**. Yani var olmayan ya da başka okulun öğretmeni
rehber olarak atanabilir; kusur ancak o öğretmenden veri okunmaya çalışıldığında görünür.

⬜ Kapatma yolu: kontrol gerçekten okulun öğretmen profillerine baksın (açık `SchoolId` yüklemiyle — `TB-141`'in
kapattığı kalıp), ya da alan zorunlu değilse kontrol kaldırılıp beklenti belgeye yazılsın. Bugünkü hâli
"kontrol var" yanılgısı üretiyor.

✅ **Kapandı — 2026-09-16 (commit edildi, `6cefeed8`).** Kontrol artık okulun öğretmen profillerine **açık
`SchoolId` yüklemiyle** bakıyor ve görevi sona ermiş öğretmeni reddediyor; ölçüt kardeş komutla (`SetHomeroom`)
aynı. Alan zorunlu olmadığı için boş bırakmak geçerli kalıyor, yalnız **verilen** kimlik doğrulanıyor. Hata
mesajı da gerçeği söyleyecek biçimde düzeltildi. 3 test: başka okulun öğretmeni reddedilir, ayrılmış öğretmen
reddedilir, okulun aktif öğretmeni kabul edilir.
➕ Test kurulumunda **`TB-190` dersi uygulandı**: sahte bağlamda tenant alanı yansımayla kuruldu — kurulmasaydı
sorgu boş küme döner ve test iş kuralını değil kurulumun eksikliğini ölçerdi. Gerekçe test dosyasında yazılı.

### `TB-198` · `school_onboarding_status` ölü tablo — açılış ilerlemesi hiçbir yerde görünmüyor ⚪

Altınay ölçümünde çıktı (2026-09-16). Tablo Altınay'da **6 satır** taşıyor, hepsi `Pending`. Satırları yaratan
handler var; **okuyan sorgu, ilerleten komut ve uç yok**. Yani okul açılış sihirbazının ilerlemesi ne görünüyor ne
de hiçbir zaman ilerliyor.

⬜ Kapatma yolu: ya tüketicisi yazılır (açılış kontrol listesi ekranı — yeni okulun ilk gününde işe yarar) ya da
tablo ve onu yazan handler kaldırılır. Bugünkü hâli, var olmayan bir özelliğin veri izini biriktiriyor.

➕ **İş büyüklüğü ölçüldü (2026-09-16):** *(A) tüketicisini yazmak* — okuma sorgusu + DTO, üç ilerletme komutu
(domainde `MarkInProgress`/`MarkCompleted`/`Skip` **hazır**), uçlar, **yeni izin** (seed + göç + rol eşlemesi), bir
de ekran. Ama asıl iş bunlar değil: **altı adımın "tamamlandı" ölçütü bir ürün kararıdır** — otomatik ilerleyecekse
altı ayrı olay kancası gerekir, elle işaretlenecekse ekran + yetki kuralı. *(B) temizlik* — 5 dosya (192 satır) +
iki bağlam satırı + bir göç; tüketici, izin, test ve arayüz referansı olmadığı için yayılım yok, 30-45 dakika.
Bugünkü iz: dev veritabanında 12 satır, hepsi `Pending` (6'sı Altınay).

⬜ **Karar (2026-09-16, kullanıcı): daha geniş çerçevede düşünülecek; madde açık iş olarak kalıyor.** Yani ne
temizlenecek ne de bugünkü hâliyle tüketici yazılacak. Çerçeve sorusu şu: **okulun OKSİS'i teslim alma süreci
ürün içinde görünür bir şey mi olmalı?** Altınay saha testi bunun canlı örneği — B1'den B10'a kadar giden sıra
(ayarlar → sezon → katalog → şube → kadro → öğrenci) bugün yalnız bu belgede yaşıyor, üründe karşılığı yok.
Karar verilirken birlikte düşünülmesi gerekenler: `TB-193` (yeni okul branşsız doğuyor), `TB-192` (lise kataloğu
eksik), `E-24`'ün "seed gerçek yolu ölçmüyor" kalıbı ve bu turda ölçülen "yeni okulun ilk günü" kusurları
(`TB-168`, `TB-173`, `TB-185`). Ölü tablo bu tartışmanın **sonucuna** göre ya doldurulur ya kaldırılır.

### `TB-190` · Sahte bağlamla yazılan testte tenant alanı boş kalıyor; okul süzen sorgular sessizce "hepsi reddedildi" ölçüyor 🟡

`E-28` uygulamasında ölçüldü (2026-09-16) ve **beş testi birden yanlış yoldan geçiriyordu**.

`Profile.AssignTo` yalnız `PersonId` kuruyor; `SchoolId`'yi gerçek koşuda insert sırasında
`TenantSaveChangesInterceptor` dolduruyor. Sahte `DbContext`'te interceptor **yok**, alan `Guid.Empty` kalıyor —
dolayısıyla `pr.SchoolId == schoolId` süzen her sorgu **boş küme** döndürüyor. Test yazan kişi bunu görmez:
handler beklenen hata mesajını verir, iddia geçer ya da "reddedildi" dalında doğrulanır; oysa ölçülen şey iş
kuralı değil, **kurulumun eksikliğidir**.

Somut belirti: ödev devri testlerinde her devir *"Yeni sorumlu, bu okulda görevi süren bir öğretmen olmalıdır."*
ile reddediliyordu; kod doğruydu, kurulum yanlıştı. Dosya o güne dek hiç derlenmediği için bu beş ölçüm **bir kez
bile koşmamıştı**, yani kusur ancak derleme düzelince görünür oldu.

Sınıf olarak [[bellek-ici-test-db-kisitini-zorlamaz]] dersinin kardeşi: bellek içi bağlam yalnız DB kısıtlarını
değil, **interceptor'ların doldurduğu alanları da** taklit etmiyor. `TB-184` ve `TB-187` ile birlikte aynı aile —
test altyapısının sessiz yanlışları.

⬜ Kapatma yolu: profil/kişi kuran **ortak bir test fixture'ı** tenant alanını da kursun (bugün her testte elle,
yansımayla yapılıyor ve çoğu test hiç yapmıyor). Yamalama yerine merkezî çözüm: aynı kalıbın kullanıldığı diğer
test dosyaları da ona bağlanmalı.

### `TB-189` · Seed sezon verisi ürünün üretebildiği durumları temsil etmiyor ⚪

`TB-185` canlı ölçümünde ortaya çıktı (2026-09-16), ölçümün kendisi iki kez buna takıldı.

1. **Seed DB'de `Setup` durumundaki bütün sezonlar soft-delete'li** (`is_deleted = 1`; `DEV-OKUL` ve `TST-AL`).
   Küresel süzgeç onları gizlediği için **görünür hiçbir sezon yeniden adlandırılamıyor** (`Rename` yalnız
   `Setup`'ta izinli) ve **"kurulumdaki sezon" yüzeyleri seed veriyle hiç ölçülemiyor** — oysa `TB-168`/`TB-173`
   kararının dört durumundan biri tam olarak budur. Sezonsuzluk yüzeylerini seed'le sınamak isteyen herkes aynı
   duvara çarpar.
2. **`DEV-OKUL` ve `TST-AL`'de aynı adı (`2026-2027`) taşıyan iki sezon satırı var**; biri silinmiş olduğu için
   tekil ad kuralı bugün patlamıyor. Yani kısıt, verinin şu anki hâli sayesinde sessiz.

Belirti ürün değil **test verisi**: seed, ürünün üretebileceği durum uzayını örneklemiyor, bu yüzden o durumlara
bağlı kusurlar ancak sahada görülüyor (`E-24`'ün "seed gerçek yolu ölçmüyor" kalıbının kardeşi).

⬜ Kapatma yolu: dev seed'inde **canlı bir `Setup` sezon** bulunsun (ve sezonsuz bir okul kalmaya devam etsin);
silinmiş satırların ad çakışması temizlensin ya da tekil ad kuralının silinmişleri nasıl saydığı bilinçli yazılsın.

### `TB-188` · `canEdit` iki politikayı tek boolean'da topluyor — idarenin yeni yetkileri hiçbir ekranda görünmüyor 🟠

`TB-109`/`TB-110` turunun hemen ardından ölçüldü (2026-09-16). Sunucu artık `homework.manage` taşıyan idarenin
ödevi **iptal etmesine, kapatmasına ve işaretlemesine** izin veriyor. Ama okuma yüzü açılmadı:

| Alan | Bugünkü hesap | Sonuç |
|---|---|---|
| `GetHomeworkQueryHandler:79` `canEdit` | `isOwner && status is Draft or Published` | idare için **hep `false`**, `readOnlyReason = "adminView"` |
| `GetHomeworkQueryHandler:80` / `GetHomeworkTrackingQueryHandler:113` `canMark` | `isOwner` / `resolvedView == Owner` | idare ızgarayı işaretleyemiyor |

Web (`homework-detail-screen.tsx:89`) ve mobil (`:389`) bütün eylem bloğunu `detail.canEdit` ile sarıyor;
işaretleme `tracking.canMark`'a, toplu tamamlama `!readOnly`'ye bağlı. Yani **kural sunucuda var, yüzeyde yok** —
`TB-32`'nin tersi. `TB-109`'un çözdüğü "ödev sonsuza dek kontrol bekliyor" durumu kullanıcı açısından **hâlâ
duruyor**; düzeltmenin faydası hiçbir ekrana ulaşmıyor.

**Dikkat — `canEdit`'i idareye açmak yanlış çözüm.** O alan iki ayrı politikayı tek boolean'da topluyor:
düzenleme/yayın/silme (`OwnerOnly`) ile iptal/kapatma (`OwnerOrManager`); üstelik `isReadOnly = !canEdit` ondan
türüyor. `true` yapmak idareye düzenleme ve yayın affordance'larını da açar ve salt-okunur bandını kaldırır.

⬜ Kapatma yolu: yetenek alanları **politika başına** ayrılır ve **yazma kapısının kendisiyle aynı kaynaktan**
türer (`HomeworkWriteGate`'in erişim kipi); `canMark` `OwnerOrManager`'a çekilir; `readOnlyReason`/`isReadOnly`
yeni ayrıma göre gözden geçirilir (idare "salt-okunur" değil, **sınırlı yetkili**). İstemci mock'ları ve onları
kilitleyen testler **aynı turda** güncellenmeli — yoksa mock'lu arayüzde görünen ama gerçek API'de görünmeyen
düğme doğar.

✅ **Kapandı — 2026-09-16 (commit bekliyor).** Tek kaynak: yeni `HomeworkCapabilities`; her alan **yazma kapısının
kendi erişim kipinden** türüyor, yani okuma yüzü ile kapı aynı gerçeği söylüyor. `canEdit`'in **değeri değişmedi**,
yalnız anlamı daraldı (sahip-only kol: düzenleme, yayın, taslak silme); `canCancel` ve `canClose` eklendi, `canMark`
`OwnerOrManager`'a çekildi. `isReadOnly` artık `!canEdit` değil, **"hiçbir yazma yeteneği yok"**; `readOnlyReason`'a
additive olarak `managerView` eklendi — idare yayındaki ödevde salt-okunur değil, **sınırlı yetkili**; kapanmış
ödevde `adminView` almaya devam ediyor. Bir bekçi testi idareye düzenlemenin **hâlâ kapalı** olduğunu kilitliyor.
**Asıl sürpriz yüzeyde çıktı:** web'de idare `activeRole === "admin"` ile **ayrı bir ekrana** gidiyor ve orada
"Kapat" düğmesi **hiç yoktu**, "İptal et" ekranın kendi durum tahminine bağlıydı, takip ızgarası sabit
salt-okunur bırakılmıştı. Yalnız sunucuyu düzeltmek hiçbir düğme üretmeyecekti. Mock'lar ve onları kilitleyen
testler aynı turda hizalandı. Ölçümler: `dotnet build` 0, Homework süzgeçli 318 test, api-mocks 273, core 633,
typecheck beş pakette temiz.
⬜ **Kalan iki ayak:** mobilde "Kapat" eylemi sahip için de yok ve idarenin mobil ödev yüzeyi hiç bulunmuyor;
ayrıca ödev ekranlarının hiç render testi yok, görünürlük yalnız alan düzeyinde kilitlendi.

➕ **Aynı turda bulunan ikinci kusur (düzeltildi):** `packages/core/src/homework/types.ts` içindeki
`HomeworkAuditKind` birleşimi, sözleşme yazılmadan önce **uydurulmuş** camelCase bir tahmindi
(`statusMarked`, `exemptSet`, `recordAddedAfterPublish`…) ve sunucunun `ToWire` eşlemesindeki **hiçbir değerle
eşleşmiyordu**; tüketicisi olmadığı için yıllarca sessizce yanlış kaldı ([[serilesmis-sekil-sozlesmedir]]).
Değerler sunucuya birebir çekildi, bilinmeyen tür için "Diğer işlem" yedeği eklendi (satır gizlenmiyor, ham tel
değeri basılmıyor). **Ödev denetim izinin kendisinin hâlâ hiçbir ekranı yok** — uç dün gece açıldı, tüketicisi
yazılmadı (`TB-112`'nin devamı).

### `TB-187` · Mapster'ın paylaşılan yapılandırması paralel test koşumunda çöküyor ⚪

`TB-109` doğrulamasında ölçüldü (2026-09-16). `GetSchoolSettingsQueryHandlerTests` tam takım koşumunda
`InvalidOperationException: Collection was modified` ile düştü; yığının tamamı Mapster'ın içinde
(`SettingStore.Apply` → `TypeAdapterConfig.GetMergedSettings`). İki bağımsız kanıt belirtinin **paralellikten**
geldiğini gösterdi: izole koşuda 8/8 yeşil, ikinci tam koşuda 2731/0 yeşil.

Sebep: paylaşılan `TypeAdapterConfig` önbelleği xUnit'in paralel iş parçacıklarınca **eşzamanlı** derleniyor.
Ürün kodunda tek süreçli ısınma olduğu için bugün yalnız testte görünüyor — ama aynı yapı, uygulama açılışında
eşzamanlı ilk isteklerde de kuramsal olarak kırılgan.

Sınıfı `TB-184` ile aynı: **sıraya bağlı kırmızı**, gerçek bir düşüşü gürültüye gömer.

⬜ Kapatma yolu: eşleme yapılandırması uygulama/test açılışında **bir kez** ve deterministik biçimde derlensin
(ısınma adımı), ya da testlerde koleksiyon paylaşımı kapatılsın. Önce hangisinin doğru olduğu ölçülmeli.

### `TB-186` · `isSchoolDay` sezonun durumuna bakmıyor — kurulumdaki sezonun günleri ders günü sayılabiliyor 🟡

`TB-168` sunucu ölçümünde çıktı (2026-09-16). `SchoolCalendarService` (`:31-45`) bir günün ders günü olup olmadığını
yalnız `AcademicTerm` **tarih aralığından** çözüyor; sezonun ya da dönemin **durumuna bakmıyor**. Sonuç: henüz
aktifleştirilmemiş (`Setup`) bir sezonun dönemleri bugünü kapsıyorsa gün "okul günü" sayılır ve `SessionMaterializer`
o gün için yoklama oturumu üretmeye çalışır.

Aynı kalıp `TB-179`'un (c) ayağının kardeşi: **tarih ekseni ile durum ekseni iki ayrı gerçek üretiyor.**

⬜ Kapatma yolu: ders günü çözümü sezon/dönem durumunu da okusun (tek kural, tek yer); `TB-179`'un dönem çözümüyle
birlikte ele alınmalı. Önce ölçülmeli: `SessionMaterializer` dönem durumuna ayrıca bakıyor mu, yani belirti bugün
gerçekten oluşuyor mu.

✅ **Kapandı — 2026-09-16 (commit bekliyor).** **Ölçüm önce yapıldı:** `SessionMaterializer` dönem/sezon durumuna
ayrıca bakmıyor (tek kapı `IsSchoolDayAsync`) ve günlük süpürme işi bütün okulları geziyor; ama oturum üretimi
ayrıca **yayınlanmış bir program** istiyor, o yüzden yeni açılmış okulda oturum doğmuyor. Buna karşılık **bugün
yanlış cevap veren beş yüzey** var: canlı pano, gün ders saatleri, tarih eksenli nöbet, kaydedilmemiş oturumlar ve
günlük kapatma işi — hepsi aynı kapıyı okuyor, yani kurulumdaki sezonun günleri "ders günü" sayılıyor.
**Kapı sezonun durumu oldu (`Active`), dönemin değil.** Gerekçe: dönem durumunu kapı yapmak, `TB-179`'un açık
ayağı yüzünden (2. dönemi başlatacak günlük iş henüz yok) 2. dönem elle başlatılana kadar yoklamayı **tamamen
durdururdu** — ölçülmemiş bir kural için çalışan bir yüzeyi kırmak olurdu. Sezon `Active` değilken okul günü
olmadığı ise tartışmasız.
Kural yeni `AcademicCalendarRules`'ta: tarih kapsama cümlesi tek yerde yaşıyor ve **`TB-179`'un aktivasyon yolu ile
okuma yolu aynı cümleyi okuyor** — tarih ekseni ile durum ekseni artık yapısal olarak ayrışamıyor. 6 test, içlerinde
"dönem `NotStarted` olsa da `Active` sezon ders günü üretir" regresyon bekçisi var.

### `TB-185` · Sezonsuzluk cevabı bir saat önbellekte yapışıyor; sezonu açan yollar anahtarı temizlemiyor 🟡

`TB-168` sunucu ölçümünde çıktı (2026-09-16). `GetCurrentSession` sorgusu `[Cacheable]` ve **başarısız sonuç da
önbelleğe yazılıyor** (`CachingBehavior`), yani `NO_ACTIVE_SESSION` 404'ü `tenant:{schoolId}:current-session`
anahtarında **1 saat** duruyor. Anahtarı yalnız dört domain olayı temizliyor; **sezon oluşturma, taslaktan açma,
kurulumu iptal ve yeniden adlandırma temizlemiyor.**

Belirti: müdür sezonu açar, ekran bir saate kadar "sezon yok" demeye devam eder. Gece turunda iki kez ısırdı
(bildirim göçünden sonra `notification-config`, tatil düzeltmesinden sonra `holidays:*` elle temizlenmek zorunda
kaldı) — bu, `TB-183`'ün kardeşi ve aynı sınıfın üçüncü örneği.

İkinci ayak: `/current` ucunun 404'ü controller'a gömülü özel bir dal; `NO_ACTIVE_SESSION` kodunu
`ResultExtensions.MapStatusCode` **tanımıyor** — aynı kodu başka bir handler döndürürse 422 alır.

⬜ Kapatma yolu: sezonun durumunu değiştiren **her** yol anahtarı düşürsün (tercihen tek bir yerden, olay
listesine güvenmek yerine); başarısız sonucun önbelleğe yazılıp yazılmayacağı bilinçli bir kural olsun; hata kodu
merkezî eşlemeye taşınsın.

✅ **Kapandı — 2026-09-16 (canlı doğrulama sürüyor, commit bekliyor).** Üç kusurun üçü de kapatıldı:
1. **Temizlik olaya değil, yazılan satıra bağlandı.** Yeni `CacheInvalidationInterceptor` (EF
   `SaveChangesInterceptor`): değişiklik kümesi `SavingChangesAsync`'te toplanıyor (kayıttan sonra `ChangeTracker`
   "ne değişti"yi bilmez), anahtarlar `SavedChangesAsync`'te düşüyor — başarısız `SaveChanges` hiçbir anahtar
   düşürmüyor. Eşleme tek yerde (`CacheInvalidationRules`). **Bu kapıyı atlamak için EF'i baypas etmek gerekir**;
   eski beyaz liste yaklaşımı yerine seçilmesinin sebebi bu. Anahtar tenant'ı satırın kendisinden alıyor, ambient
   bağlamdan değil — arka plan işleri okuldan okula gezerken doğru okul satırdadır. Eski olay handler'ı silindi;
   iki mekanizma bırakmak yamalama olurdu.
2. **Başarısız sonuç artık bilinçli kural:** `[Cacheable]`'a `CacheFailures` eklendi, **varsayılan `false`**.
   Gerekçe belgede: bir sorgunun başarısızlığı neredeyse her zaman durumsaldır ve kullanıcının bir sonraki
   hamlesiyle değişir; başarısızlığı saklamak, kullanıcıya **kendi yaptığı değişikliği göstermemektir**.
3. `NO_ACTIVE_SESSION` merkezî `MapStatusCode`'a taşındı, controller'daki özel dal kaldırıldı; cevap gövdesi aynı.

Testler: `CachingBehaviorFailureTests` 3, `CacheInvalidationRulesTests` 4, `ResultExtensionsAcademicSessionsTests` 2.
⬜ **`TB-183` bu turda kapanmadı, ölçüldü:** tatil okuyucusu hâlâ `IMemoryCache` kullanıyor, yeni kapı Redis
anahtarlarını düşürüyor — süreç içi önbelleğe dokunmuyor. Okuyucu `ICacheService`'e geçirilirse
`CacheInvalidationRules`'a tek satır eklemek yetecek; iskelet buna hazır.
⬜ **Göç ya da elle SQL bu kapıdan geçmez** — "veriyi göçle değiştiren turda anahtarı elle temizle" kuralı
geçerliliğini koruyor (interceptor belgesinde yazılı).

✅ **Canlı doğrulandı (2026-09-16).** Seed okulda ürünün kendi yollarıyla ölçüldü: anahtar `GET current` ile
oluşuyor (tenant'ı kendisi taşıyor, TTL 3600); **sezon oluşturma** (eski listenin kaçırdığı birinci yol) anahtarı
düşürdü, sonraki okuma taze değeri yazdı; **yeniden adlandırma** (dördüncü yol) yine düşürdü. Eski kodda bu anahtar
bir saat yerinde kalırdı. Sezonsuz okulda (`PLT-DOGRULAMA`) iki `GET current` çağrısı yapıldı → **sıfır anahtar**,
yani `CacheFailures=false` canlıda çalışıyor; 404 da artık **merkezî eşlemeden** geliyor. Elle SQL'in interceptor'ı
tetiklemediği de canlı görüldü (belgelenmiş sınırın örneği). Altınay'a dokunulmadı.
**Bilinçli yan etki:** kural "sezon/dönem satırına dokunan her yazma" olduğu için temizlik muhafazakâr — güncel
olmayan bir sezon değişse de anahtar düşüyor. Bedeli bir fazladan okuma, kazancı "asla bayat cevap".

### `TB-184` · Entegrasyon testi paylaşılan DB'de küresel sayı bekliyor — takımla koşunca kırmızı ⚪

Gece turunun son doğrulamasında ölçüldü (2026-09-16). `ExpireStaleInvitationsJobTests.Run_ShouldExpire_OnlyActiveAndStale…`
**takımla koşunca kırmızı** ("beklenen 2, bulunan 4"), **tek başına yeşil** (izole koşu: 1/1, 978 ms — ölçüldü).

Kök neden: test süpürme işini `SystemTenantContext` ile koşturuyor (`CurrentSchoolId = null`, `IsSuperAdmin = true`),
yani küresel tenant süzgeci düşüyor ve iş **paylaşılan veritabanındaki bütün** eskimiş aktif davetleri süpürüyor.
Test ise kendi yazdığı 4 satıra bakıp **kesin küresel sayı 2** bekliyor. Kirleten satırlar `K-27` platform diliminden:
`CreateSchoolCommandHandlerTests` bilerek terminal olmayan bir davet bırakıyor.

Belirti ürün değil **test altyapısı**: aynı sınıf, sıraya bağlı kırmızılar üretir ve gerçek bir regresyonu gürültüye
gömer (`TB-182`'nin 22 kırmızısında yaşandı).

⬜ Kapatma yolu: testin iddiası küresel sayı yerine **kendi yazdığı kayıtların kimliğine** bağlansın (ya da süpürme
tek okula kapsanıp öyle ölçülsün). Testi gevşetmek değil, ölçüyü kendi verisine bağlamak.

### `TB-183` · Tatil önbelleği iki ayrı depoda: okuyucu süreç içi, temizleme Redis'te 🟡

`TB-176`/`TB-177` düzeltmesinde ölçüldü (2026-09-16). `HolidayCalendarReader` okuduğunu **`IMemoryCache`**'e
(süreç içi) yazıyor; tatil CRUD handler'ları ise değişiklikten sonra **`ICacheService` (Redis)** üzerinden
`holidays:reader:{schoolId}` anahtarını siliyor. İki ayrı depo olduğu için **bu temizleme okuyucunun önbelleğini
hiç boşaltmıyor**; tutarlılığı sağlayan tek şey okuyucunun 5 dakikalık TTL'i.

Görünen belirti: müdür tatil ekleyip sildikten sonra yoklama takvimi 5 dakikaya kadar eski cevabı verebilir.
Aynı sınıfın kardeşi bu gece iki kez daha çıktı: bildirim göçünden sonra Redis `notification-config` bayat kaldı,
tatil göçünden sonra hem Redis hem süreç içi önbellek elle temizlenmek zorunda kaldı.

⬜ Kapatma yolu: okuyucu ile temizleyen taraf **aynı önbellek soyutlamasını** kullansın (tercihen `ICacheService`,
çok örnekli çalışmada süreç içi önbellek zaten yanlış cevap verir); anahtar adı tek yerde tanımlansın. Ayrıca
veriyi göçle değiştiren her turda ilgili anahtarların temizlenmesi kural hâline gelmeli.

✅ **Kapandı — 2026-09-16 (commit bekliyor), üstelik iki kusur daha çıktı ve aynı satırla kapandı.**
Okuyucu `ICacheService`'e geçti, anahtar tek yerde tanımlandı (`tenant:{schoolId}:holidays:reader`, tenant'ı
kendisi taşıyor). Temizleme `TB-185`'in interceptor iskeletine bağlandı — **anahtar değil önek ile**, çünkü
tatilden beslenen ikinci tüketicinin anahtarı parametreli; tek tek saymak yine beyaz liste olurdu. Altı
handler'daki elle silmeler kaldırıldı (iki mekanizma bırakmak yamalama olurdu) ve o adla hiçbir yere yazılmayan
**hayalet silmeler** temizlendi.
**Ölçümde çıkan iki kusur:**
1. Ayar ekranının tatil listesi anahtarı (TTL **24 saat**) hiç düşürülmüyordu — müdürün eklediği tatil ayar
   listesinde **bir güne kadar** görünmeyebiliyordu.
2. Önbellek, **istenen aralığa göre çözülmüş** resmî tatilleri saklıyordu; başka aralıklı ikinci bir çağrı kendi
   yılının resmî tatillerini göremiyordu (gizil kusur). Artık aralıktan bağımsız ham satırlar saklanıyor, çözüm
   her çağrıda yapılıyor — bu şekil hatası yapısal olarak imkânsız.
**TTL 5 dk → 1 saat:** 5 dakika bir *tutarlılık* mekanizmasıydı (bayatlığın üst sınırı); artık tutarlılığı yazma
yolu sağlıyor, TTL yalnız emniyet ağı — resmî tatil kataloğu `MasterEntity` olduğu için interceptor'dan geçmiyor,
göç ve elle SQL de geçmiyor.
**Maliyet ölçüldü:** tüketiciler günü gün **döngüde** soruyor (bir rapor ucu 7–31 çağrı, günlük kapatma işi okul ×
gün). Süreç içi önbelleği kaldırmak her çağrıyı ayrı Redis turuna çevirirdi; okuyucuya **istek ömürlü memo**
kondu — iş birimi başına okul başına tek tur, iki istek arasında bayat cevap üretmiyor.
**Canlı ölçüm** (seed okul): tatil eklenince anahtar düşüyor ve aynı uç **anında** yeni cevabı veriyor, silince de
öyle; başka okulun anahtarı etkilenmiyor. 78 birim testi + 65 mimari bekçi yeşil.
⬜ **Kalan:** resmî tatil kataloğunun kendisi hâlâ kapı dışında (emniyet ağı 1 saatlik TTL); entegrasyon takımı
bellek kısıtı yüzünden koşulmadı, sadeleşen iki test ilk gerçek koşuda gözden geçirilmeli.

### `TB-182` · Entegrasyon fixture'ı `IPlatformContext`'i kaydetmiyor — 22 test kırmızı 🟠

`TB-175` düzeltmesinin entegrasyon koşusunda ölçüldü (2026-09-16): **1453 testten 22'si kırmızı**, hepsi aynı
istisnayla — `Unable to resolve service for type 'IPlatformContext' while attempting to activate 'TenantContextBehavior'`.
Kırmızıların tamamı `SchoolSettingsAcademicEndpointsTests` ve iki akademik politika testi; hiçbiri o turda değişen
koda dokunmuyor.

**Kök neden:** `K-27` platform dilimi (`28366cca`) `TenantContextBehavior`'a `IPlatformContext` bağımlılığı ekledi;
entegrasyon fixture'ı bu servisi **hiç kaydetmiyor** (`grep` ile doğrulandı). Yani üretim hattı doğru, testin kurduğu
kap eksik. Düşüş `master`'a merge edilmiş durumda ve gece turundaki her entegrasyon koşusunda tekrarlandı.

Aynı sınıfın dersi `TB-180`'de de çıktı: **koşulmayan ya da kalıcı kırmızı bırakılan bekçi, bekçi değildir** — 22
kırmızı, gerçek bir düşüşü de gürültüye gömer.

⬜ Kapatma yolu: entegrasyon fixture'ına `IPlatformContext` kaydı (üretimdeki kayıtla aynı ömür ve davranış; okul
bağlamıyla koşan testlerde platform bağlamı boş olmalı). `K-27` dilimini yazan oturuma yönlendirilmeli.

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** İki harness (`NotificationMatrixEndpointsTests`,
`SchoolSettingsAcademicEndpointsTests`) yalnız `AddApplication()` çağırıyordu; ikisine de üretimdekiyle **aynı ömürde
(scoped)** `FakePlatformContext` kaydı eklendi (`IsPlatformRequest = false`, `PlatformAccountId = null`).
Entegrasyon takımı **22 kırmızıdan 1'e** indi; kalan tek kırmızı bu iki dosyayla ilgisiz (`TB-184`).

### `TB-181` · Hesabın birden çok okulda kişisi varsa giriş hangi okulu seçeceğini garanti etmiyor ⚪

`TB-141` düzeltmesinde ölçüldü (2026-09-16). `PersonDirectory.FindByAccountIdAsync`
(`Infrastructure`) küresel tenant süzgecini bilerek atlıyor (`IgnoreQueryFilters`): giriş ve
belirteç yenileme anında tenant bağlamı **henüz yoktur**, kişi bulunur ve okul sonra
`Person.SchoolId`'den türetilir (`BR-identity-001`). Tasarım doğru — ama sorgu, aynı hesaba bağlı
**birden çok kişi** olduğunda hangisini döndüreceğini tanımlamıyor.

Bugün zararsız görünüyor: dev verisinde ve saha testinde bir hesabın tek okulda kişisi var. Ama
ürün "aynı e-posta iki okulda öğretmen" senaryosunu yasaklamıyor; o gün kullanıcı hangi okula
düşeceğini şansa bırakır ve bu, yanlış okulun verisini gören bir oturum demektir.

`TB-141`'in mimari bekçisi bu dosyayı gerekçeli muafiyet olarak listeliyor — yani kopya değil,
bilinçli tek istisna.

⬜ Ürün kararı gerekiyor: (a) bir hesap yalnız bir okulda kişi olabilir (kısıt + göç); (b) giriş
çok kişi bulduğunda okul seçtirir; (c) kod bugünkü örtük "ilk kayıt" davranışını açıkça yazar ve
belgelendirir. Karar verilene kadar sorgunun determinist bir sıralaması olmalı.

### `TB-180` · Rol seed bekçisi dört gündür kırmızı; günlük test döngüsü onu hiç koşmuyor 🟡

`TB-174` düzeltmesi sırasında entegrasyon koşusunda ortaya çıktı (2026-09-16, dal `fix/ilk-sezon-acilisi`,
HEAD `60e65caf`). `MasterRoleSeedTests.Should_GrantFullCatalogToAdminRoles` düşüyordu: `SCHOOL_ADMIN`'de
"fazladan" `exams.place` var diyordu. Ölçüm, düşüşün gece turundaki değişikliklerle ilgisi olmadığını gösterdi —
testin girdisi yalnız EF model seed'i (`GetSeedData`), ilgili seed dosyaları 31 Temmuz'dan beri değişmemiş.

**Kök neden:** `RolePermissionSeedData.cs:59-77` `exams.place`'i **2026-09-12'de bilerek** `SCHOOL_ADMIN`'e verdi
(Faz 2a Görev 7.9: yönetici kelebek oturumunu elle kurarken yerleştirme ızgarasını `GetPlacementSlots`'tan
okuyamıyor, şubenin okulda olmadığı saate oturum kurabiliyordu). Ama aynı turda **iki yer güncellenmedi**:
bekçi testinin `roleSpecificCodes` kümesi ("yalnız TEACHER alır") ve `AllPermissionIds()` üstündeki katalog
yorumu ("hiçbir yönetici rolüne gitmez"). Yani seed değişti, onu koruyan bekçi ve yanındaki yorum eski niyeti
anlatmaya devam etti.

**Asıl mesele bekçinin görünmezliği:** `./scripts/test-changed.sh` "mimari bekçiler" adımında `Oksis.Tests`'i
**süzgeçle** (7 test) koşuyor; projenin tam takımı (62 test) yalnız o proje değişen koda bağlı sayıldığında ya da
`--integration` ile çalışıyor. Bu yüzden kırmızı bekçi dört gün, günlük döngüde hiç görünmeden durdu.

✅ **Düzeltildi (2026-09-16, commit bekliyor):** `exams.place` testte `roleSpecificCodes`'tan çıkarılıp
`schoolAdminOnlyCodes`'a taşındı (SuperAdmin katalogda olmadığı için almaz, SchoolAdmin alır) ve iki yere de
2026-09-12 gerekçesi yazıldı; `RolePermissionSeedData`'nın bayat katalog yorumu düzeltildi.
⬜ **Açık ayak:** günlük döngü `Oksis.Tests`'in tam takımını koşmuyor. Süzgeç kapsamı genişletilmeli ya da bu
projenin tamamı her koşuda çalışmalı — bekçi, koşulmadığı sürece bekçi değildir.

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

✅ **Kalan ayak ölçüldü (2026-09-15).** Kapsam daraltmasının davranışı değiştirmediği
`emulateMedia({media:'print'})` altında İKİ YÖNDE birden doğrulandı:

| Durum | `.shell` | `.tl-print-root` |
|---|---|---|
| Baskı · resmî yazı KAPALI | `block` — kâğıda düşer | — |
| Baskı · resmî yazı AÇIK | `none` — gizlenir | `block` — kâğıda düşer |
| Ekran | `grid` | — |

Uygulanan kural sayfadan okundu: `body:has(.tl-print-root) > :not(.tl-print-root)
{ display: none !important }`. Yani resmî yazı açıkken kabuk eskisi gibi boşalıyor,
kapalıyken kural hiç yok.

⬜ **Yine de ölçülmeyen bir şey kaldı ve sebebi ürün değil VERİ:** yazının kendi
gövdesinin kâğıttaki dizilimi. "Resmî Yazı (PDF)" düğmesi yalnız eşik AŞILMIŞ öğrencide
açılıyor (`thresholdLevel(...).level === "over"`) ve dev verisinde böyle bir öğrenci yok —
en yüksek devamsızlık **1 gün**, sınır **30**. `absence_summaries` satırını elle
büyütmek de işe yaramıyor: `unexcusedDays` özet satırından değil,
`AbsenceDayBreakdownResolver.CalculateAbsentDaysAsync` ile yoklama KAYITLARINDAN canlı
hesaplanıyor; düğmeyi açmak için ~31 gerçek devamsızlık kaydı uydurmak gerekir.

**Bu kendi başına bir tohum boşluğudur** ve `TB-143`'ün sınav tarafında yaptığının aynısını
yapıyor: kural değil, kuralın DOĞRULANABİLİRLİĞİ kapalı. Devamsızlık tohumuna eşik aşmış
tek bir öğrenci eklemek, resmî yazının bütün yüzeyini teste açar.

**Ders:** bir modülün `@media print` kuralı `body > *` gibi kökten seçici kullanıyorsa,
kendi kökünün varlığına bağlanmadıkça **uygulamanın tamamının** kuralıdır.

✅ **2026-09-16 · veri ayağı da yazıldı (gece turu, commit bekliyor).** Eşik mektubunu gösterecek öğrenci artık
dev seed'den geliyor: yeni `AttendanceThresholdDevSeeder` yalnız `DEV-OKUL`'a, şubesi olan ilk aktif öğrenciye,
okulun kendi `UnexcusedAbsenceLimit + 1` kadar hafta içi gününe `Completed` oturum ve `Absent` kayıt üretiyor
(şubenin geri kalanı `Present`). Özet satırını elle büyütmek **işe yaramıyordu**: `unexcusedDays` canlı olarak
yoklama kayıtlarından hesaplanıyor. Idempotent (sentetik `PlacementId` + tekil indeks), yan etkisiz (üretilen
domain olayları kaydetmeden düşürülüyor → seed veli bildirimi göndermiyor), gelecek tarihli oturum üretmiyor,
**Altınay dâhil diğer okullara dokunmuyor**. Entegrasyon testi ürünün kendi gün-eşdeğeri hesabıyla sınırın
aşıldığını, ikinci koşumun satır eklemediğini ve verilmeyen okula yazmadığını birlikte ölçüyor — yeşil.
⬜ **Kalan:** dev DB yeniden seed edilmedi; seeder bir sonraki dev API açılışında kendiliğinden koşacak. Resmî
yazının kâğıttaki dizilimi ancak ondan sonra gözle ölçülebilir.

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

✅ **Açık soru kapandı (2026-09-15) — ve cevap bulgunun kendisini hükümsüz kıldı.**
Eski rota geçici olarak geri konup gerçek sunucuda denendi:

| Yol | Sonuç |
|---|---|
| `review-comments/{id:guid}:resolve` | **401** — yönleniyor |
| `hour-requests/{id:guid}:answer` | **401** — tireli literal de suçsuz |
| `windows/{id:guid}:publish-window` | 401 |

**404'ün sebebi rota ağacı değil KABUKTU.** zsh'de `$id:resolve` yazıldığında `:r` bir
parametre düzenleyicisidir ("uzantıyı at") ve URL `<guid>esolve`ye dönüşür — var olmayan
yol, yönlendirme 404'ü. `:publish-window` ve `:open-review` bozulmamıştı çünkü `:p` ve `:o`
düzenleyici değil; `%3A`'nın "çalışması" da aynı sebeple, iki nokta kalmıyordu. İki
hipotez de (tireli literal / rota ağacındaki konum) yanlıştı.

Düz alt-kaynak yolu **yine de korunuyor**: istemci ve sözleşme ona geçti, geri döndürmek
bedava değil. Değişen tek şey gerekçe.

**Ders:** kabuk değişkeniyle kurulan URL'de iki nokta varsa `${}` ile sarmalanmalı;
sarmalanmazsa ölçüm sunucuyu değil kabuğu ölçer. `oksis-api` `f399c8ea`.

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

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** Kalıbın tek sahibi oldu:
`Application/Common/Security/CallerPerson.cs`. Üç emsal çözücü (`ExamCaller`, `AttendanceCallerResolver`,
`AnnouncementCallerResolver`) de artık aynı sorguya delege ediyor — modül docblock'ları kendi bağlamını anlatmaya
devam ediyor ama **sorgu tek**. 13 çağrı yeri bağlandı (Users 5, Duties 2, Clubs 2, Grades 1, Announcements 1 —
`AnnouncementLifecycleGuard` imzasına `schoolId` eklendi, 8 çağıran güncellendi —, Homework 1, Documents 1).
Exams'in iki yeri zaten kapalıydı, kodla doğrulandı. Depodaki ham kalıp **17 → 3**'e indi.
**Bekçi kopyanın kendisini yasaklıyor**, "her kopyada yüklem var mı"yı değil: ikincisi kopyayı meşrulaştırır ve bir
sonraki kopya yüklemsiz doğar — `TB-140`'ın yaşadığı tam olarak buydu (`CallerPersonSchoolPredicateTests`,
üç gerekçeli muafiyet).
⬜ **Açık kalan iki ayak:** (1) `GetMySubstitutions` o sırada başka bir turdaydı (`TB-174`), hâlâ yüklemsiz —
bekçide **geçici** muafiyet ve randevu notu var. (2) `PersonDirectory.FindByAccountIdAsync` bilinçli olarak
tenant süzgeci dışı (giriş akışı, `BR-identity-001`); oradan çıkan belirsizlik ayrı madde: `TB-181`.

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

✅ **2026-09-16 · kapandı (gece turu, commit bekliyor).** `LessonPlacement` üzerinde EF'in çevirebildiği
`static Expression<Func<LessonPlacement,bool>> IsLive` + **aynı ifadeden derlenen** `IsLiveNow(...)` (bellekteki
koleksiyonlar için; yüklem ikinci kez yazılmıyor). **Site sayısı defterdekinden fazla çıktı: 10 değil 15** —
`TeachingSlotReader` tek başına dört sorgu taşıyor ve `AutoGenerateScheduleJob` hiç sayılmamıştı; 15'in 15'i
bağlandı. Dokunulmayan tek yer `ExamExpectationReader.ReadExcludedAsync`: orası yüklemin **negatifi** ve ayrım
bilinçli olarak bellekte yapılıyor — bekçide gerekçeli muafiyet. Ara koruma da yazıldı: `LivePlacementPredicateTests`
ham `IsReserving` kullanımını üç muaf dosya dışında yasaklıyor. `X-06` dersine karşılık, ifadenin gerçekten SQL'e
indiği **gerçek sağlayıcı** testiyle ölçüldü (`ScheduleProgramStatsRecomputer`'daki riskli `AsQueryable().Where(...)`
çevirisi dâhil yeşil).

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

✅ **Karar (2026-09-16, kullanıcı): (b) bekçi testi.** "Model ile göçler eşit mi" sorusunu soran ucuz bir bekçi
eklenecek; 1400+ entegrasyon testinin kurulum süresi uzamayacak. `Down()` tarafının sınanmadığı **bilinçli olarak
kabul edildi** ve bu maddenin açık ayağı olarak kalır.

✅ **Uygulandı — 2026-09-16 (commit bekliyor).** `tests/Oksis.Tests/Architecture/MigrationsMatchModelTests.cs`:
`Database.HasPendingModelChanges()` (EF Core 10'un gerçek public API'si, belgeden doğrulandı) sahte bağlantı
dizgisiyle kurulan bağlamda çalışıyor — **veritabanı istemiyor**, bağlantı hiç açılmıyor. Konum bilinçli:
`test-changed.sh` `Oksis.Tests`'i yalnız `--integration` ile seçiyor **ama** `Architecture/` altındaki bekçileri
her koşumda ayrıca süzgeçle çalıştırıyor. `UseSnakeCaseNamingConvention()` zorunluydu; olmasaydı bekçi gerçek
sapma olmadan her tabloyu farklı sayardı.
**Kırmızı kanıtı alındı** (bekçi, kanıtlanmadan bekçi sayılmaz): modele geçici bir gölge kolon eklendiğinde
takım **1 kırmızı** verdi ve mesaj ne yapılacağını söyledi — "EF modeli ile göç dosyaları AYRIŞTI… Entegrasyon
testleri bunu YAKALAMAZ… `dotnet ef migrations add` … ardından üretilen göçü OKUYUN". Gölge kolon geri alınınca
yeşile döndü; depoda sonda izi kalmadı. Mimari bekçi sayısı 9 → 10.

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
### `TB-163` · Biçim kapısı ~6000 adlandırma satırının altında boğuluyor ⚪

`CLAUDE.md` `dotnet format`'ı **pre-commit zorunlu** ilan ediyor. Kapı bugün işletilemez:
`--verify-no-changes` çözüm genelinde **5988 `IDE1006` satırı** döndürüyor ve
`dotnet format` bunların HİÇBİRİNİ düzeltemiyor — adlandırma kuralları otomatik
düzeltilmez, yalnız raporlanır. `TB-117`'nin asıl kökü budur: gerçek `IMPORTS` borcu
altı bin satırın içinde görünmüyordu (bu gece onu bulmak için `head` ile kesmek gerekti
ve ilk turda gözden kaçtı).

Ölçüldü (2026-09-15, tek proje — `Oksis.Api`): **114 satır, 57 benzersiz konum**, iki sınıf:

| Sınıf | Örnek | Durum |
|---|---|---|
| `private const` / `private static readonly`, PascalCase | `private const string PermissionPrefix = "perm:";` | **Kural fazla geniş.** `.editorconfig:53` `applicable_kinds = field` diyor ve `const`/`static readonly`'yi dışlamıyor; oysa ikisi de .NET sözleşmesinde PascalCase'dir ve depo da öyle yazıyor |
| `Async` ekiyle bitmeyen `async` metot | `public async Task<IActionResult> RemoveExemption(...)` | **Gerçek ihlal** — deponun kendi kuralı (`.editorconfig:59`) |

Yani altı binin bir kısmı kuralın kendi kusuru, bir kısmı gerçek borç; ikisi ayrılmadan
kapı açılamaz.

**Kapı ayrıca HİÇBİR YERDE işletilmiyor:** `.githooks/` altında yalnız `pre-push` var ve o
derleme + birim testi koşuyor, `dotnet format` çalıştırmıyor. Yani CLAUDE.md'nin "zorunlu"
dediği adım bugün ne otomatik ne de pratikte uygulanabilir durumda.

⬜ **Karar gerekiyor, iki ayrı iş:**
- **(a) Kuralı daralt** — `.editorconfig`'e `const` ve `static readonly` için PascalCase
  istisnası ekle. Depo genelinde bir stil kararıdır; tek satırlık değil, öncelik sırası da
  düşünülmeli.
- **(b) `Async` eksiklerini kapat** — gerçek borç; sayısı (a) ayıklandıktan sonra ölçülür.

✅ **(a) yapıldı — 2026-09-16 gece turu (commit bekliyor).** `.editorconfig`'e `private const` ve
`private static readonly` için PascalCase istisnası eklendi. Ölçüm (gerçek koşu, `IDE1006`):
**2995 → 2264 satır**; "eksik ön ek" ihlali **731 → 0**, kalanın tamamı gerçek `Async` borcu, yani **(b)**.
İstisnalar bilinçli olarak `suggestion` düzeyinde: depoda 81 `private const _camelCase` ve 549
`private static readonly _camelCase` alan var, `warning` yapmak 630 yeni ihlal üretirdi — o, (b) ile
birlikte verilecek ayrı bir stil kararı. **`TB-117` (repo geneli format) yapılmadı:** ağaçta commit
edilmemiş iş varken depo geneli biçimlendirme onu boğardı.
  Metot adı değişikliği çağıranları da etkiler.

İkisi bitmeden `dotnet format --verify-no-changes`'i pre-commit kapısı yapmak, her commit'i
bloke etmek olur.

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

➕ **2026-09-15 · Altınay saha testi (B2.2):** satır sorunu platformdan açılan okulda kapandı —
`SeedDefaultModuleConfigsHandler` 11 satır yazıyor (`transport` plan kilitli, `eokul` kapalı/Beta).
Kapı sorunu sürüyor ve **istemcide de yok**: `useModuleConfigs` yalnız ayar ekranlarında
çağrılıyor (web `module-tab.tsx:73`, mobil `modules-screen.tsx:208` ve ayar hub'ı); web menüsü ve
mobil sekmeler modül ayarını okumuyor. Bir modülü kapatmak bugün ne menüden gizliyor ne ucu
kapatıyor — ekranda tutulan bir tercih.

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

✅ **Karar (2026-09-16, kullanıcı): ortak koşum.** Birim testleri gerçek SQL sağlayıcısına çeviren paylaşılan
bir koşum yazılacak; borç tek hamlede kapanır ve bundan sonra yazılan her sorgu işleyicisi otomatik kapsanır.
Çok günlük bir iş kalemi: önce koşum altyapısı + pilot bir modül, sonra kademeli geçiş. **Ölçüm güncellendi:**
tarama sırasında sayı 150/92 idi, gece turunda 218 işleyicinin 132'si ölçüldü — oran sabit, mutlak borç büyüyor.

### `TB-199` · İkon adı tipi hiçbir şeyi korumuyor; olmayan ada sessizce boş ikon çiziliyor ⚪

Ayarlar ekran revizyonunda ölçüldü (2026-09-16, `oksis-ui`). `OksisIcon` bilinmeyen bir ad aldığında
**sessizce `null` döner** (`packages/ui/src/components/icon.tsx`: `const shapes = SHAPES[name]; if (!shapes)
return null`). Tip katmanı bunu yakalayamıyor: `OksisIconName = keyof typeof SHAPES` ve `SHAPES`
`Record<string, Shape[]>` olarak yazılmış — yani `keyof` **`string`'e** çözülüyor; üstüne
`OksisIconProps.name` de zaten `string`. Sonuç: ikon adı üç katmanda da denetimsiz.

Somut belirti: Akademik Yapı › Kataloglar sekme şeridinde "Ders Kataloğu" sekmesi `icon: "doc"` diyordu;
`SHAPES`'te `doc` diye bir ad yok, sekme ikonsuz çiziliyordu ve ne tip denetimi ne lint bunu gördü.

✅ **Bu turda düzeltilen ayak:** sekme sabiti tipli bir arayüze (`ACardTab<T>`) bağlandı ve adlar var
olanlarla değiştirildi (`notlar`, `karne`). Tip hâlâ `string` olduğu için düzeltme **yalnız o dosya için**
geçerli — kalıbın kendisi açık.

⬜ **Kapatma yolu:** `SHAPES` `Record<string, …>` açıklaması yerine `satisfies` ile yazılsın (ya da açıklama
kaldırılsın) — `keyof typeof SHAPES` o zaman gerçek birleşim tipine çözülür; `OksisIconProps.name` de
`OksisIconName` olsun. Depoda bilinmeyen adla çizilen başka ikon olup olmadığı **şu an bilinmiyor**; ancak bu
değişiklikten sonra ölçülebilir.

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
