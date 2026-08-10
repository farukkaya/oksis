---
aliases: [GradeScale, Notlandırma Sistemi, Puan Sistemi]
tags: [domain/academic]
table: master.grade_scales
status: active
last-synced: 2026-08-10 (2270867)
---

# Not Ölçeği

<!-- generated:start -->

## Nedir

Notun hangi sistemde verildiği: yüzlük, beşlik veya harf sistemi. Platform genelinde tanımlı sabit bir listedir; okul bu listeden seçer, kendi ölçeğini tanımlamaz.

Her ölçek bir alt-üst sınır ve bir **geçer değer** taşır. Harf sisteminde sayısal sınırlar boş kalır, geçer değer metin olarak durur — bu yüzden geçer değer sayı değil metin tutulur.

## Kullanımı

Okul bir **varsayılan ölçek** seçer; ayrıca [[Sınıf Seviyesi]] bazında override verebilir. İlkokulu beşlik, liseyi yüzlük ölçekle yönetmek bu sayede mümkündür. Override yoksa okulun varsayılan geçme notuna düşülür. İkisi de [[Okul Ayarları]]'nda tutulur.

## Kurallar

- Kod, ad ve geçer değer zorunludur; kod büyük harfe normalize edilir.
- Sayısal sınırlar isteğe bağlıdır (harf sistemi için boş kalır).
- Ölçek listesi okula açılmaz; okul yalnız seçer.

## İlişkiler

- [[Okul Ayarları]] — varsayılan ölçek ve kademe bazlı override burada seçilir
- [[Sınıf Seviyesi]] — override kademe başınadır
- [[Sınav Türü]] — birlikte notlandırma yapılandırmasını oluştururlar

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi; ölçek kataloğu
- [[Okul Yönetimi]] — seçim ve kademe override'ı

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Ölçeği tüketen bir not modülü henüz yok.** Seçim yapılabiliyor ama seçilen ölçeğe göre not doğrulayan bir yol bulunmuyor.
- Harf sisteminde sıralama ve ortalama nasıl hesaplanacak? Ölçek yalnız geçer değeri taşıyor, harflerin karşılıkları yok.
