# Tasarım — Dersler & Branşlar (Akademik Modül, frontend-first)

**Tarih:** 2026-06-11
**Repo:** `oksis-web` (ekran), `oksis` workspace (bu doküman + modül belgeleri)
**Branch:** `dersler`
**Durum:** Onaylanmış tasarım → implementation plan'a hazır

---

## 0. Bağlam ve girdiler

Akademik modülün ilk ekranı geliştirilecek. Girdi paketi:

- `Dersler_Branslar_Tasarim_Brief.md` — arayüz/etkileşim brief'i
- `Dersler_Branslar_Ihtiyac_Analizi.docx` — kavramsal ihtiyaç analizi (Branş ≠ Ders ≠ Görevlendirme ayrımı)
- `Akademik_Modul_Teknik_Analiz_OKSIS.docx` — veri modeli/iş kuralı/API referansı (generic snake_case; OKSİS konvansiyonuna uyarlanacak)
- `Oksis Layout - Akademik Modül.zip` → `design_handoff_academics/` — hi-fi tasarım referansı (JSX/CSS prototip + README + `brand.css` tokenları)

Brief üç ekran öneriyordu (Dersler & Branşlar, Görevlendirmeler, Sidebar). Bu round **yalnızca Dersler & Branşlar** + sidebar Akademik grubu yapılır.

---

## 1. Bağlayıcı spec uyumu (CLAUDE.md Mutlak Kural #6)

`.claude/specs/oksis-admin-ekranlari-mimari-spec.md` bu işin göbeğine değiyor. Çakışma yüzeye çıkarıldı ve karara bağlandı:

