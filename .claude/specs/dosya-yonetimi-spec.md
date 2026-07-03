# Dosya Yönetimi Altyapısı (Documents Modülü) — Bağlayıcı Spec

> **Durum:** Onaylı — bağlayıcı anlaşma (`bağlayıcı anlaşma`)
> **Tarih:** 2026-07-03
> **Kaynak:** `dosya_yonetimi_analiz.docx` v1.1 (Temmuz 2026, "OKSİS Teknik Analiz Belge Standardı v1.0") — bu spec, docx'in normatif içeriğinin repo'ya uyarlanmış kanonik hâlidir; çelişkide **bu dosya** geçerlidir.
> **Kapsam:** OKSİS genelinde tüm modüllerin kullanacağı merkezi dosya yönetimi altyapısı: `IStorageService` + capability modeli, Garage (S3-uyumlu) depolama, tenant-başına-bucket, `StoredFile`/`FileAttachment` domain modeli, `FileCategoryPolicy` kayıt defteri, proxy + presigned iki-fazlı yükleme, virüs tarama, kota, KVKK saklama/imha, Hangfire job'ları.
> **Kapsam dışı:** FTP adapter implementasyonu (capability modeli hazır), deduplication (MVP kapalı), canlı muhasebe/harici konnektörler.

---

## 1. Karar Kaydı

### 1.1 Analiz Kararları (docx K1–K6 — onaylı, tartışmaya kapalı)

| # | Karar | Seçim | Gerekçe (özet) |
|---|-------|-------|----------------|
| K1 | Bucket stratejisi | Okul (tenant) başına bucket: `oksis-t{SchoolId}` | KVKK imha taahhüdü tek bucket-delete ile kanıtlanır; izolasyon fiziksel katmana iner. Bucket adı SchoolId'ye bağlanır (slug DEĞİL — rename yoktur). Onboarding'e idempotent provisioning adımı eklenir. |
| K2 | Deduplication | MVP'de KAPALI; SHA-256 checksum her dosyada saklanır | Attachment modeli "aynı dosya çok yerde" senaryosunu çözer. Dedup, silmeyi referans-sayacı problemine çevirir. Checksum sayesinde karar geri dönüşlüdür. |
| K3 | Proxy / presigned eşiği | 25 MB + kategori bazlı `ForcePresigned` override | Ödev/evrak dünyasının ~%95'i proxy'de kalır; sanal kitap gibi büyük dosyalar her zaman presigned. Eşik `FileCategoryPolicy` ile kategori bazında ezilebilir. |
| K4 | Garage public endpoint | MVP'de açılır: `files.*` subdomain + TLS | Presigned mimarinin ön koşulu. Byte trafiği istemci–Garage arasında doğrudan akar; oksis-api yalnızca orkestrasyon yapar. (Prod kurulumu = Açık İş, bkz. §11.) |
| K5 | Servis topolojisi | Documents = oksis-api içinde izole vertical slice | Ayrı document-api dağıtık transaction, yetki replikasyonu ve çift altyapı maliyeti getirir. Modüler monolith korunur; ayrışma opsiyonu bedelsiz elde tutulur. |
| K6 | FTP | Capability modeli MVP'de; `FtpStorageService` talep doğunca | Interface sözleşmesi bugün esnek kurulmazsa ileride kırılır. Adapter ise gerçek trafik olmadan olgunlaşamayan ölü kod olur. |

### 1.2 Kapsam Kararları (brainstorm 2026-07-03 — bağlayıcı)

