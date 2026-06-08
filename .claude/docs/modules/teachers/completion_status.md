# Öğretmen (Teachers) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `████░░░░░░` %35   ·   Status: in-progress   ·   Güncel: 2026-06-08

> Temel: doküman iskeleti `{{TBD}}`. Admin Öğretmenler **liste ekranı** (greenfield
> spec §5) kuruldu: ISSUE-01 (liste/arama/filtre/tablo iskeleti) + ISSUE-02 (KPI
> şeridi) + ISSUE-03 (`TeachingAssignment` domaini + Görevlendirmeler sekmesi).
> **ISSUE-04: Haftalık yük/kapasite (ekranın imzası) kuruldu** → §5.4 "X / Y saat" +
> doluluk barı, §5.2 Ortalama Yük KPI'ı dolu, §5.8 aşırı yük yumuşak uyarı.

---

## ✅ Tamamlanan Yapılar

- 9 dosyalık doküman iskeleti oluşturuldu (içerik doldurulmadı).
- **ISSUE-01 (web §5/§5.3/§5.4):** `/admin/teachers` route + menü; `portals/admin/teachers/`
  (Öğrenciler desenini referans alır, `.stu*` CSS yeniden kullanılır). `profileType=Teacher`
  listesi: ad/sicil/branş arama + durum/branş/görev-tipi filtreleri + sayfalama +
  skeleton/empty/error. §5.4 kolon iskeleti; kaynaksız kolonlar (Verdiği Dersler,
  Sınıf Öğretmenliği, Haftalık Yük) "—". tr/en i18n (`teachers` namespace).
- **ISSUE-01 (api):** `ListPersonsQuery` aramasına TeacherProfile sicil/branş dalı;
  `PersonListItemDto`'ya Branch/EmployeeNumber/HireDate.
- **ISSUE-02 (web/api §5.2):** `TeachersKpiStrip` (Toplam · Aktif Görevli · Ortalama Yük ·
  Branş Açığı); `GetTeacherStats` query + `GET /users/persons/teacher-stats`. Ortalama Yük
  (ISSUE-04) + Branş Açığı (Ders Programı) kaynaksız → "—".
- **ISSUE-03 (api §5.1/§5.7/§1.2):** `TeachingAssignment` aggregate (Teacher[Person.id] ×
  ClassRoom × Subject + haftalık saat, sezona bağlı, soft-revoke = görev geçmişi). Komutlar
  `AssignSubjectClass`/`UnassignSubjectClass` + `TeachingAssignmentChangedEvent` (§5.9, Ders
  Programı senkronu için Assigned/Unassigned). Sorgular `GetTeacherAssignments` (aktif sezon +
  toplam yük) / `GetAssignmentHistory`. EF config (filtered unique aktif tekillik, weekly_hours
  1–40 check), migration, DbSet, permission/role seed (`teaching-assignments.view/.assign`).
  Yardımcı: `GET /academics/subjects` lookup. §5.8 guard: ayrılmış öğretmene/arşiv şubeye atama
  reddi. 11 unit test.
- **ISSUE-03 (web §5.6/§5.7):** `TeacherAssignmentsTab` (ekranın kalbi) — aktif sezon
  görevlendirmeleri haftalık saatiyle, ekle (`AddAssignmentDialog`: şube/ders/saat)/kaldır,
  toplam yük başlıkta. `useTeacherAssignments` (query + mutasyonlar, invalidate). tr/en i18n.
  4 web test. **Detay drawer'a mount ISSUE-06 işi** (sekme self-contained, dışa export'lu).
- **ISSUE-04 (api §5.2/§5.4/§5.7/§5.8/§5.9):** `GetTeacherWorkload` query — sezon bazında
  öğretmen başına aktif görevlendirme saatleri toplamı + kapasite doluluğu + ortalama (§5.2).
  `[Cacheable]` ile sezon bazlı Redis cache (`teachers:workload:{SessionId}`, §5.9);
  assign/unassign komutları cache prefix'ini geçersiz kılar. `IsOverloaded` yumuşak uyarı (§5.8).
  `GET /users/persons/teacher-workload`. Kapasite kaynağı spec'te tanımsız → sabit
  `TeacherWorkloadDefaults.WeeklyCapacity = 30`. 3 unit test.
