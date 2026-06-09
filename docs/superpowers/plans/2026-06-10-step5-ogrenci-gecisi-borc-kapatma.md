# Step 5 (Öğrenci Geçişi) Borç Kapatma — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sezon Açılış Sihirbazı Step 5'teki 4 DebtBadge + 3 mock öğrenci sayısını kaldırıp gerçek veriye bağlamak (active/promote rollover preview'den türetilir; passive backend'e eklenir).

**Architecture:** B (backend) önce: `SeasonRolloverSummaryDto`'ya `PassiveStudents` alanı + `SeasonRolloverMapCalculator`'da pasif sayım (gerçek `PromoteStudents` tanımıyla birebir). Sonra A (frontend): `StepStudents` sayıları `useRolloverPreviewQuery`'den türetir, DebtBadge/mock silinir.

**Tech Stack:** .NET 10 / EF Core 10 / xUnit + FluentAssertions (backend); React + TS / React Query v5 / Vitest + MSW (frontend).

**Repos:** `oksis-api` (Task 1-2), `oksis-web` (Task 3-4), `oksis` workspace docs (Task 5).

---

### Task 1: Backend — DTO + calculator pasif sayım

**Files:**
- Modify: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/DTOs/SeasonRolloverPreviewDto.cs:16-19`
- Modify: `oksis-api/src/Oksis.Application/Modules/AcademicSessions/Shared/SeasonRolloverMapCalculator.cs`
- Test: `oksis-api/tests/Oksis.Infrastructure.IntegrationTests/Persistence/SeasonRolloverPreviewTests.cs`

- [ ] **Step 1: Genişleme testi yaz (failing) — pasif öğrenci sayılır**

`SeasonRolloverPreviewTests.cs`'e yeni fact ekle. Mevcut yardımcılar (`SeedSchoolAsync`, `EnsureGradeLevelAsync`, `SeedSchoolGradeLevelsAsync`) kullanılır; ancak bu test gerçek `Person` satırları gerektirdiği için şubeye öğrenci atarken kullanılan `StudentId`'ler seed edilmiş Person Id'leriyle eşleşmeli. Yeni bir yardımcı ekle ve testi yaz:

```csharp
    /// <summary>
    /// Verilen lifecycle state ile bir Person (öğrenci) seed eder ve Id'sini döner.
    /// Pasif-öğrenci sayımının Person.LifecycleState'e bağlı olduğunu test etmek için.
    /// </summary>
    private async Task<Guid> SeedPersonAsync(Guid schoolId, PersonLifecycleState state)
    {
        await using var ctx = _fixture.CreateDbContext(schoolId);
        var person = Person.Create(schoolId, PersonName.Create("Ad", "Soyad"));
        // Create → Draft. Active'e geçiş parametresiz Activate(); Suspend yalnız reason alır.
        if (state == PersonLifecycleState.Suspended)
        {
            person.Activate();
            person.Suspend("test");
        }
        else if (state == PersonLifecycleState.Active)
        {
            person.Activate();
        }
        ctx.Persons.Add(person);
        await ctx.SaveChangesAsync();
        return person.Id;
    }

    [Fact]
    public async Task Summary_PassiveStudents_CountsNonActivePersonsEnrolledInSourceAsync()
    {
        // Arrange — okul 6, 7, 8 sunuyor; kaynak sezonda 7-A şubesi
        var schoolId = await SeedSchoolAsync();
        var grade6Id = await EnsureGradeLevelAsync("6", 6);
        var grade7Id = await EnsureGradeLevelAsync("7", 7);
        var grade8Id = await EnsureGradeLevelAsync("8", 8);
        await SeedSchoolGradeLevelsAsync(schoolId, [grade6Id, grade7Id, grade8Id]);

        // 7-A'da 3 öğrenci: 1 Suspended (pasif), 2 Active
        var suspendedId = await SeedPersonAsync(schoolId, PersonLifecycleState.Suspended);
        var active1Id = await SeedPersonAsync(schoolId, PersonLifecycleState.Active);
        var active2Id = await SeedPersonAsync(schoolId, PersonLifecycleState.Active);

        var sessionId = await SeedSessionWithEnrolledStudentsAsync(
            schoolId, grade7Id, "7", "A", [suspendedId, active1Id, active2Id]);

        // Act
        await using var db = _fixture.CreateDbContext(schoolId);
        var handler = new GetSeasonRolloverPreviewQueryHandler(db);
        var result = await handler.Handle(new GetSeasonRolloverPreviewQuery(sessionId), CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value!.Summary.PassiveStudents.Should().Be(1, "yalnız Suspended person pasif sayılır");
    }
```

Ayrıca yeni bir seed yardımcısı ekle (mevcut `SeedSessionWithClassRoomsMultiAsync` rastgele StudentId kullanıyor; bu test gerçek person Id'leri atamalı):

```csharp
    private async Task<Guid> SeedSessionWithEnrolledStudentsAsync(
        Guid schoolId, Guid gradeLevelId, string gradeLevelCode, string section, IReadOnlyList<Guid> studentIds)
    {
        await using var db = _fixture.CreateDbContext(schoolId);
        var termTypeIds = await db.AcademicTermTypes.AsNoTracking()
            .OrderBy(t => t.DisplayOrder).Take(2).Select(t => t.Id).ToListAsync();

        var sessionName = $"S-{Guid.NewGuid():N}".Substring(0, 12);
        var session = AcademicSession.Create(
            schoolId, sessionName,
            new DateOnly(2025, 9, 15), new DateOnly(2026, 6, 13),
            termTypeIds[0], new DateOnly(2025, 9, 15), new DateOnly(2026, 1, 23),
            termTypeIds[1], new DateOnly(2026, 2, 10), new DateOnly(2026, 6, 13));
        session.Activate(DateTimeOffset.UtcNow, previousSessionId: null);
        db.AcademicSessions.Add(session);
        await db.SaveChangesAsync();

        var now = DateTimeOffset.UtcNow;
        var classRoom = ClassRoom.Create(schoolId, session.Id, gradeLevelId, gradeLevelCode, section, capacity: 40, requireApproval: false);
        foreach (var sid in studentIds)
        {
            classRoom.AssignStudent(sid, now, AssignmentReason.Initial, null);
        }
        db.ClassRooms.Add(classRoom);
        await db.SaveChangesAsync();
        return session.Id;
    }
```

> Gerekli using'ler: `using Oksis.Domain.Modules.Users.Entities;`, `using Oksis.Domain.Modules.Users.Enums;`, `using Oksis.Domain.Modules.Users.ValueObjects;`. İmzalar (doğrulandı): `Person.Create(Guid schoolId, PersonName name, ...)`, `PersonName.Create("Ad", "Soyad")`, `Activate()` (parametresiz), `Suspend(string reason)`. Amaç: 1 non-Active + 2 Active person, hepsi kaynak şubeye aktif kayıtlı.

- [ ] **Step 2: Testi çalıştır — derleme/assert FAIL doğrula**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SeasonRolloverPreviewTests"`
Expected: Derleme hatası (`PassiveStudents` yok) veya assert FAIL.

- [ ] **Step 3: DTO'ya PassiveStudents ekle**

`SeasonRolloverPreviewDto.cs`:
```csharp
/// <summary>Rollover önizlemesinin özet istatistikleri.</summary>
public sealed record SeasonRolloverSummaryDto(
    int PromotedBranches,
    int GraduatingStudents,
    int NewBottomBranches,
    int PassiveStudents);
```

- [ ] **Step 4: Calculator'da pasif sayımı hesapla**

`SeasonRolloverMapCalculator.cs` — dosya başına `using Oksis.Domain.Modules.Users.Enums;` ekle. `summary` oluşturulmadan hemen önce pasif sorgu, ve `summary`'ye alanı geçir:
```csharp
        // 3c. Pasif öğrenci sayımı: kaynak sezonda aktif-kayıtlı (LeftAt == null) ama
        // Person.LifecycleState != Active olanlar. PromoteStudentsCommandHandler'ın
        // ExcludePassive skip tanımıyla birebir (gerçek rollover'da bunlar taşınmaz).
        var passiveStudents = await db.ClassRooms
            .AsNoTracking()
            .Where(c => c.AcademicSessionId == sourceSessionId && c.Status == ClassRoomStatus.Active)
            .SelectMany(c => c.Students)
            .Where(s => s.LeftAt == null)
            .Join(
                db.Persons.AsNoTracking().Where(p => p.LifecycleState != PersonLifecycleState.Active),
                s => s.StudentId,
                p => p.Id,
                (s, p) => s.StudentId)
            .Distinct()
            .CountAsync(cancellationToken);

        // 4. Özet istatistikler
        var summary = new SeasonRolloverSummaryDto(
            PromotedBranches: rows.Count(r => r.Kind == "Promote"),
            GraduatingStudents: rows.Where(r => r.Kind == "Graduate").Sum(r => r.StudentCount),
            NewBottomBranches: rows.Count(r => r.Kind == "NewBranch"),
            PassiveStudents: passiveStudents);
```

- [ ] **Step 5: Mevcut iki teste PassiveStudents == 0 assert ekle**

`Rows_MapToCorrectKind_ForPromoteGraduateAsync` ve `Rows_EntryGrade_PromotesExistingAndEmitsEmptyNewBranchAsync` sonuna:
```csharp
        result.Value!.Summary.PassiveStudents.Should().Be(0, "seed'de Person yok → pasif eşleşmez");
```

- [ ] **Step 6: Tüm rollover testlerini çalıştır — PASS**

Run: `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SeasonRolloverPreviewTests"`
Expected: PASS (3 mevcut + 1 yeni = 4).

- [ ] **Step 7: format + commit**

```bash
cd oksis-api && dotnet format
git add src/Oksis.Application/Modules/AcademicSessions/DTOs/SeasonRolloverPreviewDto.cs \
        src/Oksis.Application/Modules/AcademicSessions/Shared/SeasonRolloverMapCalculator.cs \
        tests/Oksis.Infrastructure.IntegrationTests/Persistence/SeasonRolloverPreviewTests.cs
git commit -m "2026-06-10 feat,test: Rollover preview özetine pasif öğrenci sayısı eklendi.

PromoteStudents ExcludePassive tanımıyla birebir: kaynak sezonda aktif-kayıtlı
ama Person.LifecycleState != Active olan öğrenciler sayılır.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Frontend — tip güncelleme

**Files:**
- Modify: `oksis-web/src/portals/admin/academic-sessions/types/index.ts:136-140`

- [ ] **Step 1: SeasonRolloverSummaryDto'ya passiveStudents ekle**

```ts
export interface SeasonRolloverSummaryDto {
  promotedBranches: number;
  graduatingStudents: number;
  newBottomBranches: number;
  passiveStudents: number;
}
```

- [ ] **Step 2: Build doğrula**

Run: `cd oksis-web && npm run build`
Expected: PASS (tip kullanımı henüz değişmedi; kırılma yok).

- [ ] **Step 3: commit**

```bash
cd oksis-web && git add src/portals/admin/academic-sessions/types/index.ts
git commit -m "2026-06-10 feat: Rollover preview tipine passiveStudents alanı eklendi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Frontend — StepStudents gerçek veriye bağlanır, DebtBadge/mock kaldırılır

**Files:**
- Modify: `oksis-web/src/portals/admin/academic-sessions/components/wizard/steps/StepStudents.tsx`
- Test: `oksis-web/src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepStudents.test.tsx` (yeni)

- [ ] **Step 1: Failing test yaz**

`StepHolidays.test.tsx` ve `StepTerms.test.tsx` pattern'ini izle (FormProvider + QueryClient + MSW + authStore). Yeni `StepStudents.test.tsx`:

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../../../../../../shared/i18n';
import { server } from '../../../../../../../test/mswServer';
import { useAuthStore } from '../../../../../../../shared/store/authStore';
import { UserRole } from '../../../../../../../modules/identity/types/user.types';
import { ADMIN_PERMISSIONS } from '../../../../../../../test/authFixtures';
import { StepStudents } from '../StepStudents';
import type { SeasonWizardForm } from '../../../../schemas/seasonWizardSchema';

beforeEach(() => {
  useAuthStore.setState({
    user: { id: 'u1', schoolId: 'school-1', firstName: 'T', lastName: 'U', email: 'a@b.c',
      role: UserRole.SchoolAdmin, firstLoginRequired: false, permissions: ADMIN_PERMISSIONS },
    accessToken: 'jwt', firstLoginRequired: false,
  });
});

function Harness({ sourceSessionId = 's1' }: { sourceSessionId?: string } = {}) {
  const methods = useForm<SeasonWizardForm>({
    defaultValues: {
      name: '2026-2027', sourceSessionId,
      copy: { terms: true, branches: true, holidays: true, assignments: true, schedule: true },
      excludePassiveStudents: true, sessionStart: '', sessionEnd: '',
      terms: { t1Start: '', t1End: '', t2Start: '', t2End: '', breakStart: '', breakEnd: '' },
      branchMap: [], holidays: [],
    },
  });
  return <FormProvider {...methods}><StepStudents /></FormProvider>;
}

function renderStep(props?: { sourceSessionId?: string }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}><Harness {...props} /></QueryClientProvider>);
}

