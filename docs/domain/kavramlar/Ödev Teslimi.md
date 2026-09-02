---
aliases: [HomeworkSubmission, Teslim Dosyası, Ödev Yükleme, Teslim]
tags: [domain/academic]
table: academic.homework_submission
status: active
last-synced: 2026-09-03 (b72c819)
---

# Ödev Teslimi

<!-- generated:start -->

## Nedir

Öğrencinin bir ödeve yüklediği tek dosya — [[Ödev Takibi]] satırının çocuğu. Teslim "ödev × öğrenci" kesişimine aittir, ödevin kendisine değil; doğrudan ödeve bağlansaydı her satır öğrenci kimliğini ayrıca taşır ve takip satırıyla tutarlılığı elle korunurdu.

**Dosyanın kendisi burada durmaz.** Ödev modülü dosya depolamaz; [[Saklı Dosya]] kimliğini bağlar, adı ve içerik türünü liste tek sorguyla çizilsin diye kopyalar. Kategorisi ([[Dosya Kategorisi]]) öğretmen ekininkinden ayrıdır: öğrenci teslimi ile öğretmenin çalışma kâğıdının saklama ve tarama politikaları farklıdır, kategori kontrolü olmasaydı öğrenci öğretmenin ekini kendi teslimi diye bağlayabilirdi. Documents tarafındaki bağ tipi de ayrıdır ("HomeworkSubmission"); aynı olsaydı idari kaldırma hangi bağın kimin dosyası olduğunu ayırt edemezdi.

## Yaşam döngüsü

**Yükleme** yalnız yayındaki ödeve ve yalnız öğrencinin **kendisi** tarafından yapılır; veli yükleyemez. İzin okuma iznidir, kapı kimlik eşleşmesidir: ödev bu öğrenciye verilmemişse 404 (tüm-sınıf hedefli yayındaki ödevde satır ilk teslimde doğar). Sıra bilinçlidir: önce öğrencinin ödevle ilişkisi, sonra dosya kapıları, en son ödevin teslime açık olup olmadığı — aksi hâlde başka şubenin kapanmış ödevine istek "kapalı" diyerek varlığını sızdırırdı.

**Kaldırma yumuşaktır,** öğrencinin kendi silmesi dâhil: satır kalır, kaldıran ve an yazılır, erişim kapanır. Öğrenci "dosyam kayboldu" demez; idare kimin neyi ne zaman kaldırdığını görür. Öğrencinin kendi kaldırması gerekçesizdir; idarenin kaldırması gerekçelidir ve denetim izine yazılır. İkinci kaldırma 409 — sessizce yutulsaydı idari kaldırma öğrencininkinin üstünü örterdi. Bu yumuşak kaldırma, altyapının yumuşak silmesinden ayrı bir kavramdır: biri öğrencinin kararı, diğeri imhadır.

Kapanmış ya da iptal edilmiş ödevde yükleme **ve** kaldırma 409'dur; idari kaldırma da aynı kapıdan geçer (açık soru).

## Kurallar

- **Kota: öğrenci başına 5 aktif dosya.** Kaldırılmış dosya yer tutmaz, yoksa "kaldır → yeniden yükle" beş denemeden sonra kilitlenirdi. Sınır sunucuda yaşar ve istemciye verilir; kota aşımı 409'dur, doğrulama hatası değil — istek kusursuzdur, yapılacak iş bir dosya silmektir.
- **Tekillik yoktur:** aynı dosya kaldırılıp yeniden yüklenebilir, aynı dosya iki kez bile bağlanabilir; sınırı kota koyar.
- Dosya kimliği üç kapıdan geçer: var olmalı, sahibi öğrenci olmalı, kategorisi teslim olmalı.
- İçerik türü kırpılmaz, uzunsa reddedilir; kırpılmış tür yanlış ikon çizer. Ad kırpılabilir.
- **Teslim sayacı öğrenci sayar:** üç fotoğraf yükleyen öğrenci birdir.
- **Yükleme bildirim üretmez** ve bu kasıtlıdır: 30 kişilik sınıfta akşam 30 bildirim olurdu; öğretmen ızgarada sayıyı görür.
- Rehber öğretmen teslim içeriğini görmez; veli görür ama yükleyemez ve veli şemasında "yükleyebilir" alanı **hiç yoktur** — alanın varlığı bile bir iddiadır.
- Tekil teslimin kendi okuma ucu yoktur; dosya ödev detayının teslim listesinden okunur.
- Teslimin **notlandırılması yoktur;** öğretmenin kararı takip satırındaki beş durumdur.

## İlişkiler

- [[Ödev Takibi]] — sahip; kota satırın invariantıdır
- [[Ödev]] — durum kapısı (teslime açık mı)
- [[Saklı Dosya]] / [[Dosya Bağı]] / [[Dosya Kategorisi]] — dosya, bağ tipi ve kategori
- [[Kişi]] — yükleyen öğrenci, kaldıran
- [[Veli-Öğrenci İlişkisi]] — velinin görme kapsamı

## Geçtiği modüller

- [[Ödevler]] — kavramın sahibi; yükleme, öğrenci kaldırması, idari kaldırma
- [[Dosya Yönetimi]] — teslim dosyasının erişim çözümleyicisi

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- **İdare kapanmış ödevin yanlış yüklenmiş dosyasını kaldıramaz** (409). İkinci bir kaldırma yolu aynı kuralı iki yerde ayrıştıracağı için gevşetilmedi; karar noktası (defter: `TB-110`).
