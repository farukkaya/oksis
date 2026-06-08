# Kimlik Doğrulama — Açık Sorular

> Karar bekleyen konular. Karar verilince ilgili dosyaya taşınır ve buradan silinir.
> Kaynak: teknik analiz Bölüm 21 (TQ-auth-001…007) + bu repoya özgü uzlaştırma soruları.

---

## OQ-identity-001: `Account` aggregate mı, mevcut `User` genişletme mi? (EN KRİTİK)

**Soru:** Teknik analiz authentication/session sahibi olarak yeni bir `Account` aggregate + `users.persons` köprüsü önerir. Mevcut kodda bu sorumluluk `User` (`Oksis.Domain/Modules/Identity/Entities/User.cs`) üzerindedir ve Login/Refresh/Invite/PasswordReset zaten çalışmaktadır.

**Seçenekler:**
- **A) Yeni `Account` aggregate** — teknik analize tam uyum, temiz Person/Account ayrımı. Eksi: mevcut auth kodunun taşınması + büyük migration + `users` Person modelinin de oluşması gerekir.
- **B) Mevcut `User` genişletme** — yeni alanları (LastActiveProfile, lockout, perms_ver, consent_bundle_version) `User`'a ekle; Person/Account ayrımını ertele. Eksi: teknik analizin modül sınırı modelinden sapar.

**Bağımlılıklar:** `users` modülünün Person/Profile yazma tasarımı (OKSMVP-2) ile birlikte kararlaştırılmalı.
**Sorulacak:** Mimar + ürün. **Hedef karar tarihi:** Sprint 1 planlama öncesi.

**Karar: A (Account aggregate) — kademeli göç.** Account+Person modeli kuruldu, login/seed Account yolunda canlı (2026-05-31). **2026-06-08 — Faz 1:** Kullanıcılar ekranının okuma uçları (`ListUsers`/`GetUserById`/`GetUserStats`/`ExportUsers`) legacy `db.Users`'tan `Account`⋈`Person`'a taşındı (DTO sözleşmesi korundu; bkz. completion_status 2026-06-08). **Faz 2 (bekliyor):** yazma/auth akışları (login/refresh/invite/password-reset/admin CRUD/`GetUserActivity`/`GetUserProfile`) hâlâ `User`'da — bunlar taşınınca `User` entity + `[identity].[users]` tablosu + legacy `/auth/login` emekli edilip silinebilir. Bu issue bu noktaya kadar **kısmen kapalı.**

---

## OQ-identity-002: Modül yerleşimi — ayrı projeler mi, alt klasör mü?

**Soru:** Teknik analiz `Modules/Identity/Oksis.Identity.Domain|Application|Infrastructure|Api` ayrı projeleri önerir. Mevcut repo modüler monolit: tek `Oksis.Domain` + `Modules/Identity` alt klasör.
**Varsayılan:** Mevcut yapı korunur (CLAUDE.md: klasör kararları kasıtlıdır). Docs bu varsayıma göre yazıldı. **Karar mercii:** Mimar.

---

## OQ-identity-004: Login ekranı branding kaynağı — subdomain mı default tenant kodu mu?

