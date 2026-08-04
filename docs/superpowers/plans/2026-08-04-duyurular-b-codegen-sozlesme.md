# Duyurular B — Codegen + Sözleşme Birleştirme Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `oksis-ui`'ın duyuru sözleşmesini el yazımı `contract.ts` + `paths.ts` drift bekçisinden, backend'in canlı OpenAPI belgesinden üretilen `generated/schema.ts`'e devretmek; iki app'i gerçek uca bağlamak.

**Architecture:** Sıra kritiktir ve her commit yeşil bırakır. Önce core'a daraltma altyapısı; sonra MSW'nin backend'den ayrışmış iki davranışı düzeltilir; sonra codegen çalıştırılıp `paths.ts` silinir (istek gövdeleri kırılır, düzeltilir); sonra `contract.ts` silinip yanıt tipleri generated şemaya taşınır ve `api-mocks` yeniden tiplenir; sonra şablon yazma uçları eklenir; sonra UI'daki `scheduled` geri çekme boşluğu kapatılır; en sonda gerçek uca karşı duman testi ve spec güncellemesi.

**Tech Stack:** TypeScript 5 (`strict`), npm workspaces + Turborepo, openapi-typescript 7.13, openapi-fetch, TanStack Query, MSW 2, Vitest 2, Next.js 16 (web), Expo/RN (mobile).

---

## Global Constraints

Bu bölüm her görevin gereksinimlerine örtük olarak dâhildir.

- **Yazılabilir depolar:** `/Users/farukkaya/Repositories/oksis-ui` (kod) ve `/Users/farukkaya/Repositories/oksis` (yalnız Görev 8, spec).
  **`/Users/farukkaya/Repositories/oksis-api`'ye ASLA YAZMA.** Oku, doğrula, değiştirme. Backend'de gerçek bir kusur bulursan **dur ve kullanıcıya söyle** — kendin düzeltme.
