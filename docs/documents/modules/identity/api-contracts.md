# Kimlik Doğrulama — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Kaynak: teknik analiz Bölüm 10. Versiyon prefix: `/api/v1`.
> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

---

## Endpoint Özeti

| Endpoint | Method | Auth | Sonuç | Hata Kodları |
|---|---|---|---|---|
| `/auth/login` | POST | Anonim | `200` AuthResult / `409` NeedsProfileSelection | `401` uniform, `403` suspended, `429` rate limit |
| `/auth/refresh` | POST | Refresh | `200` AuthResult | `401` invalid/revoked |
| `/auth/logout` | POST | Bearer | `204` | `401` |
| `/auth/logout-all` | POST | Bearer | `204` | `401` |
| `/auth/switch-profile` | POST | Bearer | `200` yeni AuthResult | `400` profil erişilemez, `401` |
| `/auth/switch-child` | POST | Bearer | `200` ContextView (aynı token) | `400`/`403` ABAC, `401` |
| `/auth/switch-season` | POST | Bearer | `200` yeni AuthResult | `403` season.archive.view yok |
| `/auth/me/context` | GET | Bearer | `200` ContextView | `401` |
| `/auth/me/available-contexts` | GET | Bearer | `200` AvailableContextsView | `401` |
| `/auth/forgot-password` | POST | Anonim | `202` (uniform, kanal sızdırmaz) | `429` |
| `/auth/reset-password` | POST | Anonim+token | `204` | `400` token invalid/expired |
| `/auth/change-password` | POST | Bearer | `204` | `400` policy, `401` |
| `/admin/accounts/{id}/unlock` | POST | Bearer (admin perm) | `204` | `403`, `404` |
| `/auth/otp/request` `/auth/otp/verify` | POST | Anonim | challenge / AuthResult | **Sprint 5** (iskelet) |

---

## Detay

### `POST /auth/login`

**Auth:** Anonim. **Request:**
```jsonc
{ "identifier": "veli@example.com", "password": "...", "channel": "web",
  "profileType": "Parent" }   // opsiyonel — çok profilli kullanıcı 409 sonrası seçimini bununla bildirir
```

