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

## BR-identity-002 (TR-auth-002): TCKN login'de tip düzeyinde reddedilir; StudentNumber eklendi

**Kural:** `FindForLoginAsync` Email, Phone ve StudentNumber kabul eder; TCKN gelirse `PersonLookupResult.Rejected` döner. Recovery (`FindForRecoveryAsync`) Email/Phone/TCKN kabul eder (TCKN tenant-tuzlu hash ile).

**StudentNumber login (Faz 1B-BE, 2026-06-30):** `Identifier.Create` 1-9 haneli sayısal girdiyi `IdentifierType.StudentNumber` olarak sınıflandırır. `IPersonDirectory.FindByStudentNumberAsync(studentNumber, schoolId, ct)` tenant-scope ile çalışır; `SchoolHint` (okul ID'si) zorunludur — tenant olmadan StudentNumber global namespace'de anlamsız. Hesapsız (küçük-kademe, Anaokulu/İlkokul) öğrenci için uniform not-found döner (`PersonLookupResult.NotFound`); ayrı hata kodu sızdırmaz. Öğrenci-no format/kabul kuralları (E4.4/E2.3) ayrı spec'e ertelendi; login resolver format-agnostic (1-9 hane).

**Sebep:** TCKN ağda dolaşmamalı; iki ayrı imza bunu derleyici düzeyinde engeller. StudentNumber okul-scoped (SchoolHint zorunlu) — global eşleşme riski yok.

**Uygulama:** Login ve recovery için ayrı port metotları; TCKN normalizasyonu `NationalIdHash(value, tenantSalt)`; StudentNumber için `IPersonDirectory.FindByStudentNumberAsync`.

**Test referansı:** `IdentifierResolverTests.Login_Rejects_Tckn`, `IdentifierResolverTests.Login_StudentNumber_Resolves_With_SchoolHint`.

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

**Kural:** `activeSeasonId != School.CurrentSeason` ise yazma endpoint'leri `403`. `season.archive.view` permission gerekir; veliye kendi çocuğunun sınırlı geçmişi için ABAC ile otomatik açık.

**Uygulama:** `ActiveSeasonWritePolicy` merkezi authorization policy (her handler'da elle tekrar edilmez).

**switch-season durum-bazlı erişim gating (B2, 2026-06-22):** `AccountSwitchSeason` handler hedef sezonu DB'den `Status` ile yükler (tenant query filter otomatik, `IgnoreQueryFilters` yok) ve şu kapıyı uygular:

| Hedef sezon | Gerekli izin | readOnly | Reddedilince |
|---|---|---|---|
| Yürürlükteki (current / `IsCurrent`) sezon | (yok) | false | — |
| `Setup` | `season.update` | true | 403 `unlock-unauthorized` |
| `Archived` (ve beklenmeyen `Active` ama current-değil edge) | `season.archive.view` | true | 403 `unlock-unauthorized` |
| Hedef sezon bulunamadı | — | — | 404 NotFound |

İzin reddi `RecordPermissionDenied(reddedilen-kod, season:{id})` ile audit'lenir; doğru kod (`season.update` veya `season.archive.view`) loglanır. `season.archive.view` yalnız SuperAdmin + SchoolAdmin'e seed edilir (`ACADEMIC_SESSIONS`/`ARCHIVE_VIEW`); veli kendi çocuğunun geçmişine ABAC/child-scope ile erişir, RBAC değişmez.

**Test referansı:** `ActiveSeasonWritePolicyTests`, `AccountSwitchSeasonCommandHandlerTests`.

---

## BR-identity-009: KVKK kapıları (consent + masking + retention)

**Kural:** Login'de `DataProcessing=Granted` ve consent bundle versiyon eşleşmesi yoksa `202` + onay yönlendirme. Log/audit'te identifier ve TCKN maskelenir (`a***@x.com`, `+90••••••12`). Audit IP/UA retention default 1 yıl; Hangfire job ile anonimleştirilir. Consent geri çekilince / suspend olunca tüm oturumlar SignalR ile forced logout.

**Test referansı:** `ConsentGateTests`, `LogMaskingTests`, `AuditRetentionJobTests`.

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| Çok profilli kullanıcı (Parent+Teacher) | Öncelik: login `profileType` hint'i (geçerli & elde) > `LastActiveProfileType` (elde) > `409 NEEDS_PROFILE_SELECTION`. Açık ama sahip-olunmayan `profileType` → yine `409` (sessizce başka profile düşmez) |
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
| 2026-06-30 | BR-identity-002 güncellendi: StudentNumber login eklendi (Faz 1B-BE) | Öğrenci hesabı + öğrenci-no login resolver; SchoolHint zorunlu; format ayrı spec |
