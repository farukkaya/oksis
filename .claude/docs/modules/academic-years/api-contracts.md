# Akademik Sezon — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, request/response şeması.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

---

## Endpoint Özeti

### AcademicSession (Sezon)

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/academic-sessions` | `academic-sessions.view` | Liste (aktif + arşiv) |
| GET | `/api/v1/academic-sessions/{id}` | `academic-sessions.view-detail` | Detay |
| GET | `/api/v1/academic-sessions/current` | `academic-sessions.view-current` | Aktif sezon (cache'li) ⭐ |
| POST | `/api/v1/academic-sessions` | `academic-sessions.create` | Yeni sezon (Setup) |
| PUT | `/api/v1/academic-sessions/{id}` | `academic-sessions.update` | Sezon güncelle (sadece Setup) |
| POST | `/api/v1/academic-sessions/{id}/activate` | `academic-sessions.activate` | Sezonu aktive et |
| POST | `/api/v1/academic-sessions/{id}/archive` | `academic-sessions.archive` | Sezonu arşivle (manuel) |

### Sezon Rollover (Sihirbaz) — yeni (2026-06-09)

> Sezon Yönetimi 6 adımlı sihirbazının backend orkestrasyonu. Tasarım: `docs/superpowers/specs/2026-06-08-sezon-rollover-design.md`. İki fazlı: "Sezonu Aç" (yapı materyalizasyonu, Setup sezon) → "Aktifleştir" (orkestratör: aktivasyon + öğrenci terfisi §4.9 + görevlendirme kopyası §5.9).

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/season-drafts/current` | `academic-sessions.create` ⚠️ | Sihirbaz taslağını oku (tenant başına 1) |
| PUT | `/api/v1/season-drafts/current` | `academic-sessions.create` ⚠️ | Taslağı upsert ("Taslağı Kaydet") |
| DELETE | `/api/v1/season-drafts/current` | `academic-sessions.create` ⚠️ | Taslağı sil (Vazgeç) |
| GET | `/api/v1/academic-sessions/{sourceId}/rollover-preview` | `academic-sessions.create` ⚠️ | Terfi haritası önizleme (salt-okunur) |
| POST | `/api/v1/academic-sessions/open-from-draft` | `academic-sessions.create` | Sezonu Aç → Setup sezon + dönemler + boş şubeler |
| POST | `/api/v1/academic-sessions/{id}/activate-rollover` | `academic-sessions.activate` | Aktifleştir → aktivasyon + terfi + görevlendirme kopyası (tek transaction) |
| POST | `/api/v1/academic-sessions/{id}/promote-students` | `students.promote` | §4.9 bağımsız (re-run); building-block |
| POST | `/api/v1/academic-sessions/{id}/copy-assignments?sourceSessionId=` | `teaching-assignments.assign` | §5.9 bağımsız (re-run); building-block |

> ⚠️ **İzin sapması (onaylı):** Tasarımda `academic-sessions.manage` öngörülmüştü ama seed'de yok; taslak/önizleme uçları mevcut `academic-sessions.create` ile gate edildi. `students.promote` yeni eklendi (seed+migration). `teachers.assign` yerine mevcut `teaching-assignments.assign` kullanıldı. Bkz. `completion_status.md` → Spec Dışına Çıkılanlar.

#### `rollover-preview` yanıt özeti (`summary`)

`GET .../rollover-preview` yanıtı `{ rows, summary }` döndürür. `summary` alanları:

| Alan | Tip | Açıklama |
|---|---|---|
| `promotedBranches` | `int` | Terfi eden (bir üst kademeye çıkan) şube sayısı |
| `graduatingStudents` | `int` | Terminal kademede mezun olan öğrenci sayısı |
| `newBottomBranches` | `int` | Giriş kademesi için açılan boş yeni şube sayısı |
| `passiveStudents` | `int` | **(2026-06-10)** Kaynak sezonda aktif-kayıtlı (`LeftAt==null`) ama `Person.LifecycleState != Active` olan öğrenci sayısı. `PromoteStudents` `ExcludePassive` skip tanımıyla birebir; önizleme her zaman sayar (gerçek rollover yalnız `ExcludePassive` bayrağında atlar). Sihirbaz Step 5 "pasif öğrencileri hariç tut" sayısını bundan okur. |

