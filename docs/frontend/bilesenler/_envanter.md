# Component Inventory

Source of truth for gate 3 of `oksis-ui/.claude/skills/handoff-web/SKILL.md` (component
mapping). Before proposing a new shared component, check this list — then
check `packages/ui/src/components/*.ts(x)` on disk for shadcn primitives
(this file doesn't duplicate that list, it goes stale the moment someone runs
the CLI).

> 2026-07-11 reset: the entire web UI (layout shell, shared components,
> `features/users`, all shadcn primitives in `packages/ui`) was removed —
> `apps/web` is a bare "hello oksis" index again. Nothing below is built;
> the list is the roadmap from `apps/web/CLAUDE.md`.

## `apps/web/components/shared/*` — cross-feature view components

| Component | Status | Notes |
| --- | --- | --- |
| `DataTable` | ⬜ planned | roadmap (`apps/web/CLAUDE.md`) |
| `PageHeader` | ✅ built | `components/shared/page-header.tsx` — kullanıcılar handoff'unda kuruldu (stil `shell.css`) |
| `Dialog` | ✅ built | `components/shared/dialog.tsx` — `.att-modal` kabuğunun tek React karşılığı: scrim, Esc, ✕ (sağ üst), `role="dialog"`, odak geri dönüşü, `tone` (info/warn/danger). Stil `packages/ui/src/styles/dialog.css` (`.dlg-x`, `.dlg-warn`, `.dlg-danger`); bkz. 2026-09-16 turu |
| `FormDialog` | ⬜ planned | roadmap — form modalları şimdilik `Dialog` + kendi gövdesi (emsal ayarların `AModal`'ı) |
| `ConfirmDialog` | ✅ built | `components/shared/confirm-dialog.tsx` — `Dialog` üstünde onay akışı (`confirmLabel`, `confirmVariant: primary/danger`, `busy`). İlk tüketici Zil Programı "yeniden üret" (`D-19`) |
| `EmptyState` | ✅ built | `components/shared/empty-state.tsx` — `D-10` "kayıt yok / eşleşme yok" ayrımı (`filtered`); stil `screens.css .att-state` (`page`) ve `.ayr-empty` (`compact`). Öğrenciler, Öğretmenler, Veliler, Kullanıcılar, Davetler, Etkinlikler, Dağıtım Kısıtları + ayarlar `AEmpty` sarmalayıcısı; bkz. 2026-09-15 turu |
| `SeasonStateEmpty` | ✅ built | `components/shared/season-state-empty.tsx` — sezona bağlı boş durum (`TB-168`/`TB-173`); `EmptyState`i SARAR, kendi markup'ını yazmaz. Pano kartları (devamsızlık riski, canlı yoklama, not girişi); bkz. 2026-09-16 sezon durumu turu |
| `StatusBadge` | ⬜ planned | roadmap |
| `Pager` | ✅ built | `components/shared/pager.tsx` — kullanıcılar+öğrenciler paylaşır (stil `screens.css .usr-foot`) |
| `SelectCheckbox` | ✅ built | `components/shared/select-checkbox.tsx` — tablo/kart satır seçimi (stil `.usr-cb`) |
| `MultiSelect` | ✅ built | `components/shared/multi-select.tsx` — `FilterDropdown`'ın çok değerli yüzü (rozetli düğme + onay kutulu menü, `disabled` seçenek gerekçesiyle). `MultiChoiceChips` az/kısa seçenek içindir; bu bileşen ızgaranın dağıldığı yerde (12+ şube). Stil `screens.css .usr-msel-*`. İlk tüketici öğretmen Mesleki Bilgiler modalı (çoklu sınıf öğretmenliği) |
| `Toast` | ✅ built | `components/shared/toast.tsx` — sağ-alt bildirim (stil `.stu-toast`); öğretmenler+ kullanır |
| `KpiCard` / `KpiRow` | ✅ built | `components/shared/kpi-card.tsx` — KPI kart şeridi (stil `packages/ui/src/styles/kpi.css`); 7 ekran paylaşır, bkz. 2026-09-04 turu |

## `apps/web/components/layout/*` — app shell

| Component | Status | Notes |
| --- | --- | --- |
| `AppShell` / `Sidebar` / `Topbar` / `Logo` | ⬜ planned | rebuild with the next handoff round (`app/(dashboard)/layout.tsx`) |

## Explicitly rejected / not ported

- `DevStatePanel`, `RoleSwitcher` — dev-only affordances from the Claude
  Design handoff (`design_handoff_oksis_web`), explicitly called out by that
  handoff's own `HANDOFF.md` as removed before production. Not scaffolded.

## 2026-07-21 — Yoklama (attendance) turu

- Yeni paylaşılan bileşen AÇILMADI: tüm yoklama UI'ı feature-local
  (`features/attendance`, `features/roll-call`, `features/reports`,
  `features/dashboard`). `doc-page` yazdırma kabuğu kullanıcı kararıyla
  reddedildi (YAGNI) — eşik yazısı `threshold-letter.tsx` + `@media print`.
- Kalıp notu: screens.css'te önceden portlanmış bloklar YENİDEN TANIMLANMAZ;
  feature css'leri yalnız scoped CSS-değişken override'ı + gerçekten yeni
  sınıf ekler (`attendance.css`/`dashboard.css` başlık notları emsal).
- `PageHeader`/`Toast`/`Pager` yeniden kullanıldı; `AttFilter`/`StudentPicker`/
  `DocZoom` feature-local kaldı (2. kullanım çıkarsa terfi adayı).
- Yeni workspace paketi: `packages/api-mocks` (mock-first domainlerin MSW
  handler'ları; şu an yalnız attendance — web + mobil dev paylaşır).

## 2026-07-30 — Etkinlikler (activityRollCall) turu

- Yeni paylaşılan bileşen AÇILMADI: ekranın tamamı feature-local
  (`features/activities` — `parts.tsx`/`drawer.tsx`/`modals.tsx` +
  `activity-icons.tsx`). `PageHeader`/`Pager`/`Toast` yeniden kullanıldı.
- `@workspace/ui` içinde TEK ekleme: `OksisIcon`'a `etkinlik` glifi (kenar
  çubuğu nav ikonu — nav ikonları paylaşılan sette olmak zorunda, feature-local
  olamaz). Mevcut `flag` Mazeret modallarında kullanımda olduğundan ayrıştı.
- `usr-fdd` açılır filtresi 6. kez feature-local kopyalandı
  (users/students/teachers/parents/invitations + activities). Terfi adayı
  (`FilterDropdown`) ama bu turda emsal korundu — terfi ayrı bir refactor.
- **Portlanmadı (bilinçli ret):** prototipin `EtkApiNote` sayfa-üstü banner'ı,
  `EtkApiTag` ("Eklenecek alan") çipleri ve `ETK.mockResults()` üretimi.
  Bunlar backend ekibine yazılmış geliştirici notlarıydı + uydurma yoklama
  verisiydi; üretim arayüzüne girmez (emsal: yukarıdaki `DevStatePanel`/
  `RoleSwitcher` reddi). Yerine gerçek `ActivityStudentDto.status` kullanıldı.
- Prototipin tur-bazlı yoklama listesi de portlanmadı: sözleşme tur kırılımı
  tutmuyor (öğrenci başına TEK nihai statü) — çekmecede katılımcı satırında
  gösterilir.

## 2026-07-30 — Etkinlikler: sorumlu devri + katılımcı düzenleme turu

- Yeni paylaşılan bileşen AÇILMADI. İki modal feature-local
  (`features/activities/assign-modals.tsx`); ortak kabuk `ActModalShell`
  `wide` varyantıyla (620px + kaydırılabilir gövde) yeniden kullanıldı.
- **Öğretmen/öğrenci havuzları GERÇEK domainlerden** (`useTeachers` branşıyla,
  `useStudents` sınıf etiketiyle) — prototipin sentetik `TEACHER_OPTS`/`ROSTER`
  listeleri portlanmadı. `StudentPicker` tek-seçim combobox'ı olduğundan
  "ara → listeye ekle" akışına uymadı, arama modal içinde kaldı.
- Mock köprüsü: `teacherLookup` (api-mocks/fixtures.ts) — yoklama havuzu
  ("t01"..) ile gerçek teachers domain'i ("teacher-1"..) iki ayrı id uzayı;
  devir ucu gerçek id aldığından `studentLookup` ile aynı kalıpta köprülendi.
  Bu köprü olmadan devir 404 döner (test sırasında bulundu).
- **Portlanmadı (bilinçli ret, önceki turla aynı gerekçe):** her iki modalın
  "eklenecek alan" (`EtkApiTag`/`db` ikonu) notları ve grup kartı içindeki
  API etiketi. Prototipin `--am-bg #FEF3C7`/`#92400E` uyarı çifti de
  markada olmadığı için `--wn-bg` + `--act-wn-fg`'ye çevrildi.

## 2026-07-30 — Yoklama Oturumu Dökümü (salt-okunur) turu

- Yeni paylaşılan bileşen AÇILMADI; ekran feature-local
  (`features/attendance/session-roster-{page,row,icons}.tsx`).
  `PageHeader` `back` prop'uyla, `attm-card`/`att-state`/`att-note`/`att-badge`
  yeniden kullanıldı.
- **Bu turda mock-first uç YOK** — ekranı besleyen iki uç zaten gerçek ve
  bağlıydı: `GET sessions/{id}/roster` (`useSessionRoster`) ve
  `GET records/{id}/history` (`useRecordHistory`, satır açılınca tembel).
  `AttendanceRecord` alanları tasarımın uydurduğu şekille birebir örtüştü.
- Rota: `/attendance/sessions/[sessionId]` (emsal `schedule/[programId]`).
  Prototip aynı sayfa alanında görünüm değiştiriyordu; gerçek alt rota
  deep-link + tarayıcı geri tuşu kazandırıyor. Canlı pano çekmecesindeki
  "Yoklamayı Görüntüle" butonu `disabled`'dan çıkarıldı.
- **Portlanmadı (bilinçli ret):** prototipin `.srx-api` "backend'e eklenecek
  alanlar" kartı ve `srx-gap` "ad alanı yok · backend" etiketi. Vekâlet sınırı
  kullanıcı diliyle yazıldı ("Vekil öğretmenin adı kayıtlarda yok" + kayıt
  referansı alt satırda); denetim izi sınır notu korundu ama backend dilinden
  arındırıldı.
- **Statü paleti yeniden tanımlanmadı:** prototip İngilizce anahtarlı
  `--st-present/...` beşlisi getiriyordu; ekran kabuğu `att-page` taşıdığından
  Türkçe anahtarlı marka-düzeltilmiş token'lara (`--st-geldi/...`) köprülendi
  (`.srx .b-*` / `.f-*` sınıfları). Prototipin tint'leri (#E2F3EC/#E3F0F9/
  #EEF1FA) ve çip metinleri (#10803B/#3B54D8) markada yoktu.
- `scenario-registry.ts` sırası önemli: `sessionRosterScenarios`
  (`/attendance/sessions`) `attendanceScenarios` (`/attendance`) ÖNCESİNE
  eklendi — `scenariosForRoute` ilk ön-ek eşleşmesini döndürüyor.

## 2026-08-01 — Duyurular (announcement) turu

- Yeni paylaşılan bileşen AÇILMADI: ekranın tamamı feature-local
  (`features/announcements` — `inventory-tab`/`archive-tab`/`compose`/`detail`/
  `approval-queue-tab`/`templates-tab`/`moderation-tab`/`modals`/`audit-drawer`/
  `parts` + `announcement-icons`/`toasts`). `PageHeader`/`Pager` yeniden
  kullanıldı; `screens.css`'teki `attm-*`/`att-*` kalıpları yeniden
  tanımlanmadı, `announcements.css` yalnız scoped override + yeni `.duy-*`.
- `@workspace/ui`'ye EKLEME YOK: prototipin 41 glifinden 32'sinin `OksisIcon`
  karşılığı var (nav ikonu `duyuru` = prototipin `mega`'sı, path birebir aynı);
  kalan 9'u feature-local `DuyIcon`'da (activity-icons emsali).
- **Toast:** paylaşılan `Toast` tek string mesaj gösterir; duyuru akışı yığın +
  ilerleme + "Geri al" eylemi istediği için `features/announcements/toasts.tsx`
  feature-local kaldı. 2. kullanım çıkarsa terfi adayı.
- Yeni mock-first domain: `packages/api-mocks/src/announcements` (attendance'tan
  sonra ikinci üye). `@workspace/api-mocks` artık `@workspace/api`'ye bağımlı —
  handler'lar kontrat DTO'larıyla tiplenir, mock sessizce ayrışamaz.
- **Portlanmadı (bilinçli ret):** prototipin `t.duyDurum`/`t.duyIzin`/
  `t.duyModerasyon` tweaks anahtarları (dev senaryo barının işi) ve `setInterval`
  ile uydurulan gönderim ilerleme çubuğu (gerçek durum backend'den gelmeli).
  Zengin metin araç çubuğu (B/I/liste/bağlantı) da portlanmadı: prototipte
  hiçbir düğme bağlı değildi, çalışmayan buton üretmek yerine düz metin alanı
  bırakıldı.
- **Eksik bırakılan (tasarım yok):** veli/öğrenci web duyuru ekranı — web
  prototipinde çizilmemiş (yalnız mobilde var), o roller durum ekranı görüyor.
  Onay kuyruğundaki "Düzenleyerek onayla" da ertelendi: düzenle-sonra-onayla
  akışının kontratı yok.

## 2026-08-01 — Duyurular: mobil turu

- Yeni paylaşılan bileşen AÇILMADI. Ekranların tamamı feature-local
  (`apps/mobile/src/features/announcements/components/*`): envanter, detay +
  gönderim raporu, denetim izi, compose, hedef kitle/yayın/anlam/geri-çekme
  sheet'leri, onay kuyruğu, şablonlar, öğretmen "Duyurularım".
  `ScreenHeader`/`Button`/`TextField`/`PortalScreen`/`Fab` yeniden kullanıldı.
- **`Fab` genişletildi** (yeni bileşen değil): isteğe bağlı `label` ile
  metinli/hap varyant + `bottomOffset`. Tasarımın gerçek markup'ı bu; dosyadaki
  "Duyurular'da 60×60" notu eskimiş `mobile-design-map.md` önbelleğinden
  geliyordu, düzeltildi.
- **`DuySheet` feature-local kaldı:** yoklamanın `ConfirmSheet`i ORTALANMIŞ
  karttır (tasarımı öyle), bu ise gerçek bottom-sheet. İkisi ayrı kalıp.
  2. bir bottom-sheet ihtiyacı çıkarsa `components/`e terfi adayı.
- Token: tek yeni değer `TYPE.statNumber` (24). Tasarımın `#F6F8FD`/`#F1F5FC`/
  `#E8EDF7`/`#E7ECF6` nötrleri mevcut `COLORS.surfaceLight` ve
  `SURFACE_TONES.{divider,skeleton,barTrack,avatarBg}` karşılıklarına toplandı.
- ~~`packages/core`e eklenen tek şey `ARCHIVED_ANNOUNCEMENT_STATUSES` +
  `partitionByArchive()` — mobilin "Tümü / Arşiv" çipi ile webin arşiv sekmesi
  aynı sınırı kullansın diye.~~
  **Geçersiz (C2, 2026-08-05):** ikisi de silindi. Arşiv sınırı artık istemcide
  değil sunucuda: `scope=archive` = `Expired` + `Withdrawn`, ve `scope=school`
  hiçbir statüyü elemez. İstemci elemesi sunucu sayfalı listede sayfa *içinde*
  çalışıp `totalCount`/`hasNextPage` ile tutmuyordu; ayrıca `partitionByArchive`
  sunucununkinden farklı bir üçüncü arşiv tanımı taşıyordu (`archived`'ı da
  içeriyordu). Görünür sonuç: envanterin "Tümü" çipi artık arşiv satırlarını da
  içerir — web ve mobilde aynı.
- **Portlanmadı (bilinçli ret):** `dyTheme` açık/koyu anahtarı (Tweaks paneli =
  prototip iskeleti; mobilde tema sistemi yok, `EVENT_DARK` tek ekranlık
  istisnadır), "Duyurularda arama yakında" toast'ı gösteren arama düğmesi ve
  onay kuyruğundaki "Düzenleyerek onayla" (düzenle-sonra-onayla kontratı yok —
  webde de aynı gerekçeyle ertelendi).
- **Tasarımı olmayan:** veli/öğrenci duyuru ekranı. Mobil prototip onlara da
  "Bu ekran henüz boş" yer tutucusu gösteriyor; o hâl korundu.

## 2026-08-22 — Öğrenciler detay çekmecesi + devamsızlık/ortalama sütunları turu

- **Yeni paylaşılan bileşen AÇILMADI.** Detay çekmecesi ve dört sekmesi
  feature-local (`features/students/detail-drawer.tsx` +
  `student-{identity,guardians,attendance}-tab.tsx`), teachers/veliler/activities
  çekmecelerinin emsaliyle aynı. `PageHeader`/`Pager`/`Toast`/`SelectCheckbox`
  yeniden kullanıldı.
- **Cross-feature tüketim (kopya yok):** `AttendanceStatusChip` + `formatShortDate`
  `features/attendance/index.ts`ten, `RELATION_LABEL` `features/parents/index.ts`ten
  açıldı. İkisi de statü/etiket sözlüğünün tek tanım yeri olarak kaldı.
- Yeni CSS: `packages/ui/src/styles/students.css` (`.stu-abs`, `.stu-absb`,
  `.stu-avg`, `.usr-kpi.dgr|warn`, `.sgd-`, `.sid-`, `.sct-ctx`, `.sad-`).
  `screens.css`teki portlu `.stu-*` blokları yeniden tanımlanmadı.
  **Tuzak:** CSS yorumu içinde `.sgd-*/` yazmak `*/` ile yorumu erken kapatır ve
  Tailwind "Missing opening (" ile düşer — sınıf öneklerini yorumlarda
  `.sgd-` biçiminde yaz.
- **Notlar sekmesi kendi dönem şeridini KAYBETTİ:** dönem artık üst bardaki
  global bağlamdan (`useSeasonContext`) gelir; dört sekme de aynı `sct-ctx`
  bağlam şeridini gösterir.
- **Token kapsamı tuzağı (grade.css):** `.gsd-sheet` çekmecesi `.gr` ağacının
  içinde değil — kabuğun köküne monte olan ayrı bir `<aside>`. `.gr` bloğu
  `.gr, .gsd-sheet` yapılana dek `--gr-soft` çekmecede çözümsüzdü ve `.gr-val`,
  `.gsd-scope`, `.gsd-state .ic` arka planlarını kaybediyordu. Yeni bir çekmece
  başka bir modülün sınıflarını tüketiyorsa o modülün token bloğuna eklenmesi
  gerekir.
- **grade.css'e sonradan portlanan kurallar** (ilk turda atlanmıştı):
  `.gsd-table` (+ `.gsd-table .gsd-head`), `.gsd-course` flex kapsayıcısı,
  `.gsd-subj`, `.gsd-avg.fail|.low`, `.gsd-legend` ve `.gr-val.fail|.low`.
  Ham hex'leri (#C41C1C/#B05A0A/#FDF0DD) shell'in sapmış paletindendi;
  `--danger`/`--warning`/`--wn-bg` token'larına bağlandı.

## 2026-08-23 — Not modülü backend'e bağlandı (Dilim 0-4)

Bu tur yeni bileşen üretmedi; ekranlar zaten yazılmıştı. Değişen, altlarındaki
veri yolu: MSW mock'unun yerini gerçek uçlar aldı ve tasarımda karşılığı olup
sözleşmede olmayan **üç eylem uç kazandı**.

- **Sözleşmeye eklenen üç uç** (`packages/api/src/grade/contract.ts`):
  `DELETE /assessments/{id}/entries` (Sütunu temizle),
  `PUT /assessments/{id}/exam-date` (Sınav tarihi),
  `POST /grades/family:seen` (görüldü damgası).
  Excel dışa aktarma `GET /books/{id}/export` ile geldi ama **zarf DÖNMEZ** —
  ham dosyadır, bu yüzden `unwrap` kullanılmaz, `fetch` + `blob()` ile okunur.
- **`useAssessmentActions()`** — sütun menüsünün üç eylemi tek yüzeyde
  (`clear` / `setExamDate` / `exportBook`). Üçü de artık toast basmıyor, gerçek
  istek atıyor. `exportBook` bir mutasyon değil ama tarayıcı indirmesini
  tetiklediği için aynı yerde durur; önbellek geçersizlemesi YOKTUR.
- **`downloadBlob` yerel yardımcısı** (`grade-grid-screen.tsx`): object URL kurar
  ve **hemen** `revokeObjectURL` çağırır — bırakılmazsa blob sekme kapanana
  kadar bellekte kalır.
- **Sütun bazlı dışa aktarma ucu YOK.** Menüdeki "Excel'e aktar" hem başlıktan
  hem sütun menüsünden **defterin tamamını** indirir. Tasarım sütun bazlı bir
  dosya vaat ediyordu; backend'de tek defter ucu var ve ızgarayla birebir aynı
  içeriği veriyor — sütun filtresi eklemek yerine iki giriş noktası aynı dosyaya
  bağlandı.
- **`:seen` tetiklemesi ekran görünürken, GET içinde değil.** `grade-family-screen.tsx`
  veri geldikten sonra çocuk başına **bir kez** çağırır (`useRef` ile). Sebep:
  `/grades/family` yan etkisiz olmak zorunda; rozeti okuma sırasında düşürmek
  GET'i mutasyona çevirirdi.
- **Dönem seçicisi Grades'ten çıktı:** `/grades/terms` sözleşmeden düştü,
  kaynak `GET /academic-sessions/terms`. `getGradeTerms` adı korundu (çağrı
  yerleri bozulmasın); codegen gelince `academic-sessions/endpoints.ts`e taşınacak.


## 2026-09-04 — KPI kartları turu

Claude Design'ın `Oksis KPI Kartlari.dc.html` kataloğu (`icon` varyantı) portlandı.
**Yeni paylaşılan bileşen AÇILDI** — envanterde ilk kez, kullanıcı onayıyla:
`KpiCard` + `KpiRow` (`components/shared/kpi-card.tsx`, stil `packages/ui/src/styles/kpi.css`).

Gerekçe terfi eşiğinin çok üstündeydi: aynı kart **beş ayrı CSS ailesinde** kopyalanmıştı
(`.usr-kpi` · `.dsh-kpi` · `.dvt-kpi` · `.gr-kpi` + `.gra-kpi-btn`), ölçüleri birbirinden
kaymıştı ve prototip bu dördünü çoktan tek desene çekmişti. Beşi de silindi; tek `.kpi`
ailesi kaldı.

- **Katalog ölçüleri** (repo bunların eski sürümünde kalmıştı): 34px ikon kutusu (r10,
  eskiden 42/r12), 18px değer (eskiden 21–24px), 11.5px etiket, 12px ızgara boşluğu,
  9/13 dolgu. `border: 1px solid transparent` + 9/13, çerçevesiz 10/14 ile aynı dış ölçü —
  filtre kartı seçilince kart yerinden oynamıyor (tasarımın `.gr-kpi` çözümü).
- **Notlar KPI'ı yapı değiştirdi:** ikon `.kl` etiketinin içindeyken ayrı `.ic` kutusuna
  taşındı; iki ekranın JSX'i de bu yüzden değişti.
- **Davetler KPI'ı sıra değiştirdi:** etiket üstte/değer altta → değer üstte (katalog sırası).
- **Marka status renkleri scoped override ile** (`apps/web/CLAUDE.md` §UI System-3):
  `.kpi` kendi kapsamında `--success/--warning/--danger` değerlerini `#16a34a/#d97706/#dc2626`
  yapar; `shell.css` globalleri portal renklerine sapmış durumda. Kök düzeltilince o üç
  satır silinir.
- **Katalogun `strip` ve `trend` varyantları PORTLANMADI** — prototipte hiçbir ekran
  kullanmıyor. Devam karnesinin şerit görünümü kendi `.kr-stat` bloğunda kalır.
- **Delta/sparkline/oran çubuğu çizilmiyor:** verisi hiçbir uçta yok (defter `TB-114`).
  `delta` prop'u ve `.dl` bloğu yapıda duruyor, uç açılınca tek yerden bağlanır.
- **Dokunulmayan iki KPI ailesi:** bildirim merkezinin `.nx-kpi`'si ve canlı yoklamanın
  `.attl-kpi`'si — tasarımda da ayrı desenler (ikincisi prototiple zaten birebir aynı).

## 2026-09-15 — Boş durum (`EmptyState`) terfisi

`D-10` standardının merkezi uygulaması. **Yeni paylaşılan bileşen AÇILDI:**
`EmptyState` (`components/shared/empty-state.tsx`). Emsal `FilterDropdown` terfisi (`e74d5d3`).

Gerekçe: aynı `att-state`/`se-ico`/"Sonuç bulunamadı" markup'ı yedi ekranda ayrı ayrı
yazılmıştı ve beşi (Öğrenciler, Öğretmenler, Veliler, Kullanıcılar ve kısmen Davetler)
kayıt hiç yokken de "Filtreleri Temizle" diyordu. Doğru ayrım yalnız ayarların
`AEmpty`'sindeydi.

- **Sözleşme:** `filtered` cümleyi, ikonu ve düğmeyi seçer. `false` → ekranın kendi
  ikon/başlık/açıklaması + isteğe bağlı `action` (yalnız sayfada zaten var olan oluşturma
  eyleminin handler'ı). `true` → "Sonuç bulunamadı" + "Arama veya filtre ölçütlerinizle
  eşleşen {entity} yok." + `onClear` verilmişse "Filtreleri Temizle".
- **`filtered` türetmesi:** liste istemcide tamsa `kayıt sayısı > 0 && ölçüt açık`
  (Öğrenciler, Öğretmenler, Kullanıcılar, Davetler, Etkinlikler, Dağıtım Kısıtları).
  Sunucu sayfalı Veliler'de toplam ölçütsüz bilinmediğinden yalnız ölçütten türer.
  Etkinlikler'de "Yaklaşan/Geçmiş" sekmesi de ölçüttür; temizleme sekmeyi "Tümü"ne döndürür.
- **İki varyant, tek gerçek:** `page` (`.att-state`, liste kartı içi) ve `compact`
  (`.ayr-empty`, ayarlar kartı içi). Ayarların `AEmpty`'si `compact`'a ince sarmalayıcı
  kaldı — çağrı yerleri (6 sekme) ve görsel çıktı değişmedi. Yeni CSS yok.
- **Görsel sapmalar (bilinçli):** filtreli dal her ekranda `funnel` ikonu kullanır
  (Davetler ve Kısıtlar `search` gösteriyordu). Etkinlikler'in feature-local `ActIcon`
  `flag`/`funnel`/`plus` glifleri `OksisIcon` karşılıklarına döndü; kayıt yok ikonu kenar
  çubuğunun `etkinlik` glifi. Etkinlikler'in filtreli cümlesi standart cümleye çekildi.
- Aynı turda liste ekranlarının arama kutularına `aria-label` eklendi (yalnız placeholder
  vardı).
- **Dokunulmayan boş durum aileleri:** Şubeler `SnfEmptyState` ve Ders Programı
  `ScheduleNoResult`/`pr-empty` — farklı tasarım iskeleti; ikisi de D-10 ayrımını zaten
  yapıyor. Davet partisi/parti listesi ve hata durumları `DvtState`'te kaldı (filtre
  ayrımı yok).

## 2026-09-16 — Sezon durumu: dört hâl tek çözücüde (`TB-168` + `TB-173` + `D-20` başlık ayağı)

Kullanıcı kararının merkezi uygulaması: sezona bağlı BÜTÜN yüzeyler tek bir çözücüden
beslenir. **Yeni paylaşılan bileşen AÇILDI:** `SeasonStateEmpty`
(`apps/web/components/shared/season-state-empty.tsx`). **Yeni core modülü:**
`packages/core/src/academic-sessions/season-state.ts` (+ `season-state.test.ts`, 13 test).
**Yeni paylaşılan kanca:** `useSeasonState()` (`packages/api/src/academic-sessions/queries.ts`).

- **Gerekçe:** aynı kök durum yüzey yüzey ayrı yazılmıştı — pano risk kartı sezon yokken
  **hata** çiziyordu ("Devamsızlık riski yüklenemedi · Tekrar dene", oysa hata yok ve
  "Tekrar dene" hiçbir zaman başarıya dönmez), yoklama kartları `isSchoolDay` bayrağına
  bakıyordu ("Bugün ders günü değil" — doğru ama yanıltıcı), geri sayım sabit "—" yazıyordu,
  topbar seçicisi ad zincirinin sonunda `"—"`e düşüyordu, mobil başlığın bağlam satırı
  **tamamen kayboluyordu** (`seasonHeaderLine` → `null`). [[yamalama-kabul-degil]].
- **Dört durum:** `noSeason` · `setup` (açılmış, aktifleştirilmemiş) · `noTerm` · `ready`.
  `setup` ayrı bir hâldir çünkü sunucu ayrımı vermiyor: `academic-sessions/current` YALNIZ
  `Active` sezonu döndürür (yoksa 404 `NO_ACTIVE_SESSION`), `Setup` sezon **yalnız liste
  ucunda** görünür. Çözücü bu yüzden iki kaynağı birlikte okur; liste verilmezse `setup` ile
  `noSeason` ayrılamaz ve sonuç `noSeason` olur (sessiz varsayım uydurulmadı).
- **Çözücü API'si:** `resolveSeasonState({ session, sessions?, termLabel?, now? }) → SeasonState`
  (`key`, `isReady`, `needsSeasonSetup`, `seasonName`, `seasonStatus`, `termId`, `termLabel`,
  `headline`, `title`, `description`). Yanında `seasonStateDescription(state, subject)`,
  `seasonScopedTitle(state, suffix, fallback)` ve `SEASON_TERM_EMPTY_TEXT` (web seçicisi +
  mobil modal aynı metni paylaşır). `termId` de buradan gelir — risk kartındaki
  `useCurrentSession + resolvePlanningTerm` kopyası kalktı.
- **`EmptyState` GENİŞLETİLMEDİ, SARILDI (karar gerekçesi):** `EmptyState`in sözleşmesi
  `D-10` ekseninde kurulu ve `filtered` prop'u zorunlu — sezon durumu o eksenin üstünde
  değil, yanında duran ikinci bir eksendir (dört hâl, filtreyle ilgisi yok). Her çağrı
  yerinde `filtered={false}` yazdırmak sözleşmeyi anlamsızlaştırırdı (SOLID-S). Ama MARKUP
  tek sahipli kaldı: `SeasonStateEmpty` kendi iskeletini yazmaz, `EmptyState`i `compact`
  varyantıyla çağırır. **Yeni CSS yok.**
- **Hata ↔ boş durum ayrıldı:** `SeasonStateEmpty` "Tekrar dene" ASLA sunmaz; gerçek hata
  (ağ/500) hâlâ `DshCardError` çizer.
- **`seasonHeaderLine` SİLİNDİ** (core): sezon yokken `null` döndürüyordu. Karşılığı
  `state.headline` — hiçbir durumda boş kalmaz ("Sezon yok" da bir bağlamdır).
- **Dokunulan yüzeyler:** pano (`attendance-risk-card`, `live-attendance-card`,
  `attendance-kpi-card`, `grade-entry-card`, `summary-kpis`), topbar `season-context-picker`,
  ayarlar `holiday-tab` başlığı (`D-20` "— Sezonu Tatilleri"), mobil `use-portal-header` +
  `use-season-context` + `season-context-modal`.
- **Topbar iki yeni davranış:** (1) kurulumdaki sezon artık YÖNETİCİYE listelenir (kilitli
  satır + "Kurulumda" rozeti) — eski "taslak yıl hiçbir rolde listelenmez" kararı müdürün
  sezonu açtığı hâlde "—" görmesine yol açıyordu; (2) **sezonu açma yolu seçiciye eklendi**
  ("Sezon Aç" / "Sezonu Aktifleştir" → `/academic-sessions`), bugüne dek tek giriş panodaki
  geri sayım kartıydı. Durum noktası da artık renk taşıyor (`.dot.warn` / `.dot.off`,
  `season-picker.css`'e 2 kural).
- **`useSeasonState` liste isteğini `enabled` ile KAPATMAZ:** seçicideki eski
  `enabled: canPickYear` gerekçesi "ihtiyaç yok"tu; artık her rolün sezonsuz hâli doğru
  yazması gerekiyor. Aynı `queryKey` mobil bağlam modaliyle paylaşıldığı için önbellekten gelir.
- **Sunucuda DEĞİŞİKLİK YOK** (eşzamanlı ajan): aynı kök durum için 6 ayrı sözleşme ölçüldü
  (404 `NO_ACTIVE_SESSION` · 404 `Error.NotFound` · 200 + boş DTO · 200 + `[]` ·
  200 + `warning` · 409/422). Hizalama ayrı işe bırakıldı.

## 2026-09-16 — Diyalog temeli + Enter ile ilerleme (`D-19`, `B-51`, `TB-174` ekran ayağı)

`D-19`'un merkezi kapanışı. **Yeni paylaşılan bileşen AÇILDI:** `Dialog` + `ConfirmDialog`
(`components/shared/`), **yeni paylaşılan hook:** `useGridEnterNav`
(`packages/ui/src/hooks/use-grid-enter-nav.ts`).

- **Gerekçe:** uygulamada paylaşılan diyalog yoktu; 25'ten fazla özellik scrim/Esc/✕'yı
  ayrı yazmıştı (`.snf-mclose`, `.dx`, `.grv-drawer-x`, `.gb-x` …). Ayarların `AModal`'ı
  ve `ADrawer`'ı çarpıya `ayr-mx` sınıfını veriyordu ama o sınıfın **hiç CSS kuralı yoktu**
  — çarpı sol üstte çıplak duruyordu.
- **Kabuk yeniden tanımlanmadı:** `Dialog` screens.css'teki `.att-modal-wrap/.att-scrim/
  .att-modal/-head/-body/-foot` sınıflarını kullanır. `dialog.css` yalnız eksik olanı ekler:
  `.dlg-x` (ölçüler `.snf-mclose` ile birebir; `.dlg-x.inline` flex başlıklı çekmecede akışta
  sağa yaslı), `.att-modal.dlg .att-modal-head` sağ boşluğu ve `.dlg-warn/.dlg-danger` ikon tonları.
- **Sözleşme:** `Dialog` — `title`, `subtitle`, `icon`, `tone`, `onClose`, `closeDisabled`
  (Esc/scrim/✕ kilidi), `closeOnScrim`, `className` (genişlik varyantı), `footer`.
  `ConfirmDialog` — `title`, `subtitle`, `tone` (vars. warn), `children` (sonuç cümlesi),
  `confirmLabel`, `cancelLabel` (vars. "Vazgeç"), `confirmVariant` (`primary`/`danger` →
  portlu `.att-btn.primary` / `.att-btn.snf-danger`), `busy`, `busyLabel`, `onConfirm`, `onCancel`.
- **Taşınan:** ayarların `AModal`'ı `Dialog`'a ince sarmalayıcı oldu (6 çağrı yeri, prop
  sözleşmesi aynı); `ADrawer` çarpısı `.dlg-x.inline`. Zil Programı onayı doğrudan `ConfirmDialog`.
- **Kademeli geçiş (açık iş):** kalan özel modallar (`features/*/modals.tsx`, roll-call,
  grade, exam, club, duty, homework …) TAŞINMADI. Yeni modal `Dialog`/`ConfirmDialog` ile
  yazılır; eskisine dokunulduğunda taşınır. Feature'a özgü çarpı sınıfları taşındıkça silinir.
- **`useGridEnterNav({ rowCount, colCount, onAppendRow?, disabled? })`** →
  `{ cellRef(r, c), onKeyDown(r, c), focusCell(r, c) }`. Satır öncelikli: Enter sonraki hücre,
  satır sonunda sonraki satırın ilk hücresi, son hücrede `onAppendRow` ile yeni satır + odak;
  Shift+Enter geri. İlk tüketici Zil Programı saat alanları.
  **Not ızgarası (`grade-grid-screen.tsx` `onCellKey`) taşınmadı:** orada Enter sütun
  öncelikli (aşağı), G/M tuşları, oklar/Tab ve hatalı hücrede kilit var — farklı anlam; ayrıca
  canlı veriyle tarayıcıda ölçülemeden taşımak güvenli değildi.
- **Mobil:** zil ekranı salt okunur; `D-19`/`B-51` kusurlarını taşımıyor. `TB-174` uyarısı
  core'daki ortak cümleyle (`lessonlessDayWarning`) mobile de eklendi (`Note tone="warning"`).
