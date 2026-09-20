# Sicil no doğuşu + çoklu sınıf öğretmenliği — uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Davetle doğan öğretmen otomatik sicil no alsın; bir öğretmen birden çok şubenin sınıf öğretmeni olabilsin; bunun için ortak bir `MultiSelect` bileşeni açılsın.

**Architecture:** Backend'e yalnız sicil no üreteci eklenir (çoklu homeroom kuralı sunucuda zaten serbest). Üreteç `sp_getapplock` ile okul başına serileşir, sayaç tablosu ve migration YOKtur. İstemcide `Teacher` tipinin tekil homeroom alanları çoğula çevrilir; tek yazma yüzeyi "Mesleki Bilgiler" modalı olur ve kaydetme küme farkıyla çalışır.

**Tech Stack:** .NET 10 / EF Core 10 / xUnit + FluentAssertions + NSubstitute + MockQueryable (api) · Next.js 16 / TypeScript strict / TanStack Query / Vitest / MSW (ui)

**Spec:** `~/Repositories/oksis/docs/gecici/planlar/2026-09-21-sicil-no-ve-coklu-sinif-ogretmenligi.md`

## Global Constraints

- **Depolar ve dallar:** backend `~/Repositories/worktrees/oksis-api-polish` (dal `fix/polish`), frontend `~/Repositories/worktrees/oksis-ui-polish` (dal `fix/polish`). `~/Repositories/oksis-api` ana checkout'una **DOKUNULMAZ** — orada başka bir oturum `feat/meb-kaynakli-katalog` dalında çalışıyor.
- **Derleme:** `dotnet build`/`dotnet test` daima `-m:1` ile. Çok düğümlü derleme bu makinede `MSB4166` ile worker düşürüp **bozuk assembly** bırakıyor (2026-09-20'de `Oksis.Application.dll` bu yüzden yüklenemez hâle geldi).
- **Veritabanı:** `docker start oksis-mssql` gerekli (konteyner OOM ile düşebiliyor). Integration testleri SQL Server ister.
- **Doğrulama kullanıcı kararıyla EN SONDA toplu** (Task 6). Ara adımlarda tarayıcı doğrulaması YAPILMAZ; `dotnet test`/`vitest` adımları normal TDD döngüsünün parçasıdır ve çalıştırılır.
- **Dil:** tanım noktası yorumları Türkçe, identifier'lar tam İngilizce, UI metinleri Türkçe.
- **Commit formatı:** `<type>(<scope>): <açıklama>` — scope `web`/`core`/`api`/`ui`/`repo`; açıklama Türkçe, emir kipi, küçük harf, nokta yok. Her commit sonu:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_017bGMTJy5QnwzXNRPiLzdYu
  ```
- **`generated/schema.ts` elle düzenlenmez.** Bu plandaki hiçbir görev wire şekli değiştirmiyor; codegen gerekmiyor.
- **Sicil no biçimi:** `{aktifSezonBaşlangıçYılı}{sıra:D3}` → `2026001`. `D3` tavan değil minimum genişlik.
- **Sicil no üst sınırı:** 50 karakter (`TeacherProfile.MaxEmployeeNumberLength`, EF `HasMaxLength(50)`).

## Dosya Yapısı

**Backend (`oksis-api-polish`):**

| Dosya | Sorumluluk |
|---|---|
| `src/Oksis.Application/Common/Abstractions/IEmployeeNumberGenerator.cs` | **Yeni.** Üreteç sözleşmesi (Application birim testleri bunu taklit eder) |
| `src/Oksis.Infrastructure/Persistence/Identity/EmployeeNumberGenerator.cs` | **Yeni.** Kilit + yıl + sıra; tek sorumluluk: bir sonraki numarayı üretmek |
| `src/Oksis.Infrastructure/DependencyInjection.cs` | Kayıt satırı (`StudentNumberGenerator`ın yanına) |
| `src/Oksis.Application/Modules/Users/Services/PersonUserCreationService.cs` | Öğretmen profili artık sicil no ile doğar; transaction burada açılır |
| `tests/Oksis.Infrastructure.IntegrationTests/Users/EmployeeNumberGeneratorTests.cs` | **Yeni.** Üretecin gerçek DB davranışı |
| `tests/Oksis.Infrastructure.IntegrationTests/Users/PersonUserCreationEmployeeNumberTests.cs` | **Yeni.** Davetle doğan öğretmenin numarasının dolu olması + sıranın ilerlemesi (regresyon kilidi) |

**Frontend (`oksis-ui-polish`):**

| Dosya | Sorumluluk |
|---|---|
| `apps/web/components/shared/multi-select.tsx` | **Yeni.** `FilterDropdown`'ın çok değerli yüzü |
| `packages/ui/src/styles/screens.css` | `.usr-msel-*` sınıfları (`.usr-fdd` kabuğu yeniden tanımlanmaz) |
| `packages/core/src/teachers/types.ts` | `TeacherHomeroom` + `homerooms`; `TeacherAction`'dan `homeroom` çıkar |
| `packages/core/src/teachers/logic.ts` | `availableTeacherActions` — `homeroom` push'u kalkar |
| `packages/api/src/teachers/endpoints.ts` | `fetchHomeroomMap` çoğul; `toTeacher` `homerooms` yazar |
| `apps/web/features/teachers/modals.tsx` | `TchHomeroomModal` silinir; `TchProfileModal` `MultiSelect` + küme farkı |
| `apps/web/features/teachers/table.tsx` | İlk iki rozet + "+N" |
| `apps/web/features/teachers/drawer.tsx` | `Fact` + `TabSinif` çoğul |
| `apps/web/features/teachers/teacher-labels.ts` | `homeroom` etiketi ve menü grubundan çıkar |
| `apps/web/features/teachers/teachers-page.tsx` | `homeroom` modal durumu ve iki handler'ı kalkar |

---

### Task 1: Sicil no üreteci

**Files:**
- Create: `src/Oksis.Application/Common/Abstractions/IEmployeeNumberGenerator.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Identity/EmployeeNumberGenerator.cs`
- Modify: `src/Oksis.Infrastructure/DependencyInjection.cs:87`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Users/EmployeeNumberGeneratorTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext` (`Database`, `AcademicSessions`, `Profiles`), `TeacherProfile.EmployeeNumber`
- Produces: `IEmployeeNumberGenerator.NextAsync(Guid schoolId, CancellationToken) → Task<string>`. Çağıran **açık bir transaction içinde** olmak zorundadır; değilse `InvalidOperationException`.

- [ ] **Step 1: Arayüzü yaz**

`src/Oksis.Application/Common/Abstractions/IEmployeeNumberGenerator.cs`:

```csharp
namespace Oksis.Application.Common.Abstractions;

/// <summary>
/// Öğretmen sicil (personel) numarası üreteci. Emsali <see cref="IStudentNumberGenerator"/>.
///
/// <para><b>Çağrı sözleşmesi:</b> açık bir transaction İÇİNDE çağrılmalıdır. Üreteç okul
/// başına <c>sp_getapplock</c> alır ve kilit transaction sahiplidir; kilit, numarayı
/// kullanan INSERT commit olana kadar tutulmak zorundadır. Kilit erkenden bırakılırsa iki
/// eşzamanlı davet aynı numarayı okur ve tekil indekse çarpar.</para>
/// </summary>
public interface IEmployeeNumberGenerator
{
    Task<string> NextAsync(Guid schoolId, CancellationToken cancellationToken);
}
```

- [ ] **Step 2: Başarısız testi yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Users/EmployeeNumberGeneratorTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Domain.Modules.Users.ValueObjects;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Oksis.Infrastructure.Persistence.Identity;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Users;

/// <summary>
/// Sicil no üreteci — `{sezonYılı}{sıra:D3}`.
///
/// <para>Bulgu: davetle kurulan kadroda sicil no HER öğretmende null doğuyordu; alanı
/// yazan tek gerçek akış arayüzü olmayan Excel içe aktarmaydı. Bu testler numaranın
/// biçimini, sıralılığını ve 999 sonrası davranışını kilitler.</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class EmployeeNumberGeneratorTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private static AcademicSession SeedSession(Guid schoolId, int year) =>
        AcademicSession.Create(
            schoolId,
            $"{year}-{year + 1}",
            new DateOnly(year, 9, 1),
            new DateOnly(year + 1, 6, 30));

    [Fact]
    public async Task Ilk_numara_sezon_yili_ve_001_olur()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        var session = SeedSession(schoolId, 2026);
        session.MarkCurrent();
        db.AcademicSessions.Add(session);
        await db.SaveChangesAsync(default);

        var gen = new EmployeeNumberGenerator(db);
        await using var tx = await db.Database.BeginTransactionAsync(default);
        var first = await gen.NextAsync(schoolId, default);
        await tx.CommitAsync(default);

        first.Should().Be("2026001");
    }

    [Fact]
    public async Task Sira_var_olan_numaralardan_devam_eder()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        var session = SeedSession(schoolId, 2026);
        session.MarkCurrent();
        db.AcademicSessions.Add(session);
        db.Persons.Add(MakeTeacher("2026001"));
        db.Persons.Add(MakeTeacher("2026002"));
        await db.SaveChangesAsync(default);

        var gen = new EmployeeNumberGenerator(db);
        await using var tx = await db.Database.BeginTransactionAsync(default);
        var next = await gen.NextAsync(schoolId, default);
        await tx.CommitAsync(default);

        next.Should().Be("2026003");
    }

    /// <summary>
    /// Sıra SAYISAL karşılaştırılır. Metin `MAX` alınsaydı burada bozulurdu:
    /// metin sıralamasında `'2026999' > '20261000'` doğrudur, yani sayaç geri sayardı.
    /// </summary>
    [Fact]
    public async Task Bin_esiginde_geri_saymaz()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        var session = SeedSession(schoolId, 2026);
        session.MarkCurrent();
        db.AcademicSessions.Add(session);
        db.Persons.Add(MakeTeacher("2026999"));
        await db.SaveChangesAsync(default);

        var gen = new EmployeeNumberGenerator(db);
        await using var tx = await db.Database.BeginTransactionAsync(default);
        var next = await gen.NextAsync(schoolId, default);
        await tx.CommitAsync(default);

        // D3 bir TAVAN değil MİNİMUM genişlik — dolgusuz büyür.
        next.Should().Be("20261000");
    }

    [Fact]
    public async Task Onceki_yilin_numaralari_yeni_sezonun_sirasini_etkilemez()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        var session = SeedSession(schoolId, 2027);
        session.MarkCurrent();
        db.AcademicSessions.Add(session);
        db.Persons.Add(MakeTeacher("2026042"));
        await db.SaveChangesAsync(default);

        var gen = new EmployeeNumberGenerator(db);
        await using var tx = await db.Database.BeginTransactionAsync(default);
        var next = await gen.NextAsync(schoolId, default);
        await tx.CommitAsync(default);

        next.Should().Be("2027001");
    }

    [Fact]
    public async Task Transaction_disinda_cagirmak_hatadir()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);
        var gen = new EmployeeNumberGenerator(db);

        var act = async () => await gen.NextAsync(schoolId, default);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*transaction*");
    }

    private static Person MakeTeacher(string employeeNumber)
    {
        var person = Person.Create(Guid.Empty, PersonName.Create("Test", "Öğretmen"));
        person.AttachProfile(TeacherProfile.Create(employeeNumber));
        return person;
    }
}
```

- [ ] **Step 3: Testin düştüğünü gör**

```bash
cd ~/Repositories/worktrees/oksis-api-polish
docker start oksis-mssql
dotnet build tests/Oksis.Infrastructure.IntegrationTests/Oksis.Infrastructure.IntegrationTests.csproj --nologo -m:1
```
Beklenen: **derleme hatası** — `EmployeeNumberGenerator` tipi yok.

> `Person.Create` ve `AcademicSession.Create` imzaları ile `MarkCurrent`/`SetCurrent` adını
> derleyici doğrular; imza tutmazsa test dosyasındaki çağrıyı gerçek imzaya uydur, üreteci
> değiştirme. `fixture.CreateDbContext(schoolId)` `Person.Create`in `schoolId`'sini tenant
> interceptor üzerinden yazar, bu yüzden `MakeTeacher` `Guid.Empty` geçebilir.

- [ ] **Step 4: Üreteci yaz**

`src/Oksis.Infrastructure/Persistence/Identity/EmployeeNumberGenerator.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Domain.Modules.Users.Entities;

