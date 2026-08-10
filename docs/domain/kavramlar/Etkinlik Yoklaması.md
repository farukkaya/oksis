---
aliases: [ActivityRollCall, ActivityGroup, ActivityTour, Gezi Sayımı, Etkinlik]
tags: [domain/academic]
table: academic.activity_roll_calls
status: active
last-synced: 2026-08-10 (2270867)
---

# Etkinlik Yoklaması

<!-- generated:start -->

## Nedir

Gezi, tören veya okul dışı etkinlikte yapılan **güvenlik sayımı**. "Otobüse binerken 32 kişiydik, dönüşte 32 kişi miyiz" sorusunun kaydıdır.

Ders yoklamasıyla karıştırılmamalıdır ve ayrımı tek cümlede duruyor: **etkinlik sayımı devamsızlık hesabına girmez.** Tersine, etkinliğe katılan öğrencilerin o saatlerdeki ders yoklamaları toplu olarak mazeretlenir — çocuk gezideyken derste "yok" yazılmaz.

## Yapısı

Bir etkinlik üç katmandan oluşur:

- **Gruplar** — etkinlik sorumlu öğretmenlere bölünür ("9-A Grubu"). Aynı öğretmen aynı etkinlikte birden çok grubu yönetebilir; bu yüzden grup ayrı bir kayıttır, öğretmen kimliği tek başına ayırt edici değildir.
- **Turlar** — grubun sayım noktaları ("gidiş yoklaması", "dönüş yoklaması"). Planlanan saati ve en son kaydedilme anı vardır.
- **Katılımcılar** — grubun listesi. Liste **grubun tüm turlarında ortaktır**, tur başına ayrı liste yoktur.

## Yaşam döngüsü

Oluşturulur, düzenlenir, gerekirse iptal edilir. **İptal sayım kayıtlarını silmez** — kim ne zaman iptal etti bilgisi denetim izi olarak kalır. İkinci kez iptal reddedilir.

## Kurallar

- Etkinlik adı zorunludur.
- Grupta en az bir katılımcı kalmalıdır.
- Katılımcı listesi güncellenirken tam değiştirme uygulanır: listede olmayanlar çıkarılır, yeni gelenler **sonradan eklendi** işaretiyle girer, zaten olanlara dokunulmaz — mevcut izleri ve sayım kayıtları korunur.
- Sorumluluk devrinde **önceki öğretmenin kimliği** saklanır, adı değil; ad snapshot'lamak kişi adı değişince bayatlar.
- Devir aynı öğretmene yapılamaz. Gerekçe isteğe bağlıdır.
- Alınmış sayım kayıtları devirle silinmez — sayım bir güvenlik kaydıdır.
- Toplu mazeretleme boş listeyle çağrılamaz; ders yoklamalarına yansıtma uygulama katmanında yapılır.

## İlişkiler

- [[Yoklama Oturumu]] — katılımcıların ders yoklamaları toplu mazeretlenir
- [[Kişi]] — sorumlu öğretmenler ve katılımcı öğrenciler
- [[Sezon]] — etkinlikler sezon bazında listelenir

## Geçtiği modüller

- [[Yoklama ve Devamsızlık]] — kavramın sahibi; etkinlik tanımlama, gruplar, turlar, sayım, iptal

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Grup sorumluluğu devredildiğinde turlardaki öğretmen kopyası güncellenmiyor.** Tur oluşturulurken grubun öğretmeni kopyalanıyor; devirden sonra tur eski öğretmende kalıyor. İki alan aynı şeyi söylemeye çalışıyor ve ayrışabiliyor — turdaki kopya kaldırılmalı mı?
- İptal alanı arayüz sözleşmesinde tek "l" ile (`canceled`), hata kodunda çift "l" ile (`Cancelled`) yazılıyor. Bilinçli ama kolayca yanlış yazılabilir bir tuzak.
- Etkinlik bir sezona bağlı değil, yalnız tarihi var. Sezon bazlı listeleme tarihten mi türetiliyor?
