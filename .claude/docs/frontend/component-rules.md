# OKSİS — Component Rules

> Paylaşılan component'lerin davranış sözleşmesi. **Tek-doğru tek-tasarım**: aynı işi yapan 2 component yasak.

---

## 1. Component Sınıflandırması

| Sınıf | Yer | Örnek |
|-------|-----|-------|
| **Primitive UI** | `shared/ui/` | Button, Input, Modal, Card, Toast, Spinner |
| **Composite UI** | `shared/ui/` veya `shared/forms/` | DataGrid wrapper, FormField, DateRangePicker |
| **Feature** | `portals/{portal}/modules/{module}/components/` | StudentForm, AttendanceRow |
| **Layout** | `app/layouts/` | AdminLayout, TeacherLayout, AuthLayout |

> **Yasak:** Bir portal component'inin başka portal'dan import edilmesi. Ortak ihtiyaç → `shared/`'a çıkar.

---

## 2. Button

### 2.1 API

```ts
type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
};
```

### 2.2 Davranış Kuralları

- Default `type="button"` — form içinde unintended submit önler.
- `loading=true` → spinner + `aria-busy="true"` + disable.
- Disabled neden varsa **tooltip** ile açıkla.
- Bir sayfada tek **primary** olur (PageHeader'da). Tablo satır içi action'lar `ghost`.
- Mobile boyut `md` minimum (44px).

### 2.3 Forbidden

- ❌ `<a>` etiketi button gibi kullanmak (semantically wrong). Navigasyon için `<Link>`.
- ❌ `<button>` içine `<button>` (nested).

---

## 3. Modal

```ts
type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdropClick?: boolean;  // default true; form içeren modal'da onay
  preventClose?: boolean;          // mutasyon devam ederken
  footer?: ReactNode;
  children: ReactNode;
};
```

Kurallar:

- ESC ile kapanır (her zaman, ancak `preventClose` veya unsaved confirm ile override).
- Backdrop click form içeriyorsa **onay** sorulur.
- Focus trap (modal içinde Tab dönüşü). İlk focus title sonrası ilk input.
- Stack max 2.
- Mobile'da full-screen variant tercih (`<MobileSheet>`).

---

## 4. DataGrid (DevExtreme Wrapper)

> Bu projede DataGrid en çok kullanılan bileşen. **Tek bir DataGrid wrapper'ı** üzerinden kullanılır. Detay: `frontend/datagrid-rules.md`.

```tsx
<OksisDataGrid
  queryKey={["students", "list"]}
  fetcher={api.students.list}
  columns={studentColumns}
  toolbar={{ search: true, export: true, columnChooser: true }}
  actions={{ onEdit, onDelete, onView }}
  emptyState={{ title: "Öğrenci yok", action: <Button>...</Button> }}
/>
```

Kurallar:

- Default page size 50, max 100.
- Server-side paging, sorting, filtering (büyük tablolarda).
- Column chooser, fixed columns (action sütunu sağda fixed).
- Row action sütunu **standart**: Görüntüle, Düzenle, Sil (permission'a göre).
- Export (CSV, Excel) toolbar'dan.
- Bulk actions için checkbox selection.
- Empty state custom.

---

## 5. Form Field

Form input'ları **standart wrapper** ile sarılır:

```tsx
<FormField label="Email" required error={errors.email?.message} helperText="Okul mail adresi">
  <Input type="email" {...register("email")} />
</FormField>
```

- Label, required indicator, helper text, error.
- Error varsa helper text'i gizler.
- `id` otomatik generate edilir (`htmlFor` ↔ `id` eşleşme).

---

## 6. Input Variantları

| Component | Kullanım |
|-----------|---------|
| `<Input>` | text, email, password, number, tel |
| `<Textarea>` | uzun metin |
| `<Select>` | static options (5-30) |
| `<Combobox>` | searchable, async loaded options |
| `<MultiSelect>` | multi value |
| `<DatePicker>` | tarih |
| `<DateRangePicker>` | tarih aralığı |
| `<TimePicker>` | saat |
| `<Checkbox>`, `<Radio>`, `<Switch>` | boolean / discrete |
| `<FileInput>` | dosya yükleme |

Hepsi `React Hook Form` ile uyumlu (Controller veya register).

---

## 7. Toast

```ts
toast.success("Öğrenci eklendi");
toast.error("İşlem başarısız", { description: err.message });
toast.info("Yeni sürüm var", { action: { label: "Yenile", onClick } });
```

- API tek (`@/shared/ui/toast`). 3. party direct kullanılmaz.
- Auto-dismiss yukarıdaki süreler.
- Aria role: success/info = `status`, error/warning = `alert`.

---

## 8. Loading Components

### Spinner
```tsx
<Spinner size="sm|md|lg" />
```

### Skeleton
```tsx
<Skeleton className="h-4 w-32" />
<SkeletonCard />
<SkeletonTable rows={5} columns={4} />
```

### Loading Overlay (sayfa içi)
```tsx
<LoadingOverlay show={isPending}>
  <Content />
</LoadingOverlay>
```

---

## 9. Empty State

```tsx
<EmptyState
  icon={<Users className="w-12 h-12 text-neutral-300" />}
  title="Henüz öğrenci yok"
  description="Yeni öğrenci ekleyerek başlayın."
  action={<Button onClick={openCreate}>Öğrenci Ekle</Button>}
/>
```

Tüm liste/grid component'leri prop olarak `emptyState` kabul eder.

---

## 10. Confirm Dialog

```tsx
const confirmed = await confirm({
  title: "Öğrenciyi sil",
  description: "Bu işlem geri alınamaz. Devam etmek istiyor musunuz?",
  confirmLabel: "Sil",
  variant: "danger",
});
if (confirmed) { await mutate.mutateAsync(id); }
```

- Promise-based API (await edilebilir).
- `danger` variant'ta primary buton kırmızı.
- ESC = cancel.
- Çift kayıtlı tıklamaya karşı koruma (button disabled while pending).

---

## 11. Tabs

```tsx
<Tabs defaultValue="info">
  <TabList>
    <Tab value="info">Bilgiler</Tab>
    <Tab value="contacts">İletişim</Tab>
    <Tab value="history">Geçmiş</Tab>
  </TabList>
  <TabPanel value="info"><InfoSection /></TabPanel>
  <TabPanel value="contacts"><ContactsSection /></TabPanel>
  <TabPanel value="history"><HistorySection /></TabPanel>
</Tabs>
```

- Controlled veya uncontrolled.
- URL state ile sync (search param `?tab=info`).

---

## 12. Detail Page Layout

```
PageHeader (title + back + actions)
├─ Subhead (entity meta: durum, oluşturma tarihi)
├─ Tabs (Bilgiler | İletişim | Geçmiş | ...)
└─ Tab content (Card layout)
```

---

## 13. Badge / Pill / Chip

| Component | Kullanım |
|-----------|---------|
| `<Badge>` | Sayı (notification count) |
| `<Pill>` | Status etiketi (Aktif, Mezun, Devamsız) |
| `<Chip>` | Filter selection, multi-select item |

Renk tematik (`success/warning/danger/info/neutral`).

---

## 14. Dashboard Widget

Detay: `skills/frontend/dashboard-widget.skill`.

```tsx
<MetricCard
  title="Devamsız Öğrenci"
  value={42}
  trend={{ value: -5, direction: "down", label: "geçen haftaya göre" }}
  icon={<UserX />}
  variant="warning"
  loading={isPending}
/>
```

---

## 15. Permission Wrapper

```tsx
<RequirePermission permission="students:create">
  <Button onClick={openCreate}>Öğrenci Ekle</Button>
</RequirePermission>
```

- Permission yoksa **render etmez** (tooltip ile bilgilendirmek için `fallback` prop).
- Sayfa düzeyinde route guard ayrı (`<ProtectedRoute>`).

> Detay: `frontend/routing-auth-rules.md`.

---

## 16. Çocuk Seçici (Parent Portal)

Veli birden fazla çocuğa sahipse:

```tsx
<ActiveChildSwitcher /> // header'da sabit
```

- Tek çocuk → switcher gizli.
- Çoklu → dropdown; seçim Zustand store + URL param (`?childId=...`) hem `X-Active-Child-Id` header.
- Çocuk değişince ilgili query'ler invalidate.

---

## 17. Dosya Yükleme

```tsx
<FileUpload
  accept="image/*,application/pdf"
  maxSizeMb={10}
  maxCount={5}
  onChange={(files) => ...}
/>
```

- Drag&drop + click.
- Server-side validation tekrar (defense-in-depth).
- Upload progress göster (chunked).
- Yüklü dosyalar liste + sil.

---

## 18. Code Splitting / Lazy

Sayfa component'leri lazy:

```tsx
const StudentListPage = lazy(() => import("./StudentListPage"));
```

Layout suspense fallback:

```tsx
<Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
```

Modal/feature içerikleri için `lazy` opsiyonel; sayfa initial bundle'ı zorluyorsa.

---

## 19. Test Hooks (test için data-testid)

- Stable selector için `data-testid`. Otomatik test'lerde id'le seç.
- Pattern: `{component}-{role}`. Örnek `data-testid="student-row-edit-button"`.

---

## 20. Yasak Pratikler

- ❌ Aynı işi yapan 2 component (örn. 2 ayrı `Button`).
- ❌ DevExtreme component'i wrapper olmadan doğrudan import (theme/i18n bypass).
- ❌ Modal içine modal içine modal.
- ❌ Component'te direct API call (props/hook üzerinden).
- ❌ Side effect'i render içinde (set state on render).
- ❌ "key" olarak array index (liste değişebilir).
- ❌ 300+ satır component (refactor).
- ❌ Yetkisiz kullanıcıya bile render edip "disabled" geçmek (server-side hala kontrol etmeli ama UI'de göstermek leak).
- ❌ Component'in iç state'ini parent'ın `useEffect`'le yönetmesi (controlled/uncontrolled karışıklığı).
- ❌ Inline anonymous prop function (`onClick={() => ...}`) heavy listede (re-render trigger; küçük liste için OK).

---

## 21. AI Direktifleri

1. İhtiyacın olan component **shared/ui**'de var mı? Önce ara.
2. Yeni primitive component yazıyorsan: props API tutarlı mı (variant/size/loading/disabled)?
3. Yeni feature component → portal/modules altına. Shared'a çıkarmak için **iki kullanım yeri** kuralı.
4. Form için RHF + FormField + design system input'u kullan.
5. DataGrid için `OksisDataGrid` wrapper'ı; direkt `dx-react-grid` import yok.
6. Permission UI'da `<RequirePermission>` ile; backend yine kontrol eder.
7. Test: snapshot yerine kullanıcı davranışı testle (click, type, assert text/role).
