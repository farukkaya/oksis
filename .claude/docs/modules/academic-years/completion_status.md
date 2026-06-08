# Akademik Sezon (AcademicSessions) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓▓▓▓▓▓░░` %80   ·   Status: in-progress   ·   Güncel: 2026-06-09

> Temel: Doküman neredeyse tam (toplam 3 `{{TBD}}` — yalnızca open-questions + README).
> Backend `Oksis.Application/Modules/AcademicSessions` dolu; web academic-sessions
> ekranları (List/Detail/Form + ClassRoom) mevcut. **Sezon Rollover backend'i (Faz 1) tamamlandı**
> (taslak → Sezonu Aç → Aktifleştir + §4.9 terfi + §5.9 görevlendirme kopyası). Frontend sihirbaz,
> resmi tatil üretimi ve mobil kaldı.

---

## ✅ Tamamlanan Yapılar

- **Doküman:** 9 dosyanın 7'si tam dolu; `open-questions.md` (2) ve README (1) dışında `{{TBD}}` yok.
- **Backend:** `AcademicSessions` modülü CQRS handler'larıyla dolu.
- **Web:** `AcademicSessionListPage`, `AcademicSessionDetailPage`, `AcademicSessionFormPage`, `ClassRoomDetailPage`.
- **Sezon Rollover (Faz 1, 2026-06-09):** `SeasonDraft` varlık + CQRS slice (Save/Get/Delete); `ClassRoom.SourceClassRoomId` köken bağı; `GetSeasonRolloverPreview` terfi haritası önizleme; `OpenSeasonFromDraft` (yapı materyalizasyonu — Setup sezon + dönemler + boş şubeler); `PromoteStudents` toplu sezon terfisi (§4.9, idempotent); `CopyAssignmentsToNewSeason` görevlendirme kopyalama (§5.9, idempotent); `ActivateSeasonRollover` orkestratörü (tek transaction). Tasarım/plan: `docs/superpowers/specs/2026-06-08-sezon-rollover-design.md`, `docs/superpowers/plans/2026-06-08-sezon-rollover-backend.md`. Boşluk analizi: `season-management-gap-analysis.md` kalemleri 1–7 kapandı.

## ⏳ Eksik / Bekleyen Yapılar

- **Sezon Rollover — resmi/okul tatil üretimi:** `OpenSeasonFromDraft` içindeki `CopyHolidays` bloğu şu an placeholder (TODO). Taslak okul tatillerini `SchoolHoliday`'e yazma + `OfficialHoliday` master'dan sezon yılına resmi tatil üretimi yapılacak (bağlayıcı §4.9/§5.9 dışı). Gap analizi kalem 5 + 8 (takvim etkinlikleri Faz 2).
- **Sezon Rollover — frontend sihirbaz** (oksis-web 6 adımlı stepper) — ayrı plan.
- `open-questions.md` içindeki 2 açık karar + README'deki 1 `{{TBD}}`.
- Mobile ekran(lar)ı.
- "Ek sezon / yaz okulu" akışı — bilinçli olarak Sprint 1 kapsamı dışı (bkz. README naming notu).

## ⚠️ Spec Dışına Çıkılanlar

- **Modül yeniden adlandırıldı:** `academic-years` → `academic-sessions`; aggregate root `AcademicYear` → **`AcademicSession`**. Gerekçe: kurs sezonu / yaz okulu gibi yan akademik akışların önünü açık tutmak. Kaynak: bu modülün `README.md` "Naming Notu". Etki: doc klasör slug'ı `academic-years` kalsa da kod ve yeni slug `academic-sessions`.
- **2026-06-09 — Rollover izin slug'ları:** Tasarımda `academic-sessions.manage` öngörülmüştü; seed'de bulunmadığından taslak/önizleme uçları `academic-sessions.create` ile gate edildi. `teachers.assign` yerine mevcut `teaching-assignments.assign` kullanıldı. Yalnız `students.promote` yeni izin olarak seed+migration ile eklendi. Onaylayan: oturum kararı (Claude/farukkaya). Etki: düşük (hepsi School_Admin'de). İleride `academic-sessions.manage` eklenirse taslak/önizleme uçları ona taşınmalı.
- **2026-06-09 — Rollover faz ayrımı:** Öğrenci terfisi + görevlendirme kopyası "Sezonu Aç"ta değil **"Aktifleştir"de** materyalize edilir (taslak↔aktivasyon arası öğrenci giriş/çıkışı gerçek cutover'da yansısın diye). Onaylayan: oturum kararı. Kaynak: tasarım dokümanı §1.
- **2026-06-09 — Tenant interceptor:** Bir alt-geliştirme `TenantSaveChangesInterceptor`'a global Modified→Added heuristiği eklemişti; adversarial güvenlik review'ı (disconnected-update bozulması + cross-tenant guard zayıflaması) nedeniyle **geri alındı**. Kök neden `PromoteStudentsCommandHandler`'da tek-entity `IApplicationDbContext.MarkAsAdded(object)` ile yerel çözüldü. `SchoolId != original` değişmezlik kontrolü (daha güçlü) korundu.

## 🐛 Bilinen / Devredilen

- **Latent EF bug — `AssignStudentToClassRoomCommandHandler`:** Yüklü (tracked) bir `ClassRoom`'un field-backed `Students` koleksiyonuna yeni `ClassRoomStudent` eklerken EF Core 10 onu `Modified` sanabilir (`DbUpdateConcurrencyException`). `PromoteStudents` bunu `MarkAsAdded` ile çözdü; mevcut tekil atama handler'ı aynı desende ama entegrasyon testi olmadığından latent. Ayrı iş olarak ele alınmalı.
