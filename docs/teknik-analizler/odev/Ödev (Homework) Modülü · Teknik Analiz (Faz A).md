# OKSİS — Ödev (Homework) Modülü · Teknik Analiz (Faz A)

|||
|---|---|
|**Belge türü**|Teknik analiz (mimari + uygulama tasarımı)|
|**Kapsam**|`oksis-api` (Domain / Application / Infrastructure / Api) + `oksis-ui` (web + mobil sözleşme, mock, bağlama borçları)|
|**Girdi**|`odev-modulu-ihtiyac-analizi-final-2026-08-25.md` (K-1…K-13, BR-HW-01…16, §6 yetki, §7 bildirim, §8 ekran envanteri) + 9 ekranlık Claude Design sipariş paketi|
|**Tarih**|26 Ağustos 2026|
|**Durum**|Görüşe açık → onaylanınca dilimlere bölünüp geliştirmeye başlanır|
|**Faz A dışı**|Tam dijital teslim mekaniği (Faz B), not defterine akış (V2), push kanalı (ayrı paket)|

> **Doğrulama notu:** `oksis-api` ve `oksis-ui` repoları bu oturumda erişilebilir değildi (özel repo). Repo yapısına dair her varsayım Not modülü teknik analizinde (23 Ağustos) doğrulanmış kalıplardan türetildi ve repo-bağımlı noktalar **`[D]` = doğrulanacak** ile işaretlendi. Karar bekleyen noktalar **`[KB]`**. Geliştirmeye başlamadan `[D]`'ler kapatılmalıdır.