- **Dal:** `feature/announcements-b` (oksis-ui). `git stash` kullanma.
- **Paket yöneticisi `npm`.** `pnpm`/`yarn` yok, tek `package-lock.json`.
- **Commit öncesi zorunlu:** `npm run typecheck && npm run lint` (repo kökünde, turbo). Kırmızıysa commit YOK.
- **Commit formatı:** `<type>(<scope>): <açıklama>` — scope `web`/`mobile`/`core`/`api`/`ui`/`repo`, açıklama Türkçe, emir kipi, küçük harf, sonda nokta yok. Bir commit = bir mantıksal değişiklik.
- **`packages/api/src/generated/schema.ts` wire şeklinin TEK otoritesidir.** El yazımı bir tip onunla çelişiyorsa yanlış olan el yazımı olandır. Generated dosyayı asla elle düzenleme, asla "uyarlama".
- **Wire tiplerini "iyileştirme".** id görünümlü string `string` kalır; sayı görünümlü string `string` kalır. `studentNo` **`string`**'tir. Bu drift iki kez shipledi.
- **Mock'lar da tiplidir.** `packages/api-mocks` fixture'ları generated DTO'yu alan alan yansıtmalıdır. Typecheck yeşilken yanlış runtime tipi yayan mock bir hatadır.
- **Tarih üretiminde `toISOString().slice(0,10)` YASAK** (+03:00'te önceki günü üretir). Yerel bileşenlerden kur (`getFullYear`/`getMonth()+1`/`getDate`, sıfır dolgulu).
- **`any` yasak** — zorunluysa `// reason:` yorumu şart.
- Tanımlayıcılar tam İngilizce; yorumlar ve kullanıcıya görünen metinler Türkçe.
- **MSW handler'ları SİLİNMEZ** — senaryo/hata denemeleri ve mobil dev için kalır.
- **Bash aracı:** varsayılan timeout 120 sn ve otomatik arka plana atar. Uzun komutlarda (`npm run build`, codegen, `npm run typecheck` ilk koşu) `timeout` parametresini **açıkça** ver (ms, maks 600000). macOS'ta `timeout` komutu yok.
- **`dotnet` PATH'te değildir.** Backend komutları için `export PATH="$HOME/.dotnet:$PATH"` ön eki şart; aksi hâlde `command not found` alırsın ve `| tail` bunu exit 0 diye gizler.
- Bir testin kırıldığını göstermek için üretim kodunu kalıcı değiştirme — mutasyon denetimi yap, geri al, raporla.

---

## Ön koşullar — ortam (görevlerden ÖNCE, bir kez)

Bunlar Görev 3'ten itibaren gerekir. Görev 1 ve 2 bunlarsız da yapılabilir.

```bash
# 1) Docker (SQL Server + Redis + Garage + ClamAV + Mailpit)
open -a Docker            # macOS; hazır olana kadar bekle
cd /Users/farukkaya/Repositories/oksis-api && docker compose up -d

# 2) Backend
export PATH="$HOME/.dotnet:$PATH"
cd /Users/farukkaya/Repositories/oksis-api
dotnet build                                  # beklenen: 0 uyarı / 0 hata
dotnet run --project src/Oksis.Api            # http://localhost:5112

# 3) Doğrula
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5112/openapi/v1.json   # 200
```

**Dev giriş bilgisi (duman testi için):** `mudur.s1@oksis.local` / `Oksis1234!`
Giriş ucu `POST /api/v1/auth/account/login`, gövde alanı **`identifier`** (`email` DEĞİL):

```bash
curl -s -X POST http://localhost:5112/api/v1/auth/account/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"mudur.s1@oksis.local","password":"Oksis1234!"}'
```

---

## Doğrulanmış zemin (2026-08-04, canlı ölçüm — spec'e değil bu tabloya güven)

| Ölçüm | Değer |
|---|---|
| Backend build | 0 uyarı / 0 hata |
| OpenAPI toplam | 289 yol |
| **Duyuru uçları** | **16 yol / 21 operasyon** |
| Mevcut `generated/schema.ts` | 19.947 satır, `grep announcement` → **0** |
| Codegen sonrası `schema.ts` | ~21.314 satır |
| Codegen komutu | `npm run codegen -w @workspace/api` |
| `endpoints.ts` | 322 satır, **18 dışa açık fonksiyon** |
| `queries.ts` | 188 satır, **18 hook** |
| `contract.ts` | 162 satır — tüketiciler: `endpoints.ts`, `paths.ts`, `api-mocks/announcement-data.ts` (8 tip), `api-mocks/announcement-handlers.ts` (5 tip) |
| `paths.ts` | 351 satır, 15 yol / 17 operasyon — tek tüketici `endpoints.ts` (`import "./paths"`, yan etki) |
| MSW handler | 18 adet, şablon yazma handler'ı **yok** |
| `packages/api/package.json` exports | `{".": "./src/index.ts", "./*": "./src/*.ts"}` — joker; `contract.ts` silinince **exports düzenlemesi gerekmez** |
| DB | `oksis_dev`; şemalar `identity.*` ve `school.*`; `school.announcements` **0 satır** |

### Doğrulanmış drift listesi — DOKUZ madde

Spec §13 beş sayar, B prompt'u altıncıyı ekler. **7–9 bu planda ilk kez yazılıyor** ve canlı `generated` çıktısına karşı doğrulandı.

| # | Drift | Kanıt | Görev |
|---|---|---|---|
| 1 | `AudienceSelectionBody.bucket` **zorunlu** | OpenAPI `required:[dimension,key,bucket]`; `endpoints.ts:247` bucket'ı düşürüyor | 3 |
| 2 | `CreateAnnouncementCommand.attachmentFileId: null\|string` **zorunlu** | OpenAPI required listesinde | 3 |
| 3 | `POST /announcements` → **200**, `201` değil | Canlı POST `HTTP 200` döndü. `POST /templates` de 200 | 3 |
| 4 | Şablon yazma uçları | `POST /templates` (200), `PUT /templates/{id}` (200), `DELETE /templates/{id}` (**204**, gövdesiz, `Wrapped<T>` YOK) | 5 |
| 5 | `restore` mock'u koşulsuz `published` yazıyor | `announcement-handlers.ts:220-228`; backend `Announcement.cs:343-357` `StatusBeforeWithdraw`'a döner — **üç kol**: published/expired/**scheduled** | 2 |
| 6 | `:withdraw` artık `scheduled`'dan da çalışıyor (ME-4b) | `Announcement.cs:294-302`. Mock'ta **hiç statü kapısı yok**; UI üç yerde `status === "published"` | 2, 6 |
| 7 | **Enum alanları generated'da düz `string`** | `AnnouncementDto.status/type/reach: string`, `channels: string[]`, `AudienceOptionDto.bucket: string`, `AnnouncementModerationDto.mode: string`, `AnnouncementAuditEntryDto.tone: null\|string`. OpenAPI'de **hiç `enum` şeması yok**. Backend DTO'su bilerek `string` (`AnnouncementDto.cs:12-14`) — kusur değil, tasarım. Sonuç: her biri `endpoints.ts`'te daraltılmalı | 1, 4 |
| 8 | **Tüm int alanları `number \| string`** | `recipientCount?: null \| number \| string` vb. Repo geneli mevcut kalıp; emsal `schedule/endpoints.ts:48` `const num = (v) => Number(v) \|\| 0` | 4 |
| 9 | **Nullable alanlar generated'da OPSİYONEL** | `isRead?: null \| boolean`, `audienceDetail?: null \| string`, `attachment?: null \| ...`. `contract.ts` bunları zorunlu-nullable ilan ediyordu; eşleyiciler `?? null` almalı | 4 |

**Canlı wire değerleri doğrulandı** (daraltmanın gerçekten eşleştiğinin kanıtı):
`status: "draft"`, `type: "institutional"`, `reach: "schoolWide"`, `channels: ["inApp"]`, `moderation.mode: "open"`, `bucket ∈ {"student","parent","teacher"}`. Hepsi `packages/core` union'larıyla birebir.

### Kilitlenmiş kapsam kararları (kullanıcı onaylı, 2026-08-04)

- **Ek dosya:** `createAnnouncement` gövdeye `attachmentFileId: null` yazar. Giriş tipine opsiyonel alan eklenir ki C fazı `endpoints.ts`'e dokunmadan doldurabilsin. Gerçek yükleme akışı (`/api/v1/files/initiate → confirm → attach`) ve compose UI'ı **C fazına**.
- **Şablon CRUD:** yalnız API katmanı + hook + MSW handler. **UI B'de yazılmaz** (tasarım handoff'u yok; CLAUDE.md ekran icat etmeyi yasaklıyor). Boşluk Görev 8'de spec'e yazılır.

### Kapsam dışı (C fazı)

`restore`'un bir ekrana bağlanması, sayfalama (`pageSize` 200 sabit), moderasyon↔Ayarlar bağı, mobil veli/öğrenci derin bağlantısı, gönderim raporunda kanal tablosunun gizlenmesi, `requiresApproval` testleri, ek dosya yükleme akışı, şablon CRUD arayüzü. Web veli/öğrenci okuma yüzü K-7 ile kapsam dışı.

---

## File Structure

| Dosya | Sorumluluk | Görev |
|---|---|---|
| `packages/core/src/announcements/constants.ts` | Daraltma için **tüketici** enum değer dizileri (mevcut `ANNOUNCEMENT_STATUSES` filtre sırasıdır, `archived` içermez — daraltmada KULLANILAMAZ) | 1 |
| `packages/core/src/announcements/constants.test.ts` | **Yeni** — dizilerin union'ı tükettiğini kilitler | 1 |
| `packages/core/src/announcements/logic.ts` | `canWithdrawAnnouncement` iş kuralı | 6 |
| `packages/core/src/announcements/logic.test.ts` | Mevcut — kural testleri eklenir | 6 |
| `packages/api-mocks/vitest.config.ts` | **Yeni** — mock davranış testleri için | 2 |
| `packages/api-mocks/src/announcements/announcement-handlers.test.ts` | **Yeni** — `restore`/`withdraw` davranışını kilitler | 2 |
| `packages/api-mocks/src/announcements/announcement-handlers.ts` | Davranış düzeltmesi + şablon yazma handler'ları + retype | 2, 4, 5 |
| `packages/api-mocks/src/announcements/announcement-data.ts` | Retype (generated DTO) + `statusBeforeWithdraw` alanı | 2, 4 |
| `packages/api/src/generated/schema.ts` | **Üretilir** — elle dokunulmaz | 3 |
| `packages/api/src/announcements/paths.ts` | **SİLİNİR** | 3 |
| `packages/api/src/announcements/contract.ts` | **SİLİNİR** | 4 |
| `packages/api/src/announcements/endpoints.ts` | Gövde düzeltmeleri → generated tipler + daraltma eşleyicileri → şablon yazma fonksiyonları | 3, 4, 5 |
| `packages/api/src/announcements/endpoints.test.ts` | **Yeni** — giden gövde + daraltma testleri | 3, 4 |
| `packages/api/src/announcements/queries.ts` | Şablon yazma hook'ları | 5 |
| `packages/api/src/client/query-keys.ts` | Gerekirse şablon anahtarı (önce oku, muhtemelen mevcut) | 5 |
| `apps/web/features/announcements/inventory-tab.tsx` | Geri çekme kapısı | 6 |
| `apps/web/features/announcements/announcements-page.tsx` | Geri çekme kapısı | 6 |
| `apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx` | Geri çekme kapısı | 6 |

---

## Görev sırası ve bağımlılıklar

```
1 (core diziler)  ──┐
2 (mock davranış) ──┼──> 3 (codegen + paths sil) ──> 4 (contract sil + retype) ──> 5 (şablon yazma)
6 (scheduled geri çekme, 1'e bağımlı değil) ─────────────────────────────────────┘
                                                                                  ↓
                                                                        7 (duman testi)
                                                                                  ↓
                                                                        8 (spec, oksis deposu)
```

Görev 1 ve 2 birbirinden bağımsızdır, paralel yapılabilir. Görev 3 her ikisini de bekler. Görev 6, Görev 5'ten sonra sıraya konur ama teknik olarak yalnız Görev 4'ün bitmesini gerektirir.

---

## Görev 0: Dalı aç

- [ ] **Adım 1: Dalı oluştur**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git status --short --branch          # master, temiz olmalı
git checkout -b feature/announcements-b
```

- [ ] **Adım 2: Zemini doğrula**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
```

Beklenen: ikisi de yeşil. **Kırmızıysa dur ve raporla** — bu planın tamamı "başlangıç yeşildi" varsayımına dayanıyor.

Commit yok.

---

## Görev 1: core — daraltma için tüketici enum değer dizileri

**Neden:** Drift #7. Generated şema `status`/`type`/`reach`/`channels`/`bucket`/`mode` alanlarını düz `string` verir. Bunları `packages/core` union'larına daraltmak için **union'ı tüketen** değer dizileri gerekir.

**Tuzak — okumadan geçme:** `constants.ts:81`'deki mevcut `ANNOUNCEMENT_STATUSES` bir **filtre açılır sırasıdır** ve yalnız 6 değer içerir; `"archived"` **yoktur**. Daraltmada kullanılırsa `archived` sessizce yedeğe düşer. Yeni diziler ayrı tanımlanır, mevcut olanlar **değiştirilmez** (UI sırası onlara bağlı).

**Files:**
- Modify: `packages/core/src/announcements/constants.ts` (dosyanın sonuna ekle)
- Create: `packages/core/src/announcements/constants.test.ts`

**Interfaces:**
- Consumes: `packages/core/src/announcements/types.ts` — `AnnouncementStatus`, `AnnouncementType`, `AnnouncementReach`, `DeliveryChannel`, `AnnouncementModeration`, `AudienceBucket`
- Produces: `ANNOUNCEMENT_STATUS_VALUES: readonly AnnouncementStatus[]`, `ANNOUNCEMENT_TYPE_VALUES: readonly AnnouncementType[]`, `ANNOUNCEMENT_REACH_VALUES: readonly AnnouncementReach[]`, `DELIVERY_CHANNEL_VALUES: readonly DeliveryChannel[]`, `ANNOUNCEMENT_MODERATION_VALUES: readonly AnnouncementModeration[]`, `AUDIENCE_BUCKET_VALUES: readonly AudienceBucket[]` — hepsi `packages/core` kök `index.ts` üzerinden dışa açık (`export * from "./announcements/constants"` zaten satır 130'da var, ek export gerekmez)

- [ ] **Adım 1: Başarısız testi yaz**

`packages/core/src/announcements/constants.test.ts` oluştur:

```ts
import { describe, expect, it } from "vitest"

import {
  ANNOUNCEMENT_MODERATION_VALUES,
  ANNOUNCEMENT_REACH_VALUES,
  ANNOUNCEMENT_STATUS_VALUES,
  ANNOUNCEMENT_TYPE_VALUES,
  AUDIENCE_BUCKET_VALUES,
  DELIVERY_CHANNEL_VALUES,
} from "./constants"

/**
 * Bu diziler generated şemadan gelen düz `string`'i domain union'ına daraltmak
 * için kullanılır (drift #7). Union'dan bir değer eksik kalırsa o değer sessizce
 * yedeğe düşer — testler tam sayıyı kilitler.
 *
 * DİKKAT: `ANNOUNCEMENT_STATUSES` (filtre sırası) bunun yerine kullanılamaz;
 * o dizi `archived` içermez.
 */
describe("duyuru enum değer dizileri union'ı tüketir", () => {
  it("Should_ContainAllSevenStatuses_When_UsedForNarrowing", () => {
    expect([...ANNOUNCEMENT_STATUS_VALUES].sort()).toEqual([
      "archived",
      "draft",
      "expired",
      "pendingApproval",
      "published",
      "scheduled",
      "withdrawn",
    ])
  })

  it("Should_ContainBothTypes_When_UsedForNarrowing", () => {
    expect([...ANNOUNCEMENT_TYPE_VALUES].sort()).toEqual(["classroom", "institutional"])
  })

  it("Should_ContainBothReaches_When_UsedForNarrowing", () => {
    expect([...ANNOUNCEMENT_REACH_VALUES].sort()).toEqual(["classScoped", "schoolWide"])
  })

  it("Should_ContainAllThreeChannels_When_UsedForNarrowing", () => {
    expect([...DELIVERY_CHANNEL_VALUES].sort()).toEqual(["email", "inApp", "push"])
  })

  it("Should_ContainBothModerationModes_When_UsedForNarrowing", () => {
    expect([...ANNOUNCEMENT_MODERATION_VALUES].sort()).toEqual(["open", "thresholded"])
  })

  it("Should_ContainAllThreeBuckets_When_UsedForNarrowing", () => {
    expect([...AUDIENCE_BUCKET_VALUES].sort()).toEqual(["parent", "student", "teacher"])
  })

  it("Should_NotReuseFilterOrderArray_When_NarrowingStatus", () => {
    // Regresyon bekçisi: ANNOUNCEMENT_STATUSES filtre sırasıdır ve `archived`
    // içermez; biri onu daraltmada kullanmaya kalkarsa bu test kırılır.
    expect(ANNOUNCEMENT_STATUS_VALUES).toContain("archived")
  })
})
```

- [ ] **Adım 2: Testi koş, kırıldığını gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/core -- constants
```

Beklenen: FAIL — `ANNOUNCEMENT_STATUS_VALUES` vb. `./constants`'tan dışa açılmıyor (TS2305 / "does not provide an export named").

- [ ] **Adım 3: Asgari uygulamayı yaz**

`packages/core/src/announcements/constants.ts` dosyasının **sonuna** ekle. `AnnouncementReach` ve `AudienceBucket` import listesinde yoksa (dosya başındaki `import type { ... } from "./types"` bloğu) alfabetik sıraya ekle:

```ts
/**
 * Wire'dan gelen düz `string`'i domain union'ına daraltmak için TÜKETİCİ
 * değer dizileri (drift #7 — backend OpenAPI'si duyuru enum'larını `enum`
 * olarak değil `string` olarak ilan eder, bu bilinçlidir).
 *
 * Yukarıdaki `ANNOUNCEMENT_STATUSES` / `ANNOUNCEMENT_TYPES` /
 * `DELIVERY_CHANNELS` dizileri **SUNUM SIRASIDIR** ve daraltmada
 * KULLANILAMAZ: `ANNOUNCEMENT_STATUSES` `archived` içermez.
 */
export const ANNOUNCEMENT_STATUS_VALUES: readonly AnnouncementStatus[] = [
  "draft",
  "scheduled",
  "pendingApproval",
  "published",
  "expired",
  "withdrawn",
  "archived",
]

export const ANNOUNCEMENT_TYPE_VALUES: readonly AnnouncementType[] = [
  "institutional",
  "classroom",
]

export const ANNOUNCEMENT_REACH_VALUES: readonly AnnouncementReach[] = [
  "schoolWide",
  "classScoped",
]

export const DELIVERY_CHANNEL_VALUES: readonly DeliveryChannel[] = ["inApp", "push", "email"]

export const ANNOUNCEMENT_MODERATION_VALUES: readonly AnnouncementModeration[] = [
  "open",
  "thresholded",
]

export const AUDIENCE_BUCKET_VALUES: readonly AudienceBucket[] = ["parent", "teacher", "student"]
```

- [ ] **Adım 4: Testi koş, geçtiğini gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/core -- constants
```

Beklenen: 7 test PASS.

- [ ] **Adım 5: Tüm kapıları koş**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/core && npm run typecheck && npm run lint
```

Beklenen: hepsi yeşil.

- [ ] **Adım 6: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add packages/core/src/announcements/constants.ts packages/core/src/announcements/constants.test.ts
git commit -m "feat(core): duyuru enum degerleri wire daraltmasi icin tuketici dizi olarak yayinlandi"
```

---

## Görev 2: api-mocks — `restore` ve `withdraw` davranışını backend'e hizala

**Neden:** Drift #5 ve #6. İkisi de **davranış** farkıdır, typecheck yakalamaz. Codegen'den ÖNCE yapılır ki tek başına gözden geçirilebilsin.

**Backend'in bağlayıcı davranışı** (`oksis-api/src/Oksis.Domain/Modules/Announcements/Entities/Announcement.cs`, salt okunur doğrulandı):

- `Withdraw(reason, withdrawnBy, now)` — yalnız `Published`, `Expired`, **`Scheduled`**'dan çalışır; başka statüde `AnnouncementDomainException("Announcements.Withdraw.InvalidStatus")`. Boş gerekçe reddedilir (`Announcements.Withdraw.ReasonRequired`). `StatusBeforeWithdraw = Status` yazılır.
- `Restore()` — yalnız `Withdrawn`'dan ve yalnız `StatusBeforeWithdraw` doluyken çalışır; **koşulsuz `published` YAPMAZ**, önceki statüye döner (published/expired/**scheduled** üç kolu da mümkün). `WithdrawReason` temizlenir.

**Files:**
- Create: `packages/api-mocks/vitest.config.ts`
- Modify: `packages/api-mocks/package.json` (test script + vitest devDependency)
- Create: `packages/api-mocks/src/announcements/announcement-handlers.test.ts`
- Modify: `packages/api-mocks/src/announcements/announcement-handlers.ts` (satır ~209-228 — **yeniden doğrula**, A2/A3'te doğruydu)
- Modify: `packages/api-mocks/src/announcements/announcement-data.ts` (satır bazlı fixture'a `statusBeforeWithdraw` alanı)

**Interfaces:**
- Consumes: `packages/api/src/announcements/contract.ts` — `AnnouncementDto`, `ReasonBody` (bu görevde hâlâ mevcut)
- Produces: MSW handler davranışı; sonraki görevler bu davranışa dokunmaz, yalnız tipleri değiştirir

- [ ] **Adım 1: Vitest altyapısını kur**

`packages/api-mocks/vitest.config.ts` oluştur (kardeş paketlerle birebir aynı):

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
```

`packages/api-mocks/package.json` içinde `"scripts"` bloğuna `"test": "vitest run"` ekle ve `"devDependencies"` bloğuna `"vitest": "^2.1.9"` ekle (`packages/api/package.json`'daki sürümle aynı — önce oku, farklıysa oradakini kullan). Sonra:

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm install
```

- [ ] **Adım 2: Başarısız testi yaz**

**Doğrulanmış fixture zemini** (2026-08-04, `announcement-data.ts` okunarak): satırlar modül düzeyinde `let announcements`/`approvalQueue`/`templates` içinde tutulur, `seed()` bir `seeded` bayrağıyla tembel doldurur. Dışa açık API: `allAnnouncements()`, `setAnnouncements()`, `allApprovals()`, `setApprovals()`, `allTemplates()`. Handler yardımcıları: `envelope()`, `notFound()`, `paged()`, `findRow()`, `patchRow()`.

**Her statü için hazır satır vardır — ayrıca kurmaya gerek yok:**

| id | status |
|---|---|
| `d1` | `published` |
| `d8` | `scheduled` |
| `d9` | `draft` |
| `d11` | `withdrawn` |
| `d12` | `expired` |

Şablonlar: `t1`–`t4`.

`packages/api-mocks/src/announcements/announcement-handlers.test.ts` oluştur:

```ts
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"

import { announcementsHandlers } from "./announcement-handlers"

const server = setupServer(...announcementsHandlers)
const BASE = "http://localhost/api/v1/announcements"

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

async function get(id: string) {
  const res = await fetch(`${BASE}/${id}`)
  return (await res.json()).data as { status: string; withdrawReason: string | null }
}

async function withdraw(id: string, reason = "Yanlış hedef kitle") {
  return fetch(`${BASE}/${id}:withdraw`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason }),
  })
}

