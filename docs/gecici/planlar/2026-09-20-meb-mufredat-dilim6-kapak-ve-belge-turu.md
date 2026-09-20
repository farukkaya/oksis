# MEB Müfredatı — Dilim 6: Kapak ve Belge Türü Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** İndirilen her MEB belgesi kendi künyesini taşısın — belge türü, karar numarası,
karar tarihi, konu ve akademik yıl kapaktan okunup belgeyle birlikte saklansın.

**Architecture:** Yeni tablo yok. `MebSourceDocument`'a beş sütun eklenir. Saf bir ayrıştırıcı
(`MebCoverParser`) kapak sayfasını konumlu kelime katmanından çözer; `MebChartParser` gibi PDF
kütüphanesinden bağımsızdır ve golden fixture ile test edilir. Kapak okuma, belgenin merkez
deposuna girdiği tek yola (`CurriculumSourceIngestor`) bağlanır — elle yükleme, tek belge
indirme ve kategori süpürme üçü de aynı koddan geçer.

**Tech Stack:** .NET 10 / C# 13, EF Core 10 + SQL Server 2022, MediatR, xUnit +
FluentAssertions + NSubstitute + Testcontainers.

**Spec:** `docs/teknik-analizler/mufredat/meb-kaynakli-katalog-tasarimi.md` (onaylı,
2026-09-20) — §2.7, §5.2, §6.1, §9. Sonraki dilimlerin tamamı bu dilimin çıktısına dayanır.

## Global Constraints

- Tenant yok: `MebSourceDocument` bir master varlıktır, `SchoolId` taşımaz ve iş `PlatformOnly`
  kapısı **arkasından** değil, sistem aktörü olarak çalışır (`TB-212`).
- Ayrıştırıcı saf kalır: `Oksis.Application` içindedir, PdfPig'e referans vermez, yalnız
  `PdfTextDocument` görür.
- Domain'de EF Core ve DataAnnotations yasak; eşleme `Infrastructure/Persistence/Configurations/`.
- Göç adı `YYYYMMDD_snake_case` biçiminde: `20260920_meb_document_cover`.
- Commit biçimi: `<type>(<scope>): türkçe açıklama`, scope `academics`, sonda nokta yok.
- Test koşumu `./scripts/test-changed.sh`; entegrasyon için `--integration` (Docker gerekir,
  koşu sonrası kapatılır).
- Uydurma yok: kapakta olmayan alan `null` kalır, varsayılan yazılmaz.

---

## Koddan ölçülen başlangıç durumu

| Yetenek | Durum |
|---|---|
| PDF → konumlu kelime + cetvel çizgisi | **Var** (`IPdfTextExtractor`, `PdfTextDocument`, `PdfRule`) |
| Çizelge ayrıştırma (sayfa 2+) | **Var** (`MebChartParser`) |
| Cetvel çizgisinden hücre çözme emsali | **Var** (`CategoryBands`, `TB-217`) |
| Golden fixture altyapısı | **Var** (`MebChartFixture`, `MebChartGoldenTests`) |
| Belgenin tek giriş yolu | **Var** (`CurriculumSourceIngestor`) |
| **Kapak ayrıştırma** | **Yok** — `MebChartParser` yalnız çizelge sayfalarına bakar |
| **Belge türü** | **Yok** — her belge örtük olarak çizelge sayılıyor |
| **Karar künyesi** | **Yok** — kullanıcıdan modalda isteniyor |

**Kapak okunabilirliği ölçüldü ve doğrulandı** (spec §11'in açık maddesi bu planla kapanır).
`anadolu-2025-05.words.json` fixture'ının 1. sayfası 257 kelime ve 28 cetvel çizgisi (12 yatay,
16 dikey) taşıyor. Etiket/değer geometrisi:

| Kelime | Left | Bottom |
|---|---|---|
| `Sayı` | 48 | 745 |
| `05` | 205 | 745 |
| `Tarih` | 48 | 722 |
| `09/05/2025` | 205 | 722 |
| `Tarih` (tuzak, "Önceki Kararın Tarih ve Sayısı" içinde) | **126** | 676 |
| `Konu:` | 289 | 742 |

**Tuzağı eleyen kural:** etiket, satırının **en solundaki** kelime olmalı. Tuzak `Tarih`
L=126'da ve solunda `Önceki` var. Ayrıca `Tarihleri` ve `Sayısı`, katlanmış hâlde `TARIH` /
`SAYI` ile eşleşmez.

---

## Dosya yapısı

| Dosya | Sorumluluk |
|---|---|
| `src/Oksis.Domain/Modules/Academics/Enums/MebDocumentKind.cs` (yeni) | Belge türü |
| `src/Oksis.Application/.../Parsing/MebDocumentCover.cs` (yeni) | Kapak çıktısı (saf veri) |
| `src/Oksis.Application/.../Parsing/MebCoverParser.cs` (yeni) | Kapak ayrıştırıcısı |
| `src/Oksis.Domain/.../Entities/MebSourceDocument.cs` (değişir) | Künye alanları + `ApplyCover` |
| `src/Oksis.Infrastructure/.../Configurations/Academics/MebSourceDocumentConfiguration.cs` (değişir) | Sütun eşlemesi |
| `src/Oksis.Infrastructure/Persistence/Migrations/…_20260920_meb_document_cover.cs` (yeni) | Göç |
| `src/Oksis.Application/.../Internal/CurriculumSourceIngestor.cs` (değişir) | Kapağı okuyup yazar |
| `tests/Oksis.Application.UnitTests/.../Parsing/MebCoverParserTests.cs` (yeni) | Ayrıştırıcı testleri |
| `tests/Oksis.Infrastructure.IntegrationTests/Academics/CurriculumSourceCoverTests.cs` (yeni) | Uçtan uca |