### AcademicTerm (Dönem)

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/academic-sessions/{sessionId}/terms` | `academic-sessions.view` | Sezonun dönemleri |
| POST | `/api/v1/academic-sessions/{sessionId}/terms/{termId}/activate` | `academic-sessions.activate-term` | Dönemi aktive et |
| POST | `/api/v1/academic-sessions/{sessionId}/terms/{termId}/close` | `academic-sessions.close-term` | Dönemi kapat ⚠️ |

### ClassRoom (Şube)

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/class-rooms` | `class-rooms.view` | Liste (aktif sezon default) |
| GET | `/api/v1/class-rooms/{id}` | `class-rooms.view-detail` | Detay + öğrenci listesi |
| POST | `/api/v1/class-rooms` | `class-rooms.create` | Yeni şube |
| PUT | `/api/v1/class-rooms/{id}` | `class-rooms.update` | Şube güncelle |
| POST | `/api/v1/class-rooms/{id}/approve` | `class-rooms.approve` | Onay bekleyen şubeyi onayla (BR-AS-008) |
| POST | `/api/v1/class-rooms/{id}/archive` | `class-rooms.archive` | Şube arşivle |
| POST | `/api/v1/class-rooms/{id}/students` | `class-rooms.assign-student` | Öğrenci ata |
| POST | `/api/v1/class-rooms/{id}/students/{studentId}/transfer` | `class-rooms.transfer-student` | Öğrenciyi başka şubeye taşı |
| DELETE | `/api/v1/class-rooms/{id}/students/{studentId}` | `class-rooms.remove-student` | Öğrenciyi şubeden çıkar (atama kapatır) |

### School Holiday (Tatil)

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/school-holidays` | `school-holidays.view` | Aktif sezonun tatilleri |
| POST | `/api/v1/school-holidays` | `school-holidays.create` | Tatil ekle |
| PUT | `/api/v1/school-holidays/{id}` | `school-holidays.update` | Tatil düzenle |
| DELETE | `/api/v1/school-holidays/{id}` | `school-holidays.delete` | Tatil sil |

### Resmi Tatil — Tarih Aralığı (Sihirbaz Önizleme) — yeni (2026-06-10)

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/official-holidays?start=YYYY-MM-DD&end=YYYY-MM-DD` | `school-holidays.view` | Verilen tarih aralığındaki ulusal resmi tatiller (`HolidayCalendarDto[]`, hepsi `source="OFFICIAL"`) |

---

### `GET /api/v1/official-holidays` — Resmi Tatil Tarih Aralığı

**Permission:** `school-holidays.view`

**Query parametreleri:**

| Parametre | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `start` | `DateOnly` (`YYYY-MM-DD`) | ✓ | Aralık başlangıcı |
| `end` | `DateOnly` (`YYYY-MM-DD`) | ✓ | Aralık bitişi |

