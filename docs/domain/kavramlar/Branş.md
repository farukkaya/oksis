---
aliases: [Branch, MasterBranch, Alan]
tags: [domain/academic]
table: school.branches
status: active
last-synced: 2026-08-10 (2270867)
---

# Branş

<!-- generated:start -->

## Nedir

Öğretmenin alanı — Matematik, Türkçe, Rehberlik. MEB terminolojisinde "branş" veya "alan" denir ve öğretmenin hangi dersleri vermeye yetkili sayıldığını belirler.

Katalog **okula özeldir**: her okul kendi branş listesini tutar. Ancak kayıtların bir kısmı MEB kaynaklıdır ve okul bunları düzenleyemez; okul yalnız kendi eklediği branşlar üzerinde serbesttir.

⚠️ **Adlandırma tuzağı — bu notu `Branch` diye arayıp bulduysan dikkat:** Ders programı modülünde `Branch` **branş değil [[Şube]] demektir** (`ScheduleProgram.BranchId` → `class_rooms`). Aynı identifier iki ayrı kavramı, iki ayrı tabloyu gösteriyor. Bu notun konusu olan branş `school.branches` tablosudur ve öğretmen profilinden `BranchId` ile bağlanır.

## Yaşam döngüsü

Açılır, sıralanır, pasifleştirilir. MEB kaynaklı kayıtlar düzenlemeye kapalıdır — kaynak bağı (`MebBranchId`) doluysa kayıt korumalıdır.

## MEB kataloğundan içe aktarma

Platform genelinde ayrı bir **MEB branş referans kataloğu** durur (okuldan bağımsız, sabit lookup). Okul buradan **toplu içe aktarma** yapar; aktarılan kayıtlar kaynak bağıyla işaretlenir ve o günden sonra düzenlenemez.

Yani okul kataloğu iki tür kayıt taşır: MEB'den kopyalanmış korumalı olanlar ve okulun kendi eklediği serbest olanlar. Bu ayrım [[Müfredat]] modülünde yönetilir.

## Kurallar

- Branş adı zorunludur.
- MEB kaynaklı branş düzenlenemez; okulun kendi eklediği branş serbesttir.
- Bir öğretmenin **bir ana branşı** ve istediği kadar **yan branşı** olabilir. Yan branşlar tekilleştirilir ve ana branşı asla içermez.
- Öğretmen [[Profil]]'i branşa yalnız katalog kimliğiyle bağlanır; serbest metin branş alanları kaldırılmıştır.
- **Branşsız öğretmene ders görevlendirmesi yapılamaz** — bu sert engeldir.
- [[Ders Görevlendirmesi]]'ndeki uyum, branşın **adı** ile dersin **adı** karşılaştırılarak hesaplanır (tr-TR normalize, boşluklar atılır). Karşılaştırma katalog kimliği üzerinden değildir.

## İlişkiler

- [[Profil]] — öğretmen profilinin ana ve yan branş bağları
- [[Ders]] — uyum karşılaştırmasının diğer tarafı
- [[Ders Görevlendirmesi]] — üç değerli uyum sinyalinin kaynağı
- [[Şube]] — **kavramsal bağ değil, isim çakışması**; ders programı modülünde `Branch` şubeyi işaret eder

## Geçtiği modüller

- [[Görevlendirmeler]] — branş uyumu ve aday sıralaması
- [[Nöbetler]] — vekil adayının uyum kovası (aynı / yakın / farklı) aynı ad karşılaştırmasını kullanır
- [[Kullanıcılar]] — öğretmen profilinde branş atanması

Branşı kullanan ama henüz notu olmayan modüller: Academics (katalog yönetimi), Timetable, Duties.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Uyum ad karşılaştırmasıyla yapıldığı için branş adı ile ders adı birebir tutmak zorunda. "Matematik" branşı "İleri Matematik" dersine alan-dışı düşüyor. Katalog kimlikleri arasında bir eşleme tablosu düşünülmüş müydü?
- Öğretmen profilindeki branş kimliği davet ve toplu içe aktarma akışında çözülmüyor (pilotta boş bırakılıyor). Branşsız öğretmene atama sert engel olduğuna göre, bu boşluk o öğretmenleri fiilen görevlendirilemez mi bırakıyor?
- ~~MEB branş listesinin okul kataloğuna nasıl aktığı izlenemedi.~~ → **Cevaplandı:** ayrı bir MEB referans kataloğu var ve okul oradan toplu içe aktarma yapıyor; aktarılanlar korumalı işaretleniyor. Kalan soru: MEB listesi güncellenirse okul kataloğu **yeniden senkronlanıyor mu**, yoksa aktarım tek seferlik mi?
