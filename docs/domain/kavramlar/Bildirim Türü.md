---
aliases: [NotificationKind, NotificationType, NotificationEventType, Bildirim Tipi, Olay Tipi]
tags: [domain/messaging]
table: master.notification_types
status: active
last-synced: 2026-09-03 (b72c819)
---

# Bildirim Türü

<!-- generated:start -->

## Nedir

"Bu bildirim ne hakkında" sorusunun cevabı — devamsızlık uyarısı mı, duyuru mu, nöbet çizelgesi mi.

⚠️ **Bu kavramın kodda üç ayrı temsili var ve üçü aynı şey değil.** Yeni gelenin en çok takılacağı yer burasıdır; hangisine baktığını bilmeden karar verme.

## Üç temsil

**1. Fiilen kullanılan enum (`NotificationKind`)** — Üretilen her bildirim satırının taşıdığı değer. Yirmi beşten fazla değeri var ve gerçek hayat burada: ders programı yayını, vekâlet, ders iptali, nöbet çizelgesi, yoklama alınmadı uyarısı, mazeret kararı, düzeltme talebi kararı, gün içi izin, etkinlik toplu mazereti, devamsızlık eşiği, duyuru yayını/geri çekme/düzeltme/onay/red/zamanlanmış yayın ve zamanlama başarısızlığı, kulüp olayları, **not yayınlandı**, ödev yayınlandı ve son teslim hatırlatması.

"Not yayınlandı" iki ilkeyi örnekler: **gövdede not değeri geçmez** (bildirim bir haberdir, kanal değil — değeri görmek için uygulamaya girilir) ve **görünürlük ile bildirim ayrı kararlardır** (sessiz yayın notu görünür yapar, bildirimi üretmez). Alıcı velilerdir; öğrenci yalnız kademe görünürlüğü açıksa eklenir. Bkz. [[Değerlendirme]].

Üç ödev türü aynı ilkelerin devamıdır ve **ayrı bir "Ödev" grubunda** durur — "Akademik" grubuna konsaydı veli not bildirimlerini kapatırken ödevi de kapatmış olurdu. **Ödev yayınlandı:** hedef öğrenciler ve velileri; gövdede başlık geçer, içerik geçmez; taslak bildirim üretmez, oluşturma değil yayın doğurur. **Son teslim yaklaşıyor:** yalnız işaretlenmemiş satırı olan öğrenci ve velisi — ödevini bitirmişe hatırlatma göndermek bildirimi gürültüye çevirir; okulun hatırlatma saati sıfırsa hiç üretilmez. **Eksik ödev:** yalnız veliye, öğrenciye değil (kendi ızgarasında görüyor); anlık ve günlük özet aynı türü paylaşır, veliye ayarlarda ayırt edemeyeceği iki satır gösterilmesin diye. Bkz. [[Ödev Takibi]].

Bu enum'un değerleri kabaca "kim, neyi, hangi durumda öğrenmeli" ayrımını taşır. Örneğin duyurunun geri çekilmesi **yalnız yayınlayana** gider, düzeltilmesi **yalnız alıcılara**; bu yüzden ayrı değerlerdir.

**2. Dağıtım master kataloğu (`NotificationType`)** — `ATT_ABSENT`, `GRADE_PUBLISHED` gibi kodlar, izinli kanal kombinasyonu ve varsayılan açıklık taşır. Belgesinde "MVP'de bu satırlar yetkilidir" yazıyor — **ama hiçbir kod bu tabloyu okumuyor.**

**3. Ayarlar matrisi kataloğu (`NotificationEventType`)** — Okul ayarlarındaki olay×kanal matrisini besler: olay grupları (devamsızlık, akademik, ödeme, duyuru), SMS'in o olay için uygulanabilir olup olmadığı, yeni okullar için varsayılan kanal durumları. Kodun kendisi bu kataloğun "ayarlar arayüzüne özel bir görünüm" olduğunu ve dağıtım kataloğuyla ortak kodlar üzerinden uzlaştırılabileceğini söylüyor.

## İki katalog neden ayrı

Kod bu ayrımı bilinçli anlatıyor: ayarlar matrisi, henüz dağıtım karşılığı olmayan olayları da (taksit hatırlatması, ödeme alındı, karne, acil duyuru) **yer tutucu** olarak gösterebilmek için ayrı tutulmuş. İlgili modüller geldikçe dağıtıma bağlanacakları belirtilmiş ve bu borç olarak işaretlenmiş.

Pratikte bunun anlamı şu: **ayarlar ekranında görünen bir olay, gerçekten gönderilen bir bildirim olmayabilir.**

## Kurallar

- Dağıtım kataloğunda kod tekildir, büyük harfe normalize edilir ve en az bir kanal seçili olmalıdır.
- Ayarlar kataloğunda SMS uygulanamayan bir olayda SMS varsayılanı açık bırakılamaz; kayıt bunu düzeltir.
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

- **Dağıtım kataloğunun hiçbir tüketicisi yok.** Seed'li, belgeli ve "yetkili" diye işaretli ama okunmuyor. Kaldırılsın mı, yoksa dağıtım gerçekten ona bağlansın mı?
- Fiilen kullanılan enum ile iki katalog arasında bir eşleme yok. Bir bildirim üretildiğinde hangi katalog satırına karşılık geldiği koddan çıkmıyor.
- Ayarlar matrisinde yer tutucu olarak duran olaylar (ödeme, karne) kullanıcıya çalışıyormuş gibi görünüyor. İşaretlenmeli mi?
