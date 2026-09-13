# Sınav Takvimi (Exams) Modülü Ekranları — Tasarım Brief'i (Oksis Layout v2)

> **Hedef:** claude.ai/design `Oksis Layout v2` (`7d876f6c-70ee-4894-bac1-2be5c96dd34a`)
> projesinin sohbetine yapıştırılacak prompt. Projeye `uploads/sinav-takvimi-brief.md`
> olarak da yüklendi.
> **Kaynak tasarım belgesi:** `oksis/docs/superpowers/specs/2026-09-08-sinav-takvimi-modulu-design.md`
> (K-1…K-13 kararları, EX-H/EX-S kural kodları, 3 faz).
> **Not:** Backend HENÜZ YAZILMADI — mock-first. Tasarım sözleşmeyi kurar.

---

Aşağıdaki blok tasarım projesinin sohbetine olduğu gibi verilir:

---

Bu projede yeni bir modül var: **Sınav Takvimi (`exam`)**. Önce kök `CLAUDE.md`'yi
(R1–R14 + Bölüm A/B) oku ve her işte ona uy: PageHeader, token'lar, `.attm-*` /
`.att-*` kalıpları, en yakın ekranı fork et, mock alan adları İngilizce ve wire
şekliyle aynı (R11), her ekran `loading / empty / error` durum matrisi tanımlar
(R8), biten her ekran `manifest.json`'a yazılır (R7), ham hex yalnız iki dosyada
(R10), yüzeyler karışmaz (R13).

**Glossary (bu modülün kimlikleri — İngilizce identifier, Türkçe arayüz metni):**
Sınav penceresi = `examWindow` · Planlı sınav = `scheduledExam` · Saat isteği =
`hourRequest` · Oturum = `examSession` · Derslik tahsisi = `roomAllocation` ·
Oturma = `seat` · Gözetmen = `invigilation`. Domain adı `exam`, dosya öneki
`exam-`. **"Sınav" kelimesi kullanılır, "yazılı" DEĞİL** (MEB 2023 sonrası dili;
not modülünde de bu kural uygulandı).

## Domain bağlamı — modelin kendisi

Okullar iki düzende sınav yapar ve bir okul aynı yıl ikisini de kullanır. Modül
ikisini tek omurga ile karşılar.

- **`lessonHour` modu (geleneksel):** Sınav dersin kendi program saatinde, kendi
  sınıfında yapılır. **Yazan öğretmendir**, yönetici çakışma çözer ve yayınlar.
- **`session` modu (kelebek):** Belirli ders saatleri oturuma dönüşür; farklı
  seviyelerin öğrencileri dersliklere karışık dağıtılır, sıra numarası alır,
  gözetmen atanır. **Yazan yalnız yöneticidir**; öğretmen görüş penceresinde
  konuşur, engelleyici onayı yoktur.

**Üç kural tasarımın her yerinde geçerlidir:**

1. **Ders programı ASKIYA ALINMAZ.** Sınav, program hücresinin üstüne **etiket**
   olarak biner. Ders hücresi (ders adı, öğretmen, derslik) yerinde kalır.
2. **Zaman = zil ızgarası.** Serbest saat aralığı yoktur; her sınav bir `date` +
   `period` (ders saati) çiftidir. Bu, `schedule-read.jsx`'teki kuralın aynısı.
3. **İki adımlı yayın.** Önce **pencere** yayınlanır (öğrenci "hangi hafta"yı
   dönem başında öğrenir), sonra **takvim** yayınlanır (ayrıntı, en geç 7 gün
   önce). İki yayın iki ayrı durum, iki ayrı bildirimdir.

**Durum makinesi (pencere):**
`draft` → `windowPublished` → `schedulePublished` → `locked`, ayrıca
`schedulePublished` → `revise(reason)` → `schedulePublished` (`version++`).

