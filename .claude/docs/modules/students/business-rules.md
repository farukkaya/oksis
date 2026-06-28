# Öğrenci — Business Rules

> Bu modüle özel iş kuralları. Yazılım dünyasından gelen genel kurallar değil — **OKSİS'te Öğrenci için spesifik** kararlar.

> Genel iş kuralları için bkz. proje kökündeki `business-rules.md`.

---

## Kurallar

### BR-students-001: Öğrencinin güncel şubesi tek doğruluk kaynağından türetilir

**Kural:** Bir öğrencinin "güncel şubesi"nin **tek doğruluk kaynağı (single source of
truth)** `academic.class_room_students` atama defteridir. Aktif atama, `left_at IS NULL`
olan satırdır (unique index gereği bir öğrencide en fazla 1 aktif satır olabilir).
`StudentProfile.CurrentClassroomId` (`[identity].profiles.current_classroom_id`) bu
defterden **türetilen denormalize bir ayna alandır** — okuma kolaylığı için tutulur,
ayrı bir yazım kaynağı değildir.

**Sebep:** İki ayrı yere (defter + ayna alan) elle yazıldığında zamanla **drift**
(tutarsızlık) oluşuyordu. Tek bir mekanizmaya indirgeyerek drift'i yapısal olarak
imkânsız kılmak gerekti.

**Uygulama:**
- Backend: `CurrentClassroomId` artık komut handler'larında **manuel senkronlanmaz**.
  `StudentClassroomSyncInterceptor` (EF Core `SaveChangesInterceptor`) defter her
  değiştiğinde (atama/transfer/çıkarma komutları **veya** doğrudan `ClassRoomStudent`
  ekleyen seeder gibi yan yollar) ilgili öğrencinin aktif atama satırından
  `current_classroom_id`'yi **aynı transaction içinde** set eder (aktif atama yoksa
  `null`). Tek mekanizma olduğu için iki-yazım drift'i imkânsızdır.
- Frontend: Yalnızca okur (örn. veli child-switcher'da çocuğun güncel şubesi); yazmaz.
- DB: `current_classroom_id` denormalize ayna kolon; otoritesi `class_room_students`'tır.

**Edge case'ler:**
- Öğrencinin aktif ataması yoksa (hiç atanmamış / şubeden çıkarılmış) → `CurrentClassroomId = null`.
- Doğrudan `ClassRoomStudent` ekleyen seeder/yan yollar da interceptor'ı tetikler →
  ayna alan handler dışı değişimlerde bile tutarlı kalır.

**Test referansı:** `StudentClassroomSyncInterceptor` (Infrastructure.IntegrationTests fixture'ında kayıtlı)

---

### BR-students-002: {{TBD}}

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
| 2026-06-28 | BR-students-001: güncel şube tek doğruluk kaynağı `class_room_students`; `CurrentClassroomId` `StudentClassroomSyncInterceptor` ile ondan türetilen ayna alan oldu (manuel senkron kaldırıldı) | İki-yazım drift'ini yapısal olarak engelleme |

> Eski kural değişikliği geriye dönük etki yaratıyorsa migration / data fix planı `database-schema.md`'de bahsedilir.
