# Duyurular A1 — Omurga Implementation Plan (2/4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Bu dosya `2026-08-02-duyurular-a1-omurga.md`'nin devamıdır.** Global Constraints, dosya
> yapısı ve görev listesi orada tanımlıdır — bu dosyayı çalıştırmadan önce oku. Görev 1–5
> (domain katmanı) tamamlanmış olmalıdır.

**Bu dosyanın kapsamı:** Görev 6–9 — kalıcılık, izinler, DTO'lar ve kademe kuralı.

---

### Task 6: EF configuration + DbContext + migration

**Files:**
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementTargetConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementRecipientConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementAuditEntryConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Announcements/AnnouncementTemplateConfiguration.cs`
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementPersistenceTests.cs`

**Interfaces:**
- Consumes: Task 3–5 entity'leri; `ToSchoolTable` (`Persistence/Configurations/TableBuilderExtensions.cs`)
- Produces: `IApplicationDbContext` üzerinde `DbSet<Announcement> Announcements`, `DbSet<AnnouncementTarget> AnnouncementTargets`, `DbSet<AnnouncementRecipient> AnnouncementRecipients`, `DbSet<AnnouncementAuditEntry> AnnouncementAuditEntries`, `DbSet<AnnouncementTemplate> AnnouncementTemplates`. Task 12–16 bunları okur/yazar.

- [ ] **Step 1: Failing integration test yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementPersistenceTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

public sealed class AnnouncementPersistenceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 2, 9, 0, 0, TimeSpan.FromHours(3));

    [Fact]
    public async Task Should_RoundTripChannelsAndStatus_When_AnnouncementSaved()
    {
        await using var fixture = await TestDbFixture.CreateAsync();
        var schoolId = fixture.SchoolId;

        var announcement = Announcement.CreateDraft(
            schoolId, Guid.NewGuid(), Guid.NewGuid(), "Okul Müdürlüğü", null, "Ayşe Yılmaz",
            AnnouncementType.Institutional, "Servis saati değişikliği",
            "Yarın servisler 10 dakika erken kalkacaktır.", urgent: true, pinned: false,
            scheduledAt: null, validUntil: null, channels: [DeliveryChannel.Push]);

        announcement.Publish(AnnouncementReach.SchoolWide, recipientCount: 428, Now);

        fixture.Db.Announcements.Add(announcement);
        await fixture.Db.SaveChangesAsync();
        fixture.Db.ChangeTracker.Clear();

        var loaded = await fixture.Db.Announcements.SingleAsync(a => a.Id == announcement.Id);

        loaded.Status.Should().Be(AnnouncementStatus.Published);
        loaded.Urgent.Should().BeTrue();
        loaded.RecipientCountSnapshot.Should().Be(428);
        loaded.Channels.Should().BeEquivalentTo(new[] { DeliveryChannel.InApp, DeliveryChannel.Push });
    }

    [Fact]
    public async Task Should_NotHaveSoftDeleteColumn_When_AnnouncementMapped()
    {
        // INV-1'in şema seviyesindeki karşılığı: is_deleted kolonu HİÇ YOK.
        await using var fixture = await TestDbFixture.CreateAsync();

        var entityType = fixture.Db.Model.FindEntityType(typeof(Announcement))!;
        entityType.FindProperty("IsDeleted").Should().BeNull();
    }

    [Fact]
    public async Task Should_IsolateByTenant_When_TwoSchoolsHaveAnnouncements()
    {
        await using var fixture = await TestDbFixture.CreateAsync();

        var otherSchoolId = Guid.NewGuid();
        var mine = Announcement.CreateDraft(
            fixture.SchoolId, Guid.NewGuid(), Guid.NewGuid(), "Okul Müdürlüğü", null, null,
            AnnouncementType.Institutional, "Bizim duyuru", "Bizim okulun duyurusu.",
            false, false, null, null, [DeliveryChannel.InApp]);
        var theirs = Announcement.CreateDraft(
            otherSchoolId, Guid.NewGuid(), Guid.NewGuid(), "Okul Müdürlüğü", null, null,
            AnnouncementType.Institutional, "Onların duyuru", "Baska okulun duyurusu.",
            false, false, null, null, [DeliveryChannel.InApp]);

        fixture.Db.Announcements.AddRange(mine, theirs);
        await fixture.Db.SaveChangesAsync();
        fixture.Db.ChangeTracker.Clear();

        var visible = await fixture.Db.Announcements.ToListAsync();

        visible.Should().ContainSingle().Which.Id.Should().Be(mine.Id);
    }
}
```

> **Not:** `TestDbFixture` adı bu depodaki mevcut integration test fixture'ının adıdır.
> **Step 2'de gerçek adını doğrula** ve testi ona göre düzelt — uydurma.

- [ ] **Step 2: Mevcut fixture adını doğrula**

Run:
```bash
cd /Users/farukkaya/Repositories/oksis-api
grep -rn "class.*Fixture\|IClassFixture\|CreateAsync" tests/Oksis.Infrastructure.IntegrationTests/Persistence/AccountPersistenceTests.cs | head -10
```

Expected: Gerçek fixture tipi ve kurulum çağrısı görünür. Testi bu kalıba uyarla — `SchoolId` ve `Db` erişimlerinin karşılıklarını kullan.

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementPersistenceTests"`
Expected: FAIL — `Db.Announcements` yok (derleme hatası).

- [ ] **Step 4: `AnnouncementConfiguration` yaz**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Announcements.Entities;
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Infrastructure.Persistence.Configurations.Announcements;

