---
aliases: [TeachingAssignment, Öğretmen Görevlendirmesi, Görevlendirme v1]
tags: [domain/academic]
table: academic.teaching_assignments
status: removed
last-synced: 2026-09-13 (294ffe6)
---

# Şube Ders Görevlendirmesi

<!-- generated:start -->

## Durum: kaldırıldı (2026-08-18)

Bu kayıt ve tablosu kodda **yok**. Not tarihçe ve arama köprüsü olarak durur: eski bir migration'da, bir yorumda ya da izin adında `TeachingAssignment` / `teaching-assignments` görüp buraya düşen kişi, bugünkü karşılığı aşağıda bulur. Görevlendirmenin tek kanonik kaydı artık [[Ders Görevlendirmesi]]'dir (`K-10`, `X-15`).

## Neydi

"Bu öğretmen bu şubede bu dersi haftada şu kadar saat verir" cümlesinin elle tutulan kaydı: öğretmen × [[Şube]] × [[Ders]] × [[Sezon]] ve 1-40 arası haftalık saat. Öğretmen yükü bu saatlerin toplamıydı, ders programının otomatik üretimi de talebini buradan alıyordu.

## Neden kaldırıldı

Kayıt, **fiili yükün elle tutulan bir kopyasıydı** — yani programın her değişiminde bayatlaması kaçınılmaz bir kaynak. Ölçüm bunu doğruladı:

- Tabloya yazan tek yol seed verisi ve sezon devri kopyasıydı; yazma ucu vardı ama **hiçbir istemci çağırmıyordu**. Görevlendirmeler ekranı zaten yetkinlik kaydına yazıyordu.
- Arayüzden kurulan bir okulda tablo **boştu**. Onu okuyan her yüzey — öğretmen yükü, öğretmenin ders listesi, görev geçmişi, duyuru hedef havuzu, vekil adayları, otomatik program üretimi — hata vermeden **boş sonuç** döndü. Geliştirme okullarında doğru görünmesinin tek sebebi seed verisiydi.
- Seed satırları okula ait olmayan dersleri taşıdığı için otomatik üretim bir lise şubesine ortaokul derslerini yerleştirdi.

"İki kaynağı birbirine senkron tutmak" seçeneği bilinçli olarak reddedildi: iki doğruluk kaynağının en kötü hâlidir ve senkron kodu kalıcı bakım borcudur.

## Yerini ne aldı

- **Kim hangi dersi verebilir** → [[Ders Görevlendirmesi]] (yetkinlik, sezona bağlı)
- **Hangi şube, kaç saat** → programı üretilen şubenin kendisi ve kademenin müfredatı ([[Haftalık Ders Saati]])
- **Kim nerede kaç saat veriyor (fiili yük), öğretmenin dersleri** → yayınlanmış [[Ders Programı]]'ndan türetilir
- **Görev geçmişi** → yetkinlik kayıtları (kapatılan kayıt silinmez); hangi şubede ders verildiğinin izi [[Program Sürümü]]'nde yaşar
- **"9-A'yı şu öğretmen alsın" niyeti** → [[Dağıtım Kısıtı]]

## Kalıntılar

- `teaching-assignments.view` izni **duruyor**: öğretmenin ders listesi ve görev geçmişi okumalarını korur. İki okuma da artık bu tablodan değil, canlı programdan ve yetkinlik kaydından beslenir. `assign` ve `copy-season` izinleri yazma yüzeyiyle birlikte kalktı.
- Kaldırma migration'ının geri alması şemayı geri getirir, **satırları getirmez**.

## İlişkiler

- [[Ders Görevlendirmesi]] — yerine geçen kanonik kayıt
- [[Ders Programı]] — fiili yükün yeni kaynağı
- [[Dağıtım Kısıtı]] — dağıtım niyetinin yeni ifadesi

## Geçtiği modüller

- [[Görevlendirmeler]] — eskiden sahibiydi; bugün yalnız yetkinlik kaydıyla çalışır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- (Şu an açık soru yok.)
