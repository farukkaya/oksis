## Description
**(Greenfield — ekranın kalbi, kök eksik.)** `TeachingAssignment` domain'ini ve görevlendirme yönetimini kur.

**Spec:**
- **§5.1** — *"Öğretmen ≠ Görevlendirme: `Teacher` (kalıcı istihdam) ile `TeachingAssignment` (sezona bağlı görev) ayrıdır."*
- **§5.7** — *"İlişki `Teacher × Class × Subject` üçlüsü üzerinden; bu ilişki **haftalık saat** taşır. Toplam yük = tüm görevlendirme saatlerinin toplamı."* Sınır: *kim hangi dersi verecek* burada; *hangi gün/saat* Ders Programı'nda.
- **§1.2** — sezona bağlı varlık; sezon değişince eksen değişir, kişi/istihdam silinmez.

**Mevcut durum:** Kodda **`TeachingAssignment` yok.** Öğretmen `TeacherProfile` (Person). Görevlendirme kavramı hiç yok → §5.2/§5.4 yük, §5.6 Görevlendirmeler sekmesi, §5.5 görevlendirme aksiyonu hep kaynaksız.

Repository: `farukkaya/oksis-api` + `farukkaya/oksis-web`
Story Points: `34`

## Scope
- **API:** `TeachingAssignment` entity (Teacher × ClassRoom × Subject × **weeklyHours**, sezona bağlı), komutlar `AssignSubjectClass` / `UnassignSubjectClass`, sorgu `GetTeacherAssignments` / `GetAssignmentHistory`, event `AssignmentChanged` (§5.9; Ders Programı bunu dinler).
- **Web:** Detay "Görevlendirmeler" sekmesi (aktif sezon ders/sınıfları — *ekle/çıkar burada, ekranın kalbi* §5.6).

## Implementation
- **Domain:** `TeachingAssignment` aggregate; `TeacherId` (TeacherProfile/Teacher) × `ClassRoomId` (AcademicSessions) × `SubjectId` (Academics/Grades) + `WeeklyHours` + `AcademicSessionId`. Sezona bağlı; mimari eşleme (spec `Teacher` ↔ `TeacherProfile`) **kullanıcı teyidi** sonrası sabitlenir.
- **Komutlar:** ekle/çıkar; `AssignmentChanged` event'i yayınla (§5.9 — Ders Programı senkronu).
- **Sorgular:** aktif sezon görevlendirmeleri + sezon sezon görev geçmişi (`GetAssignmentHistory`).
- **Web:** Görevlendirmeler sekmesi — aktif sezon ders/sınıf listesi + "ders/sınıf görevlendir" / "kaldır"; her satır haftalık saat taşır.
- Tenant-filtreli, sezona-bağlı, audit'li (§7 kontrol listesi).

## Acceptance Criteria
- [ ] `TeachingAssignment` entity + Teacher×Class×Subject×weeklyHours + sezon.
- [ ] Ekle/çıkar komutları çalışır; `AssignmentChanged` event'i yayınlanır.
- [ ] Aktif sezon görevlendirmeleri + görev geçmişi sorguları döner.
- [ ] Web "Görevlendirmeler" sekmesi ekle/çıkar + haftalık saat gösterir.
- [ ] Tüm sorgular tenant-filtreli + sezon eksenli; mutasyonlar audit log üretir.
- [ ] Hardcoded Türkçe yok; `any` yok; build/test (api+web) yeşil.

## Test Requirements
- API: assign/unassign happy + tenant izolasyon + sezon eksenli sorgu; `AssignmentChanged` yayını.
- Web: Görevlendirmeler sekmesi ekle/çıkar akışı; haftalık saat render.

## Mimari Notu (kullanıcı teyidi gerekli)
- Spec §5.1 ayrı `Teacher` aggregate'i der; kod `TeacherProfile` (Person). Eşleme onaylanmadan domain sabitlenmez. Sapma olursa `completion_status.md` "⚠️ Spec Dışına Çıkılanlar".
- `Subject` kaynağı (`Academics`/`Grades`) ve `ClassRoom` (`AcademicSessions`) ID ile cross-aggregate referans.

## Dependencies
- ISSUE-01 (ekran). Bunu ISSUE-04/06/07/08 tüketir.

## Out of Scope
- Ders Programı (timetable) çizelgesi — yalnız `AssignmentChanged` event'ini yayınla; çizelge ayrı modül.

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: API → `oksis-api`, web → `oksis-web` (ayrı commit'ler, doğru repoda). Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