async function restore(id: string) {
  return fetch(`${BASE}/${id}:restore`, { method: "POST" })
}

// Her test taze fixture ile başlar — mutasyonlar modül düzeyinde birikir.
import { resetAnnouncementMocks } from "./announcement-data"

beforeEach(() => resetAnnouncementMocks())

describe("MSW :withdraw — backend statü kapısını yansıtır", () => {
  it("Should_Withdraw_When_StatusIsPublished", async () => {
    const res = await withdraw("d1")
    expect(res.status).toBe(200)
    expect((await get("d1")).status).toBe("withdrawn")
  })

  it("Should_Withdraw_When_StatusIsExpired", async () => {
    const res = await withdraw("d12")
    expect(res.status).toBe(200)
    expect((await get("d12")).status).toBe("withdrawn")
  })

  // ME-4b: boş hedefli zamanlanmış duyuru aksi hâlde terminal hâle geliyordu.
  it("Should_Withdraw_When_StatusIsScheduled", async () => {
    const res = await withdraw("d8")
    expect(res.status).toBe(200)
    expect((await get("d8")).status).toBe("withdrawn")
  })

  it("Should_Reject_When_StatusIsDraft", async () => {
    const res = await withdraw("d9")
    expect(res.status).toBe(409)
    expect((await get("d9")).status).toBe("draft")
  })

  it("Should_Reject_When_ReasonIsBlank", async () => {
    const res = await withdraw("d1", "   ")
    expect(res.status).toBe(400)
    expect((await get("d1")).status).toBe("published")
  })
})

describe("MSW :restore — INV-4, koşulsuz published YAZMAZ", () => {
  it("Should_ReturnToPublished_When_WithdrawnFromPublished", async () => {
    await withdraw("d1")
    await restore("d1")
    const row = await get("d1")
    expect(row.status).toBe("published")
    expect(row.withdrawReason).toBeNull()
  })

  it("Should_ReturnToExpired_When_WithdrawnFromExpired", async () => {
    await withdraw("d12")
    await restore("d12")
    expect((await get("d12")).status).toBe("expired")
  })

  // Geri alma zamanlanmış duyuruyu yayın kuyruğuna GERİ KOYAR — published yapmaz.
  it("Should_ReturnToScheduled_When_WithdrawnFromScheduled", async () => {
    await withdraw("d8")
    await restore("d8")
    expect((await get("d8")).status).toBe("scheduled")
  })

  it("Should_Reject_When_NotWithdrawn", async () => {
    const res = await restore("d1")
    expect(res.status).toBe(409)
    expect((await get("d1")).status).toBe("published")
  })

  // d11 fixture'ı zaten `withdrawn` doğar; Adım 4'te ona
  // `statusBeforeWithdraw: "published"` verilir, yoksa demo'da geri alınamaz
  // bir satır olarak kalırdı (backend `Restore()` de o hâli reddeder).
  it("Should_RestoreSeededWithdrawnRow_When_PriorStatusRecorded", async () => {
    const res = await restore("d11")
    expect(res.status).toBe(200)
    expect((await get("d11")).status).toBe("published")
  })
})
```

- [ ] **Adım 3: Testi koş, kırıldığını gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/api-mocks
```

Beklenen: FAIL. En az iki farklı sebep görülmeli — (a) `resetAnnouncementMocks` dışa açık değil, (b) yardımcıyı ekledikten sonra `restore` testleri `expired`/`scheduled` yerine `published` döndüğü için kırılır ve `withdraw` kapı testleri 409/400 yerine 200 alır. **İkinci sebebi görmeden ilerleme** — önce yalnız `resetAnnouncementMocks`'ı ekleyip testi tekrar koş ve gerçek davranış farkını gözle gör.

- [ ] **Adım 4: Satır tipini ve fixture sıfırlayıcıyı ekle**

`packages/api-mocks/src/announcements/announcement-data.ts` — mevcut durum (satır ~670-684, doğrulandı):

```ts
let announcements: AnnouncementDto[] = []
let approvalQueue: AnnouncementDto[] = []
let templates: AnnouncementTemplateDto[] = []
let seeded = false

function seed(): void {
  if (seeded) return
  ...
  seeded = true
}
```

**(a)** İç satır tipini ekle. `statusBeforeWithdraw` **wire DTO'sunda YOKTUR** — backend onu entity'de tutar ama `AnnouncementDto`'da yayınlamaz. Wire tipini kirletmemek için ayrı durur (INV-4):

```ts
/**
 * Mock'un İÇ satır tipi. `AnnouncementDto`'ya ek olarak `statusBeforeWithdraw`
 * taşır; bu alan yanıta ASLA yazılmaz (`toDto` onu düşürür).
 */
export type AnnouncementRow = AnnouncementDto & {
  statusBeforeWithdraw: AnnouncementDto["status"] | null
}
```

`announcements` / `approvalQueue` dizilerinin tipini `AnnouncementRow[]` yap; `allAnnouncements()` / `allApprovals()` / `setAnnouncements()` / `setApprovals()` imzalarını da `AnnouncementRow` ile güncelle. `buildAnnouncements()` içindeki her satıra `statusBeforeWithdraw: null` ekle — **istisna `d11`**, o `withdrawn` doğar:

```ts
// d11 geri çekilmiş doğar; nereden geri çekildiği kaydedilmezse geri
// alınamaz bir satır olurdu (backend Restore() de o hâli reddeder).
statusBeforeWithdraw: "published",
```

**(b)** Sıfırlayıcıyı ekle (mevcut `seeded` bayrağını kullanır, yeni bir kopya deposu gerekmez):

```ts
/**
 * Testler fixture'ı ilk hâline döndürür. Mutasyonlar modül düzeyinde birikir;
 * sıfırlama olmadan test sırası sonucu belirlerdi. Yalnız mock katmanına
 * aittir — uygulama kodu bunu ASLA import etmez.
 */
export function resetAnnouncementMocks(): void {
  seeded = false
  seed()
}
```

**(c)** `announcement-handlers.ts`'e yanıt dönüştürücüsünü ekle (mevcut `envelope`/`notFound`'un yanına), böylece mock gerçek uçtan fazla alan yaymaz:

```ts
/** İç satırdan wire DTO'suna — `statusBeforeWithdraw` yanıta sızmaz. */
function toDto(row: AnnouncementRow): AnnouncementDto {
  const { statusBeforeWithdraw: _internal, ...dto } = row
  return dto
}
```

`findRow` / `patchRow` / `scopedRows` imzalarını `AnnouncementRow` alacak şekilde güncelle; **mevcut tüm** `HttpResponse.json(envelope(row))` çağrılarını `HttpResponse.json(envelope(toDto(row)))` yap ve `paged(...)` çağrısına giren listeyi `.map(toDto)`'dan geçir.

- [ ] **Adım 5: `:withdraw` handler'ını düzelt**

`packages/api-mocks/src/announcements/announcement-handlers.ts` — mevcut handler (~209-218) hiçbir statü kapısı uygulamıyor ve boş gerekçeyi kabul ediyor. Yerine:

```ts
/**
 * Geri çekme. Backend `Announcement.Withdraw` üç statüden çalışır:
 * `published`, `expired` ve — ME-4b (2026-08-04) ile — `scheduled`.
 * `scheduled` kabul edilir çünkü hedefi sıfır alıcıya çözülen zamanlanmış bir
 * duyuru aksi hâlde ÇIKIŞSIZ kalıyordu: yayınlanamaz, düzeltilemez (Amend
 * yalnız `published`'dan), silinemez (INV-1). `:withdraw` onu emekliye
 * ayırmanın tek yoludur.
 */
const WITHDRAWABLE_STATUSES: ReadonlyArray<AnnouncementDto["status"]> = [
  "published",
  "expired",
  "scheduled",
]

http.post("*/api/v1/announcements/:id\\:withdraw", async ({ params, request }) => {
  const body = (await request.json()) as ReasonBody
  const row = findRow(String(params.id))
  if (!row) return notFound("Duyuru bulunamadı.")

  if (!WITHDRAWABLE_STATUSES.includes(row.status)) {
    return conflict(
      "Announcements.Withdraw.InvalidStatus",
      "Yalnız yayında olan, süresi dolmuş veya zamanlanmış duyuru geri çekilebilir.",
    )
  }

  const reason = (body.reason ?? "").trim()
  if (reason.length === 0) {
    return badRequest("Announcements.Withdraw.ReasonRequired", "Geri çekme gerekçesi zorunludur.")
  }

  const updated = patchRow(String(params.id), {
    statusBeforeWithdraw: row.status,
    status: "withdrawn",
    withdrawReason: reason,
    updatedAt: new Date().toISOString(),
  })
  if (!updated) return notFound("Duyuru bulunamadı.")
  return HttpResponse.json(envelope(toDto(updated)))
}),
```

- [ ] **Adım 6: `:restore` handler'ını düzelt**

Mevcut handler (~220-228) koşulsuz `published` yazıyor. Yerine:

```ts
/**
 * Geri çekmeyi geri alır. **INV-4 — koşulsuz `published` YAPMAZ.**
 * Geri çekmeden önceki statüye döner: `published` → `published`,
 * `expired` → `expired`, `scheduled` → `scheduled` (ME-4b, yani geri alma
 * zamanlanmış duyuruyu yayın kuyruğuna geri koyar). Backend
 * `Announcement.Restore()` bağlayıcı olan taraftır.
 */
http.post("*/api/v1/announcements/:id\\:restore", ({ params }) => {
  const row = findRow(String(params.id))
  if (!row) return notFound("Duyuru bulunamadı.")

  if (row.status !== "withdrawn" || row.statusBeforeWithdraw === null) {
    return conflict(
      "Announcements.Restore.InvalidStatus",
      "Yalnız geri çekilmiş duyuru geri alınabilir.",
    )
  }

  const updated = patchRow(String(params.id), {
    status: row.statusBeforeWithdraw,
    statusBeforeWithdraw: null,
    withdrawReason: null,
    updatedAt: new Date().toISOString(),
  })
  if (!updated) return notFound("Duyuru bulunamadı.")
  return HttpResponse.json(envelope(toDto(updated)))
}),
```

