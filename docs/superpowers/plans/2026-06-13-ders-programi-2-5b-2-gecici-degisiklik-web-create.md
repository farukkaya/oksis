# Ders Programı 2.5B-2 — Geçici Değişiklik Web (Oluşturma Akışı) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yayınla drawer'ındaki "Geçici değişiklik" yolunu, backend P24/P25 ile birebir örtüşen **kendi-içinde kompoze bir form** olarak hayata geçir: yayınlanmış programdan tek bir hedef ders seç → tip (iptal/öğretmen vekaleti/derslik) → tarih → sebep → **Önizle** (P24) → **Uygula** (P25).

**Architecture:** "Geçici değişiklik" yolu, editör düzenlemelerinden **bağımsız**dır (önceki dilim 2.5B-1'in op-log'unu OKUMAZ). Hedef ders, yayınlanmış snapshot'tan (P17 `GET /branches/{branchId}/weekly` — yerleşim id'leri + isimler dahil) gelen bir **mini haftalık ızgaradan** seçilir; seçilen hücrenin `placementId`'si `targetPlacementId` olur. Her gönderim **tek istisna** üretir (backend modeli: tek yerleşim + tek tip + tek tarih + sebep). Doğrulama tamamen backend'e bırakılır (P24 preview tüm kuralları — tarih aralığı, gün eşleşmesi, tatil, tip-özel alan, çakışma, tekillik — döndürür); istemci yalnız zorunlu alanları toplar. Geçici toggle yalnız program **Published** iken aktiftir.

**Tech Stack:** React 18 + TS strict · Vitest + Testing Library · TanStack React Query v5 · i18next (tr/en) · shadcn/ui + Tailwind, mevcut `.pub-*` tasarım sınıfları.

**Kapsam dışı (sonraki dilim 2.5B-3):** "Mevcut değişiklikler" listesi (P27) + Geri Al (P26). Bu plan yalnız **oluşturma** akışını kapsar.

---

## Plan kararları (2.5B-1 + backend kısıtlarından türedi — itiraz için)

1. **Kompoze form** (kullanıcı onayı 2026-06-13): editör-diff değil; hedef ders yayınlanmış programdan seçilir. Guard yok, backend'le 1:1.
2. **Kaynak = P17** `branches/{branchId}/weekly` (latest published, `timetable.view-all`). `branchId`, mevcut program verisinden (`getProgram`/publish-preview) gelir. Program yayınlanmamışsa 404 → toggle zaten Published değilse kapalı.
3. **Doğrulama backend'de**: istemci Önizle'yi yalnız zorunlu alanlar dolunca etkinleştirir; uygulanabilirlik/engeller P24'ten gelir. Uygula yalnız `preview.canApply` iken etkin.
4. **Tek istisna/gönderim**: çoklu değişiklik isteyen kullanıcı formu tekrar doldurur (liste 2.5B-3'te). Birden çok hedefi tek seferde uygulamak yok.
5. **Permanent yol değişmedi**: drawer'ın "Kalıcı yayın" akışı (P15/P16) aynen kalır; yalnız tip toggle'ı üstte branşlaştırıcı olur.

---

## File Structure

**Modify:**
- `oksis-web/src/portals/admin/timetable/types.ts` — geçici değişiklik tipleri (enum, input, preview/target/result DTO).
- `oksis-web/src/portals/admin/timetable/api/timetableApi.ts` — `getBranchWeekly`, `previewException`, `createException`.
- `oksis-web/src/portals/admin/timetable/keys/timetableKeys.ts` — `branchWeekly`, `exceptionPreview` anahtarları (tenant-scope).
- `oksis-web/src/portals/admin/timetable/components/PublishDrawer.tsx` — `pubType` toggle (Geçici aktif when Published) + Geçici modda `TemporaryChangePanel` render.
- `oksis-web/src/shared/i18n/locales/{tr,en}/timetable.json` — `publish.temp.*` + `errors.exception-*`.
- `.claude/docs/modules/timetable/completion_status.md` — 2.5B-2 + Debt-FE-5 ilerleme.

**Create:**
- `oksis-web/src/portals/admin/timetable/components/TemporaryChangePanel.tsx` — kompoze form (grid + tip + alan + sebep + Önizle/Uygula + durumlar).
- `oksis-web/src/portals/admin/timetable/lib/temporaryChange.ts` — saf yardımcılar (`isPreviewReady`, `isApplyReady`, `buildExceptionBody`, `findLesson`).
- `oksis-web/src/portals/admin/timetable/lib/__tests__/temporaryChange.test.ts`
- `oksis-web/src/portals/admin/timetable/components/__tests__/TemporaryChangePanel.test.tsx`

---

### Task 1: Web tipleri + API metodları + query anahtarları

**Files:**
- Modify: `src/portals/admin/timetable/types.ts`
- Modify: `src/portals/admin/timetable/api/timetableApi.ts`
- Modify: `src/portals/admin/timetable/keys/timetableKeys.ts`

> Doğrulama notu: `ScheduleProgramStatus` zaten string enum olarak taşınıyor (`"Draft"`/`"Published"`), yani backend `JsonStringEnumConverter` kullanıyor → `ScheduleExceptionType` de string ("Cancellation"/"TeacherSubstitution"/"RoomChange") taşınır. Bunu yeni kod yazmadan önce mevcut `ScheduleProgramStatus` kullanımıyla teyit et.

- [ ] **Step 1: types.ts'e ekle** (dosya sonuna):

```ts
// ── Geçici değişiklik (Faz 2.5B-2) ──

export type ScheduleExceptionType = "Cancellation" | "TeacherSubstitution" | "RoomChange";

/** P24/P25 ortak gövde (preview reason'sız, create reason'lı). */
export interface ExceptionInput {
  date: string; // "YYYY-MM-DD"
  type: ScheduleExceptionType;
  targetPlacementId: string;
  newTeacherId?: string | null;
  newRoomId?: string | null;
}

export interface CreateExceptionInput extends ExceptionInput {
  reason: string;
}

export interface ScheduleExceptionTargetDto {
  targetPlacementId: string;
  day: number;
  period: number;
  subjectId: string;
  subjectName: string;
  originalTeacherId: string;
  originalTeacherName: string;
  originalRoomId: string | null;
  originalRoomName: string | null;
}

export interface ScheduleExceptionIssueDto {
  code: string;
  title: string;
}

export interface ScheduleExceptionPreviewDto {
  canApply: boolean;
  target: ScheduleExceptionTargetDto | null;
  issues: ScheduleExceptionIssueDto[];
  affected: PublishAffectedDto;
}

export interface CreateExceptionResultDto {
  id: string;
  date: string;
  type: ScheduleExceptionType;
}
```

- [ ] **Step 2: timetableApi.ts'e metodlar ekle.** Üstteki tip import bloğuna ekle: `CreateExceptionInput, ExceptionInput, ScheduleExceptionPreviewDto, CreateExceptionResultDto`. Ayrıca yayınlanmış haftalık için consumer tipini import et: `import type { PublishedWeeklyScheduleDto } from "../../../../modules/timetable/types";`. Sonra `timetableApi` nesnesine ekle (publishProgram'dan sonra):

