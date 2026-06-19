# Ders Programı — API Kontratları

> Bu modülün dışa açtığı endpoint'ler. Her endpoint için: path, method, permission, request/response şeması.

> Genel API tasarım kuralları için bkz. `backend/api-design-rules.md`.

> Base route: `/api/v1/timetable` · Tüm endpoint'ler `[Authorize]` (anonim yok).

---

## Endpoint Özeti

### ScheduleProgram (Faz 1/2 canlı kontrat) — ✅ kısmi canlı

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| P1 | GET | `/api/v1/timetable/programs?termId=&page=` | `timetable.view-all` | Hub sınıf program listesi | 200 |
| P2 | GET | `/api/v1/timetable/summary?termId=` | `timetable.view-all` | Hub özet sayaçları | 200 |
| P3 | GET | `/api/v1/timetable/programs/{id:guid}` | `timetable.manage` | Editör için program + aktif yerleşimler | 200 |
| P4 | GET | `/api/v1/timetable/programs/{id:guid}/unplaced` | `timetable.manage` | Görevlendirme eksi yerleşen saatler | 200 |
| P5 | GET | `/api/v1/timetable/programs/{id:guid}/conflicts` | `timetable.manage` | Faz 1 raporu: eksik saatler | 200 |
| P6 | POST | `/api/v1/timetable/programs/{id:guid}/precheck` | `timetable.manage` | Yazmadan slot uygunluk ön-kontrolü | 200 |
| P7 | POST | `/api/v1/timetable/programs` | `timetable.manage` | Şube+dönem için taslak program oluştur | 201 |
| P8 | POST | `/api/v1/timetable/programs/{id:guid}/draft` | `timetable.manage` | Taslak kaydet/no-op persist teyidi | 204 |
| P9 | POST | `/api/v1/timetable/programs/{id:guid}/placements` | `timetable.manage` | Yerleşim ekle | 201 |
| P10 | PUT | `/api/v1/timetable/programs/{id:guid}/placements/{pid:guid}/move` | `timetable.manage` | Yerleşimi başka slota taşı | 204 |
| P11 | PUT | `/api/v1/timetable/programs/{id:guid}/placements/{pid:guid}/teacher` | `timetable.manage` | Yerleşimin öğretmenini değiştir | 204 |
| P12 | PUT | `/api/v1/timetable/programs/{id:guid}/placements/{pid:guid}/room` | `timetable.manage` | Yerleşimin dersliğini değiştir/kaldır | 204 |
| P13 | DELETE | `/api/v1/timetable/programs/{id:guid}/placements/{pid:guid}` | `timetable.manage` | Yerleşimi pasifleştir | 204 |
| P14 | POST | `/api/v1/timetable/programs/{id:guid}/blocks` | `timetable.manage` | Ardışık yerleşimleri blok ders yap | 204 |
| P15 | GET | `/api/v1/timetable/programs/{id:guid}/publish-preview` | `timetable.publish` | Yayın çekmecesi için validasyon/etki önizlemesi | 200 |
| P16 | POST | `/api/v1/timetable/programs/{id:guid}/publish` | `timetable.publish` | Programı immutable snapshot olarak yayınla | 200 |
| P17 | GET | `/api/v1/timetable/branches/{branchId:guid}/weekly` | `timetable.view-all` | Şubenin yayınlanmış haftalık programı (admin/personel mercek) | 200/404 |
| P18 | GET | `/api/v1/timetable/teachers/me/weekly` | `[Authorize]` (PersonId scope) | Öğretmenin yayınlanmış haftalık programı (yalnız kendi yerleşimleri) | 200/404 |
| P19 | GET | `/api/v1/timetable/teachers/me/today` | `[Authorize]` (PersonId scope) | Öğretmenin bugünkü dersleri + şimdi/sıradaki (okul-yerel saat) | 200/404 |
| P20 | GET | `/api/v1/timetable/students/me/weekly` | `[Authorize]` (PersonId scope) | Öğrencinin kendi şubesinin yayınlanmış haftalık programı | 200/404 |
| P21 | GET | `/api/v1/timetable/students/me/today` | `[Authorize]` (PersonId scope) | Öğrencinin bugünkü dersleri + şimdi/sıradaki | 200/404 |
| P22 | GET | `/api/v1/timetable/parents/children/{childPersonId:guid}/weekly` | `[Authorize]` (ilişki scope) | Velinin ilişkili çocuğunun haftalık programı | 200/403/404 |
| P23 | GET | `/api/v1/timetable/parents/children/{childPersonId:guid}/today` | `[Authorize]` (ilişki scope) | Velinin ilişkili çocuğunun bugünkü dersleri | 200/403/404 |
| P24 | POST | `/api/v1/timetable/programs/{id:guid}/exceptions/preview` | `timetable.override` | Geçici değişiklik önizleme (yazmaz) | 200 |
| P25 | POST | `/api/v1/timetable/programs/{id:guid}/exceptions` | `timetable.override` | Geçici değişiklik oluştur | 200/404/409 |
| P26 | POST | `/api/v1/timetable/programs/{id:guid}/exceptions/{eid:guid}/revoke` | `timetable.override` | Geçici değişikliği geri al (soft) | 204/404/409 |
| P27 | GET | `/api/v1/timetable/programs/{id:guid}/exceptions?from&to&includeRevoked` | `timetable.override` | Program için geçici değişiklik listesi | 200 |
| P28 | GET | `/api/v1/timetable/programs/{id:guid}/available-teachers?day&period` | `timetable.manage` | O slotta müsait öğretmenler (vekil öğretmen seçimi) | 200 |
| P29 | GET | `/api/v1/timetable/programs/{id:guid}/external-occupancy` | `timetable.manage` | Bu program hariç dönemdeki diğer aktif yerleşimlerin doluluğu (editör çakışma işareti) | 200 |
| P30 | GET | `/api/v1/timetable/programs/{id:guid}/versions` | `timetable.manage` | Programın yayın sürümleri (version desc; kim/ne zaman/not/sayı) | 200 |
| P31 | GET | `/api/v1/timetable/programs/{id:guid}/versions/{version:int}/diff` | `timetable.manage` | vN ile v(N-1) arası satır-satır fark (v1 ilk-yayın) | 200 / 404 |
| P32 | POST | `/api/v1/timetable/programs/{id:guid}/versions/{version:int}/restore` | `timetable.manage` | Seçilen sürümü aktif programa Draft (Revising) olarak geri yükle | 200 / 404 / 409 |
| P33 | POST | `/api/v1/timetable/auto-generate` | `timetable.manage` | Kapsam-bazlı (tek/kademe/tümü) sıfırdan otomatik üretim job'ı kuyruğa al (üret) | 202 / 404 / 422 |
| P34 | GET | `/api/v1/timetable/auto-generate/{jobId:guid}` | `timetable.manage` | Üretim job durumu + scope + adaylar (branch-etiketli + per-class) / ipuçları (poll) | 200 / 404 |
| P35 | POST | `/api/v1/timetable/auto-generate/{jobId:guid}/apply` | `timetable.manage` | Seçilen branch'leri **yeni Taslak**'lara uygula → `[{branchId, programId}]` döner (uygula) | 200 / 404 / 409 |
| P36 | GET | `/api/v1/timetable/auto-generate/classes?termId=` | `timetable.manage` | O dönemde görevlendirmesi olan (üretime uygun) sınıflar | 200 |
| P37 | GET | `/api/v1/timetable/availability/teachers/{teacherId:guid}?termId=` | `timetable.manage` | Öğretmenin dönemdeki müsaitlik/tercih kaydı (seyrek — yalnız PrefersNot/Unavailable) | 200 |
| P38 | GET | `/api/v1/timetable/availability?termId=` | `timetable.manage` | Dönemdeki tüm öğretmenlerin müsaitlik özeti | 200 |
| P39 | PUT | `/api/v1/timetable/availability/teachers/{teacherId:guid}` | `timetable.manage` | Öğretmen müsaitliğini kaydet/güncelle (upsert; slot listesi tam set) | 204 |

