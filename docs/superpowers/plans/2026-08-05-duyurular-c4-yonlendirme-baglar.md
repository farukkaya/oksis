# Duyurular C4 — Yönlendirme ve Bağlar Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bildirime dokunan kişiyi doğru ekrana götürmek, geri alma (`restore`) eylemini bir yüzeye bağlamak ve moderasyon modunu Ayarlar › Bildirimler ekranından da yönetilebilir kılmak.

**Architecture:** Bildirimin nereye gideceği bir **rol sorusudur** ve `packages/core`'da saf fonksiyon olarak çözülür; her uygulama sonucu kendi rota şemasına çevirir. Backend'in `deepLink` alanı ve `INotificationEnqueuer` imzası **değişmez** — bir duyurunun alıcıları rol karışık olduğu için sunucu alıcı başına farklı bağlantı yazamaz, dolayısıyla `oksis://parent/...` biçimi bugünkü çekirdekte üretilemez. Geri alma ve moderasyon da aynı ilkeyle çalışır: karar core'da, çizim uygulamada.

**Tech Stack:** TypeScript + vitest (`packages/core`) · TanStack Query v5 (`packages/api`) · Next.js 16 App Router (`apps/web`) · Expo Router (`apps/mobile`)

## Global Constraints

- Kullanıcıya dönük her metin **Türkçe**dir.
- **`apps/web` ve `apps/mobile`'da test koşucusu YOKTUR.** Karar veren her kural `packages/core`'a taşınır ve orada test edilir.
- Commit formatı: `<type>(<scope>): türkçe açıklama` — sonda nokta yok.
- **Backend'e dokunulmaz.** `deepLink = "/announcements/{id}"` (`AnnouncementPublishedNotificationHandler.cs:62`) ve `INotificationEnqueuer.Enqueue` imzası bu planın kapsamı dışıdır.
- **`oksis://` şeması yazılmaz.** Karar (2026-08-05): rol→rota çözümü istemcide yapılır. Push teslim zinciri (D fazı) gelmediği için harici derin bağlantının kaynağı da yoktur — `expo-notifications` depoda kurulu değildir (spec §16).
- **INV-4 bağlayıcıdır:** `restore` koşulsuz `published` yapmaz, `StatusBeforeWithdraw`'a döner. Üç kol vardır: `published→published`, `expired→expired`, `scheduled→scheduled`.
- **İstemcide yetki altyapısı yoktur** (`settings-page.tsx:73` — `const ro = false`). Moderasyon kartı izin sorgusuyla değil, **ucun 403'üyle** kendini kapatır.

