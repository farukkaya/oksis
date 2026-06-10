# Ders Programı (Timetable) — Tamamlanma Durumu

> Bu dosya modülün ne ölçüde tamamlandığını ve spec dışına çıkılan
> durumları raporlar. İlgili her geliştirmede ANINDA güncellenir.
> Status snapshot'tır, kural deposu değil (tam kurallar `business-rules.md`).

**İlerleme:** `▓▓▓░░░░░░░` %30   ·   Status: in-progress   ·   Güncel: 2026-06-10

> Temel: Doküman **tam** (toplam 1 `{{TBD}}`). Ancak backend kodu **yok**
> (`Application/Modules` altında Timetable modülü 0 cs) ve web/mobil ekran yok.
> Yani spec hazır, geliştirme başlamadı.

---

## ✅ Tamamlanan Yapılar

- **Doküman:** 9 dosya tamamen dolu (toplam 1 `{{TBD}}`) — domain model, versiyonlu çizelge akışı, şube×ders×öğretmen×derslik×zaman matrisi tanımlı.
- **Rooms-first dilimi (2026-06-10):** `Room` entity + `[academic].rooms` tablosu
  (migration `20260610_add_rooms_and_class_room_room_id`) + `Modules/Timetable`
  Application dilimi (ListRooms/CreateRoom/UpdateRoom) + `GET/POST/PUT /api/v1/rooms`.
  Şube ev-dersliği ataması `class_rooms.room_id` üzerinden (classrooms ekranı tüketir).
  Saatlik kullanım/çakışma kontrolü timetable çekirdeğinde kalacak.

## ⏳ Eksik / Bekleyen Yapılar

- **Backend:** Timetable çekirdeği — Schedule entity'leri + çakışma motoru + endpoint'ler (rooms dışında yok).
- `rooms.*` özel izinleri (şimdilik rooms uçları `class-rooms.view/update` ile korunuyor — aşağıdaki sapma kaydı).
- **Web:** Program kurma / yayınlama / görüntüleme ekranları.
- **Mobile:** Öğretmen/şube/öğrenci program görünümleri.
- Yoklama/ödev/duyuru modüllerinin bu kaynağı referans alma entegrasyonu.

## ⚠️ Spec Dışına Çıkılanlar

- 2026-06-10 · **Rooms öne çekildi:** İhtiyaç analizi (classrooms §2.2) dersliği
  "rooms — timetable kapsamı, Sprint 2" ilan ediyordu; Sınıflar & Şubeler ekranındaki
  derslik borcunu kapatmak için yalnızca katalog + ev-dersliği ataması dilimi öne
  alındı. Onay: kullanıcı (2026-06-10). Etki: timetable çekirdeği aynı tabloyu
  devralır, kırılma yok.
- 2026-06-10 · **Geçici izin eşlemesi:** rooms uçları `rooms.*` yerine
  `class-rooms.view/update` ile korunuyor (permission seed migration'ı timetable
  çekirdeğine ertelendi). Onay: kullanıcı talimatı kapsamında teknik karar.
  Etki: timetable gelince `rooms.view/manage` izinleri + seed eklenecek.
