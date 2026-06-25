# Görevlendirme Hub'ı (Ders ↔ Öğretmen Yetkinlik Eşlemesi) — Tasarım Spec'i · v2

**Kapsam:** Akademik / Görevlendirmeler ekranının **yeniden tasarımı (v2)** + okuma/yazma tarafı + sezon kopyalama
**Hedef katmanlar:** `oksis-web` (bu işte gerçek) · `oksis-api` (Debt-BE — bu işte yalnız kontrat sabitlenir)
**Modüller:** `teachers` (TeachingAssignment) · `subjects/academics` (ders havuzu) · `timetable` (downstream — değişmez)
**Durum:** v2 tasarım kararları — **kullanıcı onaylı 2026-06-24** (v1 sınıf×saat modelini geçersiz kılar)
**Yaklaşım:** **Frontend-first / backend Debt** (kullanıcı kararı 2026-06-24) — FE handoff'a birebir kurulur; backend uçları v2 kontratına göre stub ile beslenir, eksikler Debt işaretlenir.
**Kaynaklar:** Handoff `handoff_gorevlendirmeler_v2/` (README + `assignments.jsx` v2 + screenshots) · admin-ekranlari-mimari-spec §5.7 · ders-programi-modulu-spec §10/K0.6
**Tarih:** 2026-06-24

> Bu dosya `.claude/specs/` altındadır → **bağlayıcı anlaşma** (CLAUDE.md Absolute Rule #6).
> Numaralı maddeler pazarlık dışıdır. Aykırılıkta dur, madde no ile bildir.

---

## 0. v1 → v2: kavramsal değişim (bu sürüm v1'in yerini alır)

Bu spec'in **v1 sürümü** (sınıf-merkezli, haftalık saat, müfredat hedefi/doluluk) **geçersizdir**.
v2, ekranın ürettiği şeyi değiştirir:

| | Eski (v1 · geçersiz) | **Yeni (v2 · bu spec)** |
|---|---|---|
| Ekranın ürettiği | Sınıf → ders → öğretmen → **haftalık saat** | **Yetkin öğretmen ↔ ders** eşlemesi |
| Şube / saat | Ekranda girilir | **Ekranda YOK** — downstream (şube dağıtımı / Ders Programı) |
| Birincil eksen | Sınıf listesi (kademe-gruplu) | **Ders** ↔ **Öğretmen** (segmented, iki eksen) |
| Birincil metrik | Doluluk (`fillStatus`, `targetHours`) | **Kapsama boşluğu** (0 öğretmenli ders) |
| Uyum | `branchMatch` **boolean** | **Üçlü**: branş-içi / yan branş / **alan-dışı** |
| Yaşam döngüsü | soft-delete (`RevokedAt`) | **soft-close** (`status/closedAt/closedReason`) + **denetim izi** (`by/at/gerekçe`) |

**Üç tasarım kararı (handoff KARAR 1–3 ile birebir):**
- **KARAR 1 — Ders bazında görevlendirme.** Ekran yalnız *yetkin öğretmen ↔ ders* eşlemesi üretir. **Haftalık saat ve şube YOKTUR.** Seviye, dersin havuzundan otomatik türetilir.
- **KARAR 2 — Yalnız okul-admini.** Tek yazma rolü; onay iş akışı yerine **öz-denetim + denetim izi** (kim / ne zaman / neden).
- **KARAR 3 — Görev özeti bilgilendiricidir.** Öğretmen başına kaç farklı ders / hangi seviyeler / uyum dağılımı; **haftalık ders saati bu ekranda ASLA gösterilmez.**

**İki ilke:** (1) **Kapsama görünürlüğü** — "her açılan dersin en az bir yetkin öğretmeni var mı?" bir bakışta okunur. (2) **Yetkinlik dürüstlüğü** — branş-içi / yan-branş / alan-dışı renkle okunur; alan-dışı **engellenmez** ama gerekçe + otomatik iz ister.

---

## 1. v1'den taşınan/geçersiz kılınan kararlar (Rule #6 kaydı)

- **D-1 (geçersiz):** v1'in **Müfredat Saati çekirdeği** (`CurriculumHourTemplate`, `SchoolWeeklyHourOverride`, `IRequiredHoursResolver`, `targetHours`, `curriculum-hours.view`) bu ekranın **kapsamı dışıdır** — KARAR 1/3 saat ekseni kaldırdığı için Görevlendirme ekranı bunları kullanmaz. (Müfredat Saati modülü kendi başına ayrı iştir; bu spec ona dokunmaz, yalnız Görevlendirme'den bağını koparır.)
- **D-2 (geçersiz):** v1'in `fillStatus` / `missingClasses` / `ListAssignmentClassesQuery` (sınıf listesi) / `ListClassAssignmentsQuery(classRoomId)` metrik ve query'leri Görevlendirme v2'de kullanılmaz; yerlerine §2 kapsama/eksen query'leri gelir.
- **D-3 (korunur):** Sahiplik sınırı değişmez (v1 K0.1). Görevlendirme = arz ("kim hangi dersi vermeye yetkili"), Ders Programı = çizelge ("hangi gün/saat, hangi şube, kaç saat"). Saat/şube **Program'ın** işidir. v2 bu sınırı **güçlendirir** (saat'i tümüyle Program'a bırakır).
- **D-4 (korunur):** `branchMatch` persist edilmez; query-time hesaplanır (v1 S-3). v2'de **üçlü** (`ok/yan/no`) olur ve öğretmenin **yan branşlarını** da okur.

