# MEB Müfredatı — Dilim 2: Merkez Belge, Ara Alan ve Onay Akışı Uygulama Planı

**Goal:** Resmî MEB kararının ham belgesinden yayımlanmış `CurriculumVersion`'a giden merkez
yolunu kurmak: belge yükleme ve parmak izi, belge seti, içe aktarma çalışması (import run),
ara alan (staging) satırları, yapısal/semantik doğrulama, ders eşleme önerisi ve merkez onayı,
sürüm yayımlama ve denetim izi. Dilim 1'in sürümlü master modeli bu dilimde **elle üretilen
veriyle** değil, **izlenebilir bir kaynaktan** beslenir.

**Architecture:** Platform (tenant'sız) tarafta `MebSourceDocument` ham dosyayı değişmez obje
deposunda tutar; `MebDocumentSet` karar + eklerini tek hukuki kaynakta toplar. `CurriculumImportRun`
bir belge setinden üretilen ara alanın durum makinesidir. Ara alan satırları
(`CurriculumImportEntry`, `CurriculumImportHourOption`) yayımlanana kadar master'a dokunmaz;
her satır bir ders eşleme kararı (`CurriculumImportSubjectMatch`) taşır. Onaylanan çalışma tek
transaction'da `CurriculumVersion` + `CurriculumEntry` + `CurriculumHourOption` +
`CurriculumProvenance` üretir ve varsa önceki yayımlı sürümü `Superseded` yapar. Yayımlanmış
sürüm bundan sonra değiştirilemez; kural kayıt anında zorlanır.

**Tech Stack:** .NET 10 / C# 13, EF Core 10 + SQL Server 2022, MediatR, FluentValidation, Mapster,
Garage (S3 uyumlu obje deposu) + ClamAV, Hangfire, xUnit + FluentAssertions + NSubstitute + Testcontainers.

**Spec:** `docs/teknik-analizler/mufredat/meb-haftalik-ders-cizelgesi-entegrasyonu-tasarimi.md`
(onaylı, 2026-09-18) — §5.1, §6.1, §7, §8, §9, §11 "Dilim 2".
**Önceki dilim:** `docs/gecici/planlar/2026-09-18-meb-mufredat-dilim1.md` — master'da `c89c22bf`.

---

## Global Constraints

- Bu plan yalnız **Dilim 2** içindir. MEB kategori sayfası keşfi, otomatik indirme, PDF/tablo
  ayrıştırma, golden-file testleri ve parser drift **Dilim 3**'tür; okul yönetim API sözleşmeleri
  (program seçme, fark görünümü, yeniden tabanlama, aktivasyon önizlemesi) **Dilim 4**'tür.
- Kod yalnız `/Users/farukkaya/Repositories/oksis-api`; plan, rapor ve domain notu yalnız
  `/Users/farukkaya/Repositories/oksis/docs`.
- Başlangıç dalı `master` (`c89c22bf`), uygulama dalı `feat/mufredat-belge-onay`
  (worktree `.claude/worktrees/mufredat-belge-onay`).
- **Ekran yok.** Bu dilim backend uçları + Postman koleksiyonudur; platform paneli ekranları
  Dilim 4 ile birlikte planlanır (kullanıcı kararı, 2026-09-20).
- **Giriş noktası elle yüklemedir** (kullanıcı kararı, 2026-09-20): platform kullanıcısı resmî
  belgeyi yükler ve satırları **yapılandırılmış veriyle** (JSON) gönderir. Bu, tasarımın
  "manuel resmî belge yükleme aynı pipeline'ı kullanan fallback yoludur" maddesinin ta kendisidir;
  Dilim 3 yalnız aynı ara alanı parser çıktısıyla doldurur. Ara alanın şekli bu yüzden parser
  çıktısıyla birebir aynı olmalıdır — elle girişe özel alan eklenmez.
- **Yetki:** uçlar yalnız platform token'ı ister (`TenancyMode.PlatformOnly`). İzin kodları
  (`curriculum-source.fetch/review/edit`, `curriculum-version.approve/publish`) tanımlanır ve
  seed'lenir ama role eşlemesi `0019` (platform rol seti) dilimine kalır (kullanıcı kararı,
  2026-09-20). Okul kullanıcısının bu uçlara erişimi yoktur.
- **İki kişi kuralı** uygulanır: ara alanı düzelten kullanıcı aynı içe aktarmayı onaylayamaz.
  Bugün tek platform hesabı var; kural ikinci hesap açılana kadar tek kullanıcıyla denenemez ve
  bu **bilinçli** kısıttır (tasarım §7).
