# Kullanıcı Yönetimi — Business Rules

> Bu modüle özel iş kuralları. Yazılım dünyasından gelen genel kurallar değil — **OKSİS'te Kullanıcı Yönetimi için spesifik** kararlar.

> Genel iş kuralları için bkz. proje kökündeki `business-rules.md`.

---

## Kurallar

### BR-users-001: Person + Account ayrıştırması

**Kural:** Bir gerçek kişi (`Person`) sistemde **hiç login etmeden** var olabilir; ancak login eden her `Account` mutlaka bir `Person`'a bağlıdır (`Person.LinkedAccountId`).

**Sebep:** Anaokul-1. sınıf öğrencilerinin hesabı yoktur ama profil verisi sistemde bulunur (yoklama, notlar, sağlık bilgisi). Veli üzerinden iletişim kurulur. Ayrıca pasif personel veya mezun olmuş kişiler de bu yapıyla salt-okunur durumda korunur.

**Uygulama:**
- Backend: `Person` aggregate `LinkedAccountId` nullable; `identity.Account` ayrı modül.
- Frontend: "Hesabı yok" badge'i → davet butonu gösterir.
- DB: `persons.linked_account_id` nullable; FK `identity.accounts(id) ON DELETE SET NULL`.

**Edge case'ler:**
- Çocuk büyüyüp hesap açtığında: yeni `Account` üretilir, `Person.LinkedAccountId` set edilir, `StudentProfile.IsActiveStudent = true` yapılır.
- Mezun olunca: `LifecycleState = Graduated`, ama `LinkedAccountId` kalır (mezun portal'ı için).
- Vefat / silinme: `LifecycleState = Archived`, account suspend edilir, ancak FK kırılmaz.

**Test referansı:** `PersonWithoutAccountCanBeCreated`, `AccountCannotExistWithoutPerson`, `GraduationKeepsAccountLink`.

---

### BR-users-002: Bir Person birden fazla profil taşıyabilir

**Kural:** Bir öğretmen aynı zamanda kendi çocuğunun velisi olabilir. Bu durumda **iki ayrı Person** açmak yerine **tek Person + iki profile** kullanılır: `TeacherProfile` + `ParentProfile`.

**Sebep:** Çift kayıt veriyi tutarsız hale getirir (TCKN duplicate, iletişim bilgisi sync sorunu). Tek kişi tek kayıt prensibi KVKK uyumluluğu için de zorunludur.

**Uygulama:**
- Backend: `Person.AttachProfile(profile)` aynı tipten ikinci profili reddeder; farklı tipten profili kabul eder.
- Frontend: Person detay sayfasında her profil ayrı sekme/bölüm.
- DB: Her profile tablosunda `person_id` PK; aynı `person_id` farklı tablolarda olabilir.

**Edge case'ler:**
- Öğretmen-veli aynı kişiyse: rol ataması iki ayrı `RoleAssignment` satırı (TEACHER + PARENT).
- Yetkiler birleşiktir: ikisi de aktifse hem öğretmen hem veli endpoint'lerine erişir.
- UI'da bu kişi için "Çift rol" badge'i gösterilir.

**Test referansı:** `TeacherCanAlsoBeParentOfStudent`, `CannotAttachSameProfileTypeTwice`.

---

### BR-users-003: Veli-öğrenci ilişkisi yetki tiplerinden bağımsız değildir

**Kural:** Bir veliye öğrenciyle ilgili `CanViewInfo`, `CanMakeDecisions`, `IsPaymentResponsible`, `CanPickup`, `IsPrimaryContact` flag'leri **ayrı ayrı** atanır. Tek bir "veli" yetki paketi yoktur.

**Sebep:** Boşanmış ailelerde mahkeme kararı, sadece anneye karar verme yetkisi tanıyabilir. Üvey ebeveynler sadece pickup yetkisi taşıyabilir. Dede-büyükanne `CanViewInfo + CanPickup` taşıyabilir ama `IsPaymentResponsible` taşımaz. Bu durumlar gerçek özel okul müşterisinin günlük şikayetidir.

**Uygulama:**
- Backend: `ParentStudentRelationship` her flag'i ayrı kolon olarak taşır.
- Frontend: İlişki kurma formu 5 checkbox + RelationType select. Veli detay sayfasında her flag ayrı görünür.
- DB: Her flag `bit NOT NULL` + default.

**Edge case'ler:**
- Bir öğrencinin **hiç** `IsPrimaryContact = true` velisi yoksa → `Person.LifecycleState = Active` yapılamaz (validation).
- Tüm `IsPaymentResponsible = false` ise → billing modülü uyarı verir ama hesap aktiftir (öğrencinin kendisi ödeme yapıyor olabilir).
- `CanMakeDecisions = false` veli → "İzin Belgesi" gibi onay isteyen flow'larda kullanılamaz.

**Test referansı:** `DivorcedParentCanHaveLimitedRights`, `StudentRequiresAtLeastOnePrimaryContact`.

---

### BR-users-004: Roller sezona bağlıdır, kalıcı değildir

**Kural:** `RoleAssignment` mutlaka `SeasonId`'ye bağlıdır. Sezon değiştiğinde rol otomatik geçerliliğini yitirmez ama "aktif sezon" filtresi devreye girer; yeni sezona geçişte rol yenileme veya rol değişikliği işlemleri açıkça yapılır.

**Sebep:** Bir öğretmen 2025-2026'da "Rehber Öğretmen" iken 2026-2027'de "Branş Öğretmeni" olabilir. Bir öğrenci 2024-2025'te 9. sınıf öğrencisiyken 2025-2026'da 10. sınıf öğrencisidir (rol aynı ama kapsam farklı). Yetki sorgusu sezonsuz yapılırsa geçmiş rolleri de açar — bu **veri sızıntısı** demektir.

**Uygulama:**
- Backend: Authorization handler her zaman `currentSeasonId`'yi kullanır. `RoleAssignment.Where(r => r.SeasonId == currentSeasonId && r.Status == Active)`.
- Frontend: Sezon seçici (üst bar) tüm modüllerde mevcut; yetki ekranları seçili sezona göre filtrelenir.
- DB: `(PersonId, SystemRoleId, SeasonId)` unique index; sezon migration'ı `seasons` modülünün sorumluluğu.

**Edge case'ler:**
- Sezon geçişinde rol "kopyalansın mı"? — Sezon Yönetimi modülünde "Önceki sezondan rol aktar" akışı var; default tüm aktif rolleri yeni sezona kopyalar, kullanıcı isterse iptal eder.
- SuperAdmin gibi platform rolleri sezon-bağımsız mı? — Evet. `SuperAdmin` `RoleAssignment` taşımaz, master `SystemRole` üzerinden yetkilendirilir.
- Sezon kapatıldığında o sezona ait `RoleAssignment.Status` ne olur? — `Inactive` olur (otomatik Hangfire job ile), `Revoked` değil. Veri kalır, audit izi kırılmaz.

**Test referansı:** `RoleAssignmentScopedToSeason`, `CrossSeasonRoleQueryRequiresExplicitPermission`.

---

### BR-users-005: Davet bir iş akışıdır, e-posta gönderme değildir

**Kural:** `Invitation` aggregate'i bir state machine yönetir: `Created → Sent → Opened → Accepted/Expired/Revoked`. Her geçiş audit edilir, her toplu davet bir `BatchId` altında izlenir. Davet kabulü beş şeyi birden tamamlar: (1) `Person` aktivasyonu, (2) `Account` üretimi, (3) `RoleAssignment` ataması, (4) KVKK onayları, (5) ön-dolu profil doğrulaması.

**Sebep:** Özel okul yöneticisinin gerçek ihtiyacı "Sezon başında 3-A sınıfının 28 velisini sisteme bağla" işidir. E-posta sadece bunun bir aracıdır. Tek tek e-posta atıp her birinin onayını manuel takip etmek pratik değildir.

**Uygulama:**
- Backend: `Invitation` aggregate domain'de state machine ile geçişleri korur; her geçiş `AccountLifecycleEvent` üretir.
- Frontend: "Davet Geçmişi" sayfası — kim, ne zaman, hangi sezon, hangi rol için, hangi durum.
- DB: `invitations.batch_id` toplu davetleri gruplar; Hangfire job ile expiry sweep.

**Edge case'ler:**
- Davet süresi dolduysa: kullanıcı linke tıklayınca 410 + "Davet süresi dolmuş, yöneticinize ulaşın" mesajı.
- Aynı kişiye 2. davet atılırsa: önceki aktif davet `Revoked` edilir, yeni token üretilir, `RetryCount++`.
- Davet kabul sırasında KVKK `DataProcessing` reddedilirse: akış sonlandırılır, davet `Sent`'te kalır, kullanıcı tekrar deneyebilir.
- Toplu davette 28 kişiden 25'i kabul edip 3'ü etmediyse: batch raporu yöneticinin admin panelinde görünür, kalanlara "hatırlatma daveti" tek tıkla atılabilir.

**Test referansı:** `InvitationStateMachineForbidsIllegalTransitions`, `BulkInvitationRolledUpUnderBatch`, `RejectedConsentBlocksInvitationAccept`.

---

### BR-users-006: KVKK onayı versiyonlanır, geri çekme veri erişimini kapatır

**Kural:** Her KVKK metni (`ConsentBundle`) bir **versiyona** sahiptir (`v2026.05.01`). Kullanıcı bu versiyona onay verdiyse `ConsentRecord` üretilir. Versiyon değişirse eski onaylar `Expired` olur ve kullanıcıdan yeniden onay alınır. Onay geri çekildiğinde **hesap silinmez**, ancak ilgili veri türüne erişim downstream modüllerce kapatılır.

**Sebep:** KVKK denetiminde "Hangi versiyona, ne zaman, hangi IP'den onay verildi?" sorusunun yanıtı kanıt zinciri ile gelmek zorunda. "Hesabı sildim" cevabı yetmez; bazı onay türleri (pazarlama gibi) hesabın varlığından bağımsızdır.

**Uygulama:**
- Backend: `ConsentRecord.EvidenceHash` o anki HTML/PDF içeriğin SHA-256 hash'i; içerik ayrı `consent_bundle_versions` tablosunda saklanır (henüz tasarlanmadı, OQ-users-003).
- Frontend: Profil > "Onaylarım" sayfasında her onay türü için durum + tarih + versiyon; "Geri Çek" butonu.
- DB: `consent_records` üzerinde UPDATE/DELETE yasak (sadece `Granted/Revoked/Expired` statü değişimi); migration ile trigger.

**Edge case'ler:**
- `DataProcessing` (temel veri işleme) geri çekilirse: hesap kullanılamaz hale gelir → kullanıcı uyarılır ("Bu onay olmadan sistem işleyemez, hesabınız askıya alınacak"), `Suspend` flow'una yönlendirilir.
- `Marketing` geri çekilirse: sadece pazarlama e-postaları kesilir, sistem normal çalışır.
- `PhotoUsage` geri çekilirse: galeri/yıllık modülünde o öğrencinin fotoğrafları gizlenir.
- Onay verdikten sonra metin değişirse: kullanıcı login'de "Yeni KVKK metnini onaylayın" modal'ı görür, onaylamadan devam edemez.

**Test referansı:** `ConsentVersioningKeepsHistoricalGrants`, `RevokedConsentTriggersDownstreamSignal`, `ImmutableConsentEvidence`.

---

### BR-users-007: Yaşam döngüsü state machine ihlali domain hatasıdır

**Kural:** `PersonLifecycleState` geçişleri sadece tanımlı state machine üzerinden yapılır. Domain layer'da invariant olarak kontrol edilir; API'den geçersiz geçiş denemesi `400 USERS_LIFECYCLE_INVALID_TRANSITION` ile reddedilir.

**Sebep:** "Archived" bir kişinin tekrar `Active` olması KVKK silme talebinin geri alınması demektir — bu kasıtlı bir karar olmadan otomatik olmamalıdır. Aynı şekilde `Graduated` bir öğrenciyi `Suspended` yapmak anlamsızdır.

**Uygulama:**
- Backend: `Person` aggregate içinde `TransitionTo(newState)` method'u; `IllegalStateTransitionException`.
- Frontend: UI butonları mevcut state'e göre conditional (örn. `Archived` ise sadece "Görüntüle" butonu).
- DB: Check constraint sadece state setini kısıtlar; geçiş kuralı domain'de.

**Allowed Transitions Matrix:**

| From \ To | Draft | Invited | Active | Suspended | Graduated | Transferred | Archived |
|---|---|---|---|---|---|---|---|
| **Draft** | — | ✅ | 🚫 | 🚫 | 🚫 | 🚫 | ✅ |
| **Invited** | 🚫 | — | ✅ | ✅ | 🚫 | 🚫 | ✅ |
| **Active** | 🚫 | 🚫 | — | ✅ | ✅ (öğrenci) | ✅ | ✅ |
| **Suspended** | 🚫 | 🚫 | ✅ | — | ✅ (öğrenci) | ✅ | ✅ |
| **Graduated** | 🚫 | 🚫 | 🚫 | 🚫 | — | 🚫 | ✅ |
| **Transferred** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | — | ✅ |
| **Archived** | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | 🚫 | — |

**Test referansı:** `LifecycleStateMachineEnforcesValidTransitions`.

---

### BR-users-008: TCKN deterministik hash ile aranır, plain saklanmaz

**Kural:** TCKN (Türkiye Cumhuriyeti Kimlik Numarası) DB'de **plain text** olarak tutulmaz. Aranabilir olması için tenant-bağımlı tuzlu SHA-256 hash (`NationalIdHash`) hesaplanır; gösterim için ayrı bir alanda AES-256-GCM ile şifrelenir (`NationalIdEncrypted`).

**Sebep:** KVKK Madde 12: özel nitelikli/kimlik bilgileri açık metinde saklanamaz. Buna karşın admin paneli "TCKN ile ara" özelliğini destekler — bu yüzden deterministik hash gerekir (random salt + hash equality search yapamaz).

**Uygulama:**
- Backend: `TckHashService.Compute(tckn, schoolId)` → `SHA256(schoolId + ":" + tckn + ":" + tenantSalt)`. `TckCipherService.Encrypt/Decrypt` → AES-GCM, key vault'tan çekilir.
- Frontend: UI'da TCKN sadece son 4 hane görünür (`*******1234`); tam görüm için "Göster" tıklanır → audit kaydı.
- DB: `national_id_hash` `varbinary(32)`, unique index `(school_id, national_id_hash)`.

**Edge case'ler:**
- TCKN değişikliği (nadir, ama yeni evlat edinme/cinsiyet değişikliği vs.): yeni Person açılmaz, mevcut Person'da `national_id_hash` ve `national_id_encrypted` update edilir, audit kaydı `tckn_changed` event'i ile tutulur.
- Yabancı uyruklu öğrenci/öğretmen: `nationalId` null kalır, alternatif `foreignIdNumber` (TBD, OQ-users-005) alanı eklenecek.

**Test referansı:** `TcknStoredAsHashOnly`, `TcknDeterministicHashAllowsSearch`, `TcknDisplayMaskedExceptForAuthorized`.

---

### BR-users-009: Çoklu okul çalışan öğretmen tek Person, çoklu RoleAssignment ile modellenir

**Kural:** Bir öğretmen iki okulda birden çalışıyorsa, **her okulda ayrı `Person`** açılır (tenant izolasyonu zorunluluğu). Her tenant kendi `Person`'ını tutar. Cross-tenant kimlik bağı **şu an için yoktur**; gelecekte SuperAdmin tarafında bir `MasterIdentity` katmanı ile köprülenebilir (OQ-users-006).

**Sebep:** OKSİS multi-tenant. Bir tenant'ın verisi başka tenant'a sızamaz. Aynı kişi olsa bile her okul kendi audit'inden, KVKK onayından, profil bilgisinden sorumludur. "Bu öğretmen iki okulda da var" bilgisi raporlamada ileride istenirse master katmanı eklenir.

**Uygulama:**
- Backend: Tenant boundary her query'de zorunlu (`SchoolId` global filter).
- Frontend: SuperAdmin paneli ileride cross-tenant arama yapabilir (henüz scope dışı).
- DB: Her tenant kendi `persons` satırını tutar; `national_id_hash` farklı tenant'larda aynı olabilir (her tenant kendi salt'ını kullandığı için pratikte farklı; mantıksal olarak ayrı kişi sayılır).

