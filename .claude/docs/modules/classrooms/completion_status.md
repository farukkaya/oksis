# Sınıf / Şube (Classrooms) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `████▓░░░░░` %45   ·   Status: in-progress   ·   Güncel: 2026-06-10

> Temel: Web admin dashboard ekranı (design handoff classes_v2) 1:1 aktarıldı ve
> gerçek `class-rooms` uçlarına bağlandı. Backend CQRS tarafı AcademicSessions
> modülü içinde yaşıyor (ClassRoomsController); bu modülün kendi Application
> slice'ı hâlâ boş. Mobil ekran yok. Doküman iskeletinin ui-flows kısmı dolduruldu.

---

## ✅ Tamamlanan Yapılar

- 9 dosyalık doküman iskeleti + `ui-flows.md` içeriği (dashboard akışı) dolduruldu.
- **Web: `/admin/classrooms` Sınıflar & Şubeler dashboard'u** (2026-06-10,
  design handoff `design_handoff_classes_screen` 1:1 aktarım):
  - Üç katmanlı master–detail: üst bağlam barı (sezon seçici + özet sayaçlar +
    Şube Ekle split + Sihirbazı Başlat) · Kademe→Seviye→Şube ağacı · detay paneli.
  - Arşiv sezon salt-okunur modu (banner'lar, disabled inputlar, soluk kartlar).
  - Doluluk imza sistemi (renk tonları + >%100 çizgili taşma) ve soft kapasite.
  - Modallar: tekil şube, toplu açma (ardışık create), rehber ata, öğrenci ata
    (bekleyen havuz), öğrenci taşı, derslik ata, dışa aktar (DEBT).
  - Gerçek uçlar: GET/POST /class-rooms, PUT capacity, PUT/DELETE homeroom,
    POST approve/archive/students/transfer, GET /academic-sessions,
    GET /academics/grade-levels, GET /users/persons (Teacher/Student).
  - i18n `classrooms` namespace (tr kaynak + en), sidebar girişi, route gate
    (`class-rooms.view`), 13 vitest (lib + SeasonSwitcher + SectionTile), tüm
    suite 581 yeşil.
- **Derslik borcu kapatıldı (2026-06-10, rooms-first dilimi):** `ClassRoom.RoomId`
  + `PUT/DELETE /class-rooms/{id}/room` + rooms kataloğu (timetable modülünde).
  Web'de derslik D rozetleri kalktı; liste/detay DTO'ları RoomCode taşıyor.
  Bkz. timetable `completion_status.md` (sapma kaydı orada).

## ⏳ Eksik / Bekleyen Yapılar

- Backend: `Modules/Classes` kendi slice'ı boş — ClassRoom CQRS'i AcademicSessions
  modülünde yaşıyor (isimlendirme/`Branch` kararı: bkz. open-questions).
- **DEBT listesi (UI'da "D" rozeti + mock fallback, uç açılınca tek dosyadan gerçeğe döner):**
  1. Şube adı (Section) düzenleme — hedef uç `PUT /class-rooms/{id}/section`.
     ⚠️ Section kolonu nvarchar(3) — serbest ad ("Papatya") için migration gerekecek.
  2. Durum geçişi Aktif→Taslak — approve tek yönlü; hedef uç `PUT /class-rooms/{id}/status`.
  3. Cinsiyet dağılımı (kart K/E etiketi + detay bar) — hedef uç
     `GET /class-rooms/{id}/gender-split`; veri mevcut (Person.Gender), öneri:
     ClassRoomDto'ya GirlsCount/BoysCount. Şimdilik deterministik mock.
  4. Dışa aktarma (xlsx/csv/pdf) — hedef uç `POST /class-rooms/export`
     (ExportPersons CSV pattern'i kopyalanabilir).
  ~~5. Derslik~~ — 2026-06-10 rooms-first dilimiyle kapatıldı (gerçek uç).
- **Soft/hard karar bekleyenler (2026-06-10 borç analizi):** kapasite aşımı
  (AssignStudent hard 409 ↔ spec soft), kapasiteyi mevcudun altına çekme (hard),
  çoklu şube rehberliği (SetHomeroom hard 409 ↔ ihtiyaç analizi §9 soft).
- Roster/bekleyen havuz `GET /users/persons?profileType=Student` (ilk 200 kayıt,
  client-side filtre) üzerinden — şube-bazlı server filtresi gelince adaptör güncellenir.
- Sihirbaz Mod A (toplu sezon kurulum/devir) — academic-years modülünde; bu ekran
  yalnızca yönlendirir.
- Mobil ekran yok (admin-only, kapsam dışı olabilir — netleşmedi).

## ⚠️ Spec Dışına Çıkılanlar

- 2026-06-10 · Handoff'taki sabit varsayılan seçim ("9-A", id 17 prototip verisi)
  yerine listedeki ilk şube otomatik seçiliyor — prototip artefaktı, gerçek veride
  sabit id yok. Onay: kullanıcı talimatı "backend karşılığı olmayanı borçla aktar".
  Etki: yok (davranış eşdeğer).
- 2026-06-10 · "Öğrenci Ata/Dağıt" akışı prototipte MoveStudentModal'ı ilk roster
  öğrencisiyle açıyordu; gerçek akışta bekleyen havuzdan seçim yapan ayrı
  `AssignStudentModal` kullanıldı (FR-06 ile uyumlu, prototip kısayolu yerine).
  Etki: UX iyileşmesi, görsel dil aynı.
- 2026-06-10 · Rehber arama satırının alt metni "branş" yerine e-posta — öğretmen
  branş alanı backend'de yok (teachers modülü Phase B). Branş gelince değişecek.