**Soru:** Login artık identifier-tabanlı **cross-tenant** (okul, giriş sonrası `Person.SchoolId`'den belli olur). Ama login ekranı, kullanıcı giriş yapmadan önce okul adı/logosunu **`EXPO_PUBLIC_DEFAULT_TENANT_CODE`** (mobil) / web'deki sabit tenant kodundan çözüp gösteriyor. Tek-tenant deployment'ta bu doğru; tek-URL çok-tenant'ta okul login'den önce bilinmediği için **sabit bir okul göstermek yanıltıcı** olur.

**Seçenekler:**
- **A) Okul başına ayrı build/subdomain** (`okul1.oksis.app`): branding subdomain/tenant kodundan gelir, login'de okul adı **kalır** (marka güveni).
- **B) Tek URL çok-tenant** (`app.oksis.com`): login'de **nötr OKSİS** markası; okul bilgisi yalnız giriş sonrası (header/portal) gösterilir. Default-tenant-code branding kaldırılır.
- **C) Hibrit:** branding kaynağı **gerçek tenant bağlamı** (subdomain / davet deep-link'indeki tenant kodu) ise göster; yoksa nötr. Sabit default koddan ASLA besleme.

**Mevcut davranış:** `branding.name` çözülürse okul kartı, yoksa tagline — yani zarif degrade ediyor; ancak kaynak sabit default tenant kodu olduğundan B senaryosunda yanlış okul gösterebilir.
**Öneri:** C (kaynağı tenant bağlamına bağla). **Karar mercii:** Ürün + mimar (deployment modeli). **İlgili:** `school-settings` branding, OKSMVP tenant resolution.

---

## OQ-identity-003: İki lockout kaynağı çelişiyor — domain düz 15dk vs guard kademeli 5/10/20

**Soru:** Login'de iki ayrı kilit mekanizması paralel çalışıyor:
- **Domain** (`Account.RegisterFailedLogin`): `FailedLoginCount >= DefaultMaxFailedAttempts (5)` → `LockedUntil = now + DefaultLockoutDuration (15dk)`, DB'de kalıcı.
- **Guard** (`LoginGuard`, Redis/in-memory): kademeli `5→5dk, 10→30dk, 20→2sa`; pencere 15dk.

**Sorun:** Handler kilitliyken `guard.CheckAsync`'te erken döner → ne domain ne guard sayacı artar. Domain kilidi 5 hatada **düz 15dk** olduğundan ve guard penceresi de 15dk olduğundan, **doğal akışta guard'ın 10/20 kademelerine ulaşılamıyor** (kilit süresince yeni hata sayılmaz; 15dk dolduğunda guard sayacı da pencereyle sıfırlanır). Yani kullanıcının gördüğü efektif davranış "5 hata → 15dk", kademeli 5/10/20 fiilen gölgeleniyor. (2026-05-31 testiyle doğrulandı: guard süreleri izole edildiğinde 300/1800/7200s doğru; ama uçtan uca domain 15dk baskın.)

**Seçenekler:**
- **A) Tek otorite = guard (kademeli):** Domain `RegisterFailedLogin`'in otomatik `LockedUntil` set etmesini kaldır (yalnız sayaç + event); kilit kararı tamamen `LoginGuard`'a bırakılsın, `Account.LockedUntil` guard kararından doldurulsun → kademeli 5/10/20 gerçekten devreye girer.
- **B) Tek otorite = domain:** Guard'ı yalnız IP rate-limit'e indir; hesap kilidi tek kaynak domain (eşik+süre tenant-config'ten). Kademe isteniyorsa domain'e taşınır.
- **C) Olduğu gibi bırak:** Efektif "5 hata → 15dk" yeterli kabul edilir; guard kademeleri yalnız dağıtık/IP senaryosu için kalır, completion_status'a "kademeli stage'ler gölgeleniyor" notu düşülür.

**Etki:** Kullanıcıya gösterilen kilit süresi + brute-force direnci. **Karar mercii:** Güvenlik + ürün. **İlgili:** TQ-auth-007 (rate limit kapsamı).

---

## TQ-auth-001: JWT imzalama RS256 mı HS256 mı?
Teknik analiz RS256 önerir (multi-tenant doğrulama kolaylığı). **Karar mercii:** Güvenlik mimarı.

## TQ-auth-003: Parola hash algoritması (Argon2id mi PBKDF2 mi) + parametreler?
Teknik analiz Argon2id önerir. Mevcut kodda `IPasswordHasher` var (BCrypt? doğrulanmalı). **Karar mercii:** Güvenlik mimarı.

## TQ-auth-004: Eş zamanlı oturum limiti tenant-config şeması (OQ-auth-005)?
Rol bazlı oturum limiti (admin tek-session, diğer N-session) tablo şeması. **Karar mercii:** Ürün + DB.

## TQ-auth-005: `users` read-port sync in-process mu, cache'li projeksiyon mu?
**Karar mercii:** Mimar.

## TQ-auth-006: SignalR forced logout MVP'de mi, Sprint 6 hardening'de mi?
**Karar mercii:** Ürün + mimar.

## TQ-auth-007: Rate limit kapsamı — yalnız IP mi, IP+identifier mi (proxy/NAT etkisi)?
**Karar mercii:** Güvenlik.

---

## Karar Verilenler (Arşiv)

### TQ-auth-002: Permission listesi JWT'de mi, Redis cache'te mi? → **Karar: Redis cache + DB resolver (JWT'de DEĞİL)** (2026-05-31)
İzinler JWT'ye basılmaz; `AccountTokenIssuer` yalnız bağlam claim'leri + `perms_ver` koyar. Çalışma zamanında `IPermissionReader` (Redis `permissions:{accountId}:{profile}:{season}`, miss'te `AccountPermissionResolver` ile DB'den kurulur) çözer; legacy token'lar için `permissions` claim fallback'i var. MediatR `AuthorizationBehavior` + ASP.NET `PermissionRequirementHandler` reader'ı kullanır. İstemci UI gating izin listesini **`GET /auth/me/context` → `permissions[]`** üzerinden alır (bkz. api-contracts). **Neden geç fark edildi:** identity birleştirmesinde reader yazılmamıştı ve `IdentityDevSeeder` RoleAssignment üretmiyordu → web+mobil admin'de 403; ikisi de düzeltildi.
