# Akademik Sezon — Business Rules

> Bu modüle özel iş kuralları. Yazılım dünyasından gelen genel kurallar değil — **OKSİS'te Akademik Sezon için spesifik** kararlar.

> Genel iş kuralları için bkz. proje kökündeki `business-rules.md` (özellikle § 10 — Sezon Yönetimi).

---

## Kurallar

### BR-AS-001: Aktif sezon tekildir

**Kural:** Bir okulda aynı anda yalnızca **bir** `AcademicSession` `IsCurrent = true` olabilir.

**Sebep:** Tüm akademik aktivitenin (yoklama, not, ödev) "şu anda hangi sezona ait" sorusu yegane bir cevabı olmalı. İki aktif sezon = veri kirliliği + raporlama belirsizliği.

**Uygulama:**
- Backend: `AcademicSession.Activate()` davranışı önce mevcut `IsCurrent = true` sezonu `Archived`'a düşürür, sonra yeni sezonu aktif eder. Aynı transaction içinde.
- DB: Filtered unique index
  ```sql
  CREATE UNIQUE INDEX ux_academic_sessions_active
    ON academic_sessions(school_id) WHERE is_current = 1 AND is_deleted = 0;
  ```
- Frontend: Yeni sezon "Aktif Et" butonu onay diyalogu gösterir: "X sezonu arşive alınacak. Devam?"

**Edge case'ler:**
- İlk sezon (okul yeni kurulmuş, henüz sezon yok): koşulsuz aktif edilir.
- Aktif sezon yokken yeni sezon `Setup`'tan direkt `Active`'e geçer.

**Test referansı:** `AcademicSessionTests.Activate_ShouldArchivePreviousActiveSession`

---

### BR-AS-002: Sezon arşivlemesi idare onayıyla

**Kural:** Yeni sezon yayınlandığında eski sezon **otomatik** arşivlenir, ancak bu işlem `AcademicSession.Activate()` davranışının zorunlu bir parçasıdır — atomik tek transaction. Manuel `Archive()` çağrısı sadece istisnai durumlarda (örn. yıl iptal edildi, yeniden açılacak) `SchoolAdmin` rolüyle çağrılabilir.

**Sebep:** Sezon arşivlemesi geri dönüşsüz bir işlem; idarenin bilinçli kararı olmalı.

**Uygulama:**
- Backend: `AcademicSession.Activate()` invariant: yeni sezon aktif olduğunda eski sezon zorunlu `Archived`.
- Application: `ActivateAcademicSessionCommand` handler permission check (`academic-sessions.activate`) + audit log.

**Edge case'ler:** Manuel `Archive` çağrısında sezon `Setup` ise reddedilir (yalnızca `Active` arşivlenebilir).

---

### BR-AS-003: Arşivlenmiş sezon salt-okunur

**Kural:** `AcademicSession.Status = Archived` olan sezona ait *hiçbir* yazma operasyonu kabul edilmez — şube ekleme/düzenleme, öğrenci atama/değişimi, vb. dahil.

**Sebep:** Geçmiş veri bütünlüğü. Geçmiş yılın notları, devamsızlıkları sonradan değiştirilemez — denetim ve hukuki açıdan dondurulmuş olmalı.

**Uygulama:**
- Backend: EF Core SaveChanges interceptor — `AcademicSession.Status = Archived` ise ilgili `ClassRoom`, `ClassRoomStudent` üzerinde değişiklik → `ArchivedSessionWriteException` (HTTP 409 Conflict).
- Application: Her command handler ilk önce `AcademicSession.Status` check yapar.
- Frontend: Arşiv sezonu açıldığında tüm form alanları disabled, butonlar gizli, banner görünür.

**İstisna:** `SuperAdmin` rolü manual data fix için bypass edebilir (audit log zorunlu).

---

### BR-AS-004: Tarih tutarlılığı

**Kural:** Sezon ve dönem tarihleri tutarlı olmalı:
- `AcademicSession.StartDate < AcademicSession.EndDate`
- `Term1.StartDate ≥ Session.StartDate`
- `Term1.EndDate < Term2.StartDate` (T1 ve T2 arası tatil olabilir, ama çakışmazlar)
- `Term2.EndDate ≤ Session.EndDate`

**Sebep:** Tarihsel anomali (T2 başlamadan T1 bitmemiş gibi) downstream modüllerde (devamsızlık sayacı, not dönemi, karne) belirsizlik yaratır.

**Uygulama:**
- Backend: `AcademicSession.UpdateDates()` davranışı + `AcademicTerm` create/update sırasında invariant check.
- DB: Check constraint
  ```sql
  ALTER TABLE academic_sessions ADD CONSTRAINT ck_session_dates
    CHECK (start_date < end_date);
  ALTER TABLE academic_terms ADD CONSTRAINT ck_term_dates
    CHECK (start_date < end_date);
  ```
