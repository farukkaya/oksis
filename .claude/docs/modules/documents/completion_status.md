# Documents (Dosya Yönetimi) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓▓░░░` %65 (Faz 0-3 / 5 faz tamam)   ·   Status: in-progress   ·   Güncel: 2026-07-04

---

## ✅ Tamamlanan Yapılar

- **Faz 0 — Dev Altyapı (commit `889ce67`):** docker-compose'a Garage (S3-uyumlu, tek-node) + ClamAV servisleri, `docker/garage/garage.toml`, idempotent `scripts/init-garage.sh`, `AWSSDK.S3` paketi (yalnız `Oksis.Infrastructure`), `appsettings.Development.json` `Storage:S3` bölümü.
- **Faz 1 — Domain + Persistence:**
  - `StoredFile` entity'si + `FileStatus`/`VirusScanStatus`/`StorageProviderType` enum'ları + 4 domain event + durum makinesi (12 unit test — commit `feba1e4`).
  - `FileAttachment` polimorfik bağ entity'si (4 unit test — commit `2ac4e07`).
  - `FileCategoryPolicy` kayıt defteri, 6 MVP kategorisi (6 unit test — commit `f799f30`; naming düzeltmesi `_mb`/`_policies` — commit `a401265`).
  - EF persistence: `[files].stored_files` + `file_attachments`, spec § 2.5 index'leri (`ix_stored_files_school_status`, `ix_stored_files_school_checksum`, `ux_stored_files_bucket_object_key`, `ix_file_attachments_entity`) + EF otomatik FK index'i, `stored_file_id` FK Restrict, tenant global query filter, migration `20260704_documents_stored_files` (fiziksel prefix UTC `20260703215538_`; commit `e04653a`).
  - Build + tüm test suite yeşil doğrulandı (2204/2205, 1 bilinen pre-existing flake — Documents ile ilgisiz).
  - Final whole-branch review (2026-07-04): **merge onaylı (Yes)**, sıfır Critical/Important; iki dokunuş uygulandı — csproj yorum konumu + `Confirm` negatif boyut guard'ı + regression testi (13. StoredFile testi — commit `bb49ff1`). Devirler `open-questions.md` OQ-documents-008'de.
- **Faz 2 — Depolama Soyutlaması + S3 + Provisioning:** `IStorageService` abstraction (spec § 3.2 + capability modeli, 3 onaylı multipart eki — commit `2cc17c8`); `S3CompatibleStorageService` Garage entegrasyon testleri 9/9 gerçek uçtan uca (UseChunkEncoding=false + presigned scheme fix — T1'in çalışmayan upload'ını yakaladı — commit `f5c4089`); `ProvisionSchoolBucket` + `SchoolCreatedEvent` otomatik provisioning (post-commit Hangfire, idempotent — commit `ef08bbb`); final review YES (reviewer 10/10 entegrasyonu kendisi yeniden koştu), master merge `d6ce6a9`.
- **Faz 3 — CQRS Yüzeyi + Permissions:**
  - **İzin altyapısı:** `files.*` 6 izin + 20 `role_permission` satırı seed'lendi (SuperAdmin 4, SchoolAdmin 5, Teacher 4, Parent 3, Student 4), `FILES_*` hata kodları + `ResultExtensions.MapStatusCode` bloğu (commit `10acbfa`).
  - **Upload orkestrasyonu:** proxy (`UploadFile`) + iki-fazlı/multipart (`InitiateFileUpload`/`ConfirmFileUpload`), `HashingStreamWrapper` (checksum-sırasında-hesaplama, seekable guard — Garage'a karşı ampirik doğrulandı: non-seekable+known-length SigV4 ile çalışmıyor, guard `!CanSeek`'e genişletildi), RFC 5987 `ContentDispositionBuilder`, `IStorageQuotaService`/`StorageQuotaService` (Redis sayaç + DB SUM reconcile) (commits `9b763f4`/`143e7a7`).
  - **Bağ/yaşam döngüsü + sorgular:** `AttachFile`/`DetachFile`/`DeleteFile` + `IFileAccessGuard`/`FileAccessGuard` (kayıt-defteri, `"School"` çözümleyici canlı, kayıtsız tip → 404) + `GetFileDownloadUrl` (audit `files.download.url-issued` + Content-Disposition override) + `ListFilesByEntity`/`GetSchoolStorageUsage` (`[Cacheable]`)/`GetFileCategoryPolicy` (commit `24bb3d7`); review fix — silme audit logu (`files.delete.soft`) + kota `ReleaseAsync` (commit `00e3b8b`).
  - **`FilesController`:** 10 endpoint (`api/v1/files` proxy/initiate/confirm/attach/detach/delete/download-url/by-entity/usage/policies) + Garage'a karşı iki-fazlı uçtan uca entegrasyon testi (commit `2c3b9a1`).
  - Branch `feature/dosya-yonetimi-faz3` (`10acbfa`→`2c3b9a1`), henüz **master'a merge edilmedi** — final review + merge kontrolcüde.

