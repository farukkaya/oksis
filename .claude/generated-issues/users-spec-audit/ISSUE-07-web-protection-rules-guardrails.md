## Description
Hesap yaşam döngüsü **koruma kurallarını** UI'da uygula. Spec §3.8 edge-case'leri bugün ekranda görünür değil.

**Spec çakışması:** **§3.8** —
- Son kalan yönetici askıya alınamaz/pasife çekilemez.
- Yönetici kendi hesabını kilitleyemez/askıya alamaz.
- E-posta değişimi yeniden doğrulama gerektirir.
- Çoklu rollü hesabı pasife almak tüm rollerini etkiler → kullanıcı uyarılır.

**Mevcut durum:** `UsersPage.tsx` "Sil" yalnız `confirm()` çağırıyor; bu koruma kurallarının hiçbiri UI'da yok.

Repository: `farukkaya/oksis-web`
Story Points: `13`

## Scope
- Satır/detay hesap aksiyonları (ISSUE-03/04 ile aynı yüzeyler): askıya al, pasife al, kilitle, e-posta değişimi.
- Uyarı/onay diyalogları + aksiyon disable mantığı.

## Implementation
- **Son yönetici koruması:** tek aktif yönetici kaldıysa "Askıya al/Pasife al" disable + açıklama tooltip'i (server da reddeder; UI önden engeller).
- **Kendi hesabı:** oturum açan kullanıcı kendi satırında "Kilitle/Askıya al" göremez/yapamaz.
- **E-posta değişimi:** yeni e-posta yeniden doğrulama akışını tetikler; "doğrulama bekliyor" durumu gösterilir.
- **Çoklu rol pasife alma:** pasife alma onayı, etkilenen tüm rolleri listeleyen uyarı içerir.
- Tümü sunucu kuralının **aynası**; UI guard yalnız UX, yetki/iş kuralı server-side kalır (güvenlik kuralı).

## Acceptance Criteria
- [ ] Son aktif yönetici askıya/pasife alınamıyor (disable + sebep).
- [ ] Kullanıcı kendi hesabını kilitleyemiyor/askıya alamıyor.
- [ ] E-posta değişimi yeniden doğrulama tetikliyor; bekleme durumu görünür.
- [ ] Çoklu rollü pasife alma, etkilenen rolleri listeleyen uyarı gösteriyor.
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: son-yönetici disable; self-action gizleme; çoklu-rol uyarı içeriği; e-posta değişimi re-verify tetikleme.

## API Notu
- İş kuralları server-side zorunlu (UI yalnız ayna). İlgili reddetme yanıtlarının (ör. son yönetici) hata kodlarını doğrula ve UI mesajına bağla.

## Dependencies
- ISSUE-03 (aksiyon yüzeyleri) ve ISSUE-04 (kilit/oturum) üzerine oturur.

## Out of Scope
- Yeni server iş kuralı yazımı (varsa ayrı API issue'su); bu issue UI guard + mevcut kuralların aynası.

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
