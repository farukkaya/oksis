# Sınav Takvimi (Exams) Modülü — Tasarım

| | |
|---|---|
| **Tarih** | 2026-09-08 |
| **Kapsam** | `oksis-api` (yeni `Exams` modülü; Grades, Timetable, Attendance, Notifications ile bağ) · `oksis-ui` (web yönetici/öğretmen, mobil öğrenci/veli; bu belge yalnız sözleşme düzeyinde) · `oksis` (bu belge + modül dokümanı) |
| **Girdi** | 2026-09-08 beyin fırtınası oturumu (kullanıcı kararları §2) · `Assessment.ExamDate` mevcut durumu · `modules/timetable/README.md` ("Faz 2, ayrı events modülü" notu) |
| **Durum** | Onaylandı — uygulama planı bekliyor |

---

## 1. Problem ve başlangıç noktası

Not modülü 2026-09-08 itibarıyla kullanıcı gözünde **final**dir. Açık kalan tek iş sınav takvimidir. Bugün sınav zamanına dair tek kayıt `Assessment.ExamDate` (tek tarih) ve onu yazan `SetAssessmentExamDate` komutudur; takvim, yayın, derslik, gözetmen kavramı yoktur. Ders programı modülü sınav takvimini ileri faza ve olası bir "events" modülüne bırakmıştır; kararlaştırılmış tasarım yoktur.

Okullar iki farklı düzende sınav yapar ve bir okul aynı yıl içinde ikisini de kullanabilir:

- **Ders saatinde sınav (geleneksel):** Sınav, dersin kendi programdaki saatinde, öğrencinin kendi sınıfında, dersin öğretmeniyle yapılır. Birden çok şubenin aynı anda aynı sınava girmesi (ortak sınav) öğretmenler arası saat ödünç almayla çözülür.
- **Oturum / kelebek:** Ders programındaki belirli saatler oturuma dönüşür; farklı seviyelerin öğrencileri dersliklere karışık dağıtılır, sıra numarası alır, gözetmen öğretmenler atanır. Kapı listesi, oturma planı ve gözetmen çizelgesi yazdırılır.

Modül, bu ikisini **tek omurga** ile karşılamalı; her ikisinde de "kim, ne zaman, nerede, kiminle" bilgisini öğrenciye, veliye ve öğretmene zamanında ulaştırmalıdır.

---

## 2. Kilitlenmiş kararlar (2026-09-08)

| # | Karar | Gerekçe |
|---|---|---|
| K-1 | **Ayrı `Exams` modülü**; Grades'in ya da Timetable'ın içine konmaz | Gözetmen, derslik, oturma planı notla ilgisiz; takvim programı tüketir ama parçası değildir. Genel bir "events" modülü kelebek dağıtımını taşıyamaz |
| K-2 | **İki mod: ders saatinde sınav ve oturum.** İkisi de ders programının zil ızgarasını (tarih × ders saati) kullanır, serbest saat aralığı yoktur | "Yalnız oturum saatleri" kararı; iki modun aynı hücre modelini paylaşması |
| K-3 | **Ders programı askıya alınmaz.** Sınav, program hücresinin üstüne biner: ders yerinde kalır, hücre sınav etiketi taşır. `ScheduleException` üretilmez | Kullanıcı kararı (resimli örnek: Fizik hücresi + "MATEMATİK 1. SINAVI" etiketi) |
| K-4 | **Ders saatinde sınav modunda yazar öğretmendir**; yönetici çakışma çözer ve yayınlar | Sınavın doğal sahibi öğretmendir |
| K-5 | **Oturum modunda yazar yalnız yöneticidir**; öğretmen görüş penceresinde konuşur, engelleyici onay yoktur | Onlarca şube ve derslik tek elden planlanır |
| K-6 | **Kelebek tam organizasyon:** derslik tahsisi, oturma planı, gözetmen, yazdırma çıktıları sistemde. Otomatik dağıtıcı Faz 3 | Kullanıcı kararı |
| K-7 | **Şube bölünerek dersliklere dağılır**; tahsis birimi "şubeden N öğrenci" | Bütün-şube modeli bunun bölme sayısı 1 olan özel hâlidir |
| K-8 | **Saat ödünç alma:** başka şubede aynı saatte sınav için ev sahibi öğretmene istek gider; **saat öğretmenindir, yönetici geçemez** | Kullanıcı kararı; sözlü rica sisteme taşınır |
| K-9 | **Yoklama için yeni kaynak yok.** Oturumda gözetmen kapı listesinden alır, işaret öğrencinin kendi şubesinin o saatteki yoklama oturumuna düşer | Devamsızlık modülü beklenen/fiilen alan ayrımını zaten bilir |
| K-10 | **İki adımlı yayın:** pencere yayını (hafta duyurulur) ve takvim yayını (ayrıntı) | Öğrenci haftayı dönem başında, ayrıntıyı en geç 7 gün önce öğrenir |
| K-11 | **7 gün kuralı sert**, okul ayarıyla uzatılabilir; altına ancak gerekçeyle inilir | Yönetmelik alt sınırı |
| K-12 | Yayın ön koşulunda yerleşmemiş şube × ders varken **gerekçeyle yayın serbest** | Kullanıcı onayı (Bölüm 2) |
| K-13 | Ders rengi sunucuya alınmaz; web'deki deterministik palet (`subjectColorIndex`) etiketi boyar | Renk kural değil sunum tercihidir |

