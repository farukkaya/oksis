## Description
**(Kök sapma.)** Öğrenciler ekranını **kişi ekseninden aktif-sezon kayıt (Enrollment) eksenine** taşı.

**Spec çakışması:**
- **§4.1** — *"Öğrenci ≠ Kayıt: Tablo aslında aktif sezonun `Enrollment` kayıtlarını listeler."*
- **§1.2** — Sezon modeli: tablo kişileri değil aktif sezonun kayıtlarını listeler; sezon seçici değişince filtre ekseni değişir, kişiler silinmez.
- **§4.6** — Detayda **Kayıt Geçmişi** sekmesi (*"sezon sezon hangi sınıf — sezon modelinin meyvesi"*).
- **§6.2** — `Aktif → Aktif` self-transition = yıl sonu sezon terfisi (yeni Enrollment).

**Mevcut durum:** `StudentsPage.tsx` `GET /users/persons?profileType=Student` ile **Person** listeliyor; sezon kozmetik sabit (`StudentsPage.tsx:29 → SEASON = "2025–2026"`). **Sezon seçici yok, sorguda `seasonId` yok, "Kayıt Geçmişi" sekmesi yok.** Backend karşılığı `AcademicSessions.ClassRoomStudent` (+ `AcademicSession`) var ama ekran bağlanmıyor.

Repository: `farukkaya/oksis-web` (+ olası `oksis-api` teyit)
Story Points: `21`

## Scope
- `StudentsPage.tsx` — sabit `SEASON` yerine **sezon seçici** + sorguya `seasonId`.
- `api/studentsApi.ts` — liste sorgusunu aktif-sezon kayıt eksenine bağla (`AcademicSessions`/`ClassRoomStudent` ile zenginleştir).
- `StudentDetailDrawer.tsx` — **Kayıt Geçmişi** sekmesi (sezon sezon sınıf).

## Implementation
- Sayfa başına **aktif sezon seçici** ekle (varsayılan aktif sezon). Seçim URL state'e yazılır; tablo o sezonun kayıtlarını listeler.
- Liste verisi kişi değil **kayıt** eksenli olur: aynı kişi farklı sezonlarda farklı satır/sınıf; geçmiş sezon verisi kaybolmaz (§1.2).
- **Kayıt Geçmişi** sekmesi: öğrencinin sezon sezon sınıf/durum kaydı (`GetEnrollmentHistory` — bkz. API notu).
- Sınıf, durum, kayıt tarihi alanları aktif sezon kaydından gelir; kişi kimliği sabit kalır.

## Acceptance Criteria
- [ ] Sayfada çalışan sezon seçici; tablo seçili sezonun kayıtlarını listeliyor.
- [ ] Hardcoded `SEASON` sabiti kaldırıldı; sezon veriden geliyor.
- [ ] Detayda "Kayıt Geçmişi" sekmesi sezon sezon sınıf/durum gösteriyor.
- [ ] Geçmiş sezon seçildiğinde o yılın kayıtları görünüyor (kişi silinmiyor).
- [ ] Hardcoded Türkçe yok; `any` yok; build + vitest yeşil.

## Test Requirements
- Vitest: sezon değişiminde sorgu parametresi + listenin değiştiği; Kayıt Geçmişi sekmesi render + boş/hata.

## API / Mimari Notu
- Sezon/kayıt modeli `AcademicSessions` (`AcademicSession`, `ClassRoomStudent`) altında; `Modules/Students` boş. **`Students` ↔ `AcademicSessions` sahiplik sınırı kullanıcı ile teyit edilmeli** (§1.2 "Enrollment" ≈ `ClassRoomStudent`).
- `GetEnrollmentHistory` slice'ı **doğrula/üret** (§4.9'da listeli, kodda yok).
- Liste DTO'sunu sezon-eksenli alanlarla (aktif sezon sınıfı/durumu) zenginleştir; gerekiyorsa server-side sezon filtresi ekle.

## Dependencies
- ISSUE-03 (sınıf ata/terfi) ve ISSUE-04 (Kayıt Geçmişi sekmesi) bu eksene oturur.

## Out of Scope
- Veli CRUD (ISSUE-02); domain operasyon menüsü (ISSUE-03).

## Commit Requirement (ZORUNLU)
- [ ] Yalnızca bu issue'a ait dosyalar stage edilir; başka issue karışmaz.
- [ ] OKSİS commit formatı: `Issue #<no> YYYY-MM-DD <type>[,type]: Türkçe özet.` — `.claude/docs/git-commit-rules.md`.
- [ ] Doğru repo: web → `oksis-web`, API → `oksis-api`. Workspace root'ta kod commit'i atılmaz.
- [ ] `--no-verify` YASAK; bir issue = bir commit (`feat,test`).
