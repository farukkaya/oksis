# Sınav Takvimi Faz 2a — Oturum ve Yerleşim — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Ayrıca zorunlu:** her web görevinden önce `oksis-ui/.claude/skills/handoff-web`, her mobil görevden önce `handoff-mobile` skill'i.

**Goal:** Kelebek sınav düzenini kurulabilir ve yayınlanabilir hâle getirmek: oturum varlığı, giren şubelerin sınıflarından türeyen derslikler, ders programından türeyen gözetmenler, oransal serpiştirmeyle üretilen oturma düzeni, oturum modunda yayın kapısı ve bunları gösteren ekranlar.

**Architecture:** Faz 1'in `Exams` modülüne üç yeni entity (`ExamSession`, `ExamRoom`, `ExamSeat`) ve `ScheduledExam`'e tek bir bağ alanı eklenir. Türetme ve yerleşim mantığı Application katmanında dört iç sınıfta yaşar (`ExamRoomDeriver`, `ExamInvigilatorDeriver`, `ExamSeatArranger`, `ExamSessionComposer`); `ExamSeatArranger` **saf**tır (veritabanı görmez), diğer üçü okur. Modül Timetable ve AcademicSessions'ı **yalnız okur**. İstemcide Faz 1'in `exam` dilimleri genişler; tek yeni ekran "oturum ayrıntısı"dır.

**Tech Stack:** .NET 10 · EF Core 10 · MSSQL 2022 · MediatR · FluentValidation · Mapster · xUnit + FluentAssertions + NSubstitute · Testcontainers · TypeScript strict · TanStack Query · Zod · Next.js 16 · Expo SDK 57

**Spec:** `oksis/docs/superpowers/specs/2026-09-09-sinav-takvimi-faz2a-design.md` (K-14…K-26, güncellenmiş EX-H/EX-S tablosu). Omurga: `.../2026-09-08-sinav-takvimi-modulu-design.md` — **çelişki hâlinde Faz 2a spec'i geçerlidir.**

---

## Global Constraints

Her görevin gereksinimleri bunları **örtük olarak** içerir. 1-14 Faz 1 planından devralınmıştır ve aynen geçerlidir; 15-20 bu faza özeldir.

1. **Tenant izolasyonu kırmızı çizgi.** Her yeni entity `TenantEntity` tabanı; global query filter ve `TenantSaveChangesInterceptor` devrede. `IgnoreQueryFilters()` gerekçesiz YASAK.
2. **Domain olayı işleyicileri sarmalayıcı tipe bağlanır:** `INotificationHandler<DomainEventNotification<TEvent>>` — düz `INotificationHandler<TEvent>` ÇALIŞMAZ.
3. **İhlal ve hata metinleri sunucuda ve Türkçe üretilir.** Biçimleme `CultureInfo.GetCultureInfo("tr-TR")` ile; süreç kültürüne güvenmek sunucuda İngilizce ay adı üretir.
4. **Kural sunucuda.** Ekranın uyguladığı ama sunucunun bilmediği kural yok sayılır. Her EX-H/EX-S kodunun sunucu tarafında testi vardır.
5. **AutoMapper YASAK** (Mapster) · **Repository wrapper YASAK** (`IApplicationDbContext`) · **Lazy loading YASAK** · **Domain'de EF/DataAnnotations YASAK** · **Controller'da DbContext YASAK** (`ISender`) · `async void`, `.Result`, `.Wait()` YASAK.
6. **Zaman = zil ızgarası.** `(DateOnly Date, int Period)`. Serbest `TimeOnly` aralığı YOK.
7. **Ders programı yazılmaz.** `ScheduleException` üretilmez, `LessonPlacement` değiştirilmez. Sınav yalnız okur.
8. **Wire şekli korunur (R11).** Alan adları İngilizce; id görünümlü string **string** kalır.
9. **Durum matrisi eksiksiz (R8).** Her ekran `loading / empty / error` + özel hâllerini gerçek query state'ine bağlar.
10. **Ham hex component'te yok.** Web `packages/ui/src/styles/exam.css`, mobil `apps/mobile/src/theme/tokens.ts`. **Yeni renk/ikon/font üretilmez**; ders tonu mevcut `SUBJECT_PALETTE` + `subjectColorIndex` ile gelir, ikinci palet açılmaz.
11. **Koyu tema teslim edilmez.**
12. **Türkçe arayüz metni, İngilizce identifier.** Sözlük: oturum = `examSession`, oturum dersliği = `examRoom`, sıra = `examSeat`, gözetmen = `invigilator`, serpiştirme = `seating`. Arayüzde **"sınav"**, asla "yazılı".
13. **Test koşumu:** `./scripts/test-changed.sh` (entegrasyon yalnız `--integration`). `oksis-ui` bitiş öncesi `npm run typecheck && npm run lint`.
14. **Commit:** `<type>(<scope>): türkçe açıklama` — sonda nokta yok, ≤90 karakter. Scope `oksis-api`'de `exams`, `oksis-ui`'de {`core`,`api`,`mobile`,`web`,`ui`}. İmza iki satır.
15. **Faz 1 davranışı değişmez.** `ExamSessionId` null olan her yol Faz 1'deki gibi çalışmalıdır. Her görev sonunda Faz 1'in `Exams` testleri de yeşil kalır; bu, "değiştirmedim" iddiasının tek kanıtıdır.
15b. **Sert ihlal istisna DEĞİL, `Result` döner.** Bu depoda `ExamRuleViolationException` **yoktur**. Faz 1 sert ihlali `Result<T>.Conflict(mesaj)` ile döndürür (emsal: `PlaceExamCommandHandler`, sert ihlalleri süzüp `Conflict` üretir) ve ihlal kaydı `ExamViolationDto(string Code, string Severity, string Message, Guid? ExamId, string? SectionName)`'dur — **`Severity` bir string**tir (`"hard"` / `"soft"`), enum değil. Komut testleri `Result` durumunu ölçer; kod düzeyinde iddia (`EX-H06` geldi mi) **denetleyici testinde** yapılır, komut testinde değil. *(Ön uçuş kararı R1, 2026-09-09 — plan ilk yazımında istisna varsayıyordu, koddan ölçülüp düzeltildi.)*
16. **`ExamSeatArranger` saftır.** `DbContext`, `IApplicationDbContext`, `CancellationToken` almaz; girdisi bellekteki kayıtlar, çıktısı bellekteki kayıtlardır. Sebebi: yerleşim kuralının yüzlerce senaryosu veritabanı olmadan ölçülebilsin.
17. **Yerleşim belirlenimcidir.** Aynı girdi hep aynı `SeatNo` dizisini verir. Sıralama anahtarlarının hiçbiri nullable bırakılmaz; `StudentProfile.StudentNumber` **nullable**'dır ve yedek anahtar zorunludur (Görev 2.2).
18. **Kayan noktalı sayı ile sıralama YASAK.** Serpiştirme anahtarı `(2i+1)/2n` kesridir ve **çapraz çarpımla tamsayı olarak** karşılaştırılır. `double` ile sıralamak farklı platformlarda farklı sonuç verebilir ve Kısıt 17'yi çiğner.
19. **Türetme elle müdahaleyi ezmez.** `IsManuallyAdded` derslik silinmez, `InvigilatorSource = Manual` gözetmen üzerine yazılmaz. Bu iki koşul her yeniden üretim testinde ayrıca ölçülür.
20. **Faz 2b kapsam dışı.** Kapı listesi / oturma planı / gözetmen çizelgesi çıktıları, gözetmen yoklaması ve Attendance bağı, görüş penceresi (`OpenReview`) bu planda **yazılmaz**.

---

## Tasarım kaynağı — GATE-1 GEÇTİ (2026-09-09)

Brief `uploads/oturum-ayrintisi-brief.md` olarak gönderildi ve teslim alındı. Kaynak dosyalar Claude Design `Oksis Layout v2` (`7d876f6c-70ee-4894-bac1-2be5c96dd34a`) projesindedir; **DesignSync** ile okunur (`method: "get_file"`), zip indirilmez.

| Dosya | Rol |
|---|---|
| `web/exam-session.jsx` | Oturum ayrıntısı ekranının tamamı — Görev 7.5'in kaynağı |
| `web/exam-data.jsx` | `EXAM_SESSIONS`, `examSessionDetail()`, `EXAM_INVIGILATOR_CANDIDATES`, `EXAM_ROOM_CANDIDATES` — sözleşmenin kaynağı |
| `web/exam-board.jsx` | Oturum kartı — Görev 7.4'ün kaynağı |
| `web/exam.css` | `.exs-*` sınıfları |
| `screenshots/es-1…es-8.png` | Dokuz durumun görüntüleri |

**Genişleyen diğer ekranlar** (yerleştirme, öğrenci/veli takvimi, ders programı etiketi) Faz 1'in teslim edilmiş tasarımını sürdürür; yeni görsel karar gerektirmez.

**Teslim planı iki noktada değiştirdi.** İkisi de tasarım incelemesinde çıktı ve düzeltildi:

1. **Görev 5.6 açıldı** — ekranın iki modali gözetmen/derslik aday listesi tüketiyor; plan bu uçları öngörmemişti.
2. **EX-H10 eklendi** (Görev 4.2) — ekran "gözetmen eksik" kartını istemcide türetiyordu, Kısıt 4'ü çiğniyordu. Kural sunucuya alındı.

Ayrıca üç küçük uyumsuzluk Görev 7.5'te sunucu lehine karara bağlandı (gerekçe eşiği 15, kapasite kodu EX-S06, gözetmen eksikliği sunucudan).

---

## Dosya yapısı

**`oksis-api`**

| Dosya | Sorumluluk |
|---|---|
| `Domain/Modules/Exams/Entities/ExamSession.cs` | Oturum: tarih, saat, ders, sürüm |
| `Domain/Modules/Exams/Entities/ExamRoom.cs` | Oturumun bir dersliği + gözetmeni |
| `Domain/Modules/Exams/Entities/ExamSeat.cs` | Öğrenci ↔ sıra |
| `Domain/Modules/Exams/Enums/InvigilatorSource.cs` | Türetildi / elle |
| `Domain/Modules/Exams/Events/ExamInvigilatorChangedEvent.cs` | Yayından sonra gözetmen değişimi |
| `Application/Modules/Exams/Internal/ExamSeatArranger.cs` | **Saf** serpiştirme algoritması |
| `Application/Modules/Exams/Internal/ExamRoomDeriver.cs` | Şube sınıflarından derslik kümesi |
| `Application/Modules/Exams/Internal/ExamInvigilatorDeriver.cs` | Programdan gözetmen |
| `Application/Modules/Exams/Internal/ExamSessionComposer.cs` | Üçünü çağıran tek giriş noktası |
| `Application/Modules/Exams/Internal/ExamSeatingReader.cs` | Serpiştirmenin girdisini toplayan okuma |
| `Application/Modules/Exams/Commands/…` | Sekiz komut (Dilim 3) |
| `Application/Modules/Exams/Queries/…` | Üç okuma (Dilim 5) |
| `Api/Controllers/V1/ExamsController.cs` | Yeni uçlar (mevcut dosya genişler) |

**`oksis-ui`**

| Dosya | Sorumluluk |
|---|---|
| `packages/core/src/exam/session.ts` | Oturum tipleri + saf yardımcılar |
| `packages/api/src/exam/session-endpoints.ts` · `session-queries.ts` | Uç ve query katmanı |
| `apps/web/features/exam/session-detail/*` | **Yeni ekran** |
| `apps/web/features/exam/board/*` | Pano oturum görünümü (mevcut genişler) |
| `apps/web/features/exam/place/*` | Yerleştirme oturum davranışı (mevcut genişler) |
| `apps/mobile/src/features/exam/components/exam-schedule-screen.tsx` | Derslik + sıra (mevcut genişler) |

---

# Dilim 1 — Alan modeli

### Görev 1.1: `ExamSession`, `ExamRoom`, `ExamSeat` entity'leri

**Files:**
- Create: `src/Oksis.Domain/Modules/Exams/Entities/ExamSession.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Entities/ExamRoom.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Entities/ExamSeat.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Enums/InvigilatorSource.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Exams/ExamSessionTests.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Exams/ExamRoomTests.cs`

**Interfaces:**
- Consumes: `TenantEntity`, `InvalidExamDataException`, `InvalidExamWindowStateException` (Faz 1, `Exams/Exceptions/`).
- Produces:
  - `ExamSession.Create(schoolId, examWindowId, subjectId, date, period, createdByPersonId)`
  - `ExamSession.Revise()` → `Version++`
  - `ExamRoom.Create(schoolId, examSessionId, roomId, isManuallyAdded)`
  - `ExamRoom.SetInvigilator(Guid teacherId, InvigilatorSource source)`
  - `ExamRoom.ClearInvigilator()`
  - `ExamRoom.Exclude()` / `.Include()` → `IsExcluded` (Görev 3.5 kullanır)
  - `ExamSeat.Create(schoolId, examRoomId, studentPersonId, seatNo)`
  - `ExamSeat.MarkSwapped()`
  - `enum InvigilatorSource { Derived = 1, Manual = 2 }`

**Neden `Id` atanmıyor:** `Entity` tabanı Id'yi kendi verir (Faz 1'de `Guid.CreateVersion7()` denendi, bu depoda yok).

- [ ] **Adım 1: Testi yaz**

