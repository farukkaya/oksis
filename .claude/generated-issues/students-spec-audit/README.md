# Öğrenciler Ekranı — Spec Uyum Denetimi (students-spec-audit)

**Kaynak spec:** `.claude/specs/oksis-admin-ekranlari-mimari-spec.md` → **§4 Öğrenciler Ekranı** (+ türetildiği §1.2 Sezon modeli, §6.2 yaşam döngüsü).
**Denetlenen kod:** `oksis-web/src/portals/admin/students/**`
(`StudentsPage.tsx`, `StudentDetailDrawer.tsx`, `StudentsTable.tsx`, `StudentsToolbar.tsx`, `StudentsSelectionBar.tsx`, `StudentsKpiStrip.tsx`, `api/studentsApi.ts`, `types`).
**Backend teyidi:** `oksis-api` — `Modules/Students` neredeyse boş; sezon/kayıt modeli `Modules/AcademicSessions` altında (`AcademicSession`, `ClassRoomStudent`, `StudentAssignedToClassRoom/Transferred/Graduated` event'leri). Öğrenci verisi generic `Modules/Users` (PersonsController) üzerinden geliyor.

> Bu klasör `users-spec-audit/` ile aynı yöntemde, **Öğrenciler** ekranına özgüdür.

---

## Çıkarım — kök sapmalar

**1. Sezon modeli (§1.2 / §4.1) ekranda uygulanmamış.** Spec: *"Tablolar kişileri değil, aktif sezonun
`Enrollment` kayıtlarını listeler."* Mevcut ekran `GET /users/persons?profileType=Student` ile **Person**
listeliyor; sezon yalnızca kozmetik bir sabit (`StudentsPage.tsx:29 → SEASON = "2025–2026"`). Sezon seçici yok,
sorguda `seasonId` yok, "Kayıt Geçmişi" sekmesi yok. Backend'de karşılığı (`AcademicSessions.ClassRoomStudent`)
**var ama ekran bağlanmıyor.** Bu, §4.1 + §1.2 + §4.6 (Kayıt Geçmişi) + §6.2 (yıl sonu terfi self-transition) ile çakışıyor.

**2. Veli yönetimi (§4.7) salt-okunur.** Spec: *"Veli burada yaşar… veli CRUD'u Öğrenci detayının içindedir."*
Mevcut detay yalnızca **birincil veliyi read-only** gösteriyor (`StudentDetailDrawer` mini-card); veli ekle/çıkar/birincil
ata, kardeş arama akışı (§4.7) **yok**. Ekran, veli modülünün "evi" olması gerekirken sadece görüntülüyor.

Geri kalan açıklar (aksiyonlar, detay sekmeleri, filtreler, edge-case'ler) bu iki kök sapmadan türüyor.

**Olumlu:** §4.2 KPI'lar **uyumlu** (Toplam · Aktif · Bu Ay Yeni Kayıt · Devamsızlık Riski); Devamsızlık Riski'nin
"—" gösterilmesi spec §4.2'nin onayladığı dürüst tasarım. Tablo kolon iskeleti (§4.4) ve salt-okunur dış-modül
sütunları (Devamsızlık/Ortalama "—") de spec'e uygun. Bunlara issue yok.

---

## Sapma → Spec maddesi → Issue eşlemesi

| # | Bulgu (mevcut durum) | Çakışan spec maddesi | Tip | Issue |
|---|---|---|---|---|
| 1 | Tablo Person listeliyor, sezon kozmetik sabit (`:29`), sezon seçici + Kayıt Geçmişi yok | **§4.1 + §1.2** (Enrollment ekseni) · **§4.6** (Kayıt Geçmişi) · **§6.2** | AYKIRI | ISSUE-01 |
| 2 | Veli salt-okunur (yalnız birincil); ekle/çıkar/birincil ata + kardeş arama yok; çoklu veli "+1" kolonu yok | **§4.7 + §4.1** · **§4.4** (çoklu veli) | EKSİK | ISSUE-02 |
| 3 | Satır "…" butonu boş (handler yok); toplu aksiyonlar `noop`; domain operasyonları yok | **§4.5** (Sınıf ata·Veli bağla·Belge·Nakil·Mezun·Dondur·Pasife al + toplu terfi) | EKSİK | ISSUE-03 |
| 4 | Drawer sekmeleri: general/absence/marks/**payments**. Eksik: Veliler·Kayıt Geçmişi·Belgeler·Hesap. Fazladan: Ödemeler | **§4.6** (sekme seti) + spec dışı sekme | EKSİK+AYKIRI | ISSUE-04 |
| 5 | Filtreler yalnız Sınıf·Durum·Cinsiyet; Seviye/Kademe + Veli durumu (tanımlı/eksik) yok; arama veli adını kapsamıyor olabilir | **§4.3** (filtre + arama ekseni) | EKSİK | ISSUE-05 |
| 6 | "Veli eksik" uyarısı yok; mezun/nakil düşürme + öğrenci no değişmezliği + sınıf değişimi sezon kuralı UI'da yok | **§4.8** (edge-case/koruma) | EKSİK | ISSUE-06 |

---

## Notlar

- **Backend kısmen hazır, farklı modülde.** §4.9 slice'larının (`EnrollStudent`, `AssignClass`, `LinkGuardian`,
  `GetEnrollmentHistory`…) çoğu `Modules/Students` altında **yok**; karşılıkları `AcademicSessions`
  (`ClassRoomStudent`, `StudentAssigned/Transferred/Graduated`) + `Users` (Person/relationship) modüllerinde dağınık.
  Issue'lar bu mevcut yetenekleri **bağla/teyit et**, eksikse (`GetEnrollmentHistory`, `LinkGuardian`) **üret** der.
- **Mimari karar gerektiren nokta (ISSUE-01):** Öğrenci ekranını sezon eksenine taşımak, `Students` ile
  `AcademicSessions` arasındaki sahiplik sınırını netleştirmeyi gerektirir. Spec §1.2 öğrenci tarafında `Enrollment`
  diyor; kodda bu `AcademicSessions.ClassRoomStudent`. Uygulamadan önce bu eşleme kullanıcı ile teyit edilmeli;
  spec'ten sapma olursa `completion_status.md` "⚠️ Spec Dışına Çıkılanlar"a işlenmeli.
- **MVP-scope sorusu (ISSUE-04):** Drawer'daki "Ödemeler" sekmesi spec §4.6 sekme setinde yok. Kaldırmak/ertelemek
  mü, spec'e eklemek mi — `mvp-guard` ile teyit edilmeli.

## Etiketler (öneri)

```bash
gh label create "audit:spec" --color "be123c" --description "Spec uyum denetiminden üretildi"
gh label create "spec:admin-ekranlari" --color "7c3aed"
gh label create "module:students" --color "0e7490" --description "Öğrenciler modülü"
```