`MebCoverParser` bilinçli olarak `MebChartParser`'dan ayrı: biri kapak künyesini, öteki ders
tablosunu okur. Tek dosyaya koymak 512 satırlık bir sınıfı 700'e çıkarır ve iki ayrı tablo
biçimini aynı yerde bakmaya zorlardı.

---

### Task 1: Belge türü kapaktan tanınır

**Files:**
- Create: `src/Oksis.Domain/Modules/Academics/Enums/MebDocumentKind.cs`
- Create: `src/Oksis.Application/Modules/Academics/CurriculumSource/Parsing/MebDocumentCover.cs`
- Create: `src/Oksis.Application/Modules/Academics/CurriculumSource/Parsing/MebCoverParser.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Academics/Parsing/MebCoverParserTests.cs`

**Interfaces:**
- Consumes: `PdfTextDocument`, `PdfTextPage`, `PdfTextWord` (`…/Parsing/PdfTextDocument.cs`);
  `MebChartParser.Fold(string)` (internal, aynı assembly);
  `MebChartFixture.Load(string)` (test yardımcısı).
- Produces: `MebDocumentKind` enum; `MebDocumentCover` record;
  `MebCoverParser.Parse(PdfTextDocument) → MebDocumentCover`.

- [ ] **Step 1: Write the failing test**

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Academics.CurriculumSource.Parsing;
using Oksis.Domain.Modules.Academics.Enums;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Academics.Parsing;

public sealed class MebCoverParserTests
{
    /// <summary>Sentetik tek satırlık kapak; gerçek fixture'ı olmayan türler için.</summary>
    private static PdfTextDocument CoverWith(params string[] words)
    {
        var placed = words
            .Select((text, i) => new PdfTextWord(text, i * 40, i * 40 + 35, 700, 712, true))
            .ToList();
        return new PdfTextDocument([new PdfTextPage(1, 595, 842, placed, [])]);
    }

    [Fact]
    public void Haftalik_ders_cizelgesi_karari_taninir()
    {
        var cover = MebCoverParser.Parse(MebChartFixture.Load("anadolu-2025-05.words.json"));

        cover.Kind.Should().Be(MebDocumentKind.WeeklyScheduleChart);
    }

    [Fact]
    public void Ogretmenlik_alanlari_karari_taninir()
    {
        var cover = MebCoverParser.Parse(CoverWith(
            "ÖĞRETMENLİK", "ALANLARI,", "ATAMA", "VE", "DERS", "OKUTMA", "ESASLARI"));

        cover.Kind.Should().Be(MebDocumentKind.TeachingFields);
    }

    [Fact]
    public void Taninmayan_kapak_Unknown_doner()
    {
        var cover = MebCoverParser.Parse(CoverWith("DERS", "KİTAPLARI", "TABLOSU"));

        cover.Kind.Should().Be(MebDocumentKind.Unknown);
    }

