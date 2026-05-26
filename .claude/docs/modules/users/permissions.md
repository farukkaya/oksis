# Kullanıcı Yönetimi — Permissions

> Bu modülün permission kodları ve rol → permission eşleştirmeleri.

> Genel matris için bkz. proje kökündeki `permission-matrix.md`.

> **Çift katman güvenlik:** RBAC (rol → permission var mı?) + ABAC (scope: hangi sezon, hangi sınıf, hangi öğrenciye ait?). İki katman da aynı anda kontrol edilir.

---

## Permission Kodları

| Kod | Anlam | Domain Kapsamı |
|---|---|---|
| `users.view` | Liste görüntüleme | Person/Profile liste |
| `users.view-detail` | Detay görüntüleme | Person detayı + bağlı ilişkiler |
| `users.create` | Person + ilk profile oluşturma | POST /persons |
| `users.update` | Profil ve ilişki güncelleme | PUT /persons, /profiles, /relationships |
| `users.delete` | Soft delete | DELETE /persons |
| `users.suspend` | Hesap askıya al / aktive et | suspend/reactivate |
| `users.graduate` | Öğrenciyi mezun et | graduate |
| `users.transfer` | Nakil işlemi | transfer |
| `users.archive` | Anonimleştirme | archive |
| `users.invite` | Davet gönder (tekil + toplu) | POST /invitations |
| `users.revoke-invite` | Davet iptal | POST /invitations/{id}/revoke |
| `users.import` | Excel toplu import | preview + start |
| `users.export` | Excel/PDF dışa aktarım | GET /export |
| `roles.assign` | Rol ataması yap/iptal | role-assignments |
| `consents.manage` | KVKK paket sürümlerini yönet | bundle CRUD |

> **Not:** `users.invite` permission'ı **olmadan** kişi davet edilemez; ayrıca davet alıcısı için `roles.assign` permission'ı da gerekir (çünkü davet kabul edilince RoleAssignment üretilir). Pratikte ikisi birlikte verilir.

---

## Rol Eşleştirmeleri

> ✅ = full | 👁 = sadece kendine/kapsamına ait | 🚫 = yok | ⚙ = yapılandırılabilir

| Permission | SuperAdmin | SchoolAdmin | SchoolStaff | Teacher | Parent | Student | Secretary | Accountant |
|---|---|---|---|---|---|---|---|---|
| `users.view` | ✅ | ✅ | ✅ | 👁 (atanmış sınıflar) | 👁 (kendi çocuğu) | 👁 (kendisi) | ✅ | 👁 (ödeme-sorumluları) |
| `users.view-detail` | ✅ | ✅ | ✅ | 👁 (atanmış sınıflar) | 👁 (kendi çocuğu) | 👁 (kendisi) | ✅ | 👁 (ödeme-sorumluları) |
| `users.create` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.update` | ✅ | ✅ | 👁 (sınırlı alanlar) | 👁 (self) | 👁 (self) | 👁 (self) | 👁 (sınırlı alanlar) | 🚫 |
| `users.delete` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.suspend` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.graduate` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.transfer` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.archive` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.invite` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | ✅ | 🚫 |
| `users.revoke-invite` | ✅ | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 👁 (kendi gönderdiği) | 🚫 |
| `users.import` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `users.export` | ✅ | ✅ | ✅ | 👁 (atanmış sınıflar) | 🚫 | 🚫 | ✅ | 👁 (finans verileri) |
| `roles.assign` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `consents.manage` | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |

---

## Resource-Level Scope Kuralları (ABAC)

Permission yetmez, kapsam (scope) da kontrol edilir. Authorization handler her isteğin sonunda **scope evaluator**'a uğrar:

### Teacher

```csharp
// Sadece atandığı sınıfların öğrenci/velilerine erişebilir.
HasPermission(currentUser, "users.view-detail")
  && (
    targetPerson.Id == currentUser.PersonId  // kendisi
    || ClassroomModule.IsStudentInTeacherClasses(targetPerson.Id, currentUser.PersonId, currentSeasonId)
    || ClassroomModule.IsParentOfStudentInTeacherClasses(targetPerson.Id, currentUser.PersonId, currentSeasonId)
  )
```

### Parent

```csharp
// Sadece kendisi + sahip olduğu yetki tipindeki çocukları.
HasPermission(currentUser, "users.view-detail")
  && (
    targetPerson.Id == currentUser.PersonId
    || ParentStudentRelationship.Exists(
         parentPersonId: currentUser.PersonId,
         studentPersonId: targetPerson.Id,
         requiredFlag: r => r.CanViewInfo
       )
  )
```

### Student

```csharp
// Sadece kendisi.
targetPerson.Id == currentUser.PersonId
```

