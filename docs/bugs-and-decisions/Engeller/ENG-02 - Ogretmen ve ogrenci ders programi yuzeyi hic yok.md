# ENG-02 · Öğretmen ve öğrencinin ders programı yüzeyi **hiç yok**

> **Ne zaman çıktı:** 2026-08-11, ekran testi turunun ikinci yarısı.
> **Nerede yaşıyor:** `oksis-ui` · `apps/web/features/schedule/schedule-page.tsx` + `packages/core/src/nav/nav-config.ts`
> **Defterdeki maddesi:** `B-17`
> **Durum:** 🟠 **Karar verildi (B), yüzey hâlâ yok.** 2026-08-12: kullanıcı **Seçenek B**'yi seçti;
> `/schedule` öğretmen ve öğrenci menüsünden kaldırıldı (`oksis-ui` @ `c030022`) ve `B-17` kapandı.
> **Bu engel kapanmadı:** öğretmenin/öğrencinin kendi programını görebileceği ekran hâlâ yazılmadı.

---

## ⚠️ ÖNCE BİR DÜZELTME — bu dosya baştan yanlış çerçeveyle yazıldı

Bu dosyanın ilk hâli *"`D-07`'yi kapatmayı engelliyor"* diyordu. **Yanlıştı.**

`D-07` defterde *"Öğretmen görünümü mobilde bozuk — mobil ekrana göre tasarlanmış ama
responsive değil"* diye yazılmıştı. Ben bunu **öğretmen ROLÜNÜN** ekranı sanıp
`ogretmen.s2.01` ile giriş yapıp 390 px'te ölçtüm.

