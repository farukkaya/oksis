# Kimlik Doğrulama — UI Flows

> Bu modülün frontend ekranları, kullanıcı akışları, state management. Kaynak: teknik analiz Bölüm 7, 10, 18 + ihtiyaç analizi senaryoları.
> Genel UI/UX kuralları için bkz. `frontend/ui-ux-rules.md` ve `frontend/component-rules.md`.

---

## Ekranlar

### Login — `/login`

**Portal:** public. **Component:** `LoginPage` (`src/modules/identity/...`).
**State:** RHF + Zod (identifier, password); React Query mutation `useLogin`.
**Aksiyonlar:** "Giriş" → `/auth/login`. "Parolamı unuttum" → `/forgot-password`.
**Yanıt yönlendirme:**
- `200` → context'e göre portal layout'a (`/admin` | `/teacher` | `/parent` | `/student`).
- `409 NEEDS_PROFILE_SELECTION` → profil seçim ekranı.
- `403 ACCOUNT_SUSPENDED` → açıklayıcı mesaj + okul iletişim.
- `401` → uniform hata "Kullanıcı bulunamadı veya parola hatalı."
- `429` → "Çok fazla deneme, lütfen sonra tekrar deneyin."
**Edge case:** TCKN ile giriş denenirse → "Bu alan e-posta veya telefon olmalıdır."

### Profil Seçimi — `/select-profile`

Çok profilli kullanıcı. `availableProfiles` listelenir. İki giriş noktası:
- **Login sırasında (409):** kullanıcı seçimi yapınca istemci **login isteğini `profileType` ile tekrarlar** → `200` + JWT, ilgili portala yönlendirir. (Login henüz tamamlanmadığından token yoktur; bu yüzden switch-profile değil, re-login kullanılır.)
- **Oturum içi manuel switch:** zaten giriş yapmış kullanıcı header/sidebar'dan profil değiştirir → `/auth/switch-profile` (Bearer token) → yeni JWT.

### Context Switcher (header/sidebar)

- **Profile switcher** — Parent↔Teacher; switch sonrası rota değişir (`/teacher/*` ↔ `/parent/*`), React Query cache invalidate.
- **Child switcher** (sadece Parent) — `/auth/switch-child`; **token değişmez**, `activeChildChild` Zustand store + React Query key güncellenir. "Tümü" seçeneği → birleşik dashboard.
- **Season switcher** — `/auth/switch-season`; geçmiş sezon seçilirse salt-okunur banner gösterilir, yazma aksiyonları disable.

### Parola — `/forgot-password`, `/reset-password`, `/change-password`

Forgot uniform başarı mesajı (kanal sızdırmaz). Reset token'lı; başarılı reset/change sonrası tüm oturumlar düşer → login'e yönlendir.

---

## Token Refresh (web)

Tek-uçuş (single-flight) axios interceptor: `401` alınca `/auth/refresh` ile token yenilenir; eşzamanlı istekler tek refresh'i bekler. Refresh başarısız → login.

## Forced Logout (SignalR)

`SessionHub` `ForceLogout` mesajı → token atılır, login'e yönlendirilir, toast: "Oturumunuz sonlandırıldı."

---

## State Yönetimi

- Server state: React Query (`useLogin`, `useCurrentContext`, `useAvailableContexts`, switch mutation'ları). **Zustand'a kopyalanmaz.**
- Zustand: küçük topic store'lar — `auth` (token/identity), `activeChild`, `activeSeason`.
- Access token in-memory; refresh token web'de httpOnly cookie (bkz. `RefreshTokenCookie`), mobilde `expo-secure-store`.

## Mobil Notları

- 3-tap kuralı: profil/çocuk switch ≤ 2 tap. Refresh token `expo-secure-store`, access token in-memory.

---

## i18n Key'leri (örnek)

| Key | TR |
|---|---|
| `auth.login.title` | Giriş Yap |
| `auth.login.identifier` | E-posta veya Telefon |
| `auth.login.error.invalid` | Kullanıcı bulunamadı veya parola hatalı |
| `auth.login.error.suspended` | Hesabınız geçici olarak askıya alınmıştır |
| `auth.switch.readonly` | Geçmiş sezon — salt-okunur mod |

---

## Yasaklar

- ❌ Spinner (Skeleton kullan). ❌ Hardcoded Türkçe (i18n zorunlu). ❌ Zod'suz form validation.
- ❌ `activeChildId`'yi token'dan okumak (server-session/Query'den gelir).
- ❌ Uniform login hatasını bozup hangi alanın yanlış olduğunu göstermek.

> Detay: `frontend/component-rules.md`, `frontend/form-validation-rules.md`.
