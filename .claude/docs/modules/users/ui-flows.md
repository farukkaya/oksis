# Kullanıcı Yönetimi — UI Flows

> Bu modülün frontend ekranları, kullanıcı akışları, state management.

> Genel UI/UX kuralları için bkz. `frontend/ui-ux-rules.md` ve `frontend/component-rules.md`.

> **Mevcut yapı:** Admin paneli mockData ile bitti. Bu doküman, **React Query'ye geçiş** sırasındaki ekran akışlarını ve henüz yapılmamış ekranları (davet detay, onboarding, KVKK, ilişki yönetimi) kapsar. Mevcut dosya iskeleti için bkz. `folder_skeleton.md`.

---

## Ekran Envanteri

| Portal | Route | Permission | Component | Durum |
|---|---|---|---|---|
| admin | `/admin/users` | `users.view` | `UserManagement` | ✅ mock hazır |
| admin | `/admin/users/:id` | `users.view-detail` | `UserDetailPage` | ⏳ planlanan |
| admin | `/admin/users/relationships` | `users.view-detail` | `RelationshipManagement` | ⏳ planlanan |
| admin | `/admin/invitations` | `users.invite` | `InvitationsPage` | ⏳ planlanan |
| admin | `/admin/invitations/batches/:batchId` | `users.invite` | `BatchDetailPage` | ⏳ planlanan |
| admin | `/admin/consents/bundles` | `consents.manage` | `ConsentBundleManagement` | ⏳ planlanan |
| public | `/invitation/accept?token=...` | Anonymous | `InvitationAcceptPage` | ⏳ planlanan |
| any | `/profile` | Authenticated | `MyProfilePage` | ⏳ planlanan |
| any | `/profile/consents` | Authenticated | `MyConsentsPage` | ⏳ planlanan |

---

## 1. Admin — Kullanıcı Yönetimi Ana Sayfası

**Route:** `/admin/users`
**Permission:** `users.view`
**Component:** `UserManagement` (coordinator)
**Konum:** `src/app/pages/admin/users/UserManagement.tsx`

### State

- **Server (TanStack Query):**
  - `usePersonsQuery(filters)` — list endpoint
  - `useStudentsQuery`, `useTeachersQuery`, `useParentsQuery` — sekme bazlı filtered queries
  - `useMetricsQuery()` — toplam sayılar (üst kartlar)
- **Local (`useUserManagementPage` hook):**
  - `activeTab: 'students' | 'teachers' | 'parents'`
  - `searchQuery`, `filterClassId`, `filterStatus`
  - `selectedRowIds: Set<string>`
  - `currentPage`, `pageSize`
  - `modalState: { add, edit, delete, changeBranch, import } – isOpen + payload`
- **URL params:** `?tab=students&page=1&search=...&status=active` (deep-link için)

### Aksiyonlar

- **Yeni Kullanıcı Ekle** → `AddUserModal` açılır (tip seçimi → koşullu form)
- **Excel ile İçe Aktar** → `ExcelImportModal` 4 adımlı wizard
- **Toplu Davet** → seçili kullanıcılar için tek seferde `POST /invitations/bulk`
- **Toplu Sil** → `DeleteUserDialog` (soft delete)
- **Row Click** → `/admin/users/:id` detay sayfası
- **Şube Değiştir** (öğrenci satır aksiyonu) → `ChangeBranchModal`

### Edge Case'ler

- Boş liste → `EmptyState` ("Henüz kullanıcı eklenmemiş, ilkini ekleyerek başlayın")
- Hata → `ErrorState` + "Tekrar dene" butonu
- Loading → Skeleton (Spinner **yasak**)
- Search < 2 karakter → debounce + uyarı (sorgu atılmaz)
- Permission yok → `403 Forbidden` sayfasına redirect

---

## 2. Admin — Kullanıcı Detay Sayfası (⏳ planlanan)

**Route:** `/admin/users/:id`
**Permission:** `users.view-detail`
**Component:** `UserDetailPage`

### Yapı

Sekmeli yapı (her sekme ayrı bileşen + ayrı query):

