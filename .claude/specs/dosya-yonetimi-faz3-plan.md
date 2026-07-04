# Dosya Yönetimi Faz 3 Uygulama Planı (CQRS Yüzeyi + files.* İzinleri + Resource-Scope)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Bağlayıcı: `dosya-yonetimi-spec.md` §3.4/§4/§7/§8 + `modules/documents/permissions.md` + OQ-documents-008 (5-8 dahil).

**Goal:** Dosya CQRS yüzeyi (proxy + iki-fazlı/multipart upload, attach/detach/delete, download-url, listeler, policy endpoint), `files.*` izinlerinin uçtan uca bağlanması, resource-scope çerçevesi ve `FilesController` — Garage'a karşı uçtan uca entegrasyon testli.

**Base:** oksis-api master `d6ce6a9`. **Branch:** `feature/dosya-yonetimi-faz3`.

## Global Constraints

- Faz 0-2 planlarındaki tüm Global Constraints geçerli (commit formatı + Fable trailer, TDD verbatim kanıt, `src/**` `_camelCase` private — testler muaf, dotnet format + BOM-drift checkout).
- İzin anahtarları `permissions.md` matrisi birebir: `files.view`, `files.upload`, `files.download`, `files.delete`, `files.quota.view`, `files.policies.manage`. **`files.*` anahtarları `AllPermissionIds()` kataloğuna GİRMEZ** (SuperAdmin'e upload/delete verilmez); açık satırlar: SuperAdmin→view,download,quota.view,policies.manage; SchoolAdmin→view,upload,download,delete,quota.view; Teacher→view,upload,download,delete; Parent→view,upload,download; Student→view,upload,download,delete; Secretary→view,upload,download. SchoolStaff→yok (matris 6 rol tanımlar; SchoolStaff 🚫).
- İzin ihlali 403 (pipeline `AuthorizationBehavior`); kapsam ihlali **404** (`Error.NotFound` benzeri kod — spec §4.1.4).
- Her presigned GET üretimi audit: `files.download.url-issued` log olayı (FileId, SchoolId, RequestedByUserId, TtlMinutes, EntityType, EntityId — spec §8.2). Presigned URL/query-string ASLA loglanmaz.
- **Kapsam çerçevesi B2 uyumlu:** Faz 3'te canlı tek tüketici entity tipi `"School"` (logo, Faz 5 bağlar). `IFileAccessGuard` entity-tipi çözümleyici kayıt defteri olarak kurulur; kayıtsız entity tipi → scope DENY (404). Parent/Teacher/Student çözümleyicileri (ParentStudentRelationships, ITeacherClassroomScope) kendi tüketici modülleriyle gelir — bu B2 sıralamasıdır, sapma değil; ancak guard'ın sözleşme testleri (kayıtsız tip → 404; SchoolAdmin tam erişim; kayıtlı tip çözümleyiciye delege) ŞİMDİ yazılır.
- Aktif çocuk bağlamı: mevcut mekanizma (`ChildScope`/`IChildSessionStore` + `activeChildId` claim) — `X-Active-Child-Id` başlığı için YENİ okuyucu yazılmaz (Parent çözümleyicisi geldiğinde bu mekanizma kullanılacak; permissions.md'ye not).
- OQ-008 devirleri bu fazda kapanır: (5) presigned GET'e Content-Disposition/Content-Type override; (6) Confirm `ExistsAsync`-önce; (7) upload guard `!CanSeek`; ayrıca sha256 64-hex domain guard (`StoredFile.Confirm`/`CreateUploaded`) ve Faz 2 devri: upload öncesi idempotent `EnsureBucketAsync` (seeder gap mitigasyonu).
- Kota (spec §3.6): okul başına toplam kota `SystemSetting`'den (`files.quota.total-bytes` benzeri anahtar — mevcut SystemSetting seed kalıbını izle; varsayılan 10 GB). Redis sayaç + DB `SUM(SizeBytes)` senkron; aşım → 422 anlamlı kod (`FILES_QUOTA_EXCEEDED`).
- `ToHttpResult` MapStatusCode'a `FILES_*` bloğu eklenebilir (404/409/422 eşlemesi) — mevcut `USERS_*` kalıbı.

## Keşif Notları

- Yeni izin uçtan uca: `MasterSeedIds.Permissions` (SeedGuid.From("perm:files.upload")) → `PermissionSeedData.Rows()` → `RolePermissionSeedData` açık satırlar → InsertData migration (kalıp: `20260628121305_*_add_class_rooms_delete_permission.cs`).
- Multipart upload precedent: `SchoolSettingsController.UploadLogoAsync` (`[FromForm] IFormFile` + `[RequestSizeLimit]` + stream'i command'a taşıma). Global Kestrel/FormOptions limiti YOK — endpoint bazlı `[RequestSizeLimit]`.
- `[Cacheable(ttlSeconds, Key=...)]` kalıbı: `GetCurrentSessionQuery`.
- Scope guard kalıbı: `PersonAccessGuard`/`ITeacherClassroomScope` (Users modülü) — şekil referansı.
- Hata eşleme: `ResultExtensions.MapStatusCode` string-kod bazlı; `Error.NotFound`→404, `Error.Forbidden`→403, default 422.
- Quarantined/PendingUpload dosyada download-url reddi: `CanBeDownloaded` (Faz 1) — anlamlı hata kodu `FILES_NOT_SCANNED` benzeri → 409/422.

---

### Task 1: files.* İzin Altyapısı + Hata Kodları

**Files:** `MasterSeedIds.cs` (+6 sabit), `PermissionSeedData.cs` (+6 satır, Module "FILES"), `RolePermissionSeedData.cs` (açık satırlar — yukarıdaki matris), yeni migration `20260704_files_permissions` (InsertData Up / DeleteData Down, kalıp migration'ı birebir izle), `Application/Modules/Documents/FilesErrors.cs` (Error sabitleri: NotFound, QuotaExceeded, PolicyViolation [uzantı/boyut/tür], NotScanned, InvalidStatus, CategoryUnknown — `FILES_` prefix), `Api/Extensions/ResultExtensions.cs` (+`FILES_` bloğu: NOT_FOUND→404, QUOTA_EXCEEDED→422, NOT_SCANNED→409, diğer→422).
**Test:** seed satırlarının matrisle birebir eşleştiği unit test (RolePermissionSeedData'dan files.* projeksiyonu — mevcut seed test kalıbı varsa izle, yoksa `PermissionSeedDataTests`), migration içerik gözle doğrulama + `dotnet ef database update`.
Commit `feat,test`.

### Task 2: Upload Orkestrasyonu (proxy + iki-fazlı + multipart)

**Files:**
- `Abstractions/IStorageQuotaService.cs` + `Services/StorageQuotaService.cs` (Redis `ICacheService` sayaç, tenant-prefixli key + DB SUM senkron; `TryReserveAsync(schoolId, bytes)` / `ReleaseAsync`; SystemSetting'ten limit).
- `Commands/UploadFile/` (proxy: policy doğrulama [uzantı+content-type+boyut], kota, EnsureBucket idempotent, checksum [stream seekable — buffer stratejisi: ≤25MB proxy olduğundan `FileBufferingReadStream`? HAYIR — basit: controller'dan gelen IFormFile stream'i seekable değilse handler geçici dosyaya/`MemoryStream`e buffer'lamaz; bunun yerine checksum'u upload SIRASINDA hesaplayan sarmalayıcı `HashingStreamWrapper` yaz (Stream decorator, CanSeek=false, ContentLength verilir) — RAM'e tam yükleme YOK], `StoredFile.CreateUploaded`, tek SaveChanges).
- `Commands/InitiateFileUpload/` (policy+kota+EnsureBucket; `StoredFile.CreatePending`; mod kararı: policy.ForcePresigned || boyut>25MB → presigned [tek PUT veya AllowMultipart&&boyut>PartSize→multipart session+part URL listesi `GetPresignedUploadPartUrlAsync` ile]; TTL 15dk; dönüş DTO: fileId, mode, uploadUrl?/uploadId?+partUrls?+partSize).
- `Commands/ConfirmFileUpload/` (**ExistsAsync-önce**; multipart ise önce `CompleteMultipartAsync(parça ETag listesi command'dan)`; StatAsync boyut doğrula, beyan≠gerçek→`FILES_POLICY_VIOLATION`; checksum command'dan alınır ve 64-hex guard'lı `Confirm` çağrılır; kota gerçek boyutla düzeltilir).
- Domain: `StoredFile.Confirm`/`CreateUploaded` sha256 64-hex shape guard (+test); Infrastructure: upload guard `!CanSeek` genişletmesi İPTAL — HashingStreamWrapper CanSeek=false + ContentLength verilen akışla çalışmalı; bunun yerine guard mesajı "ContentLength zorunlu" olarak kalır, `UseChunkEncoding=false` + non-seekable + bilinen length kombinasyonunu Garage'a karşı entegrasyon testiyle DOĞRULA (çalışmıyorsa buffer'lı fallback kararını kontrolcüye NEEDS_CONTEXT sor); `GetPresignedDownloadUrlAsync`'e opsiyonel `ResponseHeaderOverrides` overload (Content-Disposition [RFC 5987 Türkçe dosya adı] + Content-Type).
**Test:** unit (policy red yolları, kota aşımı 422, mod kararı matrisi) + Garage entegrasyon (proxy roundtrip checksum'lu; initiate→PUT→confirm; multipart initiate→2 part→confirm; beyan boyut uyuşmazlığı reddi).
Commit(ler) `feat,test`.

### Task 3: Bağ/Yaşam Döngüsü Komutları + Sorgular + FileAccessGuard

**Files:**
- `Security/IFileAccessGuard.cs` + `FileAccessGuard.cs` + `IFileEntityScopeResolver` kayıt defteri (`"School"` çözümleyicisi: entityId==tenant SchoolId kontrolü; kayıtsız tip→deny) — SchoolAdmin(okul içi) tam; SuperAdmin yalnız view/download (izinle zaten sınırlı).
- `Commands/AttachFile/` (Aktif StoredFile şart; Version/DisplayOrder/Description), `Commands/DetachFile/` (bağ soft-delete; StoredFile'a dokunmaz), `Commands/DeleteFile/` (`MarkSoftDeleted`; bağlar da soft-delete).
- `Queries/GetFileDownloadUrl/` (guard→404; `CanBeDownloaded` değilse `FILES_NOT_SCANNED`; presigned GET 10dk + Content-Disposition override; `files.download.url-issued` audit log).
- `Queries/ListFilesByEntity/` (guard; metadata DTO listesi; Cacheable DEĞİL), `Queries/GetSchoolStorageUsage/` (`[Cacheable]` + `files.quota.view`; kullanılan/limit), `Queries/GetFileCategoryPolicy/` (kategori policy DTO — `files.view`; registry'den).
**Test:** guard sözleşme testleri (kayıtsız tip 404, School çözümleyici, cross-tenant 404) + komut/sorgu unit testleri + download-url audit log alanları asserti.
Commit `feat,test`.

### Task 4: FilesController + Uçtan Uca Entegrasyon + Kapanış

- `Api/Controllers/V1/FilesController.cs`: `POST api/v1/files` (proxy, IFormFile, `[RequestSizeLimit(26_214_400)]` 25MB), `POST api/v1/files/initiate`, `POST api/v1/files/{id}/confirm`, `POST api/v1/files/{id}/attach`, `DELETE api/v1/files/attachments/{attachmentId}`, `DELETE api/v1/files/{id}`, `GET api/v1/files/{id}/download-url`, `GET api/v1/files/by-entity/{entityType}/{entityId}`, `GET api/v1/files/usage`, `GET api/v1/files/policies/{category}`. Tek satır controller kuralı.
- Garage'a karşı handler-düzeyi uçtan uca entegrasyon testi: upload(proxy)→attach(School)→list→download-url(HttpClient ile gerçek indirme + Content-Disposition asserti)→delete akışı; iki-fazlı akış aynı zincirle.
- Faz 2 devri: Garage test cleanup `catch{}`'ine tek satır teşhis çıktısı ekle.
- Docs kapanışı (kontrolcü): `permission-matrix.md`'ye files.* satırları (✅/👁/🚫 çevirisiyle), `modules/documents/` (completion %65, api-contracts.md endpoint tablosu, permissions.md "uygulandı" işareti, OQ 5-7 arşiv), ledger.
- Kontrolcü: faz final review (fable) → fix'ler → master merge.
