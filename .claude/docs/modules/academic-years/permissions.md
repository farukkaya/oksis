# Akademik Sezon — Permissions

> Bu modülün permission slug'ları, rol matrisi, yetki kontrolü mantığı.

> Genel yetki sistemi için bkz. proje kökündeki `permission-matrix.md` ve `backend/authorization-rules.md`.

---

## Permission Slug Tasarım Kuralı

Modül slug: `academic-sessions`, `class-rooms`, `school-holidays` (sub-aggregate'ler ayrı namespace'ler).

Slug format: `<module>.<action>[-<qualifier>]`

- `<module>`: kebab-case modül adı
- `<action>`: `view`, `create`, `update`, `delete`, `activate`, `archive`, `approve`, `assign-student`, `transfer-student`, vb.
- `<qualifier>` (opsiyonel): `detail`, `current`, `own`, `term` gibi spesifik scope

---

## Slug Listesi

### `season.*`

| Slug | Açıklama |
|---|---|
| `season.list.read` | Sezon listesi (aktif + arşiv) |
| `season.detail.read` | Sezon detayı |
| `season.current.read` | Aktif sezon endpoint'i (cache'li, çok yüksek hacim) |
| `season.draft.create` | Yeni sezon (Setup) |
| `season.update` | Sezon bilgilerini güncelle (sadece Setup) |
| `season.activate` | Sezonu aktive et (önceki sezon arşivlenir) ⚠️ |
| `season.archive` | Sezonu manuel arşivle (advanced, nadir) |
| `season.term.activate` | Dönemi aktive et |
| `season.term.close` | Dönemi kapat (terminal, notları kilitler, karne üretir) ⚠️ |

### `academic-calendar.*`

| Slug | Açıklama |
|---|---|
| `academic-calendar.manage` | Akademik Takvim'de yönetim aksiyonları (etkinlik ekle, dışa aktar, Sezon Yönetimi yolları). Ekran tüm rollerde görünür; bu izin yalnız yönetim öğelerini açar |

### `class-rooms.*`