- Master varlıklar `IHasTenant` taşımaz; okul kullanıcısına görünmez. Tenant yolunda
  `IgnoreQueryFilters()` kullanılmaz (bu dilimde tenant yolu zaten yok).
- Bilinmeyen ders **otomatik master ders açmaz** (tasarım §9). Eşleşmeyen satır ya elle bir
  master derse bağlanır ya da içe aktarma onaylanamaz.
- Fetch/parse/validasyon hatası yayımlanmış hiçbir sürümü etkilemez. İçe aktarma idempotenttir.
- Yayımlanmış `CurriculumVersion` ve satırları update/delete edilemez.
- AutoMapper, repository wrapper, lazy loading, controller `DbContext`, `async void`, `.Result`,
  `.Wait()` kullanılmaz.
- Her davranış değişikliği kırmızı testle başlar. Günlük kapı `./scripts/test-changed.sh`;
  SQL Server entegrasyonu `--integration`; commit öncesi biçim (`dotnet format whitespace --folder`,
  göç dosyaları için betikle dosya-kapsamlı namespace).
- Her görev ayrı commit: `<type>(<scope>): türkçe açıklama`, sonda nokta yok.
- **Docker** yalnız entegrasyon/ekran testi anında açılır, iş bitince kapatılır.

### Kapsam dışı bırakılan ve gerekçesi

| Konu | Neden bu dilimde değil |
|---|---|
| `CurriculumSelectionRule` (kategori asgarisi, tekrar limiti, önkoşul, dışlama) | Tasarımın Dilim 2 listesinde yok. Kural tipleri gerçek dipnot metinleriyle karşılaşmadan tasarlanırsa uydurma olur; parser (Dilim 3) ve okul seçmeli ekranı (Dilim 4) ile birlikte gelir. **Karar:** ertelendi. |
| Saklama politikası işleri (2 yıl kullanılmamış aday, 90 gün OCR çıktısı) | Kullanılmamış aday belge ancak otomatik keşif (Dilim 3) ile birikir; elle yüklenen belge zaten onaylanmak üzere yüklenir. Metadata saklama süresiz olduğu için veri kaybı riski yok. |
| Soğuk arşiv taşıma | Aynı gerekçe; hacim Dilim 3 sonrası oluşur. |
| Ders adı benzerliğinden otomatik eşleme kabulü | Tasarım §5.2: benzerlik yalnız **öneri** üretir, nihai eşleme merkez onayı ister. |

---

## Kilitli veri sözleşmesi

### Ham belge ve belge seti

```csharp
public enum MebDocumentRole { Decision, Annex, Correction }

public sealed class MebSourceDocument : MasterEntity
{
    public string? SourceUrl { get; private set; }      // elle yüklemede null olabilir
    public string? FinalUrl { get; private set; }
    public string Sha256 { get; private set; }          // tekil
    public string MimeType { get; private set; }
    public long ByteLength { get; private set; }
    public string StorageBucket { get; private set; }
    public string StorageKey { get; private set; }
    public string OriginalFileName { get; private set; }
    public DateTimeOffset RetrievedAt { get; private set; }
    public string? ETag { get; private set; }
    public DateTimeOffset? LastModified { get; private set; }
    public VirusScanVerdict ScanVerdict { get; private set; }
    public Guid? SupersedesDocumentId { get; private set; } // aynı URL, farklı hash → revizyon
}

public sealed class MebDocumentSet : MasterEntity
{
    public string Title { get; private set; }
    public string DecisionNumber { get; private set; }
    public DateOnly? DecisionDate { get; private set; }
}

public sealed class MebDocumentSetItem : MasterEntity
{
    public Guid MebDocumentSetId { get; private set; }
    public Guid MebSourceDocumentId { get; private set; }
    public MebDocumentRole Role { get; private set; }
    public int DisplayOrder { get; private set; }
}
```

### İçe aktarma ve ara alan

