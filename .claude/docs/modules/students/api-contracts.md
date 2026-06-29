# Öğrenci — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, request/response şeması.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

---

## Endpoint Özeti

### Faz 1A (Canlı — oksis-api `student-enrollment` dalı)

| Method | Path | Permission | Amaç |
|---|---|---|---|
| `POST` | `/api/v1/students:enroll` | `students.create` | Yeni öğrenci kaydı |
| `POST` | `/api/v1/students:transfer-in` | `students.create` | Nakil gelen öğrenci kaydı |
| `GET` | `/api/v1/students/check-national-id` | `students.create` | TC kimlik tekrar kontrolü (wizard adım 1) |
| `GET` | `/api/v1/branches/capacity` | `students.create` | Şube doluluk kontrolü (wizard adım 2) |
| `GET` | `/api/v1/guardians:search` | `students.create` | Mevcut veli arama (wizard veli sekmesi) |

### Faz 2+ (Henüz Yok)

| Method | Path | Permission | Amaç |
|---|---|---|---|
| `GET` | `/api/v1/students` | `students.view` | Öğrenci listesi (sezon eksenli) |
| `GET` | `/api/v1/students/{id}` | `students.view-detail` | Öğrenci detayı |
| `GET` | `/api/v1/students/{id}/enrollment-history` | `students.view-detail` | Kayıt geçmişi |
| `PUT` | `/api/v1/students/{id}` | `students.update` | Öğrenci güncelleme |
| `POST` | `/api/v1/students/{id}:freeze` | `students.manage` | Kayıt dondurma |
| `POST` | `/api/v1/students/{id}:withdraw` | `students.manage` | Kayıt çekme/ayrılma |
| `POST` | `/api/v1/students/{id}:transfer-out` | `students.manage` | Nakil çıkışı |
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
- `nationalId` — required, 11 hane rakam; duplicate kontrolü (CheckNationalIdDuplicate)
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
    "studentNumber": "20250001"
  },
  "errors": null,
  "correlationId": "..."
}
```

**Errors:**
- `400` — validation hatası
- `403` — `students.create` izni yok
- `409 CAPACITY_EXCEEDED` — şube kapasitesi dolu (hard check)
- `409 ACTIVE_SESSION_MISSING` — okul için aktif sezon yok
- `409 NATIONAL_ID_DUPLICATE` — bu TC aktif sezonda zaten kayıtlı
- `422 IDEMPOTENCY_REPLAY` — `clientRequestId` tekrar, aynı başarı sonucu döner

**Domain Event:** `StudentEnrolledEvent` → Outbox → post-commit: veli daveti (Faz 1A). Öğrenci hesabı + geçici şifre oluşturma Faz 1B'de eklenecek.

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
- `nationalId` (required) — 11 hane TC kimlik numarası
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

## Yasaklar

- ❌ Verb in URL (`/createStudent`) — custom method için `:verb` suffix veya HTTP method kullan.
- ❌ Snake_case path — kebab-case.
- ❌ Inconsistent envelope.
- ❌ `students.create` olmadan `check-national-id` / `branches/capacity` / `guardians:search` çağrısı.

> Detay: `backend/api-design-rules.md`.
