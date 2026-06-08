# Öğrenci (Students) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `██░░░░░░░░` %18   ·   Status: in-progress (web spec-audit)   ·   Güncel: 2026-06-08

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
- **students-spec-audit ISSUE-02 (2026-06-08, api `fb77240`, web `b225e7e`):** Öğrenci
  detayı **veli yönetiminin evi** oldu (§4.7/§4.1). Drawer'a **Veliler** sekmesi:
  çoka-çok liste (tip + birincil işareti), veli ekle (mevcut arama → kardeş bağla,
  yoksa yeni veli + arka planda hesap/davet), birincil ata (tek-birincil client
  orkestrasyonu), veli çıkar. Tablo "Veli" kolonu çoklu velide "+N" + birincil işareti
  (§4.4); veli telefonu/e-posta artık `StudentParentDto`'da; `PersonListItemDto`'ya
  `ParentCount`. Backend mevcut `CreateRelationship`/`RevokeRelationship`/
  `UpdateRelationshipPermissions` uçlarına bağlandı (yeni slice yazılmadı).

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği (≈110 `{{TBD}}` alanı) — spec doldurulmadı.
- Backend: `Modules/Students` domain entity + CQRS handler + endpoint (yok).
- **`GetEnrollmentHistory` slice'ı (§4.9)** ve **server-side `seasonId` filtresi** (yok)
  → web tüketici hazır, uç açılınca beslenir.
- Web spec-audit kalan issue'lar: ISSUE-03..06 (domain satır/toplu aksiyonlar,
  detay sekme yapısı, filtreler/arama, edge-case/guardrails).
- Mobile: öğrenci rolü ekranları (yok).

## ⚠️ Spec Dışına Çıkılanlar

- **2026-06-08 — ISSUE-01 (geçici degrade, sapma değil):** §4.6 "Kayıt Geçmişi" ve
  §4.1 sezon-eksenli liste için backend uçları (`GetEnrollmentHistory`, server-side
  `seasonId` filtresi) **henüz yok**. Web tarafı sezon seçici + sekmeyi spec'e uygun
  kurdu; veri uç açılınca beslenir (Devamsızlık/Notlar sekmeleriyle aynı dürüst degrade,
  §4.2 onaylı desen). Gerekçe: issue repo'su web; §4.9 backend "üret/teyit" notu bounded
  scope dışı. Karar verici: spec-audit ajanı (kullanıcı "mimari çatallarda durma" talimatı).
- **2026-06-08 — ISSUE-02 (eşdeğer uç + client orkestrasyonu, sapma değil):** §4.9
  `LinkGuardian`/`UnlinkGuardian`/`SetPrimaryGuardian` adlı **ayrı Students slice'ları
  yok**; aynı işi yapan mevcut `Users` uçları (`POST/PUT/DELETE /users/relationships`)
  bağlandı (CLAUDE.md "aynı işi yapan handler'ı genişlet/kullan"). "Tek birincil"
  değişmezi sunucuda atomik garanti edilmediğinden web, hedefi birincil yaparken diğer
  birincilleri ardışık PUT ile düşürür (client orkestrasyon). Tam atomik tek-birincil +
  dedicated `SetPrimaryGuardian` slice ileride backend işi. Karar verici: spec-audit ajanı.
