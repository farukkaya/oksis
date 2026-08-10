# Documents (Dosya Yönetimi) — Notifications

> Bu modülün domain event → bildirim/log eşleştirmeleri.
> Genel akış için bkz. `backend/notification-rules.md` (teknik) ve `notification-matrix.md` (içerik).

---

## Mevcut Durum (Faz 4 kapanışı)

Documents modülünde şu an **kullanıcıya yönelik push/in-app bildirim akışı (`INotificationRecipientResolver`) bağlı DEĞİL** — domain event'ler (`FileQuarantinedEvent` vb., bkz. `domain-model.md`) var ama Outbox → `INotificationDispatcher` zincirine henüz bir tüketici takılmadı (B2: davranışsal tüketiciler — ödev/duyuru/sanal kitap — bağlandığında gündeme gelecek).

Faz 4'te tamamlanan, modülün **operasyonel gözlemlenebilirlik** yüzeyidir:

1. Spec § 8.2 log kataloğu (Serilog → ELK) — aşağıdaki tablo.
2. SignalR canlı tarama-durumu push'u (`school:{schoolId}` grubu) — kullanıcı arayüzünü "yenile" sinyali, klasik recipient-resolver akışı değil.

---

## Log Kataloğu (spec § 8.2 — implemented)

Structured logging zorunlu; `Console.WriteLine` ve string-interpolation'lı log YASAK.

| Olay | Seviye | Zorunlu Alanlar | Nerede |
|---|---|---|---|
| `files.upload.initiated` | Information | FileId, SchoolId, Category, SizeBytes, Mode (`Single`/`Multipart`) | `InitiateFileUploadCommandHandler` (Faz 4 Task 4 — retroaktif eklendi) |
| `files.upload.confirmed` | Information | FileId, SchoolId, SizeBytes, ChecksumMatch | `ConfirmFileUploadCommandHandler` (Faz 4 Task 4 — retroaktif eklendi; **ChecksumMatch her zaman `true`** — bkz. not aşağıda) |
| `files.upload.orphan-cleaned` | Warning | FileId, SchoolId, AgeHours | `OrphanUploadCleanupJob` (Faz 4 Task 3) |
| `files.scan.clean` | Information | FileId, SchoolId, DurationMs | `VirusScanJob` (Faz 4 Task 2) |
| `files.scan.infected` | Critical | FileId, SchoolId, Signature, UploadedByUserId | `VirusScanJob` — hem gerçek ClamAV pozitifi hem checksum-mutabakat başarısızlığı (Signature=`CHECKSUM_MISMATCH`) bu olayı kullanır |
| `files.download.url-issued` | Information (audit) | FileId, SchoolId, RequestedByUserId, TtlMinutes, EntityType, EntityId | `GetFileDownloadUrlQueryHandler` (Faz 3) |
| `files.delete.soft` | Information | FileId, SchoolId, DeletedByUserId | `DeleteFileCommandHandler` (Faz 3) |
| `files.purge.physical` | Information (`data.delete.kvkk`) | FileId, SchoolId, RetentionRule (`"soft-delete.30d"`) | `SoftDeletePurgeJob` (Faz 4 Task 3) |
| `files.retention.enforced` | Information | FileId, SchoolId, Category, RetentionDays | `RetentionEnforcementJob` (Faz 4 Task 3 — spec § 8.2 tablosunda ayrı satırı yok; mevcut kataloğa eklenen tutarlılık kaydı, spec sapması değil) |
| `files.thumbnail.skipped-oversize` | Information | FileId, SchoolId, SizeBytes | `ThumbnailGenerationJob` (Faz 4 Task 4 fix round 1 — 25 MB üst-boyut kapısı) |
| `files.storage.error` | Error | Bucket, ObjectKey, Operation, Provider + exception | Storage servis katmanı (Faz 2) |
| `tenant.mismatch` | Critical | Proje standardı — `TenantMismatchException` ile | Cross-cutting |

