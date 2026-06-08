# Öğretmen (Teachers) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `█░░░░░░░░░` %10   ·   Status: in-progress   ·   Güncel: 2026-06-08

> Temel: doküman iskeleti `{{TBD}}`. Admin Öğretmenler **liste ekranı** (greenfield
> spec §5) kuruldu: ISSUE-01 (liste/arama/filtre/tablo iskeleti) + ISSUE-02 (KPI
> şeridi). Görevlendirme domaini (TeachingAssignment, ISSUE-03) ve workload (ISSUE-04)
> hâlâ yok → ilgili kolonlar/metrikler "—".

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

## ⏳ Eksik / Bekleyen Yapılar

- Doküman içeriği (≈110 `{{TBD}}` alanı) — spec doldurulmadı.
- **ISSUE-03:** `TeachingAssignment` domain + görevlendirme yönetimi (ekranın kalbi) — yok.
- **ISSUE-04:** Haftalık yük/kapasite hesabı + doluluk göstergesi — yok.
- **ISSUE-05/06/07/08:** homeroom yönetimi, detay drawer, satır/toplu aksiyonlar, edge-case.
- Mobile: öğretmen rolü ekranları (yok).

## ⚠️ Spec Dışına Çıkılanlar

- **2026-06-08 (ISSUE-01/02):** §5.4 Verdiği Dersler/Sınıflar · Sınıf Öğretmenliği ·
  Haftalık Yük ve §5.2 Ortalama Yük / Branş Açığı **kaynaksız** olduğundan UI'da "—"
  ile degrade edildi. Sapma değil, dürüst tasarım — spec §5.2 "başta —" der; kaynak
  ISSUE-03/04 (TeachingAssignment + workload) ve Ders Programı modülü ile beslenecek.
  Etki: yok (görsel iskelet, yanlış veri yok).