    [Fact]
    public void Bos_belge_Unknown_doner()
    {
        var cover = MebCoverParser.Parse(new PdfTextDocument([]));

        cover.Kind.Should().Be(MebDocumentKind.Unknown);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter MebCoverParserTests`
Expected: FAIL — `MebCoverParser` ve `MebDocumentKind` derlenmiyor.

- [ ] **Step 3: Write minimal implementation**

`MebDocumentKind.cs`:

```csharp
namespace Oksis.Domain.Modules.Academics.Enums;

/// <summary>
/// MEB belgesinin türü — kapak başlığından tanınır, kullanıcıya sorulmaz.
///
/// <para>Tür bilinmeden hangi ayrıştırıcının çalışacağı bilinemez. Kullanıcıya sormak,
/// yanlış seçimle bir kararın yanlış tabloya ayrıştırılmasına kapı bırakırdı.</para>
/// </summary>
public enum MebDocumentKind
{
    /// <summary>Kapak tanınmadı; belge saklanır ama ayrıştırılmaz.</summary>
    Unknown = 0,

    /// <summary>Haftalık ders çizelgesi kararı.</summary>
    WeeklyScheduleChart = 1,

    /// <summary>Öğretmenlik alanları, atama ve ders okutma esasları kararı.</summary>
    TeachingFields = 2,
}
```

`MebDocumentCover.cs`:

```csharp
using Oksis.Domain.Modules.Academics.Enums;

namespace Oksis.Application.Modules.Academics.CurriculumSource.Parsing;

/// <summary>
/// Kapak sayfasından okunan karar künyesi.
///
/// <para>Alanların hepsi opsiyoneldir: kapak okunamayan ya da beklenen etiketleri taşımayan
/// belgede uydurma değer yazmak, yanlış bir kaynak izi üretirdi. Eksik alan <c>null</c>
/// kalır ve taşıma o belgeyi reddeder (spec §9).</para>
/// </summary>
/// <param name="DecisionNumber">`2025/05` biçiminde; karar tarihinin yılı + kapaktaki sayı.</param>
public sealed record MebDocumentCover(
    MebDocumentKind Kind,
    string? DecisionNumber,
    DateOnly? DecisionDate,
    string? SubjectTitle,
    string? AcademicYearCode)
{
    public static MebDocumentCover Unknown { get; } =
        new(MebDocumentKind.Unknown, null, null, null, null);
}
```

`MebCoverParser.cs`:

```csharp
using Oksis.Domain.Modules.Academics.Enums;

namespace Oksis.Application.Modules.Academics.CurriculumSource.Parsing;

/// <summary>
/// Kararın KAPAK sayfasını okur (müfredat Dilim 6).
///
/// <para><b>Neden çizelge ayrıştırıcısından ayrı:</b> kapak bir ders tablosu değil, iki
/// sütunlu bir künye tablosudur. Aynı sınıfa koymak iki farklı tablo biçimini tek yerde
/// bakmaya zorlardı.</para>
/// </summary>
public static class MebCoverParser
{
    public static MebDocumentCover Parse(PdfTextDocument document)
    {
        var page = document.Pages.FirstOrDefault();
        if (page is null)
        {
            return MebDocumentCover.Unknown;
        }

        return new MebDocumentCover(DetectKind(page), null, null, null, null);
    }

    /// <summary>
    /// Kapak başlığından tür. Katlanmış ve boşluksuz metinde arama yapılır: MEB başlığı
    /// satıra bölerek yazıyor ve kelime sınırına güvenmek tanımayı kırılgan yapardı.
    /// </summary>
    private static MebDocumentKind DetectKind(PdfTextPage page)
    {
        var text = MebChartParser.Fold(
            string.Concat(page.Words.Where(w => w.IsHorizontal).Select(w => w.Text)));

        if (text.Contains("OGRETMENLIKALANLARI", StringComparison.Ordinal))
        {
            return MebDocumentKind.TeachingFields;
        }

        return text.Contains("HAFTALIKDERSCIZELGESI", StringComparison.Ordinal)
            ? MebDocumentKind.WeeklyScheduleChart
            : MebDocumentKind.Unknown;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter MebCoverParserTests`
Expected: PASS (4 test)

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Domain/Modules/Academics/Enums/MebDocumentKind.cs \
        src/Oksis.Application/Modules/Academics/CurriculumSource/Parsing/MebDocumentCover.cs \
        src/Oksis.Application/Modules/Academics/CurriculumSource/Parsing/MebCoverParser.cs \
        tests/Oksis.Application.UnitTests/Modules/Academics/Parsing/MebCoverParserTests.cs
git commit -m "feat(academics): belge türü kapak başlığından tanınır"
```

---

### Task 2: Karar numarası ve tarihi — "Önceki Karar" tuzağıyla birlikte

**Files:**
- Modify: `src/Oksis.Application/Modules/Academics/CurriculumSource/Parsing/MebCoverParser.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Academics/Parsing/MebCoverParserTests.cs`

**Interfaces:**
- Consumes: Task 1'in `MebCoverParser.Parse` ve `MebDocumentCover`'ı.
- Produces: `MebDocumentCover.DecisionNumber` (`"2025/05"`), `MebDocumentCover.DecisionDate`.

- [ ] **Step 1: Write the failing test**

Aynı test sınıfına ekle:

```csharp
    [Fact]
    public void Karar_numarasi_ve_tarihi_kapaktan_okunur()
    {
        var cover = MebCoverParser.Parse(MebChartFixture.Load("anadolu-2025-05.words.json"));

        cover.DecisionNumber.Should().Be("2025/05");
        cover.DecisionDate.Should().Be(new DateOnly(2025, 5, 9));
    }

    /// <summary>
    /// Kapakta İKİ tarih/sayı çifti var: kararın kendisi ve "Önceki Kararın Tarih ve Sayısı"
    /// (24/08/2023-37). Önceki karar yakalanırsa belge yanlış hukuki kaynağa bağlanır.
    /// </summary>
    [Fact]
    public void Onceki_kararin_tarihi_yakalanmaz()
    {
        var cover = MebCoverParser.Parse(MebChartFixture.Load("anadolu-2025-05.words.json"));

        cover.DecisionDate.Should().NotBe(new DateOnly(2023, 8, 24));
        cover.DecisionNumber.Should().NotBe("2023/37");
    }

    [Fact]
    public void Etiketsiz_kapakta_karar_bilgisi_bos_kalir()
    {
        var cover = MebCoverParser.Parse(CoverWith("HAFTALIK", "DERS", "ÇİZELGESİ"));

        cover.DecisionNumber.Should().BeNull();
        cover.DecisionDate.Should().BeNull();
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter MebCoverParserTests`
Expected: FAIL — `DecisionNumber` `null` geldi, `"2025/05"` bekleniyordu.

- [ ] **Step 3: Write minimal implementation**

`MebCoverParser.Parse` gövdesini değiştir ve yardımcıları ekle:

```csharp
    private const double RowTolerance = 1.5;

    public static MebDocumentCover Parse(PdfTextDocument document)
    {
        var page = document.Pages.FirstOrDefault();
        if (page is null)
        {
            return MebDocumentCover.Unknown;
        }

        var kind = DetectKind(page);
        var decisionDate = ReadDate(page, "TARIH");
        var decisionNumber = BuildDecisionNumber(ReadNumber(page, "SAYI"), decisionDate);

        return new MebDocumentCover(kind, decisionNumber, decisionDate, null, null);
    }

    /// <summary>
    /// Etiketin sağındaki değer hücresi. <b>Etiket, satırının en solundaki kelime olmalıdır</b> —
    /// "Önceki Kararın Tarih ve Sayısı" hücresindeki <c>Tarih</c> satırın ortasındadır (L=126,
    /// solunda <c>Önceki</c> var) ve bu kuralla elenir. <c>Tarihleri</c> ve <c>Sayısı</c> zaten
    /// katlanmış hâlde eşleşmez.
    /// </summary>
    private static string? ValueRightOf(PdfTextPage page, string foldedLabel)
    {
        var labels = page.Words
            .Where(w => w.IsHorizontal && MebChartParser.Fold(w.Text) == foldedLabel)
            .Where(w => IsLeftmostOnRow(page, w))
            .OrderByDescending(w => w.Bottom);

        foreach (var label in labels)
        {
            var value = page.Words
                .Where(w => w.IsHorizontal
                    && w.Left > label.Right
                    && Math.Abs(w.Bottom - label.Bottom) <= RowTolerance)
                .OrderBy(w => w.Left)
                .Select(w => w.Text.Trim())
                .FirstOrDefault();

            if (!string.IsNullOrEmpty(value))
            {
                return value;
            }
        }

        return null;
    }

    private static bool IsLeftmostOnRow(PdfTextPage page, PdfTextWord word) =>
        !page.Words.Any(w => w.IsHorizontal
            && Math.Abs(w.Bottom - word.Bottom) <= RowTolerance
            && w.Left < word.Left);

    private static DateOnly? ReadDate(PdfTextPage page, string foldedLabel) =>
        DateOnly.TryParseExact(
            ValueRightOf(page, foldedLabel) ?? string.Empty,
            "dd/MM/yyyy",
            System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.None,
            out var parsed)
            ? parsed
            : null;

    private static int? ReadNumber(PdfTextPage page, string foldedLabel) =>
        int.TryParse(ValueRightOf(page, foldedLabel), out var parsed) && parsed > 0
            ? parsed
            : null;

    /// <summary>
    /// Karar numarası <c>yıl/sayı</c> biçimindedir ve yıl kapakta ayrı yazmaz — karar
    /// tarihinden gelir. Tarih okunamadıysa numara da üretilmez; yılsız bir numara
    /// (<c>05</c>) başka yılların 5 sayılı kararlarıyla karışırdı.
    /// </summary>
    private static string? BuildDecisionNumber(int? number, DateOnly? date) =>
        number is { } n && date is { } d ? $"{d.Year}/{n:D2}" : null;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter MebCoverParserTests`
Expected: PASS (7 test)

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Application/Modules/Academics/CurriculumSource/Parsing/MebCoverParser.cs \
        tests/Oksis.Application.UnitTests/Modules/Academics/Parsing/MebCoverParserTests.cs
git commit -m "feat(academics): karar numarası ve tarihi kapaktan okunur"
```

---

### Task 3: Konu başlığı ve akademik yıl

**Files:**
- Modify: `src/Oksis.Application/Modules/Academics/CurriculumSource/Parsing/MebCoverParser.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Academics/Parsing/MebCoverParserTests.cs`

**Interfaces:**
- Consumes: Task 2'nin `ValueRightOf` / `IsLeftmostOnRow` yardımcıları; `PdfRule`
  (`IsHorizontal`, `IsVertical`, `CenterX`, `CenterY`).
- Produces: `MebDocumentCover.SubjectTitle`, `MebDocumentCover.AcademicYearCode`.

- [ ] **Step 1: Write the failing test**

```csharp
    [Fact]
    public void Konu_basligi_kapak_tablosunun_sag_hucresinden_okunur()
    {
        var cover = MebCoverParser.Parse(MebChartFixture.Load("anadolu-2025-05.words.json"));

        cover.SubjectTitle.Should().StartWith("Anadolu Lisesi Haftalık Ders Çizelgesi");
        cover.SubjectTitle.Should().Contain("Sosyal Bilimler Lisesi Haftalık Ders Çizelgesi");
        cover.SubjectTitle.Should().NotContain("Konu:");
        // Sol sütunun etiketleri sağ hücreye karışmamalı.
        cover.SubjectTitle.Should().NotContain("Kurulda Görüşülme");
    }

    [Fact]
    public void Akademik_yil_gövde_metninden_okunur()
    {
        var cover = MebCoverParser.Parse(MebChartFixture.Load("anadolu-2025-05.words.json"));

        cover.AcademicYearCode.Should().Be("2025-2026");
    }

    [Fact]
    public void Akademik_yil_yoksa_bos_kalir()
    {
        var cover = MebCoverParser.Parse(CoverWith("HAFTALIK", "DERS", "ÇİZELGESİ"));

        cover.AcademicYearCode.Should().BeNull();
        cover.SubjectTitle.Should().BeNull();
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter MebCoverParserTests`
Expected: FAIL — `SubjectTitle` `null`.

- [ ] **Step 3: Write minimal implementation**

`Parse` dönüşünü tamamla ve iki okuyucu ekle:

```csharp
        return new MebDocumentCover(
            kind, decisionNumber, decisionDate, ReadSubject(page), ReadAcademicYear(page));
```

```csharp
    /// <summary>
    /// Konu, künye tablosunun birleştirilmiş SAĞ hücresidir. Hücre sınırı kelimeden değil
    /// cetvel çizgisinden çözülür — emsal <see cref="CategoryBands"/> (<c>TB-217</c>):
    /// sol sınır <c>Konu:</c>'nun solundaki en yakın dikey çizgi, alt ve üst sınır tablonun
    /// en alttaki ve en üstteki yatay çizgileri. Yalnız X eşiğine bakmak, sol sütundaki
    /// "Kurulda Görüşülme Tarihleri" etiketini konuya karıştırırdı.
    /// </summary>
    private static string? ReadSubject(PdfTextPage page)
    {
        var label = page.Words.FirstOrDefault(
            w => w.IsHorizontal && MebChartParser.Fold(w.Text) == "KONU:");
        if (label is null)
        {
            return null;
        }

        var horizontal = page.Rules.Where(r => r.IsHorizontal).ToList();
        var cellLeft = page.Rules
            .Where(r => r.IsVertical && r.CenterX < label.Left)
            .Select(r => (double?)r.CenterX)
            .DefaultIfEmpty(null)
            .Max() ?? label.Left - 2;
        var cellBottom = horizontal.Count > 0 ? horizontal.Min(r => r.CenterY) : 0;
        var cellTop = horizontal.Count > 0 ? horizontal.Max(r => r.CenterY) : double.MaxValue;

        var words = page.Words
            .Where(w => w.IsHorizontal
                && w.Left > cellLeft
                && w.Bottom >= cellBottom
                && w.Bottom <= cellTop)
            .OrderByDescending(w => w.Bottom)
            .ThenBy(w => w.Left)
            .Select(w => w.Text.Trim())
            .ToList();

        var text = string.Join(' ', words).Replace("Konu:", string.Empty).Trim();
        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

    /// <summary>
    /// Akademik yıl gövde metnindedir: "…2025-2026 eğitim öğretim yılından itibaren…".
    /// Yalnız <c>\d{4}-\d{4}</c> aramak, karar metnindeki başka yıl aralıklarını da
    /// yakalardı; bu yüzden "eğitim" kelimesi kalıbın parçasıdır.
    /// </summary>
    private static string? ReadAcademicYear(PdfTextPage page)
    {
        var text = string.Join(' ', page.Words
            .Where(w => w.IsHorizontal)
            .OrderByDescending(w => w.Bottom)
            .ThenBy(w => w.Left)
            .Select(w => w.Text));

        var match = System.Text.RegularExpressions.Regex.Match(
            text,
            @"(\d{4}-\d{4})\s+eğitim",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

        return match.Success ? match.Groups[1].Value : null;
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter MebCoverParserTests`
Expected: PASS (10 test)

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Application/Modules/Academics/CurriculumSource/Parsing/MebCoverParser.cs \
        tests/Oksis.Application.UnitTests/Modules/Academics/Parsing/MebCoverParserTests.cs
git commit -m "feat(academics): konu başlığı ve akademik yıl kapaktan okunur"
```

---

### Task 4: Künye belgeyle saklanır

**Files:**
- Modify: `src/Oksis.Domain/Modules/Academics/Entities/MebSourceDocument.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Academics/MebSourceDocumentConfiguration.cs`
- Create: göç (`dotnet ef migrations add` üretir)
- Test: `tests/Oksis.Domain.UnitTests/Modules/Academics/MebSourceDocumentTests.cs`

**Interfaces:**
- Consumes: `MebDocumentKind` (Task 1).
- Produces: `MebSourceDocument.Kind`, `.DecisionNumber`, `.DecisionDate`, `.SubjectTitle`,
  `.AcademicYearCode` ve
  `MebSourceDocument.ApplyCover(MebDocumentKind, string?, DateOnly?, string?, string?)`.

- [ ] **Step 1: Write the failing test**

```csharp
using FluentAssertions;
using Oksis.Domain.Modules.Academics.Entities;
using Oksis.Domain.Modules.Academics.Enums;
using Oksis.Domain.Modules.Academics.Exceptions;
using Xunit;

namespace Oksis.Domain.UnitTests.Modules.Academics;

public sealed class MebSourceDocumentTests
{
    private static MebSourceDocument NewDocument() => MebSourceDocument.CreateUploaded(
        Guid.NewGuid(), new string('a', 64), "application/pdf", 1024,
        "curriculum", "key/1.pdf", "karar.pdf", DateTimeOffset.UnixEpoch);

    [Fact]
    public void ApplyCover_kunyeyi_yazar()
    {
        var document = NewDocument();

        document.ApplyCover(
            MebDocumentKind.WeeklyScheduleChart, "2025/05",
            new DateOnly(2025, 5, 9), "Anadolu Lisesi Haftalık Ders Çizelgesi", "2025-2026");

        document.Kind.Should().Be(MebDocumentKind.WeeklyScheduleChart);
        document.DecisionNumber.Should().Be("2025/05");
        document.DecisionDate.Should().Be(new DateOnly(2025, 5, 9));
        document.AcademicYearCode.Should().Be("2025-2026");
    }

    [Fact]
    public void Yeni_belge_Unknown_dogar()
    {
        NewDocument().Kind.Should().Be(MebDocumentKind.Unknown);
    }

    /// <summary>
    /// Künye kaynak izidir: bir kez yazılır. İkinci kez yazmak, yayımlanmış müfredatın
    /// dayandığı kararı sessizce değiştirmek olurdu.
    /// </summary>
    [Fact]
    public void ApplyCover_ikinci_kez_cagrilamaz()
    {
        var document = NewDocument();
        document.ApplyCover(MebDocumentKind.WeeklyScheduleChart, "2025/05", null, null, null);

        var act = () => document.ApplyCover(
            MebDocumentKind.TeachingFields, "2014/09", null, null, null);

        act.Should().Throw<AcademicsDomainException>()
            .Which.Message.Should().Contain("künyesi zaten yazılmış");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter MebSourceDocumentTests`
Expected: FAIL — `ApplyCover` yok.

- [ ] **Step 3: Write minimal implementation**

`MebSourceDocument` içine, `SupersedesDocumentId` satırının altına:

```csharp
    /// <summary>Kapaktan tanınan belge türü; tanınmadıysa <see cref="MebDocumentKind.Unknown"/>.</summary>
    public MebDocumentKind Kind { get; private set; } = MebDocumentKind.Unknown;

    /// <summary>`2025/05` biçiminde karar numarası; kapak okunamadıysa <c>null</c>.</summary>
    public string? DecisionNumber { get; private set; }

    public DateOnly? DecisionDate { get; private set; }

    /// <summary>Kapaktaki "Konu:" hücresi, ham hâliyle.</summary>
    public string? SubjectTitle { get; private set; }

    /// <summary>`2025-2026` biçiminde akademik yıl.</summary>
    public string? AcademicYearCode { get; private set; }

    private bool _coverApplied;

    /// <summary>
    /// Kapaktan okunan künyeyi yazar. <b>Bir kez</b> çağrılabilir: künye kaynak izinin
    /// kendisidir ve sonradan değişmesi, yayımlanmış müfredatın dayandığı kararı sessizce
    /// başkasıyla değiştirirdi.
    /// </summary>
    public void ApplyCover(
        MebDocumentKind kind,
        string? decisionNumber,
        DateOnly? decisionDate,
        string? subjectTitle,
        string? academicYearCode)
    {
        if (_coverApplied)
            throw new AcademicsDomainException(
                "MebSourceDocument.Cover.AlreadySet", "Belgenin künyesi zaten yazılmış.");

        Kind = kind;
        DecisionNumber = Normalize(decisionNumber);
        DecisionDate = decisionDate;
        SubjectTitle = Normalize(subjectTitle);
        AcademicYearCode = Normalize(academicYearCode);
        _coverApplied = true;
    }
```

Dosyanın başına `using Oksis.Domain.Modules.Academics.Enums;` ekle.

`MebSourceDocumentConfiguration` içine, `ETag` satırının altına:

```csharp
        builder.Property(x => x.Kind).HasConversion<string>().HasMaxLength(40).IsRequired();
        builder.Property(x => x.DecisionNumber).HasMaxLength(20);
        builder.Property(x => x.SubjectTitle).HasMaxLength(2000);
        builder.Property(x => x.AcademicYearCode).HasMaxLength(9);

        // Aynı kararın belgeleri birlikte okunur (belge başına tek set — spec §6.2).
        builder.HasIndex(x => x.DecisionNumber)
            .HasDatabaseName("ix_meb_source_documents_decision_number");
```

`_coverApplied` EF tarafından doldurulmaz; yüklenen bir varlıkta `false` başlar. Bunu
engellemek için `Kind`'a bakan bir muhafaza yeterlidir — `ApplyCover` gövdesindeki koşulu
şöyle yaz:

```csharp
        if (_coverApplied || Kind != MebDocumentKind.Unknown)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter MebSourceDocumentTests`
Expected: PASS (3 test)

- [ ] **Step 5: Göçü üret ve biçimlendir**

```bash
dotnet ef migrations add 20260920_meb_document_cover \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet format --include src/Oksis.Infrastructure/Persistence/Migrations/*meb_document_cover*
```

Üretilen göçü aç ve doğrula: beş sütun eklenmeli, `kind` için `defaultValue: "Unknown"`
olmalı (var olan satırlar `NOT NULL` kısıtını karşılasın diye). Yoksa elle ekle.

- [ ] **Step 6: Göçü uygula ve derle**

```bash
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet build
```

Expected: göç uygulanır, derleme temiz.

- [ ] **Step 7: Commit**

```bash
git add src/Oksis.Domain/Modules/Academics/Entities/MebSourceDocument.cs \
        src/Oksis.Infrastructure/Persistence/Configurations/Academics/MebSourceDocumentConfiguration.cs \
        src/Oksis.Infrastructure/Persistence/Migrations/ \
        tests/Oksis.Domain.UnitTests/Modules/Academics/MebSourceDocumentTests.cs
git commit -m "feat(academics): belge künyesi kaynak belgede saklanır"
```

---

### Task 5: Kapak, belgenin tek giriş yolunda okunur

**Files:**
- Modify: `src/Oksis.Application/Modules/Academics/CurriculumSource/Internal/CurriculumSourceIngestor.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Academics/CurriculumSourceIngestorCoverTests.cs`

**Interfaces:**
- Consumes: `MebCoverParser.Parse` (Task 1-3), `MebSourceDocument.ApplyCover` (Task 4),
  `IPdfTextExtractor.Extract(Stream) → Result<PdfTextDocument>`.
- Produces: kapak yazılmış `MebSourceDocument`; denetim izi eylemi
  `curriculum-source.document.cover-read`.

- [ ] **Step 1: Write the failing test**

```csharp
using FluentAssertions;
using NSubstitute;
using Oksis.Application.Modules.Academics.CurriculumSource.Abstractions;
using Oksis.Application.Modules.Academics.CurriculumSource.Parsing;
using Oksis.Domain.Modules.Academics.Enums;
using Oksis.Shared;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Academics;

/// <summary>
/// Kapak okuma, belgenin merkez deposuna girdiği TEK yolda olmalı: elle yükleme, tek belge
/// indirme ve kategori süpürme üçü de buradan geçer (<c>TB-212</c>).
/// </summary>
public sealed class CurriculumSourceIngestorCoverTests
{
    [Fact]
    public async Task Pdf_belgede_kunye_yazilir()
    {
        var harness = new IngestorHarness();
        harness.Extractor.Extract(Arg.Any<Stream>()).Returns(
            Result<PdfTextDocument>.Success(CoverFixtures.AnadoluKarari()));

        var result = await harness.IngestPdfAsync();

        result.IsSuccess.Should().BeTrue();
        var saved = harness.SavedDocument();
        saved.Kind.Should().Be(MebDocumentKind.WeeklyScheduleChart);
        saved.DecisionNumber.Should().Be("2025/05");
        saved.AcademicYearCode.Should().Be("2025-2026");
    }

    /// <summary>
    /// Taranmış belgede kapak okunamaz. Belge yine SAKLANIR — kaynak izi için değerlidir —
    /// ama künyesi boş kalır ve türü Unknown'dır (spec §9).
    /// </summary>
    [Fact]
    public async Task Metin_katmani_yoksa_belge_saklanir_kunye_bos_kalir()
    {
        var harness = new IngestorHarness();
        harness.Extractor.Extract(Arg.Any<Stream>()).Returns(
            Result<PdfTextDocument>.Failure(CurriculumSourceErrors.NoTextLayer));

        var result = await harness.IngestPdfAsync();

        result.IsSuccess.Should().BeTrue();
        var saved = harness.SavedDocument();
        saved.Kind.Should().Be(MebDocumentKind.Unknown);
        saved.DecisionNumber.Should().BeNull();
    }

    [Fact]
    public async Task Pdf_olmayan_belgede_ayristirici_hic_cagrilmaz()
    {
        var harness = new IngestorHarness();

        await harness.IngestAsync(contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        harness.Extractor.DidNotReceive().Extract(Arg.Any<Stream>());
    }
}
```

`IngestorHarness` ve `CoverFixtures` aynı dosyada özel yardımcılar olarak yazılır.
Kurulumun birebir emsali `tests/Oksis.Application.UnitTests/Modules/Academics/UploadSourceDocumentCommandHandlerTests.cs:27-59`:

```csharp
private readonly IApplicationDbContext _db = Substitute.For<IApplicationDbContext>();
private readonly ICurriculumSourceStorage _storage = Substitute.For<ICurriculumSourceStorage>();
private readonly IVirusScanner _scanner = Substitute.For<IVirusScanner>();
private readonly IAuditLogger _audit = Substitute.For<IAuditLogger>();
// yeni altıncı bağımlılık:
public readonly IPdfTextExtractor Extractor = Substitute.For<IPdfTextExtractor>();

private CurriculumSourceIngestor Build() =>
    new(_db, _storage, _scanner, Substitute.For<IDateTimeProvider>(), _audit, Extractor);
```

`SavedDocument()`, `_db.MebSourceDocuments.Add(...)` çağrısını yakalar — aynı dosyadaki
`:121` satırı bu kalıbı gösteriyor. `CoverFixtures.AnadoluKarari()` ise
`MebChartFixture.Load("anadolu-2025-05.words.json")` döndürür.

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter CurriculumSourceIngestorCoverTests`
Expected: FAIL — `IPdfTextExtractor` ingestor'ın kurucusunda yok.

- [ ] **Step 3: Write minimal implementation**

Kurucuya `IPdfTextExtractor extractor` ekle ve `db.MebSourceDocuments.Add(document);`
satırından ÖNCE şunu koy:

```csharp
        // Kapak, belge depoya girdiği anda okunur: künye taşımanın önkoşuludur ve her
        // taşımada yeniden ayrıştırmak aynı PDF'i defalarca açmak olurdu (spec §5.2).
        ApplyCoverIfReadable(document, buffer, contentType);
```

ve sınıfa:

```csharp
    /// <summary>
    /// Kapağı okur; okunamıyorsa belge künyesiz kalır. <b>Hata döndürmez</b>: taranmış ya da
    /// tanınmayan bir belge de saklanmaya değer (kaynak izi), yalnız taşınamaz (spec §9).
    /// </summary>
    private void ApplyCoverIfReadable(MebSourceDocument document, MemoryStream buffer, string contentType)
    {
        if (!string.Equals(contentType.Trim(), "application/pdf", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        buffer.Position = 0;
        var text = extractor.Extract(buffer);
        if (text.IsFailure)
        {
            return;
        }

        var cover = MebCoverParser.Parse(text.Value!);
        document.ApplyCover(
            cover.Kind, cover.DecisionNumber, cover.DecisionDate,
            cover.SubjectTitle, cover.AcademicYearCode);
    }
```

Denetim izi çağrısını künyeyi de taşıyacak şekilde genişlet:

```csharp
        await auditLogger.LogAsync(
            auditAction, nameof(MebSourceDocument), document.Id,
            after: new
            {
                document.Sha256, document.OriginalFileName, document.SourceUrl,
                document.SupersedesDocumentId,
                Kind = document.Kind.ToString(), document.DecisionNumber, document.AcademicYearCode,
            },
            cancellationToken: cancellationToken);
```

DI kaydı: `CurriculumSourceIngestor` zaten `IPdfTextExtractor` ile aynı konteynerde;
`DependencyInjection.cs` içinde ek kayıt gerekmiyor — derleme doğrular.

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter CurriculumSourceIngestorCoverTests`
Expected: PASS (3 test)

- [ ] **Step 5: Bütün birim paketini koştur**

Run: `./scripts/test-changed.sh`

Kurucuya altıncı parametre eklendiği için **üç dosya kesinlikle kırılır**; her birinde
`new CurriculumSourceIngestor(...)` çağrısına `Substitute.For<IPdfTextExtractor>()` eklenir:

- `tests/Oksis.Application.UnitTests/Modules/Academics/UploadSourceDocumentCommandHandlerTests.cs:59`
- `tests/Oksis.Application.UnitTests/Modules/Academics/Meb/FetchSourceDocumentCommandHandlerTests.cs`
- `tests/Oksis.Application.UnitTests/Modules/Academics/Meb/MebCatalogSweepJobTests.cs`

Bu sahte çıkarıcı varsayılan olarak `null` döner; `Extract` çağrısı yapılan testlerde
`Result<PdfTextDocument>.Failure(CurriculumSourceErrors.NoTextLayer)` döndürecek şekilde
kurulur — kapak okunamayan belge yolu zaten desteklenen davranıştır.

Expected: yeşil.

- [ ] **Step 6: Commit**

```bash
git add src/Oksis.Application/Modules/Academics/CurriculumSource/Internal/CurriculumSourceIngestor.cs \
        tests/Oksis.Application.UnitTests/Modules/Academics/CurriculumSourceIngestorCoverTests.cs
git commit -m "feat(academics): kapak belgenin tek giriş yolunda okunur"
```

---

### Task 6: Gerçek PDF ve gerçek veritabanıyla uçtan uca

**Files:**
- Create: `tests/Oksis.Infrastructure.IntegrationTests/Academics/CurriculumSourceCoverTests.cs`
- Test fixture: `tests/Oksis.Application.UnitTests/.../Fixtures/ilkogretim-2025-04.pdf` (var)

**Interfaces:**
- Consumes: Task 5'in tamamlanmış ingestor'ı; depodaki entegrasyon test taban sınıfı
  (`grep -rl "IntegrationTestBase\|CollectionDefinition" tests/Oksis.Infrastructure.IntegrationTests | head`).
- Produces: yok (doğrulama görevi).

> **Neden gerçek DB:** bellek içi sağlayıcı `NOT NULL` ve uzunluk kısıtlarını zorlamaz;
> DB'siz yazılan bir kapak testi ilk gerçek SQL koşusunda patlar
> ([[bellek-ici-test-db-kisitini-zorlamaz]]). `subject_title` 2000 karakterle sınırlı ve
> gerçek konu metni uzun.

- [ ] **Step 1: Write the failing test**

```csharp
[Fact]
public async Task Gercek_pdf_indirilince_kunye_veritabanina_yazilir()
{
    await using var content = File.OpenRead(FixturePath("ilkogretim-2025-04.pdf"));

    var result = await Ingestor.IngestAsync(
        content, "ilkogretim-2025-04.pdf", "application/pdf", content.Length,
        sourceUrl: "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2025_04/ilkogretim.pdf",
        auditAction: "curriculum-source.document.fetched",
        cancellationToken: default);

    result.IsSuccess.Should().BeTrue();

    var saved = await Db.MebSourceDocuments.AsNoTracking()
        .SingleAsync(d => d.Id == result.Value!.Id);

    saved.Kind.Should().Be(MebDocumentKind.WeeklyScheduleChart);
    saved.DecisionDate.Should().NotBeNull();
    saved.DecisionNumber.Should().MatchRegex(@"^\d{4}/\d{1,3}$");
    saved.AcademicYearCode.Should().MatchRegex(@"^\d{4}-\d{4}$");
}

/// <summary>Aynı içerik ikinci kez geldiğinde yeni kayıt açılmaz; künye de iki kez yazılmaz.</summary>
[Fact]
public async Task Ayni_belge_ikinci_kez_kunye_yazmaz()
{
    await using var first = File.OpenRead(FixturePath("ilkogretim-2025-04.pdf"));
    var one = await Ingestor.IngestAsync(first, "a.pdf", "application/pdf", first.Length,
        null, "curriculum-source.document.uploaded", default);

    await using var second = File.OpenRead(FixturePath("ilkogretim-2025-04.pdf"));
    var two = await Ingestor.IngestAsync(second, "a.pdf", "application/pdf", second.Length,
        null, "curriculum-source.document.uploaded", default);

    two.Value!.AlreadyExisted.Should().BeTrue();
    two.Value!.Id.Should().Be(one.Value!.Id);
    (await Db.MebSourceDocuments.CountAsync()).Should().Be(1);
}
```

Taban sınıf ve koleksiyon kurulumunun emsali
`tests/Oksis.Infrastructure.IntegrationTests/Academics/CurriculumSourceStorageTests.cs` —
aynı modülde, aynı depolama ve DB bağlamını kuran test.

`FixturePath`, birim test projesindeki fixture klasörüne göreli yol üretir; entegrasyon
projesine PDF'i **kopyalama**, `.csproj` içinde bağlantılı dosya olarak ekle:

```xml
<ItemGroup>
  <None Include="..\Oksis.Application.UnitTests\Modules\Academics\Parsing\Fixtures\ilkogretim-2025-04.pdf"
        Link="Fixtures\ilkogretim-2025-04.pdf" CopyToOutputDirectory="PreserveNewest" />
</ItemGroup>
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker compose up -d
./scripts/test-changed.sh --integration --filter CurriculumSourceCoverTests
```
Expected: FAIL (fixture yolu / bağlantı eksik).

- [ ] **Step 3: Implement**

`.csproj` bağlantısını ekle, `FixturePath` yardımcısını yaz, taban sınıfın kurulumunu
tamamla (`Ingestor` ve `Db` alanları).

- [ ] **Step 4: Run test to verify it passes**

```bash
./scripts/test-changed.sh --integration --filter CurriculumSourceCoverTests
```
Expected: PASS (2 test)

- [ ] **Step 5: Docker'ı kapat**

```bash
docker compose down
```

Bellek sıkıntısı nedeniyle Docker yalnız entegrasyon koşusunda açık kalır
([[docker-gerekmedikce-kapali]]).

- [ ] **Step 6: Commit**

```bash
git add tests/Oksis.Infrastructure.IntegrationTests/ 
git commit -m "test(academics): kapak künyesi gerçek PDF ve veritabanıyla doğrulandı"
```

---

## Dilim sonu doğrulaması

- [ ] `./scripts/test-changed.sh` yeşil
- [ ] `dotnet format` temiz
- [ ] Spec §11'in birinci açık maddesi ("kapağın okunabilirliği ölçülmedi") kapatılır:
      `meb-kaynakli-katalog-tasarimi.md` §11 güncellenir, ölçüm sonucu yazılır
- [ ] Sonraki dilim planı (Dilim 7 — program kataloğu) yazılmaya hazır

**Bu dilimde bilinçli olarak yapılmayan:** spec §9'un "kapak okunamayan belgenin taşınması
reddedilir" maddesi Dilim 8'e aittir — taşıma akışı orada yeniden yazılıyor. Bu dilim yalnız
künyeyi okur ve saklar; okunamadığında belge künyesiz kalır.

## Sonraki dilimler

| Plan | Teslim |
|---|---|
| Dilim 7 | Programlar belgeden doğar; seed silinir, `is_default` kalkar, okul açılışı program ister |
| Dilim 8 | Modal kalkar, belge başına tek set, tek düğmeyle toplu taşıma (`TB-218`) |
| Dilim 9 | Ders kataloğu yayımda doğar; `SubjectCategory` kalkar, vekâlet `Near` branşa bağlanır |
| Dilim 10 | Öğretmenlik alanları kararı → branş ve ders ↔ branş |
