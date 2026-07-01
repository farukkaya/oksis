# Session — 2026-07-01 · Öğrenci Numarası Format + Önek Onay/Kilit/Önizleme

## Goal
Close the deferred student-number debt (spec E4.4/E2.3): make the number school-configurable,
yearless, import-ready; then (per user requirements added mid-session) add a prefix consent gate
with an auditable consent record, a prefix-in-use lock, and a live number preview.
Binding mini-spec: `.claude/specs/ogrenci-numarasi-format-design.md` (supersedes umbrella spec E4.4.1).

## Workflow
brainstorming (one-question-at-a-time design) → design doc → writing-plans → subagent-driven-development
(implementer + spec/quality reviewer per slice; two opus whole-branch final reviews) → Chrome E2E →
finishing (push + PRs). Progress ledger: `oksis-api/.superpowers/sdd/progress.md`.

## Locked design decisions
- **Format:** no year prefix ever. Default (unset) = numeric, min 3 digits, starts at 100, grows after 999
  (length = minimum width). Prefix + length are optional `SchoolSettings` fields.
- **Counter:** per-school lifetime monotonic sequence (year column dropped), never reuses. Existing numbers
  immutable (mixed old-format `2026xxxxx` + new `100…` accepted).
- **Uniqueness: global** `(SchoolId, StudentNumber)` (kept). Validation = format + global uniqueness.
- **Login: school-aware** resolver — prefixed input resolves directly to student-number (prefix branch before
  shape detection). R3: prefixless length ≤ 9 (avoid phone 10-13 collision at login).
- **Prefix safety (user, Option A):** a prefix is freely settable UNTIL a student number uses it; once in use
  it's LOCKED (change/clear → 409). Adding a prefix always allowed; length never locked; no retroactive renumber.
- **Consent gate (user):** setting a new/changed prefix requires an ack (server-enforced) + writes an
  immutable audit record with the VERBATIM consent text (BE-authoritative), consenting user, UTC timestamp,
  version — legal "koz". Cancel reverts only the prefix field.
- **Live preview (user):** prominent chip below the fields, `prefix + String(100).padStart(length ?? 3)`.

## Delivered (branch `student-no-format`, both repos → PRs oksis-api#30, oksis-web#61, base master)

### Backend (oksis-api, HEAD ddf3b48)
- `SchoolSettings.StudentNumberLength` nullable + migration (existing rows → null).
- `StudentNumberGenerator.NextAsync(schoolId, ct)` — yearless, consumes settings, per-school counter from 100;
  `student_number_counters` re-keyed by school_id.
- `IStudentNumberValidator` (format + global uniqueness). `EnrollStudentCommand.StudentNumber?` optional manual.
- `IdentifierResolver` school-aware prefix branch (pre-auth `IgnoreQueryFilters`, single-tenant, BR-identity-001).
- R3: prefixless length ≤ 9 (validator, `IsNullOrWhiteSpace` — whitespace-prefix included after final-review fix).
- Clear-fix: prefix/length direct-assign (clearable). Prefix-in-use lock (409 `prefix-in-use`). Consent gate
  (400 `prefix-consent-required`) + `StudentNumberPrefixConsent` audit entity/table written atomically.

### Frontend (oksis-web, HEAD 2af74d8)
- StructureTab: editable prefix/length (pass-through bug fixed, types `number|null`), live prominent preview
  chip, consent modal (settings `.set-new` modal classes — avoids the 3B invisible-modal bug) with a mandatory
  checkbox, cancel reverts only the prefix field, 409 lock error toast. Enroll wizard optional "Öğrenci No"
  field + `enrollErrorText` helper.

### Docs (workspace master, pushed)
- E4.4.1 amendment; BR-students-005; BR-SS-017 (+ consent/lock/preview); identity docs (school-aware resolver);
  `student_number_prefix_consents` schema; completion_status updates + öğrenci-no debt marked RESOLVED.

## Final reviews (opus) + fixes
- **API GO-WITH-FIXES:** audit integrity confirmed holistically (BE-authoritative text, real ConsentedBy, UTC
  clock, atomic, immutable, no bypass; lock-before-consent). 1 Important: whitespace-only prefix defeated R3 →
  fixed (ddf3b48, validator `IsNullOrWhiteSpace`).
- **WEB GO-WITH-FIXES:** consent text byte-matches BE, checkbox gate + modal CSS correct. 1 spec-wording: cancel
  didn't revert → user chose revert-prefix-field-only → fixed (2af74d8).
- Earlier, the clear-persistence bug (couldn't remove a set prefix; `?? coalescing`) was found in E2E and fixed
  (§4.1 amended + direct-assign).

## Chrome E2E (Atlas Lisesi, live) — PASSED
- Default enroll → `101`; prefix ATL set (via consent modal) → new enroll `ATL0100`; manual number; existing
  181 `2026xxxxx` numbers unchanged (immutability).
- Live preview updates on keystroke (`100` → `ATL0100`). Consent modal renders centered + scrim (no 3B bug),
  text byte-matches BE, confirm disabled until checkbox. Consent audit row written (prefix/user/UTC/verbatim
  text). Clearing the in-use ATL prefix → PUT 409, DB preserved ATL.

## Notes
- Dev DB left with Atlas prefix=ATL/4, students Deniz=ATL0100 + Ece=101, one consent audit row, season.renewal.open
  granted to SCHOOL_ADMIN (from the earlier 3B demo). Dev servers running on `student-no-format` (api :5112, web :5173).
- Deferred minors (logged): whitespace-only input onChange (BE normalizes safely), stale-baseline re-consent quirk,
  consent-text parity has no cross-repo automated guard, orphaned `academicStructure.schema.ts`, StructureTab
  inline-Turkish (module convention).

## State at session end
- PRs open: oksis-api#30, oksis-web#61 (base master). Docs on master. Branches: api ddf3b48, web 2af74d8.
