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
| users | ISSUE-04 (detay drawer — güvenlik sekmesi) | ✅ tamam | web `7e8faf2` |
| users | ISSUE-05 (detay — etkinlik/audit + bağlı profil köprüsü) | ✅ tamam | web `4b85e7a` |
| users | ISSUE-07 (koruma kuralları / guardrails) | ✅ tamam | web `5046645` |
| students | ISSUE-01 (web-season-enrollment-axis) | ✅ tamam | web `0834f37` |
| students | ISSUE-02 (web-guardian-management-home) | ✅ tamam | api `fb77240`, web `b225e7e` |
| students | ISSUE-03 (web-domain-row-and-bulk-actions) | ✅ tamam | web `557f129` |
| students | ISSUE-04 (web-detail-tab-structure) | ✅ tamam | web `f06a6e4` |
| students | ISSUE-05 (web-filters-and-search) | ✅ tamam | api `744bc97`, web `9807263` |
| students | ISSUE-06 (web-edge-cases-guardrails) | ✅ tamam | web `0860801` |

**Sıradaki:** teachers-spec-audit/ISSUE-01 (ilk teachers issue — klasörü oku, issue no sırasıyla). students-spec-audit BİTTİ.

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

### ✅ ISSUE-04 + ISSUE-05 tamamlandı (2026-06-08) — kararlar
- **Sekme ekseni netleşti:** `UserDetailPage` hâlâ Person ekseni (`usePerson`, `/users/persons/{id}`). §3.6 hesap-ekseni sekmeleri (Güvenlik, Etkinlik/Audit) veriyi **`PersonDetail.linkedAccountId`** üzerinden hesap (`Identity.User`) kayıtlarından çeker. Bağlı hesap yoksa her iki sekme net boş durum gösterir.
- **Yeni hesap-ekseni client'ları:** `user.api.ts → getUserById` (`GET /users/{id}`, `UserDetailDto`) + `getUserActivity` (`GET /users/{id}/activity`, yeni `UserActivityDto`); `userKeys.activity`; hook'lar `useUserSecurity`, `useUserActivity` (identity/hooks).
- **Güvenlik sekmesi (ISSUE-04):** şifre sıfırlama linki / 2FA / aktif oturumlar + tümünü kapat / giriş güvenliği (son giriş, başarısız deneme, kilit + Kilitli'de Kilidi aç). Aksiyon uçları User.id keyli olarak yok → ISSUE-03 deseni: görünür-ama-pasif + `security.notReadyHint`. 2FA + oturum listesi DTO'da yok → "—".
- **Etkinlik/Audit (ISSUE-05):** sayfalı salt-okunur tablo; `GetUserActivity` backend slice'ı YOK, web §3.9'a göre tüketici hazırlandı (AsyncSection hata/boş dayanıklı). Uç açılınca aktifleşir.
- **Bağlı Profil köprüsü (ISSUE-05):** `ProfilesTab` inline profil gösteriminden **köprüye** indirildi (sahiplik sınırı §3 — profili düzenlemez). Öğrenci → `/admin/students?q=<no>`; Öğretmen/Personel/Veli için ayrı yönetim ekranı yok → bilgi notu. `ProfileCard` (inline akademik alan switch'i) kaldırıldı.
- **ISSUE-07 için zemin:** §3.8 koruma kuralları (son yönetici askıya alınamaz, kendi hesabını kilitleyemez, e-posta değişimi yeniden doğrulama, çok-rollü pasifleştirme uyarısı). Çoğu backend guard ister; web tarafı uyarı/disable + onay diyaloğu yüzeyini kurar. Mevcut `deactivate.multiRoleWarning` i18n zaten var (ISSUE-03). Aksiyonların çoğu hâlâ pasif (ISSUE-03/04 notu) → ISSUE-07 muhtemelen UI guardrail + i18n + (varsa) edge-case görünürlüğü ile sınırlı.

### ✅ ISSUE-07 tamamlandı (2026-06-08) — kararlar
- §3.8 koruma kuralları UI'da (sunucu kuralının aynası; iş kuralı server-side kalır).
- **Kendi hesabı:** `UserRowActions` `useAuthStore.user.id === user.id` → kilit/askı/pasife/yeniden-etkinleştir maddeleri **gizli** (disable değil), Detay görünür. Self-hint i18n key (`rowActions.guardrails.selfAccount`) dokümantasyon amaçlı duruyor (gizleme yapıldığından gösterilmiyor).
- **Son aktif yönetici (çatal — durmadan ilerlendi):** Güvenilir tenant-geneli sayım sunucudan gelmiyor (Out of Scope: yeni server kuralı yok). Karar: `UsersPage` `lastActiveAdminId`'yi **yalnız tek sayfada** (`totalPages === 1`) ve listede tam **bir** aktif SchoolAdmin/SuperAdmin varsa türetir; çoklu sayfada devre dışı (yanlış-pozitif yerine eksik-uyarı tercih edildi — server zaten reddeder). `isLastActiveAdmin` prop'u `UserRowActions`'a geçer → Askıya al + Pasife al **pasif + sebep tooltip'i** (`guardrails.lastActiveAdmin`).
- **E-posta yeniden doğrulama:** Row-action'larda e-posta düzenleme yüzeyi yok; kural Güvenlik sekmesinde yüzeylendi. `UserDetailDto`'ya optional `pendingEmail` eklendi (backend henüz döndürmeyebilir). SecurityTab'a "E-posta" bölümü: mevcut e-posta + doğrulama-bekliyor/doğrulandı + yeniden-doğrulama bilgi notu. `pendingEmail` doluysa uyarı (`security-email-pending`).
- **Çoklu rol pasife alma uyarısı** zaten ISSUE-03'te vardı (deactivate confirm `multiRoleWarning`), korundu.
- Test: `UserRowActions.test.tsx` +4 (self gizleme, self locked, son-admin disable+sebep, normal aktif); `UserDetailPage.test.tsx` +2 (e-posta pending + verified). Tüm users suite 51 yeşil; `npm run build` yeşil.

### Anomali notu (GÜNCEL — ISSUE-01)
- Önceki oturumdan kalan, benim dokunmadığım `StudentsPage.tsx` + `StudentsPageHead.tsx`
  unstaged değişiklikleri (Yeni Öğrenci butonunu kaldırma) ISSUE-01 ile **aynı dosyalara**
  dokunuyordu. Çözüm: bu leftover'ı `git stash`'e aldım (etiket:
  **`stash@{0}: On master: leftover-prev-session-students-newbtn`**), ISSUE-01'i temiz
  baseline üstünde geliştirip commit'ledim (`0834f37`), stash pop **çakıştı** → çakışan iki
  dosyayı HEAD'e (ISSUE-01 commit'ine) geri yazıp working tree'yi temizledim. **Leftover
  kaybolmadı; hâlâ `stash@{0}`'da duruyor.** Sonraki oturumda kullanıcı isterse
  `git stash pop stash@{0}` ile geri alabilir (Yeni Öğrenci butonu kaldırma kararı verilirse).
  Leftover hiçbir commit'e DAHİL EDİLMEDİ.

## students-spec-audit

### ✅ ISSUE-01 tamamlandı (2026-06-08) — kararlar
- **Sahiplik sınırı netleşti (§1.2, spec'e uygun, sapma yok):** Öğrenciler ekranı
  `AcademicSessions` modülünü tüketir. `Enrollment` ≈ `ClassRoomStudent` (sezona bağlı,
  tarihsel: transferde kapatılır+yeni kayıt → tam §4.8). Sezon seçici kaynağı =
  mevcut `GET /academic-sessions` (`AcademicSessionDto[]`, `isCurrent`).
- **Sezon ekseni web'de:** `SeasonSelector` (head'de), URL state `season`; etkin sezon =
  URL'deki geçerli sezon, yoksa `isCurrent`. `studentsApi.list/exportFile` + `useStudentsQuery`
  + `studentKeys.list` artık `seasonId` taşır. Hardcoded `SEASON` sabiti kaldırıldı.
- **Kayıt Geçmişi sekmesi (§4.6):** drawer'da yeni "Kayıt Geçmişi" tab; `useEnrollmentHistoryQuery`
  + `studentsApi.enrollmentHistory` (şimdilik `[]` döner). Boş/yükleniyor/hata net degrade.
- **Backend'e dokunulmadı (karar — çatalda durmadan ilerlendi):** `GetEnrollmentHistory`
  slice'ı + server-side `seasonId` filtresi yok. Issue repo'su web; §4.9 "üret/teyit" notu
  bounded scope dışı. Tüketici hazır, uç açılınca tek metot (`enrollmentHistory`) +
  `list` param'ı beslenecek. `completion_status` "⚠️ Spec Dışına Çıkılanlar"a işlendi.
- **Test:** `SeasonSelector.test.tsx` (3), `StudentDetailEnrollment.test.tsx` (3). Students
  suite 14 yeşil; `npm run build` yeşil.

### ISSUE-02 için zemin (web-guardian-management-home, §4.7)
- Spec §4.7: veli CRUD Öğrenci detayının evidir (ayrı veli ekranı yok). Çoka-çok ilişki,
  ilişki üzerinde tip (anne/baba/vasi) + birincil bayrağı. Akış: "Veli ekle" → önce mevcut
  velilerde ara (kardeş bağla) → yoksa yeni veli + arka planda User hesabı/davet.
- Mevcut durum: drawer "Genel" sekmesi yalnız birincil veliyi read-only gösteriyor
  (`StudentDetailDrawer` mini-card, `useStudentParentsQuery` → `GET /users/students/{id}/parents`).
  Ekle/çıkar/birincil-ata + kardeş arama YOK. Tablo §4.4 "çoklu veli +1" kolonu da yok.
- Backend: ilişki uçları `RelationshipsController` (`/users/students/{id}/parents`) altında;
  `LinkGuardian`/`UnlinkGuardian`/`SetPrimaryGuardian` (§4.9) **doğrula/üret** — kodda
  henüz teyit edilmedi. ISSUE-02 başında `RelationshipsController` + ilgili command'lar okunmalı.

### ✅ ISSUE-02 tamamlandı (2026-06-08) — kararlar
- **Backend zaten hazırdı:** veli–öğrenci ilişkisi için `CreateRelationship`/
  `RevokeRelationship`/`UpdateRelationshipPermissions` command'ları + `RelationshipsController`
  (`POST/PUT/DELETE /users/relationships`, `GET /users/students/{id}/parents`) var.
  §4.9 adıyla ayrı `LinkGuardian`/`UnlinkGuardian`/`SetPrimaryGuardian` slice'ı **yazılmadı**
  → mevcut eşdeğer uçlar bağlandı (CLAUDE.md: aynı işi yapan handler'ı kullan/genişlet).
- **Backend'e yapılan tek dokunuş (hafif DTO zenginleştirme):** `StudentParentDto`'ya
  `Phone`/`Email` (GetStudentParents projeksiyonu — `Person.PrimaryPhone/PrimaryEmail`);
  `PersonListItemDto`'ya `ParentCount` (ListPersons GroupBy'dan, çoklu veli "+N" için).
  Integration testi: `GetStudentParents_ShouldProjectParentContactAsync` (LocalDB yeşil).
  Not: `PhoneNumber` value object `+` strip eder (`+90555…` → `90555…`).
- **Web mimari kararlar (çatalda durmadan):**
  - Drawer'a **Veliler** sekmesi (`GuardiansTab.tsx`); "Genel"deki read-only birincil
    veli mini-card'ı **korundu** (özet). CRUD yeni sekmede.
  - **Veli ekle** = tek diyalog (`AddGuardianDialog.tsx`): mevcut arama (`GET /users/persons?
    profileType=Parent&search=`) → kardeş bağla; yoksa yeni veli (`POST /users/persons`
    profile=Parent + e-posta/telefon) → `POST /users/relationships`. Arka plan User
    hesabı/davet backend event'ine bırakıldı (invite-first; web tetiklemez).
  - **Tek-birincil** sunucuda atomik değil → `useGuardianMutations.setPrimary` client
    orkestrasyonu: diğer birincilleri ardışık PUT ile düşür, sonra hedefi birincil yap.
  - İzin: `users.update` (CreateRelationship `[RequirePermission("users.update")]` ile aynı).
  - Tablo "Veli" kolonu: birincil-dot + ad + `parentCount>1` ise "+N".
- **Test:** `GuardiansTab.test.tsx` (5: boş-uyarı, çoklu liste+tek birincil, setPrimary
  tek-birincil arg, çıkar onay/red), `StudentsTableParent.test.tsx` (3: +N, tek veli,
  velisiz). Students suite **22 yeşil**; `npm run build` yeşil.

### ✅ ISSUE-03 tamamlandı (2026-06-08, web `557f129`) — kararlar
- `StudentRowActions.tsx` (satır … overflow menüsü) + `useStudentActions.ts` (yaşam-döngüsü
  mutasyonları) + `studentsApi` suspend/reactivate/graduate/transferOut/deactivate metotları.
- **Önemli avantaj (users ekseninden farkı):** öğrenci satır id = **Person.id** ve backend
  lifecycle uçları Person.id ekseninde HAZIR (PersonsController `{id}/suspend|reactivate|
  graduate|transfer|archive`). Bu yüzden Kaydı dondur/etkinleştir/Nakil/Mezun/Pasife al
  **gerçek uçlara bağlandı**; başarıda `studentKeys.all` invalidate → §4.8 (aktif tablodan düşme).
- **Pasife al = archive (soft, §1.3).** "Mezun/Nakil/Pasife al" onay diyaloğu (component-içi).
- Görünür-ama-pasif (notReadyHint): Sınıf ata · Belge ekle · akademik Düzenle · toplu Sınıf
  Ata/Yükselt (Person-ekseni AssignClass/PromoteStudents/UploadDocument yok).
- "Veli bağla"/"Detay" → drawer `initialTab` ile ("guardians"/"general") açılır.
- Toplu çubuk yeniden düzenlendi: Sınıf Ata + Sınıf Yükselt(terfi) + Dışa Aktar; Bildirim
  toplu setten çıkarıldı (§4.5 dışı). `onSendNotification`/`onDeactivate` prop'ları kaldırıldı.
- Test: `StudentRowActions.test.tsx` (8); `StudentsTableParent.test.tsx` QueryClientProvider
  ile sarıldı (tablo artık RowActions mount eder).

### ✅ ISSUE-04 tamamlandı (2026-06-08, web `f06a6e4`) — kararlar
- Drawer sekme seti §4.6: Genel · Veliler · Akademik · Devamsızlık · Kayıt Geçmişi · Belgeler ·
  Hesap. "Notlar"→"Akademik" relabel (salt-okunur). Belgeler/Hesap **iskelet**.
- **Hesap köprüsü:** `/admin/users/{student.id}` (= Person.id; users portalında Person detayı).
  Drawer `useNavigate` kullanır → drawer render eden testler **MemoryRouter** ile sarılmalı.
- **Onaylı sapma:** spec-dışı **Ödemeler (payments) sekmesi kaldırıldı** (§4.6 setinde yok);
  completion_status "⚠️ Spec Dışına Çıkılanlar"a işlendi.
- i18n: `drawer.tabs.marks`→`academic`, `payments` kaldırıldı; `documents`/`account` eklendi;
  `marksCard`→`academicCard`, `paymentsCard`→`documentsCard`+`accountCard`.
- Test: `StudentDetailTabs.test.tsx` (4).

### ✅ ISSUE-05 tamamlandı (2026-06-08, api `744bc97` + web `9807263`) — kararlar
- **Mimari karar (çatal — durmadan ilerlendi):** Filtreler **server-side** yapıldı (client-side
  süzme sayfalamayı/totalCount'u bozardı; mevcut class/gender zaten server-side). Backend
  `ListPersonsQuery`'ye **2 yeni param + veli-adı arama** eklendi (issue API notu yetkilendiriyor;
  "eksikse parametre ekle"):
  - `GradeCode` (string?) — Seviye/Kademe. ClassRoom.FullName = "{gradeCode}-{section}";
    `FullName LIKE '{code}-%'` ile o seviyedeki şubelerin öğrencilerini süzer.
  - `HasGuardian` (bool?) — Veli durumu (tanımlı/eksik): aktif `ParentStudentRelationship`
    (RevokedAt==null) varlığına göre.
  - **Veli-adı arama** (§4.3): arama dalına aktif ilişki üzerinden parent join + `Person.Name`
    Like eklendi → ad / öğrenci no / veli tam karşılandı.
- Controller (`PersonsController.ListAsync`) + web (`studentsApi.list/exportFile`, `useStudentsQuery`,
  `studentKeys`, `StudentsToolbar` 2 filtre, URL state grade/guardian, çipler, clearAll) bağlandı.
- **Seviye seçenek kaynağı (not):** yüklü satır sınıf adlarından türetilir (ayrı GradeLevel lookup
  ucu eklenmedi); grade seçiliyken seçenek seti daralabilir (aktif değer tutulur). Export ucu
  (`ExportPersonsQuery`) yeni param'ları henüz tüketmiyor (web zararsız geçirir).
- **Test:** api unit +2 (HasGuardian true/false, MockQueryable), api integration +1 (veli-adı arama +
  HasGuardian, gerçek SQL Server — Testcontainers, **yeşil**); web 6 (filtre onChange + param-map).
  Students web suite **40 yeşil**; `npm run build` + `dotnet build` yeşil.

### ✅ ISSUE-06 tamamlandı (2026-06-08, web `0860801`) — kararlar
- §4.8 koruma kuralları UI'da (sunucu kuralının aynası; iş kuralı server-side kalır, yeni server
  kuralı yok = issue Out of Scope'a uyumlu).
- **Veli eksik uyarısı:** `StudentsTable` veli hücresi `parentCount===0`'da nötr "—" yerine uyarı
  tonu rozeti (`row.guardianMissing` + hint tooltip). `StudentDetailDrawer` "Genel" parentCard
  birincil veli yoksa **ve** `parentsQuery.isSuccess` (yüklenirken yanlış-pozitif yok) → uyarı.
- **Sınıf değişimi aktif-sezon notu:** Kayıt Geçmişi sekmesine `enrollmentCard.seasonNote`.
- **Öğrenci no değişmez:** zaten hiçbir formda input yok (drawer salt-metin fact); test ile teyit
  (input yokluğu).
- **Mezun/nakil düşme:** ISSUE-03'te lifecycle uçları + `studentKeys.all` invalidate ile zaten
  çalışıyor; ISSUE-05'te `status` filtresiyle (graduated) erişim sağlandı → test ile teyit (Mezun
  rozeti, Aktif değil).
