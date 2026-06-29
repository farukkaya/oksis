# Öğrenci Kayıt — Faz 1B (Frontend) Tasarım Dokümanı

> **Tür:** Uygulama tasarımı (design doc) · **Faz:** 1B — Frontend · **Tarih:** 2026-06-29
> **Bağlayıcı üst spec:** `.claude/specs/ogrenci-kayit-enrollment-spec.md` (E-maddeleri)
> **Önceki faz:** `.claude/specs/ogrenci-kayit-faz1-backend-plan.md` (Faz 1A — BİTTİ)
> **Repo:** `oksis-web` · **Modül:** `src/portals/admin/students`

---

## 1. Amaç & Kapsam

Faz 1A'da açılan kayıt uçlarını, teslim alınan **5-adımlı sihirbaz** tasarımına (handoff
`enroll_wizard.jsx`) bağlamak. Mevcut tek-adımlı `EnrollStudentDialog` mock+Debt formu, gerçek
uca bağlı `EnrollStudentSheet` sihirbazıyla **değiştirilir**.

**Kapsamdaki ekranlar:**
- 5 adımlı sihirbaz: (1) Kayıt Türü → (2) Öğrenci Bilgileri → (3) Sınıf Yerleştirme →
  (4) Veli → (5) Özet & Onay → **Başarı ekranı**.
- İki mod: **Yeni Kayıt** ve **Nakil Gelen** (`startMode`; tasarımdaki `type` alanı).

**Bağlanacak gerçek uçlar (Faz 1A):**
| Adım | Uç | Amaç |
|---|---|---|
| 2 | `GET /api/v1/students/check-national-id?nationalId=&idType=` | TCKN mükerrer kontrolü |
| 3 | `GET /api/v1/branches/capacity?academicSessionId=&gradeLevelId=` | Şube doluluk + HARD kapasite |
| 4 | `GET /api/v1/guardians:search?query=` | Mevcut veli ara (kardeş senaryosu) |
| 5 (submit) | `POST /api/v1/students:enroll` \| `POST /api/v1/students:transfer-in` | Kayıt |

## 2. Kapsam dışı (Non-goals)

- **`reenroll.jsx` (Kayıt Yenileme)** → Faz 3 (P5). Bu fazda yapılmaz.
- **AssignClass / Promote / Edit** debt'leri → Faz 2/3. Bu fazda **enroll debt'i dışındaki**
  borçlara dokunulmaz; "D" rozetiyle kalırlar.
- **Liste/detay/yaşam döngüsü** (`/users/persons` uçları) → zaten gerçek, dokunulmaz.

## 3. Bağlayıcı karar — Başarı ekranı kimlik kutusu (E2.6/E2.7)

Backend (`EnrollStudentResult`) yalnız `StudentNumber` döndürür; **öğrenci hesabı + geçici şifre
Faz 1B-BE'ye ertelendi**. Tasarımdaki "Giriş Kimlik Bilgileri · geçici şifre" kutusu şu an
backend'siz.

**Karar (kullanıcı onayı 2026-06-29):** Kutu **Debt olarak** korunur (frontend-first-debt) —
ancak **uydurma şifre gösterilmez**:
- **Öğrenci No** → gerçek (`result.studentNumber`), kopyalanabilir.
- **Geçici şifre satırı** → değer yerine **"D" rozeti** + "Öğrenci hesabı Faz 1B-BE ile açılacak"
  notu; disabled görünür. Sahte `Atlas-xxxx` değeri **basılmaz**.
- "Identity öğrenci hesabını açtı" metni → "Öğrenci hesabı yakında (BE bekleniyor)" Debt notuna
  dönüşür.
- **Veli daveti** satırı (`f.invite`) → gerçek (`Invite`/`InviteChannel` backend'e gider,
  `result` sonrası onaylanır).

## 4. Mimari & Dosya yapısı

Referans desen: `src/portals/admin/academic-sessions` sihirbazı (Zod + RHF + adım bileşenleri +
queryKeys + mutation invalidation).

