# Architecture Rules

> Bu dosya OKSİS'in **mimari iskeletini sabitler**. AI her oturumda farklı mimari önermemelidir. Burada tanımlı yapıya sadık kalınmalıdır.

---

## 1. Genel Yaklaşım

OKSİS, **Clean Architecture + CQRS (MediatR)** üzerine kuruludur. Modüler monolith mimaridir — mikroservis DEĞİL.

### Neden Modüler Monolith?
- MVP fazında deploy / debug / takım koordinasyonu kolaylığı
- Multi-tenant SaaS ölçeğinde mikroservis erken optimizasyon
- Modül sınırları net çizilirse, ileride mikroservise ayrılması mümkün

---

## 2. Backend Katmanları

```
Oksis.Api              ← HTTP entry (controllers, minimal endpoints, middleware)
Oksis.Application      ← Use case'ler (Commands, Queries, Handlers, Validators, DTO)
Oksis.Domain           ← Entity, value object, domain event, enum, exception
Oksis.Infrastructure   ← EF Core, Hangfire, Redis, FCM, Email, dış servis adaptörleri
Oksis.Shared           ← Cross-cutting (Result type, paged result, constants)
```

### Bağımlılık Yönü (Tek yönlü, içe doğru)
```
Api ──► Application ──► Domain
 │            ▲             ▲
 └──► Infrastructure ───────┘
```

- **Domain hiçbir şeye bağımlı değil.** Pure C#.
- **Application sadece Domain'e bağlı.** EF Core, HTTP, Hangfire BİLMEZ.
- **Infrastructure, Application'daki interface'leri implement eder** (DIP).
- **Api, Application + Infrastructure'ı orkestre eder.**

### Veritabanı Şema Partisyonu

