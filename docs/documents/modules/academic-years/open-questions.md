# Akademik Sezon — Açık Sorular & Kararlar

> Bu modülün tasarımı sırasında ortaya çıkan sorular ve verilen kararlar. Tarihsel kayıt.

---

## Çözülmüş Sorular

### ✅ Q1 — Şube dönem-scope'lu mu, yıl-scope'lu mu?

**Soruluş tarihi:** 2026-05-25
**Karar tarihi:** 2026-05-25
**Karar:** Şube yıl-scope'lu. `ClassRoom.AcademicTermId` kaldırıldı, sadece `AcademicSessionId` taşır.

**Gerekçe:** Türk okul pratiğinde şube tüm eğitim yılı boyunca aynıdır. Dönem-bağlı olanlar: notlar, devamsızlık sayaçları, karne. Şube kapsam dışı.

**Etki:**
- `domain-model.md`: `ClassRoom` properties güncellendi
- `database-schema.md`: `class_rooms.academic_term_id` kolonu olmadan tasarlandı
- `business-rules.md`: BR-AS-010

---

### ✅ Q2 — Çoklu eğitim seviyesi (Anaokulu + İlkokul + Lise) tek sezon mu?

**Soruluş tarihi:** 2026-05-25
**Karar tarihi:** 2026-05-25
**Karar:** Tek `AcademicSession` tüm eğitim seviyelerini kapsar.

**Gerekçe:** İdari süreç ortak (yıl açma, dönem geçişi, tatil takvimi seviyelere göre değişmez). Her seviye için ayrı sezon yönetmek karmaşıklık yaratır, fayda sağlamaz.

**Etki:**
- `AcademicSession`'da `EducationLevel` field'ı YOK
- `ClassRoom` `GradeLevelId` taşır; seviye ayrımı şube seviyesinde
- Frontend: Şubeler ekranında "Anaokulu / İlkokul / Ortaokul / Lise" sekmesi ile gruplama (`grade_levels` üzerinden grup)

**Açık alt-sorular:** Yok.

---

### ✅ Q3 — Mezun öğrenci verisi ne kadar süre saklanır?

**Soruluş tarihi:** 2026-05-25
**Karar tarihi:** 2026-05-25
**Karar:** Default **5 yıl**, parametrik (`school_settings.graduated_data_retention_years`). 6. yıla başlarken hard-delete onay akışı tetiklenir.

**Detaylar:**
- Saklama süresi okul ayarından değiştirilebilir (min 1, max 30 yıl)
- 5+ yıl seçilirse: faturalandırma değişebilir (ücretli) — **kapsam dışı**, ileri sprint
- Hard-delete onay akışında iki seçenek: (a) veriyi indirip silme (export) veya (b) direkt silme — **bu akış da ileri sprint**

**Etki:**
- `database-schema.md`: `school_settings.graduated_data_retention_years` kolonu (Sprint 1)
- `business-rules.md`: BR-AS-007
- Faturalandırma + hard-delete akışı: kapsam dışı, ileri sprint (Sprint 5+)

**Sprint 1 kapsamı:** Sadece kolon eklenir + default 5. Retention background job'ı YOK.

---

### ✅ Q4 — Şube oluşturulduğunda onay akışı olacak mı?

**Soruluş tarihi:** 2026-05-25
**Karar tarihi:** 2026-05-25
**Karar:** Parametrik. `school_settings.require_approval_for_classroom_creation` (default `false`).

**Davranış:**
- `false` (default): Şube oluşturulduğunda direkt `Active`
- `true`: Şube `PendingApproval` statüde oluşur; `class-rooms.approve` permission'ı olan kullanıcı onaylar

**Etki:**
- `domain-model.md`: `ClassRoomStatus` enum'una `PendingApproval` eklendi
- `database-schema.md`: `school_settings.require_approval_for_classroom_creation` kolonu
- `business-rules.md`: BR-AS-008
- `permissions.md`: `class-rooms.approve` permission'ı tanımlandı

---

### ✅ Q5 — Karne dönem kapatıldığında otomatik mi yayınlanır?

