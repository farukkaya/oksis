# OKSİS — UI / UX Rules

> OKSİS'in tasarım dili: **clean, professional, calm**. "Demo'da etkileyici, günlük kullanımda yormayan." Özel okul = profesyonel görünüm + öğretmen pratikliği + veli güveni.

---

## 1. Tasarım Prensipleri

1. **Hızdan ödün vermeyin** — özellikle Teacher portal: yoklama 3 tıklama.
2. **Bilgi yoğunluğu kontrollü** — Parent dashboard'da "bir bakışta her şey."
3. **Hata önle, hata afet etme** — onay diyalogları, undo opsiyonları.
4. **Tutarlılık > yenilik** — aynı action her yerde aynı görünüm.
5. **Mobile-first** — Teacher yoklama, Parent günlük takip mobil yoğun.
6. **Boş ekran yok** — empty state, loading, error mutlaka tasarlı.

---

## 2. Renk Sistemi

> Tailwind `tailwind.config.ts`'de extend edilir. Hex değerler design token olarak referans.

### 2.1 Brand Palette (örnek; final marka kararıyla değişebilir)

```ts
// tailwind.config.ts (özet)
colors: {
  brand: {
    50:  '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',   // primary
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a',
  },
  neutral: { /* slate scale */ },
  success: { 500: '#10b981', 700: '#047857' },
  warning: { 500: '#f59e0b', 700: '#b45309' },
  danger:  { 500: '#ef4444', 700: '#b91c1c' },
  info:    { 500: '#06b6d4' },
}
```

### 2.2 Semantik Kullanım

| Anlam | Renk |
|-------|------|
| Primary CTA, link, brand | `brand-600` |
| Success (kaydedildi, present) | `success-500/700` |
| Warning (uyarı, geç) | `warning-500/700` |
| Danger (sil, absent, hata) | `danger-500/700` |
| Info (bilgilendirme) | `info-500` |
| Yumuşak background | `neutral-50/100` |
| Border | `neutral-200` |
| Body text | `neutral-900` |
| Muted text | `neutral-500` |

### 2.3 Renk Kuralları

- Sadece tema renkleri (hex hardcode yasak). Tailwind class veya CSS variable.
- Yoklama: `success` (geldi), `danger` (gelmedi), `warning` (geç), `neutral` (mazeretli).
- Mark: aralıklara göre `success` (85+), `warning` (70-84), `danger` (<70). Eşikler değişebilir.
- Renkle birlikte **ikon/yazı** desteği (renk körlüğü için).

---

## 3. Typography

```ts
fontFamily: {
  sans: ['"Inter"', 'system-ui', 'sans-serif'],  // veya "Plus Jakarta Sans"
  mono: ['"JetBrains Mono"', 'monospace'],
}
```

| Element | Class |
|---------|-------|
| H1 (page title) | `text-2xl font-semibold` (24px) |
| H2 (section) | `text-xl font-semibold` (20px) |
| H3 (card title) | `text-lg font-medium` (18px) |
| Body | `text-sm` (14px) |
| Body large | `text-base` (16px) |
| Caption / meta | `text-xs text-neutral-500` (12px) |
| Button | `text-sm font-medium` |
| Data table (DataGrid) | `text-sm` |

- Türkçe karakter desteği için fonts subset'inde Latin Extended dahil.
- Line height: 1.5 body, 1.3 heading.

---

## 4. Spacing & Layout

- 4px grid; Tailwind default scale kullanılır (`p-2 = 8px`, `p-4 = 16px`).
- Standart paddings:
  - Card iç: `p-4` veya `p-6`
  - Page wrapper: `p-6 md:p-8`
  - Modal: `p-6`
  - Section gap: `gap-6`
  - Form field gap: `gap-4`
- **Maks. genişlik:** İçerik için `max-w-screen-2xl mx-auto` (admin sayfaları); form/detail için `max-w-3xl`.

### 4.1 Container

```tsx
<div className="mx-auto w-full max-w-screen-2xl px-4 md:px-6 lg:px-8">
  {children}
</div>
```

### 4.2 Grid

- 12 column grid (Tailwind `grid-cols-12`).
- Responsive breakpoint: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

---

## 5. Component Patterns

### 5.1 Page

