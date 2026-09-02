---
aliases: [ExamType, Sınav Tipi, Sınav, Yazılı (eski ad)]
tags: [domain/academic]
table: master.exam_types
status: active
last-synced: 2026-09-03 (b72c819)
---

# Sınav Türü

<!-- generated:start -->

## Nedir

Notun hangi ölçme aracından geldiği: 1. sınav, 2. sınav, sözlü, performans görevi, proje. Platform genelinde tanımlı master listedir; [[Not Defteri]]'nin sütun kataloğu buradan gelir — her tür bir [[Değerlendirme]] sütununun adı ve kimliğidir.

Her tür bir **dönem sırası** taşır: birinci dönem, ikinci dönem ya da her ikisi. Numaralandırma **dönem içinde** sayılır, sezon boyunca değil — ikinci dönem de "1. Sınav" ile başlar, "3. Sınav" diye sürmez. Görünen ad "Sınav"dır, "Yazılı" değil: MEB'in 2023 sonrası yönetmelik dili budur ve sözlü de bir sınavdır. Kodlar (`VZ1` gibi) kalıcı anahtardır ve görünen adla birlikte değişmemiştir.

## Kurallar

- Kod ve ad zorunludur; kod büyük harfe normalize edilir.
- Dönem sırası 0, 1 veya 2 olabilir — sıfır "her iki dönem" demektir. Defter sütunları dönemin sırasına uyan türlerden kurulur; döneme ait olmayan türle not girme denemesi 404'tür.
- Bir defterde bir türden tek sütun açılır.
- Görüntü sırası iki dönemde aynı değerleri alır; dönem kümeleri kesişmediği için çakışma doğurmaz.

## Ağırlık burada değil

Sınav ağırlığı bir zamanlar **iki ayrı yerde** tanımlıydı: burada tür başına yüzde, [[Okul Ayarları]]'nda yazılı/performans ağırlığı. İkisinin de tüketicisi yoktu. 2026-08-31'de buradaki kolon kaldırıldı: bu tablo master veridir, tüm okullarda ortaktır; ağırlık ise okulun kararıdır — bkz. [[0001-sinav-agirligi-okul-politikasinda]]. Dönem içi ders ortalaması bugün ağırlıksızdır.

## İlişkiler

- [[Değerlendirme]] — sütunun adı ve kimliği bu türden gelir; kopyalanmaz
- [[Not Defteri]] — sütun kataloğu; tür başına tek sütun
- [[Not Ölçeği]] — birlikte notlandırma yapılandırmasını oluştururlar
- [[Dönem]] — sınav türü bir döneme (ya da her ikisine) aittir
- [[Okul Ayarları]] — okul düzeyindeki sınav sayısı ve ağırlıkları

## Geçtiği modüller

- [[Müfredat]] — kavramın sahibi; tür kataloğu
- [[Notlar]] — sütun kataloğu; dönem süzgeci ve tekillik burada uygulanır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- ~~Ağırlık iki yerde tanımlı ve ikisinin de tüketicisi yok.~~ 2026-08-31'de kapandı: ağırlık okul politikasında ([[0001-sinav-agirligi-okul-politikasinda]]).
- Okulun kendi yönetmeliğine göre tür ekleyip çıkarabilmesi ileri sürüm olarak işaretlenmiş; bugün liste sabit ve [[Notlar]] modülü bunu kapsam dışı bırakıyor.
- Okulun "yazılı sayısı" politikası (1–3) ile katalogdaki iki sınav sütunu birbirini doğrulamıyor; üç yazılı seçen okul üçüncü sütunu nereden açacak?
