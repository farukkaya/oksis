---
tags: [plan, exams]
date: 2026-09-13
status: draft
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
- ⬜ **Karar gerekiyor:** metin sınırı. Emsal `ExamWindow.MinReasonLength = 15` (gerekçe
  içindir). Yorum gerekçe değildir; öneri **10–1000 karakter**. Uygulamada kullanıcıya sorulur.

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

- `AddSessionReviewComment` — izin **`exams.place`** (öğretmenin zaten sahip olduğu izin).
  Ek kapı: çağıran o oturumda **sorumlu öğretmen ya da gözetmen** olmalı; değilse `404`
  (varlık sızdırmama, `MarkNotificationRead` emsali). Pencere görüş süresi **açık** olmalı.
- `ResolveSessionReviewComment` — izin `exams.manage`; süre kapandıktan sonra da çözülebilir
  (yayın kapısı açık yorumu ısırıyor, yöneticinin kapatma yolu her zaman açık kalmalı).
- ⬜ **Not:** omurga spec'i ayrı bir `exams.review.comment` izni öneriyordu; katalogda
  bugün `exams.manage/place/read/report` var. Yeni izin = yeni göç + rol seed'i; karşılığı
  ölçülmedi. **Öneri: `exams.place` yeniden kullanılsın**, gerekirse sonra ayrılır.

**Test:** birim — taraf olmayan öğretmen `404`; süre kapalıyken yorum reddedilir; çözülen
yorum ikinci kez çözülmez. Entegrasyon — tenant kapsam testi (yabancı okulun oturumuna
yorum bırakılamaz).

### Görev 1.4 · İki yumuşak yayın kuralı

`ExamPublishFacts`'e iki olgu eklenir ve `Evaluate` iki satır kazanır:

| Kod | Şiddet | Cümle (sunucu üretir) |
|---|---|---|
| `EX-S07` | yumuşak | "Görüş penceresi {tarih} tarihinde kapanıyor; süre dolmadan yayınlıyorsunuz." |
| `EX-S08` | yumuşak | "{n} çözülmemiş öğretmen görüşü var." |

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
- İzin: `exams.manage` (yönetici çıktısı). ⬜ Sekreterin salt okur yazdırma yetkisi omurga
  spec'inde var ama katalogda karşılığı yok; ayrı karar.
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

## Açık kalan kararlar

1. **Yorum metni sınırı** (Görev 1.1) — öneri 10–1000.
2. **Yorum izni** (Görev 1.3) — `exams.place` yeniden kullanılsın mı, yoksa
   `exams.review.comment` açılsın mı.
3. **Sekreterin yazdırma yetkisi** (Görev 2.1) — omurga spec'inde var, katalogda yok.
4. **`EX-S04`'ün pencere kapsamına alınması** — olgu sözleşmesi değişikliği; bu fazın içinde
   mi, ayrı mı.
