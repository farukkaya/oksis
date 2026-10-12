---
tags: [ihtiyac-analizi, odev, rapor]
status: uygulandi
tarih: 2026-10-12
modul: "[[Ödevler]]"
---

# Öğrenci Ödev Tamamlama Oranı — İhtiyaç Analizi

> **Durum:** Kararlar 2026-10-12'de kullanıcıyla kilitlendi; 2026-10-12'de uygulandı ve yerel `dev`'e birleşti (push edilmedi): oksis-api `d535a672`, oksis-ui `15c5be0`.
> **Kod tabanı ölçümü:** oksis-api `dev` (`e71c3014`), oksis-ui güncel `dev`.
> **İlgili:** [[Ödevler]] · [[Ödev Takibi]] · `EKRAN 7 Ödev Panosu (yönetici, HW-A-01).md`

## 1. Amaç

İdare ve rehber öğretmen, her öğrencinin **öğretmen ve ders ayırt etmeksizin** kendisine verilen ödevlerin ne kadarını yaptığını tek listede, oransal olarak görür. Liste varsayılan olarak **en düşük oran en üstte** dizilir: ödev alışkanlığı kopmuş öğrenciyi erken görmeye yarayan bir dikkat listesidir. Yoklamadaki risk listesinin (`GetRiskStudents`) ödevdeki karşılığıdır.

Rapor **öğrenci** hakkındadır; öğretmen kıyası üretmez (bkz. §6).

## 2. Oran tanımı

