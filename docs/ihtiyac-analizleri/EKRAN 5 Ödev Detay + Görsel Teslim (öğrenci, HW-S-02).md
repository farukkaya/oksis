# OKSİS — Ödev Modülü · Claude Design Prompt · **EKRAN 5: Ödev Detay + Görsel Teslim (öğrenci, HW-S-02)**

> Kaynak: `odev-modulu-ihtiyac-analizi-final-2026-08-25.md` §8 / HW-S-02, BR-HW-15/16. Kapsam: Faz A. Platform: **Yalnız MOBİL.** Öğrenci portalı. Modülün öğrenci tarafındaki **imza ekranı**: defter sayfasını çekip yükleme akışı burada. "Yeni ödev" ve "ödev güncellendi" bildirimlerinin derin bağlantı hedefi bu ekrandır. Aşağıdaki bloğun tamamını kopyala, Claude Design'da yeni oturuma tek parça yapıştır.

```
## ÜRÜN BAĞLAMI

OKSİS: Türkiye'de özel okullar için geliştirilen, çok kiracılı (multi-tenant) bir okul yönetim platformu. Tasarlanacak modül: **Ödev (Homework)**. Ürün dili Türkçe. Bu ekranın kullanıcısı ORTAOKUL/LİSE ÖĞRENCİSİDİR — hitap "sen". Ton: genç ama olgun; oyunlaştırma abartısı, çocuksu illüstrasyon ve emoji YOK. Tasarım dili: clean, professional, calm.

Bu oturumda TEK ekran tasarlanacak: **Ödev Detayı + Görsel Teslim** (öğrenci).
- **MOBİL:** React Native / Expo, tuval 402 × 874, iOS tarzı modern mobil UI. Alt (stack) ekran — Ödevlerim listesinden veya bildirimden derin bağlantıyla açılır. Yalnız LIGHT tema (mobilde tema sistemi yok — koyu tema TASARLAMA).

**Kritik bağlam:** İki kullanım anı var. (1) Ödev geldiğinde: "ne istiyor, ne zamana, ek var mı?" — okuma anı. (2) Ödevi bitirince: defterini masaya koyup fotoğrafını çekip yükleme — 30 saniyelik, tek elle, akşam ışığında bir iş. Yükleme akışı bir form gibi değil, kamera-önce bir kısayol gibi hissettirmeli.

## MARKA TOKEN'LARI

- `handoff/oksis-brand-tokens.md` 

- Marka laciverti (birincil): #26407F · koyu #1B2B5E · en koyu #141F45
- Metin: ana #141F45 · yumuşak #4A5375 · en yumuşak #8A92AE
- Kenarlık: #DDE3F1 · yumuşak zemin #E9EEF7 · sayfa zemini #F6F8FC · kart #FFFFFF
- Semantik: başarı yeşili, uyarı kehribarı, tehlike kırmızısı, bilgi mavisi — marka dosyasındaki değerler
- Radius: kart 13–16px, buton 12px, çip 999px. Gölge hafif. Glow/glassmorphism yok.
- Tipografi: mobilde kapalı ölçek yok — mevcut prototip 21 / 17 / 15 / 13.5 / 12.5 px civarı; kullandığın her boyutu ekranın yanında açıkça listele.
- Spacing: 4px grid. İkon seti: Lucide.
- Rol bazlı portal renkleri var — bu ekran ÖĞRENCİ portalındadır (üst bar öğrenci vurgu tonunda).

## MOBİL YAPISAL STANDARTLAR (mevcut uygulamadan — birebir uy)

- **Üst bar:** Alt (stack) ekran — ince üst bar: geri oku (dairesiz), solda başlık (ödev başlığı, taşarsa kısalt), sağda aksiyon yok.
- **Dokunma hedefi:** minimum 44×44pt, istisnasız. Safe area gözetilir.
- **Boş ekran kalıbı (gerekirse):** 56×56 daire (#E9EEF7 zemin) içinde 24px nötr ikon · başlık 17px/700 · açıklama 14px, maks 260px, ortalanmış.

## DOMAİN SÖZLÜĞÜ (öğrenci perspektifinden)

- **Ödev** — ders, öğretmen, başlık, açıklama, öğretmen ekleri (dosya/bağlantı), son teslim TARİHİ (saat yok).
- **Kontrol durumu** — öğretmen kontrol edince: **Tamamlandı / Eksik / Yapılmadı / Muaf**. Öğretmen henüz kontrol etmediyse durum bölümü GÖRÜNMEZ (etiket uydurulmaz). Muaf gerekçesi öğrenciye GÖSTERİLMEZ (öğretmen içi kayıttır).
- **Görsel teslim** — öğrencinin bu ödeve fotoğraf (JPG/PNG/HEIC) veya PDF yüklemesi. KURALLAR: en fazla 5 dosya · yükleme durumu DEĞİŞTİRMEZ (öğretmen kontrol edip işaretler) · ödev KAPANANA dek yükleme ve kendi yüklemesini silme serbest · Kapandıktan sonra yükleme kapanır, görüntüleme sürer.
- **Ödev yaşam döngüsü:** Yayınlandı → Süresi Doldu → Kapandı (+ İptal edildi istisnası). Süresi Doldu'da yükleme HÂLÂ serbesttir — "geç" damgası YOKTUR.

## DEĞİŞMEZ ÜRÜN KURALLARI (ihlal edilirse tasarım reddedilir)

1. **Öğrenci yüzeyinde KIRMIZI YOK.** En sert ton kehribar. "Yapılmadı" nötr koyu ton.
2. **Yükleme durumu değiştirmez** — yükleme sonrası mesaj bunu açıkça söyler: "Çalışman öğretmenine iletildi. Öğretmenin kontrol edince durumun güncellenecek." Sahte "Tamamlandı" hissi veren hiçbir görsel dil (yeşil dev tik, kutlama) KULLANILMAZ.
3. **Kıyas yok, puan yok, gamification yok.** Konfeti/kutlama animasyonu yasak.
4. **Suçlayıcı dil yok.** Süresi geçmiş ödevde "Gecikti!" yok; nötr "Son gün: dün". Geri sayım sayacı yok.
5. **Son teslim yalnız TARİH'tir.** Saat gösterilmez.
6. **Boş/ara durum yasak değil, tasarlanır:** loading + error + tüm yükleme durumları.

## ÖRNEK VERİ SETİ (birebir bu isimler)

- Okul: **Altınay Lisesi** · Öğrenci: **İpek Doğan** · Şube: **9-A** · Bugün: Salı, 15 Eylül 2026
- Ana örnek ödev: **"Kelime çalışması Unit 3"** · İngilizce · Öğretmen: **Elif Kara** · Son: yarın (Çarşamba, 16 Eylül) · açıklama: "Unit 3'teki kelimeleri defterine üçer kez yaz, her biriyle bir cümle kur. Sözlük kullanabilirsin." · öğretmen ekleri: "unit3-kelime-listesi.pdf" + bağlantı "quizlet.com/…"
- İpek'in yüklemeleri (dolu varyant için): 2 görsel (defter sayfası fotoğrafları, "Bugün 19:42") — 5 dosya limitine 3 yer var
- Durum varyantları için ikinci örnekler:
  - "Üslü sayılar çalışma kağıdı" · Matematik · Ayşe Demir · Son gün: dün · durum: **Eksik**
  - "Denklem kurma alıştırmaları" · Matematik · Son gün: 11 Eylül · durum: **Tamamlandı** · ödev **Kapandı**
  - "Okuma projesi" · Türkçe · **İptal edildi** (iptal bildirimi derin bağlantısı buraya iner)

## ERİŞİLEBİLİRLİK

WCAG 2.1 AA. Metin kontrastı 4.5:1. Durum yalnız renkle taşınmaz — ikon ve/veya metin eşlik eder. Dokunma hedefleri 44pt. Geçişler 150–250ms ease-out; animasyon fonksiyonel, süs değil.

## YASAKLAR

Aşırı gradient, glow, glassmorphism yok. Emoji yok. Çocuksu illüstrasyon yok. Konfeti yok. Stok fotoğraf yok. "Buraya tıklayın" yok.

---

# EKRAN: Ödev Detayı + Görsel Teslim (HW-S-02)

**Amaç:** (1) İpek'in ödevin ne istediğini 10 saniyede kavraması; (2) bitirdiğinde defterinin fotoğrafını 30 saniyede çekip yüklemesi — ve yüklemenin "teslim edildi ≠ tamamlandı" olduğunu doğru anlaması.

## A) DETAY BÖLGESİ (üstten aşağı)

1. **Kimlik bloğu:** ders adı + öğretmen adı (küçük, muted: "İngilizce · Elif Kara") · ödev başlığı (büyük) · son tarih satırı belirgin: takvim ikonu + "Son: yarın, 16 Eylül". Ödev güncellendiyse ince satır: "Güncellendi: dün".
2. **Durum kartı (KOŞULLU):** yalnız öğretmen işaretlediyse görünür — durum rozeti + tek satır nötr açıklama: Tamamlandı → "Öğretmenin kontrol etti" · Eksik → "Öğretmenin eksik olarak işaretledi" · Yapılmadı → "Öğretmenin yapılmadı olarak işaretledi" · Muaf → "Bu ödevden muafsın". İşaretlenmemişse bu kart HİÇ YOK.
3. **Açıklama:** tam metin, okunaklı satır aralığı.
4. **Öğretmen ekleri:** kompakt kartlar — PDF: dosya adı + boyut, dokununca tam ekran önizleme; bağlantı: URL etiketi + dış bağlantı ikonu, dokununca tarayıcı. (Önizleme görüntüleyicisini de bir frame olarak göster: üst bar geri + dosya adı, pinch-zoom.)

## B) GÖRSEL TESLİM BÖLGESİ ("Çalışmam" — ekranın imzası)

**Boş hal:** bölüm başlığı "Çalışmam" + kısa açıklama "Defterinin fotoğrafını çekip öğretmenine gösterebilirsin." + tek belirgin buton: **"Çalışmamı yükle"** (kamera ikonu, birincil ama dev değil). Dokununca seçim bottom sheet'i: **Fotoğraf çek** (kamera ikonu — İLK sıra, bu akışın kahramanı) · **Galeriden seç** · **PDF seç**. Her satır 44pt+.

**Yükleme sırasında:** eklenen her dosya küçük kart: küçük görsel + ilerleme çubuğu → bitince tik. Çoklu seçim desteklenir (galeri 3 fotoğraf → 3 kart sıraya).

**Dolu hal (2/5):** küçük görsel ızgarası (2 sütun) — her karo: görsel + sağ üst köşede silme (X, 44pt dokunma alanı, karo dışına taşan hedef) · PDF karosu: PDF ikonu + ad. Izgaranın sonunda "+ Ekle" karosu (limit dolana dek). Altında muted satır: "2/5 dosya · Yüklediklerini ödev kapanana kadar silebilirsin."

**Yükleme sonrası onay (kritik mikro-an):** nötr, sakin onay bandı/satırı: "Çalışman öğretmenine iletildi. Öğretmenin kontrol edince durumun güncellenecek." — yeşil dev tik YOK, konfeti YOK; küçük tik ikonu + normal metin.

**Limit dolu (5/5):** "+ Ekle" karosu pasif + satır: "En fazla 5 dosya yükleyebilirsin — yer açmak için birini silebilirsin."

**Silme onayı (bottom sheet):** küçük görsel önizlemesi + "Bu dosyayı silmek istiyor musun?" + "Sil" (kehribar/nötr — kırmızı DEĞİL) / "Vazgeç".

**Yükleme hatası:** kart üzerinde soluk görsel + "Yüklenemedi" + "Tekrar dene" — dosya kaybolmaz, kuyrukta bekler hissi.

## C) VARYANTLAR (ayrı frame'ler)

1. **İşaretlenmemiş + yüklemesiz** (okuma anı — ana frame).
2. **İşaretlenmemiş + 2 yükleme** (dolu hal + onay satırı görünür).
3. **Eksik işaretli:** durum kartı kehribar; görsel teslim bölümü AÇIK kalır ("eksiğini tamamlayıp yeni fotoğraf yükleyebilirsin" — açıklama satırı buna döner).
4. **Kapandı + Tamamlandı:** durum kartı yeşil; teslim bölgesi salt görüntüleme — "+ Ekle" ve silme yok, üstte ince bilgi: "Bu ödev kapandı." Yüklemeler görüntülenebilir.
5. **İptal edilmiş ödev:** içerik soluk, üstte bilgi bandı: "Bu ödev öğretmenin tarafından iptal edildi." Teslim bölgesi yok.
6. **Loading** (iskelet) + **error** (tekrar dene).

## ÇIKTI BEKLENTİSİ

1. Mobil 402×874 (light): 6 varyant frame'i + seçim bottom sheet'i + silme onayı + ek önizleme görüntüleyicisi + yükleme ilerleme/hata halleri.
2. "Çalışmam" bölümünün component sheet'i: boş / yüklüyor / dolu / limit / hata / salt-okunur.
3. Kullandığın font boyutlarının listesi.
```

---

## Sipariş sonrası kontrol listesi

- [ ] Yükleme sonrası "teslim edildi ≠ tamamlandı" ayrımı net mi — yeşil dev tik/kutlama sızmış mı? (sızdıysa reddet — modülün en kritik güven kuralı)
- [ ] "Fotoğraf çek" seçim sheet'inde ilk sırada mı?
- [ ] İşaretlenmemiş ödevde durum kartı gerçekten yok mu ("bekleniyor" uydurulmuş mu)?
- [ ] Süresi geçmiş/Eksik durumda yükleme hâlâ açık mı, "geç" damgası sızmış mı?
- [ ] Silme kehribar/nötr mü (kırmızı sızıntısı)?
- [ ] 5 dosya limiti UX'i var mı (sayaç + pasif karo + yer açma metni)?
- [ ] Muaf gerekçesi öğrenciye sızmış mı? (sızdıysa reddet)
- [ ] Yükleme hatasında dosya kaybolmama hissi kurulmuş mu?