---

## 3. Alan modeli

Tüm entity'ler `TenantEntity`; global filtre ve `TenantSaveChangesInterceptor` geçerlidir. Domain'de EF/DataAnnotations yok; yapılandırma `Infrastructure/Persistence/Configurations/Exams/`.

### 3.1 ExamWindow — Sınav Penceresi (yayın birimi)

| Alan | Not |
|---|---|
| `AcademicSessionId`, `AcademicTermId` | |
| `ExamTypeId` | "1. Sınav", "2. Sınav" … Pencere bu türün sütun tarihlerini üretir |
| `StartDate`, `EndDate` (DateOnly) | Pencere aralığı |
| `Mode` | `LessonHour` \| `Session` |
| `Status` | `Draft` → `WindowPublished` → `SchedulePublished` → `Locked` |
| `Version` | Takvim yayını sonrası her değişiklikte artar |
| `ReviewOpensAt`, `ReviewClosesAt` | Yalnız `Session` modunda görüş penceresi |
| `DraftDueDate` | Taslak tamamlanma hedefi; cevapsız saat istekleri bu tarihte düşer |
| Yayın/kilit izleri | `WindowPublishedAt/By`, `SchedulePublishedAt/By`, `LockedAt/By/Reason` |

Tekillik: `(AcademicTermId, ExamTypeId)`. Sert kural: aynı dönemde pencereler tarih olarak çakışamaz.

Durum geçişleri entity metodudur (`PublishWindow`, `PublishSchedule`, `Revise(reason)`, `Lock(reason)`); handler'da `if status` zinciri yazılmaz. Yasak geçiş `ExamsDomainException` fırlatır.

### 3.2 ScheduledExam — Planlı Sınav

| Alan | Not |
|---|---|
| `ExamWindowId` | |
| `ClassRoomId`, `SubjectId` | |
| `Date`, `Period` | Zil ızgarası hücresi |
| `HostPlacementId` | Ders programındaki ev sahibi yerleşim (`LessonPlacement`) |
| `OwnerTeacherId` | Sınavın sahibi; notu giren kişi |
| `AdministeringTeacherId` | O saatte sınıfta uygulayan; kendi saatinde sahiple aynı |
| `ExamSessionId?` | Yalnız `Session` modunda |
| `HourRequestStatus` | `NotNeeded` \| `Pending` \| `Accepted` \| `Declined` \| `Expired` |
| `PlacementState` | `Placed` \| `Unplaced` (sahibi yerleştirmemiş ya da isteği düşmüş) |

Tekillik: `(ExamWindowId, ClassRoomId, SubjectId)` — bir şubenin bir dersten o pencerede tek sınavı olur. Bu kayıt yayında `Assessment.ExamDate`'i üretir.

