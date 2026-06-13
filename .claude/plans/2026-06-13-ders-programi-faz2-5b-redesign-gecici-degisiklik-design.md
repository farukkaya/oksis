# Ders Programı Faz 2.5B Yeniden Tasarım — Geçici Değişiklik (Editör-Merkezli) Tasarım

> Tarih: 2026-06-13 · Durum: onaylandı (kullanıcı, 2026-06-13) · Tür: redesign
> Bağlayıcı spec: `.claude/specs/ders-programi-modulu-spec.md`
> Tasarım kaynağı (bağlayıcı handoff): `.claude/docs/modules/timetable/_handoff/README.md` **madde 171**
> (Yayın türü: *Kalıcı yayın* / *Geçici değişiklik* — yalnızca seçilen tarih; kalıcı programı bozmaz, tarih seçici açılır).
> İlişkili memory: [[project_ders_programi]] · [[feedback_specs_binding]] · [[feedback_default_workflow]]

---

## 1. Neden bu redesign?

2.5B-2'de geçici değişiklik **drawer içi kompoze form** olarak yapıldı (mini-ızgaradan ders seç →
tip seç → tarih). Kullanıcı kontrol etti: bu, **handoff madde 171'den sapma**. Doğru tasarım:
**editörde değişikliği yap → Yayınla → "Geçici değişiklik" işaretle → tarih → yalnız o tarih için yayınla.**
Görsel (kullanıcı, 2026-06-13) bunu doğruladı (§2 "V4'e göre değişenler" diff + §3 Yayın türü toggle + Tarih).

Bu doküman, 2.5B'yi handoff'a geri hizalayan **editör-merkezli** modeli tanımlar. 2.5B-2 composite form'u kaldırılır.

### Backend gerçeği (kapsamı belirleyen kısıt)
2.5A `ScheduleException` modeli **tek yerleşim + 3 tip**: `Cancellation`, `TeacherSubstitution`, `RoomChange`.
"Dersi değiştir" (İkame Ders / subject swap) **yok**. Kullanıcı kararı (2026-06-13): **İkame Ders kapsam dışı** →
yeni istisna tipi gerekmez. Geçici aksiyonlar yalnız mevcut `TeacherSubstitution` + `Cancellation`'a eşlenir.

---

## 2. Kavramsal model — iki dünya, ayrı tutulur

| | Kalıcı düzenleme | Geçici değişiklik |
|---|---|---|
| Programa etki | Değiştirir → yeni sürüm (v+1) | **Bozmaz**; tek tarih overlay |
| Backend | Program aggregate (komutlar) | `ScheduleException` (P25) |
| Yayın türü | "Kalıcı yayın" | "Geçici değişiklik" + tarih |
| Geçerlilik | Kalıcı | Yalnız seçilen tarih |

**Ayrı tutulur (kullanıcı kararı):** bir editör oturumu **tek türdür**. Tamponda kalıcı düzenleme varken
geçici aksiyon eklenemez (ve tersi) → uyarı: *"Önce mevcut değişiklikleri yayınlayın/geri alın."*
Her yayın tek tür taşır.

---

## 3. Editör hücre menüsü (CellMenu) — 5 aksiyon

| # | Aksiyon | Tür | Aktiflik koşulu | Backend |
|---|---|---|---|---|
| 1 | **Öğretmen Değiştir** | Kalıcı | her zaman; geçici tampon boşken | `AssignTeacher` (var) + **branş filtresi (yeni)** |
| 2 | **Derslik Değiştir** | Kalıcı | her zaman; geçici tampon boşken | `AssignRoom` (var) |
| 3 | **Vekil Öğretmen Ata** | **Geçici** | yalnız **Yayında** program; kalıcı tampon boşken | `TeacherSubstitution` istisna (var) + **müsait sorgusu (yeni)** |
| 4 | **Ders İptal** | **Geçici** | yalnız **Yayında** program; kalıcı tampon boşken | `Cancellation` istisna (var) |
| — | (ayraç) | | | |
| 5 | **Kaldır** | Kalıcı | her zaman; geçici tampon boşken | `Remove` (var) |

- Geçici aksiyonlar (3,4) **Taslak** programda disabled (istisna yalnız yayınlanmış snapshot üstüne kurulur;
  mevcut publish-type gate deseniyle tutarlı).
- "Ayrı tutulur" → diğer türden tampon doluyken bu türün aksiyonları disabled + tooltip.

### 3.1 Öğretmen Değiştir — branş filtresi
- Yalnız **o dersin branşını verebilen** öğretmenler listelenir (mevcut CellMenu tüm öğretmenleri listeliyordu).
- Kaynak: planlamada doğrulanacak — Teachers modülünde "branşa/derse göre öğretmen" uç/veri var mı; yoksa
  küçük sorgu. Geçici çözüm riski: `ITeachingAssignmentSource` şube-içi görevlendirme verir (dar küme) → yetersizse Teachers sorgusu.

