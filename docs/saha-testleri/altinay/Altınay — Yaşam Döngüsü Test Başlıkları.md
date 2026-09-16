---
tags: [saha-testi, altinay]
---

# Altınay Anadolu Lisesi — Yaşam Döngüsü Test Başlıkları

**Hazırlandı:** 15 Eylül 2026 · oksis-api `60e65caf` (K-27 ilk dilim: platformdan okul açılışı)
**Amaç:** Gerçek bir okulun OKSİS'i sıfırdan teslim aldığı gün yaşadığını ve ardından bir sezonu
ürün ekranlarından yaşatmak. Hazır seed sınıf veya kullanıcı **kullanılmaz**.
**Zaman:** Gerçek takvimle paralel; okul açılışı 14 Eylül 2026.
**Roller:** Yalnız kullanıcı + Claude.
**Eksik çıkınca:** Bulgu Kayıt Defteri'ne yaz → ürünü düzelt → devam.

> **Kişisel veri:** Bu depo public'tir. Öğrenci ve öğretmen adları bu belgeye **yazılmaz**.
> Kaynak liste yerel ve git dışıdır: `raporlar/OKSİS — Altınay Anadolu Lisesi Sınıf ve Şube
> Listesi Raporu.md`. Buradaki uç durumlar rapordaki satırlara göre adsız anılır.

## Kaynak veri özeti

| Kalem | Değer |
|---|---|
| Okul türü | Anadolu Lisesi, alan yok |
| Kademeler | 9, 10, 11, 12 |
| Şubeler | 9 — 9/A-B, 10/A-B, 11/A-B, 12/A-B-C |
| Öğrenci | 85 (kademe: 15 · 19 · 24 · 27) |
| Kadro | 14 kişi — müdür, müdür yardımcısı (aynı zamanda öğretmen), 12 branş öğretmeni |
| Eksik | TCKN, doğum tarihi, iletişim, veli bilgisi; aktarım şablonunda cinsiyet sütunu yok |

## Resmî çalışma takvimi 2026–2027

Kaynak: MEB 2026/68 sayılı genelge (13 Haziran 2026) ve İstanbul Valiliği 2026–2027 Çalışma Takvimi (PDF,
güncelleme 31.07.2026). İki kaynak dönem ve tatil tarihlerinde birebir aynı.

### Sezon sihirbazına girilecekler (B3)

| Alan | Tarih |
|---|---|
| Sezon başlangıcı · 1. dönem başlangıcı | **14 Eylül 2026 Pazartesi** |
| 1. dönem sonu | **22 Ocak 2027 Cuma** |
| Yarıyıl tatili | **25 Ocak 2027 Pazartesi – 5 Şubat 2027 Cuma** |
| 2. dönem başlangıcı | **8 Şubat 2027 Pazartesi** |
| Ders yılı sonu · 2. dönem sonu | **25 Haziran 2027 Cuma** |

### Tatil takvimine girilecekler