> **Kaynak hiyerarşisi (Grades'ten fark):** Grades'te davranışın tek kaynağı çalışan MSW mock'uydu. Ödev'de henüz mock **yok** — bu analiz + 9 tasarım promptu kaynak; Dilim 0'da yazılacak `homework` sözleşmesi ve MSW mock'u bundan sonra tek kaynak olur ("mock kazanır" kuralı orada devreye girer).

---

## 1. Genel Bakış

### 1.1 Problem

Ödev modülünün kod karşılığı sıfır: `Application/Modules/Homework` altında yalnız README iskeleti `[D]`, UI'da öğretmen/öğrenci/veli tab bar'larında Ödev sekmeleri "Planlandı" kabuğu `[D]`. Buna karşılık 9 ekranın tasarımı sipariş edildi ve ihtiyaç analizi tüm davranış kurallarını (BR-HW-01…16) kilitledi. Bu belge, o kuralları Clean Architecture + CQRS kalıbında **inşa edilebilir** bir tasarıma çevirir.

Modülün iki yeni teknik yükü var: (a) **görsel teslim** — dosya altyapısının (Garage) ilk öğrenci-üretimi içerik tüketicisi; (b) **günlük özet bildirimi** — bildirim sisteminin ilk gerçek birleştirme (digest) vakası.

### 1.2 Tasarım hedefleri

|#|Hedef|Teknik karşılığı|
|---|---|---|
|H1|Sözleşme-önce geliştirme|Dilim 0'da `contract.ts` + MSW mock yazılır; her dilimin çıkış kriteri: MSW kapatılınca ekran **aynı** davranır (§10)|
|H2|İşaretleme tek yetkili kaynak|Yükleme (`HomeworkSubmissionFile`) tracking durumunu **asla** değiştirmez; durum yalnız `MarkTrackingStatus` komutuyla değişir (BR-HW-15)|
|H3|İzin ≠ kapsam|RBAC kodu + `TeachingAssignment` kapsam kapısı + aile kapsamı + öğrenci self-kapsamı, handler seviyesinde (§4)|
|H4|K-8 wire seviyesinde|Yönetim uçları öğretmen filtresi/gruplama **parametresi açmaz**; kümülatif öğretmen görünümü API'de üretilemez|
|H5|Durum türetilir, saklanmaz|"Süresi Doldu" saklanan durum değil `DueDate` türevi — gece yarısı durum-çevirme job'ı yok (§2.4)|
|H6|Bildirim gürültüsüzlüğü|Eksik/Yapılmadı varsayılan **günlük özet** job'ıyla; anında mod okul politikası; yayın birleştirme penceresi (§3.11)|
|H7|Modül sınırı|Homework tüketicidir: roster `ClassRooms`'a, görevlendirme `Teachers`'a, dosya `Files`'a, dönem `AcademicSessions`'a aittir; cross-modül yalnız ID|

### 1.3 Onaylı tech stack

|Katman|Teknoloji|
|---|---|
|API|.NET 10, Clean Architecture, CQRS/MediatR, Vertical Slice, Modular Monolith|
|Persistence|EF Core (yazma, tracking) · Dapper (liste/ızgara/yoğunluk/kontrol-bekleyen projeksiyonları) · MSSQL|
|Doğrulama / eşleme|FluentValidation · Mapster|
|Dosya|`IStorageService` (Garage, S3-uyumlu, tenant bucket `oksis-t{SchoolId}`, 25MB proxy/presigned eşiği)|
|Yatay|Serilog (structured), Redis, Hangfire (3 job), SignalR (bu modülde kullanılmaz), Scalar|
|Auth|Custom JWT + refresh token rotation, `[RequirePermission]` + handler kapsam kapısı|
|UI|`oksis-ui` monorepo: `apps/web` (React 18/TS/Vite/TanStack Query v5/Zustand), `apps/mobile` (RN/Expo/NativeWind), `packages/api` (sözleşme), `packages/api-mocks` (MSW) `[D]` yerleşim|

### 1.4 Hacim

**5 tablo** (`Homework`, `HomeworkTrackingRecord`, `HomeworkAttachment`, `HomeworkSubmissionFile`, `HomeworkAuditEntry`) · `SchoolSettings`'e **3 kolon** · **3 izin kodu** (`homework.read/.write/.manage`) · **12 komut + 10 sorgu + ~22 rota** · **2 migration** · **3 Hangfire job** · **5 bildirim olay tipi** · **5 dilim**.

---

## 2. Domain Modeli

Ad kuralı: `Homework` = ödevin kendisi (tek ödev, tek şube — K-1: çoklu şube = çoklu kayıt). `HomeworkTrackingRecord` = teslim takip kaydı. Cross-modül referanslar **yalnız ID**; navigation property açılmaz.

### 2.1 Aggregate sınırları

```
Homework (root)
├── HomeworkAttachment        (child — öğretmen ekleri, ödevle yaşar)
├── HomeworkTrackingRecord    (child — hedef öğrenci başına 1; yüksek yazma, satır bazlı komutla güncellenir)
│   └── HomeworkSubmissionFile (child — öğrenci yüklemeleri, ≤5 aktif)
└── (append-only, aggregate dışı) HomeworkAuditEntry
```

Tracking kaydı ayrı aggregate **yapılmaz**: invariant'ları (hedef üyeliği, Exempt gerekçesi, ≤5 dosya) ödevin durumuna bağlı; ama işaretleme komutları root'u yüklemeden satırı hedefler (EF `Attach` + `RowVersion` yalnız root'ta, satırda gerekmez — işaretleme last-write-wins kabul edilebilir, izi audit tutar).

### 2.2 Entity'ler

**`Homework`**

|Alan|Tip|Not|
|---|---|---|
|`Id, SchoolId`|Guid|tenant global filter|
|`AcademicSessionId`|Guid|**sezon hard partition** (K-11)|
|`AcademicTermId`|Guid|`DueDate`'ten resolver ile çözülür, **soft filtre** için saklanır; dönem sınırı davranış değiştirmez|
|`ClassRoomId, SubjectId`|Guid||
|`OwnerTeacherPersonId`|Guid|sahip; işaretleme yetkisi sahibindir (§6 karar)|
|`Title`|nvarchar(200)||
|`Description`|nvarchar(max)|sade metin (zengin metin yok)|
|`DueDate`|date|**saat yok** (K-6); iç son an 23:59 yorumu sunucuda|
|`TargetType`|enum|`WholeClass` \| `SelectedStudents`|
|`SubmissionType`|enum|`TeacherCheck` \| `DigitalUpload` — Faz A'da yalnız `TeacherCheck` yazılabilir (K-2, validator zorlar)|
|`Status`|enum|`Draft` \| `Published` \| `Closed` \| `Cancelled`|
|`PublishedAt, ClosedAt, CancelledAt`|datetimeoffset?||
|`CancelReason`|nvarchar(500)?|zorunlu iptalde|
|`SourceHomeworkId`|Guid?|çoklu şube yayınında kardeş kayıtları bağlar (aynı komuttan doğanlar ortak kökü işaret eder)|
|`IsDeleted, RowVersion`||soft delete + yayın/iptal yarışı|

Davranışlar (domain metotları): `Publish(now)` (BR-HW-02: `DueDate >= today` değilse `HomeworkDomainException`), `Cancel(reason)`, `Close()`, `UpdateContent(...)` (Draft serbest; Published → `HomeworkUpdatedEvent`), `IsOverdue(today)` => `Status == Published && DueDate < today` (**türetilir, saklanmaz** — H5).

**`HomeworkTrackingRecord`**

|Alan|Tip|Not|
|---|---|---|
|`Id, SchoolId, HomeworkId`|Guid||
|`StudentPersonId`|Guid|benzersiz `(HomeworkId, StudentPersonId)`|
|`Status`|enum|`Unmarked` \| `Completed` \| `Incomplete` \| `NotDone` \| `Exempt`|
|`ExemptReason`|nvarchar(500)?|`Exempt`'te zorunlu (BR-HW-07); yalnız yönetici uçlarında serileştirilir|
|`MarkedAt, MarkedByPersonId`||son işaretleme|
|`AddedAfterPublish`|bit|BR-HW-13 ile sonradan açılan kayıt işareti|

**`HomeworkAttachment`** — `Id, HomeworkId, Kind (File|Link), FileId?` (Files modülü ID'si, yalnız ID), `Url?`, `DisplayName`, `SortOrder`.

**`HomeworkSubmissionFile`** — `Id, SchoolId, TrackingRecordId, FileId, UploadedAt, RemovedAt?, RemovedByPersonId?, RemoveReason?`. İdari kaldırma **soft** (satır kalır, dosya erişimi kapanır — izlenebilirlik + KVKK silme talebi ayrı süreç). Invariant: aktif (`RemovedAt == null`) dosya sayısı ≤ 5 (BR-HW-16).

**`HomeworkAuditEntry`** — append-only: `Id, SchoolId, HomeworkId, TrackingRecordId?, Kind, ActorPersonId, IsSystem, OccurredAt, FromStatus?, ToStatus?, Reason?, Detail?`. Kapsanan olaylar: `Published`, `PublishedOnBehalf`, `Updated` (alan özeti `Detail`'de), `Cancelled`, `Closed`, `StatusMarked` (satır başına — hacim ödev başına ≤ hedef sayısı, kabul edilebilir), `BulkCompleted` (**tek özet satır**: "9 öğrenci toplu Tamamlandı"), `ExemptSet`, `SubmissionRemovedByAdmin`, `RecordAddedAfterPublish` (sistem).

### 2.3 Enum'lar

`HomeworkStatus`, `HomeworkTargetType`, `HomeworkSubmissionType`, `TrackingStatus`, `HomeworkAttachmentKind`, `HomeworkAuditKind`. Wire'da hepsi **string** (proje kuralı).

### 2.4 Durum makinesi (`Homework`)

```
Draft ──publish──▶ Published ──close──▶ Closed
  │                    │
  └──delete(soft)      └──cancel(reason)──▶ Cancelled
```

|Geçiş|Kim|Kural|
|---|---|---|
|`Draft → Published`|sahip (`homework.write`) · idare `:publish-for` (`homework.manage`, yalnız sahibi ayrılmış taslak)|BR-HW-02 tarih; hedef materialize edilir (§3.4); bildirim|
|`Published → Cancelled`|sahip veya idare, gerekçeli|bildirim; tracking salt-okunur olur|
|`Published → Closed`|sahip (idare kapatamaz — izleyicidir)|yükleme kapanır (BR-HW-15); tracking salt-okunur|
|`Draft → (silindi)`|sahip|sessiz, bildirimsiz (BR-HW-03)|
|Yasak|`Published → Draft` (yayın geri alınamaz, BR-HW-04) · `Closed/Cancelled → *` · kapalı sezonda her yazma|409 `invalid_state`|

**"Süresi Doldu" saklanmaz:** UI çipi `status == Published && dueDate < today` türevidir; sözleşmede `isOverdue: boolean` sunucu-hesaplı alan olarak döner (istemci saat dilimi hesabı yapmaz — okul günü sınırı sunucuda, `[KB-5]` saat dilimi kaynağı: `SchoolSettings.TimeZone` `[D]` var mı?).

### 2.5 Domain event'ler

`HomeworkPublishedEvent(HomeworkId, ClassRoomId, TargetStudentIds)` · `HomeworkUpdatedEvent(HomeworkId, ChangedFields)` · `HomeworkCancelledEvent(HomeworkId, Reason)` · `TrackingMarkedMissingEvent(TrackingRecordId, Status)` (yalnız `Incomplete|NotDone`'a geçişte) · `HomeworkClosedEvent(HomeworkId)`. Bildirim eşlemesi §3.11.

---

## 3. oksis-api Tasarımı

### 3.1 Mimari yerleşim

```
src/Oksis.Domain/Modules/Homework/
├── Entities/        Homework · HomeworkTrackingRecord · HomeworkAttachment
│                    HomeworkSubmissionFile · HomeworkAuditEntry
├── Enums/           HomeworkStatus · HomeworkTargetType · HomeworkSubmissionType
│                    TrackingStatus · HomeworkAttachmentKind · HomeworkAuditKind
├── Events/          HomeworkPublishedEvent · HomeworkUpdatedEvent · HomeworkCancelledEvent
│                    HomeworkClosedEvent · TrackingMarkedMissingEvent
└── Exceptions/      HomeworkDomainException (+ InvalidHomeworkStateException,
                     SubmissionLimitExceededException, DueDateInPastException …)

src/Oksis.Application/Modules/Homework/
├── Abstractions/    IHomeworkScopeGuard · IHomeworkRosterReader · IHomeworkGradeLevelResolver
├── Commands/        CreateHomework · UpdateHomework · PublishHomework · PublishHomeworkOnBehalf
│                    CancelHomework · CloseHomework · MarkTrackingStatus · BulkMarkRemainingCompleted
│                    AddSubmissionFile · RemoveOwnSubmissionFile · RemoveSubmissionFileByAdmin
│                    UpdateHomeworkSettings
├── Queries/         ListMyHomework · ListHomeroomHomework · ListHomeworkAdmin · GetHomework
│                    GetHomeworkTracking · ListStudentHomework · GetStudentHomeworkDetail
│                    ListFamilyHomework · GetHomeworkDensity · GetPendingCheckBoard
│                    GetHomeworkAudit · GetHomeworkSettings
├── Contracts/       DTO'lar — `packages/api/src/homework/contract.ts` ile alan-alan eş
├── Internal/        HomeworkScopeGuard · HomeworkRosterReader · HomeworkCounters · HomeworkAuditText
├── Events/          HomeworkPublishedNotificationHandler · HomeworkUpdatedNotificationHandler
│                    HomeworkCancelledNotificationHandler · TrackingMarkedMissingHandler
│                    ClassRoomStudentAddedHomeworkHandler        [D — kaynak event §3.2b]
└── Jobs/            HomeworkDueReminderJob · HomeworkMissingDigestJob · HomeworkRosterReconcileJob

src/Oksis.Infrastructure/Homework/Dapper/
    HomeworkListReader · HomeworkTrackingReader · HomeworkDensityReader · PendingCheckReader
src/Oksis.Infrastructure/Persistence/Configurations/Homework/   5 EF konfigürasyonu
src/Oksis.Api/Controllers/V1/HomeworkController.cs
src/Oksis.Api/Controllers/V1/SchoolSettingsController.cs        (+ homework-settings)
```

**Bağımlılık yönü:**

```
Homework ──okur──▶ AcademicSessions (AcademicSession, AcademicTerm, ClassRoom, ClassRoomStudent.Status)
         ──okur──▶ Academics        (Subject)
         ──okur──▶ Teachers         (TeachingAssignment — ders seviyesi kapsama)
         ──okur──▶ Users            (Person, ParentStudentRelationship + erişim durumu)
         ──okur──▶ Schools          (SchoolSettings.HomeworkSettings, kademe → GradeLevel)
         ──okur──▶ Files            (IStorageService / StoredFile — yalnız FileId + URL üretimi)
         ──yazar─▶ Notifications    (domain event üzerinden)
         ◀──dinler ClassRooms.ClassRoomStudentAddedEvent  [D]
```

Hiçbir mevcut modül Homework'e bağımlı olmaz. Grades V2 entegrasyonu için bu modülde **hiçbir hazırlık yapılmaz** (rezerv alan Grades tarafında).

### 3.2 Cross-modül temaslar (Dilim 0/1)

**a) Roster ve görevlendirme okumaları — soyutlama üzerinden.** `IHomeworkRosterReader.GetActiveStudentsAsync(schoolId, classRoomId, ct)` → `ClassRoomStudent` aktifleri; `IHomeworkScopeGuard` görevlendirmeyi `TeachingAssignment`'tan okur. Attendance/Grades'in eşdeğer okuma yolları varsa `[D]` yeniden kullanılır; yoksa Homework kendi Internal okuyucusunu yazar (başka modülün Internal'ına uzanılmaz — modül sınırı).

**b) Sonradan katılan öğrenci (BR-HW-13).** Birincil yol: `ClassRoomStudentAddedEvent` `[D — böyle bir domain event yayınlanıyor mu?]` dinlenir → şubenin `Published` + `WholeClass` + `DueDate >= katılım tarihi` ödevlerine `Unmarked` kayıt açılır (`AddedAfterPublish=true`, audit `RecordAddedAfterPublish`). Event yoksa **fallback**: `HomeworkRosterReconcileJob` (gece, okul başına) aynı kuralı tarar. İkisi idempotenttir (benzersiz indeks çakışmasında sessiz geç). `SelectedStudents` ödevler **asla** genişlemez.

**c) Kademe çözümü (K-5 alıcı kuralı).** `IHomeworkGradeLevelResolver.IsPrimaryAsync(classRoomId)` — şube → kademe → "ilkokul mu" `[D — GradeLevel'da ilkokul bayrağı/aralığı nasıl]`. Bildirim handler'ları bunu tüketir.

**d) Dosya akışı.** Yükleme Files modülünün mevcut uçlarıyla yapılır `[D — istemci yükleme ucu: proxy mu presigned mi hazır?]`: istemci dosyayı yükler → `FileId` alır → `POST /homework/{id}/submissions {fileId}`. Homework dosya baytı taşımaz; yalnız `FileId` bağlar ve indirme URL'sini Files'tan ister. Ek (öğretmen) aynı kalıp.

### 3.3 Uç → CQRS envanteri

Zarf her uçta `{data, meta, errors, correlationId}`; statüler string; kapsam dışı **404** (varlık sızdırılmaz).

|#|Uç|Tip|Handler|İzin|Kapsam kapısı|
|---|---|---|---|---|---|
|1|`POST /homework`|C|`CreateHomeworkCommand {classRoomIds[], targetStudentIds?, …}`|`homework.write`|her `classRoomId` için görevlendirme; **tek transaction, şube başına 1 kayıt**, yanıt `ids[]`|
|2|`PUT /homework/{id}`|C|`UpdateHomeworkCommand`|`homework.write`|sahip; `Published`'da → `Updated` audit + event|
|3|`POST /homework/{id}:publish`|C|`PublishHomeworkCommand`|`homework.write`|sahip; hedef materialize (§3.4)|
|4|`POST /homework/{id}:publish-for`|C|`PublishHomeworkOnBehalfCommand {reason, dueDate}`|`homework.manage`|yalnız sahibi **pasif** öğretmen olan taslak; `dueDate` zorunlu-yeniden (BR-HW-02)|
|5|`POST /homework/{id}:cancel`|C|`CancelHomeworkCommand {reason}`|`homework.write` (sahip) / `homework.manage` (herhangi)|gerekçe ≥ 15 karakter (Grades yönetici-gerekçe kuralıyla aynı)|
|6|`POST /homework/{id}:close`|C|`CloseHomeworkCommand`|`homework.write`|sahip|
|7|`DELETE /homework/{id}`|C|(soft) yalnız `Draft`|`homework.write`|sahip; sessiz|
|8|`GET /homework/mine?termId=&classRoomId=&status=`|Q (Dapper)|`ListMyHomeworkQuery`|`homework.read`|sahiplik; sayaçlar `HomeworkCounters` (§3.6)|
|9|`GET /homework/homeroom?termId=`|Q (Dapper)|`ListHomeroomHomeworkQuery`|`homework.read`|rehber öğretmenlik `[D — rehberlik ataması hangi tabloda]`; **salt liste**, yükleme içeriği yok|
|10|`GET /homework/{id}`|Q|`GetHomeworkQuery`|`homework.read`|sahip / rehber (salt) / idare|
|11|`GET /homework/{id}/tracking`|Q (Dapper)|`GetHomeworkTrackingQuery`|`homework.read`|sahip → tam (yükleme URL'leri dahil); rehber → durumlar + yükleme **sayısı**; idare → tam + `ExemptReason`|
|12|`PUT /homework/{id}/tracking/{studentId}`|C|`MarkTrackingStatusCommand {status, exemptReason?}`|`homework.write`|**yalnız sahip** (§6 karar); `Exempt` gerekçe zorunlu; `Closed/Cancelled` → 409|
|13|`POST /homework/{id}/tracking:bulk-complete`|C|`BulkMarkRemainingCompletedCommand`|`homework.write`|sahip; yalnız `Unmarked` satırlar; audit tek özet|
|14|`GET /homework/my?scope=active\|past`|Q|`ListStudentHomeworkQuery`|`homework.read`|**öğrenci self** — kimlikten; gruplama istemcide, sunucu `dueDate + isOverdue + myStatus + mySubmissionCount` döner|
|15|`GET /homework/{id}/my`|Q|`GetStudentHomeworkDetailQuery`|`homework.read`|self; `ExemptReason` **serileştirilmez**|
|16|`POST /homework/{id}/submissions`|C|`AddSubmissionFileCommand {fileId}`|`homework.read` (self alt yüzeyi, §4)|self; `Closed/Cancelled` → 409 `submission_closed`; >5 → 409 `submission_limit`|
|17|`DELETE /homework/{id}/submissions/{sid}`|C|`RemoveOwnSubmissionFileCommand`|`homework.read` (self)|self + `Closed` öncesi|
|18|`GET /homework/family?studentId=&scope=`|Q|`ListFamilyHomeworkQuery`|`homework.read`|**aile kapsamı** + erişim durumu (BR-HW-14); "Henüz kontrol edilmedi" istemci türevi: `isOverdue && myStatus=='unmarked'`|
|19|`GET /homework/{id}/family?studentId=`|Q|+ çocuğun yükleme URL'leri (salt)|`homework.read`|aile kapsamı; `ExemptReason` serileştirilmez|
|20|`GET /homework?filters`|Q (Dapper)|`ListHomeworkAdminQuery`|`homework.manage`|filtreler: şube/ders/durum/dönem/tarih/arama — **öğretmen parametresi YOK** (H4); `Draft` yalnız sahibi pasifse döner|
|21|`GET /homework/density?weekStart=&level=`|Q (Dapper)|`GetHomeworkDensityQuery`|`homework.manage`|şube×gün sayım; `Cancelled/Draft` sayılmaz|
|22|`GET /homework/pending-check`|Q (Dapper)|`GetPendingCheckBoardQuery`|`homework.manage`|`isOverdue && unmarkedCount>0`; sıralama yalnız `dueDate/classRoom`|
|23|`POST /homework/{id}/submissions/{sid}:remove`|C|`RemoveSubmissionFileByAdminCommand {reason}`|`homework.manage`|gerekçe ≥ 15; soft; **bildirim üretmez** `[KB-4]`|
|24|`GET /homework/{id}/audit`|Q|`GetHomeworkAuditQuery`|`homework.manage`|—|
|25|`GET/PUT /school-settings/homework-settings`|Q/C|`GetHomeworkSettings` / `UpdateHomeworkSettingsCommand`|`homework.read` / `homework.manage`|3 alan (§3.8)|

**Pazarlığa kapalı wire kuralları:**

1. `isOverdue` **sunucu hesaplar**; istemci tarih karşılaştırması yapmaz.
2. `TrackingStatus` string union: `'unmarked'|'completed'|'incomplete'|'notDone'|'exempt'`. `unmarked` hiçbir uçta olumlu/olumsuz eşlenmez.
3. `ExemptReason` yalnız 11 (idare/sahip görünümü) ve 24'te serileştirilir; 15/19'da alan **yoktur** (null bile değil — şema dışı).
4. Yönetici/iptal gerekçeleri ≥ 15 karakter → `400 {code:"validation"}` (Grades kuralı devralınır).
5. GET yan etkisiz — "gördüm/okundu" mekanizması bu modülde yok (S-6 kararı).
6. İstemciden rol/görünüm parametresi kabul edilmez; 9/14/18 daraltmaları `ICurrentUser`'dan türetilir, gelen parametre yok sayılır ve `LogWarning`.
7. `DueDate` wire'da `YYYY-MM-DD`; saat alanı sözleşmede **hiç yok** (Faz B'de eklenir, kırılım yaşanmaz — yeni opsiyonel alan).

### 3.4 Kritik handler akışları

**`PublishHomeworkCommandHandler`** (uç 3)

1. Kapsam: sahip + görevlendirme (`IHomeworkScopeGuard.EnsureOwnerAsync`).
2. `homework.Publish(today)` — `Draft` değilse 409; `DueDate < today` ise 400 `due_date_past`.
3. Hedef materialize: `WholeClass` → `IHomeworkRosterReader` aktifler; `SelectedStudents` → `CreateHomework`'te saklanan hedef listesi (roster-doğrulamalı). Her hedefe `Unmarked` kayıt.
4. Audit `Published` (+ hedef sayısı `Detail`).
5. `HomeworkPublishedEvent` → SaveChanges sonrası dispatch (outbox/mevcut kalıp `[D]`).

**`MarkTrackingStatusCommandHandler`** (uç 12)

1. Kapsam: sahip. Ödev `Published` (türev `Overdue` dahil) değilse 409.
2. Satır hedefli güncelleme (root yüklenmez); `Exempt` ise gerekçe validator'da zorunlu.
3. Audit `StatusMarked(from→to)`; `Incomplete|NotDone`'a geçişte `TrackingMarkedMissingEvent`.
4. **Yanıt anlıktır** — bildirim kararı event handler'ında (politika: anında/özet), handler beklemez.

**`AddSubmissionFileCommandHandler`** (uç 16)

1. Self kapsam: `trackingRecord.StudentPersonId == currentUser.PersonId` değilse 404.
2. Ödev `Closed/Cancelled` → 409 `submission_closed` (`Overdue`'da **serbest**, K-9).
3. Aktif dosya sayısı ≥ 5 → 409 `submission_limit`.
4. `FileId` sahiplik doğrulaması: dosya bu tenant'ta ve yükleyen bu kullanıcı mı `[D — Files modülünde StoredFile.UploadedBy var mı]` — yoksa Files'a doğrulama ucu eklenir (başkasının dosyasını bağlama açığı kapanır).
5. Tracking `Status` **değişmez** (H2). Bildirim **üretilmez** (BR-HW-16).

**`CreateHomeworkCommandHandler`** (uç 1, çoklu şube) Tek transaction: her `classRoomId` için görevlendirme kontrolü → N `Homework(Draft)`; `SelectedStudents` yalnız **tek şube** ile birleşebilir (validator: `classRoomIds.Length==1` değilse 400 — çoklu şube × alt küme kombinasyonu Faz A'da kapalı, ekran da desteklemiyor `[KB-6]` onay).

### 3.5 `IHomeworkScopeGuard`

```csharp
public interface IHomeworkScopeGuard
{
    Task EnsureOwnerAsync(Guid homeworkId, CancellationToken ct);            // sahip öğretmen
    Task EnsureTeachingAsync(Guid classRoomId, Guid subjectId, CancellationToken ct); // create
    Task EnsureHomeroomAsync(Guid classRoomId, CancellationToken ct);        // rehber (salt liste)
    Task EnsureStudentSelfAsync(Guid trackingRecordId, CancellationToken ct);
    Task EnsureFamilyScopeAsync(Guid studentPersonId, CancellationToken ct); // + erişim durumu
}
```

İhlal → **404** (403 değil). Grades'in `IGradeScopeGuard`'ı ile **ortaklaştırılmaz** (modül izolasyonu); yalnız aile-kapsamı sorgusu ortak bir `Application/Common/FamilyScope` yardımcısına çekilebilir `[KB-7]` — iki modülde üçüncü kopya doğmadan karar.

### 3.6 Hesaplanan alanlar (`HomeworkCounters`, tek tanımlı)

`targetCount`, `markedCount`, `completedCount/incompleteCount/notDoneCount/exemptCount/unmarkedCount`, `submissionStudentCount` (yüklemesi olan öğrenci sayısı), `isOverdue`, `isPendingCheck = isOverdue && unmarkedCount > 0`. Liste, detay, pano **aynı** sınıftan okur; yüzde alanı yok (ekranlar `12/26` gösterir).

### 3.7 Hata sözleşmesi

|Kod|HTTP|Kaynak|
|---|---|---|
|`validation`|400|FluentValidation (başlık boş, gerekçe <15, tarih format)|
|`due_date_past`|400|BR-HW-02|
|`invalid_state`|409|durum makinesi ihlalleri|
|`submission_limit`|409|>5 aktif dosya|
|`submission_closed`|409|Closed/Cancelled'a yükleme|
|`not_found`|404|yok **veya kapsam dışı**|

### 3.8 Kalıcılık

|Tablo|PK|Benzersiz|İndeks|
|---|---|---|---|
|`Homeworks`|`Id`|—|`(SchoolId, AcademicTermId, ClassRoomId, DueDate)` — yoğunluk; `(SchoolId, OwnerTeacherPersonId, Status)` — mine; `(SchoolId, Status, DueDate)` — pending-check|
|`HomeworkTrackingRecords`|`Id`|`(HomeworkId, StudentPersonId)`|`(StudentPersonId)` — my/family|
|`HomeworkAttachments`|`Id`|—|`(HomeworkId)`|
|`HomeworkSubmissionFiles`|`Id`|—|`(TrackingRecordId, RemovedAt)`|
|`HomeworkAuditEntries`|`Id`|—|`(HomeworkId, OccurredAt DESC)`|

Tipler: `DueDate date`; zaman damgaları `datetimeoffset`; `Reason nvarchar(500)`. Tüm tablolarda `SchoolId` (tenant global filter; Dapper'da açık `WHERE SchoolId=@schoolId`). Soft delete tümünde (`IsDeleted`); hiçbir uç hard-delete etmez.

`SchoolSettings` +3 kolon: `HomeworkReminderHoursBefore int (0..72, default 24)` · `HomeworkMissingNotificationMode tinyint→enum (Off|DailyDigest|Instant, default DailyDigest)` · `HomeworkDailyDensityThreshold int (1..10, default 3)`.

**Migration planı:** `M1_Homework_Core` (5 tablo + `SchoolSettings` 3 kolon + izin seed) — Dilim 1. `M2` yalnız `[KB]` kararları kolon gerektirirse.

### 3.9 Dapper projeksiyonları

`mine/homeroom/admin` listeleri, `tracking` ızgarası, `density` (şube×gün `COUNT` — `DueDate` gruplu, `Status IN (Published, Closed)`), `pending-check`: EF tracking'siz tek sorgu; sayaçlar SQL'de (`HomeworkCounters` şekline eş — golden test §11). Yükleme URL'leri Dapper'dan **çıkmaz**; sorgu `FileId` döner, URL üretimi handler'da `IStorageService.GetDownloadUrl` (presigned, kısa ömür).

### 3.10 Depolama kapasite projeksiyonu (görsel teslim)

Varsayımlar: pilot okul ~500 öğrenci · öğrenci başına gün 1,5 ödev · yükleme oranı %25 (izlenecek — §12 K-B6 başarı kriteri) · ödev başına ort. 2 dosya · istemci sıkıştırma sonrası ort. **0,7 MB/dosya** (hedef; §6 mobil kuralı).

|Dönem|Aktif dosya|Boyut|
|---|---|---|
|Gün|~375|~0,26 GB|
|Ay (22 okul günü)|~8.250|~5,8 GB|
|Sezon (180 gün)|~67.500|~47 GB/okul|

Sıkıştırmasız (ort. 3 MB/foto) sezon ~200 GB/okul — **istemci sıkıştırma zorunlu** (§6). Retention: sezon arşivinde dosyalar durur; mezuniyet-sonrası silme mevcut retention politikasına bağlanır `[D — Files retention job'ı kapsıyor mu]`. Tenant bucket kota metriği dosya altyapısı analizindeki mekanizmadan izlenir.

### 3.11 Bildirimler

|Olay tipi|Tetik|Alıcı çözümü|Mod|
|---|---|---|---|
|`HOMEWORK_ASSIGNED`|`HomeworkPublishedEvent`|hedef öğrenciler: ilkokul → yalnız veliler; diğer → öğrenci + veliler; veli seti `ParentStudentRelationship` + erişim süzgeci (BR-HW-14)|kanal seçilebilir; **birleştirme**: aynı şube+alıcıya `[KB-2]` dakikalık pencerede "N yeni ödev" tek bildirim|
|`HOMEWORK_UPDATED`|`HomeworkUpdatedEvent` (yalnız `Published`)|aynı küme|kanal seçilebilir|
|`HOMEWORK_CANCELLED`|`HomeworkCancelledEvent`|aynı küme|kanal seçilebilir|
|`HOMEWORK_DUE_REMINDER`|`HomeworkDueReminderJob`|öğrenci (ilkokulda veli)|politika `HoursBefore` (0=kapalı)|
|`HOMEWORK_MARKED_MISSING`|mod `Instant`: `TrackingMarkedMissingEvent` handler'ı anında · mod `DailyDigest` (varsayılan): `HomeworkMissingDigestJob` gün sonu tek özet ("Bugün 2 ödevde eksik işaretlendi") · mod `Off`: hiç|veli (süzgeçli) + öğrenciye nötr durum bildirimi|politika|

Dispatch mevcut zincir: domain event → `HangfireNotificationEnqueuer` → `DispatchNotificationJob` `[D]`. Dedupe anahtarları: `homework:{id}:assigned:{recipientId}` · reminder `homework:{id}:reminder:{recipientId}` (tekrar koşan job ikinci kez göndermez) · digest `homework:digest:{schoolId}:{date}:{recipientId}`. **Hiçbir bildirim gövdesi öğrenci durum listesini başka öğrenciyle karışık taşımaz**; yükleme olayı bildirim **üretmez** (BR-HW-16).

**Job'lar:** `HomeworkDueReminderJob` saatlik; `DueDate` penceresine girenleri tarar. `HomeworkMissingDigestJob` günlük `[KB-1]` saat (öneri 18:00 okul saat diliminde); gün içinde `Incomplete|NotDone`'a geçen kayıtları alıcı bazında toplar. `HomeworkRosterReconcileJob` gece (§3.2b fallback). Üçü de tenant-döngülü, idempotent, `PerformContext` loglu.

### 3.12 Loglama

Structured + correlation ID (proje standardı):

```csharp
_logger.LogInformation("{Class}.{Method} homework published {HomeworkId} {ClassRoomId} {TargetCount}",
    nameof(PublishHomeworkCommandHandler), nameof(Handle), homework.Id, homework.ClassRoomId, targets.Count);
```

Durum geçişleri `LogInformation` (From/To/Actor/OnBehalf); kapsam ihlali ve reddedilen istemci parametresi `LogWarning`; tenant uyuşmazlığı `LogCritical`; job başı/sonu sayaçlı `LogInformation`. `Console.WriteLine` yok.

---

## 4. İzin Matrisi

Seed: `homework.read`, `homework.write`, `homework.manage` `[D — mevcut seed'de homework.* var mı, varsa adlar eşitlenir]`. Rol eşlemesi (RolePermissionSeedData):

|Rol|read|write|manage|
|---|---|---|---|
|SchoolAdmin|✓|✓|✓|
|Teacher|✓|✓|—|
|Student|✓|—|—|
|Parent|✓|—|—|

Öğrencinin yükleme/silme uçları (16-17) **`homework.read` + self kapsam** ile açılır (ayrı izin kodu açılmaz — yükleme "kendi kaydını okuma yüzeyinin" doğal uzantısı; ihtiyaç analizi §6 ile uyumlu). İki katman + durum: izin kodu yüzeyi açar → kapsam kapısı kaydı belirler → durum makinesi zamanı belirler.

|Aksiyon|İzin|Kapsam|Durum|
|---|---|---|---|
|Oluştur/düzenle/yayınla/kapat|write|sahip + görevlendirme|Draft/Published kuralları|
|İptal|write / manage|sahip / herhangi|Published|
|İşaretleme + toplu|write|**yalnız sahip**|Published (Overdue dahil)|
|Taslak yayınla (vekâlet)|manage|sahibi pasif taslak|Draft|
|Yükleme ekle/sil|read|self|Closed öncesi|
|Yükleme kaldır|manage|—|her zaman|
|Rehber listesi|read|homeroom|salt okunur|
|Aile listesi/detayı|read|aile + erişim|salt okunur|
|Pano/yoğunluk/audit/ayar yazma|manage|—|—|

---

## 5. oksis-web Tasarımı

Ödev'de mock **henüz yok** — Grades'in tersine burada frontend işi "bağlama" değil "kurma"dır. Sıra: Dilim 0'da sözleşme + MSW mock yazılır → ekranlar (tasarım paketinden) mock'a karşı geliştirilir → dilimler ilerledikçe handler'lar kapatılır.

|Alan|İş|Dilim|
|---|---|---|
|`packages/api/src/homework/contract.ts`|§3.3 DTO'ları — `TrackingStatus`/`HomeworkStatus` string union, `isOverdue` sunucudan|0|
|`packages/api/src/homework/endpoints.ts`|25 uç sarmalayıcısı|0|
|`packages/api-mocks/src/homework/homework-handlers.ts + homework-data.ts`|Altınay Lisesi fixture'ı (tasarım promptlarındaki örnek veri **birebir** — tasarım/mock/test aynı evren)|0|
|`apps/web` öğretmen: create/list/tracking ekranları (Ekran 1-3)|mock'a karşı|1-2|
|`apps/web` yönetici: liste/detay, pano, ayarlar (Ekran 7-9)|mock'a karşı|2-4|
|Kabuk rotalar `/homework` `[D]`|gerçek ekranla değişir|1|

**TanStack Query anahtarları** (dönem/kimlik prefixli): `['homework','mine',termId,filters]` · `['homework','homeroom',termId]` · `['homework','item',id]` · `['homework','tracking',id]` · `['homework','my',scope]` · `['homework','family',studentId,scope]` · `['homework','admin',filters]` · `['homework','density',weekStart,level]` · `['homework','pending-check',filters]` · `['homework','audit',id]` · `['homework','settings']`.

**Geçersizleme:** `MarkTracking`/`Bulk` → `tracking` + `item` + `mine` + `pending-check`; `Publish`/`Cancel`/`Update`/`Close` → `item` + `mine` + `admin` + `density` (+ cancel/close → `pending-check`); `AddSubmission`/`RemoveOwn` → `my` + `item(self)` yalnız (öğretmen `tracking`'i poll/refetch-on-focus ile tazelenir — canlı kanal açılmaz).

**İşaretleme UX sözleşmesi (Ekran 3):** `MarkTracking` optimistic update + hata halinde geri al + satır içi "Tekrar dene" (mutation retry 1). Toast yok (tasarım kuralı); mikro-onay bileşen içi.

**Zod:** gerekçeler `.min(15)`; `ExemptReason .min(1)`; `dueDate` `z.string().regex(YYYY-MM-DD)`; `TrackingStatusDto = z.enum([...])`. K-8 istemcide de korunur: admin liste/pano bileşenleri öğretmen alanını `sortable:false`, link'siz düz metin render eder — sözleşmede öğretmen filtre parametresi zaten yoktur.

---

## 6. oksis-mobile Tasarımı

|Konu|Kural|
|---|---|
|Öğretmen ver/işaretle (Ekran 1-3), öğrenci liste/detay/yükleme (4-5), veli (6)|`packages/api` paylaşımlı; ekranlar mock'a karşı kurulur|
|**Yükleme hattı**|`expo-image-picker` (kamera/galeri) + `expo-document-picker` (PDF) → **`expo-image-manipulator` ile sıkıştırma zorunlu** (uzun kenar ≤ 2048px, JPEG ~0.7 — hedef ≤ 1MB/foto, §3.10) → Files ucuna yükle → `FileId` → `POST submissions`|
|Yükleme dayanıklılığı|dosya seçimi lokal state'te tutulur; ağ hatasında kart "Yüklenemedi + Tekrar dene", **seçim kaybolmaz**; tam offline kuyruk Faz A dışı|
|Görüntüleyiciler|öğretmen tam ekran işaretleme-çubuklu viewer + "sonraki yüklemeli öğrenci" (Ekran 3); indirme URL'leri kısa ömürlü — görüntüleyici açılışında taze `tracking` çekilir|
|Self/aile daraltması|sunucuda; istemci rol/görünüm parametresi **göndermez**|
|Token|`expo-secure-store`; `AsyncStorage` yasak|
|Stil|NativeWind v4; `StyleSheet.create` yasak|
|Liste|`FlatList` (gruplu listeler `SectionList`); `ScrollView+map` yasak|
|Hardcoded Türkçe|yasak — durum/etiket metinleri i18n katmanından; enum→etiket eşlemesi tek dosyada|
|Server state|Zustand'a kopyalanmaz; yükleme ilerlemesi bileşen state'i|

---

## 7. Uçtan Uca Akışlar

### 7.1 Öğretmen ödev verir (çoklu şube) ve yayınlar

|#|Aktör|Adım|Sistem|
|---|---|---|---|
|1|Öğretmen|Ekran 1: 9-A + 9-B, başlık, ek, DueDate Cuma|`POST /homework {classRoomIds:[9A,9B]}` → 2 `Draft`, ortak `SourceHomeworkId`|
|2|Öğretmen|"Yayınla" (onayda "58 öğrenci ve velileri…")|2 × `:publish` (istemci sıralı) → hedefler materialize (30+28 `Unmarked`), audit, 2 event|
|3|Sistem|Bildirim|kademe kuralı → öğrenci+veli; birleştirme penceresi aynı alıcıya tek "2 yeni ödev" `[KB-2]`|
|4|Öğrenci|Ödevlerim|`GET /homework/my` — `isOverdue=false`, durum etiketi yok (`unmarked` liste kartında render edilmez — Ekran 4 kuralı)|

### 7.2 Öğrenci görsel yükler, öğretmen uzaktan kontrol eder

|#|Aktör|Adım|Sistem|
|---|---|---|---|
|1|Öğrenci|2 foto çeker|sıkıştır → Files yükle → 2 × `POST submissions` — tracking `unmarked` **kalır**, bildirim yok|
|2|Öğretmen|Izgarada rozet (2) → viewer|`GET tracking` taze URL'ler; viewer'da "Tamamlandı"|
|3|Sistem||`MarkTrackingStatus(completed)`, audit `StatusMarked`, event yok (missing değil)|
|4|Öğrenci/Veli|detay|durum kartı "Tamamlandı" görünür|

### 7.3 Eksik işaretleme → günlük özet

|#|Aktör|Adım|Sistem|
|---|---|---|---|
|1|Öğretmen (10:15)|3 öğrenciyi `incomplete`|3 audit + 3 `TrackingMarkedMissingEvent`; mod `DailyDigest` → handler no-op|
|2|Sistem (18:00)|`HomeworkMissingDigestJob`|veli başına grupla → "Bugün 2 ödevde eksik işaretlendi" tek bildirim; öğrenciye nötr durum bildirimi; dedupe anahtarı günlük|
|3|Veli|bildirim → derin bağlantı|Ekran 6 listesi, ilgili çocuk seçili|
|4|(mod `Instant` varyantı)||event handler anında enqueue eder; job o kayıtları atlar (MarkedAt işaretleme-modu damgası `[KB-3]` basit çözüm: Instant modda job hiç koşmaz)|

### 7.4 Ayrılan öğretmenin taslağını idare yayınlar

|#|Aktör|Adım|Sistem|
|---|---|---|---|
|1|Yönetici|Admin listede "Sahibi ayrıldı" taslağı|`ListHomeworkAdmin`: `Draft` yalnız sahibi pasifse döner|
|2|Yönetici|`:publish-for {reason, dueDate}`|sahip pasif doğrulanır; `dueDate` yeniden validasyon; audit `PublishedOnBehalf(Reason)`; normal yayın zinciri|

### 7.5 Uygunsuz yükleme kaldırma

|#|Aktör|Adım|Sistem|
|---|---|---|---|
|1|Yönetici|viewer'dan "Yüklemeyi kaldır" + gerekçe|`RemoveSubmissionFileByAdmin`: `RemovedAt/By/Reason` set; dosya erişimi kapanır; tracking durumu **değişmez**; audit|
|2|Öğrenci/Veli|detay|dosya listeden düşer; bildirim gitmez `[KB-4]`|

### 7.6 Şubeye sonradan katılan (BR-HW-13)

|#|Adım|Sistem|
|---|---|---|
|1|Öğrenci 9-A'ya katılır|`ClassRoomStudentAddedEvent` `[D]` → handler: `WholeClass` + `Published` + `DueDate>=katılım` ödevlere `Unmarked` kayıt (`AddedAfterPublish=true`)|
|2|Gece|`HomeworkRosterReconcileJob` aynı kuralı idempotent tarar (event kaçarsa telafi)|
|3|`SelectedStudents` ödev|**dokunulmaz**|

---

## 8. Klasör Yapısı

### 8.1 `oksis-api`

```
src/Oksis.Domain/Modules/Homework/
  Entities/Homework.cs · HomeworkTrackingRecord.cs · HomeworkAttachment.cs
           HomeworkSubmissionFile.cs · HomeworkAuditEntry.cs                       [YENİ]
  Enums/… (6) · Events/… (5) · Exceptions/…                                        [YENİ]
src/Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs                        [DEĞİŞİK] +3 alan, UpdateHomeworkSettings()

src/Oksis.Application/Modules/Homework/
  Abstractions/IHomeworkScopeGuard.cs · IHomeworkRosterReader.cs
               IHomeworkGradeLevelResolver.cs                                       [YENİ]
  Commands/{12 komut}/…{Command,Handler,Validator}.cs                               [YENİ]
  Queries/{12 sorgu}/…                                                              [YENİ]
  Contracts/*.cs (contract.ts ile alan-alan eş)                                     [YENİ]
  Internal/HomeworkScopeGuard.cs · HomeworkRosterReader.cs
           HomeworkCounters.cs · HomeworkAuditText.cs                               [YENİ]
  Events/{4 bildirim handler} + ClassRoomStudentAddedHomeworkHandler [D]            [YENİ]
  Jobs/HomeworkDueReminderJob.cs · HomeworkMissingDigestJob.cs
       HomeworkRosterReconcileJob.cs                                                [YENİ]

src/Oksis.Infrastructure/Homework/Dapper/HomeworkListReader.cs
    HomeworkTrackingReader.cs · HomeworkDensityReader.cs · PendingCheckReader.cs    [YENİ]
src/Oksis.Infrastructure/Persistence/Configurations/Homework/*.cs (5)               [YENİ]
src/Oksis.Infrastructure/Persistence/Migrations/…_HomeworkCore.cs                   [YENİ]
src/Oksis.Infrastructure/Persistence/Seed/MasterData/PermissionSeedData.cs          [DEĞİŞİK] homework.* [D]
src/Oksis.Infrastructure/Persistence/Seed/MasterData/RolePermissionSeedData.cs      [DEĞİŞİK]
src/Oksis.Infrastructure/DependencyInjection.cs + Hangfire recurring kayıtları       [DEĞİŞİK]

src/Oksis.Api/Controllers/V1/HomeworkController.cs                                  [YENİ]
src/Oksis.Api/Controllers/V1/SchoolSettingsController.cs                            [DEĞİŞİK] homework-settings

tests/Oksis.Domain.Tests/Homework/HomeworkStateMachineTests.cs
      SubmissionLimitTests.cs                                                       [YENİ]
tests/Oksis.Application.Tests/Homework/*Handler*Tests.cs · HomeworkCountersTests.cs [YENİ]
tests/Oksis.Api.Tests/Homework/HomeworkContractTests.cs (mock fixture eşleme)       [YENİ]
```

### 8.2 `oksis-ui`

```
packages/api/src/homework/contract.ts · endpoints.ts                                [YENİ]
packages/api-mocks/src/homework/homework-handlers.ts · homework-data.ts             [YENİ — Dilim 0]
apps/web/features/homework/…   (Ekran 1-3, 7-9 karşılıkları)                        [YENİ]
apps/web/…/settings/homework-tab.tsx                                                [YENİ]
apps/mobile/app/(tabs)/homework.tsx  ("Planlandı" kabuğu → gerçek)  [D]             [DEĞİŞİK]
apps/mobile/features/homework/…  (Ekran 1-6 mobil karşılıkları + upload hattı)      [YENİ]
```

---

## 9. Mimari Uyum Kontrol Listesi

### Backend

|#|Kural|Durum|Not|
|---|---|---|---|
|1|Application EF Core bilmez (`IApplicationDbContext`)|Uygun||
|2|Controller tek satır (`mediator.Send` + `ToHttpResult`)|Uygun||
|3|Pipeline Logging → Validation → Tenant → Authorization → Transaction|Uygun|iptal "sahip **veya** manage" kontrolü handler'da tek satır — Grades R8 emsali|
|4|Her tabloda `SchoolId` + global filter; Dapper'da açık WHERE|Uygun||
|5|İzin `{module}.{action}`, default deny, kapsam dışı 404|Uygun||
|6|Hard-delete yasağı|Uygun|idari yükleme kaldırma dahil hepsi soft|
|7|Cross-modül yalnız ID + domain event|Uygun|Files'a yalnız `FileId` + `IStorageService`|
|8|Mapster, FluentValidation, sealed + primary ctor|Uygun||
|9|`CancellationToken` her handler/job'da|Uygun||
|10|Serilog structured, `Console.WriteLine` yok|Uygun||
|11|Sezon partition; dönem soft filtre|Uygun|`AcademicSessionId` zorunlu, `AcademicTermId` filtre|
|12|GET yan etkisiz|Uygun|"gördüm" mekanizması yok (S-6)|
|13|Async/await + statik helper yok, god service yok|Uygun|sayaçlar `HomeworkCounters` tek sınıf, iş kuralı domain'de|

### Frontend / Mobile

|#|Kural|Durum|
|---|---|---|
|1|Named export, `any` yok|Uygun|
|2|Server state Zustand'a kopyalanmaz|Uygun|
|3|Statüler string union|Uygun|
|4|Hardcoded Türkçe yok — i18n|Uygun|
|5|Token SecureStore|Uygun|
|6|Rol/görünüm parametresi istemciden gitmez|Uygun|
|7|NativeWind; `StyleSheet.create` yok|Uygun|
|8|`FlatList`/`SectionList`|Uygun|
|9|Zod = sunucu kuralları (≥15, ≤5 dosya istemci ön-kontrol)|Uygun|
|10|İstemci sıkıştırma zorunlu (≤1MB hedef)|Uygun — çıkış kriteri|
|11|MSW dilim sonunda kapatılır, ekran aynı davranır|Uygun — çıkış kriteri|
|12|Admin UI öğretmen alanı link'siz/sortsuz (K-8)|Uygun|

---

## 10. Dilimleme ve Çıkış Kriterleri

|Dilim|İçerik|Çıktı|Çıkış kriteri|
|---|---|---|---|
|**0**|`contract.ts` + `endpoints.ts` + MSW mock (Altınay fixture'ı) · izin seed kararı `[D]` · `[KB]` kapanışı|Frontend geliştirme zemini; mock tek kaynak ilan edilir|9 ekranın tasarım verisi mock'tan render edilir|
|**1**|5 entity + EF konfig + `M1` migration + `SchoolSettings` 3 alan · uç 1-10 (öğretmen CRUD/yayın/listeler)|Öğretmen ödev verir/yayınlar (Ekran 1-2)|MSW kapalı: create→publish→mine akışı mock ile alan-alan eş; BR-HW-02/03/04 kodları eş|
|**2**|Uç 11-13 (tracking + toplu) + audit + rehber (9)|Kontrol ızgarası uçtan uca (Ekran 3)|§7.2 işaretleme; optimistic update geri-alma; audit satırları; rehber salt-okunur daraltması|
|**3**|Uç 14-19 + `HomeworkSubmissionFile` + Files entegrasyonu + mobil upload hattı|Öğrenci/veli yüzü + görsel teslim (Ekran 4-6)|5-dosya limiti 409; `ExemptReason` sızmaz (şema testi); self/aile 404 testleri; sıkıştırma ≤1MB ölçülür|
|**4**|Uç 20-25 + 3 Hangfire job + 5 bildirim + `homework-settings`|Yönetim + bildirim (Ekran 7-9)|digest tek bildirim testi; reminder dedupe; density sayımı `Cancelled` hariç; K-8 sözleşme testi (öğretmen parametresi 400/yok)|

Dilimler ardışıktır; sprint planında diğer modüllerle yan yana ilerler (cross-modül sprint kuralı).

---

## 11. Test Stratejisi

|Katman|Test|Dilim|
|---|---|---|
|Domain|`Homework` durum makinesi — 5 geçerli + 7 yasak geçiş; `DueDate` geçmiş → exception|1|
|Domain|Yükleme limiti: 5. dosya ✓, 6. → `SubmissionLimitExceeded`; kaldırılmış dosya sayılmaz|3|
|Application|`PublishHomework`: WholeClass materialize sayısı = aktif roster; SelectedStudents roster-dışı id → 400|1|
|Application|`MarkTrackingStatus`: Closed → 409; Exempt gerekçesiz → 400; `Incomplete` → event üretir, `Completed` üretmez|2|
|Application|`BulkMarkRemaining`: yalnız `Unmarked`; audit tek satır|2|
|Application|`AddSubmission`: başka öğrencinin kaydı → 404; `Overdue`'da ✓; tracking status değişmedi (H2 **golden**)|3|
|Application|Aile kapsamı: bağlı olmayan çocuk → 404; erişim `none` → 404; `ExemptReason` DTO'da alan yok|3|
|Application|`HomeworkCounters` = Dapper sayaçları (golden: aynı veri, iki yol, eş sonuç)|2|
|Application|BR-HW-13: event handler + reconcile job idempotent (çift koşum → tek kayıt); SelectedStudents genişlemez|3|
|Application|Digest job: 3 işaretleme → veli başına 1 bildirim; Instant modda job üretmez; dedupe anahtarı|4|
|Api (contract)|Her uç mock fixture → JSON şekil karşılaştırması (alan adları, string enum'lar, zarf)|her dilim|
|Api|Admin liste "teacherId" parametresi → yok sayılır + `LogWarning`; sıralama parametresi yalnız izinli sütunlar|4|
|UI|Ekran testleri MSW kapalı koşulur; upload retry'da seçim korunur|her dilim|

---

## 12. Riskler ve Açık Noktalar

|#|Konu|Etki|Karar / öneri|
|---|---|---|---|
|R1 `[KB-1]`|Digest job saati|Dilim 4|Öneri: sabit 18:00 (okul saat dilimi); ayar alanı **açılmaz** (3-alan kapsamı korunur)|
|R2 `[KB-2]`|`HOMEWORK_ASSIGNED` birleştirme penceresi|bildirim gürültüsü|Öneri: 10 dk pencere, alıcı bazında "N yeni ödev"; bildirim sisteminin mevcut aggregation mekanizması `[D]` destekliyorsa oradan|
|R3 `[KB-3]`|Instant↔Digest mod geçişi gün ortasında|çift bildirim|Öneri: mod anahtarı gün sonunda etkinleşmez-karmaşası yerine basit kural: digest job yalnız mod `DailyDigest` iken koşar; gün içi geçişte o günün erken işaretlemeleri tek özetle telafi edilir (kabul edilebilir)|
|R4 `[KB-4]`|İdari yükleme kaldırmada öğrenci/veli bilgilendirilsin mi|hassasiyet|Öneri: **bildirim yok** — kaldırma pedagojik konuşmanın konusu, push'un değil; ekran zaten dosyayı düşürür|
|R5 `[KB-5]`|`isOverdue` gün sınırının saat dilimi kaynağı|doğruluk|`SchoolSettings.TimeZone` `[D]` varsa o; yoksa `Europe/Istanbul` sabiti + `[D]` alan açma kararı|
|R6 `[KB-6]`|Çoklu şube × SelectedStudents kombinasyonu kapalı|Ekran 1|Onay bekliyor — ekran tasarımı desteklemiyor, validator 400; açılırsa şube-başına hedef sekmeleri zaten promptta var|
|R7 `[KB-7]`|Aile-kapsamı yardımcısının Grades ile ortaklaşması|üçüncü kopya riski|Dilim 3 başında 15 dk karar; öneri: `Application/Common/FamilyScope`|
|R8 `[D]`|`ClassRoomStudentAddedEvent` mevcut mu|BR-HW-13 birincil yol|Yoksa Dilim 3'te yalnız reconcile job (davranış aynı, gecikme ≤1 gün)|
|R9 `[D]`|Files: istemci yükleme ucu + `StoredFile.UploadedBy` sahiplik alanı|güvenlik (§3.4/16-4)|Yoksa Files'a küçük doğrulama borcu açılır — Dilim 3 öncesi|
|R10|Depolama büyümesi (sıkıştırmasız senaryo ~200GB/sezon)|maliyet|İstemci sıkıştırma çıkış kriteri (§9-FE-10) + bucket kota metriği; yükleme oranı pilotta izlenir|
|R11|Öğretmen işaretleme yapmıyor (benimseme)|ürün riski|Teknik payı: optimistic anlık UX + pending-check panosu; kalanı ürün/pilot takibi|
|R12|Presigned URL ömrü vs viewer açık kalması|403 görselleri|Viewer açılışında taze tracking çek (§6); URL ömrü ≥ 15 dk|

---

## 13. Sonraki Adım

1. **`[KB-1..7]` kararları** — hepsi 5'er dakikalık seçim; yalnız KB-2/KB-3 Dilim 4'ü, KB-6/KB-7 Dilim 1/3'ü etkiler; Dilim 0'ı hiçbiri bloklamaz.
2. **`[D]` taraması** — repo açıkken 30 dk: izin seed'de `homework.*`, `ClassRoomStudentAddedEvent`, Files yükleme ucu + `UploadedBy`, `SchoolSettings.TimeZone`, rehberlik ataması tablosu, mobil kabuk rotalar.
3. **Dilim 0 başlar:** `contract.ts` + MSW mock (Altınay fixture'ı tasarım promptlarındaki örnek veriyle birebir) + `HomeworkContractTests` iskeleti — mock yazıldığı andan itibaren "mock kazanır" kuralı bu modülde de yürürlüğe girer.