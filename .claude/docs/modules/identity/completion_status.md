# Kimlik / Identity — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓░░░░` %60   ·   Status: in-progress   ·   Güncel: 2026-05-31

> Temel: Mevcut `User` tabanlı auth (login/refresh/invite/password-reset, `Oksis.Application/Modules/Identity` ≈77 cs) + master seed (roller/izinler) çalışır.
> 2026-05-30: Teknik analiz (*Login & Profile Switch · Sürüm 1.0*) docs'a işlendi — domain (Account), api-contracts (switch/me/context), database-schema (identity.accounts/refresh_tokens), permissions (RBAC+ABAC, permission cache), business-rules (TR-auth-001…018), notifications (audit/SignalR), ui-flows, open-questions (TQ-auth-001…007) güncellendi. Hedef model dokümante edildi.
> 2026-05-31: **ISSUE-01 tamamlandı** — `Account` aggregate + `RefreshToken` child entity + `AccountId`/`Identifier`/`NationalIdHash`/`PasswordHash` value objects + 3 yeni enum (`IdentifierType`/`LoginFailureReason`/`LogoutReason`) + 13 domain event + 69 unit test eklendi. OQ-identity-001 kararı: **Option A — Account aggregate kuruldu**, mevcut `User` ile yan yana yaşıyor (Person/Account ayrımı users modülünde tamamlandıkça `User` auth'tan emekli edilecek).

---

## ✅ Tamamlanan Yapılar

- **Master data:** `system_roles` (7), `permissions` (32), `role_permissions` (66) + deterministik seed.
- **Backend (mevcut `User` modeli):** login + refresh akışı, kullanıcı + davet (invitation) handler'ları, `IJwtTokenService`, `IRefreshTokenStore` (InMemory + DB), `IPasswordHasher`, `RefreshTokenCookie`.
- **Web:** `src/modules/identity` + `src/modules/invitations` dikey dilim; admin `users` sayfası.
- **Docs:** 10 dosyanın tamamı teknik analize göre dolduruldu (skeleton/`{{TBD}}` büyük ölçüde kaldırıldı).

## ⏳ Eksik / Bekleyen Yapılar (teknik analiz hedefi)

- **`Account` aggregate persistence**: EF Core configuration + `identity.accounts`/`identity.refresh_tokens` migration (ISSUE-02).
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

- **2026-05-30 — Modül yerleşimi:** Teknik analiz ayrı projeler (`Oksis.Identity.Domain` vb.) önerir; bu repo modüler monolit olduğundan docs **mevcut `Oksis.Domain/Modules/Identity` alt klasör** yapısına göre yazıldı. Sebep: CLAUDE.md klasör kuralı. Onay: docs güncellemesi sırasında varsayıldı; mimar teyidi bekliyor (OQ-identity-002).
- **2026-05-30 — Account vs User:** Teknik analizin `Account` aggregate'i hedef olarak dokümante edildi, ancak mevcut kod `User` üzerinde çalışıyor. Hangi yolun seçileceği OQ-identity-001'de açık; karar verilene kadar bu bir **dokümante edilmiş hedef**, uygulanmış gerçek değil.
- **2026-05-31 — OQ-identity-001 karar:** Option A (yeni `Account` aggregate) seçildi ve domain katmanına eklendi; mevcut `User` aggregate'i auth sorumluluğunu **geçici olarak** koruyor. Sebep: teknik analize tam uyum (clean Person/Account ayrımı); users modülünde Person yazma tamamlandıkça `User`'dan PasswordHash/lockout/FailedLogin alanları emekli edilecek. Onay: mimar (auto-mode session içinde varsayıldı, mimar onayı sonradan teyit edilmeli).