namespace Oksis.Infrastructure.Persistence.Identity;

/// <summary>
/// Öğretmen sicil no üreteci — <c>{aktifSezonBaşlangıçYılı}{sıra:D3}</c> (ör. <c>2026001</c>).
///
/// <para><b>Neden sayaç tablosu YOK:</b> öğrenci numarasının aksine (bkz.
/// <see cref="StudentNumberGenerator"/>) burada kalıcı bir sayaç tutulmuyor; sıra var olan
/// numaralardan türetiliyor. Kullanıcı kararı (2026-09-21): migration'sız çözüm. Yarış
/// durumu sayaç yerine <c>sp_getapplock</c> ile kapatılıyor.</para>
///
/// <para><b>Sıra neden SAYISAL:</b> metin <c>MAX</c>'ı 999'u aştığı anda bozulurdu —
/// metin sıralamasında <c>'2026999' &gt; '20261000'</c> doğrudur, yani 1000. öğretmenden
/// sonra sayaç geri sayar ve tekil indekse çarpardı. Aday numaralar belleğe çekilip
/// sayısal karşılaştırılıyor; bir okulun bir yıldaki öğretmen sayısı bunun için önemsiz.</para>
///
/// <para><b>D3 bir TAVAN değil MİNİMUM genişliktir</b> — sıra 999'u aşarsa numara dolgusuz
/// büyür (<c>20261000</c>). <see cref="StudentNumberGenerator"/>'ın <c>length</c> alanıyla
/// aynı sözleşme.</para>
/// </summary>
public sealed class EmployeeNumberGenerator(IApplicationDbContext db) : IEmployeeNumberGenerator
{
    /// <summary>Sıranın en az kaç haneye sıfırla doldurulacağı.</summary>
    private const int MinSequenceWidth = 3;

    /// <summary>Kilit bekleme süresi (ms). Aşılırsa üretim başarısız olur, sessizce çakışmaz.</summary>
    private const int LockTimeoutMs = 5000;

    public async Task<string> NextAsync(Guid schoolId, CancellationToken cancellationToken)
    {
        // Kilit transaction sahipli alınır; ambient transaction yoksa sp_getapplock'un
        // sahibi olmaz ve kilit çağrı biter bitmez düşer — yani hiç koruma sağlamaz.
        // Sessizce korumasız çalışmaktansa çağıranı derhâl uyar.
        if (db.Database.CurrentTransaction is null)
        {
            throw new InvalidOperationException(
                "EmployeeNumberGenerator açık bir transaction içinde çağrılmalıdır: " +
                "sp_getapplock kilidi transaction sahiplidir ve numarayı kullanan INSERT " +
                "commit olana kadar tutulmalıdır.");
        }

        await AcquireLockAsync(schoolId, cancellationToken);

        var year = await db.AcademicSessions
            .AsNoTracking()
            .Where(s => s.SchoolId == schoolId && s.IsCurrent)
            .Select(s => (int?)s.StartDate.Year)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException(
                "Aktif sezon yok; sicil no üretilemez. Çağıran bu önkoşulu önce denetlemeli.");

        var prefix = year.ToString();

        // Aday numaralar: bu yılın bloğuna ait olanlar. Global tenant filtresi okul
        // ayrımını zaten yapıyor (AttachProfileCommandHandler'daki tekillik kontrolüyle
        // aynı varsayım).
        var existing = await db.Profiles
            .OfType<TeacherProfile>()
            .AsNoTracking()
            .Where(p => p.EmployeeNumber != null && p.EmployeeNumber.StartsWith(prefix))
            .Select(p => p.EmployeeNumber!)
            .ToListAsync(cancellationToken);

        var maxSequence = 0;
        foreach (var number in existing)
        {
            var tail = number[prefix.Length..];
            // Elle girilmiş "2026-A" gibi bir numara sırayı bozmasın: sayısal olmayan
            // kuyruk yok sayılır, yalnız üretilmiş biçime uyanlar sayılır.
            if (int.TryParse(tail, out var value) && value > maxSequence)
            {
                maxSequence = value;
            }
        }

        return $"{prefix}{(maxSequence + 1).ToString().PadLeft(MinSequenceWidth, '0')}";
    }

