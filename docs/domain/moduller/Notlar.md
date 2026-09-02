---
aliases: [Grades, api/v1/grades, marks, Not Modülü]
tags: [domain/academic, module]
status: completed
last-synced: 2026-09-03 (b72c819)
---

# Notlar

<!-- generated:start -->

## Ne yapar

Dönem içi not girişini dört yüzden taşır. **Öğretmen** kendi defterlerini listeler, ızgarayı açar, hücre hücre not girer, sütunu temizler, sınav tarihi yazar, sütunu yayınlar (isterse sessizce), pencere içinde gerekçeli düzeltme yapar, defteri xlsx indirir. **İdare** sorumlu öğretmen adına yayınlar, yayını geri alır, sütunu kilitler ve açar, denetim izini okur, gösterge paneli özetini ve takip panosunu görür, not politikasını (görünürlük, sınıf ortalaması, düzeltme penceresi) okul ayarlarından yönetir. **Veli ve öğrenci** aile not yüzünü salt okunur görür, "yeni not" rozetini düşürür. Öğrenci detayındaki "Notlar" sekmesi öğretmen ve idareye açıktır; daraltma kimlikten türer.

Modülün üç karakteristik kararı var. **Yayın birimi sütundur:** öğretmen notları tek tek değil, "1. Sınav" sütununu bütün olarak yayınlar; hücrenin görünürlüğü diye bir şey yoktur. **Defter ve sütun tembel oluşur:** ilk not girilene kadar satırları yoktur ama listede görünürler; kimlikleri koordinattan kurulur. **Karar sunucuda verilir:** gecikme rozeti, ortalama, tamamlanma yüzdesi ve "öğrenci görebilir mi" istemcide türetilmez; istemci yalnız çizer.

## Kullandığı kavramlar

- [[Not Defteri]] — dönem × şube × ders; durumsuz, tembel
- [[Değerlendirme]] — sütun; `Empty → Draft → Published → Locked`; yayın birimi
- [[Not]] — hücre; üç hâlli değer, G/M paydaya girmez
- [[Not Denetim Kaydı]] — append-only iz; gerekçe aileyle paylaşılmaz
- [[Sınav Türü]] — sütun kataloğu; dönem süzgeci; defterde tekil
- [[Not Ölçeği]] — okulun varsayılan ölçeği üst sınırı verir; kademe override'ı okunmaz
- [[Dönem]] — zaman kutusu; kapanış sistem kilidi
- [[Şube]] / [[Ders]] — koordinat eksenleri
- [[Ders Programı]] — yazma ve okuma kapsamının tek kaynağı; görevlendirme değil
- [[Öğrenci Kaydı]] — roster, yazılabilirlik, nakil giden hariç sayaçlar
- [[Veli-Öğrenci İlişkisi]] — aile kapsamı; iptal edilmiş bağ kapsam dışı
- [[Kişi]] — öğretmen, öğrenci, veli, yönetici hep kişi kimliğidir; oturum kişiye bağlanamıyorsa yazma yolu yoktur
- [[Okul Ayarları]] — kademe bazlı öğrenci görünürlüğü, aileye sınıf ortalaması, düzeltme penceresi, varsayılan ölçek, geçme notu, ağırlıklar
- [[İzin]] — beş anahtar: okuma, yazma, yayın, yönetme, rapor
- [[Bildirim]] / [[Bildirim Türü]] — tek olay: not yayınlandı; uygulama içi + push
- [[Modül Yapılandırması]] — `marks` anahtarı seed'de var; modülün kendisi onu okumuyor
- [[Sezon]] — arşiv sezon bağlamında yazma yasak

## Ana akışlar

1. **Defter listesi ve ızgara** — Koordinatlar ders programından gelir; öğretmen kendi (şube, ders) çiftlerini, yönetici okulun tümünü görür ve ayrım kimlikten türer. Dönem parametresi verilmezse yürürlükteki dönem. Satırı olmayan defter boş sütunlarla döner; istemci var olmayan sütunu sınav türü kimliğiyle adresleyebilir. Şubeden ayrılan öğrenci ancak notu varsa listede kalır, kutusu kapalı.

