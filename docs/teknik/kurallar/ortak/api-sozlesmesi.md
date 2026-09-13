# API Sözleşmesi (Frontend ↔ Backend)

> [!info] Belge bilgisi
> **Amaç:** `oksis-ui` ile `oksis-api` arasındaki tel sözleşmesini tanımlamak: tip üretimi, yanıt zarfı, hata biçimi ve status eşlemesi, sayfalama, kimlik doğrulama, başlıklar, CORS/proxy. Tüm maddeler **kod ile doğrulanmıştır**.
> **Son doğrulama:** 2026-09-13. `oksis-api` master `294ffe62`, `oksis-ui` master `ec9ea8c`.
> **Kaynak:** `oksis-ui/CLAUDE.md` § Backend Contract.
> - Backend: `src/Oksis.Api/{Program.cs, Contracts/ApiResponse.cs, Middleware/*, Extensions/{ResultExtensions,RefreshTokenCookie}.cs, Errors/ErrorMessageCatalog.cs, Controllers/V1/AuthController.cs}`, `src/Oksis.Shared/{PagedResult,PagedQuery,PaginationNormalizer}.cs`, `src/Oksis.Infrastructure/Identity/{JwtOptions,AccountTokenIssuer}.cs`.
> - Frontend: `packages/api/src/client/*`.

İlgili notlar: [[veri-ve-durum-yonetimi]] · [[formlar-ve-dogrulama]] · [[tech-stack]] · Alan: [[Kimlik Doğrulama]]

---

## 1. Temel kurallar

| Konu | Kural |
|---|---|
| Sürüm ve yol | Tüm REST uçları `/api/v1/...` altındadır (`Controllers/V1`). |
| JSON harf düzeni | camelCase. ASP.NET Core varsayılanıdır; `AddJsonOptions` yalnız `JsonStringEnumConverter` ekler. |
| Enum'lar | Çalışma zamanında **string ad** olarak serileştirilir (`"PrimarySchool"`). OpenAPI'den üretilen şema bazı enum'ları `number` gösterir (örnek `SchoolType: number`). Bu yüzden tel değeri DTO'da korunur ve alan birliğine eşleme `endpoints.ts` içinde yapılır. Çağrı yerinde tahmin yapılmaz. |
| Veri kaynağı | Tüm veri .NET API'den, `packages/api` üzerinden gelir. Next API route ya da Server Action yazılmaz. |
| İstemci | `openapi-fetch` + üretilen `paths` tipi. `fetch` yalnız `packages/api` içinde kullanılır. |

## 2. Tip üretimi: tek yetkili kaynak

- **API tipleri üretilir, elle yazılmaz.** Komut: `npm run codegen -w @workspace/api`. Bu komut `openapi-typescript http://localhost:5112/openapi/v1.json` çalıştırır ve çıktıyı `packages/api/src/generated/schema.ts` dosyasına yazar.
  - **Ön koşul:** API **Development** ortamında çalışıyor olmalıdır, çünkü OpenAPI yalnız orada yayımlanır.
- **`generated/schema.ts` tel şekli için tek yetkilidir.** Elle yazılmış bir tip bu dosyayla çelişirse **elle yazılan yanlıştır**. Bu elle yazılan tip `contract.ts`, bir `core` tipi, bir mock fixture'ı ya da yerel bir prop tipi olabilir. Üretilen dosya "uyarlanmaz."
- Bir DTO alanına dokunmadan önce alan `schema.ts` içinde `grep` ile aranır ve tipi birebir kopyalanır.
- **Tel tipleri iyileştirilmez.** Örnek: `studentNo` her katmanda `string`'dir. Bu kural iki ayrı sapmanın canlı API'de yakalanmasından sonra kondu: `studentNo`'nun `number` yazılması ve `ActivityStudentDto.status` alanının hiç yazılmaması.
- **Mock'lar da tiplidir.** `packages/api-mocks` fixture'ları üretilen DTO ile alan alan aynı olmalıdır.
- Mock-first dönemde, yani backend ucu henüz yokken, sözleşme `packages/api/src/<alan>/contract.ts` içinde `declare module "../generated/schema"` ile yazılır. Codegen gelince uyuşmazlık typecheck'i kırar ve augmentation silinir.
- Üretilen şemada `int32` alanlar `number | string` olarak görünür. Bu `openapi-typescript` çıktısıdır; `endpoints.ts` içinde daraltılır.

