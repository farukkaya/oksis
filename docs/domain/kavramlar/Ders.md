---
aliases: [Subject, Müfredat Dersi]
tags: [domain/academic]
table: master.subjects
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Ders

<!-- generated:start -->

## Nedir

Müfredattaki ders — Türkçe, Matematik, Fen Bilimleri. Kayıt **platform geneli master veridir**: okula ait değildir, tüm okullar aynı listeyi görür. Buna karşın katalog yazma uçları (açma, güncelleme, pasife alma, silme) okulun akademik yapı izniyle açıktır (bkz. Açık Sorular).

Bir dersin hangi sınıf kademelerinde okutulduğu dersin üzerinde bir alan değil, ayrı bir eşleme kaydıdır (çoka-çok). Bu yüzden "9. sınıfın dersleri" sorusu ders kaydından değil, eşlemeden cevaplanır. Dersin hangi branşlarca okutulabileceği de aynı biçimde ayrı bir eşlemedir.

## Yaşam döngüsü

Kalıcıdır. Aktiflik bayrağıyla pasifleştirilebilir — pasif ders yeni görevlendirmelerde ve kopyalamada atlanır, ama geçmiş kayıtlar korunur. **Kullanımdaki ders silinemez; yol pasife almaktır.**

## Kurallar

- Kısa kod ve görünen ad ayrı alanlardır; kod makine tarafı, ad kullanıcıya görünen taraftır. Kod büyük harfe normalize edilir ve katalogda tekildir.
- Seçmeli dersler bayrakla ayrılır.
- **Kategori istemciden alınmaz:** yeni ders nötr `Other` kategoriyle doğar, güncelleme mevcut kategoriyi korur. Kategori bir anlam taşır: vekil önerisinde "yakın" uyum kovası ders kategorisi eşitliğine bakar, dolayısıyla güncellemede ezilmemelidir.
- Kademe bağları dersin çocuk koleksiyonu değildir; ayrı bir eşleme aggregate'i olarak yaşar ve komut işleyicisinde toptan değiştirilir.
- Ders kataloğu sorguları okulun sunduğu kademelerle süzülmez; süzgeç görevlendirmenin ders havuzunda uygulanır (bkz. [[Ders Görevlendirmesi]]).
- Branş uyumu ders **adıyla değil**, katalogdaki ders↔branş eşlemesiyle hesaplanır (X-04); dersin adını değiştirmek uyum sonucunu değiştirmez.
- **Kullanımdaki ders silinemez** (409). Dersi tüketen bütün kayıtlar — program yerleşimi, öğretmen yetkinliği, müfredat saat şablonu, okul saat override'ı, yoklama oturumu, not defteri, ödev, planlanmış sınav ve sınav oturumu, dağıtım kısıtı — tek bir kullanım defterinden sorulur; yeni bir tüketici deftere eklenmezse kapsama testi kırılır (TB-53). Gerekçe: eski kapı yalnız yayındaki programa bakıyordu ve silme yumuşak olduğu için görevlendirmesi olan ders sessizce "boş sonuç" üretiyordu. Kademe ve branş eşlemeleri dersin kendi tanımının parçası olduğu için engel üretmez.
- Haftalık ders saati ders–kademe eşlemesinde tutulmaz; yalnız [[Haftalık Ders Saati]]'nin iki katmanında yaşar ([[0005-haftalik-ders-saati-ders-kademe-kaydinda-tutulmaz]]).

## İlişkiler

- [[Sınıf Seviyesi]] — hangi kademelerde okutulduğu; çoka-çok eşleme
- [[Haftalık Ders Saati]] — dersin kademe başına haftalık saati; MEB şablonu + okul override'ı
- [[Ders Görevlendirmesi]] — öğretmen yetkinliğinin bağlandığı ders
- [[Şube Ders Görevlendirmesi]] — saatli şube atamasının dersi
- [[Branş]] — dersi okutabilen branşlar; çoka-çok katalog eşlemesi, uyumun kaynağı

Derse bağlanan ama henüz notu olmayan kayıtlar: ders-kademe eşlemesi, ders-branş eşlemesi, haftalık ders saati şablonu, not ölçeği, sınav tipi.

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi; katalog yönetimi ve kademe eşlemesi
- [[Görevlendirmeler]] — görevlendirmenin ders ekseni ve kapsama görünümü
- [[Ders Programı Yönetimi]] — yerleşimin ders ayağı; laboratuvar gerektiren derste derslik tipi kuralı
- [[Yoklama ve Devamsızlık]] — oturum hangi dersin yoklaması olduğunu dondurarak taşır
- [[Notlar]] — [[Not Defteri]] koordinatının ders ekseni; aile yüzündeki ders listesi programdan gelen dersler ile defteri olan derslerin birleşimidir
- [[Ödevler]] — [[Ödev]] koordinatının ders ekseni; form bağlamı öğretmenin ilk dersini taşır
- [[Nöbetler]] — vekil önerisinde ders kategorisi "yakın" uyumun ölçütüdür

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Okula özel ders katmanı yok; okulun açtığı ders platform kataloğuna yazılıyor. Okulun yalnız kendisine ait bir seçmeli ders tanımlaması gerekirse bu nasıl karşılanacak?
- Haftalık ders saati şablonu ile görevlendirmedeki haftalık saat arasında bir doğrulama var mı? Şablon tarafı artık [[Haftalık Ders Saati]]'nde haritalı (override > master katmanı) ama iki sayının birbirini denetlediği bir yol hâlâ görünmüyor.
- Ders kaydı master (tenant'sız) ama açma, güncelleme, pasife alma ve silme uçları okul yöneticisinin akademik yapı izniyle çalışıyor. Bir okulun dersi yeniden adlandırması, pasife alması ya da yeni ders açması bütün okulların kataloğunu değiştiriyor mu? Haftalık saatteki gibi okula özgü bir katman yok.
