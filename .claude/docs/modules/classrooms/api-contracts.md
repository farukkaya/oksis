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

> Not (2026-06-10): canlı uçlar `/api/v1/class-rooms` altında AcademicSessions
> modülünde yaşıyor; derslik kataloğu için bkz. `modules/timetable/api-contracts.md`
> (Rooms bölümü).

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