## ⏳ Eksik / Bekleyen Yapılar

- **Faz 4:** Hangfire job'ları (`VirusScanJob`, `OrphanUploadCleanupJob`, `SoftDeletePurgeJob`, `RetentionEnforcementJob`, `ThumbnailGenerationJob`) + log kataloğu + redaction.
- **Faz 5:** SchoolLogo göçü + eski `IFileStorageService`/`FileStorageService` silinmesi + web `shared/files` + logo ekranı swap.

---

## Known Gaps / Notlar

- **Seeder okulları auto-provision olmaz:** `INotificationEnqueuer` boşluğuyla tutarlı. Faz 3 mitigasyonu: upload öncesi idempotent `EnsureBucket`.
- **Garage entegrasyon test cleanup'ı sessiz catch{}:** leaked-bucket körlüğü (bir kez 29 bucket elle temizlendi). Faz 3 test işinde tek satır teşhis eklenecek.
- **Plan kusuru kaydı:** `MultipartUploadSession.PartUrls` ölü alan (plan T1 imza çelişkisi). Faz 3'te değerlendirilecek.
- **FAZ 4 GUARDRAIL:** `SoftDeletePurgeJob` `ReleaseAsync`'i TEKRAR çağırmamalı — bayt kota sayacından `DeleteFileCommand` anında (soft-delete'te) düşürülmüştür; purge job yalnız fiziksel S3 nesnesini siler, kota rezervasyonuna dokunmaz (bkz. Faz 3 Task 3 fix-round-1).
- **`GetFileCategoryPolicy` Tenancy-Required:** query şu an `[Tenancy(Required)]` + `files.view` gerektiriyor; anonim/login-öncesi policy okuma ihtiyacı doğarsa Faz 5'te revisit edilecek.
- **🔴 FAZ 5 SERT ÖN KOŞUL — School yazma-kapsamı (final review Important #2):** `SchoolEntityScopeResolver` "School" entity'sini tenant içindeki HER role açar (yalnız `entityId==SchoolId` bakar). Matriste Student/Teacher `files.delete` + herkes `files.upload` tuttuğu için, logo Faz 5'te `entityType="School"`'a bağlandığı AN bir Student okul logosunu soft-delete/detach edip yerine kendi dosyasını attach edebilir (spec §4.1.3 ihlali — School öğrencinin entity'si değil). Bugün tüketici yok, veri riski yok; ama **logo swap'tan ÖNCE** guard intent-aware olmalı: `CanAccessAsync(entityId, FileAccessIntent Read|Write)` → School: Read=tenant, Write=SchoolAdmin-only (veya School resolver write yolunda rol kontrolü). Faz 5 planına ön-görev olarak girer.
- **FAZ 4 devri — orphan job kota semantiği (final review Minor #8):** başarısız confirm rezervasyonu tutar; `OrphanUploadCleanupJob` ya `ReleaseAsync` çağırır YA DA TTL reconcile'a bırakır — İKİSİ BİRDEN double-subtract eder. Ayrıca `StoredFile` multipart `UploadId` saklamıyor → orphan job terk edilmiş session'ları `ListMultipartUploads` ile abort etmeli (Garage destekliyor). Karar Faz 4'te verilip kaydedilecek.

- `2026-07-04` — Faz 4 Task 3 (OrphanUploadCleanupJob): plan (faz4-plan Global Constraints) terk edilmiş **multipart session abort** temizliğini (`ListMultipartUploads`+`AbortMultipartAsync`) öngörüyordu; ancak `IStorageService`'te `ListMultipartUploads` YOK ve `StoredFile` `UploadId` saklamıyor (`InitiateFileUpload` yalnız istemciye döndürüyor). Bu deliverable UYGULANMADI (best-effort tek-nesne silme yapıldı). Etki SINIRLI: yalnız presigned (VirtualBook) init-edilip-confirm-edilmeyen nadir durumda terk parçalar object store'da birikir — veri/tenant riski yok; S3/Garage provider lifecycle kuralı da temizleyebilir. **Backlog: `StoredFile.UploadId` kolonu + `IStorageService.ListMultipartUploads` → orphan job abort.** Onay: gece otonomi (sınırlı etki, kod fix ertelendi); sabah kullanıcıya sunulacak.

## ⚠️ Spec Dışına Çıkılanlar

- `2026-07-04` — spec § 3.4 `ProvisionSchoolBucket` "SuperAdmin" izni: repo'da SuperAdmin komut emsali/`TenancyMode.SuperAdminOnly` kullanımı YOK; izin anahtarı uydurulmadı, `[Tenancy(Required)]` + handler tenant-guard uygulandı, HTTP endpoint'i yok. Gelecekteki SuperAdmin onboarding endpoint'inde nitelik kararlaştırılacak. Onay: gece otonomi mandatı + reviewer.
- `2026-07-04` — Faz 3 Task 1 (`files.*` izin altyapısı): permissions.md/faz3-plan matrisindeki "Secretary→view,upload,download" hedef ataması **seed'lenmedi** — Secretary rolü MVP seed'inde yok (Issue #1, 5-rol seti: SuperAdmin/SchoolAdmin/Teacher/Parent/Student). Aynı DUTIES modülü emsali izlendi ("Secretary→duties.view eşlemesi ertelendi"). Diğer 5 rol matrisle birebir seed'lendi (SuperAdmin 4, SchoolAdmin 5, Teacher 4, Parent 3, Student 4). Secretary rolü seed'lendiğinde `RolePermissionSeedData.cs`'e eklenecek. Onay: plan kendisi (dosya-yonetimi-faz3-plan.md Task 1) + kod emsali.
- `2026-07-04` — spec § 3.6.1 **kategori başına kota** uygulanmadı (final review Important #3): spec "okul başına toplam **ve kategori başına** kota" der; plan yalnız okul-toplam kotayı (`FILES_QUOTA_TOTAL_BYTES`) tanımladı, `StorageQuotaService` buna sadık kaldı (plan kusuru → uygulama doğru izledi). Kategori-başına kota gerektiğinde `IStorageQuotaService`'e kategori boyutu eklenir. Onay: plan + reviewer; kod değişikliği ertelendi (tüketici yok).
- `2026-07-04` — spec § 3.4 Confirm **checksum doğrulaması** (final review Important #4): spec "StatAsync ile ... checksum doğrulama" der ama S3 Stat yalnız ETag (MD5/multipart) verir, SHA-256 vermez → presigned upload'da `Sha256Checksum` istemci beyanıdır (shape-only doğrulandı). Ucuz çözüm Faz 4'e verildi: **VirusScanJob zaten nesneyi tam okuyor — aynı geçişte SHA-256 yeniden hesaplayıp saklanan değerle karşılaştırsın, uyuşmazlıkta quarantine/flag.** Boyut yalanı StatAsync'le engellendi; confirm-without-initiate imkânsız (PendingUpload satırı gerekir); cross-tenant confirm global filter'la bloklu. Onay: spec-ifade kusuru + reviewer.

---

## Branch Notu

Faz 0-1 işi `feature/dosya-yonetimi-faz0-1` branch'inde geliştirildi ve kullanıcı kararıyla doğrudan **master'a merge edildi** (`d752f98`, 2026-07-04, no-ff); branch silindi. Faz 2 de master'a merge oldu (`d6ce6a9`, 2026-07-04). Faz 3, `feature/dosya-yonetimi-faz3` branch'inde (base `d6ce6a9`, commit'ler `10acbfa`→`2c3b9a1`) tamamlandı; **henüz master'a merge edilmedi** — final review + merge kontrolcüde.
