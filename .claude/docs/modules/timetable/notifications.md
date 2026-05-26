# Ders Programı — Notifications

> Bu modülün domain event → bildirim eşleştirmeleri.

> Genel akış için bkz. `backend/notification-rules.md` (teknik) ve `notification-matrix.md` (içerik).

---

## Domain Event → Bildirim Akışı

### `SchedulePublishedEvent`

**Tetiklenme:** SchoolAdmin `POST /api/v1/timetable/publish` çağırdığında, `Draft → Published` geçişinden sonra. `publishMode` parametresine göre davranış değişir:

- `publishMode == "Initial"` (sezon başı): Etkilenen tüm Schedule satırları için **tek bir dijest event** yayınlanır. Yüzlerce bildirim atılmaz.
- `publishMode == "MidTerm"`: Sadece `Version > 1` veya yeni eklenen satırlar için bildirim. Değişmemiş satırlar atlanır.

**Alıcılar:**

| Alıcı Rol | Kanal | Priority | Cooldown |
|---|---|---|---|
| Teacher (etkilenen) | Push + InApp | Normal | yok (sezon başı tek tetik) |
| Parent (etkilenen şubenin) | Push + InApp | Normal | yok (sezon başı tek tetik) |
| Student (etkilenen şubenin) | InApp | Low | yok |

**Template (TR):**

- Sezon başı (Initial):
  - Title: `📅 {AcademicTermName} ders programı yayınlandı`
  - Body (Teacher): `Haftalık programınızı görüntülemek için dokunun.`
  - Body (Parent): `{ChildName} için yeni dönem programı hazır.`
  - Body (Student): `Yeni dönem programı yayınlandı.`

- Sezon ortası (MidTerm):
  - Title: `📅 Ders programınızda güncelleme var`
  - Body (Teacher): `{ChangeCount} ders saatiniz güncellendi.`
  - Body (Parent): `{ChildName}'in programında {ChangeCount} değişiklik var.`

**Kapsam Kontrolü:**
- Parent sadece kendi çocuğunun şubesi için bildirim alır (`student_parents.parent_id == recipient.UserId`).
- Teacher sadece kendi `TeacherId`'sini içeren satırlar için.
- Student sadece kendi `BranchId`'si için.
- Pasif/silinmiş kullanıcılar resolver tarafından elenir.

**Deep Link:**
- Mobile: `oksis://timetable/weekly?branchId={...}` (parent için çocuk seçici prefill)
- Web: `https://{tenant}/timetable/branch/{branchId}`

---

### `ScheduleSupersededEvent`

**Tetiklenme:** Published bir Schedule, `PUT /schedules/{id}` ile yeni versiyona geçtiğinde. Tek satır = tek event.

**Alıcılar:**

| Alıcı Rol | Kanal | Priority | Cooldown |
|---|---|---|---|
| Teacher (eski + yeni — farklıysa ikisi de) | Push + InApp | Normal | 1 saat |
| Parent (etkilenen şubenin) | Push + InApp | Normal | 1 saat |
| Student (etkilenen şubenin) | Push + InApp | Low | 1 saat |

> **Cooldown 1 saat:** Aynı kullanıcı 1 saat içinde aynı `branch_id` için 2+ supersede event alırsa **tek dijest** push olur ("3 değişiklik var").

**Template (TR):**

- Title: `📅 Programda değişiklik: {DayName} {LessonOrder}. ders`
- Body (Parent): `{ChildName}'in {DayName} {LessonOrder}. dersi güncellendi. {OldSummary} → {NewSummary}`
- Body (Teacher, eski): `Bu derse artık atanmıyorsunuz: {DayName} {Time} {BranchName} {CourseName}`
- Body (Teacher, yeni): `Yeni dersiniz: {DayName} {Time} {BranchName} {CourseName}`

`{OldSummary}` ve `{NewSummary}` örnek: `"Matematik / Ayşe Y. / B-12"`.

**Kapsam:** SchedulePublishedEvent ile aynı (etkilenen şube + ilgili öğretmenler).

---

### `ScheduleOverrideCreatedEvent`

**Tetiklenme:** `POST /api/v1/timetable/overrides` ile tek günlük değişiklik oluşturulduğunda. Override aktif statüde ilk yazıldığında.

**Alıcılar:**

| Alıcı Rol | Kanal | Priority | Cooldown |
|---|---|---|---|
| Teacher (orijinal, eğer Cancellation/Substitution ise) | Push + InApp | **High** | yok (anlık) |
| Teacher (yerine giren, Substitution/Combined ise) | Push + InApp | **High** | yok — ayrıca `TeacherSubstitutionAssignedEvent` tetiklenir |
| Parent (şubenin) | Push + InApp | **High** | 15 dk |
| Student (şubenin) | Push + InApp | **High** | 15 dk |

