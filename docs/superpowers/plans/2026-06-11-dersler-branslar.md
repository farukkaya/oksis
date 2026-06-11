# Dersler & Branşlar (Akademik Modül) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `oksis-web` admin portalına, tasarım paketine hi-fi sadık, frontend-first bir **Dersler & Branşlar** ekranı (sekmeli: Dersler / Branşlar) eklemek + sidebar'a Akademik grubu kurmak.

**Architecture:** Portal-yerel feature klasörü (`src/portals/admin/subjects/`), students/classrooms desenini izler. Backend yok → tüm veri katmanı oturum-ömürlü in-memory mock store + React Query; mutasyonlar "Debt" (isMock) toast'ı taşır. URL state `?tab=`. Stil mevcut `students.css` (`.stu*`,`.btn*`) + handoff'tan port edilen `subjects.css` (`.aca*`).

**Tech Stack:** React 18 + TS (strict), Vite, React Query v5 (`@tanstack/react-query`), react-router, i18next, `sonner` toast, vitest + @testing-library/react. shadcn `Sheet`/`Dialog` yerine handoff'un `.drawer`/`Modal` desenini birebir CSS ile taşırız (students/classrooms da kendi CSS sistemini kullanıyor).

**Çalışma dizini:** Tüm yollar `oksis-web/` köküne görelidir. Komutlar `oksis-web/` içinde çalışır.

**Referans kaynaklar (port için, salt-okuma):**
- Tasarım JSX: `/Users/farukkaya/Downloads/oksis_akademik_extract/design_handoff_academics/app/{academicsBase.jsx,courses.jsx,academics.css}`
- Desen şablonu: `src/portals/admin/students/` (özellikle `keys/`, `hooks/`, `api/`, `StudentsPage.tsx`)
- Tasarım spec'i: `../oksis/docs/superpowers/specs/2026-06-11-dersler-branslar-design.md`

**Konvansiyon kuralları (web — ihlal yasak):** default export yasak (named export), inline style yasak (Tailwind/`cn`/CSS class), `any` yasak, hardcoded Türkçe yasak (i18n key), server state yalnız React Query.

> **i18n istisnası:** Handoff'taki Türkçe metinler `subjects` namespace'ine taşınır (Task 3). Bileşenlerde `t("...")` kullanılır. Plan kod bloklarında okunabilirlik için bazı yerlerde `t("key")` çağrısı + ilgili key Task 3'teki json'da tanımlıdır.

---

## File Structure

```
src/portals/admin/subjects/
  types.ts                      # Subject, Branch, enums, derived types
  data/seed.ts                  # gerçekçi Türkçe seed (handoff'tan)
  data/store.ts                 # oturum-ömürlü mutable mock store
  lib/derive.ts                 # branchStats, filterSubjects, normalizeTr
  api/subjectsApi.ts            # store'dan çözen tipli, latency'li fonksiyonlar (Debt)
  keys/subjectKeys.ts           # tenant-scoped React Query keys
  hooks/useSubjectsData.ts      # useSubjectsQuery, useBranchesQuery
  hooks/useSubjectMutations.ts  # create/update/setStatus/delete (Debt toast)
  components/
    SubjectsTabs.tsx
    CoursesToolbar.tsx
    CoursesTable.tsx
    BranchesTable.tsx
    BranchBadge.tsx
    SubjectTypeBadge.tsx
    LevelChips.tsx
    StatusDot.tsx
    CountBadge.tsx
    RowMenu.tsx
    CourseDrawer.tsx
    BranchModal.tsx
    states/EmptyState.tsx
  __tests__/
    derive.test.ts
    RowMenu.test.tsx
    CourseDrawer.test.tsx
    BranchModal.test.tsx
    SubjectsPage.test.tsx
  subjects.css
  SubjectsPage.tsx
  index.ts
src/shared/i18n/locales/tr/subjects.json   # yeni
src/shared/i18n/locales/en/subjects.json   # yeni
```

Modify:
- `src/shared/i18n/index.ts` — subjects namespace kaydı
- `src/app/routes.tsx` — `/admin/subjects` route
- `src/app/layouts/AdminLayout.tsx` — Akademik nav grubu + Ders Programı/Nöbet taşıma

---

## Task 1: Types

**Files:**
- Create: `src/portals/admin/subjects/types.ts`

- [ ] **Step 1: Yaz**

```ts
// src/portals/admin/subjects/types.ts
export type Status = "active" | "passive";
export type SubjectType = "zorunlu" | "secmeli";
export type Level = 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** Görünür seviye seçenekleri (lise kademesi — handoff). */
export const LEVEL_OPTIONS: Level[] = [9, 10, 11, 12];

/** Branş (öğretmen alanı). UI'da "Branş". */
export interface Branch {
  id: string;
  name: string;
  mebCode?: string;
  status: Status;
  /** Stabil rozet rengi (açık dolgu + koyu metin). */
  color: { bg: string; fg: string };
}

/** Ders (müfredat birimi). */
export interface Subject {
  id: string;
  name: string;
  code?: string;
  branchId: string;
  levels: Level[];
  type: SubjectType;
  recommendedWeeklyHours: number | null;
  description: string;
  status: Status;
  /** Görevlendirmesi var mı (mock) — sert silme kilidi için. */
  hasAssignments: boolean;
}

/** Branş başına türetilen sayaçlar. */
export interface BranchStats {
  subjectCount: number;
  teacherCount: number;
}

/** Ders yazma payload'ı (id'siz). */
export interface SubjectInput {
  name: string;
  code?: string;
  branchId: string;
  levels: Level[];
  type: SubjectType;
  recommendedWeeklyHours: number | null;
  description: string;
}

/** Branş yazma payload'ı. */
export interface BranchInput {
  name: string;
  mebCode?: string;
}
```

- [ ] **Step 2: Tip kontrolü**

Run: `npx tsc --noEmit`
Expected: PASS (yeni dosya hata üretmez)

- [ ] **Step 3: Commit**

```bash
git add src/portals/admin/subjects/types.ts
git commit -m "$(date +%Y-%m-%d) feat: Dersler & Branşlar tip tanımları eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Seed verisi

**Files:**
- Create: `src/portals/admin/subjects/data/seed.ts`

Handoff `academicsBase.jsx` (ACA_BRANCHES, ACA_TEACHERS, ACA_COURSES_INIT) İngilizce şemaya birebir uyarlanır.

- [ ] **Step 1: Yaz**

```ts
// src/portals/admin/subjects/data/seed.ts
import type { Branch, Subject, Level, SubjectType } from "../types";

/** Branş seed (handoff ACA_BRANCHES). */
export const SEED_BRANCHES: Branch[] = [
  { id: "mat", name: "Matematik", mebCode: "1245", status: "active", color: { bg: "#E4EBFE", fg: "#2F4DA0" } },
  { id: "tde", name: "Türk Dili ve Edebiyatı", mebCode: "2353", status: "active", color: { bg: "#FCE7EE", fg: "#A93B62" } },
  { id: "fiz", name: "Fizik", mebCode: "1715", status: "active", color: { bg: "#EBE5FB", fg: "#5B45B0" } },
  { id: "kim", name: "Kimya", mebCode: "1203", status: "active", color: { bg: "#DCF3F1", fg: "#0C6B66" } },
  { id: "biy", name: "Biyoloji", mebCode: "1207", status: "active", color: { bg: "#DFF2DF", fg: "#2E7D36" } },
  { id: "tar", name: "Tarih", mebCode: "2510", status: "active", color: { bg: "#FAEEDC", fg: "#92600F" } },
  { id: "cog", name: "Coğrafya", mebCode: "1119", status: "active", color: { bg: "#E0F1FA", fg: "#146C94" } },
  { id: "ing", name: "İngilizce", mebCode: "1524", status: "active", color: { bg: "#EFF3DC", fg: "#5F6B16" } },
  { id: "alm", name: "Almanca", mebCode: "1083", status: "active", color: { bg: "#E8F0E0", fg: "#4E7A1E" } },
  { id: "din", name: "Din Kült. ve Ahlak Bilgisi", mebCode: "1310", status: "active", color: { bg: "#EFEAE3", fg: "#6B5840" } },
  { id: "fel", name: "Felsefe", mebCode: "1390", status: "active", color: { bg: "#F4E5F5", fg: "#8E3B98" } },
  { id: "bed", name: "Beden Eğitimi", mebCode: "1115", status: "active", color: { bg: "#FDEBDD", fg: "#B45A0C" } },
  { id: "bil", name: "Bilişim Teknolojileri", mebCode: "2143", status: "active", color: { bg: "#E3EEF2", fg: "#28617A" } },
  { id: "muz", name: "Müzik", mebCode: "1822", status: "active", color: { bg: "#FBE5F2", fg: "#A82B7E" } },
  { id: "gor", name: "Görsel Sanatlar", mebCode: "1426", status: "passive", color: { bg: "#F0E9F9", fg: "#6D4E9E" } },
  { id: "jap", name: "Japonca", status: "active", color: { bg: "#FBEAE5", fg: "#9C4830" } },
];

/** Branş başına öğretmen sayısı (handoff ACA_TEACHERS ana branşından türetildi). */
export const SEED_TEACHER_COUNT: Record<string, number> = {
  mat: 2, fiz: 1, tde: 2, kim: 1, biy: 1, tar: 1, cog: 1, ing: 2, din: 1, bed: 1, fel: 1, bil: 1, muz: 1,
};

type SeedRow = [string, string, string, string, Level[], SubjectType, number, "active" | "passive"];
const COURSE_ROWS: SeedRow[] = [
  ["mat", "Matematik", "MAT", "mat", [9, 10, 11, 12], "zorunlu", 6, "active"],
  ["tde", "Türk Dili ve Edebiyatı", "TDE", "tde", [9, 10, 11, 12], "zorunlu", 5, "active"],
  ["fiz", "Fizik", "FİZ", "fiz", [9, 10, 11, 12], "zorunlu", 2, "active"],
  ["kim", "Kimya", "KİM", "kim", [9, 10], "zorunlu", 2, "active"],
  ["biy", "Biyoloji", "BİY", "biy", [9, 10], "zorunlu", 2, "active"],
  ["tar", "Tarih", "TAR", "tar", [9, 10, 11], "zorunlu", 2, "active"],
  ["ink", "T.C. İnkılap Tarihi ve Atatürkçülük", "İNK", "tar", [12], "zorunlu", 2, "active"],
  ["cog", "Coğrafya", "COĞ", "cog", [9, 10], "zorunlu", 2, "active"],
  ["ing", "İngilizce", "İNG", "ing", [9, 10, 11, 12], "zorunlu", 4, "active"],
  ["alm", "Almanca (2. Yabancı Dil)", "ALM", "alm", [9, 10, 11, 12], "secmeli", 2, "active"],
  ["din", "Din Kültürü ve Ahlak Bilgisi", "DİN", "din", [9, 10, 11, 12], "zorunlu", 2, "active"],
  ["fel", "Felsefe", "FEL", "fel", [10, 11], "zorunlu", 2, "active"],
  ["bed", "Beden Eğitimi ve Spor", "BED", "bed", [9, 10, 11, 12], "zorunlu", 2, "active"],
  ["bil", "Bilgisayar Bilimi", "BİL", "bil", [9, 10], "secmeli", 2, "active"],
  ["muz", "Müzik", "MÜZ", "muz", [9, 10], "secmeli", 1, "active"],
  ["gor", "Görsel Sanatlar", "GÖR", "gor", [9, 10], "secmeli", 1, "passive"],
];

