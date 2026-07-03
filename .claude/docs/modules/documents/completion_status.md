# Documents (Dosya Yönetimi) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓░░░░░░░` %25 (Faz 0-1 / 5 faz tamam)   ·   Status: in-progress   ·   Güncel: 2026-07-04

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

## ⏳ Eksik / Bekleyen Yapılar

- **Faz 2:** `IStorageService` + capability modeli + `S3CompatibleStorageService` + `ProvisionSchoolBucketCommand`.
- **Faz 3:** CQRS yüzeyi (proxy upload, initiate/confirm, multipart, attach/detach/delete, download-url, listeler, policies endpoint) + `files.*` izinlerinin backend'e bağlanması + resource-scope.
- **Faz 4:** Hangfire job'ları (`VirusScanJob`, `OrphanUploadCleanupJob`, `SoftDeletePurgeJob`, `RetentionEnforcementJob`, `ThumbnailGenerationJob`) + log kataloğu + redaction.
- **Faz 5:** SchoolLogo göçü + eski `IFileStorageService`/`FileStorageService` silinmesi + web `shared/files` + logo ekranı swap.

## ⚠️ Spec Dışına Çıkılanlar

_Yok._ (Retention yorumunun somutlaştırılması — `business-rules.md` — spec'in kendi taslak notunun uygulanmasıdır, sapma değildir.)

---

## Branch Notu

Tüm Faz 0-1 işi `oksis-api` reposunda `feature/dosya-yonetimi-faz0-1` branch'inde. Merge/PR kararı kullanıcıya soruldu, henüz alınmadı.
