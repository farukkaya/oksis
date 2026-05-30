# Kimlik Doğrulama — Business Rules

> Bu modüle özel iş kuralları (OKSİS'e spesifik). Kaynak: teknik analiz Bölüm 2, 4, 8, 9, 12, 19. TR-auth-* kodları teknik analizle hizalıdır.
> Genel iş kuralları için bkz. proje kökündeki `business-rules.md`.

---

## BR-identity-001 (TR-auth-001): Identity → Users tek yönlü, read-only

**Kural:** Identifier doğrudan `identity.accounts` üzerinde aranmaz; önce `users.persons` üzerinde aranır, `LinkedAccountId` köprüsüyle account'a geçilir. Identity → Users bağımlılığı yalnızca tek yönlü ve read-only'dir; ters bağımlılık (Users → Identity) yasaktır.

**Sebep:** Modüler monolitte modül sınırlarını korumak; kimlik bilgisinin (Person) sahibi `users`, oturumun sahibi `identity`.

**Uygulama:**
- Application: `IPersonDirectory` / `IIdentifierResolver` read-port arayüzü Identity.Application'da tanımlanır.
- Infrastructure: `users` read-facade (`IUsersReadFacade`) üzerinden implemente edilir; somut Users tipleri ProjectReference ile sızmaz.

**Test referansı:** `IdentifierResolverTests`, modül bağımlılık (architecture) testi.

---

## BR-identity-002 (TR-auth-002): TCKN login'de tip düzeyinde reddedilir

**Kural:** `FindForLoginAsync` yalnızca Email ve Phone kabul eder; TCKN gelirse `PersonLookupResult.Rejected` döner. Recovery (`FindForRecoveryAsync`) Email/Phone/TCKN kabul eder (TCKN tenant-tuzlu hash ile).

**Sebep:** TCKN ağda dolaşmamalı; tek metot yazılırsa ileride biri TCKN kapısını login'e açabilir. İki ayrı imza bunu derleyici düzeyinde engeller.

**Uygulama:** Login ve recovery için ayrı port metotları; TCKN normalizasyonu `NationalIdHash(value, tenantSalt)`.

**Test referansı:** `IdentifierResolverTests.Login_Rejects_Tckn`.

---

## BR-identity-003 (TR-auth-003): ABAC, RBAC'i ezer (deny kazanır)

**Kural:** RBAC izni var ama ABAC bayrağı (`CanViewInfo`, `CanMakeDecisions`...) false ise → **deny**.

**Sebep:** Boşanmış/velayet kısıtlı veli senaryosu; KVKK/velayet ihlali önlenir.

**Uygulama:** `ChildScopeRequirement` handler ABAC bayrağını users read-port'tan kontrol eder; red → `403` + `PermissionDenied` audit.

**Test referansı:** `ChildScopeAbacTests`.

---

## BR-identity-004 (TR-auth-004): Uniform hata + suspended istisnası

**Kural:** Üç farklı arıza (identifier eşleşmedi / `LinkedAccountId` null / parola yanlış) **tek uniform `401`** döner: *"Kullanıcı bulunamadı veya parola hatalı."* Tek istisna: parola doğru ama `LifecycleState ∈ {Suspended, Archived, Transferred}` → açıklayıcı `403` (`ACCOUNT_SUSPENDED`).

**Sebep:** Enumeration koruması; meşru kullanıcıya neden giremediğini açıklamak.

**Uygulama:** account yoksa bile sabit-zaman dummy hash doğrulaması (timing-attack koruması); lifecycle gate parola doğrulandıktan sonra çalışır.

**Test referansı:** `LoginUniformErrorTests`, `LoginSuspendedGateTests`.

---

## BR-identity-005 (TR-auth-007): Lockout & brute-force

**Kural:** Kademeli lockout 5/10/20 başarısız deneme. Anlık sayaç Redis sliding-window (`login:fail:{accountId}` + `login:fail:ip:{ip}`); eşikte DB `locked_until` set. Admin `unlock` ile temizlenir.

**Sebep:** Brute-force koruması ile meşru veliyi kilitleme dengesi.

**Uygulama:** `ILoginGuard` (Redis) + DB persist + ASP.NET Core Rate Limiting (anonim login). Rate limit kapsamı TQ-auth-007 (IP vs IP+identifier).

**Test referansı:** `LoginGuardTests`, `RateLimitIntegrationTests`.

---

## BR-identity-006: Refresh token rotation + reuse detection

**Kural:** Her refresh'te eski token revoke, yeni token üretilir (`ReplacedByTokenHash` zinciri). Revoke edilmiş token tekrar kullanılırsa → account'un **tüm** refresh token'ları revoke + `SuspiciousTokenReuse` audit + (opsiyonel) SignalR forced logout. Refresh token DB'de hash'li.

**Test referansı:** `RefreshRotationTests`, `TokenReuseDetectionTests`.

---

## BR-identity-007: Permission cache & switch invalidation

**Kural:** Profile/Season switch'te permission cache key invalidate + `perms_ver++` + yeni JWT (idempotent). Child switch'te permission değişmez; yalnızca `session:{jti}:childId` güncellenir.

**Sebep:** Switch sonrası eski yetkinin sızmaması (en kritik risk).

**Test referansı:** `PermissionCacheInvalidationTests` (integration — ZORUNLU).

---

## BR-identity-008: Salt-okunur sezon

**Kural:** `activeSeasonId != School.CurrentSeason` ise yazma endpoint'leri `403`. `seasons.view-archived` permission gerekir; veliye kendi çocuğunun sınırlı geçmişi için ABAC ile otomatik açık.

**Uygulama:** `ActiveSeasonWritePolicy` merkezi authorization policy (her handler'da elle tekrar edilmez).

**Test referansı:** `ActiveSeasonWritePolicyTests`.

---

## BR-identity-009: KVKK kapıları (consent + masking + retention)

**Kural:** Login'de `DataProcessing=Granted` ve consent bundle versiyon eşleşmesi yoksa `202` + onay yönlendirme. Log/audit'te identifier ve TCKN maskelenir (`a***@x.com`, `+90••••••12`). Audit IP/UA retention default 1 yıl; Hangfire job ile anonimleştirilir. Consent geri çekilince / suspend olunca tüm oturumlar SignalR ile forced logout.

**Test referansı:** `ConsentGateTests`, `LogMaskingTests`, `AuditRetentionJobTests`.

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| Çok profilli kullanıcı (Parent+Teacher) | `LastActiveProfileType` listede ise o; değilse `409 NEEDS_PROFILE_SELECTION` |
| Çok çocuklu veli, hint yok | `activeChildId=null` → birleşik dashboard |
| Tek çocuk / tek profil | otomatik seçilir, seçim ekranı gösterilmez |
| Geçmiş sezona switch | yeni JWT, salt-okunur mod; yazma `403` |
| Boşanmış veli, `CanViewInfo=false` | RBAC izin olsa bile `403` (ABAC deny) |
| Revoke refresh token reuse | tüm oturumlar revoke + audit + forced logout |

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-05-15 | İlk skeleton oluşturuldu | İlk implementasyon |
| 2026-05-30 | Teknik analize göre TR-auth-001…018 kuralları işlendi | Login & Profile Switch teknik analizi (Sürüm 1.0) |
