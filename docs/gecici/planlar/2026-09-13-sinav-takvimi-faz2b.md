---
tags: [plan, exams]
date: 2026-09-13
status: in-progress
---

# Sınav Takvimi — Faz 2b Uygulama Planı

> **Kapsam kilitli** (2026-09-13 beyin fırtınası, [[OKSİS — Sınav Takvimi Modülü Durum Raporu]] §7).
> Bu plan o kararların koda çevrilmiş hâlidir. Ölçümler `oksis-api` @ `1905abbc` üzerinde
> yapıldı; bir görev başlamadan önce **kendi sayısını yeniden ölçer** — son üç turda
> defterin/planın sayısı üç kez de düşük çıktı (`TB-130` 5→14, `TB-131` 3→7, `TB-140` 21→35).

## 1. Ne yapılacak

| # | İş | Neden |
|---|---|---|
| A | **Görüş penceresi** — `SessionReviewComment` + üç komut + iki yayın kuralı + bildirim + yüzey | Faz 1'de alanlar ve okul ayarı yazıldı, çağıranı hiç yok |
| B | **Gözetmen çizelgesi** çıktısı + onu besleyen yeni sorgu | Gün/pencere ekseninde derslik × gözetmen veren bir okuma yok |
| C | **Kapı listesi** ve **oturma planı** çıktıları | `GetExamSession` verisi zaten yeterli; yeni sorgu açılmaz |

**Kapsam dışı (karar):** gözetmen yoklaması ve Attendance bağı. Sınav saatinde yoklama
normal akışında kalır; omurga tasarımının *"yoklama gözetmenden gelir"* kuralı ve
`IsInExamSession` denetimi **yazılmayacak**. Ayrıca `K-24` (derslik müsaitliği), `K-25`
(derslik başına ikinci gözetmen), sıra × sütun düzeni, `K-26`/`TB-120` (şube dersliğinin
zorunluluğu).

## 2. Ölçülmüş zemin — ne var, ne yok

| Şey | Durum (ölçüldü) |
|---|---|
| `ExamWindow.OpenReview(opensAt, closesAt)` | **Var**, çağıranı **yok**. `Mode != Session` ise atar; durum kapısı **yok** |
| `ExamWindow.ReviewOpensAt/ReviewClosesAt` | Var, hep `null` |
| `SchoolSettings.ExamReviewWindowDays` | Var (1–30, varsayılan 3), okunuyor ama kullanılmıyor |
| `SessionReviewComment` | **Yok** — fazın tek sıfırdan alan modeli |
| Boş kural kodları | `EX-S07` ve `EX-S08` serbest (`S02`/`S03` bilinçle emekli, `S07` hiç kullanılmadı) |
| `NotificationKind` sıradaki değer | **41** (`ExamInvigilationChanged = 40` son) |
| Yayın kapısı | `ExamRuleInspector.CheckPublishAsync` → `ExamPublishFacts` → `Evaluate` (kural tek yerde) |
| Oturum ayrıntısı | `ExamSessionDetailDto` derslik, kapasite, gözetmen ve **sıra satırlarını** (ad, numara, şube adı, sıra no) taşıyor |
| Pano oturum kartı | Yalnız **sayılar** (`sectionCount`, `roomCount`, `invigilatorGapCount`…) — isim yok |
| Yazdırma emsali | `apps/web/features/exam/exam-print-section-schedule.tsx` + `packages/ui/src/styles/exam.css` `@media print`; kuralı **"yeni sorgu açılmaz"** |
| Durum makinesi | `Draft → WindowPublished → SchedulePublished → Locked` |

## 3. Her göreve geçerli kurallar

1. **Tenant:** yeni her sorgu **açık `SchoolId` yüklemi** taşır ve okulunu `ITenantContext`'ten
   alır. Küresel süzgeç süper yönetici oturumunda düşer (`TB-139`); yüklem aynı zamanda
   sorgunun kapsamını tutar (`M17`). Yeni okuma ucu için `ExamTenantScopeTests`/
   `AttendanceTenantScopeTests` kalıbında bir kapsam testi yazılır.
2. **Kısıt 4:** ekran kural hesaplamaz. İhlal listesi sunucudan `violations` dizisiyle iner,
   metni sunucu üretir (`D-2`).
