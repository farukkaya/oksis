# Resmi Tatil Tarih-Aralığı Endpoint'i (Tatiller DebtBadge Kapatma) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sihirbazın Tatiller adımındaki resmi tatilleri mock yerine gerçek master veriden göster — tarih-aralığı bazlı bir resmi-tatil endpoint'i ekle, StepHolidays'i bağla, DebtBadge'i kaldır.

**Architecture:** `GetSchoolHolidaysForSession` içindeki resmi-tatil çözümleme mantığı saf bir `OfficialHolidayResolver` helper'ına çıkarılır (DRY). Yeni `GetOfficialHolidaysInRange` query + `GET /official-holidays?start&end` endpoint'i bu helper'ı master katalog üzerinde çalıştırır. Frontend StepHolidays formdaki yeni-sezon tarihleriyle (Step 2) çağırır — gösterim-only, persistence yok.

**Tech Stack:** Backend: .NET 10, CQRS, EF Core 10, xUnit + FluentAssertions (Application.UnitTests saf helper için; Infrastructure.IntegrationTests handler için, DatabaseFixture). Frontend: React + TS, React Query, dayjs, Vitest + Testing Library + MSW.

**Genel kurallar (her task):**
- Backend `oksis-api/`, frontend `oksis-web/`, docs workspace `oksis/` — kendi repolarında commit. OKSİS commit formatı: `2026-06-09 <type>: Türkçe özet.` + boş satır + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. commit-msg hook zorunlu; heredoc aynen.
- Hardcode Türkçe string YOK (i18n). Named export, no `any`, no inline style.
- Backend test: `cd oksis-api && dotnet test <proje> --filter "FullyQualifiedName~<X>"`. DB erişilemezse: build başarısını teyit + DONE_WITH_CONCERNS + yine de commit.
- Frontend: **bu projede tsconfig/tsc YOK** — `npx tsc` çalıştırma; gate `npm run test -- <path>`.

---

## File Structure

**Backend (`oksis-api/`):**
- Create: `src/Oksis.Application/Modules/AcademicSessions/Shared/OfficialHolidayResolver.cs` — saf çözümleme helper'ı.
- Modify: `.../Queries/GetSchoolHolidaysForSession/GetSchoolHolidaysForSessionQueryHandler.cs` — helper'ı kullan (DRY).
- Create: `.../Queries/GetOfficialHolidaysInRange/GetOfficialHolidaysInRangeQuery.cs` + `...QueryHandler.cs`.
- Create: `src/Oksis.Api/Controllers/V1/OfficialHolidaysController.cs`.
- Test: `tests/Oksis.Application.UnitTests/Modules/AcademicSessions/Shared/OfficialHolidayResolverTests.cs`.
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetOfficialHolidaysInRangeTests.cs`.

**Frontend (`oksis-web/`):**
- Modify: `src/portals/admin/academic-sessions/api/academicSessionsApi.ts` — `officialHolidays(start,end)`.
- Modify: `src/portals/admin/academic-sessions/hooks/queryKeys.ts` — `officialHolidays` key.
- Modify: `src/portals/admin/academic-sessions/hooks/useAcademicSessionsQuery.ts` — `useOfficialHolidaysQuery`.
- Modify: `src/shared/i18n/locales/{tr,en}/academic-sessions.json` — yeni `holidays.*` anahtarları.
- Modify: `src/portals/admin/academic-sessions/components/wizard/steps/StepHolidays.tsx` — gerçek veri + DebtBadge kaldır.
- Test: `.../components/wizard/steps/__tests__/StepHolidays.test.tsx`.

**Docs (`oksis/`):** `.claude/docs/modules/academic-years/{api-contracts.md, completion_status.md}`.

---

## Task 1: Backend — OfficialHolidayResolver helper + GetSchoolHolidaysForSession refactor

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/Shared/OfficialHolidayResolver.cs`
- Modify: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/Queries/GetSchoolHolidaysForSession/GetSchoolHolidaysForSessionQueryHandler.cs`
- Test: `oksis-api/tests/Oksis.Application.UnitTests/Modules/AcademicSessions/Shared/OfficialHolidayResolverTests.cs`

- [ ] **Step 1: Write the failing test**

Create `tests/Oksis.Application.UnitTests/Modules/AcademicSessions/Shared/OfficialHolidayResolverTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Application.Modules.AcademicSessions.Shared;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.AcademicSessions.Shared;

