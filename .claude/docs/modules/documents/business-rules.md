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

## CanBeDownloaded Kuralı (spec § 7.3.3)

**Kural:** İndirme yalnız `StoredFile.Status == Active && VirusScanStatus ∈ {Clean, Skipped}` iken serbesttir. `Quarantined` (tarama Pending veya Infected) durumunda indirme reddedilir — anlamlı hata döner (Faz 3'te uygulanacak).

**Uygulama:** Backend: `StoredFile.CanBeDownloaded` get-only property (domain invariant); `GetFileDownloadUrlQuery` handler'ı (Faz 3) bu bayrağı kontrol eder — presigned URL üretmeden önce reddeder.

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

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
