---
tags: [teknik-analiz, domain/academic, meb, mufredat, tasarim]
date: 2026-09-18
status: approved
---

# MEB Haftalık Ders Çizelgesi Entegrasyonu ve Sezon Müfredatı Tasarımı

| | |
|---|---|
| **Belge türü** | Uygulama tasarımı (backend + API sözleşmesi) |
| **Kapsam** | `oksis-api`; kullanıcı yüzeyi için `oksis-ui` ayrı çalışma |
| **Tarih** | 18 Eylül 2026 |
| **Durum** | Onaylandı; uygulama planı hazırlanabilir |
| **İlgili bulgular** | `TB-201`, `TB-202`, `E-16` |

## 1. Amaç

TTKB'nin haftalık ders çizelgesi kategori sayfasından resmî karar ve eklerini
keşfetmek, bu belge setinden sürümlü OKSİS master müfredatı üretmek ve yeni
sezon hazırlanırken özel okulun sınıf seviyesi bazındaki ders planına başlangıç
verisi sağlamaktır.

OKSİS yalnız özel okullara hizmet eder. MEB çizelgesi okul için değiştirilemez
bir kısıt değil, resmî referans tabandır. Okul bir dersin saatini sıfıra
indirebilir, artırabilir, azaltabilir, dersler arasında saat aktarabilir ve
toplam haftalık saati MEB toplamının altına veya üstüne taşıyabilir.

Başarı ölçütü, MEB kaynağının tarihî doğruluğunu korurken okulun bu serbestliği
sezon bazında kullanabilmesi ve aktif sezonun sonradan yayımlanan master
sürümlerden etkilenmemesidir.

## 2. Kesin kararlar

1. TTKB kategori sayfası yalnız **belge keşif kaynağıdır**. Hukuki ve semantik
   otorite, kurul kararı ile kararın resmî eklerinin birlikte oluşturduğu belge
   setidir.
2. Master müfredat sürümünü `curriculum-version.approve` yetkisi olan merkez
   kullanıcıları onaylar.
3. Bir okul aynı akademik yılda birden fazla lise eğitim programı kullanamaz.
4. Müfredat okula, şubeye veya öğrenciye doğrudan bağlanmaz. Bağlama koordinatı:

   ```text
   SchoolId + AcademicYearId + EducationProgramId + GradeLevelId
   → CurriculumVersionId
   ```

5. Şube ve öğrenci farklılıkları, bu bağlamadan türetilen okul ders planında
   yönetilir.
6. MEB müfredatı dönem içinde senkronize edilmez. Yeni sezon hazırlanırken o
   akademik yıl için yayımlanmış güncel sürüm kullanılır.
7. Taslak sezon güncel master sürüme yeniden tabanlanabilir. Müfredat, sezon
   aktivasyonunda snapshot olarak sabitlenir; aktivasyondan sonra değişmez.
8. MEB dersi ad değiştirdiğinde, bölündüğünde veya birleştiğinde otomatik ad
   eşlemesi nihai karar vermez. Sistem aday önerir; merkez kullanıcısı onaylar.
   Anlamı değişen ders yeni master kimlik alır.
9. Onaylı master üretiminde kullanılan ham belgeler ve bütün yayımlanmış
   müfredat sürümleri süresiz saklanır; hard-delete uygulanmaz.

## 3. Kapsam dışı

- Aktif sezonda MEB değişikliği cascade etmek
- Dönem içi müfredat değişikliği bildirimi, erteleme veya escalation akışı
- Aktif ders programını master sürüm değişikliğiyle otomatik revize etmek
- Okulun MEB saatlerinden sapmasını engellemek
- UI ekranlarının bu backend diliminde uygulanması
- Genel amaçlı, kullanıcı tarafından programlanabilir bir kural dili

## 4. Mimari yaklaşım

Seçilen yaklaşım **sürümlü master + taslakta katmanlı çözümleme + aktivasyonda
değişmez sezon snapshot'ı** modelidir.