### 3.3 HourRequest — Saat İsteği

`ScheduledExamId`, `HostTeacherId`, `Status` (`Pending` / `Accepted` / `Declined` / `Expired`), `RequestedAt`, `RespondedAt`, `ResponseNote?`. Yalnız ödünç saatte oluşur. Ev sahibi kabul edince `ScheduledExam.AdministeringTeacherId = HostTeacherId` ve `PlacementState = Placed`. Ret ya da düşme → `Unplaced`, sahibe bildirim.

### 3.4 ExamSession — Oturum (yalnız `Session` modu)

`ExamWindowId`, `Date`, `StartPeriod`, `EndPeriod`, `GradeLevels` (giren seviyeler), `Note?`. Planlı sınavlar oturuma bağlanır. Sert kural: aynı tarihte oturumlar ders saati olarak çakışamaz.

### 3.5 RoomAllocation — Derslik Tahsisi ve grupları

`ExamSessionId`, `RoomId`. Kapasite kopyalanmaz, kural denetiminde `Room.Capacity` okunur. Alt tablo `RoomAllocationGroup`: `ClassRoomId`, `StartIndex`, `Count` — "9-A'nın numara sırasıyla 1..15'i". Bir şube birden çok tahsise bölünebilir. Sert kural: gruplar toplamı kapasiteyi aşamaz; bir öğrenci aynı oturumda tek tahsiste olur.

### 3.6 Seat — Oturma

`RoomAllocationId`, `StudentId`, `SeatNo`. Üretici: gruplar seviyeye göre dönüşümlü, grup içi okul numarası sırası. Elle takas `SwapSeats(a, b)`. Tek seviye varsa ardışık dizilir.

### 3.7 Invigilation — Gözetmen Ataması

`ExamSessionId`, `RoomAllocationId`, `TeacherId`. Sert kural: öğretmen aynı oturumda tek derslikte; her tahsiste en az bir gözetmen (yayın ön koşulu). Havuz ders programından türer (§5.3).

### 3.8 Kural denetleyicisi

Sert/yumuşak kurallar entity'de değil, `ExamRuleInspector` (Application) içinde yaşar; Timetable'ın HARD/SOFT kalıbıyla aynı. Sert kural yazmayı engeller (`ExamRuleViolationException`, hata kataloğu kodu), yumuşak kural uyarı listesi döner ve gerekçeyle geçilir.

| Kod | Tür | Kural |
|---|---|---|
| EX-H01 | Sert | Şubeye aynı gün en çok 2 sınav |
| EX-H02 | Sert | Şube × ders pencere içinde tek sınav |
| EX-H03 | Sert | Seçilen saat, sahibin o şubedeki dersi olmalı (ödünç saatte ev sahibinin dersi) |
| EX-H04 | Sert | Derslik kapasitesi aşılamaz |
| EX-H05 | Sert | Öğrenci aynı oturumda tek sınav / tek tahsis |
| EX-H06 | Sert | Gözetmen aynı oturumda tek derslik |
| EX-H07 | Sert | Aynı dönemde pencere çakışması; aynı tarihte oturum çakışması |
| EX-H08 | Sert | Takvim yayını ilk sınava ≥ N gün (varsayılan 7, okul ayarı) — gerekçeyle geçilir |
| EX-S01 | Yumuşak | Aynı şubeye art arda iki gün sınav |
| EX-S02 | Yumuşak | Dersin öğretmeni kendi öğrencisinin dersliğinde gözetmen |
| EX-S03 | Yumuşak | Gözetmen yükü dengesizliği (oturum başına ortalama ± 1) |
| EX-S04 | Yumuşak | Dersliğe tek seviye düşmesi (kelebek amacı) |
| EX-S05 | Yumuşak | Yerleşmemiş şube × ders varken yayın |

---

## 4. İş akışları

### 4.1 Durum makinesi

