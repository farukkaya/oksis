# State Management Kuralları

## 1. State Türleri & Sorumlular

| Tür | Tool | Örnek |
|-----|------|-------|
| **Server state** (DB'den gelen veri) | React Query | Öğrenci listesi, dashboard metrik |
| **URL state** (paylaşılabilir) | React Router (`useSearchParams`) | Filter, page, tab |
| **Form state** | React Hook Form | Yeni öğrenci formu |
| **Cross-screen client state** | Zustand | Auth token, aktif çocuk seçimi, theme |
| **Local UI state** | `useState` / `useReducer` | Modal açık, tooltip görünür |
| **Realtime state** | SignalR + React Query cache invalidation | Yeni notification |

**Kural:** Bir state tek bir yerde yaşar. Aynı veriyi iki store'da tutmak YASAK.

## 2. React Query (Server State)

### Konfigürasyon
```tsx
// src/app/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // 30 sn
      gcTime: 5 * 60 * 1000,        // 5 dk
      retry: (count, err) => err.response?.status >= 500 && count < 2,
      refetchOnWindowFocus: false,  // saldırı değil, gerekirse module bazlı aç
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### Query Key Yapısı
Hiyerarşik, predictable:
```ts
['students']                                    // tüm öğrenciler
['students', { page: 1, search: 'ali' }]        // filtreli liste
['students', studentId]                          // tek öğrenci
['students', studentId, 'grades']                // alt resource
['students', studentId, 'grades', { semester: 1 }]
```

**Kural:** Query key'ler **type-safe** factory ile (string mismatch önle):
```ts
// src/modules/students/queries/keys.ts
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (params: StudentListParams) => [...studentKeys.lists(), params] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};
```

### useQuery Hook
```ts
export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => api.get<Student>(`/students/${id}`).then(r => r.data),
    enabled: !!id,
  });
}
```

### useMutation Hook
```ts
export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateStudentInput) =>
      api.put<Student>(`/students/${data.id}`, data).then(r => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(studentKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}
```

### Cache Invalidation Kuralları
- **Mutation success** → ilgili list query'leri invalidate
- **WebSocket/SignalR event** → spesifik query invalidate
- **Manuel refresh** → `refetch()` veya pencere bazlı refetch on focus aç
- **Aşırı invalidation YASAK** (`invalidateQueries({ queryKey: ['students'] })` herşeyi tetikler — spesifik ol)

### Optimistic Update
```ts
useMutation({
  mutationFn: ...,
  onMutate: async (vars) => {
    await qc.cancelQueries({ queryKey: studentKeys.detail(vars.id) });
    const previous = qc.getQueryData(studentKeys.detail(vars.id));
    qc.setQueryData(studentKeys.detail(vars.id), { ...previous, ...vars });
    return { previous };
  },
  onError: (err, vars, ctx) => qc.setQueryData(studentKeys.detail(vars.id), ctx?.previous),
  onSettled: (data, err, vars) => qc.invalidateQueries({ queryKey: studentKeys.detail(vars.id) }),
});
```

Kullanım yerleri: like/unlike, hızlı toggle, attendance kayıt (önce işaretle, sonra confirm).

### Refetch Stratejisi
| Durum | Davranış |
|-------|----------|
| Window focus | Kapalı (default), kritik veride aç |
| Mount | Aç (stale ise refetch) |
| Reconnect | Aç (offline → online) |
| Interval | Sadece dashboard/realtime metrik (örn: her 60 sn) |

## 3. Zustand (Client State)

### Ne Zaman?
- Auth (token, current user)
- Veli'nin aktif çocuk seçimi
- Theme (post-MVP)
- App-level UI flag (sidebar collapsed)

**Zustand'a koyma:**
- Server'dan gelen veri (React Query)
- Form state (RHF)
- Tekil component state (useState)

### Store Pattern
```ts
// src/shared/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: User, access: string, refresh: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, access, refresh) => set({ user, accessToken: access, refreshToken: refresh }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'oksis-auth', partialize: (s) => ({ refreshToken: s.refreshToken, user: s.user }) }
    // access token persist EDİLMEZ (in-memory)
  )
);
```

### Kullanım
- Selector ile re-render minimize:
  ```ts
  const user = useAuthStore(s => s.user);
  // ❌ tüm store'u izleme: const auth = useAuthStore(); // her değişiklikte re-render
  ```
- Action'lar store içinde tanımlı, dışarıda hook üzerinden çağrılır

### Yasaklar
- ❌ Zustand'a server response'unu kaydetmek (cache iki yerde olur)
- ❌ Çok büyük store (50+ field) — module bazında böl
- ❌ Inline action tanımı (function reference unstable)
- ❌ Store içinde async work (mutation orchestration için React Query)

## 4. URL State

Paylaşılabilir state URL'de:
```tsx
const [searchParams, setSearchParams] = useSearchParams();
const page = Number(searchParams.get('page') ?? 1);
const search = searchParams.get('search') ?? '';

