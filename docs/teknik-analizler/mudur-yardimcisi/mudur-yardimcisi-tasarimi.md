# OKSİS — Müdür Yardımcısı Belirleme Tasarımı (E-29)

| | |
|---|---|
| **Belge türü** | Tasarım — **2026-09-24'te uygulandı ve Altınay'da ölçüldü** (`oksis-api` `ccd1d073`/`8e673238`/`cc4a2aa3`, `oksis-ui` `c065220`, iki depoda da `feat/mudur-yardimcisi` dalı); kapanış Bulgu Arşivi §60 |
| **Kapsam** | `oksis-api` @ `f07eb5ea` · `oksis-ui` @ `2fde650` (web + mobil) |
| **Tarih** | 24 Eylül 2026 |
| **Neden** | Altınay B6.4: müdür yardımcısı hem ders veriyor hem idari iş yapıyor. `E-29`'daki üç seçenek (a/b/c) kullanıcının tarifiyle netleşti (§1). |
| **Bağlı** | [[OKSİS - Bulgu Kayıt Defteri]] `E-29`, `TB-249`, `TB-250` · [[Altınay — Yaşam Döngüsü Test Başlıkları]] B6.4 · karar 0020 (okul düzeyi rol) |

---

## 1. Kullanıcının tarifi (2026-09-24)

1. Müdür okulun **herhangi bir öğretmenini** seçip **müdür yardımcısı** olarak belirler. Bunun hangi ekranda yapılacağı birlikte kararlaştırılacak (§6).
2. Belirlenen kişi **öğretmen olarak yaptığı her işi yapmaya devam eder**.
3. Aynı kişi **müdürün yaptığı her işi** de yapar. Şimdilik kısıt yok; ileride yetkileri daraltılabilir.
4. İki görev arasında **profil değiştirerek** geçer. Öğretmen ve idareci yetkilerinin tek oturumda birlikte görünmesi gerekmiyor.

Bu tarif `E-29` seçeneklerinden **(a)'ya** denk geliyor: `VICE_PRINCIPAL` rolü açılıyor, ama izin kümesi bugün müdürünkiyle aynı. (b) ve (c) seçilmedi. Gerekçe §2.1'de.

---

## 2. Tasarım kararları

### 2.1 Ayrı rol, müdürle aynı izinler

Yeni sistem rolü:

| Alan | Değer |
|---|---|
| `Code` | `VICE_PRINCIPAL` |
| `DisplayName` | Müdür Yardımcısı |
| `PortalType` | `Admin` (müdürle aynı portal, yani `Staff` profiliyle açılır) |
| `Level` | **70** (müdür 80, öğretmen 40) |
| İzinler | `SCHOOL_ADMIN`'in izin kümesinin **aynısı** (§2.2) |

**Neden müdüre `SCHOOL_ADMIN` verilmiyor ((b) seçeneği):**
- **Müdür bu atamayı yapamaz.** Atama kuralı "yalnız kendinden kesin düşük seviye" diyor (`CreateRoleAssignmentCommandHandler`). 80'e 80 atanamadığı için işi yalnız platform yapabilirdi. Seviyesi 70 olan bir rolü ise müdür kuralı esnetmeden atayabilir.
- **Yardımcı müdürü görevden alabilirdi.** Eşit seviyedeki iki yönetici birbirinin rolünü iptal edebilir (bkz. `TB-249`).
- **İleride daraltmak göç ister.** Yardımcılar `SCHOOL_ADMIN` taşırsa, "yardımcıya şu izin gitmesin" kararı her okulda "hangi `SCHOOL_ADMIN` aslında yardımcı?" sorusunu doğurur, oysa `StaffProfile.Position` serbest metin. Ayrı rol varsa daraltma, rolden izin satırı silmekten ibaret kalır.
- **Arayüz ikisini ayırt edemez.** Kullanıcı listesi ve bildirim alıcıları "müdür" ile "müdür yardımcısı"nı ayrı gösteremezdi.

**Neden kişiye izin verme ((c) seçeneği) değil:** Tarif rol düzeyinde. (c) büyük bir iş ve bugün gerek yok.