```ts
  getBranchWeekly: async (branchId: string, signal?: AbortSignal): Promise<PublishedWeeklyScheduleDto> => {
    const res = await httpClient.get<ApiEnvelope<PublishedWeeklyScheduleDto>>(
      `/timetable/branches/${branchId}/weekly`,
      { signal },
    );
    return res.data.data;
  },

  previewException: async (
    programId: string,
    body: ExceptionInput,
    signal?: AbortSignal,
  ): Promise<ScheduleExceptionPreviewDto> => {
    const res = await httpClient.post<ApiEnvelope<ScheduleExceptionPreviewDto>>(
      `/timetable/programs/${programId}/exceptions/preview`,
      body,
      { signal },
    );
    return res.data.data;
  },

  createException: async (
    programId: string,
    body: CreateExceptionInput,
  ): Promise<CreateExceptionResultDto> => {
    const res = await httpClient.post<ApiEnvelope<CreateExceptionResultDto>>(
      `/timetable/programs/${programId}/exceptions`,
      body,
    );
    return res.data.data;
  },
```

- [ ] **Step 3: timetableKeys.ts'e anahtar ekle.** Mevcut desene uygun (tenant-scope). Read the file first; following the existing `program`/`publishPreview` pattern, add:

```ts
  branchWeekly: (schoolId: string | undefined, branchId: string) =>
    tenantScopedKey(schoolId, ["timetable", "branch-weekly", branchId] as const),
  exceptionPreview: (schoolId: string | undefined, programId: string) =>
    tenantScopedKey(schoolId, ["timetable", "exception-preview", programId] as const),
```
(Use the exact `tenantScopedKey` import/signature already in the file; mirror how `publishPreview` is written.)

- [ ] **Step 4: Build doğrula.** Run: `cd oksis-web && npm run build` → success (no compile errors). (No tsc in project; build = transpile gate. Methods not used yet → must still compile.)

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable/types.ts src/portals/admin/timetable/api/timetableApi.ts src/portals/admin/timetable/keys/timetableKeys.ts
git commit -m "2026-06-13 feat: Ders programı geçici değişiklik web tipleri + API (P17/P24/P25) + query anahtarları."
```

---

### Task 2: Saf yardımcı `temporaryChange.ts`

**Files:**
- Create: `src/portals/admin/timetable/lib/temporaryChange.ts`
- Test: `src/portals/admin/timetable/lib/__tests__/temporaryChange.test.ts`

- [ ] **Step 1: Failing test**

```ts
// lib/__tests__/temporaryChange.test.ts
import { describe, it, expect } from "vitest";
import {
  isPreviewReady,
  isApplyReady,
  buildExceptionBody,
  type TempForm,
} from "../temporaryChange";
import type { ScheduleExceptionPreviewDto } from "../../types";

const baseForm: TempForm = {
  date: "2026-02-16",
  targetPlacementId: "pl1",
  type: "Cancellation",
  newTeacherId: null,
  newRoomId: null,
  reason: "Ali Hoca raporlu",
};

const okPreview: ScheduleExceptionPreviewDto = {
  canApply: true, target: null, issues: [], affected: { teachers: 1, students: 20, parents: 18 },
};

describe("temporaryChange", () => {
  it("isPreviewReady: iptal → tarih+hedef yeterli", () => {
    expect(isPreviewReady({ ...baseForm, type: "Cancellation" })).toBe(true);
    expect(isPreviewReady({ ...baseForm, date: "" })).toBe(false);
    expect(isPreviewReady({ ...baseForm, targetPlacementId: "" })).toBe(false);
  });

  it("isPreviewReady: vekalet → newTeacherId zorunlu", () => {
    expect(isPreviewReady({ ...baseForm, type: "TeacherSubstitution", newTeacherId: null })).toBe(false);
    expect(isPreviewReady({ ...baseForm, type: "TeacherSubstitution", newTeacherId: "t2" })).toBe(true);
  });

  it("isPreviewReady: derslik → newRoomId zorunlu", () => {
    expect(isPreviewReady({ ...baseForm, type: "RoomChange", newRoomId: null })).toBe(false);
    expect(isPreviewReady({ ...baseForm, type: "RoomChange", newRoomId: "r2" })).toBe(true);
  });

  it("isApplyReady: önizleme canApply + sebep dolu", () => {
    expect(isApplyReady(baseForm, okPreview)).toBe(true);
    expect(isApplyReady({ ...baseForm, reason: "  " }, okPreview)).toBe(false);
    expect(isApplyReady(baseForm, { ...okPreview, canApply: false })).toBe(false);
    expect(isApplyReady(baseForm, null)).toBe(false);
  });

  it("buildExceptionBody: tipe göre yalnız ilgili alanı taşır", () => {
    expect(buildExceptionBody({ ...baseForm, type: "Cancellation" })).toEqual({
      date: "2026-02-16", type: "Cancellation", targetPlacementId: "pl1",
      newTeacherId: null, newRoomId: null,
    });
    expect(buildExceptionBody({ ...baseForm, type: "TeacherSubstitution", newTeacherId: "t2", newRoomId: "rX" })).toMatchObject({
      type: "TeacherSubstitution", newTeacherId: "t2", newRoomId: null,
    });
    expect(buildExceptionBody({ ...baseForm, type: "RoomChange", newRoomId: "r2", newTeacherId: "tX" })).toMatchObject({
      type: "RoomChange", newRoomId: "r2", newTeacherId: null,
    });
  });
});
```

- [ ] **Step 2: Run, verify FAIL** — `npx vitest run src/portals/admin/timetable/lib/__tests__/temporaryChange.test.ts`.

- [ ] **Step 3: Implement**

```ts
// lib/temporaryChange.ts
import type { ExceptionInput, ScheduleExceptionPreviewDto, ScheduleExceptionType } from "../types";