```text
TTKB kategori sayfası
        ↓ keşif
Kurul kararı + resmî ekler
        ↓ indir / hash / değişmez sakla
Import staging + doğrulama + ders eşleme incelemesi
        ↓ merkez onayı
Değişmez CurriculumVersion
        ↓ yeni sezon taslağı
Master satırlar + okul override'ları + okul özel dersleri
        ↓ sezon aktivasyonu
Değişmez SchoolCurriculumSnapshot
        ↓
Ders programı üretimi ve eksik saat hesapları
```

### 4.1 Sistem sınırları

#### MEB belge entegrasyonu

- Kategori sayfasından karar ve ekleri keşfeder.
- Ham belgeleri hash'leyerek saklar.
- Belgeleri ayrıştırıp staging alanına yazar.
- Master tabloya doğrudan yazmaz.

#### Master müfredat yönetimi

- Onaylı belge setinden değişmez `CurriculumVersion` üretir.
- Eğitim programını, sınıf seviyelerini, dersleri, saatleri ve seçim kurallarını
  taşır.
- Yeni yayın eski satırları değiştirmez; eski sürüm `Superseded` olur.

#### Okul sezon müfredatı

- Taslak sezon için güncel master sürümü başlangıç tabanı olarak kullanır.
- Okulun serbest saat değişikliklerini ve tenant'a özel derslerini tutar.
- MEB farkını gösterir fakat engel üretmez.

#### Aktif sezon snapshot'ı

- Sezon aktivasyonunda nihai okul ders planını materialize eder.
- Ders programı ve eksik saat hesabının tek çalışma kaynağıdır.
- Aktif ve geçmiş sezonlarda değişmez.

## 5. Veri modeli

### 5.1 Platform/master varlıkları

#### `MebSourceDocument`

Bir karar veya ekinin indirilen ham dosyasıdır.

| Alan | Açıklama |
|---|---|
| `Id` | Kimlik |
| `SourceUrl` | Keşfedilen kaynak URL |
| `FinalUrl` | Yönlendirme sonrası URL |
| `Sha256` | İçerik parmak izi; tekil |
| `MimeType`, `ByteLength` | Güvenlik ve doğrulama |
| `StorageKey`, `StorageVersion` | Değişmez obje depolama adresi |
| `RetrievedAt` | İndirme zamanı |
| `ETag`, `LastModified` | Koşullu istek bilgisi; tek doğruluk kaynağı değildir |

#### `MebDocumentSet`

Kurul kararı ve resmî eklerini tek hukuki kaynak setinde toplar. Bir doküman
birden fazla keşif çalışmasında bulunabilir; set içindeki rolü (`Decision`,
`Annex`, `Correction`) ayrı eşleme kaydıyla tutulur.

#### `CurriculumImportRun`

İndirme/ayrıştırma/onay sürecinin operasyon kaydıdır.

```text
Discovered → Downloaded → Parsed → NeedsReview → Approved → Published
                                 ↘ ParseFailed / Quarantined / Rejected
```

Parser sürümü, validasyon sonuçları, inceleyen, onaylayan ve hata özeti taşır.

#### `EducationProgram`

Anadolu Lisesi, Fen Lisesi, hazırlık sınıfı bulunan program gibi müfredat
varyantıdır. `SchoolType.HighSchool` yerine geçmez; okul türünün altındaki
eğitim programı eksenidir.

#### `CurriculumVersion`

| Alan | Açıklama |
|---|---|
| `EducationProgramId` | İlgili eğitim programı |
| `AcademicYearCode` | Hangi akademik yıl için geçerli olduğu |
| `DecisionNumber`, `DecisionDate` | Resmî karar künyesi |
| `DocumentSetId` | Hukuki kaynak seti |
| `SupersedesVersionId` | Yerini aldığı sürüm |
| `Status` | `Draft`, `Published`, `Superseded`, `Rejected` |
| `PublishedAt`, `PublishedBy` | Denetim izi |

