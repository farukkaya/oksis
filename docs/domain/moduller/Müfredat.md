---
aliases: [Academics, api/v1/academics, api/v1/curriculum-hours, Akademik Katalog]
tags: [domain/academic, module]
status: completed
last-synced: 2026-09-13 (294ffe6)
---

# Müfredat

<!-- generated:start -->

## Ne yapar

Okulun akademik iskeletini tanımlayan referans verinin tamamı burada durur: hangi dersler var, hangi kademelerde okutulur, haftada kaç saat, hangi branşlar tanımlı, notlar hangi ölçekle verilir, hangi sınav türleri var, hangi günler resmî tatil.

Modülün karakteri diğerlerinden farklı: **çoğu kayıt platform genelinde ortaktır, okula ait değildir.** Ders kataloğu, kademe listesi, ders↔branş eşlemesi, not ölçekleri, sınav türleri ve resmî tatiller tüm okullar için aynıdır. Okulun kendine ait olan kısmı dardır — branş kataloğu ve haftalık saat override'ı.

Bu ayrım bilinçli: MEB müfredatı okula göre değişmez, okulun uygulaması değişir.

## Kullandığı kavramlar

- [[Ders]] — müfredat dersi; kademe ve branş eşlemeleri çoka-çok
- [[Sınıf Seviyesi]] — kademeler; okulun hangilerini sunduğu [[Okul Ayarları]]'nda
- [[Haftalık Ders Saati]] — MEB çizelgesi ve okul override'ı
- [[Branş]] — öğretmen alanı; okula özel katalog
- [[Not Ölçeği]] / [[Sınav Türü]] — notlandırma yapılandırması
- [[Resmî Tatil]] — millî ve dini resmî tatiller
- [[Ders Görevlendirmesi]] — öğretmen × ders yetkinliği; bu modülde yaşar ama [[Görevlendirmeler]] tarafından yönetilir

## Ana akışlar

1. **Ders kataloğu** — Dersler listelenir, açılır, güncellenir, pasifleştirilir ve silinir. Bir dersin hangi kademelerde okutulduğu ayrı bir eşleme kaydıdır ve toptan değiştirilir. Yeni ders nötr kategoriyle doğar, güncelleme kategoriyi korur. **Kullanımdaki ders silinemez**; kullanım tek bir defterden sorulur ve önerilen yol pasife almaktır.

2. **Branş kataloğu ve MEB içe aktarımı** — Okul kendi branş listesini tutar; ad okul içinde tekildir. Platform genelinde ayrı bir **MEB referans kataloğu** vardır; okul oradan toplu içe aktarma yapabilir. Aktarım idempotenttir — zaten aktarılmış kayıt atlanır. İçe aktarılan branşlar MEB kaynaklı işaretlenir ve düzenlenemez; okul yalnız kendi eklediklerinde serbesttir. Bir öğretmende kullanılan branş silinemez. Branş uyumu platform kataloğundaki ders↔branş eşlemesinden, kimlik üzerinden hesaplanır.

3. **Haftalık ders saati** — MEB çizelgesi master şablon olarak durur ve sürüm etiketi taşır. Okul, sezonu için bir dersin saatini değiştirebilir; yazma uzlaştırmadır: MEB değerine eşit saat override'ı **siler**, farklı saat yazar ([[0005-haftalik-ders-saati-ders-kademe-kaydinda-tutulmaz]]). Çözüm katmanlıdır: **override varsa o, yoksa şablon.** Bir kademenin toplam hedef saati ve ders bazlı saatler ayrı uçlardan sorgulanır.

4. **Notlandırma yapılandırması** — Not ölçekleri ve sınav türleri listelenir. Okul varsayılan ölçeğini seçer, kademe bazında override verebilir. Tüketicisi [[Notlar]] modülüdür: sınav türleri defterin sütun kataloğunu, varsayılan ölçek not girişinin üst sınırını verir. Sınav türündeki ağırlık kolonu 2026-08-31'de kaldırıldı ([[0001-sinav-agirligi-okul-politikasinda]]).

5. **Resmî tatil listesi** — Sabit tarihli millî tatiller ve yıla çivili dini bayramlar okunur; sezon takvimi bu listeyle birleştirilir.

6. **Dönem tipleri** — Birinci ve ikinci dönem sabit lookup olarak durur; sezon kurulum sihirbazı tarih aralıklarını bu tiplere göre açar. Ayrı kavram notu yoktur.

**Yetki:** Ders, branş ve kademe yönetimi okul ayarlarının akademik yapı iznini kullanır (`school-settings.update-academic-structure`) — ayrı bir müfredat izin ailesi yoktur. Haftalık saat okuma `curriculum-hours.view`, override `curriculum-hours.override`. Görevlendirme tarafı kendi ailesindedir (`assignments.*`).

## Kapsam dışı

- **Not girişi ve hesaplama.** Bu modül ölçeği ve sınav türünü tanımlar; notu [[Notlar]] tutar.
- **Okula özel ders tanımı.** Ders kataloğunun okula ait bir katmanı yoktur; açılan ders platform kataloğuna yazılır (bkz. [[Ders]] açık soruları).
- **Müfredat sürümü seçimi.** Aktif MEB çizelge sürümü kodda sabittir; sürüm seçimi ileriye bırakılmış.
- **MEB branş listesinin yeniden senkronu.** İçe aktarım tek yönlüdür; tekrar çalıştırılırsa yalnız eksikleri ekler, değişen MEB kaydını güncellemez.
- **Görevlendirme akışları.** Öğretmen × ders yetkinliği bu modülün varlığıdır ama akışları [[Görevlendirmeler]]'de anlatılır.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- ~~Notlandırma yapılandırmasının hiçbir tüketicisi yok ve sınav ağırlığı iki yerde tanımlı.~~ Kapandı: [[Notlar]] tüketiyor, ağırlık okul politikasında ([[0001-sinav-agirligi-okul-politikasinda]]). Açık kalan: kademe bazlı ölçek override'ını hâlâ kimse okumuyor (bkz. [[Not Ölçeği]]).
- Müfredat hedef saati ile görevlendirmedeki haftalık saat birbirini doğrulamıyor.
- Okula özel ders katmanı yok; okulun açtığı ders platform kataloğuna yazılıyor. Okulun yalnız kendisine ait bir seçmeli ders tanımlaması gerekirse bu nasıl karşılanacak?
