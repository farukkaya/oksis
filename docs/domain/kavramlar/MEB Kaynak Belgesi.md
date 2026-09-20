---
aliases: [MebSourceDocument, MebDocumentSet, MebDocumentSetItem, Belge Seti, Kaynak Belge]
tags: [domain/academic]
table: master.meb_source_documents, master.meb_document_sets, master.meb_document_set_items
status: active
last-synced: 2026-09-20 (445eaa6a)
---

# MEB Kaynak Belgesi

<!-- generated:start -->

## Nedir

Bir MEB kararının ya da resmî ekinin **ham dosyası** ve o dosyanın künyesi: nereden geldiği, ne
zaman alındığı, içeriğinin parmak izi ve değişmez depodaki adresi. Yayımlanan her müfredat sürümü
"hangi belgeye dayanıyorum" sorusunu bu kayıtla cevaplar.

**Belge seti**, bir kararı ve eklerini tek **hukuki kaynakta** toplar. Ayrı bir kavram olmasının
nedeni: bir çizelge çoğu zaman tek dosya değildir (karar + ek çizelge + sonradan düzeltme) ve aynı
belge birden fazla sette farklı rolle yer alabilir.

## Yaşam döngüsü

Belge platform kullanıcısı tarafından yüklenir (Dilim 3'te aynı yol MEB sayfasından indirmeyle de
beslenecek). Sıra sabittir: içerik alınır, parmak izi hesaplanır, **virüs taraması yapılır** ve
ancak temizse depoya yazılır — enfekte dosya hiç kaydedilmez, "taranmadı" diye bir ara durum yoktur.

Aynı içerik ikinci kez yüklenirse yeni kayıt açılmaz. Aynı **kaynak adresi** farklı içerik
döndürdüyse yeni belge açılır ve öncekine **revizyon** olarak bağlanır; eski belge silinmez.

Belge silme ucu yoktur: onaylı karar ve ekleri süresiz saklanır.

## Kurallar

- Parmak izi (SHA-256) kimliktir ve tekildir.
- Kabul edilen türler PDF, DOCX, XLSX; üst sınır 25 MB.
- Depolama adresi parmak izinden türer (`meb/{sha[0..2]}/{sha}{uzantı}`); dosya adına güvenilmez.
- Belgeler **platform kovasında** durur, okul kovalarından ayrı: okula ait değillerdir ve okul
  silinse bile kalırlar.
- Belge seti (karar numarası + başlık) çiftiyle tekildir; karar tarihi belgede yazmıyorsa boş kalır.
- Aynı belge bir sete iki kez bağlanamaz; farklı sette yer alması serbesttir.
- İndirme kısa ömürlü imzalı adresle olur; dosya özgün adıyla iner.

## İlişkiler

- [[Müfredat Sürümü]] — sürüm bir belge setine dayanır
- [[Müfredat İçe Aktarma]] — ara alan bir belge setinden üretilir

## Geçtiği modüller

- [[Müfredat]] — merkez belge yüzeyinin sahibi

<!-- generated:end -->

## Notlar

Belgenin kendisi domain'e girmez; kayıt yalnız "hangi dosya, nereden, ne zaman" der. İçeriğin
ayrıştırılması (PDF tablosu okuma) Dilim 3'ün işidir.

## Açık Sorular

- Kullanılmamış/reddedilmiş aday belgelerin saklama süresi (tasarım §8: 2 yıl) için henüz bir
  temizlik işi yok; aday belge ancak otomatik keşifle (Dilim 3) birikecek.
