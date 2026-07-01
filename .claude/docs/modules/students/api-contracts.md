# Öğrenci — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, request/response şeması.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

---

## Endpoint Özeti

### Faz 1A + 1B-BE (Canlı) · FE bağlandı (Faz 1B FE, 2026-06-29) · Hesap+şifre (Faz 1B-BE, 2026-06-30)

| Method | Path | Permission | Amaç | FE Durumu |
|---|---|---|---|---|
| `POST` | `/api/v1/students:enroll` | `students.create` | Yeni öğrenci kaydı | ✅ FE bağlandı (Faz 1B) |
| `POST` | `/api/v1/students:transfer-in` | `students.create` | Nakil gelen öğrenci kaydı | ✅ FE bağlandı (Faz 1B) |
| `GET` | `/api/v1/students/check-national-id` | `students.create` | TC kimlik tekrar kontrolü (sihirbaz Adım 2) | ✅ FE bağlandı (Faz 1B) |
| `GET` | `/api/v1/branches/capacity` | `students.create` | Şube doluluk kontrolü (sihirbaz Adım 3) | ✅ FE bağlandı (Faz 1B) |
| `GET` | `/api/v1/guardians:search` | `students.create` | Mevcut veli arama (sihirzar Adım 4) | ✅ FE bağlandı (Faz 1B) |

### Faz 2A (Canlı, 2026-06-30) · FE bağlandı

| Method | Path | Permission | Amaç | FE Durumu |
|---|---|---|---|---|
| `GET` | `/api/v1/students` | `students.view` | Öğrenci listesi (enrollment-bazlı, sezon eksenli) | ✅ FE bağlandı (Faz 2A) |
| `GET` | `/api/v1/students/{id}` | `students.view-detail` | Öğrenci detayı | ✅ FE bağlandı (Faz 2A) |
| `GET` | `/api/v1/students/{id}/enrollments` | `students.view-detail` | Kayıt geçmişi | ✅ FE bağlandı (Faz 2A) |

### Faz 2B (Canlı, 2026-06-30) · FE bağlandı

| Method | Path | Permission | Amaç | FE Durumu |
|---|---|---|---|---|
| `POST` | `/api/v1/students/{id}:freeze` | `students.manage` | Kayıt dondurma | ✅ FE bağlandı (Faz 2B) |
| `POST` | `/api/v1/students/{id}:resume` | `students.manage` | Dondurulmuş kaydı devam ettirme | ✅ FE bağlandı (Faz 2B) |
| `POST` | `/api/v1/students/{id}:withdraw` | `students.manage` | Kayıt çekme (pasife al) | ✅ FE bağlandı (Faz 2B) |
| `POST` | `/api/v1/students/{id}:transfer-out` | `students.manage` | Nakil çıkışı | ✅ FE bağlandı (Faz 2B) |
| `POST` | `/api/v1/students/{id}:graduate` | `students.manage` | Öğrenci mezuniyeti | ✅ FE bağlandı (Faz 2B) |

### Faz 3A (Canlı, 2026-06-30) · Branch: `student-faz3a`

| Method | Path | Permission | Amaç | FE Durumu |
|---|---|---|---|---|
| `GET` | `/api/v1/enrollments/renewal-candidates` | `students.renew` | Yenileme adayları listesi + KPI niyet dağılımı | ✅ FE bağlandı (Faz 3A) |
| `POST` | `/api/v1/enrollments:set-intent` | `students.renew` | Toplu (veya tekil) yenileme niyeti setleme | ✅ FE bağlandı (Faz 3A) |

### Faz 3B (Canlı, 2026-07-01) · Branch: `student-faz3b`

| Method | Path | Permission | Amaç | FE Durumu |
|---|---|---|---|---|
| `POST` | `/api/v1/enrollments:renew` | `students.renew` | Renewing→taslak (`Type=Renewal, Status=Draft`) toplu köprü + `EnrollmentRenewedEvent` | ✅ FE bağlandı (Faz 3B, "Yenilemeyi Başlat") |

