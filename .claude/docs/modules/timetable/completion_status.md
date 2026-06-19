# Ders Programı (Timetable) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓▓▓▓▓` %100 (Faz 2 tamam · Faz 3 Dilim-1 + Dilim-2 çok-sınıf tamam · Faz 4/Dilim-1 Müsaitlik & Tercih backend + FE handoff stillemesi tamam · **Faz 4/Dilim-2a Nöbet Çizelgesi BE + FE tamam** · **Faz 4/Dilim-2b Vekâlet BE tamam** · **Faz 4/Dilim-2b Vekâlet FE tamam** · **Debt-AG-1 KAPANDI**)   ·   Status: in-progress   ·   Güncel: 2026-06-19

> Temel: Doküman tam, `Room` dilimi var. **2026-06-12:** Modülün tamamı için
> bağlayıcı spec yazıldı (`.claude/specs/ders-programi-modulu-spec.md`) — faz
> bazlı dikey dilim, **tam teknik-analiz modeli** (ScheduleProgram aggregate +
> Period + filtreli unique index). **Faz 1A (backend çekirdek) tamamlandı**
> (PR #23, master'a merge): domain + EF persistence + filtreli unique index +
> occupancy (Redis) + editör komut/sorguları + Hub sorguları + `SchedulingController`.
> **Faz 1B-1 (Admin Hub web) tamamlandı** (branch `feature/ders-programi-faz1b-hub`):
> `ScheduleHubPage` gerçek API'ye bağlı. **Faz 1B-2a (editör çekirdeği)** ve
> **Faz 1B-2b (editör zenginleştirme)** tamamlandı (branch
> `feature/ders-programi-faz1b2b-editor`): hücre menüsü (öğretmen/derslik yeniden ata +
> kaldır), blok ders (çoklu seçim + toolbar), canlı ön-kontrol (§6 sürüklerken
> yeşil/kırmızı + sebep), Doğrula çubuğu + eksik-saat paneli ("Hücreye git" flash).
> 679 vitest yeşil; `npm run build` temiz. **Faz 1 (Çekirdek + Hub + Editör) FE+BE tamam.**
> **Faz 2.1 backend yayın/snapshot dilimi tamamlandı:** `ScheduleVersion`
> immutable snapshot modeli + `timetable.publish` seed'i + `publish-preview`/`publish`
> endpoint'leri eklendi. Eksik saatler `allowMissingHours` ile soft uyarı; boş/tekrar yayın
> hard 409. Domain/Application timetable testleri ve backend build yeşil.
> **Faz 2.2 Admin Yayınla UI tamamlandı:** Hub ve Editör aynı `PublishDrawer`
> komponentini açar; preview gate + confirm + publish mutation + success state bağlı.
> 44 timetable Vitest yeşil; `npm run build` temiz. **2026-06-13 Hub liste kolon
> zenginleştirme:** tasarımdaki çakışma, eksik saat, son güncelleme ve sürüm kolonları
> gerçek backend DTO alanlarıyla eklendi; mock/olmayan aksiyonlar hâlâ render edilmez.
> **Faz 2.3 yayınlanmış okuma modelleri (BE) tamamlandı:** 7 endpoint
> (branch/teacher/student/parent · weekly+today) `ScheduleVersion` snapshot'ından okur,
> taslak sızdırmaz. Scope/IDOR handler içinde: öğretmen kendi yerleşimleri, öğrenci
> kendi şubesi (`StudentProfile.CurrentClassroomId`), veli `ParentStudentRelationship` +
> `CanViewInfo`. **"Bugün/şu anki/sıradaki ders" okul-yerel saat dilimine göre**
> (`IDateTimeProvider` + `School.TimeZone`) — UTC değil; test edilebilir. 8 birim test.
> **Faz 2.4 web tüketici ekranları tamamlandı:** teacher/student/parent `Programım`
> + paylaşılan `PublishedScheduleView` (bugün paneli + haftalık ızgara + tüm durum
> varyantları + 403/404). Tüm string'ler `timetable.consumer.*` i18n (tr/en) — hardcoded
> Türkçe yok. 14 yeni vitest; tam web paketi 695 yeşil; `npm run build` temiz.
> **Faz 2.5B-1 Editör tamponlu kaydetme tamamlandı (FE):** editör artık her aksiyonu
> anında sunucuya yazmıyor; yerel op-log (`editorDraft` saf modül + `foldOps`) tutar,
> **Kaydet** disabled/dirty-turuncu-nokta/saving/saved durumlarıyla op'ları sıralı replay
> eder (`executeFlush`, temp→gerçek id eşlemesi), başarıda refetch ile baseline senkronlanır.
> `useBlocker` + `beforeunload` kaydedilmemiş değişiklikte çıkış uyarısı (Kaydet ve Çık /
> Kaydetmeden Çık / Vazgeç). Tüketiciye yansıma zaten yalnız yayınlanmış snapshot'tan olduğu
> için kullanıcı görünümü etkilenmez. Tam web test paketi 711 vitest yeşil; `npm run build` temiz.
> **Faz 2.5B-2 Geçici değişiklik web — oluşturma akışı tamamlandı (FE):** Yayınla drawer'ında 'Geçici değişiklik' yolu, backend P24/P25 ile birebir kompoze form olarak bağlandı — yayınlanmış snapshot'tan (P17 `branches/{id}/weekly`) mini ızgara → hedef ders → tip (iptal/öğretmen vekaleti/derslik) → tarih → sebep → Önizle/Uygula. Toggle yalnız Published programda aktif; editör op-log'undan bağımsız; tek istisna/gönderim; doğrulama tamamen backend'de (preview issue listesi). 724 vitest yeşil; `npm run build` temiz.
> **Faz 2.5B REDESIGN — Geçici değişiklik editör-merkezli (FE+BE):** 2.5B-2'nin "drawer içi
> mini-ızgara + tip-seç composite form"u, tasarım handoff'undan (§171: Yayın türü = Kalıcı / Geçici
> değişiklik) saptığı için **kaldırıldı ve geri çevrildi**. Yeni akış: editör hücre menüsünde
> **Vekil Öğretmen Ata** (→ `TeacherSubstitution`) + **Ders İptal** (→ `Cancellation`) geçici-only
> aksiyonları; **Öğretmen/Derslik Değiştir** kalıcı (Öğretmen Değiştir artık yalnız o dersin branş
> öğretmenleri). İki dünya **ayrı tutulur** (her oturum tek tür; `tempLocked`/`permLocked`). Yayınla
> drawer'ı: geçici aksiyon varsa **Kalıcı yayın kilitli** + uyarı çubuğu + tıklama bildirimi; **Tarih**
> seçilip her aksiyon P25 (`createException`) ile yalnız o tarih için yayınlanır. Backend: tek yeni uç
> **P28 `available-teachers`** (müsait öğretmen, pasif/ayrılmış elenir) + validator; geçici istisna
> oluşturma 2.5A P25 ile (yeni istisna tipi yok). Branş filtresi backend'siz (görevlendirme verisinden).
> Backend: GetAvailableTeachers 3 birim test yeşil. Web: tam paket **730 vitest** yeşil; `npm run build`
> temiz. İkame Ders (ders ikamesi) kullanıcı kararıyla kapsam dışı.
> **Faz 2.5C Geçici değişiklikler tepsisi + 3 katmanlı geri-al tamamlandı (FE):** Yeni tasarım
> handoff'una (2026-06-14 `Oksis Layout-handoff (1).zip` → `schedule_temp_changes.jsx`) göre geçici
> değişiklik UX'i **tepsi-merkezli** modele taşındı. Editör hücre menüsündeki Vekil/İptal artık zengin
> modallar açıyor (`SubstituteModal`/`CancelLessonModal`: bu/gelecek hafta · sebep çipleri · P28 müsait
> öğretmen · iptal'de telafi toggle · bildirim toggle'ları) → grid üstünde **`TempChangesPanel` tepsisi**
> (taslak/yayında satırları + satır geri-al) → **`TempPublishModal`** (onay → yayınlanıyor → başarı +
> 8 sn halka-sayaçlı geri-al penceresi). **Üç katmanlı geri-al:** (a) taslak tek (yerel sil), (b) yayın-
> sonrası pencere (tümünü P27 revoke), (c) yayınlanmış tek (P27 revoke). Backend = Faz 2.5A uçları
> **birebir yeniden kullanıldı** (P25 toplu oluştur, P26 hafta istisnalarını yükle, P27 revoke, P28
> müsait öğretmen) — **yeni BE yok**. Taslaklar yalnız FE state (editör tamponuyla aynı felsefe);
> yayınlanmışlar P26'dan yüklendiği için yenilemeye dayanıklı. **PublishDrawer + `useTempActions`
> dokunulmadan korundu** (bağımsız coexistence; drawer'ın geçici yolu duruyor, aktif yazma tepside).
> Saf store `tempChanges.ts` (reducer'lar + `resolveDate`/`toExceptionBody`) + `useTempChanges` hook +
> 6 yeni bileşen/CSS. Tam web paketi **765 vitest yeşil** (+1 skip); `npm run build` temiz.
> **Faz 2.6 Bildirim & SignalR fan-out (BE+FE) tamamlandı (2026-06-15):** Genel ama minimal in-app
> bildirim altyapısı kuruldu ve 5 timetable event'i bağlandı. Pipeline: domain event → MediatR
> `INotificationHandler` (commit-after) → `INotificationEnqueuer` (Hangfire) → `DispatchNotificationJob`
> (tenant `SetForLoginFlow`) → `NotificationDispatcher` (per-recipient idempotency, delivery-log) →
> `InAppNotificationChannel` (`Notification` satırı + `NotificationHub` /hubs/notifications canlı push).
> Alıcı çözümü `NotificationRecipientResolver` (şube → öğrenci/veli login Account.Id'leri
> `Person.LinkedAccountId` üzerinden; öğretmen Person→Account; açık `SchoolId` filtresi). 4 event bildirim
> üretir (Published v1/vN · ExceptionCreated→Cancelled/Exception · ExceptionRevoked · ProgramDeleted),
> **Restored tasarımla sessiz**. Self-scope API (IDOR-safe, yeni izin yok): `GET /notifications` (paged),
> `/unread-count`, `POST /{id}/read`, `/read-all`. Web: `src/modules/notifications/` + `@microsoft/signalr`
> v10 client + header zili (`NotificationMenu.tsx`) gerçek API'ye + canlı güncellemeye bağlı + `notifications`
> i18n (tr/en). Tam web paketi **860 vitest yeşil**. Bu fazda Outbox yok (Debt-N1), yalnız in-app+SignalR
> kanalı (Debt-N2), sessiz saat/cooldown yok (Debt-N3) — aşağıda sapma kayıtları. **Faz 2 (Çekirdek + Hub +
> Editör + Yayın + Tüketici + Geçici değişiklik + Sürüm/Sil + Bildirim) FE+BE tamam.**
> **Faz 3 Dilim-1 Otomatik Program Üretimi (tek-sınıf) FE+BE tamamlandı (2026-06-15):** Tasarım handoff'una
> (`schedule_autogen.jsx`) sadık zengin sihirbaz (ağırlıklar + katı mod + 3 aday). İki-dilim planı: **Dilim-1
> = tek sınıf (TAMAM)**, Dilim-2 = kademe/tümü çok-sınıf (ertelendi, UI'da disabled). **Solver çekirdeği**
> (saf, Application `Modules/Timetable/AutoGenerate/Solver/`): `IScheduleSolver` + `ScheduleSolver` 3 farklı
> stratejiyi (`CandidateStrategies` MorningFirst/GapMinimizing/BalanceFirst) deterministik açgözlü yerleştiriciden
> (`GreedySolver`: MRV sıralama + talep-başına uygun-slot araması + adım bütçesi → asla takılmaz) geçirir,
> `CandidateScorer` ile puanlar (ağırlıklı sabah/boşluk/denge metrikleri: çakışma/eksik-saat/ort-boş-saat/
> tercih-uyumu%/günlük-denge), (MissingHours artan, Score azalan) ile sıralar, en iyiyi önerilen işaretler;
> katı modda en iyi hâlâ eksikse → NoSolution + RelaxationHints. `SlotFeasibility` katı kısıtları uygular
> (sınıf/öğretmen/derslik tekilliği; öğretmen müsaitliği no-op). `LessonDemandBuilder` görevlendirmeleri →
> taleplere açar. **Girdiler:** ders talepleri **görevlendirmeden** (`ITeachingAssignmentSource`, müfredat
> toplamından değil); slotlar zil periyot sayısından (Pzt-Cum × periyot); dış doluluk (çapraz-program direkt
> sorgu); ev-dersliği (`ClassRoom.RoomId`); müsaitlik `IAvailabilityProvider` ile (no-op). **Kalıcılık:**
> `ScheduleGenerationJob` entity (durum Queued/Running/Done/NoSolution/Failed + CandidatesJson/HintsJson)
> `[academic]` şemasında, migration `20260615_add_schedule_generation_jobs`. **Akış (üret≠uygula):**
> `EnqueueAutoGenerateCommand` (program Draft/Revising doğrular — Published reddedilir; job oluşturur; kuyruğa
> alır) → `AutoGenerateScheduleJob` (Hangfire: tenant set → girdileri topla → çöz → aday/ipucu sakla) →
> `GetAutoGenerateStatusQuery` (poll) → `ApplyAutoGenerateDraftCommand` (seçilen aday → `ScheduleProgram.RestoreFrom`
> → Draft/Revising; admin sonra ince-ayar + yayın). Retry-idempotency guard (yalnız Queued koşar). İzin
> `timetable.manage` (yeni izin yok). **3 endpoint** SchedulingController'da: `POST .../auto-generate` (→jobId),
> `GET .../auto-generate/{jobId}` (durum), `POST .../auto-generate/{jobId}/apply`. Self/tenant-scope (IDOR EF
> global filtre ile). **Web:** `AutoGenDrawer` sihirbazı (ayarlar: kapsam [Tek sınıf aktif; Kademe/Tümü
> disabled=Dilim-2] + ağırlıklar + katı mod; üretiliyor; sonuçlar: 3 aday kartı + metrikler + mini-hafta +
> büyük önizleme + "Editörde Aç"; çözüm-yok: ipuçları; hata) `useAutoGenerate`'e bağlı (enqueue → poll ~1200ms
> → apply → editöre yönlendir). Tetikleyiciler Hub satır menüsü + editör ⋯ (yalnız Draft/Revising). i18n
> `timetable.autogen.*` (tr/en). Tam web paketi yeşil.

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
  - Hub liste yüzeyi gerçek DTO'ya indirgenmiştir: sınıf, kademe, durum, yerleşim ve gerçek aksiyonlar.
    Öğretmen/derslik mercekleri, otomatik oluştur ve mock menü aksiyonları render edilmez.
  - 14 vitest yeşil; `npm run build` temiz. Eski `ScheduleManagement.tsx` (Figma scaffold) kaldırıldı.
- **Faz 1B-2a Admin Editör çekirdeği web (2026-06-12):**
  - `src/portals/admin/timetable/editor/` — `ScheduleEditorPage` (`/admin/schedule/:id/edit`,
    placeholder yerine). `@dnd-kit/core` (kullanıcı onaylı) sürükle-bırak; DragOverlay deseni
    (inline transform stili yok).
  - **Veri (gerçek API):** `GET /programs/:id` (ProgramForEdit) + `/unplaced` (gerçek, görevlendirmeden)
    + bell schedule (settings `useBellSchedules`, Lesson slot'ları = period grid) + isim lookup'ları
    (subjects/teachers/rooms). Tenant-scope'lu key'ler.
  - **Etkileşim:** yan panelden çip sürükle → boş hücreye **place** (POST); hücre→hücre **move** (PUT);
    **remove** (DELETE); **Taslak Kaydet** (POST /draft). `editorDerive` saf fonksiyonları
    (cellMap/resolveDrop/interpretConflict) TDD ile.
  - **Çakışma = bırakınca doğrula:** drop → komut; 409 + i18n kod → hedef hücre kırmızı flaş + sebep;
    eşzamanlılık kodu → "yeniden yükle" bandı. (Kullanıcı kararı: hover anı canlı precheck YOK.)
  - i18n `editor.*` + `errors.*` (tr/en). Durum varyantları: yükleniyor (iskelet grid) / hata / boş / kaydediliyor / kaydedildi / çakışma / eşzamanlılık.
  - 14 yeni vitest (editorDerive 9 + sayfa 5); tam paket 665 test yeşil; `npm run build` temiz.
- **Faz 1B-2b Admin Editör zenginleştirme web (2026-06-12):**
  - **Hücre bağlam menüsü** (`CellMenu`, Radix Popover + portal): Öğretmen değiştir › / Derslik değiştir › /
    Kaldır. `PUT .../placements/{pid}/teacher` + `.../room` (null = "Derslik yok"). 409 → hücre kırmızı flaş + sebep.
  - **Blok ders** (çoklu seçim + toolbar "Blok modu" → hücre seç → "Blok oluştur"): `POST .../blocks`.
    Blok render `deriveBlocks` (start/cont + "BLOK" etiketi). Ardışıklık/aynı-gün backend doğrular.
  - **Canlı ön-kontrol** (§6 etkileşimli kademe): dnd-kit `onDragOver` → boş hücrede `POST .../precheck`
    (`usePrecheck` + (slot,teacher,room) cache) → `drop-ok` yeşil / `drop-bad` kırmızı + sebep tooltip.
  - **Doğrula çubuğu** (`ValidationBar` = `.sed-valbar`): durum pill'leri + legend + Doğrula toggle →
    `.sed-issues` paneli (eksik-saat satırları + **"Hücreye git"** → hücreye scroll + accent flaş `flashTo`).
  - Saf fonksiyonlar TDD: `deriveBlocks` / `deriveMissingCells` / `precheckKey`. i18n `editor.cellMenu/blockMode/validatePanel.*`
    + gerçek backend hata kodları (`*-slot-occupied`, `block-*`, vb.). EditorFooter → ValidationBar.
  - 5 yeni vitest (editorDerive 3 + sayfa 2); tam paket 679 test yeşil; `npm run build` temiz.
- **Faz 2.1 Backend yayın/snapshot (2026-06-12):**
  - **Domain:** `ScheduleVersion` entity + `ScheduleProgram.Publish(...)` + `ScheduleProgramPublishedEvent`.
    Boş program ve boş snapshot domain seviyesinde engellenir.
  - **Persistence:** `[academic].schedule_versions` tablosu + `(school_id, program_id, version)`
    filtered unique index + class/term/version lookup index. Migration:
    `20260612_add_schedule_versions_publish`.
  - **Permission:** `timetable.publish` kanonik seed'e eklendi; SuperAdmin/SchoolAdmin
    admin rolleri alır.
  - **API/CQRS:** `GET /api/v1/timetable/programs/{id}/publish-preview` ve
    `POST /api/v1/timetable/programs/{id}/publish`. Eksik saatler soft uyarı
    (`allowMissingHours` verilirse yayınlanır); boş program, hard conflict ve tekrar yayın
    409 döner.
  - **Test/Build:** Domain timetable: 30 test yeşil. Application timetable: 28 test yeşil.
    `dotnet build Oksis.slnx --no-restore` temiz.
- **Faz 2.2 Admin Yayınla UI (2026-06-12):**
  - **API binding:** `timetableApi.getPublishPreview` + `publishProgram`, tenant-scope
    `publishPreview` React Query key'i, publish sonrası Hub/program/preview invalidate.
  - **UI:** `PublishDrawer` Hub satır aksiyonundan ve Editör üst şeridinden açılır.
    Validasyon kapısı, etkilenen kişi özeti, diff boş durumu, kalıcı yayın, sürüm notu,
    bildirim kanalları, confirm, publishing ve success durumları port edildi.
  - **Kural:** çakışma/blocker varsa yayın butonu pasif; yalnız eksik saat varsa
    "Yine de Yayınla" `allowMissingHours=true` ile gönderir. Yayındaki satırlarda publish
    aksiyonu pasiftir.
  - **Sınırlama:** "Geçici değişiklik" seçeneği görünür ama disabled; backend/domain dilimi
    2.5'te bağlanacak.
  - **Test/Build:** Timetable Vitest: 44 test yeşil. `npm run build` temiz. Browser smoke:
    `/admin/schedule` render ve console error yok; test verisi boş olduğu için drawer gerçek
    satırdan tarayıcıda tetiklenemedi.
- **Faz 2.3 Hub liste kolon zenginleştirme (2026-06-13):**
  - **Backend DTO:** `ClassProgramListItemDto` artık `ConflictCount`, `MissingHours`,
    `LastUpdatedAt`, `Version`; `HubSummaryDto` artık `ConflictCount`, `MissingHours` döner.
  - **Gerçek hesap:** `MissingHours`, şube-görevlendirme haftalık saatleri ile aktif
    yerleşimler arasındaki farktan hesaplanır. `LastUpdatedAt` audit `UpdatedAt ?? CreatedAt`;
    default audit tarihi UI'ya sızmaz. `Version`, program aggregate sürümüdür.
  - **Çakışma notu (GÜNCELLENDİ 2026-06-17):** Eski "Hub `ConflictCount=0` backstop" varsayımı Faz 3
    rezervasyon modeliyle (K8: Taslaklar rezerve etmez) geçersiz kaldı — Taslaklar başka sınıfların
    canlı programlarıyla gerçek çakışma taşıyabilir. Artık `ConflictCount` + `MissingHours`
    `schedule_programs`'a denormalize saklanır ve `IScheduleProgramStatsRecomputer` ile
    yerleşim/yayın/silme/restore anında recompute edilir; Hub bunları okur (aşağıya bkz).
  - **Web:** Hub özet şeridine çakışma/eksik-saat rozetleri ve tabloya Çakışma, Eksik Saat,
    Son Güncelleme, Sürüm kolonları eklendi.
  - **Test/Build:** Timetable Vitest: 44 test yeşil. Application timetable: 29 test yeşil.
    `npm run build` ve `dotnet build Oksis.slnx --no-restore` temiz. Browser smoke:
    local test verisi boş olduğu için tablo başlıkları render olmadı; boş ekran render ve
    console error yok.
- **Faz 2.3 Yayınlanmış okuma modelleri — BE (2026-06-13):**
  - **CQRS/API:** `PublishedScheduleQueryHandler` + 7 endpoint — `GET /branches/{id}/weekly`,
    `/teachers/me/weekly|today`, `/students/me/weekly|today`, `/parents/children/{id}/weekly|today`.
    Yalnız `ScheduleVersion` snapshot'ı okunur; taslak hiçbir uçtan dönmez.
  - **Scope/IDOR (handler içinde):** öğretmen yalnız kendi yerleşimleri; öğrenci kendi şubesi
    (`StudentProfile.CurrentClassroomId`); veli `ParentStudentRelationship` + `CanViewInfo` —
    ilişkisiz çocuk 403. `GetBranchWeekly` `timetable.view-all` izinli (admin/personel mercek).
  - **Okul-yerel saat:** "bugün/şu anki/sıradaki ders" `IDateTimeProvider.UtcNow` + `School.TimeZone`
    (IANA) dönüşümüyle hesaplanır — UTC ham saat kullanılmaz (TR UTC+3 → "şu anki ders" doğru).
  - **Test/Build:** Application timetable 37 test yeşil (PublishedSchedule 8 yeni: branch/teacher/
    student/parent + no-version NotFound + forbidden + okul-yerel today). `dotnet build` temiz.
- **Faz 2.4 Web tüketici ekranları (2026-06-13):**
  - **Modül:** `src/modules/timetable` consumer (types/keys/hooks/api), tenant-scope React Query key'leri.
  - **UI:** teacher/student/parent `Programım` sayfaları + paylaşılan `PublishedScheduleView`
    (`TodayLessonsPanel` şimdi/sıradaki + bugünün dersleri; `WeeklyScheduleGrid` gün×period ızgara;
    loading-skeleton / not-published / error / 403 durumları). Parent çocuk seçimi akışı.
  - **i18n:** tüm string'ler `timetable.consumer.*` (tr/en) — hardcoded Türkçe kalmadı (hard-ban uyumlu).
  - **Test/Build:** 14 yeni vitest (`PublishedScheduleView` 5 + sayfalar 9); tam web paketi 695 yeşil;
    `npm run build` temiz.
- **Faz 2.5A Geçici değişiklik (ScheduleException) — BE (2026-06-13):**
  - **Domain:** `ScheduleException` aggregate (Cancellation / TeacherSubstitution / RoomChange) +
    INV-E1 tip-özel alan, INV-E2 gün eşleşmesi, INV-E3 sebep + soft `Revoke` + `ScheduleExceptionCreated/RevokedEvent`.
    Yayınlanmış programı **kirletmez**; tarihe özel overlay. 12 domain test.
  - **Persistence:** `[academic].schedule_exceptions` + `ix_*_program_date`/`ix_*_branch_date` +
    **filtreli unique** `ux_schedule_exceptions_placement_date (WHERE revoked_at IS NULL)`.
    Migration `20260613_add_schedule_exceptions`. 2 integration test (ikinci aktif reddedilir; revoked engellemez).
  - **Application:** ortak `ScheduleExceptionPlanner` (hedef çözümleme + tarih `today..+30`/BR-TT-011 +
    tatil/`IHolidayCalendarReader`/BR-TT-004 + tip-özel + tarih-bazlı çakışma + aktif tekillik) →
    `Preview`/`Create`/`Revoke`/`List`. 11 handler test.
  - **API (izin `timetable.override`):** `POST .../exceptions/preview`, `POST .../exceptions`,
    `POST .../exceptions/{eid}/revoke` (program sahiplik), `GET .../exceptions?from&to&includeRevoked`.
  - **Read overlay (yalnız `*/today`):** `PublishedLessonDto` + `IsCancelled`/`ExceptionType`;
    iptal → ders düşer (current/next dışı), vekalet → şube görünümünde öğretmen swap / asıl öğretmende
    "devredildi" + vekil öğretmenin bugününe eklenir, derslik değişikliği → oda swap. Haftalık ızgara
    dokunulmaz. 3 overlay test.
  - **Test/Build:** Domain 42, Application 51, Integration 2, seed coverage yeşil; `dotnet build` temiz.
- **Faz 2.5C Geçici değişiklikler tepsisi + 3 katmanlı geri-al — FE (2026-06-14):**
  - **Saf çekirdek:** `editor/lib/tempChanges.ts` (TempChange modeli + reducer'lar: add/remove/markPublished/
    undoAll/loadPublished + `resolveDate(when,dayIdx,now)` + `toExceptionBody`) + `useTempChanges` hook. 10 saf test.
  - **Bileşenler (handoff `schedule_temp_changes.jsx` 1:1 port):** `SubstituteModal` (P28 müsait öğretmen +
    bu/gelecek hafta + sebep çipleri + bildirim), `CancelLessonModal` (+ telafi toggle), `TempChangesPanel`
    (tepsi: taslak/yayında + satır geri-al + Geçici Yayınla), `TempPublishModal` (onay→yayınlanıyor→başarı +
    8 sn halka-sayaçlı geri-al penceresi). Hücre işaretleri: teal **VEKİL** (asıl öğretmen üstü çizili),
    kırmızı taramalı **İPTAL**, yayınlanmışta yeşil nokta. `tempChanges.css` (handoff CSS port).
  - **Backend yeniden kullanım:** P25 `createException` (toplu, Debt-FE-11), P26 `listExceptions` (hafta
    istisnalarını "Yayında" satırı olarak yükle), P27 `revokeException` (geri-al), P28 `available-teachers`.
    Yeni FE wrapper'ları (`listExceptions`/`revokeException`) + `ScheduleExceptionDto` eklendi. **Yeni BE yok.**
  - **Coexistence:** Hücre menüsü artık `useTempChanges` tepsisini besler; **PublishDrawer + `useTempActions`
    + testleri dokunulmadan korundu** (bağımsız; kullanıcı onaylı tasarım). `permLocked = tc.hasTemp`.
  - **Test/Build:** Tam web paketi **765 vitest yeşil** (+1 skip), 165 dosya; `npm run build` temiz.
- **Sürüm Geçmişi (B grubu B-1) — BE+FE (2026-06-14):**
  - **Backend (3 dilim + domain):** `ScheduleProgram.RestoreFrom(snapshot)` (mevcut aktifleri pasifler →
    snapshot'tan yeniden kurar → blok grupları → `Revising` → `ScheduleProgramRestoredEvent`). `ListScheduleVersions`
    (version desc + `PublishedBy`→ad çözümü), `GetScheduleVersionDiff` (saf `Compute` + vN vs v(N-1), v1 ilk-yayın),
    `RestoreScheduleVersion` (snapshot → aktif programa Draft; DB filtreli unique index = çapraz çakışma backstop → 409).
    Paylaşılan `ScheduleSnapshotSerializer` (DRY). 3 yeni uç (P30/P31/P32). **Yeni tablo/migration/izin YOK**
    (`timetable.manage` zaten seed'li). BE timetable: Application 65 + Domain 45 yeşil; `dotnet build` temiz.
  - **Frontend:** `VersionHistoryDrawer` (sağ çekmece: sürüm zaman çizelgesi + "Aktif çalışma" sentetik satırı +
    lazy **Karşılaştır** diff + teyitli **Geri yükle** mutation + durum varyantları). Tetikleyiciler: Hub `RowMenu`
    "Sürüm geçmişi" item + editör **`EditorMoreMenu`** (⋯). API wrapper'ları + `timetable.versions.*` i18n (tr/en).
    Tam web paketi **808 vitest yeşil** (+1 skip), 170 dosya; `npm run build` temiz.
- **Programı Sil (B grubu B-2) — BE+FE (2026-06-14):**
  - **Backend:** `ScheduleProgram.Delete()` domain metodu + `ScheduleProgramDeletedEvent`. `DeleteScheduleProgram`
    komutu: programı + versiyonlarını + istisnalarını soft-siler (audit için tutulur), `lesson_placements.is_active=0`
    ile occupancy serbest bırakır. `GetDeleteProgramPreview` sorgusu: gerçek öğretmen + versiyon sayısı döner;
    öğrenci/veli=0 (Debt-BE-1 kapsamı). 2 yeni uç: `GET /programs/{id}/delete-preview` + `DELETE /programs/{id}`.
    Yeni `timetable.delete` izni + kanonik seed + migration. Yeniden oluşturma-sonrası-silme integration testi.
    BE timetable: Application 70 + Domain 47 yeşil (Task 11 gate); `dotnet build` temiz.
  - **Frontend:** `DeleteScheduleModal` iki aşamalı onay (preview → sil). Hub `RowMenu` + editör `EditorMoreMenu`
    (⋯) tetikleyicileri. Editörden sil → Hub sayfasına yönlendirme. `timetable.delete.*` i18n (tr/en). Web paketi:
    816 vitest yeşil (+1 skip), 172 dosya; `npm run build` temiz.
- **Faz 2.6 Bildirim & SignalR fan-out (BE+FE) (2026-06-15):**
  - **Domain + migration (oksis-api):** `Notification` + `NotificationDeliveryLog` entity'leri + `NotificationKind`
    enum'u (TimetablePublished/TimetableException/TimetableCancelled/TimetableExceptionRevoked/TimetableProgramDeleted).
    Yeni `[notifications]` şeması, migration `20260615_add_notifications`, idempotency için filtreli unique index
    `(SchoolId, EventId, RecipientAccountId, Channel)`.
  - **Pipeline:** domain event → MediatR `INotificationHandler<DomainEventNotification<TEvent>>` (commit-after) →
    `INotificationEnqueuer` (Hangfire) → `DispatchNotificationJob` (tenant `SetForLoginFlow`) →
    `NotificationDispatcher` (per-recipient delivery-log idempotency) → `InAppNotificationChannel`
    (`Notification` satırı + SignalR push). Outbox YOK (Invitation deseni gibi — Debt-N1).
  - **SignalR:** `NotificationHub` @ `/hubs/notifications`, grup `{schoolId}:{accountId}`, metot `ReceiveNotification`.
    Push Application portu `INotificationRealtimePusher` (Api impl `SignalRNotificationPusher`).
  - **Alıcı çözümü:** `NotificationRecipientResolver` — şube (classroom) → öğrenci (`StudentProfile.CurrentClassroomId`)
    + veli (`ParentStudentRelationship` aktif) login Account.Id'leri (`Person.LinkedAccountId`) + öğretmen
    Person→Account. Açık per-tenant `SchoolId` filtresi.
  - **5 event bağlandı (4 bildirim + 1 sessiz):** `ScheduleProgramPublishedEvent` (şube tüketicileri; v1 vs vN
    farklı metin; key `Combine(ProgramId, Version)`), `ScheduleExceptionCreatedEvent` (şube tüketicileri + orijinal
    + yeni öğretmen; Cancellation→Cancelled else Exception; key `Combine(ExceptionId,"created")`),
    `ScheduleExceptionRevokedEvent` (key `Combine(ExceptionId,"revoked")`), `ScheduleProgramDeletedEvent`
    (key `Combine(ProgramId,"deleted",Version)`). `ScheduleProgramRestoredEvent` → **handler YOK, tasarımla sessiz**
    (restore yeni sürüm üretmez; sonraki yayında yansır).
  - **API (self-scope, IDOR-safe):** `GET /api/v1/notifications` (paged), `/notifications/unread-count`,
    `POST /notifications/{id}/read`, `/notifications/read-all`. **Yeni izin yok** (auth-only,
    `RecipientAccountId == current account`).
  - **Web:** `src/modules/notifications/` (types/keys/api/hooks) + SignalR client (`@microsoft/signalr` v10) +
    header zili (`NotificationMenu.tsx`) gerçek API'ye + canlı güncellemeye bağlı + `notifications` i18n (tr/en).
    Tam web paketi **860 vitest yeşil**.
- **Faz 3 Dilim-1 Otomatik Üretim — tek-sınıf (BE+FE) (2026-06-15):**
  - **Solver çekirdeği (saf, Application `Modules/Timetable/AutoGenerate/Solver/`):** `IScheduleSolver` +
    `ScheduleSolver` orkestrasyonu — 3 farklı strateji (`CandidateStrategies`: MorningFirst/GapMinimizing/
    BalanceFirst) deterministik açgözlü yerleştiriciden (`GreedySolver`: MRV sıralama + talep-başına uygun-slot
    araması + adım bütçesi → asla takılmaz) geçer; `CandidateScorer` ağırlıklı sabah/boşluk/denge metrikleriyle
    puanlar (çakışma/eksik-saat/ort-boş-saat/tercih-uyumu%/günlük-denge); (MissingHours artan, Score azalan) ile
    sıralanır, en iyi = önerilen. Katı mod → en iyi hâlâ eksikse NoSolution + RelaxationHints. `SlotFeasibility`
    katı kısıtlar (sınıf/öğretmen/derslik tekilliği; öğretmen müsaitliği no-op). `LessonDemandBuilder` görevlendirme
    → talep açar. Yoğun birim-test edildi.
  - **Girdiler:** ders talepleri **görevlendirmeden** (`ITeachingAssignmentSource`, müfredat toplamından değil);
    slotlar zil periyot sayısından (Pzt-Cum × periyot); dış doluluk (çapraz-program, direkt sorgu); ev-dersliği
    (`ClassRoom.RoomId`); müsaitlik `IAvailabilityProvider` ile (no-op).
  - **Kalıcılık:** `ScheduleGenerationJob` entity (durum Queued/Running/Done/NoSolution/Failed + CandidatesJson/
    HintsJson) `[academic]` şemasında, migration `20260615_add_schedule_generation_jobs`.
  - **Akış (üret≠uygula):** `EnqueueAutoGenerateCommand` (program Draft/Revising doğrular — Published reddedilir;
    job oluşturur + kuyruğa alır) → `AutoGenerateScheduleJob` (Hangfire: tenant set → girdileri topla → çöz →
    aday/ipucu sakla) → `GetAutoGenerateStatusQuery` (poll) → `ApplyAutoGenerateDraftCommand` (seçilen aday →
    `ScheduleProgram.RestoreFrom` → Draft/Revising; admin ince-ayar + yayın). Retry-idempotency guard (yalnız
    Queued koşar). İzin `timetable.manage` (yeni izin yok).
  - **API (3 endpoint SchedulingController'da):** `POST .../programs/{id}/auto-generate` (→jobId),
    `GET .../auto-generate/{jobId}` (durum), `POST .../auto-generate/{jobId}/apply`. Self/tenant-scope
    (IDOR EF global filtre ile).
  - **Web:** `AutoGenDrawer` sihirbazı (ayarlar: kapsam [Tek sınıf aktif; Kademe/Tümü disabled=Dilim-2] +
    ağırlıklar + katı mod; üretiliyor; sonuçlar: 3 aday kartı + metrikler + mini-hafta + büyük önizleme +
    "Editörde Aç"; çözüm-yok: ipuçları; hata) `useAutoGenerate`'e bağlı (enqueue → poll ~1200ms → apply →
    editöre yönlendir). Tetikleyiciler Hub satır menüsü + editör ⋯ (yalnız Draft/Revising). i18n
    `timetable.autogen.*` (tr/en). Tam web paketi yeşil.
- **Çok-taslak program modeli + sınıf-bazlı otomatik üretim header akışı (BE+FE) (2026-06-16, K1–K12):**
  Tasarım: `.claude/specs/ders-programi-cok-taslak-otomatik-uretim-design.md`.
  - **Tek canlı + çok Taslak (K1/K9):** Sınıf+dönem için en fazla bir canlı (Yayında/Revize) program + sınırsız
    Taslak. `CreateProgram`'dan `program-exists` reddi kaldırıldı (K2); tek-canlı garantisi filtreli index
    (`status >= 1`) + publish-swap ile (migration `20260616_schedule_program_live_unique`).
  - **Publish-swap (K3/K10):** Yayınlanırken canlı kardeş varsa `RevertToDraft()` ile Taslağa indirilir (silinmez),
    sonra yayınlanır — `TransactionBehavior` ile atomik. `publish-preview` `replacedPublishedProgramId/Version`
    döner; `PublishDrawer` swap-uyarısı gösterir. Re-publish sürümü `ScheduleVersion` geçmişinden (max+1) türetilir.
  - **Rezervasyon yalnız canlı (K8/K12):** `lesson_placements.is_reserving` denormalize bayrağı; üç yerleşim
    unique index'i `... AND is_reserving=1`. Taslaklar serbestçe çakışır; çakışma yayında/yayınlamada ve doluluk
    ön-kontrolünde (`is_reserving=1 AND branch_id != X`) yüzeye çıkar (migration
    `20260616_add_lesson_placement_is_reserving`).
  - **İlk düzenleme → Revize (K11):** Published programa altı editör mutasyonundan biri kaydedilince `Revising`'e
    geçer; canlı snapshot tüketiciye değişmeden kalır.
  - **Autogen sınıf-bazlı sıfırdan + header tetik (K5/K6):** Tetik Hub başlığında ("Yeni Program"ın solunda) —
    satır/editör ⋯ menüsünden kaldırıldı. `AutoGenDrawer` kapsam (Tek sınıf) + şube seçici (`GET .../auto-generate/
    classes`). `schedule_generation_jobs` `program_id` → `branch_id`+`academic_term_id`+`academic_year_id`'ye
    re-key edildi (migration `20260616_rekey_schedule_generation_jobs_to_branch`). Endpoint'ler: `POST .../auto-generate`
    `{branchId, academicYearId, academicTermId, weights, strict}` → jobId; `GET .../auto-generate/{jobId}` (değişmedi);
    `POST .../auto-generate/{jobId}/apply` `{candidateId}` → **yeni Taslak programId**. Apply YENİ bir Taslak yaratır.
- **Otomatik üretim — oturum düzeltmeleri + günlük aynı-ders kısıtı (BE+FE) (2026-06-16):**
  - **Gün indeksi (fix):** Solver `BuildWeekGrid` 1-tabanlı `DayOfWeek` yerine modülün **0-tabanlı** konvansiyonuna
    hizalandı (Pzt=0..Cuma=4) — Pazartesi artık boş kalmıyor + external-occupancy hizası düzeldi.
  - **Queued'da takılma (fix):** Arka plan enqueue açık transaction içinde fire ediliyordu; `IPostCommitDispatcher` +
    `PostCommitDispatchBehavior` ile **commit sonrası** kuyruğa alınır (autogen + bildirim enqueuer'ları). Yarış giderildi.
  - **Önizleme period (fix):** `AutoGenDrawer` mini/büyük önizleme period'u 1-tabanlı (`previewGrid.ts`) — boş üst satır + son period kaybı giderildi.
  - **BR-TT-014 (yeni):** Autogen'de günde aynı ders ≤2 **kesin kısıt** (`SolverWeights.LimitDailySameSubject`, varsayılan açık) +
    sihirbazda toggle. 3-4 ardışık/aynı-gün yığılması önlenir; yer yoksa eksik saat.
  - **BR-TT-015 (yeni):** 2'şer saat **blok eğilimi** (yumuşak; `SolverWeights.PreferBlockPairing`, varsayılan açık) — aynı dersi
    yan yana dizmeye eğilim (`GreedySolver` komşuluk-öncelikli kararlı sıralama); 1 saatlikler tek. Sihirbazda toggle.
- **Hub çakışma + eksik saat denormalize sayımı (BE) (2026-06-17):** `schedule_programs.conflict_count` +
  `missing_hours` kolonları (migration `20260617_schedule_program_stats_columns`) + `ScheduleProgram.SetStats`.
  `IScheduleProgramStatsRecomputer` (çakışma = başka şubelerin canlı yerleşimleriyle öğretmen/derslik; eksik =
  **ızgara bazlı**: 5 gün × zil ders periyodu − dolu hücre — editör alt çubuğu `deriveMissingCells` ile birebir).
  Hook'lar: editör mutasyonları + create + apply-autogen → kendi sayıları (canlıysa dönem);
  publish/swap/delete/restore → dönem. `ListClassPrograms` + `GetHubSummary` artık kolonları okur (eski hardcoded `0`
  ve on-read görevlendirme hesabı kalktı) → editördeki canlı çakışma ile tutarlı. **Debt:** canlı program düzenlerken
  (Revising) kardeş Taslakların sayısı, o program tekrar yayınlanana/recompute tetiklenene dek bayatlayabilir.
- **Faz 3 Dilim-2 Çok-Sınıf Otomatik Üretim (BE+FE) (2026-06-17, K-D2-1…6):** Tasarım:
  `.claude/specs/ders-programi-cok-sinif-otomatik-uretim-design.md`. Otomatik üretim tek sınıftan **kademe/tümü
  çok-sınıfa** genelleştirildi; **Debt-AG-5 kapandı**.
  - **Solver (joint çok-sınıf, K-D2-1/2):** `LessonDemand`/`PlannedPlacement` `BranchId` taşır;
    `SolveInput.HomeRoomByBranch`; `GreedyState`/`FeasibilityContext` sınıf-slot/günlük-ders/blok-komşuluk/
    ev-dersliği **branch-keyed**, öğretmen+derslik **global** (çapraz çift-rezervasyon engellenir); MRV tüm sınıflar
    arası; `CandidateScorer.ScorePerClass` + `SolveCandidate.PerClass`; aggregate sıralama değişmedi. **Tek sınıf =
    N=1 özel hâli** (regresyon korundu).
  - **Job/kapsam (K-D2):** `GenerationScope` enum (Single/GradeLevel/All) + `int? GradeLevel`; `BranchId` nullable;
    `CreateForScope(...)` (legacy `Create` → Single). `EnqueueAutoGenerateCommand(Scope, BranchId?, GradeLevel?, …)`
    + 422 hataları (`branch-required`/`grade-required`/`no-classes`); yeni port `IAutoGenClassResolver`
    (Single=şube; GradeLevel=`DisplayOrder`; All=tümü, arşivlenmemiş). `AutoGenerateScheduleJob.RunAsync(jobId,
    schoolId, ct)` kapsamı→branchId'lere çözüp **tek joint solve**; dış doluluk **şube-sahipli (owner-map, K12)** —
    bir slotu rezerve eden şube kendisi hariç tüm şubeleri bloklar (editör `BranchId != program.BranchId` ile parite),
    kapsam-içi kardeşin canlı programı dahil. Migration `20260617_schedule_gen_job_scope` (additive; mevcut satırlar → Single).
  - **Apply (seçmeli/toplu + idempotent, K-D2-3/4):** `ScheduleProgram.GeneratedFromJobId` damgası + index
    `ix_schedule_programs_generated_from` (migration `20260617_schedule_program_generated_from`).
    `ApplyAutoGenerateDraftsCommand(JobId, BranchIds[], CandidateId?)` → `AppliedDraftDto[]` (`{BranchId, ProgramId}`);
    branch-başına idempotent (mevcut damgalı Taslağı döndürür), tüm branch'ler atomik. Bloklar kapalı (Debt-AG-8).
  - **API:** `POST .../auto-generate` body scope/branchId/gradeLevel kazandı; `.../apply` body `{branchIds[],
    candidateId?}` → `AppliedDraftDto[]`; status DTO `Scope` + placement `BranchId` + candidate `PerClass`.
  - **Web:** `AutoGenDrawer` kapsam seçici (Tek/Kademe/Tümü) + kademe seçici; bulk sonuç = per-class satır
    (checkbox + çakışma/eksik rozet + "Aç") + footer "Tümünü/Seçilenleri Kaydet" + başarı banner; tek-sınıf 3-kart
    korundu; `apply(branchIds, candidateId)` branchId ile uzlaşır; Hub kaydetmede invalidate. i18n
    `autogen.scope.*`/`autogen.bulk.*` (tr/en). **Süregelen debt (K-D2-6):** blok üretimi kapalı (Debt-AG-8),
    müsaitlik no-op (Debt-AG-1), okul-geneli tek zil grid (Debt-FE-3/AS-2), açgözlü heuristik (Debt-AG-6).

- **Faz 4/Dilim-1 Müsaitlik & Tercih — BE (2026-06-17) — Debt-AG-1 KAPANDI:**
  - **Domain:** `TeacherAvailability` aggregate (`TenantEntity`; seyrek slot depolama — Available depolanmaz) + `AvailabilitySlot` owned `sealed record` (value-equality) + `AvailabilityStatus` enum (Available=0 / PrefersNot=1 / Unavailable=2) + `SetSlot` (slot değiştir) + `ReplaceAll` (tüm seti güncelle). `TeacherAvailabilityId` strongly-typed record struct.
  - **Persistence (`[academic]` şema):** `teacher_availabilities` tablosu (audit + rowversion + ux) + `teacher_availability_slots` owned tablo (FK cascade; day/period/status int colonları) — bkz. DB şema bölümü. EF `OwnsMany` field-backed `"_slots"`. Migration `20260617_add_teacher_availabilities`.
  - **Solver entegrasyonu:** `TeacherAvailabilityProvider` (gerçek; `IAvailabilityProvider` impl) — dönem+öğretmen müsaitlik kayıtlarını DB'den okur, slot-seviye `AvailabilityStatus` döner; seyrek model (kayıt yoksa `Available`). Solver: `SlotFeasibility.CanPlace` `Unavailable` slotu hard reddeder, `PrefersNot` slotu `RespectTeacherPreference` soft bileşeniyle ağırlıklandırır. **Debt-AG-1 kapandı.**
  - **Komutlar/Sorgular:**
    - `GetTeacherAvailabilityQuery(teacherId, termId)` → `TeacherAvailabilityDto { teacherId, slots[] }` (tek öğretmen, yalnız PrefersNot/Unavailable slot'ları).
    - `GetTermTeacherAvailabilityQuery(termId)` → `TermTeacherAvailabilityDto { teachers[] }` (döneme ait tüm öğretmenlerin müsaitliği).
    - `SaveTeacherAvailabilityCommand(teacherId, academicYearId, termId, slots[])` → upsert (aggregate yoksa Create, varsa ReplaceAll); PlaceLesson/MoveLesson recompute tetikler (müsaitlik ihlali sayacı güncellenir).
  - **Hub denormalize sayım:** `schedule_programs.availability_violation_count` kolonu (migration `20260617_add_availability_violation_count`). `ScheduleProgram.SetAvailabilityViolationCount` setter; `IScheduleProgramStatsRecomputer` ihlal sayısını `PlaceLesson`/`MoveLesson`/`SaveTeacherAvailability` sonrası günceller. Hub bu kolonu okur.
  - **Override (`AllowUnavailable`):** `PlaceLessonCommand`/`MoveLessonCommand`'a `AllowUnavailable` bayrağı eklendi; `true` geçildiğinde hard-block bypassed olur. Bu bayrağı set etmek `timetable.override` iznini gerektirir (handler + validator kontrolü).
  - **API (3 endpoint — `timetable.manage`):** `GET availability/teachers/{teacherId}?termId` / `GET availability?termId` / `PUT availability/teachers/{teacherId}` — bkz. API Kontratları bölümü.
  - **Testler:** Domain 17 unit (TeacherAvailabilityTests + AvailabilityStatusTests); Application 28 unit (SaveTeacherAvailability + GetTeacherAvailability + GetTermTeacherAvailability + PlaceLesson override path + EditPlacement override path); Integration 3 (TeacherAvailabilityProvider + AvailabilityViolationStats + PlaceLessonOverride). **Full suite:** build 0 hata, 1684 test geçti / 0 başarısız.

- **Faz 4/Dilim-1 Müsaitlik & Tercih — FE handoff stillemesi (2026-06-18):**
  - **Handoff port (`schedule_avail.jsx`/`.css` birebir):** Sayfa `.stu .aca .sav` iki-kolon yerleşime (304px seçici + ızgara) yeniden kuruldu; `availability.css` 192 satırlık handoff CSS'in faithful portu (editör `sed-*` scaffold'unu — `.sed-cal/.sed-grid/.sed-time/.sed-break/.sed-gh` — yeniden kullanır, üstüne `sav-*` ekler). Token: eksik `--bg` → `--background` remap; `--text-body` rengi `.stu` (students.css) bloğundan miras. **`.sed-sk`** iskelet sınıfı yerelde tanımlandı (editördeki adı `.sed-skel`).
  - **Bileşenler:** `TeacherPicker` (arama + branş çipleri + avatar + branş alt-etiketi + Tanımlı/— rozeti), `AvailabilityGrid` (zaman-aralıklı `.sed-time` satırları + teneffüs/öğle ayraçları zil çizelgesinden + 3-renk `.sav-cell` + hover mini-picker), `SavDayMenu` (gün başlığı doldur popover), `TeacherAvailabilityPage` (başlık şeridi: sayaç pill'leri + Güncel/dirty/saving + Kaydet; bulkbar: Tüm haftayı Müsait + gün-doldur; lejant 3 öğe; durum varyantları: yükleniyor iskeleti / zil yok / hata / öğretmen seçilmedi).
  - **Branş veri kaynağı — Debt YOK:** `teachersApi.list` (`/users/persons?profileType=Teacher`) `branch` döndürüyor → branş çipleri + satır alt-etiketi gerçek veriden geliyor (yeni `useAvailabilityTeachers` hook'u; eski branşsız `useAutoGenLookups` kaynağı bırakıldı). Avatar rengi handoff `SAV_AV_COLORS` paletinden stabil hash.
  - **Bağlam:** Gün 0..4; cycle 0→1→2→0 + advance-to-0 silme (seyrek) korundu; sayaçlar taslaktan; dönem etiketi `useHubData.donemLabel` (sezon · dönem) — yeni alan eklendi. Toplu İçe Aktar / Başka güne kopyala / Önceki dönemden kopyala butonları görsel (disabled) — backend yok (Debt).
  - **Testler:** `availability` suite (AvailabilityGrid 4 + TeacherAvailabilityPage 1 + useTeacherAvailability 3) yeşil; tüm timetable suite 202/202 geçti; `npm run build` temiz. i18n `availability.*` (statusShort, legend, dayMenu, breaks, empty.*Title/Body, errorTitle/Body, noTeacherSelected, allBranches, noMatch) tr+en eklendi.

- **Faz 4/Dilim-2a Nöbet Çizelgesi — FE (2026-06-19):**
  - **i18n (Task 1):** `duties` namespace (tr/en) — `tabs.*`, `grid.*`, `teacher.*`, `actions.*`, `state.*`, `toast.*`, `days.short/long`, `info.*`, `breadcrumb.*`, `title/subtitle`. `relieverEnabled=false` iken yancı anahtar'ları mevcut ama gated (gizlenir).
  - **React Query (Task 2):** `dutyKeys` tenant-scope (SchoolId prefix), `dutiesApi` → 15 endpoint bağlaması. `getPolicy` (DS1), `savePolicy` (DS2), `getDutyRoster` (D7), `saveRoster` (D8), `publishRoster` (D9), `getVersions` (D10), `getSummary` (D11), `listLocations` (D2), `createLocation` (D1), `updateLocation` (D3), `deleteLocation` (D4), `listExemptions` (D5), `createExemption` (D6), `deleteExemption`, `getMyDuties` (self-scope), `getAvailableRelievers` (K-2a-2 gated).
  - **Hooks (Task 3):** `useDutyData` (8 React Query hook), `useDutyMutations` (8 mutation), `useDutyContext` (termId, academicYearId, teachers, days, today, relieverEnabled, isLoading), `useAvailableRelievers`, `useMyDuties`.
  - **DutyGrid (Task 5):** Gün×Bölge matrisi. `byCell` map ile O(1) render. Nöbetçi avatar+isim. `relieverEnabled=true` ise yancı alt-satırı (teal). Çakışma rozeti. Bugün sütun vurgusu. Tıklama → onCellClick prop.
  - **FairnessPanel (Task 6):** Öğretmen başına nöbet dağılımı. `relieverEnabled` gated yancı sütunu (K-2a-5). Legend 2-satır (Nöbet / Yancı — yalnız reliver açıkken).
  - **DutySummaryBar (Task 6):** Toplam atama + min/max + muaf + çakışma pill'leri. Yancılık kapalı rozeti (relieverEnabled=false). Sürüm + geçerlilik tarihi. Geçmiş link → DtaVersionDrawer.
  - **DtaAvatar + DtaCellMenu (Task 5/6):** DtaAvatar (initials + hash renk). DtaCellMenu (Radix Popover+portal): öğretmen listesi (avatar + isim + branş + yük sayacı) + Kaldır seçeneği. Busy öğretmenler grayed.
  - **Bölgeler & Politika — PolitikaTab (Task 8):** Bölge CRUD (DtaRegionModal — ad/tip/kapasite/ikon), muafiyet CRUD (DtaMuafModal — öğretmen seçici/Kalıcı/Geçici/gün), politika toggle (relieverEnabled + haftalık sıklık + gün dağılımı). Politika Kaydet PageHeader'da (polDirty flag).
  - **DutyAdminPage — 3 sekme + page header (Task 9):** Çizelge / Vekâlet (placeholder) / Bölgeler & Politika. PageHeader: Öğretmen Görünümü + Kaydet (draft varken) + Yayınla. Draft op-log (`applyOps`) buffered model. DtaPublishModal (geçerlilik tarihi + sürüm numarası). DtaVersionDrawer (sürüm zaman çizelgesi). DtaTeacherPreview. Route guard: `duties.manage`.
  - **TeacherDutyPage — salt-okunur (Task 10):** `useMyDuties` (self-scope IDOR). Liste / Haftalık takvim (DutyWeek) alt-segment toggle. Özet şeridi (nöbet sayısı + yancı sayısı K-2a-5 gated + sıradaki görev). K-2a-5: `relieverEnabled=false` iken kind="reliever" item'lar filtrelenir. K-2a-2: müsaitlik bilgisi gösterilmez. Boş/hata/yükleniyor durum varyantları.
  - **Testler (Task 11 — bu görev):** DtaAvatar 2, DtaCellMenu (render+close+busy), DtaPublishModal (open+submit), DutyAdminPage (tab switch + empty state), DutyGrid (cell render + relieverEnabled gating), FairnessPanel (reliever col gate), PolitikaTab (toggle+add+remove), useDutyData (hook render), TeacherDutyPage (yükleniyor/hata/boş/dolu + K-2a-5 gate). **Full suite:** 966 test geçti / 1 skipped / 0 başarısız; `npm run build` temiz; `npx tsc --noEmit` yalnız pre-existing deprecation uyarısı (baseUrl TS7.0).

- **Faz 4/Dilim-2b Vekâlet — BE (2026-06-19):**
  - **Domain/Application (ScheduleException yeniden kullanımı):** Yeni aggregate eklenmedi; vekâlet komutları `ScheduleException` (Cancellation/TeacherSubstitution) aggregate'ini yeniden kullanır — Dilim 2a `ScheduleExceptionPlanner` altyapısının üstünde yeni `Duties/Substitution/` dikey dilimi.
  - **BranchFit çözücüsü:** `BranchMatchingService` — `Subject.Category` karşılaştırması: Same=tam eşleşme (score 2), Near=kategori-ailesi eşleşmesi (score 1), Different=eşleşmeme (score 0). `SubstituteCandidateDto { teacherId, name, currentLoad, branchFit (int) }` ile döner.
  - **Sorgular (3):**
    - `GetTodaysSubstitutionBoardQuery` → `SubstitutionBoardDto { date, lessons: SubstitutionLessonDto[] }`. `SubstitutionLessonDto { placementId, subjectName, branchName, period, originalTeacherId, originalTeacherName, substituteTeacherId?, substituteTeacherName?, status (Unassigned/Assigned/StudyHall/Cancelled) }`. Yalnız **Published||Revising** programlar sorgulanır (K-2b-1 yayın filtresi).
    - `GetAvailableSubstitutesQuery(programId, placementId, date)` → `SubstituteCandidateDto[]`. Müsait = o gün+period'da başka vekil/yapısal ders yok (K-2b-6 vekil-vekil dışlama). Kendi yapısal veya vekil dersi olan öğretmen dışlanır. BranchFit `Subject.Category` üzerinden.
    - `GetMySubstitutionsQuery` → `MySubstitutionDto[] { date, period, branchName, subjectName, originalTeacherName, status }` — Teacher self-scope.
  - **Komutlar (3):**
    - `CreateSubstitutionCommand(programId, placementId, date, substituteTeacherId, reason)` → ScheduleException (TeacherSubstitution tipi). K-2b-6 vekil-vekil dışlaması validate; K-2b-1 yayın filtresi. `duties.substitute` izni.
    - `MarkStudyHallCommand(programId, placementId, date, reason)` → ScheduleException (Cancellation tipi, `reason="study-hall"`). `duties.substitute` izni.
    - `RevokeSubstitutionCommand(programId, exceptionId)` → soft revoke. Zaten revoked → **409 Conflict** (NotFound değil — tutarlılık). `duties.substitute` izni.
  - **API (6 endpoint — `duties.substitute`):** `SubstitutionController` @ `/api/v1/duties/substitution/*` — bkz. api-contracts.md § Vekâlet bölümü.
  - **İzin kullanımı:** `duties.substitute` (Dilim 2a'da seed'li ama pasif) artık 6 endpoint tarafından **etkin kullanılıyor**. Yalnız SchoolAdmin rolü taşır (2a'da karar verildi).
  - **K-2b-6 vekil-vekil dışlama:** `GetAvailableSubstitutes` hem yapısal hem varolan vekil atamaları kontrol eder; `CreateSubstitution` validate adımında ikinci kez kontrol.
  - **Published-only fix (K-2b-1/K0.6):** Board sorgusu + available-substitutes sorgusu artık yalnız `Published` veya `Revising` programları döner.
  - **K-2b-7 (itiraz ertelendi):** Öğretmen itiraz akışı `schedule_requests` dilimine ertelendi; teacher view `GetMySubstitutions` ile salt-okunur.
  - **Testler:** Application unit 22 (GetTodaysSubstitutionBoard 5, GetAvailableSubstitutes 6, CreateSubstitution 7, MarkStudyHall 2, RevokeSubstitution 2). **Full suite:** build 0 hata / 0 uyarı; 395 Domain + 145 Api + 1042 Application + 29 Tests + 245 Infrastructure = **1856 test geçti / 0 başarısız**.

- **Faz 4/Dilim-2b Vekâlet — FE (2026-06-19):**
  - **Task 1 — i18n:** `duties.substitution` namespace genişletildi (tr + en parité). `tabTitle`, `daybar.*`, `addAbsent`, `absentPicker.*`, `info.*`, `lesson.*`, `covered.*`, `suggest.*`, `candidate.*`, `toast.*`, `teacher.*`, `noPermission`, `empty`, `error` key'leri eklendi. Mevcut `placeholderTitle`/`placeholderBody` korundu.
  - **Task 2 — Tipler + Query Key'leri + API:** `BranchFit` string union + `BRANCH_FIT_BY_INT` int→string map (BE int 0/1/2 → `same`/`near`/`different`). `SubstituteCandidateDto`, `SubstitutionLessonStatus`, `SubstitutionLessonDto` (`programId`/`time`/`room`/`substituteId`/`substituteName`/`substituteBranch`/`exceptionId`), `AbsentTeacherBoardDto` (`absentTeacherId/Name/Branch` + `date`), `MySubstitutionDto` BE planıyla birebir. Mutation body tipleri. `dutyKeys.substitutionBoard`, `.substitutionCandidates`, `.mySubstitutions` tenant-scope. `dutiesApi`: `getSubstitutionBoard`, `getAvailableSubstitutes`, `getMySubstitutions`, `createSubstitution`, `markStudyHall`, `revokeSubstitution` eklendi.
  - **Task 3 — React Query Hook'ları:** `useSubstitutionBoard(termId, date, teacherId, enabled)` (lazy), `useAvailableSubstitutes(programId, date, day, period, absentTeacherId, enabled)` (lazy — `onExpand` ile tetiklenir), `useSubstitutionMutations(_termId, _date)` (`createSubstitution`/`markStudyHall`/`revokeSubstitution` + `dutyKeys.all(schoolId)` invalidation), `useMySubstitutions(termId)` (teacher self-scope). 5 birim test.
  - **Task 4 — DtmCandidate + DtmLesson:** `DtmCandidate` (avatar + isim + fit rozeti `dta-fit:ok/yan/no` + yük + "Önerilen" tag + "Ata" butonu). `DtmLesson` (3 durum dalı: `open` → pill + `dta-sugg` öneri listesi + DtmCandidate'ler; `covered` → avatar + Bildirildi + Geri Al; `study-hall` → BookOpen + Geri Al; yerel `expanded` toggle). 19 birim test.
  - **Task 5 — DtaVekalet + DutyAdminPage wiring:** `DtaVekalet` bileşeni — gün bar'ı (Açık/Kapandı/Serbest sayıları), bilgi banner'ı, shadcn Select + Input öğretmen seçici, `AbsTeacherCard` (board yükleme + LessonSlot kompozisyonu + onLessonsLoaded callback), `LessonSlot` (lazy candidate fetch). `DutyAdminPage`: `VekaletPlaceholder` → `DtaVekalet`; `usePermission("duties.substitute")` kapısı; sekme disabled (`!canSubstitute`); no-permission body (`substitution.noPermission`). Toast'larda öğretmen adı: `DtmLesson.onAssign(id, name)` imzası + `t("substitution.toast.assigned", { name })`. 4 yeni test.
  - **Task 6 — Öğretmen salt-okunur vekâlet bölümü:** `TeacherDutyPage.tsx`: `useMySubstitutions(termId)` eklendi; `SubstitutionSection` bileşeni — `MySubstitutionDto` listesi, `branchName·subjectName`, gün/period/saat, oda, "yerine" pattern, Eye ikonu + `viewOnly` etiketi; boş durum; hata durumu (`subsError` → satır içi mesaj). `teacher-duty.css` genişletildi. K-2b-7 uyumlu (itiraz yok). 8 test (6 → 8).
  - **`duties.substitute` FE Gate:** Vekâlet sekmesi yalnız `duties.substitute` iznine sahip kullanıcılara (SchoolAdmin) yazma sunar; diğerleri no-permission durumu görür. Sekme butonu disabled (`!canSubstitute`).
  - **K-2b-7 deferral (itiraz):** Öğretmen itiraz/onay akışı `schedule_requests` dilimine ertelendi; teacher view salt-okunur. `ui-flows.md`'de not edildi.
  - **Testler (Task 7 — bu görev):** Full suite **1001 test (1000 passed / 1 skipped / 0 failed)**, 201 dosya. Duty/vekâlet suite: `DtaVekalet.test.tsx` 4 + `useSubstitution.test.tsx` 5 + `DtmCandidate.test.tsx` 8 + `DtmLesson.test.tsx` 11 + `TeacherDutyPage.test.tsx` 8 + `DutyAdminPage.test.tsx` 5 = **41 duty/vekâlet testi**, tümü yeşil. `npm run build` temiz.

- **Faz 4/Dilim-2a Nöbet Çizelgesi — BE (2026-06-19):**
  - **Domain:** `DutyLocation` (`TenantEntity`; kapasite 1–4; Activate/Deactivate; `DutyLocationType` enum: Floor/Canteen/Garden/Gate/Hall/Other) + `DutyExemption` (`TenantEntity`; Permanent/Temporary + CoversDay) + `DutyRoster` aggregate (`TenantEntity`; Draft→Published→Superseded versiyonlama; `DutyAssignment` owned child list) + `DutyAssignment` entity (Teacher×Day×Location + optional Reliever). Domain invariants: INV-D1 (muaf öğretmen), INV-D2 (gün-tekilliği), INV-D3 (kapasite ≤ 4), INV-D4 (yancı ≠ nöbetçi + o günde meşgul değil), INV-D5 (yalnız Draft düzenlenebilir). Domain events: `DutyAssignmentChangedEvent`, `DutyExemptionChangedEvent`, `DutyRosterPublishedEvent`. `DutyDomainException extends DomainException` (422 via ExceptionHandlingMiddleware). `DutyLocationTemplate` master entity (platform seed). Strongly-typed IDs: `DutyLocationId`, `DutyRosterId`, `DutyAssignmentId`, `DutyExemptionId`.
  - **Persistence (`[academic]` şema):** `duty_locations` (+ `ix_duty_locations_school_active`) + `duty_exemptions` (+ `ix_duty_exemptions_school_teacher`) + `duty_rosters` (+ `ux_duty_roster_live` K-2a-4 tek-canlı filtreli unique + `ix_duty_rosters_term_status`) + `duty_assignments` (`OwnsMany` field-backed + `ux_duty_assignment_teacher_cell` K-2a-3 filtreli unique + `ix_duty_assignments_teacher`). `duty_location_templates` platform master (seed). SchoolSettings +3 kolon: `duties_reliever_enabled`, `duty_weekly_frequency`, `duty_day_pattern`. Migrations: `20260619_add_duties_roster`, `20260619_add_duties_permissions`. DutyAssignment gerçek CLR property (Guid.Empty shadow-prop bug giderildi).
  - **SchoolSettings nöbet ayarları:** `DutyWeeklyFrequency` enum (TwicePerWeek/OncePerWeek/OnceEveryTwoWeeks) + `DutyDayPattern` enum (Spread/Consecutive). 2a'da inert; 2c solver girdisi.
  - **Komutlar (8):** `CreateDutyLocation`, `UpdateDutyLocation`, `DeleteDutyLocation`, `SetDutyExemption`, `RemoveDutyExemption`, `SaveDutyRosterDraft` (upsert; INV'lar domain içinde), `AssignReliever`, `PublishDutyRoster` (temporal supersede + `DutyRosterPublishedEvent` + Hangfire bildirim enqueue).
  - **Sorgular (7 + 1):** `ListDutyLocations`, `ListDutyExemptions`, `GetDutyRosterForEdit` (çakışma read-model conflict alanı), `GetDutyRosterVersions`, `GetDutyHubSummary`, `GetAvailableRelievers` (K-2a-2: müsaitlik girdi değil; yalnız Permanent-muaf dışlar), `GetMyDuties` (self-only IDOR), `GetDutiesConfiguration` + `UpdateDutiesConfiguration` (settings).
  - **API (15 endpoint + DS1/DS2):** `DutiesController` @ `/api/v1/duties` — D1..D15. Settings: DS1/DS2 SchoolSettingsController üzerinden. İzinler: `duties.view` (okuma) / `duties.manage` (yazma). Bkz. api-contracts.md § Nöbet Çizelgesi.
  - **İzinler:** 4 izin kodu seed edildi: `duties.view`, `duties.manage`, `duties.substitute`, `duties.view-load`. SchoolAdmin: manage+substitute+view+view-load. SuperAdmin: view+view-load (salt-okunur, K-2a-6). Teacher: duties.view (self-scope). Migration `20260619_add_duties_permissions`.
  - **Bildirim:** `DutyRosterPublishedEvent` → `DutyNotificationHandler` → `INotificationEnqueuer` (Hangfire) → dispatch pipeline (timetable Faz 2.6 deseni). `DutyNotificationContent` hardcoded Türkçe (Debt-N2 deseni, i18n ertelendi). Alıcı resolution öğretmen başına N sorgu (Debt — post-MVP optimizasyon).
  - **Testler:** Domain 41 unit (DutyLocationTests 5, DutyExemptionTests 8, DutyRosterTests 28); Application 59 unit (komut + sorgu handler'lar); Integration 3 (DutyRosterIndexTest: tek-canlı backstop, DutyAssignmentIndexTest: teacher-cell unique, DutyAssignmentCapacityTest: aggregate count+index combo). **Full suite:** build 0 hata; Oksis.Domain 395 / Oksis.Api 133 / Oksis.Application 1012 / Oksis.Tests 28 geçti / Oksis.Infrastructure.IntegrationTests 228. (**1 test başarısız — bkz. ⏳ Debt-T1 ve ⚠️ sapma #1 altında**)

## ⏳ Eksik / Bekleyen Yapılar

- `rooms.*` özel izinleri (şimdilik rooms uçları `class-rooms.view/update` ile korunuyor — aşağıdaki sapma kaydı).
- **Debt-BE-8 (silme bildirimi) — ✅ KAPANDI (2026-06-15, Faz 2.6):** `ScheduleProgramDeletedEvent` artık
  şube tüketicilerine in-app+SignalR bildirim dağıtır (kind TimetableProgramDeleted; key
  `Combine(ProgramId,"deleted",Version)`).
- **Debt-BE-1 (delete-preview etki sayısı):** Silme önizlemesinde öğrenci/veli sayısı 0 — publish-preview ile aynı Debt-BE-1 kapsamı; öğretmen ve versiyon sayısı gerçek hesaplanıyor.
- **Backend (sonraki fazlar):** otomatik üretim (Faz 3), müsaitlik/nöbet (Faz 4).
  (Geçici değişiklik web UI = Faz 2.5C tamam; SignalR+notification fan-out = Faz 2.6 tamam.)
- **Mobile:** Öğretmen/şube/öğrenci program görünümleri.
- Yoklama/ödev/duyuru modüllerinin bu kaynağı referans alma entegrasyonu.
- **Debt-BE-1:** Yayın önizlemesinde etkilenen öğrenci/veli sayısı şimdilik `0`.
  Doğru değer için şube öğrenci sayısı + veli ilişkisi read model'i Faz 2 consumer
  diliminde bağlanacak. Öğretmen sayısı aktif yerleşimlerden gerçek hesaplanıyor.
- **Debt-BE-2:** Geçici değişiklik önizlemesinde (preview) tam veli sayısı `0` (publish-preview ile aynı);
  öğretmen + şube öğrenci sayısı gerçek. Veli read-model'i sonra bağlanacak.
- **Debt-BE-3 (bildirim) — ✅ KAPANDI (2026-06-15, Faz 2.6):** `ScheduleExceptionCreated/RevokedEvent`
  artık dağıtılır — Created: şube tüketicileri + orijinal + yeni öğretmen (Cancellation→Cancelled else
  Exception); Revoked: şube tüketicileri. In-app+SignalR.
- **Debt-BE-4 (substitution-in):** Yalnız vekalet ettiği ders olan (kendi yapısal dersi olmayan) öğretmenin
  haftalık sorgusu boş → NotFound; bu durumda bugün overlay'i vekalet dersini gösteremez. Kendi dersi olan
  öğretmende çalışır. Tüketici today sorgusunu yapısal-yokken-de çalışır hale getirmek sonraki iş.
- **Debt-FE-5:** Geçici değişiklik web oluşturma akışı **editör-merkezli redesign'a geçti (Faz 2.5B
  redesign)**: editör hücre menüsü (Vekil/İptal) + Yayınla drawer'da "Geçici değişiklik" türü + tarih
  → P25. (2.5B-2'nin composite form'u kaldırıldı.) Geriye **"Mevcut değişiklikler" listesi + Geri Al
  (P26/P27) → Faz 2.5B-3** kaldı (plan mevcut, ertelendi).
- **Debt-FE-10 (branş öğretmeni veri kaynağı):** "Öğretmen Değiştir" branş filtresi client-side, şube
  görevlendirme satırlarından (`/unplaced` subjectId→teacher) türetilir → genelde o derse atanmış
  öğretmen(ler). Okul geneli "bu branşı verebilen tüm öğretmenler" niteliği (Teachers branş yeterliliği)
  gelince genişletilebilir; veri yoksa `lookups.teachers` (tümü) fallback.
- **Debt-FE-11 (geçici uygula atomik değil):** Yayınla drawer'ında çoklu geçici aksiyon P25 döngüsüyle
  tek-tek oluşturulur; bir aksiyon 409 ile reddedilirse o ve sonrası uygulanmaz (hata gösterilir, önceki
  aksiyonlar oluşmuş kalır). Tek tarih için atomik batch ucu sonraki iş.
- **Debt-BE-5 (vekil-vekil çakışması):** `available-teachers` (P28) "müsait" hesabı yalnız yapısal
  yerleşimleri sayar; aynı tarihte başka bir derse zaten vekil atanmış öğretmen müsait görünebilir.
  Tarih-bazlı istisna çakışması ileride eklenecek.
- **Debt-FE-12 (editör çakışma hücresi işareti) — ✅ KAPANDI (2026-06-13):** Yeni `external-occupancy`
  ucu (P29, teknik analiz §6.2 — bu program hariç dönemdeki tüm aktif yerleşimler) + saf `deriveConflicts`
  ile editör artık çapraz-program çakışan hücreleri kırmızı "⚠ Çakışma" rozetiyle işaretliyor,
  `ValidationBar` gerçek `conflictCount` gösteriyor, Doğrula paneli çakışma satırlarını listeliyor
  ("Hücreye git"). Tamponlu modelde işaret kaydedilmemiş yerel yerleştirmeler için (Kaydet'te 409
  olacakların ön-uyarısı); kaydedilmiş veride çakışma zaten write-time engeliyle oluşamaz. 5 yeni
  `deriveConflicts` testi; 741 vitest yeşil.
- **Debt-FE-6 (flush atomik değil):** Editör Kaydet, op-log'u mevcut uçlara sıralı replay eder (yeni atomik uç yok). Bir op 409 ile reddedilirse o op ve sonrası uygulanmaz; buffer sunucu gerçeğine resetlenir (uygulanmamış değişiklikler kullanıcı tarafından tekrar yapılır). Atomik batch `POST /draft/apply` ucu sonraki iş.
- **Debt-FE-7 (precheck stale):** Tamponlu düzenlemede `precheck` sunucu occupancy'sini kullanır; aynı program içindeki kaydedilmemiş taşımalar occupancy'ye yansımaz (sınıf-slot tekilliği yerel `cellMap` ile doğru). Kesin doğrulama Kaydet (flush) anında sunucu + DB unique backstop ile yapılır.
- **Debt-FE-8 (flush hata ayrımı yok):** Flush hatası tek genel `editor.saveFailed` banner'ına indirgenir; eşzamanlılık (409 concurrency/stale-version) ile validation hatası ayrıştırılmaz. `interpretConflict` + `ConcurrencyBanner` kodda korunuyor (yetim ama testli) — flush hata ayrımı/concurrency reload akışı 2.5B sonraki dilim veya sertleştirme işinde yeniden bağlanacak.
- **Debt-FE-13 (telafi UI-only):** Geçici iptal modalındaki "Telafi dersi planla" toggle yalnız UI; backend'de telafi dersi kavramı yok → işaretlenir, P25'e gönderilmez. Telafi planlama backend'i sonraki iş.
- **Debt-BE-6 (restore bildirimi) — ✅ KAPANDI (tasarımla, 2026-06-15, Faz 2.6):** `ScheduleProgramRestoredEvent`
  için **bilinçli olarak handler yok** — restore yeni sürüm üretmez, program `Revising` (taslak) durumuna düşer;
  değişiklik tüketiciye ancak sonraki **yayın** ile yansır. "Restored sessiz" tasarım kararıyla kapatıldı
  (implementasyonla değil).
- **Debt-BE-7 (restore occupancy senkronu):** `RestoreScheduleVersion` Redis occupancy index'ini senkronlamaz; doğruluk DB filtreli unique index ile garanti (spec §7), occupancy yalnız ön-kontrol ipucu → restore sonrası bayat kalabilir, ilk yazma komutunda düzelir. Ayrıca çapraz çakışma 409 yolu yalnız DB-index ile doğrulanır (birim test yok; integration sonraki iş).
- **Debt-D2 (geçici taslak kalıcı değil):** Yayınlanmamış geçici-değişiklik taslakları yalnız FE state'inde (editör tamponuyla aynı felsefe) → sayfa yenilemede uçar. Yayınlanmışlar P26'dan döner. Kullanıcı kararı (2026-06-14); gerçek taslak kalıcılığı için ScheduleException Draft durumu + publish ucu gerekir (ertelendi).
- **Debt-FE-11 (geçici toplu uygula atomik değil)** Faz 2.5C'de de geçerli: "Geçici Yayınla" P25 döngüsüyle tek-tek oluşturur; bir aksiyon 409 ile reddedilirse o ve sonrası uygulanmaz. Tek tarih için atomik batch ucu sonraki iş.
- **Debt-BE-2 (geçici yayın etki sayısı):** `TempPublishModal` etki kutularında öğrenci/veli sayısı gerçek değil (öğretmen taslaklardan türetilir); doğru sayı backend preview read-model'i gerektirir (publish-preview ile aynı borç).
- **Debt-BE-2 (bildirim alıcı sayısı):** Bildirim fan-out gerçek alıcıları çözer, ama publish/temp PREVIEW
  uçları hâlâ 0 öğrenci/veli raporlar (ayrı read-model borcu — değişmedi).
- **Debt-N1 (Outbox yok):** Pipeline event→Hangfire (Invitation deseni); gerçek crash-safe exactly-once Outbox
  gerektirir (CLAUDE.md Outbox tarif eder; Teknik Analiz §10 yalnız event→Hangfire ister — sapma kaydı altta).
- **Debt-N2 (yalnız in-app + SignalR):** FCM push + email ertelendi (FCM altyapısı yok, mobil katman henüz yok).
- **Debt-N3 (sessiz saat + cooldown yok):** Quiet hours (22:00–07:00) + Redis cooldown yok; sezon-başı tek-tetik
  düşük aciliyetli olduğu için ertelendi.
- **Debt-N4 (mobil bildirim ekranı yok):** Mobil katman ayrı tier.
- **Debt-N5 (bildirim tercih tabloları yok):** Per-kanal/per-tip kullanıcı tercihleri yok.
- **Debt-N6 (idempotency iki pencere):** Eşzamanlı dispatch yarışı (DB unique index backstop) + kanal-gönderim
  ile delivery-log commit arası crash (Hangfire retry'da kopyalanabilir); in-app için kabul edilebilir, tam
  exactly-once Outbox gerektirir (Debt-N1).
- **Debt-AG-1 (müsaitlik no-op) — ✅ KAPANDI (2026-06-17, Faz 4/Dilim-1):** `TeacherAvailabilityProvider`
  (gerçek impl) + `TeacherAvailability` aggregate + solver hard/soft entegrasyonu + 3 API endpoint + recompute
  hook teslim edildi. Bkz. yukarıdaki ✅ Faz 4/Dilim-1 girdisi.
- **Debt-AG-2 (oda-tipi verisi yok):** Ders→oda-tipi eşlemesi verisi yok → her zaman ev-dersliği atanır
  (özel odalar/laboratuvar sonra).
- **Debt-AG-3 — ✅ TESLİM (debt değil):** Orijinal "tek aday" MVP'si handoff (3 puanlı aday) ile
  geçersizleşti; **borç değil, teslim edilen** olarak kaydedildi.
- **Debt-AG-4 (durum polling):** Job durumu polling ile alınır; SignalR job-push ertelendi.
- **Debt-AG-5 (çok-sınıf) — ✅ KAPANDI (2026-06-17, Faz 3 Dilim-2):** Kademe/Tümü çok-sınıf **joint** global
  üretim + toplu/seçmeli sonuçlar teslim edildi (UI'daki disabled kapsamlar aktive edildi). Bkz. yukarıdaki ✅
  Faz 3 Dilim-2 girdisi + BR-TT-AG-5/6.
- **Debt-AG-6 (özel heuristik solver):** Özel açgözlü heuristik kullanıldı; ileri optimizasyon / OR-Tools
  gerekirse `IScheduleSolver` portunun arkasına eklenebilir (özellikle Dilim-2 global için).
- **Debt-AG-7 (zor ders verisi yok):** "Zor ders" işareti için veri kaynağı yok → boş küme geçilir
  (ders zorluğu verisi gelene dek sabah-önceliği ağırlığının etkisi yok).
- **Debt-AG-8 (blok üretim kapalı):** Bu dilimde blok üretim KAPALI (görevlendirmelerde blok girdisi yok)
  → tüm yerleştirmeler IsBlock=false.
- **Debt-AG-9 (aday dedup yok):** Aday tekilleştirme yapılmadı — seyrek/az-kısıtlı ızgaralarda 3 strateji
  aynı adaya çökebilir (gerçek sınıflar farklılaşır; dedup/distinct-sayım sonraki rafine işi).
- **Not (job transition guard'sız):** `ScheduleGenerationJob` durum-geçiş metotları korumasız (tek-yazıcı
  job; illegal-transition doğrulaması orkestratöre ertelendi).

- **Debt-T1 (TEST GAP — KRİTİK):** `MasterRoleSeedTests.Should_GrantFullCatalogToAdminRoles` testi `duties.manage` ve `duties.substitute` izinlerinin SuperAdmin'e atanmamasından dolayı başarısız. Neden: K-2a-6 binding kararı (SuperAdmin salt-okunur) bu iki izni `AllPermissionIds()` dışında bıraktı ancak test expectation güncellenmedi. Fix: testi `teaching-assignments.copy-season` deseniyle güncellemek (4 satır). **Escalate to user.**
- **Debt-D1 (Secretary):** K-2a-6'daki `Secretary→duties.view` eşlemesi, sistemde seed'li Secretary rolü olmadığı için ertelendi. Secretary rolü seed'e alındığında `duties.view` eklenmeli.
- **Debt-D2 (geçici-muaf yancı):** `GetAvailableRelievers` yalnız Permanent muafiyeti dışlar; Temporary-exempt-bugün öğretmen yancı adayı olabilir. BE-12 weekly-template kararıyla tutarlı; brief "permanent" dedi.
- **Debt-D3 (çakışma TZ):** `conflict=teacher-exempt` hesabı UTC kullanır, okul TZ değil (display-only, post-MVP).
- **Debt-D4 (bildirim i18n):** `DutyNotificationContent` hardcoded Türkçe; i18n ertelendi (timetable Debt-N2 deseni).
- **Debt-D5 (2nd-save rollback test):** `PublishDutyRoster` 2nd-save `DbUpdateException` rollback yolu otomatik testsiz (EF interceptor mock gerektirir; kod yolu okunarak doğrulandı).
- **Debt-D6 (alıcı resolution N+1):** Notification recipient resolution öğretmen başına N sorgu (post-MVP batch optimizasyon).
- **Debt-D7 (Dilim 2b — vekalet) — ✅ KAPANDI (2026-06-19, Faz 4/Dilim-2b):** `duties.substitute` izni 6 endpoint ile etkinleştirildi. Bkz. yukarıdaki ✅ Faz 4/Dilim-2b girdisi.
- **Debt-D8 (Dilim 2c — auto-distribute):** `DutyWeeklyFrequency` + `DutyDayPattern` policy 2a'da inert; 2c solver girdisi olacak.
- **Debt-BE-Vek-1 (orphaned subject BranchFit):** `Subject.Category` `GetValueOrDefault` → Language tier için yanlış pozitif BranchFit farklılıkları üretebilir; explicit Different-tier assertion içeren test eksik. Post-MVP refinement.
- **Debt-BE-Vek-2 (P28 yayın filtresi yok):** `GetAvailableTeachers` (P28, Faz 2.5B redesign) hâlâ Published/Revising filtresi içermiyor — pre-existing, 2b kapsamı dışı.
- **Debt-BE-Vek-3 (teacher view read-only):** Öğretmen itiraz akışı (K-2b-7) ertelendi; `GetMySubstitutions` salt-okunur. `schedule_requests` diliminde tamamlanacak.
- **Debt-D9 (Dilim 2d — yük raporu):** `DutyLoadRowDto` DTO tanımlı ama query yok; `duties.view-load` izni seed'li, endpoint ertelendi.
- **Debt-D10 (GetAvailableRelievers izni):** `duties.manage` kullanır; Teacher rolü bu endpoint'i kullanamaz. Dilim 2b'de re-değerlendirme.

## ⚠️ Spec Dışına Çıkılanlar

- 2026-06-19 — **K-2a-2 (bağlayıcı karar): Müsaitlik (Dilim 1) nöbet/yancıya HİÇ girdi değil.** Teknik analiz §3.4 ve §8.2'nin "müsaitlik girdi" maddeleri geçersiz. `Unavailable` slotu olan ama o günde başka görevi olmayan öğretmen yancı adayı olabilir. `GetAvailableRelievers` müsaitlik tablosunu hiç sorgulamaz. **FE sonucu:** `DtaCellMenu` + yancı seçici UI'da müsaitlik rengi/uyarısı gösterilmez; `TeacherDutyPage`'de müsaitlik satırı yoktur. Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **K-2a-5 (bağlayıcı karar — FE gating): `relieverEnabled=false` iken tüm yancı UI öğeleri gizlenir.** Tasarım handoff'unda yancı bileşenleri her zaman görünür; spec K-2a-5 "yancılık kapalıysa UI'dan da kaldır" kararıyla override edildi. **FE sonucu:** `DutyGrid` yancı alt-satırı, `FairnessPanel` yancı sütunu, `DutySummaryBar` yancı legend satırı, `TeacherDutyPage` yancı sayacı + yancı item'lar `relieverEnabled` flag'ine koşulludur. `PolitikaTab`'daki toggle sunucu verisini yönetir. Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **K-2a-3 (bağlayıcı karar): Kapasite-farkındalıklı index seçildi.** Teknik analiz tek-nöbetçi `(school,term,day,location)` unique index öngörüyordu; uygulanan model `(school,term,roster,day,location,teacher)` filtreli unique + aggregate `count ≤ Capacity` kombinasyonu. Çok-nöbetçi (kapasite>1) bölgeleri destekler. Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **`DutyAssignment` denormalize alanları gerçek CLR property.** Shadow prop ile ilk tasarımda `Guid.Empty` insert + tenant index bug yaşandı; `SchoolId` ve `AcademicTermId` gerçek CLR property olarak düzeltildi. Etki: daha doğru tenant index ve tenant interceptor uyumu. Onay: teknik düzeltme.
- 2026-06-19 — **CROSS-MODULE yan etki: `DutyDomainException` artık `DomainException`'ı extend ediyor.** `ExceptionHandlingMiddleware`'e `DomainException` kolu eklendi → duty exception'lar 422 döner. Yan etki: Location/School `DomainException` alt sınıfları (önceden uncaught→500) artık 422. İyileştirme ama Dilim 2a kapsamı dışı bir davranış değişikliği. `AcademicsDomainException` hâlâ `Exception`'dan türüyor (pre-existing tutarsızlık). Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **Debt-T1 (test gap) ✅ GİDERİLDİ (`26cc8da`): `MasterRoleSeedTests` K-2a-6 muafiyeti eklendi.** `duties.manage` + `duties.substitute` (+ mevcut `teaching-assignments.copy-season`) SuperAdmin tam-katalog testinden `schoolAdminOnlyCodes` HashSet'iyle dışlandı. Tam suite 1797/0 yeşil. (Test-beklentisi K-2a-6 onaylı tasarıma hizalandı; seed davranışı değişmedi.)
- 2026-06-19 — **Debt-D2 — Geçici-muaf öğretmen yancı adayı olabilir.** `GetAvailableRelievers` yalnız Permanent muafiyet dışlar; Temporary-muaf-bugün öğretmen yancı listesinde görünür. Brief "permanent" dedi; K-2a-2 tutarlı. Etki: minimal (kullanıcı seçer, domain INV-D4 son kontrol). Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **Debt-D4 — `DutyNotificationContent` hardcoded Türkçe.** i18n ertelendi (timetable `NotificationContent` deseni). Etki: bildirim metni Türkçe sabit. Post-MVP. Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **Debt-D5 — `PublishDutyRoster` 2nd-save `DbUpdateException` rollback yolu testsiz.** EF interceptor mock gerektirir; kod yolu okunarak doğrulandı. Etki: recovery senaryosu otomatik test yok. Post-MVP. Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **Debt-D3 — Çakışma/muafiyet hesabı UTC, okul TZ değil.** `conflict=teacher-exempt` display-only; okul TZ post-MVP. Etki: display tutarsızlığı olabilir (UTC+3 TR için aynı gün). Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **Debt-D6 — Bildirim alıcı resolution öğretmen başına N sorgu.** Perf borcu; post-MVP batch optimizasyon. Etki: az öğretmenli okulda ihmal edilebilir. Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **Debt-D1 (Secretary gap): `duties.view` Secretary'e verilmedi.** Seed'li Secretary rolü yok. K-2a-6 §Secretary eşlemesi ertelendi. Etki: Secretary nöbet göremez (0 runtime etkisi şimdilik). Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **K-2b-1 (ad-hoc devamsızlık entity'si yok):** Spec öğretmen-devamsızlık entity'si öngörüyordu; admin "yok öğretmen + sebep" seçer ama yalnız sonuçlanan ScheduleException'lar kalıcıdır; devamsızlık kaydı yoktur. Etki: devamsızlık tarihsel raporu 2b kapsamı dışı. Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **K-2b-2/K-2b-3 (yeni aggregate yok):** Vekâlet yeni aggregate yerine `ScheduleException` aggregate'ini (Dilim 2a altyapısı) yeniden kullanır; `CreateSubstitution`/`MarkStudyHall`/`Revoke` `duties.substitute` kapısı altında in-domain exception yaratır. `timetable.override` gated eski P25 komutuna değil yeni `SubstitutionController` endpoint'lerine gider. Etki: iki vekâlet yolu aynı tabloyu paylaşır; IDOR domain invariant + handler izin kapısı ile ayrılır. Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **K-2b-4 (BranchFit `Subject.Category` üzerinden):** BranchFit tiers yeni seed/config yerine `Subject.Category` karşılaştırmasından türetilir; veri konfigürasyonu olmadan çalışır. Etki: kategori eşlemesi zımni; yanlış kategori verisi yanlış tier'a yol açabilir (Debt-BE-Vek-1). Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **K-2b-6 (vekil-vekil dışlama):** `GetAvailableSubstitutes` + `CreateSubstitution` validator her ikisinde de yapısal + mevcut vekil atamaları kontrol eder; ayrı uygunluk yardımcı fonksiyonu önerildi ama zorunlu tutulmadı (iki kontrol noktası var — DRY borcu). Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **Published-only fix (K-2b-1/K0.6):** Board sorgusu + available-substitutes yalnız Published||Revising döner. **P28 `GetAvailableTeachers`** hâlâ yayın filtresi içermiyor (pre-existing; 2b kapsamı dışı — Debt-BE-Vek-2). Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **K-2b-7 (öğretmen itiraz ertelendi):** Teacher itiraz akışı `schedule_requests` dilimine ertelendi; 2b teacher view salt-okunur (`GetMySubstitutions`). Onay: kullanıcı 2026-06-19.
- 2026-06-19 — **Zaten-revoked → 409 Conflict (NotFound değil):** `RevokeSubstitution` zaten revoke edilmiş exception'da 409 döner; `RevokeScheduleException` (timetable.override komutu) tutarlılığı için aynı davranış. Onay: teknik karar.

- 2026-06-19 — **Debt-D11 (Teacher yetki aşırı-açığı — BE final review): `duties.view` admin read uçlarını da açıyor.** K-2a-6 "Teacher view self-only" der, ancak design §5 admin read uçlarını (`GET /duties/roster`, `/summary`, `/exemptions`, `/versions`, `/locations`, `settings/duties`) da `duties.view`'e bağlar; yalnız `/duties/me` handler'da self-scoped. Net: `duties.view` taşıyan Teacher tüm okulun roster'ını + muafiyetleri (öğretmen adı+sebep = **PII**) + politikayı okuyabilir. Çözüm (ertelendi): ayrı `duties.view-self` izni ekleyip admin read'leri `duties.view`'de bırakmak. Etki: PII aşırı-açığı. **Onay: kullanıcı 2026-06-19 (şimdilik debt olarak kabul; sonraki dilimde düzeltilecek).**

- 2026-06-17 — **Override izni müsaitlik hard-block'a da kapı oldu:** Editör yerleşim komutlarında (`PlaceLesson`/`MoveLesson`) `AllowUnavailable=true` bayrağı `timetable.override` iznine bağlandı — müsait olmayan slota zorla yerleştirme bu mevcut izni gerektirir (design doc K-D1-2/4; yeni permission slug eklenmedi; etki: override ek yetki ister). Onay: kullanıcı.
- 2026-06-17 — **Slot-seviye `teacher_id` denormalizasyonu eklenmedi (YAGNI):** Design doc §3.2 `teacher_availability_slots`'a `teacher_id` denormalize edilmesini öngörüyordu; provider/recomputer `TeacherId`'yi parent aggregate üzerinden okuduğu için join zaten gerekmiyordu. Etki: seyrek slot tablosu daha yalın; slot tekilliği `(teacher_availability_id, day, period)` unique ile sağlanıyor. Onay: kullanıcı.
- 2026-06-17 — **`AvailabilitySlot` `sealed record` (readonly record struct değil):** EF Core `OwnsMany` owned-collection gereksinimi nedeniyle `readonly record struct` yerine `sealed record` seçildi; değer-eşitliği korunur. Etki: yok. Onay: kullanıcı.

- 2026-06-17 — **Joint (ortak) solver seçildi** (sıralı/birikimli reddedildi, K-D2-1); en iyi global kalite + çapraz öğretmen/derslik tekilliği global garanti. Onay: kullanıcı.
- 2026-06-17 — **Seçmeli apply zenginleştirildi:** handoff'un ham "satır-Aç" modeli + "Tümünü Kaydet"/"Seçilenleri Kaydet" (checkbox) ile genişletildi (K-D2-3). Onay: kullanıcı.
- 2026-06-17 — **`GeneratedFromJobId` damgası ile idempotent apply** (DB-unique değil, app-level — admin-tıklama UX'i için yeterli; K-D2-4). Onay: kullanıcı.
- 2026-06-17 — **Bulk modda sınıf-başına aday seçimi yok** (joint çözüm sınıfları bağlar); en iyi global aday sınıf-bazlı parçalanır (K-D2-5). Onay: kullanıcı.
- 2026-06-16 — Program tekilliği "tek program/sınıf" → "tek Yayında/Revize (canlı) + çok Taslak" (K1/K9). program-exists reddi kaldırıldı; tek-canlı publish-swap + filtreli index ile zorlanır. Onay: kullanıcı.
- 2026-06-16 — Yerleşim tekilliği (öğretmen/derslik/sınıf-slot) yalnız canlı programa daraltıldı (is_reserving denormalize, K8/K12). Taslaklar serbestçe çakışır; çakışma yayında/yayınlamada yakalanır. Onay: kullanıcı.
- 2026-06-16 — Yayındaki programa ilk düzenleme kaydedilince Revize'ye geçer (K11, yeni davranış). Onay: kullanıcı.
- 2026-06-16 — Otomatik üretim program-bazlı uygulamadan SINIF-bazlı sıfırdan üretime + yeni Taslak yaratmaya geçti; tetik Hub başlığına taşındı (K5/K6). Onay: kullanıcı.
- 2026-06-16 — Not: `OKSIS-Faz3-Otomatik-Uretim-Test-Rehberi.docx` eskidi (satır-menüsü + program-bazlı akış anlatıyor) — yeni akışa göre yeniden üretilmeli.
- 2026-06-15 · **Faz 3 handoff-zengin + 2-dilim ayrım:** Tasarım handoff'u (`.claude/design-handoffs/schedule_autogen.jsx`)
  ilk MVP'den zengin (3 aday + ağırlıklar + katı mod); tümüyle benimsendi. Faz 3, Dilim-1 (tek sınıf, bu) +
  Dilim-2 (kademe/tümü çok-sınıf, sonraki) olarak bölündü. Onay: kullanıcı (2026-06-15). Etki: yok.
- 2026-06-15 · **Ders talebi görevlendirmeden:** Ders talepleri görevlendirmelerden (ders+öğretmen+haftalık-saat)
  gelir, `IRequiredHoursResolver`'dan değil (o sınıf-seviye toplamı verir — yalnız sonra çapraz-kontrol için).
  Onay: kullanıcı (2026-06-15). Etki: yok (daha temiz).
- 2026-06-15 · **Müsaitlik no-op (Debt-AG-1):** Müsaitlik Faz 4 girdisi; solver boş engellenmiş-slot ile koşar.
  Onay: kullanıcı (2026-06-15). Etki: otomatik üretim müsaitliği henüz dikkate almaz (Debt-AG-1).
- 2026-06-15 · **Bildirim Outbox atlandı (Faz 2.6):** CLAUDE.md transactional Outbox tarif eder; pipeline
  event→Hangfire (Invitation deseni) ile kuruldu. Sebep: Teknik Analiz §10 yalnız event→Hangfire ister, tam
  exactly-once bu fazda gereksiz. Onay: kullanıcı (2026-06-15). Etki: in-app için kabul edilebilir, çift
  bildirim penceresi var (Debt-N1/N6).
- 2026-06-15 · **FCM push + email ertelendi (Faz 2.6):** Teknik Analiz §10 push/email kanallarını listeler;
  yalnız in-app + SignalR uygulandı. Sebep: FCM altyapısı + mobil tier henüz yok. Onay: kullanıcı (2026-06-15).
  Etki: kanal genişlemesi sonraki iş (Debt-N2).
- 2026-06-15 · **Sessiz saat + cooldown ertelendi (Faz 2.6):** quiet hours (22:00–07:00) + Redis cooldown
  uygulanmadı. Sebep: sezon-başı tek-tetik düşük aciliyetli. Onay: kullanıcı (2026-06-15). Etki: yok (Debt-N3).
- 2026-06-15 · **`ScheduleProgramRestoredEvent` sessiz (tasarımla):** restore bildirimi yok — restore yeni
  sürüm üretmez, değişiklik sonraki yayında yansır. Sebep: tüketiciye yansıtacak yeni durum yok. Onay: kullanıcı
  (2026-06-15). Etki: Debt-BE-6 implementasyonla değil tasarımla kapatıldı.
- 2026-06-14 · **`timetable.delete` izni (spec §8 dışı):** Spec §8 izin listesini "mevcut — değişmez" sayar; silme için yeni `timetable.delete` izni tanımlandı + seed + migration (`timetable.publish`/`timetable.override` eklemeleriyle aynı desen). Onay: kullanıcı (2026-06-14). Etki: silme uçları gerçek izinle korunur.
- 2026-06-14 · **Programı Çoğalt iptal edildi (B grubu):** Tasarımdaki "Programı çoğalt", öğretmen-tekilliği
  invaryantıyla (`UX_Placement_Teacher_Slot`, spec §4.2) çatışıyor — sadık tam-kopya kaynak öğretmenleri zaten o
  slotlarda dolu olduğu için DB tarafından reddedilir; ayrıca `LessonPlacement.TeacherId` zorunlu (§3.2), öğretmensiz
  iskelet-klon model değişikliği gerektirir. Kullanıcı kararı (2026-06-14): **Çoğalt kapsam dışı**, B-1 yalnız Sürüm
  Geçmişi. Etki: yok (özellik eklenmedi). PDF/Sil sonraki dilimler.
- 2026-06-14 · **Geçici değişiklik UX = tepsi-merkezli (Faz 2.5C, yeni handoff):** 2.5B'nin yayınla-drawer
  içi geçici-değişiklik gating'i **kaldırılmadı/korundu** ama aktif geçici-yazma yüzeyi yeni "Geçici
  değişiklikler" tepsisine + ayrı "Geçici Yayınla" akışına taşındı (2026-06-14 tasarım handoff'u
  `schedule_temp_changes.jsx`). Taslaklar yalnız FE state (yenilemede uçar — kabul). PublishDrawer +
  `useTempActions` kodda bağımsız korundu (coexistence). Backend kontratı aynı (P25/P26/P27/P28; yeni BE
  yok). Onay: kullanıcı (2026-06-14). Plan: `.claude/plans/2026-06-14-ders-programi-faz2-5c-gecici-tepsi-*.md`.
- 2026-06-13 · **GERİ ÇEVRİLDİ → Geçici değişiklik UI = editör-merkezli (handoff §171):** Önceki "drawer
  içi kompoze form" sapması (aşağıda), kullanıcı kontrolünde tasarım handoff'una (§171: Yayın türü =
  Kalıcı / Geçici değişiklik, editörde değişiklik → Yayınla → tarih) aykırı bulundu. **Faz 2.5B redesign**
  ile composite form kaldırıldı; editör hücre menüsü (Vekil Öğretmen Ata / Ders İptal) + Yayınla drawer
  yayın-türü gating + tarih → P25 akışına geçildi. İkame Ders kapsam dışı (kullanıcı). Onay: kullanıcı
  (2026-06-13). Etki: handoff'a hizalandı; backend kontratı aynı (P25), tek yeni okuma ucu P28.
- 2026-06-13 · ~~**Geçici değişiklik UI = drawer kompoze form (editör-diff değil):**~~ (YUKARIDA GERİ
  ÇEVRİLDİ) Kullanıcı 2.5B brainstorming'inde editör-diff'i tercih etmişti; buffered model + backend tek-yerleşim/tek-tip/tek-tarih kısıtları netleşince (taşıma/ekleme/combined geçici yapılamaz, çok-günlü diff tek tarihe sığmaz) **drawer içi kompoze form**a geçildi — backend P24/P25 ile 1:1, guard'sız. Onay: kullanıcı (2026-06-13). Etki: yok (kontrat aynı); UX daha basit.
- 2026-06-13 · **Editör per-aksiyon yazma → tamponlu Kaydet:** Faz 1B editörü her aksiyonu (place/move/remove/teacher/room/block) anında sunucuya yazıyordu; tasarım handoff'undaki "Kaydet" butonu modeline (değişiklik yoksa disabled, varsa dirty-dot, kaydetmeden çıkışta uyarı) geçildi. Değişiklikler yerel op-log'da birikir, Kaydet'te replay edilir. Tüketiciye yansıma yalnız yayınlanmış snapshot'tan olduğu için kullanıcı etkisi yok; editör veri bütünlüğü/UX iyileşir. Spec §7 "Place/Save anında yetkili doğrulama" artık Kaydet (flush) anında sunucu komutu + DB filtreli unique backstop ile karşılanır; çakışma modeli (katı/engelleyici) DEĞİŞMEDİ. `useEditorMutations` hook'u kaldırıldı; yeni: `editorDraft.ts` (saf) + `useEditorDraft` hook + `LeaveGuardDialog`. Onay: kullanıcı (2026-06-13).
- 2026-06-13 · **`timetable.override` izni seed'lendi (spec §8 ↔ gerçeklik):** Spec §8 izni
  "zaten tanımlı/seed'li" sayıyordu; gerçekte yoktu (publish'te olduğu gibi). Kanonik seed'e
  (`MasterSeedIds` + `PermissionSeedData` + `RolePermissionSeedData` → admin rolleri) + migration
  `20260613_add_timetable_override_permission`. Onay: kullanıcı (2026-06-13).
- 2026-06-13 · **Entity adı `ScheduleException` (plan-bağlayıcı):** `business-rules.md` eski
  `ScheduleOverride` adını kullanıyor; yeni teknik-analiz modelinde ad `ScheduleException`. Etki: yok
  (kontrat aynı); business-rules rename'i ileride senkronlanacak.
- 2026-06-13 · **`TimeChange` override tipi kapsam dışı:** Eski kontrat taslağı Cancellation/
  TeacherSubstitution/RoomChange/**TimeChange**/Combined öngörüyordu; period modelinde zaman = zil
  çizelgesi olduğundan TimeChange anlamsız → 3 tip (Cancellation/Substitution/RoomChange). Onay: kullanıcı.
- 2026-06-13 · **`ScheduleException.Id` `Guid` (strongly-typed id yerine):** Plan `ScheduleExceptionId`
  VO öneriyordu; en yakın Faz 2 kardeşi `ScheduleVersion` `Guid Id` kullandığından EF dönüşüm karmaşası
  olmadan onunla hizalandı. Etki: yok.
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
- 2026-06-12 · **Faz 2.1 `timetable.publish` seed'i öne alındı:** §8'de listeli publish
  izni yayın backend dilimiyle birlikte kanonik seed'e eklendi. Faz 2.1'de yalnız
  `timetable.publish` aktive edildi; `override/manage-rooms/import-excel/view` seed'leri
  ilgili dilimlerde kapatılacak. Etki: yayın endpoint'leri authorization pipeline'da gerçek
  izinle korunur.
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
- 2026-06-12 · **Debt-FE-1 — Hub çakışma/eksik-saat rozetleri kapandı:** Tasarım/spec §9.1
  Hub'da çakışma + eksik-saat rozeti betimliyor; Faz 1A DTO'ları bunları sağlamadığı için
  Faz 1B-1'de render edilmemişti. 2026-06-13'te `ClassProgramListItemDto`/`HubSummaryDto`
  zenginleştirildi; eksik saat gerçek assignment delta'sından hesaplanır. Çakışma şimdilik
  write-time hard guard nedeniyle `0` döner; stale validation/read-model gelirse genişletilecek.
- 2026-06-12 · **Debt-FE-2 — Hub sürüm/son-güncelleme kapandı, "kim" yok:** Tasarım bu kolonları
  gösteriyor; Faz 1A DTO'da alan yoktu. 2026-06-13'te `Version` ve `LastUpdatedAt` eklendi.
  "Kim güncelledi" alanı backend audit kontratında olmadığı için hâlâ kapsam dışı.
- 2026-06-13 · **Hub liste gerçeklik düzeltmesi:** Tasarım handoff'u öğretmen/derslik mercekleri,
  otomatik oluştur, çoğalt/PDF ve bazı liste zenginliklerini gösteriyordu. Kullanıcı uyarısı üzerine
  görünür "Yakında"/mock parçaları listeden kaldırıldı; yalnız gerçek API alanları ve gerçek aksiyonlar
  kaldı. Aynı gün çakışma/eksik/sürüm/son-güncelleme için backend DTO eklendi ve kolonlar gerçek veriyle
  geri getirildi. Doğrulama: 44 timetable Vitest yeşil, `npm run build` temiz, browser smoke'ta mock
  aksiyon/mercek yok.
- 2026-06-12 · **Debt-FE-3 — Editör period grid: tek/ilk bell schedule:** Tasarım kademe-bazlı
  zil çizelgesi öngörüyor (spec AS-2); editör Faz 1B-2a'da okulun bell schedule'ındaki Lesson
  slot'larını (kademe ayrımı olmadan) period grid yapar; bell yoksa 1..8 fallback. Kademe→bell
  eşlemesi netleşince sıkışacak. Onay: kullanıcı (2026-06-12, brainstorming). Etki: tek-kademeli/tek
  zil çizelgeli okullarda sorunsuz; çok-kademeli okul için 1B-2b/Faz sonrası.
- 2026-06-12 · **Editör branş rengi/kodu yok (küçük):** Handoff hücrelerde branş rengi + kod
  gösteriyor; backend lookup'ı yalnız ad veriyor → editör hücreleri varsayılan accent kenarlık +
  ders adı kullanır. Etki: görsel; renk eşlemesi opsiyonel sonraki iş.
- 2026-06-12 · **Debt-FE-4 — Eksik-saat hücre-bazlı, mandatory/optional ayrımı yok:** Tasarım eksik-saati
  "zorunlu penceredeki (1-6) boş hücreler" sayıyor; backend `/unplaced` ise ders-bazlı kalan saat veriyor
  (hücre hedefi yok → "Hücreye git" imkânsız). Kullanıcı kararı (2026-06-12, B): "Hücreye git" için tasarımın
  hücre-bazlı modeli izlendi → eksik = bell ders periyotlarındaki boş hücreler (`deriveMissingCells`).
  Mandatory/optional period ayrımı (1-6 vs 7-8) backend'de yok → Faz 1'de **tüm ders periyotları zorunlu**
  sayıldı. Kademe/müfredat period config gelince incelt. Etki: tek-kademeli/dolu çizelgeli okullarda doğru.
- 2026-06-12 · **Bloğu böl (split) backend'i yok → kapsam dışı:** Tasarım hücre menüsünde "Bloğu böl" var;
  domain'de `ClearBlock`/unblock metodu yok (yalnız `SetBlock`). Kullanıcı kararı (2026-06-12, A): Faz 1'de
  menüden çıkarıldı. Kapanış: domain `ClearBlock` + `POST .../blocks/split` (sonraki iş).