> **DÜZELTME (2026-08-09, C4 kapanışı) — bu kısıtın ilk yarısı fazla geniş, ikinci yarısı yanlış.**
>
> **Birinci yarı (yetki altyapısı yok):** üç ayağı da ölçüldü. `ContextView.permissions`
> üretilen şemada **vardır** ve `useMyContext` ile çekilir; ama bugün onu okuyan sıfır
> istemci kodu var (`packages/core/src/permissions/` altında `hasPermission` türü yardımcı
> yok, grep → 0) ve MSW oturum mock'u alanı **boş** döndürür — yani bugün kurulacak bir
> istemci izin kapısı mock'ta herkesi kilitler. Doğru ifade: *"izin verisi telde var, onu
> okuyan kod ve kapı kuran altyapı yok."* Ayrıca satır referansı bir satır kayık
> (`const ro = false` `:74`).
>
> **İkinci yarı (403'le kendini kapatır): ÇÜRÜDÜ.** Gerekçenin tam ölçümü Task 7/8'in kart
> docblock'unun yanındadır (bkz. aşağıda, `ModerationCard` notu). Özet: okuma ucu
> `announcements.moderate` **istemiyor**, `announcements.create` istiyor — yani öğretmen
> 403 almaz, kartı **görür**. Kapı okumaya değil **yazmaya** kondu.
- Komutlar:
  - Core testi: `npm run test --workspace=@workspace/core`
  - Uygulama doğrulama: `npm run typecheck --workspace=<paket>` · `npm run lint --workspace=<paket>`

---

## File Structure

| Dosya | Sorumluluk |
|---|---|
| `packages/core/src/announcements/logic.ts` | `restoreActionLabel`, `restoreOutcomeMessage` |
| `packages/core/src/notifications/logic.ts` | `resolveNotificationTarget` — deepLink + rol → semantik hedef |
| `apps/web/features/announcements/archive-tab.tsx` | Geri alma eylemi |
| `apps/web/features/announcements/modals.tsx` | `RestoreModal` |
| `apps/web/features/announcements/announcements-page.tsx` | `useRestoreAnnouncement` bağlanır |
| `apps/web/app/(dashboard)/announcements/[id]/page.tsx` (**yeni**) | Derin bağlantı hedefi |
| `apps/web/features/notifications/notification-bell.tsx` | Satırlar hedefe yönlenir |
| `apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx` | Geri alma eylemi |
| `apps/mobile/src/app/announcements/[id]/index.tsx` | `useRestoreAnnouncement` bağlanır |
| `apps/mobile/src/features/notifications/components/notif-list-screen.tsx:220-224` | Rol duyarlı yönlendirme |
| `apps/web/features/settings/notification-tab.tsx` | Moderasyon kartı |
| `apps/mobile/src/features/school-settings/components/notification-settings-screen.tsx` | Moderasyon kartı |

---

### Task 1: Geri alma metinleri core'da üç kola ayrılır

`useRestoreAnnouncement` (`packages/api/src/announcements/queries.ts:158`) yazılmış ama **hiçbir ekrandan çağrılmıyor**. Bağlanmadan önce cevaplanması gereken şudur: düğme ne vaat ediyor? "Yayına al" yanlış olur — süresi dolmuş bir kayıt geri alındığında `expired` kalır ve ekranda hiçbir şey değişmemiş görünür.

**Files:**
- Modify: `packages/core/src/announcements/logic.ts`
- Modify: `packages/core/src/announcements/logic.test.ts`

**Interfaces:**
- Consumes: `AnnouncementStatus`, `Announcement.statusBeforeWithdraw` — **yoktur ve gerekmez** (aşağıya bakın).
- Produces:
  ```ts
  export function canRestoreAnnouncement(status: AnnouncementStatus): boolean
  export function restoreActionLabel(): string
  export function restoreOutcomeMessage(restoredStatus: AnnouncementStatus): string
  ```

> **`statusBeforeWithdraw` istemciye SIZMAZ.** Backend DTO'su onu bilerek düşürüyor (`api-mocks` yorumunda da yazılı: "`statusBeforeWithdraw` yanıta sızmaz"). Yani düğmeye basmadan önce hangi statüye dönüleceği **bilinemez** — bu yüzden etiket sonuç vaat etmez ("Geri almayı geri al" değil, yalnız "Geri al"), sonuç ise mutasyonun **dönüş değerinden** okunur ve o zaman söylenir.

- [ ] **Step 1: Testi yaz**

`packages/core/src/announcements/logic.test.ts` sonuna:

```ts
describe("restore — INV-4 üç kol", () => {
  it("yalnız geri çekilmiş duyuru geri alınabilir", () => {
    expect(canRestoreAnnouncement("withdrawn")).toBe(true)
    for (const status of ["published", "scheduled", "expired", "draft", "pendingApproval"] as const) {
      expect(canRestoreAnnouncement(status)).toBe(false)
    }
  })

  it("eylem etiketi SONUÇ VAAT ETMEZ — dönülecek statü önceden bilinmez", () => {
    const label = restoreActionLabel()
    expect(label).not.toContain("Yayına")
    expect(label).toContain("Geri al")
  })

  it("sonuç mesajı dönülen statüyü söyler", () => {
    expect(restoreOutcomeMessage("published")).toContain("yayında")
    expect(restoreOutcomeMessage("scheduled")).toContain("zamanlama")
    expect(restoreOutcomeMessage("expired")).toContain("süresi")
  })

  it("beklenmedik statüde de anlamlı bir cümle döner", () => {
    expect(restoreOutcomeMessage("draft").length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: FAIL.

- [ ] **Step 3: Fonksiyonları yaz**

`packages/core/src/announcements/logic.ts`, `withdrawNotice`'ın altına (C1 Task 6 uygulanmadıysa `canWithdrawAnnouncement`'ın altına):

```ts
/** Geri alma yalnız geri çekilmiş kayıtta anlamlıdır (backend: Announcements.Restore.InvalidStatus). */
export function canRestoreAnnouncement(status: AnnouncementStatus): boolean {
  return status === "withdrawn"
}

/**
 * Geri alma düğmesinin etiketi. Kasıtlı olarak SONUÇSUZDUR.
 *
 * INV-4 gereği geri alma ÖNCEKİ statüye döner (`published`/`expired`/`scheduled`)
 * ve hangisi olduğu istemcide BİLİNMEZ: `statusBeforeWithdraw` DTO'dan bilerek
 * düşürülür. "Yayına al" yazan bir düğme, süresi dolmuş bir kaydı geri alan
 * kullanıcıya tutulmayan bir söz verirdi.
 */
export function restoreActionLabel(): string {
  return "Geri alma işlemini geri al"
}

/**
 * Geri alma bittikten SONRA gösterilecek cümle — statü artık bilinir, çünkü
 * uç güncellenmiş kaydı döndürür. Kullanıcının "ne oldu" sorusuna tek yerde
 * cevap verilir.
 */
export function restoreOutcomeMessage(restoredStatus: AnnouncementStatus): string {
  switch (restoredStatus) {
    case "published":
      return "Duyuru yeniden yayında; alıcıların listesinde görünüyor."
    case "scheduled":
      return "Duyurunun zamanlaması geri geldi; belirlenen tarihte otomatik yayınlanacak."
    case "expired":
      return "Duyuru arşivde kaldı: geçerlilik süresi zaten dolmuştu."
    default:
      return "Duyuru geri çekilmeden önceki durumuna döndü."
  }
}
```

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- announcements/logic
```

Beklenen: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/announcements
git commit -m "feat(announcements): geri alma etiketi ve sonuc metinleri core'a yazildi"
```

---

### Task 2: Web arşiv sekmesi geri almayı sunar

**Files:**
- Modify: `apps/web/features/announcements/archive-tab.tsx`
- Modify: `apps/web/features/announcements/modals.tsx`
- Modify: `apps/web/features/announcements/announcements-page.tsx`

**Interfaces:**
- Consumes: `canRestoreAnnouncement`, `restoreActionLabel`, `restoreOutcomeMessage`, `useRestoreAnnouncement` (`packages/api`).
- Produces: `RestoreModal` bileşeni (`modals.tsx`).

- [ ] **Step 1: `RestoreModal`'ı yaz**

`apps/web/features/announcements/modals.tsx`, `WithdrawModal`'ın altına:

```tsx
/**
 * Geri almanın geri alınması. Gerekçe İSTENMEZ — geri çekme bir karardı ve
 * gerekçesi arşivde duruyor; onu iptal etmek yeni bir gerekçe üretmez.
 * Sonucun ne olacağı burada söylenmez: dönülecek statü istemcide bilinmez
 * (`statusBeforeWithdraw` DTO'ya sızmaz), bu yüzden sonuç mutasyon bitince
 * bildirim olarak verilir.
 */
export function RestoreModal({
  row,
  pending,
  onClose,
  onConfirm,
}: {
  row: Announcement
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <DuyModalShell
      icon="refresh"
      tone="neutral"
      title={restoreActionLabel()}
      sub={row.title}
      onClose={onClose}
      foot={
        <>
          <span className="sp" />
          <button type="button" className="att-btn ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button type="button" className="att-btn primary" disabled={pending} onClick={onConfirm}>
            {pending ? "Geri alınıyor…" : "Geri al"}
          </button>
        </>
      }
    >
      <div className="duy-alert">
        <DuyIcon name="info" size={17} />
        <div>
          Duyuru, geri çekilmeden <b>önceki durumuna</b> döner — yayındaysa yayına, zamanlanmışsa
          zamanlamasına, süresi dolmuşsa arşivde kalır. Geri çekme gerekçesi kayıttan silinir.
        </div>
      </div>
    </DuyModalShell>
  )
}
```

- [ ] **Step 2: Arşiv tablosuna eylem sütunu ekle**

`archive-tab.tsx`: bileşen `onRestore: (row: Announcement) => void` prop'u alır; `<thead>`'e boş başlıklı bir sütun, her satıra da eylem hücresi eklenir:

```tsx
                  <td style={{ textAlign: "right" }}>
                    {canRestoreAnnouncement(row.status) && (
                      <button
                        type="button"
                        className="att-btn ghost"
                        onClick={() => onRestore(row)}
                      >
                        Geri al
                      </button>
                    )}
                  </td>
```

> Geri alma yalnız `withdrawn` satırlarda görünür; arşivdeki `expired` kayıtlarda düğme **hiç çizilmez** — o kayıtlar geri çekilmemiştir ve uç 409 döndürürdü.

- [ ] **Step 3: Sayfada mutasyonu bağla**

`announcements-page.tsx`:

```tsx
  const restore = useRestoreAnnouncement()
  const [restoreRow, setRestoreRow] = useState<Announcement | null>(null)
```

`ArchiveTab`'a `onRestore={setRestoreRow}` geçirin ve modalı çizin:

```tsx
      {restoreRow && (
        <RestoreModal
          row={restoreRow}
          pending={restore.isPending}
          onClose={() => setRestoreRow(null)}
          onConfirm={() =>
            restore.mutate(restoreRow.id, {
              onSuccess: (row) => {
                setRestoreRow(null)
                toasts.push({
                  tone: "success",
                  icon: "refresh",
                  title: "Geri alma iptal edildi",
                  // Sonuç ancak ŞİMDİ bilinir: uç güncellenmiş kaydı döndürdü.
                  desc: restoreOutcomeMessage(row.status),
                })
              },
              onError: (err) =>
                toasts.push({
                  tone: "danger",
                  icon: "xCircle",
                  title: "Geri alınamadı",
                  desc: mutationErrorDesc(err),
                }),
            })
          }
        />
      )}
```

> `mutationErrorDesc` C1 Task 2'de tanımlandı; C1 uygulanmadıysa yerinde `err instanceof ApiError ? err.message : "Bağlantınızı kontrol edip yeniden deneyin."` yazın.

- [ ] **Step 4: Doğrula**

```bash
npm run typecheck --workspace=@workspace/web && npm run lint --workspace=@workspace/web
```

Beklenen: PASS.

- [ ] **Step 5: Duman testi**

```bash
npm run dev --workspace=@workspace/web
```

Bir duyuruyu geri çekin, Arşiv sekmesinde "Geri al" ile iptal edin; bildirimin dönülen statüyü doğru söylediğini doğrulayın (yayındaki duyuru → "yeniden yayında").

- [ ] **Step 6: Commit**

```bash
git add apps/web/features/announcements
git commit -m "feat(announcements): arsiv sekmesinden geri alma iptal edilebiliyor"
```

---

### Task 3: Mobil detayda geri alma

**Files:**
- Modify: `apps/mobile/src/features/announcements/components/announcement-detail-screen.tsx:262-296`
- Modify: `apps/mobile/src/app/announcements/[id]/index.tsx`

**Interfaces:**
- Consumes: Task 1'in üç fonksiyonu, `useRestoreAnnouncement`.
- Produces: `AnnouncementDetailScreen`'e `onRestore: (row: Announcement) => void` prop'u.

- [ ] **Step 1: İşlem sayfasına eylemi ekle**

`announcement-detail-screen.tsx`, `Sheet` içinde "Geri çek" eyleminin yanına:

```tsx
          {canRestoreAnnouncement(row.status) ? (
            <MenuAction
              icon="refresh"
              label="Geri almayı iptal et"
              onPress={() => {
                setMenuOpen(false);
                onRestore(row);
              }}
            />
          ) : null}
```

- [ ] **Step 2: Rotada mutasyonu bağla**

`apps/mobile/src/app/announcements/[id]/index.tsx`:

```tsx
  const restore = useRestoreAnnouncement();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
```

```tsx
        onRestore={(target) =>
          restore.mutate(target.id, {
            // Sonuç ancak yanıt gelince bilinir — statusBeforeWithdraw istemciye sızmaz.
            onSuccess: (updated) => setRestoreMessage(restoreOutcomeMessage(updated.status)),
            onError: () => setRestoreMessage('Geri alınamadı. Yeniden deneyin.'),
          })
        }
```

`restoreMessage` doluyken ekranın üstünde `Note` ile gösterin; dokununca `null`'a çekin.

> **DÜZELTME (2026-08-09, C4 kapanışı) — planın EKSİĞİ: mobilde onay katmanı öngörülmedi.**
> Yukarıdaki akış `onPress` → `mutate` şeklindedir: **tek dokunuş, onay yok, uyarı yok.**
> Web'de aynı eylem (Task 2) `RestoreModal`dan geçer ve modal gövdesinde açıkça
> *"Geri çekme gerekçesi kayıttan silinir."* der.
>
> **Nasıl ölçüldü (2026-08-09):**
> - `apps/mobile/.../announcement-detail-screen.tsx` içinde `Alert` geçen satır sayısı: **0**
>   (dosyada onay diyaloğu yok; eylem doğrudan `Button` → `onRestore`).
> - `apps/web/.../modals.tsx` `RestoreModal` OKUNDU: "Vazgeç" + onay düğmesi, gövdede
>   "Geri çekme gerekçesi kayıttan silinir." cümlesi var.
> - Veri kaybı gerçek: `oksis-api` `Announcement.Restore()` içinde `WithdrawReason = null`
>   yazılır — geri alma, geri çekme gerekçesini **kalıcı olarak siler**.
> - Kardeş eylem tutarsız: aynı mobil ekranda **"Geri çek"** bir `WithdrawSheet` +
>   onay adımı ister; onun **iptali** hiçbir şey istemez.
>
> Bu bir plan kusurudur, uygulayıcı sapması değil — plan yalnız web ayağına onay yazdı.
> Ürün kararı gerektiriyor ve spec §17'ye **I-5** olarak açık madde diye kaydedildi;
> bu turda davranış bilinçli olarak DEĞİŞTİRİLMEDİ.
>
> Ayrıca **insan kararı (2026-08-06):** planın dayattığı `onError` metni
> (`'Geri alınamadı. Yeniden deneyin.'`) 403'te asla başarılamayacak bir şey öneriyor;
> mobil de web Task 2 ile aynı kaynağı (`mutationErrorDesc`) kullanır.

- [ ] **Step 3: Doğrula ve commit**

```bash
npm run typecheck --workspace=@workspace/mobile && npm run lint --workspace=@workspace/mobile
git add apps/mobile/src
git commit -m "feat(announcements): mobil detayda geri alma iptal edilebiliyor"
```

---

### Task 4: Bildirim hedefi rol duyarlı çözülür

Backend tek ve rolden bağımsız bir yol yazıyor: `/announcements/{id}`. Mobil bunu **yönetim** detayına götürüyor (`app/announcements/[id]/index.tsx` — geri çek düğmeli); okuyucu ekranı ayrı bir rotadır (`announcements/read/[id].tsx`). Yani veli bugün bildirime dokununca yanlış ekrana gidiyor. Web'de o rota **hiç yok** ve bildirim satırları zaten hiçbir yere gitmiyor.

**Files:**
- Modify: `packages/core/src/notifications/logic.ts`
- Modify: `packages/core/src/notifications/logic.test.ts` (yoksa oluşturun)

**Interfaces:**
- Consumes: `RoleKey` (`packages/core/src/roles/roles.ts` — `"admin" | "teacher" | "student" | "parent"`).
- Produces:
  ```ts
  export type NotificationTarget =
    | { kind: "announcement"; announcementId: string; surface: "reader" | "manager" }
    | { kind: "path"; path: string }
    | null
  export function resolveNotificationTarget(deepLink: string | null, role: RoleKey): NotificationTarget
  ```
  Task 5 ve Task 6 bunu tüketir.

- [ ] **Step 1: Testi yaz**

`packages/core/src/notifications/logic.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { resolveNotificationTarget } from "./logic"

describe("resolveNotificationTarget", () => {
  it("veliyi duyurunun OKUYUCU yüzeyine gönderir", () => {
    expect(resolveNotificationTarget("/announcements/a-1", "parent")).toEqual({
      kind: "announcement",
      announcementId: "a-1",
      surface: "reader",
    })
  })

  it("öğrenciyi de okuyucu yüzeyine gönderir", () => {
    expect(resolveNotificationTarget("/announcements/a-1", "student")).toMatchObject({
      surface: "reader",
    })
  })

  it("yöneticiyi ve öğretmeni yönetim yüzeyine gönderir", () => {
    expect(resolveNotificationTarget("/announcements/a-1", "admin")).toMatchObject({
      surface: "manager",
    })
    expect(resolveNotificationTarget("/announcements/a-1", "teacher")).toMatchObject({
      surface: "manager",
    })
  })

  it("duyuru olmayan derin bağlantıyı olduğu gibi taşır", () => {
    expect(resolveNotificationTarget("/attendance", "teacher")).toEqual({
      kind: "path",
      path: "/attendance",
    })
  })

  it("duyuru listesini (kimliksiz) yol olarak taşır — ara listeye düşürmez", () => {
    expect(resolveNotificationTarget("/announcements", "admin")).toEqual({
      kind: "path",
      path: "/announcements",
    })
  })

  it("boş veya göreli olmayan bağlantıda hiçbir yere gitmez", () => {
    expect(resolveNotificationTarget(null, "parent")).toBeNull()
    expect(resolveNotificationTarget("", "parent")).toBeNull()
    expect(resolveNotificationTarget("https://baska.site/x", "parent")).toBeNull()
    expect(resolveNotificationTarget("oksis://parent/announcements/a-1", "parent")).toBeNull()
  })

  it("fazladan segment taşıyan duyuru yolunu duyuru saymaz", () => {
    expect(resolveNotificationTarget("/announcements/a-1/audit", "admin")).toEqual({
      kind: "path",
      path: "/announcements/a-1/audit",
    })
  })
})
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- notifications/logic
```

Beklenen: FAIL.

- [ ] **Step 3: Fonksiyonu yaz**

`packages/core/src/notifications/logic.ts` sonuna:

```ts
export type NotificationTarget =
  | { kind: "announcement"; announcementId: string; surface: "reader" | "manager" }
  | { kind: "path"; path: string }
  | null

/**
 * Bildirim satırına dokunulduğunda NEREYE gidileceği.
 *
 * Backend duyuru bildirimlerine tek ve ROLDEN BAĞIMSIZ bir yol yazar
 * (`/announcements/{id}` — AnnouncementPublishedNotificationHandler). Yazamazdı
 * da: bir duyurunun alıcıları rol karışıktır (öğretmen + veli + öğrenci) ve
 * `INotificationEnqueuer.Enqueue` alıcı başına farklı bağlantı taşımaz. Rol
 * ayrımı bu yüzden İSTEMCİDE yapılır — sunucuya bir kusur olarak yazılmaz.
 *
 * Veli/öğrenci OKUYUCU yüzeyine gider: yönetim detayında gönderim raporu,
 * denetim izi ve "Geri çek" düğmesi vardır ve bunların hiçbiri okuyucuya ait
 * değildir.
 *
 * Yalnız `/` ile başlayan uygulama-içi yollar kabul edilir. `oksis://` ve
 * `https://` REDDEDİLİR: harici şema ne üretiliyor ne de işleniyor (push
 * teslim zinciri D fazındadır), kabul etmek doğrulanmamış bir yönlendirme
 * yüzeyi açardı.
 */
export function resolveNotificationTarget(
  deepLink: string | null,
  role: RoleKey,
): NotificationTarget {
  if (!deepLink || !deepLink.startsWith("/")) return null

  const segments = deepLink.split("/").filter(Boolean)
  if (segments.length === 2 && segments[0] === "announcements") {
    return {
      kind: "announcement",
      announcementId: segments[1]!,
      surface: role === "parent" || role === "student" ? "reader" : "manager",
    }
  }

  return { kind: "path", path: deepLink }
}
```

`RoleKey`'i dosyanın import bloğuna ekleyin (`import type { RoleKey } from "../roles/roles"`).

- [ ] **Step 4: Testi çalıştır, yeşil olduğunu doğrula**

```bash
npm run test --workspace=@workspace/core -- notifications/logic
```

Beklenen: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/notifications
git commit -m "feat(notifications): bildirim hedefi rol duyarli cozuluyor"
```

---

### Task 5: Mobil bildirim listesi doğru ekrana götürür

**Files:**
- Modify: `apps/mobile/src/features/notifications/components/notif-list-screen.tsx:220-224`

**Interfaces:**
- Consumes: `resolveNotificationTarget`, `useActiveRole()` (`apps/mobile/src/features/navigation/use-active-role.ts` — `role: RoleKey` döndürür).
- Produces: yok.

- [ ] **Step 1: `openNotif`'i değiştir**

```tsx
  const { role } = useActiveRole();

  function openNotif(n: Notification) {
    if (!n.isRead) markRead.mutate(n.id);

    const target = resolveNotificationTarget(n.deepLink, role);
    if (!target) return;

    if (target.kind === "announcement") {
      // Veli/öğrenci OKUYUCU rotasına gider: yönetim detayında gönderim raporu,
      // denetim izi ve "Geri çek" düğmesi var — hiçbiri okuyucuya ait değil.
      router.push(
        target.surface === "reader"
          ? { pathname: '/announcements/read/[id]', params: { id: target.announcementId } }
          : { pathname: '/announcements/[id]', params: { id: target.announcementId } },
      );
      return;
    }

    router.push(target.path as never);
  }
```

`useActiveRole` zaten bu dosyada kullanılmıyorsa import edin.

- [ ] **Step 2: Doğrula**

```bash
npm run typecheck --workspace=@workspace/mobile && npm run lint --workspace=@workspace/mobile
```

Beklenen: PASS.

- [ ] **Step 3: Duman testi**

Veli olarak giriş yapıp bir duyuru bildirimine dokunun: **okuma** ekranı açılmalı ve "Geri çek" işlem sayfası görünmemeli. Yönetici olarak aynı bildirim yönetim detayına gitmeli.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/features/notifications
git commit -m "fix(notifications): duyuru bildirimi role gore dogru ekrana gidiyor"
```

---

### Task 6: Web'de duyuru detay rotası açılır

`/announcements/{id}` web'de **404**. Backend bildirimi oraya yönlendiriyor ve web bildirim satırları bugün hiçbir yere gitmiyor.

**Files:**
- Create: `apps/web/app/(dashboard)/announcements/[id]/page.tsx`
- Modify: `apps/web/features/announcements/announcements-page.tsx`
- Modify: `apps/web/features/notifications/notification-bell.tsx`

**Interfaces:**
- Consumes: `resolveNotificationTarget`, mevcut `AnnouncementsPage` görünüm durumu (`View = { kind: "detail"; id }`).
- Produces: `/announcements/{id}` rotası.

- [ ] **Step 1: `AnnouncementsPage`'in başlangıç görünümünü parametreleştir**

`announcements-page.tsx`:

```tsx
export function AnnouncementsPage({ initialDetailId }: { initialDetailId?: string } = {}) {
  // Derin bağlantı doğrudan detayı açar (DYR-F-18: "ara listeye düşmez").
  const [view, setView] = useState<View>(
    initialDetailId ? { kind: "detail", id: initialDetailId } : { kind: "list" },
  )
```

- [ ] **Step 2: Rotayı oluştur**

Create `apps/web/app/(dashboard)/announcements/[id]/page.tsx`:

```tsx
import { AnnouncementsPage } from "@/features/announcements"

/**
 * Duyuru detayı derin bağlantı hedefi. Backend bildirimlere
 * `/announcements/{id}` yazıyor (AnnouncementPublishedNotificationHandler) ve
 * bu rota olmadan o bağlantı web'de 404 dönüyordu.
 *
 * Ayrı bir ekran DEĞİL: aynı sayfa, detay görünümü açık başlıyor. İki ayrı
 * detay yüzeyi tutmak, "geri çek" ve "düzenle" gibi eylemlerin iki yerde
 * ayrışmasına yol açardı.
 *
 * Web'de veli/öğrenci okuma yüzü KAPSAM DIŞIDIR (spec K-7): bu rota yönetim
 * yüzeyidir ve yetkisi olmayan çağıranda uç zaten 403 döner.
 */
export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AnnouncementsPage initialDetailId={id} />
}
```

> **DÜZELTME (2026-08-09, C4 kapanışı) — ölçüldü, planın güvenlik gerekçesi YANLIŞTI.**
> Docblock'un son cümlesi (*"bu rota yönetim yüzeyidir ve yetkisi olmayan çağıranda uç
> zaten 403 döner"*) bir **güvenlik varsayımıdır** ve tutmuyor.
>
> **Nasıl ölçüldü (2026-08-09, `oksis-api` `master`):**
> 1. `RolePermissionSeedData.Rows()` okundu. `announcements.view` **beş rolde** verilir:
>    `SuperAdmin` + `SchoolAdmin` (`AllPermissionIds()` kataloğu üzerinden), `Teacher`,
>    `Parent`, `Student` — dördü de rolün kendi `foreach` bloğunda açıkça. Yani veli ve
>    öğrenci `[RequirePermission("announcements.view")]` kapısından **geçer**.
>    (`VicePrincipal` ve `Counselor` MVP sonrasına ertelendi; seed'de 5 `SystemRole` var.)
> 2. `GetAnnouncementByIdQueryHandler` okundu: gövdede **iki** `Forbidden()` vardır ve
>    ikisi de yetkiyle ilgili değildir — biri tenant çözülemediğinde, biri çağıranın
>    `Person` kaydı bulunamadığında. Alıcı olmayan / okuyucuya kapalı statüdeki çağıran
>    `NotFound()` alır; docblock'un kendisi bunu "geri çekilmiş duyuru alıcıya **404**
>    döner" diye zaten yazıyor.
>
> **Sonuç:** veli/öğrenci çağrısı 403 değil **200 ya da 404** döner. Plana birebir
> uyulsaydı `/announcements/{id}` rotası veli, öğrenci ve öğretmene **yönetim konsolunu**
> (onay kuyruğu sekmesi + okul geneli moderasyon ayarı) açardı.
>
> **Sevk edilen kod sapıyor ve sapma haklıdır:** rota `AnnouncementsPage`i doğrudan değil
> **`AnnouncementsScreen`**i çağırır — rol kapısı orada, tek yerdedir
> (`admin/secretary → yönetim konsolu`, `teacher → Duyurularım`, `parent/student → "şu an
> mobil uygulamada"`). Planın "tek yüzey" gereği bozulmadı; yalnız yüzeyi seçen kapı
> sunucudan istemciye taşındı.
>
> Aynı yanlış cümle spec §4'ün "yedi rolün tamamı" satırında ve modül belgesinin
> `api-contracts.md` "Handler'daki Ek Daraltmalar" tablosunda da vardı; ikisi de bu
> kapanışta düzeltildi.

> Next.js 16'da `params` bir Promise'tir; `(dashboard)` altındaki mevcut dinamik rotaları (`attendance/sessions/[sessionId]/page.tsx`) örnek alın ve oradaki imza kalıbını birebir izleyin.

- [ ] **Step 3: Bildirim satırlarını yönlendir**

`notification-bell.tsx` içinde her bildirim satırını `resolveNotificationTarget(n.deepLink, role)` sonucuna göre bir `next/link` `Link`'ine sarın:

```tsx
// Yönetim kabuğunda rol "admin"/"teacher"tır; web'de veli/öğrenci okuma yüzü
// yoktur (K-7), dolayısıyla hedef her zaman yönetim yüzeyidir.
const target = resolveNotificationTarget(n.deepLink, role)
const href =
  target?.kind === "announcement"
    ? `/announcements/${target.announcementId}`
    : target?.kind === "path"
      ? target.path
      : null
```

`href` `null` ise satır tıklanabilir olmaz (bugünkü davranış korunur).

- [ ] **Step 4: Doğrula**

```bash
npm run typecheck --workspace=@workspace/web && npm run lint --workspace=@workspace/web
```

Beklenen: PASS.

- [ ] **Step 5: Duman testi**

`/announcements/<gerçek-id>` adresine doğrudan gidin: detay açılmalı. Zilden bir duyuru bildirimine tıklayın: aynı detaya gitmeli.

- [ ] **Step 6: Commit**

```bash
git add apps/web/app apps/web/features
git commit -m "feat(announcements): web duyuru detay rotasi ve bildirim yonlendirmesi eklendi"
```

---

### Task 7: Moderasyon modu Ayarlar › Bildirimler'de

Spec §3.3: moderasyon `SchoolSettings`'te bir okul politikasıdır ve "Ayarlar › Bildirimler ekranı **aynı ucu** tüketir". Bugün o ekran yalnız `useNotificationConfig` kullanıyor — moderasyon ayrı bir uçtur (`GET|PUT /announcements/moderation`), yani ekranda **iki bağımsız kayıt yolu** olacak.

**Files:**
- Modify: `apps/web/features/settings/notification-tab.tsx`

**Interfaces:**
- Consumes: `useAnnouncementModeration`, `useUpdateAnnouncementModeration` (`packages/api/src/announcements/queries.ts:112-127`), `ANNOUNCEMENT_MODERATION_CONFIG` (`packages/core/src/announcements/constants.ts:132`), `ACard`/`ASeg`/`ATip` (`apps/web/features/settings/parts.tsx`).
- Produces: yok.

> **Kayıt yolu ayrıdır ve bilinçlidir.** `useSaveBridge` tek bir "kirli/kaydet" köprüsü varsayıyor ve bildirim matrisine ait. Moderasyon kartı o köprüye **girmez**: seçim anında kaydeder (tek alanlı bir anahtar için "Kaydet" düğmesi beklemek gereksiz bir adımdır) ve kendi geri bildirimini verir. Kartın altına bu ayrım kullanıcıya da yazılır.

- [ ] **Step 1: Moderasyon kartını ekle**

`notification-tab.tsx` içinde, `BildirimForm`'un döndürdüğü ağacın sonuna (Gönderim Tercihleri kartının altına):

```tsx
        <ModerationCard ro={ro} api={api} />
```

Dosyanın sonuna bileşeni yazın:

```tsx
/**
 * Duyuru moderasyon modu — Duyurular › Moderasyon sekmesiyle AYNI ucu tüketir
 * (`GET|PUT /announcements/moderation`, spec §3.3). İki yüzey tek kaynağa
 * bakar; hook aynı query anahtarını paylaştığı için birinden yapılan değişiklik
 * diğerinde anında görünür.
 *
 * Bu kart bildirim matrisinin `useSaveBridge` köprüsüne GİRMEZ: köprü tek bir
 * kirli/kaydet durumu tutuyor ve matrise ait. Tek alanlı bir okul politikası
 * için ayrı bir "Kaydet" adımı beklemek gereksizdir — seçim anında kaydedilir.
 *
 * İstemcide yetki altyapısı yok (`settings-page.tsx` → `ro = false`), bu yüzden
 * kart izin SORGUSUYLA değil, ucun 403'üyle kendini kapatır: `announcements.moderate`
 * izni olmayan kullanıcı okuma çağrısında zaten reddedilir.
 */
/*
 * DÜZELTME (2026-08-09, C4 kapanışı) — ölçüldü, bu mekanizma ÇALIŞMIYOR.
 *
 * Nasıl ölçüldü (2026-08-09, `oksis-api` `master`):
 *   1. `GetAnnouncementModerationQuery` üzerindeki öznitelik OKUNDU:
 *      `[RequirePermission("announcements.create")]` — `moderate` DEĞİL. Sınıfın kendi
 *      doc'u da bunu açıkça yazıyor ("İzni `announcements.create`'tir, `moderate` DEĞİL")
 *      ve gerekçesini veriyor: öğretmen compose ekranında modu okumak ZORUNDADIR, yoksa
 *      `requiresApproval` saf fonksiyonu girdisiz kalır.
 *   2. `UpdateAnnouncementModerationCommand` üzerindeki öznitelik OKUNDU:
 *      `[RequirePermission("announcements.moderate")]` — ve handler'da İKİNCİ bir kapı
 *      daha var (`permissionReader.HasPermissionAsync("announcements.moderate")`).
 *   3. `RolePermissionSeedData` SAYILDI: `announcements.create` → 2 rol (SchoolAdmin,
 *      Teacher; SuperAdmin'de YOK, çünkü duyuru yazma izinleri bilinçli olarak
 *      `AllPermissionIds()` kataloğu dışındadır). `announcements.moderate` → 1 rol
 *      (SchoolAdmin).
 *
 * Sonuç: moderasyon yetkisi olmayan ÖĞRETMEN okuma çağrısında 403 ALMAZ — kartı
 * GÖRÜR, hatta okur, ama kaydedemez. Kart kendini kapatmaz. Planın kurduğu tek
 * savunma katmanı, korumak istediği kullanıcıda hiç devreye girmiyor.
 *
 * Sevk edilen kod sapıyor ve sapma haklıdır: kapı OKUMAYA değil YAZMAYA kondu —
 * kaydetme denemesi 403 alınca kullanıcıya "bu ayarı değiştirme yetkiniz yok"
 * denir. Hata metni de değişti: planın metni üç hata kolunda da (okuma hatası,
 * ağ hatası, yetki hatası) "yetki gerekir" diyerek yalan söylüyordu.
 *
 * Bu yüzeyin bugünkü gerçek kullanıcısı da ölçüldü: öğretmen `apps/web`'de Ayarlar'a
 * HİÇ giremiyor (nav sözleşmesinde öğretmen grubunda `/settings` yok), yani web'de
 * senaryonun kullanıcısı yok; senaryo MOBİL öğretmen ekranında gerçekleşiyor (Task 8).
 * Web'de 403-on-read'in tek gerçekçi adayı SUPER_ADMIN'dir (`create` onda yok).
 */
function ModerationCard({ ro, api }: { ro: boolean } & Pick<SettingsTabProps, "api">) {
  const moderationQuery = useAnnouncementModeration()
  const update = useUpdateAnnouncementModeration()

  if (moderationQuery.isLoading) return <SettingsSkeleton />

  if (moderationQuery.isError) {
    return (
      <ACard
        icon="mega"
        title="Duyuru Moderasyonu"
        desc="Bu ayarı görüntülemek için duyuru moderasyon yetkisi gerekir."
      >
        <AEmpty label="Yetkiniz yok" />
      </ACard>
    )
  }

  const mode = moderationQuery.data ?? "open"

  return (
    <ACard
      icon="mega"
      title="Duyuru Moderasyonu"
      desc="Öğretmen duyurularının yönetim onayına düşüp düşmeyeceği."
    >
      <ASeg
        value={mode}
        options={(["open", "thresholded"] as const).map((key) => ({
          value: key,
          label: ANNOUNCEMENT_MODERATION_CONFIG[key].label,
        }))}
        disabled={ro || update.isPending}
        onChange={(next) =>
          update.mutate(next, {
            onSuccess: () => api.toast("Duyuru moderasyon modu güncellendi"),
            onError: () => api.toast("Moderasyon modu kaydedilemedi"),
          })
        }
      />
      <ATip tip="Aynı ayar Duyurular ekranının Moderasyon sekmesinde de bulunur.">
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
          {ANNOUNCEMENT_MODERATION_CONFIG[mode].description}
        </div>
      </ATip>
      <AUsedIn items={["Duyurular › Moderasyon", "Öğretmen duyuru oluşturma ekranı"]} />
    </ACard>
  )
}
```

> `ASeg`/`AEmpty`/`ATip`/`AUsedIn` imzaları `parts.tsx`'tedir; prop adları oradakiyle birebir eşleşmelidir (`ASeg` `options`/`value`/`onChange` almıyorsa oradaki gerçek imzayı kullanın, kart yapısını değiştirmeyin).

- [ ] **Step 2: Doğrula**

```bash
npm run typecheck --workspace=@workspace/web && npm run lint --workspace=@workspace/web
```

Beklenen: PASS.

- [ ] **Step 3: Duman testi**

Ayarlar › Bildirimler'den modu `thresholded` yapın, Duyurular ekranına geçin: Moderasyon sekmesi aynı değeri göstermeli ve "Onay kuyruğu" sekmesi belirmeli (mod değişiminde kök anahtar invalide ediliyor — `useUpdateAnnouncementModeration`).

- [ ] **Step 4: Commit**

```bash
git add apps/web/features/settings
git commit -m "feat(settings): duyuru moderasyon modu bildirim ayarlarindan yonetilebiliyor"
```

---

### Task 8: Mobil okul ayarlarında moderasyon kartı

**Files:**
- Modify: `apps/mobile/src/features/school-settings/components/notification-settings-screen.tsx`

**Interfaces:**
- Consumes: Task 7'nin kullandığı aynı iki hook ve `ANNOUNCEMENT_MODERATION_CONFIG`.
- Produces: yok.

- [ ] **Step 1: Kartı ekle**

`NotificationSettingsScreen` içinde, "Sessiz saatler" kartının altına aynı ilkeleri izleyen bir kart ekleyin:

```tsx
      {moderationQuery.isError ? (
        <Card>
          <SectionTitle icon="mega" label="Duyuru Moderasyonu" />
          <Note icon="info">Bu ayarı görüntülemek için duyuru moderasyon yetkisi gerekir.</Note>
        </Card>
      ) : (
        <Card>
          <SectionTitle icon="mega" label="Duyuru Moderasyonu" />
          {(['open', 'thresholded'] as const).map((key) => (
            <ToggleRow
              key={key}
              title={ANNOUNCEMENT_MODERATION_CONFIG[key].label}
              description={ANNOUNCEMENT_MODERATION_CONFIG[key].description}
              on={(moderationQuery.data ?? 'open') === key}
              onToggle={() => update.mutate(key)}
            />
          ))}
          <Note icon="info">Aynı ayar Duyurular ekranının Moderasyon sekmesinde de bulunur.</Note>
        </Card>
      )}
```

> **DÜZELTME (2026-08-09, C4 kapanışı) — ölçüldü, bu cümle MOBİLDE YANLIŞ.**
> Plan kartın altına *"Aynı ayar Duyurular ekranının Moderasyon sekmesinde de bulunur."*
> yazdırıyordu. **Nasıl ölçüldü:** `apps/mobile/.../admin-announcements-screen.tsx` içindeki
> `CHIPS` dizisi SAYILDI — **altı** çip var (`Tümü`, `Yayında`, `Zamanlanmış`, `Onayda`,
> `Taslak`, `Arşiv`) ve aralarında **Moderasyon YOK**. O sekme yalnız web'de vardır
> (`moderation-tab.tsx`). Cümle mobilde kullanıcıya var olmayan bir yere gitmesini
> söylüyordu — bu fazın imza hatasının tam sınıfı: spec'ten plana, plandan ekran metnine
> geçmiş, hiçbir yerde ölçülmemiş bir iddia.
>
> Cümle ölçülen gerçeğe göre yeniden yazıldı ve **görünür bir `Note` şeridine** kondu
> (web'deki karşılığı `ATip` tooltip'idir; mobilde hover olmadığı için o metin zaten
> hiç görünmezdi).

> İki satır **tek seçimlidir** (radyo davranışı): seçili olana dokunmak bir şey değiştirmez, diğerine dokunmak modu değiştirir. `ToggleRow` bunu doğal olarak yapar çünkü `on` her zaman sunucudan gelen değerden okunur.

> **DÜZELTME (2026-08-09, C4 kapanışı) — ölçüldü, cümle ÜÇ YÜZEYDE DE YANLIŞTI.**
> *"Seçili olana dokunmak bir şey değiştirmez"* bir **dilek** olarak yazılmıştı, ölçüm
> olarak değil. Üç yüzeyin üçünde de `onChange`/`onToggle` **koşulsuz** çalışıyordu:
> mobil ayarlar kartı, web `ASeg` (`parts.tsx`) ve web `announcements-page.tsx`.
> Görünürde hiçbir şey değişmezken uca PUT gidiyor ve başarı kolu
> `qk.announcements.all()` **kök** anahtarını invalide ediyordu — yani seçili moda
> dokunmak bütün duyuru sorgularını yeniden çektiriyordu.
>
> **İnsan kararı (2026-08-06, bağlayıcı):** seçili satıra dokunmak hiçbir şey yapmaz;
> koruma eklenir ve **web tarafı da ölçülüp eşitlenir**.
>
> **Sevk edilen çözüm merkezîdir, ekran bazlı değil:** karar `packages/core`'a
> `shouldSaveModerationChange(next, current)` olarak taşındı ve testlendi (tanım kümesi
> 2×2 = 4 girdi, iki test dördünü de sayıyor; gözden geçirici kendi mutasyonunu koştu,
> 2 test öldü). Üç yazma yüzeyi de aynı yüklemi okur; `moderation-tab.tsx`'in `disabled`
> prop'u da aynı yüklemden beslenir — görsel affordance ile gerçek karar ayrışamaz.
>
> **Merkezileştirme ÜÇÜNCÜ bir gerçek hata buldu:** `announcements-page.tsx`'in
> `onChange`'i de koşulsuz `mutate` çağırıyordu ve oradaki `disabled` yalnız görseldi,
> kararı korumuyordu. Ekran bazlı bir düzeltme yapılsaydı bu yüzey **sessizce bozuk**
> kalacaktı — CLAUDE.md'nin "yamalama kabul değil" kuralının ölçülmüş bir örneği.

- [ ] **Step 2: Doğrula ve commit**

```bash
npm run typecheck --workspace=@workspace/mobile && npm run lint --workspace=@workspace/mobile
git add apps/mobile/src/features/school-settings
git commit -m "feat(settings): mobil bildirim ayarlarina duyuru moderasyon karti eklendi"
```

---

## Kapanış doğrulaması

```bash
cd /Users/farukkaya/Repositories/oksis-ui
npm run test --workspace=@workspace/core
npm run typecheck && npm run lint
```

Uçtan uca duman testi (gerçek backend):
1. Yönetici duyuru yayınlar → veli mobilde bildirim alır → dokununca **okuma** ekranı açılır.
2. Yönetici aynı bildirimi web zilinden açar → `/announcements/{id}` detayı gelir.
3. Duyuru geri çekilir → Arşiv sekmesinde "Geri al" ile iptal edilir → bildirim dönülen statüyü doğru söyler.
4. Ayarlar › Bildirimler'den mod değiştirilir → Duyurular › Moderasyon aynı değeri gösterir.

Sonra `oksis` deposunda spec §14 tablosunda üç satır **Yapıldı** olarak işaretlenir: `restore` bağlanması · Moderasyon ↔ Ayarlar bağı · Veli/öğrenci detay derin bağlantısı. §8.4'e düzeltme notu düşülür:

> **DÜZELTME (2026-08-05).** `oksis://parent|student/announcements/:id` biçimi **yazılmadı**. Backend bildirime tek ve rolden bağımsız bir yol yazar (`/announcements/{id}`) ve `INotificationEnqueuer.Enqueue` alıcı başına farklı bağlantı taşımadığı için rol ayrımı sunucuda üretilemez. Ayrım istemciye alındı: `resolveNotificationTarget` (packages/core) rolü okuyup okuyucu/yönetim yüzeyini seçer. Web'de `/announcements/[id]` rotası C4'te açıldı.

---

## Kapanış — ne yapıldı (2026-08-09)

Dal `feature/announcements-c4`, HEAD `1fae5f2`; sekiz görev + bütün-dal gözden geçirmesi +
tek düzeltme dalgası tamam, dal birleştirmeye hazır (dal **birleştirilmedi**, karar insanda).

**Yukarıdaki §8.4 notu yazılmadan ÖNCE yeniden ölçüldü** (kapanış belgeleri de §16'ya
tabidir; bu fazın imza hatası tam olarak belgelerde doğdu):

| İddia | Nasıl ölçüldü | Sonuç |
|---|---|---|
| `oksis://…` biçimi yazılmadı | `oksis-api` `src/` altında `grep -rn "oksis://" --include="*.cs"` | **0 eşleşme** — doğru |
| Backend tek ve rolden bağımsız yol yazar | `INotificationEnqueuer.Enqueue` imzası okundu: tek `string? deepLink`, tek `IReadOnlyList<Guid> recipientAccountIds` | Alıcı başına farklı bağlantı **taşınamaz** — doğru |
| `resolveNotificationTarget` rolü okuyup yüzey seçer | `packages/core/src/notifications/logic.ts` okundu: imza `(deepLink, role: RoleKey \| undefined)`; `if (!role) return null`; detay kolu `announcementRoleSurface(role) === "inbox" ? "reader" : "manager"` | Doğru — üstelik **rol çözülmemişse hedef üretmiyor** |
| Web'de `/announcements/[id]` rotası açıldı | `apps/web/app/(dashboard)/announcements/` altında `page.tsx` dosyaları listelendi: `page.tsx`, `[id]/page.tsx`, `approvals/page.tsx` | Doğru — **üç** rota |

Not eklendiği hâliyle geçerlidir; §14'ün üç satırı (`restore` bağlanması · Moderasyon ↔
Ayarlar bağı · Veli/öğrenci detay derin bağlantısı) **Yapıldı** olarak işaretlendi.

C4 boyunca ölçümde çürüyen dört gerekçe ve planın bir eksiği bu dosyada, cümlelerin
yaşadığı yerlere **DÜZELTME** notu olarak işlendi; ölçülerek bulunan ve kapsam dışı
bırakılan işler spec §17'nin **C4 tablosuna** (C4-1…C4-20), karar bekleyen iki madde ise
aynı bölümün **açık ürün kararları** listesine yazıldı.