export interface TempForm {
  date: string;
  targetPlacementId: string;
  type: ScheduleExceptionType;
  newTeacherId: string | null;
  newRoomId: string | null;
  reason: string;
}

/** Önizle butonu: tarih + hedef + (tipe göre) zorunlu alan dolu mu. */
export function isPreviewReady(f: TempForm): boolean {
  if (!f.date || !f.targetPlacementId) return false;
  if (f.type === "TeacherSubstitution") return Boolean(f.newTeacherId);
  if (f.type === "RoomChange") return Boolean(f.newRoomId);
  return true; // Cancellation
}

/** Uygula butonu: önizleme uygulanabilir + sebep dolu. */
export function isApplyReady(f: TempForm, preview: ScheduleExceptionPreviewDto | null): boolean {
  return Boolean(preview?.canApply) && f.reason.trim().length > 0;
}

/** Tipe göre yalnız ilgili yeni-alanı taşıyan P24/P25 gövdesi (reason hariç). */
export function buildExceptionBody(f: TempForm): ExceptionInput {
  return {
    date: f.date,
    type: f.type,
    targetPlacementId: f.targetPlacementId,
    newTeacherId: f.type === "TeacherSubstitution" ? f.newTeacherId : null,
    newRoomId: f.type === "RoomChange" ? f.newRoomId : null,
  };
}
```

- [ ] **Step 4: Run, verify PASS** (5 tests).

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable/lib/temporaryChange.ts src/portals/admin/timetable/lib/__tests__/temporaryChange.test.ts
git commit -m "2026-06-13 feat: Ders programı geçici değişiklik saf form yardımcıları (hazır/gövde)."
```

---

### Task 3: `TemporaryChangePanel` bileşeni

**Files:**
- Create: `src/portals/admin/timetable/components/TemporaryChangePanel.tsx`

> Bu, drawer içinde "Geçici değişiklik" seçilince render edilen kendi-içinde formdur. Veri kaynağı P17 (branchWeekly). İsim listeleri (öğretmen/derslik seçimi) mevcut lookup fetcher'larından gelir.
> Project rules: named export, no `any`, no inline styles (mevcut `.pub-*`/grid sınıfları + birkaç yeni `.tmp-*` sınıfı), i18n zorunlu.

- [ ] **Step 1: Bileşeni yaz**

