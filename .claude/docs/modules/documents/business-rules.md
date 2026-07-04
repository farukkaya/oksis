# Documents (Dosya Yönetimi) — Business Rules

> Bu modüle özel iş kuralları. Kaynak: `.claude/specs/dosya-yonetimi-spec.md` (bağlayıcı anlaşma) § 1, § 2.4, § 7.3.
> Genel iş kuralları için bkz. proje kökündeki `business-rules.md`.

---

## Temel İlkeler (spec § 1.3 — 4 KURAL, bağlayıcı)

### BR-documents-001: Fiziksel depolama mantıksal hiyerarşi değildir

**Kural:** Klasör hiyerarşisi (okul > sezon > modül > öğrenci) fiziksel dosya yoluna GÖMÜLMEZ. Veritabanı gerçeğin kaynağıdır; object storage yalnızca byte deposudur.

**Sebep:** Entity taşıma tek `UPDATE` olur; kullanıcıya gösterilecek klasör ağacı tamamen sanaldır ve DB'den render edilir.

**Uygulama:**
- Backend: `ObjectKey` iş anlamı taşımaz (`{AcademicYearId}/{category}/{yyyy-MM}/{fileGuid}.{ext}`); `OriginalFileName` yalnızca `Content-Disposition` ile geri verilir, asla key olmaz.

---

### BR-documents-002: Documents dışında hiçbir modül `IStorageService` göremez

**Kural:** Tüm modüller dosya işlemlerini yalnızca Documents modülünün MediatR komut/sorguları üzerinden yapar (`AttachFileCommand`, `GetFileDownloadUrlQuery` vb.). Doğrudan `IStorageService` enjeksiyonu mimari ihlaldir ve code review'da reddedilir.

**Uygulama:** Backend: `IStorageService` yalnız `Oksis.Application/Modules/Documents/Abstractions` içinde tanımlı, DI kaydı yalnız Documents servislerine yapılır (Faz 2).

---

### BR-documents-003: Documents izole dikey dilimdir, ayrı servis DEĞİLDİR

**Kural:** İki-fazlı upload'ın confirm adımı iş verisiyle aynı transaction'da yazılır. Byte trafiği `files.*` subdomain'inden Garage üzerinden akar; ayrı bir document-api uygulaması MVP'de kurulmaz (K5).

**Uygulama:** Backend: Documents `Oksis.Domain/Modules/Documents`, `Oksis.Application/Modules/Documents`, `Oksis.Infrastructure/Persistence/Configurations/Documents` altında — mevcut modül desenine (Schools) birebir uyumlu.

---

### BR-documents-004: Application katmanı AWSSDK.S3 bilmez

**Kural:** `IStorageService` ve ilişkili record'lar Application katmanındadır; `AWSSDK.S3` referansı yalnızca `Oksis.Infrastructure` projesindedir.

**Uygulama:** Backend: paket referansı (`AWSSDK.S3`) yalnız `Oksis.Infrastructure.csproj`'da (Faz 0, Task 1 Step 6).

---

### BR-documents-005: SchoolBucketProvisionedEvent idempotency

**Kural:** `SchoolBucketProvisionedEvent` her başarılı provision koşumunda YENİDEN yayınlanır (Hangfire retry semantiği) — tüketiciler idempotent olmak ZORUNDA.

**Uygulama:** Backend: event handler'ları `SchoolBucketProvisionedEvent` alınca daha önce işlenmiş bucket'a karşı idempotent davranış sergiler; `provision_id` tekil kısıtlama veya duplicate-key handling ile.

---

## CanBeDownloaded Kuralı (spec § 7.3.3)

