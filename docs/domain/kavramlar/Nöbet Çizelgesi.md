---
aliases: [DutyRoster, Nöbet Listesi]
tags: [domain/academic]
table: academic.duty_rosters
status: active
last-synced: 2026-08-10 (2270867)
---

# Nöbet Çizelgesi

<!-- generated:start -->

## Nedir

Bir [[Dönem]]'in nöbet planı: hangi öğretmen hangi gün hangi [[Nöbet Bölgesi]]'nde nöbetçi. Okulun duvarına asılan nöbet listesinin karşılığıdır.

Tek bir atama satırı üç şeyden oluşur — öğretmen, gün, bölge — ve isteğe bağlı bir **yancı** taşır. Yancı, nöbetçinin yardımcısıdır ve okul ayarıyla açılıp kapanır.

Çizelge bir aggregate'tir: atamalar onun içinde yaşar ve bütün kurallar aggregate'in kendisinde zorlanır. Bu bilinçli bir seçim — bir atamayı tek başına yazan hiçbir yol yoktur, dolayısıyla kural atlanamaz.

## Yaşam döngüsü

`Taslak → Yürürlükte → Kapanmış`, ve her yayın bir sonraki sürümü doğurur.

- **Taslak** — düzenlenebilir tek durum. Atama, yancı, kaldırma yalnız burada.
- **Yürürlükte** — yayınlanmış canlı sürüm; yürürlük başlangıcı taşır. Düzenlenemez.
- **Kapanmış** — yerine yeni sürüm geçtiğinde bitiş tarihiyle kapatılır.

Değişiklik gerektiğinde canlı sürüm **kapatılır ve atamaları kopyalanmış yeni bir taslak** üretilir; yeni sürüm numarası artar ve öncekine bağlanır. Böylece "geçen ay kim nöbetçiydi" sorusu her zaman cevaplanabilir kalır.

**Silme yoktur.** Sürüm zinciri tarihin kendisidir.

## Kurallar

Dört değişmez aggregate içinde zorlanır:

- **Muaf öğretmene nöbet atanamaz** — [[Nöbet Muafiyeti]] o hafta kapsıyorsa atama reddedilir.
- **Aynı öğretmen aynı güne ikinci nöbet alamaz.**
- **Bölge kapasitesi aşılamaz** — kapasite, o bölgede aynı gün kaç kişinin paralel nöbet tutabileceğidir.
- **Yancı nöbetçinin kendisi olamaz**, ve yancı adayı o gün başka bir nöbette nöbetçi ya da yancı olamaz. Günler arası uygunluk kontrolü aggregate'in dışında, uygulama katmanında yapılır.

Ayrıca:

- Yalnız taslak düzenlenebilir; yayınlanmış veya kapanmış çizelgeye yazılamaz.
- **Boş çizelge yayınlanamaz.**
- Yalnız yürürlükteki sürüm kapatılabilir.
- Yayın, etkilenen öğretmenlere bildirim gönderir; tekrarlı gönderimi önleyen anahtar çizelge ve sürüm numarasından türetilir.

## İlişkiler

- [[Dönem]] — çizelge bir döneme aittir
- [[Nöbet Bölgesi]] — atamanın mekân ayağı; kapasite kuralının kaynağı
- [[Nöbet Muafiyeti]] — atamayı engelleyen kayıt
- [[Profil]] — nöbetçi ve yancı; öğretmen profili
- `DutyAssignment` — sahiplik (owned koleksiyon); tek nöbet satırı, ayrı not değil

## Geçtiği modüller

- [[Nöbetler]] — kavramın sahibi; kurma, otomatik dağıtım, yayın, sürümleme, yük raporu

- [[Bildirimler]] — yayın etkilenen öğretmenlere bildirim üretir

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Çizelge sezon kimliğini eski `AcademicYearId` adıyla taşıyor; diğer modüller `AcademicSessionId`'ye taşındı. Bu bir kalıntı mı, yoksa bilinçli bir ayrım mı?
- Yancı adayı için "günler arası uygunluk" uygulama katmanına bırakılmış. Bu kuralın aggregate dışında kalmasının gerekçesi ne?
