# Öğretmen (Teachers) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `██░░░░░░░░` %20   ·   Status: in-progress   ·   Güncel: 2026-06-08

> Temel: doküman iskeleti `{{TBD}}`. Admin Öğretmenler **liste ekranı** (greenfield
> spec §5) kuruldu: ISSUE-01 (liste/arama/filtre/tablo iskeleti) + ISSUE-02 (KPI
> şeridi). **ISSUE-03: `TeachingAssignment` domaini + Görevlendirmeler sekmesi
> (ekranın kalbi) kuruldu.** Workload hesabı (ISSUE-04) hâlâ yok → §5.4 Haftalık Yük
> kolonu "—" (sekmede toplam yük gösterilir).

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

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği (≈110 `{{TBD}}` alanı) — spec doldurulmadı.
- **ISSUE-04:** Haftalık yük/kapasite hesabı + doluluk göstergesi (kaynak ISSUE-03'te hazır:
  `GetTeacherWorkload` ayrı slice + §5.4 kolon + §5.2 ortalama yük) — yok.
- **ISSUE-05/06/07/08:** homeroom yönetimi, detay drawer, satır/toplu aksiyonlar, edge-case.
- Mobile: öğretmen rolü ekranları (yok).

## ⚠️ Spec Dışına Çıkılanlar

- **2026-06-08 (ISSUE-01/02):** §5.4 Verdiği Dersler/Sınıflar · Sınıf Öğretmenliği ·
  Haftalık Yük ve §5.2 Ortalama Yük / Branş Açığı **kaynaksız** olduğundan UI'da "—"
  ile degrade edildi. Sapma değil, dürüst tasarım — spec §5.2 "başta —" der; kaynak
  ISSUE-03/04 (TeachingAssignment + workload) ve Ders Programı modülü ile beslenecek.
  Etki: yok (görsel iskelet, yanlış veri yok).