| Olay | Tarih | OKSİS'te nereden |
|---|---|---|
| 1. dönem ara tatili | 16–20 Kasım 2026 | Girilemiyor (`E-26`) |
| 2. dönem ara tatili | 8–12 Mart 2027 | Girilemiyor (`E-26`) |
| Cumhuriyet Bayramı | 29 Ekim 2026 Perşembe | Resmî katalog |
| Yılbaşı | 1 Ocak 2027 Cuma | Resmî katalog |
| Ramazan Bayramı | 8 Mart 2027 (arife) – 11 Mart 2027 | Resmî katalog: arife 8 Mart yarım gün, bayram 9–11 Mart — takvimle uyumlu. 2. ara tatille çakışıyor |
| 23 Nisan | 23 Nisan 2027 Cuma | Resmî katalog |
| 1 Mayıs | 1 Mayıs 2027 Cumartesi | Resmî katalog (hafta sonu) |
| Kurban Bayramı | 15 Mayıs 2027 (arife) – 19 Mayıs 2027 | Resmî katalog: arife 15 Mayıs, bayram 16–19 Mayıs — takvimle uyumlu |
| 19 Mayıs | 19 Mayıs 2027 Çarşamba | Resmî katalog (Kurban Bayramı'nın son günüyle aynı) |

### Tatil olmayan ama takvimde olan günler (C evresinde etkinlik/duyuru adayı)

| Olay | Tarih |
|---|---|
| Öğretmenlerin mesleki çalışması (yıl başı) | 1–11 Eylül 2026 |
| İstanbul'un Kurtuluşu (kutlama) | 6 Ekim 2026 Salı |
| Atatürk Haftası | 10–15 Kasım 2026 |
| Öğretmenler Günü | 24 Kasım 2026 Salı |
| Öğretmenlerin yılsonu mesleki çalışması | 28–30 Haziran 2027 |
| Öğretmenlerin tatile girmesi | 1 Temmuz 2027 |

> Ölçüm notu: İstanbul PDF'inin metin katmanı sütunları karıştırıyor. Yukarıdaki satırlar faaliyet adı ile
> tarihin açıkça eşleştiği satırlardır. Ortaöğretim sorumluluk sınavı aralıkları (Eylül başı, Şubat başı,
> Haziran) PDF'te var ama satır–tarih eşlemesi kesin değil; tabloya alınmadı. Takvimde ayrı bir **karne
> dağıtım** satırı yok.

## Durum işaretleri

⬜ başlanmadı · 🔄 sürüyor · ✅ geçti · ❌ bulgu açtı (Bulgu sütununda ID) · ⏸️ bekliyor

Her başlıkta ortak denetim eksenleri:
- Kural ekranda değil sunucuda mı uygulanıyor?
- Rol ve izin sınırları
- Tenant yalıtımı
- Web ve mobil görünüm
- Bildirimin doğru kişiye gitmesi

---

## B · Açılış — okul derse hazır olana kadar

### B1 · Platformdan okul açılışı

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B1.1 | Platform hesabıyla giriş; okulun açılması (ad, kod, Anadolu Lisesi, kademeler 9–12) | ✅ | `TB-171` (görünen ad/yetkili boş) |
| B1.2 | Okul kodu tekilliği; okulun platform listesinde görünmesi — `altinay-al` 409, satır yazılmadı; boşluklu kod 400 (biçim); okul listede `Setup` durumunda | ✅ | `TB-172` (DB'de tekil indeks yok) |
| B1.3 | Müdüre davet e-postası → kabul → KVKK rızası → ilk giriş | ✅ | `TB-170` (anahtarlar kaldırıldı, merge bekliyor) |
| B1.4 | Platform hesabının okulun iç verisini görmediğinin denetimi — API'de iki yönlü ölçüldü (2026-09-15): platform token'ı okul uçlarında 403 `TenantRequired` (`school-settings`, `users`, `academic-sessions`, `announcements`); okul token'ı platform uçlarında 403, okul açma denemesi satır yazmadı; platform listesi yalnız ad/kod/tür/durum/davet taşıyor | ✅ | |

### B2 · Kurum ayarları

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B2.1 | Okul bilgileri ve ayarlar — görünen ad ve kurum yetkilisi boş geliyor. **2026-09-16 gece turu:** `K-28 (a)` için uygulama planı çıkarıldı (`oksis/docs/gecici/planlar/2026-09-16-kurum-yetkilisi-k28.md`); planın ilk iki adımı uygulandı: **okul kodu artık DB'de tekil** (`TB-172` kapandı; kolon `nvarchar(max)` olduğu için önce daraltılması gerekti, yarış kolu 409'a eşlendi) ve **görünen ad okul adından tohumlanıyor** (backfill NULL satırları doldurdu; Altınay'ınki zaten doluymuş, "—" rozeti kurulumun ilk anına aitmiş). Yetkiliyi platformun sorması ve düzenlemesi **sözleşme değiştirdiği için kullanıcı kararına bırakıldı** | 🔄 | `TB-171` · `TB-165` · `TB-172` |
| B2.2 | Modül ve bildirim yapılandırması — koddan/DB'den ölçüldü: modül anahtarı ne menüyü ne ucu etkiliyor; bildirim ana ayar satırı yok (e-posta/push kapalı, in-app açık). Ekran testi (2026-09-15 19:21 UTC): müdür sekmeyi kaydetti → ana ayar satırı `is_enabled=0`, e-posta/push/SMS 0 yaratıldı (ekranda bu anahtarlar yok, echo `false`) → **Altınay tamamen bildirimsiz**, geri açacak kontrol yok. Sessiz saat 21:00–07:30 kaydedildi. Teslimat testi C1.5'ten önce bu düzelmeli. **2026-09-16 gece turu: `TB-175` + `TB-125` kapandı ve canlı doğrulandı** — ana anahtar gerçek anahtar oldu, uygulama içi kanal dış kanallara bakmıyor, okul açılışında varsayılan satır tohumlanıyor, göçün backfill'i **Altınay'ın satırını `1/1/1/0/1` yaptı**; "Kaydet" artık okulu susturmuyor (seed okulda PUT→GET ile ölçüldü). `X-20` (modül kapısı) hâlâ açık | 🔄 | `X-20` · `TB-175` ✅ · `TB-125` ✅ |
| B2.3 | Zil çizelgesi — Tam Gün elle kuruldu (15 satır), gün atamaları kaydedildi; Yarım Gün kaydı 500. **2026-09-16 gece turu:** `TB-174` (indeks + 7 tüketici + ordinal eşleme), `D-19` (paylaşılan `Dialog`/`ConfirmDialog`, Enter akışı, buton metni) ve `B-51` (satır tipi seçici) kodda düzeltildi, seed okulda HalfDay kaydı 204 döndü. Altınay'ın kendi ekranında ölçüm ve Cuma çizelgesinin girilmesi kullanıcıya kaldı | 🔄 | `TB-174` ✅kod · `D-19` ✅kod · `B-51` ✅kod · `E-25` (Cuma programı kararı, açık) |
| B2.4 | Resmî tatiller ve okul tatilleri — sezonsuz okulda liste boş; eklenen deneme tatili (`432b4adc-…`, 2–3 Kasım, sezonsuz) görünmüyor; seed okulda dini bayramlar 5×; ara tatil girilemiyor. **Deneme satırı B3'te görünürlük için tutuldu, C1'den önce silinecek**. **2026-09-16 gece turu:** `D-20`'nin ekran ayağı kodda düzeltildi (rozet sezon durumundan, boş durum standardı, pencere formlarında `D-09` kuralı merkezîleşti, toplam gün sayacı testli); sunucu ayağı da kapandı: `TB-176` (tatil artık **tarihinden** sezona bağlanıyor, sezonsuz satır üretilmiyor, okuyucu sezonsuzları saymıyor, göçle eskiler toplandı) ve `TB-177` (ayar listesi yoklamanın çözücüsünü kullanıyor; seed okulda resmî kayıt **25 → 9**, Ramazan 8–11 Mart, Kurban 15–19 Mayıs, arifeler yarım gün). **Deneme tatili `432b4adc-…` silindi → C1 engeli kalktı.** Altınay ekranında sayaçların teyidi kullanıcıya kaldı | 🔄 | `TB-176` ✅ · `TB-177` ✅ · `D-20` ✅ekran · `E-26` (karar, açık) |

### B3 · Sezonun kurulması

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B3.0 | Sezonsuz ilk görünüm: pano kartları + topbar sezon seçicisi + mobil başlık (11 kart envanteri çıkarıldı) | ⏸️ | `TB-168`, `TB-173` — ortak sezonsuzluk kararı bekliyor |
| B3.1 | 2026–2027 sezonunun açılması; başlangıç 14 Eylül, yani **geçmiş tarih** — ilk denemede sihirbaz kaynak sezonsuz taslağı kaydedemedi (400). 2026-09-16: engel düzeltildi (merge bekliyor), müdür kaynak sezonsuz sihirbazla sezonu açtı → `2026-2027` `Setup`, 14.09.2026–25.06.2027; geçmiş başlangıç tarihi engel olmadı | ✅ | **`ENG-03`** · `TB-178` · `D-22` · `E-27` |
| B3.2 | Dönemler (1. ve 2. dönem) — 14.09.2026–22.01.2027 ve 08.02.2027–25.06.2027 `NotStarted`; yarıyıl 25.01–05.02.2027 `SemesterBreak`; ara tatiller 16–20.11.2026 ve 08–12.03.2027 `IntermediateBreak`, hepsi sezona bağlı | ✅ | `TB-178` (düzeltildi) |
| B3.3 | "Sezonu Aç" materyalizasyonu ve "Aktifleştir" adımı (0006) — "Sezonu Aç" ✅ (sezon + dönemler + tatiller, taslak sezona bağlı, şube/kayıt 0). "Aktifleştir" ✅ (2026-09-16 00:52): `Active`/`is_current=1`, taslak silindi, önbellek yenilendi, topbar "2026-2027 · 1. Dönem", pano hatasız; **ama dönemler `NotStarted`** → müdür 1. dönemi Sezon Yönetimi'nden etkinleştirmeli (`TB-179`). Koddan ölçülen sıra kısıtları (2026-09-16): aktivasyonun ön koşulu yok (yalnız `Setup` → `Active`; ilk sezonda arşiv onayı istenmez); **öğrenci kaydı `Active` sezon ister** (`EnrollStudent:73`) → B7 aktivasyondan önce yapılamaz; şube oluşturma sezon durumuna bakmaz; öğretmen daveti sezonun yalnız var olmasını ister (`SeasonScopeRule`). Pano/topbar/yoklama `Active` (`IsCurrent`) sezonu okur | 🔄 | `TB-176` (deneme tatili sezon açılınca da sezonsuz) |

### B4 · Müfredat katalogları

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B4.1 | Kademelerin doğrulanması (9–12) — **✅ sorun yok:** tam 4 kademe (9, 10, 11, 12), hepsi aktif, fazlası eksiği yok; açılış akışı okul türünden doğru tohumlamış. Ama şube açarken okulun bu listesi **süzgeç olarak kullanılmıyor** (`TB-196`) | ✅ | `TB-196` |
| B4.2 | Dersler ve Anadolu Lisesi haftalık ders saatleri — **❌ en ağır başlık.** Ders kataloğu global (`master.subjects`, 21 ders); lise müfredat şablonunda **Türk Dili ve Edebiyatı, Müzik ve Görsel Sanatlar YOK** (üçü de yalnız 1–8'e bağlı), şablonun her satırı kendini *"Doğrulanmadı — MEB çizelgesi bekleniyor"* diye işaretliyor. Okula özel saat override'ı 0 satır. Katalog ucu okulun kademesini yok sayıp **lisede ortaokul saatlerini** gösteriyor. **🔴 Üstelik ders ekleme/silme bütün okullara yansıyor** | ❌ | **`TB-191` 🔴** · `TB-192` · `TB-194` |
| B4.3 | Branş kataloğu — **❌ Altınay'da 0 satır.** Açılış akışı kademeleri tohumluyor ama **branşları tohumlamıyor**; seed okullarındaki 15 satır dev seeder'dan geliyor. Kadronun 13 branşı master katalogda var, **eksik olan tek branş Rehberlik**. İyi haber: branş tarafı doğru kurgulanmış (okula ait tablo + idempotent MEB içe aktarımı) → kullanıcı tek tek girmeyecek, "MEB branşlarını içe aktar" + Rehberlik'i elle ekle | ❌ | `TB-193` |
| B4.4 | Not ölçeği ve sınav türleri — **ölçek seçilmemiş** (`default_grade_scale_id` NULL, hiçbir okulda kademe override'ı yok); sistem 100'lük varsayılana düşüyor, geçme 50. `TB-105` ve `TB-108` **hâlâ geçerli**: harf ölçeği ekranda seçilebilir ama not girişi harf kabul etmiyor. **Sınav türleri global ve okul değiştiremiyor** — başka bir okul için elle eklenen "3. Sınav" bugün Altınay'da da duruyor | 🔄 | `TB-195` · `TB-105` · `TB-108` |

### B5 · Fiziksel yapı ve şubeler

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B5.1 | Dersliklerin tanımlanması | ⬜ | |
| B5.2 | 9 şubenin açılması ve ev derslikleri | ⬜ | |

### B6 · Kadro

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B6.1 | 14 öğretmenin girilmesi — Excel aktarımı ile tek tek giriş farkı | ⬜ | |
| B6.2 | Ana ve yan branş (bir öğretmen iki dile giriyor) | ⬜ | |
| B6.3 | Öğretmen davetleri ve kabulleri | ⬜ | |
| B6.4 | Müdür yardımcısı hem öğretmen hem idareci — ayrı rol yok, ürün nasıl karşılıyor? | ⬜ | |
| B6.5 | Soyadı yer tutucu olan iki öğretmen; soyadın sonradan düzeltilmesi | ⬜ | |

### B7 · Öğrenci kaydı

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B7.1 | 85 öğrencinin aktarımı — **risk:** TCKN, doğum tarihi, cinsiyet yok; zorunlu alanlar ne izin veriyor? | ⬜ | |
| B7.2 | Öğrenci numarası: e-Okul numarası girişi ile okulun monoton sıra kuralı çakışıyor mu? | ⬜ | |
| B7.3 | Şubelere atama | ⬜ | |
| B7.4 | Uç durumlar: aynı şubede aynı ad-soyad · Ğ ile başlayan ad · yatılı öğrenci (pansiyon alanı) · **büyük harf İ/I ile kayıtlı adın küçük harfle aranması** (DB kolonu `SQL_Latin1_General_CP1_CI_AS`: `N'Metin'` ≠ `METİN`, 2026-09-15 ölçüldü) | ⬜ | |
| B7.5 | Kardeş öğrenciler (olası 6 aile) | ⬜ | |

### B8 · Veliler

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B8.1 | Veli kaydı ve veli–öğrenci bağı — veri yok, nasıl üretileceğine B7'den sonra karar | ⏸️ | |
| B8.2 | Veli daveti ve rızası | ⬜ | |

### B9 · Görevlendirme ve program

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B9.1 | Sınıf (rehber) öğretmenleri — 8 kişi, biri iki şubede | ⬜ | |
| B9.2 | Ders görevlendirmeleri (öğretmen × ders yetkinliği) | ⬜ | |
| B9.3 | Öğretmen müsaitlikleri | ⬜ | |
| B9.4 | Ders programının oluşturulması (otomatik ve elle), çakışma denetimi | ⬜ | |
| B9.5 | Programın yayını; öğretmen ve öğrencinin kendi programını görmesi | ⬜ | |

### B10 · Açılış kapısı

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B10.1 | "Okul derse hazır" denetimi — ilk yoklama oturumu açılıyor mu? | ⬜ | |
| B10.2 | Rol bazında gezinti: müdür, öğretmen, öğrenci, veli ne görüyor? | ⬜ | |
| B10.3 | Tenant yalıtımı: Altınay ↔ PLT-DOGRULAMA ↔ seed okulları arasında sızıntı yok | ⬜ | |

---

## C · Sezon yaşam döngüsü — gerçek takvimle paralel

> Aşağıdaki aylar yaklaşıktır; test başlamadan MEB 2026–2027 çalışma takviminden teyit edilir.

### C1 · İlk haftalar (Eylül)

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| C1.1 | Günlük yoklama, geç kalma, mazeret | ⬜ | |
| C1.2 | Program istisnaları: vekâlet, iptal, derslik değişikliği | ⬜ | |
| C1.3 | Programın sezon içi revizyonu ve yeni sürüm | ⬜ | |
| C1.4 | İlk duyurular: okul geneli, şube, veli hedefli | ⬜ | |
| C1.5 | Bildirimler (uygulama içi, e-posta, push) ve sessiz saat | ⬜ | |

### C2 · Okul düzeni (Eylül–Ekim)

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| C2.1 | Nöbet bölgeleri, çizelge, muafiyetler | ⬜ | |
| C2.2 | Kulüplerin kurulması, danışman ataması, öğrenci başvuruları | ⬜ | |
| C2.3 | Ödevler: yayın, teslim, takip, gece işleri | ⬜ | |

### C3 · Kayıt hareketleri (sezon boyu)

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| C3.1 | Şube değişikliği — 10/A → 10/B gerçek nakli burada mı yapılacak, B7'de karar | ⬜ | |
| C3.2 | Okula nakil gelen ve giden öğrenci | ⬜ | |
| C3.3 | Kayıt dondurma ve ayrılma | ⬜ | |
| C3.4 | Öğretmenin ayrılması / yeni öğretmen gelmesi (0016) | ⬜ | |

### C4 · Törenler ve tatiller

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| C4.1 | 29 Ekim ve 10 Kasım — etkinlik yoklaması | ⬜ | |
| C4.2 | Kasım ara tatili — yoklama ve ödev tarihlerine etkisi | ⬜ | |

### C5 · 1. dönem sınavları ve notlar

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| C5.1 | Sınav penceresi, sınav takvimi, kelebek düzeni | ⬜ | |
| C5.2 | Not girişi, yayın, kilit, düzeltme talebi | ⬜ | |
| C5.3 | Veli ve öğrencinin notu görmesi | ⬜ | |

### C6 · Dönem sonu (Ocak)

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| C6.1 | Devamsızlık özeti ve eşikler | ⬜ | |
| C6.2 | Dönem kapanışı — karne / dönem sonu çıktısı üründe var mı? | ⬜ | |
| C6.3 | Yarıyıl tatili ve 2. döneme geçiş | ⬜ | |

### C7 · 2. dönem (Şubat–Haziran)

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| C7.1 | 2. dönem programı ve görevlendirme değişiklikleri | ⬜ | |
| C7.2 | Nisan ara tatili | ⬜ | |
| C7.3 | 2. dönem sınavları ve notları | ⬜ | |

### C8 · Sezon kapanışı

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| C8.1 | 12. sınıfların mezuniyeti (27 öğrenci) | ⬜ | |
| C8.2 | Sezonun kapanması ve arşivlenmesi | ⬜ | |
| C8.3 | 2027–2028'e devir: terfi, görevlendirme kopyası, müdürün sezonsuz atamasının sürmesi (0020) | ⬜ | |

---

## Açılıştaki riskler

1. **Gecikme:** Okul 14 Eylül'de açıldı; B'nin olabildiğince hızlı bitmesi gerekiyor.
2. **Eksik öğrenci verisi:** TCKN, doğum tarihi ve cinsiyet yokluğu B7'de akışı tıkayabilir.
