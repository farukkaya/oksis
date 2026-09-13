---
aliases: [Account, Kullanıcı Hesabı]
tags: [domain/people]
table: identity.accounts
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Hesap

<!-- generated:start -->

## Nedir

Bir [[Kişi]]'nin giriş yapabilmesini sağlayan kimlik doğrulama ve oturum kaydı. Kişi "kim"i, hesap "nasıl giriyor"u tutar: parola hash'i, oturum jetonları, kilitlenme sayacı, son aktif bağlam.

Ayrımın sebebi, kişi kaydının hesap olmadan da var olabilmesidir — okul öğrenciyi sisteme girer, öğrenci hiç giriş yapmasa bile kaydı yaşar. Hesap iki yoldan doğar: [[Davet]] kabulünde kişinin kendi belirlediği parolayla, ya da öğrenci kaydında geçici parolayla ([[Öğrenci Kayıt Yönetimi]]). Hesabın eski tek satırlık kullanıcı kaydının "giriş kimliği" rolünü nasıl devraldığı: [[0009-tek-kimlik-modeli]].

Modüller arası yabancı anahtar kurulmaz; bağ `PersonId` köprüsüyle yürür.

## Yaşam döngüsü

Baştan aktif doğar. Davet kabulünde parolayı kişi kendisi belirlediği için ilk girişte parola değişimi **istenmez**; öğrenci kaydında doğan hesap geçici parola taşıdığı için ilk girişte parola değişimi **zorunludur**. Askıya alma ve yeniden aktive etme bayrak üzerinden yapılır — hesap silinmez.

**Kilitlenme:** yalnız hatalı parola sayacı artırır; eşiğe ulaşınca (varsayılan 5 deneme) hesap belirli süre kilitlenir (varsayılan 15 dakika). Yönetici elle açabilir; açan kişi kayda yazılır.

Bunun yanında ikinci, bağımsız bir kilit kaynağı daha vardır: giriş koruyucusu kademeli eşiklerle (5 / 10 / 20 hata → 5 dakika / 30 dakika / 2 saat) kilitler ve ayrıca IP bazlı sayaç tutar. İki kaynağın ilişkisi açık sorudur.

## Aktif bağlam

Hesap üç bağlam bilgisini hatırlar: son aktif **profil tipi**, veli ise son bakılan **çocuk**, ve son aktif **sezon**. Bunlar giriş sonrası kullanıcıyı bıraktığı yere döndürmek içindir; her değişim ayrı bir olay yayınlar.

Birden fazla [[Profil]] taşıyan kişide aktif profil şu öncelikle belirlenir: istemcinin girişte ilettiği profil ipucu → hesabın son aktif profili (hâlâ geçerliyse) → seçim ekranı. İpucu geçersizse ya da kişinin elinde değilse sessizce başka profile düşülmez, seçim istenir. Seçim gerektiğinde oturum açılmaz ve jeton dönmez; bu yüzden ayrı bir "seçim jetonu" kurulmadı, istemci seçilen profil ipucuyla girişi tekrarlar.

Veli profilinde tek çocuk otomatik seçilir; birden çok çocukta son bakılan çocuk hâlâ bağlıysa o, değilse çocuk seçilmeden birleşik görünüm açılır. Sezon bağlamı son geçilen sezondur, yoksa okulun yürürlükteki sezonu.

## Kurallar

- Bir kişinin **yalnız bir hesabı** olabilir; unique index ile korunur. Kişi tarafında da bağlı hesap bir kez yazılıp değiştirilemez.
- Parola doğrulama domain'de yapılmaz; hash'leme Application sınırındaki porta bırakılır. Uygulanan algoritma Argon2id'dir.
- Parola değiştiğinde **tüm oturumlar kapatılır** (tüm refresh token'lar geri çekilir).
- Yönetici parola sıfırladığında hesap yeniden "parola değiştirmeli" işaretlenir.
- Refresh token'ın ham hâli saklanmaz, yalnız hash'i tutulur. Yenileme sırasında eski token geri çekilir ve zincire yenisi eklenir.
- **Kullanılmış bir refresh token tekrar gelirse** bu saldırı kabul edilir: tüm zincir geri çekilir ve şüpheli kullanım olayı yayınlanır.
- İzin sürümü (`PermissionsVersion`) rol/izin değişiminde artırılır; önbellekteki eski izin kümesi böylece geçersizleşir.
- OTP kodu ham saklanmaz; deneme sayacı sınırlıdır (varsayılan 5), kod ömrü 5 dakikadır.
- Parola sıfırlama jetonu tek kullanımlıktır, 30 dakika yaşar, ham hâli saklanmaz.

## İlişkiler

- [[Kişi]] — bire bir köprü (`PersonId`); hesap kişisiz var olamaz
- [[Profil]] — aktif profil seçimi ve profiller arası geçiş
- [[Veli-Öğrenci İlişkisi]] — veli hesabının çocuk bağlamı buradan doğrulanır
- [[Sezon]] — aktif sezon bağlamı
- [[Rıza Paketi]] — giriş ve jeton yenilemede rıza kapısı, kişinin son veri işleme rızasının sürümünü yürürlükteki paketle karşılaştırır ([[Rıza Kaydı]])
- [[İzin]] — izinler jetona basılmaz, hesabın rol atamalarından çözülür
- [[Bildirim]] — bildirimin alıcısı kişi değil hesaptır; hesabı olmayan kişi bildirim almaz

## Geçtiği modüller

- [[Kimlik Doğrulama]] — kavramın sahibi; giriş, jeton yenileme, çıkış, parola, OTP, bağlam geçişi
- [[Kullanıcılar]] — davet kabulünde hesap üretimi

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- İki adımlı doğrulama bayrağı (`TwoFactorEnabled`) hesapta duruyor ama OTP amaçları arasında `Login` "Sprint 5'te etkinleşecek" notuyla bekliyor. Bayrak şu an bir şey yapıyor mu?
- Kişi askıya alındığında hesabın da askıya alınması otomatik mi, yoksa iki ayrı işlem mi?
- İki kilit kaynağı yan yana çalışıyor: hesap üzerindeki sayaç (5 hata → 15 dakika) ve giriş koruyucusu (5 / 10 / 20 hata → 5 dakika / 30 dakika / 2 saat). Hangisi kanonik, ikisi birlikte mi kalacak?