```csharp
public enum CurriculumImportStatus
{
    Draft, Validated, NeedsReview, Approved, Published, Rejected, Quarantined
}

public sealed class CurriculumImportRun : MasterEntity
{
    public Guid MebDocumentSetId { get; private set; }
    public Guid EducationProgramId { get; private set; }
    public string AcademicYearCode { get; private set; }     // YYYY-YYYY
    public string SourceKind { get; private set; }           // "manual" | parser adı (Dilim 3)
    public string SourceVersion { get; private set; }        // elle girişte şema sürümü
    public string PayloadSha256 { get; private set; }        // idempotentlik anahtarı
    public CurriculumImportStatus Status { get; private set; }
    public string? ValidationSummaryJson { get; private set; }
    public string? FailureReason { get; private set; }
    public Guid? LastEditedBy { get; private set; }          // iki kişi kuralı
    public Guid? ReviewedBy { get; private set; }
    public Guid? ApprovedBy { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public Guid? PublishedCurriculumVersionId { get; private set; }
}

public sealed class CurriculumImportEntry : MasterEntity
{
    public Guid CurriculumImportRunId { get; private set; }
    public Guid? GradeLevelId { get; private set; }          // çözülemezse null → NeedsReview
    public string GradeLevelCode { get; private set; }       // kaynaktaki ham değer
    public string SourceSubjectName { get; private set; }    // kaynaktaki ham ders adı
    public string? SourceSubjectCode { get; private set; }
    public CurriculumCourseType CourseType { get; private set; }
    public int? DefaultWeeklyHours { get; private set; }     // seçenekli satırda null
    public int DisplayOrder { get; private set; }
    public int? SourcePageNumber { get; private set; }
    public string? SourceNote { get; private set; }
}

public sealed class CurriculumImportHourOption : MasterEntity
{
    public Guid CurriculumImportEntryId { get; private set; }
    public int WeeklyHours { get; private set; }             // "1 veya 2 saat" → iki satır
}

public enum SubjectMatchState { Unresolved, Suggested, Confirmed, Rejected }

public sealed class CurriculumImportSubjectMatch : MasterEntity
{
    public Guid CurriculumImportEntryId { get; private set; }
    public Guid? MasterSubjectId { get; private set; }
    public SubjectMatchState State { get; private set; }
    public int ConfidencePercent { get; private set; }       // öneri gücü; onay değildir
    public string MatchReason { get; private set; }          // "code" | "exact-name" | "normalized-name" | "manual"
    public Guid? DecidedBy { get; private set; }
    public DateTimeOffset? DecidedAt { get; private set; }
}
```

### Yayımlanan tarafa eklenenler

```csharp
public sealed class CurriculumHourOption : MasterEntity
{
    public Guid CurriculumEntryId { get; private set; }
    public int WeeklyHours { get; private set; }
}

public sealed class CurriculumProvenance : MasterEntity
{
    public Guid CurriculumEntryId { get; private set; }
    public Guid MebSourceDocumentId { get; private set; }
    public int? PageNumber { get; private set; }
    public string? SourceText { get; private set; }
}
```

`CurriculumVersion.SourceDocumentSetId` Dilim 1'de nullable skalerdi; bu dilimde
`MebDocumentSet`'e **gerçek FK** olur (hâlâ nullable: seed'den gelen uyumluluk sürümlerinin
belge seti yoktur ve uydurulmaz).

### Elle giriş sözleşmesi (parser çıktısıyla aynı şekil)

```jsonc
{
  "schemaVersion": "1.0",
  "educationProgramCode": "MIDDLE-GENERAL",
  "academicYearCode": "2026-2027",
  "entries": [
    {
      "gradeLevelCode": "5",
      "subjectName": "Matematik",
      "subjectCode": null,
      "courseType": "Common",
      "weeklyHours": 5,
      "hourOptions": [],
      "pageNumber": 3,
      "note": null
    },
    {
      "gradeLevelCode": "5",
      "subjectName": "Seçmeli Bilişim",
      "courseType": "Elective",
      "weeklyHours": null,
      "hourOptions": [1, 2],
      "pageNumber": 4,
      "note": "1 veya 2 saat"
    }
  ]
}
```

---

## Dosya haritası

### Yeni — Domain (`src/Oksis.Domain/Modules/Academics/`)

- `Enums/MebDocumentRole.cs`, `Enums/CurriculumImportStatus.cs`, `Enums/SubjectMatchState.cs`
- `Entities/MebSourceDocument.cs`, `Entities/MebDocumentSet.cs`, `Entities/MebDocumentSetItem.cs`
- `Entities/CurriculumImportRun.cs`, `Entities/CurriculumImportEntry.cs`,
  `Entities/CurriculumImportHourOption.cs`, `Entities/CurriculumImportSubjectMatch.cs`
- `Entities/CurriculumHourOption.cs`, `Entities/CurriculumProvenance.cs`

### Yeni — Application (`src/Oksis.Application/Modules/Academics/CurriculumSource/`)

- `Abstractions/ICurriculumSourceStorage.cs` (platform kovası + yükleme/indirme)
- `Abstractions/ISubjectMatchSuggester.cs`
- `Commands/UploadSourceDocument/`, `Commands/CreateDocumentSet/`, `Commands/AttachDocumentToSet/`
- `Commands/StartImportRun/` (belge seti + yapılandırılmış satırlar → ara alan)
- `Commands/UpdateImportEntry/`, `Commands/ResolveSubjectMatch/`
- `Commands/ReviewImportRun/` (NeedsReview → Approved | Rejected | Quarantined)
- `Commands/PublishImportRun/`
- `Queries/GetImportRun/`, `Queries/ListImportRuns/`, `Queries/GetImportRunDiff/`
  (yayımlıya göre fark: eklenen / değişen / kalkan satır)
