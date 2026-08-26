# Ödev Modülü · Faz A Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ödev modülünün paylaşılan katmanını (core + api sözleşmesi + MSW mock defteri) kurmak ve öğretmen yüzünün üç ekranını (Oluştur, Listem, Detay + Kontrol Izgarası) `Mock Enabled` modunda web ve mobilde uçtan uca gezilebilir hâle getirmek.

**Architecture:** Mock-first domain kalıbı. Ödevin .NET karşılığı yok, bu yüzden wire sözleşmesi `packages/api/src/homework/contract.ts` içinde `generated/schema.ts`'e module augmentation ile enjekte edilir (codegen geldiğinde sapma typecheck'i kırar). MSW handler'ları `packages/api-mocks`'ta yaşar — web ve mobil aynı handler'ı tüketir. Handler'lar mutlu yolu değil sözleşmenin tamamını uygular (durum makinesi, altı hata kodu, role göre alan daraltması); backend yazılırken birincil kaynak budur. Ekranlar tek `/homework` rotasında rol dispatch'iyle ayrışır (not modülünün deseni).

**Tech Stack:** TypeScript strict · Next.js 16 App Router + shadcn/Mira + Tailwind v4 (web) · Expo + React Native + NativeWind v4 (mobil) · TanStack Query · Zod · MSW v2 · Vitest

**Spec:** `docs/superpowers/specs/2026-08-26-odev-modulu-frontend-port-design.md` (bu depoda, `oksis`)

**Çalışma deposu:** `/Users/farukkaya/Repositories/oksis-ui` — plan ve spec `oksis` deposunda, kod `oksis-ui`'de.

**Tasarım kaynağı:** Claude Design projesi `7d876f6c-70ee-4894-bac1-2be5c96dd34a` ("Oksis Layout V2"), `DesignSync` MCP ile okunur.

## Global Constraints

