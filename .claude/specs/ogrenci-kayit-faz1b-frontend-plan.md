# Öğrenci Kayıt Faz 1B (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut tek-adımlı `EnrollStudentDialog`'u, teslim alınan 5-adımlı `EnrollStudentSheet` sihirbazıyla değiştirip Faz 1A kayıt uçlarına bağlamak.

**Architecture:** `src/portals/admin/students` altında, `academic-sessions` sihirbaz desenini (Zod + RHF + adım bileşenleri + queryKeys + mutation invalidation) izleyen sheet/modal sihirbaz. Veri erişimi `studentsApi.ts`'de izole; form state tek `useForm` + `FormProvider`. Stil, handoff `flows.css`'den port edilen scoped `enroll.css`.

**Tech Stack:** React + TS, React Hook Form, Zod, TanStack Query, react-i18next, sonner (toast), lucide-react, Vitest + Testing Library.

## Global Constraints

- **Repo/working dir:** `oksis-web/` (komutlar buradan).
- **Hardcoded Türkçe YASAK** — tüm metin `students` i18n namespace'i (`t("enrollWizard.*")`).
- **Component/identifier İngilizce PascalCase**; UI metni Türkçe (i18n).
- **Tenant scoping:** React Query key'leri `studentKeys.*` ile `schoolId` taşır (`useAuthStore((s) => s.user?.schoolId)`).
- **Gerçek uçlar (Faz 1A, base `api/v1`):**
  - `POST /students:enroll` ve `POST /students:transfer-in` — body `EnrollStudentCommand`.
  - `GET /students/check-national-id?nationalId=&idType=` → `NationalIdDuplicateDto(bool Exists, Guid? PersonId, string? FullName, string? StudentNumber)`.
  - `GET /branches/capacity?academicSessionId=&gradeLevelId=` → `BranchCapacityDto(Guid ClassRoomId, string FullName, int Used, int Capacity)[]`.
  - `GET /guardians:search?query=` → `GuardianSearchItemDto(Guid PersonId, string FullName, string? Phone, string? Email)[]`.
