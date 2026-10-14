# OKSİS — Yeni Özellik Araştırması (REQ-034)

> **Tarih:** 2026-10-15 · **Hazırlayan:** Ürün ekibi (lider + eğitim alan uzmanı, yazılım mimarı, paydaş paneli ajanları) · **Durum:** araştırma raporu; hiçbir karar kilitlenmedi, kararlar Faruk'undur.
> **Konular:** (1) Yemek menüsü · (2) Servis (okul servis aracı) bilgileri · (3) Ödemeler · (4) Deneme sınavı analizleri · (5) Velinin öğretmenden görüşme talebi · (6) Mesajlar.
> **Yöntem:** Mevzuat ve rakip taraması (web, erişim 2026-10-15), `oksis-api` ve `oksis-ui` üzerinde statik kod okuma (kod çalıştırılmadı), belge merkezi okuması, persona simülasyonu. Mevcut belgelerde değişiklik yapılmadı.

## 0. Nasıl okunur

- **Kaynak atıfları.** `[a12]` → Kaynakça A (konu 1–3 dış kaynakları), madde 12. `[b6]` → Kaynakça B (konu 4–6 dış kaynakları), madde 6. Kod ve iç belge atıfları satır içinde dosya yoluyla verilir.
- **Kaynakça A'daki [O] / [A] işaretleri:** [O] = sayfa açılıp okundu; [A] = yalnız arama sonucu özetinden alındı (ikincil sayılır).
- **"doğrulanmadı":** birincil metne ulaşılamadı ya da bilgi tek/ikincil kaynağa dayanıyor. mevzuat.gov.tr konsolide metinleri ve MEB PDF'lerinin çoğu bu oturumda okunamadı; madde numaraları özgün RG metninden, MEB haber ve SSS sayfalarından alındı. **Ürüne girecek her hüküm hukuk danışmanıyla konsolide metin üzerinden yeniden doğrulanmalı.**
- **Kod etiketleri:** **[Kod]** = kodda doğrulandı; **[Belge]** = yalnız belgede.
- **Paydaş paneli bir simülasyondur.** Persona tepkileri kurgusaldır, gerçek kullanıcı araştırması değildir; pilot okullarda doğrulanmadan karar dayanağı yapılmamalı.
- **Efor ölçeği** (tek geliştirici, kaba): S ≈ birkaç gün · M ≈ 1–2 hafta · L ≈ 2–4 hafta · XL > 1 sprint.

---

## 1. Yönetici özeti

1. **Altı konunun hiçbiri bugün kodda yok.** Yalnız yer tutucular var: okul modül kataloğunda `finance`, `cafeteria`, `transport` anahtarları; web'de beş Finans sayfası ve `/messages` sayfası `PlannedScreen`; `PAYMENT_REMINDER`/`PAYMENT_RECEIVED` bildirim satırları `delivered: false`; `ParentStudentRelationship` üzerinde `IsPaymentResponsible` ve `CanPickup` bayrakları. `genel/mvp-kapsami.md` §3 altısını da pilot MVP dışında (Sprint 5+/6+) sayıyor — Mesajlar hariç: belge onu Sprint 3'te ✅ gösteriyor ama **kodda yalnız `Modules/Messaging/.gitkeep` var** [Kod].
2. **"2026-2027 Eğitim ve Öğretim Yılına İlişkin İş ve İşlemler" konulu genelge (MEB, 19.08.2026) üç konuyu doğrudan değiştiriyor** [b6]. Genelge "resmî ve özel okul ve kurumlarda" uygulanıyor:
   - **Deneme sınavı:** Bakanlık dışında hazırlanan, öğrencileri "yarıştıran, sıralamaya tabi tutan ya da velilere ilave mali yük getiren" deneme/tarama sınavları okulda uygulanamıyor. Pazardaki deneme analiz ürünlerinin merkezindeki sıralama tam bu hükmün hedefi. → **Konu 4 bu turda yapılmamalı.**
   - **Görüşme talebi:** Veli görüşmeleri "ülke genelinde yalnızca Okul Randevu Sistemi üzerinden" yürüyor; ilkokul/ortaokulda bu ayrıca Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği'nde (md. 78/11, RG 28.07.2026/33323) [b2]. → **OKSİS ayrı bir randevu motoru kurmamalı;** MEB sistemine yönlendirme + veli toplantısı duyurusu + okul davet bildirimi yeterli.
   - **Mesajlar (ve mevcut Ödev/Duyuru):** "Ödev verme ya da bilgilendirmelerde Bakanlığın belirlediği dijital platformlar haricindeki araçların kullanımından kaçınılarak…" OKSİS bu platformlardan biri değil. Hüküm "kaçınma" diliyle yazılmış, yasak değil yönlendirme; ama **mesajlaşma kadar mevcut Ödev ve Duyuru modüllerini de ilgilendiriyor. Hukuk görüşü gerekli.**
3. **Mesajlaşmanın teknik ön koşulu:** ADR 0008 (süper yönetici okul verisini görmez) uygulanmadan mesaj tabloları açılırsa süper yönetici bütün okulların yazışmalarını görebilir. Mesajlaşma 0008'den önce canlıya çıkmamalı.
4. **Ödemeler en değerli ama en ağır konu.** Yönetici ve veli için ilk sırada; öğretmen ve öğrenci için "hiç görünmemeli". Öneri: OKSİS **para tutmasın** (6493 sayılı Kanun lisans riski [a27]); ilk dilim tarife + ödeme planı + çevrim dışı tahsilat kaydı + velinin salt okunur "Ödemelerim" ekranı. Ön koşullar: finans rolü kararı (ADR 0007), ödeme sorumluluğunun iki ayrı alanda tutulması çelişkisinin çözümü.
5. **Yemek menüsü en ucuz, en az riskli kazanım.** Alerjen etiketli yapılandırılmış menü kişisel veri içermez; toplu tüketim yerlerinde 14 alerjenin bildirimi zaten zorunlu [a33]. Öğrenciye ait alerji eşlemesi sağlık verisidir (özel nitelikli) → ayrı tur.
6. **Servis:** Okulun yönetmelikteki yükümlülüğü kayıt tutmak ve indirme-bindirme yerini belirlemek [a1]; araç takip ve kamera taşımacının sorumluluğunda. İlk dilim statik servis bilgi kartı; canlı konum ayrı karar.
7. **Önerilen sıra:** Görüşme yönlendirmesi + veli toplantısı (S) → Yemek menüsü (alerjen etiketli) → Ödeme takibi → Mesajlar (hukuk görüşü + ADR 0008 + "plan dışı" kararı sonrası) → Statik servis → Deneme sınavı (beklet). Ayrıntı §2.
8. **14 belge–kod çelişkisi** tespit edildi (§12); en önemlisi `mvp-kapsami.md`'deki Mesajlaşma ✅ işaretleri ve ödeme sorumluluğunun iki ayrı alanda tutulması.

---

## 2. Öncelik sıralaması

Etki: hedef kullanıcıya değer ve satış önemi (1–5). Risk: hukuki + KVKK + uygulama riski. Efor ilk dilim içindir (backend / web / mobil).

| Sıra | Konu ve önerilen ilk dilim | Etki | Efor (B / W / M) | Risk | Ana bağımlılıklar | Gerekçe |
|---|---|---|---|---|---|---|
| 1 | **(5) Görüşme:** MEB Okul Randevu Sistemi'ne yönlendirme, veli toplantısı duyuru/etkinliği, okulun veliyi davet bildirimi | 3 | S / S / S | Düşük | — | Zorunlu MEB sistemiyle yarışmadan en sık ihtiyacı karşılar; panelde en az direnç gören konu. |
| 2 | **(1) Yemek menüsü:** aylık yapılandırılmış menü, 14 alerjen etiketi, Excel içe aktarma, "bugünün yemeği" kartı, değişiklik bildirimi | 3 | S / M / S | Düşük | K-X1 şema, K-X3 modül kataloğu | Kişisel verisiz; alerjen bildirimi yükümlülüğünü dijitalleştirir; rakiplerde menü düzeyinde alerjen etiketi görülmedi. |
| 3 | **(3a) Ödeme takibi:** ücret tarifesi, ödeme planı/taksit, tahsilat kaydı, veli "Ödemelerim" (salt okunur), yalnız ödeme sorumlusuna hatırlatma | 5 | L / L / M | Yüksek | Finans rolü (ADR 0007), ödeme sorumluluğu tek kaynağı (Ç-12), saklama süreleri, e-fatura kapsamı | Özel okul yöneticisi için en yüksek değer; para tutmayan takip modeli hukuki riski sınırlar. |
| 4 | **(6) Mesajlar:** yalnız veli↔öğretmen, öğrenci bağlamlı birebir; ek yok; sessiz saat; numara gizli; şikâyet kuyruğu | 4 | L / M / L | **Çok yüksek** | **Genelge hukuk görüşü, ADR 0008 uygulaması, "plan dışı" kararı (2026-10-05)**, öğretmen mesai koruması | Değeri yüksek ama ürün geneli hukuki soru ve kritik teknik ön koşul çözülmeden başlanmamalı. |
| 5 | **(2a) Servis:** güzergâh, plaka, şoför ve rehber personel bilgisi, öğrenci–güzergâh eşleştirmesi, güzergâha göre duyuru, "bugün binmeyecek" bildirimi | 3 | M / M / S–M | Orta | K-X3 (`transport` PlanGated), bildirim alıcısı kararı | Müdür yardımcısının yükünü kısmen azaltır; asıl istenen canlı konum/biniş yoklaması ayrı ve ağır. |
| 6 | **(4) Deneme sınavı:** **beklet.** İstenirse yalnız sıralamasız kişisel takip (MVP-0) | 1–2 | S–M / S / S | **Mevzuata aykırılık** | Genelge; hedef kitlede özel öğretim kursu var mı? | Genelge okulda sıralamalı yayınevi denemesini yasaklıyor; MEBİ zaten kişisel takip sunuyor. |

**Ayrı tur / sonraya:** online tahsilat (3b, XL), öğrenci alerji eşlemesi (1C, +L), canlı servis konumu ve biniş yoklaması (2b, XL), kazanım/öğrenme çıktısı analizi (4b), öğrenci↔öğretmen mesajı, okul geneli veli toplantısı slot dağıtımı.

**Panel ile mevzuatın ayrıştığı yer.** Paydaş paneli görüşme talebini ilk sıraya koydu ama tam bir randevu akışı (talep → öneri → onay) varsayarak; mevzuat bu akışın MEB sisteminde yaşaması gerektiğini gösteriyor. Panel deneme sınavını lise öğrencisi ve branş öğretmeni için değerli buldu; genelge bu değeri okul içinde kullanılamaz kılıyor. Sıralama bu iki düzeltmeyle yapıldı.

---

## 3. Kesişen bulgular

### 3.1 2026 mevzuatı hızla değişiyor

Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği 28.07.2026'da (randevu, KVKK) [b2], Ortaöğretim Kurumları Yönetmeliği 03.07.2026'da [b1], yeni genelge 19.08.2026'da [b6], KVKK Kurulunun 2026/1301 sayılı İlke Kararı 28.07.2026'da (RG) [b23] değişti/çıktı. Özel okullar genelgede açıkça kapsamda; ayrıca Özel Öğretim Kurumları Yönetmeliği md. 68 resmî benzerinin mevzuatına atıf yapıyor [b3]. **"Özel okuluz, bize uygulanmaz" varsayımı ürün kararlarında kullanılmamalı.** Her konu kararına bir "mevzuat gözden geçirme tarihi" eklenmesi önerilir.

### 3.2 Kod durumu [Kod]

| Konu | Kodda bugün |
|---|---|
| Yemek | `cafeteria` anahtarı okul kataloğunda açık (`oksis-api/src/Oksis.Application/Modules/Schools/Events/SchoolCreated/SeedDefaultModuleConfigsHandler.cs:51`); varlık/uç/ekran yok |
| Servis | `transport` kapalı, PlanGated (`…SeedDefaultModuleConfigsHandler.cs:50`); varlık/uç yok |
| Ödemeler | `finance` açık (`…:48`); web `/finance/**` beş `PlannedScreen`; `PAYMENT_REMINDER`/`PAYMENT_RECEIVED` `delivered: false` (`oksis-api/src/Oksis.Infrastructure/Persistence/Seed/MasterData/NotificationEventTypeSeedData.cs:230-235`); `NotificationEventGroup.Payment` tanımlı ve boş |
| Deneme | Varlık yok; Sınav Takvimi (`Domain/Modules/Exams`) ve Notlar ayrı kavramlar; kazanım/öğrenme çıktısı modeli yok |
| Görüşme | Varlık yok; mobil rehber ekranında "Mesaj düğmesi konmadı: mesaj modülü yok" yorumu (`oksis-ui/apps/mobile/src/features/contacts/components/contact-directory-screen.tsx:24-25`) |
| Mesajlar | `oksis-api/src/Oksis.Application/Modules/Messaging/.gitkeep` dışında hiçbir şey yok; Domain'de `Messaging` klasörü yok; `messages.*` izni yok; web `/messages` → `PlannedScreen` (`oksis-ui/apps/web/app/(dashboard)/messages/page.tsx`); mobilde ekran yok; `messaging` okul kataloğunda yok, yalnız `master.plan_modules`'te |

Gerçek zamanlı altyapı (`Oksis.Api/Hubs/NotificationHub.cs`, hesap başına grup), rıza altyapısı (`ConsentType.HealthData`), dosya kategorileri, Excel içe/dışa aktarma ve veli alıcı çözücüsü (`INotificationRecipientResolver`) hazır ve yeniden kullanılabilir.

### 3.3 Modül kataloğunda iki kaynak birbirini tutmuyor (K-X3)

Okul varsayılan kataloğunda `finance`, `cafeteria` (açık), `transport` (PlanGated) var, `messaging` yok. Plan kataloğunda (`master.plan_modules`) tersine `messaging` var, diğer üçü hiçbir planda yok. Sonuç: yeni bir okulda Ayarlar › Modüller'de "Finans" ve "Yemekhane" açık görünüyor ama arkasında modül yok. Altı özellikten herhangi biri yazılmadan önce modül anahtarlarının tek kaynağı kararlaştırılmalı. Ek olarak `eokul` (Beta) anahtarı "e-Okul entegrasyonu yok" kuralıyla çelişiyor.

### 3.4 Modül sınırı bugün yalnız klasör düzeyinde

`ParentStudentRelationships` tablosu ortak `IApplicationDbContext` üzerinden 38 dosyada, 10'dan fazla modülde doğrudan okunuyor [Kod]. **Öneri:** yeni altı modül başka modülün DbSet'ine dokunmasın; `Application/Common/Abstractions` altında okuma arayüzleri kullansın ve bu bir mimari testle korunsun (`NoChannelDecisionInCommandsTests` emsali). Gereken soyutlamalar (taslak ad): `IGuardianScope` (veli ↔ öğrenci ilişkisi ve bayrakları), `ITeachingScope` (öğretmen ↔ şube/ders/öğrenci, yayınlı programdan), `IStudentPlacementReader` (öğrenci → sezon, şube, kademe), `ISchoolCalendarReader` (okul günleri, tatil, zil saatleri). Mevcut modüllere geriye dönük uygulanması önerilmiyor (pahalı).

### 3.5 Bildirim hattı kuralları (ADR 0012, K-01, K-34)

Her yeni olay aynı commit'te dört yerde doğmalı: `NotificationKind` + `NotificationKindMetadata.cs` eşlemesi; `NotificationEventTypeSeedData.cs` satırı (`delivered: true` yalnız üretici aynı commit'teyse); push kapsamındaysa `PushEventKeyMap.cs`; kanal seçimi komutta değil (K-34: teslim = katalog desteği ∩ alıcı tercihi). Bugün grup kümesi altı değer (`Attendance, Academic, Payment, Announcement, Homework, Club`). **Öneri:** iki yeni grup — `Messaging` (mesaj + görüşme) ve `Services` (yemek + servis). Yeni olayların hiçbiri sessiz saati delmesin; tek istisna adayı "servis gecikmesi/iptali" (karar). Bildirim gövdelerinde **tutar, net/puan, alerjen adı ve mesaj metni yazılmaz** (kilit ekranı; ayrıca push içeriği yurt dışı sunuculardan geçer — KVKK md. 9 [b24][b33]). Bildirim hattında SMS kanalı yok (K-34); taksit hatırlatması için SMS beklentisi ayrı bir maliyet kararı.

### 3.6 Roller (ADR 0007)

ADR 0007 beş rolü kilitliyor ve muhasebeciyi kaldırdı ("Finans rolü doğduğunda ilişki kaydına bağlı olarak yeniden eklenir"). Ödemeler muhasebe, servis servis sorumlusu/rehber personel, yemek yemekhane sorumlusu ister. **Öneri:** ilk turda yeni rol açılmasın, işi okul yöneticisi yapsın; muhasebeci rolü yalnız Ödemeler canlıya çıkarken ayrı ADR ile açılsın; şoför ve rehber personele hesap verilmesin (okul dışı kişi). `security-rules.md` §3.1 sekiz rol sayıyor, ADR 0007 beş diyor (Ç-8).

### 3.7 Personaların ortak kırmızı çizgileri (simülasyon)

1. Borç/ödeme bilgisi yalnız ödeme sorumlusu veli, muhasebe ve idareye görünür; öğretmen, öğrenci ve diğer veli görmez; hiçbir modül (karne, yoklama) borca bakmaz.
2. Öğretmene mesai dışı bildirim yükü yok; tercih öğretmenin elinde (K-34 ile uyumlu).
3. Sağlık verisi (alerji) bildirimde, duyuruda, sınıf listesinde yer almaz.
4. Çocuğun durağı/konumu başka velilere ve öğretmenlere görünmez.
5. Mesajlaşma ADR 0008 uygulanmadan canlıya çıkmaz.
6. Bildirim metninde hassas içerik yok.
7. Görüşme tutanağı v1'de yok.

---

## 4. Konu 1 — Yemek menüsü

### (a) Mevzuat ve resmî kaynaklar