```csharp
public sealed class ExamSessionTests
{
    private static ExamSession New(int period = 2) => ExamSession.Create(
        schoolId: Guid.NewGuid(), examWindowId: Guid.NewGuid(), subjectId: Guid.NewGuid(),
        date: new DateOnly(2027, 3, 9), period: period, createdByPersonId: Guid.NewGuid());

    [Fact]
    public void Should_StartAtVersionOne_When_Created()
    {
        New().Version.Should().Be(1);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(31)]
    public void Should_Reject_When_PeriodIsOutsideBellGrid(int period)
    {
        var act = () => New(period);
        act.Should().Throw<InvalidExamDataException>();
    }

    [Fact]
    public void Should_IncrementVersion_When_Revised()
    {
        var s = New();
        s.Revise();
        s.Revise();
        s.Version.Should().Be(3);
    }
}

public sealed class ExamRoomTests
{
    private static ExamRoom New(bool manual = false) => ExamRoom.Create(
        schoolId: Guid.NewGuid(), examSessionId: Guid.NewGuid(), roomId: Guid.NewGuid(),
        isManuallyAdded: manual);

    [Fact]
    public void Should_HaveNoInvigilator_When_Created()
    {
        var r = New();
        r.InvigilatorTeacherId.Should().BeNull("boş gözetmen bir DELİKTİR, yayını engeller");
        r.InvigilatorSource.Should().BeNull();
    }

    [Fact]
    public void Should_CarrySource_When_InvigilatorIsSet()
    {
        var r = New();
        var t = Guid.NewGuid();
        r.SetInvigilator(t, InvigilatorSource.Manual);
        r.InvigilatorTeacherId.Should().Be(t);
        r.InvigilatorSource.Should().Be(InvigilatorSource.Manual);
    }

    [Fact]
    public void Should_ClearBothFields_When_InvigilatorIsCleared()
    {
        var r = New();
        r.SetInvigilator(Guid.NewGuid(), InvigilatorSource.Derived);
        r.ClearInvigilator();
        r.InvigilatorTeacherId.Should().BeNull();
        r.InvigilatorSource.Should().BeNull("kaynak, gözetmen olmadan anlamsızdır");
    }
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "ExamSessionTests|ExamRoomTests"`
Expected: FAIL — `ExamSession` / `ExamRoom` tipi yok.

- [ ] **Adım 3: Entity'leri yaz**

```csharp
namespace Oksis.Domain.Modules.Exams.Entities;

/// <summary>
/// Kelebek oturumu: tek ders, tek ders saati, çok şube (K-14, K-22).
/// Sahibi yoktur (K-15) — sorumlu öğretmenler bağlı <see cref="ScheduledExam"/>
/// satırlarının sahiplerinden türer.
/// </summary>
public sealed class ExamSession : TenantEntity
{
    public Guid ExamWindowId { get; private set; }
    public Guid SubjectId { get; private set; }
    public DateOnly Date { get; private set; }
    public int Period { get; private set; }
    public Guid CreatedByPersonId { get; private set; }
    public int Version { get; private set; }

    private ExamSession() { }

    public static ExamSession Create(
        Guid schoolId, Guid examWindowId, Guid subjectId,
        DateOnly date, int period, Guid createdByPersonId)
    {
        // Zil ızgarası: ders saati 1..30. Serbest saat aralığı yok (Kısıt 6).
        if (period is < 1 or > 30)
        {
            throw new InvalidExamDataException("Ders saati zil çizelgesinin dışında.");
        }

        return new ExamSession
        {
            SchoolId = schoolId,
            ExamWindowId = examWindowId,
            SubjectId = subjectId,
            Date = date,
            Period = period,
            CreatedByPersonId = createdByPersonId,
            Version = 1,
        };
    }

    /// <summary>Yayın sonrası her değişiklikte çağrılır; Faz 1'in revizyon kalıbı.</summary>
    public void Revise() => Version++;
}
```

`ExamRoom` ve `ExamSeat` aynı kalıpla; `ExamRoom.SetInvigilator` iki alanı birlikte yazar, `ClearInvigilator` ikisini birlikte boşaltır.

**`ExamRoom` alanları:** `ExamSessionId`, `RoomId`, `InvigilatorTeacherId?`, `InvigilatorSource?`, `IsManuallyAdded`, `IsExcluded`. Son alan spec §3.3'te yoktu; Görev 3.5'in kararıdır (yöneticinin çıkardığı derslik yeniden türetmeyle geri gelmemeli) ve **burada, ilk göçte** doğar — sonradan eklemek ikinci bir göç demektir. Spec §3.3 Görev 8.2'de bu alanla güncellenir.

- [ ] **Adım 4: Testi koştur, yeşil olduğunu gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter "ExamSessionTests|ExamRoomTests"`
Expected: PASS

- [ ] **Adım 5: Commit**

```bash
git add src/Oksis.Domain/Modules/Exams tests/Oksis.Domain.UnitTests/Modules/Exams
git commit -m "feat(exams): oturum, oturum dersliği ve sıra entity'leri"
```

---

### Görev 1.2: `ScheduledExam` oturuma bağlanır

**Files:**
- Modify: `src/Oksis.Domain/Modules/Exams/Entities/ScheduledExam.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Exams/ScheduledExamTests.cs` (mevcut dosya genişler)

**Interfaces:**
- Produces: `ScheduledExam.ExamSessionId` (`Guid?`), `.AttachToSession(Guid sessionId)`, `.DetachFromSession()`

**Kısıt 15 burada ısırır:** mevcut `ScheduledExamTests`'in tamamı değişmeden yeşil kalmalıdır. Yeni alan `null` başlar ve Faz 1'in hiçbir metodu ona dokunmaz.

- [ ] **Adım 1: Testi yaz** (mevcut sınıfa ekle)

```csharp
[Fact]
public void Should_HaveNoSession_When_Created()
{
    New().ExamSessionId.Should().BeNull("ders saati modundaki satır oturuma ait değildir");
}

[Fact]
public void Should_Attach_And_Detach_Session()
{
    var e = New();
    var session = Guid.NewGuid();
    e.AttachToSession(session);
    e.ExamSessionId.Should().Be(session);
    e.DetachFromSession();
    e.ExamSessionId.Should().BeNull();
}

[Fact]
public void Should_Reject_When_AttachedTwiceToDifferentSessions()
{
    var e = New();
    e.AttachToSession(Guid.NewGuid());
    var act = () => e.AttachToSession(Guid.NewGuid());
    act.Should().Throw<InvalidExamWindowStateException>(
        "bir sınav aynı anda iki oturuma ait olamaz; taşımak için önce çözülür");
}

