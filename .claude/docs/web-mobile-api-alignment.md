# Web & Mobile → API Hizalama İhtiyaç Analizi

> **Bağlam:** Users / Person / Identity için API katmanı geliştirme + testlerle tamamlandı
> (Account-tabanlı auth, `Modules/Users` Person/Profile/Invitation/Relationship/RoleAssignment/Consent,
> `identity` şema konsolidasyonu, `users.view-all` izni). Bu geliştirme yeni uçlar ve sözleşme
> değişiklikleri getirdi; Web ve Mobile bir kısmında hâlâ köprü/legacy uçlara bağlı.
> Bu doküman, **mevcut kod tabanı taranarak** (docs'a değil, gerçek çağrı yerlerine bakılarak)
> üretilmiş hizalama ihtiyaç listesidir. Geliştirme bu analiz üzerinden başlayacak.
>
> **Güncel:** 2026-06-02 · Kaynak: API controller route taraması + web/mobile `*.api.ts` çağrı yerleri.

---

## 0. Referans — Güncel API Yüzeyi (kaynak controller'lar)

**Auth (`api/v1/auth`):**

| Grup | Uçlar |
|---|---|
| **Account (yeni — hedef)** | `account/login`, `account/refresh`, `account/logout`, `account/logout-all`, `account/forgot-password`, `account/reset-password`, `account/change-password`, `account/switch-profile`, `account/switch-child`, `account/switch-season`, `me/context`, `me/available-contexts` |
| **Legacy User (köprü — emekliye)** | `login`, `refresh`, `revoke`, `reset-password`, `confirm-reset` |

**Users (yeni — hedef):**

| Controller | Taban | Uçlar |
|---|---|---|
| `PersonsController` | `users/persons` | list · `{id}` · create · update · delete · `{id}/profiles` · `{id}/profiles/{type}` · lifecycle: `suspend`/`reactivate`/`graduate`/`transfer`/`archive` |
| `SelfController` | `users/self` | GET · PUT · `consents` · `consents/{id}/revoke` |
| `RelationshipsController` | `users` | `students/{id}/parents` · `parents/{id}/students` · `relationships` (POST) · `relationships/{id}` (PUT/DELETE) |
| `RoleAssignmentsController` | `users` | `persons/{id}/role-assignments` (GET) · `role-assignments` (POST) · `role-assignments/{id}/revoke` |
| `ConsentsController` | `users` | `persons/{id}/consents` · `consents` (POST) · `consents/{id}/revoke` · `consent-bundles/current` |
| `ImportsController` | `users/imports` | `template` · `preview` · POST · `{importId}` |
| `UserInvitationsController` | `users/invitations` | GET · POST · `bulk` · `{id}/resend` · `{id}/revoke` · `accept` · `by-token/{token}` |

**Legacy — emekliye ayrılacak controller'lar (K1/K6):**
`UsersController` (`api/v1/users`: `me`, `export`, `import`, `{id}/deactivate`, `me/change-password` …) ·
`InvitationsController` (`api/v1/invitations`) · `PublicInvitationsController` (`api/v1/public/invitations`).

---

## 1. WEB (`oksis-web`)

### Mevcut durum — büyük ölçüde hizalı ✅
- **Login** → `useAccountLogin` → `/auth/account/login` (LoginPage taşınmış; 409 inline profil seçimi, 403 suspended route).
- **Switcher / context / recovery** → `account.api.ts` tüm `/auth/account/*` + `/auth/me/*` uçlarına bağlı.
- **Person yönetimi** (admin) → `usePersons` + `person.api.ts` → `/users/persons` (list/detail/CRUD/profiles/lifecycle), `relationship.api.ts`, role-assignments GET, consents → hepsi yeni `users/*` uçlarında.
- **Self** → `self.api.ts` → `/users/self` (+ consents).

### Hizalama gerektiren noktalar (öncelik sırası)

| # | Konu | Mevcut | Hedef | Etki |
|---|---|---|---|---|
| W1 | **Davet önizleme yolu tutarsız** | `publicInvitation.api.ts` önizlemeyi **legacy** `/public/invitations/{token}` ile çekiyor, kabulü ise **yeni** `/users/invitations/accept` ile yapıyor | Önizlemeyi `/users/invitations/by-token/{token}` (yeni `UserInvitationsController`) uca taşı | Orta — tek api dosyası; legacy public controller'a bağımlılığı keser |
| W2 | **ForceChangePasswordPage legacy auth.api'de** | `ForceChangePasswordPage.tsx` → `identity/api/auth.api.ts` (legacy User akışı) | `useAccountChangePassword` → `/auth/account/change-password` (force flow) | Orta — RequirePasswordChange akışı Account token'la uyumlu olmalı |
| W3 | **RoleAssignment yazma UI'ı eksik** | `person.api.ts` yalnız **GET** `role-assignments` çağırıyor; API'de `POST role-assignments` + `{id}/revoke` mevcut | Rol-atama sekmesine ekle/iptal aksiyonları (izin: `roles.assign`) | Orta — yeni UI |
| W4 | **`users.view-all` izin gating** | Yeni izin eklendi (SUPER/SCHOOL_ADMIN) | Person liste/detay görünürlük gate'lerinin `users.view-all`'a göre çözüldüğünü doğrula (izinler `/auth/me/context`'ten hydrate) | Düşük — çoğunlukla mevcut |
| W5 | **Legacy ölü kod temizliği (K1/K6)** | `identity/api/user.api.ts`, `identity/api/auth.api.ts`, `UserFormModal`, legacy hook'lar (`useUsers/useUser/useCreateUser/useUpdateUser/useDeleteUser/useExportUsers/useImportUsers/useLogin/useLogout/useResetPassword/useChangePassword/useConfirmResetPassword/useUserProfile`), orphan `ProfileSelectPage` — portallarda **route edilmiyor** ama duruyor | Sil (legacy User controller'lar emekliye ayrılınca) | Düşük — davranışsal etki yok, borç temizliği |

---

## 2. MOBILE (`oksis-mobile`)

### Mevcut durum — kısmen hizalı
- **Login** → `useAccountLogin` → `/auth/account/login` (LoginScreen taşınmış; 401/403/409/423/429 sınıflandırma). ✅
- **Switcher / context / account logout / change-password** → `account.api.ts` tüm `/auth/account/*` + `/auth/me/*`. ✅
- **Self** → `self.api.ts` → `/users/self` (+ consents); ProfileScreen/ProfileConsentsScreen bağlı. ✅
- **client.ts** refresh önce `/auth/account/refresh`, sonra legacy fallback. ✅

### Hizalama gerektiren noktalar (öncelik sırası)

| # | Konu | Mevcut | Hedef | Etki |
|---|---|---|---|---|
| M1 | **Davet kabul akışı tümüyle legacy** | `invitations/api/invitation.api.ts` → `/public/invitations/{token}`, `/accept`, `/expired`, `/request-refresh` (token URL'de, otomatik giriş, **rıza adımı yok**) | `/users/invitations/by-token/{token}` (önizleme) + `/users/invitations/accept` (token **gövdede** + DataProcessing **rıza adımı** + parola politikası). Web ISSUE-15 sihirbazının mobil karşılığı. | **Yüksek** — bilinçli ertelenmişti (identity revizyonu); ana kalem |
| M2 | **Account parola kurtarma ekranları yok** | Yalnız orphan legacy hook'lar (`useResetPassword`→`/auth/reset-password`, `useConfirmResetPassword`→`/auth/confirm-reset`); ekran yok | ForgotPassword + ResetPassword ekranları → `/auth/account/forgot-password` + `/auth/account/reset-password` (uniform 202; web ISSUE-17 paritesi) | **Yüksek** — kullanıcı parolasını sıfırlayamıyor |
| M3 | **Force-change-password ekranı yok** | RequirePasswordChange için mobil akış yok | `useAccountChangePassword` (hook hazır) ile zorunlu parola değiştirme ekranı; login sonrası `requirePasswordChange` true ise yönlendir | Orta |
| M4 | **Force-logout (push/SignalR) consumer yok** | 401 zincirleme logout var; backend `AllSessionsLoggedOut`/`PasswordChanged`/`SuspiciousTokenReuse` event'leri dinlenmiyor | `/hubs/session` veya push ile force-logout tüketimi (backend ISSUE-12 hazır) | Orta — güvenlik; ayrı entegrasyon görevi |
| M5 | **Self-servis parola değiştirme ekranı** | `useAccountChangePassword` hook var; bağlı ekran var mı doğrula | Ayarlar altında change-password ekranı → `/auth/account/change-password` | Düşük |
| M6 | **Legacy auth hook temizliği** | Orphan: `useLoginMutation`→`/auth/login`, `useUserProfile`→`/users/me`, `useChangePassword`→`/users/me/change-password`, `useResetPassword`, `useConfirmResetPassword` (hiçbir ekranda kullanılmıyor) | M1–M3 tamamlanınca sil | Düşük — borç temizliği |

### Kapsam dışı (mobilde olmayacak — kasıtlı)
- **Person/admin yönetimi** (liste/CRUD/lifecycle/relationship/role-assignment/invitation oluşturma) **yalnız web-admin**. Mobil `AdminNavigator` Dashboard-stub + school-settings taşır; person yönetim ekranı taşımaz. `lifecycleState` mobilde yalnız self salt-okunur gösterim.
- **Excel import** — web-admin only.

---

## 3. Önerilen Geliştirme Sırası

1. **M1 — Mobil davet kabul akışı** (`by-token` + `accept` + rıza adımı) — en yüksek değer, en uzun süredir ertelenmiş.
2. **M2 — Mobil Account parola kurtarma** (forgot/reset) — fonksiyonel boşluk.
3. **W1 + W2 — Web davet önizleme + force-change-password** legacy uç temizliği.
4. **W3 — Web rol-atama yazma UI'ı.**
5. **M3 / M4 / M5 — Mobil force-change-password, force-logout consumer, self change-password.**
6. **W4 — `users.view-all` gating doğrulaması.**
7. **W5 + M6 — Legacy ölü kod temizliği** (legacy controller emekliliğiyle birlikte K1/K6).

> Not: Legacy `/auth/login`, `api/v1/users`, `api/v1/invitations`, `api/v1/public/invitations`
> controller'ları yalnız Web (W1/W2) ve Mobile (M1/M2) bu uçlardan koptuğunda emekliye ayrılabilir.
</content>
</invoke>
