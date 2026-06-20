# Ders Programı — UI Flows

> Bu modülün frontend ekranları, kullanıcı akışları, state management.

> Genel UI/UX kuralları için bkz. `frontend/ui-ux-rules.md` ve `frontend/component-rules.md`.

> **Konvansiyon:** Bu dosya hem web hem mobile akışını barındırır. Tek modül → tek dosya. Ayrı `ui-flows-web.md` / `ui-flows-mobile.md` **açılmaz**.

---

## Web Flow

### Sayfa Lokasyonu

Frontend: `oksis-web/src/portals/admin/timetable/`

> Modülün web tarafı **admin-only** (SchoolAdmin + Koordinatör). Teacher/Parent/Student web'de erişebilir ama sadece read-only görüntüleme — onlar için ayrı portal sayfaları (`portals/teacher/timetable`, `portals/parent/timetable`, `portals/student/timetable`) **Sprint 3** kapsamında, MVP'de mobile öncelikli.

### Ekranlar

#### Liste / Matris — `/admin/timetable`

**Portal:** admin
**Permission:** `timetable.view-all` (full matris) + `timetable.manage` (düzenleme)
**Component:** `TimetableMatrixPage`
**Konum:** `src/modules/timetable/pages/TimetableMatrixPage.tsx`

**Layout:**
- **Üst bar:** Akademik dönem seçici (default aktif dönem), şube/öğretmen/derslik mode toggle, "Taslak Yayınla" butonu (sadece SchoolAdmin'e).
- **Sol panel:** Filtre — şube listesi, öğretmen listesi, derslik listesi. Multi-select.
- **Ana alan:** Hafta günleri × zaman dilimleri matrisi. Hücreler renkli kart (renk = ders bazlı, opsiyonel öğretmen bazlı toggle).
- **Sağ panel:** Sürüklenebilir "havuz" — atanmamış ders saat kotaları (örn. "9-A Matematik: 4/6 atandı").

**State:**
- Server: `useScheduleMatrixQuery({ termId, mode, filters })` (TanStack Query)
- Local: `selectedCell`, `dragSource`, `dragTarget`, `validationWarnings` (UI store)
- URL params: `termId`, `mode=branch|teacher|room`, `branchId`, `weekStart` (asOfDate hesabı için)

**Aksiyonlar:**
- Boş hücreye tıkla → "Atama Ekle" modal (course + teacher + room + duration seçici)
- Dolu hücreye tıkla → Detay drawer (öğretmen, derslik, ders bilgisi + düzenle/sil)
- Drag-and-drop: dersi hücreden hücreye sürükle → çakışma anlık kontrol (`POST /schedules/validate` ile prefetch debounce 300ms)
- "Taslak Yayınla" → confirm modal: kaç satır, kaç değişiklik, soft uyarılar listesi → onay → `POST /timetable/publish`

**Edge Case'ler:**
- Boş liste (dönem yeni başladı) → EmptyState + "Excel'den içe aktar" CTA
- Hata → ErrorBoundary + retry
- Loading → Skeleton matris (Spinner değil)
- Çakışma uyarısı → hücre kırmızı border + tooltip (HARD kural ihlali — bırakmaya izin yok)
- Soft warning → hücre sarı badge + tooltip (örn. "Öğretmen branş dışı")

---

#### Otomatik Üretim (Hub header akışı) — `ScheduleHubPage`

**Portal:** admin
**Permission:** `timetable.manage`
**Component:** `AutoGenDrawer` (Hub başlığındaki butondan açılır)

**Tetikleyici (REVİZE 2026-06-16, K5):** "✨ Otomatik Oluştur" butonu artık Hub **PageHeader**'ında,
"Yeni Program"ın **solunda** yaşar — program-bağımsız, her zaman görünür. Satır `⋯` menüsünden **ve** editör
`⋯` menüsünden **kaldırıldı**. Drawer `programId` olmadan, aktif dönem context'iyle açılır.

**Sihirbaz akışı (REVİZE 2026-06-17, Dilim-2 çok-sınıf — K-D2):**
1. **Kapsam + seçici:** Kapsam seçici **üç seçenek aktif**: "Tek sınıf" / "Kademe" / "Tümü".
   - **Tek sınıf** → **Şube seçici** (`GET /auto-generate/classes?termId=` ile dolar — aktif dönemde
     görevlendirmesi olan tüm sınıflar, K7).
   - **Kademe** → **Kademe seçici** (görevlendirmeli sınıfların `gradeLevel`'larından türetilir).
   - **Tümü** → seçici yok. Geri besleme: "{n} sınıf · görevlendirmelerden beslenir".
2. **Ayarlar:** Ağırlıklar (sabah/boşluk/denge) + katı mod (strict) toggle + günde-aynı-ders ≤2 (BR-TT-014)
   + 2'şer blok eğilimi (BR-TT-015) toggle'ları.
3. **Üret:** `enqueue({ scope, branchId?, gradeLevel?, weights, strict })` → jobId → poll (~1200ms).
4. **Sonuçlar (kapsama göre):**
   - **Tek sınıf** → mevcut **3 aday kartı** akışı korunur (metrikler + mini-hafta + büyük önizleme +
     önerilen işareti; A/B/C seçilebilir).
   - **Kademe/Tümü (bulk)** → **per-class satırlar**: her satırda **checkbox** + sınıf adı + "Taslak hazır" +
     tercih%/ort-boş + **çakışma/eksik rozeti** + **"Aç"**. (Joint çözüm → sınıf-başına aday seçimi yok, K-D2-5.)
   - Çözüm-yok → gevşetme ipuçları; hata durumu.
5. **Kaydet/Aç:**
   - **Satır "Aç"** → `apply([branchId], candidateId?)` → dönen **yeni Taslak programId** ile
     `/admin/schedule/{newId}/edit`'e gider.
   - **"Tümünü Kaydet"** (bulk footer) → `apply(tüm branchIds)`; **"Seçilenleri Kaydet"** (seçim varsa) →
     `apply(seçili branchIds)` → **başarı banner'ı** (kaç taslak oluştu). Hub listesi invalidate edilir.
   - Apply branch-başına **yeni Taslak** yaratır, mevcut programa dokunmaz; idempotenttir (aynı job+branch
     ikinci kez yeni taslak üretmez — K-D2-4). Yayın ayrı `PublishDrawer` akışı.

> Eski akış (geçersiz): autogen satır/editör `⋯` menüsünden, mevcut bir Draft/Revize programa uygulanıyordu;
> Kademe/Tümü kapsamları Dilim-1'de disabled idi.

#### Yayınla Çekmecesi (PublishDrawer) — swap uyarısı

**Component:** `PublishDrawer` (Hub + Editör aynı bileşeni açar)

**Swap uyarısı (YENİ 2026-06-16, K3/K10):** `publish-preview` yanıtında `replacedPublishedProgramId` doluysa
(aynı sınıf+dönem için zaten **canlı** — Yayında/Revize — bir kardeş var), drawer bir **swap-uyarısı + onay
adımı** gösterir: "Yayındaki X yayından kaldırılıp Taslağa alınacak, bu program yayınlanacak — Devam?".
Onaysız yayınlamaz; onaylanınca engellemez (tek transaction içinde eski canlı kardeş Taslağa indirilir, bu
program yayınlanır).

#### Excel Import — `/admin/timetable/import`

**Portal:** admin
**Permission:** `timetable.import-excel`
**Component:** `TimetableImportPage`

**Akış:**
1. Excel şablonu indir butonu (`/api/v1/timetable/export/excel/template`)
2. Dosya yükle (drag-and-drop + file input)
3. Mode seçimi: `Replace` (mevcut Draft'lar silinir) / `Append`
4. `POST /timetable/import/excel` → jobId döner
5. Progress bar (polling 2sn aralık `GET /import/{jobId}/status`)
6. Sonuç ekranı: createdRows, errorRows, error tablosu (satır + sebep)
7. "Matrise Geç" butonu → `/admin/timetable`

**State:**
- Local: `file`, `uploadMode`, `jobId`, `pollingActive`
- Server: `useImportStatusQuery(jobId, { refetchInterval: 2000, enabled: !!jobId })`

---

#### Derslik Yönetimi — `/admin/timetable/rooms`

**Portal:** admin
**Permission:** `timetable.manage-rooms`
**Component:** `RoomsManagementPage`

CRUD DataGrid (crud-page-generator skill standardı). Kolonlar: Kod, Ad, Tip, Kapasite, Bina/Kat, Status, Aksiyon.

Form alanları:
- Code (zorunlu, max 20, tenant unique)
- Name (zorunlu, max 150)
- Type (select: Classroom/Lab/Gym/Music/Art/Auditorium/Workshop/Other)
- Capacity (number, 1-200)
- Building, Floor (opsiyonel)
- Features (multi-select chip: SmartBoard, Projector, Sink, vb.)
- Status (toggle Active/Passive)

**Edge:** Pasifleştirilen dersliğe **aktif Schedule referansı varsa** uyarı modal: "5 ders bu dersliği kullanıyor; pasifleşse de bu dersleri etkilemez. Yeni atama yapılamaz." → onay → proceed.

---

#### Tek Günlük Değişiklik (Override) — `/admin/timetable/overrides`

**Portal:** admin
**Permission:** `timetable.override`
**Component:** `ScheduleOverridesPage`

**Layout:**
- Üst: Tarih seçici (default bugün, max bugün + 30 gün)
- Sol: Seçili tarihteki tüm aktif Schedule'ların listesi (şube + saat + ders + öğretmen + derslik)
- Sağ: O tarih için mevcut override'lar listesi + "Yeni Override" CTA

**"Yeni Override" Modal:**
- Step 1: Hangi schedule → liste filtre + ara
- Step 2: Tip seç → Cancellation / Substitution / RoomChange / TimeChange / Combined
- Step 3: Tipe göre dinamik form (yeni teacher / yeni room / yeni saat)
- Step 4: Sebep (opsiyonel) + önizleme: "Bu değişiklik 32 kişiye (öğretmen + 30 veli + 1 öğrenci) bildirim olarak gidecek"
- Step 5: Onay → `POST /timetable/overrides`

**Toast:** "Override kaydedildi. {applicableUserCount} kişiye bildirim gönderildi."

---

### Web Kullanıcı Akışı (Sezon Başı Program Kurulumu)

```
[/admin/timetable] (boş matris)
        ↓
"Excel İçe Aktar"           "Sıfırdan Manuel"
        ↓                           ↓
[/import]                    [matris hücre tıkla]
   ↓                            ↓
job tamamlandı              "Atama Ekle" modal
   ↓                            ↓
matrise dön                 validate → kaydet
   ↓                            ↓
        Draft satırlar matriste görünür
                  ↓
        "Müfredat Kotası" panel kontrol
                  ↓
              "Yayınla"
                  ↓
        confirm modal (soft warnings)
                  ↓
        SchoolAdmin onay
                  ↓
POST /timetable/publish
                  ↓
        toast + bildirim sayısı
                  ↓
        sezon yayında — read-only modu
```

### Web Kullanıcı Akışı (Sezon Ortası Acil Değişiklik)

```
[Ali Hoca raporlu — sabah 07:30]
        ↓
[/admin/timetable/overrides]
        ↓
"Yeni Override" → Bugün için
        ↓
schedule seç (Ali Hoca'nın 3 dersi)
        ↓
Tip: Substitution
        ↓
Yeni teacher: Veli Hoca
        ↓
çakışma kontrolü (Veli Hoca o saat boş mu?)
        ↓
sebep: "Ali Hoca raporlu"
        ↓
önizleme: "30 veli + 1 öğretmen bildirim alacak"
        ↓
onay → POST
        ↓
push gider (15 dk cooldown ile dijest)
```

---

## Mobile Flow

### Sayfa Lokasyonu

Mobile: `oksis-mobile/src/features/timetable/`

3 stack ayrı: `TeacherStack`, `ParentStack`, `StudentStack`. Her birinde modülün bir varyantı.

### Ekranlar

#### Teacher — Bugün ekranı

**Stack:** `TeacherStack` (alt tab: "Bugün")
**Permission:** `timetable.view` (scope: kendi schedules.teacher_id)
**Component:** `TodayScreen`
**Konum:** `src/features/timetable/screens/teacher/TodayScreen.tsx`

**Layout:**
- SafeAreaView + üstte tarih + "Yarın" link
- FlashList: sıralı kart (08:30 — Matematik — 9-A — B-12) — bitmiş dersler grayed, sıradaki ders prominent
- Override varsa kart üstünde 🟠 badge + "Değişiklik var" text
- En altta sticky "Yoklama Almaya Başla" CTA (sonraki/devam eden ders varsa)

**State:**
- Server: `useTodayQuery({ for: 'me' })` (TanStack Query, tenant prefix key)
- Local: scroll position (auto-scroll: şu anki saat dilimine)

**Mobil-Spesifik Notlar:**
- 3-tap kuralı: Bugün ekranı → ders kartına tap → yoklama ekranı (yoklama modülü) = 2 tap, ders programı buraya kadar 1 tap = toplam **3 tap altı**.
- Sticky action button: var (yoklama CTA).
- KeyboardAvoidingView: ihtiyaç yok (bu ekranda form yok).
- FlatList/FlashList: **FlashList zorunlu** (ScrollView+map YASAK).
- expo-image: derslik fotoğrafı için (varsa). RN Image YASAK.

---

#### Teacher — Bu Hafta ekranı

**Stack:** `TeacherStack` (alt tab: "Program")
**Component:** `WeeklyScreen`

**Layout:**
- Üstte yatay swipe gün seçici (Pzt-Cmt)
- Seçili gün için FlashList (Bugün ekranı ile aynı kart şeması)
- Header'da "Bu Hafta" / "Önceki Hafta" / "Sonraki Hafta" navigator (max 4 hafta geçmiş, 8 hafta gelecek)

**State:**
- Server: `useTeacherWeeklyQuery({ teacherId: me, weekStart, asOfDate })`

---

#### Parent — Çocuk Programı

**Stack:** `ParentStack` (alt tab: "Program")
**Permission:** `timetable.view` (scope: çocuklarının şubeleri)
**Component:** `ChildTimetableScreen`

**Layout:**
- **Üstte yatay çocuk seçici (chip)** — çoklu çocuk durumunda her zaman üstte ("school-ux" skill kuralı).
- Tab: "Bugün" / "Yarın" / "Bu Hafta"
- Bugün/Yarın: kart listesi (öğretmen perspektifindeki kartla aynı şema; öğrenci için "boş ders" zaten yok)
- Bu Hafta: Tablo görünüm (zoom-pinch ile büyüt) + "PDF indir" CTA
- "Yarın değişiklik var mı?" → home screen banner (override varsa)

**State:**
- Local: `selectedChildId` (Parent context'inden default, kullanıcı değiştirebilir)
- Server: `useChildTimetableQuery({ childId, view, asOfDate })`

**Mobile-Spesifik Notlar:**
- 3-tap kuralı: Açılış → home → program ekranı = 1 tap.
- Sticky CTA: yok.
- Pinch-to-zoom: hafta tablosu için aktif (RN Reanimated 3 + Gesture Handler).
- Push'tan deep link: `oksis://timetable/today?childId=...&highlight={overrideId}` → o günkü ekranı aç, override kartını highlight et.

---

#### Parent — Home Screen Bugün Özeti (modüller arası)

Bu modülün **kendi ekranı değil**, ama Parent home screen'de bir kart olarak çıkar:

- Kart: "Bugün — {ChildName}" → 3 satır özet (1. ders, 2. ders, kalan ders sayısı)
- Override varsa kart üstünde 🟠 banner: "1 değişiklik var"
- Tap → ChildTimetableScreen (bugün)

> İmplementasyon: `parent-home` modülü `useTodayQuery({ for: 'student:{childId}' })` çağırır.

---

#### Student — Bugün + Yarın + Hafta

**Stack:** `StudentStack` (alt tab: "Program")
**Permission:** `timetable.view` (scope: kendi BranchId)
**Component:** `StudentTimetableScreen`

Parent ekranı ile benzer ama:
- Çocuk seçici yok (kendi şubesi tek)
- Yarınki ders dijest opt-in (Profil > Bildirim Ayarları)
- Renkli ders kartları (görsel cazibe; "school-ux" skill'in öğrenci ilkesi: ders programı görsel + renk kodlu)

---

### Mobile Kullanıcı Akışı (Parent — Acil Override Push)

```
[Akşam 21:30 — push gelir: "❌ Ders iptal: Yarın 3. ders"]
                ↓
        kullanıcı dokunur
                ↓
oksis://timetable/today?date=2026-11-13&childId=...&highlight=ovr-123
                ↓
App açılır (auth varsa) → ChildTimetableScreen
                ↓
Yarın tabı seçili → matrisde iptal edilen ders kırmızı/üstü çizili
                ↓
Tap → detay modal: "İptal edildi. Sebep: Öğretmen toplantısı. Bilgilendirme: Evde sayfa 45-50 çalışın."
```

### Mobile Kullanıcı Akışı (Teacher — Yarın Hazırlığı)

```
[Akşam 20:00 dijest opt-in açıksa]
                ↓
push: "📚 Yarın Salı — 6 ders, 08:30 - 14:50"
                ↓
tap → TodayScreen (date=tomorrow)
                ↓
6 ders kartı sıralı görünür
                ↓
kart tap → ders detayı (öğrenciler, son yoklama, son not...)
                ↓
"Yıllık planı görüntüle" (Faz 2 — curriculum modülü)
```

---

## Form Validation (Web + Mobile ortak)

### Schedule oluşturma / güncelleme

```ts
// Zod schema — hem web (RHF) hem mobile (RHF) tarafından kullanılır
import { z } from 'zod';

export const scheduleFormSchema = z.object({
  academicYearId: z.string().uuid("Akademik yıl seçiniz"),
  academicTermId: z.string().uuid("Dönem seçiniz"),
  branchId: z.string().uuid("Şube seçiniz"),
  courseId: z.string().uuid("Ders seçiniz"),
  teacherId: z.string().uuid("Öğretmen seçiniz"),
  roomId: z.string().uuid().nullable().optional(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Geçerli saat girin (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Geçerli saat girin (HH:mm)"),
  lessonOrder: z.number().int().min(1).max(20),
  isBlockLesson: z.boolean().default(false),
  blockGroupId: z.string().uuid().nullable().optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli tarih (YYYY-MM-DD)"),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: "Bitiş saati başlangıçtan sonra olmalı", path: ["endTime"] },
).refine(
  (data) => !data.isBlockLesson || !!data.blockGroupId,
  { message: "Blok ders için grup ID zorunlu", path: ["blockGroupId"] },
);
```

### Room oluşturma / güncelleme

```ts
export const roomFormSchema = z.object({
  code: z.string().min(1, "Kod zorunlu").max(20).regex(/^[A-Z0-9\-_]+$/i, "Sadece harf, rakam, - veya _"),
  name: z.string().min(1, "Ad zorunlu").max(150),
  type: z.enum(["Classroom", "Lab", "Gym", "Music", "Art", "Auditorium", "Workshop", "Other"]),
  capacity: z.number().int().min(1).max(200),
  building: z.string().max(50).optional(),
  floor: z.number().int().optional(),
  features: z.array(z.enum([
    "SmartBoard", "Projector", "Sink", "AirCondition",
    "WheelchairAccessible", "SoundSystem", "Mirror", "Internet",
  ])).default([]),
  status: z.enum(["Active", "Passive"]).default("Active"),
});
```

### Override oluşturma

```ts
export const overrideFormSchema = z.object({
  originalScheduleId: z.string().uuid(),
  overrideDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overrideType: z.enum(["Cancellation", "TeacherSubstitution", "RoomChange", "TimeChange", "Combined"]),
  newTeacherId: z.string().uuid().nullable().optional(),
  newRoomId: z.string().uuid().nullable().optional(),
  newStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  newEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  reason: z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  // Type-spesifik validation (domain invariant'larıyla uyumlu)
  if (data.overrideType === "TeacherSubstitution" && !data.newTeacherId) {
    ctx.addIssue({ code: "custom", path: ["newTeacherId"], message: "Yerine girecek öğretmen seçin" });
  }
  if (data.overrideType === "RoomChange" && !data.newRoomId) {
    ctx.addIssue({ code: "custom", path: ["newRoomId"], message: "Yeni derslik seçin" });
  }
  if (data.overrideType === "TimeChange") {
    if (!data.newStartTime || !data.newEndTime) {
      ctx.addIssue({ code: "custom", path: ["newStartTime"], message: "Yeni saatleri girin" });
    } else if (data.newStartTime >= data.newEndTime) {
      ctx.addIssue({ code: "custom", path: ["newEndTime"], message: "Bitiş başlangıçtan sonra olmalı" });
    }
  }
});
```

> Schema `oksis-web/src/modules/timetable/schemas/` altında; mobile `oksis-mobile/src/features/timetable/schemas/` aynı içeriği barındırır. **Shared paket Faz 2**.

---

## i18n Key'leri

| Key | TR |
|---|---|
| `timetable.title` | Ders Programı |
| `timetable.empty` | Henüz ders programı oluşturulmamış |
| `timetable.matrix.title` | Haftalık Matris |
| `timetable.matrix.mode.branch` | Şube Modu |
| `timetable.matrix.mode.teacher` | Öğretmen Modu |
| `timetable.matrix.mode.room` | Derslik Modu |
| `timetable.publish.cta` | Taslağı Yayınla |
| `timetable.publish.confirm.title` | Programı Yayınlamak Üzeresiniz |
| `timetable.publish.confirm.body` | {count} ders satırı yayınlanacak, etkilenen {userCount} kullanıcıya bildirim gidecek. |
| `timetable.conflict.teacher` | Öğretmen bu saatte başka bir derste |
| `timetable.conflict.branch` | Şubeye bu saatte başka bir ders atanmış |
| `timetable.conflict.room` | Derslik bu saatte dolu |
| `timetable.conflict.holiday` | Bu gün tatil olarak işaretli |
| `timetable.warning.branchMismatch` | Öğretmen branşı bu derste tanımlı değil |
| `timetable.warning.dailyOverload` | Öğretmen aynı günde 8 saatten fazla derse giriyor |
| `timetable.override.cta` | Tek Günlük Değişiklik Yap |
| `timetable.override.type.cancellation` | Ders İptali |
| `timetable.override.type.substitution` | Yerine Geçen Öğretmen |
| `timetable.override.type.roomChange` | Derslik Değişikliği |
| `timetable.override.type.timeChange` | Saat Değişikliği |
| `timetable.today.title` | Bugünün Programı |
| `timetable.today.empty` | Bugün dersiniz bulunmuyor |
| `timetable.weekly.title` | Haftalık Program |
| `timetable.import.title` | Excel ile İçe Aktar |
| `timetable.import.dropFile` | Excel dosyasını sürükleyin veya seçin |
| `timetable.errors.required` | Bu alan zorunludur |
| `timetable.errors.timeOrder` | Bitiş saati başlangıçtan sonra olmalı |

---

## Yasaklar

- ❌ Web tarafında Spinner (Skeleton kullan — matris için satır skeleton'ı).
- ❌ Hardcoded Türkçe string (i18n key zorunlu).
- ❌ Form'da Zod olmadan validation.
- ❌ Web'de `getByTestId` testlerde (Role + Text bazlı sorgular).
- ❌ Mobile'da `StyleSheet.create` (NativeWind `className` kullan).
- ❌ Mobile'da `AsyncStorage` token (expo-secure-store).
- ❌ Mobile'da `ScrollView + map` ders listeleri için (FlashList zorunlu).
- ❌ **Ayrı `ui-flows-web.md` / `ui-flows-mobile.md` dosya açma** — bu dosya iki tier'ı tek tutar.
- ❌ Override modal'da "Yarın 3. ders" gibi muğlak tarih — net tarih (`13.11.2026`) + gün adı zorunlu.
- ❌ Matris'te HARD çakışmaya rağmen "yine de bırak" seçeneği — backend zaten reddeder, UI'da false hope yaratma.
- ❌ Parent ekranında çocuk seçici **alt menüye gizleme** — her zaman ekranın üstünde (school-ux skill).

> Detay: `frontend/component-rules.md`, `frontend/form-validation-rules.md`, `mobile/component-rules.md`.

---

## Faz 4 / Dilim 2a — Nöbet Çizelgesi (Admin Ekranı)

### Ekran Lokasyonu

```
oksis-web/src/portals/admin/duties/          — admin ekranı
oksis-web/src/portals/teacher/duties/        — öğretmen salt-okunur görünümü
```

**Permission (admin):** `duties.view` (okuma), `duties.manage` (yazma)
**Route:** `/admin/duties` (DutyAdminPage)
**Component:** `DutyAdminPage`

---

### Admin Ekranı — Üç Sekmeli Yapı

#### Sekme 1: Çizelge (roster)

**PageHeader Aksiyon Şeridi:**
- **Öğretmen Görünümü** butonu (her zaman) → `DtaTeacherPreview` modalı açar (salt-okunur öğretmen perspektifi)
- `duties.manage` ise:
  - **Kaydet** butonu (yalnız draft değişiklik varken) → flush → `saveRoster`
  - **Yayınla** butonu → `DtaPublishModal` açar

**Sayfa Gövdesi — Çizelge Sekmesi:**

1. **Bilgi banner'ı:** "Günlük Nöbet" açıklama satırı (MapPin ikonu)
2. **DutySummaryBar:** toplam atama · min/max nöbet · muaf sayısı · çakışma · aktif sürüm + "Geçerlilik" tarihi. Yancılık kapalıysa "Yancılık kapalı" rozeti. Sürüm geçmişi linki → `DtaVersionDrawer`.
3. **DutyGrid:** Gün (Pzt–Cum) × Bölge matrisi.
   - Her hücre: nöbetçi avatar+isim. `relieverEnabled=true` ise yancı öğretmen alt-satırı (teal).
   - Çakışma varsa hücrede sarı uyarı rozeti.
   - **Bugün** sütunu mavi kenarlıkla işaretlenir.
   - Hücreye tıklama (`duties.manage` ise) → **DtaCellMenu** açılır.
4. **FairnessPanel:** öğretmen başına nöbet dağılımı (bar chart stili). `relieverEnabled=true` ise yancı sütunu da gösterilir.

**DtaCellMenu (Radix Popover):**
- Mevcut atama yok → öğretmen listesi (avatar + isim + branş + yük sayacı). Meşgul öğretmenler grayed.
- Mevcut atama var → öğretmen listesi + **Kaldır** seçeneği.
- Atama seçimi yerel `draftOps` op-log'una eklenir (applyOps ile türetilmiş liste).

**DtaPublishModal:**
- Güncel sürüm numarası gösterilir.
- "Geçerlilik başlangıcı" tarih alanı.
- **Yayınla** → `publishRoster` → supersede önceki aktif versiyonu.

**DtaVersionDrawer:**
- Tüm sürümler zaman çizelgesi (Published / Superseded).
- Sürüm detayı (effectiveFrom, yayıncı, atama sayısı).

**DtaTeacherPreview:**
- Tüm öğretmenlerin nöbet çizelgesi — salt-okunur özet görünümü.
- `relieverEnabled=true` ise yancı bilgisi de listelenir.

**Boş Durum:**
- Aktif bölge yoksa "Bölge tanımlanmamış" boş durum + **Bölgeler & Politika** sekmesine yönlendirme CTA.

**Yükleniyor İskeleti:** DutySummaryBar, toolbar ve grid için 3 ayrı iskelet div.

---

#### Sekme 2: Vekâlet (substitution)

**Permission gate:** `duties.substitute` (yalnız SchoolAdmin). Kapı olmadan "izin yok" durumu gösterilir.
**Component:** `DtaVekalet`
**Konum:** `src/portals/admin/duties/components/DtaVekalet.tsx`

> Dilim 2b'de implement edildi. Eski `VekaletPlaceholder` kaldırıldı.

**Sayfa Yapısı:**

1. **Gün Bar'ı (`dta-day-bar`):**  
   Bugünün tarihi + üç pill: Açık / Kapandı / Serbest Çalışma — değerler yüklenen board'lardan `onLessonsLoaded` callback'leriyle toplanır.

2. **Bilgi banner'ı:** "Bu sayfa, gelen öğretmenden bu güne ait vekâlet ataması yapmanızı sağlar." (MapPin ikonu)

3. **Öğretmen seçici (Add-absent picker):**  
   - shadcn `Select` + `Input` (sebep) — yalnız `canManage = true` iken erişilebilir.
   - "Ekle" butonu → seçilen `teacherId`+`reason` yerel `useState<{teacherId, reason}[]>` listesine eklenir.
   - Devamsız öğretmen **entity'de saklanmaz** (K-2b-1: devamsızlık kaydı 2b kapsamı dışı).

4. **Devamsız öğretmen kartları (`AbsTeacherCard`):**  
   Her seçilen öğretmen için ayrı kart:
   - `useSubstitutionBoard(termId, date, teacherId, true)` → board verisi yüklenir.
   - Kart başlığı: öğretmen adı + branşı + yerel sebep (`dta-abs-reason`).
   - Kart gövdesi: Ders slotları (`LessonSlot`) → her slot `SubstitutionLessonDto`'dan.

5. **Ders Slotu (`LessonSlot`) → `DtmLesson` bileşenine iletilir:**  
   - **`open` (Açık):** Ders pill'i + öneri listesi (`dta-sugg`). Expand → `useAvailableSubstitutes` tetiklenir (lazy, `onExpand` ile). Aday listesi `DtmCandidate` bileşenleriyle render edilir.
   - **`covered` (Vekil Atandı):** `DtaAvatar` + vekil adı + "Bildirildi" + **Geri Al** butonu (`revokeSubstitution`).
   - **`study-hall` (Serbest Çalışma):** BookOpen ikonu + başlık + gövde + **Geri Al** (`revokeSubstitution`).

6. **`DtmCandidate` bileşeni:**  
   - Avatar (`DtaAvatar`) + isim + branş uyum rozeti (`dta-fit`: ok/yan/no — Same/Near/Different) + yük sayacı (Shield ikonu).
   - "Önerilen" tag'i (`best=true` ilk aday — yük+fit sıralaması BE tarafından).
   - **Ata** butonu → `createSubstitution(programId, placementId, date, teacherId, reason)` → toast (`toast.assigned` + öğretmen adı).
   - **Serbest Çalışma** ayak butonu → `markStudyHall(programId, placementId, date, reason)` → toast (`toast.studyHall`).

---

### Admin Kullanıcı Akışı — Vekâlet (Ad-hoc Bugün)

```
[/admin/duties → Vekâlet sekmesi]
        ↓
duties.substitute yoksa → "izin yok" durumu
        ↓
(duties.substitute = SchoolAdmin)
        ↓
Gün Bar: bugünün tarihi + Açık/Kapandı/Serbest sayıları
        ↓
Öğretmen Seçici: "Devamsız Öğretmen" Select + "Sebep" Input → Ekle
        ↓
AbsTeacherCard oluşur — board sorgusu tetiklenir
  (GET /duties/substitution/board?termId=&date=&teacherId=)
        ↓
Ders slotları yüklenir (Yükleniyor iskelet)
        ↓
[Ders "Açık" ise]
        ↓
Slot'a tıkla → "Diğer N aday" expand → useAvailableSubstitutes tetiklenir
  (GET /duties/substitution/available-substitutes?programId=&placementId=&date=)
        ↓
Aday listesi: fit rozeti + yük + "Önerilen" tag
        ↓
Seçenek A: "Ata" → createSubstitution → toast "Öğretmen Adı atandı"
           → slot "covered" (DtaAvatar + Bildirildi + Geri Al)
Seçenek B: "Serbest Çalışma" → markStudyHall → toast "Serbest çalışmaya alındı"
           → slot "study-hall" (BookOpen + Geri Al)
        ↓
Geri Al → revokeSubstitution → slot "open"'a döner
```

---



#### Sekme 3: Bölgeler & Politika (policy)

**PageHeader Kaydet:** `duties.manage` + `polDirty` iken aktif → `updatePolicy` çağrısı.

**PolitikaTab içeriği:**

1. **Bölgeler bölümü:** Aktif/Pasif bölge listesi (ikon, kapasite, tip).
   - **Bölge Ekle** butonu → `DtaRegionModal` (ad, tip, kapasite, ikon seçici)
   - Satır: düzenle (`DtaRegionModal`) / sil (`DtaConfirm` teyit)
2. **Muafiyetler bölümü:** Kalıcı/Geçici muaf öğretmen listesi.
   - **Muafiyet Ekle** → `DtaMuafModal` (öğretmen seçici, Kalıcı/Geçici, gün bayrağı)
   - Satır: sil (teyit confirm)
3. **Nöbet politikası bölümü:**
   - **Yancılık aktif** toggle (`relieverEnabled`) — `K-2a-5`: kapalıyken tüm yancı UI'dan gizlenir
   - **Haftalık sıklık** seçici (Haftada 2 / Haftada 1 / 2 Haftada 1) — Dilim 2c solver girdisi (şimdilik inert)
   - **Gün dağılımı** seçici (Dağıtılmış / Ardışık) — Dilim 2c solver girdisi (şimdilik inert)

---

### Admin Kullanıcı Akışı — Yeni Nöbet Çizelgesi Kurulumu

```
[/admin/duties] (boş ekran — bölge yok)
        ↓
"Bölgeler & Politika" sekmesine geç
        ↓
Bölge Ekle → DtaRegionModal
  (ad: "1. Kat Koridor", tip: Koridoru/Salon/Bahçe/Kapı/Salon/Diğer, kapasite: 1–4)
        ↓
Kaydet (policy) → bölge aktif
        ↓
"Çizelge" sekmesine dön
        ↓
Hücreye tıkla → DtaCellMenu → öğretmen seç
        ↓
[draftOps yerel op-log'una eklendi]
        ↓
"Kaydet" → saveRoster → server flush
        ↓
toast: "Çizelge güncellendi"
        ↓
"Yayınla" → DtaPublishModal → geçerlilik tarihi seç → Yayınla
        ↓
publishRoster → Draft→Published, önceki Published→Superseded
        ↓
toast: "Yayınlandı · v1"
        ↓
Öğretmenlere in-app + SignalR bildirim (DutyRosterPublishedEvent)
```

---

### Admin Kullanıcı Akışı — Supersede (Yeni Sürüm Yayıni)

```
Mevcut Published sürüm var
        ↓
Çizelgede değişiklik yap → Kaydet
        ↓
Yayınla → DtaPublishModal → yeni geçerlilik tarihi
        ↓
publishRoster: mevcut Published → Superseded; yeni → Published
        ↓
DtaVersionDrawer'da v1 (Superseded) + v2 (Published) görünür
```

---

## Faz 4 / Dilim 2c — Nöbet Otomatik Dağıtım

### Bileşenler

```
oksis-web/src/portals/admin/duties/components/DutyAutoDistributeDrawer.tsx
oksis-web/src/portals/admin/duties/hooks/useAutoDistribute.ts
```

**Permission:** `duties.manage`
**Tetikleyici:** Çizelge sekmesi PageHeader'daki "Adil Otomatik Dağıt" butonu

---

### Buton Aktivasyon Koşulu

- `weeklyFrequency === OnceEveryTwoWeeks` (değer `2`) iken buton **disabled** + Tooltip: "2 haftada 1 nöbet için otomatik dağıtım desteklenmiyor" (i18n `autoDistribute.biweeklyDisabled`).
- Diğer tüm sıklık değerlerinde buton etkin.

---

### Drawer Akışı (4 Aşama)

#### Aşama 1: Ayarlar

- **Mod toggle (FromScratch / FillEmpty):**
  - `FromScratch` — Mevcut Draft roster sıfırlanır, solver yeniden dağıtır.
  - `FillEmpty` — Yalnız atanmamış hücreler doldurulur; mevcut atamalar korunur.
- **Politika rozetleri** (salt bilgi): haftalık sıklık + gün dağılımı (Spread/Consecutive).
- **"Dağıt" butonu** → `enqueue({ mode })` tetikler, Aşama 2'ye geçer.

#### Aşama 2: Dağıtılıyor

- Spinner + "Dağıtım hesaplanıyor…" mesajı (`autoDistribute.distributing`).
- `useAutoDistribute` hook'u ~1200ms aralıkla poll eder (`GET /duties/auto-distribute/{jobId}`).
- Hata durumunda satır içi hata mesajı + "Tekrar Dene" CTA.

#### Aşama 3: Sonuç

- **DutyGrid önizlemesi** (salt-okunur): solver'ın önerdiği atama planı.
- **Metrik pill'leri:**
  - Atanan hücre sayısı (`autoDistribute.result.assigned`)
  - Eksik hücre sayısı (`autoDistribute.result.missing`) — varsa turuncu/kırmızı
  - Denge skoru (`autoDistribute.result.balance`)
- **Gevşetme ipuçları** (`hints[]`): solver çözüm üretemediği hücreler için öneriler (i18n `autoDistribute.hints.*`).
- **"Uygula" butonu** → `apply(jobId, mode)` tetikler, Aşama 4'e geçer.
- **"Geri Dön"** → Aşama 1'e döner (yeniden dağıtım başlatılabilir).

#### Aşama 4: Uygulandı

- Başarı durumu: "Nöbet çizelgesi taslağa uygulandı" (`autoDistribute.applied`).
- Drawer kapanır / Çizelge sekmesi yenilenir (roster query invalidate edilir).
- Taslak roster `DutyGrid`'de görünür; admin ince-ayar + Yayınla akışı ile devam eder.

---

### Admin Kullanıcı Akışı — Otomatik Dağıtım

```
[/admin/duties → Çizelge sekmesi]
        ↓
weeklyFrequency === OnceEveryTwoWeeks?
  → Evet: buton disabled + tooltip gösterilir (akış durur)
  → Hayır: "Adil Otomatik Dağıt" butonu etkin
        ↓
Butona tıkla → DutyAutoDistributeDrawer açılır
        ↓
[Aşama 1: Ayarlar]
Mod seç (FromScratch / FillEmpty) → politika rozetleri gözden geçir
        ↓
"Dağıt" → enqueue POST /duties/auto-distribute (→ jobId)
        ↓
[Aşama 2: Dağıtılıyor]
Poll GET /duties/auto-distribute/{jobId} (~1200ms)
  → Hata: satır içi mesaj + Tekrar Dene
  → Done: Aşama 3'e geçer
        ↓
[Aşama 3: Sonuç]
DutyGrid önizlemesi + metrikler (atanan/eksik/denge) + ipuçları
        ↓
"Geri Dön" → Aşama 1 (yeniden ayarla)
        ↓
"Uygula" → apply POST /duties/auto-distribute/{jobId}/apply (→ rosterId)
        ↓
[Aşama 4: Uygulandı]
Toast: "Çizelge taslağa uygulandı" → Drawer kapanır
        ↓
Çizelge sekmesi yenilenir (Draft roster görünür)
        ↓
Admin ince-ayar (DtaCellMenu) + Yayınla (DtaPublishModal) akışı
```

---

### i18n Anahtarları (autoDistribute.*)

| Anahtar | TR |
|---|---|
| `autoDistribute.cta` | Adil Otomatik Dağıt |
| `autoDistribute.biweeklyDisabled` | 2 haftada 1 nöbet için otomatik dağıtım desteklenmiyor |
| `autoDistribute.mode.fromScratch` | Sıfırdan Dağıt |
| `autoDistribute.mode.fillEmpty` | Boşları Doldur |
| `autoDistribute.distributing` | Dağıtım hesaplanıyor… |
| `autoDistribute.result.assigned` | Atanan |
| `autoDistribute.result.missing` | Eksik |
| `autoDistribute.result.balance` | Denge |
| `autoDistribute.applied` | Nöbet çizelgesi taslağa uygulandı |

---

## Faz 4 / Dilim 2a — Nöbet Çizelgesi (Öğretmen Görünümü)

### Ekran Lokasyonu

```
oksis-web/src/portals/teacher/duties/TeacherDutyPage.tsx
```

**Permission:** `duties.view` (self-scope — yalnız kendi nöbetleri, IDOR-safe `GetMyDuties`)
**Route:** `/teacher/duties` (TeacherDutyPage)

### Ekran Yapısı

**Salt-okunur görünüm. Vekâlet Dilim 2b kapsamı.**

**Yükleniyor:** 3 iskelet item (tdy-sk-summary, tdy-sk-label, 3× tdy-sk-item).

**Hata durumu:** Hata ikonu + `state.error` mesajı.

**Boş durum:** CheckCircle ikonu + "Bu dönem nöbet göreviniz yok" mesajı.

**Özet Şeridi (dolu durum):**
- **Nöbet sayısı** (Shield ikonu) — bu haftaki nöbet adedi
- **Yancı sayısı** (Users ikonu) — yalnızca `relieverEnabled=true` iken (`K-2a-5`)
- **Sıradaki görev** kartı: gün + bölge adı + görev tipi (Nöbet / Yancı)

**Alt-segment toggle:**
- **Liste görünümü:** Her görev için kart (gün kodu, bölge adı, Nöbet/Yancı etiket rozeti). Bugün mavi vurgu.
- **Haftalık takvim (DutyWeek):** Pzt–Cum grid, hücre başına görev kartı.

**K-2a-5 gating:** `relieverEnabled=false` iken `kind="reliever"` item'lar filtrelenir; özet şeridinde yancı stat ve sıradaki-görev olarak yancı gösterilmez.

**K-2a-2 notu:** Müsaitlik bilgisi bu ekranda gösterilmez. Ekran yalnız atanan nöbet/yancı bilgisini listeler.

---

## Faz 4 / Dilim 2b — Vekâlet (Öğretmen Görünümü)

**Ekran:** `TeacherDutyPage.tsx` (Dilim 2a ile aynı sayfa — `SubstitutionSection` eklendi)
**Permission:** `duties.view` (self-scope)
**Veri kaynağı:** `useMySubstitutions(termId)` → `GET /duties/substitution/me` → `MySubstitutionDto[]`

**SubstitutionSection (salt-okunur):**
- **Bölüm başlığı:** `substitution.teacher.section` (Eye ikonu)
- **Boş durum:** `substitution.teacher.empty` ("Bu dönem vekâlet göreviniz yok")
- **Hata durumu:** `substitution.error` satır içi
- **Dolu durum:** Her `MySubstitutionDto` için read-only kart:
  - `branchName · subjectName` (sınıf + ders)
  - `day/period`  + saat (`tdy-when`)
  - Oda (`tdy-room`) — varsa
  - "`{{originalTeacherName}}` yerine" pattern (`tdy-in-place-of`)
  - Eye ikonu + `substitution.teacher.viewOnly` etiketi

**K-2b-7 (itiraz yok):** Öğretmen itiraz / onay akışı `schedule_requests` dilimine ertelendi. Bu görünümde itiraz butonu/modal yoktur.

**K-2a-2 tutarlılık:** Müsaitlik bilgisi SubstitutionSection'da da gösterilmez.
