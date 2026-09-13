---
aliases: [ConsentRecord, Açık Rıza, KVKK Onayı]
tags: [domain/people]
table: identity.consents
status: active
last-synced: 2026-09-13 (294ffe6)
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
- **Rıza kapısı** girişte ve jeton yenilemede kişinin en son **veri işleme** rızasına bakar: kayıt yoksa, geri çekilmişse ya da onaylanan paket sürümü yürürlükteki sürümden farklıysa reddeder. Yürürlükte paket yoksa kapı devre dışıdır. Diğer rıza tipleri girişi etkilemez.
- Parolası doğrulanmış kullanıcı aynı giriş isteğinde yürürlükteki paketi kabul ederse rıza orada kaydedilir ve giriş sürer. Gerekçe: rızası düşen kullanıcı oturum açamadığı için "giriş sonrası rıza ekranı" mümkün değil; ayrı bir anonim rıza ucu ise ikinci bir kimlik doğrulama yolu açardı.
- **Veri işleme** rızasının geri çekilmesi açık oturumu sonlandırır: kişinin refresh jeton zinciri geri çekilir, yenileme de rıza kapısından geçtiği için oturum uzatılamaz. Elde kalan access token ömrü dolana kadar (≤ 15 dakika) geçerlidir. Rızayı yönetici de kişinin kendisi de geri çekebilir; iki yol aynı noktadan geçer. Pazarlama, fotoğraf ve sağlık rızasının geri çekilmesi oturuma dokunmaz (TB-10).
- Davet kabulünde veri işleme rızası olmadan ilerlenemez (`USERS_CONSENT_DATA_PROCESSING_REQUIRED`).

## İlişkiler

- [[Kişi]] — rızanın sahibi
- [[Rıza Paketi]] — onaylanan metnin sürümü ve hash kaynağı
- [[Davet]] — kabul akışında rıza kayıtları üretilir
- [[Hesap]] — rıza kapısı hesabın giriş ve jeton yenileme akışında uygulanır; karar hesaptaki bir alana değil kişinin rıza kaydına bakar

## Geçtiği modüller

- [[Kullanıcılar]] — kavramın sahibi; rıza verme, geri çekme, kişinin kendi rızalarını görmesi
- [[Kimlik Doğrulama]] — login sırasında rıza kapısı

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Reşit olmayan öğrencinin rızasını veli mi verir? Kayıtta veli adına verme (delegasyon) alanı görünmüyor.
- `Account` üzerindeki rıza sürümü sayısal (`int`), `ConsentRecord` üzerindeki sürüm metin (`v2026.05.01` biçimi). İki alan aynı şeyi mi anlatıyor?
