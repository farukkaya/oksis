---
aliases: [NotificationConfig, NotificationRuleConfig, Bildirim Ayarları]
tags: [domain/platform]
table: school.notification_rule_configs
status: active
last-synced: 2026-08-10 (2270867)
---

# Bildirim Yapılandırması

<!-- generated:start -->

## Nedir

Okulun bildirim tercihlerini tutan ayar: hangi kanallar açık (push, e-posta, SMS) ve hangi olay hangi kanaldan gidiyor.

İki katman vardır. **Kanal anahtarları** okul genelinde kabaca açar/kapatır; ana kapama anahtarı "en az bir kanal açık mı" sorusundan türetilir, kullanıcı doğrudan onu yönetmez. **Kural matrisi** ise olay bazında incelik sağlar ve [[Bildirim Türü]]'nün ayarlar kataloğundan beslenir.

⚠️ **Bu ayarların bugün teslimata hiçbir etkisi yoktur.** [[Bildirimler]] dağıtım motoru ne kural matrisini, ne kanal anahtarlarını, ne de ana kapama anahtarını okuyor. Üstelik kayıtlı tek kanal uygulama içi bildirimdir — e-posta, SMS ve push kanallarının uygulaması yok. Yani ekran üç kanallı bir matris sunuyor ama tercih ne olursa olsun bildirim aynı şekilde gidiyor.

## Kurallar

*(Aşağıdakiler kaydın kendi kuralları; teslimata yansımıyorlar.)*

- Ana anahtar elle yönetilmez; kanal tercihlerinden türetilir.
- SMS'in uygulanamadığı bir olayda SMS varsayılanı açık bırakılamaz.
- SMS kanalı ayrıca bir kota ile sınırlıdır ve kota ayrı sorgulanır.

## İlişkiler

- [[Okul Ayarları]] — aynı ayar yüzeyinde yönetilir, ayrı kayıttır
- [[Bildirim Türü]] — kural matrisi ayarlar kataloğundan beslenir
- [[Devamsızlık Özeti]] — devamsızlık eşik uyarısının gerçek eşikleri **burada değil** okul ayarlarındadır

## Geçtiği modüller

- [[Okul Yönetimi]] — kavramın sahibi; kanal ve kural yönetimi
- [[Bildirimler]] — ayarların tüketicisi **olması beklenen** modül; bugün okumuyor

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Buradaki devamsızlık uyarı/kritik eşiği alanlarının tüketicisi yok.** Yazılıyor, doğrulanıyor, ekranda gösteriliyor; ama devamsızlık motoru [[Okul Ayarları]]'ndaki ayrı alanları okuyor. Yönetici iki ekranda eşik giriyor — hangisi kalmalı?
- ~~Kural matrisinin gönderim anında kanal seçimini etkilediği izlenemedi.~~ → **Cevaplandı: etkilemiyor.** Matris yalnız kendi ayar ekranında okunup yazılıyor; dağıtım motoru ona hiç bakmıyor. Aynısı kanal anahtarları ve ana kapama anahtarı için de geçerli.
- ~~Kanallar kapalıyken kritik bildirimlerin yine de gidip gitmediği belirsiz.~~ → **Hepsi gidiyor**, çünkü hiçbir kapı okunmuyor. Ayrıca öncelik kavramı ve sessiz saat kontrolü de yok.
- Geriye tek soru kalıyor: ayarlar mı teslimata bağlanacak, yoksa ekran mı sadeleşecek?