### SchoolStaff (Secretary, koordinatör)

```csharp
// SchoolAdmin kadar geniş okuma, ancak değiştirme yetkisi sınırlı alanlara
// (örn. iletişim bilgileri update edilebilir, role assignment yapılamaz).
HasPermission(currentUser, "users.update")
  && AllowedFieldsOnly(request.Body, allowedFields: ["primaryEmail", "primaryPhone", "address"])
```

### Accountant

```csharp
// Sadece ödeme sorumlusu olan veliler ve onların çocukları.
HasPermission(currentUser, "users.view-detail")
  && (
    targetPerson.HasParentProfile && ParentStudentRelationship.Any(
        p => p.ParentPersonId == targetPerson.Id && p.IsPaymentResponsible
      )
    || targetPerson.HasStudentProfile && ParentStudentRelationship.Any(
        p => p.StudentPersonId == targetPerson.Id && p.IsPaymentResponsible
      )
  )
```

---

## Sezon Bazlı Scope

`RoleAssignment.SeasonId` üzerinden:

- Bir kullanıcının **şu anki** rolü = `RoleAssignments.Where(r => r.PersonId == userId && r.SeasonId == currentSeasonId && r.Status == Active)`.
- Geçmiş sezona ait sorgu için (örn. "2024-2025'te 9-A'da kimler vardı?"), `users.view-detail` permission'ı + `seasons.view-archived` permission'ı birlikte gerekir (default sadece SchoolAdmin'de).
- Bir öğretmenin "aktif" olup olmadığı, sezona göre değişir — `IsActive(personId, seasonId)` helper'ı `RoleAssignment` üzerinden hesaplanır.

---

## Field-Level Hassasiyet

Bazı alanlar **permission OK** olsa bile sadece SchoolAdmin/SuperAdmin'e tam görünür. Diğer rollere maskelenir.

| Alan | SchoolAdmin/SuperAdmin | SchoolStaff | Teacher | Parent (self) | Student (self) | Accountant |
|---|---|---|---|---|---|---|
| `nationalId` (TCKN) | ✅ full | 👁 last 4 | 🚫 | ✅ full | 👁 last 4 | ✅ full (fatura) |
| `birthDate` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `primaryEmail` / `primaryPhone` | ✅ | ✅ | 👁 (öğrenci için → veli iletişimi) | ✅ | ✅ | ✅ |
| `address` | ✅ | ✅ | 🚫 | ✅ | 👁 (görür ama düzenleyemez) | ✅ |
| `bloodType`, `emergencyContact` | ✅ | ✅ | ✅ (acil durum gerekçeli) | ✅ | ✅ | 🚫 |
| `passwordHash` | 🚫 (DB-only) | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 |
| `accountLifecycleEvents` | ✅ | 👁 (son 30 gün) | 🚫 | 🚫 | 🚫 | 🚫 |

> Maskeleme **DTO katmanında** Mapster projection ile yapılır; domain entity'de tüm alanlar açıktır.

---

## Davet ve Onboarding'de Özel Kurallar

- **Davet token endpoint'i** (`GET /invitations/by-token/{token}`) anonymous'tur ancak rate-limit'lidir (IP başına 10 req/dk).
- **Accept endpoint'i** (`POST /invitations/accept`) anonymous'tur; token doğrulaması authentication yerine geçer.
- **Davet kabulü sırasında KVKK `DataProcessing` reddedilirse** → akış başlamaz, hesap açılmaz, davet `Sent` durumunda kalır.
- Aynı kişi farklı sezon için aynı anda davet alabilir mi? **Hayır** — `(PersonId, SeasonId)` için aktif davet uniquesi var.

---

## Default Deny

Matriste açıkça verilmemiş = **erişim yok**. Yeni permission eklendiğinde tüm rollere default `🚫` gelir.

Yeni rol eklenirse (örn. `Counselor`) **tüm permission'larda** açık tanımlama yapılmadığı sürece o rol hiçbir endpoint'e erişemez.

> Detay: `permission-matrix.md` § 7.

---

## Test Stratejisi

Bu modülün authorization'ı için **integration test zorunlu** — unit test yetmez. Senaryolar:

- `TeacherCannotViewStudentNotInHisClasses`
- `ParentCannotViewOtherFamilyStudent`
- `DivorcedParentWithoutDecisionRightCannotApprovePermissionSlip`
- `SuspendedPersonCannotLogin` (identity modülü işbirliği)
- `RevokedConsentBlocksDownstreamModuleAccess`
- `SeasonChangeDoesNotAutoRevokeActiveRoleAssignment` (sadece sezon kapanışı job'ı yapar)
- `BulkInviteRequiresBothInviteAndAssignPermissions`