### 2.2 İzin kümesi kodla aynalanır, elle kopyalanmaz

`RolePermissionSeedData` müdürün izinlerini iki yoldan veriyor: `AllPermissionIds()` döngüsü ve buna ek olarak **yalnız müdüre verilen** izinler (`AssignmentsCopySeason`, `AssignmentsManageBranchRules`, `CurriculumHoursOverride`, `DutiesManage`, …). Elle kopyalanmış bir liste, müdüre ileride eklenen bir izni yardımcıya sessizce vermez.

**Kural:** `Rows()` üretimi bittikten sonra, `RoleId == SchoolAdmin` olan her satırın `VicePrincipal` için bir kopyası üretilir (tek `SelectMany`/sarmalayıcı). Böylece "müdürle aynı" durumu **tanım gereği** korunur.

**Bekçi test:** `VicePrincipalMirrorsSchoolAdminTests`, seed çıktısında iki rolün izin kümelerinin eşit olduğunu doğrular. İleride yardımcının yetkileri daraltılacağı gün bu test bilerek "eşit" yerine "bilinçli fark listesi" testine çevrilir. Fark böylece kodda görünür olur.

### 2.3 Okul düzeyi (sezonsuz) atama

`VICE_PRINCIPAL`, `SchoolLevelRoles` kümesine eklenir. Karar 0020 müdür için neyse yardımcı için de o geçerli: atama `SeasonId = null` ile yapılır ve görevden alınana kadar her sezonda geçerli kalır. Böylece her yıl yeniden belirlemeye gerek kalmaz. Görev bittiğinde yardımcılık açıkça kaldırılır (§3.2).

> Seçenek: yardımcılık sezona bağlı da olabilirdi, yani her sezon yeniden belirlenirdi. Önerilmiyor: müdürle aynı yaşam döngüsünü taşıması daha az sürpriz üretir, sezon açılış kontrol listesine yeni bir madde eklemez ve `ResolveSchoolAdminAccountsAsync` gibi yerlerde iki farklı sezon davranışı doğmaz.

### 2.4 Profil: öğretmenin kişisine `Staff` profili eklenir

- Öğretmenin `Teacher` profili ve `TEACHER` ataması **olduğu gibi kalır**. Ders programı, yoklama, not girişi etkilenmez.
- Kişiye bir `StaffProfile` eklenir (`Position = "Müdür Yardımcısı"`). `AccountPermissionResolver`, `Staff` profili aktifken yalnız `Admin` portallı rollerin, yani `VICE_PRINCIPAL`'ın iznini verir. `Teacher` profili aktifken yalnız `TEACHER` izinleri gelir. Tarifin 4. maddesi bugünkü çözücüyle **kod değişmeden** sağlanıyor.
- Profil değiştirme hazır: web kabuğundaki seçici (`app-shell.tsx`) ve mobildeki "Daha Fazla" ekranı (`more-screen.tsx`), birden çok profil varsa listeyi gösteriyor. Mobil de `admin` rolünü tanıyor (okul, rapor, duyuru, etkinlik sekmeleri). `profileTypeToRole("Staff")` → `admin`.
- Giriş: iki profilli hesap son kullandığı profille açılır (`Account.LastActiveProfileType`). Son profil yoksa profil seçimi ister (`ContextResolver`).

### 2.5 Tek komut: belirle / kaldır

Genel uçlar (`POST persons/{id}/profiles` + `POST role-assignments`) iki ayrı istek. Ekranın bunları sırayla çağırması yarım kalmış durum üretir: izin verilmemiş bir `Staff` profili kalır, seçicide "Yönetici" görünür ama kabuk boş açılır. Bu yüzden **iki amaca özel komut** yazılacak:

**`DesignateVicePrincipalCommand(PersonId)`** — `[RequirePermission("roles.assign")]`, tek `SaveChanges`:
1. Kişi okulda var ve **süresi bitmemiş bir `Teacher` profili** taşıyor. Yoksa: `VicePrincipalRequiresTeacher`. Tarif "herhangi bir öğretmen" diyor.
2. Ayrıcalık kapıları `CreateRoleAssignment` ile **aynı kod** üzerinden geçer: kendine atama yok, seviye kuralı, alt küme kuralı. Kapılar ortak bir `RoleAssignmentGuard`'a çıkarılır, kopyalanmaz. Müdür (80) yardımcı (70) atayabilir. Yardımcı ise başka bir yardımcı atayamaz (70 ≥ 70). Bu, seviye kuralının doğal sonucu ve bilinçli.
3. `Staff` profili yoksa eklenir. Varsa ve ayrılmış olarak işaretliyse (`TerminatedAt`) işaret kaldırılır (§3.2).
4. `VICE_PRINCIPAL` ataması: yoksa yeni satır, `Inactive` satır varsa **`Reactivate()`**. Tekillik (kişi, rol, sezon) üzerinden kurulu ve durumdan bağımsız, dolayısıyla ikinci kez belirlemede yeni satır açmak `Duplicate` hatası verir.
5. Zaten aktif yardımcıysa işlem idempotent başarı döner.
6. Önbellek geçersizleştirilir ve `perms_ver` artırılır (`revokeSessions: false`). Kişi oturumu kapatmadan profil seçicisinde "Yönetici"yi görür.

**`RevokeVicePrincipalCommand(PersonId, Reason)`** — `[RequirePermission("roles.assign")]`:
1. Aktif `VICE_PRINCIPAL` ataması `Revoke(reason)` ile iptal edilir. Denetim izi korunur.
2. `StaffProfile.Terminate(today)`: profil silinmez, ayrılmış olarak işaretlenir.
3. **Ayrılmış `Staff` profili profil listesinden düşer**. Liste `PersonDirectory` içinde `person.Profiles`'tan kuruluyor ve giriş, bağlam, profil değiştirme gibi tüm tüketiciler oradan okuyor. Böylece seçicide izni boş bir "Yönetici" kalmaz. **Uygulandı:** kural domainde `Person.SelectableProfileTypes()` olarak yaşıyor. Ayrılmış idari profil, kişinin başka bir profili varsa düşer; tek profili o olan kişi bugünkü gibi girer, çünkü ayrılan personelin girişini kapatmak ayrı bir karar. Süresi bitmiş öğretmen profiline dokunulmadı.
4. `perms_ver` artırılır ve oturumlar düşürülür (`revokeSessions: true`, genel iptal ucuyla aynı ilke). Kişi yeniden giriş yaptığında `Teacher` profiliyle açılır.

Uçlar (uygulandı, 2026-09-24): `GET api/v1/school-administration` → `{ principals[], vicePrincipals[] }` (her biri: `personId`, `fullName`, `branchName`, `assignedAt`; `users.view`) · `POST api/v1/school-administration/vice-principals` `{ personId }` → `{ id }` (idempotent) · `POST api/v1/school-administration/vice-principals/{personId}/revoke` `{ reason }` → 204. Görevden alma, genel iptal ucunun kalıbıyla `POST …/revoke` olarak yazıldı; gövdeli `DELETE` kullanılmadı. "Belirleyen" alanı listeye konmadı: `AssignedBy` hesap kimliği tutuyor ve ad çözümü ayrı bir iş. Yeniden belirlemede `AssignedAt` güncelleniyor (`RoleAssignment.Reactivate(reassignedBy)`).

---

## 3. "Müdürle aynı" demenin kodda dokunduğu yerler

İzin tabanlı her kontrol (`[RequirePermission]`, `AnnouncementPublisherAuthority`, `PersonAccessGuard` → `users.view-all`, `ArchivedSeasonAccess` → `season.archive.view` …) §2.2 sayesinde **kendiliğinden** doğru çalışır. Rolü **adıyla ya da kimliğiyle** soran yerler ise elle ele alınmalı:

