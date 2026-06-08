## Description
Satır aksiyonlarını **hesap operasyonlarına** çevir ve toplu işlemleri ekle. Bugünkü "Düzenle (profil) + Sil (🗑)" hesap-ekseni değil ve §1.3'e aykırı.

**Spec çakışması:**
- **§3.5** satır (…): Detay · **Rolleri düzenle** · **Şifre sıfırlama bağlantısı gönder** · **Daveti yeniden gönder** · **Kilidi aç** · **Askıya al / Yeniden etkinleştir** · **Pasife al**. Toplu: rol atama · askıya alma · davet yeniden gönderme · dışa aktarma. *"Düzenle = hesabı düzenler"*; akademik için domain köprü.
- **§3.7**: davet yeniden gönderme (`ResendInvite`).
- **§1.3 / §3.5**: hard-delete yok → "**Sil**" işlemi **Pasife alma**dır.

**Mevcut durum:** `UsersPage.tsx` satır aksiyonu yalnızca `Pencil` (→ `PersonFormModal`, profili düzenler) + `Trash2` (`useDeletePerson` → `DELETE /users/persons/{id}`, etiket "Sil"). (…) menüsü, rol/şifre/davet/kilit/askı aksiyonları ve toplu işlem **yok**.

Repository: `farukkaya/oksis-web`
Story Points: `21`

## Scope
- `UsersPage.tsx` — satır aksiyon hücresi → (…) overflow menü; tablo başına toplu seçim + toplu aksiyon barı.
- Hesap aksiyon hook'ları (oksis-api Identity slice'larına bağlanır): `AssignRoles`, `SendPasswordReset`, `ResendInvite`, `AdminUnlockAccount`, `SuspendUser`/`ReactivateUser`, `DeactivateUser`.

## Implementation
- Satır (…) menüsü: **Detay · Rolleri düzenle · Şifre sıfırlama linki gönder · Daveti yeniden gönder · Kilidi aç · Askıya al / Yeniden etkinleştir · Pasife al**. Her madde uygun durumda görünür (ör. "Kilidi aç" yalnız Kilitli'de).
- "Sil/🗑" kaldırılır → **"Pasife al"** (DeactivateUser; soft). Onay metni "pasife alma" der; "kalıcı silme" ifadesi kullanılmaz (§1.3).
- "Düzenle" = **hesabı** düzenler (kimlik/iletişim/durum); akademik bilgi için "Bağlı Profil → domain ekranında yönet" köprüsü. (Profil oluşturma/düzenleme bu ekrandan ISSUE-06 ile ayrışır.)
- **Toplu:** seçim kutuları + toplu çubuk: rol atama · askıya alma · davet yeniden gönderme · dışa aktarma. Toplu şifre sıfırlama / pasife alma onaylı; bağlı kaydı olan hesapta sert silme zaten yok.
- Tüm mutasyonlar toast + ilgili query invalidation; izinle (`RequirePermission`) gated.

## Acceptance Criteria
- [ ] Satır (…) menüsü §3.5 aksiyon setini durum-duyarlı gösterir.
- [ ] "Sil" → "Pasife al"; hiçbir yerde hard-delete dili/eylemi yok (§1.3).
- [ ] "Düzenle" hesabı düzenler; akademik için domain köprü görünür.
- [ ] Toplu seçim + toplu aksiyonlar (rol/askı/davet/dışa aktarma) çalışır, onay gerektirenler onaylı.
- [ ] Aksiyonlar izinle gated; hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: aksiyon görünürlüğü duruma göre; "Pasife al" onay akışı DeactivateUser çağırır; toplu davet yeniden gönderme seçili kümeye uygulanır; başarısız mutasyon hata toast'u.

## API Notu
- Slice'lar büyük ölçüde mevcut (`AdminUnlockAccount`, `AccountLogoutAllSessions` vb.). `SendPasswordReset` **link gönderir, şifre SET ETMEZ** (§3.7). `SuspendUser`/`ReactivateUser`/`DeactivateUser` web tüketimini doğrula.

## Dependencies
- ISSUE-06 (sahiplik sınırı) "Düzenle"nin nihai kapsamını netleştirir.

## Out of Scope
- Detay sekmeleri (ISSUE-04, ISSUE-05); koruma kuralları mantığı (ISSUE-07).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
