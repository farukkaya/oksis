# Folder Structure

> AI yeni dosya/klasör oluşturmadan önce **mutlaka bu yapıya bakar**. Aynı amaç için ikinci klasör açılamaz.

---

## 1. Solution Root

```
oksis/
├── src/
│   ├── backend/
│   │   ├── Oksis.Api/
│   │   ├── Oksis.Application/
│   │   ├── Oksis.Domain/
│   │   ├── Oksis.Infrastructure/
│   │   └── Oksis.Shared/
│   ├── web/                   ← React Web (admin/teacher/parent/student portal)
│   └── mobile/                ← React Native (teacher/parent/student)
├── tests/
│   ├── Oksis.UnitTests/
│   ├── Oksis.IntegrationTests/
│   ├── Oksis.ArchitectureTests/
│   └── web/
│       └── e2e/               ← Playwright
├── infra/
│   ├── docker/
│   ├── k8s/
│   └── scripts/
├── docs/
│   ├── adr/                   ← Architecture Decision Records
│   ├── api/                   ← API kılavuzları
│   └── runbooks/
├── .github/
│   └── workflows/             ← CI/CD pipeline'lar
├── .rules/                    ← AI rule dosyaları (bu klasör)
├── .skills/                   ← AI skill dosyaları
├── Oksis.sln
└── README.md
```

---

## 2. Backend (.NET Core API v10)

### Oksis.Api (HTTP Layer)
```
Oksis.Api/
├── Controllers/
│   ├── V1/
│   │   ├── StudentsController.cs
│   │   ├── AttendanceController.cs
│   │   └── ...
├── Endpoints/                 ← Minimal API endpoints (alternatif kullanım)
├── Middleware/
│   ├── TenantContextMiddleware.cs
│   ├── ExceptionHandlingMiddleware.cs
│   ├── RequestLoggingMiddleware.cs
│   └── CorrelationIdMiddleware.cs
├── Filters/
│   └── ApiResponseFilter.cs
├── Authorization/
│   ├── Policies/
│   ├── Handlers/
│   └── Requirements/
├── Hubs/                      ← SignalR
│   └── NotificationHub.cs
├── Configuration/
│   ├── DependencyInjection.cs
│   ├── CorsConfig.cs
│   └── SwaggerConfig.cs
├── appsettings.json
├── appsettings.Development.json
├── Program.cs
└── Oksis.Api.csproj
```

### Oksis.Application (Use Case Layer)
```
Oksis.Application/
├── Modules/
│   ├── Students/
│   │   ├── Commands/
│   │   │   ├── CreateStudent/
│   │   │   │   ├── CreateStudentCommand.cs
│   │   │   │   ├── CreateStudentCommandHandler.cs
│   │   │   │   └── CreateStudentCommandValidator.cs
│   │   │   └── ...
│   │   ├── Queries/
│   │   │   ├── GetStudentById/
│   │   │   ├── ListStudents/
│   │   │   └── ...
│   │   ├── Dtos/
│   │   │   ├── StudentDto.cs
│   │   │   ├── StudentDetailDto.cs
│   │   │   └── StudentListItemDto.cs
│   │   ├── Mapping/
│   │   │   └── StudentMappingConfig.cs   ← Mapster config
│   │   └── Events/
│   │       └── StudentEnrolledEventHandler.cs
│   ├── Attendance/
│   ├── Grades/  (Mark — not modülü)
│   ├── Homework/
│   ├── Announcements/
│   ├── Identity/
│   ├── Schools/
│   ├── Classes/
│   ├── Teachers/
│   ├── Notifications/
│   ├── Messaging/
│   └── Dashboard/
├── Common/
│   ├── Behaviors/             ← MediatR pipeline behaviors
│   │   ├── ValidationBehavior.cs
│   │   ├── TenantContextBehavior.cs
│   │   ├── AuthorizationBehavior.cs
│   │   ├── TransactionBehavior.cs
│   │   ├── CachingBehavior.cs
│   │   └── RequestLoggingBehavior.cs
│   ├── Abstractions/          ← Application interface'leri
│   │   ├── IApplicationDbContext.cs
│   │   ├── ITenantContext.cs
│   │   ├── ICurrentUser.cs
│   │   ├── INotificationService.cs
│   │   ├── ICacheService.cs
│   │   └── IBackgroundJobClient.cs
│   ├── Models/
│   │   ├── Result.cs
│   │   ├── PagedResult.cs
│   │   └── PagedQuery.cs
│   ├── Attributes/
│   │   ├── CacheableAttribute.cs
│   │   └── RequirePermissionAttribute.cs
│   └── Exceptions/
├── DependencyInjection.cs
└── Oksis.Application.csproj
```

