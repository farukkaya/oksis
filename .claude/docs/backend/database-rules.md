# OKSİS — Database Rules

> **DB:** Microsoft SQL Server 2022+ (Azure SQL veya self-hosted). **ORM:** EF Core 10 + `Microsoft.EntityFrameworkCore.SqlServer`. **Migration aracı:** EF Core Migrations. Üretim'de `dotnet ef database update` ÇALIŞTIRILMAZ; SQL script üretilir ve CI/CD ile uygulanır.

---

## 1. Naming Conventions (Özet)

| Öğe | Pattern | Örnek |
|-----|---------|-------|
| Tablo | `snake_case`, çoğul | `students`, `attendance_sessions` |
| Kolon | `snake_case` | `school_id`, `created_at` |
| PK | `pk_{tablo}` | `pk_students` |
| FK | `fk_{tablo}_{ref}` | `fk_attendance_records_students` |
| Index (normal) | `ix_{tablo}_{kolonlar}` | `ix_students_school_id_status` |
| Unique Index | `ux_{tablo}_{kolonlar}` | `ux_users_school_id_email` |
| Check Constraint | `ck_{tablo}_{kural}` | `ck_marks_score_range` |

> Detay: `naming-conventions.md`.

EF Core'da snake_case için **`EFCore.NamingConventions`** paketi `UseSnakeCaseNamingConvention()` ile kullanılır. SQL Server convention'ında PascalCase tercih edilirse takım kararı ile değiştirilebilir; kuralın tutarlılığı önemli, yön değil.

---

## 2. Zorunlu Kolonlar

Tüm tablolarda:

```sql
id              uniqueidentifier  not null  primary key
created_at      datetimeoffset    not null
created_by      uniqueidentifier  not null
updated_at      datetimeoffset    null
updated_by      uniqueidentifier  null
is_deleted      bit               not null  constraint df_{tbl}_is_deleted default 0
deleted_at      datetimeoffset    null
deleted_by      uniqueidentifier  null
row_version     rowversion        not null  -- optimistic concurrency (timestamp)
```

Tenant tablolarında **ek**:

```sql
school_id       uniqueidentifier  not null
```

> **Index:** Tenant tablolarında her composite index `school_id` ile başlar. Performans + güvenlik (filter pushdown).

### 2.1 Tip Eşleşmeleri

| .NET | SQL Server | Açıklama |
|------|-----------|----------|
| `Guid` | `uniqueidentifier` | PK ve FK; `NEWSEQUENTIALID()` default'a koymak yerine app üretsin (ardışık-rastgele dağılım performansa yardım eder ama DB-üretimi tenant injection riski). |
| `string` (sabit max) | `nvarchar(N)` | Her zaman MaxLength belirt (unicode default). |
| `string` (uzun) | `nvarchar(max)` | Açıklama, içerik. |
| `DateTime` | — | **Kullanma.** `DateTimeOffset` zorunlu (UTC + offset). |
| `DateTimeOffset` | `datetimeoffset` | Tüm zaman damgaları. |
| `DateOnly` | `date` | Doğum, son tarih. |
| `TimeOnly` | `time` | Ders saati. |
| `decimal(p,s)` | `decimal(p,s)` | Para/oran; precision daima belirt (ör. `decimal(18,2)`). |
| `int` | `int` | Sayım. |
| `Enum` | `nvarchar(50)` | String conversion (`HasConversion<string>()`). Int olarak saklama. |
| `byte[]` | `varbinary(max)` | Küçük binary; dosyalar S3/Blob'da. |
| `bool` | `bit` | true/false. |
| `string` (JSON) | `nvarchar(max)` + `ISJSON` check | JSON kolonu; sorgu için `JSON_VALUE`. |

### 2.2 Yasaklar

- ❌ `varchar` (non-unicode) — Türkçe karakter kaybı riski; her zaman `nvarchar`.
- ❌ `datetime` / `datetime2` UTC olmadan — `datetimeoffset` zorunlu.
- ❌ `decimal` precision belirtmeden.
- ❌ Enum'u `int` olarak saklamak (string conversion zorunlu, refactor kolaylığı).
- ❌ `text`, `ntext`, `image` (deprecated tipler).

---

## 3. Soft Delete

