---
aliases: [Assessment, Sütun, Değerlendirme Sütunu, Sınav Sütunu]
tags: [domain/academic]
table: academic.assessments
status: active
last-synced: 2026-09-03 (b72c819)
---

# Değerlendirme

<!-- generated:start -->

## Nedir

[[Not Defteri]]'nin bir sütunu — "1. Sınav", "Sözlü", "Performans". Adı ve kimliği [[Sınav Türü]]'nden gelir, kolona kopyalanmaz. **Yayın birimi budur:** bir hücrenin ([[Not]]) aileye görünüp görünmediği hücrenin kendi alanı değil, bağlı olduğu sütunun durumudur. Öğretmen notları tek tek değil, sütun sütun yayınlar.

## Yaşam döngüsü

```
        ilk hücre           yayın / adına yayın        kilit / dönem kapanışı
Empty ───────────▶ Draft ───────────────────▶ Published ─────────────────▶ Locked
  ▲                  │ ▲                          │                            │
  └── temizleme ─────┘ └── geri alma (gerekçe) ───┘ ◀──── kilit açma (gerekçe) ─┘
```

- **Empty** — sütun açık, hiç not yok. Satırı henüz olmayan sütun da bu hâldedir; panoda "henüz açılmamış" ile "açılmış ama boş" aynı şeydir.
- **Draft** — notlar giriliyor; **aile görmez.** Aile listesinde sütun görünür ama değeri boş, "bekliyor" etiketiyle gelir. Hücre yazımı serbesttir ve denetim izi bırakmaz.
- **Published** — aile görür. Doğrudan yazma yasaktır; değişiklik yalnız gerekçeli **düzeltme** yoluyla yapılır ve denetim kaydı üretir. Yayından itibaren okulun düzeltme penceresi (varsayılan 48 saat, [[Okul Ayarları]]) içinde öğretmen düzeltebilir; pencere kapandıktan sonra yalnız yönetici.
- **Locked** — her yazma yasak. Yönetici kilidi gerekçelidir; dönem kapanışındaki **sistem kilidi** aktörsüz ve gerekçesizdir, yeniden koşan iş için idempotenttir. Kilit açma gerekçelidir ve sütunu Published'a döndürür.

Durum geçişleri varlık metotlarıdır; handler'da durum zinciri yazılmaz. Geçersiz geçiş 409'dur.

## Kurallar

- **Tekillik:** defter + sınav türü.
- **Yönetici işlemlerinde gerekçe en az 15 karakter:** adına yayın, geri alma, kilit, kilit açma. Düzeltme gerekçesinde yalnız "boş değil" aranır.
- **Yayın yalnız taslaktan.** Öğretmen **kendi** sütununu yayınlar (yayın izni + yazma kapsamı). Yönetici sorumlu öğretmen **adına** yayınlar: ayrı uç, ayrı izin, gerekçeli ve kayıtta "adına yayınlandı" işareti taşır.
- **Sessiz yayın:** notlar hemen görünür ama bildirim gitmez. Görünürlük ile bildirim ayrı kararlardır; sessizlik yalnız ikincisini kapatır.
- **Temizleme yalnız taslakta:** tüm hücreler yumuşak silinir, sütun Empty'e döner. Denetim izi ayrıca kalır.
- **Sınav tarihi** kilitli değilken yazılır ve gecikme hesabının girdisidir: tarih üzerinden 3 günden fazla geçmiş **ve** sütun hâlâ yayınlanmamışsa sütun "gecikmiş"tir. Eşik koddaki sabittir, okul ayarı değil.
- **Girilen sayısı ve öğrenci sayısı kolon değildir;** okuma anında hesaplanır ve şubeden ayrılan öğrenciler hariç tutulur — "24/30 girildi" derken artık okulda olmayanı beklemek anlamsızdır.
- **Yayın ve kilit yarışı** satır sürümüyle çözülür; çakışma 409.
- **Dönem kapanışında yalnız yayınlanmış sütunlar kilitlenir.** Taslaklara dokunulmaz: kilitlemek onları değişmez yapardı ama içleri boş; taslak kalması "hiç yayınlanmadı" bilgisini korur. Defter başına tek, planlı sistem denetim kaydı yazılır.
- **Bildirim:** yayın velilere her hâlde gider; öğrencilere yalnız kademe görünürlüğü açıksa. Gövdede not değeri geçmez — bildirim bir haberdir, kanal değil. Düzeltme ve geri alma bildirim üretmez; aile yüzündeki "güncellendi" rozeti yeter.
- Yayın anında iki denetim kaydı yazılır: "n not girdi" toplu özeti ve yayın olayı. Hücre başına kayıt tutulmaz.

## İlişkiler

- [[Not Defteri]] — sahip; sütun defter dışında var olamaz
- [[Sınav Türü]] — sütunun adı ve kimliği; dönem süzgeci buradan
- [[Not]] — sütunun hücreleri; görünürlükleri bu sütunun durumundan türer
- [[Not Denetim Kaydı]] — her durum geçişi bir kayıt üretir
- [[Okul Ayarları]] — düzeltme penceresi ve kademe bazlı öğrenci görünürlüğü
- [[Dönem]] — kapanış olayı sistem kilidini tetikler
- [[Bildirim]] / [[Bildirim Türü]] — "not yayınlandı" olayı
- [[Kişi]] — yayınlayan, geri alan, kilitleyen; yalnız kimlik

## Geçtiği modüller

- [[Notlar]] — kavramın sahibi; tüm durum geçişleri, gecikme rozeti, panolardaki sütun sayımları

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- Bildirimdeki kademe kapısı şubenin **ilk öğrencisinin** sınıf seviyesine bakıyor; karma kademeli şube varsayılmıyor. Bilinçli bir sadeleştirme mi?
- Sınav tarihinin kendisi bir bildirim ya da hatırlatma üretmiyor; gecikme yalnız panoda rozettir. Öğretmene hatırlatma istenecek mi?
