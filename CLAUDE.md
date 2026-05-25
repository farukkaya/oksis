# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This directory is **not** a single repo — it's a workspace containing three **independent git repos** as siblings (plus the workspace itself, which is its own repo holding shared docs):

```
oksis/                 workspace root (own git repo — holds canonical docs in .claude/docs/)
├── oksis-api/         .NET 10 backend (Clean Architecture + CQRS, SQL Server, EF Core 10)
├── oksis-web/         React + Vite + TypeScript (admin/teacher/parent/student portals)
├── oksis-mobile/      React Native + Expo SDK 54 (teacher/parent/student roles)
└── docx-builder/      local utility for generating internal docs (not shipped)
```

Each subproject has its **own** `CLAUDE.md`. When the user works on a specific tier, **read that subproject's CLAUDE.md first** for tier-specific commands/bans — then defer to the workspace docs for cross-tier rules.

The canonical rule docs (architecture, multi-tenant, security, permissions, notifications, naming, MVP scope, testing, code review, all backend/frontend/mobile coding standards, plus per-module docs and skills) live at **workspace root: `.claude/docs/`**. All three subproject `CLAUDE.md` files reference these via `../oksis/.claude/docs/`. Claude Code auto-loads this root `CLAUDE.md` when working in any subproject, so the cross-tier rules apply automatically.

## Product Context

**OKSİS** = multi-tenant SaaS school management system for Turkish private schools. Row-level isolation by `SchoolId`. UI language is **Turkish** (i18n keys, never hardcoded). Domain model and commit messages are in Turkish; code identifiers in English.

## Absolute Rules (apply to every tier)

These are non-negotiable across api/web/mobile. Full details in `.claude/docs/` at workspace root.

1. **Multi-tenant isolation is never bypassed.** Every query, cache key, queue job, SignalR group, file path, and log line is tenant-scoped via `SchoolId`. EF Core global query filter + `SaveChangesInterceptor` enforce on the server; React Query keys must carry the tenant prefix on the client (`shared/config/tenant.ts → tenantScopedKey` in mobile). See `multi-tenant-rules.md`.
2. **Domain naming is fixed.** `Mark` = grade/score (the number), `Grade` = year level (5th grade). Don't conflate. See `naming-conventions.md`.
3. **MVP scope is enforced.** Before adding any feature, check `mvp-scope-rules.md`. Run the `mvp-guard` skill if uncertain.
4. **Security**: JWT (RS256, 15 min) + rotating refresh tokens, RBAC + permission matrix, IDOR protection. Permission checks server-side always; UI permission gates are UX only. See `security-rules.md` and `permission-matrix.md`.
5. **Commits use the OKSİS custom format** (Turkish, ISO date prefix): `YYYY-MM-DD <type>[,type]: Türkçe özet.` Example: `2025-11-15 feat,test: Yoklama eşik bildirimi düzeltildi ve regression testi eklendi.` Issue-linked commits prefix `Issue #<no> `. The husky `commit-msg` hook (`oksis-api`) enforces this. See `git-commit-rules.md`.

## Commands per Subproject

### oksis-api (.NET 10)

Working dir: `oksis-api/`. Solution: `Oksis.slnx`. Projects under `src/` (Api, Application, Domain, Infrastructure, Shared) and `tests/` (Api.UnitTests, Application.UnitTests, Domain.UnitTests, Infrastructure.IntegrationTests, Tests).

```bash
dotnet build                                              # build solution
dotnet run --project src/Oksis.Api                        # start API
dotnet test                                               # run all tests
dotnet test tests/Oksis.Application.UnitTests             # one project
dotnet test --filter "FullyQualifiedName~CreateStudent"   # one test/class
dotnet ef migrations add <YYYYMMDD_name> \
  --project src/Oksis.Infrastructure --startup-project src/Oksis.Api
dotnet ef migrations script <from> <to> -o migration.sql --idempotent   # never auto-migrate in prod
dotnet format                                             # required pre-commit
docker compose up                                         # SQL Server + Redis + Hangfire deps
```

