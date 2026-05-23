# OKSİS — Frontend Coding Standards

> **Stack:** React 18 + TypeScript (strict) + Vite + Tailwind CSS + DevExtreme + React Query + Zustand + React Hook Form + Zod + React Router v6.
> **Mobile:** React Native + Expo + TypeScript + aynı state mgmt + form library, navigation: React Navigation.

---

## 1. TypeScript Konfigürasyonu

`tsconfig.json` zorunlu ayarlar:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

- `any` **yasak.** Migration için `unknown` + type guard.
- `as` cast **gerekçesiz yasak.** Type guard veya `z.parse()` ile çöz.
- `// @ts-ignore` yasak. `@ts-expect-error` + yorum sebebi.

---

## 2. Component Yazım Kuralları

### 2.1 Function Component

```tsx
// students/StudentListPage.tsx
import { useStudents } from "@/portals/admin/students/api";
import { Page, PageHeader } from "@/shared/ui";

type Props = { defaultPage?: number };

export function StudentListPage({ defaultPage = 1 }: Props) {
  const { data, isPending } = useStudents({ page: defaultPage });
  if (isPending) return <Loading />;
  return (
    <Page>
      <PageHeader title="Öğrenciler" />
      {/* ... */}
    </Page>
  );
}
```

- **Named export** (default export yasak, refactor'ı zorlaştırır).
- Props **inline tip**, `interface` yerine `type`.
- Single-letter generic isim yasak (`T` → `TUser`).
- Component dosyası **tek** component (yardımcı subcomponent aynı dosyada OK ama sayfa-level değil).

### 2.2 Naming

Detay: `naming-conventions.md`.

- PascalCase: component, type, enum.
- camelCase: hook, util, variable.
- kebab-case: dosya adı **yasak**, dosya = component adı.
- Boolean: `isX`, `hasX`, `canX`, `shouldX`.
- Event handler: `onX` (prop), `handleX` (içeride).

### 2.3 Component Yapı Sırası

```tsx
export function StudentForm({ initial, onSubmit }: Props) {
  // 1. Hooks (state, query, form)
  const [step, setStep] = useState(0);
  const form = useForm<StudentFormValues>({ resolver: zodResolver(schema) });
  const { data: classes } = useClasses();

  // 2. Derived values
  const isLastStep = step === STEPS.length - 1;

  // 3. Effects
  useEffect(() => { /* ... */ }, [...]);

  // 4. Handlers
  const handleNext = () => { /* ... */ };

  // 5. Early returns
  if (!classes) return <Loading />;

  // 6. JSX
  return <Form>...</Form>;
}
```

---

## 3. State Management Stratejisi

| Kaynağı | Çözüm |
|---------|-------|
| **Server state** (API verisi) | React Query |
| **Form state** | React Hook Form |
| **URL state** (filter, page) | React Router search params |
| **Global UI state** (theme, user, sidebar) | Zustand (küçük) |
| **Local state** | `useState` |
| **Cross-component "form-like" state** | Context (sınırlı) |

> **Yasak:** Server verisini Zustand'a kopyalamak. Server verisi React Query'de **kalır**.

### 3.1 React Query

```tsx
// portals/admin/students/api.ts
export function useStudents(params: StudentListParams) {
  return useQuery({
    queryKey: ["students", "list", params],
    queryFn: ({ signal }) => api.students.list(params, signal),
    staleTime: 30_000,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudentInput) => api.students.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students", "list"] });
      toast.success("Öğrenci eklendi.");
    },
  });
}
```

> Detay: `frontend/state-management-rules.md`.

### 3.2 Zustand

```tsx
// shared/store/authStore.ts
type AuthStore = {
  user: CurrentUser | null;
  setUser: (u: CurrentUser | null) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: async () => {
    await api.auth.logout();
    set({ user: null });
  },
}));
```

- Store'lar **küçük ve odaklı**. "Mega store" yasak.
- Selector pattern: `useAuthStore((s) => s.user)`.
- Persist sadece gerekli alanlar için (`zustand/middleware`).

---

## 4. Hook Kullanım Kuralları

- Hook'lar **`use`** ile başlar.
- Conditional hook yasak (React kuralı).
- Custom hook **bir iş yapar** (`useStudentForm`, `usePermission`).
- Hook'tan döndürülen object **stable** olmalı (`useMemo`, `useCallback`).
- `useEffect` dependency'leri exhaustive (ESLint plugin enforce).
- Side effect'i `useEffect` dışına çıkarmaya çalış: event handler, query callback.

```tsx
// İYİ
const handleSubmit = (values: T) => { mutate(values); };

// KÖTÜ — useEffect ile side effect tetiklemek
useEffect(() => { if (submitted) mutate(values); }, [submitted]);
```

---

## 5. Async / Error Handling

- API çağrıları **React Query** üzerinden. `useMutation`/`useQuery`.
- Try-catch sadece **side effect** orchestration için (örn. token refresh içinde).
- Global error boundary: route bazlı.

```tsx
<RouteErrorBoundary>
  <Outlet />
</RouteErrorBoundary>
```

- Toast: `success` / `error` / `info` / `warning` — design system component'inden, alert() yasak.
- Network/timeout: React Query retry config (auth 4xx'te retry kapalı).

---

## 6. CSS / Styling

- **Tailwind** ile utility-first. Sınırlı custom CSS.
- Component'e özel stil için `clsx`/`cn` ile composition.
- DevExtreme component'leri için **tema override** `src/app/theme/dx.scss`.
- Global CSS sadece `src/app/styles/globals.css` + reset/typography.
- Design token'lar: `tailwind.config.ts` içinde (renkler, spacing, radius, shadow).

```tsx
import { cn } from "@/shared/utils/cn";

export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("rounded-xl bg-white shadow-sm p-4", className)}>{children}</div>;
}
```

> Detay tasarım dili: `frontend/ui-ux-rules.md`.

---

## 7. Form Handling

```tsx
const schema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  birthDate: z.string().date(),
});

type Values = z.infer<typeof schema>;

export function StudentForm({ onSubmit }: Props) {
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("firstName")} error={form.formState.errors.firstName?.message} />
      {/* ... */}
    </form>
  );
}
```

> Detay: `frontend/form-validation-rules.md`.

---

## 8. Internationalization (i18n)

- `react-i18next`. Anahtarlar: `namespace.key.subkey` (örn. `students.list.title`).
- Türkçe varsayılan, İngilizce (en-US) gelecek desteği için kod yapısı hazır.
- String'i koda hard-code etme — **dışarıdan** gelir.
- Pluralization `t("count_students", { count })`.
- Tarih/sayı format: `date-fns` (locale aware) veya `Intl.NumberFormat`.

---

## 9. Routing

- React Router v6. `<Routes>` data-router ile (loader/action opsiyonel).
- Lazy-loaded route'lar (code splitting):

```tsx
const StudentListPage = lazy(() => import("./StudentListPage"));
```

- Protected route HOC: `ProtectedRoute` (auth) + `RequirePermission` (yetki).
- Portal-based URL: `/admin/students`, `/teacher/attendance`, `/parent/children/:id/marks`.

> Detay: `frontend/routing-auth-rules.md`.

---

## 10. API Client

```ts
// shared/api/http.ts
import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-Correlation-Id"] = crypto.randomUUID();
  return config;
});

http.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshSession(); // single-flight
      return http.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

- **Tek** http client. Endpoint dosyaları (`api/students.ts`) bunu kullanır.
- Endpoint dosyaları typed return (`Promise<StudentDto>`).
- Cancellation: `AbortSignal` query'den.
- Response wrapper: backend `{ data, meta, errors }` shape, http wrapper unwrap eder.

---

## 11. Performance

- React Query staleTime/gcTime ayarları.
- `React.memo` **yalnız** ölçülmüş gereklilikte. Aksi over-engineering.
- `useMemo`/`useCallback` aynı şekilde — referans stabilitesi gerekiyorsa.
- Image lazy loading: `<img loading="lazy" />`.
- Code splitting: portal/route bazlı.
- Bundle analiz: `vite-plugin-visualizer`. Hedef: ana bundle < **300KB gzip**.
- Liste sanallaştırma: 100+ row → DevExtreme DataGrid (built-in) veya `react-virtuoso`.

> Detay: `skills/foundation/performance-check.skill`.

---

## 12. Linting & Formatting

- **ESLint** + plugins:
  - `@typescript-eslint/recommended`
  - `react/recommended`
  - `react-hooks/recommended`
  - `import/order`, `unused-imports`
  - `tailwindcss`
- **Prettier**: 2 space, single quote, semi true, trailing comma all, print width 100.
- Husky pre-commit: lint-staged (eslint + prettier + tsc --noEmit).

---

## 13. Testing

- **Vitest** + **Testing Library** + **MSW** (mock service worker).
- Test dosyası: `Component.test.tsx`, `hook.test.ts`, yan yana.
- Snapshot test yok (kırılgan, signal-low). Test davranışı, görünümü değil.
- Hook test: `renderHook` (TL).
- E2E: **Playwright** (V2'de critical path için).

> Detay: `testing-rules.md`.

---

## 14. Mobile (React Native) Notları

- Web/mobile arası **shared/** klasörü altında **paylaşılır** kod (api types, hooks, validation schemas).
- Native-specific UI'lar `mobile/` projesi içinde.
- DevExtreme **web-only**; mobile için native equivalents.
- Tailwind yok mobile'da; `nativewind` veya StyleSheet API.
- Navigation: React Navigation (Stack + Bottom Tabs).

---

## 15. Erişilebilirlik (a11y)

- Semantic HTML (`<button>`, `<nav>`, `<main>`).
- Tüm interaktif element keyboard'la kullanılabilir.
- Form label/input ilişkisi (`htmlFor`).
- `aria-*` gerekirse.
- Renk kontrast WCAG AA (4.5:1).
- Hata mesajları `role="alert"`.

---

## 16. Yasak Pratikler

- ❌ `any`, `as any`, `@ts-ignore`.
- ❌ Default export sayfa/component'te.
- ❌ Server state'i Zustand/Context'e kopyalamak.
- ❌ `console.log` PR'da (`console.warn`/`error` gerektiğinde OK).
- ❌ Inline style (`style={{}}`) — Tailwind veya className.
- ❌ Direct DOM manipulation (`document.getElementById`).
- ❌ HTML `<form>` tag'inin onSubmit'i kullanılırken `event.preventDefault()`'ı unutmak (RHF zaten ele alıyor ama dikkat).
- ❌ `useEffect` ile veri fetch (React Query kullan).
- ❌ Token'ı localStorage'a düz yazmak (sessionStorage + httpOnly cookie veya in-memory + refresh cookie tercih).
- ❌ Bir component dosyasında 300+ satır (refactor).
- ❌ Magic number / string (constants dosyası).
- ❌ Duplicate fetch logic (custom hook'a sar).
- ❌ Test atlanmış critical path (login, attendance form).

---

## 17. AI Direktifleri

1. Yeni component: tip, props, named export, yapı sırası §2.3.
2. API çağrısı mı yapacaksın: React Query? Mutation invalidation hangi key'i çağırıyor?
3. State nereye? §3 tablosundaki kurala uy.
4. CSS: Tailwind utility var mı, custom CSS'e gerek var mı?
5. Form: RHF + Zod + DevExtreme/custom input?
6. Erişim kontrolü: `usePermission` veya `<RequirePermission>` ile route protect?
7. Test: en az happy path + 1 error case + 1 permission denied.
