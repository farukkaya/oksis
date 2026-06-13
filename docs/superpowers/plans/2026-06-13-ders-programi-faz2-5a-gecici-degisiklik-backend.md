# Ders Programı Faz 2.5A — Geçici Değişiklik (ScheduleException) Backend — Plan

> Dilim: Faz 2 / 2.5A (backend-first). UI (publish drawer "Geçici değişiklik" yolu + yönetim) = 2.5B ayrı dilim.
> Döngü: TDD → implementasyon → review → test/build → doküman.

**Karar (kullanıcı onaylı, 2026-06-13):** 2.5A backend önce · tipler **Cancellation / TeacherSubstitution / RoomChange** · overlay **yalnız tarihli/bugün görünümleri** (haftalık yapısal kalır).

**Kaynaklar:** `.claude/specs/ders-programi-modulu-spec.md` (Faz 2 yol haritası, dilim 2.5) · `business-rules.md` (BR-TT-001/004/010/011) · `api-contracts.md` (eski Overrides taslağı) · `IHolidayCalendarReader`.

---

## Tasarım özeti

### Domain — `ScheduleException` (bağımsız aggregate)
`Oksis.Domain/Modules/Timetable/Entities/ScheduleException.cs` — yayınlanmış programı kirletmez; tarihe özel overlay.

Alanlar: `Id (ScheduleExceptionId)`, `SchoolId`, `ProgramId`, `BranchId`, `AcademicTermId`, `Date (DateOnly)`,
`Type (ScheduleExceptionType: Cancellation|TeacherSubstitution|RoomChange)`, `TargetPlacementId`, `Day (DayOfWeek)`,
`Period (int)`, `OriginalTeacherId`, `OriginalRoomId?`, `NewTeacherId?`, `NewRoomId?`, `Reason`,
`RevokedAt?`, `RevokedReason?` + audit (TenantEntity).

Invariant'lar:
- **INV-E1:** Substitution → `NewTeacherId` zorunlu & ≠ `OriginalTeacherId`; RoomChange → `NewRoomId` zorunlu & ≠ `OriginalRoomId`; Cancellation → yeni alan yok.
- **INV-E2:** `Date`'in haftanın günü == `Day`.
- **INV-E3:** `Reason` boş olamaz.
- Aktif = `RevokedAt is null`.

Davranış: `Create(...)` (tip-bazlı doğrulama), `Revoke(reason)`. Event: `ScheduleExceptionCreatedEvent`, `ScheduleExceptionRevokedEvent`.

### Persistence
`[academic].schedule_exceptions` + index `(school_id, program_id, date)`, `(school_id, branch_id, date)` +
**filtreli unique** `UX_Exception_Placement_Date (school_id, target_placement_id, date) WHERE revoked_at IS NULL`.
Migration `20260613_add_schedule_exceptions`.

### Application
- `CreateScheduleExceptionCommand` — published snapshot'tan hedef yerleşim çözülür (Day/Period/OriginalTeacher/OriginalRoom); doğrular:
  tarih `today..+30` (BR-TT-011), gün eşleşmesi (INV-E2), **tatil değil** (`IHolidayCalendarReader`, HARD), tip-özel alan (INV-E1),
  **tarih-bazlı çakışma** (yeni öğretmen/derslik o gün+period'da başka programın published snapshot'ında dolu mu + aynı tarihteki diğer aktif istisnalar),
  aktif tekillik (DB filtreli unique backstop). Entity + event.
- `RevokeScheduleExceptionCommand` — soft revert + event.
- `PreviewScheduleExceptionQuery` — yazmaz; aynı doğrulama + çakışma sebepleri + etkilenen özet (öğretmenler original+new; şube öğrenci sayısı; tam veli sayısı Debt-BE-2).
- `ListScheduleExceptionsQuery` — program + tarih aralığı.

