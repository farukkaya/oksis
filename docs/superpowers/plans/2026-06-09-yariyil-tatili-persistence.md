# Yarıyıl Tatili Kalıcılaştırma (DebtBadge Kapatma) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sihirbazdaki Yarıyıl Tatili'ni düzenlenebilir + kalıcı yap — sezon açılırken `Holiday(SemesterBreak)` olarak yazılsın, DebtBadge kalksın.

**Architecture:** Yarıyıl tatili yeni bir `Holiday(HolidayType.SemesterBreak)` olarak (canlı tenant tatil entity'si) yeni sezona bağlı saklanır; 2-dönem modeli (BR-AS-004) korunur. Break tarihleri sihirbaz formunda (`terms.breakStart/breakEnd`) tutulur, taslağın `termDatesJson`'una yazılır ve `OpenSeasonFromDraft` materyalize eder.

**Tech Stack:** Backend: .NET 10, CQRS, EF Core 10 (HolidayType `HasConversion<string>()` → enum eklemek migration gerektirmez), xUnit + FluentAssertions (Infrastructure.IntegrationTests, DatabaseFixture). Frontend: React + TS, Zod, RHF, dayjs, Vitest + Testing Library.

**Genel kurallar (her task):**
- Backend `oksis-api/`, frontend `oksis-web/` — kendi repolarında commit. OKSİS commit formatı: `2026-06-09 <type>: Türkçe özet.` + boş satır + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. commit-msg hook zorunlu; heredoc blokları aynen kullanılır.
- Hardcode Türkçe string YOK (i18n). Named export, no `any`, no inline style.
- Backend test: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~<X>"`. DB erişilemezse (ortam hatası), `dotnet build` başarısını teyit et, DONE_WITH_CONCERNS bildir, yine de commit et.
- Frontend test: `cd oksis-web && npm run test -- <path>`. **Bu projede tsconfig/tsc YOK** — `npx tsc` çalıştırma; gate Vitest.

---

## File Structure

**Backend (`oksis-api/`):**
- Modify: `src/Oksis.Domain/Modules/Schools/Enums/HolidayType.cs` — `SemesterBreak` değeri.
- Modify: `src/Oksis.Application/Modules/AcademicSessions/Commands/OpenSeasonFromDraft/OpenSeasonFromDraftCommandHandler.cs` — `TermDates` + break persist.
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/OpenSeasonFromDraftTests.cs` — yeni testler (mevcut dosyaya ekle).

**Frontend (`oksis-web/`):**
- Modify: `src/portals/admin/academic-sessions/schemas/seasonWizardSchema.ts` — break alanları + refine + draft round-trip.
- Test: `src/portals/admin/academic-sessions/schemas/__tests__/seasonWizardSchema.test.ts`.
- Modify: `src/shared/i18n/locales/{tr,en}/academic-sessions.json` — `wizard.errors.break-range`.
- Modify: `src/portals/admin/academic-sessions/types/index.ts` — `HolidayType` union.
- Modify: `src/portals/admin/academic-sessions/components/wizard/steps/StepTerms.tsx` — editable break, DebtBadge kaldır.
- Test: `src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepTerms.test.tsx`.
- Modify: `src/portals/admin/academic-sessions/pages/SeasonWizardPage.tsx` — DEFAULTS'a break alanları.

**Docs (`oksis/` workspace):**
- Modify: `.claude/docs/modules/academic-years/{business-rules.md, domain-model.md, completion_status.md}`.

---

## Task 1: Backend — SemesterBreak enum + OpenSeasonFromDraft persist

**Files:**
- Modify: `oksis-api/src/Oksis.Domain/Modules/Schools/Enums/HolidayType.cs`
- Modify: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/Commands/OpenSeasonFromDraft/OpenSeasonFromDraftCommandHandler.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Persistence/OpenSeasonFromDraftTests.cs`

- [ ] **Step 1: Write the failing tests**

`OpenSeasonFromDraftTests.cs` dosyasına, mevcut `ValidTermDatesJson()` helper'ının HEMEN ALTINA yeni bir helper ekle:

```csharp
    /// <summary>Geçerli break tarihleri içeren TermDatesJson (T1End 2027-01-23, T2Start 2027-02-10 arası).</summary>
    private static string TermDatesJsonWithBreak() => JsonSerializer.Serialize(new
    {
        Start = "2026-09-15",
        End = "2027-06-13",
        T1Start = "2026-09-15",
        T1End = "2027-01-23",
        T2Start = "2027-02-10",
        T2End = "2027-06-13",
        BreakStart = "2027-01-24",
        BreakEnd = "2027-02-09",
    });

    /// <summary>Break, 2. dönem başlangıcıyla çakışan (geçersiz) TermDatesJson.</summary>
    private static string TermDatesJsonWithInvalidBreak() => JsonSerializer.Serialize(new
    {
        Start = "2026-09-15",
        End = "2027-06-13",
        T1Start = "2026-09-15",
        T1End = "2027-01-23",
        T2Start = "2027-02-10",
        T2End = "2027-06-13",
        BreakStart = "2027-01-24",
        BreakEnd = "2027-02-10", // == T2Start → geçersiz (breakEnd < T2Start olmalı)
    });
```

Ve sınıfın sonuna (son `}` öncesi) iki test ekle:

```csharp
    [Fact]
    public async Task Handle_CreatesSemesterBreakHoliday_WhenBreakDatesPresentAsync()
    {
        var schoolId = await SeedSchoolAsync();
        var sourceSessionId = await SeedMinimalSourceSessionAsync(schoolId);

        var tenantCtx = new TestTenantContext(schoolId);
        await using (var draftDb = _fixture.CreateDbContext(schoolId))
        {
            var draft = SeasonDraft.Create(schoolId, "2026-2027", sourceSessionId);
            draft.UpdateProgress(
                name: "2026-2027", sourceSessionId: sourceSessionId, currentStep: 3,
                copyTerms: true, copyBranches: false, copyHolidays: false,
                copyAssignments: false, copySchedule: false, excludePassive: false,
                termDatesJson: TermDatesJsonWithBreak(), branchMapJson: null, holidaysJson: null);
            draftDb.SeasonDrafts.Add(draft);
            await draftDb.SaveChangesAsync();
        }

        await using var handlerDb = _fixture.CreateDbContext(schoolId);
        var result = await new OpenSeasonFromDraftCommandHandler(handlerDb, tenantCtx)
            .Handle(new OpenSeasonFromDraftCommand(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();

        await using var assertDb = _fixture.CreateDbContext(schoolId);
        var holidays = await assertDb.Holidays.AsNoTracking()
            .Where(h => h.AcademicSessionId == result.Value)
            .ToListAsync();
        holidays.Should().ContainSingle();
        var brk = holidays[0];
        brk.HolidayType.Should().Be(Oksis.Domain.Modules.Schools.Enums.HolidayType.SemesterBreak);
        brk.HolidayDate.Should().Be(new DateOnly(2027, 1, 24));
        brk.EndDate.Should().Be(new DateOnly(2027, 2, 9));
    }

    [Fact]
    public async Task Handle_RejectsBreakOutsideTermBoundsAsync()
    {
        var schoolId = await SeedSchoolAsync();
        var sourceSessionId = await SeedMinimalSourceSessionAsync(schoolId);

        var tenantCtx = new TestTenantContext(schoolId);
        await using (var draftDb = _fixture.CreateDbContext(schoolId))
        {
            var draft = SeasonDraft.Create(schoolId, "2026-2027", sourceSessionId);
            draft.UpdateProgress(
                name: "2026-2027", sourceSessionId: sourceSessionId, currentStep: 3,
                copyTerms: true, copyBranches: false, copyHolidays: false,
                copyAssignments: false, copySchedule: false, excludePassive: false,
                termDatesJson: TermDatesJsonWithInvalidBreak(), branchMapJson: null, holidaysJson: null);
            draftDb.SeasonDrafts.Add(draft);
            await draftDb.SaveChangesAsync();
        }

        await using var handlerDb = _fixture.CreateDbContext(schoolId);
        var result = await new OpenSeasonFromDraftCommandHandler(handlerDb, tenantCtx)
            .Handle(new OpenSeasonFromDraftCommand(), CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("academic-sessions.errors.break-invalid");

        await using var assertDb = _fixture.CreateDbContext(schoolId);
        (await assertDb.AcademicSessions.AsNoTracking().AnyAsync(s => s.Name == "2026-2027"))
            .Should().BeFalse("geçersiz break sezonu geri almalı");
    }
```

Bu testler `copyBranches: false` kullandığından şube seed'ine ihtiyaç yok; küçük bir kaynak sezon seed helper'ı gerekir. `SeedSchoolAsync()`'in hemen altına ekle:

```csharp
    /// <summary>copyBranches=false testleri için minimal kaynak sezon (tek dönem yapısı yeterli).</summary>
    private async Task<Guid> SeedMinimalSourceSessionAsync(Guid schoolId)
    {
        await using var db = _fixture.CreateDbContext(schoolId);
        var termTypeIds = await db.AcademicTermTypes.AsNoTracking()
            .OrderBy(t => t.DisplayOrder).Take(2).Select(t => t.Id).ToListAsync();
        var session = AcademicSession.Create(
            schoolId, "2025-2026",
            new DateOnly(2025, 9, 15), new DateOnly(2026, 6, 13),
            termTypeIds[0], new DateOnly(2025, 9, 15), new DateOnly(2026, 1, 23),
            termTypeIds[1], new DateOnly(2026, 2, 10), new DateOnly(2026, 6, 13));
        session.Activate(DateTimeOffset.UtcNow, previousSessionId: null);
        db.AcademicSessions.Add(session);
        await db.SaveChangesAsync();
        return session.Id;
    }
```

(Not: `SeedSchoolAsync` ve `SeedMinimalSourceSessionAsync` aynı `EnsureGradeLevelAsync` vb. master seed'lerine bağlı değil; mevcut `SeedSchoolAsync` yeterli okul + tenant kurar. Eğer `AcademicTermTypes` master seed `EnsureDatabaseCreatedAsync` ile gelmiyorsa, mevcut testlerdeki gibi zaten seed'lidir — `ValidTermDatesJson` testi de aynı term type'lara güvenir.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~OpenSeasonFromDraftTests"`
Expected: BUILD FAILURE veya FAIL — `HolidayType.SemesterBreak` yok ve handler break yazmıyor.

- [ ] **Step 3: Add `SemesterBreak` to the enum**

`src/Oksis.Domain/Modules/Schools/Enums/HolidayType.cs` içindeki enum gövdesine son değer olarak ekle (mevcut `ClosedDay`'den sonra, virgül dengesine dikkat):

```csharp
    /// <summary>Eğitim öğretime kapalı diğer günler (örn. seminer, yarıyıl tatili).</summary>
    ClosedDay,

    /// <summary>Yarıyıl tatili (1. ve 2. dönem arasındaki resmî ara tatil).</summary>
    SemesterBreak
}
```

(String saklandığı için yeni değer geriye dönük uyumlu; migration gerekmez.)

- [ ] **Step 4: Extend `TermDates` and persist the break in the handler**

`OpenSeasonFromDraftCommandHandler.cs`:

(a) Dosya başındaki `using` bloğuna ekle:
```csharp
using Oksis.Domain.Modules.Schools.Entities;
using Oksis.Domain.Modules.Schools.Enums;
```

(b) `TermDates` record'unu güncelle (iki nullable alan ekle):
```csharp
    private sealed record TermDates(
        DateOnly Start,
        DateOnly End,
        DateOnly T1Start,
        DateOnly T1End,
        DateOnly T2Start,
        DateOnly T2End,
        DateOnly? BreakStart = null,
        DateOnly? BreakEnd = null);
```

(c) `// 8. TODO Task 8: CopyHolidays açıksa taslak okul tatilleri + resmi tatiller burada eklenecek.` satırını şununla değiştir:
```csharp
        // 8. Yarıyıl tatili: taslakta break tarihleri varsa Holiday(SemesterBreak) olarak yaz.
        //    (Genel okul tatili kopyalama hâlâ ayrı bir iş — buraya dahil değil.)
        if (termDates.BreakStart is { } breakStart && termDates.BreakEnd is { } breakEnd)
        {
            if (breakStart <= termDates.T1End || breakStart > breakEnd || breakEnd >= termDates.T2Start)
            {
                return Result<Guid>.Failure(new Error(
                    "academic-sessions.errors.break-invalid",
                    "Yarıyıl tatili 1. dönem bitişi ile 2. dönem başlangıcı arasında olmalı."));
            }

            db.Holidays.Add(Holiday.Create(
                schoolId.Value,
                session.Id,
                "Yarıyıl Tatili",
                breakStart,
                breakEnd,
                HolidayType.SemesterBreak,
                isRecurring: false,
                description: null));
        }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~OpenSeasonFromDraftTests"`
Expected: PASS (mevcut + 2 yeni test). DB erişilemezse `dotnet build` başarısını teyit edip DONE_WITH_CONCERNS bildir.

- [ ] **Step 6: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: Yarıyıl tatili sezon açılışında Holiday(SemesterBreak) olarak kalıcılaştırılır; sınır doğrulaması eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Frontend — schema break alanları + refine + draft round-trip

**Files:**
- Modify: `oksis-web/src/portals/admin/academic-sessions/schemas/seasonWizardSchema.ts`
- Modify: `oksis-web/src/portals/admin/academic-sessions/pages/SeasonWizardPage.tsx` (DEFAULTS)
- Test: `oksis-web/src/portals/admin/academic-sessions/schemas/__tests__/seasonWizardSchema.test.ts`

- [ ] **Step 1: Write the failing tests**

`seasonWizardSchema.test.ts` içindeki `base` objesinin `terms` alanına break ekle (mevcut `base.terms` satırını değiştir):
```ts
  terms: { t1Start: '2026-09-07', t1End: '2027-01-22', t2Start: '2027-02-08', t2End: '2027-06-25', breakStart: '2027-01-23', breakEnd: '2027-02-07' },
```

Ve dosya sonundaki `describe('seasonWizardSchema', ...)` bloğunun içine yeni testler ekle (son `});` öncesi):
```ts
  describe('semester break range', () => {
    const withBreak = (breakStart: string, breakEnd: string) =>
      seasonWizardSchema.safeParse({ ...base, terms: { ...base.terms, breakStart, breakEnd } });
    const breakError = (bs: string, be: string): string | undefined => {
      const r = withBreak(bs, be);
      if (r.success) return undefined;
      return r.error.issues.find((i) => i.path.join('.') === 'terms.breakStart')?.message;
    };

    it('accepts a break strictly between term 1 end and term 2 start', () => {
      // base.terms: t1End 2027-01-22, t2Start 2027-02-08
      expect(breakError('2027-01-23', '2027-02-07')).toBeUndefined();
    });
    it('rejects a break that overlaps term 2 start', () => {
      expect(breakError('2027-01-23', '2027-02-08')).toBe('wizard.errors.break-range');
    });
    it('rejects a break that starts on/before term 1 end', () => {
      expect(breakError('2027-01-22', '2027-02-07')).toBe('wizard.errors.break-range');
    });
    it('rejects an inverted break (start after end)', () => {
      expect(breakError('2027-02-01', '2027-01-25')).toBe('wizard.errors.break-range');
    });
  });

  it('round-trips break dates through save/rehydrate', () => {
    const input = toSaveDraftInput(base, 2);
    expect(JSON.parse(input.termDatesJson!)).toMatchObject({ BreakStart: '2027-01-23', BreakEnd: '2027-02-07' });
    const form = fromDraftDto({
      id: 'd1', name: '2026-2027', sourceSessionId: 's1', currentStep: 2,
      copyTerms: true, copyBranches: true, copyHolidays: true, copyAssignments: true,
      copySchedule: true, excludePassiveStudents: false,
      termDatesJson: input.termDatesJson, branchMapJson: '[]', holidaysJson: null,
    });
    expect(form.terms.breakStart).toBe('2027-01-23');
    expect(form.terms.breakEnd).toBe('2027-02-07');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/schemas/__tests__/seasonWizardSchema.test.ts`
Expected: FAIL — `breakStart`/`breakEnd` şemada yok, refine yok, round-trip taşımıyor.

- [ ] **Step 3: Add break fields + refine to the schema**

`seasonWizardSchema.ts`'te `terms: z.object({ ... })` satırını şununla değiştir:
```ts
  terms: z
    .object({
      t1Start: isoDate, t1End: isoDate, t2Start: isoDate, t2End: isoDate,
      breakStart: isoDate, breakEnd: isoDate,
    })
    .superRefine((t, ctx) => {
      const iso = /^\d{4}-\d{2}-\d{2}$/;
      // Sınır alanları geçerli ISO değilse ilgili isoDate hataları yeterli; break kontrolünü atla.
      if (![t.t1End, t.t2Start, t.breakStart, t.breakEnd].every((d) => iso.test(d))) return;
      // Yarıyıl tatili: T1End < breakStart ≤ breakEnd < T2Start (ISO string'ler sözlüksel karşılaştırılabilir).
      if (!(t.t1End < t.breakStart && t.breakStart <= t.breakEnd && t.breakEnd < t.t2Start)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['breakStart'], message: 'wizard.errors.break-range' });
      }
    }),
```

`TermDatesJsonShape` interface'ine iki alan ekle:
```ts
interface TermDatesJsonShape {
  Start: string; End: string;
  T1Start: string; T1End: string; T2Start: string; T2End: string;
  BreakStart: string; BreakEnd: string;
}
```

`toSaveDraftInput` içindeki `termDates` nesnesine ekle:
```ts
  const termDates: TermDatesJsonShape = {
    Start: form.sessionStart, End: form.sessionEnd,
    T1Start: form.terms.t1Start, T1End: form.terms.t1End,
    T2Start: form.terms.t2Start, T2End: form.terms.t2End,
    BreakStart: form.terms.breakStart, BreakEnd: form.terms.breakEnd,
  };
```

`fromDraftDto` içindeki `terms:` nesnesine ekle:
```ts
    terms: {
      t1Start: td.T1Start ?? '', t1End: td.T1End ?? '',
      t2Start: td.T2Start ?? '', t2End: td.T2End ?? '',
      breakStart: td.BreakStart ?? '', breakEnd: td.BreakEnd ?? '',
    },
```

- [ ] **Step 4: Add break to wizard DEFAULTS**

`SeasonWizardPage.tsx`'teki `DEFAULTS` sabitinde `terms:` satırını değiştir:
```ts
  terms: { t1Start: '', t1End: '', t2Start: '', t2End: '', breakStart: '', breakEnd: '' }, branchMap: [], holidays: [],
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/schemas/__tests__/seasonWizardSchema.test.ts`
Expected: PASS (mevcut + yeni testler).

- [ ] **Step 6: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: Sihirbaz şemasına yarıyıl tatili (breakStart/breakEnd) + sınır doğrulaması ve draft round-trip eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Frontend — i18n break-range + HolidayType union

**Files:**
- Modify: `oksis-web/src/shared/i18n/locales/tr/academic-sessions.json`
- Modify: `oksis-web/src/shared/i18n/locales/en/academic-sessions.json`
- Modify: `oksis-web/src/portals/admin/academic-sessions/types/index.ts`

- [ ] **Step 1: Add the `break-range` key (TR)**

`tr/academic-sessions.json` → `wizard.errors` objesine ekle (mevcut `name-same-as-source` satırından sonra; virgül dengesine dikkat):
```json
        "name-same-as-source": "Yeni sezon kaynak sezonla aynı yıl olamaz.",
        "break-range": "Yarıyıl tatili 1. dönem bitişi ile 2. dönem başlangıcı arasında olmalı.",
```

- [ ] **Step 2: Add the `break-range` key (EN)**

`en/academic-sessions.json` → `wizard.errors`:
```json
        "name-same-as-source": "The new season cannot be the same year as the source season.",
        "break-range": "The mid-term break must fall between the end of term 1 and the start of term 2.",
```

- [ ] **Step 3: Add `SemesterBreak` to the frontend HolidayType union**

`types/index.ts`'teki satırı değiştir:
```ts
export type HolidayType = 'PublicHoliday' | 'SchoolEvent' | 'ClosedDay' | 'SemesterBreak';
```

- [ ] **Step 4: Verify JSON validity**

Run: `cd oksis-web && node -e "require('./src/shared/i18n/locales/tr/academic-sessions.json');require('./src/shared/i18n/locales/en/academic-sessions.json');console.log('ok')"`
Expected: `ok`.

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat: Yarıyıl tatili için break-range i18n anahtarı ve HolidayType union'ına SemesterBreak eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Frontend — StepTerms editable break + DebtBadge kaldırma

**Files:**
- Modify: `oksis-web/src/portals/admin/academic-sessions/components/wizard/steps/StepTerms.tsx`
- Test: `oksis-web/src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepTerms.test.tsx`

- [ ] **Step 1: Update the StepTerms tests (TDD — adjust for editable break)**

`StepTerms.test.tsx`'te `Harness`'ın `terms` defaultlarını break alanlarıyla güncelle. `Harness` içindeki `terms ?? { ... }` satırını değiştir:
```ts
      terms: terms ?? { t1Start: '', t1End: '', t2Start: '', t2End: '', breakStart: '', breakEnd: '' }, branchMap: [], holidays: [],
```

"fills +1 year shifted dates when copy is on" testini güncelle — break artık editable olduğu için 6 adet disabled-olmayan date input var (sıra: t1Start, t1End, breakStart, breakEnd, t2Start, t2End). Mevcut assertion bloğunu şununla değiştir:
```ts
    const dateInputs = () => container.querySelectorAll('input[type="date"]:not([disabled])');
    await waitFor(() => {
      expect((dateInputs()[0] as HTMLInputElement).value).toBe('2026-09-08'); // t1Start
    });
    expect((dateInputs()[1] as HTMLInputElement).value).toBe('2027-01-16'); // t1End
    expect((dateInputs()[2] as HTMLInputElement).value).toBe('2027-01-17'); // breakStart = t1End+1
    expect((dateInputs()[3] as HTMLInputElement).value).toBe('2027-02-01'); // breakEnd = t2Start-1
    expect((dateInputs()[4] as HTMLInputElement).value).toBe('2027-02-02'); // t2Start
    expect((dateInputs()[5] as HTMLInputElement).value).toBe('2027-06-26'); // t2End
```

"clears default dates and shows the manual note when copy is off" testinde, `terms` prop'una break alanlarını ekle ve break'in de temizlendiğini doğrula. Mevcut Harness çağrısındaki `terms={{ ... }}`'i değiştir:
```tsx
        <Harness copyTerms={false} terms={{ t1Start: '2026-09-08', t1End: '2027-01-16', t2Start: '2027-02-02', t2End: '2027-06-26', breakStart: '2027-01-17', breakEnd: '2027-02-01' }} />
```
ve `expect((dateInputs()[1] ...).toBe('')` satırından sonra ekle:
```ts
    expect((dateInputs()[2] as HTMLInputElement).value).toBe(''); // breakStart temizlendi
```

Yeni bir test ekle (DebtBadge artık yok):
```ts
  it('no longer renders the debt badge on the semester break row', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { queryByText } = render(<QueryClientProvider client={qc}><Harness copyTerms={false} /></QueryClientProvider>);
    // DebtBadge "D" rozetini render etmez (reason metni de görünmez).
    expect(queryByText(/ayrı saklamaz/i)).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepTerms.test.tsx`
Expected: FAIL — break inputları editable değil/index'ler kaymış, DebtBadge hâlâ var.

- [ ] **Step 3: Make the break editable + remove DebtBadge**

`StepTerms.tsx`'i güncelle:

(a) `DebtBadge` importunu kaldır:
```ts
import { CalendarDays } from 'lucide-react';
import dayjs from 'dayjs';
import { useTermsForSessionQuery } from '../../../hooks/useAcademicSessionsQuery';
import { WizSwitch } from '../WizSwitch';
import type { SeasonWizardForm } from '../../../schemas/seasonWizardSchema';
```
(yani `import { DebtBadge } from '../../../../../../shared/components/DebtBadge';` satırı silinir.)

(b) Copy-fill effect'ine break default türetmesini ekle. Effect içindeki dört `setValue('terms.t...')` çağrısından sonra, `filledRef.current = true;`'dan önce ekle:
```ts
    const t1EndShifted = shiftYear(ordered[0].endDate, 1);
    const t2StartShifted = shiftYear(ordered[1].startDate, 1);
    setValue('terms.breakStart', addDays(t1EndShifted, 1));
    setValue('terms.breakEnd', addDays(t2StartShifted, -1));
```

(c) Copy-off temizleme bloğuna break temizliğini ekle. `if (!copyTerms) { ... }` içindeki dört `setValue('terms.t...', '')` satırından sonra ekle:
```ts
      setValue('terms.breakStart', '');
      setValue('terms.breakEnd', '');
```

(d) Artık türetme yapan iki satırı kaldır (salt-okunur break hesapları):
```ts
  // SİL: const breakStart = addDays(watch('terms.t1End'), 1);
  // SİL: const breakEnd = addDays(watch('terms.t2Start'), -1);
```
(`addDays` fonksiyonu hâlâ effect'te kullanılıyor; importu/tanımı kalır.)

(e) `formState.errors` erişimi için `useFormContext` destructuring'ini güncelle:
```ts
  const { control, register, watch, setValue, getValues, formState: { errors } } = useFormContext<SeasonWizardForm>();
```

(f) Yarıyıl Tatili satırını (DebtBadge'li, disabled input'lu blok) şununla değiştir:
```tsx
        {/* Yarıyıl Tatili — Holiday(SemesterBreak) olarak kalıcılaşır; editable */}
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-3">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="h-2 w-2 rounded-[3px] bg-[#0E7A5A]" />
            {t('wizard.steps.terms.semester-break')}
          </span>
          <input type="date" aria-label={`${t('wizard.steps.terms.semester-break')} ${t('wizard.steps.terms.start')}`}
            className={['rounded-md border px-3 py-2', errors.terms?.breakStart ? 'border-[#991B1B] bg-[#FEE2E2]/40' : 'border-gray-200'].join(' ')}
            {...register('terms.breakStart')} />
          <input type="date" aria-label={`${t('wizard.steps.terms.semester-break')} ${t('wizard.steps.terms.end')}`}
            className={['rounded-md border px-3 py-2', errors.terms?.breakStart ? 'border-[#991B1B] bg-[#FEE2E2]/40' : 'border-gray-200'].join(' ')}
            {...register('terms.breakEnd')} />
        </div>
        {errors.terms?.breakStart?.message && (
          <span className="text-xs font-medium text-[#991B1B]">{t(errors.terms.breakStart.message)}</span>
        )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepTerms.test.tsx`
Expected: PASS (güncellenen + yeni test).

- [ ] **Step 5: Run the full module suite (regression)**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions`
Expected: Tüm testler PASS.

- [ ] **Step 6: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: Yarıyıl tatili StepTerms'te editable yapıldı (kopyada otomatik türetilir, kapalıda temizlenir); DebtBadge kaldırıldı.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Dokümantasyon

**Files (workspace `oksis/`):**
- Modify: `.claude/docs/modules/academic-years/business-rules.md`
- Modify: `.claude/docs/modules/academic-years/domain-model.md`
- Modify: `.claude/docs/modules/academic-years/completion_status.md`

- [ ] **Step 1: business-rules.md — BR-AS-004 notu**

BR-AS-004 bölümünün altına kısa bir not ekle: yarıyıl tatili modelde T1/T2 arası boşluktur; sihirbazda düzenlenip sezon açılışında `Holiday(SemesterBreak)` olarak kalıcılaşır (`OpenSeasonFromDraft`), `T1End < BreakStart ≤ BreakEnd < T2Start` doğrulamasıyla. Ayrı bir 3. dönem DEĞİLDİR.

- [ ] **Step 2: domain-model.md — HolidayType notu**

`Holiday`/`HolidayType` ile ilgili bölüme (veya enum listesine) `SemesterBreak` değerinin eklendiğini ve yarıyıl tatilini temsil ettiğini yaz. Kullanılmayan ikiz `SchoolHoliday` entity'sinin dormant olduğunu kısa bir notla belirt.

- [ ] **Step 3: completion_status.md — borç kapandı**

`Güncel` tarihini `2026-06-09` yap. ✅ bölümüne "Yarıyıl tatili DebtBadge borcu kapatıldı — Holiday(SemesterBreak) olarak persist + StepTerms editable" satırını ekle. Eğer "⚠️ Spec Dışına Çıkılanlar" altında ilgili bir borç maddesi varsa çözüldü olarak işaretle. Bu bir spec sapması değil, çözülen borçtur.

- [ ] **Step 4: Commit (workspace repo)**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs/modules/academic-years && git commit -m "$(cat <<'EOF'
2026-06-09 docs: Yarıyıl tatili Holiday(SemesterBreak) kalıcılaştırması — business-rules, domain-model, completion_status güncellendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

- [ ] Backend: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~OpenSeasonFromDraftTests"` → PASS.
- [ ] Frontend: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions` → PASS.
- [ ] Frontend build: `cd oksis-web && npm run build` → temiz.
- [ ] Manuel doğrulama: sihirbaz Dönem Geçişi adımında yarıyıl tatili artık düzenlenebilir, "D" rozeti yok; sezon açılınca tatil takvimde görünür.
