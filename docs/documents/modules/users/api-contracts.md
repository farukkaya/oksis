# Kullanıcı Yönetimi — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, request/response şeması.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

> **Envelope standardı:**
> ```json
> { "data": {...}, "meta": {...}, "errors": null, "correlationId": "..." }
> ```

---

## Endpoint Özeti

### Person & Profile

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/users/persons` | `users.view` | Liste (filtreli) |
| GET | `/api/v1/users/persons/{id}` | `users.view-detail` | Detay |
| POST | `/api/v1/users/persons` | `users.create` | Person oluştur (Draft) |
| PUT | `/api/v1/users/persons/{id}` | `users.update` | Person güncelle |
| DELETE | `/api/v1/users/persons/{id}` | `users.delete` | Soft delete |
| POST | `/api/v1/users/persons/{id}/profiles` | `users.update` | Profile ekle |
| PUT | `/api/v1/users/persons/{id}/profiles/{profileType}` | `users.update` | Profile güncelle |
| POST | `/api/v1/users/persons/{id}/suspend` | `users.suspend` | Hesap askıya al |
| POST | `/api/v1/users/persons/{id}/reactivate` | `users.suspend` | Askıdan al |
| POST | `/api/v1/users/persons/{id}/graduate` | `users.graduate` | Mezun et (öğrenci) |
| POST | `/api/v1/users/persons/{id}/transfer` | `users.transfer` | Nakil çıkışı |
| POST | `/api/v1/users/persons/{id}/archive` | `users.archive` | Anonimleştir |

### Excel Import

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/users/imports/template?type={Student\|Teacher\|Parent}` | `users.import` | Şablon indir |
| POST | `/api/v1/users/imports/preview` | `users.import` | Önizleme + validation (multipart) |
| POST | `/api/v1/users/imports` | `users.import` | Import işini başlat (Hangfire) |
| GET | `/api/v1/users/imports/{importId}` | `users.import` | İş durumu sorgula |

### Parent-Student Relationship

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/users/students/{studentId}/parents` | `users.view-detail` | Öğrencinin velileri |
| GET | `/api/v1/users/parents/{parentId}/students` | `users.view-detail` | Velinin çocukları |
| POST | `/api/v1/users/relationships` | `users.update` | İlişki kur |
| PUT | `/api/v1/users/relationships/{id}` | `users.update` | Yetkileri güncelle |
| DELETE | `/api/v1/users/relationships/{id}` | `users.update` | İlişkiyi sonlandır |

### Role Assignment

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/users/persons/{personId}/role-assignments` | `users.view-detail` | Kişinin rol atamaları |
| POST | `/api/v1/users/role-assignments` | `roles.assign` | Yeni atama |
| POST | `/api/v1/users/role-assignments/{id}/revoke` | `roles.assign` | İptal |

### Invitation

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/users/invitations` | `users.invite` | Liste |
| POST | `/api/v1/users/invitations` | `users.invite` | Tekil davet |
| POST | `/api/v1/users/invitations/bulk` | `users.invite` | Toplu davet (Excel) |
| POST | `/api/v1/users/invitations/{id}/resend` | `users.invite` | Yeniden gönder (yeni token) |
| POST | `/api/v1/users/invitations/{id}/revoke` | `users.revoke-invite` | İptal |
| GET | `/api/v1/users/invitations/by-token/{token}` | `Anonymous` | Davet sayfası ön-fetch |
| POST | `/api/v1/users/invitations/accept` | `Anonymous` | Davet kabul |

### Consent (KVKK)

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/users/persons/{id}/consents` | `users.view-detail` | Kişinin onayları |
| POST | `/api/v1/users/consents` | `Authenticated` (self) | Onay ver/güncelle |
| POST | `/api/v1/users/consents/{id}/revoke` | `Authenticated` (self) | Onay geri çek |
| GET | `/api/v1/users/consent-bundles/current` | `Anonymous` | Aktif KVKK paketi |

