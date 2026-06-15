# Ders Programı — Çok-Taslak Modeli + Otomatik Üretim (Header Akışı) Tasarımı

**Durum:** Tasarım kararları onaylandı (brainstorming, kullanıcı onayı 2026-06-15)
**Tarih:** 2026-06-15
**İlgili bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` (bu doküman onu revize eder)
**Modül:** `timetable` (`.claude/docs/modules/timetable/`)
**Kapsam:** Faz 3 / Dilim 1 (Otomatik Üretim — tek sınıf) + program tekillik modeli revizyonu

---

## 1. Amaç & Bağlam

Otomatik Üretim (Faz 3 / Dilim 1) ilk implementasyonu, kullanıcının niyetinden iki noktada saptı:

1. **Tetikleyici yeri yanlış.** "Otomatik Oluştur" satır `⋯` menüsüne ve editör `⋯` menüsüne konmuş; tasarım handoff'unda (`.claude/design-handoffs/schedule_autogen.jsx`) **sayfa başlığında** ("Yeni Program"ın solunda) program-bağımsız bir buton olarak tanımlı.
2. **Akış modeli yanlış.** Mevcut implementasyon, autogen'i *önceden var olan* bir Taslak/Revize programa çalıştırıp adayı o programa **uyguluyor**. Doğru model: autogen **sıfırdan** üretir ve sonucu **yeni bir Taslak program** olarak kaydeder.

Doğru modeli kurmak, programın **tekillik kuralını** da revize etmeyi gerektirdi (aşağıda K1).

---

## 2. Bağlayıcı Kararlar

- **K1 — Tekillik kuralı revizyonu.** Eski kural "sınıf+dönem başına tek program" → yeni kural: **sınıf+dönem başına en fazla 1 Yayında (Published) program; yanında sınırsız Taslak/Revize program olabilir.** Bu, `ders-programi-modulu-spec.md`'deki tek-program varsayımını revize eder; `completion_status.md → ⚠️ Spec Dışına Çıkılanlar`'a kaydedilir.

- **K2 — `program-exists` reddi publish'e taşınır.** `CreateProgramCommandHandler` daima Taslak üretir; bu yüzden oradaki "herhangi program var mı" reddi **kaldırılır** ("Yeni Program" her zaman yeni bir Taslak oluşturabilir). "Yayında program var mı?" kontrolü **yayınlama anında** yaşar ve engel değil **swap-uyarısı** tetikler (K3). Son garanti: filtreli DB unique index (K4).

- **K3 — Publish-swap.** Bir Taslak yayınlanırken aynı (dönem, sınıf) için zaten Yayında bir program varsa: kullanıcıya uyarı gösterilir ("Yayındaki X yayından kaldırılıp Taslağa alınacak, bu program yayınlanacak — Devam?"). Onaylanırsa **engellenmeden** tek transaction içinde: eski Yayında program → **Taslak**, bu program → **Yayında**. Eski program **silinmez**.

- **K4 — Filtreli unique index.** DB'de `(academic_term_id, branch_id)` üzerindeki koşulsuz unique index, **filtreli** olana dönüşür: yalnız `status = Published (2)` ve `is_deleted = 0` iken benzersiz. Taslak/Revize sınırsız.

- **K5 — Autogen giriş noktası.** "Otomatik Oluştur" yalnızca **Hub başlığındaki butondan** ("Yeni Program"ın solunda) tetiklenir. Satır `⋯` menüsünden **ve** editör `⋯` menüsünden kaldırılır.

- **K6 — Autogen sıfırdan üretir, yeni Taslak yaratır.** Job bir program'a değil, bir **sınıfa (branch) + döneme** bağlıdır. Aday uygulandığında **yeni bir Taslak `ScheduleProgram`** oluşturulur (mevcut bir programa uygulanmaz).

- **K7 — Şube seçici kapsamı.** "Tek sınıf" şube seçici, aktif dönemde **görevlendirmesi olan tüm sınıfları** listeler (mevcut programı olsun ya da olmasın). Kademe/Tümü Dilim 1'de devre dışı (Dilim 2).

---

## 3. Parça A — Program Tekillik Modeli (temel)

### Domain / Persistence
- **DB index (K4):** `Infrastructure/Persistence/Configurations/ScheduleProgram*` — unique index'i filtreli yap (`HasFilter`/partial index, yalnız Published + not-deleted). Yeni EF migration (`<YYYYMMDD>_schedule_program_published_unique`).
- **`CreateProgramCommandHandler` (K2):** `program-exists` `AnyAsync` reddi kaldırılır. Çoklu taslak serbest.
- **Hub okuma modeli/UI: değişiklik yok.** `ListClassProgramsQueryHandler` zaten **program başına** bir DTO döndürüyor; tek-program kısıtı kalkınca aynı sınıf doğal olarak birden çok satır olur. Frontend `ProgramRowVM` program id ile çalışır.

### Yayınlama (swap — K3)
- **`PublishProgramCommandHandler`:** Publish'ten önce aynı (term, branch) için `Status == Published` kardeşi bul; varsa onu Draft'a indir (yeni domain davranışı; `ScheduleProgram` üzerinde bir `Unpublish()`/`RevertToDraft()` metodu gerekebilir), bunu yayınla — tek transaction.
- **`GetPublishPreviewQueryHandler` / `PublishPreviewDto`:** "yayınlanınca yayındaki X taslağa alınacak" bilgisi (replaced program adı/id) eklenir.
- **Frontend `PublishDrawer`:** Bu bilgi geldiğinde swap-uyarısı + onay adımı gösterir; onaysız yayınlamaz, ama onaylanınca engellemez.

---

## 4. Parça B — Otomatik Üretim Akışı (header'dan, sıfırdan)

### Backend
- **`EnqueueAutoGenerateCommand`:** `ProgramId` → `BranchId` (+ `AcademicYearId`, `AcademicTermId`, `Scope = Single`). "Program düzenlenebilir mi" kontrolü yerine **"sınıfın görevlendirmesi var mı"** doğrulaması (yoksa anlamlı hata). jobId döner.
- **`ScheduleGenerationJob` entity + tablo:** `program_id` → `branch_id` + `academic_term_id` (gerekirse `academic_year_id`). Migration. (Aday/hint/ağırlık/status alanları korunur.)
- **`AutoGenerateScheduleJob` (arka plan):** Girdileri **sınıfa göre** toplar: o sınıfın görevlendirmeleri, zil çizelgesi, **diğer sınıfların yayındaki** programlarının doluluğu (çakışma kaynağı), ev-dersliği. Solver 3 aday üretir; job satırına yazar. Mevcut solver çekirdeği ve metrikler korunur.
- **`ApplyAutoGenerateDraftCommand(JobId, CandidateId)`:** Mevcut programa uygulamak yerine, job'un branch+term'i için **yeni bir Taslak `ScheduleProgram` oluşturur** (`ScheduleProgram.Create` + adayın yerleşimleri), kaydeder, **yeni programId** döner. Dilim 1'de bloklar kapalı (`IsBlock: false`).
- **İzin:** `timetable.manage` (korunur).

### Frontend
- **`ScheduleHubPage` (K5):** PageHeader `actions` içine, "Yeni Program"ın **soluna** ghost `✨ Otomatik Oluştur` butonu. Program-bağımsız; her zaman görünür. `AutoGenDrawer`'ı `programId` olmadan açar (aktif dönem context'i ile).
- **`AutoGenDrawer`:** `programId` prop'u kalkar. 1. adıma **Kapsam** bölümü + **Şube seçici** (`<select>`) eklenir (handoff `schedule_autogen.jsx:174-193`). "Tek sınıf" aktif; Kademe/Tümü disabled. Şube seçici görevlendirmesi olan sınıfları listeler (K7). Üret → `enqueue(branchId, weights, strict)`. Aday "Editörde Aç" → `apply` → dönen yeni programId ile `/admin/schedule/{newId}/edit`'e git.
- **Kaldırma (K5):** `ClassProgramsTable`/`RowMenu`'den ve `EditorMoreMenu`'den "Otomatik Oluştur" girişi kaldırılır.
- **i18n:** Yeni anahtarlar (kapsam/şube seçici, publish-swap uyarısı); kaldırılan anahtarlar temizlenir.

---

## 5. Testler (TDD)

- **Backend:**
  - `CreateProgram`: aynı sınıf+dönem için ikinci Taslak artık serbest (eski "conflict" testi güncellenir/kaldırılır).
  - `PublishProgram`: Yayında kardeş varken yayınlama → eski Published → Draft, bu → Published (swap); kardeş yokken normal yayın.
  - `EnqueueAutoGenerate`: branch bazlı; görevlendirmesi olmayan sınıf → hata; geçerli sınıf → Queued job.
  - `ApplyAutoGenerateDraft`: aday → **yeni** Taslak program oluşur (yeni id), yerleşimler dolu.
  - `AutoGenerateScheduleJob` entegrasyon: branch+term girdileriyle Done + adaylar.
  - Filtreli unique index: iki Published engellenir; çok Taslak serbest (entegrasyon).
- **Frontend:**
  - `AutoGenDrawer`: şube seçici render + "Tek sınıf" aktif/Kademe-Tümü disabled; enqueue branchId ile çağrılır; apply→navigate(yeni id).
  - Header butonu Hub'da render + tıklama drawer açar; satır/editör menüsünde autogen YOK.
  - `PublishDrawer`: swap-uyarısı görünür ve onayla yayınlar.

---

## 6. Doküman Etkileri

- `ders-programi-modulu-spec.md`: K1 (tekillik), K5/K6 (autogen girişi) revizyonu.
- `modules/timetable/`: `domain-model.md`, `database-schema.md` (filtreli index + job tablosu), `api-contracts.md` (enqueue/apply/publish-preview), `business-rules.md` (publish-swap, tekillik), `ui-flows.md` (header akışı), `completion_status.md` (`⚠️ Spec Dışına Çıkılanlar` kaydı + ilerleme).
- Mevcut test rehberi `OKSIS-Faz3-Otomatik-Uretim-Test-Rehberi.docx` **eskir** (satır-menüsü + program-bazlı akış anlatıyor) — yeni akışa göre yeniden üretilmeli.

---

## 6.5. Revizyon — Rezervasyon Modeli (2026-06-15, brainstorming devamı)

Implementasyon sırasında (Parça A code-review + kullanıcı netleştirmesi) yerleşim-seviyesi
çakışma değişmezlerinin çok-taslak modeliyle çeliştiği görüldü. `LessonPlacementConfiguration.cs`
üç **program-bağımsız** benzersiz index tutuyor (yalnız `is_active=1 AND is_deleted=0`):
`ux_placement_teacher_slot`, `ux_placement_room_slot`, `ux_placement_class_slot`. Bu hâliyle bir
sınıfın iki dolu programı (Yayında + Taslak) aynı anda var olamaz. Aşağıdaki kararlar bunu çözer.

- **K8 — Rezervasyon kapsamı.** Öğretmen/derslik/sınıf-slot tekilliği yalnız **"rezerve eden"**
  yerleşimlere uygulanır: sahibi programın `Status ∈ {Published, Revising}` olduğu yerleşimler.
  **Taslaklar rezerve etmez** ve serbestçe çakışabilir. Mekanizma: `LessonPlacement`'a denormalize
  bir `IsReserving` bayrağı (mevcut `school_id/term/branch` denormalizasyon desenini izler);
  program rezerve-eden duruma girince/çıkınca aggregate içinde senkronlanır. Üç index'in filtresi
  `is_active=1 AND is_deleted=0 AND is_reserving=1` olur.
  - Kural (kullanıcı): "Bir taslak kendi sınıfının yayındaki programıyla çakışmaz; yalnız **diğer
    sınıfların** canlı (Yayında/Revize) programlarıyla çakışır." Çünkü yayınlanınca swap eski canlıyı
    devre dışı bırakıp kaynağını boşaltır (ör. Yayında 9-A Pzt-1 A205/Ahmet Dinç ↔ Taslak 9-A Pzt-1
    A205/Ayşe Temiz: çakışma değildir).

- **K9 — Tek canlı program / sınıf.** Program-seviyesi unique index'i (K4) `status = Published`
  yerine **`status ∈ {Revising, Published}`** (yani `status >= 1`) ile filtrelenir: bir sınıf+dönemde
  en fazla bir canlı (Yayında *veya* Revize) program; sınırsız Taslak. (K4'ü revize eder — A1 zaten
  commit'lendiği için yeni migration ile genişletilir.)

- **K10 — Swap canlı kardeşi indirir.** Publish-swap (K3) mevcut **canlı** kardeşi (Yayında *veya*
  Revize) Taslağa indirir — yalnız Yayında değil. `PublishProgramCommandHandler` (A4) ve
  `GetPublishPreviewQueryHandler` (A5) kardeş predicate'i `Status ∈ {Published, Revising}` olur.

- **K11 — Düzenleyince Revize.** Yayındaki bir programa yapılan **ilk değişiklik kaydedilince**
  program `Published → Revising`'e geçer (salt görüntüleme Revize yapmaz). Canlı yayın snapshot'ı
  (`ScheduleVersion`) swap'e/yeniden-yayına kadar tüketicilere bozulmadan kalır. Rezervasyon
  değişmez (her ikisi de rezerve eder); yalnız düzenleme komutları (Move/Place/Remove/AssignTeacher/
  AssignRoom/SetBlock) bir Published programda çalışınca durumu Revising'e çevirir.
  - "Revize'ye geçiş" başka hiçbir yerde tetiklenmiyordu; mevcut tek tetik `RestoreScheduleVersion`
    (sürüm geri yükleme → `RestoreFrom` → Revising). K11 ikinci tetiği ekler.

- **K12 — Müsaitlik/doluluk ön-kontrolü.** Editör (`GetExternalOccupancy`) ve autogen solver girdisi
  (B3) için "dolu" sayılan = **diğer şubelerin rezerve eden** (Yayında/Revize) yerleşimleri
  (`IsReserving=1 AND BranchId != X`). Kendi sınıfının canlı programı hariç tutulur (swap onu
  boşaltacak).

## 7. Sıralama & Kapsam Dışı

**Sıralama:** (1) Parça A (model + publish-swap) → (2) Parça B (autogen header akışı; A'ya bağlı).

**Kapsam dışı (Dilim 2 / Faz 4):** Kademe & Tümü kapsamı; öğretmen müsaitliği girdisi; Hub'da grup/expand görünümü (program-başına düz satır yeterli).
