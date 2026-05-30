# Kullanıcı Yönetimi (Users)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.

---

## Amaç

Kullanıcı Yönetimi modülü, OKSİS'te bir okul ekosistemine ait **kişilerin (Person)** kayıt altına alınmasını, **profil bazında** (öğrenci, öğretmen, veli, idari personel) zenginleştirilmesini, aralarındaki **ilişkilerin** (veli–öğrenci, kardeş, vasi) tanımlanmasını, **sezona bağlı rol atamalarının** yürütülmesini, **davet iş akışının** uçtan uca işletilmesini ve **KVKK kapsamında onay/rıza yönetiminin** versiyonlanmasını sağlar.

**Sorduğu temel soru:** "Bu okul ekosistemindeki kişiler kim, hangi sezonda hangi rolle var, birbirleriyle hangi yetkide ilişkili ve sisteme nasıl dahil olacaklar?"

**Çözmediği şey:**
- Login, JWT üretimi, refresh token rotasyonu, parola doğrulama → `identity` modülü
- Permission/Role tanımları (master), policy değerlendirme motoru → `identity` modülü
- Sınıf/şube tanımları (sadece **referans** alır) → `classrooms` modülü
- Sezon tanımı (sadece **referans** alır) → `seasons` modülü
- Ödeme/borç yönetimi → `billing` modülü

> Kısa kural: Bir kişinin **kim olduğu** Users'ta, **nasıl giriş yaptığı** Identity'de.

---

## Paydaşlar / Roller

| Rol | Kullanım Şekli |
|---|---|
| **SchoolAdmin** | Kişi ekler, profil düzenler, sezon başında toplu davet gönderir, hesap askıya alır/aktive eder, KVKK aydınlatma metni versiyonlarını yayınlar, ilişkileri (veli–öğrenci) yönetir. |
| **SchoolStaff** | Sekreter/koordinatör: davet gönderebilir, profil bilgisini günceller, ancak rol/yetki değiştiremez ve silemez. |
| **Teacher** | Kendi atandığı sınıflardaki öğrencileri ve velilerini **okuma** amaçlı görür. Kendi profilini düzenler. |
| **Parent** | Kendi profilini ve bağlı olduğu öğrencilerin (yetki tipine göre) profilini görür. Onay/rıza geri çekebilir. |
| **Student** | Kendi profilini görür. Yaşa göre kısıtlı düzenleme. |
| **Accountant** | Profil bilgisini sadece muhasebe alanlarıyla sınırlı görür (kontrat tipi, ödeme sorumlusu veli vb.). |
| **SuperAdmin** | Cross-tenant denetim ve hesap kurtarma. |

> Tam yetki matrisi için bkz. `permissions.md` (bu klasörde) ve `permission-matrix.md` (proje kökü).

---

## Akış Özeti

Modülün ana akışı, **kişinin yaşam döngüsü** etrafında kuruludur:

1. **Tanım** — SchoolAdmin yeni bir `Person` kaydı oluşturur (manuel veya Excel import).
2. **Profil** — Person'a kullanım amacına göre bir veya daha fazla profil eklenir (StudentProfile / TeacherProfile / ParentProfile / StaffProfile).
3. **İlişkilendirme** — Veli ↔ Öğrenci, vasi ↔ öğrenci, kardeş ilişkileri tanımlanır; her ilişki bir yetki tipi taşır (info-only / decision / payment).
4. **Davet** — `Invitation` aggregate oluşturulur, KVKK paketi + ön-dolu profil + tek kullanımlık token üretilir, e-posta/SMS ile gönderilir.
5. **Onboarding** — Davet alıcısı linke tıklar, KVKK onayını verir, eksik bilgileri tamamlar; `identity` modülünde bir `Account` üretilir, parola belirlenir.
6. **Aktivasyon** — `Account` aktifleşir, sezona bağlı `RoleAssignment` oluşturulur.
7. **Yaşam Döngüsü** — Sezon sonu mezuniyet/nakil/sınıf-tekrarı/askıya-alma olayları işlenir, profil arşivlenir, KVKK retention politikası uygulanır.

> Detaylı UI akışları için bkz. `ui-flows.md`.
> Domain event → bildirim akışı için bkz. `notifications.md`.

---

## İlişkili Modüller

| Modül | İlişki |
|---|---|
| `identity` | Users, davet kabulü sonrası `Account` üretimi için `identity`'yi çağırır. Authorization sırasında `RoleAssignment` → `SystemRole` eşlemesi `identity`'den okunur. |
| `seasons` | `RoleAssignment.SeasonId` ve `Invitation.SeasonId` zorunlu — sezon ID'si Users içinde **sadece referans** olarak tutulur, sezon yaşam döngüsü `seasons` modülünün sorumluluğundadır. |
| `classrooms` | Öğretmen-sınıf, öğrenci-sınıf atamaları `classrooms` modülünde tutulur; Users sadece `Person` ve `Profile` katmanını sağlar. |
| `notifications` | `UserInvitedEvent`, `InvitationAcceptedEvent`, `RoleAssignmentChangedEvent`, `ConsentRevokedEvent` gibi domain event'ler `notifications` modülüne gönderilir. |
| `billing` | `ParentStudentRelationship.IsPaymentResponsible = true` olan veli, billing modülünün fatura/dekont muhatabıdır. |
| `audit` | Tüm yaşam döngüsü olayları audit log'a structured olarak yazılır. |

> Örnek event akışı: `SchoolAdmin` toplu davet gönderir → Users `UserInvitedEvent` üretir → `notifications` e-posta/SMS gönderir → `Invitation.Status = Sent` olur.

---

## Mevcut Durum

- Hangi sprint'te? → **Sprint 3** (planlanan). Sprint 1 ve 2 önkoşul: domain modeli refactor + authorization motoru (`identity` modülünde).
- MVP scope'unda mı? → **Evet.** Davet iş akışı + KVKK + ilişki yönetimi olmadan platform açılamaz.
- Hangi parçaları yapıldı / kaldı?
  - ✅ Frontend mockData ile admin paneli ekranları (Öğrenci/Öğretmen/Veli sekmeleri, Excel import sihirbazı, modal'lar) — bkz. `folder_skeleton.md`
  - ⏳ Backend `Person` aggregate ve profil entity'leri
  - ⏳ `ParentStudentRelationship` many-to-many + yetki tipi
  - ⏳ `RoleAssignment` sezona bağlı
  - ⏳ `Invitation` aggregate + state machine (`Created → Sent → Opened → Accepted/Expired/Revoked`)
  - ⏳ `ConsentRecord` versiyonlama
  - ⏳ Account lifecycle state machine entegrasyonu
  - ⏳ Excel import server-side validation + Hangfire job
  - ⏳ Frontend `mockData` → React Query bağlantısı

> Açık sorular için bkz. `open-questions.md`.

---

## Metadata

- **Slug:** users
- **Status:** in-progress (API ISSUE-01–10 + Web ISSUE-11–15 + Mobile ISSUE-16 commit'li; mobil davet-kabul identity revizyonuna ertelendi)
- **Sprint:** Sprint 3
- **Owner:** {{TBD}}
- **Created:** 2026-05-15
- **Last Updated:** 2026-05-31
- **Files:**
  - [x] README.md
  - [x] domain-model.md
  - [x] api-contracts.md
  - [x] database-schema.md
  - [x] permissions.md
  - [x] notifications.md
  - [x] ui-flows.md
  - [x] business-rules.md
  - [x] open-questions.md
  - [x] completion_status.md
  - [x] folder_skeleton.md (frontend mevcut yapı)