**Amaç:** Henüz var olmayan yeni sezon için (sihirbaz Adım 2'de girilen `sessionStart`/`sessionEnd` tarihleriyle), o döneme düşen ulusal resmi tatillerin önizlemesini verir. `sessionId` gerektirmez; master `official_holidays` kataloğu üzerinde çalışır.

**Response 200:**
```json
{
  "data": [
    { "id": null, "name": "29 Ekim Cumhuriyet Bayramı", "startDate": "2026-10-29", "endDate": "2026-10-29", "type": "PublicHoliday", "isRecurring": true, "source": "OFFICIAL" },
    { "id": null, "name": "23 Nisan Ulusal Egemenlik", "startDate": "2027-04-23", "endDate": "2027-04-23", "type": "PublicHoliday", "isRecurring": true, "source": "OFFICIAL" }
  ],
  "errors": null
}
```

Tüm öğeler `source = "OFFICIAL"` ve `startDate` artan sırada döner.

**Errors:**
- 400 / `academic-sessions.errors.invalid-range` — `start > end` ise.
- 403 — izin yok.

**Notlar:**
- Gösterim-only (persist yok); sihirbaz Tatiller adımı bu endpoint'i kullanarak resmi tatilleri listeler.
- `OfficialHolidayResolver` saf helper (DB-bağımsız) ile hesaplanır; artık yıl gibi geçersiz tarihler sessizce atlanır.

---

## Detay — Kritik Endpoint'ler

### ⭐ `GET /api/v1/academic-sessions/current`

**Permission:** `academic-sessions.view-current` (genellikle her authenticated rol için açık)

**Önbellek:** Redis, tenant başına. Key: `oksis:tenant:{schoolId}:current-session`. TTL: 1 saat. Cache invalidation: `AcademicSessionActivatedEvent`, `AcademicTermActivatedEvent`, `AcademicTermClosedEvent`.

**Çağrı sıklığı:** Çok yüksek. Tüm modüller (yoklama, not, ödev) önce bu endpoint'i çağırır.

**Response 200:**
```json
{
  "data": {
    "id": "01ARZ3...",
    "name": "2025-2026",
    "startDate": "2025-09-15",
    "endDate": "2026-06-13",
    "status": "Active",
    "isCurrent": true,
    "currentTerm": {
      "id": "01ARZ4...",
      "termType": { "id": "...", "code": "T1", "name": "1. Dönem" },
      "startDate": "2025-09-15",
      "endDate": "2026-01-23",
      "status": "Active"
    },
    "terms": [
      { "id": "...", "termType": { "code": "T1", "name": "1. Dönem" }, "status": "Active", "startDate": "2025-09-15", "endDate": "2026-01-23" },
      { "id": "...", "termType": { "code": "T2", "name": "2. Dönem" }, "status": "NotStarted", "startDate": "2026-02-10", "endDate": "2026-06-13" }
    ],
    "activeStudentCount": 1248
  },
  "errors": null,
  "correlationId": "..."
}
```

**Response 404:** Henüz aktif sezon yoksa (`{ "errors": [{ "code": "NO_ACTIVE_SESSION" }] }`). Frontend onboarding wizard'a yönlendirir.

**Yeni alan (2026-06-09):**

| Alan | Tip | Açıklama |
|---|---|---|
| `activeStudentCount` | `int` | Aktif sezondaki şubelerde `LeftAt == null` olan distinct öğrenci sayısı (ayrılanlar/mezunlar hariç) |

---

### `GET /api/v1/academic-sessions` — Liste Yanıt Alanları

Her `AcademicSessionDto` öğesi için:

| Alan | Tip | Açıklama |
|---|---|---|
| `id` | `string` | Sezon UUID |
| `name` | `string` | Sezon adı (örn. "2024-2025") |
| `startDate` | `DateOnly` | Sezon başlangıcı |
| `endDate` | `DateOnly` | Sezon bitişi |
| `status` | `string` | `Setup` / `Active` / `Archived` |
| `isCurrent` | `bool` | Aktif mi |
| `activatedAt` | `DateTimeOffset?` | Aktivasyon zamanı |
| `archivedAt` | `DateTimeOffset?` | Arşivleme zamanı |
| `studentCount` | `int` | Sezona kayıtlı distinct öğrenci (ayrılanlar dahil) — 2026-06-09 |
| `graduateCount` | `int` | `Reason == Graduation` ile kapatılmış distinct atama sayısı — 2026-06-09 |

---

### `POST /api/v1/academic-sessions`

**Permission:** `academic-sessions.create`

**Request body:**
```json
{
  "name": "2025-2026",
  "startDate": "2025-09-15",
  "endDate": "2026-06-13",
  "term1StartDate": "2025-09-15",
  "term1EndDate": "2026-01-23",
  "term2StartDate": "2026-02-10",
  "term2EndDate": "2026-06-13"
}
```

**Validation (FluentValidation):**
- `name` — required, regex `^\d{4}-\d{4}$` (örn. "2025-2026")
- `startDate < endDate`
- `term1StartDate ≥ startDate`, `term1EndDate < term2StartDate`, `term2EndDate ≤ endDate`
- `name` tenant içinde unique

**Response 201:**
```json
{
  "data": { "id": "01ARZ3...", "status": "Setup" },
  "errors": null
}
```

**Errors:**
- 400 — validation
- 403 — permission yok
- 409 — duplicate name veya çakışan tarih

**Domain Event:** `AcademicSessionCreatedEvent` (T1 ve T2 ile birlikte oluşturulur)

---

### ⚠️ `POST /api/v1/academic-sessions/{id}/activate`

**Permission:** `academic-sessions.activate`

**Davranış:** Mevcut aktif sezon varsa otomatik `Archived`'a düşürülür (BR-AS-001, atomik transaction).

**Request body:**
```json
{
  "confirmArchivePrevious": true   // Mevcut aktif sezon varsa arşive alınacağını onayla
}
```

**Response 200:**
```json
{
  "data": {
    "id": "...",
    "status": "Active",
    "isCurrent": true,
    "previousSessionId": "...",
    "previousSessionArchivedAt": "2026-09-01T12:00:00+03:00"
  }
}
```

**Errors:**
- 400 — Sezon tarihinde değil veya `Setup` değil
- 409 — `confirmArchivePrevious = false` ve mevcut aktif sezon var

**Domain Events:**
- `AcademicSessionArchivedEvent` (önceki, varsa)
- `AcademicSessionActivatedEvent` (yeni)
- 12. sınıf otomasyonu Sprint 5+'a kadar manuel; bu endpoint'te tetiklenmiyor

**Side effects:** Cache invalidation (`oksis:tenant:{schoolId}:current-session`).

---

### ⚠️ `POST /api/v1/academic-sessions/{sessionId}/terms/{termId}/close`

**Permission:** `academic-sessions.close-term`

**Davranış (BR-AS-005, terminal):**
1. `AcademicTerm.Status = Closed`
2. `AcademicTermClosedEvent` raise
3. Downstream:
   - `marks` modülü: not düzeltme kilitlenir (`Locked`)
   - `report-cards` modülü: karne üretim job'ı tetiklenir (otomatik veya manuel — BR-AS-009'a göre)
   - Devamsızlık sayaçları yeni dönem için sıfırlanır

