# Sezon Durumuna Göre Menü Erişimi — Ön İnceleme

**Yazım:** 24 Eylül 2026
**Kapsam:** Okulda aktif sezon yokken (sezon hiç yok ya da yalnız kurulumda) hangi menü
öğelerinin kullanılamaz gösterileceği; web kenar çubuğu, web rota koruması, mobil sekmeler ve
"Daha fazla" satırları.

> **Kaynak beyanı.** Her ifadenin dayanağı `oksis-ui` ve `oksis-api` çalışan kodudur; dosya ve
> satır referansları verilmiştir. Ölçüm tarihi 24 Eylül 2026'dır. Kullanıcı kararları §2'de,
> dayanağı olmayan yerler "**karar bekliyor**" diye işaretlidir.

> **Tetikleyici.** Sezon kurulumdayken Sınav Takvimi "Bu dönemde sınav penceresi yok ·
> Yeniden yükle" gösteriyordu. Ekran yanlış bir şey söylemiyor ama işe yaramıyor. Açıklama
> metnini düzeltmek yerine, aktif sezon gerektiren bütün modüllere tek kural uygulanması istendi.

---

## 1. Bugünkü durum

### 1.1 Menü tek listeden geliyor, yalnız role göre süzülüyor

- Bütün menüler `packages/core/src/nav/nav-config.ts`'te tanımlı. `NavItem`
  `{id,label,href,icon,description,crumbCategory?}` (:13-24); görünürlük alanı yok.
  Rol listeleri: yönetici :61-306, öğretmen :309-393, öğrenci :396-447, veli :450-495;
  `WEB_NAV_BY_ROLE` :497.
- Web kenar çubuğu `apps/web/components/app-shell.tsx:105-106, 174-204`. Role göre grup seçer,
  başka süzme yapmaz.
- Web rota koruması `apps/web/components/route-guard.tsx:42`, `canAccessRoute(role, pathname)`
  (`nav-config.ts:632`). **Menü listesini okur.** Menüden çıkarılan öğe doğrudan adresle
  açıldığında `ForbiddenScreen` (403) gösterilir.
- Mobil sekmeler `MOBILE_TABS_BY_ROLE` (`nav-config.ts:672`), "Daha fazla → Okul" satırları
  `MOBILE_MORE_SCHOOL_BY_ROLE` (:802). Bağlantı: `apps/mobile/src/app/(tabs)/_layout.tsx`
  (`href:null`), `features/more/components/more-screen.tsx:120,223`. **Mobilde rota koruması
  yok.**
- İzin listesi (`useMyContext().data.permissions`) ve okul modül anahtarları
  (`MODULE_CATALOG`) menüye bağlı değil (`X-20`).

### 1.2 Sezon durumu

- Sezon: `AcademicSessionStatus = "setup" | "active" | "archived"`
  (`packages/core/src/academic-sessions/types.ts:8`). Backend `Setup=0, Active=1, Archived=2`
  (`AcademicSessionStatus.cs:7-17`). Geçişler tek yönlü.
- Dönem: `"notStarted" | "active" | "closed"`. Aktivasyon bugünü kapsayan dönemi kendiliğinden
  başlatır (`TB-179`, `AcademicTermStarter.cs:88-101`).
- **Tek çözücü zaten var:** `resolveSeasonState` → `SeasonStateKey = "noSeason" | "setup" |
  "noTerm" | "ready"` (`season-state.ts:33,144`), hook `useSeasonState()`
  (`packages/api/src/academic-sessions/queries.ts:66`). `TB-168`/`TB-173` kararının dört hâlidir.
  Aktif sezon her zaman kazanır: aktif + kurulumda sezonu olan okul `ready` çözülür.
- **Kurulumdaki sezon hiçbir zaman seçili sezon olamaz.** Topbar seçicisi satırı devre dışı
  bırakır (`season-context-picker.tsx:325-327`). "Kurulumda" görünen okulda aktif sezon yoktur.