| Sekme | İçerik | Permission |
|---|---|---|
| **Genel Bilgiler** | Person + birincil profile bilgileri | `users.view-detail` |
| **Profiller** | Tüm bağlı profiller (öğretmen+veli aynı kişi senaryosu) | `users.view-detail` |
| **İlişkiler** | Bağlı veliler (öğrenci için) veya çocuklar (veli için) + yetki tipleri | `users.view-detail` |
| **Rol Atamaları** | Sezonlara göre rol geçmişi | `users.view-detail` |
| **Davet Geçmişi** | Bu kişiye atılan davetler | `users.invite` |
| **KVKK Onayları** | Onay versiyon geçmişi | `users.view-detail` |
| **Yaşam Döngüsü** | `AccountLifecycleEvent` timeline'ı | `users.view-detail` |
| **Audit** | Erişim ve değişiklik logları | `audit.view` |

### Aksiyonlar (üst toolbar)

- Profil Düzenle
- Davet Gönder / Yeniden Gönder
- Hesap Askıya Al / Aktive Et
- Mezun Et (sadece öğrenci, `LifecycleState = Active`)
- Nakil Çıkışı
- Arşivle (KVKK anonimleştirme — onay modal)

### State

- `usePersonDetailQuery(id)` — Person + profiles
- `usePersonRelationshipsQuery(id)`
- `usePersonRoleAssignmentsQuery(id)`
- `usePersonInvitationsQuery(id)`
- `usePersonConsentsQuery(id)`
- `usePersonLifecycleEventsQuery(id)`
- Mutations: `useUpdatePerson`, `useSuspendPerson`, `useGraduatePerson`, `useArchivePerson`

---

## 3. Admin — İlişki Yönetimi (⏳ planlanan)

**Route:** `/admin/users/relationships`
**Permission:** `users.view-detail`
**Component:** `RelationshipManagement`

### Akış

```
[Veli ara] → seç → [Veliye bağlı çocuklar tablosu]
                                │
                                ├── "Yeni İlişki Ekle" → ChildPickerModal
                                │       │
                                │       └── öğrenci ara/seç → RelationshipFormModal
                                │
                                ├── Row click → "İlişki Düzenle" (yetki flag'leri)
                                └── "İlişkiyi Sonlandır" → onay modal + reason
```

### `RelationshipFormModal` Alanları

- RelationType select (Anne, Baba, Vasi, Büyükebeveyn, Üvey, Diğer)
- 5 yetki flag'i (checkbox + tooltip):
  - **CanViewInfo** — Bilgileri görme
  - **CanMakeDecisions** — İzin/onay verebilme (gezi vb.)
  - **IsPaymentResponsible** — Fatura/dekont muhatabı
  - **CanPickup** — Okuldan teslim alabilir
  - **IsPrimaryContact** — Birincil iletişim
- ValidFrom date picker
- ValidUntil date picker (opsiyonel — mahkeme kararı ile bitiş tarihi)

### Validation (Zod)

```ts
const relationshipSchema = z.object({
  relationType: z.enum(['Mother','Father','Guardian','Grandparent','Stepparent','Sibling','Other']),
  canViewInfo: z.boolean(),
  canMakeDecisions: z.boolean(),
  isPaymentResponsible: z.boolean(),
  canPickup: z.boolean(),
  isPrimaryContact: z.boolean(),
  validFrom: z.date(),
  validUntil: z.date().optional(),
}).refine(d => !d.validUntil || d.validUntil >= d.validFrom, {
  message: "Bitiş tarihi başlangıçtan önce olamaz",
  path: ["validUntil"],
});
```

### Edge Case'ler

- Aynı (parent, student) zaten varsa: "Bu ilişki zaten mevcut, düzenlemek ister misiniz?" → mevcut ilişkinin modal'ı açılır
- Tek `IsPrimaryContact` velisi olan öğrencide o flag'i kaldırmaya çalışmak: uyarı + onay ("Başka bir velide bu flag'i etkinleştirmeden değiştiremezsiniz")

---

## 4. Admin — Davet Yönetimi (⏳ planlanan)

**Route:** `/admin/invitations`
**Permission:** `users.invite`
**Component:** `InvitationsPage`

### Liste Sekmeleri

- **Aktif** (`Created`, `Sent`, `Opened`)
- **Tamamlanmış** (`Accepted`)
- **Süresi Dolmuş** (`Expired`)
- **İptal Edilmiş** (`Revoked`)
- **Toplu Davetler** (batch grouping)

