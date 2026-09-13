---
aliases: [Holiday, SchoolHoliday (deprecated), Tatil, Yarıyıl Tatili]
tags: [domain/academic]
table: academic.school_holidays
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Okul Tatili

<!-- generated:start -->

## Nedir

Bir sezonun takvimindeki eğitime kapalı gün veya aralık — tenant'ın kendi takvimi. Platform genelindeki [[Resmî Tatil]] listesinden ayrıdır: millî ve dini bayramlar orada tutulur, okulun kendi günleri ve sezon tatilleri burada.

Tipler: resmî tatil, okul etkinliği, eğitime kapalı gün, yarıyıl tatili (1. ve 2. dönem arası) ve ara tatil. Tipler iki gruba ayrılır:

- **Kilitli** — resmî tatil, yarıyıl tatili, ara tatil. MEB kataloğundan ya da sezon ayarlarından gelir; okul değiştiremez.
- **Okulun yönettiği** — okul etkinliği ve eğitime kapalı gün.

Kod tarafında bir zamanlar iki tatil sınıfı vardı: canlı `Holiday` ve hiçbir yere bağlı olmayan `SchoolHoliday`. Ölü ikiz silindi; üzerinde yazılı kalmış doğrulamalar canlı sınıfa taşındı (TB-34). Sezon tatili uçlarının adında `SchoolHoliday` geçse de tek sınıf `Holiday`'dir.

## Yaşam döngüsü

Basit: sezon takvimine eklenir, güncellenir, silinir. Statü makinesi yoktur. Sezona bağlıdır ve sezon geri alındığında (`Setup` iptali) sezonla birlikte silinir.

Tatil kaydı oluşturulurken sezon ID'si istemciden alınmaz; sunucu aktif sezonu kendisi çözer (BR-SS-013). Aktif sezon yoksa kayıt sezonsuz oluşur.

Yarıyıl tatili okulca girilmez: sezon taslaktan açılırken taslaktaki yarıyıl tarihlerinden yazılır.

## Kurallar

- Tatil aralığı, bağlı olduğu sezonun başlangıç-bitiş aralığı içinde olmalıdır. Bu kontrol cross-aggregate olduğu için domain'de değil Application katmanında yapılır.
- Sezon ID'si sunucu tarafından çözülür, request gövdesinden okunmaz (BR-SS-013). Sezon bağı **opsiyoneldir**: geçiş dönemi gereği eski kayıtlar sezonsuz kalabilir.
- Tekrar eden (`IsRecurring`) tatil işareti taşınabilir.
- Ad zorunludur ve en fazla 200 karakter, açıklama en fazla 500 karakterdir; bitiş tarihi başlangıçtan önce olamaz. Bu doğrulamalar oluşturma ile güncellemenin ortak kontrolündedir (TB-34).
- **Kilitli tipler okulca oluşturulamaz, güncellenemez, silinemez** (`holiday.locked-type`). Okul yalnız okul etkinliği ve eğitime kapalı gün yönetir.
- **Yarıyıl üçüncü bir dönem değildir**, iki dönem arasındaki tatildir: `1. dönem bitişi < yarıyıl başı ≤ yarıyıl sonu < 2. dönem başı`. Sezon taslaktan açılırken doğrulanır (bkz. [[Dönem]]).
- **Sezon geçişinde kopya:** yeni sezon açılırken istenirse önceki sezonun yalnız okul etkinlikleri ve eğitime kapalı günleri kopyalanır. Tarihler **bir yıl ileri kaydırılır**; yeni sezon aralığının dışına düşen kayıt hata üretmeden atlanır. Kilitli tipler kopyalanmaz — yarıyıl yeni taslaktan yazılır.

## İlişkiler

- [[Sezon]] — opsiyonel ID referansı; tatil bir sezonun takvimine bağlanabilir
- [[Dönem]] — yarıyıl tatili iki dönemin arasına düşer
- [[Okul Ayarları]] — takvim okul ayarları yüzeyinden de yönetilir
- [[Resmî Tatil]] — tamamlayıcısı; millî ve dini bayramlar platform listesinde, okulun kendi günleri ve sezon tatilleri burada

## Geçtiği modüller

- [[Okul Yönetimi]] — canlı sınıfın sahibi; tatil takvimi burada yönetilir
- [[Sezon Yönetimi]] — sezon takvimi görünümü, taslaktan açılışta yarıyıl yazımı ve önceki sezondan kopya, sezon geri alındığında temizlik

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Tatilin devamsızlık/yoklama hesabına nasıl girdiği bu taramada doğrulanmadı — Attendance tarafı kapsam dışıydı.
- Ara tatil ve bu tablodaki resmî tatil tipi kilitli, ama onları yazan bir akış yok (MEB / sezon beslemesi henüz kurulmadı). Bu iki tip bugün yalnız eski kayıtlarda mı yaşıyor?