- **Dil:** kod tanımlayıcıları tam İngilizce; yorumlar Türkçe, yalnız tanım noktalarında; kullanıcıya görünen her metin Türkçe.
- **Dosya adları:** kebab-case. Bileşenler PascalCase `[Domain][Type]`. Hook'lar `useX`. Boolean'lar `is/has/can/should`.
- **Katmanlar:** `fetch` yalnız `packages/api`. İş kuralı `packages/core`. View fetch/logic taşımaz. `apps/web` ve `apps/mobile` birbirinden import etmez. `apps/mobile` `packages/ui`'den import etmez.
- **Feature import yüzeyi:** yalnız `index.ts`. Derin import yok.
- **`page.tsx` aptaldır:** tek feature bileşeni render eder, ≤ ~15 satır.
- **`studentNo` STRING'dir** — `"1101"`. Sayıya çevrilmez (baştaki sıfır kaybolur).
- **Tarih:** `toISOString().slice(0,10)` **YASAK**. Yerel bileşenlerden kurulur (`getFullYear`/`getMonth()+1`/`getDate`, sıfır dolgulu).
- **`isOverdue` sunucudan gelir.** İstemci tarih karşılaştırması yapmaz.
- **Kural ekranda değil sunucuda:** ne yapılabileceğini sunucu söyler (`canEdit`, `canMark`, `isReadOnly`). Ekranın uyguladığı ama sözleşmenin bilmediği kural yok sayılır.
- **Zarf:** her uçta `{ data, meta, errors, correlationId }`.
- **Mock path'leri `*/api/v1/...` ile başlar** — mobil mutlak origin eşleşmesi için.
- **`async void`, `Task.Result`, ad-hoc query key yasak.** Query key'ler `qk` üzerinden.
- **Marka kapısı:** her renk/font/radius bir OKSİS marka token'ına veya mevcut semantik token'a çözülmeli. Çözülmeyen değer ihlaldir. Yeni paylaşılan bileşen gerekiyorsa **dur ve onay iste**.
- **Ürün kuralları (ihlal = ekran reddedilir):** puan/not alanı yok · kıyas/sıralama/rozet yok · "Yapılmadı" kırmızı değil · "İşaretlenmedi" olumsuzluk değil · son teslim yalnız TARİH (saat yok) · bildirim üreten aksiyonun onayında etkisi sayıyla yazılır · boş ekran yasak (empty + loading + error) · Taslak ile Yayınla görsel olarak net ayrışır.
- **Commit:** `<type>(<scope>): türkçe açıklama`, scope ∈ {`web`,`mobile`,`core`,`api`,`ui`,`repo`}, sonda nokta yok.
- **Her task sonunda:** `npm run typecheck && npm run lint` (kök `oksis-ui`'de) yeşil olmadan commit yok.

---

## Dosya Yapısı

**Yeni:**

```
packages/core/src/homework/types.ts          domain union'ları + görünüm tipleri
packages/core/src/homework/constants.ts      durum → etiket/ton/ikon, TEK tanım
packages/core/src/homework/logic.ts          gruplama + aile görüntü hâli (saf)
packages/core/src/homework/schemas.ts        zod form şemaları

packages/api/src/homework/contract.ts        wire DTO + path augmentation
packages/api/src/homework/endpoints.ts       12 uç sarmalayıcısı + tel→domain
packages/api/src/homework/queries.ts         TanStack hook'ları + geçersizleme

packages/api-mocks/src/roster/roster-data.ts PAYLAŞILAN öğrenci defteri (terfi)
packages/api-mocks/src/roster/index.ts
packages/api-mocks/src/homework/homework-data.ts      defter + sayaç hesabı
packages/api-mocks/src/homework/homework-handlers.ts  12 handler
packages/api-mocks/src/homework/homework-handlers.test.ts
packages/api-mocks/src/homework/index.ts

apps/web/features/homework/homework-page.tsx            rol dispatch kabuğu
apps/web/features/homework/homework-list-screen.tsx     Ekran 2
apps/web/features/homework/homework-create-dialog.tsx   Ekran 1
apps/web/features/homework/homework-detail-screen.tsx   Ekran 3 (A + B)
apps/web/features/homework/tracking-grid.tsx            Ekran 3 ızgara
apps/web/features/homework/submission-viewer-dialog.tsx Ekran 3 (C)
apps/web/features/homework/homework-dialogs.tsx         Ekran 3 (D) 4 diyalog
apps/web/features/homework/parts.tsx                    çip/rozet/özet şeridi
apps/web/features/homework/use-tracking-writer.ts       optimistic işaretleme
apps/web/features/homework/index.ts
apps/web/mocks/scenarios/homework.ts                    senaryo barı

apps/mobile/src/features/homework/components/homework-tab-screen.tsx
apps/mobile/src/features/homework/components/homework-list-screen.tsx
apps/mobile/src/features/homework/components/homework-create-screen.tsx
apps/mobile/src/features/homework/components/homework-detail-screen.tsx
apps/mobile/src/features/homework/components/tracking-row.tsx
apps/mobile/src/features/homework/components/submission-viewer-screen.tsx
apps/mobile/src/features/homework/components/homework-parts.tsx
apps/mobile/src/features/homework/components/use-tracking-writer.ts
apps/mobile/src/features/homework/index.ts
apps/mobile/src/app/homework/create.tsx
apps/mobile/src/app/homework/[id].tsx
apps/mobile/src/app/homework/submissions.tsx

docs/backend-needs-homework.md               (oksis-ui deposunda)
```

**Değişecek:**

```
packages/core/src/index.ts                       homework export'ları
packages/core/src/nav/nav-config.ts              öğretmen mobil sekmesi isPlanned kaldır
packages/api/src/index.ts                        homework export'ları
packages/api/src/client/query-keys.ts            qk.homework bloğu
packages/api-mocks/src/index.ts                  roster + homework export
packages/api-mocks/src/grade/grade-data.ts       roster defterinden okur
apps/web/mocks/handlers.ts                       homeworkHandlers spread
apps/web/app/(dashboard)/homework/page.tsx       PlannedScreen → HomeworkPage
apps/web/dev/scenario-bar/scenario-registry.ts   /homework kaydı
apps/mobile/src/lib/enable-mocking.ts            homeworkHandlers spread
apps/mobile/src/app/(tabs)/homework.tsx          PlannedScreen → HomeworkTabScreen
```

---

## Task 1: core/homework — tipler ve durum yapılandırması

**Files:**
- Create: `packages/core/src/homework/types.ts`
- Create: `packages/core/src/homework/constants.ts`
- Create: `packages/core/src/homework/constants.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Produces: `HomeworkStatus`, `TrackingStatus`, `HomeworkTargetType`, `HomeworkAttachmentKind`, `HomeworkAuditKind`, `HomeworkCounters`, `HomeworkListItem`, `HomeworkDetail`, `HomeworkAttachment`, `HomeworkTrackingRow`, `HomeworkTracking`, `HomeworkSubmissionFile`, `TRACKING_STATUSES`, `HOMEWORK_STATUSES`, `TRACKING_STATUS_CONFIG`, `HOMEWORK_STATUS_CONFIG`

- [ ] **Step 1: Testi yaz (kırmızı)**

`packages/core/src/homework/constants.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import {
  HOMEWORK_STATUSES,
  HOMEWORK_STATUS_CONFIG,
  TRACKING_STATUSES,
  TRACKING_STATUS_CONFIG,
} from "./constants"

describe("ödev durum yapılandırması", () => {
  it("her takip durumu için etiket, ton ve ikon tanımlıdır", () => {
    for (const status of TRACKING_STATUSES) {
      const config = TRACKING_STATUS_CONFIG[status]
      expect(config.label.length).toBeGreaterThan(0)
      expect(config.tone.length).toBeGreaterThan(0)
      expect(config.icon.length).toBeGreaterThan(0)
    }
  })

  it("her ödev durumu için etiket ve ton tanımlıdır", () => {
    for (const status of HOMEWORK_STATUSES) {
      expect(HOMEWORK_STATUS_CONFIG[status].label.length).toBeGreaterThan(0)
      expect(HOMEWORK_STATUS_CONFIG[status].tone.length).toBeGreaterThan(0)
    }
  })

  // Ürün kuralı: "Yapılmadı" yargılamaz — tehlike kırmızısı yalnız yıkıcı
  // aksiyon onayında meşrudur. Bu test o kuralın bekçisidir.
  it("yapılmadı durumu tehlike tonunu KULLANMAZ", () => {
    expect(TRACKING_STATUS_CONFIG.notDone.tone).not.toBe("danger")
  })

  // Ürün kuralı: "İşaretlenmedi" olumsuzluk değil, "henüz kontrol edilmedi".
  it("işaretlenmedi durumu nötrdür", () => {
    expect(TRACKING_STATUS_CONFIG.unmarked.tone).toBe("neutral")
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `cd /Users/farukkaya/Repositories/oksis-ui && npx vitest run packages/core/src/homework/constants.test.ts`
Beklenen: FAIL — `Cannot find module './constants'`

- [ ] **Step 3: `types.ts`'i yaz**

```ts
// OKSİS Ödev (homework) — domain tipleri.
//
// Kaynak: `oksis/docs/teknik-analizler/Ödev (Homework) Modülü · Teknik Analiz (Faz A).md` §2.
// Backend modülü HENÜZ YOK; wire karşılıkları `packages/api/src/homework/contract.ts`.

/** Ödev yaşam döngüsü. "Süresi Doldu" bir durum DEĞİLDİR — `published && isOverdue` türevidir. */
export const HOMEWORK_STATUSES = ["draft", "published", "closed", "cancelled"] as const
export type HomeworkStatus = (typeof HOMEWORK_STATUSES)[number]

/**
 * Teslim takip kaydının beş hâli. `unmarked` NÖTRDÜR — "henüz kontrol edilmedi"
 * demektir, olumsuzluk değil; hiçbir yüzeyde olumsuz eşlenmez.
 */
export const TRACKING_STATUSES = [
  "unmarked",
  "completed",
  "incomplete",
  "notDone",
  "exempt",
] as const
export type TrackingStatus = (typeof TRACKING_STATUSES)[number]

/** Hedef: şubenin tamamı ya da seçili öğrenciler. Çoklu şube × alt küme Faz A'da kapalı. */
export type HomeworkTargetType = "wholeClass" | "selectedStudents"

export type HomeworkAttachmentKind = "file" | "link"

export type HomeworkAuditKind =
  | "published"
  | "publishedOnBehalf"
  | "updated"
  | "cancelled"
  | "closed"
  | "statusMarked"
  | "bulkCompleted"
  | "exemptSet"
  | "submissionRemovedByAdmin"
  | "recordAddedAfterPublish"

/** Öğretmen eki: dosya ya da bağlantı. Dosya kimliği Files modülünden gelir (yalnız ID). */
export interface HomeworkAttachment {
  id: string
  kind: HomeworkAttachmentKind
  fileId: string | null
  url: string | null
  displayName: string
  /** İnsan diliyle boyut ("240 KB"); bağlantı eklerinde null. */
  sizeLabel: string | null
  sortOrder: number
}

/**
 * Sayaçlar TEK yerden hesaplanır; liste, detay ve pano aynı kaynaktan okur.
 * Yüzde alanı YOKTUR — ekranlar "12/26" gösterir.
 */
export interface HomeworkCounters {
  targetCount: number
  markedCount: number
  completedCount: number
  incompleteCount: number
  notDoneCount: number
  exemptCount: number
  unmarkedCount: number
  /** Yüklemesi olan ÖĞRENCİ sayısı (dosya sayısı değil). */
  submissionStudentCount: number
  /** Sunucu hesaplar; istemci tarih karşılaştırması yapmaz. */
  isOverdue: boolean
  isPendingCheck: boolean
}

export interface HomeworkListItem {
  id: string
  title: string
  classRoomId: string
  classRoomName: string
  subjectId: string
  subjectName: string
  ownerTeacherPersonId: string
  ownerTeacherName: string
  /** YYYY-MM-DD. Saat alanı sözleşmede HİÇ YOK. */
  dueDate: string
  status: HomeworkStatus
  targetType: HomeworkTargetType
  counters: HomeworkCounters
  attachmentCount: number
}

/**
 * Detay. `canEdit`/`canMark`/`isReadOnly` SUNUCUDAN gelir — ekranın kendi
 * başına türettiği yetki kuralı yok sayılır (kural ekranda değil sunucuda).
 */
export interface HomeworkDetail extends HomeworkListItem {
  termId: string
  description: string | null
  attachments: HomeworkAttachment[]
  publishedAt: string | null
  closedAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
  canEdit: boolean
  canMark: boolean
  isReadOnly: boolean
  /** Salt okunurluğun sebebi — bilgi bandının metnini bu belirler. */
  readOnlyReason: "closed" | "cancelled" | "homeroomView" | null
}

/** Öğrencinin kendi satırına yüklediği kanıt. Durumu DEĞİŞTİRMEZ. */
export interface HomeworkSubmissionFile {
  id: string
  fileId: string
  displayName: string
  contentType: string
  uploadedAt: string
  /** "Dün 21:40" gibi hazır etiket — istemci tarih biçimlemesi yapmaz. */
  uploadedAtLabel: string
}

export interface HomeworkTrackingRow {
  studentPersonId: string
  /** STRING kalır ("1101"); sayıya çevrilmez. */
  studentNo: string
  fullName: string
  status: TrackingStatus
  /**
   * Yalnız sahip ve idare görünümünde gelir. Öğrenci ve aile yüzeylerinde alan
   * ŞEMA DIŞIDIR — null bile değil, hiç yoktur.
   */
  exemptReason: string | null
  markedAt: string | null
  /** Şubeye yayından SONRA katılan öğrencinin kaydı (BR-HW-13). */
  addedAfterPublish: boolean
  submissionCount: number
  /** Rehber öğretmen görünümünde BOŞ dizidir — sayı görünür, içerik açılmaz. */
  submissions: HomeworkSubmissionFile[]
}

export interface HomeworkTracking {
  homeworkId: string
  counters: HomeworkCounters
  canMark: boolean
  rows: HomeworkTrackingRow[]
}
```

- [ ] **Step 4: `constants.ts`'i yaz**

```ts
// OKSİS Ödev (homework) — durum → görünüm eşlemesi.
//
// TEK TANIM. Mobil kuralı "hardcoded Türkçe yasak, enum→etiket eşlemesi tek
// dosyada" bunu zorunlu kılar; web de aynı kaynaktan okur.
//
// `tone` semantik bir anahtardır, ham renk DEĞİL — her yüzey kendi token'ına
// çevirir (web'de Tailwind sınıfı, mobilde NativeWind).

import {
  HOMEWORK_STATUSES,
  TRACKING_STATUSES,
  type HomeworkStatus,
  type TrackingStatus,
} from "./types"

export { HOMEWORK_STATUSES, TRACKING_STATUSES }

/** Marka paletindeki semantik yuvalar. `danger` bu modülde YALNIZ iptal onayında meşrudur. */
export type StatusTone = "neutral" | "neutralStrong" | "success" | "warning" | "info" | "muted"

export interface TrackingStatusConfig {
  label: string
  tone: StatusTone
  /** Lucide ikon adı. */
  icon: string
}

/**
 * Beş öğrenci durumu. İki kural görsel olarak buraya kilitlenmiştir:
 *   - `notDone` KIRMIZI DEĞİLDİR (nötr koyu) — öğrenci yargılanmaz.
 *   - `unmarked` NÖTRDÜR — "henüz kontrol edilmedi", olumsuzluk değil.
 */
export const TRACKING_STATUS_CONFIG: Record<TrackingStatus, TrackingStatusConfig> = {
  unmarked: { label: "İşaretlenmedi", tone: "neutral", icon: "circle" },
  completed: { label: "Tamamlandı", tone: "success", icon: "check-circle-2" },
  incomplete: { label: "Eksik", tone: "warning", icon: "circle-slash-2" },
  notDone: { label: "Yapılmadı", tone: "neutralStrong", icon: "x-circle" },
  exempt: { label: "Muaf", tone: "muted", icon: "minus-circle" },
}

export interface HomeworkStatusConfig {
  label: string
  tone: StatusTone
}

/**
 * Ödev durumu çipi. "Süresi Doldu" burada YOK — o bir durum değil,
 * `published && counters.isOverdue` türevi; etiketi `overdueStatusLabel` verir.
 */
export const HOMEWORK_STATUS_CONFIG: Record<HomeworkStatus, HomeworkStatusConfig> = {
  draft: { label: "Taslak", tone: "warning" },
  published: { label: "Yayınlandı", tone: "info" },
  closed: { label: "Kapandı", tone: "success" },
  cancelled: { label: "İptal edildi", tone: "muted" },
}

/** Süresi dolmuş yayınlanmış ödevin çip metni ve tonu. */
export const OVERDUE_STATUS_CONFIG: HomeworkStatusConfig = {
  label: "Süresi Doldu",
  tone: "neutralStrong",
}

/** Izgara altındaki sabit bilgi satırı — öğretmenin "bildirim patlattım mı" endişesini söndürür. */
export const MISSING_DIGEST_NOTICE =
  "Eksik ve Yapılmadı işaretlemeleri velilere akşam günlük özetle iletilir."

/** Yükleme görüntüleyicideki sabit bilgi satırı. */
export const SUBMISSION_NOTICE = "Yükleme durumu değiştirmez — kontrolü siz işaretlersiniz."

/** Yönetici/iptal gerekçelerinin asgari uzunluğu (Not modülünden devralınan kural). */
export const HOMEWORK_REASON_MIN_LENGTH = 15

/** Bir öğrencinin aynı anda tutabileceği aktif yükleme sayısı (BR-HW-16). */
export const MAX_ACTIVE_SUBMISSION_FILES = 5
```

- [ ] **Step 5: Testi çalıştır, yeşil olduğunu gör**

Çalıştır: `npx vitest run packages/core/src/homework/constants.test.ts`
Beklenen: PASS — 4 test

- [ ] **Step 6: `packages/core/src/index.ts`'e export ekle**

Dosyanın domain export blokları arasına, not (grade) domaininin yanına:

```ts
// Ödev (homework) — backend modülü HENÜZ YOK; sözleşme mock-first kurulur.
// "Süresi Doldu" saklanmaz, `published && isOverdue` türevidir.
export * from "./homework/types"
export * from "./homework/constants"
```

- [ ] **Step 7: Typecheck + lint**

Çalıştır: `cd /Users/farukkaya/Repositories/oksis-ui && npm run typecheck && npm run lint`
Beklenen: ikisi de yeşil

- [ ] **Step 8: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add packages/core/src/homework packages/core/src/index.ts
git commit -m "feat(core): ödev domain tipleri ve durum yapılandırması eklendi"
```

---

## Task 2: core/homework — zod şemaları ve saf mantık

**Files:**
- Create: `packages/core/src/homework/schemas.ts`
- Create: `packages/core/src/homework/logic.ts`
- Create: `packages/core/src/homework/logic.test.ts`
- Create: `packages/core/src/homework/schemas.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: Task 1'in `HomeworkListItem`, `TrackingStatus`, `HOMEWORK_REASON_MIN_LENGTH`
- Produces: `homeworkFormSchema`, `HomeworkFormValues`, `cancelReasonSchema`, `exemptReasonSchema`, `todayIsoDate()`, `groupStudentHomework()`, `familyDisplayState()`, `overdueLabel()`

- [ ] **Step 1: `logic.test.ts`'i yaz (kırmızı)**

```ts
import { describe, expect, it } from "vitest"

import { familyDisplayState, groupStudentHomework, todayIsoDate } from "./logic"
import type { HomeworkListItem } from "./types"

function item(over: Partial<HomeworkListItem>): HomeworkListItem {
  return {
    id: "hw-1",
    title: "Ödev",
    classRoomId: "cr-10c",
    classRoomName: "10-C",
    subjectId: "sb-mat",
    subjectName: "Matematik",
    ownerTeacherPersonId: "t-ayse",
    ownerTeacherName: "Ayşe Demir",
    dueDate: "2026-09-18",
    status: "published",
    targetType: "wholeClass",
    attachmentCount: 0,
    counters: {
      targetCount: 26, markedCount: 0, completedCount: 0, incompleteCount: 0,
      notDoneCount: 0, exemptCount: 0, unmarkedCount: 26, submissionStudentCount: 0,
      isOverdue: false, isPendingCheck: false,
    },
    ...over,
  }
}

describe("todayIsoDate", () => {
  // `toISOString().slice(0,10)` +03:00'te gece yarısından sonra ÖNCEKİ günü
  // üretir. Bu test o tuzağa düşülmediğinin bekçisidir.
  it("yerel tarih bileşenlerinden YYYY-MM-DD üretir", () => {
    const d = new Date(2026, 8, 15, 0, 30) // 15 Eylül 2026, 00:30 yerel
    expect(todayIsoDate(d)).toBe("2026-09-15")
  })

  it("tek haneli ay ve günü sıfırla doldurur", () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 12, 0))).toBe("2026-01-05")
  })
})

describe("groupStudentHomework", () => {
  it("süresi dolmamışları 'aktif', dolmuşları 'gecikmiş' grubuna ayırır", () => {
    const active = item({ id: "a" })
    const overdue = item({ id: "b", counters: { ...item({}).counters, isOverdue: true } })
    const closed = item({ id: "c", status: "closed" })

    const groups = groupStudentHomework([active, overdue, closed])

    expect(groups.overdue.map((i) => i.id)).toEqual(["b"])
    expect(groups.active.map((i) => i.id)).toEqual(["a"])
    expect(groups.past.map((i) => i.id)).toEqual(["c"])
  })

  it("iptal edilmiş ödev hiçbir grupta görünmez", () => {
    const groups = groupStudentHomework([item({ id: "x", status: "cancelled" })])
    expect(groups.active).toHaveLength(0)
    expect(groups.overdue).toHaveLength(0)
    expect(groups.past).toHaveLength(0)
  })
})

describe("familyDisplayState", () => {
  // Veli yüzünde "İşaretlenmedi" ham hâliyle gösterilmez: süresi dolmuş bir
  // ödevde bu "henüz kontrol edilmedi" demektir, öğrencinin kusuru değil.
  it("süresi dolmuş ve işaretlenmemişse 'henüz kontrol edilmedi' der", () => {
    expect(familyDisplayState("unmarked", true)).toBe("awaitingCheck")
  })

  it("süresi dolmamış ve işaretlenmemişse 'bekliyor' der", () => {
    expect(familyDisplayState("unmarked", false)).toBe("pending")
  })

  it("işaretlenmiş durumu olduğu gibi taşır", () => {
    expect(familyDisplayState("completed", true)).toBe("completed")
    expect(familyDisplayState("notDone", false)).toBe("notDone")
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npx vitest run packages/core/src/homework/logic.test.ts`
Beklenen: FAIL — `Cannot find module './logic'`

- [ ] **Step 3: `logic.ts`'i yaz**

```ts
// OKSİS Ödev (homework) — saf mantık. React/DOM/fetch YOK.
//
// Buradaki üç fonksiyon SUNUCUNUN YAPMADIĞI türevlerdir. `isOverdue` sunucudan
// gelir; istemci tarih karşılaştırması yapmaz.

import type { HomeworkListItem, TrackingStatus } from "./types"

/**
 * Yerel tarihten `YYYY-MM-DD`.
 *
 * `toISOString().slice(0,10)` YASAK: UTC'ye çevirir ve +03:00'te gece yarısından
 * sonra ÖNCEKİ günü üretir — "son teslim geçmişte" doğrulaması gece yarısı yanlış
 * çalışır. Yerel bileşenlerden kurulur.
 */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export interface StudentHomeworkGroups {
  /** Süresi dolmamış yayınlanmış ödevler. */
  active: HomeworkListItem[]
  /** Süresi dolmuş ama hâlâ açık ödevler. */
  overdue: HomeworkListItem[]
  /** Kapanmış ödevler. */
  past: HomeworkListItem[]
}

/**
 * Öğrenci/veli listesinin gruplanması İSTEMCİDEDİR (sunucu düz liste döner).
 * İptal edilmiş ödev hiçbir grupta görünmez — öğrenciye "iptal edildi" bildirimi
 * gider, listede yer tutmaz.
 */
export function groupStudentHomework(items: HomeworkListItem[]): StudentHomeworkGroups {
  const groups: StudentHomeworkGroups = { active: [], overdue: [], past: [] }
  for (const item of items) {
    if (item.status === "cancelled" || item.status === "draft") continue
    if (item.status === "closed") groups.past.push(item)
    else if (item.counters.isOverdue) groups.overdue.push(item)
    else groups.active.push(item)
  }
  return groups
}

/** Aile/öğrenci yüzeyinde gösterilecek hâl. `awaitingCheck` yalnız burada doğar. */
export type FamilyDisplayState = Exclude<TrackingStatus, "unmarked"> | "pending" | "awaitingCheck"

/**
 * Veli yüzünde ham "İşaretlenmedi" gösterilmez: süresi dolmuş bir ödevde bu
 * ÖĞRETMENİN henüz kontrol etmediği anlamına gelir, öğrencinin kusuru değil.
 */
export function familyDisplayState(
  status: TrackingStatus,
  isOverdue: boolean,
): FamilyDisplayState {
  if (status !== "unmarked") return status
  return isOverdue ? "awaitingCheck" : "pending"
}
```

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu gör**

Çalıştır: `npx vitest run packages/core/src/homework/logic.test.ts`
Beklenen: PASS — 7 test

- [ ] **Step 5: `schemas.test.ts`'i yaz (kırmızı)**

```ts
import { describe, expect, it } from "vitest"

import { cancelReasonSchema, exemptReasonSchema, homeworkFormSchema } from "./schemas"

const valid = {
  classRoomIds: ["cr-9a"],
  subjectId: "sb-mat",
  targetType: "wholeClass" as const,
  title: "Sayfa 42–45 problemler",
  description: "Ders kitabındaki problemleri çözünüz.",
  attachments: [],
  dueDate: "2026-09-18",
}

describe("homeworkFormSchema", () => {
  it("geçerli formu kabul eder", () => {
    expect(homeworkFormSchema.safeParse(valid).success).toBe(true)
  })

  it("boş başlığı reddeder", () => {
    expect(homeworkFormSchema.safeParse({ ...valid, title: "  " }).success).toBe(false)
  })

  it("şube seçilmemişse reddeder", () => {
    expect(homeworkFormSchema.safeParse({ ...valid, classRoomIds: [] }).success).toBe(false)
  })

  it("YYYY-MM-DD olmayan tarihi reddeder", () => {
    expect(homeworkFormSchema.safeParse({ ...valid, dueDate: "18.09.2026" }).success).toBe(false)
  })

  // Faz A'da çoklu şube × seçili öğrenci kombinasyonu KAPALI — ekran da
  // desteklemiyor. Sözleşme bunu istemcide de korur.
  it("çoklu şube ile seçili öğrenci birleşimini reddeder", () => {
    const result = homeworkFormSchema.safeParse({
      ...valid,
      classRoomIds: ["cr-9a", "cr-9b"],
      targetType: "selectedStudents",
      targetStudentIds: ["st-1023"],
    })
    expect(result.success).toBe(false)
  })

  it("tek şube ile seçili öğrenciyi kabul eder", () => {
    const result = homeworkFormSchema.safeParse({
      ...valid,
      targetType: "selectedStudents",
      targetStudentIds: ["st-1023"],
    })
    expect(result.success).toBe(true)
  })

  it("seçili öğrenci modunda boş öğrenci listesini reddeder", () => {
    const result = homeworkFormSchema.safeParse({
      ...valid,
      targetType: "selectedStudents",
      targetStudentIds: [],
    })
    expect(result.success).toBe(false)
  })
})

describe("gerekçe şemaları", () => {
  it("15 karakterden kısa iptal gerekçesini reddeder", () => {
    expect(cancelReasonSchema.safeParse({ reason: "kısa" }).success).toBe(false)
  })

  it("15 karakter ve üzerini kabul eder", () => {
    expect(cancelReasonSchema.safeParse({ reason: "Sınav tarihi değişti" }).success).toBe(true)
  })

  // Muaf gerekçesinde uzunluk şartı YOK — "Raporlu" meşru bir gerekçedir.
  it("muaf gerekçesinde uzunluk şartı aramaz ama boşu reddeder", () => {
    expect(exemptReasonSchema.safeParse({ exemptReason: "Raporlu" }).success).toBe(true)
    expect(exemptReasonSchema.safeParse({ exemptReason: "" }).success).toBe(false)
  })
})
```

- [ ] **Step 6: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npx vitest run packages/core/src/homework/schemas.test.ts`
Beklenen: FAIL — `Cannot find module './schemas'`

- [ ] **Step 7: `schemas.ts`'i yaz**

```ts
// OKSİS Ödev (homework) — zod şemaları.
// Form ve API katmanı AYNI şemayı paylaşır; doğrulama iki yerde tanımlanmaz.

import { z } from "zod"

import { HOMEWORK_REASON_MIN_LENGTH } from "./constants"
import { todayIsoDate } from "./logic"

/** Wire tarih biçimi: YYYY-MM-DD. Saat alanı sözleşmede HİÇ YOK. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG biçiminde olmalıdır.")

const attachmentSchema = z.object({
  kind: z.enum(["file", "link"]),
  fileId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  displayName: z.string().min(1),
})

/**
 * Ödev formu.
 *
 * İki kural `superRefine`'da: son teslim geçmişte olamaz (BR-HW-02) ve çoklu
 * şube × seçili öğrenci kombinasyonu Faz A'da kapalıdır (ekran da desteklemiyor).
 */
export const homeworkFormSchema = z
  .object({
    classRoomIds: z.array(z.string().min(1)).min(1, "En az bir şube seçiniz."),
    subjectId: z.string().min(1),
    targetType: z.enum(["wholeClass", "selectedStudents"]),
    targetStudentIds: z.array(z.string().min(1)).optional(),
    title: z.string().trim().min(1, "Başlık zorunludur.").max(200),
    description: z.string().max(4000).nullable().optional(),
    attachments: z.array(attachmentSchema).default([]),
    dueDate: isoDate,
  })
  .superRefine((values, ctx) => {
    if (values.dueDate < todayIsoDate()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Son teslim tarihi geçmişte olamaz.",
      })
    }
    if (values.targetType === "selectedStudents") {
      if (values.classRoomIds.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetStudentIds"],
          message: "Seçili öğrenci hedefi yalnız tek şubeyle kullanılabilir.",
        })
      }
      if (!values.targetStudentIds || values.targetStudentIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["targetStudentIds"],
          message: "En az bir öğrenci seçiniz.",
        })
      }
    }
  })

export type HomeworkFormValues = z.infer<typeof homeworkFormSchema>

/** İptal ve idari kaldırma gerekçesi — Not modülünden devralınan 15 karakter kuralı. */
export const cancelReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(HOMEWORK_REASON_MIN_LENGTH, `Gerekçe en az ${HOMEWORK_REASON_MIN_LENGTH} karakter olmalıdır.`),
})

/** Muaf gerekçesi zorunludur ama uzunluk şartı yoktur — "Raporlu" meşrudur. */
export const exemptReasonSchema = z.object({
  exemptReason: z.string().trim().min(1, "Muaf gerekçesi zorunludur."),
})
```

- [ ] **Step 8: Testi çalıştır, yeşil olduğunu gör**

Çalıştır: `npx vitest run packages/core/src/homework/`
Beklenen: PASS — 3 dosya, 21 test

- [ ] **Step 9: `packages/core/src/index.ts`'e export ekle**

Task 1'de eklenen bloğu genişlet:

```ts
export * from "./homework/types"
export * from "./homework/constants"
export * from "./homework/logic"
export * from "./homework/schemas"
```

- [ ] **Step 10: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add packages/core/src/homework packages/core/src/index.ts
git commit -m "feat(core): ödev form şemaları ve gruplama mantığı eklendi"
```

---

## Task 3: Paylaşılan öğrenci defteri (roster terfisi)

Ödev fixture'ı 9-A listesine ihtiyaç duyuyor ve o liste `grade-data.ts` içinde
`GRADE_STUDENTS_9A` olarak zaten var. "Bir liste iki yerde tanımlanmaz" (R12)
gereği liste tarafsız bir deftere terfi eder; not modülü oradan okur.

