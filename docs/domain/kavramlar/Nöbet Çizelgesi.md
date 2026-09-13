---
aliases: [DutyRoster, Nöbet Listesi]
tags: [domain/academic]
table: academic.duty_rosters
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Nöbet Çizelgesi

<!-- generated:start -->

## Nedir

Bir [[Dönem]]'in nöbet planı: hangi öğretmen hangi gün hangi [[Nöbet Bölgesi]]'nde nöbetçi. Okulun duvarına asılan nöbet listesinin karşılığıdır.

Tek bir atama satırı üç şeyden oluşur — öğretmen, gün, bölge — ve isteğe bağlı bir **yancı** taşır. Yancı, nöbetçinin yardımcısıdır; MEB uygulamasındaki karşılığı öğle arasında nöbetçiyi kısa süre devralan öğretmendir. Okul ayarıyla açılıp kapanır.

**Nöbetin birimi gün + bölgedir, ders saati değil.** Aktif gözetim teneffüs, öğle arası ve giriş-çıkış pencerelerinde yapılır; öğretmen o gün kendi derslerini normal işler. Bu yüzden nöbet ile ders saati arasında **çakışma kavramı yoktur** ve nöbet ders programındaki boş saatlere yerleştirilmez. Gün değeri gerçek takvim günüdür ve yalnız hafta içi kullanılır ([[0013-gun-degeri-gercek-system-dayofweek]]).

Çizelge bir aggregate'tir: atamalar onun içinde yaşar ve bütün kurallar aggregate'in kendisinde zorlanır. Bu bilinçli bir seçim — bir atamayı tek başına yazan hiçbir yol yoktur, dolayısıyla kural atlanamaz.

## Yaşam döngüsü

`Taslak → Yürürlükte → Kapanmış`, ve her yayın bir sonraki sürümü doğurur.

- **Taslak** — düzenlenebilir tek durum. Atama, yancı, kaldırma yalnız burada.
- **Yürürlükte** — yayınlanmış canlı sürüm; yürürlük başlangıcı taşır. Düzenlenemez.
- **Kapanmış** — yerine yeni sürüm geçtiğinde bitiş tarihiyle kapatılır.

Değişiklik gerektiğinde canlı sürüm **kapatılır ve atamaları kopyalanmış yeni bir taslak** üretilir; yeni sürüm numarası artar ve öncekine bağlanır. Böylece "geçen ay kim nöbetçiydi" sorusu her zaman cevaplanabilir kalır — ve nöbet yükü bu sayede sürüm-doğru hesaplanır: dönem içinde yürürlüğe girmiş her sürüm, canlı ya da kapanmış, kendi yürürlük penceresi kadar sayılır; taslak hiç sayılmaz (bkz. [[Nöbetler]] → Nöbet yükü).

**Silme yoktur.** Sürüm zinciri tarihin kendisidir.

## Kurallar

Dört değişmez aggregate içinde zorlanır:

- **Muaf öğretmene nöbet atanamaz** — aggregate'e verilen muaf öğretmen kümesinde olan öğretmene atama reddedilir. Taslak kaydedilirken bu küme yalnız **sürekli** [[Nöbet Muafiyeti]] kayıtlarından kurulur: çizelge haftalık tekrar eden bir şablondur, geçici muafiyet ise tarihe bağlıdır ve şablona uygulanmaz. Geçici muafiyeti tarihe göre dikkate alan tek nöbet yazma yüzeyi otomatik dağıtımdır.
- **Aynı öğretmen aynı güne ikinci nöbet alamaz.**
- **Bölge kapasitesi aşılamaz** — kapasite, o bölgede aynı gün kaç kişinin paralel nöbet tutabileceğidir.
- **Yancı nöbetçinin kendisi olamaz**, ve yancı adayı o gün başka bir nöbette nöbetçi ya da yancı olamaz. Günler arası uygunluk kontrolü aggregate'in dışında, uygulama katmanında yapılır.

Yancı aday listesi ayrıca şunları uygular:

- Aday o gün, öğle penceresindeki ders saatlerinde **fiilen dersi olmayan** öğretmendir. Öğle penceresi [[Zil Çizelgesi]]'ndeki öğle arası sıralarından türetilir; okul öğle arası tanımlamamışsa bu kontrol atlanır ve herkes geçer.
- Aday listesinde yalnız **sürekli** muafiyeti olan öğretmen dışlanır; geçici muafiyet bu listede tarihe bakılarak süzülmez.
- Ayrılmış ve aktif olmayan öğretmenler aday olmaz; adaylar mevcut nöbet sayısına (az olan önce), sonra ada göre sıralanır.

Ayrıca:

- **Elle atama, yancılık ve vekâlet öğretmen müsaitliğine bakmaz.** Müsaitlik ders saatlerinin planlama girdisidir; yancı için sorulan soru "öğle arasında fiilen dersi var mı"dır. Müsaitliği okuyan tek nöbet yüzeyi otomatik dağıtımdır.
- Yalnız taslak düzenlenebilir; yayınlanmış veya kapanmış çizelgeye yazılamaz.
- **Boş çizelge yayınlanamaz.**
- Yalnız yürürlükteki sürüm kapatılabilir.
- Yayın, etkilenen öğretmenlere bildirim gönderir; tekrarlı gönderimi önleyen anahtar çizelge ve sürüm numarasından türetilir.

## İlişkiler

- [[Dönem]] — çizelge bir döneme aittir
- [[Nöbet Bölgesi]] — atamanın mekân ayağı; kapasite kuralının kaynağı; yayında kullanılan bölge silinemez
- [[Nöbet Muafiyeti]] — atamayı engelleyen kayıt
- [[Profil]] — nöbetçi ve yancı; öğretmen profili
- [[Zil Çizelgesi]] — yancı kontrolündeki öğle penceresinin kaynağı
- [[Ders Programı]] — yancı adayının öğle arasındaki fiili dersi buradan okunur
- `DutyAssignment` — sahiplik (owned koleksiyon); tek nöbet satırı, ayrı not değil

## Geçtiği modüller

- [[Nöbetler]] — kavramın sahibi; kurma, otomatik dağıtım, yayın, sürümleme, yük raporu

- [[Bildirimler]] — yayın etkilenen öğretmenlere bildirim üretir
- [[Görevlendirmeler]] — öğretmen yükü ekranında canlı çizelgedeki nöbet günü sayısı, okul katsayısıyla ders dışı yük saatine çevrilir (yalnız bilgi amaçlı)

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Çizelge sezon kimliğini eski `AcademicYearId` adıyla taşıyor; diğer modüller `AcademicSessionId`'ye taşındı. Bu bir kalıntı mı, yoksa bilinçli bir ayrım mı?
- Yancı adayı için "günler arası uygunluk" uygulama katmanına bırakılmış. Bu kuralın aggregate dışında kalmasının gerekçesi ne?
