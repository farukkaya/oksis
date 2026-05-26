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
