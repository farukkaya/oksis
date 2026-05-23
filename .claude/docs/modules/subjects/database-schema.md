# Ders — Database Schema

> Bu modülün tablolar, kolonlar, FK, index ve constraint'leri.

> Genel DB kuralları için bkz. `backend/database-rules.md`.

---

## Master Tablolar (tenant-agnostik)

Migration `20260523222901_add_global_seed_master_data` ile HasData() seed. Tenant'lar paylaşır; `SchoolId` taşımaz.

### `subjects` (22 satır seed)

```sql
CREATE TABLE subjects (
    id            uniqueidentifier  not null  constraint pk_subjects primary key,
    code          nvarchar(20)      not null,   -- TR, MAT, FEN, ING, BIO ...
    name          nvarchar(100)     not null,   -- Türkçe ad
    category      nvarchar(30)      not null,   -- SubjectCategory enum string
    is_elective   bit               not null,
    display_order int               not null,
    -- audit + soft-delete + row_version
);

CREATE UNIQUE INDEX ux_subjects_code
  ON subjects(code) WHERE is_deleted = 0;
```

**Seed satırları:**
- **Zorunlu:** TR (Türkçe), MAT (Matematik), FEN (Fen Bilimleri), SOY (Sosyal Bilgiler), ING (İngilizce), DIN (Din Kültürü), BED (Beden Eğitimi), MUZ (Müzik), GOR (Görsel Sanatlar), BIO (Biyoloji), KIM (Kimya), FIZ (Fizik), TAR (Tarih), COG (Coğrafya), FEL (Felsefe), BIL (Bilgisayar), REH (Rehberlik), TDIL (T.C. İnkılap Tarihi)
- **Seçmeli:** MAT2 (İleri Matematik), ALM (Almanca), FRA (Fransızca), OSYM (Matematik TYT/AYT)

### `subject_grade_levels` (148 satır seed — M:N join)

Hangi dersin hangi sınıflarda verilebileceğini tutar.

```sql
CREATE TABLE subject_grade_levels (
    id              uniqueidentifier  not null  constraint pk_subject_grade_levels primary key,
    subject_id      uniqueidentifier  not null,
    grade_level_id  uniqueidentifier  not null,
    -- audit + soft-delete + row_version

    constraint fk_subject_grade_levels_subjects_subject_id
      foreign key (subject_id) references subjects(id),
    constraint fk_subject_grade_levels_grade_levels_grade_level_id
      foreign key (grade_level_id) references grade_levels(id)
);

CREATE UNIQUE INDEX ux_subject_grade_levels_subject_grade
  ON subject_grade_levels(subject_id, grade_level_id) WHERE is_deleted = 0;
```

**Müfredat haritası (özet):**
- Türkçe → 1-8. sınıf
- Matematik → 1-12. sınıf
- Fen Bilimleri → 4-8. sınıf
- İngilizce → 2-12. sınıf
- Biyoloji/Kimya/Fizik → 9-12. sınıf
- T.C. İnkılap Tarihi → sadece 8. sınıf
- Felsefe → 10-12. sınıf

**Join ID stratejisi:** `Id = SeedGuid.From($"sgl:{subjectId:N}:{gradeId:N}")`.

---

## Enum: `SubjectCategory`

```csharp
public enum SubjectCategory
{
    Language = 0, Math = 1, Science = 2, Social = 3,
    Religion = 4, Sports = 5, Art = 6, Technology = 7,
    Counseling = 8, History = 9, Exam = 10
}
```

EF Core'da `HasConversion<string>()` ile persist.

---

## Tenant Tablolar (Sprint 1+ — planlanan)

- `teacher_subjects` — öğretmen ↔ ders atama (`SchoolId`, `TeacherId`, `SubjectId`)
- `classroom_subjects` — şube ↔ ders atama (haftalık saat sayısı vb.)

---

## Migration Geçmişi

| Tarih | Migration | Değişiklik |
|---|---|---|
| 2026-05-24 | `20260523222901_add_global_seed_master_data` | `subjects` + `subject_grade_levels` master tablolar + seed |

---

## Yasaklar

- ❌ `subjects.code` değiştirme — frontend i18n key ve müfredat join'leri bozulur.
- ❌ Master tabloya tenant scope kolonu eklemek.
- ❌ `subject_grade_levels` cascade delete — `Restrict` zorunlu.

> Detay: `backend/database-rules.md`.
