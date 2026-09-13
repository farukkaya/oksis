---
aliases: [NotificationKind, NotificationEventType, Bildirim Tipi, Olay Tipi, NotificationType (removed)]
tags: [domain/messaging]
table: master.notification_event_types
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Bildirim Türü

<!-- generated:start -->

## Nedir

"Bu bildirim ne hakkında" sorusunun cevabı — devamsızlık uyarısı mı, duyuru mu, nöbet çizelgesi mi.

⚠️ **Bu kavramın kodda iki ayrı temsili var ve ikisi aynı şey değil.** Yeni gelenin en çok takılacağı yer burasıdır; hangisine baktığını bilmeden karar verme. Eskiden üçüncü bir temsil de vardı (dağıtım master kataloğu, `NotificationType`): seed'li ve "yetkili" diye belgelenmişti ama hiçbir kod onu okumuyordu, bu yüzden silindi (TB-44).

## İki temsil

**1. Fiilen kullanılan enum (`NotificationKind`)** — Üretilen her bildirim satırının taşıdığı değer. Yirmi beşten fazla değeri var ve gerçek hayat burada: ders programı yayını, vekâlet, ders iptali, nöbet çizelgesi, yoklama alınmadı uyarısı, mazeret kararı, düzeltme talebi kararı, gün içi izin, etkinlik toplu mazereti, devamsızlık eşiği, duyuru yayını/geri çekme/düzeltme/onay/red/zamanlanmış yayın ve zamanlama başarısızlığı, kulüp olayları, **not yayınlandı**, ödev yayınlandı ve son teslim hatırlatması.

"Not yayınlandı" iki ilkeyi örnekler: **gövdede not değeri geçmez** (bildirim bir haberdir, kanal değil — değeri görmek için uygulamaya girilir) ve **görünürlük ile bildirim ayrı kararlardır** (sessiz yayın notu görünür yapar, bildirimi üretmez). Alıcı velilerdir; öğrenci yalnız kademe görünürlüğü açıksa eklenir. Bkz. [[Değerlendirme]].

Üç ödev türü aynı ilkelerin devamıdır ve **ayrı bir "Ödev" grubunda** durur — "Akademik" grubuna konsaydı veli not bildirimlerini kapatırken ödevi de kapatmış olurdu. **Ödev yayınlandı:** hedef öğrenciler ve velileri; gövdede başlık geçer, içerik geçmez; taslak bildirim üretmez, oluşturma değil yayın doğurur. **Son teslim yaklaşıyor:** yalnız işaretlenmemiş satırı olan öğrenci ve velisi — ödevini bitirmişe hatırlatma göndermek bildirimi gürültüye çevirir; okulun hatırlatma saati sıfırsa hiç üretilmez. **Eksik ödev:** yalnız veliye, öğrenciye değil (kendi ızgarasında görüyor); anlık ve günlük özet aynı türü paylaşır, veliye ayarlarda ayırt edemeyeceği iki satır gösterilmesin diye. Bkz. [[Ödev Takibi]].

Bu enum'un değerleri kabaca "kim, neyi, hangi durumda öğrenmeli" ayrımını taşır. Örneğin duyurunun geri çekilmesi **yalnız yayınlayana** gider, düzeltilmesi **yalnız alıcılara**; bu yüzden ayrı değerlerdir.

**2. Ayarlar matrisi kataloğu (`NotificationEventType`)** — Okul ayarlarındaki olay×kanal matrisini besler: olay grupları (devamsızlık, akademik, ödev, kulüp, ödeme, duyuru), SMS'in o olay için uygulanabilir olup olmadığı, yeni okullar için kanal varsayılanları (portal, e-posta, SMS, push) ve **bu olayın bugün gerçekten bir bildirim üretip üretmediği**. Okulun olay kararları ve kişisel push tercihleri bu kataloğun olay anahtarlarını kullanır.

Enum ile katalog arasındaki köprü **push kapsam listesidir**: listedeki her enum değeri bir katalog anahtarına eşlenir. Push ve e-posta yalnız bu listedeki olaylarda çalışır; listede olmayan enum değerinin matriste karşılığı yoktur. Bkz. [[Bildirim Yapılandırması]].

## Katalog neden enum'dan ayrı

Katalog, henüz dağıtım karşılığı olmayan olayları da (taksit hatırlatması, ödeme alındı, karne, acil duyuru) **yer tutucu** olarak gösterebilmek için ayrı tutuluyor; ilgili modüller geldikçe bağlanacaklar. Yer tutucu olaylar kullanıcıya çalışıyormuş gibi görünmesin diye her katalog satırı "gerçekten bildirim üretiyor mu" bayrağı taşır (TB-44). Bayrak teslimatı değiştirmez, yalnız gerçeği söyler.

En keskin örnek acil duyurudur: katalogda e-posta varsayılanı açık gelir, ama duyuru yayın bildirimini bu olaya eşleyen kod yoktur ve duyurular push/e-posta kapsamında değildir. **Ayarlar ekranında görünen bir olay, gerçekten gönderilen bir bildirim olmayabilir.**

## Kurallar

- Katalogda olay anahtarı ve ad zorunludur; anahtar büyük harfe normalize edilir.
- SMS'in uygulanamadığı bir olayda SMS varsayılanı açık olamaz; böyle bir kayıt reddedilir.
- Enum değerleri arayüzle kilitli sözleşmedir.

## İlişkiler

- [[Bildirim]] — üretilen satır enum değerini taşır
- [[Bildirim Yapılandırması]] — ayarlar matrisi bu katalogdan beslenir

## Geçtiği modüller

- [[Bildirimler]] — kavramın sahibi
- [[Okul Yönetimi]] — ayarlar matrisinin sunulduğu yer
- [[Notlar]] — "not yayınlandı" üreticisi; düzeltme ve geri alma bilinçli olarak bildirim üretmez
- [[Ödevler]] — üç tür: yayın, son teslim hatırlatması, eksik ödev; teslim yükleme ve taslak silme bilinçli olarak bildirim üretmez

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- (Şu an açık soru yok.)
