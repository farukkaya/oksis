# Spec-Audit Issue Geliştirme — İlerleme İzleyici

> Çok oturumlu çalışma. Sıra: **users → students → teachers**, her klasörde issue no sırasıyla.
> Yeni oturumda: bu dosyayı oku, "Sıradaki" satırından devam et.

## Durum

| Klasör | Issue | Durum | Commit |
|---|---|---|---|
| users | ISSUE-01 (account-axis KPIs) | ✅ tamam | api `0a37ab0`, web `72ae7fa` |
| users | ISSUE-06 (invite-first sahiplik sınırı) | ✅ tamam | web `b5a84cd` |
| users | ISSUE-02 (table + filters account-axis) | ✅ tamam | api `bf23efb`, web `e976198` |
| users | ISSUE-03 (satır + toplu hesap aksiyonları) | ✅ tamam | web `9e96b46` |
| users | ISSUE-04 (detay drawer — güvenlik sekmesi) | 🔄 SIRADAKI | — |

**Sıradaki:** users/ISSUE-04.

> Kullanıcı talimatı: "Bu tarz [mimari] kararlar için durma, önerdiğin yöntem ile çalışmaya devam et."
> → Çatallarda durma; önerilen yöntemle ilerle, kararı kendin ver, gerekirse `completion_status` "⚠️ Spec Dışına Çıkılanlar"a işle.

### ✅ Verilen mimari karar (ISSUE-06'da, omurga)
**Kullanıcılar ekranının omurgası = Identity `User` (CreateUser → POST /users).**
- "+ Yeni Kullanıcı" = invite-first hesap, yalnız domain'siz roller (SchoolAdmin/Accountant/Secretary/SchoolStaff). Domain rolleri → domain ekranlarına köprü.
- Not: domain'siz `User` oluşturmak şu an Person üretmiyor; bu yüzden yeni hesap, tablo account-axis'e geçene (ISSUE-02) kadar mevcut Person tablosunda görünmeyebilir. Geçici, ISSUE-02 çözer.

