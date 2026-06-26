# 2026-06-26 — Post-Commit Cache Invalidation ("option C") — Implementation

Closed the long-deferred root cause behind the recurring Redis stale-cache bugs (surfaced
in A1.2 holidays + A1.3 school-settings): **invalidate-before-commit**. Handlers called
`ICacheService.RemoveAsync` BEFORE `TransactionBehavior` committed, so during the commit
window a concurrent GET read the not-yet-committed OLD value and re-cached it (TTL 3600s,
survives restart). ~34 invalidation sites (commands + 4 event handlers) affected.

Flow: brainstorming → design → writing-plans → subagent-driven-development (fresh implementer
+ task reviewer per task, opus final whole-change review).

## Decision history
- Started toward the **explicit** per-handler approach (user's first pick), then user switched
  to the **decorator** approach mid-flow. Design doc updated accordingly.
- Execution: subagent-driven, **NO COMMITS during execution** (user: manual control) — all work
  accumulated in the working tree, reviewed via file-scoped diffs, committed once at the end on a
  branch after user approval.

## What shipped — branch `fix/post-commit-cache-invalidation`, commit `c4d5f74` (oksis-api, NOT merged)
- **Async `IPostCommitDispatcher`**: added `Enqueue(Func<CancellationToken, Task>)` + replaced
  `RunPending()` with `RunPendingAsync(CancellationToken)`; kept sync `Enqueue(Action)` (Hangfire/
  notification enqueuers). Single internal `List<Func<CT,Task>>`; per-action try/catch (best-effort).
- **`TransactionAwareCacheService`** (Infrastructure) decorates `ICacheService`: when
  `db.Database.CurrentTransaction is not null` defers `Remove*` to the dispatcher (flushed post-commit
  by `PostCommitDispatchBehavior`, discarded on rollback); else runs immediately. Get/Set/Exists/
  BuildKey delegate straight to inner. **Zero handler/event-handler changes** — all ~34 sites fixed
  transparently, including the 4 event handlers that invalidate inside `DomainEventInterceptor.
  SavedChangesAsync` (still inside the open transaction).
- **DI**: `ICacheService` wrapped with the decorator in the Redis-connected branch only
  (NullCacheService branches untouched). No DI cycle (OksisDbContext ctor = options + ITenantContext).
- **MUST-FIX from final review**: `PostCommitDispatchBehavior` now flushes with
  `CancellationToken.None` (was the request token). Otherwise a client disconnect after commit would
  cancel the flush, the swallowed `OperationCanceledException` would skip invalidation, and staleness
  would return in a narrow window. Post-commit side effects are must-complete. Locked with a new unit test.

## Tests
- New/updated: `PostCommitDispatcherTests` (4, incl. token propagation), `PostCommitDispatchBehaviorTests`
  (3, incl. cancelled-request → flush with None), `AutoGenerateEnqueuerDeferralTests` (async),
  `TransactionAwareCacheServiceTests` (3, real MSSQL), `PostCommitInvalidationEndToEndTests` (2,
  composes real TransactionBehavior + PostCommitDispatchBehavior + decorator).
- Task-3 review caught a tautological assertion (empty-check before the RemoveAsync call) → fixed to
  assert after the call, inside the handler, so it genuinely proves deferral.
- Build 0W/0E; change-owned tests all green; Application.UnitTests 1188/1188.
- **2 pre-existing unrelated failures** (fail before this branch too, fixture builds DbContext without
  DI so the decorator never applies): `PersonDirectoryChildrenIntegrationTests` (fk_class_rooms_grade_levels
  seed) and `Issue #1 full-admin invariant` (permission-catalog count drift). Not caused by this change.

## Deferred / follow-ups
- FE `skipInvalidate` masks (A1.3) are now redundant — the backend root cause is fixed; can be
  simplified as a separate task.
- Guardrail: a future manual `BeginTransaction` outside MediatR + cache invalidate would enqueue but
  never flush (no `PostCommitDispatchBehavior` in that scope) → silent drop. No trigger today (only
  `TransactionBehavior` opens transactions). Consider a code comment/analyzer if that changes.
- `SetAsync` is not deferred inside a transaction (out of scope; low risk — only 4 sites, mostly non-stale-prone).

## Docs
- Design: `.claude/sessions/2026-06-26-post-commit-cache-invalidation-design.md`
- Plan: `.claude/sessions/2026-06-26-post-commit-cache-invalidation-plan.md`
- Memory `project_ayarlar_bug_temizleme` → option C marked ✅ DONE.