| Yer | Bugün | Yapılacak |
|---|---|---|
| `SchoolLevelRoles` | Yalnız `SCHOOL_ADMIN` | `VICE_PRINCIPAL` eklenir (§2.3) |
| `SystemRoleSeedData` + `RolePermissionSeedData` | Beş rol, yorumda "VP ertelendi" | Rol satırı + ayna (§2.2), ertelendi yorumları kalkar. **Göç gerekir** (`HasData`) ve göçler otomatik uygulanmıyor: dev DB için `dotnet ef database update` gerekli |
| `NotificationRecipientResolver.ResolveSchoolAdminAccountsAsync` | `SystemRoleId == SchoolAdmin` | Rol kümesi `{SchoolAdmin, VicePrincipal}` olur. Devamsızlık eşiği bildirimi yardımcılara da gider. **Önce `TB-250` kapanmalı**: bugün sezon süzgeci sezonsuz atamayı dışarıda bırakıyor |
| `UserRole` enum + `AccountUserProjection` + `UserExportLabels` + `PermissionService` | 5 rol eşlemesi | `VicePrincipal` eklenir. Aksi hâlde kullanıcı listesinde rol `unmappedRoleNames`'e düşer (B-22 yolu) |
| `ListAssignableRoles` | Seviye süzgeci | Değişmez. Müdüre `VICE_PRINCIPAL` kendiliğinden görünür, ama arayüz onu genel atama yerine §2.5 akışına yönlendirir |
| `RevokeRoleAssignment` (genel iptal ucu) | Yalnız izin kontrolü | **`TB-249` ön koşul**: seviye ve kendi-kendini-iptal kapısı. Olmazsa izinleri müdürle aynı olan yardımcı, müdürün `SCHOOL_ADMIN` atamasını iptal edebilir |
| `IdentityDevSeeder` | Müdür yardımcısı `SCHOOL_ADMIN` alıyor | Öğretmen + `VICE_PRINCIPAL` olarak tohumlanır (gerçek şekil) |
| `PersonUserCreationService` (davet/kullanıcı oluşturma) | Rol → profil eşlemesi | **Kapsam dışı**: yardımcı davetle değil, mevcut öğretmenden belirlenir. Eşlemeye eklenmez; davet ekranında seçenek olarak çıkmaz |
| Web/mobil `ROLE_LABEL` / `ROLE_TITLE` | 4 rol anahtarı | Profil seçici `Staff` → "Yönetici" diyor, bu doğru ve kalıyor. Kullanıcılar çekmecesinde rol etiketi "Müdür Yardımcısı" olarak eklenir |

---

## 4. Ön koşul bulgular (bu tasarım sırasında çıktı)

- **`TB-249`**: Genel rol iptal ucunda seviye kapısı yok. `roles.assign` taşıyan kişi eşit ya da yüksek seviyedeki bir rolü, hatta kendi rolünü iptal edebiliyor. Bugün yalnız müdürler etkileniyor, yardımcı eklenince risk büyüyor.
- **`TB-250`**: Devamsızlık eşiği bildirimi idareye gitmiyor. `ResolveSchoolAdminAccountsAsync`, `SeasonId == currentSeasonId` ile süzüyor. Oysa 0020'den beri müdür ataması sezonsuz (`null`), dolayısıyla okulun güncel sezonu varken liste boş dönüyor. (Koddan okundu, gerçek koşuda ölçülmedi.)

---

## 5. Test planı

- **Birim:** Belirleme için: öğretmen olmayan kişi reddedilir; kendine belirleme reddedilir; yardımcı, yardımcı atayamaz; ikinci kez belirleme idempotent; kaldırılıp yeniden belirleme `Reactivate` ile yapılır; kaldırma sonrası `Staff` profil listesinde yok. Ayna bekçisi (§2.2). `TB-249` kapısı.
- **Entegrasyon (gerçek SQL):** Tenant izolasyonu (başka okulun öğretmeni `PersonNotFound`); göç sonrası rol ve izin satırları; `Teacher` ve `Staff` profilinde çözülen izin kümeleri ayrık.
- **Uçtan uca (Altınay):** Müdür ekrandan yardımcıyı belirler. Yardımcı çıkış yapmadan seçicide "Yönetici"yi görür, geçer, bir yönetici işini yapar (ör. şube düzenler), "Öğretmen"e döner ve yoklama alır. Müdür kaldırır, yardımcının oturumu düşer ve yeniden giriş yalnız öğretmen olarak açılır. Web'de ve mobilde (Expo web) gezilir.