Stack: MediatR, FluentValidation, Mapster (not AutoMapper), Hangfire (SQL Server storage), Redis, SignalR, Serilog → ELK, FCM. Repository pattern is **not** used over EF Core — handlers depend on `IApplicationDbContext` directly.

### oksis-web

Working dir: `oksis-web/`. **Note:** `package.json` started life as a Figma Make import scaffold (`@figma/my-make-file`, Radix + MUI) and the migration to the spec stack is **in progress** — both stacks coexist. Already installed alongside the scaffold: DevExtreme, TanStack React Query, Zustand, RHF + Zod, axios, i18next, dayjs. Spec target (per `.claude/docs/frontend/*`): **DevExtreme (via `OksisDataGrid` wrapper) + Tailwind + React Query + Zustand + RHF/Zod + Axios**. When touching pages that still use Radix/MUI, confirm with the user before rewriting vs. extending.

```bash
npm run dev          # vite dev server
npm run build        # vite build
npm run test         # vitest run
npm run test:watch   # vitest watch
```

### oksis-mobile (Expo SDK 54)

Working dir: `oksis-mobile/`.

```bash
npm run start         # expo start --host lan
npm run android       # expo start --android
npm run ios           # expo start --ios
npm run typecheck     # tsc --noEmit
npm run lint          # eslint src/**/*.{ts,tsx}
npm run format        # prettier --write
npm test              # jest
npm run test:watch    # jest --watch
npm run sync-theme    # copies oksis-web/tailwind.config.js into mobile so design tokens stay in sync
```

Mobile-specific bans: `StyleSheet.create` (use NativeWind `className`), `AsyncStorage` for tokens (use `expo-secure-store`), Expo Router (project uses React Navigation v7), `ScrollView + map` for lists (use `FlatList`/`FlashList`), `react-native` `Image` (use `expo-image`), `any` type.

## Architectural Big Picture

### Backend (`oksis-api`)

Clean Architecture + CQRS (modular monolith, **not** microservices). Dependency direction is strictly inward toward `Oksis.Domain`:

```
Oksis.Api ──► Oksis.Application ──► Oksis.Domain
     │                ▲                  ▲
     └──► Oksis.Infrastructure ──────────┘
```

- `Oksis.Domain`: pure C#. Entities with private setters, value objects, strongly-typed IDs (`record struct StudentId(Guid)`), domain events, no EF Core or DataAnnotations.
- `Oksis.Application`: vertical-sliced under `Modules/<ModuleName>/{Commands,Queries,Dtos,Mapping,Events}`. Only references `Oksis.Domain` — knows EF Core only via `IApplicationDbContext`.
- `Oksis.Infrastructure`: implements Application abstractions (EF Core, Hangfire, Redis, FCM, Email, S3/Blob, Serilog).
- `Oksis.Api`: thin controllers delegate to `ISender.Send(...)`.

**MediatR pipeline order is fixed** (see `architecture-rules.md`): RequestLogging → Validation → TenantContext → Authorization → Transaction (commands only) → Caching (queries marked `[Cacheable]`).

**Tenancy enforcement is layered:**
- `TenantContextBehavior` (pipeline) — rejects requests without tenant claim
- EF Core global query filter on every `IHasTenant` entity
- `TenantSaveChangesInterceptor` — auto-fills `SchoolId` on insert, rejects cross-tenant modification, makes `SchoolId` immutable
- Cache, Hangfire jobs, SignalR groups, S3 paths, Serilog `LogContext` all carry `SchoolId` prefix/property