> `GET /api/v1/enrollments/renewal-candidates` Faz 3B'de yeni `classRoomId?` (uuid) query param'ı aldı — bkz. aşağıdaki güncellenmiş detay. `POST /api/v1/academic-sessions/{id}/open-renewal-period` (`season.renewal.open`) — academic-sessions modülüne ait, bkz. `academic-years/api-contracts.md`.

### Faz 3+ / Ertelenen (Henüz Yok)

| Method | Path | Permission | Amaç |
|---|---|---|---|
| `PUT` | `/api/v1/students/{id}` | `students.update` | Öğrenci güncelleme |
| `POST` | `/api/v1/students/{id}:archive` | `students.manage` | Terminal kayıt arşivleme (Debt — ertelendi) |
| `POST` | `/api/v1/students:import` | `students.import` | Toplu öğrenci aktarımı (Excel) |
| `POST` | `/api/v1/students/{id}/documents` | `students.update` | Belge yükleme |

---

## Detay — Faz 1A Endpoint'leri

### `POST /api/v1/students:enroll`

**Permission:** `students.create`

**Idempotency:** `X-Client-Request-Id: {uuid}` header zorunlu. Aynı `clientRequestId` ikinci kez gelirse saklanan sonuç döner (409 değil — replay sonucu 201 olarak döner).

**Request body:**
```json
{
  "clientRequestId": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Zeynep",
  "lastName": "Kaya",
  "nationalId": "12345678901",
  "birthDate": "2015-03-22",
  "gender": "Female",
  "classRoomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "enrollmentType": "New",
  "intent": "Okul tercih formu referansı: #2024-001",
  "guardians": [
    {
      "guardianType": "Mother",
      "firstName": "Fatma",
      "lastName": "Kaya",
      "phone": "+90 555 000 0001",
      "email": "fatma@example.com",
      "isPrimary": true,
      "invitationChannel": "Email"
    }
  ]
}
```

**Validation:**
- `clientRequestId` — required, uuid
- `firstName` / `lastName` — required, maks 100 karakter
- `nationalId` — **opsiyonel** (E2.4); TCKN ise 11 hane rakam, yabancı uyrukta serbest format; doluysa duplicate kontrolü (CheckNationalIdDuplicate). Boş bırakılabilir (yabancı uyruklu / kimliksiz başvuru).
- `nationalIdType` — opsiyonel; `Tckn` (varsayılan) | `Ykn` (yabancı uyruk) | `Passport`. FE "Yabancı uyruklu öğrenci" işaretliyse `Ykn` gönderir. BE tipe göre format zorlamaz (protector tip-agnostik).
- `birthDate` — required, ISO 8601 date; geçmişte olmalı
- `gender` — required; `Male | Female | Other`
- `classRoomId` — required; şube kapasitesi aşılırsa 409 `CAPACITY_EXCEEDED`
- `enrollmentType` — required; `New | TransferIn | Renewal`; `Renewal` için öğrenci önceki sezonda kayıtlı olmalı
- `guardians` — required, min 1; max 5; `isPrimary` tam olarak 1 kez `true`
- Guardian `email` veya `phone` — en az biri zorunlu; `invitationChannel=Email` → `email` zorunlu

**Response 201:**
```json
{
  "data": {
    "studentId": "...",
    "enrollmentId": "...",
    "studentNumber": "20250001",
    "temporaryPassword": "Xk7mQ3pR",
    "studentAccountCreated": true
  },
  "errors": null,
  "correlationId": "..."
}
```

