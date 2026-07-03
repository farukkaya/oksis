# Dosya Yönetimi Faz 2 Uygulama Planı (IStorageService + S3 + Provisioning)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Bağlayıcı spec: `dosya-yonetimi-spec.md` §3.2/§3.3 (+ OQ-documents-008 devirleri).

**Goal:** Depolama soyutlaması + capability modeli + `S3CompatibleStorageService` (Garage'a karşı entegrasyon testli, B3 güvencesi) + okul bucket provisioning — kod-tarafı sıfır borç.

**Base:** oksis-api master `d752f98`. **Branch:** `feature/dosya-yonetimi-faz2`.

## Global Constraints

- Faz 0-1 planındaki tüm Global Constraints geçerli (commit formatı + Fable trailer, dotnet format, TDD gerçek/verbatim RED-GREEN kanıtı, Türkçe XML doc).
- **Naming:** `src/**` private alanlar `_camelCase` (const dahil); `tests/**` MUAF.
- **Spec §3.2 sözleşmesi birebir:** `StorageCapabilities(bool SupportsPresignedUrls, bool SupportsMultipart, bool SupportsServerSideCopy)`; `IStorageService` üyeleri: `Capabilities`, `UploadAsync(StorageUploadRequest, ct)`, `DownloadAsync(bucket,key,ct)`, `DeleteAsync`, `ExistsAsync`, `StatAsync`, `GetPresignedDownloadUrlAsync(bucket,key,ttl,ct)`, `GetPresignedUploadUrlAsync`, `InitiateMultipartAsync`, `CopyAsync`, `EnsureBucketAsync`. DI: `AddKeyedSingleton<IStorageService, S3CompatibleStorageService>(StorageProviderType.S3Compatible)` + `IStorageServiceResolver` (repo'da ilk keyed-DI kullanımı — bilinçli, spec gereği).
- AWSSDK.S3 yalnız Infrastructure'da; Application `Amazon.*` GÖRMEZ.
- Checksum/key üretimi enjekte edilebilir servis (`IObjectKeyGenerator`, `IChecksumCalculator`) — static helper YASAK (spec A.1).
- ObjectKey formatı: `{AcademicYearId}/{kebab-case-category}/{yyyy-MM}/{fileGuid}.{ext}` (spec §3.3; kategori kebab-case: `AssignmentSubmission`→`assignment-submission`). Bucket: `oksis-t{SchoolId}` (lowercase, tire'siz Guid "N" formatı DEĞİL — Guid default "D" lowercase; S3 bucket adı kuralı gereği `oksis-t{guid:D}` 43 karakter, 63 limitine uyar).
- OQ-documents-008 #2: tenant-filter doğrulaması snapshot grep'iyle YAPILMAZ.
- Yeni paket YOK (AWSSDK.S3 zaten ekli). Testcontainers zaten test projesinde var (MSSQL için) — yeni test paketi eklemeden önce mevcut csproj'u kontrol et; gerekiyorsa DUR ve kontrolcüye sor.

## Keşif Notları (implementer'lar için)

- Options kalıbı: `services.Configure<T>(configuration.GetSection(T.SectionName))`, options sınıfı tüketen servisin yanında (`Infrastructure/Storage/`), `public const string SectionName`. Yeni: `S3StorageOptions` — SectionName `"Storage:S3"` (appsettings Faz 0'da kondu: ServiceUrl, Region, AccessKey, SecretKey, ForcePathStyle, PresignedEndpoint).
- Eski `IFileStorageService` (DI L273-276) BU FAZDA SİLİNMEZ (Faz 5 işi) — dokunma.
- Domain event akışı: entity/handler `Raise` → `DomainEventInterceptor` → `DomainEventNotification<T>` → `INotificationHandler`. Outbox yok.
- Komut kalıbı: `Modules/Schools/Commands/UpdateSchoolBasicInfo` üçlüsü (`[Tenancy(...)]` + `[RequirePermission("...")]` + `ICommand`/`ICommandHandler` + `Result`).
- Entegrasyon test kalıbı: `[Collection(DatabaseCollection.Name)]` + `DatabaseFixture` (Testcontainers MSSQL), DI konteyneri yok, handler'lar elle kurulur.
- Arka plan işi soyutlaması: `IBackgroundJobClient` (`Application/Common/Abstractions/IBackgroundJobClient.cs`; dev'de `InProcessBackgroundJobClient`).

---

### Task 1: Storage Abstractions + S3CompatibleStorageService (çekirdek) + Keyed DI

**Files:**
- Create (Application/Modules/Documents/Abstractions/): `IStorageService.cs` (+ `StorageCapabilities`, `StorageUploadRequest`, `StorageObjectResult`, `ObjectStat`, `MultipartUploadSession` record'ları — ayrı dosyalar), `IStorageServiceResolver.cs`, `IObjectKeyGenerator.cs`, `IChecksumCalculator.cs`
- Create (Application/Modules/Documents/Services/): `ObjectKeyGenerator.cs`, `Sha256ChecksumCalculator.cs`
- Create (Infrastructure/Storage/): `S3StorageOptions.cs`, `S3CompatibleStorageService.cs`, `StorageServiceResolver.cs`
- Modify: `Infrastructure/DependencyInjection.cs` (Configure + keyed kayıt + resolver + key-gen/checksum kayıtları)
- Test: `tests/Oksis.Application.UnitTests/Modules/Documents/ObjectKeyGeneratorTests.cs`, `Sha256ChecksumCalculatorTests.cs`

**Sözleşme detayları:**
- `StorageUploadRequest(string Bucket, string Key, Stream Content, string ContentType, long? ContentLength)`; `StorageObjectResult(string Bucket, string Key, long SizeBytes, string? ETag)`; `ObjectStat(long SizeBytes, string? ETag, DateTimeOffset? LastModified)`; `MultipartUploadSession(string UploadId, IReadOnlyList<Uri> PartUrls, int PartSizeBytes)` (part URL'leri presigned PUT; part sayısı `ceil(declaredSize/PartSize)`, PartSize 16MB sabiti options'tan).
- `IObjectKeyGenerator.Generate(Guid academicYearId, string category, string originalFileName)` → key (uzantı originalFileName'den, lowercase; nokta yoksa uzantısız). `IChecksumCalculator.ComputeSha256Async(Stream, ct)` → 64-hex lowercase; **OQ-008 #1**: `IChecksumCalculator` XML doc'una "dönüş her zaman 64-hex lowercase" sözleşmesi yazılır.
- `S3CompatibleStorageService`: `AmazonS3Client` (ServiceUrl + ForcePathStyle), `Capabilities = new(true, true, true)`. `EnsureBucketAsync` idempotent (`AmazonS3Exception` BucketAlreadyOwnedByYou/Conflict yut). Upload streaming (`TransferUtility` YOK — düz `PutObjectAsync` stream ile; RAM'e tam yükleme yasak, `AutoCloseStream=false`). Log: spec §8.2 kataloğu `files.storage.error` (Bucket, ObjectKey, Operation, Provider) — presigned URL query string'i ASLA loglanmaz.
- Resolver: `IStorageServiceResolver.Resolve(StorageProviderType)` → `IServiceProvider.GetRequiredKeyedService<IStorageService>(provider)`; bilinmeyen → `DocumentsDomainException("storage.provider.unknown", ...)`.
- TDD: key-gen (format, kebab-case, Türkçe karakterli dosya adı, uzantısız dosya) + checksum (bilinen vektör: boş stream `e3b0c442...`, "abc" → `ba7816bf...`) testleri.
- Adımlar: RED → GREEN → `dotnet build` (0 warning) → `dotnet format` → commit `feat,test`.

**Interfaces (sonraki task'lar için):** yukarıdaki tüm imzalar + DI key'i `StorageProviderType.S3Compatible`.

---

### Task 2: Garage Entegrasyon Testleri (B3 güvencesi — presigned + multipart uçtan uca)

**Files:**
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Fixtures/GarageStorageFixture.cs` — `IAsyncLifetime`; `S3StorageOptions`'ı sabit dev değerlerle kurar (http://localhost:3900, Faz 0 credential'ları — appsettings.Development.json ile aynı); `InitializeAsync` endpoint'e TCP/HTTP probe atar, ulaşılamazsa `SkipException` DEĞİL — xunit'te fixture içinde `_available=false` bayrağı + her test başında `Assert.SkipWhen`? xunit v2'de Skip runtime desteklenmez: bunun yerine testler `[SkippableFact]`... **Yeni paket eklemek YASAK** — çözüm: fixture ulaşılamazsa `InvalidOperationException("Garage dev container ayakta değil — 'docker compose up -d garage' + scripts/init-garage.sh çalıştırın")` fırlatır (test FAIL olur, sessiz atlama olmaz; dev makinede Garage her zaman compose'da — bilinçli karar, plan notu).
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Modules/Documents/S3CompatibleStorageServiceIntegrationTests.cs`

**Test listesi (hepsi gerçek Garage'a karşı, benzersiz test bucket `oksis-t{yeni Guid}`; dispose'da bucket temizliği best-effort):**
1. `EnsureBucket_is_idempotent` — iki kez çağır, hata yok, `ExistsAsync` bucket-yok-key testi.
2. `Upload_then_stat_and_download_roundtrip` — stream yükle, `StatAsync` boyut eşit, `DownloadAsync` içerik bit-eş, checksum doğrula.
3. `Presigned_download_url_serves_content` — `GetPresignedDownloadUrlAsync(ttl 5dk)` → düz `HttpClient.GetAsync` (JWT'siz!) 200 + içerik eş; URL'nin loglanmadığını değil davranışı test ediyoruz.
4. `Presigned_upload_url_accepts_put` — `GetPresignedUploadUrlAsync` → `HttpClient.PutAsync` 200 → `ExistsAsync` true.
5. `Multipart_initiate_and_complete_roundtrip` — `InitiateMultipartAsync` → part URL'lerine 2 part PUT (part başı ≥5MB S3 kuralı; 6MB rastgele veri) → complete → `StatAsync` toplam boyut. (Complete mekanizması: `MultipartUploadSession` complete/abort metod ihtiyacı doğarsa `IStorageService`'e `CompleteMultipartAsync(bucket,key,uploadId,IReadOnlyList<PartETag'e karşılık (int PartNumber, string ETag)>,ct)` + `AbortMultipartAsync` EKLE — spec §3.2 listesi minimum settir, ConfirmFileUpload multipart complete'i §7.2.3'te gerektirir; bu ekleme spec uyumlu genişletmedir, sapma değildir. Kontrolcü onayı: verildi.)
6. `Delete_removes_object` + `Exists_false_for_missing`.
7. `Copy_duplicates_object` (SupportsServerSideCopy kanıtı).

- Adımlar: testler önce yazılır (Garage ayakta — RED çekirdek servis eksik metotlarında/GREEN Task 1 çekirdeğiyle kısmi), eksik multipart/copy/presigned implementasyonu tamamlanır, hepsi GREEN. Tam entegrasyon süiti + `dotnet format` + commit `feat,test`.

---

### Task 3: ProvisionSchoolBucket komutu + SchoolCreated auto-provisioning

**Files:**
- Create: `Application/Modules/Documents/Commands/ProvisionSchoolBucket/` → `ProvisionSchoolBucketCommand.cs` (`Guid SchoolId`), `ProvisionSchoolBucketCommandHandler.cs`, `ProvisionSchoolBucketCommandValidator.cs`
- Create: `Application/Modules/Documents/Events/SchoolCreatedBucketProvisioningHandler.cs` — `INotificationHandler<DomainEventNotification<SchoolCreatedEvent>>`; `IBackgroundJobClient` ile provisioning'i kuyruğa atar (Hangfire retry güvencesi, spec §3.3.3).
- Create: `Application/Modules/Documents/Abstractions/IBucketNameProvider.cs` + `Services/BucketNameProvider.cs` — `GetBucketName(Guid schoolId)` → `oksis-t{schoolId:D}` (tek nokta; StoredFile üretimi ve provisioning aynı kaynağı kullanır).
- Test: `tests/Oksis.Application.UnitTests/Modules/Documents/BucketNameProviderTests.cs`, `ProvisionSchoolBucketCommandHandlerTests.cs` (NSubstitute: resolver→mock IStorageService; EnsureBucketAsync çağrısı + `School` entity üzerinden `SchoolBucketProvisionedEvent` raise edildiği asserti); `tests/Oksis.Infrastructure.IntegrationTests/Modules/Documents/ProvisionSchoolBucketIntegrationTests.cs` (gerçek Garage: komut 2x idempotent).

**Kurallar:**
- Komut nitelikleri: mevcut SuperAdmin/okul-yaşam-döngüsü komut emsalini bul ve AYNI kalıbı uygula (`[Tenancy]` modu + izin niteliği); emsal yoksa `[Tenancy(TenancyMode.Required)]` + `[RequirePermission("files.provision")]` KULLANMA — bunun yerine kontrolcüye NEEDS_CONTEXT dön (izin anahtarı uydurulmaz; spec §3.4 "SuperAdmin" der).
- Handler: `IStorageServiceResolver.Resolve(S3Compatible)` → `EnsureBucketAsync(bucketNameProvider.GetBucketName(schoolId))`; School entity'yi çekip (IApplicationDbContext) `SchoolBucketProvisionedEvent` raise ETMEZ — event Domain/Documents'ta ama School entity'sine ait değil; bunun yerine handler `IPublisher` ile `DomainEventNotification<SchoolBucketProvisionedEvent>` yayınlar (DomainEventInterceptor kalıbının komut-içi eşdeğeri; mevcut kodda doğrudan IPublisher kullanan emsal ara, yoksa aynen böyle yap ve raporda not et). İdempotency: EnsureBucketAsync zaten idempotent; komut ikinci kez çağrıldığında da Result.Success.
- Auto-provisioning handler'ı: `SchoolCreatedEvent` → `IBackgroundJobClient` enqueue (`ISender.Send(new ProvisionSchoolBucketCommand(schoolId))` çalıştıran job). Job sınıfı `Infrastructure/BackgroundJobs/Jobs/SchoolBucketProvisionJob.cs` (mevcut job kalıbını izle).
- TDD + tam süit + format + commit.

---

### Task 4: Faz kapanışı

1. Tam süit + build doğrula (Garage/ClamAV ayakta).
2. `modules/documents/completion_status.md`: Faz 2 ✅ (commit'ler), progress bar ~%45; `domain-model.md`/`business-rules.md`'ye IStorageService capability + bucket adlandırma tek-kaynak notu; OQ-008 #1 (checksum sözleşmesi) → "Karar Verilenler" arşivine taşı.
3. Kontrolcü: faz final review (fable, tüm branch) → fix'ler → **master'a no-ff merge + push** (kullanıcı gece mandatı) → ledger.
