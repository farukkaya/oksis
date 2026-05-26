# Kullanıcı Yönetimi — Notifications

> Bu modülün domain event → bildirim eşleştirmeleri.

> Genel akış için bkz. `backend/notification-rules.md` (teknik) ve `notification-matrix.md` (içerik).

> **Genel kural:** Tüm bildirim gönderimi **async** — Command handler içinde sync gönderim yasak. MediatR domain event publish edilir, `notifications` modülünün handler'ı queue'ya yazar, Hangfire worker gönderir.

---

## Domain Event → Bildirim Akışı

### `UserInvitedEvent`

**Tetiklenme:** `Invitation.MarkSent()` çağrıldığında (genelde `Invitation.Create` ardından otomatik).

**Payload (event):**
```csharp
record UserInvitedEvent(
    Guid InvitationId,
    Guid SchoolId,
    Guid PersonId,
    Guid TargetRoleId,
    string TokenPlain,  // sadece event payload'da, log'a düşmez
    string Channel,     // Email | Sms | Both
    DateTimeOffset ExpiresAt,
    string ConsentBundleVersion,
    string InvitedByPersonName);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Davet edilen Person (Email var ise) | Email | High | yok (manuel re-send'e izin var) |
| Davet edilen Person (Phone var ise + Channel ∈ Sms/Both) | SMS | High | yok |

**Template (TR — Email):**
- Subject: `{SchoolName} — OKSİS davetiniz`
- Body:
  ```
  Merhaba {FirstName},

  {InvitedByPersonName}, sizi {SchoolName} OKSİS sistemine {RoleDisplayName} olarak davet etti.

  Hesabınızı oluşturmak için aşağıdaki linke tıklayın:
  {AcceptUrl}

  Davet, {ExpiresAtLocal} tarihine kadar geçerlidir.
  ```

**Template (TR — SMS):**
```
{SchoolName} OKSİS davet linkiniz: {ShortAcceptUrl}
Geçerlilik: {ExpiresAtShort}
```

**Kapsam Kontrolü:**
- Person `SchoolId` ile event `SchoolId` eşleşmek zorunda.
- Token plain text **sadece** email/SMS body'sine girer; log'a, header'a, audit'e yazılmaz.
- `Person.PrimaryEmail` null ve `Channel = Email` ise event silently skip (audit'e "no email" not düşülür).

---

### `InvitationAcceptedEvent`

**Tetiklenme:** `Invitation.Accept(...)` başarılı sonrası.

**Payload:**
```csharp
record InvitationAcceptedEvent(
    Guid InvitationId,
    Guid SchoolId,
    Guid PersonId,
    Guid AccountId,
    Guid SeasonId);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Davet eden SchoolAdmin/Staff (`Invitation.CreatedBy`) | InApp | Normal | 1 saat (toplu davetlerde gruplama için) |
| Kabul eden Person (kendisi) | Email | Normal | yok |