- Backend'de "current" daima `Active` sezondur; `GET academic-sessions/current` kurulumdaki
  tek sezon için 404 `NO_ACTIVE_SESSION` döner (`GetCurrentSessionQueryHandler.cs:18-29`).

### 1.3 Sunucuda modül kapısı yok

Sezona bağımlılık handler'lara dağılmış dört kalıptan ibaret:

| Kalıp | Anlamı | Örnek |
|---|---|---|
| A | `Active` sezon yoksa hata ya da boş | Kulüpler `Clubs.NoActiveSession` (409), Duyurular `Announcements.Session.NotFound`, öğrenci kaydı `students.errors.session-not-active` |
| B | Okul günü yalnız `Active` sezonda sayılır | Yoklama/devamsızlık (`AcademicCalendarRules.cs:48-62`, `TB-186`) |
| C | Dönem id'si ya da tarihle çalışır, durum denetimi yok | Notlar, sınav pencereleri, ödev — kurulumda **boş**, çünkü aktif kayıt/dönem yok |
| D | Yalnız kurulumda izinli | Müfredat düzenleme, sezon adı/tarihi, yenileme dönemi |

---

## 2. Kararlar (kullanıcı, 24 Eylül 2026)

1. **Menü öğesi gizlenmez, devre dışı gösterilir.** Kullanıcı tıklarsa "aktif sezon yok"
   uyarısı bildirim (toast) olarak çıkar. (İlk öneri gizlemeydi; kullanıcı devre dışını seçti.)
