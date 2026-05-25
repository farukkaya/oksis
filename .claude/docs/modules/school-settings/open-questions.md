# Okul Ayarları — Açık Sorular & Kararlar

---

## Çözülmüş Sorular

### ✅ Q1 — Seviye bazlı farklı not skalası desteklenecek mi?

**Karar tarihi:** 2026-05-25
**Karar:** Desteklensin.

**Detay:** `school_grade_level_scales` junction tablosu ile her sınıf seviyesine ayrı not skalası atanabilir. İlkokul 5'lik, lise 100'lük kullanabilir. Fallback zinciri: seviye bazlı → okul default → master TR_100 (BR-SS-011).

**Etki:** `database-schema.md` yeni tablo, `domain-model.md` yeni entity, `api-contracts.md` 2 yeni endpoint (#25-26), `ui-flows.md` Akademik Politikalar sekmesi.

---

### ✅ Q2 — `school_type` birden fazla seçilebilir mi?

**Karar tarihi:** 2026-05-25
**Karar:** Birden fazla seçilebilir.

**Detay:** `school_type` enum kolonu korunur ama informational olarak — asıl kademe kapsamı `school_grade_levels` junction'dan gelir. Frontend'de multi-select destekli. Ayrı junction tablosu (school_education_levels) oluşturulmaz — gereksiz karmaşıklık (BR-SS-014).

**Etki:** UI Akademik Yapı sekmesinde multi-select dropdown/checkbox. Backend'de major değişiklik yok.

---

### ✅ Q3 — Akademik Yapı + Politikalar ayrı mı birleşik mi?

**Karar tarihi:** 2026-05-25
**Karar:** 2 ayrı sekme.

**Gerekçe:** Yapı = okulu tanımlar (sınıf kademeleri, ders günleri — nadiren değişir). Politika = akademik kuralları belirler (geçme notu, skala, eşikler — her yıl ayarlanabilir). Farklı düzenleme sıklığı = farklı sekme.

**Etki:** Yeni 6. sekme (Akademik Politikalar) + yeni permission (`update-academic-policy`).

---

### ✅ Q4 — `school_holidays.academic_session_id` nullable mı?

**Karar tarihi:** 2026-05-25
**Karar:** Migration geçişi: nullable. Sprint 4+'ta zorunlu.

**Detay:** Mevcut tatil kayıtları `null` olarak kalır. Yeni tatil eklenirken aktif sezon otomatik atanır (`ICurrentSessionProvider`). Sprint 4+'ta migration: mevcut NULL kayıtlar en yakın sezona bağlanır, kolon NOT NULL yapılır (BR-SS-013).

---

### ✅ Q5 — Akademik Yapı için ayrı permission gerekli mi?

**Karar tarihi:** 2026-05-25
**Karar:** Evet, ayrı permission.

**Detay:** `school-settings.update-academic-structure` slug'ı oluşturuldu (BR-SS-015). Mevcut `UpdateAcademicStructure` endpoint (#6) permission'ı `update-basic`'ten `update-academic-structure`'a taşındı. Ek olarak `update-academic-policy` da yeni slug olarak eklendi. Toplam: 10 → 12 permission.

---

## Açık Sorular

### ❓ Q6 — `school_type` multi-select backend'de nasıl tutulacak?

**Soruluş tarihi:** 2026-05-25
**Mevcut durum:** Açık

Mevcut `school_type` kolonu `nvarchar` enum (`Preschool`/`PrimarySchool`/`MiddleSchool`/`HighSchool`). Çoklu seçim desteklenecekse:
- (A) Virgülle ayrılmış string ("PrimarySchool,MiddleSchool") — basit ama sorgulanamaz
- (B) JSON array (`["PrimarySchool","MiddleSchool"]`) — EF Core JSON mapping
- (C) Bitmask int (1=Preschool, 2=Primary, 4=Middle, 8=High) — hızlı ama okunabilirlik düşük

**Öneri:** (B) — EF Core 8+ JSON column desteği ile temiz. Ama BR-SS-014 kararına göre `school_type` zaten informational — asıl kapsam `school_grade_levels`'tan geliyor. Dolayısıyla (A) bile kabul edilebilir.

---

### ❓ Q7 — Sınav ağırlığı override seviye bazlı mı, okul bazlı mı?

**Soruluş tarihi:** 2026-05-25
**Mevcut durum:** Sprint 2'ye bırakıldı

Master `exam_types` tablosunda 7 sınav türü + default ağırlıklar var. Sprint 2'de `school_exam_type_overrides` tablosu eklenecek. Soru: override okul genelinde mi (tek set), yoksa sınıf seviyesi bazlı mı (ilkokul farklı ağırlık, lise farklı)?

**Seçenekler:**
- (A) Okul bazlı tek set (basit)
- (B) Seviye bazlı (school_id + grade_level_id + exam_type_id) — daha esnek, `school_grade_level_scales` pattern'i ile tutarlı

**Öneri:** Sprint 2'de karar verilecek; şimdilik sadece `school_exam_type_overrides` tablo iskeleti plan olarak kayıtlı.

---

### ❓ Q8 — `HARFLI` skala için geçme notu nasıl çalışacak?

**Soruluş tarihi:** 2026-05-25
**Mevcut durum:** Açık

Master `grade_scales` tablosunda HARFLI skalanın `min_value` ve `max_value`'ı null. `passing_score` ise "C" olarak string. Ama `school_settings.default_passing_score` decimal tipinde.

**Seçenekler:**
- (A) HARFLI skala için geçme notunu ayrı string kolonda tut (`default_passing_grade_letter`)
- (B) Geçme notunu her zaman sayısal tut, HARFLI skalada harf→sayı dönüşüm tablosu ekle (A=4, B=3, C=2, D=1, F=0)
- (C) Sprint 1'de HARFLI skalayı destekleme, sadece TR_100 ve TR_5

**Öneri:** (C) — MVP'de TR_100 ve TR_5 yeterli. HARFLI skala Sprint 3+'ta detaylandırılır. Kolon yapısı buna hazır (decimal nullable).

---

## Karar Akışı

```
Q1 (seviye bazlı skala) ──→ ✅ Desteklensin
Q2 (çoklu school_type) ───→ ✅ Multi-select, informational
Q3 (sekme ayrımı) ────────→ ✅ 2 ayrı sekme
Q4 (holiday session FK) ──→ ✅ Nullable geçiş, Sprint 4+ zorunlu
Q5 (ayrı permission) ─────→ ✅ Evet
                              │
                              ├──→ Q6 (school_type storage) — açık (minor)
                              ├──→ Q7 (sınav ağırlığı scope) — Sprint 2'de
                              └──→ Q8 (HARFLI skala) — Sprint 3'te
```

---

## Tarihsel Notlar

- Sprint 1 başlangıcı: 9 iş kuralı, 21 endpoint, 10 permission — modül çalışır durumda
- 2026-05-25: İhtiyaç analizi tamamlandı; 5 açık soru gündeme geldi
- 2026-05-25: 5 sorunun hepsi kullanıcı kararıyla çözüldü
- 2026-05-25: 7 yeni iş kuralı, 5 yeni endpoint, 2 yeni permission, 2 yeni tablo eklendi
- 2026-05-25: 3 yeni açık soru (Q6-Q8) yan etkilerle gündeme geldi