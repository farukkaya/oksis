---
tags: [saha-testi, altinay, odev, dosya, bildirim]
---

# Altınay — 4 Ekim 2026 Ödev Saha Testi Bulguları

**Tarih:** 4 Ekim 2026, Pazar · 00:30–sabah (okul saatiyle; kullanıcı uyurken, gece turu)
**Kapsam:** Öğretmen ödev verdikten sonra yönetim, veli, öğrenci ve rehber yansımaları; dosya yükleme (öğretmen eki + öğrenci
teslimi); web ve mobil ayaklar; bildirimler (yayın, güncelleme, iptal, hatırlatma, eksik — anlık ve günlük özet); izinli/izinsiz
durumlar (rol yetkisi, kapsam dışı erişim, kişisel push tercihi, telefon bildirim izni).
**Ortam:** Yerel dev · oksis-api ve oksis-ui `fix/odev-ekran-turu` · Altınay (`ALTINAY-AL`)
**Yüzeyler:** Web (`/homework`, `/reports?report=odev`), mobil (Expo web, 402×874), API betiği (rol başına belirteç), DB ölçümü,
Hangfire (`homework-due-reminder`, `homework-missing-digest` elle tetiklendi).
**Ana kayıt:** Bulguların tam metni [[OKSİS - Bulgu Kayıt Defteri]] §10'da; bu belge testin özetidir.
Test başlığı satırı: [[Altınay — Yaşam Döngüsü Test Başlıkları]] `C2.3`.

> **Kişisel veri:** Depo herkese açık. Öğretmen, öğrenci ve veliler rolüyle anılır.

---

## 1. Senaryo ve oyuncular

| Rol | Kim | Ne yaptı |
|---|---|---|
| Öğretmen | Matematik öğretmeni — 9-A ve 10-A Matematik (+ Deneme, Rehberlik, Seçmeli/TYT Matematik) | Çoklu şubeye ekli ödev, seçili öğrenci ödevi, web + mobil yayın, işaretleme, toplu tamamlama, güncelleme, iptal, kapatma |
| Öğrenci 1 | 10-A öğrencisi (iki velili) | Liste/detay, 5 dosya kotası, kaldırma, yasak tür, sahte dosya, EICAR, kapalı/iptal ödeve teslim |
| Öğrenci 2 | 10-A öğrencisi (tek velili) | Başkasının dosyasını kullanma, başkasının teslimini silme |
| Veli 1 / Veli 2 | Öğrenci 1'in iki velisi | Aile listesi/detay; biri ödev push'unu KAPATTI, diğeri açık bıraktı (sahte cihaz belirteçleriyle) |
| Rehber | 10-A rehber öğretmeni (İngilizce) | Rehber listesi, salt okunur detay, dosya erişimi |
| Yabancı öğretmen | 10-B Matematik öğretmeni | Başkasının ödevine erişim, işaretleme, kapatma |
| Yabancı öğrenci | 10-B öğrencisi | Ek dosyasına erişim |
| Müdür | Okul müdürü | Okul geneli liste, pano, kontrol bekleyenler, idari teslim kaldırma, politika (anlık/özet kipi), işaretleme |

## 2. Özet

