---
tags: [teknik-analiz, domain/academic, meb, mufredat, katalog, tasarim]
date: 2026-09-20
status: approved
---

# MEB Kaynaklı Katalog Tasarımı — Program, Ders ve Branş

| | |
|---|---|
| **Belge türü** | Uygulama tasarımı (backend + API sözleşmesi + merkez ekranı) |
| **Kapsam** | `oksis-api` ve `oksis-ui` merkez yüzeyi |
| **Tarih** | 20 Eylül 2026 |
| **Durum** | Onaylandı; uygulama planı hazırlanabilir |
| **Revize ettiği belge** | [[meb-haftalik-ders-cizelgesi-entegrasyonu-tasarimi]] |

## 1. Amaç

Eğitim programı, ders ve branş kataloglarını **elle yazılmış seed satırlarından**
değil, MEB'in resmî belgelerinden türetmek; ve bir çizelgeyi ara alana taşımak
için merkez kullanıcısına hiçbir soru sormamak.

Bugün üç katalog da seed'dir ve üçü de gerçeğin altındadır:

| Katalog | Seed | Belgelerdeki gerçek |
|---|---|---|
| Eğitim programı | 18 satır | Katalogda yalnız çizelgesi olan türler olmalı |
| Ders | 21 satır | Ara alandaki 3 belgede bile **66 farklı ders** |
| Branş | 16 satır | Öğretmenlik alanları kararında **~90 alan** |

Başarı ölçütü: bir MEB belgesi indirildiğinde program, ders ve branş
kataloglarının o belgenin kendi verisinden doğması; ara alana taşımanın tek
düğmeye inmesi.

## 2. Kesin kararlar

1. **Katalog belgeden doğar.** `EducationProgram`, `MasterSubject`, `MasterBranch`
   ve ders ↔ branş bağı için seed satırı yazılmaz. Seed dosyaları silinir.
2. **Program indirmede, ders ve branş yayımda doğar.** Program tek bir sayfa
   başlığından gelir (düşük risk); ders ve branş tablo hücrelerinden gelir ve
   ayrıştırıcı hatası doğrudan kataloğa çöp yazar. Ölçüm bu riskin gerçek
   olduğunu gösterdi (bkz. §7).
3. **Ara alana taşıma soru sormaz.** Karar numarası, karar tarihi, set başlığı ve
   akademik yıl kapaktan okunur; eğitim programı sayfa başlığından bilinir.
   `StartImportDialog` silinir.
4. **Bir karar = bir belge seti.** Belge başına tek set açılır; belgedeki bütün
   çizelgeler o setin altına, programa bir çalışma olarak girer.
5. **Kademe addan değil, sınıf sütunlarından türetilir.**
6. **Kategori MEB'in kendi bandıdır.** `SubjectCategory` enum'u (Dil/Matematik/
   Fen/Sosyal) kaldırılır; MEB'in seçmeli ders bandı ham metin olarak müfredat
   **satırında** saklanır — ders kaydında değil. Ortak derste `null`'dır; uydurma
   varsayılan yazılmaz. Enum'a bağlı vekâlet `Near` basamağı branş üzerinden
   yeniden tanımlanır (§5.5).
7. **Belge türü kapaktan tanınır**, kullanıcıya sorulmaz.
8. **Kapsanmayan veri hata değildir.** Branşı bulunamayan ders, kaynağı
   bulunamayan alan kayıtlı birer durumdur; süreç durmaz.
9. **Önce müfredat, sonra okul.** Okul açılışında eğitim programı seçimi zorunlu
   olur; kademe varsayılanı kavramı (`is_default`) kaldırılır.

## 3. Kapsam dışı

