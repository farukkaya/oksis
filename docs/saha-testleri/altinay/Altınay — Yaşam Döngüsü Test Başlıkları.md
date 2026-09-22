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
| B4.2 | Dersler ve Anadolu Lisesi haftalık ders saatleri — **❌ en ağır başlık.** Ders kataloğu global (`master.subjects`, 21 ders); lise müfredat şablonunda **Türk Dili ve Edebiyatı, Müzik ve Görsel Sanatlar YOK** (üçü de yalnız 1–8'e bağlı), şablonun her satırı kendini *"Doğrulanmadı — MEB çizelgesi bekleniyor"* diye işaretliyor. Okula özel saat override'ı 0 satır. Katalog ucu okulun kademesini yok sayıp **lisede ortaokul saatlerini** gösteriyor. **🔴 Üstelik ders ekleme/silme bütün okullara yansıyor** **2026-09-22 yeniden ölçüm (MEB kaynaklı katalog, okul `ALTINAY-AL` / görünen ad "Özel Altınay Anadolu Lisesi"):** program Anadolu Lisesi, TTK 2025/05 çizelgesi, kademe başına kilitli snapshot. Türk Dili ve Edebiyatı ve Görsel Sanatlar/Müzik artık çizelgede. Ortak saatler MEB'le birebir: 9'da 32, 10'da 33, 11'de 19, 12'de 15. "Doğrulanmadı" etiketi kalktı, satırlar kaynak belgeye bağlı. Ders kataloğu okulun kendi tablosunda (67 ders, çapraz tenant 0, `TB-191` kapalı). Katalog ucu lise kademesiyle süzüyor: 9 için 32 satır, 5 için boş (`TB-194` canlıda doğrulandı). **Yeni engel:** seçmeli havuzun tamamı zorunlu yük sayılıyor. `required-total` 57/65/91/86 dönüyor, olması gereken her kademede 39. Ders programı üreticisi aynı satırları okuyor, yani `B9.4` bu hâliyle üretilemez. Snapshot kilitli olduğu için okul düzeltemiyor (`TB-239`). Kozmetik: "Kur’An-I Kerim" (`TB-241`) | 🔄 | ~~`TB-191`~~ · ~~`TB-192`~~ · ~~`TB-194`~~ · **`TB-239`** · `TB-241` |
| B4.3 | Branş kataloğu — **❌ Altınay'da 0 satır.** Açılış akışı kademeleri tohumluyor ama **branşları tohumlamıyor**; seed okullarındaki 15 satır dev seeder'dan geliyor. Kadronun 13 branşı master katalogda var, **eksik olan tek branş Rehberlik**. İyi haber: branş tarafı doğru kurgulanmış (okula ait tablo + idempotent MEB içe aktarımı) → kullanıcı tek tek girmeyecek, "MEB branşlarını içe aktar" + Rehberlik'i elle ekle **2026-09-22 yeniden ölçüm:** Altınay'da **110 branş** var, hepsi aktif. Branşlar MEB öğretmenlik alanları kararından içe aktarıldı (`TB-237`/`TB-238` sonrası). Kadronun bütün branşları var: Kimya, TDE, İngilizce, Almanca, Matematik, Fizik, Biyoloji, Tarih, Coğrafya, DKAB, Beden Eğitimi, Müzik, Görsel Sanatlar, Felsefe, Bilişim ve **Rehberlik**. **Kalan kusur:** dört ortak ders branşsız: Birinci Yabancı Dil, Görsel Sanatlar/Müzik, İnkılap Tarihi, BES/GS/Müzik. İngilizce ve tarih ataması alan dışı sayılıp gerekçe isteyecek (`TB-240`). | ✅ | `TB-193` (açılışta tohum ayağı ölçülmedi) · `TB-240` |
| B4.4 | Not ölçeği ve sınav türleri — **ölçek seçilmemiş** (`default_grade_scale_id` NULL, hiçbir okulda kademe override'ı yok); sistem 100'lük varsayılana düşüyor, geçme 50. `TB-105` ve `TB-108` **hâlâ geçerli**: harf ölçeği ekranda seçilebilir ama not girişi harf kabul etmiyor. ~~**Sınav türleri global ve okul değiştiremiyor**~~ → **`TB-195` kapandı (2026-09-16):** katalog okul kapsamına taşındı (Altınay'da 8 tür) **ve** yönetim uçları + *Ayarlar › Akademik Yapı › Sınav Türü Kataloğu* sekmesi geldi; yabancı "3. Sınav" (VZ5) satırı artık yalnız Altınay'ın kopyası ve **ekrandan pasife alınarak** düşürülüyor (silmek değil — silinen çekirdek satırı bir sonraki "Çekirdekten Getir" geri getirir). **Kalan iş ölçek tarafında** | 🔄 | ~~`TB-195`~~ · `TB-105` · `TB-108` |

### B5 · Fiziksel yapı ve şubeler

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B5.1 | Dersliklerin tanımlanması — Altınay'da bugün **0 derslik**; şube açmak için derslik **şart değil** (ev dersliği alanı boş bırakılabilir) | ⬜ | |
| B5.2 | 9 şubenin açılması ve ev derslikleri — **ön koşul yok, bugün başlanabilir:** ders kataloğu, müfredat ve öğretmen hiçbiri denetlenmiyor. 2026-09-16 turunda iki denetim kusuru düzeltildi: şube açarken artık **okulun kendi kademe listesi** süzgeç (önce Anadolu Lisesi'nde "2-A" açılabiliyordu, `TB-196`) ve rehber öğretmen kontrolü gerçekten okulun öğretmenine bakıyor (önce sabit "var" diyordu, `TB-197`) | ⬜ | `TB-196` ✅ · `TB-197` ✅ |

### B6 · Kadro

| ID   | Başlık                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Durum | Bulgu                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------ |
| B6.1 | 14 öğretmenin girilmesi — Excel aktarımı ile tek tek giriş farkı (toplu aktarım yolu **var**). **2026-09-20:** kadro *Kullanıcılar › Kullanıcı Oluştur* ile tek tek tamamlandı (11 yeni davet; müdür, müdür yrd. ve bir sınıf öğretmeni zaten kayıtlıydı) → Öğretmenler ekranı **12**, Kullanıcılar **14**, bekleyen davet 0. Form dört alan istiyor (Ad, Soyad, E-posta, Rol); okul e-postaları `ad.soyad@altinay.test` biçiminde üretildi, iki kelimelik adlar/soyadlar noktayla ayrıldı **2026-09-23 yeniden kurulum (DB sıfırlandıktan sonra):** 13 öğretmen *Kullanıcılar › Kullanıcı Oluştur*'dan tek tek davet edildi, bağlantı ayrı oturumda açılıp kabul edildi (Playwright). E-posta `ad.soyad@altinay.test`, parola `Oksis1234!`. 13'ü de Aktif. Sicil numaraları backfill'le dağıtıldı (2026001–2026013, davet sırasıyla); üreteç bu dala yeni birleştirildi, bundan sonraki davetler sicille doğar.                                                                                                                                   | ✅     | `TB-242`                 |
| B6.2 | Ana ve yan branş (bir öğretmen iki dile giriyor) — **ön koşul:** Altınay'ın branş kataloğu **boş**; önce "MEB branşlarını içe aktar" çalıştırılmalı (15 satır tek işlemde), sonra **Rehberlik** elle eklenmeli — kadronun 13 branşından katalogda olmayan tek branş o **2026-09-23:** ana branş artık **davet kabulünde** soruluyor (aranabilir liste, kural sunucuda). 13 öğretmen doğru ana branşla doğdu. Üç öğretmenin yan branşları (Almanca, Rehberlik, Türkçe) sihirbazda sorulmuyor, profilden girilecek.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 🔄    | `TB-193` · `B-55`        |
| B6.3 | Öğretmen davetleri ve kabulleri — **davette branş zorunlu değil** ve kabulde de sorulmuyor; branşsız öğretmen sessizce girilebiliyor, duvar B9'da çıkıyor ("branşı olmayan öğretmene görevlendirme yapılamaz"). **2026-09-20 ekranda ölçüldü:** 11 davetin 11'i kabul edildi. Davet bağlantısı gönderim penceresinde kopyalanabilir hâlde veriliyor (Mailpit'e gitmeye gerek yok). Kabul üç adım — önizleme → **iki zorunlu onay** (KVKK + Kullanım Koşulları; `TB-170`'in ölü anahtarları gerçekten kalkmış) → parola. **Profil bağlanması otomatik ve doğru:** kabul edilen hesapla girişte tenant Altınay, profil `Teacher`, rol `TEACHER`, kenar çubuğu öğretmen menüsü; üç ayrı hesapla ölçüldü. Ama panonun gövdesi yöneticinin panosu (`B-54`) ve idari personelin bağlı profili listede "—" görünüyor (`D-23`). Öğretmenlerin 12'si de **"Branş eksik"** rozetiyle duruyor — B6.2 önkoşulu **2026-09-23:** yeni kurulumda 13 davet kabul edildi; branşsız öğretmen artık doğamıyor. Davet önizlemesi okulu resmî adla gösteriyor (`D-24`). | ✅     | `B-54` · `D-23` · `D-24` |
| B6.4 | Müdür yardımcısı hem öğretmen hem idareci — **yapı destekliyor, rol kataloğu desteklemiyor.** Kişi birden çok profil ve çoklu aktif rol taşıyabiliyor; ama ara rol yok: idari yetki vermek **okulun tamamına erişim** vermek demek                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ⬜     | `E-29`                   |
| B6.5 | Soyadı yer tutucu olan iki öğretmen; soyadın sonradan düzeltilmesi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | ⬜     |                          |

### B7 · Öğrenci kaydı

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B7.1 | 85 öğrencinin aktarımı — **risk:** TCKN, doğum tarihi, cinsiyet yok; zorunlu alanlar ne izin veriyor? **2026-09-23:** 85 öğrencinin 85'i *Öğrenciler › Yeni Öğrenci* sihirbazıyla tek tek kaydedildi (Playwright). İsteğe bağlı alanlar karışık dolduruldu ve hepsi doğru yazıldı: 42 TCKN, 53 doğum tarihi, 46 kayıtta 14 Eylül, 5 nakil gelen + geldiği okul. E-posta `ad.soyad@altinay.test` (aynı ad-soyadlı iki öğrencide ikincisine `.2` eki). Öğrenciler ilk girişte KVKK onayı + zorunlu parola değişimiyle `Oksis1234!` yaptı. Engeller aynı gün düzeltildi: nakil kaydı imkânsız (`B-56`), öğrenci e-postası yok (`B-57`), zorunlu parola ekranı yer tutucu (`B-61`), büyükanne ilişkisi 400 (`B-60`). Açık: nakil devamsızlığı yazılmıyor (`B-62`), ilk giriş KVKK metni (`D-25`), girişte yönetici panosu + 403 (`B-54`). | ✅ | `B-56` ✅ · `B-57` ✅ · `B-60` ✅ · `B-61` ✅ · `B-62` · `D-25` · `B-54` |
| B7.2 | Öğrenci numarası: e-Okul numarası girişi ile okulun monoton sıra kuralı çakışıyor mu? **2026-09-23 ölçüldü ve karara bağlandı:** öneksiz okulda elle numara ≥100 olmak zorunda, e-Okul numaralarının yarısı (1–99) girilemedi; ayrıca sayaç elle girilen numarayı atlamıyor. **Kullanıcı kararı:** numara her zaman otomatik, sihirbaz sormuyor. Altınay öğrencileri 100–184 aldı; e-Okul numarası OKSİS'te tutulmuyor. | ✅ | `V-04` |
| B7.3 | Şubelere atama **2026-09-23:** şube dağılımı rapora birebir uyuyor (9-A 7 · 9-B 8 · 10-A 7 · 10-B 12 · 11-A 11 · 11-B 13 · 12-A 8 · 12-B 9 · 12-C 10). Şube değiştiren öğrenci doğrudan 10/B'ye girildi. | ✅ | |
| B7.4 | Uç durumlar: aynı şubede aynı ad-soyad · Ğ ile başlayan ad · yatılı öğrenci (pansiyon alanı) · **büyük harf İ/I ile kayıtlı adın küçük harfle aranması** (DB kolonu `SQL_Latin1_General_CP1_CI_AS`: `N'Metin'` ≠ `METİN`, 2026-09-15 ölçüldü) **2026-09-23:** aynı şubedeki aynı ad-soyadlı iki öğrenci ayrı kişi, ayrı veli, ayrı hesap olarak doğdu ve listede ikisi de görünüyor. Ğ ile başlayan adın kaydı ve araması doğru. `ismail`, `İsmail`, `İSMAİL` aramaları adında "İsmail" geçen öğrenciyi buluyor (`ISMAIL` bulmuyor, Türkçe küçültmede beklenen davranış). Ad-soyad birlikte aranınca sonuç boş dönüyordu, düzeltildi (`B-59`). **Pansiyon alanı üründe yok** (`E-30`). | 🔄 | `B-59` ✅ · `E-30` |
| B7.5 | Kardeş öğrenciler (olası 6 aile) **2026-09-23:** altı kardeş ailesinin ikinci çocuğu sihirbazdaki veli aramasıyla mevcut velilere bağlandı. Kardeş kaydında ikinci davet üretilmiyor (doğru). Veli oturumunda iki çocuk da görünüyor (`me/available-contexts` ölçüldü). | ✅ | `B-59` ✅ |

### B8 · Veliler

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B8.1 | Veli kaydı ve veli–öğrenci bağı — veri yok, nasıl üretileceğine B7'den sonra karar **2026-09-23:** veriler üretildi: 135 veli, soyadı öğrencininkiyle aynı; bazı öğrencilere tek veli, bazılarına iki veli (anne, baba, anneanne, vasi); yetkiler ve birincil veli karışık. 147 ilişki. **Birincil veli seçimi sunucuya gitmiyor**: 33 öğrencide birincil iletişim 0 ya da 2 (`B-63`). | 🔄 | `B-63` · `B-60` ✅ |
| B8.2 | Veli daveti ve rızası **2026-09-23:** sihirbazla eklenen veliler **hiç davet alamıyordu** (Active doğuyor, davet üretici reddediyor), düzeltildi (`B-58`). Sonra 135 velinin 135'i Mailpit'teki e-postadaki bağlantıyla daveti kabul etti (rıza + `Oksis1234!`). Hepsi Active, hepsinin hesabı var; örneklemde giriş ve çocuk bağlamı doğru. | ✅ | `B-58` ✅ |

### B9 · Görevlendirme ve program

| ID | Başlık | Durum | Bulgu |
|---|---|---|---|
| B9.1 | Sınıf (rehber) öğretmenleri — 8 kişi, biri iki şubede | ⬜ | |
| B9.2 | Ders görevlendirmeleri (öğretmen × ders yetkinliği) **2026-09-23:** görevlendirmeleri kullanıcı yaptı: 13 öğretmen, 50 ders, 65 aktif görev, 15 ders atanmamış, 6 alan-dışı (üç öğretmende: 4 + 1 + 1 — ad eşleşmesi kaynaklı, `TB-240`, kullanıcı kararıyla ertelendi). Genel kontrol: sayaçlar tutarlı; varsayılan eksen *Öğretmenlere göre* yapıldı ve seçicide sola alındı. Bulgular: hiçbir ders seçmeli değil (`B-64`), kopyalama kaynağı (`B-65`), görevi kapat onaysız (`D-26`), çekmece hatada kapanıyor (`D-27`), arşivde gezinme menüsü gizli (`D-28`). | 🔄 | `TB-240` · ~~`B-64`~~ ✅ · `B-65` · `D-26` · `D-27` · `D-28` · `D-29` |
| B9.3 | Öğretmen müsaitlikleri | ⬜ | |
| B9.4 | Ders programının oluşturulması (otomatik ve elle), çakışma denetimi **2026-09-23 ölçüm (9-A, uygulanmadan):** üretim çalışıyor (`Done`, 3 aday) ama program kullanılamaz: seçmeli havuzun tamamı zorunlu sayıldığı için (57 saat talep, haftada 40 saat) seçmelilerden 15 saat yerleşiyor, ortak derslerden 7 saat dışarıda kalıyor. **Engel `TB-239` — karar bekliyor.** Öğretmensiz dersler talepten sessizce düşüyor, gösterge "eksik 5" diyor, gerçek 17 (`B-66`). Veri tarafı: 9. sınıfta 9 dersin (12 saat) görevlendirmesi yok, biri ortak (Görsel Sanatlar/Müzik). | ⏸️ | **`TB-239`** · `B-66` |
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
