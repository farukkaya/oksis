# Kimlik / Identity — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓░░░░` %58   ·   Status: in-progress   ·   Güncel: 2026-05-31

> Temel: Mevcut `User` tabanlı auth (login/refresh/invite/password-reset, `Oksis.Application/Modules/Identity` ≈77 cs) + master seed (roller/izinler) çalışır.
> 2026-05-30: Teknik analiz (*Login & Profile Switch · Sürüm 1.0*) docs'a işlendi — domain (Account), api-contracts (switch/me/context), database-schema (identity.accounts/refresh_tokens), permissions (RBAC+ABAC, permission cache), business-rules (TR-auth-001…018), notifications (audit/SignalR), ui-flows, open-questions (TQ-auth-001…007) güncellendi. Hedef model dokümante edildi; **kod henüz yazılmadı**.

---

## ✅ Tamamlanan Yapılar

- **Master data:** `system_roles` (7), `permissions` (32), `role_permissions` (66) + deterministik seed.
- **Backend (mevcut `User` modeli):** login + refresh akışı, kullanıcı + davet (invitation) handler'ları, `IJwtTokenService`, `IRefreshTokenStore` (InMemory + DB), `IPasswordHasher`, `RefreshTokenCookie`.
- **Web:** `src/modules/identity` + `src/modules/invitations` dikey dilim; admin `users` sayfası.
- **Docs:** 10 dosyanın tamamı teknik analize göre dolduruldu (skeleton/`{{TBD}}` büyük ölçüde kaldırıldı).

## ⏳ Eksik / Bekleyen Yapılar (teknik analiz hedefi)

- **`Account` aggregate** (auth/session sahibi) + `identity.accounts`/`refresh_tokens` migration — OQ-identity-001 kararına bağlı.
- **Identifier resolver + read-port:** `IIdentifierResolver` / `IPersonDirectory` (users köprüsü, TCKN reddi/normalizasyon).
- **Context resolution:** `IContextResolver`, `/me/context`, `/me/available-contexts`.
- **Switch:** profile/child/season + permission cache (Redis) + `perms_ver` + server-side child session.
- **Token sertleştirme:** refresh rotation + reuse detection, access token blacklist (Redis).
- **Yetki:** `ChildScopeRequirement` (ABAC), `ActiveSeasonWritePolicy`, permission cache invalidation.
- **Audit:** domain event → Serilog/Elasticsearch handler'ları + identifier/TCKN masking.
- **Gerçek zamanlı:** `SessionHub` forced logout + Redis backplane.
- **Arka plan:** Hangfire cleanup/retention job'ları (refresh/otp/dormant/audit-retention).
- **OTP / 2FA:** iskelet (Sprint 5) + aktivasyon (Sprint 6).
- **Mobile:** auth akışı (expo-secure-store refresh) + switch ekranları.

## ⚠️ Spec Dışına Çıkılanlar

- **2026-05-31 — Çok profilli 409 açığı login `profileType` hint'iyle kapatıldı (oksis-api):** `409 NEEDS_PROFILE_SELECTION` token döndürmüyordu ama `/auth/switch-profile` Bearer token istiyordu → yeni dual kullanıcı oturum açamıyordu. Çözüm: `AccountLoginCommand`/`AccountLoginBody`'ye opsiyonel `profileType` eklendi; istemci 409 sonrası aynı login'i seçtiği profille tekrarlar (`ContextResolver` önceliği: hint > LastActiveProfileType > 409; açık ama sahip-olunmayan değer yine 409). switch-profile oturum-içi manuel geçiş için korunur. **Gerekçe:** ui-flows "409 → switch-profile" diyordu ama bu interim "seçim token'ı" + authorization policy gerektiriyordu; re-login hint'i daha küçük yüzey, ek token/policy yok (kullanıcı kararı). Doküman güncellendi (api-contracts/ui-flows/business-rules). **Web hizalaması (oksis-web):** `LoginPage` 409'da artık `/profile-select`'e yönlendirmiyor; profil seçimini **inline** gösterip aynı credential'larla `profileType` ekleyerek tekrar login ediyor (parola yalnız bileşen belleğinde, router state'iyle taşınmaz). `ProfileSelectPage`/`/profile-select` artık 409 akışında kullanılmıyor (orphan, zararsız); `switch-profile` yalnız oturum-içi `ProfileSwitcher` için kalır.
- **2026-05-31 — account-login success-path `DbUpdateConcurrencyException` düzeltildi (oksis-api):** Tek profilli account-login `/auth/account/login` başarılı parolada 500 dönüyordu. Kök neden: `RefreshTokenConfiguration`'da `Id` için `ValueGeneratedNever()` eksikti → Guid PK convention'la `ValueGeneratedOnAdd` kalıyor, mevcut (tracked) `Account`'un `RefreshTokens` koleksiyonuna eklenen yeni token non-default key yüzünden `Added` yerine `Modified` sanılıyor, UPDATE üretiliyor, satır olmadığı için concurrency hatası. Düzeltme: `Id.ValueGeneratedNever()` (Person/Profile/ConsentRecord ile tutarlı). Aynı hata `/auth/refresh` (RotateRefreshToken) için de geçerliydi, kapsandı. Boş migration `20260531_refresh_token_id_value_generated_never` (yalnız model snapshot).
- **2026-05-31 — `users` şeması `identity`'ye birleştirildi + dev seed yeni modele geçti:** Kullanıcı yönetimi tabloları `[users]` → `[identity]` taşındı; dev seed artık yeni `Account/Person/Profile` modeliyle 3 okul için gerçekçi loginable kadro üretir. Detay: `users/completion_status.md → Spec Dışına Çıkılanlar`. Bu, OQ-identity-001 (Account vs User) için fiilen **Account yolunun** dev'de canlı olduğunu doğrular (legacy `User` seed'i kaldırıldı).
- **2026-05-30 — Modül yerleşimi:** Teknik analiz ayrı projeler (`Oksis.Identity.Domain` vb.) önerir; bu repo modüler monolit olduğundan docs **mevcut `Oksis.Domain/Modules/Identity` alt klasör** yapısına göre yazıldı. Sebep: CLAUDE.md klasör kuralı. Onay: docs güncellemesi sırasında varsayıldı; mimar teyidi bekliyor (OQ-identity-002).
- **2026-05-30 — Account vs User:** Teknik analizin `Account` aggregate'i hedef olarak dokümante edildi, ancak mevcut kod `User` üzerinde çalışıyor. Hangi yolun seçileceği OQ-identity-001'de açık; karar verilene kadar bu bir **dokümante edilmiş hedef**, uygulanmış gerçek değil.
