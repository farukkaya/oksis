# Sınav (Exams)

> Bu modülün **tek kaynak gerçek** dokümantasyonu. Diğer dosyalar bu modülün alt başlıklarını detaylandırır.
>
> **Not (2026-09-11):** Bu klasörde bugün yalnız `README.md` doludur. Modül iskeletinin
> kalan dokuz dosyası açılmadı — 19 modülün hiçbirinde de dolu değiller (bkz. `X-21`).
> Sınav modülünün ayrıntısı bugün iki spec + iki uygulama planında yaşıyor:
> `docs/superpowers/specs/` ve `docs/superpowers/plans/` altında.

---

## Amaç

Sınav modülü, okulun **sınav haftasını** planlamasını, sınavları ders programına
yerleştirmesini, kuralları denetlemesini ve takvimi öğrenci/veli/öğretmene yayınlamasını
sağlar.

**Sorduğu temel soru:** "Hangi şube, hangi dersten, ne zaman, nerede, kiminle sınava girecek?"
**Çözmediği şey:** sınav **notu** (`marks` modülü), sınav **sorusu/kâğıdı** (kapsam dışı),
sınav günü **yoklaması** (`attendance`; kelebek oturumunda nasıl tutulacağı **Faz 2b**'nin konusu).

---

## Paydaşlar / Roller

| Rol | Kullanım Şekli |
|---|---|
| Yönetici / Müdür | Sınav penceresi açar, kelebek oturumu kurar, dersliği ve gözetmeni düzenler, takvimi yayınlar |
| Öğretmen | Kendi dersini programa yerleştirir, oturum açar, ödünç saat ister, gözetmenlik görevini görür |
| Öğrenci | Kendi sınav takvimini, dersliğini ve sıra numarasını görür |
| Veli | Çocuğunun sınav takvimini görür |

> Tam yetki matrisi için bkz. `permission-matrix.md` (proje kökü). Modülün izinleri:
> `exams.manage`, `exams.place`, `exams.read`, `exams.report`.

---

## İki yerleştirme modu

Sınav penceresi (`ExamWindow`) açılırken **mod** seçilir ve pencere ömrü boyunca değişmez.

### `LessonHour` — ders saati modu (Faz 1)

Öğretmen kendi dersinin saatine sınavını koyar. Şube kendi sınıfında sınava girer;
sıra numarası kavramı **yoktur**. Kendi dersi olmayan bir saate koymak isterse
**ödünç saat isteği** (`HourRequest`) doğar ve saatin sahibi onaylar.

### `Session` — kelebek oturumu (Faz 2a)

Bir öğretmenin **aynı dersten girdiği bütün şubeler tek seferde** sınava girer. Oturum
**tek ders saatidir**; alternatifi yoktur.

- Oturum = bir ders + çok şube + bir saat. **Sahibi yoktur** — sorumlu öğretmenler
  oturuma bağlı `ScheduledExam` satırlarından türetilir.
- Öğretmen **kendi dersi olan bir saati seçmek zorunda değildir**; haftanın herhangi bir
  saatini seçebilir (`EX-H03` bu modda uygulanmaz). Ödünç saat isteği bu modda **doğmaz**.
- **Derslik kümesi türetilir**: katılan şubelerin kendi sınıfları. Yönetici derslik
  ekleyebilir (`IsManuallyAdded`) veya çıkarabilir (`IsExcluded`); çıkarılan satır silinmez,
  işaretlenir.
- **Gözetmen türetilir**: o gün o saatte o derslikte dersi olan öğretmen. Türetme boş
  düşerse **delik** oluşur; deliği yönetici elle doldurur ve delik **yayını engeller**.
- **Yerleşim sistemindir**: öğrenciler dersliklere *dönüşümlü serpiştirme* ile dağıtılır —
  aynı şubeden öğrenciler yan yana düşmez. Yönetici tek tek sıra takası yapabilir.
- Aynı saatte **farklı öğretmenlerin farklı dersleri** yan yana durabilir. Çakışamayan
  şey oturum değil üç kaynaktır: aynı derslik (`EX-H11`), aynı öğrenci (`EX-H05`),
  aynı gözetmen (`EX-H06`).

---

## Akış Özeti

1. Yönetici **sınav penceresi** açar (dönem, tarih aralığı, mod).
2. Öğretmenler sınavlarını **yerleştirir**; `Session` modunda yerleştirme oturumu doğurur.
3. Yönetici **oturumu düzenler**: şube ekler/çıkarır, oturumları birleştirir, derslik ve
   gözetmen düzeltir, gerekirse sıra takası yapar.
4. Sistem **kuralları denetler**: sert ihlaller yayını engeller, yumuşak ihlaller uyarır.
5. Yönetici **takvimi yayınlar** — iki adımlı: hafta duyurusu ile ayrıntı ayrı açılır.
6. Öğrenci, veli ve öğretmen kendi yüzünden takvimi, dersliği, sırayı ve gözetmenlik
   görevini görür; değişiklikler **bildirimle** gider.

---

## Kural denetleyicisi

Kurallar entity'de değil `ExamRuleInspector`'da yaşar. **Sert** ihlal `Result.Conflict`
döndürür (exception değil) ve yayını engeller; **yumuşak** ihlal uyarı olarak geçer.

| Kod | Tür | Kural |
|---|---|---|
| `EX-H01` | Sert | Şubeye aynı gün en çok 2 sınav |
| `EX-H03` | Sert | Seçilen saat sahibin o şubedeki dersi olmalı — **yalnız `LessonHour` modunda** |
| `EX-H05` | Sert | Öğrenci aynı gün ve saatte tek oturumda, tek derslikte, tek sırada |
| `EX-H06` | Sert | Bir öğretmen aynı gün ve saatte tek derslikte gözetmen |
| `EX-H08` | Sert | Takvim yayını ilk sınava ≥ N gün — gerekçeyle geçilir |
| `EX-H09` | Sert | Bekleyen ödünç saat isteği varken yayın yapılamaz |
| `EX-H10` | Sert | Dersliğin gözetmeni yok |
| `EX-H11` | Sert | Bir derslik aynı gün ve saatte tek oturuma ait |
| `EX-H12` | Sert | Oturumda sıraya oturamamış öğrenci var |
| `EX-S01` | Yumuşak | Aynı şubeye art arda iki gün sınav |
| `EX-S04` | Yumuşak | Bir dersliğe tek şubeden öğrenci düştü (karışım olmamış) |
| `EX-S05` | Yumuşak | Yerleşmemiş şube × ders varken yayın |
| `EX-S06` | Yumuşak | Derslikte kapasite aşıldı |

> `EX-H02`, `EX-H04`, `EX-H07`, `EX-S02`, `EX-S03` omurga spec'inde listelenmiş ama
> **hiç yazılmamıştır**. `EX-H04`/`EX-S02`/`EX-S03` bilinçle yazılmayacak; `EX-H02` ve
> `EX-H07` Faz 1 boşluğudur (`TB-124`).

---

## Bildirimler

| Tür | Ne zaman | Kime |
|---|---|---|
| `ExamWindowPublished` | Sınav penceresi duyuruldu | Okul geneli |
| `ExamPlacementReminder` | Yerleştirme bekleyen öğretmen | İlgili öğretmen |
| `ExamHourRequested` / `ExamHourAnswered` | Ödünç saat isteği ve cevabı | Saatin sahibi / isteyen |
| `ExamSchedulePublished` | Takvim yayınlandı | Öğrenci ve veli — yerleşmiş öğrenci **derslik ve sıra** taşıyan kişisel satır alır |
| `ExamMoved` | Sınav taşındı; **derslik/sıra değişimi de taşıma sayılır** | Yalnız etkilenen öğrenci |
| `ExamInvigilationChanged` | Gözetmen değişti | Görevi giden **ve** gelen öğretmen |
| `ExamTomorrow` | Yarın sınav var | Öğrenci ve veli |

---

## İlişkili Modüller

| Modül | İlişki |
|---|---|
| `timetable` | Ders programı okunur — saat sahipliği, gözetmen türetme ve program etiketi |
| `classrooms` | Şubenin kendi dersliği (`ClassRoom.RoomId`) derslik türetmesinin kaynağıdır |
| `subjects` | Sınavın dersi; program hücresinin rengi sınavın dersinden gelir |
| `students` / `parents` | Takvim, derslik ve sıra okuması; veli çocuğunkini görür |
| `teachers` | Yerleştirme, oturum açma, gözetmenlik görevi |
| `notifications` | Yukarıdaki yedi tür; domain olayları `DomainEventNotification<T>` ile yayılır |
| `marks` | Sınav **sonrası** — not girişi bu modülün işi değildir |
| `attendance` | **Faz 2b**: kelebek oturumunda yoklamanın nasıl tutulacağı henüz açık |

---

## Mevcut Durum

| Faz | Kapsam | Durum |
|---|---|---|
| **Faz 1** | Pencere, ders saati modunda yerleştirme, ödünç saat, kural denetimi, iki adımlı yayın, öğrenci/veli/öğretmen yüzleri | ✅ `master`'da |
| **Faz 2a** | Kelebek oturumu — oturum/derslik/sıra modeli, türetme, serpiştirmeli yerleşim, oturum komutları, yeni kurallar, okuma uçları, bildirimler | 🟡 Sunucu tarafı bitti; **istemci (Dilim 7) açık** |
| **Faz 2b** | Sınav sonrası — itiraz/inceleme akışı, oturumda yoklama | ⬜ Başlamadı |

**Faz 2a'nın açık kalan işleri:** istemci tarafının tamamı (web + mobil), uçtan uca ekran
doğrulaması, ve `attendance` ile kesişim kararı (kelebek oturumunda bir şube birden çok
derslikte ve birden çok gözetmenin altında bölünüyor; `AttendanceSession`'ın tek
`ActualTakerId` alanı bu hâli taşımıyor).

---

## Metadata

- **Slug:** exams
- **Status:** in-progress
- **Owner:** —
- **Created:** 2026-09-11
- **Last Updated:** 2026-09-11
- **Files:**
  - [x] README.md
  - [ ] domain-model.md
  - [ ] api-contracts.md
  - [ ] database-schema.md
  - [ ] permissions.md
  - [ ] notifications.md
  - [ ] ui-flows.md
  - [ ] business-rules.md
  - [ ] open-questions.md
  - [ ] completion_status.md
