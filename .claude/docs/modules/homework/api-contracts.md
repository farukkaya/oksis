# Ödev — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, request/response şeması.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

---

## Endpoint Özeti

| Method | Path | Permission | Amaç |
|---|---|---|---|
| GET | `/api/v1/homework` | `homework.view` | Liste |
| GET | `/api/v1/homework/{id}` | `homework.view-detail` | Detay |
| POST | `/api/v1/homework` | `homework.create` | Oluştur |
| PUT | `/api/v1/homework/{id}` | `homework.update` | Güncelle |
| DELETE | `/api/v1/homework/{id}` | `homework.delete` | Sil (soft) |

---

## Detay

### `GET /api/v1/homework`

**Permission:** `homework.view`

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

### `POST /api/v1/homework`

**Permission:** `homework.create`

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