**Files:**
- Create: `packages/api-mocks/src/roster/roster-data.ts`
- Create: `packages/api-mocks/src/roster/roster-data.test.ts`
- Create: `packages/api-mocks/src/roster/index.ts`
- Modify: `packages/api-mocks/src/grade/grade-data.ts:103-135`
- Modify: `packages/api-mocks/src/index.ts`

**Interfaces:**
- Produces: `RosterStudent { personId, studentNo, fullName }`, `ROSTER_9A`, `ROSTER_10C`, `ROSTER_BY_CLASSROOM`, `CLASSROOMS`, `findRoster(classRoomId)`

- [ ] **Step 1: Testi yaz (kırmızı)**

`packages/api-mocks/src/roster/roster-data.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { CLASSROOMS, findRoster, ROSTER_10C, ROSTER_9A } from "./roster-data"

describe("öğrenci defteri", () => {
  it("9-A tasarımdaki 30 öğrenciyi taşır", () => {
    expect(ROSTER_9A).toHaveLength(30)
    expect(ROSTER_9A[0]).toMatchObject({ studentNo: "1023", fullName: "Ada Yılmaz" })
  })

  it("10-C tasarımdaki 26 öğrenciyi taşır", () => {
    expect(ROSTER_10C).toHaveLength(26)
    expect(ROSTER_10C[0]).toMatchObject({ studentNo: "1101", fullName: "Ada Yılmaz" })
  })

  // studentNo id görünümlü STRING'dir. Sayıya çevrilmesi baştaki sıfırı yok eder
  // ve her tüketiciye yalan söyler — bu depoda iki kez yaşandı.
  it("öğrenci numarası string'dir", () => {
    for (const student of [...ROSTER_9A, ...ROSTER_10C]) {
      expect(typeof student.studentNo).toBe("string")
    }
  })

  it("Türkçe karakterli adlar bozulmadan durur", () => {
    const names = ROSTER_9A.map((s) => s.fullName)
    expect(names).toContain("Halil İbrahim Çetin")
    expect(names).toContain("İpek Doğan")
    expect(names).toContain("Şevval Koç")
  })

  it("şube kimliğinden listeye ulaşılır", () => {
    expect(findRoster("cr-10c")).toHaveLength(26)
    expect(findRoster("yok")).toEqual([])
  })

  it("dört şube tanımlıdır ve öğrenci sayıları tasarımla uyuşur", () => {
    expect(CLASSROOMS.map((c) => [c.name, c.studentCount])).toEqual([
      ["9-A", 30],
      ["9-B", 28],
      ["10-C", 26],
      ["11-A", 24],
    ])
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `cd /Users/farukkaya/Repositories/oksis-ui && npx vitest run packages/api-mocks/src/roster/`
Beklenen: FAIL — modül yok

- [ ] **Step 3: `roster-data.ts`'i yaz**

`ROSTER_9A`'nın 30 satırı `grade-data.ts:105-134`'ten **birebir** taşınır
(`id` → `personId`, `studentNo`, `fullName`; `status`/`statusNote` taşınmaz —
onlar not modülüne özgüdür ve orada kalır).

```ts
// OKSİS mock — PAYLAŞILAN öğrenci defteri.
//
// Neden burada: aynı şube listesi hem not hem ödev fixture'ında lazım. İki
// kopya tutmak "bir liste iki yerde tanımlanmaz" kuralını çiğner ve iki mock
// evreninin sessizce ayrışmasına yol açar (aynı öğrenci notta var, ödevde yok).
// `files/file-data.ts` dosya defteri neyse bu da öğrenci defteridir.
//
// Kaynak: Claude Design "Oksis Layout V2" ödev ve not promptlarının örnek veri
// setleri. Değerler DEĞİŞTİRİLMEDEN taşındı — Türkçe karakter testi dâhil.

export interface RosterStudent {
  personId: string
  /** id görünümlü STRING; sayıya çevrilmez. */
  studentNo: string
  fullName: string
}

export interface RosterClassRoom {
  id: string
  name: string
  studentCount: number
}

/** Ayşe Demir'in (Matematik) görevli olduğu şubeler. */
export const CLASSROOMS: RosterClassRoom[] = [
  { id: "cr-9a", name: "9-A", studentCount: 30 },
  { id: "cr-9b", name: "9-B", studentCount: 28 },
  { id: "cr-10c", name: "10-C", studentCount: 26 },
  { id: "cr-11a", name: "11-A", studentCount: 24 },
]

export const ROSTER_9A: RosterStudent[] = [
  { personId: "st-1023", studentNo: "1023", fullName: "Ada Yılmaz" },
  { personId: "st-1024", studentNo: "1024", fullName: "Berk Aydın" },
  { personId: "st-1025", studentNo: "1025", fullName: "Ceren Şahin" },
  { personId: "st-1026", studentNo: "1026", fullName: "Deniz Kaya" },
  { personId: "st-1027", studentNo: "1027", fullName: "Ecrin Öz" },
  { personId: "st-1028", studentNo: "1028", fullName: "Furkan Ateş" },
  { personId: "st-1029", studentNo: "1029", fullName: "Gökçe Uysal" },
  { personId: "st-1030", studentNo: "1030", fullName: "Halil İbrahim Çetin" },
  { personId: "st-1031", studentNo: "1031", fullName: "Irmak Güneş" },
  { personId: "st-1032", studentNo: "1032", fullName: "İpek Doğan" },
  { personId: "st-1033", studentNo: "1033", fullName: "Jülide Kara" },
  { personId: "st-1034", studentNo: "1034", fullName: "Kaan Erdoğan" },
  { personId: "st-1035", studentNo: "1035", fullName: "Leyla Toprak" },
  { personId: "st-1036", studentNo: "1036", fullName: "Mert Bozkurt" },
  { personId: "st-1037", studentNo: "1037", fullName: "Nehir Aksoy" },
  { personId: "st-1038", studentNo: "1038", fullName: "Onur Şimşek" },
  { personId: "st-1039", studentNo: "1039", fullName: "Öykü Balcı" },
  { personId: "st-1040", studentNo: "1040", fullName: "Poyraz Yıldırım" },
  { personId: "st-1041", studentNo: "1041", fullName: "Rüya Çelik" },
  { personId: "st-1042", studentNo: "1042", fullName: "Selin Arslan" },
  { personId: "st-1043", studentNo: "1043", fullName: "Şevval Koç" },
  { personId: "st-1044", studentNo: "1044", fullName: "Taner Yavuz" },
  { personId: "st-1045", studentNo: "1045", fullName: "Ufuk Demirci" },
  { personId: "st-1046", studentNo: "1046", fullName: "Ümit Sarı" },
  { personId: "st-1047", studentNo: "1047", fullName: "Vera Aydemir" },
  { personId: "st-1048", studentNo: "1048", fullName: "Yağmur Polat" },
  { personId: "st-1049", studentNo: "1049", fullName: "Zeynep Özdemir" },
  { personId: "st-1050", studentNo: "1050", fullName: "Ahmet Efe Kurt" },
  { personId: "st-1051", studentNo: "1051", fullName: "Bilge Naz Şen" },
  { personId: "st-1052", studentNo: "1052", fullName: "Cem Karahan" },
]

/**
 * 10-C — ödev modülünün ana örnek şubesi (26 öğrenci). İlk on satır tasarım
 * promptunda birebir verilmiştir; kalan on altısı aynı ad havuzundan sürdürüldü.
 */
export const ROSTER_10C: RosterStudent[] = [
  { personId: "st-1101", studentNo: "1101", fullName: "Ada Yılmaz" },
  { personId: "st-1102", studentNo: "1102", fullName: "Berk Aydın" },
  { personId: "st-1103", studentNo: "1103", fullName: "Ceren Şahin" },
  { personId: "st-1104", studentNo: "1104", fullName: "Deniz Kaya" },
  { personId: "st-1105", studentNo: "1105", fullName: "Ecrin Öz" },
  { personId: "st-1106", studentNo: "1106", fullName: "Furkan Ateş" },
  { personId: "st-1107", studentNo: "1107", fullName: "Gökçe Uysal" },
  { personId: "st-1108", studentNo: "1108", fullName: "Halil İbrahim Çetin" },
  { personId: "st-1109", studentNo: "1109", fullName: "Irmak Güneş" },
  { personId: "st-1110", studentNo: "1110", fullName: "İpek Doğan" },
  { personId: "st-1111", studentNo: "1111", fullName: "Jülide Kara" },
  { personId: "st-1112", studentNo: "1112", fullName: "Kaan Erdoğan" },
  { personId: "st-1113", studentNo: "1113", fullName: "Leyla Toprak" },
  { personId: "st-1114", studentNo: "1114", fullName: "Mert Bozkurt" },
  { personId: "st-1115", studentNo: "1115", fullName: "Nehir Aksoy" },
  { personId: "st-1116", studentNo: "1116", fullName: "Onur Şimşek" },
  { personId: "st-1117", studentNo: "1117", fullName: "Öykü Balcı" },
  { personId: "st-1118", studentNo: "1118", fullName: "Poyraz Yıldırım" },
  { personId: "st-1119", studentNo: "1119", fullName: "Rüya Çelik" },
  { personId: "st-1120", studentNo: "1120", fullName: "Selin Arslan" },
  { personId: "st-1121", studentNo: "1121", fullName: "Şevval Koç" },
  { personId: "st-1122", studentNo: "1122", fullName: "Taner Yavuz" },
  { personId: "st-1123", studentNo: "1123", fullName: "Ufuk Demirci" },
  { personId: "st-1124", studentNo: "1124", fullName: "Ümit Sarı" },
  { personId: "st-1125", studentNo: "1125", fullName: "Vera Aydemir" },
  { personId: "st-1126", studentNo: "1126", fullName: "Yağmur Polat" },
]

export const ROSTER_BY_CLASSROOM: Record<string, RosterStudent[]> = {
  "cr-9a": ROSTER_9A,
  "cr-10c": ROSTER_10C,
}

/** Tanımlı listesi olmayan şube BOŞ döner — mock uydurmaz. */
export function findRoster(classRoomId: string): RosterStudent[] {
  return ROSTER_BY_CLASSROOM[classRoomId] ?? []
}
```

- [ ] **Step 4: `packages/api-mocks/src/roster/index.ts`'i yaz**

```ts
export * from "./roster-data"
```

- [ ] **Step 5: Testi çalıştır, yeşil olduğunu gör**

Çalıştır: `npx vitest run packages/api-mocks/src/roster/`
Beklenen: PASS — 6 test

- [ ] **Step 6: `grade-data.ts`'i deftere bağla**

`packages/api-mocks/src/grade/grade-data.ts:103-135` aralığındaki elle yazılmış
30 satırlık dizi **silinir** ve yerine defterden türetme konur. Not modülüne
özgü alanlar (`status`, `statusNote`) burada kalır:

```ts
import { ROSTER_9A } from "../roster"

/**
 * 9-A listesi — PAYLAŞILAN öğrenci defterinden türetilir (`../roster`).
 * Nakil giden öğrenci not modülüne özgü bir hâldir, defterde değil burada
 * yaşar: aynı öğrenci ödev evreninde nakil değildir.
 */
const GRADE_STUDENT_STATUS: Record<string, { status: string; statusNote: string }> = {
  "1040": { status: "transferred", statusNote: "nakil gitti" },
}

export const GRADE_STUDENTS_9A: Array<
  Pick<GradeEntryDto, "id" | "studentNo" | "fullName" | "status" | "statusNote">
> = ROSTER_9A.map((student) => ({
  id: student.personId,
  studentNo: student.studentNo,
  fullName: student.fullName,
  status: GRADE_STUDENT_STATUS[student.studentNo]?.status ?? null,
  statusNote: GRADE_STUDENT_STATUS[student.studentNo]?.statusNote ?? null,
}))
```

- [ ] **Step 7: Not modülünün testlerinin hâlâ yeşil olduğunu doğrula**

Çalıştır: `npx vitest run packages/api-mocks/src/`
Beklenen: PASS — grade, announcements, files ve roster testlerinin tamamı. Bir
tanesi bile kırmızıysa terfi hatalıdır; devam etme.

- [ ] **Step 8: `packages/api-mocks/src/index.ts`'e export ekle**

Dosyanın başındaki açıklama bloğundan sonra, `attendance` export'undan önce:

```ts
// Paylaşılan öğrenci defteri: not ve ödev fixture'ları AYNI şubeleri ve AYNI
// öğrencileri kullanır. Domain'e ait değildir, bu yüzden domain klasörlerinin
// hiçbirinde yaşamaz (bkz. files/file-data.ts — dosya defteri aynı gerekçeyle).
export * from "./roster"
```

- [ ] **Step 9: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add packages/api-mocks/src/roster packages/api-mocks/src/grade/grade-data.ts packages/api-mocks/src/index.ts
git commit -m "refactor(api): mock öğrenci listesi paylaşılan deftere taşındı"
```

---

## Task 4: api/homework — wire sözleşmesi ve query key'leri

**Files:**
- Create: `packages/api/src/homework/contract.ts`
- Modify: `packages/api/src/client/query-keys.ts:203` (grade bloğundan sonra)

**Interfaces:**
- Produces: `HomeworkStatusDto`, `TrackingStatusDto`, `HomeworkAttachmentDto`, `HomeworkCountersDto`, `HomeworkListItemDto`, `HomeworkDetailDto`, `HomeworkSubmissionFileDto`, `HomeworkTrackingRowDto`, `HomeworkTrackingDto`, `CreateHomeworkBody`, `UpdateHomeworkBody`, `CancelHomeworkBody`, `MarkTrackingBody`, `CreateHomeworkResultDto`, `qk.homework.*`

- [ ] **Step 1: `contract.ts`'i yaz**

Faz A'nın on iki ucu enjekte edilir. Ekleme/çıkarma yok — Faz B ve C kendi
uçlarını ekler.

