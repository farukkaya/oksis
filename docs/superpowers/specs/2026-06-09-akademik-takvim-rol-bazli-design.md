# Tasarım: Akademik Takvim'in Rol Bazlı Ortaklaştırılması

**Tarih:** 2026-06-09
**Branch:** academics
**Kapsam:** `oksis-web` — Akademik Takvim ekranının Admin'e ek olarak Öğretmen / Öğrenci / Veli portallerinde salt-okunur açılması ve kodun ortak modüle taşınması.
**Handoff referansı:** `Oksis Layout Rol Bazlı Akademik Takvim.zip` → `design_handoff_oksis_takvim_rolbazli/README.md`

---

## 1. Problem ve Bağlam

Akademik Takvim ekranı şu an tamamen `src/portals/admin/academic-calendar/` altında ve yalnız `/admin/academic-calendar` route'undan erişiliyor. Ürün kararı: ekran **süperadmin hariç tüm rollerde** (Admin + Öğretmen + Öğrenci + Veli) görünecek; diğer üç rolde **salt-okunur**.

Bir cross-portal ekranı `portals/admin/` altında bırakmak, workspace mimarisiyle çelişir:
> "Domain modules under `src/modules/<x>/` are shared across portals; portal-specific UI lives under `src/portals/<role>/`." (workspace CLAUDE.md)

Kod tabanında zaten `src/modules/{identity,users,invitations}` ortak modül deseni var. Ekran bu desene taşınmalı.

### Mevcut durum tespiti
- Route: `/admin/academic-calendar`, izin gate'i `ACADEMIC_SESSIONS_VIEW`.
- `AcademicCalendarPage`, `academic-sessions` modülünden `useSeasonDraftQuery` (planlama/draft sezonu, yalnız admin) import ediyor.
- `teacher` / `parent` / `student` portalleri route + Layout (TeacherLayout, ParentLayout, StudentLayout) olarak zaten mevcut.

---

## 2. Kararlar (onaylı)

| Konu | Karar |
|---|---|
| Kod yeri | `src/modules/academic-calendar/`'a taşı |
| Rol gating | Yeni capability izni `academic-calendar.manage` |
| Non-admin sezon ekseni | Gizli — yalnız aktif sezon |

---

## 3. Tasarım

### 3.1 Kod taşıma → `src/modules/academic-calendar/`

`src/portals/admin/academic-calendar/*` içeriği (pages, components, hooks, api, lib, keys, schemas, types, `__tests__`, `index.ts`) olduğu gibi `src/modules/academic-calendar/`'a taşınır.

- `routes.tsx` import'u `../portals/admin/academic-calendar` → `../modules/academic-calendar` olarak güncellenir.
- Eski `src/portals/admin/academic-calendar/` klasörü silinir.
- `academic-sessions` bağımlılığı (`useSeasonDraftQuery`) import olarak kalır ama **yalnız `canManage` (admin) dalında** kullanılır; non-admin'de query enable edilmez.

### 3.2 Rol gating → capability bazlı

