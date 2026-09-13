# OKSİS — Domain Model Rules

> Bu dosya OKSİS'in **çekirdek domain modelini** ve entity ilişki kurallarını tanımlar. AI yeni entity üretirken **mutlaka** burada tanımlı ilişki ve invariant'lara uymalıdır.

---

## 1. Çekirdek Aggregate'ler

OKSİS'te aşağıdaki aggregate root'lar vardır. Her aggregate kendi tutarlılık sınırını yönetir.

| Aggregate Root | Sorumluluk | Tenant Bağı |
|----------------|------------|-------------|
| `School` | Tenant (okul) bilgisi, plan, ayarlar | — (kendisi tenant) |
| `AcademicYear` | Eğitim-öğretim yılı, dönemler | `SchoolId` |
| `User` | Kullanıcı kimliği, login bilgisi | `SchoolId` (SuperAdmin hariç) |
| `Student` | Öğrenci profili | `SchoolId` |
| `Parent` | Veli profili (User'a bağlı) | `SchoolId` |
| `Teacher` | Öğretmen profili (User'a bağlı) | `SchoolId` |
| `Class` | Sınıf/şube (örn. 7-A) | `SchoolId` |
| `Subject` | Ders (Matematik, Türkçe...) | `SchoolId` |
| `AttendanceSession` | Bir günün bir dersinin yoklama oturumu | `SchoolId` |
| `MarkBook` | Bir sınıf-ders için not defteri | `SchoolId` |
| `Homework` | Ödev | `SchoolId` |
| `Announcement` | Duyuru | `SchoolId` |
| `Conversation` | Mesajlaşma konuşması | `SchoolId` |

> **Kural:** Bir aggregate'in içinden başka aggregate root'a sadece **ID ile referans** verilir, navigation property ile değil. Navigation property sadece aynı aggregate içindeki entity'ler için kullanılır.

---

## 2. Ana Entity'ler ve İlişkileri

### 2.1 School (Tenant)

```csharp
public sealed class School : AggregateRoot<SchoolId>
{
    public string Name { get; private set; }
    public string Code { get; private set; }              // Tekil okul kodu, örn. "ATA-IST"
    public SchoolType Type { get; private set; }          // Anaokulu/İlkokul/Ortaokul/Lise
    public TenantStatus Status { get; private set; }      // Setup/Active/Suspended/Archived
    public PlanCode Plan { get; private set; }            // Free/Standard/Premium
    public string TimeZone { get; private set; }          // Default "Europe/Istanbul"
    public SchoolSettings Settings { get; private set; }  // Value object
    // Audit alanları base class'tan
}
```

- `Code` global tekildir (cross-tenant unique). `Name` tekil değildir.
- Status geçişleri: `Setup → Active → Suspended → Active → Archived`. `Archived` terminal.
- **Asla** doğrudan silinmez. `Archived` ile soft kapatılır.

### 2.2 User (Identity)

```csharp
public sealed class User : AggregateRoot<UserId>
{
    public SchoolId? SchoolId { get; private set; }       // SuperAdmin için null
    public string Email { get; private set; }             // (SchoolId, Email) unique
    public string? Phone { get; private set; }
    public string PasswordHash { get; private set; }
    public UserStatus Status { get; private set; }        // Active/Locked/Disabled
    public bool MustChangePassword { get; private set; }
    public DateTimeOffset? LastLoginAt { get; private set; }
    public IReadOnlyCollection<UserRole> Roles { get; }   // Owned collection (aynı agg.)
}
```

- Bir User birden fazla `Role`'e sahip olabilir (örn. Teacher + Parent — kendisi öğretmen, çocuğu da o okulda).
- Email tenant scope'unda unique: `(SchoolId, Email)` index unique. SuperAdmin için global unique.
- Parent/Teacher/Student "profil" entity'leri User'a 1-1 bağlanır (`UserId` FK).

### 2.3 Student

```csharp
public sealed class Student : AggregateRoot<StudentId>
{
    public SchoolId SchoolId { get; private set; }
    public UserId? UserId { get; private set; }           // Student login alıyorsa
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public string StudentNo { get; private set; }         // Okul içi tekil
    public DateOnly BirthDate { get; private set; }
    public Gender Gender { get; private set; }
    public ClassId? CurrentClassId { get; private set; }  // Mevcut sınıf
    public StudentStatus Status { get; private set; }     // Active/Graduated/Transferred/Withdrawn
}
```

### 2.4 Parent — Student ilişkisi (M-N)

```csharp
public sealed class StudentParent : Entity
{
    public StudentId StudentId { get; private set; }
    public ParentId ParentId { get; private set; }
    public ParentRelation Relation { get; private set; }  // Mother/Father/Guardian/Other
    public bool IsPrimary { get; private set; }           // Birincil veli (1 tane olabilir)
    public bool CanPickUp { get; private set; }
    public bool ReceivesNotifications { get; private set; }
}
```

- Bir öğrencinin **birden fazla** velisi olabilir.
- Bir veli **birden fazla** çocuğa bağlı olabilir (kardeşler).
- En az 1 veli `IsPrimary = true` olmalı (invariant).

### 2.5 Class — Teacher — Subject

```csharp
public sealed class Class : AggregateRoot<ClassId>
{
    public SchoolId SchoolId { get; private set; }
    public AcademicYearId AcademicYearId { get; private set; }
    public string Name { get; private set; }              // "7-A"
    public int Grade { get; private set; }                // 1-12 (sınıf seviyesi)
    public TeacherId? HomeroomTeacherId { get; private set; } // Sınıf öğretmeni
    public int Capacity { get; private set; }
}

public sealed class ClassSubjectAssignment : Entity
{
    public ClassId ClassId { get; private set; }
    public SubjectId SubjectId { get; private set; }
    public TeacherId TeacherId { get; private set; }      // Bu derse giren öğretmen
    public int WeeklyHours { get; private set; }
}
```

> **Kural:** Bir sınıf-ders ikilisine bir akademik yılda **bir** öğretmen atanır. Değişiklik için tarih bazlı history tablosu (`ClassSubjectAssignmentHistory`) tutulur.

### 2.6 AttendanceSession

```csharp
public sealed class AttendanceSession : AggregateRoot<AttendanceSessionId>
{
    public SchoolId SchoolId { get; private set; }
    public ClassId ClassId { get; private set; }
    public SubjectId? SubjectId { get; private set; }     // Null = günlük yoklama
    public DateOnly Date { get; private set; }
    public int Period { get; private set; }               // 1-8 ders saati
    public TeacherId TakenByTeacherId { get; private set; }
    public AttendanceSessionStatus Status { get; private set; } // Draft/Completed/Locked
    public IReadOnlyCollection<AttendanceRecord> Records { get; } // Owned
}

public sealed class AttendanceRecord : Entity
{
    public StudentId StudentId { get; private set; }
    public AttendanceStatus Status { get; private set; }  // Present/Absent/Late/Excused
    public string? Note { get; private set; }
}
```

- Tekillik: `(SchoolId, ClassId, SubjectId, Date, Period)` unique.
- Bir session ancak `Completed` olduktan sonra bildirim üretir (`AttendanceCompleted` domain event).
- `Locked` durumunda artık değiştirilemez; sadece SchoolAdmin "düzeltme" yapabilir (audit'lenir).

### 2.7 MarkBook — Mark

```csharp
public sealed class MarkBook : AggregateRoot<MarkBookId>
{
    public SchoolId SchoolId { get; private set; }
    public AcademicYearId AcademicYearId { get; private set; }
    public ClassId ClassId { get; private set; }
    public SubjectId SubjectId { get; private set; }
    public Term Term { get; private set; }                // First/Second
    public IReadOnlyCollection<MarkEntry> Entries { get; }
}

public sealed class MarkEntry : Entity
{
    public StudentId StudentId { get; private set; }
    public MarkType Type { get; private set; }            // Exam1/Exam2/Performance/Project
    public decimal? Score { get; private set; }           // 0-100
    public MarkStatus Status { get; private set; }        // Draft/Published/Locked
    public DateTimeOffset? PublishedAt { get; private set; }
}
```

- **Sadece** `Published` durumda veli/öğrenci bildirimi tetiklenir.
- `Locked` → akademik yıl kapandığında otomatik olur; değiştirmek için SchoolAdmin onayı gerekir (gelecek sürüm).

### 2.8 Homework

```csharp
public sealed class Homework : AggregateRoot<HomeworkId>
{
    public SchoolId SchoolId { get; private set; }
    public ClassId ClassId { get; private set; }
    public SubjectId SubjectId { get; private set; }
    public TeacherId AssignedByTeacherId { get; private set; }
    public string Title { get; private set; }
    public string Description { get; private set; }
    public DateOnly DueDate { get; private set; }
    public HomeworkStatus Status { get; private set; }    // Draft/Published/Closed
    public IReadOnlyCollection<HomeworkAttachment> Attachments { get; }
}
```

### 2.9 Announcement

```csharp
public sealed class Announcement : AggregateRoot<AnnouncementId>
{
    public SchoolId SchoolId { get; private set; }
    public UserId AuthorUserId { get; private set; }
    public AnnouncementAudience Audience { get; private set; }   // All/Parents/Teachers/Students/SpecificClasses
    public IReadOnlyCollection<ClassId> TargetClassIds { get; }  // Audience = SpecificClasses ise
    public string Title { get; private set; }
    public string Body { get; private set; }
    public DateTimeOffset PublishedAt { get; private set; }
    public AnnouncementPriority Priority { get; private set; }   // Normal/High/Critical
}
```

### 2.10 Conversation — Message

```csharp
public sealed class Conversation : AggregateRoot<ConversationId>
{
    public SchoolId SchoolId { get; private set; }
    public ConversationType Type { get; private set; }    // ParentTeacher/StudentTeacher/Group
    public IReadOnlyCollection<ConversationParticipant> Participants { get; }
    public IReadOnlyCollection<Message> Messages { get; } // Pagination'lı yüklenir
}
```

> Detay messaging kuralları: `business-rules.md` §6.

---

## 3. Genel Entity Kuralları

### 3.1 Base Class'lar

```csharp
public abstract class Entity
{
    public Guid Id { get; protected set; }
    public override bool Equals(object? obj) => /* Id-based equality */;
}

public abstract class AggregateRoot<TId> : Entity, IHasDomainEvents
{
    private readonly List<IDomainEvent> _events = new();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _events;
    protected void Raise(IDomainEvent @event) => _events.Add(@event);
    public void ClearDomainEvents() => _events.Clear();
}

public abstract class TenantAggregateRoot<TId> : AggregateRoot<TId>, IHasTenant
{
    public SchoolId SchoolId { get; protected set; }
}
```

### 3.2 Audit Alanları (zorunlu)

Tüm aggregate root'larda:

```csharp
public DateTimeOffset CreatedAt { get; private set; }
public UserId CreatedBy { get; private set; }
public DateTimeOffset? UpdatedAt { get; private set; }
public UserId? UpdatedBy { get; private set; }
public bool IsDeleted { get; private set; }            // Soft delete
public DateTimeOffset? DeletedAt { get; private set; }
public UserId? DeletedBy { get; private set; }
public uint Version { get; private set; }              // Optimistic concurrency (xmin/rowversion)
```

`SaveChangesInterceptor` bu alanları otomatik doldurur. Handler bu alanlara dokunmaz.

### 3.3 Strongly-Typed ID'ler

Tüm ID'ler strongly-typed olur:

```csharp
public readonly record struct StudentId(Guid Value)
{
    public static StudentId New() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}
```

- `Guid` doğrudan kullanılmaz; karışıklığı önler.
- EF Core için `ValueConverter` Configuration'da tanımlanır.

### 3.4 Value Object Kullanımı

- `Email`, `PhoneNumber`, `Address`, `Money`, `DateRange`, `SchoolSettings` → value object.
- Immutable, equality value-based. C# `record` veya `readonly record struct`.

---

## 4. İlişki Kuralları (Cardinality)

| İlişki | Cardinality | Notlar |
|--------|-------------|--------|
| School → User | 1-N | SuperAdmin hariç tüm User'lar bir School'a bağlıdır |
| User ↔ Student | 1-0..1 | Her Student'in User'ı olmayabilir (küçük çocuk) |
| User ↔ Parent | 1-1 | Parent her zaman User'a bağlı |
| User ↔ Teacher | 1-1 | Teacher her zaman User'a bağlı |
| Student ↔ Parent | M-N | `StudentParent` join entity |
| Student ↔ Class | N-1 | `CurrentClassId` + tarih bazlı `StudentClassHistory` |
| Class ↔ Subject | M-N | `ClassSubjectAssignment` |
| Teacher → ClassSubjectAssignment | 1-N | |
| AttendanceSession → AttendanceRecord | 1-N (owned) | Aynı aggregate |
| MarkBook → MarkEntry | 1-N (owned) | Aynı aggregate |

---

## 5. Invariant Kuralları (domain ihlal etmemeli)

1. **Tek primary veli:** Bir Student için `StudentParent.IsPrimary = true` olan tam **1** kayıt olmalı.
2. **Tek aktif sınıf:** Bir Student aynı anda sadece 1 `Class`'a `Active` olabilir.
3. **Yoklama tekrarsız:** Aynı (Date, Period, Class, Subject) için 2 session açılamaz.
4. **Yıl içi öğretmen ataması:** Bir (Class, Subject, AcademicYear) için aynı anda 1 aktif Teacher.
5. **Mark Published → Locked:** Published mark direkt güncellenemez; ancak "düzeltme" (admin) ile.
6. **Tenant bütünlüğü:** Cross-tenant referans yok. Bir Class'ın `SchoolId`'si öğrencisinin `SchoolId`'si ile **aynı** olmalı (DB constraint + handler doğrulama).
7. **AcademicYear çakışmaz:** Bir okulda aynı tarih aralığında 2 `AcademicYear` olamaz.

> İhlal → `DomainException` (handler tarafında `Result.Failure` döner; 422 Unprocessable Entity).

---

## 6. Domain Event Kuralları

Aggregate root içinde state değişirken event raise edilir. Event'ler **`SaveChangesAsync` sonrası** dispatch edilir (Outbox pattern).

**Olay isimlendirme:** `{Aggregate}{PastTenseAction}` örn:

- `AttendanceSessionCompleted`
- `MarkPublished`
- `HomeworkAssigned`
- `AnnouncementPublished`
- `StudentEnrolledToClass`
- `UserCreated`

```csharp
public sealed record MarkPublished(
    SchoolId SchoolId,
    MarkBookId MarkBookId,
    StudentId StudentId,
    MarkType Type,
    decimal Score) : IDomainEvent;
```

> Detay: `backend/notification-rules.md` + `backend/background-job-rules.md` (Outbox).

---

## 7. Migration & DDL Kuralları

- Tablo: `snake_case` (`students`, `student_parents`, `attendance_sessions`).
- Kolon: `snake_case` (`school_id`, `created_at`).
- Tenant tablolarında **ilk kolon** `school_id` ve **composite index** ile bu kolon başta:
  - `ix_attendance_sessions_school_id_date_class_id`
- FK'larda `ON DELETE` davranışı:
  - Tenant tablolarında **`ON DELETE NO ACTION`** (yanlışlıkla cascade ile veri uçmasın). Soft delete kullanılır.
  - Owned/child collection'larda `ON DELETE CASCADE` (aynı aggregate).
- Tüm tenant tablolarında `(school_id, id)` composite primary key **opsiyonel** ama join performansı için önerilir (V2'de değerlendirilebilir).
- Detay: `backend/database-rules.md`.

---

## 8. Yasak Pratikler

- ❌ Aggregate dışı navigation property (cross-aggregate `.Include(...)`).
- ❌ Public setter'lı entity (state encapsulation kırılır).
- ❌ Entity içinde `DbContext` veya repository injection (anemic+).
- ❌ Domain'de `DateTime.Now` / `DateTime.UtcNow` (Time provider injection).
- ❌ Domain projesinde EF Core attribute (`[Table]`, `[Column]`...). Konfigürasyon `Infrastructure` katmanında.
- ❌ `Guid` primary key'i strongly-typed ID olmadan kullanmak.
- ❌ Hard delete (Migration/admin script hariç).

---

## 9. AI Direktifleri

1. Yeni bir kavram üretmeden önce mevcut aggregate'ları **mutlaka** kontrol et.
2. Tenant entity'si yazıyorsan `TenantAggregateRoot<TId>` veya `IHasTenant` implement et.
3. Strongly-typed ID kullan; `Guid` kabul etme.
4. State değişiminde domain event raise et.
5. Invariant ihlalini `DomainException` ile fırlat.
6. Bir alan ekliyorsan: hangi handler dolduracak? Audit otomatik mi? Migration gerekli mi? — bunlara cevap ver.