2. **Tetikleyici okulda aktif sezon olmamasıdır:** `useSeasonState().key` `noSeason` ya da
   `setup` ise kilitli; `ready` ve `noTerm` ise açık.
   - `noTerm` (aktif sezon var, dönem başlamamış) → **açık**. Ekranlar boş durumlarını zaten
     gösteriyor.
   - Sezon geçişi (eski sezon aktif, yenisi kurulumda) → açık; modüller eski sezonla çalışır.
   - Geçmiş sezon seçili → açık; yerleşik kalıp salt okunur (`seasonIsReadOnly`,
     "Geçmiş yıl · salt-okunur", `ActiveSeasonWritePolicy` yazmayı 403'ler).
3. **Duyurular ve Kulüpler kilitlenmez.** Backend kurulumda yazmayı reddediyor (§3, not 2).
4. **Öğretmen, öğrenci ve veli portalları:** sezon varken hangi menü gösteriliyorsa o
   gösterilir; ayrı bir "okul hazırlanıyor" yüzeyi açılmaz. Kilitli öğeler aynı kurala uyar
   (bkz. §5 soru 1).
5. İnceleme sırasında çıkan sorunlar bulgu defterine yazıldı: `B-67`, `X-22`, `TB-248` (§4).

---

## 3. Modül sınıflandırması

### 3.1 Kilitli — aktif sezon olmadan çalışmıyor

| Menü | Roller | Dayanak |
|---|---|---|
| Devamsızlık `/attendance` | yönetici, öğrenci, veli | Kalıp B; canlı pano `isSchoolDay` (`live-board.tsx:258`), karne sekmesi `termId` (`karne-tab.tsx:138`) |
| Yoklama `/roll-call` | öğretmen | Kalıp B; ders oturumu yayımlanmış programdan doğar (`SessionMaterializer.cs:41,117-149`). Boş ekran bugün "Bugün dersiniz yok" diyor |
| Notlar & Karne `/grades` | hepsi | Kalıp C; dönem bağlamdan (`grade-admin-board-screen.tsx:75-81`) |
| Sınav Takvimi `/exams` | yönetici, öğretmen | Kalıp C; pano yalnız aktif kayıtlı öğrenciyi sayar (`GetExamBoardQueryHandler.cs:165`); ekran `exam-windows-screen.tsx:204-205, 268` |
| Ödevler `/homework` | yönetici, öğretmen | Bugünü kapsayan dönem yoksa `HomeworkErrors.InvalidState` (`CreateHomeworkCommandHandler.cs:47-58`) |
| Etkinlikler `/activities` | yönetici | Sezon id'si açıkça istenir; ekran aktif sezon yoksa listenin ilkini seçiyor (`activities-page.tsx:97-101`) |
| Raporlar `/reports` | yönetici | Aktif dönemin devamsızlık raporu; dönem yoksa sorgu kapalı (`attendance-reports.tsx:88-104`) |
| Ders Programı `/schedule` | **yalnız** öğretmen, öğrenci | Yayımlanmış programı gösterir (`schedule-screen.tsx`); aktif sezon yokken okunacak program yok. Yönetici `/schedule` kilitlenmez (§3.2) |

Mobil karşılıklar: öğretmen/öğrenci/veli sekmeleri `attendance`, `grades`, `homework`; "Daha
fazla" satırları `/exams`, `/schedule` (öğretmen, öğrenci), `activities`, `/excuse-list` (veli).

### 3.2 Açık — sezon kurulumunun kendisi için gerekli

Sezon Yönetimi, Müfredat, Sınıflar & Şubeler, Görevlendirmeler, Ders Programı (yönetici), Nöbet
& Vekâlet, Ayarlar (tatil, derslik, zil, yapı), Davetler, Roller ve İzinler.

Backend bunları kurulumdaki sezonda kabul ediyor: şube ve nöbet yalnız arşivi reddeder
(`CreateClassRoomCommandHandler.cs:46-49`, `SaveDutyRosterDraftCommandHandler.cs:21-34`);
program ve görevlendirme sezon id'sini açıkça alır; tatil sezonu tarihten çözer
(`HolidaySeasonResolver.cs:8-40`); müfredat yalnız kurulumda düzenlenir
(`SessionCurriculum.cs:24,27,60-72`). **Ancak web ekranlarının bir kısmı kurulumdaki sezonu
hedeflemiyor** → `B-67`.

### 3.3 Açık — sezondan bağımsız ya da karar gereği

- Öğrenciler, Öğretmenler, Veliler, Kullanıcılar, Bildirimler, Gösterge Paneli (pano kartları
  sezon durumunu kendileri gösteriyor: `live-attendance-card.tsx:43-53`,
  `grade-entry-card.tsx:27-33`, `summary-kpis.tsx:37`).
- Duyurular, Kulüpler — karar 3.
- Finans, Mesajlar — ekranı ve backend modülü henüz yok (`PlannedScreen`).
- Öğrenciler/Kullanıcılar açık kalır ama ilk sezonda yazma işlemleri backend'de düşüyor → `X-22`.

### 3.4 Aktif sezon, dönem yok (`noTerm`)

İki hâlde yaşanır: 1. dönem kapandıktan sonra 2. dönem başlayana kadar (yarıyıl) ve son dönem
kapandıktan sonra sezon arşivlenene kadar. **Menü kilitlenmez** (karar 2). Gerekçe: bu aralık
aktif sezonun olağan parçasıdır ve iki iş sürer:

- **Geçen dönem okunur.** Dönem kapanınca yayımlı notlar kilitlenir
  (`LockAssessmentsOnTermCloseHandler.cs:29`, ekranda "Dönem kapandı; defter salt okunur",
  `grade-book-list-screen.tsx:362`). Karne, devamsızlık karnesi ve raporlar bu aralıkta bakılır.
- **Gelecek dönem hazırlanır.** Sınav penceresi başlamamış döneme açılabilir
  (`CreateExamWindow` handler `:72-97`, durum denetimi yok); ders programı ve nöbet çizelgesi
  2. döneme hazırlanır.

Sorun menüde değil, **ekranların hangi dönemi varsayılan aldığında** — bugün üç ayrı kural var
(→ `TB-248`):

| Nerede | Aktif dönem yokken seçtiği | Sonuç |
|---|---|---|
| Web sezon bağlamı (`season-context.tsx:142-145`): Notlar, Sınav Takvimi, Devamsızlık Karnesi | `currentTermId ?? terms[0]` | Yarıyılda 1. dönem (doğru); sezon sonunda da 1. dönem (yanlış — son dönem olmalı) |
| `resolvePlanningTerm` (`logic.ts:68-84`): Raporlar, Nöbet, Ders Programı | Bugünü kapsayan, yoksa tarihi gelmemiş ilk, yoksa son dönem | Yarıyılda devamsızlık raporu başlamamış 2. dönemi, yani boş tabloyu gösteriyor |
| Backend `AttendanceTermResolver.cs:79-96` | Yalnız `Active` dönem | Dönem id'si verilmezse devamsızlık özeti/riski boş |

Dönemin `isCurrent` bayrağı yalnız `Active` dönemde doğrudur
(`ListTermsForPickerQueryHandler.cs:71`), bu yüzden `noTerm`'de her ekran yedek kuralına düşüyor.

**Önerilen kural** (core'da tek saf fonksiyon, web ve mobil paylaşır):

- **Okuma ekranları** (Notlar, Devamsızlık Karnesi, Raporlar, veli/öğrenci not ve devamsızlık
  yüzleri): varsayılan **en son kapanan dönem**.
- **Planlama ekranları** (Sınav Takvimi, Nöbet, Ders Programı): varsayılan **başlamamış ilk
  dönem** (`resolvePlanningTerm`'in bugünkü davranışı).
- Her iki durumda dönem seçicisiyle diğer döneme geçilebilir; aktif dönem varsa ikisi de onu
  seçer.
- Backend okuma uçları dönem id'si almadığında aynı kurala uymalı ya da istemci id'yi daima
  açıkça göndermeli — **karar bekliyor**.

**Ölçülmemiş risk:** okul günü dönem durumuna değil sezonun `Active` olmasına bakar (`TB-186`,
bilinçli). Yarıyılda ders oturumu oluşmaması yalnız o günlerin tatil kaydına bağlı. Sihirbaz
yarıyıl tatili kaydını oluşturuyor; kayıt silinirse ya da dönem sınırlarıyla örtüşmezse tatil
günlerinde yoklama beklenebilir. Sezon sonu (son dönem kapalı, sezon arşivlenmemiş) için de aynı
soru geçerli.

---

## 4. Bulgular (deftere yazıldı)

- **`B-67`** — Ders Programı, Nöbet, Şubeler ve Görevlendirmeler web ekranları kurulumdaki
  sezonu hedeflemiyor. `schedule-page.tsx:63-72` dönemi `useCurrentSession()`'dan alıyor (yalnız
  aktif sezon); ilk sezonda program `academicTermId: ""` ile gönderiliyor (:133). Şubeler ve
  Görevlendirmeler `activeSeasonId` kullanıyor, kurulumdaki sezon hiç seçilemediği için onu
  gösteremiyorlar. Menü açık kalsa da bu ekranlarla ilk sezon kurulamıyor.
- **`X-22`** — İlk sezonda kullanıcı oluşturma (`identity.errors.no-active-season`,
  `PersonUserCreationService.cs:104-107`), dosya/logo yükleme (`FILES_NO_ACTIVE_SESSION`) ve
  öğrenci kaydı (`students.errors.session-not-active`, `EnrollStudentCommandHandler.cs:67-74`)
  aktif sezon istiyor. İlk sezonunu kuran okul öğretmen hesabı açamıyor, öğrenci kaydedemiyor.
- **`TB-248`** — Aktif sezonda dönem yokken ekranlar varsayılan dönemi üç ayrı kuralla seçiyor
  (§3.4); aynı yarıyılda Notlar 1. dönemi, Raporlar 2. dönemi, backend devamsızlık özeti hiçbir
  dönemi göstermiyor.

---

## 5. Uygulama taslağı

> 5'ten fazla dosyaya dokunur; başlamadan önce onay gerekir.

**Core (`packages/core`)**
- `NavItem`'a `requiresActiveSeason?: true` alanı eklenir; §3.1'deki öğeler rol listelerinde
  işaretlenir. Aynı rota farklı rolde farklı işaret alabilir (yönetici `/schedule` açık,
  öğretmen/öğrenci `/schedule` kilitli).
- Saf fonksiyon `isNavItemLocked(item, seasonKey)`: `requiresActiveSeason` ve
  `seasonKey ∈ {noSeason, setup}` ise `true`. Test edilebilir, React bilmez.
- Uyarı metni tek sabitte (`SEASON_LOCKED_MESSAGE`), web ve mobil paylaşır. Öneri:
  *"Okulda aktif sezon yok. Bu modül sezon aktifleştirildiğinde açılır."* Yöneticiye ek cümle:
  *"Sezon Yönetimi'nden aktifleştirebilirsiniz."* — **karar bekliyor** (metin onayı).

**Web**
- Kenar çubuğu kilitli öğeyi `aria-disabled="true"` ve soluk görünümle çizer. `disabled`
  kullanılmaz; tıklama olayı gerekli. Tıklamada gezinme engellenir, `useAppToast()`
  (`components/shared/toast-host.tsx:48`) uyarı tonuyla metni gösterir.
- `RouteGuard` kilitli rotada 403 yerine `SeasonStateEmpty` ile sezon durumu ekranını gösterir;
  doğrudan adres ve yer imi aynı mesajı görür.
- `useSeasonState().isPending` iken hiçbir öğe kilitlenmez; aksi hâlde menü açılışta titrer.

**Mobil**
- Sekmeler: kilitli sekme soluk çizilir; `tabPress` dinleyicisi `preventDefault` + toast
  (`apps/mobile/src/components/toast-host.tsx:41`).
- "Daha fazla" satırları: aynı kural.
- Bildirimden açılan bağlantılar (`features/notifications/lib/navigate-to-target.ts`):
  ekran açılır, sezon durumu boş hâli gösterilir. Mobilde rota koruması yok; ekranların boş
  durumu yeterli mi, yoksa bir koruma mı eklenmeli — **karar bekliyor**.

**Dokunulmayan**
- Pano kartları, kilitli modüllerin kendi boş durumları (doğrudan adres ve derin bağlantı için
  kalır).
- Yoklama ekranındaki yanıltıcı "Bugün dersiniz yok" metni ayrı iş.

---

## 6. Açık sorular

1. Karar 4'ün yorumu: öğretmen/öğrenci/veli menüsünde §3.1'deki öğeler de devre dışı mı
   gösterilecek (bu belgenin varsayımı), yoksa bu portallarda hiçbir öğe kilitlenmeyecek mi?
2. Uyarı metni ve yöneticiye Sezon Yönetimi bağlantısı verilip verilmeyeceği (§5).
3. Mobilde doğrudan/derin bağlantı için ayrı koruma gerekli mi (§5).
4. Duyurular ve Kulüpler açık kalınca kurulumda yazma hatası alacak; ekranları bu hatayı
   anlaşılır gösteriyor mu, ölçülmedi.

## İlgili

- [[Sezon]] · [[Dönem]] · [[OKSİS - Bulgu Kayıt Defteri]] (`TB-168`, `TB-173`, `TB-179`,
  `TB-186`, `X-20`, `B-67`, `X-22`, `TB-248`)
- `gecici/planlar/2026-09-24-mufredat-secmeli-ve-sezon-acilis-kontrol-listesi.md` — sezon açılış
  kontrol listesi; menü konusunu içermez.
