# Ders Programı — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, request/response şeması.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

> Base route: `/api/v1/timetable` · Tüm endpoint'ler `[Authorize]` (anonim yok).

---

## Endpoint Özeti

### Rooms (Derslik Kataloğu) — ✅ canlı (rooms-first dilimi, 2026-06-10)

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| R1 | GET | `/api/v1/rooms?sessionId=` | `class-rooms.view`* | Aktif derslik kataloğu (+ sezondaki ev-dersliği ataması) | 200 |
| R2 | POST | `/api/v1/rooms` | `class-rooms.update`* | Derslik tanımla (kod tenant'ta tekil, 409) | 201 |
| R3 | PUT | `/api/v1/rooms/{id:guid}` | `class-rooms.update`* | Derslik güncelle (kod/konum/kapasite/aktiflik) | 204 |
| R4 | PUT | `/api/v1/class-rooms/{id:guid}/room` | `class-rooms.update` | Şubeye ev dersliği ata (pasif oda 409) | 204 |
| R5 | DELETE | `/api/v1/class-rooms/{id:guid}/room` | `class-rooms.update` | Ev dersliği atamasını kaldır | 204 |

> \* Geçici izin eşlemesi — `rooms.view/manage` izinleri timetable çekirdeğiyle
> gelecek (bkz. completion_status sapma kaydı). R4/R5 ClassRoomsController'dadır;
> şube aggregate'ini mutasyona uğrattığı için classrooms tarafında yaşar.

### Schedule (Ders Programı Satırları)

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/timetable/schedules` | `timetable.view` | Filtrelenebilir liste | 200 |
| 2 | GET | `/api/v1/timetable/schedules/{id:guid}` | `timetable.view-detail` | Tek satır detay | 200 |
| 3 | POST | `/api/v1/timetable/schedules` | `timetable.manage` | Tek satır oluştur (Draft) | 201 |
| 4 | POST | `/api/v1/timetable/schedules/bulk` | `timetable.manage` | Toplu oluştur (transactional) | 201 |
| 5 | PUT | `/api/v1/timetable/schedules/{id:guid}` | `timetable.manage` | Güncelle (Draft → direct, Published → supersede) | 204 |
| 6 | DELETE | `/api/v1/timetable/schedules/{id:guid}` | `timetable.manage` | Sil (sadece Draft; Published → 409, `Archive` kullan) | 204 |
| 7 | POST | `/api/v1/timetable/schedules/{id:guid}/archive` | `timetable.manage` | Published satırı arşivle | 204 |
| 8 | POST | `/api/v1/timetable/schedules/validate` | `timetable.manage` | Çakışma önizleme (yazmadan) | 200 |
| 9 | POST | `/api/v1/timetable/publish` | `timetable.publish` | Tüm taslakları transactional yayınla | 204 |

### Görünüm (View) Endpoint'leri — Mobile + Web

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 10 | GET | `/api/v1/timetable/branches/{branchId:guid}/weekly` | `timetable.view` | Şube haftalık programı | 200 |
| 11 | GET | `/api/v1/timetable/teachers/{teacherId:guid}/weekly` | `timetable.view` | Öğretmen haftalık programı | 200 |
| 12 | GET | `/api/v1/timetable/rooms/{roomId:guid}/weekly` | `timetable.view` | Derslik haftalık doluluk | 200 |
| 13 | GET | `/api/v1/timetable/today` | `timetable.view` | Bugünkü program (rol-bağımlı scope) | 200 |
| 14 | GET | `/api/v1/timetable/me/weekly` | `timetable.view` | Çağıran kullanıcının haftalık programı (Teacher/Student/Parent için kendi/çocuğunun) | 200 |
| 15 | GET | `/api/v1/timetable/matrix` | `timetable.view-all` | Tüm okul matrisi (admin) | 200 |

### Rooms (Derslikler)

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 16 | GET | `/api/v1/timetable/rooms` | `timetable.view-rooms` | Derslik listesi | 200 |
| 17 | GET | `/api/v1/timetable/rooms/{id:guid}` | `timetable.view-rooms` | Detay | 200 |
| 18 | POST | `/api/v1/timetable/rooms` | `timetable.manage-rooms` | Oluştur | 201 |
| 19 | PUT | `/api/v1/timetable/rooms/{id:guid}` | `timetable.manage-rooms` | Güncelle | 204 |
| 20 | DELETE | `/api/v1/timetable/rooms/{id:guid}` | `timetable.manage-rooms` | Pasifleştir (soft) | 204 |

### Overrides (Tek Günlük İstisnalar)

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 21 | GET | `/api/v1/timetable/overrides` | `timetable.view` | Tarih aralığında override listesi | 200 |
| 22 | POST | `/api/v1/timetable/overrides` | `timetable.override` | Override oluştur | 201 |
| 23 | DELETE | `/api/v1/timetable/overrides/{id:guid}` | `timetable.override` | Override'ı geri al (Revert) | 204 |

### Import / Export

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 24 | POST | `/api/v1/timetable/import/excel` | `timetable.import-excel` | Excel ile toplu içe aktarım (multipart) | 202 (job id) |
| 25 | GET | `/api/v1/timetable/import/{jobId:guid}/status` | `timetable.import-excel` | Import job durumu | 200 |
| 26 | GET | `/api/v1/timetable/export/excel` | `timetable.view` | Excel dışa aktarım (?scope=branch\|teacher\|room&id=...) | 200 (binary) |
| 27 | GET | `/api/v1/timetable/export/pdf` | `timetable.view` | PDF (A4 yatay) | 200 (binary) |

> Endpoint sayısı: **27**. Sprint 2 minimum: #1, 2, 3, 4, 5, 8, 9, 10, 11, 13, 14, 16, 17, 18, 19, 24, 25, 26 (~18 endpoint). #21–23 Sprint 3.

---

## Detay

### 1) `GET /api/v1/timetable/schedules`

**Permission:** `timetable.view` (resource-scope role'e göre filtrelenir — bkz. `permissions.md`)

**Query params:**

| Param | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `academicTermId` | guid | Evet | Hangi dönemin programı |
| `branchId` | guid | Hayır | Şube filtresi |
| `teacherId` | guid | Hayır | Öğretmen filtresi |
| `roomId` | guid | Hayır | Derslik filtresi |
| `courseId` | guid | Hayır | Ders filtresi |
| `dayOfWeek` | int (0..6) | Hayır | Belirli gün |
| `status` | string | Hayır | `Draft`, `Published`, `Archived` (default `Published`) |
| `asOfDate` | date | Hayır | Versiyonlu sorgu — bu tarihte geçerli olan satırlar (default `today`) |
| `page` | int | Hayır | Default 1 |
| `pageSize` | int | Hayır | Default 50, max 200 |

**Response 200:**

```json
{
  "data": [
    {
      "id": "8a3f...",
      "academicYearId": "...",
      "academicTermId": "...",
      "branchId": "...",
      "branchName": "9-A",
      "courseId": "...",
      "courseName": "Matematik",
      "courseCode": "MAT-9",
      "teacherId": "...",
      "teacherName": "Ayşe Yılmaz",
      "roomId": "...",
      "roomCode": "B-12",
      "roomName": "2. Kat Sınıf",
      "dayOfWeek": 1,
      "startTime": "08:30",
      "endTime": "09:10",
      "lessonOrder": 1,
      "isBlockLesson": false,
      "status": "Published",
      "version": 1,
      "effectiveFrom": "2026-09-15",
      "effectiveTo": null
    }
  ],
  "meta": { "page": 1, "pageSize": 50, "totalItems": 0, "totalPages": 0 },
  "errors": null,
  "correlationId": "..."
}
```

---

### 3) `POST /api/v1/timetable/schedules`

**Permission:** `timetable.manage`

**Request body:**

```json
{
  "academicYearId": "...",
  "academicTermId": "...",
  "branchId": "...",
  "courseId": "...",
  "teacherId": "...",
  "roomId": "...",            // opsiyonel
  "dayOfWeek": 1,
  "startTime": "08:30",
  "endTime": "09:10",
  "lessonOrder": 1,
  "isBlockLesson": false,
  "blockGroupId": null,       // isBlockLesson=true ise zorunlu
  "effectiveFrom": "2026-09-15"
}
```

**Validation (FluentValidation):**
- Tüm zorunlu Guid'ler — non-empty
- `startTime < endTime`
- `lessonOrder >= 1`
- `dayOfWeek` 0..6
- `effectiveFrom` aktif `academicTerm.startDate..endDate` aralığında
- `isBlockLesson == true` ise `blockGroupId != null`
- `roomId` set edilmişse → room `Active` ve tenant'a ait

**Çakışma Kontrolü (handler — `IScheduleConflictChecker`):**
- BR-TT-001 öğretmen çakışması
- BR-TT-002 şube çakışması
- BR-TT-003 derslik çakışması (roomId varsa)
- BR-TT-004 tatil günü kontrolü (effectiveFrom başlangıç noktası)
- BR-TT-005 zil saati slot uyumu
- BR-TT-006 öğretmen branş uyumsuzluğu → SOFT warning (engellemez, response'a warning eklenir)
- BR-TT-012 öğretmen günlük >8 saat → SOFT warning
- BR-TT-013 şube günde >2 aynı ders → SOFT warning

**Response 201:**

```json
{
  "data": {
    "id": "8a3f...",
    "warnings": [
      { "code": "TT-SOFT-006", "message": "Öğretmen branşı bu derste tanımlı değil." }
    ]
  },
  "errors": null
}
```

**Errors:**
- 400 — validation (FluentValidation hataları)
- 403 — permission yok / scope dışı
- 404 — referans entity yok (branch/course/teacher/room)
- 409 — HARD çakışma (kod: `TT-CONFLICT-TEACHER` / `TT-CONFLICT-BRANCH` / `TT-CONFLICT-ROOM` / `TT-HOLIDAY` / `TT-BELL-SLOT`)

**Domain Event:** `ScheduleCreatedEvent` (bkz. `notifications.md` — yayın sırasında değil oluşturma sırasında bildirim gitmez)

---

### 4) `POST /api/v1/timetable/schedules/bulk`

**Permission:** `timetable.manage`

Excel import handler'ı ve UI'daki "taslağı toplu kaydet" akışı bunu kullanır. **Tamamı veya hiçbiri** (transactional).

**Request body:**

```json
{
  "academicYearId": "...",
  "academicTermId": "...",
  "effectiveFrom": "2026-09-15",
  "items": [
    { "branchId": "...", "courseId": "...", "teacherId": "...", "roomId": "...",
      "dayOfWeek": 1, "startTime": "08:30", "endTime": "09:10", "lessonOrder": 1 },
    { /* ... */ }
  ]
}
```

**Limit:** Max 2.000 satır/request (büyük import → Excel endpoint #24 üzerinden chunked).

**Response 201:**

```json
{
  "data": {
    "createdCount": 1840,
    "softWarnings": [
      { "itemIndex": 12, "code": "TT-SOFT-006", "message": "..." }
    ]
  }
}
```

**Errors:**
- 409 — herhangi bir item için HARD çakışma → **hiçbir satır oluşturulmaz**, response'da hatalı item index'leri:

```json
{
  "errors": [
    { "itemIndex": 5, "code": "TT-CONFLICT-TEACHER", "message": "Öğretmen aynı slotta zaten dolu" }
  ]
}
```

---

### 5) `PUT /api/v1/timetable/schedules/{id}`

**Permission:** `timetable.manage`

**Davranış:**
- `Status == Draft` ise: in-place update, version değişmez.
- `Status == Published` ise: **Supersede** akışı — mevcut satır `Archived` + `EffectiveTo = newEffectiveFrom - 1`, yeni satır `Version + 1` + `PreviousVersionId` ile oluşur. Response'da **yeni satırın ID'si** döner.

**Request body:**

```json
{
  "courseId": "...",
  "teacherId": "...",
  "roomId": "...",
  "dayOfWeek": 1,
  "startTime": "08:30",
  "endTime": "09:10",
  "lessonOrder": 1,
  "effectiveFrom": "2026-11-01"   // zorunlu — supersede tarihi
}
```

**Response 204** (Draft update) veya **200** (Supersede — body'de yeni `{ "newScheduleId": "..." }`).

**Concurrency:** Header `If-Match: <rowVersion>` zorunlu. Mismatch → 412 Precondition Failed.

**Domain Event:** Draft → `ScheduleCreatedEvent` zaten yayılmıştır, yeniden yayılmaz. Published → `ScheduleSupersededEvent`.

---

### 8) `POST /api/v1/timetable/schedules/validate`

**Permission:** `timetable.manage`

**Amaç:** Sürükle-bırak UI'da yazma yapmadan çakışma önizleme. **Veritabanına yazmaz**, sadece kontrolleri çalıştırır.

**Request body:** `POST /schedules` ile aynı (tek item) veya bulk için items[] array.

**Response 200:**

```json
{
  "data": {
    "isValid": false,
    "hardConflicts": [
      { "code": "TT-CONFLICT-TEACHER", "message": "Ayşe Yılmaz salı 08:30-09:10 dolu (9-B Matematik)", "conflictingScheduleId": "..." }
    ],
    "softWarnings": [
      { "code": "TT-SOFT-006", "message": "Öğretmen branşı 'Türkçe', atanan ders 'Matematik'." }
    ]
  }
}
```

---

### 9) `POST /api/v1/timetable/publish`

**Permission:** `timetable.publish` (sadece SchoolAdmin)

**Amaç:** İlgili `academicTermId` için tüm `Draft` satırları transactional olarak `Published` yapar.

**Request body:**

```json
{
  "academicTermId": "...",
  "effectiveFrom": "2026-09-15",          // hepsine uygulanır
  "publishMode": "Initial"                // "Initial" | "MidTerm"
}
```

- `Initial`: Sezon başı ilk yayın — tüm dönem boyunca tek dijest bildirim.
- `MidTerm`: Sezon ortası — sadece değişen satırlar için bildirim.

**Validation:**
- Müfredat kotası kontrolü → SOFT warning (BR-TT-007, force-publish hakkı var)
- Mevcut Published satırlar arasında çakışma → HARD (taslakta önceden kalmış olmamalı)

**Response 204** + body:

```json
{
  "data": {
    "publishedCount": 2104,
    "warnings": [
      { "code": "TT-SOFT-007", "message": "9-A şubesinde Matematik 5 saat atandı, hedef 6." }
    ]
  }
}
```

**Domain Event:** `SchedulePublishedEvent` (toplu, dijest bildirim için single trigger).

---

### 10) `GET /api/v1/timetable/branches/{branchId}/weekly`

**Permission:** `timetable.view` (Parent → çocuğunun şubesi, Student → kendi şubesi, Teacher → ders verdiği şubeler, Admin → hepsi)

**Query params:**
- `academicTermId` (zorunlu)
- `asOfDate` (default today — versiyon ve override hesaplama)
- `includeOverrides` (default true — bugünkü override'ları "applied" olarak göster)

**Response 200:** Gün × ders matrisi (zaman dilimine göre sıralı):

```json
{
  "data": {
    "branchId": "...",
    "branchName": "9-A",
    "asOfDate": "2026-11-12",
    "weekDays": [
      {
        "dayOfWeek": 1,
        "dayName": "Pazartesi",
        "slots": [
          {
            "scheduleId": "...",
            "lessonOrder": 1,
            "startTime": "08:30",
            "endTime": "09:10",
            "course": { "id": "...", "name": "Matematik", "code": "MAT-9" },
            "teacher": { "id": "...", "name": "Ayşe Yılmaz" },
            "room": { "id": "...", "code": "B-12", "name": "2. Kat Sınıf" },
            "appliedOverride": null
          },
          {
            "scheduleId": "...",
            "lessonOrder": 2,
            "startTime": "09:20",
            "endTime": "10:00",
            "course": { "id": "...", "name": "Türkçe" },
            "teacher": { "id": "...", "name": "Ali Demir" },
            "room": { "id": "...", "code": "B-12" },
            "appliedOverride": {
              "overrideId": "...",
              "type": "TeacherSubstitution",
              "newTeacher": { "id": "...", "name": "Veli Kara" },
              "reason": "Ali Hoca raporlu"
            }
          }
        ]
      }
    ]
  }
}
```

> `appliedOverride` null değilse mobile/web "değişiklik var" badge'i gösterir.

---

### 11) `GET /api/v1/timetable/teachers/{teacherId}/weekly`

Aynı şema, öğretmen perspektifinde. Boş slotlar `null` dönmez, sadece dolu olanlar listelenir; ön yüz zil saatleri ile maskeler.

---

### 13) `GET /api/v1/timetable/today`

**Permission:** `timetable.view`

**Query params:**
- `for` — opsiyonel: `me` (default — JWT'den rol-bazlı çözümleme), `branch:{branchId}`, `teacher:{teacherId}`, `student:{studentId}` (Parent için çocuk seçimi)
- `date` — opsiyonel (default `today`)

**Response 200:**

```json
{
  "data": {
    "date": "2026-11-12",
    "subjectName": "9-A",
    "subjectType": "Branch",
    "slots": [ /* 10. endpoint'in slot şeması ile aynı */ ],
    "summary": {
      "totalLessons": 7,
      "overridesCount": 1,
      "nextLesson": { "startTime": "11:10", "courseName": "Fizik" }
    }
  }
}
```

---

### 22) `POST /api/v1/timetable/overrides`

**Permission:** `timetable.override`

**Request body:**

```json
{
  "originalScheduleId": "...",
  "overrideDate": "2026-11-13",
  "overrideType": "TeacherSubstitution",     // Cancellation|TeacherSubstitution|RoomChange|TimeChange|Combined
  "newTeacherId": "...",                     // type'a göre
  "newRoomId": null,
  "newStartTime": null,
  "newEndTime": null,
  "reason": "Ali Hoca raporlu"
}
```

**Validation:**
- BR-TT-011: `overrideDate` `today..today+30` arasında
- `originalScheduleId` aktif (`Status == Published`, `effectiveFrom..effectiveTo` aralığında)
- Type-spesifik alan zorunlulukları (domain invariants)
- Yeni teacher/room çakışma kontrolü (substitution/room change için)
- Aynı `(originalScheduleId, overrideDate)` için aktif override varsa → 409 (önce geri al)

**Response 201:**

```json
{
  "data": {
    "id": "...",
    "applicableUserCount": 32           // bildirim alacak kişi sayısı (öğrenci + veli + öğretmen)
  }
}
```

**Domain Event:** `ScheduleOverrideCreatedEvent` + (substitution ise) `TeacherSubstitutionAssignedEvent`.

---

### 24) `POST /api/v1/timetable/import/excel`

**Permission:** `timetable.import-excel`

**Content-Type:** `multipart/form-data`

**Form fields:**
- `file` — .xlsx (max 5 MB)
- `academicTermId` — Guid
- `effectiveFrom` — date
- `mode` — `Replace` (mevcut Draft'ları sil + yenilerini yaz) | `Append` (mevcut Draft'a ekle)

**Response 202** (asenkron Hangfire job):

```json
{
  "data": {
    "jobId": "...",
    "estimatedSeconds": 30
  }
}
```

Excel formatı (Sheet1):

| Şube | Gün | Sıra | Başlangıç | Bitiş | Ders Kodu | Öğretmen E-posta | Derslik Kodu |
|---|---|---|---|---|---|---|---|
| 9-A | Pazartesi | 1 | 08:30 | 09:10 | MAT-9 | ayse@x.com | B-12 |

> Lookup: Şube `branches.code`, Ders `courses.code`, Öğretmen `users.email`, Derslik `rooms.code`. Resolve edilemeyen satırlar `jobStatus.errors[]` içinde döner.

---

### 25) `GET /api/v1/timetable/import/{jobId}/status`

**Permission:** `timetable.import-excel`

**Response 200:**

```json
{
  "data": {
    "jobId": "...",
    "status": "Running",                  // Pending|Running|Completed|Failed
    "progressPercent": 64,
    "totalRows": 2100,
    "processedRows": 1344,
    "createdRows": 1340,
    "errorRows": 4,
    "errors": [
      { "row": 17, "code": "LOOKUP_FAIL", "field": "TeacherEmail", "value": "yok@x.com", "message": "Öğretmen bulunamadı" }
    ]
  }
}
```

---

## Response Shape (Tüm Endpoint'ler)

Tüm endpoint'ler ortak `ApiResponse<T>` zarfı kullanır (proje genel kontratı):

```json
{
  "data": { /* veya array */ },
  "errors": [{ "code": "...", "field": "...", "message": "..." }],
  "correlationId": "uuid"
}
```

> Detay: `frontend/coding-standards.md` § 10 (axios interceptor unwrap eder).

---

## Backend Komutları / Query'leri (MediatR)

| Endpoint | Command/Query | Handler |
|---|---|---|
| #1 GET schedules | `GetSchedulesQuery` | `GetSchedulesQueryHandler` (Dapper) |
| #2 GET schedules/{id} | `GetScheduleByIdQuery` | `GetScheduleByIdQueryHandler` |
| #3 POST schedules | `CreateScheduleCommand` | `CreateScheduleCommandHandler` |
| #4 POST schedules/bulk | `BulkCreateSchedulesCommand` | `BulkCreateSchedulesCommandHandler` (transactional) |
| #5 PUT schedules/{id} | `UpdateScheduleCommand` | `UpdateScheduleCommandHandler` (Draft direct / Published supersede branch) |
| #6 DELETE schedules/{id} | `DeleteDraftScheduleCommand` | `DeleteDraftScheduleCommandHandler` |
| #7 POST archive | `ArchiveScheduleCommand` | `ArchiveScheduleCommandHandler` |
| #8 POST validate | `ValidateScheduleQuery` | `ValidateScheduleQueryHandler` (no-write) |
| #9 POST publish | `PublishScheduleDraftsCommand` | `PublishScheduleDraftsCommandHandler` |
| #10 GET branches/{id}/weekly | `GetBranchWeeklyQuery` | `GetBranchWeeklyQueryHandler` (Dapper, covering index) |
| #11 GET teachers/{id}/weekly | `GetTeacherWeeklyQuery` | `GetTeacherWeeklyQueryHandler` (Dapper) |
| #12 GET rooms/{id}/weekly | `GetRoomWeeklyQuery` | `GetRoomWeeklyQueryHandler` (Dapper) |
| #13 GET today | `GetTodayScheduleQuery` | `GetTodayScheduleQueryHandler` (rol resolver) |
| #14 GET me/weekly | `GetMyWeeklyQuery` | `GetMyWeeklyQueryHandler` |
| #15 GET matrix | `GetSchoolMatrixQuery` | `GetSchoolMatrixQueryHandler` (Dapper, large result) |
| #16–20 Rooms | `Get/Create/Update/DeleteRoomCommand/Query` | İlgili handler'lar |
| #21 GET overrides | `GetOverridesQuery` | `GetOverridesQueryHandler` |
| #22 POST overrides | `CreateScheduleOverrideCommand` | `CreateScheduleOverrideCommandHandler` |
| #23 DELETE overrides/{id} | `RevertScheduleOverrideCommand` | `RevertScheduleOverrideCommandHandler` |
| #24 POST import/excel | `ImportTimetableFromExcelCommand` | `ImportTimetableFromExcelCommandHandler` (Hangfire enqueue) |
| #25 GET import/{id}/status | `GetImportJobStatusQuery` | `GetImportJobStatusQueryHandler` |
| #26–27 Export | `Export...Query` | `Export...QueryHandler` (ClosedXML / QuestPDF) |

---

## Yetki & Scope Çözünürlüğü

`timetable.view` permission'u tüm rollerde var ama **kapsam** rol bazında ayrışır (`permissions.md` § Scope):

- **Teacher** → `schedules.teacher_id == currentUser.TeacherId` veya kendisinin ders verdiği şubelerin matrisi
- **Parent** → `currentUser.Children[].BranchId IN (schedules.branch_id)`
- **Student** → `schedules.branch_id == currentUser.BranchId`
- **SchoolAdmin / Koordinatör** → tenant içi her şey
- **Secretary** → read-only, sadece derslik doluluk sorgusu

Handler `IScheduleAccessPolicy` üzerinden çözer; query expression'a otomatik filtre eklenir.

---

## Cache Stratejisi

| Sorgu | Cache | TTL | Invalidation |
|---|---|---|---|
| `GET branches/{id}/weekly` | Redis | 5 dk | `SchedulePublishedEvent`, `ScheduleSupersededEvent`, `ScheduleOverrideCreatedEvent` (sadece etkilenen şube) |
| `GET teachers/{id}/weekly` | Redis | 5 dk | Aynı event'ler (etkilenen teacher) |
| `GET today` | Redis | 1 dk | Aynı + ek olarak günlük override'lar |
| `GET matrix` | Sadece in-memory request scope | - | - |
| `POST schedules/validate` | Hayır | - | - |

> Cache key prefix: `tt:{schoolId}:branch:{branchId}:weekly:{termId}:{asOfDate}`. Multi-tenant isolation key seviyesinde.

---

## Yasaklar

- ❌ Verb in URL (`/createSchedule`) — POST/PUT/DELETE kullan.
- ❌ Snake_case path — kebab-case zorunlu.
- ❌ Schedule fiziksel DELETE endpoint'i (#6 sadece Draft için; Published → #7 Archive).
- ❌ Inconsistent envelope.
- ❌ Çakışma kontrolünü client tarafına bırakmak — her POST/PUT handler'da `IScheduleConflictChecker` çalışmalı.
- ❌ `validate` çağrısı yapmadan bulk import tetiklemek (handler kendi içinde validate ediyor — UI önce göstermek için kullanır).

> Detay: `backend/api-design-rules.md`.
