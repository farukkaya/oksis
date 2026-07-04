# Documents (Dosya Yönetimi) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓░░░░░` %45 (Faz 0-2 / 5 faz tamam)   ·   Status: in-progress   ·   Güncel: 2026-07-04

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

## ⏳ Eksik / Bekleyen Yapılar

- **Faz 3:** CQRS yüzeyi (proxy upload, initiate/confirm, multipart, attach/detach/delete, download-url, listeler, policies endpoint) + `files.*` izinlerinin backend'e bağlanması + resource-scope.
- **Faz 4:** Hangfire job'ları (`VirusScanJob`, `OrphanUploadCleanupJob`, `SoftDeletePurgeJob`, `RetentionEnforcementJob`, `ThumbnailGenerationJob`) + log kataloğu + redaction.
- **Faz 5:** SchoolLogo göçü + eski `IFileStorageService`/`FileStorageService` silinmesi + web `shared/files` + logo ekranı swap.

---

## Known Gaps / Notlar

- **Seeder okulları auto-provision olmaz:** `INotificationEnqueuer` boşluğuyla tutarlı. Faz 3 mitigasyonu: upload öncesi idempotent `EnsureBucket`.
- **Garage entegrasyon test cleanup'ı sessiz catch{}:** leaked-bucket körlüğü (bir kez 29 bucket elle temizlendi). Faz 3 test işinde tek satır teşhis eklenecek.
- **Plan kusuru kaydı:** `MultipartUploadSession.PartUrls` ölü alan (plan T1 imza çelişkisi). Faz 3'te değerlendirilecek.

## ⚠️ Spec Dışına Çıkılanlar

- `2026-07-04` — spec § 3.4 `ProvisionSchoolBucket` "SuperAdmin" izni: repo'da SuperAdmin komut emsali/`TenancyMode.SuperAdminOnly` kullanımı YOK; izin anahtarı uydurulmadı, `[Tenancy(Required)]` + handler tenant-guard uygulandı, HTTP endpoint'i yok. Gelecekteki SuperAdmin onboarding endpoint'inde nitelik kararlaştırılacak. Onay: gece otonomi mandatı + reviewer.

---

## Branch Notu

Faz 0-1 işi `feature/dosya-yonetimi-faz0-1` branch'inde geliştirildi ve kullanıcı kararıyla doğrudan **master'a merge edildi** (`d752f98`, 2026-07-04, no-ff); branch silindi. Faz 2 de master'a merge oldu (`d6ce6a9`, 2026-07-04). Faz 3 master üzerinden yeni branch'le başlar.