**Kural:** İndirme yalnız `StoredFile.Status == Active && VirusScanStatus ∈ {Clean, Skipped}` iken serbesttir. `Quarantined` (tarama Pending veya Infected) durumunda indirme reddedilir — anlamlı hata döner (Faz 3'te uygulanacak).

**Uygulama:** Backend: `StoredFile.CanBeDownloaded` get-only property (domain invariant); `GetFileDownloadUrlQuery` handler'ı (Faz 3) bu bayrağı kontrol eder — presigned URL üretmeden önce reddeder.

---

## Virüs Tarama Kuralları (Faz 4)

### BR-documents-006: Tarama fail-closed'dır — daemon arızası ASLA otomatik-temiz üretmez

**Kural:** `IVirusScanner`'ın `Skipped` sonucu (tarama yapılmadı) yalnız operatörün bilinçli olarak `ClamAv:Enabled=false` seçtiği durumda üretilir. ClamAV daemon'una erişilemediğinde (`Enabled=true` iken outage) tarama `VirusScanException` fırlatır; dosya `Quarantined` kalır ve Hangfire job'ı yeniden dener. Bir altyapı arızası hiçbir koşulda dosyayı otomatik olarak "temiz" statüsüne düşürmez.

**Sebep:** `NullVirusScanner`'ın "erişilemedi = temiz say" davranışı, ClamAV daemon çöktüğünde tüm yüklemelerin sessizce taramasız geçmesine yol açan bir üretim güvenlik açığıydı (Task 1 fix round 1).

**Uygulama:** Backend: `VirusScanVerdict {Clean, Infected, Skipped}` tri-state; DI gate `Enabled=false` → `NullVirusScanner` (tek `Skipped` yolu), `Enabled=true` → HER ZAMAN `ClamAvScanner` (startup ping probu yalnız log amaçlı, kayıt kararını etkilemez).

---

### BR-documents-007: VirusScanJob, presigned yüklemelerin checksum-mutabakat noktasıdır (spec § 3.4)

**Kural:** `ConfirmFileUploadCommand` presigned (S3 Stat) yolunda istemcinin beyan ettiği SHA-256'yı gerçek içerikle karşılaştıramaz (S3 Stat yalnız ETag verir). Bu doğrulama, dosyayı tam okuyan tek nokta olan `VirusScanJob`'a ertelenmiştir: tarama sırasında `ForwardHashingStream` ile SHA-256 yeniden hesaplanır, `StoredFile.Sha256Checksum` ile uyuşmazsa dosya `Quarantined`'a çekilir (Signature=`CHECKSUM_MISMATCH`) ve Critical log yazılır.

**Uygulama:** Backend: `VirusScanJob`, indirilen stream'i `ForwardHashingStream`'e sararak ClamAV taraması ile SHA-256 hesaplamasını RAM'e tam yükleme yapmadan tek geçişte yürütür; yalnız `Verdict=Clean` yolunda checksum karşılaştırması yapılır.

---

### BR-documents-008: Thumbnail'lar ayrı `StoredFile`'lardır, `FileAttachment` DEĞİLDİR

**Kural:** `ThumbnailGenerationJob`'ın ürettiği önizleme, parent dosyaya `FileAttachment` ile değil, `StoredFile.ParentFileId` (nullable, FK constraint'siz düz çapraz-referans) ile bağlı **bağımsız bir `StoredFile` satırıdır**. Kendi kategorisi (`Thumbnail`, `RequiresVirusScan=false`) vardır ve yalnız sunucu tarafından üretilir — istemci tarafından yüklenemez (3 upload/policy handler'ında `CategoryUnknown` guard'ı ile korunur).

**Sebep:** Thumbnail bir "iş entity'sine bağlı ek" değil, parent dosyanın türetilmiş bir temsilidir; `FileAttachment`'ın polimorfik entity-bağlama modeli buraya uymaz.

