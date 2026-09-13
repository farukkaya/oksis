---
aliases: [SchoolSettings, Kurum Bilgileri, Akademik Politika]
tags: [domain/platform]
table: school.school_settings
status: active
last-synced: 2026-09-13 (294ffe6)
---

# Okul Ayarları

<!-- generated:start -->

## Nedir

[[Okul]] başına **tek** bir kayıt; kurumun kimliğini ve okulun kendi kurallarını taşır. Okul kaydı "bu tenant kim" sorusunu, bu kayıt "bu okul nasıl çalışır" sorusunu cevaplar.

Haritadaki önemi şudur: **başka modüllerin davranışını buradaki alanlar belirler.** Devamsızlık eşiği, yoklama düzeltme penceresi, nöbet politikası, duyuru moderasyonu — hepsi bu kayıttan okunur. Bir modülün "neden böyle davrandı" sorusunun cevabı çoğu zaman burasıdır.

## Yaşam döngüsü

Okul oluşturulduğunda varsayılan değerlerle otomatik açılır ve hiç silinmez. Alanlar bölüm bölüm, ayrı yetkilerle güncellenir.

## Ne taşır

**Kurum kimliği** — resmî ad, MEB kurum kodu, görünen ad, mülkiyet türü (özel/devlet/vakıf), kuruluş yılı, kurum yetkilisi. Yetkili bilgisini yalnız süper admin düzenler.

**İletişim ve adres** — telefon, e-posta, web sitesi, fiziksel adres.

**Tema** — logo ve favicon. **Marka renkleri 2026-06-24'te kaldırıldı** (K2); okul artık kendi renklerini tutmaz. Giriş öncesi ekranları besleyen anonim marka ucu yalnız okul adı ve logoyu verir; yanıttaki renk alanları mevcut istemciler kırılmasın diye sabit platform değeriyle doldurulur. Logonun **tek gerçek kaynağı** [[Saklı Dosya]] referansıdır; temadaki serbest logo bağlantısı geriye dönük uyum için duruyor ama yükleme/silme akışı ona dokunmaz.

**Akademik yapı** — okulun çalıştığı türler (bir okul aynı anda ortaokul + lise olabilir), eğitim dili, haftalık ders günleri, öğrenci numarası ön eki ve uzunluğu, mezun verisi saklama süresi.