Ölçüt öğretmenin kontrol ızgarasındaki kararıdır ([[Ödev Takibi]]'nin beş durumu). Teslim dosyası yüklemek ya da "Ödev gönder"e basmak oranı etkilemez — domain kuralı gereği kararı öğretmen verir.

| Durum | Payda | Pay | Raporda |
|---|---|---|---|
| Tamamlandı | ✅ | ✅ | Tamamlandı sütunu |
| Eksik | ✅ | ❌ | Eksik sütunu (yarım puan yok) |
| Yapılmadı | ✅ | ❌ | Yapılmadı sütunu |
| Muaf | ❌ | ❌ | Muaf sütunu — ödev ona fiilen verilmemiş sayılır |
| İşaretlenmedi | ❌ | ❌ | Bekleyen sütunu — öğretmenin kararsızlığı öğrenciye yazılmaz |

```
Oran = Tamamlandı / (Tamamlandı + Eksik + Yapılmadı)
```

Sonuçları:

- Açık ödev raporu bozmaz: son teslimi geçmemiş, işaretlenmemiş ödev hesaba girmez; öğretmen erkenden "tamamlandı" dediyse girer.
- Kapanış işaretsizleri "yapılmadı"ya çevirdiği için (2026-10-11 kuralı) kapanmış ödevde bekleyen kendiliğinden sıfırdır.
- Paydası sıfır olan öğrencide oran **yoktur** ("—"); sıfır yüzde değildir.

**Yetersiz veri eşiği yoktur** (karar 3). Küçük örneklem yanıltmasın diye oran her yerde `x/y` sayacıyla birlikte gösterilir (`%72 · 18/25`).

**Sıralama:** oran artan; eşitlikte **yapılmadı sayısı azalan** (0/5, 0/1'in üstünde durur); sonra öğrenci adı. Oranı olmayanlar en altta.

## 3. Kapsam

- **Sayılan ödevler:** yalnız *yayında* ve *kapanmış*. Taslak ve iptal edilmiş sayılmaz.
- **Öğrenci merkezli:** satır öğrenciye aittir. Dönem içinde şube değiştiren öğrencinin eski şubesindeki satırları da oranına girer; listede güncel şubesiyle görünür.
- **Liste evreni:** seçilen dönemde aktif kaydı olan öğrenciler. Okuldan ayrılan öğrenci listelenmez.
- **Sentezlenmiş satırlar** (yayından sonra katılan öğrencinin henüz kalıcılaşmamış satırı) sorguya girmez. Formül onları zaten "bekleyen"e atacağından sonuç değişmez; yalnız bekleyen sayısı eksik kalır — bu bilinçli bir sadeleştirmedir.
- **Zaman:** varsayılan güncel dönem; isteğe bağlı tarih aralığı. Ödevi aralığa **son teslim tarihi** yerleştirir, yayın tarihi değil.

## 4. Kim görür

Tek uç ailesi, tek izin (`homework.read`); kapsam **sunucuda** çözülür ve yanıtta `scope` alanıyla döner:

| Kim | Kapsam (`scope`) |
|---|---|
| İdare (`homework.manage` taşıyan) | Tüm okul (`school`) |
| Rehber öğretmen | BUGÜN rehberi olduğu şube(ler)in öğrencileri (`homeroom`) — `ClassRooms.HomeroomTeacherId`, istemciden gelmez; geçmiş dönemde de aynı öğrenciler (karar 11) |
| Öğretmen (rehber değilse) | Boş rapor; öğrenci detayı 404 |
| Veli / öğrenci | Bu turda yok (karar 5) — izin taşısalar da kapsamları boştur |

**Yeni izin açılmaz.** Analiz aşamasında `homework.report` önerilmişti; ölçümde rehber kapsamının zaten `homework.read` + sunucuda şube çözümüyle kurulduğu görüldü (`ListHomeroomHomework`). Aynı kalıp izlenir; ikinci bir izin seed'i gereksizdir.

## 5. Ekranlar

### 5.1 Web

**Yer (idare):** Raporlar merkezindeki "Ödev Panosu" kartı iki sekmeye ayrılır: **Pano** (bugünkü yoğunluk ekranı) ve **Tamamlama Oranı**. Yeni katalog kartı açılmaz.

**Yer (rehber):** Raporlar merkezi öğretmene açılmaz. Rehberin ödev ekranında zaten bulunan **"Sınıfımın ödevleri"** sekmesine "Sınıfımın raporu" bağlantısı eklenir; aynı rapor bileşenini şubesine kilitli açar.

**Üst özet (3 kart):** okul (rehberde: şube) ortalama oranı `x/y` ile · oranı %50'nin altındaki öğrenci sayısı · bekleyen işaret sayısı ("oranlar eksik olabilir" uyarısı).

**Süzgeçler:** dönem (varsayılan güncel) · tarih aralığı · sınıf düzeyi · şube · ad/no araması. Rehberde şube süzgeci kilitli, düzey süzgeci yok.

**Tablo:**

| No | Ad Soyad | Şube | Oran | Tamamlandı | Eksik | Yapılmadı | Bekleyen | Muaf |
|---|---|---|---|---|---|---|---|---|

- Oran hücresi `%72 · 18/25` + ince çubuk. Ton yumuşak; kırmızı kullanılmaz ("yapılmadı" öğrenci yüzünde de kırmızı değildir).
- Her sütun sıralanabilir.

**Öğrenci detayı (yan panel, yoklamadaki `drill-sheet` kalıbı):**

1. Ders kırılımı — her ders için oran ve `x/y`.
2. Ödev listesi — başlık, ders, son teslim, durum, eksik notu.
3. Ödev satırından ödev detayına geçiş.

Öğretmen adı yalnız ödev satırında görünür; başlık, süzgeç ya da sıralama değildir.

**Dışa aktarım:** Excel, görünen süzgeçle. İdare **ve rehber** (kendi şubesiyle sınırlı) aktarabilir (karar: 2026-10-12). Mevcut `IExcelExporter` / `ExportGradeBook` kalıbı izlenir.

### 5.2 Mobil

Mobilin sorusu tablo değil: **"Kimle konuşmam gerekiyor?"**

**İdare** — "Takip" sekmesine (devamsızlık, not girişi özeti, mazeret ve düzeltme talepleriyle aynı merkez) **Ödev** bölümü eklenir:

- Özet kart: okul ortalaması · %50 altı öğrenci sayısı · bekleyen işaret.
- **Düşük oranlı öğrenciler** listesi, en düşük üstte. Satır: ad, şube, `%40 · 8/20`, ince çubuk.
- Tek süzgeç: şube (tek düğme + modal, çip yığını değil).
- Öğrenci detayı: ders kırılımı + son ödevler, salt okunur.

> Not: idarenin mobil **Ödev** sekmesi bugün "henüz boş" ekranıdır; bu rapor o sekmeyi doldurmaz, öğrenci odaklı "Takip" merkezine girer. Ödev sekmesinin idare yüzü ayrı iştir.

**Rehber öğretmen** — öğretmen ödev sekmesinde zaten bulunan **"Sınıfımın ödevleri"** sekmesinin başına özet kart eklenir (sınıf oranı `x/y`, %50 altı sayısı); karta dokununca aynı liste ve detay, yalnız kendi şubesiyle, ayrı ekranda açılır. Yeni bir sekme açılmaz (ilk taslaktaki "Şubem" sekmesi, mevcut sekme bulunduğu için düştü — 2026-10-12).

**Mobilde olmayanlar:** tarih aralığı (yalnız güncel dönem), sütun sıralaması, dışa aktarım.

### 5.3 Özet

| | Web | Mobil |
|---|---|---|
| Özet kartlar | 3 | 3 (sıkışık) |
| Liste | Tüm sütunlar | Oran + sayaç |
| Süzgeç | Dönem, tarih, düzey, şube, arama | Yalnız şube |
| Sıralama | Her sütun | Sabit: en düşük üstte |
| Öğrenci detayı | Ders kırılımı + ödev listesi + ödeve geçiş | Ders kırılımı + son ödevler |
| Dışa aktarım | Excel (idare + rehber) | Yok |
| Rehber girişi | "Sınıfımın ödevleri" sekmesinde "Sınıfımın raporu" | "Sınıfımın ödevleri" sekmesinde özet kart |

## 6. Bilinçli dışlamalar

- **Öğretmen boyutu.** Listede öğretmen sütunu, süzgeci ya da sıralaması yoktur. Ödevler modülünün ilkesi: *"pano yük ölçerdir, performans karnesi değil"*. Ders kırılımı yalnız öğrenci detayındadır.
- **Veli ve öğrenci yüzü** (karar 5). Kendi oranını görmenin motive mi cezalandırıcı mı olacağı ayrı karardır.
- **Yetersiz veri eşiği** (karar 3).
- **Eksiğe yarım puan** (karar 1).
- **Bildirim / eşik alarmı.** Rapor çekilir, itilmez; "oranı düşene haber ver" kapsam dışıdır.

## 7. Teknik çerçeve

- Tek sorgu: `homework_tracking ⋈ homework`, öğrenci başına durum sayımı veritabanında (`GROUP BY`), bellekte toplama yok. Durum süzgeci `Published | Closed`, tarih süzgeci son teslim üzerinden.
- Öğrenci detayı ayrı uç: ders kırılımı + ödev listesi; aynı kapsam kapısı (idare / rehber / 404).
- **Önbellek yok:** işaretleme rapora anında yansımalı; sorgu zaten veritabanında gruplanmış sayımdır. Sayfalama yok (okul ölçeğinde öğrenci sayısı tek yanıtta taşınır).
- **Uçlar:** `GET /api/v1/homework/completion-report` (liste + özet + süzgeç evreni), `GET /api/v1/homework/completion-report/students/{id}` (detay), `GET /api/v1/homework/completion-report/export` (xlsx). Süzgeç evreni (şubeler, sınıf düzeyleri) yanıtta kapsamdan gelir, listeden türetilmez.
- Sözleşme: oran sunucuda **hesaplanmaz**, sayaçlar döner; yüzdeyi ekran türetir. ([[Ödev Takibi]]: "sayaçların tek kaynağı vardır; yüzde alanı yoktur.") Sıralama ise sunucudadır.
- **Dışa aktarım kişisel veri çıkışıdır.** Bugünkü dışa aktarımlarda kalıcı denetim kaydı yok (`ExportGradeBook` hiç yazmıyor, `ExportUsers` yalnız log). Bu raporda en azından yapılandırılmış log satırı (kim, kapsam, süzgeç, satır sayısı) yazılır; kalıcı dışa aktarım denetimi ayrı, modüller üstü bir karardır.

## 8. Uygulama dilimleri (öneri)

1. **API — liste ve detay uçları** (idare + rehber kapsamı, sayım sorgusu, testler).
2. **API — Excel dışa aktarım.**
3. **Web — Ödev Panosu'na "Tamamlama Oranı" sekmesi** (idare) + yan panel + dışa aktarım.
4. **Web — rehber girişi** ("Sınıfımın ödevleri" sekmesinde bağlantı).
5. **Mobil — Takip merkezine Ödev bölümü** (idare).
6. **Mobil — "Sınıfımın ödevleri" sekmesine özet kart + rapor ekranı** (rehber).
7. **Domain notu** — [[Ödevler]] senkronu (`domain-map`).

## 9. Karar kaydı (2026-10-12)

| # | Soru | Karar |
|---|---|---|
| 1 | Eksik nasıl sayılır? | Paydada, payda değil; ayrı sütun |
| 2 | Muaf ve işaretlenmedi? | Paydadan çıkar; bekleyen ayrı sütun |
| 3 | Yetersiz veri eşiği? | **Yok**; oran her zaman `x/y` ile |
| 4 | Rehber görsün mü? | Evet, yalnız kendi şubesi |
| 5 | Veli / öğrenci kendi oranını görsün mü? | Hayır (bu tur) |
| 6 | Öğretmen boyutu? | Listede yok; ders kırılımı yalnız öğrenci detayında |
| 7 | Rehber dışa aktarabilsin mi? | Evet, kendi şubesiyle sınırlı |
| 8 | Rehber web'de nereden girer? | Mevcut "Sınıfımın ödevleri" sekmesindeki bağlantı; raporlar merkezi öğretmene açılmaz |
| 9 | Yeni izin? | Hayır; `homework.read` + sunucuda kapsam (`school` / `homeroom`) |
| 10 | Önbellek? | Yok; işaretleme anında yansır |
| 11 | Rehber geçmiş dönemi görsün mü? | **Evet, güncel öğrencileri üzerinden** (2026-10-12): rehberin evreni BUGÜN rehberi olduğu sınıfın öğrencileridir; geçmiş dönem seçilince bu öğrencilerin o dönemdeki kayıtları sayılır (Zuhal bu yıl 11-A'nın rehberiyse öğrencilerin geçen yıl 10-A'dayken aldığı ödevleri görür; geçen yılın rehberi olup olmaması önemsiz). Bu yıl rehber olmayan öğretmen eski sınıfını görmez. Satırda öğrencinin güncel şubesi görünür. İdare kapsamı seçilen dönemin sezonundaki kayıtlardır |