**`conflict` / `badRequest` / `findRow` / `toDto` yardımcıları:** dosyada `notFound` var. Aynı kalıpta eksik olanları ekle (önce mevcut `notFound`'u oku ve zarf şeklini birebir taklit et):

```ts
function errorEnvelope(status: number, code: string, message: string) {
  return HttpResponse.json(
    { data: null, meta: null, errors: [{ code, message }], correlationId: "mock" },
    { status },
  )
}
const conflict = (code: string, message: string) => errorEnvelope(409, code, message)
const badRequest = (code: string, message: string) => errorEnvelope(400, code, message)
```

- [ ] **Adım 7: Testleri koş, geçtiğini gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/api-mocks
```

Beklenen: 10 test PASS.

- [ ] **Adım 8: Kapıları koş**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
```

- [ ] **Adım 9: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add packages/api-mocks
git commit -m "fix(api): duyuru mock geri cekme ve geri alma davranisi backend ile hizalandi"
```

---

## Görev 3: Codegen + `paths.ts` silinmesi + istek gövdeleri

**Neden:** Spec §13 adım 2–4'ün istek tarafı. `paths.ts` augmentation'ı generated `paths` arayüzüyle **interface merge çakışması** üretir; drift bekçisi burada bilerek çalar.

**Bu görev neden `contract.ts`'i SİLMEZ:** `contract.ts` saf tiptir ve `api-mocks` onu kullanır. Yalnız `paths.ts` silinirse `endpoints.ts`'in `unwrap<AnnouncementDto>` çağrıları (açık generic) hâlâ derlenir; kırılan **yalnız istek gövdeleridir**. Bu, görevi tek başına gözden geçirilebilir ve yeşil bırakır.

**Ön koşul:** Backend `:5112`'de ayakta (yukarıdaki "Ön koşullar" bölümü).

**Files:**
- Modify (üretilir): `packages/api/src/generated/schema.ts`
- Delete: `packages/api/src/announcements/paths.ts`
- Modify: `packages/api/src/announcements/endpoints.ts`
- Create: `packages/api/src/announcements/endpoints.test.ts`

**Interfaces:**
- Produces: `createAnnouncement(input: AnnouncementFormValues & { asDraft: boolean; attachmentFileId?: string | null }): Promise<Announcement>` — gövdeye `bucket` ve `attachmentFileId` yazar

- [ ] **Adım 1: Codegen'i çalıştır**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run codegen -w @workspace/api
```

(Timeout'u açıkça ver: 300000 ms.)

- [ ] **Adım 2: Üretilen çıktıyı doğrula**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
grep -c "announcement" packages/api/src/generated/schema.ts    # > 0 olmalı
git diff --stat packages/api/src/generated/schema.ts
```

Beklenen: dosya ~19.947 → ~21.314 satır. `grep` 0 dönerse backend ayakta değildir veya yanlış porta bakılmıştır — **dur ve raporla**.

- [ ] **Adım 3: Drift bekçisinin çaldığını gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck 2>&1 | tee /tmp/b-drift-1.txt | tail -60
```

Beklenen: FAIL. `paths.ts`'in `declare module "../generated/schema"` bloğundaki her duyuru yolu için "Subsequent property declarations must have the same type" / "All declarations of X must have identical modifiers" ailesinden hatalar. **Bu bir arıza değil, bekçinin çalmasıdır.** Hata listesini `/tmp/b-drift-1.txt`'e kaydet — Adım 8'de kapandığını göstereceksin.

- [ ] **Adım 4: `paths.ts`'i sil ve yan etki import'unu kaldır**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git rm packages/api/src/announcements/paths.ts
```

`packages/api/src/announcements/endpoints.ts` içindeki şu iki satırı (dosya başı, ~17-19) sil:

```ts
// `paths` augmentation'ı yan etki olarak yüklenir — getClient() çağrıları
// duyuru uçlarını ancak bu import'la tanır (bkz. paths.ts başlık notu).
import "./paths"
```

- [ ] **Adım 5: Gerçek kırılmayı gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck 2>&1 | tee /tmp/b-drift-2.txt | tail -40
```

Beklenen: artık yalnız `createAnnouncement`'ın gövdesi kırılır — `bucket` eksik (`AudienceSelectionBody`'de zorunlu) ve `attachmentFileId` eksik (`CreateAnnouncementCommand`'da zorunlu). Başka hata çıkarsa **listele ve raporla**, sonra düzelt; sürpriz drift bu planın beklediği bir şeydir.

- [ ] **Adım 6: Başarısız testi yaz**

`packages/api/src/announcements/endpoints.test.ts` oluştur. Kalıp `packages/api/src/attendance/endpoints.test.ts`'ten birebir alınır:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resetClient } from "../client/client"
import { configureApi, resetApiConfig } from "../client/config"
import { createAnnouncement } from "./endpoints"

function envelope(data: unknown): Response {
  return new Response(JSON.stringify({ data, meta: null, errors: null, correlationId: "c" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}

/** POST yanıtı için asgari geçerli AnnouncementDto — bu testler GİDEN gövdeyi doğrular. */
const MINIMAL_DTO = {
  id: "a1",
  status: "draft",
  type: "institutional",
  reach: "schoolWide",
  isRead: null,
  childIds: [],
  title: "t",
  body: "b",
  urgent: false,
  pinned: false,
  amended: false,
  audienceLabel: "Hedef seçilmedi",
  audienceDetail: null,
  recipientCount: null,
  seenCount: null,
  publisherLabel: "Okul Müdürlüğü",
  publisherRealName: null,
  publisherSignature: null,
  publisherId: "p1",
  publishedAt: null,
  updatedAt: null,
  validUntil: null,
  channels: ["inApp"],
  attachment: null,
  withdrawReason: null,
}

function setupFetchMock() {
  // reason: generic açıkça `typeof fetch` veriliyor — aksi halde vi.fn'nin çıkarımı
  // parametresiz olur ve mock.calls[0] boş tuple'a düşer (attendance emsali).
  const fetchMock = vi.fn<typeof fetch>(async () => envelope(MINIMAL_DTO))
  configureApi({
    baseUrl: "http://x",
    auth: {
      getAccessToken: () => null,
      getRefreshToken: () => null,
      setTokens: vi.fn(),
      clear: vi.fn(),
    },
    fetch: fetchMock,
  })
  return fetchMock
}

async function sentBody(fetchMock: ReturnType<typeof setupFetchMock>) {
  const arg = fetchMock.mock.calls[0]![0]
  const init = fetchMock.mock.calls[0]![1]
  const raw = init?.body ?? (arg instanceof Request ? await arg.text() : undefined)
  return JSON.parse(String(raw))
}

const FORM = {
  title: "Veli toplantısı",
  body: "Yarın saat 14:00'te.",
  audience: [{ dimension: "section" as const, key: "9-A", bucket: "parent" as const }],
  channels: ["inApp" as const],
  scheduledAt: null,
  validUntil: null,
  urgent: false,
  pinned: false,
}

describe("createAnnouncement — giden gövde", () => {
  beforeEach(() => {
    resetApiConfig()
    resetClient()
  })
  afterEach(() => vi.restoreAllMocks())

  // Drift #1: bucket olmadan backend aynı (dimension, key) çiftini yönetici için
  // öğrencilere, öğretmen için velilere çözer — hedef kaydı kendini anlatmaz (INV-2).
  it("Should_SendBucket_When_AudienceSelected", async () => {
    const fetchMock = setupFetchMock()
    await createAnnouncement({ ...FORM, asDraft: true })
    expect((await sentBody(fetchMock)).audience).toEqual([
      { dimension: "section", key: "9-A", bucket: "parent" },
    ])
  })

  // Drift #2: alan backend'de ZORUNLU; ek dosya yükleme akışı C fazında.
  it("Should_SendNullAttachmentFileId_When_NotProvided", async () => {
    const fetchMock = setupFetchMock()
    await createAnnouncement({ ...FORM, asDraft: true })
    expect(await sentBody(fetchMock)).toHaveProperty("attachmentFileId", null)
  })

  it("Should_ForwardAttachmentFileId_When_Provided", async () => {
    const fetchMock = setupFetchMock()
    await createAnnouncement({ ...FORM, asDraft: true, attachmentFileId: "f-9" })
    expect(await sentBody(fetchMock)).toHaveProperty("attachmentFileId", "f-9")
  })
})
```

- [ ] **Adım 7: Testi koş, kırıldığını gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/api -- announcements
```

Beklenen: FAIL — `bucket` gövdede yok, `attachmentFileId` yok.

- [ ] **Adım 8: `createAnnouncement`'ı düzelt**

`packages/api/src/announcements/endpoints.ts` (~239-258). `bucket` değeri formda **zaten mevcut** (`AudienceSelection extends AudienceOption`), yalnız gönderilmiyordu:

```ts
/**
 * Yeni duyuru — `asDraft` true ise gönderim yapılmaz.
 *
 * `bucket` gövdeye YAZILIR (spec §5.1): aynı `(dimension, key)` çifti rol
 * bağlamına göre farklı alıcı üretir — yöneticide `section:9-A` öğrencilere,
 * öğretmende aynı çift velilere gider. `AnnouncementTarget` yayın anında
 * sonsuza kadar donduğu için (INV-2) hedef kaydı kendi kendini anlatmalıdır.
 *
 * `attachmentFileId` backend'de ZORUNLU alandır. Ek dosya yükleme akışı
 * (`/api/v1/files/initiate → confirm → attach`) ve compose bağlantısı C
 * fazındadır; bugün `null` gider, çağıran değer verirse iletilir.
 */
export async function createAnnouncement(
  input: AnnouncementFormValues & { asDraft: boolean; attachmentFileId?: string | null },
): Promise<Announcement> {
  const dto = await unwrap<AnnouncementDto>(
    await getClient().POST("/api/v1/announcements", {
      body: {
        title: input.title,
        body: input.body,
        audience: input.audience.map((a) => ({
          dimension: a.dimension,
          key: a.key,
          bucket: a.bucket,
        })),
        channels: input.channels,
        scheduledAt: input.scheduledAt,
        validUntil: input.validUntil,
        urgent: input.urgent,
        pinned: input.pinned,
        asDraft: input.asDraft,
        attachmentFileId: input.attachmentFileId ?? null,
      },
    }),
  )
  return toAnnouncement(dto)
}
```

**Doğrula:** `AnnouncementFormValues`'ın `audience` elemanlarında `bucket` var mı?

```bash
cd /Users/farukkaya/Repositories/oksis-ui
sed -n '1,30p' packages/core/src/announcements/schemas.ts
```

`audienceSelectionSchema`'da `bucket` yoksa oraya `bucket: z.enum(["parent", "teacher", "student"])` ekle ve bu adımı `packages/core` değişikliği olarak commit mesajına yansıt.

- [ ] **Adım 9: Testleri ve kapıları koş**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/api && npm run test -w @workspace/core && npm run typecheck && npm run lint
```

Beklenen: hepsi yeşil. `/tmp/b-drift-1.txt`'teki hataların **tamamı** kapanmış olmalı.

- [ ] **Adım 10: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add packages/api packages/core
git commit -m "feat(api): duyuru uclari codegen ile uretildi ve paths drift bekcisi kaldirildi"
```

---

## Görev 4: `contract.ts` silinmesi + yanıt tiplerinin generated şemaya taşınması

**Neden:** Spec §13 adım 5–6. **Bu adım atlanamaz** — `api-mocks` tiplerini bugün `contract.ts`'ten alır; o silinince kırılır.

**Drift #7/#8/#9 tam burada yüzeye çıkar:** generated `AnnouncementDto` enum alanlarını düz `string`, int alanlarını `number | string`, nullable alanları **opsiyonel** verir. Eşleyiciler bu üçünü de karşılamalıdır.

**Files:**
- Delete: `packages/api/src/announcements/contract.ts`
- Modify: `packages/api/src/announcements/endpoints.ts`
- Modify: `packages/api/src/announcements/endpoints.test.ts`
- Modify: `packages/api-mocks/src/announcements/announcement-data.ts`
- Modify: `packages/api-mocks/src/announcements/announcement-handlers.ts`

**Interfaces:**
- Consumes: Görev 1'in `*_VALUES` dizileri; `packages/api/src/generated/schema.ts`
- Produces: `endpoints.ts` içinde `type S = components["schemas"]`; dışa açık fonksiyon imzaları **değişmez** (dönüş tipleri hâlâ `packages/core` domain tipleri) — bu yüzden `queries.ts` ve app'ler etkilenmez

- [ ] **Adım 1: Başarısız testi yaz**

`packages/api/src/announcements/endpoints.test.ts` dosyasına ekle (üstteki `envelope`/`setupFetchMock` yardımcıları yeniden kullanılır):

```ts
import { getAnnouncement } from "./endpoints"

describe("toAnnouncement — wire daraltması (drift #7/#8/#9)", () => {
  beforeEach(() => {
    resetApiConfig()
    resetClient()
  })
  afterEach(() => vi.restoreAllMocks())

  async function fetchWith(patch: Record<string, unknown>) {
    const fetchMock = vi.fn<typeof fetch>(async () => envelope({ ...MINIMAL_DTO, ...patch }))
    configureApi({
      baseUrl: "http://x",
      auth: {
        getAccessToken: () => null,
        getRefreshToken: () => null,
        setTokens: vi.fn(),
        clear: vi.fn(),
      },
      fetch: fetchMock,
    })
    return getAnnouncement("a1")
  }

  it("Should_KeepKnownStatus_When_WireValueIsValid", async () => {
    expect((await fetchWith({ status: "withdrawn" })).status).toBe("withdrawn")
  })

  // Bilinmeyen statü GÜVENLİ ÇÖPE düşer: `archived` hiçbir eylem açmaz ve
  // gelen kutusunda görünmez (INBOX_ANNOUNCEMENT_STATUSES = published|expired).
  // `published`'a düşmek geri çekilmiş bir duyuruyu yayında gösterirdi.
  it("Should_FallBackToArchived_When_StatusIsUnknown", async () => {
    expect((await fetchWith({ status: "quantum" })).status).toBe("archived")
  })

  it("Should_DropUnknownChannels_When_WireCarriesExtras", async () => {
    expect((await fetchWith({ channels: ["inApp", "carrierPigeon"] })).channels).toEqual(["inApp"])
  })

  // INV-3: inApp kapatılamaz. Kanal listesi bilinmeyenlerle dolup boşalırsa
  // yine de inApp kalmalı.
  it("Should_AlwaysKeepInApp_When_AllChannelsUnknown", async () => {
    expect((await fetchWith({ channels: ["smokeSignal"] })).channels).toEqual(["inApp"])
  })

  // Drift #8: int32 alanları `number | string` gelebiliyor.
  it("Should_CoerceNumericStrings_When_CountsArriveAsStrings", async () => {
    const row = await fetchWith({ recipientCount: "125", seenCount: "40" })
    expect(row.recipientCount).toBe(125)
    expect(row.seenCount).toBe(40)
  })

  // Drift #8 + #9 birlikte: null sayaç 0'a DÜŞMEZ, null kalır — "hiç
  // yayınlanmadı" ile "sıfır kişi gördü" farklı şeylerdir.
  it("Should_KeepNullCounts_When_CountsAreNull", async () => {
    const row = await fetchWith({ recipientCount: null, seenCount: null })
    expect(row.recipientCount).toBeNull()
    expect(row.seenCount).toBeNull()
  })

  // Drift #9: generated'da alanlar opsiyonel — hiç gelmeyen alan null olmalı.
  it("Should_MapMissingOptionalsToNull_When_FieldsAbsent", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      envelope({
        id: "a1",
        status: "published",
        type: "classroom",
        reach: "classScoped",
        childIds: [],
        title: "t",
        body: "b",
        urgent: false,
        pinned: false,
        amended: false,
        audienceLabel: "9-A",
        publisherLabel: "Öğretmen",
        publisherId: "p1",
        channels: ["inApp"],
      }),
    )
    configureApi({
      baseUrl: "http://x",
      auth: {
        getAccessToken: () => null,
        getRefreshToken: () => null,
        setTokens: vi.fn(),
        clear: vi.fn(),
      },
      fetch: fetchMock,
    })
    const row = await getAnnouncement("a1")
    expect(row.isRead).toBeNull()
    expect(row.audienceDetail).toBeNull()
    expect(row.attachment).toBeNull()
    expect(row.withdrawReason).toBeNull()
    expect(row.publishedAt).toBeNull()
  })
})
```

- [ ] **Adım 2: Testi koş, kırıldığını gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/api -- announcements
```

Beklenen: FAIL — daraltma yok, `"quantum"` olduğu gibi geçiyor, `"125"` string kalıyor.

- [ ] **Adım 3: `endpoints.ts` başlığını ve daraltma yardımcılarını yaz**

`packages/api/src/announcements/endpoints.ts` — dosya başındaki `contract.ts` import bloğunu (~20-29) sil, yerine:

```ts
// OKSİS Duyurular — HTTP uçları (backend path `/announcements`).
// Tipler `generated/schema.ts`'ten gelir; el yazımı `contract.ts` + `paths.ts`
// 2026-08-04'te (B fazı) silindi — wire şeklinin tek otoritesi generated dosyadır.
//
// Backend duyuru enum'larını OpenAPI'de `enum` olarak DEĞİL düz `string` olarak
// ilan eder (`AnnouncementDto.cs` bilinçli olarak `string` kullanır). Bu yüzden
// her enum alanı burada domain union'ına daraltılır — çağrı yerinde tahmin
// edilmez (root CLAUDE.md "Backend Contract").

import {
  ANNOUNCEMENT_MODERATION_VALUES,
  ANNOUNCEMENT_REACH_VALUES,
  ANNOUNCEMENT_STATUS_VALUES,
  ANNOUNCEMENT_TYPE_VALUES,
  AUDIENCE_BUCKET_VALUES,
  DELIVERY_CHANNEL_VALUES,
  type AmendAnnouncementValues,
  type Announcement,
  type AnnouncementAuditEntry,
  type AnnouncementFormValues,
  type AnnouncementModeration,
  type AnnouncementReach,
  type AnnouncementStatus,
  type AnnouncementTemplate,
  type AnnouncementType,
  type AudienceBucket,
  type AudiencePool,
  type DeliveryChannel,
  type DeliveryReport,
} from "@workspace/core"

import type { components } from "../generated/schema"
import { getClient } from "../client/client"
import { unwrap } from "../client/request"

type S = components["schemas"]

// ═══════════ Wire → domain daraltıcıları ═══════════

/** int32/int64 alanları `number | string` gelebiliyor (generated şema kuralı). */
const num = (v: number | string): number => Number(v) || 0

/** Sayaçlarda null anlamlıdır: "yayınlanmadı" ≠ "sıfır kişi gördü". */
const numOrNull = (v: number | string | null | undefined): number | null =>
  v === null || v === undefined ? null : num(v)

/**
 * Bilinmeyen statü GÜVENLİ ÇÖPE düşer. `archived` seçildi çünkü hiçbir eylem
 * açmaz ve okuyucu gelen kutusunda görünmez (`INBOX_ANNOUNCEMENT_STATUSES`);
 * `published`'a düşmek geri çekilmiş bir duyuruyu yayında gösterirdi.
 */
function toStatus(v: string): AnnouncementStatus {
  return (ANNOUNCEMENT_STATUS_VALUES as readonly string[]).includes(v)
    ? (v as AnnouncementStatus)
    : "archived"
}

function toType(v: string): AnnouncementType {
  return (ANNOUNCEMENT_TYPE_VALUES as readonly string[]).includes(v)
    ? (v as AnnouncementType)
    : "institutional"
}

function toReach(v: string): AnnouncementReach {
  return (ANNOUNCEMENT_REACH_VALUES as readonly string[]).includes(v)
    ? (v as AnnouncementReach)
    : "schoolWide"
}

function toBucket(v: string): AudienceBucket {
  return (AUDIENCE_BUCKET_VALUES as readonly string[]).includes(v)
    ? (v as AudienceBucket)
    : "student"
}

function toModeration(v: string): AnnouncementModeration {
  return (ANNOUNCEMENT_MODERATION_VALUES as readonly string[]).includes(v)
    ? (v as AnnouncementModeration)
    : "open"
}

/**
 * Duyurunun AYARLANMIŞ kanal kümesi. Tanınmayanlar düşürülür; **INV-3 gereği
 * `inApp` her zaman kalır** — duyuru uygulama içinde görünmemezlik edemez.
 *
 * Tek bir kanalı daraltmak için bunu KULLANMA — `toChannel` var. Bu helper
 * `inApp`'i listeye ekler; tek elemanlı listede sonuç her zaman `inApp` olur.
 */
function toChannels(list: string[]): DeliveryChannel[] {
  const known = list.filter((c): c is DeliveryChannel =>
    (DELIVERY_CHANNEL_VALUES as readonly string[]).includes(c),
  )
  return known.includes("inApp") ? known : ["inApp", ...known]
}

/** TEKİL kanal daraltıcısı (gönderim raporu satırları). INV-3 burada geçerli değil. */
function toChannel(v: string): DeliveryChannel | null {
  return (DELIVERY_CHANNEL_VALUES as readonly string[]).includes(v)
    ? (v as DeliveryChannel)
    : null
}

/** Denetim izi tonu — yalnız iki bilinen değer, gerisi süssüz satır. */
function toTone(v: string | null | undefined): "danger" | "warning" | null {
  return v === "danger" || v === "warning" ? v : null
}
```

- [ ] **Adım 4: Eşleyicileri yeniden yaz**

Mevcut `toAnnouncement` / `toDeliveryReport` / `toAuditEntry` / `toTemplate` / `toAudienceOption` / `toAudiencePool` gövdelerini değiştir:

```ts
function toAnnouncement(d: S["AnnouncementDto"]): Announcement {
  return {
    id: d.id,
    status: toStatus(d.status),
    type: toType(d.type),
    reach: toReach(d.reach),
    isRead: d.isRead ?? null,
    childIds: d.childIds ?? [],
    title: d.title,
    body: d.body,
    urgent: Boolean(d.urgent),
    pinned: Boolean(d.pinned),
    amended: Boolean(d.amended),
    audienceLabel: d.audienceLabel,
    audienceDetail: d.audienceDetail ?? null,
    recipientCount: numOrNull(d.recipientCount),
    seenCount: numOrNull(d.seenCount),
    publisherLabel: d.publisherLabel,
    publisherRealName: d.publisherRealName ?? null,
    publisherSignature: d.publisherSignature ?? null,
    publisherId: d.publisherId,
    publishedAt: d.publishedAt ?? null,
    updatedAt: d.updatedAt ?? null,
    validUntil: d.validUntil ?? null,
    channels: toChannels(d.channels ?? []),
    attachment: d.attachment
      ? {
          name: d.attachment.name,
          size: num(d.attachment.size),
          mimeType: d.attachment.mimeType,
          url: d.attachment.url,
        }
      : null,
    withdrawReason: d.withdrawReason ?? null,
  }
}

function toDeliveryReport(d: S["DeliveryReportDto"]): DeliveryReport {
  return {
    announcementId: d.announcementId,
    total: num(d.total),
    reached: num(d.reached),
    seen: num(d.seen),
    // Rapor satırının kanalı TEKİL bir değerdir — `toChannels` KULLANILMAZ.
    // O helper INV-3'ü `inApp`'i listeye ekleyerek zorlar; tek elemanlı bir
    // listeye uygulanınca `["push"]` → `["inApp","push"]` → `[0] === "inApp"`
    // olur ve her satır "Uygulama içi" diye etiketlenir. INV-3 duyurunun
    // AYARLANMIŞ kanal kümesi hakkındadır, istatistik satırı hakkında değil.
    channels: (d.channels ?? []).flatMap((c) => {
      const channel = toChannel(c.channel)
      return channel === null ? [] : [{ channel, sent: num(c.sent), of: num(c.of) }]
    }),
    unreachable: (d.unreachable ?? []).map((u) => ({
      name: u.name,
      roleLabel: u.roleLabel,
      reason: u.reason,
    })),
  }
}

function toAuditEntry(d: S["AnnouncementAuditEntryDto"]): AnnouncementAuditEntry {
  return {
    actorName: d.actorName,
    actorInitials: d.actorInitials,
    action: d.action,
    at: d.at,
    field: d.field ?? null,
    tag: d.tag ?? null,
    tone: toTone(d.tone),
  }
}

function toTemplate(d: S["AnnouncementTemplateDto"]): AnnouncementTemplate {
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    usageCount: num(d.usageCount),
    lastUsedAt: d.lastUsedAt ?? null,
    urgent: Boolean(d.urgent),
  }
}

function toAudienceOption(o: S["AudienceOptionDto"]) {
  return {
    key: o.key,
    label: o.label,
    recipientCount: num(o.recipientCount),
    sublabel: o.sublabel ?? null,
    bucket: toBucket(o.bucket),
    breakdown: o.breakdown
      ? {
          parents: num(o.breakdown.parents),
          teachers: num(o.breakdown.teachers),
          students: num(o.breakdown.students),
        }
      : null,
  }
}

function toAudienceOptions(list: S["AudienceOptionDto"][] | null | undefined) {
  return (list ?? []).map(toAudienceOption)
}
```

`toAudiencePool` gövdesi aynı kalır; imzasını `(d: S["AudiencePoolDto"])` yap.

- [ ] **Adım 5: `unwrap` generic'lerini generated tiplere çevir**

`endpoints.ts` içindeki **tüm** `unwrap<...>` çağrılarını değiştir:

| Eski | Yeni |
|---|---|
| `unwrap<{ items: AnnouncementDto[] }>` | `unwrap<S["PagedResultOfAnnouncementDto"]>` |
| `unwrap<AnnouncementDto[]>` | `unwrap<S["AnnouncementDto"][]>` |
| `unwrap<AnnouncementDto>` | `unwrap<S["AnnouncementDto"]>` |
| `unwrap<DeliveryReportDto>` | `unwrap<S["DeliveryReportDto"]>` |
| `unwrap<AnnouncementAuditEntryDto[]>` | `unwrap<S["AnnouncementAuditEntryDto"][]>` |
| `unwrap<AnnouncementTemplateDto[]>` | `unwrap<S["AnnouncementTemplateDto"][]>` |
| `unwrap<AudiencePoolDto>` | `unwrap<S["AudiencePoolDto"]>` |
| `unwrap<AnnouncementModerationDto>` | `unwrap<S["AnnouncementModerationDto"]>` |
| `unwrap<AnnouncementPublisherDto[]>` | `unwrap<S["AnnouncementPublisherDto"][]>` |

`getAnnouncementModeration` dönüşünü `toModeration(dto.mode)`, `updateAnnouncementModeration` dönüşünü de `toModeration(dto.mode)` yap.

- [ ] **Adım 6: `contract.ts`'i sil**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git rm packages/api/src/announcements/contract.ts
```

`packages/api/package.json` exports haritası `{".": "./src/index.ts", "./*": "./src/*.ts"}` jokeridir — **düzenleme gerekmez** (doğrulandı).

- [ ] **Adım 7: `api-mocks`'ı generated şemaya taşı**

`packages/api-mocks/src/announcements/announcement-data.ts` (satır ~14-23) ve `announcement-handlers.ts` (satır ~11-17) içindeki

```ts
import type { ... } from "@workspace/api/announcements/contract"
```

bloklarını sil, yerine her iki dosyaya:

```ts
import type { components } from "@workspace/api/generated/schema"

type S = components["schemas"]
```

Sonra kullanılan tip adlarını eşle:

| Eski (contract) | Yeni |
|---|---|
| `AnnouncementDto` | `S["AnnouncementDto"]` |
| `AnnouncementAuditEntryDto` | `S["AnnouncementAuditEntryDto"]` |
| `AnnouncementModerationDto` | `S["AnnouncementModerationDto"]` |
| `AnnouncementPublisherDto` | `S["AnnouncementPublisherDto"]` |
| `AnnouncementTemplateDto` | `S["AnnouncementTemplateDto"]` |
| `AudienceOptionDto` | `S["AudienceOptionDto"]` |
| `AudiencePoolDto` | `S["AudiencePoolDto"]` |
| `DeliveryReportDto` | `S["DeliveryReportDto"]` |
| `CreateAnnouncementBody` | `S["CreateAnnouncementCommand"]` |
| `AmendAnnouncementBody` | `S["AmendAnnouncementRequestBody"]` |
| `ReasonBody` | `S["AnnouncementReasonRequestBody"]` |
| `UpdateModerationBody` | `S["UpdateModerationRequestBody"]` |

**Uyarı — sessiz kayıp ve `AnnouncementRow`'un son hâli:** generated DTO'da `status`/`type`/`reach`/`channels` düz `string`'tir, yani fixture'lara yazılan `"publishd"` gibi bir yazım hatası artık typecheck'te yakalanmaz. Bu, Görev 2'de eklenen basit kesişimin yetmediği anlamına gelir. `announcement-data.ts`'teki `AnnouncementRow` tanımını şununla **değiştir** (Görev 2'deki sürümün yerini alır):

```ts
/**
 * Mock'un İÇ satır tipi — Görev 2'deki basit kesişimin yerini alır.
 *
 * İki iş yapar: (1) `statusBeforeWithdraw`'ı taşır (wire DTO'sunda yoktur,
 * `toDto` onu düşürür — INV-4); (2) generated DTO'nun düz `string` verdiği
 * enum alanlarını domain union'ına daraltır, böylece fixture'daki bir yazım
 * hatası derleme anında yakalanır. Backend OpenAPI'si `enum` yaymadığı için
 * bu daraltma olmadan "Mocks are typed too" (root CLAUDE.md) kuralı mock
 * katmanında hükümsüz kalırdı.
 */
export type AnnouncementRow = Omit<
  S["AnnouncementDto"],
  "status" | "type" | "reach" | "channels"
> & {
  status: AnnouncementStatus
  type: AnnouncementType
  reach: AnnouncementReach
  channels: DeliveryChannel[]
  statusBeforeWithdraw: AnnouncementStatus | null
}
```

`AnnouncementStatus` / `AnnouncementType` / `AnnouncementReach` / `DeliveryChannel` `@workspace/core`'dan import edilir — `api-mocks` zaten ona bağımlıdır.

`toDto`'nun dönüş tipi bunun sonucu olarak `S["AnnouncementDto"]`'ya genişler; daraltılmış alanlar `string`'e atanabilir olduğu için ek dönüşüm gerekmez:

```ts
function toDto(row: AnnouncementRow): S["AnnouncementDto"] {
  const { statusBeforeWithdraw: _internal, ...dto } = row
  return dto
}
```

- [ ] **Adım 8: Testleri koş, geçtiğini gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/api && npm run test -w @workspace/api-mocks && npm run test -w @workspace/core
```

Beklenen: hepsi PASS. Görev 2'nin 9 mock testi hâlâ yeşil olmalı — retype davranışı değiştirmemeli.

- [ ] **Adım 9: Kapıları koş ve silinmeyi doğrula**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
grep -rn --include='*.ts' --include='*.tsx' "announcements/contract\|announcements/paths" apps packages | grep -v node_modules
npm run typecheck && npm run lint
```

Beklenen: `grep` **hiçbir şey döndürmemeli** (yalnız `packages/core/src/announcements/types.ts:8`'deki yorum satırı kalabilir — o da Görev 8'de güncellenir). Typecheck + lint yeşil.

- [ ] **Adım 10: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add packages/api packages/api-mocks
git commit -m "refactor(api): duyuru wire tipleri generated semaya devredildi ve contract dosyasi kaldirildi"
```

---

## Görev 5: Şablon yazma uçları — endpoint + hook + MSW handler

**Neden:** Drift #4. Backend A3'te dördünü de yazdı; istemcide yalnız `GET` bağlı. Kapsam kararı: **API katmanı + hook + mock**, UI yok.

**Doğrulanmış uç şekilleri:**

| Operasyon | Yol | Gövde | Başarı |
|---|---|---|---|
| Oluştur | `POST /api/v1/announcements/templates` | `CreateAnnouncementTemplateCommand {name, description, urgent}` | **200** + `Wrapped<AnnouncementTemplateDto>` |
| Güncelle | `PUT /api/v1/announcements/templates/{id}` | `UpdateAnnouncementTemplateRequestBody {name, description, urgent}` | **200** + `Wrapped<AnnouncementTemplateDto>` |
| Sil | `DELETE /api/v1/announcements/templates/{id}` | **gövdesiz** | **204**, `Wrapped<T>` sarmalı **YOK** |

`unwrap` 204/boş gövdeyi zaten karşılıyor (`request.ts`: "204/boş-gövde başarı yanıtlarında zarf hiç gelmez; data yerine undefined döneriz").

**Files:**
- Modify: `packages/api/src/announcements/endpoints.ts`
- Modify: `packages/api/src/announcements/queries.ts`
- Read then modify if needed: `packages/api/src/client/query-keys.ts`
- Modify: `packages/api-mocks/src/announcements/announcement-handlers.ts`
- Modify: `packages/api/src/announcements/endpoints.test.ts`

**Interfaces:**
- Produces:
  - `createAnnouncementTemplate(input: AnnouncementTemplateInput): Promise<AnnouncementTemplate>`
  - `updateAnnouncementTemplate(id: string, input: AnnouncementTemplateInput): Promise<AnnouncementTemplate>`
  - `deleteAnnouncementTemplate(id: string): Promise<void>`
  - `AnnouncementTemplateInput = { name: string; description: string; urgent: boolean }`
  - `useCreateAnnouncementTemplate()`, `useUpdateAnnouncementTemplate()`, `useDeleteAnnouncementTemplate()`

- [ ] **Adım 1: Başarısız testi yaz**

`packages/api/src/announcements/endpoints.test.ts` sonuna ekle:

```ts
import {
  createAnnouncementTemplate,
  deleteAnnouncementTemplate,
  updateAnnouncementTemplate,
} from "./endpoints"

const TEMPLATE_DTO = {
  id: "t1",
  name: "Veli toplantısı",
  description: "Şablon metni",
  // Bilerek STRING: int32 alanları tel'de `number | string` gelebiliyor (drift #8).
  // Burada `3` yazsaydık `toBe(3)` doğrulaması `num()` daraltmasını hiç sınamadan
  // geçerdi — boş bir doğrulama olurdu.
  usageCount: "3",
  lastUsedAt: null,
  urgent: false,
}

describe("şablon yazma uçları", () => {
  beforeEach(() => {
    resetApiConfig()
    resetClient()
  })
  afterEach(() => vi.restoreAllMocks())

  it("Should_PostToTemplatesCollection_When_Creating", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => envelope(TEMPLATE_DTO))
    configureApi({
      baseUrl: "http://x",
      auth: {
        getAccessToken: () => null,
        getRefreshToken: () => null,
        setTokens: vi.fn(),
        clear: vi.fn(),
      },
      fetch: fetchMock,
    })

    const row = await createAnnouncementTemplate({
      name: "Veli toplantısı",
      description: "Şablon metni",
      urgent: false,
    })

    const arg = fetchMock.mock.calls[0]![0]
    const url = new URL(typeof arg === "string" ? arg : (arg as Request).url)
    expect(url.pathname).toBe("/api/v1/announcements/templates")
    expect(row.usageCount).toBe(3)
  })

  it("Should_PutToTemplateItem_When_Updating", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => envelope(TEMPLATE_DTO))
    configureApi({
      baseUrl: "http://x",
      auth: {
        getAccessToken: () => null,
        getRefreshToken: () => null,
        setTokens: vi.fn(),
        clear: vi.fn(),
      },
      fetch: fetchMock,
    })

    await updateAnnouncementTemplate("t1", {
      name: "Yeni ad",
      description: "Yeni metin",
      urgent: true,
    })

    const arg = fetchMock.mock.calls[0]![0]
    const url = new URL(typeof arg === "string" ? arg : (arg as Request).url)
    expect(url.pathname).toBe("/api/v1/announcements/templates/t1")
  })

  // DELETE 204 döner ve zarf TAŞIMAZ — unwrap boş gövdeyi karşılamalı.
  it("Should_ResolveWithoutEnvelope_When_DeleteReturns204", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }))
    configureApi({
      baseUrl: "http://x",
      auth: {
        getAccessToken: () => null,
        getRefreshToken: () => null,
        setTokens: vi.fn(),
        clear: vi.fn(),
      },
      fetch: fetchMock,
    })

    await expect(deleteAnnouncementTemplate("t1")).resolves.toBeUndefined()
    const arg = fetchMock.mock.calls[0]![0]
    const url = new URL(typeof arg === "string" ? arg : (arg as Request).url)
    expect(url.pathname).toBe("/api/v1/announcements/templates/t1")
  })
})
```

- [ ] **Adım 2: Testi koş, kırıldığını gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/api -- announcements
```

