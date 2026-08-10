---
aliases: [Holiday, SchoolHoliday (deprecated), Tatil, Yarıyıl Tatili]
tags: [domain/academic]
table: academic.school_holidays
status: active
last-synced: 2026-08-10 (2270867)
---

# Okul Tatili

<!-- generated:start -->

## Nedir

Bir sezonun takvimindeki eğitime kapalı gün veya aralık. Sisteme gömülü resmî tatil listesinden (`official_holidays` master verisi) ayrıdır: burada kameri takvime bağlı dini bayramlar ve okula özel kapanışlar tutulur — yani tenant'ın kendi takvimi.

Tipler: resmî tatil, okul etkinliği, eğitime kapalı gün, yarıyıl tatili (T1-T2 arası) ve ara tatil.

⚠️ **Kod tarafında iki sınıf var, biri ölü.** Canlı olan `Schools` modülündeki `Holiday`'dir — `DbSet`, EF konfigürasyonu ve tüm handler'lar onu kullanır. `AcademicSessions` modülündeki `SchoolHoliday` sınıfı **hiçbir yere bağlı değildir**: konfigürasyonu yok, `DbSet`'i yok, hiçbir handler tipini kullanmıyor. İkisi de aynı tabloyu anlatıyor; sezon tatili uçlarının adı `SchoolHoliday` olsa bile gövdeleri `Holiday` üzerinden çalışır. Ölü sınıfa bakıp kural çıkarma.

## Yaşam döngüsü

Basit: sezon takvimine eklenir, güncellenir, silinir. Statü makinesi yoktur. Sezona bağlıdır ve sezon geri alındığında (`Setup` iptali) sezonla birlikte silinir.

Tatil kaydı oluşturulurken sezon ID'si istemciden alınmaz; sunucu aktif sezonu kendisi çözer (BR-SS-013). Aktif sezon yoksa kayıt sezonsuz oluşur.

## Kurallar

- Tatil aralığı, bağlı olduğu sezonun başlangıç-bitiş aralığı içinde olmalıdır. Bu kontrol cross-aggregate olduğu için domain'de değil Application katmanında yapılır.
- Sezon ID'si sunucu tarafından çözülür, request gövdesinden okunmaz (BR-SS-013). Sezon bağı **opsiyoneldir**: geçiş dönemi gereği eski kayıtlar sezonsuz kalabilir.
- Tekrar eden (`IsRecurring`) tatil işareti taşınabilir.
- Canlı sınıf uzunluk doğrulaması yapmaz; alan sınırları veritabanı ve istek doğrulayıcısı tarafında kalır.

## İlişkiler

- [[Sezon]] — opsiyonel ID referansı; tatil bir sezonun takvimine bağlanabilir
- [[Okul Ayarları]] — takvim okul ayarları yüzeyinden de yönetilir
- [[Resmî Tatil]] — sabit tarihli ulusal tatiller; bu kavramın kopyası değil **tamamlayıcısı**. Dini bayramlar kameri takvime bağlı olduğu için orada tutulamaz, buraya elle eklenir.

## Geçtiği modüller

- [[Okul Yönetimi]] — canlı sınıfın sahibi; tatil takvimi burada yönetilir
- [[Sezon Yönetimi]] — sezon takvimi görünümü ve sezon geri alındığında temizlik

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Kod tabanında iki ayrı `HolidayType` enum'u var: `AcademicSessions.Enums.HolidayType` (yarıyıl tatili değerini içerir) ve `Schools.Enums.HolidayType`. Ayrım bilinçli mi, yoksa tek tipte birleşmeli mi?
- Tatilin devamsızlık/yoklama hesabına nasıl girdiği bu taramada doğrulanmadı — Attendance tarafı kapsam dışıydı.