**Template (Email — Person'a):**
- Subject: `{SchoolName} — Hesabınız oluşturuldu`
- Body: hoşgeldin mesajı + ilk giriş linki + parolayı unutursam ne yapmalıyım

**Template (InApp — Davet eden'e):**
- `{FullName} davetinizi kabul etti.`
- Toplu davet ise cooldown 1 saat → "Son 1 saatte 5 kişi davetinizi kabul etti" şeklinde gruplanır.

---

### `InvitationExpiredEvent`

**Tetiklenme:** Hangfire `InvitationExpirySweepJob` günde 1 kez çalışır (her sabah 06:00 UTC); `expires_at < now AND status IN (Created, Sent, Opened)` olanları `Expired` yapar.

**Payload:**
```csharp
record InvitationExpiredEvent(Guid InvitationId, Guid SchoolId, Guid PersonId);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Davet eden SchoolAdmin/Staff | InApp | Low | 24 saat (günde 1 özet) |

> Tek tek bildirim yerine günlük özet: "3 davet bugün süresini doldurdu, görüntüleyin" — link `/admin/invitations?tab=expired`.

---

### `InvitationRevokedEvent`

**Tetiklenme:** SchoolAdmin `POST /invitations/{id}/revoke` çağırdığında.

**Payload:**
```csharp
record InvitationRevokedEvent(Guid InvitationId, Guid SchoolId, Guid PersonId, string Reason);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Davet edilen Person (varsa Email) | Email | Low | yok |

**Template:**
- Subject: `{SchoolName} — Davetiniz iptal edildi`
- Body: yöneticinizle iletişime geçin; gerekirse yeni davet aldığınızda yeniden deneyin.

> Token plain text bu event'te **yer almaz** (zaten revoke edildi).

---

### `PersonSuspendedEvent`

**Tetiklenme:** `Person.Suspend(reason)`.

**Payload:**
```csharp
record PersonSuspendedEvent(Guid PersonId, Guid SchoolId, string Reason);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Suspended Person (varsa Email) | Email | High | yok |
| Bağlı veliler (Person öğrenci ise, `IsPrimaryContact = true` olanlar) | Email + Push | High | yok |
| Suspended Person'ın aktif RoleAssignment'lı `LinkedAccount`ı varsa → `identity.LogoutAllSessions` event'i de tetikler | — | — | — |

**Template (Person'a, Email):**
- Subject: `{SchoolName} — Hesabınız askıya alındı`
- Body: `{Reason}` (sanitize edilmiş, sadece yönetici tarafından girilebilir alan); yardım için iletişim bilgileri.

---

### `PersonArchivedEvent`

**Tetiklenme:** `Person.Archive(reason)` — KVKK retention'ı bitince veya manuel olarak.

**Payload:**
```csharp
record PersonArchivedEvent(Guid PersonId, Guid SchoolId, string Reason);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| SchoolAdmin (audit özet) | InApp | Low | günlük özet |

> Kullanıcının kendisine bildirim **gönderilmez** — Archive aşamasında zaten hesap kapatılmıştır.

> Bu event ayrıca **downstream sinyal** olarak `BillingModule`, `AttendanceModule`, `ExamModule`, `MessagingModule`'a gider; her biri kendi verilerini anonimleştirir.

---

### `ConsentGrantedEvent`

**Tetiklenme:** `ConsentRecord.Grant(...)`.

**Payload:**
```csharp
record ConsentGrantedEvent(
    Guid SchoolId,
    Guid PersonId,
    string ConsentType,
    string BundleVersion,
    DateTimeOffset GrantedAt);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| (kullanıcıya bildirim **yok**) | — | — | — |

> Sessiz event. Sadece downstream modüllerin "bu kişi bu veri türüne erişim verdi" filtresini açması için kullanılır.

---

### `ConsentRevokedEvent`

**Tetiklenme:** `ConsentRecord.Revoke(reason)`.

**Payload:**
```csharp
record ConsentRevokedEvent(
    Guid SchoolId,
    Guid PersonId,
    string ConsentType,
    string BundleVersion,
    string Reason,
    DateTimeOffset RevokedAt);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Geri çeken Person (kendisi) | Email | Normal | yok (onay metni içerir) |
| SchoolAdmin (sadece `DataProcessing` türü geri çekildiyse) | InApp | High | yok |

**Template (Person'a):**
- Subject: `{SchoolName} — "{ConsentTypeLocalized}" onayınız geri alındı`
- Body: hangi özellikler kapanacak (tipik: pazarlama mesajları, fotoğraf paylaşımı vs.); fikrinizi değiştirirseniz tekrar onaylayabilirsiniz.

**Template (Admin'e, sadece `DataProcessing` için):**
- `{FullName} (kullanıcı ID: {PersonId}) "Veri İşleme" onayını geri çekti. Hesap askıya alma akışı tetiklenecek.`

> **Downstream sinyal:** Tüm modüller `ConsentRevokedEvent` dinler ve ilgili veri türüne erişimi kapatır:
> - `MessagingModule` → `Marketing` revoke ise pazarlama mesajı göndermez
> - `GalleryModule` → `PhotoUsage` revoke ise fotoğraflar gizlenir
> - `HealthModule` → `MedicalSharing` revoke ise sağlık bilgisi maskeli görünür

---

### `ParentStudentLinkedEvent`

**Tetiklenme:** `ParentStudentRelationship.Create(...)`.

**Payload:**
```csharp
record ParentStudentLinkedEvent(
    Guid RelationshipId,
    Guid SchoolId,
    Guid ParentPersonId,
    Guid StudentPersonId,
    string RelationType,
    bool IsPrimaryContact);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Parent Person (LinkedAccount varsa) | Push + InApp | Normal | yok |
| Student Person (yaş > 13 ve LinkedAccount varsa) | InApp | Low | yok |

**Template (Parent'a):**
- `{StudentFullName} hesabınıza bağlandı. Çocuğunuzun bilgilerine OKSİS'ten erişebilirsiniz.`

---

### `ParentStudentRevokedEvent`

**Tetiklenme:** `ParentStudentRelationship.Revoke(reason)`.

**Payload:**
```csharp
record ParentStudentRevokedEvent(
    Guid RelationshipId,
    Guid SchoolId,
    Guid ParentPersonId,
    Guid StudentPersonId,
    string Reason);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Parent Person | Email + Push | High | yok |
| SchoolAdmin (audit özeti) | InApp | Low | günlük özet |

> Mahkeme kararı vb. gerekçelerle ilişki sonlandırıldığında parent bilgilendirilir; metin yöneticilik tarafından özelleştirilebilir (`reason` sanitize edilerek body'e geçer veya kapsam dışında tutulur).

---

### `RoleAssignedEvent`

**Tetiklenme:** `RoleAssignment.Create(...)` (davet kabul sonrası veya doğrudan atama).

**Payload:**
```csharp
record RoleAssignedEvent(
    Guid SchoolId,
    Guid PersonId,
    Guid SystemRoleId,
    Guid SeasonId);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Person (varsa LinkedAccount) | InApp | Normal | yok |

**Template:**
- `{SeasonName} sezonu için "{RoleDisplayName}" rolüne atandınız.`

> Davet akışı içindeki ilk atama için bu bildirim **bastırılır** (zaten `InvitationAcceptedEvent` ile karşılama mesajı gitti).

---

### `StudentGraduatedEvent`

**Tetiklenme:** `Person.Graduate(seasonId)`.

**Payload:**
```csharp
record StudentGraduatedEvent(
    Guid PersonId,
    Guid SchoolId,
    Guid SeasonId,
    DateOnly GraduatedAt);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Mezun Person | Email | Normal | yok |
| Bağlı veliler (`IsPrimaryContact = true`) | Email | Normal | yok |

**Template:**
- Subject: `{SchoolName} — Mezuniyet`
- Body: tebrik mesajı + mezun portal'ı bilgisi (henüz aktif değilse "yakında aktif olacak").

---

### `StudentTransferredEvent`

**Tetiklenme:** `Person.Transfer(reason, toSchoolId?)`.

**Payload:**
```csharp
record StudentTransferredEvent(
    Guid PersonId,
    Guid SchoolId,
    Guid? FromSeasonId,
    Guid? ToSchoolId,
    string Reason);
```

**Alıcılar:**

| Alıcı | Kanal | Priority | Cooldown |
|---|---|---|---|
| Bağlı veliler | Email | High | yok |
| SchoolAdmin (audit) | InApp | Low | yok |

---

## Recipient Resolver Notu

`INotificationRecipientResolver` Users modülünün event'leri için şu mantığı uygular:

```
event payload → SchoolId + PersonId (+ ek context)
  ↓
Person'u çek (LinkedAccountId, PrimaryEmail, PrimaryPhone)
  ↓
ilişkili Person'ları bul:
  - Öğrenci ise → veliler (ParentStudentRelationship.IsPrimaryContact = true)
  - Veli ise → kendisi
  - Öğretmen/Staff ise → kendisi + (gerekiyorsa) okul yöneticisi
  ↓
her recipient için:
  - NotificationPreference (kullanıcı kanal tercihi) kontrol
  - Cooldown kontrolü (Redis)
  - QuietHours kontrolü (örn. 22:00 - 07:00 sadece High priority)
  - ConsentRecord kontrolü (örn. SMS için SmsContact onayı zorunlu)
  ↓
final recipient list → kuyruğa yaz
```

> Detay: `backend/notification-rules.md` § 5.

---

## Onay Bazlı Kanal Kapısı

Bazı kanalların kullanımı için kullanıcının özel onay vermiş olması gerekir:

| Kanal | Gerekli Onay |
|---|---|
| Marketing email | `ConsentRecord(type=Marketing, status=Granted)` |
| SMS (genel) | `ConsentRecord(type=SmsContact, status=Granted)` |
| Push notification | Cihaz token + `ConsentRecord(type=DataProcessing)` |
| Email (zorunlu: davet, parola sıfırlama) | `DataProcessing` onayı yeterli |

> Operasyonel zorunlu bildirimler (davet, parola sıfırlama, hesap askıya alma) `Marketing` veya `SmsContact` onayından bağımsızdır. `DataProcessing` reddedilirse zaten hesap açılmaz.

---

## Yasaklar

- ❌ Sync olarak Command handler içinde bildirim göndermek — MediatR domain event + queue zorunlu.
- ❌ Template'de TCKN, telefon, email, parola, davet token plain text gibi PII.
- ❌ Cross-tenant alıcı — recipient `SchoolId` farklıysa.
- ❌ Davet token'ı log'a, audit'e veya InApp bildirime yazmak (sadece dış kanal body).
- ❌ Onay (`Consent`) gerektiren kanalı onay yokken kullanmak.
- ❌ `QuietHours` içinde Low priority bildirim göndermek.
- ❌ Aynı event için aynı recipient'a `cooldown` ihlali (Redis sayaç ihlal etmesin).
