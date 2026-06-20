# Gün Konvansiyonu — System.DayOfWeek Hizalaması — Uygulama Planı

> Tasarım: `gun-konvansiyonu-system-dayofweek-hizalama-design.md` (K-GUN-1..8). Yürütme: fazlı, TDD + subagent review (2c deseni). Commit'ler kullanıcı onayıyla.

**Hedef:** Tüm program/nöbet gün değerleri 0-tabanlı (Pzt=0) → gerçek `System.DayOfWeek` (Pzt=1..Cum=5). Kod + DB veri migration (snapshot JSON dahil) + FE. Off-by-one yapısal olarak biter.

**Atomiklik (K-GUN-8):** Tüm fazlar tek branch'te (`dersprog`) ardışık; yarıda bırakılırsa veri+kod tutarsız. Migration en sona yakın ama kod-öncesi seed'lerle test edilir.

---

## Faz 0 — Kök-neden testleri (RED kanıtı)
Mevcut off-by-one'ı kanıtlayan başarısız testler (fix öncesi RED, hizalama sonrası GREEN):
- **Domain:** `ScheduleException.Create(date=gerçek Pazartesi, day=Monday)` → bugün **fırlatıyor**; hizalama sonrası **fırlatmamalı**. (`ScheduleExceptionTests` — gerçek Pzt tarihi + `DayOfWeek.Monday` placement.)
- **Application/Integration:** "Pazartesi 'bugün'" → Pazartesi derslerini döndürür (şu an boş/kaymış); vekâlet board Pazartesi doğru.
Bu testler hizalamanın doğruluk kapısı.

---

## Faz 1 — Backend değer/cast/kesişim
**Prensip:** Tip (`DayOfWeek`) değişmiyor; **anlam** 0-tabanlı→System. Kod çoğunlukla zaten `(DayOfWeek)x` / `date.DayOfWeek` — hizalama sonrası bu kodlar **doğal doğru**. Asıl değişen: FE'nin gönderdiği değer (Faz 3) + DB verisi (Faz 2) + validasyonlar.

- **Validasyon (hafta içi):** `(DayOfWeek)request.Day` cast sahaları (13) artık 1–5 beklemeli; <1 veya >5 (ve 0=Pazar, 6=Cmt) reddedilmeli. PlaceLesson/MoveLesson/PreCheck/SaveTeacherAvailability/GetAvailableTeachers (timetable) + SaveDutyRosterDraft/ApplyAutoDistributeDuty/GetAvailableRelievers/GetAvailableSubstitutes (duties). Mevcut validatorlara gün aralığı kuralı ekle/güncelle.
- **Kesişim siteleri (sadeleşir, doğrulukla):** `ScheduleException.cs:83`, `ScheduleExceptionPlanner.cs:~76`, `PublishedScheduleQueryHandler.cs:620/340` (`(int)dateTime.DayOfWeek` artık doğru — `days` sabit dizisi `[1..5]` ile tutarlı, doğrula), `GetTodaysSubstitutionBoard`, `GetAvailableSubstitutes`. Kod değişikliği genelde YOK; Faz 0 testleri GREEN olur.
- **Solver (K-GUN-6):** `AutoDistributeDutyJob.WorkingDays` → `[DayOfWeek.Monday..Friday]`; `AutoGenerateScheduleJob.BuildWeekGrid` döngüsü `1..5` (Monday..Friday) + yorum güncelle; `9d74f5b` 0-tabanlı yaklaşımı kaldırılır; `AutoDistributeDutyJobConventionTests` 1-5 bekleyecek şekilde güncelle.
- **EF config:** dokunulmaz (`HasConversion<int>()`, tip aynı).
- **Domain testleri:** `DayOfWeek.Monday` (=1) kullananlar artık **gerçek-doğru**; çoğu değişmez. 0-tabanlı sayısal varsayan (ör. `(DayOfWeek)0`=Monday sayan) testler düzeltilir.

**Kapı:** `dotnet build` temiz; Faz 0 domain testleri GREEN; tüm BE suite yeşil.

---