| # | Karar | Seçim | Gerekçe |
|---|-------|-------|---------|
| B1 | "Sıfır borç" tanımı | **Kod-tarafı sıfır borç:** dokümandaki backend + web tasarımı eksiksiz + eski `IFileStorageService`/`FileStorageService` göçü ve silinmesi + testler. Dış bağımlılıklar (§11) kodla kapanamaz; spec'te "Açık İş" olarak izlenir. | Hukuk teyidi, prod DevOps ve Payments bağı ekibin kod yazarak kapatabileceği kalemler değil. |
| B2 | İlk canlı tüketici | Yalnız **SchoolLogo** (proxy mod). Homework/Announcements Application katmanında boş (backend yok), Kulüp/Sınav/SanalKitap modülleri yok — bağlanamaz. | 6 kategorinin tamamı registry'de tanımlanır; tüketicisi gelen kategori o gün bağlanır (YAGNI, borç değil sıralama). |
| B3 | Presigned/multipart güvencesi | Altyapı (initiate/confirm, multipart, tüm job'lar) **eksiksiz yazılır** ve dev Garage üzerinde **entegrasyon testleriyle uçtan uca doğrulanır**. Canlı tüketicisi ilk büyük-dosya özelliğiyle gelir. | Kod borçsuz; tüketici eksikliği borç değildir. K3/K4 kararlarına sadık kalınır. |
| B4 | Mobile kapsamı | **Ertelendi** — `oksis-mobile` shared/files katmanı bu işte YAZILMAZ; dosya kullanan ilk mobile özellikle birlikte gelir. §6 tasarımı o gün için referanstır. | Mobile'da tüketici ekran yok; K6 gerekçesiyle tutarlı (tüketicisiz katman = ölü kod riski). |

### 1.3 Temel İlkeler (KURAL blokları)

1. **Fiziksel depolama, mantıksal hiyerarşi değildir.** Klasör hiyerarşisi (okul > sezon > modül > öğrenci) fiziksel dosya yoluna GÖMÜLMEZ. Veritabanı gerçeğin kaynağıdır; object storage yalnızca byte deposudur. Entity taşıma tek UPDATE'tir; kullanıcıya gösterilecek klasör ağacı tamamen sanaldır ve DB'den render edilir.
2. **Documents dışında hiçbir modül `IStorageService` göremez.** Tüm modüller dosya işlemlerini yalnızca Documents modülünün MediatR komut/sorguları üzerinden yapar (`AttachFileCommand`, `GetFileDownloadUrlQuery` vb.). Doğrudan `IStorageService` enjeksiyonu mimari ihlaldir ve code review'da reddedilir.
3. **Documents, oksis-api içinde izole dikey dilimdir; ayrı servis DEĞİLDİR.** İki-fazlı upload'ın confirm adımı iş verisiyle aynı transaction'da yazılır. Byte trafiği `files.*` subdomain'inden Garage üzerinden akar; ayrı bir document-api uygulaması MVP'de kurulmaz.
4. **Application katmanı AWSSDK.S3 bilmez.** `IStorageService` ve ilişkili record'lar Application katmanındadır; `AWSSDK.S3` referansı yalnızca `Oksis.Infrastructure` projesindedir.

### 1.4 Onaylı Tech Stack

| Katman | Teknoloji | Not |
|--------|-----------|-----|
| Object Storage | Garage (S3-uyumlu, self-host) | MinIO community budandı — kullanılmaz. Geçiş: endpoint + credential değişikliği. |
| SDK | AWSSDK.S3 | Tek `S3CompatibleStorageService` tüm S3-uyumlu sağlayıcıları kapsar. |
| Backend | .NET 10, EF Core (yazma), Dapper (ağır okuma) | CQRS + MediatR + FluentValidation + Mapster. |
| Arka plan | Hangfire | Virüs tarama, orphan temizlik, purge, retention, thumbnail. |
| Tarama | ClamAV (container) | Upload sonrası asenkron; Clean olmadan indirme yok. |
| Cache | Redis | Kota sayaçları + `[Cacheable]` sorgular (tenant-prefixli key). |
| Web | React + TS strict, TanStack Query v5, RHF + Zod | `FileUpload` paylaşılan komponenti (component-rules.md §17 uyumlu). |
| Mobile | Expo SDK 54, expo-file-system, NativeWind v4 | **B4 gereği ertelendi** — ilk mobile tüketiciyle. |

---

## 2. Domain Modeli

### 2.1 Entity: StoredFile

Fiziksel dosyanın kaydı. Dosyanın kendisi ile dosyanın bir entity'ye bağlanması ayrı kavramlardır; `StoredFile` yalnızca birincisini temsil eder.

| Alan | Tanım |
|------|-------|
| Id | GUID, PK (strongly-typed ID: `record struct StoredFileId(Guid)`) |
| SchoolId | GUID, FK — tenant (`IHasTenant` + Global Query Filter) |
| AcademicYearId | GUID, FK — sezon hard partition; key prefix ile aynı |
| StorageProvider | enum `StorageProviderType` — sağlayıcı geçişinde eski kayıtlar eski sağlayıcıdan okunur |
| Bucket | nvarchar(63) — `oksis-t{SchoolId}` |
| ObjectKey | nvarchar(512) — iş anlamı taşımayan deterministik anahtar |
| OriginalFileName | nvarchar(255) — indirmede `Content-Disposition` ile geri verilir; **asla key olmaz** |
| ContentType | nvarchar(127) |
| SizeBytes | bigint |
| Sha256Checksum | char(64) — bütünlük doğrulama; dedup için rezerv (K2) |
| Category | nvarchar(64) — `FileCategoryPolicy` anahtarı |
| Status | enum `FileStatus` |
| VirusScanStatus | enum `VirusScanStatus` |
| Audit | CreatedAt/By, UpdatedAt/By, DeletedAt/By, IsDeleted — proje standardı (soft delete) |

### 2.2 Entity: FileAttachment

Dosya ile iş entity'si arasındaki bağ. Aynı sanal kitap 12 şubeye bağlanabilir: tek `StoredFile`, 12 `FileAttachment`. Versiyonlu teslimde `Version` alanı kullanılır; eski dosya silinmez.

| Alan | Tanım |
|------|-------|
| Id | GUID, PK |
| SchoolId | GUID, FK — tenant |
| StoredFileId | GUID, FK → StoredFiles |
| EntityType | nvarchar(64) — "Assignment", "Exam", "Announcement", "Club", "Branch"… |
| EntityId | GUID — polimorfik hedef |
| Version | int, default 1 — ödev yeniden teslimi vb. |
| DisplayOrder | int |
| Description | nvarchar(500), null |
| Audit | Standart audit + soft delete alanları |

### 2.3 Enum'lar

| Enum | Değerler | Açıklama |
|------|----------|----------|
| FileStatus | 1 PendingUpload, 2 Active, 3 Quarantined, 4 SoftDeleted | PendingUpload: initiate edildi, confirm bekliyor (24s sonra orphan temizliği). Quarantined: tarama Pending/Infected iken indirme kapalı. |
| VirusScanStatus | 1 Pending, 2 Clean, 3 Infected, 4 Skipped | Skipped yalnızca `RequiresVirusScan=false` kategoriler için. |
| StorageProviderType | 1 S3Compatible, 2 Ftp | Ftp rezervedir (K6); MVP'de yalnızca S3Compatible aktif. |

### 2.4 FileCategoryPolicy Kayıt Defteri

Her kullanım senaryosunun kuralları koda dağıtılmaz; tek registry'de yaşar. FluentValidation ve upload orchestration bu kayıttan beslenir. Yeni bir modül dosya kullanmak istediğinde tek yaptığı şey yeni kategori tanımlamaktır.

```csharp
public sealed record FileCategoryPolicy(
    string Category,              // "AssignmentSubmission", "VirtualBook"...
    string[] AllowedExtensions,
    string[] AllowedContentTypes,
    long MaxSizeBytes,
    bool RequiresVirusScan,
    bool ForcePresigned,          // eşik ne olursa olsun presigned (K3)
    bool AllowMultipart,
    TimeSpan? RetentionPeriod);   // KVKK saklama süresi — null = sezon politikası
```

| Kategori | Uzantılar | Max | Tarama | Mod | Retention |
|----------|-----------|-----|--------|-----|-----------|
| AssignmentSubmission | pdf, docx, jpg, png | 20 MB | Evet | Proxy | Sezon + 1 yıl |
| ExamDocument | pdf | 50 MB | Evet | Eşik (25MB) | Sezon + 2 yıl |
| VirtualBook | pdf, epub | 500 MB | Evet | ForcePresigned + multipart | Sözleşme süresi |
| SchoolLogo | png, svg | 2 MB | Evet (svg riski) | Proxy | Süresiz |
| ClubDocument | pdf, docx, jpg | 20 MB | Evet | Proxy | Sezon + 1 yıl |
| AnnouncementAttachment | pdf, jpg, png | 10 MB | Evet | Proxy | Sezon + 1 yıl |

> **NOT — Retention değerleri taslaktır.** Kesin süreler KVKK saklama-imha politikası belgesiyle (mali müşavir / hukuk görüşü) teyit edilip registry'de güncellenecektir (Açık İş §11.1). Registry tek nokta olduğu için değişiklik maliyeti sıfıra yakındır.

### 2.5 İndeksler ve Kısıtlar

1. `IX_StoredFiles_School_Status (SchoolId, Status)` — orphan/purge job taramaları.
2. `IX_StoredFiles_School_Checksum (SchoolId, Sha256Checksum)` — bütünlük kontrolü + gelecekte tenant-içi dedup (K2).
3. `IX_FileAttachments_Entity (SchoolId, EntityType, EntityId)` — "bu ödevin dosyaları" sorgusunun ana yolu.
4. `UQ_StoredFiles_ObjectKey (Bucket, ObjectKey)` — aynı anahtara çift kayıt imkânsız.
5. `FileAttachment` silinse bile `StoredFile` silinmez; `StoredFile` silme kararı purge job'ının sorumluluğudur.

### 2.6 Domain Event'ler

| Event | Tetik | Tüketici |
|-------|-------|----------|
| FileUploadConfirmedEvent | Confirm başarılı, Status=Active öncesi | VirusScanJob enqueue; ilgili modül (ör. ödev SubmittedAt) |
| FileQuarantinedEvent | Tarama Infected | Bildirim (öğretmen/admin), audit Critical log |
| FileSoftDeletedEvent | DeleteFileCommand | 30 gün sonra purge kuyruğu |
| SchoolBucketProvisionedEvent | Onboarding provisioning tamam | Onboarding wizard ilerleme adımı |

---

## 3. Backend Tasarımı (oksis-api)

### 3.1 Modül Yerleşimi — Repo'ya Eşlenmiş

> Docx §8.1 `src/Modules/Documents/` altında kendi katmanlarını önerir; repo düzeni katman-projelidir. Dikey dilim ilkesi korunarak **şu eşleme geçerlidir** (docx yerleşimi değil, bu tablo uygulanır):

| Docx konumu | Repo konumu |
|-------------|-------------|
| Domain/{Entities,Enums,Events,Policies} | `Oksis.Domain/Modules/Documents/{Entities,Enums,Events,Policies}` |
| Application/Abstractions | `Oksis.Application/Modules/Documents/Abstractions` (IStorageService, IStorageServiceResolver, IFileCategoryPolicyRegistry, IVirusScanner, IObjectKeyGenerator, IChecksumCalculator, StorageCapabilities, StorageUploadRequest…) |
| Application/{Commands,Queries} | `Oksis.Application/Modules/Documents/{Commands,Queries,DTOs,Mappings}` (mevcut modül deseni: Schools) |
| Application/Jobs | Job sınıfları `Oksis.Infrastructure/BackgroundJobs/Jobs/` (mevcut desen: `ExpiredRefreshTokenCleanupJob`); iş mantığı Application handler/servislerine delege edilir |
| Infrastructure/Storage | `Oksis.Infrastructure/Storage/` (S3CompatibleStorageService, StorageServiceResolver) — eski `FileStorageService` burada silinecek |
| Infrastructure/Scanning | `Oksis.Infrastructure/Scanning/ClamAvScanner.cs` |
| Infrastructure/Persistence | `Oksis.Infrastructure/Persistence/Configurations/` (StoredFileConfiguration, FileAttachmentConfiguration) |
| Api | `Oksis.Api/Controllers/FilesController.cs` — tek satır: `mediator.Send` + `ToHttpResult` |

Pipeline sırası proje standardı: Logging → Validation → TenantContext → Authorization → Transaction (Commands) → Caching (`[Cacheable]` Queries).

### 3.2 IStorageService ve Capability Modeli

S3 API kanonik protokoldür. Capability bildirimi interface sözleşmesinin parçasıdır (K6): Documents modülü akış seçerken (proxy mi presigned mi) bu bayraklara bakar; sağlayıcı presigned desteklemiyorsa eşik ne olursa olsun proxy'ye düşer.

```csharp
public sealed record StorageCapabilities(
    bool SupportsPresignedUrls,
    bool SupportsMultipart,
    bool SupportsServerSideCopy);

public interface IStorageService
{
    StorageCapabilities Capabilities { get; }
    Task<StorageObjectResult> UploadAsync(StorageUploadRequest req, CancellationToken ct);
    Task<Stream> DownloadAsync(string bucket, string key, CancellationToken ct);
    Task DeleteAsync(string bucket, string key, CancellationToken ct);
    Task<bool> ExistsAsync(string bucket, string key, CancellationToken ct);
    Task<ObjectStat> StatAsync(string bucket, string key, CancellationToken ct);
    Task<Uri> GetPresignedDownloadUrlAsync(string bucket, string key, TimeSpan ttl, CancellationToken ct);
    Task<Uri> GetPresignedUploadUrlAsync(string bucket, string key, TimeSpan ttl, CancellationToken ct);
    Task<MultipartUploadSession> InitiateMultipartAsync(string bucket, string key, CancellationToken ct);
    Task CopyAsync(string srcBucket, string srcKey, string dstBucket, string dstKey, CancellationToken ct);
    Task EnsureBucketAsync(string bucket, CancellationToken ct); // provisioning (K1)
}

// DI — sağlayıcı çözümü StoredFile.StorageProvider alanına göre
services.AddKeyedSingleton<IStorageService, S3CompatibleStorageService>(StorageProviderType.S3Compatible);
services.AddSingleton<IStorageServiceResolver, StorageServiceResolver>();
```

Checksum hesaplama ve object key üretimi static utility DEĞİL, enjekte edilebilir servislerdir (`IObjectKeyGenerator`, `IChecksumCalculator`) — test edilebilirlik ve sağlayıcı bağımsızlığı için. Tek bir "FileService" YOKTUR; depolama, tarama, kota, politika, key üretimi ayrı sözleşmelerdir.

### 3.3 Bucket ve Object Key Stratejisi

```
Bucket   : oksis-t{SchoolId}          // K1 — SchoolId, slug DEĞİL (rename yoktur)
ObjectKey: {AcademicYearId}/{category}/{yyyy-MM}/{fileGuid}.{ext}
örnek    : 7f2c.../assignment-submission/2026-09/3adf...91.pdf
```

1. Sezon prefix'i hiyerarşi değil yaşam döngüsü içindir: "3 yıl önceki sezonu arşivle/imha et" prefix bazlı toplu operasyondur.
2. Orijinal dosya adı asla key olmaz; `Content-Disposition` ile geri verilir. Türkçe karakter, çakışma ve injection sorunları doğmadan ölür.
3. Bucket oluşturma onboarding'de idempotent `ProvisionSchoolBucketCommand` + Hangfire retry ile yapılır.

### 3.4 CQRS Komut / Sorgu Listesi

| Komut / Sorgu | İzin | Açıklama |
|---------------|------|----------|
| InitiateFileUploadCommand | files.upload | Policy + kota kontrolü; StoredFile Status=PendingUpload; presigned PUT (veya multipart session) döner. TTL 15 dk. |
| ConfirmFileUploadCommand | files.upload | `StatAsync` ile varlık/boyut/checksum doğrulama → Status=Active (tarama gerekiyorsa Quarantined) + FileUploadConfirmedEvent. İş verisi aynı transaction'da (K5). |
| UploadFileCommand | files.upload | Proxy mod (≤25MB ve ForcePresigned değil). Streaming; RAM'e tam yükleme yok. Validasyon + checksum + kayıt tek akışta. |
| AttachFileCommand | files.upload | Aktif StoredFile'ı entity'ye bağlar. Aynı dosya N entity'ye bağlanabilir. |
| DetachFileCommand | files.delete | Bağı kaldırır; StoredFile'a dokunmaz. |
| DeleteFileCommand | files.delete | Soft delete (Status=SoftDeleted); 30 gün sonra purge job fiziksel imha. |
| ProvisionSchoolBucketCommand | SuperAdmin | Onboarding adımı; EnsureBucketAsync + policy; idempotent. |
| GetFileDownloadUrlQuery | files.download | Resource-scope yetki kontrolü (veli → kendi çocuğu) → kısa TTL (5-15 dk) presigned GET. Her üretim audit'e yazılır. |
| ListFilesByEntityQuery | files.view | (EntityType, EntityId) üzerinden metadata listesi. `[Cacheable]` DEĞİL — durum sık değişir. |
| GetSchoolStorageUsageQuery | files.view (admin) | `[Cacheable]` — Redis, tenant-prefixli key; kota göstergesi. |

Ek: `GET /api/v1/files/policies/{category}` — istemcinin policy okuduğu uç (maxSize, extensions, mode); sunucu her durumda yeniden doğrular (defense-in-depth).

### 3.5 Hangfire Arka Plan İşleri

| Job | Tetik / Periyot | Görev |
|-----|-----------------|-------|
| VirusScanJob | FileUploadConfirmedEvent | ClamAV taraması; Clean → Active, Infected → Quarantined + FileQuarantinedEvent + Critical log. |
| OrphanUploadCleanupJob | Saatlik | Confirm gelmemiş 24 saati aşmış PendingUpload kayıtlarını DB + storage'dan temizler. |
| SoftDeletePurgeJob | Günlük | SoftDeleted + 30 günü aşanları fiziksel siler; KVKK imha logu (`data.delete.kvkk`) yazar. |
| RetentionEnforcementJob | Günlük | `FileCategoryPolicy.RetentionPeriod` aşılan dosyaları SoftDeleted'a çeker. |
| ThumbnailGenerationJob | FileUploadConfirmedEvent (görsel/pdf) | Önizleme üretir; ayrı StoredFile olarak parent ilişkisiyle saklanır. |
| StorageMigrationJob | Manuel (backlog) | Sağlayıcı geçişinde arka plan taşıması; kayıt bazlı StorageProvider güncellenir. Detay tasarımı Açık İş (§11.5). |

### 3.6 Kota Yönetimi

1. Okul başına toplam ve kategori başına kota; kaynak: `SUM(SizeBytes)` — Redis sayacı ile senkron (tenant-prefixli key).
2. InitiateFileUpload / UploadFile kota aşımında **422** + anlamlı hata kodu döner; UI kota göstergesi `GetSchoolStorageUsageQuery`'den beslenir.
3. **Kota varsayılanı (B1 köprüsü):** Payments/plan modeli olmadığı için okul başına varsayılan kota `SystemSetting`'den okunur. Plan modeli geldiğinde tek nokta değişir (Açık İş §11.3).

---

## 4. İzin Matrisi

Format `{module}.{action}`; **Default Deny** — matriste açıkça verilmeyen izin YOKTUR. Backend `[RequirePermission]` + resource-level scope; frontend `usePermission` / `RequirePermission`. İzin yok → 403; kapsam dışı kaynak → 404.

| İzin Anahtarı | SuperAdmin | SchoolAdmin | Teacher | Parent | Student | Secretary |
|---------------|-----------|-------------|---------|--------|---------|-----------|
| files.view | Tam | Tam (okul) | Kapsamlı | Kapsamlı | Kapsamlı | Kapsamlı |
| files.upload | — | Tam (okul) | Kapsamlı | Kapsamlı | Kapsamlı | Kapsamlı |
| files.download | Tam | Tam (okul) | Kapsamlı | Kapsamlı | Kapsamlı | Kapsamlı |
| files.delete | — | Tam (okul) | Kapsamlı | — | Kapsamlı | — |
| files.quota.view | Tam | Tam (okul) | — | — | — | — |
| files.policies.manage | Tam | — | — | — | — | — |

> "Tam": rol, tenant filtresi dışında kısıtsız. "Kapsamlı": izin var ancak resource-level scope uygulanır. "—": izin yok (403). SuperAdmin files.view/download yalnızca `X-Tenant-Override` + audit ile (denetim amaçlı); upload/delete yapamaz.

### 4.1 Resource-Level Scope Kuralları

1. **Teacher:** yalnızca kendi görevlendirildiği ders/şube/kulüp entity'lerine bağlı dosyalar (Görevlendirmeler modülü kaynak).
2. **Parent:** yalnızca ParentStudents üzerinden bağlı olduğu çocuğun entity'lerine bağlı dosyalar; çoklu çocukta `X-Active-Child-Id`.
3. **Student:** yalnızca kendi entity'lerine bağlı dosyalar; kendi teslimini silebilir (teslim süresi kapanana kadar — ilgili modül kuralı).
4. Kapsam ihlali **404** döner (kaynağın varlığını sızdırmamak için); izin yokluğu **403** döner.
5. Her presigned GET üretimi audit loguna yazılır: kim, hangi dosya, ne zaman.

---

## 5. Web Tasarımı (oksis-web)

### 5.1 Paylaşılan Katman

Dosya davranışı portal sayfalarına değil, `src/shared/files` altındaki paylaşılan katmana yazılır. `FileUpload` komponenti (component-rules.md §17: drag&drop, progress, server-side re-validation) bu katmanın üzerine oturur. Modüller yalnızca `category` + `entityType`/`entityId` prop'ları geçirir.

```
src/shared/files/
├── components/  FileUpload.tsx, FileList.tsx, FileStatusPill.tsx, StorageUsageCard.tsx
├── hooks/       useFileUpload.ts, useFileDownload.ts, useEntityFiles.ts, useFilePolicy.ts
├── api/         filesApi.ts
├── types/       file.types.ts        // Zod şemaları + DTO tipleri
└── utils/       uploadMode.ts        // policy → proxy/presigned kararı
```

### 5.2 useFileUpload Akışı

1. `GET /api/v1/files/policies/{category}` → maxSize, extensions, mode (istemci policy'den okur; **sunucu yine doğrular**).
2. mode=proxy → `POST /api/v1/files` (multipart/form-data, streaming). mode=presigned → `POST /api/v1/files/initiate` → PUT (doğrudan Garage) → `POST /api/v1/files/{id}/confirm`.
3. onSuccess: query invalidate `['files', entityType, entityId]`.

### 5.3 React Query Keys ve State Kuralları

| Key | Kaynak | Not |
|-----|--------|-----|
| `['files', entityType, entityId]` | ListFilesByEntityQuery | Upload/delete sonrası invalidate. |
| `['files', 'policy', category]` | Policy endpoint | staleTime uzun (policy nadir değişir). |
| `['files', 'usage']` | GetSchoolStorageUsageQuery | Admin kota göstergesi. |

1. Zod: dosya metadata DTO'ları `file.types.ts` içinde; upload önce istemcide policy'ye göre doğrulanır, sunucu yine reddedebilir.
2. Quarantined durum UI'da `FileStatusPill` ile gösterilir ("Güvenlik taramasında" — i18n key); indirme butonu disabled.
3. İndirme: `GET /files/{id}/download-url` → dönen presigned URL yeni sekmede açılır; URL asla state'te uzun süre tutulmaz (kısa TTL) ve loglanmaz.
4. Server state Zustand'a kopyalanmaz; tek kaynak TanStack Query.
5. İzin yoksa buton render edilmez (disabled değil — leak yasağı); server yine kontrol eder.
6. Tüm React Query key'leri tenant-prefixli (mevcut proje kuralı).

---

## 6. Mobile Tasarımı (oksis-mobile) — **B4: ERTELENDİ**

> Bu bölüm ilk mobile dosya tüketicisi geliştirilirken uygulanacak referans tasarımdır; bu işin kapsamında YAZILMAZ.

1. Seçim: expo-document-picker / expo-image-picker; policy doğrulaması seçim anında.
2. Proxy mod: `FileSystem.uploadAsync` multipart POST; JWT expo-secure-store'dan (AsyncStorage YASAK).
3. Presigned mod: initiate → `FileSystem.uploadAsync(presignedUrl, { httpMethod: "PUT" })` → confirm; uploadTask + progress callback.
4. İndirme: download-url → `FileSystem.downloadAsync` → expo-sharing / in-app viewer; cache LRU sınırlı.
5. Thumbnail'lar expo-image ile; liste ekranlarında asıl dosya asla çekilmez.
6. Katman: `src/shared/files/` (components/FilePicker,FileCard,FileStatusPill; hooks; api; utils/presignedUpload.ts).

---

## 7. Uçtan Uca Akışlar (normatif)

### 7.1 Proxy Upload (örnek: logo / ödev dokümanı)

1. İstemci policy'den kuralları okur (uzantı/boyut/mod).
2. `POST /api/v1/files` → UploadFileCommand: FluentValidation (policy), kota kontrolü, SHA-256, Garage'a stream, StoredFile kaydı (Status=Quarantined, VirusScan=Pending) — tek transaction.
3. AttachFileCommand → entity'ye bağlanır; UI listesi invalidate; "Güvenlik taramasında" pill.
4. VirusScanJob → Clean → Status=Active; SignalR ile UI güncellenir.

### 7.2 Presigned Multipart (örnek: sanal kitap)

1. InitiateFileUploadCommand → kota kontrolü; StoredFile PendingUpload; multipart session + part URL'leri (TTL 15 dk).
2. İstemci doğrudan Garage'a yükler (`files.*` subdomain); part'lar paralel, kopan part yeniden denenir; oksis-api hiç dokunmaz.
3. ConfirmFileUploadCommand → StatAsync boyut+checksum doğrular; multipart complete; Status=Quarantined; FileUploadConfirmedEvent. Başarısız confirm → PendingUpload kalır, orphan cleanup güvencesi.
4. VirusScanJob + AttachFileCommand → tek StoredFile N şubeye bağlanır.

### 7.3 İndirme

1. `GET /api/v1/files/{id}/download-url` → pipeline: TenantContext + `[RequirePermission("files.download")]`.
2. Resource-level scope: dosyanın bağlı olduğu entity zinciri doğrulanır (ör. Assignment → Student → ParentStudents, `X-Active-Child-Id`). Kapsam dışı → 404.
3. Status=Active ve VirusScan=Clean değilse indirme reddedilir (Quarantined → anlamlı hata).
4. 10 dk TTL presigned GET üretilir, audit'e yazılır; istemci doğrudan Garage'dan indirir.

### 7.4 Okul Ayrılır — KVKK İmha (K1 kazancı)

1. SuperAdmin offboarding başlatır; yasal bekleme süresi sayacı işler.
2. Okulun tüm StoredFile kayıtları SoftDeleted'a çekilir; erişim anında kapanır.
3. Bekleme sonunda `oksis-t{SchoolId}` bucket'ı tek operasyonla silinir; `data.delete.kvkk` audit kaydı ile taahhüt kanıtlanabilir kapanır.

---

## 8. Kimlik Doğrulama ve Loglama (docx EK A — normatif)

### 8.1 Kimlik Doğrulama

1. Tüm `files.*` endpoint'leri custom JWT (access 15 dk / refresh 30 gün, rotation) ile korunur. IdentityServer, cookie ve session auth KULLANILMAZ.
2. Presigned URL'ler JWT'den bağımsız kısa ömürlü yetki taşır: URL'i elinde tutan indirebilir. Bilinçli takas; karşılığı kısa TTL (5-15 dk) + her üretimin audit'e yazılması.
3. Uzun multipart upload sırasında token dolması sorun değildir: initiate ve confirm ayrı JWT'li isteklerdir; aradaki part PUT'ları presigned'dır.
4. SuperAdmin cross-tenant erişimi yalnızca `X-Tenant-Override` + audit ile.

### 8.2 Loglama (Serilog + ELK)

Structured logging zorunlu; `Console.WriteLine` ve string-interpolation'lı log YASAK. Correlation ID LoggingBehavior'dan taşınır.

| Olay | Seviye | Zorunlu alanlar |
|------|--------|-----------------|
| files.upload.initiated | Information | FileId, SchoolId, Category, SizeBytes, Mode, CorrelationId |
| files.upload.confirmed | Information | FileId, SchoolId, SizeBytes, ChecksumMatch, CorrelationId |
| files.upload.orphan-cleaned | Warning | FileId, SchoolId, AgeHours |
| files.scan.clean | Information | FileId, SchoolId, DurationMs |
| files.scan.infected | Critical | FileId, SchoolId, Signature, UploadedByUserId |
| files.download.url-issued | Information (audit) | FileId, SchoolId, RequestedByUserId, TtlMinutes, EntityType, EntityId |
| files.delete.soft | Information | FileId, SchoolId, DeletedByUserId |
| files.purge.physical | Information (data.delete.kvkk) | FileId, SchoolId, RetentionRule |
| files.storage.error | Error | Bucket, ObjectKey, Operation, Provider + exception |
| tenant.mismatch | Critical | Proje standardı — TenantMismatchException ile |

**KURAL — Redaction: presigned URL asla loglanmaz.** Query string (`X-Amz-Signature` vb.) geçici erişim anahtarıdır. Log satırlarına yalnızca Bucket + ObjectKey + TTL yazılır. AccessKey/SecretKey ve JWT içerikleri redact edilir.

**KURAL — Streaming:** Proxy upload streaming yapılır; `Task.Result`/`.Wait()` ve RAM'e tam yükleme yasak. Kestrel request limiti kategori max'ına göre ayarlanır (deploy notu).

---

## 9. Eski Altyapının Emekliliği (B1 gereği zorunlu)

1. Mevcut `IFileStorageService` (`Oksis.Application/Common/Abstractions/IFileStorageService.cs`) ve `FileStorageService` (`Oksis.Infrastructure/Storage/FileStorageService.cs`, yerel disk, tenant-izolasyonsuz) **bu iş bitiminde SİLİNİR**.
2. SchoolSettings logo akışı `SchoolLogo` kategorisiyle yeni altyapıya göçer (proxy mod). Var olan logo dosyaları için tek seferlik göç adımı plana dahil edilir (dev ortamında veri kaybı kabul; prod yok).
3. `FileStorageOptions` ve ilgili appsettings kaldırılır; yerine Storage (Garage endpoint/credential) konfigürasyonu gelir.

---

## 10. Uygulama Fazları

| Faz | İçerik | Doğrulama |
|-----|--------|-----------|
| 0 | Dev altyapı: docker-compose'a Garage + ClamAV, `AWSSDK.S3` paketi, appsettings şeması | `docker compose up` ile S3 endpoint ayakta |
| 1 | Domain + persistence: entity'ler, enum'lar, event'ler, policy registry (6 kategori), migration, indeksler | Domain unit testleri |
| 2 | `IStorageService` + capability + `S3CompatibleStorageService` + `ProvisionSchoolBucketCommand` | Garage'a karşı entegrasyon testleri |
| 3 | CQRS yüzeyi: proxy upload, initiate/confirm (multipart), attach/detach/delete, download-url, listeler, policies endpoint + `files.*` izinleri + resource-scope | Uçtan uca entegrasyon testleri (B3) |
| 4 | Hangfire job'ları (5 adet; StorageMigrationJob backlog) + log kataloğu + redaction | Job testleri |
| 5 | Logo göçü + eski servislerin silinmesi + web `shared/files` + logo ekranı swap | Vitest + Chrome ekran testi |

Her faz kendi başına build+test geçer, TDD ile ilerler ve OKSİS commit formatıyla commit'lenir. Fix commit'leri kullanıcı onayıyla atılır.

## 11. Açık İşler (kod dışı — bu spec'in dışında takip)

1. KVKK saklama sürelerinin (§2.4) hukuk/mali müşavir teyidi ile kesinleştirilmesi.
2. `files.*` subdomain + TLS için altyapı/DevOps kurulum dokümanı (K4 prod ön koşulu — dev'de lokal Garage endpoint ile çalışılır).
3. Kota değerlerinin okul sözleşme planlarına bağlanması (Payments/plan modeli ile; §3.6 SystemSetting köprüsü geçerli).
4. `FtpStorageService` — talep doğana kadar backlog (K6).
5. `StorageMigrationJob` detay tasarımı — ilk sağlayıcı geçişi gündeme geldiğinde.
6. Mobile shared/files katmanı — ilk mobile dosya tüketicisiyle (B4).
7. Davranışsal tüketiciler: ödev teslim ekleri, duyuru ekleri, sanal kitap — ilgili modüllerin backend'i geliştirilirken bağlanır (B2).
