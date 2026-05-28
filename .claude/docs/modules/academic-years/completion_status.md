# Akademik Sezon (AcademicSessions) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓▓░░░` %70   ·   Status: in-progress   ·   Güncel: 2026-05-28

> Temel: Doküman neredeyse tam (toplam 3 `{{TBD}}` — yalnızca open-questions + README).
> Backend `Oksis.Application/Modules/AcademicSessions` ≈63 cs ile dolu; web academic-sessions
> ekranları (List/Detail/Form + ClassRoom) mevcut. Mobil ve uçtan uca akış kaldı.

---

## ✅ Tamamlanan Yapılar

- **Doküman:** 9 dosyanın 7'si tam dolu; `open-questions.md` (2) ve README (1) dışında `{{TBD}}` yok.
- **Backend:** `AcademicSessions` modülü CQRS handler'larıyla dolu (≈63 cs).
- **Web:** `AcademicSessionListPage`, `AcademicSessionDetailPage`, `AcademicSessionFormPage`, `ClassRoomDetailPage`.

## ⏳ Eksik / Bekleyen Yapılar

- `open-questions.md` içindeki 2 açık karar + README'deki 1 `{{TBD}}`.
- Mobile ekran(lar)ı.
- "Ek sezon / yaz okulu" akışı — bilinçli olarak Sprint 1 kapsamı dışı (bkz. README naming notu).

## ⚠️ Spec Dışına Çıkılanlar

- **Modül yeniden adlandırıldı:** `academic-years` → `academic-sessions`; aggregate root `AcademicYear` → **`AcademicSession`**. Gerekçe: kurs sezonu / yaz okulu gibi yan akademik akışların önünü açık tutmak. Kaynak: bu modülün `README.md` "Naming Notu". Etki: doc klasör slug'ı `academic-years` kalsa da kod ve yeni slug `academic-sessions`.