```tsx
// components/TemporaryChangePanel.tsx
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle, Loader2, Calendar } from "lucide-react";
import { useAuthStore } from "../../../../shared/store/authStore";
import { tenantScopedKey } from "../../../../shared/config/tenant";
import { getApiErrorCode } from "../../../../shared/api/apiError";
import { cn } from "../../../../lib/utils";
import { timetableApi } from "../api/timetableApi";
import { timetableKeys } from "../keys/timetableKeys";
import { fetchTeacherNames, fetchRoomCodes } from "../editor/api/editorLookups";
import {
  buildExceptionBody, isApplyReady, isPreviewReady, type TempForm,
} from "../lib/temporaryChange";
import type {
  CreateExceptionResultDto, ScheduleExceptionPreviewDto, ScheduleExceptionType,
} from "../types";
import type { PublishedLessonDto } from "../../../../modules/timetable/types";

interface Props {
  programId: string;
  branchId: string;
  className: string;
  onApplied?: () => void;
}

const TYPES: ScheduleExceptionType[] = ["Cancellation", "TeacherSubstitution", "RoomChange"];

export function TemporaryChangePanel({ programId, branchId, className, onApplied }: Props) {
  const { t } = useTranslation("timetable");
  const schoolId = useAuthStore((s) => s.user?.schoolId);

  const [date, setDate] = useState("");
  const [targetPlacementId, setTarget] = useState("");
  const [type, setType] = useState<ScheduleExceptionType>("Cancellation");
  const [newTeacherId, setNewTeacher] = useState<string | null>(null);
  const [newRoomId, setNewRoom] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<ScheduleExceptionPreviewDto | null>(null);
  const [result, setResult] = useState<CreateExceptionResultDto | null>(null);

  const form: TempForm = { date, targetPlacementId, type, newTeacherId, newRoomId, reason };

  const weekly = useQuery({
    queryKey: timetableKeys.branchWeekly(schoolId, branchId),
    queryFn: ({ signal }) => timetableApi.getBranchWeekly(branchId, signal),
    enabled: Boolean(schoolId && branchId),
  });
  const teachersQ = useQuery({
    queryKey: tenantScopedKey(schoolId, ["timetable", "lookup", "teachers"] as const),
    queryFn: ({ signal }) => fetchTeacherNames(signal),
    enabled: Boolean(schoolId), staleTime: 15 * 60 * 1000,
  });
  const roomsQ = useQuery({
    queryKey: tenantScopedKey(schoolId, ["timetable", "lookup", "rooms"] as const),
    queryFn: ({ signal }) => fetchRoomCodes(signal),
    enabled: Boolean(schoolId), staleTime: 30 * 60 * 1000,
  });

  const lessons = weekly.data?.lessons ?? [];
  const days = weekly.data?.days ?? [];
  const periods = weekly.data?.periods ?? [];
  const selected = useMemo(
    () => lessons.find((l) => l.placementId === targetPlacementId) ?? null,
    [lessons, targetPlacementId],
  );

  const previewMut = useMutation({
    mutationFn: () => timetableApi.previewException(programId, buildExceptionBody(form)),
    onSuccess: (p) => setPreview(p),
  });
  const applyMut = useMutation({
    mutationFn: () => timetableApi.createException(programId, { ...buildExceptionBody(form), reason: reason.trim() }),
    onSuccess: (r) => { setResult(r); onApplied?.(); },
  });

  // Hedef/alan değişince eski önizlemeyi geçersiz kıl.
  const pickTarget = (l: PublishedLessonDto) => {
    setTarget(l.placementId);
    setPreview(null);
    setNewTeacher(null);
    setNewRoom(null);
  };
  const changeType = (ty: ScheduleExceptionType) => { setType(ty); setPreview(null); };

  if (result) {
    return (
      <div className="pub-done tmp-done">
        <div className="dc"><CheckCircle size={36} /></div>
        <h4>{t("publish.temp.appliedTitle")}</h4>
        <div className="dsub">{t("publish.temp.appliedSub", { date: result.date })}</div>
      </div>
    );
  }

  const applyError = applyMut.error ? getApiErrorCode(applyMut.error) : null;

  return (
    <div className="tmp-panel">
      {/* tarih */}
      <section className="pub-sec">
        <div className="pub-sec-h"><Calendar size={14} /> {t("publish.temp.date")}</div>
        <input type="date" className="inp" value={date}
          onChange={(e) => { setDate(e.target.value); setPreview(null); }} />
      </section>

      {/* hedef ders ızgarası */}
      <section className="pub-sec">
        <div className="pub-sec-h">{t("publish.temp.pickTarget")}</div>
        {weekly.isLoading ? (
          <div className="pub-state"><Loader2 className="pub-loader" size={20} /></div>
        ) : weekly.isError || !weekly.data ? (
          <div className="pub-state error"><AlertTriangle size={18} /> {t("publish.temp.notPublished")}</div>
        ) : (
          <div className="tmp-grid" role="grid">
            <div className="tmp-row tmp-head">
              <span className="tmp-cell tmp-corner" />
              {days.map((d) => <span key={d.day} className="tmp-cell tmp-day">{d.shortName}</span>)}
            </div>
            {periods.map((p) => (
              <div className="tmp-row" key={p.period}>
                <span className="tmp-cell tmp-per">{p.period}</span>
                {days.map((d) => {
                  const l = lessons.find((x) => x.day === d.day && x.period === p.period);
                  return (
                    <button type="button" key={d.day}
                      className={cn("tmp-cell tmp-lesson", l && "filled", l?.placementId === targetPlacementId && "sel")}
                      disabled={!l}
                      onClick={() => l && pickTarget(l)}>
                      {l ? l.subjectName : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        {selected && (
          <div className="tmp-selected">
            {t("publish.temp.selectedLesson", {
              subject: selected.subjectName, teacher: selected.teacherName,
              room: selected.roomName || "—",
            })}
          </div>
        )}
      </section>

      {/* tip */}
      <section className="pub-sec">
        <div className="pub-sec-h">{t("publish.temp.typeTitle")}</div>
        <div className="pub-seg tmp-types">
          {TYPES.map((ty) => (
            <button type="button" key={ty}
              className={cn("pub-seg-opt", type === ty && "on")}
              onClick={() => changeType(ty)}>
              <span className="ot"><span className="rd" /> {t(`publish.temp.type.${ty}`)}</span>
            </button>
          ))}
        </div>
        {type === "TeacherSubstitution" && (
          <select className="inp tmp-select" value={newTeacherId ?? ""}
            onChange={(e) => { setNewTeacher(e.target.value || null); setPreview(null); }}>
            <option value="">{t("publish.temp.pickTeacher")}</option>
            {[...(teachersQ.data ?? new Map())].map(([id, name]) => (
              <option key={id} value={id} disabled={id === selected?.teacherId}>{name}</option>
            ))}
          </select>
        )}
        {type === "RoomChange" && (
          <select className="inp tmp-select" value={newRoomId ?? ""}
            onChange={(e) => { setNewRoom(e.target.value || null); setPreview(null); }}>
            <option value="">{t("publish.temp.pickRoom")}</option>
            {[...(roomsQ.data ?? new Map())].map(([id, name]) => (
              <option key={id} value={id} disabled={id === selected?.roomId}>{name}</option>
            ))}
          </select>
        )}
      </section>

      {/* sebep */}
      <section className="pub-sec">
        <div className="pub-sec-h">{t("publish.temp.reason")}</div>
        <textarea className="inp" value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("publish.temp.reasonPlaceholder")} />
      </section>

      {/* önizleme sonucu */}
      {preview && (
        <section className="pub-sec">
          <div className={cn("pub-gate", preview.canApply ? "ok" : "bad")}>
            <div className="pub-gate-top">
              <div className="pub-gate-ic">
                {preview.canApply ? <CheckCircle size={20} /> : <AlertTriangle size={19} />}
              </div>
              <div className="pub-gate-tx">
                <div className="t">{preview.canApply ? t("publish.temp.canApplyOk") : t("publish.temp.cannotApply")}</div>
                {preview.canApply && (
                  <div className="s">{t("publish.temp.affected", {
                    teachers: preview.affected.teachers,
                    students: preview.affected.students,
                    parents: preview.affected.parents,
                  })}</div>
                )}
              </div>
            </div>
            {preview.issues.length > 0 && (
              <div className="pub-issues">
                {preview.issues.map((it, i) => (
                  <div className="pub-issue bad" key={`${it.code}-${i}`}>
                    <span className="ix"><span className="t">
                      {t(it.code.replace(/^timetable\./, ""), { defaultValue: it.title || it.code })}
                    </span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {applyError && (
        <div className="pub-error" role="alert">
          {t(applyError.replace(/^timetable\./, ""), { defaultValue: t("publish.temp.applyFailed") })}
        </div>
      )}

      {/* aksiyon çubuğu */}
      <div className="pub-foot tmp-foot">
        <div className="grow" />
        {!preview?.canApply ? (
          <button type="button" className={cn("btn btn-primary", (!isPreviewReady(form) || previewMut.isPending) && "disabled")}
            disabled={!isPreviewReady(form) || previewMut.isPending}
            onClick={() => previewMut.mutate()}>
            {previewMut.isPending ? <Loader2 className="btn-spin-ic" size={16} /> : null} {t("publish.temp.preview")}
          </button>
        ) : (
          <button type="button" className={cn("btn btn-primary", (!isApplyReady(form, preview) || applyMut.isPending) && "disabled")}
            disabled={!isApplyReady(form, preview) || applyMut.isPending}
            onClick={() => applyMut.mutate()}>
            {applyMut.isPending ? <Loader2 className="btn-spin-ic" size={16} /> : <CheckCircle size={16} />} {t("publish.temp.apply")}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CSS ekle** (`src/portals/admin/timetable/timetable.css` sonuna — drawer bu css'i kullanır):

```css
/* Geçici değişiklik formu (drawer içi) */
.tmp-grid { display: flex; flex-direction: column; gap: 3px; }
.tmp-row { display: grid; grid-template-columns: 28px repeat(5, 1fr); gap: 3px; }
.tmp-cell { font-size: 11px; min-height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.tmp-day, .tmp-per { color: var(--text-faint, #64748b); font-weight: 600; }
.tmp-lesson { border: 1px solid var(--line, #e5e7eb); background: var(--surface, #fff); color: var(--text-faint, #94a3b8); cursor: default; padding: 0 4px; overflow: hidden; }
.tmp-lesson.filled { color: var(--text, #0f172a); cursor: pointer; }
.tmp-lesson.filled:hover { border-color: var(--accent, #1e3a8a); }
.tmp-lesson.sel { border-color: var(--accent, #1e3a8a); box-shadow: 0 0 0 1px var(--accent, #1e3a8a) inset; background: #eef2ff; }
.tmp-selected { margin-top: 8px; font-size: 12px; color: var(--text-faint, #64748b); }
.tmp-select { margin-top: 8px; }
.tmp-types { margin-bottom: 4px; }
```

- [ ] **Step 3: Build doğrula.** `npm run build` → success. (Bileşen henüz drawer'da kullanılmıyor; Task 4'te bağlanır. Build yine de derlenmeli.)

- [ ] **Step 4: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable/components/TemporaryChangePanel.tsx src/portals/admin/timetable/timetable.css
git commit -m "2026-06-13 feat: Ders programı geçici değişiklik kompoze form bileşeni (grid + tip + sebep + önizle/uygula)."
```

---

### Task 4: PublishDrawer'a bağla (Geçici toggle + panel)

**Files:**
- Modify: `src/portals/admin/timetable/components/PublishDrawer.tsx`

- [ ] **Step 1: pubType state + import.** Üste ekle: `import { TemporaryChangePanel } from "./TemporaryChangePanel";`. Bileşen gövdesine (diğer `useState`'lerin yanına) ekle:
```tsx
  const [pubType, setPubType] = useState<"permanent" | "temporary">("permanent");
```
`PublishDrawer` Props'unda `programId` ve `className` zaten var. Geçici panel `branchId`'ye ihtiyaç duyar; `preview.data` ProgramId taşıyor ama branchId taşımıyor. **branchId'yi al:** publish-preview DTO'sunda branchId yok; bu yüzden Props'a `branchId?: string` ekle ve çağıranlardan geç (ScheduleEditorPage'de `data.program?.branchId`, Hub'da `row.branchId`). Props arayüzüne ekle:
```tsx
  branchId?: string;
```
ve imzaya `branchId` ekle.

- [ ] **Step 2: Tip toggle'ını gerçek state'e bağla + Geçici'yi Published iken aç.** Mevcut "3) Yayın türü" `pub-seg` bloğunu (permanent "on" + temporary disabled) şununla değiştir:

```tsx
            <section className="pub-sec">
              <div className="pub-sec-h"><span className="step">3</span> {t("publish.typeTitle")}</div>
              <div className="pub-seg">
                <button type="button" className={cn("pub-seg-opt", pubType === "permanent" && "on")}
                  onClick={() => setPubType("permanent")}>
                  <span className="ot"><span className="rd" /> {t("publish.permanent")}</span>
                  <span className="os">{t("publish.permanentSub")}</span>
                </button>
                <button type="button"
                  className={cn("pub-seg-opt", pubType === "temporary" && "on", data.status !== "Published" && "disabled")}
                  disabled={data.status !== "Published"}
                  title={data.status !== "Published" ? t("publish.temp.needPublished") : undefined}
                  onClick={() => setPubType("temporary")}>
                  <span className="ot"><span className="rd" /> {t("publish.temporary")}</span>
                  <span className="os">{data.status !== "Published" ? t("publish.temp.needPublished") : t("publish.temporarySub")}</span>
                </button>
              </div>
            </section>
```

> Not: `data` = `preview.data` (PublishPreviewDto), `status` alanı taşır. `cn` zaten import'lu.

- [ ] **Step 3: Geçici modda gövdeyi ve footer'ı değiştir.** Form adımındaki (`step === "form"` dalı, yani ana `return (...)`) body'de: yayın türü section'ından SONRA gelen permanent-only section'ları (4 not, 5 channels) ve **gate/affected/diff** section'larını yalnız `pubType === "permanent"` iken göster. En temiz yol: tip section'ı hariç permanent içerikleri `pubType === "permanent" && (...)` ile sarmala; `pubType === "temporary"` iken `<TemporaryChangePanel .../>` render et.

Somut: ana `return`'deki `<DrawerShell ...>` `pub-body` içeriğini şu yapıya getir:
- `preview.isLoading` / error: aynı kalır.
- Yüklendi (`data` var):
  - Geçici toggle section'ı (3) HER ZAMAN görünür (Step 2'deki blok) — ama gate/affected/diff'ten SONRA değil, mantıken üstte de olabilir; mevcut sırayı koru (gate, affected, diff, **type**, ...). Type section'ından sonra:
    ```tsx
    {pubType === "permanent" ? (
      <>
        {/* mevcut 4) sürüm notu + 5) bildirim kanalları section'ları */}
      </>
    ) : (
      <TemporaryChangePanel
        programId={programId}
        branchId={branchId ?? ""}
        className={className}
        onApplied={onPublished}
      />
    )}
    ```
  - Ayrıca permanent'a özel **gate / affected / diff** section'larını da `pubType === "permanent"` iken göster (Geçici modda yayın-önizleme bağlamı alakasız). En basiti: gate+affected+diff+type'ı sarmalama; yalnız type toggle her zaman görünür, gate/affected/diff yalnız permanent'ta. Bunu yapmak için gate/affected/diff section'larını `{pubType === "permanent" && (<>...</>)}` ile sarıp, type toggle'ı bunların dışına (üstte) al. **Önerilen düzen:** (1) type toggle section, (2) `pubType==="permanent"` ? (gate, affected, diff, note, channels) : `<TemporaryChangePanel/>`.

- [ ] **Step 4: Footer.** Drawer'ın alt `pub-foot`'u (Yayınla CTA) yalnız `pubType === "permanent"` iken görünsün; Geçici modda panel kendi footer'ını (`tmp-foot`) render eder. Footer bloğunu `{pubType === "permanent" && (<div className="pub-foot">...</div>)}` ile sarmala. (`step` confirm/done/publishing dalları permanent'a özel; Geçici modda bunlara girilmez çünkü Geçici akışı panel içinde yaşar.)

- [ ] **Step 5: branchId'yi çağıranlardan geç.**
  - `ScheduleEditorPage.tsx`: `<PublishDrawer ...>` kullanımına `branchId={data.program?.branchId}` ekle.
  - Hub'da PublishDrawer açan yer (RowMenu/ScheduleHubPage — `git grep "PublishDrawer" src/portals/admin/timetable`): satırın `branchId`'sini geç (`row.branchId`). Açan yeri bul ve prop'u ekle.

- [ ] **Step 6: Build + mevcut drawer testleri.** `npm run build` → success. `npx vitest run src/portals/admin/timetable/__tests__/PublishDrawer.test.tsx` → mevcut testler hâlâ geçmeli (permanent yol değişmedi). Kırılırsa (ör. yeni `branchId` prop'u veya toggle değişikliği), testi minimal güncelle (permanent davranışı koruyarak).

- [ ] **Step 7: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable
git commit -m "2026-06-13 feat: Ders programı Yayınla drawer Geçici değişiklik yolu bağlandı (Published iken aktif + kompoze panel)."
```

---

### Task 5: i18n anahtarları (tr/en)

**Files:**
- Modify: `src/shared/i18n/locales/tr/timetable.json`
- Modify: `src/shared/i18n/locales/en/timetable.json`

- [ ] **Step 1: tr — `publish` objesine `temp` alt-bloğu ekle** (mevcut `temporary`/`temporarySub` korunur):

```json
      "temp": {
        "needPublished": "Geçici değişiklik için önce kalıcı yayın gerekir.",
        "date": "Tarih",
        "pickTarget": "Hedef dersi seçin (yayındaki programdan)",
        "selectedLesson": "Seçilen: {{subject}} · {{teacher}} · {{room}}",
        "notPublished": "Bu sınıfın yayınlanmış programı yok.",
        "typeTitle": "Değişiklik tipi",
        "type": {
          "Cancellation": "Ders iptal",
          "TeacherSubstitution": "Öğretmen vekaleti",
          "RoomChange": "Derslik değişikliği"
        },
        "pickTeacher": "Yeni öğretmen seçin",
        "pickRoom": "Yeni derslik seçin",
        "reason": "Sebep (zorunlu)",
        "reasonPlaceholder": "Değişiklik sebebi (ör. Ali Hoca raporlu)…",
        "preview": "Önizle",
        "apply": "Uygula",
        "canApplyOk": "Uygulanabilir",
        "cannotApply": "Bu değişiklik uygulanamaz",
        "affected": "{{teachers}} öğretmen · {{students}} öğrenci · {{parents}} veli etkilenecek",
        "applyFailed": "Geçici değişiklik uygulanamadı. Lütfen tekrar deneyin.",
        "appliedTitle": "Geçici değişiklik uygulandı",
        "appliedSub": "{{date}} için geçici değişiklik kaydedildi. İlgili kişilere yansıyacak."
      }
```

Ayrıca `errors` objesine geçici değişiklik hata kodlarını ekle (backend `timetable.errors.exception-*`):

```json
      "exception-not-published": "Bu programın yayınlanmış bir sürümü yok.",
      "exception-placement-not-found": "Hedef ders yayınlanmış programda bulunamadı.",
      "exception-date-out-of-range": "Tarih bugünden itibaren 30 gün içinde olmalı.",
      "exception-day-mismatch": "Seçilen tarih, dersin gününe uymuyor.",
      "exception-holiday": "Seçilen tarih tatil gününe denk geliyor.",
      "exception-substitute-required": "Vekalet için yeni öğretmen seçin.",
      "exception-substitute-same": "Vekil öğretmen mevcut öğretmenle aynı olamaz.",
      "exception-room-required": "Derslik değişikliği için yeni derslik seçin.",
      "exception-room-same": "Yeni derslik mevcut derslikle aynı olamaz.",
      "exception-teacher-conflict": "Yeni öğretmen o saatte başka bir derste meşgul.",
      "exception-room-conflict": "Yeni derslik o saatte başka bir derste kullanılıyor.",
      "exception-duplicate-active": "Bu ders için o tarihte zaten aktif bir geçici değişiklik var."
```

- [ ] **Step 2: en — aynı anahtarların İngilizcesi** (`publish.temp` + `errors.exception-*`). Örn `type`: "Cancel lesson"/"Substitute teacher"/"Change room"; `needPublished`: "A permanent publish is required before a temporary change."; vb. Tüm anahtarları tr ile birebir aynı yapıda, İngilizce değerlerle ekle.

- [ ] **Step 3: JSON doğrula.** `node -e "require('./src/shared/i18n/locales/tr/timetable.json'); require('./src/shared/i18n/locales/en/timetable.json'); console.log('ok')"`.

- [ ] **Step 4: Commit**

```bash
cd oksis-web && git add src/shared/i18n/locales/tr/timetable.json src/shared/i18n/locales/en/timetable.json
git commit -m "2026-06-13 feat: Ders programı geçici değişiklik i18n anahtarları (form + hata kodları, tr/en)."
```

---

### Task 6: TemporaryChangePanel testi + drawer toggle testi

**Files:**
- Create: `src/portals/admin/timetable/components/__tests__/TemporaryChangePanel.test.tsx`
- Modify: `src/portals/admin/timetable/__tests__/PublishDrawer.test.tsx` (yalnız bir yeni test eklenir)

- [ ] **Step 1: TemporaryChangePanel testi.** P17 (`getBranchWeekly`), lookups, P24 (`previewException`), P25 (`createException`) mock'lanır; akış: ızgaradan ders seç → tip vekalet → öğretmen seç → sebep → Önizle (P24 canApply:true) → Uygula (P25) → done.

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import "../../../../../shared/i18n";

vi.mock("../../../../../shared/store/authStore", () => ({
  useAuthStore: (sel: (s: { user: { schoolId: string } }) => unknown) => sel({ user: { schoolId: "school1" } }),
}));

const getBranchWeekly = vi.fn();
const previewException = vi.fn();
const createException = vi.fn();
vi.mock("../../api/timetableApi", () => ({
  timetableApi: {
    getBranchWeekly: (...a: unknown[]) => getBranchWeekly(...a),
    previewException: (...a: unknown[]) => previewException(...a),
    createException: (...a: unknown[]) => createException(...a),
  },
}));
vi.mock("../../editor/api/editorLookups", () => ({
  fetchTeacherNames: async () => new Map([["t1", "Ahmet Yılmaz"], ["t2", "Hasan Kılıç"]]),
  fetchRoomCodes: async () => new Map([["r1", "B-201"], ["r2", "Lab-1"]]),
}));

import { TemporaryChangePanel } from "../TemporaryChangePanel";

const weekly = {
  academicYearId: "y", academicTermId: "tm", branchId: "b1", branchName: "9-A",
  version: 1, publishedAt: "2026-01-01T00:00:00Z",
  days: [{ day: 1, shortName: "Sal", name: "Salı" }],
  periods: [{ period: 3, label: "3", startTime: "10:00", endTime: "10:40" }],
  lessons: [{
    placementId: "pl1", day: 1, period: 3, startTime: "10:00", endTime: "10:40",
    subjectId: "s1", subjectName: "Matematik", teacherId: "t1", teacherName: "Ahmet Yılmaz",
    roomId: "r1", roomName: "B-201", branchId: "b1", branchName: "9-A", isBlock: false, blockGroupId: null,
  }],
};

function wrap({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  getBranchWeekly.mockReset().mockResolvedValue(weekly);
  previewException.mockReset().mockResolvedValue({ canApply: true, target: null, issues: [], affected: { teachers: 1, students: 20, parents: 18 } });
  createException.mockReset().mockResolvedValue({ id: "e1", date: "2026-02-17", type: "TeacherSubstitution" });
});

describe("TemporaryChangePanel", () => {
  it("ders seç → vekalet → öğretmen + tarih + sebep → Önizle → Uygula → done", async () => {
    render(<TemporaryChangePanel programId="p1" branchId="b1" className="9-A" />, { wrapper: wrap });

    // ızgara yüklenince ders görünür
    const cell = await screen.findByRole("button", { name: "Matematik" });
    fireEvent.click(cell);

    fireEvent.click(screen.getByRole("button", { name: /Öğretmen vekaleti/ }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "t2" } });
    fireEvent.change(screen.getByDisplayValue(""), { target: { value: "2026-02-17" } }); // tarih input
    fireEvent.change(screen.getByPlaceholderText(/Değişiklik sebebi/), { target: { value: "Raporlu" } });

    fireEvent.click(screen.getByRole("button", { name: /Önizle/ }));
    await waitFor(() => expect(previewException).toHaveBeenCalledWith("p1", {
      date: "2026-02-17", type: "TeacherSubstitution", targetPlacementId: "pl1", newTeacherId: "t2", newRoomId: null,
    }));

    const applyBtn = await screen.findByRole("button", { name: /Uygula/ });
    fireEvent.click(applyBtn);
    await waitFor(() => expect(createException).toHaveBeenCalledWith("p1", {
      date: "2026-02-17", type: "TeacherSubstitution", targetPlacementId: "pl1", newTeacherId: "t2", newRoomId: null, reason: "Raporlu",
    }));
    expect(await screen.findByText(/Geçici değişiklik uygulandı/)).toBeInTheDocument();
  });

  it("önizleme uygulanamaz → engel listesi gösterilir, Uygula çıkmaz", async () => {
    previewException.mockResolvedValue({
      canApply: false, target: null,
      issues: [{ code: "timetable.errors.exception-day-mismatch", title: "" }],
      affected: { teachers: 0, students: 0, parents: 0 },
    });
    render(<TemporaryChangePanel programId="p1" branchId="b1" className="9-A" />, { wrapper: wrap });
    fireEvent.click(await screen.findByRole("button", { name: "Matematik" }));
    // iptal tipi (default) → ek alan gerekmez; tarih + (sebep önizleme için gerekmez)
    fireEvent.change(screen.getByDisplayValue(""), { target: { value: "2026-02-18" } });
    fireEvent.click(screen.getByRole("button", { name: /Önizle/ }));
    expect(await screen.findByText(/dersin gününe uymuyor/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Uygula/ })).toBeNull();
  });
});
```

> Selector notu: tarih input'unu `getByDisplayValue("")` ile yakalamak kırılgan olabilir (birden çok boş alan). Gerekirse input'a `aria-label={t("publish.temp.date")}` ekleyip `getByLabelText` kullan; bunu yapmak için Task 3'teki date input'a `aria-label` ekle. Implementer en sağlam selektörü seçsin (testi yeşil yapana kadar; component'e a11y için `aria-label` eklemek serbest).

- [ ] **Step 2: Çalıştır** — `npx vitest run src/portals/admin/timetable/components/__tests__/TemporaryChangePanel.test.tsx` → 2 pass. Selektör sorunlarını gider (gerekirse date input'a `aria-label` ekle + tr/en'e zaten eklenen `publish.temp.date` kullan).

- [ ] **Step 3: Drawer toggle testi.** `PublishDrawer.test.tsx`'e bir test ekle: publish-preview `status: "Published"` iken "Geçici değişiklik" toggle'ı **enabled**; `status: "Draft"` iken **disabled**. (Mevcut testlerin mock'unu bozmadan; preview mock'una `status` alanı ekle.) Mevcut test dosyasının mock/yapısını oku ve minimal bir `it(...)` ekle.

- [ ] **Step 4: Klasör testleri** — `npx vitest run src/portals/admin/timetable` → tümü yeşil.

- [ ] **Step 5: Commit**

```bash
cd oksis-web && git add src/portals/admin/timetable/components/__tests__/TemporaryChangePanel.test.tsx src/portals/admin/timetable/__tests__/PublishDrawer.test.tsx src/portals/admin/timetable/components/TemporaryChangePanel.tsx
git commit -m "2026-06-13 test: Ders programı geçici değişiklik panel + drawer toggle testleri."
```

---

### Task 7: Tam doğrulama + dokümantasyon

**Files:**
- Modify: `.claude/docs/modules/timetable/completion_status.md`

- [ ] **Step 1: Tam paket + build.** `cd oksis-web && npm run test && npm run build` → tümü yeşil, build temiz. (Başarısızsa BLOCKED bildir.)

- [ ] **Step 2: Tarayıcı smoke (manuel).** `npm run dev` → yayında bir programın editöründe **Yayınla** → drawer'da "Geçici değişiklik" **aktif** (Draft programda disabled). Seç → ızgaradan ders → tip → (öğretmen/derslik) → tarih → sebep → **Önizle** (uygulanabilir/engel) → **Uygula** → "uygulandı" durumu. Console error yok.

- [ ] **Step 3: completion_status.md güncelle.**
  - Üst özet bloğuna: **"Faz 2.5B-2 Geçici değişiklik web — oluşturma akışı tamamlandı (FE):** Yayınla drawer'ında 'Geçici değişiklik' yolu, backend P24/P25 ile birebir kompoze form olarak bağlandı (P17 yayınlanmış snapshot'tan mini ızgara → hedef ders → tip/öğretmen/derslik → tarih → sebep → Önizle/Uygula). Toggle yalnız Published programda aktif. Editör düzenlemelerinden bağımsız; tek istisna/gönderim. NNN vitest yeşil; npm run build temiz."
  - **⏳ Eksik / Bekleyen** altında **Debt-FE-5** satırını güncelle: oluşturma akışı tamam; **liste + geri al (P26/P27) → 2.5B-3'te**.
  - ⚠️ Spec Dışına Çıkılanlar gerekmiyorsa dokunma (bu dilim spec'le uyumlu; kullanıcı onaylı kompoze-form kararı zaten 2.5B brainstorming'inde alındı — istersen kısa not: "2026-06-13 · Geçici değişiklik UI = drawer kompoze form (editör-diff değil); backend tek-yerleşim/tek-tip modeliyle 1:1, kullanıcı onaylı.").

- [ ] **Step 4: Commit (workspace repo).**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs/modules/timetable/completion_status.md docs/superpowers/plans/2026-06-13-ders-programi-2-5b-2-gecici-degisiklik-web-create.md
git commit -m "2026-06-13 docs: Ders programı 2.5B-2 geçici değişiklik web oluşturma — completion_status + plan."
```

- [ ] **Step 5: Rapor** — tam test sayısı, build sonucu, completion_status'a eklenenler, workspace commit SHA.

---

## Self-Review

**Spec coverage (kullanıcı kararı = drawer kompoze form):**
- Geçici toggle Published iken aktif → Task 4. ✅
- Mini ızgaradan hedef ders (P17, placementId) → Task 3. ✅
- Tip (iptal/vekalet/derslik) + koşullu öğretmen/derslik alanı → Task 3 + saf yardımcı Task 2. ✅
- Tarih + zorunlu sebep → Task 2/3. ✅
- Önizle (P24) + Uygula (P25) + done → Task 1/3. ✅
- Doğrulama backend'de; engel listesi gösterimi → Task 3 (issues). ✅
- Editörden bağımsızlık (op-log okumaz) → mimari/Task 3 (kendi fetch'i). ✅
- Liste/geri al kapsam dışı (2.5B-3) → açıkça belirtildi. ✅

**Placeholder taraması:** Kod blokları gerçek; TBD yok. Bileşen markup'ı `.pub-*`/`.tmp-*` sınıflarıyla somut. ✅

**Tip tutarlılığı:** `ScheduleExceptionType`, `ExceptionInput`, `CreateExceptionInput`, `ScheduleExceptionPreviewDto`, `CreateExceptionResultDto` Task 1'de tanımlı; `TempForm` Task 2'de; Task 3 ikisini de aynı imzalarla kullanıyor. `buildExceptionBody` → `ExceptionInput`; create gövdesi `{...body, reason}` → `CreateExceptionInput`. `getBranchWeekly` → consumer `PublishedWeeklyScheduleDto`. P24/P25 gövde alanları backend `ScheduleExceptionBody`/`CreateScheduleExceptionBody` ile birebir (date/type/targetPlacementId/newTeacherId/newRoomId[/reason]). ✅

**Bağımlılık sırası:** 1 (tip+api) → 2 (saf) → 3 (panel, 1+2'ye bağlı) → 4 (drawer, 3'e bağlı; branchId çağıranlardan) → 5 (i18n) → 6 (test) → 7 (doğrulama+docs). Task 3 ve 4 build-clean bırakır (panel kullanılana dek de derlenir). Geçici-toggle'ın `data.status` gerektirdiği publish-preview DTO'sunda `status` alanı mevcut (types.ts PublishPreviewDto.status). ✅

**Açık risk (not):** `getBranchWeekly` (P17) yalnız branchId alır ve **latest published** döner; program yayınlanmış ama aggregate snapshot'tan ayrışmışsa (kaydedilmiş-ama-yeniden-yayınlanmamış kalıcı düzenleme) ızgaradaki placementId'ler snapshot ile uyumludur (P17 zaten snapshot'tan okur) — yani hedef her zaman geçerli snapshot id'sidir. Bu, aggregate yerine P17 kullanmanın nedenidir.