Beklenen: FAIL — üç fonksiyon `./endpoints`'ten dışa açık değil.

- [ ] **Adım 3: Endpoint fonksiyonlarını yaz**

`packages/api/src/announcements/endpoints.ts` — mutasyonlar bölümünün sonuna:

```ts
/**
 * Şablon gövdesi — oluşturma ve güncelleme aynı üç alanı alır. Backend iki
 * ayrı şema adı kullanır (`CreateAnnouncementTemplateCommand` /
 * `UpdateAnnouncementTemplateRequestBody`) ama şekilleri birebir aynıdır.
 */
export interface AnnouncementTemplateInput {
  name: string
  description: string
  urgent: boolean
}

/** Şablon oluşturma — yalnız yönetim (`announcements.template.manage`). */
export async function createAnnouncementTemplate(
  input: AnnouncementTemplateInput,
): Promise<AnnouncementTemplate> {
  const dto = await unwrap<S["AnnouncementTemplateDto"]>(
    await getClient().POST("/api/v1/announcements/templates", { body: input }),
  )
  return toTemplate(dto)
}

export async function updateAnnouncementTemplate(
  id: string,
  input: AnnouncementTemplateInput,
): Promise<AnnouncementTemplate> {
  const dto = await unwrap<S["AnnouncementTemplateDto"]>(
    await getClient().PUT("/api/v1/announcements/templates/{id}", {
      params: { path: { id } },
      body: input,
    }),
  )
  return toTemplate(dto)
}

/**
 * Şablon silme. Duyurunun kendisi SİLİNMEZ (INV-1) ama şablon ayrı bir
 * aggregate'tir ve silinebilir. Uç `204` döner ve `Wrapped<T>` sarmalı
 * TAŞIMAZ — `unwrap` boş gövdeyi `undefined` olarak karşılar.
 */
export async function deleteAnnouncementTemplate(id: string): Promise<void> {
  await unwrap<undefined>(
    await getClient().DELETE("/api/v1/announcements/templates/{id}", {
      params: { path: { id } },
    }),
  )
}
```

