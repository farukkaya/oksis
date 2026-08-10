# OKSİS — Backend Security Rules

> Auth, yetki, veri koruması. KVKK + ailelerin güveni. **Security failure = ürün ölümü.**

---

## 1. Tehdit Modeli

| Tehdit | Senaryo | Önlem |
|--------|---------|-------|
| Cross-tenant erişim | Veli A okulundaki çocuğun verisini B okulundan görür | Global query filter + interceptor (`multi-tenant-rules.md`) |
| IDOR | Bir parent başka velinin çocuğunun notunu görür | Resource-level authz (§5) |
| Privilege escalation | Teacher → SchoolAdmin yetkilerine ulaşır | Server-side permission check, never trust client |
| Token theft | JWT çalınır, kullanılır | Kısa süreli token + refresh rotation + device binding |
| Mass assignment | API'ye `{role: "SuperAdmin"}` gönderilir | Request DTO whitelist (no domain entity bind) |
| Brute force | Login deneme | Rate limit + account lock |
| Stored XSS | Duyuru içine `<script>` | Server-side sanitize + frontend encode |
| Pediatric data leak | Loglara öğrenci T.C., notları | Log scrubbing + KVKK-compliant fields |

---

## 2. Authentication

### 2.1 JWT (Access Token)

- Algoritma: **RS256** (asymmetric). Private key Vault'ta, public key API'de.
- Süre: **15 dakika.**
- Issuer: `oksis-api`. Audience: `oksis-client`.
- Claims (minimum):

```json
{
  "sub": "<user-id>",
  "school_id": "<school-id>",      // SuperAdmin'de yok
  "role": ["Teacher", "Parent"],
  "permissions": ["attendance:create", "marks:view"],
  "tid": "<token-id>",             // refresh token ile pair için
  "device": "<device-fingerprint>",
  "iat": ..., "exp": ..., "iss": ..., "aud": ...
}
```

> Permission claim **dolu** gönderilir; runtime DB lookup yok. Permission değişince refresh ile yenilenir.

### 2.2 Refresh Token

- Süre: **30 gün** (kullanıcı tipine göre değişebilir; öğretmen 7 gün).
- Format: 256-bit random, **hash'lenmiş** olarak DB'de.
- **Rotation:** Her refresh isteğinde **yeni** refresh + access döner; eski refresh **invalidate** edilir.
- **Reuse detection:** Aynı refresh token 2. kez kullanılırsa → o kullanıcının **tüm** session'ları invalidate, audit log.
- Device binding: `device_fingerprint` (UA + IP-hash) claim'i refresh'te eşleşmeli.

```sql
CREATE TABLE refresh_tokens (
    id              uniqueidentifier primary key,
    school_id       uniqueidentifier not null,
    user_id         uniqueidentifier not null,
    token_hash      nvarchar(64) not null,   -- SHA-256
    device          nvarchar(128) not null,
    issued_at       datetimeoffset not null,
    expires_at      datetimeoffset not null,
    revoked_at      datetimeoffset null,
    replaced_by_id  uniqueidentifier null,
    UNIQUE (token_hash)
);
CREATE INDEX ix_refresh_tokens_user_id_active ON refresh_tokens(user_id) WHERE revoked_at IS NULL;
```

### 2.3 Login Flow

```
POST /api/v1/auth/login
{ email, password, deviceFingerprint }
→ 200 { accessToken, refreshToken, user }
   401 invalid credentials (generic message — username valid/invalid leak yok)
   423 account locked
   428 mfa required (gelecek)
```

- Password: **Argon2id** (memory=64MB, iter=3, parallelism=4). Minimum 8 char + complexity.
- Login attempt limit: **5 başarısız / 15 dakika** → 30 dk lock.
- Lock öncesi captcha (3. denemeden sonra) — gelecek.

### 2.4 Logout

- Access token: stateless, expire bekler. (İstersek blacklist tutarız ama maliyetli.)
- Refresh token: `revoked_at` set'lenir; ileride reuse detection için kalır.
- `POST /api/v1/auth/logout` → mevcut refresh revoke.
- `POST /api/v1/auth/logout-all` → kullanıcının tüm refresh'leri revoke.

---

## 3. Authorization

### 3.1 Role + Permission Hibrit Model