## 3. Yanıt zarfı

Backend her JSON yanıtı `ApiResponse<T>` zarfıyla döner:

```json
{
  "data": { },
  "meta": null,
  "errors": null,
  "correlationId": "…"
}
```

| Durum | HTTP | Gövde |
|---|---|---|
| Başarılı, değer var (`Result<T>`) | 200 | `{ data, meta: null, errors: null, correlationId }` |
| Başarılı, değer yok (`Result`) | **204** | Gövde yok |
| Oluşturma (`ToCreatedResult`) | 201 | Zarf. `Location` başlığı `CreatedAtRoute` ile gelir. |
| Hata | 4xx/5xx | `{ data: null, meta: null, errors: [...], correlationId }` |
| İkili dosya (xlsx, pdf) başarısı | 200 | Dosyanın kendisi. Hata yine zarftır. |

İstemci kuralları (`client/request.ts`):

- `unwrap<T>`: 2xx yanıtta `errors` boşsa `data`'yı döndürür, aksi hâlde `ApiError` fırlatır. 204 ya da boş gövdede `undefined` döner.
- `unwrapPaged<T>`: `{ data, meta }` döndürür.
- `unwrapBlob`: dosya uçları içindir. **Dosya indiren her uç bundan geçer; ham `fetch` kullanılmaz** (B-41). Ham `fetch` Bearer başlığını ve refresh ara katmanını atlar ve mobilde `baseUrl`'i bilmez.

## 4. Hata biçimi

### 4.1 Hata öğesi

```json
{ "code": "Clubs.CapacityFull", "message": "Türkçe, kullanıcıya dönük cümle", "field": null }
```

- `errors[]` bir listedir. `field` yalnız doğrulama hatalarında doludur.
- **Mesaj alanı kullanıcıya dönük Türkçe bir cümledir.** Handler'lar mesaj yerine çeviri anahtarı (`modul.errors.olay-adi`) yazdıysa API sınırındaki `ErrorMessageCatalog.Humanize` onu Türkçe cümleye çevirir.
  - Sözlükte olmayan anahtar ham basılmaz; nötr bir cümle gider.
  - `ErrorMessageCatalogTests` depodaki her anahtarın sözlükte karşılığı olduğunu doğrular.
- Altyapı kodlarının mesajı İngilizce ve sabittir (`Error.Forbidden` → "Access denied."). İstemci bu kodlarda kendi cümlesini kullanır (§4.4).

### 4.2 Status eşlemesi

**İstisna yolu** (`ExceptionHandlingMiddleware`):

| İstisna | HTTP | `code` |
|---|---|---|
| `ValidationException` (FluentValidation) | 400 | `Validation`, alan başına bir öğe (`field` dolu) |
| `NotFoundException` | 404 | `Error.NotFound` |
| `ForbiddenException` | 403 | `Error.Forbidden` |
| `ConflictException` | 409 | `Error.Conflict` |
| `TenantRequiredException` | 403 | `TenantRequired` |
| `SecurityException` (tenant koruması) | 403 | `TenantMismatch` |
| `DbUpdateConcurrencyException` | 409 | `ConcurrencyConflict` |
| `DomainException` | 422 | İstisnanın kendi kodu |
| `OksisException` | 422 | `DomainError` |
| Diğer | 500 | `InternalError` |

**`Result` yolu** (`ResultExtensions.MapStatusCode`). Kuralların sırası önemlidir:

1. **Aile kuralı (X-17):** `<Modül>.…Forbidden` biçimindeki her kod 403'tür. Bu kural modül kovalarından önce çalışır; yeni bir modül için dal eklenmez.
2. **Modül kovaları** (`USERS_*`, `FILES_*`, `Attendance.*` / `attendance.errors.*`, `Announcements.*`, `Homework.*`, `Clubs.*`). Genel ilke:
   - Kaydın ya da okulun **hâli uygun değilse** (durum makinesi ihlali, kontenjan, aktif sezon yok, ad çakışması, eşzamanlılık) → **409**.
   - İstek **gövdesi hatalıysa** → **400**.
