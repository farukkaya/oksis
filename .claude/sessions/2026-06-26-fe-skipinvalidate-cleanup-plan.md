# FE skipInvalidate Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Backend kök sebebi (option C) kapandığı için artık gereksiz olan FE `skipInvalidate` yara bandını Genel Bilgiler sekmesi + school-settings mutation hook'larından tümüyle kaldırmak.

**Architecture:** GeneralTab `skipInvalidate: true` geçmeyi bırakır + elle tek-invalidate bloğunu siler (her mutation kendi onSuccess'inde invalidate eder; React Query eşzamanlıları dedupe eder). Ardından 4 hook'tan ölü `skipInvalidate` plumbing'i kaldırılır (koşulsuz invalidate). Stabil `mutateAsync` deseni (B0.1 render-loop fix) korunur.

**Tech Stack:** React 18 + TS strict · TanStack React Query v5 · vitest + Testing Library + MSW · Chrome DevTools E2E.

## Global Constraints
- Commit formatı (OKSİS): `YYYY-MM-DD <type>[,type]: Türkçe özet.`
- **OTOMATİK COMMIT YOK** — her görev sonunda DUR; kullanıcı inceleyip commit'ler (`feedback_no_autocommit_fixes`).
- Web kuralları: named export (default export YASAK), `any` YASAK, inline style YASAK, server state yalnız React Query.
- **DOKUNMA:** GeneralTab'daki stabil `mutateAsync` çıkarma + deps deseni (sonsuz-render fix B0.1). Mutation NESNESİNİ deps'e koyma.
- Davranış kullanıcı için değişmez: kaydet → değer kalıcı + topbar canlı.

---

### Task 1: GeneralTab — skipInvalidate kullanımı + elle invalidate kaldır

GeneralTab `skipInvalidate: true` geçmeyi bırakır (hook'lar default'ta zaten invalidate eder) ve `allSettled` sonrası elle invalidate bloğunu siler. Kullanımsız kalan `qc` + importlar temizlenir. Bu adımdan sonra runtime davranışı zaten hedeflenen "per-mutation invalidate" olur; hook tipleri Task 2'de sadeleşir.

**Files:**
- Modify: `oksis-web/src/portals/admin/settings/tabs/GeneralTab.tsx` (217-220, 211-216, 330-335, 345-356)

**Interfaces:**
- Consumes: `useUpdateBasicInfo/ContactInfo/Address/SchoolAuthority({ silent: true })` (hook'lar bu adımda hâlâ `skipInvalidate` opsiyonunu KABUL eder ama GeneralTab artık geçmez → default `skipInvalidate=false` → invalidate eder).

- [ ] **Step 1: skipInvalidate argümanlarını kaldır + yorumu sadeleştir**

`GeneralTab.tsx` 211-220 arası şu hale gelsin (yalnız `skipInvalidate: true` çıkar, `silent: true` kalır; yorum sadeleşir):

```tsx
  // silent: true — mutations do NOT fire their own toasts; this component
  // aggregates all results via Promise.allSettled and fires exactly one notify().
  const basicMutation = useUpdateBasicInfo({ silent: true });
  const contactMutation = useUpdateContactInfo({ silent: true });
  const addressMutation = useUpdateAddress({ silent: true });
  const authorityMutation = useUpdateSchoolAuthority({ silent: true });
```

(216'daki `const qc = useQueryClient();` satırını ŞİMDİLİK bırak — Step 2'de kaldıracağız; önce kullanımını silmeliyiz.)

- [ ] **Step 2: handleSave'deki elle invalidate bloğunu sil**

`GeneralTab.tsx` içinde, başarı dalı (329-337 civarı) şu hale gelsin — `if (mutations.length > 0) { await qc.invalidateQueries(...) }` bloğu KALDIRILIR, `form.reset` + `notify` KALIR:

```tsx
      const results = await Promise.allSettled(mutations);
      const firstRejected = results.find((r) => r.status === 'rejected');
      if (!firstRejected) {
        // Her mutation kendi onSuccess'inde school-settings'i invalidate eder
        // (React Query eşzamanlıları dedupe eder); backend yarışı option C ile kapandı.
        form.reset(submitted);
        notify('Genel bilgiler kaydedildi', 'check');
      } else {
        const reason = (firstRejected as PromiseRejectedResult).reason as unknown;
        const msg =
          reason instanceof Error ? reason.message : 'Kaydetme sırasında bir hata oluştu';
        notify(msg, 'alert-triangle');
      }
```

- [ ] **Step 3: Kullanımsız kalan qc + importları kaldır + deps güncelle**

- `const qc = useQueryClient();` satırını (216) sil.
- handleSave deps dizisinden (345-356) `qc` girdisini çıkar.
- Dosya başındaki importlardan `useQueryClient` (genelde `@tanstack/react-query`'den) ve `schoolSettingsKeys` (`../api/school-settings.keys`) artık kullanılmıyorsa kaldır. **Önce grep ile başka kullanım olmadığını doğrula:**
  Run: `cd oksis-web && grep -nE "qc\b|useQueryClient|schoolSettingsKeys" src/portals/admin/settings/tabs/GeneralTab.tsx`
  Yalnızca import satırlarında kalıyorsa importları sil. Başka kullanım varsa o importu BIRAKMA, raporla.

- [ ] **Step 4: Tip + lint + mevcut testler yeşil**

Run: `cd oksis-web && npx tsc --noEmit`
Expected: 0 hata (özellikle "unused 'qc'/'schoolSettingsKeys'" veya `skipInvalidate` ile ilgili hata YOK).
Run: `npm run test -- school-settings` 2>&1
Expected: mevcut `SchoolSettingsPage.test.tsx` + `school-settings.mutations.test.ts` PASS (mock'lar argümana bakmıyor).

- [ ] **Step 5: DUR — kullanıcı inceler ve commit'ler (otomatik commit YOK)**
Önerilen mesaj: `2026-06-26 refactor: GeneralTab skipInvalidate yara bandı kaldırıldı; her mutation kendi invalidate'ini yapar (option C sonrası).`

---

### Task 2: mutation hook'larından skipInvalidate plumbing'i kaldır + test

4 hook'tan ölü `skipInvalidate` opsiyonunu/koşulunu kaldır (koşulsuz invalidate) ve `useUpdateBasicInfo` için invalidation'ı kilitleyen birim test ekle.

**Files:**
- Modify: `oksis-web/src/portals/admin/settings/api/school-settings.mutations.ts` (80-176, 4 hook)
- Test: `oksis-web/src/portals/admin/settings/api/__tests__/school-settings.mutations.test.ts` (yeni test bloğu)

**Interfaces:**
- Produces: `useUpdateBasicInfo/ContactInfo/Address/SchoolAuthority(options?: { silent?: boolean })` — `skipInvalidate` artık YOK; başarıda her zaman `schoolSettingsKeys.all()` invalidate eder.

- [ ] **Step 1: Önce başarısız test yaz (useUpdateBasicInfo invalidation)**

`school-settings.mutations.test.ts` importuna `useUpdateBasicInfo` ekle:
```ts
import {
  useBulkCreateBellSchedule,
  useUpdateAcademicPolicy,
  useUpdateBasicInfo,
  useUpdateGradeLevels,
  useUpdateGradeLevelScales,
} from '../school-settings.mutations';
```
Dosya sonuna yeni describe ekle:
```ts
describe('useUpdateBasicInfo', () => {
  it('onSuccess_invalidates_school_settings_all_unconditionally', async () => {
    server.use(
      http.put(`${BASE}/school-settings/basic-info`, () => new HttpResponse(null, { status: 204 }))
    );
    const { invalidateSpy, wrapper } = setup();
    const { result } = renderHook(() => useUpdateBasicInfo({ silent: true }), { wrapper });

    result.current.mutate({
      name: 'X',
      code: 'X',
      officialName: null,
      mebCode: null,
      displayName: null,
      ownershipType: null,
      foundingYear: null,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      ([arg]) => (arg as { queryKey: readonly unknown[] }).queryKey
    );
    expect(invalidatedKeys).toContainEqual(schoolSettingsKeys.all());
  });
});
```
> `BasicInfoDto` alanları mevcut tipe göre; derleyici eksik alan derse `BasicInfoDto` tanımına bakıp tamamla. `silent: true` toast'ı bastırır, invalidation'ı etkilemez.

- [ ] **Step 2: Testi çalıştır — şu an da GEÇER (mevcut davranış zaten invalidate ediyor); regresyon kilidi olarak ekleniyor**

Run: `cd oksis-web && npm run test -- school-settings.mutations`
Expected: PASS. (Bu test mevcut koşullu kodda da geçer çünkü `skipInvalidate` default false; amaç Task 2 refactor'ünden sonra koşulsuz davranışı kilitlemek.)

- [ ] **Step 3: 4 hook'tan skipInvalidate plumbing'i kaldır**

`school-settings.mutations.ts` — `useUpdateBasicInfo` (80-99) şu hale gelsin (yorum sadeleşir, koşul kalkar):
```ts
export function useUpdateBasicInfo(options?: { silent?: boolean }) {
  const qc = useQueryClient();
  const { t } = useTranslation('school-settings');
  const silent = options?.silent ?? false;
  return useMutation({
    mutationFn: (input: BasicInfoDto) =>
      sendVoid('put', '/school-settings/basic-info', input),
    onSuccess: () => {
      // Başarıda tüm school-settings cache'i invalidate edilir.
      qc.invalidateQueries({ queryKey: schoolSettingsKeys.all() });
      if (!silent) toast.success(t('basic-info.save-success'));
    },
    onError: (err) => {
      if (!silent) toast.error(translateApiError(t, err));
    },
  });
}
```
Aynı dönüşümü `useUpdateContactInfo` (109-125), `useUpdateAddress` (135-151), `useUpdateSchoolAuthority` (160-176) için uygula:
- `options?: { silent?: boolean; skipInvalidate?: boolean }` → `options?: { silent?: boolean }`
- `const skipInvalidate = options?.skipInvalidate ?? false;` satırını sil
- `if (!skipInvalidate) qc.invalidateQueries({ queryKey: schoolSettingsKeys.all() });` → `qc.invalidateQueries({ queryKey: schoolSettingsKeys.all() });`
- (toast/`silent`/onError satırları aynen kalır)

- [ ] **Step 4: Tip + test yeşil**

Run: `cd oksis-web && npx tsc --noEmit`
Expected: 0 hata.
Run: `npm run test -- school-settings`
Expected: yeni test + mevcut mutations/SchoolSettingsPage testleri PASS.

- [ ] **Step 5: DUR — kullanıcı inceler ve commit'ler (otomatik commit YOK)**
Önerilen mesaj: `2026-06-26 refactor,test: school-settings update hook'larından ölü skipInvalidate kaldırıldı (koşulsuz invalidate) + BasicInfo invalidation testi.`

---

### Task 3: Doğrulama (build + E2E)

**Files:** (yok — doğrulama)

- [ ] **Step 1: Tam build + tüm test**

Run: `cd oksis-web && npm run build`
Expected: başarılı (tsc + vite, 0 hata).
Run: `npm run test`
Expected: tüm vitest paketi PASS (en azından yeni/etkilenen testler; pre-existing fail varsa not et).

- [ ] **Step 2: E2E (Chrome DevTools) — controller/kullanıcı yapar**

Dev server açık (`npm run dev`), `/admin/settings` Genel Bilgiler:
- Bir alanı değiştir (örn. Görünen Ad) → Kaydet → tek "Genel bilgiler kaydedildi" bildirimi.
- Değer kalıcı (reload sonrası da) + topbar/sidebar okul adı canlı güncellenir.
- Konsol temiz: sonsuz render YOK, network'te school-settings refetch beklenen sayıda (1-2).

- [ ] **Step 3: DUR — son inceleme + commit (gerekirse Task 1/2 commit'leri birleştirilebilir)**

---

## Self-Review Notları
- **Spec coverage:** §2.1 (hook'lar) → Task 2; §2.2 (GeneralTab) → Task 1; §3 (davranış) → Task 1+3 E2E; §4 (test) → Task 2 birim + Task 1/3 mevcut testler + E2E. §2.2 "DOKUNULMAZ mutateAsync" → Global Constraints + Task 1 hiç o satırlara dokunmaz.
- **Build-green sırası:** Task 1 önce (GeneralTab `skipInvalidate` geçmeyi bırakır; hook'lar opsiyonu hâlâ kabul ettiği için tip hatası yok). Task 2 ölü opsiyonu kaldırır (artık geçen yok). Her iki sırada da ara durum derlenir.
- **Placeholder yok**, tip tutarlı (`options?: { silent?: boolean }`, `schoolSettingsKeys.all()`).
- **Açık uç:** `BasicInfoDto` alan adları — test yazımında tipten teyit edilecek.