- **Role** kabaca grup: `SuperAdmin`, `SchoolAdmin`, `SchoolStaff`, `Teacher`, `Parent`, `Student`, `Secretary`, `Accountant`.
- **Permission** ince-grenli: `students:view`, `attendance:create`, `marks:publish`...
- Role → Permission mapping `permission-matrix.md` dosyasında. DB'de `role_permissions` tablosu.
- Custom rol oluşturma **MVP'de yok**. V2'de SchoolAdmin custom role + permission seçer.

### 3.2 Permission Tabanlı Endpoint Guard

```csharp
[ApiController]
[Route("api/v1/attendance")]
public sealed class AttendanceController : ControllerBase
{
    [HttpPost("sessions")]
    [RequirePermission("attendance:create")]
    public Task<IActionResult> CreateSession(CreateSessionCommand cmd, CancellationToken ct)
        => _mediator.Send(cmd, ct).ToActionResult();
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class RequirePermissionAttribute(string permission) : AuthorizeAttribute
{
    public RequirePermissionAttribute(string p) : base(policy: $"perm:{p}") { ... }
}
```

`AddAuthorization(o => o.AddPolicy("perm:attendance:create", p => p.RequireClaim("permissions", "attendance:create")))` — startup'ta tüm permission'lar için policy üretilir.

### 3.3 Resource-Level Authorization

Permission yetmez; **scope** kontrolü gerekir.

| Senaryo | Kural |
|---------|-------|
| Teacher yoklama girer | Sadece kendisine atanmış `ClassSubjectAssignment` üzerinden |
| Parent öğrenci notunu görür | `StudentParent` join'inde olduğu öğrenci için |
| Student kendi verisini görür | `Student.UserId == currentUser.Id` |
| SchoolAdmin tüm okul verisi | Tenant zaten kısıtlı, ek scope yok |

```csharp
public interface IResourceAuthorizationService
{
    Task EnsureCanAccessClassAsync(ClassId classId, CancellationToken ct);
    Task EnsureCanAccessStudentAsync(StudentId studentId, CancellationToken ct);
    Task EnsureCanAccessHomeworkAsync(HomeworkId homeworkId, CancellationToken ct);
}

// Handler içinde:
public async Task<Result> Handle(CreateAttendanceSessionCommand cmd, CancellationToken ct)
{
    await _resourceAuth.EnsureCanAccessClassAsync(cmd.ClassId, ct);  // ← Throw if not authorized
    // ... iş
}
```

**Throw:** `ForbiddenException` → 403. **Leak yok:** "bu sınıfa erişiminiz yok" yerine generic 403; veya 404 (resource yokmuş gibi).

### 3.4 SuperAdmin

- Tüm permission'ları var ama her işlemi **audit'lenir**.
- Tenant verisine erişim → "impersonate mode" → UI'da kalıcı banner.
- SuperAdmin işlemleri **iki adımlı onay** gerektirebilir (V2): hassas (silme/export) için.

---

## 4. Input Validation & Sanitization

### 4.1 Validation

- FluentValidation (her command/query için validator). Pipeline behavior'da otomatik çalışır.
- Domain invariant'ları **ayrıca** entity içinde korunur (defense-in-depth).

### 4.2 Sanitization

