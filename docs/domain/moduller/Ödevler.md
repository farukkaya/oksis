---
aliases: [Homework, api/v1/homework, Ödev Modülü]
tags: [domain/academic, module]
status: completed
last-synced: 2026-09-03 (b72c819)
---

# Ödevler

<!-- generated:start -->

## Ne yapar

Ödevin tüm ömrünü dört yüzden taşır. **Öğretmen** ödevi taslak açar, düzenler, yayınlar, kapatır ya da gerekçeyle iptal eder, taslağı siler, kontrol ızgarasında öğrenci öğrenci işaretler ya da kalanları toplu tamamlar. **Öğrenci** kendi listesini ve detayını görür, dosya teslim eder ve kaldırır. **Veli** aynı listeyi salt okunur görür. **İdare** okul geneli listeye, şube × gün yoğunluk panosuna ve kontrol bekleyenlere üstten bakar; ayrılmış öğretmenin taslağını onun adına yayınlar, yanlış yüklenmiş teslimi gerekçeyle kaldırır, okulun ödev politikasını yönetir. Beşinci, dar bir yüz **rehber öğretmenindir:** kendi şubesinin ödevlerini salt liste olarak görür; taslak dönmez, teslim içeriği açılmaz, muafiyet gerekçesi şemada bile yoktur.

Modülün karakteri [[Notlar]] ile aynı üç ilkeye dayanır: **yayın birimi ödevdir** (taslak kimseye ulaşmaz), **satırlar tembel doğar** (sonradan katılan öğrenci okurken sentezlenir, ilk işaretlemede kalıcılaşır) ve **karar sunucuda verilir** (görünüm, gecikme, sayaçlar, "okulun günü" istemcide türetilmez). Fark: burada geri alma yoktur — yayın öğrenciye ulaşmıştır, geri alınsa ekranından sessizce kaybolurdu; yerine gerekçeli, görünür iptal vardır.

## Kullandığı kavramlar

- [[Ödev]] — dönem × şube × ders × sahip; `Draft → Published → Closed | Cancelled`; ekler, hedef seçimi ve denetim izi içinde
- [[Ödev Takibi]] — ödev × öğrenci; beş durum; tembel satır; sayaçların ve hatırlatma damgasının yeri
- [[Ödev Teslimi]] — satırın dosyası; yumuşak kaldırma; 5 aktif dosya kotası
- [[Dönem]] / [[Şube]] / [[Ders]] — koordinat; form bağlamı her zaman güncel döneme düşer
- [[Ders Programı]] — "hangi şubeye ödev verebilirim" sorusunun tek kaynağı; görevlendirme kullanılmaz
- [[Öğrenci Kaydı]] — yayın anındaki mevcut ve sonradan katılan/ayrılan öğrenci kuralları
- [[Kişi]] — sahip, öğrenci, veli, idare hep kişi kimliğidir; "ayrılmış öğretmen" çalışan kişiler kümesinin tümleyenidir
- [[Veli-Öğrenci İlişkisi]] — aile kapsamı; kapsam dışı çocuk 404; iptal edilmiş bağ kapsam dışı
- [[Saklı Dosya]] / [[Dosya Bağı]] / [[Dosya Kategorisi]] — öğretmen eki ve öğrenci teslimi iki ayrı kategori, iki ayrı bağ tipi
- [[Okul]] — okulun günü ve saat dilimi; tüm tarih kararları buradan
- [[Okul Ayarları]] — hatırlatma saati, eksik ödev bildirim kipi, günlük yoğunluk eşiği
- [[İzin]] — üç anahtar: okuma, yazma, yönetme
- [[Bildirim]] / [[Bildirim Türü]] — üç olay: yayın, son teslim hatırlatması, eksik ödev; ayrı bildirim grubu
- [[Modül Yapılandırması]] — seed'de ödev anahtarı **yok**

## Ana akışlar

