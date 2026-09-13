# Backend API Design Rules

> REST API tasarım standardı. Tüm endpoint'ler tutarlı ve öngörülebilir.

---

## 1. URL Yapısı

```
https://api.oksis.com.tr/api/v1/{resource}/{id?}/{sub-resource?}
```

- **Base path**: `/api/{version}` — `/api/v1`
- **Resource**: çoğul, kebab-case → `students`, `academic-years`
- **ID**: Guid → `{id:guid}`
- **Sub-resource**: çoğul, kebab-case

### Örnekler

```
GET    /api/v1/students                              ← liste
GET    /api/v1/students/{id}                         ← detay
POST   /api/v1/students                              ← oluştur
PUT    /api/v1/students/{id}                         ← tam update
PATCH  /api/v1/students/{id}                         ← partial update (kullanılırsa)
DELETE /api/v1/students/{id}                         ← sil

GET    /api/v1/students/{id}/parents                 ← sub-resource: öğrencinin velileri
POST   /api/v1/students/{id}/parents                 ← öğrenciye veli ekle
DELETE /api/v1/students/{id}/parents/{parentId}      ← veli kaldır

GET    /api/v1/classrooms/{id}/students              ← şubenin öğrencileri
GET    /api/v1/teachers/me/timetable                 ← oturum açan öğretmenin programı
```

---

## 2. HTTP Method Kuralları

| Method | Amaç | Idempotent | Request Body | Response Body |
|---|---|---|---|---|
| `GET` | Oku | ✅ | ❌ | ✅ |
| `POST` | Oluştur veya action | ❌ | ✅ | ✅ (created resource) |
| `PUT` | Tam update | ✅ | ✅ | ✅ |
| `PATCH` | Partial update | ❌ (genelde) | ✅ | ✅ |
| `DELETE` | Sil | ✅ | ❌ | ✅ (status) |

### Non-CRUD Action'lar

CRUD'a uymayan aksiyon → POST + verb resource'unun altında:

```
POST   /api/v1/marks/{id}/publish              ← notu yayınla
POST   /api/v1/marks/{id}/lock                 ← kilitle
POST   /api/v1/users/{id}/reset-password       ← şifre sıfırlama tetikle
POST   /api/v1/auth/refresh                    ← token yenile
POST   /api/v1/students/import                 ← excel import
POST   /api/v1/academic-years/transition       ← sezon geçişi başlat
```

---

## 3. HTTP Status Code Kullanımı

