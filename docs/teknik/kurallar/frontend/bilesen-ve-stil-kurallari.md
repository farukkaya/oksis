# Bileşen ve Stil Kuralları (Web)

> [!info] Belge bilgisi
> **Amaç:** Web panelinde arayüzün nasıl portlandığını ve stillendirildiğini, marka token'larının, ortak bileşenlerin ve durum yüzeylerinin kurallarını tanımlamak. Mobil karşılığı: [[mobil]].
> **Son doğrulama:** 2026-09-13. `oksis-ui` master `ec9ea8c`.
> **Kaynak:** `apps/web/CLAUDE.md` (UI System, Brand — Typography, Brand — Radius, Layout shell, globals.css guardrails), `oksis-ui/CLAUDE.md` (SOLID, Handoff intake, Domain Decisions), `apps/web/app/layout.tsx`, `packages/ui/src/{components,styles}`, `apps/web/components/`.

İlgili notlar: [[mimari-ve-katmanlar]] · [[adlandirma]]

---

## 1. Arayüz sistemi: CSS-port kalıbı

2026-07-11'deki sıfırlamayla shadcn/Mira düzeni kaldırıldı. Yerleşik kalıp, tasarım tesliminin CSS'inin portlanmasıdır.

1. Ekran, Claude Design prototipinin CSS sınıflarıyla portlanır:
   - Stiller `packages/ui/src/styles/<feature>.css` dosyasına yazılır ve `globals.css`'ten import edilir.
   - İşaretleme feature'ın TSX dosyasında **aynı sınıf adlarıyla** yazılır.
2. **Yeni shadcn primitive'i CLI ile üretilmez.**
3. `screens.css` içinde daha önce portlanmış bir blok **yeniden tanımlanmaz**. Feature CSS'i yalnız şunları ekler:
   - kapsamlı CSS değişkeni geçersiz kılmaları (örnek `.att-page { --success: … }`),
   - gerçekten yeni sınıflar.

   Emsal: `attendance.css` ve `dashboard.css` başlık notları.
4. **Bilinen sapma:** `shell.css` içindeki global `--success`, `--warning`, `--danger` değerleri markadan sapmıştır (portal renkleri taşıyor). Kök düzeltme yapılana kadar feature'lar kapsamlı geçersiz kılma ile marka değerlerini kullanır: `#16A34A`, `#D97706`, `#DC2626`.
5. Statü ve enum görselleri `Record<Status, Config>` map'iyle çizilir. Config'ler `@workspace/core` içindedir (örnek `ATTENDANCE_STATUS_CONFIG`). `if` zinciri yasaktır.
6. **İzinli statü rengi `#0369A1`** (2026-07-21, onaylı sapma). Tek tanım yeri üçtür: core `ATTENDANCE_STATUS_CONFIG`, web `--st-izinli`, mobil `STATUS_TINTS.izinli`. Ham hex başka hiçbir yere yazılmaz.

## 2. Marka kaynağı

- Marka profili: `https://brand.oksis.net/brand/index.html` (renk, tip ölçeği, radius, logo).
- Tasarım teslimindeki her renk, font ve radius bir marka token'ına ya da mevcut semantik token'a (`bg-primary`, `text-h3`, `rounded-lg`) eşlenmelidir. Eşlenmeyen değer "yakın" diye tutulmaz, ihlal olarak raporlanır.
- Token listesi `handoff-web` skill'inin `oksis-brand-tokens.md` dosyasındadır (taşıma sonrası `frontend/tasarim-sistemi/`).

## 3. Tipografi

- Fontlar yalnız `app/layout.tsx` içinde `next/font` ile bağlanır. Başka yerde yeniden import edilmez.
- Gövde ve arayüz metni: **Plus Jakarta Sans** (`--font-sans`), alt kümeler `latin` ve `latin-ext` (Türkçe karakterler için).
- **JetBrains Mono** (`--font-mono`) **yalnız sayısal ve teknik veride** kullanılır: kimlikler, okul kodu, T.C. no, saatler, haftalık saat sütunları. Düz metinde kullanılmaz.
- Yeni yazılan arayüzde başlık ve gövde için tip ölçeği sınıfları kullanılır. `text-4xl font-bold` gibi serbest kombinasyonlar yasaktır, çünkü her teslim kendi ölçeğini icat eder.

| Sınıf | Boyut/satır | Ağırlık · aralık |
|---|---|---|
| `text-display` | 56/64 | 800 · -3.5% |
| `text-h2` | 38/44 | 700 · -2.5% |
| `text-h3` | 24/28 | 600 · -1.5% |
| `text-body` | 17/26 | 400 |
| `text-label` | 12/18 | 500 · +8% · büyük harf |

