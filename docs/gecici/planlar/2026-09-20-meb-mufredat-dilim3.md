# MEB Müfredatı — Dilim 3: Keşif, İndirme ve Çizelge Ayrıştırma Uygulama Planı

**Goal:** Dilim 2'nin elle doldurulan ara alanını **kaynağın kendisinden** doldurmak: TTKB
kategori listesinden belge adaylarını keşfetmek, yalnız allowlist'teki MEB adreslerinden
indirmek, PDF'in metin katmanından haftalık ders çizelgesi tablosunu satır/sütun olarak
çıkarmak ve çıktıyı **aynı** ara alana (`CurriculumImportRun`) köprülemek. Parser hiçbir
koşulda master'a yazmaz; Dilim 2'nin iki kişi kuralı ve onay kapısı değişmeden kalır.

**Architecture:** `IMebCatalogClient` TTKB'nin DataTables ajax ucundan aday listesini çeker
(`ISLEMSAAT`, `BASLIK`, `SIRAID`, `LINK`). `IMebDocumentFetcher` allowlist + boyut + MIME
kapısından geçirip içeriği akış olarak verir; indirilen içerik Dilim 2'nin yükleme yoluna
(`CurriculumSourceIngestor`) girer, yani parmak izi, virüs taraması, tekilleştirme ve revizyon
zinciri **tek yerde** kalır. `IPdfTextExtractor` (PdfPig) PDF'i konumlu kelimelere çevirir;
`MebChartParser` saf ve deterministik bir sınıf olarak bu kelimelerden çizelgeyi çıkarır —
PDF'e bağımlı olmadığı için birim testle koşulur. Ayrıştırma sonucu `CurriculumImportPayload`
üretir; oradan sonrası Dilim 2'dir.

**Tech Stack:** .NET 10 / C# 13, EF Core 10 + SQL Server 2022, MediatR, FluentValidation,
Mapster, Garage + ClamAV, Hangfire, **UglyToad.PdfPig** (Apache-2.0, yeni bağımlılık),
xUnit + FluentAssertions + NSubstitute + Testcontainers.

