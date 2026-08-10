---
aliases: [StudentDocument, Kayıt Evrakı]
tags: [domain/people]
table: academic.student_documents
status: active
last-synced: 2026-08-10 (2270867)
---

# Öğrenci Belgesi

<!-- generated:start -->

## Nedir

Kayıt dosyasında bulunması gereken evrak: nüfus cüzdanı örneği, fotoğraf, diploma, sağlık raporu, sözleşme. Her belge bir öğrenciye, isteğe bağlı olarak da belirli bir [[Öğrenci Kaydı]]'na bağlanır.

Kavramın işlevi bir **eksik listesi** tutmaktır: belge kaydı dosya yüklenmeden de açılır ve "eksik" durumunda bekler. Böylece "bu öğrencinin dosyasında ne eksik" sorusu cevaplanabilir kalır.

## Yaşam döngüsü

`Eksik → Yüklendi → Onaylı | Reddedildi`

Kayıt eksik durumunda doğar. Dosya yüklendiğinde yüklendi durumuna geçer ve isteğe bağlı bir geçerlilik tarihi taşıyabilir (sağlık raporu gibi süreli evrak için). İdare onaylar ya da reddeder.

## Kurallar

- Öğrenci kimliği zorunludur; kayıt bağı isteğe bağlıdır.
- Yükleme dosya adresi olmadan yapılamaz.
- Onay ve red doğrudan uygulanır; ara bir karar durumu yoktur.

## İlişkiler

- [[Öğrenci Kaydı]] — belge bir kayda bağlanabilir
- [[Kişi]] — belgenin sahibi öğrenci

## Geçtiği modüller

- [[Öğrenci Kayıt Yönetimi]] — kavramın sahibi

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Belge, dosya adresini serbest metin olarak tutuyor.** [[Mazeret]] tarafındaki evrak ise [[Saklı Dosya]]'ya referans veriyor ve "kendi depolamasını kurmuyor" ilkesini uyguluyor. İki belge akışı iki farklı yaklaşım kullanıyor — hangisi kalmalı?
- Bu ayrışmanın bir sebebi de şu: [[Dosya Kategorisi]] defterinde **öğrenci belgesi diye bir kategori hiç tanımlı değil**. Yani bu belgeler [[Dosya Yönetimi]]'ne taşınmak istense önce bir kategori açılması gerekir — ve o kategorinin saklama süresi KVKK kararı ister.
- Süreli belgenin (sağlık raporu gibi) geçerliliği dolduğunda durumu değiştiren bir iş görünmüyor. Süre dolumu takip ediliyor mu?
- Hangi belgelerin zorunlu olduğu okula göre değişir mi, yoksa liste sabit mi? Zorunluluk kuralı bu taramada bulunamadı.