- Frontend: Zod schema + DatePicker `min/max` props.

---

### BR-AS-005: Dönem kapatma geri alınamaz

**Kural:** `AcademicTerm.Status = Closed` durumu **terminal**. Geri alınamaz, yeniden açılamaz.

**Sebep:** Dönem kapatma şu zincir efekti tetikler: notlar `Locked`, karneler PDF olarak üretilir ve velilere push gider, devamsızlık sayaçları sıfırlanır. Bu işlemler geri alınamaz (push gönderildi).

**Uygulama:**
- Backend: `AcademicTerm.Close()` davranışı statü kontrolü yapar; reaktivasyon davranışı yok.
- Application: `CloseAcademicTermCommand` handler `AcademicTermClosedEvent` raise eder; `report-cards` modülü buna abone.
- Frontend: "Dönemi Kapat" butonu çift onay (modal + checkbox "Bu işlem geri alınamaz, anladım").

**İstisna:** `SuperAdmin` veritabanı direct müdahalesi (audit log + database backup koşulu, prosedüre bağlı).

---

### BR-AS-006: Tatil günlerine ders/nöbet atanamaz

**Kural:** `SchoolHoliday` veya master `official_holidays` ile çakışan tarihlere ders programı (`timetable`) veya nöbet (`duties`) atanamaz.

**Sebep:** Mantıksal tutarlılık. Tatilde ders olmaz.

**Uygulama:**
- Backend: `timetable` ve `duties` modülleri create/update handler'larında bu kontrolü yapar (bu modülün sorumluluğu değil, ama veri buradan beslenir).
- Bu modül: `IHolidayCalendarReader` interface sağlar (`bool IsHoliday(SchoolId, DateOnly)`).
- DB: View `v_school_calendar` (master + tenant tatilleri merge).

---

### BR-AS-007 ⭐: Mezun veri saklama süresi parametrik

**Kural:** Mezun öğrenci verileri default **5 yıl** saklanır; bu süre okul ayarında parametrik olarak değiştirilebilir.

**Konfigürasyon:**
- Tablo: `school_settings`
- Kolon: `graduated_data_retention_years` (int, default 5, min 1, max 30)
- UI: `school-settings` → "Veri Saklama" sekmesi

**Davranış:**
- Mezun öğrenci verisi 5 yıl boyunca **soft-deleted + read-only** durumda tutulur (cross-session sorgu).
- 5+ yıl seçilirse: backend banner "Yasal saklama süresi 5 yıl. Ek süre yüksek depolama maliyetine yol açar. Faturalandırma değişebilir." → faturalama bağlantısı **ileri sprint kapsamında** (Sprint 5+).
- Retention süresi dolan veriler için **hard-delete onay akışı** çalışır — bu modülün **dışı** (ileri sprint). Onay alındığında veri ya indirilir (export to JSON) ya da direkt silinir.

**Sebep:** KVKK uyumu (`business-rules.md` § 13) + okulun ileride veri çekme/silme tercihine esneklik.

**Uygulama:**
- Backend: `IDataRetentionPolicy` interface; default 5 yıl.
- DB: `school_settings.graduated_data_retention_years` kolonu.
- Frontend: `school-settings` modülünde basit input (number, suffix "yıl").
- **Sprint 1 kapsamında:** sadece kolon eklenir + default 5. Hard-delete akışı YAPILMAZ.

**Edge case'ler:**
- Süre dolan veri yokken sistem hiçbir şey yapmaz (background job no-op).
- Okul saklama süresini düşürürse (örn. 5'ten 3'e), arada kalan veriler için onay akışı tetiklenir.

**Test referansı:** `DataRetentionPolicyTests.DefaultIsFiveYears`

---

### BR-AS-008 ⭐: Şube oluşturma onay akışı parametrik

**Kural:** Şube oluşturulduğunda otomatik aktif mi olur, yoksa onay mı bekler — okul ayarına bağlı.

**Konfigürasyon:**
- Tablo: `school_settings`
- Kolon: `require_approval_for_classroom_creation` (bit, default 0/false)
- UI: `school-settings` → "İş Akışı" sekmesi

**Davranış:**
- `false` (default): `ClassRoom.Create()` → `Status = Active`. Tek adımlı.
- `true`: `ClassRoom.Create()` → `Status = PendingApproval`. `academic-sessions.approve-classroom` permission'ı olan kullanıcı `ClassRoom.Approve()` çağırınca `Active` olur.

**Sebep:** Küçük okullarda gereksiz iş yükü; büyük okullarda müdür yardımcısı oluşturur, müdür onaylar.

