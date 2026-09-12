# OKSİS — Sınav Takvimi Modülü Durum Raporu

> **Yaşayan belge.** Sınav takvimi modülünün fazları arasında "nerede kaldık"
> sorusunun tek cevabı. Her oturum sonunda güncellenir; tarihli kopya çıkarılmaz.
>
> **Son güncelleme:** 2026-09-12 · **Yazan:** Claude Opus 5 (1M context)

---

## 1. Tek bakışta

| Faz | Kapsam | Durum | Nerede |
|---|---|---|---|
| **Faz 1** — Ders saatinde sınav | Pencere, yerleştirme, pano, iki adımlı yayın, etiket katmanı, takvimler | ✅ **Bitti, merge edildi** | `master` (üç depoda) |
| **Faz 2a** — Oturum ve yerleşim (sunucu) | `ExamSession`/`ExamRoom`/`ExamSeat`, besteci, komutlar, kurallar, okuma uçları, bildirim | ✅ **Sunucu tarafı 26/26 bitti** | `oksis-api` dalı `feature/exam-session` |
| **Faz 2a** — İstemci | Dilim 7 (**9 görev**) + Görev 8.1 uçtan uca doğrulama | 🟡 **3/9 — 7.1 ve 7.2 bitti, 7.3 tarayıcı doğrulaması bekliyor** | `oksis-ui` dalı `feature/exam-session` |
| **Faz 2b** — Çıktılar ve yoklama | Kapı listesi, oturma planı, gözetmen çizelgesi, gözetmen yoklaması, görüş penceresi | ⬜ Beyin fırtınası yapılmadı | — |
| **Faz 3** — Otomatik dağıtıcı | Derslik ve gözetmeni öneren Hangfire işi | ⬜ Kapsam kilitli, planlanmadı | — |

**Bir sonraki oturumun işi: Görev 7.3'ün tarayıcı doğrulaması, sonra 7.4–7.9 ve 8.1.**
Kalan tahmin **11–16 saat** etkin çalışma. Sunucu tarafı hazır ve yeşil, istemcinin
`core` + `api` katmanı da hazır; ekranlar gerçek uca bağlanabilir.

### Dal ve ağaç topolojisi (2026-09-12'de sadeleştirildi)