**Request body:**
```json
{
  "confirmIrreversible": true,
  "acknowledgments": ["MARKS_WILL_LOCK", "REPORT_CARDS_WILL_GENERATE"]
}
```

**Response 200:**
```json
{
  "data": {
    "id": "...",
    "status": "Closed",
    "closedAt": "2026-01-23T17:00:00+03:00",
    "reportCardGenerationJobId": "..." // BR-AS-009
  }
}
```

**Errors:**
- 400 — `Active` değil
- 409 — `confirmIrreversible = false`

---

### `POST /api/v1/class-rooms`

**Permission:** `class-rooms.create`

**Davranış (BR-AS-008):** `school_settings.require_approval_for_classroom_creation` değerine göre statü belirlenir.

**Request body:**
```json
{
  "academicSessionId": "...",
  "gradeLevelId": "...",
  "section": "A",
  "capacity": 25,
  "homeroomTeacherId": "..."  // optional
}
```

**Validation:**
- `section` — required, max 3 char, uppercase
- `capacity` — required, 1-100
- `(academicSessionId, gradeLevelId, section)` tenant içinde unique
- `academicSessionId.Status != Archived`

**Response 201:**
```json
{
  "data": {
    "id": "...",
    "fullName": "9-A",
    "status": "Active"        // veya "PendingApproval" (BR-AS-008)
  }
}
```

**Errors:**
- 400 — validation
- 403 — permission yok
- 409 — duplicate
- 409 — arşivlenmiş sezona şube ekleme denemesi (BR-AS-003)

**Domain Event:** `ClassRoomCreatedEvent`

---

### `POST /api/v1/class-rooms/{id}/students/{studentId}/transfer`

**Permission:** `class-rooms.transfer-student`

**Davranış (BR-AS-011):** Atomik transaction:
1. Mevcut aktif `ClassRoomStudent` kaydı `LeftAt = now, Reason = Transfer`
2. Yeni şubede yeni `ClassRoomStudent` kaydı `AssignedAt = now, Reason = Transfer`
3. `StudentTransferredEvent` raise

**Request body:**
```json
{
  "toClassRoomId": "...",
  "notes": "Sınıf değişikliği — veli talebi"
}
```

**Response 200:**
```json
{
  "data": {
    "studentId": "...",
    "fromClassRoomId": "...",
    "toClassRoomId": "...",
    "transferredAt": "2025-11-15T10:30:00+03:00"
  }
}
```

**Errors:**
- 400 — `toClassRoomId` aynı sezona ait değil
- 404 — öğrencinin aktif ataması yok
- 409 — hedef şubenin kapasitesi dolu

---

## Response Envelope Standardı

Tüm endpoint'ler aynı envelope kullanır (`backend/api-design-rules.md`):

```json
{
  "data": <T> | <T[]>,
  "meta": { "page": 1, "pageSize": 50, "totalItems": 123, "totalPages": 3 },
  "errors": [{ "code": "...", "message": "...", "field": "..." }] | null,
  "correlationId": "01ARZ3..."
}
```

Liste endpoint'lerinde `meta` zorunlu; tekil endpoint'lerde `meta = null` veya yok.

---

## Yasaklar

- ❌ Verb in URL (`/createAcademicSession`) — sub-resource veya HTTP method kullan.
- ❌ Snake_case path — kebab-case.
- ❌ Inconsistent envelope.
- ❌ `current` endpoint'ini cache'siz yayınlamak (performans).
- ❌ `close-term` endpoint'ini idempotent yapmak (gerçekten irreversible).
- ❌ `activate` endpoint'inde önceki sezonu arşivlemeden devam etmek (BR-AS-001 ihlali).

> Detay: `backend/api-design-rules.md`.