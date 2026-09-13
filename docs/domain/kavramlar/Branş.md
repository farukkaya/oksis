---
aliases: [Branch, MasterBranch, Alan]
tags: [domain/academic]
table: school.branches
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Branş

<!-- generated:start -->

## Nedir

Öğretmenin alanı — Matematik, Türkçe, Rehberlik. MEB terminolojisinde "branş" veya "alan" denir ve öğretmenin hangi dersleri vermeye yetkili sayıldığını belirler.

Katalog **okula özeldir**: her okul kendi branş listesini tutar. Ancak kayıtların bir kısmı MEB kaynaklıdır ve okul bunları düzenleyemez; okul yalnız kendi eklediği branşlar üzerinde serbesttir.

⚠️ **Adlandırma tuzağı — bu notu `Branch` diye arayıp bulduysan dikkat:** Ders programı modülünde `Branch` **branş değil [[Şube]] demektir** (`ScheduleProgram.BranchId` → `class_rooms`). Aynı identifier iki ayrı kavramı, iki ayrı tabloyu gösteriyor. Bu notun konusu olan branş `school.branches` tablosudur ve öğretmen profilinden `BranchId` ile bağlanır.

## Yaşam döngüsü

Açılır, sıralanır, pasifleştirilir. MEB kaynaklı kayıtlar düzenlemeye kapalıdır — kaynak bağı (`MebBranchId`) doluysa kayıt korumalıdır. Kullanımdaki branş silinemez; yol pasife almaktır.

## MEB kataloğundan içe aktarma

Platform genelinde ayrı bir **MEB branş referans kataloğu** durur (okuldan bağımsız, sabit lookup). Okul buradan **toplu içe aktarma** yapar; aktarılan kayıtlar kaynak bağıyla işaretlenir ve o günden sonra düzenlenemez.

Aktarım **idempotenttir**: zaten aktarılmış katalog kaydı atlanır, yalnız eksikler eklenir. **Yeniden senkron yoktur** — MEB listesi değişirse okul kataloğu kendiliğinden güncellenmez (bilinçli kapsam dışı).

Yani okul kataloğu iki tür kayıt taşır: MEB'den kopyalanmış korumalı olanlar ve okulun kendi eklediği serbest olanlar. Bu ayrım [[Müfredat]] modülünde yönetilir.

## Kurallar

- Branş adı zorunludur ve **okul içinde tekildir**.
- MEB kaynaklı branş düzenlenemez; okulun kendi eklediği branş serbesttir.
- Bir öğretmende **ana ya da yan branş** olarak kullanılan branş silinemez (409); pasife alınabilir.
- Bir öğretmenin **bir ana branşı** ve istediği kadar **yan branşı** olabilir. Yan branşlar tekilleştirilir ve ana branşı asla içermez.
- Öğretmen [[Profil]]'i branşa yalnız katalog kimliğiyle bağlanır; serbest metin branş alanları kaldırılmıştır.
- **Branşsız öğretmene ders görevlendirmesi yapılamaz** — bu sert engeldir.
- **Branş uyumu kimlik üzerinden hesaplanır** (X-04, 2026-08-12). Platform kataloğunda her [[Ders]]'in hangi branşlarca okutulabileceği çoka-çok bir eşlemede tutulur ("Fen Bilimleri"ni Fizik, Kimya ve Biyoloji okutabilir); öğretmenin okul branşı MEB kaynak bağıyla katalog kaydına çevrilip bu eşlemeyle karşılaştırılır. Eskiden branş adı ile ders adı karşılaştırılıyordu ve adı birebir tutmayan dersler kalıcı olarak alan-dışı düşüyordu; ad değiştirmek de uyumu sessizce bozuyordu.
- Eşlemesi olmayan ders **bilinçli olarak alan-dışı** sayılır: uydurma bir eşleme yanlış öğretmeni "uyumlu" gösterirdi.

## İlişkiler

- [[Profil]] — öğretmen profilinin ana ve yan branş bağları
- [[Ders]] — katalog eşlemesi: ders hangi branşlarca okutulabilir; uyumun kaynağı
- [[Ders Görevlendirmesi]] — üç değerli uyum sinyalinin kaynağı
- [[Şube]] — **kavramsal bağ değil, isim çakışması**; ders programı modülünde `Branch` şubeyi işaret eder

## Geçtiği modüller

- [[Görevlendirmeler]] — branş uyumu ve aday sıralaması
- [[Nöbetler]] — vekil adayının uyum kovası: **aynı** (o dersi zaten veriyor ya da ana/yan branşı eşlemede), **yakın** (verdiği derslerden biri kayıp dersle aynı kategoride), **farklı**; aynı eşleştiriciyi kullanır
- [[Kullanıcılar]] — öğretmen profilinde branş atanması

Branşı kullanan ama henüz notu olmayan modüller: Academics (katalog yönetimi), Timetable, Duties.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Öğretmen profilindeki branş kimliği davet ve toplu içe aktarma akışında çözülmüyor (pilotta boş bırakılıyor). Branşsız öğretmene atama sert engel olduğuna göre, bu boşluk o öğretmenleri fiilen görevlendirilemez mi bırakıyor?
