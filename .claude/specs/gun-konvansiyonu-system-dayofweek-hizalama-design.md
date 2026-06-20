# Gün Konvansiyonu — System.DayOfWeek Hizalaması (Timetable + Duties) Tasarımı

**Durum:** Faz 0–3 tamamlandı (2026-06-20) — BE solver flip + DB migration (+1 incl. snapshot JSON) + FE flip (~20 dosya) uygulandı; uncommitted, final doğrulama + commit bekliyor. Faz 4 (doküman) tamamlandı. BE 1–5 giriş validasyon hardening ertelendi (Debt-GUN-1).
**Tarih:** 2026-06-20
**İlgili bağlayıcı spec:** `.claude/specs/ders-programi-modulu-spec.md` (§106 `TimeSlot = (DayOfWeek Day, int Period)`). **Bu hizalama spec ile ÇELİŞMEZ** — spec zaten `DayOfWeek` der; mevcut 0-tabanlı hack spec'in asıl niyetinden sapmıştı, bu iş onu geri getirir (Rule #6 sorunu yok).
**Kapsam:** Cross-module — `timetable` + `Duties` (oksis-api) + oksis-web + DB veri migration'ı.

> `.claude/specs/` altında → **bağlayıcı anlaşma** (CLAUDE.md Absolute Rule #6). Numaralı kararlar `K-GUN-*`.

---

## 0. Sorun (doğrulanmış kök neden)

Kod tabanı bugün günü **0-tabanlı** (Pazartesi=0 … Cuma=4) saklıyor ama `System.DayOfWeek` (Pazar=0, Pazartesi=1 … Cumartesi=6) tipinde tutuyor — `(DayOfWeek)request.Day` cast'i ile. FE 0-tabanlı gönderiyor (`EDITOR_DAYS=[0..4]`, `DUTY_DAYS=[0..4]`). Editör/ızgara/yazma-okuma yolu **kendi içinde tutarlı** olduğu için çalışıyor; ama **gerçek tarih devreye girince** (gerçek `date.DayOfWeek` = Pazartesi=1) 0-tabanlı saklı `Day`=0 ile karşılaştırılıp **off-by-one** üretiyor:

- `ScheduleException.cs:83` INV-E2 `date.DayOfWeek != day` → Pazartesi istisnası **hiç oluşturulamaz**.
- `ScheduleExceptionPlanner.cs:~76` aynı.
- `PublishedScheduleQueryHandler.cs:620/340` "bugün" `(int)dateTime.DayOfWeek` → bir gün kaymış / boş "bugünün dersleri".
- (Duty) `GetTodaysSubstitutionBoard` / `GetAvailableSubstitutes` aynı sınıf.

**Doğrulama (2026-06-20):** FE `EDITOR_DAYS=[0,1,2,3,4]` Pazartesi=0 gönderiyor; BE `(DayOfWeek)0`=Sunday saklıyor; kodda **hiçbir** gerçek-gün→indeks dönüşüm helper'ı yok; timetable ve duty **aynı 0-tabanlı** konvansiyonda (tutarlı). Editör tutarlı çalışır, kesişim siteleri gerçek bug.

---

## 1. Karar & Son Durum

**Tüm yapı gerçek `System.DayOfWeek` semantiğine hizalanır:** Pazartesi=1, Salı=2, Çarşamba=3, Perşembe=4, Cuma=5 (Pazar=0, Cmt=6 — okul hafta içi yalnız 1–5 kullanır).

- **Görüntü:** Takvim/ızgara **Pazartesi'den başlar** (sıra korunur) — değer 1 olsa da ilk sütun Pazartesi. Görüntü sırası ≠ sayısal değer.
- **Sonuç:** Gerçek tarihle karşılaştırmalar (`date.DayOfWeek == placement.Day`) **doğal olarak** doğru çalışır; ekstra dönüşüm helper'ı gerekmez. Off-by-one sınıfı **yapısal olarak** ortadan kalkar.

---

## 2. Bağlayıcı Kararlar (kullanıcı onaylı — 2026-06-20)

- **K-GUN-1 — Saklama gerçek System.DayOfWeek.** Tüm `Day` alanları (`TimeSlot`, `LessonPlacement`, `DutyAssignment`, `AvailabilitySlot`, `ScheduleException`) gerçek `System.DayOfWeek` değerleri tutar (Pzt=1..Cum=5). Tip zaten `DayOfWeek` kalır; **değişen, değerlerin anlamı** (0-tabanlı → 1-tabanlı gerçek).

- **K-GUN-2 — FE System değeri gönderir/bekler.** `EDITOR_DAYS`/`DUTY_DAYS` ve tüm istek gövdeleri 0-tabanlı yerine System değeri (Pzt=1..Cum=5) gönderir; tüketici görünümler System değeri okur. `dayShort`/`dayLong` indeksleme buna göre güncellenir. **Görüntü Pazartesi-ilk kalır.**

- **K-GUN-3 — `(DayOfWeek)request.Day` cast'i artık semantik doğru.** FE Pzt=1 gönderince `(DayOfWeek)1`=Monday — doğru. Cast kaldırılmaz; validasyon (hafta içi 1–5) eklenir/korunur. Solver çıktısı (`(DayOfWeek)p.Day`) da doğal doğru.

- **K-GUN-4 — DB veri migration'ı (+1).** Mevcut tüm saklı gün değerleri **+1 kaydırılır** (0→1 … 4→5):
  - `lesson_placements.day`
  - `duty_assignments.day_of_week`
  - `schedule_exceptions.day`
  - `teacher_availability_slots.day_of_week`
  - **Yayınlanmış `schedule_versions` snapshot JSON**'undaki gömülü `Day` değerleri (en hassas parça — bkz. §3.3).
  Migration **idempotent/güvenli** olmalı (yalnız bir kez +1; tekrar koşmada bozmamalı — durum bayrağı/aralık kontrolü).

- **K-GUN-5 — Kesişim siteleri sadeleşir.** ScheduleException INV-E2, planner, "bugün", vekâlet board: gerçek `date.DayOfWeek` artık saklı `Day` ile aynı uzayda → karşılaştırmalar **olduğu gibi doğru**; herhangi bir telafi/dönüşüm (zaten yok) eklenmez. Yalnız doğruluk testleriyle kanıtlanır.

- **K-GUN-6 — Duty 0-tabanlı fix'i geri alınır.** `AutoDistributeDutyJob.WorkingDays` → doğal `[DayOfWeek.Monday..Friday]` (=1..5). `AutoGenerateScheduleJob.BuildWeekGrid` 0..4 döngüsü → `Monday..Friday` (veya 1..5) + yorum güncellenir. `9d74f5b` commit'inin 0-tabanlı yaklaşımı bu migration'la yerini alır.

- **K-GUN-7 — Hafta içi sınırı.** Sistem yalnız Pzt–Cum (1–5) destekler; Cmt/Paz (6/0) program/nöbet gününe atanamaz (mevcut davranış korunur, validasyon System değerlerine göre güncellenir).

- **K-GUN-8 — Atomik teslim.** Kod değişikliği (FE+BE) ve DB migration'ı **birlikte** gider; ara durumda 0-tabanlı veri + System-bekleyen kod (veya tersi) tutarsızlık yaratır. Migration EF migration olarak eklenir, deploy ile birlikte uygulanır.

---

## 3. Etki Yüzeyi

### 3.1 Backend (oksis-api)
- **Entity/VO Day alanları** (tip aynı, değer anlamı değişir — kod değişikliği minimal, asıl iş migration + cast/validasyon): `TimeSlot`, `LessonPlacement`, `DutyAssignment`, `AvailabilitySlot`, `ScheduleException`, `RestorePlacementInput`, `LessonPlacedEvent`.
- **`(DayOfWeek)x` cast siteleri (13):** PlaceLesson, MoveLesson, PreCheckPlacement, SaveTeacherAvailability, ApplyAutoGenerateDraft, GetAvailableTeachers (timetable) + SaveDutyRosterDraft, ApplyAutoDistributeDuty, GetAvailableRelievers, GetAvailableSubstitutes (duties) + AutoDistributeDutyJob, AutoGenerateScheduleJob (jobs). Cast doğru kalır; **hafta içi validasyonu** eklenir.
- **Kesişim siteleri (sadeleşir, doğrulukla test edilir):** ScheduleException INV-E2, ScheduleExceptionPlanner, PublishedScheduleQueryHandler ("bugün"), GetTodaysSubstitutionBoard, GetAvailableSubstitutes.
- **EF config:** `Day` kolonları `HasConversion<int>()` zaten — tip değişmediği için config dokunulmaz; yalnız saklanan değer migration ile kayar.
- **Solver:** WorkingDays/BuildWeekGrid (K-GUN-6).
- **Testler:** `DayOfWeek.Monday` vb. kullanan domain testleri artık **doğru** (Monday=1 = gerçek) — çoğu değişmez; 0-tabanlı sayısal varsayan testler + yeni "Pazartesi" doğruluk testleri.

### 3.2 Frontend (oksis-web)
- `EDITOR_DAYS`, `DUTY_DAYS` (+ türevleri) → System değerleri (1..5).
- `dayShort[day]`/`dayLong[day]` indeksleme → 1-tabanlı erişime uyarlanır (veya dizi başına boşluk/offset).
- İstek gövdeleri (place/move/precheck/availability/duty/exception/substitution) → System değeri gönderir.
- Tüketici "bugün"/haftalık görünümler → System değeri okur; "bugün" vurgusu gerçek `getDay()` ile (JS Paz=0..Cmt=6 = System ile aynı!) doğal eşleşir.
- Vitest: 0 (Pazartesi) hardcode eden testler → 1.

### 3.3 DB migration — yayın snapshot JSON (EN HASSAS)
`schedule_versions` immutable snapshot JSON'unda gömülü `Day` değerleri de +1 kaymalı; yoksa yayınlanmış programlar 0-tabanlı kalıp tüketicide yanlış güne düşer. **Tam JSON yapısı + anahtar adı keşifle netleşecek** (PART 1); migration ya T-SQL `JSON_MODIFY` (dizi üstünde) ya da tek seferlik kod rutini ile yapılır. Transient JSON'lar (`ScheduleGenerationJob.CandidatesJson`, `DutyDistributionJob.ResultJson`) live-okunmuyorsa atlanır — keşifle teyit.

---

## 4. Risk & Azaltma

- **En büyük risk:** migration eksik/yanlış → veri bozulması (özellikle snapshot JSON). Azaltma: idempotent migration + aralık kontrolü; migration öncesi/sonrası satır sayısı + örnek değer doğrulaması; integration testte seed→migrate→assert.
- **Yeni off-by-one sokma riski (ironik):** her gün-dokunan site tek tek; doğruluk testleri (Pazartesi senaryosu) zorunlu; review.
- **Atomik olmama:** kod+migration birlikte (K-GUN-8).
- **Geri alma:** migration'ın `Down()`'u −1 (aynı idempotent dikkatle).

---

## 5. Yürütme Yaklaşımı

2c gibi **planlı + TDD + subagent review**. Sıra (öneri):
1. **Doğruluk testleri önce (RED):** "Pazartesi istisnası oluşturulabilir", "Pazartesi 'bugün' Pazartesi derslerini döndürür", "vekâlet board Pazartesi doğru" — mevcut bug'ı kanıtlayan testler.
2. **BE değer/cast/validasyon + kesişim sadeleştirme** → testler GREEN.
3. **DB migration (+1, snapshot dahil) + integration doğrulama.**
4. **FE site'ları (System değerleri) + FE testleri.**
5. **Duty fix geri-alma (K-GUN-6).**
6. **Doküman:** completion_status + bu spec + ders-programi-modulu-spec'e not.

Detaylı dosya-bazlı plan PART 1/PART 2 keşfi dönünce yazılır (`...-plan-be.md` / `...-plan-fe.md` / migration).

---

## 6. Referanslar
- `.claude/specs/ders-programi-modulu-spec.md` (§106)
- Doğrulama bulguları: FE `EDITOR_DAYS`/`DUTY_DAYS`=[0..4]; `(DayOfWeek)request.Day` cast; dönüşüm helper'ı yok; kesişim siteleri off-by-one.
- `.claude/docs/modules/timetable/` (completion_status, business-rules, api-contracts)
