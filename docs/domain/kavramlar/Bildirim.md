---
aliases: [Notification, NotificationDeliveryLog, Zil Bildirimi]
tags: [domain/messaging]
table: notifications.notifications
status: active
last-synced: 2026-08-10 (2270867)
---

# Bildirim

<!-- generated:start -->

## Nedir

Kullanıcının zil menüsünde gördüğü kalıcı satır: başlık, kısa gövde ve tıklanınca gidilecek derin bağlantı.

Alıcı bir kişi değil bir **[[Hesap]]**'tır. Sebebi pratik: bildirim giriş yapmış kullanıcıya gösterilir, dolayısıyla hesabı olmayan kişiye bildirim üretilmez. Alıcı çözümlemesi kişi kimliklerinden hesaplara çevrilir ve bağlı hesabı olmayanlar sessizce atlanır.

Bildirim **kendi başına doğmaz** — her zaman bir olayın sonucudur. Duyuru yayınlanır, nöbet çizelgesi çıkar, yoklama alınmaz, devamsızlık eşiğe gelir; bildirim bunların yansımasıdır.

## Yaşam döngüsü

Üretilir ve okunur. Okundu işareti **idempotenttir**: ikinci kez okundu denince ilk okunma zamanı korunur. Silme yolu yoktur.

## Teslim garantisi

Aynı olayın aynı alıcıya aynı kanaldan iki kez ulaşmaması için ayrı bir **teslim kaydı** tutulur; (olay, alıcı, kanal) üçlüsü tekildir ve bu tekillik veritabanı seviyesinde korunur.

Garanti **en fazla bir kez**tir, tam olarak bir kez değil. İki bilinen pencere vardır ve ikisi de kod içinde borç olarak işaretlenmiştir: eşzamanlı gönderimlerde ön kontrol yarışabilir (tekil index yakalar), ve kanal gönderimi ile teslim kaydının yazılması arasında süreç çökerse yeniden deneme mükerrer üretebilir. Kesin çözüm için giden-kutusu (outbox) deseni planlanmış ama henüz yok.

Her alıcı kendi başına işlenir; birinde hata olması diğerlerine teslim edilmiş bildirimleri geri almaz.

## Kurallar

- Alıcı bir hesap kimliğidir; bağlı hesabı olmayan kişi bildirim almaz.
- Okundu işareti geri alınamaz ve ilk okunma zamanı korunur.
- Aynı olay + alıcı + kanal ikinci kez teslim edilemez.
- Kalıcı satır yazıldıktan sonra alıcının canlı bağlantısına da anlık gönderim yapılır — biri diğerinin yerine geçmez.

## İlişkiler

- [[Hesap]] — bildirimin alıcısı
- [[Bildirim Türü]] — bildirimin ne olduğunu söyleyen kod
- [[Bildirim Yapılandırması]] — okulun kanal tercihleri *(bugün teslimatı etkilemiyor)*

## Geçtiği modüller

- [[Bildirimler]] — kavramın sahibi
- [[Duyurular]], [[Nöbetler]], [[Yoklama ve Devamsızlık]], [[Ders Programı Yönetimi]], [[Öğrenci Kayıt Yönetimi]] — bildirim üreten olayların kaynakları

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- Bildirimlerin saklama süresi tanımlı değil; zil menüsü yıllar boyunca birikecek mi?
- Okunmuş bildirimlerin temizliği veya arşivlenmesi için bir iş görünmüyor.
