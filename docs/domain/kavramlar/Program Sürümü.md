---
aliases: [ScheduleVersion, Yayın Snapshot'ı]
tags: [domain/academic]
table: academic.schedule_versions
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Program Sürümü

<!-- generated:start -->

## Nedir

Bir [[Ders Programı]] yayınlandığı anda alınan **değişmez kopyası**. Yayın tarihini, yayınlayanı, isteğe bağlı bir notu ve o andaki tüm yerleşimlerin dondurulmuş hâlini taşır.

Kavramın varlık sebebi şu: öğretmen, öğrenci ve veli programın **canlı hâlini değil, son yayınlanmış hâlini** görür. Yönetici programı düzenlemeye başladığında ekranlar anında değişmez — yeni sürüm yayınlanana kadar herkes eski kopyayı görmeye devam eder. "Yarım kalmış düzenleme kimsenin ekranına yansımasın" kuralı bu ayrımdan doğar.

## Yaşam döngüsü

Yazılır, bir daha değişmez. Her yayın yeni bir sürüm satırı üretir; sürümler tek tek silinmez, program yaşadığı sürece yayın geçmişini oluşturur.

**Tek istisna programın silinmesidir:** [[Ders Programı]] silindiğinde o programın bütün sürümleri — ve bütün [[Program İstisnası]] kayıtları — programla birlikte **yumuşak silinir** (kayıt işaretlenir, fiziksel olarak kalkmaz). Yani yayın geçmişi programdan bağımsız yaşamaz.

## Kurallar

- Sürüm numarası 1'den küçük olamaz ve program başına tekildir.
- Boş snapshot yazılamaz; en az bir yerleşim içermelidir (boş program zaten yayınlanamaz).
- Yayınlanan sürüm numarası kaydın kendisinden değil, **yayın geçmişinden** türetilir — yeniden yayında numara çakışmasın diye.
- Geçmiş bir sürüme dönülebilir: o snapshot'tan program yeniden kurulur, mevcut aktif yerleşimler pasifleşir, blok grupları yeniden oluşturulur ve program **Revize** durumuna geçer. Dönüş yeni bir yayın değildir; yayınlanması ayrı adımdır.
- **Geri dönüş bildirim üretmez.** Yeni sürüm doğmadığı için tüketici değişikliği ancak bir sonraki yayında görür; o yayın kendi bildirimini taşır.
- Snapshot içindeki gün değerleri de gerçek takvim günüdür (Pazartesi=1 … Cuma=5). Gün değeri hizalanırken yayınlanmış snapshot'lar da aynı taşımayla kaydırıldı — aksi hâlde eski programlar tüketicide bir gün kaymış görünürdü. Bkz. [[0013-gun-degeri-gercek-system-dayofweek]].

## İlişkiler

- [[Ders Programı]] — sürümün kaynağı; silinirse sürümler de birlikte yumuşak silinir
- [[Şube]] / [[Dönem]] — sürüm hangi şubenin hangi dönemine ait
- [[Program İstisnası]] — tüketici görünümü bu snapshot'ın üstüne günlük sapmaları biner
- [[Yoklama Oturumu]] — oturumlar bu snapshot'tan üretilir ve program alanlarını yazım anında dondurur; sonraki sürümler geçmiş oturumu değiştirmez

## Geçtiği modüller

- [[Ders Programı Yönetimi]] — kavramın sahibi; yayın, sürüm listesi, karşılaştırma, geri dönüş
- [[Yoklama ve Devamsızlık]] — günlük oturumların üretim kaynağı

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Snapshot bir JSON metni olarak saklanıyor. Yerleşim modeli değiştiğinde eski snapshot'ların okunabilirliği nasıl korunacak — sürümlenmiş bir şema var mı?
- Eski sürümlerin saklama süresi (retention) tanımlı görünmüyor. Yıllar boyunca her yayın birikecek mi?