### API (izin `timetable.override`)
- `POST /api/v1/timetable/programs/{id}/exceptions/preview`
- `POST /api/v1/timetable/programs/{id}/exceptions`
- `POST /api/v1/timetable/programs/{id}/exceptions/{eid}/revoke`
- `GET  /api/v1/timetable/programs/{id}/exceptions?from&to`

### Read overlay (yalnız `*/today`)
`PublishedScheduleQueryHandler.BuildTodayAsync`: bugünün dersleri kurulduktan sonra, o tarih için aktif istisnalar
`TargetPlacementId` ile eşlenip uygulanır. `PublishedLessonDto`'ya `exceptionType?`, `isCancelled` alanları eklenir.
Branch/student/parent today tam overlay; teacher today: vekalet edilen ders (NewTeacher==ben) eklenir, devredilen kendi dersi işaretlenir.
Haftalık ızgara dokunulmaz.

### Spec sapmaları (completion_status'a)
1. `timetable.override` kanonik seed + migration (spec §8 "zaten seed'li" ≠ gerçek).
2. Entity adı `ScheduleException` (plan-bağlayıcı); business-rules eski `ScheduleOverride` adı → rename notu.
3. `TimeChange` tipi kapsam dışı (period modeli).
4. Bildirim dağıtımı (BR-TT-010) 2.6'ya ertelendi; 2.5A event fırlatır (Debt).

---

## TDD Görev Sırası

1. [x] **Domain:** `ScheduleExceptionType`, `ScheduleException` aggregate + INV-E1/E2/E3 + `Revoke`. 12 birim test. (Strongly-typed id yerine `Guid Id` — ScheduleVersion kardeşiyle hizalı.)
2. [x] **Domain event:** `ScheduleExceptionCreatedEvent` + `ScheduleExceptionRevokedEvent`; `Create`/`Revoke` raise eder.
3. [x] **Persistence:** EF config + `IApplicationDbContext.ScheduleExceptions` + migration `20260613_add_schedule_exceptions` (tablo + 2 index + filtreli unique). 2 integration test (ikinci aktif reddedilir; revoked engellemez).
4. [x] **Permission seed:** `timetable.override` → kanonik seed + migration `20260613_add_timetable_override_permission`. Seed coverage yeşil.
5. [x] **PreviewScheduleExceptionQuery** + handler (yazmaz): doğrulama + çakışma + etkilenen özet.
6. [x] **CreateScheduleExceptionCommand** + handler + validator: planner doğrulamaları + persist + event + DB unique backstop.
7. [x] **RevokeScheduleExceptionCommand** + handler: program sahiplik + soft revert + event.
8. [x] **ListScheduleExceptionsQuery** + handler: program + tarih aralığı, aktif/all + isim çözümleme.
9. [x] **Read overlay:** `PublishedLessonDto` + `IsCancelled`/`ExceptionType`; `BuildTodayAsync` overlay (cancel/substitution/roomchange + teacher substitution-in). 3 overlay test.
10. [x] **API:** `SchedulingController` 4 uç (`timetable.override`).
11. [x] **Docs:** completion_status + api-contracts + plan.
12. [x] format/build/test; commit.

> 5-8 ortak motor `ScheduleExceptionPlanner` (DI scoped) — Preview ve Create aynı kuralları paylaşır. Handler testleri: 11 (Create 6 + Revoke 3 + List 1 + Preview 1).

## Her Dilim Sonu
- [x] `dotnet test` timetable subset: Domain 42, Application 51, Integration 2, seed coverage yeşil.
- [x] `dotnet build` temiz; whitespace format uygulandı.
- [x] completion_status + api-contracts güncel.

## Bilinen sınır (Debt-BE-4)
Yalnız vekalet ettiği ders olan (kendi yapısal dersi olmayan) öğretmenin haftalık sorgusu boş
→ NotFound; bu yüzden bugün overlay'i substitution-in dersini gösteremez. Kendi dersi olan öğretmende
çalışır. Tüketici today sorgusunu yapısal-yokken-de-çalışır hale getirmek sonraki iş.
