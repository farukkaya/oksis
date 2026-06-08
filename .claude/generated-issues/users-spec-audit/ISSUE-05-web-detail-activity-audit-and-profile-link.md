## Description
Detaya **Etkinlik/Audit** sekmesi ekle ve **Bağlı Profil**'i inline yönetimden **köprüye** çevir.

**Spec çakışması:**
- **§3.6** — Detayda **Etkinlik / Audit:** *giriş geçmişi, kim ne zaman ne değiştirdi.* Ayrıca **Bağlı Profil:** *domain kaydına köprü* (inline profil yönetimi değil).
- **§3.9** — `GetUserActivity` slice'ı.

**Mevcut durum:** `UserDetailPage.tsx`'te **Etkinlik/Audit sekmesi yok**. "Profiller" sekmesi (`ProfilesTab`/`ProfileCard`) profili **inline gösteriyor/yönetiyor** — spec'in "Bağlı Profil = köprü" yaklaşımına aykırı (§3 sahiplik sınırı: profili yönetmez).

Repository: `farukkaya/oksis-web`
Story Points: `13`

## Scope
- `UserDetailPage.tsx` — `TAB_KEYS`'e `activity` ekle + `ActivityTab`; `ProfilesTab`'ı "Bağlı Profil" köprü görünümüne indir.
- Hook: `useUserActivity` (oksis-api `GetUserActivity`).

## Implementation
- **Etkinlik/Audit sekmesi:** giriş geçmişi (zaman, IP/cihaz varsa) + audit izi (kim, ne zaman, hangi alan/aksiyon). Sayfalı, salt-okunur.
- **Bağlı Profil:** `ProfilesTab` artık profil **düzenlemez**; her bağlı profili "Öğrenci · 202610029 → domain ekranında aç" **köprüsü** olarak gösterir (`PersonDetail.linkedAccountId`/profil ref üzerinden). Akademik veri salt köprü; düzenleme Öğrenciler/Öğretmenler ekranında.
- Inline profil alanlarının (ProfileCard switch) kaldırılması ISSUE-06 ile uyumlu yürür.

## Acceptance Criteria
- [ ] "Etkinlik/Audit" sekmesi: giriş geçmişi + değişiklik audit'i, sayfalı, salt-okunur.
- [ ] "Bağlı Profil" sekmesi köprü gösterir; profil inline düzenlenemez.
- [ ] Köprüler doğru domain ekranına yönlendirir.
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: Activity sekmesi render + boş/hata; Bağlı Profil köprü href'leri; profil düzenleme tetikleyicisinin bu sekmede artık olmadığı.

## API Notu
- `GetUserActivity` **doğrula/üret** (§3.9'da listeli; web tarafı tüketir). Audit kaydı standardı için bkz. spec §7 "Örnek audit log standardı".

## Dependencies
- ISSUE-06 (profil oluşturma/düzenlemenin ekrandan çıkması) ile koordineli.
- ISSUE-04 ile veri kaynağı (`GetUserActivity`) paylaşımı.

## Out of Scope
- Güvenlik sekmesi (ISSUE-04).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