- **Görevlendirme sahipliği:** Spec §1.2 + §5.7, görevlendirmeyi (`TeachingAssignment`) **öğretmen-merkezli** tanımlar ve ekle/çıkar'ı **Öğretmen detayında** ("ekranın kalbi") konumlandırır. Brief'in **sınıf-merkezli bağımsız Görevlendirmeler ekranı** bu sahiplik sınırıyla çelişir.
- **Karar (kullanıcı, 2026-06-11):** **Spec'e sadık kalınır.** Brief'in sınıf-merkezli Görevlendirmeler düzenleme ekranı **yapılmaz**. Görevlendirmeler menüde "Yakında" pasif öğe olarak görünür. Görevlendirme yönetimi Öğretmen detayında kalır (ayrı iş).
- **Dersler & Branşlar kataloğu** spec kapsamı dışında (spec yalnızca Kullanıcılar/Öğrenciler/Öğretmenler'i kapsar) → **çatışma yok**, yeni ekran. Spec'te branş yalnızca öğretmen niteliği (§5.4 çoklu badge); ders kataloğu hiç yok.
- **Öğretmen↔branş (ana/yan) yönetimi** spec §5.6 gereği Öğretmen detayında → bu ekranda **yapılmaz**; branşın yalnızca türetilen öğretmen sayacı (mock) gösterilir.

Bu kararlar spec ihlali değil; spec-uyumlu daraltma. Yine de `subjects/completion_status.md`'ye karar notu düşülür.

---

## 2. Kapsam

### Yapılır
- Tek ekran, iki sekme: **Dersler** (varsayılan) + **Branşlar**.
- Tasarım paketine **birebir (hi-fi)** sadık görünüm/etkileşim.
- **Frontend-first:** tipli mock veri katmanı + React Query + "D" (Debt) rozetli mutasyonlar.
- Sidebar **Akademik** grubu.

### Yapılmaz (bu round)
- Görevlendirmeler ekranı (menüde "Yakında" pasif).
- Backend (Subject/Branch entity, CQRS slice, endpoint) → **Debt**.
- Öğretmen↔branş ana/yan yönetimi (spec §5.6 → Öğretmen detayında).
- Kolon ayarı / PDF export (opsiyonel, ertelendi).

---

## 3. Karar kayıtları

| Karar | Seçim | Gerekçe |
|---|---|---|
| Görevlendirme ekranı | Yapılmaz, "Yakında" | Spec §5.7 sahiplik sınırı |
| Kapsam | Frontend-first | subjects/teachers backend ≈%0; Frontend-First Debt deseni |
| Ders type adı | `Subject` | `subjects` modülü mevcut |
| Branş type adı | `Branch` | Kısa, domain bağlamı net (UI: "Branş") |
| Nav | Yeni **Akademik** grubu + Ders Programı & Nöbet Yönetimi "Okul"dan Akademik altına **taşınır** | Brief'in tam menü yapısı |

---

## 4. Yerleşim

### 4.1 Route
- `/admin/subjects` — `RequirePermission` ile sarmalanır (students/classrooms deseni, `routes.tsx`).
- Sekme URL state: `?tab=dersler|branslar` (varsayılan `dersler`).

### 4.2 Nav (`AdminLayout.tsx`)
Mevcut `Okul` grubundan **Ders Programı** ve **Nöbet Yönetimi** çıkarılır; yeni grup eklenir:

```
Akademik
  ├─ Dersler & Branşlar   → /admin/subjects        (aktif, icon: BookOpen)
  ├─ Görevlendirmeler     → (href yok, badge "Yakında")  (icon: UserCheck)
  ├─ Ders Programı        → /admin/schedule         (taşındı, aktif)
  └─ Nöbet Yönetimi       → /admin/duty-management   (taşındı, aktif)
```

"Yakında" pasif öğe: `ShellNavItem` href'siz + `badge:"Yakında"` (NavItem zaten `static` render + badge destekliyor).

### 4.3 Klasör (`src/portals/admin/subjects/`)
Students/classrooms iskeletiyle bire-bir:

```
subjects/
  SubjectsPage.tsx          # sekme kabuğu + PageHeader + tab state
  index.ts
  subjects.css              # academics.css'ten port edilen akademik-özel sınıflar
  types.ts                  # Subject, Branch, enums
  api/subjectsApi.ts        # mock'tan çözen tipli fonksiyonlar (Debt)
  data/seed.ts              # gerçekçi Türkçe seed (branş/ders/öğretmen sayıları)
  keys/                     # React Query keys (tenant-prefix, students deseni)
  hooks/                    # useSubjectsQuery, useBranchesQuery, useBranchStats, useSubjectDebt
  lib/                      # filtre/türetme yardımcıları (filterSubjects, branchStats)
  components/
    SubjectsTabs.tsx        # .aca-tabs sticky, sayaç rozetli
    CoursesToolbar.tsx      # arama + branş/seviye/tür filtresi
    CoursesTable.tsx        # Dersler tablosu
    BranchesTable.tsx       # Branşlar tablosu
    BranchBadge.tsx         # .aca-branch renkli nokta + ad
    SubjectTypeBadge.tsx    # .aca-tur (Zorunlu/Seçmeli)
    LevelChips.tsx          # .aca-lvl seviye kareleri
    StatusDot.tsx           # .aca-status aktif/pasif
    RowMenu.tsx             # 3-nokta menü (Düzenle/Pasife Al/Sil)
    CourseDrawer.tsx        # Ders ekle/düzenle (Sheet)
    BranchModal.tsx         # Branş ekle/düzenle (Dialog)
    states/                 # CoursesEmptyState, BranchesEmptyState, FilteredEmptyState
  __tests__/
```

Reuse (paylaşılan): `PageHeader`, `Sheet`, `Dialog`, `StandardEmptyState`, `students.css` (`.stu*`, `.btn*`).

---

## 5. Veri modeli (frontend types — İngilizce identifier, Türkçe UI)

```ts
type Status = "active" | "passive";
type SubjectType = "zorunlu" | "secmeli";
type Level = 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

interface Branch {
  id: string;
  name: string;        // "Matematik"
  mebCode?: string;    // opsiyonel MEB branş kodu
  status: Status;
  colorKey: string;    // rozet rengi anahtarı (branş→renk, stabil)
}

interface Subject {            // Ders
  id: string;
  name: string;                // "T.C. İnkılap Tarihi ve Atatürkçülük"
  code?: string;               // "İNK"
  branchId: string;            // FK → Branch
  levels: Level[];             // çoklu seviye
  type: SubjectType;           // zorunlu | seçmeli
  recommendedWeeklyHours?: number;
  description?: string;
  status: Status;
  hasAssignments: boolean;     // mock: görevlendirmesi var mı (sil kilidi için)
}

interface BranchStats {        // türetilen
  branchId: string;
  subjectCount: number;        // bağlı ders sayısı (seed'den türetilir)
  teacherCount: number;        // mock öğretmen sayısı
}
```

> Teknik analizdeki `branslar/dersler/gorevlendirmeler` snake_case tabloları **referanstır**; gerçek implementasyon OKSİS konvansiyonu (İngilizce, EF entity ileride) izler. Görevlendirme/ders_seviye/ogretmen_brans tabloları backend Debt fazına bırakılır.

---

## 6. Ekran kompozisyonu (handoff eşlemesi)

### 6.1 Kabuk
`PageHeader`: breadcrumb **"Akademik › Dersler & Branşlar"**, başlık "Dersler & Branşlar", alt açıklama "Müfredat derslerini ve öğretmen branşlarını yönetin", sağda aktif sekmeye göre `+ Yeni Ders` / `+ Yeni Branş`.
Altında `.aca-tabs` sticky sekme çubuğu: **Dersler** (sayaç) · **Branşlar** (sayaç), aktif sekmede 2.5px accent alt çizgi.

### 6.2 Dersler sekmesi
- **Toolbar:** arama (ad/kod) · Branş filtresi (select) · 9/10/11/12 seviye chip'leri (çoklu) · Tür (Zorunlu/Seçmeli).
- **Tablo** (`.stu-tbl`): Ders Adı (w700) · Kod (muted) · **Branş** (`.aca-branch` rozet) · **Seviye** (`.aca-lvl` kareler) · **Tür** (`.aca-tur`; Seçmeli mor) · Öner. Haftalık Saat (tabular, "6 saat"/"—") · **Durum** (`.aca-status`) · aksiyon (hover kalem + 3-nokta).
- **Satır tıklama → CourseDrawer** (sağdan Sheet). Pasif satır %50 opaklık.
- **3-nokta:** Düzenle · Pasife Al/Aktifleştir · (ayraç) · **Sil** (`hasAssignments` ise disabled + tooltip "Görevlendirmesi olan ders silinemez — pasife alın").
- **Boş durum:** hiç ders yokken yönlendirici boş durum + `+ Yeni Ders`. Filtre sonucu boşsa "Filtreleri Temizle".

#### CourseDrawer alanları
Ders Adı* · (Kod + Öner. Haftalık Saat yan yana) · Branş* (select; ipucu: "Bu seçim görevlendirmedeki branş uyumu kontrolünü besler") · Seviye (`.chip-pick` çoklu chip ızgarası) · Tür (`.seg` segmented) · Açıklama (textarea).
Footer: İptal · (boşluk) · **Kaydet ve Yeni Ekle** (kaydeder, formu sıfırlar, 1.8s yeşil onay notu) · **Kaydet** (primary). Geçersizken ikisi de disabled.

### 6.3 Branşlar sekmesi
- Toolbar **yok**.
- **Tablo:** Branş Adı (renkli nokta + ad) · MEB Kodu · **Bağlı Ders Sayısı** (`.aca-cnt` kitap ikonu) · **Öğretmen Sayısı** (`.aca-cnt` kullanıcı ikonu) · Durum · aksiyon. Sayaç 0 ise soluk.
- **Satır tıklama → BranchModal** (Dialog): Branş Adı* · MEB Kodu.
- **3-nokta:** Düzenle · Pasife Al · **Sil** (yalnızca bağlı ders/öğretmen yoksa aktif; aksi disabled + tooltip).
- **Boş durum:** "Henüz branş tanımlanmadı…" + `+ Yeni Branş`.

---

## 7. Veri katmanı davranışı (frontend-first)

- `api/subjectsApi.ts`: seed üzerinden çözen, simüle latency'li tipli fonksiyonlar (list/create/update/setStatus/delete). Tümü **mock**; gerçek endpoint yok → Debt.
- `hooks/`: React Query `useSubjectsQuery`, `useBranchesQuery`, `useBranchStats`. Mutasyonlar **mock + optimistic**, UI'da **"D" rozeti** (`useSubjectDebt`, students `useStudentDebt` deseni).
- `keys/`: tenant-prefix'li query key (students keys deseni; multi-tenant kuralı).
- Filtre/sıralama yüklü liste üzerinde client-side (FE-first); arama debounce'lu URL state.
- **Branş uyumu rengi:** `colorKey` → stabil rozet rengi (branş→renk eşlemesi `lib`'de).

---

## 8. Stil + i18n

- **Reuse:** `students.css` (`.stu`, `.stu-inner`, `.stu-card-wrap`, `.stu-tbl`, `.stu-toolbar`, `.btn`, `.btn-primary`, `.btn-ghost`).
- **Yeni `subjects.css`:** handoff `academics.css`'ten port — `.aca-tabs`, `.aca-branch`, `.aca-tur`, `.aca-lvl`, `.aca-status`, `.aca-cnt`, `.seg`, `.chip-pick`, `.rmenu`, drawer alanları `.fld`/`.fld-row`. Tokenlar (`--navy`, success/warning/danger, Plus Jakarta Sans) zaten projede mevcut.
- **i18n:** yeni `subjects` namespace; tüm Türkçe metin key. Inline style yasak; default export yasak; `any` yasak (web kuralları).

---

## 9. Test (vitest)

- `lib` türetme: `branchStats` (bağlı ders sayımı), `filterSubjects` (arama+branş+seviye+tür birlikte).
- `SubjectsTabs`: sekme geçişi sayaçları, URL state.
- `CourseDrawer`: zorunlu alan validasyonu (kaydet disabled), "Kaydet ve Yeni Ekle" form reset + onay notu.
- `BranchModal`: kaydet, sil-kilidi (bağlı ders varken disabled).
- `RowMenu`: dış tıklama kapanış, disabled öğe + tooltip.

---

## 10. Modül dokümanı güncellemeleri

- `.claude/docs/modules/subjects/`: domain-model, api-contracts, database-schema, business-rules, permissions doldurulur (Branch dahil; teknik analiz veri modeli kaynak).
- `subjects/completion_status.md`: ilerleme + **Debt** (backend yok, mock veri) + **karar notu** (görevlendirme spec-uyumlu olarak Öğretmen detayına bırakıldı; bu ekran katalog).
- `subjects/README.md`: Last Updated + Files checkbox.
- Branş `subjects` modülünde belgelenir; Öğretmenler tüketici (ileride paylaşımlı katalog notu).

---

## 11. Kabul kriterleri

1. `/admin/subjects` açılır; Akademik nav grubu doğru (Dersler & Branşlar aktif, Görevlendirmeler "Yakında", Ders Programı/Nöbet taşınmış).
2. Dersler sekmesi: tablo + filtreler + drawer ekle/düzenle/Kaydet-ve-Yeni + pasife alma + sil-kilidi çalışır (mock).
3. Branşlar sekmesi: tablo + modal + sayaçlar + sil-kilidi çalışır (mock).
4. Boş ve filtre-boş durumlar doğru.
5. Görünüm handoff'a hi-fi sadık (token, tipografi, rozet, durum renkleri).
6. Hardcoded Türkçe yok; default export yok; `any` yok; inline style yok.
7. Testler geçer; `npm run build` temiz.
8. `subjects` modül dokümanı + completion_status güncel.