**Akademik politika** — varsayılan [[Not Ölçeği]] ve geçme notu, yuvarlama kuralı, yazılı/performans sayısı ve ağırlıkları, teşekkür/takdir eşikleri, devamsızlık sınırları. *(Ölçek ve sınav türü kataloğu [[Müfredat]]'ta; buradaki alanlar seçim ve okul politikasıdır.)* Politika **okul geneli tek kayıttır, sezona bağlı değildir**. Devamsızlık eşiklerinin tek yeri burasıdır; [[Bildirim Yapılandırması]]'ndaki eşik alanları 2026-08-12'de kaldırıldı.

**Modül politikaları** — nöbet yancılığı, haftalık nöbet sıklığı ve gün deseni; duyuru moderasyon kipi; yoklama düzeltme penceresi (saat), geç kalma birikimi ve yarım gün eşiği.

**Not politikası** — kademe bazlı **öğrenci görünürlüğü** (ilkokul, ortaokul, lise için ayrı; "gizli" ya da "veliyle aynı anda"; ilkokulda varsayılan gizli — veli her hâlde görür, ayar yalnız öğrenci yüzünü kapatır), aileye **sınıf ortalaması** gösterilsin mi (varsayılan hayır), **not düzeltme penceresi** (saat; varsayılan 48 — pencere kapandıktan sonra düzeltme yalnız yönetime açılır). Bu üç alan not modülünün yönetme izniyle okul ayarları altından güncellenir; akademik politikadaki ölçek, geçme notu ve ağırlıklarla birlikte [[Notlar]]'ın politika ucundan okuma izniyle herkese verilir.

**Ödev politikası** — **son teslim hatırlatma saati** (0–72; sıfır "hatırlatma yok" demektir, "teslim anında hatırlat" değil; varsayılan 24), **eksik ödev bildirim kipi** (kapalı / günlük özet / anlık; varsayılan günlük özet; sayıları 1'den başlar ki "hiç kaydedilmedi" ile "bilerek kapatıldı" ayrılsın) ve **günlük yoğunluk eşiği** (varsayılan 3; idare panosunda bir şubenin bir gündeki ödev sayısı eşiği aşınca vurgulanır). Ekranda beş kontrol vardır, kolon üçtür: "hatırlatma açık" ve "veli bildirimi açık" anahtarları bu alanlardan türer, kalıcılaştırılmaz. Ödev modülünün yönetme izniyle okul ayarları altından güncellenir.

## Okulun sunduğu kademeler

Hangi sınıf kademelerinin ([[Sınıf Seviyesi]]) okulda fiilen çalıştığı ayrı satırlarda tutulur.

**Okul oluşturulurken liste okul türünden türetilir** — MEB kademe düzeni: anaokulu → AN, ilkokul → 1–4, ortaokul → 5–8, lise → 9–12 (ortaokul türü 5–8'in hepsini açar). Sonraki güncellemede türetim zorlanmaz; yönetici listeyi serbestçe işaretler, tür bilgisi listeyi sınırlamaz.

Liste görevlendirmenin ders havuzunda ve sezon geçişi / terfi hesaplarında okunur. **Şube açarken sunucu bu listeye bakmaz** — yalnız kademenin master'da var olduğunu doğrular; kademe süzgeci orada yalnız arayüzdedir. Ders kataloğu sorguları da bu listeyle süzülmez.

**En az bir aktif kademe kalmalıdır**; toplu güncellemede son kademeyi kapatma denemesi reddedilir.

Ayrıca kademe bazında **not ölçeği override'ı** verilebilir: okul ilkokulu 5'lik, liseyi 100'lük ölçekle yönetebilir. Override yoksa varsayılan geçme notuna düşülür.

## Öğrenci numarası ön eki onayı

Ön ek yeni bir değere ayarlandığında idarecinin onayı **değişmez bir kanıt satırı** olarak yazılır: onaylayan, an, onaylanan metnin tam kopyası ve sürümü. Kayıt yalnız eklenir, hiç değiştirilmez — ön ek değişikliği üretilmiş numaraları etkilediği için geriye dönük sorumluluk izi gerekir.

## Kurallar

- Okul başına tam olarak bir ayar kaydı vardır.
- En az bir aktif sınıf kademesi bulunmalıdır.
- Mezun verisi saklama süresi 1-30 yıl aralığındadır; varsayılan 5 yıldır (KVKK'daki yasal saklama süresine eşitlendi).
- **Akademik politika değişmezleri** (INV-POL-1..3):
  - toplam devamsızlık sınırı > özürsüz devamsızlık sınırı > uyarı eşiği; üçü de en az 1;
  - takdir eşiği > teşekkür eşiği; ikisi de 1–100;
  - yazılı ve performans ağırlıklarının her biri 1–99 ve toplamları tam 100;
  - yazılı ve performans görevi sayısı 1–3.
- Geçme notu, seçili ölçek sayısal sınır taşıyorsa o aralığın içinde olmalıdır (INV-POL-4); sınırı olmayan (harf) ölçekte aralık denetimi yapılmaz.
- Zaman dilimi burada tutulmaz; tek kaynak [[Okul]] kaydıdır (TB-36).
- Kademe bazlı ölçek override'ında (okul, kademe) çifti tekildir.
- Ön ek onayı append-only'dir; hiçbir güncelleme yolu yoktur.
- Yetki alan bazında ayrılmıştır: temel bilgi, iletişim, adres, yetkili, tema, akademik yapı, akademik politika, zil, tatil, modül, bildirim ve logo için ayrı izinler vardır. Akademik yapı ile akademik politika ayrı izinlerdir; ders ve branş kataloğunun yazımı da akademik yapı iznini kullanır.

## İlişkiler

- [[Okul]] — bire bir; ayarların sahibi tenant
- [[Sınıf Seviyesi]] — okulun sunduğu kademeler ve ölçek override'ları
- [[Zil Çizelgesi]] — günlük zaman düzeni; ayrı kayıtlarda ama aynı ekranda yönetilir
- [[Okul Tatili]] — okul takvimi
- [[Modül Yapılandırması]] / [[Bildirim Yapılandırması]] — ayrı kayıtlar, aynı ayar yüzeyi
- [[Devamsızlık Özeti]] — eşik ve gün-eşdeğerliği parametrelerini buradan alır
- [[Yoklama Oturumu]] — düzeltme penceresi buradan gelir
- [[Nöbetler]] — yancılık, sıklık ve gün deseni buradan gelir
- [[Duyurular]] — moderasyon kipi buradan gelir
- [[Şube]] — şube kurulumunda onay isteyip istememe ayarı buradan okunur
- [[Öğrenci Numarası]] — ön ek, hane sayısı ve ön ek değişikliği onayı burada tutulur
- [[Değerlendirme]] / [[Not]] — düzeltme penceresi, öğrenci görünürlüğü, sınıf ortalaması ve ölçek üst sınırı buradan gelir
- [[Ödev Takibi]] — hatırlatma saati ve eksik ödev bildirim kipi buradan gelir; [[Ödev]] yoğunluk eşiğini panoda kullanır

## Geçtiği modüller

- [[Okul Yönetimi]] — kavramın sahibi
- [[Yoklama ve Devamsızlık]], [[Nöbetler]], [[Duyurular]], [[Sınıflar ve Şubeler]], [[Notlar]], [[Ödevler]] — politika tüketicileri

<!-- generated:end -->

## Notlar

<El yazısı alan.>

## Açık Sorular

- ~~Not ölçeği ve sınav ağırlıkları tanımlı ama not modülü henüz haritalanmadı.~~ Haritalandı: varsayılan ölçek okunuyor (üst sınır), kademe override'ı okunmuyor; yazılı/performans ağırlıkları politika ucunda dönüyor ama hiçbir hesaba girmiyor; yazılı/performans **sayısı** ve yuvarlama kuralı da tüketicisiz. Bkz. [[Notlar]].
- Kademe listesi okul türünden yalnız oluşturmada türetiliyor; türün sonradan değişmesi listeyi etkilemiyor. Tür yalnız bilgi amaçlı mı kalacak, yoksa kademe listesini sınırlamalı mı?
- Akademik yapı ile politika izinlerinin ayrılma gerekçesi — yapı müdür yardımcısına devredilebilir, geçme notu müdürde kalır — rol dağılımına yansımış mı? Beş rollü MVP setinde bu ayrımı taşıyacak ikinci bir idari rol görünmüyor.
- Politika sezondan bağımsız tek kayıt; değiştiğinde geçmiş sezonun hangi politikayla yürüdüğü saklanmıyor. Geçmiş sezon için yeniden hesap gerekirse hangi değer kullanılacak?
- Karne otomatik yayın ayarı yazılıyor ve okunuyor ama hiçbir davranışa bağlı değil; tüketicisi yok.
- Mezun verisi saklama süresi dolduğunda veriyi silen bir iş yok; süre bugün yalnız kayıtlı bir değer.
