---
aliases: [GradeScale, Notlandırma Sistemi, Puan Sistemi]
tags: [domain/academic]
table: master.grade_scales
status: active
last-synced: 2026-09-03 (b72c819)
---

# Not Ölçeği

<!-- generated:start -->

## Nedir

Notun hangi sistemde verildiği: yüzlük, beşlik veya harf sistemi. Platform genelinde tanımlı sabit bir listedir; okul bu listeden seçer, kendi ölçeğini tanımlamaz.

Her ölçek bir alt-üst sınır ve bir **geçer değer** taşır. Harf sisteminde sayısal sınırlar boş kalır, geçer değer metin olarak durur — bu yüzden geçer değer sayı değil metin tutulur.

## Kullanımı

Okul bir **varsayılan ölçek** seçer; ayrıca [[Sınıf Seviyesi]] bazında override verebilir. İlkokulu beşlik, liseyi yüzlük ölçekle yönetmek bu sayede mümkündür. Override yoksa okulun varsayılan geçme notuna düşülür. İkisi de [[Okul Ayarları]]'nda tutulur.

**Tüketicisi [[Notlar]] modülüdür:** [[Not]] girişinde sayısal değer sıfır ile ölçeğin üst sınırı arasında doğrulanır; not politikası ucu üst sınırı ve geçme notunu istemciye verir. Ancak modül yalnız **okulun varsayılan ölçeğini** okur — kademe override'ı ve geçme notu zinciri için yazılmış çözücü servisin bugün hiçbir tüketicisi yoktur (aşağıda).

## Kurallar

- Kod, ad ve geçer değer zorunludur; kod büyük harfe normalize edilir.
- Sayısal sınırlar isteğe bağlıdır (harf sistemi için boş kalır). Üst sınır boşsa ya da ölçek seçilmemişse not girişi 100 varsayar.
- Ölçek listesi okula açılmaz; okul yalnız seçer.

## İlişkiler

- [[Okul Ayarları]] — varsayılan ölçek ve kademe bazlı override burada seçilir
- [[Sınıf Seviyesi]] — override kademe başınadır
- [[Sınav Türü]] — birlikte notlandırma yapılandırmasını oluştururlar
- [[Not]] — sayısal değerin üst sınırı

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi; ölçek kataloğu
- [[Okul Yönetimi]] — seçim ve kademe override'ı
- [[Notlar]] — üst sınır doğrulaması ve politika ucu; yalnız varsayılan ölçek

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- ~~Ölçeği tüketen bir not modülü henüz yok.~~ 2026-08-23'te [[Notlar]] geldi; üst sınır doğrulanıyor.
- **Kademe bazlı override'ı okuyan yok.** Ölçek çözücü servisinin (`IGradeScaleResolver`) kod tabanında tüketicisi bulunmuyor (sembol referansıyla doğrulandı); not girişi doğrudan varsayılan ölçeği okuyor. Override ekranda seçilebiliyor ama hiçbir davranışı değiştirmiyor.
- Harf sisteminde sıralama ve ortalama nasıl hesaplanacak? Ölçek yalnız geçer değeri taşıyor, harflerin karşılıkları yok; not girişi harf kabul etmiyor ve üst sınırı 100'e düşürüyor.