/** Ders seed (handoff ACA_COURSES_INIT). 12-A'da görevlendirmeli sayılanlar hasAssignments=true. */
export const SEED_SUBJECTS: Subject[] = COURSE_ROWS.map(([id, name, code, branchId, levels, type, hours, status]) => ({
  id,
  name,
  code,
  branchId,
  levels,
  type,
  recommendedWeeklyHours: hours,
  description: "",
  status,
  // Görsel Sanatlar (pasif) hariç tüm aktif dersler örnek görevlendirmeye sahip sayılır.
  hasAssignments: status === "active",
}));
```

- [ ] **Step 2: Tip kontrolü**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/portals/admin/subjects/data/seed.ts
git commit -m "$(date +%Y-%m-%d) feat: Dersler & Branşlar mock seed verisi eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: i18n namespace

**Files:**
- Create: `src/shared/i18n/locales/tr/subjects.json`
- Create: `src/shared/i18n/locales/en/subjects.json`
- Modify: `src/shared/i18n/index.ts`

- [ ] **Step 1: TR sözlüğü yaz**

```json
{
  "subjects": {
    "breadcrumb": { "academic": "Akademik", "subjects": "Dersler & Branşlar" },
    "title": "Dersler & Branşlar",
    "subtitle": "Müfredat derslerini ve öğretmen branşlarını yönetin.",
    "tabs": { "courses": "Dersler", "branches": "Branşlar" },
    "actions": { "newCourse": "Yeni Ders", "newBranch": "Yeni Branş", "clearFilters": "Filtreleri Temizle" },
    "toolbar": {
      "searchPlaceholder": "Ders adı veya kodu ara…",
      "branchFilter": "Branş", "typeFilter": "Tür", "columnSettings": "Kolon ayarları"
    },
    "type": { "zorunlu": "Zorunlu", "secmeli": "Seçmeli" },
    "status": { "active": "Aktif", "passive": "Pasif" },
    "courses": {
      "col": {
        "name": "Ders Adı", "code": "Kod", "branch": "Branş", "level": "Seviye",
        "type": "Tür", "hours": "Öner. Haftalık Saat", "status": "Durum"
      },
      "hoursValue": "{{count}} saat", "empty": "—",
      "rowMenu": { "edit": "Düzenle", "passivate": "Pasife Al", "activate": "Aktifleştir", "delete": "Sil" },
      "deleteLockTip": "Görevlendirmesi olan ders silinemez — pasife alın",
      "emptyTitle": "Henüz ders tanımlanmadı",
      "emptyDesc": "İlk dersinizi ekleyerek müfredatı oluşturmaya başlayın.",
      "noResultTitle": "Sonuç bulunamadı",
      "noResultDesc": "Arama veya filtre kriterlerine uyan ders yok."
    },
    "branches": {
      "col": {
        "name": "Branş Adı", "mebCode": "MEB Kodu", "subjectCount": "Bağlı Ders Sayısı",
        "teacherCount": "Öğretmen Sayısı", "status": "Durum"
      },
      "rowMenu": { "edit": "Düzenle", "passivate": "Pasife Al", "activate": "Aktifleştir", "delete": "Sil" },
      "deleteLockTip": "Bağlı ders/öğretmen var — önce bağlantıları kaldırın veya pasife alın",
      "emptyTitle": "Henüz branş tanımlanmadı",
      "emptyDesc": "Branşlar, öğretmenlerin alanlarını ve derslerin sınıflandırmasını belirler."
    },
    "courseDrawer": {
      "titleNew": "Yeni Ders", "titleEdit": "Dersi Düzenle",
      "subNew": "Müfredata yeni ders ekle",
      "name": "Ders Adı", "namePlaceholder": "örn. Matematik",
      "code": "Kod", "codePlaceholder": "örn. MAT",
      "hours": "Öner. Haftalık Saat",
      "branch": "Branş", "branchPlaceholder": "Branş seçin…",
      "branchHint": "Bu seçim, görevlendirmedeki branş uyumu kontrolünü besler.",
      "level": "Seviye", "levelLabel": "{{n}}. Sınıf",
      "type": "Tür", "description": "Açıklama", "descriptionPlaceholder": "Kısa açıklama…",
      "optional": "· opsiyonel",
      "cancel": "İptal", "saveAndNew": "Kaydet ve Yeni Ekle", "save": "Kaydet",
      "savedNote": "Ders kaydedildi — yeni ders ekleyebilirsiniz."
    },
    "branchModal": {
      "titleNew": "Yeni Branş", "titleEdit": "Branşı Düzenle",
      "sub": "Branşlar; öğretmen alanlarını ve ders sınıflandırmasını belirler",
      "name": "Branş Adı", "namePlaceholder": "örn. Matematik",
      "mebCode": "MEB Kodu", "mebCodePlaceholder": "örn. 1245",
      "optional": "· opsiyonel", "cancel": "Vazgeç", "save": "Kaydet"
    },
    "debt": {
      "mockSuffix": "(mock)",
      "courseSaved": "Ders kaydedildi",
      "courseStatus": "Ders durumu güncellendi",
      "branchSaved": "Branş kaydedildi",
      "branchStatus": "Branş durumu güncellendi",
      "branchDeleted": "Branş silindi",
      "error": "İşlem başarısız oldu"
    }
  }
}
```

- [ ] **Step 2: EN sözlüğü yaz** (aynı yapı, İngilizce karşılıklar)

```json
{
  "subjects": {
    "breadcrumb": { "academic": "Academic", "subjects": "Subjects & Branches" },
    "title": "Subjects & Branches",
    "subtitle": "Manage curriculum subjects and teacher branches.",
    "tabs": { "courses": "Subjects", "branches": "Branches" },
    "actions": { "newCourse": "New Subject", "newBranch": "New Branch", "clearFilters": "Clear Filters" },
    "toolbar": { "searchPlaceholder": "Search subject name or code…", "branchFilter": "Branch", "typeFilter": "Type", "columnSettings": "Column settings" },
    "type": { "zorunlu": "Required", "secmeli": "Elective" },
    "status": { "active": "Active", "passive": "Passive" },
    "courses": {
      "col": { "name": "Subject", "code": "Code", "branch": "Branch", "level": "Level", "type": "Type", "hours": "Rec. Weekly Hours", "status": "Status" },
      "hoursValue": "{{count}} h", "empty": "—",
      "rowMenu": { "edit": "Edit", "passivate": "Deactivate", "activate": "Activate", "delete": "Delete" },
      "deleteLockTip": "A subject with assignments cannot be deleted — deactivate it",
      "emptyTitle": "No subjects defined yet", "emptyDesc": "Add your first subject to start building the curriculum.",
      "noResultTitle": "No results", "noResultDesc": "No subject matches the search or filters."
    },
    "branches": {
      "col": { "name": "Branch", "mebCode": "MEB Code", "subjectCount": "Linked Subjects", "teacherCount": "Teachers", "status": "Status" },
      "rowMenu": { "edit": "Edit", "passivate": "Deactivate", "activate": "Activate", "delete": "Delete" },
      "deleteLockTip": "Linked subjects/teachers exist — remove links or deactivate first",
      "emptyTitle": "No branches defined yet", "emptyDesc": "Branches define teacher fields and subject classification."
    },
    "courseDrawer": {
      "titleNew": "New Subject", "titleEdit": "Edit Subject", "subNew": "Add a new subject to the curriculum",
      "name": "Subject Name", "namePlaceholder": "e.g. Mathematics", "code": "Code", "codePlaceholder": "e.g. MAT", "hours": "Rec. Weekly Hours",
      "branch": "Branch", "branchPlaceholder": "Select a branch…", "branchHint": "This feeds the branch-match check in assignments.",
      "level": "Level", "levelLabel": "Grade {{n}}", "type": "Type", "description": "Description", "descriptionPlaceholder": "Short description…",
      "optional": "· optional", "cancel": "Cancel", "saveAndNew": "Save and Add New", "save": "Save", "savedNote": "Subject saved — you can add another."
    },
    "branchModal": {
      "titleNew": "New Branch", "titleEdit": "Edit Branch", "sub": "Branches define teacher fields and subject classification",
      "name": "Branch Name", "namePlaceholder": "e.g. Mathematics", "mebCode": "MEB Code", "mebCodePlaceholder": "e.g. 1245",
      "optional": "· optional", "cancel": "Cancel", "save": "Save"
    },
    "debt": {
      "mockSuffix": "(mock)", "courseSaved": "Subject saved", "courseStatus": "Subject status updated",
      "branchSaved": "Branch saved", "branchStatus": "Branch status updated", "branchDeleted": "Branch deleted", "error": "Operation failed"
    }
  }
}
```

- [ ] **Step 3: index.ts'e kaydet**

`src/shared/i18n/index.ts` içinde import bloğuna ekle (classrooms import'larının yanına):

```ts
import subjectsTr from './locales/tr/subjects.json';
import subjectsEn from './locales/en/subjects.json';
```

`ns: [...]` dizisine `'subjects'` ekle (classrooms'tan sonra). `resources.tr` ve `resources.en` objelerine sırasıyla ekle:

```ts
// resources.tr içine:
      subjects: subjectsTr.subjects,
// resources.en içine:
      subjects: subjectsEn.subjects,
```

- [ ] **Step 4: Build doğrula**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/i18n/locales/tr/subjects.json src/shared/i18n/locales/en/subjects.json src/shared/i18n/index.ts
git commit -m "$(date +%Y-%m-%d) feat: subjects i18n namespace (tr/en) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Türetme yardımcıları (lib/derive) — TDD

**Files:**
- Create: `src/portals/admin/subjects/lib/derive.ts`
- Test: `src/portals/admin/subjects/__tests__/derive.test.ts`

- [ ] **Step 1: Testi yaz**

```ts
// src/portals/admin/subjects/__tests__/derive.test.ts
import { describe, it, expect } from "vitest";
import { branchStats, filterSubjects } from "../lib/derive";
import { SEED_SUBJECTS, SEED_TEACHER_COUNT } from "../data/seed";
import type { Subject } from "../types";

describe("branchStats", () => {
  it("branşa bağlı ders ve öğretmen sayısını döndürür", () => {
    const stats = branchStats("mat", SEED_SUBJECTS, SEED_TEACHER_COUNT);
    expect(stats.subjectCount).toBe(1); // sadece "Matematik" dersi mat branşında
    expect(stats.teacherCount).toBe(2);
  });
  it("bağlı kayıt yoksa sıfır döndürür", () => {
    const stats = branchStats("jap", SEED_SUBJECTS, SEED_TEACHER_COUNT);
    expect(stats.subjectCount).toBe(0);
    expect(stats.teacherCount).toBe(0);
  });
});

