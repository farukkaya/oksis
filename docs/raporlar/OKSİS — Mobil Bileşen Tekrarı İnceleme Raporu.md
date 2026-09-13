# OKSİS — Mobil Bileşen Tekrarı İnceleme Raporu

> **Tarih:** 2026-09-13
> **Kapsam:** `oksis-ui` `apps/mobile/src/app/**` (68 TSX) ve `apps/mobile/src/features/**` (120 TSX) — toplam 216 TSX, ~41 bin satır; kendini tekrar eden, `src/components/` altına terfi edebilecek yapılar
> **Ölçüm kaynağı:** `oksis-ui` @ `1ab7a20` (dal: `fix/polish`, master birleştirilmiş hâli)
> **Yöntem:** dört aile (katmanlar ve geri bildirim, liste ve seçiciler, form kontrolleri, ekran düzeni ve stil) paralel grep taramasıyla sayıldı. Paylaşılan bileşen import sayıları betikle çıkarıldı. Kritik iddialar elle yeniden doğrulandı: `StyleSheet.create` 0 dosya, ham `fontSize` 233 satır, yerel `CARD_SHADOW` 9, yerel `mixWithWhite` 9, `CenterState` 7 tanım, ham `TextInput` 18, `RefreshControl` 11, `textTransform: 'uppercase'` 8, `Alert.alert` 6, `TextField` sabit 48px yükseklik, `ToastHost` sabit `bottom: 96`. Diğer sayılar grep sayımıdır; her kopyanın gövdesi tek tek karşılaştırılmamıştır.
> **İlgili belgeler:** [Web Bileşen Tekrarı İnceleme Raporu](OKS%C4%B0S%20%E2%80%94%20Web%20Bile%C5%9Fen%20Tekrar%C4%B1%20%C4%B0nceleme%20Raporu.md) · [Mobil Tasarım Haritası](../frontend/tasarim-sistemi/mobil-tasarim-haritasi.md) · [Bileşen Envanteri](../frontend/bilesenler/_envanter.md)

---

## 0. Yönetici özeti

