---
aliases: [Account, Kullanıcı Hesabı]
tags: [domain/people]
table: identity.accounts
status: active
last-synced: 2026-08-10 (2270867)
---

# Hesap

<!-- generated:start -->

## Nedir

Bir [[Kişi]]'nin giriş yapabilmesini sağlayan kimlik doğrulama ve oturum kaydı. Kişi "kim"i, hesap "nasıl giriyor"u tutar: parola hash'i, oturum jetonları, kilitlenme sayacı, son aktif bağlam.

Ayrımın sebebi, kişi kaydının hesap olmadan da var olabilmesidir — okul öğrenciyi sisteme girer, öğrenci hiç giriş yapmasa bile kaydı yaşar. Hesap ancak [[Davet]] kabul edildiğinde doğar.

Modüller arası yabancı anahtar kurulmaz; bağ `PersonId` köprüsüyle yürür.

## Yaşam döngüsü

Davet kabulünde oluşturulur ve baştan aktiftir; ilk girişte parola değiştirme zorunluluğu işaretli gelir. Askıya alma ve yeniden aktive etme bayrak üzerinden yapılır — hesap silinmez.

**Kilitlenme:** yalnız hatalı parola sayacı artırır; eşiğe ulaşınca (varsayılan 5 deneme) hesap belirli süre kilitlenir (varsayılan 15 dakika). Yönetici elle açabilir; açan kişi kayda yazılır.

## Aktif bağlam

Hesap üç bağlam bilgisini hatırlar: son aktif **profil tipi**, veli ise son bakılan **çocuk**, ve son aktif **sezon**. Bunlar giriş sonrası kullanıcıyı bıraktığı yere döndürmek içindir; her değişim ayrı bir olay yayınlar.

Birden fazla [[Profil]] taşıyan kişide girişte profil seçimi istenir; seçim yapılana kadar aktif profil boş kalır.

## Kurallar

- Bir kişinin **yalnız bir hesabı** olabilir; unique index ile korunur. Kişi tarafında da bağlı hesap bir kez yazılıp değiştirilemez.
- Parola doğrulama domain'de yapılmaz; hash'leme Application sınırındaki porta bırakılır.
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
- [[Rıza Paketi]] — hesabın kabul ettiği rıza sürümü
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