**Desteklenen `identifier` tipleri:** Email, Phone, StudentNumber (Faz 1B-BE, 2026-06-30). StudentNumber için `SchoolHint` (okul ID'si) zorunlu; hesapsız/küçük-kademe öğrenci → uniform `401`. TCKN login'de tip düzeyinde reddedilir (BR-identity-002).

**Akış (özet, tam akış Bölüm 18.1):** guard → `FindForLoginAsync` (TCKN reddi; StudentNumber → `FindByStudentNumberAsync` tenant-scope) → password verify → lifecycle gate → consent gate → policy gate → context resolve → permission cache → token issue.

**Response 200:**
```jsonc
{ "accessToken": "...", "refreshToken": "...", "expiresIn": 900,
  "context": { "activeProfileType": "ParentProfile", "activeChildId": null,
               "activeSeasonId": "...", "availableProfiles": ["ParentProfile","TeacherProfile"] } }
```

**Response 409 — profil seçimi gerekli:**
```jsonc
{ "code": "NEEDS_PROFILE_SELECTION", "availableProfiles": ["TeacherProfile","ParentProfile"] }
```
> **Profil seçim çözümü:** 409 alındığında istemci **aynı login isteğini** `profileType` alanıyla tekrarlar (geçerli ve `availableProfiles` içindeyse `200`; açık ama sahip-olunmayan/geçersiz değer yine `409`). Bu, oturum açmadan profil seçmeyi sağlar (`/auth/switch-profile` Bearer token gerektirir, oturum-içi manuel geçiş içindir). Öncelik: `profileType` hint > `LastActiveProfileType` > `409`.

**Response 403 — askıya alınmış (tek istisna — bkz. TR-auth-004):**
```jsonc
{ "code": "ACCOUNT_SUSPENDED", "message": "Hesabınız geçici olarak askıya alınmıştır...", "contact": "<schoolAdmin>" }
```

> **Hata politikası (TR-auth-004):** identifier eşleşmedi / `LinkedAccountId` null / parola yanlış → **tek uniform `401`**: *"Kullanıcı bulunamadı veya parola hatalı."* Tek istisna: parola doğru + `LifecycleState ∈ {Suspended, Archived, Transferred}` → açıklayıcı `403`.

---

### `POST /auth/refresh`

Rotation + reuse detection. Eski token revoke, yeni token üretilir (`ReplacedByTokenHash` zinciri). Revoke edilmiş token tekrar kullanılırsa → account'un **tüm** refresh token'ları revoke + `SuspiciousTokenReuse` audit.

### `POST /auth/switch-profile`

Target `availableProfiles` (JWT claim) içinde olmalı (yoksa `400`). Permission cache invalidate + rebuild, `perms_ver++`, **yeni JWT**. `account.RecordActiveProfile(target)` persist. `ProfileSwitched` audit.

### `POST /auth/switch-child`

Sadece `ParentProfile` aktifken. ABAC: route/body'deki `childId` `ParentStudentRelationship` bayraklarıyla kontrol edilir (`403` + `PermissionDenied` audit). **JWT değişmez** — `activeChildId` Redis server-session'da (`session:{jti}:childId`) tutulur. `ChildContextSwitched` audit.

### `POST /auth/switch-season`

`activeSeasonId` değişir → **yeni JWT**. `season.archive.view` permission gerekir (veliye kendi çocuğunun sınırlı geçmişi için ABAC ile otomatik). Geçmiş sezon = salt-okunur (`ActiveSeasonWritePolicy` yazma endpoint'lerini `403` ile korur). `SeasonSwitched` audit.

### `GET /auth/me/context` · `GET /auth/me/available-contexts`

Aktif bağlamı ve seçenekleri (profil/çocuk/sezon) döner. UI switcher'ları besler.

`ContextView` ayrıca **`permissions: string[]`** taşır (TQ-auth-002 kararı, 2026-05-31): account-login token'ı izin listesi taşımaz, istemci UI gating için efektif izin slug'larını bu uçtan alır. İzinler aktif profil/sezon bağlamına göre `IPermissionReader` (Redis cache + DB resolver) ile çözülür. Web `applyAccountAuthResult` sonrası `/auth/me/context` çağırır; login/refresh/profil-sezon switch akışlarında izinler tazelenir. Bu liste **yalnız UX** içindir — backend yetki kontrolü bağımsız (Default Deny).

`AvailableContextsView.availableChildren[]` (= `AvailableChildView`) topbar veli (parent) child-switcher'ını besler ve şu alanları taşır (C2, 2026-06-22):

| Alan | Tip | Açıklama |
|------|-----|----------|
| `studentPersonId` | `Guid` | Çocuğun Person id'si (switch-child hedefi). |
| `canViewInfo` | `bool` | ABAC bayrağı; `false` → UI'da göster ama seçtirme (backend ayrıca reddeder). |
| `displayName` | `string` | Çocuğun adı (`Person.Name` → "Ad Soyad"). |
| `className` | `string?` | Çocuğun **güncel** şubesi (`StudentProfile.CurrentClassroomId` → `ClassRoom.FullName`, örn "7-A"); atanmamışsa `null`. |

`displayName`/`className`, `PersonDirectory.FindActiveChildrenAsync` içinde tek EF projection sorgusuyla (N+1/lazy-load yok, tenant filter otomatik) çözülür. `CurrentClassroomId` zaten güncel sınıfı tuttuğundan ekstra aktif-sezon filtresi gerekmez.

> **Not (2026-06-28, mimari değişiklik — okuma tarafı DEĞİŞMEDİ):** `CurrentClassroomId` hâlâ denormalize tutulur, ancak artık komut handler'larında manuel senkronlanmaz; `StudentClassroomSyncInterceptor` ile tek doğruluk kaynağı `academic.class_room_students` (aktif satır, `left_at IS NULL`) defterinden türetilir (interceptor-derived). Bu projeksiyon (`PersonDirectory` child `className`) aynen çalışır — okuma sözleşmesi etkilenmez. Detay: students `business-rules.md` BR-students-001.

### `POST /auth/forgot-password` · `/reset-password` · `/change-password`

Forgot uniform `202` döner (enumeration koruması, kanal sızdırmaz). Reset token tek kullanımlık + kısa ömürlü; başarılı reset/change tüm oturumları logout eder.

---

## Standart Yanıt Zarfı

```json
{ "data": { }, "meta": { }, "errors": null, "correlationId": "..." }
```

## Yasaklar

- ❌ Verb in URL — sub-resource veya HTTP method kullan.
- ❌ Uniform hata politikasını bozan, hangi alanın hatalı olduğunu sızdıran login mesajı.
- ❌ `activeChildId`'yi JWT'ye koymak (server-side session'da tutulur).
- ❌ Refresh/reset token'ı plain dönmek/saklamak.

> Detay: `backend/api-design-rules.md`, teknik analiz Bölüm 8 & 10.