### Toplu Davet Akışı

```
[Aktif Sekme] → "Toplu Davet" butonu
                    │
                    ▼
          [TargetSelectionStep]
          ├── "Sezon başı tüm 9. sınıf velileri"
          ├── "Belirli sınıf seç" → ClassroomPicker
          └── "Excel yükle" → ExcelInviteWizard
                    │
                    ▼
          [RoleConfigStep]
          ├── Target rol (Parent/Teacher/Student)
          ├── Hedef sezon
          ├── KVKK paket versiyonu (otomatik = en güncel)
          └── Davet süresi (gün)
                    │
                    ▼
          [PreviewStep]
          - 28 kişi listelenir
          - Zaten aktif daveti olanlar uyarı ile gösterilir (override seçeneği)
          - Onay → "Daveti Başlat"
                    │
                    ▼
          [ResultStep]
          - "BatchId oluşturuldu, e-postalar kuyruğa alındı"
          - "İlerlemeyi görüntüle" → /admin/invitations/batches/:batchId
```

### Batch Detay Sayfası (`/admin/invitations/batches/:batchId`)

Tablo + metric:

- **Gönderildi:** 28 / 28
- **Açıldı:** 17
- **Kabul edildi:** 15
- **Süresi dolmak üzere:** 2 (24 saat kala)
- **Reddedildi:** 0

Aksiyonlar:
- **Hatırlatma Daveti Gönder** — sadece `Sent` veya `Opened` olanlara, expiry uzatma
- **Süresi Dolanları Yenile** — `Expired` olanlara yeni token

---

## 5. Public — Davet Kabul Sayfası (⏳ planlanan)

**Route:** `/invitation/accept?token=...`
**Permission:** Anonymous
**Component:** `InvitationAcceptPage`

### Akış (4 adım wizard)

```
[Step 1: Davet Doğrulama]
   GET /invitations/by-token/{token}
   ├── Token bulunamadı → "Davet bulunamadı veya süresi dolmuş"
   ├── Zaten kabul edilmiş → "Bu davet daha önce kabul edilmiş, giriş yapın"
   └── Geçerli → davet bilgisi (kim davet etti, hangi rol, hangi okul)
                    │
                    ▼
[Step 2: Profil Doğrulama]
   Ön-dolu form (Person'dan):
   - İsim, soyisim (read-only — yöneticinin girdiği)
   - TCKN (read-only, son 4 hane masked)
   - Doğum tarihi, telefon, email (düzenlenebilir)
                    │
                    ▼
[Step 3: KVKK Onayları]
   Aktif bundle versiyonu gösterilir.
   Onaylar listelenir:
   - [ ] Veri İşleme (ZORUNLU — onaylanmadan ileri geçilmez)
   - [ ] Fotoğraf Kullanımı (opsiyonel)
   - [ ] Pazarlama Mesajları (opsiyonel)
   - [ ] Sağlık Bilgisi Paylaşımı (opsiyonel)
   Aydınlatma metni indir + onay tarihi yazılı kanıt
                    │
                    ▼
[Step 4: Parola Belirleme]
   - Parola + tekrar
   - Parola politikası (canlı checklist)
   - "Daveti Kabul Et" → POST /invitations/accept
                    │
                    ▼
[Success]
   "Hesabınız oluşturuldu, giriş yapabilirsiniz" → /login redirect (3 sn)
```

### Edge Case'ler

- Token süresi dolmuş → 410 → yardımcı mesaj + "Yöneticinizle iletişime geçin" CTA
- KVKK `DataProcessing` kabul edilmedi → ileri butonu disabled, tooltip ile açıklama
- Parola politikası uymuyor → adım disabled, çekirdek kurallar görünür
- Aynı tarayıcıda 2. sekme aynı tokenla → "Bu davet işlemde, lütfen mevcut sekmeden devam edin"

---

## 6. Self — Profilim (⏳ planlanan)

**Route:** `/profile`
**Permission:** Authenticated (kendi bilgisi)
**Component:** `MyProfilePage`

### Düzenleyebileceği Alanlar (Rol bazlı)