```ts
// OKSİS Ödev (homework) — wire sözleşmesi.
//
// Backend modülü HENÜZ YOK: `src/Oksis.Application/Modules/Homework/` altında
// yalnız README var, 0 entity. Bu yüzden path'ler ve DTO'lar burada TANIMLANIR
// ve `generated/schema.ts`'e module augmentation ile enjekte edilir.
//
// Bu BİLİNÇLİ bir drift bekçisidir: backend yayınlanıp `npm run codegen`
// çalıştığında gerçek şema bu bloğun yerini alır ve aradaki her fark
// typecheck'i KIRAR. Emsal: yoklama ve not modüllerinin mock-first dönemi.
//
// Sözleşmenin çalışan tarifi `packages/api-mocks/src/homework/`'tedir; backend
// yazılırken birincil kaynak orasıdır.

// ═══════════ Enum'lar — wire'da hepsi STRING ═══════════

export type HomeworkStatusDto = "draft" | "published" | "closed" | "cancelled"
export type TrackingStatusDto = "unmarked" | "completed" | "incomplete" | "notDone" | "exempt"
export type HomeworkTargetTypeDto = "wholeClass" | "selectedStudents"
export type HomeworkAttachmentKindDto = "file" | "link"

// ═══════════ DTO'lar ═══════════

export interface HomeworkAttachmentDto {
  id: string
  kind: HomeworkAttachmentKindDto
  fileId: string | null
  url: string | null
  displayName: string
  sizeLabel: string | null
  sortOrder: number
}

/** Sunucu-hesaplı sayaçlar. Yüzde alanı yok; `isOverdue` istemcide türetilmez. */
export interface HomeworkCountersDto {
  targetCount: number
  markedCount: number
  completedCount: number
  incompleteCount: number
  notDoneCount: number
  exemptCount: number
  unmarkedCount: number
  submissionStudentCount: number
  isOverdue: boolean
  isPendingCheck: boolean
}

export interface HomeworkListItemDto {
  id: string
  title: string
  classRoomId: string
  classRoomName: string
  subjectId: string
  subjectName: string
  ownerTeacherPersonId: string
  ownerTeacherName: string
  dueDate: string
  status: HomeworkStatusDto
  targetType: HomeworkTargetTypeDto
  counters: HomeworkCountersDto
  attachmentCount: number
}

/**
 * Detay. Yetki alanları SUNUCUDAN gelir — ekran kendi başına "bu rol
 * işaretleyebilir mi" hesabı yapmaz.
 */
export interface HomeworkDetailDto extends HomeworkListItemDto {
  termId: string
  description: string | null
  attachments: HomeworkAttachmentDto[]
  publishedAt: string | null
  closedAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
  canEdit: boolean
  canMark: boolean
  isReadOnly: boolean
  readOnlyReason: "closed" | "cancelled" | "homeroomView" | null
}

export interface HomeworkSubmissionFileDto {
  id: string
  fileId: string
  displayName: string
  contentType: string
  uploadedAt: string
  uploadedAtLabel: string
}

/**
 * Takip satırı.
 *
 * `exemptReason` YALNIZ sahip ve idare görünümünde serileştirilir. Öğrenci ve
 * aile uçlarında alan ŞEMA DIŞIDIR — `null` bile değil, hiç yoktur. Bu yüzden
 * opsiyoneldir; Faz B'de öğrenci/aile DTO'ları bu alanı taşımayan AYRI tiplerdir.
 */
export interface HomeworkTrackingRowDto {
  studentPersonId: string
  studentNo: string
  fullName: string
  status: TrackingStatusDto
  exemptReason?: string | null
  markedAt: string | null
  addedAfterPublish: boolean
  submissionCount: number
  /** Rehber öğretmen görünümünde BOŞ dizidir — sayı görünür, içerik açılmaz. */
  submissions: HomeworkSubmissionFileDto[]
}

export interface HomeworkTrackingDto {
  homeworkId: string
  counters: HomeworkCountersDto
  canMark: boolean
  rows: HomeworkTrackingRowDto[]
}

// ═══════════ İstek gövdeleri ═══════════

export interface HomeworkAttachmentInput {
  kind: HomeworkAttachmentKindDto
  fileId?: string | null
  url?: string | null
  displayName: string
}

export interface CreateHomeworkBody {
  classRoomIds: string[]
  subjectId: string
  targetType: HomeworkTargetTypeDto
  targetStudentIds?: string[]
  title: string
  description?: string | null
  attachments?: HomeworkAttachmentInput[]
  dueDate: string
}

export interface UpdateHomeworkBody {
  title: string
  description?: string | null
  attachments?: HomeworkAttachmentInput[]
  dueDate: string
  targetType: HomeworkTargetTypeDto
  targetStudentIds?: string[]
}

export interface CancelHomeworkBody {
  reason: string
}

export interface MarkTrackingBody {
  status: TrackingStatusDto
  exemptReason?: string
}

/** Çoklu şube yayınında şube başına BİR kayıt doğar; yanıt hepsinin kimliğidir. */
export interface CreateHomeworkResultDto {
  ids: string[]
}

export interface BulkCompleteResultDto {
  markedCount: number
}

// ═══════════ Path enjeksiyonu (mock-first drift bekçisi) ═══════════

type Envelope<T> = {
  data: T
  meta: null
  errors: null
  correlationId: string
}

type JsonResponse<T> = { content: { "application/json": Envelope<T> } }

declare module "../generated/schema" {
  interface paths {
    "/api/v1/homework": {
      get: {
        parameters: {
          query?: {
            termId?: string
            classRoomId?: string
            status?: HomeworkStatusDto
          }
        }
        responses: { 200: JsonResponse<HomeworkListItemDto[]> }
      }
      post: {
        requestBody: { content: { "application/json": CreateHomeworkBody } }
        responses: { 201: JsonResponse<CreateHomeworkResultDto> }
      }
    }
    "/api/v1/homework/mine": {
      get: {
        parameters: {
          query?: { termId?: string; classRoomId?: string; status?: HomeworkStatusDto }
        }
        responses: { 200: JsonResponse<HomeworkListItemDto[]> }
      }
    }
    "/api/v1/homework/homeroom": {
      get: {
        parameters: { query?: { termId?: string } }
        responses: { 200: JsonResponse<HomeworkListItemDto[]> }
      }
    }
    "/api/v1/homework/{id}": {
      get: {
        parameters: { path: { id: string } }
        responses: { 200: JsonResponse<HomeworkDetailDto> }
      }
      put: {
        parameters: { path: { id: string } }
        requestBody: { content: { "application/json": UpdateHomeworkBody } }
        responses: { 200: JsonResponse<HomeworkDetailDto> }
      }
      delete: {
        parameters: { path: { id: string } }
        responses: { 204: { content: never } }
      }
    }
    "/api/v1/homework/{id}:publish": {
      post: {
        parameters: { path: { id: string } }
        responses: { 200: JsonResponse<HomeworkDetailDto> }
      }
    }
    "/api/v1/homework/{id}:cancel": {
      post: {
        parameters: { path: { id: string } }
        requestBody: { content: { "application/json": CancelHomeworkBody } }
        responses: { 200: JsonResponse<HomeworkDetailDto> }
      }
    }
    "/api/v1/homework/{id}:close": {
      post: {
        parameters: { path: { id: string } }
        responses: { 200: JsonResponse<HomeworkDetailDto> }
      }
    }
    "/api/v1/homework/{id}/tracking": {
      get: {
        parameters: { path: { id: string } }
        responses: { 200: JsonResponse<HomeworkTrackingDto> }
      }
    }
    "/api/v1/homework/{id}/tracking/{studentId}": {
      put: {
        parameters: { path: { id: string; studentId: string } }
        requestBody: { content: { "application/json": MarkTrackingBody } }
        responses: { 200: JsonResponse<HomeworkTrackingRowDto> }
      }
    }
    "/api/v1/homework/{id}/tracking:bulk-complete": {
      post: {
        parameters: { path: { id: string } }
        responses: { 200: JsonResponse<BulkCompleteResultDto> }
      }
    }
  }
}
```

- [ ] **Step 2: `query-keys.ts`'e `homework` bloğunu ekle**

`packages/api/src/client/query-keys.ts` içinde `grade` bloğunun (satır 186-203)
hemen ardına:

```ts
  homework: {
    all: () => ["homework"] as const,
    /** Öğretmenin kendi ödevleri; filtre nesnesi anahtarın parçasıdır. */
    mine: (termId: string | null, filters: Record<string, unknown>) =>
      ["homework", "mine", termId, filters] as const,
    /** Rehber öğretmenin salt-okunur listesi. */
    homeroom: (termId: string | null) => ["homework", "homeroom", termId] as const,
    item: (id: string | null) => ["homework", "item", id] as const,
    tracking: (id: string | null) => ["homework", "tracking", id] as const,
  },
```

- [ ] **Step 3: Typecheck**

Çalıştır: `cd /Users/farukkaya/Repositories/oksis-ui && npm run typecheck`
Beklenen: yeşil. Augmentation'ın tutmadığı durumda `paths` genişlemez ve
Task 5'teki `getClient().GET("/api/v1/homework/mine")` çağrısı tip hatası verir —
bu bekçinin çalıştığının kanıtıdır.

- [ ] **Step 4: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add packages/api/src/homework/contract.ts packages/api/src/client/query-keys.ts
git commit -m "feat(api): ödev wire sözleşmesi ve query anahtarları eklendi"
```

---

## Task 5: api/homework — uç sarmalayıcıları

**Files:**
- Create: `packages/api/src/homework/endpoints.ts`
- Modify: `packages/api/src/index.ts`

**Interfaces:**
- Consumes: Task 1'in domain tipleri, Task 4'ün DTO'ları
- Produces: `getMyHomework()`, `getHomeroomHomework()`, `getHomework()`, `createHomework()`, `updateHomework()`, `deleteHomeworkDraft()`, `publishHomework()`, `cancelHomework()`, `closeHomework()`, `getHomeworkTracking()`, `markTrackingStatus()`, `bulkCompleteRemaining()`

- [ ] **Step 1: `endpoints.ts`'i yaz**

```ts
// OKSİS Ödev (homework) — HTTP uçları.
// Backend modülü henüz yok; path'ler `./contract.ts` içindeki module
// augmentation ile enjekte ediliyor. MSW handler'ları `@workspace/api-mocks`
// üzerinden dev modunda yanıt veriyor.
//
// Tel→görünüm eşlemesi BURADA yapılır, çağrı yerinde değil.

import type {
  HomeworkAttachment,
  HomeworkCounters,
  HomeworkDetail,
  HomeworkListItem,
  HomeworkStatus,
  HomeworkTracking,
  HomeworkTrackingRow,
  TrackingStatus,
} from "@workspace/core"
import { HOMEWORK_STATUSES, TRACKING_STATUSES } from "@workspace/core"

import { getClient } from "../client/client"
import { unwrap } from "../client/request"
import type {
  CancelHomeworkBody,
  CreateHomeworkBody,
  CreateHomeworkResultDto,
  BulkCompleteResultDto,
  HomeworkAttachmentDto,
  HomeworkCountersDto,
  HomeworkDetailDto,
  HomeworkListItemDto,
  HomeworkTrackingDto,
  HomeworkTrackingRowDto,
  MarkTrackingBody,
  UpdateHomeworkBody,
} from "./contract"

export type * from "./contract"

// ═══════════ Tel → domain eşlemesi ═══════════

/** Tanınmayan durum "draft" sayılır — bilinmeyen bir hâli yayınlanmış göstermek yanlıştır. */
function toHomeworkStatus(tel: string): HomeworkStatus {
  return (HOMEWORK_STATUSES as readonly string[]).includes(tel)
    ? (tel as HomeworkStatus)
    : "draft"
}

/** Tanınmayan takip durumu "unmarked" sayılır — nötr hâl güvenli varsayılandır. */
function toTrackingStatus(tel: string): TrackingStatus {
  return (TRACKING_STATUSES as readonly string[]).includes(tel)
    ? (tel as TrackingStatus)
    : "unmarked"
}

/**
 * .NET'in OpenAPI çıktısı `int32` alanları `number | string` olarak yayıyor
 * (bu depoda genel durum). Sayaçlar daraltılır.
 */
function num(value: number | string | null | undefined): number {
  return Number(value) || 0
}

function toCounters(d: HomeworkCountersDto): HomeworkCounters {
  return {
    targetCount: num(d.targetCount),
    markedCount: num(d.markedCount),
    completedCount: num(d.completedCount),
    incompleteCount: num(d.incompleteCount),
    notDoneCount: num(d.notDoneCount),
    exemptCount: num(d.exemptCount),
    unmarkedCount: num(d.unmarkedCount),
    submissionStudentCount: num(d.submissionStudentCount),
    isOverdue: Boolean(d.isOverdue),
    isPendingCheck: Boolean(d.isPendingCheck),
  }
}

function toAttachment(d: HomeworkAttachmentDto): HomeworkAttachment {
  return {
    id: d.id,
    kind: d.kind,
    fileId: d.fileId,
    url: d.url,
    displayName: d.displayName,
    sizeLabel: d.sizeLabel,
    sortOrder: num(d.sortOrder),
  }
}

function toListItem(d: HomeworkListItemDto): HomeworkListItem {
  return {
    id: d.id,
    title: d.title,
    classRoomId: d.classRoomId,
    classRoomName: d.classRoomName,
    subjectId: d.subjectId,
    subjectName: d.subjectName,
    ownerTeacherPersonId: d.ownerTeacherPersonId,
    ownerTeacherName: d.ownerTeacherName,
    dueDate: d.dueDate,
    status: toHomeworkStatus(d.status),
    targetType: d.targetType,
    counters: toCounters(d.counters),
    attachmentCount: num(d.attachmentCount),
  }
}

function toDetail(d: HomeworkDetailDto): HomeworkDetail {
  return {
    ...toListItem(d),
    termId: d.termId,
    description: d.description,
    attachments: (d.attachments ?? []).map(toAttachment),
    publishedAt: d.publishedAt,
    closedAt: d.closedAt,
    cancelledAt: d.cancelledAt,
    cancelReason: d.cancelReason,
    canEdit: Boolean(d.canEdit),
    canMark: Boolean(d.canMark),
    isReadOnly: Boolean(d.isReadOnly),
    readOnlyReason: d.readOnlyReason,
  }
}

function toTrackingRow(d: HomeworkTrackingRowDto): HomeworkTrackingRow {
  return {
    studentPersonId: d.studentPersonId,
    studentNo: d.studentNo,
    fullName: d.fullName,
    status: toTrackingStatus(d.status),
    // Alan yoksa (öğrenci/aile görünümü) null'a düşer; ekran gerekçeyi göstermez.
    exemptReason: d.exemptReason ?? null,
    markedAt: d.markedAt,
    addedAfterPublish: Boolean(d.addedAfterPublish),
    submissionCount: num(d.submissionCount),
    submissions: d.submissions ?? [],
  }
}

function toTracking(d: HomeworkTrackingDto): HomeworkTracking {
  return {
    homeworkId: d.homeworkId,
    counters: toCounters(d.counters),
    canMark: Boolean(d.canMark),
    rows: (d.rows ?? []).map(toTrackingRow),
  }
}

// ═══════════ Okuma ═══════════

export interface MyHomeworkFilters {
  termId?: string
  classRoomId?: string
  status?: HomeworkStatus
}

export async function getMyHomework(filters: MyHomeworkFilters = {}): Promise<HomeworkListItem[]> {
  const items = await unwrap<HomeworkListItemDto[]>(
    await getClient().GET("/api/v1/homework/mine", { params: { query: filters } }),
  )
  return (items ?? []).map(toListItem)
}

/** Rehber öğretmenin salt-okunur listesi; yükleme içeriği taşımaz. */
export async function getHomeroomHomework(termId?: string): Promise<HomeworkListItem[]> {
  const items = await unwrap<HomeworkListItemDto[]>(
    await getClient().GET("/api/v1/homework/homeroom", { params: { query: { termId } } }),
  )
  return (items ?? []).map(toListItem)
}

export async function getHomework(id: string): Promise<HomeworkDetail> {
  return toDetail(
    await unwrap<HomeworkDetailDto>(
      await getClient().GET("/api/v1/homework/{id}", { params: { path: { id } } }),
    ),
  )
}

export async function getHomeworkTracking(id: string): Promise<HomeworkTracking> {
  return toTracking(
    await unwrap<HomeworkTrackingDto>(
      await getClient().GET("/api/v1/homework/{id}/tracking", { params: { path: { id } } }),
    ),
  )
}

// ═══════════ Yazma ═══════════

/** Çoklu şube: şube başına BİR kayıt doğar, yanıt hepsinin kimliğidir. */
export async function createHomework(body: CreateHomeworkBody): Promise<string[]> {
  const result = await unwrap<CreateHomeworkResultDto>(
    await getClient().POST("/api/v1/homework", { body }),
  )
  return result?.ids ?? []
}

export async function updateHomework(id: string, body: UpdateHomeworkBody): Promise<HomeworkDetail> {
  return toDetail(
    await unwrap<HomeworkDetailDto>(
      await getClient().PUT("/api/v1/homework/{id}", { params: { path: { id } }, body }),
    ),
  )
}

/** Yalnız taslak silinir ve SESSİZDİR — bildirim üretmez. */
export async function deleteHomeworkDraft(id: string): Promise<void> {
  await unwrap<void>(
    await getClient().DELETE("/api/v1/homework/{id}", { params: { path: { id } } }),
  )
}

/** Yayın GERİ ALINAMAZ. Hedef bu anda materialize edilir. */
export async function publishHomework(id: string): Promise<HomeworkDetail> {
  return toDetail(
    await unwrap<HomeworkDetailDto>(
      await getClient().POST("/api/v1/homework/{id}:publish", { params: { path: { id } } }),
    ),
  )
}

export async function cancelHomework(id: string, body: CancelHomeworkBody): Promise<HomeworkDetail> {
  return toDetail(
    await unwrap<HomeworkDetailDto>(
      await getClient().POST("/api/v1/homework/{id}:cancel", { params: { path: { id } }, body }),
    ),
  )
}

export async function closeHomework(id: string): Promise<HomeworkDetail> {
  return toDetail(
    await unwrap<HomeworkDetailDto>(
      await getClient().POST("/api/v1/homework/{id}:close", { params: { path: { id } } }),
    ),
  )
}

export async function markTrackingStatus(
  id: string,
  studentId: string,
  body: MarkTrackingBody,
): Promise<HomeworkTrackingRow> {
  return toTrackingRow(
    await unwrap<HomeworkTrackingRowDto>(
      await getClient().PUT("/api/v1/homework/{id}/tracking/{studentId}", {
        params: { path: { id, studentId } },
        body,
      }),
    ),
  )
}

/** Yalnız `unmarked` satırları etkiler; audit'e TEK özet satır yazılır. */
export async function bulkCompleteRemaining(id: string): Promise<number> {
  const result = await unwrap<BulkCompleteResultDto>(
    await getClient().POST("/api/v1/homework/{id}/tracking:bulk-complete", {
      params: { path: { id } },
    }),
  )
  return num(result?.markedCount)
}
```

- [ ] **Step 2: `packages/api/src/index.ts`'e export ekle**

`grade` export'larının yanına:

```ts
// Ödev (homework) — backend modülü HENÜZ YOK; sözleşme `homework/contract.ts`
// içinde enjekte ediliyor, karşılığı `@workspace/api-mocks`.
export * from "./homework/endpoints"
export * from "./homework/queries"
```

> `queries` satırı Task 6'da yazılacak dosyayı işaret eder; bu task'ta yalnız
> `endpoints` satırını ekle, `queries` satırını Task 6'da ekle.

- [ ] **Step 3: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add packages/api/src/homework/endpoints.ts packages/api/src/index.ts
git commit -m "feat(api): ödev uç sarmalayıcıları eklendi"
```

---

## Task 6: api/homework — TanStack Query hook'ları

**Files:**
- Create: `packages/api/src/homework/queries.ts`
- Modify: `packages/api/src/index.ts`

**Interfaces:**
- Consumes: Task 5'in uç fonksiyonları, Task 4'ün `qk.homework`
- Produces: `useMyHomework()`, `useHomeroomHomework()`, `useHomework()`, `useHomeworkTracking()`, `useCreateHomework()`, `useUpdateHomework()`, `useDeleteHomeworkDraft()`, `usePublishHomework()`, `useCancelHomework()`, `useCloseHomework()`, `useMarkTracking()`, `useBulkCompleteRemaining()`

