---
aliases: [ClassRoom, Branch (Timetable), BranchId (Timetable), Sınıf Şubesi]
tags: [domain/academic]
table: class_rooms
status: active
last-synced: 2026-08-10 (2270867)
---

# Şube

<!-- generated:start -->

## Nedir

Bir sınıf seviyesinin (9. sınıf, 10. sınıf …) tek bir şubesi — MEB dilinde "şube", gündelik dilde "9-A". Öğrenciler şubeye atanır, ders programı ve yoklama şube üzerinden yürür. Kendi aggregate root'udur ve bir sezona aittir; sezon değişince şube taşınmaz, yeni sezonda yenisi üretilir.

Şube adı serbest metindir: "A", "B" kadar "Papatya", "Lale" da geçerlidir (saha bulgusu, sınır 2026-06-10'da 3'ten 30 karaktere genişletildi). Tek harfli adlar büyük harfe normalize edilir.

⚠️ **Adlandırma tuzağı:** Ders programı tarafında bu kavrama kodda **`Branch`** deniyor — `ScheduleProgram.BranchId`, `LessonPlacement.BranchId` ve `ScheduleException.BranchId` hep bu tabloyu işaret eder. Aynı isim müfredat tarafında **branş** demektir ([[Branş]]) ve ayrı bir tablodur. Bir `BranchId` görünce hangi modülde olduğuna bakmadan join yazma.

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
- Öğrenci ataması yalnızca `Active` şubeye yapılır. `Draft`'a çekilen şubede **mevcut öğrenciler kalır**, yalnız yeni atama engellenir.
- Bir öğrencinin okul genelinde en fazla **bir aktif ataması** olabilir. Bu kural artık handler'a bırakılmış değil: `(school_id, student_id) WHERE left_at IS NULL` filtreli unique index'i ile veritabanı seviyesinde korunur; ihlal `STUDENT_ALREADY_ASSIGNED` olarak döner.
- Atama sebebi elle girilmez: öğrencinin daha önce kapanmış bir kaydı varsa `NewEnrollment`, yoksa `Initial` olarak türetilir.
- Transfer yalnızca aynı tenant ve aynı sezon içindeki iki farklı `Active` şube arasında yapılabilir (BR-AS-011). Kaynak atama `Transfer` sebebiyle kapatılır, hedefte yenisi açılır.
- Arşivlenmiş şubede hiçbir yazma işlemi kabul edilmez (BR-AS-014).
- Arşivleme ve silme, **aktif öğrenci varken** reddedilir; önce öğrenciler taşınmalıdır. Sezon kapanışında ayrı bir yol vardır: aktif atamalar `Archive` sebebiyle topluca kapatılır ve şube arşive geçer.
- Silme arşivlemeden farklıdır: statü engel değildir, kayıt fiziksel silinmez (`is_deleted`) ve (sezon, seviye, şube adı) slotu serbest kalır — aynı ad yeniden açılabilir.
- Şube adı 1-30 karakter.
- Öğrenci [[Profil]]'indeki "güncel şube" alanı bu defterin **aynasıdır**, ayrı bir doğruluk kaynağı değil: defter her değiştiğinde aynı transaction içinde bir interceptor tarafından türetilir.
- [[Öğrenci Kaydı]] da bir şube alanı taşır ve o da aynadır — ama **otomatik senkron değildir**: yalnız terfi akışında yazılır. Yıl içi transfer bu alana dokunmaz, dolayısıyla bayatlayabilir. Şube sorusunun tek güvenilir cevabı defterdir.

## İlişkiler

- [[Sezon]] — ID referansı; şube bir sezona aittir
- [[Sınıf Seviyesi]] — şubenin kademesi; şube adının öneki bu kaydın kodundan üretilir
- [[Derslik]] — şubenin sabit ev odası (opsiyonel); bir oda birden çok şubeye atanabilir
- `ClassRoomStudent` — sahiplik (owned koleksiyon); öğrenci-şube atamasının tarihsel kaydı, ayrı not değil
- `SourceClassRoomId` — kendine referans; şubenin hangi kaynak şubeden terfi/klonla üretildiği ("köken bağı"), sezon geçişinde öğrenci terfisi bunu izler
- `HomeroomTeacherId` — rehber öğretmene ID-only referans; şube rehbersiz kalabilir

## Geçtiği modüller

- [[Sınıflar ve Şubeler]] — kavramın sahibi; kurulum, onay, rehber öğretmen/derslik, atama, transfer, arşiv, silme
- [[Sezon Yönetimi]] — sezon geçişinde şubelerin üretilmesi ve öğrenci terfisi
- [[Görevlendirmeler]] — [[Şube Ders Görevlendirmesi]]'nin şube ekseni; sezon kopyalaması şubenin köken bağını izler
- [[Yoklama ve Devamsızlık]] — [[Yoklama Oturumu]] şube bazında üretilir
- [[Öğrenci Kayıt Yönetimi]] — terfi sırasında yenileme taslakları şube koltuğuna yerleşir
- [[Kullanıcılar]] — öğrenci [[Profil]]'i güncel şube bağını taşır; öğretmenin erişim kapsamı kendi şubeleriyle sınırlıdır

Şubeyi kullanan ama henüz notu olmayan modüller: Students, Teachers, Attendance, Schools, Timetable, Duties, Announcements.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Tek-şube invariant'ı ("bir öğrenci aynı anda tek şubede") entity içinde yalnızca şube-içi kontrol ediyor; tenant genelindeki kontrol handler'a bırakılmış. Bu kuralın tek bir yerde toplanması gerekir mi?
- `RoomId` "varsayılan derslik" olarak duruyor, saatlik derslik kullanımı Timetable'a ait. İki kavram ileride çakışacak mı?