3. **Standart kodlar:**

   | Kod içeriği | HTTP |
   |---|---|
   | `Error.NotFound`, `not-found` | 404 |
   | `Error.Forbidden` | 403 |
   | `Error.Unauthorized`, `invalid-credentials`, `invalid-refresh-token`, `refresh.invalid`, `refresh.reuse` | 401 |
   | `Error.Conflict` vb. | 409 |
   | `Error.Validation` vb. | 400 |
   | `account.locked` | **423** |
   | `account.suspended`, `consent-required` | 403 |
   | `needs-profile-selection` | 409 |
   | `invitation.expired`, `INVITATION_EXPIRED` | **410** |

4. Hiçbir kurala uymayan kod → **422**.

**403 ile 404 ayrımı** (2026-08-31 kararı):

- Kullanıcı kaydı **okuyabiliyor ama yazamıyorsa** → 403 ve modül önekli Türkçe gerekçe.
- Kullanıcı kaydı **okuyamıyorsa bile** → 404. Varlığın kendisi sızdırılmaz.

Yeni hata kodları tanımlanırken bu eşleme `ResultExtensions.cs` içinde kontrol edilmelidir.

### 4.3 Zarf dışı yanıtlar (bilinen istisnalar)

İstemci bunlarda zarf bulamaz ve `unwrap` `code: "unknown"`, "Beklenmeyen bir hata oluştu." üretir.

| Durum | Yanıt |
|---|---|
| Model binding / JSON çözme hatası (`[ApiController]` otomatik doğrulaması; `InvalidModelStateResponseFactory` özelleştirilmemiş) | ASP.NET varsayılan **ProblemDetails**, 400 |
| JwtBearer challenge (geçersiz, süresi dolmuş ya da kara listedeki token) | 401, gövde yok |
| `TenantContextMiddleware`: kimliği doğrulanmış, SuperAdmin değil, `school_id` claim'i yok | 403, tek alanlı düz nesne (`Error`), zarf değil |
| Rate limiter reddi | 429 (bugün hiçbir uçta aktif değil, bkz. §8) |

### 4.4 İstemcinin hata gösterimi

- API katmanının dışına tek hata tipi çıkar: `ApiError`.
- Kullanıcı cümlesini `apiErrorDesc` / `mutationErrorDesc` seçer.
- **403'te sunucunun cümlesi yalnız izin listesindeki modül önekleriyle ekrana geçer** (`mutation-error.ts` → `DOMAIN_FORBIDDEN_CODE_PREFIXES`). Diğer 403'lerde "Bu işlem için yetkiniz yok." gösterilir.
- Çeviri anahtarına benzeyen mesajlar ham basılmaz.
- Ayrıntı: [[veri-ve-durum-yonetimi]] §6.

## 5. Sayfalama

### İstek

Liste sorguları `PagedQuery` tabanını kullanır:

| Parametre | Varsayılan | Kural |
|---|---|---|
| `page` | 1 | 1 tabanlı. `< 1` gelirse 1 yapılır. |
| `pageSize` | 10 | En fazla **500**. `-1` "Hepsi" demektir ve 500'e çevrilir. `≤ 0` gelirse 10 yapılır. |
| `sortBy` | — | — |
| `sortDirection` | `asc` | `asc` / `desc` |
| `search` | — | En az 2, en fazla 100 karakter |

Normalizasyonu `PaginationNormalizer.Normalize` yapar. Handler'lar bu clamp mantığını kopyalamaz.

### Yanıt

**Sayfalama bilgisi zarfın `meta` alanında değil, `data` içindeki `PagedResult` nesnesinde gelir:**

```json
{
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 10,
    "totalCount": 0,
    "totalPages": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  },
  "meta": null,
  "errors": null,
  "correlationId": "…"
}
```

- `ApiResponse` üzerinde `PaginationMeta { page, pageSize, totalItems, totalPages }` tanımlıdır ama **hiçbir uç doldurmaz**. `meta` her zaman `null` gelir.
- `totalCount` her zaman gerçek toplamdır. İstemci `totalCount > pageSize` karşılaştırmasıyla sunucunun 500 sınırını uygulayıp uygulamadığını anlayabilir.
- İstemcide `unwrapPaged<S["PagedResultOf…"]>` çağrılır ve dönen `data` kullanılır.

