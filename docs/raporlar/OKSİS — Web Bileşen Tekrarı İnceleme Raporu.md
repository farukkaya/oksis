
# OKSİS — Web Bileşen Tekrarı İnceleme Raporu

> **Tarih:** 2026-09-13
> **Kapsam:** `oksis-ui` `apps/web/features/**` (246 TSX, ~83 bin satır) ve `packages/ui/src/styles/*.css` — kendini tekrar eden, paylaşılan bileşene terfi edebilecek yapılar
> **Ölçüm kaynağı:** `oksis-ui` @ `1ab7a20` (dal: `fix/polish`, master birleştirilmiş hâli)
> **Yöntem:** beş aile (katmanlar, durum atomları, liste/tablo, form, sayfa düzeni) paralel grep taramasıyla sayıldı; kritik sayılar (SortableTh 0 kullanım, `ui/Button` 0 import, `screens.css` 248 `.nb-*` satırı, `att-modal-wrap` 36, `att-state` 53, `ATgl` 16) elle yeniden doğrulandı. Diğer sayılar grep sayımıdır, her kopyanın işaretlemesi tek tek karşılaştırılmamıştır.
> **İlgili belge:** [Bileşen Envanteri](../frontend/bilesenler/_envanter.md)

---

## 0. Yönetici özeti

1. **Tekrar büyük ve sistematik.** Aynı yapı her feature'da kendi CSS önekiyle (`att-`, `pr-`, `nb-`, `grv-`, `ayr-`, `snf-`, `duy-`, `club-`, `hw-`…) yeniden yazılmış. **45+ aday kalıp** bulundu; en büyükleri modal kabuğu (~50 kopya), form alanı (~220 yer), boş/hata durumu (~70 yer) ve drawer kabuğu (22 kopya).
2. **Var olan paylaşılanlar yarım kullanılıyor.** `SortableTh` hiç kullanılmıyor (6 yerel kopya var), `@workspace/ui` `Button`/`Badge`/`Avatar` sıfır import, `AnchoredMenu` yalnız 2 ekranda.
3. **CSS'te bileşenden bağımsız, düşük riskli temizlik var.** `screens.css`, `duty.css`/`schedule.css`/`roll-call.css` bloklarının kopyalarını taşıyor ve kopyalar ayrışmaya başlamış.
4. **Erişilebilirlik tutarsız.** ~70 katmandan yalnız ~9'u Escape'e yanıt veriyor; 13 switch'te `role="switch"`, 4 radio-kart ailesinde `role="radio"` yok. Paylaşılan bileşene terfi bunları tek yerde çözer.

---

## 1. Bileşen gerektirmeyen bulgular

### 1.1 CSS kopyaları

`globals.css` önce `screens.css`'i, sonra modül css'lerini yükler; `screens.css`'teki kopyalar büyük olasılıkla ölüdür ama ayrışmış olanlar sessiz stil farkı yaratıyor.

| Kopya | Ölçü | Ayrışma örneği |
|---|---|---|
| `duty.css` ↔ `screens.css` (~4704–4960) | 248 `.nb-*` satırı, 243'ü boşluk hariç aynı; 70 ortak seçici | `.nb-switch` rengi `var(--line)` vs `#C6CBDA`; `.nb-empty .ec-ic.warn` yalnız birinde |
| `schedule.css` ↔ `screens.css` | ~32 `.pr-*` seçici (`pr-menu`, `pr-seg`, `pr-table`, `pr-toolbar`, `pr-rowact`, `pr-chips`) | `pr-menu` bloğu (schedule.css:91–102 = screens.css:4180–4189) animasyon hariç aynı |
| `roll-call.css` ↔ `screens.css` | 38 seçicinin 35'i | `.tatt-empty .ic` `var(--st-geldi)` vs `var(--success)` |

### 1.2 Kullanılmayan paylaşılanlar