[Fact]
public void Should_KeepSessionLink_When_MarkedMoved()
{
    // Faz 1 davranışı korunur (Kısıt 15): taşıma bağı koparmaz.
    var e = New();
    e.PlaceOwnHour(new DateOnly(2027, 3, 9), 2, Guid.NewGuid());
    var session = Guid.NewGuid();
    e.AttachToSession(session);
    e.MarkMoved();
    e.ExamSessionId.Should().Be(session);
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter ScheduledExamTests`
Expected: FAIL — `ExamSessionId` yok.

- [ ] **Adım 3: Alanı ve iki metodu ekle**

```csharp
/// <summary>
/// Oturum çatısı (Faz 2a). Ders saati modundaki satırlarda <c>null</c>'dır ve
/// Faz 1'in hiçbir yolu bu alana dokunmaz (Kısıt 15).
/// </summary>
public Guid? ExamSessionId { get; private set; }

public void AttachToSession(Guid sessionId)
{
    if (ExamSessionId is not null && ExamSessionId != sessionId)
    {
        throw new InvalidExamWindowStateException(
            "Sınav zaten başka bir oturuma bağlı; önce mevcut oturumdan çıkarılmalı.");
    }

    ExamSessionId = sessionId;
}

public void DetachFromSession() => ExamSessionId = null;
```

- [ ] **Adım 4: Testi koştur — YENİ VE ESKİ birlikte**

Run: `dotnet test tests/Oksis.Domain.UnitTests --filter ScheduledExamTests`
Expected: PASS — eski testlerin tamamı dahil.

- [ ] **Adım 5: Commit**

```bash
git add src/Oksis.Domain/Modules/Exams/Entities/ScheduledExam.cs tests/Oksis.Domain.UnitTests/Modules/Exams/ScheduledExamTests.cs
git commit -m "feat(exams): planlı sınav oturum çatısına bağlanabiliyor"
```

---

### Görev 1.3: Kalıcılık — yapılandırmalar, göç, DbSet'ler

**Files:**
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Exams/ExamSessionConfiguration.cs`
- Create: `.../Exams/ExamRoomConfiguration.cs`
- Create: `.../Exams/ExamSeatConfiguration.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Exams/ScheduledExamConfiguration.cs`
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs`
- Modify: `src/Oksis.Application/Modules/Academics/Internal/SubjectUsageInspector.cs`
- Modify: `tests/Oksis.Tests/Architecture/SubjectUsageCoverageTests.cs` (muafiyet kaldırılır)
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Modules/Exams/ExamSessionPersistenceTests.cs`

**Ders silme kapısı burada kapanır (ön uçuş kararı R5).** `ExamSession.SubjectId` taşır, dolayısıyla TB-53 mimari bekçisi yeni bir tüketici görür. Görev 1.1 `DbSet<ExamSession>` henüz doğmadığı için bekleyen-tip listesiyle **geçici** bir muafiyet açtı; bu görev muafiyeti kaldırır ve `SubjectUsageInspector.FindBlockingUsagesAsync`'e oturum sorgusunu ekler — bir derse bağlı oturum varken ders silinemez.

Emsal Faz 1'dedir: aynı sınıf bulgu `TB-115` olarak yaşandı (`ScheduledExam` ve `DistributionConstraint` kapıya eklenmemişti). Muafiyeti açık bırakmak o bulguyu geri getirir. **Kapatılması bu görevin kabul ölçütüdür**, isteğe bağlı değil.

**Interfaces:**
- Produces: `IApplicationDbContext.ExamSessions`, `.ExamRooms`, `.ExamSeats` (`DbSet<>`)

**Dizinler (sorgu desenlerinden türetilmiştir, keyfi değil):**

| Tablo | Dizin | Neden |
|---|---|---|
| `ExamSessions` | `(SchoolId, ExamWindowId)` | Pano pencere başına oturumları listeler |
| `ExamSessions` | `(SchoolId, Date, Period)` | EX-H09 ve birleştirme adayı aynı hücreye bakar |
| `ExamRooms` | `(SchoolId, ExamSessionId)` | Oturum ayrıntısı |
| `ExamRooms` | `(SchoolId, RoomId)` — filtreli değil | EX-H09: derslik aynı saatte iki oturumda mı |
| `ExamSeats` | `(SchoolId, ExamRoomId)` | Derslik sıra listesi |
| `ExamSeats` | `(SchoolId, StudentPersonId)` | Öğrenci takvimi kendi sırasını okur |
| `ScheduledExams` | `(SchoolId, ExamSessionId)` | Oturumun şubeleri |

**Silme davranışı:** `ExamSession` silinince `ExamRoom` ve `ExamSeat` **cascade** silinir (oturumun parçalarıdır). `ScheduledExam` silinmez — `ExamSessionId` null'a döner (`DeleteBehavior.SetNull` **değil**, komut elle `DetachFromSession()` çağırır; Kısıt 5 gereği davranış domainde kalır, veritabanı sessizce yazmaz).

- [ ] **Adım 1: Entegrasyon testini yaz**

```csharp
[Fact]
public async Task Should_CascadeRoomsAndSeats_When_SessionIsDeleted()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSessionWithOneRoomAndTwoSeats(db);

    db.ExamSessions.Remove(session);
    await db.SaveChangesAsync(default);

    (await db.ExamRooms.CountAsync()).Should().Be(0);
    (await db.ExamSeats.CountAsync()).Should().Be(0);
}

[Fact]
public async Task Should_KeepScheduledExam_When_SessionIsDeleted()
{
    await using var db = await Fixture.CreateDbAsync();
    var (session, exam) = await SeedSessionWithOneScheduledExam(db);

    exam.DetachFromSession();
    db.ExamSessions.Remove(session);
    await db.SaveChangesAsync(default);

    var kept = await db.ScheduledExams.SingleAsync();
    kept.ExamSessionId.Should().BeNull("sınav satırı oturumun parçası değildir, yerleşimi korunur");
    kept.Date.Should().NotBeNull();
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter ExamSessionPersistenceTests`
Expected: FAIL — tablo yok.

- [ ] **Adım 3: Yapılandırmaları yaz, göçü üret**

```bash
dotnet ef migrations add 20260910_exams_faz2a_sessions \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```

- [ ] **Adım 4: Göçü geliştirme veritabanına uygula**

```bash
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```

**Bu adım atlanamaz.** API göçleri kendi uygulamıyor; Faz 1'de atlandığı için bütün uçlar 403 döndü ve bir tur kaybedildi.

- [ ] **Adım 5: Testi koştur, yeşil olduğunu gör**

Run: `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter ExamSessionPersistenceTests`
Expected: PASS

- [ ] **Adım 6: Commit**

```bash
git add src/Oksis.Infrastructure src/Oksis.Application/Common/Abstractions tests/Oksis.Infrastructure.IntegrationTests
git commit -m "feat(exams): oturum tabloları, dizinler ve göç"
```

---

# Dilim 2 — Türetme ve yerleşim

### Görev 2.1: `ExamSeatArranger` — oransal serpiştirme (saf)

Bu görev planın **çekirdeğidir**. Algoritma veritabanı görmez (Kısıt 16), kayan nokta kullanmaz (Kısıt 18) ve belirlenimcidir (Kısıt 17).

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Internal/ExamSeatArranger.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/ExamSeatArrangerTests.cs`

**Interfaces:**
- Produces:

```csharp
internal sealed record SeatingSection(Guid ClassRoomId, string SortKey, IReadOnlyList<Guid> StudentPersonIds);
internal sealed record SeatingRoom(Guid RoomId, string SortKey, int Capacity);
internal sealed record SeatAssignment(Guid RoomId, Guid StudentPersonId, int SeatNo);

internal static class ExamSeatArranger
{
    public static IReadOnlyList<SeatAssignment> Arrange(
        IReadOnlyList<SeatingSection> sections,
        IReadOnlyList<SeatingRoom> rooms);
}
```

`SortKey` çağıranın ürettiği sabit dizedir (Görev 2.2'de `GradeLevel.DisplayOrder` + `ClassRoom.Section`'dan). Sıralama `StringComparer.Ordinal` iledir — kültüre bağlı sıralama platformdan platforma değişir ve Kısıt 17'yi çiğner.

**Algoritma:**

1. Şubeler `SortKey` ile sıralanır. Öğrenciler şube içinde **çağıranın verdiği sırada** kalır (Görev 2.2 okul numarasıyla sıralar).
2. Her öğrenciye kesir verilir: şubesinin `i`. öğrencisi için `(2i+1) / (2n)`, `n` = şube mevcudu.
3. Bütün öğrenciler bu kesre göre sıralanır. Karşılaştırma **çapraz çarpımla**: `(2i+1) * n_b` ile `(2j+1) * n_a`. Eşitlikte şube `SortKey`'i, sonra şube içi sıra.
4. Derslik payları: `pay(i) = floor(N * cap_i / capTotal)`; artan öğrenciler **en büyük kesirli paya** sahip dersliklere birer birer verilir (largest-remainder). Eşitlikte derslik `SortKey`'i.
5. Sıralı öğrenci listesi derslik sırasına göre dilimlenir; `SeatNo` her derslikte 1'den başlar.

**Sınır durumları:** `rooms` boşsa boş liste döner (çağıran "derslik eksik" uyarısını üretir). `capTotal == 0` ise boş liste. Toplam mevcut toplam kapasiteyi aşarsa yerleşim **yine tamamlanır** — pay formülü oransal aştırır, fazlalık tek dersliğe yığılmaz (K-23).

- [ ] **Adım 1: Testi yaz**

```csharp
public sealed class ExamSeatArrangerTests
{
    private static SeatingSection Section(string key, int count) =>
        new(Guid.NewGuid(), key, Enumerable.Range(0, count).Select(_ => Guid.NewGuid()).ToList());

    private static SeatingRoom Room(string key, int capacity) => new(Guid.NewGuid(), key, capacity);

    /// <summary>Şubeye göre gruplanmış sıra dizisini "AABC" gibi okunur bir dizeye çevirir.</summary>
    private static string Pattern(IReadOnlyList<SeatAssignment> seats, IReadOnlyList<SeatingSection> sections, Guid roomId)
    {
        var owner = sections.SelectMany(s => s.StudentPersonIds.Select(id => (id, s.SortKey)))
                            .ToDictionary(x => x.id, x => x.SortKey);
        return string.Concat(seats.Where(s => s.RoomId == roomId)
                                  .OrderBy(s => s.SeatNo)
                                  .Select(s => owner[s.StudentPersonId]));
    }

    [Fact]
    public void Should_Alternate_When_SectionsAreEqualSized()
    {
        var sections = new[] { Section("A", 4), Section("B", 4), Section("C", 4) };
        var rooms = new[] { Room("1", 12) };

        var seats = ExamSeatArranger.Arrange(sections, rooms);

        Pattern(seats, sections, rooms[0].RoomId).Should().Be("ABCABCABCABC",
            "eşit mevcutta oransal serpiştirme düz dönüşümlü dağıtımla birebir aynıdır");
    }

    [Fact]
    public void Should_SpreadSmallSection_When_SizesAreVeryUneven()
    {
        // Düz dönüşümlü dağıtım burada B'yi ilk iki sıraya sıkıştırır ve kuyrukta 8 tane A bırakır.
        var sections = new[] { Section("A", 10), Section("B", 2) };
        var rooms = new[] { Room("1", 12) };

        var pattern = Pattern(ExamSeatArranger.Arrange(sections, rooms), sections, rooms[0].RoomId);

        pattern.Should().Be("AAABAAAABAAA");
        pattern.IndexOf('B').Should().BeGreaterThan(1, "küçük şube başa yığılmamalı");
        pattern.LastIndexOf('B').Should().BeLessThan(pattern.Length - 2, "sona da yığılmamalı");
    }

    [Fact]
    public void Should_NotStackTail_When_OneSectionIsLarger()
    {
        // Regresyon: 30/28/32'de düz dönüşümlü dağıtım son dersliğe 22 ardışık C bırakıyordu.
        var sections = new[] { Section("A", 30), Section("B", 28), Section("C", 32) };
        var rooms = new[] { Room("1", 30), Room("2", 30), Room("3", 30) };

        var seats = ExamSeatArranger.Arrange(sections, rooms);
        var last = Pattern(seats, sections, rooms[2].RoomId);

        LongestRun(last).Should().BeLessThanOrEqualTo(2,
            "hiçbir dersliğte aynı şubeden ikiden uzun ardışık dizi olmamalı");
    }

    [Fact]
    public void Should_BeDeterministic_When_ArrangedTwice()
    {
        var sections = new[] { Section("A", 17), Section("B", 23), Section("C", 11) };
        var rooms = new[] { Room("1", 20), Room("2", 20), Room("3", 20) };

        var first = ExamSeatArranger.Arrange(sections, rooms);
        var second = ExamSeatArranger.Arrange(sections, rooms);

        second.Should().BeEquivalentTo(first, o => o.WithStrictOrdering());
    }

    [Fact]
    public void Should_SplitProportionally_When_CapacitiesDiffer()
    {
        var sections = new[] { Section("A", 30), Section("B", 30) };
        var rooms = new[] { Room("1", 40), Room("2", 20) };

        var seats = ExamSeatArranger.Arrange(sections, rooms);

        seats.Count(s => s.RoomId == rooms[0].RoomId).Should().Be(40);
        seats.Count(s => s.RoomId == rooms[1].RoomId).Should().Be(20);
    }

    [Fact]
    public void Should_OverflowProportionally_When_StudentsExceedCapacity()
    {
        // K-23: kapasite aşımı yerleşimi DURDURMAZ, fazlalık tek dersliğe yığılmaz.
        var sections = new[] { Section("A", 50), Section("B", 50) };
        var rooms = new[] { Room("1", 30), Room("2", 30), Room("3", 30) };

        var seats = ExamSeatArranger.Arrange(sections, rooms);

        seats.Should().HaveCount(100);
        foreach (var room in rooms)
        {
            seats.Count(s => s.RoomId == room.RoomId).Should().BeInRange(33, 34);
        }
    }

    [Fact]
    public void Should_NumberSeatsFromOne_InEachRoom()
    {
        var sections = new[] { Section("A", 6) };
        var rooms = new[] { Room("1", 3), Room("2", 3) };

        var seats = ExamSeatArranger.Arrange(sections, rooms);

        foreach (var room in rooms)
        {
            seats.Where(s => s.RoomId == room.RoomId).Select(s => s.SeatNo)
                 .Should().BeEquivalentTo(new[] { 1, 2, 3 }, o => o.WithStrictOrdering());
        }
    }

    [Fact]
    public void Should_ReturnEmpty_When_NoRooms()
    {
        ExamSeatArranger.Arrange([Section("A", 10)], []).Should().BeEmpty();
    }

    private static int LongestRun(string s)
    {
        var best = 0; var run = 0; char? prev = null;
        foreach (var c in s) { run = c == prev ? run + 1 : 1; prev = c; best = Math.Max(best, run); }
        return best;
    }
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter ExamSeatArrangerTests`
Expected: FAIL — `ExamSeatArranger` yok.

- [ ] **Adım 3: Algoritmayı yaz**

```csharp
internal static class ExamSeatArranger
{
    public static IReadOnlyList<SeatAssignment> Arrange(
        IReadOnlyList<SeatingSection> sections,
        IReadOnlyList<SeatingRoom> rooms)
    {
        var orderedRooms = rooms.OrderBy(r => r.SortKey, StringComparer.Ordinal).ToList();
        var totalCapacity = orderedRooms.Sum(r => (long)r.Capacity);
        if (orderedRooms.Count == 0 || totalCapacity == 0)
        {
            return [];
        }

        // 1-3: oransal serpiştirme. Kesir (2i+1)/(2n) ÇAPRAZ ÇARPIMLA karşılaştırılır;
        // double ile sıralamak platformdan platforma farklı sonuç verebilir (Kısıt 18).
        var ordered = sections
            .OrderBy(s => s.SortKey, StringComparer.Ordinal)
            .SelectMany(s => s.StudentPersonIds.Select((id, i) => new
            {
                StudentPersonId = id,
                Numerator = 2L * i + 1,
                Denominator = 2L * s.StudentPersonIds.Count,
                s.SortKey,
                Index = i,
            }))
            .OrderBy(x => x, Comparer<dynamic>.Create((a, b) =>
            {
                var cross = (a.Numerator * b.Denominator).CompareTo(b.Numerator * a.Denominator);
                if (cross != 0) { return cross; }
                var key = string.CompareOrdinal(a.SortKey, b.SortKey);
                return key != 0 ? key : a.Index.CompareTo(b.Index);
            }))
            .Select(x => x.StudentPersonId)
            .ToList();

        // 4: largest-remainder. Artan öğrenci, kapasitesine oranla en az yüklenmiş dersliğe gider.
        var shares = ComputeShares(ordered.Count, orderedRooms, totalCapacity);

        // 5: dilimle.
        var result = new List<SeatAssignment>(ordered.Count);
        var cursor = 0;
        for (var r = 0; r < orderedRooms.Count; r++)
        {
            for (var seat = 1; seat <= shares[r]; seat++)
            {
                result.Add(new SeatAssignment(orderedRooms[r].RoomId, ordered[cursor++], seat));
            }
        }

        return result;
    }
}
```

> **Uygulayıcıya not:** yukarıdaki `Comparer<dynamic>` yalnız okunabilirlik içindir; gerçek kodda anonim tip yerine `private readonly record struct SeatKey(Guid StudentPersonId, long Numerator, long Denominator, string SortKey, int Index)` tanımlayıp `IComparer<SeatKey>` yazın. `dynamic` bu depoda yasaktır ve derleme uyarısı üretir.

- [ ] **Adım 4: Testi koştur, yeşil olduğunu gör**

Run: `dotnet test tests/Oksis.Application.UnitTests --filter ExamSeatArrangerTests`
Expected: PASS — dokuz testin tamamı.

- [ ] **Adım 5: Commit**

```bash
git add src/Oksis.Application/Modules/Exams/Internal/ExamSeatArranger.cs tests/Oksis.Application.UnitTests/Modules/Exams/ExamSeatArrangerTests.cs
git commit -m "feat(exams): oransal serpiştirme algoritması — kuyrukta şube yığılması yok"
```

---

### Görev 2.2: `ExamSeatingReader` — serpiştirmenin girdisi

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Internal/ExamSeatingReader.cs`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Exams/ExamSeatingReaderTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext`, `SeatingSection`, `SeatingRoom` (Görev 2.1).
- Produces: `ExamSeatingReader.ReadAsync(Guid schoolId, Guid sessionId, CancellationToken) -> (IReadOnlyList<SeatingSection>, IReadOnlyList<SeatingRoom>)`

**Sıralama anahtarları — Kısıt 17'nin uygulandığı yer:**

| Ne | Anahtar | Yedek |
|---|---|---|
| Şube sırası | `GradeLevel.DisplayOrder` (5 hane, sıfır dolgulu) + `ClassRoom.Section` | — (ikisi de zorunlu) |
| Şube içi öğrenci | `StudentProfile.StudentNumber` | **`null` ise en sona**, sonra `PersonId` (Guid, ordinal) |
| Derslik sırası | Şubenin `SortKey`'i; elle eklenen derslikler `"~"` önekiyle **sona** | `Room.Code` |

`StudentNumber` **nullable**'dır. Yedek anahtar olmadan iki numarasız öğrencinin sırası veritabanının döndürme sırasına kalır ve yerleşim belirlenimci olmaktan çıkar.

Öğrenci kümesi: `ClassRoomStudent` üzerinden **`LeftAt == null`** olanlar (şubeden ayrılan öğrenci sınava girmez).

- [ ] **Adım 1: Entegrasyon testini yaz**

```csharp
[Fact]
public async Task Should_OrderStudentsBySchoolNumber_And_PutNumberlessLast()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await Seed(db, section: "9-A", students:
    [
        ("Zeynep", "105"), ("Ali", "101"), ("Numarasız", null), ("Berk", "103"),
    ]);

    var (sections, _) = await new ExamSeatingReader(db).ReadAsync(SchoolId, session.Id, default);

    sections.Single().StudentPersonIds.Should().HaveCount(4);
    (await NamesInOrder(db, sections.Single())).Should()
        .ContainInOrder("Ali", "Berk", "Zeynep", "Numarasız");
}

[Fact]
public async Task Should_ExcludeStudent_When_LeftTheSection()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedWithOneLeftStudent(db);

    var (sections, _) = await new ExamSeatingReader(db).ReadAsync(SchoolId, session.Id, default);

    sections.Single().StudentPersonIds.Should().HaveCount(1, "ayrılan öğrenci sınava girmez");
}

[Fact]
public async Task Should_PutManuallyAddedRoomsLast()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedWithManualRoom(db);

    var (_, rooms) = await new ExamSeatingReader(db).ReadAsync(SchoolId, session.Id, default);

    rooms.Last().SortKey.Should().StartWith("~", "elle eklenen derslik sona gelir");
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Run: `./scripts/test-changed.sh --integration --filter ExamSeatingReaderTests`
Expected: FAIL

- [ ] **Adım 3: Okuyucuyu yaz**

Tek sorgu çiftinde: (a) oturumun `ScheduledExam` satırlarından şube kimlikleri → `ClassRoom` + `GradeLevel` + `ClassRoomStudent` + `StudentProfile` join'i, (b) `ExamRoom` + `Room` join'i. Gruplama bellekte.

**`AsNoTracking()` KULLANMA.** Bu okuyucunun çıktısı `ExamSessionComposer` tarafından yazma yolunda tüketilir; Faz 1'de takipsiz okuma bir JOIN üzerinden yayıldı ve `SaveChanges` sessizce hiçbir şey yazmadı. Salt okuma yolları ayrı sorgu yazar.

