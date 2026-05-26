# API-6 — Migration + EF config: `school_grade_levels` + `SchoolCreatedEvent` seed

## Description
`school_grade_levels` junction tablosunu oluştur, EF Core config'i ekle ve okul oluşturulduğunda `school_type`'a göre otomatik seed yapan domain event handler'ı yaz.

## Scope
- `oksis-api/src/Oksis.Infrastructure/Persistence/Configurations/SchoolGradeLevelConfiguration.cs` (yeni)
- `oksis-api/src/Oksis.Infrastructure/Persistence/ApplicationDbContext.cs` — `DbSet<SchoolGradeLevel> SchoolGradeLevels`
- Yeni migration: `20260527_add_school_grade_levels`
- `oksis-api/src/Oksis.Application/Modules/Schools/Events/SchoolCreated/SeedSchoolGradeLevelsHandler.cs` (yeni) — `INotificationHandler<SchoolCreatedEvent>`

## Implementation

### EF Config
```csharp
builder.ToTable("school_grade_levels");
builder.HasKey(x => x.Id);
builder.Property(x => x.GradeLevelId).IsRequired();
builder.Property(x => x.IsActive).IsRequired();
builder.Property(x => x.DisplayOrder).IsRequired();
builder.HasOne<GradeLevel>().WithMany().HasForeignKey(x => x.GradeLevelId).OnDelete(DeleteBehavior.Restrict);
builder.HasOne<School>().WithMany().HasForeignKey(x => x.SchoolId).OnDelete(DeleteBehavior.Restrict);
builder.HasIndex(x => new { x.SchoolId, x.GradeLevelId })
       .IsUnique()
       .HasFilter("is_deleted = 0");
// IHasTenant global query filter (zaten convention/extension'da aktif olmalı)
```

### Migration SQL özeti
```sql
CREATE TABLE school_grade_levels (
    id uniqueidentifier NOT NULL CONSTRAINT pk_school_grade_levels PRIMARY KEY,
    school_id uniqueidentifier NOT NULL,
    grade_level_id uniqueidentifier NOT NULL,
    is_active bit NOT NULL DEFAULT 1,
    display_order int NOT NULL,
    -- standard audit + soft-delete + row_version
    CONSTRAINT fk_sgl_schools FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_sgl_grade_levels FOREIGN KEY (grade_level_id) REFERENCES grade_levels(id)
);
CREATE UNIQUE INDEX ux_school_grade_levels_school_grade
  ON school_grade_levels(school_id, grade_level_id)
  WHERE is_deleted = 0;
```

### Seed handler

`SchoolCreatedEvent` (mevcut, `Modules/Schools/Events`) tetiklendiğinde `school_type`'a göre seed:

| `school_type` | Seed seviyeleri (master `grade_levels.code`) |
|---|---|
| `Preschool` | `AN` |
| `PrimarySchool` | `1, 2, 3, 4` |
| `MiddleSchool` | `5, 6, 7, 8` |
| `HighSchool` | `9, 10, 11, 12` |
| (null) | hiçbiri (admin sonradan seçer) |

```csharp
public sealed class SeedSchoolGradeLevelsHandler(IApplicationDbContext db)
    : INotificationHandler<SchoolCreatedEvent>
{
    private static readonly Dictionary<SchoolType, string[]> Map = new()
    {
        [SchoolType.Preschool]     = ["AN"],
        [SchoolType.PrimarySchool] = ["1","2","3","4"],
        [SchoolType.MiddleSchool]  = ["5","6","7","8"],
        [SchoolType.HighSchool]    = ["9","10","11","12"],
    };

    public async Task Handle(SchoolCreatedEvent ev, CancellationToken ct)
    {
        var settings = await db.SchoolSettings.FirstAsync(x => x.SchoolId == ev.SchoolId, ct);
        if (settings.SchoolType is null || !Map.TryGetValue(settings.SchoolType.Value, out var codes))
            return;

        var levels = await db.GradeLevels.Where(g => codes.Contains(g.Code)).ToListAsync(ct);
        var order = 0;
        foreach (var l in levels.OrderBy(x => x.Code))
            db.SchoolGradeLevels.Add(SchoolGradeLevel.Create(ev.SchoolId, l.Id, ++order));

        await db.SaveChangesAsync(ct);
    }
}
```