3. **Test önce kırmızı:** her kural ve her kapsam testi, düzeltmeden/özellikten önce
   kırmızı doğrulanır ve "önce durum" iddiası taşır (ölçülen şey "hep boş" olmasın).
4. **Koşum:** günlük döngü `./scripts/test-changed.sh`; entegrasyon `--integration`.
   Entegrasyon paketinin tamamı için `docker compose up -d garage clamav` şart — onlarsız
   46 test ortam yüzünden kırmızı düşer, kodla ilgisi yoktur.
5. **Commit:** `<type>(<scope>): türkçe açıklama`, sonda nokta yok.

---

## Dilim 1 — Görüş penceresi (sunucu)

### Görev 1.1 · `SessionReviewComment` alan modeli

- `src/Oksis.Domain/Modules/Exams/Entities/SessionReviewComment.cs` — `TenantEntity`:
  `ExamSessionId`, `AuthorPersonId`, `Text`, `CreatedAt`, `ResolvedAt?`,
  `ResolvedByPersonId?`, `ResolutionNote?`. Fabrika `Create(...)`, davranış `Resolve(...)`.
  **Çözülen yorum yeniden açılmaz** (tek yön) — yöneticinin kararı buharlaşmasın.
- EF yapılandırması `Infrastructure/Persistence/Configurations/Exams/`; **domain'de EF yok**.
- Göç: `dotnet ef migrations add 20260914_exam_session_review_comments`.
- İndeks: `(school_id, exam_session_id, resolved_at)` — yayın kapısı "açık yorum var mı"yı
  bu yoldan sorar.
- ✅ **Karar (2026-09-13):** metin **10–1000 karakter**. Gerekçenin 15'i (`MinReasonLength`)
  burada geçerli değil — yorum gerekçe değildir: *"Salon 3 küçük"* (13) geçer, *"olmaz"* (5)
  geçmez. Sabit domain'de (`SessionReviewComment.MinTextLength`), ekran onu yansıtır.

**Test:** domain birim — boş/kısa metin reddi, `Resolve` iki kez çağrılamaz.

### Görev 1.2 · `OpenExamReview` komutu

- `Commands/OpenExamReview/` — izin `exams.manage`.
- Kapılar: pencere **`WindowPublished`** durumunda olmalı (taslak takvim var, yayın yok) ve
  `Mode == Session`. `ExamWindow.OpenReview`'a **durum kapısı eklenir** — bugün yalnız modu
  denetliyor.
- Süre: komut gün sayısı taşımaz; `SchoolSettings.ExamReviewWindowDays`'ten okunur
  (`opensAt = bugün`, `closesAt = bugün + gün`). Ayar satırı yoksa varsayılan 3.
- Olay → Görev 1.5'in bildirimi.

**Test:** birim — `Draft`ta ve `SchedulePublished`te reddedilir; `LessonHour` modunda
reddedilir; tarihler ayardan türer. Entegrasyon — tenant kapsam testi.

### Görev 1.3 · Yorum bırakma ve çözme komutları