- Yeni izin sabiti: `PERMISSIONS.ACADEMIC_CALENDAR_MANAGE = 'academic-calendar.manage'`.
- Sayfa içinde `canManage = hasPermission(ACADEMIC_CALENDAR_MANAGE)` (kod tabanının mevcut permission hook'u/`RequirePermission` ile aynı izin kaynağı).
- `readonly = !canManage || currentSeason?.status !== 'active'` — handoff kuralı; admin'de bile arşiv/planlama sezonu salt-okunur.
- `canManage === false` iken aşağıdakiler **DOM'da hiç render edilmez** (sadece disable değil):
  - "Etkinlik Ekle" butonu
  - "Dışa Aktar" butonu
  - `SeasonAxisBar` (tüm sezon kartları)
  - Tüm "Sezon Yönetimine Git" yolları (promote kartı, boş-durum butonu, arşiv çubuğu butonu)
  - `AddEventModal`
- `MonthCalendar` `readonly` prop'uyla: gün hücreleri tıklanamaz, `+` ikonu çizilmez.

**İzin matrisi (yeni satır):** `academic-calendar.manage` → SuperAdmin (kapsam dışı, n/a) · SchoolAdmin ✅ · SchoolStaff ⚙️ (okul ayarına göre) · HomeroomTeacher ❌ · Teacher ❌ · Parent ❌ · Student ❌.

### 3.3 Sezon ekseni → non-admin sadece aktif sezon

- `canManage === false` → `SeasonAxisBar` render edilmez; `currentSeasonId` daima `activeSeason.id`'ye sabitlenir (`selectedSeasonId` state'i non-admin'de hiç değişmez).
- `useSeasonDraftQuery` (planlama sezonu) yalnız `canManage === true` iken enable edilir.

**Bağlayıcı kural notu (çelişki değil):** `permission-matrix` / `academic-years/permissions.md`, `academic-sessions.view` (aktif + arşiv) iznini tüm rollere veriyor (madde: rol matrisi satırı `academic-sessions.view` ✅ tüm roller). Bizim "non-admin sadece aktif sezon" kararımız **UI tarafında daha sıkı** bir kısıt; backend bir veliye/öğrenciye arşiv sezonlarını yine döndürebilir, biz bu portallerin UI'ında göstermiyoruz. Bu, "UI permission gates are UX only" (CLAUDE.md Absolute Rule #4) prensibine uygundur ve bağlayıcı izin matrisiyle çakışmaz — yalnızca onun izin verdiğinden daha dar bir UI sunulur.

### 3.4 Routing → 4 portal, tek component

Her portalin route ağacına aynı `<AcademicCalendarPage />`'i render eden bir `academic-calendar` child eklenir:

- `/admin/academic-calendar` — mevcut. `ACADEMIC_SESSIONS_VIEW` gate'i korunabilir (tüm roller bu izne sahip olduğundan zararsız).
- `/teacher/academic-calendar` — yeni (TeacherLayout children).
- `/parent/academic-calendar` — yeni (ParentLayout children).
- `/student/academic-calendar` — yeni (StudentLayout children).
- **Süperadmin'e route eklenmez** (ekran kapsam dışı).

View erişimi `academic-sessions.view` zaten tüm rollerde olduğu için non-admin route'larına ek `RequirePermission` gate'i gerekmez (authenticated yeterli). Yönetim aksiyonları sayfa içinde `canManage` ile gate'lenir.

### 3.5 Sidebar nav

TeacherLayout / ParentLayout / StudentLayout'un "Genel" grubuna eklenir (admin'de zaten mevcut):

```ts
{ label: "Akademik Takvim", icon: CalendarDays, href: "/<portal>/academic-calendar" }
```

Konum: handoff'a göre öğrenci panelinde "Ders Programı"nın, veli panelinde "Çocuğum"un hemen ardına; öğretmende "Genel" grubuna. "Sezon Yönetimi" linki yalnız Admin'in "Yönetim" grubunda kalır — diğer rollere eklenmez.

### 3.6 Alt başlık (i18n)

Alt başlık `canManage`'e göre türetilir:
- `canManage === true` → "Sezon yönetimi ve eğitim-öğretim yılı etkinlikleri"
- `canManage === false` → "Eğitim-öğretim yılı etkinlikleri"

Yeni i18n key: `subtitleReadonly` (mevcut `subtitle` admin varyantı olarak kalır). Hardcoded Türkçe string yok.

---

## 4. Test

- Mevcut `__tests__` dosyaları modülle birlikte taşınır; import path'leri güncellenir.
- Yeni testler:
  - `canManage === false`: "Etkinlik Ekle" ve "Dışa Aktar" butonları render edilmez.
  - `canManage === false`: `SeasonAxisBar` render edilmez; takvim aktif sezonu gösterir.
  - `canManage === false`: `MonthCalendar` readonly (hücre tıklaması modal açmaz, `+` yok).
  - `canManage === false`: subtitle readonly varyantı gösterilir.
  - `canManage === true`: mevcut tam-yetkili davranış korunur (regression).

---

## 5. Dokümantasyon güncellemeleri

- `.claude/docs/modules/academic-years/permissions.md` — yeni `academic-calendar.manage` satırı + davranışsal not.
- `.claude/docs/permission-matrix.md` — yeni izin satırı.
- `.claude/docs/modules/academic-years/completion_status.md` — güncel tarih + ilerleme.
- `.claude/docs/modules/academic-years/ui-flows.md` — rol bazlı görünürlük notu (Admin tam yetki, diğerleri salt-okunur).

---

## 6. Kapsam dışı (YAGNI)

- `AddEventModal` lazy-load / kod bölme (handoff'un perf önerisi). `canManage === false` iken zaten render edilmediğinden erken optimizasyon — yapılmaz.
- Calendar event CRUD için ayrı backend izin/uç tasarımı. Etkinlik ekleme şu an mock fazda; gerçek backend ayrı bir iş kalemi.
- Süperadmin için Akademik Takvim ekranı.

---

## 7. Açık noktalar

- (Yok — kararlar onaylandı.)
