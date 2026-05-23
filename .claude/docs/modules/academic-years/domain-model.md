# Akademik Yıl / Sezon — Domain Model

> Bu modülün domain katmanı: entity'ler, value object'ler, aggregate root'lar, invariants, domain event'ler.

---

## Aggregate Root(lar)

### `{{TBD_EntityName}}`

**Sorumluluk:** {{TBD}}

**Properties:**

| İsim | Tip | Açıklama | Kısıt |
|---|---|---|---|
| `Id` | `Guid` | Primary key | Otomatik |
| `SchoolId` | `Guid` | Tenant | Zorunlu, immutable |
| `{{TBD}}` | `{{TBD}}` | {{TBD}} | {{TBD}} |

**Invariants (her zaman geçerli iş kuralı):**

- {{TBD}}
- {{TBD}}

**Davranışlar (method'lar):**

- `Create(...)` — Static factory
- `{{TBD}}(...)` — {{TBD}}

---

## Value Objects

### `{{TBD_VOName}}`

{{TBD}}

---

## Domain Events

| Event | Tetiklenme Anı | Payload |
|---|---|---|
| `{{TBD}}Event` | {{TBD}} | {{TBD_fields}} |

> Event'lerin bildirim akışları için bkz. `notifications.md`.

---

## İlişkiler

```
{{TBD_EntityName}}
  ├── (1:N) → {{TBD}}
  └── (N:1) → {{TBD}}
```

---

## Yasaklar

- ❌ Public setter (constructor / factory üzerinden)
- ❌ Domain'de EF Core attribute (Fluent API'de yapılır — `Infrastructure/Persistence/Configurations/`)
- ❌ DataAnnotations
- ❌ Public collection ekleme/çıkarma (method üzerinden)

> Genel domain kuralları için bkz. `backend/domain-model-rules.md`.
