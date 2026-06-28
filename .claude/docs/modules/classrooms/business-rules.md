# Sınıf / Şube — Business Rules

> Bu modüle özel iş kuralları. Yazılım dünyasından gelen genel kurallar değil — **OKSİS'te Sınıf / Şube için spesifik** kararlar.

> Genel iş kuralları için bkz. proje kökündeki `business-rules.md`.

---

## Kurallar

### BR-classrooms-archive-active: Aktif öğrencisi olan şube arşivlenemez

**Kural:** `activeStudentCount > 0` olan bir şube arşivlenemez. Arşivlemeden önce
öğrenciler başka bir şubeye taşınmalıdır.

**Sebep:** Yoklama/not bütünlüğü — arşivlenen şubede öksüz (orphan) öğrenci
ataması kalmamalı; geçmiş kayıtlar bir aktif şubeye bağlı kalmalı.

**Uygulama:**
- Backend: `ClassRoom.Archive()` domain invariant + `ClassRoomHasActiveStudentsException`
  → `409 Conflict` (`code: ClassRoom.HasActiveStudents`, dinamik Türkçe mesaj).
- Frontend (hibrit savunma): aktif öğrencisi varken "Arşivle" butonu disabled +
  tooltip ("önce öğrencileri başka bir şubeye taşıyın"); sayaç bayatsa / yarış
  durumunda 409 düşüşünde backend mesajı toast'lanır.

**Edge case'ler:**
- Frontend `studentCount` bayat olabilir (havuz sorgusu 200 kayıt sınırı) → backend
  nihai otoritedir, 409 reaktif olarak yakalanır.

---

### BR-classrooms-archive-reason: Arşivleme sebebi zorunlu (≤500 karakter)

**Kural:** Şube arşivlenirken `reason` (sebep) zorunludur ve en fazla 500 karakter olabilir.

**Sebep:** Denetim izi — bir şubenin neden arşivlendiği kayıt altına alınır.

**Uygulama:**
- Backend: `ClassRoom.Archive(reason)` domain invariant (boş/uzun → validation hatası).
- Frontend: `ArchiveSectionModal` zorunlu textarea (maxLength 500, sayaç); boşken
  "Arşivle" butonu disabled.

---

### BR-classrooms-delete-active: Aktif öğrencisi olan şube kalıcı silinemez

**Kural:** `activeStudentCount > 0` olan bir şube kalıcı silinemez (hard delete).
Silmeden önce öğrenciler başka bir şubeye taşınmalıdır.

**Sebep:** Yoklama/not bütünlüğü — silinen şubede öksüz (orphan) öğrenci ataması
kalmamalı; kalıcı silme geri alınamaz olduğu için aktif veriyle korunur.

**Uygulama:**
- Backend: `ClassRoom.EnsureDeletable()` domain guard +
  `ClassRoomHasActiveStudentsException` → `409 Conflict`
  (`code: ClassRoom.HasActiveStudents`). Silme hard delete'tir
  (`TenantSaveChangesInterceptor` → `is_deleted=1`).
- Frontend: aktif öğrencisi varken "Sil" butonu disabled + tooltip; 409 düşüşünde
  backend mesajı toast'lanır.

---

### BR-classrooms-delete-vs-archive: Silme vs. Arşivleme ayrımı

**Kural:** Şube için iki ayrı sonlandırma aksiyonu vardır ve davranışları farklıdır:

| Aksiyon | Etki | (Sezon, Seviye, Şube) slotu | Geçmiş kayıt | Geri alma |
|---|---|---|---|---|
| **Arşivle** (`POST .../archive`) | `Status=Archived`, `is_deleted=0` | **Dolu kalır** (unique index `HasFilter("is_deleted=0")`) → aynı isim **yeniden açılamaz** | Korunur | Yok (kapsam dışı) |
| **Sil** (`DELETE .../{id}`) | `is_deleted=1` (hard delete) | **Serbest kalır** → aynı isimli şube **yeniden açılabilir** | — | Yok (geri alınamaz) |