2. **Not girişi** — Hücre başına yazma, öğrenci numarasıyla. Toplu giriş ucu yoktur. Defter ve sütun ilk yazımda yaratılır; ilk hücre sütunu taslağa çeker ve tek "sütunu oluşturdu" denetim kaydı yazılır. Değer okulun ölçek üst sınırına göre doğrulanır; G/M özel değerdir, tanınmayan metin 400'dür. Nakil giden öğrenciye yazma 409. Boş değer satır açmaz.

3. **Yayın** — Öğretmen kendi sütununu yayınlar; yönetici bu uçtan değil, gerekçeli "adına yayın" ucundan. Yayında iki denetim kaydı yazılır ("n not girdi" özeti ve yayın). Bildirim velilere her hâlde, öğrencilere yalnız kademe görünürlüğü açıksa gider; gövdede not değeri geçmez. "Sessiz yayın" notları görünür yapar, bildirimi keser.

4. **Düzeltme** — Yalnız yayınlanmış sütunda, gerekçeli. Yayından itibaren okulun düzeltme penceresi (varsayılan 48 saat) içinde öğretmen; pencere kapandıysa yalnız yönetme izni. Denetim kaydı eski ve yeni değeri taşır; bildirim üretilmez, aile yüzü "güncellendi" rozetiyle yetinir.

5. **Geri alma, kilit, kilit açma** — İdare işlemleri; gerekçe en az 15 karakter. Kilit ve kilit açma tek uçtur, çift yön. Geri alınan sütun taslağa döner ve aile artık görmez.

6. **Dönem kapanışı** — Dönem kapandığında o dönemin yayınlanmış sütunları sistemce kilitlenir; taslaklara dokunulmaz; defter başına tek planlı sistem kaydı. Aktör yok, gerekçe aranmaz, iş yeniden koşarsa idempotent.

7. **Aile yüzü** — Yan etkisizdir; "gördü" damgası ayrı bir çağrıyla yazılır ve geriye alınmaz. Damga kişi × öğrenci × dönem tekildir: annenin açması babanın rozetini düşürmez. Ders listesi program ∪ defter birleşimidir; taslak sütun "bekliyor" olarak görünür, değeri yok. Sınıf ortalaması okul ayarına bağlıdır. Kademe görünürlüğü kapalıysa (ilkokulda varsayılan) öğrenci kendi notunu göremez; veli her hâlde görür. Çocuk kimliği sunucuda doğrulanır; kapsam dışı çocuk 404.

8. **İdare panoları** — Gösterge paneli özeti sütun oranıdır (yayınlanan / toplam sütun) ve geciken defterlerin öğretmenlerini tekil sayar; takip panosu hücre oranıdır (girilen / beklenen not). **İki farklı formül,** tek hesaba indirilirse iki ekran çelişir. Satırı olmayan sütun panoda "boş" sayılır.

9. **Öğrenci listesi ortalaması** — Öğrenci modülü genel ortalama sütununu bu modülün soyutlamasından alır; tek yönlü bağımlılık. Kapsam sezon başından yürürlükteki döneme; üç katman ağırlıksız; yalnız yayınlanmış sütunlar; notu olmayan öğrenci "—" gösterir, sıfır değil.

10. **Politika ucu** — Ölçek üst sınırı, geçme notu, yazılı/performans ağırlıkları, düzeltme penceresi ve sınıf ortalaması tercihi okuma izniyle verilir; alanların yönetimi okul ayarları altında kalır. Politika okulun kuralıdır, yönetimin ayrıcalığı değil — öğretmen ve veli de okur.

