---
aliases: [AcademicTerm, Yarıyıl, T1/T2]
tags: [domain/academic]
table: academic_terms
status: active
last-synced: 2026-08-10 (2270867)
---

# Dönem

<!-- generated:start -->

## Nedir

Bir sezonun içindeki akademik dönem — MEB dilinde "1. dönem / 2. dönem", kodda T1 ve T2. Not girişi, karne ve devamsızlık hesaplarının zaman kutusudur. [[Sezon]] aggregate'i tarafından sahiplenilir; bağımsız yaratılamaz.

Dönemin *tipi* ayrı bir master veridir (`academic_term_types`) ve `TermTypeId` ile referanslanır — dönem kaydının kendisi tenant'a, tipi sisteme aittir.

## Yaşam döngüsü

`NotStarted → Active → Closed`. `Closed` terminaldir (BR-AS-005).

- **NotStarted** — sezonla birlikte doğduğu hâl.
- **Active** — dönem yürürlükte.
- **Closed** — kapatılmış; geri açılamaz. Kapanış zamanı `ClosedAt` ile saklanır.

Dönem kapanışı bir domain event yayar ve karne üretimini tetikler (BR-AS-009) — yani "dönemi kapat" yalnızca bir statü değişimi değil, aşağı akışta iş başlatan bir olaydır.

## Kurallar

- `Closed` terminaldir; kapatılmış dönemde her işlem reddedilir (BR-AS-005).
- Yalnızca `Active` dönem kapatılabilir; `NotStarted` doğrudan kapatılamaz.
- Aynı sezonda yalnızca bir dönem aktif olabilir — bu invariant entity'de değil, handler katmanında doğrulanır.
- Başlangıç tarihi bitiş tarihinden önce olmalıdır.
- Tarih değişikliği yalnızca parent sezon `Setup` iken ve parent üzerinden yapılır; döneme doğrudan tarih yazılmaz.
- `Activate` idempotenttir; zaten aktif döneme ikinci çağrı no-op'tur.

## İlişkiler

- [[Sezon]] — sahip (owner); dönem sezonsuz var olamaz, sezonla birlikte yaratılır
- `academic_term_types` (master veri) — `TermTypeId` ile tip referansı; sabit lookup, ayrı not değil, [[Müfredat]]'ta yaşar
- [[Sınav Türü]] — sınav türleri bir döneme (ya da her ikisine) bağlıdır

## Geçtiği modüller

- [[Sezon Yönetimi]] — kavramın sahibi; aktive/kapatma akışları burada
- [[Nöbetler]] — [[Nöbet Çizelgesi]] ve [[Program İstisnası]] döneme bağlıdır; yük raporunun varsayılan tarih aralığı dönemden gelir
- [[Ders Programı Yönetimi]] — [[Ders Programı]], [[Program Sürümü]] ve [[Öğretmen Müsaitliği]] döneme bağlıdır
- [[Yoklama ve Devamsızlık]] — [[Yoklama Oturumu]] ve [[Devamsızlık Özeti]] döneme bağlıdır; eşik hesabı dönem toplamı üzerinden yapılır

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- "Aynı sezonda tek aktif dönem" kuralı entity'de değil handler'da duruyor. Bilinçli bir tercih mi (cross-aggregate olduğu için), yoksa domain'e taşınması gereken bir kaçak mı?
- Dönem kapanışının tetiklediği karne üretimi (BR-AS-009) bu repoda uçtan uca izlenemedi; report-cards tarafı taranmadı.
