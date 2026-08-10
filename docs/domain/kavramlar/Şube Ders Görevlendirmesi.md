---
aliases: [TeachingAssignment, Öğretmen Görevlendirmesi, Görevlendirme v1]
tags: [domain/academic]
table: academic.teaching_assignments
status: active
last-synced: 2026-08-10 (2270867)
---

# Şube Ders Görevlendirmesi

<!-- generated:start -->

## Nedir

"Bu öğretmen bu şubede bu dersi haftada şu kadar saat verir" cümlesinin kaydı. Öğretmen × [[Şube]] × [[Ders]] üçlüsü üzerinden kurulur ve **haftalık saat** taşır. Bir öğretmenin toplam yükü, aktif görevlendirmelerinin saatleri toplamıdır.

Taşıdığı sınır nettir: *kim hangi dersi verecek* sorusunu çözer, *hangi gün hangi saatte* sorusunu değil — o [[Ders Programı]]'nın işidir. Değişim olduğunda olay yayınlar ve program senkron kalır.

Kodda ayrıca "Görevlendirme v2" diye anılan daha yeni bir kardeş vardır: [[Ders Görevlendirmesi]]. O, saati ve şubeyi bilinçle dışarıda bırakır ve yalnız yetkinliği taşır. İkisi şu an yan yana yaşıyor.

## Yaşam döngüsü

Açılır ve kaldırılır. Kaldırma **silme değil arşivdir**: kayıt işaretlenir, görev geçmişi korunur. Zaten kaldırılmış bir görevlendirmeyi tekrar kaldırmak işlem üretmez.

Sezon değişince yeni görevlendirme açılır; kişi ve istihdam kalıcıdır, görevlendirme sezona bağlıdır. Bu ayrım modelin kurucu fikridir: **"öğretmen ≠ görevlendirme"**.

## Kurallar

- Aynı (öğretmen, şube, ders, sezon) dörtlüsü için yalnız bir **aktif** kayıt olabilir.
- Haftalık saat 1-40 aralığında olmalıdır.
- Öğretmen, şube, ders ve sezon kimlikleri zorunludur.
- Kaldırma geri alınamaz; yeniden görevlendirme yeni kayıt demektir.
- Diğer aggregate'lere yalnız ID ile bağlanır.
- Öğretmen yükü özeti sık sorulduğu için sezon bazında önbelleklenir; atama veya kaldırma bu önbelleği geçersiz kılar.

## Sezon kopyalama

Yeni sezona kopyalama, [[Şube]]'lerin köken bağını izler: hedef sezondaki şubeler hangi kaynak şubeden üretildiyse, o şubenin görevlendirmeleri hedefe taşınır. Dört sebeple satır atlanır — öğretmen işten ayrılmış, eşleşen hedef şube yok, hedef şube arşivlenmiş, hedefte aynı (şube, ders) zaten aktif. Son madde işlemi tekrar çalıştırmayı güvenli kılar.

## İlişkiler

- [[Şube]] — görevlendirmenin şube ekseni
- [[Ders]] — verilen ders
- [[Profil]] — öğretmen profili
- [[Sezon]] — görevlendirme sezona bağlıdır
- [[Ders Görevlendirmesi]] — aynı alanı yetkinlik ekseninde modelleyen yeni nesil

## Geçtiği modüller

- [[Görevlendirmeler]] — kavramın sahibi; atama, kaldırma, görev geçmişi, yük, sezon kopyalama
- [[Sezon Yönetimi]] — sezon aktivasyonunda görevlendirmelerin kopyalanması
- [[Ders Programı Yönetimi]] — yerleştirilecek ders-öğretmen taleplerinin ve haftalık saatin kaynağı

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- [[Ders Görevlendirmesi]] ile ikili yaşam: hangisi kanonik? Bu nesil emekliye mi ayrılıyor?
- İki neslin ayrı sezon kopyalama komutu var ve farklı eksenler üzerinden çalışıyor (biri şube eşlemesi, diğeri ders+öğretmen). Yıl geçişinde ikisi birden mi çalıştırılıyor?