- **İstisna:** Portlanan prototip CSS'i kendi px değerleriyle gelir. Bu yerleşik bir emsaldir (duty, schedule, attendance portları).

## 4. Radius ve `globals.css` korkulukları

- `:root` içinde **tek bir** `--radius: 1rem` tanımı olur. Preset ikinci bir tanım (`0.875rem`) getirmişti; yeniden görünürse silinir.
- Kartlar ve paneller: küçükler `rounded-lg` (16px), büyük yüzeyler `rounded-xl` (20px). Pill ve rozetler `rounded-full`.
- `@theme inline` iki fontu da köprülemelidir: `--font-sans: var(--font-sans);` ve `--font-mono: var(--font-mono);`.
- `<html lang="tr">` kullanılır. Türkçe büyük/küçük harf dönüşümü ve erişilebilirlik için gereklidir.

## 5. Ortak bileşenler

- `packages/ui/src/components/`: `anchored-menu`, `avatar`, `badge`, `button`, `card`, `icon`, `logo-mark`.
- `apps/web/components/shared/`: `filter-dropdown`, `forbidden-screen`, `kpi-card`, `page-header`, `pager`, `planned-screen`, `select-checkbox`, `sortable-th`, `toast`, `toast-host`.
- Kabuk: `components/app-shell.tsx`, `route-guard.tsx`, `season-context-picker.tsx`, `role-favicon.tsx`, `theme-provider.tsx` (next-themes).
- **Yeni bir ortak bileşen yazmadan önce bileşen envanteri kontrol edilir.** Envanter: [[_envanter]] (`docs/frontend/bilesenler/_envanter.md`). Eşleşme yoksa **dur ve onay al.**
- Sarmalayıcı bileşenler yerel prop'ları yutmaz: `...props` aktarılır, `disabled`, `type` ve `aria-*` korunur.
- Feature'lar arası bir parça gerekiyorsa kopyalanmaz. Sahibi olan feature'ın `index.ts`'inden dışa açılır. Emsal: `features/attendance/index.ts` içindeki `AttendanceStatusChip`, `EventWizard`.

## 6. Tablolar

- Tablolar portlanan prototip tablo sınıflarıyla yazılır (örnek `attm-tbl`).
- TanStack Table ve ayrı bir `DataTable` sarmalayıcısı **yoktur**.
- Sayfalama için `shared/pager.tsx`, sıralanabilir başlık için `shared/sortable-th.tsx` kullanılır.

## 7. Durum yüzeyleri

| Durum | Kural |
|---|---|
| Yükleniyor | İskelet (skeleton) gösterilir. Ekranlar kendi iskeletini çizer. Mock kipinde bile arayüz beklemez, ağ bekler. |
| Rol henüz çözülmedi | `RouteGuard` iskelet gösterir, yanlış ekranı çizmez |
| Yetkisiz | `ForbiddenScreen` |
| Henüz yapılmamış modül | `PlannedScreen` |
| Hata | Gerekçe hatanın kendisinden gelir (`apiErrorDesc` / `mutationErrorDesc`). Ağ suçlayan sabit metin yasaktır (ESLint `X-08`). |
| Sahipsiz mutasyon hatası | `ToastHost` üzerinden global toast (X-13) |

- Ekranların `states` matrisi (loading/empty/error/readonly) hook'ların gerçek durumundan okunur, yerel bir mock bayrağından okunmaz.

## 8. Metin ve dil

- **Arayüz metinleri Türkçedir ve doğrudan yazılır.** i18n kütüphanesi yoktur.
- Kod yorumları Türkçedir. Tanım noktalarına yazılır (arayüz, şema, bariz olmayan iş kuralı); kendini açıklayan koda yorum yazılmaz.
- Tanımlayıcılar İngilizcedir (bkz. [[adlandirma]]).

## 9. Eski belgelerden alınmayanlar

| Eski iddia | Bugünkü gerçek |
|---|---|
| shadcn/ui primitive seti (Button/Modal/Tabs API tanımları), `DataTable` sarmalayıcısı, Excel/PDF dışa aktarım bileşenleri | CSS-port kalıbı. shadcn CLI kullanılmıyor. |
| "Hardcoded Türkçe string yasak, i18n key kullan" | i18n yok, metinler doğrudan Türkçe |
| Eski marka paleti örneği, portal başına renk özelleştirmesi | Marka kaynağı `brand.oksis.net`. Sapma notu §1.4. |
| `data-testid` zorunluluğu | Kodda kullanılmıyor |
| Inline `style={{}}` yasağı, 300 satır sınırı | Web için kodla doğrulanmadı. Kural olarak alınmadı. |
