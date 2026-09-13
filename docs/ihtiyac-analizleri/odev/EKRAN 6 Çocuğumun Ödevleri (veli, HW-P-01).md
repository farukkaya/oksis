# OKSİS — Ödev Modülü · Claude Design Prompt · **EKRAN 6: Çocuğumun Ödevleri (veli, HW-P-01)**

> Kaynak: `odev-modulu-ihtiyac-analizi-final-2026-08-25.md` §8 / HW-P-01, BR-HW-06/09/14. Kapsam: Faz A. Platform: **Yalnız MOBİL.** Veli portalı — liste + salt okunur detay tek oturumda. **Yeni yüzey kuralı (bu ekranla eklendi, sonraki ekranlara da taşınacak):** sayfa zemini üzerine doğrudan metin basılmaz — tüm metinler bir kart/yüzey içinde yaşar. Değişmez kurallar bölümünde tanımlı. "Günlük eksik ödev özeti" bildiriminin derin bağlantı hedefi bu ekrandır. Aşağıdaki bloğun tamamını kopyala, Claude Design'da yeni oturuma tek parça yapıştır.

```
## ÜRÜN BAĞLAMI

OKSİS: Türkiye'de özel okullar için geliştirilen, çok kiracılı (multi-tenant) bir okul yönetim platformu. Tasarlanacak modül: **Ödev (Homework)**. Ürün dili Türkçe, hitap "siz". Bu ekranın kullanıcısı VELİDİR — teknoloji meraklısı olmayan, günde bir-iki kez "çocuğum ne yapıyor?" diye bakan bir yetişkin. Tasarım dili: clean, professional, calm; sıcak ama kurumsal.

Bu oturumda TEK ekran ailesi tasarlanacak: **Çocuğumun Ödevleri** — liste + salt okunur ödev detayı.
- **MOBİL:** React Native / Expo, tuval 402 × 874, iOS tarzı modern mobil UI. Liste, veli tab bar'ındaki **Ödevler sekmesinin kök ekranıdır**; detay alt (stack) ekrandır. Yalnız LIGHT tema (mobilde tema sistemi yok — koyu tema TASARLAMA).

**Kritik bağlam:** Velinin tek sorusu "çocuğum yaptı mı?" Bu ekranın en değerli vaadi DÜRÜSTLÜKTÜR: öğretmen henüz kontrol etmediyse ekran bunu açıkça "Henüz kontrol edilmedi" diye söyler — asla "yapıldı" ya da "yapılmadı" izlenimi vermez. Yanlış bilgi üretmeyen sistem, eksik bilgi üreten sistemden değerlidir.

## MARKA TOKEN'LARI

- `handoff/oksis-brand-tokens.md` 

- Marka laciverti (birincil): #26407F · koyu #1B2B5E · en koyu #141F45
- Metin: ana #141F45 · yumuşak #4A5375 · en yumuşak #8A92AE
- Kenarlık: #DDE3F1 · yumuşak zemin #E9EEF7 · sayfa zemini #F6F8FC · kart #FFFFFF
- Semantik: başarı yeşili, uyarı kehribarı, tehlike kırmızısı, bilgi mavisi — marka dosyasındaki değerler
- Radius: kart 13–16px, buton 12px, çip 999px. Gölge hafif. Glow/glassmorphism yok.
- Tipografi: mobilde kapalı ölçek yok — mevcut prototip 21 / 17 / 15 / 13.5 / 12.5 px civarı; kullandığın her boyutu ekranın yanında açıkça listele.
- Spacing: 4px grid. İkon seti: Lucide.
- Rol bazlı portal renkleri var — bu ekran VELİ portalındadır (üst bar ve seçili sekme veli vurgu tonunda).

## MOBİL YAPISAL STANDARTLAR (mevcut uygulamadan — birebir uy)

- **Üst bar:** Liste SEKME KÖKÜ ekrandır — büyük başlıklı ana header: başlık "Ödevler", ikinci satır veli varyantı: "Salı, 15 Eylül 2026". Sağda zil ikonu (bildirim rozeti) ve baş harf avatarı (HD). Detay ALT (stack) ekrandır — ince üst bar: geri oku, solda ödev başlığı.
- **Alt sekme çubuğu (listede görünür):** 5 sekme, Material 3 "indicator" stili. Veli: Anasayfa · Devamsızlık · Notlar · **Ödevler (seçili)** · Daha fazla.
- **Boş ekran kalıbı (birebir):** 56×56 daire (#E9EEF7 zemin) içinde 24px nötr ikon · başlık 17px/700 · açıklama 14px, maks 260px, ortalanmış — ancak bu kalıp da aşağıdaki yüzey kuralı gereği bir kart içinde durur.
- **Dokunma hedefi:** minimum 44×44pt, istisnasız. Safe area gözetilir. Yatay sayfa kaydırması yok (yalnız çip şeritleri yatay kayar).

## DOMAİN SÖZLÜĞÜ (veli perspektifinden)

- **Ödev** — çocuğun öğretmeninin verdiği iş: ders, öğretmen adı, başlık, açıklama, öğretmen ekleri, son teslim TARİHİ (saat yok).
- **Kontrol durumu** — öğretmen kontrol edince: **Tamamlandı / Eksik / Yapılmadı / Muaf**. Öğretmen HENÜZ kontrol etmediyse ve son tarih GEÇTİYSE, veli ekranı bunu açıkça yazar: **"Henüz kontrol edilmedi"** (nötr gri, olumsuzluk değil). Son tarihi gelmemiş ödevde durum satırı hiç yoktur (gürültü olur). Muaf gerekçesi veliye GÖSTERİLMEZ.
- **Çocuğun yüklemeleri** — çocuğun ödeve yüklediği fotoğraf/PDF'ler; veli GÖRÜNTÜLEYEBİLİR (salt okunur). Veli yükleme YAPAMAZ, silemez.
- **Ödev yaşam döngüsü:** Yayınlandı → Süresi Doldu → Kapandı (+ İptal edildi). Veli hiçbirini yönetmez, yalnız izler.

## DEĞİŞMEZ ÜRÜN KURALLARI (ihlal edilirse tasarım reddedilir)

1. **ZEMİN ÜZERİNE DOĞRUDAN METİN YASAK.** Sayfa zemini (#F6F8FC) üzerine hiçbir metin doğrudan basılmaz — başlıklar, bölüm başlıkları, bilgi satırları, boş durum metinleri dahil HER metin bir kart (#FFFFFF) veya yumuşak yüzey (#E9EEF7) içinde yaşar. Bölüm başlıkları ya kendi ince yüzey şeridinde ya da grubun kart yığınının başlık satırında durur. (Büyük başlıklı üst header kendi header yüzeyidir, bu kurala aykırı değildir.)
2. **Veli yüzeyinde KIRMIZI YOK.** En sert ton kehribar. "Yapılmadı" nötr koyu tonla gösterilir.
3. **"Henüz kontrol edilmedi" nötrdür** — asla uyarı rengiyle, asla "yapılmadı" imasıyla gösterilmez.
4. **Kıyas yok.** Sınıf oranı, "sınıfın çoğu tamamladı", başka öğrenci bilgisi hiçbir biçimde yok.
5. **Bu yüzeyde not, puan, ödeme/ücret bilgisi ASLA görünmez.**
6. **Suçlayıcı dil yok** — çocuk hakkında da: "İpek ödevini yapmadı!" değil, nötr durum etiketi.
7. **Son teslim yalnız TARİH'tir.** Saat yok, geri sayım yok.
8. **Boş ekran yasak.** Empty + loading (skeleton) + error (tekrar dene) state'leri tasarlanır.

## ÖRNEK VERİ SETİ (birebir bu isimler)

- Okul: **Altınay Lisesi** · Veli: **Hülya Doğan** · Bugün: Salı, 15 Eylül 2026
- Çocuklar (çocuk seçici için): **İpek Doğan** (9-A) · **Mert Doğan** (5-B, ilkokul — öğrenci hesabı yok, veli birincil muhatap; ödevleri veliye aynı biçimde görünür)
- İpek'in ödevleri (liste örnekleri):
  1. "Sayfa 42–45 problemler" · Matematik · Ayşe Demir · Son: bugün · durum satırı yok
  2. "Kelime çalışması Unit 3" · İngilizce · Elif Kara · Son: yarın · çocuğun 2 yüklemesi var (rozet)
  3. "Üslü sayılar çalışma kağıdı" · Matematik · Son gün: dün · durum: **Eksik** (kehribar)
  4. "Deney raporu" · Fen Bilimleri · Mehmet Aslan · Son gün: dün · durum: **Henüz kontrol edilmedi** (nötr gri)
  5. "Denklem kurma alıştırmaları" · Matematik · Son gün: 11 Eylül · durum: **Tamamlandı**
- Mert'in ödevleri (çocuk geçişi varyantı): "Okuma fişi 3" · Türkçe · Son: yarın · durum satırı yok — ve "Toplama alıştırmaları" · Matematik · Son gün: dün · durum: **Tamamlandı**
- Detay örneği: 3 numaralı ödev (Eksik) — açıklama, 1 öğretmen eki, çocuğun 1 yüklemesi ("Dün 20:15")

## ERİŞİLEBİLİRLİK

WCAG 2.1 AA. Metin kontrastı 4.5:1. Durum yalnız renkle taşınmaz — ikon ve/veya metin eşlik eder. Dokunma hedefleri 44pt. Geçişler 150–250ms ease-out; animasyon fonksiyonel, süs değil.

## YASAKLAR

Aşırı gradient, glow, glassmorphism yok. Emoji yok. Stok fotoğraf yok. "Buraya tıklayın" yok. Zemin üzerine doğrudan metin yok (kural 1).

---

# EKRAN AİLESİ: Çocuğumun Ödevleri (HW-P-01)

**Amaç:** Hülya Hanım'ın "İpek'in yarına ödevi var mı, dünkü ödevleri ne durumda?" sorusuna 10 saniyede, dürüst bir cevap alması; gerekirse çocuğunun yüklediği defter fotoğrafına bakması.

## A) ÇOCUK SEÇİCİ (listenin en üstü, header'ın hemen altı)

Yatay segment/çip: **İpek (9-A)** · **Mert (5-B)** — seçili olan dolgulu, avatar baş harfli. Tek çocuklu veli varyantında seçici HİÇ GÖRÜNMEZ (frame olarak ayrıca göster). Çocuk değişince liste tamamen o çocuğa döner.

## B) LİSTE YAPISI

Gruplama Ekran 4 (öğrenci) ile aynı iskelet: **Bugün son · Bu hafta · İleri tarihli · Geçmiş (daraltılmış)** — ama yüzey kuralı gereği her grup, başlık satırı grubun kart yığınına bitişik bir yüzeyde duran bir blok olarak tasarlanır (zeminde yüzen başlık yok).

**Ödev kartı anatomisi:** ders + öğretmen adı (küçük, muted) · başlık · son tarih insan diliyle · ek rozeti (varsa) · çocuğun yükleme rozeti (görsel ikonu + sayı, varsa) · **durum satırı** (kurallı):
- Son tarihi gelmemiş → durum satırı YOK.
- Son tarihi geçmiş + işaretlenmiş → sonuç rozeti: Tamamlandı (yeşil+tik) / Eksik (kehribar) / Yapılmadı (nötr koyu) / Muaf (soluk "M").
- Son tarihi geçmiş + işaretlenmemiş → nötr gri satır: "Henüz kontrol edilmedi".

**Filtre:** ders çip şeridi (Tümü · Matematik · Fen Bilimleri · İngilizce · Türkçe) — yüzey kuralına uygun bir şerit yüzeyinde.

**Derin bağlantı bağlamı:** "Bugün 2 ödevde eksik işaretlendi" günlük özet bildirimi bu listeye, ilgili çocuk seçili halde iner; eksik işaretli kartlar görünür durumdadır (ekstra vurgu animasyonu gerekmez).

## C) SALT OKUNUR ÖDEV DETAYI (stack ekran)

1. **Kimlik kartı:** ders + öğretmen adı · ödev başlığı · son tarih satırı · durum rozeti (liste kurallarıyla aynı; işaretlenmemiş+süresi geçmişse "Henüz kontrol edilmedi" satırı burada da nötr).
2. **Açıklama kartı:** tam metin.
3. **Öğretmen ekleri kartı:** PDF/bağlantı satırları — PDF dokununca tam ekran önizleme, bağlantı tarayıcıda açılır.
4. **"İpek'in yüklemeleri" kartı (varsa):** küçük görsel ızgarası + yükleme zamanı; dokununca tam ekran görüntüleyici (pinch-zoom, sayfa göstergesi). SALT OKUNUR — silme/ekleme yok. Yükleme yoksa bu kart hiç görünmez ("çocuğunuz yüklemedi" gibi bir boşluk metni KONMAZ — yükleme zorunlu değildir, yokluğu olumsuzluk değildir).
5. **Muaf varyantında:** durum rozeti "Muaf" + tek satır: "İpek bu ödevden muaf tutuldu." Gerekçe GÖSTERİLMEZ.

## D) DURUMLAR

- **Empty (çocuğun hiç ödevi yok):** kart içinde boş ekran kalıbı — "İpek'in şu an ödevi yok" + "Öğretmenleri ödev verdiğinde burada göreceksiniz."
- **Filtre boş:** "Bu derste ödev yok" + "Filtreyi temizle".
- **Loading:** kart iskeletleri. **Error:** kart içinde hata + "Tekrar dene".
- **Tek çocuk varyantı:** seçicisiz liste.

## ÇIKTI BEKLENTİSİ

1. Mobil 402×874 (light): İpek seçili dolu liste + Mert'e geçilmiş varyant + tek çocuk varyantı + empty/loading/error.
2. Salt okunur detay: Eksik örneği (yüklemeli) + "Henüz kontrol edilmedi" örneği + Muaf varyantı + yükleme görüntüleyici.
3. Kart anatomisi component sheet'i: dört sonuç rozeti + "Henüz kontrol edilmedi" satırı + durum-satırsız hal.
4. Kullandığın font boyutlarının listesi.
```

---

## Sipariş sonrası kontrol listesi

- [ ] **Zemin üzerinde yüzen metin var mı?** (bölüm başlıkları, boş durum metinleri dahil — varsa reddet, yeni kural 1)
- [ ] "Henüz kontrol edilmedi" nötr gri mi — kehribar/kırmızıya kaymış mı?
- [ ] Son tarihi gelmemiş kartlara durum satırı sızmış mı? (sızdıysa reddet — gürültü)
- [ ] Kırmızı sızıntısı? (veli yüzeyinde tek piksel bile reddet)
- [ ] Çocuk seçici geçişi net mi; tek çocuk varyantında seçici kaybolmuş mu?
- [ ] Veli yükleme/silme yapabiliyor gibi duran bir kontrol sızmış mı? (salt okunur olmalı)
- [ ] Yüklemesiz detayda "çocuğunuz yüklemedi" tarzı boşluk metni uydurulmuş mu? (reddet)
- [ ] Muaf gerekçesi sızmış mı? Not/puan/ödeme izi var mı? (reddet)