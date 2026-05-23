# Bildirim — Notifications

> Bu modülün domain event → bildirim eşleştirmeleri.

> Genel akış için bkz. `backend/notification-rules.md` (teknik) ve `notification-matrix.md` (içerik).

---

## Domain Event → Bildirim Akışı

### `{{TBD}}Event`

**Tetiklenme:** {{TBD}} (örn. "öğretmen mark.publish çağırdığında")

**Alıcılar:**

| Alıcı Rol | Kanal | Priority | Cooldown |
|---|---|---|---|
| Parent (öğrencinin velisi) | Push + InApp | Normal | 1 saat |
| Student | InApp | Low | yok |

**Template (TR):**
- Title: `{{TBD}} — {ChildName}`
- Body: `{{TBD}}`

**Kapsam Kontrolü:**
- Parent sadece kendi çocuğuna ait event'i alır.
- {{TBD}}

---

## Recipient Resolver Notu

`INotificationRecipientResolver` bu event için şu mantığı uygular:

```
event payload → SchoolId + EntityId
  ↓
ilgili entity'yi çek (örn. Student)
  ↓
related users'ı bul (örn. student.Parents)
  ↓
preference + cooldown + quiet hours filtresi
  ↓
final recipient list
```

> Detay: `backend/notification-rules.md` § 5.

---

## Yasaklar

- ❌ Sync olarak Command handler içinde bildirim göndermek (queue zorunlu).
- ❌ Template'de TCKN, telefon, email gibi PII.
- ❌ Cross-tenant alıcı (recipient `SchoolId` farklıysa).
