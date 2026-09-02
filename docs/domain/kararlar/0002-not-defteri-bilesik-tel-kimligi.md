---
tags: [decision, domain/academic]
date: 2026-08-23
status: accepted
---

# 0002 — Not defteri ve sütunun tel kimliği koordinattan kurulur

## Bağlam

[[Not Defteri]] ve [[Değerlendirme]] satırları tembel oluşur: öğretmen ilk notu girene kadar veritabanında karşılıkları yoktur. Ama listede görünürler ve tıklanabilirler — yani var olmayan bir şeye kimlikle gitmek gerekir. Sözleşme kimliği zaten metin olarak tanımlıyordu, Guid olarak değil.

## Karar

Defterin kimliği `dönem.şube.ders`, sütunun kimliği `dönem.şube.ders.sınavTürü` bileşik anahtarıdır; okunabilir ve geri çevrilebilir.

## Değerlendirilen alternatifler

- **Boş satırları önden yaratmak** — her şube × ders × dönem için satır demek; çoğu hiç kullanılmaz, üstelik "defter var mı" sorusunun anlamı kaybolur.
- **Listeleme sırasında yaratmak** — okuma ucunun yan etkisi olur; tasarım hedefi bunu açıkça yasaklıyor.
- **Deterministik Guid (hash)** — geri çevrilemez; satırı olmayan bir defterin kimliğinden koordinatına dönülemezdi.

## Sonuçları

Satırsız defter ve sütun adreslenebilir; istemci var olmayan sütunu sınav türü kimliğiyle adresler ve ilk not girişinde sunucu onu gerçek satıra dönüştürür. Bedeli: kimlik ayrıştırma her handler'ın açılışında yapılır ve bozuk kimlik 404'tür. Sınav türü döneme ait değilse de 404.

## İlgili

- [[Not Defteri]]
- [[Değerlendirme]]
- [[Notlar]]
