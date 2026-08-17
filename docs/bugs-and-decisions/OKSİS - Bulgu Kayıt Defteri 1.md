# OKSİS — Açık Bulgular

> **Ne bu dosya:** [[OKSİS - Bulgu Kayıt Defteri]]'ndeki **yalnızca açık** maddeler,
> ne olduklarını anlatan açıklamalarıyla. Kapanmış maddeler burada hiç geçmiyor.
> **Son güncelleme:** 2026-08-17 (akşam) — `ENG-02` **kapandı**: öğretmen ve öğrencinin
> kendi ders programı ekranı yazıldı ve ekranda doğrulandı (ana defter *"16. ENG-02
> KAPANDI"*). Aynı turda beş sunucu kusuru ölçülüp kapatıldı, biri (`TB-63`) borç
> olarak açıldı. Öncesinde: açık bulgu turunda 38 madde kapatılmıştı (*"14. Açık Bulgu Turu"*).
> **Kanonik kayıt:** ana defter. Burası okumak için, yazmak için değil.

**ID şeması:** `B-##` fonksiyonel · `D-##` tasarım/UX · `V-##` validasyon ·
`X-##` çapraz kesen · `TB-##` teknik borç (kod taraması) · `E-##` eksik özellik ·
`ENG-##` engel.

---

## Genel tablo

| Öncelik | Adet | Ne demek |
|---|---|---|
| 🔴 Kritik | 1 | Akış bloklanıyor ya da iş kuralı ihlal ediliyor |
| 🟠 Yüksek | 7 | İşlev yanlış çalışıyor; veri, yetki veya mevzuat güveni zedeleniyor |
| 🟡 Orta | 8 | İşlev eksik ama alternatif yol var; borç birikiyor |
| ⚪ Düşük | 2 | Kozmetik, temizlik, adlandırma |
| ❓ Netleşmemiş | 1 | Arandı, bulunamadı — nerede görüldüğü söylenmeli |
| **Toplam** | **19** | |

**19 maddenin 14'ü koddan çok senden cevap bekliyor** — aşağıdaki ilk bölüm. Kalan 5'in
biri park edildi (`TB-29`, artık açılabilir), biri ölçülüp kapsamı çıkarıldı, biri ertelendi,
biri karar zincirine bağlı, biri yeni açılan borç (`TB-63`).

---

## 0. Önce senin kararını bekleyenler

Bu maddeler teknik olarak yapılabilir; yapılmama sebebi **ne yapılacağının kararı verilmemiş**
olması. Karar gelmeden yazılan kod yanlış yöne gider.

### `TB-48` · Görevlendirme v1'in yazma yüzeyi kapalı, tüketicileri hâlâ ona bağlı 🔴
Görevlendirme iki nesil hâlinde yaşıyor: **v1** (öğretmen × şube × ders + haftalık saat) ve
**v2** (öğretmen × ders yetkinliği; şube ve saat bilinçli olarak yok). Kullanıcının arayüzden
yazabildiği tek yer v2. v1 tablosuna **hiçbir ekrandan satır yazılamıyor**.

`K-10` kararıyla ders programı üretimi v1'den koparıldı — o ayak bitti. Ama v1'i okuyan
**üç tüketici hâlâ duruyor** ve gerçek bir okulda boş veriyle karşılaşıyor:

| Tüketici | Ne olur |
|---|---|
| Vekâlet aday havuzu (`GetAvailableSubstitutes`) | Adayın ders kategorileri boş çıkar |
| Duyuru hedefleme (`AudienceResolver`) | Öğretmenin *"kendi şubelerim / derslerim"* hedefi boş döner |
| Sezon devri (`CopyAssignmentsToNewSeason`) + geri alma koruması | Kopyalanacak satır yok |

**Belirtinin karakteri:** hepsi **sessiz**. Hata değil, boş sonuç. Ekran kaldırıldığında
kimsenin fark etmemesinin sebebi bu.

⬜ **Karar:** kalan üç tüketici de v2 + müfredat türetmesine mi taşınacak (`K-10`'un devamı),
yoksa v1 bu üçü için mi yaşamaya devam edecek? İkisi birden kalırsa yeni gelen geliştirici
hangi nesle dokunduğunu bilemez. → `X-03` aynı düğümün adı.

### `E-01` · Rıza yenileme ekranı yok — kullanıcı çıkışsız odada kalıyor 🟠
KVKK rızası geri çekilmiş ya da rıza paketi sürümü ilerlemiş kullanıcı **rızayı yeniden
veremiyor**: ne web'de ne mobilde ekran var. Backend ucu (`POST /users/consents`) **var ve
çalışıyor**, arayüz onu hiç çağırmıyor.

Sonuç tek yönlü bir kapı: giriş 403, token yenileme 403, rızayı yeniden verecek yer yok.
Kullanıcı kendi başına hiçbir şey yapamıyor; yöneticinin elinde de yalnızca doğrudan API
çağrısı var, düğme yok.

⚠️ **Bugün sahada patlamıyor** çünkü rıza paketi sürümü hiç ilerletilmedi (`master.consent_bundles`
tek satır) ve seed kullanıcılarının hepsi `Granted`. **İlk sürüm yükseltmesinde 381 rıza
kaydının tamamı aynı anda kapıya takılır.**

⬜ **Karar:** ekran MVP kapsamında mı? Kapsam dışıysa, *"rıza paketi sürümü yükseltmek
operasyonel bir engeldir"* cümlesinin yazılı hâle gelmesi gerekiyor.

### `TB-19` · Geçici muafiyet, normal kullanımda hiçbir şey yapmıyor 🟠
Yönetici bir öğretmene geçici nöbet muafiyeti giriyor (ör. 13–14 Ağustos). Dağıtım işi
muafiyeti **yalnız butona basıldığı günün tarihine** göre süzüyor — dönem aralığına değil.
Yani muafiyet önceden girilirse (yani normal kullanımda) **görmezden geliniyor**.

Canlıda ölçüldü: dönem içinde muaf olduğu günler için öğretmene **2 nöbet + 3 vekillik** yazıldı.

🚫 **Naif düzeltme yanlış olur:** `today` yerine dönem örtüşmesi koymak, 5 aylık dönemde 2 gün
muaf olan öğretmeni **dönemin tamamından** çıkarır. Sebep yapısal: nöbet çizelgesi tarih değil
`day_of_week` taşıyor, haftalık-tekrarlı; tarih penceresi haftalık tekrara birebir eşlenemiyor.

⬜ **Karar:** iki günlük muafiyet (a) öğretmeni dönem çizelgesinden tamamen çıkarsın mı,
(b) çizelgede kalıp o tarihlerde yerine **vekil** mi geçsin? (b) doğru ürün davranışı gibi
duruyor ama bugün karşılığı olan bir tüketim noktası yok — yani yeni iş demek.

### `TB-43` · Bildirim ayarları sekmesinin tamamı ölü 🟠
Okul Ayarları → Bildirimler sekmesi üç kanallı bir **olay × kanal matrisi** sunuyor.
Üç ayak da çalışmıyor:
- **Kural matrisi** yalnız kendi ayar sorgusunda okunup yazılıyor; dağıtım motoru ona hiç bakmıyor.
- **Kanal anahtarları** (push / e-posta / SMS) ve **ana kapama anahtarı** dağıtımda okunmuyor.
- **Kayıtlı tek kanal in-app.** E-posta, SMS ve push'un uygulaması yok — matriste sunulan
  iki kanalın arkasında hiçbir şey yok.

Yönetici bir olayın SMS'ini kapatıyor, e-postayı açıyor, hatta bildirimleri tümden kapatıyor —
**davranış değişmiyor.** Ekran gerçeği yansıtmıyor.

⬜ **Karar:** ayarlar teslimata mı bağlansın, yoksa ekran bugünkü gerçeğe (tek kanal) mi
indirgensin? **İkisinin arasında kalmak en kötüsü.**

### `TB-46` · Not/sınav yapılandırması tüketicisiz, üstelik ağırlık iki yerde tanımlı 🟡
Notlandırmanın tüm yapılandırma yüzeyi hazır ama arkasında hiçbir şey yok — not modülü henüz
yazılmadı. Geçme notu, yuvarlama kuralı, yazılı/performans sayısı, not ölçeği: seçiliyor,
doğrulanıyor, saklanıyor, **kullanılmıyor.**

Asıl risk bugün değil yarın: **sınav ağırlığı iki ayrı yerde tanımlı** — master sınav türünde
tür başına yüzde, okul akademik politikasında yazılı/performans ağırlığı. Not modülü geldiğinde
**iki rakip ağırlık tanımı** hazır bekliyor olacak ve hangisinin yetkili olduğuna dair yazılı
karar yok.

⬜ **Karar (not modülünden ÖNCE):** ağırlık master sınav türünde mi, okul politikasında mı yaşayacak?

### `TB-55` · İki ayrı toplu içe aktarma yolu yan yana yaşıyor 🟡
Aynı iş — *"dosyadan toplu kişi ekle"* — için birbirinden habersiz **iki uç** var:

| Yol | Şablon | Davet üretiyor mu | Branş çözüyor mu |
|---|---|---|---|
| `POST /users/import` (Identity) | Ad, Soyad, Email, Rol | **evet** | hayır |
| `/users/imports/preview` → `/users/imports` (Users) | profil tipine göre (`Brans`, `OgrenciNo`…) | **hayır** (bkz. `B-20`) | evet |

Bir okul öğretmen listesini hangisinden yüklerse yüklesin sonucu farklı: birinde branş yok
ama davet var, diğerinde branş var ama davet yok. Hangisinin "doğru" yol olduğu koddan okunmuyor.

⬜ **Karar:** hangisi kalacak? `B-20` ile birlikte düşünülmeli — tek bir içe aktarma yolu,
hem branşı çözen hem daveti üreten.

### `TB-38` · İki belge akışı, iki farklı depolama yaklaşımı 🟡
**Mazeret belgesi** dosya yönetimi modülündeki saklı dosyaya referans veriyor (kod açıkça
*"yeni depolama icat etme"* diyor). **Öğrenci belgesi** ise dosya adresini **serbest metin**
olarak kendi kaydında tutuyor — yani virüs taraması, kota, yetim dosya temizliği ve erişim
denetiminden yararlanamıyor.

Ayrışmanın bir sebebi ölçüldü: dosya kategorisi defterinde **öğrenci belgesi diye bir kategori
hiç yok**. Yani taşıma kararı tek başına yetmez; önce kategori açılması ve o kategorinin
**saklama süresine karar verilmesi** gerekir (KVKK kararı).

⬜ **Karar:** öğrenci belgesi saklı dosya referansına taşınsın mı?

### `TB-42` · Dört dosya kategorisinin bağlanabileceği kayıt tipi yok 🟡
İki defter var ve örtüşmüyorlar. **Kategori defteri:** ödev teslimi, sınav belgesi, sanal kitap,
okul logosu, kulüp belgesi, duyuru eki, mazeret belgesi, önizleme. **Erişim çözümleyici defteri:**
yalnız okul, mazeret, duyuru.

Yani ödev teslimi / sınav belgesi / sanal kitap / kulüp belgesi kategorileri tanımlı ve kategori
politikası ucundan **okunabiliyor** — ama o dosyalar hiçbir kayda bağlanamıyor; deneme sessizce
404 ile reddediliyor. Arayüz bu listeden beslenirse kullanıcıya **çalışmayan seçenek** sunulur.

⬜ **Karar:** tüketicisi olmayan kategoriler defterden çıkarılsın mı, "hazırlanıyor" diye mi işaretlensin?

### `TB-31` · Devamsızlık eşik bildiriminde fail-open 🟡
Eşiğe gelen öğrenci için mükerrer bildirim iki katmanla önleniyor: hızlı önbellek kapısı +
arkasında kalıcı damga. **Önbellek erişilemezse sistem açık kalıyor** ve DB yedeğine düşüyor.
Kesinti anında aynı öğrenci için mükerrer eşik uyarısı gidebilir; veli/öğrenciye giden bildirim
olduğu için gürültü doğrudan hissediliyor.

⬜ **Karar:** kesintide bildirim gitsin mi gitmesin mi? Kapalı kalmak uyarıyı geciktirir, açık
kalmak mükerrer üretir. Kod bugün ikincisini seçmiş ama **gerekçesi yazılı değil.**

### `X-11` · Hiçbir CI kapısı yok — asıl çözüm hâlâ verilmedi 🟠
Depolarda derleme/lint/test kapısı yoktu; kırmızı bir `master` push edilebiliyordu. Ara çözüm
olarak **pre-push git kancası** kuruldu (`oksis-ui` → lint + typecheck, `oksis-api` → build +
birim testleri) ve gerçekten durdurduğu kanıtlandı.

⬜ **Açık kalan:** kanca yerelde çalışır, `--no-verify` ile atlanabilir ve **kancayı kurmamış**
bir geliştiriciyi hiç etkilemez. Sağlayıcı / adımlar / PR zorunluluğu kararı verilmedi.
`TB-57` tam da bu boşluktan geçti: entegrasyon testleri kancada yok, kimse koşmuyor.

### `X-10` · Rota kapısı rol çözülene kadar geçirgen 🟡
Öğrenci `/schedule` adresini açtığında **yönetim konsolu kısa süreliğine mount oluyor**;
beş yönetim isteği gerçekten atılıyor ve **beşi de 403** dönüyor. Rol çözüldükten sonra ekran
*"Bu sayfaya erişemezsiniz"*e dönüyor.

⚠️ **Bu bir gözden kaçma değil, yazılı bir tercih:** `route-guard.tsx`'in kendi yorumu
*"rol henüz çözülmemişken sayfa olduğu gibi render edilir: burada engellemek her gezinmede
boş ekran flaşı yaratır"* diyor. Biri bu ödünü tartmış.

🔍 **Ama tartının bir tarafı eksik ölçülmüş:** ödün "boş ekran flaşı" ile karşılaştırılmış,
oysa gerçekte olan **yanlış ekranın çizilmesi + beş reddedilen istek**. Kaçınılmak istenen flaş
için gereken sinyal zaten mevcut (`useActiveRole.isLoading`) — "rol yok" ile "rol henüz gelmedi"
ayırt edilebilir, kapı yalnız ikincisinde iskelet gösterip bekletebilir.

Güvenlik sınırı değil (gerçek kapı .NET'te), ama **kullanıcıya sahip olmadığı bir yetenek
gösteriliyor.** ⬜ Yazılı bir tercih değiştirileceği için onayın gerekiyor.

### `B-19` · Askıya alınmış hesap ekranındaki tek düğme ölü ⚪
Giriş → askıya alınmış hesap ekranında birincil düğme **"Okul yönetimine yaz"** tıklanabilir
görünüyor ama `onClick`'i yok, hiçbir şey yapmıyor. Ekranın söylediği **tek eylem** bu; kullanıcı
basıyor, hiçbir şey olmuyor ve yönetime nasıl ulaşacağını hâlâ bilmiyor. Mobilde bu düğme yok.

⬜ **Karar:** düğme ne yapmalı — okul e-postasına `mailto:` mı, uygulama içi iletişim ekranı mı,
kaldırılıp metne mi indirgensin? Okulun iletişim adresi giriş yapılmamış oturumda istemcinin
elinde yok, yani `mailto:` bile veri gerektiriyor.

### `D-04` · Veli Portalı duyurular ekranında gereksiz header ❓
**Arandı, bulunamadı.** Veli için duyuru yüzeyi olabilecek her yer tek tek ölçüldü: web'de veli
rolüne duyuru listesi hiç çizilmiyor (*"Duyurular şu an mobil uygulamada"* boş durumu), mobil
gelen kutusundaki tek başlık ise ekranın **tek adı** (sekme gezgininde `headerShown: false`).
`"Veli Portal"` metni iki depoda da hiç geçmiyor.

Yani "gereksiz" olan bir kopya değil; kaldırılırsa ekran **başlıksız** kalır.
⬜ **Netleştirme:** hangi ekranda görüldü? Söylendiğinde bir dakikalık iş.

### `B-24` artığı · "Pasife Al" etiketi ile ürettiği durum uyuşmuyor ⚪
Öğrenci listesindeki **"Pasife Al"** eylemi artık `:withdraw` ucuna bağlı ve kaydı **"Ayrılmış"**
durumuna geçiriyor (domain modeli buna zorluyor: `Archived`, aktif bir öğrenciden değil ancak
mezun/ayrılmış/nakil bir kayıttan sonra gelen saklama adımı). Onay modali sonucu doğru söylüyor
ama **buton etiketi eski adında kaldı.**

⬜ **Karar:** etiket "Ayrılmış Say" / "Kaydı Kapat" gibi bir şeye mi dönsün?

---

## 1. Ölçüldü, kapsamı çıkarıldı — ayrı plan gerektiriyor

### `X-06` geniş ayağı · Sorgu çevirisi 92 handler'da doğrulanmıyor 🟠
EF-`Ignore` edilmiş hesaplanan property'lerin sorguya sızması artık bir **mimari testle**
yakalanıyor — dar ayak kapandı. Geniş ayak açık ve **artık ölçülü**:

| | Adet |
|---|---|
| Toplam query handler | 150 |
| Gerçek sağlayıcıya karşı en az bir testi olan | 58 |
| **Hiç doğrulanmamış** | **92** |

Sebep yapısal: handler birim testleri `MockQueryable` (LINQ-to-Objects) üzerinde koşuyor,
yani **çeviri hatalarına kör**. Bu deseni tam üç kez ısırdık (`B-15`, `X-07`, `X-04`):
**test yeşil, gerçek çağrı kırık.**

Neden bu turda kapatılmadı: 92 handler'a entegrasyon testi yazmak bir düzeltme değil, ayrı
bir iş kalemi. Kapatma yolu da tek değil — her handler'a test mi, yoksa birim testleri
gerçek sağlayıcıya çeviren ortak bir koşum mu? İkincisi tercih edilirse 92'nin tamamı tek
hamlede kapanır. ⬜ **Bu tercihi vermeden başlamak yanlış.**

---

## 2. Park edilenler ve yeni borç

### `TB-63` · Ders programında arkası olmayan iki öğe — teknik borç 🟡
`ENG-02` tasarımında çizilmiş ama **arkası olmayan** iki öğe, `K-11b` kararıyla
çizilmedi ve borç olarak kaydedildi:

- **"Bu derse ödev var" rozeti** (mobil öğrenci ders satırı). Ödev modülü hiç
  yazılmamış — klasörde yalnız *"HENÜZ YAZILMADI, 0 entity"* diyen bir README var
  (`TB-13`). 🔓 **Ödev modülü başlatıldığında hatırlanacak.**
- **"Takvime ekle" (ICS)** butonu (web başlık aksiyonu). Uç yok.
  🔓 Bağımsız; istendiği an yazılabilir. "Yazdır / PDF" aynı ihtiyacı bugün karşılıyor.

Aynı ailede, ders çekmecesinden **düşürülen** iki kısayol: "Bu dersin ödevleri" ve
"Bu dersin notları". Ölçüldü — `/homework` ve `/grades` hem webde hem mobilde
`PlannedScreen` ("Bu ekran henüz boş"). Ekranlar yazıldığında kısayollar geri gelir.

### `TB-29` · Öğretmen kendi müsaitliğini giremiyor 🟡
Öğretmen müsaitliği otomatik üretimin sert ve yumuşak girdisi, ama **tek yazma yüzeyi
yönetici**. Öğretmenin kendi tercihini girebileceği yol yok; yönetici her öğretmeninkini
elle işaretlemek zorunda. Pilotta yönetici yükünü ciddi artırır.

**Ayrıca:** nöbet dağıtımı müsaitliği **gün seviyesine** indirgiyor (bir günde tek engelli
saat varsa günün tamamı kapalı sayılıyor), ders programı ise **saat bazında** okuyor. İki
modül aynı veriyi iki farklı çözünürlükte yorumluyor.

🅿️ Park edilmişti çünkü `ENG-02` ile aynı öğretmen yüzeyini gerektiriyordu.
🔓 **Bu engel 2026-08-17'de kapandı** — öğretmenin web ve mobil program yüzeyi artık var;
müsaitlik girişi oraya oturabilir. Madde **açılabilir hâle geldi**, hâlâ açık.

### `X-03` · Görevlendirme iki nesil hâlinde yan yana yaşıyor 🟠
`TB-48`'in aynı düğümü, çapraz kesen adıyla: ayrı tablo, ayrı izin ailesi
(`teaching-assignments.*` vs `assignments.*`), ayrı sezon kopyalama komutu, ayrı değişim
olayı. `K-10` kararıyla yön belli (v2 + müfredat türetmesi, v1 emekli) ama **emeklilik
tamamlanmadı.** → Kararı yukarıdaki `TB-48` maddesinde.

---

## 3. Ertelenmiş

### `E-13` · Resmî tatil kataloğu dini bayramları taşıyamıyor 🟠
`K-08` kararıyla ertelendi.

---

## Zincirler — hangi madde hangisini bekliyor

```
TB-48 / X-03  ──►  kalan üç v1 tüketicisi (vekâlet · duyuru hedefi · sezon devri)

TB-43 (kanal yok)  ──►  K-02 push fazının ön koşulu

E-01  ◄── rıza sürüm yükseltmesinde patlar
X-11  ──►  CI kapısı yok; kırmızı test hiç koşulmuyor
TB-55 ──►  birleştirme kararı içe aktarma ikiliğini kapatır

ENG-02 ✅ ──►  TB-29 artık açılabilir (öğretmen yüzeyi kuruldu)

TB-13 (ödev modülü) ──►  TB-63'ün ödev rozeti ayağı
```

---

## Not

`TB-##` maddeleri **kod taramasından** çıktı; bir kısmının kullanıcıya görünen belirtisi
olmayabilir — borç oldukları için kayıtlılar. `B-##` · `D-##` · `V-##` · `E-##` maddeleri
ise **ekranda ya da uçta ölçüldü.**

Tekrar eden bir örüntü: **çağrılmayan bir ucun arkasındaki kusurlar da görünmez.** Ekran
yazılır yazılmaz izin eksiği, çeviri anahtarı, katalog boşluğu arka arkaya dökülüyor.
2026-08-17 turunda bunun aynası da çıktı (`TB-32`): **ekranın uyguladığı kural, sunucunun
bilmediği kuraldır** — ekran değişirse ya da ikinci bir istemci gelirse kural yoktur.
Yukarıdaki "ekran yok" maddelerini planlarken ikisine birden yer ayır.