- [ ] **Adım 4: Testi koştur, yeşil olduğunu gör**

Run: `./scripts/test-changed.sh --integration --filter ExamSeatingReaderTests`
Expected: PASS

- [ ] **Adım 5: Commit**

```bash
git add src/Oksis.Application/Modules/Exams/Internal/ExamSeatingReader.cs tests/Oksis.Application.IntegrationTests
git commit -m "feat(exams): serpiştirme girdisi — numarasız öğrenci için belirlenimci yedek anahtar"
```

---

### Görev 2.3: `ExamRoomDeriver` — şube sınıflarından derslik kümesi

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Internal/ExamRoomDeriver.cs`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Exams/ExamRoomDeriverTests.cs`

**Interfaces:**
- Produces: `ExamRoomDeriver.DeriveAsync(Guid schoolId, Guid sessionId, CancellationToken) -> DerivationResult`
  where `DerivationResult(IReadOnlyList<ExamRoom> Rooms, IReadOnlyList<Guid> ClassRoomsWithoutRoom)`

**Kural (K-18, Kısıt 19):**
1. Giren şubelerin `ClassRoom.RoomId`'leri toplanır; `null` olanlar `ClassRoomsWithoutRoom`'a düşer ve çağıran uyarı üretir (K-26 köprüsü).
2. Mevcut `ExamRoom` satırlarından `IsManuallyAdded = true` olanlar **korunur**.
3. Türetilen kümede olmayan ve elle eklenmemiş `ExamRoom` satırları **silinir** (şube oturumdan çıkmıştır).
4. Aynı `RoomId` iki şubeden gelirse tek satır olur.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_KeepManuallyAddedRoom_When_Rederived()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSession(db, sections: ["9-A", "9-B"]);
    db.ExamRooms.Add(ExamRoom.Create(SchoolId, session.Id, ConferenceHallId, isManuallyAdded: true));
    await db.SaveChangesAsync(default);

    await new ExamRoomDeriver(db).DeriveAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    db.ExamRooms.Where(r => r.ExamSessionId == session.Id)
      .Should().Contain(r => r.RoomId == ConferenceHallId, "Kısıt 19: türetme elle eklemeyi ezmez");
}

[Fact]
public async Task Should_RemoveDerivedRoom_When_SectionLeavesSession()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSession(db, sections: ["9-A", "9-B"]);
    await new ExamRoomDeriver(db).DeriveAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    await DetachSection(db, session, "9-B");
    await new ExamRoomDeriver(db).DeriveAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    db.ExamRooms.Count(r => r.ExamSessionId == session.Id).Should().Be(1);
}

[Fact]
public async Task Should_ReportSection_When_ClassRoomHasNoRoom()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSessionWithRoomlessSection(db);

    var result = await new ExamRoomDeriver(db).DeriveAsync(SchoolId, session.Id, default);

    result.ClassRoomsWithoutRoom.Should().HaveCount(1, "TB-120 köprüsü: yönetici elle ekleyecek");
}

[Fact]
public async Task Should_CreateSingleRoom_When_TwoSectionsShareOne()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedTwoSectionsSharingOneRoom(db);

    var result = await new ExamRoomDeriver(db).DeriveAsync(SchoolId, session.Id, default);

    result.Rooms.Should().HaveCount(1);
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Run: `./scripts/test-changed.sh --integration --filter ExamRoomDeriverTests`
Expected: FAIL

- [ ] **Adım 3: Türeticiyi yaz** — yukarıdaki dört kuralı sırayla uygular; `SaveChanges` çağırmaz (çağıran birim işlemi yönetir).

- [ ] **Adım 4: Testi koştur, yeşil olduğunu gör**

Run: `./scripts/test-changed.sh --integration --filter ExamRoomDeriverTests`
Expected: PASS

- [ ] **Adım 5: Commit**

```bash
git commit -am "feat(exams): oturum derslikleri şube sınıflarından türüyor"
```

---

### Görev 2.4: `ExamInvigilatorDeriver` — programdan gözetmen

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Internal/ExamInvigilatorDeriver.cs`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Exams/ExamInvigilatorDeriverTests.cs`

**Interfaces:**
- Produces: `ExamInvigilatorDeriver.DeriveAsync(Guid schoolId, Guid sessionId, CancellationToken) -> IReadOnlyList<Guid> RoomsWithoutInvigilator`

**Kural (K-19, K-20, Kısıt 19):**
1. Her `ExamRoom` için, o dersliğin **sahibi şube** bulunur (`ClassRoom.RoomId == ExamRoom.RoomId`).
2. O şubenin oturumun `Date`/`Period`'undaki `LessonPlacement`'ı okunur — **yalnız canlı program** (`IsActive && IsReserving`), Faz 1'in `ExamExpectationReader`'ıyla aynı yüklem. Üçüncü bir "kim neyi okutuyor" tanımı açılmaz.
3. Çıkan `TeacherId`, `InvigilatorSource.Derived` ile yazılır.
4. `InvigilatorSource.Manual` olan derslik **atlanır** (Kısıt 19).
5. Öğretmen çıkmayan derslik (`IsManuallyAdded` olanlar dahil — sahibi şube yok) `RoomsWithoutInvigilator`'a düşer.
6. Aynı öğretmen iki dersliğe düşerse (birleşik ders) **ikincisi delik bırakılır** — EX-H06 sert kuralı yazma anında ısırmasın diye türetme kendini engeller; yönetici birini elle doldurur.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_DeriveTeacherFromLiveSchedule()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSession(db, date: Tuesday, period: 2, sections: ["9-A"]);
    await GivePlacement(db, "9-A", Tuesday, period: 2, teacher: AyseId, isActive: true);

    await new ExamInvigilatorDeriver(db).DeriveAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    var room = await db.ExamRooms.SingleAsync(r => r.ExamSessionId == session.Id);
    room.InvigilatorTeacherId.Should().Be(AyseId);
    room.InvigilatorSource.Should().Be(InvigilatorSource.Derived);
}

[Fact]
public async Task Should_IgnoreArchivedSchedule()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSession(db, date: Tuesday, period: 2, sections: ["9-A"]);
    await GivePlacement(db, "9-A", Tuesday, 2, teacher: EskiId, isActive: false);

    var holes = await new ExamInvigilatorDeriver(db).DeriveAsync(SchoolId, session.Id, default);

    holes.Should().HaveCount(1, "arşiv program görevlendirme sayılmaz");
}

[Fact]
public async Task Should_NotOverwrite_When_InvigilatorWasSetManually()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSession(db, date: Tuesday, period: 2, sections: ["9-A"]);
    await GivePlacement(db, "9-A", Tuesday, 2, teacher: AyseId, isActive: true);
    var room = await db.ExamRooms.SingleAsync();
    room.SetInvigilator(MehmetId, InvigilatorSource.Manual);
    await db.SaveChangesAsync(default);

    await new ExamInvigilatorDeriver(db).DeriveAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    (await db.ExamRooms.SingleAsync()).InvigilatorTeacherId.Should().Be(MehmetId, "Kısıt 19");
}

[Fact]
public async Task Should_LeaveSecondRoomEmpty_When_SameTeacherDerivedTwice()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSession(db, date: Tuesday, period: 2, sections: ["9-A", "9-B"]);
    await GivePlacement(db, "9-A", Tuesday, 2, teacher: AyseId, isActive: true);
    await GivePlacement(db, "9-B", Tuesday, 2, teacher: AyseId, isActive: true);

    var holes = await new ExamInvigilatorDeriver(db).DeriveAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    holes.Should().HaveCount(1, "EX-H06: bir öğretmen aynı saatte tek derslikte");
    db.ExamRooms.Count(r => r.InvigilatorTeacherId == AyseId).Should().Be(1);
}

[Fact]
public async Task Should_ReportHole_When_SectionHasNoLessonAtThatHour()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSession(db, date: Tuesday, period: 7, sections: ["9-A"]);

    var holes = await new ExamInvigilatorDeriver(db).DeriveAsync(SchoolId, session.Id, default);

    holes.Should().HaveCount(1, "boş saatte gözetmen türemez, yönetici doldurur (K-20)");
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Run: `./scripts/test-changed.sh --integration --filter ExamInvigilatorDeriverTests`
Expected: FAIL

- [ ] **Adım 3: Türeticiyi yaz** — altı kuralı sırayla.

- [ ] **Adım 4: Testi koştur, yeşil olduğunu gör**

- [ ] **Adım 5: Commit**

```bash
git commit -am "feat(exams): gözetmen ders programından türüyor, delikler raporlanıyor"
```

---

### Görev 2.5: `ExamSessionComposer` — tek giriş noktası

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Internal/ExamSessionComposer.cs`
- Test: `tests/Oksis.Application.IntegrationTests/Modules/Exams/ExamSessionComposerTests.cs`

**Interfaces:**
- Consumes: `ExamRoomDeriver`, `ExamInvigilatorDeriver`, `ExamSeatingReader`, `ExamSeatArranger`.
- Produces: `ExamSessionComposer.RecomposeAsync(Guid schoolId, Guid sessionId, CancellationToken) -> CompositionReport`
  where `CompositionReport(int RoomCount, int StudentCount, IReadOnlyList<Guid> RoomsWithoutInvigilator, IReadOnlyList<Guid> ClassRoomsWithoutRoom, IReadOnlyList<Guid> OverCapacityRoomIds)`

**Neden tek giriş noktası:** üyelik değişimi sekiz komuttan tetiklenir (Dilim 3). Her komut üç türeticiyi ayrı ayrı çağırsaydı sıralama hatası (önce yerleşim, sonra derslik) sessiz bozukluk üretirdi. **Sıra sabittir:** derslik → gözetmen → yerleşim.

**Sıra takasları temizlenir** (spec §4.3): `RecomposeAsync` bütün `ExamSeat` satırlarını siler ve yeniden yazar; `IsManuallySwapped` bilgisi kaybolur. Çağıran komut kullanıcıya uyarı gösterir.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_ComposeInOrder_RoomsThenInvigilatorsThenSeats()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSession(db, date: Tuesday, period: 2, sections: ["9-A", "9-B", "9-C"]);
    await GivePlacements(db, Tuesday, 2, ("9-A", AyseId), ("9-B", MehmetId), ("9-C", CanId));

    var report = await Composer(db).RecomposeAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    report.RoomCount.Should().Be(3);
    report.RoomsWithoutInvigilator.Should().BeEmpty();
    report.StudentCount.Should().Be(await CountStudents(db, session));
    db.ExamSeats.Count().Should().Be(report.StudentCount, "her öğrenci bir sıraya oturur");
}

[Fact]
public async Task Should_ClearManualSwaps_When_Recomposed()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedComposedSession(db);
    var seat = await db.ExamSeats.FirstAsync();
    seat.MarkSwapped();
    await db.SaveChangesAsync(default);

    await Composer(db).RecomposeAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    db.ExamSeats.Any(s => s.IsManuallySwapped).Should().BeFalse(
        "öğrenci kümesi değişince eski takas anlamsızlaşır (spec §4.3)");
}

[Fact]
public async Task Should_WriteThrough_When_ComposedOverJoinedRead()
{
    // Regresyon: Faz 1'de AsNoTracking bir JOIN üzerinden yayıldı ve SaveChanges
    // sessizce hiçbir şey yazmadı. Bu test gerçek SQL'de yazmayı ölçer.
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSession(db, date: Tuesday, period: 2, sections: ["9-A"]);
    await GivePlacement(db, "9-A", Tuesday, 2, teacher: AyseId, isActive: true);

    await Composer(db).RecomposeAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    await using var fresh = await Fixture.OpenAsync();
    (await fresh.ExamRooms.SingleAsync()).InvigilatorTeacherId.Should().Be(AyseId);
    (await fresh.ExamSeats.CountAsync()).Should().BeGreaterThan(0);
}

[Fact]
public async Task Should_ReportOverCapacity_ButStillSeatEveryone()
{
    await using var db = await Fixture.CreateDbAsync();
    var session = await SeedSessionWithTightRooms(db, students: 100, totalCapacity: 90);

    var report = await Composer(db).RecomposeAsync(SchoolId, session.Id, default);
    await db.SaveChangesAsync(default);

    report.OverCapacityRoomIds.Should().NotBeEmpty("EX-S06");
    db.ExamSeats.Count().Should().Be(100, "K-23: kapasite aşımı yerleşimi durdurmaz");
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Run: `./scripts/test-changed.sh --integration --filter ExamSessionComposerTests`
Expected: FAIL

- [ ] **Adım 3: Bestekârı yaz**

- [ ] **Adım 4: Testi koştur, yeşil olduğunu gör**

- [ ] **Adım 5: Faz 1 regresyonu**

Run: `./scripts/test-changed.sh`
Expected: PASS — Faz 1'in bütün `Exams` testleri dahil (Kısıt 15).

- [ ] **Adım 6: Commit**

```bash
git commit -am "feat(exams): oturum bestesi — derslik, gözetmen ve yerleşim tek sırada üretiliyor"
```

---

# Dilim 3 — Komutlar

Yedi komut. Hepsi aynı iskeleti paylaşır: doğrulama → domain değişikliği → `ExamSessionComposer.RecomposeAsync` → `SaveChanges` → rapor. **Bestekâr tek giriş noktasıdır**; hiçbir komut türeticileri doğrudan çağırmaz.

Ortak kapı: yayınlanmış pencerede (`Status == SchedulePublished`) yapılan her değişiklik `ExamSession.Revise()` çağırır ve `ExamWindowRevision` satırı yazar. Faz 1'in `MoveExamCommandHandler`'ı emsaldir.

### Görev 3.1: `CreateExamSession` — yöneticiden oturum

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Commands/CreateExamSession/{Command,Handler,Validator}.cs`
- Modify: `src/Oksis.Api/Controllers/V1/ExamsController.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/CreateExamSessionCommandHandlerTests.cs`

