# OKSİS — Ödev Modülü · Claude Design Prompt · **EKRAN 4: Ödevlerim (öğrenci, HW-S-01)**

> Kaynak: `odev-modulu-ihtiyac-analizi-final-2026-08-25.md` §8 / HW-S-01. Kapsam: Faz A. Platform: **Yalnız MOBİL.** Öğrenci portalı — vurgu rengi ve ton değişir, yapısal standartlar aynı kalır. **Tema notu:** İhtiyaç analizinde "dark tema birinci sınıf" yazıyordu; ancak mobil uygulamada tema sistemi yok (Not modülü mobil siparişindeki kural). Bu prompt **yalnız light** sipariş eder — tema sistemi yol haritasına girerse dark turu ayrıca açılır. Aşağıdaki bloğun tamamını kopyala, Claude Design'da yeni oturuma tek parça yapıştır.

```
## ÜRÜN BAĞLAMI

OKSİS: Türkiye'de özel okullar için geliştirilen, çok kiracılı (multi-tenant) bir okul yönetim platformu. Tasarlanacak modül: **Ödev (Homework)**. Ürün dili Türkçe. Bu ekranın kullanıcısı ORTAOKUL/LİSE ÖĞRENCİSİDİR — hitap "sen". Ton: genç ama olgun; oyunlaştırma abartısı, çocuksu illüstrasyon ve emoji bombardımanı YOK. Tasarım dili: clean, professional, calm.

Bu oturumda TEK ekran tasarlanacak: **Ödevlerim** (öğrenci ana listesi).
- **MOBİL:** React Native / Expo, tuval 402 × 874, iOS tarzı modern mobil UI. Bu ekran öğrenci tab bar'ındaki **Ödevlerim sekmesinin kök ekranıdır.** Yalnız LIGHT tema (mobilde tema sistemi yok — koyu tema TASARLAMA).

**Kritik bağlam:** Öğrenci bu ekranı akşam çantasını hazırlarken açar. Tek soru: "yarına ne var?" Ekran açılır açılmaz bu soruya cevap vermelidir — kaydırmadan, aramadan.

## MARKA TOKEN'LARI

- `handoff/oksis-brand-tokens.md` 
- Marka laciverti (birincil): #26407F · koyu #1B2B5E · en koyu #141F45
- Metin: ana #141F45 · yumuşak #4A5375 · en yumuşak #8A92AE
- Kenarlık: #DDE3F1 · yumuşak zemin #E9EEF7 · sayfa zemini #F6F8FC · kart #FFFFFF
- Semantik: başarı yeşili, uyarı kehribarı, tehlike kırmızısı, bilgi mavisi — marka dosyasındaki değerler
- Radius: kart 13–16px, buton 12px, çip 999px. Gölge hafif. Glow/glassmorphism yok.
- Tipografi: mobilde kapalı ölçek yok — mevcut prototip 21 / 17 / 15 / 13.5 / 12.5 px civarı; kullandığın her boyutu ekranın yanında açıkça listele.
- Spacing: 4px grid. İkon seti: Lucide.
- Rol bazlı portal renkleri var — bu ekran ÖĞRENCİ portalındadır: üst bar ve seçili sekme öğrenci vurgu rengine boyanır (marka dosyasındaki öğrenci tonu; dosya yoksa marka laciverti ailesinden bir ton seç ve belirt).

## MOBİL YAPISAL STANDARTLAR (mevcut uygulamadan — birebir uy)

- **Üst bar:** SEKME KÖKÜ ekran — büyük başlıklı ana header: başlık "Ödevlerim", ikinci satır öğrenci varyantı: "9-A · Salı, 15 Eylül". Sağda zil ikonu (bildirim rozeti) ve baş harf avatarı (İD).
- **Alt sekme çubuğu görünür:** 5 sekme, Material 3 "indicator" stili. Öğrenci: Anasayfa · Devamsızlığım · Notlarım · **Ödevlerim (seçili)** · Daha fazla.
- **Boş ekran kalıbı (birebir):** 56×56 daire (#E9EEF7 zemin) içinde 24px nötr ikon · başlık 17px/700 · açıklama 14px, maks 260px, ortalanmış.
- **Dokunma hedefi:** minimum 44×44pt, istisnasız. Safe area gözetilir. Yatay sayfa kaydırması yok (yalnız çip şeritleri yatay kayar).

## DOMAİN SÖZLÜĞÜ (öğrenci perspektifinden)

- **Ödev** — öğretmenin verdiği iş: ders, başlık, açıklama, opsiyonel ekler, son teslim TARİHİ (saat yok).
- **Kontrol durumu** — öğretmen kontrol edince öğrencinin ödevi şu etiketlerden birini alır: **Tamamlandı / Eksik / Yapılmadı / Muaf**. Öğretmen HENÜZ kontrol etmediyse öğrenci kartında durum etiketi HİÇ GÖSTERİLMEZ (boş bekleyiş kaygı üretmesin; "kontrol edilmedi" bilgisi detay ekranının işi).
- **Görsel teslim** — öğrencinin ödeve fotoğraf/PDF yüklemesi (defter sayfası çekmek gibi). Bu listede yalnız "yükledin" rozeti olarak görünür; yükleme akışı DETAY ekranındadır (bu oturumda tasarlanmaz).

## DEĞİŞMEZ ÜRÜN KURALLARI (ihlal edilirse tasarım reddedilir)

1. **Öğrenci yüzeyinde KIRMIZI YOK.** En sert ton kehribar/uyarı. "Yapılmadı" bile nötr koyu tonla, yargılamayan dille gösterilir.
2. **Kıyas yok.** Sıralama, "sınıfın %80'i tamamladı", rozet, seri (streak), gamification hiçbir biçimde yok.
3. **Puan yok.** Not/puan kavramı geçmez.
4. **Suçlayıcı dil yok.** "Gecikti!", "Kaçırdın!" gibi ifadeler yasak; geçmiş tarihli ödev nötr anlatılır ("Son gün: dün").
5. **Son teslim yalnız TARİH'tir.** Saat gösterilmez; geri sayım sayacı TASARLANMAZ (kaygı üretir).
6. **Boş ekran yasak.** Empty + loading (skeleton) + error (tekrar dene) state'leri tasarlanır.

## ÖRNEK VERİ SETİ (birebir bu isimler)

- Okul: **Altınay Lisesi** · Öğrenci: **İpek Doğan** · Şube: **9-A** · Bugün: Salı, 15 Eylül 2026
- Dersler ve öğretmenler: Matematik (Ayşe Demir) · Fen Bilimleri (Mehmet Aslan) · İngilizce (Elif Kara) · Türkçe (Canan Yıldız)
- Örnek ödevler (listeyi bunlarla doldur — grup ve durum çeşitliliği bilinçli):
  1. "Sayfa 42–45 problemler" · Matematik · **Son: bugün** · 1 ek · yükleme yok · durum etiketi yok
  2. "Kelime çalışması Unit 3" · İngilizce · **Son: yarın** · durum etiketi yok · SEN YÜKLEDİN rozeti (2 görsel)
  3. "Güneş Sistemi maketi" · Fen Bilimleri · Son: Cuma, 18 Eylül · 1 ek
  4. "Paragraf analizi" · Türkçe · Son: Pazartesi, 21 Eylül
  5. "Üslü sayılar çalışma kağıdı" · Matematik · Son gün: dün · durum: **Eksik** (kehribar)
  6. "Denklem kurma alıştırmaları" · Matematik · Son gün: 11 Eylül · durum: **Tamamlandı** (yeşil + tik)
  7. "Okuma günlüğü" · Türkçe · Son gün: 10 Eylül · durum: **Tamamlandı**

## ERİŞİLEBİLİRLİK

WCAG 2.1 AA. Metin kontrastı 4.5:1. Durum yalnız renkle taşınmaz — ikon ve/veya metin eşlik eder. Dokunma hedefleri 44pt. Geçişler 150–250ms ease-out; animasyon fonksiyonel, süs değil.

## YASAKLAR

Aşırı gradient, glow, glassmorphism yok. Emoji yok. Çocuksu illüstrasyon yok. Konfeti/kutlama animasyonu yok. "Buraya tıklayın" yok. Stok fotoğraf yok.

---

# EKRAN: Ödevlerim (öğrenci, HW-S-01)

**Amaç:** İpek'in akşam çanta hazırlarken "yarına ne var?" sorusuna ekran açılır açılmaz cevap alması; hangi ödevde ne durumda olduğunu kaygı üretmeyen bir dille görmesi.

## A) LİSTE YAPISI

**Dört grup, bu sırayla (bölüm başlıkları sade, sayaçlı):**
1. **"Bugün son"** — varsa en üstte, hafif vurgulu bölüm (kehribar DEĞİL — nötr vurgu, örn. yumuşak zemin şeridi). Yoksa bölüm hiç render edilmez.
2. **"Bu hafta"** — yarından hafta sonuna.
3. **"İleri tarihli"**
4. **"Geçmiş"** — varsayılan DARALTILMIŞ (başlık + sayaç + aç/kapa; açılınca kartlar).

**Ödev kartı anatomisi:** ders adı (küçük, muted, üstte) · başlık (ana satır) · son tarih insan diliyle ("Son: bugün" / "Son: yarın" / "Son: Cuma, 18 Eylül" / geçmişte "Son gün: dün") · ek rozeti (paperclip, varsa) · **"Yükledin" rozeti** (görsel ikonu + sayı, yalnız kendi yüklemesi varsa) · **durum etiketi** (yalnız öğretmen işaretlediyse: Tamamlandı yeşil+tik / Eksik kehribar / Yapılmadı nötr koyu / Muaf soluk "M"). Karta dokunuş → ödev detayı (Ekran 5, bu oturumda tasarlanmaz).

**Ders filtresi:** üstte yatay çip şeridi: Tümü · Matematik · Fen Bilimleri · İngilizce · Türkçe. Seçim grupları korur, içeriği süzer.

## B) DURUM DİLİ (kritik)

- Öğretmen işaretlemediyse kartta durum HİÇ YOK — boşluk doğaldır, "bekleniyor" etiketi de konmaz.
- "Eksik" kehribar ama metni yumuşak: yalnız "Eksik" — ünlem yok, açıklama detayda.
- "Yapılmadı" nötr koyu ton, ikon dairesi; kırmızı ve suçlayıcı mikro-metin YASAK.
- Geçmiş gruptaki işaretlenmemiş ödev de nötr durur (etiketsiz).

## C) DURUMLAR

- **Tam boş (hiç ödev yok):** boş ekran kalıbı — ikon: açık kitap, başlık "Şu an ödevin yok", açıklama "Öğretmenlerin ödev verdiğinde burada göreceksin."
- **"Bugün son" boş ama başka gruplar dolu:** bölüm render edilmez (yukarıda kural).
- **Filtre sonucu boş:** "Bu derste ödevin yok" + "Filtreyi temizle".
- **Loading:** 4-5 kart iskeleti, grup başlığı iskeletiyle.
- **Error:** hata bandı + "Tekrar dene".
- **Bildirim derin bağlantısı notu:** "Yeni ödev" bildirimi bu listeye değil doğrudan ödev DETAYINA iner — bu ekranda ek tasarım gerekmez, bilgi olarak dursun.

## ÇIKTI BEKLENTİSİ

1. Mobil 402×874 (light): dolu liste (örnek veriyle, dört grup görünür, Geçmiş daraltılmış) + Geçmiş açılmış varyant + ders filtresi aktif varyant.
2. Empty (tam boş) + loading + error frame'leri.
3. Kart anatomisinin yakın plan component sheet'i: durum etiketli/etiketsiz, yüklemeli/yüklemesiz, ekli/eksiz varyantlar.
4. Kullandığın font boyutlarının listesi.
```

---

## Sipariş sonrası kontrol listesi

- [ ] Ekran açılışında "Bugün son" ilk bakışta görünüyor mu (kaydırmasız)?
- [ ] Kırmızı sızmış mı? (öğrenci yüzeyinde tek pikseli bile reddet)
- [ ] İşaretlenmemiş kartlarda "bekleniyor" tarzı bir etiket uydurulmuş mu? (uydurulmuşsa reddet — etiketsiz olmalı)
- [ ] Geri sayım sayacı / "kalan süre" sızmış mı? (reddet)
- [ ] Gamification (rozet, seri, konfeti, yüzde) sızmış mı? (reddet)
- [ ] "Geçmiş" varsayılan daraltılmış mı?
- [ ] "Yükledin" rozeti yalnız yüklemeli kartta mı?
- [ ] Ton "sen" mi, suçlayıcı ifade var mı?