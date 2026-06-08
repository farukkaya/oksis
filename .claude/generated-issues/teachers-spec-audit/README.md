# Öğretmenler Ekranı — Spec Uyum Denetimi (teachers-spec-audit)

**Kaynak spec:** `.claude/specs/oksis-admin-ekranlari-mimari-spec.md` → **§5 Öğretmenler Ekranı** (+ §1.2 sezon modeli, §6.3 çift-eksen yaşam döngüsü).
**Denetlenen kod:** `oksis-web` + `oksis-api`.

> Users/Students denetiminden **farklı sonuç:** burada düzeltilecek bir ekran yok — **ekran ve domain büyük ölçüde hiç yapılmamış.** Bu yüzden issue'lar "sapma düzeltme" değil, **spec §5'ten türetilmiş greenfield build** issue'larıdır.

---

## Çıkarım — mevcut durum

**Admin "Öğretmenler" ekranı YOK.**
- `oksis-web/src/portals/admin/` altında klasörler: `academic-sessions`, `pages`, `settings`, `students`, `users` — **`teachers` yok.**
- `/admin/teachers` route'u, `TeachersPage`, `teachers.json` i18n **yok**.
- `src/app/pages/teacher/*` = **öğretmen portalı** (öğretmenin kendi görünümü: ClassList/GradeTable/Attendance…), admin yönetim ekranı değil; üstelik eski scaffold mimaride (mock dizi, `Card` legacy bileşenleri).
- `oksis-api` `Modules/Teachers/` = **boş** (`.gitkeep`); `Domain/Modules/Teachers` entity yok.

**Mevcut temel (kısmi, dağınık):**
- `Modules/Users/Entities/TeacherProfile.cs` — öğretmen bir **Person profili** olarak modellenmiş: `Branch`, `EmployeeNumber` (sicil), `HireDate`, `TerminatedAt`.
- `Modules/AcademicSessions` `ClassRoom.HomeroomTeacherId` + `AssignHomeroom()` + `ClassRoomHomeroomChangedEvent` — **sınıf öğretmenliği** temeli var.
- `Modules/Duties` — **nöbet** modülü mevcut (§5.6 "Nöbet: salt-okunur, Nöbet Yönetimi'nden").

**Kritik eksik:**
- **`TeachingAssignment` yok** (Teacher×Sınıf×Ders×**haftalık saat** — §5.7'nin kalbi). Görevlendirme kavramı kodda yok.
- **Haftalık yük/kapasite** (§5.2, §5.4 "bu ekranın imzası") için **kaynak yok** (görevlendirme olmadığı için).
- **Ders Programı / Timetable modülü yok** (modül listesinde yok) → §5.6 "Ders Programı: salt-okunur" sekmesinin kaynağı yok; §5.7 sınırı ("kim hangi dersi" burada, "hangi gün/saat" orada) için karşı taraf eksik.

---

## Mimari sapma (Users/Students ile tutarlı)

Spec **§5.1 / §1.2**: *"Öğretmen ≠ Görevlendirme: `Teacher` (kalıcı istihdam) ile `TeachingAssignment` (sezona bağlı görev) ayrıdır."*
Kod öğretmeni ayrı bir **`Teacher` istihdam aggregate'i** olarak değil, `TeacherProfile` (Person modeli) olarak tutuyor — Users/Students'taki aynı **Hesap/Profil vs ayrı-aggregate** kök ayrımı. Sezona bağlı `TeachingAssignment` ise hiç yok.
**Bu eşleme (spec `Teacher`/`TeachingAssignment` ↔ kod `TeacherProfile` + yeni assignment) uygulamadan önce kullanıcı ile teyit edilmeli;** sapma olursa `completion_status.md` "⚠️ Spec Dışına Çıkılanlar"a işlenmeli.

---

## Spec maddesi → Issue eşlemesi (greenfield)

| # | Kapsam | Spec maddesi | Durum | Issue |
|---|---|---|---|---|
| 1 | Liste ekranı iskeleti: route, liste (TeacherProfile), arama, filtreler, tablo kolon iskeleti | **§5, §5.3, §5.4** | YOK | ISSUE-01 |
| 2 | KPI şeridi (kadro/kapasite ekseni) | **§5.2** | YOK | ISSUE-02 |
| 3 | **`TeachingAssignment` domain + görevlendirme yönetimi** (ekranın kalbi) | **§5.1, §5.7, §1.2** | YOK | ISSUE-03 |
| 4 | Haftalık yük / kapasite hesabı + doluluk göstergesi | **§5.2, §5.4, §5.7** | YOK | ISSUE-04 |
| 5 | Sınıf öğretmenliği (homeroom) atama/kaldırma | **§5.7, §5.8, §6.3** | KISMİ (homeroom backend var) | ISSUE-05 |
| 6 | Detay drawer sekmeleri | **§5.6** | YOK | ISSUE-06 |
| 7 | Satır + toplu aksiyonlar (atama/yetkilendirme) | **§5.5** | YOK | ISSUE-07 |
| 8 | Edge-case/koruma + çift-eksen yaşam döngüsü | **§5.8, §6.3** | YOK | ISSUE-08 |

---

## Notlar

- **ISSUE-03 başlangıç bağımlılığı.** Görevlendirme (`TeachingAssignment`) olmadan §5.2/§5.4 yük, §5.6 Görevlendirmeler sekmesi, §5.5 "ders/sınıf görevlendir", §5.8 aşırı-yük/bağımlılık kuralları **kaynaksız** kalır. Sıra önerisi: ISSUE-01/02 (iskelet) → ISSUE-03 (domain) → ISSUE-04/06/07/08.
- **Ders Programı/Timetable modülü ayrı bir iş.** §5.6 "Ders Programı (salt-okunur)" ve §5.7 sınırı için Timetable modülü gerekli ama o **bu ekranın kapsamı dışı** — issue'larda "kaynak gelene kadar `—`" (öğrenci ekranındaki Devamsızlık gibi dürüst tasarım) uygulanır.
- **MVP teyidi:** Tüm Öğretmenler ekranını sıfırdan kurmak büyük; MVP kapsamında öncelik/parça seçimi için `mvp-guard` ile teyit önerilir.

## Etiketler (öneri)

```bash
gh label create "audit:spec" --color "be123c"
gh label create "spec:admin-ekranlari" --color "7c3aed"
gh label create "module:teachers" --color "15803d" --description "Öğretmenler modülü"
gh label create "type:greenfield" --color "0891b2" --description "Sıfırdan inşa"
```
