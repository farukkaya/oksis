---
aliases: [DutyLocation, DutyLocationTemplate, Nöbet Yeri, Nöbet Noktası]
tags: [domain/academic]
table: academic.duty_locations
status: active
last-synced: 2026-08-10 (2270867)
---

# Nöbet Bölgesi

<!-- generated:start -->

## Nedir

Nöbetin tutulduğu yer — kat koridoru, kantin, bahçe, kapı, salon. Okula özeldir; her okul kendi bölge listesini kurar.

Bölgenin belirleyici alanı **kapasitedir** ve buradaki anlamı özeldir: fiziksel kişi sayısı değil, o bölgede aynı gün **paralel nöbet tutabilecek öğretmen sayısıdır**. Kalabalık bir bahçeye iki nöbetçi, kapıya bir nöbetçi düşmesi bu alanla ifade edilir. En fazla dört olabilir.

Bölge, [[Derslik]] ile karıştırılmamalıdır: derslik dersin yapıldığı fiziksel odadır, bölge nöbetin tutulduğu alandır. İkisi ayrı kataloglardır.

## Şablonlar

Platform genelinde hazır bir şablon listesi vardır (Kapı, Koridor, Kantin...). Okul kendi bölgesini bu şablonlardan kopyalayarak ya da sıfırdan tanımlayarak açar; kopyalanan bölge kaynak şablonunu üzerinde taşır. Şablonlar salt okunurdur ve tenant'a ait değildir.

## Yaşam döngüsü

Açılır, güncellenir, pasifleştirilir, silinir. Pasif bölge yeni dağıtımda kullanılmaz. Silme fiziksel değildir, kayıt işaretlenerek kaldırılır.

## Kurallar

- Bölge adı zorunludur.
- Kapasite 1-4 aralığındadır.
- Kapasite [[Nöbet Çizelgesi]]'nde **sert sınırdır**: o günkü bölge doluysa atama reddedilir. (Şube kapasitesinin aksine burada yumuşaklık yoktur.)
- Bölge tipi (kat, kantin, bahçe, kapı, salon, diğer) sınıflandırma içindir; kurala girmez.

## İlişkiler

- [[Nöbet Çizelgesi]] — atamanın mekân ayağı
- [[Derslik]] — ayrı bir katalog; karıştırılmaması için burada anılıyor

## Geçtiği modüller

- [[Nöbetler]] — kavramın sahibi; katalog yönetimi ve dağıtımın hücre ekseni

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Silmede kullanımda kontrolü yok.** [[Derslik]] silinirken "bir şube bunu kullanıyor" diye engelleniyor, ama nöbet bölgesi doğrudan siliniyor. Yayınlanmış bir çizelgede o bölgeye ait atamalar varsa ne olması bekleniyor?
- Şablon kaydının açıklamasında "tenant'a ait gerçek bölge varlığı ileri sprintte gelecek" yazıyor, oysa o varlık artık var. Yorum bayat mı, yoksa şablonun rolü değişti mi?