**Soruluş tarihi:** 2026-05-25
**Karar tarihi:** 2026-05-25
**Karar:** Otomatik üretim + manuel müdahale destekli. Yayın parametrik: `school_settings.auto_publish_report_cards` (default `true`).

**Davranış:**
- `AcademicTermClosedEvent` → karne üretim job'ı (`report-cards` modülü, Sprint 3)
- `auto_publish_report_cards = true`: Karne üretildikten sonra otomatik veliye push
- `false`: Karneler `Draft` olarak kalır; idare `PublishAll` der
- Manuel müdahaleler her durumda destekli: `Regenerate`, `Edit`, `HoldPublication`

**Etki:**
- `database-schema.md`: `school_settings.auto_publish_report_cards` kolonu (Sprint 1'de eklenir, kullanımı Sprint 3)
- `business-rules.md`: BR-AS-009
- `report-cards` modülü (Sprint 3) bu event'e abone

**Sprint 1 kapsamı:** Sadece kolon + event raise. Karne üretim modülü Sprint 3.

---

### ✅ Q6 — Yıl içinde "ek sezon" (yaz okulu, kurs) desteği olacak mı?

**Soruluş tarihi:** 2026-05-25
**Karar tarihi:** 2026-05-25
**Karar:** **Şu an kapsam dışı.** Ancak isim olarak `AcademicSession` seçildi (`AcademicYear` yerine), gelecekte yan akademik akışların önü açık.

**Gerekçe:**
- Bazı özel okullar müfredat dışı kurslar verir (yaz okulu, hazırlık kursu, dil kursu)
- Bu akışlar dönemle birlikte yürür ama paralel bir track
- Şimdi yapmak: erken karmaşıklık, gerçek ihtiyaç netleşmemiş
- Sonra yapmak: `AcademicSession` ismi sayesinde model genişletilebilir (örn. `SessionType` enum: `Standard` / `Summer` / `Course`)

**Etki:**
- Modül slug: `academic-sessions` (eski: `academic-years`)
- Aggregate root adı: `AcademicSession`
- Tablo adı: `academic_sessions`
- `naming-conventions.md` ve `_MODULE_GUIDE.md` güncellenmeli (aşağıda Q9 olarak)

**Açık alt-sorular:** Ek sezonun teknik tasarımı (model, UI, ücretlendirme) ileri sprint kapsamında tartışılacak.

---

## Açık Sorular (Henüz Cevaplanmamış)

### ❓ Q7 — `classrooms/` klasörü ne olacak?

**Soruluş tarihi:** 2026-05-25
**Mevcut durum:** Açık

`.claude/docs/modules/classrooms/` klasörü mevcut planlamada ayrı bir modüldü. Bu sezon modülüne entegre edildiğinde:

**Seçenek A (önerilen):** Klasör korunur ama içeriği bu modüle referans verir (`see: academic-sessions/`). Geriye dönük uyumluluk için.

**Seçenek B:** Klasör tamamen silinir. Daha temiz.

**Bekleyen karar:** Kullanıcı tercihi.

---

### ❓ Q8 — `naming-conventions.md` güncellemesi nasıl yapılacak?

**Soruluş tarihi:** 2026-05-25
**Mevcut durum:** Açık

Mevcut `naming-conventions.md` ve `_MODULE_GUIDE.md` dosyalarında `AcademicYear` geçiyor. Q6 kararıyla `AcademicSession`'a geçildi. İki dosyada toplam ~5-7 referans güncellenmeli.

**Bekleyen karar:** Bu update'i bu modülün dokümantasyonu kapsamında yapalım mı yoksa ayrı bir PR/iş olarak mı? Genel kuralları değiştiren değişiklikler genelde proje-wide gözden geçirilir.

---

### ❓ Q9 — `school_holidays` tablosunun sahipliği?

**Soruluş tarihi:** 2026-05-25
**Mevcut durum:** Açık

`school_holidays` tablosu önceki plana göre `school-settings` modülünün altındaydı. Yeni tasarımda:
- Tablo `AcademicSessionId` taşır (zorunlu) → sezon olmadan tatil tanımlanamaz
- Yıl-scope'lu

**Önerim:** Bu modüle taşı (`academic-sessions/`).

**Tradeoff:** `school-settings` UI'ında "Tatil Takvimi" sekmesi olur ama veri bu modüldedir — UI sahipliği farklı, veri sahipliği farklı. Mantıken bütün.

**Bekleyen karar:** UI sahipliği `school-settings`'te kalsın mı? Genel pratik: `school-settings/ui-flows.md` "Tatil Takvimi" sekmesini render eder, veri akışı `academic-sessions` API'sini çağırır.

---

### ❓ Q10 — `homeroom_teacher_id` üzerinde FK olmaması güvenli mi?

**Soruluş tarihi:** 2026-05-25
**Mevcut durum:** Açık

`class_rooms.homeroom_teacher_id` kolonunda explicit FK YOK (domain rule: aggregate'ler arasında ID-only referans). Ama bu, öğretmen silindiğinde dangling reference yaratabilir.

**Çözüm seçenekleri:**
- (A) Domain event subscriber: `TeacherDeletedEvent` → ilgili `ClassRoom.HomeroomTeacherId = null` yap
- (B) FK constraint koy (domain kuralını esnet)
- (C) Soft-delete politikası (öğretmen hiç hard-delete edilmez)

**Önerim:** (A) — eventual consistency, aggregate boundary korunur.

**Bekleyen karar:** Hangi politika? Sprint 2'de `users` modülü ile birlikte netleşecek.

---

### ❓ Q11 — Sezon adı format zorunluluğu?

**Soruluş tarihi:** 2026-05-25
**Mevcut durum:** Açık

`AcademicSession.Name` için regex `^\d{4}-\d{4}$` (örn. "2025-2026") öneriliyor. Ama:
- Bazı okullar başka isimlendirme kullanır ("25-26 Eğitim Yılı", "Spring 2026")
- Çoklu eğitim seviyesi varsa "İlkokul 2025-2026" gibi isimler olabilir

**Seçenek:**
- (A) Sıkı regex zorunlu (mevcut öneri)
- (B) Sadece zorunlu + uzunluk; format serbest
- (C) Hem yapılandırılmış (yıl başlangıç + yıl bitiş int field'ları) hem de display name

**Önerim:** (B) — esneklik kazandırır, hata oranı düşük çünkü idare bilinçli giriyor.

**Bekleyen karar:** Kullanıcı tercihi.

---

## Tarihsel Notlar

- 2026-05-15: Modül `academic-years` adıyla planlandı, iskelet dosyaları oluşturuldu (`{{TBD}}` placeholder'larla)
- 2026-05-25: İhtiyaç analizi tamamlandı; 6 açık soru gündeme geldi
- 2026-05-25: 6 sorunun hepsi kullanıcı kararıyla çözüldü
- 2026-05-25: Modül `academic-sessions` olarak yeniden adlandırıldı (Q6 sonucu)
- 2026-05-25: Tüm dokümantasyon dosyaları gerçek içerikle dolduruldu (`{{TBD}}` placeholder'lar kapatıldı)
- 2026-05-25: 5 yeni açık soru (Q7–Q11) yan etkilerle gündeme geldi

---

## Karar Akışı

```
Q1 (şube scope) ──→ ✅ Yıl
Q2 (çoklu seviye) ─→ ✅ Tek sezon, ClassRoom seviyeli
Q3 (veri saklama) ─→ ✅ 5 yıl parametrik + hard-delete ileride
Q4 (şube onayı) ───→ ✅ Parametrik (default kapalı)
Q5 (karne) ────────→ ✅ Otomatik + manuel + parametrik yayın
Q6 (ek sezon) ─────→ ⏸ Şimdilik dışarıda, isim ile önü açık
                       │
                       ├──→ Q7 (classrooms klasörü) — açık
                       ├──→ Q8 (naming-conventions update) — açık
                       └──→ Q9 (school_holidays sahipliği) — açık

Q10 (homeroom FK) ──→ ⏸ Sprint 2'de netleşir
Q11 (sezon adı format) → ⏸ Beklemede
```