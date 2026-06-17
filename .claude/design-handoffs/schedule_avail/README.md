# Handoff: Ders Programı — Öğretmen Müsaitliği & Tercihleri (`schedule_avail`)

## Genel Bakış
Bu paket, mevcut **`design_handoff_oksis_ders_programi`** paketinin eksik kalan **müsaitlik/tercih yüzeyini** tamamlar. O paketin README'si bu yüzeyi şöyle işaret ediyordu:

> "Öğretmen müsaitlik/talep yüzeyleri `schedule_avail.jsx` … (bu pakete dahil değil — istenirse ayrı handoff)."

İşte o ayrı handoff. **Admin (Yönetim)** rolündeki yönetici, bir öğretmenin haftalık müsaitlik ve tercihlerini 3-durumlu bir ızgarada işaretler; bu işaretler **Otomatik Oluştur** ve **Program Editörü** tarafından kısıt/yönlendirme olarak kullanılır.

> **ZORUNLU TUTARLILIK:** Tüm ekranlar `ders_programi` paketinin tasarım sistemiyle **birebir aynı**dır — aynı `brand.css` token'ları, aynı `PageTop`, `.stu-tbl`/`.stu-toolbar`, `SchStatus`/`SchCount`, editör grid + `.sed-valbar` + drawer desenleri. UI dili tamamen Türkçe; masaüstü-öncelikli admin paneli, açık tema.

---

## Üç müsaitlik durumu (TÜM ekranlarda sabit — renk + ikon birlikte)
Erişilebilirlik için her durum hem **renk** hem **ikon** taşır:

| Durum | Anlamı | Renk (token) | İkon |
|---|---|---|---|
| **Müsait** | Varsayılan — uygun | nötr/yeşil ipucu (`--success` ailesi, hafif) | `check` |
| **Tercih Etmez** | **Yumuşak** uyarı — engel **değil** | amber (`--warning` ailesi) | `minus` |
| **Müsait Değil** | **Kesin engel** (aşılabilir → onay) | kırmızı (`--danger` ailesi) | `ban` |

---

## Önizleme
`source/preview.html` dosyasını tarayıcıda açın. Üstteki köprü çubuğundan dört parça arasında geçiş yapın; **1 · Müsaitlik Ekranı** sekmesinde ayrıca durum varyantlarını (Normal / Yükleniyor / Boş / Hata / Öğretmen seçilmemiş) değiştirebilirsiniz. Bu çubuk yalnızca handoff önizlemesi içindir; gerçek shell değildir.

---

## 1) Ana Ekran — `schedule_avail.jsx` · `AvailabilityScreen`
📷 `screenshots/01-availability-main.png`

Hub ile aynı **`PageTop` + iki-kolon** yerleşim. Admin soldan bir öğretmen seçer, sağdaki haftalık ızgarada durumları işaretler, kaydeder.

**PageTop**
- Breadcrumb: **Akademik › Ders Programı › Öğretmen Müsaitliği** · başlık **"Öğretmen Müsaitliği & Tercihleri"**.
- Alt başlık: "Öğretmenlerin uygun olmadığı ve tercih etmediği saatleri belirleyin; otomatik üretim ve editör bunları dikkate alır."
- Sağ: **dönem seçici** (örn. "2025–2026 Güz") + **Toplu İçe Aktar** (ghost).

**SOL — Öğretmen seçici** (`.stu-toolbar` dili)
- Arama kutusu ("Öğretmen ara…") + **Branş çipleri** (`ACA_BRANCHES` aktifleri).
- Liste satırı: avatar + ad + branş alt-satırı + küçük durum rozeti: **"Tanımlı"** (müsaitlik girilmiş — yeşil noktalı pill) / **"—"** (hiç girilmemiş — nötr). Seçili öğretmen vurgulu.

**SAĞ — Haftalık müsaitlik ızgarası** (editör grid'iyle aynı görsel dil)
- **Başlık şeridi:** öğretmen adı + branş + dönem etiketi + sayaçlar (**N müsait değil / N tercih etmez**) + **kayıt durumu** ("Güncel" / "Kaydedilmemiş değişiklik" `circle-dot` / "Kaydediliyor…" / "Kaydedildi ✓") + **Kaydet** (primary; yalnız değişiklik varken aktif).
- **Izgara:** satırlar = ders saatleri (1.–8. ders; teneffüs/öğle ayraçları editördeki gibi), kolonlar = Pzt…Cum. Her hücre 3 durumdan biri; **tıklayınca döngüsel** (Müsait → Tercih Etmez → Müsait Değil → Müsait) **veya** hücre üstü **3'lü mini-seçim** (hover).
- **Lejant:** Müsait · Tercih Etmez · Müsait Değil (renk + ikon + kısa açıklama).
- **Toplu işlemler:** **"Tüm haftayı Müsait yap"** · **gün başlığına tıkla** → o günü tek durumla doldur (popover) · **"Başka güne kopyala"** / **"Önceki dönemden kopyala"** (ghost).

**Durum varyantları** (önizlemede üst çubuktan seçilir)
- **Yükleniyor:** skeleton ızgara (`.sed-sk` dili).
- **Boş:** "Ders saati (zil programı) tanımlı değil" — ızgara çizilemez uyarısı + CTA.
- **Hata:** yeniden dene.
- **Öğretmen seçilmemiş:** sağ panelde boş-durum ("Soldan bir öğretmen seçin", `user` ikonu).

---

## 2) Editör Entegrasyonu — `schedule_editor.jsx` eklemeleri
📷 `screenshots/02-editor-integration.png`

Mevcut editör grid + `.sed-valbar` + `CellMenu` desenlerine yaslı **dört yeni parça**. Müsaitlik verisi `SED_TEACHER_AVAIL` (öğretmen adına göre `unavail`/`prefer`) ile beslenir.

a) **"Yine de yerleştir" onay diyaloğu** (`AvailOverrideModal` — `Modal` kabuğu, danger ton). Admin, öğretmenin **"Müsait Değil"** saatine ders sürükleyince açılır. Başlık "Öğretmen bu saatte müsait değil", gövde öğretmen + gün/saat, butonlar **Vazgeç** / **Yine de yerleştir** (`btn-danger`).

