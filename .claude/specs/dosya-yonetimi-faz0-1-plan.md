# Dosya Yönetimi Faz 0-1 Uygulama Planı (Dev Altyapı + Domain/Persistence)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `dosya-yonetimi-spec.md` Faz 0 (dev altyapı: Garage + ClamAV + AWSSDK.S3 + appsettings) ve Faz 1'i (Documents domain modeli + policy registry + EF persistence + migration) sıfır kod-borcuyla teslim etmek.

**Architecture:** Documents, `oksis-api` içinde izole dikey dilimdir (spec §3.1 eşleme tablosu): Domain `Oksis.Domain/Modules/Documents`, Application `Oksis.Application/Modules/Documents`, persistence `Oksis.Infrastructure/Persistence/Configurations/Documents`. Bu fazlarda henüz komut/endpoint YOK — yalnız domain davranışı, policy registry ve şema.

**Tech Stack:** .NET 10, EF Core 10 (snake_case convention), xUnit + FluentAssertions, Garage (S3-uyumlu, docker), ClamAV (docker), AWSSDK.S3 (paket referansı bu fazda eklenir, Faz 2'de kullanılır).

## Global Constraints

- **Bağlayıcı spec:** `.claude/specs/dosya-yonetimi-spec.md` — maddelerden sapma YASAK; çelişki görürsen dur ve kullanıcıya hangi maddeyle çakıştığını söyle.
- Çalışma dizini: `/Users/farukkaya/Projects/oksis/oksis-api` (bağımsız git repo). Tüm görevler `feature/dosya-yonetimi-faz0-1` branch'inde.
- Commit formatı (husky hook doğrular): `YYYY-MM-DD <type>[,type]: Türkçe özet.` — tarih `date +%Y-%m-%d` ile dinamik alınır; mesaj sonuna `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` eklenir.
- Her commit öncesi `dotnet format` çalıştırılır (pre-commit zorunlu).
- Domain'de EF Core / DataAnnotations YASAK; entity'ler `TenantEntity`'den türer (private setter, factory metot).
- Kod tanımlayıcıları İngilizce, XML doc yorumları Türkçe (mevcut kalıp).
- `async void`, `Task.Result`, `.Wait()`, AutoMapper, repository wrapper YASAK.
- Test stili: xUnit `[Fact]` + FluentAssertions, metot adları `Snake_case_davranış` İngilizce (mevcut kalıp: `Create_sets_name_type_block_floor`).
- **Naming (.editorconfig 49-57, IDE1006):** TÜM private alanlar `_camelCase` (required_prefix `_`). Bu plandaki Task 2/3 test kod bloklarında ve Task 4 registry'sinde ilk sürümde bu kural ihlal edilmişti (PascalCase static alanlar, `Policies`); uygulamada `_schoolId`, `_yearId`, `_storedFileId`, `_entityId`, `_policies` olarak düzeltildi (2026-07-04 kullanıcı bildirimi). Kod bloklarını birebir kopyalarken bu düzeltmeyi uygula.

---

### Task 1: Faz 0 — Dev Altyapı (Garage + ClamAV + AWSSDK.S3 + appsettings)

**Files:**
- Modify: `oksis-api/docker-compose.yml`
- Create: `oksis-api/docker/garage/garage.toml`
- Create: `oksis-api/scripts/init-garage.sh`
- Modify: `oksis-api/src/Oksis.Infrastructure/Oksis.Infrastructure.csproj` (AWSSDK.S3)
- Modify: `oksis-api/src/Oksis.Api/appsettings.Development.json` (Storage bölümü)

**Interfaces:**
- Consumes: —
- Produces: `http://localhost:3900` S3 endpoint (dev creds: AccessKey `GK0123456789abcdef01234567`), `localhost:3310` ClamAV TCP, appsettings `Storage:S3` bölümü. Faz 2'deki `S3CompatibleStorageService` bu endpoint + konfigürasyonu kullanacak.

- [ ] **Step 1: Feature branch aç**

```bash
git -C /Users/farukkaya/Projects/oksis/oksis-api checkout -b feature/dosya-yonetimi-faz0-1
```

- [ ] **Step 2: Garage konfigürasyonunu yaz**

`oksis-api/docker/garage/garage.toml` (yeni dosya — `docker/garage/` klasörünü oluştur):

```toml
# OKSİS dev Garage konfigürasyonu — TEK NODE, yalnız yerel geliştirme.
# Prod: files.* subdomain + TLS (spec §11.2 Açık İş).
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "sqlite"

replication_factor = 1

rpc_bind_addr = "[::]:3901"
rpc_public_addr = "127.0.0.1:3901"
# Dev-only sabit secret (64 hex). Prod'da asla kullanılmaz.
rpc_secret = "3e2f5f34a1c7b8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3"

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"
root_domain = ".s3.garage.localhost"

[s3_web]
bind_addr = "[::]:3902"
root_domain = ".web.garage.localhost"
index = "index.html"

[admin]
api_bind_addr = "[::]:3903"
admin_token = "oksis-dev-admin-token"
```

- [ ] **Step 3: docker-compose'a Garage + ClamAV servislerini ekle**

`oksis-api/docker-compose.yml` — `mailpit` servisinden sonra, `volumes:` bloğundan önce ekle:

```yaml
  # S3-uyumlu object storage (spec: dosya-yonetimi-spec.md K4/§1.4).
  # İlk kurulumda TEK SEFER: ./scripts/init-garage.sh (layout + dev key).
  # S3 endpoint: http://localhost:3900  (region: garage, path-style)
  garage:
    image: dxflrs/garage:v1.0.1
    container_name: oksis-garage
    ports:
      - "3900:3900"  # S3 API
      - "3901:3901"  # RPC
      - "3903:3903"  # Admin API
    volumes:
      - ./docker/garage/garage.toml:/etc/garage.toml:ro
      - garage-meta:/var/lib/garage/meta
      - garage-data:/var/lib/garage/data
    healthcheck:
      test: ["CMD", "/garage", "status"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Virüs tarama daemon'u (spec §3.5 VirusScanJob — Faz 4'te kullanılacak).
  # İlk açılışta imza veritabanını indirir (birkaç dk sürebilir).
  clamav:
    image: clamav/clamav:1.4
    container_name: oksis-clamav
    ports:
      - "3310:3310"  # clamd TCP
    volumes:
      - clamav-data:/var/lib/clamav
    healthcheck:
      test: ["CMD", "/usr/local/bin/clamdcheck.sh"]
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 180s
```

Aynı dosyanın sonundaki `volumes:` bloğuna ekle:

```yaml
  garage-meta:
  garage-data:
  clamav-data:
```

- [ ] **Step 4: Garage init script'ini yaz**

`oksis-api/scripts/init-garage.sh` (yeni dosya — `scripts/` klasörünü oluştur; `chmod +x`):

```bash
#!/usr/bin/env bash
# OKSİS dev Garage ilk kurulumu — idempotent, tekrar çalıştırılabilir.
# Kullanım: docker compose up -d garage && ./scripts/init-garage.sh
set -uo pipefail

GARAGE="docker compose exec -T garage /garage"
ACCESS_KEY="GK0123456789abcdef01234567"
SECRET_KEY="8f4e2d1c0b9a87654321fedcba9876543210abcdef0123456789abcdef012345"

echo "-- Node ID alınıyor..."
NODE_ID=$($GARAGE node id -q 2>/dev/null | cut -d'@' -f1)
if [ -z "$NODE_ID" ]; then
  echo "HATA: Garage node'una ulaşılamadı. 'docker compose up -d garage' çalıştı mı?"
  exit 1
fi
echo "   Node: $NODE_ID"

echo "-- Layout atanıyor (idempotent)..."
$GARAGE layout assign -z dc1 -c 10G "$NODE_ID" 2>/dev/null
$GARAGE layout apply --version 1 2>/dev/null \
  && echo "   Layout uygulandı." \
  || echo "   Layout zaten uygulanmış, atlandı."

echo "-- Dev anahtarı import ediliyor (idempotent)..."
$GARAGE key import --yes -n oksis-dev "$ACCESS_KEY" "$SECRET_KEY" 2>/dev/null \
  && echo "   Anahtar import edildi." \
  || echo "   Anahtar zaten var, atlandı."

echo "-- Bucket oluşturma izni veriliyor (tenant provisioning için)..."
$GARAGE key allow --create-bucket "$ACCESS_KEY" >/dev/null 2>&1

echo "-- Doğrulama:"
$GARAGE key info "$ACCESS_KEY" 2>/dev/null | head -5
echo "OK: S3 endpoint http://localhost:3900 hazır (region: garage, path-style)."
```

- [ ] **Step 5: Servisleri ayağa kaldır ve doğrula**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
docker compose up -d garage clamav
sleep 5
chmod +x scripts/init-garage.sh && ./scripts/init-garage.sh
curl -s -o /dev/null -w "%{http_code}" http://localhost:3900/
```

Beklenen: init script "OK: S3 endpoint ... hazır" basar; `curl` **403** döner (S3 API ayakta, anonim istek reddedildi — doğru davranış). ClamAV healthy olması birkaç dakika alabilir (imza indirme); `docker compose ps` ile `starting/healthy` görülmesi yeterli, bekleme zorunlu değil (Faz 4'e kadar kullanılmayacak).

**Not — image tag'leri:** `dxflrs/garage:v1.0.1` veya `clamav/clamav:1.4` çekilemezse (tag kaldırılmış/registry sorunu) dur ve kullanıcıya sor; sessizce farklı major sürüme geçme.

- [ ] **Step 6: AWSSDK.S3 paketini ekle ve build doğrula**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
dotnet add src/Oksis.Infrastructure package AWSSDK.S3
dotnet build
```

Beklenen: build SUCCESS. (Paket yalnız Infrastructure'a eklenir — spec §1.3 KURAL 4: Application AWSSDK.S3 bilmez.)

- [ ] **Step 7: appsettings Storage bölümünü ekle**

`oksis-api/src/Oksis.Api/appsettings.Development.json` — kök objeye şu bölümü ekle (mevcut bölümlere dokunma; eski `FileStorage` bölümü varsa da SİLME — Faz 5'te emekli edilecek):

```json
"Storage": {
  "Provider": "S3Compatible",
  "S3": {
    "ServiceUrl": "http://localhost:3900",
    "Region": "garage",
    "AccessKey": "GK0123456789abcdef01234567",
    "SecretKey": "8f4e2d1c0b9a87654321fedcba9876543210abcdef0123456789abcdef012345",
    "ForcePathStyle": true,
    "PresignedEndpoint": "http://localhost:3900"
  }
}
```

(`ForcePathStyle` Garage için zorunlu; `PresignedEndpoint` presigned URL'lerin taşıyacağı host — prod'da `https://files.<domain>` olur, spec §11.2. Options sınıfı Faz 2'de bu bölümü okuyacak.)

- [ ] **Step 8: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
dotnet format
git add docker-compose.yml docker/garage/garage.toml scripts/init-garage.sh \
  src/Oksis.Infrastructure/Oksis.Infrastructure.csproj src/Oksis.Api/appsettings.Development.json
git commit -m "$(cat <<EOF
$(date +%Y-%m-%d) chore: Dosya yönetimi dev altyapısı eklendi (Garage, ClamAV, AWSSDK.S3).

Spec: dosya-yonetimi-spec.md Faz 0. Garage tek-node dev kurulumu
(init-garage.sh idempotent), ClamAV container (Faz 4 hazırlığı),
Storage appsettings bölümü. Dev-only sabit credential'lar.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: StoredFile Entity + Enum'lar + Domain Event'ler (TDD)

**Files:**
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Enums/FileStatus.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Enums/VirusScanStatus.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Enums/StorageProviderType.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/ValueObjects/StoredFileId.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Exceptions/DocumentsDomainException.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Events/FileUploadConfirmedEvent.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Events/FileQuarantinedEvent.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Events/FileSoftDeletedEvent.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Entities/StoredFile.cs`
- Test: `oksis-api/tests/Oksis.Domain.UnitTests/Modules/Documents/StoredFileTests.cs`

**Interfaces:**
- Consumes: `TenantEntity`, `IDomainEvent`, `DomainException` (Oksis.Domain.Common / Exceptions — mevcut).
- Produces: `StoredFile.CreatePending(Guid schoolId, Guid academicYearId, StorageProviderType provider, string bucket, string objectKey, string originalFileName, string contentType, long declaredSizeBytes, string category) : StoredFile`; `StoredFile.CreateUploaded(... + string sha256Checksum, bool requiresVirusScan) : StoredFile`; instance metotları `Confirm(long actualSizeBytes, string sha256Checksum, bool requiresVirusScan)`, `MarkScanClean()`, `MarkScanInfected(string signature)`, `MarkSoftDeleted()`; `bool CanBeDownloaded { get; }`. Faz 2-4 handler'ları bu imzaları kullanacak.

- [ ] **Step 1: Failing testleri yaz**

`oksis-api/tests/Oksis.Domain.UnitTests/Modules/Documents/StoredFileTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Documents.Entities;
using Oksis.Domain.Modules.Documents.Enums;
using Oksis.Domain.Modules.Documents.Events;
using Oksis.Domain.Modules.Documents.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Documents;

public class StoredFileTests
{
    private static readonly Guid SchoolId = Guid.NewGuid();
    private static readonly Guid YearId = Guid.NewGuid();

    private static StoredFile Pending() => StoredFile.CreatePending(
        SchoolId, YearId, StorageProviderType.S3Compatible,
        $"oksis-t{SchoolId}", $"{YearId}/school-logo/2026-07/{Guid.NewGuid()}.png",
        "logo şekilli.png", "image/png", 1024, "SchoolLogo");

    [Fact]
    public void CreatePending_sets_pending_status_and_no_checksum()
    {
        var file = Pending();

        file.Status.Should().Be(FileStatus.PendingUpload);
        file.VirusScanStatus.Should().Be(VirusScanStatus.Pending);
        file.SchoolId.Should().Be(SchoolId);
        file.AcademicYearId.Should().Be(YearId);
        file.Sha256Checksum.Should().BeNull();
        file.SizeBytes.Should().Be(1024);
        file.CanBeDownloaded.Should().BeFalse();
        file.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public void CreateUploaded_with_scan_required_is_quarantined_and_raises_confirmed_event()
    {
        var file = StoredFile.CreateUploaded(
            SchoolId, YearId, StorageProviderType.S3Compatible,
            $"oksis-t{SchoolId}", $"{YearId}/school-logo/2026-07/{Guid.NewGuid()}.png",
            "logo.png", "image/png", 2048, new string('a', 64), "SchoolLogo",
            requiresVirusScan: true);

        file.Status.Should().Be(FileStatus.Quarantined);
        file.VirusScanStatus.Should().Be(VirusScanStatus.Pending);
        file.CanBeDownloaded.Should().BeFalse();
        file.DomainEvents.Should().ContainSingle(e => e is FileUploadConfirmedEvent);
    }

    [Fact]
    public void CreateUploaded_without_scan_is_active_and_skipped()
    {
        var file = StoredFile.CreateUploaded(
            SchoolId, YearId, StorageProviderType.S3Compatible,
            $"oksis-t{SchoolId}", $"{YearId}/school-logo/2026-07/{Guid.NewGuid()}.png",
            "logo.png", "image/png", 2048, new string('a', 64), "SchoolLogo",
            requiresVirusScan: false);

        file.Status.Should().Be(FileStatus.Active);
        file.VirusScanStatus.Should().Be(VirusScanStatus.Skipped);
        file.CanBeDownloaded.Should().BeTrue();
    }

    [Fact]
    public void Confirm_moves_pending_to_quarantined_and_raises_event()
    {
        var file = Pending();

        file.Confirm(4096, new string('b', 64), requiresVirusScan: true);

        file.Status.Should().Be(FileStatus.Quarantined);
        file.VirusScanStatus.Should().Be(VirusScanStatus.Pending);
        file.SizeBytes.Should().Be(4096);
        file.Sha256Checksum.Should().Be(new string('b', 64));
        var evt = file.DomainEvents.OfType<FileUploadConfirmedEvent>().Single();
        evt.StoredFileId.Should().Be(file.Id);
        evt.SchoolId.Should().Be(SchoolId);
        evt.RequiresVirusScan.Should().BeTrue();
    }

    [Fact]
    public void Confirm_without_scan_goes_straight_to_active()
    {
        var file = Pending();

        file.Confirm(4096, new string('b', 64), requiresVirusScan: false);

        file.Status.Should().Be(FileStatus.Active);
        file.VirusScanStatus.Should().Be(VirusScanStatus.Skipped);
        file.CanBeDownloaded.Should().BeTrue();
    }

    [Fact]
    public void Confirm_twice_throws()
    {
        var file = Pending();
        file.Confirm(4096, new string('b', 64), requiresVirusScan: true);

        var act = () => file.Confirm(4096, new string('b', 64), true);

        act.Should().Throw<DocumentsDomainException>()
            .Which.Code.Should().Be("file.confirm.invalid-status");
    }

    [Fact]
    public void MarkScanClean_activates_quarantined_file()
    {
        var file = Pending();
        file.Confirm(4096, new string('b', 64), requiresVirusScan: true);

        file.MarkScanClean();

        file.Status.Should().Be(FileStatus.Active);
        file.VirusScanStatus.Should().Be(VirusScanStatus.Clean);
        file.CanBeDownloaded.Should().BeTrue();
    }

    [Fact]
    public void MarkScanClean_when_not_pending_throws()
    {
        var file = Pending();

        var act = () => file.MarkScanClean();

        act.Should().Throw<DocumentsDomainException>()
            .Which.Code.Should().Be("file.scan.invalid-status");
    }

    [Fact]
    public void MarkScanInfected_keeps_quarantine_and_raises_event()
    {
        var file = Pending();
        file.Confirm(4096, new string('b', 64), requiresVirusScan: true);

        file.MarkScanInfected("Eicar-Test-Signature");

        file.Status.Should().Be(FileStatus.Quarantined);
        file.VirusScanStatus.Should().Be(VirusScanStatus.Infected);
        file.CanBeDownloaded.Should().BeFalse();
        var evt = file.DomainEvents.OfType<FileQuarantinedEvent>().Single();
        evt.Signature.Should().Be("Eicar-Test-Signature");
    }

    [Fact]
    public void MarkSoftDeleted_sets_status_flag_and_raises_event()
    {
        var file = Pending();
        file.Confirm(4096, new string('b', 64), requiresVirusScan: false);

        file.MarkSoftDeleted();

        file.Status.Should().Be(FileStatus.SoftDeleted);
        file.IsDeleted.Should().BeTrue();
        file.CanBeDownloaded.Should().BeFalse();
        file.DomainEvents.Should().ContainSingle(e => e is FileSoftDeletedEvent);
    }

    [Fact]
    public void MarkSoftDeleted_twice_throws()
    {
        var file = Pending();
        file.MarkSoftDeleted();

        var act = () => file.MarkSoftDeleted();

        act.Should().Throw<DocumentsDomainException>()
            .Which.Code.Should().Be("file.delete.already-deleted");
    }

    [Fact]
    public void CreatePending_rejects_blank_bucket_key_category()
    {
        var act = () => StoredFile.CreatePending(
            SchoolId, YearId, StorageProviderType.S3Compatible,
            "", "key", "a.png", "image/png", 1, "SchoolLogo");

        act.Should().Throw<ArgumentException>();
    }
}
```

- [ ] **Step 2: Testlerin FAIL ettiğini doğrula**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~StoredFileTests" 2>&1 | tail -5
```

Beklenen: derleme hatası (`StoredFile` tipi yok) — TDD kırmızı.

- [ ] **Step 3: Enum'ları, ID'yi, exception'ı ve event'leri yaz**

`Enums/FileStatus.cs`:

```csharp
namespace Oksis.Domain.Modules.Documents.Enums;

/// <summary>
/// Dosyanın yaşam döngüsü durumu (spec §2.3). PendingUpload: initiate edildi,
/// confirm bekliyor (24s sonra orphan temizliği). Quarantined: tarama
/// Pending/Infected iken indirme kapalı.
/// </summary>
public enum FileStatus
{
    PendingUpload = 1,
    Active = 2,
    Quarantined = 3,
    SoftDeleted = 4,
}
```

`Enums/VirusScanStatus.cs`:

```csharp
namespace Oksis.Domain.Modules.Documents.Enums;

/// <summary>Virüs tarama durumu (spec §2.3). Skipped yalnızca RequiresVirusScan=false kategoriler için.</summary>
public enum VirusScanStatus
{
    Pending = 1,
    Clean = 2,
    Infected = 3,
    Skipped = 4,
}
```

`Enums/StorageProviderType.cs`:

```csharp
namespace Oksis.Domain.Modules.Documents.Enums;

/// <summary>Depolama sağlayıcı türü (spec §2.3). Ftp rezervedir (K6); MVP'de yalnız S3Compatible aktif.</summary>
public enum StorageProviderType
{
    S3Compatible = 1,
    Ftp = 2,
}
```

`ValueObjects/StoredFileId.cs`:

```csharp
namespace Oksis.Domain.Modules.Documents.ValueObjects;

public readonly record struct StoredFileId(Guid Value)
{
    public static StoredFileId New() => new(Guid.NewGuid());
    public static StoredFileId From(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}
```

`Exceptions/DocumentsDomainException.cs` (mevcut kalıp: `DutyDomainException`):

```csharp
using Oksis.Domain.Exceptions;

namespace Oksis.Domain.Modules.Documents.Exceptions;

public sealed class DocumentsDomainException(string code, string message) : DomainException(code, message);
```

`Events/FileUploadConfirmedEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Documents.Events;

/// <summary>
/// Upload tamamlandığında (proxy tek adım veya iki-fazlı confirm) yayınlanır (spec §2.6).
/// Tüketici: VirusScanJob enqueue (RequiresVirusScan=true ise) + ilgili modül side-effect'leri.
/// </summary>
public sealed record FileUploadConfirmedEvent(
    Guid StoredFileId, Guid SchoolId, string Category, long SizeBytes, bool RequiresVirusScan) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
```

`Events/FileQuarantinedEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Documents.Events;

/// <summary>Tarama Infected sonucunda yayınlanır (spec §2.6). Tüketici: bildirim + Critical audit log.</summary>
public sealed record FileQuarantinedEvent(Guid StoredFileId, Guid SchoolId, string Signature) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
```

`Events/FileSoftDeletedEvent.cs`:

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Documents.Events;

/// <summary>Soft delete anında yayınlanır (spec §2.6). Tüketici: 30 gün sonra purge kuyruğu.</summary>
public sealed record FileSoftDeletedEvent(Guid StoredFileId, Guid SchoolId) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
```

- [ ] **Step 4: StoredFile entity'sini yaz**

`Entities/StoredFile.cs`:

```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Documents.Enums;
using Oksis.Domain.Modules.Documents.Events;
using Oksis.Domain.Modules.Documents.Exceptions;
using Oksis.Domain.Modules.Documents.ValueObjects;

namespace Oksis.Domain.Modules.Documents.Entities;

/// <summary>
/// Fiziksel dosyanın kaydı (spec §2.1). Dosyanın kendisi ile bir entity'ye
/// bağlanması ayrı kavramlardır; bağ <see cref="FileAttachment"/>'tadır.
/// Object storage yalnızca byte deposudur; gerçeğin kaynağı bu kayıttır (spec §1.3.1).
/// </summary>
public sealed class StoredFile : TenantEntity
{
    private StoredFile() { } // EF

    public Guid AcademicYearId { get; private set; }
    public StorageProviderType StorageProvider { get; private set; }
    public string Bucket { get; private set; } = null!;
    public string ObjectKey { get; private set; } = null!;
    public string OriginalFileName { get; private set; } = null!;
    public string ContentType { get; private set; } = null!;
    public long SizeBytes { get; private set; }
    public string? Sha256Checksum { get; private set; }
    public string Category { get; private set; } = null!;
    public FileStatus Status { get; private set; }
    public VirusScanStatus VirusScanStatus { get; private set; }

    /// <summary>İndirme yalnız Active + (Clean|Skipped) iken serbesttir (spec §7.3.3).</summary>
    public bool CanBeDownloaded =>
        Status == FileStatus.Active
        && VirusScanStatus is VirusScanStatus.Clean or VirusScanStatus.Skipped;

    /// <summary>İki-fazlı akışın initiate adımı (spec §3.4 InitiateFileUploadCommand). Boyut beyan edilendir; confirm'de gerçek boyutla ezilir.</summary>
    public static StoredFile CreatePending(
        Guid schoolId, Guid academicYearId, StorageProviderType provider,
        string bucket, string objectKey, string originalFileName, string contentType,
        long declaredSizeBytes, string category)
    {
        var file = CreateCore(schoolId, academicYearId, provider, bucket, objectKey,
            originalFileName, contentType, declaredSizeBytes, category);
        file.Status = FileStatus.PendingUpload;
        file.VirusScanStatus = VirusScanStatus.Pending;
        return file;
    }

    /// <summary>Proxy modun tek adımı (spec §3.4 UploadFileCommand): byte'lar yazıldı, kayıt doğrudan taramaya/aktife düşer.</summary>
    public static StoredFile CreateUploaded(
        Guid schoolId, Guid academicYearId, StorageProviderType provider,
        string bucket, string objectKey, string originalFileName, string contentType,
        long sizeBytes, string sha256Checksum, string category, bool requiresVirusScan)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sha256Checksum);
        var file = CreateCore(schoolId, academicYearId, provider, bucket, objectKey,
            originalFileName, contentType, sizeBytes, category);
        file.Sha256Checksum = sha256Checksum;
        file.ApplyUploadCompleted(requiresVirusScan);
        return file;
    }

    /// <summary>İki-fazlı akışın confirm adımı (spec §3.4): StatAsync ile doğrulanan gerçek boyut/checksum yazılır.</summary>
    public void Confirm(long actualSizeBytes, string sha256Checksum, bool requiresVirusScan)
    {
        if (Status != FileStatus.PendingUpload)
        {
            throw new DocumentsDomainException(
                "file.confirm.invalid-status",
                $"Yalnızca PendingUpload dosya confirm edilebilir (mevcut: {Status}).");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(sha256Checksum);
        SizeBytes = actualSizeBytes;
        Sha256Checksum = sha256Checksum;
        ApplyUploadCompleted(requiresVirusScan);
    }

    /// <summary>Tarama Clean sonucu (spec §3.5 VirusScanJob): karantina kalkar.</summary>
    public void MarkScanClean()
    {
        EnsureScanPending();
        VirusScanStatus = VirusScanStatus.Clean;
        Status = FileStatus.Active;
    }

    /// <summary>Tarama Infected sonucu: karantinada kalır, event yayınlanır (spec §2.6).</summary>
    public void MarkScanInfected(string signature)
    {
        EnsureScanPending();
        ArgumentException.ThrowIfNullOrWhiteSpace(signature);
        VirusScanStatus = VirusScanStatus.Infected;
        Status = FileStatus.Quarantined;
        Raise(new FileQuarantinedEvent(Id, SchoolId, signature));
    }

    /// <summary>Soft delete (spec §3.4 DeleteFileCommand): 30 gün sonra purge job fiziksel imha eder.</summary>
    public void MarkSoftDeleted()
    {
        if (Status == FileStatus.SoftDeleted)
        {
            throw new DocumentsDomainException(
                "file.delete.already-deleted", "Dosya zaten silinmiş.");
        }

        Status = FileStatus.SoftDeleted;
        IsDeleted = true;
        Raise(new FileSoftDeletedEvent(Id, SchoolId));
    }

    private static StoredFile CreateCore(
        Guid schoolId, Guid academicYearId, StorageProviderType provider,
        string bucket, string objectKey, string originalFileName, string contentType,
        long sizeBytes, string category)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(bucket);
        ArgumentException.ThrowIfNullOrWhiteSpace(objectKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(originalFileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(contentType);
        ArgumentException.ThrowIfNullOrWhiteSpace(category);
        ArgumentOutOfRangeException.ThrowIfNegative(sizeBytes);

        return new StoredFile
        {
            Id = StoredFileId.New().Value,
            SchoolId = schoolId,
            AcademicYearId = academicYearId,
            StorageProvider = provider,
            Bucket = bucket,
            ObjectKey = objectKey,
            OriginalFileName = originalFileName,
            ContentType = contentType,
            SizeBytes = sizeBytes,
            Category = category,
        };
    }

    private void ApplyUploadCompleted(bool requiresVirusScan)
    {
        Status = requiresVirusScan ? FileStatus.Quarantined : FileStatus.Active;
        VirusScanStatus = requiresVirusScan ? VirusScanStatus.Pending : VirusScanStatus.Skipped;
        Raise(new FileUploadConfirmedEvent(Id, SchoolId, Category, SizeBytes, requiresVirusScan));
    }

    private void EnsureScanPending()
    {
        if (VirusScanStatus != VirusScanStatus.Pending || Status != FileStatus.Quarantined)
        {
            throw new DocumentsDomainException(
                "file.scan.invalid-status",
                $"Tarama sonucu yalnızca karantinadaki Pending dosyaya yazılabilir (mevcut: {Status}/{VirusScanStatus}).");
        }
    }
}
```

**Not:** `Id` ataması `Entity` taban sınıfının `Id` üyesinin init/protected-set erişimine göre uyarlanır — `TeacherAvailability` kalıbında `Id = TeacherAvailabilityId.New().Value;` constructor içinde çalışıyor; object-initializer derlenmezse aynı atamayı private constructor parametresine taşı (davranış birebir aynı kalır, testler değişmez).

- [ ] **Step 5: Testlerin PASS ettiğini doğrula**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~StoredFileTests" 2>&1 | tail -5
```

Beklenen: `Passed! ... 12 passed`.

- [ ] **Step 6: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Documents tests/Oksis.Domain.UnitTests/Modules/Documents
git commit -m "$(cat <<EOF
$(date +%Y-%m-%d) feat,test: StoredFile entity'si ve dosya yaşam döngüsü eklendi.

Spec: dosya-yonetimi-spec.md §2.1/§2.3/§2.6 Faz 1. İki-fazlı upload
(CreatePending/Confirm), proxy (CreateUploaded), tarama geçişleri ve
soft delete davranışları domain event'leriyle birlikte, 12 unit test.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: FileAttachment Entity (TDD)

**Files:**
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/ValueObjects/FileAttachmentId.cs`
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Entities/FileAttachment.cs`
- Test: `oksis-api/tests/Oksis.Domain.UnitTests/Modules/Documents/FileAttachmentTests.cs`

**Interfaces:**
- Consumes: `TenantEntity`, `DocumentsDomainException` (Task 2).
- Produces: `FileAttachment.Create(Guid schoolId, Guid storedFileId, string entityType, Guid entityId, int version = 1, int displayOrder = 0, string? description = null) : FileAttachment`; `UpdateDisplayOrder(int)`, `UpdateDescription(string?)`. Faz 3 Attach/Detach komutları bu imzaları kullanacak.

- [ ] **Step 1: Failing testleri yaz**

`oksis-api/tests/Oksis.Domain.UnitTests/Modules/Documents/FileAttachmentTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Documents.Entities;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Documents;

public class FileAttachmentTests
{
    private static readonly Guid SchoolId = Guid.NewGuid();
    private static readonly Guid StoredFileId = Guid.NewGuid();
    private static readonly Guid EntityId = Guid.NewGuid();

    [Fact]
    public void Create_sets_link_with_defaults()
    {
        var att = FileAttachment.Create(SchoolId, StoredFileId, "Assignment", EntityId);

        att.SchoolId.Should().Be(SchoolId);
        att.StoredFileId.Should().Be(StoredFileId);
        att.EntityType.Should().Be("Assignment");
        att.EntityId.Should().Be(EntityId);
        att.Version.Should().Be(1);
        att.DisplayOrder.Should().Be(0);
        att.Description.Should().BeNull();
    }

    [Fact]
    public void Create_accepts_version_order_description()
    {
        var att = FileAttachment.Create(SchoolId, StoredFileId, "Assignment", EntityId,
            version: 3, displayOrder: 2, description: "İkinci teslim");

        att.Version.Should().Be(3);
        att.DisplayOrder.Should().Be(2);
        att.Description.Should().Be("İkinci teslim");
    }

    [Fact]
    public void Create_rejects_blank_entity_type_and_nonpositive_version()
    {
        var blankType = () => FileAttachment.Create(SchoolId, StoredFileId, " ", EntityId);
        var zeroVersion = () => FileAttachment.Create(SchoolId, StoredFileId, "Assignment", EntityId, version: 0);

        blankType.Should().Throw<ArgumentException>();
        zeroVersion.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void UpdateDisplayOrder_and_description_change_fields()
    {
        var att = FileAttachment.Create(SchoolId, StoredFileId, "Assignment", EntityId);

        att.UpdateDisplayOrder(5);
        att.UpdateDescription("Kapak görseli");

        att.DisplayOrder.Should().Be(5);
        att.Description.Should().Be("Kapak görseli");
    }
}
```

- [ ] **Step 2: FAIL doğrula**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~FileAttachmentTests" 2>&1 | tail -5
```

Beklenen: derleme hatası (`FileAttachment` yok).

- [ ] **Step 3: Entity'yi yaz**

`ValueObjects/FileAttachmentId.cs`:

```csharp
namespace Oksis.Domain.Modules.Documents.ValueObjects;

public readonly record struct FileAttachmentId(Guid Value)
{
    public static FileAttachmentId New() => new(Guid.NewGuid());
    public static FileAttachmentId From(Guid value) => new(value);
    public override string ToString() => Value.ToString();
}
```

`Entities/FileAttachment.cs`:

```csharp
using Oksis.Domain.Common;
using Oksis.Domain.Modules.Documents.ValueObjects;

namespace Oksis.Domain.Modules.Documents.Entities;

/// <summary>
/// Dosya ile iş entity'si arasındaki polimorfik bağ (spec §2.2). Aynı StoredFile
/// N entity'ye bağlanabilir (tek sanal kitap, 12 şube). Bağ silinse bile
/// StoredFile silinmez; fiziksel silme purge job sorumluluğudur (spec §2.5.5).
/// </summary>
public sealed class FileAttachment : TenantEntity
{
    private FileAttachment() { } // EF

    public Guid StoredFileId { get; private set; }
    public string EntityType { get; private set; } = null!;
    public Guid EntityId { get; private set; }
    public int Version { get; private set; }
    public int DisplayOrder { get; private set; }
    public string? Description { get; private set; }

    public static FileAttachment Create(
        Guid schoolId, Guid storedFileId, string entityType, Guid entityId,
        int version = 1, int displayOrder = 0, string? description = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(entityType);
        ArgumentOutOfRangeException.ThrowIfLessThan(version, 1);
        ArgumentOutOfRangeException.ThrowIfNegative(displayOrder);

        return new FileAttachment
        {
            Id = FileAttachmentId.New().Value,
            SchoolId = schoolId,
            StoredFileId = storedFileId,
            EntityType = entityType,
            EntityId = entityId,
            Version = version,
            DisplayOrder = displayOrder,
            Description = description,
        };
    }

    public void UpdateDisplayOrder(int displayOrder)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(displayOrder);
        DisplayOrder = displayOrder;
    }

    public void UpdateDescription(string? description) => Description = description;
}
```

(`Id`/`SchoolId` atama biçimi Task 2 Step 4'teki notla aynı kurala tabidir.)

- [ ] **Step 4: PASS doğrula**

```bash
dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~FileAttachmentTests" 2>&1 | tail -5
```

Beklenen: `Passed! ... 4 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Documents tests/Oksis.Domain.UnitTests/Modules/Documents
git commit -m "$(cat <<EOF
$(date +%Y-%m-%d) feat,test: FileAttachment polimorfik bağ entity'si eklendi.

Spec: dosya-yonetimi-spec.md §2.2 Faz 1. Dosya-entity bağı, versiyon ve
sıralama alanlarıyla; 4 unit test.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: FileCategoryPolicy Kayıt Defteri (TDD)

**Files:**
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Policies/FileCategoryPolicy.cs`
- Create: `oksis-api/src/Oksis.Application/Modules/Documents/Abstractions/IFileCategoryPolicyRegistry.cs`
- Create: `oksis-api/src/Oksis.Application/Modules/Documents/Services/FileCategoryPolicyRegistry.cs`
- Modify: `oksis-api/src/Oksis.Application/DependencyInjection.cs` (singleton kayıt)
- Test: `oksis-api/tests/Oksis.Application.UnitTests/Modules/Documents/FileCategoryPolicyRegistryTests.cs`

**Interfaces:**
- Consumes: `FileCategoryPolicy` record (Domain).
- Produces: `IFileCategoryPolicyRegistry` → `FileCategoryPolicy? Find(string category)`, `FileCategoryPolicy GetRequired(string category)` (bilinmeyen kategori: `DocumentsDomainException`, code `file.category.unknown`), `IReadOnlyCollection<FileCategoryPolicy> All { get; }`. Kategori sabitleri: `FileCategories` static class (`AssignmentSubmission`, `ExamDocument`, `VirtualBook`, `SchoolLogo`, `ClubDocument`, `AnnouncementAttachment`). Faz 2/3 validasyon ve orkestrasyon bu sözleşmeden beslenecek.

**Retention yorumu (bağlayıcı not):** `RetentionPeriod`, ilgili sezonun (AcademicYear) bitişinden itibaren geçerli süredir; `null` = otomatik retention YOK (SchoolLogo "Süresiz" ve VirtualBook "Sözleşme süresi" — ikisi de RetentionEnforcementJob kapsamı dışıdır, sözleşme imhası offboarding akışına aittir, spec §7.4). Kesin süreler KVKK teyidiyle güncellenecek (spec §11.1); tek değişiklik noktası bu registry'dir.

- [ ] **Step 1: Failing testleri yaz**

`oksis-api/tests/Oksis.Application.UnitTests/Modules/Documents/FileCategoryPolicyRegistryTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Documents.Abstractions;
using Oksis.Application.Modules.Documents.Services;
using Oksis.Domain.Modules.Documents.Exceptions;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Documents;

public class FileCategoryPolicyRegistryTests
{
    private readonly IFileCategoryPolicyRegistry _registry = new FileCategoryPolicyRegistry();

    [Fact]
    public void All_contains_exactly_six_mvp_categories()
    {
        _registry.All.Select(p => p.Category).Should().BeEquivalentTo(
            FileCategories.AssignmentSubmission, FileCategories.ExamDocument,
            FileCategories.VirtualBook, FileCategories.SchoolLogo,
            FileCategories.ClubDocument, FileCategories.AnnouncementAttachment);
    }

    [Fact]
    public void SchoolLogo_policy_matches_spec_table()
    {
        var policy = _registry.GetRequired(FileCategories.SchoolLogo);

        policy.AllowedExtensions.Should().BeEquivalentTo("png", "svg");
        policy.MaxSizeBytes.Should().Be(2 * 1024 * 1024);
        policy.RequiresVirusScan.Should().BeTrue();      // svg riski (spec §2.4)
        policy.ForcePresigned.Should().BeFalse();
        policy.AllowMultipart.Should().BeFalse();
        policy.RetentionPeriod.Should().BeNull();        // Süresiz
    }

    [Fact]
    public void VirtualBook_policy_is_presigned_multipart_500mb()
    {
        var policy = _registry.GetRequired(FileCategories.VirtualBook);

        policy.AllowedExtensions.Should().BeEquivalentTo("pdf", "epub");
        policy.MaxSizeBytes.Should().Be(500L * 1024 * 1024);
        policy.ForcePresigned.Should().BeTrue();
        policy.AllowMultipart.Should().BeTrue();
        policy.RetentionPeriod.Should().BeNull();        // Sözleşme süresi — job dışı
    }

    [Fact]
    public void AssignmentSubmission_policy_has_one_year_retention()
    {
        var policy = _registry.GetRequired(FileCategories.AssignmentSubmission);

        policy.AllowedExtensions.Should().BeEquivalentTo("pdf", "docx", "jpg", "png");
        policy.MaxSizeBytes.Should().Be(20 * 1024 * 1024);
        policy.RetentionPeriod.Should().Be(TimeSpan.FromDays(365)); // Sezon + 1 yıl
    }

    [Fact]
    public void Every_policy_has_matching_content_types_and_positive_size()
    {
        foreach (var policy in _registry.All)
        {
            policy.AllowedContentTypes.Should().NotBeEmpty(policy.Category);
            policy.AllowedExtensions.Should().NotBeEmpty(policy.Category);
            policy.MaxSizeBytes.Should().BePositive(policy.Category);
        }
    }

    [Fact]
    public void Find_unknown_returns_null_and_GetRequired_throws()
    {
        _registry.Find("NoSuchCategory").Should().BeNull();

        var act = () => _registry.GetRequired("NoSuchCategory");

        act.Should().Throw<DocumentsDomainException>()
            .Which.Code.Should().Be("file.category.unknown");
    }
}
```

- [ ] **Step 2: FAIL doğrula**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~FileCategoryPolicyRegistryTests" 2>&1 | tail -5
```

Beklenen: derleme hatası.

- [ ] **Step 3: Policy record'unu, sözleşmeyi ve registry'yi yaz**

`oksis-api/src/Oksis.Domain/Modules/Documents/Policies/FileCategoryPolicy.cs` (spec §2.4 birebir):

```csharp
namespace Oksis.Domain.Modules.Documents.Policies;

/// <summary>
/// Bir dosya kategorisinin kuralları (spec §2.4). Kurallar koda dağıtılmaz;
/// tek kayıt defterinde yaşar. RetentionPeriod sezon bitişinden itibarendir;
/// null = otomatik retention yok (Süresiz veya sözleşme-bazlı imha).
/// </summary>
public sealed record FileCategoryPolicy(
    string Category,
    string[] AllowedExtensions,
    string[] AllowedContentTypes,
    long MaxSizeBytes,
    bool RequiresVirusScan,
    bool ForcePresigned,
    bool AllowMultipart,
    TimeSpan? RetentionPeriod);
```

`oksis-api/src/Oksis.Application/Modules/Documents/Abstractions/IFileCategoryPolicyRegistry.cs`:

```csharp
using Oksis.Domain.Modules.Documents.Policies;

namespace Oksis.Application.Modules.Documents.Abstractions;

/// <summary>MVP kategori sabitleri (spec §2.4). Yeni modül dosya kullanacaksa buraya kategori ekler.</summary>
public static class FileCategories
{
    public const string AssignmentSubmission = "AssignmentSubmission";
    public const string ExamDocument = "ExamDocument";
    public const string VirtualBook = "VirtualBook";
    public const string SchoolLogo = "SchoolLogo";
    public const string ClubDocument = "ClubDocument";
    public const string AnnouncementAttachment = "AnnouncementAttachment";
}

/// <summary>Kategori politikası kayıt defteri (spec §2.4). Upload validasyonu ve orkestrasyonun tek kural kaynağı.</summary>
public interface IFileCategoryPolicyRegistry
{
    IReadOnlyCollection<FileCategoryPolicy> All { get; }
    FileCategoryPolicy? Find(string category);
    FileCategoryPolicy GetRequired(string category);
}
```

`oksis-api/src/Oksis.Application/Modules/Documents/Services/FileCategoryPolicyRegistry.cs`:

```csharp
using Oksis.Application.Modules.Documents.Abstractions;
using Oksis.Domain.Modules.Documents.Exceptions;
using Oksis.Domain.Modules.Documents.Policies;

namespace Oksis.Application.Modules.Documents.Services;

/// <summary>
/// Kod-içi kategori kayıt defteri (spec §2.4 tablosu). Retention değerleri
/// taslaktır; KVKK teyidiyle yalnız burada güncellenir (spec §11.1).
/// </summary>
public sealed class FileCategoryPolicyRegistry : IFileCategoryPolicyRegistry
{
    private const long Mb = 1024 * 1024;

    private static readonly Dictionary<string, FileCategoryPolicy> _policies =
        new FileCategoryPolicy[]
        {
            new(FileCategories.AssignmentSubmission,
                ["pdf", "docx", "jpg", "png"],
                ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"],
                20 * Mb, RequiresVirusScan: true, ForcePresigned: false, AllowMultipart: false,
                RetentionPeriod: TimeSpan.FromDays(365)),                       // Sezon + 1 yıl
            new(FileCategories.ExamDocument,
                ["pdf"], ["application/pdf"],
                50 * Mb, RequiresVirusScan: true, ForcePresigned: false, AllowMultipart: false,
                RetentionPeriod: TimeSpan.FromDays(730)),                       // Sezon + 2 yıl
            new(FileCategories.VirtualBook,
                ["pdf", "epub"], ["application/pdf", "application/epub+zip"],
                500 * Mb, RequiresVirusScan: true, ForcePresigned: true, AllowMultipart: true,
                RetentionPeriod: null),                                         // Sözleşme süresi (offboarding imhası)
            new(FileCategories.SchoolLogo,
                ["png", "svg"], ["image/png", "image/svg+xml"],
                2 * Mb, RequiresVirusScan: true, ForcePresigned: false, AllowMultipart: false,
                RetentionPeriod: null),                                         // Süresiz
            new(FileCategories.ClubDocument,
                ["pdf", "docx", "jpg"],
                ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg"],
                20 * Mb, RequiresVirusScan: true, ForcePresigned: false, AllowMultipart: false,
                RetentionPeriod: TimeSpan.FromDays(365)),                       // Sezon + 1 yıl
            new(FileCategories.AnnouncementAttachment,
                ["pdf", "jpg", "png"], ["application/pdf", "image/jpeg", "image/png"],
                10 * Mb, RequiresVirusScan: true, ForcePresigned: false, AllowMultipart: false,
                RetentionPeriod: TimeSpan.FromDays(365)),                       // Sezon + 1 yıl
        }.ToDictionary(p => p.Category);

    public IReadOnlyCollection<FileCategoryPolicy> All => _policies.Values;

    public FileCategoryPolicy? Find(string category) =>
        _policies.GetValueOrDefault(category);

    public FileCategoryPolicy GetRequired(string category) =>
        Find(category) ?? throw new DocumentsDomainException(
            "file.category.unknown", $"Tanımsız dosya kategorisi: {category}");
}
```

`oksis-api/src/Oksis.Application/DependencyInjection.cs` — mevcut `services.AddSingleton(mapsterConfig);` satırının bulunduğu bloğa şu kaydı ekle (using'leri de ekle):

```csharp
services.AddSingleton<IFileCategoryPolicyRegistry, FileCategoryPolicyRegistry>();
```

- [ ] **Step 4: PASS doğrula**

```bash
dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~FileCategoryPolicyRegistryTests" 2>&1 | tail -5
```

Beklenen: `Passed! ... 6 passed`.

- [ ] **Step 5: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Documents/Policies src/Oksis.Application/Modules/Documents \
  src/Oksis.Application/DependencyInjection.cs tests/Oksis.Application.UnitTests/Modules/Documents
git commit -m "$(cat <<EOF
$(date +%Y-%m-%d) feat,test: FileCategoryPolicy kayıt defteri eklendi (6 MVP kategorisi).

Spec: dosya-yonetimi-spec.md §2.4 Faz 1. Kategori kuralları tek registry'de;
retention sezon-bitişi-göreli, null=otomatik-imha-yok yorumu sabitlendi.
6 unit test.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: EF Persistence — Konfigürasyonlar, DbSet'ler, Migration

**Files:**
- Modify: `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/OksisSchemas.cs` (+`Files`)
- Modify: `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/TableBuilderExtensions.cs` (+`ToFilesTable`)
- Create: `oksis-api/src/Oksis.Domain/Modules/Documents/Events/SchoolBucketProvisionedEvent.cs`
- Create: `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/Documents/StoredFileConfiguration.cs`
- Create: `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/Documents/FileAttachmentConfiguration.cs`
- Modify: `oksis-api/src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` (+2 DbSet)
- Modify: `oksis-api/src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (+2 DbSet)
- Create (üretilir): migration `20260703_documents_stored_files`

**Interfaces:**
- Consumes: `StoredFile`, `FileAttachment` (Task 2-3).
- Produces: `IApplicationDbContext.StoredFiles : DbSet<StoredFile>`, `IApplicationDbContext.FileAttachments : DbSet<FileAttachment>`; tablolar `[files].stored_files`, `[files].file_attachments`. Faz 2+ handler'ları bu DbSet'leri kullanacak.

- [ ] **Step 1: Şema sabiti + tablo extension'ı ekle**

`OksisSchemas.cs` içine:

```csharp
public const string Files = "files";
```

`TableBuilderExtensions.cs` içine:

```csharp
public static EntityTypeBuilder<T> ToFilesTable<T>(this EntityTypeBuilder<T> builder, string name)
    where T : class => builder.ToTable(name, OksisSchemas.Files);
```

- [ ] **Step 2: SchoolBucketProvisionedEvent'i ekle**

`oksis-api/src/Oksis.Domain/Modules/Documents/Events/SchoolBucketProvisionedEvent.cs` (spec §2.6 — Faz 2'deki ProvisionSchoolBucketCommand yayınlayacak; record şimdi tanımlanır ki §2.6 seti tam olsun):

```csharp
using Oksis.Domain.Common;

namespace Oksis.Domain.Modules.Documents.Events;

/// <summary>Onboarding bucket provisioning tamamlandığında yayınlanır (spec §2.6). Tüketici: onboarding wizard ilerleme adımı.</summary>
public sealed record SchoolBucketProvisionedEvent(Guid SchoolId, string Bucket) : IDomainEvent
{
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}
```

- [ ] **Step 3: StoredFileConfiguration'ı yaz**

`Configurations/Documents/StoredFileConfiguration.cs` (kalıp: `TeacherAvailabilityConfiguration`; kolon adları global snake_case convention'dan gelir):

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Documents.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Documents;

/// <summary>
/// EF Core mapping for <see cref="StoredFile"/>. Schema: [files].stored_files.
/// İndeksler spec §2.5: durum taramaları, checksum, (bucket, object_key) unique.
/// </summary>
public sealed class StoredFileConfiguration : IEntityTypeConfiguration<StoredFile>
{
    public void Configure(EntityTypeBuilder<StoredFile> builder)
    {
        builder.ToFilesTable("stored_files");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AcademicYearId).IsRequired();
        builder.Property(x => x.StorageProvider).HasConversion<int>().IsRequired();
        builder.Property(x => x.Bucket).HasMaxLength(63).IsRequired();
        builder.Property(x => x.ObjectKey).HasMaxLength(512).IsRequired();
        builder.Property(x => x.OriginalFileName).HasMaxLength(255).IsRequired();
        builder.Property(x => x.ContentType).HasMaxLength(127).IsRequired();
        builder.Property(x => x.SizeBytes).IsRequired();
        builder.Property(x => x.Sha256Checksum).HasMaxLength(64).IsFixedLength().IsUnicode(false);
        builder.Property(x => x.Category).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.VirusScanStatus).HasConversion<int>().IsRequired();

        // Audit (TenantEntity)
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.Ignore(x => x.DomainEvents);
        builder.Ignore(x => x.CanBeDownloaded);

        // Orphan/purge job taramaları (spec §2.5.1)
        builder.HasIndex(x => new { x.SchoolId, x.Status })
            .HasDatabaseName("ix_stored_files_school_status");

        // Bütünlük kontrolü + gelecekte tenant-içi dedup (spec §2.5.2, K2)
        builder.HasIndex(x => new { x.SchoolId, x.Sha256Checksum })
            .HasDatabaseName("ix_stored_files_school_checksum");

        // Aynı anahtara çift kayıt imkânsız (spec §2.5.4)
        builder.HasIndex(x => new { x.Bucket, x.ObjectKey })
            .IsUnique()
            .HasDatabaseName("ux_stored_files_bucket_object_key");
    }
}
```

- [ ] **Step 4: FileAttachmentConfiguration'ı yaz**

`Configurations/Documents/FileAttachmentConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Documents.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Documents;

/// <summary>
/// EF Core mapping for <see cref="FileAttachment"/>. Schema: [files].file_attachments.
/// StoredFile FK Restrict: bağ silinse bile dosya silinmez (spec §2.5.5) —
/// fiziksel silme purge job sorumluluğudur.
/// </summary>
public sealed class FileAttachmentConfiguration : IEntityTypeConfiguration<FileAttachment>
{
    public void Configure(EntityTypeBuilder<FileAttachment> builder)
    {
        builder.ToFilesTable("file_attachments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.StoredFileId).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.EntityId).IsRequired();
        builder.Property(x => x.Version).IsRequired().HasDefaultValue(1);
        builder.Property(x => x.DisplayOrder).IsRequired().HasDefaultValue(0);
        builder.Property(x => x.Description).HasMaxLength(500);

        // Audit (TenantEntity)
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.Ignore(x => x.DomainEvents);

        builder.HasOne<StoredFile>()
            .WithMany()
            .HasForeignKey(x => x.StoredFileId)
            .OnDelete(DeleteBehavior.Restrict);

        // "Bu entity'nin dosyaları" ana sorgu yolu (spec §2.5.3)
        builder.HasIndex(x => new { x.SchoolId, x.EntityType, x.EntityId })
            .HasDatabaseName("ix_file_attachments_entity");
    }
}
```

- [ ] **Step 5: DbSet'leri ekle**

`IApplicationDbContext.cs` — mevcut DbSet bloklarının sonuna (using'lerle):

```csharp
// Documents (dosya-yonetimi-spec.md Faz 1)
DbSet<StoredFile> StoredFiles { get; }
DbSet<FileAttachment> FileAttachments { get; }
```

`OksisDbContext.cs` — aynı çiftin implementasyonu:

```csharp
public DbSet<StoredFile> StoredFiles => Set<StoredFile>();
public DbSet<FileAttachment> FileAttachments => Set<FileAttachment>();
```

(Mevcut DbSet implementasyon kalıbı farklıysa — ör. auto-property — dosyadaki kalıbı birebir izle. Global query filter `IHasTenant` convention'ından otomatik uygulanır; `TenantEntity` türevi olduğu için ek kayıt gerekmez — migration sonrası Step 7'de doğrulanacak.)

- [ ] **Step 6: Build + migration üret**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
dotnet build
dotnet ef migrations add 20260703_documents_stored_files \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```

Beklenen: migration dosyası `[files]` şemasında `stored_files` + `file_attachments` CREATE TABLE, 3 indeks + 1 unique indeks içerir. Migration'ı aç ve şunları GÖZLE doğrula: `schema: "files"`, `ux_stored_files_bucket_object_key` unique, FK `on delete restrict`.

- [ ] **Step 7: Veritabanına uygula ve tenant filtresini doğrula**

```bash
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet test
```

Beklenen: update başarılı; TÜM test suite yeşil (regresyon yok). Global query filter doğrulaması: `OksisDbContextModelSnapshot.cs` içinde `stored_files` entity'sinde `HasQueryFilter` görünmeli — görünmüyorsa DUR: `IHasTenant` convention'ının nerede uygulandığını bul (`OksisDbContext.OnModelCreating`) ve Documents entity'lerinin kapsandığını doğrulamadan ilerleme.

- [ ] **Step 8: Commit**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Documents/Events src/Oksis.Infrastructure/Persistence \
  src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs
git commit -m "$(cat <<EOF
$(date +%Y-%m-%d) feat: Documents persistence katmanı ve files şeması eklendi.

Spec: dosya-yonetimi-spec.md §2.5/§3.1 Faz 1. [files].stored_files +
file_attachments tabloları, spec indeksleri, Restrict FK, tenant global
query filter, 20260703_documents_stored_files migration'ı.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Faz Kapanışı — Modül Dokümantasyonu + Doğrulama

**Files:**
- Create: `oksis/.claude/docs/modules/documents/` (10-dosya şablonu `_MODULE_TEMPLATE`'ten)
- Modify: `oksis/.claude/docs/modules/documents/completion_status.md` (Faz 0-1 ✅)

**Interfaces:**
- Consumes: Task 1-5 çıktıları.
- Produces: `documents` modül dokümantasyonu; sonraki fazların durum takip noktası.

- [ ] **Step 1: Tüm testleri ve build'i son kez doğrula**

```bash
cd /Users/farukkaya/Projects/oksis/oksis-api
dotnet build && dotnet test 2>&1 | tail -5
```

Beklenen: build SUCCESS, tüm testler PASS. Değilse önce düzelt (superpowers:systematic-debugging), sonra devam.

- [ ] **Step 2: Modül dokümantasyon klasörünü oluştur**

Workspace root'ta `_MODULE_TEMPLATE` klasörünü `documents` adıyla kopyala ve doldur:

```bash
cp -r /Users/farukkaya/Projects/oksis/.claude/docs/modules/_MODULE_TEMPLATE \
      /Users/farukkaya/Projects/oksis/.claude/docs/modules/documents
```

Doldurulacak dosyalar (spec'ten özetle; `{{TBD}}` bırakılan yerleri açıkça belirt):
- `README.md`: modül adı "Documents (Dosya Yönetimi)", Last Updated bugün, Files checkbox'ları işaretli olanlar.
- `domain-model.md`: StoredFile, FileAttachment, enum'lar, event'ler, FileCategoryPolicy (spec §2).
- `database-schema.md`: `[files].stored_files` + `file_attachments` + indeksler (spec §2.5).
- `business-rules.md`: temel ilkeler (spec §1.3), retention yorumu (Task 4 notu), CanBeDownloaded kuralı.
- `permissions.md`: `files.*` matrisi (spec §4) — "Faz 3'te backend'e bağlanacak" notuyla.
- `api-contracts.md`, `notifications.md`, `ui-flows.md`: `{{TBD}}` — Faz 3/4/5'te dolacak.
- `open-questions.md`: spec §11 Açık İşler listesi.
- `completion_status.md`: Faz 0-1 ✅ (tarih + commit hash'leri), Faz 2-5 ⏳; "Spec Dışına Çıkılanlar" bölümü BOŞ (sapma yok) — retention yorumu sapma değil, spec'in taslak notunun somutlaştırılmasıdır ve business-rules.md'ye yazılmıştır.

- [ ] **Step 3: permission-matrix.md güncelleme kararı**

`files.*` izinleri backend'e Faz 3'te bağlanacak. `oksis/.claude/docs/permission-matrix.md`'ye satırları ŞİMDİ ekleme — Faz 3 planının işi (tek kaynak: spec §4). Bu adımda yalnız modül `permissions.md`'sinde matris + faz notu bulunur. (Erken eklenirse matris koddan önce "var" görünür — yanıltıcı.)

- [ ] **Step 4: Workspace docs commit**

```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/modules/documents
git commit -m "$(cat <<EOF
$(date +%Y-%m-%d) docs: Documents modülü dokümantasyonu açıldı (Faz 0-1 kapanışı).

dosya-yonetimi-spec.md Faz 0-1 teslim durumu, domain/schema/permissions
dokümanları; api-contracts/ui-flows Faz 3+/5'te dolacak.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
git push origin master
```

- [ ] **Step 5: Kullanıcıya faz kapanış özeti ver**

Faz 0-1 tesliminin özetini Türkçe raporla: ne kuruldu, kaç test, migration adı, sıradaki adım (Faz 2 planı: `IStorageService` + `S3CompatibleStorageService` + provisioning — yeni plan dosyası yazılacak). `feature/dosya-yonetimi-faz0-1` branch'inin merge/PR kararını kullanıcıya sor (superpowers:finishing-a-development-branch).