| Alan | Teacher | Parent | Student | Staff |
|---|---|---|---|---|
| Profil fotoğrafı | ✅ | ✅ | ⚙ (yaş > 13) | ✅ |
| Email | ✅ | ✅ | ⚙ (yaş > 13) | ✅ |
| Telefon | ✅ | ✅ | ⚙ (yaş > 13) | ✅ |
| Adres | ✅ | ✅ | 🚫 | ✅ |
| Parola | ✅ | ✅ | ✅ | ✅ |
| 2FA | ✅ | ✅ | 🚫 | ✅ |
| Acil iletişim | ✅ | ✅ | ⚙ | ✅ |
| TCKN | 🚫 | 🚫 | 🚫 | 🚫 |
| Doğum tarihi | 🚫 (audit'li) | 🚫 (audit'li) | 🚫 | 🚫 |
| Rol/sezon bilgisi | 🚫 (read-only) | 🚫 | 🚫 | 🚫 |

> Yaşa göre `⚙` alanlar: 13 yaş altı öğrenciler için profil değişikliği veli onayına gider (gelecek feature).

---

## 7. Self — Onaylarım (⏳ planlanan)

**Route:** `/profile/consents`
**Permission:** Authenticated

### Yapı

Liste — her satır bir `ConsentType`:

| Onay | Durum | Versiyon | Tarih | Aksiyon |
|---|---|---|---|---|
| Veri İşleme | ✅ Aktif | v2026.05.01 | 2026-09-01 | Görüntüle |
| Fotoğraf Kullanımı | ✅ Aktif | v2026.05.01 | 2026-09-01 | Geri çek |
| Pazarlama | 🚫 Reddedildi | v2026.05.01 | 2026-09-01 | Aktive et |
| Sağlık Paylaşımı | ⏰ Yeni versiyon | v2026.10.15 | — | Onayla |

### Geri çekme akışı

```
"Geri çek" tıkla → modal:
   "Bu onayı geri çekerseniz şu özellikler kapanır:
    - Yıllık fotoğraf paylaşımı
    - Galeri görseli
   Devam etmek istiyor musunuz?"
   [İptal] [Geri Çek]
              │
              ▼
   POST /consents/{id}/revoke
   → Onay durumu güncellenir, downstream modüllere event gider
```

> `DataProcessing` geri çekme akışı **özel** — "Bu onayı çekmek hesabınızı askıya alacak. Tekrar onaylayana kadar OKSİS'e erişemeyeceksiniz" uyarısı ile.

---

## Kullanıcı Akışı (Genel)

```
[Admin: Yeni Kullanıcı Ekle]
        ↓
   form doldur → POST /persons → Person.LifecycleState = Draft
        ↓
[Admin: Davet Gönder]
        ↓
   POST /invitations → token üretilir, e-posta gider
        ↓
[Kullanıcı: linke tıklar]
        ↓
   GET /invitations/by-token → davet bilgisi gelir
        ↓
   Wizard: profil doğrula → KVKK onayla → parola belirle
        ↓
   POST /invitations/accept
        ↓
   Person.LifecycleState = Active
   Account üretilir (identity modülü)
   RoleAssignment oluşur
   ConsentRecord(lar) oluşur
        ↓
[Kullanıcı: ilk login]
```

---

## Form Validation (Genel Schema'lar)

### `AddPersonSchema`

```ts
const addPersonSchema = z.object({
  firstName: z.string().trim().min(2, "En az 2 karakter").max(100),
  lastName: z.string().trim().min(2).max(100),
  gender: z.enum(['Male','Female','Unspecified']),
  birthDate: z.date().max(new Date(), "Doğum tarihi gelecekte olamaz").optional(),
  nationalId: z.string().regex(/^\d{11}$/, "TCKN 11 haneli olmalı")
                .refine(isValidTckn, "Geçersiz TCKN").optional(),
  primaryEmail: z.string().email().optional(),
  primaryPhone: z.string().regex(/^\+90\d{10}$/, "Geçerli TR numarası girin").optional(),
});
```

### `InvitationAcceptSchema`