Yayımlanmış sürüm update veya hard-delete edilemez.

#### `CurriculumEntry`

Bir sürümdeki sınıf seviyesi × master ders satırıdır. Ortak/seçmeli türünü,
kategoriyi ve MEB varsayılan haftalık saatini taşır.

#### `CurriculumHourOption`

`1 veya 2 saat` gibi ayrık saat seçeneklerini taşır. Min/max aralığı bu
semantiği doğru ifade etmediği için seçenekler ayrı satırlardır.

#### `CurriculumSelectionRule`

Kategori asgarisi, tekrar limiti, önkoşul ve birbirini dışlama gibi MEB
kurallarını tipli kayıtlarla ifade eder. İlk sürüm yalnız resmî belgelerde
karşılaşılan bilinen kural tiplerini destekler; genel amaçlı DSL yapılmaz.

#### `CurriculumProvenance`

Her giriş ve kuralı kaynak doküman, sayfa ve kaynak metin/tablo koordinatına
bağlar.

### 5.2 Ders kimliği

- MEB satırı kanonik `MasterSubject` kimliğine bağlıdır.
- İsim benzerliği yalnız öneri üretir.
- Nihai eşleme merkez onayı ister.
- Anlamı değişen ders yeni master kimlik alır.
- Okulun açtığı özel ders `SchoolSubject` olarak tenant kapsamında yaşar;
  master kataloğa yazılmaz.

### 5.3 Tenant taslak varlıkları

#### `SchoolAcademicProgram`

Okulun akademik yıldaki lise programıdır. Aktif/taslak sezon için aşağıdaki
tekillik veritabanında korunur:

```text
SchoolId + AcademicYearId + EducationLevel(HighSchool)
```

#### `SchoolCurriculumDraft`

`SchoolAcademicProgram + GradeLevelId` koordinatında yaşar ve temel
`CurriculumVersionId` değerini taşır.

#### `SchoolCurriculumOverride`

- İlgili master dersin okul haftalık saatini taşır.
- Saat negatif olamaz; sıfır geçerlidir.
- MEB'e eşit değer yazmak zorunlu değildir; eşitse gereksiz override silinebilir.
- Değiştiren, değiştirilme zamanı ve isteğe bağlı açıklama saklanır.
- MEB toplamına göre hiçbir alt/üst sınır uygulanmaz.

#### `SchoolCurriculumCustomCourse`

Okulun ilgili sınıf seviyesine eklediği `SchoolSubject` ve haftalık saattir.

### 5.4 Aktivasyon snapshot'ı

#### `SchoolCurriculumSnapshot`

Okul, akademik yıl, eğitim programı ve sınıf seviyesi koordinatında nihai,
kilitli plandır. Kaynak master sürümünü, kilitleyen kullanıcıyı ve zamanı taşır.

#### `SchoolCurriculumSnapshotItem`

| Alan | Açıklama |
|---|---|
| `SubjectId` | Okulun kullandığı ders |
| `MasterSubjectId?` | Varsa MEB/master karşılığı |
| `MebReferenceHours?` | Kaynak sürümdeki saat |
| `FinalWeeklyHours` | Okulun nihai saati; sıfır geçerli |
| `IsCustomCourse` | Tenant'a özel ders işareti |
| `SourceCurriculumEntryId?` | Provenance bağı |

Snapshot ve item'ları oluşturulduktan sonra değiştirilemez.

## 6. Ana akışlar

### 6.1 Merkezde veri çekme ve yayınlama