**Interfaces:**
- Produces: `CreateExamSessionCommand(Guid ExamWindowId, Guid SubjectId, DateOnly Date, int Period, IReadOnlyList<Guid> ClassRoomIds) : IRequest<ExamSessionSummaryDto>`
- Uç: `POST /api/v1/exams/sessions` · `[RequirePermission("exams.window.manage")]`

**Davranış:** verilen şube kimlikleri için `ExamExpectationReader`'dan şube × ders çiftleri doğrulanır (o şube o dersi almıyorsa hata), her çift için `ScheduledExam` yazılır veya mevcut satır bulunur, `Date`/`Period` yerleştirilir, `AttachToSession` çağrılır, bestekâr koşar.

**Neden `ExamExpectationReader`:** "hangi şube hangi dersi alıyor" tanımı Faz 1'de tek noktadadır. İkinci bir tanım açmak TB-119'un tekrarıdır.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_CreateOneScheduledExamPerSection()
{
    var handler = NewHandler(expectations: [("9-A", Math), ("9-B", Math), ("9-C", Math)]);

    var result = await handler.Handle(new CreateExamSessionCommand(
        WindowId, Math, new DateOnly(2027, 3, 9), 2, [A, B, C]), default);

    result.SectionCount.Should().Be(3);
    Db.ScheduledExams.Count(e => e.ExamSessionId != null).Should().Be(3);
}

[Fact]
public async Task Should_Reject_When_SectionDoesNotTakeTheSubject()
{
    var handler = NewHandler(expectations: [("9-A", Math)]);

    var act = () => handler.Handle(new CreateExamSessionCommand(
        WindowId, Math, new DateOnly(2027, 3, 9), 2, [A, B]), default);

    await act.Should().ThrowAsync<InvalidExamDataException>()
        .WithMessage("*9-B*", "o şube o dersi almıyor; beklenti listesinden doğrulanır");
}

[Fact]
public async Task Should_Reject_When_WindowIsNotSessionMode()
{
    var handler = NewHandler(windowMode: ExamMode.LessonHour);

    var act = () => handler.Handle(AnyCommand(), default);

    await act.Should().ThrowAsync<InvalidExamWindowStateException>();
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör** — Run: `dotnet test tests/Oksis.Application.UnitTests --filter CreateExamSessionCommandHandlerTests` · Expected: FAIL
- [ ] **Adım 3: Komutu, doğrulayıcıyı, işleyiciyi ve ucu yaz**
- [ ] **Adım 4: Testi koştur, yeşil olduğunu gör**
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): yöneticiden oturum açma komutu"`

---

### Görev 3.2: `PlaceExam` oturum modu — öğretmenden oturum

**Files:**
- Modify: `src/Oksis.Application/Modules/Exams/Commands/PlaceExam/PlaceExamCommandHandler.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/PlaceExamSessionModeTests.cs`

**Interfaces:**
- Consumes: mevcut `PlaceExamCommand` — **imzası değişmez**; `IReadOnlyList<Guid>? AdditionalClassRoomIds` alanı eklenir (null = öğretmenin o dersteki bütün şubeleri).

**Davranış (K-16, K-17):**
1. Pencere `LessonHour` modundaysa Faz 1 yolu — **hiçbir şey değişmez** (Kısıt 15).
2. `Session` modundaysa: EX-H03 **uygulanmaz** (saat serbest, K-17). Öğretmenin o dersteki bütün şube × ders çiftleri toplanır; `AdditionalClassRoomIds` verilmişse o küme kullanılır.
3. Aynı (pencere, ders, tarih, saat) üçlüsünde oturum varsa ona bağlanılır, yoksa yenisi doğar.
4. Bestekâr koşar.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_NotApplyOwnHourRule_When_WindowIsSessionMode()
{
    // K-17: oturumda saat serbest. Öğretmenin salı 2'de dersi YOK ama yerleştirebilmeli.
    var handler = NewHandler(windowMode: ExamMode.Session, teacherHasLessonAt: false);

    var act = () => handler.Handle(PlaceAt(Tuesday, 2), default);

    await act.Should().NotThrowAsync();
}

[Fact]
public async Task Should_StillApplyOwnHourRule_When_WindowIsLessonHourMode()
{
    // Kısıt 15: Faz 1 davranışı değişmez.
    // Kısıt 15b: sert ihlal ATILMAZ, Result.Conflict döner.
    var handler = NewHandler(windowMode: ExamMode.LessonHour, teacherHasLessonAt: false);

    var result = await handler.Handle(PlaceAt(Tuesday, 2), default);

    result.Status.Should().Be(ResultStatus.Conflict);
    result.Errors.Should().ContainMatch("*kendi dersi*");
}

[Fact]
public async Task Should_PullAllOwnSections_When_NoExplicitListGiven()
{
    var handler = NewHandler(windowMode: ExamMode.Session,
        teacherSections: [("9-A", Math), ("9-B", Math), ("10-C", Math)]);

    var result = await handler.Handle(PlaceAt(Tuesday, 2), default);

    result.SessionSectionCount.Should().Be(3, "girdiği tüm sınıflar tek seferde sınava girer");
}

[Fact]
public async Task Should_JoinExistingSession_When_SameSubjectDateAndPeriod()
{
    var handler = NewHandler(windowMode: ExamMode.Session, existingSession: (Math, Tuesday, 2));

    var result = await handler.Handle(PlaceAt(Tuesday, 2), default);

    Db.ExamSessions.Count().Should().Be(1, "ikinci oturum doğmaz, mevcuda bağlanır");
    result.SessionId.Should().Be(ExistingSessionId);
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**
- [ ] **Adım 3: İşleyiciyi genişlet** — mod dallanması tek bir `if (window.Mode == ExamMode.Session)` bloğunda; Faz 1 yolu dokunulmadan kalır.
- [ ] **Adım 4: Testi koştur + Faz 1 regresyonu** — Run: `dotnet test tests/Oksis.Application.UnitTests --filter Exams` · Expected: PASS (yeni + eski)
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): öğretmen yerleştirmesi oturum doğuruyor, saat kısıtı kalkıyor"`

---

### Görev 3.3: `UpdateSessionSections` — şube ekle/çıkar

**Files:** `Commands/UpdateSessionSections/*` · Test: `UpdateSessionSectionsCommandHandlerTests.cs`

**Interfaces:**
- Produces: `UpdateSessionSectionsCommand(Guid SessionId, IReadOnlyList<Guid> AddClassRoomIds, IReadOnlyList<Guid> RemoveClassRoomIds, string? Reason)`
- Uç: `PATCH /api/v1/exams/sessions/{id}/sections` · `exams.window.manage`

**Davranış:** çıkarılan şubenin `ScheduledExam` satırı `DetachFromSession()` + `Unplace()` çağırır — sınav silinmez, **yerleşmemiş** hâle döner ve EX-S05 uyarısına konu olur. Son şube de çıkarılırsa oturum silinir (spec §4.3).

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_UnplaceExam_When_SectionIsRemoved()
{
    var handler = NewHandler(session: WithSections("9-A", "9-B"));

    await handler.Handle(new UpdateSessionSectionsCommand(SessionId, [], [B], null), default);

    var exam = Db.ScheduledExams.Single(e => e.ClassRoomId == B);
    exam.ExamSessionId.Should().BeNull();
    exam.PlacementState.Should().Be(ExamPlacementState.Unplaced, "sınav silinmez, yerleşmemişe döner");
}

[Fact]
public async Task Should_DeleteSession_When_LastSectionIsRemoved()
{
    var handler = NewHandler(session: WithSections("9-A"));

    await handler.Handle(new UpdateSessionSectionsCommand(SessionId, [], [A], null), default);

    Db.ExamSessions.Any(s => s.Id == SessionId).Should().BeFalse();
    Db.ExamRooms.Any().Should().BeFalse("cascade");
}

[Fact]
public async Task Should_RequireReason_When_WindowIsPublished()
{
    var handler = NewHandler(session: WithSections("9-A", "9-B"), windowPublished: true);

    var act = () => handler.Handle(new UpdateSessionSectionsCommand(SessionId, [], [B], null), default);

    await act.Should().ThrowAsync<InvalidExamDataException>().WithMessage("*gerekçe*");
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): oturuma şube ekleme ve çıkarma"`

---

### Görev 3.4: `MergeExamSessions` — oturum birleştirme

**Files:** `Commands/MergeExamSessions/*` · Test: `MergeExamSessionsCommandHandlerTests.cs`

**Interfaces:**
- Produces: `MergeExamSessionsCommand(Guid TargetSessionId, Guid SourceSessionId, string? Reason)`
- Uç: `POST /api/v1/exams/sessions/{id}/merge` · `exams.window.manage`

**Kapı:** iki oturumun `ExamWindowId`, `SubjectId`, `Date` ve `Period` değerleri **aynı olmalı**. Farklıysa `InvalidExamDataException`. Kaynak oturumun `ScheduledExam` satırları hedefe bağlanır, kaynak silinir, hedef yeniden bestelenir — üç öğretmenin öğrencileri gerçekten karışır (kullanıcı kararı).

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_MixStudentsAcrossTeachers_When_SessionsAreMerged()
{
    var (target, source) = TwoSessions(subject: Math, Tuesday, 2,
        targetTeacher: AhmetId, sourceTeacher: AyseId);

    await Handler.Handle(new MergeExamSessionsCommand(target.Id, source.Id, null), default);

    Db.ExamSessions.Count().Should().Be(1);
    var anyRoom = Db.ExamRooms.First(r => r.ExamSessionId == target.Id);
    SectionsInRoom(anyRoom).Should().HaveCountGreaterThan(1,
        "birleşince Ahmet'in ve Ayşe'nin öğrencileri aynı dersliğe düşer");
}

[Theory]
[InlineData("subject")]
[InlineData("date")]
[InlineData("period")]
public async Task Should_Reject_When_CoordinatesDiffer(string differing)
{
    var (target, source) = TwoSessionsDifferingIn(differing);

    var act = () => Handler.Handle(new MergeExamSessionsCommand(target.Id, source.Id, null), default);

    await act.Should().ThrowAsync<InvalidExamDataException>();
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): aynı hücredeki iki oturumu birleştirme"`

---

### Görev 3.5: Derslik ekleme ve çıkarma

**Files:** `Commands/UpdateSessionRooms/*` · Test: `UpdateSessionRoomsCommandHandlerTests.cs`

**Interfaces:**
- Produces: `UpdateSessionRoomsCommand(Guid SessionId, IReadOnlyList<Guid> AddRoomIds, IReadOnlyList<Guid> RemoveRoomIds, string? Reason)`
- Uç: `PATCH /api/v1/exams/sessions/{id}/rooms` · `exams.window.manage`