**Event-driven side effects** use the Outbox pattern: domain events → `SaveChangesInterceptor` writes to `outbox_messages` in the same transaction → Hangfire `OutboxDispatchJob` (every ~30s) drains and dispatches via `INotificationDispatcher` → channel providers (FCM, in-app DB row + SignalR push, email). Recipient resolution is per-event (`INotificationRecipientResolver<TEvent>`). Idempotency is enforced via `notification_delivery_log (outbox_id, user_id, channel)` unique. Quiet hours (22:00–07:00 in school's tz) and cooldown (Redis key with TTL) are applied before dispatch. Critical priority bypasses quiet hours.

### Web (`oksis-web`)

Portal-based routing: `/admin`, `/teacher`, `/parent`, `/student`, `/super`. Each portal has its own layout and role-gated route guard. Domain modules under `src/modules/<x>/` are shared across portals; portal-specific UI lives under `src/portals/<role>/`. Server state lives **only** in React Query (never duplicated to Zustand). Forms = React Hook Form + Zod. URL state (filters, page, sort) = React Router search params. Zustand stores are small and topic-focused (auth, active-child-switcher, sidebar). DataGrid must go through the `OksisDataGrid` wrapper — direct DevExtreme import is banned. Token refresh is a single-flight axios interceptor.

### Mobile (`oksis-mobile`)

Single Expo app, three role-based React Navigation stacks (Teacher / Parent / Student) selected by `useAuthStore.user.role` in `RootNavigator`. Auth stack shown when not signed in. Push notifications via `expo-notifications` with a single `Notifications.setNotificationHandler` call in `src/app/index.tsx`. Refresh token in `expo-secure-store`, access token in-memory only. `tailwind.config.js` is intended to be a copy of the web config — keep them in sync via `npm run sync-theme`.

## Module Documentation System

`.claude/docs/modules/<module>/` (at workspace root) holds 9-file living docs per business module (README, domain-model, api-contracts, database-schema, permissions, notifications, ui-flows, business-rules, open-questions). Current modules: `academic-years`, `announcements`, `attendance`, `classrooms`, `dashboard`, `homework`, `identity`, `marks`, `messaging`, `notifications`, `parents`, `report-cards`, `schools`, `school-settings`, `students`, `subjects`, `teachers`, `timetable`. When the user says "add Y to module X":

1. Resolve module slug from the table in `_MODULE_GUIDE.md` (don't invent names).
2. Pick the right file by category (endpoint → `api-contracts.md`, table → `database-schema.md`, etc.).
3. Write directly, then summarize what changed and any cross-file updates (e.g. new permission also added to `permission-matrix.md`).
4. Update the README metadata block: bump `Last Updated`, tick the `Files` checkbox.

`{{TBD}}` placeholders mean "skeleton, not yet filled." Don't fabricate content — say which fields are still `{{TBD}}`.

## Skills (task-triggered)

Defined under `.claude/docs/skills/` (at workspace root), grouped into `backend/`, `frontend/`, `foundation/`, `product/`. Trigger by task; the rule files list the exact mapping. Examples: `entity-design`, `api-endpoint-generator`, `crud-page-generator`, `form-wizard`, `mvp-guard`, `security-check`, `multi-tenant-guard`. Read the skill file before doing the task it covers.

## Hard Bans (cross-cutting)

- ❌ Bypassing the tenant filter (`IgnoreQueryFilters()` without justification + audit)
- ❌ AutoMapper — use Mapster
- ❌ Repository pattern wrapper on top of EF Core
- ❌ Lazy loading
- ❌ `DbContext` inside controllers (always through MediatR)
- ❌ `async void`, `Task.Result`, `.Wait()`
- ❌ Hardcoded Turkish strings (use i18n keys)
- ❌ Spinner for full-page loading (use skeletons)
- ❌ `"WIP"` / `"update stuff"` commit messages — must follow OKSİS commit format
- ❌ Adding a new library or technology silently — ask first

## When in Doubt

Each subproject's own `CLAUDE.md` and the rules under `.claude/docs/` (workspace root) are the source of truth. If a rule isn't clear from the current code, stop and ask the user rather than guessing — naming, library choice, and folder placement decisions are intentional and documented.