1. **Oluşturma ve düzenleme** — Form bağlamı sunucunun gününü, öğretmenin dersini ve o dersin şubelerini verir; hedef seçici şubenin öğrencilerini listeler (kapsam dışı şube 404). Kayıt taslak doğar, bildirim gitmez. Düzenlemede ek alanı gönderilmezse ekler korunur, boş dizi temizler; hedef tipi yayında donmuştur. Kapanmış ve iptal edilmiş ödev düzenlenemez.

2. **Yayın** — Geri alınamaz. Hedef bu anda mevcutla çözülür; boş hedef 409, geçmiş son teslim 400. Takip satırları açılır, seçim tüketilir, yayın denetim kaydı yazılır, kayıt bittikten sonra hedef öğrencilere ve velilerine bildirim kuyruklanır.

3. **Kapatma, iptal, taslak silme** — Üçü de sahibinindir; idare kapatamaz. Kapatma denetlenmez. İptal gerekçe ister (≥ 15), gerekçe öğrenciye görünür ve denetime yazılır. Taslak silme sessizdir ve yumuşaktır.

4. **Kontrol ızgarası** — Kalıcı satırlar ile şube mevcudu birleştirilir (yalnız tüm-sınıf hedefli yayındaki ödevde); ayrılan öğrencinin satırı kalır. İşaretleme yalnız sahibe açıktır, muaf gerekçe ister, sentezlenmiş satır ilk işaretlemede doğar. Toplu tamamlama işaretlenmemişlerin tümünü kapsar ve tek özet kayıt yazar. Anlık kipte eksik/yapılmadı işareti veliye o anda bildirilir.

5. **Öğrenci ve veli yüzü** — Kimlik oturumdan gelir; öğrencinin listesinde yalnız yayında ve kapanmış ödevler vardır, detayda iptal edilmiş de döner. Tanınmayan liste süzgeci 400'dür, sessiz "hepsi" değil. Velinin listesi öğrencininkinin salt okunur ikizidir: çocuk sorgudan gelir, kapsam sunucuda süzülür, kapsam dışı çocuk 404. Aile şemasında "yükleyebilir" ve muafiyet gerekçesi alanları hiç yoktur.

6. **Teslim** — Öğrenci yayındaki ödeve en fazla 5 aktif dosya yükler; kaldırma yumuşaktır. Yükleme 201 döner ama tekil teslimin adresi yoktur. Bildirim üretmez.

7. **İdare** — Okul geneli listede taslak yalnız sahibi ayrılmışsa görünür; öğretmen parametresi bir süzgeçtir, kapsam kapısı değil (kapsamı olmayan kimlik boş liste alır, 403 değil); gün süzgeci ile aralık süzgeci birlikte kullanılamaz. Süzgeç evreni listeden türetilmez. Yoğunluk panosu haftanın herhangi bir gününü alır, içeren haftanın **Pazartesi–Cuma**'sına indirger ve indirgenmiş hâlini döner; hafta sonu girdi önceki pazartesiye düşer. **Öğretmen parametresi yoktur** — pano yük ölçerdir, performans karnesi değil. Kontrol bekleyenler "gecikmiş ve işaretlenmemiş satırı var" koşuluyla, en eski üstte. Adına yayın yalnız ayrılmış öğretmenin taslağına, gerekçeli ve yeni tarihle; sahibi çalışan taslak 409. İdari teslim kaldırma gerekçeli ve denetimli.

8. **Okul politikası** — Okul ayarları altında yaşar, ödev rotasında değil. Ekranda beş kontrol, kolon üç: hatırlatma saati (0 = kapalı), eksik ödev bildirim kipi (kapalı / günlük özet / anlık) ve günlük yoğunluk eşiği. "Hatırlatma açık" ve "veli bildirimi açık" anahtarları türetilir, kalıcılaştırılmaz.

