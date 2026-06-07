# Spec-Audit Issue Geliştirme — İlerleme İzleyici

> Çok oturumlu çalışma. Sıra: **users → students → teachers**, her klasörde issue no sırasıyla.
> Yeni oturumda: bu dosyayı oku, "Sıradaki" satırından devam et.

## Durum

| Klasör | Issue | Durum | Commit |
|---|---|---|---|
| users | ISSUE-01 (account-axis KPIs) | ✅ tamam | api `0a37ab0`, web `72ae7fa` |
| users | ISSUE-06 (invite-first sahiplik sınırı) | ✅ tamam | web `b5a84cd` |
| users | ISSUE-02 (table + filters account-axis) | 🔄 SIRADAKI | — |

**Sıradaki:** users/ISSUE-02.

> Kullanıcı talimatı: "Bu tarz [mimari] kararlar için durma, önerdiğin yöntem ile çalışmaya devam et."
> → Çatallarda durma; önerilen yöntemle ilerle, kararı kendin ver, gerekirse `completion_status` "⚠️ Spec Dışına Çıkılanlar"a işle.

### ✅ Verilen mimari karar (ISSUE-06'da, omurga)
**Kullanıcılar ekranının omurgası = Identity `User` (CreateUser → POST /users).**
- "+ Yeni Kullanıcı" = invite-first hesap, yalnız domain'siz roller (SchoolAdmin/Accountant/Secretary/SchoolStaff). Domain rolleri → domain ekranlarına köprü.
- Not: domain'siz `User` oluşturmak şu an Person üretmiyor; bu yüzden yeni hesap, tablo account-axis'e geçene (ISSUE-02) kadar mevcut Person tablosunda görünmeyebilir. Geçici, ISSUE-02 çözer.

### ISSUE-02 için hazır zemin (yeni oturumda tekrar keşfe gerek yok)
Hedef (§3.4/§3.3): Kolonlar = Kullanıcı(avatar+ad+iletişim) · Rol(ler) çoklu badge · Bağlı Profil köprü · Durum · **Son Giriş** · Oluşturma/Davet · Aksiyon. Filtreler = Rol · Durum · Bağlı profil var/yok · Son giriş aralığı.
- Tablo şu an `usePersons` (`/users/persons`, Person). Account-axis'e çevir: `ListUsers` (`GET /users`, `UserListDto`).
- **Backend `UserListDto` eksikleri:** `lastLoginAt` (User.LastLoginAt'tan kolay), çoklu `roles` (kaynak: `Modules/Users/Entities/RoleAssignment` — User.Role tek), linked-profile ref (Person↔hesap linki).
- Backend `ListUsersQueryHandler.cs`'e `lastLoginAt` + roles + linkedProfile projeksiyonu + son-giriş-aralığı filtre paramı ekle; `UserListDto` + web `user.types.ts UserListDto`'yu hizala.
- Web: `useUsers` hook + `user.api.listUsers` + `user.keys.list` (zaten var) ekle; UsersPage tabloyu buna bağla.
- Yardımcı zaten var: `userKeys.list/stats`, `UserListParams` (roles[], status, invitationStatus, search). Backend `ListUsersQuery` çoklu `Roles` filtresini destekliyor.

### Anomali notu
- Çalışma sırasında `oksis-web` working tree'de benim dokunmadığım `StudentsPage.tsx` ve
  `StudentsPageHead.tsx` unstaged değişiklikleri var (önceki oturumdan kalmış olabilir). Commit'lere DAHİL EDİLMEDİ.

## Notlar / kararlar
- ISSUE-01: §3.2 "Dikkat Gerektiren = kilitli + askıda" için `UserStatus`'ta Locked yok (locked = `LockoutEnd > now`).
  Bu yüzden `ListUsers` status filtresinden türetilemez → backend'e hafif **`GetUserStats`** query eklendi (issue API notu bunu yetkilendiriyor).
- Web'de identity için `ListUsers`/stats client'ı yoktu; `modules/identity/api/user.api.ts` + hook ekleniyor.
- Mevcut Kullanıcılar ekranı `usePersons` (Person modeli) üzerine kurulu; spec ekseni hesap/Identity. Eksen kayması ISSUE-01..06 boyunca parça parça.
