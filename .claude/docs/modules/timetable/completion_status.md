# Ders Programı (Timetable) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓░░░░` %62   ·   Status: in-progress   ·   Güncel: 2026-06-12

> Temel: Doküman tam, `Room` dilimi var. **2026-06-12:** Modülün tamamı için
> bağlayıcı spec yazıldı (`.claude/specs/ders-programi-modulu-spec.md`) — faz
> bazlı dikey dilim, **tam teknik-analiz modeli** (ScheduleProgram aggregate +
> Period + filtreli unique index). **Faz 1A (backend çekirdek) tamamlandı**
> (PR #23, master'a merge): domain + EF persistence + filtreli unique index +
> occupancy (Redis) + editör komut/sorguları + Hub sorguları + `SchedulingController`.
> **Faz 1B-1 (Admin Hub web) tamamlandı** (branch `feature/ders-programi-faz1b-hub`):
> `ScheduleHubPage` gerçek API'ye bağlı (sınıf listesi + durum + yerleşim sayısı,
> URL search-param filtre, dört durum varyantı, Yeni Program → create → editör seam).
> Tüm testler yeşil. Kalan Faz 1: `schedule_editor.jsx` (sürükle-bırak editör, dnd-kit).

---

## ✅ Tamamlanan Yapılar

- **Doküman:** 9 dosya tamamen dolu (toplam 1 `{{TBD}}`) — domain model, versiyonlu çizelge akışı, şube×ders×öğretmen×derslik×zaman matrisi tanımlı.
- **Rooms-first dilimi (2026-06-10):** `Room` entity + `[academic].rooms` tablosu
  (migration `20260610_add_rooms_and_class_room_room_id`) + `Modules/Timetable`
  Application dilimi (ListRooms/CreateRoom/UpdateRoom) + `GET/POST/PUT /api/v1/rooms`.
  Şube ev-dersliği ataması `class_rooms.room_id` üzerinden (classrooms ekranı tüketir).
  Saatlik kullanım/çakışma kontrolü timetable çekirdeğinde kalacak.
- **Faz 1A backend çekirdeği (2026-06-12):**
  - **Domain:** `ScheduleProgram` aggregate (INV-1 sınıf tekilliği, INV-2 blok bütünlüğü) +
    `LessonPlacement` + `TimeSlot(Day,Period)` + `ConflictRules` + domain event'ler. 26+ birim test.
  - **Persistence:** `schedule_programs` + `lesson_placements` tabloları +
    3 filtreli unique index (öğretmen/derslik/sınıf çift-rezervasyonu) + check constraint.
    Migration `20260612_add_schedule_programs`. Filtreli unique index integration testi yeşil.
  - **Occupancy:** `IOccupancyIndex` Redis impl (`RedisOccupancyIndex`) + Redis yokken
    `NoopOccupancyIndex` fallback. Reserve/check/release döngüsü integration testiyle yeşil.
  - **Portlar (gerçek entegrasyon):** `BellScheduleProvider` (period grid), `TeachingAssignmentSource`
    (yerleşmemiş dersler). `StubWeeklyHourRequirementProvider` = Debt (aşağıda).
  - **Komutlar:** CreateProgram, PlaceLesson, MoveLesson, RemoveLesson, AssignTeacher,
    AssignRoom, SetBlock, SaveDraft — occupancy ön-kontrol + INV + DB unique backstop.
  - **Sorgular:** PreCheckPlacement (yazmaz), GetProgramForEdit, GetUnplacedLessons,
    ListClassPrograms, GetHubSummary.
  - **API:** `SchedulingController` → `/api/v1/timetable/*` (Hub + editör). İzin:
    `timetable.manage` / `timetable.view-all` (seed edildi — aşağıdaki sapma kaydı).