9. **Bildirim ve zamanlanmış işler** — Üç tür: **yayın** (hedef öğrenciler + veliler; gövdede başlık geçer, içerik geçmez), **son teslim yaklaşıyor** (saatlik iş; her okulun kendi politikası; yalnız işaretlenmemiş satırın öğrencisi + velisi; pencere son teslim gününün okul-yerel başlangıcına göre; damga satırda; kaçırılan pencere sonradan telafi edilmez) ve **eksik ödev** (yalnız veliye; anlık kipte işaretleme anında, özet kipte her akşam 20:30'da veli başına tek bildirim; özet iş hiçbir şey yazmaz, tekliği deterministik olay anahtarı sağlar). Bildirim grubu "Akademik" değil ayrı **Ödev** grubudur — veli not bildirimlerini kapatırken ödevi de kapatmış olmasın. Teslim yükleme, taslak silme ve oluşturma bildirim üretmez.

**Yetki — izin ve görünüm.** **Okuma** öğretmen, veli, öğrenci ve idarede (platform hesabında da); **yazma** öğretmen ve okul yöneticisinde; **yönetme** yalnız okul yöneticisinde ve izin kataloğu dışında — platform hesabı okul içi ödev veremez ve ödev kararı alamaz. İkinci katman görünümdür ve istemciden gelmez: **sahiplik → idare → rehberlik → kapsam dışı (404)**. Daraltma serileştirme düzeyindedir; rehber ve aile şemaları ayrı kayıt tipleridir, alan "boş" değil "yok"tur. Yazma kapısı yöneticiye açılmaz; idarenin işleri kendi uçlarındadır.

**Hata sözleşmesi.** Kodlar `Homework.` önekiyle gelir. Durum makinesi ihlali, boş hedef, teslim kotası ve teslime kapalı ödev 409; geçmiş son teslim ve doğrulama 400; sahibi olmayan, kapsam dışı ve mevcutta olmayan öğrenci 404. "Teslime kapalı" ile "geçersiz durum" aynı HTTP kodunu paylaşır ama ayrı tiplerdir: biri öğrenciye, diğeri öğretmene gösterilir. Kota aşımı doğrulama değildir — gövde kusursuzdur, kaydın hâli uygun değildir. Arşiv sezon bağlamında tüm yazma uçları kapalıdır.

## Kapsam dışı

- **Yayın geri alma.** Yerine görünür iptal.
- **Sahiplik devri.** Adına yayınlanan ödevin sahibi ayrılmış öğretmen kalır (açık soru).
- **Teslimin notlandırılması.** Öğretmenin kararı beş durumdur; puan yoktur.
- **Teslim yükleme, taslak silme ve oluşturma bildirimi.**
- **Denetim izi okuma ucu.** Yazılıyor, okuyan yok.
- **Öğretmene göre sıralama ve öğretmen başına sayaç** panolarda; süzme kıyas değildir, sıralama kıyastır.
- **Bildirimde derin bağlantı.** İstemci rotaları bu depodan doğrulanamıyor.
- **E-posta kanalı.** Seed'de işaretli ama depo genelinde kanal yok.
- **Çok dersli form.** Form bağlamı ilk dersi alır.
- **Kaçırılan hatırlatmanın telafisi.** Geç kalmış hatırlatma gürültü sayıldı.
- **Modül açık/kapalı kontrolü.** Seed'de anahtar bile yok; bkz. `X-20`.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Sahiplik devri yok:** idare kendi yayınladığı ödevin ızgarasını işaretleyemez. Defter: `TB-109`.
- **İdari teslim kaldırma kapanmış ödevde 409.** Defter: `TB-110`.
- **Tarihi ileri alınan ödev ikinci kez hatırlatılmaz.** Defter: `TB-111`.
- **Denetim kaydı yazılıyor, okuyan uç yok.** Defter: `TB-112`.
- Modül yapılandırması seed'inde ödev anahtarı yok; Notlar'daki `marks` uyumsuzluğunun bir adım ötesi. `X-20`.
- Handler seviyesinde test altyapısı yok; saf çekirdekler ve validator'lar test edildi, satır doğuran kollar ve sayaç okuyucusu koşulmadı (kod kendi ARCHITECTURE notunda söylüyor).
- Kademe etiketi üç modülde kopya (Yoklama, Notlar, Ödevler).