public sealed class OfficialHolidayResolverTests
{
    [Fact]
    public void ResolveForRange_ProducesDatesWithinRange_AcrossYearBoundary()
    {
        var official = new List<(string Name, int Month, int Day)>
        {
            ("29 Ekim", 10, 29),
            ("23 Nisan", 4, 23),
        };

        var result = OfficialHolidayResolver.ResolveForRange(
            official, new DateOnly(2026, 9, 15), new DateOnly(2027, 6, 13));

        // 29 Ekim 2026 (aralıkta), 23 Nisan 2027 (aralıkta).
        // 23 Nisan 2026 (aralık öncesi) ve 29 Ekim 2027 (aralık sonrası) elenir.
        result.Should().HaveCount(2);
        result.Should().ContainSingle(h => h.Name == "29 Ekim" && h.StartDate == new DateOnly(2026, 10, 29));
        result.Should().ContainSingle(h => h.Name == "23 Nisan" && h.StartDate == new DateOnly(2027, 4, 23));
        result.Should().OnlyContain(h => h.Source == "OFFICIAL" && h.Type == "PublicHoliday" && h.IsRecurring);
    }

    [Fact]
    public void ResolveForRange_SkipsInvalidDates()
    {
        var official = new List<(string Name, int Month, int Day)> { ("Artık Gün", 2, 29) };

        // 2025 artık yıl değil → 2025-02-29 geçersiz, atlanır.
        var result = OfficialHolidayResolver.ResolveForRange(
            official, new DateOnly(2025, 1, 1), new DateOnly(2025, 12, 31));

        result.Should().BeEmpty();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~OfficialHolidayResolverTests"`
Expected: BUILD FAILURE — `OfficialHolidayResolver` yok.

- [ ] **Step 3: Create the resolver helper**

Create `src/Oksis.Application/Modules/AcademicSessions/Shared/OfficialHolidayResolver.cs`:

```csharp
using Oksis.Application.Modules.AcademicSessions.DTOs;

namespace Oksis.Application.Modules.AcademicSessions.Shared;

/// <summary>
/// Resmi tatilleri (master: yıldan bağımsız Month+Day) verilen tarih aralığına çözümler:
/// her tatil için aralık yıllarındaki gerçek <see cref="DateOnly"/>'yi üretir ve aralığa
/// düşenleri OFFICIAL kaynaklı <see cref="HolidayCalendarDto"/> olarak döner.
/// DB-bağımsız saf fonksiyon — hem GetSchoolHolidaysForSession hem GetOfficialHolidaysInRange kullanır.
/// </summary>
public static class OfficialHolidayResolver
{
    public static List<HolidayCalendarDto> ResolveForRange(
        IReadOnlyList<(string Name, int Month, int Day)> official,
        DateOnly start,
        DateOnly end)
    {
        var result = new List<HolidayCalendarDto>();
        foreach (var o in official)
        {
            for (var year = start.Year; year <= end.Year; year++)
            {
                if (!DateOnly.TryParse($"{year:0000}-{o.Month:00}-{o.Day:00}", out var date))
                {
                    continue; // örn. artık olmayan yılın 29 Şubat'ı
                }
                if (date < start || date > end)
                {
                    continue;
                }
                result.Add(new HolidayCalendarDto(
                    null, o.Name, date, date, "PublicHoliday", true, "OFFICIAL"));
            }
        }
        return result;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~OfficialHolidayResolverTests"`
Expected: PASS (2 test).

- [ ] **Step 5: Refactor GetSchoolHolidaysForSession to use the helper**

`GetSchoolHolidaysForSessionQueryHandler.cs`: dosya başına ekle:
```csharp
using Oksis.Application.Modules.AcademicSessions.Shared;
```
`rawOfficial` yüklemesinden SONRAKİ `var officialHolidays = new List<HolidayCalendarDto>(); foreach (...) { ... }` bloğunu (tüm foreach) şununla değiştir:
```csharp
        var officialHolidays = OfficialHolidayResolver.ResolveForRange(
            rawOfficial.Select(o => (o.Name, o.Month, o.Day)).ToList(),
            session.StartDate,
            session.EndDate);
```
(`rawOfficial` zaten `new { o.Name, o.Month, o.Day }` projeksiyonu; `merged = tenantHolidays.Concat(officialHolidays)...` satırı aynen kalır.)

- [ ] **Step 6: Build + run any existing holiday tests (regression)**

Run: `cd oksis-api && dotnet build src/Oksis.Application && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~Holiday"`
Expected: build temiz; varsa mevcut holiday testleri PASS. (Holiday integration testi yoksa "no tests matched" kabul — davranış değişmedi.)

- [ ] **Step 7: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 refactor,test: Resmi tatil çözümleme OfficialHolidayResolver helper'ına çıkarıldı; GetSchoolHolidaysForSession DRY'landı.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Backend — GetOfficialHolidaysInRange query + endpoint

**Files:**
- Create: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/Queries/GetOfficialHolidaysInRange/GetOfficialHolidaysInRangeQuery.cs`
- Create: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/Queries/GetOfficialHolidaysInRange/GetOfficialHolidaysInRangeQueryHandler.cs`
- Create: `oksis-api/src/Oksis.Api/Controllers/V1/OfficialHolidaysController.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetOfficialHolidaysInRangeTests.cs`

- [ ] **Step 1: Write the failing test**

Create `tests/Oksis.Infrastructure.IntegrationTests/Persistence/GetOfficialHolidaysInRangeTests.cs`:

```csharp
using FluentAssertions;
using Oksis.Application.Modules.AcademicSessions.Queries.GetOfficialHolidaysInRange;
using Oksis.Infrastructure.IntegrationTests.Fixtures;
using Xunit;

namespace Oksis.Infrastructure.IntegrationTests.Persistence;

/// <summary>
/// GET /official-holidays?start&end — master resmi tatilleri tarih aralığına çözümler.
/// Master official_holidays seed'i EnsureDatabaseCreated ile gelir.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class GetOfficialHolidaysInRangeTests : IAsyncLifetime
{
    private readonly DatabaseFixture _fixture;
    public GetOfficialHolidaysInRangeTests(DatabaseFixture fixture) => _fixture = fixture;
    public async Task InitializeAsync() => await _fixture.EnsureDatabaseCreatedAsync();
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Handle_ReturnsOfficialHolidaysWithinRangeAsync()
    {
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var handler = new GetOfficialHolidaysInRangeQueryHandler(db);

        var start = new DateOnly(2026, 9, 15);
        var end = new DateOnly(2027, 6, 13);
        var result = await handler.Handle(new GetOfficialHolidaysInRangeQuery(start, end), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value!.Should().NotBeEmpty();
        result.Value!.Should().OnlyContain(h => h.Source == "OFFICIAL");
        result.Value!.Should().OnlyContain(h => h.StartDate >= start && h.StartDate <= end);
    }

    [Fact]
    public async Task Handle_Fails_WhenStartAfterEndAsync()
    {
        await using var db = _fixture.CreateDbContext(Guid.NewGuid());
        var handler = new GetOfficialHolidaysInRangeQueryHandler(db);

        var result = await handler.Handle(
            new GetOfficialHolidaysInRangeQuery(new DateOnly(2027, 1, 1), new DateOnly(2026, 1, 1)),
            CancellationToken.None);

        result.IsFailure.Should().BeTrue();
        result.Error.Code.Should().Be("academic-sessions.errors.invalid-range");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetOfficialHolidaysInRangeTests"`
Expected: BUILD FAILURE — query/handler yok.

- [ ] **Step 3: Create the query**

Create `src/Oksis.Application/Modules/AcademicSessions/Queries/GetOfficialHolidaysInRange/GetOfficialHolidaysInRangeQuery.cs`:

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.DTOs;

namespace Oksis.Application.Modules.AcademicSessions.Queries.GetOfficialHolidaysInRange;

/// <summary>
/// Verilen tarih aralığındaki ulusal resmi tatilleri (master) döndürür. Sihirbaz, henüz
/// var olmayan yeni sezonun tarih aralığıyla çağırır (sessionId gerektirmez).
/// </summary>
[Tenancy(TenancyMode.Required)]
[RequirePermission("school-holidays.view")]
public sealed record GetOfficialHolidaysInRangeQuery(DateOnly Start, DateOnly End)
    : IQuery<HolidayCalendarDto[]>;
```

- [ ] **Step 4: Create the handler**

Create `.../GetOfficialHolidaysInRange/GetOfficialHolidaysInRangeQueryHandler.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.AcademicSessions.DTOs;
using Oksis.Application.Modules.AcademicSessions.Shared;
using Oksis.Shared;

namespace Oksis.Application.Modules.AcademicSessions.Queries.GetOfficialHolidaysInRange;

public sealed class GetOfficialHolidaysInRangeQueryHandler(IApplicationDbContext db)
    : IQueryHandler<GetOfficialHolidaysInRangeQuery, HolidayCalendarDto[]>
{
    public async Task<Result<HolidayCalendarDto[]>> Handle(
        GetOfficialHolidaysInRangeQuery request,
        CancellationToken cancellationToken)
    {
        if (request.Start > request.End)
        {
            return Result<HolidayCalendarDto[]>.Failure(new Error(
                "academic-sessions.errors.invalid-range",
                "Başlangıç tarihi bitiş tarihinden sonra olamaz."));
        }

        var rawOfficial = await db.OfficialHolidays
            .AsNoTracking()
            .Select(o => new { o.Name, o.Month, o.Day })
            .ToListAsync(cancellationToken);

        var holidays = OfficialHolidayResolver.ResolveForRange(
            rawOfficial.Select(o => (o.Name, o.Month, o.Day)).ToList(),
            request.Start,
            request.End);

        var ordered = holidays.OrderBy(h => h.StartDate).ToArray();
        return Result<HolidayCalendarDto[]>.Success(ordered);
    }
}
```

- [ ] **Step 5: Create the controller**

Create `src/Oksis.Api/Controllers/V1/OfficialHolidaysController.cs`:

```csharp
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Oksis.Api.Contracts;
using Oksis.Api.Extensions;
using Oksis.Application.Modules.AcademicSessions.DTOs;
using Oksis.Application.Modules.AcademicSessions.Queries.GetOfficialHolidaysInRange;

namespace Oksis.Api.Controllers.V1;

[ApiController]
[Route("api/v1/official-holidays")]
[Authorize]
[Produces("application/json")]
public sealed class OfficialHolidaysController(ISender sender) : ControllerBase
{
    [HttpGet("")]
    [ProducesResponseType(typeof(ApiResponse<HolidayCalendarDto[]>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListAsync(
        [FromQuery] DateOnly start,
        [FromQuery] DateOnly end,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new GetOfficialHolidaysInRangeQuery(start, end),
            cancellationToken);
        return result.ToHttpResult(HttpContext);
    }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetOfficialHolidaysInRangeTests"`
Expected: PASS (2 test). DB erişilemezse build teyit + DONE_WITH_CONCERNS.

- [ ] **Step 7: Commit**

```bash
cd oksis-api && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: Tarih-aralığı resmi tatil query'si + GET /official-holidays endpoint'i eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Frontend — api method + hook + queryKey + i18n

**Files:**
- Modify: `oksis-web/src/portals/admin/academic-sessions/api/academicSessionsApi.ts`
- Modify: `oksis-web/src/portals/admin/academic-sessions/hooks/queryKeys.ts`
- Modify: `oksis-web/src/portals/admin/academic-sessions/hooks/useAcademicSessionsQuery.ts`
- Modify: `oksis-web/src/shared/i18n/locales/tr/academic-sessions.json` + `.../en/academic-sessions.json`

- [ ] **Step 1: Add the api method**

`academicSessionsApi.ts` — `HolidayCalendarDto`'yu import tipine ekle (dosyada `import type { ... } from '../types';` satırına `HolidayCalendarDto` ekle) ve `terms` metodundan sonra ekle:
```ts
  officialHolidays: async (start: string, end: string): Promise<HolidayCalendarDto[]> => {
    const res = await httpClient.get<ApiEnvelope<HolidayCalendarDto[]>>(
      `/official-holidays?start=${start}&end=${end}`,
    );
    return unwrap(res.data);
  },
```

- [ ] **Step 2: Add the query key**

`queryKeys.ts` — `academicSessionsKeys` objesine `terms` satırından sonra ekle:
```ts
  officialHolidays: (start: string, end: string) =>
    [...academicSessionsKeys.all(), 'official-holidays', start, end] as const,
```

- [ ] **Step 3: Add the query hook**

`useAcademicSessionsQuery.ts` — dosya sonuna ekle:
```ts
export const useOfficialHolidaysQuery = (start: string | undefined, end: string | undefined) =>
  useQuery({
    queryKey: academicSessionsKeys.officialHolidays(start ?? '', end ?? ''),
    queryFn: () => academicSessionsApi.officialHolidays(start!, end!),
    enabled: !!start && !!end,
    staleTime: 60 * 60 * 1000, // master veri — uzun süre taze
  });
```
(`useQuery`, `academicSessionsApi`, `academicSessionsKeys` zaten import edili.)

- [ ] **Step 4: Add i18n keys (TR)**

`tr/academic-sessions.json` → `wizard.steps.holidays` objesine ekle (mevcut `official-auto` satırından sonra; virgül dengesi):
```json
          "official-empty": "Bu dönem aralığında resmi tatil bulunmuyor.",
          "official-no-dates": "Resmi tatilleri görmek için önce dönem tarihlerini belirleyin.",
          "official-load-error": "Resmi tatiller yüklenemedi.",
```

- [ ] **Step 5: Add i18n keys (EN)**

`en/academic-sessions.json` → `wizard.steps.holidays`:
```json
          "official-empty": "No public holidays fall within this term range.",
          "official-no-dates": "Set the term dates first to see the public holidays.",
          "official-load-error": "Could not load public holidays.",
```

- [ ] **Step 6: Verify JSON validity**

Run: `cd oksis-web && node -e "require('./src/shared/i18n/locales/tr/academic-sessions.json');require('./src/shared/i18n/locales/en/academic-sessions.json');console.log('ok')"`
Expected: `ok`.

- [ ] **Step 7: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat: Resmi tatil tarih-aralığı API metodu, query hook'u ve i18n anahtarları eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Frontend — StepHolidays gerçek veriye bağlanır, DebtBadge kaldırılır

**Files:**
- Modify: `oksis-web/src/portals/admin/academic-sessions/components/wizard/steps/StepHolidays.tsx`
- Test: `oksis-web/src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepHolidays.test.tsx`

- [ ] **Step 1: Inspect existing StepHolidays test (if any)**

Run: `cd oksis-web && ls src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepHolidays.test.tsx 2>/dev/null && cat src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepHolidays.test.tsx`
Eğer dosya varsa yapısını (Harness, MSW) izle; yoksa Step 2'de sıfırdan oluştur. Aşağıdaki test kodu kendi kendine yeterli (Harness dahil).

- [ ] **Step 2: Write the failing test**

`StepHolidays.test.tsx` dosyasını şununla oluştur/değiştir:

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../../../../../../shared/i18n';
import { server } from '../../../../../../../test/mswServer';
import { useAuthStore } from '../../../../../../../shared/store/authStore';
import { UserRole } from '../../../../../../../modules/identity/types/user.types';
import { ADMIN_PERMISSIONS } from '../../../../../../../test/authFixtures';
import { StepHolidays } from '../StepHolidays';
import type { SeasonWizardForm } from '../../../../schemas/seasonWizardSchema';

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'u1', schoolId: 'school-1', firstName: 'T', lastName: 'U', email: 'a@b.c',
      role: UserRole.SchoolAdmin, firstLoginRequired: false, permissions: ADMIN_PERMISSIONS },
    accessToken: 'jwt', firstLoginRequired: false,
  });
});

function Harness({ sessionStart = '2026-09-15', sessionEnd = '2027-06-13' }: { sessionStart?: string; sessionEnd?: string } = {}) {
  const methods = useForm<SeasonWizardForm>({
    defaultValues: {
      name: '2026-2027', sourceSessionId: 's1',
      copy: { terms: true, branches: true, holidays: true, assignments: true, schedule: true },
      excludePassiveStudents: true, sessionStart, sessionEnd,
      terms: { t1Start: '', t1End: '', t2Start: '', t2End: '', breakStart: '', breakEnd: '' },
      branchMap: [], holidays: [],
    },
  });
  return <FormProvider {...methods}><StepHolidays /></FormProvider>;
}

function renderStep(props?: { sessionStart?: string; sessionEnd?: string }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><Harness {...props} /></QueryClientProvider>);
}

describe('<StepHolidays />', () => {
  it('renders real official holidays from the range endpoint and no debt badge', async () => {
    server.use(http.get('*/official-holidays', () => HttpResponse.json({ data: [
      { id: null, name: '29 Ekim Cumhuriyet', startDate: '2026-10-29', endDate: '2026-10-29', type: 'PublicHoliday', isRecurring: true, source: 'OFFICIAL' },
      { id: null, name: '23 Nisan', startDate: '2027-04-23', endDate: '2027-04-23', type: 'PublicHoliday', isRecurring: true, source: 'OFFICIAL' },
    ] })));
    renderStep();
    expect(await screen.findByText(/29 Ekim Cumhuriyet/)).toBeInTheDocument();
    expect(screen.getByText(/23 Nisan/)).toBeInTheDocument();
    // DebtBadge reason metni artık yok.
    expect(screen.queryByText(/üretilmiyor/i)).not.toBeInTheDocument();
  });

  it('shows a hint when term dates are not set yet', async () => {
    renderStep({ sessionStart: '', sessionEnd: '' });
    expect(await screen.findByText(/önce dönem tarihlerini belirleyin/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepHolidays.test.tsx`
Expected: FAIL — StepHolidays hâlâ mock liste + DebtBadge kullanıyor; range endpoint çağrılmıyor.

- [ ] **Step 4: Rewrite the official-holidays section of StepHolidays**

`StepHolidays.tsx`'i güncelle:

(a) import bloğunu değiştir — `DebtBadge` importunu kaldır, `useWatch`, `dayjs`, hook ve tipi ekle:
```tsx
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Plus, Star, X } from 'lucide-react';
import { WizSwitch } from '../WizSwitch';
import { useOfficialHolidaysQuery } from '../../../hooks/useAcademicSessionsQuery';
import type { SeasonWizardForm } from '../../../schemas/seasonWizardSchema';
```

(b) Fonksiyon gövdesinin başında, mevcut `const officialHolidays = t(...official-list...)` satırını şununla değiştir:
```tsx
  const sessionStart = useWatch({ control, name: 'sessionStart' });
  const sessionEnd = useWatch({ control, name: 'sessionEnd' });
  const { data: officialHolidays = [], isError } = useOfficialHolidaysQuery(sessionStart, sessionEnd);
  const hasDates = !!sessionStart && !!sessionEnd;
```

(c) Resmi tatil bloğunu (en üstteki `<div>` — `official-label` başlığı + DebtBadge + çipler) şununla değiştir:
```tsx
      <div>
        <div className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold text-gray-700">
          {t('wizard.steps.holidays.official-label')}
          <span className="rounded-full bg-[#D7F5EC] px-2 py-0.5 text-[11px] font-bold text-[#0E7A5A]">
            {t('wizard.steps.holidays.official-auto')}
          </span>
        </div>
        {!hasDates ? (
          <p className="text-sm text-gray-500">{t('wizard.steps.holidays.official-no-dates')}</p>
        ) : isError ? (
          <p className="text-sm text-[#991B1B]">{t('wizard.steps.holidays.official-load-error')}</p>
        ) : officialHolidays.length === 0 ? (
          <p className="text-sm text-gray-500">{t('wizard.steps.holidays.official-empty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {officialHolidays.map((h) => (
              <span key={`${h.name}-${h.startDate}`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#EEF1FA] px-3 text-[13px] font-semibold text-gray-700">
                <span className="h-2 w-2 rounded-full bg-[#0E7A5A]" /> {h.name} · {dayjs(h.startDate).format('D MMM YYYY')}
              </span>
            ))}
          </div>
        )}
      </div>
```

(Alt taraf: `copy.holidays` Controller'ı, okul tatili `useFieldArray` listesi vb. AYNEN kalır.)

- [ ] **Step 5: Run test to verify it passes**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepHolidays.test.tsx`
Expected: PASS (2 test).

- [ ] **Step 6: Run the full module suite (regression)**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions`
Expected: Tüm testler PASS.

- [ ] **Step 7: Commit**

```bash
cd oksis-web && git add -A && git commit -m "$(cat <<'EOF'
2026-06-09 feat,test: Tatiller adımı resmi tatilleri gerçek tarih-aralığı endpoint'inden gösterir; mock liste + DebtBadge kaldırıldı.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Dokümantasyon

**Files (workspace `oksis/`):**
- Modify: `.claude/docs/modules/academic-years/api-contracts.md`
- Modify: `.claude/docs/modules/academic-years/completion_status.md`

- [ ] **Step 1: api-contracts.md — yeni endpoint**

`api-contracts.md`'e yeni bir endpoint girdisi ekle: `GET /api/v1/official-holidays?start=YYYY-MM-DD&end=YYYY-MM-DD` — verilen tarih aralığındaki ulusal resmi tatilleri (`HolidayCalendarDto[]`, hepsi `source="OFFICIAL"`) döndürür; izin `school-holidays.view`; `start > end` → `academic-sessions.errors.invalid-range`. Sihirbaz Tatiller adımının resmi tatil önizlemesini besler (yeni sezon henüz yokken kullanılır).

- [ ] **Step 2: completion_status.md — borç kapandı**

`Güncel` tarihini `2026-06-09` yap. ✅ bölümüne "Tatiller resmi-tatil DebtBadge borcu kapatıldı — tarih-aralığı endpoint (GET /official-holidays) + StepHolidays gerçek veriye bağlandı" satırını ekle (çözülen borç, spec sapması değil).

- [ ] **Step 3: Commit (workspace repo)**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs/modules/academic-years && git commit -m "$(cat <<'EOF'
2026-06-09 docs: Resmi tatil tarih-aralığı endpoint'i — api-contracts ve completion_status güncellendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
```

---

## Final Verification

- [ ] Backend: `cd oksis-api && dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~OfficialHolidayResolver"` ve `dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~GetOfficialHolidaysInRange"` → PASS.
- [ ] Frontend: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions` → PASS.
- [ ] Frontend build: `cd oksis-web && npm run build` → temiz.
- [ ] Manuel: sihirbaz Tatiller adımında resmi tatiller gerçek tarihlerle (örn. "29 Ekim Cumhuriyet · 29 Eki 2026") görünür; "D" rozeti yok.
