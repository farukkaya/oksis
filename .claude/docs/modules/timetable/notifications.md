# Ders Programı — Notifications

> Bu modülün domain event → bildirim eşleştirmeleri.

> Genel akış için bkz. `backend/notification-rules.md` (teknik) ve `notification-matrix.md` (içerik).

> **Faz 2.6 (2026-06-15) teslim notu — kanal:** Aşağıdaki dağıtımlar şu an **yalnız in-app + SignalR**
> ile gerçekleşir (`InAppNotificationChannel` → `Notification` satırı + `NotificationHub` /hubs/notifications
> canlı push). **Push (FCM) + email ertelendi (Debt-N2)** — FCM altyapısı ve mobil katman henüz yok.
> Sessiz saatler/cooldown da bu fazda **yok (Debt-N3)**; sezon-başı tek-tetik düşük aciliyetli olduğu için.
> Aşağıdaki tablolarda "Push + InApp" gösterimi **hedef** durumdur; bugün fiilen yalnız in-app + SignalR aktiftir.
> Pipeline: domain event → MediatR `INotificationHandler` (commit-after) → `INotificationEnqueuer` (Hangfire)
> → `DispatchNotificationJob` → `NotificationDispatcher` (per-recipient idempotency, delivery-log) →
> `InAppNotificationChannel`. Alıcı çözümü `NotificationRecipientResolver` (şube → öğrenci + veli login
> Account.Id'leri `Person.LinkedAccountId` üzerinden; öğretmen Person→Account). Idempotency:
> `[notifications]` şemasında filtreli unique `(SchoolId, EventId, RecipientAccountId, Channel)`.

---

## Domain Event → Bildirim Akışı

> **Gerçekleşen 5 timetable event'i (Faz 2.6):** `ScheduleProgramPublishedEvent`,
> `ScheduleExceptionCreatedEvent`, `ScheduleExceptionRevokedEvent`, `ScheduleProgramDeletedEvent`
> bildirim üretir; `ScheduleProgramRestoredEvent` **tasarım gereği sessizdir** (aşağıda).

### `ScheduleProgramPublishedEvent`

**Tetiklenme:** SchoolAdmin `POST /api/v1/timetable/programs/{id}/publish` çağırdığında, yayın
(`Publish`) işleminden sonra. Bildirim metni **ilk yayın (v1)** ile **yeniden yayın (vN)** için
farklıdır (sürüm numarasına göre).

- **v1 (ilk yayın, sezon başı):** Etkilenen şubenin tüm tüketicileri için tek bildirim seti. Yüzlerce ayrı push atılmaz.
- **vN (yeniden yayın, sezon ortası):** "Programınız güncellendi" metni.

**İdempotency anahtarı:** `EventId = Combine(ProgramId, Version)`.

**Alıcılar (branch consumers):**

| Alıcı Rol | Kanal (bugün) | Priority | Cooldown |
|---|---|---|---|
| Teacher (etkilenen) | InApp + SignalR (Push hedef = Debt-N2) | Normal | yok (Debt-N3) |
| Parent (etkilenen şubenin) | InApp + SignalR (Push hedef = Debt-N2) | Normal | yok (Debt-N3) |
| Student (etkilenen şubenin) | InApp + SignalR | Low | yok (Debt-N3) |

**Template (TR):**

- İlk yayın (v1):
  - Title: `📅 {AcademicTermName} ders programı yayınlandı`
  - Body (Teacher): `Haftalık programınızı görüntülemek için dokunun.`
  - Body (Parent): `{ChildName} için yeni dönem programı hazır.`
  - Body (Student): `Yeni dönem programı yayınlandı.`

- Yeniden yayın (vN):
  - Title: `📅 Ders programınızda güncelleme var`
  - Body (Teacher): `Programınız güncellendi (sürüm {Version}).`
  - Body (Parent): `{ChildName}'in programında güncelleme var (sürüm {Version}).`

**Kapsam Kontrolü (`NotificationRecipientResolver`):**
- Şube (classroom) → öğrenci (`StudentProfile.CurrentClassroomId`) + veli (`ParentStudentRelationship` aktif) login Account.Id'leri (`Person.LinkedAccountId`).
- Teacher: Person → Account.
- Tenant başına açık `SchoolId` filtresi (cross-tenant alıcı elenir).
- Pasif/login'siz Person'lar elenir (LinkedAccountId yoksa atlanır).

---

### `ScheduleExceptionCreatedEvent`

**Tetiklenme:** Geçici değişiklik (`ScheduleException`) oluşturulduğunda — `POST .../exceptions` (P25).
Tip `Cancellation` ise bildirim türü **TimetableCancelled**, aksi hâlde **TimetableException**.

**İdempotency anahtarı:** `EventId = Combine(ExceptionId, "created")`.

**Alıcılar:** şube tüketicileri (öğrenci + veli) **+ orijinal öğretmen + yeni (vekil) öğretmen**.

| Alıcı Rol | Kanal (bugün) | Priority | Cooldown |
|---|---|---|---|
| Teacher (orijinal) | InApp + SignalR (Push hedef = Debt-N2) | Normal | yok (Debt-N3) |
| Teacher (yeni/vekil) | InApp + SignalR (Push hedef = Debt-N2) | Normal | yok (Debt-N3) |
| Parent (şubenin) | InApp + SignalR | Normal | yok (Debt-N3) |
| Student (şubenin) | InApp + SignalR | Normal | yok (Debt-N3) |

**Template (TR) — istisna tipine göre:**

| ExceptionType | Title | Body (Parent) |
|---|---|---|
| `Cancellation` | `❌ Ders iptal: {Date} {LessonOrder}. ders` | `{ChildName}'in {Date} {LessonOrder}. dersi ({CourseName}) iptal edildi. Sebep: {Reason}` |
| `TeacherSubstitution` | `👤 Öğretmen değişikliği: {Date} {LessonOrder}. ders` | `{ChildName}'in {Date} {CourseName} dersine {NewTeacherName} girecek.` |
| `RoomChange` | `🚪 Derslik değişikliği: {Date} {LessonOrder}. ders` | `{ChildName}'in {Date} {CourseName} dersi {NewRoomCode} dersliğine alındı.` |

> Eski kontrat taslağındaki `TimeChange`/`Combined` tipleri period modelinde kapsam dışıdır (bkz. completion_status sapma kaydı).

---

### `ScheduleExceptionRevokedEvent`

**Tetiklenme:** Aktif bir geçici değişiklik geri alındığında — `POST .../exceptions/{eid}/revoke` (P27).
Bildirim türü **TimetableExceptionRevoked**.

**İdempotency anahtarı:** `EventId = Combine(ExceptionId, "revoked")`.

**Alıcılar:** şube tüketicileri (öğrenci + veli). Kanal InApp + SignalR; priority `Normal`.

**Template (TR):**

- Title: `↩️ Önceki ders programı yürürlüğe girdi`
- Body: `{Date} {LessonOrder}. ders ({CourseName}) için yapılan değişiklik geri alındı. Orijinal program geçerli.`

---

### `ScheduleProgramDeletedEvent`

**Tetiklenme:** Bir program silindiğinde — `DELETE /programs/{id}`. Bildirim türü **TimetableProgramDeleted**.

**İdempotency anahtarı:** `EventId = Combine(ProgramId, "deleted", Version)`.

**Alıcılar:** şube tüketicileri (öğrenci + veli). Kanal InApp + SignalR; priority `Normal`.

**Template (TR):**

- Title: `🗑️ Ders programı kaldırıldı`
- Body: `{ChildName}'in ders programı kaldırıldı. Yeni program yayınlanınca bilgilendirileceksiniz.`

---

### `ScheduleProgramRestoredEvent` — **sessiz (tasarım gereği)**

**Tetiklenme:** Bir sürüm geri yüklendiğinde — `RestoreScheduleVersion` (P32).

**Alıcılar:** **Bildirim gönderilmez (Debt-BE-6, tasarımla kapatıldı).** Geri yükleme **yeni sürüm üretmez**;
program `Revising` (taslak) durumuna düşer. Değişiklik tüketiciye ancak **sonraki yayın**
(`ScheduleProgramPublishedEvent`) ile yansır. Restore için handler **yoktur** — bilinçli sessizdir.

---

### `RoomCreatedEvent`

**Tetiklenme:** `POST /api/v1/timetable/rooms` ile yeni derslik tanımlandığında.

**Alıcılar:** **Bildirim gönderilmez.** Yapılandırma işlemi; sadece audit log ve `IRoomCache.Invalidate(schoolId)` için kullanılır.

---

## Daily Digest (Opsiyonel — Sprint 3+)

**Tetiklenme:** Hangfire recurring job, her gün **20:00** (kullanıcı zaman dilimi).

**Alıcılar:** Bildirim tercihinde "Yarınki ders dijesti" açık olan Parent/Student/Teacher.

**Template (TR):**

- Title: `📚 Yarın {DayName} — {LessonCount} ders`
- Body (Parent): `{ChildName}: {FirstLesson} - {LastLesson}. {ChangeCount > 0 ? "{ChangeCount} değişiklik var" : "Değişiklik yok"}`
- Body (Student): `Yarın {LessonCount} ders, {FirstLesson} - {LastLesson}. İlk ders: {FirstCourseName}.`
- Body (Teacher): `Yarın {LessonCount} dersiniz var, {FirstLesson} - {LastLesson}.`

**Sessiz saat uyumu:** Bu mesaj **Normal** priority — 20:00 sessiz saat sınırının altında, sorun yok. 22:00 sonrası yarınki dijest atılmaz, sabah 07:00 olur.

**Cooldown:** Hangfire job tetikleyici tek; cooldown gereksiz.

---

## Recipient Resolver Notu

`NotificationRecipientResolver` (Faz 2.6 fiili implementasyon) bu modülün event'leri için
şu mantığı uygular:

```
event payload → SchoolId + branch (classroom) Id
  ↓
şube (classroom) → tüketici Account.Id'leri:
  • Student: StudentProfile.CurrentClassroomId == branchId → Person.LinkedAccountId
  • Parent:  ParentStudentRelationship (aktif) → veli Person → Person.LinkedAccountId
  • Teacher: ilgili öğretmen Person → Account (event tipi öğretmen istiyorsa)
  ↓
filtre:
  • LinkedAccountId yoksa (login Account'u yok) atlanır
  • cross-tenant kontrolü: açık SchoolId filtresi (recipient.school_id == event.school_id) — zorunlu
  ↓
final recipient list → DispatchNotificationJob → NotificationDispatcher
  ↓ (per-recipient)
  delivery-log idempotency (SchoolId, EventId, RecipientAccountId, Channel) → InAppNotificationChannel
```

> **Not (Faz 2.6 sınırları):** preference filtresi (Debt-N5), cooldown (Debt-N3) ve quiet-hours (Debt-N3)
> henüz uygulanmadı. Idempotency iki pencerede zayıf (eşzamanlı dispatch + crash/retry) — DB unique index
> backstop'tur; tam exactly-once Outbox gerektirir (Debt-N1, Debt-N6).
>
> Detay: `backend/notification-rules.md` § 5.

---

## Bildirim Tercihleri (Kullanıcı Tarafı — Profile)

Aşağıdaki anahtarlar `user_notification_preferences` tablosunda tutulur; default değerler veli/öğrenci için "açık":

| Key | Default | Açıklama |
|---|---|---|
| `timetable.published` | true | Program yayın bildirimi (`ScheduleProgramPublishedEvent`) |
| `timetable.changed` | true | Geçici değişiklik oluşturma/geri alma (`ScheduleExceptionCreated/RevokedEvent`) |
| `timetable.override.urgent` | true | İptal, yerine geçme, derslik değişikliği (kapatılamaz mı?) |
| `timetable.digest.tomorrow` | false | Yarınki ders dijesti (opt-in) |

> **Faz 2.6 notu:** Bildirim tercihi tabloları henüz uygulanmadı (Debt-N5) — şu an tüm tüketiciler
> ilgili event'i alır; per-kanal/per-tip kullanıcı tercihi sonraki iş.

> **`timetable.override.urgent` kapatılamaz** — pedagojik gereklilik. UI'da disable görünür, neden açıklaması verilir.

---

## Yasaklar

- ❌ Sync olarak Command handler içinde bildirim göndermek (Hangfire queue zorunlu).
- ❌ Template'de TCKN, telefon, email gibi PII.
- ❌ Cross-tenant alıcı (recipient `SchoolId` farklıysa).
- ❌ `ScheduleProgramPublishedEvent` (ilk yayın) için kullanıcı başına 100+ ayrı push — **tek dijest** atılmalı.
- ❌ Sessiz saatte (22:00-07:00) `Priority == Normal/Low` push göndermek — sabah dijestine ertelenir. **Override.urgent istisnadır.**
- ❌ Override için "muhtemelen değiştirilecek" gibi muğlak mesaj — net + aksiyon-yönlü olmalı.
- ❌ Geri alınan override için bildirim atlamak — kullanıcı ilk değişikliği gördü, geri alındığını da görmeli.
