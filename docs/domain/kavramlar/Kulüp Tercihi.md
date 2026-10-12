---
aliases: [ClubPreference, Öğrenci Tercihi, Kulüp Tercih Listesi]
tags: [domain/clubs]
table: school.club_preferences
status: active
last-synced: 2026-10-12 (b415d6fc)
---

# Kulüp Tercihi

<!-- generated:start -->

## Nedir

Bir öğrencinin bir [[Kulüp Tercih Dönemi]]'nde kaydettiği **sıralı en fazla üç kulüplük** listesi. Koordinatı **dönem × öğrenci**, tekil. Kulübe başvuru değildir: [[Kulüp Üyeliği]]'ne yazılmaz, kulübün üye sayacına, keşif hâline ya da danışmanın listesine dokunmaz. Yerleştirmenin girdisidir; sonucu [[Kulüp Yerleştirmesi]] üretir.

## Yaşam döngüsü

Öğrencinin ilk kaydıyla doğar, dönem açık kaldıkça bütün olarak değiştirilir (üç sıra birlikte yazılır), dönem kapanınca salt okunur kalır. Silinmez; ayrı bir durum alanı yoktur — yazılabilirliği dönemin durumundan türer.

## Kurallar

- **Yalnız açık dönemde yazılır** (aksi 409) ve yalnız öğrenci yazar: izin katılma iznidir, yalnız öğrencide vardır; veli tercih yapamaz ve tercih sürecini görmez. Kimlik yetkilendirme başlığından çözülür.
- **Uygunluk dönemin kapsamıdır**: sezonda aktif kaydı olan, (okulda kulüp saati varsa) şubesinde kulüp saati olan ve sezonda **canlı üyeliği olmayan** öğrenci. Üyeliği olan öğrenci tercih yapamaz ve ekranda "X kulübünün üyesisin" görür; üyelik sorusu kapsamdan önce sorulur, yanlış gerekçe verilmesin diye. Ekranın notu ile ucun reddi aynı cümledir (409).
- **Listenin kendi kuralları** (400): boş olamaz, üçten uzun olamaz, aynı kulüp iki sırada olamaz, geçersiz kimlik içeremez. Seçilen her kulüp sezonun **aktif** kulübü olmalıdır ve seçim sayısı `min(3, aktif kulüp sayısı)` kadardır — okulda iki aktif kulüp varsa iki tercih yeter.
- **Son kayıt anı sıralama ölçütüdür** ("önce kaydeden önce"): taşan kulüpte kalan yer bu ana göre dağılır. An her **değişiklikte** yenilenir — "önce yer kap, sonra rahatça değiştir" açığı böyle kapanır. Aynı listeyi yeniden göndermek değişiklik sayılmaz ve yeri korur (çift dokunma sırayı kaybettirmez).
- **Saklama şekli bir karardır**: üç sıra ayrı satırlar değil tek satırın üç alanıdır. Tercih sayısı sabittir ve liste bütün olarak değişir; tek satır upsert dönem açıldığı anki yoğun yazmayı taşır ve "dönem × öğrenci" tekilliği tek indekste kalır.

## İlişkiler

- [[Kulüp Tercih Dönemi]] — sahibi; FK'lı, dönem × öğrenci tekil
- [[Kulüp]] — tercih edilen kulüpler; yalnız kimlik
- [[Kişi]] — öğrenci kimliği
- [[Kulüp Yerleştirmesi]] — tercihin tüketicisi; eşleşen tercih sırası yerleştirmede saklanmaz, her okumada buradan hesaplanır

## Geçtiği modüller

- [[Kulüpler]] — öğrencinin tercih ekranı, idarenin katılım özeti ve otomatik yerleştirme

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Dönem kapandıktan sonra kapsam dışına düşen (okuldan ayrılan, kulüp saati olmayan şubeye geçen) öğrencinin tercih satırı ne olur? Yerleştirme evreninden düşer, satır kalır; katılım özetindeki sayılara girip girmediği koddan net çıkmadı.
