# Documents (Dosya Yönetimi) — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, enum'lar, invariants, domain event'ler, policy registry.
> Kaynak: `.claude/specs/dosya-yonetimi-spec.md` § 2. Kod: `Oksis.Domain/Modules/Documents/`, `Oksis.Application/Modules/Documents/`.

---

## Aggregate Root(lar)

### `StoredFile`

**Sorumluluk:** Fiziksel dosyanın kaydı. Dosyanın kendisi ile bir entity'ye bağlanması ayrı kavramlardır — bağ `FileAttachment`'tadır. Object storage yalnızca byte deposudur; gerçeğin kaynağı bu kayıttır (spec §1.3 KURAL 1).

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` (`StoredFileId`) | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu, immutable |
| `AcademicYearId` | `Guid` | Sezon hard partition; object key prefix ile aynı | Zorunlu |
| `StorageProvider` | `StorageProviderType` | Sağlayıcı geçişinde eski kayıtlar eski sağlayıcıdan okunur | Zorunlu |
| `Bucket` | `string` (nvarchar 63) | `oksis-t{SchoolId}` | Zorunlu, boş olamaz |
| `ObjectKey` | `string` (nvarchar 512) | İş anlamı taşımayan deterministik anahtar | Zorunlu, boş olamaz |
| `OriginalFileName` | `string` (nvarchar 255) | İndirmede `Content-Disposition` ile geri verilir; asla key olmaz | Zorunlu, boş olamaz |
| `ContentType` | `string` (nvarchar 127) | | Zorunlu, boş olamaz |
| `SizeBytes` | `long` | | ≥ 0 |
| `Sha256Checksum` | `string?` (char 64) | Bütünlük doğrulama; dedup için rezerv (K2) | `PendingUpload`'ta null |
| `Category` | `string` (nvarchar 64) | `FileCategoryPolicy` anahtarı | Zorunlu, boş olamaz |
| `Status` | `FileStatus` | Yaşam döngüsü durumu | — |
| `VirusScanStatus` | `VirusScanStatus` | Tarama durumu | — |
| Audit | CreatedAt/By, UpdatedAt/By, DeletedAt/By, IsDeleted | Proje standardı (soft delete, `TenantEntity`) | — |

**Invariants (her zaman geçerli iş kuralı):**

- `Confirm` yalnızca `Status == PendingUpload` iken çağrılabilir (`file.confirm.invalid-status`).
- Tarama sonucu (`MarkScanClean`/`MarkScanInfected`) yalnızca `Status == Quarantined && VirusScanStatus == Pending` iken yazılabilir (`file.scan.invalid-status`).
- `MarkSoftDeleted` iki kez çağrılamaz (`file.delete.already-deleted`).
- `CanBeDownloaded` yalnızca `Status == Active && VirusScanStatus ∈ {Clean, Skipped}` iken `true`.

**Durum Makinesi (spec §2.3 + Task 2 implementasyonu):**

```
CreatePending ──Confirm(requiresVirusScan=true)──► Quarantined ──MarkScanClean──► Active
     │                                                  │
     │──Confirm(requiresVirusScan=false)──► Active      └──MarkScanInfected──► Quarantined (VirusScanStatus=Infected, kalır)
     │
CreateUploaded (proxy, requiresVirusScan=true)  ──► Quarantined (Confirm ile eşdeğer, tek adımda)
CreateUploaded (proxy, requiresVirusScan=false) ──► Active (VirusScanStatus=Skipped)

Active | PendingUpload | Quarantined ──MarkSoftDeleted──► SoftDeleted (IsDeleted=true, tekrar çağrılamaz)
```

**Davranışlar (method'lar):**

- `CreatePending(schoolId, academicYearId, provider, bucket, objectKey, originalFileName, contentType, declaredSizeBytes, category)` — İki-fazlı akışın initiate adımı (spec §3.4 `InitiateFileUploadCommand`). Boyut beyan edilendir, confirm'de gerçek boyutla ezilir.
- `CreateUploaded(..., sha256Checksum, requiresVirusScan)` — Proxy modun tek adımı (spec §3.4 `UploadFileCommand`): byte'lar zaten yazıldı.
- `Confirm(actualSizeBytes, sha256Checksum, requiresVirusScan)` — İki-fazlı akışın confirm adımı; `StatAsync` ile doğrulanan gerçek boyut/checksum yazılır.
- `MarkScanClean()` — Tarama Clean sonucu; karantina kalkar, `Active` olur.
- `MarkScanInfected(signature)` — Tarama Infected sonucu; karantinada kalır, `FileQuarantinedEvent` yayınlanır.
- `MarkSoftDeleted()` — Soft delete; 30 gün sonra purge job fiziksel imha eder (Faz 4).
- `CanBeDownloaded` — `bool` get-only property; indirme yalnız `Active` + (`Clean`|`Skipped`) iken serbesttir (spec §7.3.3).

---

### `FileAttachment`

**Sorumluluk:** Dosya ile iş entity'si arasındaki polimorfik bağ (spec §2.2). Aynı `StoredFile` N entity'ye bağlanabilir (ör. tek sanal kitap, 12 şube). Bağ silinse bile `StoredFile` silinmez — fiziksel silme purge job sorumluluğudur (spec §2.5 madde 5).

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` (`FileAttachmentId`) | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu, immutable |
| `StoredFileId` | `Guid` | FK → `StoredFiles` | Zorunlu |
| `EntityType` | `string` (nvarchar 64) | "Assignment", "Exam", "Announcement", "Club", "Branch"… | Zorunlu, boş olamaz |
| `EntityId` | `Guid` | Polimorfik hedef | Zorunlu |
| `Version` | `int` | Default 1; ödev yeniden teslimi vb. | ≥ 1 |
| `DisplayOrder` | `int` | | ≥ 0 |
| `Description` | `string?` (nvarchar 500) | | Opsiyonel |
| Audit | Standart audit + soft delete alanları | | — |