---

## 6. Açık karar: belirleme nerede yapılacak?

| Seçenek | Nasıl | Artısı | Eksisi |
|---|---|---|---|
| **A. Ayarlar › Okul › "İdari Kadro" kartı** *(önerilen)* | Müdür ve aktif yardımcılar listelenir. "Müdür Yardımcısı Ekle" → öğretmen seçici. Satırda "Görevden Al" (gerekçe zorunlu) | İdari kadro tek yerde görünür; kaldırma da aynı yerde; öğretmen listesi kirlenmez | Yeni bir kart |
| **B. Öğretmenler › öğretmen çekmecesi** | "Hesap" sekmesinde "Müdür yardımcısı yap / görevden al" düğmesi. Listede rozet | Öğretmenin bağlamında, keşfi kolay | "Okulun yardımcıları kim?" sorusunun tek bir cevabı olmaz; çekmece bugün yalnız yönlendirme amaçlı |
| **C. Kullanıcılar › rol atama** | Genel rol atama ekranı | Genel çözüm | Bugün salt-okunur; genel atama ekranı büyük iş ve `Staff` profilini ayrıca düşünmek gerekir |

Öneri: **A**, ayrıca B'de salt-okunur rozet ("Müdür Yardımcısı") ve A'ya kısayol.

✅ **Karar — 2026-09-24: A ve B birlikte, ikisi de tam yetkili.**
- **A: Ayarlar › Okul › İdari Kadro kartı.** Kadronun tek görünümü: müdür(ler) salt-okunur, aktif yardımcılar ise ad, branş ve belirlenme tarihiyle listelenir. "Müdür Yardımcısı Ekle" öğretmen seçiciyi açar. Seçici yalnız süresi bitmemiş öğretmen profili olan ve henüz yardımcı olmayan kişileri gösterir. Her satırda "Görevden Al" var, gerekçe zorunlu.
- **B: Öğretmenler › öğretmen çekmecesi.** "Hesap" sekmesinde durum kartı yer alır. Öğretmen yardımcı değilse "Müdür Yardımcısı Yap", yardımcıysa rozet ile "Görevden Al" gösterilir; gerekçe zorunlu. Öğretmen listesinde ada rozet eklenir.
- **Tek sözleşme:** İki yüzey de aynı üç ucu (§2.5) ve aynı sorgu anahtarını kullanır. Birinde yapılan değişiklik ötekinde anında görünür; iki yüzey mutasyon sonrası aynı sorguları geçersizleştirir. Onay ve gerekçe diyaloğu tek bileşendir, iki yüzey onu paylaşır.
- **Görünürlük:** Eylem düğmeleri `roles.assign` izniyle, liste `users.view` izniyle kapılanır. Yardımcı kendi satırında "Görevden Al"ı görmez, çünkü sunucu kendi kendini görevden almayı reddeder (`TB-249` kapısı) ve ekran bu kuralı ayrıca taşımaz, yalnız hatayı gösterir. Bir yardımcının başka yardımcıyı belirlemesi de sunucuda reddedilir (seviye 70 ≥ 70). Ekran bu durumda düğmeyi gizlemez, ret mesajını gösterir. Kural sunucuda.
- **Mock ve testler:** MSW mock'ları ile onları kilitleyen testler aynı turda yazılır.

---

## 7. Kapsam dışı

- Yardımcının izinlerini daraltmak (ileride; §2.2 bekçisi o gün farka çevrilir).
- Öğretmen ve idareci yetkilerinin tek oturumda birleşmesi (tarif gereği gerekmiyor).
- Öğretmen olmayan idari personele (öğretmenlik yapmayan yardımcı, memur) rol verme. Bugün `CreatePerson` + `Staff` yolu var ama rol yok, ayrı konu.
- Rehber öğretmen (`COUNSELOR`) gibi diğer ara roller.