describe("filterSubjects", () => {
  const list: Subject[] = SEED_SUBJECTS;
  it("arama ad ve kodda eşleşir (TR case-insensitive)", () => {
    expect(filterSubjects(list, { q: "matematik", branchId: "", levels: [], type: "" }).map((s) => s.id)).toContain("mat");
    expect(filterSubjects(list, { q: "İNK", branchId: "", levels: [], type: "" }).map((s) => s.id)).toContain("ink");
  });
  it("branş filtresi uygular", () => {
    const r = filterSubjects(list, { q: "", branchId: "tar", levels: [], type: "" });
    expect(r.every((s) => s.branchId === "tar")).toBe(true);
    expect(r.map((s) => s.id).sort()).toEqual(["ink", "tar"]);
  });
  it("seviye filtresi herhangi-biri (OR) mantığıyla çalışır", () => {
    const r = filterSubjects(list, { q: "", branchId: "", levels: [12], type: "" });
    expect(r.map((s) => s.id)).toContain("ink"); // sadece 12
    expect(r.map((s) => s.id)).not.toContain("kim"); // [9,10]
  });
  it("tür filtresi uygular", () => {
    const r = filterSubjects(list, { q: "", branchId: "", levels: [], type: "secmeli" });
    expect(r.every((s) => s.type === "secmeli")).toBe(true);
  });
  it("filtreler birlikte (AND) uygulanır", () => {
    const r = filterSubjects(list, { q: "", branchId: "ing", levels: [9], type: "zorunlu" });
    expect(r.map((s) => s.id)).toEqual(["ing"]);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/derive.test.ts`
Expected: FAIL ("Cannot find module '../lib/derive'")

- [ ] **Step 3: Implementasyonu yaz**

```ts
// src/portals/admin/subjects/lib/derive.ts
import type { Branch, BranchStats, Level, Subject, SubjectType } from "../types";

/** Türkçe-duyarlı küçük harf normalizasyonu. */
export function normalizeTr(s: string): string {
  return s.toLocaleLowerCase("tr");
}

/** Bir branşa bağlı ders sayısı + (mock) öğretmen sayısı. */
export function branchStats(
  branchId: string,
  subjects: Subject[],
  teacherCount: Record<string, number>,
): BranchStats {
  return {
    subjectCount: subjects.filter((s) => s.branchId === branchId).length,
    teacherCount: teacherCount[branchId] ?? 0,
  };
}

export interface SubjectFilter {
  q: string;
  branchId: string;
  levels: Level[];
  type: SubjectType | "";
}

/** Arama + branş + seviye(OR) + tür filtrelerini AND ile uygular. */
export function filterSubjects(subjects: Subject[], f: SubjectFilter): Subject[] {
  const needle = normalizeTr(f.q.trim());
  return subjects.filter((s) => {
    if (f.branchId && s.branchId !== f.branchId) return false;
    if (f.type && s.type !== f.type) return false;
    if (f.levels.length && !f.levels.some((l) => s.levels.includes(l))) return false;
    if (needle) {
      const hay = normalizeTr(`${s.name} ${s.code ?? ""}`);
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

/** Branş listesini ada göre TR sıralar (aktifler önde değil — handoff sıralı seed korunur). */
export function sortBranches(branches: Branch[]): Branch[] {
  return [...branches];
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/derive.test.ts`
Expected: PASS (8 test)

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/subjects/lib/derive.ts src/portals/admin/subjects/__tests__/derive.test.ts
git commit -m "$(date +%Y-%m-%d) feat,test: subjects türetme yardımcıları (branchStats/filterSubjects) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Mock store + API katmanı

**Files:**
- Create: `src/portals/admin/subjects/data/store.ts`
- Create: `src/portals/admin/subjects/api/subjectsApi.ts`

Backend yok → oturum-ömürlü mutable store + simüle latency'li tipli API. Tüm yazma `{ isMock: true }` döndürür.

- [ ] **Step 1: Store'u yaz**

```ts
// src/portals/admin/subjects/data/store.ts
import type { Branch, Subject } from "../types";
import { SEED_BRANCHES, SEED_SUBJECTS } from "./seed";

/** Oturum-ömürlü değişebilir mock store (deep-clone'lu başlatılır). */
let subjects: Subject[] = SEED_SUBJECTS.map((s) => ({ ...s, levels: [...s.levels] }));
let branches: Branch[] = SEED_BRANCHES.map((b) => ({ ...b, color: { ...b.color } }));

export const store = {
  getSubjects: (): Subject[] => subjects.map((s) => ({ ...s, levels: [...s.levels] })),
  getBranches: (): Branch[] => branches.map((b) => ({ ...b, color: { ...b.color } })),
  setSubjects: (next: Subject[]) => { subjects = next; },
  setBranches: (next: Branch[]) => { branches = next; },
  /** Yalnız testlerde: seed'e döndür. */
  __reset: () => {
    subjects = SEED_SUBJECTS.map((s) => ({ ...s, levels: [...s.levels] }));
    branches = SEED_BRANCHES.map((b) => ({ ...b, color: { ...b.color } }));
  },
};
```

- [ ] **Step 2: API'yi yaz**

```ts
// src/portals/admin/subjects/api/subjectsApi.ts
import type { Branch, BranchInput, Subject, SubjectInput } from "../types";
import { store } from "../data/store";

/** Backend bekleyen mock işlem sonucu (Debt). */
export interface MockResult<T> {
  data: T;
  isMock: true;
}

const LATENCY = 220;
const delay = () => new Promise<void>((r) => setTimeout(r, LATENCY));
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

/** Yeni branş için stabil nötr renk (production'da branş→renk eşlemesi opsiyonel). */
const NEUTRAL_COLOR = { bg: "#EEF1FA", fg: "#374151" } as const;

export const subjectsApi = {
  async listSubjects(): Promise<Subject[]> {
    await delay();
    return store.getSubjects();
  },
  async listBranches(): Promise<Branch[]> {
    await delay();
    return store.getBranches();
  },
  async createSubject(input: SubjectInput): Promise<MockResult<Subject>> {
    await delay();
    const created: Subject = {
      id: uid("sub"),
      ...input,
      code: input.code?.trim() || undefined,
      status: "active",
      hasAssignments: false,
    };
    store.setSubjects([...store.getSubjects(), created]);
    return { data: created, isMock: true };
  },
  async updateSubject(id: string, input: SubjectInput): Promise<MockResult<Subject>> {
    await delay();
    let updated: Subject | null = null;
    store.setSubjects(
      store.getSubjects().map((s) => {
        if (s.id !== id) return s;
        updated = { ...s, ...input, code: input.code?.trim() || undefined };
        return updated;
      }),
    );
    if (!updated) throw new Error(`Subject ${id} bulunamadı`);
    return { data: updated, isMock: true };
  },
  async setSubjectStatus(id: string, status: Subject["status"]): Promise<MockResult<void>> {
    await delay();
    store.setSubjects(store.getSubjects().map((s) => (s.id === id ? { ...s, status } : s)));
    return { data: undefined, isMock: true };
  },
  async createBranch(input: BranchInput): Promise<MockResult<Branch>> {
    await delay();
    const created: Branch = {
      id: uid("br"),
      name: input.name.trim(),
      mebCode: input.mebCode?.trim() || undefined,
      status: "active",
      color: NEUTRAL_COLOR,
    };
    store.setBranches([...store.getBranches(), created]);
    return { data: created, isMock: true };
  },
  async updateBranch(id: string, input: BranchInput): Promise<MockResult<Branch>> {
    await delay();
    let updated: Branch | null = null;
    store.setBranches(
      store.getBranches().map((b) => {
        if (b.id !== id) return b;
        updated = { ...b, name: input.name.trim(), mebCode: input.mebCode?.trim() || undefined };
        return updated;
      }),
    );
    if (!updated) throw new Error(`Branch ${id} bulunamadı`);
    return { data: updated, isMock: true };
  },
  async setBranchStatus(id: string, status: Branch["status"]): Promise<MockResult<void>> {
    await delay();
    store.setBranches(store.getBranches().map((b) => (b.id === id ? { ...b, status } : b)));
    return { data: undefined, isMock: true };
  },
  async deleteBranch(id: string): Promise<MockResult<void>> {
    await delay();
    store.setBranches(store.getBranches().filter((b) => b.id !== id));
    return { data: undefined, isMock: true };
  },
};
```

- [ ] **Step 3: Tip kontrolü**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/portals/admin/subjects/data/store.ts src/portals/admin/subjects/api/subjectsApi.ts
git commit -m "$(date +%Y-%m-%d) feat: subjects mock store + API katmanı (Debt) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: React Query keys + data hooks

**Files:**
- Create: `src/portals/admin/subjects/keys/subjectKeys.ts`
- Create: `src/portals/admin/subjects/hooks/useSubjectsData.ts`

- [ ] **Step 1: Keys yaz** (students `tenantScopedKey` desenini izler)

```ts
// src/portals/admin/subjects/keys/subjectKeys.ts
import { tenantScopedKey } from "../../../../shared/config/tenant";

/** Subjects/branches sorguları için tenant-scope'lu React Query key fabrikası. */
export const subjectKeys = {
  all: (schoolId: string | null | undefined) =>
    tenantScopedKey(schoolId, ["subjects"] as const),
  subjects: (schoolId: string | null | undefined) =>
    tenantScopedKey(schoolId, ["subjects", "list"] as const),
  branches: (schoolId: string | null | undefined) =>
    tenantScopedKey(schoolId, ["subjects", "branches"] as const),
};
```

- [ ] **Step 2: Data hooks yaz**

```ts
// src/portals/admin/subjects/hooks/useSubjectsData.ts
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../../../shared/store/authStore";
import { subjectsApi } from "../api/subjectsApi";
import { subjectKeys } from "../keys/subjectKeys";
import type { Branch, Subject } from "../types";

/** Tüm dersler (mock). */
export function useSubjectsQuery() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery<Subject[]>({
    queryKey: subjectKeys.subjects(schoolId),
    queryFn: () => subjectsApi.listSubjects(),
    enabled: Boolean(schoolId),
  });
}

/** Tüm branşlar (mock). */
export function useBranchesQuery() {
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return useQuery<Branch[]>({
    queryKey: subjectKeys.branches(schoolId),
    queryFn: () => subjectsApi.listBranches(),
    enabled: Boolean(schoolId),
  });
}
```

> **Doğrulama:** `tenantScopedKey` imzası `src/shared/config/tenant.ts` içindedir (students aynı şekilde kullanır). `useAuthStore((s) => s.user?.schoolId)` students hook'larıyla aynı.

- [ ] **Step 3: Tip kontrolü**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/portals/admin/subjects/keys/subjectKeys.ts src/portals/admin/subjects/hooks/useSubjectsData.ts
git commit -m "$(date +%Y-%m-%d) feat: subjects React Query keys + data hook'ları eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Mutation hooks (Debt toast)

**Files:**
- Create: `src/portals/admin/subjects/hooks/useSubjectMutations.ts`

students `useStudentDebt` desenini izler: `sonner` toast + `isMock` ise `(mock)` eki.

- [ ] **Step 1: Yaz**

```ts
// src/portals/admin/subjects/hooks/useSubjectMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../../shared/store/authStore";
import { subjectsApi, type MockResult } from "../api/subjectsApi";
import { subjectKeys } from "../keys/subjectKeys";
import type { BranchInput, Status, SubjectInput } from "../types";

function useMockToast() {
  const { t } = useTranslation("subjects");
  return (key: string, res: MockResult<unknown>) => {
    const base = t(key);
    toast.success(res.isMock ? `${base} ${t("debt.mockSuffix")}` : base);
  };
}

function useInvalidate() {
  const qc = useQueryClient();
  const schoolId = useAuthStore((s) => s.user?.schoolId);
  return () => void qc.invalidateQueries({ queryKey: subjectKeys.all(schoolId) });
}

/** Ders oluştur/güncelle (DEBT). id null ise create. */
export function useSaveSubject() {
  const { t } = useTranslation("subjects");
  const mockToast = useMockToast();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: SubjectInput }) =>
      id ? subjectsApi.updateSubject(id, input) : subjectsApi.createSubject(input),
    onSuccess: (res) => { mockToast("debt.courseSaved", res); invalidate(); },
    onError: () => toast.error(t("debt.error")),
  });
}

/** Ders durumu değiştir (DEBT). */
export function useSetSubjectStatus() {
  const { t } = useTranslation("subjects");
  const mockToast = useMockToast();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => subjectsApi.setSubjectStatus(id, status),
    onSuccess: (res) => { mockToast("debt.courseStatus", res); invalidate(); },
    onError: () => toast.error(t("debt.error")),
  });
}

/** Branş oluştur/güncelle (DEBT). */
export function useSaveBranch() {
  const { t } = useTranslation("subjects");
  const mockToast = useMockToast();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: BranchInput }) =>
      id ? subjectsApi.updateBranch(id, input) : subjectsApi.createBranch(input),
    onSuccess: (res) => { mockToast("debt.branchSaved", res); invalidate(); },
    onError: () => toast.error(t("debt.error")),
  });
}

