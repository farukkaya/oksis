# OKSİS — Ödev Modülü · Claude Design Prompt · **EKRAN 3: Ödev Detay + Kontrol Izgarası (HW-T-02)**

> Kaynak: `odev-modulu-ihtiyac-analizi-final-2026-08-25.md` §8 / HW-T-02, BR-HW-05…08, BR-HW-15/16. Kapsam: Faz A. Platform: **Web + Mobil** — tek oturumda iki tuval. **Web birincildir** (kontrol masabaşı işidir), mobil tam işlevdir. **Modülün kalbi budur.** Hız hedefi: 30 kişilik şubenin kontrolü ≤ 2 dakika. Ekran 2'de tanımlanan çekirdek bileşenler (Ödev Durum Çipi, Kontrol İlerlemesi, Yükleme Rozeti, Hedef Rozeti) burada aynen devralınır — bu promptta yeniden tanımlanmışlardır, görsel dili değiştirme. Aşağıdaki bloğun tamamını kopyala, Claude Design'da yeni oturuma tek parça yapıştır.

```
## ÜRÜN BAĞLAMI

OKSİS: Türkiye'de özel okullar için geliştirilen, çok kiracılı (multi-tenant) bir okul yönetim platformu. Tasarlanacak modül: **Ödev (Homework)**. Ürün dili Türkçe, hitap "siz". Kullanıcı kitlesi teknoloji meraklısı değil — öğretmen, veli, ortaokul/lise öğrencisi. Tasarım dili: clean, professional, calm. Demoda etkileyici değil, günlük kullanımda yormayan.

Bu oturumda TEK ekran tasarlanacak: **Ödev Detay + Kontrol Izgarası** (öğretmen). İki platform, iki tuval:
- **WEB (birincil):** Desktop 1440px tuval, rota /homework/[id]. Next.js + shadcn/ui (Radix, "Mira" stili) + Tailwind v4. Kontrol, sınav kağıtları/defterler masadayken yapılan bir masabaşı işidir — yoğun, klavye dostu bir ızgara bekleniyor. LIGHT ve DARK ikisi de tasarlanır.
- **MOBİL:** React Native / Expo, tuval 402 × 874. Alt (stack) ekran. Öğretmen sınıfta sıralar arasında dolaşırken defterlere bakıp telefondan işaretler — tek elle, hızlı. Yalnız LIGHT tema (koyu tema TASARLAMA).

## MARKA TOKEN'LARI

- `handoff/oksis-brand-tokens.md` 

- Marka laciverti (birincil): #26407F · koyu #1B2B5E · en koyu #141F45
- İmza gradyanı: yalnız giriş/hero yüzeylerinde, veri ekranlarında KULLANILMAZ
- Metin: ana #141F45 · yumuşak #4A5375 · en yumuşak #8A92AE
- Kenarlık: #DDE3F1 · yumuşak zemin #E9EEF7 · sayfa zemini #F6F8FC · kart #FFFFFF
- Semantik: başarı yeşili, uyarı kehribarı, tehlike kırmızısı, bilgi mavisi — marka dosyasındaki değerler
- Radius: web'de kart 12–14px / buton 8px, mobilde kart 13–16px / buton 12px; çip 999px. Gölge hafif. Glow/glassmorphism yok.
- Tipografi (web): sayfa başlığı 24px semibold · bölüm başlığı 20px semibold · kart başlığı 18px medium · gövde 14px · caption 12px muted. Mobilde kapalı ölçek yok — mevcut prototip 21 / 17 / 15 / 13.5 / 12.5 px civarı; kullandığın her boyutu ekranın yanında açıkça listele.
- Spacing: 4px grid. Kart içi 16–24px, bölüm arası 24px.
- İkon seti: Lucide.
- Rol bazlı portal renkleri var — bu ekran ÖĞRETMEN portalındadır.

## MOBİL YAPISAL STANDARTLAR (mevcut uygulamadan — birebir uy)

- **Üst bar:** Alt (stack) ekran — ince üst bar: geri oku (dairesiz), solda başlık (ödev başlığı, taşarsa kısalt), sağda üç nokta menüsü (Düzenle / İptal).
- **Dokunma hedefi:** minimum 44×44pt, istisnasız. Safe area gözetilir.
- **Boş ekran kalıbı (gerekirse):** 56×56 daire (#E9EEF7 zemin) içinde 24px nötr ikon · başlık 17px/700 · açıklama 14px, maks 260px, ortalanmış.

## DOMAİN SÖZLÜĞÜ (tasarımın tamamı buna dayanır — karıştırma)

- **Ödev** — öğretmenin bir şube × ders kapsamında verdiği iş: başlık, açıklama, opsiyonel ekler, zorunlu son teslim TARİHİ (saat yok). Hedefi şubenin TAMAMI veya SEÇİLİ ÖĞRENCİLER olabilir.
- **Teslim Takip Kaydı** — hedefteki her öğrenci için bir satır. **Beş öğrenci durumu:**

| Öğrenci durumu | Anlam | Görsel dil |
|---|---|---|
| İşaretlenmedi | Henüz kontrol edilmedi — NÖTRDÜR, olumsuzluk değildir | nötr gri, boş daire |
| Tamamlandı | Kontrol edildi, tamam | başarı yeşili + tik |
| Eksik | Kısmen yapılmış | kehribar/uyarı |
| Yapılmadı | Yapılmamış | nötr KOYU ton + ikon — KIRMIZI DEĞİL, yargılamayan |
| Muaf | Sorumlu değil (raporlu, sonradan kayıt vb.) — gerekçe zorunlu | soluk/kesik, "M" |

- **Ödev yaşam döngüsü:** Taslak → Yayınlandı → Süresi Doldu → Kapandı. Durum çipi Ekran 2 ile aynı görsel dilde: Taslak kehribar/kesik · Yayınlandı bilgi mavisi · Süresi Doldu nötr koyu · Kapandı yeşil+tik.
- **Görsel teslim** — öğrencinin kendi satırına yüklediği fotoğraf/PDF (defter sayfası fotoğrafı gibi). KANITTIR, durumu DEĞİŞTİRMEZ; öğretmen bakar ve kendisi işaretler.
- İşaretlemeler ANINDA kaydedilir — ayrı "gönder/kaydet" adımı yoktur. Eksik/Yapılmadı işaretlemeleri veliye ANINDA gitmez; akşam günlük özet bildirimiyle iletilir (okul politikası).

## DEĞİŞMEZ ÜRÜN KURALLARI (ihlal edilirse tasarım reddedilir)

1. **Puan alanı YOK.** Not/puan kavramı hiçbir yerde geçmez.
2. **"Yapılmadı" kırmızı değildir.** Öğrenci durumları yargılamayan görsel dille gösterilir; tehlike kırmızısı bu ekranda yalnız yıkıcı aksiyon (İptal) onayında kullanılabilir.
3. **"İşaretlenmedi" olumsuzluk gibi gösterilmez** — nötr, "henüz kontrol edilmedi".
4. **Görsel teslim durumu değiştirmez** — yükleme görüntüleyicide "durum otomatik değişmez, siz işaretlersiniz" mantığı görsel olarak açık olmalı.
5. **Bildirim üreten aksiyonların onayında etkisi yazılır** (İptal, Düzenle-yayınlanmış, toplu işaretleme).
6. **Son teslim yalnız TARİH'tir.** Saat gösterilmez.
7. **Boş ekran yasak.** Empty + loading (skeleton) + error (tekrar dene) state'leri tasarlanır.
8. **Kıyas yok.** Sıralama/başarı ligi yok; özet sayaçları bilgidir, liderlik tablosu değildir.

## ÖRNEK VERİ SETİ (birebir bu isimler)

- Okul: **Altınay Lisesi** · Sezon: **2026-2027** · Dönem: **1. Dönem** · Bugün: Salı, 15 Eylül 2026
- Öğretmen: **Ayşe Demir** (Matematik)
- Ana örnek ödev: **"Üslü sayılar çalışma kağıdı"** · 10-C (26 öğrenci) · son: Dün, 14 Eylül · durum **Süresi Doldu** · 1 ek ("uslu-sayilar-calisma-kagidi.pdf") · açıklama: "Dağıtılan çalışma kağıdındaki tüm soruları çözünüz. Cevap anahtarı kontrol sonrası paylaşılacak."
- Izgara doluluğu (özet şeridi bu sayılarla): 26 öğrenci → 12 Tamamlandı · 3 Eksik · 1 Yapılmadı · 1 Muaf (gerekçe: "Raporlu — 10–14 Eylül") · 9 İşaretlenmedi · 7 satırda yükleme rozeti
- Öğrenciler (10-C'den ilk satırlar — numara + ad, Türkçe karakter testi):
  1101 Ada Yılmaz · 1102 Berk Aydın · 1103 Ceren Şahin · 1104 Deniz Kaya · 1105 Ecrin Öz ·
  1106 Furkan Ateş · 1107 Gökçe Uysal · 1108 Halil İbrahim Çetin · 1109 Irmak Güneş · 1110 İpek Doğan
- Yükleme örneği: Ceren Şahin — 3 görsel (defter sayfası fotoğrafları) + 1 PDF, yükleme zamanı "Dün 21:40"
- Taslak varyant örneği: "Geometri ön hazırlık" · 10-C · Taslak

## ERİŞİLEBİLİRLİK

WCAG 2.1 AA. Metin kontrastı 4.5:1. Görünür focus ring (marka renkli). Web ızgarası klavye ile gezilebilir (ok tuşları satır, kısayol işaretleme — kısayolları ekran kenarında küçük bir yardım satırıyla göster: T=Tamamlandı, E=Eksik, Y=Yapılmadı). Durum yalnız renkle taşınmaz — ikon ve/veya metin eşlik eder. Geçişler 150–250ms ease-out.

## YASAKLAR

Aşırı gradient, glow, glassmorphism yok. Veri ekranlarında imza gradyanı kullanılmaz. "Buraya tıklayın" yok. Stok fotoğraf yok. Emoji yok.

---

# EKRAN: Ödev Detay + Kontrol Izgarası (HW-T-02)

**Amaç:** Ayşe Demir'in 26 kişilik 10-C kontrolünü 2 dakikanın altında bitirmesi; yüklemesi olan öğrenciyi sınıfa gitmeden ekrandan kontrol edip aynı yerden işaretlemesi.

## A) DETAY BAŞLIK BÖLGESİ

Ödev kimliği: başlık + durum çipi (Süresi Doldu) · şube çipi (10-C) · "Son: dün, 14 Eylül" · ek çipi (dosya adı, dokununca önizleme) · açıklama (2 satırdan uzunsa "devamını gör"). Aksiyonlar: **Düzenle** ve **İptal** — web'de başlığın sağında, mobilde üst bar üç nokta menüsünde.

**Özet şeridi (başlığın hemen altı):** 26 öğrenci · 12 Tamamlandı · 3 Eksik · 1 Yapılmadı · 1 Muaf · 9 İşaretlenmedi — her sayı kendi durum renginde mini rozet; herhangi birine dokunma/tıklama ızgarayı o duruma FİLTRELER (aktif filtre görünür, "temizle" ile kalkar).

## B) KONTROL IZGARASI (ekranın kalbi)

**Satır anatomisi:** numara + ad soyad · yükleme rozeti (varsa — görsel ikonu + sayı, dokununca görüntüleyici açılır) · durum kontrolü.

**Durum kontrolü — WEB:** satırda dört segment buton yan yana: Tamamlandı / Eksik / Yapılmadı / Muaf. Seçili segment dolgulu, diğerleri hayalet. Tek tık işaretler, ANINDA kaydedilir (satırda 300ms'lik ince "kaydedildi" mikro-onayı — tik parıltısı, toast DEĞİL; 26 satırda toast bombardımanı olmaz). Muaf tıklanınca gerekçe popover'ı açılır (zorunlu metin, "Kaydet").

**Durum kontrolü — MOBİL:** satırda ÜÇ açık buton: Tamamlandı / Eksik / Yapılmadı (her biri min 44pt, ikon+kısa etiket). Muaf, satır sonundaki üç nokta menüsünde — dokununca gerekçe bottom sheet'i. Satır dokunuşuyla durum DÖNGÜSÜ YOK (yanlış dokunma riski); işaretleme yalnız açık butonlarla.

**İşaretlenmiş satır:** durum değişikliği serbesttir (yeniden dokun, değişir — arka planda izlenir); ekranda "düzeltme onayı" diyaloğu YOK, akış hızlı kalır.

**Toplu eylem:** ızgara üstünde tek buton: **"Kalanları Tamamlandı işaretle"** (yalnız İşaretlenmedi kalanlar varken görünür, sayaçlı: "9 öğrenci"). Onay diyaloğu: "9 öğrenci Tamamlandı olarak işaretlenecek. Bu işlem veliye anında bildirim göndermez." → Onayla / Vazgeç.

**Hızlı filtre:** "Yalnız işaretlenmemişler" anahtar/çip — özet şeridi filtresiyle aynı mekanizma.

**Alt bilgi satırı (ince, muted):** "Eksik ve Yapılmadı işaretlemeleri velilere akşam günlük özetle iletilir." — öğretmenin 'şimdi bildirim patlattım mı' endişesini söndürür.

## C) YÜKLEME GÖRÜNTÜLEYİCİ (görsel teslim — yeni ve kritik bileşen)

Ceren Şahin satırındaki rozete dokunuş:
- **Mobil:** tam ekran görüntüleyici — üstte öğrenci adı + yükleme zamanı, ortada görsel (yatay kaydırmayla 3 görsel + PDF sayfası, sayfa göstergesi "2/4"), pinch-zoom. **Altta sabit işaretleme çubuğu:** Tamamlandı / Eksik / Yapılmadı üç butonu — öğretmen görsele bakarken işaretler, işaretleyince görüntüleyici bir sonraki YÜKLEMESİ OLAN öğrenciye geçer (hızlı uzaktan kontrol akışı; "sonrakine geç" oku da ayrıca var).
- **Web:** geniş modal — solda büyük görsel + küçük görsel şeridi, sağda panel: öğrenci adı, yükleme zamanı, dosya listesi, işaretleme segmenti ve "Sonraki yüklemeli öğrenci →".
- Her iki platformda küçük bilgi satırı: "Yükleme durumu değiştirmez — kontrolü siz işaretlersiniz."

## D) DİYALOGLAR

1. **Muaf gerekçesi** (popover/bottom sheet): zorunlu metin alanı, örnek placeholder "Raporlu — 10–14 Eylül".
2. **İptal onayı** (yıkıcı — tehlike kırmızısı burada meşru): "Ödev iptal edilsin mi?" + zorunlu gerekçe + etki satırı: "26 öğrenci ve velileri 'ödev iptal edildi' bildirimi alacak." Butonlar: "Ödevi iptal et" (tehlike) / Vazgeç.
3. **Yayınlanmış ödevi düzenleme onayı:** düzenleme kaydedilirken: "Değişiklik yayınlanacak — 26 öğrenci ve velileri 'ödev güncellendi' bildirimi alacak." (Düzenleme formu ayrıca tasarlanmaz — Ekran 1 formunun dolu hali; yalnız bu onay diyaloğunu göster.)
4. **Taslak varyantı:** ödev Taslak ise ızgara yerine bilgi durumu: "Bu ödev taslak — yayınlandığında öğrenci listesi burada görünecek" + "Yayınla" birincil butonu (Ekran 1'deki yayın onayına gider).

## E) DURUMLAR

- **Loading:** başlık + özet şeridi iskeleti, 6-8 satır iskeleti.
- **Error:** hata bandı + "Tekrar dene".
- **İşaretleme ağ hatası:** satır önceki durumuna döner + satır içi ince uyarı "Kaydedilemedi — tekrar dene" (dokununca yeniden dener). VERİ KAYBI YOK hissi kritik.
- **Kapandı ödev:** ızgara salt okunur, işaretleme butonları pasif, üst bilgi bandı: "Bu ödev kapandı — kayıtlar salt okunur."
- **Rehber öğretmen salt okunur varyantı** (Ayşe Demir'in 9-A rehberliği, başka öğretmenin ödevi): ızgara durumları GÖRÜNÜR ama butonlar yok (yalnız durum rozetleri), yükleme rozeti sayı gösterir ama görüntüleyici AÇILMAZ, üst bilgi bandı: "Rehber öğretmen görünümü — yalnız görüntüleme."

## ÇIKTI BEKLENTİSİ

1. Web 1440 (light + dark): tam ızgara (örnek veri dağılımıyla) + özet şeridi filtresi aktif hali + yükleme görüntüleyici modalı + 4 diyalog + kapandı ve rehber varyantları.
2. Mobil 402×874 (light): ızgara + tam ekran yükleme görüntüleyici (işaretleme çubuklu) + Muaf bottom sheet + toplu eylem onayı + taslak varyantı.
3. Ağ hatası satır durumu (her iki platformda birer örnek).
4. Kullandığın mobil font boyutlarının listesi + web klavye kısayol yardım satırı.
```

---

## Sipariş sonrası kontrol listesi

- [ ] "Yapılmadı" kırmızı mı olmuş? (olmuşsa reddet — kırmızı yalnız İptal onayında meşru)
- [ ] İşaretleme anında mı kaydediliyor, satır başına toast patlaması var mı? (mikro-onay olmalı, toast değil)
- [ ] Yükleme görüntüleyicide işaretleme çubuğu var mı ve "durum otomatik değişmez" bilgisi duruyor mu?
- [ ] "Sonraki yüklemeli öğrenci" akışı kurulmuş mu? (uzaktan kontrolün hız taşıyıcısı)
- [ ] Toplu eylem sayaçlı mı, onayında "anında bildirim gitmez" yazıyor mu?
- [ ] Mobilde Muaf üç nokta arkasında mı, satır-dokunuş döngüsü sızmış mı? (sızdıysa reddet)
- [ ] Günlük özet bilgi satırı ızgara altında mı?
- [ ] Kapandı + rehber öğretmen salt okunur varyantları eksiksiz mi?
- [ ] Puan/saat sızıntısı? (varsa reddet)