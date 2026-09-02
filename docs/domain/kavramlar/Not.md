---
aliases: [Mark, MarkValue, Not Hücresi, Puan]
tags: [domain/academic]
table: academic.marks
status: active
last-synced: 2026-09-03 (b72c819)
---

# Not

<!-- generated:start -->

## Nedir

Bir öğrencinin bir [[Değerlendirme]] sütunundaki değeri — ızgaranın tek hücresi. Koddaki adı `Mark`; `Grade` bu depoda sınıf seviyesi demektir, karıştırılmamalı.

Değer **üç hâllidir:**

- **sayı** — sıfır ile ölçek üst sınırı arasında ondalıklı değer,
- **G / M** — "girmedi" ve "muaf"; ikisi de **ortalamaya katılmaz**, sıfır değildirler ve paydaya da girmezler,
- **boş** — girilmemiş.

Sayı ve özel değer iki ayrı kolonda tutulur ve **aynı anda dolu olamaz**; kural hem domain'de hem veritabanı kısıtındadır. Tek kolona sentinel değerle sıkıştırma ortalama hesabını sessizce bozacağı için elenmiştir.

## Yaşam döngüsü

Hücre ilk yazımda doğar; **boş değer için satır açılmaz** — "girilmedi" satırın yokluğudur. Sütun temizlendiğinde yumuşak silinir, aynı hücreye yeniden yazılınca geri açılır. Fiziksel silinmez.

## Kurallar

- **Tekillik:** sütun + öğrenci.
- **Görünürlük burada tutulmaz.** Hücrenin aileye açık olup olmadığı sütunun durumundan gelir; bu satırda böyle bir alan yoktur.
- **Üst sınır okulun varsayılan [[Not Ölçeği]]'nden okunur,** ölçek seçilmemişse ya da harf ölçeği gibi sınırı yoksa 100 varsayılır.
- **Yazma yolu öğrenci numarasıyla adreslenir,** ızgara kimlikle okur. Numara defterin şubesinde yoksa 404 — başka şubedeki öğrenciye yazma denemesi varlık sızdırmaz.
- **Şubeden ayrılan öğrencinin notu korunur, girişi kapalıdır** (409). Not görünür kalır ama sayaçlara girmez.
- **Yayınlanmış sütunda hücre doğrudan yazılamaz;** gerekçeli düzeltme eski ve yeni değeri tel biçimiyle ("85", "G") [[Not Denetim Kaydı]]'na yazar. Taslakta düzeltme yolu kullanılmaz, doğrudan yazılır.
- **Değişiklik damgasının görünür bir işi vardır:** aile yüzündeki "güncellendi" rozetini besler. Veli notun değiştiğini görür, **neye** değiştiğini görmez; eski değer ve gerekçe okul kaydında kalır.
- İlk giren kişi ile sonraki değiştirenler ayrı tutulur.
- **Ders ortalaması ağırlıksız aritmetik ortalamadır,** bir ondalıkla yuvarlanır; G, M ve boş paydaya girmez. Aile ve öğrenci listesi hesabına yalnız yayınlanmış ya da kilitli sütunlar girer. Genel ortalama üç katmandır (ders → dönem → genel), üçü de ağırlıksız, kapsamı sezon başından yürürlükteki döneme kadardır. Okul politikasındaki yazılı/performans ağırlıkları bu hesaba **girmez**.
- Hücre başına denetim kaydı yazılmaz; yayın anında toplu özet üretilir.

## İlişkiler

- [[Değerlendirme]] — sahip; hücre sütun dışında var olamaz
- [[Kişi]] — öğrenci ve notu giren; yalnız kimlik
- [[Not Ölçeği]] — sayısal üst sınır
- [[Öğrenci Kaydı]] — yazılabilirlik (aktif/dondurulmuş) ve numaradan kimliğe çözüm
- [[Not Denetim Kaydı]] — düzeltmede eski/yeni değer

## Geçtiği modüller

- [[Notlar]] — kavramın sahibi; giriş, düzeltme, ortalama, aile yüzü
- [[Öğrenci Kayıt Yönetimi]] — öğrenci listesindeki genel ortalama sütunu

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- **Kademe bazlı ölçek override'ı okunmuyor.** Sembol referanslarıyla doğrulandı: ölçek çözücü servisinin (`IGradeScaleResolver`) kod tabanında hiçbir tüketicisi yok; not girişi doğrudan okulun varsayılan ölçeğini okuyor. İlkokulu 5'lik yöneten okulda üst sınır 100 kalır.
- **Harf ölçeğinde giriş yolu yok:** ölçeğin üst sınırı boş olduğundan 100 varsayılıyor, "A/B" gibi bir değer geçersizdir. Harf sistemi seçen okul ne girecek?
- Yazılı/performans ağırlıkları politika ucunda dönüyor ama hiçbir hesaba girmiyor. Karne modülüne mi ayrılmış, yoksa ölü alan mı?