| Depo | Dal | Ağaç |
|---|---|---|
| `oksis-api` | `feature/exam-session` (46 commit, master'a alınmadı) | `~/Repositories/oksis-api` |
| `oksis-ui` | `feature/exam-session` (5 commit) | **`~/Repositories/worktrees/oksis-ui-faz2a`** — istemci işi burada |
| `oksis-ui` | `master` | `~/Repositories/oksis-ui` |
| `oksis-ui` | `chore/test-env` | `~/Repositories/oksis-ui-testenv` |

`codex/faz2a-ui` dalı `feature/exam-session`'a katılıp silindi. İstemci worktree'si
`/private/tmp`'den çıkarıldı — sistem geçici dizini periyodik temizleniyordu.

---

## 2. Faz 1 — bitti

Kelebek uygulamayan okulu tam karşılar. `master`'da, üç depoda merge edilmiş.

**Sunucu:** `ExamWindow`, `ScheduledExam`, `ExamHourRequest`, öğretmen yerleştirme,
yönetici panosu ve yığılma haritası, iki adımlı yayın, Grades beslemesi, Timetable
etiket katmanı, bildirimler ve sweep'ler.

**İstemci** (`oksis-ui`, 09-08 14:30 → 09-09 10:36, 15 commit, ~7.400 satır):
sınav pencereleri hub'ı, öğretmen yerleştirme ekranı ve saat seçici, yönetici panosu +
ısı haritası + ihlal paneli, pencere oluşturma/yayın modalleri, şube takvimi yazdırma
görünümü, ders programı sınav etiketi (web + mobil), mobil sınav takvimi ekranı,
ayarlarda sınav politikası kartı.

**Faz 1'den devreden, hâlâ açık:** `ExamWindow.OpenReview` yazıldı ama **hiçbir yerden
çağrılmıyor** — görüş penceresi Faz 2b'ye bırakıldı.

---

## 3. Faz 2a — sunucu tarafı bitti (26/26)

**Dal:** `oksis-api` · `feature/exam-session` · **46 commit** ·
`8132bad6` (09-09 15:57) → `f19c114a` (09-11 13:17) · ağaç temiz, **master'a merge edilmedi**.

**Son tam regresyon HEAD'de yeşil (2026-09-11):**
`Oksis.Domain.UnitTests` 1041 · `Oksis.Application.UnitTests` 2599 ·
`Oksis.Api.UnitTests` 427 · `Oksis.Tests` (mimari bekçiler) 62 ·
`Oksis.Infrastructure.IntegrationTests` 1381 — **toplam 5.510, başarısız 0.**

### Dilim dilim

| Dilim | Görev | Durum |
|---|---|---|
| 1 — Alan modeli | 1.1 entity'ler · 1.2 `ScheduledExam` bağı · 1.3 kalıcılık + göç | ✅ 3/3 |
| 2 — Türetme ve yerleşim | 2.1 `ExamSeatArranger` · 2.2 `ExamSeatingReader` · 2.3 `ExamRoomDeriver` · 2.4 `ExamInvigilatorDeriver` · 2.5 `ExamSessionComposer` | ✅ 5/5 |
| 3 — Komutlar | 3.1 `CreateExamSession` · 3.2 `PlaceExam` oturum modu · 3.3 `UpdateSessionSections` · 3.4 `MergeExamSessions` · 3.5 derslik ekle/çıkar · 3.6 `SetInvigilator` · 3.7 `SwapSeats`/`RegenerateSeating` | ✅ 7/7 |
| 4 — Kurallar ve yayın | 4.1 kaldırılan + mod kapısına alınan kurallar · 4.2 `EX-H05`/`EX-H06`/`EX-H11` (+ düzeltme turu I-1/I-2/I-3) · 4.3 `EX-S06`, `EX-H12`, yayın kapısı | ✅ 3/3 |
| 5 — Okuma uçları | 5.1 `GetExamSession` (+G-1) · 5.2 pano oturum görünümü · 5.3 öğrenci/veli takvimine derslik + sıra · 5.4 öğretmen gözetmenlik uçları · 5.5 program etiketi · 5.6 gözetmen/derslik aday uçları | ✅ 6/6 |
| 6 — Bildirimler | 6.1 `ExamInvigilationChanged` (üç işleyici, `NotificationType = 40`) | ✅ 1/1 |
| 8 — Kapanış | 8.2 belgeler | ✅ 1/1 |

### Kural kodları — kodda gerçekten yazılı olan 13 tanesi

`EX-H01` `EX-H03` `EX-H05` `EX-H06` `EX-H08` `EX-H09` `EX-H10` `EX-H11` `EX-H12` ·
`EX-S01` `EX-S04` `EX-S05` `EX-S06`

> **`EX-H02` `EX-H04` `EX-H07` `EX-S02` `EX-S03` hiç yazılmadı** (karar `R47`).
> Numara boşluğu kasıtlıdır; "eksik" sanıp doldurmaya kalkma.

**İzinler (koddan doğrulandı):** `exams.manage` (55) · `exams.place` (35) ·
`exams.read` (28) · `exams.report` (13).

**Sözleşme notu:** `ExamViolationDto(string Code, string Severity, string Message,
Guid? ExamId, string? SectionName)` — `Severity` **string**'tir (`"hard"` / `"soft"`),
enum değil. Ekran bunu olduğu gibi çizer.

---

## 4. Faz 2a — kalan iş: Dilim 7 + Görev 8.1

**Plan:** `docs/superpowers/plans/2026-09-09-sinav-takvimi-faz2a.md`, satır 2043'ten
itibaren. Her görevden önce `handoff-web` (mobil görevlerde `handoff-mobile`) skill'i.

| Görev | Durum | Tahmin | Not |
|---|---|---|---|
| 7.1 `packages/core` — oturum tipleri + saf mantık | ✅ `e63b61a` | — | `session.ts` 97 satır; tipler sunucu DTO'larıyla alan alan birebir |
| 7.2 `packages/api` — uçlar + query'ler | ✅ `d5dcfc8` | — | 10 uç yolunun 10'u sunucu rotalarıyla birebir; `schema.ts` HEAD'den taze |
| 7.3 Web — yerleştirme ekranı oturum modu | 🟡 `128ed5f` | 0,5 s | Kod yazıldı, test/typecheck/lint yeşil; **tarayıcı doğrulaması yapılmadı** |
| 7.4 Web — pano oturum görünümü | ⬜ | 1,5–2 s | `exam-board-screen.tsx` (975 satır); `lessonHour` modunda kart **hiç görünmez** (Kısıt 15) |
| **7.5 Web — oturum ayrıntısı ekranı (YENİ)** | ⬜ | **4–6 s** | İşin üçte biri: iki sütun, 7 modal, 9 durumluk matris, 3 uyumsuzluk |
| 7.6 Web — ders programı sınav etiketi | ⬜ | 0,5–1 s | Faz 1 etiketi genişler |
| 7.7 Mobil — öğrenci/veli takvimine derslik + sıra | ⬜ | 1–1,5 s | `exam-schedule-screen.tsx` (591 satır); **ekran içi başlık yok** (kullanıcı kararı) |
| 7.8 Öğretmen gözetmenlik takvimi (web + mobil) | ⬜ | 1,5–2 s | Tek görev, iki platform |
| **7.9 Web — yöneticinin oturum kurması** | ⬜ | 1,5–2 s | 2026-09-12'de eklendi (`TB-132`); `CreateExamSession` ürüne hiç bağlanmamıştı |
| 8.1 Uçtan uca doğrulama ve örnek veri | ⬜ | 1–2 s | Altı adım; bulgu çıkarsa maliyeti bu tahminin dışında |

### Görev 7.5'in üç uyumsuzluğu — sunucu kazanır, ekran uyarlanır

1. **Gerekçe eşiği:** tasarım "en az 10 karakter" diyor; sunucu
   `ExamWindow.MinReasonLength = 15`. Ekran **15** yazar ve 15'te etkinleşir.
2. **Kapasite kuralının kodu:** tasarım mock'u `EX-S07` üretiyor; doğrusu **`EX-S06`**.
3. **Gözetmen eksikliği ekranda hesaplanmaz:** tasarım `rooms.filter(r => !r.invigilator)`
   ile istemcide türetiyor — **Kısıt 4'ü çiğner**. Sunucu bunu `EX-H10` olarak döndürür;
   ekran `violations` dizisinden çizer.

**Ayrıca `R32`:** `merge` modalinin onay metni hangi oturumun **silineceğini** ve
hangisinin **kalacağını** ad vererek söylemek zorunda — silme geri alınamaz ve
tasarımın teslim ettiği metin bunu söylemiyor.

### Paralelleştirme kesimi

`7.1 + 7.2` önce biter (ötekiler buna bağımlı). Sonra üç koldan:
`7.3 + 7.4 + 7.6` · `7.5` tek başına · `7.7 + 7.8`. Duvar saati ~7–9 saate iner.
**`R53` gereği her ajan ayrı `git worktree`'de olmalı** — `oksis-ui` tek ağaçta üç
ajanla ölçüm yapılamaz.

---

## 5. Sonraki oturumun ilk on dakikası — ön uçuş

Bu üç adım atlanırsa ekran boş açılır ve bir tur boşa gider.

```bash
# 1. Göçleri uygula — API göçleri otomatik uygulamıyor.
#    Bu yapılmazsa oturum tabloları dev veritabanında YOK ve her ekran "veri yok" gösterir.
cd ~/Repositories/oksis-api
git checkout feature/exam-session
dotnet ef database update --project src/Oksis.Infrastructure --startup-project src/Oksis.Api

# 2. API'yi TAZE başlat. Bayat :5112 süreci Faz 1'de codegen'e boş şema ürettirdi
#    ve birden çok tur kaybettirdi.
dotnet run --project src/Oksis.Api

# 3. Şemayı yenile. Üretilen şema boşsa DUR — sunucu bayattır.
cd ~/Repositories/oksis-ui
npm run codegen -w packages/api
```

**Dev ortam:** API `:5112` · Web `:3000` · seed hesapları `s1`'den başlar,
ders programı verisi `s3`'te.

> **Not (2026-09-12):** Yukarıdaki üç adım, ekranı **host'taki** geliştirme sunucusunda
> açmak içindir. `chore/test-env` dalındaki `./scripts/test-env.sh <ref>` betiği aynı işi
> container'da yapar: istenen ref'i (dal/etiket/SHA) .NET API + Next web + Expo Metro
> olarak ayağa kaldırır ve çalışma dizinine hiçbir şey yazmaz. Görev 8.1'in ekran
> doğrulaması ve paralel ajan koşuları için host sunucusuyla yarışmaktan iyidir.
> Dal henüz master'a alınmadı.

---

## 6. Kullanıcı kararı bekleyen üç şey

| # | Konu | Soru |
|---|---|---|
| `TB-130` | `ExamCaller.ResolveAsync` çağıranı okul süzmeden çözüyor 🟡 | Faz 1'in sınav yüzeyinde tenant yüklemi eksik |
| `TB-131` | Faz 1 sınav sayaçları pencereyi okul süzmeden okuyor 🟡 | `CountPendingRequestsAsync`, `GetFirstExamDateAsync`, `FindDayLimitBreachesAsync` yalnız `examWindowId` alıyor |
| `X-21` | Modül dokümantasyon sistemi baştan sona doldurulmamış şablon ⚪ | 19 modülün doküman klasörü boş — sistemi terk mi, modül başına yalnız README mi, yoksa 19×10 dosya gerçekten doldurulsun mu? |
| `TB-132` | Yöneticinin oturum kurma komutunun ekranı yok 🟡 | **Karara bağlandı (2026-09-12):** plana Görev 7.9 olarak eklendi |
| — | `EX-S04`'ün pencere kapsamına alınması | Olgu sözleşmesi değişikliği gerektiriyor; Faz 2b'de mi? |

**`TB-130` ve `TB-131` birlikte, tek turda, testleriyle kapatılmalı** — ikisi de aynı
kök nedenin iki yüzü.

> **Ölçülmüş ders (mutasyon turu, `M17`):** okul yüklemi kaldırılınca sorgu paylaşılan
> entegrasyon veritabanının **tamamını taramaya** başladı; on testlik sınıf 50 dakikada
> bitmedi, tek teste daraltınca 9 saniyede kırmızı verdi. **Okul yüklemi yalnız bir
> güvenlik sınırı değil, sorgunun kapsamını tutan şey.** `TB-130`/`TB-131`'in ikinci
> maliyeti performanstır ve veri büyüdükçe sessizce artar.

---

## 7. Faz 2b — kapsam ve ilk karar noktası

**Kapsam (Faz 2a spec'i §11'den):**
- Kapı listesi / oturma planı / gözetmen çizelgesi çıktıları
- Gözetmen yoklaması ve Attendance bağı
- Görüş penceresi (`ExamWindow.OpenReview` Faz 1'de yazıldı, hâlâ çağrılmıyor) ve
  `ExamReviewOpened`

**İlk karar noktası — beyin fırtınasının ilk sorusu:**

`AttendanceSession` bir `PlacementId` ve **tek** bir `ActualTakerId` taşır. Kelebekte
9-A üç ayrı dersliğe bölünür ve üç ayrı gözetmen tarafından işaretlenir — yani tek
şubenin tek yoklama oturumuna üç kişi yazar. `AttendanceRecord.MarkedBy` kayıt bazında
olduğu için veri modeli bunu taşıyabilir, ama oturumun "kim aldı" alanı ve
`SubmitAttendance` teslim akışı tek kişi varsayar. Omurga spec'i §5.4 bu çakışmayı
görmemişti.

**Bu fazda hiç yapılmayacaklar:** derslik müsaitliği/tadilat kavramı (`K-24`) ·
derslik başına ikinci gözetmen (`K-25`) · dersliğin sıra × sütun düzeni ·
şube dersliğinin zorunlu kılınması (`K-26`, `TB-120`).

---

## 8. Kaynak haritası

| Ne | Nerede |
|---|---|
| Omurga tasarımı (üç fazın ortak iskeleti) | `oksis/docs/superpowers/specs/2026-09-08-sinav-takvimi-modulu-design.md` |
| Faz 1 planı | `oksis/docs/superpowers/plans/2026-09-08-sinav-takvimi-faz1.md` |
| Faz 2a tasarımı | `oksis/docs/superpowers/specs/2026-09-09-sinav-takvimi-faz2a-design.md` |
| Faz 2a planı | `oksis/docs/superpowers/plans/2026-09-09-sinav-takvimi-faz2a.md` |
| Modül dokümanı | `oksis/docs/documents/modules/exams/README.md` |
| Ekran tasarım brief'i | `oksis/docs/tasarim-briefleri/sinav-takvimi-ekranlari-brief.md` |
| Bulgu Kayıt Defteri | `oksis/docs/bugs-and-decisions/OKSİS - Bulgu Kayıt Defteri.md` |
| **Faz 2a uygulama defteri (kararlar `R1`–`R59`)** | `oksis-api/.superpowers/sdd/2026-09-09-sinav-takvimi-faz2a/progress.md` |

**Defterde bir sonraki boş kimlikler:**
`B-51` · `D-19` · `V-04` · `X-22` · `TB-132` · `E-24` · `ENG-03`

---

## 9. Bu fazda doğan ve kalıcı olan süreç kuralları

Tam hâlleri uygulama defterinde; burada yalnız istemci tarafında da geçerli olanlar.

- **`R43`** — dosya kopyalama mtime'ı korumaz; MSBuild yeniden derlemeyi atlar ve test
  mutasyonlu ikili üzerinde koşar. Kopyadan sonra `touch` şart.
- **`R48`** — mutasyon geri alımı **yedek kopyayla** yapılır; `git checkout` / `git restore`
  **asla** (paylaşılan ağaçtaki commit'lenmemiş işi yok eder).
- **`R53`** — paralel ajanlar paylaşılan ağaçta ölçüm yapamaz. Her ajan kendi
  `git worktree add --detach` ağacında koşar; commit ana ağaçta `git commit -- <yol>` ile.
- **`R56`** — hız sınırı rejiminde paket yeşile döner dönmez commit'le, mutasyon turunu
  sonra koştur.
- **`R58`** — `TreatWarningsAsErrors=true` + `EnforceCodeStyleInBuild=true` altında bir
  yüklemi **silen** mutasyon parametreyi okunmamış bırakır → **derleme hatası, test
  kazanımı değil**. Mutasyon derlenmek zorundadır: "parametreyi okuyan ama yüklemi
  etkisizleştiren" varyant yazılır.
- **`R59`** — `R58` bilinmeden koşmuş her mutasyon turunun ham kaydı `error CS` için
  denetlenir. Faz 2a'nın iki turu denetlendi ve tabloları düzeltildi.
