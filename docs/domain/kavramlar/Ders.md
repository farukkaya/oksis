---
aliases: [Subject, Müfredat Dersi]
tags: [domain/academic]
table: master.subjects
status: active
last-synced: 2026-08-10 (2270867)
---

# Ders

<!-- generated:start -->

## Nedir

Müfredattaki ders — Türkçe, Matematik, Fen Bilimleri. Platform genelinde sabit bir listedir; okullar kendi ders kataloglarını kurmaz, ortak listeyi kullanır.

Bir dersin hangi sınıf kademelerinde okutulduğu dersin üzerinde bir alan değil, ayrı bir eşleme kaydıdır (çoka-çok). Bu yüzden "9. sınıfın dersleri" sorusu ders kaydından değil, eşlemeden cevaplanır.

## Yaşam döngüsü

Kalıcıdır. Aktiflik bayrağıyla pasifleştirilebilir — pasif ders yeni görevlendirmelerde ve kopyalamada atlanır, ama geçmiş kayıtlar korunur.

## Kurallar

- Kısa kod ve görünen ad ayrı alanlardır; kod makine tarafı, ad kullanıcıya görünen taraftır.
- Seçmeli dersler bayrakla ayrılır.
- Kademe bağları dersin çocuk koleksiyonu değildir; ayrı bir eşleme aggregate'i olarak yaşar ve komut işleyicisinde toptan değiştirilir.
- Görüntülenecek kademeler okulun sunduğu kademelerle kesiştirilir: bir lise, dersin ortaokul kademelerini görmez. Okul hiç kademe tanımlamamışsa geri uyum için tüm kademeler gösterilir.
- Ders adı, [[Ders Görevlendirmesi]]'ndeki branş uyumunun karşılaştırma tarafıdır — ad değişikliği uyum sonucunu doğrudan etkiler.

## İlişkiler

- [[Sınıf Seviyesi]] — hangi kademelerde okutulduğu; çoka-çok eşleme
- [[Haftalık Ders Saati]] — dersin kademe başına haftalık saati; MEB şablonu + okul override'ı
- [[Ders Görevlendirmesi]] — öğretmen yetkinliğinin bağlandığı ders
- [[Şube Ders Görevlendirmesi]] — saatli şube atamasının dersi
- [[Branş]] — uyum karşılaştırmasında dersin adı branş adıyla eşleştirilir

Derse bağlanan ama henüz notu olmayan kayıtlar: ders-kademe eşlemesi, haftalık ders saati şablonu, not ölçeği, sınav tipi.

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi; katalog yönetimi ve kademe eşlemesi
- [[Görevlendirmeler]] — görevlendirmenin ders ekseni ve kapsama görünümü
- [[Ders Programı Yönetimi]] — yerleşimin ders ayağı; laboratuvar gerektiren derste derslik tipi kuralı
- [[Yoklama ve Devamsızlık]] — oturum hangi dersin yoklaması olduğunu dondurarak taşır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Ders platform geneli master, ama okulun kendi seçmeli dersini eklemesi gerekirse ne olacak? Şu an okula özel ders tanımı görünmüyor.
- Haftalık ders saati şablonu ile görevlendirmedeki haftalık saat arasında bir doğrulama var mı? Şablon tarafı artık [[Haftalık Ders Saati]]'nde haritalı (override > master katmanı) ama iki sayının birbirini denetlediği bir yol hâlâ görünmüyor.
