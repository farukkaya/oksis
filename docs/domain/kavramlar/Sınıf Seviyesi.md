---
aliases: [GradeLevel, Sınıf Kademesi, Kademe]
tags: [domain/academic]
table: master.grade_levels
status: active
last-synced: 2026-08-10 (2270867)
---

# Sınıf Seviyesi

<!-- generated:start -->

## Nedir

Anaokulundan 12. sınıfa kadar olan kademe tanımı. MEB dilinde "sınıf" denen şey budur: 9-A şubesindeki "9". Platform genelinde sabit bir lookup'tır — okullar kendi kademelerini tanımlamaz, hepsi aynı listeyi paylaşır.

Adlandırmada bir tuzak var: İngilizce **grade** burada *sınıf seviyesi* demektir, *not* değil. Not için `Mark` kullanılır. Bu ayrım karıştırıldığında ders notu ile sınıf kademesi aynı isimle anılmaya başlar.

## Yaşam döngüsü

Yoktur. Seed verisiyle sabit kimliklerle gelir ve değişmez. Nadir değiştiği için lookup sorgusu 24 saat önbelleklenir.

## Kurallar

- Kod ve ad zorunludur; kod kısa biçimdir (`0`, `1`, `9`), ad kullanıcıya görünen biçimdir (`Anaokulu`, `1. Sınıf`).
- Sıralama önceliği ayrı bir alandır — kod alfabetik sıralandığında `10` ile `2` yer değiştirirdi.
- Her kademe bir öğretim düzeyine (`EducationLevel`) bağlıdır.
- Okulun hangi kademeleri sunduğu [[Okul Ayarları]] tarafında ayrı bir kayıtta tutulur ve okuma sorguları bunu **filtre olarak** uygular: bir lise, bir dersin ortaokul kademelerini görmez. Okul hiç kademe tanımlamamışsa geri uyum için tüm kademeler gösterilir. **En az bir kademe açık kalmak zorundadır.**
- Kademe bazında not ölçeği override'ı verilebilir; yoksa okulun varsayılan geçme notuna düşülür.
- [[Şube]] adının öneki bu kaydın **kodundan** üretilir: kod `9`, şube adı `A` ise şubenin tam adı `9-A` olur. Kademe kodu değişirse mevcut şube adları kendiliğinden güncellenmez — ad şube üzerinde saklanır.
- Şube kurulurken kademenin master'da var olduğu doğrulanır; yoksa istek reddedilir.
- Kademe listesi izinle korunmaz; tenant'tan bağımsızdır ve oturum açmış her kullanıcıya açıktır.

## İlişkiler

- [[Şube]] — her şube tam olarak bir kademeye bağlıdır
- [[Ders]] — dersin hangi kademelerde okutulduğu; çoka-çok eşleme
- [[Sezon]] — sezon geçişinde terfi, kademeler arasındaki sıralamayı izler

- [[Haftalık Ders Saati]] — kademe başına ders saati hedefi
- [[Not Ölçeği]] — kademe bazlı ölçek override'ı

Kademeye referans veren ama henüz notu olmayan kavramlar: ders-kademe eşlemesi, okulun sunduğu kademeler.

## Geçtiği modüller

- [[Sınıflar ve Şubeler]] — şube kurulumunda kademe seçimi ve ad üretimi
- [[Sezon Yönetimi]] — sezon geçişinde bir üst kademeye terfi ve terminal kademede mezuniyet
- [[Müfredat]] — kademe kataloğunun sahibi; ders eşlemesi ve haftalık saat hedefi
- [[Okul Yönetimi]] — okulun hangi kademeleri sunduğu ve kademe bazlı ölçek override'ları
- [[Öğrenci Kayıt Yönetimi]] — kayıttaki kademe ve terfi/terminal-kademe kararı; orada kademe **kimlik değil sayı** olarak tutulur ve sıralama numarasıyla aynı uzayda varsayılır

Kademeye göre dallanan ama henüz notu olmayan modüller: Academics, Grades, Students.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Terfi "bir üst kademe okulca sunuluyorsa" kuralına dayanıyor; bu sıralama `DisplayOrder` üzerinden mi yürüyor yoksa ayrı bir kademe haritası mı var?
- Okulun hangi kademeleri sunduğu bilgisi okul ayarlarında duruyor gibi görünüyor; bu kavramın notu henüz yok.