Eklenen derslik `IsManuallyAdded = true` ile doğar (Kısıt 19). Çıkarılan derslik **silinmez**, `Exclude()` ile işaretlenir (Görev 1.1'in `IsExcluded` alanı): yeniden türetme satırı görür ve atlar, böylece yöneticinin çıkardığı derslik geri gelmez. Dördüncü bir tablo açmamanın sebebi budur — dışlama, dersliğin kendi hâlidir, ayrı bir varlık değil.

Dışlanan dersliğin sıraları silinir ve öğrencileri kalan dersliklere dağılır; bestekâr bunu kendi yapar.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_NotReturn_When_ExcludedRoomIsRederived()
{
    await Handler.Handle(new UpdateSessionRoomsCommand(SessionId, [], [RoomOf9A], null), default);
    await Composer.RecomposeAsync(SchoolId, SessionId, default);

    Db.ExamRooms.Single(r => r.RoomId == RoomOf9A).IsExcluded.Should().BeTrue(
        "yöneticinin çıkardığı derslik türetmeyle geri gelmez");
    Db.ExamSeats.Any(s => s.ExamRoomId == ExcludedRoomRowId).Should().BeFalse();
}

[Fact]
public async Task Should_RedistributeStudents_When_RoomIsRemoved()
{
    var before = Db.ExamSeats.Count();

    await Handler.Handle(new UpdateSessionRoomsCommand(SessionId, [], [RoomOf9A], null), default);

    Db.ExamSeats.Count().Should().Be(before, "öğrenci kaybolmaz, kalan dersliklere dağılır");
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): oturuma derslik ekleme ve çıkarma"`

---

### Görev 3.6: `SetInvigilator` — deliği doldur, gözetmeni değiştir

**Files:** `Commands/SetInvigilator/*` · Test: `SetInvigilatorCommandHandlerTests.cs`

**Interfaces:**
- Produces: `SetInvigilatorCommand(Guid ExamRoomId, Guid? TeacherId, string? Reason)` — `TeacherId == null` gözetmeni boşaltır.
- Uç: `PUT /api/v1/exams/rooms/{id}/invigilator` · `exams.window.manage`

Yazılan gözetmen **her zaman** `InvigilatorSource.Manual` taşır.

**EX-H06 BU GÖREVDE yazılır** (ön uçuş kararı R3): kural yalnız elle doldurmada ısırır — türetme aynı öğretmeni iki dersliğe koyamaz. `ExamRuleInspector`'a eklenir, birim testi burada. Görev 4.2 dördünün (EX-H05/H06/H09/H10) gerçek SQL kapsamasını yapar.

**`ExamInvigilatorChangedEvent` KAYDI da burada doğar** (ön uçuş kararı R4): olayı yayan komut budur. Görev 6.1 yalnız işleyiciyi ve bildirimi ekler. Olayı yayanı ondan önce yazmak, 6.1'e kadar ölü kod bırakırdı.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_MarkManual_When_InvigilatorIsSet()
{
    await Handler.Handle(new SetInvigilatorCommand(RoomId, MehmetId, null), default);

    var room = Db.ExamRooms.Single(r => r.Id == RoomId);
    room.InvigilatorSource.Should().Be(InvigilatorSource.Manual);
}

[Fact]
public async Task Should_Reject_When_TeacherIsAlreadyInvigilatingAtSameHour()
{
    // Kısıt 15b: sert ihlal Result.Conflict döner. Kodun kendisi (EX-H06)
    // denetleyici testinde ölçülür, komut testinde değil.
    GiveInvigilation(otherRoomInSameHour: true, teacher: MehmetId);

    var result = await Handler.Handle(new SetInvigilatorCommand(RoomId, MehmetId, null), default);

    result.Status.Should().Be(ResultStatus.Conflict);
}

[Fact]
public void Should_EmitH06_When_TeacherIsAlreadyInvigilatingAtSameHour()
{
    // Denetleyici testi: kod burada iddia edilir.
    var violations = Inspector.CheckInvigilator(MehmetId, RoomId, occupiedElsewhereAtSameHour: true);

    violations.Should().ContainSingle(v => v.Code == "EX-H06" && v.Severity == "hard");
}

[Fact]
public async Task Should_AllowSameTeacher_When_HoursDiffer()
{
    GiveInvigilation(otherRoomInSameHour: false, teacher: MehmetId);

    var result = await Handler.Handle(new SetInvigilatorCommand(RoomId, MehmetId, null), default);

    result.Status.Should().Be(ResultStatus.Success);
}

[Fact]
public async Task Should_RaiseEvent_When_ChangedAfterPublish()
{
    var handler = NewHandler(windowPublished: true, currentInvigilator: AyseId);

    await handler.Handle(new SetInvigilatorCommand(RoomId, MehmetId, "Ayşe raporlu"), default);

    Room.DomainEvents.Should().ContainSingle(e => e is ExamInvigilatorChangedEvent);
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): gözetmen deliği doldurma ve değiştirme"`

---

### Görev 3.7: `SwapSeats` ve `RegenerateSeating`

**Files:** `Commands/SwapSeats/*`, `Commands/RegenerateSeating/*` · Test: `SeatMaintenanceCommandHandlerTests.cs`

**Interfaces:**
- Produces: `SwapSeatsCommand(Guid SeatAId, Guid SeatBId, string? Reason)`, `RegenerateSeatingCommand(Guid SessionId, string? Reason)`
- Uçlar: `POST /api/v1/exams/seats/swap`, `POST /api/v1/exams/sessions/{id}/seating` · `exams.window.manage`

Takas iki sıranın öğrencilerini değiştirir ve ikisini de `MarkSwapped()` ile işaretler. Sıralar **farklı dersliklerde olabilir** — kelebekte iki öğrenciyi yer değiştirmek derslik değiştirmek demektir.

`RegenerateSeating` bestekârı çağırır; **takasları temizler** ve yanıtında kaç takasın kaybolduğunu döner (ekran uyarı gösterir).

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_ExchangeStudents_AcrossRooms()
{
    var (a, b) = SeatsInDifferentRooms();
    var (sa, sb) = (a.StudentPersonId, b.StudentPersonId);

    await Handler.Handle(new SwapSeatsCommand(a.Id, b.Id, null), default);

    Db.ExamSeats.Single(s => s.Id == a.Id).StudentPersonId.Should().Be(sb);
    Db.ExamSeats.Single(s => s.Id == b.Id).StudentPersonId.Should().Be(sa);
    Db.ExamSeats.Count(s => s.IsManuallySwapped).Should().Be(2);
}

[Fact]
public async Task Should_ReportLostSwaps_When_SeatingIsRegenerated()
{
    MakeSwaps(count: 3);

    var result = await Handler.Handle(new RegenerateSeatingCommand(SessionId, null), default);

    result.ClearedSwapCount.Should().Be(3);
    Db.ExamSeats.Any(s => s.IsManuallySwapped).Should().BeFalse();
}

[Fact]
public async Task Should_Reject_When_SeatsBelongToDifferentSessions()
{
    var (a, b) = SeatsInDifferentSessions();

    var act = () => Handler.Handle(new SwapSeatsCommand(a.Id, b.Id, null), default);

    await act.Should().ThrowAsync<InvalidExamDataException>();
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): sıra takası ve yerleşimi yeniden üretme"`

---

# Dilim 4 — Kurallar ve yayın

### Görev 4.1: Kaldırılan ve mod kapısına alınan kurallar

**Files:**
- Modify: `src/Oksis.Application/Modules/Exams/Internal/ExamRuleInspector.cs`
- Modify: `src/Oksis.Api/Errors/ErrorMessageCatalog.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/ExamRuleInspectorSessionTests.cs`

**Değişimler (spec §6):**

| Kod | İşlem |
|---|---|
| EX-H03 | `window.Mode == LessonHour` koşuluna alınır |
| EX-H04 | **Silinir**; katalog satırı da silinir |
| EX-S02 | **Silinir** — sahip öğretmenin kendi dersliğinde gözetmen olması artık beklenen durumdur |
| EX-S03 | **Silinir** — gözetmen ataması yok |
| EX-S04 | Ölçüm seviyeden **şubeye** çevrilir |

**Silinen kodlar yeniden kullanılmaz.** `EX-H04`, `EX-S02`, `EX-S03` boş bırakılır; ileride başka bir kurala verilirse eski ekran/kayıt yanlış metin gösterir.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public void Should_NotEmitOwnHourViolation_When_SessionMode()
{
    var violations = Inspect(mode: ExamMode.Session, teacherHasLessonAtSlot: false);
    violations.Should().NotContain(v => v.Code == "EX-H03");
}

[Fact]
public void Should_EmitOwnHourViolation_When_LessonHourMode()
{
    var violations = Inspect(mode: ExamMode.LessonHour, teacherHasLessonAtSlot: false);
    violations.Should().Contain(v => v.Code == "EX-H03");
}

[Theory]
[InlineData("EX-H04")]
[InlineData("EX-S02")]
[InlineData("EX-S03")]
public void Should_NeverEmitRetiredCodes(string retired)
{
    AllPossibleViolations().Should().NotContain(v => v.Code == retired);
}

[Fact]
public void Should_WarnOnSingleSection_NotSingleGradeLevel()
{
    // EX-S04 yeni ölçüm: dersliğe 9-A ve 10-A düştüyse KARIŞIM VARDIR, uyarı yok.
    var violations = InspectRoom(sections: ["9-A", "10-A"]);
    violations.Should().NotContain(v => v.Code == "EX-S04");

    InspectRoom(sections: ["9-A"]).Should().Contain(v => v.Code == "EX-S04");
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**
- [ ] **Adım 3: Denetleyiciyi ve kataloğu güncelle**
- [ ] **Adım 4: Testi koştur + Faz 1 regresyonu** — EX-H04/S02/S03'ü bekleyen Faz 1 testleri varsa **silinir**, gevşetilmez.
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): EX-H04, EX-S02 ve EX-S03 kaldırıldı, EX-H03 mod kapısına alındı"`

---

### Görev 4.2: Yeni sert kurallar — EX-H05, EX-H06, EX-H09

**Files:** `ExamRuleInspector.cs`, `ErrorMessageCatalog.cs` · Test: `tests/Oksis.Application.IntegrationTests/Modules/Exams/ExamSessionRuleTests.cs`

**EX-H06 zaten Görev 3.6'da yazıldı** (ön uçuş kararı R3). Bu görev EX-H05, EX-H09 ve EX-H10'u ekler, **dördünün de** gerçek SQL kapsamasını yapar.

**Neden entegrasyon testi:** dördü de çoklu tablo JOIN'i üzerinden ölçülür; `MockQueryable` çeviri hatalarına kördür ve bu desen bu depoda üç kez ısırmıştır (`B-15`, `X-07`, `X-04`).

| Kod | Metin (tr-TR, sunucuda üretilir) |
|---|---|
| EX-H05 | "{Öğrenci} aynı gün ve saatte başka bir sınav oturumunda." |
| EX-H06 | "{Öğretmen} aynı gün ve saatte başka bir derslikte gözetmen." |
| EX-H09 | "{Derslik} aynı gün ve saatte başka bir oturumda kullanılıyor." |
| **EX-H10** | "{Derslik} için gözetmen yok — o saatte bu sınıfta dersi olan öğretmen bulunamadı." |

**EX-H10 neden var (2026-09-09 tasarım incelemesinde çıktı):** teslim edilen ekran "gözetmen eksik" kartını `rooms.filter(r => !r.invigilator)` ile **istemcide** türetiyor ve sahte bir `EX-H` kodu basıyordu. Kısıt 4: ekranın uyguladığı ama sunucunun bilmediği kural yok sayılır. Gözetmensiz derslik yayını engelleyen bir koşuldur, dolayısıyla sunucunun döndürdüğü bir **sert ihlal**dir; ekran onu `violations` dizisinden çizer.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_DetectStudentInTwoSessions_AtSameHour()
{
    await using var db = await Fixture.CreateDbAsync();
    await SeedStudentInTwoSessions(db, Tuesday, period: 2);

    var violations = await Inspector(db).CheckSessionAsync(SchoolId, SecondSessionId, default);

    violations.Should().Contain(v => v.Code == "EX-H05");
}

[Fact]
public async Task Should_AllowTwoSessions_AtSameHour_WhenNothingIsShared()
{
    // Spec §6: oturumlar çakışabilir. Çakışamayan derslik, öğrenci ve gözetmendir.
    await using var db = await Fixture.CreateDbAsync();
    await SeedTwoIndependentSessions(db, Tuesday, period: 2);

    var violations = await Inspector(db).CheckSessionAsync(SchoolId, SecondSessionId, default);

    violations.Should().BeEmpty();
}

[Fact]
public async Task Should_DetectRoomUsedByAnotherSession()
{
    await using var db = await Fixture.CreateDbAsync();
    await SeedSharedRoom(db, Tuesday, period: 2);

    var violations = await Inspector(db).CheckSessionAsync(SchoolId, SecondSessionId, default);

    violations.Should().Contain(v => v.Code == "EX-H09");
}

[Fact]
public async Task Should_ProduceTurkishMessage_RegardlessOfProcessCulture()
{
    using var _ = new CultureScope("en-US");
    await using var db = await Fixture.CreateDbAsync();
    await SeedSharedRoom(db, Tuesday, 2);

    var violations = await Inspector(db).CheckSessionAsync(SchoolId, SecondSessionId, default);

    violations.Single(v => v.Code == "EX-H09").Message.Should().Contain("oturumda kullanılıyor");
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil (`./scripts/test-changed.sh --integration --filter ExamSessionRuleTests`)
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): EX-H05, EX-H06 ve EX-H09 sert kuralları"`

---

### Görev 4.3: EX-S06 ve oturum modunda yayın kapısı

**Files:** `ExamRuleInspector.cs` (`CheckPublishAsync`), `CreateExamWindowCommandHandler.cs`, `src/Oksis.Api/Errors/ErrorMessageCatalog.cs`, `src/Oksis.Domain/Modules/Exams/Enums/ExamMode.cs` · Test: `ExamSessionPublishGateTests.cs`

**Faz 1'in kapısı YAYINDA DEĞİL, PENCERE OLUŞTURMADA** (ön uçuş kararı R2 — koddan ölçüldü). Üç yer düzeltilir:

- `CreateExamWindowCommandHandler.cs` — `Session` modunu reddeden dal **silinir**. Bugün oturum modunda pencere hiç kurulamıyor.
- `ErrorMessageCatalog.cs` — "Oturum modu henüz kullanılamıyor; kelebek düzeni sonraki fazda açılacak." satırı **silinir**.
- `ExamMode.cs` — enum XML yorumu "Faz 1 yalnız LessonHour'u uygular; Session penceresi oluşturulabilir ama yayınlanamaz" diyerek **yanılıyor** (pencere zaten oluşturulamıyordu). Yorum güncellenir.

Kaldırılacak bir yayın kapısı **yoktur**. Yayın tarafına üç YENİ koşul eklenir:

1. Her `ExamRoom`'un gözetmeni var (K-20).
2. Oturumdaki her öğrenci bir `ExamSeat`'e oturmuş.
3. EX-H05, EX-H06, EX-H09 ihlali yok.

EX-S06 (kapasite) ve EX-S04 (karışmamış derslik) **yayını engellemez** (K-23).

Faz 1'in "bekleyen saat isteği yok" koşulu oturum modunda **boş geçer**: saat serbest seçildiği için (K-17) ödünç alma kavramı yoktur ve `HourRequest` satırı doğmaz. Koşul kaldırılmaz — `LessonHour` modunda hâlâ ısırır; yalnız oturum modunda sorgusu boş küme döner. Testi bu iki hâli ayrı ayrı ölçer.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_BlockPublish_When_AnyRoomHasNoInvigilator()
{
    // Kısıt 15b: Result.Conflict, istisna değil.
    await using var db = await Fixture.CreateDbAsync();
    var window = await SeedSessionWindow(db, invigilatorHoles: 1);

    var result = await Publish(db, window.Id);

    result.Status.Should().Be(ResultStatus.Conflict);
    result.Errors.Should().ContainMatch("*gözetmen*");
}

[Fact]
public async Task Should_BlockPublish_When_SomeStudentHasNoSeat()
{
    await using var db = await Fixture.CreateDbAsync();
    var window = await SeedSessionWindowWithUnseatedStudent(db);

    var result = await Publish(db, window.Id);

    result.Status.Should().Be(ResultStatus.Conflict);
}

[Fact]
public async Task Should_AllowPublish_When_OnlySoftViolationsRemain()
{
    // K-23: kapasite aşımı ve karışmamış derslik yayını ENGELLEMEZ.
    await using var db = await Fixture.CreateDbAsync();
    var window = await SeedSessionWindow(db, overCapacity: true, unmixedRoom: true);

    var result = await Publish(db, window.Id);

    result.Status.Should().Be(ResultStatus.Success);
}

[Fact]
public async Task Should_CreateWindow_When_SessionMode()
{
    // R2: Faz 1 bunu reddediyordu; kapı kalktı.
    await using var db = await Fixture.CreateDbAsync();

    var result = await CreateWindow(db, ExamMode.Session);

    result.Status.Should().Be(ResultStatus.Success);
}

[Fact]
public async Task Should_AllowPublish_When_SessionModeIsComplete()
{
    // Faz 1'in "oturum modu yayınlanamaz" kapısı kalktı.
    await using var db = await Fixture.CreateDbAsync();
    var window = await SeedCompleteSessionWindow(db);

    await Publish(db, window.Id);

    (await db.ExamWindows.SingleAsync()).Status.Should().Be(ExamWindowStatus.SchedulePublished);
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): oturum modunda yayın kapısı açıldı, gözetmen ve yerleşim şartı eklendi"`

---

# Dilim 5 — Okuma uçları

### Görev 5.1: `GetExamSession` — oturum ayrıntısı

**Files:** `Queries/GetExamSession/*`, `ExamsController.cs` · Test: `GetExamSessionQueryHandlerTests.cs`

**Interfaces:**
- Produces: `GET /api/v1/exams/sessions/{id}` · `exams.window.manage` →

```jsonc
{
  "id": "…", "subjectId": "…", "subjectName": "Matematik",
  "date": "2027-03-09", "period": 2, "periodLabel": "2. ders",
  "version": 1,
  "responsibleTeachers": [ { "id": "…", "name": "Ahmet Yılmaz" } ],   // K-15: türetilir
  "sections": [ { "classRoomId": "…", "name": "9-A", "studentCount": 30 } ],
  "rooms": [
    {
      "id": "…", "roomId": "…", "name": "9-A Sınıfı", "capacity": 30,
      "studentCount": 32, "isOverCapacity": true,
      "isManuallyAdded": false, "isExcluded": false,
      "invigilator": { "id": "…", "name": "Ayşe Demir", "source": "derived" },
      "sectionBreakdown": [ { "name": "9-A", "count": 11 }, { "name": "9-B", "count": 10 } ],
      "seats": [ { "id": "…", "seatNo": 1, "studentName": "Ali Kaya",
                   "studentNumber": "101", "sectionName": "9-A", "isManuallySwapped": false } ]
    }
  ],
  "violations": [ { "code": "EX-S06", "severity": "soft", "message": "…" } ],
  "classRoomsWithoutRoom": [ { "classRoomId": "…", "name": "9-D" } ]
}
```

**R11:** alan adları İngilizce, `source` değeri `"derived" | "manual"` (enum sayısı sızmaz).
`periodLabel` sunucuda zil çizelgesinden türetilir (Kısıt 6) — istemci saat metni üretmez.

- [ ] **Adım 1: Testi yaz** — üç durum: dolu oturum, gözetmen deliği olan oturum, kapasite aşan oturum. Her birinde ilgili bayrağın (`isOverCapacity`, `invigilator == null`) doğru geldiği ölçülür.
- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**
- [ ] **Adım 3: Sorguyu ve ucu yaz** — tek sorgu çiftinde (oturum + şubeler, derslikler + sıralar); N+1 yasak.
- [ ] **Adım 4: Testi koştur, yeşil olduğunu gör**
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): oturum ayrıntısı ucu"`

