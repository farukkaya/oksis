# Sınıf / Şube (Classrooms) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `███████░░░` %67   ·   Status: in-progress   ·   Güncel: 2026-06-28

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
- **SIFIR BORÇ (2026-06-10, ikinci dalga):** Kalan 4 DEBT kalemi gerçek uçlara
  taşındı; web DEBT katmanı (classroomsDebtApi/useClassroomDebt) ve tüm "D"
  rozetleri kaldırıldı:
  1. Şube adı: `ClassRoom.Rename` + `PUT /class-rooms/{id}/section`; Section
     nvarchar(3)→30 + FullName 20→40 (migration `20260610_expand_class_room_
     section_and_full_name`) — serbest ad ("Papatya") artık uçtan uca çalışıyor,
     tek harf adlar uppercase'e normalize edilir.
  2. Durum: `MoveToDraft` + `Approve(Draft kabul)` + `PUT /class-rooms/{id}/status`
     (Aktif ⇄ Taslak iki yönlü).
  3. Cinsiyet: `ClassRoomDto.GirlsCount/BoysCount` (aktif atamalar × Person.Gender,
     tek grup sorgusu; erkek = mevcut - kız).
  4. Export: `GET /class-rooms/export?sessionId=&format=xlsx|csv`
     (IExcelExporter + UTF-8 BOM ';' CSV); web blob indirme.
