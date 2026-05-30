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
| `/auth/switch-season` | POST | Bearer | `200` yeni AuthResult | `403` seasons.view-archived yok |
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
```json
{ "identifier": "veli@example.com", "password": "...", "channel": "web" }
```

**Akış (özet, tam akış Bölüm 18.1):** guard → `FindForLoginAsync` (TCKN reddi) → password verify → lifecycle gate → consent gate → policy gate → context resolve → permission cache → token issue.

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

`activeSeasonId` değişir → **yeni JWT**. `seasons.view-archived` permission gerekir (veliye kendi çocuğunun sınırlı geçmişi için ABAC ile otomatik). Geçmiş sezon = salt-okunur (`ActiveSeasonWritePolicy` yazma endpoint'lerini `403` ile korur). `SeasonSwitched` audit.

### `GET /auth/me/context` · `GET /auth/me/available-contexts`

Aktif bağlamı ve seçenekleri (profil/çocuk/sezon) döner. UI switcher'ları besler.

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