**Yetki — iki katman.** İzin anahtarları ucu açar: **okuma** (öğretmen, veli, öğrenci, idare), **yazma** ve **yayın** (öğretmen), **yönetme** ve **rapor** (yalnız okul yöneticisi; izin kataloğu dışında, platform hesabına verilmez). Yönetici işlemleri yazma izniyle kapılansaydı öğretmen kendi yayınını geri alabilirdi; pano okuma izniyle kapılansaydı okul geneli pano aileye açılırdı — bu yüzden iki ayrı anahtar. İkinci katman kapsamdır: yazma kapısı yalnız programda o şube-dersi okutan öğretmene açılır, yöneticiye açılmaz; okuma kapısı öğretmene kendi defterleri, yöneticiye tümü; aile kapısı veli bağı ya da öğrencinin kendisi. İstemciden gelen rol parametresi kabul edilmez — yetki yükseltme yoludur.

**Hata sözleşmesi.** Kapsam reddi iki cümle söyler: **okuyabilen ama yazamayan** 403 + Türkçe gerekçe ("görevlendirmeniz değişmiş olabilir"), **okuyamayan** 404 — kapsam dışı defterin var olduğunu doğrulamak da bilgi sızdırmaktır. Değer hatası 400; durum makinesi ihlali, nakil giden öğrenci ve yayın/kilit yarışı 409; kapalı düzeltme penceresi ayrı bir yasak kodu. Türkçe gerekçenin ekrana taşınması için hata kodunun modül önekini taşıması şarttır. Arşiv sezon bağlamında tüm yazma uçları politikayla kapalıdır; okuma serbesttir.

## Kapsam dışı

- **Toplu not girişi ucu.** Hücre başına yazma yeter; toplu özet yayın anında üretilir.
- **Hücre başına denetim kaydı** ve **taslaktaki düzeltmelerin izi.**
- **Bildirimde not değeri.** Bildirim bir haberdir, kanal değil.
- **Düzeltme ve geri alma bildirimi.** Aile yüzündeki rozet yeter.
- **Harfli not girişi.** Değer sayı ya da G/M'dir.
- **Ağırlıklı ortalama ve karne.** Dönem içi ortalama ağırlıksızdır; yazılı/performans ağırlıkları bu modülde hesaba girmez.
- **Okulun sınav türü özelleştirmesi.** Sütun kataloğu platform geneli master veridir.
- **Kademe bazlı ölçek override'ı.** Tanımlı ama bu modül okumuyor (açık soru).
- **Gecikme eşiği ayarı.** 3 gün sabittir; ayara terfi kolay, geri alma zor.
- **Arka planda dışa aktarım.** Tek defter küçüktür, senkron üretilir.
- **Dönem listesi ucu.** Sezon modülüne aittir; bu modül yalnız tüketir.
- **Modül açık/kapalı kontrolü.** `marks` anahtarı seed'de var, handler'lar okumuyor.

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- **Kademe bazlı ölçek override'ı okunmuyor** — ölçek çözücü servisinin kod tabanında tüketicisi yok (sembol referansıyla doğrulandı). İlkokul 5'lik, lise 100'lük yöneten okulda her iki kademede de üst sınır 100. Servis bağlansın mı, override kaldırılsın mı? Defter: `TB-105`.
- **Modül anahtarı `marks`, rota ve izinler `grades`.** Sunucuda hiçbir modül için kapı yok; kapatılmış modül yine çalışır. Çapraz kesen: `X-20`.
- **Yazılı/performans ağırlıkları, sayıları ve yuvarlama kuralı politika ucunda dönüyor ama hiçbir hesaba girmiyor.** Karne için mi bekliyor? Defter: `TB-106`.
- Bildirimdeki kademe kapısı şubenin ilk öğrencisine bakıyor; karma kademeli şube yok varsayımı. Defter: `TB-107`.
- Harf ölçeği seçen okulun giriş yolu yok; üst sınır 100'e düşüyor. Defter: `TB-108`.
- Defter listesi, panolar ve aile yüzü sayfalanmadan dönüyor; okul geneli ölçek ölçülmedi.
- **"Bugün" sunucunun makinesinden okunuyor,** okulun takviminden değil: gecikme rozeti ve tarih etiketleri sunucu saatiyle hesaplanıyor. [[Ödevler]] aynı hesabı okul takvimi servisinden alıyor ve kodda bu farkı "Grades'te bilinen sapma" diye işaretlemiş. Defter: `TB-113`.