**Edge case'ler:**
- Aynı kişi her iki okulda davet alırsa: iki ayrı `Account` üretilir (farklı email gerekir veya SuperAdmin master account'a bağlar — gelecek roadmap).
- Profilin senkronizasyonu yapılmaz; her okul kendi günceller.

**Test referansı:** `CrossTenantPersonsAreIsolated`, `SameTcknDifferentTenantsAllowed`.

---

### BR-users-010: Excel import tek bir transaction'da değil, batch + Hangfire ile işlenir

**Kural:** 5000 satıra kadar Excel dosyası kabul edilir. Preview synchronous (in-memory validation, DB'ye yazmaz). Confirm sonrası iş Hangfire job olarak kuyruğa alınır, 100'erli batch'lerle işlenir; her satır kendi transaction'ında.

**Sebep:** Tek transaction'da 5000 satır: lock contention + memory + rollback maliyeti yüksek. Bir satırın hatası tüm import'u uçurmamalı. Yönetici "98 başarılı, 2 hatalı, hatalıları indir" deneyimini ister.

**Uygulama:**
- Backend: `BulkImportPersonsHandler` Hangfire `IBackgroundJobClient` ile job enqueue eder; job içinde `IServiceScopeFactory` ile her batch için ayrı scope.
- Frontend: Import wizard 4 adım — tip seç, dosya yükle, kolon eşle, önizle. Confirm sonrası "İşleniyor" sayfası polling ile durum çeker.
- DB: `account_lifecycle_events` her başarılı satıra `imported_by_batch` event'i ekler.

**Edge case'ler:**
- Yarısı işlenirken job düşerse: Hangfire retry; her satır idempotent — `(school_id, national_id_hash)` veya `(school_id, student_number)` unique check.
- 100 satırlık batch'in 2'sinde hata: 98 yazılır, 2'si error log'a düşer, kullanıcıya rapor sunulur.

**Test referansı:** `BulkImportIsIdempotent`, `BulkImportBatchPartialFailureContinues`.

---

## Sınır Durumlar (Genel Tablo)

| Senaryo | Beklenen Davranış |
|---|---|
| Veli telefonunu kaybetti, login edemiyor | SchoolAdmin "Yeni davet" gönderir; eski hesap Suspend edilir, yeni `Account` davet kabulüyle oluşur. |
| Boşanmış ailelerde anne karar verme yetkisi reddetti | Mahkeme kararı yöneticiye iletilir, `ParentStudentRelationship.CanMakeDecisions = false` yapılır, izin formlarında o veli görünmez. |
| Öğrenci 9-A'dan 9-B'ye sınıf değiştirdi | Users modülü değil — `classrooms` modülü; ancak `AccountLifecycleEvent` `class_changed` olarak kaydı geçilir. |
| Öğretmen sezon ortasında işten ayrıldı | `TeacherProfile.TerminatedAt` set edilir, aktif `RoleAssignment` `Revoke` edilir, `Person.LifecycleState = Suspended`. |
| Mezun olmuş öğrenci sisteme geri girmek istiyor | `Graduated` state korunur, ayrı bir "Mezun Portal" akışı açılır (henüz scope dışı). |
| Kardeş indirimi muhasebede etkisini gösterecek | `billing` modülü, `ParentStudentRelationship` üzerinden aynı veliye bağlı öğrencileri sayar; Users sadece veri sağlar. |
| Vefat eden öğrenci kaydı | SchoolAdmin "Archive" eder, `LifecycleState = Archived`, KVKK retention 2 yıl, sonra full anonimleştirme job'ı çalışır. |
| TCKN değişti (cinsiyet değişikliği) | Person update edilir, `tckn_changed` lifecycle event, audit log; yeni Person açılmaz. |

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-05-15 | İlk iskelet | Modül planlama başlangıcı |
| 2026-05-26 | İlk kurallar tanımlandı | Eğitimci ihtiyaç analizi sonucu Person/Account/RoleAssignment ayrımı netleştirildi |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