- [ ] **Step 1: `queries.ts`'i yaz**

```ts
// OKSİS Ödev (homework) — TanStack Query hook'ları.
// Ekranların durum matrisi (loading/empty/error/readonly) bu hook'ların GERÇEK
// durumundan okunur — yerel mock bayrağından değil.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { HomeworkStatus, TrackingStatus } from "@workspace/core"

import { qk } from "../client/query-keys"
import type { CancelHomeworkBody, CreateHomeworkBody, UpdateHomeworkBody } from "./contract"
import {
  bulkCompleteRemaining,
  cancelHomework,
  closeHomework,
  createHomework,
  deleteHomeworkDraft,
  getHomeroomHomework,
  getHomework,
  getHomeworkTracking,
  getMyHomework,
  markTrackingStatus,
  publishHomework,
  updateHomework,
  type MyHomeworkFilters,
} from "./endpoints"

// ═══════════ Okuma ═══════════

export function useMyHomework(filters: MyHomeworkFilters = {}) {
  return useQuery({
    queryKey: qk.homework.mine(filters.termId ?? null, filters),
    queryFn: () => getMyHomework(filters),
  })
}

export function useHomeroomHomework(termId?: string) {
  return useQuery({
    queryKey: qk.homework.homeroom(termId ?? null),
    queryFn: () => getHomeroomHomework(termId),
  })
}

export function useHomework(id: string | null) {
  return useQuery({
    queryKey: qk.homework.item(id),
    queryFn: () => getHomework(id!),
    enabled: Boolean(id),
  })
}

/**
 * Kontrol ızgarasının verisi.
 *
 * Öğrencinin yüklemesi öğretmenin ızgarasını CANLI tetiklemez (canlı kanal
 * açılmaz) — pencereye dönüldüğünde tazelenir. İndirme URL'leri kısa ömürlü
 * olduğu için görüntüleyici açılışında taze veri gerekir.
 */
export function useHomeworkTracking(id: string | null) {
  return useQuery({
    queryKey: qk.homework.tracking(id),
    queryFn: () => getHomeworkTracking(id!),
    enabled: Boolean(id),
    refetchOnWindowFocus: true,
  })
}

// ═══════════ Yazma ═══════════

/** Yayın/iptal/güncelleme/kapatma sonrası tazelenen anahtarlar. */
function invalidateHomeworkItem(
  client: ReturnType<typeof useQueryClient>,
  id: string | null,
) {
  void client.invalidateQueries({ queryKey: qk.homework.item(id) })
  void client.invalidateQueries({ queryKey: qk.homework.all() })
}

export function useCreateHomework() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateHomeworkBody) => createHomework(body),
    onSuccess: () => invalidateHomeworkItem(client, null),
  })
}

export function useUpdateHomework(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateHomeworkBody) => updateHomework(id, body),
    onSuccess: () => invalidateHomeworkItem(client, id),
  })
}

export function useDeleteHomeworkDraft() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteHomeworkDraft(id),
    onSuccess: () => invalidateHomeworkItem(client, null),
  })
}

export function usePublishHomework(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => publishHomework(id),
    onSuccess: () => invalidateHomeworkItem(client, id),
  })
}

export function useCancelHomework(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: CancelHomeworkBody) => cancelHomework(id, body),
    onSuccess: () => invalidateHomeworkItem(client, id),
  })
}

export function useCloseHomework(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => closeHomework(id),
    onSuccess: () => invalidateHomeworkItem(client, id),
  })
}

export interface MarkTrackingArgs {
  studentId: string
  status: TrackingStatus
  exemptReason?: string
}

/**
 * Satır işaretleme.
 *
 * Optimistic güncelleme ve geri alma BİLEREK burada DEĞİL, çağıran yüzeydeki
 * `use-tracking-writer` hook'undadır: satır içi mikro-onay ve "Tekrar dene"
 * durumu görsel bir sözleşmedir ve platforma göre farklıdır. Buradaki mutation
 * ham taşımadır; `retry: 1` ağ titremesini yutar.
 */
export function useMarkTracking(id: string) {
  return useMutation({
    mutationFn: ({ studentId, status, exemptReason }: MarkTrackingArgs) =>
      markTrackingStatus(id, studentId, {
        status,
        ...(exemptReason ? { exemptReason } : {}),
      }),
    retry: 1,
  })
}

export function useBulkCompleteRemaining(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => bulkCompleteRemaining(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.homework.tracking(id) })
      invalidateHomeworkItem(client, id)
    },
  })
}

export type { HomeworkStatus }
```

- [ ] **Step 2: `packages/api/src/index.ts`'e `queries` satırını ekle**

Task 5'te bırakılan satır:

```ts
export * from "./homework/queries"
```

- [ ] **Step 3: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add packages/api/src/homework/queries.ts packages/api/src/index.ts
git commit -m "feat(api): ödev query hook'ları eklendi"
```

---

## Task 7: api-mocks/homework — defter ve sayaç hesabı

**Files:**
- Create: `packages/api-mocks/src/homework/homework-data.ts`
- Create: `packages/api-mocks/src/homework/homework-data.test.ts`

**Interfaces:**
- Consumes: Task 3'ün `ROSTER_9A`/`ROSTER_10C`/`CLASSROOMS`, Task 4'ün DTO'ları
- Produces: `MOCK_TODAY`, `resetHomeworkStore()`, `listHomework()`, `findHomework()`, `insertHomework()`, `listTracking()`, `findTrackingRow()`, `computeCounters()`, `toListItemDto()`, `toDetailDto()`, `toTrackingDto()`, `HomeworkRecord`, `TrackingRecord`

- [ ] **Step 1: Testi yaz (kırmızı)**

`packages/api-mocks/src/homework/homework-data.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest"

import {
  computeCounters,
  findHomework,
  listHomework,
  listTracking,
  MOCK_TODAY,
  resetHomeworkStore,
} from "./homework-data"

beforeEach(() => resetHomeworkStore())