1. Yetkili kullanıcı `MEB'den kontrol et` komutunu başlatır.
2. API işi background queue'ya alır ve durum kimliği döner.
3. Kategori sayfasından belge adayları keşfedilir.
4. Yalnız allowlist'teki MEB domainlerinden belge indirilir.
5. MIME, boyut ve hash kontrolleri yapılır.
6. Aynı hash varsa işlem idempotent tamamlanır.
7. Aynı URL farklı hash döndürürse yeni belge revizyonu açılır.
8. Parser staging verisini ve provenance kayıtlarını üretir.
9. Yapısal ve semantik validasyonlar çalışır.
10. Belirsiz ders eşlemeleri merkez incelemesine sunulur.
11. Yetkili kullanıcı onaylar ve değişmez master sürüm yayımlanır.

Fetch, parse veya validasyon hatası mevcut yayımlanmış sürümü etkilemez.
Manuel resmî belge yükleme aynı pipeline'ı kullanan fallback yoludur.

### 6.2 Yeni sezon taslağı

1. Okulun tek lise eğitim programı seçilir.
2. Akademik yıl + program + sınıf seviyesi için güncel yayımlanmış sürüm
   çözülür.
3. Her sunulan sınıf seviyesi için draft açılır.
4. Okul ders saatlerini serbestçe değiştirir ve özel ders ekler.
5. Arayüze MEB saati, okul saati ve fark döner; fark engel değildir.

Master veri bulunamazsa okul ve sezon kurulumu engellenmez. Okul manuel planla
devam eder; snapshot kaynak tipi `Manual` olur ve MEB'e bağlı olmadığı açıkça
gösterilir.

### 6.3 Güncel master'a yeniden tabanlama

Bu işlem yalnız taslak sezonda ve kullanıcı aksiyonuyla çalışır:

- Aynı master ders kimliğinin override'ı korunur.
- Yeni ders varsayılan MEB saatiyle eklenir.
- Kaldırılmış ders sessizce silinmez; inceleme listesine taşınır.
- Merkezce onaylanmış split/merge eşlemeleri uygulanır.
- Çözülemeyen satırlar kullanıcı kararına bırakılır.

### 6.4 Sezon aktivasyonu

Aktivasyon tek transaction ve idempotent komuttur:

1. Okul/yıl lise programı tekilliği doğrulanır.
2. Sunulan her sınıf seviyesi için draft kontrol edilir.
3. Master + override + özel dersler nihai satırlara çözülür.
4. Snapshot ve item'lar materialize edilir.
5. Kaynak sürüm ve MEB referans saatleri dondurulur.
6. Snapshot kilitlenir ve sezon aktifleşir.

Tekrar çağrıda ikinci snapshot üretilmez. Transaction başarısızsa sezon aktif
olmaz ve yarım snapshot kalmaz.

### 6.5 Aktif sezon okuması

Aktivasyon sonrasında:

- Ders programı üretimi snapshot item'larını okur.
- Eksik saat hesabı `FinalWeeklyHours` değerini kullanır.
- Yeni master sürüm aktif veya geçmiş sezonu değiştirmez.
- Saat sıfırsa ders otomatik üretim talebine girmez.

## 7. Yetki ve tenant sınırları

| İşlem | Yetki / kapsam |
|---|---|
| MEB kaynağını çekme | Platform · `curriculum-source.fetch` |
| Import inceleme | Platform · `curriculum-source.review` |
| Staging düzeltme | Platform · `curriculum-source.edit` |
| Sürüm onaylama | Platform · `curriculum-version.approve` |
| Sürüm yayınlama | Platform · `curriculum-version.publish` |
| Okul draft görüntüleme | Tenant · `curriculum-hours.view` |
| Override/özel ders yönetimi | Tenant · `curriculum-hours.override` |
| Sezon aktivasyonu | Var olan sezon aktivasyon yetkisi |

- Master varlıklar `IHasTenant` taşımaz ve okul kullanıcılarına salt okunurdur.
- Draft, override, özel ders ve snapshot varlıkları `IHasTenant` taşır.
- Tenant kayıtları global query filter ve `TenantSaveChangesInterceptor` ile
  korunur.