/// <summary>
/// EF mapping — [school].announcements. Duyuru bir OKUL kaydıdır, bildirim değildir;
/// bu yüzden <c>notifications</c> şemasına konmaz (modülün kavramsal sınırı §1.1).
///
/// <para><b>Soft-delete YOK:</b> <c>Announcement</c> <c>PermanentTenantEntity</c>'den türer,
/// bu yüzden <c>OksisDbContext</c>'in <c>ISoftDeletable</c> koşullu global filtresi
/// uygulanmaz. Tenant filtresi <c>IHasTenant</c> üzerinden uygulanmaya DEVAM eder.</para>
/// </summary>
public sealed class AnnouncementConfiguration : IEntityTypeConfiguration<Announcement>
{
    public void Configure(EntityTypeBuilder<Announcement> builder)
    {
        builder.ToSchoolTable("announcements");
        builder.HasKey(x => x.Id);

        // Id, Entity ctor'unda Guid.NewGuid ile üretilir; ValueGeneratedNever olmadan EF
        // dolu anahtarı "mevcut kayıt" sanabilir (AttendanceSession/ClassRoomStudent kalıbı).
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AcademicSessionId).IsRequired();

        builder.Property(x => x.Status).IsRequired().HasConversion<int>();
        builder.Property(x => x.Type).IsRequired().HasConversion<int>();
        builder.Property(x => x.Reach).IsRequired().HasConversion<int>();

        builder.Property(x => x.Title).IsRequired().HasMaxLength(Announcement.TitleMaxLength);
        builder.Property(x => x.Body).IsRequired();
        builder.Property(x => x.Urgent).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.Pinned).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.Amended).IsRequired().HasDefaultValue(false);

        builder.Property(x => x.PublisherId).IsRequired();
        builder.Property(x => x.PublisherLabel).IsRequired().HasMaxLength(120);
        builder.Property(x => x.PublisherSignature).HasMaxLength(160);
        builder.Property(x => x.PublisherRealName).HasMaxLength(160);

        builder.Property(x => x.PublishedAt);
        builder.Property(x => x.ScheduledAt);
        builder.Property(x => x.ValidUntil);
        builder.Property(x => x.RecipientCountSnapshot);

        builder.Property(x => x.WithdrawReason).HasMaxLength(500);
        builder.Property(x => x.WithdrawnAt);
        builder.Property(x => x.WithdrawnBy);
        builder.Property(x => x.StatusBeforeWithdraw).HasConversion<int?>();

        builder.Property(x => x.AttachmentFileId);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Kanallar küçük ve sabit bir kümedir; ayrı tablo yerine virgülle ayrılmış int
        // listesi olarak saklanır. Kanala göre SORGULAMA yapılmaz — yalnız okunur.
        builder.Property<string>("ChannelsRaw")
            .HasColumnName("channels")
            .IsRequired()
            .HasMaxLength(32);

        builder.Navigation(x => x.Channels).Metadata.SetField(null);
        builder.Ignore(x => x.Channels);

        // Sıcak okuma yolları: envanter (okul + statü), gelen kutusu sıralaması (yayın anı).
        builder.HasIndex(x => new { x.SchoolId, x.Status });
        builder.HasIndex(x => x.PublishedAt);
    }
}
```

> **DİKKAT — `Channels` eşlemesi.** Yukarıdaki `ChannelsRaw` yaklaşımı `Ignore` ile
> birlikte çalışmaz; `IReadOnlyList<DeliveryChannel>` bir field-backed koleksiyondur.
> **Step 5'te doğru eşlemeyi kur.**

- [ ] **Step 5: `Channels` eşlemesini value converter ile düzelt**

Step 4'teki `ChannelsRaw` / `Ignore` bloğunu **sil** ve yerine şunu koy:

```csharp
        // _channels field-backed koleksiyondur; küçük ve sabit bir küme olduğu için ayrı
        // tablo açılmaz, virgülle ayrılmış int dizisi olarak tek kolona yazılır.
        // Kanala göre SORGU YAPILMAZ (yalnız okunur) — bu yüzden normalleştirme gereksizdir.
        builder.Property<string>("_channelsRaw")
            .HasColumnName("channels")
            .IsRequired()
            .HasMaxLength(32);
```

ve `Announcement` entity'sine (Task 3 dosyası) EF'in yazacağı gölge alanı besleyen
dönüşümü ekle — `src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs` içinde
`_channels` tanımının hemen altına:

```csharp
    /// <summary>
    /// EF'in tek kolona yazdığı ham gösterim ("0,1"). Domain tarafı bunu görmez;
    /// <see cref="Channels"/> üzerinden okunur. Infrastructure katmanının domain'e
    /// EF Core sızdırmaması için ATTRIBUTE KULLANILMAZ — eşleme fluent API'dedir.
    /// </summary>
    private string ChannelsRaw
    {
        get => string.Join(',', _channels.Select(c => (int)c));
        set
        {
            _channels.Clear();
            if (string.IsNullOrWhiteSpace(value)) return;
            foreach (var part in value.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                _channels.Add((DeliveryChannel)int.Parse(part));
            }
        }
    }
```

ve configuration'da gölge alan yerine bu private property'yi eşle:

```csharp
        builder.Property<string>("ChannelsRaw")
            .HasColumnName("channels")
            .IsRequired()
            .HasMaxLength(32);
        builder.Ignore(x => x.Channels);
```

- [ ] **Step 6: Kalan 4 configuration'ı yaz**

`AnnouncementTargetConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Announcements.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Announcements;

/// <summary>EF mapping — [school].announcement_targets. Yayın anında donar (INV-2).</summary>
public sealed class AnnouncementTargetConfiguration : IEntityTypeConfiguration<AnnouncementTarget>
{
    public void Configure(EntityTypeBuilder<AnnouncementTarget> builder)
    {
        builder.ToSchoolTable("announcement_targets");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AnnouncementId).IsRequired();
        builder.Property(x => x.Dimension).IsRequired().HasConversion<int>();
        builder.Property(x => x.Key).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Bucket).IsRequired().HasConversion<int>();
        builder.Property(x => x.Label).IsRequired().HasMaxLength(200);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasIndex(x => x.AnnouncementId);
    }
}
```

`AnnouncementRecipientConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Announcements.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Announcements;