**P37–P39 (Faz 4/Dilim-1 — Öğretmen Müsaitlik & Tercih) notları:**
- İzin `timetable.manage` (müsaitlik CRUD için ayrı permission slug eklenmedi; `timetable.manage` kapsam dahilinde sayıldı).
- **Seyrek model:** Yalnız `PrefersNot`/`Unavailable` slotlar saklanır; satır yokluğu `Available` anlamına gelir. `Available` slot gönderilirse yok sayılır.
- **P37 yanıt:** `TeacherAvailabilityDto { teacherId, slots: [{ day, period, status }] }` — yalnız PrefersNot/Unavailable satırlar. Kayıt yoksa `slots=[]`.
- **P38 yanıt:** `TermTeacherAvailabilityDto { teachers: TeacherAvailabilityDto[] }` — dönemdeki tüm kayıtlı öğretmenler (boş kayıtlar dahil değil).
- **P39 istek:** `SaveTeacherAvailabilityRequest { academicYearId, termId, slots: [{ day, period, status }] }`. Upsert: kayıt yoksa oluşturur, varsa `ReplaceAll` ile tam set değiştirir. Başarı sonrası `SaveTeacherAvailabilityCommand` → stats recompute tetikler (ilgili canlı programların `availability_violation_count` güncellenir).
- **`AllowUnavailable` override:** `PlaceLessonCommand`/`MoveLessonCommand`'a `allowUnavailable: bool` eklendi. `true` + `timetable.override` izni gerekir. Hata kodu `timetable.errors.teacher-unavailable` (block; override yoksa). Yayın **bloklanmaz** (ihlal sayacına yansır, yayın gate değil).

**P33–P36 (Faz 3 Otomatik Üretim — kapsam-bazlı header akışı; Dilim-1 tek sınıf + Dilim-2 çok-sınıf — REVİZE 2026-06-17, K-D2-1…6) notları:**
- **Akış (üret≠uygula, sıfırdan):** P33 ile bir `ScheduleGenerationJob` (kapsam + dönem + yıla anahtarlı,
  program'a değil) oluşturulur + Hangfire'a kuyruğa alınır → P34 ile durum poll edilir (web ~1200ms) →
  tamamlanınca P35 ile bir veya birden çok sınıf uygulanır. **Apply branch-başına YENİ bir Taslak
  `ScheduleProgram` yaratır** (mevcut programa dokunmaz); admin sonra ince-ayar yapıp ayrıca yayınlar.
- **P33 (REVİZE — kapsam):** Bir programa değil **kapsam + döneme** bağlı. Body
  `{ scope, branchId?, gradeLevel?, academicYearId, academicTermId, weights, strict }` → `{ jobId }`.
  `scope` = `Single` | `GradeLevel` | `All` (yoksa `Single` varsayılır — geriye uyum). **Doğrulama (422):**
  `Single`→`branchId` zorunlu (`timetable.autogen.branch-required`); `GradeLevel`→`gradeLevel` zorunlu
  (`timetable.autogen.grade-required`); kapsamda görevlendirmesi olan sınıf yoksa
  `timetable.autogen.no-classes`. Kapsamdaki şube kümesi `IAutoGenClassResolver` ile çözülür
  (Single=o şube; GradeLevel=`DisplayOrder == gradeLevel` görevlendirmeli şubeler; All=tümü, arşivlenmemiş).
  **Joint (ortak) solver** girdileri tüm kapsam sınıfları için tek listede toplanır (talepler görevlendirmeden;
  slotlar zil periyotlarından — okul-geneli tek grid; dış doluluk = **kapsam dışı** şubelerin rezerve eden
  [canlı] yerleşimleri — kapsam içi sınıflar joint çözümle birbirini global occupancy ile zaten dışlar).
  Retry-idempotency: yalnız `Queued` job koşar. İzin `timetable.manage` (yeni izin yok). Self/tenant-scope.
- **P34 (REVİZE):** `AutoGenStatusDto { status, scope, candidates[], hints[], failureReason? }`; durum
  `Queued|Running|Done|NoSolution|Failed`. `Done` → en iyi global aday(lar): `candidates[]` =
  `AutoGenCandidateDto { id, placements[], metrics, perClass[], isRecommended }`; placement'lar
  **`branchId` etiketli** (`AutoGenPlacementDto { branchId, day, period, subjectId, teacherId, roomId?, isBlock }`);
  `perClass[]` = `AutoGenClassMetricsDto { branchId, className, metrics }` (bulk sonuç satırlarının
  rozetleri/sınıf adı). `NoSolution` (katı mod) → `hints` (RelaxationHints); `Failed` → `failureReason`.
  Tek sınıf modunda `perClass` tek elemanlıdır (aggregate == o eleman); FE 3-aday yolu mevcut alanları okur.
- **P35 (REVİZE — seçmeli/toplu):** Body `{ branchIds: Guid[], candidateId? }` → `AppliedDraftDto[]`
  (`{ branchId, programId }`). Her `branchId` için: en iyi adayın o sınıfa ait yerleşim dilimi →
  `ScheduleProgram.Create` + `StampGeneratedFrom(jobId)` + stats recompute. **İdempotent (K-D2-4):** o job+branch
  için zaten `GeneratedFromJobId` damgalı bir Taslak varsa yeniden yaratmaz, mevcut programId'yi döner ("Aç"
  sonra "Tümünü Kaydet" çift taslak üretmez). Tüm branch'ler **tek transaction** içinde atomik
  (`TransactionBehavior`). `candidateId` yalnız Single kapsamında anlamlı (FE A/B/C seçer); bulk'ta önerilen
  aday sabit (joint çözüm sınıfları bağlar — K-D2-5) → yok sayılır. Çapraz öğretmen/derslik çakışması DB
  filtreli unique index ile → 409 (yalnız diğer canlı programlara karşı — K8). Job/aday yok → 404. Bloklar
  kapalı (`IsBlock=false`, Debt-AG-8).
