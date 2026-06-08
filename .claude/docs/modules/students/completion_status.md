# Öğrenci (Students) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `█░░░░░░░░░` %10   ·   Status: in-progress (web spec-audit)   ·   Güncel: 2026-06-08

> Temel: Doküman iskeleti büyük ölçüde `{{TBD}}`. Backend `Application/Modules/Students`
> boş (0 cs); öğrenci verisi `Users`(PersonsController) + sezon/kayıt `AcademicSessions`
> (`ClassRoomStudent`) üzerinden gelir. **Web "Öğrenciler" admin ekranı VAR**
> (`oksis-web/src/portals/admin/students/**`) ve spec-audit (students-spec-audit) ile
> §4'e hizalanıyor.

---

## ✅ Tamamlanan Yapılar

- 9 dosyalık doküman iskeleti oluşturuldu (içerik doldurulmadı).
- **Web admin "Öğrenciler" ekranı** (liste/kart, KPI, drawer, filtreler) mevcut.
- **students-spec-audit ISSUE-01 (2026-06-08, web `0834f37`):** Öğrenciler ekranı
  **sezon (Enrollment) eksenine** taşındı (§4.1/§1.2). Hardcoded `SEASON` kaldırıldı;
  sezon `GET /academic-sessions`'tan gelir, URL state (`season`), sezon seçici eklendi;
  liste/export sorgusu `seasonId` taşır. Drawer'a **Kayıt Geçmişi** sekmesi (§4.6).

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği (≈110 `{{TBD}}` alanı) — spec doldurulmadı.
- Backend: `Modules/Students` domain entity + CQRS handler + endpoint (yok).
- **`GetEnrollmentHistory` slice'ı (§4.9)** ve **server-side `seasonId` filtresi** (yok)
  → web tüketici hazır, uç açılınca beslenir.
- Web spec-audit kalan issue'lar: ISSUE-02..06 (veli yönetimi, domain aksiyonları,
  detay sekmeleri, filtreler, edge-case'ler).
- Mobile: öğrenci rolü ekranları (yok).

## ⚠️ Spec Dışına Çıkılanlar

- **2026-06-08 — ISSUE-01 (geçici degrade, sapma değil):** §4.6 "Kayıt Geçmişi" ve
  §4.1 sezon-eksenli liste için backend uçları (`GetEnrollmentHistory`, server-side
  `seasonId` filtresi) **henüz yok**. Web tarafı sezon seçici + sekmeyi spec'e uygun
  kurdu; veri uç açılınca beslenir (Devamsızlık/Notlar sekmeleriyle aynı dürüst degrade,
  §4.2 onaylı desen). Gerekçe: issue repo'su web; §4.9 backend "üret/teyit" notu bounded
  scope dışı. Karar verici: spec-audit ajanı (kullanıcı "mimari çatallarda durma" talimatı).
