# Ders Programı (Scheduling) Modülü — Bağlayıcı Spec

**Kapsam:** Ders Programı modülü (Admin/Öğretmen/Öğrenci/Veli) — uçtan uca
**Hedef katmanlar:** `oksis-api` + `oksis-web`
**Durum:** Tasarım kararları (v1) — Faz 1 detaylı, Faz 2–4 yol haritası
**Mimari bağlam:** Modular Monolith · Vertical Slice · CQRS/MediatR · Clean Architecture · Multi-tenant
**Kaynaklar:** İhtiyaç analizi + Teknik analiz (Google Docs, 2026-06) · Claude Design handoff (`oksis-layout/project/app/schedule*.{jsx,css}`)
**Tarih:** 2026-06-12

> Bu dosya `.claude/specs/` altındadır → **bağlayıcı anlaşma** (CLAUDE.md Absolute Rule #6).
> Numaralı maddeler (`3.2`, `7.1` …) pazarlık dışıdır. Aykırılıkta dur, madde no ile bildir.

---

## 0. Yönetişim kararları (kullanıcı onaylı — 2026-06-12)

Bu kararlar brainstorming oturumunda alındı ve modülün tamamını yönetir:

- **K0.1 — Dilimleme:** İş **faz bazlı dikey dilim** olarak teslim edilir. Her faz FE+BE birlikte, çalışan ürün bırakır. Her faz kendi spec→plan→TDD→review→commit döngüsünden geçer.
- **K0.2 — Çakışma/aggregate modeli:** **Tam teknik-analiz modeli** benimsendi. `ScheduleProgram` aggregate (program = bir Sınıf+Dönem'in tamamı) + `LessonPlacement` entity + ayrık `TimeSlot(Day, Period)` + **filtreli unique index** ile DB-seviye çift-rezervasyon garantisi. Zaman, saat-aralığı (`StartTime/EndTime`) değil **period** olarak modellenir.
- **K0.3 — Doküman sonucu:** K0.2, mevcut `.claude/docs/modules/timetable/domain-model.md` ve `database-schema.md`'nin (satır-`Schedule` + zaman-aralığı modeli) **revize edilmesini** gerektirir. Bu sapma `timetable/completion_status.md → ⚠️ Spec Dışına Çıkılanlar`'a kaydedilir. Mevcut `Room` dilimi korunur.
- **K0.4 — Faz 1 sınırı:** Yayın & Onay **Faz 2**'dedir. Faz 1 = çekirdek + Hub + Editör (taslak kaydet); yayın yok.
- **K0.5 — Bağımlılık stratejisi:** Modül varsa **gerçek entegrasyon**, eksikse **port arkasında stub + completion_status'a "Debt"**. Faz 1 akışı bağımlılık eksikliğiyle tıkanmaz.
- **K0.6 — Tek doğruluk kaynağı:** Yayınlanmış program tek kaynaktır; yoklama/karne/nöbet vb. **okur, kopyalamaz** (ihtiyaç analizi §2, teknik analiz §8).

---

## 1. Faz yol haritası (teknik analiz §18 ile hizalı)

| Faz | Kapsam | Çıktı |
|---|---|---|
| **Faz 1 — Çekirdek + Admin Editör** | Domain + EF persistence + filtreli unique index + occupancy index + editör komutları + anlık ön-kontrol + Hub okuma modeli + Admin `schedule.jsx`(Hub) & `schedule_editor.jsx` | **Çakışmasız manuel program kurulup taslak kaydedilebilir** |
| **Faz 2 — Yayın & Dağıtım** | Versiyon/snapshot + Publish transaction + `ScheduleException`(geçici değişiklik) + SignalR fan-out + bildirim + tüketici okuma modelleri + Öğretmen/Öğrenci/Veli ekranları + `schedule_publish.jsx` | Program güvenle yayınlanır, herkese güncel ulaşır |
| **Faz 3 — Zekâ & Otomasyon** | `IScheduleSolver` + Hangfire otomatik üretim (`schedule_autogen.jsx`) + toplu yeniden atama + Redis okuma önbelleği | Program üretimi saatlerden dakikalara iner |
| **Faz 4 — Analitik & Olgunlaşma** | Dapper raporları + Kibana panoları + öğretmen müsaitlik/tercih akışı (`schedule_avail.jsx`) + Nöbet&Vekalet (`schedule_duty`) + Talepler (`schedule_requests.jsx`) + performans | Operasyonel görünürlük + optimizasyon |

> Ekran→faz eşlemesi tasarım handoff'una göre: Faz 1 = `schedule.jsx`, `schedule_editor.jsx`. Diğer `schedule_*.{jsx}` dosyaları sonraki fazlarda.

> **REVİZYON (2026-06-16) — bkz. `.claude/specs/ders-programi-cok-taslak-otomatik-uretim-design.md` (K1–K12):**
> Faz 3 otomatik üretim girişi **Hub başlığından, program-bağımsız ve sıfırdan** çalışır (sınıf-bazlı; aday
> uygulanınca **yeni Taslak program** yaratılır) — satır/editör `⋯` menüsünden değil. Ayrıca program tekilliği
> "tek program/sınıf"tan **"tek canlı (Yayında/Revize) + çok Taslak"a** revize edildi; rezervasyon yalnız canlı
> programlara daraltıldı. Aşağıdaki §4.1 tekillik maddesi bu tasarımla geçerliliğini yitirdi.

---

## 2. Faz 1 — Kapsam sınırı

### ✅ Dahil
- Domain: `ScheduleProgram`, `LessonPlacement`, `TimeSlot`, `WeeklyHourRequirement`, çakışma kuralları (katı).
- Persistence: `schedule_programs` + `lesson_placements` tabloları + filtreli unique index + occupancy index (Redis).
- Editör komutları: `CreateProgram`, `PlaceLesson`, `MoveLesson`, `RemoveLesson`, `AssignTeacher`, `AssignRoom`, `SetBlock`, `SaveDraft`.
- Sorgular: `PreCheckPlacement`(yazmaz), `GetProgramForEdit`, `GetUnplacedLessons`, Hub: `ListClassPrograms`, `GetHubSummary`.
- Web: `schedule.jsx` (Admin Hub/Liste) + `schedule_editor.jsx` (Editör) — tüm durum varyantları.

### ⛔ Hariç (sonraki fazlar)
- Yayın/onay, versiyonlama/snapshot, geçici değişiklik (override) → Faz 2.
- Öğretmen/Öğrenci/Veli görünümleri, bildirim, SignalR → Faz 2.
- Otomatik üretim, toplu atama → Faz 3.
- Müsaitlik/tercih, nöbet, talepler, analitik → Faz 4.

> **Not:** `Status` enum'unda `Published` değeri tanımlanır (şema sabit kalsın) ama Faz 1'de yalnızca `Draft`/`Revising` egzersiz edilir. Publish komutu Faz 2'de eklenir.

---

## 3. Domain modeli (Faz 1)

`Oksis.Domain/Modules/Timetable/` altında, mevcut `Room` ile yan yana.

### 3.1 `ScheduleProgram` (aggregate root)
Bir **Sınıf (BranchId) + Dönem (AcademicTermId)** için programın tamamı; `LessonPlacement`'ların sahibi.

| Alan | Tip | Not |
|---|---|---|
| `Id` | `ScheduleProgramId` (record struct Guid) | strongly-typed id |
| `SchoolId` | `Guid` | tenant, immutable |
| `AcademicYearId` / `AcademicTermId` | `Guid` | immutable |
| `BranchId` | `Guid` | sınıf/şube, immutable |
| `Status` | `ScheduleProgramStatus` | `Draft`, `Revising`, `Published` |
| `Version` | `int` | default 1 (Faz 2'de artar) |
| `RowVersion` | `byte[]` | optimistic concurrency |
| `Placements` | `IReadOnlyList<LessonPlacement>` | private backing, method ile değişir |

**Invariant'lar (aggregate içi, güçlü tutarlılık):**
- **INV-1 (Sınıf tekilliği):** Aynı program içinde aynı `TimeSlot`'a iki yerleşim olamaz.
- **INV-2 (Blok bütünlüğü):** `IsBlock` yerleşim → `BlockGroupId` zorunlu, aynı grupta ardışık ≥2 slot.
- **INV-3 (Haftalık saat):** (yumuşak doğrulama, application — müfredat girdisi varsa) her dersin yerleşim sayısı `WeeklyHourRequirement`'a eşit olmalı; eksik/fazla **uyarı** üretir (Faz 1'de bloklamaz, raporlanır).

**Davranışlar:** `Create(...)`, `Place(slot, subjectId, teacherId, roomId?)`, `Move(placementId, newSlot)`, `Remove(placementId)`, `AssignTeacher(placementId, teacherId)`, `AssignRoom(placementId, roomId?)`, `SetBlock(placementIds, blockGroupId)`. Hepsi INV-1/INV-2'yi korur; çapraz-kaynak çakışması (öğretmen/derslik) aggregate dışıdır → §7.

### 3.2 `LessonPlacement` (entity, aggregate içi)
| Alan | Tip | Not |
|---|---|---|
| `Id` | `LessonPlacementId` | |
| `Day` | `DayOfWeek` | |
| `Period` | `int` | zil çizelgesindeki ders sırası (1..N), bell schedule'dan |
| `SubjectId` | `Guid` | ders/branş |
| `TeacherId` | `Guid` | |
| `RoomId` | `Guid?` | opsiyonel |
| `IsBlock` | `bool` | |
| `BlockGroupId` | `Guid?` | |

> Aggregate'ler arası referans **yalnızca Id** ile (TeacherId/RoomId/SubjectId) — navigation property yok (modül izolasyonu, teknik analiz §3.2).

### 3.3 Value Objects
- **`TimeSlot`** = `(DayOfWeek Day, int Period)`. Değere göre eşitlik, immutable. `Period` aralığı school-settings bell schedule'dan türetilir.
  > **§106 Uygulama notu (2026-06-20):** `Day`, **gerçek `System.DayOfWeek`** semantiğindedir: Pazartesi=1 … Cuma=5 (hafta içi 1–5). Faz 1'den 2026-06-20'ye kadarki implementasyon 0-tabanlı (Pzt=0) `DayOfWeek` kullanıyordu — bu spec'in asıl niyetinden sapmaktı ve off-by-one bug sınıfı yarattı. 2026-06-20 itibarıyla kod + DB migration + FE gerçek `System.DayOfWeek` değerlerine hizalandı (bkz. `gun-konvansiyonu-system-dayofweek-hizalama-design.md`, K-GUN-1..8).
- **`WeeklyHourRequirement`** = `(Guid SubjectId, int RequiredHours)`. Müfredattan; Faz 1'de stub (§10).

### 3.4 Çakışma kuralları (specification)
Her kural ayrı, test edilebilir bir birim. **Katı (engelleyici):** Öğretmen tekilliği, Sınıf tekilliği, Derslik tekilliği, Müsaitlik(hard-block — Faz 4 girdisi, Faz 1'de no-op), Branş uyumu, Mekân türü uygunluğu. **Esnek (uyarı):** Faz 1'de yalnızca haftalık saat eksiği/fazlası uyarısı.

---

## 4. Persistence (Faz 1)

### 4.1 Tablolar
- **`schedule_programs`** — `id, school_id, academic_year_id, academic_term_id, branch_id, status, version, row_version` + audit. Unique: `(school_id, academic_term_id, branch_id)` (bir sınıf+dönem'e tek program). **[REVİZE 2026-06-16, K9 — bkz. tasarım dokümanı]** Unique filtresi `WHERE status >= 1` olarak genişletildi: tek **canlı** (Yayında/Revize) + sınırsız Taslak. Yerleşim unique index'leri (§4.2) ise `... AND is_reserving = 1` ile yalnız canlı programa daraltıldı (K8).
- **`lesson_placements`** — `id, school_id, program_id, academic_term_id, branch_id, day_of_week, period, subject_id, teacher_id, room_id?, is_block, block_group_id?, is_active` + audit. (`academic_term_id` ve `branch_id` §4.2 index'leri için `program`'dan denormalize edilir — bkz. AS-1.)

### 4.2 Filtreli unique index'ler (K0.2'nin teknik temeli — teknik analiz §3.2/§4.2)
```sql
-- Öğretmen çift-rezervasyonu (aktif yerleşimler)
CREATE UNIQUE INDEX UX_Placement_Teacher_Slot
  ON lesson_placements (school_id, academic_term_id, teacher_id, day_of_week, period)
  WHERE is_active = 1;
-- Derslik çift-rezervasyonu
CREATE UNIQUE INDEX UX_Placement_Room_Slot
  ON lesson_placements (school_id, academic_term_id, room_id, day_of_week, period)
  WHERE is_active = 1 AND room_id IS NOT NULL;
-- Sınıf tekilliği (DB backstop; INV-1 zaten aggregate içinde)
CREATE UNIQUE INDEX UX_Placement_Class_Slot
  ON lesson_placements (school_id, academic_term_id, branch_id, day_of_week, period)
  WHERE is_active = 1;
```
> `academic_term_id` `lesson_placements`'a denormalize edilir (index için), `program_id` üzerinden de erişilir.

### 4.3 Mevcut `schedules` tablosu uzlaştırması
Domain'de eski `Schedule` entity'si **yok** (yalnız `Room`). Eğer `schedules` tablosu için bir migration mevcutsa, ScheduleProgram modeline geçişte **drop/replace** edilir (dev ortamı, üretim verisi yok). Migration yazmadan önce mevcut migration listesi kontrol edilecek.

### 4.4 Occupancy index (Redis)
`IOccupancyIndex` port'u: dönem başına öğretmen/derslik için "dolu slotlar" haritası (set/bitmap). Anahtar: `sched:{tenant}:{term}:occ:teacher:{id}` / `...:room:{id}`. Cache-aside; **kaynak doğruluk DB**, Redis hız katmanı. Yerleştirme/silmede senkron.

---

## 5. Application slice'ları (Faz 1)

`Oksis.Application/Modules/Timetable/` altında (rooms dilimiyle yan yana):
```
Commands/  CreateProgram, PlaceLesson, MoveLesson, RemoveLesson,
           AssignTeacher, AssignRoom, SetBlock, SaveDraft
Queries/   GetProgramForEdit, GetUnplacedLessons, PreCheckPlacement,
           ListClassPrograms, GetHubSummary
Ports/     IOccupancyIndex, IScheduleConflictChecker
```
- Komutlar: FluentValidation + transaction; INV domain'de, çapraz çakışma `IOccupancyIndex` ön-kontrol + DB unique backstop.
- `PreCheckPlacement`: **yazmaz**, occupancy'den O(1) yeşil/kırmızı + sebep.
- Hub sorguları (`ListClassPrograms`, `GetHubSummary`): **Dapper** ile (ağır okuma; OKSİS'te Dapper read yasak değil).
- Pipeline OKSİS standardı: RequestLogging→Validation→TenantContext→Authorization→Transaction(komut)→Caching(query).

---

## 6. API uçları (Faz 1)

OKSİS standardı: **thin controller → `ISender.Send`** (teknik analizdeki "Minimal API" yerine OKSİS controller deseni — **küçük sapma**, completion_status'a kaydedilir). Rota tabanı `/api/v1/timetable`.

| Uç | İzin |
|---|---|
| `GET /programs` (Hub listesi: sınıf merceği, durum/çakışma/eksik-saat rozet) | `timetable.view-all` |
| `GET /programs/{id}` (editör için tam program + yerleşimler) | `timetable.manage` |
| `POST /programs` (CreateProgram) | `timetable.manage` |
| `POST /programs/{id}/placements` (PlaceLesson) | `timetable.manage` |
| `PUT /programs/{id}/placements/{pid}` (Move/AssignTeacher/AssignRoom/SetBlock) | `timetable.manage` |
| `DELETE /programs/{id}/placements/{pid}` (RemoveLesson) | `timetable.manage` |
| `POST /programs/{id}/precheck` (anlık, yazmaz) | `timetable.manage` |
| `GET /programs/{id}/unplaced` (yerleşmemiş dersler) | `timetable.manage` |
| `GET /programs/{id}/conflicts` (çakışma/eksik raporu) | `timetable.manage` |

Hatalar **ProblemDetails** + correlationId. Çakışma → engelleyici/uyarı listesi nesnesi. Eşzamanlılık → 409 (rowversion).

---

## 7. Çakışma motoru (iki kademe — teknik analiz §6)

| Kademe | Ne zaman | Nasıl | Amaç |
|---|---|---|---|
| Etkileşimli ön-kontrol | Sürükle-bırak (her hareket) | `IOccupancyIndex` O(1) | Anlık yeşil/kırmızı + sebep |
| Yetkili doğrulama | Place/Save anında | Transaction içinde DB + filtreli unique backstop | Kesin sonuç |

Sınıf tekilliği aggregate içi (INV-1). Öğretmen/derslik tekilliği aggregate sınırını aşar → occupancy ön-kontrol + DB unique index (son savunma; yarış durumunda DB ikinci kaydı reddeder).

---

## 8. İzinler (mevcut — değişmez)

`timetable.view`, `timetable.view-all`, `timetable.view-rooms`, `timetable.manage`, `timetable.publish`, `timetable.override`, `timetable.manage-rooms`, `timetable.import-excel` zaten tanımlı ve seed'li (`permissions.md`). Faz 1 yalnızca `timetable.manage` (editör/komut) + `timetable.view-all` (Hub) kullanır.

---

## 9. Frontend (Faz 1 — `oksis-web`)

Tasarım kaynağı: `oksis-layout/project/app/schedule.jsx`, `schedule_editor.jsx` (+ `.css`). Piksel detayları implementasyon sırasında okunur.

### 9.1 `schedule.jsx` — Admin Hub/Liste
- Sınıf bazlı program listesi; durum (Taslak/Yayında), çakışma rozeti, eksik-saat rozeti.
- Filtre+arama+sayfalama → **URL search params** (React Router).
- Liste: shadcn `DataTable` wrapper.
- Durum varyantları: **boş** (program yok → "Program Oluştur" CTA), **yükleniyor** (skeleton, spinner yasak), **hata** (ProblemDetails), **dolu**.
- Aksiyon: satırdan editöre git / yeni program oluştur.

### 9.2 `schedule_editor.jsx` — Editör
- Sürükle-bırak haftalık ızgara (gün × period), bell schedule'dan period grid.
- **Anlık ön-kontrol:** sürüklerken hedef slot yeşil/kırmızı + sebep ("öğretmen 9-B'de"). `POST /precheck`.
- Yerleştir/taşı/sil, öğretmen/derslik ata, blok ders işaretle, **Taslak Kaydet**.
- Yan panel: **yerleşmemiş dersler** (görevlendirmeden gelen, henüz yerleştirilmemiş), çakışma/eksik-saat raporu.
- Durum varyantları: boş program, kaydediliyor, çakışma uyarısı, eşzamanlılık (409 → yeniden yükle), kaydedildi.
- Server state React Query (tenant-prefixed key), editör yerel etkileşim state Zustand. shadcn/ui + Tailwind, tasarım token'ları (Plus Jakarta Sans, lacivert admin accent, compact).

---

## 10. Cross-modül bağımlılıklar (K0.5)

| Girdi | Kaynak modül | Durum | Faz 1 stratejisi |
|---|---|---|---|
| Görevlendirme (kim hangi dersi/sınıfı, haftalık saat) | Teachers (`TeachingAssignment`, `GetTeacherAssignments`) | ✅ Var | **Gerçek entegrasyon** — "yerleşmemiş dersler" buradan. Binding spec `oksis-admin-ekranlari-mimari-spec.md §5.7`: program görevlendirmeyi **tüketir, üretmez**. |
| Period grid / zil çizelgesi | Schools (`BellSchedule`, `GetBellSchedules`) | ✅ Var | **Gerçek entegrasyon** — `Period` aralığı buradan; `IBellScheduleProvider` port'u. |
| Müfredat haftalık saati (`WeeklyHourRequirement`) | Subjects/Academics (curriculum hours) | ❌ Yok | **Stub + Debt** — port arkasında stub; haftalık-saat doğrulaması (INV-3) stub veriyle çalışır, `completion_status`'a Debt yazılır. |
| Tatil kontrolü (`IHolidayChecker`) | school-settings/academic-years | (Faz 2'de override için) | Faz 1'de gerekmez. |

---

## 11. Kabul kriterleri (Faz 1)

- [ ] `ScheduleProgram` aggregate + `LessonPlacement` + `TimeSlot` domain testleriyle (INV-1/INV-2) yeşil.
- [ ] Migration: `schedule_programs` + `lesson_placements` + 3 filtreli unique index; eski `schedules` tablosu uzlaştırıldı.
- [ ] Filtreli unique index entegrasyon testi: iki eşzamanlı öğretmen çift-rezervasyonundan ikincisi DB tarafından reddedilir.
- [ ] `IOccupancyIndex` Redis impl; `PreCheckPlacement` yazmadan yeşil/kırmızı döner.
- [ ] Editör komutları + Hub sorguları endpoint'leri çalışır, tenant-filtreli, `timetable.manage`/`view-all` korumalı.
- [ ] `schedule.jsx` Hub: tüm durum varyantları (boş/yükleniyor/hata/dolu), URL search-param filtre.
- [ ] `schedule_editor.jsx`: sürükle-bırak + anlık ön-kontrol + taslak kaydet; çakışmasız program kurulup kaydedilebilir.
- [ ] `timetable/completion_status.md`: ilerleme + ⚠️ Spec Dışına Çıkılanlar (K0.2 model revizyonu, controller sapması, curriculum-hour Debt) güncel.
- [ ] `timetable/domain-model.md` + `database-schema.md` yeni modele göre revize.

---

## 12. Açık sorular / riskler

- **AS-1:** `lesson_placements`'ta `academic_term_id` denormalizasyonu vs. `program_id` join — index için denorm seçildi; EF config'de tutarlılık (program'ın term'i ile placement'ın term'i aynı) interceptor/invariant ile garanti edilmeli.
- **AS-2:** Bell schedule kademe bazlı farklı period sayısı verebilir; `Period` aralığı program'ın şubesinin kademesine göre çözülür. school-settings sözleşmesi netleştirilecek.
- **AS-3:** Müfredat-saat stub'ı gerçek veriyle değişince INV-3 doğrulaması sıkılaşır; Debt kapanışı Faz 1 sonrası.
- **AS-4:** Eski `schedules` migration'ı varsa drop stratejisi (dev'de güvenli; üretimde olsaydı veri taşıma gerekirdi).

---

*Oksis — Ders Programı Modülü Bağlayıcı Spec · v1 · Faz 1 detaylı · 2026-06-12*
