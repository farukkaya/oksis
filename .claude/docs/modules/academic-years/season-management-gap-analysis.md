# Sezon Yönetimi — Backend Boşluk Analizi (Gap Analysis)

> **Kapsam:** Handoff paketi *"Oksis Layout — Akademik Takvim & Sezon Yönetimi"* içindeki
> **Sezon Yönetimi (6 adımlı sihirbaz)** ekranının mevcut backend ile karşılanma durumu.
> **Tarih:** 2026-06-08 · **Hedef rol:** School_Admin · **Faz:** 1 (Sezon Yönetimi)
> **Kaynaklar:** handoff `seasonwizard.jsx`, `oksis-admin-ekranlari-mimari-spec.md` (§1.2, §4.9, §5.9, §6),
> `oksis-api/src/.../Modules/AcademicSessions`, `.../Modules/Teachers`.

---

## 0. Özet

Mevcut backend `AcademicSessions` modülü **boş bir sezon yaratma + tekil sınıf/öğrenci/tatil
işlemleri** açısından olgun (≈63 cs handler). Ancak sihirbazın **asıl değeri olan
"önceki sezondan kopyalayarak yeni sezon açma + toplu terfi"** orkestrasyonunun backend
karşılığı **yoktur**. `CreateAcademicSession` yalnızca boş sezon + 2 dönem üretir; kopya
bayraklarını ve kaynak sezonu yok sayar.