- [ ] **Adım 4: Testi koş, geçtiğini gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/api -- announcements
```

Beklenen: PASS.

- [ ] **Adım 5: Hook'ları ekle**

Önce sorgu anahtarını doğrula:

```bash
cd /Users/farukkaya/Repositories/oksis-ui
grep -n "announcements" packages/api/src/client/query-keys.ts
```

`qk.announcements.templates()` zaten var (`queries.ts:88` kullanıyor). `packages/api/src/announcements/queries.ts` dosyasına, mevcut import listesine üç fonksiyonu ve `type AnnouncementTemplateInput`'u ekledikten sonra dosya sonuna:

```ts
/**
 * Şablon mutasyonları. Şablon listesi duyuru envanterinden bağımsızdır —
 * kök anahtar yerine yalnız `templates` invalidate edilir; şablon değişikliği
 * yayınlanmış duyuruları etkilemez.
 */
function useTemplateInvalidator() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: qk.announcements.templates() })
}

export function useCreateAnnouncementTemplate() {
  const invalidate = useTemplateInvalidator()
  return useMutation({
    mutationFn: (input: AnnouncementTemplateInput) => createAnnouncementTemplate(input),
    onSuccess: invalidate,
  })
}

export function useUpdateAnnouncementTemplate() {
  const invalidate = useTemplateInvalidator()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AnnouncementTemplateInput }) =>
      updateAnnouncementTemplate(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteAnnouncementTemplate() {
  const invalidate = useTemplateInvalidator()
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncementTemplate(id),
    onSuccess: invalidate,
  })
}
```

- [ ] **Adım 6: MSW handler'larını ekle**

`packages/api-mocks/src/announcements/announcement-handlers.ts` — mevcut `GET templates` handler'ının (~155) hemen ardına üç handler ekle. Şablon deposuna erişim `allTemplates()` üzerindendir (doğrulandı; dizi referansı döndüğü için yerinde mutasyon çalışır, fixture id'leri `t1`–`t4`):

```ts
/**
 * Kullanılmayan en küçük sıra numarasını verir. Sayaç yerine bu gerekir çünkü
 * silme sonrası dizi uzunluğu var olan bir id'yi geri üretebilir.
 */
