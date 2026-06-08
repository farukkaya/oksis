# Kullanıcılar Ekranı — Spec Uyum Denetimi (users-spec-audit)

**Kaynak spec:** `.claude/specs/oksis-admin-ekranlari-mimari-spec.md` → **§3 Kullanıcılar Ekranı** (+ türetildiği §1.1, §1.3).
**Denetlenen kod:**
- `oksis-web/src/portals/admin/pages/users/UsersPage.tsx`
- `oksis-web/src/portals/admin/pages/users/UserDetailPage.tsx`
- `oksis-web/src/modules/users/types/person.types.ts`

> Bu klasör, mevcut `generated-issues/users/` (modül dokümanından üretilmiş) setinden **ayrıdır**.
> Buradaki issue'lar yalnızca **yeni spec ile gerçek ekran kodu arasındaki uyumsuzlukları** kapatır.

---

## Çıkarım — kök sapma

Ekran spec **§1.1 (Hesap ≠ Profil)** ayrımını uygulamıyor. `/admin/users` pratikte bir
**Person/Profile yöneticisi**: metrikler Öğrenci/Öğretmen/Veli sayıları, "+ Yeni Kullanıcı"
her tür domain profilini (Student/Teacher/Parent/Staff) doğrudan üretiyor, "Düzenle" profili
düzenliyor, detayın "Profiller" sekmesi profili inline yönetiyor.

Oysa spec **§3 sahiplik sınırı**: *"Hesabı yönetir, profili değil. Kim giriş yapabiliyor,
hangi rolle, hangi durumda — yalnızca bunlar."* Hesap-ekseni veriler (`lastLoginAt`, `roles`)
`src/modules/identity/types/user.types.ts` içinde **zaten var ama ekran bunları kullanmıyor**;
ekran profil-ekseni `person.types.ts`'e bağlı.

Sonuç: tek bir kolon/aksiyon düzeltmesi değil; ekranın **ekseni** (profil → hesap/güvenlik)
kaydırılmalı. Aşağıdaki 7 issue bunu parça parça yapar.

---

## Sapma → Spec maddesi → Issue eşlemesi

| # | Bulgu (mevcut durum) | Çakışan spec maddesi | Tip | Issue |
|---|---|---|---|---|
| 1 | KPI kartları = Öğrenci/Öğretmen/Veli sayısı (profil ekseni) | **§3.2** (Toplam Hesap·Aktif·Bekleyen Davet·Dikkat Gerektiren) | AYKIRI | ISSUE-01 |
| 2 | Tabloda **Rol(ler)** ve **Son Giriş** kolonu yok; "Profiller" badge köprü değil; avatar yok. Filtreler profil-ekseni (profileType) | **§3.4** (kolonlar, "Son Giriş en değerli sütun") + **§3.3** (Rol·Bağlı profil var/yok·Son giriş aralığı) | EKSİK | ISSUE-02 |
| 3 | Satır aksiyonu = Düzenle (profil) + **Sil/🗑** ; (…) menüsü, rol/şifre/davet/kilit/askı aksiyonları ve toplu işlem yok | **§3.5** (aksiyon seti) + **§3.7** (daveti yeniden gönder) + **§1.3** ("Sil"→"Pasife al") | AYKIRI+EKSİK | ISSUE-03 |
| 4 | Detayda **Güvenlik** sekmesi yok (2FA, aktif oturumlar, "tüm oturumları kapat", başarısız giriş, kilit aç) | **§3.6** (Güvenlik sekmesi) | EKSİK | ISSUE-04 |
| 5 | Detayda **Etkinlik/Audit** sekmesi yok; "Profiller" sekmesi inline profil yönetiyor, köprü değil | **§3.6** (Etkinlik/Audit + Bağlı Profil köprü) + **§3.9** (`GetUserActivity`) | EKSİK+AYKIRI | ISSUE-05 |
| 6 | "+ Yeni Kullanıcı" her domain profilini doğrudan üretiyor; invite-first yok | **§3.1** (hesap domain ekranında doğar) + **§3** (sahiplik sınırı) + **§3.7** (invite-first) | AYKIRI | ISSUE-06 |
| 7 | Koruma kuralları UI'da yok (son yönetici, kendi hesabını kilitleme, e-posta re-verify, çoklu rol uyarısı) | **§3.8** (edge-case/koruma) | EKSİK | ISSUE-07 |

---

## Notlar

- **Backend büyük ölçüde hazır.** §3.9 slice'larının çoğu `oksis-api` Identity modülünde mevcut
  (`AdminUnlockAccount`, `AccountLogoutAllSessions`, `AcceptInvitation`, `ListUsers`, `GetUserById`…).
  Eksik görünenler issue içinde "doğrula/üret" olarak işaretli (ör. `GetUserActivity`). Bu yüzden
  issue'lar ağırlıklı **web** kapsamlı; backend tarafı çoğunlukla tüketim/teyit.
- Bu issue'lar `generated-issues/users/` ile **çelişmez, onu daralt­maz**; o set domain/Person CRUD'u
  kurar, bu set ekranı spec eksenine hizalar. Çakışan dosyalar issue içinde belirtildi.
- Sahiplik sınırı (ISSUE-06) en yüksek etkili olan; diğerleri ondan bağımsız ilerleyebilir ama
  ISSUE-06 kararı (domain profil oluşturmanın ekrandan çıkması) ISSUE-01/02/03'ün son hâlini etkiler.

## Etiketler (öneri)

```bash
gh label create "audit:spec" --color "be123c" --description "Spec uyum denetiminden üretildi"
gh label create "spec:admin-ekranlari" --color "7c3aed" --description "oksis-admin-ekranlari-mimari-spec.md"
gh label create "module:users" --color "1d4ed8"
```