    private async Task AcquireLockAsync(Guid schoolId, CancellationToken cancellationToken)
    {
        // EF Core SqlQueryRaw<int> scalar convention: output column MUST be named "Value".
        const string sql = @"
DECLARE @result int;
EXEC @result = sp_getapplock
    @Resource = @resource, @LockMode = 'Exclusive',
    @LockOwner = 'Transaction', @LockTimeout = @timeout;
SELECT @result AS [Value];";

        var resource = new Microsoft.Data.SqlClient.SqlParameter(
            "@resource", $"employee-number:{schoolId}");
        var timeout = new Microsoft.Data.SqlClient.SqlParameter("@timeout", LockTimeoutMs);

        // SingleAsync() EF'e TOP(2) kompozisyonu yaptırır; toplu okuyup bellekte seçiyoruz
        // (StudentNumberGenerator ile aynı gerekçe).
        var results = await db.Database
            .SqlQueryRaw<int>(sql, resource, timeout)
            .ToListAsync(cancellationToken);

        // 0 = alındı, 1 = bekledikten sonra alındı; negatif = alınamadı.
        if (results.Single() < 0)
        {
            throw new InvalidOperationException(
                "Sicil no üretimi için kilit alınamadı; lütfen tekrar deneyin.");
        }
    }
}
```

- [ ] **Step 5: DI kaydını ekle**

`src/Oksis.Infrastructure/DependencyInjection.cs` — satır 87'deki `StudentNumberGenerator` kaydının hemen altına:

```csharp
        // Öğretmen sicil no üreteci — sayaç tablosuz, sp_getapplock ile serileşir.
        services.AddScoped<IEmployeeNumberGenerator, EmployeeNumberGenerator>();
```

- [ ] **Step 6: Testlerin geçtiğini gör**

```bash
cd ~/Repositories/worktrees/oksis-api-polish
dotnet build tests/Oksis.Infrastructure.IntegrationTests/Oksis.Infrastructure.IntegrationTests.csproj --nologo -m:1
dotnet test tests/Oksis.Infrastructure.IntegrationTests/Oksis.Infrastructure.IntegrationTests.csproj \
  --no-build --filter "FullyQualifiedName~EmployeeNumberGenerator" --nologo
```
Beklenen: `Başarılı: 5`

> `--no-build` kullanmadan önce derlemenin GERÇEKTEN geçtiğini doğrula. 2026-09-20'de çöken
> bir derlemeden sonra `--no-build` 5 gün önceki ikilileri çalıştırıp "geçti" dedi.

- [ ] **Step 7: Commit**

```bash
cd ~/Repositories/worktrees/oksis-api-polish
git add src/Oksis.Application/Common/Abstractions/IEmployeeNumberGenerator.cs \
        src/Oksis.Infrastructure/Persistence/Identity/EmployeeNumberGenerator.cs \
        src/Oksis.Infrastructure/DependencyInjection.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Users/EmployeeNumberGeneratorTests.cs
git commit -m "$(cat <<'EOF'
feat(api): öğretmen sicil no üreteci eklendi

Biçim {sezonYılı}{sıra:D3}. Sayaç tablosu yok; yarış durumu okul başına
sp_getapplock ile kapatılıyor. Sıra sayısal karşılaştırılıyor — metin MAX'ı
999 sonrası geri sayıp tekil indekse çarpardı.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017bGMTJy5QnwzXNRPiLzdYu
EOF
)"
```

---

### Task 2: Davette sicil no yazılması

**Files:**
- Modify: `src/Oksis.Application/Modules/Users/Services/PersonUserCreationService.cs:39-44` (ctor), `:126` (profil kurulumu), `:155` (SaveChanges)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Users/PersonUserCreationEmployeeNumberTests.cs`

> **Neden entegrasyon testi, birim testi değil:** `CreateAsync` altı DbSet'e
> (`SystemRoles`, `Persons`, `ConsentBundles`, `SystemSettings`, `Invitations` +
> `Database`) ve statik `InvitationCreationHelper`'a dokunuyor. Hepsini taklit etmek
> kırılgan bir iskele üretir ve asıl kanıtlanması gereken şeyi — numaranın transaction
> içinde üretilip **kalıcılaştığını** — zaten kanıtlayamaz; `sp_getapplock` ve commit
> gerçek bir veritabanı ister. Emsal: `EnrollStudentTests` (aynı proje, gerçek
> `DbContext` + yalnız yaprak soyutlamalar için `NSubstitute`).

**Interfaces:**
- Consumes: `IEmployeeNumberGenerator.NextAsync(Guid, CancellationToken)` (Task 1)
- Produces: davranış değişikliği — `ProfileType.Teacher` için `ProfileRequest.EmployeeNumber` dolu

- [ ] **Step 1: Başarısız testi yaz**

`tests/Oksis.Infrastructure.IntegrationTests/Users/PersonUserCreationEmployeeNumberTests.cs`:

```csharp
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Modules.Users.Services;
using Oksis.Domain.Modules.AcademicSessions.Entities;
using Oksis.Domain.Modules.Identity.Entities;
using Oksis.Domain.Modules.Identity.Enums;
using Oksis.Domain.Modules.Users.Entities;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Oksis.Infrastructure.Persistence.Identity;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Users;

/// <summary>
/// Davetle doğan öğretmenin sicil no'su DOLU olmalı.
///
/// <para>Bulgu (2026-09-20, Altınay Özel Lisesi kurulumu): kadrosunu davetle kuran okulda
/// alan HER öğretmende null doğuyordu — <c>PersonUserCreationService</c> boş
/// <c>ProfileRequest</c> gönderiyordu ve alanı yazan tek gerçek akış, panelde çağrısı
/// olmayan Excel içe aktarmaydı. Bu test o kusurun regresyon kilidi.</para>
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class PersonUserCreationEmployeeNumberTests(DatabaseFixture fixture) : IAsyncLifetime
{
    public async Task InitializeAsync() => await fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    private sealed class FixedClock(DateTimeOffset utcNow) : IDateTimeProvider
    {
        public DateTimeOffset UtcNow => utcNow;
        public DateOnly Today => DateOnly.FromDateTime(utcNow.UtcDateTime);
    }

    [Fact]
    public async Task Davetle_dogan_ogretmenin_sicil_nosu_dolu_olur()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);

        // `CreateAsync`in üç önkoşulu: TEACHER sistem rolü, yürürlükteki KVKK paketi,
        // aktif sezon. Sezonun BAŞLANGIÇ YILI sicil no'nun ilk dört hanesini verir.
        db.Set<SystemRole>().Add(
            SystemRole.Create(Guid.NewGuid(), "TEACHER", "Öğretmen", PortalType.Teacher, false));
        if (!await db.ConsentBundles.AnyAsync(b => b.IsCurrent))
        {
            db.ConsentBundles.Add(ConsentBundle.Create(
                Guid.NewGuid(), "v2026.05.01", "KVKK", "BUNDLE_HASH",
                isCurrent: true, DateTimeOffset.UtcNow));
        }
        var session = AcademicSession.Create(
            schoolId, "2026-2027", new DateOnly(2026, 9, 1), new DateOnly(2027, 6, 30));
        db.AcademicSessions.Add(session);
        await db.SaveChangesAsync(default);

        var sessions = Substitute.For<ICurrentSessionProvider>();
        sessions.GetCurrentSessionIdOrNullAsync(Arg.Any<CancellationToken>())
            .Returns(session.Id);
        var tokens = Substitute.For<IInvitationTokenFactory>();
        tokens.Create().Returns(new InvitationTokenPair("raw-token", "hash"));

        var service = new PersonUserCreationService(
            db,
            sessions,
            tokens,
            new FixedClock(new DateTimeOffset(2026, 9, 21, 9, 0, 0, TimeSpan.Zero)),
            new EmployeeNumberGenerator(db));

        var outcome = await service.CreateAsync(
            schoolId, $"ogretmen-{Guid.NewGuid():N}@okul.test", "Bilgin", "Şimşek",
            UserRole.Teacher, default);

        outcome.Succeeded.Should().BeTrue();

        var saved = await db.Profiles.OfType<TeacherProfile>()
            .AsNoTracking()
            .FirstAsync(p => p.PersonId == outcome.UserId, default);
        saved.EmployeeNumber.Should().Be("2026001");
    }

    /// <summary>
    /// İkinci davet bir sonraki sırayı alır — yani numara gerçekten KALICI olmuş ve
    /// ikinci üretim onu görmüş demektir (transaction commit edilmemiş olsaydı olmazdı).
    /// </summary>
    [Fact]
    public async Task Ikinci_davet_sirayi_ilerletir()
    {
        var schoolId = Guid.NewGuid();
        await using var db = fixture.CreateDbContext(schoolId);

        db.Set<SystemRole>().Add(
            SystemRole.Create(Guid.NewGuid(), "TEACHER", "Öğretmen", PortalType.Teacher, false));
        if (!await db.ConsentBundles.AnyAsync(b => b.IsCurrent))
        {
            db.ConsentBundles.Add(ConsentBundle.Create(
                Guid.NewGuid(), "v2026.05.01", "KVKK", "BUNDLE_HASH",
                isCurrent: true, DateTimeOffset.UtcNow));
        }
        var session = AcademicSession.Create(
            schoolId, "2026-2027", new DateOnly(2026, 9, 1), new DateOnly(2027, 6, 30));
        db.AcademicSessions.Add(session);
        await db.SaveChangesAsync(default);

        var sessions = Substitute.For<ICurrentSessionProvider>();
        sessions.GetCurrentSessionIdOrNullAsync(Arg.Any<CancellationToken>())
            .Returns(session.Id);
        var tokens = Substitute.For<IInvitationTokenFactory>();
        tokens.Create().Returns(new InvitationTokenPair("raw-token", "hash"));

        var service = new PersonUserCreationService(
            db, sessions, tokens,
            new FixedClock(new DateTimeOffset(2026, 9, 21, 9, 0, 0, TimeSpan.Zero)),
            new EmployeeNumberGenerator(db));

        await service.CreateAsync(
            schoolId, $"a-{Guid.NewGuid():N}@okul.test", "Bir", "Öğretmen",
            UserRole.Teacher, default);
        var second = await service.CreateAsync(
            schoolId, $"b-{Guid.NewGuid():N}@okul.test", "İki", "Öğretmen",
            UserRole.Teacher, default);

        var saved = await db.Profiles.OfType<TeacherProfile>()
            .AsNoTracking()
            .FirstAsync(p => p.PersonId == second.UserId, default);
        saved.EmployeeNumber.Should().Be("2026002");
    }
}
```

