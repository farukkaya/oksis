# Geçici Değişiklik Editör-Merkezli Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Geçici değişikliği editör-merkezli yap — editörde "Vekil Öğretmen Ata" / "Ders İptal" geçici aksiyonları, Yayınla drawer'ında "Geçici değişiklik" türü + tarih ile yalnız o tarih için `ScheduleException` olarak yayınlanır; 2.5B-2'nin yanlış composite form'u kaldırılır.

**Architecture:** İki değişiklik dünyası ayrı tutulur (her oturum tek tür). Kalıcı düzenlemeler mevcut `editorDraft` op-log'undan akar; geçici aksiyonlar ayrı bir **bekleyen-istisna tamponunda** (`tempActions`) birikip Yayınla drawer'ında seçilen tek tarihle P25 (`createException`) döngüsüyle uygulanır. Backend tarafında yalnız **`GetAvailableTeachers`** sorgusu yeni; istisna oluşturma (P25) hazır.

**Tech Stack:** Backend .NET 10 / EF Core 10 / MediatR (CQRS) / FluentValidation · Frontend React 18 + TS / React Query v5 / dnd-kit / Radix Popover / i18next / vitest.

**Tasarım dokümanı:** `.claude/plans/2026-06-13-ders-programi-faz2-5b-redesign-gecici-degisiklik-design.md`

---

## Dosya Haritası

**Backend (oksis-api):**
- Create: `src/Oksis.Application/Modules/Timetable/Queries/GetAvailableTeachers/GetAvailableTeachersQuery.cs`
- Create: `.../GetAvailableTeachers/GetAvailableTeachersQueryHandler.cs`
- Modify: `src/Oksis.Application/Modules/Timetable/DTOs/ScheduleExceptionDtos.cs` (yeni `AvailableTeacherDto`)
- Modify: `src/Oksis.Api/Controllers/V1/SchedulingController.cs` (yeni `GET .../available-teachers`)
- Create test: `tests/Oksis.Application.UnitTests/Modules/Timetable/GetAvailableTeachersQueryHandlerTests.cs`