---

### Görev 5.2: Pano oturum görünümü

**Files:** `Queries/GetExamBoard/*` (mevcut genişler) · Test: mevcut `GetExamBoardQueryHandlerTests.cs`

Faz 1'in pano yanıtına `sessions` dizisi eklenir: `{ id, subjectName, date, period, sectionCount, studentCount, roomCount, invigilatorHoleCount, softViolationCount }`.

**Kısıt 15:** `LessonHour` modundaki pencerede `sessions` **boş dizi** döner, mevcut alanlar değişmez. Faz 1'in pano testleri değişmeden yeşil kalır.

- [ ] **Adım 1: Testi yaz** — `LessonHour` penceresinde `sessions` boş; `Session` penceresinde sayaçlar doğru.
- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): panoya oturum görünümü"`

---

### Görev 5.3: Öğrenci ve veli takvimine derslik ve sıra

**Files:** `Queries/GetMyExamSchedule/*` (mevcut genişer) · Test: mevcut dosya

Faz 1'in `roomName: null` boşluğu burada kapanır. Her sınav satırına: `roomName`, `seatNo`, `sectionMatesInRoom` (bilgi amaçlı değil — **eklenmez**; YAGNI).

Ders saati modunda `roomName` şubenin kendi sınıfıdır (`ClassRoom.RoomId`), `seatNo` **null**'dır. Oturum modunda ikisi de `ExamSeat`'ten gelir.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_ReturnSeat_When_SessionMode()
{
    var rows = await Handler.Handle(new GetMyExamScheduleQuery(StudentId, TermId), default);
    rows.Single().SeatNo.Should().Be(7);
    rows.Single().RoomName.Should().Be("9-B Sınıfı");
}

[Fact]
public async Task Should_ReturnOwnClassRoom_AndNullSeat_When_LessonHourMode()
{
    var rows = await Handler.Handle(new GetMyExamScheduleQuery(StudentId, TermId), default);
    rows.Single().SeatNo.Should().BeNull("ders saati modunda sıra kavramı yok");
    rows.Single().RoomName.Should().Be("9-A Sınıfı");
}

[Fact]
public async Task Should_HideRoomAndSeat_When_ScheduleNotPublished()
{
    // İki adımlı yayın (K-10): hafta duyurulmuş ama ayrıntı kapalı.
    var rows = await Handler.Handle(new GetMyExamScheduleQuery(StudentId, TermId), default);
    rows.Single().RoomName.Should().BeNull();
    rows.Single().SeatNo.Should().BeNull();
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): öğrenci takvimine derslik ve sıra"`

---

### Görev 5.4: Öğretmen takvimine gözetmenlik

**Files:** `Queries/GetMyExamDuties/*` (yeni) · Test: `GetMyExamDutiesQueryHandlerTests.cs`

**Interfaces:**
- Produces: `GET /api/v1/exams/me/duties?termId=` · `exams.read.self` →
  `{ "exams": [ … ], "invigilations": [ { "sessionId", "date", "period", "periodLabel", "roomName", "subjectName", "studentCount" } ] }`

Öğretmen kendi sınavlarını Faz 1'den zaten görüyor; bu uç **gözetmenlik** satırlarını ekler. İki liste ayrı döner — birleştirmek istemcinin işidir, çünkü rozetleri farklıdır.

- [ ] **Adım 1: Testi yaz** — yayınlanmamış oturumun gözetmenliği **görünmez**; yayınlandıktan sonra görünür.
- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): öğretmen gözetmenlik takvimi ucu"`

---

### Görev 5.5: Ders programı etiketi oturum davranışı

**Files:** `Internal/ExamScheduleReader.cs` (Faz 1, genişler) · Test: mevcut `ExamScheduleReaderTests.cs`

**Karar (spec §8):** öğrencinin hücresi **sınavın dersinin** rengini alır, o saatteki normal dersin değil. Etiket `subjectId` alanı sınavın dersini taşır; renk istemcide `subjectColorIndex` ile üretilir (K-13, Kısıt 10).

Öğretmen tarafında aynı hücre `kind: "invigilation"` ile döner — kendi dersi olarak değil.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_TagWithExamSubject_NotScheduledLesson()
{
    // 10-B'nin salı 2. dersi fizik; oturum matematik sınavı.
    var tags = await Reader.ReadForStudentAsync(StudentId, Week, default);
    tags.Single().SubjectId.Should().Be(MathId, "öğrencinin o saat yapacağı iş matematik sınavı");
}

[Fact]
public async Task Should_TagTeacherCellAsInvigilation()
{
    var tags = await Reader.ReadForTeacherAsync(PhysicsTeacherId, Week, default);
    tags.Single().Kind.Should().Be("invigilation");
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): oturum saatinde program etiketi sınavın dersini taşıyor"`

---

### Görev 5.6: Seçici uçları — gözetmen ve derslik adayları

**Files:** `Queries/GetInvigilatorCandidates/*`, `Queries/GetRoomCandidates/*`, `ExamsController.cs` · Test: `ExamCandidateQueryTests.cs`

**Bu görev tasarım incelemesinde doğdu.** Teslim edilen ekranın iki modali (`invigilator`, `addRoom`) aday listesi tüketiyor; plan bu iki ucu öngörmemişti.

**Interfaces:**
- `GET /api/v1/exams/rooms/{examRoomId}/invigilator-candidates` · `exams.window.manage` →
  `[ { "id", "name", "subjectAreaName", "isBusy", "busyRoomName" } ]`
- `GET /api/v1/exams/sessions/{id}/room-candidates` · `exams.window.manage` →
  `[ { "roomId", "name", "capacity", "isInUse" } ]`

**Kural sunucuda (Kısıt 4):** `isBusy`, EX-H06'nın **aynı yüklemiyle** hesaplanır — aynı gün ve saatte başka bir `ExamRoom`'a yazılı öğretmen. `isInUse`, EX-H09'un aynı yüklemi. Ekran bu bayrakları yalnız çizer ve düğmeyi kilitler; kendi kuralını üretmez. İki yüklem `ExamRuleInspector` içindeki tek tanımdan çağrılır — ikinci bir kopya yazılmaz.

Aday listesi **okulun bütün öğretmenleri** değildir: o gün okulda dersi olan öğretmenler öncelikli sıralanır, ama liste kısıtlanmaz — yönetici gerekirse herkesi seçebilmelidir (izinli öğretmeni sistem bilmiyor, K-24 mantığı).

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_MarkBusy_When_TeacherInvigilatesAnotherRoomAtSameHour()
{
    await using var db = await Fixture.CreateDbAsync();
    await SeedTeacherInvigilatingElsewhere(db, AyseId, Tuesday, period: 2);

    var rows = await Handler(db).Handle(new GetInvigilatorCandidatesQuery(RoomId), default);

    rows.Single(r => r.Id == AyseId).IsBusy.Should().BeTrue();
    rows.Single(r => r.Id == AyseId).BusyRoomName.Should().Be("9-A Sınıfı");
}

[Fact]
public async Task Should_NotMarkBusy_When_HoursDiffer()
{
    await using var db = await Fixture.CreateDbAsync();
    await SeedTeacherInvigilatingElsewhere(db, AyseId, Tuesday, period: 5);

    var rows = await Handler(db).Handle(new GetInvigilatorCandidatesQuery(RoomId), default);

    rows.Single(r => r.Id == AyseId).IsBusy.Should().BeFalse();
}

[Fact]
public async Task Should_MarkRoomInUse_When_ClaimedByAnotherSession()
{
    await using var db = await Fixture.CreateDbAsync();
    await SeedRoomClaimedByAnotherSession(db, Tuesday, period: 2);

    var rows = await RoomHandler(db).Handle(new GetRoomCandidatesQuery(SessionId), default);

    rows.Single(r => r.RoomId == SharedRoomId).IsInUse.Should().BeTrue("EX-H09 ile aynı yüklem");
}

[Fact]
public async Task Should_ExcludeRoomsAlreadyInThisSession()
{
    await using var db = await Fixture.CreateDbAsync();

    var rows = await RoomHandler(db).Handle(new GetRoomCandidatesQuery(SessionId), default);

    rows.Should().NotContain(r => r.RoomId == RoomAlreadyInSession);
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör** — `./scripts/test-changed.sh --integration --filter ExamCandidateQueryTests`
- [ ] **Adım 3: İki sorguyu ve ucu yaz**
- [ ] **Adım 4: Testi koştur, yeşil olduğunu gör**
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): gözetmen ve derslik aday uçları"`

---

# Dilim 6 — Bildirimler

### Görev 6.1: `ExamInvigilationChanged` devreye alınıyor

**Files:**
- Create: `src/Oksis.Domain/Modules/Exams/Events/ExamInvigilatorChangedEvent.cs`
- Create: `src/Oksis.Application/Modules/Exams/EventHandlers/ExamInvigilatorChangedNotificationHandler.cs`
- Modify: `PublishExamScheduleCommandHandler` (bildirim içeriği), `MoveExamCommandHandler`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/ExamInvigilatorChangedNotificationHandlerTests.cs`

**Kısıt 2 burada ısırır:** işleyici `INotificationHandler<DomainEventNotification<ExamInvigilatorChangedEvent>>` olarak bağlanır. Düz `INotificationHandler<ExamInvigilatorChangedEvent>` **hiç çalışmaz** ve test yeşil görünür — bu yüzden testin kendisi sarmalayıcıyı yayınlar.

`NotificationKind.ExamInvigilationChanged` Faz 1'de seed edildi; yeni tür açılmaz.

Zenginleşen içerikler: `ExamSchedulePublished` ve `ExamMoved` gövdesine derslik ve sıra girer ("9-B Sınıfı, 7. sıra").

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_NotifyOnlyTheAffectedTeachers()
{
    await Publisher.Publish(new DomainEventNotification<ExamInvigilatorChangedEvent>(
        new ExamInvigilatorChangedEvent(SessionId, RoomId, oldTeacherId: AyseId, newTeacherId: MehmetId)), default);

    Sent.Should().HaveCount(2);
    Sent.Select(n => n.RecipientId).Should().BeEquivalentTo([AyseId, MehmetId]);
    Sent.Should().OnlyContain(n => n.Kind == NotificationKind.ExamInvigilationChanged);
}

[Fact]
public async Task Should_NotFire_When_HandlerIsBoundToBareEvent()
{
    // Kısıt 2'nin bekçisi: sarmalayıcısız yayın hiçbir bildirim üretmemeli.
    await Publisher.Publish(new ExamInvigilatorChangedEvent(SessionId, RoomId, AyseId, MehmetId), default);
    Sent.Should().BeEmpty();
}

[Fact]
public async Task Should_IncludeRoomAndSeat_InPublishedScheduleNotification()
{
    await PublishSchedule();
    Sent.Single(n => n.Kind == NotificationKind.ExamSchedulePublished)
        .Body.Should().Contain("9-B Sınıfı").And.Contain("7. sıra");
}
```