```
src/portals/admin/students/
  components/enroll/
    EnrollStudentSheet.tsx        # kabuk: stepper rail + adım router + footer; RHF FormProvider
    WizardRail.tsx                # dikey stepper (tasarım StepperRail)
    steps/
      StepType.tsx                # Adım 1 — Yeni/Nakil kartları
      StepStudent.tsx             # Adım 2 — ad/soyad/tckn(+dupe)/doğum/cinsiyet/foto
      StepPlacement.tsx           # Adım 3 — kademe/şube(kapasite)/geldiği okul/tarih
      StepGuardians.tsx           # Adım 4 — veli ara/ekle + bayraklar
      StepSummary.tsx             # Adım 5 — özet kartları + davet kanalı
      EnrollSuccess.tsx           # Başarı ekranı (öğrenci no gerçek + şifre Debt)
    parts/
      PhotoUpload.tsx             # foto alanı (Debt — upload ucu yok → opsiyonel, local only)
      CapacityGrid.tsx            # şube doluluk kartları (HARD: dolu=disabled)
      GuardianPicker.tsx          # arama/yeni + bayrak listesi
      IdentityBox.tsx             # kimlik kutusu (şifre satırı Debt)
  schemas/
    enrollWizardSchema.ts         # Zod — 5 adım, superRefine adım-bazlı + toEnrollCommand()
  api/
    studentsApi.ts                # +enroll/transferIn/checkNationalId/branchCapacity/searchGuardians
  hooks/
    useEnrollStudentMutation.ts   # POST enroll|transfer-in + invalidate list/stats
    useCheckNationalIdQuery.ts    # debounced TCKN dupe
    useBranchCapacityQuery.ts     # kademe seçilince doluluk
    useGuardianSearchQuery.ts     # debounced veli arama
  keys/studentKeys.ts             # +checkNationalId/branchCapacity/guardianSearch anahtarları
```

`StudentsPage.tsx`: `modal.kind === "enroll"` tetiği korunur; `EnrollStudentDialog` yerine
`EnrollStudentSheet` render edilir. `startMode` için satır/aksiyon eklenebilir (Yeni vs Nakil) —
MVP'de "Yeni Öğrenci" butonu `startMode="yeni"`, ileride Nakil ayrı tetik (şimdilik Adım 1'de
seçilir).

## 5. Form state & submit eşleşmesi

- **RHF** tek `useForm<EnrollWizardForm>` + `FormProvider`; adımlar `useFormContext`.
- **Sezon:** `AcademicSessionId` = aktif sezon (`useSeasonStore`); Adım 3'te kilitli gösterilir.
- **Idempotency:** `ClientRequestId = crypto.randomUUID()` form mount'ta üretilir, submit'e taşınır
  (E5.2 — replay koruması).
- **`toEnrollCommand(form)`** → `EnrollStudentCommand` (PascalCase):

| Sihirbaz alanı | Command alanı | Not |
|---|---|---|
| `ad` / `soyad` | `FirstName` / `LastName` | |
| `tckn` | `NationalId` (+ `NationalIdType=TCKN`) | 11 hane |
| `cins` (K/E) | `Gender` | enum map |
| `dogum` | `BirthDate` (DateOnly?) | `gg.aa.yyyy` parse, ops. |
| `type` (yeni/nakil) | `Type` (New/TransferIn) | route'u da belirler |
| `prevSchool` | `PreviousSchool` | nakilde zorunlu |
| (aktif sezon) | `AcademicSessionId` | store'dan |
| `kademe`→gradeLevel | `GradeLevel` | int |
| `cls`→classroomId | `ClassRoomId` | seçilen şube |
| `kayitTarihi` | `EnrollmentDate` | DateOnly |
| `guardians[]` | `Guardians[]` → `GuardianInput` | bkz. aşağı |
| `invite` / `channel` | `Invite` / `InviteChannel` | |
| `gNew.email` | `Email` | veli/öğrenci e-posta |

**Gerçek lookup (tasarımdaki sabit diziler kaldırılır):** Tasarımın `W_CLASSES`/`W_KADEME`/
`W_CAP`/`W_GUARDIAN_POOL` sabitleri yalnız mock'tur. Gerçekte:
- Kademe + şube listesi aktif sezonun classroom lookup'ından gelir (`StudentsPage` zaten
  `classOptions` türetiyor — yeniden kullanılır; kademe→şube gruplaması buradan).