- **Okul türü ↔ kademe uyumu (2026-06-10 fix):** Seviye kaynağı master katalog
  yerine `GET /school-settings/grade-levels` (isActive) — "şube oluştururken
  yalnızca buradaki kademeler listelenir" sözleşmesi. Ağaç arama yokken okulun
  açık TÜM kademelerini şubesiz de gösterir (boş seviye = yalnız "Şube ekle"
  kartı); Ortaokul+Lise okulda boş Ortaokul artık görünür. Not: uç
  `school-settings.view` ister (SchoolAdmin'de var; Secretary için ⚙).
- **Şube arşivleme — FE (2026-06-28):** DetailPanel alt barına "Arşivle" butonu
  (izin `class-rooms.archive`; aktif öğrencisi olan şubede disabled + tooltip),
  `ArchiveSectionModal` (zorunlu sebep ≤500, "geri-alma yok" notu), `useArchiveSection`
  hook (409 `ClassRoom.HasActiveStudents`'ta backend Türkçe mesajı toast'lanır — hibrit).
  Gerçek uç `POST /class-rooms/{id}/archive` (backend zaten hazırdı, izin seed'de mevcut).
- **Şube kalıcı silme — FE+BE (2026-06-28):** DetailPanel alt barına "Sil" (danger)
  butonu (izin `class-rooms.delete`; aktif öğrencisi olan şubede disabled + tooltip),
  `DeleteSectionModal` (sebep YOK, "geri alınamaz" uyarısı), `useDeleteSection` hook.
  Backend: `DELETE /class-rooms/{id}` hard delete (`TenantSaveChangesInterceptor` →
  `is_deleted=1`, slot serbest → aynı isim yeniden açılabilir); `ClassRoom.EnsureDeletable()`
  + 409 `ClassRoom.HasActiveStudents`. Yeni izin `class-rooms.delete` seed'e eklendi +
  migration `20260628_add_class_rooms_delete_permission` (SuperAdmin + SchoolAdmin).
  "Arşivle" butonu korundu (artık ghost stil; arşiv = slot dolu kalır, sil = slot serbest).
- **Profil senkronu (2026-06-10):** assign/transfer/remove handler'ları
  `StudentProfile.CurrentClassroomId`'yi aynı transaction'da güncelliyordu — roster
  ve bekleyen havuz atama sonrası tutarlı (önceden sadece UpdateProfile yazıyordu).
  **(2026-06-28 ile değiştirildi — aşağıya bakın.)**
- **Güncel şube senkronu interceptor'a taşındı (2026-06-28, mimari değişiklik):**
  assign/transfer/remove handler'larından manuel `profile.AssignToClassroom/RemoveFromClassroom`
  çağrıları **kaldırıldı**. Yeni `StudentClassroomSyncInterceptor` (EF Core
  `SaveChangesInterceptor`) `current_classroom_id`'yi tek doğruluk kaynağı
  `class_room_students`'tan (aktif satır, `left_at IS NULL`) aynı transaction içinde
  türetir (aktif yoksa `null`); defteri değiştiren her yol (komutlar + seeder yan yolları)
  ayna alanı otomatik tutarlı tutar → iki-yazım drift'i yapısal olarak imkânsız. DI
  zincirinde `TenantSaveChangesInterceptor` sonrası, `SoftDeleteInterceptor` öncesi;
  entegrasyon test fixture'ına eklendi. Kural: classrooms `business-rules.md`
  BR-classrooms-001 + students BR-students-001.

## ⏳ Eksik / Bekleyen Yapılar

- Backend: `Modules/Classes` kendi slice'ı boş — ClassRoom CQRS'i AcademicSessions
  modülünde yaşıyor (isimlendirme/`Branch` kararı: bkz. open-questions).
- **DEBT listesi: BOŞ** — 2026-06-10 itibarıyla ekranın tüm aksiyonları gerçek
  uçlara bağlı (yukarıdaki "SIFIR BORÇ" kaydı). Tek kalan kapsam dışı: PDF export
  (yeni kütüphane onayı gerekir — aşağıdaki sapma kaydı).
- ~~Soft/hard karar bekleyenler~~ — 2026-06-10'da üçü de SOFT'a çekildi
  (aşağıdaki sapma/karar kaydı).
- Roster/bekleyen havuz `GET /users/persons?profileType=Student` (ilk 200 kayıt,
  client-side filtre) üzerinden — şube-bazlı server filtresi gelince adaptör güncellenir.
- Sihirbaz Mod A (toplu sezon kurulum/devir) — academic-years modülünde; bu ekran
  yalnızca yönlendirir.
- Mobil ekran yok (admin-only, kapsam dışı olabilir — netleşmedi).
- Şube arşivden geri alma (unarchive/restore) **ertelendi** — backend ucu yok;
  bilinçli kapsam dışı (gerekirse ayrı BE+FE işi). Modal kullanıcıya not gösterir.

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
  (Düzeltme 2026-06-10 borç analizi: `PersonListItemDto.Branch` aslında DOLU —
  web tarafında branşa geçiş küçük bir iyileştirme olarak bekliyor.)
- 2026-06-10 · **SOFT kararları (kullanıcı onayı):** üç hard kural soft'a çekildi —
  (1) kapasite aşımı atamayı engellemez (`AssignStudent` Capacity.Exceeded kaldırıldı,
  Transfer ile tutarlı; İA §9/bulgu #6), (2) kapasite mevcudun altına düşürülebilir
  (`UpdateCapacity` BelowActive kaldırıldı), (3) bir öğretmen birden çok şubeye
  rehber atanabilir (`SetHomeroom` teacher-already-homeroom 409 kaldırıldı; İA §9).
  Etki: UI soft uyarı metinleri artık davranışla birebir uyumlu.
- 2026-06-10 · **PDF export kapsam dışı:** handoff modalındaki üçüncü biçim (pdf)
  yeni kütüphane (örn. QuestPDF) onayı gerektirdiğinden xlsx+csv ile teslim edildi;
  modaldan pdf seçeneği ve "kapsam" segmenti (tüm/filtreli/kademe — export her zaman
  sezonun tamamı) çıkarıldı. Onay: kullanıcı talimatı kapsamında teknik karar.
- 2026-06-10 · Tek harfli şube adları uppercase'e normalize edilir; çok karakterli
  serbest adlarda büyük/küçük harf korunur (önceki ToUpperInvariant "PAPATYA"
  üretirdi — bulgu #4 ile çelişirdi). Tekillik DB collation'da case-insensitive.