- Background tenant işi açık `SchoolId` argümanı taşır.
- Tenant veri yolunda `IgnoreQueryFilters()` kullanılmaz.
- Manuel staging düzeltmesi yapan kullanıcı aynı import paketinin tek
  onaylayıcısı olamaz.

## 8. Saklama politikası

| Veri | Saklama |
|---|---|
| Onaylı karar ve resmî eklerin ham dosyası | Süresiz |
| Bütün yayımlanmış/superseded müfredat sürümleri | Süresiz |
| Hash, kaynak URL, karar ve provenance metadata | Süresiz, sıcak |
| Kullanılmamış/reddedilmiş ham aday belge | 2 yıl |
| Reddedilmiş adayın hash ve işlem kaydı | Süresiz |
| OCR/render geçici çıktıları | 90 gün |
| Import/parser operasyon logları | 5 yıl |

Güncel sürüm ve son iki akademik yıl sıcak depolamada tutulur. Eski ham
belgeler değişmez soğuk arşive taşınabilir; metadata çevrim içi kalır ve geri
getirme hedefi en fazla 24 saattir.

## 9. Hata davranışı ve gözlemlenebilirlik

- Kaynak erişilemiyorsa son onaylı master çalışmaya devam eder.
- Parse hatası veya düşük güven master yayınlamaz.
- Semantik toplam/kurallar tutarsızsa import `NeedsReview` veya `Quarantined`
  olur.
- Bilinmeyen ders otomatik global ders oluşturmaz.
- Import ve aktivasyon işlemleri idempotenttir.
- Log kapsamı: `ImportRunId`, `DocumentSetId`, `CurriculumVersionId`, gerekirse
  `SchoolId`, `CorrelationId`.
- Metrikler: fetch başarısı, parser hata oranı, quarantined import, kaynağın
  yaşı, onay bekleyen eşleme, snapshot aktivasyon hatası.

## 10. Test stratejisi

### Domain birim testleri

- Yayımlanmış master sürüm değiştirilemez.
- Negatif saat reddedilir; sıfır ve artış kabul edilir.
- MEB toplamına göre sınır uygulanmaz.
- Snapshot kilitlendikten sonra değiştirilemez.
- Anlam değişikliği yeni master ders kimliği gerektirir.

### SQL Server entegrasyon testleri

- Okul/yıl için ikinci lise programı açılamaz.
- Tenant A, Tenant B'nin draft/override/snapshot verisini göremez.
- Aktivasyon tekrarında ikinci snapshot oluşmaz.
- Transaction hatasında yarım snapshot kalmaz.
- Sezon aktivasyonundan sonra yeni master sürüm sonuçları değiştirmez.

### Yeniden tabanlama testleri

- Aynı master dersteki override korunur.
- Yeni master dersi eklenir.
- Kaldırılan ders inceleme listesine gider.
- Belirsiz kimlik eşlemesi otomatik kabul edilmez.

### Parser testleri

- Aynı belge tekrarında duplicate sürüm oluşmaz.
- Aynı URL/farklı hash yeni revizyon üretir.
- Yapısal bozukluk yayınlamayı engeller.
- Temsilî gerçek MEB karar setleri golden fixture olarak doğrulanır.

### Regresyon testleri

- Ders programı üretimi kilitli snapshot saatini kullanır.
- Sıfır saatli ders üretim talebine girmez.
- Eksik saat hesabı master yerine snapshot'ı okur.

Günlük doğrulama:

```bash
./scripts/test-changed.sh
./scripts/test-changed.sh --integration
dotnet build
dotnet format
```

## 11. Teslim dilimleri

### Dilim 1 — Sürümlü master ve sezon snapshot çekirdeği

- Eğitim programı ve müfredat sürümü
- Master giriş/saat modelinin genişletilmesi
- Okul akademik programı tekilliği
- Draft, override, özel ders ve snapshot
- Sezon aktivasyonu entegrasyonu
- Ders programı saat sağlayıcısının snapshot'a geçirilmesi
- Mevcut geçici seed verisinin kontrollü migrasyonu