| | Sayı |
|---|---|
| Verilen ödev | 6 (biri iki şubeye → 2 kayıt; biri seçili öğrenci; biri web'den ekli; biri mobilden) |
| Yeni bulgu | **21** — 🔴 1 · 🟠 4 · 🟡 10 · ⚪ 6 *(ayrıntı defterde)* |
| Aynı gece kodda düzeltilen | 16 (+ `D-51` kısmen) — merge bekliyor |
| Karar adayı | 2 — `K-31`, `K-32` |

**En önemli üç sonuç:**
1. **Gerçek okulda öğretmenlerin neredeyse hiçbiri ana dersine ekrandan ödev veremiyordu** (`B-102` 🔴): form alfabetik ilk dersi
   açıyordu; 19 öğretmenin 18'i "Deneme/Rehberlik/Koçluk" okuttuğu için Matematik öğretmenine "Deneme · 12-B" düştü.
2. **Öğretmen öğrencinin yüklediği fotoğrafı göremiyordu** (`B-107` 🟠): teslim görüntüleyicileri mock döneminden kalma yer
   tutucuydu. Dosya güvenliğinde iki açık: içerik imzasına bakılmıyordu (`V-05`), virüslü teslim listede kalıyordu (`B-103`).
3. **İptal ve güncelleme sessizdi** (`B-105`): analizin açıkça istediği "ödev iptal edildi / güncellendi" bildirimleri yoktu.

## 3. Doğru çalışanlar (ölçüldü)

- **Kapsam izolasyonu:** başka şubenin öğrencisi, başka çocuğun velisi, yabancı öğretmen detay/ızgara/kapatma/işaretleme → 404;
  öğrenci öğretmen ucunda 404; öğrenci ödev oluşturma 403; öğretmen yönetim listesi/pano/politika 403.
- **Dosya erişimi:** öğretmen eki — sınıf öğrencisi, veli, rehber, müdür açar; yabancı öğretmen ve 10-B öğrencisi 404. Teslim —
  sahibi öğrenci ve velisi açar; sınıf arkadaşı ve rehber 404 ("rehber yükleme içeriğini görmez" kuralı).
- **Teslim kuralları:** 5 dosya kotası (6. → 409), kaldırınca yer açılıyor, ikinci kaldırma 409, başkasının dosya kimliğiyle
  teslim 400, öğretmen ekini teslim gibi bağlama 400, veli teslim edemez (404), kapanmış/iptal ödeve teslim 409, `.exe` ve HEIC 422.
- **Bildirim alıcıları:** yayın = hedef öğrenciler + bütün velileri (14 + 24 = 38); seçili öğrenci hedefinde yalnız 2 öğrenci + 3
  veli; hatırlatma işi yalnız seçili hedefe, ikinci tetiklemede yinelenmedi; anlık eksik yalnız veliye, aynı işaret tekrarında
  ikinci haber yok; günlük özet veli başına tek bildirim.
- **Kişisel push tercihi (izinli/izinsiz):** ödev push'unu kapatan veliye push denemesi yapılmadı, açık velinin cihazına denendi
  (sahte belirteç → `InvalidArgument`); ikisi de uygulama içi bildirimi aldı. Push kapsamı dışındaki `HOMEWORK_MISSING` tercihi 400
  — `K-02` kararıyla tutarlı (eksik ödev bilinçli olarak push dışında).
- **Yaşam döngüsü:** taslak → yayın; geçmiş tarih yayında 400; iptal gerekçesi < 15 → 400; iptal edilmiş/kapanmış ödev
  düzenlenemez; yalnız taslak silinir; kapanmış ödevde işaretleme 409.
- **İdari:** müdürün işaretlemesi (`TB-109` kararı), idari teslim kaldırma gerekçeli (< 15 → 400) ve denetime yazılıyor; öğretmen
  idari kaldırma yapamaz (403).
- **Pano:** Pazar günü geçen haftayı açıyor — kodda gerekçeli tasarım ("hafta sonu biten haftanın kuyruğudur"); ileri okla bu
  hafta doğru sayıyor.
- **Mobil (Expo web):** bildirime dokununca ödev detayı açıldı (derin bağlantı); öğrenci galeriden yükledi, "bugün" etiketi;
  veli listesi tasarıma uygun (durum etiketi son tarihten önce yok); mobil öğretmen ders seçicili formla yayınladı, işaretledi,
  toplu tamamladı.

## 4. Bulgular

| ID | Öncelik | Başlık | Durum |
|---|---|---|---|
| `B-102` | 🔴 | Çok dersli öğretmen formda yalnız alfabetik ilk dersi görüyor | ✅ kodda · ekranda ölçüldü |
| `B-103` | 🟠 | Virüslü teslim listede kalıyor, kotadan yiyor | ✅ kodda · birim testli |
| `V-05` | 🟠 | İçerik imzası denetlenmiyor (`.jpg` adlı EXE) | ✅ kodda · canlı 422 |
| `B-105` | 🟠 | İptal ve güncelleme bildirimi yok | ✅ kodda · canlı ölçüldü |
| `B-107` | 🟠 | Teslim dosyası hiçbir yüzeyde açılmıyor | ✅ kodda · mobil görüntüleyicide gerçek dosya ölçüldü |
| `B-104` | 🟡 | Tarih etiketleri UTC gününden ("dün") | ✅ kodda · canlı "bugün" |
| `B-106` | 🟡 | Eksik bildirimlerinde derin bağlantı yok | ✅ kodda |
| `B-108` | 🟡 | Öğretmen şube süzgeci sabit mock şubeleri | ✅ kodda |
| `V-06` | 🟡 | Seçili öğrenci hedefine başka şubenin öğrencisi giriyor | ✅ kodda |
| `D-47` | 🟡 | Kalıcı dosya reddi "Tekrar dene" ile sunuluyor | ✅ kodda |
| `D-48` | 🟡 | Türkçe iyelik eki elle "'in" | ✅ kodda |
| `E-36` | 🟡 | Mobilde "PDF seç" yok | ⬜ yerel modül + derleme gerekiyor |
| `E-37` | 🟡 | Rehber öğretmenin şube ödev listesi yok | ✅ kodda · ekranda ölçüldü |
| `E-38` | 🟡 | Kişisel bildirim tercihi / telefon izni ekranı yok | ✅ kodda · ekrandan açılan tercih DB'ye yazıldı |
| `TB-269` | 🟡 | Push tercih listesi role göre süzülmüyor | ⬜ sunucu |
| `D-49` | ⚪ | PDF teslimleri resim ikonuyla | ✅ kodda · ekranda ölçüldü |
| `D-50` | ⚪ | Yönetici listesinde şube çipi kırılıyor | ✅ kodda |
| `D-51` | ⚪ | Şubeler sözlük sırasıyla (9-A en sonda) | 🟡 ödev ekranlarında kodda; diğer modüller aranmadı |
| `TB-268` | ⚪ | İmzalı adres hep `attachment` — PDF önizlenemiyor | ⬜ |
| `TB-266` | ⚪ | Kip değişiminde aynı eksik iki kez bildiriliyor | ⬜ |
| `TB-267` | ⚪ | Son teslim değişikliği denetime yazılmıyor | ⬜ |

**Karar adayları:** `K-31` — öğrenci/veli ödev yüzü web'de de olsun mu (analiz "yalnız mobil" diyor; web bugün "hazırlanıyor"
kabuğu gösteriyor); `K-32` — iptal gerekçesi aileye gösterilsin mi (domain notu "görünür", tasarım ve kod "görünmez").

