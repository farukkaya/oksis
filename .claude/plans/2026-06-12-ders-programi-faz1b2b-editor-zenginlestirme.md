# Ders Programı Faz 1B-2b — Editör Zenginleştirme (Web) Tasarım

> Bağlayıcı spec: `.claude/specs/ders-programi-modulu-spec.md` (§6, §7, §9.2).
> Teknik analiz §6 (çakışma motoru — iki kademe). Tasarım handoff:
> `.claude/docs/modules/timetable/_handoff/{schedule_editor.jsx,schedule_editor.css,README.md}`.
> Önceki dilim: 1B-2a editör çekirdeği (place/move/remove + taslak kaydet).

**Hedef:** Editöre öğretmen/derslik yeniden atama (hücre bağlam menüsü), blok ders
oluşturma (çoklu seçim + toolbar), canlı ön-kontrol (sürüklerken yeşil/kırmızı + sebep),
Doğrula çubuğu + panel (eksik-saat raporu + "Hücreye git" flash) eklemek.

**Backend:** Tüm uçlar hazır — `PUT .../placements/{pid}/teacher`, `.../room`,
`POST .../blocks`, `POST .../precheck`, `GET .../conflicts`. (SchedulingController, Faz 1A.)

---

## 1. Hücre bağlam menüsü — `CellMenu` (Radix Popover, portal)

Dolu hücreye tıkla veya hover'daki `cc-more` ⋯ → popover:
- **Öğretmen değiştir ›** — alt-menü: `lookups.teachers` listesi, seçili ✓ → `assignTeacher(pid, teacherId)` → `PUT /placements/{pid}/teacher`.
- **Derslik değiştir ›** — alt-menü: `lookups.rooms` + "Derslik yok" (null), seçili ✓ → `assignRoom(pid, roomId|null)` → `PUT /placements/{pid}/room`.
- ayraç — **Kaldır** (danger) → mevcut `remove(pid)`.
- 409 (slot meşgul) → hücre kırmızı flaş + sebep toast'u (`interpretConflict`).
- Stiller `.sed-cmenu / .sed-cmenu-item / .sed-cmenu-sub / .sed-cmenu-opt / .sed-cmenu-sep` handoff'tan portlanır. Popover portal'a taşınır (handoff'un overflow uyarısı).

## 2. Blok oluştur — çoklu seçim + toolbar

- Toolbar'da **"Blok modu"** toggle → hücrelere tıkla-seç (seçili highlight). Seçim ≥2, aynı gün, ardışık period olunca **"Blok oluştur"** aktif → `setBlock(placementIds)` → `POST /blocks`.
- Backend ardışıklık/aynı-gün/≥2 doğrular; 409 kodları (`block-needs-two/same-day/consecutive`) → i18n uyarı.
- Blok render (saf fonksiyon `deriveBlocks`): `blockGroupId` grubunda min period = `block-start`, diğerleri `block-cont`; "BLOK" etiketi + kesik bağlayıcı.
- **Bloğu böl: kapsam dışı (A kararı)** — domain `ClearBlock` yok → Debt.

## 3. Canlı ön-kontrol — precheck (§6 etkileşimli kademe)

- dnd-kit `DndContext onDragOver` → üzerine gelinen **boş** hücre için `precheck(day, period, teacherId, roomId)` → `POST /precheck`.
- Sürüklenen öğenin teacher/room: unplaced çip (`unplaced:subj:teacher`) ya da taşınan placement.
- Sonuç: `ConflictResult { isBlocking, code/reason }` → hücre `drop-ok` (yeşil) / `drop-bad` (kırmızı) + `drop-tip` sebep.
- Debounce + cache (`slot:teacher:room` anahtar); aynı slota tekrar gelince ağ yok.
- Hint banner: "Bir dersi sürüklerken hedef hücre uygunsa yeşil, çakışıyorsa kırmızı yanar."
- Müsaitlik/lock Faz 4 → Faz 1'de no-op.

## 4. Doğrula çubuğu + panel — `.sed-valbar` / `.sed-issues`

- Alt şerit pill'leri: "N eksik saat" (warn) · temizse "Sorun yok" (ok). Çakışma pill'i render edilir ama Faz 1'de daima 0 (DB engeli).
- Legend: Uygun / Çakışma / Boş-eksik / Müsait değil (`.sed-leg.ok/.bad/.warn/.lock`).
- **Doğrula** butonu (`.sed-doverify`) → `.sed-issues` panelini aç/kapat (toggle).
- Issues satırları: eksik-saat (warn) + (varsa) çakışma (bad), her birinde **"Hücreye git →"**.

## 5. Eksik-saat modeli (B kararı) — hücre-bazlı, client-side

- `deriveMissingCells(cellMap, gridRows, days)`: bell **ders** periyotlarındaki boş hücreler = eksik. Saf fonksiyon (TDD).
- "Hücreye git" hedef hücre gerektirir → hücre-bazlı model. Sol paneldeki ders-bazlı kalan saat (drag kaynağı, `/unplaced`) ayrı kalır.
- **Debt-FE-4:** mandatory/optional period ayrımı (tasarım 1-6 vs 7-8) backend'de yok → Faz 1'de tüm ders periyotları "zorunlu" sayılır; kademe/müfredat period config gelince incelt.

## 6. "Hücreye git" + flash

- `flashTo(day, period)`: hücreye `scrollIntoView`/`scrollTo` (smooth, offsetTop−90) + `.sed-cell.flash` animasyonu bir kez (~1.4s). Mevcut conflict `flash()` ile birleşir.

## Kapsam dışı (C kararı — "Yakında", bu fazda yapılmaz)
- Öğretmen görünümü segmenti (salt-okunur haftalık) — Faz 2 türevleri.
- Yayınla — Faz 2.
- Üç-nokta "daha fazla" menü (çoğalt/sürüm/PDF/sil) — Faz 2+.

## Saf fonksiyonlar (editorDerive — TDD)
- `deriveBlocks(placements)` → `Map<pid, 'start'|'cont'>`.
- `deriveMissingCells(cellMap, gridRows, days)` → `string[]` (day:period anahtarları).
- `precheckKey(day, period, teacherId, roomId)` → cache anahtarı.
- (mevcut) `buildCellMap`, `resolveDrop`, `interpretConflict`, `cellKey`.

## Backend gerçeği / Debt
- Kalıcı çakışma Faz 1'de oluşamaz (filtreli unique) → Doğrula çakışma bölümü uyumaz; eksik-saat aktif.
- **Debt-FE-4** (yukarıda): hücre-bazlı eksik modeli, mandatory/optional ayrımı yok.
- **Bloğu böl** backend'i yok → menüden çıkarıldı (Debt).