- **EnrollStudentCommand alanları (PascalCase JSON):** `ClientRequestId, FirstName, LastName, Gender, BirthDate?, NationalId?, NationalIdType?, Email?, Type, PreviousSchool?, AcademicSessionId, GradeLevel(int), ClassRoomId, EnrollmentDate, Guardians[], Invite, InviteChannel?`.
- **GuardianInput alanları:** `ExistingPersonId?, FirstName?, LastName?, RelationType, Phone?, Email?, CanViewInfo, CanMakeDecisions, IsPaymentResponsible, CanPickup, IsPrimaryContact`.
- **EnrollStudentResult:** `StudentPersonId, EnrollmentId, StudentNumber, HasGuardianWarning`. **Geçici şifre / öğrenci hesabı YOK** (E2.6/E2.7 ertelendi) → başarı ekranında şifre satırı **Debt**, sahte değer basılmaz.
- **Enum JSON değerleri:** `Gender` → `Female`/`Male`; `EnrollmentType` → `New`/`TransferIn`; `IdType` → `Tckn`; `InvitationChannel` → `Email`/`Sms`/`WhatsApp`; `RelationType` → `Mother`/`Father`/`Guardian`/`Other`. (Backend enum string serileştirme; mevcut `studentsApi` örneklerindeki kasayı izle.)
- **Handoff kaynağı (birebir port):** `enroll_wizard.jsx` (scratchpad: `design/app/enroll_wizard.jsx`) ve `flows.css`. JSX yapısı buradan portlanır; mock `W_*` sabitleri hook/prop ile değiştirilir.
- **TDD:** Her task RED→GREEN. **Test runner `npx vitest run` (npm `test` script'i YOK).** Odaklı test: `npx vitest run <path>`; commit öncesi bir kez tüm süit: `npx vitest run`. Build: `npm run build`. (Plan gövdesindeki `npm run test -- <path>` komutlarını `npx vitest run <path>` olarak uygula.)

---

### Task 1: Wizard tipleri + Zod şema + `toEnrollCommand`

Saf mantık; UI yok. Adım-bazlı doğrulama ve komut eşleşmesi.

**Files:**
- Create: `src/portals/admin/students/schemas/enrollWizardSchema.ts`
- Test: `src/portals/admin/students/__tests__/enrollWizardSchema.test.ts`

**Interfaces:**
- Produces:
  - `type EnrollWizardForm` (RHF form state).
  - `type GuardianDraft` (formdaki tek veli).
  - `enrollWizardSchema: ZodType<EnrollWizardForm>` ve `stepSchemas: ZodType[]` (adım 0..4).
  - `isStepValid(step: number, form: EnrollWizardForm, tcknDuplicate: boolean): boolean`.
  - `gradeLevelToInt(code: string, displayOrder: number): number`.
  - `toEnrollCommand(form: EnrollWizardForm, ctx: { clientRequestId: string; academicSessionId: string; gradeLevel: number }): EnrollStudentCommandBody`.
  - `type EnrollStudentCommandBody`, `type GuardianInputBody`.

- [ ] **Step 1: Failing test yaz**

```ts
// enrollWizardSchema.test.ts
import { describe, it, expect } from "vitest";
import {
  isStepValid,
  gradeLevelToInt,
  toEnrollCommand,
  type EnrollWizardForm,
} from "../schemas/enrollWizardSchema";

const base: EnrollWizardForm = {
  type: "new",
  firstName: "Ada",
  lastName: "Yılmaz",
  nationalId: "12345678901",
  birthDate: "01.09.2014",
  gender: "female",
  gradeLevelId: "g-5",
  gradeLevelCode: "5",
  gradeLevelDisplayOrder: 5,
  classRoomId: "c-5a",
  previousSchool: "",
  enrollmentDate: "28.06.2026",
  guardians: [],
  invite: true,
  inviteChannel: "sms",
};

describe("isStepValid", () => {
  it("step 0 requires a type", () => {
    expect(isStepValid(0, base, false)).toBe(true);
    expect(isStepValid(0, { ...base, type: "" as never }, false)).toBe(false);
  });
  it("step 1 requires name + 11-digit tckn and no duplicate", () => {
    expect(isStepValid(1, base, false)).toBe(true);
    expect(isStepValid(1, base, true)).toBe(false); // duplicate blocks
    expect(isStepValid(1, { ...base, nationalId: "123" }, false)).toBe(false);
    expect(isStepValid(1, { ...base, firstName: " " }, false)).toBe(false);
  });
  it("step 2 requires classRoom; transfer-in also requires previousSchool", () => {
    expect(isStepValid(2, base, false)).toBe(true);
    expect(isStepValid(2, { ...base, classRoomId: "" }, false)).toBe(false);
    const nakil = { ...base, type: "transferIn" as const, previousSchool: "" };
    expect(isStepValid(2, nakil, false)).toBe(false);
    expect(isStepValid(2, { ...nakil, previousSchool: "X Okulu" }, false)).toBe(true);
  });
});

describe("gradeLevelToInt", () => {
  it("parses numeric code, falls back to displayOrder", () => {
    expect(gradeLevelToInt("5", 5)).toBe(5);
    expect(gradeLevelToInt("ANA", 0)).toBe(0);
  });
});

describe("toEnrollCommand", () => {
  it("maps form to PascalCase command with new type", () => {
    const cmd = toEnrollCommand(
      { ...base, guardians: [
        { existingPersonId: "p-1", firstName: "", lastName: "", relationType: "mother",
          phone: "0532", email: "a@b.c", canViewInfo: true, canMakeDecisions: false,
          isPaymentResponsible: false, canPickup: false, isPrimaryContact: true },
      ] },
      { clientRequestId: "req-1", academicSessionId: "s-1", gradeLevel: 5 },
    );
    expect(cmd).toMatchObject({
      ClientRequestId: "req-1",
      FirstName: "Ada",
      LastName: "Yılmaz",
      Gender: "Female",
      NationalId: "12345678901",
      NationalIdType: "Tckn",
      Type: "New",
      AcademicSessionId: "s-1",
      GradeLevel: 5,
      ClassRoomId: "c-5a",
      Invite: true,
      InviteChannel: "Sms",
    });
    expect(cmd.BirthDate).toBe("2014-09-01");
    expect(cmd.EnrollmentDate).toBe("2026-06-28");
    expect(cmd.Guardians[0]).toMatchObject({
      ExistingPersonId: "p-1", RelationType: "Mother", CanViewInfo: true, IsPrimaryContact: true,
    });
  });
  it("uses TransferIn type and omits empty optionals", () => {
    const cmd = toEnrollCommand(
      { ...base, type: "transferIn", previousSchool: "Eski Okul", nationalId: "", birthDate: "", invite: false },
      { clientRequestId: "r", academicSessionId: "s", gradeLevel: 6 },
    );
    expect(cmd.Type).toBe("TransferIn");
    expect(cmd.PreviousSchool).toBe("Eski Okul");
    expect(cmd.NationalId).toBeUndefined();
    expect(cmd.BirthDate).toBeUndefined();
    expect(cmd.Invite).toBe(false);
    expect(cmd.InviteChannel).toBeUndefined();
  });
});
```

- [ ] **Step 2: Testi çalıştır, FAIL gör**

Run: `npm run test -- src/portals/admin/students/__tests__/enrollWizardSchema.test.ts`
Expected: FAIL — module/exports yok.

- [ ] **Step 3: Şemayı uygula**

`enrollWizardSchema.ts` içeriği (özet — tam kod):

```ts
import { z } from "zod";

export type WizardType = "new" | "transferIn";
export type WizardGender = "female" | "male";
export type WizardChannel = "email" | "sms" | "whatsapp";
export type WizardRelation = "mother" | "father" | "guardian" | "other";

export interface GuardianDraft {
  existingPersonId: string | null;
  firstName: string;
  lastName: string;
  relationType: WizardRelation;
  phone: string;
  email: string;
  canViewInfo: boolean;
  canMakeDecisions: boolean;
  isPaymentResponsible: boolean;
  canPickup: boolean;
  isPrimaryContact: boolean;
}

export interface EnrollWizardForm {
  type: WizardType;
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;       // gg.aa.yyyy
  gender: WizardGender;
  gradeLevelId: string;
  gradeLevelCode: string;
  gradeLevelDisplayOrder: number;
  classRoomId: string;
  previousSchool: string;
  enrollmentDate: string;  // gg.aa.yyyy
  guardians: GuardianDraft[];
  invite: boolean;
  inviteChannel: WizardChannel;
}

const tcknOk = (v: string) => v.replace(/\D/g, "").length === 11;

export function isStepValid(step: number, f: EnrollWizardForm, tcknDuplicate: boolean): boolean {
  if (step === 0) return f.type === "new" || f.type === "transferIn";
  if (step === 1)
    return (
      f.firstName.trim().length > 0 &&
      f.lastName.trim().length > 0 &&
      tcknOk(f.nationalId) &&
      !tcknDuplicate
    );
  if (step === 2)
    return f.classRoomId.length > 0 && (f.type !== "transferIn" || f.previousSchool.trim().length > 0);
  return true; // 3 (veli) ve 4 (özet) serbest
}

export function gradeLevelToInt(code: string, displayOrder: number): number {
  const n = Number.parseInt(code, 10);
  return Number.isNaN(n) ? displayOrder : n;
}

// gg.aa.yyyy -> yyyy-aa-gg (DateOnly); boş/eksik -> undefined
function toIso(d: string): string | undefined {
  const m = d.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : undefined;
}

const GENDER: Record<WizardGender, "Female" | "Male"> = { female: "Female", male: "Male" };
const TYPE: Record<WizardType, "New" | "TransferIn"> = { new: "New", transferIn: "TransferIn" };
const CHANNEL: Record<WizardChannel, "Email" | "Sms" | "WhatsApp"> = {
  email: "Email", sms: "Sms", whatsapp: "WhatsApp",
};
const RELATION: Record<WizardRelation, "Mother" | "Father" | "Guardian" | "Other"> = {
  mother: "Mother", father: "Father", guardian: "Guardian", other: "Other",
};

export interface GuardianInputBody {
  ExistingPersonId?: string;
  FirstName?: string;
  LastName?: string;
  RelationType: string;
  Phone?: string;
  Email?: string;
  CanViewInfo: boolean;
  CanMakeDecisions: boolean;
  IsPaymentResponsible: boolean;
  CanPickup: boolean;
  IsPrimaryContact: boolean;
}

export interface EnrollStudentCommandBody {
  ClientRequestId: string;
  FirstName: string;
  LastName: string;
  Gender: "Female" | "Male";
  BirthDate?: string;
  NationalId?: string;
  NationalIdType?: "Tckn";
  Email?: string;
  Type: "New" | "TransferIn";
  PreviousSchool?: string;
  AcademicSessionId: string;
  GradeLevel: number;
  ClassRoomId: string;
  EnrollmentDate: string;
  Guardians: GuardianInputBody[];
  Invite: boolean;
  InviteChannel?: "Email" | "Sms" | "WhatsApp";
}

const blank = (s: string) => (s.trim().length === 0 ? undefined : s.trim());

export function toEnrollCommand(
  f: EnrollWizardForm,
  ctx: { clientRequestId: string; academicSessionId: string; gradeLevel: number },
): EnrollStudentCommandBody {
  const nid = blank(f.nationalId);
  return {
    ClientRequestId: ctx.clientRequestId,
    FirstName: f.firstName.trim(),
    LastName: f.lastName.trim(),
    Gender: GENDER[f.gender],
    BirthDate: toIso(f.birthDate),
    NationalId: nid,
    NationalIdType: nid ? "Tckn" : undefined,
    Email: f.guardians.find((g) => blank(g.email))?.email?.trim(),
    Type: TYPE[f.type],
    PreviousSchool: f.type === "transferIn" ? blank(f.previousSchool) : undefined,
    AcademicSessionId: ctx.academicSessionId,
    GradeLevel: ctx.gradeLevel,
    ClassRoomId: f.classRoomId,
    EnrollmentDate: toIso(f.enrollmentDate) ?? toIso(f.enrollmentDate)!,
    Guardians: f.guardians.map((g) => ({
      ExistingPersonId: g.existingPersonId ?? undefined,
      FirstName: blank(g.firstName),
      LastName: blank(g.lastName),
      RelationType: RELATION[g.relationType],
      Phone: blank(g.phone),
      Email: blank(g.email),
      CanViewInfo: g.canViewInfo,
      CanMakeDecisions: g.canMakeDecisions,
      IsPaymentResponsible: g.isPaymentResponsible,
      CanPickup: g.canPickup,
      IsPrimaryContact: g.isPrimaryContact,
    })),
    Invite: f.invite,
    InviteChannel: f.invite ? CHANNEL[f.inviteChannel] : undefined,
  };
}

// Adım-bazlı Zod (RHF resolver kullanımı opsiyonel; isStepValid runtime kapısıdır)
export const enrollWizardSchema = z.object({
  type: z.enum(["new", "transferIn"]),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  nationalId: z.string().refine(tcknOk),
  classRoomId: z.string().min(1),
});
```

> Not: `EnrollmentDate` her zaman geçerli `gg.aa.yyyy` (formda default bugünün tarihi, salt-okunur değilse maskeli). `toIso` boşsa fallback yok — form `enrollmentDate`'i boş bırakılamaz (default atanır, Task 5).

- [ ] **Step 4: Test PASS**

Run: `npm run test -- src/portals/admin/students/__tests__/enrollWizardSchema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/students/schemas/enrollWizardSchema.ts src/portals/admin/students/__tests__/enrollWizardSchema.test.ts
git commit -m "2026-06-29 feat,test: Öğrenci kayıt sihirbazı Zod şeması + komut eşleşmesi (Faz 1B)."
```

---

### Task 2: API katmanı — gerçek uçlar (`studentsApi.ts`)

**Files:**
- Modify: `src/portals/admin/students/api/studentsApi.ts` (yeni fonksiyonlar + tipler, mevcut `enrollmentHistory`/list dokunulmaz)
- Test: `src/portals/admin/students/__tests__/studentsApiEnroll.test.ts`

**Interfaces:**
- Consumes: `EnrollStudentCommandBody` (Task 1), `httpClient`, `ApiEnvelope<T>` (dosyada mevcut).
- Produces (hepsi `studentsApi` nesnesine eklenir):
  - `checkNationalId(nationalId: string, idType: "Tckn", signal?): Promise<NationalIdDuplicate>`
  - `branchCapacity(academicSessionId: string, gradeLevelId: string | null, signal?): Promise<BranchCapacity[]>`
  - `searchEnrollGuardians(query: string, signal?): Promise<GuardianSearchItem[]>` (**YENİ ad** — mevcut `searchGuardians` (drawer, `/users/persons`) ile çakışmamak için; onu EZME)
  - `enroll(body: EnrollStudentCommandBody): Promise<EnrollResult>`
  - `transferIn(body: EnrollStudentCommandBody): Promise<EnrollResult>`
  - Tipler: `NationalIdDuplicate { exists; personId; fullName; studentNumber }`, `BranchCapacity { classRoomId; fullName; used; capacity }`, `GuardianSearchItem { personId; fullName; phone; email }`, `EnrollResult { studentPersonId; enrollmentId; studentNumber; hasGuardianWarning }`.

- [ ] **Step 1: Failing test**

```ts
// studentsApiEnroll.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { httpClient } from "../../../../shared/api/httpClient";
import { studentsApi } from "../api/studentsApi";

vi.mock("../../../../shared/api/httpClient", () => ({
  httpClient: { get: vi.fn(), post: vi.fn() },
}));
const get = httpClient.get as unknown as ReturnType<typeof vi.fn>;
const post = httpClient.post as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => { get.mockReset(); post.mockReset(); });

describe("studentsApi enrollment", () => {
  it("checkNationalId hits real endpoint and unwraps", async () => {
    get.mockResolvedValue({ data: { data: { exists: true, personId: "p", fullName: "Ada", studentNumber: "20251001" } } });
    const r = await studentsApi.checkNationalId("12345678901", "Tckn");
    expect(get).toHaveBeenCalledWith(
      "/students/check-national-id",
      expect.objectContaining({ params: { nationalId: "12345678901", idType: "Tckn" } }),
    );
    expect(r).toEqual({ exists: true, personId: "p", fullName: "Ada", studentNumber: "20251001" });
  });

  it("branchCapacity passes session + grade params", async () => {
    get.mockResolvedValue({ data: { data: [{ classRoomId: "c", fullName: "5-A", used: 24, capacity: 28 }] } });
    const r = await studentsApi.branchCapacity("s-1", "g-5");
    expect(get).toHaveBeenCalledWith(
      "/branches/capacity",
      expect.objectContaining({ params: { academicSessionId: "s-1", gradeLevelId: "g-5" } }),
    );
    expect(r[0].used).toBe(24);
  });

  it("enroll posts to students:enroll", async () => {
    post.mockResolvedValue({ data: { data: { studentPersonId: "sp", enrollmentId: "e", studentNumber: "20251002", hasGuardianWarning: false } } });
    const body = { ClientRequestId: "r" } as never;
    const r = await studentsApi.enroll(body);
    expect(post).toHaveBeenCalledWith("/students:enroll", body);
    expect(r.studentNumber).toBe("20251002");
  });

  it("transferIn posts to students:transfer-in", async () => {
    post.mockResolvedValue({ data: { data: { studentPersonId: "sp", enrollmentId: "e", studentNumber: "x", hasGuardianWarning: true } } });
    await studentsApi.transferIn({} as never);
    expect(post).toHaveBeenCalledWith("/students:transfer-in", {});
  });
});
```

- [ ] **Step 2: FAIL gör**

Run: `npm run test -- src/portals/admin/students/__tests__/studentsApiEnroll.test.ts`
Expected: FAIL — fonksiyonlar yok.

- [ ] **Step 3: Uygula** — `studentsApi` nesnesine ekle (dosyadaki `unwrap`/`ApiEnvelope` ve mevcut imza stilini izle):

```ts
// types
export interface NationalIdDuplicate { exists: boolean; personId: string | null; fullName: string | null; studentNumber: string | null; }
export interface BranchCapacity { classRoomId: string; fullName: string; used: number; capacity: number; }
export interface GuardianSearchItem { personId: string; fullName: string; phone: string | null; email: string | null; }
export interface EnrollResult { studentPersonId: string; enrollmentId: string; studentNumber: string; hasGuardianWarning: boolean; }

// studentsApi içine:
checkNationalId: async (nationalId, idType, signal) => {
  const res = await httpClient.get<ApiEnvelope<NationalIdDuplicate>>(
    "/students/check-national-id", { params: { nationalId, idType }, signal });
  return unwrap(res.data);
},
branchCapacity: async (academicSessionId, gradeLevelId, signal) => {
  const res = await httpClient.get<ApiEnvelope<BranchCapacity[]>>(
    "/branches/capacity", { params: { academicSessionId, gradeLevelId }, signal });
  return unwrap(res.data);
},
searchEnrollGuardians: async (query, signal) => {   // YENİ ad (eski searchGuardians'ı EZME)
  const res = await httpClient.get<ApiEnvelope<GuardianSearchItem[]>>(
    "/guardians:search", { params: { query }, signal });
  return unwrap(res.data);
},
enroll: async (body) => {
  const res = await httpClient.post<ApiEnvelope<EnrollResult>>("/students:enroll", body);
  return unwrap(res.data);
},
transferIn: async (body) => {
  const res = await httpClient.post<ApiEnvelope<EnrollResult>>("/students:transfer-in", body);
  return unwrap(res.data);
},
```

> `unwrap` dosyada `const unwrap = <T,>(e: ApiEnvelope<T>): T => e.data;` (yoksa ekle; `academicSessionsApi` ile aynı).

- [ ] **Step 4: PASS**

Run: `npm run test -- src/portals/admin/students/__tests__/studentsApiEnroll.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/students/api/studentsApi.ts src/portals/admin/students/__tests__/studentsApiEnroll.test.ts
git commit -m "2026-06-29 feat,test: Öğrenci kayıt gerçek uç adaptörleri (enroll/transfer/capacity/dupe/guardian) (Faz 1B)."
```

---

### Task 3: Query key'leri + hook'lar

**Files:**
- Modify: `src/portals/admin/students/keys/studentKeys.ts`
- Create: `src/portals/admin/students/hooks/useEnrollWizardQueries.ts` (3 query hook)
- Create: `src/portals/admin/students/hooks/useEnrollStudentMutation.ts`
- Test: `src/portals/admin/students/__tests__/useEnrollWizardQueries.test.tsx`

**Interfaces:**
- Consumes: `studentsApi.*` (Task 2), `studentKeys`, `useAuthStore`.
- Produces:
  - `studentKeys.checkNationalId(schoolId, nationalId)`, `.branchCapacity(schoolId, sessionId, gradeLevelId)`, `.guardianSearch(schoolId, query)`.
  - `useCheckNationalIdQuery(nationalId: string)` — enabled yalnız 11 hane; `NationalIdDuplicate | undefined`.
  - `useBranchCapacityQuery(sessionId: string, gradeLevelId: string | null)` — enabled `gradeLevelId` varken.
  - `useGuardianSearchQuery(query: string)` — enabled `query.trim().length >= 2`.
  - `useEnrollStudentMutation()` — `mutate({ type, body })` → `studentsApi.enroll|transferIn`; onSuccess: toast + `invalidateQueries(studentKeys.all(schoolId))` + stats key.

- [ ] **Step 1: Failing test** (QueryClient wrapper; api mock)

```tsx
// useEnrollWizardQueries.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { studentsApi } from "../api/studentsApi";
import { useCheckNationalIdQuery, useBranchCapacityQuery } from "../hooks/useEnrollWizardQueries";

vi.mock("../api/studentsApi", () => ({ studentsApi: { checkNationalId: vi.fn(), branchCapacity: vi.fn(), searchGuardians: vi.fn() } }));
vi.mock("../../../../shared/store/authStore", () => ({ useAuthStore: (sel: (s: unknown) => unknown) => sel({ user: { schoolId: "school-1" } }) }));

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};
beforeEach(() => vi.clearAllMocks());

describe("useCheckNationalIdQuery", () => {
  it("is disabled until 11 digits", async () => {
    (studentsApi.checkNationalId as ReturnType<typeof vi.fn>).mockResolvedValue({ exists: false });
    const { result } = renderHook(() => useCheckNationalIdQuery("123"), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
    expect(studentsApi.checkNationalId).not.toHaveBeenCalled();
  });
  it("fires when 11 digits", async () => {
    (studentsApi.checkNationalId as ReturnType<typeof vi.fn>).mockResolvedValue({ exists: true });
    const { result } = renderHook(() => useCheckNationalIdQuery("12345678901"), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual({ exists: true }));
    expect(studentsApi.checkNationalId).toHaveBeenCalledWith("12345678901", "Tckn", expect.anything());
  });
});

describe("useBranchCapacityQuery", () => {
  it("disabled when gradeLevelId is null", () => {
    const { result } = renderHook(() => useBranchCapacityQuery("s-1", null), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
```

- [ ] **Step 2: FAIL gör** — Run: `npm run test -- src/portals/admin/students/__tests__/useEnrollWizardQueries.test.tsx`

- [ ] **Step 3: Uygula**

`studentKeys.ts` ekleri (mevcut `all(schoolId)` desenini izle):

```ts
checkNationalId: (schoolId?: string, nationalId?: string) =>
  [...studentKeys.all(schoolId), "check-national-id", nationalId] as const,
branchCapacity: (schoolId: string | undefined, sessionId: string, gradeLevelId: string | null) =>
  [...studentKeys.all(schoolId), "branch-capacity", sessionId, gradeLevelId] as const,
guardianSearch: (schoolId?: string, query?: string) =>
  [...studentKeys.all(schoolId), "guardian-search", query] as const,
```

`useEnrollWizardQueries.ts`:

```ts
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { studentKeys } from "../keys/studentKeys";
import { studentsApi } from "../api/studentsApi";

export function useCheckNationalIdQuery(nationalId: string) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const clean = nationalId.replace(/\D/g, "");
  return useQuery({
    queryKey: studentKeys.checkNationalId(schoolId, clean),
    queryFn: ({ signal }) => studentsApi.checkNationalId(clean, "Tckn", signal),
    enabled: clean.length === 11,
    staleTime: 30_000,
  });
}

export function useBranchCapacityQuery(sessionId: string, gradeLevelId: string | null) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery({
    queryKey: studentKeys.branchCapacity(schoolId, sessionId, gradeLevelId),
    queryFn: ({ signal }) => studentsApi.branchCapacity(sessionId, gradeLevelId, signal),
    enabled: !!sessionId && !!gradeLevelId,
  });
}

export function useGuardianSearchQuery(query: string) {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  const term = query.trim();
  return useQuery({
    queryKey: studentKeys.guardianSearch(schoolId, term),
    queryFn: ({ signal }) => studentsApi.searchEnrollGuardians(term, signal),
    enabled: term.length >= 2,
  });
}
```

`useEnrollStudentMutation.ts`:

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { studentKeys } from "../keys/studentKeys";
import { studentsApi, type EnrollResult } from "../api/studentsApi";
import type { EnrollStudentCommandBody } from "../schemas/enrollWizardSchema";

export function useEnrollStudentMutation() {
  const qc = useQueryClient();
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useMutation<EnrollResult, unknown, { type: "new" | "transferIn"; body: EnrollStudentCommandBody }>({
    mutationFn: ({ type, body }) =>
      type === "transferIn" ? studentsApi.transferIn(body) : studentsApi.enroll(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentKeys.all(schoolId) });
    },
  });
}
```

- [ ] **Step 4: PASS** — Run aynı test.
- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/students/keys/studentKeys.ts src/portals/admin/students/hooks/useEnrollWizardQueries.ts src/portals/admin/students/hooks/useEnrollStudentMutation.ts src/portals/admin/students/__tests__/useEnrollWizardQueries.test.tsx
git commit -m "2026-06-29 feat,test: Kayıt sihirbazı query/mutation hook'ları + key'leri (Faz 1B)."
```

