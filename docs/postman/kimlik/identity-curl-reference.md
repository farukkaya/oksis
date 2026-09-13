# Identity API — curl referansı

> Postman'in **Import → Raw text** alanına yapıştırılabilir curl'ler. User CRUD/profil endpoint'leri `src/Oksis.Api/Controllers/V1/UsersController.cs`'de, auth endpoint'leri `src/Oksis.Api/Controllers/V1/AuthController.cs`'dedir.
>
> Kanonik koleksiyon: [`oksis-identity.postman_collection.json`](./oksis-identity.postman_collection.json) (Postman'a doğrudan import).
>
> Placeholder'ları gerçek değerlerle değiştirin: `{{API_SERVICE}}` (`https://localhost:5001/api/v1`), `{{accessToken}}`, `{{refreshToken}}`, `{{schoolId}}`, `{{userId}}`, `{{resetToken}}`.

## Enum referansı

**UserRole** — `1 SuperAdmin · 2 SchoolAdmin · 3 SchoolStaff · 4 Teacher · 5 Parent · 6 Student · 7 Secretary · 8 Accountant`
**UserStatus** — `1 Active · 2 Inactive · 3 Suspended`

---

## Auth — Public (anonim)

> Account-tabanlı auth (AuthController.cs). Legacy User-tabanlı eski uçlar Faz 1+2'de
> kaldırıldı: `AuthController` altındaki login/refresh/revoke/reset/confirm-reset ile
> `UsersController` altındaki self parola değiştirme; tek aktif akış budur. Web akışında refresh token httpOnly `oksis_rt`
> cookie'sinde taşınır (gövdeye yazılmaz); mobile istemci `X-Client-Type: mobile`
> header'ıyla gövdeden okur/yazar.

### 1. Account Login
```bash
curl --location --request POST '{{API_SERVICE}}/auth/account/login' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "identifier": "admin@okul.com",
    "password": "Strong1Password"
  }'
```
Kademeli lockout (Redis): 5 başarısız denemede 5 dk, 10'da 30 dk, 20'de 2 saat kilit. Hesap yok / inaktif / soft-deleted / yanlış parola için aynı `InvalidCredentials` (401) döner (enumeration koruması). Çoklu profilli hesapta 409 `NEEDS_PROFILE_SELECTION` + `availableProfiles` döner.

### 2. Account Refresh Token (rotation)
```bash
curl --location --request POST '{{API_SERVICE}}/auth/account/refresh' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "refreshToken": "{{refreshToken}}"
  }'
```
Web akışında refresh token httpOnly cookie'den okunur (bu gövde yok sayılır); yalnız `X-Client-Type: mobile` header'lı istekte gövde kullanılır. Eski token tüketilir, yeni token üretilir. Aynı token 2. kez gelirse **reuse detection** → kullanıcının TÜM session'ları revoke edilir.

### 3. Account Forgot Password (linki iste)
```bash
curl --location --request POST '{{API_SERVICE}}/auth/account/forgot-password' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "identifier": "admin@okul.com",
    "schoolHint": "{{schoolId}}",
    "channel": "Email"
  }'
```
TR-auth-008: her durumda 202 Accepted (enumeration koruması — var olmayan / inaktif / soft-deleted identifier için de). Hangfire job ile e-posta gönderimi; SMS kanalı henüz aktif değil (ISSUE-13).

### 4. Account Reset Password
```bash
curl --location --request POST '{{API_SERVICE}}/auth/account/reset-password' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "token": "{{resetToken}}",
    "newPassword": "Strong1Password"
  }'
```
Raw token (opaque). Tek kullanım. Başarılı reset sonrası user'ın tüm refresh token'ları revoke.

---

## Auth — Authenticated

### 5. Account Logout (logout / belirli session)
```bash
curl --location --request POST '{{API_SERVICE}}/auth/account/logout' \
  --header 'Authorization: Bearer {{accessToken}}' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "refreshToken": "{{refreshToken}}"
  }'
```
Web akışında refresh token httpOnly cookie'den okunur (bu gövde yalnız mobile header'lı istekte kullanılır); refresh token revoke edilir + access token jti Redis'te blacklist'e alınır. Boş gövde idempotent (204).

### 6. Account Change Password (self)
```bash
curl --location --request POST '{{API_SERVICE}}/auth/account/change-password' \
  --header 'Authorization: Bearer {{accessToken}}' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "currentPassword": "Strong1Password",
    "newPassword": "NewStrong2Password"
  }'
```
Başarıyla değiştirildiğinde `RequirePasswordChange=false` + tüm refresh token'lar revoke (her cihazdan çıkış).