> `SystemRole.Create(id, code, name, portalType, isSystem)` imzası ve `ConsentBundle.Create`
> çağrısı `AcceptInvitationIntegrationTests.cs:60-67`ten alınmıştır. Kod **tam olarak
> `"TEACHER"`** olmalı — servis `_roleMap` üzerinden bu kodu arıyor.
>
> `ICurrentSessionProvider` metodunun gerçek adı/dönüş tipi derleyiciyle doğrulanır;
> `PersonUserCreationService.cs:102`de nasıl çağrıldığına bak.

- [ ] **Step 2: Testin düştüğünü gör**

```bash
cd ~/Repositories/worktrees/oksis-api-polish
docker start oksis-mssql
dotnet build tests/Oksis.Infrastructure.IntegrationTests/Oksis.Infrastructure.IntegrationTests.csproj --nologo -m:1
```
Beklenen: **derleme hatası** — `PersonUserCreationService` beşinci parametreyi almıyor.

- [ ] **Step 3: Servisi bağla**

`PersonUserCreationService.cs` — ctor'a parametre ekle:

```csharp
public sealed class PersonUserCreationService(
    IApplicationDbContext db,
    ICurrentSessionProvider currentSessionProvider,
    IInvitationTokenFactory tokenFactory,
    IDateTimeProvider clock,
    IEmployeeNumberGenerator employeeNumbers)
    : ICreateUserService
```

Satır 126'daki profil kurulumunu değiştir. **Transaction yalnız öğretmende açılır** —
diğer rollerde kilit gereksizdir ve bugünkü davranış korunur:

```csharp
        // Öğretmen sicil no ile DOĞAR. Numara üretimi ile aşağıdaki tek SaveChanges arası
        // açık bir transaction'a alınır: üretecin sp_getapplock kilidi transaction sahipli
        // ve commit'e kadar tutulmalı, yoksa iki eşzamanlı davet aynı numarayı okur.
        //
        // Branş HÂLÂ sorulmuyor (bu yol ne komutta ne dosya şablonunda branş taşıyor);
        // branşsız doğan öğretmen sonradan profil ekranından branşlanır (B-05, TB-20).
        var isTeacher = mapping.ProfileType == ProfileType.Teacher;
        await using var transaction = isTeacher
            ? await db.Database.BeginTransactionAsync(cancellationToken)
            : null;

        var employeeNumber = isTeacher
            ? await employeeNumbers.NextAsync(schoolId, cancellationToken)
            : null;

        person.AttachProfile(ProfileBuilder.Build(
            new ProfileRequest(mapping.ProfileType, EmployeeNumber: employeeNumber),
            teacherBranchId: null));
```

Satır 155'teki `SaveChangesAsync`'ten hemen sonra commit ekle:

```csharp
        await db.SaveChangesAsync(cancellationToken);
        if (transaction is not null)
        {
            await transaction.CommitAsync(cancellationToken);
        }
```

> `ProfileRequest`in `EmployeeNumber` parametresi konumsal değil **adlandırılmış** verilir:
> kayıt tipinin ara parametreleri (`StudentNumber`, `CurrentClassroomId`, `EnrolledAt`,
> `Branch`) atlanıyor.

- [ ] **Step 4: Testlerin geçtiğini gör**

```bash
cd ~/Repositories/worktrees/oksis-api-polish
dotnet build tests/Oksis.Infrastructure.IntegrationTests/Oksis.Infrastructure.IntegrationTests.csproj --nologo -m:1
dotnet test tests/Oksis.Infrastructure.IntegrationTests/Oksis.Infrastructure.IntegrationTests.csproj \
  --no-build --filter "FullyQualifiedName~PersonUserCreationEmployeeNumber" --nologo
```
Beklenen: `Başarılı: 2`

- [ ] **Step 5: Komşu testlerin kırılmadığını gör**

```bash
dotnet build --nologo -m:1
dotnet test tests/Oksis.Application.UnitTests/Oksis.Application.UnitTests.csproj --no-build --nologo
```
Beklenen: hepsi geçer. Düşen varsa, `PersonUserCreationService`i kuran BAŞKA testlerdir —
onlara da `Substitute.For<IEmployeeNumberGenerator>()` beşinci argümanı eklenir.

- [ ] **Step 6: Commit**

```bash
cd ~/Repositories/worktrees/oksis-api-polish
git add src/Oksis.Application/Modules/Users/Services/PersonUserCreationService.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Users/PersonUserCreationEmployeeNumberTests.cs
git commit -m "$(cat <<'EOF'
feat(api): davetle doğan öğretmen sicil no ile doğuyor

Alan yalnız profil oluşturulurken yazılabiliyordu ve o yolu besleyen tek akış
panelde çağrısı olmayan Excel içe aktarmaydı; davetle kurulan kadroda sicil no
her öğretmende boş kalıyordu.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017bGMTJy5QnwzXNRPiLzdYu
EOF
)"
```

---

### Task 3: Ortak `MultiSelect` bileşeni

**Files:**
- Create: `apps/web/components/shared/multi-select.tsx`
- Modify: `packages/ui/src/styles/screens.css` (`.usr-fdd-item .chk` kuralından sonra, `.usr-bulk` bloğundan önce)
- Modify: `~/Repositories/oksis/docs/frontend/bilesenler/_envanter.md`

