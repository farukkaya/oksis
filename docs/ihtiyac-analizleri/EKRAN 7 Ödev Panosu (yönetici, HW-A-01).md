# OKSİS — Ödev Modülü · Claude Design Prompt · **EKRAN 7: Ödev Panosu (yönetici, HW-A-01)**

> Kaynak: `odev-modulu-ihtiyac-analizi-final-2026-08-25.md` §8 / HW-A-01, K-8, BR-HW-11. Kapsam: Faz A. Platform: **Yalnız WEB.** Yönetici konsolu — Raporlar hub'ına eklenen "Ödev" görünümü. **Bu siparişin ideolojik yükü ağır:** "Yükü ölçeriz, öğretmeni değil." Pano bir denetim aracı değil, denge aracıdır — tasarım dili bunu taşımalı. Öğretmen bazlı toplam/sıralama üreten her öğe red sebebidir. **Yüzey kuralı geçerli:** zemin üzerine doğrudan metin basılmaz (Ekran 6'da eklenen kural). Aşağıdaki bloğun tamamını kopyala, Claude Design'da yeni oturuma tek parça yapıştır.

```
## ÜRÜN BAĞLAMI

OKSİS: Türkiye'de özel okullar için geliştirilen, çok kiracılı (multi-tenant) bir okul yönetim platformu. Tasarlanacak modül: **Ödev (Homework)**. Ürün dili Türkçe, hitap "siz". Bu ekranın kullanıcısı OKUL YÖNETİCİSİDİR (müdür / müdür yardımcısı). Tasarım dili: clean, professional, calm — yönetim konsolu ciddiyeti, gösterge paneli şovu değil.

Bu oturumda TEK ekran tasarlanacak: **Ödev Panosu** — iki görünümlü yönetim yüzeyi.
- **WEB:** Desktop 1440px tuval. Raporlar hub'ı içinde "Ödev" sekmesi (rota /reports, Ödev sekmesi seçili). Next.js + shadcn/ui (Radix, "Mira" stili) + Tailwind v4. Bootstrap/MUI görünümü yok. LIGHT ve DARK ikisi de tasarlanır.
- Sezon bağlamı global üst bardaki sezon seçiciden gelir (2026-2027) — bu ekranda ayrıca sezon seçici TASARLANMAZ; dönem ise sayfa içi filtredir.

**Kritik bağlam:** Yöneticinin iki sorusu var. (1) "Hangi şubeye hangi güne ödev yığılıyor?" — veli 'çok ödev' şikâyeti gelmeden görmek için. (2) "Hangi ödevlerin süresi doldu ama kontrolü yapılmadı?" — sistemin işlediğinden emin olmak için. Her iki soruda da özne ŞUBE, GÜN ve ÖDEVDİR; asla öğretmen değildir.

## MARKA TOKEN'LARI

- `handoff/oksis-brand-tokens.md` 

- Marka laciverti (birincil): #26407F · koyu #1B2B5E · en koyu #141F45
- İmza gradyanı: yalnız giriş/hero yüzeylerinde — veri ekranlarında KULLANILMAZ
- Metin: ana #141F45 · yumuşak #4A5375 · en yumuşak #8A92AE
- Kenarlık: #DDE3F1 · yumuşak zemin #E9EEF7 · sayfa zemini #F6F8FC · kart #FFFFFF
- Semantik: başarı yeşili, uyarı kehribarı, tehlike kırmızısı, bilgi mavisi — marka dosyasındaki değerler
- Radius: kart 12–14px, buton 8px, çip 999px. Gölge hafif. Glow/glassmorphism yok.
- Tipografi: sayfa başlığı 24px semibold · bölüm başlığı 20px semibold · kart başlığı 18px medium · gövde 14px · caption 12px muted. Satır yüksekliği gövde 1.5, başlık 1.3.
- Spacing: 4px grid. Kart içi 16–24px, bölüm arası 24px. İkon seti: Lucide.
- Bu ekran YÖNETİCİ portalındadır.

## DOMAİN SÖZLÜĞÜ

- **Ödev** — bir öğretmenin şube × ders kapsamında verdiği iş; son teslim TARİHİ vardır (saat yok).
- **Ödev yoğunluğu** — bir şubenin bir gününe SON TARİHİ düşen ödev sayısı. Yönetimin izlediği tek kümülatif metrik. Eşik okul politikasından gelir: `homeworkDailyDensityThreshold` = 3 (eşik ve üzeri hücre uyarı vurgusu alır).
- **Kontrol bekleyen ödev** — son tarihi geçmiş VE öğrenci kontrolü tamamlanmamış (işaretlenmemiş öğrenci kalan) ödev. Kontrol ilerlemesi "12/26" biçiminde gösterilir.
- **Ödev yaşam döngüsü çipleri** (öğretmen ekranlarıyla aynı görsel dil): Taslak kehribar/kesik · Yayınlandı bilgi mavisi · Süresi Doldu nötr koyu · Kapandı yeşil+tik. (Bu panoda taslaklar GÖRÜNMEZ — taslak yalnız sahibinindir.)

## DEĞİŞMEZ ÜRÜN KURALLARI (ihlal edilirse tasarım reddedilir)

1. **ZEMİN ÜZERİNE DOĞRUDAN METİN YASAK.** Sayfa zemini (#F6F8FC) üzerine hiçbir metin doğrudan basılmaz — başlıklar, filtre etiketleri, boş durum metinleri dahil her metin bir kart (#FFFFFF) veya yumuşak yüzey (#E9EEF7) içinde yaşar.
2. **ÖĞRETMEN BAZLI KÜMÜLATİF GÖRÜNÜM YASAK.** Öğretmen başına toplam ödev sayısı, öğretmen sıralaması, "en çok/en az ödev veren", öğretmen bazlı grafik/liste/gruplama/sıralama HİÇBİR biçimde yok. Tekil ödev satırında öğretmen ADI bilgi olarak durabilir (yöneticinin kiminle konuşacağını bilmesi için) — ama öğretmen adına tıklayınca "o öğretmenin tüm ödevleri" gibi bir toplama AÇILMAZ, ad tıklanabilir değildir.
3. **Kırmızı yok.** Yoğunluk aşımı ve kontrol gecikmesi KEHRİBAR uyarıdır — bunlar ihlal değil, konuşulacak konudur. Tehlike kırmızısı bu ekranda hiç kullanılmaz.
4. **Dil nötrdür:** "Kontrol bekliyor", "Eşik aşıldı" — ünlem, emir kipi, "gecikti!", "ihmal" gibi yargı sözcükleri yasak.
5. **Öğrenci verisi yok.** Bu pano öğrenci adı/durumu göstermez; en derin inişi ödev seviyesidir (kontrol ilerlemesi toplam sayıdır).
6. **Boş ekran yasak.** Her görünüm için empty + loading (skeleton) + error tasarlanır. Kontrol bekleyenler görünümünün boş hali OLUMLU bir boş haldir.
7. **Son teslim yalnız TARİH'tir.** Saat yok.

## ÖRNEK VERİ SETİ (birebir bu isimler)

- Okul: **Altınay Lisesi** · Sezon: **2026-2027** · Dönem: **1. Dönem** · Bugün: Salı, 15 Eylül 2026
- Görünen hafta: **14–18 Eylül** (Pzt–Cum)
- Şubeler (takvim satırları): 5-A · 5-B · 9-A · 9-B · 10-C · 11-A
- Yoğunluk hücre değerleri (çeşitlilik bilinçli — eşik 3):
  - 9-A: Pzt 1 · Sal 2 · Çar **4 (eşik aşımı)** · Per 1 · Cum 2
  - 9-B: Sal 3 (**eşikte**) · Cum 1 · diğerleri 0
  - 10-C: Pzt 2 · Çar 1 · Per **5 (eşik aşımı)** · Cum 1
  - 5-A: Sal 1 · Per 1 · diğerleri 0 — 5-B: Çar 2 · diğerleri 0 — 11-A: Pzt 1 · Cum 2 · diğerleri 0
- Hücre iniş örneği (9-A Çarşamba, 4 ödev): "Sayfa 42–45 problemler · Matematik · Ayşe Demir" / "Deney raporu · Fen Bilimleri · Mehmet Aslan" / "Kelime çalışması Unit 3 · İngilizce · Elif Kara" / "Paragraf analizi · Türkçe · Canan Yıldız"
- Kontrol bekleyenler listesi (en eski üstte):
  1. "Okuma günlüğü" · 9-B · Türkçe · Canan Yıldız · son tarih 5 gün önce (10 Eylül) · kontrol 0/28
  2. "Üslü sayılar çalışma kağıdı" · 10-C · Matematik · Ayşe Demir · son tarih dün · kontrol 12/26
  3. "Deney ön hazırlığı" · 5-A · Fen Bilimleri · Mehmet Aslan · son tarih dün · kontrol 20/24

## ERİŞİLEBİLİRLİK

WCAG 2.1 AA. Metin kontrastı 4.5:1. Görünür focus ring (marka renkli). Takvim ızgarası ve listeler klavye ile gezilebilir; yan panel Esc ile kapanır. Yoğunluk yalnız renkle taşınmaz — hücrede SAYI her zaman görünür. Geçişler 150–250ms ease-out.

## YASAKLAR

Aşırı gradient, glow, glassmorphism yok. Veri ekranlarında imza gradyanı yok. Pasta/halka grafik şovu yok — bu bir gösterge paneli vitrinini değil, iki net soruya cevap veren bir çalışma yüzeyidir. Emoji yok. "Buraya tıklayın" yok. Zemin üzerine doğrudan metin yok.

---

# EKRAN: Ödev Panosu (HW-A-01)

**Amaç:** Yöneticinin (1) haftalık yoğunluk resmini 10 saniyede okuması ve aşırı yığılan şube-günü fark etmesi; (2) kontrol bekleyen ödevleri görüp ilgili zümreyle konuşabilmesi. Her ikisi de müdahale listesi değil, konuşma zeminidir.

## A) SAYFA İSKELETİ

Raporlar hub'ı sayfa başlığı + sekme satırı ("Ödev" seçili; diğer sekmeler soluk placeholder: Yoklama · Akademik · **Ödev**). Ödev sekmesi içinde iki alt görünüm — segment kontrol: **"Yoğunluk"** (varsayılan) · **"Kontrol Bekleyenler"** (sayaç rozetli: "3").

## B) GÖRÜNÜM 1 — YOĞUNLUK TAKVİMİ

**Filtre şeridi (yüzey içinde):** hafta gezgini (‹ 14–18 Eylül ›, "Bu hafta" hızlı dönüşü) · kademe filtresi (Tümü · İlkokul · Ortaokul · Lise) · dönem (1. Dönem) · sağ uçta muted eşik bilgisi: "Uyarı eşiği: 3 — Okul Ayarları'ndan değiştirilir" (Ayarlar'a giden küçük bağlantı).

**Izgara (ana kart içinde):** satırlar = şubeler, sütunlar = Pzt–Cum (tarih altbaşlıklı; bugün sütunu ince vurgu). Hücre:
- 0 ödev → boş, çok soluk (sayı yazılmaz — sıfır kalabalığı yaratma).
- 1–2 → nötr çip içinde sayı.
- 3+ (eşik ve üzeri) → kehribar zeminli çip içinde sayı. KIRMIZI YOK; 5 de kehribardır.
Hücreye tıklama → **sağ yan panel (drawer):** başlık "9-A · Çarşamba, 16 Eylül · 4 ödev", altında ödev satırları: başlık · ders · öğretmen adı (tıklanamaz, muted) · durum çipi. Satıra tıklama ödevin salt okunur detayına gider (bu oturumda tasarlanmaz — satır hover'ı yeterli).

**Izgara altı özet satırı (aynı kart içinde, muted):** "Bu hafta 24 ödevin son tarihi var · 2 şube-günde eşik aşımı" — yalnız bilgi, buton değil.

## C) GÖRÜNÜM 2 — KONTROL BEKLEYENLER

**Tablo kartı:** sütunlar — Ödev (başlık) · Şube · Ders · Öğretmen (tıklanamaz, düz metin) · Son tarih ("dün", "5 gün önce" insan dili + kehribar nokta 3+ günde) · Kontrol (ilerleme çubuğu + "12/26"). Varsayılan sıralama: son tarihi en eski üstte. Sıralama yalnız Son tarih ve Şube sütunlarında açık; **Öğretmen sütununda sıralama/gruplama KAPALI** (başlıkta sıralama oku yok). Satıra tıklama → salt okunur ödev detayı (tasarlanmaz).

**Filtreler:** şube · ders · dönem. Öğretmen filtresi BİLİNÇLİ OLARAK YOK.

**Olumlu boş hal (kart içinde):** yeşil ton nötr ikon + "Kontrol bekleyen ödev yok" + "Süresi dolan tüm ödevlerin kontrolü tamamlanmış."

## D) DURUMLAR

- **Yoğunluk boş haftası:** ızgara yapısı durur, tüm hücreler soluk + kart içi satır: "Bu hafta son tarihi olan ödev yok."
- **Loading:** ızgara/tablo iskeletleri. **Error:** kart içinde hata + "Tekrar dene".

## ÇIKTI BEKLENTİSİ

1. Web 1440 LIGHT: Yoğunluk görünümü (örnek veriyle, 2 eşik aşımı görünür) + hücre yan paneli açık varyant + Kontrol Bekleyenler tablosu + olumlu boş hal.
2. Aynı frame'lerin DARK varyantları (kehribar vurgunun dark'ta AA kontrastı korunarak).
3. Yoğunluk hücresi component sheet'i: 0 / 1–2 / eşikte / eşik üstü / bugün sütunundaki hal.
4. Loading + error birer örnek.
```

---

## Sipariş sonrası kontrol listesi

- [ ] **Öğretmen bazlı herhangi bir toplama/sıralama/grafik sızmış mı?** (tek örnek bile reddet — K-8 bu ekranın anayasası)
- [ ] Öğretmen adları tıklanamaz düz metin mi; Öğretmen sütununda sıralama oku var mı? (varsa reddet)
- [ ] Kırmızı sızmış mı? (eşik aşımı 5 bile olsa kehribar)
- [ ] Zemin üzerinde yüzen metin var mı? (başlıklar, filtre etiketleri dahil — reddet)
- [ ] Sıfır hücreler boş/soluk mu, yoksa "0" kalabalığı mı var?
- [ ] Eşik bilgisi ve Ayarlar bağlantısı duruyor mu?
- [ ] Kontrol Bekleyenler'in boş hali olumlu tonda mı?
- [ ] Pasta/halka grafik, KPI vitrin kartları uydurulmuş mu? (reddet — iki soruluk çalışma yüzeyi)
- [ ] Öğrenci adı/verisi sızmış mı? (reddet)