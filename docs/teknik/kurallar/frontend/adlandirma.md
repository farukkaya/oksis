# Frontend Adlandırma Kuralları

> [!info] Belge bilgisi
> **Amaç:** `oksis-ui` içindeki dosya, bileşen, hook, tip, şema, sabit, rota ve query key adlandırmasını tanımlamak.
> **Son doğrulama:** 2026-09-13. `oksis-ui` master `ec9ea8c`.
> **Kaynak:** `oksis-ui/CLAUDE.md` (Naming, MEB Terminology Glossary), `packages/api/src/client/query-keys.ts`, gerçek dosya adları.

İlgili notlar: [[mimari-ve-katmanlar]] · [[formlar-ve-dogrulama]] · Alan kavramları: [[_indeks]] (`docs/domain/`)

---

## 1. Temel ilke

- **Tanımlayıcılar tamamen İngilizcedir.** Tanımlayıcıda Türkçe kelime kullanılmaz.
- **Her alan kavramının tam olarak bir İngilizce karşılığı vardır.** Eş anlamlı uydurulmaz.
- Yeni bir kavram çıktığında **önce sözlüğe eklenir, sonra kodlanır.**
- Sözlük bugün `oksis-ui/CLAUDE.md` § MEB Terminology Glossary içindedir. Alan kavramlarının anlamı ve gerekçesi `docs/domain/` notlarının işidir; burada tekrarlanmaz.
- Arayüz metinleri ve kod yorumları Türkçedir.

## 2. Biçim tablosu

| Tür | Kural | Örnek |
|---|---|---|
| Dosya / klasör | kebab-case | `academic-year-form-dialog.tsx`, `session-roster-page.tsx` |
| Feature klasörü | Sözlükteki tanımlayıcının kebab-case hâli | `features/teacher-assignments/`, `features/roll-call/` |
| Bileşen | PascalCase, `[Alan][Tür]` | `AttendanceStatusChip`, `SessionRosterPage` |
| Hook | `useX` | `useAcademicYears`, `useGradeEntryWriter` |
| Fonksiyon | camelCase, fiille başlar | `getSections`, `createTeacherAssignment` |
| CRUD fiilleri | Sabit set | `get` / `create` / `update` / `delete` |
| Olay işleyici | Bileşen içinde `handleX`, prop olarak `onX` | `handleSubmit` / `onSubmit` |
| Boolean | `is` / `has` / `can` / `should` | `isLoading`, `canEdit` |
| Tip / arayüz | PascalCase, **`I` öneki yok** | `AcademicYear`, `SectionFormProps` |
| Sabit | SCREAMING_SNAKE_CASE | `MAX_WEEKLY_HOURS`, `ATTENDANCE_STATUS_CONFIG` |
| Zod şeması / çıkarılan tip | `xSchema` / `XValues` | `sectionFormSchema` / `SectionFormValues` |
| Tel DTO tipi | Üretilen şemadaki adla aynı | `AssessmentDto` (`components["schemas"]["AssessmentDto"]`) |
| Rota (URL) | kebab-case, ASCII | `/academic-sessions`, `/teacher-assignments`, `/roll-call` |
| CSS dosyası (feature) | Feature adı | `packages/ui/src/styles/attendance.css` |
| Query key segmenti | kebab-case string, `qk.<alanCamel>.<ad>()` | `qk.teacherAssignments.byCourse(...)` → `["teacher-assignments", "by-course", …]` |
| Dal adı | `feature/`, `fix/`, `chore/` + kebab açıklama | `feature/exam-session-client` |

## 3. Sözlükle ilgili tuzaklar (yalnız adlandırma açısından)

Ayrıntı ve gerekçe alan notlarındadır. Burada yalnız kodda en çok karışan tanımlayıcılar listelenir:

- `assignment` tek başına kullanılmaz. Ders görevlendirmesi `teacherAssignment`, ödev `homework`'tür.
- `academicYear` eski ve yasaklı bir tanımlayıcıdır. Sezon için `academicSession` (rota `/academic-sessions`, id `sessionId`) kullanılır.
- Branş `subjectArea`'dır; "branch" denmez.
- `examSchedule` ile `academicCalendar` farklı kavramlardır.
- `activityHandover` ile `duty` farklı kavramlardır.

## 4. Mevcut istisnalar

Aşağıdakiler kodda var ama **kalıp değildir**; yeni kodda örnek alınmaz:

- Türkçe dosya adları: `features/attendance/karne-tab.tsx`, `karne-day-sheet.tsx`, `packages/ui/src/styles/veliler.css`.
- Türkçe key segmenti: `qk.academicStructure.kademe()`.

## 5. Eski belgelerden alınmayanlar

- **"`Mark` = not (sayı), `Grade` = sınıf seviyesi"** (eski kök `CLAUDE.md`, emekli üç repolu düzen). Bugünkü sözlükte not `grade` (rota `/grades`), sınıf seviyesi `gradeLevel`'dır. Eski eşleme `oksis-ui` için geçersizdir.