| Bileşen | Kullanım | Yerine yazılan |
|---|---|---|
| `SortableTh` (`components/shared/sortable-th.tsx`) | **0** | `UsrTh` (users/parts.tsx:244), `VelTh` (parents/table.tsx:19), `TchTh` (teachers/table.tsx:25), `StuTh` (students/table-and-cards.tsx:28) — dördü aynı kod; `RoomTh` (settings/classroom-tab.tsx:92), homework-board-screen inline |
| `@workspace/ui` `Button` | **0** | `att-btn` 432 · `pr-btn` 50 · `nb-btn` 35 · `au-btn` 22 · `ex-btn` 15 · `grv-btn` 13 · `ayr-btn` 9 |
| `@workspace/ui` `Badge` / `Avatar` | **0** | her feature kendi rozetini/avatarını çiziyor (§3 #10, #11) |
| `AnchoredMenu` | 2 (grade-book-list-screen, grade-grid-screen) | 9 satır menüsü kendi konumlandırmasını yazıyor (§3 #4) |

### 1.3 Rastlanan hatalar

| Yer | Hata |
|---|---|
| `features/club/parts.tsx:136` | Sınıf `club-avlg` üretiliyor; CSS `.club-av.lg` hiç eşleşmiyor |
| `features/grade/grade-admin-parts.tsx:378` | Sınıf `gra-avnone` üretiliyor; CSS `.gra-av.none` eşleşmiyor |
| `features/grade/grade-admin-parts.tsx:173` | Yerel `initials()` harf sınırlamıyor — üç kelimelik isimde 3 harf |

---

## 2. Mevcut paylaşılanların eksik taşımaları

| Paylaşılan | Hâlâ yerel olan |
|---|---|
| `SearchBox` | 16 önekli kopya: srx (session-roster-page:270), qr (query-tab:158), ayr (classroom-tab:302, course-catalog:72), snf (sections-page:156), pr (schedule-page:255, availability-page:261), grv (drawer:108, page:254), gr (grade-book-list:229), rhub (reports-hub:134, roster:262), hwl (homework-list:337, admin:165); aynı işaretlemeyle 3 kopya: parents/parts:172, parents/modals:94, activities/assign-modals:122 |
| `FilterDropdown` | `NotificationFilterSelect` (notifications-page:532) birebir kopya; araç çubuğunda native select: homework-list ×2, homework-admin ×5, homework-board ×2, att-filter:32, rep-filter:36, exam-board:326, exam-place:92. Varyant: `ActRangeDd` (tarih aralığı), `DvtColumnButton` (çoklu seçim) |
| `SegmentTabs` | `pr-seg`: exam-hour-requests-screen:421, exam-board-screen:1242, notifications-page:269 (sayaç rozeti stili farklı) |
| `ChoiceChips` | `ReasonChips` (schedule/exception-modals:66) doğrudan; `hw-chip`/`hwp-chip` boş seçim desteği ister; `exc-chip` (event-wizard:452) ve sınıf çipleri (homework-create:528) çoklu seçim modu ister; renewal-sheet:275 `att-fchip`'i tek seçim olarak kullanıyor |
| `KpiCard` | `AdminKpiRow` (notifications-page:424), `DutyStatStrip` (duty/parts:56), `AdvisorStat` (club/advisor-list-page:110) = `RosterStat` (club/activity-roster-page:314) birebir, `ClubHeadStats` (club-detail-page:297), `rol-tile` (permissions-page:45) |
| `WizardSheet` | davet sihirbazı (invitations/wizard), sezon sihirbazı (academic-sessions/wizard), yayın drawer'ı (schedule/publish-drawer) kendi adım mantığını taşıyor |
| `Pager` | settings `ayr-pager` (classroom-tab:483) |
| `PageHeader` | yalnız schedule/editor-page (`pr-ed-bar`, 3 kez) — yeni bileşen değil, PageHeader'a başlık yanı yuvası yeter |

---

## 3. Yeni bileşen adayları

Hedef klasör `apps/web/components/shared/` (hook'lar `apps/web/hooks/`). Saf mantık (ör. baş harf kuralı, eşik rengi) `packages/core`'a gider. Efor: **D** düşük · **O** orta · **Y** yüksek.

### 3.1 Öncelik 1 — çok tekrar, kopyalar neredeyse aynı

| # | Bileşen · dosya | Tekrar | Nerede / neyi birleştirir | Değişen kısım → prop | Efor |
|---|---|---|---|---|---|
| 1 | `ModalShell` · `modal-shell.tsx` | ~50 | 8 yerel kabuk: `SznModalShell` (academic-sessions/modals:7), `DuyModalShell` (announcements/modals:34), `ActModalShell` (activities/modals:16), `ExamModal` (exam-window-modals:56), `GradeModal` (grade-dialogs:35), `AModal` (settings/parts:598), `ExcModal` (attendance/parts:348), `Shell` (sections/modals:51) · 26 inline `att-modal` (20 dosya) · 16 önekli kopya (`pr-modal` 6, `nb-modal` 4, `hw-dlg` 5, `grv-modal` 1) | başlık/alt başlık, ikon tonu (5 yazımı var), genişlik, busy kilidi, kapatma butonu; `role="dialog"` + Escape kabukta sabit | O |
| 2 | `SideDrawer` · `side-drawer.tsx` | 22 | 12 `att-sheet` (session/excuse/karne-day sheet, parents/teachers/students/users drawer, audit-drawer, announcement-drawer, activities/drawer, drill-sheet, CellSheet) · `pr-drawer` 4 · `nb-drawer` 3 · `ADrawer` · `grv-drawer` · `sro-drawer` | genişlik (420–900px), başlık içeriği, altbilgi, busy; Escape yalnız 4'ünde | D–O |
| 3 | `ConfirmDialog` · `confirm-dialog.tsx` (#1 üstünde) | 24+ | `TchConfirm`, homework `Dialog` (zaten jenerik ama yerel), `StuConfirmModal`, `UsrConfirmModal`, `TaConfirmModal`, `DvtCancelModal`, `SnfArchive`/`SnfDelete`, `SznDelete*` ×3, `Withdraw`/`Restore`/`TemplateDelete`, `ActCancelModal`, `ClubActivityCancel`, `ClubApplicationReject`, `GradeUnpublish`/`Lock`, `ExamRemoveRoom`, `ExamDecline`, `DeleteProgramModal`, `DeleteRegionConfirm` | ton, mesaj, not, gerekçe alanı (zorunlu/opsiyonel/yok), onay etiketi, pending | D–O |
| 4 | `RowActionMenu` · `row-action-menu.tsx` (`AnchoredMenu` üstünde) | 9 | `StuRowMenu` (students/parts:361) ≈ `TchRowMenu` (teachers/parts:385) satır satır; `PrRowMenu` (schedule/parts:43), `RowMenu` (teacher-assignments/parts:126 — öğe dizisi API'si hazır), `SnfMoreMenu` (sections/detail:390), duy ×2 (inventory-tab:510, teacher-announcements-page:1100), club ×2 (club-list-page:380, club-detail-page:206) | öğe grupları (ikon, etiket, danger, locked, disabled); 7 menü CSS'i birleşir | D–O |
| 5 | `StateMessage` + `ErrorState` · `state-message.tsx` | ~70 | `att-state` üzerinde 8 sarmalayıcı: `AttLoading`/`AttError`/`AttEmpty`, `RollCallError`, `DuyEmpty`, `GradeState` = `HomeworkState` = `ExamState` (birebir), `DvtState` · ~45 inline `att-state` · ~15 önekli aile (`pr-empty`, `snf-empty`, `club-empty`, `nb-empty`, `grv-error`, `ayr-error`, `nx-state`, `hwb-state`, `sro-state`, `tatt-empty`, `gsd-state`…) · "Tekrar dene" 93 satır | ikon, ton, başlık, açıklama, aksiyon, varyant (düz/kart/kesik çizgi/sıkı) | D |
| 6 | `FormField` + `RequiredMark` · `form-field.tsx` | ~220 | yerel bileşenler: `AFld` (settings/parts:195, 58 kullanım), `StwField` (students/enroll/field:7, 18), `Fld` (attendance, 14), `AuthField` (5), `ReasonField` (grade, 3), `ExamSessionReasonField` · elle: `snf-fld` 37, `att-fld` 26, `nb-fld` 15, `pr-fld` 12, `clbt-fld` 9, `duy-fld` 9, `club-fld` 7, `szn-fld` 4 · 42 `req` yıldızı · hata 9, ipucu 8 farklı sınıf | etiket yanı içerik (kilit, bağlantı, sayaç), hata/ipucu, ok/checking durumu | O |
| 7 | `Switch` + `ToggleRow` · `switch.tsx`, `toggle-row.tsx` | 9 aile / 7 CSS ailesi | `ATgl` (settings/parts:363, 16 kullanım), `Sw` (autogen-drawer:61), `PrToggle` (publish-drawer:14) + exception-modals kopyası, `SznToggle` (academic-sessions/wizard:116, 7), au (invite-screen ×2), nb (region-modal, bolge-tab ×2), duy (compose ×3, modals ×1) | iz boyutu, açık rengi (success/primary/danger), satır varyantı (düz/kart/ikonlu); 13 switch'te rol eksik | D–O |
| 8 | `ActiveFilterChips` · `active-filter-chips.tsx` | 8 | `UsrActiveChips` (users/parts:161), `StuActiveChips` (students/parts:283), `TchActiveChips` (teachers/parts:316), `VelActiveChips` (parents/parts:205), `ActActiveChips` (activities/parts:316), missing-list:307, club-list-page:171, inventory-tab:296 | "temizle" etiketi, ikon seti, baştaki etiket; CSS zaten ortak | D |
| 9 | `BulkActionBar` · `bulk-action-bar.tsx` | 8 | `UsrBulkBar`, `StuBulkBar`, `TchBulkBar`, `VelBulkBar`, `DvtBulkBar`, renewal-sheet:297 · soft varyant: `nx-bulk` (notifications-page:293), `gra-bulk` (grade-admin-board-screen:367) | sayı metni ("N seçili"/"N veli seçildi"), aksiyonlar, temizle etiketi, ton | D |
| 10 | `StatusPill` · `status-pill.tsx` (ya da `ui/Badge` genişletilir) | 5 birebir + ~12 benzer | `VelStBadge`, `TchStBadge`, `StuStBadge`, `UsrStBadge`, `DvtStBadge` yalnız önekte farklı; aynı hex tonlar 5 dosyada · benzer: `IntentBadge`, `ActGroupBadge`, `ClubStatusBadge`, `PrStatus`, `AttendanceStatusChip`, `att-badge` ailesi (30 kullanım) | ton, nokta, ikon; her `*-labels.ts` `Record<Status,{label,tone}>` taşır | D |
| 11 | `InitialsAvatar` + tek baş harf kuralı (`packages/core`) · `initials-avatar.tsx` | 4 bileşen + 36 inline + 13 yardımcı | `DutyAvatar`, `GrvAvatar`, `ClubAvatar`, `avatarClass` · `avatar snf-avcN` 36 satır · `.av`, `pr-av`, `gra-av` · `initials`/`initialsOf` web'de 13 kopya, core'da 3 farklı kural (`deriveInitials`, `clubInitials`, `previewInitials`) | ad, ton, boyut; **karar gerekir:** üç kelimelik isimde ilk+son mu, ilk iki mi | D |
| 12 | `useEscapeKey` · `useOutsideClick` · `useFocusTrap` · `apps/web/hooks/` | 14 · 12 · 2 | Escape: settings `useEscapeClose` + 13 inline effect; mousedown dış tık: club ×2, schedule ×4, sections ×2, announcements ×2, teacher-assignments, notification-bell (+ app-shell, season-context-picker); focus trap: lesson-drawer, grade-course-detail-panel | — (#1–4'ün ön koşulu) | D |
| 13 | `UnderlineTabs` · `underline-tabs.tsx` | 4 | `usr-dtabs`: users/drawer:67, teachers/drawer:130, parents/drawer:70, students/detail-drawer:107 | ikon/kilit, sayaç; iki kopyada `type="button"` eksik | D |
| 14 | `HowItWorksModal` + tetik · `how-it-works.tsx` | 3 modal + 4 buton | `ActInfoModal` (activities/modals:103), `ExamBoardInfoModal` (exam-board-screen:160), `ExamSessionInfoDialog` (exam-session-dialogs:765); butonlar activities-page:254, exam-board-screen:1048, exam-session-screen:296, grade-family-parts:288 | onay etiketi, not tonu; `.act-notes` = `.ex-checks` görünümü | D |

### 3.2 Öncelik 2 — değerli, kopyalar arası fark daha çok

| Bileşen · dosya | Tekrar | Nerede | Efor |
|---|---|---|---|
| `SegmentedControl` · `segmented-control.tsx` (form içi tek seçim; `ChoiceChips` varyantı da olabilir) | 12 | `ASeg` (settings/parts:432) + classroom-tab, `stw-seg` ×3 (enroll/steps, parents/modals), `snf-seg`, `dvt-seg` ×2, `hw-seg`, `tch-capmode`, `nb-segrow` ×3 | D–O |
| `PersonCell` · `person-cell.tsx` | 11 | `usr-cell-user` (users, invitations, renewal-sheet), `tch-cell`, `stu-cell`, `vel-cell`, `exc-stu` ×4 (fix-tab, excuse-tab, risk-tab, drill-sheet) | D |
| `IconButton` + `RowActions` · `icon-button.tsx` | 7 sınıf, ~30 kullanım | `ayr-ib` 14, `attm-ico` 4, `dvt-iconbtn` 4, `act-iconbtn` 3, `nb-iconbtn` 3, `sro-ib` 2, `nx-act` 2; sarmalayıcılar `attm-actions`, `gr-rowact`, `dvt-acts`, `pr-rowact`… | D |
| `FilteredEmptyState` (#5'in hazır hâli) | 6 | users, students, teachers, parents, activities, invitations list sayfaları — "Sonuç bulunamadı" + "Filtreleri Temizle" | D |
| `TableCard` + `TableFoot` · `table-card.tsx` | ~41 tablo | `attm-tbl` 30, `usr-tbl` 7, `ayr-tbl` 4, `act-tbl` 2; kart `attm-card` ~90, `usr-card` 14; altbilgi `attm-foot` 21 + 9 düz "N kayıt" satırı | O (görsel kontrol) |
| `SectionCard` · `section-card.tsx` | ~25 | `ACard` (settings/parts:121, 19 kullanım), `ASideCard`, `DshCardHead`, `GradeSheetSection`, `SznSecHead`, `nb-card-head` ×4, `duy-card` ×10, drawer bölüm başlıkları (`usr-dsec`, `tch-asg-head`, `sec-title`, `sid-sec-h`) | O |
| `Callout` · `callout.tsx` | 9 ana sınıf, ~190 kullanım | `att-note` 77, `duy-alert` 31, `ex-hint` 29, `pr-note` 18, `snf-warn` 10, `au-banner` 7, `grd-note` 7; bileşen: `DutyInfoBanner`, `CoverageBanner` | O (ton adları/renkler farklı) |
| `RadioCardGroup` · `radio-card-group.tsx` | ~14 | `DvtSourceCard` (invitations/wizard:64), `ex-mode` (exam-window-modals:122), `hwp-radio`, `stw-type`, `duy-radio` ×5, `exc-rcard`, `nb-mode-opt` ×2, `club-seg`; 4 ailede `role="radio"` yok | O |
| `DateRangeInput` · `date-range-input.tsx` | 11 tarih + 3 saat çifti | create-excuse-modal, holiday-tab, exam-window-modals, exempt-modal, club/form-drawer, activities/parts, attendance-reports, duty/report-page, homework-admin, academic-sessions/wizard ×2; saat: notification-tab, bell-schedule-tab, activity-create-page. 10 çiftte bitiş başlangıçtan önce seçilebiliyor | O |
| `NumberStepper` · `number-stepper.tsx` | `ANum` 22 kullanım + 1 kopya + 9 düz input | `ANum` (settings/parts:387), `nb-stepper` (region-modal:112); düz number input: sections ×4, teachers/modals ×2, enroll/steps ×2, exam-board | D |
| `KeyValueList` · `key-value-list.tsx` | 15 | `ayr-kv` ×5 (settings), `att-facts` ×7 (drawer/sheet'ler), `gsd-facts`, `sro-dl`, `clbt-kv`, `gr-spec`, `SrFact` | D–O |
| `StatStrip` · `stat-strip.tsx` (ikonsuz sayı şeridi) | 13 | `kr-stat` (karne-tab, student-attendance-tab), `duy-stat`, `szn-stat`, `act-facts`/`act-msum`, sections `.stats`, `SnfSummary`, `att-sheet-stats`, `srx-stat`, `grv-stat`, `exs-facts`, `attl-kpi` | O |
| `Timeline` · `timeline.tsx` | 6 | `duy-tl` (audit-drawer:91), `gra-tl` (grade-admin-dialogs:392), `pr-tl` (history-drawer:97), `srx-tl` (session-roster-row:106), `nb-ver-item` (version-drawer:66), `kr-audit` | O |
| `FormActions` + `BusyButton` · `form-actions.tsx` | ~85 altbilgi | `att-modal-foot` 43, `att-sheet-foot` 11, `pr-dfoot` 9, `pr-mfoot` 6, `nb-*-foot` 10…; `SaveBtn` (attendance/parts:392); 35 "…iliyor" etiketi | O (önce buton birleşmesi) |
| `ProgressBar` + `SegmentBar` · `progress-bar.tsx` | ~11 + 6 | `DuyMeter`, `ExamWindowProgress`, `GradeProgress` ≈ `CheckProgress`, `SnfOccBar`, `ClubOccupancy`, `rep-minibar`, `szn-progress` · segmentli: `TchLoadBar`, `StatusSegments`, `DvtLife`, `gec-bar`, `srx-bar`, `szn-segbar`; yalnız 3'ünde `role="progressbar"` | O |
| `Spinner` · `spinner.tsx` | 8 sınıf, 9 keyframe | `pr-spin` 17, `nb-spin` 7, `au-spin` 6, `szn-spin` 5, `tatt-spin` 3 (iki kopya CSS), `grv-spin-dot`, `exc-spin`, `big-spin` | D |
| `PeriodNavigator` · `period-navigator.tsx` | 3 | karne-tab:537 (ay), schedule-read-page:269 (hafta), homework-board-screen:571 (hafta) | D |
| `CheckboxRow` · `checkbox-row.tsx` | ~6 + 8 native | `AAck` (settings/parts:508), `stw-check` ×2, `stw-flag`, `hw-check`, `au-check`; native: schedule/modals, grade-admin-parts ×2, exam slot picker'lar ×4 | D–O |
| Karakter sayacı (`FormField` `count` prop'u) | 13 | `clbt-count` ×3, `clbt-countrow` ×2, `club-count` ×2, `snf-count`, `duy .cnt` ×5, `grd-count` | D |

### 3.3 Öncelik 3 — düşük getiri

| Bileşen | Tekrar | Not |
|---|---|---|
| `ListToolbar` + `ResultCount` | `usr-toolbar` 14 + `att-toolbar` 17 (+ ayr, snf, nb, pr, hwl, gf) | spacer 4 farklı yazımda; #8/#9'un doğal yuvası |
| `ViewToggle` | 4 | stu-vtoggle, gr-vt ×2, hwl-viewtog; `SegmentTabs` varyantı olabilir |
| `TableSectionRow` | 3 | club-secrow ×2, act-secrow |
| `TableSkeletonRows` + `Skeleton` | 9 satır iskeleti, 7 önekli iskelet sınıfı | `usr-skrow` ×5, reports ×2; `pr-sk`, `duy-sk`, `nx-sk`, `au-sk`, `dsh-sk`, `gr-skel`, `sro-skel-line` |
| `EmptyValue` | 187 "—" satırı (78 dosya) | ya da yalnız core'da tek sabit; grade'de "–" (en dash) tutarsız |
| `SplitLayout` | ~16 | ana alan + yan sütun (settings ×9, duy ×2, homework, club, grade, grv, pr ×2); yalnız CSS de olabilir |
| `DetailHead` | 4 | duy-dethead, grv-dhead ×2, snf-detail-head, gfp-head |

### 3.4 Bakıldı, bileşene değmez

- **Dev senaryo çubuğu:** tek uygulama (`apps/web/dev/scenario-bar`), tek mount noktası.
- **Breadcrumb / hero:** tek örnek (editor-page, szn-hero).
- **Satır açılır detayı:** yalnız duty/report-page gerçek; diğerleri farklı şekiller.
- **Yapışkan tablo başlığı:** 4 CSS kuralı — `TableCard` gelince CSS değiştiricisi olur.
- **Tooltip:** yerel bileşen yok; 17 `data-tip` + native `title`.

---

## 4. Önerilen sıra

| Adım | İş | Risk |
|---|---|---|
| 1 | Yalnız CSS temizliği: `screens.css` içindeki `nb`/`pr`/`tatt` kopyaları (ayrışmış olanlar tek tek karşılaştırılarak) + §1.3'teki üç hata | Düşük |
| 2 | Hızlı, bağımsız işler: `SortableTh` taşıması, `ActiveFilterChips`, `BulkActionBar`, `UnderlineTabs`, `HowItWorksModal`, `KpiCard`/`SearchBox`/`FilterDropdown`/`SegmentTabs` artıkları | Düşük |
| 3 | Katmanlar: hook'lar → `ModalShell` → `ConfirmDialog` → `SideDrawer` → `RowActionMenu` (en büyük kod azalması; `pr`/`nb`/`grv`/`hw` ekranlarında görsel kontrol) | Orta |
| 4 | Formlar: `FormField` → `Switch`/`ToggleRow` → `SegmentedControl` → `ChoiceChips` genişletmesi (boş seçim, çoklu seçim) | Orta |
| 5 | Durum atomları: `StateMessage` → `StatusPill` → `InitialsAvatar` (baş harf kuralı kararıyla) | Düşük–orta |
| 6 | Öncelik 2 ve 3'ün kalanı | — |

**Ayrı mimari karar:** buton birleşmesi — `att-btn`/`pr-btn`/`nb-btn`… ailesi mi, `@workspace/ui` `Button` mı. #1, #3 ve `FormActions`'ı doğrudan etkiler; bileşen turlarından önce bağlanmalı.

**Süreç notu:** `oksis-ui` kuralları gereği her yeni paylaşılan bileşen onayla açılır ve 5+ dosyaya dokunan refactor önceden bildirilir; yukarıdaki her satır ayrı onay konusudur. Terfi eden bileşenler [Bileşen Envanteri](../frontend/bilesenler/_envanter.md)'ne işlenir.
