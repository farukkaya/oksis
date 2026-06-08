## Description
Kullanıcı detayına **Güvenlik** sekmesi ekle. Bu sekme spec'te zorunlu ama mevcut detayda yok.

**Spec çakışması:** **§3.6** — Detay drawer sekmeleri arasında **Güvenlik:** *şifre sıfırlama linki, 2FA durumu, aktif oturumlar + "tüm oturumları kapat", başarısız giriş denemeleri.*
**Mevcut durum:** `UserDetailPage.tsx` sekmeleri = general · profiles · relationships · roleAssignments · invitations · consents · lifecycle. **Güvenlik sekmesi yok.**

Repository: `farukkaya/oksis-web`
Story Points: `13`

## Scope
- `UserDetailPage.tsx` — `TAB_KEYS`'e `security` ekle + `SecurityTab` bileşeni.
- Hook'lar: aktif oturumlar listesi + "tüm oturumları kapat" (`AccountLogoutAllSessions` mevcut), şifre sıfırlama linki (`SendPasswordReset`), kilit aç (`AdminUnlockAccount`).

## Implementation
- **Güvenlik sekmesi:**
  - Şifre sıfırlama **linki gönder** (şifre SET ETMEZ — §3.7).
  - **2FA durumu** (etkin/değil — salt gösterim; aç/kapa kapsam dışıysa "—").
  - **Aktif oturumlar** listesi + **"Tüm oturumları kapat"** (`AccountLogoutAllSessions`).
  - **Başarısız giriş denemeleri** (son denemeler / kilit durumu) + Kilitli ise "Kilidi aç".
- Tümü `AsyncSection` (skeleton/empty/error) desenini izler; izinle gated.
- Hesap-ekseni veri `PersonDetail.linkedAccountId` üzerinden ilgili account'tan çekilir.

## Acceptance Criteria
- [ ] Detayda "Güvenlik" sekmesi render olur (skeleton/empty/error/loaded).
- [ ] Şifre sıfırlama linki gönderir (şifre set etmez).
- [ ] 2FA durumu görünür.
- [ ] Aktif oturumlar listelenir; "Tüm oturumları kapat" çalışır + invalidation.
- [ ] Başarısız giriş/kilit görünür; Kilitli'de "Kilidi aç" çalışır.
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: sekme render + durumlar; "tüm oturumları kapat" mutasyonu; "kilidi aç" yalnız Kilitli durumda görünür.

## API Notu
- `AccountLogoutAllSessions`, `AdminUnlockAccount`, `SendPasswordReset` mevcut. Aktif oturum listesi + başarısız giriş sayacı endpoint'ini doğrula; yoksa `GetUserSecurity`/`GetUserActivity` üzerinden besle (ISSUE-05 ile paylaşılabilir).

## Dependencies
- ISSUE-05 (Etkinlik/Audit) ile veri kaynağı paylaşabilir.

## Out of Scope
- Audit/giriş geçmişi sekmesi (ISSUE-05).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