---

## 2. Veri modeli (v2)

```
Branş:         { id, ad, mebKodu, durum }                              // ders havuzundan
Öğretmen:      { id, ad, brans, yanBranslar:[bransId], initials, n }   // n = avatar renk tohumu
Ders:          { id, ad, kod, brans, seviye:[int], tur:'Zorunlu'|'Seçmeli', durum:'Aktif'|'Pasif' }
Görevlendirme: { id, courseId, teacherId, by, at, gerekce,
                 status:'aktif'|'kapali', closedAt, closedReason }
Sezon:         { id, label, sub, status:'active'|'archived' }
```

**Görevlendirme kaydının kritik alanları (KARAR 1–2):**
- `courseId`, `teacherId` — eşlemenin iki ucu. **`weeklyHours`/`classRoomId` YOKTUR.**
- `by`, `at` — **denetim izi**: atayan admin + tarih (otomatik damgalanır).
- `gerekce` — yalnız **alan-dışı** (`uyum==='no'`) kayıtlarda anlamlı; serbest metin.
- `status` — `'aktif'`/`'kapali'`. **Kayıt asla silinmez**; yıl-içi devirde `closedAt`+`closedReason` ile tarihlenerek kapatılır (iz korunur).

**Türetilen mantık (FE, persist yok):**
- `uyum(courseBrans, teacher)` → `'ok'` (öğretmen ana branşı = ders branşı) · `'yan'` (ders branşı öğretmenin `yanBranslar`'ında) · `'no'` (alan-dışı). teacher yoksa `'no'`.
- `byCourse` / `byTeacher` — aktif kayıtların ders/öğretmen kırılımı.
- `gaps` (kapsama boşluğu) — aktif görevlendirmesi 0 olan **Aktif** dersler.
- `disiCount` — `uyum==='no'` aktif atama sayısı.
- öğretmen **özeti** — verdiği derslerin seviyelerinin birleşimi + uyum dağılımı (ana/yan/dış).

---

## 3. Backend (oksis-api) — **GELİŞTİRİLDİ (2026-06-25)**

> **Güncelleme 2026-06-25:** Backend `Gorevlendirmeler-v2-Teknik-Analiz.docx` esas alınarak **geliştirildi**
> (Debt-BE kalktı). Aşağıdaki §3.1/3.2 tarihsel bağlam; gerçek uçlar ve tasarım bu kutuda. Detay + sapmalar:
> `teachers/completion_status.md` (2026-06-25).
>
> **Aggregate:** `SubjectTeacherAssignment : TenantEntity` (sezon-scope: SessionId/SubjectId/TeacherId/Status/
> Justification/Closed*; **saat/şube YOK**; soft-close + audit; kimlik ham Guid — typed-ID atlandı). Mevcut
> `TeachingAssignment` DOKUNULMADI (downstream). `TeacherProfile.SecondaryBranches` eklendi (AS-3, üçlü uyum).
> **Tablo:** `academic.subject_teacher_assignments` + `teacher_secondary_branches` JSON; migration `20260625_…`.
> **İzinler (yeni):** `assignments.{view,assign,copy-season}` (SchoolAdmin tam, Teacher view, copy-season SCHOOL_ADMIN-only).
> **Ders havuzu + seviye:** `Subject.IsActive` ∩ **okul kademesi** (`SchoolGradeLevel`) — Lise okulu ortaokul derslerini/
> seviyelerini görmez (AS-2 2026-06-25'te kademe-scope ile çözüldü; kademe tanımsızsa geri-uyum = tüm dersler).
> **Türetim server-side** (üçlü uyum tr-TR bellekte).
>
> **Controller `api/v1/assignments`:**
> | Uç | İzin |
> |---|---|
> | GET `/summary` · `/courses` · `/teachers` · `/by-course/{subjectId}` · `/by-teacher/{teacherId}` · `/candidates?mode=&anchorId=` | `assignments.view` |
> | POST `/` (çoklu atama) · POST `/{id}/close` · PATCH `/{id}/justification` | `assignments.assign` |
> | POST `/copy-season` | `assignments.copy-season` |
>
> **Test:** 12 domain + 9 integration (gerçek SQL Server) yeşil. **Kalan:** FE'yi bu uçlara bağla (stub→HTTP).

> **(Tarihsel) Kullanıcı kararı 2026-06-24:** v2 modelini besleyecek backend bu işte geliştirilmez. FE, aşağıdaki adaptör kontratına göre kurulur ve **stub/mock** ile beslenir. → **2026-06-25'te geliştirildi (yukarı kutu).**

### 3.1 Mevcut backend gerçeği (v1)
- `TeachingAssignment` entity = teacher × **classroom** × subject + **weeklyHours**, soft-delete `RevokedAt`. → v2 modeli (classroom/saat'siz, audit/soft-close'lu) ile **birebir örtüşmez**.
- Controller `api/v1/teaching-assignments`: `summary` / `classes` / `by-class/{id}` / `copy-season` — hepsi **sınıf-merkezli**.
- Yazma: `api/v1/teachers/{teacherId}/assignments` (assign/unassign), `weeklyHours` ve `classRoomId` zorunlu.

### 3.2 v2 adaptör kontratı (FE'nin bağlanacağı hedef sözleşme — backend bunu karşılamalı)
FE tek adaptörde (`assignmentsApi`) izole; backend gelene kadar **stub** döner. Kontrat:

| İşlev | İmza (öneri) | Döner |
|---|---|---|
| Ders havuzu | `GET /teaching-assignments/courses?sessionId=` | `[{ id, ad, kod, brans, seviye[], tur, durum }]` (yalnız Aktif) |
| Öğretmen havuzu | `GET /teaching-assignments/teachers?sessionId=` | `[{ id, ad, brans, yanBranslar[], initials }]` |
| Görevlendirmeler | `GET /teaching-assignments/competency?sessionId=` | `[{ id, courseId, teacherId, by, at, gerekce, status, closedAt, closedReason }]` |
| Özet | `GET /teaching-assignments/summary?sessionId=` | `{ totalActive, unassignedCourses, outOfFieldAssignments }` |
| Ekle (çoklu) | `POST /teaching-assignments/competency` | body `{ items:[{ courseId, teacherId, gerekce? }] }` |
| Kapat (devret) | `POST /teaching-assignments/competency/{id}/close` | body `{ closedReason }` |
| Gerekçe güncelle | `PATCH /teaching-assignments/competency/{id}` | body `{ gerekce }` |
| Sezon kopyala | `POST /teaching-assignments/copy-season` | `{ copiedCount, skipped[] }` |

### 3.3 Backend Debt kalemleri (ayrı iş)

> **BE faz kaynağı:** v2 backend'i için teknik analiz dökümanı kullanıcı tarafından sağlandı —
> `Gorevlendirmeler-v2-Teknik-Analiz.docx` (2026-06-24, başlangıçta `~/Downloads/`). BE fazına
> geçilince (FE swap+commit sonrası) bu analiz esas alınır. Pointer: hafıza `reference_gorevlendirme_v2_be_analiz`.

- **Debt-BE-1:** v2 yaşam döngüsü (audit `by/at/gerekce` + soft-close `status/closedAt/closedReason`) — entity/tablo kararı (mevcut `TeachingAssignment`'ı genişlet **mi** yoksa yeni `TeachingCompetency` aggregate **mi**) ertelendi. **Açık soru AS-2.**
- **Debt-BE-2:** classroom/saat'siz görevlendirme — mevcut entity bunları zorunlu tutuyor; v2 kontratı saat'siz. Şube dağıtımı Program'a devredildiğinden bu alanlar v2'de opsiyonel/anlamsız olmalı.
- **Debt-BE-3:** üçlü uyum + öğretmenin **yan branşları** — backend'de `TeacherProfile` yan branş alanı modellenmemiş olabilir; FE `yanBranslar`'ı kontrata göre okur, backend gelene kadar stub.
- **Debt-BE-4:** "Önceki Sezondan Kopyala" v2 anlamı (ayrılan öğretmen → boş bırak → kapsama boşluğu) — mevcut `copy-season` v1 semantiğiyle hizalanmalı.
- Yetki: `teaching-assignments.view` + `.assign` mevcut, yeniden kullanılır; `.copy-season` mevcut. **Yeni v2-özel izin eklenmez** (KARAR 2: tek yazma rolü = school-admin).

---

## 4. Frontend (oksis-web) — bu işin gerçek teslimi

İzole yeni klasör (mevcut ekranı bozmadan): handoff `assignments-new/` içinde kurulur, bittiğinde mevcut `assignments/`'ın yerine swap edilir (Handoff: Rebuild > Patch deseni). Yapı `academic-sessions/` desenini birebir mirror eder: `api/ hooks/ keys/ types/ schemas/ components/ pages/`.

### 4.1 Ekran (handoff §6 birebir)
1. **Üst bağlam çubuğu** — breadcrumb (Akademik › Görevlendirmeler) + `<h1>` + özet sayaçlar (**Görevlendirme** / **Atanmamış Ders** [amber nokta] / **Alan-dışı Atama** [kırmızı nokta]) + **Önceki Sezondan Kopyala** (ghost) + **Yeni Görevlendirme** (primary). Sezon seçici üst çubukta (paylaşımlı SeasonTermSwitcher).
2. **Eksen çubuğu** — segmented: **Derslere göre** (`book-open`) ↔ **Öğretmenlere göre** (`users`) + eksene göre ipucu satırı.
3. **Kapsama boşluğu uyarı şeridi** — atanmamış ders varsa amber şerit + ders adları + "Boşlukları gör" + kapat.
4. **Sol panel (master)** — *ders modu:* arama + kapsam çipleri (Tümü/Zorunlu/Seçmeli/Boşluk) + Zorunlu/Seçmeli gruplu ders listesi + **kapsama kapsülü** (ok/has-disi/gap/muted). *öğretmen modu:* arama + çipler (Tümü/Alan-dışı/Görevsiz) + öğretmen listesi (avatar + branş + görev sayısı pill).
5. **Sağ panel (detail)** — *ders modu:* başlık (ad + branş + tür + türetilen seviye) + "Öğretmen Ata" + atanan öğretmen kartları (avatar + branş etiketleri + üçlü uyum rozeti + satır menüsü + alan-dışı gerekçe/iz bloğu) **veya** boş-durum kartı. *öğretmen modu:* başlık (avatar + ad + branş etiketleri) + "Ders Ata" + **görev özeti şeridi** (farklı ders / türetilen seviyeler / uyum dağılımı + "saat gösterilmez" notu) + verdiği ders kartları. Her iki modda **Kapatılmış görevler** bölümü (iz korunur).
6. **Seçim drawer'ı** (`GrvAssignDrawer`) — iki modlu (course/teacher), uyuma göre **gruplu** aday listesi (Önerilen/Yan branş/Alan-dışı), çoklu seçim, alan-dışı gerekçe bloğu + otomatik iz, footer "{n} seçildi · İptal · Görevlendir".
7. **"Önceki Sezondan Kopyala"** — paylaşımlı ConfirmModal (handoff §8 metinleri birebir).

### 4.2 Standartlar (workspace frontend kuralları)
- **Server state yalnız React Query**; tenant-prefixed key factory (schoolId + sessionId):
  - `['teaching-assignments','courses',schoolId,sessionId]`
  - `['teaching-assignments','teachers',schoolId,sessionId]`
  - `['teaching-assignments','competency',schoolId,sessionId]`
  - `['teaching-assignments','summary',schoolId,sessionId]`
- **Türetilenler** (gaps/byCourse/byTeacher/uyum/özet) FE'de `useMemo` ile; persist yok (D-4).
- **Drawer & gerekçe formu** RHF + Zod (handoff'taki manuel `useState` yerine). Şema: ekle `{ items: [{ courseId, teacherId }], gerekce?: string }`; kapat `{ closedReason: string min 1 }`.
- **Tasarım dili:** handoff `brand.css` token'ları (Tailwind theme'de mevcut olanlar kullanılır, eksikler eklenir); shadcn primitive'leri (Button, Input, Checkbox, DropdownMenu, Sheet/Drawer, Badge, Skeleton) net eşleşen yerlerde; ekrana özel parçalar (kapsama kapsülü, uyum rozetleri, görev özeti, gerekçe/iz bloğu, seçim drawer'ı) handoff CSS'inden birebir port edilir.
- **İkonlar:** lucide-react (handoff ikon adları birebir Lucide).
- **Avatar:** deterministik renk + baş harf helper (mevcut varsa yeniden kullan, yoksa `stuAvClass` köprüsünü port et).
- İzin gate'leri: `RequirePermission` / `usePermission` (`teaching-assignments.assign` yoksa yazma butonları render edilmez). KARAR 2: yalnız school-admin.
- Durum varyantları (hepsi Türkçe): boş (pozitif çerçeve), yükleniyor (**skeleton** — spinner yasak), hata (ProblemDetails + tekrar dene), dolu.
- Named export; inline style yasak (handoff'taki `style={{background:b.fg}}` gibi **dinamik renk** dot'ları için `cn` + CSS var veya data-attr ile çözülür); `any` yasak.
- Seçili ders/öğretmen + eksen + sezon → URL search params (derin link) + hafif Zustand (gerekiyorsa).
- **Backend stub sınırı:** `assignmentsApi` adaptörü §3.2 kontratını döndüren bir stub modülüne bağlanır (gerçek backend gelince yalnız adaptör değişir). Stub seed = handoff `GRV_INIT` + `academicsBase` verisi. Stub olduğu her dosyada açık `// Debt-BE: stub` notu.

### 4.3 Tweaks (handoff §11 → production varsayılanları)
Açılış ekseni = **Derslere göre** · görev özeti = **açık** · kapsama boşluğu = **göster** · drawer gruplama = **açık** · yoğunluk = **sıkı**. (Tweak'ler config'e bağlanmaz; tek varsayılana sabitlenir, gerekirse sonra ayar.)

### 4.4 Mobil
Kapsam dışı (ayrı iş).

---

## 5. Test (TDD — FE odaklı)

- **Türetim saflığı (unit):** `uyum` üçlü (ok/yan/no, yan branş okuma, teacher yok → no); `gaps` (0 atamalı Aktif ders); `disiCount`; `byCourse/byTeacher`; öğretmen `özet` (seviye birleşimi + uyum dağılımı).
- **Render + durum varyantları (vitest):** iki eksen geçişi; kapsama boşluğu şeridi (var/yok/kapat); kapsama kapsülü dört varyantı; üçlü uyum rozeti; görev özeti şeridi + "saat gösterilmez" notu; boş-durum kartları; kapatılmış görev bölümü; izin gate.
- **Drawer (vitest):** gruplu aday listesi (uyuma göre sıralı/gruplu), zaten-atanmış eleme, alan-dışı gerekçe bloğunun koşullu belirişi, çoklu seçim + Görevlendir disabled mantığı, RHF+Zod validasyonu.
- **Adaptör/stub:** kontrat şekli (§3.2) + key factory tenant-scope; optimistic-update şekli korunur.

---

## 6. Kabul kriterleri

- [ ] İki eksenli master-detail (ders ↔ öğretmen) tek veriden beslenir; segmented + çapraz geçiş (kart menüleri) çalışır.
- [ ] Kapsama boşluğu: üst sayaç + uyarı şeridi + sol panel "Atanmamış" rozeti + "Boşlukları gör" hepsi aynı türetimden.
- [ ] Üçlü uyum (branş-içi/yan/alan-dışı) her satırda renkle; alan-dışı **engellenmez** ama gerekçe + otomatik iz (`by/at`) ister.
- [ ] Görev özeti bilgilendiricidir; **haftalık saat hiçbir yerde gösterilmez** (KARAR 3).
- [ ] Soft-close: kayıt silinmez; kapatma tarihlenir; "Kapatılmış görevler" izde kalır.
- [ ] Seçim drawer'ı iki modlu, gruplu aday, çoklu seçim, alan-dışı gerekçe + iz; RHF+Zod.
- [ ] "Önceki Sezondan Kopyala" ConfirmModal (handoff metinleri).
- [ ] Tüm server state React Query, tenant-prefixed key; türetimler `useMemo`; named export; inline style/any yok.
- [ ] `assignmentsApi` stub §3.2 kontratını döndürür; gerçek backend gelince yalnız adaptör değişir.
- [ ] İzole `assignments-new/`'da kurulur, mevcut ekranla swap edilir; eski v1 dosyaları kaldırılır.
- [ ] `teachers/completion_status.md`: v2 ilerleme + Debt-BE-1..4 + ⚠️ Spec Dışına Çıkılanlar (v1 sınıf×saat modeli geçersiz, Müfredat Saati çekirdeği Görevlendirme'den koparıldı) güncel.

---

## 7. Açık sorular / riskler

- **AS-1:** v2 "saat'siz görevlendirme" mevcut `TeachingAssignment`'ı (classroom/weeklyHours zorunlu) doğrudan kullanamaz → backend yeni aggregate mi, genişletme mi? (Debt-BE-1, kullanıcı/backend kararı.)
- **AS-2:** Mevcut `teaching_assignments` tablosundaki v1 verisi (sınıf×saat) v2'ye nasıl köprülenir? (Migration/okuma stratejisi — Debt-BE.)
- **AS-3:** Üçlü uyum öğretmenin **yan branş** verisine dayanır; backend'de yoksa ya modellenmeli ya FE seed'den gelmeli. (Debt-BE-3.)
- **AS-4:** "Önceki Sezondan Kopyala" v2 semantiği (saat'siz, ayrılan → boşluk) mevcut command ile hizalanmalı. (Debt-BE-4.)
- **AS-5:** Branş eşleşmesi serbest-metin isim karşılaştırmasına dayanırsa varyasyon riski (v1 AS-3 ile aynı) — normalizasyon kuralı korunur.

---

## 8. Ertelenenler (bu spec kapsamı DIŞI)

- v2 backend'in tamamı (entity/tablo/migration/command/query/event) — Debt-BE, ayrı iş.
- Müfredat Saati modülü (v1'de çekirdeği vardı; v2'de Görevlendirme'den koparıldı, kendi modülünde devam eder).
- Mobil görünüm.
- Şube/saat dağıtımı (Ders Programı modülünün işi — D-3).

---

*Oksis — Görevlendirme Hub Tasarım Spec · v2 · 2026-06-24 · v1 sınıf×saat modelini geçersiz kılar (kullanıcı onaylı).*
