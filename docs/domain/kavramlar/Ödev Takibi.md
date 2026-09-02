---
aliases: [HomeworkTracking, TrackingStatus, Takip Satırı, Kontrol Izgarası, Ödev Kontrolü]
tags: [domain/academic]
table: academic.homework_tracking
status: active
last-synced: 2026-09-03 (b72c819)
---

# Ödev Takibi

<!-- generated:start -->

## Nedir

**Ödev × öğrenci** — kontrol ızgarasının bir satırı ve öğretmenin o öğrenci için verdiği karar. Beş durum: **işaretlenmedi**, **tamamlandı**, **eksik**, **yapılmadı**, **muaf**.

İki ürün kuralı buradadır: "işaretlenmedi" öğrencinin değil **öğretmenin** henüz karar vermediği anlamına gelir ve öğrenci yüzünde hiçbir etiket üretmez; "yapılmadı" öğrenci ve veli yüzünde **kırmızı değildir**.

## Yaşam döngüsü

Satırlar **yayın anında** doğar; taslakta satır yoktur (ödev kimseye ulaşmadı). Yayından sonra şubeye katılan öğrencinin satırı veritabanına yazılmaz: ızgara okunurken şube mevcuduyla birleştirilip bellekte sentezlenir. Kalıcı satır **ilk işaretlemede ya da öğrencinin ilk teslim yüklemesinde** doğar ve "yayından sonra eklendi" işaretini taşır — öğretmen "bu ödev ona verilmemişti" bilgisini görür. Okuma hiçbir zaman yazmaz. [[Not Defteri]]'nin tembel kalıbının aynısı.

Mevcutla birleşim yalnız **tüm sınıfa verilmiş ve hâlâ yayında** olan ödevde yapılır: seçili öğrenci hedefinde hedef dondurulmuştur, kapanmış ödev tarihsel kayıttır. Şubeden **ayrılan** öğrencinin kalıcı satırı ızgarada kalır; öğretmen verdiği kararı görmeye devam eder.

## Kurallar

- **Tekillik:** ödev + öğrenci.
- Öğrenci numarası ve adı kolon değildir; okumada birleştirilir. Anlık kopya, ad değişikliğinde eski ödevde eski adı gösterirdi.
- **Muafiyet gerekçesi zorunludur ve duruma bağlıdır:** muaf dışına çıkan satır gerekçesini kaybeder ("tamamlandı — raporlu" çelişkisi kalmasın). Gerekçe bir **sağlık bilgisi** sayılır: rehber öğretmenin ve ailenin şemasında alan boş değil, **hiç yoktur**.
- "İşaretlenmedi"ye dönüş karar damgasını (kim, ne zaman) siler — karar yokluğunun damgası olmaz.
- **Yalnız sahip işaretler,** yalnız yayındaki ödevde. Sentezlenmiş satır da işaretlenebilir; mevcutta olmayan öğrenci 404.
- **Toplu tamamlama** işaretlenmemiş kalan tüm satırları, sentezlenmişler dâhil, tamamlandı yapar ve **tek özet** denetim kaydı yazar. Tekil işaretleme denetlenmez.
- **Sayaçların tek kaynağı vardır;** yüzde alanı yoktur, ekran "12/26" gösterir. "İşaretlendi" = işaretlenmemiş olmayan (muaf da bir karardır). Teslim sayacı **öğrenci** sayar, dosya değil.
- **Hatırlatma damgası satırdadır,** ödevde değil: hatırlatma öğrenci başına gider ve **tamamlamış öğrenciye gitmez**. Damga sıfırlanmaz — işaret geri alınsa da, son teslim tarihi ileri alınsa da (açık soru).
- **Eksik / yapılmadı işareti yalnız veliye bildirilir,** öğrenciye değil (kendi ızgarasında görüyor; ikinci kez söylemek cezalandırma tonudur). Kip okul politikasından gelir: anlık kipte işaretleme anında, günlük özet kipte her akşam veli başına **tek** bildirim, kapalı kipte hiç.

## İlişkiler

- [[Ödev]] — sahip; ödevin durumu işaretleme kapısıdır
- [[Ödev Teslimi]] — satırın dosyaları
- [[Kişi]] — öğrenci ve işaretleyen; yalnız kimlik
- [[Öğrenci Kaydı]] — şube mevcudu; sentez ve ayrılan öğrenci kuralı
- [[Okul Ayarları]] — hatırlatma saati ve eksik ödev bildirim kipi
- [[Bildirim Türü]] — "son teslim yaklaşıyor" ve "eksik ödev"

## Geçtiği modüller

- [[Ödevler]] — kavramın sahibi; ızgara, işaretleme, toplu tamamlama, sayaçlar, iki zamanlanmış iş

<!-- generated:end -->

## Notlar

<El yazısı alan. Senkron buraya dokunmaz.>

## Açık Sorular

- **Son teslim tarihi ileri alınan ödev ikinci kez hatırlatılmaz;** damga sıfırlanmıyor. Sıfırlamak tersini yapardı (bir gün kaydırınca herkese ikinci bildirim). Ürün kararı (defter: `TB-111`).
- Hatırlatma işi saatlik pencereyle çalışır; iş bir saatten fazla gecikirse o saatin ödevleri hiç hatırlatılmaz. Bilinçli — geç kalmış hatırlatma gürültü sayıldı.
