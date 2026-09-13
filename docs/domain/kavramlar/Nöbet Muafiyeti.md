---
aliases: [DutyExemption, Nöbet Muafiyeti Kaydı]
tags: [domain/academic]
table: academic.duty_exemptions
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Nöbet Muafiyeti

<!-- generated:start -->

## Nedir

Bir öğretmenin nöbet tutmaktan muaf olduğunu söyleyen kayıt. MEB uygulamasında yaygındır: idari görevi olan, sağlık durumu uygun olmayan ya da belirli bir dönem izinli olan öğretmen nöbet listesine girmez.

İki tip vardır: **sürekli** (tarihsiz, süresiz) ve **geçici** (tarih aralığına bağlı).

## Yaşam döngüsü

Açılır ve kaldırılır. Geçici muafiyet aralığı geçtiğinde kendiliğinden etkisiz hâle gelir; ayrı bir kapatma adımı yoktur — kapsayıp kapsamadığı sorulduğunda tarihe bakılır.

## Kurallar

- **Gerekçe zorunludur.** Muafiyet sessizce verilemez; kim neden muaf, kayıtta durur.
- Geçici muafiyette başlangıç ve bitiş tarihi zorunludur ve başlangıç bitişten sonra olamaz.
- Sürekli muafiyette tarihler tutulmaz — verilse bile temizlenir.
- Muaf öğretmene nöbet atanamaz ve dağıtım havuzuna girmez; bu [[Nöbet Çizelgesi]]'nin dört değişmezinden biridir.

## Hangi yüzey hangi muafiyeti okur

Muafiyetin etkisi yüzeyden yüzeye farklı tarih okur; fark bilinçlidir ama yeni gelen için tuzaktır:

- **Elle çizelge taslağı** — yalnız **sürekli** muafiyet atamayı engeller. Çizelge haftalık tekrar eden bir şablondur; tarihe bağlı geçici muafiyet şablona uygulanmaz.
- **Yancı aday listesi** — yalnız **sürekli** muafiyeti dışlar, tarihe bakmaz.
- **Otomatik dağıtım** — sürekli muafiyeti ve **dönemle örtüşen geçici** muafiyeti havuzdan çıkarır. Dağıtım belirli bir döneme bağlandığı için tarih-duyarlı dışlamayı bilinçli olarak ekler.
- **Nöbet yükü raporu** — sürekli muafiyeti ya da rapor aralığıyla örtüşen geçici muafiyeti olan öğretmeni yük tablosundan çıkarır ve ayrı bir muafiyet listesinde gösterir. Ataması olduğu hâlde **sonradan muafiyet verilmiş** öğretmen de tablodan çıkar — adalet ölçüsü muaf öğretmeni ortalamaya katıp dengeyi bozmasın diye (bkz. [[Nöbetler]] → Nöbet yükü).

## İlişkiler

- [[Nöbet Çizelgesi]] — atamayı engelleyen taraf
- [[Profil]] — muafiyetin öznesi; öğretmen profili

## Geçtiği modüller

- [[Nöbetler]] — kavramın sahibi; muafiyet verme, kaldırma, listeleme; dağıtım ve yük raporunda dışlama

## Açık Sorular (koddan doğrulanamayan)

- Elle taslakta geçici muafiyet için "tarihe göre tüketimde uygulanır" deniyor, ama yayınlanmış çizelgenin tüketildiği noktada (öğretmenin nöbet görünümü, günlük pano) geçici muafiyeti uygulayan bir kontrol bulunamadı. Geçici muaf öğretmen elle atanırsa o tarihlerde nöbetçi görünmeye devam mı ediyor?

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Muafiyet dönem veya sezona bağlı değil, tenant düzeyinde duruyor. Sürekli muafiyet yıl geçince de taşınıyor mu, yoksa her yıl yeniden mi verilmeli?
- Yayınlanmış bir çizelgede nöbetçi olan öğretmene sonradan muafiyet verilirse mevcut atamalara ne oluyor? Kaldırma tarafında bir denetim görünmüyor.
