# Dosya Yönetimi Faz 4 Uygulama Planı (Hangfire Job'ları + Log Kataloğu)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Bağlayıcı: `dosya-yonetimi-spec.md` §3.5 (job'lar), §8.2 (log kataloğu + redaction), §7.1.4 (SignalR scan push).

**Goal:** 5 Hangfire job'u (VirusScan, OrphanCleanup, SoftDeletePurge, Retention, Thumbnail) + spec §8.2 log kataloğunun tamamlanması + SignalR scan-status push — gerçek ClamAV/Garage'a karşı entegrasyon testli.

**Base:** oksis-api master `7c610cd`. **Branch:** `feature/dosya-yonetimi-faz4`.

## Global Constraints

- Faz 0-3 Global Constraints geçerli (commit + **Fable trailer TAM olarak "Claude Fable 5"** — Faz 3'te 2 kez yanlış yazıldı, DİKKAT; TDD verbatim; `src/**` `_camelCase`; `dotnet format` FOREGROUND — ~15dk, arka plan watcher YOK; BOM drift checkout).
- **Yeni kütüphaneler ONAYLI (kullanıcı 2026-07-04):** `nClam` (ClamAV INSTREAM istemcisi), `SkiaSharp` (görsel resize), `PDFtoImage` (PDF ilk sayfa; SkiaSharp'a dayanır) — hepsi Infrastructure csproj'a, MIT/uyumlu lisans; csproj'da gerekçe yorumu (ClosedXML kalıbı). Central package yönetimi YOK — per-csproj ref.
- **Cross-tenant sweep kalıbı ZORUNLU** (`ExpireRoleAssignmentsJob` template): tek `IgnoreQueryFilters()` aday-keşif sorgusu (`// SECURITY:` yorumu şart) → `foreach(schoolId)` → `SetForLoginFlow(schoolId)` → filtreli re-query → mutate → SaveChanges. Cross-tenant sızıntı YOK; idempotent.
- **Fire-and-forget in-process çalışır** (Api'de Hangfire `IBackgroundJobClient` override'ı yok — mevcut sistem davranışı; notifications + bucket-provisioning de böyle). VirusScan/Thumbnail event-tetikli job'lar aynı port'tan (`IBackgroundJobClient.Enqueue<TJob>` via post-commit dispatcher) geçer — bu tutarlıdır, sapma değildir; completion_status'a not.
- **Log kataloğu redaction (spec §8.2):** structured template, string-interpolation YASAK; presigned URL/query-string ASLA loglanmaz. Job'lar HTTP dışı → CorrelationId otomatik gelmez; gerekiyorsa `LogContext.PushProperty` ile elle. Audit için `IAuditLogger` (skeleton, kullanılmıyor) DEĞİL, mevcut `ILogger` structured-event konvansiyonu (Faz 3 download/delete audit kalıbı) kullanılır.
- **Faz 3 devri (guardrail):** `SoftDeletePurgeJob` `ReleaseAsync`'i TEKRAR ÇAĞIRMAZ (kota soft-delete'te düşürüldü; purge yalnız fiziksel S3 + DB satırı). `OrphanUploadCleanupJob` başarısız-confirm rezervasyonunu ya Release eder YA TTL'e bırakır — İKİSİ değil; bu planda: orphan job `ReleaseAsync` ÇAĞIRIR (PendingUpload hiç Active olmadı, kota reserve edildi; deterministik geri alma TTL beklemekten iyi) + multipart `UploadId` saklanmadığı için terk edilmiş session'ları `AbortMultipartAsync`/`ListMultipartUploads` ile temizle.
- **Faz 3 devri (checksum §3.4):** VirusScanJob nesneyi tam okurken SHA-256'yı YENİDEN hesaplar ve `StoredFile.Sha256Checksum` ile karşılaştırır; uyuşmazlıkta quarantine + Critical log (presigned upload'ın istemci-beyan checksum'ını doğrulayan tek nokta).
- Recurring job registrasyonu `HangfireSetup.cs` `UseOksisRecurringJobs` — staggered cron (rules §9), `Hangfire:Cron:<Key>` override'lı const'lar, Europe/Istanbul TZ.

## Keşif Notları
- Recurring: `HangfireSetup.AddOksisHangfire` (config-gated) + `UseOksisRecurringJobs` `recurring.AddOrUpdate<TJob>(id, j=>j.RunAsync(ct), cron)`. Job scoped DI; örnek `ExpiredRefreshTokenCleanupJob`.
- Event→job: `INotificationHandler<DomainEventNotification<T>>` → enqueuer port → `IPostCommitDispatcher.Enqueue(()=>jobs.Enqueue<TJob>(...))`; job argümanları Hangfire-serializable primitive (Guid/enum/string).
- Tenant: `tenantContext.SetForLoginFlow(schoolId)`.
- ClamAV: nClam yok — ekle; Redis config kalıbı (connection string, graceful degradation, log-and-fallback). localhost:3310.
- SignalR: `NotificationHub` (`{schoolId}:{accountId}` group), `SignalRNotificationPusher` port impl (Application port + Api IHubContext). Mirror et.
- Time: `IDateTimeProvider.UtcNow` (domain) veya `TimeProvider` (test-fake kolay).
- Test: `ExpireRoleAssignmentsJobTests` (cross-tenant sweep, real SQL, `FixedTimeProvider`, `SystemTenantContext`, NSubstitute, FluentAssertions).

---

### Task 1: Paketler + IVirusScanner (ClamAV/nClam) + config + graceful degradation

**Files:** `Oksis.Infrastructure.csproj` (+nClam, +SkiaSharp, +PDFtoImage, gerekçe yorumlu), `Application/Modules/Documents/Abstractions/IVirusScanner.cs` (`Task<VirusScanResult> ScanAsync(Stream, ct)`; `VirusScanResult(bool IsClean, string? Signature)`), `Infrastructure/Scanning/ClamAvOptions.cs` (SectionName "ClamAv"; Host/Port/timeout), `Infrastructure/Scanning/ClamAvScanner.cs` (nClam `ClamClient` INSTREAM; ping/unreachable → `VirusScanException` veya options'a göre graceful), `Infrastructure/Scanning/NullVirusScanner.cs` (ClamAv:Enabled=false → Skipped davranışı için), `DependencyInjection.cs` (config-gated kayıt: ClamAv erişilebilir→ClamAvScanner, değilse Null + warning log — Redis kalıbı), `appsettings.Development.json` (`ClamAv` bölümü: Host localhost, Port 3310, Enabled true).
**Test:** `tests/Oksis.Infrastructure.IntegrationTests/Modules/Documents/ClamAvScannerIntegrationTests.cs` — gerçek ClamAV (localhost:3310): (1) temiz stream → IsClean; (2) **EICAR test imzası** (`X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*`) → !IsClean + Signature dolu. Fixture ClamAV yoksa açıklayıcı exception (sessiz skip YOK — Garage fixture kalıbı). ClamAV healthy olması gerekir (docker; imza DB indirmesi ilk açılışta birkaç dk — job/test öncesi hazır varsay, değilse fixture net mesaj versin).
Commit `feat,test`.

### Task 2: VirusScanJob (event-tetikli) + SHA-256 reconcile + SignalR scan push

**Files:**
- `Application/Modules/Documents/Abstractions/IFileScanStatusPusher.cs` (port: `PushScanCompletedAsync(Guid schoolId, Guid fileId, FileStatus, VirusScanStatus, ct)`), `Api/Hubs/` impl `FileScanStatusPusher.cs` (`IHubContext<NotificationHub>` veya yeni hub — NotificationHub group kalıbını izle; account bilinmiyorsa school-group'a push, hub group tasarımına göre karar ver + raporla).
- `Application/Modules/Documents/Events/FileUploadConfirmedScanEnqueuer.cs` (`INotificationHandler<DomainEventNotification<FileUploadConfirmedEvent>>` → `RequiresVirusScan` ise enqueuer.Enqueue(schoolId, fileId)), enqueuer port + `Infrastructure` Hangfire adapter (bucket-provision enqueuer kalıbı).
- `Infrastructure/BackgroundJobs/Jobs/VirusScanJob.cs`: `SetForLoginFlow(schoolId)` → StoredFile yükle (Pending-scan/Quarantined + VirusScan=Pending değilse no-op idempotent) → `IStorageService.DownloadAsync` → **tek geçişte** hem `IVirusScanner.ScanAsync` hem SHA-256 recompute (stream'i iki tüketici için: önce buffer'sız tee YOK; pratik: indir→geçici işlemede önce checksum hesapla sonra tara VEYA scanner'a HashingStreamWrapper sarılı stream ver — RAM'e tam yükleme YASAK, stream stratejisini raporla). Sonuç: Clean + checksum eşleşir → `MarkScanClean()`; Infected → `MarkScanInfected(sig)` + Critical log (`files.scan.infected`: FileId, SchoolId, Signature, UploadedByUserId); checksum uyuşmazlığı → `MarkScanInfected("CHECKSUM_MISMATCH")` benzeri + Critical. Log `files.scan.clean` (FileId, SchoolId, DurationMs). SaveChanges (event'ler dispatch). Sonra `IFileScanStatusPusher.PushScanCompletedAsync`.
**Test:** integration (gerçek ClamAV+Garage): temiz dosya upload→confirm→job→Active+Clean; EICAR→Quarantined+Infected+event; checksum uyuşmazlığı senaryosu (StoredFile'a yanlış checksum yazıp) → Infected. SignalR pusher unit (NSubstitute IHubContext). Job idempotency (ikinci koşu no-op).
Commit(ler) `feat,test`.

### Task 3: Cross-tenant Sweep Job'ları (Orphan + Purge + Retention)

**Files (hepsi `Infrastructure/BackgroundJobs/Jobs/`, `ExpireRoleAssignmentsJob` kalıbı):**
- `OrphanUploadCleanupJob.cs` (saatlik cron): IgnoreQueryFilters ile PendingUpload + CreatedAt < now-24h aday SchoolId'ler → per-tenant → StoredFile sil (DB) + `IStorageService.DeleteAsync` (varsa) + `AbortMultipartAsync`/`ListMultipartUploads` terk session temizliği + `IStorageQuotaService.ReleaseAsync` + log `files.upload.orphan-cleaned` (FileId, SchoolId, AgeHours, Warning).
- `SoftDeletePurgeJob.cs` (günlük): SoftDeleted + DeletedAt < now-30gün aday'lar → per-tenant → `IStorageService.DeleteAsync` (fiziksel) + DB satırını KALICI sil (hard delete — IgnoreQueryFilters gerekebilir, soft-delete filtresi için) + log `files.purge.physical` (data.delete.kvkk; FileId, SchoolId, RetentionRule, Information). **ReleaseAsync ÇAĞIRMA** (guardrail — kota zaten düşürüldü).
- `RetentionEnforcementJob.cs` (günlük): her kategori policy `RetentionPeriod` (null hariç) için, ilgili sezon bitişi + retention < now olan Active dosyalar → `MarkSoftDeleted()` (+kota Release, DeleteFile ile aynı semantik) → sezon-bitiş tarihini AcademicYear'dan çöz (mevcut sezon erişim kalıbı). RetentionPeriod null (SchoolLogo süresiz, VirtualBook sözleşme) job KAPSAMI DIŞI.
**Test:** her job için integration (cross-tenant sweep template test): sadece uygun satır etkilenir (yaşı dolmayan/başka tenant dokunulmaz), idempotency (ikinci koşu 0), `FixedTimeProvider` ile yaş sınırı. Orphan multipart abort mock/gerçek.
Commit(ler) `feat,test`.

### Task 4: ThumbnailGenerationJob + Log Kataloğu tamamlama + Recurring registrasyon + Kapanış

**Files:**
- Domain: `StoredFile`'a nullable `ParentFileId Guid?` + `MarkAsThumbnailOf(Guid parentId)` (thumbnail ayrı StoredFile, parent ilişkili — spec §3.5) + migration; `Category` "Thumbnail" sabiti registry'ye (veya parent'ın kategorisini miras — karar: ayrı `Thumbnail` kategorisi, RequiresVirusScan=false, presigned=false, retention parent'la aynı düşünülür ama job basit tutar). EF config + migration.
- `Infrastructure/Imaging/ThumbnailGenerator.cs` (SkiaSharp resize [görsel] / PDFtoImage ilk sayfa [pdf]; max boyut ~320px; jpg/png çıktı), `Application` port `IThumbnailGenerator`.
- `Infrastructure/BackgroundJobs/Jobs/ThumbnailGenerationJob.cs`: FileUploadConfirmedEvent tetikli (görsel/pdf content-type filtresi), parent indir → thumbnail üret → yeni StoredFile (ParentFileId set, Thumbnail kategori) upload + kaydet. Enqueuer (Task 2 kalıbı; scan+thumbnail aynı event'ten iki ayrı enqueue).
- **Log kataloğu tamamlama (spec §8.2):** retroaktif `files.upload.initiated` (InitiateFileUpload handler — FileId, SchoolId, Category, SizeBytes, Mode, CorrelationId) + `files.upload.confirmed` (ConfirmFileUpload — FileId, SchoolId, SizeBytes, ChecksumMatch, CorrelationId). Redaction doğrulama testi (URL loglanmıyor — mevcut kalıp).
- `HangfireSetup.cs`: OrphanUpload (saatlik `"0 * * * *"`), SoftDeletePurge (günlük stagger), Retention (günlük stagger) recurring kaydı; cron const'lar `Hangfire:Cron:*` override'lı.
- **Kapanış (kontrolcü):** completion_status %85 + Faz 4 bloğu + guardrail'lerin kapandığı; log kataloğu tam tablosu business-rules/api-contracts; faz final review (fable) → fix'ler → **master merge**.
**Test:** thumbnail integration (gerçek: png upload→job→thumbnail StoredFile ParentFileId'li + indirilebilir; pdf ilk sayfa). Log event unit testleri (fake logger, alan asserti). Domain ParentFileId unit.
Commit(ler) `feat,test`.
