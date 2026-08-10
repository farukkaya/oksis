# Öğretmen — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, request/response şeması.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

---

## Endpoint Özeti

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/teachers` | `teachers.view` | Liste |
| GET | `/api/v1/teachers/{id}` | `teachers.view-detail` | Detay |
| POST | `/api/v1/teachers` | `teachers.create` | Oluştur |
| PUT | `/api/v1/teachers/{id}` | `teachers.update` | Güncelle |
| DELETE | `/api/v1/teachers/{id}` | `teachers.delete` | Sil (soft) |

### Görevlendirme Hub'ı (sınıf-merkezli) — `api/v1/teaching-assignments`

> Sınıf-merkezli görevlendirme hub'ı (spec `gorevlendirme-hub-spec.md` §2.6). Okuma query'leri
> EF Core projection ile (Dapper değil). Yazma (assign/unassign) mevcut
> `api/v1/teachers/{teacherId}/assignments` üzerinden devam eder; hub modalı o ucu çağırır.

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/teaching-assignments/summary?sessionId=` | `teaching-assignments.view` | Üst metrikler |
| GET | `/api/v1/teaching-assignments/classes?sessionId=` | `teaching-assignments.view` | Sol panel (sınıf listesi + doluluk) |
| GET | `/api/v1/teaching-assignments/by-class/{classRoomId}?sessionId=` | `teaching-assignments.view` | Sağ panel (sınıfın görevlendirmeleri) |
| POST | `/api/v1/teaching-assignments/copy-season` | `teaching-assignments.copy-season` | Önceki sezondan kopyala |

> İlgili: `POST /api/v1/academic-sessions/{id}/copy-assignments?sourceSessionId=` (academic-years modülü)
> artık aynı `CopyAssignmentsToNewSeasonCommand`'a evrildi → `CopyAssignmentsResult` şeklini döner
> (eskiden basit sayım). Müfredat hedef saati: `GET` curriculum-hours sorgusu (`curriculum-hours.view`).

### Müfredat Saati — `api/v1/curriculum-hours`