```ts
const acceptSchema = z.object({
  password: z.string()
    .min(10, "En az 10 karakter")
    .regex(/[A-Z]/, "Büyük harf gerekli")
    .regex(/[a-z]/, "Küçük harf gerekli")
    .regex(/\d/, "Rakam gerekli")
    .regex(/[^A-Za-z0-9]/, "Sembol gerekli"),
  passwordConfirm: z.string(),
  consents: z.object({
    dataProcessing: z.literal(true, { errorMap: () => ({ message: "Bu onay zorunludur" }) }),
    photoUsage: z.boolean(),
    marketing: z.boolean(),
    medicalSharing: z.boolean(),
  }),
}).refine(d => d.password === d.passwordConfirm, {
  message: "Parolalar eşleşmiyor",
  path: ["passwordConfirm"],
});
```

---

## Mobil Notları

Hedef cihaz veli portalı için kritik (anneler/babalar mobile heavy):

- **3-tap kuralı:** Davet kabul → KVKK onay → parola belirleme tek scroll'da olmamalı; her adım ayrı ekran.
- **Sticky action button:** "Daveti Kabul Et" mobil'de bottom-fixed.
- **Keyboard overlap:** `KeyboardAvoidingView` parola alanında zorunlu.
- **TCKN input:** numeric keyboard, autocomplete `off`.
- **OTP doğrulama:** SMS OTP autofill (`autoComplete="one-time-code"`).

---

## i18n Key'leri (TR)

| Key | TR |
|---|---|
| `users.title` | Kullanıcı Yönetimi |
| `users.empty` | Henüz kullanıcı eklenmemiş |
| `users.tabs.students` | Öğrenciler |
| `users.tabs.teachers` | Öğretmenler |
| `users.tabs.parents` | Veliler |
| `users.add` | Yeni Kullanıcı Ekle |
| `users.import` | Excel ile İçe Aktar |
| `users.bulkInvite` | Toplu Davet Gönder |
| `users.lifecycle.draft` | Taslak |
| `users.lifecycle.invited` | Davet Edildi |
| `users.lifecycle.active` | Aktif |
| `users.lifecycle.suspended` | Askıya Alındı |
| `users.lifecycle.graduated` | Mezun |
| `users.lifecycle.transferred` | Nakil |
| `users.lifecycle.archived` | Arşivlendi |
| `users.errors.required` | Bu alan zorunludur |
| `users.errors.tckn` | Geçerli TCKN giriniz |
| `users.errors.email` | Geçerli e-posta giriniz |
| `users.errors.duplicateTckn` | Bu TCKN sistemde mevcut |
| `invitations.title` | Davetler |
| `invitations.accept.title` | Daveti Kabul Et |
| `invitations.accept.consent.required` | Bu onay zorunludur, devam etmek için onaylayın |
| `invitations.accept.password.policy` | Parolanız en az 10 karakter, büyük/küçük harf, rakam ve sembol içermeli |
| `consents.dataProcessing` | Veri İşleme |
| `consents.photoUsage` | Fotoğraf Kullanımı |
| `consents.marketing` | Pazarlama Mesajları |
| `consents.medicalSharing` | Sağlık Bilgisi Paylaşımı |
| `consents.revoke.warning` | Bu onayı geri çekerseniz... |
| `relationships.relation.mother` | Anne |
| `relationships.relation.father` | Baba |
| `relationships.relation.guardian` | Vasi |
| `relationships.flag.viewInfo` | Bilgileri görebilir |
| `relationships.flag.makeDecisions` | Karar verebilir (izin, onay) |
| `relationships.flag.paymentResponsible` | Ödeme sorumlusu |
| `relationships.flag.pickup` | Okuldan teslim alabilir |
| `relationships.flag.primaryContact` | Birincil iletişim |

---

## Yasaklar

- ❌ Spinner (Skeleton kullan).
- ❌ Hardcoded Türkçe string (i18n key zorunlu).
- ❌ Form'da Zod olmadan validation.
- ❌ `getByTestId` testlerde (Role + Text bazlı sorgular).
- ❌ Parola alanını URL/log'a yazmak.
- ❌ TCKN'i tam olarak göstermek (`*******1234` formatı zorunlu, "Göster" tıklanırsa audit + reveal).
- ❌ Davet token'ı sayfa state'inde tutmak — POST body'de bir kez gönderilir, sonrası store'a yazılmaz.

> Detay: `frontend/component-rules.md`, `frontend/form-validation-rules.md`.