setSearchParams(prev => { prev.set('page', '2'); return prev; });
```

### Ne Zaman URL?
- Filter, search, page, sort (kullanıcı tarayıcı yenileyince/paylaşınca aynı sonuç)
- Tab (`?tab=grades`)
- Modal açık/kapalı (deep-link gerektiğinde — örn: `?openStudent=123`)

### Kütüphane
- `nuqs` veya custom hook (`useUrlState`) ile type-safe access önerilir

## 5. Form State (RHF)

Detay: `form-validation-rules.md`. Özet:
- Form state **kesinlikle** RHF'de, başka yere kopyalanmaz
- `FormProvider` ile alt component'ler `useFormContext` ile erişir
- Submit sonrası reset (yeni kayıt) veya keep (edit, success'te)

## 6. Local Component State

```ts
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<string | null>(null);
```

- UI flag, modal open, dropdown open
- 3+ ilişkili state → `useReducer` veya state machine
- Component dosyası 50+ satır local state → custom hook'a çıkar

## 7. SignalR & Realtime State

```ts
// src/shared/realtime/useNotificationsConnection.ts
export function useNotificationsConnection() {
  const qc = useQueryClient();
  
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/notifications', { accessTokenFactory: () => useAuthStore.getState().accessToken! })
      .withAutomaticReconnect()
      .build();
    
    connection.on('notification', (payload) => {
      qc.invalidateQueries({ queryKey: notificationKeys.list() });
      toast.info(payload.title, { description: payload.body });
    });
    
    connection.start();
    return () => { connection.stop(); };
  }, [qc]);
}
```

### Kurallar
- SignalR connection tek instance (app root'ta provider)
- Server event'i → React Query invalidate (cache merkezi olarak güncel kalır)
- Manuel state mutation YASAK; her zaman invalidate

## 8. Persistence

### Persist
- **Refresh token** (httpOnly cookie tercih, MVP için localStorage kabul)
- **Current user** (UX için)
- **Aktif çocuk seçimi** (Parent için)
- **Sidebar collapsed** (UX preference)

### Persist YASAK
- Access token (in-memory + refresh)
- Form taslak (backend draft veya sessionStorage geçici)
- Server'dan gelen veri (cache zaten React Query'de)

## 9. Multi-Child Context (Parent)

Parent kullanıcı için aktif çocuk merkezi yönetilir:
```ts
export const useParentStore = create<ParentState>()(
  persist(
    (set) => ({
      activeChildId: null,
      setActiveChild: (id) => set({ activeChildId: id }),
    }),
    { name: 'oksis-parent' }
  )
);
```

- Axios interceptor `X-Active-Child-Id` header'ı ekler
- Header'da child switcher
- Çocuk değiştiğinde tüm child-bazlı query'ler invalidate edilir:
  ```ts
  useEffect(() => {
    qc.invalidateQueries(); // tam, veya child-bazlı key prefix
  }, [activeChildId]);
  ```

## 10. Error State (Global)

```tsx
<QueryClientProvider client={queryClient}>
  <ErrorBoundary FallbackComponent={GlobalErrorFallback}>
    <App />
  </ErrorBoundary>
</QueryClientProvider>
```

- Query error → component-level handling (`error`, `isError`)
- Mutation error → toast / form error
- Render error → ErrorBoundary
- Network offline → banner (sayfa üstü)

## 11. DevTools

Geliştirme ortamında:
- React Query DevTools (`<ReactQueryDevtools initialIsOpen={false} />`)
- Zustand devtools middleware (Redux DevTools entegrasyonu)
- React DevTools (Profiler ile render incelemek)

Production'da **kapalı**.

## 12. Yasaklar (Özet)

- ❌ Server state'i Zustand'a doldurmak
- ❌ Form state'i Zustand'a doldurmak
- ❌ Query key'i string'le manuel yazmak (key factory kullan)
- ❌ Component'te doğrudan `axios.get` (her zaman React Query hook)
- ❌ Aşırı broad invalidation (`invalidateQueries()` boş parametre)
- ❌ `useQuery` içinde `useEffect` ile yan etki (mutation kullan)
- ❌ Zustand store içinde async business logic (Pure state)
- ❌ Persist edilmemesi gereken veriyi persist etmek (PII)
- ❌ React Query cache'ini manuel `getQueryData` ile patchleyip mutation ile sync atlamak
- ❌ Modal/drawer state'ini her component'te ayrı tutmak — global modal store mantıklıysa Zustand'da