describe('<StepStudents />', () => {
  it('renders real counts from rollover preview and no debt badge', async () => {
    server.use(http.get('*/academic-sessions/s1/rollover-preview', () => HttpResponse.json({ data: {
      rows: [
        { sourceClassRoomId: 'c1', fromLabel: '6-A', studentCount: 20, toGradeLevelId: 'g7', toSection: 'A', kind: 'Promote' },
        { sourceClassRoomId: 'c2', fromLabel: '7-A', studentCount: 18, toGradeLevelId: 'g8', toSection: 'A', kind: 'Promote' },
        { sourceClassRoomId: 'c3', fromLabel: '8-A', studentCount: 12, toGradeLevelId: null, toSection: null, kind: 'Graduate' },
      ],
      summary: { promotedBranches: 2, graduatingStudents: 12, newBottomBranches: 0, passiveStudents: 3 },
    } })));
    const { findByText, queryByText } = renderStep();
    // promote = 20 + 18 = 38
    expect(await findByText(/38 öğrenci bir üst sınıfa/)).toBeInTheDocument();
    // passive = 3
    expect(await findByText(/3 pasif kayıt/)).toBeInTheDocument();
    // active total = 38 + 12 = 50 (warning içinde)
    await waitFor(() => expect(queryByText(/50 aktif öğrenci/)).toBeInTheDocument());
    // DebtBadge gerekçesi görünmez
    expect(queryByText(/canlı öğrenci aggregate/i)).not.toBeInTheDocument();
  });

  it('shows zeros without crashing when there is no source session', async () => {
    const { findByText } = renderStep({ sourceSessionId: '' });
    expect(await findByText(/0 öğrenci bir üst sınıfa/)).toBeInTheDocument();
  });
});
```

> MSW endpoint yolunu doğrula: `seasonDraftApi.rolloverPreview` gerçek URL'i neyse (`/academic-sessions/{id}/rollover-preview` beklenir) MSW matcher'ı ona göre `*/...rollover-preview` yap. `useRolloverPreviewQuery`'nin `enabled` koşulunu kontrol et: boş `sourceSessionId`'de query çağrılmamalı (zaten öyle olmalı).

- [ ] **Step 2: Testi çalıştır — FAIL**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepStudents.test.tsx`
Expected: FAIL (mock sayılar 1193/16 render ediliyor; DebtBadge metni var).