**Interfaces:**
- Consumes: `OksisIcon`, `OksisIconName` (`@workspace/ui`)
- Produces:
  ```ts
  export interface MultiSelectOption { key: string; label: string; disabled?: boolean; disabledReason?: string }
  export function MultiSelect(props: {
    icon: OksisIconName; label: string; values: readonly string[]
    options: ReadonlyArray<MultiSelectOption>; onChange: (next: string[]) => void
    placeholder?: string; maxVisibleChips?: number; emptyText?: string
    disabled?: boolean; scrollAfter?: number
  }): JSX.Element
  ```

- [ ] **Step 1: Bileşeni yaz**

`apps/web/components/shared/multi-select.tsx`:

```tsx
"use client"

import { useState } from "react"
import { OksisIcon, type OksisIconName } from "@workspace/ui"

export interface MultiSelectOption {
  key: string
  label: string
  /** Seçilemez seçenek — listede görünür ama tıklanamaz. */
  disabled?: boolean
  /** Neden seçilemediği; etiketin altına küçük puntoyla yazılır. */
  disabledReason?: string
}

/**
 * Form alanının ÇOK değerli açılır seçimi — `FilterDropdown`'ın çoklu yüzü
 * (`SelectBox` tek değerli yüzü olduğu gibi). Kabuk `.usr-fdd`, çoklu-seçime
 * özgü sınıflar `.usr-msel-*`.
 *
 * `MultiChoiceChips` ile karıştırma: o, AZ ve KISA etiketli seçeneklerin tamamını
 * ekrana seren çip ızgarasıdır (Ders Kataloğu "Seviyeler"). Bu bileşen seçenek
 * sayısı büyüdüğünde (ör. 12+ şubeli okul) ızgaranın dağıldığı yerde kullanılır:
 * seçenekler menüde kalır, seçilenler düğmede rozet olur.
 *
 * - Menü açıkken seçim menüyü KAPATMAZ — çoklu seçimde her tıklamada kapanmak
 *   seçeneklerin tamamını tek tek açmayı gerektirirdi.
 * - Rozetteki ✕ tek tek çıkarır; rozet sayısı `maxVisibleChips`i aşarsa kalanı
 *   "+N" olarak özetlenir ve tam liste `title`'a yazılır.
 * - `disabled` seçenek gerekçesiyle gösterilir: sessizce tıklanamayan bir satır
 *   kullanıcıya arızalı görünür.
 */
export function MultiSelect({
  icon,
  label,
  values,
  options,
  onChange,
  placeholder,
  maxVisibleChips = 2,
  emptyText = "Seçenek yok.",
  disabled = false,
  scrollAfter = 8,
}: {
  icon: OksisIconName
  label: string
  values: readonly string[]
  options: ReadonlyArray<MultiSelectOption>
  onChange: (next: string[]) => void
  placeholder?: string
  maxVisibleChips?: number
  emptyText?: string
  disabled?: boolean
  scrollAfter?: number
}) {
  const [open, setOpen] = useState(false)

  const selected = options.filter((o) => values.includes(o.key))
  const visible = selected.slice(0, maxVisibleChips)
  const hiddenCount = selected.length - visible.length
  const allLabels = selected.map((o) => o.label).join(", ")

  const toggle = (key: string) => {
    onChange(
      values.includes(key)
        ? values.filter((v) => v !== key)
        : [...values, key]
    )
  }

  return (
    <div className="usr-fdd usr-msel">
      {open && <div className="usr-ddback" onClick={() => setOpen(false)} />}
      <button
        type="button"
        className={"usr-fdd-btn usr-msel-btn" + (selected.length ? " on" : "")}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={allLabels || undefined}
      >
        <OksisIcon name={icon} size={14} />
        {selected.length === 0 ? (
          <span className="usr-msel-ph">{placeholder ?? label}</span>
        ) : (
          <span className="usr-msel-chips">
            {visible.map((o) => (
              <span key={o.key} className="usr-msel-chip">
                {o.label}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`${o.label} seçimini kaldır`}
                  className="x"
                  onClick={(e) => {
                    // Rozetin ✕'i menüyü açmasın.
                    e.stopPropagation()
                    toggle(o.key)
                  }}
                >
                  <OksisIcon name="x" size={11} />
                </span>
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="usr-msel-more">+{hiddenCount}</span>
            )}
          </span>
        )}
        <OksisIcon name="chevD" size={13} />
      </button>
      {open && (
        <div
          className={
            "usr-fdd-menu usr-msel-menu" +
            (options.length > scrollAfter ? " stu-fdd-scroll" : "")
          }
          role="listbox"
          aria-multiselectable
          aria-label={label}
        >
          {options.length === 0 && (
            <div className="usr-msel-empty">{emptyText}</div>
          )}
          {options.map((o) => {
            const on = values.includes(o.key)
            return (
              <button
                key={o.key}
                type="button"
                role="option"
                aria-selected={on}
                disabled={o.disabled}
                className={
                  "usr-fdd-item usr-msel-item" +
                  (on ? " on" : "") +
                  (o.disabled ? " off" : "")
                }
                onClick={() => toggle(o.key)}
              >
                <span className={"usr-msel-box" + (on ? " on" : "")}>
                  {on && <OksisIcon name="check" size={11} />}
                </span>
                <span className="usr-msel-text">
                  {o.label}
                  {o.disabled && o.disabledReason && (
                    <i className="rs">{o.disabledReason}</i>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: CSS'i ekle**

`packages/ui/src/styles/screens.css` — `.usr-fdd-item .chk { … }` kuralının hemen ardına,
`.usr-bulk` bloğundan önce. **`.usr-fdd*` kuralları yeniden TANIMLANMAZ**, yalnız yeni sınıflar:

```css
/* Çoklu seçim — `MultiSelect`. Kabuk `.usr-fdd`; burada yalnız çoklu-seçime
   özgü eklentiler var (rozetli düğme, onay kutulu satır). */
