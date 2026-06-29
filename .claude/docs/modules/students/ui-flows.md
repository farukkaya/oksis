# Öğrenci — UI Flows

> Bu modülün frontend ekranları, kullanıcı akışları, state management.

> Genel UI/UX kuralları için bkz. `frontend/ui-ux-rules.md` ve `frontend/component-rules.md`.

---

## Ekranlar

### Liste — `/admin/students`

**Portal:** admin
**Permission:** `students.view`
**Component:** `StudentsPage`
**Konum:** `src/portals/admin/students/StudentsPage.tsx`

**State:**
- Server: `useStudentsQuery` (TanStack Query, tenant-scoped)
- Local: filter (search, gradeCode, hasGuardian), pagination (URL params)

**Aksiyonlar:**
- "Yeni Öğrenci" butonu → `EnrollStudentSheet` (sağ sheet/modal) — `modal.kind === "enroll"` tetikler
- Row click → öğrenci drawer (7 sekme: Genel, Veli, Devamsızlık, Notlar, Belgeler, Hesap, Geçmiş)
- Toplu seçim → Sınıf Ata · Sınıf Yükselt

**Edge Case'ler:**
- Boş liste → EmptyState component
- Hata → ErrorState + retry
- Loading → Skeleton (Spinner değil)

---

### Yeni Öğrenci Kayıt Sihirbazı — `EnrollStudentSheet`

**Faz 1B (2026-06-29) ile implement edildi.** Mevcut `EnrollStudentDialog` mock'u bu sihirbazla değiştirildi.

**Giriş noktası:** `/admin/students` → "Yeni Öğrenci" butonu → `EnrollStudentSheet` (sağ panel)

**İki mod:** `startMode="yeni"` (Yeni Kayıt) | `startMode="nakil"` (Nakil Gelen) — MVP'de "Yeni Öğrenci" butonu `startMode="yeni"` açar; mod Adım 1'de değiştirilebilir.

**Mimari:** `EnrollStudentSheet` (kabuk: stepper rail + adım router + footer; RHF `FormProvider`) + `WizardRail` (dikey stepper).

---

#### Adım 1 — Kayıt Türü (`StepType`)

Kullanıcı kayıt türünü seçer:
- **Yeni Kayıt** — okulda ilk kaydı
- **Nakil Gelen** — başka okuldan nakil

Geçerlilik: `type` seçili olmalı.

---

#### Adım 2 — Öğrenci Bilgileri (`StepStudent`)

| Alan | Zorunlu | Not |
|---|---|---|
| Ad | ✓ | |
| Soyad | ✓ | |
| TC Kimlik No | ✓ (opt.) | 11 hane; `GET /students/check-national-id` ile mükerrer kontrolü (debounced) |
| Doğum Tarihi | — | |
| Cinsiyet | — | K / E |
| Fotoğraf | — | Debt — upload ucu yok, local-only |