- **Faz 1B-1 Admin Hub web (2026-06-12):**
  - `src/portals/admin/timetable/` modülü (subjects/classrooms deseni): `ScheduleHubPage`
    + types/keys/api (gerçek `/api/v1/timetable`) + `useHubData`/`useProgramMutations` +
    `derive` (BranchId→sınıf join + filtre) + sunum bileşenleri + `timetable.css` (handoff port).
  - **Gerçek API entegrasyonu:** program listesi/özeti timetable'dan; sınıf adı/kademe
    classrooms `/class-rooms`'tan; aktif dönem academic-sessions `current()`'tan. Tüm
    React Query key'leri tenant-scope'lu.
  - **Hub:** sınıf merceği (durum + yerleşim sayısı), arama+kademe+durum filtreleri URL
    search-param ile, dört durum varyantı (boş/yükleniyor-skeleton/hata/dolu), Yeni Program
    modalı → CreateProgram → editör seam (`/admin/schedule/:id/edit` placeholder).
  - **i18n:** `timetable` namespace (tr/en) eklendi ve kaydedildi.
  - Faz 2/3 öğeleri (Yayınla, Otomatik Oluştur, Öğretmen/Derslik mercekleri) disabled + "Yakında".
  - 14 vitest yeşil; `npm run build` temiz. Eski `ScheduleManagement.tsx` (Figma scaffold) kaldırıldı.

## ⏳ Eksik / Bekleyen Yapılar

- **Web (Faz 1 kalan):** `schedule_editor.jsx` (sürükle-bırak editör, dnd-kit — sonraki oturum).
- `rooms.*` özel izinleri (şimdilik rooms uçları `class-rooms.view/update` ile korunuyor — aşağıdaki sapma kaydı).
- **Backend (sonraki fazlar):** Yayın/versiyon/snapshot (Faz 2), otomatik üretim (Faz 3), müsaitlik/nöbet (Faz 4).
- **Web:** Program kurma / yayınlama / görüntüleme ekranları.
- **Mobile:** Öğretmen/şube/öğrenci program görünümleri.
- Yoklama/ödev/duyuru modüllerinin bu kaynağı referans alma entegrasyonu.

## ⚠️ Spec Dışına Çıkılanlar

- 2026-06-10 · **Rooms öne çekildi:** İhtiyaç analizi (classrooms §2.2) dersliği
  "rooms — timetable kapsamı, Sprint 2" ilan ediyordu; Sınıflar & Şubeler ekranındaki
  derslik borcunu kapatmak için yalnızca katalog + ev-dersliği ataması dilimi öne
  alındı. Onay: kullanıcı (2026-06-10). Etki: timetable çekirdeği aynı tabloyu
  devralır, kırılma yok.
- 2026-06-10 · **Geçici izin eşlemesi:** rooms uçları `rooms.*` yerine
  `class-rooms.view/update` ile korunuyor (permission seed migration'ı timetable
  çekirdeğine ertelendi). Onay: kullanıcı talimatı kapsamında teknik karar.
  Etki: timetable gelince `rooms.view/manage` izinleri + seed eklenecek.
- 2026-06-12 · **Tam teknik-analiz modeli benimsendi (K0.2/K0.3):** Mevcut
  `domain-model.md`+`database-schema.md` satır-`Schedule` + `StartTime/EndTime`
  aralığı modelini tanımlıyordu. Teknik analiz dokümanına uymak için
  **`ScheduleProgram` aggregate + `LessonPlacement` + ayrık `(Day,Period)` +
  filtreli unique index** modeline geçildi; bu iki doküman revize edilecek.
  Onay: kullanıcı (2026-06-12, brainstorming). Etki: çift-rezervasyon DB-seviye
  garanti altına alınır; saat-aralığı esnekliği yerine period grid (bell schedule).
- 2026-06-12 · **Controller deseni (küçük):** Teknik analiz Minimal API diyor;
  OKSİS standardı thin controller → ISender benimsendi. Etki: yok (kontrat aynı).