- `Internal/CurriculumImportValidator.cs` (yapısal + semantik kurallar)

### Yeni — Infrastructure

- `Academics/CurriculumSourceStorage.cs` (Garage; platform kovası `oksis-platform`)
- `Academics/SubjectMatchSuggester.cs` (kod → tam ad → normalize ad)
- `Persistence/Configurations/Academics/*` (10 yeni configuration)
- `Persistence/Interceptors/PublishedCurriculumImmutabilityInterceptor.cs`
- `Persistence/Migrations/*_20260920_curriculum_source_pipeline.cs`

### Yeni — API

- `Controllers/V1/PlatformCurriculumSourcesController.cs` (belge + belge seti)
- `Controllers/V1/PlatformCurriculumImportsController.cs` (import, inceleme, onay, yayım)

### Değişecek

- `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs`,
  `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs`,
  `src/Oksis.Infrastructure/DependencyInjection.cs`
- `src/Oksis.Domain/Modules/Academics/Entities/CurriculumVersion.cs` (belge seti FK'sı, yayım kuralı)
- `src/Oksis.Infrastructure/Persistence/Seed/MasterData/PermissionSeedData.cs`,
  `MasterSeedIds.cs` (beş yeni izin kodu)
- `src/Oksis.Api/Extensions/ResultExtensions.cs` (yeni hata kodları → HTTP)
- `src/Oksis.Application/Modules/Documents/Abstractions/IBucketNameProvider.cs`
  (platform kovası adı; okul kovası kalıbına dokunulmaz)

---

## Task 0: Başlangıç güvenlik ağı

- [x] **Step 1: Dilim 1 master'a birleşti** — `c89c22bf`; derleme 0 hata/0 uyarı, birim paketleri
      1166 / 2901 / 450 / 34 yeşil (2026-09-20).
- [x] **Step 2: Dal ve worktree** — `feat/mufredat-belge-onay`,
      `.claude/worktrees/mufredat-belge-onay`.
- [ ] **Step 3: Kapıyı ölç**

```bash
./scripts/test-changed.sh --all
git status --short
```

Expected: yeşil; testlerin bıraktığı tracked değişiklik yok.

---

## Task 1: Belge ve belge seti domain modeli

**Files:** `MebSourceDocument`, `MebDocumentSet`, `MebDocumentSetItem`, `MebDocumentRole`;
Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/MebSourceDocumentTests.cs`,
`MebDocumentSetTests.cs`.

**Interfaces:**
- `MebSourceDocument.CreateUploaded(Guid id, string sha256, string mimeType, long byteLength, string bucket, string key, string originalFileName, DateTimeOffset retrievedAt, VirusScanVerdict verdict, string? sourceUrl)`
- `MebSourceDocument.MarkRevisionOf(Guid previousDocumentId)` — aynı kaynak URL, farklı hash.
- `MebDocumentSet.Create(Guid id, string title, string decisionNumber, DateOnly? decisionDate)`
- `MebDocumentSetItem.Create(Guid id, Guid setId, Guid documentId, MebDocumentRole role, int displayOrder)`

- [ ] **Step 1: Kırmızı testler** — hash/mime/boyut boş olamaz; `ByteLength > 0`; enfekte belge
      (`VirusScanVerdict.Infected`) **oluşturulamaz** (istisna); karar numarası boş olamaz;
      bir sette aynı belge iki kez yer alamaz (domain tarafında `DisplayOrder` tekilliği testte,
      veritabanı tekilliği Task 3'te); revizyon kendine bağlanamaz.
- [ ] **Step 2: Minimum modeli uygula.**
- [ ] **Step 3: Yeşile getir + commit** — `feat(academics): MEB kaynak belgesi ve belge seti modeli`

---

## Task 2: İçe aktarma ve ara alan domain modeli

**Files:** `CurriculumImportRun`, `CurriculumImportEntry`, `CurriculumImportHourOption`,
`CurriculumImportSubjectMatch`, `CurriculumImportStatus`, `SubjectMatchState`;
Test: `CurriculumImportRunTests.cs`, `CurriculumImportEntryTests.cs`, `CurriculumImportSubjectMatchTests.cs`.

**Durum makinesi (tasarım §5.1):**

```text
Draft → Validated → NeedsReview → Approved → Published
   ↘ Quarantined        ↘ Rejected
```

**Kurallar:**
- `Draft → Validated` yalnız doğrulama hatasızsa; hata varsa `NeedsReview`, semantik bütünlük
  kırıksa `Quarantined`.
- `Approved` yalnız `Validated` veya `NeedsReview`'dan; çözülmemiş (`Unresolved`) eşleme varsa
  reddedilir.
- **İki kişi kuralı:** `ApprovedBy != LastEditedBy` — aksi hâlde `CURRICULUM_IMPORT_SAME_ACTOR`.
- `Published` terminaldir; `PublishedCurriculumVersionId` zorunlu olur.
- `Rejected` ve `Quarantined` terminaldir; gerekçe (`FailureReason`) zorunludur.
- Satır: haftalık saat ya tek değer ya da **en az iki** seçenek; ikisi birden ya da ikisi birden
  boş olamaz. Saat `> 0` (0 okul kararıdır, MEB satırı değildir — Dilim 1 kuralı).
- Eşleme `Confirmed` ise `MasterSubjectId` zorunlu; `Rejected`/`Unresolved` ise null.

- [ ] **Step 1: Kırmızı testler** (her geçiş, her ret, iki kişi kuralı, saat/seçenek ikilemi).
- [ ] **Step 2: Uygula.**
- [ ] **Step 3: Commit** — `feat(academics): müfredat içe aktarma ve ara alan modeli`

---

## Task 3: EF modeli, master kısıtları ve göç

**Files:** 10 configuration, `IApplicationDbContext`, `OksisDbContext`, migration;
Test: `tests/Oksis.Tests/Architecture/CurriculumSourceModelGuardTests.cs`,
`tests/Oksis.Infrastructure.IntegrationTests/Persistence/CurriculumSourceSchemaTests.cs`.

| Tablo | Şema | Zorunlu tekillik |
|---|---|---|
| `meb_source_documents` | `master` | `sha256` |
| `meb_document_sets` | `master` | `(decision_number, title)` |
| `meb_document_set_items` | `master` | `(meb_document_set_id, meb_source_document_id)` |
| `curriculum_import_runs` | `master` | `(meb_document_set_id, education_program_id, academic_year_code, payload_sha256)` |
| `curriculum_import_entries` | `master` | `(curriculum_import_run_id, grade_level_code, source_subject_name)` |
| `curriculum_import_hour_options` | `master` | `(curriculum_import_entry_id, weekly_hours)` |
| `curriculum_import_subject_matches` | `master` | `curriculum_import_entry_id` (bire bir) |
| `curriculum_hour_options` | `master` | `(curriculum_entry_id, weekly_hours)` |
| `curriculum_provenances` | `master` | `(curriculum_entry_id, meb_source_document_id)` |

- Soft-delete taşıyan tablolarda unique indeksler `is_deleted = 0` filtresi taşır.
- FK'ler `Restrict`; ara alan satırları çalışmaya `Cascade` **değildir** (silme yolu yok).
- `CurriculumVersion.SourceDocumentSetId` → `meb_document_sets` FK (nullable, `Restrict`).
- **Model bekçisi:** bu dilimdeki hiçbir varlık `IHasTenant` taşımaz; hepsi `master` şemasında.

- [ ] **Step 1: Bekçi testini kırmızı yaz** (tablo/şema adı, indeks sırası ve filtresi,
      tenant taşımama, `SourceDocumentSetId` artık FK).
- [ ] **Step 2: Configuration + DbSet'ler.**
- [ ] **Step 3: İzin kodlarını seed'le** — `curriculum-source.fetch`, `curriculum-source.review`,
      `curriculum-source.edit`, `curriculum-version.approve`, `curriculum-version.publish`.
      Role eşlemesi **yok** (0019'a kalıyor); seed bunu yorumla söyler.
- [ ] **Step 4: Göç üret ve incele** — yalnız yeni tablolar + izin satırları + tek FK;
      mevcut tabloya veri taşıma yok. `MigrationsMatchModelTests` yeşil.
- [ ] **Step 5: Commit** — `feat(academics): müfredat kaynak hattı tablolarını yapılandır`

---

## Task 4: Belge yükleme, parmak izi ve virüs taraması

**Files:** `ICurriculumSourceStorage`, `CurriculumSourceStorage`, `UploadSourceDocument*`,
`CreateDocumentSet*`, `AttachDocumentToSet*`, `PlatformCurriculumSourcesController`,
`IBucketNameProvider` (platform kovası);
Test: `tests/Oksis.Application.UnitTests/Modules/Academics/UploadSourceDocumentCommandHandlerTests.cs`,
`tests/Oksis.Infrastructure.IntegrationTests/Academics/CurriculumSourceStorageTests.cs`.

**Uçlar:**

```text
POST /api/v1/platform/curriculum-sources/documents      (multipart; pdf|docx|xlsx)
GET  /api/v1/platform/curriculum-sources/documents/{id}/download   (presigned URL)
POST /api/v1/platform/curriculum-sources/sets
POST /api/v1/platform/curriculum-sources/sets/{id}/documents
```

**Kurallar:**
- İzin verilen MIME listesi ve üst boyut sınırı yapılandırmadan gelir; ihlal `400`.
- Akış **önce taranır** (ClamAV), enfekte dosya depoya yazılmaz → `CURRICULUM_SOURCE_INFECTED` (422).
- Hash aynıysa **yeni kayıt açılmaz**, var olan belge döner (idempotent, `200`).
- Aynı `SourceUrl` farklı hash döndürürse yeni belge + `SupersedesDocumentId` (revizyon).
- Dosya platform kovasında (`oksis-platform`, okul kovalarından ayrı) değişmez anahtarla saklanır:
  `meb/{sha256[0..1]}/{sha256}{uzantı}`.
- Belge silme ucu **yoktur** (saklama süresiz).

- [ ] **Step 1: Kırmızı testler** — idempotent hash, revizyon, enfekte reddi, MIME/boyut kapısı,
      okul token'ıyla 403, platform token'ıyla 200.
- [ ] **Step 2: Depolama uygulaması** (Garage; okul kovası kalıbına dokunma).
- [ ] **Step 3: Uçlar + denetim kaydı** (`IAuditLogger`: yükleme, sete ekleme).
- [ ] **Step 4: Testleri yeşile getir** (entegrasyon: gerçek Garage + ClamAV konteynerleri).
- [ ] **Step 5: Commit** — `feat(academics): MEB belgesi yükleme ve belge seti uçları`

---

## Task 5: İçe aktarma çalışması ve doğrulama

**Files:** `StartImportRun*`, `CurriculumImportValidator`, `GetImportRun*`, `ListImportRuns*`,
`PlatformCurriculumImportsController`;
Test: `CurriculumImportValidatorTests.cs`, `StartImportRunCommandHandlerTests.cs`,
`tests/Oksis.Infrastructure.IntegrationTests/Academics/CurriculumImportPipelineTests.cs`.

**Uç:**

```text
POST /api/v1/platform/curriculum-imports        { documentSetId, payload }   → runId + durum
GET  /api/v1/platform/curriculum-imports/{id}
GET  /api/v1/platform/curriculum-imports
```

**Doğrulamalar (yapısal):** şema sürümü tanınır; eğitim programı kodu ve akademik yıl biçimi
(`YYYY-YYYY`) geçerli; sınıf seviyesi kodu master listede; aynı (seviye, ders adı) iki kez yok;
saat ya tek değer ya da ≥2 seçenek; saat `> 0`.

**Doğrulamalar (semantik):** her seviyenin toplam zorunlu saati makul aralıkta (alt sınır
uyarıdır, üst sınır yoktur); seçmeli satır saat seçeneği taşıyabilir; aynı belge seti + program +
yıl için yayımlanmış sürüm varsa fark özeti üretilir (yeni/değişen/kalkan satır sayısı).

**Sonuç durumu:** hatasız → `Validated`; çözülemeyen ders/seviye ya da uyarı → `NeedsReview`;
yapısal bütünlük kırık (ör. hiç satır yok, seviye kodu tanınmıyor) → `Quarantined` + gerekçe.

- [ ] **Step 1: Kırmızı testler** (her doğrulama kuralı + durum sonucu + idempotentlik:
      aynı payload hash'i ikinci kez → aynı `runId`, yeni satır yok).
- [ ] **Step 2: Ara alan yazımı + doğrulama.**
- [ ] **Step 3: Uçlar; `GetImportRun` satırları ve doğrulama özetini döner.**
- [ ] **Step 4: Commit** — `feat(academics): içe aktarma çalışması ve doğrulama hattı`

---

## Task 6: Ders eşleme önerisi ve merkez kararı

**Files:** `ISubjectMatchSuggester`, `SubjectMatchSuggester`, `ResolveSubjectMatch*`,
`UpdateImportEntry*`;
Test: `SubjectMatchSuggesterTests.cs`, `ResolveSubjectMatchCommandHandlerTests.cs`.

**Öneri sırası:** (1) kaynak ders kodu master koda birebir eşit → `ConfidencePercent = 100`,
`MatchReason = "code"`; (2) ad birebir (büyük/küçük ve boşluk normalize) → 90, `"exact-name"`;
(3) Türkçe normalize edilmiş ad (aksan, "ve/ile", parantezli ek) → 60, `"normalized-name"`;
(4) yoksa `Unresolved`.

**Kurallar:**
- Öneri hiçbir zaman kendiliğinden `Confirmed` olmaz; 100 güven bile merkez onayı ister.
- `ResolveSubjectMatch` bir satırı `Confirmed` (master ders kimliğiyle) ya da `Rejected` yapar;
  `Rejected` satır yayımda **atlanır** ve fark özetinde görünür.
- Bilinmeyen ders master katalog açmaz; `Confirmed` yalnız var olan `MasterSubject`'e bağlanır.
- Eşleme ya da satır düzenleyen kullanıcı `LastEditedBy` olarak yazılır (iki kişi kuralının girdisi).

- [ ] **Step 1: Kırmızı testler** — dört öneri yolu, otomatik onay olmadığı, bilinmeyen dersin
      master açmadığı, `LastEditedBy`'ın düştüğü.
- [ ] **Step 2: Uygula + uçlar** (`PATCH .../entries/{entryId}`, `POST .../entries/{entryId}/match`).
- [ ] **Step 3: Commit** — `feat(academics): ders eşleme önerisi ve merkez kararı`

---

## Task 7: İnceleme, onay ve yayımlama

**Files:** `ReviewImportRun*`, `PublishImportRun*`,
`PublishedCurriculumImmutabilityInterceptor`, `CurriculumVersion` (yayım kuralı);
Test: `ReviewImportRunCommandHandlerTests.cs`, `PublishImportRunCommandHandlerTests.cs`,
`tests/Oksis.Infrastructure.IntegrationTests/Academics/CurriculumPublishTests.cs`,
`CurriculumPublishedImmutabilityTests.cs`.

**Uçlar:**

```text
POST /api/v1/platform/curriculum-imports/{id}/review    { decision: approve|reject|quarantine, reason? }
POST /api/v1/platform/curriculum-imports/{id}/publish
```

**Yayımlama tek transaction'da:**
1. `CurriculumVersion` (Draft) üretilir: program, akademik yıl, karar künyesi (belge setinden),
   `SourceDocumentSetId`, varsa `SupersedesVersionId`.
2. `Confirmed` satırlardan `CurriculumEntry` + `CurriculumHourOption` yazılır.
3. Her satır için `CurriculumProvenance` (belge, sayfa, kaynak metin) yazılır.
4. Sürüm `Publish(now, actor)` edilir; aynı (program, yıl) için önceki yayımlı sürüm varsa
   `Supersede()` edilir.
5. `CurriculumImportRun` `Published` olur ve sürüm kimliğini taşır.

**Kurallar:**
- Onaysız (`Approved` olmayan) çalışma yayımlanamaz → `CURRICULUM_IMPORT_NOT_APPROVED` (409).
- Aynı çalışma iki kez yayımlanamaz (idempotent: ikinci çağrı var olan sürümü döner).
- Yayımlanmış sürüm ve satırları `Modified`/`Deleted` olamaz — interceptor, snapshot
  değişmezliğiyle aynı kalıpta ve `SoftDeleteInterceptor`'dan önce çalışır.
- Yayım, çalışan okulların hazırlıktaki taslaklarını **kendiliğinden değiştirmez**; taslak yeniden
  tabanlama Dilim 4'tür. Başlamış sezonlar zaten snapshot okur (Dilim 1, karar 0021).

- [ ] **Step 1: Kırmızı testler** — onay kapısı, iki kişi kuralı, idempotent yayım,
      supersede zinciri, provenance satırları, değişmezlik (update + delete ayrı ayrı).
- [ ] **Step 2: Uygula** (interceptor DI + test fixture zincirine ekleme dahil).
- [ ] **Step 3: SQL Server'da uçtan uca** — belge yükle → set → import → eşleme → onay → yayım;
      sonuçta yeni sürüm bir okulun **yeni** sezon taslağına taban olur (Dilim 1 bootstrap'i).
- [ ] **Step 4: Commit** — `feat(academics): içe aktarma onayı ve sürüm yayımlama`

---

## Task 8: Hata sözleşmesi, denetim izi ve Postman

**Files:** `ResultExtensions` (kod → HTTP), `PlatformErrorCodes` benzeri sabit listesi,
`IAuditLogger` çağrıları; `oksis/docs/postman/mufredat/` (yeni koleksiyon + curl referansı).

| Kod | HTTP | Anlam |
|---|---|---|
| `CURRICULUM_SOURCE_INFECTED` | 422 | Virüs taraması temiz değil |
| `CURRICULUM_SOURCE_UNSUPPORTED_TYPE` | 400 | MIME/boyut kapısı |
| `CURRICULUM_IMPORT_PAYLOAD_INVALID` | 400 | Şema/yapısal doğrulama |
| `CURRICULUM_IMPORT_UNRESOLVED_SUBJECT` | 409 | Çözülmemiş eşleme varken onay |
| `CURRICULUM_IMPORT_SAME_ACTOR` | 409 | İki kişi kuralı |
| `CURRICULUM_IMPORT_NOT_APPROVED` | 409 | Onaysız yayım denemesi |
| `CURRICULUM_IMPORT_TERMINAL` | 409 | Terminal durumda düzenleme/geçiş |
| `CURRICULUM_VERSION_IMMUTABLE` | 409 | Yayımlanmış sürümü değiştirme |

- [ ] **Step 1: Eşleme testleri** (`ResultExtensionsCurriculumSourceTests`).
- [ ] **Step 2: Denetim izi** — yükleme, ara alan düzenleme, eşleme kararı, onay, ret, yayım;
      her kayıt `ImportRunId` ve aktörü taşır.
- [ ] **Step 3: Postman koleksiyonu** — uçtan uca sıra (belge → set → import → eşleme → onay →
      yayım) ve örnek payload.
- [ ] **Step 4: Commit** — `feat(academics): müfredat kaynak hattı hata sözleşmesi ve denetim izi`

---

## Task 9: Tam doğrulama, domain haritası ve teslim

- [ ] **Step 1: Statik tarama** — `TODO|TBD|PLACEHOLDER|NotImplementedException` yok.
- [ ] **Step 2: Kapılar** — `./scripts/test-changed.sh`, `--integration` (Docker açık),
      `dotnet build` 0 uyarı. Entegrasyon paketindeki bilinen `TB-203` kırmızıları ayrılır;
      yeni kırmızı olmamalı.
- [ ] **Step 3: İdempotent göç betiği** üret ve `XACT_ABORT`/denetim kalıbını doğrula
      (Dilim 1'de ölçülen tuzak; bu dilimde veri taşıma yok ama betik yine incelenir).
- [ ] **Step 4: `domain-map` skill'iyle domain notları** — `Müfredat Sürümü` notuna kaynak/onay
      zinciri, yeni `MEB Kaynak Belgesi` ve `Müfredat İçe Aktarma` kavramları, `Müfredat` modül
      notunun akışları, karar notu `0022-mufredat-yayimi-iki-kisi-kurali` (gerekirse).
- [ ] **Step 5: Bulgu defteri** — bu dilimde açılan bulgular; `E-16` ancak gerçek TTKB verisi
      yayımlandığında kapanır, bu dilim onu kapatmaz.
- [ ] **Step 6: Belge commit'i** (`oksis`), **Step 7: kod commit kontrolü** (`oksis-api`).

---

## Kabul matrisi

| Kabul ölçütü | Kanıt |
|---|---|
| Aynı dosya iki kez yüklenince tek belge | `UploadSourceDocument` idempotent testi |
| Enfekte dosya depoya yazılmaz | ClamAV entegrasyon testi |
| Aynı URL farklı hash → revizyon | belge revizyon testi |
| Aynı payload iki kez → tek çalışma | `StartImportRun` idempotent testi |
| Bilinmeyen ders master katalog açmaz | eşleme testi |
| Otomatik eşleme onay yerine geçmez | öneri testi (100 güven bile `Suggested`) |
| Çözülmemiş eşleme varken onay yok | `ReviewImportRun` testi |
| Düzelten onaylayamaz | iki kişi kuralı testi |
| Onaysız yayım yok | `PublishImportRun` testi |
| Yayım idempotent | ikinci çağrı aynı sürümü döner |
| Yayımlanmış sürüm değişmez | immutability interceptor entegrasyon testi |
| Önceki sürüm `Superseded` olur | yayım zinciri testi |
| Her satır kaynağa bağlı | provenance testi |
| Okul kullanıcısı erişemez | 403 testi |
| Yayım başlamış sezonu değiştirmez | Dilim 1 regresyonu (`CurriculumSnapshotActivationTests`) |

## Plan öz-denetimi

- [x] Kapsam yalnız Dilim 2; keşif/parser (Dilim 3) ve okul yüzeyi (Dilim 4) dışarıda.
- [x] Ara alanın şekli parser çıktısıyla aynı; elle girişe özel alan yok.
- [x] Master varlıklar tenant taşımıyor; okul yoluna hiç dokunulmuyor.
- [x] Bilinmeyen ders ve düşük güven master veri üretmiyor.
- [x] İki kişi kuralı ve tek platform hesabı kısıtı açıkça yazıldı.
- [x] `CurriculumSelectionRule` ertelendi ve gerekçesi kayda geçti.
- [x] Yayımlanmış sürümün değişmezliği kayıt anında zorlanıyor.
- [x] Kod dosyalarında `TODO`/sahte implementasyon bırakılmayacak.