**Uygulama:** Backend: `StoredFile.MarkAsThumbnailOf(parentFileId)`; çift katman sonsuz-döngü koruması (enqueuer content-type/kategori filtresi + job'da `parent.ParentFileId is not null` no-op).

---

### BR-documents-009: SoftDeletePurgeJob kota rezervasyonunu TEKRAR düşürmez

**Kural:** Kota bayt sayacı, dosya soft-delete edildiği anda (`DeleteFileCommand` veya `RetentionEnforcementJob`) `IStorageQuotaService.ReleaseAsync` ile geri alınır. `SoftDeletePurgeJob` yalnız fiziksel S3 nesnesini ve DB satırını kalıcı siler — kota rezervasyonuna bir daha DOKUNMAZ.

**Sebep:** Aynı bayt miktarının iki kez release edilmesi kota sayacını gerçek kullanımın üzerine şişirir (double-subtract).

**Uygulama:** Backend: `SoftDeletePurgeJob` ctor'unda `IStorageQuotaService` parametresi hiç YOK — çifte-release yapısal olarak imkânsız kılınmıştır (reflection testiyle doğrulanır).

---

## Logo Göçü Kuralları (Faz 5 — KTK-1/KTK-2)

### BR-documents-010: School entity'sine yazma yalnız SchoolAdmin'e açıktır

**Kural:** `"School"` entity tipi için `FileAccessGuard` intent-bazlı ayrım yapar: **Read** (indirme/listeleme) tenant-wide serbesttir (`CurrentSchoolId == entityId`); **Write** (attach/detach/delete) yalnız `school-settings.upload-logo` iznine sahip kullanıcıya (fiilen SchoolAdmin) veya SuperAdmin'e (bypass) açıktır. Teacher/Parent/Student School'a yazamaz.

**Sebep:** `files.delete`/`files.upload` izinleri Teacher ve Student'a da verilidir (kapsamlı) ve bu yüzden School yazma-kapsamını SchoolAdmin'e daraltmakta ayırt edici sinyal olarak kullanılamaz; School bir öğrencinin/öğretmenin kendi entity'si değildir (spec §4.1.3). Guard bu ayrımı taşımazsa herhangi bir tenant üyesi okul logosunu silip yerine kendi dosyasını koyabilirdi.

**Uygulama:** Backend: `IFileAccessGuard.CanAccessAsync(entityType, entityId, FileAccessIntent Read|Write, ct)`; `SchoolEntityScopeResolver` Write yolunda `IPermissionReader.HasPermissionAsync("school-settings.upload-logo")` kontrolü. Yetkisiz Write → `FILES_NOT_FOUND` (404, kaynak varlığını sızdırmama — spec §4.1.4), 403 değil.

---

### BR-documents-011: SchoolLogo yalnız public unauthenticated proxy ile servis edilir; tek gerçek kaynak `LogoStoredFileId`

**Kural:** Okul logosu, `GET /api/v1/public/schools/{schoolId}/logo` (`[AllowAnonymous]`) üzerinden servis edilir; yalnız `StoredFile.Status == Active && VirusScanStatus ∈ {Clean, Skipped}` (yani `CanBeDownloaded`) ise stream edilir, aksi halde `404` (`Cache-Control: no-store`, tarama-bekleme penceresinde stale-404 önlenir). Başarı yolu `Cache-Control: public, max-age=300`. Tek gerçek kaynak `SchoolSettings.LogoStoredFileId`'dir — okuma DTO'ları (`SchoolSettingsDetailDto`, `SchoolBrandingDto`, `InvitationTokenPreviewDto`) `LogoUrl`'ü `ISchoolLogoUrlBuilder` ile bu alandan türetir (derive-at-read), asla ham storage URL'i saklamaz.

**Sebep:** Logo, giriş öncesi de gösterilir (login branding, davet önizleme); Documents'ın standart `GetFileDownloadUrl` akışı presigned+kısa-TTL+`files.download` izni gerektirdiğinden anonim/pre-login kullanıcı için çalışmaz. Stabil public proxy hem pre-login erişimi çözer hem presigned-anonim / 24h-TTL-sızıntı risklerinden kaçınır hem de `<img src>` tarafından cache'lenebilir.

**Uygulama:** Backend: `PublicSchoolLogoController` → `GetSchoolLogoStreamQueryHandler` (`IgnoreQueryFilters()` + çift `SchoolId`/`Id` eşitliğiyle cross-tenant sızıntı imkansız kılınır — SECURITY yorumlu, test kanıtlı). `Theme.LogoUrl` VO alanı domain'de kalır ama yönetilen logo akışı artık ona yazmaz; yalnızca Faz 5 öncesi elle yazılmış eski logolar için `ISchoolLogoUrlBuilder`'ın 3. parametresi (`legacyLogoUrl`) geriye-dönük güvenlik ağı sağlar.

---

### BR-documents-012: Eski yerel-disk dosya depolama servisi emekli — tüm dosyalar Garage'da, tenant başına bucket

**Kural:** `IFileStorageService`/`FileStorageService`/`FileStorageOptions` (yerel disk, tenant-izolasyonsuz) Faz 5 Task 3'te tamamen silindi (B1 sıfır-borç — kod-tarafı grep sıfır referans). Artık **tüm** dosyalar Documents altyapısı üzerinden Garage (S3-uyumlu) object storage'a, okul başına ayrılmış bucket'a (`oksis-t{SchoolId}`) yazılır.

**Sebep:** Yerel disk depolama tenant-izolasyonu sağlamıyordu (K1 kazancının önkoşulu — bkz. K1-K6 tablosu) ve B1 "kod-tarafı sıfır borç" gereğiydi.

**Uygulama:** Backend: `src/Oksis.Infrastructure/DependencyInjection.cs`'te ilgili DI kaydı + `appsettings.json` `FileStorage` bölümü kaldırıldı; `SchoolLogo` dahil hiçbir modül artık `IFileStorageService`'e referans veremez (tip repoda yok).

---

## Retention Yorumu (bağlayıcı not — Task 4'te sabitlendi)

**Kural:** `FileCategoryPolicy.RetentionPeriod`, ilgili sezonun (`AcademicYear`) bitişinden itibaren geçerli süredir. `null` = **otomatik retention YOK** — `RetentionEnforcementJob` (Faz 4) bu kaydı hiç işlemez.

- **SchoolLogo** → `null` = **Süresiz**. Okul aktif olduğu sürece silinmez.
- **VirtualBook** → `null` = **Sözleşme süresi**. İmha, sözleşme bitiminde offboarding akışıyla (§7.4) yapılır — job kapsamı dışıdır.
- Diğer 4 kategori (`AssignmentSubmission`, `ExamDocument`, `ClubDocument`, `AnnouncementAttachment`) → somut `TimeSpan` (365 veya 730 gün).

**Sebep:** Spec'in taslak notu (§2.4: "Retention değerleri taslaktır, KVKK teyidiyle güncellenecek") somutlaştırılmıştır — bu bir spec sapması DEĞİLDİR, yorumun kayıt altına alınmasıdır.

**Not:** Kesin süreler KVKK saklama-imha politikası belgesiyle (mali müşavir/hukuk görüşü) teyit edilecek — bkz. `open-questions.md` OQ-documents-001.

---

## K1-K6 Karar Özeti (spec § 1.1 — docx analiz kararları, onaylı/tartışmaya kapalı)

| # | Karar | Seçim |
|---|---|---|
| K1 | Bucket stratejisi | Okul (tenant) başına bucket: `oksis-t{SchoolId}` — SchoolId'ye bağlı, slug DEĞİL (rename yoktur). KVKK imha tek bucket-delete ile kanıtlanır. |
| K2 | Deduplication | MVP'de KAPALI; SHA-256 checksum her dosyada saklanır (dedup ileride checksum üzerinden geri dönüşlü açılabilir). |
| K3 | Proxy / presigned eşiği | 25 MB + kategori bazlı `ForcePresigned` override (`FileCategoryPolicy`). |
| K4 | Garage public endpoint | MVP'de açılır: `files.*` subdomain + TLS (prod kurulumu Açık İş, dev'de lokal endpoint). |
| K5 | Servis topolojisi | Documents = oksis-api içinde izole vertical slice, ayrı servis değil. |
| K6 | FTP | Capability modeli (`IStorageService.Capabilities`) MVP'de hazır; `FtpStorageService` talep doğunca yazılır. |

