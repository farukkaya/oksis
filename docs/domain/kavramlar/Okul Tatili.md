---
aliases: [SchoolHoliday, Tatil, Yarıyıl Tatili]
tags: [domain/academic]
table: school_holidays
status: active
last-synced: 2026-08-10 (db8336b)
---

# Okul Tatili

<!-- generated:start -->

## Nedir

Bir sezonun takvimindeki eğitime kapalı gün veya aralık. Sisteme gömülü resmî tatil listesinden (`official_holidays` master verisi) ayrıdır: burada kameri takvime bağlı dini bayramlar ve okula özel kapanışlar tutulur — yani tenant'ın kendi takvimi.

Tipler: resmî tatil, okul etkinliği, eğitime kapalı gün ve yarıyıl tatili (T1-T2 arası).

## Yaşam döngüsü

Basit: sezon takvimine eklenir, güncellenir, silinir. Statü makinesi yoktur. Sezona bağlıdır ve sezon geri alındığında (`Setup` iptali) sezonla birlikte silinir.

Tatil kaydı oluşturulurken sezon ID'si istemciden alınmaz; sunucu aktif sezonu kendisi çözer (BR-SS-013). Aktif sezon yoksa kayıt sezonsuz oluşur.

## Kurallar

- Tatil aralığı, bağlı olduğu sezonun başlangıç-bitiş aralığı içinde olmalıdır. Bu kontrol cross-aggregate olduğu için domain'de değil Application katmanında yapılır.
- Sezon ID'si sunucu tarafından çözülür, request gövdesinden okunmaz (BR-SS-013).
- Ad en fazla 150, açıklama en fazla 500 karakter.
- Tekrar eden (`IsRecurring`) tatil işareti taşınabilir.

## İlişkiler

- [[Sezon]] — ID referansı; tatil bir sezonun takvimine aittir
- `official_holidays` (master veri) — ayrı ve daha geniş kapsamlı resmî tatil listesi; bu kavramın kopyası değil, tamamlayıcısı

## Geçtiği modüller

- [[Sezon Yönetimi]] — kavramın sahibi; sezon takvimi burada kurulur

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Kod tabanında iki ayrı `HolidayType` enum'u var: `AcademicSessions.Enums.HolidayType` (yarıyıl tatili değerini içerir) ve `Schools.Enums.HolidayType`. Ayrım bilinçli mi, yoksa tek tipte birleşmeli mi?
- Tatilin devamsızlık/yoklama hesabına nasıl girdiği bu taramada doğrulanmadı — Attendance tarafı kapsam dışıydı.