---

## Users (yetkili CRUD + profil)

### 7. List Users
```bash
curl --location --request GET '{{API_SERVICE}}/users?page=1&pageSize=20' \
  --header 'Authorization: Bearer {{accessToken}}'
```
**İzin:** `users.view`. Opsiyonel query: `search`, `role`, `status`.

Filtreli örnek:
```bash
curl --location --request GET '{{API_SERVICE}}/users?page=1&pageSize=20&search=ahmet&role=4&status=1' \
  --header 'Authorization: Bearer {{accessToken}}'
```

### 8. Get User By Id
```bash
curl --location --request GET '{{API_SERVICE}}/users/{{userId}}' \
  --header 'Authorization: Bearer {{accessToken}}'
```
**İzin:** `users.view-detail`. Diğer tenant kullanıcısı için 404 (kaynak varlığını sızdırmamak için 403 değil).

### 9. Get My Profile (self)
```bash
curl --location --request GET '{{API_SERVICE}}/users/me' \
  --header 'Authorization: Bearer {{accessToken}}'
```
İzin gerektirmez, sadece JWT.

### 10. Create User
```bash
curl --location --request POST '{{API_SERVICE}}/users' \
  --header 'Authorization: Bearer {{accessToken}}' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "email": "yeni.kullanici@okul.com",
    "firstName": "Ayşe",
    "lastName": "Demir",
    "role": 4
  }'
```
**İzin:** `users.create`. Geçici parola otomatik üretilir + Hangfire ile davet e-postası kuyruğa alınır. `role: 1` (SuperAdmin) reddedilir.

### 11. Update User
```bash
curl --location --request PUT '{{API_SERVICE}}/users/{{userId}}' \
  --header 'Authorization: Bearer {{accessToken}}' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "firstName": "Ayşe",
    "lastName": "Yıldız",
    "role": 4
  }'
```
**İzin:** `users.update`. Email immutable. SuperAdmin role yükseltmesi reddedilir.

### 12. Deactivate User
```bash
curl --location --request POST '{{API_SERVICE}}/users/{{userId}}/deactivate' \
  --header 'Authorization: Bearer {{accessToken}}'
```
**İzin:** `users.update`. `Status=Inactive`. Refresh token'lar silinmez (geri açılabilir).

### 13. Soft Delete User
```bash
curl --location --request DELETE '{{API_SERVICE}}/users/{{userId}}' \
  --header 'Authorization: Bearer {{accessToken}}'
```
**İzin:** `users.delete`. `IsDeleted=true`, `Status=Inactive`, tüm refresh token'lar Redis'ten temizlenir. Self-delete 400 `CannotDeleteSelf`.

---

## HTTP status code haritası

| Durum | Kod | Tetikleyici |
|---|---|---|
| OK / Created / NoContent | 200 / 201 / 204 | Başarılı |
| BadRequest | 400 | Validation, `cannot-delete-self`, `password-*`, `token.invalid/expired/already-used` |
| Unauthorized | 401 | JWT yok / geçersiz, `invalid-credentials`, `invalid-refresh-token` |
| Forbidden | 403 | İzin yetersiz (Default Deny) |
| NotFound | 404 | Kaynak bulunamadı (cross-tenant dahil) |
| Conflict | 409 | `email-exists` |
| Locked | 423 | `account-locked` |
| UnprocessableEntity | 422 | Eşlenmemiş error code (fallback) |

> Mapping `src/Oksis.Api/Extensions/ResultExtensions.cs:MapStatusCode` içinde.

---

## Postman ortam değişkenleri (önerilen)

| Variable | Örnek değer | Otomatik yazılır mı? |
|---|---|---|
| `API_SERVICE` | `https://localhost:5001/api/v1` | Hayır (manuel) |
| `schoolId` | `e8f3...-...-...` | Hayır (manuel; opsiyonel `schoolHint` için) |
| `accessToken` | `eyJ...` | Account Login + Account Refresh response'undan |
| `refreshToken` | `Q3Yk...` | Yalnız `X-Client-Type: mobile` header'lı Account Login/Refresh response'undan (web akışında httpOnly cookie'de taşınır) |
| `userId` | `e8f3...` | Create response'undan |
| `resetToken` | (manual, e-postadan) | Hayır (manuel) |
