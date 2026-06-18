# Ders Programı — Nöbet Çizelgesi Çekirdeği (Faz 4 / Dilim 2a) Tasarımı

**Durum:** Tasarım kararları onaylandı (brainstorming, kullanıcı onayı 2026-06-19)
**Tarih:** 2026-06-19
**İlgili bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` (Faz yol haritası §1, Faz 4; tek doğruluk kaynağı K0.6)
**Önceki dilim:** `.claude/specs/ders-programi-faz4-dilim1-musaitlik-design.md` (Faz 4 / Dilim 1 — Müsaitlik & Tercih, TAMAM)
**Modül:** `timetable` + yeni `Duties` (`.claude/docs/modules/timetable/`)
**Kapsam:** Faz 4 / Dilim 2a — Nöbet çizelgesi çekirdeği (`schedule_duty` admin yönetimi + öğretmen görünümü)
**Kaynak analizler:** `Nobet-Vekalet-Ihtiyac-Analizi.docx` (saha + ürün), `Nobet-Vekalet-Teknik-Analiz.docx` (mimari)
**Tasarım handoff'u:** `oksis-layout/project/app/duty_admin.jsx`, `duty_admin_more.jsx`, `schedule_duty.jsx` (+ `.css`), `screenshots/01-04-duty.png`

> Bu dosya `.claude/specs/` altındadır → **bağlayıcı anlaşma** (CLAUDE.md Absolute Rule #6).
> Numaralı kararlar (`K-2a-1` …) pazarlık dışıdır. Aykırılıkta dur, madde no ile bildir.

---

## 0. Dilim 2 Konumlandırması (Nöbet & Vekâlet bütünü)

Faz 4 / Dilim 2 (Nöbet & Vekâlet) **dört alt-dilime** ayrıldı (kullanıcı onayı 2026-06-19). Her alt-dilim kendi spec→plan→TDD→review→commit döngüsünden geçer ve çalışan ürün bırakır:

| Alt-dilim | Kapsam | Bağımlılık |
|---|---|---|
| **2a — Nöbet Çizelgesi (çekirdek)** | **BU DOKÜMAN.** Bölge kataloğu + muafiyet + politika ayarları + manuel çizelge + temporal sürümleme + öğretmen görünümü + bildirim | Dilim 1, bell schedule, P28 |
| 2b — Vekâlet İş Akışı | Gelmeyen öğretmen → öneri → `CreateSubstitution` (Faz 2.5 `ScheduleException` üzerine) → bildirim → öğretmen onay | Faz 2.5, P28, 2a |
| 2c — Adil Otomatik Dağıtım | `IDutySolver` + öner≠uygula + Hangfire | 2a |
| 2d — Raporlama & Nöbet Defteri | Dönem yük/adalet raporu (Dapper) + nöbet defteri olay kaydı | 2a, 2b |

Bu doküman yalnız **2a**'yı tanımlar. 2b/2c/2d için ekranlarda görünür ama pasif (disabled/placeholder) bırakılan kancalar §6'da işaretlenir.

---

## 1. Amaç & Bağlam

Türk okullarında **nöbet**, öğretmenlerin ders saatleri dışında okulun güvenlik ve düzenini sağlamak üzere sırayla üstlendiği planlı görevdir. Bugün Excel/kağıt/duvar panosuyla yürütülür; ders programıyla elle eşleştirilir, adaletsizlik ve güncel-olmayan çizelge sancıları yaşanır.

2a, nöbet çizelgesini **yarı-otomatik, adil ve denetlenebilir** hâle getirir: koordinatör bölge × gün ızgarasında çakışmasız çizelge kurar, yürürlük tarihiyle yayınlar; öğretmen kendi nöbet/yancı bilgisini tek yerden güncel görür.

**Çekirdek kavramlar (İhtiyaç analizi §3, Teknik analiz §1):**
- **Nöbet birimi = gün + kat/bölge** (ders-slotu DEĞİL). Öğretmen belirli bir **gün** belirli bir **bölgenin** nöbetçisidir; aktif gözetim zil çizelgesinin teneffüs/öğle/giriş-çıkış pencerelerindedir. Öğretmen kendi derslerini normal işler.
- **Yancılık** = nöbetçi öğle yemeğindeyken (15–20 dk) bölgesine bakan kısa gözetim devri. **Okul-bazlı parametre**; kapalıysa kavram hiçbir ekranda görünmez.
- **Muafiyet** = bazı öğretmenler (idareci, rehber, sağlık, yarı zamanlı) nöbetten kısmen/tamamen muaf.
- **Temporal çizelge** = dönem başında kurulur ama sezon ortası kadro değişiminde sabit kalmaz; yeni sürüm yürürlüğe girer, eskisi kapanır, **geçmiş korunur**.

---

## 2. Bağlayıcı Kararlar (kullanıcı onaylı — 2026-06-19)

- **K-2a-1 — Nöbet birimi: gün + bölge.** Atama birimi `(TeacherId × DayOfWeek × DutyLocationId)`. Nöbet ders programındaki boş ders saatlerine **yerleştirilmez**; ders saati çakışması kavramı nöbet için **yoktur** (gözetim pencerelerde). (İhtiyaç §3.2/§6.1, Teknik §1.1.)

- **K-2a-2 — Müsaitlik (Dilim 1) nöbete HİÇ yansımaz.** Müsaitlik ders-programının konusudur ve yalnız **ders saatlerini** ilgilendirir; nöbet ve yancı dağıtımına **girdi değildir** (kullanıcı kararı 2026-06-19). → **Teknik analiz §3.4 ("Müsait-değil slot → nöbete uyarı") ve §8.2 ("Nöbet/yancı dağıtımı müsaitlik verisini girdi alır") maddeleri GEÇERSİZ.** Bu sapma `completion_status.md → ⚠️ Spec Dışına Çıkılanlar`'a kaydedilir. (Not: Yancının "o saatte dersi olmamalı" kuralı *fiili ders yerleşimi* kontrolüdür — müsaitlik değil; geçerli kalır, bkz. K-2a-8.)

- **K-2a-3 — Kapasite-farkındalıklı model.** `DutyLocation.Capacity ≥ 1`. Aynı `(gün, bölge)` hücresine kapasite kadar nöbetçi atanabilir (ör. Bahçe ×2). → **Teknik analiz "INV-1: aynı (gün,bölge) tek nöbetçi" + tek-nöbetçi unique index'i GEÇERSİZ;** yerine: unique index `(school_id, academic_term_id, day_of_week, location_id, teacher_id)` (aynı öğretmen aynı hücrede iki kez yazılamaz) + aggregate'te `count ≤ Capacity` invariant'ı. Bu sapma loglanır.

- **K-2a-4 — Temporal sürümleme (silme yok).** `DutyRoster` `Status` (Draft/Published/Superseded) + `Version` (int) + `EffectiveFrom`/`EffectiveTo` (DateOnly?) + `PreviousVersionId` taşır. Yayın yeni **canlı** sürüm üretir; varsa önceki canlı sürüm `EffectiveTo = yürürlük tarihi` ile **supersede** edilir. Aynı dönemde tek canlı (`EffectiveTo == null`) çizelge. Hard-delete yok; soft-delete + audit + row_version. Ders programının ScheduleVersion/EffectiveTo modeliyle hizalı (K0.6). (İhtiyaç §3.9/§9 OQ-duty-007 [KARAR], Teknik §1.2/§3.4.)

- **K-2a-5 — Politika parametreleri SchoolSettings'te.** Yancılık + haftalık sıklık + gün düzeni `SchoolSettings`'e eklenir (mevcut `UpdateXConfiguration` deseni): `DutiesRelieverEnabled` (bool), `DutyWeeklyFrequency` (enum), `DutyDayPattern` (enum). `DutyWeeklyFrequency`/`DutyDayPattern` 2a'da **inert** (yalnız 2c otomatik dağıtım girdisi) ama UI'da kaydedilir. `DutiesRelieverEnabled` **her duty ekranını gate'ler**: kapalıysa yancı alanı/atama/gösterimi hiçbir yerde yok. Ayrı `DutyPolicy` aggregate'i **icat edilmez** (YAGNI). (İhtiyaç §3.6/§3.3, Teknik §10.1 "Dikkat — yeni ayar anahtarı".)

- **K-2a-6 — Yeni izin ailesi `duties.*`.** `duties.view` (görüntüleme), `duties.manage` (bölge/çizelge/yayın/muafiyet/yancı). `duties.substitute` (2b) ve `duties.view-load` (2d) bu dilimde **tanımlanır ama egzersiz edilmez** (spec §2 "enum değeri tanımlanır" deseni). Bu yeni aile mevcut `timetable.*` izinlerinden **bağımsızdır** (spec §8 "timetable izinleri değişmez" maddesiyle çakışmaz — farklı modül izni). Rol eşlemesi: SchoolAdmin tam; Teacher `view` **self-only**; SuperAdmin/Secretary `view` read-only; Parent/Student yok. (Teknik §4.)

- **K-2a-7 — Vekalet için yeni model YOK.** Vekâlet 2b'de mevcut `ScheduleException`/`TeacherSubstitution` (Faz 2.5) üzerinde yürür. 2a yeni nöbet aggregate'i getirir, vekâlet'e dokunmaz. (Teknik §2.1, OQ-duty-002 [KARAR-2b].)

- **K-2a-8 — Yancı kısıtı = fiili ders + gün-tekilliği (müsaitlik DEĞİL).** Yancı: o gün muaf olmamalı + o gün başka nöbet/yancı görevi olmamalı + öğle penceresinde **fiili dersi** olmamalı. Öğle penceresi bell schedule'dan türetilir (öğle arasıyla örtüşen period(lar)). "Boşta kim var" mantığı P28 `GetAvailableTeachers` deseniyle hizalı ama müsaitlik tablosuna bakmaz.

- **K-2a-9 — Öğretmen görünümü 2a'da (web, salt-okunur).** Öğretmen kendi nöbet + yancı bilgisini web'de görür (`schedule_duty.jsx` port; nöbet/yancı kısmı). Vekâlet bölümü 2b'de eklenir; itiraz akışı `schedule_requests` dilimine ertelenir (Debt). Mobil bu dilimde **yok** (ders programının kendisinde de mobil yok).

---

## 3. Domain & Persistence

`Oksis.Domain/Modules/Duties/` altında (mevcut `DutyLocationTemplate` master entity'siyle yan yana).

### 3.1 Aggregate ve Entityler

```
DutyLocation (aggregate root, tenant)        // master DutyLocationTemplate'ten klonlanır
  DutyLocationId (record struct, Guid)
  SchoolId (IHasTenant)
  string  Name                               // "1. Kat Koridoru", "Kantin"
  DutyLocationType Type                       // Floor/Canteen/Garden/Gate/Hall/Other
  string? Icon                                // handoff: building/utensils/sun/door-open...
  int     Capacity                            // ≥1 (paralel nöbetçi); K-2a-3
  bool    IsActive
  Guid?   TemplateId                          // klonlandığı master template (opsiyonel iz)