- **`GradeLevel` (int)** seçilen şubenin kademe seviyesinden türetilir; **`branches/capacity`**
  ucunun `gradeLevelId` (Guid?) parametresi ise kademe **kayıt id**'sidir. Şube→gradeLevel(int)
  ve şube→gradeLevelId(Guid) eşleşmesi classroom lookup alanlarından kurulur (uygulama planında
  netleşir). Doluluk değerleri `branchCapacity` ucundan; tasarımın `W_CAP`'ı kullanılmaz.
- Veli arama `guardians:search` ucundan; `W_GUARDIAN_POOL` kullanılmaz.

**Guardian eşleşmesi (tam):** `ExistingPersonId` (havuzdan seçilen) **veya** ad/soyad/rel/phone/email
(yeni); bayraklar: `bilgi→CanViewInfo`, `karar→CanMakeDecisions`, `odeme→IsPaymentResponsible`,
`teslim→CanPickup`, `iletisim→IsPrimaryContact`; `primary→IsPrimaryContact`. (Not: tasarımda
"iletisim" bayrağı ile "Birincil veli mi?" ikisi de `IsPrimaryContact`'a düşer — birincil veli
seçimi `IsPrimaryContact=true` olarak gönderilir, "iletisim" bayrağı UI'da kalır.)

## 6. Adım geçerliliği (tasarım `stepValid` ile bire bir)

- **Adım 1:** `type` seçili.
- **Adım 2:** `ad` + `soyad` dolu, `tckn` 11 hane **ve** mükerrer değil (`check-national-id`
  sonucu). Mükerrerse "Mevcut kaydı aç" yönlendirmesi (drawer'a) + İleri kapalı.
- **Adım 3:** `cls` seçili; nakilde `prevSchool` dolu. Dolu şube **disabled** (HARD — E11.4).
- **Adım 4–5:** serbest (velisiz kayıt mümkün → özet & başarıda "veli eksik" uyarı rozeti,
  `HasGuardianWarning`).

## 7. Hata yönetimi (submit)

- **409 / idempotency replay** → aynı `result` ile başarı ekranı (çift kayıt yok).
- **422 kapasite dolu** (yarış/TOCTOU) → Adım 3'e dön + şube doluluk yenile + toast.
- **TCKN mükerrer** (submit anında) → Adım 2'ye dön + dupe uyarısı.
- Diğer → i18n hata toast; sihirbaz açık kalır (girilen veri kaybolmaz).

## 8. i18n

`src/shared/i18n/locales/tr/students.json` → `enrollWizard.*` (steps, fields, errors, capacity,
guardians, summary, success, debt). Hardcode Türkçe **yok**. Mevcut `enrollModal.*` anahtarları
sihirbaz tamamlanınca temizlenir (eski dialog kaldırılınca).

## 9. Test (vitest — mevcut `__tests__` deseni)

- Şema: adım-bazlı doğrulama (zorunlu alanlar, nakil→prevSchool, tckn 11 hane).
- Adım kapısı: geçersizken İleri kapalı; mükerrer TCKN İleri'yi kapatır.
- Kapasite: dolu şube disabled; HARD seçilemez.
- Veli: ara→seç→bayrak→ekle / kaldır; velisiz → uyarı rozeti.
- Submit payload: `toEnrollCommand` doğru PascalCase + Type yeni/nakil ayrımı + ClientRequestId.
- Başarı: öğrenci no gerçek görünür; şifre satırı **Debt** (değer basılmaz); davet onayı.
- Mock kalkışı: enroll artık gerçek uca gider (debt fallback enroll için kaldırılır); DebtBadge
  enroll submit'ten kalkar.

## 10. Tamamlanınca (docs)

- `modules/students/{ui-flows,api-contracts,completion_status}.md` güncellenir.
- `completion_status.md` → "⚠️ Spec Dışına Çıkılanlar"a şifre-kutusu-Debt notu (E2.6/E2.7).
- Eski `EnrollStudentDialog` + `enrollModal.*` i18n kaldırılır.