```
Draft ──PublishWindow──▶ WindowPublished ──PublishSchedule──▶ SchedulePublished ──Lock──▶ Locked
                               ▲                                     │
                               └──────── Revise(reason) ─────────────┘   (Version++)
```

### 4.2 Pencere yayını

Yönetici dönem, sınav türü, tarih aralığı, mod girer; `PublishWindow`. Öğrenci ve veli haftayı görür; öğretmene "yerleştirme açıldı" bildirimi gider.

### 4.3 Yerleştirme — `LessonHour` modu

1. Öğretmen kendi şube × ders listesini görür (not defterlerinden türer).
2. Her satır için pencere içindeki **kendi** saatlerinden birini seçer; EX-H01/H02/H03 seçim anında denetlenir, EX-S01 uyarı verir.
3. "Aynı sınavı başka şubelerde de aynı saatte" seçeneği: sistem o saatte hedef şubede kimin dersi olduğunu programdan bulur, `HourRequest` açar. Ev sahibi kabul/ret eder. Ret ya da `DraftDueDate`'te cevapsızlık → `Expired`, sahibe "saat bulunamadı" bildirimi, sınav `Unplaced`. Yönetici geçemez (K-8).
4. Yerleştirmemiş öğretmene `DraftDueDate` − 14 günden itibaren hatırlatma (GradeEntryReminder kalıbı: günlük Hangfire sweep, kişi başına günde en çok bir bildirim).

### 4.4 Yerleştirme — `Session` modu

1. Yönetici oturumları açar (tarih, ders saati aralığı, seviyeler).
2. Her oturuma seviye × ders atar; sistem o seviyenin şubeleri için `ScheduledExam` üretir (`OwnerTeacherId` = not defterinin öğretmeni).
3. Derslik tahsisi: yönetici derslik seçer, şube gruplarını böler; EX-H04/H05 anında.
4. Sistem oturma planını üretir; yönetici takas edebilir.
5. Gözetmen havuzundan atama; EX-H06 sert, EX-S02/S03 uyarı.
6. Görüş penceresi: yönetici açar, süre okul ayarı (varsayılan 3 gün). Öğretmen oturum bazında yorum bırakır (`SessionReviewComment`: oturum, öğretmen, metin, çözüldü mü). Süre dolunca sessizlik kabul sayılır.

### 4.5 Takvim yayını (`PublishSchedule`)

Ön koşul tek yerde (`PublishScheduleCommandHandler` → `ExamRuleInspector.CheckPublish`):

- Bekleyen `HourRequest` yok (hepsi karara bağlanmış ya da düşmüş).
- `Session` modunda her tahsiste ≥ 1 gözetmen, her oturumdaki öğrenci bir tahsiste.
- EX-H08 sağlanıyor ya da gerekçe verilmiş.
- EX-S05 (yerleşmemiş şube × ders) varsa gerekçe verilmiş (K-12).

Yayın olayı `ExamScheduleReleasedEvent` → (a) Grades: sütun tarihleri, (b) Notifications: öğrenci, veli, sahip öğretmen, gözetmen, (c) Timetable etiket katmanı yalnız okuma projeksiyonudur, olay gerekmez.

### 4.6 Yayın sonrası değişiklik

Tek tek sınav taşıma, gözetmen değişikliği, oturma takası `Revise(reason)` ile; `Version++`, `ExamWindowRevision` kaydı (ne değişti, gerekçe, kim, ne zaman). Bildirim yalnız etkilenenlere. Yedi günün altına düşen taşıma EX-H08 uyarısı üretir ve gerekçe ister.

### 4.7 Kilit

Pencere `EndDate` geçince günlük sweep kilitler ya da yönetici gerekçeyle kilitler. Yazma kapanır; not girişi hatırlatması tarihleri okumaya devam eder.

---

## 5. Diğer modüllerle bağ

### 5.1 Grades

