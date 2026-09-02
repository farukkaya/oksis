---
aliases: [GradeBook, Ders Defteri, Not Çizelgesi]
tags: [domain/academic]
table: academic.grade_books
status: active
last-synced: 2026-09-03 (b72c819)
---

# Not Defteri

<!-- generated:start -->

## Nedir

Bir öğretmenin bir dönemde bir şubeye okuttuğu bir dersin not çizelgesi — **dönem × şube × ders** koordinatı. MEB dilinde "not defteri" ya da e-Okul'daki "not çizelgesi". Defter **durum taşımaz**: yayın, kilit ve taslak hâli defterin değil, sütunlarının ([[Değerlendirme]]) özelliğidir. Bir defterin "yayınlanmış olması" diye bir şey yoktur; bazı sütunları yayınlanmış, bazıları taslak olabilir.

Ad kuralı: koddaki `Mark` notun kendisi, `Grade` sınıf seviyesidir. Rota `/grades` **modülü** adlandırır, varlığı değil.

## Yaşam döngüsü

Defter **tembel** oluşur: öğretmen ilk notu girene kadar veritabanında satırı yoktur. Buna rağmen defter listesinde görünür ve tıklanabilir, çünkü liste veritabanından değil **ders programından** projeksiyonla üretilir — "bu öğretmen bu dönemde hangi şubede hangi dersi okutuyor" sorusunun her cevabı bir defterdir. Satırı olmayan defter bir hata değil, "henüz not girilmedi" hâlidir.

Defter hiç silinmez; dönem kapanışının etkisi defterin değil sütunlarının kilitlenmesidir.

## Kurallar

- **Tekillik:** okul + dönem + şube + ders. Tembel oluşturma yarışının veritabanı seviyesindeki sigortası tekil indekstir.
- **Tel kimliği koordinattan kurulur** (`dönem.şube.ders`), satırdan değil. Satırı olmayan defter de adreslenebilir ve kimlikten koordinata geri dönülebilir. Deterministik Guid bilinçli olarak elendi — bkz. [[0002-not-defteri-bilesik-tel-kimligi]].
- **Sınav türü başına tek sütun.** Aynı [[Sınav Türü]] ile ikinci sütun açılamaz; ekleme denemesi mevcut sütunu döner.
- **Sütun kataloğu dönemden gelir:** yalnız dönemin sırasına uyan ya da "her iki dönem" işaretli sınav türleri, görüntü sırasıyla. Sınav türü döneme ait değilse yazma denemesi 404'tür.
- **Kapsam ders programından gelir, görevlendirmeden değil.** "Bu deftere kim yazar" sorusunu [[Ders Programı]]'ndaki yerleşim cevaplar; [[Ders Görevlendirmesi]] şube taşımadığı için "9-A'nın matematik öğretmeni" diyemez. Vekâlet ([[Program İstisnası]]) kapsama girmez — not girişi dönem boyu süren bir sorumluluktur.
- **Yazma kapısı yöneticiye açılmaz.** İdare not girmez; adına yayın, geri alma ve kilit gibi işlemleri kendi uçlarından yapar.
- **Öğrenci listesi (roster) [[Öğrenci Kaydı]]'ndan gelir:** aktif ve dondurulmuş kayıtlar yazılabilir. Şubeden ayrılmış öğrenci ancak **notu varsa** listede kalır; notu görünür, kutusu kapalıdır ve sayaçlara girmez. Notu yoksa listede görünmez — geçmiş roster gürültüsü her deftere sızardı.
- **Şube adı, ders adı ve öğrenci sayısı kolon değildir;** okuma anında çözülür. Modüller arası referanslar yalnız kimliktir, navigasyon açılmaz.
- **Ortak çalışan:** aynı şube-ders çiftini okutan başka bir öğretmen varsa adı istemciye bildirilir; istemci çakışma şeridi çizer.
- **Aile yüzündeki ders listesi de defterlerden kurulmaz:** programdan gelen dersler ile defteri olan dersler birleştirilir. Aksi hâlde henüz not girilmemiş ders veli ekranında hiç görünmüyordu ve "bu ders yok" ile "henüz not girilmedi" ayırt edilemiyordu.
- **Dışa aktarım senkron xlsx'tir;** tek defter küçüktür. Gerekçe alanları dosyaya girmez.

## İlişkiler

- [[Dönem]] — defterin zaman kutusu; kapanışı sütunları kilitler
- [[Şube]] / [[Ders]] — koordinatın diğer iki ekseni
- [[Sezon]] — dönem üzerinden; arşiv sezon bağlamında yazma yasaktır
- [[Değerlendirme]] — defterin sütunları; sahiplik, silme kaskadı
- [[Sınav Türü]] — sütun kataloğunun kaynağı; defter içinde tekil
- [[Ders Programı]] — yazma ve okuma kapsamının tek kaynağı
- [[Öğrenci Kaydı]] — roster ve yazılabilirlik
- [[Not Denetim Kaydı]] — denetim izi defter bazında okunur

## Geçtiği modüller

- [[Notlar]] — kavramın sahibi; liste, ızgara, giriş, yayın, dışa aktarım, panolar
- [[Öğrenci Kayıt Yönetimi]] — öğrenci listesindeki genel ortalama sütunu defterlerden hesaplanır (soyutlama üzerinden, tek yön)

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Öğretmenin kendi defter listesi ile idarenin "tüm defterler" görünümü aynı uçtan gelir; ayrım kimlikten türer. Okul geneli listenin yüzlerce şube-ders çiftinde sayfalanmadan dönmesi ölçülmedi.
