# Sınav Takvimi (Exams) Modülü — Faz 1 Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Ayrıca zorunlu:** her web görevinden önce `oksis-ui/.claude/skills/handoff-web`, her mobil görevden önce `handoff-mobile` skill'i. Bu plan dört kapıyı **domain seviyesinde** bir kez geçmiştir (aşağıdaki Handoff Intake Report); her ekran kendi gate-2/gate-3 envanterini yine yapar.

**Goal:** Sınav takvimi modülünün `lessonHour` (ders saatinde sınav) modunu uçtan uca teslim etmek: sunucuda pencere/planlı sınav/saat isteği omurgası, kural denetleyicisi ve iki adımlı yayın; istemcide yönetici panosu, öğretmen yerleştirme, saat istekleri, ders programı sınav etiketi ve öğrenci/veli takvimi.

**Architecture:** Yeni `Exams` modülü `oksis-api`'de Clean Architecture + CQRS kalıbıyla (Domain entity + durum makinesi → Application command/query + `ExamRuleInspector` → Api controller). Modül Grades, Timetable ve Attendance modüllerini **yalnız okur**; onlara domain event ile haber verir, tablolarına yazmaz. İstemcide `oksis-ui` katmanları: domain beyni `packages/core/src/exam/`, veri erişimi `packages/api/src/exam/`, görünüm `apps/web/features/exam/` ve `apps/mobile/src/features/exam/`. Her dilimde **önce sunucu, sonra ekran** — ekran mock'la değil gerçek uçla açılır.

**Tech Stack:** .NET 10 · EF Core 10 · MSSQL 2022 · MediatR · FluentValidation · Mapster · Hangfire · xUnit + FluentAssertions + NSubstitute · TypeScript strict · TanStack Query · Zod · Next.js 16 · Expo SDK 57 · MSW

**Spec:** `oksis/docs/superpowers/specs/2026-09-08-sinav-takvimi-modulu-design.md` (K-1…K-13, EX-H/EX-S kural tablosu, 3 faz). Tasarım kaynağı: Claude Design `Oksis Layout v2` (`7d876f6c-70ee-4894-bac1-2be5c96dd34a`), brief `uploads/sinav-takvimi-brief.md`, ekran dosyaları `web/exam-*.jsx` + `mobile/exam-schedule*.jsx`. Tasarım dosyaları **DesignSync** ile okunur (`method: "get_file"`), zip indirilmez.

---

## Global Constraints

Her görevin gereksinimleri bunları **örtük olarak** içerir.

1. **Tenant izolasyonu kırmızı çizgi.** Her yeni entity `IHasTenant` + `TenantEntity` tabanı; global query filter ve `TenantSaveChangesInterceptor` devrede. `IgnoreQueryFilters()` gerekçesiz YASAK.
2. **Kural sunucuda.** Ekranın uyguladığı ama sunucunun bilmediği kural yok sayılır. Her EX-H/EX-S kodunun sunucu tarafında testi vardır; ekran yalnız sunucunun döndürdüğü ihlali çizer, kendi kuralını üretmez.
3. **AutoMapper YASAK** (Mapster) · **Repository wrapper YASAK** (`IApplicationDbContext`) · **Lazy loading YASAK** (explicit `Include`/projection) · **Domain'de EF/DataAnnotations YASAK** (fluent config) · **Controller'da DbContext YASAK** (`ISender`) · `async void`, `.Result`, `.Wait()` YASAK.
4. **Zaman = zil ızgarası.** Sınavın zamanı `(DateOnly Date, int Period)` çiftidir. Serbest `TimeOnly` aralığı YOK. Saat metni zil çizelgesinden (`ayarlar_zil` kaynağı) türetilir, sınav kaydında saklanmaz.
5. **Ders programı yazılmaz.** `ScheduleException` üretilmez, `LessonPlacement` değiştirilmez. Sınav yalnız okur ve etiket projeksiyonu döndürür.
6. **Wire şekli korunur (R11).** Alan adları İngilizce ve tasarım mock'uyla aynı; id görünümlü string **string** kalır. Tasarımın mock alan adları bu planın Task 1'inde sözleşmeye çevrildi; sonraki hiçbir görev alan adını yeniden adlandırmaz.
7. **Durum matrisi eksiksiz (R8).** Her ekran `loading / empty / error` + kendi özel hâllerini **gerçek query state'ine** bağlar, yerel bayrağa değil.
8. **Ham hex component'te yok.** Web: `packages/ui/src/styles/exam.css` içinde scoped CSS değişkeni. Mobil: `apps/mobile/src/theme/tokens.ts`. Ekran dosyasında hex yasak. **Yeni renk/ikon/font üretilmez**; ders tonu mevcut `SUBJECT_PALETTE` + `subjectColorIndex` ile gelir, ikinci palet açılmaz.
9. **Koyu tema teslim edilmez** (2026-08-19 kullanıcı kararı).
10. **Türkçe arayüz metni, İngilizce identifier.** Yorumlar Türkçe ve tanım noktasında. Sözlük: sınav penceresi = `examWindow`, planlı sınav = `scheduledExam`, saat isteği = `hourRequest`. Arayüzde **"sınav"**, asla "yazılı".
11. **Test koşumu:** `oksis-api` günlük döngüde `./scripts/test-changed.sh` (entegrasyon yalnız `--integration`), `dotnet test` yalnız bilinçli. `oksis-ui` bitiş öncesi `npm run typecheck && npm run lint`.
12. **Commit:** `<type>(<scope>): türkçe açıklama` — sonda nokta yok, ≤90 karakter. Scope `oksis-api`'de `exams`, `oksis-ui`'de {`core`,`api`,`mobile`,`web`,`ui`}. İmza iki satır (`Co-Authored-By` + `Claude-Session`).
13. **Faz 2 (kelebek/oturum) kapsam dışı.** `ExamSession`, `RoomAllocation`, `Seat`, `Invigilation` bu planda **yazılmaz**. `ExamWindow.Mode` alanı iki değeri de taşır ama `session` modunda pencere yalnız oluşturulup yayınlanamaz; ilgili uçlar `NotImplemented` değil, **kural hatası** döndürür ("Oturum modu henüz kullanılamıyor").

---

## Handoff Intake Report (domain seviyesi)

### 1. Kaynak çözümleme — GEÇTİ

Tasarım projesinde Faz 1'in tamamı teslim edilmiş (2026-09-08 taraması):

| Dosya | Rol |
|---|---|
| `web/exam-data.jsx` | Ortak mock + sabitler + rozet bileşenleri — **sözleşmenin kaynağı** |
| `web/exam-windows.jsx` | Yönetici pencere hub'ı |
| `web/exam-window-modals.jsx` | Pencere oluştur / iki yayın onayı / ön koşul listesi |
| `web/exam-board.jsx` | Yönetici sınav panosu |
| `web/exam-place.jsx` | Öğretmen yerleştirme |
| `web/exam-hour-requests.jsx` | Saat istekleri (iki sekme) |
| `web/exam-schedule-tag.jsx` | Ders programı hücre etiketi |
| `web/exam-policy-card.jsx` | Ayarlar › Sınav Takvimi kartı |
| `web/exam.css` | Modül stilleri |
| `mobile/exam-schedule.jsx` | Öğrenci/veli sınav takvimi |
| `mobile/exam-schedule-tag.jsx` | Mobil program hücre etiketi |

Faz 2 dosyaları (`exam-sessions`, `exam-seating`) **yok** — brief öyle istedi, doğru.

### 2. Sözleşme sapmaları — Task 1'de kapatılır

Tasarımın mock'u brief'i izlemiş ve alan adları spec ile büyük ölçüde aynı. Üç sapma var; **spec kazanır, mock düzeltilir**:

| # | Sapma | Karar |
|---|---|---|
| D-1 | `EXAM_PLACEMENT_STATUS` beş değer taşıyor: `placed`, `unplaced`, `pendingRequest`, `declined`, `moved`. Spec'te `PlacementState` üç değerlidir ve saat isteği **ayrı eksendir**. | Sunucu iki alanı ayrı döndürür: `placementState: "placed"｜"unplaced"｜"moved"` ve `hourRequestStatus: "notNeeded"｜"pending"｜"accepted"｜"declined"｜"expired"`. Rozet metnini **istemci** iki alandan türetir (`examPlacementBadge()` — `packages/core`'da saf fonksiyon, testli). |
| D-2 | Mock'taki ihlal örnekleri kod tablosuyla uyuşmuyor: `EX-H05` mesajı reddedilen saat isteğini, `EX-S02` taşınan sınavı, `EX-S04` art arda iki saati anlatıyor. Spec'te bu kodlar başka kuralları gösteriyor. | **Spec tablosu kanondur.** Ek olarak iki yeni kod tanımlanır: `EX-H09` (saat isteği reddedildi/düştü, sınav yerleşmedi) ve `EX-S06` (yayınlanmış programda yerleşim taşındı). Mesaj metnini **sunucu üretir**, istemci hardcode etmez. |
| D-3 | `hourRequest.direction` ve `expiresAt` mock'ta var, spec'te yok. | Kabul edilir: `direction` sunucuda **bakan kullanıcıya göre** hesaplanır (`incoming`/`outgoing`), `expiresAt` pencerenin `draftDueDate`'inden türetilir. İkisi de kolon DEĞİLDİR, projeksiyon alanıdır. |

Ayrıca tasarım, spec'in açık bıraktığı `[S-1]` noktasını **cevaplamış**: yayınlanmış programda yerleşim taşınırsa sınav silinmez, `moved` hâline düşer ve sahibine bildirim gider. Bu plan o kararı uygular.

### 3. Backend durumu — SIFIR

`src/Oksis.Domain/Modules/` ve `src/Oksis.Application/Modules/` altında `Exams` klasörü yok. Bağlanılacak mevcut yüzeyler: `Grades` (`Assessment.SetExamDate`), `Timetable` (`LessonPlacement`, `ScheduleProgram`), `Attendance` (`AttendanceSession`), `Notifications` (kind + push eşlemesi + seed).

---

## Dilim haritası

| Dilim | Görevler | Teslim |
|---|---|---|
| **0 · Sözleşme** | 0.1–0.2 | `packages/core/src/exam/` tipleri + saf mantık + testleri. İki tarafın alan adları kilitlenir. |
| **1 · Omurga** | 1.1–1.7 | Pencere + planlı sınav + saat isteği; öğretmen yerleştirme uçları. Ekran: pencere hub'ı + yerleştirme. |
| **2 · Kural ve yayın** | 2.1–2.5 | Kural denetleyicisi, iki adımlı yayın, pano projeksiyonu, revizyon. Ekran: pano, saat istekleri, yayın modali. |
| **3 · Bağlar** | 3.1–3.6 | Not modülü tarih beslemesi, program etiketi, bildirimler + sweep'ler. Ekran: web/mobil etiket, öğrenci takvimi. |
| **4 · Politika** | 4.1–4.2 | Okul ayarları alanları + kilit. Ekran: politika kartı. |

Her dilim **sunucu görevleriyle başlar**, ekran görevleri aynı dilimin sonundadır. Bir dilim bitmeden sonrakine geçilmez.

---

# Dilim 0 · Sözleşme

### Görev 0.1: `packages/core/src/exam/` — tipler, sabitler, saf mantık

**Files:**
- Create: `packages/core/src/exam/types.ts`
- Create: `packages/core/src/exam/constants.ts`
- Create: `packages/core/src/exam/logic.ts`
- Create: `packages/core/src/exam/logic.test.ts`
- Modify: `packages/core/src/index.ts` (grade bloğunun ardına `export * from "./exam/..."` dört satırı)

**Interfaces:**
- Consumes: yok — bu paket React/DOM/fetch içermez, saf TypeScript'tir.
- Produces: `ExamWindow`, `ScheduledExam`, `ExamHourRequest`, `ExamViolation`, `ExamPolicy`, `ExamBadge` tipleri; `EXAM_WINDOW_STATUS`, `EXAM_MODES`, `EXAM_PLACEMENT_STATUS`, `EXAM_HOUR_REQUEST_STATUS` sabitleri; `examPlacementBadge()`, `examWindowProgress()`, `groupExamsByDay()` fonksiyonları.

**Neden ilk görev bu:** iki tarafın alan adı burada kilitlenir. Tasarımın mock'u (`web/exam-data.jsx`) kaynak alınır ama üç sapma (D-1, D-2, D-3) **spec lehine** düzeltilir. `packages/api` bu dilimde YAZILMAZ — HTTP katmanı, arkasındaki uç gerçekten var olduğunda kendi diliminde yazılır. Mock-first'e dönülmez.

- [ ] **Adım 1: Testi yaz**

```ts
import { describe, expect, it } from "vitest"
import { examPlacementBadge, examWindowProgress, groupExamsByDay } from "./logic"

describe("examPlacementBadge", () => {
  it("bekleyen saat isteği yerleşim sayılmaz", () => {
    const b = examPlacementBadge({ placementState: "unplaced", hourRequestStatus: "pending" })
    expect(b.key).toBe("pendingRequest")
    expect(b.tone).toBe("warning")
  })

  it("reddedilen istek ayrı hâldir", () => {
    expect(examPlacementBadge({ placementState: "unplaced", hourRequestStatus: "declined" }).key)
      .toBe("declined")
  })

  it("kabul edilmiş istek yerleşmiş sınavdır", () => {
    expect(examPlacementBadge({ placementState: "placed", hourRequestStatus: "accepted" }).key)
      .toBe("placed")
  })

  it("taşınan sınav istekten bağımsızdır", () => {
    expect(examPlacementBadge({ placementState: "moved", hourRequestStatus: "notNeeded" }).key)
      .toBe("moved")
  })
})

describe("examWindowProgress", () => {
  it("toplam sıfırken yüzde sıfırdır, bölme hatası vermez", () => {
    expect(examWindowProgress({ placedCount: 0, totalCount: 0 })).toEqual({ pct: 0, full: false })
  })

  it("tamamlanan pencere full döner", () => {
    expect(examWindowProgress({ placedCount: 14, totalCount: 14 })).toEqual({ pct: 100, full: true })
  })
})

describe("groupExamsByDay", () => {
  it("aynı güne düşen sınavlar tek başlık altında toplanır ve saat sırasına girer", () => {
    const rows = [
      { id: "a", date: "2027-03-10", period: 5 },
      { id: "b", date: "2027-03-09", period: 2 },
      { id: "c", date: "2027-03-10", period: 3 },
    ]
    const days = groupExamsByDay(rows)
    expect(days.map((d) => d.date)).toEqual(["2027-03-09", "2027-03-10"])
    expect(days[1]!.exams.map((e) => e.id)).toEqual(["c", "a"])
  })

  it("tarihi olmayan sınav hiçbir güne düşmez", () => {
    expect(groupExamsByDay([{ id: "a", date: null, period: null }])).toEqual([])
  })
})
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Çalıştır: `cd packages/core && npx vitest run src/exam/logic.test.ts`
Beklenen: FAIL — `./logic` bulunamıyor.

- [ ] **Adım 3: Tipleri yaz**

```ts
// Sınav takvimi (exam) modülü domain tipleri.
// Kaynak: Claude Design "Oksis Layout v2" — web/exam-data.jsx (mock) + spec
// oksis/docs/superpowers/specs/2026-09-08-sinav-takvimi-modulu-design.md.
// Mock ile spec üç yerde ayrışıyordu; SPEC KAZANDI (plan §Handoff D-1/D-2/D-3).
//
// Kavram dörtlüsü, karıştırma:
//   Sınav penceresi (ExamWindow)  = dönem × sınav türü — YAYIN BİRİMİ, durum makinesi burada
//   Planlı sınav (ScheduledExam)  = pencere × şube × ders — tek satır, tek sınav
//   Saat isteği (ExamHourRequest) = ödünç saat için ev sahibi öğretmene giden istek
//   Sınav etiketi (ExamBadge)     = ders programı hücresinin üstüne binen rozet

/** Pencerenin durum makinesi. Dört hâl; geçişler sunucuda. */
export type ExamWindowStatus = "draft" | "windowPublished" | "schedulePublished" | "locked"

/** İki mod tek omurga: ders saatinde sınav ya da oturum (kelebek). Faz 1 yalnız ilkini uygular. */
export type ExamMode = "lessonHour" | "session"

/**
 * Sınav yerleşti mi? Saat isteğinden BAĞIMSIZ eksendir (D-1).
 * `moved` = yayınlanmış programda ev sahibi ders saati taşındı; sınav silinmedi.
 */
export type ExamPlacementState = "unplaced" | "placed" | "moved"

/** Ödünç saat isteğinin akıbeti. `notNeeded` = kendi saatinde sınav, istek hiç doğmadı. */
export type ExamHourRequestStatus =
  | "notNeeded" | "pending" | "accepted" | "declined" | "expired"

export interface ExamWindow {
  id: string
  seasonId: string
  termId: string
  examTypeId: string
  examTypeName: string
  /** Yerel ISO gün, "YYYY-MM-DD". */
  startDate: string
  endDate: string
  mode: ExamMode
  status: ExamWindowStatus
  version: number
  draftDueDate: string
  /** Yalnız oturum modunda dolu; Faz 1'de her zaman null. */
  reviewOpensAt: string | null
  reviewClosesAt: string | null
  placedCount: number
  totalCount: number
  pendingRequestCount: number
  violationCount: number
  /** Bugünden ilk sınava kaç gün; geçmiş pencerede negatif. Sunucu hesaplar. */
  daysUntilFirstExam: number | null
}

export interface ScheduledExam {
  id: string
  windowId: string
  sectionId: string
  sectionName: string
  courseId: string
  courseName: string
  /** Yerleşmemiş sınavda null. */
  date: string | null
  period: number | null
  ownerTeacherId: string
  ownerTeacherName: string
  /** Ödünç saatte ev sahibi öğretmen; yerleşmemişse null. */
  administeringTeacherId: string | null
  administeringTeacherName: string | null
  isBorrowedHour: boolean
  hourRequestStatus: ExamHourRequestStatus
  placementState: ExamPlacementState
  /** Şubenin kendi dersliği; kelebekte Faz 2'de değişir. */
  roomName: string | null
}

/** İstek satırı. `direction` bakan kullanıcıya göre SUNUCUDA hesaplanır (D-3). */
export interface ExamHourRequest {
  id: string
  windowId: string
  examId: string
  direction: "incoming" | "outgoing"
  requesterTeacherId: string
  requesterTeacherName: string
  hostTeacherId: string
  hostTeacherName: string
  sectionName: string
  courseName: string
  examTypeName: string
  /** Ev sahibinin o saatteki kendi dersi — "Tarih saatiniz" cümlesini kurar. */
  hostCourseName: string
  date: string
  period: number
  status: ExamHourRequestStatus
  /** Ret gerekçesi; kabul edilende null. */
  reason: string | null
  answeredAt: string | null
  /** Pencerenin draftDueDate'i — istek bu gün düşer. */
  expiresAt: string
}

/**
 * Kural ihlali. Kod ve metin SUNUCUDAN gelir; istemci metin üretmez (D-2).
 * `hard` yazmayı engeller, `soft` gerekçeyle geçilir.
 */
export interface ExamViolation {
  code: string
  severity: "hard" | "soft"
  message: string
  examId: string | null
  sectionName: string | null
}

export interface ExamPolicy {
  minPublishLeadDays: number
  maxExamsPerSectionPerDay: number
  reviewWindowDays: number
  draftDueLeadDays: number
  defaultMode: ExamMode
}

