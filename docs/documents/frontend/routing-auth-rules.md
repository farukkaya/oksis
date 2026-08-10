# Routing & Authentication Kuralları

## 1. Portal Bazlı Route Yapısı

```
/                              → Login redirect veya marketing landing
/login
/forgot-password
/reset-password?token=...
/invite/accept?token=...

/admin                         → SchoolAdmin & SuperAdmin portalı
  /admin/dashboard
  /admin/students
  /admin/students/:id
  /admin/teachers
  /admin/classes
  /admin/announcements
  /admin/users
  /admin/settings

/teacher                       → Teacher portalı
  /teacher/dashboard
  /teacher/classes
  /teacher/classes/:id/attendance
  /teacher/grades
  /teacher/homework

/parent                        → Parent portalı (multi-child header switcher)
  /parent/dashboard
  /parent/grades
  /parent/attendance
  /parent/homework
  /parent/messages

/student                       → Student portalı
  /student/dashboard
  /student/grades
  /student/homework

/super                         → SuperAdmin (cross-tenant — yalnızca SuperAdmin)
  /super/tenants
  /super/system

NOT FOUND: /404
FORBIDDEN: /403
```

### Kurallar
- Her portal **ayrı root** (`/admin`, `/teacher`…)
- Login sonrası kullanıcı rolüne göre default redirect:
  - SuperAdmin → `/super` veya `/admin`
  - SchoolAdmin / SchoolStaff / Accountant / Secretary → `/admin`
  - Teacher → `/teacher`
  - Parent → `/parent`
  - Student → `/student`

## 2. Route Tanımı (React Router v6)

```tsx
// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  
  {
    element: <ProtectedLayout />,                  // auth check
    children: [
      {
        path: '/admin',
        element: <AdminLayout requiredRoles={['SuperAdmin', 'SchoolAdmin', 'SchoolStaff', 'Accountant', 'Secretary']} />,
        children: [
          { index: true, lazy: () => import('@/portals/admin/pages/Dashboard') },
          { path: 'students', lazy: () => import('@/portals/admin/pages/Students') },
          { path: 'students/:id', lazy: () => import('@/portals/admin/pages/StudentDetail') },
          // ...
        ],
      },
      { path: '/teacher', element: <TeacherLayout />, children: [...] },
      { path: '/parent', element: <ParentLayout />, children: [...] },
      { path: '/student', element: <StudentLayout />, children: [...] },
      { path: '/super', element: <SuperLayout requiredRoles={['SuperAdmin']} />, children: [...] },
    ],
  },
  
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

### Kurallar
- Lazy import portal seviyesinde + page seviyesinde
- `index: true` ile portal default page
- Catch-all `*` 404'e gider
- Route'lar **flat** değil, **nested** (layout reuse)

## 3. ProtectedLayout (Auth Check)

```tsx
export function ProtectedLayout() {
  const accessToken = useAuthStore(s => s.accessToken);
  const user = useAuthStore(s => s.user);
  const location = useLocation();
  
  // 1. Refresh token var ama access yok → refresh dene
  // 2. Hiç token yok → login'e yönlendir
  
  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
}
```

### Login Redirect Geri Dönüş
Login başarılı → `location.state.from?.pathname ?? defaultByRole(user)`.

## 4. Role-Based Layout

```tsx
export function AdminLayout({ requiredRoles }: { requiredRoles: Role[] }) {
  const user = useAuthStore(s => s.user!);
  
  if (!requiredRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }
  
  return (
    <div className="min-h-screen flex">
      <AdminSidebar />
      <main className="flex-1">
        <AdminHeader />
        <Outlet />
      </main>
    </div>
  );
}
```

### Kurallar
- Her portal layout'u **kendi role check'i** yapar
- Yetki yoksa **404 değil 403**, ama veri leak riski varsa 404 (bkz. security-rules.md)
- Layout altında `<Outlet />` ile child route render

## 5. Permission-Based UI

Role yetmez; **permission** bazında menü ve aksiyon:

```tsx
function AdminSidebar() {
  const { hasPermission } = usePermission();
  
  return (
    <nav>
      <SidebarLink to="/admin/dashboard">Dashboard</SidebarLink>
      {hasPermission('student.view') && (
        <SidebarLink to="/admin/students">Öğrenciler</SidebarLink>
      )}
      {hasPermission('teacher.view') && (
        <SidebarLink to="/admin/teachers">Öğretmenler</SidebarLink>
      )}
      {hasPermission('user.manage') && (
        <SidebarLink to="/admin/users">Kullanıcılar</SidebarLink>
      )}
    </nav>
  );
}
```

### usePermission Hook
```ts
export function usePermission() {
  const permissions = useAuthStore(s => s.user?.permissions ?? []);
  return {
    hasPermission: (p: string) => permissions.includes(p),
    hasAnyPermission: (...ps: string[]) => ps.some(p => permissions.includes(p)),
    hasAllPermissions: (...ps: string[]) => ps.every(p => permissions.includes(p)),
  };
}
```

### PermissionGate Component
```tsx
<PermissionGate permission="student.create" fallback={null}>
  <Button>Yeni Öğrenci</Button>