- HTML alanları (announcement body, message): **HtmlSanitizer** ile whitelist (allowed tags: p, b, i, ul, ol, li, a, br).
- `<script>`, `onerror`, `javascript:` → strip.
- Markdown rendering server-side **yok** (XSS sürface'i daraltır); frontend'de sandboxed render.
- File upload: extension + MIME whitelist + magic byte check (libraries: `MimeDetective`).

### 4.3 SQL Injection

- **Sadece** parameterized query (EF Core + Dapper named params).
- Raw SQL **yasak değil** ama her zaman `FromSqlInterpolated($"...{param}")` ile.
- Dinamik `ORDER BY` için **whitelist** (kolon adlarını enum'a map'le).

### 4.4 Mass Assignment

- API endpoint **request DTO** alır, **asla** domain entity. DTO whitelist alanlar.
- `[Bind]`, `[FromBody]` ile entity binding yasak.

---

## 5. Cryptography

| Kullanım | Algoritma |
|----------|-----------|
| Password hash | Argon2id |
| Refresh token store | SHA-256 (sadece eşitlik) |
| JWT signing | RS256 |
| Symmetric encryption (rare) | AES-256-GCM |
| TLS | TLS 1.3 only; HSTS preload |
| Random | `RandomNumberGenerator.GetBytes(...)` — `Random` **yasak** secret üretiminde |

Key management:

- Private signing key: Azure Key Vault / AWS KMS.
- Key rotation: 90 günde bir.
- Eski key'le imzalı token'lar **expire** olana kadar valid (15dk).

---

## 6. CORS

```csharp
services.AddCors(o => o.AddPolicy("oksis", p => p
    .WithOrigins("https://app.oksis.tr", "https://admin.oksis.tr")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials()
    .WithExposedHeaders("X-Correlation-Id")));
```

> **Yasak:** `.AllowAnyOrigin()` + `.AllowCredentials()` aynı anda.

---

## 7. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5/min/IP |
| `/auth/refresh` | 10/min/User |
| Genel (auth'lu) | 300/dakika/User |
| Genel (auth'suz) | 30/dakika/IP |
| File upload | 20/saat/User |
| Bulk operations | 5/saat/User |

> ASP.NET Core built-in rate limiter veya Redis-backed sliding window. Aşımda 429 + `Retry-After`.

---

## 8. Headers

Tüm response'larda:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...   (frontend domain'de set'lenir)
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=()
```

---

## 9. Audit Logging — Security Events

| Event | Log |
|-------|-----|
| Login (success/fail) | `auth.login`, includes ip, ua, school_id, success |
| Logout | `auth.logout` |
| Password reset request | `auth.password.reset.request` |
| Permission grant/revoke | `authz.permission.change` |
| Role assignment | `authz.role.assign` |
| Cross-tenant access (SuperAdmin) | `tenant.access.cross`, full payload |
| Sensitive data export | `data.export`, who/when/what |
| Data delete (KVKK) | `data.delete.kvkk` |
| Failed authz attempt | `authz.denied`, with resource id |

Audit log: `backend/logging-error-rules.md` §Audit.

---

## 10. KVKK / GDPR Uyum

- **Veri minimizasyonu:** Kayıt formlarında sadece zorunlu alan istenir.
- **Hak talepleri:**
  - Erişim (export): kullanıcı kendi verisini JSON/PDF olarak alır → `/api/v1/me/export`.
  - Silme: kullanıcı talebi → ParentApprovedDeletion (öğrenci için veli onayı) → 30 gün sonra anonymize.
- **Aydınlatma:** Onboarding sırasında consent log'lanır (`consent_logs` tablosu).
- **Çocuk verisi:** 18 altı veli onayı ile işlenir (default).
- **Sınır ötesi transfer:** Veri **TR'de** tutulur (sözleşme).
- **DPO temas:** `kvkk@oksis.tr` (sözleşme).

---

## 11. Secrets Management

- **`.env` repository'de yok.** `.env.example` var.
- Production: Azure Key Vault / AWS Secrets Manager.
- Development: `dotnet user-secrets` (per-developer).
- CI: GitHub Actions / Azure DevOps secret store.
- **Loglama:** Secret kelimesi geçen alanlar (`password`, `token`, `apiKey`) `Serilog.Enrichers.Sensitive` ile redact.

---

## 12. Dependency Security

- `dotnet list package --vulnerable --include-transitive` CI'da haftalık.
- Yüksek CVE → 7 gün içinde patch.
- Frontend: `npm audit` + Snyk/Dependabot.

---

## 13. Yasak Pratikler

- ❌ Frontend'e gönderilen permission'a güvenmek (server-side check zorunlu).
- ❌ Endpoint'te `schoolId` parametresi (claim'den alınır).
- ❌ "Skip auth for testing" attribute'ları (debug bile olsa).
- ❌ Password / token / secret log'a yazmak.
- ❌ `SELECT * FROM users WHERE email = 'x' AND password = 'y'` (hash karşılaştır).
- ❌ Custom crypto algoritması yazmak.
- ❌ `MD5`, `SHA1` (cryptographic hash olarak).
- ❌ Session cookie + JWT karışık (tek auth mekanizma).
- ❌ "TODO security later" — security shift-left.

---

## 14. AI Direktifleri

1. Endpoint açıyorsun: `[RequirePermission(...)]` + tenant + resource scope **üçü birden** var mı?
2. Yeni resource: `IResourceAuthorizationService` methodu da yazıldı mı?
3. DTO mu domain entity mi binding? → DTO. Whitelist alanlar.
4. Validator yazıldı mı? Kayıp alan yok mu?
5. Log atıyorsun: PII (T.C., telefon, mail) redact mı?
6. Crypto kullanıyorsun: kütüphane mi, kendin mi yazıyorsun? (Cevap: kütüphane.)
7. Test: 401 (anonim), 403 (yanlış permission), 403 (cross-tenant), 200 (doğru permission) — 4 case yazıldı mı?