function nextTemplateId(rows: Array<{ id: string }>): string {
  const used = new Set(rows.map((t) => t.id))
  let n = rows.length + 1
  while (used.has(`t${n}`)) n += 1
  return `t${n}`
}

http.post("*/api/v1/announcements/templates", async ({ request }) => {
  const body = (await request.json()) as S["CreateAnnouncementTemplateCommand"]
  const rows = allTemplates()
  const row = {
    // reason: id deterministik olmalı — Math.random test tekrarlanabilirliğini bozar.
    // `rows.length + 1` KULLANMA: `t2` silindikten sonra uzunluk 3'tür ve zaten
    // var olan `t4`'ü üretir; sonraki PUT/DELETE yanlış satıra çarpar.
    id: nextTemplateId(rows),
    name: body.name,
    description: body.description,
    usageCount: 0,
    lastUsedAt: null,
    urgent: Boolean(body.urgent),
  }
  rows.push(row)
  return HttpResponse.json(envelope(row))
}),

http.put("*/api/v1/announcements/templates/:id", async ({ params, request }) => {
  const body = (await request.json()) as S["UpdateAnnouncementTemplateRequestBody"]
  const row = allTemplates().find((t) => t.id === String(params.id))
  if (!row) return notFound("Şablon bulunamadı.")
  row.name = body.name
  row.description = body.description
  row.urgent = Boolean(body.urgent)
  return HttpResponse.json(envelope(row))
}),