## Faz 2 — DB veri migration (+1) — EN HASSAS
Yeni EF migration (`<ts>_align_day_to_system_dayofweek`). `migrationBuilder.Sql(...)` ile, **idempotent** (yalnız 0–4 aralığını +1'le; tekrar koşmada 1–5 dokunma).

- **Düz kolonlar (+1):**
  - `[academic].lesson_placements.day`
  - `[academic].duty_assignments.day_of_week`
  - `[academic].schedule_exceptions.day`
  - `[academic].teacher_availability_slots.day_of_week`
  - Güvenli T-SQL: `UPDATE ... SET col = col + 1 WHERE col BETWEEN 0 AND 4 AND is_deleted=0` (idempotency: <5 kontrolü; ama tekrar koşma riskine karşı migration zaten bir kez uygulanır — yine de aralık guard'ı koy).
- **Snapshot JSON (`schedule_versions.snapshot_json`):** `$.placements[*].day` her eleman +1. **Kod-tabanlı** yaklaşım (kırılgan T-SQL JSON dizi-iterasyonu yerine): migration içinde ham SQL ile satırları çek → C# tarafında `ScheduleSnapshotSerializer` ile deserialize → her placement `Day+1` → serialize → `UPDATE`. (Migration'ın `Up` gövdesinde `IServiceProvider`/context erişimi sınırlı olduğundan: ya migration'da raw ADO ile döngü, ya da ayrı bir idempotent `IHostedService`/startup one-off runner. Tercih: migration + raw `SqlConnection` döngüsü, serializer'ı çağırarak. Implementasyonda netleştir.)
  - **Idempotency işareti:** migration uygulandı bayrağı (EF migration history zaten bir kez uygular); ayrıca snapshot için "zaten 1–5 mi" guard (ilk placement.day ≥1 ise atla) — çift-uygulamaya karşı.
- **`Down()`:** −1 (aynı dikkatle, düz kolon + snapshot).
- **Integration testi:** seed (0-tabanlı placement + 0-tabanlı snapshot) → migration mantığını çağır → assert (1-tabanlı). Snapshot round-trip doğrulaması.

**Kapı:** migration tek tablo-grubu + snapshot'ı dönüştürür, başka model drift yok; integration yeşil.

---

## Faz 3 — Frontend (System değerleri)
- **Sabitler → `[1,2,3,4,5]`:** `EDITOR_DAYS` (`editor/hooks/useEditorData.ts`), `DUTY_DAYS` (`duties/hooks/useDutyContext.ts`), `WEEK_DAYS` (`teacher/duties/components/DutyWeek.tsx`), `AVAILABILITY_DAYS` (`availability/TeacherAvailabilityPage.tsx`).
- **i18n gün dizisi indekslemesi (EN RİSKLİ):** `dayShort[day]`/`dayLong[day]` şu an 0-tabanlı (short[0]=Pzt). 1-tabanlıda kayar. **Karar:** indekslemeyi `dayShort[day-1]` yap (dizileri değiştirme — basit, lokalize) — DutyGrid (46-47, 85-86), DutyWeek (35-36, 68-69), ve diğer indeksleyen yerler. (Alternatif: diziye [0]'a placeholder; ama `[day-1]` daha az sürpriz.) **Her indeksleme sahasını tek tek düzelt + test.**
- **`getDay` eşlemesi:** `useDutyContext` `today = jsDay>=1&&jsDay<=5 ? jsDay-1 : null` → `jsDay` (JS getDay Pzt=1 zaten System ile aynı). "today" vurgusu artık doğru.
- **Request builder'lar:** caller'lar gün değerini grid'den alır; grid artık 1–5 ürettiği için çoğu otomatik düzelir — ama `editorDerive`/cell→day map'leri ve `slotKey(s.day,...)` gibi yerleri doğrula.
- **Tipler/yorumlar:** `AvailabilitySlotDto.day` yorumu (`0=Pzt..4=Cum`) → `1=Pzt..5=Cum`; benzer yorumlar.
- **Tüketici:** `PublishedScheduleView.tsx` (l.day cell key + day map) — BE artık 1–5 gönderdiği için tutarlı; grid kolon başlıkları `weekly.days` (BE'den) ile gelir, doğrula.
- **Testler:** `editorDerive.test.ts` `day:0`→`day:1`; duty testlerindeki gün hardcode'ları grep'le + güncelle; `dayShort[day-1]` değişiminin testleri.

**Kapı:** `npm run build` temiz; tam vitest yeşil; "today" + grid + editör manuel smoke.

---

## Faz 4 — Doküman + revert kaydı
- `ders-programi-modulu-spec.md` §106'ya not: gün artık gerçek System.DayOfWeek (0-tabanlı hack kaldırıldı, hizalandı).
- `completion_status.md` (timetable) + duties: hizalama girdisi + `9d74f5b` 0-tabanlı fix'inin bu migration'la yerini aldığı notu.
- `business-rules.md`: gün konvansiyonu BR'si (System.DayOfWeek, hafta içi 1–5).

---

## Risk Özeti
- **Snapshot migration** (Faz 2) en kırılgan → kod-tabanlı + idempotency guard + integration test.
- **i18n `[day-1]` indeksleme** (Faz 3) en kolay yeni-off-by-one kaynağı → her saha tek tek + test.
- **Atomiklik:** fazlar birlikte teslim; yarı-deploy yok.
- **Geri-alma:** migration `Down()` −1.

## Yürütme Sırası
Faz 0 (RED) → Faz 1 (BE GREEN) → Faz 2 (migration + integration) → Faz 3 (FE) → Faz 4 (docs). Her faz subagent + review; commit'ler kullanıcı onayıyla.
