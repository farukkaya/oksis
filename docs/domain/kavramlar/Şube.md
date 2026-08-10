---
aliases: [ClassRoom, Sınıf Şubesi]
tags: [domain/academic]
table: class_rooms
status: active
last-synced: 2026-08-10 (db8336b)
---

# Şube

<!-- generated:start -->

## Nedir

Bir sınıf seviyesinin (9. sınıf, 10. sınıf …) tek bir şubesi — MEB dilinde "şube", gündelik dilde "9-A". Öğrenciler şubeye atanır, ders programı ve yoklama şube üzerinden yürür. Kendi aggregate root'udur ve bir sezona aittir; sezon değişince şube taşınmaz, yeni sezonda yenisi üretilir.

Şube adı serbest metindir: "A", "B" kadar "Papatya", "Lale" da geçerlidir (saha bulgusu, sınır 2026-06-10'da 3'ten 30 karaktere genişletildi). Tek harfli adlar büyük harfe normalize edilir.

## Yaşam döngüsü

Okul ayarına bağlı olarak iki yol (BR-AS-008):

- Onay isteniyorsa: `Draft → PendingApproval → Active → Archived`
- İstenmiyorsa: `Draft → Active → Archived`

`Active` şubeye öğrenci atanabilir. `Archived` salt-okunurdur (BR-AS-014). Aktif şube tekrar `Draft`'a çekilebilir — şube statüsü, sezonun aksine tek yönlü değildir.

Öğrenci atamaları şube içinde `ClassRoomStudent` kayıtları olarak yaşar. Bunlar silinmez; ayrılışta `LeftAt` ve bir sebep (`Initial`, `Transfer`, `NewEnrollment`, `Graduation`, `Archive`, `Withdrawal`, `TransferOut`) yazılarak kapatılır — tarihsel kayıt korunur (BR-AS-011).

## Kurallar

- Aynı sezonda aynı (sınıf seviyesi, şube adı) ikilisi tekildir; DB unique index ile korunur, handler erken hata döndürür.
- Kapasite **soft** limittir: aşım engellenmez, UI uyarır. Mevcut öğrenci sayısının altına düşürmek de serbesttir. (2026-06-10 kararı; önceki hard kontroller kaldırıldı.)
- Kapasite değeri 1-100 aralığında olmalıdır — soft olan aşım kontrolü, alanın kendi sınırı değil.
- Öğrenci ataması yalnızca `Active` şubeye yapılır.
- Bir öğrencinin aynı şubede birden fazla aktif ataması olamaz; tenant genelinde tek-şube kontrolü handler katmanının sorumluluğudur.
- Transfer yalnızca aynı tenant ve aynı sezon içindeki iki farklı `Active` şube arasında yapılabilir (BR-AS-011). Kaynak atama `Transfer` sebebiyle kapatılır, hedefte yenisi açılır.
- Arşivlenmiş şubede hiçbir yazma işlemi kabul edilmez (BR-AS-014).
- Şube adı 1-30 karakter.

## İlişkiler

- [[Sezon]] — ID referansı; şube bir sezona aittir
- `ClassRoomStudent` — sahiplik (owned koleksiyon); öğrenci-şube atamasının tarihsel kaydı, ayrı not değil
- `SourceClassRoomId` — kendine referans; şubenin hangi kaynak şubeden terfi/klonla üretildiği ("köken bağı"), sezon geçişinde öğrenci terfisi bunu izler
- `GradeLevelId`, `HomeroomTeacherId`, `RoomId` — dış modüllere ID-only referanslar; henüz kavram notu yok

## Geçtiği modüller

- [[Sezon Yönetimi]] — kavramın sahibi; şube kurulumu, onay, atama, transfer, arşiv

Şubeyi kullanan ama henüz notu olmayan modüller: Students, Teachers, Attendance, Schools, Timetable, Users, Duties, Announcements.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Tek-şube invariant'ı ("bir öğrenci aynı anda tek şubede") entity içinde yalnızca şube-içi kontrol ediyor; tenant genelindeki kontrol handler'a bırakılmış. Bu kuralın tek bir yerde toplanması gerekir mi?
- `RoomId` "varsayılan derslik" olarak duruyor, saatlik derslik kullanımı Timetable'a ait. İki kavram ileride çakışacak mı?
