---
aliases: [ScheduleVersion, Yayın Snapshot'ı]
tags: [domain/academic]
table: academic.schedule_versions
status: active
last-synced: 2026-08-10 (2270867)
---

# Program Sürümü

<!-- generated:start -->

## Nedir

Bir [[Ders Programı]] yayınlandığı anda alınan **değişmez kopyası**. Yayın tarihini, yayınlayanı, isteğe bağlı bir notu ve o andaki tüm yerleşimlerin dondurulmuş hâlini taşır.

Kavramın varlık sebebi şu: öğretmen, öğrenci ve veli programın **canlı hâlini değil, son yayınlanmış hâlini** görür. Yönetici programı düzenlemeye başladığında ekranlar anında değişmez — yeni sürüm yayınlanana kadar herkes eski kopyayı görmeye devam eder. "Yarım kalmış düzenleme kimsenin ekranına yansımasın" kuralı bu ayrımdan doğar.

## Yaşam döngüsü

Yoktur — yazılır, bir daha değişmez. Her yayın yeni bir sürüm satırı üretir; eskiler silinmez, yayın geçmişini oluşturur.

## Kurallar

- Sürüm numarası 1'den küçük olamaz ve program başına tekildir.
- Boş snapshot yazılamaz; en az bir yerleşim içermelidir (boş program zaten yayınlanamaz).
- Yayınlanan sürüm numarası kaydın kendisinden değil, **yayın geçmişinden** türetilir — yeniden yayında numara çakışmasın diye.
- Geçmiş bir sürüme dönülebilir: o snapshot'tan program yeniden kurulur, mevcut aktif yerleşimler pasifleşir, blok grupları yeniden oluşturulur ve program **Revize** durumuna geçer. Dönüş yeni bir yayın değildir; yayınlanması ayrı adımdır.

## İlişkiler

- [[Ders Programı]] — sürümün kaynağı
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
