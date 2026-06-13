# Editör Çakışma Hücre İşareti (Bulgu 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.
> Bağlayıcı: teknik analiz §3.2 + §6.2 (`Oksis_DersProgrami_Teknik_Analiz.docx`) — çakışma kaynağı =
> **occupancy index = dönemdeki TÜM aktif (IsActive=1) yerleşimler** (taslak + yayınlanmış), filtreli
> unique index backstop. Debt-FE-12'yi kapatır.

**Goal:** Editörde yerleşmiş bir dersin öğretmeni veya dersliği **başka bir sınıfın** programında aynı (gün, period)'da doluysa hücreyi kırmızı "⚠ Çakışma" rozetiyle işaretle; `ValidationBar`'a gerçek `conflictCount` bağla.

**Architecture:** Tamponlu editörde yerleşim Kaydet'e kadar yerel → çakışma, **yerel placements** ile **diğer programların occupancy'si** karşılaştırılarak istemci tarafında hesaplanır. Backend tek yeni okuma ucu (bu programı hariç tutan dış-doluluk); FE saf `deriveConflicts` + hücre işareti.

**Tech Stack:** .NET 10 CQRS (GetAvailableTeachers deseni) · React 18 + React Query + dnd-kit + vitest.

---

## FAZ A — Backend: external-occupancy