Kullanıcının kastettiği tamamen başka bir şeydi (2026-08-11'de düzeltti):

> Okul müdürü Ders Programı modülünde bir programı açtığında, tüm öğretmenleri kapsayan
> hâli yerine **tek bir öğretmenin haftalık dağılımını** görmek için eklenmiş
> **Öğretmen Görünümü** sekmesine tıklayınca ekran bozuk genişlikte açılıyor.
>
> Ayrıca: **bu ekranda responsive olma hedefi yok.** İleride bir de **Şube Görünümü** eklenecek.

Yani `D-07` yöneticinin **editöründeki** bir sekme; mobil ve responsive konunun içinde
hiç yok. Doğru ekranda ölçüldü, kök nedeni tek satırdı ve **kapandı**
(`oksis-ui` @ `341ab18`) — ayrıntısı defterdeki `D-07` maddesinde.

**Peki bu dosya neden duruyor?** Çünkü yanlış turda ölçtüğüm şey de **gerçek** bir bulgu
çıktı ve kendi ayakları üzerinde duruyor: öğretmen ve öğrenci `/schedule`e girince
yöneticinin yönetim konsolunu görüyor. O bulgu `B-17`'dir ve hâlâ açıktır. Aşağıdaki
ölçümlerin tamamı ona aittir — `D-07` ile ilgisi yoktur.

---

## Nasıl bulundu (yanlış turun doğru ölçümü)

Yukarıda anlatılan yanlış okuma yüzünden `ogretmen.s2.01@oksis.local` ile girip
`/schedule`e gittim ve dar ekranda bir CSS taşması arıyordum. Aradığım şey orada
değildi; başka bir şey vardı.

Ekranı
390 px genişliğe daralttım. Gerçekten de yatay kayıyordu: sayfa gövdesi **947 px**,
görünen alan **487 px**, 33 ayrı öğe sağ kenarı aşıyordu.

**Ama taşan şeyin ne olduğuna bakınca asıl sorun ortaya çıktı.** Taşan öğeler
şunlardı:

```
div.page          → "Ders Programı — Sınıf, öğretmen ve derslik programlarını …"
div.ph-actions    → "Öğretmen Müsaitliği  Otomatik Oluştur  Yeni Program"
button.pr-btn     → "Öğretmen Müsaitliği"
button.pr-btn     → "Otomatik Oluştur"
```

Öğretmen, **okul yöneticisinin ders programı yönetim konsolunu** görüyordu.

---

## Ekranda ne yazıyor (birebir)

Öğretmenin ve öğrencinin gördüğü sayfa:

- **Başlık:** "Ders Programı"
- **Alt başlık:** *"Sınıf, öğretmen ve derslik programlarını **oluşturun, doğrulayın ve yayınlayın**."*
- **Butonlar:** `Öğretmen Müsaitliği` · `Otomatik Oluştur` · **`Yeni Program`** (birincil, mavi)
- **Tablo başlıkları:** SINIF/ŞUBE · KADEME · DURUM · ÇAKIŞMA · EKSİK SAAT · MÜSAİTLİK · YERLEŞİM · SON GÜNCELLEME · SÜRÜM · **İŞLEM**

Yani öğrenciye, okulun **bütün şubelerinin** programını oluşturma, otomatik üretme
ve yayınlama yeteneği duyuruluyor. ![[B-17-ogrenci-yonetim-konsolu.png]]

**Öğrencide ayrıca kenar çubuğu bomboş** ve okul adı yerine geliştirme yedeği
("Atlas Koleji · Kadıköy") duruyor — okul bilgisi ucu yalnız yöneticiye açık
olduğu için (bu, `app-shell.tsx`'te zaten yazılı bilinçli bir yedek).

---

## Veri sızıyor mu? **Hayır.** Ama kullanıcıya söylenen şey yanlış.

Sayfanın attığı istekleri tek tek ölçtüm (öğretmen oturumu, `mudur.s2` okulu):

| İstek | Sonuç |
|---|---|
| `GET /api/v1/timetable/programs?termId=…` | **403** |
| `GET /api/v1/school-settings/grade-levels` | **403** |
| `GET /api/v1/users/persons?profileType=Teacher&pageSize=200` | **403** |
| `GET /api/v1/class-rooms` | **403** |
| `GET /api/v1/class-rooms?sessionId=…` | **403** |

Sunucu kapısı **sağlam**: beş yönetim ucunun beşi de reddediyor. Öğretmen tek bir
şubenin programını bile göremiyor.

**Ama ekranda görünen mesaj bu değil.** Ekranda şu yazıyor:

> **Programlar yüklenemedi.**
> Sunucuya ulaşılamadı. Bağlantınızı kontrol edip yeniden deneyin.
> `[Yeniden Dene]`

Yani **yetki reddi, ağ arızası diye gösteriliyor.** Öğretmene "internetin bozuk,
tekrar dene" deniyor; oysa kaç kere denerse denesin sonuç değişmeyecek. Bu ayrı bir
bulgu olarak açıldı: **`X-08`**.

---

## Kök neden — üç satır

1. `packages/core/src/nav/nav-config.ts` içinde `/schedule` **üç rolün** menüsünde
   var: `adminGroups` (101. satır), `teacherGroups` (146), `studentGroups` (161).
2. `apps/web/features/schedule/schedule-page.tsx` içinde **rol kelimesi hiç geçmiyor**
   — `activeRole` okunmuyor, hiçbir dal yok. Sayfa herkese aynı yönetim konsolunu
   çiziyor.
3. Öğretmen/öğrenci için **bir ders programı ekranı hiç yazılmamış** — ne web'de
   (`features/schedule/` altındaki 13 dosyanın hepsi yönetim yüzeyi), ne mobil
   uygulamada (`apps/mobile/src` altında ders programı ekranı yok).

Karşılaştırma için: **duyurular modülü bu işi doğru yapıyor.** `AnnouncementsScreen`
rolü okuyup öğretmeni kendi yüzeyine, veli/öğrenciyi ayrı bir duruma ayırıyor ve
gerekçesini dosyanın başına yazmış. Ders programında o ayrım hiç kurulmamış.

---

## Bu neden bir "yüzey" meselesi, bir hata değil

Öğretmenin ve öğrencinin menüsünde `/schedule` var, yani sistem onlara bu özelliği
**vaat ediyor**. Ama arkasında onlara ait bir ekran yok; vaat, yöneticinin konsoluna
çıkıyor ve orada da beş uçtan 403 alıyorlar.

Altta yatan gerçek ihtiyaç şu: *öğretmen kendi haftalık çizelgesini, öğrenci kendi
sınıfının çizelgesini görebilmeli.* O ekran hiç yazılmamış.

---

## İki seçenek — karar sizin

### Seçenek A · Öğretmen/öğrenci ders programı ekranını yaz (doğru çözüm)
Kendi haftalık çizelgesini gösteren salt-okunur bir ekran. Yayınlanmış sürümden
beslenir. Sunucu tarafı **zaten hazır**: `GetPublishedSchedules` sorgusu ve
`ScheduleVersion` snapshot'ı çalışıyor (bkz. `TB-27` kapanışı). Yani iş esas olarak
FE ekranı + rol dallanması.
- ➕ `B-17` kapanır ve menüde vaat edilen özellik gerçekten gelir.
- ➖ Yeni ekran demek: tasarım kararı (mobil önce mi, hangi hücre bilgisi), ~1 dilimlik iş.

### Seçenek B · Yüzey gelene kadar menüden kaldır (geçici, dürüst)
`/schedule` öğretmen ve öğrenci menüsünden çıkarılır.
- ➕ Bugün 15 dakikada biter; kimse yönetim konsoluna düşmez, kimseye yalan mesaj gitmez.
- ➖ Öğretmen bugün de programını göremiyor (zaten göremiyor), ama artık menüde de
  görünmüyor — özelliğin "kaldırıldığı" izlenimi doğabilir.

**Önerim: A.** Sunucu ayağı hazır olduğu için iş sanıldığından küçük, ve B zaten
A'ya giden yolda atılmış bir adım değil — atılıp geri alınacak bir adım.

---

## Bu arada ne yaptım

Hiçbir şeyi kendi kararımla değiştirmedim — ne menüyü budadım ne de ekran yazdım.
İkisi de sizin kapsam kararınız. Ölçümü kayda geçirdim, `B-17` ve `X-08`'i açtım ve
tura devam ettim.

`X-08` (403'ün "ağ arızası" diye gösterilmesi) bu turun yan ürünüydü ve **kapandı** —
o, yüzey kararından bağımsızdı: hangi seçenek seçilirse seçilsin, bir yetki reddinin
kullanıcıya "internetini kontrol et" dememesi gerekiyordu.

---

## Karar ve bugünkü durum — 2026-08-12

**Kullanıcı Seçenek B'yi seçti:** ekran bu turda yazılmayacak, menüden kaldırılacak.

**Yapılan:** `/schedule` `teacherGroups` ve `studentGroups` nav setlerinden çıkarıldı.
Rota da kendiliğinden kapandı — `RouteGuard` nav'ın kendisini kaynak alıyor
(`canAccessRoute`), yani ayrıca bir sayfa kapısı yazmak gerekmedi. *(Önce yazılmıştı;
ölçümde `RouteGuard`'ın işi zaten yaptığı görülünce geri alındı.)*

**Ekranda doğrulandı:** öğretmen ve öğrencide menüde yok, adres elle yazılınca
*"Bu sayfaya erişemezsiniz"*; yöneticide konsol regresyonsuz çalışıyor.

**Kapanmayan taraf — bu dosyanın konusu:**
Öğretmen kendi haftalık programını, öğrenci kendi şubesinin programını **hâlâ hiçbir
yerden göremiyor**. Menü budaması yüzey ihlalini kapattı, **ihtiyacı değil**. Sunucu
ayağı hazır (yayın snapshot'ı ve tüketici sorguları çalışıyor — bkz. `TB-27`); eksik
olan yalnız ekran. Ekran yazıldığında nav satırı **kendi rotasıyla** geri gelir; bu
yüzden kaldırılan satırın yerine gerekçesi koda yazıldı.

**Mobil kapsam dışı:** oradaki "Program"/"Programım" kutucukları `href` taşımadığı için
"yakında" ekranına düşüyor — yani mobil zaten dürüst davranıyor.