.usr-msel-btn {
  height: auto;
  min-height: 38px;
  padding: 5px 11px 5px 12px;
  color: var(--ink);
}
.usr-msel-ph {
  color: var(--muted);
  font-weight: 600;
}
.usr-msel-chips {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: nowrap;
}
.usr-msel-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 5px 0 8px;
  border-radius: var(--r-sm);
  background: var(--s);
  color: var(--p);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.usr-msel-chip .x {
  display: inline-flex;
  align-items: center;
  opacity: 0.65;
}
.usr-msel-chip .x:hover {
  opacity: 1;
}
.usr-msel-more {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}
.usr-msel-menu {
  min-width: 232px;
}
.usr-msel-item.off {
  opacity: 0.5;
  cursor: not-allowed;
}
.usr-msel-item.off:hover {
  background: transparent;
}
.usr-msel-box {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--white);
  color: var(--white);
}
.usr-msel-box.on {
  border-color: var(--a);
  background: var(--a);
}
.usr-msel-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-align: left;
}
.usr-msel-text .rs {
  font-style: normal;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
}
.usr-msel-empty {
  padding: 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
}
```

- [ ] **Step 3: Derlendiğini gör**

```bash
cd /Users/farukkaya/Repositories/worktrees/oksis-ui-polish
npm run typecheck -w web && npm run lint -w web
```
Beklenen: ikisi de temiz. (Bileşenin henüz tüketicisi yok; Task 5'te bağlanacak.)

- [ ] **Step 4: Envanteri güncelle**

`~/Repositories/oksis/docs/frontend/bilesenler/_envanter.md` — `apps/web/components/shared/*`
tablosuna, `SelectCheckbox` satırının ardına:

```markdown
| `MultiSelect` | ✅ built | `components/shared/multi-select.tsx` — `FilterDropdown`'ın çok değerli yüzü (rozetli düğme + onay kutulu menü, `disabled` seçenek gerekçesiyle). `MultiChoiceChips` az/kısa seçenek içindir; bu bileşen ızgaranın dağıldığı yerde (12+ şube). Stil `screens.css .usr-msel-*`. İlk tüketici öğretmen Mesleki Bilgiler modalı (çoklu sınıf öğretmenliği) |
```

- [ ] **Step 5: Commit**

```bash
cd /Users/farukkaya/Repositories/worktrees/oksis-ui-polish
git add apps/web/components/shared/multi-select.tsx packages/ui/src/styles/screens.css
git commit -m "$(cat <<'EOF'
feat(web): ortak MultiSelect bileşeni eklendi

FilterDropdown'ın çok değerli yüzü: rozetli düğme, onay kutulu menü, gerekçeli
disabled seçenek. MultiChoiceChips az ve kısa etiketli seçenek içindir; çoklu
şube seçiminde çip ızgarası dağılıyor.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017bGMTJy5QnwzXNRPiLzdYu
EOF
)"

cd ~/Repositories/oksis/docs
git add frontend/bilesenler/_envanter.md
git commit -m "$(cat <<'EOF'
docs(bilesenler): MultiSelect envantere eklendi

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017bGMTJy5QnwzXNRPiLzdYu
EOF
)"
```

---

### Task 4: İkinci yazma yüzeyini kaldır

Bu görev **çoklu seçimden ÖNCE** gelir: tek yazma yüzeyi bırakınca Task 5'in dönüştüreceği
yer bire iner. Davranış bu turda tekil kalır — yalnız `TchHomeroomModal` ve satır menüsü
maddesi kalkar, düzenleme "Mesleki Bilgiler"e toplanır.

**Files:**
- Modify: `apps/web/features/teachers/modals.tsx` — `TchHomeroomModal` (satır 29-148) silinir
- Modify: `packages/core/src/teachers/types.ts:82` — `TeacherAction`'dan `"homeroom"` çıkar
- Modify: `packages/core/src/teachers/logic.ts:119`
- Modify: `apps/web/features/teachers/teacher-labels.ts:42,55`
- Modify: `apps/web/features/teachers/teachers-page.tsx:44,149-150,165-178,365+`
- Test: `packages/core/src/teachers/logic.test.ts`

**Interfaces:**
- Produces: `TeacherAction = "detail" | "capacity" | "schedule" | "putOnLeave" | "resume" | "deactivate"`

- [ ] **Step 1: Başarısız testi yaz**

`packages/core/src/teachers/logic.test.ts` — dosyanın sonuna:

```ts
describe("availableTeacherActions — sınıf öğretmenliği satır menüsünde YOK", () => {
  // Sınıf öğretmenliğinin tek yazma yüzeyi Mesleki Bilgiler modalıdır; satır
  // menüsündeki ikinci kapı kaldırıldı (aynı kaydı iki yerden yazmak, profil
  // modalının kendi kuralının da ihlaliydi).
  it("aktif öğretmende homeroom döndürmez", () => {
    const actions = availableTeacherActions({ ...baseTeacher, status: "active" })
    expect(actions).not.toContain("homeroom")
  })

  it("detay ve kapasite hâlâ var", () => {
    const actions = availableTeacherActions({ ...baseTeacher, status: "active" })
    expect(actions).toContain("detail")
    expect(actions).toContain("capacity")
  })
})
```

> `baseTeacher` bu dosyada zaten tanımlı olan fixture'dır (satır ~10-40). Adı farklıysa
> dosyadaki gerçek adı kullan.

- [ ] **Step 2: Testin düştüğünü gör**

```bash
cd /Users/farukkaya/Repositories/worktrees/oksis-ui-polish
npx vitest run --root packages/core teachers
```
Beklenen: `availableTeacherActions` `homeroom` içerdiği için FAIL.

- [ ] **Step 3: `homeroom` eylemini kaldır**

`packages/core/src/teachers/types.ts` — `TeacherAction` birliğinden `| "homeroom"` satırını sil.

`packages/core/src/teachers/logic.ts` — şu satırı sil:

```ts
  if (!terminal) actions.push("homeroom")
```

`apps/web/features/teachers/teacher-labels.ts` — şu satırı sil:

```ts
  homeroom: { label: "Sınıf Öğretmenliği", icon: "userCheck", kind: "action" },
```

ve menü grubunu güncelle:

```ts
export const ACTION_GROUPS: TeacherAction[][] = [
  ["detail", "capacity", "schedule"],
  ["putOnLeave", "resume", "deactivate"],
]
```

- [ ] **Step 4: `TchHomeroomModal`'ı ve sayfadaki izlerini sil**

`apps/web/features/teachers/modals.tsx` — `TchHomeroomModal` fonksiyonunun tamamını
(`/** 1) Sınıf Öğretmenliği …` yorumundan kapanış `}`'ına kadar) sil. Artık kullanılmayan
`useClassRoomOptions` importunu da kaldır.

`apps/web/features/teachers/teachers-page.tsx`:
- `Modal` birliğinden `| { type: "homeroom"; teacher: Teacher }` satırını sil
- `onAction` içindeki `case "homeroom":` dalını sil
- `assignHomeroom` ve `removeHomeroomOf` fonksiyonlarını sil
- `{modal?.type === "homeroom" && ( … )}` bloğunu sil
- `TchHomeroomModal` importunu sil
- Kullanılmaz hâle gelen `useSetHomeroom`/`useRemoveHomeroom` çağrılarını ve
  `homeroomPending` değişkenini sil (typecheck/lint bunları zaten işaretler)

- [ ] **Step 5: Testlerin ve derlemenin geçtiğini gör**

```bash
cd /Users/farukkaya/Repositories/worktrees/oksis-ui-polish
npx vitest run --root packages/core teachers
npm run typecheck -w web && npm run lint -w web
```
Beklenen: testler geçer, typecheck ve lint temiz.

- [ ] **Step 6: Commit**

```bash
cd /Users/farukkaya/Repositories/worktrees/oksis-ui-polish
git add packages/core/src/teachers/types.ts packages/core/src/teachers/logic.ts \
        packages/core/src/teachers/logic.test.ts \
        apps/web/features/teachers/modals.tsx \
        apps/web/features/teachers/teacher-labels.ts \
        apps/web/features/teachers/teachers-page.tsx
git commit -m "$(cat <<'EOF'
refactor(web): sınıf öğretmenliğinin tek yazma yüzeyi mesleki bilgiler modalı

Aynı kayıt iki kapıdan yazılıyordu: satır menüsündeki özel modal ve profil
modalındaki açılır liste. Profil modalının kendi kuralı ikinci yazma yüzeyini
zaten yasaklıyordu.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017bGMTJy5QnwzXNRPiLzdYu
EOF
)"
```

---

### Task 5: Çoklu sınıf öğretmenliği (uçtan uca)

**Files:**
- Modify: `packages/core/src/teachers/types.ts:17-19`
- Modify: `packages/core/src/teachers/logic.test.ts` (fixture)
- Modify: `packages/api/src/teachers/endpoints.ts:80-96,117-118`
- Test: `packages/api/src/teachers/endpoints.test.ts`
- Modify: `apps/web/features/teachers/table.tsx:228-235`
- Modify: `apps/web/features/teachers/drawer.tsx:244-250,518-546`
- Modify: `apps/web/features/teachers/modals.tsx` — `TchProfileModal` ve `TchCapacityModal:234`

**Interfaces:**
- Consumes: `MultiSelect`, `MultiSelectOption` (Task 3); `useSetHomeroom`, `useRemoveHomeroom` (`@workspace/api`)
- Produces: `TeacherHomeroom { classRoomId: string; className: string }`, `Teacher.homerooms: TeacherHomeroom[]`

- [ ] **Step 1: Başarısız testi yaz**

`packages/api/src/teachers/endpoints.test.ts` — dosyanın sonuna:

```ts
/**
 * Bir öğretmen birden çok şubenin sınıf öğretmeni olabilir (sunucuda SOFT kural,
 * `SetHomeroomCommandHandler`). Kısıt istemcideydi: `fetchHomeroomMap`
 * `Map<teacherId, HomeroomInfo>` kurduğu için aynı öğretmenin ikinci şubesi
 * sessizce son kazanan tarafından eziliyordu.
 */