> Tam gerekçeler için spec § 1.1 tablosuna bakılır — burada yalnız karar özetlenir, tekrar yazılmaz.

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| `Confirm` iki kez çağrılır | `DocumentsDomainException("file.confirm.invalid-status")` — yalnız `PendingUpload` confirm edilebilir |
| Tarama sonucu `Active`/`SoftDeleted` bir dosyaya yazılmaya çalışılır | `DocumentsDomainException("file.scan.invalid-status")` |
| `MarkSoftDeleted` iki kez çağrılır | `DocumentsDomainException("file.delete.already-deleted")` |
| Bilinmeyen kategori ile `GetRequired` çağrılır | `DocumentsDomainException("file.category.unknown")` |
| `FileAttachment` silinir, `StoredFile` hâlâ referanslı | `StoredFile` silinmez (FK Restrict); fiziksel silme yalnız purge job'ın (Faz 4) sorumluluğu |

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-07-04 | İlk kurallar tanımlandı (Faz 0-1 kapanışı) | `dosya-yonetimi-spec.md` § 1.3/§2.4/§7.3'ün ilk implementasyonu |
| 2026-07-04 | BR-006..009 eklendi (Faz 4 kapanışı) | Fail-closed tarama, checksum reconcile, thumbnail modeli, purge/kota ayrımı — `dosya-yonetimi-spec.md` § 3.4/§3.5 |
| 2026-07-05 | BR-010..012 eklendi (Faz 5 kapanışı — MVP tamam) | School yazma-kapsamı intent-aware guard (KTK-2), public logo proxy + derive-at-read LogoUrl (KTK-1), eski yerel-disk servis emekliliği (spec § 9) |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