### Task A1: DTO + Query + Handler + endpoint + test
**Files:**
- Modify: `src/Oksis.Application/Modules/Timetable/DTOs/ScheduleExceptionDtos.cs` (yeni DTO'lar)
- Create: `.../Queries/GetExternalOccupancy/GetExternalOccupancyQuery.cs` + `...QueryHandler.cs`
- Modify: `src/Oksis.Api/Controllers/V1/SchedulingController.cs`
- Create test: `tests/Oksis.Application.UnitTests/Modules/Timetable/GetExternalOccupancyQueryHandlerTests.cs`

DTO'lar:
```csharp
public sealed record OccupancySlotDto(Guid Id, int Day, int Period);
public sealed record ExternalOccupancyDto(
    IReadOnlyList<OccupancySlotDto> Teachers,
    IReadOnlyList<OccupancySlotDto> Rooms);
```
Query: `GetExternalOccupancyQuery(Guid ProgramId) : IQuery<ExternalOccupancyDto>` + `[Tenancy(Required)]` + `[RequirePermission("timetable.manage")]`.
Handler (GetAvailableTeachers desenini birebir izle): program yükle → `AcademicTermId`; dönemdeki **bu program HARİÇ** (`p.Id != request.ProgramId`) tüm programların **aktif** yerleşimlerini al; `Teachers = (TeacherId, Day, Period)` distinct; `Rooms = (RoomId.Value, Day, Period)` (RoomId null olanları ele) distinct. `(int)Day` cast. Forbidden (tenant yok) / NotFound (program yok) dalları.
Endpoint: `GET /timetable/programs/{id:guid}/external-occupancy` → `ApiResponse<ExternalOccupancyDto>`, izin sınıf-düzeyi `[Authorize]` + query `[RequirePermission]`.
Testler (mock DbSet, NSubstitute inline-Returns KIRILIR → değişkene al):
- Başka programın (aynı term) öğretmen+derslik slotları döner; **bu programın kendi** yerleşimleri DÖNMEZ.
- Farklı term programı dönmez. RoomId null olan yerleşim Rooms'a girmez.

Verify: `dotnet build Oksis.slnx --no-restore` + `dotnet test ...UnitTests --filter GetExternalOccupancy`. Commit: `2026-06-13 feat: Ders Programı dış-doluluk sorgusu (editör çakışma işareti için).`

---

## FAZ B — Frontend: deriveConflicts (saf, TDD)

### Task B1: deriveConflicts + occupancy lookup tipi
**Files:**
- Modify: `src/portals/admin/timetable/editor/lib/editorDerive.ts`
- Modify: `src/portals/admin/timetable/editor/__tests__/editorDerive.test.ts`

Tip + fonksiyon:
```ts
export interface ExternalOccupancy {
  teacherSlots: Set<string>; // `${teacherId}:${day}:${period}`
  roomSlots: Set<string>;    // `${roomId}:${day}:${period}`
}

/** Yerel yerleşimlerden, öğretmeni VEYA dersliği dış-dolulukta olan placement id'leri. */
export function deriveConflicts(placements: PlacementDto[], occ: ExternalOccupancy): Set<string> {
  const ids = new Set<string>();
  for (const p of placements) {
    const tKey = `${p.teacherId}:${p.day}:${p.period}`;
    const rKey = p.roomId ? `${p.roomId}:${p.day}:${p.period}` : null;
    if (occ.teacherSlots.has(tKey) || (rKey && occ.roomSlots.has(rKey))) ids.add(p.id);
  }
  return ids;
}
```
Testler (TDD, önce fail): öğretmen dış-dolu → çakışır; derslik dış-dolu → çakışır; ikisi de boş → çakışmaz; roomId null + öğretmen boş → çakışmaz; farklı period eşleşmez.
Commit: `2026-06-13 feat: Ders Programı editör çakışma türetici (deriveConflicts) saf fonksiyonu.`

---

## FAZ C — Frontend: lookup + wiring + işaret

### Task C1: fetchExternalOccupancy
**Files:** Modify `src/portals/admin/timetable/editor/api/editorLookups.ts`
```ts
interface OccSlot { id: string; day: number; period: number }
export async function fetchExternalOccupancy(programId: string, signal?: AbortSignal): Promise<ExternalOccupancy> {
  const res = await httpClient.get<ApiEnvelope<{ teachers: OccSlot[]; rooms: OccSlot[] }>>(
    `/timetable/programs/${programId}/external-occupancy`, { signal });
  const key = (s: OccSlot) => `${s.id}:${s.day}:${s.period}`;
  return {
    teacherSlots: new Set(res.data.data.teachers.map(key)),
    roomSlots: new Set(res.data.data.rooms.map(key)),
  };
}
```
(`ExternalOccupancy` editorDerive'dan import.)

### Task C2: ScheduleEditorPage + WeekGrid + GridCell + ValidationBar
**Files:** Modify `ScheduleEditorPage.tsx`, `WeekGrid.tsx`, `GridCell.tsx`, i18n, `editor.css`
- `ScheduleEditorPage`: `useQuery` external-occupancy (tenant-scope key `["timetable","extocc",id]`, enabled schoolId+id); `const conflictIds = useMemo(() => deriveConflicts(placements, occQ.data ?? {teacherSlots:new Set(),roomSlots:new Set()}), [placements, occQ.data])`.
  - `ValidationBar` `conflictCount={conflictIds.size}` (hardcoded 0 yerine).
  - Çakışma issue satırları: her conflictId için placement bul → IssueRow `{cellKey, day, period, kind:"bad", title: t("editor.validatePanel.conflictTitle",{day,period}), sub: t("editor.validatePanel.conflictSub")}`; mevcut missing issues ile birleştir (çakışmalar üstte).
  - WeekGrid'e `conflictIds` geçir.
- `WeekGrid`→`GridCell`: `isConflict={conflictIds.has(placement.id)}`.
- `GridCell`: `isConflict` prop → `.sed-cell.conflict` class + dolu hücrede `<span className="cc-conflict"><AlertTriangle/> {t("editor.conflict.badge")}</span>`.
- i18n (tr+en): `editor.conflict.badge` ("Çakışma"/"Conflict"), `editor.validatePanel.conflictTitle` ("{{day}} · {{period}}. saat çakışma"/"…"), `editor.validatePanel.conflictSub` ("Öğretmen veya derslik başka sınıfta dolu"/"…").
- `editor.css`: `.sed-cell.conflict { box-shadow: inset 0 0 0 2px var(--danger,#991B1B); }` + `.cc-conflict { … kırmızı rozet }` (mevcut `.block-tag` deseni gibi konumla).
Verify: `npm run build` + `npm run test`. Commit: `2026-06-13 feat: Ders Programı editör çakışma hücre işareti + gerçek conflictCount (Debt-FE-12 kapandı).`

---

## FAZ D — Docs
- `api-contracts.md`: P29 `GET .../external-occupancy`.
- `completion_status.md`: Debt-FE-12 **kapandı** olarak işaretle + kısa özet.
- Commit (workspace repo).

## Self-Review
- Çakışma kaynağı = tüm aktif (taslak+yayın) diğer programlar (analiz §6.2) → A1 handler bu programı hariç, term-içi tüm aktif. ✓
- Tamponlu yerel placements istemci tarafında karşılaştırılır (kaydedilmiş veride çakışma oluşamaz). ✓
- Saf deriveConflicts TDD. ✓
