# Documents (Dosya Yönetimi) — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.
> Kaynak: `.claude/specs/dosya-yonetimi-spec.md` § 2.5. Migration: `20260703_documents_stored_files`
> (`oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/Documents/`).

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Şema

`[files]` — yeni schema sabiti (`OksisSchemas.Files`), `ToFilesTable(name)` extension ile bağlanır.

---

## Tablolar

### `[files].stored_files`

```sql
CREATE TABLE [files].stored_files (
    id                  uniqueidentifier  not null  constraint pk_stored_files primary key,
    school_id           uniqueidentifier  not null,
    academic_year_id    uniqueidentifier  not null,
    storage_provider    int               not null,   -- enum StorageProviderType (1=S3Compatible, 2=Ftp)
    bucket              nvarchar(63)      not null,
    object_key          nvarchar(512)     not null,
    original_file_name  nvarchar(255)     not null,
    content_type        nvarchar(127)     not null,
    size_bytes          bigint            not null,
    sha256checksum      char(64)          null,       -- DİKKAT: kolon adı "sha256checksum" (alt çizgisiz) — bkz. not aşağıda
    category            nvarchar(64)      not null,
    status              int               not null,   -- enum FileStatus (1=PendingUpload,2=Active,3=Quarantined,4=SoftDeleted)
    virus_scan_status   int               not null,   -- enum VirusScanStatus (1=Pending,2=Clean,3=Infected,4=Skipped)
    created_at          datetimeoffset    not null,
    created_by          uniqueidentifier  not null,
    updated_at          datetimeoffset    null,
    updated_by          uniqueidentifier  null,
    is_deleted          bit               not null  constraint df_stored_files_is_deleted default 0,
    deleted_at          datetimeoffset    null,
    deleted_by          uniqueidentifier  null,
    row_version         rowversion        not null
);
```

> **Kolon adı notu (önemli):** `Sha256Checksum` property'si EF Core snake_case convention'ından geçerken `sha256checksum` olur — `sha256_checksum` DEĞİL. Convention rakam-harf bitişmesinde alt çizgi eklemiyor (`256` ile `Checksum` arası ayrılmıyor). Migration/DB'ye sorgu yazarken bu isim birebir kullanılmalı.

**Index'ler (spec §2.5, EF Core `HasIndex`):**

```sql
-- 1. Orphan/purge job taramaları (spec §2.5.1)
CREATE INDEX ix_stored_files_school_status
  ON [files].stored_files(school_id, status);

-- 2. Bütünlük kontrolü + gelecekte tenant-içi dedup (spec §2.5.2, K2)
CREATE INDEX ix_stored_files_school_checksum
  ON [files].stored_files(school_id, sha256checksum);

-- 3. Aynı anahtara çift kayıt imkânsız (spec §2.5.4)
CREATE UNIQUE INDEX ux_stored_files_bucket_object_key
  ON [files].stored_files(bucket, object_key);
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` (proje standardı, tenant tablosu) |

---

### `[files].file_attachments`

```sql
CREATE TABLE [files].file_attachments (
    id              uniqueidentifier  not null  constraint pk_file_attachments primary key,
    school_id       uniqueidentifier  not null,
    stored_file_id  uniqueidentifier  not null,
    entity_type     nvarchar(64)      not null,
    entity_id       uniqueidentifier  not null,
    version         int               not null  constraint df_file_attachments_version default 1,
    display_order   int               not null  constraint df_file_attachments_display_order default 0,
    description     nvarchar(500)     null,
    created_at      datetimeoffset    not null,
    created_by      uniqueidentifier  not null,
    updated_at      datetimeoffset    null,
    updated_by      uniqueidentifier  null,
    is_deleted      bit               not null  constraint df_file_attachments_is_deleted default 0,
    deleted_at      datetimeoffset    null,
    deleted_by      uniqueidentifier  null,
    row_version     rowversion        not null
);
```

**Index'ler:**

```sql
-- "Bu entity'nin dosyaları" ana sorgu yolu (spec §2.5.3)
CREATE INDEX ix_file_attachments_entity
  ON [files].file_attachments(school_id, entity_type, entity_id);

-- EF Core otomatik FK index (StoredFileId üzerine, açıkça HasIndex ile yazılmadı ama
-- EF Core konvansiyonu her FK için otomatik index üretir)
CREATE INDEX ix_file_attachments_stored_file_id
  ON [files].file_attachments(stored_file_id);
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `stored_file_id` | `[files].stored_files(id)` | **`RESTRICT`** — bağ silinse bile dosya silinmez (spec §2.5.5); fiziksel silme purge job (Faz 4) sorumluluğudur. |

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-07-03 | `20260703_documents_stored_files` | `[files]` şeması, `stored_files` + `file_attachments` tabloları, 3 spec index'i + 1 EF otomatik FK index'i, tenant global query filter (`TenantEntity` convention'ından otomatik) |

---

## Yasaklar

- ❌ `varchar` (non-unicode) — `nvarchar` zorunlu (istisna: `sha256checksum` sabit uzunluklu hex, `char(64)` + `IsUnicode(false)`).
- ❌ `datetime` / `datetime2` UTC olmadan — `datetimeoffset`.
- ❌ Tenant tablosunda `school_id` yokluğu.
- ❌ Composite index'te ilk kolon `school_id` değilse.
- ❌ `stored_file_id` FK'sinin `Cascade` olması — Restrict zorunlu (spec §2.5.5).

> Detay: `backend/database-rules.md`.
