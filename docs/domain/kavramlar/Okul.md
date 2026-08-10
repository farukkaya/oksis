---
aliases: [School, Tenant, Kurum]
tags: [domain/platform]
table: school.schools
status: active
last-synced: 2026-08-10 (2270867)
---

# Okul

<!-- generated:start -->

## Nedir

Sistemdeki en dış çerçeve: **her okul bir tenant'tır**. Diğer bütün kayıtların taşıdığı okul kimliği bu kaydın kimliğidir; veri izolasyonunun tamamı buradan başlar.

Bu yüzden okul, diğer varlıkların aksine "bir okula ait" değildir — okulun kendisidir. Kayıt yalnız kimlik ve abonelik düzeyindeki bilgiyi taşır: ad, kod, tür, durum, plan, zaman dilimi. Kurumsal bilgi (resmî ad, MEB kodu, adres, tema, akademik politika) ayrı bir kayıtta — [[Okul Ayarları]] — yaşar.

## Yaşam döngüsü

`Kurulum → Aktif ↔ Askıda → Arşiv`

- **Kurulum** — yeni okul buradan başlar; kurulum sihirbazı tamamlanana kadar yalnız kurulum uçları açıktır.
- **Aktif** — normal işleyiş; modüller plan kısıtlarına göre kullanılır.
- **Askıda** — lisans veya ödeme sorunu; salt-okunur mod. Askıya alma **gerekçe ister**.
- **Arşiv** — terminal. Arşivlenmiş okul yeniden aktifleştirilemez, planı değiştirilemez.

## Kurulum sihirbazı

Okul oluşturulduğunda altı adımlık bir kurulum durumu otomatik açılır: okul bilgisi, kademe kurulumu, öğretmen aktarımı, öğrenci aktarımı, program kurulumu, yayına alma. Her adım `Bekliyor → Devam ediyor → Tamamlandı` akışını izler, atlanabilir de. Tamamlanmış bir adım yeniden başlatılamaz. Yönetici yarıda bıraktığı kurulumu bu kayıttan devam ettirir. Ayrı kavram notu yoktur.

## Kurallar

- **Okul kodu platform genelinde tekildir** ve büyük harfe normalize edilir; 3-50 karakter, yalnız harf/rakam/tire, tireyle başlayıp bitemez. Alt alan adı veya arama anahtarı olarak kullanılabilir.
- Okul **adı** tekil değildir.
- Kod bir kez verilir, değiştirilemez; ad değiştirilebilir.
- Zaman dilimi IANA biçimindedir (`Europe/Istanbul`) ve sistemde tanımlı olduğu doğrulanır. Tenant'ın bütün zaman hesaplarının — sessiz saatler, zamanlanmış işler, raporlar — kaynağıdır.
- Okul oluşturulduğunda varsayılan [[Okul Ayarları]] kaydı, kurulum adımları ve **kendi depolama alanı** olay üzerinden otomatik üretilir (bkz. [[Dosya Yönetimi]]).
- Askıya alma gerekçesizse reddedilir.

## Abonelik planı

Üç düzey vardır: ücretsiz, standart, premium. Plan hangi modüllerin açılabileceğini belirler — bkz. [[Modül Yapılandırması]]. Plan değişikliği olay yayınlar; arşivlenmiş okulda yapılamaz. Yenileme tarihi bugün elle girilir; abonelik sağlayıcısı entegrasyonu henüz yok.

## İlişkiler

- [[Okul Ayarları]] — bire bir; kurumsal bilgi ve politikalar orada
- [[Modül Yapılandırması]] — hangi modüller açık, plan neyi kilitliyor
- [[Sezon]] — okulun eğitim-öğretim yılları
- [[Kişi]] — okuldaki insanlar; hepsi bu tenant'a bağlıdır
- [[Saklı Dosya]] — okulun dosyaları kendi depolama alanında yaşar; kota okul başınadır

## Geçtiği modüller

- [[Okul Yönetimi]] — kavramın sahibi

Okul kimliğini taşımayan tek bir kayıt yoktur; bu yüzden "geçtiği modüller" listesi pratikte tüm modüllerdir.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **İki ayrı zaman dilimi alanı var:** okulda IANA biçimi, [[Okul Ayarları]]'nda Windows biçimi (`Turkey Standard Time`). Hangisi yetkili? Zamanlanmış işler ve sessiz saatler hangisini okuyor?
- Arşiv sonrası "veri 6 ay tutulur, sonra kalıcı silinir" deniyor ama bu süreyi uygulayan bir iş bu taramada bulunamadı.
- Okul oluşturma/askıya alma uçları bu taramada görünmedi; süper admin tarafı ayrı bir yüzeyde mi?