b) **Override rozeti:** override ile yerleştirilen ders hücresinin köşesinde `alert-triangle` mikro-rozet (`.av-badge`), hover tooltip **"Müsaitlik aşılarak yerleştirildi"**.

c) **"Tercih Etmez" sarı durumu:** öğretmenin tercih etmediği saatteki ders hücresi yumuşak sarı kenar/işaret alır (`.avail-prefer`, engel değil), hover "Öğretmen bu saati tercih etmiyor". **Sürükleme** sırasında hedef hücre: Müsait Değil → kırmızı (`drop-bad`), Tercih Etmez → **sarı** (`drop-warn`, bırakılabilir), Müsait → yeşil (`drop-ok`).

d) **Doğrulama paneli** (`.sed-issues`) yeni satır tipi **"Müsaitlik ihlali"** — kırmızı (override, engelleyici) ve sarı (tercih, yumuşak) ayrımıyla; her satır **"Hücreye git"**. Alt çubuk lejantına **"Tercih edilmez"** (sarı) eklendi; özet pill'lerine amber **"N müsaitlik ihlali"**.

> Müsaitlik ihlalleri yayını **engellemez** (admin bilinçli override yapmıştır); yalnız çakışma + eksik saat yayın kapısını yönetmeye devam eder.

---

## 3) Otomatik Oluştur — `schedule_autogen.jsx` · Aşama 1 yeni ağırlık satırı
📷 `screenshots/03-autogen-weight.png`

"Optimizasyon tercihleri (ağırlıklar)" listesine, mevcut satırlarla **birebir aynı stilde** tek yeni satır — **"Öğretmen boş saatini azalt"ın hemen altına**:
- Etiket: **"Öğretmen tercihlerine uy"** · alt-açıklama "Öğretmenin tercih etmediği saatlerden kaçınır".
- Sağda 3 seçenek: **Düşük / Orta / Yüksek** (varsayılan **Orta**, state anahtarı `w.tercih`).

---

## 4) Hub Rozeti — `schedule.jsx` · `SchCount` türevi
📷 `screenshots/04-hub-badge.png`

Sınıf Programları tablosuna yeni **"Müsaitlik"** sütunu ve `SchCount` ile aynı dilde **`SchAvail`** rozeti: **"Müsaitlik ihlali: N"** sayacı. Renk **amber/turuncu** (`--warning` ailesi; çakışmanın kırmızısından ayrı); **N=0** ise nötr "zero" tonu. Özet şeridine de tıklanır **"Müsaitlik ihlali"** rozeti (amber, hızlı filtre) eklendi.

---

## Tasarım Token Referansı (`source/brand.css` — değişmedi)
`--accent`/`--navy` `#1B2B5E` · `--accent-bright` `#4F6BFF` · `--surface` `#EEF1FA` · `--card` `#FFF` · `--line` `#E6E9F2` · `--text` `#111827` / `--text-muted` `#6B7280` · `--success`/`--success-bg` `#0E7A5A`/`#D7F5EC` · `--warning`/`--warning-bg` `#B05A0A`/`#FEF3C7` · `--danger`/`--danger-bg` `#991B1B`/`#FEE2E2` · `--r-card`/`--r-md`/`--r-sm` `14/12/8` · font **Plus Jakarta Sans**.

---

## Dosya Envanteri (`source/`)
| Dosya | İçerik |
|---|---|
| **`schedule_avail.jsx` / `schedule_avail.css`** | **YENİ** — `AvailabilityScreen` (admin 3-durumlu müsaitlik ızgarası, öğretmen seçici, toplu işlemler, durum varyantları) |
| `schedule_editor.jsx` / `schedule_editor.css` | **+entegrasyon** — `AvailOverrideModal`, `SED_TEACHER_AVAIL`, override rozeti, sarı "tercih etmez", `drop-warn`, doğrulama paneli "Müsaitlik ihlali" + lejant "Tercih edilmez" |
| `schedule_autogen.jsx` | **+ağırlık** — "Öğretmen tercihlerine uy" satırı |
| `schedule.jsx` / `schedule.css` | **+rozet** — `SchAvail`, "Müsaitlik" sütunu + özet şeridi rozeti |
| `schedule_publish.jsx` / `.css`, `academicsBase.jsx`, `components.jsx`, `modals.jsx` / `.css`, `students.jsx` / `.css`, `academics.css`, `shell.css`, `icons.jsx`, `brand.css` | `ders_programi` paketinden değişmeden taşındı (paylaşılan tasarım sistemi) |
| `preview.html` / `preview.jsx` | Handoff önizleme köprüsü (4 parça + durum varyantları) — production'da kullanılmaz |

## Üretim Notları
- Tüm veri statiktir (mock — Atlas Koleji · Lise). Production'da müsaitlik kaydı **API'den** gelir; öğretmen-bazlı `unavail`/`prefer` işaretleri sunucudan beslenmeli.
- **"Müsait Değil" kesin engeldir** ama admin override edebilir — bu karar sunucu tarafında da loglanmalı (kim, ne zaman, hangi öğretmen/saat). **"Tercih Etmez"** asla engel değildir; yalnız otomatik üretimde ağırlık ve editörde uyarıdır.
- Çakışma motoru gibi, müsaitlik ihlali tespiti de prototipte mock'tur; otoritesi backend olmalıdır.
