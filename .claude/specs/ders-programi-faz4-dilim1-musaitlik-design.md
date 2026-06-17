# Ders Programı — Öğretmen Müsaitlik & Tercih (Faz 4 / Dilim 1) Tasarımı

**Durum:** Tasarım kararları onaylandı (brainstorming, kullanıcı onayı 2026-06-17)
**Tarih:** 2026-06-17
**İlgili bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` (Faz yol haritası §1, Faz 4; hard-block kuralı §3.4)
**Önceki faz:** `.claude/specs/ders-programi-cok-sinif-otomatik-uretim-design.md` (Faz 3 / Dilim 2 — tamam)
**Modül:** `timetable` (`.claude/docs/modules/timetable/`)
**Kapsam:** Faz 4 / Dilim 1 — Öğretmen müsaitlik (hard) & tercih (soft) akışı (`schedule_avail`)
**Tasarım handoff'u:** `.claude/design-handoffs/schedule_avail/` (README + source + 4 screenshot)

---

## 1. Amaç & Bağlam

Faz 1-3 sınıf programının elle ve otomatik üretimini teslim etti. Otomatik üretimde öğretmen
müsaitliği **bilinçli olarak no-op** bırakılmıştı (Debt-AG-1): `IAvailabilityProvider`'ın tek
gerçeklemesi `NoopAvailabilityProvider`'dı, hiçbir slot engellenmiyordu. Bağlayıcı spec §3.4
müsaitliği **katı (engelleyici)** bir kural olarak listeler ("Müsaitlik (hard-block — Faz 4 girdisi,
Faz 1'de no-op)").

Dilim 1 bu girdiyi gerçek hâle getirir ve iki yola ayırır:

- **Hard yol (Müsait Değil):** Öğretmenin "müsait değil" işaretlediği slotlar otomatik üretimde
  **kesin engel**; editörde yerleştirme **bloklanır** (admin bilinçli **override** edebilir).
- **Soft yol (Tercih Etmez):** Öğretmenin "tercih etmediği" slotlar **engel değildir**; otomatik
  üretimde bir **ağırlık** olarak cezalandırılır, editörde **sarı uyarı** gösterilir.

Veri kaynağı yeni bir admin ekranıdır (`schedule_avail.jsx` · `AvailabilityScreen`): admin bir
öğretmen seçer, haftalık ızgarada her hücreyi üç durumdan biriyle işaretler, kaydeder.

---

## 2. Bağlayıcı Kararlar (kullanıcı onaylı — 2026-06-17)

- **K-D1-1 — Üç durumlu model.** `AvailabilityStatus` = **Available / PrefersNot / Unavailable**.
  Available varsayılandır (depolanmaz). PrefersNot soft, Unavailable hard. (Spec §2'deki "enum değeri
  tanımlanır ama yalnız bir kısmı egzersiz edilir" deseninin aksine, üç değer de **şimdi** egzersiz
  edilir — kullanıcı 2026-06-17'de soft yolu erteleme kararını geri aldı.)

- **K-D1-2 — Veri sahipliği: Admin.** Müsaitlik/tercih verisini **admin** girer (öğretmen self-servis
  Dilim 1 kapsamı dışı). İzinler mevcut setten (spec §195 "timetable izinleri mevcut — değişmez";
  yeni izin eklenmez): müsaitlik ekranı/CRUD + normal yerleştirme **`timetable.manage`**; hard-block
  **override** ise ayrı **`timetable.override`** ister (K-D1-4, kullanıcı onayı 2026-06-17).

- **K-D1-3 — Yaklaşım A: uygulama-katmanı kuralı.** Müsaitlik tablosu **kaynağın doğrusudur**;
  hard-block solver'da ve komut handler'larında uygulanır. Redis doluluk indeksine **katlanmaz**
  (occupancy yalnız fiili yerleşim çakışmasını izler; müsaitlik ayrı bir kısıt katmanıdır).

- **K-D1-4 — Hard-block + admin override.** "Müsait Değil" slota editörde yerleştirme bloklanır;
  komutlar **`allowUnavailable`** flag'iyle override'a izin verir (mevcut `allowMissingHours` deseninin
  ikizi). **Override yalnız `timetable.override` izniyle yapılabilir** (spec §195'teki mevcut izin
  amacına bağlanır); `allowUnavailable=true` gelen istek bu izni taşımıyorsa Authorization behavior
  reddeder. Override edilen hücre türetilmiş görsel rozet alır (DB'de ayrı flag yok — yerleşimin slot'u
  ile müsaitlik tablosu kesişiminden türetilir).

- **K-D1-5 — Müsaitlik ihlali yayını ENGELLEMEZ.** Yayın kapısı **değişmez**: yalnız açık çakışma
  (engel) + eksik saat (uyarı) kapıyı yönetir. Müsaitlik ihlali admin'in bilinçli override'ıdır;
  yayını durdurmaz, yalnız editör/Hub'da görünür kalır. (Handoff README ile teyitli.)

- **K-D1-6 — Mevcut conflict-handling: ileriye dönük + uyarı.** Müsaitlik kaydı değiştiğinde, o slota
  zaten yerleşmiş dersler **silinmez/taşınmaz**; ihlal **uyarı** olarak yüzeye çıkar (editör Doğrula
  paneli + Hub rozeti). Geçmişi bozmadan ileriye dönük uygulama.

- **K-D1-7 — Denormalize ihlal sayacı.** Hub'da `schedule_programs.availability_violation_count`
  denormalize kolonu; mevcut `IScheduleProgramStatsRecomputer` deseniyle (Faz 3,
  `conflict_count`/`missing_hours` ile aynı). Müsaitlik kaydı değişince, o dönemde ilgili öğretmeni
  içeren **canlı programlar** yeniden hesaplanır.

- **K-D1-8 — Debt-AG-1 kapanır.** `NoopAvailabilityProvider` kaldırılır; gerçek DB-okuyan
  `TeacherAvailabilityProvider` devreye girer. Solver sözleşmesi (`SolveInput.TeacherBlockedSlots`,
  `IAvailabilityProvider.GetBlockedSlotsAsync`) **zaten uçtan uca bağlı** — yalnız provider gerçeklenir.

---

## 3. Domain & Persistence

### 3.1 Aggregate
Yeni `TeacherAvailability` aggregate root (`Oksis.Domain`, Timetable):

```
TeacherAvailability (aggregate root)
  TeacherAvailabilityId  (record struct, Guid)
  SchoolId               (IHasTenant)
  AcademicYearId
  AcademicTermId
  TeacherId
  IReadOnlyList<AvailabilitySlot> Slots

