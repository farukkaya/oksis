# Öğrenci — Açık Sorular

> Henüz cevaplanmamış, takım kararı bekleyen veya araştırılması gereken konular. Karar verilince **diğer ilgili dosyaya taşınır** ve buradan silinir.

---

## OQ-students-002: Web "Öğrenciler" liste ekranı — backend veri boşlukları

**Tarih:** 2026-06-06 · **Durum:** Grup A tamamlandı · Grup B ertelendi

**Bağlam:** `oksis-web` admin "Öğrenciler" ekranı (design handoff) `/admin/students`'e
bağlandı. **PersonsController** kullanılıyor: liste `GET /users/persons?profileType=Student`
(`ListPersonsQuery` → `PersonListItemDto`), detay `GET /users/persons/{id}`, veliler
`GET /users/students/{id}/parents`. Tüm web API erişimi
`portals/admin/students/api/studentsApi.ts`'te izole.

**✅ Grup A — tamamlandı (2026-06-06, mevcut entity'ler üzerinde):**
1. Liste satırı zenginliği: `PersonListItemDto`'ya `studentNumber`, `classroomId`,
   `className` (ClassRoom.FullName), `enrollmentDate`, `primaryParentName`,
   `primaryParentPhone` eklendi (handler'da şube + birincil veli join'i).
2. `ListPersonsQuery`'ye **Sınıf** (`ClassroomId`) + **Cinsiyet** (`Gender`) filtre
   parametreleri; durum (lifecycleState, "Mezun" dahil) + ad/kayıt sıralaması zaten vardı.
   *(Sınıf/Devamsızlık/Ortalama kolon sıralaması Grup B'de.)*
5. KPI: **Toplam / Aktif / Bu Ay Yeni Kayıt** → `GetStudentStatsQuery` +
   `GET /users/persons/student-stats`.
6. **Dışa Aktar** → `ExportPersonsQuery` + `GET /users/persons/export` (.xlsx).

**⏳ Grup B — ertelendi (sıfırdan modül; MVP-scope onayı gerektirir):**
3. **Devamsızlık & Ortalama** kolonları + drawer "Devamsızlık"/"Notlar" sekmeleri
   → Attendance ve Marks modülleri **%0** (domain entity/tablo yok). UI'da `—` / boş-durum.
4. **Ödemeler** drawer sekmesi → Payments modülü hiç yok. UI'da boş-durum.
5b. KPI **"Devamsızlık Riski"** → Attendance'a bağlı; UI'da `—`.

**Sorulacak kişi(ler):** Faruk (ürün) · **Hedef karar tarihi:** {{TBD}}

---

## OQ-students-001: {{TBD_soru}}

**Soru:** {{TBD}}

**Bağlam:** {{TBD}} (neden bu soru ortaya çıktı?)

**Seçenekler:**
- **A)** {{TBD_secenek}}
  - Artısı: {{TBD}}
  - Eksisi: {{TBD}}
- **B)** {{TBD_secenek}}
  - Artısı: {{TBD}}
  - Eksisi: {{TBD}}

**Bağımlılıklar:** {{TBD}} (hangi karar bu soruyu etkiler?)

**Etkilenecek dosyalar (karar verilince güncellenecek):**
- {{TBD}}

**Sorulacak kişi(ler):** {{TBD}}

**Hedef karar tarihi:** {{TBD}}

---

## OQ-students-002: {{TBD}}

{{TBD}}

---

## Karar Verilenler (Arşiv)

Soruya cevap geldi ama henüz ilgili dosyaya taşınmadı:

### OQ-students-XXX [RESOLVED 2026-05-15]

**Soru:** {{TBD}}
**Karar:** {{TBD}}
**Taşınacağı dosya:** {{TBD}}

> Bir sonraki güncellemede ilgili dosyaya taşı, buradan sil.
