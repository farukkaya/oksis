# Naming Conventions

> Tutarlılık = okunabilirlik = bakım kolaylığı. AI her seferinde aynı isimlendirme stratejisini kullanmalıdır.

---

## 1. Domain Dili (Ubiquitous Language)

Türkçe okul terimleri için **kod içinde İngilizce karşılık sabittir**:

| Türkçe | Kod | Açıklama |
|---|---|---|
| Okul | `School` | Tenant kavramı (= TenantId, SchoolId) |
| Sezon / Eğitim yılı | `AcademicYear` | 2025-2026 gibi |
| Dönem | `Term` | Güz / Bahar |
| Sınıf (seviye) | `Grade` | 5. sınıf, 9. sınıf |
| Şube | `ClassRoom` veya `Section` | 5-A, 9-B (tercih: `ClassRoom`) |
| Ders | `Subject` | Matematik, Fizik |
| Ders programı / haftalık | `Timetable` veya `Schedule` (tercih: `Timetable`) |
| Yoklama | `Attendance` |
| Devamsızlık | `Absence` |
| Not | `Grade` ← çakışma! → kullan: **`Mark`** |
| Sınav | `Exam` |
| Ödev | `Homework` veya `Assignment` (tercih: `Homework`) |
| Karne | `ReportCard` |
| Duyuru | `Announcement` |
| Mesaj | `Message` |
| Bildirim | `Notification` |
| Veli | `Parent` |
| Öğrenci | `Student` |
| Öğretmen | `Teacher` |
| Yönetim | `Admin` veya `SchoolAdmin` |

> ⚠️ "Grade" hem sınıf seviyesi hem not anlamına gelebileceği için **not için `Mark` kullanılır**.

---

## 2. Backend (C# / .NET)

### Genel
- **PascalCase**: class, method, property, public field, enum, namespace
- **camelCase**: local variable, parameter
- **_camelCase**: private field (örn. `_dbContext`)
- **UPPER_SNAKE**: yalnızca `const` ve ortam değişkenleri (`const int MAX_PAGE_SIZE = 100;`)
- **Async metodlar** her zaman `Async` suffix'i: `GetByIdAsync`
- **Boolean property**: `Is`, `Has`, `Can` prefix'i (`IsActive`, `HasParent`, `CanPublish`)

### Entity
- Tekil isim: `Student`, `Attendance`, `Mark` (Students DEĞİL)
- PK: `Id` (Guid, varsayılan)
- FK: `{EntityName}Id` (`StudentId`, `SchoolId`)
- Audit kolonları: `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`, `IsDeleted`, `DeletedAt`, `DeletedBy`
- Tenant kolonu: `SchoolId` (zorunlu — tüm tenant tablolarda)

### DTO
- Suffix zorunlu: `StudentDto`, `CreateStudentRequest`, `UpdateStudentRequest`, `StudentListItemDto`
- Liste DTO'ları: `{Entity}ListItemDto` (full DTO'dan daha az alan)
- Detay DTO'ları: `{Entity}DetailDto`

### Command / Query (MediatR)
- Command: `{Verb}{Entity}Command` → `CreateStudentCommand`, `PublishMarkCommand`
- Query: `Get{Entity}{By/List}Query` → `GetStudentByIdQuery`, `ListStudentsQuery`
- Handler: `{CommandName}Handler` → `CreateStudentCommandHandler`
- Validator: `{CommandName}Validator` → `CreateStudentCommandValidator`

### Service / Interface
- Interface: `I` prefix → `INotificationService`, `ITenantContext`
- Implementation: `{Name}Service` → `NotificationService`
- Background job: `{Action}Job` → `SendDailyDigestJob`

### API Controller / Endpoint
- Controller: `{Resource}Controller` (resource çoğul) → `StudentsController`
- Route: kebab-case, çoğul → `/api/v1/students`, `/api/v1/academic-years`
- Action ismi: HTTP method'a uygun verb → `GetById`, `Create`, `Update`, `Delete`, `List`

### Enum
- Tekil PascalCase → `enum AttendanceStatus { Present, Absent, Late, Excused }`
- Bit flag'lerde `[Flags]` ve çoğul → `[Flags] enum Permissions { ... }`

### Domain Event
- Geçmiş zaman → `StudentEnrolledEvent`, `MarkPublishedEvent`, `AttendanceTakenEvent`

### Exception
- Suffix `Exception` → `TenantMismatchException`, `BusinessRuleViolationException`

---

## 3. Database (SQL Server)