**Spec:** `docs/teknik-analizler/mufredat/meb-haftalik-ders-cizelgesi-entegrasyonu-tasarimi.md`
(onaylı, 2026-09-18) — §4.1 "MEB belge entegrasyonu", §6.1, §9, §11 "Dilim 3".
**Önceki dilimler:** Dilim 1 `c89c22bf`, Dilim 2 `db1c11b1` (her ikisi master'da).

---

## Ölçülen gerçekler (varsayım değil)

Plan yazılmadan önce kaynak ve bir gerçek belge ölçüldü:

1. **Kategori sayfası JS ile dolduruluyor.** `https://ttkb.meb.gov.tr/www/haftalik-ders-cizelgeleri/kategori/7`
   HTML'inde tek bir PDF bağlantısı yok; liste `POST /www/icerik_listele_ajax.php` ucundan
   DataTables parametreleriyle geliyor. Uç `Referer` ve tarayıcı `User-Agent` istiyor;
   ikisi olmadan **403** dönüyor.
2. **Yanıt JSON.** Alanlar: `BASLIK` (HTML entity'li başlık), `SIRAID` (kararlı içerik kimliği),
   `ISLEMSAAT` (`gg/aa/yyyy`), `LINK` (siteye göreli PDF yolu), `TARGET`.
   Kategori 7'de bugün **30 kayıt** var.
3. **PDF'lerin metin katmanı var ve Türkçe doğru çıkıyor.** `20144001_202505.pdf` (Anadolu
   Lisesi, 10 sayfa, 1,3 MB) PdfPig ile açıldığında sayfa başına 250–780 konumlu kelime
   veriyor; `İ`, `Ç`, `Ğ` doğru. Belge OCR gerektirmiyor.
4. **Tek PDF birden çok çizelge taşıyor.** Bu belgede sayfa 2–7 altı ayrı eğitim programının
   çizelgesi (Anadolu Lisesi, Hazırlık Sınıfı Bulunan Anadolu Lisesi, Fen Lisesi, Hazırlık
   Sınıfı Bulunan Fen Lisesi, Sosyal Bilimler Lisesi, Hazırlık Sınıfı Bulunan SBL); sayfa 1
   kurul kararı, sayfa 8–10 açıklamalar.
5. **Tablo düzeni sabit ve X bantları kararlı.** Başlık satırı `DERSLER | 9 SINIF | 10 SINIF |
   11 SINIF | 12 SINIF`; sınıf sütunları x≈346/380/417/457 merkezlerinde. Ders adı sütununda
   ortak dersler x≈68'den, seçmeli dersler x≈147'den başlıyor.
6. **Hücre üç şekilden biri:** düz sayı (`5`), tire (`-`) veya **parantezli seçenek dizisi**
   (`(1)(2)`, `(2)(10)(12)`, `(3)(4)(5)(6)`). Sonuncusu Dilim 2'nin `hourOptions` modeline
   birebir oturuyor — ara alanın şekli doğru tasarlanmış.
7. **Belge kendi sağlamasını taşıyor.** `ORTAK DERS SAATİ TOPLAMI`, `SEÇİLEBİLECEK DERS SAATİ
   SAYISI`, `REHBERLİK VE YÖNLENDİRME` ve `TOPLAM DERS SAATİ` satırları var ve tutuyor:
   32+7+1=40, 33+6+1=40, 19+20+1=40, 15+24+1=40. **Drift denetimi bu yüzden tahmin değil,
   ölçüm olacak.**
8. **Ders adının sonundaki `(n)` saat değil dipnottur** (`SEÇMELİ MATEMATİK (2)`), `*` de öyle.
   Sınıf sütunundaki parantez ise saat seçeneğidir. Ayrım sütun konumuyla yapılır.

---

## Global Constraints

- Bu plan yalnız **Dilim 3** içindir. Okul yönetim API sözleşmeleri (program seçme, MEB–okul
  fark görünümü, override, yeniden tabanlama, aktivasyon önizlemesi) **Dilim 4**'tür.
- Kod yalnız `/Users/farukkaya/Repositories/oksis-api`; plan, rapor ve domain notu yalnız
  `/Users/farukkaya/Repositories/oksis/docs`.
- Başlangıç dalı `master` (`db1c11b1`), uygulama dalı `feat/mufredat-keşif-parser`
  (worktree `.claude/worktrees/mufredat-kesif-parser`).
- **Ekran yok.** Bu dilim backend uçları + Postman koleksiyonu güncellemesidir.
- **Parser master'a yazmaz.** Çıktısı yalnız `CurriculumImportPayload`'dır; yayım yolu Dilim 2'nin
  onay kapısından geçer ve iki kişi kuralı korunur.
- **Ağ yalnız allowlist'e çıkar.** İzinli host listesi yapılandırmadan gelir, varsayılanı
  `ttkb.meb.gov.tr` ve `meb.gov.tr` alt alan adlarıdır. Liste dışı adres indirilmez —
  kullanıcı adres uydurarak sunucuyu rastgele bir hedefe istek attıramaz (SSRF kapısı).
- **Aynı yol, tek giriş.** İndirilen içerik Dilim 2'nin yükleme kodunu kullanır; parmak izi,
  virüs taraması, tekilleştirme ve revizyon zinciri kopyalanmaz.
- **Metin katmanı yoksa OCR yok.** Taranmış PDF açık bir hata koduyla reddedilir ve elle giriş
  yoluna yönlendirilir. OCR bu dilimin kapsamı dışındadır (tasarım §3'te de yok).
- **Dönem içi senkronizasyon yok** (tasarım kararı 6). Keşif işi yalnız elle tetiklenir;
  tekrarlayan Hangfire zamanlaması tanımlanmaz.
- Master varlıklar `IHasTenant` taşımaz; uçlar yalnız platform token'ı ister.
- AutoMapper, repository wrapper, lazy loading, controller `DbContext`, `async void`, `.Result`,
  `.Wait()` kullanılmaz.
- Her davranış değişikliği kırmızı testle başlar. Günlük kapı `./scripts/test-changed.sh`;
  SQL Server entegrasyonu `--integration` (Docker yalnız o sırada açık).

### Bilinen risk — PdfPig sürümü

Bu makinedeki NuGet beslemesi `UglyToad.PdfPig` için yalnız `0.1.9-alpha001-patch1` ve
`1.7.0-custom-5` gösteriyor; `1.7.0-custom-5`'in nuspec'i `Package Description` ve lisans
metadata'sı boş. Çalışıyor ve Türkçe metni doğru çıkarıyor, ama **kanonik bir sürüm etiketi
gibi durmuyor**. Bu yüzden PDF kütüphanesi `IPdfTextExtractor` arkasına alınır; kütüphane
değişirse yalnız Infrastructure'daki tek adaptör değişir. Sürüm, gerçek beslemede kararlı
sürüm doğrulandığında sabitlenmelidir — bu bir açık iş, bulgu defterine yazılır.

---

## Veri sözleşmesi (kilitli)

### Keşif kaydı — `MebCatalogEntry`

| Alan | Tip | Kaynak |
|---|---|---|
| `ExternalId` | `string` | `SIRAID` |
| `Title` | `string` | `BASLIK`, HTML entity çözülmüş |
| `SourceUrl` | `string` | `LINK`, mutlak adrese çevrilmiş |
| `PublishedOn` | `DateOnly?` | `ISLEMSAAT` (`gg/aa/yyyy`), çözülemezse `null` — uydurulmaz |

### Keşif yanıtı — `DiscoveredDocumentDto`

`MebCatalogEntry` + `KnownDocumentId: Guid?` + `Sha256: string?` + `RetrievedAt: DateTime?`.
Durum **indirilmeden** yalnız iki değer alabilir: `New` (bu adres hiç indirilmemiş) ya da
`Known` (indirilmiş, parmak izi belli). "Değişmiş" bilgisi indirmeden bilinemez, bu yüzden
uydurulmaz — indirme sonrası revizyon zinciri söyler.

### Ayrıştırma sonucu — `MebChartParseResult`

```text
MebChartParseResult
  DocumentId, PageCount, Charts[]
  Charts[]:
    PageNumber, Title, GradeLabels[]        # ["HAZIRLIK","9","10","11","12"]
    Rows[]:
      SourceSubjectName                     # dipnot ve * temizlenmiş
      SourceNote                            # "(2)" / "*" gibi ham işaretler
      CourseType                            # Common | Elective
      SectionLabel                          # "AKADEMİK ÇALIŞMALAR" vb., yoksa null
      Cells[]: GradeLabel, WeeklyHours?, HourOptions[], IsNotOffered
    Checksums[]: Label, GradeLabel, DeclaredValue, ComputedValue?, Matches?
    Warnings[]: Code, Message, PageNumber
```

`WeeklyHours` ve `HourOptions` aynı anda dolu olmaz; tire `IsNotOffered = true` demektir ve
yayımda satır üretmez.

### Parser uyarı kodları

| Kod | Ne demek | Sonuç |
|---|---|---|
| `MEB_PARSER_NO_HEADER` | Sayfada `DERSLER` + sınıf başlığı bulunamadı | Sayfa çizelge sayılmaz |
| `MEB_PARSER_NO_ROWS` | Başlık var, veri satırı yok | Çizelge `Publishable = false` |
| `MEB_PARSER_UNREADABLE_CELL` | Hücre sayı/tire/parantez şekillerinden hiçbiri değil | Hücre boş, satır uyarılı |
| `MEB_PARSER_SUM_MISMATCH` | Belgedeki toplam hesaplanan toplamla tutmuyor | Çizelge `Publishable = false` |
| `MEB_PARSER_NO_TOTALS` | Toplam satırı hiç yok — düzen değişmiş olabilir (drift) | Uyarı, engel değil |

### Yeni hata kodları

| Kod | HTTP | Ne demek |
|---|---|---|
| `CURRICULUM_SOURCE_HOST_NOT_ALLOWED` | 400 | Adres allowlist dışında |
| `CURRICULUM_SOURCE_FETCH_FAILED` | 502 | Kaynak erişilemedi / beklenmeyen yanıt |
| `CURRICULUM_SOURCE_NO_TEXT_LAYER` | 422 | PDF taranmış; metin katmanı yok |
| `CURRICULUM_SOURCE_NOT_PARSABLE` | 422 | Belge PDF değil ya da hiç çizelge bulunamadı |
| `CURRICULUM_IMPORT_CHART_NOT_FOUND` | 404 | İstenen sayfada çizelge yok |

---

## Dosya haritası

**Yeni — Application**
```
Modules/Academics/CurriculumSource/
  Abstractions/IMebCatalogClient.cs
  Abstractions/IMebDocumentFetcher.cs
  Abstractions/IPdfTextExtractor.cs
  Parsing/PdfTextDocument.cs          # PdfTextPage, PdfTextWord (konumlu)
  Parsing/MebChartParser.cs           # saf, deterministik
  Parsing/MebChartParseResult.cs
  Parsing/MebChartCellReader.cs       # hücre şekli çözümü
  Parsing/MebChartChecksum.cs
  Internal/CurriculumSourceIngestor.cs  # Dilim 2 yükleme yolundan çıkarılır
  Queries/DiscoverMebDocuments/
  Queries/ParseSourceDocument/
  Commands/FetchSourceDocument/
  Commands/StartImportRunFromChart/
```

**Yeni — Infrastructure**
```
Academics/Meb/TtkbCatalogClient.cs
Academics/Meb/MebDocumentFetcher.cs
Academics/Meb/MebSourceAllowlist.cs
Academics/Meb/PdfPigTextExtractor.cs
BackgroundJobs/Academics/MebCatalogSweepJob.cs
```

**Değişen**
```
src/Oksis.Api/Controllers/V1/PlatformCurriculumSourcesController.cs
src/Oksis.Api/Extensions/ResultExtensions.cs
src/Oksis.Infrastructure/DependencyInjection.cs
src/Oksis.Infrastructure/Oksis.Infrastructure.csproj      # PdfPig
Commands/UploadSourceDocument/UploadSourceDocumentCommandHandler.cs  # ingestor'a devir
```

**Test varlıkları**
```
tests/Oksis.Application.UnitTests/Modules/Academics/Parsing/Fixtures/
  anadolu-2025-05.words.json        # PDF'ten çıkarılmış kelime katmanı (golden girdi)
  anadolu-2025-05.expected.json     # beklenen çizelge çıktısı (golden çıktı)
  ilkogretim-2025.words.json
  ilkogretim-2025.expected.json
tests/Oksis.Infrastructure.IntegrationTests/Academics/Fixtures/
  anadolu-2025-05.pdf               # tek gerçek PDF: çıkarıcı katmanını doğrular
```

Golden girdiler **kelime katmanı JSON'u** olarak tutulur: parser'ın kendisi PDF'e bağımlı
değildir, bu yüzden onlarca MB PDF commit etmeye gerek yoktur. PDF→kelime adımını doğrulamak
için tek bir gerçek PDF yeterlidir.

---

## Görevler

### T1 — TTKB keşif istemcisi ve keşif ucu

Kırmızı: `TtkbCatalogClientTests` — sahte `HttpMessageHandler` ile gerçek JSON gövdesi verilir;
istemci `SIRAID/BASLIK/LINK/ISLEMSAAT`'i doğru çözer, `&#039;` ve `&quot;` entity'lerini açar,
göreli `LINK`'i mutlak adrese çevirir, `gg/aa/yyyy` tarihini `DateOnly`'ye çevirir, bozuk tarihi
`null` bırakır. İkinci test: uç 403 dönerse `FetchFailed` hatası üretilir.
Yeşil: `IMebCatalogClient`, `TtkbCatalogClient` (Referer + User-Agent başlıklarıyla),
`DiscoverMebDocumentsQuery` (aday listesini bilinen belgelerle eşler),
`GET /platform/curriculum-sources/discovery?category=7`.

**Kabul:** Bilinen adres `KnownDocumentId` ile döner; bilinmeyen adres `null` ile. Kategori
kimliği yapılandırılabilir, koda gömülmez.

### T2 — Allowlist, indirme ve tek giriş noktası

Kırmızı: `MebSourceAllowlistTests` — `ttkb.meb.gov.tr` ve `x.meb.gov.tr` geçer;
`meb.gov.tr.evil.com`, `evil.com`, `http://` (şemasız/düz metin) ve IP adresi geçmez.
`FetchSourceDocumentCommandTests` — allowlist dışı adres `HostNotAllowed`; başarılı indirme
Dilim 2 yükleme yoluna girer; aynı içerik ikinci kez `AlreadyExisted`; aynı adres farklı içerik
yeni belge + `SupersedesDocumentId`.
Yeşil: `MebSourceAllowlist`, `IMebDocumentFetcher` + `MebDocumentFetcher` (boyut tavanı akış
üzerinde zorlanır, `Content-Type` kontrol edilir), `CurriculumSourceIngestor` (yükleme
handler'ından çıkarılan ortak yol), `FetchSourceDocumentCommand`,
`POST /platform/curriculum-sources/documents/fetch`.

**Kabul:** `UploadSourceDocument` davranışı birebir korunur (mevcut testleri yeşil kalır);
parmak izi/virüs/revizyon kodu tek yerdedir.

### T3 — PDF metin katmanı çıkarıcısı

Kırmızı: `PdfPigTextExtractorTests` (integration projesi, gerçek fixture PDF) — 10 sayfa,
sayfa 2'de 500+ kelime, `İ`/`Ç`/`Ğ` doğru, kelime kutuları sıfırdan büyük.
İkinci test: metin katmanı olmayan (yalnız görüntü) PDF `NoTextLayer` hatası verir.
Yeşil: `IPdfTextExtractor`, `PdfTextDocument/Page/Word`, `PdfPigTextExtractor`, PdfPig paketi,
DI kaydı.

**Kabul:** Application katmanı PdfPig'i tanımaz; yalnız `IPdfTextExtractor` görür.

### T4 — Çizelge ayrıştırıcısı

Kırmızı: `MebChartParserTests` — golden kelime katmanı girdisiyle: 6 çizelge bulunur; Anadolu
Lisesi çizelgesinde `TÜRK DİLİ VE EDEBİYATI` satırı 9–12 için 5/5/5/5; `T.C. İNKILAP TARİHİ VE
ATATÜRKÇÜLÜK` yalnız 12'de 2, diğerleri `IsNotOffered`; `SEÇMELİ TARİH` 11 ve 12 için
`HourOptions = [2,4]`; ders adının sonundaki `(1)` ada karışmaz, `SourceNote`'a gider;
`ORTAK DERS SAATİ TOPLAMI` satırı ders satırı olarak üretilmez.
Yeşil: `MebChartParser` — başlık satırı tespiti, sınıf sütunu bantları, y kümeleme,
ders adı/hücre ayrımı, `MebChartCellReader`, bölüm etiketi (`ORTAK DERS SAATİ TOPLAMI` öncesi
`Common`, sonrası `Elective`).

**Kabul:** Parser saf; hiçbir I/O yapmaz, `DateTime.Now` okumaz, sıralaması deterministiktir.

### T5 — Sağlama ve drift denetimi

Kırmızı: `MebChartChecksumTests` — toplam satırları hesaplanan toplamla tutuyorsa uyarı yok;
bir hücre elle bozulduğunda `MEB_PARSER_SUM_MISMATCH` ve `Publishable = false`; toplam satırı
hiç yoksa `MEB_PARSER_NO_TOTALS` (uyarı, engel değil); okunamayan hücrede
`MEB_PARSER_UNREADABLE_CELL`.
Yeşil: `MebChartChecksum`, uyarı üretimi, `Publishable` bayrağı.

**Kabul:** `ORTAK + SEÇİLEBİLECEK + REHBERLİK = TOPLAM` eşitliği her sınıf sütunu için ayrı
ayrı denetlenir; tek sütunun tutmaması tüm çizelgeyi uyarılı yapar.

### T6 — Ayrıştırma ucu ve ara alana köprü

Kırmızı: `ParseSourceDocumentQueryTests` — belge yoksa `NotFound`; PDF olmayan belge
`NotParsable`; başarılı belge çizelge listesini döner ve **hiçbir şey yazmaz**.
`StartImportRunFromChartCommandTests` — istenen sayfada çizelge yoksa `ChartNotFound`;
başarılı çağrı Dilim 2'nin doğrulayıcısından geçen bir `CurriculumImportRun` üretir; parser
uyarısı olan çizelge `NeedsReview` doğar; aynı çağrı ikinci kez yeni çalışma açmaz.
Yeşil: `ParseSourceDocumentQuery` (+ `GET .../documents/{id}/parse`),
`StartImportRunFromChartCommand` (+ `POST /platform/curriculum-imports/from-chart`),
`ResultExtensions` eşlemeleri.

**Kabul:** Köprü, Dilim 2'nin `CurriculumImportValidator`'ını yeniden yazmaz; yalnız payload
üretip mevcut yolu çağırır.

### T7 — Golden-file testleri

Kırmızı→yeşil: gerçek PDF'ten kelime katmanı fixture'ları üretilir (tek seferlik betik, çıktı
commit edilir), beklenen çizelge çıktısı JSON'u yazılır, `MebChartGoldenTests` tam çıktıyı
karşılaştırır. En az iki farklı düzen: ortaöğretim (sınıf sütunlu) ve ilköğretim çizelgesi.
Fark hâlinde test, hangi satır/hücrede ayrıldığını okunur biçimde söyler.

**Kabul:** Golden çıktı elle değil, doğrulanmış koşudan üretilir ve gözle karşılaştırılır
(çizelge görüntüsüyle birebir).

### T8 — Keşif süpürme işi ve denetim izi

Kırmızı: `MebCatalogSweepJobTests` — iş yalnız yeni adresleri indirir; indirilmiş adresi
tekrar indirmez; bir belgenin indirilmesi patlarsa diğerleri devam eder ve hata denetim izine
yazılır.
Yeşil: `MebCatalogSweepJob` (elle tetiklenir, tekrarlayan zamanlama **yok**),
`POST /platform/curriculum-sources/discovery/sweep`, audit kayıtları
(`curriculum-source.discovery.swept`, `...document.fetched`, `...document.fetch-failed`).

**Kabul:** Tek bir hata süpürmeyi durdurmaz; sonuç raporu kaç yeni/kaç atlanan/kaç hata der.

### T9 — Doğrulama, belge ve kapanış

- `./scripts/test-changed.sh --all` yeşil.
- Docker açılır, `--integration` koşulur (müfredat süzgeci), sonra Docker kapatılır.
- `dotnet format` temiz; statik tarama: kapsamda `TODO/NotImplementedException` yok.
- Postman koleksiyonu ve curl referansı yeni uçlarla güncellenir.
- Domain notları `domain-map` ile güncellenir: `MEB Kaynak Belgesi` notuna keşif/indirme,
  `Müfredat İçe Aktarma` notuna parser köprüsü ve drift denetimi.
- PdfPig sürüm belirsizliği bulgu defterine açık bulgu olarak yazılır.

---

## Kabul matrisi

| # | Beklenen davranış | Görev | Nasıl doğrulanır |
|---|---|---|---|
| 1 | Kategori listesi ajax ucundan doğru çözülür | T1 | Birim (sahte handler, gerçek gövde) |
| 2 | Bilinen adres keşifte belge kimliğiyle işaretlenir | T1 | Birim |
| 3 | Allowlist dışı adres indirilmez | T2 | Birim |
| 4 | İndirme Dilim 2 yükleme yolunu kullanır | T2 | Birim + mevcut testlerin yeşil kalması |
| 5 | Aynı adres farklı içerik revizyon açar | T2 | Birim |
| 6 | Gerçek PDF'ten Türkçe metin doğru çıkar | T3 | Entegrasyon (fixture PDF) |
| 7 | Taranmış PDF açık hata verir | T3 | Entegrasyon |
| 8 | Tek PDF'teki tüm çizelgeler ayrı ayrı bulunur | T4 | Birim (golden) |
| 9 | Saat seçenekli hücre `hourOptions` üretir | T4 | Birim |
| 10 | Dipnot işareti ders adına karışmaz | T4 | Birim |
| 11 | Toplam tutmazsa çizelge yayımlanabilir sayılmaz | T5 | Birim |
| 12 | Toplam satırı yoksa drift uyarısı düşer | T5 | Birim |
| 13 | Ayrıştırma hiçbir şey yazmaz | T6 | Birim |
| 14 | Uyarılı çizelge `NeedsReview` doğar | T6 | Birim |
| 15 | Köprü idempotenttir | T6 | Birim |
| 16 | Golden çıktı birebir tutar | T7 | Birim |
| 17 | Süpürme tek hatada durmaz | T8 | Birim |
| 18 | Parser çıktısı onaysız master'a ulaşmaz | T6 | Dilim 2 onay testleri yeşil |

---

## Kapsam dışı (bilinçli)

- **OCR.** Taranmış belge elle giriş yoluna gider.
- **DOCX/XLSX ayrıştırma.** Bu dilim PDF'tir; diğer türler yüklenebilir ama ayrıştırılmaz.
- **Açıklama sayfalarının (dipnotların) anlamlandırılması.** Dipnot metni ham olarak saklanır;
  "(2) numaralı dipnot şu kuralı söyler" çözümlemesi `CurriculumSelectionRule` ile birlikte
  ertelenmiştir.
- **Tekrarlayan zamanlanmış keşif.** Dönem içi senkronizasyon tasarım kararıyla yok.
- **Ekranlar.** Platform paneli Dilim 4 ile planlanır.
- **Aday belge saklama politikası işleri** (2 yıl kuralı) — Dilim 2'de de ertelenmişti; keşif
  adayları veritabanında tutulmadığı için bu dilimde de konu değildir.