| Düzenleme | Tarih / sayı | OKSİS'e değen kısım | Kaynak |
|---|---|---|---|
| Türk Gıda Kodeksi Gıda Etiketleme ve Tüketicileri Bilgilendirme Yönetmeliği | RG 26.01.2017 / 29960 (mük.) | Toplu tüketim yerleri (okul dâhil) son tüketiciye **14 alerjen** bilgisini menü, pano veya broşürle sunar; 01.01.2020'den beri zorunlu. Madde numarası **doğrulanmadı**. | [a33] |
| Özel Öğretim Kurumları Yönetmeliği — "diğer hizmetler" | 03.01.2025 değişikliği | Yemek ve kahvaltı okul yönetimiyle anlaşma yoluyla, isteğe bağlı; ücret mayıs sonuna kadar ilan edilir, **kurum adına açılmış banka hesabına** ödenir (md. 55). | [a12], [a11] |
| Okul Kantinlerine Dair Özel Hijyen Kuralları Yönetmeliği | RG 05.02.2013 / 28550 | Yemekhane/kantin hijyeni; güncel yürürlük **doğrulanmadı**. | [a30] |
| MEB Destek Hizmetleri GM Genelgesi 2020/8 | 10.11.2020 | Gıda işletmesi denetimi (müdür/müdür yardımcısı başkanlığında komisyon). Menü/beslenme bölümü **doğrulanmadı**. | [a29] |
| MEB kantin genelgesi | 2016 (sayı **doğrulanmadı**) | Kantinde satışı uygun olmayan ürünler. | [a28] |
| Türk Gıda Kodeksi Okul Gıdası Hakkında Tebliğ (No: 2020/23) | RG 22.10.2020 / 31282 | Ambalajlı "okul gıdası" onayı; menüyü değil ürünü düzenler. Uygulama 13.09.2027'ye ertelendi (erteleme tebliği numarası **doğrulanmadı**). | [a31], [a32] |
| Beslenme Dostu Okul / Beyaz Bayrak | MEB–Sağlık Bakanlığı protokolü, 2010 | Gönüllü sertifika programları; güncel protokol **bulunamadı**. | [a36] |
| MEB ücretsiz öğle yemeği anketi | 05–19.10.2026 | Görüş toplama, karar değil. | [a32] |

**Bulunamayanlar:** Yemek listesinin veliye duyurulmasını zorunlu kılan bir MEB maddesi ve besin alerjisine özgü bağlayıcı bir MEB/Sağlık Bakanlığı düzenlemesi bulunamadı [a34][a35][a39]. Hukuki yük iki noktada: alerjen bildirimi (yemeği sunan işletmenin) ve yemek ücretinin ilanı/tahsil yolu.

### (b) Rakipler

- **e-Okul VBS:** yemek işlevi yok [a52].
- **K12NET:** Mart 2023'te menü modülü (günlük/haftalık, sınıf düzeyine göre, veli/öğrenci portalı); duyuruda **alerjen geçmiyor**; Mayıs 2023'te ayrı kafeterya (sipariş/ödeme) modülü [a44].
- **Anaokulu uygulamaları** (Anaokula, Anaokulu Kreş Cepte): menü paylaşımı temel özellik; alerji alanı açıkça yazmıyor [a47][a48]. Power Kids'in özellikleri **doğrulanmadı** [a49].
- **Yurt dışı — ParentPay:** veli diyet bilgisi verdiyse alerjen içeren yemek seçimini engelliyor [a54].
- **Gözlem:** taranan Türk ürünlerinde menü düzeyinde alerjen etiketi bulunamadı — farklılaşma alanı olabilir (yalnız bu taramayla sınırlı).

### (c) Rol bazlı ihtiyaçlar (simülasyon)

| Persona | Temel ihtiyaç | İlk dilime tepki | Kırmızı çizgi / öneri |
|---|---|---|---|
| Okul yöneticisi | Firmanın aylık Excel'ini yükleyip yayınlamak; "bugün ne var" telefonlarını azaltmak | Memnun, çekinceyle | Yanlış alerjen rozeti sorumluluğu → "son güncelleyen/tarih" izi, "alerjen bilgisi firma beyanıdır" notu, yayın öncesi önizleme |
| Müdür yardımcısı | Gün içi menü değişikliğini hızla iletmek | Memnun | "Bugünkü menüyü değiştir" birkaç dokunuşla; duyuru taslağı hazır gelsin |
| Branş öğretmeni | Yok | Nötr | Öğretmene yeni ekran/bildirim gelmesin |
| Sınıf öğretmeni | Sınıftaki alerjili çocukları bilmek | **Kaygılı** — asıl derdi çözülmüyor, rozet sahte güven verebilir | Arayüzde "Çocuğunuzun alerjisi ayrıca bildirilmelidir" metni; eşleme sonraki dilimde dar görünürlükle |
| Veli | Sabah "bugün öğlen ne var" bakışı | Memnun | Her gün bildirim istemiyor; yalnız "yeni aylık menü" ve "yarın değişiklik var"; çocuk seçicide doğru kademe menüsü |
| Öğrenci | "Bugün ne var" | Nötr / memnun | Anasayfada kısa satır (ADR 0024); rozet uyarı dili değil bilgi dili |

**Ayrışma:** sınıf öğretmeni alerji eşlemesini ilk dilimde istiyor; yönetici sağlık verisi sorumluluğu nedeniyle istemiyor.

### (d) Önerilen kapsam ve akışlar