AvailabilitySlot (value object / owned)
  DayOfWeek Day
  int       Period
  AvailabilityStatus Status   // PrefersNot | Unavailable (Available depolanmaz)

enum AvailabilityStatus { Available = 0, PrefersNot = 1, Unavailable = 2 }
```

- Private setter'lar; mutasyon davranışsal metotlarla (`SetSlot`, `ClearSlot`, `BulkSet`,
  `CopyDay`, `CopyFromTerm`).
- Strongly-typed ID, domain saflığı (EF Core / DataAnnotations yok).

### 3.2 Tablolar (`[academic]` şeması)
- **`teacher_availabilities`** — `(id, school_id, academic_year_id, academic_term_id, teacher_id, ...)`.
- **`teacher_availability_slots`** — `(id, teacher_availability_id, school_id, teacher_id, day_of_week, period, status)`.
  - **Seyrek depolama:** yalnız `PrefersNot`/`Unavailable` satırı yazılır; satır yokluğu = `Available`.
  - `teacher_id` slot'a **denormalize** (provider sorgusu öğretmen-bazlı, join'siz okusun).
  - **Unique index:** `(school_id, academic_term_id, teacher_id, day_of_week, period)` — slot tekilliği.
- **Migration:** `20260617_add_teacher_availabilities`.

### 3.3 Tenancy
`IHasTenant` → EF global query filter + `TenantSaveChangesInterceptor` `SchoolId`'i otomatik doldurur,
cross-tenant değişikliği reddeder, `SchoolId`'i değişmez yapar. (Standart; özel iş yok.)

---

## 4. Solver (Hard + Soft)

### 4.1 Hard yol — provider gerçeklemesi (Debt-AG-1 kapanır)
- `NoopAvailabilityProvider` **kaldırılır**; yeni **`TeacherAvailabilityProvider : IAvailabilityProvider`**
  (`Oksis.Infrastructure`) `IApplicationDbContext` üzerinden `teacher_availability_slots`'tan
  `Status == Unavailable` slotlarını okur ve `GetBlockedSlotsAsync(schoolId, termId, teacherIds, ct)`
  ile `Dictionary<Guid TeacherId, IReadOnlySet<TimeSlot>>` döndürür.
- Solver çekirdeği **değişmez** — `SolveInput.TeacherBlockedSlots` zaten greedy'de hard-block olarak
  tüketiliyor (Faz 3 sözleşmesi).

### 4.2 Soft yol — yeni scorer bileşeni
- **`SolverWeights.RespectTeacherPreference`** (yeni alan, `WeightLevel`, **default Mid**).
- **`SolveInput.TeacherDislikedSlots`** (yeni; `Status == PrefersNot` slotları) — provider'dan beslenir
  (hard ile aynı sorguda iki kümeyi ayırarak döndürür).
- **`CandidateScorer`** (`schedule` solver) yeni bir bileşen ekler: **tercih-ihlali oranı** =
  (tercih-edilmeyen slota düşen yerleşim sayısı) / (toplam yerleşim). Bu oranın tümleyeni
  (`1 - ratio`) `weightedSum`'a `Weight(RespectTeacherPreference)` ağırlığıyla katılır; `totalWeight`
  paydası da artar. `PreferencePercent` böylece tercih bileşenini de yansıtır. (Mevcut bileşenler:
  `MorningHardSubjects`, `MinimizeGaps`, `DailyBalance` — `Weight(level) = (int)level + 1`.)
- **Determinizm korunur** — yeni bileşen de saf/deterministik.

### 4.3 Autogen wizard
- `AutoGenDrawer` Aşama-1 "Optimizasyon tercihleri" listesine yeni satır (handoff: `schedule_autogen.jsx`,
  `w.tercih` state, satır "boş saatini azalt"ın hemen altında):
  - Etiket **"Öğretmen tercihlerine uy"**, alt-açıklama "Öğretmenin tercih etmediği saatlerden kaçınır",
    seçim **düşük/orta/yüksek** (varsayılan **orta**).
- Seçim job payload'una `RespectTeacherPreference` olarak geçer.
- i18n: `timetable.autogen.weights.respectTeacherPreference.{label,desc}` (tr/en).

---

## 5. Editör Entegrasyonu

Handoff: `schedule_editor.jsx` (`SED_TEACHER_AVAIL`, `AvailOverrideModal`, `avail-prefer`, `av-badge`,
`drop-warn`, Doğrula paneli "Müsaitlik ihlali").

- **Precheck (sürükleme/hedef hücre):** Unavailable → kırmızı `drop-bad` + sebep "teacher-unavailable";
  PrefersNot → sarı `drop-warn` (bırakılabilir, uyarı); Available → yeşil `drop-ok`.
- **Hard-block + override:** "Müsait Değil" slota bırakışta **`AvailOverrideModal`** (danger onay:
  "Vazgeç" / "Yine de yerleştir"). Onaylanırsa komut **`allowUnavailable=true`** ile çağrılır.
  Komutlar: `PlaceLesson`, `MoveLesson`, `AssignTeacher` (mevcut `allowMissingHours` deseninin ikizi).
  **`allowUnavailable=true` yolu `timetable.override` izni ister** (K-D1-4); izin yoksa sunucu reddeder,
  FE'de override butonu/diyaloğu yetkisiz admine gösterilmez (UX gate).
- **Override rozeti:** override edilmiş hücre köşesinde `av-badge` (`alert-triangle`), tooltip
  "Müsaitlik aşılarak yerleştirildi". (Türetilmiş; DB flag'i yok.)
- **Tercih Etmez uyarısı:** `avail-prefer` sarı kenar, tooltip "Öğretmen bu saati tercih etmiyor"
  (engel değil).
- **Doğrula paneli:** yeni "Müsaitlik ihlali" satır tipi — kırmızı (override, engelleyici) / sarı
  (tercih, yumuşak) ayrımı + "Hücreye git". Alt çubuk lejantına "Tercih edilmez" (sarı); özet pill'lerine
  amber "N müsaitlik ihlali".
- **Yeni query:** `GetTermTeacherAvailability(termId)` → editör tüm öğretmenlerin müsaitlik/tercih
  haritasını tek seferde alır (React Query, tenant-prefixed key).
- **Yayın kapısı değişmez** (K-D1-5).

---

## 6. Admin Ekranı (`schedule_avail.jsx`)

Handoff: `schedule_avail.jsx · AvailabilityScreen`, `01-availability-main.png`.

- **PageTop:** breadcrumb "Akademik › Ders Programı › Öğretmen Müsaitliği", başlık "Öğretmen Müsaitliği
  & Tercihleri", dönem seçici + "Toplu İçe Aktar" (ghost).
- **Sol:** öğretmen arama + branş çipleri (`ACA_BRANCHES`), liste satırı (avatar + ad + branş + durum
  rozeti "Tanımlı"/"—"), seçili vurgulu.
- **Sağ:** başlık şeridi (ad + branş + dönem + "N müsait değil / N tercih etmez" sayaçları + kayıt
  durumu "Güncel/Kaydedilmemiş/Kaydediliyor/Kaydedildi" + **Kaydet** primary, yalnız dirty iken aktif).
  Haftalık ızgara (1.–8. ders × Pzt-Cum; teneffüs/öğle ayraçları), hücre tıkla → 3-durum döngü
  (Müsait → Tercih Etmez → Müsait Değil → Müsait), lejant, toplu işlemler ("Tüm haftayı Müsait yap",
  gün başlığı doldur, "Başka güne kopyala", "Önceki dönemden kopyala").
- **Durum varyantları:** yükleniyor (skeleton) / boş (zil programı yok) / hata / öğretmen seçilmemiş.
- **State:** server state React Query (tenant-prefixed); ızgara yerel etkileşimi tamponlu (dirty),
  Kaydet ile PUT.
- i18n: `timetable.availability.*` (tr/en).

---

## 7. Hub

Handoff: `schedule.jsx` (`SchAvail`, `avail` kolonu).

- **Denormalize kolon:** `schedule_programs.availability_violation_count` (migration ile);
  `IScheduleProgramStatsRecomputer` hesaplar (mevcut `conflict_count`/`missing_hours` ile aynı yol).
- **Ek tetik:** müsaitlik kaydı (`PUT availability`) işlendiğinde, o dönemde ilgili öğretmeni içeren
  **canlı** `ScheduleProgram`'lar için recompute tetiklenir (Hangfire job ya da senkron, mevcut
  recompute giriş noktasıyla tutarlı).
- **UI:** Sınıf Programları tablosunda "Müsaitlik" sütunu + `SchAvail` rozeti ("Müsaitlik ihlali: N",
  amber; N=0 → nötr zero). Özet şeridine tıklanır "Müsaitlik ihlali" hızlı filtresi (amber).

---

## 8. API

Müsaitlik uçları `timetable.manage` izniyle, sunucu-tarafı yetki zorunlu (MediatR Authorization behavior).
Editör yerleştirme komutları `timetable.manage`; **`allowUnavailable=true` ek olarak `timetable.override`**
ister (K-D1-4).

| Uç | İzin | İşlev |
|---|---|---|
| `GET  /api/v1/timetable/availability/teachers/{teacherId}?termId=...` | `timetable.manage` | Öğretmenin dönem müsaitlik ızgarası |
| `PUT  /api/v1/timetable/availability/teachers/{teacherId}` | `timetable.manage` | Kaydet (termId + slot+status listesi; seyrek, yalnız non-Available) |
| `GET  /api/v1/timetable/availability?termId=...` | `timetable.manage` | Dönemdeki tüm öğretmenlerin haritası (`GetTermTeacherAvailability`) |
| `POST/PUT .../placements` `allowUnavailable=true` | `timetable.manage` + `timetable.override` | "Müsait Değil" slota override yerleştirme |

- CQRS: `GetTeacherAvailabilityQuery`, `GetTermTeacherAvailabilityQuery`, `SaveTeacherAvailabilityCommand`.
- `SaveTeacherAvailabilityCommand` handler: upsert (seyrek), recompute tetiği (§7), tenant interceptor.
- Mapster DTO eşleme; FluentValidation (term/teacher var mı, period zil programı sınırında mı).

---

## 9. i18n

- `timetable.availability.*` — admin ekranı (başlık, durumlar, toplu işlemler, durum varyantları).
- `timetable.autogen.weights.respectTeacherPreference.{label,desc}` — wizard satırı.
- `timetable.editor.availability.*` — override diyalog, rozet tooltip, "Tercih edilmez" lejant,
  Doğrula "Müsaitlik ihlali".
- tr + en; hardcoded Türkçe yok.

---

## 10. Test (TDD)

- **Domain:** `AvailabilityStatus` davranışı, slot upsert/clear/copy, seyrek depolama değişmezleri.
- **Provider (Infrastructure integ):** `TeacherAvailabilityProvider` yalnız `Unavailable`'ı hard,
  `PrefersNot`'u disliked olarak döndürür; tenant izolasyonu.
- **Solver:** scorer tercih bileşeni — disliked slota yerleşim `PreferencePercent`'i düşürür; ağırlık
  düşük/orta/yüksek etkisi; determinizm.
- **Command:** `allowUnavailable=false` → hard slota yerleştirme reddedilir; `=true` → kabul + override
  türetimi. Recompute tetiği canlı programları günceller.
- **API:** yetki (`timetable.manage`), upsert seyrekliği, validation.

---

## 11. Süregelen / Yeni Debt

- **Debt-AG-1 → KAPANIR** (provider gerçeklendi).
- **Öğretmen self-servis** müsaitlik girişi: Dilim 1 kapsamı **dışı** (yalnız admin). İleride ayrı dilim.
- **Toplu İçe Aktar** (handoff'taki "Toplu İçe Aktar" butonu): UI mevcut; backend içe-aktarma **Debt-D1-1**
  olarak ertelenir (MVP: buton görünür, akış sonraki dilim) — *kullanıcı onayına bağlı; planda netleşir.*
- Blok üretimi (Debt-AG-8) ve diğer Faz 3 borçları bu dilimde dokunulmaz.

---

## 12. Kabul Kriterleri (D1 "bitti" tanımı)

**Domain & Persistence** — Aggregate + slot value object + enum; iki tablo (`[academic]`), seyrek
depolama, unique index, migration uygulanır; tenant izolasyonu çalışır.

**Solver** — `TeacherAvailabilityProvider` hard (`Unavailable`) + soft (`PrefersNot`) döndürür
(Debt-AG-1 kapanır); `SolverWeights.RespectTeacherPreference` + `SolveInput.TeacherDislikedSlots` +
scorer bileşeni; wizard satırı job'a geçer; i18n tr/en.

**Editör** — Hard-block + `allowUnavailable` override (3 komut, **override `timetable.override` ister**);
override rozeti; "Tercih Etmez" sarı; Doğrula "Müsaitlik ihlali" + "Hücreye git"; yayın kapısı değişmez.

**Hub & API** — `availability_violation_count` denormalize + recompute hook + müsaitlik-değişti tetiği;
`SchAvail` rozeti + özet filtre; `GET/PUT availability` + `GetTermTeacherAvailability` (`timetable.manage`);
override yolu `timetable.override`; hepsi sunucu yetki.

**Test** — Provider hard-block, scorer tercih bileşeni, command override, recompute tetiği için
birim/entegrasyon testleri yeşil.

**Docs** — `completion_status.md` (Debt-AG-1 kapandı, D1 ✅); `business-rules.md` + `permissions.md` +
`database-schema.md` + `api-contracts.md` işlenir.

---

## 13. Referanslar

- Bağlayıcı spec: `.claude/specs/ders-programi-modulu-spec.md` (§1 Faz 4, §3.4 hard-block, §8 izinler)
- Handoff: `.claude/design-handoffs/schedule_avail/` (README + source + screenshots)
- Solver sözleşmesi: `Oksis.Application/Modules/Timetable/AutoGenerate/Solver/SolverContracts.cs`,
  `CandidateScorer.cs`, `Ports/IAvailabilityProvider.cs`
- Önceki faz tasarımı: `.claude/specs/ders-programi-cok-sinif-otomatik-uretim-design.md`