> Ders × seviye haftalık saat (MEB master `CurriculumHourTemplate` + okul/sezon override
> `SchoolWeeklyHourOverride`, resolver effective). Ders Kataloğu (Akademik Yapı) tüketir (B0.2H).

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/curriculum-hours/required-total?sessionId=&gradeLevelCode=` | `curriculum-hours.view` | Seviyenin gerekli toplam hedef saati (int) |
| GET | `/api/v1/curriculum-hours/subject/{subjectId}?sessionId=` | `curriculum-hours.view` | Dersin atanmış seviyelerindeki satırlar (MEB+okul+effective) |
| GET | `/api/v1/curriculum-hours/catalog?sessionId=` | `curriculum-hours.view` | Ders başına effective saat min–max (liste kolonu) |
| PUT | `/api/v1/curriculum-hours/subject/{subjectId}` | `curriculum-hours.override` | Ders × seviye saatlerini ayarla (bulk reconcile; body `{sessionId?, items:[{gradeLevelCode, weeklyHours}]}`) |

> PUT reconcile: effective hedef MEB master'a (master ?? 0) eşitse override silinir (varsayılana dön),
> farklıysa upsert. `sessionId` null → aktif sezon. Seviye dersin `subject_grade_levels`'ından olmalı
> (değilse 409 Conflict). Saat 0–40.

---

## Detay

### `GET /api/v1/teachers`

**Permission:** `teachers.view`

**Query params:**
- `page` (default 1)
- `pageSize` (default 50, max 100)
- `search` (opsiyonel, min 2 karakter)
- `{{TBD}}`

**Response 200:**
```json
{
  "data": [
    { "id": "...", "...": "..." }
  ],
  "meta": { "page": 1, "pageSize": 50, "totalItems": 0, "totalPages": 0 },
  "errors": null,
  "correlationId": "..."
}
```

---

### `POST /api/v1/teachers`

**Permission:** `teachers.create`

**Request body:**
```json
{
  "{{TBD_field}}": "..."
}
```

**Validation:**
- `{{TBD}}` — required, max 100 char
- `{{TBD}}` — {{TBD}}

**Response 201:**
```json
{
  "data": { "id": "..." }
}
```

**Errors:**
- 400 — validation
- 403 — permission yok
- 409 — duplicate

**Domain Event:** `{{TBD}}CreatedEvent` (bkz. `notifications.md`)

---

### `GET /api/v1/teaching-assignments/summary`

**Permission:** `teaching-assignments.view`

**Query params:** `sessionId` (opsiyonel — verilmezse aktif sezon)

**Response 200 (`AssignmentSummaryDto`):**
```json
{ "data": { "totalAssignments": 102, "missingClasses": 9, "mismatchedAssignments": 1 } }
```
- `missingClasses`: hedef tanımlı (`targetHours > 0`) ve `totalWeeklyHours < targetHours` olan sezon-aktif şube sayısı (hedefsiz/arşiv hariç).
- `mismatchedAssignments`: aktif görevlendirmelerden `branchMatch == YanBrans` sayısı.

---

### `GET /api/v1/teaching-assignments/classes`

**Permission:** `teaching-assignments.view`

**Query params:** `sessionId` (opsiyonel)

**Response 200 (sol panel, dizi):**
```json
{ "data": [ {
  "classRoomId": "...", "fullName": "9-A", "gradeLevelCode": "9",
  "educationLevel": "High", "subjectCount": 8, "totalWeeklyHours": 26,
  "targetHours": 30, "fillStatus": "Below"
} ] }
```
- `fillStatus`: `Undefined` (hedef tanımsız, gri) · `Empty` (atama yok, gri) · `Below` (amber) · `OnTarget` (yeşil) · `Over` (kırmızı).
- `educationLevel` (`GradeLevel.EducationLevel`) sol panel kademe gruplaması için. `Archived` şubeler hariç.

---

### `GET /api/v1/teaching-assignments/by-class/{classRoomId}`

**Permission:** `teaching-assignments.view`

**Query params:** `sessionId` (opsiyonel)

**Response 200 (sağ panel, dizi):**
```json
{ "data": [ {
  "id": "...", "subjectId": "...", "subjectName": "Matematik",
  "teacherId": "...", "teacherName": "Ayşe Yılmaz", "teacherBranch": "Matematik",
  "branchMatch": "Uyumlu", "weeklyHours": 5
} ] }
```
- `branchMatch`: `Uyumlu` / `YanBrans` — query-time hesaplanır (persist yok); `teacherBranch` vs `subjectName` normalize (`Trim` + `ToUpper(tr-TR)` + boşluk temizliği) karşılaştırması.

---

### `POST /api/v1/teaching-assignments/copy-season`

**Permission:** `teaching-assignments.copy-season` (yalnız SchoolAdmin — SuperAdmin değil)

**Request body:**
```json
{ "sourceSessionId": "...", "targetSessionId": "..." }
```

**Response 200 (`CopyAssignmentsResult`):**
```json
{ "data": {
  "copiedCount": 87,
  "skipped": [ { "reason": "no-target-class", "sourceClassRoomId": "...", "subjectId": "...", "teacherId": "..." } ]
} }
```
- Şube eşlemesi: hedef `ClassRoom.SourceClassRoomId == kaynak.ClassRoomId` (Sezon Rollover köken bağı).
- Atlama sebepleri: `teacher-terminated` · `no-target-class` · `class-archived` · `already-exists` (idempotent).
- **Domain Event:** `AssignmentsCopiedEvent(sourceSessionId, targetSessionId, copiedCount)`; her kopya için `TeachingAssignmentChangedEvent(Assigned)`.

---

## Yasaklar

- ❌ Verb in URL (`/createUser`) — sub-resource veya HTTP method kullan.
- ❌ Snake_case path — kebab-case.
- ❌ Inconsistent envelope.

> Detay: `backend/api-design-rules.md`.
