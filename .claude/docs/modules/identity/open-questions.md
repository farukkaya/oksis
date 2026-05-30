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

---

## OQ-identity-002: Modül yerleşimi — ayrı projeler mi, alt klasör mü?

**Soru:** Teknik analiz `Modules/Identity/Oksis.Identity.Domain|Application|Infrastructure|Api` ayrı projeleri önerir. Mevcut repo modüler monolit: tek `Oksis.Domain` + `Modules/Identity` alt klasör.
**Varsayılan:** Mevcut yapı korunur (CLAUDE.md: klasör kararları kasıtlıdır). Docs bu varsayıma göre yazıldı. **Karar mercii:** Mimar.

---

## TQ-auth-001: JWT imzalama RS256 mı HS256 mı?
Teknik analiz RS256 önerir (multi-tenant doğrulama kolaylığı). **Karar mercii:** Güvenlik mimarı.

## TQ-auth-002: Permission listesi JWT'de mi, Redis cache'te mi?
Doküman **cache (Redis) + `perms_ver`** varsayar (OQ-auth-008). Net karar gerekli. **Karar mercii:** Performans + güvenlik.

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

> Henüz yok. Karar gelince ilgili dosyaya taşınacak.
