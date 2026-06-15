# Ders Programı (Timetable) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓▓▓▓▓` %100 (Faz 2 tamam · Faz 3 Dilim-1 tamam)   ·   Status: in-progress   ·   Güncel: 2026-06-15

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
  - **Çakışma notu:** Aktif hard çakışmalar yazma anında occupancy + filtered unique index ile
    engellendiği için Hub `ConflictCount=0` gerçek bir backstop bilgisidir; stale validation
    modeli gelirse bu alan genişletilecek.
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
- **Debt-AG-1 (müsaitlik no-op):** Öğretmen müsaitliği Faz 4 girdisi — otomatik üretim müsaitliği henüz
  dikkate ALMAZ (solver boş engellenmiş-slot ile koşar); UI metni dürüst. Spec §104 ile tutarlı.
- **Debt-AG-2 (oda-tipi verisi yok):** Ders→oda-tipi eşlemesi verisi yok → her zaman ev-dersliği atanır
  (özel odalar/laboratuvar sonra).
- **Debt-AG-3 — ✅ TESLİM (debt değil):** Orijinal "tek aday" MVP'si handoff (3 puanlı aday) ile
  geçersizleşti; **borç değil, teslim edilen** olarak kaydedildi.
- **Debt-AG-4 (durum polling):** Job durumu polling ile alınır; SignalR job-push ertelendi.
- **Debt-AG-5 → Dilim-2 (çok-sınıf):** Kademe/Tümü çok-sınıf global üretim + toplu sonuçlar (bu dilimde
  UI'da disabled).
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

## ⚠️ Spec Dışına Çıkılanlar

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
