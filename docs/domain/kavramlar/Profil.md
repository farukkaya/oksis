---
aliases: [Profile, StudentProfile, TeacherProfile, ParentProfile, StaffProfile, Rol Profili]
tags: [domain/people]
table: identity.profiles
status: active
last-synced: 2026-08-10 (2270867)
---

# Profil

<!-- generated:start -->

## Nedir

Bir [[Kişi]]'nin belirli bir roldeki verisini taşıyan kayıt. Kişi "kim"dir, profil "ne olarak" sorusunun cevabıdır: öğrenci numarası öğrenci profilinde, branş öğretmen profilinde, adres veli profilinde yaşar.

Dört tip vardır — **öğrenci, öğretmen, veli, personel** — ve hepsi tek bir tabloda tip ayırıcı (TPH) ile durur. Ayrı not açılmamasının sebebi bu: profillerin bağımsız bir yaşam döngüsü yoktur, kişiyle doğar kişiyle giderler.

## Yaşam döngüsü

Kendi durum makinesi yoktur. Profil `Person.AttachProfile` ile kişiye bağlanır ve bağlandığı anda sahiplik atanır; tenant alanı insert sırasında interceptor tarafından doldurulur. "Kapanış" tipe göre farklı ifade edilir: öğrenci profilinde `IsActiveStudent`, öğretmen ve personelde işten ayrılış tarihi (`TerminatedAt`).

## Kurallar

- Bir kişide **aynı tipten iki profil olamaz**. Bu kural veritabanı index'iyle değil, aggregate içinde korunur (`USERS_PROFILE_DUPLICATE_TYPE`).
- Bir kişi birden çok tip taşıyabilir — öğretmen + veli en yaygın kombinasyon.
- Öğrenci numarası ve personel numarası okul içinde tekildir; kontrol handler'da veritabanı üzerinden yapılır (`USERS_PROFILE_DUPLICATE_STUDENT_NUMBER` / `..._EMPLOYEE_NUMBER`).
- Ödeme sorumlusu veli profilinde **adres zorunludur** — hem oluştururken hem sonradan sorumluluk verilirken kontrol edilir.
- Öğretmenin yan branşları tekilleştirilir ve ana branşı asla içermez.

## Tipler

**Öğrenci profili** — öğrenci numarası, kayıt tarihi, aktiflik ve o an bulunduğu [[Şube]] bağı. Bu şube alanı **doğruluk kaynağı değil aynadır**: asıl kaynak şube atama defteridir, alan her defter değişiminde aynı transaction içinde bir interceptor tarafından türetilir. Elle yazılmaz, bu yüzden iki-yazım kayması yapısal olarak imkânsızdır.

**Öğretmen profili** — sicil no, işe giriş/ayrılış tarihi, ana [[Branş]] ve yan branşlar. Branş ilişkisi **yalnızca katalog FK'i üzerinden** kurulur; eski serbest metin branş alanları kaldırıldı. Yan branşlar [[Ders Görevlendirmesi]]'ndeki üç değerli uyum kontrolünü besler; branşsız öğretmene görevlendirme yapılamaz.

**Veli profili** — meslek, adres, ödeme sorumluluğu. Velinin hangi öğrenciye bağlı olduğu burada değil, [[Veli-Öğrenci İlişkisi]]'nde durur.

**Personel profili** — birim, ünvan, sicil no, işe giriş/ayrılış.

## İlişkiler

- [[Kişi]] — sahip aggregate; profil tek başına yaşamaz
- [[Şube]] — öğrenci profilinin güncel şube bağı (ID referansı)
- `BranchId` / `SecondaryBranchIds` — branş kataloğuna referans; henüz kavram notu yok

## Geçtiği modüller

- [[Kullanıcılar]] — kavramın sahibi; profil ekleme, güncelleme, toplu içe aktarma
- [[Kimlik Doğrulama]] — giriş sonrası aktif profil seçimi ve profiller arası geçiş
- [[Sınıflar ve Şubeler]] — öğrenci profilinin güncel şube alanını besleyen defterin sahibi
- [[Görevlendirmeler]] — öğretmen profilinin branş bağları uyum hesabının girdisidir
- [[Nöbetler]] — öğretmen profili nöbetçi, yancı, vekil ve muafiyetin öznesidir
- [[Yoklama ve Devamsızlık]] — öğrenci profili yoklamanın, öğretmen profili yoklamayı alanın tarafıdır
- [[Öğrenci Kayıt Yönetimi]] — öğrenci profilini ve [[Öğrenci Numarası]]'nı kayıt akışı üretir

Profil tipine göre dallanan ama henüz notu olmayan modüller: Students, Teachers, Duties, Timetable, Attendance.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Öğretmen profilinde branş katalog FK'i var ama toplu içe aktarma/davet akışında branş **adı** FK'e çözülmüyor (pilotta `null` kabul ediliyor). Bu boşluk hangi akışta kapanacak?
- İşten ayrılmış öğretmen/personel profilinin sezon geçişinde nasıl ele alınacağı profilde değil sezon kopyalama kuralında duruyor; iki yer tek noktada toplanmalı mı?
