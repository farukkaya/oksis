# Kimlik Doğrulama — Permissions

> Bu modülün permission kodları, rol → permission eşleştirmeleri ve **iki katmanlı yetkilendirme** (RBAC + ABAC).
> Kaynak: teknik analiz Bölüm 9. Genel matris için bkz. proje kökündeki `permission-matrix.md`.

---

## İki Katmanlı Yetkilendirme

Teknik analiz Senaryo 3 (boşanmış veli) iki katmanı zorunlu kılar:

- **RBAC** — rol bazlı izinler (örn. `permissions.approve`). Permission cache'ten okunur.
- **ABAC** — `ParentStudentRelationship` bayrakları (`CanMakeDecisions`, `IsPaymentResponsible`, `CanPickup`, `CanViewInfo`) — kaynak + çocuk bağlamına göre runtime kontrol.

> **Kural (TR-auth-003):** "RBAC izin var ama ABAC bayrağı false" durumunda **her zaman ABAC kazanır (deny)**. Velayet/KVKK ihlallerini önler.

### Authorization Bileşenleri

| Bileşen | Tip | İş |
|---|---|---|
| `PermissionRequirement` + `PermissionAuthorizationHandler` | RBAC | Permission cache'ten okur |
| `ChildScopeRequirement` + handler | ABAC | route/body `childId` ↔ `ParentStudentRelationship` bayrağı (users read-port); reddederse `403` + `PermissionDenied` audit |
| `PersonAccessGuard` (`IPersonAccessGuard`) | ABAC | Kişi-detay kapsamı: geniş kapsam = `users.view-all` izni (`IPermissionReader`, RBAC ile aynı runtime kaynağı — **JWT rolü değil**); aksi halde self / veli→`CanViewInfo`'lu çocuk / öğretmen→kendi sınıfı. Tüketici: `GetPersonDetailQueryHandler`. |
| `ActiveSeasonWritePolicy` | Policy | `activeSeasonId != School.CurrentSeason` ise yazma endpoint'leri `403` (salt-okunur sezon) |

---

## Permission Cache (Redis)

```
Key:   permissions:{accountId}:{activeProfileType}:{seasonId}
Value: Set<string> (efektif permission kodları)
TTL:   oturum süresi (~30 dk)
```

- Bağlam çözüldükten sonra efektif permission'lar (`permissions` modülünden) hesaplanır, cache'lenir.
- **Profile / Season switch** → ilgili key invalidate, `perms_ver++`, yeni JWT.
- **Child switch** → permission **değişmez** (parent rolü aynı), sadece server-side child session güncellenir.
- JWT'ye permission listesi gömülmez; yalnızca `perms_ver` (cache versiyonu) taşınır (TQ-auth-002, varsayılan: cache).

> **En kritik risk:** permission cache eski kalır → yetki sızar. Switch'te zorunlu invalidation + `perms_ver` bump + yeni JWT; idempotent invalidate. **Integration test zorunlu.**

---

## Permission Kodları (mevcut 32 izin · seed edilmiş)

Format `{module}.{action}` (küçük harf). Modül dağılımı: USERS (5), ATTENDANCE (2), GRADES (3), SCHEDULE (2), ANNOUNCEMENTS (2), REPORTS (2), SETTINGS (2), DUTY (2), HOMEWORK (2), SCHOOL_SETTINGS (10).

### Identity/Auth ile ilgili eklenecek izinler (HEDEF)

| Kod | Anlam |
|---|---|
| `seasons.view-archived` | Geçmiş (salt-okunur) sezonu görüntüle (season switch) |
| `accounts.unlock` | Admin: kilitli hesabı aç |
| `accounts.force-logout` | Admin: kullanıcının tüm oturumlarını sonlandır |

> ABAC bayrakları permission kodu değildir; `users` modülünün `ParentStudentRelationship` verisinden runtime okunur.

---

## Rol Default Matrisi (mevcut · 66 satır seed)

| Rol | İzin | Modüller |
|---|---|---|
| SUPER_ADMIN | cross-tenant bypass + `X-Tenant-Override` | — |
| SCHOOL_ADMIN | 32 | tüm modüller + SCHOOL_SETTINGS (10) |
| VICE_PRINCIPAL | 12 | USERS(3) + ATTENDANCE(2) + GRADES(1) + SCHEDULE(2) + ANNOUNCEMENTS(2) + DUTY(2) |
| TEACHER | 8 | ATTENDANCE(2) + GRADES(3) + SCHEDULE(1) + ANNOUNCEMENTS(1) + HOMEWORK(2) |
| COUNSELOR | 4 | ATTENDANCE(1) + GRADES(1) + REPORTS(1) + ANNOUNCEMENTS(1) |
| PARENT | 4 | ATTENDANCE(1) + GRADES(1) + HOMEWORK(1) + ANNOUNCEMENTS(1) |
| STUDENT | 5 | GRADES(1) + ATTENDANCE(1) + HOMEWORK(1) + ANNOUNCEMENTS(1) + SCHEDULE(1) |

> Yeni `accounts.*` / `seasons.view-archived` izinleri eklenirken `role_permissions` seed + `permission-matrix.md` birlikte güncellenir.

---

## Resource-Level Scope

- **Teacher** → atandığı sınıflar · **Parent** → kendi çocukları (ABAC bayrakları) · **Student** → kendisi
- **SchoolAdmin/VicePrincipal/Counselor** → tek okul (EF tenant filter) · **SuperAdmin** → cross-tenant (`X-Tenant-Override` + audit)

## Default Deny

Matriste açıkça verilmemiş = erişim yok. `[HasPermission("x.y")]` yoksa endpoint sadece JWT validate eder; ek yetki açıkça eklenmeli.

> Detay: `permission-matrix.md`, `backend/security-rules.md`.