- **Seçenek A (bugün de yapılabilir):** menü PDF'i duyuru ekiyle — sıfır model; "bugün", arama, alerjen yok.
- **Seçenek B — önerilen ilk dilim:** yönetim aylık menüyü gün × öğün (kahvaltı/öğle/ikindi) girer, 14 alerjenden işaretler, isteğe bağlı kademe ayrımı yapar, Excel'den içe aktarır, yayınlar/geri çeker. Veli ve öğrenci anasayfada "bugünün yemeği" kartı, haftalık/aylık görünüm, alerjen rozetleri görür. Yayın sonrası gelecekteki bir gün değişirse bildirim gider.
- **Sonraki dilimler:** öğrenci alerji/diyet kaydı (Seçenek C; sağlık rızasıyla, dar rol görünürlüğüyle); yemek hizmeti aboneliği (Finans'a "diğer hizmet" kalemi); okul öncesi "beslenme durumu" girişi.
- **Kapsam dışı önerisi:** kantin kartı/ön ödemeli harcama (ödeme hizmeti doğurur); katalog açıklamasındaki "yemekhane yoklaması" v1'de yok.

### (e) Mevcut modüllerle bağlantı ve veri modeli taslağı

Yeni modül `Cafeteria`, şema `school` (K-X1). Okul günleri `IHolidayCalendarReader`, kademe hedefleme duyurunun `AudienceDimension.SchoolStage/GradeLevel` emsali, PDF için yeni dosya kategorisi `MealMenuDocument`, ekran yeri öğrenci gün kartı (ADR 0024) ve veli anasayfası. Nöbet modülündeki `canteen` bölge türü menüyle ilgisiz, karıştırılmamalı.

| Aggregate | Temel alanlar | Not |
|---|---|---|
| `MealMenu` (kök) | `SchoolId`, `AcademicSessionId`, `Title`, `PeriodStart/End` (DateOnly), `Audience` (Tümü / kademe listesi), `Status` (Draft → Published → Withdrawn), `PublishedAt`, `PublishedByPersonId`, `SourceFileId?` | Kademe başına aynı dönemde tek yayınlı menü; çakışma kuralı denetleyicide (ADR 0018) |
| `MealMenuDay` (çocuk) | `Date`, `MealSlot`, `Items[]` | Tatil gününe yazma reddi; haftalık şablon kurulursa `DayOfWeek` Pazartesi=1 (ADR 0013) |
| `MealMenuItem` (değer nesnesi) | `Name`, `AllergenTags`, `Calories?`, `IsVegetarian?` | Alerjen sözlüğü master tablo (14 alerjen; diyetisyen/hukuk teyidi) |
| `StudentDietaryProfile` (yalnız C) | öğrenci, alerjen listesi, tıbbi not, kaynak belge, rıza kaydı kimliği | Özel nitelikli sağlık verisi |

**ADR uyumu:** 0004, 0010/0011, 0013, 0018 ile çelişki yok; 0007'ye "yemekhane sorumlusu" rolü açılmazsa dokunmaz. Domain haritasında yemek/menü kavramı yok → yeni kavram notları (`Yemek Menüsü`, `Alerjen`).

**Bildirim:** `MEAL_MENU_PUBLISHED` (hedef kademelerin `CanViewInfo` velileri + öğrenciler; uygulama içi, push kapalı — okul geneli fan-out), `MEAL_MENU_CHANGED` (yalnız gelecekteki gün değiştiyse; uygulama içi + push), yalnız C'de `MEAL_ALLERGEN_WARNING` (yalnız kesişen öğrencinin velisi; bir gün önce 17:00; gövdede alerjen adı yok). Grup `Services`.

### (f) KVKK ve güvenlik

- **Menüdeki alerjen etiketi kişisel veri değildir** — ilk dilim kişisel verisiz yürür.
- **Öğrencinin alerjisi sağlık verisidir** (KVKK md. 6, 7499 sayılı Kanunla değişik) [a40]. Okul sağlık hizmet sunucusu olmadığı için en temiz dayanak açık rıza görünüyor (**hukuk teyidi gerekli**). Kurulun 2018/10 sayılı "yeterli önlemler" kararı (ayrı politika, eğitim, yetki kontrolü, ortam güvenliği) uygulanır [a41][a42]. Seçenek C: `ConsentType.HealthData` rızası (reşit olmayanın rızasını kimin verdiği `Rıza Kaydı.md`'de açık soru), erişim kaydı, alan düzeyinde şifreleme, dar rol (yemekhane sorumlusu, okul öncesi öğretmeni, müdür yardımcısı); sınıf listesi, duyuru, bildirimde hiç görünmez.
- **Sorumluluk:** menü/alerjen içeriğinin sahibi okul ya da firma; ürün yemek güvenliği garantisi verir gibi görünmemeli.
- İzinler: `cafeteria.read`, `cafeteria.manage`; C'de `cafeteria.dietary.read`.

### (g) Etki / efor / bağımlılık

Etki 3 · B: S / M / S · C: +L / +M / +S. Bağımlılık: K-X1, K-X3; C için rıza delegasyonu ve hukuk teyidi.

### (h) Kararlar

Menü kademe bazlı mı, okul tek menü mü? · v1 Seçenek B mi? C bu tur mu? · "Yemekhane yoklaması" kapsamda mı (değilse katalog metni düzeltilir)? · Menüyü kim girer — yönetici mi, yeni rol mü? → §10 K-38, K-44.

### (i) Terminoloji

"Yemek Listesi" / "Yemek Menüsü" (MEB'de bağlayıcı terim bulunamadı; sözlüğe öneri `mealMenu`) · gıdaya ait **alerjen**, öğrenciye ait **besin alerjisi** (öneri `allergen`) · **yemekhane, kantin** ("kafe" değil) · **okul gıdası** yalnız onaylı ambalajlı ürün için · yemek/kahvaltı için **diğer hizmetler** ("ek ücret" değil).

---

## 5. Konu 2 — Servis (okul servis aracı) bilgileri

### (a) Mevzuat ve resmî kaynaklar

**Ana metin:** İçişleri Bakanlığı **Okul Servis Araçları Yönetmeliği**, RG 25.10.2017 / 30221 [a1][a2] (2007 tarihli eski "Okul Servis Araçları Hizmet Yönetmeliği"nin yerine geçti). Değişiklikler: RG 05.08.2022; **29.11.2024 / 32737** (yaş şartı esnetildi, belge süreleri, geçiş süreleri 2025–2029) [a4][a5]; **19.08.2025 / 32991** ("okul" tanımına "resmî ve özel" eklendi, belediye fiyat tarifesi, tüzel kişi taşıması) [a6][a7][a8]. Madde numaraları 2017 özgün metninden; sonraki değişikliklerle kaymış olabilir.

| Hüküm | Özet | OKSİS'e değen yön |
|---|---|---|
| md. 3/1-f, h, l, m | Okul servis aracı, rehber personel, taşımacı; **Taşımacıyı Tespit Komisyonu** (okul müdürü başkanlığında, servisi kullanan iki veli dâhil) | Terminoloji; okulun yıllık iş akışı |
| md. 4/1-ı, m | **Araç takip sistemi** (kayıt ≥ 30 gün) ve **kamera** (2025 ile iç+dış) | Konum ve görüntü verisinin sorumlusu taşımacı |
| md. 5/2-d, e | Belediye tarifesi; okul/ikamet değişikliği, uzun tedavi, ayrılmada **kalan ayların ücretinin iadesi** taşımacının yükümlülüğü | Ödeme modülü bağlantısı |
| md. 5/2-f | Şoför, rehber personel ve plaka bilgisi **aynı gün okul yönetimine** bildirilir | Servis bilgi kartının veri kaynağı |
| md. 5/2-g | Araç takip verisi talep hâlinde okul yönetimi, kolluk ve **velilerle** paylaşılır | Canlı konumun hukuki zemini; veri sorumlusu taşımacı |
| md. 6/1 | Okul yönetimi: taşımayı planlar, **belge ve kayıtları tutar** (c), **indirme-bindirme yerlerini belirler** (ç), engelli öğrenci için tedbir alır (e) | OKSİS'in doğal kapsamı: 6/1-c ve 6/1-ç |
| md. 8 | Servis komisyon kararı + mülki amir onayıyla bir eğitim-öğretim yılı için; veli kendi taşımacısıyla da anlaşabilir (8/4) | Sezon bağlı kayıt; "okulun anlaşmalı servisi dışında" seçeneği |
| md. 14/1 | Kreş ve çocuk kulübü için isim listesi ve **günlük yoklama** | Servis yoklaması emsali; okullar için aynı hüküm metinde yok |

**Özel okul servis ücreti:** UKOME tarifesinden itibaren bir ay içinde tespit edilir [a11]. ÖÖKGM'nin 29.09.2025 / 142379667 sayılı yazısı: okul servisi doğrudan sağlıyor, firmayla ticari anlaşması var ya da kurucunun ortağı olduğu firmaya gördürüyorsa ücreti **tespit ve ilan etmek zorunda** [a10]. Ücretsiz okutulan öğrencide servis ücreti kapsam dışı [a23]. İBB UKOME'nin İstanbul servislerine kamera kararının 2026'da başlayıp başlamadığı **doğrulanmadı** [a9].

### (b) Rakipler

- **e-Okul VBS** ve **K12NET:** servis modülü bulunamadı [a52][a44].
- **okulservisi.net** (taşımacıya yönelik, satıcı beyanı): durak ve öğrenci atama, **canlı konum**, "yaklaştı / bindi / ulaştı" bildirimi, servis ücreti taksiti, belge süresi uyarıları, KVKK rıza yönetimi [a46].
- **Anaokula:** anlık servis konum takibi [a47]; **Anaokulu Kreş Cepte:** "Servis Takibi" [a48]; **Okulyo:** servis ödemelerinin dijitalleşmesi [a50].
- **Gözlem:** iki model var — okul yazılımında servis bilgisi ve taşımacının kendi yazılımı. Konum verisini fiilen üreten taşımacı olduğundan, OKSİS'in kendi GPS'ini kurması yerine taşımacının sisteminden okuması daha gerçekçi; ama ortak bir entegrasyon standardı **bulunamadı**.

### (c) Rol bazlı ihtiyaçlar (simülasyon)

| Persona | Temel ihtiyaç | İlk dilime tepki | Kırmızı çizgi / öneri |
|---|---|---|---|
| Okul yöneticisi | Güzergâh/şoför kaydını düzenli tutmak, değişikliği ilgili velilere duyurmak | Memnun, temkinli; **canlı konumu reddeder** ("servis firmasının işi") | "Bindi" bilgisi yanlış çıkarsa sorumluluk; kamera görüntüsü; sözleşmesiz şoför telefonu |
| Müdür yardımcısı | Sabah/akşam "binmedi / evde kimse yok" telefonları, gecikme duyurusu | **Kısmen memnun** — asıl derdi (binme yoklaması) ilk dilimde yok | "Bugün binmeyecek" bildirimi idareye düşsün; şoföre ulaşma yolu açık (SMS yok) |
| Branş öğretmeni | Yok | Nötr | Durak/adres öğretmene gösterilmesin |
| Sınıf öğretmeni (ilkokul) | "Bu çocuk bugün servisle mi gidecek?" | Kaygılı | Yalnız "servis kullanıyor: evet/hayır" görünsün, durak değil (karar) |
| Veli | "Servisim" kartı, değişiklik bildirimi, "bugün binmeyecek" | Memnun; **asıl beklentisi canlı konum** | Yalnız kendi çocuğunun durağı; yalnız önemli gecikmede bildirim; "canlı konum ilk dilimde yok" açıkça söylenmeli |
| Öğrenci (ortaokul) | Servis, saat, durak | Memnun | Şoför telefonu çocuğa gösterilmesin |

**En keskin ayrışma:** canlı konum — müdür yardımcısı ve veli istiyor, yönetici sorumluluk riski nedeniyle reddediyor.

### (d) Önerilen kapsam ve akışlar

- **İlk dilim (2a):** sezon bağlı güzergâh tanımı (ad, taşımacı, plaka, şoför ve rehber personel adı/telefonu, kapasite, sabah/akşam saatleri — md. 5/2-f ve 6/1-c kayıtları); öğrenci → güzergâh ve durak eşleştirmesi, "okulun anlaşmalı servisi dışında" seçeneği; veli "Servisim" kartı; "şu güzergâhtaki veliler" duyuru hedefi; veli "yarın/bugün binmeyecek" bildirimi (idareye düşer); güzergâh bazlı öğrenci listesi raporu (bugün "Taşımacılık Raporu" kartı yer tutucu).
- **Sonraki dilimler:** servis yoklaması (rehber personel kullanıcı olacak mı? okul dışı kişiye rol — ADR 0007/0019); canlı konum (taşımacının sisteminden okunarak, veri işleme sözleşmesi ve rıza tasarımı ön koşul); servis ücreti (Finans "diğer hizmet" kalemi, md. 5/2-e iade kuralı).
- **Kapsam dışı önerisi:** rota optimizasyonu, araç/şoför belge takibi (taşımacının işi).

### (e) Mevcut modüllerle bağlantı ve veri modeli taslağı

Yeni modül `Transport`, şema `school`. Yeniden kullanım: `ParentStudentRelationship.CanPickup` (bugün yalnız erken çıkışta okunuyor), adres ve konum sözlüğü (`ParentProfile.Address`, `Locations`), zil çizelgesi (`BellSchedule`). Okullar bugün servisi duyuruyla yönetiyor (mock veride "Servis gecikmesi" şablonu; acil tatil metninde "Servisler çalışmayacaktır").

| Aggregate | Temel alanlar | Not |
|---|---|---|
| `ShuttleRoute` (kök) | `SchoolId`, `AcademicSessionId`, `Code`, `Name`, `Direction`, `VehiclePlate`, `DriverName`, `DriverPhone`, `AttendantName?`, `AttendantPhone?`, `ContractorName?`, `Capacity`, `Status` | Şoför/rehber personel **kişi değil metin alanı** (hesapsız; ADR 0007 korunur) |
| `ShuttleStop` (çocuk) | `Order`, `Name`, `NeighborhoodId?`, planlanan sabah/akşam saati | Koordinat v1'de yok |
| `ShuttleAssignment` (kök) | `StudentPersonId`, `RouteId`, sabah/akşam durağı, `ValidFrom/Until`, `EndedAt?`, `EndReason?` | Kulüp üyeliği deseni (ADR 0014); öğrencinin aynı yönde tek canlı ataması |
| `ShuttleRideException` | `Date`, `StudentPersonId`, `Direction`, `Reason` | Velinin "binmeyecek" bildirimi; devamsızlık mazereti değildir |
| 2b: `VehiclePosition`, `BoardingEvent` | araç-zaman-konum; öğrenci-durak-bindi/indi-kaydeden | XL; muhtemelen dış sağlayıcı |

**ADR uyumu:** 0007 (rol açılmazsa uyumlu; 2b'de şoför hesabı → 0019 benzeri yeni ADR), 0006 (atama sezon devrinde kopyalanmaz önerisi), 0014, 0013, 0012 O1 (alıcı güzergâhtaki etkilenenler), 0008 (platform hesapları konum görmemeli).

**Bildirim (grup `Services`):** `SHUTTLE_ASSIGNED` / `…_CHANGED` (öğrencinin velileri; uygulama içi + push), `SHUTTLE_ROUTE_CHANGED` (güzergâh velileri), `SHUTTLE_DELAYED` / `SHUTTLE_CANCELLED` (güzergâh velileri; **sessiz saati delme adayı** — K-01b "ders iptali" emsali, karar), `SHUTTLE_RIDE_EXCEPTION_REPORTED` (okul yöneticisi; bekleyen iş), 2b'de `STUDENT_BOARDED` / `STUDENT_DROPPED` (throttle zorunlu).

### (f) KVKK ve güvenlik

- Konum KVKK md. 6 listesinde değil ama çocuğun canlı konumu + durak + ev adresi birlikte yüksek riskli (kaçırma/takip). Veli yalnız kendi çocuğunun aracını görmeli; konum geçmişi OKSİS'te tutulmamalı ya da çok kısa tutulmalı; SignalR grubu `tenant:{schoolId}:route:{routeId}` biçiminde. Kurulun servise özgü kararı **bulunamadı**.
- **Veri sorumlusu ayrımı:** takip ve kamera kayıtlarının sorumlusu taşımacı; OKSİS gösterirse taşımacı → okul → OKSİS (veri işleyen) zinciri için veri işleme sözleşmesi ve aydınlatma gerekir. **OKSİS kamera görüntüsü almamalı.**
- Şoför/rehber personel taşımacının çalışanı: telefonlarının paylaşımı aydınlatma ister; konum takibinde çalışan takibi boyutu var — KVKK 2026/921 İlke Kararı rızanın tek başına yetmediğini söylüyor (ikincil kaynak, RG bilgisi **doğrulanmadı**) [a43].
- Engelli öğrenci tedbiri (md. 6/1-e) sağlık verisine dokunur → servis modülüne konmamalı, sağlık rızası düzenine bağlanmalı.
- "Bindi" kaydı yalnız kaydı girenin beyanı olarak sunulmalı, "doğrulanmış konum" gibi değil.
- İzinler: `transport.read` (veli yalnız kendi çocuğu), `transport.manage`.

### (g) Etki / efor / bağımlılık

Etki 3 · 2a: M / M / S–M · 2b: XL / L / XL. Bağımlılık: K-X1, K-X2 (şoför hesabı), K-X3 (`transport` hiçbir planda yok, PlanGated), toplu push throttle (K-01 §8 açık iş).

### (h) Kararlar

Kapsam yalnız 2a mı? · `transport` hangi planda? · Gecikme/iptal sessiz saati deler mi? · Atama sezon devrinde kopyalanır mı? · "Binmeyecek" bildirimi kime gider? · Canlı konum hiç yapılacak mı, kimin sisteminden? · Rehber personel/şoför kullanıcı olacak mı? → §10 K-38, K-41, K-49.

### (i) Terminoloji

**Okul servis aracı** ("okul otobüsü" değil) · **taşımacı** · **rehber personel** ("servis ablası", "hostes" değil) · **şoför** (mevzuat dili) · **indirme-bindirme yeri** (arayüzde "durak" anlaşılır; ev önündeki nokta için mevzuat terimi bulunamadı) · **Taşımacıyı Tespit Komisyonu** · **araç takip sistemi** ("GPS" değil) · **servis ücreti** ("aidat" değil) · **"taşımalı eğitim" kullanılmaz** (resmî okulların ayrı sistemi). Sözlüğe öneriler: `busRoute`, `transportProvider`, `busAttendant`.

---

## 6. Konu 3 — Ödemeler (öğrenim ücreti, taksit, iade, indirim/burs)

### (a) Mevzuat ve resmî kaynaklar

Çerçeve: **5580 sayılı Özel Öğretim Kurumları Kanunu** ve **Özel Öğretim Kurumları Yönetmeliği** (RG 20.03.2012 / 28239) [a16][a17]; ücretle ilgili son değişiklikler **RG 03.01.2025 / 32771** [a12][a15] ve **RG 05.09.2025 / 33008** [a13][a14]. Madde numaraları ÖÖKGM SSS ve MEB haberlerinden; konsolide metinle doğrulanmalı.

| Konu | Hüküm | Kaynak |
|---|---|---|
| Ücret tespiti (md. 53) | Kurum gidere göre tespit eder; yeni kurum ildeki en düşük ilan ücretinin altında belirleyemez. 2025: dışarıdan alınan **tüm hizmetler** (yemek, kitap, kıyafet, e-ticaret ürünleri) ücret tespitine tabi. | [a11][a12] |
| İlan (md. 54/1) | Yıllık, TL; **ocak–mayıs sonu** MEBBİS'te; diğer hizmetler mayıs sonuna kadar; taşıma UKOME'den sonra bir ay içinde; ilandan önce tahsil yok. Peşin/taksit koşullarının ilanda yazılması (2018 haberi) güncel metinle **doğrulanmadı**. | [a11][a22][a20] |
| Artış tavanı (2025) | Ara sınıf: [(aralık Yİ-ÜFE + aralık TÜFE)/2] × 1,05; kademe başlangıcında önceki yılın aynı sınıf düzeyi ücreti baz; diğer hizmetler çarpansız. 2026–2027 rakamları (%30,74 / %43,92 / %29,28) hukuk bürosu/haber kaynaklı, MEB duyurusu **bulunamadı**. | [a13][a20] |
| Tahsil (md. 55) | Diğer hizmetler dâhil **kurum adına banka hesabına**; ödemeyen öğrencinin kaydı yalnız **yenilenmeyebilir**. | [a12][a18][a11] |
| İade (md. 56) | Öğretim yılı başlamadan ayrılana yıllık ücretin **%10'u dışındaki** kısım; başladıktan sonra %10 + okuduğu gün düşülerek; sınavla öğrenci alan resmî lisenin 9. sınıfına geçen tam iade; süre **ayrılıştan itibaren bir ay**. Uyuşmazlıkta MEM, Tüketici Hakem Heyeti, 6502 sayılı Kanun. Yargıtay %10 kesintiyi dikkate almayan kararı bozdu (2018; esas/karar no **doğrulanmadı**). | [a11][a18][a19] |
| Ücretsiz okutma (5580 sayılı Kanun md. 13) | En az %3 (ikincil kaynak), Bakanlık %10'a kadar artırabilir; **servis dışındaki tüm ücretleri** kapsar; başvuru ve yerleştirme **e-Okul** üzerinden (2026 takvimi Ağustos). | [a23][a24] |
| Burs ve kurum indirimi | Güncel MEB oran hükmü bulunamadı; kurumun ilan ve sözleşme koşulu gibi görünüyor. 2011 %25/50/75 kademelerinin yürürlüğü **doğrulanmadı**. | — |
| Kayıt sözleşmesi | ÖÖKGM örnek sözleşme; ek hizmet ücretleri sözleşmede yazılmak zorunda (2025). | [a22][a12][a20] |
| Rekabet | Rekabet Kurulu Şubat 2026'da 19 özel okul hakkında soruşturma açtı (ücret tespiti, yemek/kıyafet/kırtasiye, veliyi belirli yerden alışverişe zorlama); sonuç **bulunamadı**. | [a25] |
| KDV | Güncel oranlar **doğrulanmadı**. | [a26] |

### (b) Rakipler

- **e-Okul VBS:** ödeme yok; ücret ilanı MEBBİS'te, ücretsiz okutma e-Okul'da — devlet sistemleri, OKSİS dışı [a52][a23][a11].
- **Okul Connect:** okulun **kendi sanal POS**'uyla taksitli tahsilat, veli uygulamasında borç takibi (satıcı beyanı) [a45].
- **K12NET:** online mağaza (2023), "School Financials" ile ödeme geçidi; taksit/sanal POS ayrıntısı bulunamadı [a44].
- **okulservisi.net, Anaokula, Anaokulu Kreş Cepte, Okulyo:** aidat/taksit takibi ve hatırlatma [a46][a47][a48][a50]. **Ziraat Bankası Kolay Okul Tahsilat:** banka kanalıyla vadeli tahsil [a51].
- **Yurt dışı:** Veracross (ödeme planı, otomatik hatırlatma, ödeyene ayrı portal) [a53]; ParentSquare Pay (Stripe üzerinden) [a55].
- **Gözlem:** Türk rakiplerin ortak paydası takip + hatırlatma; online ödeme okulun POS'u ya da banka üzerinden. Platformun fon tuttuğu model görülmedi. Hiçbirinde **md. 56 iade hesabı ya da artış tavanı denetimi** bulunamadı — mevzuat uyumu farklılaşma alanı olabilir.

### (c) Rol bazlı ihtiyaçlar (simülasyon)

| Persona | Temel ihtiyaç | İlk dilime tepki | Kırmızı çizgi / öneri |
|---|---|---|---|
| Okul yöneticisi | Tahsilatı bir bakışta görmek, gecikenleri bilmek, tavan ve ilana uyum | Memnun; "para okula gider" modelini doğru buluyor | Borç bilgisi sızması; platform paranın üzerinden geçmesi; yanlış iade hesabı; okullar arası fiyat paylaşımı → iade "öneri", tavan "uyarı" olsun |
| Müdür yardımcısı | Doğrudan değil | Nötr / kaygılı | Finans verisini görmesin; veli sorarsa muhasebeye yönlendirsin |
| Öğretmenler | Hiçbir şey | **Reddeder** (öğretmene herhangi bir görünürlük açılırsa) | Borç rozeti, borçlu listesi, ücret nedeniyle karne/yoklama kilidi asla |
| Veli | "Bu ay ne kadar, ne zaman, ödediğim göründü mü?"; iki çocuk ayrı ve toplu | Memnun; online ödeme yokluğuna kısmen hayal kırıklığı | Borcun diğer ebeveyne/kilit ekranına görünmesi; her gün hatırlatma → nötr metin, tutarsız bildirim, sınırlı sıklık, "ödeme alındı" bildirimi |
| Öğrenci | Hiçbir şey | **Reddeder** (öğrenciye görünürlük açılırsa) | Öğrenci uygulamasında finans hiç olmasın |
| Muhasebe (**rol sistemde yok**) | Tarife, plan, tahsilat, kısmi ödeme, makbuz, gecikme raporu, Excel | Memnun ama rolü yok | Tutar istemciden gelmesin; silme yerine ters kayıt; çift kayıt engeli |

**Ayrışma:** veli online ödeme istiyor; yönetici fon tutan platform istemiyor → 3b ayrı karar.

### (d) Önerilen kapsam ve akışlar

**İlk dilim (3a — takip, online ödeme yok):**
1. **Ücret tarifesi** (sezon bazlı): öğrenim ücreti (kademe/sınıf düzeyi) + diğer hizmetler; "MEBBİS'te ilan edildi" tarihi (kayıt amaçlı); önceki yıl ücreti + elle girilen oranla **tavan uyarısı** (TÜİK oranını otomatik çekmek dış bağımlılık; ilk sürümde elle).
2. **Öğrenci ödeme planı:** kalem atama (diğer hizmetler isteğe bağlı), gerekçeli indirim satırları (**Ücretsiz Okutma (MEB)** = servis dışı tüm ücretler sıfır; kurum bursu; kardeş/peşin/personel indirimi), peşinat ve taksit takvimi, ödeme sorumlusu veli.
3. **Tahsilat kaydı:** nakit, havale/EFT, okulun POS'u; makbuz no; kısmi ödeme ve taksite dağıtım. **Fatura/e-arşiv OKSİS'te değil**, muhasebe yazılımında; gerekirse dışa aktarım.
4. **Veli "Ödemelerim"** (salt okunur): taksit takvimi, ödenen/kalan, gecikme, okulun IBAN'ı; kart verisi yok.
5. **Hatırlatma:** vadeden önce ve gecikmede, yalnız ödeme sorumlusuna.
6. **Raporlar:** tahsilat özeti, gecikmiş taksitler, kalem bazlı gelir; tek tenant, toplulaştırma yok.

**Sonraki dilimler:** ayrılma/iade sihirbazı (md. 56 önerilen tutar; servis için md. 5/2-e; bir aylık son tarih muhasebeye görev); online ödeme (okulun sanal POS'u ya da lisanslı ödeme kuruluşu, fon doğrudan okul hesabına); kayıt yenilemede **yalnız uyarı** (md. 55; otomatik kilit yok).
**Kapsam dışı önerisi:** senet takibi, ön muhasebe, bordro, kantin kartı.

### (e) Mevcut modüllerle bağlantı ve veri modeli taslağı

Yeni modül `Finance`, **ayrı `finance` şeması** önerisi (ileride ayrı yetki, denetim, olası ayrı veritabanı). Para `decimal(18,2)` + `Currency` (MVP: TRY). **Append-only defter:** düzeltme silme/güncelleme değil ters kayıt. Bağlantılar: `StudentEnrollment` (ücret planının bağlanacağı kayıt; `RenewEnrollment` doğal tetikleyici), `IsPaymentResponsible`, web'deki beş yer tutucu sayfa, mobil "Ödemelerim" yer tutucusu, `IExcelExporter`. Okul durumu "Askıda — lisans veya ödeme sorunu" OKSİS'in okuldan aldığı abonelik ödemesidir; veli ödemesiyle karıştırılmamalı.

| Aggregate | Temel alanlar | Not |
|---|---|---|
| `FeeSchedule` | sezon × kademe, kalemler (tutar, KDV oranı), `Status` | Yayınlanmış tarife değişmez (ADR 0004 emsali); değişiklik yeni sürüm |
| `DiscountPolicy` | `Code`, `Type` (yüzde/tutar), `Kind` (kardeş, erken kayıt, personel, burs, ücretsiz okutma), `RequiresApproval` | — |
| `StudentAccount` | öğrenci × sezon, `EnrollmentId`, ödeme sorumluları | Bakiye defterden türetilir |
| `PaymentPlan` | taksitler (`DueDate`, `Amount`, `Status`) | Taksit sayısı okul politikası |
| `LedgerEntry` (append-only) | `Type` (Charge/Discount/Payment/Refund/Reversal), tutar, referans, kaydeden, `ReversalOfId?` | Silinmez; denetim izi kendisidir |
| `Payment` (3a) | yöntem, tutar, tarih, ödeyen, dekont dosyası, taksitlere dağıtım | Yeni dosya kategorisi `PaymentReceipt` |
| 3b: `PaymentIntent`, `ProviderWebhookLog` | sağlayıcı oturumu, idempotency anahtarı, imza doğrulama | Kart verisi hiçbir alanda yok |

**ADR uyumu:** **0007 — çelişki** (muhasebeci rolü yok; ya yönetici yapar ya yeni ADR); 0019 platform tarafının "ödeme modülü yok" reddi okulun veli tahsilatıyla karıştırılmamalı; 0008 (destek finans verisini yalnız onaylı üstlenmede, salt okunur); 0006 (sezon devrinde bakiye devri — aktivasyon transaction'ına sokulmamalı, olay dinleyen ayrı idempotent iş); 0004; 0011.

**Bildirim (grup `Payment`):** `PAYMENT_REMINDER` (mevcut satır; **yalnız `IsPaymentResponsible` veli, `CanViewInfo` değil**; gövdede tutar yok), `PAYMENT_OVERDUE` (yeni; veli + yöneticiye günlük özet), `PAYMENT_RECEIVED` (mevcut satır; yalnız ödeme sorumlusu), `PAYMENT_PLAN_PUBLISHED`, 3b'de `PAYMENT_FAILED`. Alıcı çözücüye `ResolvePaymentResponsibleAccountsAsync` gerekir: boşanmış ailede ödeyen ama bilgi görmeyen ebeveyn (`CanViewInfo=false`) yalnız finans ekranını görmeli.

### (f) KVKK, finansal ve hukuki riskler

1. **Ödeme hizmeti lisansı (6493 sayılı Kanun):** veliden para toplayıp okula aktaran platform TCMB izni gerektiren ödeme hizmeti sunuyor sayılabilir [a27]. **OKSİS fon tutmamalı;** ödeme okulun kendi sanal POS'u/banka sözleşmesi ya da lisanslı ödeme kuruluşu üzerinden doğrudan okul hesabına gitmeli — md. 55'le de uyumlu. Pazar yeri/alt üye işyeri modeli aracılık riski taşır. **Hukuk teyidi şart.**
2. **Kart verisi:** OKSİS görmez, saklamaz; sağlayıcının barındırdığı sayfa + 3D Secure; PCI DSS kapsamı daralır (SAQ türü sağlayıcıyla **doğrulanmalı**). Log redaksiyon listesine kart alanları eklenmeli.
3. **Borç bilgisi damgalayıcı:** yalnız ödeme sorumlusu; öğretmen, öğrenci, diğer ebeveyn, duyuru kitlesi asla.
4. **Yaptırım:** yönetmelik yalnız kayıt yenilememeye izin veriyor; karne/belge/yoklama kilitleyen özellik yapılmamalı (eğitim hakkı riski).
5. **İade hesabı** "öneri" olarak sunulmalı, son karar muhasebede (yanlış hesap tüketici uyuşmazlığı).
6. **Rekabet:** okullar arası fiyat verisini toplulaştırıp paylaşmak yapılmamalı (rekabet hukuku; tenant izolasyonu da yasaklar).
7. **Saklama:** finans kayıtları vergi/ticaret mevzuatı gereği uzun süre (VUK 5 yıl / TTK 10 yıl — **doğrulanmadı**); KVKK silme talebi "kanuni yükümlülük" istisnasına düşer → silme yerine erişim daraltma ve kilitleme.
8. **Webhook tenant'ı** claim'den değil `PaymentIntent` kaydından çözülür → `IgnoreQueryFilters` gerekçesi, `// JUSTIFICATION` ve denetim (multi-tenant-rules §3.1); imza doğrulanmadan durum değişmez; idempotency ve çift tahsilat testleri zorunlu.
9. **e-Okul/MEBBİS'e entegrasyon yok**; OKSİS yalnız ilan edilen ücreti ve MEB'in yerleştirdiği ücretsiz öğrenciyi kayıt olarak tutar.
10. İzinler: `finance.read`, `finance.collect`, `finance.manage`, `finance.refund` (iki kişi kuralı adayı, ADR 0022 emsali), `finance.report`; veli tarafı izin değil kapsam.

### (g) Etki / efor / bağımlılık

Etki 5 · 3a: L / L / M · 3b: XL / M / M. Bağımlılık: K-X1 (şema), K-X2 (muhasebeci rolü), **ödeme sorumluluğunun tek kaynağı (Ç-12)**, e-posta alıcı tercihi (E-44), hukuk teyidi (saklama, e-fatura, ödeme kuruluşu).

### (h) Kararlar

3a ile mi başlanır? · Muhasebeci rolü açılsın mı? · Ödeme sorumluluğu ilişki bayrağından mı profil bayrağından mı okunur? · Sezon devrinde bakiye devri? · Borcun başka modüllere etkisi (önerim: hiç)? · Fatura OKSİS'te mi, dışa aktarım mı? · SMS hatırlatması için kanal açılacak mı? · Online ödeme modeli? → §10 K-38, K-39, K-40, K-42, K-49.

### (i) Terminoloji

**Öğrenim ücreti / eğitim ücreti** ("aidat" mevzuat dili değil) · **diğer hizmetler** · **ücretsiz okutma** (MEB kontenjanı; kurumun "burs"undan ayrı tutulmalı — sözlüğe öneri "Ücretsiz Okutma (MEB)") · **ücret iadesi** · **ara sınıf, kademe başlangıcı, devam eden öğrenci, naklen kayıt** · **ilan** (MEBBİS) · **taksit, peşin** · **ödeme sorumlusu** ("borçlu veli" değil) · **"senet" ürün diline sokulmamalı**. Sözlükte mevcut: `financeAccount`, `tuition`, `payments`, `discount`, `scholarship`.

---

## 7. Konu 4 — Deneme sınavı analizleri

### (a) Mevzuat ve resmî kaynaklar

- **2026-2027 genelgesi — okulda deneme yasağı** [b6]: "Tüm eğitim kademelerinde", Bakanlık ortak sınavları ve Bakanlık ölçme araçları dışında, "il, ilçe, okul veya sınıf genelinde öğrencileri birbirleriyle yarıştıran, sıralamaya tabi tutan ya da velilere ilave mali yük getiren" deneme, hazır bulunuşluk ve tarama sınavları okulda uygulanamıyor ve öğrencilere satın aldırılamıyor; "adı veya niteliği ne olursa olsun Bakanlık dışında hazırlanan… sınav niteliği taşıyan hiçbir uygulama" okulda yapılamıyor. Özel yayınevi sınavları açıkça kapsamda [b15]. Basın genelge sayısını "2026/70" veriyor [b7]; resmî PDF'te **doğrulanmadı**.
- **Uygulama gevşek olabilir:** 08.10.2026 tarihli tek bir haber okulların hafta sonu destekleme ve yetiştirme kurslarında (DYK) deneme uygulamayı sürdürdüğünü yazıyor [b16] (**doğrulanmadı**). Bu, ürün kararını değiştirmemeli: yasak bir faaliyete altyapı sunmak okul ve OKSİS için itibar ve sözleşme riski.
- **Özel öğretim kursları ayrı rejim:** Özel Öğretim Kurumları Yönetmeliği md. 46/9'a göre kurslarda "deneme sınavlarının kurum binalarında yapılması esastır"; başarı bilgileri e-Özel'e işlenir ve üçüncü kişilerle paylaşılamaz [b3]. → Hedef kitlede kurs var mı, karar sorusu.
- **MEBİ:** YKS adaylarına aylık TYT/AYT/YDT denemeleri, hedef belirleme ve analiz raporları; platform dışı denemelerin sonuçları da girilebiliyor [b28].
- **Net/puan:** LGS'de 3 yanlış, YKS'de 4 yanlış 1 doğruyu götürür (basın aktarımı; MEB/ÖSYM kılavuzları okunamadı, **doğrulanmadı**) [b26][b27]. Resmî puan o yılın aday dağılımına bağlı → okul içi sistem hesaplayamaz, yalnız tahmin eder; **yalnız ham net ve dış kaynağın verdiği puan saklanmalı.**
- **Karne:** taranan yönetmelik bölümlerinde denemeyi not/karne bileşeni yapan hüküm yok [b1][b2] → "karneye girmez" ilkesi uyumlu.
- **Kazanım → öğrenme çıktısı:** Türkiye Yüzyılı Maarif Modeli "öğrenme çıktısı" birimini kullanıyor [b31]; resmî terim değişikliği belgesi **doğrulanmadı**.

### (b) Rakipler

Edutime (optik form yükleme, ders/kazanım analizi, sınıf/şube/genel **sıralama**, veliye SMS) [b29a]; OkulAile (çevrim içi optik okuma, kazanım raporu) [b29b]; Okul Connect (LGS/YKS sonuç okuma ve puan hesaplama) [b29c]; OptikOS (LGS/TYT-AYT/KPSS, sıralama, madde analizi, DAT/TXT dışa aktarım) [b29e]; SınavAnalizi.com (kazanım bazlı analiz) [b29f]; ÖZDEBİR (kurum raporları; 2016–2018 kaynak) [b29g]; K12NET (yalnız kullanıcı yorumu, **doğrulanmadı**) [b29d]. **Ortak desenin merkezinde sıralama var — genelgenin hedeflediği şey.** Rakiplerin genelge sonrası değişip değişmediği **doğrulanmadı**.

### (c) Rol bazlı ihtiyaçlar (simülasyon — genelge bilinmeden yürütüldü)

| Persona | Temel ihtiyaç | Tepki | Kırmızı çizgi |
|---|---|---|---|
| Okul yöneticisi | Okul geneli LGS/YKS hazırlık performansı, "takip ediyoruz" mesajı | Memnun, KVKK kaygısıyla | Ad içeren sıralama listesi; öğretmen karşılaştırması |
| Branş öğretmeni (matematik) | Şube netleri, zayıf konu dağılımı, Excel yükünden kurtulmak | Kısmen memnun — kazanım analizi yok | Yanlış eşleşme; başka şubenin sonucu; öğretmen performans karşılaştırması |
| Veli | Çocuğun gelişim grafiği | Memnun | Başka öğrencilerin adı; bildirimde puan; sıralama vurgusu |
| Öğrenci (lise) | Kendi netleri, gelişim, hedef puana uzaklık | **En çok değer gören persona** | Sıralamanın arkadaşlara görünmesi |
| Öğrenci (ortaokul) | LGS hazırlığı | Memnun, kaygı riski | Küçük yaşta sıralama baskısı → sıralama varsayılan kapalı |

### (d) Önerilen kapsam

**Öneri: Konu 4 bu turda yapılmasın; Faruk kararına bağlansın.** İlerlenmek istenirse savunulabilir dar kapsam:
1. **MVP-0 — yalnız kişisel takip, sıralamasız:** okul dışında (ör. MEBİ) girilen ya da Bakanlık ortak sınavlarına ait sonuçları öğrenci veya rehber öğretmen kaydeder (tarih, tür, ders bazında doğru/yanlış/boş; net sunucuda hesaplanır); öğrenci ve veli kendi gelişim eğrisini görür; rehber öğretmen yalnız kendi rehberlik sınıfının bireysel kartlarını görür. Sıralama, şube/kademe karşılaştırması, yayınevi toplu içe aktarma yok. **Katma değer düşük** (MEBİ aynı işlevi sunuyor).
2. **Rehberlik bağlamı:** tercih danışmanlığında beyan edilen net gelişimi — rehberlik verisine kayar (danışan dosyası gizliliği, Rehberlik Yönetmeliği md. 3/ç [b4]); ayrı karar.
3. **Sonra** (genelge değişirse, hukuk görüşü olumluysa ya da hedef kitle kurslarsa): mimari 4a (toplu içe aktarma, şube/kademe analizi), ardından 4b (cevap anahtarı, soru × öğrenme çıktısı).

### (e) Mevcut modüllerle bağlantı ve veri modeli taslağı

Sınav Takvimi (`Domain/Modules/Exams`: `ExamWindow`, `ScheduledExam`…) okul içi dönem sınavlarını yerleştirir; dönem sınav türleri (VZ1–VZ4, SZ, PER, PRJ) arasında deneme yok. Notlar (`GradeBook`, `Assessment`, `Mark`) resmî notu tutar; deneme bu modele uymaz. Kazanım modeli kodda yok. `ExamDocument` dosya kategorisi var. Öneri: yeni modül `MockExams` (Exams'in kardeşi), şema `academic`.

| Aggregate | Temel alanlar | Not |
|---|---|---|
| `MockExamFormat` | `Code` (LGS, TYT, AYT…), bölümler (ders, soru sayısı), `WrongPenaltyRatio` | Resmî puan formülü taklit edilmez |
| `MockExam` | sezon, dönem, ad, tarih, format, `Publisher?`, kademeler, `Status` | MVP-0'da yayınevi alanı kullanılmaz |
| `MockExamResult` | öğrenci, sınav anındaki şube, bölüm sonuçları (D/Y/B/net), toplam net, `Score?`, sıralama alanları | **MVP-0'da sıralama alanları yok**; 4a'da şube/kademe sınav anında dondurulur (ADR 0004) |
| `MockExamImportRun` | dosya, format, eşleşen/eşleşmeyen satırlar | Yalnız 4a; eşleşmeyen satır sessizce atlanmaz |

**ADR uyumu:** 0001 (karneye girmezse etkilenmez), 0002 (ayrı kimlik), 0004, 0017/0018 (fiziksel yerleştirme istenirse), 0021 (ders eşlemesi aktif sezon snapshot'ından), 0024. "Sınav" sözcüğü üç kavram taşıyacak → yeni alias `MockExam` = "Deneme Sınavı" (`Mark` ile karıştırılmamalı).

**Bildirim (grup `Academic`):** `MOCK_EXAM_RESULTS_PUBLISHED` (öğrenci + `CanViewInfo` velileri; gövdede net/puan yok — `GRADE_PUBLISHED` emsali), 4a'da `MOCK_EXAM_IMPORT_FAILED` (bekleyen iş).

### (f) KVKK ve hukuki riskler

- **Sınav sonucu kişisel veridir:** KVKK Kurulu 2022/13 kararı YKS sonuç belgesini kişisel veri saydı ve rızasız yayımlayan siteye ceza verdi [b22].
- **Ad içeren sonuç listesi yayımlanamaz:** KVKK Kurulunun 2026/1301 sayılı İlke Kararı kamu kurumlarına yönelik ama ölçülülük yorumunu gösteriyor [b23]; MEB'in Temmuz 2026 yazısı sınav listeleri ve başarı bilgilerinin kamuya açık platformlarda yayımlanmasını yasaklıyor [b21] (özel okulları kapsayıp kapsamadığı **doğrulanmadı**). → Aile yalnız kendi çocuğunun sonucunu ve anonim dağılımı görür.
- **Reşit öğrenci:** 18 yaşını dolduran öğrencinin sonucunu veliyle paylaşmanın dayanağı ayrı değerlendirilmeli (**hukuk teyidi**).
- **Yayınevine öğrenci listesi** gönderimi veri aktarımıdır; genelge ışığında amacı (yasak deneme) da hukuka aykırılık riski taşır.

### (g) Etki / efor / bağımlılık

Etki 1–2 (genelge sonrası) · MVP-0: S–M / S / S · 4a: M / M–L / M · 4b: L–XL / L / S. Bağımlılık: genelge yorumu, hedef kitle kararı, pilot okullardan örnek dosya (format örneksiz tasarlanmamalı).

### (h) Kararlar

Konu 4 bu tur yapılsın mı? · Yapılacaksa MVP-0 yeterli mi? · Hedef kitlede özel öğretim kursu var mı? · Karneye girer mi (önerim: hayır)? → §10 K-43.

### (i) Terminoloji

**Deneme sınavı** (sözlüğe öneri `mockExam`; "Sınav" `assessment` ve "Sınav Takvimi" `examSchedule` ile karışmasın) · **ortak sınav** Bakanlığa ait kavram, OKSİS'te sütun adı yapılmaz · **tarama sınavı, hazır bulunuşluk uygulaması** (genelgedeki yasak türler) · **ham puan (net), standart puan, yüzdelik dilim** · **Doğru / Yanlış / Boş** · yeni ekranlarda "kazanım" yerine **öğrenme çıktısı** tercih edilmeli (öneri; doğrulanmadı).

---

## 8. Konu 5 — Velinin öğretmenden görüşme / toplantı talebi

### (a) Mevzuat ve resmî kaynaklar

- **İlkokul ve ortaokul:** Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği md. 78/11 (Ek: RG 28.07.2026/33323) — velinin idare veya öğretmenle öğrenci hakkındaki görüşme talebi okulun **Okul Randevu Sistemi** üzerinden alınan randevuyla yapılır [b2][b12].
- **Ortaöğretim:** yönetmelikte benzer hüküm görülmedi (parçalı tarama) [b1]; dayanak genelge: "Veli görüşmeleri, ülke genelinde yalnızca 'Okul Randevu Sistemi' üzerinden planlanarak yürütülecek"; randevusuz ziyaret yasak [b6][b14]. Özel okullar kapsamda [b6][b3].
- **Okul Randevu Sistemi kuralları** (MEB yardım sayfası) [b11]: öğretmenle en erken 2 gün sonrası (idare/rehberlik aynı gün), en fazla 14 gün ilerisi; 20 dakikalık randevu; veli öğrenci, öğretmen, tarih-saat ve görüşme konusu seçer; "İşlem Bekliyor" → kurum onaylar/iptal eder; e-posta ve SMS bildirimi; başlangıçtan 1 saat öncesine kadar iptal; personel MEBBİS ile girer.
- **Kanallar:** okulrandevu.meb.gov.tr (2024) [b10]; 16.05.2026'dan beri e-Okul VBS Mobil, BiP Okul-Veli Asistanı (OVA), MEBİM; okul veli adına randevu oluşturabilir; Bakanlık görüşmenin yapılıp yapılmadığını ve "konu başlığını" izleyebilir [b8]; 21.09.2026'dan beri MEBİM 444 0 632 ile 7/24 telefonla randevu [b9]. Görüntülü görüşmenin canlıda olup olmadığı **doğrulanmadı**.
- **Veli toplantısı:** sayı/zaman belirleyen hüküm bulunamadı; kavram Ortaöğretim md. 157/3'te tanınıyor [b1]. Genelgedeki "veli görüşmeleri"nin toplu toplantıyı kapsayıp kapsamadığı **doğrulanmadı**.
- **Okulun başlattığı görüşme:** Ortaöğretim md. 157/7-b ve İlköğretim md. 54/3-c — olumsuz davranış sürerse öğretmen veliyi okula davet eder [b1][b2].
- **Rehberlik gizliliği:** Rehberlik ve Psikolojik Danışma Hizmetleri Yönetmeliği md. 3/ç — danışan dosyası bilgisi izinsiz paylaşılmaz [b4]. → Görüşme tutanağını kapsam dışı tutma önerisini destekliyor.

### (b) Rakipler

**MEB Okul Randevu Sistemi** fiilî standart ve zorunlu kanal [b6][b11]. Okul Connect: veli için öğretmen görüşme randevusu, öğretmen için randevu yönetimi [b29c]. Edutime: ayrı randevu modülü yok, rehberlik görüşmeleri yol haritasında [b29a]. K12NET: yalnız bir blog başlığı (**doğrulanmadı**) [b29d]. Yurt dışı: SchoolCloud "parents' evening" slot dağıtımı [b30c].

### (c) Rol bazlı ihtiyaçlar (simülasyon — genelge bilinmeden, tam randevu akışı varsayılarak yürütüldü)

| Persona | Temel ihtiyaç | Tepki | Kırmızı çizgi / öneri |
|---|---|---|---|
| Okul yöneticisi | Kontrollü veli erişimi, şikâyeti erken görmek, veli toplantısı düzeni | Memnun — mesajlaşmadan güvenli | Tutanak birikmesi; cevapsız talep durumunu görmek ister (içeriği değil) |
| Müdür yardımcısı | Velinin kapıya gelmesini azaltmak | Memnun | Her talebin ona düşmesi |
| Branş öğretmeni | Ders dışında, belirli saatte görüşme | Kaygılı ama olumlu | Mesai dışı push; yüzlerce velinin talebi; cevap baskısı → görüşme saatleri, talep sınırı |
| Sınıf öğretmeni | Ailelerle düzenli randevu | Memnun | "Bu hafta dolu" diyebilmek |
| Rehber öğretmen | Hassas konulu randevular | Kaygılı | Konu alanında sağlık/aile bilgisi → kategori seçimi, kısa uyarılı metin |
| Veli | Kesin gün-saat, iptal/erteleme | Memnun | Cevapsız kalan talep; çok bildirim |
| Öğrenci (lise) | Hakkındaki görüşmeden haberdar olmak | Kaygılı | Bilgisi dışında planlanma (karar) |

Bu ihtiyaçların çoğu (görüşme saatleri, onay, iptal kuralı, cevap durumu) **MEB sisteminde zaten karşılanıyor.** OKSİS'in katkısı yönlendirme, toplu veli toplantısı ve okulun davet akışında kalıyor.

### (d) Önerilen kapsam

**Öneri: OKSİS ayrı bir veli–öğretmen randevu motoru kurmasın.** Mimarinin ayrı `Meetings` modülü önerisi (talep → öneri → onay → hatırlatma) bu bilgilerle zorunlu MEB sisteminin kopyası hâline geliyor; iki sistemde çift kayıt denetimde tutarsızlık ve veri minimizasyonu sorunu doğurur; kapı kontrolü MEB sistemine bakıyorsa OKSİS randevusu kapıda geçersiz kalabilir (**doğrulanmadı**).

**İlk dilim (S):**
1. **"Görüşme talep et" yönlendirmesi:** veli uygulamasında öğretmen kartı ve öğrenci sayfasında Okul Randevu Sistemi / e-Okul VBS derin bağlantısı, MEBİM numarası, kısa açıklama. Entegrasyon yok ("e-Okul entegrasyonu yok" ilkesine uygun).
2. **Veli toplantısı:** okul geneli veya şube veli toplantısı (tarih, saat, yer, gündem) duyuru ya da takvim etkinliği olarak; mevcut Duyuru hedeflemesi (kademe/şube) yeterli.
3. **Okulun davet bildirimi (opsiyonel):** "Okulunuz sizinle görüşmek istiyor; randevu Okul Randevu Sistemi'nden oluşturulacaktır." Randevunun kendisi MEB sisteminde.

**Sonra:** hukuk görüşü özel okulun MEB sistemine **ek olarak** kendi sistemini kullanabileceğini söylerse mimari Seçenek B; kurallar Okul Randevu Sistemi ile hizalanmalı (2 gün / 14 gün / 20 dakika / okul onayı / 1 saat önce iptal). Okul geneli veli toplantısı slot dağıtımı (SchoolCloud tipi) ayrıca.
**Kapsam dışı:** görüşme tutanağı ve notu (rehberlik verisi).

### (e) Mevcut modüllerle bağlantı ve veri modeli taslağı

- İlk dilim yeni aggregate gerektirmez: Duyurular (`AudienceDimension`), mobil Rehber ekranı (`ContactsController`, `contacts.view`; düğmenin yeri `contact-directory-screen.tsx`), veli öğretmen kartı. Davet bildirimi için alıcı çözümü `INotificationRecipientResolver`; öğretmen–öğrenci eşleşmesi yayınlı ders programı + sınıf rehber öğretmenliği (`ITeachingScope` taslağı).
- **Seçenek B gerekirse** (mimari taslak, `school` şeması): `MeetingRequest` (öğrenci, talep eden veli — oturumdan türetilir, öğretmen, konu kategorisi, kısa not, tercih/öneri slotları, `Status`: Requested → Proposed → Scheduled → Completed / Declined / Cancelled / Expired; tek kayıt, ADR 0014), opsiyonel `TeacherOfficeHours` (`DayOfWeek` Pzt=1, validator 1–5'i zorlar — ADR 0013'ün açık borcu tekrarlanmamalı), opsiyonel `ParentMeetingDay`. `TeacherAvailability` (ders programı üretimi için) **yeniden kullanılmamalı** — iki anlam taşırsa program üreticisi görüşme saatini ders kısıtı sanar.
- **ADR uyumu:** 0014, 0013, 0016 (ayrılan öğretmenin açık talepleri), 0006, 0020, 0024.

**Bildirim:** ilk dilimde `PARENT_MEETING_SCHEDULED` (toplu veli toplantısı; duyuru hattı) ve opsiyonel `PARENT_INVITED_TO_MEETING` (tek veli; uygulama içi + push, sessiz saati delmez). Seçenek B'de `MEETING_REQUESTED` (öğretmene, bekleyen iş), `MEETING_PROPOSED/SCHEDULED/DECLINED/CANCELLED`, `MEETING_REMINDER` (bir gün önce 17:00), `MEETING_REQUEST_EXPIRED`; grup `Messaging`.

### (f) KVKK ve güvenlik

Görüşme konusu alanı özel nitelikli veri içerebilir (sağlık, davranış, aile) → serbest metin yerine kategori [b8][b12]. Tutanak kapsam dışı (md. 3/ç [b4]). Seçenek B'de: veli yalnız çocuğuna o sezon ders veren ya da sınıf rehber öğretmeninden talep edebilir; `RequestedByPersonId` istemciden alınmaz (IDOR); not alanı HtmlSanitizer + uzunluk sınırı + kısa saklama; veli başına günlük talep sınırı.

### (g) Etki / efor / bağımlılık

Etki 3 · İlk dilim: S / S / S · Seçenek B: M / M / M (+ ofis saatleri +S; okul geneli veli toplantısı günü +L / +L / +M). Bağımlılık: genelge yorumu, hukuk görüşü (Seçenek B için).

### (h) Kararlar

OKSİS kendi randevu motorunu kursun mu (önerim: hayır)? · "Veli görüşmeleri" toplu toplantıyı kapsıyor mu (MEB/MEM yazısıyla teyit)? · Okulun davet bildirimi ilk dilimde mi? · Lise öğrencisi hakkındaki görüşmeden haberdar edilsin mi? → §10 K-37, K-45.

### (i) Terminoloji

**Veli görüşmesi** (bireysel) ve **veli toplantısı** (toplu) ayrı kavramlar · **Okul Randevu Sistemi** özel ad, değiştirilmez (basında "Veli Randevu Sistemi" de geçiyor) · MEB durum adları **"İşlem Bekliyor", "Onaylandı"** — OKSİS durum gösterecekse aynı sözcükler · **görüşme konusu** · **sınıf rehber öğretmeni** (ortaokul/ortaöğretim) / **sınıf öğretmeni** (ilkokul) · **rehber öğretmen / rehberlik servisi**. Sözlüğe öneri: `parentMeeting`; toplu toplantı için `parentAssembly` ya da `parentTeacherConference` (seçim Faruk'ta).

---

## 9. Konu 6 — Mesajlar

### (a) Mevzuat ve resmî kaynaklar

- **2026-2027 genelgesi** [b6]: "Ödev verme ya da bilgilendirmelerde Bakanlığın belirlediği dijital platformlar/uygulamalar haricindeki araçların kullanımından kaçınılarak bu hususta öğrencilere ve velilere gerekli yönlendirmeler yapılacak." Ayrıca öğrenciler sınıfta cep telefonu bulundurmayacak, öğretmenler sınıfta kullanmayacak; sosyal medyada pedagojik ve etik ilkeler.
- **Yorum farkları:** bir kaynağa göre hüküm resmî bilgilendirmede harici platformu (WhatsApp gibi) hedefliyor, velilerin kendi gruplarını değil [b17]; bir haber resmî WhatsApp sınıf gruplarının "devreden çıkarılacağını" yazıyor (**doğrulanmadı**) [b19]; bir kaynak genelgenin erişilebilen metninde "WhatsApp" adının geçmediğini, bazı sendikaların öğretmenlerin rızası dışında gruplara eklenmesine ve numaralarının paylaşılmasına karşı eylem kararı aldığını belirtiyor [b18].
- **"Bakanlığın belirlediği platformlar"** (bir eğitim sitesine göre): Yeni EBA, MEBİ, OGM Materyal, Velivizyon, Okul Randevu Sistemi, DİLİM, HEMBA, "Haberimiz Olsun" [b17]. Özel okulların sözleşmeli okul yönetim yazılımlarının bu listede olmadığı açık; **kullanımlarının hükme aykırı olup olmadığı doğrulanmadı — hukuk görüşü gerekli.** Hükmün dili "kaçınılarak": kesin yasak değil, yönlendirme.
- **Önceki düzenlemeler:** 2021 "Veri Talepleri" yazısı (okullar SMS/WhatsApp ile veri istemesin) ve 12.11.2024 tarihli WhatsApp yazısı — yalnız basın aktarımları, **doğrulanmadı** [b20].
- **Görüntü paylaşımı:** İlköğretim Yönetmeliği md. 78/7 (Ek: RG 14.10.2023/32339) — etkinlik fotoğraf ve videoları sosyal medya veya **mesajlaşma gruplarında** paylaşılamaz; yayım yalnız yazılı izinle [b2]. → Mesaj ekleri için doğrudan ilgili.
- **Öğrenci verisi:** md. 78/8 (Ek: RG 28.07.2026/33323) ve Ortaöğretim md. 158/4 KVKK'ya atıf [b1][b2]; MEB Temmuz 2026 yazısı personel iletişim bilgileri dâhil verilerin kamuya açık yayımlanmasını yasaklıyor [b21].
- **Delil:** Ortaöğretim md. 164 (bilişim araçlarının kurala aykırı kullanımı, izinsiz kayıt, hakaret disiplin suçu) → mesaj içeriği disiplin sürecinde delil olabilir; silme/düzenleme iz bırakmalı (**hukuk teyidi**) [b1].
- **Resmî bildirim aracı:** mevzuat devamsızlığın e-posta/kısa mesajla bildirilmesini tanıyor (Ortaöğretim md. 36/4, İlköğretim md. 18/2-b) ama belirli bir platform şart koşmuyor [b1][b2].
- **e-Okul VBS'de** veliden öğretmene mesaj kutusu bulunamadı (**doğrulanmadı**); VBS'deki veli–okul iletişimi randevu [b8][b9].

### (b) Rakipler

Edutime: veli, öğretmen ve kurum arasında canlı sohbet, "telefon numaraları paylaşılmadan" iletişim; öğrenci uygulamasında da mesajlaşma [b29a]. OkulAile: okunma takipli duyuru ve mesajlaşma [b29b]. K12NET: kullanıcı yorumunda "mesaj gönderimi" (kapsam **doğrulanmadı**) [b29d]. Okul Connect: mesajlaşma yok, "Dijital Aile İletişim Defteri" var [b29c]. Yurt dışı: ClassDojo "Quiet Hours" (öğretmen bildirim almayacağı saatleri tanımlar) [b30a]; Remind "office hours" dışı uyarısı ve yöneticinin mesaj geçmişini talep edebilmesi [b30b]. **Ortak desen:** numarayı gizleyen kurum içi kanal, sessiz saatler, yönetici erişimli geçmiş. Türk rakiplerin öğretmen–öğrenci mesajını nasıl sınırladığı **doğrulanmadı**.

### (c) Rol bazlı ihtiyaçlar (simülasyon)

| Persona | Temel ihtiyaç | Tepki | Kırmızı çizgi / öneri |
|---|---|---|---|
| Okul yöneticisi | Kayıtlı, okul kontrolünde iletişim; WhatsApp'tan çıkış; şikâyette kanıt | Memnun, güçlü çekinceyle | Platformun tüm okulların mesajını görmesi (ADR 0008); öğretmen–öğrenci özel yazışması → yönetici yalnız şikâyet edilen mesajı ya da gerekçeli, izli incelemeyle okusun |
| Müdür yardımcısı | Velinin idareye yazabilmesi | Karışık — v1'de idare dışarıda | 07:45 bombardımanı → idare kanalı sonra, kategorili ve hız sınırlı; acil konular form/bildirim |
| Branş öğretmeni | Velinin yazması, ama yük | **Kaygılı / ağırlıklı reddeder** ("yeni bir WhatsApp") | Mesai dışı push, okundu bilgisi baskısı, kişisel telefonuna taciz → okundu kapatılabilir, mesai saati tercihi, otomatik "ertesi gün yanıt", veli başına sınır |
| Sınıf öğretmeni | 25 aileyle sürekli iletişim | Karışık | Toplu bilgi duyuruyla gitsin, mesaj birebir |
| Veli | İki çocuğun öğretmenlerine tek yerden yazmak | Memnun, bildirim yorgunluğu kaygısı | Push'ta metin yok; 5 dk birleştirme; konuşma öğrenci bağlamlı |
| Öğrenci (lise) | Öğretmene doğrudan yazmak | **Hayal kırıklığı** — v1'de yok, WhatsApp'a döner | Velinin/okulun mesajlarını okuması |
| Öğrenci (ortaokul) | — | Nötr | Öğrenci↔öğretmen kapalı kalsın |

**Panelin en çok gerilim çıkan konusu:** yönetici denetim ister, öğretmen denetimden ve yükten çekinir, veli hızlı cevap bekler, öğrenci kanal dışında kalır.

### (d) Önerilen kapsam

**Ön koşullar (hepsi çözülmeden başlanmamalı):** (1) genelge hükmü için hukuk görüşü — ürün geneli soru, Ödev ve Duyuru'yu da kapsar; (2) **ADR 0008'in uygulanması**; (3) 2026-10-05 "plan dışı" kararının geri alınması (K-X4).

**İlk dilim (izin çıkarsa):**
1. Yalnız **veli ↔ öğretmen, birebir, öğrenci bağlamlı**: veli yalnız `CanViewInfo` bayrağı açık aktif ilişkisi olan öğrencinin **aktif sezon yayınlı programında ders veren** ya da **sınıf rehber öğretmeni** olan öğretmenle konuşma açabilir; kardeşler için ayrı konuşmalar.
2. **Öğrenci mesajlaşması kapalı** (ürün ilkesi, `genel/urun-tanimi.md:41`); grup sohbeti yok; toplu bilgi Duyurular'dan.
3. **Görüşme saatleri ve sessiz saat:** öğretmen yanıt saatlerini tanımlar; dışında yazan veli uyarı görür; sessiz saatte push yok. Öğretmen mesai koruması **alıcı tercihi** olarak (K-34 ile uyumlu; okul düzeyinde kanal zorlaması K-34'e aykırı).
4. **Numara gizli:** hiçbir yüzde telefon yok.
5. **Ek yok** (md. 78/7 riski); gerekirse yalnız PDF, öğrenci fotoğrafı uyarısıyla.
6. **İçerik görünürlüğü:** yönetici şikâyet edilen mesajı okur + gerekçeli ve izli inceleme (break-glass); her okuma denetim kaydı ve taraflara bilgi; aydınlatma metninde açıkça.
7. **Görüşmeye yönlendirme:** konu uzarsa Okul Randevu Sistemi bağlantısı.

**Akışlar:** Veli: öğrenci sayfası → Öğretmenler → "Mesaj gönder" → konuşma; yanıtta push yalnız "X öğretmen size yanıt verdi". Öğretmen: öğrenciye göre gruplanmış gelen kutusu, okunmamış rozeti, yanıt saatleri ayarı, "konuşmayı yönetime bildir".
**Sonra:** idare katılımcısı (ParentAdmin); öğretmen–öğrenci mesajı yalnız lisede, okul onayı ve veli görünürlüğüyle, ayrı çocuk koruma değerlendirmesi ve ADR'den sonra.

### (e) Mevcut modüllerle bağlantı ve veri modeli taslağı

Yeni modül `Messaging`, şema `school` (ya da ayrı `messaging`, K-X1). Gerçek zamanlı: mevcut `NotificationHub` hesap grubu; konuşma grubu açılırsa `tenant:{schoolId}:conv:{id}`. Katılımcılar `PersonId` ile bağlanır (ADR 0009; `Kişi.md`). `domain-model-rules.md:218-230`'daki `Conversation` taslağı (ParentTeacher/StudentTeacher/Group) bu öneriden geniştir.

| Aggregate | Temel alanlar | Not |
|---|---|---|
| `Conversation` (kök) | `SchoolId`, `AcademicSessionId`, `Kind` (ParentTeacher; ileride ParentAdmin), `StudentPersonId`, `TeacherPersonId`, `ParentPersonId`, `Status` (Open / ReadOnly / Archived), `ReadOnlyReason?`, `LastMessageAt` | **Öğrenci bağlamı ilk günden zorunlu** — sonradan eklemek mevcut konuşmaların hangi çocuğa ait olduğunu bilinemez kılar |
| `ConversationParticipant` | `PersonId`, `Role`, `LastReadMessageId`, `MutedUntil?` | Okundu katılımcı başına |
| `Message` (ayrı tablo, sayfalı) | `ConversationId`, `SenderPersonId`, `Body` (düz metin), `SentAt`, `EditedAt?`, `DeletedAt?`, `AttachmentFileIds[]` | Silme/düzenleme iz bırakır (delil) |
| `MessageReport` | `MessageId`, `ReportedByPersonId`, `Reason`, `Status` | Yönetici şikâyet kuyruğu |

İlişki iptalinde (`ParentStudentRevokedEvent`) konuşma ReadOnly; öğretmen dersten/sınıf rehber öğretmenliğinden çıkınca yeni mesaj kapanır, geçmiş okunur; sezon arşivinde Archived (ADR 0006); kadrodan ayrılan öğretmende ReadOnly (ADR 0016).

**ADR uyumu:** 0007 (yeni rol yok), **0008 / 0019 — platform hesapları mesaj içeriğini görmemeli; bugün süper yönetici için tenant süzgeci kısa devre olduğundan 0008 uygulanmadan canlıya alınmamalı (kritik)**, 0009, 0010/0011, 0012 (O1 alıcı karşı taraf, O4 sessiz saat), 0024 (öğrenciye mesaj yok).

**Bildirim (yeni grup `Messaging`):** `MESSAGE_RECEIVED` (karşı taraf; uygulama içi + push; sessiz saatte ertelenir; aynı konuşmadan 5 dk içinde tek push; gövdede mesaj metni yok), `MESSAGE_REPORTED` (yöneticiler; bekleyen iş), `CONVERSATION_READ_ONLY` (iki taraf; iptal gerekçesi yazılmaz — aile hukuku hassasiyeti).

### (f) KVKK, güvenlik ve çocuk iletişimi

1. **Genelge uyumu (en büyük risk):** iki savunulabilir okuma — (A) hüküm kişisel, kayıtsız, okul denetimi dışındaki kanalları hedefliyor, kayıtlı OYS bunun çözümü; (B) yalnız Bakanlık platformları. Hangisinin geçerli olduğu **doğrulanmadı**; mevcut Ödev ve Duyuru modüllerini de etkiler.
2. **Öğretmen–çocuk özel iletişimi** çocuk koruma bakımından en riskli alan → v1'de kapalı.
3. **Öğretmenin telefon numarası** kişisel veri; Rehber ekranı bugün yalnız yönetici ve öğretmene açık — korunmalı; kanal numara paylaşımına gerek bırakmamalı.
4. **Mesai dışı iletişim:** Türk mevzuatında öğretmen için "bağlantıyı kesme hakkı" bulunamadı (**doğrulanmadı**); sendika kararları konuyu tartışmaya açtı [b18] → sessiz saat ve yanıt beklentisi ürün tarafında çözülmeli.
5. **Saklama ve delil:** silme/düzenleme denetim kaydı bırakır; süre KVKK md. 4/2-d ve md. 7 çerçevesinde hukukla belirlenir (öneri: sezon arşivinden sonra 2 sezon, **teyit gerekli**); KVKK silme talebinde karşı tarafın verisi de konuşmada olduğundan tek taraflı silme değil anonimleştirme.
6. **Özel nitelikli veri:** veliler mesajda sağlık bilgisi paylaşacak → aydınlatma + "sağlık bilgisini okul sağlık formuyla iletin" yönlendirmesi.
7. **Yurt dışına aktarım:** push içeriği Google/Apple sunucularından geçer (KVKK md. 9, 7499 sonrası) [b24][b33] → push gövdesinde metin olmaması bu riski de azaltır; aktarım mekanizması hukukça teyit edilmeli.
8. **Teknik:** düz metin, HTML yok; ek varsa virüs taraması ve kota; kullanıcı başına dakikada N mesaj hız sınırı; tenant + katılımcı kapsamı iki katmanlı; 401/403/cross-tenant/"başka velinin konuşması" IDOR testleri. Uçtan uca şifreleme yok (denetim gereği); depolama şifrelemesi **doğrulanmadı**.

### (g) Etki / efor / bağımlılık

Etki 4 · İlk dilim: L / M / L (+ ParentAdmin +S/+S/+S; öğrenci↔öğretmen +M/+S/+M). Bağımlılık: **hukuk görüşü, ADR 0008 uygulaması (kritik)**, `ITeachingScope`, K-X1, K-X3 (`messaging` okul kataloğunda yok), K-X4, push birleştirme/throttle.

### (h) Kararlar

"Plan dışı" kararı geri alınıyor mu? · Genelge için hukuk görüşü alınacak mı? · v1 yalnız veli↔öğretmen mi, idare katılımcı mı? · Yönetici içerik erişimi hangi koşulda? · Push önizlemesi? · Okundu bilgisi? · Saklama süresi? · Silme/düzenleme hakkı? · Öğrenci↔öğretmen bu tur kesin kapalı mı? → §10 K-37, K-42, K-46, K-47, K-48.

### (i) Terminoloji

**Mesaj** (`message`, sözlükte var, rota `/messages`) · **Konuşma** (sözlüğe öneri `conversation`) · toplu iletişim **Duyuru** olarak kalmalı; mesaj–duyuru ayrımı sözlükte netleşmeli · **Veli Bilgilendirme Sistemi (VBS)** MEB adı · "sınıf annesi", "veli grubu" gayriresmî, ürüne alınmamalı.

---

## 10. Faruk'tan alınması gereken ürün kararları (K-xx önerisi)

Son kullanılan numara K-35 olduğundan öneriler K-36'dan başlar. Hiçbiri kilitlenmedi; numaralar yalnız öneridir. Ajan çıktılarındaki soru listeleri (mimari §1.4 K-X1…K-X5 ve özellik bazlı (g) soruları, eğitim uzmanı S-1…S-6 ve 4–6 için 7 soru, paydaş paneli 20 soru) burada birleştirildi.

| Öneri | Karar | Seçenekler ve öneri | Etkilediği konular |
|---|---|---|---|
| **K-36** | REQ-034 kapsamı: hangi konular pilota alınıyor ve hangi sırayla? | Öneri: §2 sırası; altısı da bugün `mvp-kapsami.md` §3'e göre MVP dışı | Hepsi |
| **K-37** | 2026-2027 genelgesi için hukuk görüşü | (a) "Bakanlık platformları dışındaki araçlardan kaçınma" hükmü OKSİS Ödev/Duyuru/Mesaj'ı nasıl etkiler? (b) Özel okul MEB randevu sistemine ek kendi randevu sistemini kullanabilir mi? (c) Deneme yasağının okul yönetim yazılımına etkisi. Pilot okulların il/ilçe MEM'den aldığı yazı var mı? | 4, 5, 6 + mevcut Ödev/Duyuru |
| **K-38** | Yeni roller (ADR 0007 revizyonu) | Öneri: ilk turda yeni rol yok, işi okul yöneticisi yapar; muhasebeci rolü Ödemeler canlıya çıkarken ayrı ADR ile; şoför/rehber personele hesap yok | 1, 2, 3 |
| **K-39** | Ödeme modeli ve sorumluluk | (a) Para tutmama ilkesi onaylanıyor mu? (b) Online ödeme: okulun sanal POS'u mu, lisanslı ödeme kuruluşu mu (hukuk görüşü)? (c) Ödeme sorumluluğu `ParentStudentRelationship` mı `ParentProfile` mı (Ç-12)? (d) Fatura OKSİS'te mi, dışa aktarım mı? (e) Borç hiçbir modülü etkilemesin (öneri) | 3 |
| **K-40** | Şema yeri ve modül kataloğunun tek kaynağı | Öneri: `finance` ayrı şema, deneme `academic`, diğerleri `school`; modül anahtarları için tek katalog (okul seed'i ile `master.plan_modules` hizalanır; `eokul` anahtarı gözden geçirilir) | Hepsi |
| **K-41** | Servis kapsamı | (a) Yalnız statik bilgi mi? (b) Canlı konum hiç yapılacak mı; yapılacaksa taşımacının sisteminden mi? (c) "Bugün binmeyecek" bildirimi kime, şoföre nasıl ulaşır (SMS yok)? (d) Gecikme/iptal sessiz saati deler mi? | 2 |
| **K-42** | Saklama süreleri politikası | Mesaj, ödeme, konum, sınav sonucu, görüşme kaydı için tek saklama tablosu; hukuk teyidi | 2, 3, 4, 5, 6 |
| **K-43** | Deneme sınavı | (a) Bu tur yapılmasın (öneri) mı, MVP-0 mı? (b) Hedef kitlede özel öğretim kursu var mı? (c) Deneme karneye girmez (öneri) | 4 |
| **K-44** | Yemek menüsü | (a) Kademe bazlı mı, tek menü mü? (b) Alerji eşlemesi ayrı tur mu (öneri: evet, rıza ve dar rolle)? (c) "Yemekhane yoklaması" kapsam dışı ise katalog metni düzeltilsin | 1 |
| **K-45** | Görüşme | (a) OKSİS randevu motoru kurmasın (öneri) — yönlendirme + veli toplantısı + davet bildirimi; (b) toplu veli toplantısının genelge kapsamı MEB/MEM yazısıyla teyit; (c) lise öğrencisi görüşmeden haberdar edilsin mi? | 5 |
| **K-46** | Mesajlaşmanın durumu | 2026-10-05 "plan dışı" kararı geri alınıyor mu? Alınmıyorsa `mvp-kapsami.md`'deki ✅ işaretleri ve web menüsü düzeltilmeli | 6 |
| **K-47** | Mesajlaşma kapsamı ve ön koşulu | (a) ADR 0008 uygulanmadan canlıya çıkmaz (öneri, kritik); (b) v1 yalnız veli↔öğretmen; idare sonra; (c) öğrenci↔öğretmen bu tur kesin kapalı | 6 |
| **K-48** | Mesajlaşma kuralları | (a) Yönetici içerik erişimi: yalnız şikâyet + gerekçeli/izli inceleme (öneri); (b) öğretmen mesai koruması alıcı tercihi olarak; (c) okundu bilgisi gösterilsin mi; (d) push'ta metin yok (öneri); (e) silme/düzenleme hakkı ve izi | 6 |
| **K-49** | SMS kanalı | Taksit hatırlatması ve servis için SMS kanalı açılacak mı (maliyet; K-34 sonrası bildirim hattında yok)? | 2, 3 |
| **K-50** | Sözlük önerileri | `mealMenu`, `allergen`, `busRoute`, `transportProvider`, `busAttendant`, "Ücretsiz Okutma (MEB)", `mockExam`, `conversation`, `parentMeeting`, toplu toplantı karşılığı, "öğrenme çıktısı" | Hepsi |


**Terminoloji denetiminin açık bıraktığı noktalar** (karar gerektirdiği için metinde düzeltilmedi; K-50 kapsamında):
1. **"Rehber öğretmen" belirsizliği.** §7(d) MVP-0'daki "rehber öğretmen yalnız kendi rehberlik sınıfının kartlarını görür" ifadesi şube bazlı **sınıf rehber öğretmenini**, aynı bölümdeki tercih danışmanlığı ise okulun **rehber öğretmenini** (psikolojik danışman) anlatıyor; §8(c)'deki persona da aynı belirsizliği taşıyor. Ayrım yetki kapsamını değiştirir.
2. **Servis adları.** Sözlük önerileri (`busRoute`, `transportProvider`, `busAttendant`) ile veri modeli taslağı (`ShuttleRoute`, `ContractorName`, `SHUTTLE_*`) uyuşmuyor; bilinçli bir alias kararı gerekir. Bildirim grubu adı `Services` (yemek + servis) "servis" (okul servis aracı) ile karışabilir.
3. **Sözlük ile ADR 0007 çelişkisi.** `oksis-ui/CLAUDE.md` sözlüğünde "Muhasebeci (`accountant`), users rolü" satırı duruyor; aynı tablonun Rehber satırı ve ADR 0007 muhasebecinin sistem rolü olmadığını söylüyor.
4. **"Sınav" çakışması.** `naming-conventions.md` "Sınav = `Exam`", UI sözlüğü "Sınav = `assessment`" diyor; `MockExam` alias'ı eklenmeden önce domain notunda netleşmeli.
5. **Sezon / eğitim-öğretim yılı / öğretim yılı.** Rapor OKSİS kavramı için "Sezon", mevzuat için "eğitim-öğretim yılı", yönetmelik alıntısında "öğretim yılı" kullanıyor; arayüzde karışmamalı.

---

## 11. Paydaş paneli: konular arası öncelik (simülasyon, ölçüm değildir)

| Konu | Yönetici | Müdür yrd. | Branş öğr. | Sınıf öğr. | Veli | Öğrenci (lise) | Öğrenci (ortaokul) |
|---|---|---|---|---|---|---|---|
| Yemek menüsü | 3 | 3 | ilgisiz | 4 | 2 | 4 | 2 |
| Servis | 4 | 1 | ilgisiz | 5 | 3 | 5 | 3 |
| Ödemeler | 1 | 5 | **hiç istemez** | **hiç istemez** | 1 | **hiç istemez** | **hiç istemez** |
| Deneme sınavı | 5 | 6 | 2 | 6 | 4 | 1 | 4 |
| Görüşme talebi | 2 | 4 | 1 | 1 | 5 | 6 | 6 |
| Mesajlar | 6 (çekinceli) | 2 | 3 (ağırlıklı reddeder) | 2 | 1–2 | 3 (v1'de dışarıda) | 5 |

**Ayrışma noktaları:** ödemelerin değer–görünürlük gerilimi; canlı konum (müdür yrd./veli ↔ yönetici); mesaj denetimi (yönetici ↔ öğretmen ↔ öğrenci); alerji eşlemesi (sınıf öğretmeni ↔ yönetici); cevapsız talebin idareye yükselmesi (yönetici/veli ↔ öğretmen); öğrenci↔öğretmen mesajı (lise öğrencisi ↔ yönetici/veli); okul geneli deneme panosu (yönetici ↔ öğretmen).

**Simülasyonun sınırları:** personalar kurgusal; ilkokul öğrencisi ve okul öncesi/kreş farklılıkları kısmen yansıdı; panel konu 4–6 mevzuat bulgularını görmeden yürütüldü; hiçbir rakam üretilmedi. Bildirim yorgunluğu, öğretmen mesai yükü ve yönetici denetim ihtiyacı pilot okullarda doğrulanmalı.

---

## 12. Tespit edilen belge–kod çelişkileri

Görev kapsamı mevcut belgelerin değiştirilmesini yasakladığı için düzeltilmedi; her biri bulgu olarak kayda alınmalı (kural 8: kod kazanır, çelişki sessiz bırakılmaz).

| # | Belge | Belgedeki iddia | Kod / gerçek | Önerilen düzeltme |
|---|---|---|---|---|
| Ç-1 | `genel/mvp-kapsami.md:71,77,83` | Mesajlaşma API ve UI (web + mobil) ✅ | `Modules/Messaging/.gitkeep` dışında hiçbir şey yok [Kod] | ✅ kaldırılmalı ya da "planlanan"; aynı belgedeki diğer ✅'ler (Karne PDF, Dashboard, Excel import, sezon sihirbazı) ayrıca ölçülmeli (bu turda ölçülmedi) |
| Ç-2 | `bulgular/OKSİS - Bulgu Arşivi.md:997` (TB-13) | Boş klasörlere "bilinçli olarak boştur" README kondu | `Messaging` ve `Dashboard` altında yalnız `.gitkeep` | TB-13 yeniden açılmalı ya da not düzeltilmeli |
| Ç-3 | `raporlar/OKSİS — Bildirim Altyapısı İnceleme Raporu.md:182` | "Messaging README'si 'henüz yazılmadı' diyor" | README yok | Not düzeltilmeli |
| Ç-4 | `domain/kararlar/0012-bildirim-ilkeleri.md` "Uygulama durumu" | Okul olay bazında uygulama içi satırı kapatabilir; sessiz saati delen işaret kodda yok | K-34 okul matrisini kaldırdı; `PushQuietHours.Bypasses` acil duyuru için var | Uygulama durumu K-34 sonrasına güncellenmeli |
| Ç-5 | `domain/kavramlar/Bildirim Türü.md:29,35` | Katalog okul matrisini besler; acil duyuru yer tutucu | Matris kalktı; `ANNOUNCEMENT_URGENT` `delivered: true` | domain-map ile yeniden üretilmeli |
| Ç-6 | `NotificationEventTypeSeedData.cs:238-240` (kod yorumu) | "Push'u yayınlayan seçer" | K-34 sonrası yayınlayıcı kanal seçimi yok | Kod yorumu bayat (ayrı kod işi) |
| Ç-7 | `teknik/mimari/notification-rules.md` §3–§6, §9.2 | Öncelik enum'u, tercih tablosu kolonları, şablon tablosu | Tercih yalnız `PushEnabled`; enum ve şablon tablosu bulunamadı (kısmen doğrulandı) | Taslak bölümler "hedef mimari" diye işaretlenmeli |
| Ç-8 | `teknik/mimari/security-rules.md` §3.1 | Sekiz rol | ADR 0007: beş rol | ADR 0007'ye hizalanmalı |
| Ç-9 | `teknik/mimari/multi-tenant-rules.md` §3 ve §5 | Kod örneği süper yöneticiyi muaf tutuyor; §5 "muafiyet yok" | Belge kendi içinde çelişkili; süzgeç kodu bu turda okunmadı | Ölçülüp tek dile indirilmeli |
| Ç-10 | `teknik/kurallar/backend/database-rules.md` §16 | `school` = okul aggregate'i ve ayarları | Duyurular ve Kulüpler `school` şemasında | §16.5'e "okul operasyonel modülleri → school" satırı ya da taşıma kararı |
| Ç-11 | Modül katalogları | — | Okul kataloğu `finance/cafeteria/transport`, plan kataloğu `messaging`; `eokul` Beta anahtarı "e-Okul entegrasyonu yok" kuralıyla çelişiyor | Tek kaynak kararı (K-40) |
| Ç-12 | `domain/kavramlar/Veli-Öğrenci İlişkisi.md`, `Profil.md` | Ödeme sorumluluğu iki yerde | `ParentStudentRelationship.IsPaymentResponsible` ve `ParentProfile.IsPaymentResponsible` iki bağımsız alan [Kod] | Finans öncesi karar zorunlu (K-39c) |
| Ç-13 | `teknik/kurallar/backend/domain-model-rules.md:230` | "Detay messaging kuralları: `business-rules.md` §6" | Hedef belge bulunamadı | Kırık atıf |
| Ç-14 | `PAYMENT_REMINDER` seed satırı | `supportsSms: true, sms: true` | K-34: bildirim hattında SMS kanalı yok | Katalog alanı K-34'le hizalanmalı |

---

## 13. Ek — ekibin tespit ettiği diğer yeni özellik adayları

| Aday | Kanıt | Not |
|---|---|---|
| **Karne yayını** | `REPORT_CARD_PUBLISHED` `delivered: false`; ADR 0001 "karne modülü yazılmadı"; `mvp-kapsami.md` Sprint 3 "Karne PDF ✅" | Pilot başarı ölçütüne en yakın eksik; ağırlık kararı (0001) burada açılır |
| **Mobilde parola değiştirme** | Envanter raporu: uç ve hook var, mobil `/planned`'a gidiyor | Özellik değil kusur; en ucuz kazanım |
| **Veli ders programı ekranı** | Envanter raporu: uç var, ekran yok | Yalnız arayüz |
| **Akademik takvim** | Web `/academic-calendar` yer tutucu | Tatil, sınav penceresi, kulüp etkinliği mevcut veriden tek takvimde |
| **Teslim alma yetkisi doğrulaması** | `CanPickup` + `DailyLeave` | Servisle ortak "teslim yetkisi" kavramı |
| **Kütüphane** | `library` anahtarı okul kataloğunda açık; mobilde "plan dışı" | Modül yok |
| **e-Okul dışa aktarım dokümanı** | `eokul` Beta anahtarı | Entegrasyon değil, dışa aktarım; anahtar adı yanıltıcı |
| **SMS kanalı** | `ISmsSender` var, bildirim hattında yok | Maliyet kararı (K-49) |
| **Rehberlik / disiplin kayıtları** | `mvp-kapsami.md` Sprint 5+ | Özel nitelikli veri riski yüksek; ayrı KVKK çalışması |
| **Okul geneli veli toplantısı slot dağıtımı** | §8(d) | Genelge kapsamı teyit edildikten sonra |

## 14. ADR aday listesi (hiçbiri yazılmadı)

| Aday | Konu | Revize ettiği | Geri alma maliyeti |
|---|---|---|---|
| ADR-0025 | Yeni modüller çekirdeğe yalnız okuma soyutlamalarıyla bağlanır (mimari testle korunur) | `mimari-kurallar.md` §3 | Düşük |
| ADR-0026 | Finans: append-only defter, kart verisi tutulmaz, fon tutulmaz, ödeme sağlayıcı modeli | — | Yüksek (defter modelinden dönmek veri anlamını değiştirir) |
| ADR-0027 | Muhasebeci rolü (açılırsa) | 0007 | Orta (rol kodu ve göç) |
| ADR-0028 | Mesajlaşma kapsamı: öğrenci bağlamlı veli↔öğretmen, yönetici erişimi, saklama | `urun-tanimi.md` ilkesi | Yüksek (öğrenci bağlamı sonradan eklenemez) |
| ADR-0029 | Deneme sınavı not modülünden ayrıdır, karneye girmez, sıralama tutulmaz | 0001 sınırı | Düşük |
| (Şema) | Finans ve mesaj tablolarının şeması | `database-rules.md` §16.5 | Orta (`ALTER SCHEMA TRANSFER` + blue-green) |

## 15. Doğrulanamayan noktalar (özet)

**Mevzuat:** Özel Öğretim Kurumları Yönetmeliği md. 53–61 numaralandırması ve tam metni; 2026–2027 ücret artış tavanı rakamları; ücret ilanında peşin/taksit koşulu zorunluluğu; 5580 md. 13 %3 oranı; 2011 indirim kademeleri; Okul Servis Araçları Yönetmeliği'nin konsolide hâli ve 2025 kamera hükmü; İBB kamera kararının yürürlüğü; besin alerjisine özgü bağlayıcı düzenleme (bulunamadı); alerjen maddesinin numarası; 2016 kantin genelgesi sayısı; Okul Gıdası erteleme tebliği; 2026-2027 genelgesinin tam metni ve "2026/70" sayısı; LGS/YKS yanlış-doğru oranları; "öğrenme çıktısı" terim geçişi; Ortaöğretim'de randevu hükmü; "veli görüşmeleri"nin toplu toplantıyı kapsaması; "Bakanlığın belirlediği platformlar" listesi ve özel okul OYS'lerinin durumu; 2014/2021/2024 MEB yazılarının resmî metinleri; MEB Temmuz 2026 yazısının özel okulları kapsaması; öğretmen için "bağlantıyı kesme hakkı"; reşit öğrencinin verisinin veliyle paylaşım dayanağı.
**KVKK / vergi / ödeme:** 2018/10 kararının 7499 sonrası hâli; 2026/921 İlke Kararı'nın RG bilgisi; KDV oranları; VUK/TTK saklama süreleri; kart taksit sınırı; PCI SAQ türü; 6493 kapsamında ödeme modeli değerlendirmesi; e-fatura yükümlülüğü; push sağlayıcıyla yurt dışı aktarım mekanizması.
**Rakipler:** Power Kids web özellikleri; K12NET finans, mesaj, randevu ve deneme ayrıntıları; "Okulsis" ve "OKULİS" adlı ürünler aramada bulunamadı; taşımacı takip sistemleri için ortak entegrasyon standardı; rakiplerin genelge sonrası ürün değişikliği; okulların deneme yasağına uymadığı haberi (tek kaynak).
**Kod / belge:** `mvp-kapsami.md`'deki diğer ✅ işaretleri; tenant süzgecinin süper yönetici davranışı (ADR 0008 belgesine dayanıldı, süzgeç kodu okunmadı); depolama şifrelemesi; `business-rules.md` §6 hedefi.

## 16. Yöntem ve sınırlar

- Dört alt iş: (1) eğitim alan uzmanı — konu 1–3 mevzuat ve rakip (55 kaynak); (2) yazılım mimarı — altı konunun kod/ADR bağlantısı, veri modeli, bildirim, güvenlik, efor; (3) eğitim alan uzmanı — konu 4–6 mevzuat ve rakip (33 kaynak); (4) paydaş paneli — persona simülasyonu. Birleştirme ve çelişki çözümü ürün lideri tarafından yapıldı; MEB terminolojisi eğitim alan uzmanınca ayrıca denetlendi.
- Kod çalıştırılmadı, test koşulmadı. Lider şu kod iddialarını ayrıca doğruladı: `Modules/Messaging/` içinde yalnız `.gitkeep`; Domain'de `Messaging` klasörü yok; okul kataloğunda `finance`/`transport`/`cafeteria` satırları; web `/messages` → `PlannedScreen`; `IsPaymentResponsible`'ın iki ayrı varlıkta bulunması; `PAYMENT_REMINDER`/`PAYMENT_RECEIVED` seed satırları.
- Mimari değerlendirme ve paydaş paneli 2026-2027 genelgesi bilinmeden yürütüldü; konu 4 ve 5 için önerileri bu raporda genelge ışığında düzeltildi (§2, §7(d), §8(d)).
- Hukuki konuların hiçbiri hukuk görüşü değildir.

---

## Kaynakça (erişim tarihi: 2026-10-15)

### A — Konu 1–3 (yemek, servis, ödemeler) dış kaynakları

**Servis**
- **[a1]** Resmî Gazete, 25.10.2017 / 30221, *Okul Servis Araçları Yönetmeliği* (özgün metin): https://www.resmigazete.gov.tr/eskiler/2017/10/20171025-2.htm [O]
- **[a2]** Aile ve Sosyal Hizmetler Bakanlığı, *Okul Servis Araçları Yönetmeliği* sayfası: https://aile.gov.tr/eyhgm/mevzuat/ulusal-mevzuat/yonetmelikler/okul-servis-araclari-yonetmeligi/ [O]
- **[a3]** MEB, "Okul Servis Araçları Yönetmeliği Resmî Gazete'de Yayımlandı" (2017): https://meb.gov.tr/okul-servis-araclari-yonetmeligi-resmi-gazetede-yayimlandi/haber/14808/tr [A]
- **[a4]** Alomaliye, Okul Servis Araçları Yönetmeliğinde Değişiklik (29.11.2024, RG 32737): https://www.alomaliye.com/2024/11/29/okul-servis-araclari-yonetmeliginde-degisiklik-29-11-2024/ · TRT Haber: https://www.trthaber.com/haber/ekonomi/okul-servislerinde-degisiklik-yapilmasina-dair-yonetmelik-resmi-gazetede-890013.html [A]
- **[a5]** Diken, "Okul servis araçları yönetmeliği değişti" (29.11.2024): https://www.diken.com.tr/?p=1503194 [O]
- **[a6]** MEB, "Okul Servis Araçları Yönetmeliğinde Değişiklik Yapılmasına Dair Yönetmelik Resmî Gazete'de Yayımlandı" (19.08.2025): https://www.meb.gov.tr/okul-servis-araclari-yonetmeliginde-degisiklik-yapilmasina-dair-yonetmelik-resmi-gazetede-yayimlandi/haber/38079/tr [O]
- **[a7]** Alomaliye, Okul Servis Araçları Yönetmeliğinde Değişiklik (19.08.2025, RG 32991): https://www.alomaliye.com/2025/08/19/okul-servis-araclari-yonetmeliginde-degisiklik-19-08-2025/ [A]
- **[a8]** NTV, "Veliler dikkat... Okul servisleriyle ilgili önemli değişiklik": https://www.ntv.com.tr/ntvpara/veliler-dikkat-okul-servisleriyle-ilgili-onemli-degisiklik,c5DPnRfNyEKeychXea8jQw [A]
- **[a9]** Medyascope, "İstanbul'da okul servis araçlarına kamera zorunluluğu geldi" (25.09.2025): https://medyascope.tv/2025/09/25/istanbulda-okul-servis-araclarina-kamera-zorunlulugu-geldi/ [O]
- **[a10]** Memurlar.net, "MEB'den özel okullara servis ücretleri tespiti ve ilan uyarısı" (ÖÖKGM 29.09.2025 / 142379667 yazısı): https://www.memurlar.net/haber/1148366/meb-den-ozel-okullara-servis-ucretleri-tespiti-ve-ilan-uyarisi.html [O]

**Ödemeler**

- **[a11]** MEB Özel Öğretim Kurumları Genel Müdürlüğü, Sıkça Sorulan Sorular: https://ookgm.meb.gov.tr/www/sss.php [O]
- **[a12]** MEB, "MEB'den özel okulların 'yemek, kıyafet, kırtasiye' ödemelerine yakın takip" (27.03.2025): https://www.meb.gov.tr/mebden-ozel-okullarin-yemek-kiyafet-kirtasiye-odemelerine-yakin-takip/haber/36752/tr [O]
- **[a13]** MEB, "Millî Eğitim Bakanlığı Özel Öğretim Kurumları Yönetmeliğinde Değişiklik Yapılmasına Dair Yönetmelik Resmî Gazete'de Yayımlandı" (05.09.2025): https://www.meb.gov.tr/milli-egitim-bakanligi-ozel-ogretim-kurumlari-yonetmeliginde-degisiklik-yapilmasina-dair-yonetmelik-resmi-gazetede-yayimlandi/haber/38229/tr [O]
- **[a14]** EY, Sosyal Güvenlik ve İş Mevzuatı Sirküler No: 44 (RG 05.09.2025 / 33008): https://www.ey.com/tr_tr/services/tax/sosyal-guvenlikte-gundem/sirkuler/2025/sirkuler-no-44 [A]
- **[a15]** Alomaliye, MEB Özel Öğretim Kurumları Yönetmeliğinde Değişiklik (03.01.2025, RG 32771): https://www.alomaliye.com/2025/01/03/meb-ozel-ogretim-kurumlari-yonetmeliginde-degisiklik-03-01-2025/ [A]
- **[a16]** Alomaliye, MEB Özel Öğretim Kurumları Yönetmeliği (RG 20.03.2012 / 28239): https://www.alomaliye.com/2012/03/20/milli-egitim-bakanligi-ozel-ogretim-kurumlari-yonetmeligi/ [A]
- **[a17]** Lexpera, MEB Özel Öğretim Kurumları Yönetmeliği (konsolide; son değişiklik 05.09.2025): https://www.lexpera.com.tr/mevzuat/yonetmelikler/YR801Y2012N28239P7/24 [O, kısmen]
- **[a18]** Bilkent Okulları, "Okul Ücretinin Tespiti, Tahsil ve İadesi": https://obl.bilkent.edu.tr/index.php/okul-ucretinin-tespiti-tahsil-ve-iadesi/ [O]
- **[a19]** Memurlar.net, "Özel okullarda ücret iadesine ilişkin önemli Yargıtay kararı": https://www.memurlar.net/haber/905191/ozel-okullarda-ucret-iadesine-iliskin-onemli-yargitay-karari.html [A]
- **[a20]** Çınar Hukuk, "Özel Okullarda 2026-2027 Eğitim Öğretim Yılı Ücret Artış Oranları": https://cinartemur.av.tr/yazilar/ozel-okullarda-2026-2027-egitim-ogretim-yili-ucret-artis-oranlari [O] · CNBC-e: https://www.cnbce.com/haberler/ozel-okullarda-2026-2027-egitim-yili-tavan-zam-oranlari-belli-oldu-bu-orani-gecemeyecekler-ozel-okul-ucretleri-ozel-okul-kayit-ucreti-ozel-okul-zammi-h22471 [A]
- **[a21]** Milliyet, "Özel okullarda yeni zam formülü": https://www.milliyet.com.tr/egitim/ozel-okullarda-yeni-zam-formulu-7440368 [A]
- **[a22]** Memurlar.net, "Özel okullara ücret ilanı düzenlemesi" (04.01.2018): https://www.memurlar.net/haber/719434/ozel-okullara-ucret-ilani-duzenlemesi.html [O]
- **[a23]** MEB, "Ücretsiz Okutulacak Öğrenci ve Kursiyerlere İlişkin Yerleştirme Kılavuzu Yayımlandı" (04.08.2026): https://meb.gov.tr/ucretsiz-okutulacak-ogrenci-ve-kursiyerlere-iliskin-yerlestirme-kilavuzu-yayimlandi/haber/41545/tr [O] · Kılavuz PDF: https://www.meb.gov.tr/meb_iys_dosyalar/2026_08/6a719d81100be122054559_Ucretsiz_Okutulacak_Ogrenci-Kursiyer_K%C4%B1lavuzu_-_2026.pdf [A]
- **[a24]** 5580 sayılı Kanun md. 13 (%3 oranı), ikincil: İşçi Haber, https://www.iscihaber.net/egitim/milli-egitim-bakanligi-mujdeyi-duyurdu-ogrenciler-ozel-okullarda-ucretsiz-okuyabilecek-iste-sartlar/135843 [A]
- **[a25]** Medyascope, "19 özel okul hakkında soruşturma" (25.02.2026): https://medyascope.tv/2026/02/25/19-ozel-okul-hakkinda-sorusturma/ · CNBC-e, "Rekabet Kurumu Başkanı açıkladı: Özel okullara soruşturma genişliyor": https://www.cnbce.com/haberler/rekabet-kurumu-baskani-acikladi-ozel-okullara-sorusturma-genisliyor-ozel-okul-fiyatlari-ozel-okul-kayit-ucreti-h28754 [A]
- **[a26]** Türkiye Gazetesi, "Özel okullarda KDV": https://www.turkiyegazetesi.com.tr/egitim/ozel-okullarda-kdv-1009782 [A]
- **[a27]** TCMB, Ödeme Hizmetleri Alanına Genel Bakış: https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB%2BTR/Main%2BMenu/Temel%2BFaaliyetler/Odeme%2BHizmetleri/Genel%2BBakis · Erdem & Erdem, TCMB iş modelleri rehberi: https://www.erdem-erdem.av.tr/bilgi-bankasi/odemeler-alaninda-sunulan-is-modellerinin-odeme-hizmeti-turleri-ile-iliskilendirilmesine-iliskin-tcmb-tarafindan-yayinlanan-rehber [A]

**Yemek**

- **[a28]** MEB, "Okul kantinlerinde satışı yapılacak ürünler için yeni kriterler" (07.04.2016): https://www.meb.gov.tr/okul-kantinlerinde-satisi-yapilacak-urunler-icin-yeni-kriterler/haber/10814/tr [O]
- **[a29]** Lexpera, MEB Genelgesi 2020/8, Okul Kantinlerinde Satılacak Gıdalar ve Eğitim Kurumlarındaki Gıda İşletmelerinin Hijyen Yönünden Denetlenmesi: https://www.lexpera.com.tr/mevzuat/genelgeler/okul-kantinlerinde-satilacak-gidalar-ve-egitim-kurumlarindaki-gida-isletmelerinin-hijyen-yonunden-1 [O, kısmen]
- **[a30]** MEB Bağlar İlçe MEM, Okul Kantin Denetleme Ek-1 Formu (Okul Kantinlerine Dair Özel Hijyen Kuralları Yönetmeliği atfı, RG 05.02.2013 / 28550): https://baglar.meb.gov.tr/meb_iys_dosyalar/2022_07/29120455_Okul_Kantin_Denetleme_Ek-1_Formu.pdf [A]
- **[a31]** Alomaliye, Okul Gıdası Hakkında Tebliğ (No: 2020/23; RG 22.10.2020 / 31282): https://www.alomaliye.com/2020/10/22/okul-gidasi-hakkinda-teblig-no-2020-23/ [A]
- **[a32]** NTV, "Okullarda ücretsiz öğle yemeği için anket" (10.10.2026): https://www.ntv.com.tr/egitim/okullarda-ucretsiz-ogle-yemegi-icin-anket-1745660 [O]
- **[a33]** TESK Genelgesi (toplu tüketimde alerjen bildirimi): https://tesk.org.tr/resimler/2020014.pdf · Lexpera, Türk Gıda Kodeksi Gıda Etiketleme ve Tüketicileri Bilgilendirme Yönetmeliği: https://www.lexpera.com.tr/mevzuat/yonetmelikler/turk-gida-kodeksi-gida-etiketleme-ve-tuketicileri-bilgilendirme-yonetmeligi [A]
- **[a34]** Sağlık Bakanlığı HSGM, Okullar İçin Gıda Güvenliği: https://hsgm.saglik.gov.tr/depo/birimler/saglikli-beslenme-ve-hareketli-hayat-db/Dokumanlar/Rehberler/Okullar_iin_gda_gvenlii.pdf [A]
- **[a35]** MEB Okul Sağlığı, Okul Sağlığı Kitabı: https://okulsagligi.meb.gov.tr/meb_iys_dosyalar/2018_01/03103808_OKUL_SAYLIYI_KYTABI.pdf [A]
- **[a36]** Memurlar.net, "Binlerce okul beslenme dostu": https://www.memurlar.net/haber/814763/binlerce-okul-beslenme-dostu.html [A]
- **[a37]** MEB, "Okul öncesinde haftada 5 gün ücretsiz yemek uygulaması 6 Şubat'ta başlıyor" (2023): https://www.meb.gov.tr/okul-oncesinde-haftada-5-gun-ucretsiz-yemek-uygulamasi-6-subatta-basliyor/haber/28908/tr [A]
- **[a38]** MEB, "Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği değişti" (12.05.2023): https://www.meb.gov.tr/okul-oncesi-egitim-ve-ilkogretim-kurumlari-yonetmeligi-degisti/haber/29894/tr [A]
- **[a39]** Besin Alerjisi Derneği, "Okullarda Alerji İçin Alınacak Önlemler": https://besinalerjisi.org.tr/okullarda-alerji-icin-alinacak-onlemler/ [A]

**KVKK**

- **[a40]** Hukuki Haber, M. V. Dülger, "KVK Kanununda özel nitelikli kişisel verilerin işlenmesi ve yurt dışına veri aktarımı kapsamında yapılan değişikliklere ilişkin değerlendirmeler" (26.03.2024): https://www.hukukihaber.net/kvk-kanununda-ozel-nitelikli-kisisel-verilerin-islenmesi-ve-yurt-disina-veri-aktarimi-kapsaminda-yapilan-degisikliklere-iliskin-degerlendirmeler [O]
- **[a41]** KVKK, Kurul Kararı 2018/10: https://www.kvkk.gov.tr/Icerik/4110/2018-10 [A]
- **[a42]** Alomaliye, Özel Nitelikli Kişisel Verilerin İşlenmesine İlişkin Rehber (2025): https://www.alomaliye.com/2025/03/03/ozel-nitelikli-kisisel-verilerin-islenmesine-iliskin-rehber/ [A]
- **[a43]** Hukuki Haber, "İşyerinde kamera ve konum takibi KVKK'ya aykırı mı? Kurul kararları ne diyor" (14.09.2026; İlke Kararı 2026/921): https://www.hukukihaber.net/isyerinde-kamera-ve-konum-takibi-kvkkya-aykiri-mi-kurul-kararlari-ne-diyor [O]

**Rakipler**

- **[a44]** K12NET, "Delicious News from K12NET" (08.03.2023): https://www.k12net.com/en/?p=455 [O] · K12NET haber arşivi s. 2: https://k12net.com/en/news/page/2 [O]
- **[a45]** Okul Connect, Okul Yönetim Yazılımı: https://okulconnect.com/okul-yonetim-yazilimi [O]
- **[a46]** okulservisi.net: https://okulservisi.net/ [O]
- **[a47]** Anaokula: https://anaokula.com/ [O]
- **[a48]** App Store, Anaokulu Kreş Cepte (Abos Yazılım): https://apps.apple.com/us/app/id1585499168 [O]
- **[a49]** App Store, Power Kids: Anaokulu ve Kreş: https://apps.apple.com/us/app/power-kids-anaokulu-ve-kre%C5%9F/id1435602243 [O]
- **[a50]** Webrazzi, "Eğitim teknolojilerine odaklanan Okulyo, Insha GSYF'den yatırım aldı" (29.12.2025): https://webrazzi.com/2025/12/29/egitim-teknolojilerine-odaklanan-okulyo-insha-gsyf-den-yatirim-aldi/ [O]
- **[a51]** Ziraat Bankası, Kolay Okul Tahsilat Sistemi: https://www.ziraatbank.com.tr/tr/kurumsal/nakit-yonetimi/kolay-okul-tahsilat-sistemi [A]
- **[a52]** NTV, "E-okul Veli Bilgilendirme Sistemi ile not sorgulama": https://www.ntv.com.tr/egitim/e-okul-veli-bilgilendirme-sistemi-ile-not-sorgulama-e-okul-vbs-giris,IwJUUmDTpUyfPUKIKDtFZQ [A]
- **[a53]** Veracross, Tuition Management: https://www.veracross.com/tuition-management/ [A]
- **[a54]** UK Digital Marketplace, ParentPay (G-Cloud 14): https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud-14/services/649021752561883 · Netherrobertland İlkokulu, cashless catering duyurusu (24.03.2025): https://blogs.glowscotland.org.uk/ea/netherrobertland/2025/03/24/change-important-update-fro-all-parents-carers-on-new-cashless-catering-system/ [A]
- **[a55]** THE Journal, "New ParentSquare Feature Streamlines School Payments" (17.02.2025): https://thejournal.com/articles/2025/02/17/new-parentsquare-feature-streamlines-school-payments.aspx [A]

### B — Konu 4–6 (deneme, görüşme, mesajlar) dış kaynakları

- **[b1]** Millî Eğitim Bakanlığı Ortaöğretim Kurumları Yönetmeliği, RG 07.09.2013/28758 (son görülen değişiklik RG 03.07.2026/33299). Taranan maddeler: 34, 36/4, 49/4, 59/A, 86/4, 157, 158/4, 164, 169. https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=18812&MevzuatTertip=5
- **[b2]** Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliği, RG 26.07.2014/29072. Taranan maddeler: 18/2-b, 54/3-c; 78/7 (Ek: RG 14.10.2023/32339); 78/8–11 (Ek: RG 28.07.2026/33323). https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=19942&MevzuatTertip=5
- **[b3]** Millî Eğitim Bakanlığı Özel Öğretim Kurumları Yönetmeliği, RG 20.03.2012/28239. Taranan maddeler: 46/9, 51/1, 68. https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=15970&MevzuatTertip=5
- **[b4]** Millî Eğitim Bakanlığı Rehberlik ve Psikolojik Danışma Hizmetleri Yönetmeliği, RG 14.08.2020/31213. Taranan maddeler: 3/ç, 18/c, 21, 23. https://www.mevzuat.gov.tr/anasayfa/MevzuatFihristDetayIframe?MevzuatTur=7&MevzuatNo=34760&MevzuatTertip=5
- **[b5]** Millî Eğitim Bakanlığı Okul-Aile Birliği Yönetmeliği, RG 09.02.2012/28199 (yalnız künye; veli toplantısı hükmü taranmadı). https://www.resmigazete.gov.tr/eskiler/2012/02/20120209-6.htm
- **[b6]** MEB, "2026-2027 Eğitim ve Öğretim Yılına İlişkin İş ve İşlemler Konulu Genelge Yayımlandı", 19.08.2026. https://www.meb.gov.tr/2026-2027-egitim-ve-ogretim-yilina-iliskin-is-ve-islemler-konulu-genelge-yayimlandi/haber/41673/tr — genelge PDF (okunamadı): https://www.meb.gov.tr/meb_iys_dosyalar/2026_08/6a856d6ec086f824926482_2026-2027_Egitim_ve_Ogretim_Y%C4%B1l%C4%B1na_IliskinIs_ve_Islemler.pdf
- **[b7]** mebogretmen.com, "MEB 2026-2027 Eğitim Öğretim Yılı İş ve İşlemleri (2026/70 Nolu Genelge)", 21.08.2026. https://www.mebogretmen.com/meb-2026-2027-egitim-ogretim-yili-is-ve-islemleri-2026-70-nolu-genelge/
- **[b8]** MEB, "Okullar 'Veli Randevu Sistemi' üzerinden veli adına randevu oluşturabilecek", 16.05.2026. https://www.meb.gov.tr/okullar-veli-randevu-sistemi-uzerinden-veli-adina-randevu-olusturabilecek/haber/40781/tr
- **[b9]** MEB, "Öğretmen-veli görüşmeleri için MEBİM üzerinden telefonla randevu alınabilecek", 21.09.2026. https://www.meb.gov.tr/ogretmen-veli-gorusmeleri-icin-mebim-uzerinden-telefonla-randevu-alinabilecek/haber/41975/tr
- **[b10]** MEB, "Öğretmen-veli randevuları dijital ortama taşındı", 23.03.2024. https://www.meb.gov.tr/ogretmen-veli-randevulari-dijital-ortama-tasindi/haber/33164/tr
- **[b11]** MEB Okul Randevu Sistemi, giriş ve yardım sayfaları. https://okulrandevu.meb.gov.tr/ ; https://okulrandevu.meb.gov.tr/Yardim
- **[b12]** Av. Halil Bakırcı, "Veli Öğretmen Görüşmesi: Okul Randevu Sistemi 2026" (ikincil, tanıtım amaçlı). https://halilbakirci.av.tr/veli-ogretmen-gorusmesi-okul-randevu-sistemi-2026/
- **[b13]** Ajans Kamu, "Veli Randevu Sistemi Tamamen Değişti: İşte Yeni Kurallar". https://www.ajanskamu.net/meb/veli-randevu-sistemi-tamamen-degisti-iste-yeni-kurallar-h224763.html
- **[b14]** Evrensel, "MEB'den 2026-2027 eğitim yılı genelgesi…", 19.08.2026. https://www.evrensel.net/haber/5996929/mebden-2026-2027-egitim-yili-genelgesi-ogretmenlere-onluk-zorunlu-randevusuz-veliye-okul-kapisi-kapali
- **[b15]** Eğitim Sitesi, "MEB'den velilerin bütçesini koruyan dev adım: özel yayınevi denemeleri… yasaklandı", 20.08.2026. https://egitimsitesi.net/haber/mebden-velilerin-butcesini-koruyan-dev-adim-ozel-yayinevi-denemeleri-tarama-sinavlari-ve-pahali-setler-yasaklandi-11292
- **[b16]** Ajans Kamu, "MEB'in Özel Yayınevi Deneme Sınavı Yasak Kararına Okullar Uymuyor", 08.10.2026. https://www.ajanskamu.net/meb/mebin-ozel-yayinevi-deneme-sinavi-yasak-kararina-okullar-uymuyor-h225719.html
- **[b17]** Eğitim Sitesi, "MEB 2026-2027 Genelgesiyle Okullarda Dijital İletişim Yeniden Şekilleniyor", 20.08.2026. https://egitimsitesi.net/haber/mebden-okullarda-whatsapp-donemine-son-veli-iletisiminde-yeni-kurallar-devrede-11297
- **[b18]** Eğitim Sitesi, "Öğretmenler WhatsApp Grubuna Girmek Zorunda mı? MEB Genelgesi ve Sendika Kararları". https://egitimsitesi.net/haber/mebin-202670-sayili-genelgesi-aciklandi-okullarda-mesajlasma-gruplari-ve-veli-iletisimi-nasil-olacak-11512
- **[b19]** Ajans Kamu, "MEB'den Okul WhatsApp Gruplarına Düzenleme", 21.08.2026. https://www.ajanskamu.net/meb/mebden-okul-whatsapp-gruplarina-duzenleme-h225303.html
- **[b20]** Haber7, "Millî Eğitim Bakanlığı uyarmıştı, okullarda hâlâ kullanılıyor", 21.01.2021 ("Veri Talepleri" yazısı aktarımı). https://www.haber7.com/egitim/haber/3058796-milli-egitim-bakanligi-uyarmisti-okullarda-hala-kullaniliyor — Ek: Kamu Ajans, "Resmi yazı geldi: Veli WhatsApp gruplarına yasağın getirilmesi kararı", 12.11.2024. https://www.kamuajans.com/haber/resmi-yazi-geldi-veli-whatsapp-gruplarina-yasagin-getirilmesi-karari-604933
- **[b21]** Gazete Oksijen (kaynak AA), "MEB'den 'fenomen öğretmen' önlemi: öğrencili paylaşımlar kaldırılacak", 10.07.2026. https://gazeteoksijen.com/turkiye/mebden-fenomen-ogretmen-onlemi-ogrencili-paylasimlar-kaldirilacak-281908
- **[b22]** KVKK Kurulu, 06.01.2022 tarihli ve 2022/13 sayılı Karar Özeti (sınav sonuç belgesinin paylaşılması). https://www.kvkk.gov.tr/Icerik/7179/2022-13
- **[b23]** KVKK Kurulu 01.07.2026 tarihli ve 2026/1301 sayılı İlke Kararı (RG 28.07.2026/33323), ikincil özet: Cott Group. https://cottgroup.com/tr/mevzuat/item/kamu-kurumlari-icin-yeni-kvkk-gundemi-internet-paylasimlarinda-2026-1301-sayili-ilke-karari ; Cumhuriyet haberi: https://www.cumhuriyet.com.tr/turkiye/milyonlarca-kisiyi-ilgilendiriyor-kamu-kurumlari-icin-kvkk-karari-resmi-gazetede-yayimlandi-2524359
- **[b24]** 6698 sayılı Kişisel Verilerin Korunması Kanunu (md. 4, 6, 7, 9). https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=6698&MevzuatTur=1&MevzuatTertip=5 ; KVKK, "Standart Sözleşme Bildirim Modülü Hakkında Kamuoyu Duyurusu". https://www.kvkk.gov.tr/Icerik/8043/Standart-Sozlesme-Bildirim-Modulu-Hakkinda-Kamuoyu-Duyurusu
- **[b25]** Memurlar.net, "Öğretmenin resmi dahi kişisel veri oldu" (MEB 2014 yazısı aktarımı; yalnız arama özeti görüldü). https://www.memurlar.net/haber/456886/ogretmenin-resmi-dahi-kisisel-veri-oldu.html
- **[b26]** Net hesabı (ikincil): CNN Türk, "YKS'de kaç yanlış bir doğruyu götürür?" https://www.cnnturk.com/egitim/yksde-kac-yanlis-bir-dogruyu-goturur-yksde-3-yanlis-mi-4-yanlis-mi-bir-dogruyu-siler-2026-yks-net-hesaplama-yontemi-3433065 ; Habertürk, "LGS'de 3 yanlış 1 doğruyu götürüyor mu?" https://www.haberturk.com/lgsde-3-yanlis-1-dogruyu-goturuyor-mu-lgs-sinavinda-kac-yanlis-bir-dogruyu-goturuyor-puan-hesaplama-nasil-yapilir-3691497 ; Türkiye Gazetesi, LGS net hesabı. https://www.turkiyegazetesi.com.tr/haberler/lgs-3-yanlis-1-dogruyu-goturuyor-mu-net-sayisi-nasil-hesaplanir-2026-lgs-dogru-yanlis-1796582 ; ÖSYM 2026-YKS SSS (PDF, okunamadı). https://dokuman.osym.gov.tr/pdfdokuman/2026/YKS/sss_yksd19022026.pdf
- **[b27]** MEB, "LGS kapsamındaki merkezî sınav sonuçları açıklandı", 10.07.2026. https://www.meb.gov.tr/lgs-kapsamindaki-merkezi-sinav-sonuclari-aciklandi/haber/41327/tr
- **[b28]** MEB, "MEBİ platformundan 3 milyondan fazla öğrenci faydalandı", 28.12.2025. https://www.meb.gov.tr/mebi-platformundan-3-milyondan-fazla-ogrenci-faydalandi/haber/39396/tr ; MEB, "Yapay zekâ destekli MEBİ yeni özellikleriyle…". https://www.meb.gov.tr/yapay-zek-destekli-mebi-yeni-ozellikleriyle-yariyil-tatilinde-de-ogrencilerin-yaninda/haber/36130/tr ; Yeni Birlik (LGS denemesi, ikincil). https://www.gazetebirlik.com/egitim/lgs-nisan-ayi-ornek-sorulari-mebide-yapay-zekali-sinav-hazirligi/983699
- **[b29]** Rakip ürün sayfaları:
   - (a) Edutime. https://edutime.app/
   - (b) OkulAile, Özel Okullar. https://okulaile.com/ozel-okullar/
   - (c) Okul Connect. https://okulconnect.com/
   - (d) K12NET. http://k12net.com/tr/
   - (e) OptikOS. http://www.optikokuyucu.net/tr/OptikOS.aspx?ID=14
   - (f) SınavAnalizi.com. https://sinavanalizi.com/
   - (g) Eğitim Sistem, "Özdebir Deneme Sınavları" (2016/2018). https://www.egitimsistem.com/ozdebir-deneme-sinavlari-49621h.htm
- **[b30]** Yurt dışı referanslar:
   - (a) ClassDojo, "Introducing: Quiet Hours for teachers". https://blog.classdojo.com/introducing-quiet-hours-for-teachers/
   - (b) Remind Help Center, "How do I send a message to my teacher or administrator". https://help.remind.com/hc/en-us/articles/8187853614861-How-do-I-send-a-message-to-my-teacher-or-administrator
   - (c) SchoolCloud kullanan okul sayfası örneği. https://kingsway.stockport.sch.uk/parents/online-parents-evening
- **[b31]** Eurydice, "Genel ortaöğretimde öğretme ve öğrenme — Türkiye" (öğrenme çıktısı). https://eurydice.eacea.ec.europa.eu/tr/eurypedia/turkiye/genel-ortaogretimde-ogretme-ve-ogrenme
- **[b32]** Bilgi: oksis-ui MEB sözlüğü (`~/Repositories/oksis/oksis-ui/CLAUDE.md`, "Mesaj", "Rehber", "Sınav", "Ödev" satırları); `docs/genel/urun-tanimi.md:41`; `docs/genel/mvp-kapsami.md:71,77,83,114`.
- **[b33]** Cott Group, "Standart sözleşme bildirim yükümlülüğü ve yaptırımları" (7499 sayılı Kanun, KVKK md. 9; ikincil). https://www.cottgroup.com/en/legislation/item/standart-sozlesme-bildirim-yukumlulugu-ve-yaptirimlari

### C — OKSİS iç belgeler ve kod (değiştirilmedi)

- `docs/genel/mvp-kapsami.md` §3, satır 71, 77, 83; `docs/genel/urun-tanimi.md:41`
- `docs/raporlar/OKSİS — Hazır Olmayan ve Yakında Ekranlar Envanteri.md`
- `docs/domain/kavramlar/`: Veli-Öğrenci İlişkisi, Profil, Rıza Kaydı, Bildirim Türü, Ödev Takibi, Kişi, Dosya Kategorisi, Modül Yapılandırması
- `docs/domain/kararlar/` 0001, 0004, 0006, 0007, 0008, 0009, 0010, 0011, 0012, 0013, 0014, 0016, 0017, 0018, 0019, 0020, 0021, 0022, 0024
- `docs/bulgular/kararlar/K-01 - Bildirim Matrisi.md`, `K-34 - Kanal Kararı Alıcınındır.md`
- `docs/teknik/mimari/` multi-tenant-rules, security-rules, notification-rules; `docs/teknik/kurallar/backend/` database-rules, domain-model-rules, naming-conventions
- `oksis-api`: `Application/Modules/Messaging/.gitkeep`; `Application/Modules/Schools/Events/SchoolCreated/SeedDefaultModuleConfigsHandler.cs`; `Infrastructure/Persistence/Seed/MasterData/NotificationEventTypeSeedData.cs`; `Domain/Modules/Users/Entities/ParentStudentRelationship.cs`, `ParentProfile.cs`; `Domain/Modules/Notifications/NotificationKindMetadata.cs`; `Application/Modules/Notifications/Abstractions/INotificationRecipientResolver.cs`; `Api/Hubs/NotificationHub.cs`
- `oksis-ui`: `apps/web/app/(dashboard)/messages/page.tsx`, `apps/web/app/(dashboard)/finance/**`, `packages/core/src/modules/constants.ts`, `packages/core/src/nav/nav-config.ts`, `apps/mobile/src/features/contacts/components/contact-directory-screen.tsx`, `apps/mobile/src/features/home/components/parent-home.tsx`, `CLAUDE.md` (MEB sözlüğü)