**Sebep:** Arşiv "geçmişi koru, ama tekrar kullanma" senaryosu (sezon kapanışı);
silme "yanlış açıldı / tamamen kaldır, ismi tekrar kullanılabilir olsun" senaryosu.

**Uygulama:**
- Frontend: DetailPanel'de "Arşivle" (ghost) ve "Sil" (danger) ayrı butonlar; her
  ikisi de aktif öğrencisi olan şubede disabled.
- Backend: arşiv `ClassRoom.Archive(reason)`; silme `ClassRoom.EnsureDeletable()`
  + interceptor soft-delete sütunu.

---

### BR-classrooms-001: Atama/transfer/çıkarma sonrası güncel şube senkronu interceptor'ın işidir

**Kural:** Öğrenci atama (`AssignStudentToClassRoom`), transfer (`TransferStudent`) ve
çıkarma (`RemoveStudentFromClassRoom`) akışları `academic.class_room_students` defterini
değiştirir; öğrencinin denormalize güncel şubesi (`StudentProfile.CurrentClassroomId`)
bu akışlarda **handler tarafından manuel senkronlanmaz**. Senkronu
`StudentClassroomSyncInterceptor` (EF Core `SaveChangesInterceptor`) yapar: defter
değiştiğinde ilgili öğrencinin aktif atama satırından (`left_at IS NULL`)
`current_classroom_id`'yi aynı transaction içinde set eder (aktif yoksa `null`).

**Sebep:** Daha önce handler'lar ayna alanı manuel yazıyordu; defter ile ayna arasında
drift riski vardı. Tek mekanizmaya (interceptor) indirgenerek bu yapısal olarak
engellendi. Defteri değiştiren her yol (komutlar + seeder gibi yan yollar) ayna alanı
otomatik tutarlı tutar.

**Uygulama:**
- Backend: `AssignStudentToClassRoom` / `TransferStudent` / `RemoveStudentFromClassRoom`
  handler'larından manuel `profile.AssignToClassroom` / `profile.RemoveFromClassroom`
  çağrıları **kaldırıldı**. Senkron `StudentClassroomSyncInterceptor`'a devredildi
  (DI zincirinde `TenantSaveChangesInterceptor`'dan sonra, `SoftDeleteInterceptor`'dan önce).
- Tek doğruluk kaynağı / ayna alan kuralının tam tanımı: students `business-rules.md`
  → **BR-students-001**.

**Edge case'ler:**
- Çıkarma sonrası öğrencinin başka aktif ataması yoksa `CurrentClassroomId = null` olur.

**Test referansı:** `StudentClassroomSyncInterceptor` (Infrastructure.IntegrationTests fixture'ında kayıtlı)

---

### BR-classrooms-002: {{TBD}}

{{TBD}}

---

## Sınır Durumlar

| Senaryo | Beklenen Davranış |
|---|---|
| {{TBD}} | {{TBD}} |
| {{TBD}} | {{TBD}} |

---

## Tarihsel Notlar

| Tarih | Değişiklik | Sebep |
|---|---|---|
| 2026-05-15 | İlk kurallar tanımlandı | İlk implementasyon |
| 2026-06-28 | Şube arşivleme kuralları eklendi (aktif öğrenci engeli + zorunlu sebep) | Şube arşivleme (soft-delete) özelliği FE |
| 2026-06-28 | Şube kalıcı silme (hard delete) kuralları eklendi (aktif öğrenci engeli + silme vs. arşivleme ayrımı) | Şube kalıcı silme özelliği FE+BE (`class-rooms.delete`) |
| 2026-06-28 | BR-classrooms-001: assign/transfer/remove handler'larından manuel `CurrentClassroomId` senkronu kaldırıldı; `StudentClassroomSyncInterceptor`'a devredildi | Defter↔ayna drift'ini yapısal olarak engelleme (mimari değişiklik) |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
