---
aliases: [DutyLocation, DutyLocationTemplate, Nöbet Yeri, Nöbet Noktası]
tags: [domain/academic]
table: academic.duty_locations
status: active
last-synced: 2026-09-13 (294ffe6)
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

Açılır, güncellenir, pasifleştirilir, silinir. Pasif bölge yeni dağıtımda kullanılmaz — otomatik dağıtım yalnız aktif bölgeleri hücre olarak alır. Silme fiziksel değildir, kayıt işaretlenerek kaldırılır.

**Yayınlanmış bir çizelgede ataması olan bölge silinemez** (`TB-16`). Silme yumuşak olduğu için eskiden veritabanı hiçbir şeyi kırmıyordu: atama satırı duruyor, bölgesi okunduğunda boş dönüyordu — hata değil, fark edilmesi zor bir boş sonuç. Kontrol bilinçli olarak yalnız **yayınlanmış** çizelgelere bakar: taslak hâlâ düzenleniyordur ve yöneticinin bölgeyi kaldırıp taslağı yeniden düzenlemesi meşru bir akıştır; sahipsiz kalan şey yayındaki çizelgedir. Desen, kullanımdaki dersliğin silinememesiyle aynıdır.

## Kurallar

- Bölge adı zorunludur.
- Kapasite 1-4 aralığındadır.
- Kapasite [[Nöbet Çizelgesi]]'nde **sert sınırdır**: o günkü bölge doluysa atama reddedilir. (Şube kapasitesinin aksine burada yumuşaklık yoktur.) Otomatik dağıtımda da kapasite bir **tavandır, talep değildir** — her aktif hücreye en az bir nöbetçi düşer, kapasite yalnız üst sınırı çizer.
- Yayınlanmış çizelgede kullanılan bölge silinemez (yukarıda).
- Bölge tipi (kat, kantin, bahçe, kapı, salon, diğer) sınıflandırma içindir; kurala girmez.

## İlişkiler

- [[Nöbet Çizelgesi]] — atamanın mekân ayağı; yayındaki kullanım silmeyi engeller
- [[Derslik]] — ayrı bir katalog; karıştırılmaması için ve aynı silme deseni için burada anılıyor

## Geçtiği modüller

- [[Nöbetler]] — kavramın sahibi; katalog yönetimi ve dağıtımın hücre ekseni

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Şablon kaydının açıklamasında "tenant'a ait gerçek bölge varlığı ileri sprintte gelecek" yazıyor, oysa o varlık artık var. Yorum bayat mı, yoksa şablonun rolü değişti mi?