/**
 * Ders programı hücresine binen etiket. Rol farkı ALANLARDA taşınır:
 * öğrenci `roomName`+`seatNo` görür, gözetmen `invigilationRoomName` görür (Faz 2).
 */
export interface ExamBadge {
  examId: string
  date: string
  period: number
  courseId: string
  courseName: string
  examTypeName: string
  roomName: string | null
  seatNo: number | null
  invigilationRoomName: string | null
  /** Yayından sonra taşınmışsa "güncellendi" işareti çıkar. */
  isMoved: boolean
}
```

- [ ] **Adım 4: Sabitleri yaz**

```ts
import type { ExamHourRequestStatus, ExamMode, ExamWindowStatus } from "./types"

/** Renk tek başına anlam taşımaz: her hâl kendi metnini ve açıklamasını taşır. */
export const EXAM_WINDOW_STATUS: Record<ExamWindowStatus, { label: string; tone: string; desc: string }> = {
  draft: { label: "Taslak", tone: "", desc: "Öğrenci ve veli henüz hiçbir şey görmüyor." },
  windowPublished: { label: "Pencere yayında", tone: "warning", desc: "Öğrenci ve veli hafta bilgisini görüyor, ayrıntı yayınlanmadı." },
  schedulePublished: { label: "Takvim yayında", tone: "success", desc: "Tarih, ders saati ve derslik görünür." },
  locked: { label: "Kilitli", tone: "", desc: "Pencere kapandı; değişiklik yapılamaz." },
}

export const EXAM_MODES: Record<ExamMode, { label: string; desc: string }> = {
  lessonHour: { label: "Ders saatinde", desc: "Sınav dersin kendi saatinde, kendi sınıfında yapılır. Yazan öğretmendir." },
  session: { label: "Oturum", desc: "Ders saatleri oturuma dönüşür, öğrenciler dersliklere dağıtılır. Yazan yöneticidir." },
}

export const EXAM_HOUR_REQUEST_STATUS: Record<ExamHourRequestStatus, { label: string; tone: string }> = {
  notNeeded: { label: "Gerekmiyor", tone: "" },
  pending: { label: "Cevap bekliyor", tone: "warning" },
  accepted: { label: "Kabul edildi", tone: "success" },
  declined: { label: "Reddedildi", tone: "danger" },
  expired: { label: "Süresi geçti", tone: "danger" },
}

/** Rozet anahtarları — iki eksenin BİRLEŞİMİ, tek eksen değil (D-1). */
export const EXAM_PLACEMENT_STATUS = {
  placed: { label: "Yerleşti", tone: "success", icon: "check" },
  unplaced: { label: "Yerleşmedi", tone: "warning", icon: "circleDash" },
  pendingRequest: { label: "Saat isteği bekliyor", tone: "warning", icon: "clock" },
  declined: { label: "Saat isteği reddedildi", tone: "danger", icon: "alert" },
  expired: { label: "Saat isteği düştü", tone: "danger", icon: "alert" },
  moved: { label: "Program değişti", tone: "danger", icon: "alert" },
} as const

export type ExamPlacementBadgeKey = keyof typeof EXAM_PLACEMENT_STATUS
```

- [ ] **Adım 5: Saf mantığı yaz**

```ts
import { EXAM_PLACEMENT_STATUS, type ExamPlacementBadgeKey } from "./constants"
import type { ExamHourRequestStatus, ExamPlacementState } from "./types"

/**
 * İki ekseni tek rozete indirger (D-1). Sunucu iki alanı AYRI döndürür; birleştirme
 * bir sunum kararıdır ve tek yerde yaşar — ekranlar kendi `if` zincirini kurmaz.
 */
export function examPlacementBadge(input: {
  placementState: ExamPlacementState
  hourRequestStatus: ExamHourRequestStatus
}): { key: ExamPlacementBadgeKey; label: string; tone: string; icon: string } {
  const key: ExamPlacementBadgeKey =
    input.placementState === "moved"
      ? "moved"
      : input.placementState === "placed"
        ? "placed"
        : input.hourRequestStatus === "pending"
          ? "pendingRequest"
          : input.hourRequestStatus === "declined"
            ? "declined"
            : input.hourRequestStatus === "expired"
              ? "expired"
              : "unplaced"

  return { key, ...EXAM_PLACEMENT_STATUS[key] }
}

/** Pencere ilerlemesi. Toplam sıfırken sıfıra bölme yok. */
export function examWindowProgress(w: { placedCount: number; totalCount: number }): {
  pct: number
  full: boolean
} {
  const pct = w.totalCount ? Math.round((w.placedCount / w.totalCount) * 100) : 0
  return { pct, full: w.totalCount > 0 && w.placedCount === w.totalCount }
}

/**
 * Aynı güne düşen sınavları tek başlık altında toplar; gün artan, gün içi ders saati artan.
 * Tarihi olmayan (yerleşmemiş) sınav hiçbir güne düşmez — öğrenciye "tarihi yok" diye
 * bir gün kartı göstermek yanlış olurdu.
 */
export function groupExamsByDay<T extends { date: string | null; period: number | null }>(
  exams: readonly T[],
): Array<{ date: string; exams: T[] }> {
  const byDay = new Map<string, T[]>()
  for (const exam of exams) {
    if (!exam.date) continue
    const list = byDay.get(exam.date)
    if (list) { list.push(exam) } else { byDay.set(exam.date, [exam]) }
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({
      date,
      exams: list.sort((a, b) => (a.period ?? 0) - (b.period ?? 0)),
    }))
}
```

- [ ] **Adım 6: Merkezî export'a ekle**

`packages/core/src/index.ts` içinde grade bloğunun ardına:

```ts
// Sınav takvimi (exam) — pencere, planlı sınav, saat isteği, program etiketi.
// Backend Faz 1 ile birlikte yazılıyor; bu paket yalnız tip ve saf mantık taşır.
export * from "./exam/types"
export * from "./exam/constants"
export * from "./exam/logic"
```

> **İleri referans:** `packages/core/src/grade/types.ts` içindeki `ExamScheduleItem` /
> `ExamScheduleDay` tipleri bu modülün ÖNCÜSÜDÜR ve Görev 3.5'te emekliye ayrılır.
> Bu görevde onlara DOKUNMA — iki tip bir süre yan yana yaşar.

- [ ] **Adım 7: Testi koştur, yeşil olduğunu gör**

Çalıştır: `cd packages/core && npx vitest run src/exam/logic.test.ts`
Beklenen: 8 test PASS.

- [ ] **Adım 8: Kalite kapısı ve commit**

```bash
npm run typecheck && npm run lint
git add packages/core/src/exam packages/core/src/index.ts
git commit -m "feat(core): sınav takvimi tipleri, sabitleri ve rozet/gruplama mantığı"
```

---

# Dilim 1 · Omurga

### Görev 1.1: `ExamWindow` entity ve durum makinesi

**Files:**
- Create: `src/Oksis.Domain/Modules/Exams/Entities/ExamWindow.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Enums/ExamWindowStatus.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Enums/ExamMode.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Exceptions/ExamsDomainException.cs` (soyut taban + `InvalidExamDataException` + `InvalidExamWindowStateException`)
- Create: `src/Oksis.Domain/Modules/Exams/Events/ExamWindowPublishedEvent.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Events/ExamSchedulePublishedEvent.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Exams/ExamWindowTests.cs`

**Interfaces:**
- Consumes: `TenantEntity` (`Oksis.Domain.Common`), `DomainEvent` kalıbı — emsal `src/Oksis.Domain/Modules/Grades/Entities/Assessment.cs`.
- Produces: `ExamWindow.Create(...)`, `PublishWindow(Guid byPersonId, DateTimeOffset at)`, `PublishSchedule(Guid byPersonId, DateTimeOffset at, string? reason)`, `Revise(string reason, Guid byPersonId, DateTimeOffset at)`, `Lock(string reason, Guid byPersonId, DateTimeOffset at)`; enum `ExamWindowStatus { Draft=1, WindowPublished=2, SchedulePublished=3, Locked=4 }`, `ExamMode { LessonHour=1, Session=2 }`.

- [ ] **Adım 1: Yasak geçişleri çiviyen testi yaz**

```csharp
public sealed class ExamWindowTests
{
    private static ExamWindow NewDraft() => ExamWindow.Create(
        schoolId: Guid.NewGuid(), academicSessionId: Guid.NewGuid(), academicTermId: Guid.NewGuid(),
        examTypeId: Guid.NewGuid(), startDate: new DateOnly(2027, 3, 9), endDate: new DateOnly(2027, 3, 12),
        mode: ExamMode.LessonHour, draftDueDate: new DateOnly(2027, 2, 23));

    [Fact]
    public void Should_Throw_When_ScheduleIsPublishedBeforeWindow()
    {
        var w = NewDraft();
        var act = () => w.PublishSchedule(Guid.NewGuid(), DateTimeOffset.UtcNow, reason: null);
        act.Should().Throw<ExamsDomainException>()
            .WithMessage("*pencere yayınlanmadan*");
    }

    [Fact]
    public void Should_BumpVersion_When_Revised()
    {
        var w = NewDraft();
        w.PublishWindow(Guid.NewGuid(), DateTimeOffset.UtcNow);
        w.PublishSchedule(Guid.NewGuid(), DateTimeOffset.UtcNow, reason: null);
        var before = w.Version;
        w.Revise("9-B Matematik sınavı 13 Mart'a alındı", Guid.NewGuid(), DateTimeOffset.UtcNow);
        w.Version.Should().Be(before + 1);
        w.Status.Should().Be(ExamWindowStatus.SchedulePublished);
    }

    [Fact]
    public void Should_Throw_When_LockedWindowIsRevised()
    {
        var w = NewDraft();
        w.PublishWindow(Guid.NewGuid(), DateTimeOffset.UtcNow);
        w.PublishSchedule(Guid.NewGuid(), DateTimeOffset.UtcNow, reason: null);
        w.Lock("Dönem kapandı, sınavlar tamamlandı", Guid.NewGuid(), DateTimeOffset.UtcNow);
        var act = () => w.Revise("gerekçe yeterince uzun", Guid.NewGuid(), DateTimeOffset.UtcNow);
        act.Should().Throw<InvalidExamWindowStateException>(
            "kilitli pencere revize edilemez; gerekçe uzunluğu hatası bu testi maskelememeli");
    }

    [Fact]
    public void Should_Throw_When_ReasonIsTooShort()
    {
        var w = NewDraft();
        w.PublishWindow(Guid.NewGuid(), DateTimeOffset.UtcNow);
        w.PublishSchedule(Guid.NewGuid(), DateTimeOffset.UtcNow, reason: null);
        var act = () => w.Revise("kısa", Guid.NewGuid(), DateTimeOffset.UtcNow);
        act.Should().Throw<ExamsDomainException>();
    }
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Çalıştır: `./scripts/test-changed.sh --filter ExamWindowTests`
Beklenen: derleme hatası — `ExamWindow` yok.

- [ ] **Adım 3: Enum'ları ve exception'ı yaz**

```csharp
// ExamWindowStatus.cs — sayısal değerler kalıcıdır, araya ekleme yapılmaz.
public enum ExamWindowStatus { Draft = 1, WindowPublished = 2, SchedulePublished = 3, Locked = 4 }

// ExamMode.cs
public enum ExamMode { LessonHour = 1, Session = 2 }

// ExamsDomainException.cs — DÜZ Exception DEĞİL.
// Gerekçe: ExceptionHandlingMiddleware yalnız DomainException'ı 422 {code, message}'a
// çevirir; düz Exception 500 InternalError döndürürdü. Grades/Timetable kalıbı.
public abstract class ExamsDomainException(string code, string message)
    : DomainException(code, message);

/// <summary>Girdi geçersiz: tarih sırası bozuk, gerekçe kısa, ders saati pozitif değil.</summary>
public sealed class InvalidExamDataException(string message)
    : ExamsDomainException("validation", message);

/// <summary>Durum makinesi geçişi geçersiz.</summary>
public sealed class InvalidExamWindowStateException(string message)
    : ExamsDomainException("invalid_state", message);
```

- [ ] **Adım 4: `ExamWindow`'u yaz**

```csharp
/// <summary>
/// Sınav penceresi — <b>yayın birimi budur</b>. İki adımlı yayın taşır: pencere yayını
/// haftayı duyurur, takvim yayını ayrıntıyı açar.
/// Tekillik: <c>(AcademicTermId, ExamTypeId)</c>.
/// </summary>
public sealed class ExamWindow : TenantEntity
{
    /// <summary>Revizyon ve kilit gerekçesi asgari uzunluğu — Grades'teki eşikle aynı.</summary>
    public const int MinReasonLength = 15;

    public Guid AcademicSessionId { get; private set; }
    public Guid AcademicTermId { get; private set; }
    public Guid ExamTypeId { get; private set; }
    public DateOnly StartDate { get; private set; }
    public DateOnly EndDate { get; private set; }
    public ExamMode Mode { get; private set; }
    public ExamWindowStatus Status { get; private set; }
    public int Version { get; private set; }

    /// <summary>Taslak tamamlanma hedefi; cevapsız saat istekleri bu tarihte düşer.</summary>
    public DateOnly DraftDueDate { get; private set; }

    public DateOnly? ReviewOpensAt { get; private set; }
    public DateOnly? ReviewClosesAt { get; private set; }

    public DateTimeOffset? WindowPublishedAt { get; private set; }
    public Guid? WindowPublishedByPersonId { get; private set; }
    public DateTimeOffset? SchedulePublishedAt { get; private set; }
    public Guid? SchedulePublishedByPersonId { get; private set; }
    /// <summary>7 gün kuralının altında yayınlandıysa gerekçe zorunludur (EX-H08).</summary>
    public string? PublishReason { get; private set; }
    public DateTimeOffset? LockedAt { get; private set; }
    public Guid? LockedByPersonId { get; private set; }
    public string? LockReason { get; private set; }

    private ExamWindow() { } // EF Core

    public static ExamWindow Create(
        Guid schoolId, Guid academicSessionId, Guid academicTermId, Guid examTypeId,
        DateOnly startDate, DateOnly endDate, ExamMode mode, DateOnly draftDueDate)
    {
        if (endDate < startDate)
            throw new InvalidExamDataException("Sınav penceresinin bitişi başlangıcından önce olamaz.");
        if (draftDueDate > startDate)
            throw new InvalidExamDataException("Taslak tamamlanma tarihi pencerenin başlangıcından sonra olamaz.");

        return new ExamWindow
        {
            Id = Guid.CreateVersion7(),
            SchoolId = schoolId,
            AcademicSessionId = academicSessionId,
            AcademicTermId = academicTermId,
            ExamTypeId = examTypeId,
            StartDate = startDate,
            EndDate = endDate,
            Mode = mode,
            DraftDueDate = draftDueDate,
            Status = ExamWindowStatus.Draft,
            Version = 1,
        };
    }

    public void OpenReview(DateOnly opensAt, DateOnly closesAt)
    {
        if (Mode != ExamMode.Session)
            throw new InvalidExamWindowStateException("Görüş penceresi yalnız oturum modunda açılır.");
        if (closesAt < opensAt)
            throw new InvalidExamDataException("Görüş penceresinin kapanışı açılışından önce olamaz.");
        ReviewOpensAt = opensAt;
        ReviewClosesAt = closesAt;
    }

    public void PublishWindow(Guid byPersonId, DateTimeOffset at)
    {
        if (Status != ExamWindowStatus.Draft)
            throw new InvalidExamWindowStateException("Pencere yalnız taslak durumundayken yayınlanır.");
        Status = ExamWindowStatus.WindowPublished;
        WindowPublishedAt = at;
        WindowPublishedByPersonId = byPersonId;
        Raise(new ExamWindowPublishedEvent(Id, SchoolId, AcademicTermId, ExamTypeId, StartDate, EndDate));
    }

    /// <param name="reason">
    /// 7 gün kuralının altında yayınlanıyorsa zorunlu. Kuralın kendisi
    /// <c>ExamRuleInspector</c>'da ölçülür; entity yalnız gerekçenin varlığını bilir.
    /// </param>
    public void PublishSchedule(Guid byPersonId, DateTimeOffset at, string? reason)
    {
        if (Status != ExamWindowStatus.WindowPublished)
            throw new InvalidExamWindowStateException("Takvim, pencere yayınlanmadan yayınlanamaz.");
        if (reason is not null && reason.Trim().Length < MinReasonLength)
            throw new InvalidExamDataException($"Gerekçe en az {MinReasonLength} karakter olmalıdır.");

        Status = ExamWindowStatus.SchedulePublished;
        SchedulePublishedAt = at;
        SchedulePublishedByPersonId = byPersonId;
        PublishReason = reason?.Trim();
        Raise(new ExamSchedulePublishedEvent(Id, SchoolId, AcademicTermId, ExamTypeId, Version));
    }

    /// <summary>Yayın sonrası değişiklik. Sürüm artar; kayıt <c>ExamWindowRevision</c>'da tutulur.</summary>
    public void Revise(string reason, Guid byPersonId, DateTimeOffset at)
    {
        if (Status != ExamWindowStatus.SchedulePublished)
            throw new InvalidExamWindowStateException("Yalnız takvimi yayında olan pencere revize edilir.");
        RequireReason(reason);
        Version++;
        SchedulePublishedAt = at;
        SchedulePublishedByPersonId = byPersonId;
    }

    public void Lock(string reason, Guid byPersonId, DateTimeOffset at)
    {
        if (Status == ExamWindowStatus.Locked)
            throw new InvalidExamWindowStateException("Pencere zaten kilitli.");
        RequireReason(reason);
        Status = ExamWindowStatus.Locked;
        LockedAt = at;
        LockedByPersonId = byPersonId;
        LockReason = reason.Trim();
    }

    private static void RequireReason(string reason)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < MinReasonLength)
            throw new InvalidExamDataException($"Gerekçe en az {MinReasonLength} karakter olmalıdır.");
    }
}
```

Olaylar (`Events/`), Grades'teki kayıt kalıbıyla:

```csharp
public sealed record ExamWindowPublishedEvent(
    Guid ExamWindowId, Guid SchoolId, Guid AcademicTermId, Guid ExamTypeId,
    DateOnly StartDate, DateOnly EndDate) : IDomainEvent;

public sealed record ExamSchedulePublishedEvent(
    Guid ExamWindowId, Guid SchoolId, Guid AcademicTermId, Guid ExamTypeId, int Version) : IDomainEvent;
```

- [ ] **Adım 5: Testi koştur, yeşil olduğunu gör**

Çalıştır: `./scripts/test-changed.sh --filter ExamWindowTests`
Beklenen: 4 test PASS.

- [ ] **Adım 6: Commit**

```bash
git add src/Oksis.Domain/Modules/Exams tests/Oksis.Domain.UnitTests/Modules/Exams
git commit -m "feat(exams): sınav penceresi entity'si ve iki adımlı yayın durum makinesi"
```

---

### Görev 1.2: `ScheduledExam` ve `HourRequest` entity'leri

**Files:**
- Create: `src/Oksis.Domain/Modules/Exams/Entities/ScheduledExam.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Entities/HourRequest.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Enums/ExamPlacementState.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Enums/HourRequestStatus.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Events/ExamHourRequestedEvent.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Events/ExamHourAnsweredEvent.cs`
- Test: `tests/Oksis.Domain.UnitTests/Modules/Exams/ScheduledExamTests.cs`

**Interfaces:**
- Consumes: `ExamsDomainException`, `ExamWindow` (yalnız `Id` ile bağ; navigasyon özelliği yok).
- Produces: `ScheduledExam.Create(schoolId, examWindowId, classRoomId, subjectId, ownerTeacherId)`, `.PlaceOwnHour(date, period, hostPlacementId)`, `.PlaceBorrowedHour(date, period, hostPlacementId, hostTeacherId)`, `.AcceptBorrowedHour()`, `.DeclineBorrowedHour()`, `.ExpireBorrowedHour()`, `.MarkMoved()`, `.Unplace()`; `HourRequest.Create(...)`, `.Answer(bool accepted, string? note, DateTimeOffset at)`, `.Expire(DateTimeOffset at)`.

**İki eksen kuralı (D-1):** `PlacementState` yalnız *sınav yerleşti mi* sorusunu, `HourRequestStatus` yalnız *saat isteği ne oldu* sorusunu cevaplar. İkisi ayrı alandır ve ayrı ayrı döndürülür; rozet metnini istemci türetir.

- [ ] **Adım 1: Testi yaz**

```csharp
public sealed class ScheduledExamTests
{
    private static ScheduledExam New() => ScheduledExam.Create(
        schoolId: Guid.NewGuid(), examWindowId: Guid.NewGuid(),
        classRoomId: Guid.NewGuid(), subjectId: Guid.NewGuid(), ownerTeacherId: Guid.NewGuid());

    [Fact]
    public void Should_BeUnplaced_When_Created()
    {
        var e = New();
        e.PlacementState.Should().Be(ExamPlacementState.Unplaced);
        e.HourRequestStatus.Should().Be(HourRequestStatus.NotNeeded);
        e.Date.Should().BeNull();
        e.Period.Should().BeNull();
    }

    [Fact]
    public void Should_SetAdministeringTeacherToOwner_When_OwnHourIsPlaced()
    {
        var e = New();
        e.PlaceOwnHour(new DateOnly(2027, 3, 9), period: 2, hostPlacementId: Guid.NewGuid());
        e.PlacementState.Should().Be(ExamPlacementState.Placed);
        e.AdministeringTeacherId.Should().Be(e.OwnerTeacherId);
        e.IsBorrowedHour.Should().BeFalse();
        e.HourRequestStatus.Should().Be(HourRequestStatus.NotNeeded);
    }

    [Fact]
    public void Should_StayUnplaced_When_BorrowedHourIsPending()
    {
        var e = New();
        var host = Guid.NewGuid();
        e.PlaceBorrowedHour(new DateOnly(2027, 3, 10), period: 3, hostPlacementId: Guid.NewGuid(), hostTeacherId: host);

        // Bekleyen istek YERLEŞİM DEĞİLDİR: ev sahibi kabul edene kadar sınav yoktur.
        e.PlacementState.Should().Be(ExamPlacementState.Unplaced);
        e.HourRequestStatus.Should().Be(HourRequestStatus.Pending);
        e.AdministeringTeacherId.Should().Be(host);
    }

    [Fact]
    public void Should_BecomePlaced_When_BorrowedHourIsAccepted()
    {
        var e = New();
        e.PlaceBorrowedHour(new DateOnly(2027, 3, 10), 3, Guid.NewGuid(), Guid.NewGuid());
        e.AcceptBorrowedHour();
        e.PlacementState.Should().Be(ExamPlacementState.Placed);
        e.HourRequestStatus.Should().Be(HourRequestStatus.Accepted);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void Should_ClearSlot_When_BorrowedHourIsRefused(bool expired)
    {
        var e = New();
        e.PlaceBorrowedHour(new DateOnly(2027, 3, 10), 3, Guid.NewGuid(), Guid.NewGuid());
        if (expired) { e.ExpireBorrowedHour(); } else { e.DeclineBorrowedHour(); }

        e.PlacementState.Should().Be(ExamPlacementState.Unplaced);
        e.HourRequestStatus.Should().Be(expired ? HourRequestStatus.Expired : HourRequestStatus.Declined);
        e.Date.Should().BeNull("reddedilen saat sınavın saati değildir");
        e.AdministeringTeacherId.Should().BeNull();
    }

    [Fact]
    public void Should_KeepSlot_When_MarkedMoved()
    {
        var e = New();
        var date = new DateOnly(2027, 3, 9);
        e.PlaceOwnHour(date, 2, Guid.NewGuid());
        e.MarkMoved();

        // Taşınan sınav SİLİNMEZ; sahibi düzeltene kadar eski saati görünür kalır.
        e.PlacementState.Should().Be(ExamPlacementState.Moved);
        e.Date.Should().Be(date);
    }

    [Fact]
    public void Should_Throw_When_PeriodIsNotPositive()
    {
        var e = New();
        var act = () => e.PlaceOwnHour(new DateOnly(2027, 3, 9), period: 0, hostPlacementId: Guid.NewGuid());
        act.Should().Throw<ExamsDomainException>();
    }
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Çalıştır: `./scripts/test-changed.sh --filter ScheduledExamTests`
Beklenen: derleme hatası.

- [ ] **Adım 3: Enum'ları yaz**

```csharp
// ExamPlacementState.cs — sınav yerleşti mi? Saat isteğinden BAĞIMSIZ eksen.
public enum ExamPlacementState
{
    Unplaced = 1,
    Placed = 2,
    /// <summary>Yayınlanmış programda ev sahibi yerleşim taşındı/kalktı (EX-S06).</summary>
    Moved = 3,
}

// HourRequestStatus.cs — ödünç saat isteğinin akıbeti.
public enum HourRequestStatus { NotNeeded = 1, Pending = 2, Accepted = 3, Declined = 4, Expired = 5 }
```

- [ ] **Adım 4: `ScheduledExam`'i yaz**

```csharp
/// <summary>
/// Planlı sınav — satır = <b>pencere × şube × ders</b>. Sınavın saati program hücresidir:
/// <c>(Date, Period)</c> + ev sahibi <c>LessonPlacement</c>.
/// </summary>
/// <remarks>
/// <para><b>İki eksen:</b> <see cref="PlacementState"/> "sınav yerleşti mi", 
/// <see cref="HourRequestStatus"/> "ödünç saat isteği ne oldu" sorusunu cevaplar. Bekleyen
/// istek yerleşim SAYILMAZ — ev sahibi kabul etmeden o saat sınavın değildir.</para>
/// <para><b>Sahip / uygulayan:</b> <see cref="OwnerTeacherId"/> sınavı kuran ve notu girecek
/// öğretmendir; <see cref="AdministeringTeacherId"/> o saatte sınıfta bulunandır. Kendi
/// saatinde ikisi aynıdır; ödünç saatte ev sahibidir (K-8).</para>
/// </remarks>
public sealed class ScheduledExam : TenantEntity
{
    public Guid ExamWindowId { get; private set; }
    public Guid ClassRoomId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid OwnerTeacherId { get; private set; }