**Gözlem (bulgu değil):** domain notu ([[Ödevler]]) "işaretleme yalnız sahibe açık" diyor ama `TB-109` (2026-09-16) kararıyla idare
de işaretliyor — not bayat, `domain-map` turunda güncellenmeli.

## 5. Test artıkları

- Altınay'da 6 test ödevi duruyor (10-A: "Fonksiyonlar — alıştırma seti 1", "Türev giriş — çalışma kağıdı 2", iptal edilmiş
  "Bildirim tercihi deneme ödevi"; 9-A: "Fonksiyonlar — alıştırma seti 1", kapanmış "Telafi: denklemler", "Mobil deneme: kümeler
  tekrar"). İki taslak silindi.
- Okulun eksik ödev bildirim kipi denendi (anlık ↔ günlük özet), **günlük özete geri alındı** (varsayılan).
- Öğrenci 1'in iki velisine sahte push cihazı kaydedilmişti (`deviceModel = OdevTest`) — test sonunda ürün ucundan kaldırıldı
  (`is_active = 0`). Veli 1'in ödev push tercihi önce API'den kapatıldı, sonra yeni ekrandan yeniden AÇILDI.
- Öğrenci 1'in 10-A ödevinde 4 teslim (biri idari kaldırıldı, biri virüs testi), 10-A ikinci ödevde 1 teslim.
