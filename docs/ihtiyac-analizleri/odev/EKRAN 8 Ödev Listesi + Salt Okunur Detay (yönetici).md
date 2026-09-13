# OKSİS — Ödev Modülü · Claude Design Prompt · **EKRAN 8: Ödev Listesi + Salt Okunur Detay (yönetici)**

> Kaynak: `odev-modulu-ihtiyac-analizi-final-2026-08-25.md` §6 (homework.manage), §8, §11 (uygunsuz yükleme önlemi). Kapsam: Faz A. Platform: **Yalnız WEB.** Yönetici konsolu. Ekran 7'deki hücre/satır tıklamalarının indiği yer burasıdır. İki idari süper güç bu ekranda yaşar: **herhangi bir ödevi gerekçeli iptal** ve **ayrılan öğretmenin taslağını yayınlama**. Üçüncüsü hassastır: **uygunsuz öğrenci yüklemesini kaldırma** (gerekçeli, izli). **Yüzey kuralı geçerli:** zemin üzerine doğrudan metin basılmaz. Aşağıdaki bloğun tamamını kopyala, Claude Design'da yeni oturuma tek parça yapıştır.

```
## ÜRÜN BAĞLAMI

OKSİS: Türkiye'de özel okullar için geliştirilen, çok kiracılı (multi-tenant) bir okul yönetim platformu. Tasarlanacak modül: **Ödev (Homework)**. Ürün dili Türkçe, hitap "siz". Bu ekranın kullanıcısı OKUL YÖNETİCİSİDİR. Tasarım dili: clean, professional, calm — yönetim konsolu ciddiyeti.

Bu oturumda TEK ekran ailesi tasarlanacak: **yönetici ödev listesi + salt okunur ödev detayı**.
- **WEB:** Desktop 1440px tuval. Rota /homework (yönetici görünümü); detay /homework/[id]. Next.js + shadcn/ui (Radix, "Mira" stili) + Tailwind v4. Bootstrap/MUI görünümü yok. LIGHT ve DARK ikisi de tasarlanır.
- Sezon bağlamı global üst bar sezon seçicisinden gelir (2026-2027) — ayrıca tasarlanmaz; dönem sayfa içi filtredir.

**Kritik bağlam:** Yönetici burada normalde İZLEYİCİDİR — veli araması geldiğinde ödevi bulup bakmak, Ekran 7'den inip detayı görmek. Müdahale (iptal, taslak yayınlama, yükleme kaldırma) İSTİSNADIR ve tasarım bunu hissettirmeli: idari aksiyonlar görünür ama öne itilmiş değil.

## MARKA TOKEN'LARI

- `handoff/oksis-brand-tokens.md` 

- Marka laciverti (birincil): #26407F · koyu #1B2B5E · en koyu #141F45
- İmza gradyanı: yalnız giriş/hero yüzeylerinde — veri ekranlarında KULLANILMAZ
- Metin: ana #141F45 · yumuşak #4A5375 · en yumuşak #8A92AE
- Kenarlık: #DDE3F1 · yumuşak zemin #E9EEF7 · sayfa zemini #F6F8FC · kart #FFFFFF
- Semantik: başarı yeşili, uyarı kehribarı, tehlike kırmızısı, bilgi mavisi — marka dosyasındaki değerler
- Radius: kart 12–14px, buton 8px, çip 999px. Gölge hafif. Glow/glassmorphism yok.
- Tipografi: sayfa başlığı 24px semibold · bölüm başlığı 20px semibold · kart başlığı 18px medium · gövde 14px · caption 12px muted.
- Spacing: 4px grid. Kart içi 16–24px, bölüm arası 24px. İkon seti: Lucide.
- Bu ekran YÖNETİCİ portalındadır.

## DOMAİN SÖZLÜĞÜ

- **Ödev** — öğretmenin şube × ders kapsamında verdiği iş; hedefi tam şube veya seçili öğrenciler; son teslim TARİHİ (saat yok).
- **Ödev yaşam döngüsü çipleri** (tüm modülle aynı görsel dil): Taslak kehribar/kesik · Yayınlandı bilgi mavisi · Süresi Doldu nötr koyu · Kapandı yeşil+tik · **İptal edildi** soluk/üstü çizili ton.
- **Öğrenci durumları** (salt okunur ızgarada): İşaretlenmedi nötr gri boş daire · Tamamlandı yeşil+tik · Eksik kehribar · Yapılmadı nötr koyu · Muaf soluk "M". Muaf gerekçesi YÖNETİCİYE GÖRÜNÜR (idari kayıt).
- **Taslak görünürlüğü:** taslak yalnız sahibine görünür — TEK İSTİSNA: sahibi okuldan AYRILMIŞ öğretmenin taslakları yöneticiye görünür ("Sahibi ayrıldı" rozetiyle) ve yönetici bunları yayınlayabilir. Aktif öğretmenlerin taslakları bu listede YOKTUR.
- **Öğrenci yüklemeleri:** yönetici görüntüleyebilir; uygunsuz içerik durumunda TEK yüklemeyi gerekçeli kaldırabilir (izli). Kaldırma öğrenciye ceza değildir, durumu değiştirmez.

## DEĞİŞMEZ ÜRÜN KURALLARI (ihlal edilirse tasarım reddedilir)

1. **ZEMİN ÜZERİNE DOĞRUDAN METİN YASAK.** Her metin bir kart (#FFFFFF) veya yumuşak yüzey (#E9EEF7) içinde yaşar.
2. **ÖĞRETMEN BAZLI KÜMÜLATİF GÖRÜNÜM YASAK.** Öğretmen adı satırda düz metin olarak durur (tıklanamaz); Öğretmen sütununda SIRALAMA YOK, ÖĞRETMEN FİLTRESİ YOK, öğretmen başına sayaç yok. Belirli bir ödevi arayan yönetici başlıkta arar veya şube/ders ile süzer.
3. **Kırmızı yalnız yıkıcı aksiyon onaylarında** (İptal, Yükleme kaldırma) meşrudur. Liste/detay/ızgarada kırmızı yok; "Yapılmadı" nötr koyu.
4. **Bildirim üreten idari aksiyonların onayında etkisi yazılır** — kaç öğrenci/veli, hangi bildirim.
5. **İdari aksiyonlar ikincil hiyerarşidedir:** detayda birincil buton YOKTUR (izleme ekranı); İptal/Yayınla/Kaldır aksiyonları outline veya menü seviyesindedir.
6. **Dil nötrdür:** taslak yayınlama ve yükleme kaldırma akışlarında öğretmen/öğrenci hakkında yargı sözcüğü yok.
7. **Son teslim yalnız TARİH'tir.** Saat yok.
8. **Boş ekran yasak.** Empty + loading (skeleton) + error tasarlanır.

## ÖRNEK VERİ SETİ (birebir bu isimler)

- Okul: **Altınay Lisesi** · Sezon: **2026-2027** · Dönem: **1. Dönem** · Bugün: Salı, 15 Eylül 2026
- Liste satırları (çeşitlilik bilinçli):
  1. "Sayfa 42–45 problemler" · 9-A · Matematik · Ayşe Demir · Son: Cuma, 18 Eylül · **Yayınlandı** · kontrol 0/30
  2. "Kelime çalışması Unit 3" · 9-A · İngilizce · Elif Kara · Son: yarın · **Yayınlandı** · kontrol 0/30 · 6 yükleme
  3. "Üslü sayılar çalışma kağıdı" · 10-C · Matematik · Ayşe Demir · Son: dün · **Süresi Doldu** · kontrol 12/26 · 7 yükleme
  4. "Okuma günlüğü" · 9-B · Türkçe · Canan Yıldız · Son: 10 Eylül · **Süresi Doldu** · kontrol 0/28
  5. "Denklem kurma alıştırmaları" · 11-A · Matematik · Ayşe Demir · Son: 11 Eylül · **Kapandı** · kontrol 24/24
  6. "Kompozisyon taslağı" · 9-B · Türkçe · **Selim Yurt (ayrıldı)** · **Taslak** · "Sahibi ayrıldı" rozeti
  7. "Okuma projesi" · 9-A · Türkçe · Canan Yıldız · **İptal edildi** (soluk satır)
- Detay örneği: 3 numaralı ödev — açıklama, 1 ek ("uslu-sayilar-calisma-kagidi.pdf"), özet şeridi: 26 öğrenci → 12 Tamamlandı · 3 Eksik · 1 Yapılmadı · 1 Muaf (gerekçe: "Raporlu — 10–14 Eylül") · 9 İşaretlenmedi
- Izgara öğrencileri (10-C ilk satırlar): 1101 Ada Yılmaz · 1102 Berk Aydın · 1103 Ceren Şahin (3 görsel + 1 PDF yükleme) · 1104 Deniz Kaya · 1105 Ecrin Öz · 1106 Furkan Ateş · 1107 Gökçe Uysal · 1108 Halil İbrahim Çetin · 1109 Irmak Güneş · 1110 İpek Doğan

## ERİŞİLEBİLİRLİK

WCAG 2.1 AA. Metin kontrastı 4.5:1. Görünür focus ring. Tablo ve ızgara klavye ile gezilebilir; diyaloglar Esc ile kapanır. Durum yalnız renkle taşınmaz. Geçişler 150–250ms ease-out.

## YASAKLAR

Aşırı gradient, glow, glassmorphism yok. Veri ekranlarında imza gradyanı yok. Emoji yok. "Buraya tıklayın" yok. Zemin üzerine doğrudan metin yok. KPI vitrin kartları yok (o iş Ekran 7'nin — burada liste ve detay var).

---

# EKRAN AİLESİ: Yönetici Ödev Listesi + Salt Okunur Detay

**Amaç:** Veli araması geldiğinde yöneticinin ödevi 15 saniyede bulup detayına bakması; istisnai durumlarda (iptal, ayrılan öğretmen taslağı, uygunsuz yükleme) kontrollü ve izli müdahale etmesi.

## A) LİSTE (tablo kartı)

**Filtre şeridi (yüzey içinde):** arama (başlıkta ara) · şube · ders · durum (Tümü · Yayınlandı · Süresi Doldu · Kapandı · İptal edildi · Taslak—ayrılan öğretmen) · dönem · tarih aralığı. ÖĞRETMEN FİLTRESİ YOK (kural 2).

**Tablo sütunları:** Ödev (başlık; hedef alt küme ise altında kompakt rozet "8 öğrenci") · Şube · Ders · Öğretmen (düz metin, tıklanamaz, sıralamasız) · Son tarih (insan dili) · Durum (çip) · Kontrol (ilerleme + "12/26"; Taslak/İptal satırında "—"). Sıralama: Son tarih, Şube, Durum sütunlarında açık. Satıra tıklama → detay.

**Özel satır halleri:** İptal edilmiş satır soluk; "Sahibi ayrıldı" taslak satırında kehribar rozet.

## B) SALT OKUNUR DETAY

1. **Kimlik kartı:** başlık + durum çipi · şube · ders · öğretmen adı (düz metin) · son tarih · hedef rozeti (alt küme ise) · ek çipi (dokununca önizleme) · açıklama. Sağ üstte idari aksiyon bölgesi (kural 5 — ikincil hiyerarşi): **"İptal et"** (outline, yalnız Yayınlandı/Süresi Doldu durumunda) veya taslak varyantında **"Yayınla"** (outline) — üç nokta menüsü DEĞİL, ama birincil dolgulu buton da değil.
2. **Özet şeridi:** durum sayıları mini rozetlerle (Ekran 3'tekiyle aynı görsel dil); tıklama ızgarayı filtreler.
3. **Salt okunur ızgara:** öğrenci satırları — numara + ad · yükleme rozeti (varsa) · durum ROZETİ (buton değil; işaretleme kontrolü YOKTUR). Muaf satırında gerekçe muted olarak görünür ("Muaf · Raporlu — 10–14 Eylül"). Üstte ince bilgi bandı: "Yönetici görünümü — kayıtlar salt okunur."
4. **Yükleme görüntüleyici (yönetici varyantı):** Ekran 3'teki modalın işaretleme çubuğu OLMAYAN hali — solda görsel + küçük görsel şeridi, sağda panel: öğrenci adı, yükleme zamanı, dosya listesi ve en altta ayrık, tehlikesiz görünümlü bir bağlantı-buton: **"Yüklemeyi kaldır"**.

## C) İDARİ DİYALOGLAR (üçü de gerekçeli + etkili)

1. **Ödevi iptal et** (yıkıcı — tehlike tonu meşru): zorunlu gerekçe + etki: "26 öğrenci ve velileri 'ödev iptal edildi' bildirimi alacak." Butonlar: "Ödevi iptal et" (tehlike) / Vazgeç.
2. **Ayrılan öğretmenin taslağını yayınla:** bilgi satırı "Bu taslak Selim Yurt tarafından oluşturuldu (okuldan ayrıldı)." + son tarih alanı DÜZENLENEBİLİR tek alan olarak (taslakta tarih geçmiş kalmış olabilir) + etki: "9-B şubesindeki 28 öğrenci ve velileri bildirim alacak." Butonlar: "Yayınla" (birincil burada meşru — diyaloğun ana işi) / Vazgeç.
3. **Yüklemeyi kaldır** (yıkıcı): küçük görsel önizlemesi + zorunlu gerekçe + nötr bilgi: "Dosya öğrencinin ve velisinin görünümünden kaldırılacak. Öğrencinin ödev durumu değişmez." Butonlar: "Kaldır" (tehlike) / Vazgeç.

## D) DURUMLAR

- **Liste boş / filtre boş:** kart içinde boş hal + "Filtreleri temizle".
- **Loading:** tablo/detay iskeletleri. **Error:** kart içinde hata + "Tekrar dene".
- **Kapandı detayı:** aksiyon bölgesi boş (iptal edilemez), bilgi bandı "Bu ödev kapandı."
- **İptal edilmiş detay:** içerik soluk + üst bant "Bu ödev iptal edildi · Gerekçe: [metin]".

## ÇIKTI BEKLENTİSİ

1. Web 1440 LIGHT: liste (7 örnek satır, özel haller görünür) + detay (3 numaralı ödev, ızgaralı) + yönetici yükleme görüntüleyicisi + 3 idari diyalog + Kapandı ve İptal edilmiş detay varyantları + taslak (ayrılan öğretmen) detayı.
2. Aynı ana frame'lerin DARK varyantları.
3. Loading + error + boş liste örnekleri.
```

---

## Sipariş sonrası kontrol listesi

- [ ] Öğretmen filtresi/sıralaması/sayacı sızmış mı? (tek örnek bile reddet — kural 2)
- [ ] Detayda birincil dolgulu idari buton var mı? (varsa reddet — izleme ekranı, kural 5; tek istisna taslak-yayınlama diyaloğunun içi)
- [ ] Izgara gerçekten salt okunur mu — durum ROZETİ mi, buton mu?
- [ ] Yönetici görüntüleyicisinde işaretleme çubuğu sızmış mı? (sızdıysa reddet)
- [ ] Üç idari diyalog da gerekçeli + etki cümleli mi; "Yüklemeyi kaldır"da "durum değişmez" notu var mı?
- [ ] Aktif öğretmen taslakları listeye sızmış mı? (yalnız "Sahibi ayrıldı" taslakları olmalı)
- [ ] Muaf gerekçesi yönetici ızgarasında görünüyor mu (burada görünmeli — öğrenci/veliden farkı bu)?
- [ ] Kırmızı yalnız iki yıkıcı onayda mı?
- [ ] Zemin üzerinde yüzen metin? (reddet)