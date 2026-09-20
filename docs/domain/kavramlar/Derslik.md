---
aliases: [Room, Oda]
tags: [domain/academic]
table: academic.rooms
status: active
last-synced: 2026-09-20 (f3488976)
---

# Derslik

<!-- generated:start -->

## Nedir

Okulun fiziksel odası — `C-101`, `204 Nolu Sınıf`, laboratuvar, atölye. Okula özel bir katalogdur (kademe listesinin aksine platform geneli değildir).

Kavramın iki kullanımı vardır ve **ikisi de canlıdır**: **şubenin sabit ev dersliği** ([[Sınıflar ve Şubeler]]) ve **ders saatine göre oda kullanımı** ([[Ders Programı Yönetimi]]). Katalog ikisi için de aynı kayıttır.

Ev dersliği ilişkisi **zorunludur** (`TB-120`): her şubenin bir dersliği vardır, dolayısıyla okulun en az şube sayısı kadar dersliği tanımlı olmalıdır. Şube açma ekranı derslik yoksa kullanıcıyı katalog ekranına yönlendirir.

Kod tarafında derslik, ders programı modülünün master verisidir; ancak yönetim yetkisi [[Sınıflar ve Şubeler]] izin ailesindedir (`class-rooms.manage`), ders programı ailesinde değil.

## Yaşam döngüsü

Açılır, güncellenir, pasifleştirilir veya silinir. Pasif oda yeni atamalarda listelenmez ama **mevcut atamalar korunur**. Silme fiziksel değildir; kayıt işaretlenerek kaldırılır.

## Kurallar

- Oda kodu okul içinde tekildir; görünen ad ayrı ve zorunlu bir alandır.
- Kapasite 1-500 aralığındadır — şubenin kapasitesinden bağımsızdır ve onunla karşılaştırılmaz.
- Blok, kat ve konum opsiyoneldir.
- **Bir şube tarafından ev dersliği olarak kullanılan oda silinemez** (`rooms.errors.in-use`). Şubenin dersliği `TB-120`'den (2026-09-20) beri **zorunlu** olduğu için "önce şubeden kaldır" diye bir yol yoktur: şube başka bir dersliğe taşınır, oda ancak ondan sonra silinebilir.
- Bir oda **birden çok şubeye ev dersliği** olarak atanabilir. Bu bilinçli bir esnekliktir: ikili öğretim yapan okullarda sabah ve öğleden sonra grupları aynı odayı kullanır. Ev dersliği katmanında çakışma kontrolü yapılmaz.
- **Ders saati bazında ise çakışma serttir:** aynı oda, aynı dönemde, aynı gün ve ders saatinde yalnız bir canlı yerleşim tarafından tutulabilir. Veritabanındaki filtreli tekil index korur ve yalnız rezerve eden (canlı programa ait) yerleşimleri kapsar — taslaklar çakışmaz.
- Laboratuvar gerektiren ders yalnız laboratuvar türündeki dersliğe yerleştirilebilir.
- Arşivlenmiş şubenin dersliği değiştirilemez.

## İlişkiler

- [[Şube]] — şubenin ev dersliği; ID referansı, tek yönlü
- [[Ders Programı]] — yerleşimin mekân ayağı; saat bazında rezerve edilir

## Geçtiği modüller

- [[Sınıflar ve Şubeler]] — katalog yönetimi ve şubeye ev dersliği atama
- [[Ders Programı Yönetimi]] — ders saati bazında oda kullanımı ve çakışma koruması

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Oda tipi (`RoomType`) ders yerleştirmede kural üretiyor (laboratuvar gerektiren ders), ama şubeye **ev dersliği** atanırken tipe göre bir kısıt görünmüyor. Laboratuvar bir şubenin ev dersliği olabilir mi?
- Pasifleştirilmiş oda mevcut şube atamalarını koruyor, ama silinmesi "kullanımda" gerekçesiyle engelleniyor. Pasif odaya bağlı kalmış şube için beklenen davranış ne?
