---
aliases: [ConsentBundle, Aydınlatma Metni]
tags: [domain/people]
table: master.consent_bundles
status: active
last-synced: 2026-08-10 (2270867)
---

# Rıza Paketi

<!-- generated:start -->

## Nedir

KVKK aydınlatma metninin versiyonlanmış master kaydı. Tenant'a bağlı değildir — tüm okullar aynı yürürlükteki metni kullanır. Sürüm etiketi (`v2026.05.01` biçimi), başlık, içerik hash'i ve yayın tarihi taşır.

Ayrı bir kavram olmasının sebebi: metin değiştiğinde eski onaylar geçersiz olmaz, eski sürüme bağlı kalır. Sürüm olmadan "kişi neyi onayladı" sorusu cevapsızdır.

## Yaşam döngüsü

Yayınlanır ve bir sürüm "yürürlükteki" (current) olarak işaretlenir. MVP'de tek bir seed'li yürürlükteki sürüm yeterlidir; yönetim ekranından yayın akışı henüz kapsamda değil.

## Kurallar

- İçerik hash'i deterministiktir ve [[Rıza Kaydı]]'nın kanıt hash'ini üretmekte kullanılır.
- [[Davet]] açılırken yürürlükteki sürüm daveti üzerine yazılır; yürürlükte sürüm yoksa kullanıcı oluşturulamaz (`USERS_CONSENT_BUNDLE_NOT_FOUND` / `NoConsentBundle`).

## İlişkiler

- [[Rıza Kaydı]] — her onay bir pakete ve sürümüne bağlıdır
- [[Davet]] — davet açıldığı andaki yürürlükteki sürümü taşır

## Geçtiği modüller

- [[Kullanıcılar]] — yürürlükteki paketi okur, davet ve rıza akışlarında kullanır

## Kapsam dışı

- Yönetici tarafından metin yayınlama/sürüm çıkarma ekranı — MVP'de seed yeterli görüldü.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Yeni sürüm yayınlandığında mevcut kullanıcılardan yeniden onay isteme (re-consent) akışı nasıl olacak? Şu an giriş sırasında sürüm karşılaştırması yapan bir kapı bağlı değil.