Modüler monolith — tek DB, ama tablolar **5 SQL Server schema**'sına bölünür: **`master`** (lookup/seed), **`identity`** (kullanıcı/yetki/token), **`school`** (okul aggregate ve ayarları), **`academic`** (sezon, şube, yoklama, not, vb.), **`platform`** (outbox, audit log, sistem-kesen). `dbo` kullanılmaz. Yeni tablo eklerken `IEntityTypeConfiguration<T>` içinde **`builder.ToXxxTable("name")`** extension'ı zorunlu (`builder.ToTable("x")` yasak — `dbo`'ya düşer). Detay + tam tablo haritası + ekleme karar akışı: `backend/database-rules.md` § 16.

### Yasak
- ❌ Controller içinde DbContext kullanmak
- ❌ Application içinde `Microsoft.EntityFrameworkCore` referansı (sadece `IApplicationDbContext` interface'i)
- ❌ Domain entity'de attribute (DataAnnotations) — Fluent API'de yapılır
- ❌ Static service / singleton state
- ❌ `builder.ToTable("x")` (şemasız) — şema-spesifik extension zorunlu (`ToMasterTable`, `ToIdentityTable`, `ToSchoolTable`, `ToAcademicTable`, `ToPlatformTable`)

---

## 3. Modül Yapısı (Vertical Slice)

Application katmanı **modül bazında dikey dilimlenir**:

```
Oksis.Application/
├── Modules/
│   ├── Schools/          (okul, kurulum, sezon)
│   ├── Identity/         (user, role, permission, auth)
│   ├── Students/         (öğrenci, veli ilişkisi, kayıt)
│   ├── Teachers/         (öğretmen, branş)
│   ├── Classes/          (sınıf, şube, ders programı)
│   ├── Attendance/       (yoklama)
│   ├── Grades/           (not, karne)
│   ├── Homework/         (ödev)
│   ├── Announcements/    (duyuru)
│   ├── Messaging/        (mesajlaşma)
│   ├── Notifications/    (push, in-app)
│   └── Dashboard/        (rapor, metrik)
├── Common/               (behaviors, abstractions)
└── DependencyInjection.cs
```

Her modül kendi **Commands, Queries, DTOs, Validators, Mapping** klasörlerini içerir.

---

## 4. CQRS Kuralları

- **Command**: state değiştirir (Create, Update, Delete, Publish). Dönüş tipi: `Result<TId>` veya `Result`.
- **Query**: state okur, idempotent. Dönüş tipi: `Result<TDto>` veya `Result<PagedResult<TDto>>`.
- **Handler tek sorumluluk**: bir command/query için tek handler.
- **MediatR Pipeline Behaviors** sıralaması (sabit):
  1. `RequestLoggingBehavior`
  2. `ValidationBehavior` (FluentValidation)
  3. `TenantContextBehavior` (tenant claim'i kontrol)
  4. `AuthorizationBehavior` (permission check)
  5. `TransactionBehavior` (sadece Command'lar için)
  6. `CachingBehavior` (sadece [Cacheable] işaretli Query'ler)

---

## 5. Frontend Mimarisi (Web)

```
src/
├── app/                     ← App entry, providers, router
│   ├── providers/           (QueryClient, Auth, Theme, i18n)
│   └── routes/              (portal bazlı route yapısı)
├── portals/                 ← Ana portallar
│   ├── admin/
│   ├── teacher/
│   ├── parent/
│   └── student/
├── modules/                 ← Domain modülleri (her portal'de paylaşılabilir)
│   ├── attendance/
│   ├── grades/
│   ├── homework/
│   └── ...
├── shared/                  ← Cross-portal paylaşımlı
│   ├── components/          (Button, Modal, DataGrid wrappers, FormControl)
│   ├── hooks/               (useApi, useDebounce, usePermission)
│   ├── api/                 (axios instance, interceptors, query keys)
│   ├── types/               (global types, DTOs)
│   ├── utils/
│   └── constants/
└── assets/
```

### Kurallar
- **Her portal kendi route ağacına sahip.** `/admin/*`, `/teacher/*`, `/parent/*`, `/student/*`
- **Portal bazlı layout** (Sidebar, TopBar farklı olabilir).
- **Modül kodu portallar arası paylaşılır** (örn. attendance modülü hem teacher hem admin portal'de farklı view ile kullanılır).
- **Container/Presentational ayrımı yok**; container kavramı yerine **custom hook** ile data fetching ayrılır.

---

## 6. Mobile Mimarisi

```
src/
├── app/                     (entry, navigation root, providers)
├── navigation/              (stack, tab, drawer, role-based)
├── screens/                 (ekran component'leri, portal bazlı klasörlerde)
│   ├── teacher/
│   ├── parent/
│   └── student/
├── features/                (domain feature'ları — attendance, grades, ...)
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── api/
│   └── utils/
└── assets/
```

- **Tek app, 3 rol** (Teacher / Parent / Student). Login sonrası kullanıcının rolüne göre uygun navigation stack açılır.
- **Push notification handler tek yerden yönetilir** (`features/notifications/`).

---

## 7. Notification Mimarisi (Event-Driven)

```
Domain Event (örn. AttendanceTakenEvent)
       │
       ▼
MediatR INotificationHandler (in-process, transaction sonrası)
       │
       ▼
INotificationService.EnqueueAsync
       │
       ▼
Hangfire Background Job
       │
       ▼
FCM Provider + In-App Notification kaydı + SignalR push
```

- **Domain event** → transaction commit edildikten sonra publish edilir (outbox pattern: Sprint 3+).
- **Notification job idempotent olmalı.**
- Detay: `backend/notification-rules.md`, `notification-matrix.md`

---

## 8. Cache Stratejisi

| Veri Türü | Strateji | TTL |
|---|---|---|
| Permission matrix (kullanıcı bazlı) | Redis, key: `perm:{schoolId}:{userId}` | 15 dk |
| Master data (sınıf, ders, dönem) | Redis, key: `master:{schoolId}:classes` | 1 saat |
| Dashboard metrikleri | Redis, key: `dash:{schoolId}:{metric}` | 5 dk |
| User profile | Redis, key: `user:{userId}` | 30 dk |
| Frequently-read tenant config | Redis, key: `tenant:{schoolId}:config` | 1 saat |

- **Tüm cache key'leri tenant prefix'li.** Cross-tenant cache leak = security incident.
- **Write-through invalidation**: ilgili entity değiştiğinde cache temizlenir.

---

## 9. Yasak Mimari Yaklaşımlar

❌ Microservices (MVP'de)
❌ GraphQL (REST only — MVP)
❌ Server-Sent Events (SignalR kullanılır)
❌ MongoDB / NoSQL ana veri için (SQL Server only; sadece log için Elasticsearch)
❌ Repository pattern üzerine ek soyutlama (EF Core + DbContext yeterli; gerekirse Specification pattern eklenir)
❌ AutoMapper (Mapster kullanılır)
❌ MediatR olmadan service layer'da iş mantığı (tüm use case'ler Handler içinde)
❌ Frontend'de Redux (Zustand + React Query yeterli)
❌ Material UI / Ant Design (DevExtreme + Tailwind tek tasarım sistemi)