**Saat ödünç alma (bu modülün en özgün akışı):** Kimya öğretmenine ek görevle
Sağlık Bilgisi verilmiş; 9-A'da kendi saati var ama 9-B ve 9-C'de yok. Sınavı üç
şubede aynı saatte yapmak için **ev sahibi öğretmene saat isteği** gönderir
(9-B'nin o saatteki Tarih öğretmeni). Ev sahibi kabul/ret eder. **Saat
öğretmenindir — yönetici bu kararı GEÇEMEZ.** Kabul edilirse 9-B'nin programında
Tarih hücresinin üstünde "SAĞLIK BİLGİSİ 1. SINAVI" etiketi çıkar; Tarih dersi
silinmez, yoklamayı yine Tarih öğretmeni alır.

---

## İş 0 · Menü ve navigasyon — ÖNCE SOR, ÇİZME

Bu modül yeni bir üst düzey yüzey. `web/skeleton.jsx :: Page()` Türkçe menü
etiketine göre dallanıyor. Önerim: yönetici menüsünde **"Sınav Takvimi"**, ders
programının hemen altında; öğretmen menüsünde aynı ad. Mobilde öğrenci/veli için
mevcut Notlar sekmesindeki görünüm seçicisine bağlanır (aşağıda İş 8).
**Menü kalemi eklemeden ve sekme sayısını artırmadan önce sor.** `[S-0]`

---

# FAZ 1 — `lessonHour` modu (İş 1–6, 8, 10)

Bu faz tek başına kelebek uygulamayan okulu tamamen karşılar. Önce bunu bitir.

## İş 1 · Sınav pencereleri hub'ı (yönetici) — YENİ EKRAN

- **id:** `exam-windows` · **domain:** `exam` · dosya `web/exam-windows.jsx`
- **Fork:** `web/grade-admin-board.jsx` üst yapısı + `web/akademik_takvim.jsx`
  dönem şeridi. Kart ızgarası, PageHeader, sezon/dönem seçici (`sezon_picker`).
- **Gövde:** dönem × sınav türü başına bir pencere kartı. Kartta: sınav türü adı
  ("1. Sınav"), tarih aralığı, **mod rozeti** (`Ders saatinde` / `Oturum`), durum
  rozeti, ilerleme ("48 dersten 31'i yerleşti"), yayına kalan gün.
- **Aksiyonlar:** Yeni pencere (modal), Pencereyi yayınla, Panoya git, Kilitle.
- **Durumlar:** `loading` · `empty` ("Bu dönemde sınav penceresi yok" + tek
  aksiyon) · `error` · `locked` (kart soluk, aksiyonlar kapalı).
- **Mock:** `examWindows: [{ id, termId, examTypeId, examTypeName, startDate,
  endDate, mode: "lessonHour"|"session", status: "draft"|"windowPublished"|
  "schedulePublished"|"locked", version, draftDueDate, reviewOpensAt,
  reviewClosesAt, placedCount, totalCount, pendingRequestCount, violationCount,
  daysUntilFirstExam }]`

## İş 2 · Pencere oluştur / yayınla (yönetici) — MODAL

- Dosya: `web/exam-window-modals.jsx` (`.att-modal-*` kalıbı).
- **Oluştur:** sınav türü seçimi (akademik takvimden gelen `examType` listesi),
  tarih aralığı, **mod seçimi** (iki seçenekli, her birinin altında tek satır
  açıklama: "Sınav dersin kendi saatinde yapılır" / "Ders saatleri oturuma
  dönüşür, öğrenciler dersliklere dağıtılır"), taslak tamamlanma tarihi.
- **Pencere yayını onayı:** kimin ne göreceğini yazan özet ("Öğrenci ve veli
  hafta bilgisini görür, ayrıntı henüz yayınlanmaz").
- **Takvim yayını onayı — ÖN KOŞUL LİSTESİ (en kritik parça):** yayın düğmesi
  bir kontrol listesinin üstünde durur:
  - Bekleyen saat isteği: `N` (varsa **engel**, sert)
  - Yerleşmemiş şube × ders: `N` (**uyarı** — gerekçe girilerek geçilir)
  - İlk sınava kalan gün: `5` — 7 günün altındaysa **gerekçe zorunlu**
  - (`session` modunda ayrıca) gözetmensiz derslik: `N` (**engel**)
  Gerekçe alanı `gorevlendirmeler.jsx :: GerekceBlok` kalıbından fork edilir.
- **Durumlar:** `ready` · `blocked` (engel var, düğme kapalı, neden listelenir) ·
  `needsReason` · `submitting` · `error`.

## İş 3 · Sınav panosu (yönetici) — YENİ EKRAN, MODÜLÜN KALBİ

- **id:** `exam-board` · dosya `web/exam-board.jsx` (+ gerekirse
  `web/exam-board-parts.jsx`)
- **Fork:** `web/grade-admin-board.jsx` — KPI şeridi + filtre çubuğu + tablo +
  ısı haritası kalıbı birebir oturuyor.
- **KPI şeridi:** yerleşen/toplam yüzdesi · bekleyen saat isteği · sert ihlal ·
  yumuşak uyarı · yayına kalan gün.
- **Ana tablo (`.attm-tbl`):** satır = şube × ders. Sütunlar: şube, ders,
  öğretmen, tarih, ders saati, uygulayan (ödünç saatse ev sahibi adı + "ödünç"
  rozeti), durum rozeti (`placed` / `unplaced` / `pendingRequest` / `declined`).
  Satır aksiyonu: öğretmene hatırlat (grade panosundaki "hatırlat" düğmesinin
  aynısı, günde bir kez kapısı dahil), sınavı taşı.
- **Yığılma ısı haritası:** şube (satır) × gün (sütun) ızgarası, hücrede o gün o
  şubede kaç sınav var. 0 nötr, 1 normal, 2 dolu, 3+ `danger` (EX-H01 ihlali —
  sistem 3'e izin vermez, ama yayınlanmış takvim taşındığında görünebilir).
  **Renk tek başına anlam taşımaz** — hücrede sayı da yazar.
- **İhlal paneli:** sert (EX-H01…H08) ve yumuşak (EX-S01…S05) ayrı listelenir;
  sert satırda "Düzelt" yönlendirmesi, yumuşak satırda "Gerekçeyle geç".
- **Durumlar:** `loading` · `empty` (pencere yayınlanmamış — panonun içeriği yok,
  yönlendirme İş 1'e) · `error` · `noViolations` · `locked`.
- **Mock:** `scheduledExams: [{ id, windowId, sectionId, sectionName, courseId,
  courseName, date, period, ownerTeacherId, ownerTeacherName,
  administeringTeacherId, administeringTeacherName, isBorrowedHour,
  hourRequestStatus: "notNeeded"|"pending"|"accepted"|"declined"|"expired",
  placementState: "placed"|"unplaced", roomName }]` ·
  `violations: [{ code: "EX-H01", severity: "hard"|"soft", message, examId }]`

## İş 4 · Öğretmen yerleştirme ekranı — YENİ EKRAN

- **id:** `exam-place` · dosya `web/exam-place.jsx`
- **Fork:** `web/grade-book-list.jsx` (öğretmenin kendi defter listesi) satır
  yapısı + `web/schedule-read.jsx` haftalık ızgara.
- **Gövde:** üstte açık pencere şeridi ("1. Sınav · 10–14 Kasım · yerleştirmeye
  3 gün"). Altında öğretmenin şube × ders satırları; her satırda seçilen tarih +
  ders saati ya da "Saat seç" düğmesi.
- **Saat seçici (drawer/modal):** pencere haftasının ızgarası; **yalnız bu
  öğretmenin o şubedeki kendi saatleri seçilebilir** (diğerleri kapalı ve nedeni
  yazılı: "Bu saatte bu şubede dersiniz yok"). Seçim anında sert kural uyarısı
  görünür: "9-A'nın 12 Mart'ta zaten 2 sınavı var" (seçim engellenir).
- **"Aynı sınavı başka şubelerde de yap" bölümü:** aynı seviyedeki şubeler
  listelenir; her birinin yanında o saatte kimin dersi olduğu yazar ("9-B ·
  Tarih · Ayşe Yılmaz"). İşaretlenen şubeler için **saat isteği** gönderilir.
  Gönderim sonrası satır `pending` rozetine döner.
- **Durumlar:** `loading` · `empty` ("Açık sınav penceresi yok") · `error` ·
  `windowLocked` · `allPlaced` (kutlama değil, sakin özet).

## İş 5 · Saat istekleri (öğretmen) — YENİ EKRAN/ÇEKMECE

- **id:** `exam-hour-requests` · dosya `web/exam-hour-requests.jsx`
- **Fork:** `web/excuse.jsx` onay listesi kalıbı (gelen istek + kabul/ret +
  gerekçe).
- **İki sekme:** *Bana gelenler* (ev sahibi olarak) · *Gönderdiklerim* (sahip
  olarak).
- **Gelen satır:** "Zeynep Arslan, 12 Mart Salı 3. ders (Tarih saatiniz) için
  9-B'de Sağlık Bilgisi 1. Sınavı yapmak istiyor." Aksiyonlar: **Kabul et** /
  **Reddet** (ret gerekçesi opsiyonel). Yanında "Bu saatte sınıfta siz
  olacaksınız, kağıdı sınav sahibi teslim eder" açıklaması.
- **Gönderilen satır:** durum rozeti; `expired` satırda "Taslak tarihinde cevap
  gelmedi — başka saat seçin" ve İş 4'e yönlendirme.
- **Durumlar:** `loading` · `empty` (iki sekme için ayrı metin) · `error` ·
  `answered`.

## İş 6 · Sınav etiketi — DERS PROGRAMI EKRANLARINA EKLEME (düzeltme işi)

**Bu, kullanıcının ekran görüntüsüyle tarif ettiği asıl görsel iş.**

- Dokunulan dosyalar: `web/schedule-read.jsx` + `web/schedule-read.css`,
  `web/program_editor.jsx`, `mobile/schedule-read.jsx`, `mobile/schedule-week.jsx`.
- **Etiket:** ders hücresinin **sağ üst köşesine** oturan küçük rozet; metin
  `DERS ADI + SINAV TÜRÜ` ("FİZİK 2. SINAVI", "MATEMATİK 1. SINAVI"), büyük harf,
  dar harf aralığı.
- **Renk:** etiket **sınavın dersinin** tonunu alır — mevcut `SUBJECT_PALETTE`
  (12 ton) + `subjectColorIndex(subjectId)` kuralı, yeni palet ÜRETME (K-11c
  dersi). Hücrenin kendi dersi ile sınavın dersi farklı olabilir (ödünç saat):
  hücre Fizik tonunda kalır, etiket Matematik tonunda gelir.
- **Renk tek başına anlam taşımaz:** etiket metni sınav türünü zaten yazar.
- **Yoğunluk:** hücrede en çok bir etiket olur (EX-H02 tekilliği bunu garanti
  eder). Dar ekranda etiket metni kısalır ("MAT. 1. SINAVI"), tıklanınca açılır.
- **Rol farkı:**
  - Şube/öğretmen programı: ders adı + sınav türü.
  - **Öğrenci programı:** ek olarak derslik ve sıra ("D-3 · Sıra 14") — kelebekte
    doludur, geleneksel sınavda boştur ve **gösterilmez**, yer tutucu koyma.
  - **Öğretmen programı:** o saatte gözetmense "Gözetmen · D-3".
- **Durumlar:** etiketsiz hafta (normal) · yayınlanmamış takvim (etiket **hiç**
  görünmez — yayınlanmamış bilgi sızmaz) · taşınmış sınav (yayından sonra
  değişmişse etikette küçük "güncellendi" işareti).

## İş 8 · Öğrenci ve veli sınav takvimi (mobil) — MEVCUT EKRANIN GENİŞLETİLMESİ

**Yeniden tasarlama.** `mobile/grade-exam-schedule.jsx :: GradeExamScheduleScreen`
zaten var ve porta girdi (Notlar sekmesindeki görünüm seçicisi). O ekranın üç
alanı bilinçli olarak boştu — `startTime`, `durationMinutes`, `classroomName`
kaynağı yoktu. **Bu modül o kaynağı veriyor.**

- Dolan alanlar: saat (ders saati + zil saatinden), derslik, **sıra numarası**
  (yeni), uygulayan öğretmen.
- **Yeni durum — `windowOnly`:** pencere yayınlandı ama takvim yayınlanmadı.
  Kart "1. Sınavlar · 10–14 Kasım haftası · ayrıntı en geç 3 Kasım'da
  yayınlanacak" der. Bu, boş durum DEĞİLDİR, ayrı bir hâldir ve tasarlanması
  zorunludur (öğrencinin dönem başında gördüğü tek şey budur).
- **Kelebek kartı:** derslik + sıra büyük ve okunur; "Kendi sınıfın değil"
  uyarısı ilk kez görüldüğünde.
- Durumlar: `loading` · `empty` (pencere yok) · `windowOnly` · `error` ·
  `moved` (yayından sonra taşınmış sınav rozeti).

## İş 10 · Sınav politikası kartı (Ayarlar)

- `web/ayarlar_politika.jsx` içine **Sınav Takvimi** kartı (R12: var olan
  Akademik Politika alanlarını İKİNCİ KEZ tanımlama).
- Alanlar: `minPublishLeadDays` (varsayılan 7, alt sınır uyarısı yazılı) ·
  `maxExamsPerSectionPerDay` (varsayılan 2) · `reviewWindowDays` (varsayılan 3,
  yalnız oturum modu) · `draftDueLeadDays` (varsayılan 14) ·
  `defaultMode`. Her alanda kaynağı gösteren yardımcı metin.

---

# FAZ 2 — `session` / kelebek modu (İş 7, 9)

Faz 1 bitmeden başlama. Bu fazın tamamı **yalnız yönetici** yüzeyidir (+ gözetmen
için mobil).

## İş 7 · Oturum planlayıcı ve derslik tahsisi — YENİ EKRAN

- **id:** `exam-sessions` · dosya `web/exam-sessions.jsx` (+
  `web/exam-sessions-parts.jsx`)
- **Fork:** `web/program_editor.jsx` (ızgara + sürükle-bırak + çakışma uyarısı) ve
  `web/ayarlar_derslik.jsx` (derslik listesi, kapasite).
- **Üst şerit:** pencerenin günleri × ders saatleri ızgarası; oturum bloğu
  buraya konur (tarih + başlangıç/bitiş ders saati + giren seviyeler).
- **Oturum detayı (üç bölüm):**
  1. **Dersler:** seviye × ders atamaları; sistem o seviyenin şubeleri için
     planlı sınav üretir, sahibi not defterinden gelir.
  2. **Derslik tahsisi:** sol tarafta derslik listesi (kod, kapasite, kat), sağda
     seçilen dersliğin içine atılan **şube grupları**. Grup satırı: "9-A ·
     1–15 (15 kişi)" — şube **bölünebilir**, tahsis birimi "şubeden N öğrenci".
     Kapasite çubuğu doldukça uyarır, aşınca engeller (EX-H04).
     Dağıtılmamış öğrenci sayacı her zaman görünür ve sıfırlanması gerekir.
  3. **Gözetmenler:** her tahsis satırında gözetmen seçici. **Havuz otomatik
     türer:** o saatte dersi olmayan öğretmenler + şubesi o oturumda sınava giren
     öğretmenler. Havuz dışı öğretmen listede yok; nedeni yazılı. Yumuşak uyarı:
     "Kendi öğrencisinin dersliğinde" ve "yük dengesiz (5 / ort. 3)".
- **Durumlar:** `loading` · `empty` (oturum yok) · `error` · `unallocated`
  (dağıtılmamış öğrenci var) · `noInvigilator` · `overCapacity`.
- **Mock:** `examSessions: [{ id, windowId, date, startPeriod, endPeriod,
  gradeLevels: [9,11], allocations: [{ id, roomId, roomCode, capacity, groups:
  [{ sectionId, sectionName, startIndex, count }], invigilators: [{ id, name }] }] }]`

## İş 9 · Oturma planı ve yazdırma çıktıları

- **id:** `exam-seating` · dosya `web/exam-seating.jsx`
- **Oturma ızgarası:** dersliğin sıra düzeni; her sırada öğrenci adı + numara +
  şube rozeti. Sistem üretir: **seviyeler dönüşümlü**, grup içi okul numarası
  sırası. İki öğrenci **takas** edilebilir (sürükle ya da iki tıkla seç).
  Yan yana aynı şubeden iki öğrenci kalırsa yumuşak uyarı işaretlenir.
- **Yazdırma — dört çıktı, `@media print` blokları ayrı:**
  1. **Kapı listesi** (derslik başına): ad, numara, şube, sıra. Kapıya asılır.
  2. **Oturma planı** (derslik başına): sıra ızgarası, gözetmenin masasından
     bakış yönü işaretli.
  3. **Gözetmen çizelgesi** (oturum başına): derslik × gözetmen, öğretmenler
     odasına asılır.
  4. **Şube sınav takvimi** (şube başına): tarih × ders saati × ders.
  Hepsi tek renk basılabilir olmalı — **baskıda renk yok sayılır**, bilgi metinle
  taşınır. Okul adı/logo başlıkta (`assets/school-logo.png`).
- **Mobil gözetmen:** `mobile/attendance.jsx` yoklama kalıbından fork edilen
  **kapı listesi yoklaması** — gözetmen kendi dersliğinin karışık listesinden
  yoklama alır; her öğrencinin işareti kendi şubesinin o saatteki yoklamasına
  düşer. Ekranda bu açıkça yazar ("İşaretler öğrencinin kendi şubesinin
  yoklamasına işlenir").
- **Durumlar:** `loading` · `empty` · `error` · `unseated` · `printPreview`.

---

## Bildirimler (mevcut ekranlara ekleme)

`mobile/notifications-*.jsx` ve `web/bildirimler*.jsx` listelerine yeni tür
satırları. **Yeni ikon/renk uydurma** — mevcut bildirim satırı kalıbı kullanılır.

| Tür | Kime | Metin örneği |
|---|---|---|
| `examWindowPublished` | Öğrenci, veli, öğretmen | "1. Sınavlar 10–14 Kasım haftasında" |
| `examPlacementReminder` | Yerleştirmemiş öğretmen | "3 dersin sınav saati seçilmedi" |
| `examHourRequested` / `Answered` / `Expired` | Ev sahibi / sahip | "Zeynep Arslan 3. ders saatinizi istiyor" |
| `examReviewOpened` | Oturumdaki öğretmenler | "Sınav taslağı görüşe açıldı" |
| `examSchedulePublished` | Öğrenci, veli, sahip, gözetmen | "1. Sınav takvimi yayınlandı" |
| `examMoved` / `examInvigilationChanged` | Yalnız etkilenenler | "Matematik sınavı 13 Mart'a alındı" |
| `examTomorrow` | Öğrenci, veli, gözetmen | "Yarın: Matematik 1. Sınavı · D-3 · Sıra 14" |

---

## Karara bağlanmamış noktalar — ekranda işaretle, uydurma

Bu üçü tasarım kararı bekliyor. Varsayımı ekranda `[S-1]` gibi işaretle ve
`tweaks` anahtarı olarak ayrı varyant bırak.

- `[S-0]` Menü yerleşimi ve sekme sayısı — **önce sor** (yukarıda İş 0).
- `[S-1]` Yayınlanmış program sürümünde ders yerleşimi taşınırsa (öğretmen ya da
  saat değişirse) sınav ne olur? Öneri: sınav `unplaced`'a düşer, sahibine
  bildirim gider. **Bu durumu panoda ayrı bir satır hâli olarak çiz.**
- `[S-2]` Görüş penceresi yorumları modül içinde mi kalır, mesajlaşmaya mı
  bağlanır? Modül içi kalacak şekilde çiz; mesajlaşma bağını **çizme**.

## Teslim listesi

Her iş için: ekran/parça dosyaları + `manifest.json` kaydı (`id`, `component`,
`file`, `target`, `status`, `states`, `group`, `domain: "exam"`) + tweaks
anahtarları. Faz 1 (İş 0–6, 8, 10) önce teslim edilir; Faz 2 (İş 7, 9) ayrı tur.
**Hiçbir yeni renk, ikon veya font üretme. Yeni bir primitive gerekiyorsa önce
sor.** Koyu tema teslim edilmez (2026-08-19 kullanıcı kararı).