- **P36:** Şube seçici kaynağı — aktif dönemde **görevlendirmesi olan tüm sınıfları** listeler (mevcut
  programı olsun ya da olmasın, K7). Yanıt `EligibleClassDto { branchId, branchName }[]`. FE kademe seçimini
  bu listenin `gradeLevel`'larından türetir (yeni sunucu işi yok).

**P30–P32 (B-1 Sürüm Geçmişi) notları:**
- **P30:** `ScheduleVersionListItemDto { version, publishedAt, publishedByName, note, placementCount }[]` (version desc). `PublishedBy` Guid → `db.Persons.Name.FullName`; çözülemezse "—".
- **P31:** `ScheduleVersionDiffDto { version, isFirstVersion, rows: ScheduleVersionDiffRow[] }`; `ScheduleVersionDiffRow { day, period, slotLabel, was, now }`. vN snapshot'ı v(N-1) ile (Day,Period) anahtarına göre kıyaslanır; `was`/`now` = "ders·öğretmen·derslik". v1 → `isFirstVersion=true`, boş satır. Sürüm yok → 404.
- **P32:** Gövdesiz. Seçilen sürümün `SnapshotJson`'ı `ScheduleProgram.RestoreFrom` ile aktif programa yazılır (mevcut aktifler pasifleştirilir, `Status=Revising`, **yeni sürüm üretilmez**). `ScheduleProgramRestoredEvent` (dağıtım Debt-BE-6). Çapraz öğretmen/derslik çakışması DB filtreli unique index ile → 409 (`timetable.errors.restore-conflict`), transaction atomik. Program/sürüm yok → 404. Occupancy senkronu yok (Debt-BE-7).