DutyExemption (aggregate root, tenant)
  DutyExemptionId (record struct, Guid)
  SchoolId
  Guid    TeacherId
  DutyExemptionType Type                       // Permanent/Temporary
  DateOnly? From, To                           // Temporary aralığı (Permanent'ta null)
  string  Reason                               // zorunlu, max 200

DutyRoster (aggregate root, tenant)
  DutyRosterId (record struct, Guid)
  SchoolId
  Guid    AcademicYearId
  Guid    AcademicTermId
  DutyRosterStatus Status                      // Draft/Published/Superseded
  int     Version                              // default 1
  DateOnly? EffectiveFrom                       // yayında set
  DateOnly? EffectiveTo                         // supersede edilince set
  DutyRosterId? PreviousVersionId              // sürüm zinciri
  byte[]  RowVersion
  IReadOnlyList<DutyAssignment> Assignments    // private backing

DutyAssignment (entity, DutyRoster'a ait)
  DutyAssignmentId (record struct, Guid)
  Guid    TeacherId
  DayOfWeek Day                                // Pzt..Cum
  DutyLocationId LocationId
  Guid?   RelieverId                           // yancı (parametre açıksa); K-2a-5/K-2a-8
```

**Enumlar:**
```csharp
public enum DutyLocationType { Floor = 0, Canteen = 1, Garden = 2, Gate = 3, Hall = 4, Other = 5 }
public enum DutyRosterStatus { Draft = 0, Published = 1, Superseded = 2 }
public enum DutyExemptionType { Permanent = 0, Temporary = 1 }
public enum DutyWeeklyFrequency { TwicePerWeek = 0, OncePerWeek = 1, OnceEveryTwoWeeks = 2 }  // SchoolSettings
public enum DutyDayPattern { Spread = 0, Consecutive = 1 }                                     // SchoolSettings
```

**DutyRoster davranışları:** `CreateDraft(...)`, `Assign(teacherId, day, locationId)`, `RemoveAssignment(id)`, `AssignReliever(assignmentId, relieverId)`, `ClearReliever(assignmentId)`, `Publish(effectiveFrom)`, `Supersede(asOf)`. Hepsi aşağıdaki invariant'ları korur.

**Invariant'lar (aggregate içi, güçlü tutarlılık):**
- **INV-D1 (Muafiyet):** Muaf öğretmene nöbet/yancı atanamaz (atama anında muafiyet kontrolü application katmanında — muafiyet ayrı aggregate; bkz. AS-2a-1).
- **INV-D2 (Gün-tekilliği):** Aynı öğretmen aynı güne ikinci **nöbet** alamaz (handoff `busyDay` mantığı). Yancı da aynı gün nöbeti/yancısı olmayan biri olmalı (K-2a-8).
- **INV-D3 (Kapasite):** Bir `(gün, bölge)` hücresindeki atama sayısı `DutyLocation.Capacity`'yi aşamaz.
- **INV-D4 (Yancı = nöbetçi değil):** Bir atamanın `RelieverId`'si o atamanın `TeacherId`'sine eşit olamaz.
- **INV-D5 (Sürüm tekilliği):** Aynı dönemde tek canlı (`Status == Published && EffectiveTo == null`) roster (DB filtreli unique index backstop).

> Strongly-typed ID, domain saflığı (EF Core / DataAnnotations yok). Aggregate'ler arası referans yalnız Id (TeacherId, vb.) — navigation property yok (modül izolasyonu).

### 3.2 SchoolSettings eklemeleri

`Oksis.Domain/Modules/Schools/Entities/SchoolSettings.cs`'e (mevcut aggregate):
```csharp
public bool DutiesRelieverEnabled { get; private set; }            // default false
public DutyWeeklyFrequency DutyWeeklyFrequency { get; private set; } // default OncePerWeek
public DutyDayPattern DutyDayPattern { get; private set; }          // default Spread

public void UpdateDutiesConfiguration(
    bool dutiesRelieverEnabled,
    DutyWeeklyFrequency weeklyFrequency,
    DutyDayPattern dayPattern);   // SchoolSettingsUpdatedEvent fırlatır (mevcut desen)
```

### 3.3 Tablolar (`[academic]` şeması)

- **`duty_locations`** — `(id, school_id, name, type, icon, capacity, is_active, template_id, ...audit, row_version)`.
- **`duty_exemptions`** — `(id, school_id, teacher_id, type, from, to, reason, ...audit)`.
- **`duty_rosters`** — `(id, school_id, academic_year_id, academic_term_id, status, version, effective_from, effective_to, previous_version_id, ...audit, row_version)`.
- **`duty_assignments`** — `(id, school_id, duty_roster_id, academic_term_id, teacher_id, day_of_week, location_id, reliever_id?, is_active, ...audit)`. (`academic_term_id` index için roster'dan denormalize.)

**Filtreli unique index'ler:**
```sql
-- Aynı öğretmen aynı (gün, bölge) hücresinde iki kez yazılamaz (K-2a-3, kapasite domain'de)
CREATE UNIQUE INDEX ux_duty_assignment_teacher_cell
  ON duty_assignments (school_id, academic_term_id, duty_roster_id, day_of_week, location_id, teacher_id)
  WHERE is_active = 1 AND is_deleted = 0;
-- Aynı dönemde tek canlı roster (INV-D5 backstop)
CREATE UNIQUE INDEX ux_duty_roster_live
  ON duty_rosters (school_id, academic_term_id)
  WHERE status = 1 AND effective_to IS NULL AND is_deleted = 0;
```
- Lookup index'leri: `duty_assignments (school_id, academic_term_id, teacher_id)` (öğretmen görünümü / yük), `duty_rosters (school_id, academic_term_id, status)`.
- **Migration:** `20260619_add_duties_roster` (+ SchoolSettings kolonları aynı veya ayrı migration'da).

### 3.4 Tenancy
`IHasTenant` → EF global query filter + `TenantSaveChangesInterceptor` `SchoolId`'i otomatik doldurur, cross-tenant değişikliği reddeder, immutable yapar. Standart; özel iş yok.

---

## 4. Çakışma / Ön-Kontrol Kuralları

| Kural | Tür | Davranış |
|---|---|---|
| Muaf öğretmene nöbet/yancı | **Sert** | Atama engellenir; UI'da muaf öğretmen menüde gösterilmez/disabled. |
| Gün-tekilliği (aynı öğretmen aynı güne 2. nöbet) | **Sert** | Menüde "o gün dolu" disabled; komut reddeder (INV-D2). |
| Kapasite aşımı | **Sert** | `(gün,bölge)` count == Capacity ise yeni atama reddedilir (INV-D3). |
| Yancı = nöbetçinin kendisi | **Sert** | INV-D4. |
| Yancı öğle penceresinde dersi var | **Sert** | Aday listesinden çıkar (`GetAvailableRelievers`, K-2a-8). |
| **Nöbet ↔ ders saati** | **YOK** | Nöbet gün-bazlı, pencerelerde — ders çakışması kavramı yok (K-2a-1). |
| **Müsaitlik (Dilim 1)** | **YOK** | Nöbet/yancıya hiç girdi değil (K-2a-2). |
| Sezon-ortası değişiklik | — | Yayınlanmış çizelge yerinde ezilmez; yeni sürüm + eskisi supersede (K-2a-4). |
| Aşırı nöbet yükü | Bilgi | Yük & Adalet panelinde gösterilir; engellemez (adil dağıtım 2c). |

İki kademe: (1) **etkileşimli ön-kontrol** — editörde hücre menüsü açılırken "o gün dolu/muaf" anında işaretlenir (handoff `DtaCellMenu` `busyDay`); (2) **yetkili doğrulama** — Save/Assign komutunda domain INV + DB unique backstop.

---

## 5. API

Rota tabanı `/api/v1/duties`. OKSİS standardı: thin controller → `ISender.Send` + `ToHttpResult`. Pipeline: RequestLogging→Validation→TenantContext→Authorization→Transaction(komut)/Caching([Cacheable] query). Hatalar ProblemDetails + correlationId; eşzamanlılık 409 (row_version).

| Uç | İzin | İşlev |
|---|---|---|
| `GET  /duties/locations` | `duties.view` | Bölge kataloğu (+ template'ten klonlanabilir liste) |
| `POST /duties/locations` | `duties.manage` | Bölge oluştur (template'ten klon veya özel) |
| `PUT  /duties/locations/{id}` | `duties.manage` | Bölge güncelle (ad/tür/kapasite/aktif) |
| `DELETE /duties/locations/{id}` | `duties.manage` | Bölge soft-delete (bağlı atamalar kaldırılır — onay UI'da) |
| `GET  /duties/exemptions` | `duties.view` | Muafiyet listesi |
| `POST /duties/exemptions` | `duties.manage` | Muafiyet ekle |
| `DELETE /duties/exemptions/{id}` | `duties.manage` | Muafiyet kaldır |
| `GET  /duties/roster?termId=` | `duties.view` | Editör: dönem canlı/taslak çizelge (gün×bölge) |
| `PUT  /duties/roster?termId=` | `duties.manage` | Taslak kaydet (atama/taşı/kaldır — tamponlu replay) |
| `POST /duties/roster/reliever` | `duties.manage` | Yancı ata/kaldır (yalnız `DutiesRelieverEnabled`; kapalıysa 409) |
| `POST /duties/roster/publish` | `duties.manage` | Yayınla: EffectiveFrom + supersede + event |
| `GET  /duties/roster/versions?termId=` | `duties.view` | Sürüm geçmişi (yürürlük tarihli) |
| `GET  /duties/summary?termId=` | `duties.view` [Cacheable] | Hub metrikleri (atanan/eksik/muaf/çakışma) |
| `GET  /duties/available-relievers?termId=&day=&locationId=` | `duties.manage` | Yancı adayları (K-2a-8) |
| `GET  /duties/me?termId=` | `duties.view` (self) | Öğretmen kendi nöbet/yancı kayıtları |
| `PUT  /schools/settings/duties` | `duties.manage` | Yancılık + sıklık + gün düzeni (UpdateDutiesConfiguration) |

- CQRS slice'ları: Commands — `CreateDutyLocation`, `UpdateDutyLocation`, `DeleteDutyLocation`, `SetDutyExemption`, `RemoveDutyExemption`, `SaveDutyRosterDraft`, `AssignReliever`, `PublishDutyRoster`, `UpdateDutiesConfiguration`. Queries — `ListDutyLocations`, `ListDutyExemptions`, `GetDutyRosterForEdit`, `GetDutyRosterVersions`, `GetDutyHubSummary` [Cacheable], `GetAvailableRelievers`, `GetMyDuties`.
- FluentValidation: bölge adı/kapasite (1..4), muafiyet sebep/tarih, roster atamaları (term/teacher/location var mı), yayın tarihi.
- Mapster DTO eşleme (IRegister). Hub özetinde ağır okuma gerekirse Dapper (yasak değil).
- `GetDutyHubSummary` publish/atama/muafiyet/ayar değişiminde tenant-prefixli key invalidate.

---

## 6. Web — Admin Ekranı

Handoff: `duty_admin.jsx` (`DutyAdminScreen`, çizelge sekmesi + modallar/drawerlar), `duty_admin_more.jsx` (vekâlet + politika sekmeleri). **Handoff jsx+css birebir port edilir** (gerçek hook'lara bağlanarak); ekran kalıbı `schedule_avail` (AvailabilityScreen) ile aynı: `PageTop → aca-tabs (3 sekme) → stu-inner`.

Konum: `src/portals/admin/duties/` (timetable portalının kardeşi). `DutyAdminPage.tsx` + üç sekme bileşeni + modallar + drawerlar + `duties.css` (handoff css'ten port).

### 6.1 PageTop
- Breadcrumb: Akademik › Ders Programı › Nöbet & Vekâlet.
- Başlık + alt-açıklama (handoff metni birebir).
- Aksiyonlar: **Öğretmen Görünümü** (önizleme modal) + **Çizelgeyi Yayınla** (politika sekmesinde yerine **Kaydet** + dirty uyarısı).

### 6.2 Sekme 1 — Nöbet Çizelgesi (`DtaCizelge`)
- **Özet şeridi:** haftalık nöbet ataması, kişi başı aralık, muaf öğretmen, çakışma uyarısı sayaçları.
- **Toolbar:** dönem seçici, sürüm rozeti (`v{n} · {tarih}'ten beri`), Sürüm geçmişi, (yancılık kapalıysa "Yancılık kapalı" rozeti), **Nöbet Defteri (→ 2d, disabled)**, Dışa Aktar, **Adil Otomatik Dağıt (→ 2c, disabled)**.
- **Izgara (gün × bölge):** her hücrede nöbetçi (avatar+ad+branş); yancılık açıksa ikinci satırda yancı; boş hücre "Ata"; çakışma kırmızı kenar. Hücre tıklama → `DtaCellMenu` popover (öğretmen ara + yük göstergesi + "o gün dolu" disabled + atamayı kaldır).
- **Yük & Adalet paneli:** kişi başı nöbet/yancı dağılımı bar'larla; dengeli/dengesiz pill (hesaplanmış, `GetDutyHubSummary`/roster'dan).
- **Drawer/Modal:** Sürüm Geçmişi drawer (`DtaVersionDrawer`), Yayınla modal (`DtaPublishModal` — yürürlük tarihi + supersede önizleme), Öğretmen Görünümü önizleme (`DtaTeacherPreview`).

### 6.3 Sekme 2 — Vekâlet (Bugün) → **2b placeholder**
2a'da sekme görünür ama içerik **boş-durum/placeholder** ("Vekâlet iş akışı yakında — Dilim 2b"). Handoff `DtaVekalet` 2b'de bağlanır. Sekme sayacı 0/gizli.

### 6.4 Sekme 3 — Bölgeler & Politika (`DtaPolitika`)
- **Sol:** Nöbet Bölgeleri kataloğu (CRUD; ekle/düzenle modal `DtaRegionModal` — ad/tür/ikon/kapasite/aktif; sil onayı `DtaConfirm`) + Muafiyetler (CRUD; ekle modal `DtaMuafModal`).
- **Sağ:** Nöbet Politikası — Haftalık sıklık (segment), Gün düzeni (segment), **Öğle arası yancılığı** (toggle → `DutiesRelieverEnabled`). Politika kaydı `UpdateDutiesConfiguration`; dirty takibi PageTop'ta. (Not: sıklık/düzen 2a'da kaydedilir ama dağıtımı 2c'de etkiler.)

### 6.5 React Query anahtarları (tenant-prefixed, `tenantScopedKey`)
```
['duties','locations']                              // bölge kataloğu
['duties','exemptions']                             // muafiyetler
['duties','roster', termId]                         // editör ızgarası
['duties','summary', termId]                        // hub metrikleri
['duties','versions', termId]                       // sürüm geçmişi
['duties','available-relievers', termId, day, locationId]
['duties','my', termId]                             // öğretmen self
```
Atama/yayın/politika sonrası ilgili key'ler invalidate. Server state yalnız React Query; editör taslak op-log'u yerel (Kaydet'te replay) — `schedule_editor` desenindeki gibi.

### 6.6 Zod / form
`region` (name, type, icon, capacity 1..4, isActive), `exemption` (teacherId, type, from?/to?, reason min 3), `dutiesPolicy` (relieverEnabled, weeklyFrequency, dayPattern). RHF + Zod.

---

## 7. Web — Öğretmen Görünümü

Handoff: `schedule_duty.jsx` (`TeacherDuty`) — **nöbet/yancı kısmı port edilir** (vekâlet bölümü 2b'de eklenir; itiraz `schedule_requests` dilimine ertelenir).

- Konum: öğretmen portalı (`src/portals/teacher/duties/` veya mevcut ders-programı öğretmen ekranıyla tutarlı yer).
- **Salt-okunur:** özet şeridi (bu hafta nöbet sayısı + yancı sayısı + sıradaki görev), liste + haftalık takvim alt-segment.
- Veri: `GET /duties/me?termId=` (`duties.view` self-only). Boş/yükleniyor/hata durum varyantları (skeleton).
- Yancılık kapalıysa yancı satırları/özetleri render edilmez.

---

## 8. Bildirim

- `DutyRosterPublishedEvent` (yayın/yeni sürüm yürürlüğe girince) → Notifications: etkilenen öğretmenlere "nöbet çizelgen güncellendi" (Faz 2.6 in-app + SignalR + FCM altyapısı; Outbox). Recipient resolver: yeni sürümde ataması olan öğretmenler.
- `DutyAssignmentChangedEvent` / `DutyExemptionChangedEvent` → Audit (bildirim opsiyonel; 2a'da audit yeterli).
- Tüm event'ler tenant-scoped; quiet hours/cooldown mevcut dispatch kurallarına tabi.

---

## 9. i18n

- `duties.*` namespace (tr/en): admin sekmeleri (çizelge/politika), özet/toolbar/lejant, hücre menüsü, modallar (bölge/muafiyet/yayın/öğretmen önizleme), sürüm geçmişi, öğretmen görünümü, durum varyantları, bildirim metinleri.
- Hardcoded Türkçe yok. Yancılık kapalıyken ilgili anahtarlar hiç render edilmez.

---

## 10. Test (TDD)

- **Domain:** `DutyRoster` invariant'ları (INV-D1..D5): muaf engeli, gün-tekilliği, kapasite, yancı≠nöbetçi, tek-canlı-sürüm; `Publish`/`Supersede` davranışı (EffectiveTo set, yeni Version, PreviousVersionId zinciri).
- **Persistence (Infrastructure integ):** filtreli unique index'ler — aynı öğretmen aynı hücre ikinci kez reddedilir; iki canlı roster reddedilir; tenant izolasyonu.
- **Command:** `SaveDutyRosterDraft` muaf/kapasite/gün-tekilliği reddi; `AssignReliever` yancılık kapalıyken 409; `PublishDutyRoster` supersede + event; `UpdateDutiesConfiguration`.
- **Query:** `GetAvailableRelievers` öğle penceresinde dersi olanı/muafı/o gün görevliyi dışlar (müsaitliğe **bakmaz**); `GetMyDuties` self-only; `GetDutyHubSummary` sayaçları.
- **API:** yetki (`duties.manage`/`view`), validation, 409 eşzamanlılık.
- **FE:** ızgara render + hücre menü disabled mantığı, yancılık-kapalı gizleme, yayın modal supersede önizleme, öğretmen görünümü durum varyantları (Vitest + Testing Library).

---

## 11. Süregelen / Yeni Debt

- **Otomatik adil dağıtım (NÖ-4)** → **Dilim 2c**. 2a'da "Adil Otomatik Dağıt" butonu disabled.
- **Vekâlet iş akışı (VK-*)** → **Dilim 2b**. 2a'da vekâlet sekmesi placeholder.
- **Nöbet defteri (NÖ-7)** → **Dilim 2d**. 2a'da "Nöbet Defteri" butonu disabled.
- **Dönem yük/adalet raporu (RP-1)** → **Dilim 2d** (2a'da yalnız in-grid canlı Yük & Adalet paneli var).
- **Öğretmen vekâlet itirazı** → `schedule_requests` dilimi (Faz 4 ayrı). 2a/2b'de öğretmen yalnız görüntüleme/onay.
- **Mobil nöbet ekranları** → mobil tier ayrı sırada (ders programının kendisinde de mobil yok).
- **Nöbet ücreti / ek ders** → kapsam dışı (finans/personel; OQ-duty-004).
- **`DutyWeeklyFrequency`/`DutyDayPattern`** 2a'da kaydedilir ama inert; 2c solver girdisi olunca aktifleşir (Debt-2a-1).

---

## 12. Kabul Kriterleri (2a "bitti" tanımı)

**Domain & Persistence** — `DutyLocation`/`DutyExemption`/`DutyRoster`/`DutyAssignment` + enumlar + invariant'lar; 4 tablo (`[academic]`) + filtreli unique index'ler + migration; SchoolSettings 3 alan + `UpdateDutiesConfiguration`; tenant izolasyonu.

**API** — Bölge/muafiyet CRUD + roster get/save/publish + reliever + versions + summary + available-relievers + me + duties-settings; hepsi sunucu-tarafı yetki (`duties.view`/`manage`); supersede temporal model çalışır; yancılık kapalıyken reliever uçları 409.

**Web Admin** — 3 sekme (çizelge dolu, vekâlet placeholder, politika dolu) handoff'a birebir; ızgara atama/yancı/çakışma; sürüm geçmişi + yayın (supersede önizleme); öğretmen görünümü önizleme; yancılık-kapalı her yerde gizli; durum varyantları.

**Web Öğretmen** — `GET /duties/me` ile salt-okunur nöbet/yancı (liste + takvim); self-only; durum varyantları.

**Bildirim** — `DutyRosterPublishedEvent` → etkilenen öğretmenlere yayın bildirimi.

**Test** — domain INV'leri, index backstop, command yetki/red, available-relievers (müsaitliğe bakmaz), query self-only, FE temel testleri yeşil.

**Docs** — `completion_status.md` (2a ✅, ⚠️ Spec Dışına Çıkılanlar: K-2a-2 müsaitlik-yok, K-2a-3 kapasite index'i); `business-rules.md` + `permissions.md` (`duties.*`) + `database-schema.md` + `api-contracts.md` + yeni `Duties` modül dokümanları işlenir; `permission-matrix.md`'ye `duties.*` eklenir.

---

## 13. Açık Sorular / Riskler

- **AS-2a-1:** Muafiyet ayrı aggregate; atama anında muafiyet kontrolü application katmanında (`SaveDutyRosterDraft` handler muaf set'ini okur). Muafiyet sonradan eklenince mevcut çakışan atama **uyarı** olarak yüzeye çıkar (silinmez) — ileriye dönük, K-2a / handoff `conflict` deseniyle tutarlı.
- **AS-2a-2:** Öğle penceresinin period'a çevrimi bell schedule'a bağlı; kademe bazlı farklı olabilir. `GetAvailableRelievers` öğle ile örtüşen period(lar)ı bell schedule'dan çözer; sözleşme net olmazsa basitleştirme (öğle-öncesi/sonrası period) + Debt.
- **AS-2a-3:** `DutyLocationTemplate` master seed'i (KAPI/KORIDOR/KANTIN/SPOR/BAHCE/MERDIVEN) ile handoff bölge tipleri (Floor/Canteen/Garden/Gate/Hall/Other) eşlemesi; klonlama UI'da "template'ten ekle" mi serbest mi — plan netleştirir.
- **AS-2a-4:** Supersede sırasında atamaların yeni sürüme kopyalanması (snapshot) vs. referans; DutyRoster küçük olduğundan **kopyalama** (yeni roster + yeni assignment satırları) tercih edilir — geçmiş bütünlüğü için.

---

## 14. Referanslar

- Bağlayıcı spec: `.claude/specs/ders-programi-modulu-spec.md` (§1 Faz 4, K0.6)
- Önceki dilim: `.claude/specs/ders-programi-faz4-dilim1-musaitlik-design.md`
- Kaynak analizler: `Nobet-Vekalet-Ihtiyac-Analizi.docx`, `Nobet-Vekalet-Teknik-Analiz.docx`
- Handoff: `oksis-layout/project/app/{duty_admin,duty_admin_more,schedule_duty}.{jsx,css}` + `screenshots/01-04-duty.png`
- Mevcut zemin: `Oksis.Domain/Modules/Duties/Entities/DutyLocationTemplate.cs`, `ScheduleException` (Faz 2.5), `GetAvailableTeachers` (P28), `SchoolSettings`, `TeacherAvailability` (Dilim 1)
- Modül dokümanları: `.claude/docs/modules/timetable/` (+ yeni `Duties` doküman seti)