- [ ] **Step 3: StepStudents'i gerçek veriye bağla**

`StepStudents.tsx`'i şu hale getir (mock sabitler + `DebtBadge` import/kullanımı silinir):

```tsx
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, UserCheck, UserX, Users } from 'lucide-react';
import { WizSwitch } from '../WizSwitch';
import { useRolloverPreviewQuery } from '../../../hooks/useSeasonWizard';
import type { SeasonWizardForm } from '../../../schemas/seasonWizardSchema';

function iconBox(on: boolean) {
  return [
    'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] transition-colors',
    on ? 'bg-white text-[#1B2B5E]' : 'bg-[#EEF1FA] text-[#6B7280]',
  ].join(' ');
}

function rowBox(on: boolean) {
  return [
    'flex items-center gap-3 rounded-[13px] border-[1.5px] px-4 py-3',
    on ? 'border-[#1B2B5E]/30 bg-[#EEF1FA]' : 'border-gray-200',
  ].join(' ');
}

export function StepStudents() {
  const { t } = useTranslation('academic-sessions');
  const { control, watch } = useFormContext<SeasonWizardForm>();
  const sourceSessionId = watch('sourceSessionId');
  const { data: preview } = useRolloverPreviewQuery(sourceSessionId);

  const rows = preview?.rows ?? [];
  const promoteCount = rows
    .filter((r) => r.kind === 'Promote')
    .reduce((sum, r) => sum + r.studentCount, 0);
  const graduating = preview?.summary.graduatingStudents ?? 0;
  const activeTotal = promoteCount + graduating;
  const passiveCount = preview?.summary.passiveStudents ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 rounded-lg bg-[#FEF3C7] px-4 py-3 text-sm text-[#B05A0A]">
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span>{t('wizard.steps.students.warning', { active: activeTotal, graduating })}</span>
      </div>

      {/* Aktif öğrencileri terfi ettir — salt-okunur (her zaman AÇIK) */}
      <div className={rowBox(true)}>
        <span className={iconBox(true)}><UserCheck size={19} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-800">{t('wizard.steps.students.promote-title')}</div>
          <div className="text-xs text-gray-500">
            {t('wizard.steps.students.promote-desc', { count: promoteCount })}
          </div>
        </div>
        <WizSwitch checked onChange={() => {}} disabled />
      </div>

      <Controller
        control={control}
        name="excludePassiveStudents"
        render={({ field }) => (
          <div className={rowBox(field.value)}>
            <span className={iconBox(field.value)}><UserX size={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-800">{t('wizard.steps.students.exclude-passive-title')}</div>
              <div className="text-xs text-gray-500">
                {t('wizard.steps.students.exclude-passive-desc', { count: passiveCount })}
              </div>
            </div>
            <WizSwitch checked={field.value} onChange={field.onChange} />
          </div>
        )}
      />

      <Controller
        control={control}
        name="copy.assignments"
        render={({ field }) => (
          <div className={rowBox(field.value)}>
            <span className={iconBox(field.value)}><Users size={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-800">{t('wizard.steps.students.copy-assignments-title')}</div>
              <div className="text-xs text-gray-500">{t('wizard.steps.students.copy-assignments-desc')}</div>
            </div>
            <WizSwitch checked={field.value} onChange={field.onChange} />
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 4: Testi çalıştır — PASS**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepStudents.test.tsx`
Expected: PASS (2/2).