Mimari spec'in **§4.9 `PromoteStudents`** ve **§5.9 `CopyAssignmentsToNewSeason`** maddeleri
bağlayıcıdır (CLAUDE.md Absolute Rule #6) — bu eksikler "nice-to-have" değil, spec gereğidir.

---

## 1. Genel durum tablosu

| Yapı | Durum | Konum |
|---|---|---|
| `AcademicSession` aggregate (Setup→Active→Archived) | ✅ Var | `Domain/.../AcademicSessions/Entities/AcademicSession.cs` |
| 2 dönem (`AcademicTerm` T1/T2) sezonla atomik | ✅ Var | aynı aggregate |
| `ClassRoom` + `ClassRoomStudent` (Enrollment, tarihsel) | ✅ Var | `.../Entities/ClassRoom.cs`, `ClassRoomStudent.cs` |
| `SchoolHoliday` CRUD + tür enum | ✅ Var | `.../Entities/SchoolHoliday.cs` |
| `TeachingAssignment` (öğretmen görevlendirme) | ✅ Var | `Domain/.../Teachers/Entities/TeachingAssignment.cs` |
| Tekil: AssignStudent / TransferStudent / AssignSubjectClass / SetHomeroom | ✅ Var | ilgili Commands |
| `ActivateAcademicSession` + önceki sezonu arşivleme (BR-AS-001) | ✅ Var | `Commands/ActivateAcademicSession` |
| **Önceki sezondan kopyalayarak sezon açma orkestrasyonu** | ❌ **Yok** | — |
| **Toplu şube kopyalama + terfi haritası** | ❌ **Yok** | — |
| **`PromoteStudents` toplu öğrenci terfisi (§4.9)** | ❌ **Yok** | — |
| **`CopyAssignmentsToNewSeason` (§5.9)** | ❌ **Yok** | — |
| **Resmi tatil otomatik kaynağı + okul tatili toplu kopyalama** | ❌ **Yok** | — |
| **Sunucu tarafı SeasonDraft (taslak kaydet/devam)** | ❌ **Yok** | — |

---

## 2. Adım adım analiz (sihirbaz)

### Adım 1 — Sezon Açılışı
- ✅ `CreateAcademicSession` (ad + sezon/dönem tarihleri + 2 dönem). `Setup` statüsü = "taslak"a denk.
- ❌ "Kopyalanacak bağlam" 5 bayrağı (`terms`, `branches`, `holidays`, `assignments`, `schedule`) komutta **yok**.
- ❌ `sourceSeasonId` (kaynak sezon) parametresi **yok**.

### Adım 2 — Dönem Geçişi (+1 yıl kaydır)
- ✅ Dönem tarihleri create'te açıkça veriliyor; tarih tutarlılığı invariant'ları (BR-AS-004) mevcut.
- ⚠️ "Önceki sezonun dönemlerini +1 yıl kaydırarak doldur" mantığı backend'de **yok** (FE hesaplayıp gönderebilir — düşük öncelik).

### Adım 3 — Şubeler (yükseltme / mezuniyet / yeni şube) — **EN BÜYÜK BOŞLUK**
- ✅ Tekil `CreateClassRoom`. `ClassRoom` GradeLevelId + Section taşır.
- ❌ **Toplu şube kopyalama yok**: kaynak sezonun şubelerini al → `GradeLevel +1` ile yeni sezona klonla; terminal kademeyi "Mezun" işaretle; en alt kademeye yeni şube aç.
- ❌ "Promosyon haritası" (kaynak şube → hedef + işlem rozeti: Terfi/Mezuniyet/Yeni Şube) üreten **önizleme query'si yok**.

### Adım 4 — Tatiller
- ✅ `SchoolHoliday` CRUD + `GetSchoolHolidaysForSession`. `HolidayType` enum: `PublicHoliday / SchoolEvent / ClosedDay / SemesterBreak`.
- ❌ **Resmi tatil otomatik kaynağı yok** — tasarımdaki "Otomatik eklendi" yeşil çipleri besleyen MEB/ulusal tatil seed/servisi yok.
- ❌ "Okul tatillerini önceki sezondan toplu kopyala" komutu **yok**.

### Adım 5 — Öğrenci Geçişi (Sezon Terfisi) — **İKİNCİ BÜYÜK BOŞLUK**
- ✅ Tekil `AssignStudentToClassRoom`, `TransferStudent`; person-seviye `GraduatePerson`.
- ✅ Tarihsel model doğru: `ClassRoomStudent` üzerine yazılmaz, `LeftAt` ile kapatılır (BR-AS-011). `AssignmentReason.Graduation` mevcut.
- ❌ **`PromoteStudents` toplu komutu yok** (§4.9): tüm aktif Enrollment'ları yeni sezona/üst sınıfa taşı, pasifleri hariç tut, terminal kademeyi mezun et — atomik + idempotent.

### Adım 6 — Özet & Onay → Sezonu Aç
- ✅ `ActivateAcademicSession` + önceki sezonu arşivleme (BR-AS-001).
- ⚠️ Backend Setup statüsü "taslak"ı karşılıyor ama **tek-transaction'lık "copy bayraklarıyla sezon aç"** orkestrasyon komutu yok.
- ❌ **`CopyAssignmentsToNewSeason` yok** (§5.9) — sadece tekil `AssignSubjectClass`. `TeachingAssignmentChangedEvent` mevcut (Ders Programı senkronu için).

### Taslak kalıcılığı (sihirbaz state)
- ❌ "Taslağı Kaydet / kaldığın adımdan devam" için **sunucu tarafı `SeasonDraft`** yok (prototipte `localStorage`). Tenant/kullanıcı bazlı `{ name, step, copyFlags, excludePassive }` modeli gerek.

---

## 3. Eksikler — Geliştirme Backlog'u

| # | Eksik | Spec | Öncelik |
|---|---|---|---|
| 1 | `RolloverSeason` / `OpenSeasonFromPrevious` — kopya bayraklarıyla orkestrasyon komutu (sihirbazın kalbi) | — | **Yüksek** |
| 2 | Toplu **şube kopyalama + terfi haritası** komutu & önizleme query'si | — | **Yüksek** |
| 3 | `PromoteStudents` toplu öğrenci terfi komutu | §4.9 (bağlayıcı) | **Yüksek** |
| 4 | `CopyAssignmentsToNewSeason` öğretmen görevlendirme kopyalama | §5.9 (bağlayıcı) | **Yüksek** |
| 5 | Resmi tatil otomatik kaynağı + okul tatili toplu kopyalama | — | Orta |
| 6 | Sunucu tarafı **SeasonDraft** (taslak kaydet/devam et) | — | Orta |
| 7 | Dönem "+1 yıl kaydır" kopyalama yardımcısı (FE-side de olabilir) | — | Düşük |
| 8 | (Faz 2) Akademik Takvim **etkinlik** varlığı + `GET /seasons/{id}/events` | — | Faz 2 |

---

## 4. Notlar / Riskler

- **Bağlayıcı maddeler:** §4.9 (`PromoteStudents`) ve §5.9 (`CopyAssignmentsToNewSeason`) spec gereğidir;
  atlanamaz veya "etrafından dolaşılamaz" (CLAUDE.md Absolute Rule #6).
- **Atomiklik:** Sezon rollover (kopya + terfi) tek transaction veya idempotent batch + Hangfire job
  olarak tasarlanmalı; yarım kalan rollover veri bütünlüğünü bozmamalı.
- **Hard-delete yasağı (§1.3):** Terfi/mezuniyet asla silmez; yeni `Enrollment`/`TeachingAssignment`
  üretir, eskiyi `LeftAt`/arşiv ile kapatır. Mevcut entity'ler bunu zaten destekliyor.
- **Faz ayrımı:** Bu analiz **Sezon Yönetimi** (Faz 1) odaklıdır. Akademik Takvim etkinlik altyapısı
  (6 türlü event) ayrı bir boşluktur ve Faz 2'ye bırakılmıştır.
</content>
</invoke>
