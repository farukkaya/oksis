# Ders (Subjects) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `███░░░░░░░` %30   ·   Status: frontend-first   ·   Güncel: 2026-06-11

> Web **Dersler & Branşlar** ekranı (sekmeli: Dersler / Branşlar) frontend-first
> teslim edildi (tasarıma hi-fi sadık). Veri katmanı tamamen **mock** (oturum-ömürlü
> store) — backend henüz yok, **Debt**. Doküman içeriği hâlâ büyük ölçüde `{{TBD}}`.

---

## ✅ Tamamlanan Yapılar

- **Web — Dersler & Branşlar ekranı** (`oksis-web/src/portals/admin/subjects/`, route `/admin/subjects`):
  - Sekmeli tek ekran: **Dersler** (tablo + arama/branş/seviye/tür filtreleri + boş/filtre-boş durumları) ve **Branşlar** (tablo + bağlı ders/öğretmen sayaçları + boş durum).
  - **CourseDrawer** (ders ekle/düzenle, "Kaydet ve Yeni Ekle" art arda giriş) + **BranchModal** (paylaşılan `Modal` ile).
  - Branş rozeti, tür/seviye/durum rozetleri, 3-nokta satır menüsü (pasife al/sil-kilidi).
  - Veri katmanı: tipli mock store + API + React Query (tenant-scoped keys) + **Debt mutasyonları** ("(mock)" toast).
  - i18n `subjects` namespace (tr/en). 16 birim/entegrasyon testi (derive, RowMenu, CourseDrawer, BranchModal, SubjectsPage).
- **Sidebar:** Yeni **Akademik** grubu (Dersler & Branşlar aktif; Görevlendirmeler "Yakında" pasif; Ders Programı + Nöbet Yönetimi "Okul"dan buraya taşındı).

## ⏳ Eksik / Bekleyen Yapılar

- **Backend (Debt):** `Subject` + `Branch` domain entity, CQRS handler, endpoint — yok. Tüm veri mock.
- **İzinler (Debt):** `subjects.*` izinleri yok; `/admin/subjects` geçici olarak `class-rooms.view` ile gate'li (timetable rooms-first precedent'i gibi).
- **Doküman içeriği:** domain-model / api-contracts / database-schema / business-rules / permissions hâlâ `{{TBD}}` — teknik analizden doldurulacak (veri modeli: branslar/dersler/ders_seviye/ogretmen_brans/gorevlendirmeler).
- **Öğretmen↔branş (ana/yan) yönetimi:** bu ekranda yok; spec §5.6 gereği Öğretmen detayında (burada yalnız türetilen öğretmen sayacı, mock).
- **Görevlendirmeler ekranı:** yapılmadı (aşağıdaki karara bakınız).
- Mobile: ekran yok.

## ⚠️ Spec Dışına Çıkılanlar / Kararlar

- **2026-06-11** — Tasarım brief'indeki **sınıf-merkezli "Görevlendirmeler" ekranı yapılmadı.** Bağlayıcı spec `oksis-admin-ekranlari-mimari-spec.md` §5.7 görevlendirmeyi (`TeachingAssignment`) **öğretmen-merkezli** ve Öğretmen detayında konumlandırıyor; brief'in ayrı sınıf-merkezli düzenleme ekranı bu sahiplik sınırıyla çelişiyordu. **Karar:** spec'e sadık kalındı; Görevlendirmeler menüde "Yakında" pasif. **Onay:** kullanıcı. **Etki:** bu round yalnız Dersler & Branşlar; görevlendirme ileride Öğretmen detayında ele alınır.
- **2026-06-11** — Ekran **frontend-first** teslim edildi (Frontend-First Debt deseni): görünüm tasarıma birebir, backend borçlu. **Etki:** veri kalıcı değil (oturum-ömürlü mock); izin gate'i geçici `class-rooms.view`.
- **2026-06-11** — Branş varlığı kod adı **`Branch`** olarak belirlendi (UI "Branş"); ders **`Subject`**. Branş şimdilik subjects modülünde belgelenir (Öğretmenler tüketici).
