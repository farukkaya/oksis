## Description
**(Kök sapma — en yüksek etki.)** Kullanıcılar ekranının sahiplik sınırını uygula: ekran **hesap üretir, domain profili değil**, ve oluşturma **invite-first** olur.

**Spec çakışması:**
- **§3.1** — *"Öğrenci / öğretmen / veli hesapları kendi domain ekranlarında doğar; Kullanıcılar ekranı bunları yönetir, oluşturmaz. Domain'i olmayan roller (Yönetici, Muhasebe, Operasyon) doğrudan bu ekrandan doğar."*
- **§3** sahiplik sınırı — *"Hesabı yönetir, profili değil."*
- **§3.7** invite-first — *"Yönetici şifre belirlemez; kullanıcı kendi şifresini kurar."* Öğrenci istisnası: kullanıcı adı = öğrenci no, geçici şifre, ilk girişte zorunlu değişim.
- **§1.1** Hesap ≠ Profil.

**Mevcut durum:** `UsersPage.tsx`'te "+ Yeni Kullanıcı" → `PersonFormModal` her `ProfileType` (Student/Teacher/Parent/Staff) için **domain profili doğrudan üretiyor**. Bu, ekranı bir Person/Profile yöneticisine çeviriyor ve §3.1 + §3 + §1.1 ile çakışıyor.

Repository: `farukkaya/oksis-web`
Story Points: `21`

## Scope
- `UsersPage.tsx` — "+ Yeni Kullanıcı" akışı.
- `modules/users/components/PersonFormModal` — bu ekrandaki rolü daralt (idari/personel hesabı + davet).
- Davet akışı bileşenleri (`InviteUser`/`ResendInvite` slice'ları zaten mevcut).

## Implementation
- "+ Yeni Kullanıcı" yalnızca **domain'i olmayan roller** (Yönetici/Muhasebe/Operasyon) için **invite-first hesap** üretir: yönetici e-posta/telefon + rol seçer, **şifre belirlemez**; kullanıcı kendi şifresini davetle kurar.
- Öğrenci/Öğretmen/Veli profili oluşturma bu ekrandan **kaldırılır**; ilgili "+ ekle" işlemleri Öğrenciler/Öğretmenler ekranlarına yönlendirir (köprü). (Domain ekran tarafı bu issue kapsamı dışı, ama yönlendirme/CTA burada.)
- Öğrenci istisnası (§3.7) davet akışında not edilir: domain ekranı öğrenci no + geçici şifre üretir; bu ekran yalnızca yönetir.
- `PersonFormModal`'ın domain-profil alanları bu ekran bağlamından ayrıştırılır (paylaşılan bileşense prop ile "account-only" moda alınır).

## Acceptance Criteria
- [ ] "+ Yeni Kullanıcı" yalnız domain'siz idari/personel rolleri için invite-first hesap üretir.
- [ ] Yönetici hiçbir akışta şifre belirlemez (link/davet tabanlı).
- [ ] Öğrenci/Öğretmen/Veli profil oluşturma bu ekrandan kaldırıldı; CTA domain ekranına yönlendiriyor.
- [ ] `generated-issues/users/` Person CRUD akışıyla regresyon yok (domain ekranları bozulmadı).
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: "+ Yeni Kullanıcı" yalnız idari rolleri sunar; şifre alanı yok; öğrenci/öğretmen seçeneği davranışı domain ekranına yönlendirir.

## Notlar / Risk
- Bu, `generated-issues/users/` setiyle **kesişen** dosyalara (`PersonFormModal`) dokunur; o set Person CRUD'u kurarken bu issue ekseni hesap-only'e çeker. Uygulamadan önce iki setin `PersonFormModal` beklentisini hizala.
- Spec'ten sapma gerekirse (ör. öğrenci profilini geçici olarak burada tutmak) **önce kullanıcı onayı + spec/`completion_status.md` "⚠️ Spec Dışına Çıkılanlar" kaydı** gerekir.

## Dependencies
- ISSUE-02/03/05 nihai hâli bu issue kararına bağlı (Bağlı Profil köprü yönü, "Düzenle" kapsamı).

## Out of Scope
- Domain (Öğrenciler/Öğretmenler) ekranlarındaki profil oluşturma implementasyonu.

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
