# Documents (Dosya Yönetimi) — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Kaynak: `.claude/specs/dosya-yonetimi-spec.md` § 3.4/§7 + `dosya-yonetimi-faz3-plan.md` Task 4 + `FilesController` (Faz 3, commit `2c3b9a1`).
> Tüm endpoint'ler `[Authorize]` (sınıf düzeyi) + tek satır controller kuralı: `ISender.Send(...)` → `result.ToHttpResult(HttpContext)`. İzin/tenancy kontrolü controller'da DEĞİL, ilgili komut/sorgunun `[RequirePermission]`/`[Tenancy(Required)]` attribute'larında (pipeline).
>
> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

---

## Endpoint Özeti

| Method | Path | Command/Query | Permission | Notlar |
|---|---|---|---|---|
| POST | `/api/v1/files` | `UploadFileCommand` (proxy) | `files.upload` | `[FromForm] IFormFile` + `[RequestSizeLimit(26_214_400)]` (25 MB, K3 eşiği). `FileSizeBytes` istemci beyanından DEĞİL, `file.Length` (Kestrel ölçümü) ile doldurulur. Dönüş: `StoredFileDto`, 200. |
| POST | `/api/v1/files/initiate` | `InitiateFileUploadCommand` | `files.upload` | İki-fazlı/multipart başlatma; policy `ForcePresigned`/boyut>25MB veya `AllowMultipart` ise presigned mod. Dönüş: `InitiateFileUploadResultDto` (fileId, mode, uploadUrl?/uploadId?+partUrls?+partSize), 200. |
| POST | `/api/v1/files/{id}/confirm` | `ConfirmFileUploadCommand` (route `{id}` → `FileId`) | `files.upload` | `ExistsAsync`-önce; multipart ise `CompleteMultipartAsync`; beyan≠gerçek boyut → `FILES_POLICY_VIOLATION`. Dönüş: `StoredFileDto`, 200. |
| POST | `/api/v1/files/{id}/attach` | `AttachFileCommand` (route `{id}` → `FileId`) | `files.upload` | `Quarantined` durumundaki dosya KABUL edilir (tarama sürerken bağlanabilir); `PendingUpload`/`SoftDeleted` → `FILES_INVALID_STATUS`. Kayıtsız `EntityType`/kapsam dışı `EntityId` → `FILES_NOT_FOUND` (404). Dönüş: `FileAttachmentDto`, 200. |
| DELETE | `/api/v1/files/attachments/{attachmentId}` | `DetachFileCommand` | `files.delete` | Bağı soft-delete eder; `StoredFile`'a dokunmaz. 204. |
| DELETE | `/api/v1/files/{id}` | `DeleteFileCommand` | `files.delete` | `StoredFile.MarkSoftDeleted()` + dosyanın TÜM bağları soft-delete; bağlardan herhangi biri kapsam dışıysa 404. Audit log `files.delete.soft` + kota `ReleaseAsync`. 204. |
| GET | `/api/v1/files/{id}/download-url` | `GetFileDownloadUrlQuery` | `files.download` | Kapsam dosyanın bağlarından çözülür (client entity vermez). `!CanBeDownloaded` (henüz taranmadı) → `FILES_NOT_SCANNED` (409). 10 dk presigned GET + RFC 5987 Content-Disposition override. Her çağrı audit'e yazılır: `files.download.url-issued` (FileId, SchoolId, RequestedByUserId, TtlMinutes, EntityType, EntityId) — presigned URL/imza ASLA loglanmaz. Dönüş: `FileDownloadUrlDto`, 200. |
| GET | `/api/v1/files/by-entity/{entityType}/{entityId}` | `ListFilesByEntityQuery` | `files.view` | Guard → 404 (kayıtsız tip/kapsam dışı). `[Cacheable]` DEĞİL (durum sık değişir). Dönüş: `IReadOnlyList<ListedFileDto>` (DisplayOrder sıralı), 200. |
| GET | `/api/v1/files/usage` | `GetSchoolStorageUsageQuery` | `files.quota.view` | `[Cacheable(60, Key="storage-usage")]`. Dönüş: `StorageUsageDto` (UsedBytes/LimitBytes), 200. |
| GET | `/api/v1/files/policies/{category}` | `GetFileCategoryPolicyQuery` | `files.view` | Registry'den kategori policy'si; bilinmeyen kategori → `FILES_CATEGORY_UNKNOWN`. `[Tenancy(Required)]` — anonim erişim yok (bkz. `completion_status.md` Known Gaps, Faz 5 revisit). Dönüş: `FileCategoryPolicyDto`, 200. |

---

## Hata Kodları (`FILES_*`)

`ResultExtensions.MapStatusCode` bloğu (commit `10acbfa`): `FILES_NOT_FOUND`→404, `FILES_QUOTA_EXCEEDED`→422, `FILES_NOT_SCANNED`→409, diğerleri (`FILES_POLICY_VIOLATION`, `FILES_INVALID_STATUS`, `FILES_CATEGORY_UNKNOWN`, `FILES_NO_ACTIVE_SESSION`)→422.

İzin ihlali → 403 (pipeline `AuthorizationBehavior`); kapsam ihlali (guard-red) → 404 (`FILES_NOT_FOUND`) — kaynağın varlığını sızdırmamak için.

---

## Yasaklar

- ❌ Verb in URL (`/createUser`) — sub-resource veya HTTP method kullan.
- ❌ Snake_case path — kebab-case.
- ❌ Inconsistent envelope.

> Detay: `backend/api-design-rules.md`.