/// <summary>
/// EF mapping — [school].announcement_recipients. Gelen kutusu sorgusunun ve okundu
/// takibinin dayandığı tablo; en sık okunan duyuru tablosudur.
/// </summary>
public sealed class AnnouncementRecipientConfiguration : IEntityTypeConfiguration<AnnouncementRecipient>
{
    public void Configure(EntityTypeBuilder<AnnouncementRecipient> builder)
    {
        builder.ToSchoolTable("announcement_recipients");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AnnouncementId).IsRequired();
        builder.Property(x => x.PersonId).IsRequired();
        builder.Property(x => x.RoleAtPublish).IsRequired().HasMaxLength(50);
        builder.Property(x => x.ChildPersonId);
        builder.Property(x => x.IsRead).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.ReadAt);
        builder.Property(x => x.RowVersion).IsRowVersion();

        // Gelen kutusu: "bana gelen okunmamışlar". Okunmamış rozeti bu indeksten beslenir.
        builder.HasIndex(x => new { x.PersonId, x.IsRead });
        // Gönderim raporu: duyuru başına toplam/görülen sayımı.
        builder.HasIndex(x => x.AnnouncementId);
        // Aynı kişi aynı duyuruda iki kez alıcı olamaz — çok çocuklu veli tekilleştirmesi
        // (DYR-F-20) bu kısıtla DB seviyesinde de garanti altına alınır.
        builder.HasIndex(x => new { x.AnnouncementId, x.PersonId }).IsUnique();
    }
}
```

`AnnouncementAuditEntryConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Announcements.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Announcements;

/// <summary>EF mapping — [school].announcement_audit_entries. Değiştirilemez.</summary>
public sealed class AnnouncementAuditEntryConfiguration : IEntityTypeConfiguration<AnnouncementAuditEntry>
{
    public void Configure(EntityTypeBuilder<AnnouncementAuditEntry> builder)
    {
        builder.ToSchoolTable("announcement_audit_entries");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AnnouncementId).IsRequired();
        builder.Property(x => x.ActorId).IsRequired();
        builder.Property(x => x.ActorName).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Action).IsRequired().HasMaxLength(200);
        builder.Property(x => x.At).IsRequired();
        builder.Property(x => x.Field).HasMaxLength(200);
        builder.Property(x => x.Tag).HasMaxLength(120);
        builder.Property(x => x.Tone).HasMaxLength(20);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasIndex(x => new { x.AnnouncementId, x.At });
    }
}
```

`AnnouncementTemplateConfiguration.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Oksis.Domain.Modules.Announcements.Entities;

namespace Oksis.Infrastructure.Persistence.Configurations.Announcements;

/// <summary>EF mapping — [school].announcement_templates. Ayrı aggregate.</summary>
public sealed class AnnouncementTemplateConfiguration : IEntityTypeConfiguration<AnnouncementTemplate>
{
    public void Configure(EntityTypeBuilder<AnnouncementTemplate> builder)
    {
        builder.ToSchoolTable("announcement_templates");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.Name).IsRequired().HasMaxLength(120);
        builder.Property(x => x.Description).IsRequired().HasMaxLength(500);
        builder.Property(x => x.Urgent).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.UsageCount).IsRequired().HasDefaultValue(0);
        builder.Property(x => x.LastUsedAt);
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.HasIndex(x => new { x.SchoolId, x.Name }).IsUnique();
    }
}
```

- [ ] **Step 7: `IApplicationDbContext` ve `OksisDbContext`'e DbSet'leri ekle**

`src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` — mevcut `DbSet` bloğuna ekle:

```csharp
    DbSet<Announcement> Announcements { get; }
    DbSet<AnnouncementTarget> AnnouncementTargets { get; }
    DbSet<AnnouncementRecipient> AnnouncementRecipients { get; }
    DbSet<AnnouncementAuditEntry> AnnouncementAuditEntries { get; }
    DbSet<AnnouncementTemplate> AnnouncementTemplates { get; }