- **ISSUE-04 (web §5.2/§5.4/§5.8):** `useTeacherWorkloadQuery` + `teachersApi.workload`;
  satırlara teacherId üzerinden yük birleştirilir → "Haftalık Yük" kolonu "X / Y saat" +
  doluluk barı (ekranın imzası). Aşırı yük rozeti + sarı bar (engellemez). KPI "Ortalama
  Haftalık Yük" `averageFillPercent` ile beslenir. Yük barı CSS'i `students.css`'e eklendi.
  3 web test (tablo bar/aşırı yük + adaptör map).
- **ISSUE-05 (api §5.7/§5.8):** `ClassRoom.RemoveHomeroom()` + `ClassRoomHomeroomRemovedEvent`
  (§5.8 "rehbersiz"). `SetHomeroom`/`RemoveHomeroom` command'ları → `PUT`/`DELETE
  /class-rooms/{id}/homeroom`. §5.7 "bir öğretmen aynı sezonda ≤1 şube" tenant-geneli kontrolle;
  §5.8 ayrılmış öğretmen (TeacherProfile.IsTerminated) + arşivli şube engeli. Domain +2, app +5 test.
- **ISSUE-05 (web §5.4/§5.5/§5.6/§5.7/§5.8):** Tablo "Sınıf Öğretmenliği" kolonu homeroom
  haritasından (şube adı / "—"). Satır aksiyonu "Sınıf öğretmeni ata/kaldır" (`TeacherRowActions`,
  `class-rooms.update` gate). `HomeroomDialog`: mevcut sorumlu şube + öğrenci listesi köprüsü
  (`/admin/students?class={id}`, §5.6), rehbersiz/dolu şube ayrımı, tek-şube önden engel (dolu
  şube option disabled). `teachersApi.homeroomMap/setHomeroom/removeHomeroom` + `useHomeroom`
  hook (query + mutasyonlar, invalidate). tr/en i18n. 5 web test (dialog 3, rowActions 2, table +1).

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği (≈110 `{{TBD}}` alanı) — spec doldurulmadı.
- **ISSUE-06/07/08:** detay drawer (homeroom dahil §5.6 sekmesi drawer'a taşınacak), satır/toplu
  aksiyonlar, edge-case.
- Mobile: öğretmen rolü ekranları (yok).

## ⚠️ Spec Dışına Çıkılanlar

- **2026-06-08 (ISSUE-01/02):** §5.4 Verdiği Dersler/Sınıflar · Sınıf Öğretmenliği ·
  Haftalık Yük ve §5.2 Ortalama Yük / Branş Açığı **kaynaksız** olduğundan UI'da "—"
  ile degrade edildi. Sapma değil, dürüst tasarım — spec §5.2 "başta —" der; kaynak
  ISSUE-03/04 (TeachingAssignment + workload) ve Ders Programı modülü ile beslenecek.
  Etki: yok (görsel iskelet, yanlış veri yok). **Güncelleme:** Haftalık Yük + Ortalama Yük
  ISSUE-04'te dolduruldu; Sınıf Öğretmenliği ISSUE-05'te dolduruldu; "—" yalnız Verdiği
  Dersler/Sınıflar (Ders Programı özeti) + Branş Açığı (Ders Programı) için kaldı.
- **2026-06-08 (ISSUE-04):** §5.4 "24 / 30 saat" örneğindeki kapasite üst sınırının (30)
  kaynağı spec'te tanımsız (okul ayarı mı sabit mi belirsiz). Okul ayarları modülünde
  öğretmen kapasite alanı yok + ders programı/okul ayarı genişletmesi Out of Scope →
  kapasite tek sabit (`TeacherWorkloadDefaults.WeeklyCapacity = 30`) olarak ele alındı.
  İleride school-settings alanı eklenirse sabit fallback olur. Etki: tüm öğretmenler için
  aynı kapasite; per-okul/per-öğretmen özelleştirme yok.