/** Branş durumu değiştir (DEBT). */
export function useSetBranchStatus() {
  const { t } = useTranslation("subjects");
  const mockToast = useMockToast();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => subjectsApi.setBranchStatus(id, status),
    onSuccess: (res) => { mockToast("debt.branchStatus", res); invalidate(); },
    onError: () => toast.error(t("debt.error")),
  });
}

/** Branş sil (DEBT) — yalnız bağlı kayıt yokken çağrılır. */
export function useDeleteBranch() {
  const { t } = useTranslation("subjects");
  const mockToast = useMockToast();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.deleteBranch(id),
    onSuccess: (res) => { mockToast("debt.branchDeleted", res); invalidate(); },
    onError: () => toast.error(t("debt.error")),
  });
}
```

> **Doğrulama:** `sonner`'ın `toast`'ı projede kullanımda (students `useStudentDebt`). `useTranslation("subjects")` Task 3 namespace'ini kullanır.

- [ ] **Step 2: Tip kontrolü**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/portals/admin/subjects/hooks/useSubjectMutations.ts
git commit -m "$(date +%Y-%m-%d) feat: subjects mutation hook'ları (Debt toast) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: CSS port (subjects.css)

**Files:**
- Create: `src/portals/admin/subjects/subjects.css`

Handoff `academics.css` ekrana özgü sınıfları taşınır. `.stu*` ve `.btn*` zaten `students.css`'te (SubjectsPage onu da import eder). `.drawer*` / `.modal*` / `.fld*` / `.seg` / `.chip-pick` sınıfları handoff'ta `students.css`/`modals.css` içindeydi — oksis-web'de karşılıkları kontrol edilip eksikler `subjects.css`'e eklenir.

- [ ] **Step 1: Kaynağı oku ve port et**

Kaynak: `/Users/farukkaya/Downloads/oksis_akademik_extract/design_handoff_academics/app/academics.css`. Tüm içeriği `subjects.css`'e kopyala. Sonra şu sınıfları **mevcut oksis-web'de ara** (grep) ve **zaten tanımlıysa subjects.css'ten çıkar** (çift tanım çakışmasın):

```bash
# oksis-web kökünde:
grep -rl "\.drawer\b\|\.drawer-scrim\|\.fld\b\|\.seg\b\|\.chip-pick\|\.modal-card" src --include="*.css"
```

Mevcut olanları (ör. `.drawer`, `.fld`, `.seg` `students.css`/`shared/styles/modal.css` içinde) subjects.css'ten **silme**; yerine SubjectsPage'de o CSS'leri import et (Task 14). subjects.css yalnızca **akademik-özgü** sınıfları içersin: `.aca-tabs`, `.aca-tab`, `.aca-tab .cnt`, `.aca-branch`(+`.neutral`+`.bd`), `.aca-lvls`/`.aca-lvl`, `.aca-tur`(+`.sec`), `.aca-status`(+`.on`+`.dot`), `.aca-cnt`(+`.zero`), `.aca-uyum`, `.rmenu`(+`.rmenu-pop`/`.rmenu-item`/`.rmenu-sep`), `.row-actions`, `.ra-btn`, `.col-actions`, `.is-pasif`, `.asg-lvls`/`.asg-lvl-chip`, `.tb-spacer`, `.tb-icon-btn`, `.fld-hint`, `.chip-grid`, `.aca-note`(+`.ok`), `.sp`/`.spacer`, `.aca-foot`.

> Bu sınıfların tam CSS gövdeleri handoff `academics.css`'tedir; oradan birebir kopyalanır (token değişkenleri `--navy`, `--surface`, `--success-bg` vb. oksis-web `brand.css`/global'de mevcut). Hiçbir değer uydurulmaz — kaynak dosya esastır.

- [ ] **Step 2: Doğrula** (lint/format)

Run: `npx prettier --check src/portals/admin/subjects/subjects.css || npx prettier --write src/portals/admin/subjects/subjects.css`
Expected: dosya biçimli

- [ ] **Step 3: Commit**

```bash
git add src/portals/admin/subjects/subjects.css
git commit -m "$(date +%Y-%m-%d) feat: subjects.css — akademik ekran stilleri handoff'tan port edildi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Sunum bileşenleri (badge'ler + StatusDot + CountBadge + LevelChips)

**Files:**
- Create: `src/portals/admin/subjects/components/BranchBadge.tsx`
- Create: `src/portals/admin/subjects/components/SubjectTypeBadge.tsx`
- Create: `src/portals/admin/subjects/components/LevelChips.tsx`
- Create: `src/portals/admin/subjects/components/StatusDot.tsx`
- Create: `src/portals/admin/subjects/components/CountBadge.tsx`

Salt-sunum; logic yok → testler Task 11/13'teki tablo/sayfa testleriyle dolaylı kapsanır.

- [ ] **Step 1: BranchBadge**

```tsx
// src/portals/admin/subjects/components/BranchBadge.tsx
import type { Branch } from "../types";

/** Nötr branş rozeti: gri kapsül + branşın koyu renginde nokta + ad (handoff .aca-branch.neutral). */
export function BranchBadge({ branch }: { branch: Branch | undefined }) {
  if (!branch) return null;
  return (
    <span className="aca-branch neutral">
      <span className="bd" style={{ background: branch.color.fg }} />
      {branch.name}
    </span>
  );
}
```

> **İstisna notu:** Branş nokta rengi veriden gelen dinamik değerdir (16 farklı branş rengi) → `style={{ background }}` zorunlu; tasarım tokenı ile ifade edilemez. Bu, "inline style yasak" kuralının kabul edilen veri-sürümlü istisnasıdır (classrooms `GenderBar` aynı deseni kullanır). Statik renkler CSS'te kalır.

- [ ] **Step 2: SubjectTypeBadge**

```tsx
// src/portals/admin/subjects/components/SubjectTypeBadge.tsx
import { useTranslation } from "react-i18next";
import { cn } from "../../../../lib/utils";
import type { SubjectType } from "../types";

/** Tür kapsülü: Seçmeli → mor (.sec). */
export function SubjectTypeBadge({ type }: { type: SubjectType }) {
  const { t } = useTranslation("subjects");
  return <span className={cn("aca-tur", type === "secmeli" && "sec")}>{t(`type.${type}`)}</span>;
}
```

- [ ] **Step 3: LevelChips**

```tsx
// src/portals/admin/subjects/components/LevelChips.tsx
import type { Level } from "../types";

/** Seviye kareleri (9,10,11,12) — handoff .aca-lvls/.aca-lvl. */
export function LevelChips({ levels }: { levels: Level[] }) {
  return (
    <div className="aca-lvls">
      {levels.map((l) => (
        <span className="aca-lvl" key={l}>{l}</span>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: StatusDot**

```tsx
// src/portals/admin/subjects/components/StatusDot.tsx
import { useTranslation } from "react-i18next";
import { cn } from "../../../../lib/utils";
import type { Status } from "../types";

/** Aktif (yeşil nokta+halka) / Pasif (gri nokta) — handoff .aca-status. */
export function StatusDot({ status }: { status: Status }) {
  const { t } = useTranslation("subjects");
  const on = status === "active";
  return (
    <span className={cn("aca-status", on && "on")}>
      <span className="dot" />
      {t(`status.${status}`)}
    </span>
  );
}
```

- [ ] **Step 5: CountBadge**

```tsx
// src/portals/admin/subjects/components/CountBadge.tsx
import { BookOpen, Users, type LucideIcon } from "lucide-react";
import { cn } from "../../../../lib/utils";

const ICONS: Record<"book" | "users", LucideIcon> = { book: BookOpen, users: Users };

/** Sayaç rozeti (.aca-cnt) — 0 ise soluk (.zero). */
export function CountBadge({ icon, count }: { icon: "book" | "users"; count: number }) {
  const Icon = ICONS[icon];
  return (
    <span className={cn("aca-cnt", count === 0 && "zero")}>
      <Icon size={13} />
      {count}
    </span>
  );
}
```

- [ ] **Step 6: Tip kontrolü**

Run: `npx tsc --noEmit`
Expected: PASS

> **Doğrulama:** `cn` `src/lib/utils` içinde (PageHeader `import { cn } from "../../../lib/utils"` kullanıyor — buradan göreli yol `../../../../lib/utils`).

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/subjects/components/BranchBadge.tsx src/portals/admin/subjects/components/SubjectTypeBadge.tsx src/portals/admin/subjects/components/LevelChips.tsx src/portals/admin/subjects/components/StatusDot.tsx src/portals/admin/subjects/components/CountBadge.tsx
git commit -m "$(date +%Y-%m-%d) feat: subjects sunum bileşenleri (rozet/status/sayaç) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: RowMenu (3-nokta) — TDD

**Files:**
- Create: `src/portals/admin/subjects/components/RowMenu.tsx`
- Test: `src/portals/admin/subjects/__tests__/RowMenu.test.tsx`

- [ ] **Step 1: Testi yaz**

```tsx
// src/portals/admin/subjects/__tests__/RowMenu.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RowMenu } from "../components/RowMenu";