describe("getTeachers — çoklu sınıf öğretmenliği", () => {
  beforeEach(() => {
    resetClient()
  })

  afterEach(() => {
    resetApiConfig()
    resetClient()
  })

  it("aynı öğretmenin iki şubesini de taşır", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = typeof input === "string" ? input : String(
        input instanceof URL ? input.href : input.url
      )
      const body = url.includes("/class-rooms")
        ? {
            items: [
              { id: "c1", fullName: "9-A", homeroomTeacherId: TEACHER_ID },
              { id: "c2", fullName: "10-B", homeroomTeacherId: TEACHER_ID },
            ],
          }
        : url.includes("/users/persons")
          ? {
              items: [
                {
                  id: TEACHER_ID,
                  firstName: "Bilgin",
                  lastName: "Şimşek",
                  primaryEmail: null,
                  primaryPhone: null,
                  lifecycleState: "Active",
                  profileTypes: ["Teacher"],
                  createdAt: "2026-09-01T00:00:00Z",
                  parentCount: 0,
                },
              ],
              totalCount: 1,
            }
          : { items: [], averageFillPercent: 0, capacity: 30 }
      return new Response(
        JSON.stringify({ data: body, meta: null, errors: null, correlationId: "c" }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    })
    configureApi({
      baseUrl: "http://x",
      auth: {
        getAccessToken: () => null,
        getRefreshToken: () => null,
        setTokens: vi.fn(),
        clear: vi.fn(),
      },
      fetch: fetchMock,
    })

    const teachers = await teachersEndpoints.getTeachers()

    expect(teachers[0]!.homerooms.map((h) => h.className)).toEqual(["9-A", "10-B"])
  })
})
```

> Sunucu yanıt zarfı (`data`/`meta`/`errors`/`correlationId`) ve sorgu sırası bu dosyanın
> üstündeki `setupFetchMock` kalıbından alınmıştır. `getTeachers` üç ucu `Promise.all` ile
> çağırıyor; yukarıdaki mock URL'e bakarak doğru gövdeyi döndürür. Gerçek DTO alan adları
> `packages/api/src/generated/schema.ts` içindeki `PersonListItemDto` ve
> `GetClassRoomListResult`ten doğrulanmalı — uyuşmazlık varsa **mock düzeltilir**, üretim
> kodu değil.

- [ ] **Step 2: Testin düştüğünü gör**

```bash
cd /Users/farukkaya/Repositories/worktrees/oksis-ui-polish
npx vitest run --root packages/api teachers
```
Beklenen: FAIL — `homerooms` alanı yok.

- [ ] **Step 3: Domain tipini çoğullaştır**

`packages/core/src/teachers/types.ts` — şu iki satırı sil:

```ts
  /** Sınıf öğretmeni olduğu şube ("9-A"); null = değil. Kaynak: class-rooms homeroom. */
  homeroomClassName: string | null
  /** Sınıf öğretmeni olduğu şubenin id'si (homeroom kaldırma için); null = değil. */
  homeroomClassRoomId: string | null
```

yerine:

```ts
  /**
   * Sınıf öğretmeni olduğu şubeler; boş dizi = hiçbirinin rehberi değil.
   *
   * ÇOĞUL, çünkü kural sunucuda 2026-06-10'da soft'a çevrildi: bir öğretmen aynı
   * sezonda birden çok şubenin rehberi olabilir (`SetHomeroomCommandHandler`).
   * İstemci bunu tekil tutuyordu ve `fetchHomeroomMap` ikinci şubeyi sessizce
   * eziyordu. İlişki yönü: 1 şube → 1 rehber, 1 öğretmen → N şube.
   */
  homerooms: TeacherHomeroom[]
```

ve dosyaya `Teacher` arayüzünden önce:

```ts
/** Öğretmenin rehberi olduğu tek bir şube. */
export interface TeacherHomeroom {
  classRoomId: string
  className: string
}
```

- [ ] **Step 4: API eşlemesini çoğullaştır**

`packages/api/src/teachers/endpoints.ts`:

```ts
type HomeroomInfo = { classRoomId: string; className: string }

/**
 * Aktif sezon şubeleri → teacherId'ye göre sınıf-öğretmenliği (homeroom) haritası.
 *
 * Değer ÇOĞUL: bir öğretmen birden çok şubenin rehberi olabilir (sunucuda soft
 * kural). Tekil `Map` kurulduğu sürece aynı öğretmenin ikinci şubesi sessizce
 * son kazanan tarafından eziliyordu.
 */
