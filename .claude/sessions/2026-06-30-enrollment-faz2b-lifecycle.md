# 2026-06-30 — Student Enrollment Faz 2B: Lifecycle Commands

## What Was Built

### Backend (5 Lifecycle Commands)

Five coordinated lifecycle commands were implemented on `StudentEnrollment`, all under the same `students.manage` permission. Each command resolves the enrollment for the student's `PersonId` in the **current** (`IsCurrent`) academic session before executing.

| Command | Route | Body | Enrollment Status | Person LifecycleState | ClassRoomStudent |
|---|---|---|---|---|---|
| `FreezeEnrollmentCommand` | `POST /{id}:freeze` | `{ reason }` (required) | Active → Frozen | Active → Suspended | Kept open |
| `ResumeEnrollmentCommand` | `POST /{id}:resume` | none | Frozen → Active | Suspended → Active | Kept |
| `WithdrawStudentCommand` | `POST /{id}:withdraw` | `{ reason }` (required) | Active → Withdrawn | Active → Suspended | Closed; `CurrentClassroomId → null`; `IsActiveStudent=false` |
| `TransferOutStudentCommand` | `POST /{id}:transfer-out` | `{ targetSchoolId?, reason? }` | Active → TransferredOut | Active → Transferred | Closed; `CurrentClassroomId → null` |
| `GraduateStudentCommand` | `POST /{id}:graduate` | none | Active → Graduated | Active → Graduated | Closed; `CurrentClassroomId → null` |

All return `204 No Content` on success. Error responses:
- `403` — no tenant claim or missing `students.manage` permission
- `404` — student not found, or no current-session enrollment
- `409 Conflict` — invalid state transition (`students.errors.invalid-lifecycle-transition`)

### Two-Axis Guard

Every command handler validates **both** `enrollment.Status` and `person.LifecycleState` before mutating. This prevents a legacy person-endpoint divergence from throwing a 500 — divergent state surfaces as 409 instead.

### Domain Changes

- `Person.Transfer(Guid?)` made nullable: `null` means external/outside-OKSİS transfer (no `targetSchoolId` in system).
- `AssignmentReason` enum gained two new values: `Withdrawal` and `TransferOut`. These are used when closing the classroom seat (`ClassRoomStudent`) in the respective commands.

### Frontend

- The 5 row-action items (`Dondur`, `Yeniden Etkinleştir`, `Pasife Al`, `Nakil Çıkışı`, `Mezun Et`) were enabled — previously disabled with `notReadyHint="2B"`.
- **Permission bug fixed:** the prior gate used `students.delete` (a permission that does not exist in the students module). Corrected to `students.manage`.
- A shared `LifecycleActionDialog` component was introduced to collect input before each action:
  - Freeze and Withdraw: required `reason` field.
  - Transfer-Out: optional `targetSchoolId` + optional `reason`.
  - Resume and Graduate: no input needed (confirmation only).
- "Pasife al" maps to the Withdraw action.

## Key Decisions

1. **Frozen → terminal is blocked by entity guard.** A Frozen enrollment cannot be directly Withdrawn, TransferredOut, or Graduated. The user must Resume first. This is intentional — freeze is a reversible pause; terminal transitions require an explicit Active state first.
2. **`targetSchoolId = null` is valid** for transfer-out when the destination school is outside OKSİS (external transfer). `Person.Transfer(Guid?)` was made nullable to support this.
3. **Two-axis validation before mutation** was chosen over single-axis (enrollment only) to guard against state divergence from the legacy `/users/persons/*` endpoints.

## Deferred / Debt (user-approved 2026-06-30)

1. **ArchiveEnrollment command/endpoint/button** — terminal (Withdrawn / TransferredOut / Graduated) → Archived transition. No command, no UI. Deferred as separate work.
2. **Lifecycle domain events + guardian notifications** — no `StudentFrozenEvent`, `StudentWithdrawnEvent`, etc. published. Notification/outbox wiring is separate work.

## Files Changed

- `oksis-api`: FreezeEnrollmentCommand, ResumeEnrollmentCommand, WithdrawStudentCommand, TransferOutStudentCommand, GraduateStudentCommand (Application/Modules/Students/Commands); domain changes in `Person.cs` + `AssignmentReason.cs`; StudentsController 5 new action methods.
- `oksis-web`: `studentsApi.ts` +5 mutation functions; `useLifecycleMutation` hooks; `LifecycleActionDialog` component; row-action wiring in students list/drawer; permission gate corrected to `students.manage`.
