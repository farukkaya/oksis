# Ders Programı — Faz 5 / Dilim-0: Editör "Öğretmen Görünümü" (salt-okunur mercek) — Tasarım

> Bu dosya `.claude/specs/` altındadır → **bağlayıcı anlaşma** (CLAUDE.md Absolute Rule #6).
> Numaralı maddeler (`D1`, `D2` …) pazarlık dışıdır. Aykırılıkta dur, madde no ile bildir.

**Tarih:** 2026-06-20 · **Kapsam:** `oksis-web` (FE-only) · **Tier:** Frontend
**Faz:** 5 / Dilim-0 (kapanış — Faz 2'den ertelenen editör açık ucu)

---

## 1. Amaç & Bağlam

Admin editöründe (`ScheduleEditorPage`) toolbar'da **Sınıf görünümü / Öğretmen görünümü**
toggle'ı var; "Öğretmen görünümü" butonu Faz 2'den beri `disabled title={soonPhase2}`
(`oksis-web/src/portals/admin/timetable/editor/components/EditorToolbar.tsx:73`).

Bu dilim o butonu etkinleştirir. **Öğretmen görünümü = editörde açık olan tek programın
(ör. 9-A), seçilen öğretmen gözünden salt-okunur önizlemesi.** Yayınlamadan önce "bu
öğretmenin haftası nasıl görünecek" kontrolü sağlar. Çalışma tamponunu (kaydedilmemiş
değişiklikler dâhil) yansıtır.

**Önemli:** Bu, başka sınıfların programlarına bakan holistik bir öğretmen-haftası görünümü
**değildir**. Mercek tek programa (açık olan sınıfa) bağlıdır; rozet "Salt-okunur · {sınıf} merceği".

## 2. Karar: FE-only (yeni BE YOK)

Editör tüm gerekli veriyi zaten client'ta tutar → **sıfır yeni endpoint/migration/izin.**

- **D1 — Veri kaynakları (hepsi mevcut):**
  - Çalışma yerleşimleri: `useEditorDraft.foldOps(state)` → `PlacementDto[]`
    (`day/period/subjectId/teacherId/roomId` + blok alanları). Kaydedilmemiş tampon dâhil.
  - İsimler: `useEditorData().lookups` (`teachers/subjects/rooms` Map id→ad).
  - Başka sınıf meşguliyeti: `ScheduleEditorPage` içindeki `occQ` sorgusu
    (`fetchExternalOccupancy(programId)` → `GET .../external-occupancy`, P29) —
    çakışma işareti (`deriveConflicts`) için **zaten çekiliyor**. Tip `ExternalOccupancy`
    (`editor/lib/editorDerive.ts`): `teachers` = teacherId×day×period dolu slotları.
- **D2 — Yeni BE eklenmez.** (completion_status'taki eski "5-0.1 (BE) yeni query" notu bu
  kararla geçersiz; düzeltilecek.)

## 3. Davranış (binding)

- **D3 — Toggle:** `ScheduleEditorPage`'de `viewMode: "class" | "teacher"` state. Varsayılan
  `"class"`. `EditorToolbar` butonundan `disabled` kalkar; `onChangeView(mode)` bağlanır.
  Sınıf görünümü mevcut editör (DnD/menü/precheck) — değişmez.
- **D4 — Öğretmen seçici:** Öğretmen görünümü aktifken, **programdaki yerleşimlerden türeyen
  distinct öğretmenler** (ad `lookups.teachers`'tan) bir seçicide listelenir. Varsayılan: ilk
  öğretmen (deterministik — ada göre sıralı). Programda hiç yerleşim yoksa → boş durum
  ("Önce ders yerleştirin"), grid çizilmez.
- **D5 — Salt-okunur grid:** Seçilen öğretmen için gün×period ızgarası:
  - **(a) Bu programdaki ders:** seçilen öğretmenin yerleşimi olan hücre → detaylı salt-okunur
    chip (ders adı + sınıf adı + derslik adı). Blok dersler salt-okunur span (start/cont) olarak.
  - **(b) Başka sınıf:** `externalOccupancy.teachers` içinde seçilen `teacherId` o (day,period)'da
    varsa → detaysız genel **"Başka sınıf"** işareti.
  - **(c) Diğer hücreler:** boş.
  - **(a)+(b) aynı hücrede olamaz** (öğretmen aynı slotta iki yerde olamaz; çakışma zaten
    sınıf görünümünde işaretlenir). Çakışırsa (a) öncelikli + sınıf görünümüne yönlendiren not.
- **D6 — Salt-okunur semantik:** Sürükle-bırak, hücre bağlam menüsü, precheck, blok-modu
  **devre dışı**. Yalnız görüntüleme. Rozet: "Salt-okunur · {sınıf} merceği".
- **D7 — Tampon yansıması:** Grid `foldOps` çıktısını kullanır → kaydedilmemiş düzenlemeler
  önizlemede görünür (gerçek "yayın öncesi önizleme").

## 4. Bileşen & Dosya Planı

- **Saf fonksiyon (TDD çekirdeği):** `editor/lib/teacherView.ts`
  - `deriveTeacherView(placements, externalOcc, teacherId): TeacherViewCell[]`
    → her (day,period) için `{ kind: "lesson" | "elsewhere" | "empty", ... }` modeli.
  - `distinctTeachers(placements, lookups): {id,name}[]` (ada göre sıralı).
- **Bileşen:** `editor/components/TeacherPreviewGrid.tsx` (salt-okunur ızgara) —
  mümkünse mevcut `WeekGrid` hücre/teneffüs iskeletini paylaşır; DnD/menü prop'ları olmadan.
- **Toolbar:** `EditorToolbar.tsx` — `viewMode` + `onChangeView` prop'ları; teacherView
  butonundan `disabled`/`title={soonPhase2}` kalkar.
- **Sayfa:** `ScheduleEditorPage` — `viewMode` state + seçilen `teacherId` state + koşullu render.
- **i18n (`timetable` ns, tr/en):** `editor.teacherView` (mevcut) + yeni
  `editor.teacherPreview.{selectorLabel, elsewhere, readonlyBadge, emptyState}`. Hardcoded TR yok.

## 5. Test (TDD)

- **Saf birim:** `teacherView.test.ts` — `deriveTeacherView`: (a) bu-program dersi detaylı,
  (b) başka-sınıf işareti, (c) boş hücre, blok span, (a)/(b) çakışmada (a) önceliği;
  `distinctTeachers` sıralama/tekilleştirme.
- **Bileşen:** toggle → seçici + salt-okunur grid render; DnD/menü handler'larının **olmadığı**;
  öğretmen değiştirince grid değişir; boş program → boş durum.
- Tam `npm run test` yeşil + `npm run build` temiz hedefi.

## 6. Kapsam Dışı (YAGNI)

- Çok-sınıf / holistik öğretmen-haftası (öğretmenin TÜM sınıflardaki dersleri) — bu dilim değil.
- Öğretmen görünümünden düzenleme (her zaman salt-okunur).
- Başka-sınıf meşguliyetinin detayı (sınıf/ders adı) — yalnız genel "Başka sınıf".
- Yeni BE endpoint/izin/migration.

## 7. completion_status Düzeltmesi

`timetable/completion_status.md` → Faz 5 / Dilim-0 maddesi güncellenecek: "5-0.1 (BE) yeni
query" **kaldırılır**; dilim **FE-only** olarak işaretlenir (D2 gerekçesiyle).