**Uygulama:**
- Backend: `CreateClassRoomCommand` handler okul ayarını okur; uygun statü ile create.
- Domain: `ClassRoom.Create()` davranışı `requireApproval` parametresi alır.
- Permission: `academic-sessions.approve-classroom` (varsayılan: `SchoolAdmin` rolüne atanmış).
- Frontend: Onay açıksa ClassRoom listede "Onay Bekliyor" badge'i + "Onayla" butonu.
- Notification: `ClassRoomCreatedEvent` `Status = PendingApproval` ise onaylayıcılara push (`notifications.md`).

**Edge case'ler:**
- Onay açıkken oluşturulan şube onay beklerken admin parametreyi `false` yaparsa: mevcut `PendingApproval` şubeler bekler (otomatik onaylanmaz); yeni şubeler direkt `Active` olur.

**Test referansı:** `ClassRoomCreationTests.WithApprovalRequired_ShouldBePending`

---

### BR-AS-009 ⭐: Karne otomatik üretim, manuel müdahale destekli

**Kural:** Dönem kapatıldığında (`AcademicTermClosedEvent`) karne PDF üretimi **otomatik** başlar; ancak idare gerektiğinde:
- Bireysel karneyi yeniden üretebilir (`Regenerate`)
- Karne içeriğini düzeltebilir (`marks` modülünde not düzeltmesi → karne otomatik yeniden üretilir)
- Karne yayınını geciktirebilir (`HoldPublication`)
- Toplu olarak yayınlayabilir (`PublishAll`)

**Konfigürasyon (opsiyonel, parametrik):**
- Tablo: `school_settings`
- Kolon: `auto_publish_report_cards` (bit, default 1/true)
- `true`: Karne üretimi tamamlanır tamamlanmaz velilere push.
- `false`: Karneler üretilir ama draft olarak kalır; idare manuel `PublishAll` der.

**Sebep:** Karneye son bir göz atma kültürü Türk okullarında yaygın. Bazı okullar otomatik gönderir (modern), bazıları kontrolden geçirir (klasik).

**Uygulama:**
- Bu modül: sadece `AcademicTermClosedEvent` raise eder.
- `report-cards` modülü (Sprint 3): event subscriber + Hangfire job + `auto_publish_report_cards` flag'ine göre davranır.
- Frontend: `report-cards` modülünde "Karne Yönetimi" ekranı (Sprint 3).

**Sprint 1 kapsamında:** Sadece okul ayarı kolonu eklenir (`auto_publish_report_cards`). Karne modülü tamamen Sprint 3.

**Edge case'ler:**
- Karne üretildikten sonra not düzeltilirse: yeni karne üretilir, eski karne `Superseded` statüsüne geçer; veliye "düzeltilmiş karne" bildirimi.

---

### BR-AS-010: Şube yıl-scope'lu

**Kural:** `ClassRoom` her sezon için ayrı kayıttır. 2024-2025'in 9-A'sı ile 2025-2026'nın 9-A'sı **iki farklı `ClassRoom.Id`**'dir.

**Sebep:** Arşiv mantığı: geçmiş sezon kapatıldığında o sezonun şubeleri otomatik salt-okunur olur. Yıl-bağımsız şube tutmak (`is_active` toggle ile) sezon değiştiğinde tarihsel sorguları imkansız kılar.

**Uygulama:**
- Domain: `ClassRoom.AcademicSessionId` zorunlu, immutable.
- DB: Unique constraint `(school_id, academic_session_id, grade_level_id, section)`.

---

### BR-AS-011: Şube değişiminde geçmiş veri korunur

**Kural:** Bir öğrenci şube değiştirdiğinde:
- Eski `ClassRoomStudent` kaydı `LeftAt = now, Reason = Transfer` ile **kapatılır** (UPDATE).
- Yeni `ClassRoomStudent` kaydı `AssignedAt = now, Reason = Transfer` ile **eklenir** (INSERT).
- Eski şubedeki yoklama, not, ödev kayıtları **silinmez**; o şubeye bağlı kalır.
- Yeni şubedeki yoklama, not, ödev kayıtları yeni atamadan itibaren başlar.

**Sebep:** Veli "Mehmet 9-A'dayken matematikten 75 almıştı" diyebilmeli. Tarihsel kayıt korunmalı.

**Uygulama:**
- Domain: `ClassRoom.TransferStudent(toClassRoomId, reason)` davranışı atomik.
- Event: `StudentTransferredEvent` payload'unda `FromClassRoomId` + `ToClassRoomId` ikisi de var.

**Edge case'ler:**
- Yıl içinde okuldan ayrılan öğrenci: yeni atama yok, `LeftAt = now, Reason = Archive`. Öğrenci `Status = Inactive`.

---

### BR-AS-012: 12. sınıf otomatik mezun edilir

**Kural:** Yeni sezon `Active` olduğunda, eski sezonun 12. sınıf şubeleri arşivlenir ve o şubelerin öğrencileri `Student.Status = Graduated` yapılır.