---

### Task 4: i18n anahtarları (`enrollWizard.*`)

UI task'larından önce; tüm metin buradan gelir.

**Files:**
- Modify: `src/shared/i18n/locales/tr/students.json` (yeni `enrollWizard` bloğu; mevcut `enrollModal` Task 10'da silinir)
- Test: `src/portals/admin/students/__tests__/enrollI18n.test.ts`

**Interfaces:**
- Produces: `students.enrollWizard` ağacı — `steps.{type,student,placement,guardian,summary}`, `type.{newTitle,newDesc,transferTitle,transferDesc}`, `fields.*`, `errors.*`, `capacity.{available,warn,full}`, `guardian.{searchPlaceholder,addBtn,flags.*,...}`, `summary.*`, `success.{title,placed,inviteSent,studentNo,tempPasswordDebt,accountDebt}`, `nav.{back,next,save,cancel,stepCount}`, `debt.accountPending`.

- [ ] **Step 1: Failing test** (anahtar varlığı)

```ts
import { describe, it, expect } from "vitest";
import tr from "../../../../shared/i18n/locales/tr/students.json";

describe("enrollWizard i18n", () => {
  const w = (tr as { students: { enrollWizard?: Record<string, unknown> } }).students.enrollWizard;
  it("has required top-level groups", () => {
    expect(w).toBeDefined();
    for (const k of ["steps", "type", "fields", "errors", "capacity", "guardian", "summary", "success", "nav"])
      expect(w).toHaveProperty(k);
  });
  it("success carries debt strings for deferred student account", () => {
    expect((w as { success: Record<string, string> }).success).toHaveProperty("tempPasswordDebt");
    expect((w as { success: Record<string, string> }).success).toHaveProperty("accountDebt");
  });
});
```

- [ ] **Step 2: FAIL** — Run: `npm run test -- src/portals/admin/students/__tests__/enrollI18n.test.ts`
- [ ] **Step 3: Uygula** — `students.json` içine `enrollWizard` bloğunu ekle. Tüm Türkçe metin handoff `enroll_wizard.jsx`'teki birebir string'lerden alınır (örn. step başlıkları "Kayıt türünü seçin", "Öğrenci bilgileri", kapasite "Uygun · {{n}} boş" / "DOLU · seçilemez", success "{{name}} kaydedildi", `accountDebt: "Öğrenci hesabı yakında açılacak (backend bekleniyor)"`, `tempPasswordDebt: "Faz 1B-BE"`). Anahtar→metin tam listesi handoff'tan portlanır.
- [ ] **Step 4: PASS** — aynı test.
- [ ] **Step 5: Commit**

```bash
git add src/shared/i18n/locales/tr/students.json src/portals/admin/students/__tests__/enrollI18n.test.ts
git commit -m "2026-06-29 feat,test: Kayıt sihirbazı i18n anahtarları (enrollWizard) (Faz 1B)."
```

---

### Task 5: CSS port (`enroll.css`) + sihirbaz kabuğu `EnrollStudentSheet` + `WizardRail`

**Files:**
- Create: `src/portals/admin/students/enroll.css` (handoff `flows.css`'ten enroll kuralları)
- Create: `src/portals/admin/students/components/enroll/WizardRail.tsx`
- Create: `src/portals/admin/students/components/enroll/EnrollStudentSheet.tsx`
- Test: `src/portals/admin/students/__tests__/EnrollStudentSheet.test.tsx`

**Interfaces:**
- Consumes: `isStepValid` (Task 1), `useCheckNationalIdQuery` (Task 3), i18n (Task 4).
- Produces:
  - `EnrollStudentSheet({ startMode, classroomOptions, onClose }: EnrollSheetProps)` — RHF `FormProvider`, adım state, footer (Geri/İleri/Kaydet), `ClientRequestId` (`crypto.randomUUID()`), Esc kapatma.
  - `type EnrollSheetProps`, `type ClassroomOption` (Task 7'de doldurulur — burada boş geçilebilir).
  - Adım router: step 0..4 placeholder `<div data-step="N" />` (gerçek adımlar Task 6-9'da takılır).

**CSS port kapsamı (flows.css → enroll.css):** `.sheet-scrim, .enroll-sheet(.has-rail), .esh-head/.esh-ico/.esh-ht/.esh-x, .esh-main(.vert/.horz), .esh-body, .esh-foot, .esh-step-count, .stepper-rail/.step-v(.active/.done)/.marker/.sv-*, .stepper-top/.step-h/.step-conn, .step-title/.step-sub, .fld/.fld-row/.fld-l/.inp/.sel/.seg/.fld-err/.fld-ok/.fld-hint/.req/.opt, .type-cards/.type-card(.on)/.tc-*, .photo-up/.pu-*, .dupe-warn/.dw-*, .cap-grid/.cap-card(.on/.full)/.cc-*/.cap-bar/.cap-fill(.warn/.full), .added-guardians/.ag-*, .no-guardian/.ng-*, .lookup-*, .flag-list/.flag-row(.on)/.fr-*, .summary-card/.summary-*/.sh-*/.sr-*, .channel-seg/.channel-opt(.on)/.co-*, .identity-box/.ib-*/.idcard/.idc-*, .enroll-done/.ed-*/.done-invite/.di-*, .lc-badge(.lc-aktif/.lc-davetli/.lc-nakil), .btn/.btn-primary/.btn-ghost(.disabled), .primary-tag`. CSS değerleri `flows.css`'ten birebir kopyalanır; renkler mevcut `theme.css` değişkenlerini (`var(--accent)` vb.) kullanır.

- [ ] **Step 1: Failing test**

```tsx
// EnrollStudentSheet.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "../../../../shared/i18n";          // mevcut test i18n init
import { I18nextProvider } from "react-i18next";
import { EnrollStudentSheet } from "../components/enroll/EnrollStudentSheet";

vi.mock("../../../../shared/store/authStore", () => ({ useAuthStore: () => "school-1" }));
vi.mock("../hooks/useEnrollWizardQueries", () => ({
  useCheckNationalIdQuery: () => ({ data: undefined, isFetching: false }),
  useBranchCapacityQuery: () => ({ data: [], isLoading: false }),
  useGuardianSearchQuery: () => ({ data: [], isFetching: false }),
}));

function renderSheet(onClose = vi.fn()) {
  const qc = new QueryClient();
  render(
    <QueryClientProvider client={qc}>
      <I18nextProvider i18n={i18n}>
        <EnrollStudentSheet startMode="new" classroomOptions={[]} onClose={onClose} />
      </I18nextProvider>
    </QueryClientProvider>,
  );
  return onClose;
}

describe("EnrollStudentSheet shell", () => {
  it("renders step 1 (type) and a 5-step rail", () => {
    renderSheet();
    expect(screen.getByText(/Kayıt türünü seçin/i)).toBeInTheDocument();
    expect(screen.getByText(/Adım 1 \/ 5/i)).toBeInTheDocument();
  });
  it("Next is disabled when current step invalid (no type chosen yet stays valid default new)", () => {
    renderSheet();
    // default type = startMode "new" → step0 valid → İleri enabled
    expect(screen.getByRole("button", { name: /İleri/i })).not.toBeDisabled();
  });
  it("Esc triggers onClose", () => {
    const onClose = renderSheet();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: FAIL** — Run: `npm run test -- src/portals/admin/students/__tests__/EnrollStudentSheet.test.tsx`
- [ ] **Step 3: Uygula** — `enroll.css` (port), `WizardRail.tsx` (handoff `StepperRail` portu, i18n `steps.*`), `EnrollStudentSheet.tsx`:
  - `const methods = useForm<EnrollWizardForm>({ defaultValues: { type: startMode, gender: "female", invite: true, inviteChannel: "sms", enrollmentDate: <bugün gg.aa.yyyy>, guardians: [], ... } })`.
  - `const clientRequestId = useRef(crypto.randomUUID()).current`.
  - `const [step, setStep] = useState(0)`; `nationalId = methods.watch("nationalId")`; `dupe = useCheckNationalIdQuery(nationalId).data?.exists ?? false`.
  - `canNext = isStepValid(step, methods.getValues(), dupe)` (re-render için `methods.watch()` ile).
  - Footer: Geri/İleri/Kaydet; `Adım {step+1} / 5`.
  - Adım gövdesi şimdilik `{step===0 && <StepType/>}` yerine geçici `<div>{t("steps...")}</div>` + Task 6-9 takacak. (Bu task'ta StepType minimal render — başlık "Kayıt türünü seçin" görünmeli; testte aranıyor.)
  - `import "../../enroll.css"`.
- [ ] **Step 4: PASS** — aynı test (+ `npm run build` clean).
- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/students/enroll.css src/portals/admin/students/components/enroll/WizardRail.tsx src/portals/admin/students/components/enroll/EnrollStudentSheet.tsx src/portals/admin/students/__tests__/EnrollStudentSheet.test.tsx
git commit -m "2026-06-29 feat,test: Kayıt sihirbazı kabuğu + stepper + CSS portu (Faz 1B)."
```

---

### Task 6: Adım 1 (Tür) + Adım 2 (Öğrenci + TCKN dupe)

**Files:**
- Create: `src/portals/admin/students/components/enroll/steps/StepType.tsx`
- Create: `src/portals/admin/students/components/enroll/steps/StepStudent.tsx`
- Create: `src/portals/admin/students/components/enroll/parts/PhotoUpload.tsx`
- Modify: `EnrollStudentSheet.tsx` (step 0/1 gerçek bileşenleri tak)
- Test: `src/portals/admin/students/__tests__/EnrollStepStudent.test.tsx`

**Interfaces:**
- Consumes: `useFormContext<EnrollWizardForm>()`, `useCheckNationalIdQuery`.
- Produces: `StepType`, `StepStudent` (props yok — context'ten okur), `PhotoUpload` (Debt — local-only, upload ucu yok; `DebtBadge` ile işaretli).

Handoff portu: `enroll_wizard.jsx` satır 261-327 (ADIM 1 + ADIM 2). Mock `tcknDupe = ...==='11111111111'` yerine `useCheckNationalIdQuery` sonucu; "mevcut kaydı aç" linki `onClose()` + drawer açma callback'i (MVP'de `onClose`).

- [ ] **Step 1: Failing test**

```tsx
// EnrollStepStudent.test.tsx — sheet üzerinden, dupe hook'u mock'lanır
// (render helper Task 5'teki gibi; useCheckNationalIdQuery exists=true döndür)
it("blocks Next and shows duplicate warning when tckn is a known person", async () => {
  // useCheckNationalIdQuery mock → { data: { exists: true, fullName: "Elif Kaya", studentNumber: "20251043" } }
  // ad/soyad/tckn(11) doldur → "Bu kişi zaten kayıtlı" görünür, İleri disabled
});
it("accepts a valid unique student and enables Next", async () => {
  // exists:false → "Mükerrer kayıt bulunamadı" + İleri enabled
});
```

(Gerçek testte: `vi.mock("../hooks/useEnrollWizardQueries")` ile `useCheckNationalIdQuery` senaryoya göre döndürülür; adım 1'e "İleri" ile geç; inputlara `fireEvent.change`; assert.)

- [ ] **Step 2: FAIL** — Run: `npm run test -- src/portals/admin/students/__tests__/EnrollStepStudent.test.tsx`
- [ ] **Step 3: Uygula** — StepType (iki `type-card`, `setValue("type", v)`), StepStudent (ad/soyad/tckn/doğum/cinsiyet/PhotoUpload; dupe uyarı kutusu + `fld-ok`), PhotoUpload (Debt). Sheet'te step 0/1 takılır.
- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/students/components/enroll/steps/StepType.tsx src/portals/admin/students/components/enroll/steps/StepStudent.tsx src/portals/admin/students/components/enroll/parts/PhotoUpload.tsx src/portals/admin/students/components/enroll/EnrollStudentSheet.tsx src/portals/admin/students/__tests__/EnrollStepStudent.test.tsx
git commit -m "2026-06-29 feat,test: Sihirbaz Adım 1-2 (tür + öğrenci + TCKN mükerrer) (Faz 1B)."
```

---

### Task 7: Adım 3 (Sınıf yerleştirme + kapasite, HARD)

**Files:**
- Create: `src/portals/admin/students/components/enroll/steps/StepPlacement.tsx`
- Create: `src/portals/admin/students/components/enroll/parts/CapacityGrid.tsx`
- Modify: `EnrollStudentSheet.tsx` (step 2 tak; kademe lookup'ı sheet'ten geç)
- Modify: `StudentsPage.tsx` veya sheet — `useGradeLevelsQuery()` (classrooms modülü) kullanımı
- Test: `src/portals/admin/students/__tests__/EnrollStepPlacement.test.tsx`

**Interfaces:**
- Consumes: `useGradeLevelsQuery` (`@/portals/admin/classrooms/hooks/useClassroomQueries` → `GradeLevelOption { id, code, name, displayOrder, educationLevel }`), `useBranchCapacityQuery` (Task 3), `useSeasonStore` (aktif sezon), `gradeLevelToInt` (Task 1).
- Produces: `StepPlacement`, `CapacityGrid({ branches, value, onSelect })` — dolu şube (`used >= capacity`) **disabled**.
- Sheet, seçilen kademe option'ından `gradeLevelId`, `gradeLevelCode`, `gradeLevelDisplayOrder` formda tutar; submit'te `gradeLevel = gradeLevelToInt(code, displayOrder)`.

Handoff portu: satır 330-377 (ADIM 3). Mock `W_KADEME`/`W_CAP` → `useGradeLevelsQuery` + `useBranchCapacityQuery`. Akademik sezon kilidi aktif sezon adıyla doldurulur (`useSeasonStore` / classrooms `seasons` lookup).

- [ ] **Step 1: Failing test**

```tsx
// useGradeLevelsQuery + useBranchCapacityQuery mock'lanır
it("lists branches for the chosen grade and disables full ones (HARD)", async () => {
  // gradeLevels: [{id:"g-5",code:"5",name:"5. Sınıf",displayOrder:5}]
  // branchCapacity: [{classRoomId:"c-5a",fullName:"5-A",used:24,capacity:28},{classRoomId:"c-5b",fullName:"5-B",used:28,capacity:28}]
  // 5-B kartı disabled; 5-A seçilince classRoomId set
});
it("transfer-in requires previousSchool before Next", async () => { /* type=transferIn → İleri disabled until filled */ });
```

- [ ] **Step 2: FAIL** — Run: `npm run test -- src/portals/admin/students/__tests__/EnrollStepPlacement.test.tsx`
- [ ] **Step 3: Uygula** — StepPlacement: kademe `<select>` (gradeLevels) → `setValue` grade alanları + `classRoomId=""`; CapacityGrid (`branchCapacity` data; `capTone`/disabled); nakilde `previousSchool` input; `enrollmentDate` input (default bugün).
- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/students/components/enroll/steps/StepPlacement.tsx src/portals/admin/students/components/enroll/parts/CapacityGrid.tsx src/portals/admin/students/components/enroll/EnrollStudentSheet.tsx src/portals/admin/students/__tests__/EnrollStepPlacement.test.tsx
git commit -m "2026-06-29 feat,test: Sihirbaz Adım 3 (sınıf yerleştirme + HARD kapasite) (Faz 1B)."
```

---

### Task 8: Adım 4 (Veli bağla — ara/yeni + bayraklar)

**Files:**
- Create: `src/portals/admin/students/components/enroll/steps/StepGuardians.tsx`
- Create: `src/portals/admin/students/components/enroll/parts/GuardianPicker.tsx`
- Modify: `EnrollStudentSheet.tsx` (step 3 tak)
- Test: `src/portals/admin/students/__tests__/EnrollStepGuardians.test.tsx`

**Interfaces:**
- Consumes: `useGuardianSearchQuery` (Task 3), `useFieldArray`/`setValue` (`guardians`).
- Produces: `StepGuardians`, `GuardianPicker`. Eklenen veli `GuardianDraft` olarak `guardians`'a push; bayraklar (bilgi/karar/odeme/teslim/iletisim) + birincil; havuzdan seçimde `existingPersonId` set.

Handoff portu: satır 381-462 (ADIM 4). Mock `W_GUARDIAN_POOL` → `useGuardianSearchQuery`; `W_FLAGS` → i18n + form boolean alanları.

- [ ] **Step 1: Failing test**

```tsx
it("searches existing guardians and adds one with flags", async () => {
  // useGuardianSearchQuery → [{personId:"p-1",fullName:"Zeynep Kaya",phone:"0532",email:null}]
  // ara → seç → "Veliyi Ekle" → guardians listesinde kart görünür
});
it("supports adding a brand-new guardian and removing it", async () => { /* yeni veli → ekle → kaldır */ });
it("allows zero guardians (shows missing-guardian hint)", async () => { /* "Henüz veli eklenmedi" */ });
```

- [ ] **Step 2: FAIL** — Run: `npm run test -- src/portals/admin/students/__tests__/EnrollStepGuardians.test.tsx`
- [ ] **Step 3: Uygula** — StepGuardians + GuardianPicker; ara/yeni segment; bayrak listesi; ekle/kaldır; eklenen kartlar.
- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/students/components/enroll/steps/StepGuardians.tsx src/portals/admin/students/components/enroll/parts/GuardianPicker.tsx src/portals/admin/students/components/enroll/EnrollStudentSheet.tsx src/portals/admin/students/__tests__/EnrollStepGuardians.test.tsx
git commit -m "2026-06-29 feat,test: Sihirbaz Adım 4 (veli bağla + yetki bayrakları) (Faz 1B)."
```

---

### Task 9: Adım 5 (Özet) + submit + Başarı ekranı (öğrenci no gerçek, şifre Debt)

**Files:**
- Create: `src/portals/admin/students/components/enroll/steps/StepSummary.tsx`
- Create: `src/portals/admin/students/components/enroll/steps/EnrollSuccess.tsx`
- Create: `src/portals/admin/students/components/enroll/parts/IdentityBox.tsx`
- Modify: `EnrollStudentSheet.tsx` (step 4 tak; Kaydet → mutation; done state → EnrollSuccess)
- Test: `src/portals/admin/students/__tests__/EnrollSubmit.test.tsx`

**Interfaces:**
- Consumes: `useEnrollStudentMutation` (Task 3), `toEnrollCommand` + `gradeLevelToInt` (Task 1), `DebtBadge`.
- Produces: `StepSummary`, `EnrollSuccess({ result, form })`, `IdentityBox({ studentNumber })` — **şifre satırı Debt** (değer yok; `DebtBadge` + `t("enrollWizard.success.accountDebt")`).

Handoff portu: satır 465-522 (ADIM 5) + 200-237 (BAŞARI). Başarı ekranında `IdentityCardBox`'ın **öğrenci no** satırı `result.studentNumber` (gerçek, kopyalanabilir); **geçici şifre** satırı değer yerine `<DebtBadge small />` + "BE bekleniyor" notu. "Identity hesabını açtı" metni → `accountDebt`. Veli daveti satırı `form.invite` ise gösterilir.

- [ ] **Step 1: Failing test**

```tsx
it("submits the mapped command and shows real student number with debt password", async () => {
  // useEnrollStudentMutation → mutateAsync resolves { studentNumber: "20251007", hasGuardianWarning: false }
  // tüm adımları geçip Kaydet → mutateAsync çağrısı body.Type="New", ClassRoomId set ile
  // başarı: "20251007" görünür; "geçici şifre" değeri YOK; DebtBadge görünür
});
it("routes transfer-in submissions through the transfer-in mutation type", async () => {
  // type=transferIn → mutate({ type: "transferIn", body }) çağrılır
});
it("shows guardian-missing warning when no guardian and result.hasGuardianWarning", async () => { /* uyarı rozeti */ });
```

(Test, `useEnrollStudentMutation`'ı `vi.fn` mutateAsync ile mock'lar; `mutate`/`mutateAsync` argümanını assert eder.)

- [ ] **Step 2: FAIL** — Run: `npm run test -- src/portals/admin/students/__tests__/EnrollSubmit.test.tsx`
- [ ] **Step 3: Uygula** — StepSummary (3 özet kartı + davet toggle/kanal), Sheet `onSave`: `gradeLevel = gradeLevelToInt(form.gradeLevelCode, form.gradeLevelDisplayOrder)` → `toEnrollCommand(form, { clientRequestId, academicSessionId, gradeLevel })` → `mutateAsync({ type: form.type, body })`; başarıda `setResult(res)` → EnrollSuccess. Hata: toast + ilgili adıma dön (422 kapasite→step2, dupe→step1).
- [ ] **Step 4: PASS**
- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/students/components/enroll/steps/StepSummary.tsx src/portals/admin/students/components/enroll/steps/EnrollSuccess.tsx src/portals/admin/students/components/enroll/parts/IdentityBox.tsx src/portals/admin/students/components/enroll/EnrollStudentSheet.tsx src/portals/admin/students/__tests__/EnrollSubmit.test.tsx
git commit -m "2026-06-29 feat,test: Sihirbaz Adım 5 + submit + başarı ekranı (öğrenci no gerçek, şifre Debt) (Faz 1B)."
```

---

### Task 10: StudentsPage entegrasyonu + eski `EnrollStudentDialog` & enroll debt temizliği

**Files:**
- Modify: `src/portals/admin/students/StudentsPage.tsx` (modal `enroll` → `EnrollStudentSheet`)
- Delete: `src/portals/admin/students/components/EnrollStudentDialog.tsx`
- Modify: `src/portals/admin/students/hooks/useStudentDebt.ts` (`useEnrollStudent` kaldır)
- Modify: `src/portals/admin/students/api/studentsDebtApi.ts` (`enrollStudent` + `EnrollStudentInput` kaldır)
- Modify: `src/shared/i18n/locales/tr/students.json` (`enrollModal` bloğu kaldır)
- Modify/temizle: `EnrollStudentDialog` testleri varsa kaldır; `StudentDetailEnrollment.test.tsx` enroll-dialog'a değiniyorsa güncelle
- Test: `src/portals/admin/students/__tests__/StudentsEnrollIntegration.test.tsx`

**Interfaces:**
- Consumes: `EnrollStudentSheet` (Task 5-9). `classroomOptions` artık sheet kendi lookup'ını (`useGradeLevelsQuery` + `useBranchCapacityQuery`) kullandığı için `StudentsPage`'in `classOptions` prop'u sheet'e **geçilmez** (kademe/şube sheet içinde çözülür). `startMode="new"`.

- [ ] **Step 1: Failing test**

```tsx
it("opens the 5-step wizard (not the old dialog) from the New Student button", async () => {
  // StudentsPage render → "Yeni Öğrenci" tıkla → "Kayıt türünü seçin" + "Adım 1 / 5" görünür
});
it("no longer references the enroll debt fallback", () => {
  // import { useEnrollStudent } ... kaldırıldı — modül export etmiyor
});
```

- [ ] **Step 2: FAIL** — Run: `npm run test -- src/portals/admin/students/__tests__/StudentsEnrollIntegration.test.tsx`
- [ ] **Step 3: Uygula** — `StudentsPage`: `{modal?.kind === "enroll" && <EnrollStudentSheet startMode="new" onClose={() => setModal(null)} />}`; `EnrollStudentDialog` import+render kaldır; dosyayı sil. `useStudentDebt.ts`'den `useEnrollStudent` + ilgili import kaldır. `studentsDebtApi.ts`'den `enrollStudent`/`EnrollStudentInput` kaldır. `students.json`'dan `enrollModal` sil. Kırılan testleri güncelle/sil.
- [ ] **Step 4: PASS + tam süit** — Run: `npm run test` (tüm students testleri yeşil; başka modül kırılmadı). Run: `npm run build`.
- [ ] **Step 5: Commit**

```bash
git add -A src/portals/admin/students src/shared/i18n/locales/tr/students.json
git commit -m "2026-06-29 feat,test: 5 adımlı kayıt sihirbazı StudentsPage'e bağlandı; eski dialog + enroll debt kaldırıldı (Faz 1B)."
```

---

### Task 11: Modül dokümanı güncelle

**Files:**
- Modify: `.claude/docs/modules/students/completion_status.md`
- Modify: `.claude/docs/modules/students/ui-flows.md`
- Modify: `.claude/docs/modules/students/api-contracts.md`
- Modify: `.claude/docs/modules/students/README.md` (Last Updated)

> Bu dosyalar **workspace repo**'da (`/Users/farukkaya/Projects/oksis`), kod ise `oksis-web` repo'sunda — ayrı commit.

- [ ] **Step 1:** `completion_status.md` → ilerleme/`Güncel` tarih güncelle; Faz 1B FE ✅; "⚠️ Spec Dışına Çıkılanlar"a satır: `2026-06-29 · başarı ekranı geçici-şifre kutusu Debt (öğrenci hesabı E2.6/E2.7 Faz 1B-BE'ye ertelendi) · onay: kullanıcı · etki: FE'de placeholder, BE açılınca dolacak`.
- [ ] **Step 2:** `ui-flows.md` → 5 adımlı sihirbaz akışı (tür→öğrenci→yerleştirme→veli→özet→başarı) + uç eşleşmesi.
- [ ] **Step 3:** `api-contracts.md` → FE'nin tükettiği 5 ucu işaretle (gerçek/bağlandı).
- [ ] **Step 4:** README `Last Updated: 2026-06-29`.
- [ ] **Step 5: Commit** (workspace repo)

```bash
cd /Users/farukkaya/Projects/oksis
git add .claude/docs/modules/students
git commit -m "2026-06-29 docs: students modülü — Faz 1B FE sihirbazı + şifre-kutusu Debt notu dokümante edildi."
```

---

## Self-Review (yazım sonrası)

- **Spec coverage:** design doc §1-10 → Task eşleşmesi: §1/4 uçlar→T2/T3; §3 başarı Debt→T9; §4 dosya yapısı→T5-T9; §5 submit eşleşme→T1/T9; §6 adım geçerliliği→T1/T6/T7; §7 hata→T9; §8 i18n→T4/T10; §9 test→her task; §10 docs→T11. reenroll/AssignClass/Promote kapsam dışı (design §2) — task yok (doğru).
- **Placeholder scan:** Büyük adım bileşenleri (T6-T9) handoff jsx'ten **birebir port** — kaynak kod `enroll_wizard.jsx`'te mevcut, satır aralıkları verildi; mock→hook ikameleri somut. Test gövdeleri T6-T9'da niyet+veri olarak verildi (RED'i yazan subagent senaryo verisini bağlar) — saf-mantık task'larında (T1-T3) test kodu tam.
- **Type consistency:** `EnrollWizardForm`/`GuardianDraft`/`EnrollStudentCommandBody`/`EnrollResult`/`BranchCapacity`/`NationalIdDuplicate`/`GuardianSearchItem` tüm task'larda aynı imza. `useEnrollStudentMutation` argümanı `{ type, body }` — T3 tanım, T9 kullanım uyumlu. `gradeLevelToInt(code, displayOrder)` T1 tanım, T7/T9 kullanım uyumlu.
