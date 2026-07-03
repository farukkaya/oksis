# Session: Students List Empty — Dev Seed Chain Fix (2026-07-03)

## Problem

User reported the `/admin/students` list showing "Kayıt bulunamadı" while the KPI
cards showed 60 students. Stats come from the Person-based endpoint
(`/users/persons/student-stats`); the list (Faz 2A decision) reads season-scoped
`StudentEnrollments` — and that table had **zero rows**.

## Root Cause

Broken link in the dev seed chain:

1. `DevDataSeeder` inserts dev schools via **raw ADO.NET SQL** (intentional, to
   bypass the tenant filter) → `SchoolCreatedEvent` never fires.
2. Grade levels are seeded by the event handler `SeedSchoolGradeLevelsHandler`
   (SchoolType → grade codes) → never runs for dev schools →
   `school.school_grade_levels` empty for all 3 dev schools.
3. `ClassRoomDevSeeder` skips schools without grade levels ("okul türü
   seçilmemiş?") → 0 classrooms, 0 assignments.
4. Enrollment backfill only enrolls students with `CurrentClassroomId != null`
   → 0 enrollments → enrollment-based list is empty; Person-based stats show 60.

## Fix (oksis-api, TDD)

- `SeedSchoolGradeLevelsHandler`: seed core extracted to public static
  `SeedForSchoolAsync(db, schoolId, ct)` (returns added count); the event handler
  delegates to it — single source of truth for the SchoolType→grade mapping.
- `ClassRoomDevSeeder`: when a school has no active grade levels, it now seeds
  them from `SchoolSettings.SchoolTypes` via the shared method (idempotent), then
  continues the chain (classrooms → assignments → enrollment backfill).
- New integration test `ClassRoomDevSeederTests` (RED verified first: 0 grade
  levels; GREEN after fix: 4 grade levels, 8 classrooms, 3 enrollments Active).

## Verification

- Full backend suite: 1801 unit + 353 integration green. The single failing test
  (`PersonDirectoryChildrenIntegrationTests`, FK `fk_class_rooms_sessions`) also
  fails on a clean tree — pre-existing, unrelated (likely test isolation).
- API restarted: seeder produced 4 grade levels + 8 classrooms + 60 assignments +
  60 enrollments per school (all 3 dev schools).
- Chrome check: list now renders "1–8 / 60 öğrenci" with classes, guardians,
  Aktif statuses, 5-page pagination.

## Open Items

- Pre-existing flaky/broken `PersonDirectoryChildrenIntegrationTests` FK failure
  worth a separate look (test isolation on shared fixture DB).