- [ ] **Adım 2-4:** kırmızı → yaz → yeşil
- [ ] **Adım 5: Commit** — `git commit -am "feat(exams): gözetmen değişimi bildirimi ve derslik-sıra içerikleri"`

---

# Dilim 7 — İstemci

> Her görevden önce `handoff-web` (mobil görevlerde `handoff-mobile`) skill'i. Sunucu **önce** biter; ekran mock'la değil gerçek uçla açılır. Görev başlamadan API'yi yeniden başlatın — Faz 1'de bayat `:5112` süreci codegen'e boş şema ürettirdi ve birden çok tur kaybettirdi.

### Görev 7.1: `packages/core` — oturum tipleri ve saf mantık

**Files:**
- Create: `packages/core/src/exam/session.ts`, `session.test.ts`
- Modify: `packages/core/src/exam/index.ts`

**Interfaces:**
- Produces: `ExamSessionDetail`, `ExamRoomView`, `ExamSeatView`, `InvigilatorSource` tipleri; `roomFillRatio(room)`, `hasInvigilatorHole(session)`, `sectionMixOf(room)` saf fonksiyonları.

**İsim çakışması uyarısı:** Faz 1'de `groupExamsByDay` not modülünün öncülüyle çakışmıştı. Yeni adları `Session` önekiyle ayırın; barrel'da geçici takma ad bırakmayın.

- [ ] **Adım 1: Testi yaz** — `roomFillRatio` kapasite 0 olduğunda `null` döner (sıfıra bölme), `hasInvigilatorHole` dışlanmış dersliği saymaz.
- [ ] **Adım 2-4:** kırmızı → yaz → yeşil (`npm test -w packages/core`)
- [ ] **Adım 5: Commit** — `git commit -am "feat(core): oturum tipleri ve saf yardımcıları"`

---

### Görev 7.2: `packages/api` — uçlar ve query'ler

**Files:** `packages/api/src/exam/session-endpoints.ts`, `session-queries.ts`, `session-endpoints.test.ts`

- [ ] **Adım 1: Şemayı yenile** — API çalışır durumdayken `npm run codegen -w packages/api`. Üretilen şema boşsa **DURUN**: sunucu bayattır, yeniden başlatıp tekrarlayın.
- [ ] **Adım 2: Testi yaz** — her uç için yol ve yöntem doğrulaması (Faz 1'in `endpoints.test.ts` kalıbı).
- [ ] **Adım 3: Uçları ve query'leri yaz** — mutasyonlar `exam-session` ve `exam-board` anahtarlarını geçersizleştirir.
- [ ] **Adım 4: Testi koştur** — `npm test -w packages/api`
- [ ] **Adım 5: Commit** — `git commit -am "feat(api): oturum uçları ve query katmanı"`

---

### Görev 7.3: Web — yerleştirme ekranı oturum davranışı

**Files:** `apps/web/features/exam/place/*`

Pencere oturum modundaysa: saat seçimi öğretmenin kendi programıyla sınırlanmaz (K-17), şube listesi hepsi işaretli gelir ve çıkarılabilir, kaydettikten sonra oturum özeti gösterilir ("3 şube, 3 derslik, 90 öğrenci, 1 gözetmen eksik").

- [ ] **Adım 1: Durum matrisini kur** (R8) — `loading / empty / error` + "oturum modu" + "gözetmen eksik".
- [ ] **Adım 2: Ekranı yaz**
- [ ] **Adım 3: Gerçek uçla doğrula** — tarayıcıda yerleştir, oturumun doğduğunu ağ sekmesinden gör.
- [ ] **Adım 4:** `npm run typecheck && npm run lint`
- [ ] **Adım 5: Commit** — `git commit -am "feat(web): yerleştirme ekranı oturum modunu destekliyor"`

---

### Görev 7.4: Web — pano oturum görünümü

**Files:** `apps/web/features/exam/board/*` · **Tasarım kaynağı:** `web/exam-board.jsx` (2026-09-09 teslimi, oturum kartı eklenmiş hâli)

Gün × ders saati ızgarasında oturum kartları; her kartta ders adı, şube/öğrenci sayısı, gözetmen deliği rozeti, yumuşak uyarı sayısı. Karta tıklamak oturum ayrıntısını açar.

`lessonHour` modundaki pencerede kart **hiç görünmez** — Faz 1'in pano davranışı birebir korunur (Kısıt 15).

- [ ] **Adım 1-5:** durum matrisi → ekran → gerçek uçla doğrulama → typecheck/lint → commit

---

### Görev 7.5: Web — oturum ayrıntısı ekranı **(YENİ)**

**Files:** `apps/web/features/exam/session-detail/*`, `packages/ui/src/styles/exam.css` (genişler)

**Tasarım kaynağı — GATE-1 GEÇTİ (2026-09-09 teslimi):**

| Dosya | Rol |
|---|---|
| `web/exam-session.jsx` | Ekranın tamamı — **kaynak** |
| `web/exam-data.jsx` | `EXAM_SESSIONS`, `examSessionDetail()`, `EXAM_INVIGILATOR_CANDIDATES`, `EXAM_ROOM_CANDIDATES` |
| `web/exam-board.jsx` | Oturum kartı (Görev 7.4'ün kaynağı) |
| `web/exam.css` | `.exs-*` sınıfları |
| `screenshots/es-1…es-8.png` | Dokuz durumun görüntüleri |

DesignSync ile okunur (`method: "get_file"`), zip indirilmez.

**Teslim edilen yapı** — bunu takip edin, yeniden tasarlamayın:

- `ExamSessionScreen` — `PageHeader` + bağlam şeridi (`.exs-ctx`) + `.exs-split` iki sütun + `.exs-alerts`.
- `ExamSessionRoomRow` — derslik satırı: ad · `elle eklendi` etiketi · `mevcut/kapasite` (aşımda `.over`) · gözetmen + `türetildi`/`elle` rozeti · şube çipleri (tek çip kalınca `.solo` + "karışım yok").
- Sağ sütun düz sıra listesi (`.exs-seat`), iki tıkla takas; seçim durumu `pick`.
- Altı modal: `invigilator`, `addRoom`, `removeRoom`, `swap`, `regenerate`, `merge`, artı bir `info` ("Oturum nasıl kurulur?").
- `ExamSessionReasonField` — yayınlanmış pencerede her modalde zorunlu.

**Tasarımın iki açık sorusuna cevabı:** sıra listesi **düz liste** (sahte ızgara çizilmedi), sıralar **sağ sütunda** (akordeon değil). İkisi de kabul.

**ÜÇ UYUMSUZLUK — sunucu kazanır, ekran uyarlanır:**

1. **Gerekçe eşiği.** Tasarım "en az 10 karakter" yazıyor; sunucunun eşiği `ExamWindow.MinReasonLength = 15`'tir. Ekran **15** yazar ve 15'te etkinleşir. Metni de düzeltin: "En az 15 karakter."
2. **Kapasite kuralının kodu.** Tasarım mock'u `EX-S07` üretiyor; spec ve sunucu **`EX-S06`**'dır. Kodu sunucudan geldiği gibi çizin, mock'taki değeri taşımayın.
3. **Gözetmen eksikliği ekranda hesaplanıyor.** Tasarım "Yayın engeli" kartını `rooms.filter(r => !r.invigilator)` ile istemcide türetiyor ve sahte bir `EX-H` kodu basıyor. **Kısıt 4'ü çiğner.** Sunucu bunu gerçek bir ihlal olarak döndürür (`EX-H10`, Görev 4.2); ekran `violations` dizisinden çizer, kendi kuralını üretmez.

**Yeniden üretme uyarısı:** kaç takasın silineceği onay metninde yazar (Görev 3.7 `ClearedSwapCount`) — tasarım bunu zaten yapıyor.

**Kısıt 10:** tasarım `PRG_SUBJ` paletini `EXAM_SUBJECT_TONE_KEY` ile eşliyor ve şube tonlarını **aynı paletten** sırayla dağıtıyor. İkinci palet yok, aynen sürdürün; üründe eşleme `subjectColorIndex` üzerinden yapılır.

- [ ] **Adım 1: `handoff-web` gate-2/gate-3 envanteri** — teslim edilen dosyaları DesignSync ile okuyun, kullanılan ortak bileşenleri (`PageHeader`, `GradeModal`, `GIc`, `att-*` sınıfları) üründeki karşılıklarıyla eşleyin.
- [ ] **Adım 2: Durum matrisini kur** (R8) — tasarımın dokuz senaryosu: `Normal · Yükleniyor · Boş · Hata · Gözetmen eksik · Kapasite aşımı · Dersliksiz şube · Yayınlanmış · Kilitli`. Hepsi gerçek query state'ine bağlanır, yerel bayrağa değil.
- [ ] **Adım 3: Ekranı yaz** — üç uyumsuzluğu uygulayarak.
- [ ] **Adım 4: Gerçek uçla doğrula** — delik doldur, derslik çıkar, takas yap, yeniden üret, oturum birleştir; her birinin sunucuya gittiğini ağ sekmesinden gör.
- [ ] **Adım 5:** `npm run typecheck && npm run lint`
- [ ] **Adım 6: Commit** — `git commit -am "feat(web): oturum ayrıntısı ekranı"`

---

### Görev 7.6: Web — ders programı sınav etiketi

**Files:** `apps/web/features/exam/tag/*` (Faz 1, genişler)

Oturum saatinde etiket sınavın dersinin tonunu alır; öğretmen hücresinde "Gözetmen" rozeti görünür.

- [ ] **Adım 1-5:** durum matrisi → ekran → doğrulama → typecheck/lint → commit

---

### Görev 7.7: Mobil — öğrenci ve veli takvimine derslik ve sıra

**Files:** `apps/mobile/src/features/exam/components/exam-schedule-screen.tsx`

Her sınav kartına derslik adı ve sıra numarası eklenir. Ayrıntı yayınlanmamışsa ikisi de gizlenir (K-10). **Ekran içi başlık yok** (2026-09-09 kullanıcı kararı) — mevcut düzen korunur.

- [ ] **Adım 1: Durum matrisini kur** — `loading / empty / error` + "hafta duyuruldu, ayrıntı kapalı" + "oturum modu (derslik + sıra)".
- [ ] **Adım 2: Ekranı genişlet**
- [ ] **Adım 3: Cihazda doğrula**
- [ ] **Adım 4:** `npm run typecheck && npm run lint`
- [ ] **Adım 5: Commit** — `git commit -am "feat(mobile): sınav takvimine derslik ve sıra"`

---

### Görev 7.8: Öğretmen gözetmenlik takvimi (web + mobil)

**Files:** `apps/web/features/exam/duties/*`, `apps/mobile/src/features/exam/components/exam-duties.tsx`

Öğretmenin kendi sınavlarının altında gözetmenlik satırları; rozet ayrı ("Gözetmen").

- [ ] **Adım 1-5:** durum matrisi → ekranlar → doğrulama → typecheck/lint → commit

---

# Dilim 8 — Kapanış

### Görev 8.1: Uçtan uca doğrulama ve örnek veri

**Files:** yok (doğrulama görevi)

- [ ] **Adım 1:** Oturum modunda pencere aç, üç öğretmenin matematik sınavını aynı saate yerleştir.
- [ ] **Adım 2:** Panodan ikisini birleştir; dersliklerin birleştiğini ve öğrencilerin karıştığını oturum ayrıntısından doğrula.
- [ ] **Adım 3:** Bir gözetmen deliği yarat (bir şubenin o saatteki dersini arşivle), yayının **engellendiğini** gör; deliği doldur, yayının geçtiğini gör.
- [ ] **Adım 4:** Öğrenci hesabıyla mobilden derslik ve sırayı gör; veli hesabıyla çocuğunkini gör.
- [ ] **Adım 5:** Öğretmen hesabıyla gözetmenlik satırını ve program hücresindeki "Gözetmen" rozetini gör.
- [ ] **Adım 6:** Bulguları [[OKSİS - Bulgu Kayıt Defteri]]'ne işle (sohbette bırakma).

### Görev 8.2: Belgeler

- [ ] **Adım 1:** `oksis/docs/documents/modules/exams/README.md` — oturum bölümü.
- [ ] **Adım 2:** Faz 2a spec'inde §3.3'e `IsExcluded` alanını işle (Görev 3.5'in kararı).
- [ ] **Adım 3:** `domain-map` skill'i ile domain notlarını güncelle.
- [ ] **Adım 4: Commit** — `git commit -am "docs(analiz): sınav takvimi Faz 2a tamamlandı"`

---

## Görev özeti

| Dilim | Görev | Konu |
|---|---|---|
| 1 | 1.1 · 1.2 · 1.3 | Entity'ler · oturum bağı · kalıcılık ve göç |
| 2 | 2.1 · 2.2 · 2.3 · 2.4 · 2.5 | **Serpiştirme** · girdi okuma · derslik türetme · gözetmen türetme · bestekâr |
| 3 | 3.1 … 3.7 | Yönetici oturumu · öğretmen yerleştirmesi · şube · birleştirme · derslik · gözetmen · sıra |
| 4 | 4.1 · 4.2 · 4.3 | Kaldırılan kurallar · yeni sert kurallar · yayın kapısı |
| 5 | 5.1 … 5.6 | Oturum ayrıntısı · pano · öğrenci takvimi · gözetmenlik · program etiketi · **aday uçları** |
| 6 | 6.1 | Gözetmen değişimi bildirimi |
| 7 | 7.1 … 7.8 | core · api · yerleştirme · pano · **oturum ayrıntısı** · etiket · mobil · gözetmenlik |
| 8 | 8.1 · 8.2 | Uçtan uca doğrulama · belgeler |

**Toplam 35 görev.** Risk yoğunluğu Dilim 2'dedir; 2.1 planın çekirdeğidir ve dokuz testle çevrilmiştir.