async function fetchHomeroomMap(): Promise<Map<string, HomeroomInfo[]>> {
  const result = await unwrap<S["GetClassRoomListResult"]>(
    await getClient().GET("/api/v1/class-rooms", {
      params: { query: { status: "Active" } },
    })
  )
  const map = new Map<string, HomeroomInfo[]>()
  for (const room of result?.items ?? []) {
    if (!room.homeroomTeacherId) continue
    const list = map.get(room.homeroomTeacherId) ?? []
    list.push({ classRoomId: room.id, className: room.fullName })
    map.set(room.homeroomTeacherId, list)
  }
  return map
}
```

`toTeacher` imzasını ve gövdesini güncelle:

```ts
function toTeacher(
  dto: S["PersonListItemDto"],
  workload: WorkloadInfo | undefined,
  homerooms: HomeroomInfo[] | undefined,
  defaultCapacity: number
): Teacher {
```

ve iki alanı tek alanla değiştir:

```ts
    homerooms: homerooms ?? [],
```

`getTeachers` içinde `toTeacher` çağrısına giden argüman zaten `homeroom.get(dto.id)`
biçimindedir; adını `homerooms` olarak okunur hâle getir, çağrı şekli değişmez.

- [ ] **Step 5: Kapasite presetini güncelle**

`apps/web/features/teachers/modals.tsx` — `TchCapacityModal` içinde:

```ts
  >(teacher.homerooms.length > 0 ? "classTeacher" : "subjectTeacher")
```

- [ ] **Step 6: Tabloyu güncelle**

`apps/web/features/teachers/table.tsx` — şube hücresi:

```tsx
                  <td>
                    <TchHomeroomCell teacher={teacher} />
                  </td>
```

ve dosyanın altına, diğer hücre bileşenlerinin yanına:

```tsx
/** Satır yüksekliği sabit kalsın diye ilk iki şube rozet, kalanı "+N". */
const MAX_HOMEROOM_CHIPS = 2

function TchHomeroomCell({ teacher }: { teacher: Teacher }) {
  if (teacher.homerooms.length === 0) {
    return <span className="stu-dash">—</span>
  }
  const visible = teacher.homerooms.slice(0, MAX_HOMEROOM_CHIPS)
  const hidden = teacher.homerooms.length - visible.length
  const all = teacher.homerooms.map((h) => h.className).join(", ")
  return (
    <span className="tch-clslist" title={all}>
      {visible.map((h) => (
        <span key={h.classRoomId} className="tch-cls">
          {h.className}
        </span>
      ))}
      {hidden > 0 && <span className="tch-clsmore">+{hidden}</span>}
    </span>
  )
}
```

`packages/ui/src/styles/teachers.css` sonuna:

```css
/* Çoklu sınıf öğretmenliği — ilk iki rozet + "+N" (satır yüksekliği sabit kalır). */
.tch-clslist { display: inline-flex; align-items: center; gap: 5px; }
.tch-clsmore { font-size: 11.5px; font-weight: 700; color: var(--muted); }
```

- [ ] **Step 7: Çekmeceyi güncelle**

`apps/web/features/teachers/drawer.tsx` — `Fact "Sınıf Öğretmenliği"`:

```tsx
          <Fact label="Sınıf Öğretmenliği">
            {teacher.homerooms.length > 0 ? (
              <span className="tch-clslist">
                {teacher.homerooms.map((h) => (
                  <span key={h.classRoomId} className="tch-cls">
                    {h.className}
                  </span>
                ))}
              </span>
            ) : (
              <span className="stu-dash">—</span>
            )}
          </Fact>
```

ve `TabSinif`:

```tsx
function TabSinif({ teacher }: { teacher: Teacher }) {
  const router = useRouter()
  if (teacher.homerooms.length === 0) {
    return (
      <div className="snf-lookup-empty">
        Bu öğretmen şu an hiçbir şubenin sınıf öğretmeni değil.
      </div>
    )
  }
  return (
    <>
      {teacher.homerooms.map((h) => (
        <div className="tch-guide" key={h.classRoomId}>
          <div className="top">
            <span className="ic">
              <OksisIcon name="sinif" size={17} />
            </span>
            <div>
              <div className="t">
                <span className="tch-cls">{h.className}</span>
              </div>
              <div className="s">Sorumlu şube</div>
            </div>
          </div>
          <button
            className="tch-guide-go"
            onClick={() => router.push("/students")}
          >
            Öğrenci listesi
            <OksisIcon name="ext" size={13} />
          </button>
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 8: Mesleki Bilgiler modalını çoklu seçime çevir**

`apps/web/features/teachers/modals.tsx` — `TchProfileModal` içinde state:

```ts
  const [homeroomIds, setHomeroomIds] = useState<string[]>(() =>
    teacher.homerooms.map((h) => h.classRoomId)
  )
```

Seçenekler ve fark hesabı (`sections` türetmesinin hemen altına):

```ts
  // Rehberi BAŞKASI olan şube seçime kapalı: atama sessizce onun yerine geçerdi
  // (bir şubenin tek homeroomTeacherId'si var).
  const homeroomOptions: MultiSelectOption[] = sections.map((sec) => {
    const takenByOther =
      sec.homeroomTeacherId !== null && sec.homeroomTeacherId !== teacher.id
    return {
      key: sec.id,
      label: sec.name,
      disabled: takenByOther,
      disabledReason: takenByOther
        ? `Rehberi: ${sec.homeroomTeacherName ?? "atanmış"}`
        : undefined,
    }
  })

  const currentHomeroomIds = teacher.homerooms.map((h) => h.classRoomId)
  const addedHomerooms = homeroomIds.filter(
    (id) => !currentHomeroomIds.includes(id)
  )
  const removedHomerooms = currentHomeroomIds.filter(
    (id) => !homeroomIds.includes(id)
  )
  const homeroomChanged =
    addedHomerooms.length > 0 || removedHomerooms.length > 0
```

`dirty` ifadesinde `homeroomChanged` zaten kullanılıyor; değişmez.

`save` içindeki homeroom bloğunu **küme farkıyla** değiştir:

```ts
      // Küme farkı: devir artık remove(eski) + add(yeni). Eskiden yalnız
      // setHomeroom(yeni) çağrılıyordu ve öğretmen iki şubenin birden rehberi
      // kalıyordu — sunucu soft kural olduğu için itiraz etmiyordu.
      for (const classRoomId of removedHomerooms) {
        await removeHomeroom.mutateAsync({ classRoomId })
      }
      for (const classRoomId of addedHomerooms) {
        await setHomeroom.mutateAsync({ classRoomId, teacherId: teacher.id })
      }
```

JSX'te `<select id="tch-homeroom">` bloğunu değiştir:

```tsx
            <div className="snf-fld">
              <span className="fl">Sınıf Öğretmenliği</span>
              <MultiSelect
                icon="sinif"
                label="Şube"
                values={homeroomIds}
                options={homeroomOptions}
                disabled={pending || terminal || sectionsQuery.isLoading}
                placeholder="Şube seçin…"
                emptyText="Sezonda aktif şube yok."
                onChange={(next) => {
                  setHomeroomIds(next)
                  setError(null)
                }}
              />
            </div>
```

> `<label htmlFor>` yerine `<span className="fl">` kullanılıyor: `MultiSelect`in
> odaklanabilir öğesi bir `<button>`, `htmlFor` bir form kontrolü bekler. Aynı kalıp
> modaldaki "Kadro Durumu" alanında zaten var.

Importları güncelle:

```ts
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/shared/multi-select"
```

- [ ] **Step 9: Fixture'ları güncelle**

`packages/core/src/teachers/logic.test.ts` — fixture'daki iki satırı

```ts
    homeroomClassName: null,
    homeroomClassRoomId: null,
```

şununla değiştir:

```ts
    homerooms: [],
```

- [ ] **Step 10: Testlerin ve derlemenin geçtiğini gör**

```bash
cd /Users/farukkaya/Repositories/worktrees/oksis-ui-polish
npx vitest run --root packages/core teachers
npx vitest run --root packages/api teachers
npm run typecheck && npm run lint
```
Beklenen: hepsi temiz. Typecheck kalan `homeroomClassName`/`homeroomClassRoomId`
kullanımlarını tek tek gösterir — her birini `homerooms` ile değiştir.

- [ ] **Step 11: Commit**

```bash
cd /Users/farukkaya/Repositories/worktrees/oksis-ui-polish
git add packages/core/src/teachers packages/api/src/teachers \
        apps/web/features/teachers packages/ui/src/styles/teachers.css
git commit -m "$(cat <<'EOF'
feat(web): bir öğretmen birden çok şubenin sınıf öğretmeni olabiliyor

Kural sunucuda 2026-06-10'dan beri soft; kısıt istemcideydi. fetchHomeroomMap
tekil Map kurduğu için aynı öğretmenin ikinci şubesi sessizce eziliyordu.
Kaydetme küme farkına geçti: A'dan B'ye devir artık remove(A)+add(B), yani
öğretmen iki şubenin birden rehberi kalmıyor.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017bGMTJy5QnwzXNRPiLzdYu
EOF
)"
```

---

### Task 6: Toplu doğrulama

Kullanıcı kararı: doğrulama en sonda toplu yapılır.

**Files:** yok (yalnız çalıştırma)

- [ ] **Step 1: Backend tam test takımı**

```bash
cd ~/Repositories/worktrees/oksis-api-polish
docker start oksis-mssql
dotnet build --nologo -m:1
dotnet test --no-build --nologo
```
Beklenen: 0 başarısız. **Derlemenin EXIT=0 verdiğini gözle doğrula** — çöken bir derlemeden
sonra `--no-build` eski ikilileri çalıştırır ve yanlış "geçti" üretir.

- [ ] **Step 2: Frontend tam doğrulama**

```bash
cd /Users/farukkaya/Repositories/worktrees/oksis-ui-polish
npm run typecheck
npm run lint
npx vitest run --root packages/core
npx vitest run --root packages/api
```
Beklenen: typecheck/lint 6/6 temiz; vitest'te **yalnız** `packages/core/src/homework/schemas.test.ts`
düşer (2 test). O arıza bu turla ilgisiz: fixture `dueDate: "2026-09-18"` sabitini kullanıyor
ve tarih geçmişte kaldı. Başka bir düşen varsa gerçek regresyondur.

- [ ] **Step 3: Kullanıcıdan tarayıcı doğrulaması için onay iste**

Ekran testine başlamadan önce **sor** (yerleşik kullanıcı tercihi). Onay gelirse doğrulanacaklar:

1. Öğretmenler → bir öğretmen → Düzenle → Sicil No alanı yazılabiliyor, kaydediliyor
2. Yeni öğretmen daveti → kabul → listede sicil no `2026001` biçiminde görünüyor
3. Mesleki Bilgiler → Sınıf Öğretmenliği'nde iki şube seçilebiliyor, kaydediliyor
4. Tabloda iki rozet + "+N" görünüyor; çekmecede tam liste var
5. Rehberi başkası olan şube menüde gerekçesiyle kapalı
6. A'dan B'ye devirden sonra öğretmen **yalnız** B'nin rehberi
7. Satır menüsünde "Sınıf Öğretmenliği" maddesi YOK

---

## Öz-denetim notları

**Spec kapsaması:** Spec'in 12 kararının tamamı bir göreve bağlı — 1-5 Task 1-2, 6-7 Task 5,
8 Task 4, 9-10 Task 5, 11 Task 3, 12 kapsam dışı (planda görev yok, bilinçli).

**Tip tutarlılığı:** `TeacherHomeroom`/`homerooms` Task 5'te tanımlanıp aynı görevde
tüketiliyor. `MultiSelectOption` Task 3'te tanımlanıp Task 5 Step 8'de import ediliyor.
`IEmployeeNumberGenerator.NextAsync` Task 1'de tanımlanıp Task 2'de çağrılıyor — imza aynı.

**Bilinçli sıra:** Task 4 (yüzey kaldırma) Task 5'ten (çoğullaştırma) önce; böylece
çoğullaştırılacak yazma yüzeyi bire iner ve `TchHomeroomModal` için geçici uyarlama
yazılmaz.