Bu dilim manuel/seed master veriyle çalışır; scraper'a bağımlı değildir.

### Dilim 2 — Merkez belge ve onay akışı

- Ham belge ve belge seti
- Import/staging/validasyon
- Ders eşleme önerisi ve merkez onayı
- Sürüm yayınlama, izinler ve audit

### Dilim 3 — MEB keşif ve parser

- Kategori keşfi
- PDF indirme, hash ve revizyon
- Tablo/footnote ayrıştırma
- Golden-file testleri
- Parser drift ve manuel yükleme fallback'i

### Dilim 4 — Okul yönetim API sözleşmeleri

- Eğitim programı arama/seçim
- MEB–okul fark görünümü
- Override ve özel ders yönetimi
- Yeniden tabanlama
- Aktivasyon önizlemesi ve snapshot sorguları

## 11.1 Gerçek veriyle düzeltilen varsayım (2026-09-20)

Tasarım, bir dersin bir sınıf seviyesinde **tek** satırı olacağını varsayıyordu. Gerçek MEB
çizelgesi bunu çürüttü: 2025/05 sayılı kararın Fen Lisesi çizelgesinde `BİLİŞİM TEKNOLOJİLERİ
VE YAZILIM` 9 ve 10. sınıfta hem **ortak** (2 saat) hem **seçmeli** olarak yer alıyor. İkisi
farklı şeydir — zorunlu saat ile isteğe bağlı ek saat.

Bu yüzden hem ara alanın hem master satırın tekillik anahtarı **ders türünü içerir**:

```text
ara alan : (ImportRunId, GradeLevelCode, SourceSubjectName, CourseType)
master   : (CurriculumVersionId, GradeLevelId, MasterSubjectId, CourseType)
```

Düzeltme öncesinde bu çizelge ara alana hiç giremiyordu (`500`); bkz. `TB-211`.

## 12. Başarı ölçütleri

- Aynı MEB belgesini tekrar çekmek duplicate belge veya sürüm üretmez.
- Onaysız parser çıktısı master veriye ulaşmaz.
- Okul aynı akademik yılda ikinci lise programı seçemez.
- Okul ders saatini sıfıra indirebilir ve toplam saati serbestçe değiştirebilir.
- Taslak sezon güncel master'a override kaybetmeden yeniden tabanlanabilir.
- Aktivasyon, her sınıf seviyesi için değişmez ve tenant-izole snapshot üretir.
- Aktif/geçmiş sezon sonuçları yeni master sürümden etkilenmez.
- Ders programı üretimi ve eksik saat hesapları yalnız aktif sezon snapshot'ını
  kullanır.
- Master veri yokluğu okul veya sezon kurulumunu engellemez.
- Ham onaylı belgeler ve yayımlanmış sürümler hard-delete edilmez.

## 13. Uygulama sınırları

### Her zaman

- Tenant kayıtlarında `IHasTenant`, global filter ve save interceptor kullan.
- Master yayınlarını append-only tut.
- Sezon snapshot'ını aktivasyon transaction'ında üret.
- Yeni davranışları test güdümlü geliştir.
- Günlük döngüde `./scripts/test-changed.sh` kullan.

### Önce tasarımı güncelle

- Snapshot kilitleme anını değiştirmek
- Aktif sezona master cascade eklemek
- Özel okul override serbestliğini sınırlandırmak
- Bir okul/yılda birden fazla lise programına izin vermek
- Ham belge veya yayımlanmış sürüm için hard-delete eklemek

### Asla

- Onaysız parser sonucunu master olarak yayımlama.
- Okul kullanıcısına global master veriyi değiştirme yetkisi verme.
- Aktif sezonu dinamik `CurriculumVersions.Active` sabitinden çözme.
- Tenant background işini `SchoolId` olmadan çalıştırma.
- `IgnoreQueryFilters()` ile tenant snapshot/override okumaya çalışma.

