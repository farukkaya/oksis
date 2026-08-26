# OKSİS — Ödev Modülü · Claude Design Prompt · **EKRAN 9: Ödev Politikası (SchoolSettings eki, HW-A-02)**

> Kaynak: `odev-modulu-ihtiyac-analizi-final-2026-08-25.md` §8 / HW-A-02, K-6, BR-HW-08. Kapsam: Faz A. Platform: **Yalnız WEB.** Sipariş paketinin en hafifi: sıfırdan ekran değil, mevcut **Okul Ayarları** sekme anatomisine üç alanlık "Ödev" bölümü eklenir. Yeni tasarım deseni AÇILMAZ — mevcut ayar sekmelerinin (ör. Akademik Politika sekmesi) form kartı, kaydet davranışı ve yardım metni dili birebir devralınır. **Yüzey kuralı geçerli:** zemin üzerine doğrudan metin basılmaz. Aşağıdaki bloğun tamamını kopyala, Claude Design'da yeni oturuma tek parça yapıştır.

```
## ÜRÜN BAĞLAMI

OKSİS: Türkiye'de özel okullar için geliştirilen, çok kiracılı (multi-tenant) bir okul yönetim platformu. Tasarlanacak yüzey: **Okul Ayarları içine eklenen "Ödev" politika bölümü**. Ürün dili Türkçe, hitap "siz". Kullanıcı OKUL YÖNETİCİSİDİR. Tasarım dili: clean, professional, calm.

- **WEB:** Desktop 1440px tuval. Rota /settings, "Ödev" sekmesi/bölümü seçili. Next.js + shadcn/ui (Radix, "Mira" stili) + Tailwind v4. LIGHT ve DARK ikisi de tasarlanır.
- **Mevcut anatomi devralınır:** Okul Ayarları sayfası sekmeli bir yapıdır (sol/üst sekme listesi + sağda form kartları + altta/sağ üstte Kaydet davranışı). Bu siparişte sekme iskeletini temsili göster (diğer sekmeler soluk: Genel · Akademik Politika · Bildirimler · **Ödev (seçili)** ...), asıl iş "Ödev" bölümünün üç ayar kartıdır.

**Kritik bağlam:** Bu ayarlar okul çapındadır ve davranışı doğrudan değiştirir: hatırlatma bildirimi ne zaman gider, eksik ödev velilere nasıl iletilir, pano hangi eşikte uyarır. Yönetici bunları yılda birkaç kez açar — ekran öğretici olmalı: her alan ne işe yaradığını kendi yardım metniyle anlatır.

## MARKA TOKEN'LARI

- `handoff/oksis-brand-tokens.md` 

- Marka laciverti (birincil): #26407F · koyu #1B2B5E · en koyu #141F45
- İmza gradyanı: yalnız giriş/hero yüzeylerinde — ayar ekranlarında KULLANILMAZ
- Metin: ana #141F45 · yumuşak #4A5375 · en yumuşak #8A92AE
- Kenarlık: #DDE3F1 · yumuşak zemin #E9EEF7 · sayfa zemini #F6F8FC · kart #FFFFFF
- Semantik: başarı yeşili, uyarı kehribarı, tehlike kırmızısı, bilgi mavisi — marka dosyasındaki değerler
- Radius: kart 12–14px, buton 8px, çip 999px. Gölge hafif. Glow/glassmorphism yok.
- Tipografi: sayfa başlığı 24px semibold · bölüm başlığı 20px semibold · kart başlığı 18px medium · gövde 14px · caption 12px muted.
- Spacing: 4px grid. Kart içi 16–24px, bölüm arası 24px. İkon seti: Lucide.
- Bu ekran YÖNETİCİ portalındadır.

## DOMAİN SÖZLÜĞÜ (üç ayar — tasarımın tamamı bu üçüdür)

1. **Hatırlatma bildirimi** (`homeworkReminderHoursBefore`, 0–72, varsayılan 24): son teslim tarihinden kaç saat önce öğrencilere (ilkokulda velilere) hatırlatma gönderileceği. 0 = kapalı — arayüzde bu, "Hatırlatma bildirimi" ANAHTARI kapalı olarak temsil edilir (yönetici 0 sayısıyla uğraşmaz).
2. **Eksik ödev veli bildirimi** (`homeworkMissingParentNotification`): öğretmen bir öğrenciyi Eksik/Yapılmadı işaretlediğinde veliye bildirim gitsin mi ve NASIL gitsin: **Günlük özet** (varsayılan — akşam tek bildirim: "Bugün 2 ödevde eksik işaretlendi") veya **Anında** (her işaretlemede ayrı bildirim). Bir de tümden kapalı hali vardır (anahtar kapalı).
3. **Pano uyarı eşiği** (`homeworkDailyDensityThreshold`, 1–10, varsayılan 3): Ödev Panosu'ndaki yoğunluk takviminde, bir şubenin aynı güne bu sayı ve üzeri ödevi düştüğünde hücrenin uyarı vurgusu alması.

Bağlam notu: bildirim ayarları üç katmanlı tercih hiyerarşisinin OKUL katmanıdır (platform → okul → kullanıcı); velinin kendi bildirim tercihleri ayrıca geçerlidir — bu, 2 numaralı kartta bir bilgi satırıyla hatırlatılır.

## DEĞİŞMEZ ÜRÜN KURALLARI (ihlal edilirse tasarım reddedilir)

1. **ZEMİN ÜZERİNE DOĞRUDAN METİN YASAK.** Her metin bir kart (#FFFFFF) veya yumuşak yüzey (#E9EEF7) içinde yaşar.
2. **Yeni desen yok.** Mevcut ayar sekmelerinin kart/başlık/yardım-metni/kaydet dili aynen; bu bölüm diğer sekmelerin kardeşi gibi durmalı.
3. **Üç ayardan fazlası UYDURULMAZ.** "Geç teslim cezası", "maksimum ödev sayısı sınırı", "onay akışı" gibi alanlar eklenmez — kapsam bu üçtür.
4. **"Anında" seçeneği yargısız bilgilendirilir:** yanında nötr yardım metni — "Her işaretlemede veliye ayrı bildirim gider; kalabalık şubelerde gün içinde çok sayıda bildirim oluşturabilir." Korkutma dili yok, kehribar uyarı kutusu yok — muted yardım metni yeter.
5. **Kırmızı yalnız validasyon hatasında** (0–72 aralık dışı saat gibi) ve ölçülü.
6. **Kaydedilmemiş değişiklik kaybolmaz:** dirty state görünür, sekmeden ayrılırken onay istenir.

## ÖRNEK VERİ SETİ

- Okul: **Altınay Lisesi** · Sezon: **2026-2027**
- Varsayılan hal: Hatırlatma AÇIK, 24 saat · Eksik ödev bildirimi AÇIK, Günlük özet · Eşik 3
- Düzenlenmiş hal örneği: Hatırlatma 48 saate çekilmiş, henüz kaydedilmemiş (dirty)

## ERİŞİLEBİLİRLİK

WCAG 2.1 AA. Metin kontrastı 4.5:1. Görünür focus ring. Tüm kontroller klavye ile kullanılabilir; anahtar/radyo durumları yalnız renkle taşınmaz. Geçişler 150–250ms ease-out.

## YASAKLAR

Aşırı gradient, glow, glassmorphism yok. Emoji yok. "Buraya tıklayın" yok. Zemin üzerine doğrudan metin yok. Ayar sayısını artıran uydurma alan yok.

---

# EKRAN: Ödev Politikası bölümü (HW-A-02)

**Amaç:** Yöneticinin üç politika kararını, her birinin ne işe yaradığını ekrandan öğrenerek, iki dakikada verip kaydetmesi.

## A) SEKME İSKELETİ

Okul Ayarları sayfa başlığı + sekme listesi Akademik Politikalar tabı altın Ödev Kartı açılır not sistemi kartının hemen altınd konumlanır.

## B) ÜÇ AYAR (alt alta)

**Ayar 1 — Hatırlatma bildirimi**
- Başlık + yardım metni: "Son teslim tarihi yaklaşan ödevler için öğrencilere hatırlatma gönderilir. İlkokul kademesinde hatırlatma velilere gider."
- Anahtar: Açık/Kapalı. Açıkken altında saat alanı: stepper/sayı girişi + "saat önce" etiketi (aralık 0 hariç 1–72; hızlı değer çipleri: 12 · 24 · 48). Kapalıyken saat alanı gizlenir (pasif değil — gizli).
- Mikro-önizleme satırı (muted): "Örnek: Cuma günü teslim edilecek ödev için hatırlatma Perşembe gönderilir." (24 saat seçiliyken; değer değişince metin uyum sağlar — 48 için "Çarşamba").

**Ayar 2 — Eksik ödev veli bildirimi**
- Başlık + yardım metni: "Öğretmen bir ödevi Eksik veya Yapılmadı olarak işaretlediğinde veliler bilgilendirilir."
- Anahtar: Açık/Kapalı. Açıkken radyo grubu:
  - **Günlük özet (önerilen)** — yardım metni: "Veliye akşam tek bildirim gönderilir: 'Bugün 2 ödevde eksik işaretlendi.'"
  - **Anında** — yardım metni: "Her işaretlemede veliye ayrı bildirim gider; kalabalık şubelerde gün içinde çok sayıda bildirim oluşturabilir."
- Bilgi satırı (muted, kart altı): "Velilerin kendi bildirim tercihleri ayrıca geçerlidir."

**Ayar 3 — Pano uyarı eşiği**
- Başlık + yardım metni: "Ödev Panosu'ndaki yoğunluk takviminde, bir şubenin aynı güne düşen ödev sayısı bu değere ulaştığında hücre uyarı rengiyle vurgulanır."
- Stepper: 1–10, varsayılan 3.
- Mikro-önizleme: yoğunluk hücresinin minik örneği — "2" nötr çip · "3" kehribar çip yan yana, "Eşik 3 iken:" etiketiyle (Ekran 7'deki hücre bileşeninin minyatürü — aynı görsel dil).

## C) KAYDETME DAVRANIŞI

Mevcut ayar sekmeleriyle aynı: değişiklik yapılınca Kaydet çubuğu/butonu aktifleşir ("Kaydet" birincil + "Vazgeç"), kaydedince başarı toast'ı "Ödev ayarları kaydedildi", sekmeden ayrılırken kaydedilmemiş değişiklik onayı: "Kaydedilmemiş değişiklikler var — kaydetmeden çıkılsın mı?"

## D) DURUMLAR

- **Varsayılan hal** (ana frame) · **Dirty hal** (48 saat, Kaydet aktif) · **Validasyon hatası** (saat alanına 100 yazılmış: alan altı "1–72 saat arası bir değer girin") · **Hatırlatma kapalı hali** (saat alanı gizli) · **Bildirim tümden kapalı hali** (radyo grubu gizli) · **Loading** (kart iskeletleri) · **Kaydetme hatası** (kart üstü hata bandı + "Tekrar dene" — girilen değerler kaybolmaz).

## ÇIKTI BEKLENTİSİ

1. Web 1440 LIGHT: varsayılan + dirty + validasyon + iki "kapalı" varyantı.
2. Aynı ana frame'lerin DARK varyantları.
3. Kaydedilmemiş değişiklik onay diyaloğu + başarı toast'ı.
4. Kart 3'teki eşik mikro-önizlemesinin yakın planı (Ekran 7 hücresiyle aynı dil olduğunun kanıtı).
```

---

## Sipariş sonrası kontrol listesi

- [ ] Üç ayardan fazla alan uydurulmuş mu? (uydurulmuşsa reddet — kural 3)
- [ ] "Anında" yardım metni nötr mü — kehribar korku kutusuna dönüşmüş mü?
- [ ] Anahtar kapalıyken alt alanlar gizli mi (pasif/soluk değil)?
- [ ] Eşik mikro-önizlemesi Ekran 7 hücre diliyle aynı mı?
- [ ] Mikro-önizleme satırları değere göre değişiyor mu (24→Perşembe, 48→Çarşamba)?
- [ ] Dirty state + ayrılma onayı + kaydetme hatasında veri korunumu var mı?
- [ ] Mevcut ayar sekmelerinin kardeşi gibi mi duruyor, yeni desen sızmış mı?
- [ ] Zemin üzerinde yüzen metin? (reddet)