- [ ] **Step 5: Tüm academic-sessions testleri + build**

Run: `cd oksis-web && npm run test -- src/portals/admin/academic-sessions && npm run build`
Expected: PASS, build temiz.

- [ ] **Step 6: commit**

```bash
cd oksis-web && git add src/portals/admin/academic-sessions/components/wizard/steps/StepStudents.tsx \
        src/portals/admin/academic-sessions/components/wizard/steps/__tests__/StepStudents.test.tsx
git commit -m "2026-06-10 feat,test: Step 5 Öğrenci Geçişi gerçek veriye bağlandı, DebtBadge/mock kaldırıldı.

active/promote rollover preview satırlarından türetilir; passive summary'den okunur.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: i18n — counts-debt-reason temizliği (opsiyonel anahtar)

**Files:**
- Modify: `oksis-web/src/shared/i18n/locales/tr/academic-sessions.json`
- Modify: `oksis-web/src/shared/i18n/locales/en/academic-sessions.json`

- [ ] **Step 1: counts-debt-reason anahtarını kaldır**

Her iki dosyada `wizard.steps.students.counts-debt-reason` anahtarını sil (artık kullanılmıyor). Diğer `students` anahtarları (`warning`, `promote-desc`, `exclude-passive-desc` vb.) **korunur**.

- [ ] **Step 2: Build + test doğrula**

Run: `cd oksis-web && npm run build && npm run test -- src/portals/admin/academic-sessions`
Expected: PASS (kullanılmayan anahtar silindi, kırılma yok).

- [ ] **Step 3: commit**

```bash
cd oksis-web && git add src/shared/i18n/locales/tr/academic-sessions.json src/shared/i18n/locales/en/academic-sessions.json
git commit -m "2026-06-10 chore: Kullanılmayan students.counts-debt-reason i18n anahtarı kaldırıldı.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Dokümantasyon