> **`temporaryPassword` / `studentAccountCreated` notları (Faz 1B-BE, 2026-06-30):**
> - `temporaryPassword`: Geçici şifre plain-text yalnız bu yanıtta döner; plain hâli asla saklanmaz (hash'li tutulur). `null` olduğu durumlar:
>   - Küçük-kademe (Anaokulu/İlkokul) — E2.6 carve-out; Parent-only, hesap açılmaz.
>   - Replay (`clientRequestId` tekrar) — plain şifre kayıtlı olmadığından `null`; `studentAccountCreated` gerçek hesap varlığına bakılır.
> - `studentAccountCreated`: `true` → hesap bu istekte açıldı. Replay'de hesap zaten varsa `true`, küçük-kademede `false`.
> - Login: öğrenci numarası giriş yolu artık aktif — `identifier` alanına öğrenci numarası (1-9 hane rakam) + `SchoolHint` (okul ID'si) ile giriş yapılabilir. Bkz. identity `api-contracts.md` / `business-rules.md`.

**Errors:**
- `400` — validation hatası
- `403` — `students.create` izni yok
- `409 CAPACITY_EXCEEDED` — şube kapasitesi dolu (hard check)
- `409 ACTIVE_SESSION_MISSING` — okul için aktif sezon yok
- `409 NATIONAL_ID_DUPLICATE` — bu TC aktif sezonda zaten kayıtlı
- `422 IDEMPOTENCY_REPLAY` — `clientRequestId` tekrar, aynı başarı sonucu döner

**Domain Event:** `StudentEnrolledEvent` → Outbox → post-commit: veli daveti (Faz 1A). Öğrenci hesabı + geçici şifre: `StudentAccountProvisioner` transaction içinde çalışır (Faz 1B-BE, 2026-06-30); küçük-kademede atlanır (E2.6 carve-out).

---

### `POST /api/v1/students:transfer-in`

**Permission:** `students.create`

`students:enroll` ile aynı kontrat; tek farklar:
- `enrollmentType` zorunlu olarak `"TransferIn"` olmalı (body'de gönderilmese de override edilir)
- `previousSchool` — required, maks 200 karakter (önceki okul adı)

**Request body (ekstra alan):**
```json
{
  "...": "(...enroll ile aynı alanlar...)",
  "enrollmentType": "TransferIn",
  "previousSchool": "Ankara Özel Başarı İlkokulu"
}
```

**Response / Errors:** Aynı `students:enroll` ile.

---

### `GET /api/v1/students/check-national-id`

**Permission:** `students.create`

**Amaç:** Kayıt sihirbazı 1. adım — TC kimlik numarasının aktif sezonda başka öğrenciye ait olup olmadığını kontrol eder.

**Query params:**
- `nationalId` (required) — kimlik numarası (TCKN 11 hane veya yabancı kimlik/pasaport serbest format)
- `sessionId` (required) — kontrol edilecek akademik sezon ID'si

**Response 200:**
```json
{
  "data": {
    "isDuplicate": false,
    "existingStudentId": null
  },
  "errors": null,
  "correlationId": "..."
}
```

Eğer `isDuplicate: true` → `existingStudentId` dolu gelir (FE'ye bağlantı için).

---

### `GET /api/v1/branches/capacity`

**Permission:** `students.create`

**Amaç:** Kayıt sihirbazı şube seçimi — şubenin kapasitesi ve mevcut doluluk bilgisi.

**Query params:**
- `classRoomId` (required) — şube ID'si
- `sessionId` (required) — akademik sezon ID'si

**Response 200:**
```json
{
  "data": {
    "classRoomId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "5-A",
    "capacity": 30,
    "currentCount": 25,
    "availableSlots": 5,
    "hasCapacity": true
  },
  "errors": null,
  "correlationId": "..."
}
```

**Errors:**
- `404` — classRoomId bulunamadı veya bu okula ait değil

---

### `GET /api/v1/guardians:search`

**Permission:** `students.create`

**Amaç:** Kayıt sihirbazı veli adımı — sistemde mevcut velileri isim/telefon ile arar (kardeş bağlama akışı için).

**Query params:**
- `q` (required) — arama terimi, min 2 karakter (ad/soyad veya telefon)
- `page` (default 1)
- `pageSize` (default 20, max 50)

**Response 200:**
```json
{
  "data": [
    {
      "personId": "...",
      "firstName": "Fatma",
      "lastName": "Kaya",
      "phone": "+90 555 000 0001",
      "email": "fatma@example.com",
      "linkedStudentCount": 1
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 3, "totalPages": 1 },
  "errors": null,
  "correlationId": "..."
}
```

---

---

## Detay — Faz 2A Endpoint'leri

### `GET /api/v1/students`

**Permission:** `students.view`

**Amaç:** Enrollment-bazlı öğrenci listesi. Her satır seçili sezonun bir enrollment kaydına karşılık gelir; Durum = `StudentEnrollment.Status` (enrollment durumu).

**Query params:**

| Param | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `sessionId` | uuid | hayır | Akademik sezon ID'si; belirtilmezse aktif sezon varsayılır |
| `status` | string | hayır | `EnrollmentStatus` değeri: `Active \| Frozen \| Withdrawn \| TransferredOut \| Archived` |
| `gender` | string | hayır | `Male \| Female \| Other` |
| `gradeLevel` | int | hayır | Sınıf seviyesi (örn. 5) |
| `search` | string | hayır | Ad/soyad veya öğrenci numarası — min 2 karakter |
| `page` | int | hayır | Sayfa no (default 1) |
| `pageSize` | int | hayır | Sayfa boyutu (default 20, max 100) |

**Response 200 — `StudentListItemDto`:**
```json
{
  "data": [
    {
      "studentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "studentNumber": "20260001",
      "firstName": "Zeynep",
      "lastName": "Kaya",
      "gender": "Female",
      "birthDate": "2015-03-22",
      "enrollmentId": "...",
      "enrollmentStatus": "Active",
      "enrollmentType": "New",
      "gradeLevel": 5,
      "classRoomId": "...",
      "classRoomName": "5-A",
      "sessionId": "...",
      "sessionName": "2025-2026",
      "primaryGuardianName": "Fatma Kaya",
      "primaryGuardianPhone": "+90 555 000 0001"
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "totalItems": 142, "totalPages": 8 },
  "errors": null,
  "correlationId": "..."
}
```

> **Notlar:**
> - `enrollmentStatus`: `StudentEnrollment.Status.ToString()` — `EnrollmentStatus` enum string değeri (FE `ENROLLMENT_STATUS` map anahtarlarıyla birebir).
> - Sezon kaydı olmayan öğrenciler bu listeye dahil edilmez (o sezonda kayıt yok).
> - Eski `/users/persons*` list endpoint'i Users ekranı tarafından tüketilmeye devam eder; bu endpoint sadece öğrenci ekranı içindir.

**Errors:**
- `403` — `students.view` izni yok
- `404` — `sessionId` belirtilmiş ama okul için bulunamadı

---

### `GET /api/v1/students/{id}`

**Permission:** `students.view-detail`

**Amaç:** Tek öğrencinin kimlik + aktif sezon enrollment + velileri. TCKN / yabancı kimlik numarası plain-text olarak DÖNMEDİĞİNE dikkat et.

**Path params:**
- `{id}` — `StudentProfileId` (uuid)

**Response 200 — `StudentDetailDto`:**
```json
{
  "data": {
    "studentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "studentNumber": "20260001",
    "firstName": "Zeynep",
    "lastName": "Kaya",
    "gender": "Female",
    "birthDate": "2015-03-22",
    "hasNationalId": true,
    "nationalIdType": "Tckn",
    "currentEnrollment": {
      "enrollmentId": "...",
      "sessionId": "...",
      "sessionName": "2025-2026",
      "enrollmentStatus": "Active",
      "enrollmentType": "New",
      "gradeLevel": 5,
      "classRoomId": "...",
      "classRoomName": "5-A",
      "startDate": "2025-09-09",
      "endDate": null
    },
    "guardians": [
      {
        "personId": "...",
        "firstName": "Fatma",
        "lastName": "Kaya",
        "guardianType": "Mother",
        "phone": "+90 555 000 0001",
        "email": "fatma@example.com",
        "isPrimary": true
      }
    ]
  },
  "errors": null,
  "correlationId": "..."
}
```

> **Güvenlik notu:** `nationalId` (TCKN / yabancı kimlik) plain-text olarak hiçbir zaman response'a dahil edilmez. `hasNationalId: bool` + `nationalIdType: "Tckn" | "Ykn" | "Passport"` ile varlık/tip bilgisi verilir. `currentEnrollment` aktif sezondaki kayıt kaydıdır; öğrenci aktif sezonda kaydı yoksa `null` gelir.

**Errors:**
- `403` — `students.view-detail` izni yok
- `404` — öğrenci bulunamadı veya bu okula ait değil (cross-tenant)

---

### `GET /api/v1/students/{id}/enrollments`

**Permission:** `students.view-detail`

**Amaç:** Öğrencinin tüm sezonlardaki kayıt geçmişi, yeniden eskiye sıralı.

**Path params:**
- `{id}` — `StudentProfileId` (uuid)

**Response 200 — `EnrollmentHistoryItemDto[]`:**
```json
{
  "data": [
    {
      "enrollmentId": "...",
      "sessionId": "...",
      "sessionName": "2025-2026",
      "enrollmentStatus": "Active",
      "enrollmentType": "New",
      "gradeLevel": 5,
      "classRoomId": "...",
      "classRoomName": "5-A",
      "startDate": "2025-09-09",
      "endDate": null
    },
    {
      "enrollmentId": "...",
      "sessionId": "...",
      "sessionName": "2024-2025",
      "enrollmentStatus": "Archived",
      "enrollmentType": "New",
      "gradeLevel": 4,
      "classRoomId": "...",
      "classRoomName": "4-A",
      "startDate": "2024-09-09",
      "endDate": "2025-06-20"
    }
  ],
  "errors": null,
  "correlationId": "..."
}
```

> Sıralama: `startDate DESC` (en yeni sezon önce). `endDate: null` → aktif/devam eden kayıt.

**Errors:**
- `403` — `students.view-detail` izni yok
- `404` — öğrenci bulunamadı veya bu okula ait değil (cross-tenant)

---

## Detay — Faz 2B Endpoint'leri (Lifecycle Komutları)

Tüm lifecycle endpoint'leri için ortak kurallar:
- **Permission:** `students.manage`
- **Başarı:** `204 No Content`
- **Hata 403:** `students.manage` izni yok veya tenant claim eksik.
- **Hata 404:** Öğrenci bulunamadı veya cari (`IsCurrent`) sezon enrollment'ı yok.
- **Hata 409:** Geçersiz durum geçişi — `Error.Conflict("students.errors.invalid-lifecycle-transition")` (yanlış enrollment.Status veya yanlış Person.LifecycleState).

---

### `POST /api/v1/students/{id}:freeze`

**Amaç:** Aktif kaydı dondurur. Şube koltuğu KORUNUR (koltuk kalmaya devam eder).

**Path param:** `{id}` — `StudentProfileId` (uuid)

**Request body:**
```json
{ "reason": "Hastalık nedeniyle geçici devamsızlık" }
```
- `reason` — zorunlu, boş bırakılamaz.

**Durum geçişi:** `enrollment.Status` Active → Frozen · `Person.LifecycleState` Active → Suspended

**Response:** `204 No Content`

---

### `POST /api/v1/students/{id}:resume`

**Amaç:** Dondurulmuş kaydı yeniden etkinleştirir.

**Path param:** `{id}` — `StudentProfileId` (uuid)

**Request body:** yok (boş body veya `{}`)

**Durum geçişi:** `enrollment.Status` Frozen → Active · `Person.LifecycleState` Suspended → Active

**Response:** `204 No Content`

---

### `POST /api/v1/students/{id}:withdraw`

**Amaç:** Öğrenciyi çeker / pasife alır. Şube koltuğu KAPATILIR; `CurrentClassroomId` temizlenir; `IsActiveStudent=false`.

**Path param:** `{id}` — `StudentProfileId` (uuid)

**Request body:**
```json
{ "reason": "Aile kararıyla ayrılma" }
```
- `reason` — zorunlu, boş bırakılamaz.

**Durum geçişi:** `enrollment.Status` Active → Withdrawn · `Person.LifecycleState` Active → Suspended

**MVP kısıtı:** Frozen öğrenci doğrudan withdraw edilemez; önce `:resume` çağrılmalı.

**Response:** `204 No Content`

---

### `POST /api/v1/students/{id}:transfer-out`

**Amaç:** Öğrencinin nakil çıkışını kaydeder. Şube koltuğu KAPATILIR; `CurrentClassroomId` temizlenir.

**Path param:** `{id}` — `StudentProfileId` (uuid)

**Request body:**
```json
{
  "targetSchoolId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "reason": "Veli isteğiyle nakil"
}
```
- `targetSchoolId` — opsiyonel (`Guid?`); `null` = OKSİS dışı / harici okul nakli.
- `reason` — opsiyonel.

**Durum geçişi:** `enrollment.Status` Active → TransferredOut · `Person.LifecycleState` Active → Transferred

**MVP kısıtı:** Frozen öğrenci doğrudan transfer-out edilemez; önce `:resume` çağrılmalı.

**Response:** `204 No Content`

---

### `POST /api/v1/students/{id}:graduate`

**Amaç:** Öğrenciyi mezun eder. Şube koltuğu KAPATILIR; `CurrentClassroomId` temizlenir.

**Path param:** `{id}` — `StudentProfileId` (uuid)

**Request body:** yok (boş body veya `{}`)

**Durum geçişi:** `enrollment.Status` Active → Graduated · `Person.LifecycleState` Active → Graduated

**MVP kısıtı:** Frozen öğrenci doğrudan mezun edilemez; önce `:resume` çağrılmalı.

**Response:** `204 No Content`

---

## Detay — Faz 3A Endpoint'leri

### `GET /api/v1/enrollments/renewal-candidates`

**Permission:** `students.renew`

**Amaç:** Cari sezondaki `Status==Active` enrollment'ları yenileme adayı olarak döndürür. Yanıta KPI niyet dağılımı (tüm filtrelenmiş küme üzerinden) eklenir.

**Query params:**

| Param | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `sessionId` | uuid | hayır | Akademik sezon ID'si; belirtilmezse aktif sezon varsayılır |
| `gradeLevel` | int | hayır | Sınıf seviyesi (örn. 5) |
| `intent` | string | hayır | `Renewing \| Undecided \| Leaving` — filtre |
| `search` | string | hayır | Ad/soyad veya öğrenci numarası — min 2 karakter |
| `page` | int | hayır | Sayfa no (default 1) |
| `pageSize` | int | hayır | Sayfa boyutu (default 20) |
| `classRoomId` | uuid | hayır | **(Faz 3B)** Şube ID'si — sonuç + KPI dağılımı bu şubeye filtrelenir (FE sınıf-bazlı filtre, Faz 3A'daki `gradeLevel` fallback'inin yerini aldı) |

**Response 200 — `RenewalCandidatesResult`:**
```json
{
  "data": {
    "items": [
      {
        "enrollmentId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "studentPersonId": "...",
        "studentNumber": "20260001",
        "firstName": "Zeynep",
        "lastName": "Kaya",
        "gender": "Female",
        "gradeLevel": 5,
        "classRoomId": "...",
        "classRoomName": "5-A",
        "currentIntent": null
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 142,
    "renewingCount": 89,
    "undecidedCount": 41,
    "leavingCount": 12
  },
  "errors": null,
  "correlationId": "..."
}
```

> **KPI notları:**
> - `renewingCount`, `undecidedCount`, `leavingCount` — tüm filtrelenmiş küme üzerinden hesaplanır (sayfa değil). Yani `intent` filtresi uygulanmış olsa bile KPI tüm kümeyi sayar.
> - `currentIntent: null` = hiç işaretlenmemiş; `null` intent ≠ `Undecided` (açıkça kararsız). KPI sayılarında `null` intentli adaylar **hiçbir kategoriye dahil edilmez**.

**Errors:**
- `403` — `students.renew` izni yok
- `404` — explicit `sessionId` belirtilmiş ama bu okul için bulunamadı

---

### `POST /api/v1/enrollments:set-intent`

**Permission:** `students.renew`

**Amaç:** Seçili enrollment'lara toplu (veya tek-id ile tekil) yenileme niyeti set eder. Yalnız cari (aktif) sezon + `Status==Active` enrollment'lar güncellenir; bilinmeyen veya uygun olmayan id'ler **sessizce atlanır**.

**Request body:**
```json
{
  "enrollmentIds": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "..."
  ],
  "intent": "Renewing"
}
```

- `enrollmentIds` — required, min 1 eleman; `Guid[]`
- `intent` — required; `Renewing | Undecided | Leaving`

**Response 200:**
```json
{
  "data": {
    "updatedCount": 3
  },
  "errors": null,
  "correlationId": "..."
}
```

> **Atlanma kuralları:** Bilinmeyen id, başka okula ait id (cross-tenant), `Status!=Active` enrollment, cari olmayan sezon enrollment → sessizce atlanır. `updatedCount` gerçekten güncellenen sayıyı verir. Aktif sezon yoksa `updatedCount=0` döner (başarı — 200).

> **Tekil niyet:** Ayrı tekil `SetRenewalIntent` endpoint'i açılmadı; tek-elemanlı liste ile bu endpoint kullanılır (bkz. ⚠️ Spec Dışına Çıkılanlar D3).

**Errors:**
- `400` — `enrollmentIds` boş veya `intent` geçersiz
- `403` — `students.renew` izni yok

---

## Detay — Faz 3B Endpoint'leri

### `POST /api/v1/enrollments:renew`

**Permission:** `students.renew`

**Amaç:** Cari **aktif** sezonda `Status==Active` + `Intent==Renewing` olan kayıtlar için hedef (Setup) sezonda `Type=Renewal, Status=Draft, ClassRoomId=null` idari taslak açar (E6.2/E8) ve her taslak için `EnrollmentRenewedEvent` raise eder (veli bildirimi — sınıfsız, bkz. `domain-model.md` Domain Events).

**Request body:**
```json
{ "targetSessionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```
- `targetSessionId` — required, `Guid`; hedef sezon `Status==Setup` olmalı (değilse 409). Hedef sezonda `RenewalPeriodOpenedAt` ön-koşulu aranmaz — dönem bayrağı yalnız `PromoteStudents` gating'i içindir, `RenewEnrollment` kendi başına idempotent çalışır (bkz. `business-rules.md` BR-students-004).

**Response 200 — `RenewEnrollmentResult`:**
```json
{
  "data": { "created": 34, "skipped": 6 },
  "errors": null,
  "correlationId": "..."
}
```

> **Eleme (`skipped`):** (a) hedef sezonda öğrenci için zaten `Type=Renewal` kaydı varsa — idempotent, ikinci çağrı yeni taslak açmaz; (b) öğrencinin bir üst aktif sınıf seviyesi yoksa (terminal kademe — mezun olacak). `StudentNumber` değişmez (E4.4.2); `EnrollmentDate` = komutun çalıştığı gün (`clock.Today`).

**Errors:**
- `400` — `targetSessionId` boş
- `403` — `students.renew` izni yok veya tenant claim eksik
- `404` — cari aktif sezon yok veya `targetSessionId` bulunamadı
- `409` — hedef sezon `Setup` değil (`students.errors.renewal-target-not-setup`)

---

## Yasaklar

- ❌ Verb in URL (`/createStudent`) — custom method için `:verb` suffix veya HTTP method kullan.
- ❌ Snake_case path — kebab-case.
- ❌ Inconsistent envelope.
- ❌ `students.create` olmadan `check-national-id` / `branches/capacity` / `guardians:search` çağrısı.

> Detay: `backend/api-design-rules.md`.