- **snake_case**, çoğul tablo isimleri → `students`, `school_admins`, `academic_years`
- Kolon: snake_case → `created_at`, `school_id`, `is_active`
- PK: `id`
- FK: `{entity}_id` → `student_id`, `school_id`
- Index: `ix_{table}_{column(s)}` → `ix_students_school_id`, `ix_attendance_school_id_date`
- Unique index: `ux_{table}_{column(s)}` → `ux_users_email`
- Composite tenant index: tenant kolonu her zaman **ilk** sırada
- Foreign key constraint: `fk_{table}_{ref_table}_{column}` → `fk_students_schools_school_id`
- Migration ismi: `{Date}_{Action}` → `20250515_AddAttendanceTable` (EF Core)

---

## 4. Frontend (React + TypeScript)

### Genel
- **PascalCase**: component, type, interface, enum, class
- **camelCase**: variable, function, hook, prop, file (component dışı)
- **kebab-case**: folder isimleri, route path
- **UPPER_SNAKE**: const (`const MAX_ITEMS = 50`)

### Dosya İsimlendirme
| Tip | Pattern | Örnek |
|---|---|---|
| Component | PascalCase.tsx | `StudentList.tsx` |
| Hook | camelCase.ts, `use` prefix | `useStudentList.ts` |
| Type / Interface | camelCase.types.ts | `student.types.ts` |
| API client | camelCase.api.ts | `students.api.ts` |
| Query keys | camelCase.keys.ts | `students.keys.ts` |
| Utility | camelCase.ts | `formatDate.ts` |
| Constants | camelCase.constants.ts | `attendance.constants.ts` |
| Validation schema | camelCase.schema.ts | `createStudent.schema.ts` |
| Test | `{Name}.test.tsx` | `StudentList.test.tsx` |

### Component
- Component dosyası: `{Component}/index.tsx` veya `{Component}.tsx`
- Props interface: `{Component}Props` → `interface StudentListProps {...}`
- Style modülü: `{Component}.module.css` (kullanılırsa)

### Hook
- `use` prefix zorunlu → `useStudent`, `useAttendanceForm`
- Mutation hook: `use{Verb}{Entity}Mutation` → `useCreateStudentMutation`
- Query hook: `use{Entity}Query` veya `use{Entity}sQuery` → `useStudentsQuery`

### React Query Keys
Yapı: `[domain, action, ...params]`
```ts
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: StudentFilters) => [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};
```

### Route Path
- kebab-case → `/students`, `/academic-years`, `/parent/my-children`
- Dynamic: `:id` → `/students/:id/edit`

### Event Handler
- `handle` prefix → `handleSubmit`, `handleRowClick`
- Prop olarak geçirilirken `on` prefix → `<Form onSubmit={handleSubmit} />`

### Boolean Props / State
- `is`, `has`, `should`, `can` prefix → `isLoading`, `hasError`, `shouldShowModal`, `canEdit`

---

## 5. API Endpoint İsimlendirme

- **REST resource odaklı, çoğul, kebab-case**
- Versiyon her route'ta: `/api/v1/...`

| Action | Method | Path |
|---|---|---|
| List | GET | `/api/v1/students` |
| Detail | GET | `/api/v1/students/{id}` |
| Create | POST | `/api/v1/students` |
| Update | PUT | `/api/v1/students/{id}` |
| Partial update | PATCH | `/api/v1/students/{id}` |
| Delete | DELETE | `/api/v1/students/{id}` |
| Sub-resource | GET | `/api/v1/students/{id}/parents` |
| Action (non-CRUD) | POST | `/api/v1/marks/{id}/publish` |

> Detay: `backend/api-design-rules.md`

---

## 6. Branch / Commit / PR

| Tip | Pattern | Örnek |
|---|---|---|
| Branch | `{type}/{ticket}-{slug}` | `feat/OKS-123-student-list`, `fix/OKS-456-attendance-bug` |
| Commit | Conventional Commits | `feat(students): add bulk import`, `fix(auth): refresh token expiry` |
| PR Title | `[OKS-XXX] {Verb} {short desc}` | `[OKS-123] Add student bulk import` |

> Detay: `git-commit-rules.md`

---

## 7. Çakışma Çözümü Önceliği

Tek bir kelime birden fazla anlam taşıdığında:

1. Domain dilinde Türkçeden gelen anlam korunur.
2. .NET framework keyword'leri ile çakışma → suffix ekle (`Class` → `ClassRoom`).
3. Yine çakışma varsa modül namespace'i ile ayır (`Oksis.Application.Modules.Grades.GradeLevel` vs `...Marks.Mark`).