**ChecksumMatch notu:** `files.upload.confirmed` bu alanı her zaman `true` yazar çünkü `ConfirmFileUploadCommandHandler` presigned yolda yalnız `StatAsync` ile boyutu doğrular, byte içeriğini görmez. Gerçek içerik-checksum mutabakatı `VirusScanJob`'da (dosyayı tam okuyan tek nokta) asenkron yapılır; uyuşmazlık ayrı bir `files.scan.infected` (Signature=`CHECKSUM_MISMATCH`) satırıyla raporlanır — bkz. `completion_status.md` ⚠️ Spec Dışına Çıkılanlar ve `business-rules.md` BR-documents-007.

**Redaction (KURAL):** Presigned URL/query-string (`X-Amz-Signature` vb.) hiçbir log satırında YER ALMAZ; yalnızca Bucket + ObjectKey + TTL yazılır. Tüm satırlar structured template kullanır (string-interpolation yasak).

**CorrelationId — ambient enrichment, ayrı alan DEĞİL:** Spec § 8.2 tablosu `files.upload.initiated`/`files.upload.confirmed` için CorrelationId'yi zorunlu alan sayar, ama Faz 4 implementasyonunda bu alan her log çağrısına elle eklenmez. `CorrelationIdMiddleware` (`Api/Middleware/CorrelationIdMiddleware.cs`) her HTTP isteğinde `Serilog.Context.LogContext.PushProperty` ile CorrelationId'yi ambient context'e yazar; bu iki handler HTTP/MediatR pipeline'ı içinde çalıştığından tüm log satırlarına otomatik iliştirilir (ELK'te alan yine mevcuttur, yalnızca kod tarafında per-call parametre olarak taşınmaz). Job tetikli olaylar (`files.scan.*`, `files.purge.*`, `files.retention.*`, `files.upload.orphan-cleaned`, `files.thumbnail.skipped-oversize`) HTTP isteği DIŞINDA (Hangfire) çalıştığından CorrelationId ambient olarak gelmez — bu olaylarda zaten spec tablosu CorrelationId'yi zorunlu alan olarak İSTEMEZ (yalnız initiate/confirm için ister), dolayısıyla bu tutarlıdır.

---

## SignalR Canlı Tarama-Durumu Push'u (Faz 4 Task 2)

`IFileScanStatusPusher.PushScanCompletedAsync(schoolId, fileId, FileStatus, VirusScanStatus, ct)` — `VirusScanJob` tarama sonucunu SaveChanges sonrası bu port üzerinden yayınlar.

- **Hedef grup:** `NotificationHub`'a eklenen okul-geneli broadcast grubu `school:{schoolId}` (mevcut `{schoolId}:{accountId}` tek-account grubundan ayrı, ek/additive — mevcut davranış değişmedi). Spec'in port imzası `accountId` taşımadığından (yalnız `schoolId`+`fileId`), okula bağlı TÜM kullanıcılar push'u alır.
- **Payload:** yalnızca `{ fileId, status, virusScanStatus }` — iki enum + bir GUID. **Hiçbir PII veya URL içermez.**
- **Yetki notu:** Push'ta ayrıca bir yetki kontrolü YOK; zararsız kabul edilmiştir çünkü gerçek yetki zaten liste/indirme uç noktalarında zorunlu kılınır — bu push salt "ilgili dosyaysa arayüzü yenile" sinyalidir, istemci kendi görüntülemediği `fileId`'yi yok sayar.
- **Trade-off / gelecek:** Uploader-özel push gerekirse port imzasına `accountId` eklenmesi gerekir (spec revizyonu ister) — bkz. Faz 4 Task 2 raporu.

---

## Yasaklar

- ❌ Sync olarak Command handler içinde bildirim göndermek (queue zorunlu).
- ❌ Template'de TCKN, telefon, email gibi PII.
- ❌ Cross-tenant alıcı (recipient `SchoolId` farklıysa).
- ❌ Log satırlarında presigned URL/query-string veya string-interpolation.