## 6. Kimlik doğrulama

### 6.1 Uçlar (`/api/v1/auth`)

| Uç | Anonim | Not |
|---|---|---|
| `POST account/login` | ✓ | Token seti döner |
| `POST account/refresh` | ✓ | Refresh token'ı önce cookie'den, yoksa gövdeden okur |
| `POST account/forgot-password`, `account/reset-password` | ✓ | — |
| `POST account/logout`, `account/logout-all` | — | Cookie'yi temizler |
| `POST account/change-password` | — | — |
| `POST account/switch-season`, `account/switch-profile` | — | **Yeni token** döner |
| `POST account/switch-child` | — | Sunucu aktif çocuğu tutar |
| `GET me/context`, `GET me/available-contexts` | — | Aktif bağlam |

Token seti: `{ accessToken, refreshToken, accessExpiresAt }`.

### 6.2 Access token

- REST uçlarında yalnız `Authorization: Bearer <jwt>` başlığıyla taşınır.
- **SignalR hub'ları** (`/hubs/session`, `/hubs/notifications`) WebSocket/SSE üzerinde başlık gönderemediği için token'ı `access_token` sorgu parametresinde kabul eder. Bu parametre **yalnız `/hubs/*`** yollarında okunur.
- Doğrulama:
  - `Jwt:Issuer` ve `Jwt:Audience` doğrulanır.
  - Token ömrü kontrol edilir, saat kayması toleransı 30 sn.
  - Her istekte `jti` kara listesi kontrol edilir (çıkış, acil iptal) → 401.
  - Her istekte `perms_ver` kontrol edilir. Rol ataması ya da yetki matrisi değişince hesabın eski token'ı → 401 ve yenileme zorunlu olur.
- Kullanılan claim'ler: `sub`, `jti`, `school_id`, `perms_ver`, rol (`SuperAdmin`).

### 6.3 Refresh token: istemci türüne göre

| İstemci | Nasıl belirlenir | Refresh token nerede |
|---|---|---|
| Web (varsayılan) | `X-Client-Type` başlığı yok | httpOnly cookie `oksis_rt`: `Path=/api/v1/auth`, `SameSite=Lax`, `Secure` = istek HTTPS ise. **Gövdedeki `refreshToken` boşaltılır.** |
| Mobil | `X-Client-Type: mobile` | Yanıt gövdesinde |

- Mobil istemci bu başlığı **her istekte ve refresh isteğinde** gönderir. Başlık olmazsa yeni refresh token gövdeden temizlenir ve oturum düşer (B-27).
- İstemci refresh isteğini `credentials: "include"` ile yollar.

### 6.4 401 davranışı (istemci)

1. Aynı anda gelen 401'ler **tek bir refresh çağrısında birleşir** (single-flight).
2. Refresh başarılı olursa istek yeni token ile **bir kez** tekrarlanır. Tekrar için klon istek gönderilmeden önce alınır, çünkü gövdeli istekte gövde 401'den sonra artık okunamaz (X-07).
3. Refresh başarısız olursa `auth.clear()` ve `onUnauthorized()` çağrılır; kullanıcı girişe gider.
4. `login`, `forgot-password`, `reset-password` ve `refresh` uçlarındaki 401 kullanıcı hatasıdır. Bu uçlarda refresh denenmez.
5. Sorgular 401 ve 403'te yeniden denenmez.

### 6.5 İmzalama ve ömür: kodda görülen durum

| Ayar (okunan ad) | Okuyan | Varsayılan |
|---|---|---|
| `Jwt:PrivateKeyPem` | Token üretimi (RS256) | boş |
| `Jwt:SecretKey` | Token üretimi (HS256, PrivateKeyPem boşsa) **ve** doğrulama | boş |
| `Jwt:PublicKeyPem` | `JwtOptions` alanı, **doğrulamada kullanılmıyor** | boş |
| `Jwt:AccessTokenMinutes` | Access token ömrü | **15** |
| `Jwt:RefreshTokenDays` | Refresh token kaydının ömrü | 30 |
| `Jwt:RefreshTokenExpirationDays` | Refresh cookie'sinin süresi (`AuthController`) | 30 |

