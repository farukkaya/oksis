# OKSİS — Ödev Modülü · Claude Design Prompt · **EKRAN 1: Ödev Oluştur / Yayınla (HW-T-01)**

> Kaynak: `odev-modulu-ihtiyac-analizi-final-2026-08-25.md` §8 / HW-T-01. Kapsam: Faz A. Platform: **Web + Mobil** — tek oturumda iki tuval. **Mobil birincildir** (teneffüs gerçeği): önce mobil tasarlanır, web onu takip eder. Aşağıdaki bloğun tamamını kopyala, Claude Design'da yeni oturuma tek parça yapıştır. Ortak bağlam bloğu (ÜRÜN BAĞLAMI → YASAKLAR arası) sonraki ekran promptlarında da aynen tekrar edecek — oturumlar birbirini görmediği için her promptta taşınır.

```
## ÜRÜN BAĞLAMI

OKSİS: Türkiye'de özel okullar için geliştirilen, çok kiracılı (multi-tenant) bir okul yönetim platformu. Tasarlanacak modül: **Ödev (Homework)**. Ürün dili Türkçe, hitap "siz". Kullanıcı kitlesi teknoloji meraklısı değil — öğretmen, veli, ortaokul/lise öğrencisi. Tasarım dili: clean, professional, calm. Demoda etkileyici değil, günlük kullanımda yormayan.

Bu oturumda TEK ekran tasarlanacak: **Ödev Oluştur / Yayınla** (öğretmen). İki platform, iki tuval:
- **MOBİL (birincil):** React Native / Expo, tuval 402 × 874, iOS tarzı modern mobil UI. Öğretmen bu ekranı teneffüste, ayakta, tek elle kullanır — hedef: tekrar eden öğretmen için ödev vermeyi 60 saniyenin altında bitirmek. Yalnız LIGHT tema (mobilde tema sistemi yok — koyu tema TASARLAMA).
- **WEB:** Desktop 1440px tuval. Next.js + shadcn/ui (Radix, "Mira" stili) + Tailwind v4 — modern, nötr, Tailwind-vari görsel dil. Bootstrap/MUI görünümü yok. LIGHT ve DARK ikisi de tasarlanır.

## MARKA TOKEN'LARI

<<< Buraya `.claude/skills/handoff-web/oksis-brand-tokens.md` dosyasının içeriğini yapıştır. Aşağıdakiler bilinen çekirdek değerler; dosyadaki tam liste bunları ezer. >>>

- Marka laciverti (birincil): #26407F · koyu #1B2B5E · en koyu #141F45
- İmza gradyanı: bu üç laciverdin radyal geçişi — yalnız giriş/hero yüzeylerinde, veri/form ekranlarında KULLANILMAZ
- Metin: ana #141F45 · yumuşak #4A5375 · en yumuşak #8A92AE
- Kenarlık: #DDE3F1 · yumuşak zemin #E9EEF7 · sayfa zemini #F6F8FC · kart #FFFFFF
- Semantik: başarı yeşili, uyarı kehribarı, tehlike kırmızısı, bilgi mavisi — marka dosyasındaki değerler
- Radius: web'de kart 12–14px / buton 8px, mobilde kart 13–16px / buton 12px; çip 999px. Gölge hafif. Glow/glassmorphism yok.
- Tipografi (web): sayfa başlığı 24px semibold · bölüm başlığı 20px semibold · kart başlığı 18px medium · gövde 14px · caption 12px muted. Mobilde kapalı ölçek yok — mevcut prototip 21 / 17 / 15 / 13.5 / 12.5 px civarı; kullandığın her boyutu ekranın yanında açıkça listele.
- Spacing: 4px grid. Kart içi 16–24px, bölüm arası 24px.
- İkon seti: Lucide.
- Rol bazlı portal renkleri var (öğretmen / öğrenci / veli / yönetici farklı vurgu rengi taşır) — mobilde üst bar ve seçili sekme bu renge boyanır; bu ekran ÖĞRETMEN portalındadır.

## MOBİL YAPISAL STANDARTLAR (mevcut uygulamadan — birebir uy)

- **Üst bar:** Bu ekran bir alt (stack) ekrandır — ince üst bar: geri oku (dairesiz), solda başlık "Yeni Ödev", sağda tek aksiyon yok (aksiyonlar alt sabit çubukta).
- **Alt sekme çubuğu bu ekranda görünmez** (stack ekran); bağlam için: öğretmen tab bar'ı Anasayfa · Yoklama · Notlar · **Ödev** · Daha fazla şeklindedir, bu ekran Ödev sekmesinden açılır.
- **Boş ekran kalıbı (gerekirse):** 56×56 daire (#E9EEF7 zemin) içinde 24px nötr ikon · başlık 17px/700 · açıklama 14px, maks 260px, ortalanmış.
- **Dokunma hedefi:** minimum 44×44pt, istisnasız. Safe area gözetilir. Yatay sayfa kaydırması yok (yalnız çip şeritleri yatay kayar).

## DOMAİN SÖZLÜĞÜ (tasarımın tamamı buna dayanır — karıştırma)

- **Ödev** — öğretmenin bir şube × ders kapsamında verdiği iş: başlık, açıklama, opsiyonel ekler, zorunlu son teslim TARİHİ (saat yok). Hedefi şubenin TAMAMI veya SEÇİLİ ÖĞRENCİLER olabilir.
- **Teslim Takip Kaydı** — yayın anında hedefteki her öğrenci için otomatik açılan kayıt; başlangıç durumu "İşaretlenmedi". (Bu ekranda görünmez, ama yayın onayının ne ürettiğini bilmen için.)
- **Yaşam döngüsü:** Taslak → Yayınlandı → Süresi Doldu → Kapandı. Taslak yalnız sahibine görünür ve bildirim üretmez. Yayın geri alınamaz. Yayın anında öğrenci + veliye bildirim gider.
- **Görsel teslim** — öğrencinin sonradan fotoğraf/dosya yüklemesi; bu ekranın konusu değil.

## DEĞİŞMEZ ÜRÜN KURALLARI (ihlal edilirse tasarım reddedilir)

1. **Puan alanı YOK.** Bu modülde not/puan kavramı hiçbir ekranda geçmez.
2. **Kıyas yok.** Sıralama, başarı ligi, rozet, gamification hiçbir ekranda yok.
3. **Bildirim üreten her aksiyonun onayında etkisi yazılır** — "Yayınla" onayı kaç öğrenci ve kaç velinin bildirim alacağını açıkça söyler. Sürpriz yok.
4. **Son teslim yalnız TARİH'tir.** Saat seçici tasarlanmaz (Faz B konusu).
5. **Boş ekran yasak.** Gerekli her durumda empty + loading (skeleton) + error (tekrar dene) state'i tasarlanır.
6. **Taslak güveni:** "Taslak kaydet" ile "Yayınla" görsel olarak net ayrışır; öğretmen hangi butonun aileye bildirim göndereceğinden bir an bile şüphe etmez.

## ÖRNEK VERİ SETİ (birebir bu isimler — ekranlar tek ürün gibi dursun)

- Okul: **Altınay Lisesi** · Sezon: **2026-2027** · Dönem: **1. Dönem** · Bugün: Salı, 15 Eylül 2026
- Öğretmen: **Ayşe Demir** (Matematik). Görevli şubeleri: **9-A** (30 öğrenci), **9-B** (28), **10-C** (26), **11-A** (24)
- Örnek ödev: başlık "Sayfa 42–45 problemler", açıklama "Ders kitabındaki 42–45. sayfa problemlerini defterinize çözünüz. 7 ve 9. soruları atlayabilirsiniz.", ek: "problem-cozum-ornekleri.pdf" + bağlantı "khanacademy.org/…"
- Son tarih hızlı seçenekleri: **Yarın · Bu Cuma · Haftaya bugün · Takvimden seç**
- Öğrenciler (9-A, numara + ad — alt küme seçiminde ve Türkçe karakter testinde birebir kullan):
  1023 Ada Yılmaz · 1024 Berk Aydın · 1025 Ceren Şahin · 1026 Deniz Kaya · 1027 Ecrin Öz ·
  1028 Furkan Ateş · 1029 Gökçe Uysal · 1030 Halil İbrahim Çetin · 1031 Irmak Güneş · 1032 İpek Doğan

## ERİŞİLEBİLİRLİK

WCAG 2.1 AA. Metin kontrastı 4.5:1. Görünür focus ring (marka renkli). Web'de tüm etkileşimli öğeler klavye ile erişilebilir; diyaloglar Esc ile kapanır. Durum yalnız renkle taşınmaz — ikon ve/veya metin eşlik eder. Geçişler 150–250ms ease-out; animasyon fonksiyonel, süs değil.

## YASAKLAR

Aşırı gradient, glow, glassmorphism yok. Veri/form ekranlarında imza gradyanı kullanılmaz. "Buraya tıklayın" gibi anlamsız metinler yok. Stok fotoğraf yok. Emoji yok.

---

# EKRAN: Ödev Oluştur / Yayınla (HW-T-01)

**Amaç:** Ayşe Demir'in teneffüste, telefondan, 60 saniyenin altında ödev verip yayınlaması. Web aynı formun masabaşı halidir — daha ferah, ama fazladan alan/adım İÇERMEZ.

## FORM ALANLARI (sıra önemli — en sık değişenden en az değişene)

1) **Şube seçimi (çoklu).** Çip şeridi: 9-A · 9-B · 10-C · 11-A. Birden fazla seçilebilir; seçili çip dolgulu. Varsayılan: son ödev verilen şube ÖN SEÇİLİ (mikro-metin: "Son: 9-A"). Çoklu seçimde formun altında bilgi satırı: "Bu ödev 2 şubeye ayrı ayrı verilecek."
2) **Ders.** Ayşe Demir'in görevlendirmesinden gelir — tek dersi (Matematik) varsa alan salt okunur bilgi satırıdır, seçici gösterilmez. (Web'de çok dersli öğretmen varyantını da göster: küçük select.)
3) **Hedef.** Segment kontrol, iki seçenek: **"Tüm şube"** (varsayılan) · **"Seçili öğrenciler"**. "Seçili öğrenciler" seçilince: mobilde bottom sheet, web'de popover — arama kutulu, çoklu seçimli 9-A öğrenci listesi (numara + ad, satır başına checkbox, 44pt satır). Seçim sonrası alan "8 öğrenci seçildi" özetine döner, dokununca tekrar açılır. Çoklu şube + seçili öğrenci birlikteyse öğrenci seçimi şube başına sekmelenir.
4) **Başlık.** Tek satır, zorunlu, placeholder: "Örn. Sayfa 42–45 problemler".
5) **Açıklama.** Çok satırlı, opsiyonel ama teşvikli; sade metin (zengin metin editörü YOK — Faz A sade).
6) **Ekler.** İki tip, tek satırda iki hafif buton: "Dosya ekle" (ikon: paperclip) ve "Bağlantı ekle" (ikon: link). Eklenenler form içinde kompakt çip/kart listesi: dosya adı + boyut + kaldır (X). Örnek veriyle bir dosya + bir bağlantı ekli göster.
7) **Son teslim tarihi.** Zorunlu. Hızlı seçenek çipleri: Yarın · Bu Cuma · Haftaya bugün · Takvimden seç. Seçilen tarih insan diliyle yazılır: "Cuma, 18 Eylül". SAAT YOK.

## ALT SABİT AKSİYON ÇUBUĞU (mobil) / FORM ALTI (web)

İki buton, görsel hiyerarşi net: **"Yayınla"** (birincil, dolgulu lacivert) · **"Taslak kaydet"** (ikincil, outline). Mobilde alt sabit çubuk, safe area üstünde.

## YAYIN ONAY DİYALOĞU (mobilde bottom sheet, web'de dialog)

Başlık: "Ödev yayınlansın mı?" Gövde, etkiyi sayıyla yazar:
- Tek şube + tüm şube örneği: "9-A şubesindeki 30 öğrenci ve velileri bildirim alacak."
- Çoklu şube örneği: "2 şubeye ayrı ayrı verilecek: 9-A (30) ve 9-B (28). Toplam 58 öğrenci ve velileri bildirim alacak."
- Seçili öğrenci örneği: "9-A şubesinden seçtiğiniz 8 öğrenci ve velileri bildirim alacak."
Satır: son teslim tarihi tekrar gösterilir. Butonlar: "Yayınla" (birincil) · "Vazgeç". Uyarı mikro-metni: "Yayın geri alınamaz; gerekirse ödevi iptal edebilirsiniz."
ÜÇ VARYANTI DA göster (tek şube / çoklu şube / seçili öğrenci).

## GERİ BİLDİRİM & DURUMLAR

- Yayın sonrası: başarı toast'ı "Ödev yayınlandı" + ödev detayına dönüş.
- Taslak sonrası: nötr toast "Taslak kaydedildi — yalnız siz görüyorsunuz."
- Validasyon: başlık boş / tarih seçilmemiş / tarih geçmişte ("Son teslim tarihi geçmişte olamaz") — alan altı inline hata, kırmızı ölçülü.
- Dosya yükleme durumları: yükleniyor (ilerleme), başarısız (yeniden dene), başarılı.
- Kaydetme sırasında ağ hatası: form verisi KAYBOLMAZ — hata bandı + "Tekrar dene".

## ÇIKTI BEKLENTİSİ

1. Mobil 402×874 (light): form ekranı + hedef seçim bottom sheet'i + yayın onay bottom sheet'i (3 varyant) + toast'lar + validasyon durumu.
2. Web 1440 (light + dark): aynı formun tek kolonlu, maks ~720px genişlikte ortalanmış hali + dialog varyantları.
3. Kullandığın mobil font boyutlarının listesi.
```

---

## Sipariş sonrası kontrol listesi (Claude Design çıktısını değerlendirirken)

- [ ] "Yayınla" ile "Taslak kaydet" bir bakışta ayrışıyor mu?
- [ ] Onay diyaloğu bildirim etkisini sayıyla söylüyor mu (üç varyant da)?
- [ ] Saat seçici sızmış mı? (sızdıysa reddet — K-6)
- [ ] Puan/not alanı sızmış mı? (sızdıysa reddet — K-3)
- [ ] Son kullanılan şube ön seçili mi, hızlı tarih çipleri var mı? (60 sn hedefinin taşıyıcıları)
- [ ] Mobil dokunma hedefleri 44pt, alt çubuk safe area üstünde mi?
- [ ] Web dark tema kontrastı AA'yı koruyor mu?