- 2026-06-12 · **Müfredat-saat stub'ı (Debt):** `WeeklyHourRequirement` kaynağı
  (Subjects curriculum hours) backend'de yok → Faz 1'de port arkasında stub
  (`StubWeeklyHourRequirementProvider` boş liste döner). Haftalık-saat doğrulaması
  (INV-3) gerçek veri gelince sıkışacak. Onay: kullanıcı (2026-06-12, K0.5).
- 2026-06-12 · **İzin seed düzeltmesi (spec §8 ↔ gerçeklik):** Spec §8 `timetable.manage`,
  `timetable.view-all` vb. izinleri *"zaten tanımlı ve seed'li"* sayıyordu; gerçekte kodda
  yoktu (yalnız `schedule.read`/`schedule.manage` vardı). Kullanıcı kararı (2026-06-12):
  **"Spec §8'e uy + seed et"**. `timetable.manage` + `timetable.view-all` kanonik seed'e
  (`PermissionSeedData` + `RolePermissionSeedData` → admin rolleri) eklendi, migration
  `20260612_add_timetable_permissions`. Faz 1 yalnız bu ikisini kullanır; §8'deki diğer
  izinler (publish/override/manage-rooms/import-excel) ilgili fazlarda seed edilecek.
- 2026-06-12 · **Hub sorgularında EF projection (spec §5 Dapper ertelendi):** Spec §5 Hub
  okumalarını Dapper ile öngörüyordu; Dapper projede kurulu değil (yeni kütüphane = ayrı
  onay). Faz 1A'da `ListClassPrograms`/`GetHubSummary` EF projection ile yazıldı. Etki: yok
  (kontrat aynı); hacim büyürse Dapper'a geçiş sonraki fazda değerlendirilecek.
- 2026-06-12 · **Controller mutasyon alt-rotaları (spec §6 latitude):** Spec §6 tablosu
  düzenlemeleri tek `PUT .../placements/{pid}` altında (body ile ayrım) öngörüyordu; SetBlock
  çok-placement olduğu için tek-pid PUT'a sığmaz. Temiz alt-rotalar kullanıldı
  (`/move`, `/teacher`, `/room`, `/blocks`). §6 zaten "controller deseni — küçük sapma" latitude'ü tanıyor.
- 2026-06-12 · **AssignRoom occupancy "önce release" deseni:** Commit'lenen `IOccupancyIndex.CheckAsync`
  `ignoreProgramId` taşımıyor; aynı slot+öğretmen sabit kalıp yalnız derslik değişen AssignRoom'da
  öğretmen kendi rezervasyonunu görüp yanlış-pozitif verirdi. Handler önce mevcut rezervasyonu
  bırakıp kontrol eder, engelde geri koyar. Etki: doğruluk korunur; kaynak doğruluk yine DB.
- 2026-06-12 · **Debt-FE-1 — Hub çakışma/eksik-saat rozetleri ertelendi:** Tasarım/spec §9.1
  Hub'da çakışma + eksik-saat rozeti betimliyor; Faz 1A Hub DTO'ları (`ClassProgramListItemDto`,
  `HubSummaryDto`) bunları sağlamıyor ("sonraki fazda zenginleştirilir"). Bağlayıcı kabul kriteri
  §11 Hub için yalnız durum varyantı + URL filtre istiyor (rozetleri şart koşmuyor) → spec ihlali
  yok. Faz 1B-1'de bu rozetler render edilmedi. Onay: kullanıcı (2026-06-12, "omit + Debt").
  Kapanış: backend list-DTO zenginleştirme (Faz 2).
- 2026-06-12 · **Debt-FE-2 — Hub sürüm/son-güncelleme/"kim" kolonları yok:** Tasarım bu kolonları
  gösteriyor; DTO'da alan yok → omit. Onay: kullanıcı (2026-06-12). Kapanış: DTO + projection
  zenginleştirme (Faz 2).