> [!warning] Ayar adı uyuşmazlıkları (2026-09-13)
> - `appsettings*.json` dosyaları `Jwt:AccessTokenExpirationMinutes` (15/60) ve `Jwt:PublicKeyPath` ayarlarını tanımlıyor, **ama kod bu adları okumuyor**. Bu yüzden access token ömrü her ortamda fiilen **15 dk** (varsayılan).
> - `Program.cs` doğrulama anahtarını yalnız `Jwt:SecretKey`'den kuruyor. RS256 ile imzalanan bir token için doğrulama anahtarı bağlanmıyor.
> - Prod'da hangi yolun kullanılacağı: {{TBD}}.

### 6.6 Kiracı (tenant)

- Kimliği doğrulanmış her istek `school_id` claim'i taşımalıdır. `SuperAdmin` bu kuralın istisnasıdır.
- Taşımıyorsa 403 döner (§4.3).
- Muaf yollar: `/health*`, `/scalar*`, `/openapi*`.
- Okul değiştirme bir istemci durumu değildir; token üzerinden yapılır (`switch-profile`).

## 7. Başlıklar

| Başlık | Yön | Kural |
|---|---|---|
| `Authorization: Bearer <jwt>` | istek | Korumalı REST uçları |
| `X-Client-Type: mobile` | istek | Mobil istemci her istekte gönderir. Web göndermez. |
| `X-Correlation-Id` | istek (isteğe bağlı) / yanıt (her zaman) | İstemci gönderirse aynen kullanılır, göndermezse sunucu üretir. Serilog `LogContext`'e yazılır. CORS'ta `WithExposedHeaders` ile açıktır. Zarftaki `correlationId` alanı ile aynı değerdir. |
| `Cookie: oksis_rt` | istek (web) | Yalnız `/api/v1/auth` yoluna gider |
| `Content-Type: application/json` | istek / yanıt | Dosya uçları hariç |

## 8. CORS, proxy, hız sınırı, sağlık

- **CORS:** `Cors:AllowedOrigins` listesi, `AllowAnyMethod`, `AllowAnyHeader`, `AllowCredentials`. Ortam değerleri için bkz. [[ortamlar]].
- **Web proxy (geliştirme):** Next `rewrites` kuralı `/api/:path*` isteklerini `${OKSIS_API_PROXY_TARGET}/api/:path*` adresine yönlendirir. Varsayılan hedef `http://localhost:5112`. İstekler aynı origin'den gider, CORS devreye girmez.
- **Mobil:** Mutlak adres kullanır (`EXPO_PUBLIC_API_URL`).
- **Hız sınırı:** `Program.cs` üç politika tanımlar: `authenticated` 300/dk, `anonymous` 30/dk, `invitation-public` IP başına 10/dk. `UseRateLimiter()` çağrılıyor, **fakat hiçbir uçta `[EnableRateLimiting]` yok ve global limiter tanımlı değil**. Politikalar bugün **uygulanmıyor**.
- **Sağlık:** `/health/ready` (mssql + redis), `/health/live`. Bu uçlar zarf dönmez.
- **Geliştirici arayüzleri (yalnız Development):** `/openapi/v1.json`, `/scalar`, `/hangfire` (yalnız localhost).

## 9. Açık noktalar ({{TBD}})

| Konu | Soru |
|---|---|
| Doğrulama hatası `field` harf düzeni | FluentValidation özellik adı PascalCase mi, camelCase mi geliyor? {{TBD}} |
| Model binding hataları | ProblemDetails zarfa çevrilecek mi? {{TBD}} |
| `TenantContextMiddleware` 403 gövdesi | Zarfa çevrilecek mi? {{TBD}} |
| JWT ayar adları ve RS256 doğrulaması | §6.5 {{TBD}} |
| Hız sınırı politikalarının bağlanması | Hangi uçlara uygulanacak? {{TBD}} |
| `meta` alanı | Kaldırılacak mı, doldurulacak mı? {{TBD}} |