> **Priority High:** Acil; **sessiz saatler dahi ihlal edilir** çünkü ertesi gün dersi etkiler (örn. 22:30'da "yarın 3. ders iptal").

> **Cooldown 15 dk:** Aynı şubeye 15 dk içinde 2+ override gelirse dijest ("3 değişiklik var").

**Template (TR) — override tipine göre:**

| OverrideType | Title | Body (Parent) |
|---|---|---|
| `Cancellation` | `❌ Ders iptal: {Date} {LessonOrder}. ders` | `{ChildName}'in {Date} {LessonOrder}. dersi ({CourseName}) iptal edildi. Sebep: {Reason}` |
| `TeacherSubstitution` | `👤 Öğretmen değişikliği: {Date} {LessonOrder}. ders` | `{ChildName}'in {Date} {CourseName} dersine {NewTeacherName} girecek.` |
| `RoomChange` | `🚪 Derslik değişikliği: {Date} {LessonOrder}. ders` | `{ChildName}'in {Date} {CourseName} dersi {NewRoomCode} dersliğine alındı.` |
| `TimeChange` | `🕒 Saat değişikliği: {Date} {LessonOrder}. ders` | `{ChildName}'in {Date} {CourseName} dersi {NewStartTime}-{NewEndTime} olarak değişti.` |
| `Combined` | `📌 Ders güncellendi: {Date} {LessonOrder}. ders` | `{ChildName}'in {Date} {CourseName} dersinde birden fazla değişiklik var. Detay için dokunun.` |

**Deep Link:**
- Mobile (Parent): `oksis://timetable/today?date={overrideDate}&childId={...}&highlight={overrideId}`
- Mobile (Student/Teacher): `oksis://timetable/today?date={overrideDate}&highlight={overrideId}`

---

### `ScheduleOverrideRevertedEvent`

**Tetiklenme:** Aktif bir override `DELETE /api/v1/timetable/overrides/{id}` ile geri alındığında.

**Alıcılar:** Aynı `ScheduleOverrideCreatedEvent` ile — ama priority `Normal` (geri alma genelde acil değil).

**Template (TR):**

- Title: `↩️ Önceki ders programı yürürlüğe girdi`
- Body: `{Date} {LessonOrder}. ders ({CourseName}) için yapılan değişiklik geri alındı. Orijinal program geçerli.`

---

### `TeacherSubstitutionAssignedEvent`

**Tetiklenme:** Override tipi `TeacherSubstitution` veya `Combined` (yeni teacher set edildiyse) — yerine giren öğretmenin bilgilendirilmesi için **ayrı bir event** (ScheduleOverrideCreatedEvent paralel).

**Alıcılar:**

| Alıcı Rol | Kanal | Priority | Cooldown |
|---|---|---|---|
| Teacher (yeni — yerine giren) | Push + InApp + (opsiyonel) SMS | **High** | yok |

> **Neden ayrı event:** Yerine giren öğretmen için **çok özel bir bilgilendirme** gerekir — şube, ders, saat, derslik, telafi/yıllık plan referansı. Şube velisine giden mesajla aynı şablon olamaz.

**Template (TR):**

- Title: `👤 Yerine geçme görevi: {Date} {DayName} {LessonOrder}. ders`
- Body: `{Date} {Time} arası {BranchName} sınıfında {CourseName} dersini siz gireceksiniz. Derslik: {RoomCode}. Sebep: {Reason}`

---

### `ScheduleArchivedEvent`

**Tetiklenme:** `POST /api/v1/timetable/schedules/{id}/archive` çağrıldığında. Genellikle Supersede akışı içinde otomatik (eski versiyon arşivlenir).

**Alıcılar:** **Bildirim gönderilmez.** Bu sadece audit ve cache invalidation için sistem event'idir. Veliye/öğretmene "satır arşivlendi" demek anlamsız — onlar `ScheduleSupersededEvent` üzerinden zaten haberdar.

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

`INotificationRecipientResolver` bu modülün event'leri için şu mantığı uygular:

```
event payload → SchoolId + ScheduleId (veya OverrideId, BranchId)
  ↓
Schedule'dan branch_id + teacher_id çek
  ↓
related users'ı bul:
  • Teacher: schedules.teacher_id == users.teacher_id
  • Parent:  student_parents.parent_id WHERE students.branch_id == schedules.branch_id
             AND student_parents.can_view_attendance == 1
  • Student: students.user_id WHERE students.branch_id == schedules.branch_id
  ↓
filtre:
  • user.is_deleted == 0
  • user.status == Active
  • cross-tenant kontrolü (recipient.school_id == event.school_id) — zorunlu
  • preference (kullanıcı bu event tipi için bildirim açık mı)
  • cooldown (son N dakikada aynı event geldi mi)
  • quiet hours (priority High değilse 22:00-07:00 ertelenir)
  ↓
final recipient list → notification queue
```

> Detay: `backend/notification-rules.md` § 5.

---

## Bildirim Tercihleri (Kullanıcı Tarafı — Profile)

Aşağıdaki anahtarlar `user_notification_preferences` tablosunda tutulur; default değerler veli/öğrenci için "açık":

| Key | Default | Açıklama |
|---|---|---|
| `timetable.published` | true | Sezon başı/ortası yayın bildirimi |
| `timetable.changed` | true | Schedule supersede |
| `timetable.override.urgent` | true | İptal, yerine geçme, derslik/saat değişikliği (kapatılamaz mı?) |
| `timetable.digest.tomorrow` | false | Yarınki ders dijesti (opt-in) |

> **`timetable.override.urgent` kapatılamaz** — pedagojik gereklilik. UI'da disable görünür, neden açıklaması verilir.

---

## Yasaklar

- ❌ Sync olarak Command handler içinde bildirim göndermek (Hangfire queue zorunlu).
- ❌ Template'de TCKN, telefon, email gibi PII.
- ❌ Cross-tenant alıcı (recipient `SchoolId` farklıysa).
- ❌ `SchedulePublishedEvent` (Initial mode) için kullanıcı başına 100+ ayrı push — **tek dijest** atılmalı.
- ❌ Sessiz saatte (22:00-07:00) `Priority == Normal/Low` push göndermek — sabah dijestine ertelenir. **Override.urgent istisnadır.**
- ❌ Override için "muhtemelen değiştirilecek" gibi muğlak mesaj — net + aksiyon-yönlü olmalı.
- ❌ Geri alınan override için bildirim atlamak — kullanıcı ilk değişikliği gördü, geri alındığını da görmeli.
