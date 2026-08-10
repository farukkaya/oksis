---
aliases: [ConsentRecord, Açık Rıza, KVKK Onayı]
tags: [domain/people]
table: identity.consents
status: active
last-synced: 2026-08-10 (2270867)
---

# Rıza Kaydı

<!-- generated:start -->

## Nedir

Bir [[Kişi]]'nin KVKK aydınlatma metnine verdiği onayın **versiyonlanmış ve kanıtlanabilir** kaydı. Amaç sadece "onayladı mı" sorusunu cevaplamak değil, "hangi metni, ne zaman, hangi cihazdan onayladı" sorusunu da cevaplayabilmektir — denetimde istenecek olan budur.

Dört tip rıza vardır: veri işleme, pazarlama, fotoğraf kullanımı, sağlık verisi. Bunlardan **veri işleme** zorunludur; diğerleri isteğe bağlıdır ve reddi hizmeti engellemez.

## Yaşam döngüsü

`Granted → Revoked`. Geri çekme silme değildir: durum değişir, gerekçe ve zaman damgası hukuki kanıt olarak kalır. Geri çekilmiş bir rıza yeniden verilemez — yeni sürüm için yeni kayıt açılır.

## Kurallar

- Aynı (kişi, rıza tipi, paket sürümü) üçlüsü tekildir; unique index ile korunur (`USERS_CONSENT_DUPLICATE`).
- Onay anındaki metnin hash'i (`EvidenceHash`) kayda yazılır — metin sonradan değişse bile neyin onaylandığı bilinir.
- Yalnız verilmiş bir rıza geri çekilebilir; gerekçe zorunludur.
- IP ve tarayıcı bilgisi opsiyoneldir ama kanıt zincirinin parçasıdır.
- **Veri işleme** rızasının geri çekilmesi ayrı bir sinyal taşır: bu rızanın kaybı aşağı akıştaki erişimin kapatılmasını tetiklemek üzere işaretlenir.
- Davet kabulünde veri işleme rızası olmadan ilerlenemez (`USERS_CONSENT_DATA_PROCESSING_REQUIRED`).

## İlişkiler

- [[Kişi]] — rızanın sahibi
- [[Rıza Paketi]] — onaylanan metnin sürümü ve hash kaynağı
- [[Davet]] — kabul akışında rıza kayıtları üretilir
- [[Hesap]] — giriş sırasında rıza kapısı hesabın rıza sürümüne bakar

## Geçtiği modüller

- [[Kullanıcılar]] — kavramın sahibi; rıza verme, geri çekme, kişinin kendi rızalarını görmesi
- [[Kimlik Doğrulama]] — login sırasında rıza kapısı

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Rıza kapısı (`IConsentGate`) hâlâ "her zaman izin ver" iskeletinde. Veri işleme rızası geri çekilince oturumun gerçekten kapanması bağlanmış mı?
- Reşit olmayan öğrencinin rızasını veli mi verir? Kayıtta veli adına verme (delegasyon) alanı görünmüyor.
- `Account` üzerindeki rıza sürümü sayısal (`int`), `ConsentRecord` üzerindeki sürüm metin (`v2026.05.01` biçimi). İki alan aynı şeyi mi anlatıyor?