**TCKN mükerrer davranışı:** `isDuplicate: true` → "Mevcut kaydı aç" bağlantısı (drawer'a) + İleri butonu kapalı.

Geçerlilik: `ad` + `soyad` dolu; `tckn` varsa 11 hane ve mükerrer değil.

---

#### Adım 3 — Sınıf Yerleştirme (`StepPlacement`)

| Alan | Zorunlu | Not |
|---|---|---|
| Kademe (yıl) | ✓ | Classroom lookup'tan türetilir (aktif sezon kilitli) |
| Şube | ✓ | `GET /branches/capacity` ile doluluk; HARD: dolu şube disabled/seçilemez |
| Geldiği Okul | ✓ Nakilde | `previousSchool` — nakil modunda zorunlu |
| Kayıt Tarihi | — | `enrollmentDate` |

**Sezon:** Aktif akademik sezon `useSeasonStore`'dan otomatik alınır; Adım 3'te kilitli gösterilir.

**HARD kapasite kuralı (E11.4):** `availableSlots === 0` → şube kartı disabled; kullanıcı seçemez.

Geçerlilik: `cls` seçili; nakil modunda `prevSchool` dolu.

---

#### Adım 4 — Veli Bağla (`StepGuardians`)

| İşlem | Açıklama |
|---|---|
| Mevcut veli ara | `GET /guardians:search?query=` (debounced, min 2 karakter) — kardeş senaryosu |
| Yeni veli ekle | Ad, soyad, yakınlık, telefon, e-posta |
| Bayraklar (5) | Bilgi Görme · Karar Verme · Ödeme Sorumlusu · Teslim Alma · İletişim |
| Birincil veli | `IsPrimaryContact = true`; tam olarak 1 kez |

Geçerlilik: serbest (velisiz kayıt mümkün → özet & başarıda `HasGuardianWarning` rozeti).

---

#### Adım 5 — Özet & Onay (`StepSummary`)

Girilen tüm bilgilerin özet kartları:
- Öğrenci bilgileri (ad/soyad, TCKN, doğum, cinsiyet)
- Sınıf yerleştirme (sezon, kademe·şube — "5-A" formatı)
- Veli listesi + bayraklar; velisiz ise uyarı rozeti
- **Veli daveti kanalı:** `Invite` (E-posta / SMS / WhatsApp) — gerçek backend çağrısı (`result` sonrası onaylanır)

Geçerlilik: serbest.

---

#### Başarı Ekranı (`EnrollSuccess`)

Submit tetiklenince `POST /students:enroll` veya `POST /students:transfer-in` çağrılır (mod'a göre).

| Alan | Değer |
|---|---|
| Öğrenci No | Gerçek (`result.studentNumber`) — kopyalanabilir |
| Geçici Şifre | **Debt** — "D" rozeti + "Öğrenci hesabı Faz 1B-BE ile açılacak" notu; sahte değer basılmaz |
| Veli Daveti | Gerçek (`Invite`/`InviteChannel` backend'e gider) |

**Hata davranışı (submit):**
- `409 CAPACITY_EXCEEDED` → Adım 3'e dön + doluluk yenile + toast
- `409 NATIONAL_ID_DUPLICATE` → Adım 2'ye dön + dupe uyarısı
- `422 IDEMPOTENCY_REPLAY` → aynı `result` ile başarı ekranı (çift kayıt yok)
- Diğer → i18n hata toast; sihirbaz açık kalır (veri korunur)

---

## Kullanıcı Akışı — Yeni Öğrenci Kaydı

```
/admin/students
  └─ "Yeni Öğrenci" → EnrollStudentSheet açılır
       │
       ├─ Adım 1: Kayıt Türü seç (Yeni / Nakil)
       ├─ Adım 2: Öğrenci Bilgileri + TCKN mükerrer kontrolü
       ├─ Adım 3: Sınıf Yerleştirme (kademe → şube seç; dolu=disabled)
       ├─ Adım 4: Veli Bağla (mevcut ara / yeni + 5 bayrak)
       ├─ Adım 5: Özet & Onay + davet kanalı
       │
       └─ [Kaydet] → POST /students:enroll | :transfer-in
                         ↓
                   Başarı ekranı:
                   - Öğrenci No (gerçek)
                   - Şifre (Debt placeholder)
                   - Veli daveti onayı
                   - [Öğrenci Profilini Aç] | [Yeni Kayıt]
```

---

## Form State

- **RHF** tek `useForm<EnrollWizardForm>` + `FormProvider`; adımlar `useFormContext`.
- **Idempotency:** `ClientRequestId = crypto.randomUUID()` form mount'ta üretilir, submit'e taşınır.
- **Şema:** `enrollWizardSchema.ts` — `enrollWizardSchema` (tam), `stepSchemas[0..4]` (adım bazlı).

---

## Mobil Notları

- Kayıt sihirbazı yalnız admin web portalında. Mobile: {{TBD}}

---

## i18n Key'leri (Faz 1B)

`src/shared/i18n/locales/tr/students.json` → `enrollWizard.*` namespace:
`enrollWizard.steps.*`, `enrollWizard.fields.*`, `enrollWizard.errors.*`, `enrollWizard.capacity.*`, `enrollWizard.guardians.*`, `enrollWizard.summary.*`, `enrollWizard.success.*`, `enrollWizard.debt.*`.

Eski `enrollModal.*` anahtarları Faz 1B'de kaldırıldı.

---

## Yasaklar

- ❌ Spinner (Skeleton kullan).
- ❌ Hardcoded Türkçe string (i18n key zorunlu).
- ❌ Form'da Zod olmadan validation.
- ❌ `getByTestId` testlerde (Role + Text bazlı sorgular).
- ❌ Dolu şubeyi aktif gösterme (HARD kapasite — E11.4).

> Detay: `frontend/component-rules.md`, `frontend/form-validation-rules.md`.
