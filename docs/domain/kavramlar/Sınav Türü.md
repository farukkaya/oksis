---
aliases: [ExamType, Sınav Tipi, Yazılı]
tags: [domain/academic]
table: master.exam_types
status: active
last-synced: 2026-08-10 (2270867)
---

# Sınav Türü

<!-- generated:start -->

## Nedir

Notun hangi ölçme aracından geldiği: 1. yazılı, sözlü, performans görevi, proje. Platform genelinde tanımlı şablon listedir.

Her tür iki şey taşır: **dönem sırası** (birinci dönem, ikinci dönem ya da her ikisi) ve **final notuna katkı ağırlığı** (yüzde).

## Kurallar

- Kod ve ad zorunludur; kod büyük harfe normalize edilir.
- Ağırlık 0-100 aralığındadır.
- Dönem sırası 0, 1 veya 2 olabilir — sıfır "her iki dönem" demektir.

## Ağırlık ikiliği — dikkat

Sınav ağırlığı **iki ayrı yerde** tanımlı:

- Burada, tür başına yüzde olarak.
- [[Okul Ayarları]]'nda, akademik politikanın parçası olarak yazılı ve performans ağırlığı (toplamları 100 olmak zorunda).

İkisinin de bugün **tüketicisi yok** — notlandırma modülü henüz yazılmamış. Not modülü geldiğinde hangisinin yetkili olacağına dair bir karar da yok.

## İlişkiler

- [[Not Ölçeği]] — birlikte notlandırma yapılandırmasını oluştururlar
- [[Dönem]] — sınav türü bir döneme (ya da her ikisine) aittir
- [[Okul Ayarları]] — okul düzeyindeki sınav sayısı ve ağırlıkları

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi; tür kataloğu

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Ağırlık iki yerde tanımlı ve ikisinin de tüketicisi yok.** Hangisi yetkili olacak?
- Okulun kendi yönetmeliğine göre tür ekleyip çıkarabilmesi ileri sürüm olarak işaretlenmiş; bugün liste sabit.
- Türlerin ağırlıklarının toplamının 100 olması gerektiğine dair bir kural yok — okul ayarı tarafında var, burada yok.
