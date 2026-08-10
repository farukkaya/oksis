# Akademik Sezon — Notifications

> Bu modülün domain event'leri tarafından tetiklenen bildirimler. Kanallar, hedef kitleler, içerik şablonları.

> Genel bildirim altyapısı için bkz. proje kökündeki `notification-matrix.md` ve `backend/event-driven-rules.md`.

---

## Genel Yaklaşım

Bu modül **doğrudan bildirim göndermez**. Yalnızca domain event'leri raise eder. `notifications` modülü (cross-cutting) event'lere abone olur ve uygun kanal/şablonu seçer.

```
[Domain]
   raise StudentTransferredEvent
        │
        ▼
[Application — outbox pattern]
   serialize → outbox table
        │
        ▼
[Background worker]
   read outbox → publish to MediatR + SignalR
        │
        ▼
[Notifications module — subscriber]
   resolve template + audience → push/email/in-app
```

**Outbox pattern zorunlu** çünkü:
- Sezon aktivasyonu gibi işlemler DB transaction içinde olmalı; push bildirimi transaction dışı (network failure → ana işlem rollback olmamalı)
- "En az bir kere" garantisi gerek (idempotent subscriber'lar)

---

## Kanallar

- **In-App** (her zaman) — uygulama içinde bell icon, badge sayacı
- **Push** (mobile + web push) — kritik bildirimler için
- **E-posta** — sadece dönem kapatma, sezon aktivasyonu gibi büyük olaylarda
- **SMS** — kapsam dışı (Sprint 1'de yok)

**Sessiz saatler:** 22:00 – 07:00 arası push gönderilmez (queue'da bekler, sabah dağıtılır). Acil olaylar (ki bu modülde yok) için exception. Konfigürasyon: `school-settings.notification-quiet-hours` (Sprint 2).

**Cooldown:** Aynı kullanıcıya aynı event tipinden 1 saat içinde 2'den fazla bildirim gitmez (`StudentAssignedToClassRoomEvent` toplu atama sırasında patlayabilir, gruplanır).

---

## Event → Bildirim Matrisi

| Domain Event | Hedef Kitle | Kanal | Öncelik | Cooldown |
|---|---|---|---|---|
| `AcademicSessionCreatedEvent` | — *(yalnız audit log)* | — | — | — |
| `AcademicSessionActivatedEvent` | Tüm okul kullanıcıları (admin, öğretmen, veli, öğrenci) | Push + In-App + E-posta | Yüksek | Yok |
| `AcademicSessionArchivedEvent` | `SchoolAdmin`, `SchoolStaff` | In-App | Düşük | Yok |
| `AcademicTermActivatedEvent` | Tüm okul kullanıcıları | Push + In-App | Orta | Yok |
| `AcademicTermClosedEvent` ⚠️ | `SchoolAdmin`, `SchoolStaff` (önce); sonra öğretmen/veli/öğrenci karne hazır olunca | In-App (idare); Push (veli — karne hazır olduğunda, ayrı event) | Yüksek | Yok |
| `ClassRoomCreatedEvent` (PendingApproval) | `class-rooms.approve` permission'ı olanlar (genelde `SchoolAdmin`) | Push + In-App | Orta | 1 saat |
| `ClassRoomCreatedEvent` (Active) | — | — | — | — |
| `ClassRoomApprovedEvent` | Oluşturan kullanıcı (`SchoolStaff`) | In-App | Düşük | Yok |
| `ClassRoomHomeroomChangedEvent` | Eski rehber öğretmen, yeni rehber öğretmen | Push + In-App | Orta | Yok |
| `ClassRoomArchivedEvent` | `SchoolAdmin`, `SchoolStaff` | In-App | Düşük | Yok |
| `StudentAssignedToClassRoomEvent` | İlgili öğrenci + veli(leri) | Push + In-App | Orta | 1 saat (toplu atama grupları) |
| `StudentTransferredEvent` | İlgili öğrenci + veli(leri); eski rehber öğretmen + yeni rehber öğretmen | Push + In-App | Orta | Yok |
| `StudentGraduatedEvent` | İlgili öğrenci + veli(leri) | Push + In-App + E-posta (tebrik) | Yüksek | Yok |

---

## Şablonlar

### `AcademicSessionActivatedEvent`

**Audience:** Tüm okul kullanıcıları (tenant scope).

**In-App / Push:**
- **Başlık:** `Yeni eğitim yılı başladı 🎓`
- **Mesaj:** `{{schoolName}}'de {{sessionName}} eğitim yılı aktif edildi. Bilgilerinizi kontrol edebilirsiniz.`

**E-posta:**
- **Konu:** `{{sessionName}} eğitim yılı başladı`
- **Gövde:** Sezon adı, tarih aralığı, 1. dönem başlangıcı, "Okul Yönetimi" imzası.

**Click action:** Uygulamada ana sayfaya yönlendir.

---

### `AcademicTermActivatedEvent`

**Audience:** Tüm okul kullanıcıları.

**In-App / Push:**
- **Başlık:** `{{termTypeName}} başladı`
- **Mesaj:** `{{termTypeName}} bugün ({{startDate}}) başladı. İyi bir dönem geçirmenizi dileriz.`

---

### `AcademicTermClosedEvent` ⚠️

**Audience (faz 1):** İdare (`SchoolAdmin`, `SchoolStaff`)
- **Başlık:** `{{termTypeName}} kapatıldı`
- **Mesaj:** `Notlar kilitlendi. Karne üretim işlemi başlatıldı.`

**Audience (faz 2):** Karne hazır olduğunda — bu modülün sorumluluğunda değil; `report-cards` modülü `ReportCardsPublishedEvent` ile veliye/öğrenciye haber verir.

**Önemli:** Bu modül **karne yayın bildirimini doğrudan göndermez**. Sadece `AcademicTermClosedEvent` raise eder; gerisini `report-cards` modülü halleder.

---

### `ClassRoomCreatedEvent` (PendingApproval)

**Audience:** `class-rooms.approve` permission'ı olan kullanıcılar (genelde `SchoolAdmin`).

**In-App / Push:**
- **Başlık:** `Şube onayınızı bekliyor`
- **Mesaj:** `{{userFullName}} tarafından {{classRoomFullName}} şubesi oluşturuldu. Onaylamak için tıklayın.`

**Click action:** `/admin/academic-sessions/{sessionId}` → Şubeler sekmesi, onay bekleyenler filtresi.

**Cooldown:** 1 saat (toplu şube oluşturma durumunda gruplanır: "3 şube onayınızı bekliyor").

---

### `ClassRoomHomeroomChangedEvent`

**Audience:** Eski + yeni rehber öğretmen.

**Eski rehber:**
- **Başlık:** `{{classRoomFullName}} rehberliğiniz sonlandırıldı`
- **Mesaj:** `Yöneticiniz değişiklik yaptı. Detaylar için okul yönetimiyle iletişime geçin.`

**Yeni rehber:**
- **Başlık:** `{{classRoomFullName}} rehberliğine atandınız`
- **Mesaj:** `Yeni şubeniz {{classRoomFullName}}. Öğrenci listesini görmek için tıklayın.`

---

### `StudentAssignedToClassRoomEvent`

**Audience:** İlgili öğrenci + tüm veli(leri).

**Öğrenci için:**
- **Başlık:** `Şubeniz atandı`
- **Mesaj:** `{{sessionName}} {{termName}} için şubeniz: {{classRoomFullName}}. Rehber öğretmeniniz: {{homeroomTeacherName}}.`

**Veli için:**
- **Başlık:** `{{studentFirstName}}'nin şubesi atandı`
- **Mesaj:** `{{studentFullName}} {{classRoomFullName}} şubesine atandı. Rehber öğretmen: {{homeroomTeacherName}}.`

**Cooldown:** Toplu atama (yıl başında 25 öğrenci aynı şubeye atanır) tek bildirim haline gelir: `"{{className}} şubesi oluşturuldu, {{count}} öğrenci atandı"` (yalnız idareye).

---

### `StudentTransferredEvent`

**Audience:** İlgili öğrenci + veli(leri); eski rehber öğretmen; yeni rehber öğretmen.

**Öğrenci/veli için:**
- **Başlık:** `Şube değişikliği`
- **Mesaj:** `{{studentFirstName}} {{fromClassRoomFullName}} şubesinden {{toClassRoomFullName}} şubesine taşındı. Geçmiş notlar ve devamsızlık eski şubede saklanmaya devam ediyor.`

**Eski rehber için:**
- **Başlık:** `Öğrenci ayrıldı`
- **Mesaj:** `{{studentFullName}}, {{toClassRoomFullName}} şubesine taşındı.`

**Yeni rehber için:**
- **Başlık:** `Yeni öğrenci`
- **Mesaj:** `{{studentFullName}}, sınıfınıza katıldı. ({{fromClassRoomFullName}} → {{classRoomFullName}})`

---

### `StudentGraduatedEvent`

**Audience:** İlgili öğrenci + veli(leri).

**Push:**
- **Başlık:** `Tebrikler 🎓`
- **Mesaj:** `{{studentFirstName}}, mezuniyetini kutlarız. Yeni yolculuğunda başarılar dileriz.`

**E-posta:** Daha kapsamlı tebrik mesajı + okul yöneticisinin imzası.

**Cooldown:** Yok (yılda bir kere tetiklenir).

---

## Permission–Audience Eşleşmesi

Audience hesaplama mantığı:

```csharp
public sealed class NotificationAudienceResolver
{
    public async Task<IReadOnlyList<UserId>> ResolveAsync(
        IDomainEvent @event, CancellationToken ct)
    {
        return @event switch
        {
            AcademicSessionActivatedEvent e =>
                await _users.GetAllInSchoolAsync(e.SchoolId, ct),

            ClassRoomCreatedEvent { Status: ClassRoomStatus.PendingApproval } e =>
                await _users.GetUsersWithPermissionAsync(
                    e.SchoolId, "class-rooms.approve", ct),

            StudentAssignedToClassRoomEvent e =>
                [
                    e.StudentId.AsUserId(),
                    .. await _parents.GetParentsOfStudentAsync(e.StudentId, ct),
                ],

            StudentTransferredEvent e =>
                [
                    e.StudentId.AsUserId(),
                    .. await _parents.GetParentsOfStudentAsync(e.StudentId, ct),
                    .. await _classRooms.GetHomeroomUsersAsync(
                        e.FromClassRoomId, e.ToClassRoomId, ct),
                ],

            _ => []
        };
    }
}
```

---

## Sprint Kapsamı

**Sprint 1:**
- ✅ Domain event'ler raise edilir (`AcademicSessionActivatedEvent`, `ClassRoomCreatedEvent`, vb.)
- ✅ Outbox tablosuna yazılır
- ⏸ Bildirim gönderim altyapısı (push/email) — `notifications` modülü Sprint 2'de açılır

**Sprint 1'de event raise edilir ama push çıkmaz.** Outbox kayıtları birikir, Sprint 2'de "yetişme job'ı" (catch-up) eski olayları taramayacak — yalnız ileri tarihliler için bildirim gider.

**Sprint 2:**
- ✅ `notifications` modülü açılır
- ✅ Push + In-App entegrasyonu
- ✅ Sessiz saatler ve cooldown mantığı

---

## Yasaklar

- ❌ Bu modülün içinden direkt push API çağırmak — sadece domain event raise et.
- ❌ Outbox bypass — event'i memory'de tutup direkt dispatch etmek (data consistency riski).
- ❌ Hassas veriyi push payload'una koymak (sadece referans ID ve kullanıcı dostu metin).
- ❌ Email gönderimini transaction içinde yapmak (network failure → rollback).
- ❌ Aynı event'ten farklı subscriber'lara farklı içerik düzenlemek — şablon merkezi.

> Detay: `backend/event-driven-rules.md`.