# Sınıf / Şube — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, request/response şeması.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

---

## Endpoint Özeti

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/classrooms` | `classrooms.view` | Liste |
| GET | `/api/v1/classrooms/{id}` | `classrooms.view-detail` | Detay |
| POST | `/api/v1/classrooms` | `classrooms.create` | Oluştur |
| PUT | `/api/v1/classrooms/{id}` | `classrooms.update` | Güncelle |
| DELETE | `/api/v1/classrooms/{id}` | `classrooms.delete` | Sil (soft) |
| PUT | `/api/v1/class-rooms/{id}/room` | `class-rooms.update` | Ev dersliği ata (rooms-first, canlı) |
| DELETE | `/api/v1/class-rooms/{id}/room` | `class-rooms.update` | Ev dersliği kaldır (canlı) |
| PUT | `/api/v1/class-rooms/{id}/section` | `class-rooms.update` | Şube adını değiştir (serbest metin ≤30, tekillik 409 — canlı) |
| PUT | `/api/v1/class-rooms/{id}/status` | `class-rooms.update` | Durum geçişi Active ⇄ Draft (canlı) |
| GET | `/api/v1/class-rooms/export?sessionId=&format=xlsx\|csv` | `class-rooms.view` | Şube listesi dışa aktarma — dosya döner (canlı) |
| POST | `/api/v1/class-rooms/{id}/archive` | `class-rooms.archive` | Şube arşivle (soft-delete). Body `{reason}` zorunlu ≤500. 409: aktif öğrenci (`ClassRoom.HasActiveStudents`) / zaten arşivli (canlı) |
| DELETE | `/api/v1/class-rooms/{id}` | `class-rooms.delete` | Şube kalıcı sil (hard delete → `is_deleted=1`, slotu serbest bırakır). 409: aktif öğrenci (`ClassRoom.HasActiveStudents`). Arşivden farkı: aynı isim yeniden açılabilir (canlı) |

> Not (2026-06-10): canlı uçlar `/api/v1/class-rooms` altında AcademicSessions
> modülünde yaşıyor; derslik kataloğu için bkz. `modules/timetable/api-contracts.md`
> (Rooms bölümü).

> ⚠️ OUTDATED (2026-06-28): Yukarıdaki tablonun ilk satırları (`/api/v1/classrooms`
> tek kelime + `classrooms.view/create/update/delete` izinleri) eski iskelettir.
> Canlı uçlar `/api/v1/class-rooms` (tireli) altındadır ve izinler `class-rooms.*`
> slug'ı kullanır. Eski satırların arşiv yaklaşımıyla güncellenmesi ayrı bir
> temizlik borcudur.

### `POST /api/v1/class-rooms/{id}/archive`

**Permission:** `class-rooms.archive`

**Request body:**
```json
{ "reason": "string" }
```

**Validation:**
- `reason` — **zorunlu**, max 500 karakter (boş/uzun → domain validation hatası).

**Response 201:** Created (gövde önemsiz).

**Errors:**
- 404 — şube bulunamadı
- 409 — aktif öğrenci ataması var (`code: ClassRoom.HasActiveStudents`, backend
  Türkçe dinamik mesaj: "Şube {ad} arşivlenemez: {N} aktif öğrenci ataması mevcut…")
  veya şube zaten arşivli

**Domain:** `ClassRoom.Archive(reason)` (soft-delete, status → `Archived`);
`ClassRoomHasActiveStudentsException`. Geçmiş yoklama/not/atama kayıtları korunur.
Geri alma (unarchive) ucu **yok** — kapsam dışı.

---

### `DELETE /api/v1/class-rooms/{id}`

**Permission:** `class-rooms.delete`

**Request body:** yok (sebep alınmaz).

**Response:** 204 No Content (gövde yok).

**Errors:**
- 404 — şube bulunamadı
- 409 — aktif öğrenci ataması var (`code: ClassRoom.HasActiveStudents`)

**Domain:** `ClassRoom.EnsureDeletable()` (aktif öğrenci varsa
`ClassRoomHasActiveStudentsException`). Silme **hard delete**'tir:
`TenantSaveChangesInterceptor` kaydı `is_deleted=1` yapar. Geri alınamaz.

**Arşivlemeden farkı:** Arşiv `Status=Archived` yapar ama `is_deleted=0` kalır →
(sezon, seviye, şube) unique index'i (`HasFilter("is_deleted=0")`) dolu kalır,
aynı isim yeniden açılamaz. Silme `is_deleted=1` yapar → slot serbest kalır, aynı
isimli şube yeniden açılabilir. İzin: `class-rooms.delete` (migration
`20260628_add_class_rooms_delete_permission` ile SuperAdmin + SchoolAdmin'e verildi).

---

## Detay

### `GET /api/v1/classrooms`

**Permission:** `classrooms.view`

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

### `POST /api/v1/classrooms`

**Permission:** `classrooms.create`

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

## Yasaklar

- ❌ Verb in URL (`/createUser`) — sub-resource veya HTTP method kullan.
- ❌ Snake_case path — kebab-case.
- ❌ Inconsistent envelope.

> Detay: `backend/api-design-rules.md`.