**Frontend (oksis-web):**
- Create: `src/portals/admin/timetable/editor/lib/tempActions.ts` (saf model + diff)
- Create test: `src/portals/admin/timetable/editor/lib/__tests__/tempActions.test.ts`
- Create: `src/portals/admin/timetable/editor/hooks/useTempActions.ts`
- Modify: `src/portals/admin/timetable/editor/api/editorLookups.ts` (`fetchAvailableTeachers`)
- Modify: `src/portals/admin/timetable/api/timetableApi.ts` (zaten `createException` var — değişmez)
- Modify: `src/portals/admin/timetable/editor/components/CellMenu.tsx` (2 geçici aksiyon + branş filtresi)
- Modify: `src/portals/admin/timetable/editor/components/WeekGrid.tsx` + `GridCell.tsx` (geçici işaret + yeni prop'lar)
- Modify: `src/portals/admin/timetable/ScheduleEditorPage.tsx` (tempActions wiring + ayrı-tut guard)
- Modify: `src/portals/admin/timetable/components/PublishDrawer.tsx` (yayın türü gating + tarih + temp diff + apply döngüsü)
- Delete: `src/portals/admin/timetable/components/TemporaryChangePanel.tsx` + testi + `lib/temporaryChange.ts` + testi
- Modify: i18n `src/shared/i18n/locales/{tr,en}/timetable.json` (yeni `editor.cellMenu.*`, `publish.temp.*`)
- Modify: `src/portals/admin/timetable/editor/editor.css` + `timetable.css` (geçici aksiyon stilleri)

---

## FAZ A — Backend: GetAvailableTeachers

### Task A1: AvailableTeacherDto + Query sözleşmesi

**Files:**
- Modify: `src/Oksis.Application/Modules/Timetable/DTOs/ScheduleExceptionDtos.cs`
- Create: `src/Oksis.Application/Modules/Timetable/Queries/GetAvailableTeachers/GetAvailableTeachersQuery.cs`

- [ ] **Step 1: DTO ekle** (`ScheduleExceptionDtos.cs` sonuna)

```csharp
/// <summary>Vekil öğretmen seçimi için o slotta müsait öğretmen.</summary>
public sealed record AvailableTeacherDto(Guid Id, string Name);
```

- [ ] **Step 2: Query ekle** (`GetAvailableTeachersQuery.cs`)

```csharp
using Oksis.Application.Common.Attributes;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;

namespace Oksis.Application.Modules.Timetable.Queries.GetAvailableTeachers;

[Tenancy(TenancyMode.Required)]
[RequirePermission("timetable.manage")]
public sealed record GetAvailableTeachersQuery(
    Guid ProgramId,
    int Day,
    int Period) : IQuery<IReadOnlyList<AvailableTeacherDto>>;
```

- [ ] **Step 3: Build doğrula** — Run: `dotnet build src/Oksis.Application` · Expected: PASS.

### Task A2: GetAvailableTeachersQueryHandler (TDD)

**Files:**
- Create test: `tests/Oksis.Application.UnitTests/Modules/Timetable/GetAvailableTeachersQueryHandlerTests.cs`
- Create: `src/Oksis.Application/Modules/Timetable/Queries/GetAvailableTeachers/GetAvailableTeachersQueryHandler.cs`

> **Aday öğretmen kaynağı — uygulamadan ÖNCE doğrula:** `ListScheduleExceptionsQueryHandler` (satır 60-64)
> öğretmen isimlerini `db.Persons` üzerinden çözüyor; öğretmen-rol filtresinin nasıl yapıldığını bul:
> `grep -rn "PersonType\|TeacherProfile\|teacher" src/Oksis.Application/Modules/Teachers/Queries | head`.
> Mevcut `/users/persons` ucu öğretmenleri döndürdüğü için aynı filtreyi (öğretmen rolü/profili) burada kullan.
> "Busy" kümesi yapısal yerleşimlerden hesaplanır (occupancy); aynı tarihte zaten vekil atanmış öğretmen
> çakışması Debt (Step 4 notu).

- [ ] **Step 1: Failing test yaz**

```csharp
using FluentAssertions;
using Oksis.Application.Modules.Timetable.Queries.GetAvailableTeachers;
using Xunit;

namespace Oksis.Application.UnitTests.Modules.Timetable;

public sealed class GetAvailableTeachersQueryHandlerTests
{
    // Kurulum: 2 öğretmen (T1, T2). T1 Salı(2). period'da başka bir programda aktif yerleşimli.
    // Program P, AcademicTermId = Term. Sorgu: Day=Salı, Period=2 → yalnız T2 müsait dönmeli.
    [Fact]
    public async Task Handle_excludes_teacher_busy_at_slot()
    {
        var fx = GetAvailableTeachersFixture.Build(busyTeacherAt: (day: 2, period: 2));
        var handler = new GetAvailableTeachersQueryHandler(fx.Db, fx.Tenant);

        var result = await handler.Handle(
            new GetAvailableTeachersQuery(fx.ProgramId, Day: 2, Period: 2), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Select(t => t.Id).Should().NotContain(fx.BusyTeacherId);
        result.Value.Select(t => t.Id).Should().Contain(fx.FreeTeacherId);
    }

    [Fact]
    public async Task Handle_empty_when_all_busy()
    {
        var fx = GetAvailableTeachersFixture.BuildAllBusy(day: 2, period: 2);
        var handler = new GetAvailableTeachersQueryHandler(fx.Db, fx.Tenant);

        var result = await handler.Handle(
            new GetAvailableTeachersQuery(fx.ProgramId, Day: 2, Period: 2), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }
}
```

> `GetAvailableTeachersFixture` — mevcut Timetable handler testlerindeki in-memory/mock DbSet desenini izle
> (örn. `ListScheduleExceptionsQueryHandlerTests` veya `CreateScheduleExceptionCommandHandlerTests` fixture'ı).
> `NSubstitute .Returns(BuildMockDbSet())` inline KIRILIR → önce değişkene al (proje gerçeklik notu).

- [ ] **Step 2: Test fail doğrula** — Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetAvailableTeachers"` · Expected: FAIL (handler yok / fixture yok).

- [ ] **Step 3: Handler implement et** (`ListScheduleExceptionsQueryHandler` desenini birebir izle)

```csharp
using Microsoft.EntityFrameworkCore;
using Oksis.Application.Common.Abstractions;
using Oksis.Application.Common.Cqrs;
using Oksis.Application.Modules.Timetable.DTOs;
using Oksis.Shared;

namespace Oksis.Application.Modules.Timetable.Queries.GetAvailableTeachers;

public sealed class GetAvailableTeachersQueryHandler(
    IApplicationDbContext db,
    ITenantContext tenant)
    : IQueryHandler<GetAvailableTeachersQuery, IReadOnlyList<AvailableTeacherDto>>
{
    public async Task<Result<IReadOnlyList<AvailableTeacherDto>>> Handle(
        GetAvailableTeachersQuery request, CancellationToken ct)
    {
        if (tenant.CurrentSchoolId is null)
        {
            return Result<IReadOnlyList<AvailableTeacherDto>>.Forbidden();
        }

        var program = await db.SchedulePrograms.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProgramId, ct);
        if (program is null)
        {
            return Result<IReadOnlyList<AvailableTeacherDto>>.NotFound();
        }

        var day = (DayOfWeek)request.Day;

        // Bu dönemdeki TÜM programlarda o slotta aktif yerleşimi olan öğretmenler = dolu.
        var busy = await db.SchedulePrograms.AsNoTracking()
            .Where(p => p.AcademicTermId == program.AcademicTermId)
            .SelectMany(p => p.Placements)
            .Where(pl => pl.IsActive && pl.Day == day && pl.Period == request.Period)
            .Select(pl => pl.TeacherId)
            .Distinct()
            .ToListAsync(ct);

        // Aday öğretmenler: okuldaki öğretmen-kişiler (öğretmen-rol filtresi A2 öncesi doğrulandı).
        var candidates = await db.Persons.AsNoTracking()
            .Where(/* öğretmen rolü filtresi — doğrulanan koşul */)
            .Where(p => !busy.Contains(p.Id))
            .Select(p => new AvailableTeacherDto(p.Id, p.Name.FullName))
            .OrderBy(t => t.Name)
            .ToListAsync(ct);

        return Result<IReadOnlyList<AvailableTeacherDto>>.Success(candidates);
    }
}
```

- [ ] **Step 4: Test geç doğrula** — Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~GetAvailableTeachers"` · Expected: PASS.

> **Debt-BE-5 (vekil-vekil çakışması):** "Busy" yalnız yapısal yerleşimleri sayar; aynı tarihte zaten başka
> bir derse vekil atanmış öğretmen müsait görünebilir. Tarih-bazlı vekil çakışması ileride
> (`ScheduleException` o tarih için de kontrol) eklenecek.

- [ ] **Step 5: Commit**

```bash
git add src/Oksis.Application/Modules/Timetable/Queries/GetAvailableTeachers tests/Oksis.Application.UnitTests/Modules/Timetable/GetAvailableTeachersQueryHandlerTests.cs src/Oksis.Application/Modules/Timetable/DTOs/ScheduleExceptionDtos.cs
git commit -m "2026-06-13 feat: Ders Programı müsait öğretmen sorgusu (vekil öğretmen için)."
```

### Task A3: Controller endpoint

**Files:**
- Modify: `src/Oksis.Api/Controllers/V1/SchedulingController.cs` (`ListExceptionsAsync`'ten sonra, sınıf kapanışından önce)

- [ ] **Step 1: Endpoint ekle**

```csharp
[HttpGet("programs/{id:guid}/available-teachers")]
[ProducesResponseType(typeof(ApiResponse<IReadOnlyList<AvailableTeacherDto>>), StatusCodes.Status200OK)]
public async Task<IActionResult> GetAvailableTeachersAsync(
    Guid id, [FromQuery] int day, [FromQuery] int period, CancellationToken cancellationToken)
{
    var result = await sender.Send(new GetAvailableTeachersQuery(id, day, period), cancellationToken);
    return result.ToHttpResult(HttpContext);
}
```

(Üstte `using Oksis.Application.Modules.Timetable.Queries.GetAvailableTeachers;` ekle.)

- [ ] **Step 2: Build doğrula** — Run: `dotnet build Oksis.slnx --no-restore` · Expected: PASS.

- [ ] **Step 3: Format + commit**

```bash
dotnet format
git add src/Oksis.Api/Controllers/V1/SchedulingController.cs
git commit -m "2026-06-13 feat: Ders Programı available-teachers endpoint'i eklendi."
```

---

## FAZ B — Frontend saf model: tempActions (TDD)

### Task B1: tempActions saf modülü

**Files:**
- Create: `src/portals/admin/timetable/editor/lib/tempActions.ts`
- Create test: `src/portals/admin/timetable/editor/lib/__tests__/tempActions.test.ts`

- [ ] **Step 1: Failing test yaz**

```ts
import { describe, it, expect } from "vitest";
import {
  initTemp, addSubstitute, addCancel, removeTemp, hasTemp, toExceptionBodies,
  type TempState,
} from "../tempActions";

const base: TempState = initTemp();

describe("tempActions", () => {
  it("starts empty", () => {
    expect(hasTemp(base)).toBe(false);
    expect(base.actions).toEqual([]);
  });

  it("adds a substitute action keyed by placement", () => {
    const s = addSubstitute(base, { placementId: "p1", newTeacherId: "t9" });
    expect(hasTemp(s)).toBe(true);
    expect(s.actions).toEqual([{ kind: "substitute", placementId: "p1", newTeacherId: "t9" }]);
  });

  it("replaces existing action on same placement", () => {
    const s1 = addCancel(base, { placementId: "p1" });
    const s2 = addSubstitute(s1, { placementId: "p1", newTeacherId: "t9" });
    expect(s2.actions).toHaveLength(1);
    expect(s2.actions[0].kind).toBe("substitute");
  });

  it("removes an action", () => {
    const s = removeTemp(addCancel(base, { placementId: "p1" }), "p1");
    expect(hasTemp(s)).toBe(false);
  });

  it("maps actions to P25 exception bodies for a date", () => {
    const s = addSubstitute(addCancel(base, { placementId: "p1" }), { placementId: "p2", newTeacherId: "t9" });
    const bodies = toExceptionBodies(s, "2026-02-16", "reason");
    expect(bodies).toEqual([
      { date: "2026-02-16", type: "Cancellation", targetPlacementId: "p1", newTeacherId: null, newRoomId: null, reason: "reason" },
      { date: "2026-02-16", type: "TeacherSubstitution", targetPlacementId: "p2", newTeacherId: "t9", newRoomId: null, reason: "reason" },
    ]);
  });
});
```

- [ ] **Step 2: Test fail doğrula** — Run: `npm run test -- tempActions` · Expected: FAIL (modül yok).

- [ ] **Step 3: tempActions.ts implement et**

```ts
// editor/lib/tempActions.ts
import type { CreateExceptionInput } from "../../types";

export type TempAction =
  | { kind: "substitute"; placementId: string; newTeacherId: string }
  | { kind: "cancel"; placementId: string };

export interface TempState {
  actions: TempAction[];
}

export function initTemp(): TempState {
  return { actions: [] };
}

export function hasTemp(s: TempState): boolean {
  return s.actions.length > 0;
}

function upsert(s: TempState, action: TempAction): TempState {
  const rest = s.actions.filter((a) => a.placementId !== action.placementId);
  return { actions: [...rest, action] };
}

export function addSubstitute(s: TempState, a: { placementId: string; newTeacherId: string }): TempState {
  return upsert(s, { kind: "substitute", ...a });
}

export function addCancel(s: TempState, a: { placementId: string }): TempState {
  return upsert(s, { kind: "cancel", placementId: a.placementId });
}

export function removeTemp(s: TempState, placementId: string): TempState {
  return { actions: s.actions.filter((a) => a.placementId !== placementId) };
}

/** Bekleyen aksiyonları seçilen tek tarihle P25 gövdelerine çevir (sıralı uygulama için). */
export function toExceptionBodies(s: TempState, date: string, reason: string): CreateExceptionInput[] {
  return s.actions.map((a) =>
    a.kind === "cancel"
      ? { date, type: "Cancellation", targetPlacementId: a.placementId, newTeacherId: null, newRoomId: null, reason }
      : { date, type: "TeacherSubstitution", targetPlacementId: a.placementId, newTeacherId: a.newTeacherId, newRoomId: null, reason },
  );
}
```

> `CreateExceptionInput` mevcut `types.ts`'te var (`extends ExceptionInput { reason }`). Alan adları:
> `date, type, targetPlacementId, newTeacherId, newRoomId, reason`. Step 1 test'i bunları doğrular.

- [ ] **Step 4: Test geç doğrula** — Run: `npm run test -- tempActions` · Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/timetable/editor/lib/tempActions.ts src/portals/admin/timetable/editor/lib/__tests__/tempActions.test.ts
git commit -m "2026-06-13 feat: Ders Programı editör geçici-aksiyon saf modeli (tempActions)."
```

---

## FAZ C — Frontend API + hook

### Task C1: fetchAvailableTeachers lookup

**Files:**
- Modify: `src/portals/admin/timetable/editor/api/editorLookups.ts`

- [ ] **Step 1: Fonksiyon ekle** (dosya sonuna; `fetchTeacherNames` desenini izle)

```ts
/** O gün/period'da müsait öğretmenler (vekil için). */
export async function fetchAvailableTeachers(
  programId: string,
  day: number,
  period: number,
  signal?: AbortSignal,
): Promise<Map<string, string>> {
  const res = await httpClient.get<ApiEnvelope<IdName[]>>(
    `/timetable/programs/${programId}/available-teachers?day=${day}&period=${period}`,
    { signal },
  );
  return new Map(res.data.data.map((t) => [t.id, t.name]));
}
```

> `IdName`/`ApiEnvelope` tipleri bu dosyada zaten tanımlı (fetchSubjectNames kullanıyor). Backend `AvailableTeacherDto`
> `{ id, name }` döner → `IdName` ile birebir.

- [ ] **Step 2: typecheck** — Run: `npm run build` (veya `npx tsc --noEmit`) · Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/portals/admin/timetable/editor/api/editorLookups.ts
git commit -m "2026-06-13 feat: Ders Programı müsait öğretmen lookup'ı (web)."
```

### Task C2: useTempActions hook

**Files:**
- Create: `src/portals/admin/timetable/editor/hooks/useTempActions.ts`

- [ ] **Step 1: Hook yaz** (tempActions state sarmalayıcı; `useEditorDraft` desenini izle)

```ts
import { useState, useCallback } from "react";
import {
  initTemp, addSubstitute, addCancel, removeTemp, hasTemp, type TempState,
} from "../lib/tempActions";

export function useTempActions() {
  const [state, setState] = useState<TempState>(initTemp);

  const substitute = useCallback(
    (placementId: string, newTeacherId: string) => setState((s) => addSubstitute(s, { placementId, newTeacherId })),
    [],
  );
  const cancel = useCallback(
    (placementId: string) => setState((s) => addCancel(s, { placementId })),
    [],
  );
  const remove = useCallback((placementId: string) => setState((s) => removeTemp(s, placementId)), []);
  const reset = useCallback(() => setState(initTemp()), []);

  return { state, hasTemp: hasTemp(state), substitute, cancel, remove, reset };
}
```

- [ ] **Step 2: typecheck** — Run: `npm run build` · Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/portals/admin/timetable/editor/hooks/useTempActions.ts
git commit -m "2026-06-13 feat: Ders Programı geçici-aksiyon hook'u (useTempActions)."
```

---

## FAZ D — CellMenu: 2 geçici aksiyon + branş filtresi

### Task D1: CellMenu prop'ları ve menü öğeleri

**Files:**
- Modify: `src/portals/admin/timetable/editor/components/CellMenu.tsx`

- [ ] **Step 1: Props arayüzünü genişlet** (mevcut `Props`'a ekle)

```ts
interface Props {
  placement: PlacementDto;
  lookups: NameLookups;
  /** Geçici aksiyonlar yalnız Yayında programda aktif. */
  canTemp: boolean;
  /** "Öğretmen Değiştir" alt-menüsü: bu dersin branşındaki öğretmenler (subjectId filtreli). */
  branchTeachers: Map<string, string>;
  /** Vekil alt-menüsü açılınca yüklenen müsait öğretmenler (id→ad) veya null (yükleniyor). */
  availableTeachers: Map<string, string> | null;
  availableLoading: boolean;
  onOpenSubstitute: () => void; // müsait öğretmenleri fetch'i tetikler
  onAssignTeacher: (teacherId: string) => void;
  onAssignRoom: (roomId: string | null) => void;
  onSubstitute: (newTeacherId: string) => void;
  onCancelLesson: () => void;
  onRemove: () => void;
}
```

- [ ] **Step 2: Alt-menü state'ine yeni dallar ekle**

`useState<null | "teacher" | "room">` → `useState<null | "teacher" | "room" | "substitute">`.

- [ ] **Step 3: "Öğretmen Değiştir" alt-menüsünü branş filtresine bağla**

`sub === "teacher"` dalında `[...lookups.teachers]` yerine `[...branchTeachers]` kullan (geri kalan render aynı).

- [ ] **Step 4: Ana menüye geçici aksiyonları + ayraç ekle** (mevcut `<>` kök dalında, "Derslik değiştir" `<button>`'dan sonra, mevcut ayraç+Kaldır'dan önce)

```tsx
{canTemp && (
  <>
    <div className="sed-cmenu-sep" />
    <button type="button" className="sed-cmenu-item" onClick={() => { setSub("substitute"); onOpenSubstitute(); }}>
      <UserCheck size={15} /> {t("editor.cellMenu.substitute")}
      <ChevronRight size={14} className="chev" />
    </button>
    <button type="button" className="sed-cmenu-item warn" onClick={() => { onCancelLesson(); close(); }}>
      <CalendarX size={15} /> {t("editor.cellMenu.cancelLesson")}
    </button>
  </>
)}
```

(Üstte `UserCheck, CalendarX` lucide importuna ekle.)

- [ ] **Step 5: Vekil alt-menüsü dalı ekle** (`sub === "substitute"` için, "room" dalına benzer)

```tsx
{sub === "substitute" && (
  <div className="sed-cmenu-sub">
    <div className="h">{t("editor.cellMenu.pickSubstitute")}</div>
    {availableLoading ? (
      <div className="sed-cmenu-empty">{t("editor.cellMenu.loading")}</div>
    ) : !availableTeachers || availableTeachers.size === 0 ? (
      <div className="sed-cmenu-empty">{t("editor.cellMenu.noAvailable")}</div>
    ) : (
      [...availableTeachers].map(([id, name]) => (
        <button key={id} type="button" className="sed-cmenu-opt"
          onClick={() => { onSubstitute(id); close(); }}>
          {name}
        </button>
      ))
    )}
  </div>
)}
```

> Mevcut üçlü ternary (`sub === "teacher" ? ... : sub === "room" ? ... : <>...</>`) yapısını koru;
> "substitute" dalını "room"dan sonra, kök `<>` dalından önce ekle (ya da render'ı net tut).

- [ ] **Step 6: Build/typecheck** — Run: `npm run build` · Expected: PASS (kullanıcı henüz bağlanmadıysa ScheduleEditorPage geçici TS hatası verebilir; D2'de bağlanacak — bu task'ı D2 ile birlikte commit'le).

### Task D2: ScheduleEditorPage — tempActions wiring + ayrı-tut guard

**Files:**
- Modify: `src/portals/admin/timetable/ScheduleEditorPage.tsx`
- Modify: `src/portals/admin/timetable/editor/components/WeekGrid.tsx` ve `GridCell.tsx` (CellMenu prop'larını geçir)

- [ ] **Step 1: Hook'ları ekle** (`ScheduleEditorPage` gövdesi, `precheck` satırından sonra)

```ts
const temp = useTempActions();
const isPublished = data.status === "Published";
// Ayrı tut: kalıcı op-log doluyken geçici, geçici tampon doluyken kalıcı aksiyon kilitlenir.
const tempLocked = draft.dirty;       // kalıcı değişiklik varsa geçici disabled
const permLocked = temp.hasTemp;      // geçici varsa kalıcı disabled
```

- [ ] **Step 2: Branş öğretmenleri türetici** (assignment verisinden; client-side, backend yok)

```ts
// data.unplaced TÜM görevlendirme satırlarını içerir (yerleşmiş dahil) → subjectId→teacher set.
const teachersBySubject = useMemo(() => {
  const m = new Map<string, Map<string, string>>();
  for (const a of data.unplaced) {
    const inner = m.get(a.subjectId) ?? new Map<string, string>();
    inner.set(a.teacherId, data.lookups.teachers.get(a.teacherId) ?? "—");
    m.set(a.subjectId, inner);
  }
  return m;
}, [data.unplaced, data.lookups.teachers]);
```

> **Doğrula:** `data.unplaced` öğelerinin `subjectId`+`teacherId` taşıdığını `UnplacedLessonDto` tipinden teyit et.
> Taşımıyorsa branş filtresi için fallback = `data.lookups.teachers` (tümü) + **Debt-FE-10** (branş filtresi verisi yok).

- [ ] **Step 3: Müsait öğretmen state + fetch** (lookup'ı CellMenu'nün açtığı slota göre çek)

```ts
const [subSlot, setSubSlot] = useState<{ day: number; period: number } | null>(null);
const availQ = useQuery({
  queryKey: tenantScopedKey(schoolId, ["timetable", "available", id, subSlot?.day ?? -1, subSlot?.period ?? -1] as const),
  queryFn: ({ signal }) => fetchAvailableTeachers(id, subSlot!.day, subSlot!.period, signal),
  enabled: Boolean(schoolId && subSlot),
});
```

> `schoolId`/`tenantScopedKey`/`useQuery` importları gerekiyor (TemporaryChangePanel'deki gibi:
> `useAuthStore`, `tenantScopedKey`, `@tanstack/react-query`). `fetchAvailableTeachers` editorLookups'tan.

- [ ] **Step 4: CellMenu handler'larını geçir** (WeekGrid → GridCell → CellMenu prop zinciri)

```ts
// handlers
const handleSubstitute = (pid: string, teacherId: string) => temp.substitute(pid, teacherId);
const handleCancelLesson = (pid: string) => temp.cancel(pid);
const openSubstitute = (day: number, period: number) => setSubSlot({ day, period });
```

WeekGrid/GridCell'e yeni prop'lar: `canTemp={isPublished && !tempLocked}`, `branchTeachers={teachersBySubject.get(placement.subjectId) ?? data.lookups.teachers}`, `availableTeachers={availQ.data ?? null}`, `availableLoading={availQ.isLoading}`, `onOpenSubstitute={() => openSubstitute(placement.day, placement.period)}`, `onSubstitute`, `onCancelLesson`. Mevcut kalıcı aksiyonlar (`onAssignTeacher/onAssignRoom/onRemove`) `permLocked` iken disabled — CellMenu'de bu üç öğeyi `disabled={permLocked}` ile işaretle (D1'e küçük ekleme: kök daldaki üç kalıcı item'a `disabled` ekle ve prop al).

- [ ] **Step 5: Geçici işaretleme — grid hücresinde** (geçici aksiyonu olan hücre görsel işaret)

`temp.state.actions` placementId set'ini WeekGrid'e geçir (`tempIds: Set<string>`); GridCell `tempIds.has(placement.id)` ise `.sed-cell.temp` sınıfı + küçük rozet (iptal=üstü çizili, vekil=kişi ikonu). Stil E faz'ında.

- [ ] **Step 6: PublishDrawer'a temp verisini geçir** (mevcut `<PublishDrawer .../>` çağrısına)

```tsx
<PublishDrawer
  programId={id}
  className={data.className}
  branchId={data.program?.branchId}
  status={data.status}
  tempActions={temp.state}
  tempLessonInfo={/* placementId→{subject,teacher,day,period} özet, görsel diff için */}
  onTempApplied={() => { temp.reset(); data.refetch(); }}
  localIssues={...}
  onGotoIssue={gotoIssueCell}
  onClose={() => setPublishOpen(false)}
  onPublished={data.refetch}
/>
```

- [ ] **Step 7: Build doğrula** — Run: `npm run build` · Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/portals/admin/timetable/editor/components/CellMenu.tsx src/portals/admin/timetable/editor/components/WeekGrid.tsx src/portals/admin/timetable/editor/components/GridCell.tsx src/portals/admin/timetable/ScheduleEditorPage.tsx
git commit -m "2026-06-13 feat: Ders Programı editör geçici aksiyonları (vekil/iptal) + branş filtresi + ayrı-tut guard."
```

---

## FAZ E — PublishDrawer: yayın türü gating + tarih + temp apply

### Task E1: Yayın türü gating (kalıcı disabled + warning + notification)

**Files:**
- Modify: `src/portals/admin/timetable/components/PublishDrawer.tsx`

- [ ] **Step 1: Yeni prop'lar** (mevcut `Props`'a ekle)

```ts
status?: string;
tempActions?: TempState;            // editor/lib/tempActions
tempLessonInfo?: Map<string, { subject: string; teacher: string; day: number; period: number }>;
onTempApplied?: () => void;
```

- [ ] **Step 2: Yayın türü kararını temp'e bağla**

```ts
const hasTempActions = Boolean(props.tempActions && props.tempActions.actions.length > 0);
// hasTempActions ise kalıcı disabled + geçici zorunlu; değilse tersine geçici disabled.
useEffect(() => { if (hasTempActions) setPubType("temporary"); }, [hasTempActions]);
const permDisabled = hasTempActions;
```

- [ ] **Step 3: "Kalıcı yayın" seçeneğini disable + tıklama notification'ı**

Mevcut `permanent` `pub-seg-opt` butonuna: `disabled={permDisabled}` + `onClick={() => permDisabled ? notifyTempOnly() : setPubType("permanent")}` (disabled buton click almayacağı için, üstüne saran div'e veya `title` + ayrı uyarı satırına bağla — basit yol: butonu disabled yapma, `onClick`'te `permDisabled` ise toast). `notifyTempOnly` = mevcut toast altyapısı (yoksa `pub-error`/uyarı satırı). i18n `publish.temp.permBlocked`.

- [ ] **Step 4: Warning bar** (drawer üstünde, `hasTempActions` iken)

```tsx
{hasTempActions && (
  <div className="pub-warnbar" role="status">
    <AlertTriangle size={15} />
    <span>{t("publish.temp.onlyTemporary")}</span>
  </div>
)}
```

- [ ] **Step 5: typecheck** — Run: `npm run build` · Expected: PASS.

### Task E2: Geçici diff (§2) + tarih + apply döngüsü

**Files:**
- Modify: `src/portals/admin/timetable/components/PublishDrawer.tsx`

- [ ] **Step 1: Temporary panel içeriği** — mevcut `pubType === "temporary"` dalındaki `<TemporaryChangePanel .../>`'i **kaldır**, yerine inline temp özeti + tarih:

```tsx
) : (
  <>
    <section className="pub-sec">
      <div className="pub-sec-h">{t("publish.temp.changesTitle")}</div>
      <div className="pub-diff">
        {props.tempActions?.actions.map((a) => {
          const info = props.tempLessonInfo?.get(a.placementId);
          return (
            <div className="pub-diff-row" key={a.placementId}>
              <span className="when">{info ? `${t(`editor.weekdays.${info.day}`)} · ${info.period}. ${t("publish.temp.period")}` : "—"}</span>
              <span className="chg">
                {a.kind === "cancel"
                  ? <span className="now">{t("publish.temp.cancelled")}</span>
                  : <span className="now">{info?.teacher} → {props.tempLessonInfo /* yeni öğretmen adını lookups'tan çöz */ && a.newTeacherId}</span>}
              </span>
            </div>
          );
        })}
      </div>
    </section>
    <section className="pub-sec">
      <div className="pub-sec-h"><Calendar size={14} /> {t("publish.temp.date")}</div>
      <input type="date" className="inp" value={tempDate} aria-label={t("publish.temp.date")}
        onChange={(e) => setTempDate(e.target.value)} />
    </section>
    {tempError && <div className="pub-error" role="alert">{tempError}</div>}
  </>
)
```

> Yeni öğretmen adı çözümü için drawer'a bir teacher-name lookup geçmek gerekebilir (ya da `tempLessonInfo`'ya
> `newTeacher` ekle ScheduleEditorPage'de hesaplayıp geçirerek — tercih edilen: D2 Step 6'da `tempLessonInfo`
> yapısını `{ subject, teacher, newTeacher?, day, period }` yap).

- [ ] **Step 2: Tarih state + apply mutation**

```ts
const [tempDate, setTempDate] = useState("");
const [tempError, setTempError] = useState<string | null>(null);
const applyTemp = useMutation({
  mutationFn: async () => {
    const bodies = toExceptionBodies(props.tempActions!, tempDate, note.trim() || t("publish.temp.defaultReason"));
    for (const b of bodies) {
      await timetableApi.createException(programId, b); // sıralı; ilk hata yukarı taşınır
    }
  },
  onSuccess: () => { setStep("done"); props.onTempApplied?.(); },
  onError: (e) => setTempError(t((getApiErrorCode(e) ?? "").replace(/^timetable\./, ""), { defaultValue: t("publish.temp.applyFailed") })),
});
```

> `toExceptionBodies` editor/lib/tempActions'tan. `note` zaten drawer state'inde (sürüm notu = sebep).
> Atomiklik **Debt-FE-11**: döngü tek-tek; ilk 409'da kalanlar uygulanmaz, kullanıcı hangi tarihte hangi
> aksiyonların oluştuğunu görür (başarı ekranı + kalanları tekrar dener). Tasarım dokümanı §6 ile uyumlu.

- [ ] **Step 3: Alt buton — temporary için**

`pubType === "temporary"` iken alt foot butonu "Geçici Değişikliği Uygula" → `applyTemp.mutate()`, disabled koşulu: `!tempDate || !hasTempActions || applyTemp.isPending`. (Mevcut `pubType === "permanent"` foot'u korunur; temporary için ayrı foot render et.)

- [ ] **Step 4: Done ekranı — temporary metni** — `step === "done"` dalında `applyTemp` başarısında geçici-özel başlık (`publish.temp.appliedTitle` + tarih). `pubType` ayrımıyla metni seç.

- [ ] **Step 5: Build doğrula** — Run: `npm run build` · Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/portals/admin/timetable/components/PublishDrawer.tsx
git commit -m "2026-06-13 feat: Ders Programı Yayınla — geçici değişiklik türü gating + tarih + uygula döngüsü."
```

---

## FAZ F — Eski composite form'u kaldır + i18n + stiller + doğrulama

### Task F1: TemporaryChangePanel + temporaryChange.ts sil

**Files:**
- Delete: `src/portals/admin/timetable/components/TemporaryChangePanel.tsx`
- Delete: `src/portals/admin/timetable/components/__tests__/TemporaryChangePanel.test.tsx`
- Delete: `src/portals/admin/timetable/lib/temporaryChange.ts`
- Delete: `src/portals/admin/timetable/lib/__tests__/temporaryChange.test.ts`

- [ ] **Step 1: Import'u kaldır** — `PublishDrawer.tsx`'te `import { TemporaryChangePanel }` satırını sil (E2'de zaten kullanım kalktı).

- [ ] **Step 2: Dosyaları sil**

```bash
git rm src/portals/admin/timetable/components/TemporaryChangePanel.tsx \
       src/portals/admin/timetable/components/__tests__/TemporaryChangePanel.test.tsx \
       src/portals/admin/timetable/lib/temporaryChange.ts \
       src/portals/admin/timetable/lib/__tests__/temporaryChange.test.ts
```

- [ ] **Step 3: Build doğrula** — Run: `npm run build` · Expected: PASS (artık referans yok).

### Task F2: i18n anahtarları (tr + en)

**Files:**
- Modify: `src/shared/i18n/locales/tr/timetable.json` + `.../en/timetable.json`

- [ ] **Step 1: `editor.cellMenu.*` ekle** (tr)

```json
"substitute": "Vekil Öğretmen Ata",
"cancelLesson": "Ders İptal",
"pickSubstitute": "Müsait öğretmen seç",
"noAvailable": "Müsait öğretmen yok",
"loading": "Yükleniyor…"
```

(en karşılıkları: "Assign Substitute Teacher", "Cancel Lesson", "Pick available teacher", "No available teacher", "Loading…")

- [ ] **Step 2: `publish.temp.*` güncelle/ekle** (eski composite-form anahtarlarından gereksizleri bırak, yenileri ekle)

tr: `"onlyTemporary": "Bu değişiklikler kalıcı programı bozmadan yalnızca seçilen tarih için yayınlanır."`,
`"permBlocked": "Vekil öğretmen / ders iptali yalnızca geçici olarak yayınlanabilir."`,
`"changesTitle": "Geçici değişiklikler"`, `"date": "Tarih"`, `"period": "saat"`, `"cancelled": "Ders iptal"`,
`"apply": "Geçici Değişikliği Uygula"`, `"appliedTitle": "Geçici değişiklik uygulandı"`,
`"applyFailed": "Uygulanamadı"`, `"defaultReason": "Geçici değişiklik"`. (en karşılıkları yazılır.)

- [ ] **Step 3: Build + typecheck** — Run: `npm run build` · Expected: PASS (hardcoded TR yok).

- [ ] **Step 4: Commit**

```bash
git add src/shared/i18n/locales/tr/timetable.json src/shared/i18n/locales/en/timetable.json src/portals/admin/timetable/components/PublishDrawer.tsx
git rm ... # F1 silinenler bu commit'e dahil
git commit -m "2026-06-13 refactor: Ders Programı geçici değişiklik composite form kaldırıldı, editör-merkezli akışa geçildi; i18n güncellendi."
```

### Task F3: Stiller (CellMenu geçici öğeler + grid temp işareti + warnbar)

**Files:**
- Modify: `src/portals/admin/timetable/editor/editor.css` + `src/portals/admin/timetable/timetable.css`

- [ ] **Step 1: editor.css — geçici menü + hücre işareti**

```css
.sed-cmenu-item.warn { color: var(--warning, #B05A0A); }
.sed-cmenu-empty { padding: 8px 12px; color: var(--muted); font-size: 12px; }
.sed-cell.temp { box-shadow: inset 0 0 0 2px var(--warning-bg, #FEF3C7); }
.sed-cell.temp .tt-cancel { text-decoration: line-through; opacity: .6; }
```

- [ ] **Step 2: timetable.css — publish warnbar**

```css
.pub-warnbar { display:flex; gap:8px; align-items:center; padding:10px 14px;
  background: var(--warning-bg, #FEF3C7); color: var(--warning, #B05A0A);
  border-radius: 10px; margin: 0 0 12px; font-size: 13px; }
```

- [ ] **Step 3: Build doğrula** — Run: `npm run build` · Expected: PASS. (Inline style YASAK — yalnız sınıf.)

- [ ] **Step 4: Commit**

```bash
git add src/portals/admin/timetable/editor/editor.css src/portals/admin/timetable/timetable.css
git commit -m "2026-06-13 style: Ders Programı geçici aksiyon + Yayınla uyarı çubuğu stilleri."
```

### Task F4: Tam paket + build + döküman güncelleme

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md`
- Modify: `.claude/docs/modules/timetable/api-contracts.md` (P28 available-teachers)

- [ ] **Step 1: Tüm web testleri** — Run: `npm run test` · Expected: PASS (silinen 2 test düştü, tempActions yeni geçti). Kırılırsa düzelt.

- [ ] **Step 2: Backend testleri** — Run: `dotnet test tests/Oksis.Application.UnitTests --filter "FullyQualifiedName~Timetable"` · Expected: PASS.

- [ ] **Step 3: api-contracts.md** — P28 satırı ekle: `GET /api/v1/timetable/programs/{id}/available-teachers?day=&period=` · `timetable.manage` · müsait öğretmen listesi.

- [ ] **Step 4: completion_status.md** — Faz 2.5B redesign özeti ekle; "⚠️ Spec Dışına Çıkılanlar"da 2026-06-13 "drawer kompoze form" sapmasını **geri çevrildi** olarak işaretle (yeni satır: editör-merkezli akışa dönüldü, handoff §171'e hizalandı). Debt-FE-5'i güncelle (geçici oluşturma artık editör-merkezli; liste+geri-al hâlâ ayrı dilim). Debt-FE-10/11 + Debt-BE-5 ekle.

- [ ] **Step 5: Commit** (workspace root repo)

```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/modules/timetable/completion_status.md .claude/docs/modules/timetable/api-contracts.md
git commit -m "2026-06-13 docs: Ders Programı Faz 2.5B redesign (editör-merkezli geçici değişiklik) — completion_status + api-contracts P28."
```

---

## Self-Review Notları (kapsam ↔ tasarım)
- §3 menü 5 aksiyon → D1/D2 (Vekil+İptal yeni, Öğretmen/Derslik/Kaldır mevcut, branş filtresi D2 Step 2).
- §3.2 müsait öğretmen → A1-A3 (backend) + C1 (lookup) + D1 Step 5 (UI).
- §4 ayrı tut → D2 Step 1 (`tempLocked`/`permLocked`).
- §4.2 yayın türü gating + warning + notification + tarih + apply → E1/E2.
- §6 composite form kaldır → F1.
- Açık doğrulamalar (uygulama anında): A2 öğretmen-rol filtresi; D2 Step 2 `UnplacedLessonDto.subjectId/teacherId` varlığı (yoksa Debt-FE-10 fallback).
- Debt: BE-5 (vekil-vekil çakışması), FE-10 (branş filtresi verisi), FE-11 (apply atomik değil).
```