### ✅ ISSUE-02 tamamlandı (2026-06-08) — kararlar
- Tablo artık `useUsers` (`GET /users`, `UserListDto`) — hesap ekseni. `usePersons` Kullanıcılar ekranından tamamen çıktı.
- **Veri modeli gerçeği (önemli):** Identity `User` (tek `Role` enum + `LastLoginAt`) ile `Person`/`Profile`/`RoleAssignment` AYRI dünyalar. Bağ: `Person.LinkedAccountId == User.Id`. `RoleAssignment` `PersonId`+`SystemRoleId`'ye bağlı (User'a değil). Çoklu rol = `User.Role` (birincil) + bağlı kişinin aktif RoleAssignment SystemRole.DisplayName'leri.
- **Bağlı Profil köprüsü** `/admin/users/{linkedPersonId}` (Person detayı) — bu app'te domain kaydı köprüsü Person detayıdır; ayrı student/teacher detay route yok.
- **Detay route mismatch (ISSUE-04/05 için kritik):** `/admin/users/:id` route'u **Person** detayı (`UserDetailPage`, Person.id bekler). Hesap-ekseni satır `User.id` taşır → satır adı şu an link DEĞİL. Detay drawer'ı hesap eksenine bağlamak ISSUE-04/05 işi.
- **"Dikkat Gerektiren" KPI:** şimdilik `status=Suspended` filtreler (UserStatus'ta Locked yok). Tam "kilitli+askıda" birleşik filtre backend desteği gerektirir; ISSUE-03 değerlendirir.
- Satır aksiyon hücresi placeholder ("—"); aksiyon menüsü ISSUE-03.

### ISSUE-02 için hazır zemin (yeni oturumda tekrar keşfe gerek yok)
Hedef (§3.4/§3.3): Kolonlar = Kullanıcı(avatar+ad+iletişim) · Rol(ler) çoklu badge · Bağlı Profil köprü · Durum · **Son Giriş** · Oluşturma/Davet · Aksiyon. Filtreler = Rol · Durum · Bağlı profil var/yok · Son giriş aralığı.
- Tablo şu an `usePersons` (`/users/persons`, Person). Account-axis'e çevir: `ListUsers` (`GET /users`, `UserListDto`).
- **Backend `UserListDto` eksikleri:** `lastLoginAt` (User.LastLoginAt'tan kolay), çoklu `roles` (kaynak: `Modules/Users/Entities/RoleAssignment` — User.Role tek), linked-profile ref (Person↔hesap linki).
- Backend `ListUsersQueryHandler.cs`'e `lastLoginAt` + roles + linkedProfile projeksiyonu + son-giriş-aralığı filtre paramı ekle; `UserListDto` + web `user.types.ts UserListDto`'yu hizala.
- Web: `useUsers` hook + `user.api.listUsers` + `user.keys.list` (zaten var) ekle; UsersPage tabloyu buna bağla.
- Yardımcı zaten var: `userKeys.list/stats`, `UserListParams` (roles[], status, invitationStatus, search). Backend `ListUsersQuery` çoklu `Roles` filtresini destekliyor.

### ✅ ISSUE-03 tamamlandı (2026-06-08) — kararlar
- Satır (…) overflow menüsü = yeni `UserRowActions.tsx`; toplu çubuk = `UsersBulkBar.tsx`; ikisi de `portals/admin/pages/users/`.
- Yeni hesap-ekseni API/hook: `identity/api/userActions.api.ts` (`deactivateUser`), `identity/hooks/useUserActions.ts` (`useDeactivateUser`, `useResendUserInvite`). `user.api.ts`'e `exportUsers` (blob) eklendi.
- **Mimari karar (çatal — durmadan ilerlendi):** §3.5 aksiyonlarının çoğu için hesap-ekseni (User.id keyli) yönetici ucu backend'de YOK:
  - Var olanlar bağlandı: **Pasife al** (`POST /users/{id}/deactivate`), **Daveti yeniden gönder** (`POST /users/invitations/{latestInvitationId}/resend`, yalnız Pending), **Dışa aktar** (`GET /users/export`).
  - Yok olanlar (Rolleri düzenle, Şifre sıfırlama linki, Kilidi aç, Askıya al/Yeniden etkinleştir, toplu rol/askı): menüde **görünür ama pasif** + `rowActions.notReadyHint` ipucu. Mevcut slice'lar ya self-account ya Person.id keyli; `AdminUnlockAccount` komutu var ama controller ucu yok.
  - Gerekçe: §3.5 aksiyon setini eksiksiz/durum-duyarlı göstermek + §1.3'e uymak (Sil→Pasife al) ama çalışmayan butonla yalan söylememek. ISSUE-04/05 detay drawer'ı + ileride backend account-axis uçları bu pasif maddeleri aktifleştirir.
- `accounts.unlock` izni `test/authFixtures.ts ADMIN_PERMISSIONS`'a eklendi (eksikti).
- **ISSUE-04 için kritik (tekrar):** satır "Detay" şu an `/admin/users/${linkedPersonId ?? id}`'e gider — linkedProfile varsa Person detayına (UserDetailPage Person.id bekler), yoksa User.id'ye (route mismatch). Hesap detay drawer'ı User.id eksenine bağlamak ISSUE-04 işi.

### Anomali notu
- Çalışma sırasında `oksis-web` working tree'de benim dokunmadığım `StudentsPage.tsx` ve
  `StudentsPageHead.tsx` unstaged değişiklikleri var (önceki oturumdan kalmış olabilir). Commit'lere DAHİL EDİLMEDİ.

## Notlar / kararlar
- ISSUE-01: §3.2 "Dikkat Gerektiren = kilitli + askıda" için `UserStatus`'ta Locked yok (locked = `LockoutEnd > now`).
  Bu yüzden `ListUsers` status filtresinden türetilemez → backend'e hafif **`GetUserStats`** query eklendi (issue API notu bunu yetkilendiriyor).
- Web'de identity için `ListUsers`/stats client'ı yoktu; `modules/identity/api/user.api.ts` + hook ekleniyor.
- Mevcut Kullanıcılar ekranı `usePersons` (Person modeli) üzerine kurulu; spec ekseni hesap/Identity. Eksen kayması ISSUE-01..06 boyunca parça parça.