## Acceptance Criteria
- [ ] `school_grade_levels` tablosu migration ile oluşturulur, unique index `(school_id, grade_level_id) WHERE is_deleted = 0` mevcut
- [ ] EF Core global tenant query filter `school_grade_levels` üzerinde aktif (mevcut convention veya explicit)
- [ ] `ApplicationDbContext.SchoolGradeLevels` DbSet eklendi
- [ ] `SchoolCreatedEvent` handler okul tipine göre satır seed eder
- [ ] `SchoolType == null` ise hiçbir satır seed edilmez (admin sonradan ayarlar)
- [ ] Down migration tabloyu reversible şekilde drop eder
- [ ] Integration test: yeni okul (`HighSchool`) oluştur → 4 satır (9, 10, 11, 12) seed edilir
- [ ] Integration test: tenant-A için sorgu tenant-B satırlarını dönmez

## Test Requirements
- `SeedSchoolGradeLevelsHandler_HighSchool_SeedsGrades9To12`
- `SeedSchoolGradeLevelsHandler_NullSchoolType_DoesNothing`
- `ApplicationDbContext_SchoolGradeLevels_FilteredByTenant`

## Out of Scope
- `school_grade_level_scales` (ISSUE-7)
- `school_type` değiştirildiğinde otomatik re-seed (BR-SS-014 / docs: admin manual yapar)
- Endpoint (ISSUE-9, ISSUE-14)

## Commit Requirement (ZORUNLU)

> ?? Bu b�l�m her generated issue'da **aynen** yer almak zorundadir. Issue tamamlandiginda **ayri bir commit** atilmadik�a issue "Done" sayilmaz.

- [ ] Issue tamamlandiginda **yalnizca bu issue'a ait dosyalar** stage edilir (`git add <path>`); baska issue'larin degisiklikleri ayni commit'e karismaz.
- [ ] Commit, **OKSIS commit kuralina** uygun formatta atilir: `YYYY-MM-DD <type>[,type]: T�rk�e �zet.` � kanonik kural `.claude/docs/git-commit-rules.md`.
- [ ] Issue-linked commit prefix'i kullanilir: `Issue #<no> YYYY-MM-DD <type>: ...` (issue numarasi `gh issue list` veya dosya adindan alinir, �r. `issue-7.md` ? `Issue #7`).
- [ ] Commit **dogru repoda** atilir: API issue'lari ? `oksis-api`, web issue'lari ? `oksis-web`, mobile issue'lari ? `oksis-mobile`. Workspace root (`oksis/`) repo'sunda **kod commit'i atilmaz**.
- [ ] Husky `commit-msg` hook (`oksis-api`) formati zorlar; `--no-verify` **YASAK**. Hook fail olursa root cause'u d�zelt, sonra yeniden commit at � `--amend` ile ge�mis commit'i degistirme; yeni commit at.
- [ ] **Bir issue = bir commit**. Ayni issue i�inde test + implementation ayni commit'e girer (type: `feat,test`). Birden fazla issue tek commit'e birlestirilmez; "mod�l� bitirince hepsini tek commit yapayim" yaklasimi YASAK.
- [ ] Commit mesajinin body'sinde (opsiyonel) Acceptance Criteria'dan tamamlanan kalemler madde madde �zetlenebilir; uzun a�iklamalar PR description'ina birakilir.

**�rnek (tek issue commit'i):**

```
Issue #7 2026-05-24 feat,test: ChangePasswordCommand ve unit testleri eklendi.

- Mevcut parola BCrypt.Verify ile dogrulanir
- PasswordPolicy.Validate �agrisi yeni parola i�in zorunlu
- Basarili degisimde t�m refresh token'lar revoke edilir
- 3 handler testi + 1 validator testi yesil
```

**Kabul edilmeyen anti-pattern'ler:**

- ? 12 API issue'sunu tek "users mod�l� backend" commit'inde toplamak.
- ? Birden fazla repoya tek bir summary commit atmak.
- ? `update stuff` / `WIP` / T�rk�e olmayan / tarihsiz / nokta'siz mesaj.
- ? `--no-verify` veya hook bypass.