- CSS: `.guardian-missing` (tablo), `.mini-warning` (drawer), `.season-note`.
- **Test:** `StudentsEdgeCases.test.tsx` (4: veli-eksik var/yok, no read-only, mezun rozeti),
  `StudentDetailGuardrails.test.tsx` (4: drawer veli-eksik isSuccess true/false, sezon notu, no
  read-only). Students web suite **48 yeşil**; `npm run build` yeşil.

### students-spec-audit BİTTİ → sıradaki teachers-spec-audit
- `teachers-spec-audit/` klasörünü oku (README + ISSUE-NN-*.md), issue no sırasıyla başla.
- İlgili spec bölümü muhtemelen "Öğretmenler" ekranı (spec'te §5.x). İlk issue'da binding spec
  maddelerini + `.claude/docs/modules/teachers/completion_status.md`'i oku.
- Genel zemin (users/students'tan): Identity `User` vs Person/Profile ayrı dünyalar; öğretmen
  satır id muhtemelen Person.id (öğrenci gibi); domain lifecycle uçları PersonsController'da
  olabilir. Önce keşfet, uydurma.

## Notlar / kararlar
- ISSUE-01: §3.2 "Dikkat Gerektiren = kilitli + askıda" için `UserStatus`'ta Locked yok (locked = `LockoutEnd > now`).
  Bu yüzden `ListUsers` status filtresinden türetilemez → backend'e hafif **`GetUserStats`** query eklendi (issue API notu bunu yetkilendiriyor).
- Web'de identity için `ListUsers`/stats client'ı yoktu; `modules/identity/api/user.api.ts` + hook ekleniyor.
- Mevcut Kullanıcılar ekranı `usePersons` (Person modeli) üzerine kurulu; spec ekseni hesap/Identity. Eksen kayması ISSUE-01..06 boyunca parça parça.