### Oksis.Domain (Domain Layer)
```
Oksis.Domain/
├── Entities/
│   ├── Schools/
│   │   ├── School.cs
│   │   └── AcademicYear.cs
│   ├── Identity/
│   │   ├── User.cs
│   │   ├── Role.cs
│   │   └── Permission.cs
│   ├── Students/
│   │   ├── Student.cs
│   │   ├── StudentParent.cs   ← join entity
│   │   └── ...
│   ├── Attendance/
│   │   └── Attendance.cs
│   ├── Grades/
│   │   ├── Mark.cs
│   │   └── Exam.cs
│   ├── Homework/
│   │   ├── Homework.cs
│   │   └── HomeworkSubmission.cs
│   └── ...
├── ValueObjects/
│   ├── Email.cs
│   ├── PhoneNumber.cs
│   └── TcKimlikNo.cs
├── Events/                    ← Domain events
│   ├── StudentEnrolledEvent.cs
│   ├── AttendanceTakenEvent.cs
│   └── MarkPublishedEvent.cs
├── Enums/
│   ├── AttendanceStatus.cs
│   ├── UserRole.cs
│   └── ...
├── Exceptions/
│   ├── DomainException.cs
│   └── BusinessRuleViolationException.cs
├── Common/
│   ├── BaseEntity.cs
│   ├── ITenantEntity.cs       ← marker interface (SchoolId zorunluluğu)
│   ├── IAuditableEntity.cs
│   └── ISoftDeletableEntity.cs
└── Oksis.Domain.csproj
```

### Oksis.Infrastructure (Adapter Layer)
```
Oksis.Infrastructure/
├── Persistence/
│   ├── ApplicationDbContext.cs
│   ├── Configurations/        ← EF Core Fluent API
│   │   ├── StudentConfiguration.cs
│   │   └── ...
│   ├── Interceptors/
│   │   ├── AuditingInterceptor.cs
│   │   ├── SoftDeleteInterceptor.cs
│   │   ├── DomainEventInterceptor.cs
│   │   └── TenantInterceptor.cs
│   ├── Migrations/
│   ├── Seed/
│   └── Repositories/          ← (sadece gerekirse, EF Core ile genelde yok)
├── Identity/
│   ├── JwtService.cs
│   ├── PasswordHasher.cs
│   └── TokenValidator.cs
├── Caching/
│   └── RedisCacheService.cs
├── BackgroundJobs/
│   ├── HangfireConfig.cs
│   └── Jobs/
│       ├── SendDailyDigestJob.cs
│       └── HomeworkDueReminderJob.cs
├── Notifications/
│   ├── FcmNotificationProvider.cs
│   ├── EmailNotificationProvider.cs
│   └── NotificationService.cs
├── Logging/
│   └── SerilogConfig.cs
├── Storage/
│   └── S3FileStorageService.cs (veya MinIO)
├── External/                  ← 3rd party API client'lar
└── DependencyInjection.cs
```

### Oksis.Shared (Cross-cutting)
```
Oksis.Shared/
├── Constants/
├── Extensions/
└── Helpers/
```

---

## 3. Frontend Web

```
web/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── providers/
│   │       ├── QueryProvider.tsx
│   │       ├── AuthProvider.tsx
│   │       ├── ThemeProvider.tsx
│   │       └── I18nProvider.tsx
│   ├── portals/
│   │   ├── admin/
│   │   │   ├── layout/
│   │   │   ├── pages/
│   │   │   └── routes.tsx
│   │   ├── teacher/
│   │   ├── parent/
│   │   └── student/
│   ├── modules/
│   │   ├── attendance/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── types/
│   │   │   └── constants/
│   │   ├── grades/
│   │   ├── homework/
│   │   └── ...
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/            ← Button, Input, Modal, Card
│   │   │   ├── data/          ← DataGrid wrapper, FilterBar
│   │   │   ├── form/          ← FormControl, FormField
│   │   │   ├── feedback/      ← Toast, EmptyState, LoadingState, ErrorState
│   │   │   └── layout/        ← Sidebar, TopBar, Footer
│   │   ├── hooks/
│   │   ├── api/
│   │   │   ├── client.ts      ← axios instance
│   │   │   ├── interceptors.ts
│   │   │   └── types.ts       ← ApiResponse<T>, PagedResult<T>
│   │   ├── store/             ← Zustand stores
│   │   ├── utils/
│   │   ├── types/
│   │   ├── constants/
│   │   └── i18n/
│   ├── assets/
│   └── main.tsx
├── public/
├── tests/
├── .env.development
├── .env.production
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## 4. Mobile (React Native + Expo)

```
mobile/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── providers/
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── TeacherNavigator.tsx
│   │   ├── ParentNavigator.tsx
│   │   └── StudentNavigator.tsx
│   ├── screens/
│   │   ├── auth/
│   │   ├── teacher/
│   │   ├── parent/
│   │   └── student/
│   ├── features/
│   │   ├── attendance/
│   │   ├── grades/
│   │   ├── homework/
│   │   ├── announcements/
│   │   ├── messaging/
│   │   └── notifications/
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   ├── utils/
│   │   └── i18n/
│   └── assets/
├── app.json                   ← Expo config
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## 5. Yasak

- ❌ Backend'de modül dışında flat `Services/`, `Helpers/` klasörü açma. Cross-cutting → `Common/` veya `Shared/`.
- ❌ Frontend'de aynı component'i hem `shared/components` hem `modules/.../components` altında tutma. Karar: 2'den fazla yerde kullanılıyorsa → `shared`, değilse → `modules`.
- ❌ Test dosyalarını ayrı klasörde tutma; her component için aynı klasörde `Component.test.tsx`.
- ❌ Migration dosyasını manuel düzenleme; her zaman EF CLI ile oluştur.
- ❌ `utils/` içinde domain mantığı (sadece pure utility — formatDate, parseQuery, vb.).
