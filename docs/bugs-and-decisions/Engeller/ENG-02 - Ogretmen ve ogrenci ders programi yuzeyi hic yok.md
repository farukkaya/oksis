# ENG-02 · Öğretmen ve öğrencinin ders programı yüzeyi **hiç yok**

> **Ne zaman çıktı:** 2026-08-11, ekran testi turunun ikinci yarısı.
> **Neyi engelledi:** `D-07`'yi ("Öğretmen görünümü mobilde bozuk") kapatmayı.
> **Nerede yaşıyor:** `oksis-ui` · `apps/web/features/schedule/schedule-page.tsx` + `packages/core/src/nav/nav-config.ts`
> **Defterdeki maddeleri:** `D-07` (asıl bulgu) ve `B-17` (bu ölçümde doğan yeni bulgu)
> **Durum:** 🔴 Açık — düzeltilmedi. Düzeltmesi **kullanıcı kararı** istiyor (aşağıda iki seçenek).

---

## Neyi test etmeye gittim, ne buldum

`D-07` defterde tek cümleydi: *"Ders Programı öğretmen görünümü mobil ekrana göre
tasarlanmış ama responsive değil."* Bunu bir CSS bulgusu sanıyordum — dar ekranda
tablo taşıyordur, bir `overflow-x` kuralıyla kapanır diye.

Ölçmek için `ogretmen.s2.01@oksis.local` ile girdim ve `/schedule`e gittim. Ekranı
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

## `D-07` neden bir CSS düzeltmesiyle kapanmaz

Bulgu "responsive değil" diyor ve bu **doğru** — ama düzeltilecek şey yanlış ekran.
Yönetim konsolunu mobilde düzgün akıtmak, öğretmene **göstermemesi gereken** bir
ekranı daha güzel göstermek olurdu. Bulgunun altında yatan gerçek ihtiyaç şu:
*öğretmen kendi haftalık ders çizelgesini görebilmeli.* O ekran yok.

Yani `D-07` bir **hata** değil, üstü hatayla örtülmüş bir **eksik özellik**.

---

## İki seçenek — karar sizin

### Seçenek A · Öğretmen/öğrenci ders programı ekranını yaz (doğru çözüm)
Kendi haftalık çizelgesini gösteren salt-okunur bir ekran. Yayınlanmış sürümden
beslenir. Sunucu tarafı **zaten hazır**: `GetPublishedSchedules` sorgusu ve
`ScheduleVersion` snapshot'ı çalışıyor (bkz. `TB-27` kapanışı). Yani iş esas olarak
FE ekranı + rol dallanması.
- ➕ `D-07` ve `B-17` birlikte kapanır, kullanıcıya vaat edilen özellik gerçekten gelir.
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
İkisi de sizin kapsam kararınız. Ölçümü kayda geçirdim, `B-17` ve `X-08`'i açtım,
`D-07`'yi buraya bağladım ve tura devam ettim.