| Code | Anlam | Ne Zaman |
|---|---|---|
| `200 OK` | Başarılı GET / PUT / PATCH | Liste, detay, update |
| `201 Created` | Başarılı POST oluşturma | Yeni kaynak; `Location` header'ı set edilir |
| `202 Accepted` | Asenkron kabul | Excel import gibi background job tetikleyen |
| `204 No Content` | Başarılı, body yok | DELETE (genelde) |
| `400 Bad Request` | Validation hatası | FluentValidation fail |
| `401 Unauthorized` | Token yok / geçersiz | Auth fail |
| `403 Forbidden` | Yetki yok | Permission fail; cross-tenant attempt (audit'e logla) |
| `404 Not Found` | Kaynak bulunamadı | Kaynak yok veya kullanıcı kaynağı göremez |
| `409 Conflict` | İş kuralı çakışması | Duplicate, optimistic concurrency |
| `422 Unprocessable Entity` | Domain rule fail | Business rule violation (publish edilemez vs.) |
| `429 Too Many Requests` | Rate limit | Login, password reset, vb. |
| `500 Internal Server Error` | Beklenmedik hata | Logla + correlation id dön |
| `503 Service Unavailable` | Geçici sorun | Maintenance, dependency down |

---

## 4. Response Yapısı

### Tek Kaynak Response

```json
{
  "data": {
    "id": "01234567-89ab-cdef-0123-456789abcdef",
    "firstName": "Ali",
    "lastName": "Veli",
    "classRoomId": "...",
    "createdAt": "2025-05-15T10:30:00Z"
  },
  "meta": null,
  "errors": null,
  "correlationId": "abc-123"
}
```

### Liste Response (paged)

```json
{
  "data": [
    { "id": "...", "firstName": "...", "lastName": "..." },
    { "id": "...", "firstName": "...", "lastName": "..." }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalItems": 234,
    "totalPages": 5
  },
  "errors": null,
  "correlationId": "abc-123"
}
```

### Hata Response

```json
{
  "data": null,
  "meta": null,
  "errors": [
    {
      "code": "Validation.FirstName.Required",
      "message": "Ad alanı zorunludur.",
      "field": "firstName"
    },
    {
      "code": "Validation.NationalId.Format",
      "message": "T.C. Kimlik No 11 haneli olmalı.",
      "field": "nationalId"
    }
  ],
  "correlationId": "abc-123"
}
```

### ApiResponse Wrapper

```csharp
public sealed record ApiResponse<T>(
    T? Data,
    object? Meta,
    IReadOnlyCollection<ApiError>? Errors,
    string CorrelationId);

public sealed record ApiError(string Code, string Message, string? Field = null);
```

Filter / Middleware otomatik wrap eder.

---

## 5. Liste Endpoint Kuralları

### Pagination (her listede)

Query params:
- `page` (default 1, min 1)
- `pageSize` (default 50, max 100)

```
GET /api/v1/students?page=2&pageSize=50
```

Validator zorunlu: page ≥ 1, pageSize ∈ [1, 100].

### Sorting

```
?sortBy=firstName&sortDirection=asc
?sortBy=createdAt&sortDirection=desc
```

- `sortBy` whitelisted (validator enum).
- `sortDirection` ∈ `asc | desc` (default `asc`).
- Default sort tipik olarak `createdAt desc`.

### Filtering

Basit filtreler query string'de:

```
GET /api/v1/students?classRoomId={guid}&status=Active&search=ali
```

Karmaşık filtre (DataGrid'den gelir) → POST `/search` veya structured body kabul edilir:

```
POST /api/v1/students/search
Body: { "filters": [...], "sort": [...], "page": 1, "pageSize": 50 }
```

> **MVP**: Query string yaklaşımı yeterli. POST search sadece DataGrid'in karmaşık filtre desteği için.

### Search

- `?search=...` text search; en az 2 karakter.
- Backend: full text search (SQL Server FULLTEXT) veya LIKE.
- Min 2 karakter, max 100; trim'lenir.

---

## 6. Tek Kaynak Endpoint

### GET Detail

```
GET /api/v1/students/{id}
```

- Sadece kullanıcının erişim sahibi olduğu kaynak görünür.
- Yetkisiz erişim: 404 (kaynağın varlığını sızdırma).

### Response: Detay DTO vs List DTO

- **List DTO**: özet (Id, Name, Status, ClassRoomName).
- **Detail DTO**: tüm relevant alanlar + ilişkili veriler (parents, recent marks).

---

## 7. Create / Update

### POST

```
POST /api/v1/students
Body: CreateStudentRequest
Response 201: { data: { id, ... }, ... }
Headers: Location: /api/v1/students/{id}
```

### PUT (tam update)

```
PUT /api/v1/students/{id}
Body: UpdateStudentRequest  ← tüm güncellenebilir alanlar
Response 200: { data: { ... full updated entity } }
```

- URL'deki `id` ile body içindeki `id` (varsa) eşleşmeli. Eşleşmezse 400.

### PATCH (partial)

MVP'de **kullanılmaz** (PUT yeterli, karmaşıklığı azaltır). İstisna: bulk update.

---

## 8. Delete

```
DELETE /api/v1/students/{id}
Response 204 No Content
```

- Soft delete uygulanır; entity DB'de kalır.
- Yetkisiz: 404 (kaynağın varlığını sızdırma).
- İlişkili kaynak engelliyorsa (FK constraint): 409 Conflict.

---

## 9. Bulk Operations

```
POST /api/v1/students/bulk-delete
Body: { "ids": ["...", "..."] }
Response 200: { "deleted": 5, "failed": [{ "id": "...", "reason": "..." }] }
```

- Atomik değil — kısmi başarı raporlanır.
- Max 100 entity / request.

---

## 10. Async Operations (Long-running)

Excel import, sezon geçişi gibi 5 sn üzeri işlemler:

```
POST /api/v1/students/import
Body: { excelFile: <base64 or multipart> }
Response 202 Accepted:
{
  "data": { "jobId": "...", "status": "Queued" },
  "meta": { "statusUrl": "/api/v1/jobs/{jobId}" }
}
```

Status polling:
```
GET /api/v1/jobs/{jobId}
Response:
{
  "data": {
    "id": "...",
    "status": "Running" | "Completed" | "Failed",
    "progress": 45,
    "result": null | { ... } | { errors: [...] }
  }
}
```

SignalR ile real-time push da gönderilir.

---

## 11. File Upload / Download

### Upload

```
POST /api/v1/homework/{id}/attachments
Content-Type: multipart/form-data
Body: file (max 10 MB)
Response 201: { data: { fileId, url, size, mimeType } }
```

- **Allowed MIME types** whitelist (server-side kontrol).
- **Max boyut** request başına ayarlanabilir.
- Storage: S3 / MinIO; URL **presigned**, kısa ömürlü (15 dk).

### Download

```
GET /api/v1/files/{fileId}/download
Response 302 → presigned URL
```

---

## 12. Authentication

### Login

```
POST /api/v1/auth/login
Body: { "email": "...", "password": "..." }
Response 200:
{
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "...",
    "expiresIn": 900,
    "user": { id, fullName, role, schoolId, permissions: [...] }
  }
}
```

### Refresh

```
POST /api/v1/auth/refresh
Body: { "refreshToken": "..." }
Response 200: { accessToken, refreshToken, expiresIn }
```

### Logout

```
POST /api/v1/auth/logout
Authorization: Bearer ...
Response 204
```

(Refresh token revoke'lanır.)

---

## 13. Authorization Header

```
Authorization: Bearer eyJ...
```

JWT claims (minimum):
- `sub` (user id)
- `school_id` (tenant)
- `role`
- `permissions` (string array)
- `exp` (expiry)

---

## 14. Versioning

- URL path versioning: `/api/v1/...`
- v1 stabil tutulur; breaking change → v2.
- Deprecated endpoint: `Sunset` header + dokümante et + 6 ay grace.

---

## 15. Documentation

- **Scalar** (`/scalar/v1`) — Swagger UI yerine.
- XML doc comment'leri zorunlu controller ve DTO'larda:
  ```csharp
  /// <summary>Yeni öğrenci oluşturur.</summary>
  /// <response code="201">Öğrenci başarıyla oluşturuldu.</response>
  /// <response code="400">Validation hatası.</response>
  ```
- Her endpoint için `[ProducesResponseType(...)]` attribute'leri.

---

## 16. Headers Standartları

### Request

| Header | Açıklama |
|---|---|
| `Authorization: Bearer ...` | JWT token |
| `X-Correlation-Id` | Client tarafından gönderilir (opsiyonel); yoksa server üretir |
| `X-Active-Child-Id` | Veli için aktif çocuk (opsiyonel) |
| `X-Tenant-Override` | Sadece SuperAdmin için (audit'e logla) |
| `Accept-Language` | `tr-TR`, `en-US` |

### Response

| Header | Açıklama |
|---|---|
| `X-Correlation-Id` | Request'i takip için |
| `X-RateLimit-Limit`, `X-RateLimit-Remaining` | Rate limit info |
| `Location` | 201 Created sonrası yeni resource URL |
| `Sunset` | Deprecated endpoint için tarih |

---

## 17. Rate Limiting

- Login: 5 req / 15 dk / IP + email
- Password reset: 3 req / saat / email
- General authenticated: 100 req / dakika / user
- Public: 30 req / dakika / IP

Aşılırsa `429 Too Many Requests` + `Retry-After` header.

---

## 18. CORS

- Web origin'ler whitelist'te (config'den).
- Mobile (Expo) cross-origin DEĞİL; CORS endişesi yok native.
- Credentials: `true`.
- Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Allowed headers: Authorization, Content-Type, X-Correlation-Id, X-Active-Child-Id.

---

## 19. Yasaklar

- ❌ Verb in URL (`/getStudents`, `/createStudent`) — sub-resource veya HTTP method kullan.
- ❌ Snake_case path.
- ❌ Boolean response body (`true`, `false` — her zaman wrapped).
- ❌ Inconsistent envelope (bazı endpoint wrap, bazı değil).
- ❌ Sensitive data in URL (token, password — query string'de yer almaz).
- ❌ Tek bir endpoint birden fazla resource modify etmek (saga / transaction pattern gerekirse).
- ❌ `200 OK` ile body içinde error (status code doğru olmalı).