```

`src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` — aynı beşini `public DbSet<...> X => Set<...>();` kalıbıyla ekle (dosyadaki mevcut kalıbı birebir izle).

- [ ] **Step 8: Migration üret**

Run:
```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet ef migrations add 20260802_announcements_core_tables \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```

Expected: 5 tablo `CREATE TABLE` ile üretilir, hiçbirinde `is_deleted` kolonu **yok**.

- [ ] **Step 9: Migration'ı gözden geçir**

Run: `grep -n "is_deleted\|IsDeleted" src/Oksis.Infrastructure/Persistence/Migrations/*20260802_announcements_core_tables.cs`
Expected: **Hiç eşleşme yok.** Eşleşme varsa Task 1'deki temel sınıf yanlış kullanılmıştır — DUR ve düzelt.

- [ ] **Step 10: Testlerin geçtiğini doğrula**

Run:
```bash
docker compose up -d
dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementPersistenceTests"
```
Expected: PASS (3 test)

- [ ] **Step 11: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Infrastructure/ src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs tests/Oksis.Infrastructure.IntegrationTests/
git commit -m "feat(announcements): 5 tablo icin EF esleme ve migration eklendi

Tablolar [school] semasindadir: duyuru bir okul kaydidir, bildirim
degildir. Announcement PermanentTenantEntity'den turedigi icin
is_deleted kolonu uretilmez (INV-1) ama tenant filtresi uygulanmaya
devam eder. (announcement_id, person_id) unique kisiti cok cocuklu
velinin ayni duyuruyu iki kez almasini DB seviyesinde engeller."
```

---

### Task 7: İzin anahtarları + rol matrisi + doküman

**Files:**
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/MasterSeedIds.cs:80-81`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/PermissionSeedData.cs:57-58`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/RolePermissionSeedData.cs`
- Modify: `/Users/farukkaya/Repositories/oksis/.claude/docs/permission-matrix.md:196-199`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/AnnouncementPermissionSeedTests.cs`

**Interfaces:**
- Produces: 8 izin kodu — `announcements.view`, `.create`, `.update`, `.withdraw`, `.approve`, `.moderate`, `.template.manage`, `.report.view`. Task 11–16 bunları `[RequirePermission("...")]` ile tüketir.

> **Kaldırılanlar:** `announcements.read` ve `announcements.manage`. `RolePermissionSeedData`'da
> duyuru satırı **yoktur** — yani bu ikisi bugün hiçbir role atanmamıştır ve kaldırma kimseyi
> kırmaz. **Step 2'de bunu doğrula.**

- [ ] **Step 1: Failing test yaz**

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

public sealed class AnnouncementPermissionSeedTests
{
    private static readonly string[] Expected =
    [
        "announcements.view",
        "announcements.create",
        "announcements.update",
        "announcements.withdraw",
        "announcements.approve",
        "announcements.moderate",
        "announcements.template.manage",
        "announcements.report.view",
    ];

    [Fact]
    public async Task Should_SeedEightGranularKeys_When_MasterDataApplied()
    {
        await using var fixture = await TestDbFixture.CreateAsync();

        var codes = await fixture.Db.Permissions
            .Where(p => p.Code.StartsWith("announcements."))
            .Select(p => p.Code)
            .ToListAsync();

        codes.Should().BeEquivalentTo(Expected);
    }

    [Fact]
    public async Task Should_NotSeedDeleteKey_When_MasterDataApplied()
    {
        // INV-1: duyuru silinmez, dolayısıyla silme izni de yoktur.
        await using var fixture = await TestDbFixture.CreateAsync();

        var exists = await fixture.Db.Permissions.AnyAsync(p => p.Code == "announcements.delete");

        exists.Should().BeFalse();
    }

    [Fact]
    public async Task Should_NotGrantModerateToSecretary_When_RolePermissionsSeeded()
    {
        // §4.2: moderasyon yalnız SchoolAdmin'dedir — sekreter okul geneli ayarı değiştiremez.
        await using var fixture = await TestDbFixture.CreateAsync();

        var granted = await (
            from rp in fixture.Db.RolePermissions
            join p in fixture.Db.Permissions on rp.PermissionId equals p.Id
            join r in fixture.Db.SystemRoles on rp.RoleId equals r.Id
            where p.Code == "announcements.moderate"
            select r.Code).ToListAsync();

        granted.Should().NotContain("Secretary");
        granted.Should().Contain("SchoolAdmin");
    }
}
```

> `Db.Permissions`, `Db.SystemRoles` ve `SystemRole.Code` adlarını **Step 2'de doğrula**;
> farklıysa teste uyarla.

- [ ] **Step 2: Mevcut durumu doğrula**

Run:
```bash
cd /Users/farukkaya/Repositories/oksis-api
grep -n "Announcements" src/Oksis.Infrastructure/Persistence/Seed/MasterData/RolePermissionSeedData.cs
grep -n "DbSet<Permission>\|DbSet<SystemRole>" src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs
grep -n "public .* Code" src/Oksis.Domain/Modules/Identity/Entities/SystemRole.cs
```

Expected: `RolePermissionSeedData`'da duyuru satırı **yok** (boş çıktı). Varsa **DUR** — kaldırma güvenli değildir, bulguyu bildir.

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementPermissionSeedTests"`
Expected: FAIL — `read`/`manage` dönüyor, 8 anahtar yok.

- [ ] **Step 4: `MasterSeedIds`'i güncelle**

`MasterSeedIds.cs:80-81` — iki satırı sil, yerine:

```csharp
        // ANNOUNCEMENTS — read/manage 2026-08-02'de emekliye ayrildi (bkz. duyuru teknik
        // analizi §4.1). Duyurunun yasam dongusu iki anahtarla ifade edilemez: geri cekme
        // duzeltmeden, moderasyon yayinlamadan, rapor gorme okumadan AYRI yetkilerdir.
        public static Guid AnnouncementsView { get; } = SeedGuid.From("perm:announcements.view");
        public static Guid AnnouncementsCreate { get; } = SeedGuid.From("perm:announcements.create");
        public static Guid AnnouncementsUpdate { get; } = SeedGuid.From("perm:announcements.update");
        public static Guid AnnouncementsWithdraw { get; } = SeedGuid.From("perm:announcements.withdraw");
        public static Guid AnnouncementsApprove { get; } = SeedGuid.From("perm:announcements.approve");
        public static Guid AnnouncementsModerate { get; } = SeedGuid.From("perm:announcements.moderate");
        public static Guid AnnouncementsTemplateManage { get; } = SeedGuid.From("perm:announcements.template.manage");
        public static Guid AnnouncementsReportView { get; } = SeedGuid.From("perm:announcements.report.view");
```

- [ ] **Step 5: `PermissionSeedData`'yı güncelle**

`PermissionSeedData.cs:57-58` — iki satırı sil, yerine:

```csharp
        Row(MasterSeedIds.Permissions.AnnouncementsView,           "ANNOUNCEMENTS", "VIEW",            "announcements.view",            "Duyuru listesini ve detayını görüntüle"),
        Row(MasterSeedIds.Permissions.AnnouncementsCreate,         "ANNOUNCEMENTS", "CREATE",          "announcements.create",          "Duyuru oluştur ve yayınla"),
        Row(MasterSeedIds.Permissions.AnnouncementsUpdate,         "ANNOUNCEMENTS", "UPDATE",          "announcements.update",          "Yayın sonrası düzeltme yap"),
        Row(MasterSeedIds.Permissions.AnnouncementsWithdraw,       "ANNOUNCEMENTS", "WITHDRAW",        "announcements.withdraw",        "Yayındaki duyuruyu geri çek"),
        Row(MasterSeedIds.Permissions.AnnouncementsApprove,        "ANNOUNCEMENTS", "APPROVE",         "announcements.approve",         "Onay kuyruğundaki duyuruyu onayla / reddet"),
        Row(MasterSeedIds.Permissions.AnnouncementsModerate,       "ANNOUNCEMENTS", "MODERATE",        "announcements.moderate",        "Okul geneli moderasyon modunu değiştir"),
        Row(MasterSeedIds.Permissions.AnnouncementsTemplateManage, "ANNOUNCEMENTS", "TEMPLATE_MANAGE", "announcements.template.manage", "Duyuru şablonu oluştur / düzenle"),
        Row(MasterSeedIds.Permissions.AnnouncementsReportView,     "ANNOUNCEMENTS", "REPORT_VIEW",     "announcements.report.view",     "Gönderim raporu ve denetim izini görüntüle"),
```

- [ ] **Step 6: `RolePermissionSeedData`'ya rol matrisini yaz**

Dosyadaki mevcut satır kalıbını izleyerek ekle. Matris (teknik analiz §4.2):

| İzin | SchoolAdmin | SchoolStaff | Teacher | Secretary |
|---|---|---|---|---|
| `view` | ✓ | ✓ | ✓ | ✓ |
| `create` | ✓ | ✓ | ✓ | ✓ |
| `update` | ✓ | ✓ | ✓ | ✓ |
| `withdraw` | ✓ | ✓ | ✓ | — |
| `approve` | ✓ | ✓ | — | — |
| `moderate` | ✓ | — | — | — |
| `template.manage` | ✓ | ✓ | — | — |
| `report.view` | ✓ | ✓ | ✓ | ✓ |

`SuperAdmin`, `Parent` ve `Student` hiçbir duyuru izni **almaz**. Veli/öğrenci gelen kutusu
`announcements.view` gerektirmez — Task 15/16 uçları `[RequirePermission]` taşımaz, güvenlik
sınırı self-only alıcı eşleşmesidir.

- [ ] **Step 7: Migration üret**

Run:
```bash
dotnet ef migrations add 20260802_announcements_permission_keys \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```

- [ ] **Step 8: Testlerin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~AnnouncementPermissionSeedTests"`
Expected: PASS (3 test)

- [ ] **Step 9: `permission-matrix.md`'yi düzelt**

`/Users/farukkaya/Repositories/oksis/.claude/docs/permission-matrix.md` — `### Announcements`
bölümündeki 4 satırlık tabloyu (196-199) 8 satırla değiştir; `announcements.delete` satırını
**kaldır** ve altına not düş:

```markdown
> `announcements.delete` 2026-08-02'de kaldırıldı: duyuru kurumsal kayıttır ve silinmez
> (INV-1). Yerine `announcements.withdraw` gelir — geri çekilen duyuru arşivde "geri çekildi"
> olarak kalır. Ayrıca `announcements.read` / `announcements.manage` seed anahtarları bu
> tarihte emekliye ayrıldı; kanonik küme yukarıdaki 8 anahtardır.
```

- [ ] **Step 10: Commit (iki depo, iki commit)**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Infrastructure/ tests/Oksis.Infrastructure.IntegrationTests/
git commit -m "feat(announcements): 8 granuler izin anahtari seed edildi

read/manage emekliye ayrildi, delete hic dogmadi (INV-1). Risksiz:
RolePermissionSeedData'da duyuru satiri yoktu, yani bu iki anahtar
hicbir role atanmamisti."

cd /Users/farukkaya/Repositories/oksis
git add .claude/docs/permission-matrix.md
git commit -m "docs(announcements): izin matrisi 8 granuler anahtara guncellendi"
```

---

### Task 8: DTO'lar (kontrata birebir)

**Files:**
- Create: `src/Oksis.Application/Modules/Announcements/DTOs/AnnouncementDto.cs`
- Create: `src/Oksis.Application/Modules/Announcements/DTOs/AudienceDtos.cs`
- Create: `src/Oksis.Application/Modules/Announcements/Common/AnnouncementEnumWire.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Announcements/AnnouncementEnumWireTests.cs`

**Interfaces:**
- Produces:
  - `AnnouncementDto` — 22 alan, `packages/api/src/announcements/contract.ts` ile birebir
  - `AnnouncementAttachmentDto`, `AudienceOptionDto`, `AudienceRoleSplitDto`, `AudiencePoolDto`, `AudienceSelectionBody`
  - `AnnouncementEnumWire.ToWire(AnnouncementStatus) → string` ve kardeşleri; `AnnouncementEnumWire.ParseDimension(string) → AudienceDimension`, `ParseBucket(string) → AudienceBucket`
  - Task 11–16 bu tipleri döner.

> **Referans:** `/Users/farukkaya/Repositories/oksis-ui/packages/api/src/announcements/contract.ts`.
> **Alan adı veya null'lanabilirlik uydurma** — o dosyadan kopyala.

- [ ] **Step 1: Kontratı oku ve alanları çıkar**

Run:
```bash
sed -n '30,100p' /Users/farukkaya/Repositories/oksis-ui/packages/api/src/announcements/contract.ts
```

Expected: `AnnouncementDto`'nun 22 alanı ve null'lanabilirlikleri görünür. DTO'yu buna göre yaz.

- [ ] **Step 2: Failing test yaz**

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Announcements.Common;
using Oksis.Domain.Modules.Announcements.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Announcements;

public sealed class AnnouncementEnumWireTests
{
    [Theory]
    [InlineData(AnnouncementStatus.Draft, "draft")]
    [InlineData(AnnouncementStatus.Scheduled, "scheduled")]
    [InlineData(AnnouncementStatus.PendingApproval, "pendingApproval")]
    [InlineData(AnnouncementStatus.Published, "published")]
    [InlineData(AnnouncementStatus.Expired, "expired")]
    [InlineData(AnnouncementStatus.Withdrawn, "withdrawn")]
    [InlineData(AnnouncementStatus.Archived, "archived")]
    public void Should_EmitCamelCaseKey_When_StatusConvertedToWire(AnnouncementStatus status, string expected)
    {
        AnnouncementEnumWire.ToWire(status).Should().Be(expected);
    }

    [Theory]
    [InlineData("all", AudienceDimension.All)]
    [InlineData("schoolStage", AudienceDimension.SchoolStage)]
    [InlineData("gradeLevel", AudienceDimension.GradeLevel)]
    [InlineData("section", AudienceDimension.Section)]
    [InlineData("course", AudienceDimension.Course)]
    public void Should_ParseWireKey_When_DimensionReceived(string wire, AudienceDimension expected)
    {
        AnnouncementEnumWire.ParseDimension(wire).Should().Be(expected);
    }

    [Fact]
    public void Should_Throw_When_DimensionKeyUnknown()
    {
        var act = () => AnnouncementEnumWire.ParseDimension("branch");
        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData("parent", AudienceBucket.Parent)]
    [InlineData("teacher", AudienceBucket.Teacher)]
    [InlineData("student", AudienceBucket.Student)]
    public void Should_ParseWireKey_When_BucketReceived(string wire, AudienceBucket expected)
    {
        AnnouncementEnumWire.ParseBucket(wire).Should().Be(expected);
    }
}
```

- [ ] **Step 3: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementEnumWireTests"`
Expected: FAIL — `AnnouncementEnumWire` yok.

- [ ] **Step 4: `AnnouncementEnumWire` yaz**

```csharp
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Application.Modules.Announcements.Common;

/// <summary>
/// Enum ↔ tel (wire) anahtar çevirisi. Frontend sözleşmesi enum'ları STRING anahtar olarak
/// taşır (<c>"pendingApproval"</c>), DB ise <c>int</c> saklar. Çeviri TEK YERDE durur —
/// çağrı yerinde tahmin edilmez.
/// </summary>
public static class AnnouncementEnumWire
{
    public static string ToWire(AnnouncementStatus value) => value switch
    {
        AnnouncementStatus.Draft => "draft",
        AnnouncementStatus.Scheduled => "scheduled",
        AnnouncementStatus.PendingApproval => "pendingApproval",
        AnnouncementStatus.Published => "published",
        AnnouncementStatus.Expired => "expired",
        AnnouncementStatus.Withdrawn => "withdrawn",
        AnnouncementStatus.Archived => "archived",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWire(AnnouncementType value) => value switch
    {
        AnnouncementType.Institutional => "institutional",
        AnnouncementType.Classroom => "classroom",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWire(AnnouncementReach value) => value switch
    {
        AnnouncementReach.SchoolWide => "schoolWide",
        AnnouncementReach.ClassScoped => "classScoped",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWire(DeliveryChannel value) => value switch
    {
        DeliveryChannel.InApp => "inApp",
        DeliveryChannel.Push => "push",
        DeliveryChannel.Email => "email",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWire(AnnouncementModeration value) => value switch
    {
        AnnouncementModeration.Open => "open",
        AnnouncementModeration.Thresholded => "thresholded",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWire(AudienceDimension value) => value switch
    {
        AudienceDimension.All => "all",
        AudienceDimension.Role => "role",
        AudienceDimension.SchoolStage => "schoolStage",
        AudienceDimension.GradeLevel => "gradeLevel",
        AudienceDimension.Section => "section",
        AudienceDimension.Person => "person",
        AudienceDimension.Course => "course",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static string ToWire(AudienceBucket value) => value switch
    {
        AudienceBucket.Parent => "parent",
        AudienceBucket.Teacher => "teacher",
        AudienceBucket.Student => "student",
        _ => throw new ArgumentOutOfRangeException(nameof(value), value, null),
    };

    public static AudienceDimension ParseDimension(string wire) => wire switch
    {
        "all" => AudienceDimension.All,
        "role" => AudienceDimension.Role,
        "schoolStage" => AudienceDimension.SchoolStage,
        "gradeLevel" => AudienceDimension.GradeLevel,
        "section" => AudienceDimension.Section,
        "person" => AudienceDimension.Person,
        "course" => AudienceDimension.Course,
        _ => throw new ArgumentOutOfRangeException(nameof(wire), wire, "Bilinmeyen hedef katmanı."),
    };

    public static AudienceBucket ParseBucket(string wire) => wire switch
    {
        "parent" => AudienceBucket.Parent,
        "teacher" => AudienceBucket.Teacher,
        "student" => AudienceBucket.Student,
        _ => throw new ArgumentOutOfRangeException(nameof(wire), wire, "Bilinmeyen alıcı kovası."),
    };

    public static DeliveryChannel ParseChannel(string wire) => wire switch
    {
        "inApp" => DeliveryChannel.InApp,
        "push" => DeliveryChannel.Push,
        "email" => DeliveryChannel.Email,
        _ => throw new ArgumentOutOfRangeException(nameof(wire), wire, "Bilinmeyen gönderim kanalı."),
    };
}
```

- [ ] **Step 5: DTO'ları yaz**

`AnnouncementDto.cs` — Step 1'de okuduğun kontrata **birebir**:

```csharp
namespace Oksis.Application.Modules.Announcements.DTOs;

/// <summary>
/// Duyuru satırı — <c>packages/api/src/announcements/contract.ts</c> içindeki
/// <c>AnnouncementDto</c> ile BİREBİR. Alan adı veya null'lanabilirlik değiştirilirse
/// codegen sonrası frontend typecheck'i kırılır; bu bilinçli bir drift bekçisidir.
/// Enum alanları tel'de STRING anahtardır.
/// </summary>
public sealed record AnnouncementDto
{
    public required string Id { get; init; }
    public required string Status { get; init; }
    public required string Type { get; init; }
    public required string Reach { get; init; }

    /// <summary>Yalnız gelen kutusu uçlarında dolu; yönetim listelerinde null.</summary>
    public bool? IsRead { get; init; }

    /// <summary>Veli gelen kutusunda dolu; öğrenci ve yönetim listelerinde boş dizi.</summary>
    public required IReadOnlyList<string> ChildIds { get; init; }

    public required string Title { get; init; }
    public required string Body { get; init; }
    public required bool Urgent { get; init; }
    public required bool Pinned { get; init; }
    public required bool Amended { get; init; }
    public required string AudienceLabel { get; init; }
    public string? AudienceDetail { get; init; }
    public int? RecipientCount { get; init; }
    public int? SeenCount { get; init; }
    public required string PublisherLabel { get; init; }
    public string? PublisherRealName { get; init; }
    public string? PublisherSignature { get; init; }
    public required string PublisherId { get; init; }
    public string? PublishedAt { get; init; }
    public string? UpdatedAt { get; init; }
    public string? ValidUntil { get; init; }
    public required IReadOnlyList<string> Channels { get; init; }
    public AnnouncementAttachmentDto? Attachment { get; init; }
    public string? WithdrawReason { get; init; }
}

public sealed record AnnouncementAttachmentDto
{
    public required string Name { get; init; }
    public required long Size { get; init; }
    public required string MimeType { get; init; }
    public required string Url { get; init; }
}
```

`AudienceDtos.cs`:

```csharp
namespace Oksis.Application.Modules.Announcements.DTOs;

/// <summary>Hedef seçicide tek bir seçenek. Kontrat: <c>AudienceOptionDto</c>.</summary>
public sealed record AudienceOptionDto
{
    public required string Key { get; init; }
    public required string Label { get; init; }
    public required int RecipientCount { get; init; }

    /// <summary>
    /// İkinci satır. KADEME KURALININ görünür olduğu yer: ilkokul/anaokulu öğrencisi
    /// kapsam dışı kaldığında burası bunu AÇIKÇA söyler (DYR-F-15 — sessiz filtreleme
    /// kabul edilemez).
    /// </summary>
    public string? Sublabel { get; init; }

    public required string Bucket { get; init; }

    /// <summary>Toplu seçeneklerin rol dağılımı; tekil seçeneklerde null.</summary>
    public AudienceRoleSplitDto? Breakdown { get; init; }
}

public sealed record AudienceRoleSplitDto
{
    public required int Parents { get; init; }
    public required int Teachers { get; init; }
    public required int Students { get; init; }
}

/// <summary>Hedef havuzu — katman → seçenekler. Rol bazlı daralır.</summary>
public sealed record AudiencePoolDto
{
    /// <summary>"Tüm okul" tek seçenektir, listede değil. Öğretmende null.</summary>
    public AudienceOptionDto? All { get; init; }

    public IReadOnlyList<AudienceOptionDto>? Role { get; init; }
    public IReadOnlyList<AudienceOptionDto>? SchoolStage { get; init; }
    public IReadOnlyList<AudienceOptionDto>? GradeLevel { get; init; }
    public IReadOnlyList<AudienceOptionDto>? Section { get; init; }
    public IReadOnlyList<AudienceOptionDto>? Person { get; init; }
    public IReadOnlyList<AudienceOptionDto>? Course { get; init; }
}

/// <summary>
/// Yayın gövdesindeki tek bir hedef seçimi.
///
/// <para><b><see cref="Bucket"/> ZORUNLUDUR</b> ve kontrata 2026-08-02'de eklenmiştir:
/// aynı <c>(Dimension, Key)</c> çifti yöneticide şubedeki ÖĞRENCİLERE, öğretmende aynı
/// şubenin VELİLERİNE çözümlenir. Hedef yayın anında donduğu için (INV-2) kaydın kendisi
/// kime gittiğini anlatmalıdır.</para>
/// </summary>
public sealed record AudienceSelectionBody
{
    public required string Dimension { get; init; }
    public required string Key { get; init; }
    public required string Bucket { get; init; }
}
```

- [ ] **Step 6: Testlerin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~AnnouncementEnumWireTests"`
Expected: PASS (16 test)

- [ ] **Step 7: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Application/Modules/Announcements/ tests/Oksis.Application.UnitTests/Modules/Announcements/
git commit -m "feat(announcements): wire DTO'lari ve enum ceviri katmani eklendi

DTO'lar packages/api contract.ts ile birebirdir; sapma codegen sonrasi
frontend typecheck'ini kirar. AudienceSelectionBody'ye bucket eklendi:
ayni (dimension, key) cifti role gore farkli aliciya cozumlenir ve
hedef yayin aninda donar (INV-2)."
```

---

### Task 9: Kademe kuralı (saf, testli)

Modülün en sessiz bozulma noktası: müdür 400 öğrenciye gönderdiğini sanarken 260'a gitmesi.
Kural saf bir fonksiyondur ve **kendi testini alır**; alıcı çözümlemenin içine gömülmez.

**Files:**
- Create: `src/Oksis.Domain/Modules/Announcements/Rules/AnnouncementAudienceRules.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementAudienceRulesTests.cs`

**Interfaces:**
- Consumes: `EducationLevel` (`Oksis.Domain.Modules.Academics.Enums`), Task 2 `AudienceBucket`
- Produces:
  - `AnnouncementAudienceRules.ReceivesAnnouncements(EducationLevel level, AudienceBucket bucket) → bool`
  - `AnnouncementAudienceRules.ExcludedStudentNotice(IReadOnlyCollection<EducationLevel> excluded) → string?`
  - Task 10 `AudienceResolver` ikisini de çağırır.

- [ ] **Step 1: Failing test yaz**

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Academics.Enums;
using Oksis.Domain.Modules.Announcements.Enums;
using Oksis.Domain.Modules.Announcements.Rules;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Announcements;

public sealed class AnnouncementAudienceRulesTests
{
    [Theory]
    [InlineData(EducationLevel.Preschool)]
    [InlineData(EducationLevel.Primary)]
    public void Should_ExcludeStudents_When_LevelIsPreschoolOrPrimary(EducationLevel level)
    {
        // KR-03 / DYR-K-05: bu yaş grubunda okul-ev iletişiminin muhatabı velidir.
        AnnouncementAudienceRules.ReceivesAnnouncements(level, AudienceBucket.Student)
            .Should().BeFalse();
    }

    [Theory]
    [InlineData(EducationLevel.Middle)]
    [InlineData(EducationLevel.High)]
    public void Should_IncludeStudents_When_LevelIsMiddleOrHigh(EducationLevel level)
    {
        AnnouncementAudienceRules.ReceivesAnnouncements(level, AudienceBucket.Student)
            .Should().BeTrue();
    }

    [Theory]
    [InlineData(EducationLevel.Preschool)]
    [InlineData(EducationLevel.Primary)]
    [InlineData(EducationLevel.Middle)]
    [InlineData(EducationLevel.High)]
    public void Should_AlwaysIncludeParents_When_AnyLevel(EducationLevel level)
    {
        AnnouncementAudienceRules.ReceivesAnnouncements(level, AudienceBucket.Parent)
            .Should().BeTrue();
    }

    [Fact]
    public void Should_ReturnNull_When_NoLevelExcluded()
    {
        AnnouncementAudienceRules.ExcludedStudentNotice([]).Should().BeNull();
    }

    [Fact]
    public void Should_NameExcludedLevelsInTurkish_When_PrimaryExcluded()
    {
        // DYR-F-15: kapsam dışı kalan EKRANDA AÇIKÇA gösterilir.
        AnnouncementAudienceRules.ExcludedStudentNotice([EducationLevel.Primary])
            .Should().Be("İlkokul öğrencileri kapsam dışı — yalnız veliler");
    }

    [Fact]
    public void Should_JoinExcludedLevels_When_PreschoolAndPrimaryExcluded()
    {
        AnnouncementAudienceRules.ExcludedStudentNotice([EducationLevel.Preschool, EducationLevel.Primary])
            .Should().Be("Anaokulu ve ilkokul öğrencileri kapsam dışı — yalnız veliler");
    }
}
```

- [ ] **Step 2: Testin kırıldığını doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementAudienceRulesTests"`
Expected: FAIL — `AnnouncementAudienceRules` yok.

- [ ] **Step 3: Kuralı yaz**

```csharp
using Oksis.Domain.Modules.Academics.Enums;
using Oksis.Domain.Modules.Announcements.Enums;

namespace Oksis.Domain.Modules.Announcements.Rules;

/// <summary>
/// Kademe farkındalıklı hedefleme kuralı (KR-03 / DYR-K-05 / DYR-F-15).
///
/// <para>Saf fonksiyonlardır — DB'ye, saate veya oturuma bağlı değildir; bu yüzden
/// alıcı çözümlemenin içine gömülmez, kendi testini alır.</para>
/// </summary>
public static class AnnouncementAudienceRules
{
    /// <summary>
    /// Bu kademedeki bu kova duyuru alır mı?
    ///
    /// <para><b>Anaokulu açık varsayımı:</b> ihtiyaç analizinin tablosunda yalnız
    /// İlkokul/Ortaokul/Lise vardır. Kural anaokuluna evleviyetle genişletilmiştir —
    /// ilkokul öğrencisi bağımsız iletişim muhatabı sayılmıyorsa anaokulu öğrencisi
    /// hiç sayılmaz. Sessiz bir genişletme değil, kayda geçmiş bir karardır
    /// (spec 2026-08-02 §5.3).</para>
    /// </summary>
    public static bool ReceivesAnnouncements(EducationLevel level, AudienceBucket bucket) =>
        bucket is not AudienceBucket.Student
        || level is not (EducationLevel.Preschool or EducationLevel.Primary);

    /// <summary>
    /// Kapsam dışı kalan kademeleri anlatan Türkçe uyarı; hiçbiri dışlanmıyorsa null.
    /// Hedef seçicide <c>AudienceOptionDto.Sublabel</c> olarak gösterilir — müdür
    /// 400 kişiye gönderdiğini sanıp 260 kişiye göndermesin diye.
    /// </summary>
    public static string? ExcludedStudentNotice(IReadOnlyCollection<EducationLevel> excludedLevels)
    {
        if (excludedLevels.Count == 0)
        {
            return null;
        }

        var ordered = excludedLevels.Distinct().OrderBy(l => (int)l).Select(NameOf).ToList();

        var joined = ordered.Count == 1
            ? Capitalize(ordered[0])
            : Capitalize(string.Join(" ve ", ordered));

        return $"{joined} öğrencileri kapsam dışı — yalnız veliler";
    }

    private static string NameOf(EducationLevel level) => level switch
    {
        EducationLevel.Preschool => "anaokulu",
        EducationLevel.Primary => "ilkokul",
        EducationLevel.Middle => "ortaokul",
        EducationLevel.High => "lise",
        _ => throw new ArgumentOutOfRangeException(nameof(level), level, null),
    };

    private static string Capitalize(string value) =>
        string.Concat(char.ToUpper(value[0], new System.Globalization.CultureInfo("tr-TR")), value[1..]);
}
```

- [ ] **Step 4: Testlerin geçtiğini doğrula**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "FullyQualifiedName~AnnouncementAudienceRulesTests"`
Expected: PASS (12 test)

- [ ] **Step 5: Tüm testleri çalıştır**

Run: `dotnet build && dotnet test`
Expected: PASS — Task 1–9 sonrası regresyon yok.

- [ ] **Step 6: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-api
dotnet format
git add src/Oksis.Domain/Modules/Announcements/Rules/ tests/Oksis.Domain.UnitTests/Modules/Announcements/AnnouncementAudienceRulesTests.cs
git commit -m "feat(announcements): kademe farkindalikli hedefleme kurali eklendi

Ilkokul VE anaokulu kademesinde ogrenci alici olmaz, yalniz veli
(KR-03). Anaokulu ihtiyac analizinin tablosunda yok; kural evleviyetle
genisletildi ve spec §5.3'te acik varsayim olarak kayitli. Kapsam disi
kalan sublabel ile ACIKCA gosterilir — sessiz filtreleme kabul edilemez."
```

---

> **Görev 10–12 üçüncü dosyadadır:** `2026-08-02-duyurular-a1-omurga-3.md` —
> `IAudienceResolver` ve implementasyonu, `GET /audience` + controller iskeleti,
> `POST /announcements` + alıcı materyalizasyonu.