- `AddSessionReviewComment` — ✅ **izin YOK** (karar 2026-09-13): yorum bırakmak izin
  gerektirmez, **öğretmen olmak yeterlidir**. Komutta `[RequirePermission]` **bulunmaz**;
  emsali `AccountChangePassword` — kimliğin kendisiyle yetkilenen komut.
  - **Öğretmenlik nasıl bilinir:** rol talebinden DEĞİL. Bu depoda `ICurrentUser.Roles`
    **her zaman boştur** (`AccountTokenIssuer` JWT'ye hiç rol talebi yazmaz — ölçüldü), yani
    `IsInRole` ölü koddur. Öğretmenlik **kişinin profilinden** okunur:
    `db.Profiles.OfType<TeacherProfile>()` (emsal `ListAssignableCandidates`), çağıranın
    kişisi ise `ExamCaller.ResolveAsync(db, currentUser, schoolId, ct)` ile — **okul
    yüklemli** (`TB-130`).
  - Kalan kapılar: pencere görüş süresi **açık** olmalı ve oturum bu okulun olmalı; değilse
    `404` (varlık sızdırmama, `MarkNotificationRead` emsali).
- `ResolveSessionReviewComment` — izin `exams.manage`; süre kapandıktan sonra da çözülebilir
  (yayın kapısı açık yorumu ısırıyor, yöneticinin kapatma yolu her zaman açık kalmalı).
- **Reddedilen yol:** omurga spec'inin `exams.review.comment` izni yazılmayacak; ayrıca
  `exams.place`'e de bağlanmayacak. Gerekçe: yorum bırakmak bir yetki değil, öğretmenin
  kendi işi hakkında konuşmasıdır.

**Test:** birim — taraf olmayan öğretmen `404`; süre kapalıyken yorum reddedilir; çözülen
yorum ikinci kez çözülmez. Entegrasyon — tenant kapsam testi (yabancı okulun oturumuna
yorum bırakılamaz).

### Görev 1.4 · Üç yumuşak yayın kuralı

`ExamPublishFacts` üç olgu kazanır ve `Evaluate` üç satır:

| Kod | Şiddet | Cümle (sunucu üretir) |
|---|---|---|
| `EX-S07` | yumuşak | "Görüş penceresi {tarih} tarihinde kapanıyor; süre dolmadan yayınlıyorsunuz." |
| `EX-S08` | yumuşak | "{n} çözülmemiş öğretmen görüşü var." |
| `EX-S04` | yumuşak | "{derslik} dersliğine yalnız {şube} şubesinden öğrenci düştü." |

✅ **`EX-S04` karar (2026-09-13): Faz 2b'ye alınıyor.** Bugün yalnız `CheckSessionAsync`
içinde, **oturum** kapsamında çalışıyor ve yayın kapısında hiç yok (ölçüldü); aynı oda iki
oturumda birleştiğinde uyarı yanlış yerde susuyor. Pencere kapsamı için
`ExamPlacementCounter`'a `ReadWindowRoomMixAsync` eklenir — `ReadSessionRoomMixAsync`'in
pencere ikizi, **açık okul yüklemiyle** (`TB-131` kalıbı). Kural gövdesi `CheckSeating`
olduğu gibi yeniden kullanılır: iki kapsamın iki cevabı olmasın.

- Olguları sayan okumalar `ExamPlacementCounter` kalıbında, **açık okul yüklemiyle**.
- Yumuşak kural = gerekçeyle geçilir; `EX-H08`/`EX-S05` ile aynı yol (`PublishSchedule`'ın
  `reason` parametresi). Yeni bir kaçış mekanizması **yazılmaz**.
- Sıra: Faz 1'in listesi değişmez; yeni satırlar **sona** eklenir (yayın modalinin ilk
  satırı bugün ne ise yarın da odur).

**Test:** birim — `Evaluate` tablo testi (süre açık/kapalı × açık yorum var/yok dört hâl);
gerekçesiz yayın reddi ve gerekçeli geçiş.

### Görev 1.5 · `ExamReviewOpened` bildirimi

- `NotificationKind.ExamReviewOpened = 41` · `PushEventKeyMap` → `EXAM_REVIEW_OPENED` ·
  `NotificationEventTypeSeedData` + `MasterSeedIds` satırı · **göç şart** (seed göçte yaşıyor).
- Alıcı: pencerenin oturumlarındaki **sorumlu öğretmenler + gözetmenler** (birleşik küme,
  kişi başına tek bildirim).
- Push dalgası: `K-02` kararına göre ilk dalga dışında — **in-app**.
- Alıcı çözümü `TB-128` tuzağına düşmemeli: öğrenci başına iki sorgu değil, tek toplu okuma.

**Test:** entegrasyon — `NotificationMatrixPushTests` kalıbı; kişi başına tek satır.

### Görev 1.6 · Okuma yüzü

- `ExamSessionDetailDto`'ya `reviewComments` (id, yazar adı, metin, tarih, çözüldü mü) ve
  pencere düzeyine `reviewOpensAt` / `reviewClosesAt`.
- **Yeni sorgu açılmaz** — oturum ayrıntısı zaten okunuyor, yorumlar aynı okumaya eklenir.

---

## Dilim 2 — Gözetmen çizelgesi sorgusu

### Görev 2.1 · `GetInvigilatorSchedule`