describe("ödev mock defteri", () => {
  it("mock bugünü tasarımdaki gün olarak sabitler", () => {
    expect(MOCK_TODAY).toBe("2026-09-15")
  })

  it("ana örnek ödev tasarımdaki dağılımı taşır", () => {
    const homework = findHomework("hw-uslu-sayilar")
    expect(homework).toBeDefined()
    expect(homework!.title).toBe("Üslü sayılar çalışma kağıdı")
    expect(homework!.classRoomId).toBe("cr-10c")
    expect(homework!.dueDate).toBe("2026-09-14")
    expect(homework!.status).toBe("published")

    const counters = computeCounters("hw-uslu-sayilar")
    expect(counters).toMatchObject({
      targetCount: 26,
      completedCount: 12,
      incompleteCount: 3,
      notDoneCount: 1,
      exemptCount: 1,
      unmarkedCount: 9,
      submissionStudentCount: 7,
    })
  })

  it("süresi dolmuş ve işaretlenmemiş satırı olan ödev kontrol bekler", () => {
    expect(computeCounters("hw-uslu-sayilar")).toMatchObject({
      isOverdue: true,
      isPendingCheck: true,
    })
  })

  it("muaf öğrencinin gerekçesi defterdedir", () => {
    const rows = listTracking("hw-uslu-sayilar")
    const exempt = rows.find((r) => r.status === "exempt")
    expect(exempt?.exemptReason).toBe("Raporlu — 10–14 Eylül")
  })

  it("Ceren Şahin'in yüklemesi 3 görsel + 1 PDF'tir", () => {
    const rows = listTracking("hw-uslu-sayilar")
    const ceren = rows.find((r) => r.fullName === "Ceren Şahin")
    expect(ceren?.submissions).toHaveLength(4)
    expect(ceren?.submissions.filter((f) => f.contentType === "application/pdf")).toHaveLength(1)
  })

  it("taslak, yayınlanmış ve kapanmış ödevler doğal olarak defterde bulunur", () => {
    const statuses = listHomework().map((h) => h.status)
    expect(statuses).toContain("draft")
    expect(statuses).toContain("published")
    expect(statuses).toContain("closed")
  })

  it("taslak ödevin takip satırı yoktur — hedef yayında materialize olur", () => {
    expect(listTracking("hw-geometri-taslak")).toHaveLength(0)
  })

  it("defter sıfırlanınca başlangıç durumuna döner", () => {
    const rows = listTracking("hw-uslu-sayilar")
    rows[0]!.status = "completed"
    resetHomeworkStore()
    expect(computeCounters("hw-uslu-sayilar").completedCount).toBe(12)
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npx vitest run packages/api-mocks/src/homework/`
Beklenen: FAIL — modül yok

- [ ] **Step 3: `homework-data.ts`'i yaz**

Yapı: `HomeworkRecord` ve `TrackingRecord` iç kayıtlar; `seed()` başlangıç
durumunu kurar; `resetHomeworkStore()` yeniden tohumlar; DTO dönüştürücüler
sayaçları **tek** fonksiyondan (`computeCounters`) okur.

Uyulacak veri (tasarım promptundan birebir):
- `MOCK_TODAY = "2026-09-15"` (Salı, 15 Eylül 2026)
- Öğretmen: `personId: "t-ayse"`, `"Ayşe Demir"`, ders `sb-mat` / `"Matematik"`
- Dönem: `termId: "t1"`
- **`hw-uslu-sayilar`** — "Üslü sayılar çalışma kağıdı", `cr-10c`,
  `dueDate: "2026-09-14"`, `status: "published"` (→ `isOverdue: true`),
  açıklama "Dağıtılan çalışma kağıdındaki tüm soruları çözünüz. Cevap anahtarı
  kontrol sonrası paylaşılacak.", 1 dosya eki
  `"uslu-sayilar-calisma-kagidi.pdf"`.
  26 satır `ROSTER_10C`'den; durum dağılımı: ilk 12 `completed`, sonraki 3
  `incomplete`, 1 `notDone`, 1 `exempt` (Ecrin Öz, gerekçe
  `"Raporlu — 10–14 Eylül"`), kalan 9 `unmarked`.
  Yükleme: 7 öğrencide; Ceren Şahin'de 3 görsel + 1 PDF, `uploadedAtLabel: "Dün 21:40"`.
- **`hw-geometri-taslak`** — "Geometri ön hazırlık", `cr-10c`, `status: "draft"`,
  `dueDate: "2026-09-19"`, takip satırı YOK.
- **`hw-sayfa-42-45`** — "Sayfa 42–45 problemler", `cr-9a`, `status: "published"`,
  `dueDate: "2026-09-18"` (süresi dolmamış), 30 satır `ROSTER_9A`'dan, hepsi
  `unmarked`, yükleme yok. Ek: 1 dosya + 1 bağlantı
  (`"problem-cozum-ornekleri.pdf"`, `"khanacademy.org/…"`).
- **`hw-turev-kapali`** — "Türev giriş alıştırmaları", `cr-11a`,
  `status: "closed"`, `dueDate: "2026-09-08"`, 24 satır, hepsi işaretli
  (20 `completed`, 4 `incomplete`).

Sayaç hesabı **tek** fonksiyondadır:

```ts
/**
 * Sayaçlar TEK yerden hesaplanır — liste, detay ve ızgara aynı fonksiyondan
 * okur. Backend'de `HomeworkCounters` sınıfının karşılığı budur.
 *
 * `isOverdue` SUNUCU hesabıdır: mock "bugün"ü sabit tutar (MOCK_TODAY) ve
 * karşılaştırmayı burada yapar; istemci asla tarih karşılaştırmaz.
 */
export function computeCounters(homeworkId: string): HomeworkCountersDto {
  const homework = findHomework(homeworkId)
  const rows = listTracking(homeworkId)
  const by = (status: TrackingStatusDto) => rows.filter((r) => r.status === status).length
  const unmarkedCount = by("unmarked")
  const isOverdue = homework?.status === "published" && homework.dueDate < MOCK_TODAY
  return {
    targetCount: rows.length,
    markedCount: rows.length - unmarkedCount,
    completedCount: by("completed"),
    incompleteCount: by("incomplete"),
    notDoneCount: by("notDone"),
    exemptCount: by("exempt"),
    unmarkedCount,
    submissionStudentCount: rows.filter((r) => r.submissions.length > 0).length,
    isOverdue,
    isPendingCheck: isOverdue && unmarkedCount > 0,
  }
}
```

Yükleme dosyaları mevcut dosya defterine kaydolur — yeni defter açılmaz:

```ts
import { registerMockFile } from "../files/file-data"
```

> `files/file-data.ts`'in gerçek dışa açılan API'sini oku ve ona uy; isim
> uyuşmuyorsa oradaki mevcut kaydetme fonksiyonunu kullan, yenisini ekleme.

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu gör**

Çalıştır: `npx vitest run packages/api-mocks/src/homework/`
Beklenen: PASS — 8 test

- [ ] **Step 5: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add packages/api-mocks/src/homework
git commit -m "feat(api): ödev mock defteri eklendi"
```

---

## Task 8: api-mocks/homework — handler'lar ve sözleşme testleri

Bu task planın en önemli parçasıdır: backend yazılırken okunacak kaynak burasıdır.
Handler'lar mutlu yolu değil **sözleşmenin tamamını** uygular.

**Files:**
- Create: `packages/api-mocks/src/homework/homework-handlers.ts`
- Create: `packages/api-mocks/src/homework/homework-handlers.test.ts`
- Create: `packages/api-mocks/src/homework/index.ts`

**Interfaces:**
- Consumes: Task 7'nin defteri
- Produces: `homeworkHandlers` (MSW `RequestHandler[]`), `setMockViewer(role)`

- [ ] **Step 1: Sözleşme testlerini yaz (kırmızı)**

Spec §4'ün dokuz maddesinin her biri için en az bir test.
`homework-handlers.test.ts`:

```ts
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { resetHomeworkStore } from "./homework-data"
import { homeworkHandlers, setMockViewer } from "./homework-handlers"

const server = setupServer(...homeworkHandlers)
const BASE = "http://localhost/api/v1"

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterAll(() => server.close())
beforeEach(() => {
  resetHomeworkStore()
  setMockViewer("owner")
})
afterEach(() => server.resetHandlers())

async function call(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, init)
  return { response, body: await response.json().catch(() => null) }
}

const json = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
})

describe("1 · durum makinesi", () => {
  it("taslağı yayınlar ve hedefi materialize eder", async () => {
    const { response, body } = await call("/homework/hw-geometri-taslak:publish", { method: "POST" })
    expect(response.status).toBe(200)
    expect(body.data.status).toBe("published")
    expect(body.data.counters.targetCount).toBe(26)
    expect(body.data.counters.unmarkedCount).toBe(26)
  })

  it("yayınlanmış ödevi yeniden yayınlamayı 409 invalid_state ile reddeder", async () => {
    const { response, body } = await call("/homework/hw-uslu-sayilar:publish", { method: "POST" })
    expect(response.status).toBe(409)
    expect(body.errors[0].code).toBe("invalid_state")
  })

  it("kapanmış ödevi iptal etmeyi reddeder", async () => {
    const { response, body } = await call(
      "/homework/hw-turev-kapali:cancel",
      json({ reason: "Sınav takvimi değişti" }),
    )
    expect(response.status).toBe(409)
    expect(body.errors[0].code).toBe("invalid_state")
  })

  it("yayınlanmış ödevin taslağı silinemez", async () => {
    const { response, body } = await call("/homework/hw-uslu-sayilar", { method: "DELETE" })
    expect(response.status).toBe(409)
    expect(body.errors[0].code).toBe("invalid_state")
  })
})

describe("2 · hata sözleşmesi", () => {
  it("başlıksız oluşturmayı 400 validation ile reddeder", async () => {
    const { response, body } = await call(
      "/homework",
      json({ classRoomIds: ["cr-9a"], subjectId: "sb-mat", targetType: "wholeClass", title: "  ", dueDate: "2026-09-20" }),
    )
    expect(response.status).toBe(400)
    expect(body.errors[0].code).toBe("validation")
  })

  it("15 karakterden kısa iptal gerekçesini 400 validation ile reddeder", async () => {
    const { response, body } = await call("/homework/hw-uslu-sayilar:cancel", json({ reason: "kısa" }))
    expect(response.status).toBe(400)
    expect(body.errors[0].code).toBe("validation")
  })

  it("geçmiş tarihli yayını 400 due_date_past ile reddeder", async () => {
    await call(
      "/homework",
      json({ classRoomIds: ["cr-9a"], subjectId: "sb-mat", targetType: "wholeClass", title: "Geçmiş", dueDate: "2026-09-01" }),
    )
    // Oluşturma serbesttir; kural YAYINDA uygulanır (BR-HW-02).
    const created = await call("/homework/mine")
    const past = created.body.data.find((h: { title: string }) => h.title === "Geçmiş")
    const { response, body } = await call(`/homework/${past.id}:publish`, { method: "POST" })
    expect(response.status).toBe(400)
    expect(body.errors[0].code).toBe("due_date_past")
  })

  it("olmayan ödevde 404 not_found döner", async () => {
    const { response, body } = await call("/homework/yok")
    expect(response.status).toBe(404)
    expect(body.errors[0].code).toBe("not_found")
  })

  it("muaf gerekçesiz işaretlemeyi 400 validation ile reddeder", async () => {
    const { response, body } = await call("/homework/hw-uslu-sayilar/tracking/st-1101", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "exempt" }),
    })
    expect(response.status).toBe(400)
    expect(body.errors[0].code).toBe("validation")
  })

  it("kapanmış ödevde işaretlemeyi 409 invalid_state ile reddeder", async () => {
    const { response, body } = await call("/homework/hw-turev-kapali/tracking/st-1101", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    })
    expect(response.status).toBe(409)
    expect(body.errors[0].code).toBe("invalid_state")
  })
})

describe("3 · kapsam daraltması sunucuda", () => {
  it("rehber görünümünde işaretleme kapalıdır ve sebebi bildirilir", async () => {
    setMockViewer("homeroom")
    const { body } = await call("/homework/hw-uslu-sayilar")
    expect(body.data.canMark).toBe(false)
    expect(body.data.isReadOnly).toBe(true)
    expect(body.data.readOnlyReason).toBe("homeroomView")
  })

  it("rehber görünümünde yükleme SAYISI görünür ama içeriği gelmez", async () => {
    setMockViewer("homeroom")
    const { body } = await call("/homework/hw-uslu-sayilar/tracking")
    const ceren = body.data.rows.find((r: { fullName: string }) => r.fullName === "Ceren Şahin")
    expect(ceren.submissionCount).toBe(4)
    expect(ceren.submissions).toEqual([])
  })

  it("rehber görünümünde işaretleme isteği 404 ile reddedilir", async () => {
    setMockViewer("homeroom")
    const { response } = await call("/homework/hw-uslu-sayilar/tracking/st-1101", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    })
    expect(response.status).toBe(404)
  })

  // İstemciden gelen rol/görünüm parametresi YOK SAYILIR.
  it("sorgudaki rol parametresi görünümü değiştirmez", async () => {
    setMockViewer("homeroom")
    const { body } = await call("/homework/hw-uslu-sayilar?view=owner")
    expect(body.data.canMark).toBe(false)
  })
})

describe("4 · ExemptReason sızdırılmaz", () => {
  it("sahip görünümünde muaf gerekçesi gelir", async () => {
    const { body } = await call("/homework/hw-uslu-sayilar/tracking")
    const exempt = body.data.rows.find((r: { status: string }) => r.status === "exempt")
    expect(exempt.exemptReason).toBe("Raporlu — 10–14 Eylül")
  })

  it("rehber görünümünde muaf gerekçesi ŞEMA DIŞIDIR", async () => {
    setMockViewer("homeroom")
    const { body } = await call("/homework/hw-uslu-sayilar/tracking")
    const exempt = body.data.rows.find((r: { status: string }) => r.status === "exempt")
    expect("exemptReason" in exempt).toBe(false)
  })
})

describe("6 · sayaçlar tek yerden", () => {
  it("işaretleme sonrası liste, detay ve ızgara AYNI sayacı gösterir", async () => {
    await call("/homework/hw-uslu-sayilar/tracking/st-1111", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    })
    const detail = await call("/homework/hw-uslu-sayilar")
    const tracking = await call("/homework/hw-uslu-sayilar/tracking")
    const list = await call("/homework/mine")
    const fromList = list.body.data.find((h: { id: string }) => h.id === "hw-uslu-sayilar")

    expect(detail.body.data.counters.completedCount).toBe(13)
    expect(tracking.body.data.counters.completedCount).toBe(13)
    expect(fromList.counters.completedCount).toBe(13)
  })

  it("toplu tamamlama yalnız işaretlenmemiş satırları etkiler", async () => {
    const { body } = await call("/homework/hw-uslu-sayilar/tracking:bulk-complete", { method: "POST" })
    expect(body.data.markedCount).toBe(9)

    const after = await call("/homework/hw-uslu-sayilar/tracking")
    expect(after.body.data.counters.unmarkedCount).toBe(0)
    expect(after.body.data.counters.completedCount).toBe(21)
    // Eksik/Yapılmadı/Muaf DOKUNULMAZ.
    expect(after.body.data.counters.incompleteCount).toBe(3)
    expect(after.body.data.counters.notDoneCount).toBe(1)
    expect(after.body.data.counters.exemptCount).toBe(1)
  })
})

describe("7 · isOverdue sunucuda", () => {
  it("süresi dolmuş ödev isOverdue taşır, dolmamış taşımaz", async () => {
    const list = await call("/homework/mine")
    const overdue = list.body.data.find((h: { id: string }) => h.id === "hw-uslu-sayilar")
    const active = list.body.data.find((h: { id: string }) => h.id === "hw-sayfa-42-45")
    expect(overdue.counters.isOverdue).toBe(true)
    expect(active.counters.isOverdue).toBe(false)
  })
})

describe("8 · GET yan etkisizdir", () => {
  it("detayı iki kez okumak hiçbir sayacı değiştirmez", async () => {
    const first = await call("/homework/hw-uslu-sayilar")
    const second = await call("/homework/hw-uslu-sayilar")
    expect(second.body.data.counters).toEqual(first.body.data.counters)
  })
})

describe("9 · zarf", () => {
  it("başarı yanıtı tam zarf taşır", async () => {
    const { body } = await call("/homework/mine")
    expect(Object.keys(body).sort()).toEqual(["correlationId", "data", "errors", "meta"])
    expect(body.errors).toBeNull()
  })

  it("hata yanıtı da tam zarf taşır", async () => {
    const { body } = await call("/homework/yok")
    expect(Object.keys(body).sort()).toEqual(["correlationId", "data", "errors", "meta"])
    expect(body.data).toBeNull()
  })
})

describe("çoklu şube yayını", () => {
  it("şube başına BİR kayıt üretir", async () => {
    const { response, body } = await call(
      "/homework",
      json({
        classRoomIds: ["cr-9a", "cr-10c"],
        subjectId: "sb-mat",
        targetType: "wholeClass",
        title: "Tekrar testi",
        dueDate: "2026-09-22",
      }),
    )
    expect(response.status).toBe(201)
    expect(body.data.ids).toHaveLength(2)
  })

  it("çoklu şube ile seçili öğrenci birleşimini 400 ile reddeder", async () => {
    const { response, body } = await call(
      "/homework",
      json({
        classRoomIds: ["cr-9a", "cr-10c"],
        subjectId: "sb-mat",
        targetType: "selectedStudents",
        targetStudentIds: ["st-1023"],
        title: "Karma",
        dueDate: "2026-09-22",
      }),
    )
    expect(response.status).toBe(400)
    expect(body.errors[0].code).toBe("validation")
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npx vitest run packages/api-mocks/src/homework/homework-handlers.test.ts`
Beklenen: FAIL — `Cannot find module './homework-handlers'`

- [ ] **Step 3: `homework-handlers.ts`'i yaz**

Testleri geçirecek en yalın hâl. Uyulacak yapı:

```ts
// OKSİS Ödev (homework) — MSW handler'ları.
//
// BU DOSYA SÖZLEŞMENİN ÇALIŞAN TARİFİDİR. Backend modülü yazılmaya
// başlandığında `.NET` handler'ları buna karşı yazılır ve
// `homework-handlers.test.ts` kabul kriteridir. Bu yüzden burada mutlu yol
// değil, sözleşmenin TAMAMI uygulanır: durum makinesi, altı hata kodu, role
// göre alan daraltması.
//
// Zarf: {data, meta, errors, correlationId}. Path'ler `*/api/v1/...` ile
// başlar (mobil mutlak origin eşleşmesi).

import { http, HttpResponse } from "msw"

const CORRELATION = "mock-homework"

function ok<T>(data: T, status = 200) {
  return HttpResponse.json(
    { data, meta: null, errors: null, correlationId: CORRELATION },
    { status },
  )
}

function fail(code: string, message: string, status: number) {
  return HttpResponse.json(
    { data: null, meta: null, errors: [{ code, message }], correlationId: CORRELATION },
    { status },
  )
}

const notFound = () => fail("not_found", "Ödev bulunamadı.", 404)
const invalidState = (message: string) => fail("invalid_state", message, 409)
const validation = (message: string) => fail("validation", message, 400)
const dueDatePast = () =>
  fail("due_date_past", "Son teslim tarihi geçmişte olamaz.", 400)

/**
 * Görünüm rolü. GERÇEK backend'de bu `ICurrentUser`'dan türer ve istemciden
 * ASLA gelmez; mock'ta test ve senaryo barı için buradan ayarlanır.
 * İstemcinin gönderdiği `view`/`role` parametresi YOK SAYILIR.
 */
export type MockViewer = "owner" | "homeroom"
let viewer: MockViewer = "owner"
export function setMockViewer(next: MockViewer) {
  viewer = next
}
```

Handler listesi (sıra önemli: `mine`/`homeroom` sabit yolları `{id}`
kalıbından ÖNCE gelmeli, yoksa `"mine"` bir id sanılır):

1. `GET */api/v1/homework/mine`
2. `GET */api/v1/homework/homeroom`
3. `GET */api/v1/homework/:id`
4. `POST */api/v1/homework`
5. `PUT */api/v1/homework/:id`
6. `DELETE */api/v1/homework/:id`
7. `POST */api/v1/homework/:id\\:publish`
8. `POST */api/v1/homework/:id\\:cancel`
9. `POST */api/v1/homework/:id\\:close`
10. `GET */api/v1/homework/:id/tracking`
11. `PUT */api/v1/homework/:id/tracking/:studentId`
12. `POST */api/v1/homework/:id/tracking\\:bulk-complete`

> `:publish` gibi eylem sonekleri MSW yol kalıbında iki nokta taşıdığı için
> parametre sanılabilir. Yol kalıbının doğru eşleştiğini testle doğrula; gerekirse
> `*/api/v1/homework/:id:publish` yerine tam yolun regex/`*` varyantını kullan
> ve hangi biçimin çalıştığını dosya başına yorum olarak yaz.

Rehber görünümünde satır serileştirmesi (madde 3 ve 4'ün karşılığı):

```ts
/**
 * Rehber öğretmen satırı: durum GÖRÜNÜR, yükleme SAYISI görünür, ama içerik
 * gelmez ve muaf gerekçesi ŞEMA DIŞIDIR — `null` bile değil, alan hiç yoktur.
 * Bu, "veli/öğrenci gerekçeyi görmesin" kuralının aynı mekanizmasıdır.
 */
function toHomeroomRow(row: TrackingRecord): Omit<HomeworkTrackingRowDto, "exemptReason"> {
  return {
    studentPersonId: row.studentPersonId,
    studentNo: row.studentNo,
    fullName: row.fullName,
    status: row.status,
    markedAt: row.markedAt,
    addedAfterPublish: row.addedAfterPublish,
    submissionCount: row.submissions.length,
    submissions: [],
  }
}
```

- [ ] **Step 4: `index.ts`'i yaz**

```ts
export * from "./homework-data"
export * from "./homework-handlers"
```

- [ ] **Step 5: Testi çalıştır, yeşil olduğunu gör**

Çalıştır: `npx vitest run packages/api-mocks/src/homework/`
Beklenen: PASS — data testleri (8) + handler testleri (23)

- [ ] **Step 6: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add packages/api-mocks/src/homework
git commit -m "feat(api): ödev MSW handler'ları ve sözleşme testleri eklendi"
```

---

## Task 9: Mock kaydı — web ve mobil

**Files:**
- Modify: `packages/api-mocks/src/index.ts`
- Modify: `apps/web/mocks/handlers.ts`
- Modify: `apps/mobile/src/lib/enable-mocking.ts`

- [ ] **Step 1: `packages/api-mocks/src/index.ts`'e ödev export'unu ekle**

`grade` export'unun ardına:

```ts
// Ödev (homework) — backend modülü HENÜZ YOK (Modules/Homework yalnız README).
// Öğretmen web yüzü ile öğrenci/veli mobil yüzü AYNI uçları tüketir; paketin
// ölçütü budur. Bu handler'lar sözleşmenin çalışan tarifidir — backend
// yazılırken birincil kaynak.
export * from "./homework"
```

- [ ] **Step 2: `apps/web/mocks/handlers.ts`'e spread et**

Dosyanın handler dizisini birleştiren yerini bul (`export const handlers = [...]`)
ve `homeworkHandlers`'ı ekle. İçe aktarma:

```ts
import { homeworkHandlers } from "@workspace/api-mocks"
```

Diziye eklenirken yorum:

```ts
  // Ödev uçlarının .NET karşılığı YOK; ekranların tek veri kaynağı bu handler'lar.
  ...homeworkHandlers,
```

- [ ] **Step 3: `apps/mobile/src/lib/enable-mocking.ts`'e ekle**

Dinamik import'taki destructuring'e `homeworkHandlers` eklenir ve
`setupServer` çağrısına spread edilir:

```ts
    // Ödev modülünün .NET ucu HENÜZ YOK (Modules/Homework yalnız README);
    // ödev ekranlarının tek veri kaynağı bu handler'lardır.
    ...homeworkHandlers,
```

Dosya sonundaki `console.log` metnine "ödev" eklenir.

- [ ] **Step 4: Web'i mock modunda çalıştır ve ucun cevap verdiğini doğrula**

Çalıştır: `cd /Users/farukkaya/Repositories/oksis-ui && npm run dev -w apps/web`
Tarayıcıda konsola:

```js
await (await fetch("/api/v1/homework/mine")).json()
```

Beklenen: dört ödevlik dizi; `hw-uslu-sayilar` kaydında
`counters.isOverdue === true` ve `counters.unmarkedCount === 9`.

- [ ] **Step 5: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add packages/api-mocks/src/index.ts apps/web/mocks/handlers.ts apps/mobile/src/lib/enable-mocking.ts
git commit -m "feat(repo): ödev mock'ları web ve mobil MSW kurulumuna bağlandı"
```

---

## Task 10: Web — rol kabuğu ve öğretmen ödev listesi (Ekran 2)

**Handoff kapıları:** Bu task'tan itibaren her ekran için
`oksis-ui/.claude/skills/handoff-web/SKILL.md`'i oku ve dört kapıyı sırayla uygula.
Tasarım kaynağı `DesignSync` ile okunur: `web/homework-list.jsx`, `web/homework.css`.
Brief: `uploads/ekran2-brief.md`.

**Files:**
- Create: `apps/web/features/homework/homework-page.tsx`
- Create: `apps/web/features/homework/homework-list-screen.tsx`
- Create: `apps/web/features/homework/parts.tsx`
- Create: `apps/web/features/homework/index.ts`
- Modify: `apps/web/app/(dashboard)/homework/page.tsx`

**Interfaces:**
- Consumes: `useMyHomework`, `useHomeroomHomework`, `HOMEWORK_STATUS_CONFIG`, `OVERDUE_STATUS_CONFIG`, `TRACKING_STATUS_CONFIG`
- Produces: `HomeworkPage`, `HomeworkStatusChip`, `CheckProgress`, `SubmissionBadge`, `TargetBadge`, `HomeworkSummaryStrip`

- [ ] **Step 1: Tasarımı oku ve kapı 1-2-3'ü uygula**

`DesignSync` `get_file` ile `web/homework-list.jsx` ve `web/homework.css`'i oku.
Envanter çıkar: her renk/font/radius için token karşılığı; eşleşmeyen her
değeri raporla. `packages/ui` primitifleriyle eşlemeyen bir öğe varsa **dur ve
onay iste** — sessizce yeni paylaşılan bileşen üretme.

- [ ] **Step 2: `parts.tsx`'i yaz**

Ekran 2'de tanımlanıp Ekran 3'te devralınan dört çekirdek bileşen. Her biri
`@workspace/core`'daki config'ten okur; ham renk/etiket yazmaz:

```tsx
"use client"

// OKSİS Ödev — Ekran 2'de tanımlanan ve Ekran 3'te AYNEN devralınan çekirdek
// bileşenler. Görsel dil tek yerdedir; ikinci bir kopya üretilmez.

import {
  HOMEWORK_STATUS_CONFIG,
  OVERDUE_STATUS_CONFIG,
  type HomeworkListItem,
  type StatusTone,
} from "@workspace/core"
```

- `HomeworkStatusChip({ status, isOverdue })` — `published && isOverdue` ise
  `OVERDUE_STATUS_CONFIG`, değilse `HOMEWORK_STATUS_CONFIG[status]`.
- `CheckProgress({ counters })` — "12/26" biçimi. **Yüzde YOK.**
- `SubmissionBadge({ count })` — `count === 0` ise hiç render edilmez.
- `TargetBadge({ targetType, targetCount })` — `selectedStudents` ise
  "8 öğrenci", `wholeClass` ise şube adı.
- `HomeworkSummaryStrip({ counters, activeFilter, onFilterChange })` — her sayı
  kendi durum renginde mini rozet; tıklama ızgarayı filtreler, "temizle" kalkar.

`tone` → Tailwind sınıfı eşlemesi tek bir `Record<StatusTone, string>` ile
yapılır; `if` zinciri yazılmaz.

- [ ] **Step 3: `homework-list-screen.tsx`'i yaz**

Ekran 2: şube/ders/durum filtreli liste, durum rozetli. Zorunlu üç durum:
- **loading** — iskelet satırları (boş ekran yasak)
- **empty** — 56×56 daire ikon + başlık + açıklama kalıbı
- **error** — hata bandı + "Tekrar dene"

Veri `useMyHomework(filters)`'ten gelir. Sayfa başlığı ve "Yeni Ödev" birincil
butonu `PageHeader` ile (mevcut paylaşılan bileşen).

- [ ] **Step 4: `homework-page.tsx`'i yaz**

```tsx
"use client"

// OKSİS Ödev — /homework rotasının kabuğu.
// Rol farkı ekran KOPYALANARAK değil, dispatch ile taşınır (not modülünün
// deseni). Faz A'da yalnız öğretmen dalı var; öğrenci/veli Faz B'de,
// yönetici Faz C'de eklenir.
//
// VARSAYILAN DAL YOK ve olmayacak: rolü çözülmemiş bir oturumun öğretmen
// listesine düşmesi tam olarak kapattığımız kusurdur (`B-34`).

import { useState } from "react"

import { useActiveRole } from "@/lib/active-role"
import { HomeworkListScreen } from "./homework-list-screen"

export function HomeworkPage() {
  const { activeRole } = useActiveRole()
  const [openHomeworkId, setOpenHomeworkId] = useState<string | null>(null)

  // Rol henüz çözülmediyse hiçbir şey çizilmez.
  if (activeRole !== "teacher") return null

  // Detay Task 12'de bağlanır.
  return <HomeworkListScreen onOpen={setOpenHomeworkId} />
}
```

> Task 12 bu dosyayı detay ekranını açacak şekilde genişletecek;
> `openHomeworkId` şimdiden tutulur.

- [ ] **Step 5: `index.ts`'i yaz**

```ts
export { HomeworkPage } from "./homework-page"
```

- [ ] **Step 6: Rotayı gerçek ekrana bağla**

`apps/web/app/(dashboard)/homework/page.tsx` tamamen değiştirilir:

```tsx
import { HomeworkPage } from "@/features/homework"

export default function Page() {
  return <HomeworkPage />
}
```

- [ ] **Step 7: Ekranı gerçek uygulamada doğrula**

Çalıştır: `npm run dev -w apps/web`, öğretmen olarak giriş yap, `/homework`'e git.
Beklenen: dört ödev listelenir; `hw-uslu-sayilar` "Süresi Doldu" çipi ve "12/26"
ilerlemesi taşır; `hw-geometri-taslak` "Taslak" çipi taşır. Yüzde **görünmez**.
"Yapılmadı" hiçbir yerde kırmızı **değildir**.

- [ ] **Step 8: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add apps/web/features/homework "apps/web/app/(dashboard)/homework/page.tsx"
git commit -m "feat(web): öğretmen ödev listesi ekranı eklendi"
```

---

## Task 11: Web — Ödev oluştur / yayınla (Ekran 1)

**Tasarım:** `web/homework-create.jsx`. Brief: `uploads/ekran1-brief.md`
(dosyayı `DesignSync` ile oku — form alanlarının SIRASI ürün kararıdır).

**Files:**
- Create: `apps/web/features/homework/homework-create-dialog.tsx`
- Create: `apps/web/features/homework/student-picker-popover.tsx`
- Modify: `apps/web/features/homework/homework-list-screen.tsx`
- Modify: `apps/web/features/homework/index.ts`

**Interfaces:**
- Consumes: `homeworkFormSchema`, `HomeworkFormValues`, `useCreateHomework`, `usePublishHomework`
- Produces: `HomeworkCreateDialog({ open, onOpenChange, onCreated })`

- [ ] **Step 1: Handoff kapılarını uygula**

`web/homework-create.jsx`'i oku; marka ve bileşen eşlemesini raporla.

- [ ] **Step 2: Formu kur**

Alan sırası **ürün kararıdır**, değiştirilmez: şube (çoklu çip) → ders →
hedef (segment) → başlık → açıklama → ekler → son teslim tarihi.

- Şube çipleri çoklu seçim; çoklu seçimde form altında bilgi satırı:
  `"Bu ödev 2 şubeye ayrı ayrı verilecek."`
- Ders tek ise **salt okunur bilgi satırı** — seçici gösterilmez.
- Hedef `selectedStudents` seçilince `StudentPickerPopover` açılır; seçim sonrası
  alan `"8 öğrenci seçildi"` özetine döner.
- Son teslim hızlı çipleri: **Yarın · Bu Cuma · Haftaya bugün · Takvimden seç**.
  Tarihler `todayIsoDate()` tabanlı yerel hesapla üretilir —
  `toISOString()` **kullanılmaz**. Seçilen tarih insan diliyle yazılır
  (`"Cuma, 18 Eylül"`). **Saat seçici YOK.**
- Doğrulama `homeworkFormSchema` ile; hata alan altında inline.

- [ ] **Step 3: İki aksiyonu görsel olarak ayır**

`"Yayınla"` birincil dolgulu lacivert · `"Taslak kaydet"` ikincil outline.
Öğretmen hangisinin aileye bildirim göndereceğinden bir an bile şüphe etmemeli.

- [ ] **Step 4: Yayın onay diyaloğunu kur — üç varyant**

Gövde etkiyi **sayıyla** yazar:
- tek şube: `"9-A şubesindeki 30 öğrenci ve velileri bildirim alacak."`
- çoklu şube: `"2 şubeye ayrı ayrı verilecek: 9-A (30) ve 9-B (28). Toplam 58 öğrenci ve velileri bildirim alacak."`
- seçili öğrenci: `"9-A şubesinden seçtiğiniz 8 öğrenci ve velileri bildirim alacak."`

Son teslim tarihi tekrar gösterilir. Uyarı mikro-metni:
`"Yayın geri alınamaz; gerekirse ödevi iptal edebilirsiniz."`
Butonlar: `"Yayınla"` (birincil) · `"Vazgeç"`.

- [ ] **Step 5: Akışı bağla**

`"Taslak kaydet"` → `createHomework` → nötr toast
`"Taslak kaydedildi — yalnız siz görüyorsunuz."`
`"Yayınla"` → `createHomework` → dönen her id için `publishHomework` → başarı
toast'ı `"Ödev yayınlandı"`.

Ağ hatasında **form verisi kaybolmaz**: hata bandı + "Tekrar dene".

- [ ] **Step 6: Uçtan uca doğrula**

`npm run dev -w apps/web` · `/homework` → "Yeni Ödev" → 9-A ve 9-B seç →
başlık + tarih gir → Yayınla → onay diyaloğunda "Toplam 58 öğrenci" yazdığını
gör → onayla → listede **iki** yeni ödev belirdiğini gör (şube başına bir kayıt).

Ayrıca: geçmiş tarih seç → inline hata `"Son teslim tarihi geçmişte olamaz."`

- [ ] **Step 7: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add apps/web/features/homework
git commit -m "feat(web): ödev oluştur ve yayınla ekranı eklendi"
```

---

## Task 12: Web — Detay + kontrol ızgarası (Ekran 3)

Modülün kalbi. **Tasarım:** `web/homework-detail.jsx`.
Brief: `uploads/ekran3-brief.md` — ürün kurallarının tamamı oradadır.

**Files:**
- Create: `apps/web/features/homework/homework-detail-screen.tsx`
- Create: `apps/web/features/homework/tracking-grid.tsx`
- Create: `apps/web/features/homework/use-tracking-writer.ts`
- Create: `apps/web/features/homework/homework-dialogs.tsx`
- Modify: `apps/web/features/homework/homework-page.tsx`

**Interfaces:**
- Consumes: `useHomework`, `useHomeworkTracking`, `useMarkTracking`, `useBulkCompleteRemaining`, `useCancelHomework`, `usePublishHomework`, `TRACKING_STATUS_CONFIG`, `MISSING_DIGEST_NOTICE`, `exemptReasonSchema`, `cancelReasonSchema`
- Produces: `HomeworkDetailScreen({ homeworkId, onBack })`, `useTrackingWriter(homeworkId)`

- [ ] **Step 1: `use-tracking-writer.ts`'i yaz**

İşaretleme UX sözleşmesinin taşıyıcısı. Toast **yok**.

```ts
"use client"

// OKSİS Ödev — satır işaretlemenin yazma kapısı.
//
// İşaretleme ANINDA kaydedilir; ayrı "gönder" adımı yoktur. Üç davranış
// buradadır ve ekranlara dağıtılmaz:
//   1. Optimistic güncelleme — satır anında değişir (26 satırlık kontrol
//      2 dakikanın altında bitmeli).
//   2. Hata hâlinde GERİ AL — satır eski durumuna döner, veri kaybı hissi olmaz.
//   3. Satır içi "Tekrar dene" — toast DEĞİL. 26 satırda toast bombardımanı
//      olmaz; onay 300ms'lik satır içi mikro-parıltıdır.
```

Dışa açılan yüzey:

```ts
export interface TrackingWriterState {
  /** Şu an kaydedilmekte olan satırlar. */
  pending: Set<string>
  /** Kaydedilemeyen satırlar — satır içi "Tekrar dene" bunlardan okunur. */
  failed: Set<string>
  /** Mikro-onay parıltısı için son başarılı satır. */
  justSaved: string | null
  mark: (studentId: string, status: TrackingStatus, exemptReason?: string) => void
  retry: (studentId: string) => void
}
```

Optimistic güncelleme `queryClient.setQueryData(qk.homework.tracking(id), ...)`
ile yapılır; hata dalında önceki anlık görüntü geri yazılır.

- [ ] **Step 2: `tracking-grid.tsx`'i yaz**

Satır anatomisi: numara + ad soyad · yükleme rozeti (varsa) · durum kontrolü.

- Durum kontrolü: satırda **dört segment** yan yana —
  Tamamlandı / Eksik / Yapılmadı / Muaf. Seçili dolgulu, diğerleri hayalet.
- Tek tık işaretler, **anında kaydedilir**. Muaf tıklanınca gerekçe popover'ı
  açılır (zorunlu metin, "Kaydet").
- İşaretlenmiş satırın durumu **serbestçe değişir** — "düzeltme onayı"
  diyaloğu YOK, akış hızlı kalır.
- Klavye: ok tuşları satır gezer; **T** = Tamamlandı, **E** = Eksik,
  **Y** = Yapılmadı. Ekran kenarında küçük yardım satırı.
- Izgara üstünde tek toplu buton: **"Kalanları Tamamlandı işaretle"** — yalnız
  `unmarkedCount > 0` iken görünür, sayaçlı ("9 öğrenci"). Onay diyaloğu:
  `"9 öğrenci Tamamlandı olarak işaretlenecek. Bu işlem veliye anında bildirim göndermez."`
- Hızlı filtre: "Yalnız işaretlenmemişler" — özet şeridi filtresiyle **aynı**
  mekanizma (ikinci bir filtre state'i açma).
- Izgara altında sabit ince satır: `MISSING_DIGEST_NOTICE`.

- [ ] **Step 3: `homework-dialogs.tsx`'i yaz — dört diyalog**

1. **Muaf gerekçesi** — zorunlu metin, placeholder `"Raporlu — 10–14 Eylül"`.
2. **İptal onayı** — yıkıcı, tehlike kırmızısı **burada meşru**:
   `"Ödev iptal edilsin mi?"` + zorunlu gerekçe (≥15) + etki satırı
   `"26 öğrenci ve velileri 'ödev iptal edildi' bildirimi alacak."`
   Butonlar: `"Ödevi iptal et"` (tehlike) / `"Vazgeç"`.
3. **Yayınlanmış ödevi düzenleme onayı** —
   `"Değişiklik yayınlanacak — 26 öğrenci ve velileri 'ödev güncellendi' bildirimi alacak."`
4. **Taslak varyantı** — ızgara yerine bilgi durumu:
   `"Bu ödev taslak — yayınlandığında öğrenci listesi burada görünecek"` +
   `"Yayınla"` birincil butonu (Ekran 1'in yayın onayına gider).

- [ ] **Step 4: `homework-detail-screen.tsx`'i yaz**

**A) Başlık bölgesi:** başlık + durum çipi + şube çipi + `"Son: dün, 14 Eylül"` +
ek çipi + açıklama (2 satırdan uzunsa "devamını gör"). Aksiyonlar sağda:
**Düzenle** ve **İptal** — `detail.canEdit` false ise gösterilmez.

**Özet şeridi:** `HomeworkSummaryStrip` — her sayı kendi durum renginde; tıklama
ızgarayı o duruma filtreler.

**B) Izgara** — `TrackingGrid`.

**E) Durumlar** — hepsi zorunlu:
- loading: başlık + özet şeridi iskeleti + 6-8 satır iskeleti
- error: hata bandı + "Tekrar dene"
- `detail.readOnlyReason === "closed"`: ızgara salt okunur, butonlar pasif,
  bilgi bandı `"Bu ödev kapandı — kayıtlar salt okunur."`
- `detail.readOnlyReason === "homeroomView"`: yalnız durum rozetleri (buton yok),
  yükleme rozeti **sayı gösterir ama görüntüleyici AÇILMAZ**, bilgi bandı
  `"Rehber öğretmen görünümü — yalnız görüntüleme."`
- `status === "draft"`: taslak varyantı (yukarıdaki 4. diyalog bloğu)

Salt okunurluk `detail.isReadOnly`/`detail.canMark`'tan okunur — ekran kendi
başına rol hesabı yapmaz.

- [ ] **Step 5: `homework-page.tsx`'i detayı açacak şekilde genişlet**

```tsx
  if (openHomeworkId) {
    return (
      <HomeworkDetailScreen
        homeworkId={openHomeworkId}
        onBack={() => setOpenHomeworkId(null)}
      />
    )
  }
  return <HomeworkListScreen onOpen={setOpenHomeworkId} />
```

- [ ] **Step 6: Uçtan uca doğrula**

`/homework` → "Üslü sayılar çalışma kağıdı" → detay açılır.
- Özet şeridi **26 · 12 · 3 · 1 · 1 · 9** gösterir.
- Bir satırı Tamamlandı işaretle → sayaç 13'e çıkar, **toast çıkmaz**, satırda
  kısa mikro-onay olur.
- "Kalanları Tamamlandı işaretle" → "9 öğrenci" yazar → onayla → İşaretlenmedi 0,
  Tamamlandı 21 olur; Eksik 3 / Yapılmadı 1 / Muaf 1 **değişmez**.
- Muaf'a tıkla → gerekçe istenmeden kaydedilemediğini gör.
- "Yapılmadı" segmentinin kırmızı **olmadığını** gör.
- Izgara altındaki günlük özet bilgi satırının durduğunu gör.

- [ ] **Step 7: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add apps/web/features/homework
git commit -m "feat(web): ödev detay ve kontrol ızgarası ekranı eklendi"
```

---

## Task 13: Web — yükleme görüntüleyici (Ekran 3 · C)

**Files:**
- Create: `apps/web/features/homework/submission-viewer-dialog.tsx`
- Modify: `apps/web/features/homework/tracking-grid.tsx`

**Interfaces:**
- Consumes: `HomeworkTracking`, `useTrackingWriter`, `SUBMISSION_NOTICE`
- Produces: `SubmissionViewerDialog({ tracking, studentId, onClose, onMark })`

- [ ] **Step 1: Geniş modalı kur**

Solda büyük görsel + küçük görsel şeridi; sağda panel: öğrenci adı, yükleme
zamanı (`uploadedAtLabel`), dosya listesi, işaretleme segmenti ve
**"Sonraki yüklemeli öğrenci →"**.

- [ ] **Step 2: Hız akışını kur**

İşaretleme yapılınca görüntüleyici **bir sonraki yüklemesi olan öğrenciye**
geçer — uzaktan kontrolün hız taşıyıcısı budur. Ayrıca açık bir "sonraki" oku
da bulunur.

- [ ] **Step 3: Bilgi satırını ekle**

`SUBMISSION_NOTICE` — "Yükleme durumu değiştirmez — kontrolü siz işaretlersiniz."
Bu satır opsiyonel değildir; brief'in kontrol listesinde ayrı madde.

- [ ] **Step 4: Rehber görünümünde açılmadığını doğrula**

`detail.readOnlyReason === "homeroomView"` iken rozet tıklanabilir olmamalı.
Sunucu zaten `submissions: []` döndürüyor; ekran da rozeti pasif gösterir.

- [ ] **Step 5: Uçtan uca doğrula**

Ceren Şahin satırındaki rozete tıkla → 4 dosya (3 görsel + 1 PDF) görünür,
sayfa göstergesi çalışır, "Dün 21:40" yazar → sağdaki segmentten Tamamlandı
işaretle → görüntüleyici bir sonraki yüklemeli öğrenciye geçer.

- [ ] **Step 6: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add apps/web/features/homework
git commit -m "feat(web): ödev yükleme görüntüleyici eklendi"
```

---

## Task 14: Web — senaryo barı

Gezerek ulaşılamayan durumlar (`loading`, `error`, rehber görünümü, işaretleme
ağ hatası) buradan açılır. `oksis-ui/.claude/skills/scenario-bar/SKILL.md`'i oku
ve prosedürünü uygula.

**Files:**
- Create: `apps/web/mocks/scenarios/homework.ts`
- Modify: `apps/web/dev/scenario-bar/scenario-registry.ts`

- [ ] **Step 1: İstek envanterini çıkar**

`/homework` ekranının tükettiği uçlar: `homework/mine`, `homework/{id}`,
`homework/{id}/tracking`, `homework/{id}/tracking/{studentId}`.

- [ ] **Step 2: Senaryoları yaz**

En az yedi senaryo (kalıcı handler'lara **dokunmadan**, `worker.use` override'ı):

| Senaryo | Override |
|---|---|
| Liste yükleniyor | `mine` → `delay("infinite")` |
| Liste boş | `mine` → `[]` |
| Liste hatası | `mine` → 500 + zarf `errors` |
| Izgara yükleniyor | `tracking` → `delay("infinite")` |
| Rehber öğretmen görünümü | `{id}` → `canMark:false, isReadOnly:true, readOnlyReason:"homeroomView"` + `tracking` → satırlar `submissions: []`, `exemptReason` alanı **yok** |
| İşaretleme ağ hatası | `tracking/{studentId}` PUT → 500 |
| Hepsi işaretli (toplu buton gizli) | `tracking` → `unmarked` satır yok |

Veri elle uydurulmaz: kalıcı defterin kurucularından (`listTracking`,
`toTrackingDto`) map/slice ile **dönüştürülür**.

- [ ] **Step 3: Registry'ye kaydet**

`scenario-registry.ts`'e `/homework` satırını ekle.

- [ ] **Step 4: Doğrula**

`npm run dev -w apps/web` → `/homework` → senaryo barından yedi senaryoyu
tek tek aç, her birinin beklenen ekranı ürettiğini gör. Özellikle:
rehber senaryosunda işaretleme butonlarının **hiç** olmadığını ve muaf
gerekçesinin **görünmediğini** doğrula.

- [ ] **Step 5: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add apps/web/mocks/scenarios/homework.ts apps/web/dev/scenario-bar/scenario-registry.ts
git commit -m "feat(web): ödev ekranı senaryo barı tanımları eklendi"
```

---

## Task 15: Mobil — öğretmen ödev sekmesi (Ekran 2)

**Handoff kapıları:** `oksis-ui/.claude/skills/handoff-mobile/SKILL.md`'i oku.
Mobilde **kapı 1 kritiktir**: kaynak dosya adla değil, `manifest.json` +
`mobile/proto-app.jsx` içindeki `protoScreens()` kaydıyla çözülür. Manifest ile
registry çelişirse **registry kazanır**. Yanlış kaynak seçimi bu projeye iki tam
yeniden yazım maliyeti çıkardı.

**Files:**
- Create: `apps/mobile/src/features/homework/components/homework-tab-screen.tsx`
- Create: `apps/mobile/src/features/homework/components/homework-list-screen.tsx`
- Create: `apps/mobile/src/features/homework/components/homework-parts.tsx`
- Create: `apps/mobile/src/features/homework/index.ts`
- Modify: `apps/mobile/src/app/(tabs)/homework.tsx`
- Modify: `packages/core/src/nav/nav-config.ts:367`

**Interfaces:**
- Consumes: `useMyHomework`, `HOMEWORK_STATUS_CONFIG`, `OVERDUE_STATUS_CONFIG`
- Produces: `HomeworkTabScreen`

- [ ] **Step 1: Kaynağı registry'den çöz**

`manifest.json`'da ödev listesi satırını bul → `mobile/proto-app.jsx` içinde
`protoScreens()` kaydıyla doğrula → bileşenin tanımlı olduğu dosyayı
`mobile/*.jsx` içinde grep'le teyit et. Beklenen: `mobile/homework-list.jsx`.
Çelişki varsa **dur ve bildir**.

- [ ] **Step 2: Ekranı yaz**

Mobil kuralları:
- Stil **NativeWind v4**; `StyleSheet.create` **yasak**.
- Liste **`FlatList`** (gruplu listede `SectionList`); `ScrollView + map` **yasak**.
- Dokunma hedefi min **44×44pt**, istisnasız. Safe area gözetilir.
- Hardcoded Türkçe **yasak** — durum etiketleri `@workspace/core` config'inden.
- Server state Zustand'a **kopyalanmaz**.
- Yatay sayfa kaydırması yok (yalnız çip şeritleri yatay kayar).

Üç durum zorunlu: loading (iskelet) · empty (56×56 daire ikon kalıbı) ·
error (tekrar dene).

- [ ] **Step 3: `homework-tab-screen.tsx`'te rol dispatch'i kur**

Faz A'da yalnız öğretmen dalı. Öğrenci/veli Faz B'de eklenecek; şimdilik o
roller için `PlannedScreen` korunur — yanlış ekran göstermektense planlı kabuk
doğrudur.

- [ ] **Step 4: Sekmeyi gerçek ekrana bağla**

`apps/mobile/src/app/(tabs)/homework.tsx`:

```tsx
import { HomeworkTabScreen } from '@/features/homework';
import { PortalScreen } from '@/features/navigation';

export default function Homework() {
  return (
    <PortalScreen>
      <HomeworkTabScreen />
    </PortalScreen>
  );
}
```

- [ ] **Step 5: Öğretmen sekmesinin `isPlanned` bayrağını kaldır**

`packages/core/src/nav/nav-config.ts:367` — **yalnız öğretmen satırından**:

```ts
    { id: "homework", label: "Ödev", icon: "homework" },
```

Öğrenci (374) ve veli (385) satırları Faz B'ye kadar `isPlanned: true` **kalır**.

- [ ] **Step 6: Doğrula**

Çalıştır: `cd apps/mobile && EXPO_PUBLIC_API_MOCKING=enabled npx expo start`
Öğretmen profiliyle gir → Ödev sekmesi artık "Planlandı" göstermez, dört ödev
listelenir. Öğrenci profiline geç → sekme hâlâ "Planlandı" gösterir.

- [ ] **Step 7: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add apps/mobile/src/features/homework "apps/mobile/src/app/(tabs)/homework.tsx" packages/core/src/nav/nav-config.ts
git commit -m "feat(mobile): öğretmen ödev listesi sekmesi eklendi"
```

---

## Task 16: Mobil — ödev oluştur (Ekran 1)

**Tasarım:** registry'den çöz; beklenen `mobile/homework-create.jsx`.
Hedef: öğretmen teneffüste, tek elle, **60 saniyenin altında** ödev verebilsin.

**Files:**
- Create: `apps/mobile/src/features/homework/components/homework-create-screen.tsx`
- Create: `apps/mobile/src/features/homework/components/student-picker-sheet.tsx`
- Create: `apps/mobile/src/app/homework/create.tsx`
- Modify: `apps/mobile/src/features/homework/index.ts`

- [ ] **Step 1: Kaynağı registry'den çöz** (Task 15 Step 1 ile aynı prosedür)

- [ ] **Step 2: Stack ekranını kur**

İnce üst bar: geri oku (dairesiz), solda başlık **"Yeni Ödev"**, sağda aksiyon
yok. Alt sekme çubuğu bu ekranda **görünmez**.

- [ ] **Step 3: Formu kur**

Web ile **aynı** alan sırası ve **aynı** zod şeması (`homeworkFormSchema`).
Fark yalnız yüzeyde:
- Hedef seçimi **bottom sheet** (web'de popover)
- Yayın onayı **bottom sheet** (web'de dialog) — üç varyantın metni web ile birebir aynı
- Aksiyonlar **alt sabit çubukta**, safe area üstünde

Fazladan alan veya adım **eklenmez** — web bu formun masabaşı hâlidir.

- [ ] **Step 4: Doğrula**

Ödev sekmesi → "Yeni Ödev" → 9-A seç → başlık + "Bu Cuma" → Yayınla →
bottom sheet "30 öğrenci ve velileri" yazar → onayla → listede yeni ödev görünür.

- [ ] **Step 5: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add apps/mobile/src/features/homework apps/mobile/src/app/homework
git commit -m "feat(mobile): ödev oluşturma ekranı eklendi"
```

---

## Task 17: Mobil — detay + kontrol ızgarası (Ekran 3)

**Files:**
- Create: `apps/mobile/src/features/homework/components/homework-detail-screen.tsx`
- Create: `apps/mobile/src/features/homework/components/tracking-row.tsx`
- Create: `apps/mobile/src/features/homework/components/use-tracking-writer.ts`
- Create: `apps/mobile/src/app/homework/[id].tsx`
- Modify: `apps/mobile/src/features/homework/index.ts`

- [ ] **Step 1: Kaynağı registry'den çöz** (beklenen `mobile/homework-detail.jsx`)

- [ ] **Step 2: Satır kontrolünü mobil kurallarına göre kur**

Web'den **bilinçli üç fark** — ihlal edilirse ekran reddedilir:
1. Satırda **üç açık buton**: Tamamlandı / Eksik / Yapılmadı (her biri min 44pt,
   ikon + kısa etiket).
2. **Muaf**, satır sonundaki üç nokta menüsünde — dokununca gerekçe bottom
   sheet'i açılır.
3. **Satır dokunuşuyla durum döngüsü YOKTUR.** Yanlış dokunma riski nedeniyle
   işaretleme yalnız açık butonlarla yapılır. Bu sızarsa ekran reddedilir.

- [ ] **Step 3: Yazma kapısını kur**

Web'deki `use-tracking-writer` ile **aynı davranış sözleşmesi** (optimistic +
geri al + satır içi tekrar dene, toast yok), ama ayrı dosya: mobil satır içi
geri bildirim görsel olarak farklıdır ve `apps/*` birbirinden import edemez.

- [ ] **Step 4: Üst barı ve durumları kur**

Üst bar: geri oku + ödev başlığı (taşarsa kısalt) + sağda üç nokta menüsü
(Düzenle / İptal). Durumlar Ekran 3'ün tamamı: loading · error · işaretleme ağ
hatası · kapandı · rehber salt-okunur · taslak varyantı.

Toplu eylem ve günlük özet bilgi satırı web ile **aynı metinlerle** bulunur.

- [ ] **Step 5: Doğrula**

Listeden "Üslü sayılar çalışma kağıdı" → ızgara açılır → bir satırı işaretle →
sayaç güncellenir, toast **çıkmaz** → üç nokta → Muaf → gerekçe sheet'i açılır →
satır boşluğuna dokun, **hiçbir şey değişmediğini** doğrula.

- [ ] **Step 6: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add apps/mobile/src/features/homework apps/mobile/src/app/homework
git commit -m "feat(mobile): ödev detay ve kontrol ızgarası eklendi"
```

---

## Task 18: Mobil — tam ekran yükleme görüntüleyici

**Files:**
- Create: `apps/mobile/src/features/homework/components/submission-viewer-screen.tsx`
- Create: `apps/mobile/src/app/homework/submissions.tsx`
- Modify: `apps/mobile/src/features/homework/components/tracking-row.tsx`

- [ ] **Step 1: Tam ekran görüntüleyiciyi kur**

Üstte öğrenci adı + yükleme zamanı; ortada görsel (yatay kaydırmayla 3 görsel +
PDF sayfası, sayfa göstergesi "2/4"), pinch-zoom.

- [ ] **Step 2: Alt sabit işaretleme çubuğunu kur**

Tamamlandı / Eksik / Yapılmadı üç butonu. Öğretmen **görsele bakarken**
işaretler; işaretleyince görüntüleyici **bir sonraki yüklemesi olan öğrenciye**
geçer. Ayrıca açık "sonrakine geç" oku bulunur.

- [ ] **Step 3: Bilgi satırını ekle**

`SUBMISSION_NOTICE`.

- [ ] **Step 4: Taze veriyle açıldığını doğrula**

İndirme URL'leri kısa ömürlüdür; görüntüleyici açılışında `tracking` yeniden
çekilir (`useHomeworkTracking` zaten `refetchOnWindowFocus` taşır — açılışta
`refetch()` çağır).

- [ ] **Step 5: Doğrula**

Ceren Şahin rozetine dokun → 4 dosya, "2/4" göstergesi, "Dün 21:40" →
alt çubuktan Tamamlandı → sonraki yüklemeli öğrenciye geçtiğini gör.

- [ ] **Step 6: Typecheck + lint + commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add apps/mobile/src/features/homework apps/mobile/src/app/homework
git commit -m "feat(mobile): ödev yükleme görüntüleyici eklendi"
```

---

## Task 19: Backend borcu belgesi ve faz kapanışı

**Files:**
- Create: `apps/../docs/backend-needs-homework.md` → tam yol:
  `/Users/farukkaya/Repositories/oksis-ui/docs/backend-needs-homework.md`

- [ ] **Step 1: Belgeyi yaz**

Emsal biçim: `docs/backend-needs-session-roster.md`. İçerik:

1. **`homework.write` izni eksik.** `oksis-api`
   `src/Oksis.Infrastructure/Persistence/Seed/MasterData/PermissionSeedData.cs:86-88`
   yalnız `homework.read` ve `homework.manage` taşıyor. Teknik analiz üç izin
   varsayıyor ve "öğretmen yazar / yönetici yönetir" ayrımı buna dayanıyor.
   Rol eşlemesi: SchoolAdmin read+write+manage · Teacher read+write ·
   Student read · Parent read.
2. **Sözleşmenin kaynağı.** `packages/api/src/homework/contract.ts` (wire şekli)
   ve `packages/api-mocks/src/homework/homework-handlers.ts` (davranış).
   `homework-handlers.test.ts` backend'in **kabul kriteridir** — `.NET` handler'ları
   bu testlerin tarif ettiği davranışı üretmelidir.
3. **Faz A'da kullanılan on iki uç** ve karşılık gelen CQRS handler adları
   (teknik analiz §3.3 uç 1,2,3,5,6,7,8,9,10,11,12,13).
4. **Açık `[D]`/`[KB]` maddeleri:** rehberlik ataması hangi tabloda ·
   `SchoolSettings.TimeZone` var mı · Files modülünde `StoredFile.UploadedBy`
   var mı.

- [ ] **Step 2: Tüm testleri çalıştır**

Çalıştır: `cd /Users/farukkaya/Repositories/oksis-ui && npx vitest run`
Beklenen: tamamı yeşil — özellikle `grade` testleri (Task 3'ün terfisi onları
kırmamalı).

- [ ] **Step 3: Typecheck + lint**

Çalıştır: `npm run typecheck && npm run lint`
Beklenen: ikisi de yeşil.

- [ ] **Step 4: Faz A çıkış kriterini uçtan uca doğrula**

**Web** (`npm run dev -w apps/web`, öğretmen):
ödev oluştur → yayınla → listede gör → detaya gir → ızgarada işaretle →
sayaçlar güncellensin → yükleme görüntüleyiciyi aç → sonraki yüklemeli
öğrenciye geç → senaryo barından yedi senaryoyu gez.

**Mobil** (`EXPO_PUBLIC_API_MOCKING=enabled npx expo start`, öğretmen):
aynı zincir + satır dokunuşuyla durum değişmediğini doğrula.

Bulunan her kusuru düzelt; hiçbirini "sonra" diye bırakma.

- [ ] **Step 5: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add docs/backend-needs-homework.md
git commit -m "docs(repo): ödev modülü backend borcu belgelendi"
```

- [ ] **Step 6: Kullanıcıya teslim**

Faz A'nın çıktısını özetle: hangi ekranlar gezilebilir, hangi senaryolar
mevcut, hangi kusurlar bulundu ve düzeltildi. **Faz B'ye kendiliğinden geçme** —
Faz B'nin başında `expo-document-picker` / `expo-image-manipulator` kararı
kullanıcıya sorulmalıdır.

---

## Self-Review Notları

**Spec kapsamı:** §3.1 → Task 1-2 · §3.2 → Task 4-6 · §3.3 → Task 7-8 ·
§3.4 (roster terfisi) → Task 3 · §4 (mock kalite sözleşmesi) → Task 8 testleri ·
§5.1-5.2 → Task 10, 12, 15, 17 · §5.3 (gezinti) → Task 10 Step 6, Task 15 Step 5 ·
§5.4 (Ekran 3 UX) → Task 12-13, 17-18 · §5.5 (ürün kuralları) → Global
Constraints + her ekran task'ının doğrulama adımı · §5.6 (marka kapısı) →
Task 10, 11, 15 handoff adımları · §6 Faz A → Task 1-19 · §7 (backend borcu) →
Task 19.

**Faz A dışında bırakılanlar (bilinçli):** uç 4 (`publish-for`, idare vekâleti)
ve 20-25 (yönetici + ayarlar) Faz C'de; uç 14-19 (öğrenci/aile/yükleme) Faz B'de.
`homework-settings` sözleşmesi Faz C'de yazılır — alanları teknik analiz §3.8'den
okunacak, bu planda **uydurulmadı**.

**Tip tutarlılığı:** `HomeworkListItem`/`HomeworkDetail`/`HomeworkTracking`
Task 1'de tanımlandı, Task 5'te DTO'dan üretiliyor, Task 6'da hook'lara,
Task 10-18'de ekranlara aynı adlarla taşınıyor. `computeCounters` Task 7'de
tanımlı, Task 8'in tüm sayaç testleri onu okuyor.
