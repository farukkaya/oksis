# Tasarım — FE `skipInvalidate` Tam Temizliği

**Tarih:** 2026-06-26
**Durum:** Tasarım onaylandı (kullanıcı), uygulama planı bekleniyor
**Kapsam:** `oksis-web` — `/admin/settings` Genel Bilgiler sekmesi + school-settings mutation hook'ları
**Karar:** Tam sadeleştirme — `skipInvalidate` plumbing'i tümüyle kaldırılır; her mutation kendi başarısında invalidate eder.

---

## 1. Arka plan / gereklilik

`skipInvalidate`, A1.2/A1.3'te **backend invalidate-before-commit yarışına karşı bir FE yara bandı** olarak eklenmişti: Genel Bilgiler sekmesi "Kaydet"te 3-4 paralel PUT atıyor; her PUT kendi `onSuccess`'inde invalidate edince 3-4 eşzamanlı refetch backend'in kırık commit penceresine giriyor ve bayat cache yazılabiliyordu. Geçici çözüm: her mutation `skipInvalidate: true` ile per-mutation invalidate'i atlar, GeneralTab tüm PUT'lar `allSettled` ile bitince **tek** invalidate eder.

Backend kök sebep **option C ile kapandı** (2026-06-26, `fix/post-commit-cache-invalidation`): cache invalidation artık commit sonrası yapılıyor; paralel refetch'ler o pencerede bile bayat değer yazamaz. Dolayısıyla `skipInvalidate` artık **doğruluk için gereksiz** — yalnızca yanıltıcı bir plumbing olarak duruyor.

Bu bir **bug fix değil, teknik borç temizliği**: çalışan bir hata yok; amaç, gerçeği yansıtmayan yara bandını kaldırıp kodu sadeleştirmek (ileride "bu bayrak neden var?" tereddüdünü önlemek).

## 2. Değişiklikler

### 2.1 `src/portals/admin/settings/api/school-settings.mutations.ts`
Dört hook: `useUpdateBasicInfo`, `useUpdateContactInfo`, `useUpdateAddress`, `useUpdateSchoolAuthority`. Her birinde:
- `options` tipinden `skipInvalidate?: boolean` çıkar.
- `const skipInvalidate = options?.skipInvalidate ?? false;` satırını sil.
- `if (!skipInvalidate) qc.invalidateQueries({ queryKey: schoolSettingsKeys.all() });` → koşulsuz `qc.invalidateQueries({ queryKey: schoolSettingsKeys.all() });`.
- Yanıltıcı A1.2/A1.3 yorumunu (yalnız `useUpdateBasicInfo` üstünde, 89-91) sadeleştir: "Başarıda school-settings cache invalidate edilir."
- `silent` opsiyonu AYNEN kalır (toast birleştirme; invalidate'le ilgisiz).

### 2.2 `src/portals/admin/settings/tabs/GeneralTab.tsx`
- 4 hook çağrısından `skipInvalidate: true` çıkar, `silent: true` kalır (217-220).
- handleSave'deki elle tek-invalidate bloğunu sil (330-335):
  ```ts
  if (mutations.length > 0) {
    await qc.invalidateQueries({ queryKey: schoolSettingsKeys.all() });
  }
  ```
  `form.reset(submitted)` + `notify(...)` KALIR.
- Artık kullanımsız kalan `const qc = useQueryClient();` (216) ve `qc` deps girdisini (348) kaldır; `useQueryClient` + `schoolSettingsKeys` importları başka yerde kullanılmıyorsa kaldır (build/lint doğrular).
- Yorumu (213-215) sadeleştir (skipInvalidate gerekçesini çıkar).
- **DOKUNULMAZ:** stabil `mutateAsync` çıkarma + deps deseni (222-229, 351-354) — B0.1 sonsuz-render fix'i. `isSaving`, dirty-bölüm PUT mantığı (B2.3), logo akışı, cascade select aynen kalır.

## 3. Değişiklik sonrası davranış (beklenti)
- Kaydet → dirty bölümler paralel PUT → her biri kendi `onSuccess`'inde `school-settings` invalidate eder. React Query aynı anahtara gelen eşzamanlı invalidate'leri dedupe ettiğinden pratikte ~1-2 refetch olur.
- `Promise.allSettled` sonrası: hata yoksa `form.reset(submitted)` + tek `notify('Genel bilgiler kaydedildi')`; hata varsa tek hata `notify`.
- Kullanıcı için davranış aynı: değer kalıcı, topbar/ekran (AdminLayout `useSchoolSettings`) canlı güncellenir. Backend artık bayat değer yazmaz.

## 4. Test
- `src/portals/admin/settings/api/__tests__/school-settings.mutations.test.ts`: 1 birim test ekle — `useUpdateBasicInfo` başarıda `schoolSettingsKeys.all()` invalidate eder (koşulsuz davranışı kilitler; mevcut diğer hook invalidation testleriyle aynı desen).
- Mevcut `school-settings.mutations.test.ts` + `SchoolSettingsPage.test.tsx` yeşil kalmalı (mock'lar `skipInvalidate` argümanına bakmıyor).
- Chrome DevTools E2E: Genel Bilgiler'de bir alanı değiştir → Kaydet → değer kalıcı (reload sonrası da) + topbar canlı + konsol temiz (sonsuz render YOK).

## 5. Kapsam dışı
- Diğer sekmeler (Structure/Policies/BellSchedule/Holidays) — `skipInvalidate` zaten yok.
- Logo akışı, backend, FE'nin başka bölümleri.
- `mutateAsync` stabilite deseni (korunur, değiştirilmez).