- `ExamScheduleReleasedEvent` işleyicisi: her `ScheduledExam` için `GradeBook(ClassRoomId, SubjectId, Term)` × `ExamTypeId` sütunu varsa `SetExamDate(Date)`.
- Sütun ilk not girişinde doğar; `Assessment.Create` yolunda pencere yayınlanmışsa tarih oradan alınır (ters yön).
- `SetAssessmentExamDate` komutu kalır; pencere varken çağrılırsa hata kataloğunda "tarih sınav takviminden yönetilir" koduyla reddedilir (kural sunucuda).
- `GradeEntryReminder` dokunulmaz.

### 5.2 Timetable

Yazma yok. Okuma projeksiyonuna `examBadges`: şube × tarih × ders saati için `{ subjectId, subjectName, examTypeName, roomCode?, seatNo?, invigilationRoomCode? }`. Şube görünümü ders + sınav türü; öğrenci görünümü + derslik + sıra; öğretmen görünümü + gözetmenlik dersliği. Etiket rengi web paletinden (K-13). Kaynak sorgu Exams modülünde (`GetExamBadgesForRangeQuery`), Timetable projeksiyonu onu çağırır; Exams, Timetable tablolarına yazmaz.

### 5.3 Gözetmen havuzu (Timetable'dan türetilir)

Oturumun ders saatlerinde: (a) dersi olmayan öğretmenler + (b) dersi olan ama şubesi o oturumda sınava giren öğretmenler. Şubesi sınava girmeyen öğretmen ders başındadır, havuza girmez. Sorgu Exams'te, `LessonPlacement` ve `ScheduledExam` birleşimi.

### 5.4 Attendance

Yeni kaynak yok. `Session` modunda gözetmen kapı listesinden yoklama alır; her işaret öğrencinin **kendi şubesinin** o saatteki `AttendanceSession`'ına `AttendanceRecord` olarak düşer, `ActualTakerId = gözetmen`. Ders öğretmeni o saatte kendi şubesinden almaya kalkarsa hata kataloğu: "bu saat sınav oturumunda, yoklama gözetmenden gelir". Bu kural Attendance'ın yoklama alma komutunda, Exams'in `IsInExamSession(classRoomId, date, period)` sorgusuyla denetlenir.

### 5.5 Notifications

Mevcut bildirim matrisine (`NotificationKind`, `PushEventKeyMap`, seed) yeni türler:

| Kind | Kime | Tetik |
|---|---|---|
| `ExamWindowPublished` | Öğrenci, veli, öğretmen | 4.2 |
| `ExamPlacementReminder` | Yerleştirmemiş öğretmen | Günlük sweep |
| `ExamHourRequested` / `…Answered` / `…Expired` | Ev sahibi / sahip | 4.3 |
| `ExamReviewOpened` | Oturumdaki öğretmenler | 4.4 |
| `ExamSchedulePublished` | Öğrenci, veli, sahip, gözetmen | 4.5 |
| `ExamMoved` / `ExamInvigilationChanged` | Yalnız etkilenenler | 4.6 |
| `ExamTomorrow` | Öğrenci, veli, gözetmen | Günlük sweep (D-1) |

Push dalgası kararı ayrı (K-02 push kararı ile uyumlu; ilk dalgada `ExamSchedulePublished` ve `ExamTomorrow`).

---

## 6. Yetkiler

| Rol | Yetki |
|---|---|
| SchoolAdmin / Akademik Koordinatör | Pencere, oturum, tahsis, gözetmen yazma; yayın; kilit; eksik/uyarı gerekçesi |
| Teacher | Kendi sınavını yerleştirme; saat isteğine cevap; görüş bırakma; kendi sınav ve gözetmenlik takvimi; gözetmen olduğu derslikten yoklama |
| Student / Parent | Yalnız kendi (çocuğunun) takvimi ve kelebek bilgisi |
| Secretary | Yazdırma çıktıları (salt okunur) |
| SuperAdmin | Salt okunur, audit |

İzin anahtarları `exams.window.manage`, `exams.exam.place`, `exams.hour-request.answer`, `exams.review.comment`, `exams.print`, `exams.read.self`. Tümü sunucuda; ekran yalnız yansıtır.

---

## 7. Okuma yüzleri ve yazdırma

