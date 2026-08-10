# Duyuru — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Tablolar

### `{{TBD_table_name}}`

```sql
CREATE TABLE {{TBD_table_name}} (
    id              uniqueidentifier  not null  constraint pk_{{TBD_table_name}} primary key,
    school_id       uniqueidentifier  not null,
    {{TBD_column}}  {{TBD_type}}      {{TBD_null}},
    created_at      datetimeoffset    not null,
    created_by      uniqueidentifier  not null,
    updated_at      datetimeoffset    null,
    updated_by      uniqueidentifier  null,
    is_deleted      bit               not null  constraint df_{{TBD_table_name}}_is_deleted default 0,
    deleted_at      datetimeoffset    null,
    deleted_by      uniqueidentifier  null,
    row_version     rowversion        not null
);
```

**Index'ler:**

```sql
CREATE INDEX ix_{{TBD_table_name}}_school_id
  ON {{TBD_table_name}}(school_id)
  WHERE is_deleted = 0;

-- Composite (örnek):
CREATE INDEX ix_{{TBD_table_name}}_school_id_status
  ON {{TBD_table_name}}(school_id, status)
  WHERE is_deleted = 0;
```

**Foreign Key'ler:**

| Kolon | Referans | ON DELETE |
|---|---|---|
| `school_id` | `schools(id)` | `NO ACTION` |
| `{{TBD}}_id` | `{{TBD}}({{TBD}})` | {{TBD}} |

**Check Constraint'ler:**

```sql
ALTER TABLE {{TBD_table_name}}
ADD CONSTRAINT ck_{{TBD_table_name}}_{{TBD_rule}}
  CHECK ({{TBD_condition}});
```

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-15 | `20260515_add_{{TBD_table_name}}` | İlk tablo oluşturuldu |

---

## Yasaklar

- ❌ `varchar` (non-unicode) — `nvarchar` zorunlu.
- ❌ `datetime` / `datetime2` UTC olmadan — `datetimeoffset`.
- ❌ Tenant tablosunda `school_id` yokluğu.
- ❌ Composite index'te ilk kolon `school_id` değilse.

> Detay: `backend/database-rules.md`.