</PermissionGate>
```

## 6. Page-Level Permission Guard

```tsx
function StudentsPage() {
  const { hasPermission } = usePermission();
  if (!hasPermission('student.view')) return <Navigate to="/403" replace />;
  // ...
}
```

Veya route config'inde wrapper:
```tsx
{ path: 'students', element: <RequirePermission perm="student.view"><Students /></RequirePermission> }
```

## 7. Token Yenileme (Silent Refresh)

```ts
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig = err.config;
    
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const refresh = useAuthStore.getState().refreshToken;
        const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken: refresh });
        useAuthStore.getState().setSession(data.user, data.accessToken, data.refreshToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig);
      } catch {
        useAuthStore.getState().clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
```

### Kurallar
- Concurrent refresh → queue mekanizması (race condition)
- Refresh başarısız → logout + login redirect
- Logout sonrası all queries clear: `queryClient.clear()`

## 8. Login Flow

```tsx
async function handleLogin(credentials: LoginInput) {
  const { data } = await api.post('/auth/login', credentials);
  authStore.setSession(data.user, data.accessToken, data.refreshToken);
  
  const target = location.state?.from?.pathname ?? defaultByRole(data.user.role);
  navigate(target, { replace: true });
}

function defaultByRole(role: Role): string {
  return {
    SuperAdmin: '/super',
    SchoolAdmin: '/admin',
    SchoolStaff: '/admin',
    Accountant: '/admin',
    Secretary: '/admin',
    Teacher: '/teacher',
    Parent: '/parent',
    Student: '/student',
  }[role];
}
```

## 9. Logout Flow

```tsx
async function handleLogout() {
  try {
    await api.post('/auth/logout', { refreshToken: authStore.refreshToken });
  } catch {} // ignore, client cleanup yine yapılır
  
  authStore.clear();
  queryClient.clear();
  navigate('/login', { replace: true });
}
```

## 10. Multi-Child (Parent)

Parent header'da çocuk switcher:
```tsx
<ChildSwitcher
  children={user.children}
  activeId={activeChildId}
  onChange={(id) => {
    setActiveChild(id);
    queryClient.invalidateQueries();   // child-bazlı veriyi yenile
  }}
/>
```

Axios interceptor `X-Active-Child-Id` header'ı ekler.

## 11. Deep Link Desteği

- Tüm önemli sayfa URL ile erişilebilir
- Login değilse → login'e yönlendir, sonra orijinal sayfaya geri dön
- 404 sayfasından "Ana Sayfa" linki rol'e göre

## 12. Route Transition

- Yeni sayfa açılışında **scroll to top**: `<ScrollToTop />` component (her route değişiminde)
- Loading: `<Suspense fallback={<PageSkeleton />}>` portal layout altında
- Hata: `<ErrorBoundary>` ile yakalama

## 13. Breadcrumb

```tsx
<Breadcrumb>
  <BreadcrumbItem href="/admin">Yönetim</BreadcrumbItem>
  <BreadcrumbItem href="/admin/students">Öğrenciler</BreadcrumbItem>
  <BreadcrumbItem current>Ali Veli</BreadcrumbItem>
</Breadcrumb>
```

- Auto-generate from route config (opsiyonel)
- Mobile'da gizli veya tek seviye

## 14. Sidebar / Menu Yapısı

```tsx
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, to: '/admin' },
  { id: 'students', label: 'Öğrenciler', icon: Users, to: '/admin/students', permission: 'student.view' },
  { id: 'classes', label: 'Sınıflar', icon: Layers, to: '/admin/classes', permission: 'class.view' },
  {
    id: 'communication', label: 'İletişim', icon: MessageCircle,
    children: [
      { id: 'announcements', label: 'Duyurular', to: '/admin/announcements', permission: 'announcement.view' },
      { id: 'messages', label: 'Mesajlar', to: '/admin/messages', permission: 'message.view' },
    ],
  },
];
```

- Permission yoksa item render edilmez
- Aktif item highlight
- Collapsible (desktop) / drawer (mobile)

## 15. Mobile Navigation

- Sidebar yerine **bottom tab bar** (4-5 ana sekme)
- Hamburger menu kalan opsiyonlar için
- Drawer açılış: solda

```tsx
<BottomTabBar>
  <Tab to="/teacher" icon={<Home />}>Anasayfa</Tab>
  <Tab to="/teacher/classes" icon={<Users />}>Sınıflarım</Tab>
  <Tab to="/teacher/grades" icon={<FileText />}>Notlar</Tab>
  <Tab to="/teacher/messages" icon={<MessageCircle />}>Mesajlar</Tab>
</BottomTabBar>
```

## 16. Public vs Protected Route

| Public | Protected |
|--------|-----------|
| `/login` | Tüm `/admin/*`, `/teacher/*`, vs. |
| `/forgot-password` | |
| `/reset-password` | |
| `/invite/accept` | |
| `/404`, `/403` | |

ProtectedLayout default; istisna route'lar açıkça public.

## 17. Yasaklar (Özet)

- ❌ Auth check'i her sayfada manuel yapmak (Layout'ta tek yerde)
- ❌ Permission'ı client-side **bypass edilemez** sayarak güvenlik kurmak (backend de kontrol eder, client UX için)
- ❌ Token URL query string'inde göndermek
- ❌ Login sonrası `window.location.reload()` (state kaybı)
- ❌ Logout'ta React Query cache temizlememek (PII başka kullanıcıya görünür)
- ❌ Lazy load olmadan tüm app'i tek bundle yapmak
- ❌ Aynı sayfayı 2 farklı path'te render etmek (`/admin/users` ve `/admin/user-management` — kafa karışıklığı)
- ❌ Role değişiminde route invalidate etmemek (eski menü görünür kalır)
- ❌ ProtectedLayout altında public içerik koymak
- ❌ Refresh token'ı sürekli localStorage'da plain saklamak (httpOnly cookie tercih edin; MVP'de pragmatik kompromise yapılabilir)