- **Yönetici panosu:** yerleşmemiş şube × ders, bekleyen saat istekleri, sert/yumuşak ihlaller, gün bazında yığılma (şube × gün sınav sayısı).
- **Öğretmen:** yerleştirme ekranı, gelen istekler, kendi sınav + gözetmenlik takvimi.
- **Öğrenci / veli:** sınav takvimi (tarih, ders, saat, derslik, sıra).
- **Yazdırma** (ayrı sorgular, ekran verisinden türetilmez; HTML → PDF mevcut belge altyapısıyla):
  - Kapı listesi — derslik başına: öğrenci ad, numara, şube, sıra.
  - Oturma planı — derslik başına: sıra × öğrenci ızgarası.
  - Gözetmen çizelgesi — oturum başına: derslik × gözetmen.
  - Şube sınav takvimi — şube başına: tarih × ders saati × ders.

---

## 8. Test stratejisi

- **Kural denetleyicisi:** her EX-H/EX-S kodu için olumlu + olumsuz birim vaka (Application.UnitTests).
- **Durum makinesi:** her yasak geçiş fırlatır (Domain.UnitTests).
- **Oturma üreticisi:** tablo testi — iki seviye dönüşümlü, tek seviye ardışık, kapasite dolunca hata, takas.
- **Handler:** yayın ön koşulu, saat isteği düşme, Grades tarih beslemesi, ters yön (sütun doğarken tarih alma).
- **Entegrasyon (gerçek SQL):** etiket katmanı projeksiyonu, gözetmen havuzu sorgusu, Attendance bağı, bildirim matrisi kayıtları (NotificationMatrixPushTests kalıbı).
- **Zaman kuralları:** `TimeProvider` ile; 7 gün eşiği ve sweep'ler gerçek koşuda da ölçülür (B-50 dersi).
- Günlük döngü `./scripts/test-changed.sh`; entegrasyon yalnız `--integration`.

---

## 9. Fazlama

| Faz | Kapsam | Sonuç |
|---|---|---|
| **1 — Ders saatinde sınav** | ExamWindow, ScheduledExam, HourRequest, öğretmen yerleştirme, yönetici panosu, iki adımlı yayın, Grades beslemesi, Timetable etiket katmanı, bildirimler + sweep'ler, öğrenci/veli/öğretmen takvimi, şube takvimi yazdırma | Kelebek uygulamayan okul tam karşılanır |
| **2 — Oturum ve kelebek** | ExamSession, RoomAllocation + gruplar, Seat üreticisi ve takas, gözetmen havuzu ve ataması, görüş penceresi, gözetmen yoklaması (Attendance bağı), kapı listesi / oturma planı / gözetmen çizelgesi | Kelebek uygulayan okul tam karşılanır |
| **3 — Otomatik dağıtıcı** | Derslik ve gözetmeni kurallara göre öneren Hangfire işi (ScheduleGenerationJob kalıbı) | Elle tahsis yükü kalkar |

Her faz kendi spec/plan döngüsüyle uygulanır; bu belge üçünün ortak omurgasını kilitler. Uygulama planı önce **Faz 1** için yazılır.

---

## 10. Kapsam dışı (bilinçli)

- Sınav kağıdı, soru bankası, sınav içeriği.
- Sınav sonucu girişi (Grades'te zaten var).
- Telafi / mazeret sınavı planlama.
- Gözetmen ek ders / ücret hesabı.
- Mobilde yazdırma.
- Okul dışı merkezi sınavlar (LGS, YKS deneme takvimi).

---

## 11. Açık noktalar (uygulama planında karara bağlanır)

- `ScheduledExam.Date/Period` ile `HostPlacementId` çiftinin tutarlılığı: program sürümü değişince (yerleşim taşınırsa) sınavın ne olacağı. Öneri: yayınlanmış program sürümündeki yerleşim kalkarsa sınav `Unplaced`'a düşer ve sahibe bildirim gider; Faz 1 planında netleşir.
- Görüş yorumu (`SessionReviewComment`) ile duyuru/mesaj modülü arasında sınır: yorum modül içi kalır, mesajlaşmaya bağlanmaz.