// Gerçek uç 204 döner ve zarf TAŞIMAZ — mock aynısını yapmalı,
// yoksa istemci mock'ta çalışıp gerçekte kırılır.
http.delete("*/api/v1/announcements/templates/:id", ({ params }) => {
  const rows = allTemplates()
  const i = rows.findIndex((t) => t.id === String(params.id))
  if (i === -1) return notFound("Şablon bulunamadı.")
  rows.splice(i, 1)
  return new HttpResponse(null, { status: 204 })
}),
```

Görev 2'de eklenen `resetAnnouncementMocks()` `seeded = false; seed()` yaptığı için şablon dizisini de zaten sıfırlar — ek bir şey gerekmez.

- [ ] **Adım 7: Mock testini genişlet**

`packages/api-mocks/src/announcements/announcement-handlers.test.ts` sonuna:

```ts
describe("MSW şablon yazma uçları", () => {
  it("Should_AppendTemplate_When_Posted", async () => {
    const before = await (await fetch(`${BASE}/templates`)).json()
    const res = await fetch(`${BASE}/templates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Yeni", description: "Metin", urgent: false }),
    })
    expect(res.status).toBe(200)
    const after = await (await fetch(`${BASE}/templates`)).json()
    expect(after.data.length).toBe(before.data.length + 1)
  })

  it("Should_ReturnNoContentWithoutEnvelope_When_Deleted", async () => {
    const list = await (await fetch(`${BASE}/templates`)).json()
    const id = list.data[0].id
    const res = await fetch(`${BASE}/templates/${id}`, { method: "DELETE" })
    expect(res.status).toBe(204)
    expect(await res.text()).toBe("")
  })
})
```

- [ ] **Adım 8: Tüm kapıları koş**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/api && npm run test -w @workspace/api-mocks && npm run typecheck && npm run lint
```

- [ ] **Adım 9: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add packages/api packages/api-mocks
git commit -m "feat(api): duyuru sablonu olusturma guncelleme ve silme uclari baglandi"
```

---

## Görev 6: Zamanlanmış duyuruda geri çekme (ME-4b)

**Neden:** Drift #6. Backend `scheduled`'dan geri çekmeyi kabul ediyor; üç UI noktası hâlâ `status === "published"` diyor. Boş hedefli zamanlanmış duyuru aksi hâlde çıkışsız kalıyor.

**Kural core'a taşınır** çünkü aynı koşul üç yerde tekrarlanıyor ve bu bir iş kuralıdır (CLAUDE.md: iş mantığı `packages/core/*/logic.ts`).

**Files:**
- Modify: `packages/core/src/announcements/logic.ts`
- Modify: `packages/core/src/announcements/logic.test.ts`
- Modify: `apps/web/features/announcements/inventory-tab.tsx` (~419 — **yeniden doğrula**)
- Modify: `apps/web/features/announcements/announcements-page.tsx` (~266 — **yeniden doğrula**)
- Modify: `apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx` (~278 — **yeniden doğrula**)

**Interfaces:**
- Produces: `canWithdrawAnnouncement(status: AnnouncementStatus): boolean` — `@workspace/core` kökünden dışa açık (`export * from "./announcements/logic"` zaten var)

- [ ] **Adım 1: Başarısız testi yaz**

`packages/core/src/announcements/logic.test.ts` sonuna:

```ts
import { canWithdrawAnnouncement } from "./logic"

describe("canWithdrawAnnouncement — ME-4b", () => {
  it("Should_Allow_When_Published", () => {
    expect(canWithdrawAnnouncement("published")).toBe(true)
  })

  it("Should_Allow_When_Expired", () => {
    expect(canWithdrawAnnouncement("expired")).toBe(true)
  })

  // Hedefi sıfır alıcıya çözülen zamanlanmış duyuru aksi hâlde çıkışsız kalır:
  // yayınlanamaz, düzeltilemez (Amend yalnız published'dan), silinemez (INV-1).
  it("Should_Allow_When_Scheduled", () => {
    expect(canWithdrawAnnouncement("scheduled")).toBe(true)
  })

  it("Should_Deny_When_Draft", () => {
    expect(canWithdrawAnnouncement("draft")).toBe(false)
  })

  it("Should_Deny_When_PendingApproval", () => {
    expect(canWithdrawAnnouncement("pendingApproval")).toBe(false)
  })

  it("Should_Deny_When_AlreadyWithdrawn", () => {
    expect(canWithdrawAnnouncement("withdrawn")).toBe(false)
  })

  it("Should_Deny_When_Archived", () => {
    expect(canWithdrawAnnouncement("archived")).toBe(false)
  })
})
```

- [ ] **Adım 2: Testi koş, kırıldığını gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/core -- logic
```

Beklenen: FAIL — `canWithdrawAnnouncement` yok.

- [ ] **Adım 3: Kuralı yaz**

`packages/core/src/announcements/logic.ts` sonuna:

```ts
/**
 * Geri çekme kapısı. Backend `Announcement.Withdraw` üç statüden çalışır ve
 * bağlayıcı olan taraf odur (`oksis-api` Announcement.cs).
 *
 * `scheduled` **2026-08-04'te (ME-4b) eklendi**: hedefi sıfır alıcıya çözülen
 * zamanlanmış bir duyuru yayınlanamaz (job onu `scheduled` bırakır),
 * düzeltilemez (`Amend` yalnız `published`'dan çalışır ve hedef almaz — INV-2)
 * ve silinemez (INV-1). `:withdraw` böyle bir kaydı emekliye ayırmanın TEK
 * yoludur. `draft` ve `pendingApproval` çıkışsız değildir — taslak zaten
 * yayınlanmamıştır, onay bekleyen reddedilip taslağa döner.
 */
const WITHDRAWABLE_STATUSES: readonly AnnouncementStatus[] = ["published", "expired", "scheduled"]

export function canWithdrawAnnouncement(status: AnnouncementStatus): boolean {
  return WITHDRAWABLE_STATUSES.includes(status)
}
```

(`AnnouncementStatus` dosyanın mevcut `import type { ... } from "./types"` bloğunda yoksa ekle.)

- [ ] **Adım 4: Testi koş, geçtiğini gör**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/core -- logic
```

Beklenen: 7 yeni test PASS, mevcut 20 test hâlâ PASS.

- [ ] **Adım 5: Üç çağrı noktasını değiştir**

Önce gerçek satırları doğrula (A3'te doğruydu, kaymış olabilir):

```bash
cd /Users/farukkaya/Repositories/oksis-ui
grep -n 'status === "published"' apps/web/features/announcements/inventory-tab.tsx apps/web/features/announcements/announcements-page.tsx
grep -n "status === 'published'" apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx
```

Her üç dosyada `@workspace/core`'dan `canWithdrawAnnouncement` import et ve koşulu değiştir:

```tsx
// apps/web/features/announcements/inventory-tab.tsx (~419)
{canWrite && canWithdrawAnnouncement(row.status) && (
  /* ... "Geri çek" düğmesi, gövde değişmez ... */
)}
```

```tsx
// apps/web/features/announcements/announcements-page.tsx (~266)
// DİKKAT: buradaki TEK kapı bir fragment sarıyor ve içinde İKİ düğme var —
// "Geri çek" VE "Düzenle". Kapıyı olduğu gibi `canWithdrawAnnouncement`'a
// çevirirsen "Düzenle"yi de `scheduled`/`expired`'a açarsın; INV-2 bunu
// yasaklıyor (Amend yalnız `published`'dan çalışır) ve bu ME-4b'nin
// gerekçesinin tam tersidir. Kapıyı İKİYE BÖL:
{canWithdrawAnnouncement(detailRow.status) && (
  /* ... "Geri çek" düğmesi, gövde değişmez ... */
)}
{detailRow.status === "published" && (
  /* ... "Düzenle" düğmesi, koşulu da gövdesi de değişmez ... */
)}
```

```tsx
// apps/mobile/.../announcement-detail-screen.tsx (~278)
{canWithdrawAnnouncement(row.status) ? (
  <MenuAction icon="undo" label="Geri çek" danger onPress={/* değişmez */} />
) : null}
```

**Yalnız koşulu değiştir** — düğme gövdesine, metnine veya onPress'ine dokunma.

- [ ] **Adım 6: Kapıları koş**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test -w @workspace/core && npm run typecheck && npm run lint
```

- [ ] **Adım 7: Commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
git add packages/core apps/web apps/mobile
git commit -m "feat(core): zamanlanmis duyuruda geri cekme acildi ve kapi tek kurala baglandi"
```

---

## Görev 7: Duman testi — gerçek uca karşı

**Neden:** Spec §13 adım 7–8. Typecheck yeşil olmak "çalışıyor" demek değildir; §17'nin ilk riski mock verisinin kendi içinde tutarsız olduğunu söylüyor.

**Kod değişikliği beklenmez.** Bir kusur bulunursa: `oksis-ui` tarafındaysa düzelt ve commit et; `oksis-api` tarafındaysa **dur ve kullanıcıya raporla**.

**Files:** kusur bulunmadıkça yok.

- [ ] **Adım 1: Tüm kapıları son kez koş**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
npm run test -w @workspace/core && npm run test -w @workspace/api && npm run test -w @workspace/api-mocks
```

(Timeout'u açıkça ver: 600000 ms.)

- [ ] **Adım 2: Backend'in ayakta olduğunu doğrula**

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5112/openapi/v1.json    # 200
```

- [ ] **Adım 3: Uçları HTTP seviyesinde doğrula**

```bash
TOKEN=$(curl -s -X POST http://localhost:5112/api/v1/auth/account/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"mudur.s1@oksis.local","password":"Oksis1234!"}' \
  | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>process.stdout.write(JSON.parse(s).data.accessToken))')

for u in "/api/v1/announcements?pageSize=5" "/api/v1/announcements/audience" \
         "/api/v1/announcements/templates" "/api/v1/announcements/moderation" \
         "/api/v1/announcements/publishers" "/api/v1/announcements/approvals" \
         "/api/v1/announcements/inbox"; do
  printf '%-48s ' "$u"
  curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5112$u" -o /dev/null -w 'HTTP %{http_code}\n'
done
```

Beklenen: yedisi de `200`.

- [ ] **Adım 4: Web'i gerçek uca karşı çalıştır**

```bash
cd /Users/farukkaya/Repositories/oksis-ui/apps/web
NEXT_PUBLIC_API_MOCKING=disabled npm run dev
```

Tarayıcıda `http://localhost:3000` → `mudur.s1@oksis.local` / `Oksis1234!` ile giriş → `/announcements`.

Kontrol listesi:
- [ ] Envanter listesi yükleniyor (DB boşsa boş durum görünür, hata değil)
- [ ] "Yeni duyuru" → hedef kitle havuzu **gerçek sayılarla** dolu (canlı `all.recipientCount` = 125 idi)
- [ ] Taslak olarak kaydet → **201 değil 200** ile başarılı, liste yenileniyor
- [ ] Yayınla → `recipientCount` cevapta dolu geliyor
- [ ] Yayınlanmış duyuruda "Geri çek" görünüyor; gerekçesiz gönderim reddediliyor
- [ ] **Zamanlanmış duyuruda "Geri çek" görünüyor** (Görev 6'nın kanıtı)
- [ ] Şablonlar sekmesi yükleniyor (DB'de 0 şablon → boş durum)
- [ ] Moderasyon sekmesi `open` gösteriyor, `thresholded`'a çevirip geri alınabiliyor
- [ ] Tarayıcı konsolunda kırmızı yok; Network sekmesinde `/api/v1/announcements/*` istekleri **200**

- [ ] **Adım 5: Mobili gerçek uca karşı çalıştır**

```bash
cd /Users/farukkaya/Repositories/oksis-ui/apps/mobile
EXPO_PUBLIC_API_MOCKING=disabled npm run dev
```

**Not:** mobil `rewrites` proxy'sini kullanamaz (Next yok) — mutlak origin ister. `apps/mobile/.env.local` içindeki API taban adresini önce oku; `localhost` yazıyorsa fiziksel cihazda makinenin LAN IP'sine çevir, simülatörde `localhost` yeterlidir.

Kontrol listesi:
- [ ] Yönetici duyuru listesi yükleniyor
- [ ] Duyuru detayı açılıyor; yayınlanmışta "Geri çek" var
- [ ] **Zamanlanmışta "Geri çek" var**
- [ ] Gelen kutusu (veli/öğrenci profili) hata vermiyor

- [ ] **Adım 6: Bulguları raporla**

Sonucu kullanıcıya yaz: hangi maddeler geçti, hangileri kaldı. Bir kusur `oksis-api` tarafındaysa **düzeltme, raporla**.

Commit yalnız `oksis-ui` tarafında bir düzeltme yapıldıysa (o zaman uygun `fix(...)` mesajıyla).

---

## Görev 8: Spec §13'ü gerçeğe göre güncelle (`oksis` deposu)

**Neden:** Spec beş drift sayıyor; doğrulanan sayı dokuz. B prompt'u altıncıyı açıkça "spec'e ekle" diyor. Kalan üçü bu planda ilk kez yazıldı ve spec'e geçmezse bir sonraki okuyucu yine eksik listeye güvenir.

**Depo:** `/Users/farukkaya/Repositories/oksis`, dal `master`.

**Files:**
- Modify: `docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` (§13, ve §14 şablon CRUD satırı)
- Modify (oksis-ui, ayrı commit): `packages/core/src/announcements/types.ts:8` — artık var olmayan `contract.ts`'e atıf yapan yorum

- [ ] **Adım 1: §13'ün drift listesini dokuz maddeye çıkar**

`docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md` §13 adım 4'ün "Beşi önceden bilinir" ifadesini **"Dokuzu önceden bilinir"** yap ve mevcut beş maddeden sonra dördünü ekle. Metinler:

```markdown
   - `paths.ts` + MSW + UI → **`:withdraw` artık `scheduled`'dan da çalışıyor**
     (A3, ME-4b, 2026-08-04). Gerekçe: hedefi sıfır alıcıya çözülen zamanlanmış
     bir duyuru yayınlanamaz (`PublishScheduledAnnouncementsJob` onu `scheduled`
     bırakır), düzeltilemez (`Amend` yalnız `published`'dan çalışır ve hedef
     ALMAZ — INV-2) ve silinemez (INV-1); INV-1 silmeyi yasakladığı için
     `:withdraw` böyle bir kaydı emekliye ayırmanın TEK yoludur. Web ve mobil
     üç ayrı yerde `status === "published"` diyordu; kural
     `packages/core` `canWithdrawAnnouncement`'a taşındı.
   - `generated/schema.ts` → **duyuru enum alanları düz `string`'tir.**
     `AnnouncementDto.status`/`type`/`reach`, `channels: string[]`,
     `AudienceOptionDto.bucket`, `AnnouncementModerationDto.mode`,
     `AnnouncementAuditEntryDto.tone` — OpenAPI belgesinde **hiç `enum` şeması
     yoktur**, çünkü Application DTO'ları bilinçli olarak `string` kullanır
     (`AnnouncementDto.cs:12-14`). Bu bir kusur değil, mock-first sözleşmeyle
     uyum kararıdır; sonucu şudur: her enum alanı `endpoints.ts`'te domain
     union'ına daraltılmalıdır (emsal `schedule/endpoints.ts` `toStatus`).
     Bilinmeyen statü **`archived`'a** düşer — `published`'a düşmek geri
     çekilmiş bir duyuruyu yayında gösterirdi.
   - `generated/schema.ts` → **tüm int alanları `number | string`'tir**
     (`recipientCount`, `seenCount`, `usageCount`, `total`/`reached`/`seen`,
     `AnnouncementAttachmentDto.size`, sayfalama sayaçları). Repo genelinde
     mevcut bir .NET OpenAPI davranışıdır; `Number(v) || 0` ile daraltılır.
     Sayaçlarda **null korunur** — "yayınlanmadı" ile "sıfır kişi gördü"
     aynı şey değildir.
   - `generated/schema.ts` → **nullable alanlar OPSİYONELDİR** (`isRead?:
     null | boolean`), oysa `contract.ts` bunları zorunlu-nullable ilan
     ediyordu. Eşleyiciler `?? null` almalıdır, aksi hâlde alan hiç gelmediğinde
     `undefined` domain tipine sızar.
```

- [ ] **Adım 2: `restore` maddesine `scheduled` kolunu ekle**

§13'ün mevcut `restore` maddesi yalnız `expired` kolunu anlatıyor. Şu cümleyi ekle:

```markdown
     Kol **üçtür**, ikisi değil: `published → published`, `expired → expired`
     ve — ME-4b'den sonra — `scheduled → scheduled`, yani geri alma zamanlanmış
     duyuruyu yayın kuyruğuna geri koyar ve job onu tekrar denemeye devam eder.
```

- [ ] **Adım 3: §14'e şablon CRUD arayüzü boşluğunu ekle**

§14 tablosundaki `Şablon CRUD` satırı "A'ya taşındı (K-6)" diyor — bu backend için doğru, arayüz için değil. Satırı şununla değiştir:

```markdown
| Şablon CRUD — **backend** | **A'ya taşındı** (K-6); A3'te dört uç da yazıldı |
| Şablon CRUD — **arayüz** | **C'de yapılır.** B fazı (2026-08-04) API katmanını bağladı: `createAnnouncementTemplate` / `updateAnnouncementTemplate` / `deleteAnnouncementTemplate` + üç hook + üç MSW handler. Web `templates-tab.tsx` ve mobil `templates-screen.tsx` hâlâ **salt okunur listedir** — oluştur/düzenle/sil düğmesi yoktur. Tasarım handoff'u gelmeden ekran icat edilmedi (CLAUDE.md handoff kuralı) |
```

- [ ] **Adım 4: §13'ün 5. adımını yapılmış hâle getir**

"`contract.ts` + `paths.ts` **silinir**" satırının sonuna ekle:

```markdown
   *(Yapıldı — B fazı, 2026-08-04. `packages/api/package.json` exports haritası
   `{".": "./src/index.ts", "./*": "./src/*.ts"}` jokeridir; silme bir exports
   düzenlemesi gerektirmedi.)*
```

- [ ] **Adım 5: `oksis` deposunda commit**

```bash
cd /Users/farukkaya/Repositories/oksis
git add docs/superpowers/specs/2026-08-02-duyurular-uctan-uca-design.md
git commit -m "docs(repo): duyuru B fazi drift listesi dokuz maddeye tamamlandi"
```

- [ ] **Adım 6: `oksis-ui`'daki bayat yorumu düzelt**

`packages/core/src/announcements/types.ts:8` artık silinmiş `contract.ts`'e atıf yapıyor. Blok yorumundaki

```
 * Backend modülü HENÜZ YOK (mock-first): wire şekli
 * `packages/api/src/announcements/contract.ts` içindeki drift bekçisinde,
 * MSW handler'ları `@workspace/api-mocks`'ta.
```

satırlarını şununla değiştir:

```
 * Wire şeklinin tek otoritesi `packages/api/src/generated/schema.ts`'tir
 * (B fazı, 2026-08-04 — el yazımı `contract.ts` + `paths.ts` silindi).
 * Buradaki tipler DOMAIN tipleridir: `endpoints.ts` wire'dan gelen düz
 * `string` enum alanlarını bu union'lara daraltır.
 * MSW handler'ları `@workspace/api-mocks`'ta durmaya devam eder.
```

Aynı greple başka bayat atıf var mı bak:

```bash
cd /Users/farukkaya/Repositories/oksis-ui
grep -rn --include='*.ts' --include='*.tsx' "contract.ts\|paths.ts" packages apps | grep -v node_modules | grep -i announce
```

- [ ] **Adım 7: Kapıları koş ve commit**

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
git add packages/core/src/announcements/types.ts
git commit -m "docs(core): duyuru tiplerindeki silinmis contract atfi guncellendi"
```

---

## Bitiş

Tüm görevler bittiğinde `superpowers:finishing-a-development-branch` ile dalın entegrasyonuna karar ver. Birleştirmeden önce:

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run typecheck && npm run lint
npm run test -w @workspace/core && npm run test -w @workspace/api && npm run test -w @workspace/api-mocks
git log --oneline master..feature/announcements-b
```

Beklenen commit sayısı: **7** (Görev 1, 2, 3, 4, 5, 6 + Görev 8 Adım 7). Görev 7 kusur bulmadıysa commit üretmez.
