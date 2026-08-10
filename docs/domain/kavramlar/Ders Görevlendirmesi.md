---
aliases: [SubjectTeacherAssignment, Görevlendirme v2, Yetkinlik Ataması]
tags: [domain/academic]
table: academic.subject_teacher_assignments
status: active
last-synced: 2026-08-10 (2270867)
---

# Ders Görevlendirmesi

<!-- generated:start -->

## Nedir

"Bu öğretmen bu dersi vermeye yetkilidir" cümlesinin kaydı. Öğretmen ile [[Ders]] arasında, bir [[Sezon]]'a bağlı olarak kurulur.

Kavramın belirleyici kararı, **ne taşımadığıdır**: haftalık saat yoktur, şube yoktur. Bu bilinçlidir — burada yalnız yetkinlik durur, saatin ve şubenin dağıtımı aşağı akıştaki katmanın işidir. Sınıf seviyesi de saklanmaz; dersin kademe bağlarından türetilir.

Kodda "Görevlendirme v2" diye anılır. Aynı işi farklı modelleyen daha eski bir kardeşi vardır: [[Şube Ders Görevlendirmesi]]. İkisi şu an yan yana yaşıyor — hangisinin kanonik olduğu koddan çıkmıyor, aşağıdaki açık soruya bak.

## Yaşam döngüsü

`Active → Closed`. Kapatma yıl-içi devir içindir ve **silme değildir**: kayıt tarihlenir, kapatan kişi, tarih ve gerekçe yazılır, iz kalıcı olarak görünür kalır. Aynı kaydı ikinci kez kapatmak işlem üretmez.

Sezon sert sınırdır: yeni sezonda yeni kayıt açılır, eskisi geçmişte kalır.

## Kurallar

- Aynı (öğretmen, ders, sezon) üçlüsü için yalnız bir **aktif** kayıt olabilir; filtreli unique index ile korunur.
- **Branşsız öğretmene atama yapılamaz** — bu sert engeldir, gerekçeyle aşılamaz.
- **Alan-dışı atama engellenmez.** Öğretmenin branşı derse uymuyorsa işlem yumuşak uyarı verir ve serbest metin gerekçe taşınır. Karar okulundur, sistem yalnız iz bırakır.
- Uyum üç değerlidir: branş-içi, yan branş, alan-dışı. Gerekçe yalnız alan-dışında anlamlıdır ve arayüzde yalnız orada gösterilir.
- Uyum **hesaplanır, saklanmaz** — her okuma anında yeniden türetilir, bu yüzden branş veya ders adı değişince kendiliğinden güncellenir.
- Kapatılmış kaydın gerekçesi değiştirilemez; iz dokunulmazdır.
- Onay iş akışı yoktur. Yerine öz-denetim ve denetim izi vardır: atayan kişi ve tarih otomatik damgalanır. Yazma yetkisi tek roldedir (okul yöneticisi).
- Diğer aggregate'lere yalnız ID ile bağlanır.

## Branş uyumu nasıl hesaplanıyor

Öğretmenin ana branşının **adı** dersin **adına** eşitse branş-içi, yan branşlarından birine eşitse yan branş, hiçbirine uymuyorsa alan-dışı sayılır. Karşılaştırma tr-TR kültürüyle normalize edilir (İ/ı doğruluğu için) ve boşluklar atılır. Branş boşsa alan-dışı kabul edilir.

Dikkat: eşleştirme katalog kimliği üzerinden değil, **ad karşılaştırmasıyla** yapılır. SQL'e çevrilemediği için ham alanlar çekilip bellekte hesaplanır.

## İlişkiler

- [[Ders]] — görevlendirmenin bir ucu
- [[Branş]] — uyumun hesaplandığı taraf; öğretmenin ana ve yan branşları
- [[Profil]] — diğer uç; öğretmen profili ve branş bağları
- [[Sezon]] — sert sınır; her görevlendirme bir sezona aittir
- [[Şube Ders Görevlendirmesi]] — aynı işi şube ve saat ekseninde modelleyen eski nesil

## Geçtiği modüller

- [[Görevlendirmeler]] — kavramın sahibi; atama, kapatma, kapsama, sezon kopyalama
- [[Müfredat]] — kayıt kod tarafında bu modülde yaşar; ders ve branş katalogları oradan gelir

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Bu kavram ile [[Şube Ders Görevlendirmesi]] ayrı tablolar, ayrı izin aileleri, ayrı sezon kopyalama komutları ve ayrı olaylarla yan yana duruyor. Hangisi kanonik? Eski nesil emekliye mi ayrılıyor, yoksa bu katman onun üstüne mi biniyor?
- Saat ve şube dağıtımı "Şube Dağıtımı / Ders Programı katmanının işi" deniyor. O katman kodda var mı, yoksa rolü hâlâ eski nesil mi üstleniyor?
- Uyum ad karşılaştırmasıyla hesaplanırken öğretmen profilinde branş katalog kimliği de duruyor. Katalog varken neden ad? "Matematik" branşı "Matematik" dersine uyuyor ama "İleri Matematik" dersine uymuyor — bu kabul edilmiş bir sınır mı?
