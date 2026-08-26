# OKSİS — Ödev Modülü · Claude Design Prompt · **EKRAN 2: Ödev Listem (öğretmen)**

> Kaynak: `odev-modulu-ihtiyac-analizi-final-2026-08-25.md` §8. Kapsam: Faz A. Platform: **Web + Mobil** — tek oturumda iki tuval. Mobilde bu ekran **Ödev sekmesinin kök ekranıdır** (öğretmenin modüle giriş kapısı). Bu ekran ayrıca modül boyunca tekrar edecek **çekirdek bileşenleri** (durum çipi, kontrol ilerlemesi, yükleme rozeti) ilk kez tanımlar — Ekran 3, 7 ve 8 bu bileşenleri aynen devralacak. Aşağıdaki bloğun tamamını kopyala, Claude Design'da yeni oturuma tek parça yapıştır.

```
## ÜRÜN BAĞLAMI

OKSİS: Türkiye'de özel okullar için geliştirilen, çok kiracılı (multi-tenant) bir okul yönetim platformu. Tasarlanacak modül: **Ödev (Homework)**. Ürün dili Türkçe, hitap "siz". Kullanıcı kitlesi teknoloji meraklısı değil — öğretmen, veli, ortaokul/lise öğrencisi. Tasarım dili: clean, professional, calm. Demoda etkileyici değil, günlük kullanımda yormayan.

Bu oturumda TEK ekran tasarlanacak: **Ödev Listem** (öğretmen). İki platform, iki tuval:
- **MOBİL:** React Native / Expo, tuval 402 × 874, iOS tarzı modern mobil UI. Bu ekran öğretmen tab bar'ındaki **Ödev sekmesinin kök ekranıdır**. Yalnız LIGHT tema (mobilde tema sistemi yok — koyu tema TASARLAMA).
- **WEB:** Desktop 1440px tuval, rota /homework. Next.js + shadcn/ui (Radix, "Mira" stili) + Tailwind v4 — modern, nötr, Tailwind-vari görsel dil. Bootstrap/MUI görünümü yok. LIGHT ve DARK ikisi de tasarlanır.

## MARKA TOKEN'LARI

<<< Buraya `.claude/skills/handoff-web/oksis-brand-tokens.md` dosyasının içeriğini yapıştır. Aşağıdakiler bilinen çekirdek değerler; dosyadaki tam liste bunları ezer. >>>

- Marka laciverti (birincil): #26407F · koyu #1B2B5E · en koyu #141F45
- İmza gradyanı: bu üç laciverdin radyal geçişi — yalnız giriş/hero yüzeylerinde, veri ekranlarında KULLANILMAZ
- Metin: ana #141F45 · yumuşak #4A5375 · en yumuşak #8A92AE
- Kenarlık: #DDE3F1 · yumuşak zemin #E9EEF7 · sayfa zemini #F6F8FC · kart #FFFFFF
- Semantik: başarı yeşili, uyarı kehribarı, tehlike kırmızısı, bilgi mavisi — marka dosyasındaki değerler
- Radius: web'de kart 12–14px / buton 8px, mobilde kart 13–16px / buton 12px; çip 999px. Gölge hafif. Glow/glassmorphism yok.
- Tipografi (web): sayfa başlığı 24px semibold · bölüm başlığı 20px semibold · kart başlığı 18px medium · gövde 14px · caption 12px muted. Mobilde kapalı ölçek yok — mevcut prototip 21 / 17 / 15 / 13.5 / 12.5 px civarı; kullandığın her boyutu ekranın yanında açıkça listele.
- Spacing: 4px grid. Kart içi 16–24px, bölüm arası 24px.
- İkon seti: Lucide.
- Rol bazlı portal renkleri var (öğretmen / öğrenci / veli / yönetici farklı vurgu rengi taşır) — mobilde üst bar ve seçili sekme bu renge boyanır; bu ekran ÖĞRETMEN portalındadır.

## MOBİL YAPISAL STANDARTLAR (mevcut uygulamadan — birebir uy)

- **Üst bar:** Bu ekran bir SEKME KÖKÜ ekrandır — büyük başlıklı ana header: başlık "Ödevler", ikinci satır "Salı, 15 Eylül 2026". Sağda zil ikonu (bildirim rozeti) ve baş harf avatarı (AD).
- **Alt sekme çubuğu görünür:** 5 sekme, Material 3 "indicator" stili. Öğretmen: Anasayfa · Yoklama · Notlar · **Ödev (seçili)** · Daha fazla.
- **Boş ekran kalıbı (birebir):** 56×56 daire (#E9EEF7 zemin) içinde 24px nötr ikon · başlık 17px/700 · açıklama 14px, maks 260px, ortalanmış.
- **Dokunma hedefi:** minimum 44×44pt, istisnasız. Safe area gözetilir. Yatay sayfa kaydırması yok (yalnız çip şeritleri yatay kayar).

## DOMAİN SÖZLÜĞÜ (tasarımın tamamı buna dayanır — karıştırma)

- **Ödev** — öğretmenin bir şube × ders kapsamında verdiği iş: başlık, açıklama, opsiyonel ekler, zorunlu son teslim TARİHİ (saat yok). Hedefi şubenin TAMAMI veya SEÇİLİ ÖĞRENCİLER olabilir.
- **Teslim Takip Kaydı** — yayın anında hedefteki her öğrenci için otomatik açılan kayıt; öğretmen kontrolüyle Tamamlandı / Eksik / Yapılmadı / Muaf olur. Başlangıç durumu "İşaretlenmedi" = henüz kontrol edilmedi demektir, asla "yapılmadı" değildir.
- **Ödev yaşam döngüsü (dört durum — bu ekranın çip ailesi):**

| Durum | Anlam | Görsel dil |
|---|---|---|
| Taslak | Yalnız öğretmen görüyor, bildirim gitmedi | kehribar/uyarı tonu, kesik kenarlıklı çip |
| Yayınlandı | Aile görüyor, bildirim gitti, son tarih gelmedi | bilgi mavisi / marka tonu |
| Süresi Doldu | Son tarih geçti, kontrol bekleniyor olabilir | nötr koyu; kontrol eksikse yanında uyarı sinyali |
| Kapandı | Öğretmen kontrolü bitirdi | başarı yeşili + tik |

- **Görsel teslim** — öğrencinin ödeve fotoğraf/dosya yüklemesi; listede yalnız sayaç rozeti olarak görünür ("5 yükleme").

## DEĞİŞMEZ ÜRÜN KURALLARI (ihlal edilirse tasarım reddedilir)

1. **Puan alanı YOK.** Bu modülde not/puan kavramı hiçbir ekranda geçmez.
2. **Kıyas yok.** Sıralama, başarı ligi, rozet, gamification hiçbir ekranda yok.
3. **"İşaretlenmedi" asla olumsuzluk gibi gösterilmez** — kırmızı değil, nötr; anlamı "henüz kontrol edilmedi"dir.
4. **Kontrol eksikliği öğretmeni suçlamaz.** "Süresi doldu, kontrol bekliyor" sinyali kehribar uyarıdır, kırmızı alarm değil; dili nötrdür ("Kontrol bekliyor"), emir kipi ve ünlem yoktur.
5. **Son teslim yalnız TARİH'tir.** Saat gösterilmez.
6. **Boş ekran yasak.** Liste için empty + loading (skeleton) + error (tekrar dene) state'i tasarlanır.

## ÖRNEK VERİ SETİ (birebir bu isimler — ekranlar tek ürün gibi dursun)

- Okul: **Altınay Lisesi** · Sezon: **2026-2027** · Dönem: **1. Dönem** · Bugün: Salı, 15 Eylül 2026
- Öğretmen: **Ayşe Demir** (Matematik). Görevli şubeleri: **9-A** (30 öğrenci), **9-B** (28), **10-C** (26), **11-A** (24)
- Örnek ödevler (listeyi bunlarla doldur — durum çeşitliliği bilinçli):
  1. "Sayfa 42–45 problemler" · 9-A · son: Cuma, 18 Eylül · **Yayınlandı** · kontrol 0/30 · 4 yükleme · 1 ek
  2. "Denklem kurma alıştırmaları" · 9-B · son: Perşembe, 17 Eylül · **Yayınlandı** · kontrol 0/28 · 0 yükleme
  3. "Üslü sayılar çalışma kağıdı" · 10-C · son: Dün (14 Eylül) · **Süresi Doldu** · kontrol 12/26 · 7 yükleme · KONTROL BEKLİYOR sinyali
  4. "Problem çözüm teknikleri özeti" · 11-A · son: 11 Eylül · **Kapandı** · kontrol 24/24 · 3 yükleme
  5. "Kesirler tekrar testi" · 9-A · **seçili 8 öğrenci** · son: Pazartesi, 21 Eylül · **Yayınlandı** · kontrol 0/8
  6. "Geometri ön hazırlık" · 10-C · **Taslak** (tarih henüz yok gösterilebilir veya seçilmiş ama yayınlanmamış)
- Rehber öğretmen varyantı için: Ayşe Demir aynı zamanda **9-A rehber öğretmenidir**; 9-A'nın diğer derslerinden örnek: "Güneş Sistemi maketi" · Fen Bilimleri · Mehmet Aslan · Yayınlandı · kontrol 5/30

## ERİŞİLEBİLİRLİK

WCAG 2.1 AA. Metin kontrastı 4.5:1. Görünür focus ring (marka renkli). Web'de tüm etkileşimli öğeler klavye ile erişilebilir. Durum yalnız renkle taşınmaz — ikon ve/veya metin eşlik eder. Geçişler 150–250ms ease-out; animasyon fonksiyonel, süs değil.

## YASAKLAR

Aşırı gradient, glow, glassmorphism yok. Veri ekranlarında imza gradyanı kullanılmaz. "Buraya tıklayın" gibi anlamsız metinler yok. Stok fotoğraf yok. Emoji yok.

---

# EKRAN: Ödev Listem (öğretmen)

**Amaç:** Ayşe Demir'in verdiği tüm ödevleri tek bakışta görmesi; "hangisinin süresi doldu, hangisini kontrol etmedim" sorusuna liste açılır açılmaz cevap alması; yeni ödev vermeye tek dokunuşla geçmesi.

## A) ÇEKİRDEK BİLEŞENLER (component sheet olarak ayrıca göster — sonraki ekranlar bunları devralacak)

1) **Ödev Durum Çipi** — dört durumun (Taslak / Yayınlandı / Süresi Doldu / Kapandı) çip varyantları, domain sözlüğündeki görsel dile göre. Kompakt (kart içi) ve normal (detay başlığı) iki boyut.
2) **Kontrol İlerlemesi** — "12/26 kontrol edildi" mikro bileşeni: ince çubuk + metin. 0/N halinde çubuk boş ama bileşen görünür.
3) **Yükleme Rozeti** — küçük görsel ikonu (Lucide: image) + sayı: "7". Sıfırsa hiç render edilmez.
4) **Hedef Rozeti** — "Tüm şube" için rozet YOK (varsayılan); "seçili öğrenciler" için kompakt rozet: kişi ikonu + "8 öğrenci".
5) **Kontrol Bekliyor Sinyali** — süresi dolmuş ve kontrolü tamamlanmamış kartın solunda 3px kehribar dikey şerit + kart içinde "Kontrol bekliyor" mikro-etiketi. Kırmızı DEĞİL.

## B) LİSTE YAPISI

**Gruplama (varsayılan görünüm):** üç bölüm, bu sırayla —
1. **"Kontrol bekliyor"** (süresi dolmuş + kontrolü eksik) — en üstte, çünkü öğretmenin işi burada
2. **"Aktif"** (Yayınlandı, süresi gelmemiş)
3. **"Taslaklar"**
Kapandı ödevler varsayılan listede yok; "Geçmiş" filtresiyle gelir.

**Ödev kartı anatomisi:** başlık (tek satır, taşarsa kısalt) · şube çipi · son teslim tarihi (insan dili: "Son: Cuma, 18 Eylül" — süresi dolmuşta "Son: dün") · durum çipi · kontrol ilerlemesi · yükleme rozeti (varsa) · hedef rozeti (varsa) · ek rozeti (varsa, paperclip + sayı). Karta dokunuş → ödev detayı (Ekran 3, bu oturumda tasarlanmıyor).

**Filtreler:**
- Mobil: üst bölgede yatay çip şeridi — Şube (Tümü · 9-A · 9-B · 10-C · 11-A) + ikinci şerit veya filtre sheet'inde Durum (Tümü · Aktif · Kontrol bekliyor · Taslak · Geçmiş). Dönem seçici "Daha fazla" filtre sheet'inde (varsayılan: 1. Dönem).
- Web: sol filtre çubuğu veya üst filtre satırı — şube, durum, dönem select'leri + arama kutusu (başlıkta ara). Web'de liste, kart yerine YOĞUN TABLO görünümü de sunulabilir; ikisini de göster (kart görünümü varsayılan, tablo toggle).

**Yeni ödev:** mobilde sağ altta FAB (artı ikonu, marka laciverti) → Ekran 1'e gider. Web'de sayfa başlığının sağında "Yeni Ödev" birincil butonu.

## C) REHBER ÖĞRETMEN VARYANTI (salt okunur — ayrı frame)

Ayşe Demir 9-A rehber öğretmeni. Listede ikinci bir sekme/segment: **"Verdiklerim" (varsayılan) · "9-A Şubem"**. "9-A Şubem" görünümü: 9-A'ya TÜM derslerden verilen ödevler; kart anatomisi aynı + ders adı ve veren öğretmen adı eklenir ("Fen Bilimleri · Mehmet Aslan"). Bu görünüm SALT OKUNURDUR: FAB/Yeni Ödev bu sekmede görünmez, kartlarda üst bilgi bandı: "Rehber öğretmen görünümü — yalnız görüntüleme". Yükleme rozetinde sayı görünür ama içerik açılmaz (detaya inişte de içerik yok — bu oturumda yalnız liste seviyesi).

## D) DURUMLAR

- **Empty (hiç ödev yok):** boş ekran kalıbıyla — ikon: kitap/kalem, başlık "Henüz ödev vermediniz", açıklama "İlk ödevinizi vermek için + butonuna dokunun." (Web'de buton referanslı eşdeğeri.)
- **Empty (filtre sonucu boş):** "Bu filtrelerle ödev bulunamadı" + "Filtreleri temizle".
- **Loading:** kart iskeletleri (3-4 skeleton kart).
- **Error:** hata bandı + "Tekrar dene".

## ÇIKTI BEKLENTİSİ

1. Component sheet (A bölümündeki 5 bileşen, varyantlarıyla).
2. Mobil 402×874 (light): varsayılan liste (3 bölümlü, örnek veriyle dolu) + filtre sheet'i + rehber öğretmen sekmesi + empty/loading/error.
3. Web 1440 (light + dark): kart görünümü + tablo görünümü + rehber öğretmen varyantı.
4. Kullandığın mobil font boyutlarının listesi.
```

---

## Sipariş sonrası kontrol listesi

- [ ] "Kontrol bekliyor" bölümü en üstte mi ve kehribar mı (kırmızı sızmış mı)?
- [ ] Dört durum çipi domain tablosundaki görsel dile uyuyor mu; component sheet ayrıca verilmiş mi?
- [ ] "İşaretlenmedi/0-N kontrol" nötr mü duruyor?
- [ ] Seçili-öğrenci ödevinde hedef rozeti var, tüm-şube ödevinde yok mu?
- [ ] Rehber öğretmen sekmesi gerçekten salt okunur mu (FAB gizli, bilgi bandı var)?
- [ ] Puan/saat sızıntısı var mı? (varsa reddet)
- [ ] Empty/loading/error üçlüsü eksiksiz mi?