**Invariants:**

- `EntityType` boş olamaz; `Version` < 1 olamaz; `DisplayOrder` negatif olamaz.

**Davranışlar (method'lar):**

- `Create(schoolId, storedFileId, entityType, entityId, version = 1, displayOrder = 0, description = null)` — Static factory.
- `UpdateDisplayOrder(displayOrder)` — Sıralama günceller.
- `UpdateDescription(description)` — Açıklama günceller.

---

## Value Objects

### `StoredFileId`, `FileAttachmentId`

`readonly record struct` — strongly-typed ID kalıbı (`New()`, `From(Guid)`, `ToString()`).

---

## Domain Events

| Event | Tetiklenme Anı | Payload | Tüketici (Faz 4'te bağlanacak) |
|---|---|---|---|
| `FileUploadConfirmedEvent` | Confirm başarılı, `Status=Active` öncesi (Quarantined ise) | `StoredFileId, SchoolId, Category, SizeBytes, RequiresVirusScan` | `VirusScanJob` enqueue; ilgili modül side-effect'leri |
| `FileQuarantinedEvent` | Tarama Infected | `StoredFileId, SchoolId, Signature` | Bildirim (öğretmen/admin), audit Critical log |
| `FileSoftDeletedEvent` | `DeleteFileCommand` / `MarkSoftDeleted` | `StoredFileId, SchoolId` | 30 gün sonra purge kuyruğu |
| `SchoolBucketProvisionedEvent` | Onboarding bucket provisioning tamam (Faz 2 `ProvisionSchoolBucketCommand`) | `SchoolId, Bucket` | Onboarding wizard ilerleme adımı |

> Event'lerin bildirim akışları için bkz. `notifications.md` ({{TBD}} — Faz 4'te dolacak).

---

## FileCategoryPolicy Kayıt Defteri

**Sorumluluk:** Her dosya kategorisinin kuralları koda dağıtılmaz, tek registry'de yaşar (spec §2.4). Kod: `Oksis.Domain/Modules/Documents/Policies/FileCategoryPolicy.cs` (record) + `Oksis.Application/Modules/Documents/Services/FileCategoryPolicyRegistry.cs` (impl, `IFileCategoryPolicyRegistry` singleton).

```csharp
public sealed record FileCategoryPolicy(
    string Category, string[] AllowedExtensions, string[] AllowedContentTypes,
    long MaxSizeBytes, bool RequiresVirusScan, bool ForcePresigned,
    bool AllowMultipart, TimeSpan? RetentionPeriod);
```

**6 MVP kategorisi** (`FileCategories` static class sabitleri):

| Kategori | Uzantılar | Max | Tarama | Mod | Retention |
|---|---|---|---|---|---|
| AssignmentSubmission | pdf, docx, jpg, png | 20 MB | Evet | Proxy | Sezon + 1 yıl (365 gün) |
| ExamDocument | pdf | 50 MB | Evet | Eşik (25MB üstü presigned) | Sezon + 2 yıl (730 gün) |
| VirtualBook | pdf, epub | 500 MB | Evet | ForcePresigned + multipart | Sözleşme süresi (null — job dışı) |
| SchoolLogo | png, svg | 2 MB | Evet (svg riski) | Proxy | Süresiz (null) |
| ClubDocument | pdf, docx, jpg | 20 MB | Evet | Proxy | Sezon + 1 yıl (365 gün) |
| AnnouncementAttachment | pdf, jpg, png | 10 MB | Evet | Proxy | Sezon + 1 yıl (365 gün) |

> Retention yorumu ve `null` anlamı için bkz. `business-rules.md`. Kesin süreler KVKK teyidiyle güncellenecek (`open-questions.md` OQ-1).

**Registry sözleşmesi:**

- `IReadOnlyCollection<FileCategoryPolicy> All { get; }`
- `FileCategoryPolicy? Find(string category)`
- `FileCategoryPolicy GetRequired(string category)` — bilinmeyen kategori → `DocumentsDomainException` (`file.category.unknown`)

---

## İlişkiler

```
StoredFile
  └── (1:N) → FileAttachment (StoredFileId FK, Restrict — silme bile FK'yi engeller)

FileAttachment
  └── (N:1) → StoredFile
  └── (N:1, polimorfik) → {EntityType, EntityId} (ör. Assignment, Announcement, Club, Branch...)
```

---

## Yasaklar

- ❌ Public setter (constructor / factory üzerinden) — `StoredFile`/`FileAttachment` private constructor + static factory.
- ❌ Domain'de EF Core attribute (Fluent API'de yapılır — `Infrastructure/Persistence/Configurations/Documents/`).
- ❌ DataAnnotations.
- ❌ Documents dışında hiçbir modülün `IStorageService` görmesi — yalnız MediatR komut/sorguları (spec §1.3 KURAL 2).

> Genel domain kuralları için bkz. `backend/domain-model-rules.md`.