```
┌─────────────────────────────────────┐
│ PageHeader (title + actions)         │
├─────────────────────────────────────┤
│ Toolbar / Filters (opsiyonel)        │
├─────────────────────────────────────┤
│ Content (DataGrid / Form / Cards)    │
└─────────────────────────────────────┘
```

```tsx
<Page>
  <PageHeader
    title="Öğrenciler"
    description="Tüm aktif öğrencilerin listesi"
    actions={<Button onClick={openCreate}>Yeni Öğrenci</Button>}
  />
  <Toolbar>{/* filter, search, export */}</Toolbar>
  <StudentDataGrid />
</Page>
```

### 5.2 Buttons

| Variant | Kullanım |
|---------|---------|
| `primary` (filled brand) | Tek ana CTA / submit |
| `secondary` (outlined) | İkincil aksiyon (Cancel, Geri) |
| `ghost` (transparent) | Toolbar, tablo satır içi (Edit, Sil) |
| `danger` | Geri alınamaz (Sil, Çıkış) |
| `link` | Inline link metni |

Boyutlar: `sm` (32px), `md` (40px), `lg` (48px). Mobile target **min 44px** (Apple HIG).

```tsx
<Button variant="primary" size="md" loading={isPending}>
  Kaydet
</Button>
```

Loading durumu: spinner + disable. Disable'da tooltip "Neden disable?" göstermek tercih edilir.

### 5.3 Form Inputs

- Label **üstte** (gerekiyorsa "*" zorunlu işareti).
- Helper text label altında.
- Error mesajı input altında `text-danger-700 text-xs`.
- Focus ring `ring-2 ring-brand-500`.
- Disabled `bg-neutral-100 text-neutral-500`.

```tsx
<Field label="Ad" required error={errors.firstName?.message}>
  <Input {...register("firstName")} placeholder="Ali" />
</Field>
```

### 5.4 Cards

- `rounded-xl bg-white shadow-sm border border-neutral-100 p-4`
- Hoverable kartlarda `hover:shadow-md transition-shadow`.
- Card içinde başlık `text-lg font-medium`, ayraç `border-b border-neutral-100 my-3`.

### 5.5 Modals