### Self

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/users/me` | `Authenticated` | Profilim |
| PUT | `/api/v1/users/me` | `Authenticated` | Profil güncelle (kısıtlı alanlar) |

---

## Detay — Person & Profile

### `GET /api/v1/users/persons`

**Permission:** `users.view`

**Query params:**

| Param | Tip | Default | Açıklama |
|---|---|---|---|
| `page` | int | 1 | |
| `pageSize` | int | 50 | Max 100 |
| `search` | string | — | Min 2 karakter (ad/soyad/öğrenci no/email) |
| `profileType` | enum | — | `Student`, `Teacher`, `Parent`, `Staff` |
| `lifecycleState` | enum | — | Aşağıdaki state'lerden biri |
| `seasonId` | guid | aktif | Sezon filtresi (RoleAssignment.SeasonId üzerinden) |
| `sortBy` | string | `lastName` | `firstName`, `lastName`, `createdAt` |
| `sortDirection` | enum | `asc` | `asc`, `desc` |

**Response 200:**

```json
{
  "data": [
    {
      "id": "...",
      "firstName": "Ayşe",
      "lastName": "Yılmaz",
      "primaryEmail": "ayse@example.com",
      "primaryPhone": "+905...",
      "lifecycleState": "Active",
      "profileTypes": ["Student"],
      "currentRoles": ["STUDENT"],
      "createdAt": "2026-05-26T10:00:00+03:00"
    }
  ],
  "meta": { "page": 1, "pageSize": 50, "totalItems": 152, "totalPages": 4 },
  "errors": null,
  "correlationId": "..."
}
```

**Errors:**
- 400 — geçersiz query
- 403 — permission yok

---

### `POST /api/v1/users/persons`

**Permission:** `users.create`

**Request body:**

```json
{
  "firstName": "Ali",
  "lastName": "Demir",
  "gender": "Male",
  "birthDate": "2010-03-15",
  "nationalId": "12345678901",
  "primaryEmail": "ali@example.com",
  "primaryPhone": "+905551234567",
  "profile": {
    "type": "Student",
    "studentNumber": "2026-9A-014",
    "enrolledAt": "2026-09-01",
    "emergencyContact": {
      "fullName": "Ayşe Demir",
      "relation": "Mother",
      "phoneNumber": "+905552345678"
    }
  }
}
```

**Validation (FluentValidation):**
- `firstName` — required, 2–100 char, sadece harf + boşluk + tire + apostrof
- `lastName` — required, 2–100 char, aynı kurallar
- `gender` — required, enum
- `birthDate` — nullable, > 1900-01-01, <= today
- `nationalId` — nullable, TCKN algoritması (11 hane + checksum)
- `primaryEmail` — nullable, RFC 5322
- `primaryPhone` — nullable, E.164 + TR prefix
- `profile.type` — required, enum
- `profile.studentNumber` — required if Student, unique per school
- `profile.enrolledAt` — required if Student, <= today

**Response 201:**

```json
{
  "data": {
    "id": "...",
    "lifecycleState": "Draft"
  }
}
```

**Errors:**
- 400 — validation
- 403 — permission yok
- 409 — duplicate (national_id_hash veya student_number çakışması)

**Domain Event:** `PersonCreatedEvent`, `ProfileAttachedEvent` (bkz. `notifications.md`)

---

### `POST /api/v1/users/persons/{id}/suspend`

**Permission:** `users.suspend`

**Request body:**

```json
{ "reason": "Veli talebi üzerine geçici askı" }
```

**Response 200:**

```json
{ "data": { "id": "...", "lifecycleState": "Suspended" } }
```

**Errors:**
- 400 — geçersiz state geçişi (örn. `Archived` → `Suspended` denenmesi)
- 403, 404

**Domain Event:** `PersonSuspendedEvent`

---

## Detay — Excel Import

### `POST /api/v1/users/imports/preview`

**Permission:** `users.import`

**Request:** `multipart/form-data`
- `file` — `.xlsx` (max 10 MB, max 5000 satır)
- `profileType` — `Student` | `Teacher` | `Parent`
- `columnMappings` — JSON sütun eşleme

**Response 200:**

```json
{
  "data": {
    "totalRows": 156,
    "validRows": 148,
    "invalidRows": [
      {
        "rowIndex": 12,
        "errors": [
          { "field": "nationalId", "message": "Geçersiz TCKN" }
        ],
        "values": { "firstName": "...", "lastName": "..." }
      }
    ],
    "duplicates": [
      { "rowIndex": 33, "conflictField": "studentNumber", "existingPersonId": "..." }
    ]
  }
}
```

**Errors:**
- 400 — dosya formatı / satır sayısı / mapping geçersiz
- 413 — dosya çok büyük

> Preview **DB'ye yazmaz**, sadece in-memory validate eder.

---

### `POST /api/v1/users/imports`

**Permission:** `users.import`

**Request body:**

```json
{
  "previewToken": "...",
  "profileType": "Student",
  "skipInvalid": true,
  "sendInvitations": false
}
```

> `previewToken` önceki preview çağrısından döner; Redis'te 15 dakika cache'lenmiş validated row set'i temsil eder.

**Response 202 (Accepted):**

```json
{
  "data": { "importId": "...", "status": "Queued" }
}
```

**Domain Event:** `BulkImportStartedEvent` → Hangfire job tetikler.

---

### `GET /api/v1/users/imports/{importId}`

**Permission:** `users.import`

**Response 200:**

```json
{
  "data": {
    "importId": "...",
    "status": "Running",
    "totalRows": 148,
    "processedRows": 87,
    "succeeded": 85,
    "failed": 2,
    "startedAt": "...",
    "completedAt": null,
    "errors": [
      { "rowIndex": 45, "personId": null, "error": "Email duplicate" }
    ]
  }
}
```

---

## Detay — Parent-Student Relationship

### `POST /api/v1/users/relationships`

**Permission:** `users.update`

**Request body:**

```json
{
  "parentPersonId": "...",
  "studentPersonId": "...",
  "relationType": "Mother",
  "canViewInfo": true,
  "canMakeDecisions": true,
  "isPaymentResponsible": true,
  "canPickup": true,
  "isPrimaryContact": true,
  "validFrom": "2026-09-01",
  "validUntil": null
}
```

**Validation:**
- `parentPersonId` != `studentPersonId`
- `parentPersonId` Person'ın `ParentProfile`'ı olmalı (yoksa 409)
- `studentPersonId` Person'ın `StudentProfile`'ı olmalı (yoksa 409)
- Aynı (parent, student) çifti aktifse 409
- `validUntil >= validFrom`

**Response 201:**

```json
{ "data": { "id": "..." } }
```

**Domain Event:** `ParentStudentLinkedEvent`

---

## Detay — Invitation

### `POST /api/v1/users/invitations`

**Permission:** `users.invite`

**Request body:**

```json
{
  "personId": "...",
  "targetSystemRoleId": "...",
  "seasonId": "...",
  "channel": "Email",
  "expiresInDays": 7,
  "consentBundleVersion": "v2026.05.01"
}
```

**Validation:**
- `personId` — `LifecycleState ∈ {Draft, Invited, Suspended}` olmalı (Active/Archived olamaz)
- `targetSystemRoleId` — geçerli `SystemRole`
- `seasonId` — aktif veya gelecek sezon
- `expiresInDays` — 1–30
- Aynı `personId + seasonId` için aktif davet **yoksa** yeni davet açılır (varsa 409)

**Response 201:**

```json
{
  "data": {
    "id": "...",
    "status": "Created",
    "expiresAt": "2026-06-02T..."
  }
}
```

> Plain token **response'a dahil edilmez**; sadece notification pipeline'a gider.

**Domain Event:** `UserInvitedEvent` (içinde plain token vardır, notification pipeline yetkisindedir; log'a yazılmaz).

---

### `POST /api/v1/users/invitations/bulk`

**Permission:** `users.invite`

**Request body:**

```json
{
  "personIds": ["...", "...", "..."],
  "targetSystemRoleId": "...",
  "seasonId": "...",
  "channel": "Email",
  "expiresInDays": 7,
  "consentBundleVersion": "v2026.05.01"
}
```

**Response 202:**

```json
{
  "data": { "batchId": "...", "totalQueued": 28 }
}
```

> Max 500 person per bulk request. Daha fazla için ayrı batch.

---

### `POST /api/v1/users/invitations/accept`

**Permission:** `Anonymous` (token üzerinden auth)

**Request body:**

```json
{
  "token": "raw-token-from-link",
  "password": "...",
  "confirmedData": {
    "firstName": "...",
    "lastName": "...",
    "birthDate": "...",
    "phoneNumber": "..."
  },
  "consentGrants": [
    { "consentType": "DataProcessing", "granted": true },
    { "consentType": "Marketing", "granted": false }
  ]
}
```

**Validation:**
- `token` hash'i DB'de bulunmalı, `status ∈ {Sent, Opened}`, `expires_at > now`
- `password` — parola politikasına uyumlu (min 10 char, 1 büyük, 1 küçük, 1 rakam, 1 sembol)
- `consentGrants` — `DataProcessing` zorunlu `true` (yoksa hesap açılamaz)

**Response 200:**

```json
{
  "data": {
    "personId": "...",
    "accountId": "...",
    "redirectUrl": "/login"
  }
}
```

**Errors:**
- 400 — validation, KVKK zorunlu onay yok
- 410 — davet süresi dolmuş
- 404 — token bulunamadı
- 409 — davet zaten kabul edilmiş

**Domain Event'ler:** `InvitationAcceptedEvent`, `ConsentGrantedEvent` (her grant için), `PersonActivatedEvent`

---

### `POST /api/v1/users/invitations/{id}/resend`

**Permission:** `users.invite`

**Request body:**

```json
{ "channel": "Both", "newExpiresInDays": 7 }
```

> Eski token revoke edilir, yeni token üretilir. `RetryCount++`.

---

## Detay — Consent (KVKK)

### `POST /api/v1/users/consents/{id}/revoke`

**Permission:** `Authenticated` (kişi sadece kendi onayını veya parent ise çocuğunun onayını geri çekebilir)

**Request body:**

```json
{ "reason": "Pazarlama mesajlarını istemiyorum" }
```

**Response 200:**

```json
{ "data": { "id": "...", "status": "Revoked", "revokedAt": "..." } }
```

**Domain Event:** `ConsentRevokedEvent` → downstream modüllere "bu kişinin bu veri türüne erişim kapatılsın" sinyali

> Önemli: Onay geri çekilse de **hesap silinmez** — sadece o veri türüne erişim kapanır. Hesap silme ayrı bir akıştır (`archive`).

---

## Detay — Self

### `GET /api/v1/users/me`

**Permission:** `Authenticated`

**Response 200:**

```json
{
  "data": {
    "personId": "...",
    "accountId": "...",
    "firstName": "...",
    "lastName": "...",
    "primaryEmail": "...",
    "lifecycleState": "Active",
    "profiles": [
      { "type": "Teacher", "branch": "Matematik", "employeeNumber": "..." }
    ],
    "currentRoles": ["TEACHER"],
    "currentSeasonId": "...",
    "consents": [
      { "type": "DataProcessing", "status": "Granted", "version": "v2026.05.01" }
    ]
  }
}
```

---

## Hata Kodları (Domain-Spesifik)

| Code | HTTP | Anlam |
|---|---|---|
| `USERS_PERSON_DUPLICATE_NATIONAL_ID` | 409 | Aynı okulda TCKN tekrar |
| `USERS_PROFILE_TYPE_REQUIRED` | 400 | Aktif Person için profile yok |
| `USERS_INVITATION_ACTIVE_EXISTS` | 409 | Aynı kişi+sezon için aktif davet var |
| `USERS_INVITATION_EXPIRED` | 410 | Davet süresi geçmiş |
| `USERS_INVITATION_TOKEN_INVALID` | 404 | Token bulunamadı |
| `USERS_INVITATION_ALREADY_ACCEPTED` | 409 | Davet kabul edilmiş |
| `USERS_CONSENT_DATA_PROCESSING_REQUIRED` | 400 | KVKK zorunlu onay yok |
| `USERS_RELATION_SELF` | 400 | Parent ve Student aynı kişi |
| `USERS_RELATION_DUPLICATE` | 409 | Aynı veli-öğrenci ilişkisi mevcut |
| `USERS_LIFECYCLE_INVALID_TRANSITION` | 400 | State machine ihlali |

---

## Yasaklar

- ❌ Verb in URL (`/createUser`, `/inviteUser`) — sub-resource veya HTTP method kullan.
- ❌ snake_case path — kebab-case zorunlu.
- ❌ Inconsistent envelope — `data/meta/errors/correlationId` zorunlu.
- ❌ Token plain text response/log — sadece hash DB'de, plain sadece notification pipeline'da.
- ❌ TCKN'i query param olarak almak — POST body veya hash arama.
- ❌ `DELETE /persons/{id}` hard delete — sadece soft delete (`archive` ile anonimleştirilir).

> Detay: `backend/api-design-rules.md`.