- `Queries/GetInvigilatorSchedule/` — `(windowId, date?)` → gün × ders saati × oturum ×
  derslik × gözetmen (ad) + o dersliğin öğrenci sayısı.
- ✅ **İzin `exams.manage`** (karar 2026-09-13). Üç çıktının üçü de aynı izinle açılır.
  - Omurga spec'inin "sekreter yazdırır" satırının bugün **sahibi yok**: seed'de beş rol var
    (Süper Admin, Okul Yöneticisi, Öğretmen, Veli, Öğrenci — `0007` kararı), sekreter yok.
    Yeni izin (`exams.print`) açmak, kullanıcısı olmayan bir izin üretirdi.
  - `exams.report` ("okul geneli sınav panosu", okul yöneticisine seed'li) bu turda da
    tüketicisiz kalıyor — domain notundaki açık soru **açık kalır**, kapatılmadı.
- Açık okul yüklemi + kapsam testi (Kural 1).
- **Neden yeni sorgu:** pano kartı yalnız sayı taşıyor, oturum ayrıntısı tek oturumluk.
  Gün eksenli derslik × gözetmen listesini veren bir okuma yok (ölçüldü).

**Test:** entegrasyon — iki oturumlu bir günde derslik×gözetmen satırları; gözetmensiz
derslik satırı **düşmez**, boş görünür (delik kâğıtta da görünmeli).

---

## Dilim 3 — Üç çıktı (web)

### Görev 3.1 · `packages/api` — uç ve tipler
Yeni uç yalnız Görev 2.1 için. `schema.ts` HEAD'den taze üretilir (`npm run codegen -w
packages/api`); üretilen şema boşsa **DUR** — sunucu bayattır.

### Görev 3.2 · Kapı listesi ve oturma planı
- Oturum ayrıntısı ekranından (`exam-session-screen.tsx`) çizilir; **yeni okuma yok**.
- Kalıp `exam-print-section-schedule.tsx`: A4, kabuğu gizle, renk kâğıtta bilgi taşımaz,
  çıktı **sessizce eksiltmez** (sırasız kalan öğrenci sayfanın altında adıyla yazılır).
- Kapı listesi derslik başına: ad, numara, şube, sıra. Oturma planı derslik başına sıra
  ızgarası — **sıra × sütun düzeni yok** (kapsam dışı), tek boyutlu sıra numarası.

### Görev 3.3 · Gözetmen çizelgesi
Görev 2.1'in ucundan; pencere şeridinden erişim. Gözetmensiz derslik satırı **görünür ve
işaretli** basılır.

---

## Dilim 4 — Görüş yüzeyi (web)

### Görev 4.1 · Öğretmen — yorum bırakma
Oturum ayrıntısında görüş süresi açıkken görünen alan; kapalıyken alan yok, sebebi yazılı.

### Görev 4.2 · Yönetici — liste ve çözme
Yorumlar oturum ayrıntısında; "çözüldü" işareti ve isteğe bağlı not.

### Görev 4.3 · Yayın ön kontrolü
`EX-S07`/`EX-S08` uyarıları `violations` dizisinden çizilir — ekran **hesap yapmaz**.
Gerekçe alanı listeden **önce** durur (`TB-137` dersi).

---

## Dilim 5 — Uçtan uca doğrulama

Tek senaryo, gerçek arayüzde: oturum modunda pencere aç → yayınla → öğretmenler yerleştirsin
→ **görüş penceresini aç** (bildirim gitsin) → öğretmen yorum bıraksın → yayınla dene
(`EX-S07` + `EX-S08` uyarısı çıksın) → yorumu çöz → gerekçeyle yayınla → **üç çıktıyı bas**.

Ön uçuş ([[OKSİS — Sınav Takvimi Modülü Durum Raporu]] §5) atlanmaz: göç uygulanmadan ve API
taze başlatılmadan ekranlar boş açılır.

---

## Sıra ve bağımlılık

```
1.1 → 1.2 → 1.3 → 1.4 → 1.6      (görüş penceresi sunucusu, sırayla)
              ↘ 1.5              (bildirim, 1.2'den sonra bağımsız)
2.1                               (bağımsız — en başta da yapılabilir)
3.1 → 3.2 · 3.3                   (3.3 için 2.1 + 3.1 şart)
4.1 · 4.2 · 4.3                   (1.6 ve 1.4 bittikten sonra)
5.1                               (hepsinden sonra)
```

Paralelleştirilecekse `R53` geçerli: her ajan kendi `git worktree`'sinde koşar; `oksis-ui`
tek ağaçta iki ajanla ölçülemez.

## Uygulama günlüğü — Dilim 1-4 bitti (2026-09-13)

**Commit'ler:** `oksis-api` `24863224` (sunucu) · `oksis-ui` `83ab71e` (istemci).
**Koşum:** birim 1051 + 2612 + 427 + 7 mimari bekçi · entegrasyon **1396/1396** ·
UI typecheck 6/6, lint temiz, core 542, api 304.

### Planın dışına çıkan dört şey — üçü ölçümden çıktı

**① Öğretmenin görüş yüzeyi PLANDAKİ YERDE OLAMAZDI.** Görev 4.1 "öğretmen oturum
ayrıntısında yorum bırakır" diyordu. Ölçüm: oturum ayrıntısı ucu `exams.manage` ister —
öğretmen o ekranı hiç açamaz. Öğretmenin görev listesi (`me/duties`) ise yalnız
**yayınlanmış** pencereleri gösterir, görüş dönemi ise tanımı gereği yayından ÖNCEdir.
Yani öğretmenin hakkında görüş bildireceği planı görebileceği **hiçbir yüzey yoktu**.
Çözüm: yeni bir teacher-scoped uç — `GET exams/me/review` — ve görev listesinin içinde
çizilen bir panel. Panel görev listesi BOŞKEN de görünür; görüş tam da o sırada açıktır.

**② Bildirim push kapsamına ALINMADI.** Seed'de `push: false` kararı verilmişken
`PushEventKeyMap`'e eklenmişti; katalog bekçi testleri tutarsızlığı yakaladı ve seed
kararı korundu (`EXAM_WINDOW_PUBLISHED` ile aynı gerekçe: geniş fan-out, saat başına
duyarsız bilgi).

**③ `EX-S04`'ün pencere kapsamında gruplama anahtarı fiziksel oda DEĞİL.** Aynı oda iki
oturumda kullanıldığında odaya göre gruplamak iki oturumun şubelerini tek kümede
birleştirir ve uyarı **yanlış yerde susardı** — defterin tarif ettiği tuzağın ta kendisi.
Anahtar `ExamRoom.Id`'dir; tek oturumda ikisi zaten aynıdır (`EX-H11`).

**④ `TB-141` sınav ayağı yol üstünde kapatıldı:** `PublishExamWindow` ve
`PublishExamSchedule` çağıranı `ExamCaller` yerine kendi kopyasıyla, okul yüklemsiz
çözüyordu.

### Kalan

⬜ **Dilim 5 — uçtan uca tarayıcı doğrulaması.** Sunucu ve istemci bitti; senaryo
(§ Dilim 5) gerçek arayüzde koşulmadı.

---

## Karara bağlandı (2026-09-13)

| # | Soru | Karar |
|---|---|---|
| 1 | Yorum metni sınırı | **10–1000 karakter**; gerekçenin 15'i geçerli değil |
| 2 | Yorum izni | **İzin yok** — öğretmen olmak yeterli; öğretmenlik profilden okunur, rolden değil |
| 3 | Çıktı izni | **`exams.manage`**; `exams.print` açılmaz (kullanıcısı olmayan izin olurdu) |
| 4 | `EX-S04` | **Faz 2b'ye alınır** — pencere kapsamı olgusu + yayın listesinde üçüncü yumuşak kural |

Açık karar kalmadı; plan uygulanmaya hazır.

**2. kararın ölçülmüş ayrıntısı:** "öğretmen olmak yeterli" bu depoda bir ROL kontrolüyle
uygulanamaz — `AccountTokenIssuer` JWT'ye hiçbir rol talebi yazmaz, dolayısıyla
`ICurrentUser.Roles` her zaman boştur ve `IsInRole` ölü koddur. Öğretmenlik, çağıranın
kişisinin **`TeacherProfile` taşıması** ile bilinir.