- **Meslekî eğitim ders katalogları.** Öğretmenlik alanları kararında meslek
  dersleri düzyazı kural olarak geçiyor ("…dallarının alan/dal dersleri ve
  modülleri"); bunlar tekil ders adı değildir ve kataloğa yazılmaz.
- **Kapak okunamayan belgeye elle karar bilgisi girme.** Kaldırılan modalı arka
  kapıdan geri getirirdi. Gerekirse belge seti yönetim ekranının işidir.
- **Mezun olunan yükseköğretim programının modellenmesi.** Ham metin listesi
  olarak saklanır; üzerine ekran veya mantık kurulmaz.
- **Veri göçü.** Dev veritabanı sıfırlanır; göç hiçbir taşıma mantığı içermez.
- **Vekâlet sıralamasının yeniden tasarlanması.** `Near` yalnız yeniden tanımlanır
  (§5.5); vekâlet ekranının geri kalanına dokunulmaz.

## 4. Neden seed bırakılmıyor

Seed'in kendi notu listeyi "TTKB kataloğundan indirilen otuz çizelgenin
başlıklarından türetildi" diye anlatıyor. Ölçüm bunu doğrulamıyor:

- Karar kapağı "Hazırlık Sınıfı Bulunan Fen Lisesi" derken seed'de "Özel Program
  Uygulayan Fen Lisesi" var.
- Ara alandaki **66 ders adının 59'u** 21 satırlık katalogda karşılıksız. İçe
  aktarma çalışmalarında satırların **%91'i** çözülmemiş durumda
  (161 satırın 146'sı).
- Branş seed'i gerçek alan sayısının altıda biri.

Elle bakılan liste, kaynağı değiştiğinde sessizce bayatlar. Tek çare kaynağı
okumaktır.

## 5. Veri modeli değişiklikleri

### 5.1 `EducationProgram`

| Alan | Değişiklik |
|---|---|
| `Code` | Çizelge başlığından türetilir: "HAFTALIK DERS ÇİZELGESİ" eki atılır, Türkçe harfler katlanır, boşluk tireye döner. `HAZIRLIK-SINIFI-BULUNAN-FEN-LISESI`. Deterministik; aynı belge iki kez gelirse aynı kod. |
| `Name` | Belgedeki başlık, başlık düzenine çevrilmiş hâliyle |
| `EducationLevel` | Çizelgenin sınıf sütunlarından (`GradeLabels` → `EducationLevelClassifier.FromGradeNumber`); sayısal olmayan etiketler (`HAZIRLIK`) yok sayılır |
| `IsDefault` | **Kaldırılır.** Belgeden türetilemez; `ux_education_programs_default_level` indeksi ve bootstrapper'ın varsayılana düşme dalı silinir |
| `SourceDocumentId` | **Yeni.** Hangi MEB belgesinden doğdu |
| `SourcePageNumber` | **Yeni.** Hangi çizelge |
| `SourceTitle` | **Yeni.** Belgedeki ham başlık |

### 5.2 `MebSourceDocument`

Kapak verisi indirme anında okunur ve belgeyle saklanır; taşıma anında yeniden
ayrıştırma yapılmaz.

| Alan | Kaynak |
|---|---|
| `DocumentKind` | **Yeni.** `WeeklyScheduleChart` \| `TeachingFields` \| `Unknown`; kapak başlığından |
| `DecisionNumber` | Kapak tablosu: `Sayı` + `Tarih` yılı → `2025/05` |
| `DecisionDate` | Kapak tablosu: `Tarih` |
| `SubjectTitle` | Kapak `Konu:` satırı |
| `AcademicYearCode` | Kapak gövdesi: "2025-2026 eğitim öğretim yılından itibaren" |

> **Tuzak:** Kapakta iki tarih/sayı çifti var — kararın kendisi ve "Önceki Kararın
> Tarih ve Sayısı". Ayrıştırıcı etiketlere tutunmalı; kör regex önceki kararı
> yakalar ve yanlış kaynak izi üretir.

> **URL karar numarası değildir.** `meb_iys_dosyalar/2025_05/` MEB'in yükleme
> klasörüdür (yıl_ay). Bu belgede karar sayısı 05 ve yükleme ayı Mayıs olduğu için
> tesadüfen örtüşür; önceki kararın sayısı 37'dir ve 37. ay yoktur. Canlı katalogda
> `2025_07/`, `2026_04/` klasörleri bu tespiti doğruluyor.

### 5.3 `MasterSubject`

| Alan | Değişiklik |
|---|---|
| `Category` | **Kaldırılır** — ama MEB kategorisi kaybolmaz, yeri değişmez: zaten satırda duruyor (aşağıya bakınız). Kaldırılan, bizim `SubjectCategory` enum'umuzdur (Dil / Matematik / Fen / Sosyal / Sanat) |
| `Code` | Ders adından türetilir (program koduyla aynı kural) |
| `Name` | Belgedeki ham ad, başlık düzenine çevrilmiş |
| `IsElective` | Çizelgedeki ortak/seçmeli bandından (`CurriculumCourseType`) |
| `SourceDocumentId`, `SourcePageNumber`, `SourceTitle` | **Yeni.** Programdakiyle aynı |

#### MEB kategorisi nereye yazılır

Çizelgenin sol sütunundaki bantlar — "AKADEMİK ÇALIŞMALAR", "İNSAN, TOPLUM VE
BİLİM", "DİN, AHLAK VE DEĞER", "KÜLTÜR, SANAT VE SPOR" — **müfredat satırına**
ham metin olarak yazılır ve sabit bir listeye eşlenmez:

| Tablo | Sütun | Ne zaman |
|---|---|---|
| `curriculum_import_entries` | `source_category` `nvarchar(200)` | Ara alana taşınırken |
| `curriculum_entries` | `source_category` `nvarchar(200)` | Yayımlanırken |

**Neden derste değil satırda:** aynı ders programdan programa farklı banda düşer,
ortak bantta ise hiç bandı yoktur. Sosyal Bilimler Lisesi çizelgesinde
`TÜRK DİLİ VE EDEBİYATI` ortak bantta (kategorisiz), `SEÇMELİ TÜRK DİLİ VE
EDEBİYATI` ise AKADEMİK ÇALIŞMALAR bandındadır. Kategori derste dursaydı biri
ötekini ezerdi. Gruplama okuma tarafında yapılır (`TB-217`).

> **`SEÇMELİ FİZİK` ayrı bir derstir.** MEB kendi tablosunda onu seçmeli bandında,
> `FİZİK`'i ortak bandında ayrı satır olarak yazıyor; saatleri ve sınıfları da
> farklı. Katalogda iki ayrı ders olarak durur. Önek yalnız **branş ararken**
> soyulur (§7): `SEÇMELİ FİZİK`, `FİZİK`'in branşına bağlanır ama kimliğini korur.

### 5.4 `MasterBranch` ve ders ↔ branş

| Alan | Kaynak |
|---|---|
| `Name` | Kararın "ATAMAYA ESAS OLAN ALAN" sütunu; "(Değişik: … TTKK)" notları ayıklanır |
| `Code` | Ad'dan türetilir |
| `SourcePrograms` | **Yeni.** "MEZUN OLDUĞU YÜKSEKÖĞRETİM PROGRAMI/FAKÜLTE" sütunu, **ham metin listesi**. Modellenmez; ileride gerekirse diye saklanır |
| `SubjectBranch` | "OKUTACAĞI DERSLER" sütunundan; çoka-çok (bir ders birden çok alanda okutulur) |

### 5.5 Vekâlet `Near` basamağı

`SubjectCategory` kalkınca `BranchFitResolver`'ın `Near` basamağı dayanaksız
kalır — bugün "aday, boştaki dersle aynı kategoriden bir ders veriyor" demektir.
Yeni tanım belgeden gelir:

| Basamak | Yeni tanım |
|---|---|
| `Same` | Değişmiyor: aday zaten o dersi veriyor veya ana/yan branşı o dersi okutabiliyor |
| `Near` | Aday, boştaki dersle **ortak bir alandan okutulabilen** bir ders veriyor |
| `Different` | Örtüşme yok |

"Fen Bilimleri hem Biyoloji hem Fizik alanından okutulur" gerçek bir yakınlıktır ve
öğretmenlik alanları kararının kendi verisidir; "ikisi de Fen kategorisinde"
uydurma bir eksendi. Vekâlet sorgusu artık ders ↔ branş bağını da okur.

**Sıra bağımlılığı:** branş verisi yüklenene kadar `Near` hiç tetiklenmez ve
vekâlet `Same`/`Different` ile çalışır. Bu, bozulma değil eksik veridir.

**Okulun kendi açtığı ders** (`CreateSubject`) kategori sormaz; okul dersi de
branşa bağlanır ve aynı kuralla değerlendirilir.

## 6. Ana akışlar

### 6.1 Belge depoya girer → program doğar

`CurriculumSourceIngestor.IngestAsync` yeni bir kayıt açtığında belge ayrıştırılır.
Üç giriş de buradan geçer: tek belge indirme, kategori süpürme, elle yükleme —
aralarında sapma olamaz (`TB-212` dersi).

1. Kapak okunur → belge türü, karar bilgisi, akademik yıl yazılır.
2. Tür `WeeklyScheduleChart` ise her çizelgenin başlığından program adayı çıkarılır;
   kodu katalogda olmayan yazılır.
3. Metin katmanı yoksa program doğmaz; belge saklanır, denetim izine yazılır.
4. Tek belgenin hatası süpürmeyi durdurmaz.
5. Denetim izi: `education-program.derived` — belge, sayfa, başlık, üretilen kod.

Belge ikinci kez geldiğinde `AlreadyExisted` döner ve türetme hiç çalışmaz.

### 6.2 Ara alana taşıma — tek düğme

"Çizelgeler" bölümünün başındaki tek düğme belgedeki bütün çizelgeleri taşır.

1. Belgenin seti yoksa kapak verisinden açılır; varsa o kullanılır.
2. Her çizelge kendi programına bir içe aktarma çalışması üretir. Program sayfa
   numarasından bilinir; tahmin yoktur.
3. Sonuç tek bildirim: "6 çizelge taşındı · 142 satır · 59 yeni ders açılacak".
4. Tekrar basmak zararsız: çalışma benzersizliği `(set, program, yıl, payload)`
   parmak izinde.
5. Kapak okunamamışsa taşıma yapılmaz ve neden söylenir.

Bu, bugünkü `CURRICULUM_SOURCE_SET_DUPLICATE` çıkmazını kökten kaldırır: modal her
çizelge için yeni set açtığı ve set benzersizliği (karar numarası + başlık) olduğu
için, **aynı kararın ikinci çizelgesi bugün taşınamıyor**; arayüz kullanıcıdan
uydurma bir set başlığı istiyor ve bir kararı birden çok hukuki kaynağa bölüyor.

### 6.3 Onay ve yayım — ders ve branş doğar

Eşleşmeyen ham ad artık "çözülmemiş sorun" değil **"açılacak yeni ders"**dir.
Merkez çalışmayı onayladığında o dersler katalogda açılır. 59 ayrı karar yerine
tek onay olur ve onaylayan kişi zaten çizelgeye bakmaktadır. Ayrıştırıcı çöpü de
ara alanda, yayımdan önce görülür.

Öğretmenlik alanları kararı da aynı kapıdan geçer: kendi setini açar, yayımda ~90
branş ve ~600 ders ↔ branş bağı yazar.

### 6.4 Seçilebilirlik işareti

Program kataloğu uçları her program için `HasPublishedCurriculum` alanını **veri
olarak** döner; okul açılış ekranı yalnız çizer. İşareti ekran uydurmaz —
ekranın uyguladığı ama sunucunun bilmediği kural yok sayılır (`TB-32`).

## 7. Öğretmenlik alanları kararı

**Kaynak:** `ttkb.meb.gov.tr/meb_iys_dosyalar/2025_12/23100922_9_cizelgeveesaslar.pdf`
— 20/02/2014 tarih ve 9 sayılı Kurul kararı, 49 sayfa, metin katmanı var, üzerinde
on küsur değişiklik kararı işlenmiş.

Bu belge süpürülen kategoride (7) **değildir**; adresi verilerek indirilir.
`documents/fetch` ucu ve `meb.gov.tr` allowlist'i bunu zaten kapsar — yeni edinme
altyapısı gerekmez.

**Ayrı ayrıştırıcı: `MebTeachingFieldsParser`.** Çizelge ayrıştırıcısıyla ortak yanı
yalnız `PdfTextDocument` ve `Fold`. Sütun konumundan çözer:
`SIRA NO | ATAMAYA ESAS OLAN ALAN | MEZUN OLDUĞU YÜKSEKÖĞRETİM PROGRAMI | OKUTACAĞI DERSLER`.

**Ders adı eşleme kuralları** (ölçümden türetildi — 66 çizelge dersinin 47'si
kararda birebir geçiyor):

| Kural | Örnek | Kazanç |
|---|---|---|
| `SEÇMELİ ` öneki atılır | SEÇMELİ FİZİK → FİZİK | 9 ders |
| Eğik çizgi böler | BEDEN EĞİTİMİ VE SPOR/GÖRSEL SANATLAR/MÜZİK | 2 ders |
| Türkçe katlama ile karşılaştırma | İ/I, Ş/S… | — |

Kalan 6 ders kararda gerçekten yok (HEDEF TEMELLİ DESTEK EĞİTİMİ, SANAT EĞİTİMİ,
SPOR EĞİTİMİ, KLASİK AHLAK METİNLERİ…): karar çizelgeden eski olabilir. Bunlar
**branşsız** kalır; hata değildir.

İki ad ise ayrıştırıcı çöpüdür ve düzeltilmesi gereken bir kusurdur:
`KÜLTÜR, VE SPOR SANAT TÜRK KÜLTÜR VE MEDENİYET TARİHİ` ve
`İNSAN, TOPLUM VE DEMOKRASİ VE İNSAN HAKLARI` — kategori bandı ders adına taşıyor.

## 8. Göç ve kurulum sırası

Göç veri taşımaz. Dev veritabanı sıfırlanır ve sıra şu olur:

```text
göç → MEB belgeleri indirilir → programlar doğar
    → çizelgeler ara alana taşınır → onay → ders katalogu + müfredat yayımlanır
    → öğretmenlik alanları kararı indirilir → onay → branşlar
    → okullar açılır
```

Silinen seed dosyaları: `CurriculumProgramSeedData`, `SubjectSeedData`,
`SubjectBranchSeedData`, `BranchSeedData` ve `MasterSeedIds` içindeki karşılıkları.

Ölçülen bağımlılık (silme öncesi): 18 programın 15'i tamamen boşta; `HIGH-PROVISIONAL`
7 sezon bağı, `PRIMARY-GENERAL` 2 sezon bağı taşıyor. Hiçbir okulun kalıcı program
tercihi yok (`school_education_programs` boş). Dev veritabanı sıfırlandığı için bu
bağların taşınması gerekmez.

## 9. Hata davranışı

| Durum | Davranış |
|---|---|
| Kapak okunamıyor | Belge saklanır, program doğmaz, taşıma reddedilir, gerekçe söylenir |
| Belge türü tanınmıyor | Saklanır, ayrıştırılmaz, denetim izine yazılır |
| Çizelge sağlaması tutmuyor | Bugünkü gibi: satırlar ara alana girer, çalışma `NeedsReview`'e düşer |
| Ders branşta bulunamıyor | Branşsız kalır; kayıtlı durum |
| Tek belge indirilemiyor | Süpürme devam eder; hata belge başına denetim izine |

## 10. Test stratejisi

- **Birim:** kod türetme (Türkçe katlama, ek soyma), kademe çıkarımı, `SEÇMELİ`
  öneki ve eğik çizgi bölme, kapak alanlarının doğru etiketten okunması
  (özellikle "Önceki Kararın Tarih ve Sayısı" tuzağı).
- **Ayrıştırıcı:** gerçek PDF fixture'ları — hem bir çizelge kararı hem
  öğretmenlik alanları kararı.
- **Entegrasyon (gerçek SQL):** belge indirme → program doğuşu → taşıma →
  onay → ders ve branş doğuşu zinciri. Bellek içi sağlayıcı benzersizlik
  kısıtlarını zorlamaz; bu testler DB'li koşmalıdır.
- **İdempotentlik:** aynı belgeyi iki kez indirmek, aynı çizelgeyi iki kez taşımak.
- **Vekâlet regresyonu:** `Near` basamağının yeni tanımı — ortak alandan okutulan
  ders veren aday yakın sayılmalı; branş verisi yokken `Same`/`Different` ile
  çalışmaya devam etmeli. Mevcut vekâlet entegrasyon testleri `SubjectCategory`
  kurduğu için hepsi gözden geçirilir.

## 11. Açık noktalar

- **Kapağın okunabilirliği henüz ölçülmedi.** Gömülü font nedeniyle düz metin
  çıkarımı anlamsız sonuç verdi; PdfPig ile doğrulama uygulamanın ilk adımıdır.
  Kapak beklenen alanları vermiyorsa §5.2 yeniden ele alınır.
- **Kategorinin programa göre değişip değişmediği ölçülemedi:** `source_category`
  sütunu dolu satır bulunmuyor (özellik yeni). İlk gerçek koşuda doğrulanacak.
