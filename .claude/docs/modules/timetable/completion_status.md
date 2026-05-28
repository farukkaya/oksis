# Ders Programı (Timetable) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓░░░░░░░░` %25   ·   Status: in-progress (yalnızca spec)   ·   Güncel: 2026-05-28

> Temel: Doküman **tam** (toplam 1 `{{TBD}}`). Ancak backend kodu **yok**
> (`Application/Modules` altında Timetable modülü 0 cs) ve web/mobil ekran yok.
> Yani spec hazır, geliştirme başlamadı.

---

## ✅ Tamamlanan Yapılar

- **Doküman:** 9 dosya tamamen dolu (toplam 1 `{{TBD}}`) — domain model, versiyonlu çizelge akışı, şube×ders×öğretmen×derslik×zaman matrisi tanımlı.

## ⏳ Eksik / Bekleyen Yapılar

- **Backend:** Timetable Domain entity'leri + CQRS handler + endpoint (henüz hiç yok).
- **Web:** Program kurma / yayınlama / görüntüleme ekranları.
- **Mobile:** Öğretmen/şube/öğrenci program görünümleri.
- Yoklama/ödev/duyuru modüllerinin bu kaynağı referans alma entegrasyonu.

## ⚠️ Spec Dışına Çıkılanlar

- Henüz kayıt yok.