| Slug | Açıklama |
|---|---|
| `class-rooms.view` | Şube listesi (aktif sezon default) |
| `class-rooms.view-detail` | Şube detayı + öğrenci listesi |
| `class-rooms.view-own` | Sadece rehber öğretmen olduğu şubeyi görme (Sprint 2'de aktive) |
| `class-rooms.create` | Yeni şube oluştur |
| `class-rooms.update` | Şube bilgilerini güncelle (kapasite, rehber öğretmen) |
| `class-rooms.approve` | Onay bekleyen şubeyi onayla (BR-AS-008 aktifse) |
| `class-rooms.archive` | Şubeyi arşivle |
| `class-rooms.assign-student` | Şubeye öğrenci ata |
| `class-rooms.transfer-student` | Öğrenciyi başka şubeye taşı |
| `class-rooms.remove-student` | Öğrenciyi şubeden çıkar |

### `school-holidays.*`

| Slug | Açıklama |
|---|---|
| `school-holidays.view` | Aktif sezonun tatil takvimini görüntüle |
| `school-holidays.create` | Tatil ekle |
| `school-holidays.update` | Tatil düzenle |
| `school-holidays.delete` | Tatil sil |

---

## Rol Matrisi

> Rol tanımları için bkz. `permission-matrix.md`. Bu modül için aşağıdaki rollerle ilgileniyoruz.

| Permission | `SuperAdmin` | `SchoolAdmin` (Müdür) | `SchoolStaff` (Müd. Yrd.) | `HomeroomTeacher` | `Teacher` | `Parent` | `Student` |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `season.list.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `season.detail.read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `season.current.read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `season.draft.create` | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
| `season.update` | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
| `season.activate` ⚠️ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `season.archive` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `season.term.activate` | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
| `season.term.close` ⚠️ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `academic-calendar.manage` | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
| `class-rooms.view` | ✅ | ✅ | ✅ | 🔒 own | ❌ | ❌ | ❌ |
| `class-rooms.view-detail` | ✅ | ✅ | ✅ | 🔒 own | ❌ | ❌ | ❌ |
| `class-rooms.view-own` | — | — | — | ✅ | — | — | — |
| `class-rooms.create` | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
| `class-rooms.update` | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ | ❌ |
| `class-rooms.approve` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `class-rooms.archive` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `class-rooms.assign-student` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `class-rooms.transfer-student` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `class-rooms.remove-student` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `school-holidays.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `school-holidays.create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `school-holidays.update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `school-holidays.delete` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Verilir (default)
- ❌ Verilmez
- ⚙️ Konfigüre edilebilir (okul ayarına göre, BR-AS-008)
- 🔒 own Scope kısıtlı — sadece kendi şubesi (resource-based authorization)

---

## Davranışsal Notlar

### `SchoolStaff` ve `class-rooms.create`

Eğer `school_settings.require_approval_for_classroom_creation = true` (BR-AS-008):
- `SchoolStaff` (Müdür Yardımcısı) şube oluşturabilir → `PendingApproval`
- `SchoolAdmin` (Müdür) `class-rooms.approve` ile onaylar
- `false` ise: `SchoolStaff` şubeyi direkt `Active` olarak oluşturur

Bu mantık permission seviyesinde değil, **command handler içinde** çalışır — permission ikisinde de `class-rooms.create` verilir, statü ayarla belirlenir.

### `HomeroomTeacher` ve `class-rooms.view-own`

Rehber öğretmen kendi şubesini görür ama:
- **Sprint 1'de aktive edilmiyor** — sadece tablo/permission tanımlı. Frontend ekranı Sprint 2'de (Öğretmen Paneli) açılır.
- Backend resource-based authorization: `IAuthorizationHandler<ClassRoomOwnRequirement, ClassRoom>` → `classRoom.HomeroomTeacherId == currentUser.TeacherId`

### `Parent` ve `Student` ve `view`

Veli ve öğrenci için "akademik sezon listesi görüntüleme" anlamlı değil — onlara sadece aktif sezon/dönem etiketi gerekir (`season.current.read`). Buna rağmen `season.list.read` veriyoruz çünkü:
- "Geçen yılın notlarını gör" Sprint 3+'ta açılacak; sezon listesi bir dropdown olarak gelir
- Frontend filtreleme yapacak — sadece kendi çocuğuna ait sezonları gösterecek (zaten erişebileceği sezonlar)

### `academic-calendar.manage` ve salt-okunur roller

Akademik Takvim ekranı **süperadmin hariç tüm rollerde** görünür (Admin + Öğretmen + Öğrenci + Veli). Yönetim aksiyonları (etkinlik ekle, dışa aktar, sezon ekseni, Sezon Yönetimi yolları) yalnız `academic-calendar.manage` iznine sahip rollere açılır; diğer roller takvimi salt-okunur görür ve yalnız **aktif sezonu** görüntüler. UI gizleme UX içindir; backend yetkilendirmesi ayrıca uygulanır (Default Deny).

### `season.activate` ve `season.term.close`

Bu iki permission ⚠️ **geri alınamaz operasyonları** yetkilendirir. Default olarak sadece `SchoolAdmin` (Müdür) rolüne verilir. `SchoolStaff` (Müdür Yardımcısı) bu iki işlemi yapamaz; **stratejik karar müdürün**.

İleride okul ayarı ile gevşetilebilir (örn. "Müdür yardımcısı dönem kapatabilir") ama Sprint 1 kapsamında yok.

---

## Implementation Notları

### Backend (.NET 10)

```csharp
// MediatR pipeline behavior
public sealed class PermissionAuthorizationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IAuthorizedRequest
{
    public async Task<TResponse> Handle(
        TRequest request, RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var required = request.RequiredPermissions;
        foreach (var slug in required)
            if (!_currentUser.HasPermission(slug))
                throw new ForbiddenException(slug);

        return await next();
    }
}
```

```csharp
// Command markers
public sealed record CreateAcademicSessionCommand(...) : IAuthorizedRequest
{
    public IReadOnlyList<string> RequiredPermissions => ["season.draft.create"];
}

public sealed record ActivateAcademicSessionCommand(...) : IAuthorizedRequest
{
    public IReadOnlyList<string> RequiredPermissions => ["season.activate"];
}
```

### Frontend (React + TanStack Query)

```tsx
// usePermission hook
const canCreateSession = usePermission("season.draft.create");

return (
  <Button disabled={!canCreateSession}>Yeni Sezon Başlat</Button>
);
```

UI seviyesinde permission'a göre buton göster/gizle; backend yine permission'ı zorla (defense-in-depth).

---

## Yasaklar

- ❌ Controller seviyesinde `[Authorize(Roles = "Admin")]` attribute (role-based değil, **permission-based** yetki).
- ❌ Permission slug'ları frontend'de hardcode etmek (constant dosyasında topla: `oksis-web/src/shared/permissions.ts`).
- ❌ `view-current` endpoint'ini permission'sız bırakmak — authenticated user yeterli ama yine de slug üzerinden yetkilendir.
- ❌ `HomeroomTeacher` için tüm `class-rooms.view` permission'ını vermek (scope-leak). Sadece `view-own`.

> Detay: `backend/authorization-rules.md`.