**Files:**
- Modify: `oksis/.claude/docs/modules/academic-years/api-contracts.md`
- Modify: `oksis/.claude/docs/modules/academic-years/completion_status.md`

- [ ] **Step 1: api-contracts.md güncelle**

Rollover-preview endpoint yanıtının `summary` bölümüne `passiveStudents: number` alanını ekle (kaynak sezonda aktif-kayıtlı ∩ non-Active person sayısı; `PromoteStudents` ExcludePassive ile birebir).

- [ ] **Step 2: completion_status.md güncelle**

`Güncel` tarihini 2026-06-10 yap; çözülen borç olarak bir satır ekle:
"Step 5 Öğrenci Geçişi mock/DebtBadge borcu kapatıldı — active/promote rollover preview'den türetildi, summary'ye passiveStudents eklendi." (Spec dışı değil; ⚠️ bölümüne yazılmaz.)

- [ ] **Step 3: commit**

```bash
cd /Users/farukkaya/Projects/oksis && git add .claude/docs/modules/academic-years/api-contracts.md .claude/docs/modules/academic-years/completion_status.md
git commit -m "2026-06-10 docs: Step 5 borç kapatma — rollover preview passiveStudents dokümante edildi.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final Verification

Tüm tasklar sonrası:
- `cd oksis-api && dotnet test tests/Oksis.Infrastructure.IntegrationTests --filter "FullyQualifiedName~SeasonRolloverPreview"` → PASS
- `cd oksis-web && npm run test -- src/portals/admin/academic-sessions && npm run build` → PASS
- Tarayıcıda Step 5: gerçek sayılar, DebtBadge yok.