    public DateOnly? Date { get; private set; }
    public int? Period { get; private set; }
    /// <summary>Ev sahibi program hücresi. Yerleşim kalkarsa sınav <c>Moved</c>'a düşer.</summary>
    public Guid? HostPlacementId { get; private set; }
    public Guid? AdministeringTeacherId { get; private set; }
    public bool IsBorrowedHour { get; private set; }

    public ExamPlacementState PlacementState { get; private set; }
    public HourRequestStatus HourRequestStatus { get; private set; }

    private ScheduledExam() { } // EF Core

    public static ScheduledExam Create(
        Guid schoolId, Guid examWindowId, Guid classRoomId, Guid subjectId, Guid ownerTeacherId)
    {
        return new ScheduledExam
        {
            Id = Guid.CreateVersion7(),
            SchoolId = schoolId,
            ExamWindowId = examWindowId,
            ClassRoomId = classRoomId,
            SubjectId = subjectId,
            OwnerTeacherId = ownerTeacherId,
            PlacementState = ExamPlacementState.Unplaced,
            HourRequestStatus = HourRequestStatus.NotNeeded,
        };
    }

    public void PlaceOwnHour(DateOnly date, int period, Guid hostPlacementId)
    {
        RequirePeriod(period);
        Date = date;
        Period = period;
        HostPlacementId = hostPlacementId;
        AdministeringTeacherId = OwnerTeacherId;
        IsBorrowedHour = false;
        HourRequestStatus = HourRequestStatus.NotNeeded;
        PlacementState = ExamPlacementState.Placed;
    }

    public void PlaceBorrowedHour(DateOnly date, int period, Guid hostPlacementId, Guid hostTeacherId)
    {
        RequirePeriod(period);
        if (hostTeacherId == OwnerTeacherId)
            throw new InvalidExamDataException("Kendi saatiniz için saat isteği gönderilmez.");

        Date = date;
        Period = period;
        HostPlacementId = hostPlacementId;
        AdministeringTeacherId = hostTeacherId;
        IsBorrowedHour = true;
        HourRequestStatus = HourRequestStatus.Pending;
        PlacementState = ExamPlacementState.Unplaced; // kabul gelene kadar yerleşmedi
    }

    public void AcceptBorrowedHour()
    {
        RequirePendingRequest();
        HourRequestStatus = HourRequestStatus.Accepted;
        PlacementState = ExamPlacementState.Placed;
    }

    public void DeclineBorrowedHour() => RefuseBorrowedHour(HourRequestStatus.Declined);

    public void ExpireBorrowedHour() => RefuseBorrowedHour(HourRequestStatus.Expired);

    /// <summary>Ev sahibi yerleşim yayınlanmış programda taşındı — sınav silinmez, işaretlenir.</summary>
    public void MarkMoved()
    {
        if (PlacementState != ExamPlacementState.Placed)
            throw new InvalidExamWindowStateException("Yalnız yerleşmiş sınav taşınmış olarak işaretlenir.");
        PlacementState = ExamPlacementState.Moved;
    }

    public void Unplace()
    {
        Date = null;
        Period = null;
        HostPlacementId = null;
        AdministeringTeacherId = null;
        IsBorrowedHour = false;
        HourRequestStatus = HourRequestStatus.NotNeeded;
        PlacementState = ExamPlacementState.Unplaced;
    }

    private void RefuseBorrowedHour(HourRequestStatus status)
    {
        RequirePendingRequest();
        Date = null;
        Period = null;
        HostPlacementId = null;
        AdministeringTeacherId = null;
        IsBorrowedHour = false;
        HourRequestStatus = status;
        PlacementState = ExamPlacementState.Unplaced;
    }

    private void RequirePendingRequest()
    {
        if (HourRequestStatus != HourRequestStatus.Pending)
            throw new InvalidExamWindowStateException("Bekleyen bir saat isteği yok.");
    }

    private static void RequirePeriod(int period)
    {
        if (period <= 0)
            throw new InvalidExamDataException("Ders saati 1'den küçük olamaz.");
    }
}
```

- [ ] **Adım 5: `HourRequest`'i yaz**

```csharp
/// <summary>
/// Ödünç saat isteği. <b>Saat öğretmenindir</b> (K-8): kararı yalnız ev sahibi verir,
/// yönetici geçemez. Cevapsız istek pencerenin <c>DraftDueDate</c>'inde düşer.
/// </summary>
public sealed class HourRequest : TenantEntity
{
    public Guid ScheduledExamId { get; private set; }
    public Guid ExamWindowId { get; private set; }
    public Guid RequesterTeacherId { get; private set; }
    public Guid HostTeacherId { get; private set; }
    public HourRequestStatus Status { get; private set; }
    public DateTimeOffset RequestedAt { get; private set; }
    public DateTimeOffset? AnsweredAt { get; private set; }
    /// <summary>Ret gerekçesi — opsiyoneldir, kabul edilince null kalır.</summary>
    public string? ResponseNote { get; private set; }

    private HourRequest() { } // EF Core

    public static HourRequest Create(
        Guid schoolId, Guid scheduledExamId, Guid examWindowId,
        Guid requesterTeacherId, Guid hostTeacherId, DateTimeOffset requestedAt)
    {
        return new HourRequest
        {
            Id = Guid.CreateVersion7(),
            SchoolId = schoolId,
            ScheduledExamId = scheduledExamId,
            ExamWindowId = examWindowId,
            RequesterTeacherId = requesterTeacherId,
            HostTeacherId = hostTeacherId,
            Status = HourRequestStatus.Pending,
            RequestedAt = requestedAt,
        };
    }

    public void Answer(bool accepted, string? note, DateTimeOffset at)
    {
        if (Status != HourRequestStatus.Pending)
            throw new InvalidExamDataException("Bu istek zaten cevaplanmış.");
        Status = accepted ? HourRequestStatus.Accepted : HourRequestStatus.Declined;
        AnsweredAt = at;
        ResponseNote = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
    }