**P24–P27 (Faz 2.5A geçici değişiklik / ScheduleException) notları:**
- Tipler: `Cancellation` | `TeacherSubstitution` | `RoomChange`. Yayınlanmış snapshot **kirletilmez**; tarihe özel overlay (yalnız `*/today`).
- **Doğrulama:** hedef yerleşim en güncel published snapshot'tan; tarih `today..+30` (BR-TT-011); gün eşleşmesi; tatil değil (`IHolidayCalendarReader`, BR-TT-004); tip-özel alan (substitution→newTeacher, roomchange→newRoom); tarih-bazlı çakışma (yeni öğretmen/derslik o gün+period'da dolu mu); aynı yerleşim+gün aktif istisna tekilliği (DB filtreli unique backstop → 409).
- **P24 request:** `{ date, type, targetPlacementId, newTeacherId?, newRoomId? }` → `ScheduleExceptionPreviewDto { canApply, target{...}, issues[], affected{teachers, students, parents} }`.
- **P25 request:** P24 + `reason` (zorunlu) → `CreateScheduleExceptionResultDto { id, date, type }`. Yayın yok/yerleşim yok → 404; engelleyici sorun → 409 (`timetable.errors.exception-*`).
- **P26 request:** `{ reason }`. İstisna programa ait değilse 404; zaten geri alınmışsa 409.
- **Bildirim (BR-TT-010):** create/revoke domain event fırlatır; dağıtım Faz 2.6 (Debt-BE-3).
- **P28 (Faz 2.5B redesign):** `day` (0–6) + `period` (1–20). "Müsait" = o dönemdeki tüm programlarda o gün+period'da aktif yerleşimi olmayan, görevden ayrılmamış (`TerminatedAt == null`) + `LifecycleState == Active` öğretmenler. Yanıt `AvailableTeacherDto { id, name }[]`. Editör "Vekil Öğretmen Ata" hücre menüsü tüketir. Aynı tarihte zaten vekil atanmış öğretmen çakışması henüz hesaba katılmaz (Debt-BE-5).
- **P29 (editör çakışma işareti):** Bu programı **hariç tutarak** dönemdeki diğer programların **aktif** (`IsActive`) yerleşimlerinin doluluğu (teknik analiz §6.2 occupancy semantiği — taslak + yayın). Yanıt `ExternalOccupancyDto { teachers: OccupancySlotDto[], rooms: OccupancySlotDto[] }`, `OccupancySlotDto { id, day, period }`. Editör istemci tarafında `deriveConflicts(yerelPlacements, occ)` ile çakışan hücreleri kırmızı işaretler; kaydedilmiş veride çakışma write-time engeliyle oluşamaz, bu yüzden işaret yalnız kaydedilmemiş yerel yerleştirmeler içindir (Kaydet'te 409 olacakların ön-uyarısı).

**P17–P23 (Faz 2.3 yayınlanmış okuma modelleri) notları:**
- Yalnız `[academic].schedule_versions` snapshot'ı okunur; **taslak hiçbir uçtan dönmez** (yayın yoksa 404).
- **Scope/IDOR handler içinde:** öğretmen yalnız kendi yerleşimleri; öğrenci `StudentProfile.CurrentClassroomId`;
  veli `ParentStudentRelationship` + `CanViewInfo` (ilişkisiz çocuk **403**).
- **`*/today` okul-yerel saat:** "bugün/şu anki/sıradaki ders" `IDateTimeProvider.UtcNow` + `School.TimeZone`
  (IANA) dönüşümüyle; UTC ham saat kullanılmaz.
- **Weekly response:** `PublishedWeeklyScheduleDto { academicYearId, academicTermId, branchId, branchName, version, publishedAt, days[], periods[], lessons[] }`.
- **Today response:** `TodayScheduleDto { ...(weekly alanları), date, day, periods[], lessons[], currentLesson?, nextLesson? }`.

**P15 response özeti:** `PublishPreviewDto { programId, status, currentVersion, nextVersion, conflictCount, missingHours, canPublish, requiresAllowMissingHours, affected, issues, changes, replacedPublishedProgramId, replacedPublishedVersion }`.
- **`replacedPublishedProgramId` / `replacedPublishedVersion` (YENİ 2026-06-16, K3/K10):** Aynı (dönem, sınıf)
  için zaten **canlı** (Yayında *veya* Revize) bir kardeş program varsa onun id/sürümü; yoksa null. FE
  `PublishDrawer` bu doluyken **swap-uyarısı** gösterir ("Yayındaki X yayından kaldırılıp Taslağa alınacak").
  `nextVersion` artık programın kendi `ScheduleVersion` geçmişinden (max+1) türetilir — demote edilmiş bir
  program yeniden yayınlanırken sürüm çakışmaz.

**P1 response özeti:** `ClassProgramListItemDto { id, academicTermId, branchId, status, placementCount, conflictCount, missingHours, lastUpdatedAt, version }`.

Notlar:
- `missingHours`: şube görevlendirme haftalık saati - aktif yerleşim sayısı toplamı.
- `conflictCount`: aktif hard çakışmalar yazma anında occupancy + filtered unique index ile engellendiği için canlı kontratta `0`; stale validation/read-model gelirse genişletilecek.
- `lastUpdatedAt`: `UpdatedAt ?? CreatedAt`, default audit tarihi dışarı verilmez.

**P2 response özeti:** `HubSummaryDto { totalPrograms, draftCount, publishedCount, conflictCount, missingHours }`.

**P16 request:**

```json
{
  "allowMissingHours": true,
  "note": "İlk yayın",
  "notifyInApp": true,
  "notifyPush": false,
  "notifyEmail": false
}
```

**P16 davranış:** boş program 409 `timetable.errors.publish-empty`; eksik saatler `allowMissingHours=false`
iken 409 `timetable.errors.publish-missing-hours`; başarılı yayın `[academic].schedule_versions` içine snapshot
yazar.
- **Publish-swap (REVİZE 2026-06-16, K3/K10):** "İkinci program" artık reddedilmez. Bir Taslak yayınlanırken
  aynı (dönem, sınıf) için zaten **canlı** (Yayında *veya* Revize) bir kardeş varsa, MediatR
  `TransactionBehavior` içinde tek atomik işlemde önce o kardeş **Taslağa indirilir** (`RevertToDraft()` —
  silinmez), sonra bu program yayınlanır. Eski `already-published` reddi kalktı; sürüm, programın kendi
  `ScheduleVersion` geçmişinden (max+1) türetilir.

### Nöbet Çizelgesi (Faz 4/Dilim 2a — ✅ canlı kontrat)

Base route: `/api/v1/duties` · Controller: `DutiesController` · Tüm endpoint'ler `[Authorize]`.

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| D1 | GET | `/api/v1/duties/locations` | `duties.view` | Okula ait nöbet bölgesi listesi (aktif + pasif) | 200 |
| D2 | POST | `/api/v1/duties/locations` | `duties.manage` | Yeni nöbet bölgesi oluştur | 201 |
| D3 | PUT | `/api/v1/duties/locations/{id:guid}` | `duties.manage` | Bölge güncelle (isim/tip/ikon/kapasite/aktiflik) | 204 / 404 |
| D4 | DELETE | `/api/v1/duties/locations/{id:guid}` | `duties.manage` | Bölgeyi soft-delete | 204 / 404 |
| D5 | GET | `/api/v1/duties/exemptions` | `duties.view` | Döneme ait muafiyet listesi | 200 |
| D6 | POST | `/api/v1/duties/exemptions` | `duties.manage` | Muafiyet ekle (sürekli / geçici) | 201 / 400 |
| D7 | DELETE | `/api/v1/duties/exemptions/{id:guid}` | `duties.manage` | Muafiyeti kaldır (soft-delete) | 204 / 404 |
| D8 | GET | `/api/v1/duties/roster?termId=` | `duties.view` | Dönem çizelgesini (taslak veya canlı) döndür | 200 / 404 |
| D9 | PUT | `/api/v1/duties/roster` | `duties.manage` | Çizelge taslağını kaydet (upsert; atamalar tam set) | 200 |
| D10 | POST | `/api/v1/duties/roster/reliever` | `duties.manage` | Atamanın yancısını set et / temizle | 204 / 404 |
| D11 | POST | `/api/v1/duties/roster/publish` | `duties.manage` | Taslağı yayınla (temporal supersede; yeni sürüm) | 200 / 400 / 409 |
| D12 | GET | `/api/v1/duties/roster/versions?termId=` | `duties.view` | Dönemin çizelge sürüm geçmişi | 200 |
| D13 | GET | `/api/v1/duties/summary?termId=` | `duties.view` | Hub özet (atama sayısı, min/max/muaf/çakışma) | 200 |
| D14 | GET | `/api/v1/duties/available-relievers?termId=&day=&locationId=` | `duties.manage` | O gün+bölge için yancı adayları + yük sayısı | 200 |
| D15 | GET | `/api/v1/duties/me?termId=` | `duties.view` | Giriş yapmış öğretmenin kendi nöbet atamaları | 200 / 404 |

Ayarlar (SchoolSettings controller'ı üzerinden — ayrı endpoint):

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| DS1 | GET | `/api/v1/school-settings/duties` | `duties.view` | Nöbet politikası oku (reliever, sıklık, dağılım) | 200 |
| DS2 | PUT | `/api/v1/school-settings/duties` | `duties.manage` | Nöbet politikasını güncelle | 204 |

**DTO özetleri:**

- **D1 response:** `DutyLocationDto { id, name, type, icon, capacity, isActive }[]`.
  `type` int: 0=Floor, 1=Canteen, 2=Garden, 3=Gate, 4=Hall, 5=Other.
- **D2 request:** `CreateDutyLocationCommand { name, type, icon?, capacity, templateId? }` → `Guid` (location id).
  Doğrulama: `name` zorunlu, `capacity` 1–4 arası (domain invariant), `type` geçerli enum değeri.
- **D3 request:** `UpdateDutyLocationBody { name, type, icon?, capacity, isActive }`.
- **D5 response:** `DutyExemptionDto { id, teacherId, teacherName, type, from?, to?, reason }[]`.
  `type` int: 0=Permanent, 1=Temporary. Geçici → `from/to` zorunlu, `from > to` domain hatası.
- **D6 request:** `SetDutyExemptionCommand { teacherId, type, from?, to?, reason }`.
- **D8 response:** `DutyRosterDto { rosterId, termId, status, version, effectiveFrom?, assignments: DutyAssignmentDto[] }`.
  `status` int: 0=Draft, 1=Published, 2=Superseded. `DutyAssignmentDto { id, teacherId, teacherName, teacherBranch?, day, locationId, relieverId?, relieverName?, conflict? }`.
  `conflict` dolu ise öğretmen o dönem için muaf (`"duties.conflict.teacher-exempt"`).
- **D9 request:** `SaveDutyRosterDraftCommand { termId, academicYearId, academicTermId, assignments: DutyAssignmentInput[] }`.
  Upsert: roster yoksa oluştur, varsa atamaları (Draft) tam set ile değiştir. INV-D1/D2/D3/D4 domain seviyesinde zorlanır.
- **D10 request:** `AssignRelieverCommand { assignmentId, relieverId? }`. `relieverId=null` → yancıyı temizle. INV-D5 (yancı≠nöbetçi + aynı günde başka meşgul değil) domain içinde.
- **D11 request:** `PublishDutyRosterCommand { termId, effectiveFrom, note? }`.
  Davranış: canlı (Published) sürüm varsa `CloseAsOf(effectiveFrom)` ile Superseded edilir; bu Draft yayınlanır (yeni sürüm zinciri). Boş çizelge → 400 `duties.errors.roster-empty`. Zaten yayında → 409.
- **D12 response:** `DutyRosterVersionDto { rosterId, version, status, effectiveFrom?, effectiveTo?, createdAt, createdByName, note? }[]`.
- **D13 response:** `DutyHubSummaryDto { totalAssignments, minDuty, maxDuty, exemptCount, conflictCount }`.
- **D14 response:** `AvailableRelieverDto { id, name, branch?, currentDutyLoad }[]`.
  "Müsait yancı" = dönemde Permanent muafiyeti **olmayan** + aynı günde nöbetçi/yancı **olmayan** öğretmenler. **K-2a-2: Müsaitlik (Faz 4/Dilim 1) nöbet girdi değil** — `Unavailable` slotu olan ama o günde dersi olmayan öğretmen yancı adayı olabilir.
- **D15 response:** `MyDutiesDto { termId, version, effectiveFrom?, items: MyDutyItemDto[] }`.
  `MyDutyItemDto { day, locationId, locationName, kind }`. `kind` = "duty" (nöbetçi) | "reliever" (yancı). IDOR-safe: yalnız giriş yapan öğretmenin atamaları.
- **DS1/DS2 yanıt/istek:** `DutyPolicyDto { relieverEnabled, weeklyFrequency, dayPattern }`.
  `weeklyFrequency` int: 0=TwicePerWeek, 1=OncePerWeek, 2=OnceEveryTwoWeeks. `dayPattern` int: 0=Spread, 1=Consecutive. (**2a'da inert** — 2c solver girdisi.)

---

### Rooms (Derslik Kataloğu) — ✅ canlı (rooms-first dilimi, 2026-06-10)

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| R1 | GET | `/api/v1/rooms?sessionId=` | `class-rooms.view`* | Aktif derslik kataloğu (+ sezondaki ev-dersliği ataması) | 200 |
| R2 | POST | `/api/v1/rooms` | `class-rooms.update`* | Derslik tanımla (kod tenant'ta tekil, 409) | 201 |
| R3 | PUT | `/api/v1/rooms/{id:guid}` | `class-rooms.update`* | Derslik güncelle (kod/konum/kapasite/aktiflik) | 204 |
| R4 | PUT | `/api/v1/class-rooms/{id:guid}/room` | `class-rooms.update` | Şubeye ev dersliği ata (pasif oda 409) | 204 |
| R5 | DELETE | `/api/v1/class-rooms/{id:guid}/room` | `class-rooms.update` | Ev dersliği atamasını kaldır | 204 |

> \* Geçici izin eşlemesi — `rooms.view/manage` izinleri timetable çekirdeğiyle
> gelecek (bkz. completion_status sapma kaydı). R4/R5 ClassRoomsController'dadır;
> şube aggregate'ini mutasyona uğrattığı için classrooms tarafında yaşar.

### Schedule (eski satır-model taslak kontrat — revizyon bekliyor)

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 1 | GET | `/api/v1/timetable/schedules` | `timetable.view` | Filtrelenebilir liste | 200 |
| 2 | GET | `/api/v1/timetable/schedules/{id:guid}` | `timetable.view-detail` | Tek satır detay | 200 |
| 3 | POST | `/api/v1/timetable/schedules` | `timetable.manage` | Tek satır oluştur (Draft) | 201 |
| 4 | POST | `/api/v1/timetable/schedules/bulk` | `timetable.manage` | Toplu oluştur (transactional) | 201 |
| 5 | PUT | `/api/v1/timetable/schedules/{id:guid}` | `timetable.manage` | Güncelle (Draft → direct, Published → supersede) | 204 |
| 6 | DELETE | `/api/v1/timetable/schedules/{id:guid}` | `timetable.manage` | Sil (sadece Draft; Published → 409, `Archive` kullan) | 204 |
| 7 | POST | `/api/v1/timetable/schedules/{id:guid}/archive` | `timetable.manage` | Published satırı arşivle | 204 |
| 8 | POST | `/api/v1/timetable/schedules/validate` | `timetable.manage` | Çakışma önizleme (yazmadan) | 200 |
| 9 | POST | `/api/v1/timetable/publish` | `timetable.publish` | Tüm taslakları transactional yayınla | 204 |

### Görünüm (View) Endpoint'leri — Mobile + Web

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 10 | GET | `/api/v1/timetable/branches/{branchId:guid}/weekly` | `timetable.view` | Şube haftalık programı | 200 |
| 11 | GET | `/api/v1/timetable/teachers/{teacherId:guid}/weekly` | `timetable.view` | Öğretmen haftalık programı | 200 |
| 12 | GET | `/api/v1/timetable/rooms/{roomId:guid}/weekly` | `timetable.view` | Derslik haftalık doluluk | 200 |
| 13 | GET | `/api/v1/timetable/today` | `timetable.view` | Bugünkü program (rol-bağımlı scope) | 200 |
| 14 | GET | `/api/v1/timetable/me/weekly` | `timetable.view` | Çağıran kullanıcının haftalık programı (Teacher/Student/Parent için kendi/çocuğunun) | 200 |
| 15 | GET | `/api/v1/timetable/matrix` | `timetable.view-all` | Tüm okul matrisi (admin) | 200 |

### Rooms (Derslikler)

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 16 | GET | `/api/v1/timetable/rooms` | `timetable.view-rooms` | Derslik listesi | 200 |
| 17 | GET | `/api/v1/timetable/rooms/{id:guid}` | `timetable.view-rooms` | Detay | 200 |
| 18 | POST | `/api/v1/timetable/rooms` | `timetable.manage-rooms` | Oluştur | 201 |
| 19 | PUT | `/api/v1/timetable/rooms/{id:guid}` | `timetable.manage-rooms` | Güncelle | 204 |
| 20 | DELETE | `/api/v1/timetable/rooms/{id:guid}` | `timetable.manage-rooms` | Pasifleştir (soft) | 204 |

### Overrides (Tek Günlük İstisnalar)

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 21 | GET | `/api/v1/timetable/overrides` | `timetable.view` | Tarih aralığında override listesi | 200 |
| 22 | POST | `/api/v1/timetable/overrides` | `timetable.override` | Override oluştur | 201 |
| 23 | DELETE | `/api/v1/timetable/overrides/{id:guid}` | `timetable.override` | Override'ı geri al (Revert) | 204 |

### Import / Export

| # | Method | Path | Permission | Amaç | Success |
|---|---|---|---|---|---|
| 24 | POST | `/api/v1/timetable/import/excel` | `timetable.import-excel` | Excel ile toplu içe aktarım (multipart) | 202 (job id) |
| 25 | GET | `/api/v1/timetable/import/{jobId:guid}/status` | `timetable.import-excel` | Import job durumu | 200 |
| 26 | GET | `/api/v1/timetable/export/excel` | `timetable.view` | Excel dışa aktarım (?scope=branch\|teacher\|room&id=...) | 200 (binary) |
| 27 | GET | `/api/v1/timetable/export/pdf` | `timetable.view` | PDF (A4 yatay) | 200 (binary) |

> Endpoint sayısı: **27**. Sprint 2 minimum: #1, 2, 3, 4, 5, 8, 9, 10, 11, 13, 14, 16, 17, 18, 19, 24, 25, 26 (~18 endpoint). #21–23 Sprint 3.

---

## Detay

### 1) `GET /api/v1/timetable/schedules`

**Permission:** `timetable.view` (resource-scope role'e göre filtrelenir — bkz. `permissions.md`)

**Query params:**

| Param | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `academicTermId` | guid | Evet | Hangi dönemin programı |
| `branchId` | guid | Hayır | Şube filtresi |
| `teacherId` | guid | Hayır | Öğretmen filtresi |
| `roomId` | guid | Hayır | Derslik filtresi |
| `courseId` | guid | Hayır | Ders filtresi |
| `dayOfWeek` | int (0..6) | Hayır | Belirli gün |
| `status` | string | Hayır | `Draft`, `Published`, `Archived` (default `Published`) |
| `asOfDate` | date | Hayır | Versiyonlu sorgu — bu tarihte geçerli olan satırlar (default `today`) |
| `page` | int | Hayır | Default 1 |
| `pageSize` | int | Hayır | Default 50, max 200 |

**Response 200:**

```json
{
  "data": [
    {
      "id": "8a3f...",
      "academicYearId": "...",
      "academicTermId": "...",
      "branchId": "...",
      "branchName": "9-A",
      "courseId": "...",
      "courseName": "Matematik",
      "courseCode": "MAT-9",
      "teacherId": "...",
      "teacherName": "Ayşe Yılmaz",
      "roomId": "...",
      "roomCode": "B-12",
      "roomName": "2. Kat Sınıf",
      "dayOfWeek": 1,
      "startTime": "08:30",
      "endTime": "09:10",
      "lessonOrder": 1,
      "isBlockLesson": false,
      "status": "Published",
      "version": 1,
      "effectiveFrom": "2026-09-15",
      "effectiveTo": null
    }
  ],
  "meta": { "page": 1, "pageSize": 50, "totalItems": 0, "totalPages": 0 },
  "errors": null,
  "correlationId": "..."
}
```

---

### 3) `POST /api/v1/timetable/schedules`

**Permission:** `timetable.manage`

**Request body:**

```json
{
  "academicYearId": "...",
  "academicTermId": "...",
  "branchId": "...",
  "courseId": "...",
  "teacherId": "...",
  "roomId": "...",            // opsiyonel
  "dayOfWeek": 1,
  "startTime": "08:30",
  "endTime": "09:10",
  "lessonOrder": 1,
  "isBlockLesson": false,
  "blockGroupId": null,       // isBlockLesson=true ise zorunlu
  "effectiveFrom": "2026-09-15"
}
```

**Validation (FluentValidation):**
- Tüm zorunlu Guid'ler — non-empty
- `startTime < endTime`
- `lessonOrder >= 1`
- `dayOfWeek` 0..6
- `effectiveFrom` aktif `academicTerm.startDate..endDate` aralığında
- `isBlockLesson == true` ise `blockGroupId != null`
- `roomId` set edilmişse → room `Active` ve tenant'a ait

**Çakışma Kontrolü (handler — `IScheduleConflictChecker`):**
- BR-TT-001 öğretmen çakışması
- BR-TT-002 şube çakışması
- BR-TT-003 derslik çakışması (roomId varsa)
- BR-TT-004 tatil günü kontrolü (effectiveFrom başlangıç noktası)
- BR-TT-005 zil saati slot uyumu
- BR-TT-006 öğretmen branş uyumsuzluğu → SOFT warning (engellemez, response'a warning eklenir)
- BR-TT-012 öğretmen günlük >8 saat → SOFT warning
- BR-TT-013 şube günde >2 aynı ders → SOFT warning

**Response 201:**

```json
{
  "data": {
    "id": "8a3f...",
    "warnings": [
      { "code": "TT-SOFT-006", "message": "Öğretmen branşı bu derste tanımlı değil." }
    ]
  },
  "errors": null
}
```

**Errors:**
- 400 — validation (FluentValidation hataları)
- 403 — permission yok / scope dışı
- 404 — referans entity yok (branch/course/teacher/room)
- 409 — HARD çakışma (kod: `TT-CONFLICT-TEACHER` / `TT-CONFLICT-BRANCH` / `TT-CONFLICT-ROOM` / `TT-HOLIDAY` / `TT-BELL-SLOT`)

**Domain Event:** `ScheduleCreatedEvent` (bkz. `notifications.md` — yayın sırasında değil oluşturma sırasında bildirim gitmez)

---

### 4) `POST /api/v1/timetable/schedules/bulk`

**Permission:** `timetable.manage`

Excel import handler'ı ve UI'daki "taslağı toplu kaydet" akışı bunu kullanır. **Tamamı veya hiçbiri** (transactional).

**Request body:**

```json
{
  "academicYearId": "...",
  "academicTermId": "...",
  "effectiveFrom": "2026-09-15",
  "items": [
    { "branchId": "...", "courseId": "...", "teacherId": "...", "roomId": "...",
      "dayOfWeek": 1, "startTime": "08:30", "endTime": "09:10", "lessonOrder": 1 },
    { /* ... */ }
  ]
}
```

**Limit:** Max 2.000 satır/request (büyük import → Excel endpoint #24 üzerinden chunked).

**Response 201:**

```json
{
  "data": {
    "createdCount": 1840,
    "softWarnings": [
      { "itemIndex": 12, "code": "TT-SOFT-006", "message": "..." }
    ]
  }
}
```

**Errors:**
- 409 — herhangi bir item için HARD çakışma → **hiçbir satır oluşturulmaz**, response'da hatalı item index'leri:

```json
{
  "errors": [
    { "itemIndex": 5, "code": "TT-CONFLICT-TEACHER", "message": "Öğretmen aynı slotta zaten dolu" }
  ]
}
```

---

### 5) `PUT /api/v1/timetable/schedules/{id}`

**Permission:** `timetable.manage`

**Davranış:**
- `Status == Draft` ise: in-place update, version değişmez.
- `Status == Published` ise: **Supersede** akışı — mevcut satır `Archived` + `EffectiveTo = newEffectiveFrom - 1`, yeni satır `Version + 1` + `PreviousVersionId` ile oluşur. Response'da **yeni satırın ID'si** döner.

**Request body:**

```json
{
  "courseId": "...",
  "teacherId": "...",
  "roomId": "...",
  "dayOfWeek": 1,
  "startTime": "08:30",
  "endTime": "09:10",
  "lessonOrder": 1,
  "effectiveFrom": "2026-11-01"   // zorunlu — supersede tarihi
}
```

**Response 204** (Draft update) veya **200** (Supersede — body'de yeni `{ "newScheduleId": "..." }`).

**Concurrency:** Header `If-Match: <rowVersion>` zorunlu. Mismatch → 412 Precondition Failed.

**Domain Event:** Draft → `ScheduleCreatedEvent` zaten yayılmıştır, yeniden yayılmaz. Published → `ScheduleSupersededEvent`.

---

### 8) `POST /api/v1/timetable/schedules/validate`

**Permission:** `timetable.manage`

**Amaç:** Sürükle-bırak UI'da yazma yapmadan çakışma önizleme. **Veritabanına yazmaz**, sadece kontrolleri çalıştırır.

**Request body:** `POST /schedules` ile aynı (tek item) veya bulk için items[] array.

**Response 200:**

```json
{
  "data": {
    "isValid": false,
    "hardConflicts": [
      { "code": "TT-CONFLICT-TEACHER", "message": "Ayşe Yılmaz salı 08:30-09:10 dolu (9-B Matematik)", "conflictingScheduleId": "..." }
    ],
    "softWarnings": [
      { "code": "TT-SOFT-006", "message": "Öğretmen branşı 'Türkçe', atanan ders 'Matematik'." }
    ]
  }
}
```

---

### 9) `POST /api/v1/timetable/publish`

**Permission:** `timetable.publish` (sadece SchoolAdmin)

**Amaç:** İlgili `academicTermId` için tüm `Draft` satırları transactional olarak `Published` yapar.

**Request body:**

```json
{
  "academicTermId": "...",
  "effectiveFrom": "2026-09-15",          // hepsine uygulanır
  "publishMode": "Initial"                // "Initial" | "MidTerm"
}
```

- `Initial`: Sezon başı ilk yayın — tüm dönem boyunca tek dijest bildirim.
- `MidTerm`: Sezon ortası — sadece değişen satırlar için bildirim.

**Validation:**
- Müfredat kotası kontrolü → SOFT warning (BR-TT-007, force-publish hakkı var)
- Mevcut Published satırlar arasında çakışma → HARD (taslakta önceden kalmış olmamalı)

**Response 204** + body:

```json
{
  "data": {
    "publishedCount": 2104,
    "warnings": [
      { "code": "TT-SOFT-007", "message": "9-A şubesinde Matematik 5 saat atandı, hedef 6." }
    ]
  }
}
```

**Domain Event:** `SchedulePublishedEvent` (toplu, dijest bildirim için single trigger).

---

### 10) `GET /api/v1/timetable/branches/{branchId}/weekly`

**Permission:** `timetable.view` (Parent → çocuğunun şubesi, Student → kendi şubesi, Teacher → ders verdiği şubeler, Admin → hepsi)

**Query params:**
- `academicTermId` (zorunlu)
- `asOfDate` (default today — versiyon ve override hesaplama)
- `includeOverrides` (default true — bugünkü override'ları "applied" olarak göster)

**Response 200:** Gün × ders matrisi (zaman dilimine göre sıralı):

```json
{
  "data": {
    "branchId": "...",
    "branchName": "9-A",
    "asOfDate": "2026-11-12",
    "weekDays": [
      {
        "dayOfWeek": 1,
        "dayName": "Pazartesi",
        "slots": [
          {
            "scheduleId": "...",
            "lessonOrder": 1,
            "startTime": "08:30",
            "endTime": "09:10",
            "course": { "id": "...", "name": "Matematik", "code": "MAT-9" },
            "teacher": { "id": "...", "name": "Ayşe Yılmaz" },
            "room": { "id": "...", "code": "B-12", "name": "2. Kat Sınıf" },
            "appliedOverride": null
          },
          {
            "scheduleId": "...",
            "lessonOrder": 2,
            "startTime": "09:20",
            "endTime": "10:00",
            "course": { "id": "...", "name": "Türkçe" },
            "teacher": { "id": "...", "name": "Ali Demir" },
            "room": { "id": "...", "code": "B-12" },
            "appliedOverride": {
              "overrideId": "...",
              "type": "TeacherSubstitution",
              "newTeacher": { "id": "...", "name": "Veli Kara" },
              "reason": "Ali Hoca raporlu"
            }
          }
        ]
      }
    ]
  }
}
```

> `appliedOverride` null değilse mobile/web "değişiklik var" badge'i gösterir.

---

### 11) `GET /api/v1/timetable/teachers/{teacherId}/weekly`

Aynı şema, öğretmen perspektifinde. Boş slotlar `null` dönmez, sadece dolu olanlar listelenir; ön yüz zil saatleri ile maskeler.

---

### 13) `GET /api/v1/timetable/today`

**Permission:** `timetable.view`

**Query params:**
- `for` — opsiyonel: `me` (default — JWT'den rol-bazlı çözümleme), `branch:{branchId}`, `teacher:{teacherId}`, `student:{studentId}` (Parent için çocuk seçimi)
- `date` — opsiyonel (default `today`)

**Response 200:**

```json
{
  "data": {
    "date": "2026-11-12",
    "subjectName": "9-A",
    "subjectType": "Branch",
    "slots": [ /* 10. endpoint'in slot şeması ile aynı */ ],
    "summary": {
      "totalLessons": 7,
      "overridesCount": 1,
      "nextLesson": { "startTime": "11:10", "courseName": "Fizik" }
    }
  }
}
```

---

### 22) `POST /api/v1/timetable/overrides`

**Permission:** `timetable.override`

**Request body:**

```json
{
  "originalScheduleId": "...",
  "overrideDate": "2026-11-13",
  "overrideType": "TeacherSubstitution",     // Cancellation|TeacherSubstitution|RoomChange|TimeChange|Combined
  "newTeacherId": "...",                     // type'a göre
  "newRoomId": null,
  "newStartTime": null,
  "newEndTime": null,
  "reason": "Ali Hoca raporlu"
}
```

**Validation:**
- BR-TT-011: `overrideDate` `today..today+30` arasında
- `originalScheduleId` aktif (`Status == Published`, `effectiveFrom..effectiveTo` aralığında)
- Type-spesifik alan zorunlulukları (domain invariants)
- Yeni teacher/room çakışma kontrolü (substitution/room change için)
- Aynı `(originalScheduleId, overrideDate)` için aktif override varsa → 409 (önce geri al)

**Response 201:**

```json
{
  "data": {
    "id": "...",
    "applicableUserCount": 32           // bildirim alacak kişi sayısı (öğrenci + veli + öğretmen)
  }
}
```

**Domain Event:** `ScheduleOverrideCreatedEvent` + (substitution ise) `TeacherSubstitutionAssignedEvent`.

---

### 24) `POST /api/v1/timetable/import/excel`

**Permission:** `timetable.import-excel`

**Content-Type:** `multipart/form-data`

**Form fields:**
- `file` — .xlsx (max 5 MB)
- `academicTermId` — Guid
- `effectiveFrom` — date
- `mode` — `Replace` (mevcut Draft'ları sil + yenilerini yaz) | `Append` (mevcut Draft'a ekle)

**Response 202** (asenkron Hangfire job):

```json
{
  "data": {
    "jobId": "...",
    "estimatedSeconds": 30
  }
}
```

Excel formatı (Sheet1):

| Şube | Gün | Sıra | Başlangıç | Bitiş | Ders Kodu | Öğretmen E-posta | Derslik Kodu |
|---|---|---|---|---|---|---|---|
| 9-A | Pazartesi | 1 | 08:30 | 09:10 | MAT-9 | ayse@x.com | B-12 |

> Lookup: Şube `branches.code`, Ders `courses.code`, Öğretmen `users.email`, Derslik `rooms.code`. Resolve edilemeyen satırlar `jobStatus.errors[]` içinde döner.

---

### 25) `GET /api/v1/timetable/import/{jobId}/status`

**Permission:** `timetable.import-excel`

**Response 200:**

```json
{
  "data": {
    "jobId": "...",
    "status": "Running",                  // Pending|Running|Completed|Failed
    "progressPercent": 64,
    "totalRows": 2100,
    "processedRows": 1344,
    "createdRows": 1340,
    "errorRows": 4,
    "errors": [
      { "row": 17, "code": "LOOKUP_FAIL", "field": "TeacherEmail", "value": "yok@x.com", "message": "Öğretmen bulunamadı" }
    ]
  }
}
```

---

## Response Shape (Tüm Endpoint'ler)

Tüm endpoint'ler ortak `ApiResponse<T>` zarfı kullanır (proje genel kontratı):

```json
{
  "data": { /* veya array */ },
  "errors": [{ "code": "...", "field": "...", "message": "..." }],
  "correlationId": "uuid"
}
```

> Detay: `frontend/coding-standards.md` § 10 (axios interceptor unwrap eder).

---

## Backend Komutları / Query'leri (MediatR)

| Endpoint | Command/Query | Handler |
|---|---|---|
| #1 GET schedules | `GetSchedulesQuery` | `GetSchedulesQueryHandler` (Dapper) |
| #2 GET schedules/{id} | `GetScheduleByIdQuery` | `GetScheduleByIdQueryHandler` |
| #3 POST schedules | `CreateScheduleCommand` | `CreateScheduleCommandHandler` |
| #4 POST schedules/bulk | `BulkCreateSchedulesCommand` | `BulkCreateSchedulesCommandHandler` (transactional) |
| #5 PUT schedules/{id} | `UpdateScheduleCommand` | `UpdateScheduleCommandHandler` (Draft direct / Published supersede branch) |
| #6 DELETE schedules/{id} | `DeleteDraftScheduleCommand` | `DeleteDraftScheduleCommandHandler` |
| #7 POST archive | `ArchiveScheduleCommand` | `ArchiveScheduleCommandHandler` |
| #8 POST validate | `ValidateScheduleQuery` | `ValidateScheduleQueryHandler` (no-write) |
| #9 POST publish | `PublishScheduleDraftsCommand` | `PublishScheduleDraftsCommandHandler` |
| #10 GET branches/{id}/weekly | `GetBranchWeeklyQuery` | `GetBranchWeeklyQueryHandler` (Dapper, covering index) |
| #11 GET teachers/{id}/weekly | `GetTeacherWeeklyQuery` | `GetTeacherWeeklyQueryHandler` (Dapper) |
| #12 GET rooms/{id}/weekly | `GetRoomWeeklyQuery` | `GetRoomWeeklyQueryHandler` (Dapper) |
| #13 GET today | `GetTodayScheduleQuery` | `GetTodayScheduleQueryHandler` (rol resolver) |
| #14 GET me/weekly | `GetMyWeeklyQuery` | `GetMyWeeklyQueryHandler` |
| #15 GET matrix | `GetSchoolMatrixQuery` | `GetSchoolMatrixQueryHandler` (Dapper, large result) |
| #16–20 Rooms | `Get/Create/Update/DeleteRoomCommand/Query` | İlgili handler'lar |
| #21 GET overrides | `GetOverridesQuery` | `GetOverridesQueryHandler` |
| #22 POST overrides | `CreateScheduleOverrideCommand` | `CreateScheduleOverrideCommandHandler` |
| #23 DELETE overrides/{id} | `RevertScheduleOverrideCommand` | `RevertScheduleOverrideCommandHandler` |
| #24 POST import/excel | `ImportTimetableFromExcelCommand` | `ImportTimetableFromExcelCommandHandler` (Hangfire enqueue) |
| #25 GET import/{id}/status | `GetImportJobStatusQuery` | `GetImportJobStatusQueryHandler` |
| #26–27 Export | `Export...Query` | `Export...QueryHandler` (ClosedXML / QuestPDF) |

---

## Yetki & Scope Çözünürlüğü

`timetable.view` permission'u tüm rollerde var ama **kapsam** rol bazında ayrışır (`permissions.md` § Scope):

- **Teacher** → `schedules.teacher_id == currentUser.TeacherId` veya kendisinin ders verdiği şubelerin matrisi
- **Parent** → `currentUser.Children[].BranchId IN (schedules.branch_id)`
- **Student** → `schedules.branch_id == currentUser.BranchId`
- **SchoolAdmin / Koordinatör** → tenant içi her şey
- **Secretary** → read-only, sadece derslik doluluk sorgusu

Handler `IScheduleAccessPolicy` üzerinden çözer; query expression'a otomatik filtre eklenir.

---

## Cache Stratejisi

| Sorgu | Cache | TTL | Invalidation |
|---|---|---|---|
| `GET branches/{id}/weekly` | Redis | 5 dk | `SchedulePublishedEvent`, `ScheduleSupersededEvent`, `ScheduleOverrideCreatedEvent` (sadece etkilenen şube) |
| `GET teachers/{id}/weekly` | Redis | 5 dk | Aynı event'ler (etkilenen teacher) |
| `GET today` | Redis | 1 dk | Aynı + ek olarak günlük override'lar |
| `GET matrix` | Sadece in-memory request scope | - | - |
| `POST schedules/validate` | Hayır | - | - |

> Cache key prefix: `tt:{schoolId}:branch:{branchId}:weekly:{termId}:{asOfDate}`. Multi-tenant isolation key seviyesinde.

---

## Yasaklar

- ❌ Verb in URL (`/createSchedule`) — POST/PUT/DELETE kullan.
- ❌ Snake_case path — kebab-case zorunlu.
- ❌ Schedule fiziksel DELETE endpoint'i (#6 sadece Draft için; Published → #7 Archive).
- ❌ Inconsistent envelope.
- ❌ Çakışma kontrolünü client tarafına bırakmak — her POST/PUT handler'da `IScheduleConflictChecker` çalışmalı.
- ❌ `validate` çağrısı yapmadan bulk import tetiklemek (handler kendi içinde validate ediyor — UI önce göstermek için kullanır).

> Detay: `backend/api-design-rules.md`.