describe("RowMenu", () => {
  it("açılır ve öğe tıklaması callback'i çağırır", () => {
    const onEdit = vi.fn();
    render(<RowMenu items={[{ key: "edit", icon: "pencil", label: "Düzenle", onClick: onEdit }]} />);
    fireEvent.click(screen.getByRole("button", { name: /daha fazla/i }));
    fireEvent.click(screen.getByText("Düzenle"));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("disabled öğe tıklanınca callback çağrılmaz", () => {
    const onDelete = vi.fn();
    render(<RowMenu items={[{ key: "del", icon: "trash-2", label: "Sil", danger: true, disabled: true, tip: "kilit", onClick: onDelete }]} />);
    fireEvent.click(screen.getByRole("button", { name: /daha fazla/i }));
    fireEvent.click(screen.getByText("Sil"));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/RowMenu.test.tsx`
Expected: FAIL ("Cannot find module '../components/RowMenu'")

- [ ] **Step 3: Implementasyonu yaz** (handoff `AcaRowMenu`)

```tsx
// src/portals/admin/subjects/components/RowMenu.tsx
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Pause, Play, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "../../../../lib/utils";

type IconName = "pencil" | "pause" | "play" | "trash-2";
const ICONS: Record<IconName, LucideIcon> = { pencil: Pencil, pause: Pause, play: Play, "trash-2": Trash2 };

export interface RowMenuItem {
  key: string;
  icon: IconName;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  tip?: string;
  /** Üst ayraç çizgisi. */
  separatorBefore?: boolean;
}

/** Satır sonu üç-nokta menüsü; dış tıklama ile kapanır (handoff AcaRowMenu). */
export function RowMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="rmenu" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="ra-btn" title="Daha fazla" aria-label="Daha fazla" onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="rmenu-pop">
          {items.map((it) => {
            const Icon = ICONS[it.icon];
            return (
              <div key={it.key}>
                {it.separatorBefore && <div className="rmenu-sep" />}
                <button
                  type="button"
                  className={cn("rmenu-item", it.danger && "danger", it.disabled && "disabled")}
                  title={it.tip}
                  onClick={() => {
                    if (it.disabled) return;
                    setOpen(false);
                    it.onClick?.();
                  }}
                >
                  <Icon size={15} /> {it.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Testin geçtiğini gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/RowMenu.test.tsx`
Expected: PASS (2 test)

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/subjects/components/RowMenu.tsx src/portals/admin/subjects/__tests__/RowMenu.test.tsx
git commit -m "$(date +%Y-%m-%d) feat,test: subjects RowMenu (3-nokta menü) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: CourseDrawer — TDD

**Files:**
- Create: `src/portals/admin/subjects/components/CourseDrawer.tsx`
- Test: `src/portals/admin/subjects/__tests__/CourseDrawer.test.tsx`

Handoff `CourseDrawer` + `AcaDrawer` kabuğu birebir. Form state RHF değil, yerel `useState` (handoff sadakati + drawer içi geçici form — web kuralı "form state RHF" liste filtreleri için; bu küçük drawer handoff'a sadık kalır). **Not:** Eğer reviewer RHF zorunlu derse, bu drawer RHF+zod'a taşınabilir; şimdilik handoff sadakati önceliklidir.

- [ ] **Step 1: Testi yaz**

```tsx
// src/portals/admin/subjects/__tests__/CourseDrawer.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../shared/i18n";
import { CourseDrawer } from "../components/CourseDrawer";
import { SEED_BRANCHES } from "../data/seed";

const noop = () => {};

describe("CourseDrawer", () => {
  it("Ders Adı ve Branş boşken Kaydet disabled", () => {
    render(<CourseDrawer subject={null} branches={SEED_BRANCHES} onClose={noop} onSave={noop} />);
    expect(screen.getByRole("button", { name: /^Kaydet$/ })).toBeDisabled();
  });

  it("zorunlu alanlar dolunca Kaydet onSave çağırır ve kapanır", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(<CourseDrawer subject={null} branches={SEED_BRANCHES} onClose={onClose} onSave={onSave} />);
    fireEvent.change(screen.getByPlaceholderText("örn. Matematik"), { target: { value: "Geometri" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mat" } });
    fireEvent.click(screen.getByRole("button", { name: /^Kaydet$/ }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "Geometri", branchId: "mat" }), null);
    expect(onClose).toHaveBeenCalled();
  });

  it("'Kaydet ve Yeni Ekle' formu sıfırlar ve onay notu gösterir", () => {
    const onSave = vi.fn();
    render(<CourseDrawer subject={null} branches={SEED_BRANCHES} onClose={noop} onSave={onSave} />);
    const name = screen.getByPlaceholderText("örn. Matematik") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Geometri" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "mat" } });
    fireEvent.click(screen.getByRole("button", { name: /Kaydet ve Yeni Ekle/ }));
    expect(onSave).toHaveBeenCalledOnce();
    expect(name.value).toBe(""); // sıfırlandı
    expect(screen.getByText(/yeni ders ekleyebilirsiniz/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/CourseDrawer.test.tsx`
Expected: FAIL ("Cannot find module '../components/CourseDrawer'")

- [ ] **Step 3: Implementasyonu yaz**

```tsx
// src/portals/admin/subjects/components/CourseDrawer.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, BookOpen, Check, CheckCircle2, Info } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { LEVEL_OPTIONS, type Branch, type Level, type Subject, type SubjectInput, type SubjectType } from "../types";

interface Props {
  subject: Subject | null;
  branches: Branch[];
  onClose: () => void;
  onSave: (input: SubjectInput, id: string | null) => void;
}

/** Ders ekle/düzenle drawer'ı (handoff CourseDrawer + AcaDrawer). */
export function CourseDrawer({ subject, branches, onClose, onSave }: Props) {
  const { t } = useTranslation("subjects");
  const isNew = !subject;
  const [name, setName] = useState(subject?.name ?? "");
  const [code, setCode] = useState(subject?.code ?? "");
  const [branchId, setBranchId] = useState(subject?.branchId ?? "");
  const [levels, setLevels] = useState<Level[]>(subject?.levels ?? []);
  const [type, setType] = useState<SubjectType>(subject?.type ?? "zorunlu");
  const [hours, setHours] = useState<string>(subject?.recommendedWeeklyHours?.toString() ?? "");
  const [description, setDescription] = useState(subject?.description ?? "");
  const [saved, setSaved] = useState(false);

  const valid = name.trim().length > 0 && Boolean(branchId);

  function collect(): SubjectInput {
    return {
      name: name.trim(),
      code: code.trim() || undefined,
      branchId,
      levels,
      type,
      recommendedWeeklyHours: hours === "" ? null : Number(hours),
      description: description.trim(),
    };
  }
  function reset() {
    setName(""); setCode(""); setBranchId(""); setLevels([]); setType("zorunlu"); setHours(""); setDescription("");
  }
  function save(andNew: boolean) {
    if (!valid) return;
    onSave(collect(), subject?.id ?? null);
    if (andNew) {
      reset();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } else {
      onClose();
    }
  }
  function toggleLevel(l: Level) {
    setLevels((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l].sort((a, b) => a - b)));
  }

  const activeBranches = branches.filter((b) => b.status === "active");

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Kapat"><X size={18} /></button>
          <div className="drawer-id">
            <div className="fdr-ic"><BookOpen size={22} /></div>
            <div className="di">
              <div className="nm">{isNew ? t("courseDrawer.titleNew") : t("courseDrawer.titleEdit")}</div>
              <div className="no">{isNew ? t("courseDrawer.subNew") : `${subject!.name}${subject!.code ? ` · ${subject!.code}` : ""}`}</div>
            </div>
          </div>
        </div>

        <div className="drawer-body">
          {saved && (
            <div className="aca-note ok" style={{ marginTop: 0, marginBottom: 14 }}>
              <CheckCircle2 size={15} />
              <span>{t("courseDrawer.savedNote")}</span>
            </div>
          )}

          <div className="fld">
            <div className="fld-l">{t("courseDrawer.name")} <span className="req">*</span></div>
            <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("courseDrawer.namePlaceholder")} autoFocus />
          </div>

          <div className="fld-row">
            <div className="fld">
              <div className="fld-l">{t("courseDrawer.code")} <span className="opt">{t("courseDrawer.optional")}</span></div>
              <input className="inp" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("courseDrawer.codePlaceholder")} />
            </div>
            <div className="fld">
              <div className="fld-l">{t("courseDrawer.hours")} <span className="opt">{t("courseDrawer.optional")}</span></div>
              <input className="inp" type="number" min={0} max={12} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="—" />
            </div>
          </div>

          <div className="fld">
            <div className="fld-l">{t("courseDrawer.branch")} <span className="req">*</span></div>
            <select className="sel" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">{t("courseDrawer.branchPlaceholder")}</option>
              {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <div className="fld-hint"><Info size={14} /><span>{t("courseDrawer.branchHint")}</span></div>
          </div>

          <div className="fld">
            <div className="fld-l">{t("courseDrawer.level")}</div>
            <div className="chip-grid">
              {LEVEL_OPTIONS.map((l) => (
                <button type="button" key={l} className={cn("chip-pick", levels.includes(l) && "on")} onClick={() => toggleLevel(l)}>
                  <span className="ck"><Check size={11} strokeWidth={3} /></span>{t("courseDrawer.levelLabel", { n: l })}
                </button>
              ))}
            </div>
          </div>

          <div className="fld">
            <div className="fld-l">{t("courseDrawer.type")}</div>
            <div className="seg">
              <button type="button" className={cn(type === "zorunlu" && "on")} onClick={() => setType("zorunlu")}>{t("type.zorunlu")}</button>
              <button type="button" className={cn(type === "secmeli" && "on")} onClick={() => setType("secmeli")}>{t("type.secmeli")}</button>
            </div>
          </div>

          <div className="fld">
            <div className="fld-l">{t("courseDrawer.description")} <span className="opt">{t("courseDrawer.optional")}</span></div>
            <textarea className="inp" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("courseDrawer.descriptionPlaceholder")} />
          </div>
        </div>

        <div className="drawer-foot aca-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t("courseDrawer.cancel")}</button>
          <div className="sp" />
          <button type="button" className={cn("btn btn-ghost", !valid && "disabled")} disabled={!valid} onClick={() => save(true)}>
            {t("courseDrawer.saveAndNew")}
          </button>
          <button type="button" className={cn("btn btn-primary", !valid && "disabled")} disabled={!valid} onClick={() => save(false)}>
            <Check size={17} /> {t("courseDrawer.save")}
          </button>
        </div>
      </aside>
    </>
  );
}
```

> **Inline style istisnası:** `aca-note`'taki `style={{ marginTop, marginBottom }}` handoff'a birebir sadakat içindir; istenirse `subjects.css`'te `.aca-note.inline-first` sınıfına çıkarılabilir. Reviewer kararına bırakıldı.

- [ ] **Step 4: Testin geçtiğini gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/CourseDrawer.test.tsx`
Expected: PASS (3 test)

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/subjects/components/CourseDrawer.tsx src/portals/admin/subjects/__tests__/CourseDrawer.test.tsx
git commit -m "$(date +%Y-%m-%d) feat,test: subjects CourseDrawer (ders ekle/düzenle) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: BranchModal — TDD

**Files:**
- Create: `src/portals/admin/subjects/components/BranchModal.tsx`
- Test: `src/portals/admin/subjects/__tests__/BranchModal.test.tsx`

Paylaşılan `Dialog` (`src/shared/Dialog.tsx`) kabuğu kullanılır. **İlk olarak** `src/shared/Dialog.tsx` API'sini oku ve uygun prop'larla sar; aşağıdaki kod minimal kabuğu varsayar (başlık + children + footer). Eğer paylaşılan Dialog farklı imza sunuyorsa ona uydur (alan içerikleri/i18n key'leri değişmez).

- [ ] **Step 1: Testi yaz**

```tsx
// src/portals/admin/subjects/__tests__/BranchModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../../../shared/i18n";
import { BranchModal } from "../components/BranchModal";

const noop = () => {};

describe("BranchModal", () => {
  it("Branş Adı boşken Kaydet disabled", () => {
    render(<BranchModal branch={null} onClose={noop} onSave={noop} />);
    expect(screen.getByRole("button", { name: /^Kaydet$/ })).toBeDisabled();
  });
  it("ad dolunca Kaydet onSave(payload, null) çağırır", () => {
    const onSave = vi.fn();
    render(<BranchModal branch={null} onClose={noop} onSave={onSave} />);
    fireEvent.change(screen.getByPlaceholderText("örn. Matematik"), { target: { value: "Astronomi" } });
    fireEvent.click(screen.getByRole("button", { name: /^Kaydet$/ }));
    expect(onSave).toHaveBeenCalledWith({ name: "Astronomi", mebCode: undefined }, null);
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/BranchModal.test.tsx`
Expected: FAIL ("Cannot find module '../components/BranchModal'")

- [ ] **Step 3: Implementasyonu yaz** (paylaşılan Dialog yoksa handoff `Modal` desenli minimal kabuk)

```tsx
// src/portals/admin/subjects/components/BranchModal.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Briefcase, Check } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { Branch, BranchInput } from "../types";

interface Props {
  branch: Branch | null;
  onClose: () => void;
  onSave: (input: BranchInput, id: string | null) => void;
}

/** Branş ekle/düzenle modalı (handoff BranchModal). */
export function BranchModal({ branch, onClose, onSave }: Props) {
  const { t } = useTranslation("subjects");
  const isNew = !branch;
  const [name, setName] = useState(branch?.name ?? "");
  const [mebCode, setMebCode] = useState(branch?.mebCode ?? "");
  const valid = name.trim().length > 0;

  function save() {
    if (!valid) return;
    onSave({ name: name.trim(), mebCode: mebCode.trim() || undefined }, branch?.id ?? null);
    onClose();
  }

  return (
    <>
      <div className="modal-scrim" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-id">
            <div className="fdr-ic"><Briefcase size={22} /></div>
            <div className="di">
              <div className="nm">{isNew ? t("branchModal.titleNew") : t("branchModal.titleEdit")}</div>
              <div className="no">{t("branchModal.sub")}</div>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Kapat"><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="fld">
            <div className="fld-l">{t("branchModal.name")} <span className="req">*</span></div>
            <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("branchModal.namePlaceholder")} autoFocus />
          </div>
          <div className="fld">
            <div className="fld-l">{t("branchModal.mebCode")} <span className="opt">{t("branchModal.optional")}</span></div>
            <input className="inp" value={mebCode} onChange={(e) => setMebCode(e.target.value)} placeholder={t("branchModal.mebCodePlaceholder")} />
          </div>
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t("branchModal.cancel")}</button>
          <div className="spacer" />
          <button type="button" className={cn("btn btn-primary", !valid && "disabled")} disabled={!valid} onClick={save}>
            <Check size={17} /> {t("branchModal.save")}
          </button>
        </div>
      </div>
    </>
  );
}
```

> **Doğrulama:** `.modal-scrim/.modal-card/.modal-head/.modal-body/.modal-foot` sınıflarının oksis-web'de var olup olmadığını grep et (`grep -r "modal-card" src --include="*.css"`). Yoksa Task 8'de bu sınıfları handoff `modals.css`'ten `subjects.css`'e ekle. Varsa mevcut CSS import edilir.

- [ ] **Step 4: Testin geçtiğini gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/BranchModal.test.tsx`
Expected: PASS (2 test)

- [ ] **Step 5: Commit**

```bash
git add src/portals/admin/subjects/components/BranchModal.tsx src/portals/admin/subjects/__tests__/BranchModal.test.tsx
git commit -m "$(date +%Y-%m-%d) feat,test: subjects BranchModal (branş ekle/düzenle) eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: Tablolar (CoursesTable + BranchesTable) + Toolbar + Tabs + EmptyState

**Files:**
- Create: `src/portals/admin/subjects/components/states/EmptyState.tsx`
- Create: `src/portals/admin/subjects/components/SubjectsTabs.tsx`
- Create: `src/portals/admin/subjects/components/CoursesToolbar.tsx`
- Create: `src/portals/admin/subjects/components/CoursesTable.tsx`
- Create: `src/portals/admin/subjects/components/BranchesTable.tsx`

Bunlar sunum + delege; logic Task 4/10/11/12'de test edildi. Bütünleşik davranış Task 14'te test edilir.

- [ ] **Step 1: EmptyState**

```tsx
// src/portals/admin/subjects/components/states/EmptyState.tsx
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Liste boş durumu (handoff .stu-state). */
export function EmptyState({ icon: Icon, title, desc, action }: {
  icon: LucideIcon; title: string; desc: string; action?: ReactNode;
}) {
  return (
    <div className="stu-state">
      <div className="se-ico"><Icon size={28} /></div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action}
    </div>
  );
}
```

- [ ] **Step 2: SubjectsTabs**

```tsx
// src/portals/admin/subjects/components/SubjectsTabs.tsx
import { useTranslation } from "react-i18next";
import { cn } from "../../../../lib/utils";

export type SubjectsTab = "dersler" | "branslar";

/** Sticky sekme çubuğu, sayaç rozetli (handoff .aca-tabs). */
export function SubjectsTabs({ tab, counts, onChange }: {
  tab: SubjectsTab; counts: { dersler: number; branslar: number }; onChange: (t: SubjectsTab) => void;
}) {
  const { t } = useTranslation("subjects");
  return (
    <div className="aca-tabs">
      <button type="button" className={cn("aca-tab", tab === "dersler" && "on")} onClick={() => onChange("dersler")}>
        {t("tabs.courses")} <span className="cnt">{counts.dersler}</span>
      </button>
      <button type="button" className={cn("aca-tab", tab === "branslar" && "on")} onClick={() => onChange("branslar")}>
        {t("tabs.branches")} <span className="cnt">{counts.branslar}</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 3: CoursesToolbar**

```tsx
// src/portals/admin/subjects/components/CoursesToolbar.tsx
import { useTranslation } from "react-i18next";
import { Search, Sliders } from "lucide-react";
import { cn } from "../../../../lib/utils";
import { LEVEL_OPTIONS, type Branch, type Level, type SubjectType } from "../types";

interface Props {
  search: string; onSearch: (v: string) => void;
  branches: Branch[];
  branchId: string; onBranch: (v: string) => void;
  levels: Level[]; onToggleLevel: (l: Level) => void;
  type: SubjectType | ""; onType: (v: SubjectType | "") => void;
}

/** Dersler sekmesi araç çubuğu (handoff .stu-toolbar). */
export function CoursesToolbar({ search, onSearch, branches, branchId, onBranch, levels, onToggleLevel, type, onType }: Props) {
  const { t } = useTranslation("subjects");
  const activeBranches = branches.filter((b) => b.status === "active");
  return (
    <div className="stu-toolbar">
      <label className="stu-search">
        <Search size={18} />
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={t("toolbar.searchPlaceholder")} />
      </label>

      <select className="sel" value={branchId} onChange={(e) => onBranch(e.target.value)} aria-label={t("toolbar.branchFilter")}>
        <option value="">{t("toolbar.branchFilter")}</option>
        {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>

      <div className="asg-lvls" style={{ gap: 5 }}>
        {LEVEL_OPTIONS.map((l) => (
          <button type="button" key={l} className={cn("asg-lvl-chip", levels.includes(l) && "on")} onClick={() => onToggleLevel(l)}>{l}</button>
        ))}
      </div>

      <select className="sel" value={type} onChange={(e) => onType(e.target.value as SubjectType | "")} aria-label={t("toolbar.typeFilter")}>
        <option value="">{t("toolbar.typeFilter")}</option>
        <option value="zorunlu">{t("type.zorunlu")}</option>
        <option value="secmeli">{t("type.secmeli")}</option>
      </select>

      <div className="tb-spacer" />
      <button type="button" className="tb-icon-btn" title={t("toolbar.columnSettings")} aria-label={t("toolbar.columnSettings")}><Sliders size={18} /></button>
    </div>
  );
}
```

> **Not:** `.asg-lvls` `style={{ gap: 5 }}` handoff'tan; istenirse `subjects.css`'e taşınır.

- [ ] **Step 4: CoursesTable**

```tsx
// src/portals/admin/subjects/components/CoursesTable.tsx
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { Branch, Subject } from "../types";
import { BranchBadge } from "./BranchBadge";
import { SubjectTypeBadge } from "./SubjectTypeBadge";
import { LevelChips } from "./LevelChips";
import { StatusDot } from "./StatusDot";
import { RowMenu } from "./RowMenu";

interface Props {
  subjects: Subject[];
  branchById: Map<string, Branch>;
  onEdit: (s: Subject) => void;
  onToggleStatus: (s: Subject) => void;
}

export function CoursesTable({ subjects, branchById, onEdit, onToggleStatus }: Props) {
  const { t } = useTranslation("subjects");
  return (
    <table className="stu-tbl">
      <thead>
        <tr>
          <th>{t("courses.col.name")}</th>
          <th>{t("courses.col.code")}</th>
          <th>{t("courses.col.branch")}</th>
          <th>{t("courses.col.level")}</th>
          <th>{t("courses.col.type")}</th>
          <th className="num">{t("courses.col.hours")}</th>
          <th>{t("courses.col.status")}</th>
          <th className="col-actions" />
        </tr>
      </thead>
      <tbody>
        {subjects.map((c) => (
          <tr key={c.id} className={cn(c.status === "passive" && "is-pasif")} onClick={() => onEdit(c)}>
            <td><span style={{ fontWeight: 700, color: "var(--text)" }}>{c.name}</span></td>
            <td className="num" style={{ color: "var(--text-muted)" }}>{c.code ?? t("courses.empty")}</td>
            <td><BranchBadge branch={branchById.get(c.branchId)} /></td>
            <td><LevelChips levels={c.levels} /></td>
            <td><SubjectTypeBadge type={c.type} /></td>
            <td className="num" style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
              {c.recommendedWeeklyHours == null ? t("courses.empty") : t("courses.hoursValue", { count: c.recommendedWeeklyHours })}
            </td>
            <td><StatusDot status={c.status} /></td>
            <td className="col-actions" onClick={(e) => e.stopPropagation()}>
              <div className="row-actions">
                <button type="button" className="ra-btn" title={t("courses.rowMenu.edit")} onClick={() => onEdit(c)}><Pencil size={16} /></button>
                <RowMenu items={[
                  { key: "edit", icon: "pencil", label: t("courses.rowMenu.edit"), onClick: () => onEdit(c) },
                  c.status === "active"
                    ? { key: "passivate", icon: "pause", label: t("courses.rowMenu.passivate"), onClick: () => onToggleStatus(c) }
                    : { key: "activate", icon: "play", label: t("courses.rowMenu.activate"), onClick: () => onToggleStatus(c) },
                  { key: "delete", icon: "trash-2", label: t("courses.rowMenu.delete"), danger: true, disabled: c.hasAssignments, tip: c.hasAssignments ? t("courses.deleteLockTip") : undefined, separatorBefore: true },
                ]} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

> **Inline style istisnası:** `fontWeight/color/fontVariantNumeric` handoff'a birebir; reviewer isterse `.stu-tbl .cell-strong`/`.num` sınıflarına çıkarılır. Mevcut classrooms/students tabloları da benzer inline değerler taşıyor.

- [ ] **Step 5: BranchesTable**

```tsx
// src/portals/admin/subjects/components/BranchesTable.tsx
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { Branch, Subject } from "../types";
import { branchStats } from "../lib/derive";
import { SEED_TEACHER_COUNT } from "../data/seed";
import { StatusDot } from "./StatusDot";
import { CountBadge } from "./CountBadge";
import { RowMenu } from "./RowMenu";

interface Props {
  branches: Branch[];
  subjects: Subject[];
  onEdit: (b: Branch) => void;
  onToggleStatus: (b: Branch) => void;
  onDelete: (b: Branch) => void;
}

export function BranchesTable({ branches, subjects, onEdit, onToggleStatus, onDelete }: Props) {
  const { t } = useTranslation("subjects");
  return (
    <table className="stu-tbl">
      <thead>
        <tr>
          <th>{t("branches.col.name")}</th>
          <th>{t("branches.col.mebCode")}</th>
          <th>{t("branches.col.subjectCount")}</th>
          <th>{t("branches.col.teacherCount")}</th>
          <th>{t("branches.col.status")}</th>
          <th className="col-actions" />
        </tr>
      </thead>
      <tbody>
        {branches.map((b) => {
          const st = branchStats(b.id, subjects, SEED_TEACHER_COUNT);
          const used = st.subjectCount > 0 || st.teacherCount > 0;
          return (
            <tr key={b.id} className={cn(b.status === "passive" && "is-pasif")} onClick={() => onEdit(b)}>
              <td>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 700, color: "var(--text)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: b.color.fg, display: "inline-block" }} />
                  {b.name}
                </span>
              </td>
              <td className="num" style={{ color: "var(--text-muted)" }}>{b.mebCode ?? "—"}</td>
              <td><CountBadge icon="book" count={st.subjectCount} /></td>
              <td><CountBadge icon="users" count={st.teacherCount} /></td>
              <td><StatusDot status={b.status} /></td>
              <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                <div className="row-actions">
                  <button type="button" className="ra-btn" title={t("branches.rowMenu.edit")} onClick={() => onEdit(b)}><Pencil size={16} /></button>
                  <RowMenu items={[
                    { key: "edit", icon: "pencil", label: t("branches.rowMenu.edit"), onClick: () => onEdit(b) },
                    b.status === "active"
                      ? { key: "passivate", icon: "pause", label: t("branches.rowMenu.passivate"), onClick: () => onToggleStatus(b) }
                      : { key: "activate", icon: "play", label: t("branches.rowMenu.activate"), onClick: () => onToggleStatus(b) },
                    { key: "delete", icon: "trash-2", label: t("branches.rowMenu.delete"), danger: true, disabled: used, tip: used ? t("branches.deleteLockTip") : undefined, onClick: () => onDelete(b), separatorBefore: true },
                  ]} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 6: Tip kontrolü**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/subjects/components/states/EmptyState.tsx src/portals/admin/subjects/components/SubjectsTabs.tsx src/portals/admin/subjects/components/CoursesToolbar.tsx src/portals/admin/subjects/components/CoursesTable.tsx src/portals/admin/subjects/components/BranchesTable.tsx
git commit -m "$(date +%Y-%m-%d) feat: subjects tablolar + toolbar + tabs + boş durum bileşenleri eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 14: SubjectsPage (orkestrasyon) + index barrel — TDD

**Files:**
- Create: `src/portals/admin/subjects/SubjectsPage.tsx`
- Create: `src/portals/admin/subjects/index.ts`
- Test: `src/portals/admin/subjects/__tests__/SubjectsPage.test.tsx`

- [ ] **Step 1: Testi yaz**

```tsx
// src/portals/admin/subjects/__tests__/SubjectsPage.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import "../../../../shared/i18n";
import { SubjectsPage } from "../SubjectsPage";
import { store } from "../data/store";
import { useAuthStore } from "../../../../shared/store/authStore";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/admin/subjects"]}>
        <SubjectsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  store.__reset();
  // schoolId set et (query enabled olsun)
  useAuthStore.setState({ user: { schoolId: "school-1" } } as never);
});

describe("SubjectsPage", () => {
  it("Dersler sekmesi yüklenir, seed dersler görünür", async () => {
    renderPage();
    expect(await screen.findByText("Matematik")).toBeInTheDocument();
    expect(screen.getByText("T.C. İnkılap Tarihi ve Atatürkçülük")).toBeInTheDocument();
  });

  it("Branşlar sekmesine geçiş tablo değiştirir", async () => {
    renderPage();
    await screen.findByText("Matematik");
    fireEvent.click(screen.getByRole("button", { name: /Branşlar/ }));
    await waitFor(() => expect(screen.getByText("MEB Kodu")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Testin başarısız olduğunu gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/SubjectsPage.test.tsx`
Expected: FAIL ("Cannot find module '../SubjectsPage'")

- [ ] **Step 3: SubjectsPage'i yaz**

```tsx
// src/portals/admin/subjects/SubjectsPage.tsx
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus, BookOpen, Briefcase, Search } from "lucide-react";
import { PageHeader } from "../../../shared/components/PageHeader";
import { useSubjectsQuery, useBranchesQuery } from "./hooks/useSubjectsData";
import { useSaveSubject, useSetSubjectStatus, useSaveBranch, useSetBranchStatus, useDeleteBranch } from "./hooks/useSubjectMutations";
import { filterSubjects } from "./lib/derive";
import type { Branch, Level, Subject, SubjectType } from "./types";
import { SubjectsTabs, type SubjectsTab } from "./components/SubjectsTabs";
import { CoursesToolbar } from "./components/CoursesToolbar";
import { CoursesTable } from "./components/CoursesTable";
import { BranchesTable } from "./components/BranchesTable";
import { CourseDrawer } from "./components/CourseDrawer";
import { BranchModal } from "./components/BranchModal";
import { EmptyState } from "./components/states/EmptyState";
import "../students/students.css";
import "../../../shared/styles/modal.css";
import "./subjects.css";

export function SubjectsPage() {
  const { t } = useTranslation("subjects");
  const [params, setParams] = useSearchParams();
  const tab: SubjectsTab = params.get("tab") === "branslar" ? "branslar" : "dersler";
  const setTab = (next: SubjectsTab) =>
    setParams((p) => { const n = new URLSearchParams(p); if (next === "dersler") n.delete("tab"); else n.set("tab", next); return n; }, { replace: true });

  const subjectsQuery = useSubjectsQuery();
  const branchesQuery = useBranchesQuery();
  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const branches = useMemo(() => branchesQuery.data ?? [], [branchesQuery.data]);
  const branchById = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  // Dersler filtre state (yerel)
  const [q, setQ] = useState("");
  const [fBranch, setFBranch] = useState("");
  const [fLevels, setFLevels] = useState<Level[]>([]);
  const [fType, setFType] = useState<SubjectType | "">("");
  const toggleLevel = (l: Level) => setFLevels((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]));
  const clearFilters = () => { setQ(""); setFBranch(""); setFLevels([]); setFType(""); };

  const visibleSubjects = useMemo(
    () => filterSubjects(subjects, { q, branchId: fBranch, levels: fLevels, type: fType }),
    [subjects, q, fBranch, fLevels, fType],
  );

  // Drawer / modal
  const [drawer, setDrawer] = useState<{ subject: Subject | null } | null>(null);
  const [modal, setModal] = useState<{ branch: Branch | null } | null>(null);

  // Mutations
  const saveSubject = useSaveSubject();
  const setSubjectStatus = useSetSubjectStatus();
  const saveBranch = useSaveBranch();
  const setBranchStatus = useSetBranchStatus();
  const deleteBranch = useDeleteBranch();

  const counts = { dersler: subjects.length, branslar: branches.length };
  const hasFilters = q.trim() !== "" || fBranch !== "" || fLevels.length > 0 || fType !== "";

  return (
    <div className="stu aca">
      <PageHeader
        breadcrumb={[{ label: t("breadcrumb.academic") }, { label: t("breadcrumb.subjects") }]}
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          tab === "dersler" ? (
            <button type="button" className="btn btn-primary" onClick={() => setDrawer({ subject: null })}>
              <Plus size={18} strokeWidth={2.2} /> {t("actions.newCourse")}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setModal({ branch: null })}>
              <Plus size={18} strokeWidth={2.2} /> {t("actions.newBranch")}
            </button>
          )
        }
      />

      <SubjectsTabs tab={tab} counts={counts} onChange={setTab} />

      <div className="stu-inner">
        {tab === "dersler" ? (
          <>
            <CoursesToolbar
              search={q} onSearch={setQ}
              branches={branches}
              branchId={fBranch} onBranch={setFBranch}
              levels={fLevels} onToggleLevel={toggleLevel}
              type={fType} onType={setFType}
            />
            <div className="stu-card-wrap">
              {visibleSubjects.length > 0 ? (
                <CoursesTable
                  subjects={visibleSubjects}
                  branchById={branchById}
                  onEdit={(s) => setDrawer({ subject: s })}
                  onToggleStatus={(s) => setSubjectStatus.mutate({ id: s.id, status: s.status === "active" ? "passive" : "active" })}
                />
              ) : subjects.length === 0 ? (
                <EmptyState icon={BookOpen} title={t("courses.emptyTitle")} desc={t("courses.emptyDesc")}
                  action={<button type="button" className="btn btn-primary" onClick={() => setDrawer({ subject: null })}><Plus size={17} strokeWidth={2.2} /> {t("actions.newCourse")}</button>} />
              ) : (
                <EmptyState icon={Search} title={t("courses.noResultTitle")} desc={t("courses.noResultDesc")}
                  action={hasFilters ? <button type="button" className="btn btn-ghost" onClick={clearFilters}>{t("actions.clearFilters")}</button> : undefined} />
              )}
            </div>
          </>
        ) : (
          <div className="stu-card-wrap">
            {branches.length > 0 ? (
              <BranchesTable
                branches={branches}
                subjects={subjects}
                onEdit={(b) => setModal({ branch: b })}
                onToggleStatus={(b) => setBranchStatus.mutate({ id: b.id, status: b.status === "active" ? "passive" : "active" })}
                onDelete={(b) => deleteBranch.mutate(b.id)}
              />
            ) : (
              <EmptyState icon={Briefcase} title={t("branches.emptyTitle")} desc={t("branches.emptyDesc")}
                action={<button type="button" className="btn btn-primary" onClick={() => setModal({ branch: null })}><Plus size={17} strokeWidth={2.2} /> {t("actions.newBranch")}</button>} />
            )}
          </div>
        )}
      </div>

      {drawer && (
        <CourseDrawer
          subject={drawer.subject}
          branches={branches}
          onClose={() => setDrawer(null)}
          onSave={(input, id) => saveSubject.mutate({ id, input })}
        />
      )}
      {modal && (
        <BranchModal
          branch={modal.branch}
          onClose={() => setModal(null)}
          onSave={(input, id) => saveBranch.mutate({ id, input })}
        />
      )}
    </div>
  );
}
```

> **Doğrulama:** `../students/students.css` ve `../../../shared/styles/modal.css` import yolları StudentsPage'deki ile aynı (StudentsPage `import "../../../shared/styles/modal.css"` kullanır; subjects de aynı kökten). `useAuthStore` set'i testte query'yi enabled yapar.

- [ ] **Step 4: index barrel'i yaz**

```ts
// src/portals/admin/subjects/index.ts
export { SubjectsPage } from "./SubjectsPage";
```

- [ ] **Step 5: Testin geçtiğini gör**

Run: `npx vitest run src/portals/admin/subjects/__tests__/SubjectsPage.test.tsx`
Expected: PASS (2 test)

> Eğer `useAuthStore.setState({ user: { schoolId } })` tip hatası verirse, testteki gerçek auth store şeklini `src/shared/store/authStore.ts`'ten doğrula ve `user` objesini tam şekle tamamla (cast `as never` zaten gevşetiyor).

- [ ] **Step 6: Tüm subjects testleri + tip**

Run: `npx vitest run src/portals/admin/subjects && npx tsc --noEmit`
Expected: tüm testler PASS, tsc temiz

- [ ] **Step 7: Commit**

```bash
git add src/portals/admin/subjects/SubjectsPage.tsx src/portals/admin/subjects/index.ts src/portals/admin/subjects/__tests__/SubjectsPage.test.tsx
git commit -m "$(date +%Y-%m-%d) feat,test: SubjectsPage orkestrasyon + sekme/drawer/modal bağlandı.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 15: Route kaydı

**Files:**
- Modify: `src/app/routes.tsx`

`/admin/subjects` route'unu classrooms deseniyle, geçici olarak `CLASS_ROOMS_VIEW` izniyle gate'leyerek ekle (subjects'e özel izin backend'le gelecek — Debt).

- [ ] **Step 1: Import ekle** (diğer portal import'larının yanına, classrooms import'undan sonra)

```ts
// Dersler & Branşlar ekranı (design handoff academics) — /admin/subjects.
// İzin geçici olarak class-rooms.view üzerinden (subjects.* backend'le gelecek — Debt).
import { SubjectsPage } from "../portals/admin/subjects";
```

- [ ] **Step 2: Route node ekle** (classrooms route node'undan hemen sonra, admin children içinde)

```tsx
          // Dersler & Branşlar — geçici olarak `class-rooms.view` ile gate'lenir (Debt).
          {
            Component: () => (
              <RequirePermission permission={PERMISSIONS.CLASS_ROOMS_VIEW} />
            ),
            children: [{ path: "subjects", Component: SubjectsPage }],
          },
```

- [ ] **Step 3: Build doğrula**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/routes.tsx
git commit -m "$(date +%Y-%m-%d) feat: /admin/subjects route eklendi (geçici class-rooms.view gate).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 16: Sidebar — Akademik grubu + Ders Programı/Nöbet taşıma

**Files:**
- Modify: `src/app/layouts/AdminLayout.tsx`

Karar: yeni **Akademik** grubu kurulur; mevcut "Okul" grubundan **Ders Programı** ve **Nöbet Yönetimi** çıkarılıp Akademik'e taşınır. "Görevlendirmeler" pasif (href yok) + "Yakında" badge.

- [ ] **Step 1: İkon import'larına ekle**

`lucide-react` import bloğuna ekle: `BookOpen`, `UserCheck`. (`ShieldCheck`, `Calendar` zaten var.)

```ts
  BookOpen,
  UserCheck,
```

- [ ] **Step 2: "Okul" grubundan iki öğeyi çıkar**

`Okul` grubunun `items` dizisinden şu iki satırı **sil**:

```ts
          { label: "Nöbet Yönetimi", icon: ShieldCheck, href: "/admin/duty-management" },
          { label: "Ders Programı", icon: Calendar, href: "/admin/schedule" },
```

- [ ] **Step 3: "Okul" grubundan sonra "Akademik" grubunu ekle**

`Okul` grup objesinden hemen sonra (yeni grup objesi):

```ts
      {
        label: "Akademik",
        items: [
          { label: "Dersler & Branşlar", icon: BookOpen, href: "/admin/subjects" },
          { label: "Görevlendirmeler", icon: UserCheck, badge: "Yakında" },
          { label: "Ders Programı", icon: Calendar, href: "/admin/schedule" },
          { label: "Nöbet Yönetimi", icon: ShieldCheck, href: "/admin/duty-management" },
        ],
      },
```

> **Doğrulama:** `ShellNavItem` href'siz olunca `NavItem` `static` (tıklanamaz) render eder; `badge` "Yakında" sağda görünür (`portal-config.ts` + `ShellSidebar.tsx` mevcut davranış). Ekstra CSS gerekmez.

- [ ] **Step 4: Build + render doğrula**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS

- [ ] **Step 5: Manuel doğrulama notu** (executor çalıştırır)

`npm run dev` → `/admin/subjects`: Akademik grubunda "Dersler & Branşlar" aktif, "Görevlendirmeler" soluk + "Yakında", "Ders Programı"/"Nöbet Yönetimi" Akademik altında ve çalışır; "Okul" grubunda artık yoklar.

- [ ] **Step 6: Commit**

```bash
git add src/app/layouts/AdminLayout.tsx
git commit -m "$(date +%Y-%m-%d) feat: sidebar Akademik grubu + Dersler & Branşlar; Ders Programı/Nöbet taşındı.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 17: Full doğrulama + modül dokümanı güncelleme

**Files:**
- Modify: `.claude/docs/modules/subjects/completion_status.md` (workspace root: `../oksis/.claude/docs/...`)
- Modify: `.claude/docs/modules/subjects/README.md`
- (Opsiyonel, zaman varsa) `domain-model.md`, `api-contracts.md`, `database-schema.md`, `business-rules.md` — teknik analizden doldur.

- [ ] **Step 1: Tüm testler + lint + build**

Run (oksis-web kökünde):
```bash
npx vitest run src/portals/admin/subjects && npx tsc --noEmit && npm run build
```
Expected: tüm testler PASS, tsc temiz, build başarılı

- [ ] **Step 2: completion_status.md güncelle** (workspace `oksis` repo)

`../oksis/.claude/docs/modules/subjects/completion_status.md` içine:
- İlerleme/`Güncel` tarih = bugün.
- ✅ bölümü: "Web Dersler & Branşlar ekranı (frontend-first) — sekmeli liste, CourseDrawer, BranchModal, filtreler, boş durumlar, mock veri katmanı + Debt mutasyonları."
- ⏳ bölümü: "Backend (Subject/Branch entity + CQRS + endpoint), subjects.* izinleri, gerçek görevlendirme entegrasyonu."
- ⚠️ Spec Dışına Çıkılanlar / Kararlar: tek satır — `2026-06-11 — Görevlendirmeler ekranı spec §5.7 uyarınca yapılmadı (öğretmen-merkezli, Öğretmen detayında); brief'in sınıf-merkezli ekranı kapsam dışı. Onay: kullanıcı. Etki: menüde "Yakında".`
- Debt notu: `Veri katmanı tamamen mock (oturum-ömürlü store); /admin/subjects geçici class-rooms.view ile gate'li.`

- [ ] **Step 3: README.md metadata** — `Last Updated` bugüne çek; ilgili Files checkbox'larını işaretle.

- [ ] **Step 4: Commit** (workspace `oksis` repo — ayrı git)

```bash
cd ../oksis
git add .claude/docs/modules/subjects/
git commit -m "$(date +%Y-%m-%d) docs: subjects modülü — Dersler & Branşlar FE-first teslim + görevlendirme spec kararı işlendi."
cd ../oksis-web
```

> **Not:** Bu commit `oksis` workspace repo'sundadır (ekran kodu `oksis-web` repo'sunda). İki ayrı repo — karıştırma.

---

## Self-Review (writing-plans)

**Spec coverage (tasarım spec'i §2–§11):**
- §2 Kapsam (yalnız Dersler & Branşlar, FE-first, Görevlendirmeler "Yakında") → Task 14/15/16. ✓
- §4 Yerleşim (route, nav Akademik+taşıma, klasör) → Task 15, 16, tüm dosya yapısı. ✓
- §5 Veri modeli (Subject/Branch/BranchStats/SubjectInput/BranchInput) → Task 1. ✓
- §6 Ekran kompozisyonu (PageHeader, tabs, Dersler tablo+toolbar+drawer, Branşlar tablo+modal, boş durumlar) → Task 9–14. ✓
- §7 Veri katmanı (mock store, React Query, Debt toast, tenant keys) → Task 5–7. ✓
- §8 Stil + i18n (students.css reuse + subjects.css port, subjects namespace) → Task 3, 8. ✓
- §9 Test (derive, RowMenu, CourseDrawer, BranchModal, SubjectsPage) → Task 4,10,11,12,14. ✓
- §10 Modül dokümanı → Task 17. ✓
- §11 Kabul kriterleri → Task 15/16/17 doğrulama adımları. ✓

**Placeholder taraması:** "TBD/TODO/sonra" yok. CSS portu (Task 8) ve paylaşılan Dialog/modal sınıf doğrulaması (Task 12) gerçek kaynak dosyalara/grep'e dayanır — placeholder değil, somut talimat.

**Type tutarlılığı:** `Subject/Branch/SubjectInput/BranchInput/Status/SubjectType/Level/BranchStats` Task 1'de tanımlı; tüm sonraki task'lar bu adları kullanıyor. `MockResult<T>` Task 5'te tanımlı, Task 7 tüketiyor. `subjectKeys`/`subjectsApi`/hook adları task'lar arası tutarlı. `RowMenuItem.separatorBefore`, `.key`, `.icon` Task 10'da tanımlı; Task 13 aynı alanları kullanıyor. ✓

**Açıklık:** i18n key'leri Task 3'te tam tanımlı; bileşenler aynı key'leri çağırıyor. İzin gate'i (CLASS_ROOMS_VIEW geçici) net + Debt olarak işaretli.

**Bilinen varsayım (executor doğrular):** `src/shared/styles/modal.css` içinde `.modal-card/.modal-scrim/...` ve `.drawer/.fld/.seg/.chip-pick` sınıflarının varlığı — Task 8 ve Task 12 grep ile doğrulamayı ve eksikse handoff'tan portu açıkça istiyor. `useAuthStore` user şekli — Task 14 Step 5 not düşülü.