- Tüm aggregate root'lar soft delete kullanır.
- EF Core global query filter: `e => !e.IsDeleted && (tenant filter)`.
- Hard delete **sadece**:
  - Migration script ile veri temizliği,
  - KVKK silme talebi (audit + tenant admin onayı),
  - SuperAdmin admin paneli (kayıtlı + audit'li).

```csharp
public void Delete(UserId by, DateTimeOffset at)
{
    if (IsDeleted) throw new InvalidOperationException("Already deleted.");
    IsDeleted = true;
    DeletedAt = at;
    DeletedBy = by;
    Raise(new XxxDeleted(...));
}
```

> **Cascade with soft delete:** Soft delete cascade etmez. Child kayıtlar ayrı silinir (uygulama mantığı). Tek istisna: owned entity'ler (aynı aggregate).

---

## 4. Index Stratejisi

### 4.1 Zorunlu Index'ler

Her tenant tablosunda — **filtered index** ile aktif kayıtlar üzerinde dar index:

```sql
CREATE INDEX ix_{table}_school_id ON {table}(school_id)
WHERE is_deleted = 0;
```

### 4.2 Sık Sorgulanan Kolonlar

| Tablo | Index |
|-------|-------|
| `users` | `ux_users_school_id_email` |
| `students` | `ix_students_school_id_class_id_status` |
| `attendance_sessions` | `ux_attendance_sessions_school_id_class_id_subject_id_date_period` |
| `attendance_records` | `ix_attendance_records_session_id` |
| `marks` | `ix_marks_school_id_class_id_subject_id_term` |
| `homeworks` | `ix_homeworks_school_id_due_date_status` |
| `notifications` | `ix_notifications_school_id_user_id_read_at` |
| `announcements` | `ix_announcements_school_id_published_at` (DESC) |
| `audit_logs` | `ix_audit_logs_school_id_created_at` (DESC) |

### 4.3 Index Yönergeleri

- **Selectivity** düşük (örn. 4 değerli `status`) kolonu **tek başına** index'leme; composite kullan veya `INCLUDE` kolonu olarak ekle.
- Büyük log/audit tablolarında **partitioned table** veya **columnstore index** (SQL Server 2022 ortam müsaitse) değerlendir.
- Index kullanımı **`sys.dm_db_index_usage_stats`** ile aylık review; `user_seeks + user_scans = 0` olanlar drop.
- `INCLUDE` ile covering index (örn. `INCLUDE (title)`).

```sql
CREATE INDEX ix_homeworks_school_id_due_date_status
  ON homeworks (school_id, due_date, status)
  INCLUDE (title)
  WHERE is_deleted = 0;
```

---

## 5. Foreign Key Stratejisi

| İlişki Türü | ON DELETE |
|-------------|-----------|
| Aynı aggregate (owned) | `CASCADE` |
| Farklı aggregate (cross-ref) | `NO ACTION` |
| Tenant FK (`school_id`) | `NO ACTION` (okul silinmez; archive olur) |
| Soft-deletable kayıtlara FK | `NO ACTION`; uygulamada handle |

```sql
ALTER TABLE attendance_records
ADD CONSTRAINT fk_attendance_records_sessions
  FOREIGN KEY (attendance_session_id)
  REFERENCES attendance_sessions(id)
  ON DELETE CASCADE
  ON UPDATE NO ACTION;
```

> **Yasak:** `ON UPDATE CASCADE` — PK'lar `uniqueidentifier`, asla değişmez.
> **Dikkat:** SQL Server cascade cycle'a izin vermez. Tenant FK'lerinde `NO ACTION` + uygulama cascade.

---

## 6. Check Constraints

İş kurallarını DB seviyesinde de zorla:

```sql
ALTER TABLE marks
ADD CONSTRAINT ck_marks_score_range
  CHECK (score IS NULL OR (score >= 0 AND score <= 100));

ALTER TABLE attendance_sessions
ADD CONSTRAINT ck_attendance_sessions_period_range
  CHECK (period BETWEEN 1 AND 10);
```

> Domain layer'da da invariant olarak korunur (defense-in-depth).

---

## 7. Migration Kuralları

### 7.1 Migration Üretme

```bash
dotnet ef migrations add {YYYYMMDD}_{kisa_aciklama} --project Oksis.Infrastructure --startup-project Oksis.Api
```

İsim örneği: `20260915_add_homework_attachments`.

### 7.2 Migration İçeriği

- **Her migration tek bir mantıksal değişikliği** kapsar (atomik).
- Veri taşıma (data migration) varsa: raw SQL veya `MigrationBuilder.Sql(...)`; EF entity'leri **kullanma** (şema değişebilir).
- **Asla**: production migration'ı git history'den geri al / silme. Düzeltme için **yeni** migration.

### 7.3 Üretim Deploy

1. CI'da: `dotnet ef migrations script {from} {to} -o migration.sql --idempotent`
2. Üretilen SQL **kod review'a** girer (büyük değişiklik DBA onayına).
3. Deploy adımı: DB backup → SQL apply → smoke test.
4. **Asla** uygulama process'i auto-migration ile başlatılmaz (`Database.Migrate()` yok).

### 7.4 Zero-Downtime Migration

Şema değişiklikleri **expand-contract** ile:

| Adım | Eylem |
|------|-------|
| Expand | Yeni kolon eklenir, NULL veya default ile. Eski + yeni paralel yazılır |
| Migrate | Background job ile mevcut kayıtlar yeni kolona taşınır |
| Contract | Eski kolon kaldırılır (sonraki deploy) |

> Rename direkt yapılmaz: yeni kolon ekle, veri kopyala, eski kolonu sonra drop et.

> **SQL Server özel notu:** Online index rebuild Enterprise/Azure SQL ile mümkün. Büyük tablolarda `WITH (ONLINE = ON)` opsiyonu kullanılır.

---

## 8. Connection & Pool

- Provider: **`Microsoft.EntityFrameworkCore.SqlServer`** (ADO.NET: `Microsoft.Data.SqlClient`).
- Connection string örneği:

```
Server=tcp:oksis-sql.example.com,1433;
Database=oksis_prod;
User Id=oksis_app;
Password=<secret>;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
Max Pool Size=200;
Min Pool Size=5;
MultipleActiveResultSets=False;
ApplicationIntent=ReadWrite;
```

- **Azure AD authentication** tercih edilebilir (`Authentication=Active Directory Default;`).
- Read-replica gelirse (Azure SQL read scale-out veya AlwaysOn): `IDbContextFactory<OksisDbContext>` ile **separate read context**, `ApplicationIntent=ReadOnly`. Query handler `AsNoTracking()` kullanır.
- `MARS=False` — paralel reader ihtiyacı varsa ayrı connection aç.
- `DbContext pooling`: `services.AddDbContextPool<OksisDbContext>(...)` ile etkin.

---

## 9. Transaction Kuralları

- Default: EF Core'un `SaveChangesAsync` her command için tek transaction içerir.
- Bir komut içinde **birden fazla** aggregate değişiyorsa:
  - Aynı `DbContext` üzerinden tek `SaveChangesAsync` ile yapılır → tek transaction.
- Cross-aggregate **distributed transaction yok**: yan etki (notification, queue) için **Outbox Pattern** kullanılır.
- `TransactionScope`: `TransactionScopeAsyncFlowOption.Enabled` ile **sadece zaruri** durumlarda (MSDTC kaçınılır).
- Isolation level default **Read Committed Snapshot** (`ALTER DATABASE ... SET READ_COMMITTED_SNAPSHOT ON`) önerilir — okuyucu/yazıcı bloklamaz.

> Detay: `backend/coding-standards.md` §EF Core ve `architecture-rules.md`.

---

## 10. Outbox Pattern (Domain Event → Job)

```sql
CREATE TABLE outbox_messages (
    id              uniqueidentifier  not null  constraint pk_outbox_messages primary key,
    school_id       uniqueidentifier  not null,
    type            nvarchar(200)     not null,
    payload         nvarchar(max)     not null,  -- JSON; ISJSON check eklenir
    created_at      datetimeoffset    not null,
    processed_at    datetimeoffset    null,
    attempt_count   int               not null  constraint df_outbox_attempt default 0,
    error           nvarchar(max)     null,
    constraint ck_outbox_payload_json check (ISJSON(payload) = 1)
);

-- Sadece işlenmemiş kayıtlar üzerinde dar index
CREATE INDEX ix_outbox_messages_unprocessed
  ON outbox_messages (created_at)
  WHERE processed_at IS NULL;
```

- Domain event raise → `SaveChangesInterceptor` outbox tablosuna insert (aynı transaction).
- Hangfire recurring job outbox'u drain eder (`OutboxDispatchJob`, ~30 sn).
- Idempotency: `outbox_messages.id` notification job'a pass; downstream provider response'una göre `processed_at` set'lenir.

---

## 11. Soft Delete + Tenant + Audit Birleşik Migration Şablonu

```csharp
public partial class AddHomeworks : Migration
{
    protected override void Up(MigrationBuilder mb)
    {
        mb.CreateTable(
            name: "homeworks",
            columns: t => new
            {
                id            = t.Column<Guid>(type: "uniqueidentifier", nullable: false),
                school_id     = t.Column<Guid>(type: "uniqueidentifier", nullable: false),
                class_id      = t.Column<Guid>(type: "uniqueidentifier", nullable: false),
                subject_id    = t.Column<Guid>(type: "uniqueidentifier", nullable: false),
                title         = t.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                description   = t.Column<string>(type: "nvarchar(max)", nullable: false),
                due_date      = t.Column<DateOnly>(type: "date", nullable: false),
                status        = t.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                created_at    = t.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                created_by    = t.Column<Guid>(type: "uniqueidentifier", nullable: false),
                updated_at    = t.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                updated_by    = t.Column<Guid>(type: "uniqueidentifier", nullable: true),
                is_deleted    = t.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                deleted_at    = t.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                deleted_by    = t.Column<Guid>(type: "uniqueidentifier", nullable: true),
                row_version   = t.Column<byte[]>(type: "rowversion", nullable: false),
            },
            constraints: t =>
            {
                t.PrimaryKey("pk_homeworks", x => x.id);
                t.ForeignKey("fk_homeworks_schools", x => x.school_id, "schools", "id", onDelete: ReferentialAction.NoAction);
                t.ForeignKey("fk_homeworks_classes", x => x.class_id, "classes", "id", onDelete: ReferentialAction.NoAction);
                t.ForeignKey("fk_homeworks_subjects", x => x.subject_id, "subjects", "id", onDelete: ReferentialAction.NoAction);
            });

        mb.Sql(@"
            CREATE INDEX ix_homeworks_school_id_due_date_status
              ON homeworks (school_id, due_date, status)
              INCLUDE (title)
              WHERE is_deleted = 0;
        ");
    }
}
```

---

## 12. Performans Yönergeleri

- `SELECT *` yok; her zaman **projeksiyon** (`.Select(x => new DtoX { ... })`).
- N+1 yasak; `.Include()` yetersizse projection ile manuel join.
- Pagination **mecburi** (default 50, max 100). `OFFSET ... FETCH NEXT ... ROWS ONLY` veya keyset (büyük tablolarda).
- Büyük `IN (...)` clause (>100 değer): `JOIN` veya tablovalued parameter kullan.
- `OPTION (RECOMPILE)` sadece parameter-sniffing problem yaşayan sorgularda; default değil.
- Stored procedure: MVP'de **yok**; her şey EF Core üzerinden. Karmaşık raporlama Sprint 5+ inceleme.
- `WITH (NOLOCK)` **yasak** — Read Committed Snapshot ile aynı etkiyi temiz yöntemle alırsın.

---

## 13. Full-Text & Arama

- Basit "starts with"/"contains" arama: `LIKE 'foo%'` (LIKE leading wildcard non-sargable, dikkat).
- Türkçe case-insensitive search: kolon collation `Turkish_CI_AI` veya `COLLATE Turkish_CI_AI` ile sorgu.
- Heavy serbest metin arama: **SQL Server Full-Text Search** + `CONTAINS(title, 'matematik')`. MVP'de gerek yoksa açma; Sprint 4+ değerlendir.

---

## 14. Backup & Restore

- Üretim: **Tam yedek** günlük + **transaction log backup** 15 dk (Point-in-Time Restore).
- Azure SQL: Geo-replica + LTR (Long-Term Retention) konfigüre edilir.
- Restore tatbikatı her **3 ayda bir** yapılır (DR planı).
- Migration öncesi otomatik snapshot/backup CI/CD adımı.

---

## 15. Yasaklar (Özet)

- ❌ `varchar` (non-unicode) — `nvarchar` zorunlu.
- ❌ `datetime` / `datetime2` UTC olmadan kullanmak.
- ❌ Triggers ile business logic (defense-in-depth check constraint OK; domain trigger YASAK).
- ❌ Stored procedure'da business logic (MVP'de SP YOK).
- ❌ `WITH (NOLOCK)`.
- ❌ Cross-database query (`OtherDb.dbo.Users`).
- ❌ Linked server.
- ❌ `MARS=True` default açık tutmak.
- ❌ User database'inde `master` veya `tempdb`'de obje oluşturmak.
- ❌ Production'da auto-shrink/auto-close açık tutmak.
- ❌ `sa` hesabıyla uygulama bağlantısı (her zaman least-privilege user).