    public void Expire(DateTimeOffset at)
    {
        if (Status != HourRequestStatus.Pending)
            throw new InvalidExamDataException("Yalnız bekleyen istek düşer.");
        Status = HourRequestStatus.Expired;
        AnsweredAt = at;
    }
}
```

- [ ] **Adım 6: Testi koştur, yeşil olduğunu gör**

Çalıştır: `./scripts/test-changed.sh --filter ScheduledExamTests`
Beklenen: 8 test PASS (Theory iki vaka).

- [ ] **Adım 7: Commit**

```bash
git add src/Oksis.Domain/Modules/Exams tests/Oksis.Domain.UnitTests/Modules/Exams
git commit -m "feat(exams): planlı sınav ve saat isteği entity'leri — yerleşim ve istek ayrı eksen"
```

---

### Görev 1.3: Kalıcılık — EF yapılandırmaları, DbSet'ler, migration

**Files:**
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Exams/ExamWindowConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Exams/ScheduledExamConfiguration.cs`
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Exams/HourRequestConfiguration.cs`
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs` (Grades bloğunun ardına `// ── Exams` bloğu)
- Modify: `src/Oksis.Infrastructure/Persistence/OksisDbContext.cs` (aynı üç `DbSet`)
- Create: migration `20260909_exams_faz1` (üretilecek)

**Interfaces:**
- Consumes: `builder.ToAcademicTable(...)` uzantısı — emsal `Configurations/Grades/GradeEntryReminderConfiguration.cs`.
- Produces: `IApplicationDbContext.ExamWindows`, `.ScheduledExams`, `.HourRequests`.

- [ ] **Adım 1: `ExamWindowConfiguration`'ı yaz**

```csharp
/// <summary>
/// <see cref="ExamWindow"/> — [academic].exam_windows. Tekillik
/// <c>(school_id, academic_term_id, exam_type_id)</c>: bir dönemde bir sınav türü için
/// tek pencere olur; ikinci pencere aynı sütunun tarihini iki kez üretirdi.
/// </summary>
public sealed class ExamWindowConfiguration : IEntityTypeConfiguration<ExamWindow>
{
    public void Configure(EntityTypeBuilder<ExamWindow> builder)
    {
        builder.ToAcademicTable("exam_windows");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.AcademicSessionId).IsRequired();
        builder.Property(x => x.AcademicTermId).IsRequired();
        builder.Property(x => x.ExamTypeId).IsRequired();
        builder.Property(x => x.StartDate).IsRequired();
        builder.Property(x => x.EndDate).IsRequired();
        builder.Property(x => x.DraftDueDate).IsRequired();
        builder.Property(x => x.Mode).IsRequired().HasConversion<int>();
        builder.Property(x => x.Status).IsRequired().HasConversion<int>();
        builder.Property(x => x.Version).IsRequired();
        builder.Property(x => x.PublishReason).HasMaxLength(500);
        builder.Property(x => x.LockReason).HasMaxLength(500);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        builder.HasIndex(x => new { x.SchoolId, x.AcademicTermId, x.ExamTypeId })
            .IsUnique()
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ux_exam_windows_term_type");

        // Öğrenci/veli takvimi ve etiket sorgusu tarih aralığıyla girer.
        builder.HasIndex(x => new { x.SchoolId, x.StartDate, x.EndDate })
            .HasDatabaseName("ix_exam_windows_range");
    }
}
```

- [ ] **Adım 2: `ScheduledExamConfiguration`'ı yaz**

```csharp
/// <summary>
/// <see cref="ScheduledExam"/> — [academic].scheduled_exams. Tekillik
/// <c>(school_id, exam_window_id, class_room_id, subject_id)</c> = EX-H02'nin veritabanı
/// karşılığı: bir şubenin bir dersten o pencerede tek sınavı olur. Kuralı yalnız handler'da
/// tutmak, iki öğretmenin eşzamanlı yerleştirmesinde delinirdi.
/// </summary>
public sealed class ScheduledExamConfiguration : IEntityTypeConfiguration<ScheduledExam>
{
    public void Configure(EntityTypeBuilder<ScheduledExam> builder)
    {
        builder.ToAcademicTable("scheduled_exams");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.ExamWindowId).IsRequired();
        builder.Property(x => x.ClassRoomId).IsRequired();
        builder.Property(x => x.SubjectId).IsRequired();
        builder.Property(x => x.OwnerTeacherId).IsRequired();
        builder.Property(x => x.PlacementState).IsRequired().HasConversion<int>();
        builder.Property(x => x.HourRequestStatus).IsRequired().HasConversion<int>();
        builder.Property(x => x.IsBorrowedHour).IsRequired();

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        builder.HasIndex(x => new { x.SchoolId, x.ExamWindowId, x.ClassRoomId, x.SubjectId })
            .IsUnique()
            .HasFilter("is_deleted = 0")
            .HasDatabaseName("ux_scheduled_exams_window_section_subject");

        // Pano yığılma ısı haritası ve EX-H01 sayımı bu eksenden girer.
        builder.HasIndex(x => new { x.SchoolId, x.ClassRoomId, x.Date })
            .HasDatabaseName("ix_scheduled_exams_section_date");

        // Etiket projeksiyonu: şube × tarih × ders saati.
        builder.HasIndex(x => new { x.SchoolId, x.Date, x.Period })
            .HasDatabaseName("ix_scheduled_exams_date_period");

        // Öğretmenin kendi yerleştirme listesi ve gelen istek sayacı.
        builder.HasIndex(x => new { x.SchoolId, x.OwnerTeacherId, x.ExamWindowId })
            .HasDatabaseName("ix_scheduled_exams_owner");
    }
}
```

- [ ] **Adım 3: `HourRequestConfiguration`'ı yaz**

```csharp
/// <summary>
/// <see cref="HourRequest"/> — [academic].exam_hour_requests. Tekillik yok: aynı sınav için
/// istek reddedilip başka bir ev sahibine yeniden gönderilebilir; geçmiş istekler kalır
/// (öğretmen "kim reddetmişti" sorusunu sorabilmeli).
/// </summary>
public sealed class HourRequestConfiguration : IEntityTypeConfiguration<HourRequest>
{
    public void Configure(EntityTypeBuilder<HourRequest> builder)
    {
        builder.ToAcademicTable("exam_hour_requests");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedNever();

        builder.Property(x => x.SchoolId).IsRequired();
        builder.Property(x => x.ScheduledExamId).IsRequired();
        builder.Property(x => x.ExamWindowId).IsRequired();
        builder.Property(x => x.RequesterTeacherId).IsRequired();
        builder.Property(x => x.HostTeacherId).IsRequired();
        builder.Property(x => x.Status).IsRequired().HasConversion<int>();
        builder.Property(x => x.RequestedAt).IsRequired();
        builder.Property(x => x.ResponseNote).HasMaxLength(500);

        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.CreatedBy).IsRequired();
        builder.Property(x => x.IsDeleted).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.RowVersion).IsRowVersion();
        builder.Ignore(x => x.DomainEvents);

        // "Bana gelenler" sekmesi ve düşürme sweep'i.
        builder.HasIndex(x => new { x.SchoolId, x.HostTeacherId, x.Status })
            .HasDatabaseName("ix_exam_hour_requests_host_status");
        builder.HasIndex(x => new { x.SchoolId, x.ScheduledExamId })
            .HasDatabaseName("ix_exam_hour_requests_exam");
    }
}
```

- [ ] **Adım 4: `DbSet`'leri ekle**

`IApplicationDbContext.cs` içinde Grades bloğunun ardına:

```csharp
    // ── Exams (Sınav takvimi) ─────────────────────────────────────────────
    DbSet<ExamWindow> ExamWindows { get; }
    DbSet<ScheduledExam> ScheduledExams { get; }
    DbSet<HourRequest> HourRequests { get; }
```

`OksisDbContext.cs` içinde aynı üç satır `public DbSet<...> ... => Set<...>();` biçiminde (dosyadaki komşu satırların yazımını birebir izle).

- [ ] **Adım 5: Migration üret**

```bash
dotnet ef migrations add 20260909_exams_faz1 \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
```

Üretilen dosyayı **oku**: üç `CreateTable` ve beş index olmalı; `InsertData` OLMAMALI (bu görevde seed yok).

- [ ] **Adım 6: Derle ve testleri koştur**

Çalıştır: `dotnet build` ve `./scripts/test-changed.sh`
Beklenen: derleme temiz, mevcut testler yeşil.

- [ ] **Adım 7: Commit**

```bash
git add src/Oksis.Infrastructure src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs
git commit -m "feat(exams): sınav takvimi tabloları, indeksler ve migration"
```

---

### Görev 1.4: Program okuyucu ve yerleştirme kuralları

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Abstractions/IExamScheduleReader.cs`
- Create: `src/Oksis.Application/Modules/Exams/Internal/ExamScheduleReader.cs`
- Create: `src/Oksis.Application/Modules/Exams/Internal/ExamRuleInspector.cs`
- Create: `src/Oksis.Application/Modules/Exams/Abstractions/IExamPlacementCounter.cs`
- Create: `src/Oksis.Application/Modules/Exams/Contracts/ExamContracts.cs` (`ExamViolationDto`, `ExamSlotDto`)
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/ExamRuleInspectorTests.cs`

**Interfaces:**
- Consumes: `IApplicationDbContext`, `ScheduleSnapshotSerializer.TryDeserialize` (`src/Oksis.Application/Modules/Timetable/Serialization/`), `PublishedLessonPlacementSnapshot` (`Modules/Timetable/DTOs/PublishedScheduleDtos.cs`), `SchoolSettings` (politika alanları Görev 4.1'de eklenir; bu görevde varsayılan sabitler kullanılır).
- Produces:
  - `IExamScheduleReader.GetDaySlotsAsync(Guid classRoomId, Guid academicTermId, DateOnly date, CancellationToken)` → `IReadOnlyList<ExamSlotDto>`
  - `ExamRuleInspector.CheckPlacementAsync(ScheduledExam exam, DateOnly date, int period, Guid actingTeacherId, CancellationToken)` → `IReadOnlyList<ExamViolationDto>`

**Neden ayrı okuyucu:** ölçüldü (2026-09-08) — `(classRoomId, date, period)` üçlüsünden dersi döndüren hazır bir sorgu **yok**; haftalık okuma modeli, yoklama materializer'ı ve istisna planlayıcısı sürüm seçimini üç ayrı `private` kopyayla yapıyor. Dördüncü kopyayı üretmemek için bu modül kendi okuyucusunu **tek yerde** tanımlar ve yalnız oradan okur.

- [ ] **Adım 1: Sözleşme tiplerini yaz**

```csharp
/// <summary>Yayınlanmış programda bir ders saati — sınavın oturabileceği hücre.</summary>
public sealed record ExamSlotDto(
    Guid PlacementId, int Period, Guid SubjectId, Guid TeacherId, Guid? RoomId, bool IsCancelled);

/// <summary>
/// Kural ihlali. <c>Hard</c> yazmayı engeller, <c>Soft</c> gerekçeyle geçilir.
/// Metni SUNUCU üretir — istemci kod → cümle eşlemesi tutmaz (D-2).
/// </summary>
public sealed record ExamViolationDto(
    string Code, string Severity, string Message, Guid? ExamId, string? SectionName);
```

- [ ] **Adım 2: Kural testlerini yaz**

Test, `IExamScheduleReader`'ı NSubstitute ile taklit eder; gerçek SQL Görev 2.3'ün entegrasyon testinde ölçülür.

```csharp
public sealed class ExamRuleInspectorTests
{
    private static readonly Guid Section = Guid.NewGuid();
    private static readonly Guid Subject = Guid.NewGuid();
    private static readonly Guid Teacher = Guid.NewGuid();
    private static readonly DateOnly Day = new(2027, 3, 9);

    private static ExamSlotDto Slot(int period, Guid teacher, bool cancelled = false) =>
        new(Guid.NewGuid(), period, Subject, teacher, null, cancelled);

    [Fact]
    public async Task Should_Block_When_SlotIsNotOwnLesson()
    {
        var reader = Substitute.For<IExamScheduleReader>();
        reader.GetDaySlotsAsync(Section, Arg.Any<Guid>(), Day, Arg.Any<CancellationToken>())
            .Returns([Slot(2, Guid.NewGuid())]); // başka öğretmenin dersi

        var violations = await InspectorWith(reader, examsOnDay: 0)
            .CheckPlacementAsync(NewExam(), Day, period: 2, actingTeacherId: Teacher, default);

        violations.Should().ContainSingle(v => v.Code == "EX-H03" && v.Severity == "hard");
    }

    [Fact]
    public async Task Should_Block_When_SlotDoesNotExist()
    {
        var reader = Substitute.For<IExamScheduleReader>();
        reader.GetDaySlotsAsync(Section, Arg.Any<Guid>(), Day, Arg.Any<CancellationToken>())
            .Returns([Slot(2, Teacher)]);

        var violations = await InspectorWith(reader, examsOnDay: 0)
            .CheckPlacementAsync(NewExam(), Day, period: 7, actingTeacherId: Teacher, default);

        violations.Should().ContainSingle(v => v.Code == "EX-H03");
    }

    [Fact]
    public async Task Should_Block_When_SlotIsCancelledThatDay()
    {
        var reader = Substitute.For<IExamScheduleReader>();
        reader.GetDaySlotsAsync(Section, Arg.Any<Guid>(), Day, Arg.Any<CancellationToken>())
            .Returns([Slot(2, Teacher, cancelled: true)]);

        var violations = await InspectorWith(reader, examsOnDay: 0)
            .CheckPlacementAsync(NewExam(), Day, period: 2, actingTeacherId: Teacher, default);

        violations.Should().ContainSingle(v => v.Code == "EX-H03");
    }

    [Fact]
    public async Task Should_Block_When_SectionAlreadyHasTwoExamsThatDay()
    {
        var reader = Substitute.For<IExamScheduleReader>();
        reader.GetDaySlotsAsync(Section, Arg.Any<Guid>(), Day, Arg.Any<CancellationToken>())
            .Returns([Slot(2, Teacher)]);

        var violations = await InspectorWith(reader, examsOnDay: 2)
            .CheckPlacementAsync(NewExam(), Day, period: 2, actingTeacherId: Teacher, default);

        violations.Should().Contain(v => v.Code == "EX-H01" && v.Severity == "hard");
    }

    [Fact]
    public async Task Should_Warn_When_SectionHasExamOnAdjacentDay()
    {
        var reader = Substitute.For<IExamScheduleReader>();
        reader.GetDaySlotsAsync(Section, Arg.Any<Guid>(), Day, Arg.Any<CancellationToken>())
            .Returns([Slot(2, Teacher)]);

        var violations = await InspectorWith(reader, examsOnDay: 0, examOnPreviousDay: true)
            .CheckPlacementAsync(NewExam(), Day, period: 2, actingTeacherId: Teacher, default);

        violations.Should().ContainSingle(v => v.Code == "EX-S01" && v.Severity == "soft");
    }

    [Fact]
    public async Task Should_ReturnNothing_When_PlacementIsClean()
    {
        var reader = Substitute.For<IExamScheduleReader>();
        reader.GetDaySlotsAsync(Section, Arg.Any<Guid>(), Day, Arg.Any<CancellationToken>())
            .Returns([Slot(2, Teacher)]);

        var violations = await InspectorWith(reader, examsOnDay: 1)
            .CheckPlacementAsync(NewExam(), Day, period: 2, actingTeacherId: Teacher, default);

        violations.Should().BeEmpty("günde ikinci sınav sınırın içindedir");
    }
}
```

> **Kurulum yardımcıları (`InspectorWith`, `NewExam`) aynı test dosyasında yazılır.**
> `InspectorWith` sahte bir `IExamPlacementCounter` (aynı dosyada tanımlı küçük arayüz)
> ile gün başına sınav sayısını ve komşu gün bayrağını verir; sayaç sorgusu Görev 2.3'te
> gerçek `IApplicationDbContext` sorgusuna bağlanır.

- [ ] **Adım 3: Testi koştur, kırmızı olduğunu gör**

Çalıştır: `./scripts/test-changed.sh --filter ExamRuleInspectorTests`

- [ ] **Adım 4: `ExamScheduleReader`'ı yaz**

```csharp
/// <summary>
/// Yayınlanmış programdan bir şubenin belirli GÜNDEKİ ders saatlerini okur.
/// </summary>
/// <remarks>
/// <para><b>Neden yeni bir okuyucu:</b> depoda üç ayrı sürüm-seçme kopyası var
/// (haftalık okuma modeli, yoklama materializer'ı, istisna planlayıcısı) ve ikisi dönem
/// filtreliyken biri değil. Sınav modülü dördüncü kopyayı üretmez; kendi okumasını tek
/// yerde toplar ve dönem filtresini <b>uygular</b>.</para>
/// <para><b>İptal edilmiş ders sınav taşımaz:</b> o gün iptal edilmiş bir hücreye sınav
/// koymak, olmayan bir derse sınav koymaktır. Vekâlet ve derslik değişikliği ise hücreyi
/// ortadan kaldırmaz — sınav orada yapılabilir.</para>
/// </remarks>
public sealed class ExamScheduleReader(IApplicationDbContext db) : IExamScheduleReader
{
    public async Task<IReadOnlyList<ExamSlotDto>> GetDaySlotsAsync(
        Guid classRoomId, Guid academicTermId, DateOnly date, CancellationToken cancellationToken)
    {
        var version = await db.ScheduleVersions.AsNoTracking()
            .Where(v => v.ClassRoomId == classRoomId && v.AcademicTermId == academicTermId)
            .OrderByDescending(v => v.Version)
            .ThenByDescending(v => v.PublishedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (version is null) { return []; }

        var snapshot = ScheduleSnapshotSerializer.TryDeserialize(version.SnapshotJson);
        if (snapshot is null) { return []; }

        var dayPlacements = snapshot.Placements.Where(p => p.Day == date.DayOfWeek).ToList();
        if (dayPlacements.Count == 0) { return []; }

        var placementIds = dayPlacements.Select(p => p.PlacementId).ToList();
        var cancelled = await db.ScheduleExceptions.AsNoTracking()
            .Where(e => e.Date == date
                     && e.RevokedAt == null
                     && e.Type == ScheduleExceptionType.Cancellation
                     && placementIds.Contains(e.TargetPlacementId))
            .Select(e => e.TargetPlacementId)
            .ToListAsync(cancellationToken);

        return dayPlacements
            .Select(p => new ExamSlotDto(
                p.PlacementId, p.Period, p.SubjectId, p.TeacherId, p.RoomId,
                IsCancelled: cancelled.Contains(p.PlacementId)))
            .OrderBy(s => s.Period)
            .ToList();
    }
}
```

- [ ] **Adım 5: `ExamRuleInspector`'ı yaz**

```csharp
/// <summary>
/// Sınav yerleştirme ve yayın kurallarının TEK yeri. Kural entity'de değil burada yaşar:
/// çoğu kural birden çok satıra bakar (şubenin o günkü diğer sınavları, programın hücresi),
/// yani tek aggregate'in içinden görülemez.
/// </summary>
/// <remarks>
/// Kod tablosu spec §3.8'dir. <c>EX-H09</c> ve <c>EX-S06</c> tasarım turunda eklendi
/// (plan §Handoff D-2): reddedilen saat isteği ve yayınlanmış programda taşınan yerleşim.
/// </remarks>
public sealed class ExamRuleInspector(IExamScheduleReader reader, IExamPlacementCounter counter)
{
    /// <summary>Şubeye aynı gün konulabilecek en çok sınav (okul ayarı; Görev 4.1'de alınır).</summary>
    public const int DefaultMaxExamsPerSectionPerDay = 2;

    public async Task<IReadOnlyList<ExamViolationDto>> CheckPlacementAsync(
        ScheduledExam exam, DateOnly date, int period, Guid actingTeacherId,
        CancellationToken cancellationToken)
    {
        var violations = new List<ExamViolationDto>();

        var slots = await reader.GetDaySlotsAsync(
            exam.ClassRoomId, await counter.GetTermIdAsync(exam.ExamWindowId, cancellationToken),
            date, cancellationToken);

        var slot = slots.FirstOrDefault(s => s.Period == period);
        if (slot is null || slot.IsCancelled || slot.TeacherId != actingTeacherId)
        {
            violations.Add(new ExamViolationDto(
                "EX-H03", "hard",
                "Seçilen saat bu şubede sizin dersiniz değil; sınav yalnız kendi ders saatinize konulur.",
                exam.Id, null));
        }

        var sameDayCount = await counter.CountExamsAsync(
            exam.ExamWindowId, exam.ClassRoomId, date, excludeExamId: exam.Id, cancellationToken);
        if (sameDayCount >= DefaultMaxExamsPerSectionPerDay)
        {
            violations.Add(new ExamViolationDto(
                "EX-H01", "hard",
                $"Bu şubenin {date:dd MMMM} günü {sameDayCount} sınavı var; günlük üst sınır {DefaultMaxExamsPerSectionPerDay}.",
                exam.Id, null));
        }

        if (await counter.HasExamOnAdjacentDayAsync(
                exam.ExamWindowId, exam.ClassRoomId, date, exam.Id, cancellationToken))
        {
            violations.Add(new ExamViolationDto(
                "EX-S01", "soft",
                "Bu şubenin bir önceki ya da sonraki gün de sınavı var.",
                exam.Id, null));
        }

        return violations;
    }
}
```

**Saat isteği olayları handler'dan yayınlanır.** `ExamHourRequestedEvent` ve
`ExamHourAnsweredEvent` kayıtları Görev 1.2'de tanımlandı ama entity içinden `Raise`
edilmiyor: `AggregateRoot.Raise` korumalıdır ve bu iki olay tek bir aggregate'in değil,
sınav + istek çiftinin sonucudur. Handler `IPublisher` ile yayınlar — emsal
`src/Oksis.Application/Modules/Schools/Commands/UpdateSchoolGradeLevels/UpdateSchoolGradeLevelsCommandHandler.cs`.
`ExamWindow`'un iki yayın olayı ise entity içinden `Raise` edilir; ayrım bilinçlidir.

`IExamPlacementCounter` aynı klasörde tanımlanır (`CountExamsAsync`, `HasExamOnAdjacentDayAsync`, `GetTermIdAsync`); uygulaması `IApplicationDbContext` üzerinden Görev 1.6'da yazılır.

- [ ] **Adım 6: DI kaydı**

`src/Oksis.Infrastructure/DependencyInjection.cs` içinde Attendance kayıtlarının yanına:

```csharp
services.AddScoped<IExamScheduleReader, ExamScheduleReader>();
services.AddScoped<IExamPlacementCounter, ExamPlacementCounter>();
services.AddScoped<ExamRuleInspector>();
```

- [ ] **Adım 7: Testi koştur, yeşil olduğunu gör**

Çalıştır: `./scripts/test-changed.sh --filter ExamRuleInspectorTests`
Beklenen: 6 test PASS.

- [ ] **Adım 8: Commit**

```bash
git add src/Oksis.Application/Modules/Exams src/Oksis.Infrastructure/DependencyInjection.cs \
        tests/Oksis.Application.UnitTests/Modules/Exams
git commit -m "feat(exams): program okuyucu ve yerleştirme kural denetleyicisi"
```

---

### Görev 1.5: Pencere komutları, izinler ve controller

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Commands/CreateExamWindow/{CreateExamWindowCommand,CreateExamWindowCommandHandler,CreateExamWindowCommandValidator}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Commands/PublishExamWindow/{PublishExamWindowCommand,PublishExamWindowCommandHandler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Queries/ListExamWindows/{ListExamWindowsQuery,ListExamWindowsQueryHandler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Contracts/ExamWindowDto.cs`
- Create: `src/Oksis.Api/Controllers/V1/ExamsController.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/{MasterSeedIds,PermissionSeedData,RolePermissionSeedData}.cs`
- Modify: `src/Oksis.Api/Errors/ErrorMessageCatalog.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/CreateExamWindowCommandHandlerTests.cs`

**Interfaces:**
- Consumes: `ExamWindow.Create/PublishWindow`, `ICommand<T>`, `Result<T>`, `[Tenancy(TenancyMode.Required)]`, `[RequirePermission("...")]` — emsal `src/Oksis.Application/Modules/Clubs/Commands/CancelClubActivity/CancelClubActivityCommand.cs`.
- Produces: `ExamWindowDto` (alan adları Görev 0.1'deki `ExamWindow` TS tipiyle **birebir**), uçlar `POST /api/v1/exams/windows`, `POST /api/v1/exams/windows/{id}:publish-window`, `GET /api/v1/exams/windows?termId=`.

**İzin anahtarları** (`PermissionSeedData.Row(...)` kalıbı, modül `EXAMS`):

| Kod | Açıklama | Roller |
|---|---|---|
| `exams.read` | Sınav takvimini görüntüle | Öğretmen, öğrenci, veli, yönetici |
| `exams.place` | Kendi sınavını yerleştir, saat isteği gönder/cevapla | Öğretmen |
| `exams.manage` | Pencere kur, yayınla, revize et, kilitle | Yönetici, akademik koordinatör |
| `exams.report` | Okul geneli sınav panosu | Yönetici, akademik koordinatör |

- [ ] **Adım 1: Handler testini yaz**

```csharp
public sealed class CreateExamWindowCommandHandlerTests
{
    [Fact]
    public async Task Should_Reject_When_ModeIsSession()
    {
        // Faz 1 kapsamı: oturum modu pencere olarak kurulamaz (Global Constraint 13).
        var handler = NewHandler();
        var result = await handler.Handle(
            new CreateExamWindowCommand(TermId, ExamTypeId, Start, End, "session", DraftDue), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Message.Should().Contain("Oturum modu");
    }

    [Fact]
    public async Task Should_Reject_When_WindowOverlapsExistingInSameTerm()
    {
        // EX-H07: aynı dönemde pencereler tarih olarak çakışamaz.
        var handler = NewHandler(existing: WindowAt(new DateOnly(2027, 3, 8), new DateOnly(2027, 3, 12)));
        var result = await handler.Handle(
            new CreateExamWindowCommand(TermId, OtherExamTypeId,
                new DateOnly(2027, 3, 11), new DateOnly(2027, 3, 15), "lessonHour", DraftDue), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Message.Should().Contain("çakış");
    }

    [Fact]
    public async Task Should_CreateDraft_When_InputIsValid()
    {
        var handler = NewHandler();
        var result = await handler.Handle(
            new CreateExamWindowCommand(TermId, ExamTypeId, Start, End, "lessonHour", DraftDue), default);

        result.IsSuccess.Should().BeTrue();
        result.Value.status.Should().Be("draft");
        result.Value.version.Should().Be(1);
    }
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Çalıştır: `./scripts/test-changed.sh --filter CreateExamWindowCommandHandlerTests`

- [ ] **Adım 3: Komut, validator ve handler'ı yaz**

```csharp
[Tenancy(TenancyMode.Required)]
[RequirePermission("exams.manage")]
public sealed record CreateExamWindowCommand(
    Guid TermId, Guid ExamTypeId, DateOnly StartDate, DateOnly EndDate,
    string Mode, DateOnly DraftDueDate) : ICommand<ExamWindowDto>;
```

Validator (FluentValidation): `Mode` ∈ {`lessonHour`,`session`}; `EndDate >= StartDate`; `DraftDueDate <= StartDate`; `TermId`/`ExamTypeId` boş olamaz.

Handler'ın taşıdığı üç kural:

```csharp
if (request.Mode == "session")
{
    return Result<ExamWindowDto>.Conflict(
        "Oturum modu henüz kullanılamıyor; kelebek düzeni sonraki fazda açılacak.");
}

// EX-H07 — aynı dönemde tarih çakışması.
var overlaps = await db.ExamWindows.AsNoTracking().AnyAsync(
    w => w.AcademicTermId == request.TermId
      && w.StartDate <= request.EndDate && request.StartDate <= w.EndDate,
    cancellationToken);
if (overlaps)
{
    return Result<ExamWindowDto>.Conflict(
        "Bu dönemde tarihleri çakışan bir sınav penceresi zaten var.");
}

// Sınav türü dönemle uyumlu olmalı: TermOrder 0 (Sözlü/Performans/Proje) pencere taşımaz.
var examType = await db.ExamTypes.AsNoTracking()
    .FirstOrDefaultAsync(t => t.Id == request.ExamTypeId, cancellationToken);
if (examType is null || examType.TermOrder == 0)
{
    return Result<ExamWindowDto>.Conflict(
        "Sınav penceresi yalnız dönem sınavı türleri için açılır.");
}
```

Ardından `ExamWindow.Create(...)` + `db.ExamWindows.Add(...)` + `SaveChangesAsync` + `ToDto()`.

`PublishExamWindowCommandHandler`: pencereyi bulur, `window.PublishWindow(personId, now)` çağırır, kaydeder. Durum ihlali `ExamsDomainException` fırlatır ve middleware 409'a çevirir.

- [ ] **Adım 4: `ExamWindowDto` ve projeksiyon**

```csharp
/// <summary>
/// Pencere satırı. Alan adları <c>packages/core/src/exam/types.ts :: ExamWindow</c> ile
/// BİREBİR aynıdır (R11) — burada yeniden adlandırma yapılmaz.
/// </summary>
public sealed record ExamWindowDto(
    string id, string seasonId, string termId, string examTypeId, string examTypeName,
    string startDate, string endDate, string mode, string status, int version,
    string draftDueDate, string? reviewOpensAt, string? reviewClosesAt,
    int placedCount, int totalCount, int pendingRequestCount, int violationCount,
    int? daysUntilFirstExam);
```

`placedCount` / `totalCount` / `pendingRequestCount` `ScheduledExams` üzerinden sayılır; `violationCount` bu görevde **0** döner ve Görev 2.3'te doldurulur (yorumla işaretle).

- [ ] **Adım 5: Controller'ı yaz**

```csharp
/// <summary>
/// Sınav takvimi uçları. İzinler Command/Query kayıtlarındaki <c>[RequirePermission]</c>
/// özniteliğindedir; controller izin bilmez.
/// </summary>
[ApiController]
[Route("api/v1/exams")]
[Authorize]
[Authorize(Policy = "active-season-write")]
public sealed class ExamsController(ISender sender) : ControllerBase
{
    [HttpGet("windows")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<ExamWindowDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListWindowsAsync(
        [FromQuery] Guid? termId, CancellationToken cancellationToken)
        => (await sender.Send(new ListExamWindowsQuery(termId), cancellationToken)).ToHttpResult(HttpContext);

    [HttpPost("windows")]
    [ProducesResponseType(typeof(ApiResponse<ExamWindowDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateWindowAsync(
        [FromBody] CreateExamWindowBody body, CancellationToken cancellationToken)
        => (await sender.Send(new CreateExamWindowCommand(
                body.TermId, body.ExamTypeId, body.StartDate, body.EndDate, body.Mode, body.DraftDueDate),
            cancellationToken)).ToHttpResult(HttpContext);

    [HttpPost("windows/{windowId:guid}:publish-window")]
    [ProducesResponseType(typeof(ApiResponse<ExamWindowDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PublishWindowAsync(
        Guid windowId, CancellationToken cancellationToken)
        => (await sender.Send(new PublishExamWindowCommand(windowId), cancellationToken))
            .ToHttpResult(HttpContext);

    public sealed record CreateExamWindowBody(
        Guid TermId, Guid ExamTypeId, DateOnly StartDate, DateOnly EndDate,
        string Mode, DateOnly DraftDueDate);
}
```

- [ ] **Adım 6: İzinleri seed'e ekle**

`MasterSeedIds.Permissions` içine dört Guid (`SeedGuid.From("perm:exams.read")` kalıbı komşu satırlardan birebir kopyalanır), `PermissionSeedData` içine dört `Row(...)`, `RolePermissionSeedData` içine rol eşlemeleri (yukarıdaki tablo). Hata kataloğuna üç anahtar:

```csharp
["exams.errors.session-mode-unavailable"] = "Oturum modu henüz kullanılamıyor; kelebek düzeni sonraki fazda açılacak.",
["exams.errors.window-overlap"] = "Bu dönemde tarihleri çakışan bir sınav penceresi zaten var.",
["exams.errors.exam-type-not-term-based"] = "Sınav penceresi yalnız dönem sınavı türleri için açılır.",
```

- [ ] **Adım 7: Migration üret ve testleri koştur**

```bash
dotnet ef migrations add 20260909_exams_permissions \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
./scripts/test-changed.sh
```
Beklenen: migration yalnız `InsertData` içerir; testler yeşil.

- [ ] **Adım 8: Commit**

```bash
git add src/Oksis.Application/Modules/Exams src/Oksis.Api src/Oksis.Infrastructure tests
git commit -m "feat(exams): pencere kurma ve yayınlama uçları, izin anahtarları"
```

---

### Görev 1.6: Öğretmen yerleştirme uçları

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Queries/GetMyExamPlacements/{Query,QueryHandler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Queries/GetPlacementSlots/{Query,QueryHandler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Commands/PlaceExam/{PlaceExamCommand,PlaceExamCommandHandler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Commands/RequestExamHour/{RequestExamHourCommand,RequestExamHourCommandHandler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Internal/ExamPlacementCounter.cs`
- Create: `src/Oksis.Application/Modules/Exams/Contracts/ScheduledExamDto.cs`
- Modify: `src/Oksis.Api/Controllers/V1/ExamsController.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/PlaceExamCommandHandlerTests.cs`

**Interfaces:**
- Consumes: `ExamRuleInspector.CheckPlacementAsync`, `IExamScheduleReader`, `ScheduledExam` metotları.
- Produces: `GET /api/v1/exams/windows/{windowId}/my-placements`, `GET /api/v1/exams/windows/{windowId}/slots?sectionId=&date=`, `POST /api/v1/exams/{examId}:place`, `POST /api/v1/exams/{examId}:request-hour`, ve:

```csharp
/// <summary>
/// Planlı sınav satırı. Alan adları <c>packages/core/src/exam/types.ts :: ScheduledExam</c>
/// ile birebir; <c>warnings</c> yalnız yazma yanıtlarında dolar (yumuşak ihlaller).
/// </summary>
public sealed record ScheduledExamDto(
    string id, string windowId, string sectionId, string sectionName,
    string courseId, string courseName, string? date, int? period,
    string ownerTeacherId, string ownerTeacherName,
    string? administeringTeacherId, string? administeringTeacherName,
    bool isBorrowedHour, string hourRequestStatus, string placementState, string? roomName,
    IReadOnlyList<ExamViolationDto> warnings);
```

**EX-H02 nerede uygulanır:** `my-placements` sorgusu şube × ders başına **tek** satır türetir ve
veritabanı tekilliği (`ux_scheduled_exams_window_section_subject`, Görev 1.3) ikinci satırı
reddeder. Ayrı bir handler kontrolü yazılmaz — kural yazının kendisinde kapalıdır.

**Planlı sınav satırı ne zaman doğar:** pencere yayınlandığında **doğmaz**. `my-placements` sorgusu öğretmenin not defterlerinden (dönem × şube × ders + görevlendirme) **beklenen** satırları türetir ve mevcut `ScheduledExam` kayıtlarıyla eşler; satır ilk yerleştirmede yazılır. Gerekçe not modülündekiyle aynı: defter tembel doğar, boş satır üretmek "yerleşti mi" sorusunu bulanıklaştırır.

- [ ] **Adım 1: Testi yaz**

```csharp
public sealed class PlaceExamCommandHandlerTests
{
    [Fact]
    public async Task Should_Reject_When_HardViolationExists()
    {
        var inspector = InspectorReturning(Hard("EX-H03", "kendi dersiniz değil"));
        var result = await NewHandler(inspector).Handle(
            new PlaceExamCommand(ExamId, new DateOnly(2027, 3, 9), 2), default);

        result.IsSuccess.Should().BeFalse();
        result.Error.Message.Should().Contain("kendi dersiniz değil");
    }

    [Fact]
    public async Task Should_Place_When_OnlySoftViolationExists()
    {
        var inspector = InspectorReturning(Soft("EX-S01", "art arda gün"));
        var result = await NewHandler(inspector).Handle(
            new PlaceExamCommand(ExamId, new DateOnly(2027, 3, 9), 2), default);

        result.IsSuccess.Should().BeTrue("yumuşak kural engellemez, uyarır");
        result.Value.placementState.Should().Be("placed");
        result.Value.warnings.Should().ContainSingle(w => w.Code == "EX-S01");
    }

    [Fact]
    public async Task Should_Reject_When_WindowIsLocked()
    {
        var result = await NewHandler(window: LockedWindow()).Handle(
            new PlaceExamCommand(ExamId, new DateOnly(2027, 3, 9), 2), default);
        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Should_Reject_When_DateIsOutsideWindow()
    {
        var result = await NewHandler().Handle(
            new PlaceExamCommand(ExamId, new DateOnly(2027, 4, 1), 2), default);
        result.IsSuccess.Should().BeFalse();
        result.Error.Message.Should().Contain("pencere");
    }

    [Fact]
    public async Task Should_Reject_When_CallerIsNotOwner()
    {
        // Kapsam reddi: sınavı yalnız SAHİBİ yerleştirir (X-17 kalıbı: 403 + gerekçe).
        var result = await NewHandler(currentTeacher: Guid.NewGuid()).Handle(
            new PlaceExamCommand(ExamId, new DateOnly(2027, 3, 9), 2), default);
        result.IsSuccess.Should().BeFalse();
    }
}
```

- [ ] **Adım 2: Testi koştur, kırmızı olduğunu gör**

Çalıştır: `./scripts/test-changed.sh --filter PlaceExamCommandHandlerTests`

- [ ] **Adım 3: `PlaceExamCommandHandler`'ı yaz**

Sıra sabittir: tenant → sahiplik → pencere durumu → tarih aralığı → kural denetimi → entity çağrısı.

```csharp
if (window.Status is ExamWindowStatus.Locked)
{
    return Result<ScheduledExamDto>.Conflict("Pencere kilitli; yerleştirme yapılamaz.");
}
if (date < window.StartDate || date > window.EndDate)
{
    return Result<ScheduledExamDto>.Conflict(
        $"Seçilen gün sınav penceresinin dışında ({window.StartDate:dd MMMM}–{window.EndDate:dd MMMM}).");
}
if (exam.OwnerTeacherId != currentTeacherId)
{
    return Result<ScheduledExamDto>.Forbidden();
}

var violations = await inspector.CheckPlacementAsync(
    exam, request.Date, request.Period, currentTeacherId, cancellationToken);

var hard = violations.Where(v => v.Severity == "hard").ToList();
if (hard.Count > 0)
{
    return Result<ScheduledExamDto>.Conflict(string.Join(" ", hard.Select(v => v.Message)));
}

var slot = (await reader.GetDaySlotsAsync(
        exam.ClassRoomId, window.AcademicTermId, request.Date, cancellationToken))
    .First(s => s.Period == request.Period);

exam.PlaceOwnHour(request.Date, request.Period, slot.PlacementId);
await db.SaveChangesAsync(cancellationToken);

// Yumuşak ihlaller SONUÇLA döner: ekran uyarıyı gösterir, işlem yapılmıştır.
return Result<ScheduledExamDto>.Success(exam.ToDto(warnings: violations.Where(v => v.Severity == "soft")));
```

- [ ] **Adım 4: `RequestExamHourCommandHandler`'ı yaz**

Farkı: hedef şubede o saatteki ders **başka öğretmenindir**. Akış — hedef şubenin o günkü hücrelerini oku, `period`'daki hücreyi bul, ev sahibi öğretmeni al, `exam.PlaceBorrowedHour(date, period, slot.PlacementId, slot.TeacherId)` çağır, `HourRequest.Create(...)` ekle, `ExamHourRequestedEvent` yayınla. Kural denetimi `actingTeacherId: slot.TeacherId` ile yapılır — EX-H03 ev sahibinin dersi üzerinden ölçülür.

- [ ] **Adım 5: `ExamPlacementCounter`'ı yaz**

```csharp
public sealed class ExamPlacementCounter(IApplicationDbContext db) : IExamPlacementCounter
{
    public async Task<int> CountExamsAsync(
        Guid windowId, Guid classRoomId, DateOnly date, Guid excludeExamId, CancellationToken ct)
        => await db.ScheduledExams.AsNoTracking().CountAsync(
            e => e.ExamWindowId == windowId && e.ClassRoomId == classRoomId
              && e.Date == date && e.Id != excludeExamId
              && e.PlacementState != ExamPlacementState.Unplaced, ct);

    public async Task<bool> HasExamOnAdjacentDayAsync(
        Guid windowId, Guid classRoomId, DateOnly date, Guid excludeExamId, CancellationToken ct)
    {
        var previous = date.AddDays(-1);
        var next = date.AddDays(1);
        return await db.ScheduledExams.AsNoTracking().AnyAsync(
            e => e.ExamWindowId == windowId && e.ClassRoomId == classRoomId
              && e.Id != excludeExamId
              && (e.Date == previous || e.Date == next)
              && e.PlacementState != ExamPlacementState.Unplaced, ct);
    }

    public async Task<Guid> GetTermIdAsync(Guid windowId, CancellationToken ct)
        => await db.ExamWindows.AsNoTracking()
            .Where(w => w.Id == windowId).Select(w => w.AcademicTermId).FirstAsync(ct);
}
```

- [ ] **Adım 6: Controller uçlarını ekle**

`:place` ve `:request-hour` gövdeleri `(DateOnly Date, int Period)`; `slots` sorgusu `sectionId` ve `date` ile çağrılır ve `ExamSlotDto` listesini **öğretmenin kendi saatleri işaretlenmiş** olarak döndürür (`isOwnLesson: bool`, `hostTeacherName: string?`).

- [ ] **Adım 7: Testleri koştur**

Çalıştır: `./scripts/test-changed.sh`
Beklenen: yeni 5 test + mevcutlar yeşil.

- [ ] **Adım 8: Commit**

```bash
git add src/Oksis.Application/Modules/Exams src/Oksis.Api tests
git commit -m "feat(exams): öğretmen yerleştirme ve saat isteği uçları"
```

---

### Görev 1.7: `packages/api/src/exam/` ve pencere hub'ı ekranı

**Files:**
- Modify: `packages/api/src/generated/schema.ts` (codegen çıktısı — elle yazılmaz)
- Create: `packages/api/src/exam/{endpoints.ts,queries.ts,index.ts}`
- Modify: `packages/api/src/client/query-keys.ts` (`qk.exam` bloğu)
- Modify: `packages/api/src/index.ts` (`export * from "./exam"`)
- Create: `apps/web/features/exam/{exam-windows-screen.tsx,exam-page.tsx,parts.tsx,index.ts}`
- Create: `apps/web/app/(dashboard)/exams/page.tsx`
- Create: `packages/ui/src/styles/exam.css` + `packages/ui/src/styles/globals.css` içine `@import`
- Test: `packages/api/src/exam/endpoints.test.ts`

**Interfaces:**
- Consumes: Görev 1.5'in uçları (`/api/v1/exams/windows`), `packages/core` tipleri (`ExamWindow`, `EXAM_WINDOW_STATUS`, `examWindowProgress`).
- Produces: `useExamWindows(termId)`, `useExamWindowActions()` (`create`, `publishWindow`), `qk.exam.all()`, `<ExamWindowsScreen />`.

**Drift bekçisi GEREKMEZ.** Not modülünde `contract.ts` içindeki `declare module` bloğu, backend ucu **hiç yokken** yazıldığı için vardı. Burada uç Görev 1.5'te gerçekten açıldı; doğru yol codegen'i çalıştırıp üretilen şemadan okumaktır. `packages/api/src/exam/contract.ts` **yazılmaz**.

- [ ] **Adım 1: Codegen'i çalıştır ve şemayı doğrula**

```bash
dotnet run --project src/Oksis.Api &   # OpenAPI için ayakta olmalı
cd /Users/farukkaya/Repositories/oksis-ui && npm run codegen
grep -n "exams/windows" packages/api/src/generated/schema.ts
```
Beklenen: üç yol da şemada görünür. Görünmüyorsa **dur** — Görev 1.5 eksik demektir.

- [ ] **Adım 2: Eşleme testini yaz**

```ts
import { describe, expect, it } from "vitest"
import { toExamWindow } from "./endpoints"

describe("toExamWindow", () => {
  it("tel adlarını değiştirmeden taşır ve ilerlemeyi hesaplamaz", () => {
    const wire = {
      id: "ew-1", seasonId: "s", termId: "t", examTypeId: "x", examTypeName: "1. Sınav",
      startDate: "2027-03-09", endDate: "2027-03-12", mode: "lessonHour",
      status: "windowPublished", version: 1, draftDueDate: "2027-02-23",
      reviewOpensAt: null, reviewClosesAt: null,
      placedCount: 9, totalCount: 14, pendingRequestCount: 1, violationCount: 4,
      daysUntilFirstExam: 5,
    }
    expect(toExamWindow(wire)).toEqual(wire)
  })
})
```

- [ ] **Adım 3: `endpoints.ts` ve `queries.ts`'i yaz**

`endpoints.ts` tel→görünüm eşlemesini **burada** yapar (çağrı yerinde değil). Alan adları birebir aynı olduğu için eşleme kimliktir; yine de fonksiyon yazılır ki sunucu bir alanı yeniden adlandırdığında tek yerde patlasın.

`queries.ts` kalıbı `packages/api/src/grade/queries.ts` ile aynı:

```ts
export function useExamWindows(termId?: string) {
  return useQuery({
    queryKey: qk.exam.windows(termId),
    queryFn: () => listExamWindows(termId),
  })
}

export function useExamWindowActions() {
  const qc = useQueryClient()
  const invalidate = () => { void qc.invalidateQueries({ queryKey: qk.exam.all() }) }
  return {
    create: useMutation({ mutationFn: createExamWindow, onSuccess: invalidate }),
    publishWindow: useMutation({ mutationFn: publishExamWindow, onSuccess: invalidate }),
  }
}
```

- [ ] **Adım 4: Tasarımı oku ve ekranı yaz**

Tasarım kaynağı `web/exam-windows.jsx` + `web/exam-data.jsx` + `web/exam.css`, **DesignSync** ile okunur:

```
DesignSync method="get_file" projectId="7d876f6c-70ee-4894-bac1-2be5c96dd34a" path="web/exam-windows.jsx"
```

Gate-2 (marka) ve gate-3 (bileşen eşleme) envanteri bu ekran için ayrıca yapılır. Ham hex `packages/ui/src/styles/exam.css` içinde scoped değişkene taşınır; `PageHeader` `@/components/shared/page-header`'dan gelir.

**Durum matrisi (R8), gerçek query state'ine bağlanır:**

| Hâl | Koşul | Ekran |
|---|---|---|
| `loading` | `isPending` | İskelet kartlar |
| `empty` | `data.length === 0` | "Bu dönemde sınav penceresi yok" + tek aksiyon |
| `error` | `isError` | Hata kartı + yeniden dene |
| `locked` | `status === "locked"` | Kart soluk, aksiyonlar kapalı |

- [ ] **Adım 5: Route'u ve stili bağla**

```tsx
// apps/web/app/(dashboard)/exams/page.tsx
import { ExamPage } from "@/features/exam"

export default function Page() {
  return <ExamPage />
}
```

`packages/ui/src/styles/globals.css` içine grade satırının ardına:

```css
@import "./exam.css"; /* Sınav takvimi — pencere kartı, pano, yerleştirme, etiket (.ex, .exw-*, .exb-*, .exp-*) */
```

- [ ] **Adım 6: Kalite kapısı ve commit**

```bash
npx vitest run packages/api/src/exam
npm run typecheck && npm run lint
git add packages/api packages/ui apps/web
git commit -m "feat(web): sınav pencereleri hub'ı ve exam api katmanı"
```

---

### Görev 1.8: Öğretmen yerleştirme ekranı

**Files:**
- Create: `apps/web/features/exam/exam-place-screen.tsx`
- Create: `apps/web/features/exam/exam-slot-picker.tsx`
- Modify: `packages/api/src/exam/{endpoints.ts,queries.ts}` (`useMyExamPlacements`, `usePlacementSlots`, `usePlaceExam`, `useRequestExamHour`)
- Modify: `apps/web/features/exam/exam-page.tsx` (rol dallanması: yönetici → pencereler, öğretmen → yerleştirme)

**Interfaces:**
- Consumes: Görev 1.6 uçları; `examPlacementBadge()` (`@workspace/core`).
- Produces: `<ExamPlaceScreen />`, `<ExamSlotPicker />`.

- [ ] **Adım 1: Tasarımı oku**

`web/exam-place.jsx` DesignSync ile okunur; sekme seti `EXAM_TEACHER_TABS` tek yerde tanımlıdır (R12), ekran kendi listesini üretmez.

- [ ] **Adım 2: Saat seçiciyi yaz**

Kurallar ekranda **tekrarlanmaz**, sunucudan gelen `slots` yanıtı çizilir:

- `isOwnLesson: false` olan hücre **kapalı** ve nedeni yazılı ("Bu saatte bu şubede dersiniz yok").
- Kapalı hücreye tıklanamaz; ödünç saat için ayrı bölüm vardır.
- Sunucu 409 döndüğünde mesaj olduğu gibi gösterilir; istemci kendi cümlesini kurmaz.

- [ ] **Adım 3: "Aynı sınavı başka şubelerde de yap" bölümünü yaz**

Aynı seviyedeki şubeler listelenir; her satırda o saatteki ev sahibi ("9-B · Tarih · Ayşe Yılmaz"). İşaretlenenler için `:request-hour` çağrılır. Gönderim sonrası satır `pendingRequest` rozetine döner — rozet `examPlacementBadge()` ile türetilir, elle yazılmaz.

- [ ] **Adım 4: Durum matrisi**

`loading` · `empty` ("Açık sınav penceresi yok") · `error` · `windowLocked` · `allPlaced` (sakin özet, kutlama değil).

- [ ] **Adım 5: Kalite kapısı ve commit**

```bash
npm run typecheck && npm run lint
git add apps/web packages/api
git commit -m "feat(web): öğretmen sınav yerleştirme ekranı ve saat seçici"
```

> **Dilim 1 biterken elde ne var:** yönetici pencere kurup yayınlayabiliyor, öğretmen kendi
> sınavını kendi saatine koyabiliyor, başka şube için saat isteyebiliyor. Takvim henüz
> yayınlanmıyor ve kimseye bildirim gitmiyor — o Dilim 2 ve 3'ün işi.

---

# Dilim 2 · Kural ve yayın

### Görev 2.1: Revizyon kaydı, sınav taşıma ve pencere revizyonu

**Files:**
- Create: `src/Oksis.Domain/Modules/Exams/Entities/ExamWindowRevision.cs`
- Create: `src/Oksis.Domain/Modules/Exams/Enums/ExamRevisionKind.cs` (`ExamMoved = 1, HourReassigned = 2, WindowRevised = 3`)
- Create: `src/Oksis.Infrastructure/Persistence/Configurations/Exams/ExamWindowRevisionConfiguration.cs`
- Create: `src/Oksis.Application/Modules/Exams/Commands/MoveExam/{MoveExamCommand,MoveExamCommandHandler}.cs`
- Modify: `src/Oksis.Application/Common/Abstractions/IApplicationDbContext.cs`, `OksisDbContext.cs`
- Create: migration `20260910_exam_window_revisions`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/MoveExamCommandHandlerTests.cs`

**Interfaces:**
- Produces: `ExamWindowRevision.Create(schoolId, windowId, version, kind, reason, byPersonId, at, examId)`, `POST /api/v1/exams/{examId}:move`.

`ExamWindowRevision` alanları: `ExamWindowId`, `Version`, `Kind` (`ExamMoved` / `HourReassigned` / `WindowRevised`), `ScheduledExamId?`, `Reason`, `ByPersonId`, `At`, `FromDate?`, `FromPeriod?`, `ToDate?`, `ToPeriod?`. Append-only; güncellenmez, silinmez.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_RequireReason_When_PublishedExamIsMoved()
{
    var result = await NewHandler(windowStatus: ExamWindowStatus.SchedulePublished).Handle(
        new MoveExamCommand(ExamId, new DateOnly(2027, 3, 11), 4, Reason: "kısa"), default);
    result.IsSuccess.Should().BeFalse();
}

[Fact]
public async Task Should_NotRequireReason_When_WindowIsNotYetPublished()
{
    // Taslakta taşımak "değişiklik" değil, henüz kimse görmedi.
    var result = await NewHandler(windowStatus: ExamWindowStatus.WindowPublished).Handle(
        new MoveExamCommand(ExamId, new DateOnly(2027, 3, 11), 4, Reason: null), default);
    result.IsSuccess.Should().BeTrue();
}

[Fact]
public async Task Should_BumpVersionAndWriteRevision_When_PublishedExamIsMoved()
{
    var (result, db) = await MoveOnPublishedWindow("9-B Matematik sınavı 13 Mart'a alındı");
    result.IsSuccess.Should().BeTrue();
    db.Revisions.Should().ContainSingle(r => r.Kind == ExamRevisionKind.ExamMoved);
    db.Window.Version.Should().Be(2);
}

[Fact]
public async Task Should_WarnBelowLeadTime_When_MovedExamIsTooClose()
{
    var (result, _) = await MoveOnPublishedWindow(
        "Salon çakışması nedeniyle öne alındı", toDate: Today.AddDays(3));
    result.Value.warnings.Should().Contain(w => w.Code == "EX-H08");
}
```

- [ ] **Adım 2: Kırmızıyı gör, sonra yaz**

Handler akışı: sınavı ve pencereyi al → yayınlanmışsa gerekçe zorunlu (`ExamWindow.MinReasonLength`) → kural denetimi (Görev 1.4) → `exam.PlaceOwnHour(...)` ya da `PlaceBorrowedHour(...)` → yayınlanmışsa `window.Revise(reason, personId, now)` + `ExamWindowRevision` ekle → `ExamMovedEvent` yayınla (bildirim Görev 3.3'te bağlanır).

- [ ] **Adım 3: Migration, testler, commit**

```bash
dotnet ef migrations add 20260910_exam_window_revisions --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
./scripts/test-changed.sh --filter MoveExam
git commit -am "feat(exams): sınav taşıma, revizyon kaydı ve sürüm artışı"
```

---

### Görev 2.2: Takvim yayını ve ön koşullar

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Commands/PublishExamSchedule/{Command,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Queries/GetPublishPreflight/{Query,Handler}.cs`
- Modify: `src/Oksis.Application/Modules/Exams/Internal/ExamRuleInspector.cs` (`CheckPublishAsync` + `public const int MinPublishLeadDays = 7;` — Görev 4.1'de okul ayarına bağlanır)
- Modify: `src/Oksis.Api/Controllers/V1/ExamsController.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/PublishExamScheduleTests.cs`

**Interfaces:**
- Produces: `ExamRuleInspector.CheckPublishAsync(Guid windowId, DateOnly today, CancellationToken)` → `IReadOnlyList<ExamViolationDto>`; uçlar `GET /api/v1/exams/windows/{id}/preflight`, `POST /api/v1/exams/windows/{id}:publish-schedule`.

**Ön koşul tablosu — tek yerde, hem önizleme hem yayın aynı metodu çağırır:**

| Kod | Sertlik | Kural |
|---|---|---|
| `EX-H09` | Sert | Bekleyen saat isteği var (`hourRequestStatus == pending`) |
| `EX-H08` | Sert, gerekçeyle geçilir | İlk sınava kalan gün < `minPublishLeadDays` (varsayılan 7) |
| `EX-S05` | Yumuşak, gerekçeyle geçilir | Yerleşmemiş şube × ders var |
| `EX-H01` | Sert | Herhangi bir şubede gün başına sınav sınırı aşılmış |

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_Block_When_HourRequestIsStillPending()
{
    var result = await Publish(pendingRequests: 1, unplaced: 0, daysToFirst: 20, reason: null);
    result.IsSuccess.Should().BeFalse();
    result.Error.Message.Should().Contain("bekleyen saat isteği");
}

[Fact]
public async Task Should_Block_When_LeadTimeIsShortAndNoReasonGiven()
{
    var result = await Publish(pendingRequests: 0, unplaced: 0, daysToFirst: 3, reason: null);
    result.IsSuccess.Should().BeFalse();
    result.Error.Message.Should().Contain("7 gün");
}

[Fact]
public async Task Should_Publish_When_LeadTimeIsShortButReasonGiven()
{
    var result = await Publish(0, 0, daysToFirst: 3,
        reason: "Yönetmelik gereği dönem sonuna sığdırılması zorunlu");
    result.IsSuccess.Should().BeTrue();
    result.Value.status.Should().Be("schedulePublished");
}

[Fact]
public async Task Should_Publish_When_UnplacedExistsAndReasonGiven()
{
    var result = await Publish(0, unplaced: 2, daysToFirst: 20,
        reason: "İki ders için öğretmen ataması yapılmadı, sonra eklenecek");
    result.IsSuccess.Should().BeTrue();
}

[Fact]
public async Task Should_Block_When_UnplacedExistsAndNoReasonGiven()
{
    var result = await Publish(0, unplaced: 2, daysToFirst: 20, reason: null);
    result.IsSuccess.Should().BeFalse();
}

[Fact]
public async Task Should_ReturnSameViolations_When_PreflightIsCalled()
{
    // Önizleme ile yayın AYNI metodu çağırır; ekranın gördüğü liste yayının uyguladığıdır.
    var preflight = await Preflight(pendingRequests: 1, unplaced: 2, daysToFirst: 3);
    preflight.Should().HaveCount(3);
    preflight.Select(v => v.Code).Should().BeEquivalentTo(["EX-H09", "EX-H08", "EX-S05"]);
}
```

- [ ] **Adım 2: Kırmızıyı gör, sonra `CheckPublishAsync`'i yaz**

```csharp
public async Task<IReadOnlyList<ExamViolationDto>> CheckPublishAsync(
    Guid windowId, DateOnly today, CancellationToken cancellationToken)
{
    var violations = new List<ExamViolationDto>();
    var window = await db.ExamWindows.AsNoTracking().FirstAsync(w => w.Id == windowId, cancellationToken);

    var pending = await db.ScheduledExams.AsNoTracking().CountAsync(
        e => e.ExamWindowId == windowId && e.HourRequestStatus == HourRequestStatus.Pending, cancellationToken);
    if (pending > 0)
    {
        violations.Add(new ExamViolationDto("EX-H09", "hard",
            $"{pending} bekleyen saat isteği var; yayın öncesi hepsi karara bağlanmalıdır.", null, null));
    }

    var firstExamDate = await db.ScheduledExams.AsNoTracking()
        .Where(e => e.ExamWindowId == windowId && e.Date != null)
        .MinAsync(e => e.Date, cancellationToken);
    if (firstExamDate is { } first && first.DayNumber - today.DayNumber < MinPublishLeadDays)
    {
        violations.Add(new ExamViolationDto("EX-H08", "hard",
            $"İlk sınava {first.DayNumber - today.DayNumber} gün kaldı; alt sınır {MinPublishLeadDays} gün. "
            + "Yayınlamak için gerekçe girilmelidir.", null, null));
    }

    var unplaced = await db.ScheduledExams.AsNoTracking().CountAsync(
        e => e.ExamWindowId == windowId && e.PlacementState == ExamPlacementState.Unplaced, cancellationToken);
    if (unplaced > 0)
    {
        violations.Add(new ExamViolationDto("EX-S05", "soft",
            $"{unplaced} şube × ders için sınav saati seçilmedi.", null, null));
    }

    return violations;
}
```

**Gerekçe kuralı:** `EX-H08` sert ama gerekçeyle geçilir; `EX-S05` yumuşak ve gerekçeyle geçilir; `EX-H09` **gerekçeyle geçilmez**. Handler bu ayrımı tek yerde uygular:

```csharp
var blocking = violations.Where(v => v.Code == "EX-H09" || v.Code == "EX-H01").ToList();
if (blocking.Count > 0) { return Result<ExamWindowDto>.Conflict(string.Join(" ", blocking.Select(v => v.Message))); }

var needsReason = violations.Any(v => v.Code is "EX-H08" or "EX-S05");
if (needsReason && string.IsNullOrWhiteSpace(request.Reason))
{
    return Result<ExamWindowDto>.Conflict(string.Join(" ", violations.Select(v => v.Message)));
}

window.PublishSchedule(personId, now, request.Reason);
```

- [ ] **Adım 3: Testleri koştur ve commit**

```bash
./scripts/test-changed.sh --filter PublishExamSchedule
git commit -am "feat(exams): takvim yayını, ön koşul denetimi ve gerekçe kapısı"
```

---

### Görev 2.3: Yönetici panosu projeksiyonu

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Queries/GetExamBoard/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Contracts/ExamBoardDto.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Exams/ExamBoardQueryTests.cs` (**gerçek SQL**)

**Interfaces:**
- Produces: `GET /api/v1/exams/windows/{id}/board` → `ExamBoardDto(kpi, exams, violations, heatmap, teachers)`.

**Neden entegrasyon testi:** pano üç eksende gruplama yapar (şube × gün ısı haritası, öğretmen bazlı eksik listesi, ihlal listesi) ve bunlar EF Core'un çeviremediği ifadelerle kolayca bellek-içi değerlendirmeye kayar. Bellekte yeşil olup gerçek SQL'de patlayan sorgu bu depoda daha önce yaşandı.

- [ ] **Adım 1: Entegrasyon testini yaz**

```csharp
[Fact]
public async Task Should_CountExamsPerSectionPerDay_When_BoardIsRead()
{
    await SeedAsync(exams:
    [
        Exam("9-A", "Matematik", "2027-03-09", 2, placed: true),
        Exam("9-A", "Fizik",     "2027-03-09", 6, placed: true),
        Exam("9-B", "Matematik", "2027-03-09", 4, placed: true),
        Exam("9-A", "Kimya",     null,          null, placed: false),
    ]);

    var board = await Send(new GetExamBoardQuery(WindowId));

    board.kpi.totalCount.Should().Be(4);
    board.kpi.placedCount.Should().Be(3);
    board.heatmap.Should().Contain(c => c.sectionName == "9-A" && c.date == "2027-03-09" && c.count == 2);
    board.violations.Should().Contain(v => v.Code == "EX-S05");
}

[Fact]
public async Task Should_ListUnplacedByTeacher_When_BoardIsRead()
{
    var board = await Send(new GetExamBoardQuery(WindowId));
    board.teachers.Should().Contain(t => t.unplacedCount > 0);
}
```

- [ ] **Adım 2: Kırmızıyı gör, sorguyu yaz**

Tek `ToListAsync` ile satırlar çekilir, gruplama **bellekte** yapılır ve bu bilinçlidir: bir pencere en çok birkaç yüz satır taşır, SQL tarafında üç ayrı gruplama sorgusu açmak daha pahalıdır. Yorumla gerekçelendir.

- [ ] **Adım 3: Koştur ve commit**

```bash
./scripts/test-changed.sh --integration --filter ExamBoardQueryTests
git commit -am "feat(exams): yönetici sınav panosu projeksiyonu"
```

---

### Görev 2.4: Saat isteği cevaplama ve listeleme

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Commands/AnswerHourRequest/{Command,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Queries/ListHourRequests/{Query,Handler}.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/AnswerHourRequestTests.cs`

**Interfaces:**
- Produces: `POST /api/v1/exams/hour-requests/{id}:answer` (gövde `{ accepted: bool, note: string? }`), `GET /api/v1/exams/hour-requests?windowId=`.

**Yönetici geçemez (K-8):** komut `[RequirePermission("exams.place")]` taşır **ve** handler ayrıca `request.HostTeacherId == currentTeacherId` kontrolü yapar. İzin tek başına yetmez: `exams.manage` sahibi bir yönetici de bu ucu çağırabilirdi.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_Forbid_When_CallerIsNotHostTeacher()
{
    var result = await NewHandler(currentTeacher: Guid.NewGuid()).Handle(
        new AnswerHourRequestCommand(RequestId, Accepted: true, Note: null), default);
    result.IsSuccess.Should().BeFalse();
    result.Error.Should().Be(Error.Forbidden);
}

[Fact]
public async Task Should_PlaceExam_When_HostAccepts()
{
    var (result, exam) = await Answer(accepted: true);
    result.IsSuccess.Should().BeTrue();
    exam.PlacementState.Should().Be(ExamPlacementState.Placed);
    exam.HourRequestStatus.Should().Be(HourRequestStatus.Accepted);
}

[Fact]
public async Task Should_ClearSlot_When_HostDeclines()
{
    var (_, exam) = await Answer(accepted: false, note: "O saatte grup sunumu var");
    exam.PlacementState.Should().Be(ExamPlacementState.Unplaced);
    exam.Date.Should().BeNull();
}

[Fact]
public async Task Should_Reject_When_RequestIsAlreadyAnswered()
{
    var result = await AnswerTwice();
    result.IsSuccess.Should().BeFalse();
}

[Fact]
public async Task Should_ComputeDirectionPerViewer_When_RequestsAreListed()
{
    // D-3: direction kolon değildir, bakan kullanıcıya göre hesaplanır.
    var asHost = await List(currentTeacher: HostTeacher);
    var asRequester = await List(currentTeacher: RequesterTeacher);
    asHost.Single(r => r.id == RequestId).direction.Should().Be("incoming");
    asRequester.Single(r => r.id == RequestId).direction.Should().Be("outgoing");
}
```

- [ ] **Adım 2: Kırmızıyı gör, yaz, koştur, commit**

Handler: isteği al → ev sahibi mi → `request.Answer(accepted, note, now)` → kabul ise `exam.AcceptBorrowedHour()`, ret ise `exam.DeclineBorrowedHour()` → `ExamHourAnsweredEvent` yayınla → kaydet.

Liste sorgusu `expiresAt` alanını pencerenin `DraftDueDate`'inden, `hostCourseName` alanını `IExamScheduleReader` ile o hücrenin dersinden doldurur.

```bash
./scripts/test-changed.sh --filter HourRequest
git commit -am "feat(exams): saat isteği cevaplama ve yön hesaplı listeleme"
```

---

### Görev 2.5: Pano, saat istekleri ve yayın modali ekranları

**Files:**
- Create: `apps/web/features/exam/{exam-board-screen.tsx,exam-hour-requests-screen.tsx,exam-window-modals.tsx,exam-heatmap.tsx}`
- Modify: `packages/api/src/exam/{endpoints.ts,queries.ts}`
- Modify: `packages/ui/src/styles/exam.css`

**Interfaces:**
- Consumes: Görev 2.2–2.4 uçları.
- Produces: `useExamBoard(windowId)`, `usePublishPreflight(windowId)`, `useHourRequests(windowId)`, `useHourRequestActions()`.

- [ ] **Adım 1: Tasarımı oku** — `web/exam-board.jsx`, `web/exam-hour-requests.jsx`, `web/exam-window-modals.jsx` (DesignSync).

- [ ] **Adım 2: Yayın modalini yaz.** Ön koşul listesi `usePublishPreflight` çıktısından çizilir; **istemci kendi kontrolünü yapmaz**. Gerekçe alanı yalnız `EX-H08` ya da `EX-S05` varsa görünür ve zorunlu olur. `EX-H09` varsa düğme kapalıdır ve neden yazılıdır.

- [ ] **Adım 3: Isı haritasını yaz.** Hücrede **sayı** yazar; renk yalnız destekler. 3 ve üzeri `danger` tonundadır.

- [ ] **Adım 4: Saat istekleri ekranını yaz.** İki sekme (`incoming` / `outgoing`) sunucudan gelen `direction` alanıyla süzülür; istemci kendi yönünü hesaplamaz.

- [ ] **Adım 5: Kalite kapısı ve commit**

```bash
npm run typecheck && npm run lint
git commit -am "feat(web): sınav panosu, saat istekleri ve yayın onay modali"
```

---

### Görev 2.6: Şube sınav takvimi yazdırma

**Files:**
- Create: `apps/web/features/exam/exam-print-section-schedule.tsx`
- Modify: `packages/ui/src/styles/exam.css` (`@media print` bloğu)
- Modify: `apps/web/features/exam/exam-board-screen.tsx` (yazdır aksiyonu)

**Interfaces:**
- Consumes: Görev 2.3'ün pano verisi (ek uç açılmaz).
- Produces: şube başına yazdırılabilir takvim; `window.print()` ile çıkar.

Faz 1'in tek yazdırma çıktısı budur. Kapı listesi, oturma planı ve gözetmen çizelgesi
kelebeğe aittir ve Faz 2'de gelir.

- [ ] **Adım 1: Yazdırma görünümünü yaz.** Tablo: gün (satır) × ders saati (sütun), hücrede
ders adı ve sınav türü. Başlıkta okul adı, dönem, sınav türü ve yayın sürümü.

- [ ] **Adım 2: Baskıda renk yok sayılır.** Sınav hücresi çerçeve ve kalın metinle ayrılır;
ders tonu ekranda kalır, kağıtta bilgi taşımaz. `@media print` bloğunda gezinme, düğmeler
ve yan panel gizlenir.

- [ ] **Adım 3: Kalite kapısı ve commit**

```bash
npm run typecheck && npm run lint
git commit -am "feat(web): şube sınav takvimi yazdırma görünümü"
```

---

# Dilim 3 · Bağlar

### Görev 3.1: Not modülü tarih beslemesi

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Events/ExamScheduleReleasedHandler.cs`
- Modify: `src/Oksis.Application/Modules/Grades/Commands/SetAssessmentExamDate/SetAssessmentExamDateCommandHandler.cs`
- Modify: `src/Oksis.Api/Errors/ErrorMessageCatalog.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/ExamScheduleReleasedHandlerTests.cs`

**Interfaces:**
- Consumes: `ExamSchedulePublishedEvent` (Görev 1.1), `Assessment.SetExamDate` (mevcut), `GradeBook` koordinatı (dönem × şube × ders).
- Produces: yayın anında `Assessment.ExamDate` güncellemesi; `SetAssessmentExamDate` ucunda kapı.

**İki yön:**
1. **İleri:** takvim yayınlanınca her planlı sınav için `GradeBook(term, classRoom, subject)` × `examTypeId` sütunu **varsa** tarihi yazılır. Sütun **yoksa oluşturulmaz** — sütun ilk not girişinde doğar (not modülünün kuralı, bozulmaz).
2. **Geri:** sütun sonradan doğduğunda tarihini pencereden alır. Bu, `Assessment` oluşturma yolunda tek satırlık bir arama ile yapılır.

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_WriteExamDate_When_ScheduleIsPublishedAndColumnExists()
{
    var db = WithBook(term: T, section: S, subject: M, assessmentFor: ExamType1);
    await Handle(new ExamSchedulePublishedEvent(WindowId, SchoolId, T, ExamType1, Version: 1), db);
    db.Assessment(ExamType1).ExamDate.Should().Be(new DateOnly(2027, 3, 9));
}

[Fact]
public async Task Should_NotCreateColumn_When_AssessmentDoesNotExist()
{
    var db = WithBook(term: T, section: S, subject: M, assessmentFor: null);
    await Handle(new ExamSchedulePublishedEvent(WindowId, SchoolId, T, ExamType1, 1), db);
    db.Assessments.Should().BeEmpty("sütun ilk not girişinde doğar, yayın onu doğurmaz");
}

[Fact]
public async Task Should_SkipUnplacedExams_When_SchedulePublished()
{
    var db = WithBook(term: T, section: S, subject: M, assessmentFor: ExamType1);
    await Handle(EventWithUnplacedExam(), db);
    db.Assessment(ExamType1).ExamDate.Should().BeNull();
}

[Fact]
public async Task Should_RejectManualDate_When_PublishedWindowOwnsIt()
{
    var result = await SetExamDateManually(windowStatus: ExamWindowStatus.SchedulePublished);
    result.IsSuccess.Should().BeFalse();
    result.Error.Message.Should().Contain("sınav takviminden");
}
```

- [ ] **Adım 2: Kırmızıyı gör, handler'ı yaz**

```csharp
/// <summary>
/// Takvim yayınlandığında not sütunlarının tarihini besler.
/// </summary>
/// <remarks>
/// <b>Sütun oluşturmaz.</b> Not defteri ve sütunu TEMBEL doğar (ilk not girişinde);
/// yayın anında boş sütun üretmek "sütun varsa giriş başlamıştır" varsayımını kırardı —
/// aynı gerekçe <c>GradeEntryReminder</c>'ın ayrı tablo olmasının da sebebiydi.
/// </remarks>
public sealed class ExamScheduleReleasedHandler(IApplicationDbContext db)
    : INotificationHandler<ExamSchedulePublishedEvent>
{
    public async Task Handle(ExamSchedulePublishedEvent e, CancellationToken cancellationToken)
    {
        var exams = await db.ScheduledExams.AsNoTracking()
            .Where(x => x.ExamWindowId == e.ExamWindowId
                     && x.PlacementState == ExamPlacementState.Placed
                     && x.Date != null)
            .Select(x => new { x.ClassRoomId, x.SubjectId, x.Date })
            .ToListAsync(cancellationToken);
        if (exams.Count == 0) { return; }

        var sections = exams.Select(x => x.ClassRoomId).Distinct().ToList();
        var books = await db.GradeBooks
            .Where(b => b.AcademicTermId == e.AcademicTermId && sections.Contains(b.ClassRoomId))
            .Include(b => b.Assessments)
            .ToListAsync(cancellationToken);

        foreach (var exam in exams)
        {
            var book = books.FirstOrDefault(
                b => b.ClassRoomId == exam.ClassRoomId && b.SubjectId == exam.SubjectId);
            var assessment = book?.Assessments.FirstOrDefault(a => a.ExamTypeId == e.ExamTypeId);
            assessment?.SetExamDate(exam.Date);
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
```

- [ ] **Adım 3: Elle tarih girme kapısını ekle**

`SetAssessmentExamDateCommandHandler` başına: o dönem × sınav türü için **takvimi yayınlanmış** bir pencere varsa reddet.

```csharp
var ownedByWindow = await db.ExamWindows.AsNoTracking().AnyAsync(
    w => w.AcademicTermId == book.AcademicTermId
      && w.ExamTypeId == assessment.ExamTypeId
      && w.Status == ExamWindowStatus.SchedulePublished, cancellationToken);
if (ownedByWindow)
{
    return Result<AssessmentDto>.Conflict(
        "Bu sütunun tarihi sınav takviminden yönetilir; buradan değiştirilemez.");
}
```

Hata kataloğuna: `["exams.errors.date-owned-by-window"]`.

- [ ] **Adım 4: Koştur ve commit**

```bash
./scripts/test-changed.sh --filter ExamScheduleReleased
git commit -am "feat(exams): takvim yayını not sütunlarının tarihini besliyor"
```

---

### Görev 3.2: Program etiketi sorgusu ve taşınan yerleşim taraması

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Queries/GetExamBadges/{Query,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Commands/DetectMovedExams/{Command,Handler}.cs`
- Test: `tests/Oksis.Infrastructure.IntegrationTests/Exams/ExamBadgeQueryTests.cs`

**Interfaces:**
- Produces: `GET /api/v1/exams/badges?from=&to=&sectionId=` → `IReadOnlyList<ExamBadgeDto>` (alanlar `packages/core` `ExamBadge` ile birebir); `DetectMovedExamsCommand` (Hangfire'dan çağrılır).

**Yayınlanmamış takvim etiket üretmez.** Sorgu yalnız `Status == SchedulePublished` (ve `Locked`) pencerelerin sınavlarını döndürür. Bu, ekranda değil **sorguda** kapatılır.

- [ ] **Adım 1: Entegrasyon testini yaz**

```csharp
[Fact]
public async Task Should_ReturnNothing_When_ScheduleIsNotPublishedYet()
{
    await SeedAsync(windowStatus: ExamWindowStatus.WindowPublished);
    var badges = await Send(new GetExamBadgesQuery(From, To, SectionId));
    badges.Should().BeEmpty("yayınlanmamış bilgi programda görünmez");
}

[Fact]
public async Task Should_ReturnBadgeOnHostCell_When_HourIsBorrowed()
{
    // 9-B'nin Tarih saatinde Sağlık Bilgisi sınavı: etiket dersin DEĞİL sınavın dersini taşır.
    await SeedBorrowedHourAsync();
    var badges = await Send(new GetExamBadgesQuery(From, To, Section9B));
    var badge = badges.Should().ContainSingle().Subject;
    badge.courseName.Should().Be("Sağlık Bilgisi");
    badge.period.Should().Be(3);
}

[Fact]
public async Task Should_MarkMoved_When_HostPlacementDisappeared()
{
    await SeedAsync(withPublishedSchedule: true);
    await RepublishProgramWithoutPlacementAsync();
    await Send(new DetectMovedExamsCommand());
    var badges = await Send(new GetExamBadgesQuery(From, To, SectionId));
    badges.Single().isMoved.Should().BeTrue();
}
```

- [ ] **Adım 2: Kırmızıyı gör, sorguyu ve taramayı yaz**

`DetectMovedExamsCommand`: yayınlanmış pencerelerin `Placed` sınavlarını gez; her biri için `IExamScheduleReader` ile o günün hücrelerini oku; `HostPlacementId` artık yoksa ya da hücre iptal edilmişse `exam.MarkMoved()` çağır ve `ExamMovedEvent` yayınla (bildirim 3.3'te). Sweep idempotenttir: zaten `Moved` olan sınav tekrar işaretlenmez, ikinci bildirim gitmez.

- [ ] **Adım 3: Koştur ve commit**

```bash
./scripts/test-changed.sh --integration --filter ExamBadge
git commit -am "feat(exams): program etiketi sorgusu ve taşınan yerleşim taraması"
```

---

### Görev 3.3: Yedi bildirim türü

**Files (her biri emsal `GradeEntryReminder` turuyla birebir aynı sırayla):**
- Modify: `src/Oksis.Domain/Modules/Notifications/Enums/NotificationKind.cs`
- Modify: `src/Oksis.Domain/Modules/Notifications/NotificationKindMetadata.cs`
- Modify: `src/Oksis.Application/Modules/Notifications/Internal/PushEventKeyMap.cs`
- Modify: `src/Oksis.Infrastructure/Persistence/Seed/MasterData/{MasterSeedIds,NotificationEventTypeSeedData}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Events/ExamNotificationContent.cs`
- Create: `src/Oksis.Application/Modules/Exams/Events/Notifications/*.cs` (olay başına bir handler)
- Modify: `src/Oksis.Application/Modules/Notifications/Internal/PushDeepLinks.cs`
- Create: migration `20260911_exam_notification_events`
- Modify: dört test dosyası (aşağıda)

**Enum değerleri — SONA eklenir, araya girilmez.** Bugünkü en yüksek değer `32` (`GradeEntryReminder`); yeni türler `33`–`39`:

| Değer | Kind | Grup / Önem / Bekleyen iş | EventKey | Push |
|---|---|---|---|---|
| 33 | `ExamWindowPublished` | Academic / Info / false | `EXAM_WINDOW_PUBLISHED` | hayır |
| 34 | `ExamPlacementReminder` | Academic / Warning / **true** | `EXAM_PLACEMENT_REMINDER` | evet |
| 35 | `ExamHourRequested` | Academic / Warning / **true** | `EXAM_HOUR_REQUESTED` | evet |
| 36 | `ExamHourAnswered` | Academic / Info / false | `EXAM_HOUR_ANSWERED` | evet |
| 37 | `ExamSchedulePublished` | Academic / Info / false | `EXAM_SCHEDULE_PUBLISHED` | evet |
| 38 | `ExamMoved` | Academic / Warning / false | `EXAM_MOVED` | evet |
| 39 | `ExamTomorrow` | Academic / Info / false | `EXAM_TOMORROW` | evet |

`ExamHourExpired` **ayrı tür değildir** — `ExamHourAnswered` gövdesi "cevap gelmedi, süresi doldu" der. Gerekçe: alıcı, ilgi ve derin bağlantı aynıdır; ayrı tür tercih ekranında anlamsız bir satır daha açardı.

- [ ] **Adım 1: Dört testi ÖNCE güncelle (kırmızı olsunlar)**

1. `tests/Oksis.Application.UnitTests/Modules/Announcements/NotificationKindContinuityTests.cs` — yorum defterine yedi satır, `values.Max().Should().Be(39, "yeni degerler yalnizca SONA eklenir")`.
2. `tests/Oksis.Domain.UnitTests/Modules/Notifications/NotificationKindMetadataTests.cs` — `ActionableKinds` listesine `ExamPlacementReminder` ve `ExamHourRequested`.
3. `tests/Oksis.Application.UnitTests/Modules/Notifications/PushEventKeyMapTests.cs` — altı `[InlineData]` (push kapsamındakiler) + `PushableEventKeys` kümesine altı anahtar + metot adındaki sayı sözcüğünü güncelle.
4. `tests/Oksis.Infrastructure.IntegrationTests/Notifications/NotificationMatrixPushTests.cs` — `DefaultPushEnabled` kümesine altı anahtar + metot adındaki sayı sözcüğü.

Çalıştır: `./scripts/test-changed.sh` → dördü de KIRMIZI olmalı.

- [ ] **Adım 2: Enum, metadata, push eşlemesi ve seed'i yaz**

Her enum değerine **gerekçeli docblock** yazılır (kim alır, neden bekleyen iş, neden push). Seed satırı `Row(MasterSeedIds.NotificationEventTypes.X, "EXAM_...", "<Türkçe ad>", NotificationEventGroup.Academic, supportsSms: false, portal: true, email: false, sms: false, push: <tablo>, order: <grup içi>, delivered: true)`.

- [ ] **Adım 3: İçerik sınıfını yaz**

```csharp
internal static class ExamNotificationContent
{
    public static (string Title, string Body) WindowPublished(string examTypeName, string range)
        => ("📅 Sınav Haftası", $"{examTypeName} {range} haftasında yapılacak.");

    public static (string Title, string Body) PlacementReminder(int missingCount)
        => ("⏰ Sınav Saati Seçilmedi",
            missingCount == 1
                ? "Bir dersinizin sınav saati henüz seçilmedi."
                : $"{missingCount} dersinizin sınav saati henüz seçilmedi.");

    public static (string Title, string Body) HourRequested(
        string requester, string sectionName, string hostCourseName, string dayLabel, int period)
        => ("🤝 Saat İsteği",
            $"{requester}, {dayLabel} {period}. ders ({hostCourseName} saatiniz) için "
            + $"{sectionName} şubesinde sınav yapmak istiyor.");

    public static (string Title, string Body) HourAnswered(string host, bool accepted, bool expired)
        => ("🤝 Saat İsteği",
            expired ? $"{host} isteğinize cevap vermedi; süre doldu, başka saat seçmelisiniz."
                    : accepted ? $"{host} saatini sınavınıza açtı."
                               : $"{host} isteğinizi reddetti; başka saat seçmelisiniz.");

    public static (string Title, string Body) SchedulePublished(string examTypeName)
        => ("📅 Sınav Takvimi Yayınlandı", $"{examTypeName} takvimi yayınlandı.");

    public static (string Title, string Body) Moved(string courseName, string dayLabel)
        => ("⚠️ Sınav Tarihi Değişti", $"{courseName} sınavı {dayLabel} gününe alındı.");

    public static (string Title, string Body) Tomorrow(string courseName, string? roomAndSeat)
        => ("📌 Yarın Sınav",
            roomAndSeat is null ? $"Yarın {courseName} sınavı var."
                                : $"Yarın {courseName} sınavı var · {roomAndSeat}.");
}
```

`PushDeepLinks`'e iki metot: `Exams()` → `/exams`, `ExamPlacement(Guid windowId)` → `/exams/place?windowId=...`.

- [ ] **Adım 4: Olay işleyicilerini yaz**

Her biri `INotificationHandler<TEvent>`; alıcıları `INotificationRecipientResolver` ile çözer, `INotificationEnqueuer.Enqueue(eventId, schoolId, kind, title, body, deepLink, recipients)` çağırır. `eventId` `DeterministicGuid.Combine(...)` ile üretilir — aynı olay iki kez işlenirse ikinci bildirim düşmez.

- [ ] **Adım 5: Migration üret, testleri koştur, commit**

```bash
dotnet ef migrations add 20260911_exam_notification_events --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
./scripts/test-changed.sh --integration
git commit -am "feat(exams): yedi sınav bildirimi türü, seed satırları ve olay işleyicileri"
```

---

### Görev 3.4: Zamanlanmış işler

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Commands/SendExamPlacementReminders/{Command,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Commands/ExpireHourRequests/{Command,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Commands/SendExamTomorrowReminders/{Command,Handler}.cs`
- Create: `src/Oksis.Application/Modules/Exams/Commands/LockFinishedExamWindows/{Command,Handler}.cs`
- Create: `src/Oksis.Infrastructure/BackgroundJobs/Jobs/ExamDailySweepJob.cs`
- Modify: `src/Oksis.Api/Extensions/HangfireSetup.cs`
- Test: `tests/Oksis.Api.UnitTests/Extensions/HangfireRecurringJobRegistrationTests.cs` + handler testleri

**Interfaces:**
- Produces: recurring job `exams.daily-sweep`, cron `0 6 * * *` (Istanbul), config anahtarı `ExamsDailySweep`.

**Tek sweep, dört adım** — dört ayrı recurring job açmak yerine tek iş içinde sırayla: (1) düşen saat istekleri, (2) taşınan yerleşim taraması (Görev 3.2), (3) yerleştirme hatırlatmaları, (4) biten pencerelerin kilidi. Gerekçe: dördü de aynı okul döngüsünü ve aynı tenant geçişini kullanıyor; dört job dört kez `SetForLoginFlow` ve dört kez okul taraması demekti.

- [ ] **Adım 1: Hatırlatma kapısı testini yaz**

```csharp
[Fact]
public async Task Should_NotRemindTwice_When_SweepRunsAgainSameDay()
{
    await Sweep(); await Sweep();
    Enqueuer.Received(1).Enqueue(
        Arg.Any<Guid>(), Arg.Any<Guid>(), NotificationKind.ExamPlacementReminder,
        Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<IReadOnlyList<Guid>>());
}

[Fact]
public async Task Should_StartReminding_When_DraftDueIsWithinLeadWindow()
{
    // draftDueLeadDays = 14: hatırlatma taslak tarihinden 14 gün önce başlar.
    await Sweep(today: DraftDue.AddDays(-14));
    Enqueuer.ReceivedWithAnyArgs(1).Enqueue(default, default, default, default!, default!, default, default!);
}

[Fact]
public async Task Should_NotRemind_When_TeacherHasNoUnplacedExam()
{
    await Sweep(allPlaced: true);
    Enqueuer.DidNotReceiveWithAnyArgs().Enqueue(default, default, default, default!, default!, default, default!);
}

[Fact]
public async Task Should_ExpirePendingRequests_When_DraftDueDatePassed()
{
    await Sweep(today: DraftDue.AddDays(1));
    Request.Status.Should().Be(HourRequestStatus.Expired);
    Exam.PlacementState.Should().Be(ExamPlacementState.Unplaced);
}
```

**Günlük tekrar kapısı** `GradeEntryReminder` kalıbıyla ayrı tablo değil, `ScheduledExam` üzerinde de değil: `ExamPlacementReminder` kaydı `(SchoolId, ExamWindowId, TeacherPersonId, SentOn)` tekilliğiyle yeni bir küçük tabloda tutulur. Gerekçe aynı: sınav satırı tembel doğar, hatırlatma tam olarak satırın olmadığı durumda gider.

- [ ] **Adım 2: Kırmızıyı gör, handler'ları ve job'ı yaz**

- [ ] **Adım 3: Hangfire kaydını ekle**

`HangfireSetup.cs` içinde cron sabiti ve kayıt, `CronMaterializeDailySessions` komşuluğunda:

```csharp
private const string CronExamsDailySweep = "0 6 * * *"; // her gün 06:00 — yoklama materializasyonundan ÖNCE
```

`HangfireRecurringJobRegistrationTests` içindeki beklenen job listesine `exams.daily-sweep` eklenir.

- [ ] **Adım 4: Koştur ve commit**

```bash
./scripts/test-changed.sh
git commit -am "feat(exams): günlük sweep — düşen istekler, taşınan sınavlar, hatırlatmalar, kilit"
```

---

### Görev 3.5: Öğrenci ve veli sınav takvimi ucu

**Files:**
- Create: `src/Oksis.Application/Modules/Exams/Queries/GetMyExamSchedule/{Query,Handler}.cs`
- Modify: `src/Oksis.Api/Controllers/V1/ExamsController.cs`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/GetMyExamScheduleTests.cs`

**Interfaces:**
- Produces: `GET /api/v1/exams/me/schedule?termId=` ve `GET /api/v1/exams/children/{studentId}/schedule?termId=`.

**Üç hâl döner, ikisi değil:** `windowOnly` (pencere yayında, takvim değil) ayrı bir durumdur ve **boş liste değildir**. Yanıt şekli:

```csharp
public sealed record MyExamScheduleDto(
    string state,                       // "empty" | "windowOnly" | "published"
    ExamWindowSummaryDto? window,       // windowOnly ve published hâllerinde dolu
    IReadOnlyList<ExamScheduleDayDto> days);
```

- [ ] **Adım 1: Testi yaz**

```csharp
[Fact]
public async Task Should_ReturnWindowOnly_When_ScheduleIsNotPublishedYet()
{
    var result = await Send(windowStatus: ExamWindowStatus.WindowPublished);
    result.state.Should().Be("windowOnly");
    result.window!.startDate.Should().Be("2027-03-09");
    result.days.Should().BeEmpty("hafta biliniyor, gün ayrıntısı bilinmiyor");
}

[Fact]
public async Task Should_GroupByDay_When_SchedulePublished()
{
    var result = await Send(windowStatus: ExamWindowStatus.SchedulePublished);
    result.state.Should().Be("published");
    result.days.Should().HaveCount(2);
    result.days[0].exams.Should().BeInAscendingOrder(e => e.period);
}

[Fact]
public async Task Should_ReturnEmpty_When_NoWindowExists()
{
    (await Send(window: null)).state.Should().Be("empty");
}

[Fact]
public async Task Should_Forbid_When_ParentAsksForUnrelatedChild()
{
    var result = await SendForChild(Guid.NewGuid());
    result.IsSuccess.Should().BeFalse();
}
```

- [ ] **Adım 2: Kırmızıyı gör, yaz, koştur, commit**

Saat metni zil çizelgesinden türetilir (`BellDayAssignment` + `BellSchedule`, `SlotType == Lesson` sıralı ordinal). Derslik: Faz 1'de şubenin kendi dersliği; `seatNo` her zaman `null` (Faz 2'de dolar).

```bash
./scripts/test-changed.sh --filter GetMyExamSchedule
git commit -am "feat(exams): öğrenci ve veli sınav takvimi ucu — pencere ve takvim ayrı hâller"
```

---

### Görev 3.6: Program etiketi ve mobil takvim ekranları

**Files:**
- Create: `apps/web/features/exam/exam-schedule-tag.tsx`
- Modify: `apps/web/features/schedule/read-only/parts.tsx` (`SroCell` içine etiket), `apps/web/features/schedule/editor-page.tsx` (`LessonChip` üstüne etiket)
- Create: `apps/mobile/src/features/exam/components/{exam-schedule-screen.tsx,exam-schedule-tag.tsx}`, `apps/mobile/src/features/exam/index.ts`
- Modify: `apps/mobile/src/features/schedule/components/{lesson-row.tsx,week-screen.tsx}`
- Modify: `apps/mobile/src/features/grade/components/grade-tab-screen.tsx` (görünüm seçicisi yeni ekrana bağlanır)
- Modify: `packages/api/src/exam/{endpoints.ts,queries.ts}` (`useExamBadges`, `useMyExamSchedule`)
- Modify: `packages/core/src/grade/types.ts` + `packages/api/src/grade/{contract.ts,endpoints.ts,queries.ts}` (eski `useExamSchedule` emekliye ayrılır)
- Delete: `apps/mobile/src/features/grade/components/grade-exam-schedule-screen.tsx`

**Interfaces:**
- Consumes: Görev 3.2 ve 3.5 uçları; `SUBJECT_PALETTE` + `subjectColorIndex` (`packages/core/src/schedule/{constants,logic}.ts`).
- Produces: `<ExamScheduleTag />` (web + mobil), `<ExamScheduleScreen />` (mobil).

**Barrel takma adı kaldırılır (Görev 0.1 sapması).** `packages/core/src/index.ts` bugün
sınav modülünün gruplama fonksiyonunu `groupExamsByDay as groupScheduledExamsByDay` diye
ihraç ediyor; çünkü `packages/core/src/grade/logic.ts` aynı adı öncü sürüm için kullanıyor
ve mobil ekran onu o adla tüketiyor (TS2308). Bu görevde öncü sürüm emekli olduğunda iki
satır tek satıra iner:

```ts
export * from "./exam/logic"
```

ve `grade/logic.ts`'teki `groupExamsByDay` ile `grade/types.ts`'teki `ExamScheduleItem` /
`ExamScheduleDay` silinir.

**Eski ekranın emekliliği (TB-116 ile ilgili):** mobilde bugün `GradeExamScheduleScreen` var; veriyi `useExamSchedule` ile `/api/v1/grades/exam-schedule` yolundan alıyor ve bu yol **hiç açılmadı** — `packages/api/src/grade/contract.ts` içindeki `declare module` bloğu bilinçli bir drift bekçisidir. Yeni uç açıldığına göre: bekçi bloğu **silinir**, `ExamScheduleItem`/`ExamScheduleDay` tipleri `packages/core/src/grade/types.ts`'ten kaldırılır, ekran `apps/mobile/src/features/exam/` altına taşınır ve `useMyExamSchedule`'a bağlanır. Üç alan (`startTime`, `durationMinutes`, `classroomName`) artık **doludur**; `durationMinutes` zil çizelgesinden hesaplanır.

- [ ] **Adım 1: Tasarımı oku** — `web/exam-schedule-tag.jsx`, `mobile/exam-schedule.jsx`, `mobile/exam-schedule-tag.jsx` (DesignSync).

- [ ] **Adım 2: Etiketi yaz**

```tsx
/**
 * Ders programı hücresinin sağ üstündeki sınav etiketi.
 * Renk SINAVIN dersinden gelir, hücrenin dersinden değil: ödünç saatte 9-B'nin Tarih
 * hücresi Tarih tonunda kalır, etiket Sağlık Bilgisi tonunda çıkar.
 */
export function ExamScheduleTag({ badge }: { badge: ExamBadge }) {
  const tone = SUBJECT_PALETTE[subjectColorIndex(badge.courseId)]!
  ...
}
```

Dar ekranda metin kısalır (`MAT. 1. SINAVI`), tıklanınca tam metin açılır. `isMoved` ise küçük "güncellendi" işareti çıkar. Ham hex yok: tonlar satır içi stil olarak paletten gelir, geri kalan `exam.css` değişkenlerinden.

- [ ] **Adım 3: Rol farkını bağla**

Şube/öğretmen görünümü ders adı + sınav türü; öğrenci görünümü ek olarak derslik. `seatNo` ve `invigilationRoomName` Faz 1'de her zaman `null` gelir ve **yer tutucu gösterilmez** — alan boşsa satır hiç çizilmez.

- [ ] **Adım 4: Mobil ekranı taşı ve eskisini sil**

`grade-tab-screen.tsx` içindeki görünüm seçicisi `GradeExamScheduleScreen` yerine `ExamScheduleScreen`'i çağırır. `windowOnly` hâli **yeni** ve zorunludur: "1. Sınavlar · 10–14 Kasım haftası · ayrıntı en geç 3 Kasım'da yayınlanacak".

- [ ] **Adım 5: Bildirim etiketlerini ekle**

`packages/core/src/notifications/constants.ts` içindeki `NOTIFICATION_KIND_CONFIG`'e yedi giriş (`ExamWindowPublished: { label: "Sınav haftası", icon: "calendar" }` vb.). Web ve mobil ikon eşlemeleri aynı kaynaktan okur; **yeni ikon anahtarı üretme**, mevcutlardan seç.

- [ ] **Adım 6: Kalite kapısı ve commit**

```bash
npm run typecheck && npm run lint
git add apps packages
git commit -m "feat(ui): ders programı sınav etiketi ve mobil sınav takvimi ekranı"
```

---

# Dilim 4 · Politika

### Görev 4.1: Okul ayarlarına sınav politikası alanları

**Files:**
- Modify: `src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs` (beş alan + `UpdateExamPolicy` metodu)
- Modify: `src/Oksis.Infrastructure/Persistence/Configurations/Schools/SchoolSettingsConfiguration.cs`
- Modify: `src/Oksis.Application/Modules/Exams/Internal/ExamRuleInspector.cs` (sabitler yerine ayarlardan okuma)
- Create: migration `20260912_exam_policy_settings`
- Test: `tests/Oksis.Application.UnitTests/Modules/Exams/ExamPolicyTests.cs`

**Alanlar ve varsayılanları:** `MinExamPublishLeadDays` = 7 · `MaxExamsPerSectionPerDay` = 2 · `ExamReviewWindowDays` = 3 · `ExamDraftDueLeadDays` = 14 · `DefaultExamMode` = `LessonHour`.

- [ ] **Adım 1: Testi yaz** — ayar 10 güne çekildiğinde 8 gün kala yayının gerekçe istediğini, 2 sınav sınırı 3'e çıkarıldığında üçüncü sınavın engellenmediğini çiviler.

- [ ] **Adım 2: Alanları ekle, `ExamRuleInspector`'daki sabitleri ayara bağla**

`DefaultMaxExamsPerSectionPerDay` sabiti **kalır** ama yalnız ayar okunamadığında düşülen değer olur; yorumla gerekçelendir.

- [ ] **Adım 3: Migration, testler, commit**

```bash
dotnet ef migrations add 20260912_exam_policy_settings --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
./scripts/test-changed.sh
git commit -am "feat(exams): sınav politikası okul ayarlarına taşındı"
```

---

### Görev 4.2: Ayarlar › Sınav Takvimi kartı

**Files:**
- Create: `apps/web/features/exam/exam-policy-card.tsx`
- Modify: `apps/web/features/settings/...` politika sayfası (Akademik Politika kartlarının yanına)
- Modify: `packages/api/src/exam/{endpoints.ts,queries.ts}` (`useExamPolicy`, `useSaveExamPolicy`)

- [ ] **Adım 1: Tasarımı oku** — `web/exam-policy-card.jsx` (DesignSync).

- [ ] **Adım 2: Kartı yaz.** Beş alan; her birinde kaynağı gösteren yardımcı metin ("Varsayılan: 7 gün — yönetmelik alt sınırı"). `defaultMode` seçicisinde oturum seçeneği **görünür ama kapalı** ve nedeni yazılı ("Kelebek düzeni sonraki fazda").

- [ ] **Adım 3: R12 kontrolü.** `defaultPassingScore`, `writtenWeight`, `performanceWeight` gibi alanlar `AcademicPolicy`'de zaten var; **ikinci kez tanımlanmaz**.

- [ ] **Adım 4: Kalite kapısı ve commit**

```bash
npm run typecheck && npm run lint
git commit -am "feat(web): ayarlar sınav takvimi politika kartı"
```


---

## Spec kapsam denetimi

Bu plan yazıldıktan sonra spec bölüm bölüm tarandı. Karşılığı olan her madde bir göreve bağlı:

| Spec bölümü | Görev | Not |
|---|---|---|
| §3.1 ExamWindow | 1.1, 1.3 | Durum makinesi entity'de |
| §3.2 ScheduledExam | 1.2, 1.3 | İki eksen ayrıldı (D-1) |
| §3.3 HourRequest | 1.2, 2.4 | Yönetici geçemez kuralı handler'da |
| §3.4–3.7 Oturum, tahsis, oturma, gözetmen | — | **Faz 2**, bilinçli kapsam dışı |
| §3.8 Kural denetleyicisi | 1.4, 2.2 | EX-H01/H02/H03/H07/H08/H09, EX-S01/S05/S06 |
| §4.2 Pencere yayını | 1.5 | |
| §4.3 Yerleştirme (lessonHour) | 1.6 | Saat ödünç alma dahil |
| §4.4 Yerleştirme (session) + görüş penceresi | — | **Faz 2** |
| §4.5 Takvim yayını | 2.2 | Ön koşul listesi tek metotta |
| §4.6 Yayın sonrası değişiklik | 2.1 | Sürüm + revizyon kaydı |
| §4.7 Kilit | 3.4 | Günlük sweep |
| §5.1 Grades beslemesi | 3.1 | İki yön + elle tarih kapısı |
| §5.2 Timetable etiketi | 3.2, 3.6 | Yazma yok |
| §5.3 Gözetmen havuzu | — | **Faz 2** |
| §5.4 Attendance | — | **Faz 2** — `lessonHour` modunda yoklama zaten dersin öğretmenindedir, hiçbir değişiklik gerekmez |
| §5.5 Bildirimler | 3.3, 3.4 | Yedi tür, `expired` ayrı tür değil |
| §6 Yetkiler | 1.5 | **Sapma:** spec altı izin anahtarı sayıyordu (`exams.window.manage`, `exams.exam.place`, `exams.hour-request.answer`, `exams.review.comment`, `exams.print`, `exams.read.self`); plan dörde indirdi. Gerekçe: `hour-request.answer` ile `exam.place` aynı rolün aynı işidir, `review.comment` Faz 2'ye aittir, `print` panoyu görenin işidir. Ayrı anahtar, ayrı ekran gerektirmediği sürece rol matrisinde ölü satır olur |
| §7 Okuma yüzleri | 1.7, 1.8, 2.5, 3.6 | |
| §7 Yazdırma | 2.6 | Faz 1'de yalnız şube takvimi |
| §8 Test stratejisi | Tüm görevler | Gerçek SQL: 2.3, 3.2 |
| §11 Açık nokta S-1 | 3.2 | Tasarım cevapladı: `moved` hâli |
| §11 Açık nokta S-2 | — | **Faz 2** (görüş yorumları) |

## Bitti sayılma ölçütü

Faz 1 şu cümle doğru olduğunda biter: **kelebek uygulamayan bir okul, sınav takvimini
baştan sona OKSİS'te yürütebiliyor.** Somut kontrol listesi:

1. Yönetici dönem başında pencere kurup yayınlıyor; öğrenci ve veli haftayı görüyor.
2. Öğretmen kendi sınavını kendi saatine koyuyor; başka şube için saat isteyip cevap alıyor.
3. Yönetici panoda eksikleri, bekleyen istekleri ve ihlalleri görüyor; yayın ön koşulları
   engelliyor ya da gerekçe istiyor.
4. Takvim yayınlanınca not sütunlarının tarihi doluyor, ders programı hücrelerinde sınav
   etiketi çıkıyor, ilgili herkese bildirim gidiyor.
5. Öğrenci ve veli takvimi mobilde üç hâlde de doğru görünüyor (`empty`, `windowOnly`,
   `published`).
6. Günlük sweep düşen istekleri, taşınan sınavları, hatırlatmaları ve kilidi yürütüyor.
7. `./scripts/test-changed.sh --integration` yeşil; `npm run typecheck && npm run lint` temiz.

## Faz 2 için açık bırakılanlar

`ExamSession`, `RoomAllocation`, `Seat`, `Invigilation` entity'leri · oturum modu yerleştirme ·
görüş penceresi ve yorumlar · gözetmen havuzu ve ataması · gözetmen yoklaması (Attendance bağı) ·
kapı listesi, oturma planı ve gözetmen çizelgesi yazdırma · `seatNo` ve `invigilationRoomName`
alanlarının dolması. Faz 1'in sözleşmesi bunları **taşıyor ama boş bırakıyor**; Faz 2 alan
eklemez, var olanları doldurur.