### 3.2 Vekil Öğretmen Ata — müsait öğretmen alt-menüsü
- **O gün + o period'da müsait** (hiçbir aktif programda o slotta dolu olmayan) öğretmenler listelenir.
- **Müsait yoksa** → "Müsait öğretmen yok" (disabled, belirgin).
- Backend: yeni `GetAvailableTeachers(termId, day, period)` sorgusu (tüm aktif yerleşim doluluğundan hesaplar).
  `IOccupancyIndex.CheckAsync` tek öğretmen söyler; liste için DB-temelli yeni sorgu yazılır (kaynak doğruluk DB).

---

## 4. Geçici tampon + Yayınla drawer

### 4.1 Bekleyen-istisna tamponu
- Geçici aksiyonlar (Vekil/İptal) **programa yazılmaz**; ayrı bir lokal **bekleyen-istisna tamponunda** birikir.
  (Kalıcı tarafın 2.5B-1 op-log/buffered-save modeline paralel; ama ayrı liste.)
- Her bekleyen kayıt: `{ targetPlacementId, type: 'TeacherSubstitution'|'Cancellation', newTeacherId? }`.
  `targetPlacementId` = yayınlanmış snapshot'taki yerleşim (P25 hedefi). Yayında programda draft==published.

### 4.2 Yayınla drawer (görsel referansı)
- §1 **Etkilenecekler** (öğretmen/öğrenci/veli) — geçici için P24 preview affected (çoklu aksiyonda toplanır).
- §2 **"v'ye göre değişenler"** — bu sefer **geçici aksiyonların** diff'i (Vekalet: eski→yeni öğretmen; İptal: "Ders iptal").
- §3 **Yayın türü**:
  - Tamponda geçici aksiyon varsa → **"Kalıcı yayın" disabled** + üstte **warning bar**
    ("Bu değişiklikler yalnız geçici olarak yayınlanabilir") + **"Geçici değişiklik" seçili** + **Tarih** alanı açık.
  - Disabled "Kalıcı yayın"a tıklama girişimi → **notification/uyarı** (toast).
  - Tersi (yalnız kalıcı tampon) → "Kalıcı yayın" aktif, "Geçici değişiklik" disabled.
- §4 Sürüm/değişiklik notu (opsiyonel), §5 Bildirim kanalları (mevcut).
- **Onay → uygula:** seçilen **tek tarih** ile her bekleyen aksiyon için istisna oluştur (P25 döngüsü).
  Tarih `today..+30` (BR-TT-011), tatil değil (backend doğrular). Kısmi başarı/atomiklik notu: §6.

---

## 5. Backend dilimi (yeni — küçük)

1. **`GetAvailableTeachers`** sorgusu + endpoint: `GET /timetable/programs/{id}/available-teachers?day=&period=`
   → o slotta müsait öğretmen listesi (id+ad). İzin `timetable.manage`. Tüm aktif yerleşim doluluğundan.
2. **Branşa göre öğretmen** (Öğretmen Değiştir filtresi): mevcut Teachers ucu/verisi doğrulanacak; yoksa
   `GET .../subjects/{subjectId}/teachers` benzeri küçük sorgu (ya da CellMenu'ye subjectId ile filtre).
3. İstisna oluşturma (P25 `Cancellation`/`TeacherSubstitution`) **hazır** — değişmez.
4. (Opsiyonel sertleştirme, sonraya) İstisnaları **tek tarih için atomik batch** oluşturma ucu — §6 Debt.

---

## 6. Kapsam dışı / sonraya / Debt

- **İkame Ders (subject swap)** — kullanıcı kapsam dışı bıraktı (yeni backend tipi gerekirdi).
- **Geçici Derslik değişikliği** — backend `RoomChange` istisnası var ama menüde geçici derslik aksiyonu yok;
  istenirse sonra eklenir.
- **Mevcut değişiklikler listesi + Geri Al** (P26/P27) — eski 2.5B-3; bu redesign'dan **sonra** ayrı dilim.
  (Plan dosyası mevcut: `2026-06-13-ders-programi-faz2-5b3-degisiklik-listesi-geri-al.md` — ertelendi.)
- **Bildirim fan-out** — Faz 2.6 (Debt-BE-3).
- **Atomiklik (Debt):** çoklu geçici aksiyon P25 döngüsüyle oluşturulur (tek tarih); bir aksiyon 409 ile
  reddedilirse o ve sonrası uygulanmaz, kullanıcıya hangi satırların oluştuğu bildirilir. Atomik batch ucu sonraki iş.
- **Spec dışına çıkma kaydı (uygulamada):** 2.5B-2 "drawer kompoze form" sapması **geri çevriliyor**;
  completion_status'a redesign + handoff'a geri hizalama olarak işlenecek.

---

## 7. Doğrulanacaklar (planlama aşamasında)
- Branşa/derse göre öğretmen kaynağı (Teachers modülü uç var mı?).
- `GetAvailableTeachers` için aktif yerleşim doluluk sorgusunun en temiz yazımı (program-bağımsız, term-geneli).
- Editördeki mevcut `CellMenu` + `useEditorDraft` tampon modeline geçici-tamponun nasıl ekleneceği (ayrı liste).
- Publish drawer'ın mevcut `PublishDrawer` + (kaldırılacak) `TemporaryChangePanel` ile ilişkisi; toggle gating.

## 8. Akış
brainstorming (✅ onaylandı) → bu design doc → writing-plans (implementation plan) → TDD+incremental → review → commit.
</content>