**Sebep:** Lise son sınıf bir sonraki yıla taşınmaz; üniversiteye geçer.

**Uygulama:**
- Backend: `AcademicSessionActivatedEvent` subscriber → `ProcessGraduationsHandler` → tüm `GradeLevel.Code = "12"` şubeleri arşivler + öğrencileri mezun eder.
- Event: `StudentGraduatedEvent` raise edilir.
- Notification: Veli ve öğrenciye "tebrik" mesajı (Sprint 2'de mesaj modülü açıldığında).

**Edge case'ler:**
- Sınıfı tekrar eden 12. sınıf öğrencisi (rare): yeni sezonda manuel olarak 12-X şubesine atanır. Otomatik mezun edilmez. Bu özel iş kuralı UI'da "Sınıf Tekrarı" checkbox ile yönetilir (Sprint 5+).
- Sprint 1'de mezun otomasyonu *yapılmaz*; manuel arşivleme yeterli. İlk pilot okul ilk yılında olduğu için Sprint 4'e bırakıldı.

---

### BR-AS-013: Şube en az 1 öğrenci kuralı — uyarı, engel değil

**Kural:** Şube en az 1 öğrenci olmadan `Active`'e geçemez — diye **bir kural yok**. Ama uyarı verilir.

**Sebep:** Şube önce oluşturulur, sonra öğrenci atanır. İdarenin pratik akışını engellememek.

**Uygulama:**
- Frontend: Boş şube `Active` olduğunda dashboardda "Boş şubeniz var: 9-D" uyarı kartı.
- Backend: Validasyon yok.

---

### BR-AS-014: Şube kapatma öncesi öğrenci taşıma zorunlu

**Kural:** `ClassRoom.Archive()` çağrılırken eğer aktif `ClassRoomStudent` kayıtları varsa engellenir.

**Sebep:** Öğrenciler "uçtaki" bir şubede asılı kalmamalı. İdare önce öğrencileri başka bir şubeye taşımalı.

**Uygulama:**
- Domain: `ClassRoom.Archive()` aktif öğrenci varsa `ClassRoomHasActiveStudentsException` fırlatır.
- Application: Frontend "Şubeyi Kapat" butonu disable + tooltip "Önce X öğrenciyi başka şubeye taşıyın".
- Toplu taşıma akışı: `ClassRoom.TransferAllStudents(toClassRoomId)` → tüm aktif öğrencileri tek transaction'da taşır → `Archive()` çağrılır.

**İstisna:** Sezon kapanırken otomatik arşivleme: tüm `ClassRoomStudent.LeftAt = SessionArchivedAt` yapılır (`Reason = Archive`), kontrol bypass'lanır.

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| Okul yeni kuruldu, hiç sezon yok | "Yeni Sezon Başlat" butonu ana ekranda büyük CTA olarak görünür |
| Sezon `Setup`'tayken admin başka bir `Setup` sezon açmaya çalışır | İzin verilir (çoklu setup OK). Sadece tek `IsCurrent = true` kuralı geçerli |
| Aktif sezonda admin tarihleri değiştirmeye çalışır | Reddedilir (`Setup` değil); `UpdateDatesNotAllowedInActiveStatusException` |
| Şube oluşturulurken aynı isim çakışması (`9-A` var) | `DuplicateClassRoomSectionException` → 409 Conflict |
| Öğrenci aktif değil ama şubeye atanmaya çalışılıyor | `Student.Status` check; `Active` değilse reddedilir |
| Mezun öğrenci yanlışlıkla bir sonraki sezona atanmaya çalışılıyor | `GraduatedStudentReenrollmentException` — özel akış (Sprint 5+) ile sınıf tekrarı yapılmalı |
| Onay bekleyen şube üzerinde öğrenci atama denemesi | Engellenir; "Şube önce onaylanmalı" uyarısı |
| Saklama süresi 0 yıl yapılmaya çalışılıyor | Reddedilir (min 1 yıl) |

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-05-15 | İlk iskelet | İlk implementasyon |
| 2026-05-25 | Modül adı `academic-years` → `academic-sessions` | Yan akademik akışların (yaz okulu, kurs) önünü açık tutmak |
| 2026-05-25 | BR-AS-007, 008, 009 parametrik kararlar eklendi | Müşteri açık soru cevapları: veri saklama, şube onayı, karne otomatik üretim |
| 2026-05-25 | `ClassRoom.AcademicTermId` kaldırıldı, sadece `AcademicSessionId` | "Tam yıl şube" pratiği — dönem-bağlı olanlar notlar/devamsızlık |
| 2026-05-25 | `ClassRoom`, `ClassRoomStudent`, `SchoolHoliday` bu modüle dahil edildi | Domain bütünlüğü: şubesiz sezon, sezonsuz şube anlamsız |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.