1. **Mobilin temeli webden sağlam.** 28 paylaşılan bileşen var ve çekirdekleri geniş kullanılıyor: `icon` 55, `screen-header` 40, `skeleton` 35, `empty-state` 31, `query-error-state` 30 dosyada. Tekrar web'deki gibi "her feature kendi öneki" değil; **belirli modüllerde yoğunlaşıyor**: `attendance`, `homework`, `school-settings`, `grade`.
2. **En büyük kazanç durum yönetiminde.** Yükleniyor → hata → boş → içerik zinciri **54 ekranda** elle yazılmış (`QueryGate` adayı). Boş/hata görünümü 7 `CenterState` kopyası ve paylaşılan üç durum bileşeninin kendi aralarındaki iç tekrarıyla 10+ yerde çiziliyor (`StateView` adayı).
3. **Paylaşılanların boşlukları yerel kopya doğuruyor.** `Chip` yalnız kaldırılabilir etiket (seçilebilir çip yok → 8 kopya); `ToastHost` yalnız `info`/`error` (başarı yok → 5 yerel toast, 2 ayrı kanal kütüphanesi); `TextField` çok satır desteklemiyor (→ 9 textarea kopyası); `Badge`'de dikdörtgen/outline/nokta yok (→ ~20 yerel rozet).
4. **Token kuralı ağır çiğneniyor, ama çoğu mekanik.** 233 ham `fontSize` (129'u homework) — **207'si mevcut `TYPE` anahtarlarına bire bir** eşleniyor. Paylaşılan temel bileşenler (`text-field`, `button`, `date-field`, `banner`, `toast-host`) de kuralı çiğniyor.
5. **Kullanıcıya görünen hatalar var** (§1.1): çok satırlı açıklama tek satıra kırpılıyor, mazeret tarihleri serbest metin, Türkçe "İ" büyük harfte bozuluyor, hata ekranları 403'ü "bağlantı sorunu" diye gösteriyor.

---

## 1. Bileşen gerektirmeyen bulgular

### 1.1 Doğrudan hatalar

| Yer | Hata | Doğrulama |
|---|---|---|
| `features/activities/components/activity-create-screen.tsx:163` | `TextField multiline` kullanılıyor; `components/text-field.tsx:37` kapsayıcıyı sabit `height: 48` tutuyor → açıklama alanı tek satıra kırpılıyor | elle doğrulandı |
| `features/attendance/components/excuse-create-screen.tsx:255, :265` | Mazeret başlangıç/bitiş tarihi "YYYY-AA-GG" yer tutuculu serbest `TextInput` — seçici yok, istemci doğrulaması yok; `DateField` zaten var | elle doğrulandı |
| `textTransform: 'uppercase'` — 8 yer: `activity-detail-screen:296`, `activity-create-screen:316`, `announcement-inbox-screen:357`, `grade-feedback-screen:128/238/255`, `grade-component-sheet-screen:210`, `grade-entry-screen:1173` | RN Türkçe bilmez: "İleri tarihli" → "ILERI TARIHLI". Doğru yol `toLocaleUpperCase('tr')` — `homework/components/self-parts.tsx:32` bu kuralı yazılı olarak koyuyor | elle doğrulandı |
| 6 attendance/notifications `CenterState` hata çağrısı (`student-screen:250`, `parent-kids-screen:286`, `parent-attendance-screen:184`, `today-lessons:584`, `history-screen:405`, `notif-list-screen:318`) + `roster-screen:300`, `history-detail:255` | Her hata durumu (403 dahil) sabit "Bağlantı sorunu oluştu" + "Tekrar Dene" gösteriyor; `QueryErrorState` tam bunu çözmek için yazıldı. `excuse-list-screen:~158` hata bloğunda yeniden deneme hiç yok | grep |
| `ChipRow` atlanan 5 yatay şerit: `schedule/today-screen:185`, `admin-announcements-screen:153, :285`, `announcement-inbox-screen:86`, `audience-sheet:83` | `chip-row.tsx`'in önlemek için yazıldığı flexGrow/flexShrink koruması yok → çiplerin dev ovale dönüşme hatası (daha önce 3 kez yaşandı) | grep |
| `components/toast-host.tsx:83` | Sabit `bottom: 96`, safe-area yok sayılıyor; attendance altbilgileriyle çakışıyor | elle doğrulandı |
| Sabit alt boşluklar: `homework-create:510`, `activity-create:254` (`paddingBottom: 34`); club `activity-roll-call:185`, `student-detail:210`, `student-activity-detail:153` (`paddingVertical: 14`, inset yok); `homework-create:256` (sihirli `paddingBottom: 140`) | Çentikli/çentiksiz cihazda altbilgi taşar ya da boşluk kalır | grep |
| `KeyboardAvoidingView` yok: `compose-screen`, `homework-create`, `excuse-create`, `correction-sheet` (Modal); `components/sheet.tsx` klavyeyi hiç ele almıyor ama withdraw/template/queue/student-search/homework-detail/grade-entry sheet'lerinde input taşıyor | Klavye alanı kapatıyor | grep |
| `schedule/components/parts.tsx:85` `ChangeStrip` | `onPress` yerine `onTouchEnd`; `week-screen.tsx:170` boş fonksiyon geçiyor | grep |
| Homework sheet'leri (`homework-detail-screen`) | `mutate()` hemen ardından `setSheet(null)` → pending durumu ve "Vazgeç" yok; "Diğer işlemler" etiketli ⋯ düğmesi doğrudan iptal sheet'ini açıyor | okuma |
| `template-sheets.tsx:242` | Karakter sayacı hint metninin içine gömülü | okuma |

### 1.2 Token ve yardımcı kopyaları

| Kopya | Ölçü | Not |
|---|---|---|
| Yerel `CARD_SHADOW` | 9 attendance dosyası (`parent-kids-screen:27`, `excuse-list-screen:15`, `student-screen:51`, `admin-live-screen:41`, `roster-screen:40`, `history-screen:78`, `today-lessons:61`, `history-detail:70`, `parent-attendance-screen:54`) | Token'ı gölgeliyor ve **ayrışmış**: yerel `shadowOpacity 0.06`, token `0.05` (`theme/tokens.ts:166`) |
| Yerel `mixWithWhite` | 9 (8'i md5 düzeyinde aynı; `notif-list-screen:35` varyant) | `tokens.ts:413` 3 haneli hex'i de işliyor, kopyalar işlemiyor. `softBackground` 2 kopya (`homework-parts:34`, `self-parts:49`) |
| `pad(n)` | 7 attendance dosyası | core tarih kodunda içeride var; dışa açılmalı |
| Bugünün ISO tarihi | 4 (`event-count-screen:20`, `today-lessons:20`, `admin-live-screen:18`, `history-detail:111`) | core `todayIsoDate` (`packages/core/src/date/tr-date.ts:95`) |
| `TR_WEEKDAYS` / `TR_MONTHS` dizileri | 11 dosya (attendance ×7, club, schedule ×2, notifications) | core `TR_WEEKDAYS_LONG/SHORT`, `TR_MONTHS_LONG/SHORT` |
| Tarih biçimleyiciler | `formatTodayLabel` ×2 (aynı), `formatDayLabel` ×3, aralık/kısa tarih ~9 | core `formatTrLongDate`, `formatTrDateRange`, `formatTrShortDate`, `formatNotificationTimestamp` |
| Baş harf | 8 yerel (`initialsOf` ×3 aynı, club, announcement-detail, activity-detail, `more-screen:112` = `use-portal-header.ts:50`) | core'da zaten 3 kural var (`deriveInitials`, `clubInitials`, `previewInitials`) — web raporu §3 #11 ile **aynı karar** |
| StatusTone → renk haritası | 4 birebir (`homework-parts:24`, `self-parts:40`, `homework-self-detail-screen:41`, `homework-family-detail-screen:34`) + `TONE_COLOR`, `TONE_TINT`, `TONE_STYLES`; `COUNT_TONE` ×2 (activities) | tek dosyaya |

### 1.3 Token kuralı çiğnemeleri

| Tür | Sayı | Dağılım / en kötü dosyalar |
|---|---|---|
| Ham `fontSize: <sayı>` | **233** (`src/app` 0) | homework 129 · grade 45 · auth 20 · invitations 14 · attendance 8 · more 7 · reports 7 · club 2 · activities 1. En kötü: `homework-detail-screen` 28, `homework-create-screen` 26, `grade-entry-screen` 14, `submission-card` 13. **207'si mevcut `TYPE` anahtarına bire bir**; token'sız kalan 26 (11.5 ×15, 14.5 ×4, 20 ×2, tekiller) |
| `FONTS` ailesi olmadan `fontWeight` | homework'te ~110 | Sistem fontuyla çiziliyor |
| Tırnaklı hex | 12 | `auth-shell` 7 (çoğu `STATUS_TINTS` karşılığı), `roster-screen` `#B45309` = `STATUS_TINTS.warning.foreground`, `login-screen:387` `#C6CBDA` = `COLORS.controlBorder`, `password-fields:44` = `STATUS_TINTS.success.background`, `submission-viewer-screen:26` `#0B1020` (token yok) |
| `rgba(` | 40 | attendance 14, school-settings 8, homework 7, auth 6. Token karşılığı olanlar: `0.45` scrim → `SURFACE_TONES.modalScrim`; `rgba(79,107,255,0.1)` → `SURFACE_TONES.accentBadgeBg` |
| Scrim rengi | 4 farklı değer | `sheet.tsx:35` ham `0.46`, confirm/correction ham `0.45` (= token), `submission-card:233` `0.35`; yalnız season-context-modal ve event-count token kullanıyor |
| Paylaşılan bileşenlerin kendisi | `text-field` 4 (`TYPE.label` = 13 varken 13), `button` 1, `date-field` 2, `banner` 2, `toast-host` 1 | Önce temel bileşenler düzeltilmeli |
| Radius | 25 `borderRadius: 16`, 20 `RADIUS.x - n` aritmetiği, `borderRadius: 17` ×2 (`RADIUS.pill` yerine) | |

### 1.4 Erişilebilirlik

- **Etiketsiz `TextInput` — 8:** `excuse-create:255, :265, :307`, `announcement-inbox:298`, `compose:404, :416`, `correction-sheet:226`, `grade-entry:1178`.
- **Rolsüz `Pressable`:** `confirm-sheet` 4/4, `correction-sheet` 5/5, `roster-screen` 5/5 (yeniden dene dahil), `history-detail` 4/4, `history-screen` 3/3, `sheet.tsx` backdrop, `CenterState` aksiyon butonları, `(tabs)/announcements.tsx:138` ve `my-announcements.tsx:51` kapatma; kaba grep 52 aday verdi (en az 4'ü yanlış pozitif).
- **Tutarsız roller:** segment kontrolleri `tab`/`button`/`radio` üçünü de kullanıyor; tek seçimli çipler `button` (6 yer) ya da `radio`.
- **Dokunma hedefi:** `invitations/preference-row:43` rol yalnız 42×24 izde, `hitSlop` 6 → ~36px (< 44).
- Yerel toast'larda `accessibilityRole="alert"` yok (`ToastHost`'ta var).

### 1.5 Ad çakışmaları

`school-parts.tsx` kendi `EmptyState` ve `Note`'unu dışa veriyor (paylaşılanlarla aynı ad); `CorrectionSheet` hem attendance hem grade'de; `PublishSheet` hem grade hem announcements'ta; homework iki dosyada yerel `Card`; attendance `ConfirmSheet` aslında merkez diyalog; `dev-quick-login.tsx:102` `Note` düz metin.

---

## 2. Paylaşılan bileşenlerin kullanımı ve atlandığı yerler

İmport eden dosya sayısı betikle (`from '…components/<ad>'`) sayıldı; `notification-bell-button` ve `tab-icons` yalnız başka paylaşılan bileşenler içinden kullanılıyor (ölü değil).

| Bileşen | İmport | Atlandığı yerler (özet) |
|---|---|---|
| `icon` | 55 | 26 feature dosyası doğrudan `react-native-svg` import ediyor; 4 yerel ikon seti (`club-icons`, `more-icons`, `school-settings-icons`, `auth-icons`); chevron 8 kez yeniden çiziliyor (`Icon name="chev"` 17 dosyada kullanılırken) |
| `screen-header` | 40 | `grade-entry-screen:297` (arama + ⋯ çubuğu), `event-count-screen:292` (koyu), `submission-card:397` (modal önizleme, `paddingTop: 56`), `submission-viewer-screen:62` (koyu) |
| `skeleton` | 35 | 3 yerel satır iskeleti (`SkeletonRow`, `LessonSkeletonRow`, `HistorySkeletonRow` — son ikisi yalnız sağ genişlikte farklı), `roster-screen:290` = `history-detail:245` inline, 3 homework kart iskeleti, `ExamScheduleSkeleton`; **8 elle yazılmış pulse animasyonu** (hepsi attendance); ~20 ham `SURFACE_TONES.skeleton` çubuğu |
| `empty-state` | 31 | 7 `CenterState`, `school-parts` `EmptyState` (aynı ad, 4 kullanım), `excuse-list-screen` inline, `event-count-screen:481/495` (koyu), `AuthState` (9 kullanım, 3 dosya) |
| `query-error-state` | 30 | 6 `CenterState` hata çağrısı, 4 elle hata bloğu, `school-parts` `ErrorState` (9 kullanım), `ScheduleStateBlock`, `notification-settings-screen:380`, `PreviewErrorView`; `EmptyState` hata olarak: `announcement-reader-screen:113`, `schedule/parts:~152` |
| `button` | 22 (61 kullanım) | `SheetButton` (grade-entry:868, 8 kullanım), `DecisionButton` (club/application-review:176), `MiniButton` (grade-feedback, statik önizleme — kalabilir); ~17 inline Pressable buton (excuse-create, correction-sheet ×2, confirm-sheet ×2, homework-create ×4, homework-detail ×3, roster, history-detail, event-count, lesson-sheet, grade-entry) |
| `card` | 20 | homework'te iki yerel `Card` birebir aynı; `school-parts` `Card`; `StatusCard`; `cardStyle` ×2; `GROUP_STYLE`; **52 inline `...CARD_SHADOW` yüzeyi** (admin-live 10, parent-attendance 7, today-lessons 6, student-screen 6) |
| `note` | 19 | ~13 yerel not kutusu (`school-parts` `Note` 18 kullanım, season-context `Note`, submission-card `Note`, `InfoNote`, `GradeFamilyHiddenNote`, grade-entry inline ×3, exam-schedule, auth-shell, correction-sheet); `self-parts:431` = `submission-card:356` birebir |
| `sheet` | 16 | Alt sayfa: `CorrectionSheet` (kendi scrim'i, farklı tutamak), `PickSheet`; merkez diyalog: `ConfirmSheet`, event-count inline modal, season-context-modal |
| `missing-param-state` | 16 | Kopya yok; 8 route `useLocalSearchParams`'ı korumasız okuyor (param opsiyonel mi, bakılmadı) |
| `badge` | 12 | ~20 yerel rozet: `HistoryStatusBadge`, `SessionPill`, `StatPill`, `HomeworkStatusChip`, `MetaBadge` ×2 (aynı kod), `TrackingTag`, `AwaitingCheckTag`, `ClubStatusBadge` (taslak durumu elle), `ClubRoleTag`, `ClubCategoryChip`, `UndefinedPill`, `LockBadge`, `EditBadge`, `GradeFamilyUpdatedBadge`, exam gün/sayı hapları, "SEÇİLİ", "DÜZELTME AÇIK" |
| `text-field` | 9 (14 kullanım) | 18 ham `TextInput`: 6 tek satır, 8 çok satır, 3 arama, 1 sayısal (grade-entry:1108 — meşru özel) |
| `chip-row` | 5 | 5 şerit atlıyor (§1.1) |
| `fab` | 4 | `homework-list-screen:199` yerel FAB (52px/bottom 20; paylaşılan 56/16) |
| `toast-host` | 4 | 5 yerel toast görünümü, 7 ayrı 3200ms zamanlayıcı, 2 birebir kanal kütüphanesi (`attendance/lib/attendance-toast.ts`, `announcements/lib/announcement-toast.ts`), 2 başarı toast'ı kapatılabilir `Note` olarak |
| `banner` | 3 | `SaveErrorBanner`, application-review inline, excuse-create inline, event-count koyu |
| `checkbox-row` | 2 | `login-screen:374` ("Beni hatırla", ham hex), `audience-sheet:122`, `ConsentCard` (2 kullanım), `EvcBigRow` (koyu — ayrı kalabilir) |
| `toggle` | 1 | `compose-screen:900` `ToggleRow` (3 kullanım, elle 46×28 iz), `invitations/preference-row` (2 kullanım, 42×24), `template-form:262` inline |
| `date-field` · `stepper` · `chip` | 1 · 1 · 1 | `date-field` excuse-create'te atlanıyor (§1.1); `chip` kaldırılabilir etiket, seçilebilir çip ihtiyacını karşılamıyor |
| `forbidden-state` · `app-header` | 1 · 1 | Kopya yok; kilit görünümü `query-error-state` 403 dalında ve `schedule/parts:~145`'te tekrar ediyor |

---

## 3. Yeni bileşen ve genişletme adayları

Hedef klasör `apps/mobile/src/components/`. Saf mantık (baş harf, tarih biçimi, ton haritası) `packages/core`'a gider. Efor: **D** düşük · **O** orta · **Y** yüksek.

### 3.1 Öncelik 1 — çok tekrar, kopyalar neredeyse aynı

| # | Bileşen · dosya | Tekrar | Nerede / neyi birleştirir | Değişen kısım → prop | Efor |
|---|---|---|---|---|---|
| 1 | `StateView` · `state-view.tsx` — `QueryErrorState`, `ForbiddenState`, `MissingParamState`, `EmptyState` bunun üstüne kurulur | 10+ | 6 birebir `CenterState` (attendance: `parent-kids-screen:58`, `parent-attendance-screen:71`, `today-lessons:136`, `admin-live-screen:94`, `student-screen:122`, `history-screen:155`) + `notif-list-screen:389` varyantı (88px halka) + `school-parts` `LoadingState`/`ErrorState`/`EmptyState` (18 kullanım, 9 dosya) + `ScheduleStateBlock` + paylaşılan üç durum bileşeninin iç tekrarı (56px beyaz disk, `sectionTitle` başlık, 44px çerçeveli buton) | ikon, ton (nötr/tehlike/marka), çerçeve (disk/halka), başlık, açıklama, aksiyon | D |
| 2 | `QueryGate` · `query-gate.tsx` | **54** | 16 ekran `isPending` → `isError` erken dönüşü (grade ×4, homework ×7, exam ×2, schedule, school-settings, reports, invitations); 13 ekran prop tabanlı `if (loading) … if (error)` (club ×11, announcements ×2, activities); 25 ekran JSX `loading ? … : error ? … : empty ?` zinciri (attendance ×10, school-settings ×7, announcements ×4, schedule, activities, notifications, templates route). Hata sarmalayıcıları da tekrar: `GRADE_TONES.bg` zemini (4+), `paddingHorizontal:16, paddingTop:24` (11 club ekranı) | sorgu ya da sorgu dizisi, iskelet düğümü, boş koşulu ve düğümü, yetki rolü, zemin, `children(data)` | O |
| 3 | `usePulse()` + `ListRowSkeleton` · `skeleton.tsx` genişletmesi | 8 pulse + 5 satır + 3 kart | §2 `skeleton` satırındaki kopyalar | avatar biçimi (daire/kare), satır genişlikleri, sağ hap boyutu, adet, ayraç | D |
| 4 | `SegmentedControl` · `segmented-control.tsx` (`features/activities/components/segmented.tsx` terfi eder; kendi yorumu "üçüncü kopya" diyor) | 6 | `Segmented` (activities), `TemplateSegment` (bell-schedule:48), `grade-settings-section:68`, `excuse-create:277`, `event-count-screen:330/~360` (koyu); renkli/ikonlu varyant `MarkSegment` (homework/tracking-row:38) | öğeler (etiket, alt etiket, ikon, ton), açık/koyu, rol tek tip `radio` | D |
| 5 | `FilterChip` (seçilebilir çip) · `filter-chip.tsx`, `ChipRow` içinde | 8 | `FilterChip` (homework-list:49), `SubjectChip` (self-parts:281), `ColumnChip` (grade-entry:686), homework-create:67, `ChipBar` (announcement-inbox:71, sayaçlı), admin-announcements:291, audience-sheet:92, `CountChip` (homework-detail:60) | seçili, renk, dolu/çerçeveli varyant (tasarım kararı), boyut 32/34/44, ikon, sayaç, rol | O |
| 6 | `SectionLabel` / `SectionHeader` · `section-label.tsx` | 11 tanım (49 kullanım) + 13 inline | `SectionLabel` ×4 (more, school-settings-hub = school-parts birebir, activity-create), `SectionTitle` ×5 (club student-detail = student-activity-detail birebir, parent-list, activity-detail, compose), `SectionHead`, `CarryTitle`, `SectionHeader` (membership-list), `Section` (grade-component-sheet); inline: homework ×4, notif-list, parent-attendance, student-screen, announcement-inbox, announcement-detail, notification-settings, grade-feedback ×3, grade-component-sheet | başlık, sayaç, sağ yuva/aksiyon, ikon, ayraç, katlanır (homework-self:152 ≈ homework-family:170). **Büyük harf bileşen içinde `toLocaleUpperCase('tr')`** — §1.1 "İ" hatasını tek yerde kapatır | D |
| 7 | `TextArea` (ya da `TextField`'a çok satır + sayaç) · `text-area.tsx` | 9 | ham: `excuse-create:307`, `correction-sheet:226`, `template-form:224`, `compose:416`, `homework-create:350`, `homework-detail:480, :563`, `grade-entry:1178`; bozuk kullanım: `activity-create:163` (§1.1). `template-form:354` = `compose:868` `inputStyle` (yorumu bunu söylüyor) | etiket, min yükseklik (60–220), `maxLength` + sayaç, hata, ipucu, zorunlu | D |
| 8 | `FormField` (etiket satırı + sayaç/sağ yuva + zorunlu işareti + ipucu/hata) · `form-field.tsx` | ~20 | etiket+sayaç satırları (template-form ×2, compose), `fieldError` (homework-create, 6 etiket), büyük harfli etiketler (`fldLabelStyle` excuse-create ×4, correction-sheet ×2, grade-entry), "*" (homework-create ×2), metne gömülü "(zorunlu/isteğe bağlı)" ×4 | etiket, zorunlu/opsiyonel, sayaç, sağ yuva, ipucu, hata, ton (normal/büyük harf) | D |
| 9 | `FormFooter` / `StickyActionBar` · `form-footer.tsx` (`school-parts` `StickyFooter` terfi eder) | 12 | inline altbilgiler: template-form:312, compose:742, homework-create:498, activity-create:247, excuse-create:374, roster:522, history-detail:451, event-count:514 (koyu), club activity-roll-call:185, student-detail:210, student-activity-detail:153, grade-entry:838 | mesaj/hata satırı, sol özet, klavye farkındalığı, açık/koyu — **safe-area tek yerde** (§1.1 inset hatalarını kapatır) | D |
| 10 | Toast başarı varyantı + `showToast()` · `toast-host.tsx` genişletmesi | 5 görünüm + 7 zamanlayıcı + 2 kanal | §2 `toast-host` satırı | ton `success`, ikon, safe-area'lı alt konum | O (altbilgi çakışması) |
| 11 | `SheetActions` · `sheet.tsx` altbilgi yardımcısı | ~13 | Sheet altbilgisindeki buton çiftleri: withdraw, restore, template ×2, activity-cancel, publish ×2, audience, queue (reddet), template-form; yerel: grade-entry `SheetActions`/`SheetButton` (4 sheet), correction-sheet, confirm-sheet; homework sheet'leri altbilgisiz ham Pressable (×4) | vazgeç/onay etiketi, pending etiketi, disabled, ton (primary/danger), yön (satır/sütun) | D |
| 12 | `ToggleRow` · `toggle-row.tsx` (paylaşılan `Toggle` üstünde) | 3 aile | `compose:900` `ToggleRow` (3), `PreferenceRow` (2), `template-form:262` inline; iki elle çizilmiş iz/topuz bloğu (`compose:929`, `preference-row:46`) | başlık, açıklama, renk, kilitli, kart/düz; dokunma hedefi satıra taşınır | D (46→42 görsel fark) |
| 13 | `Avatar` · `avatar.tsx` + tek baş harf kuralı (core) | 11 görünüm + 8 yardımcı | `ChildAvatar`, `ClubAvatar`, correction-sheet, history-detail, roster, excuse-create, season-context `ChildRow`, audit-screen, announcement-detail, activity-detail, more-screen; `app-header.tsx:166` | ad, boyut (20–48), ton (açık/nötr/dolu), renk, seçili | D |
| 14 | `Badge` genişletmesi (yeni bileşen değil) + tek ton haritası | ~20 kopya | §2 `badge` satırı | `shape` (hap/dikdörtgen), `outline`, `dashed`, `color`, `dot`; 4 birebir StatusTone haritası tek dosyaya | O |
| 15 | `QueryRefreshControl` · `query-refresh-control.tsx` | 11 | today-screen, grade-family-list, grade-book-list, homework ×6, exam-schedule, notif-list | sorgu(lar), renk. **Tutarsızlık:** `refreshing` 7 yerde `isRefetching`, 3 yerde `isFetching`, today-screen `isFetching && !isPending`; renk 5 portal / 4 inkSofter | D |

### 3.2 Öncelik 2 — değerli, kopyalar arası fark daha çok

| Bileşen · dosya | Tekrar | Nerede | Efor |
|---|---|---|---|
| `ListRow` + `GroupedList` · `list-row.tsx` | 6 okunmuş + 5 aynı imzalı | `MoreRow`, `HubRow`, `ModuleRow`, `InvitePreviewRow`, `KeyValueRow`, `GroupRow`; imza benzeri: `HolidayRow`, `LockedRow`, `InfoRow` ×2, `MetaRow`; `isLast`/`last` 14 çağrı noktası | O |
| `ScreenScaffold` · `screen-scaffold.tsx` (`school-parts` `SchoolSubScreen` terfi eder, 9 kullanıcı) | 73 kök `flex:1, surfaceLight`; 16 route aynı kabuk | club route'ları ×11, planned, schedule/week, announcements read/templates, clubs/index; header+ScrollView tekrarı: audit, queue, compose, homework detay ×2, grade-feedback, grade-component-sheet, activity-detail/create. Birebir `contentContainerStyle` grupları: `{padding:16,gap:12,paddingBottom:32}` ×5, `{…gap:20…}` ×3, `{…paddingBottom:34,gap:12}` ×3, `{…paddingBottom:24,gap:12}` ×4 ve 4 ikili grup | O |
| `FormScreen` (KeyboardAvoidingView + ScrollView + altbilgi yuvası) | 5 form ekranı | Yalnız `template-form:136` doğru; compose, homework-create, excuse-create, activity-create'te klavye koruması yok | O (cihazda test) |
| `Card` genişletmesi (`title`, `variant: shadow/border/group`) | 7 yerel kart + 52 inline gölge | §2 `card` satırı; yerel `CARD_SHADOW` token'a döner (§1.2) | O (0.06→0.05 gölge farkı) |
| `ProgressBar` · `progress-bar.tsx` (`skeleton.tsx` içindeki `Meter` genelleşir) | 9 | `ClubOccupancy`, `GradeProgress`, `CheckProgress`, SMS kotası, grade-entry-summary-card, parent-attendance, announcement-detail ×2; yığılmış varyant academic-policy:81. 3 dosya yüzdeyi sınırlıyor, 5 dosya sınırlamıyor | D |
| `StatTile` / `StatStrip` · `stat-tile.tsx` | 7 | `LiveStat` (ham 21), `StatCard` ×2 (club history, announcement-detail meter'lı), `Stat` ×3 (club student-detail, parent-list, activity-detail), parent-attendance inline (ham 17) | D |
| `RadioOption` (kart/satır) · `radio-option.tsx` | ~7 | `MeaningOption` (publish-sheets, 2), `ModerationOptionRow`; öncü yuvalı: season-context `ChildRow`/`SessionRow`/`TermCard`, excuse-create öğrenci kartı, club parent-list çocuk seçici | O |
| `ChildSelectRow` · `child-select-row.tsx` (`Avatar` üstünde) | 4 | season-context `ChildRow`, excuse-create:218, `ChildCard` (parent-kids), `ChildPickerRow` (parent-list) | O |
| `ConfirmDialog` (merkez kart) · `confirm-dialog.tsx` | 3 | `ConfirmSheet` (attendance), event-count "N öğrenci eksik" modal'ı, season-context-modal | D–O |
| `ReasonField` (`TextArea` hazır hâli) | 6 | withdraw-sheet, queue-screen, grade-entry (`GRADE_REASON_MIN`), homework-detail ×2 (`HOMEWORK_REASON_MIN_LENGTH`), correction-sheet | D |
| `Note` genişletmesi (`tone: neutral`, `size: sm`, ikonsuz, çerçeveli) | ~13 | §2 `note` satırı | O (tip/boşluk farkı) |
| `CheckboxRow` kart varyantı | 3 | `ConsentCard`, audience-sheet, login-screen | D |
| `SearchField` · `search-field.tsx` (ya da `TextField` + `lead`/`trail`, `student-search-sheet:64` emsal) | 2 | announcement-inbox:290 (40px), templates-screen:195 (44px) | D |
| Onay deseni kararı + `useUnsavedChangesGuard` | 6 `Alert.alert` | `roster-screen:160` ve `history-detail:152` metin ve `BackHandler` bloğuyla birebir; club ×4 native Alert. Announcements/activities/grade/homework Sheet onayı kullanıyor — **tek desen seçilmeli** | D (hook) / O (UX kararı) |

### 3.3 Öncelik 3 — düşük getiri

| Bileşen | Tekrar | Not |
|---|---|---|
| `ActionSheet` + `ActionRow` (⋯ menüleri) | 3 | `MenuAction` (announcement-detail:602), grade-entry menü sheet'i, `PickSheet` satırları; ⋯ tetikleri tracking-row, announcement-row |
| `LoadingState` | 3 + 2 inline | `school-parts` (9 kullanım), invite-accept, notif-list; `StateView`'ın varyantı olabilir |
| `Banner` genişletmesi (`icon`, `border`) | 3 | `SaveErrorBanner`, application-review, excuse-create |
| `SelectField` (alan görünümlü tetik → Sheet listesi) | 3 | `DevSelectField` (yalnız dev), compose hedef kitle tetiği, homework-create "Ders" kutusu; `DateField` tetiğiyle aynı şekil |
| `InfoRow` (anahtar–değer) | 4 | `InfoRow` ×2 (club, birebir), `KeyValueRow`, `MetaRow` |
| `PageTitle` | 7 | `TYPE.screenTitle` başlık + alt başlık; "başlık AppHeader'da yaşar" kararıyla (`grade-family-list-screen`) çelişebilir — önce karar |
| `DetailHero` | 2 birebir + 3 gevşek | club student-detail ≈ student-activity-detail |
| `ScreenHeader` genişletmesi (`tone: dark`, `actions[]`, `inset`) | 4 | §2 `screen-header` satırı |
| Buton spinner kopyaları → `Button isLoading` | 5 | confirm-sheet, excuse-create, event-count ×2, submission-card |
| `CountBadge` | 3 | announcement-inbox, notification-bell-button, exam-duties |

### 3.4 Bakıldı, bileşene değmez

- **"Nasıl işler" yardım sayfası:** mobilde yok (`MeaningSheet` karar sheet'i).
- **Timeline:** tek örnek (`announcements/audit-screen`).
- **Tarih şeridi / hafta seçici:** tek örnek (`schedule/today-screen`); `PrevNextNav` adaylarının çoğu adımlayıcı.
- **`AccentStripe`** (sol renk çubuğu, 7 yer): 2 satırlık stil, bileşen yerine token/stil sabiti yeter.
- **Chevron'lu kartlar:** içerikleri ortaklaşmayacak kadar farklı; yalnız `Card` chevron konvansiyonu.
- **Tam ekran görüntüleyiciler** (`submission-card:396`, `submission-viewer-screen:55`): sheet deseni değil.

---

## 4. Web raporuyla ortak eksen

İki platform `packages/core`'u paylaşır; aşağıdaki kararlar **bir kez** verilip iki tarafa uygulanmalı:

| Konu | Web | Mobil | Ortak karar |
|---|---|---|---|
| Baş harf kuralı | 13 yerel yardımcı + 1 hata | 8 yerel yardımcı | Üç kelimelik isimde ilk+son mu, ilk iki mi → core'da tek fonksiyon |
| Durum rozeti ton haritası | `*-labels.ts` içinde `STATUS_CLASS` | 4 birebir StatusTone haritası | `Record<Status,{label,tone}>` core'da, renk platformda |
| Onay deseni | ~24 `ConfirmDialog` adayı | Sheet onayı vs native `Alert` | Mobilde tek desen seçimi |
| Boş/hata durumu | `StateMessage` + `ErrorState` | `StateView` + `QueryGate` | Aynı prop sözlüğü (ikon, ton, başlık, açıklama, aksiyon) |
| Form alanı | `FormField` (~220 yer) | `FormField` + `TextArea` | Aynı ad, aynı prop sözlüğü |
| Segment kontrolü | `SegmentedControl` (12) | `SegmentedControl` (6) | Aynı ad; rol `radio` |
| Tarih biçimi | — | 11 dosyada Türkçe gün/ay dizisi, ~9 biçimleyici | core `tr-date` tek kaynak |

Bileşen adları platform başına ayrı dosyada yaşar (mobil `@workspace/ui` import edemez) ama **aynı kavram aynı adı** taşımalı.

---

## 5. Önerilen sıra

| Adım | İş | Risk |
|---|---|---|
| 1 | **Hata düzeltmeleri** (§1.1): `activity-create` çok satırlı açıklama, `excuse-create` → `DateField`, 8 `textTransform: 'uppercase'` → `toLocaleUpperCase('tr')`, 5 şerit → `ChipRow`, 6+2 hata ekranı → `QueryErrorState`, `ToastHost` safe-area | Düşük |
| 2 | **Token temizliği:** yerel `CARD_SHADOW`/`mixWithWhite`/`softBackground` → tokens; tarih yardımcıları → core `tr-date`; scrim → `SURFACE_TONES.modalScrim`; paylaşılan temel bileşenlerin ham değerleri; homework `fontSize` taraması (207'si bire bir, mekanik) | Düşük |
| 3 | **Durum katmanı:** `StateView` → `QueryGate` → `usePulse`/`ListRowSkeleton` → `QueryRefreshControl` (en geniş etki: 54 ekran) | Düşük–orta |
| 4 | **Seçiciler ve formlar:** `SegmentedControl`, `SectionLabel`, `FilterChip` (dolu/çerçeveli kararıyla), `TextArea` + `FormField` + `FormFooter`, `ToggleRow`, `SheetActions` | Orta |
| 5 | **Görünüm atomları:** `Avatar` (core baş harf kararıyla), `Badge` genişletmesi, toast başarı varyantı | Orta |
| 6 | Öncelik 2 ve 3'ün kalanı (`ListRow`, `ScreenScaffold`, `FormScreen`, `Card` genişletmesi, …) | — |

**Süreç notu:** `oksis-ui` kuralları gereği her yeni paylaşılan bileşen onayla açılır ve 5+ dosyaya dokunan refactor önceden bildirilir; yukarıdaki her satır ayrı onay konusudur. `FormScreen`, `ToastHost` konumu ve klavye davranışı değişiklikleri cihazda (Android) doğrulanmalıdır. Terfi eden bileşenler [Bileşen Envanteri](../frontend/bilesenler/_envanter.md)'ne işlenir.