- Genişlik: `sm` (400), `md` (560), `lg` (720), `xl` (960).
- Header (title + close), Body (form/content), Footer (right-aligned actions).
- ESC ile kapanır; backdrop click ile kapanma **form içeriyorsa onay** sorar.
- Stack maksimum 2 modal (uyarı: 2'den fazla = UX kötü).

### 5.6 Toast / Notification

- Sağ üst köşe (desktop), üst orta (mobile).
- Süre: success 3s, info 4s, warning 5s, error 6s.
- En fazla **3** toast üst üste; sonrası queue.
- Aksiyon butonu opsiyonel (Geri Al, Görüntüle).

### 5.7 Empty State

- İkon + başlık + açıklama + opsiyonel CTA.

```tsx
<EmptyState
  icon={<UserPlus />}
  title="Henüz öğrenci eklenmedi"
  description="Yeni öğrenci ekleyerek başlayın."
  action={<Button onClick={openCreate}>Öğrenci Ekle</Button>}
/>
```

- "No data" ile yetinme; **bir sonraki aksiyonu** göster.

### 5.8 Loading State

- Skeleton (içerik vaadi varsa) > Spinner (kısa süreli).
- Skeleton renkleri `neutral-100/200`, shimmer animasyonu.
- "Yükleniyor..." text minimal; ana içerik yerinde skeleton.
- DataGrid yüklerken built-in loading panel.
- Async button: in-place spinner, layout shift yok.

### 5.9 Error State

- Page-level error → ErrorBoundary fallback.
- Section-level → "Yüklenemedi. Tekrar dene." card.
- Form submission error → toast + form inline error.

---

## 6. İkonografi

- **Lucide React** (clean line icons) tercih.
- Boyut: 16/20/24px. Tıklanır ikon en az 40x40 dokunma alanı.
- Renk: `currentColor` (Tailwind text color üzerinden).
- Anlam tutarlı: edit = pencil, delete = trash, view = eye, settings = gear.

---

## 7. Mobil & Responsive

### 7.1 Breakpoint Davranışı

| Breakpoint | Davranış |
|-----------|---------|
| < 640 (mobile) | Tek kolon, sidebar drawer, bottom navigation |
| 640-1024 (tablet) | 2 kolon, collapsible sidebar |
| > 1024 (desktop) | Sabit sidebar, multi-column |

### 7.2 Touch

- Min target: **44x44 px** (Apple), 48x48 (Material).
- Hover state'ler mobile'da disabled / dokunma feedback ile değiştirilir.
- Sticky bottom action bar (Teacher attendance "Kaydet" butonu).
- Pull-to-refresh React Native'de built-in; web'de **opsiyonel** (button tercih).

### 7.3 Klavye

- Form input'lar uygun `inputMode`/`type` (`numeric`, `email`, `tel`).
- Mobile keyboard input alanını kapatmasın → scroll-into-view.
- Submit "enter" ile çalışsın.

> Detay: `skills/frontend/mobile-responsive.skill`.

---

## 8. Mikro-etkileşim

- Transition'lar 150-250ms, `ease-out`.
- Hover state'leri var (`hover:bg-neutral-50`).
- Loading button: cursor changing, opacity, spinner.
- Animasyon **fonksiyonel**; süslemek için değil.
- Reduced motion: `@media (prefers-reduced-motion)` ile minimize.

---

## 9. Erişilebilirlik

- **WCAG 2.1 AA** hedef.
- Renk kontrast: text 4.5:1, large text 3:1.
- Keyboard nav: tüm interaktif elementler `Tab` ile erişilebilir, `Esc` ile modal kapanır.
- Focus visible (her zaman); outline kaldırılırsa custom ring.
- Alt text tüm semantik image'larda.
- ARIA: form `aria-invalid`, modal `aria-modal`, toast `role="status"`.
- Screen reader test: NVDA / VoiceOver smoke testi sprint başında.

---

## 10. Portal Özelleştirmeleri

### Admin Portal
- Bilgi yoğunluğu yüksek (DataGrid, dashboards).
- Tablo + filter + export odak.
- Brand renkleri standart.

### Teacher Portal
- "Aksiyon" odaklı; toolbar belirgin.
- Yoklama hızlı: tek tap statü değiştirme, sabit alt bar "Kaydet".
- Mobile-first.

### Parent Portal
- Sıcak, samimi.
- Çocuk seçici belirgin (1+ çocuk için).
- Bildirim ve takvim ön planda.
- Az teknik jargon.

### Student Portal
- Genç odaklı ama distraction'sız.
- Ödevler, notlar, takvim.

---

## 11. Boş / Hata / Loading Matrix

| Sayfa | Empty | Loading | Error |
|-------|-------|---------|-------|
| Student list | "Henüz öğrenci yok" + CTA | Skeleton rows | Card error + retry |
| Attendance form | Sınıf seçili değil → seçici | Spinner overlay | Toast + inline |
| Parent dashboard | "Yakında bilgilendirilecek" | Skeleton kartlar | Section error |
| Mark book | "Bu döneme not girilmemiş" | DataGrid loading panel | Toast |

---

## 12. Yasak Pratikler

- ❌ Hex değer JSX/CSS'te hardcode.
- ❌ Tailwind dışı CSS framework karıştırmak (Bootstrap, MUI vs).
- ❌ Inline style.
- ❌ Modal içinde modal içinde modal.
- ❌ `alert()`, `confirm()`, `prompt()` — design system component'i kullan.
- ❌ Sayfa scroll'u yatay (overflow-x).
- ❌ Mobile target < 44px.
- ❌ Renk yalnızca semantik bilgi taşır (renk körü dostu değil).
- ❌ "Click here" gibi anlamsız link metni.
- ❌ Tek bir mega font size (h1 = h2 = h3 hierarchy bozulması).
- ❌ Loading'siz API call (anında "donmuş" gibi görünür).

---

## 13. AI Direktifleri

1. Yeni ekran: page header + content + actions hiyerarşisi var mı?
2. Empty/loading/error state hep birlikte ele alındı mı?
3. Renk semantik mi (success/warn/danger)? Sadece renk değil ikon da var mı?
4. Mobile: 44px target, sticky aksiyon, keyboard overlap → kontrol ettin mi?
5. Erişilebilirlik: label, focus, keyboard, contrast kontrolü?
6. Tutarlılık: aynı action başka yerde aynı şekilde mi gözüküyor?
