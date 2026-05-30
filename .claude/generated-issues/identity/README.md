# Identity (Login & Profile Switch) — OKSMVP-1 Sub-Issues

Generated from `.claude/docs/modules/identity` + teknik analiz *Login ve Profile Switch · Teknik Analiz (Sürüm 1.0, 30 Mayıs 2026)*.

Parent issue: `OKSMVP-1`

## Summary

- **Total issues:** 18
- **Total story points:** 314
- **Distribution:** 8 × 13 SP, 10 × 21 SP (no 8 SP, no 34 SP — every slice independently reviewable at 13–21 SP)
- **Repositories:** `farukkaya/oksis-api`, `farukkaya/oksis-web`, `farukkaya/oksis-mobile`

Each issue is scoped between **13 and 21 SP** and is meant to be implemented, reviewed, tested, and committed independently. SP'ler `users` modülü örneğiyle aynı ölçekte tutuldu.

> ⚠️ **Önkoşul kararlar:** Issue'ları açmadan önce `open-questions.md`'deki **OQ-identity-001 (Account vs mevcut User)**, **OQ-identity-002 (modül yerleşimi)** ve **TQ-auth-001…007** kararları netleştirilmeli. Özellikle ISSUE-01/02 bu kararlara bağlıdır.

## Issue List

| No | Repo | SP | Sprint | Title |
|---|---|---:|---|---|
| 01 | oksis-api | 21 | 1 | Account domain model (auth/session aggregate) |
| 02 | oksis-api | 21 | 1 | Account persistence + password/token hashing |
| 03 | oksis-api | 13 | 2 | Identifier resolver + users read-port |
| 04 | oksis-api | 21 | 1 | Login command + MediatR pipeline behaviors |
| 05 | oksis-api | 21 | 1 | Refresh rotation, reuse detection, logout, blacklist |
| 06 | oksis-api | 13 | 1 | Login guard (lockout/rate-limit) + admin unlock |
| 07 | oksis-api | 13 | 2 | Context resolution + /me endpoints |
| 08 | oksis-api | 21 | 3 | Profile switch + permission cache + RBAC |
| 09 | oksis-api | 21 | 4 | Child/season switch + ABAC + read-only season |
| 10 | oksis-api | 13 | 5 | Password recovery flows (forgot/reset/change) |
| 11 | oksis-api | 13 | 1 | Audit logging (Serilog→ES) + PII masking |
| 12 | oksis-api | 21 | 6 | SignalR forced logout + Hangfire jobs |
| 13 | oksis-api | 13 | 5 | OTP skeleton + 2FA prep |
| 14 | oksis-api | 21 | x-cut | Security + integration test suite |
| 15 | oksis-web | 21 | 1 | Web auth data layer + login + refresh interceptor |
| 16 | oksis-web | 21 | 3–4 | Web context switch UI (profile/child/season) |
| 17 | oksis-web | 13 | 5 | Web password recovery flows |
| 18 | oksis-mobile | 13 | 1/4 | Mobile auth + switch flows |

## Labels

```bash
gh label create "parent:OKSMVP-1" --color "6d28d9" --description "Sub-issue of OKSMVP-1"
gh label create "module:identity" --color "1d4ed8" --description "Kimlik Doğrulama modülü"
gh label create "sprint:1" --color "0e7490" --description "Sprint 1"
gh label create "sprint:2" --color "0e7490" --description "Sprint 2"
gh label create "sprint:3" --color "0e7490" --description "Sprint 3"
gh label create "sprint:4" --color "0e7490" --description "Sprint 4"
gh label create "sprint:5" --color "0e7490" --description "Sprint 5"
gh label create "sprint:6" --color "0e7490" --description "Sprint 6"
gh label create "type:feature" --color "16a34a"
gh label create "type:test" --color "fbbf24"
gh label create "type:security" --color "dc2626"
gh label create "type:infra" --color "9ca3af"
gh label create "type:i18n" --color "a78bfa"
gh label create "sp:13" --color "65a30d"
gh label create "sp:21" --color "365314"
```

## Create Issues

```bash
gh issue create --repo farukkaya/oksis-api --title "[Identity] Account domain model (auth/session aggregate)" --label "parent:OKSMVP-1,module:identity,sprint:1,type:feature,type:test,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-01-api-account-domain-model.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Account persistence and password/token hashing" --label "parent:OKSMVP-1,module:identity,sprint:1,type:feature,type:security,type:infra,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-02-api-account-persistence-and-hashing.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Identifier resolver and users read-port" --label "parent:OKSMVP-1,module:identity,sprint:2,type:feature,type:security,type:test,sp:13" --body-file ".claude/generated-issues/identity/ISSUE-03-api-identifier-resolver-readport.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Login command and MediatR pipeline behaviors" --label "parent:OKSMVP-1,module:identity,sprint:1,type:feature,type:security,type:test,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-04-api-login-command-and-pipeline.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Refresh rotation, reuse detection, logout, blacklist" --label "parent:OKSMVP-1,module:identity,sprint:1,type:feature,type:security,type:test,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-05-api-refresh-rotation-logout-blacklist.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Login guard (lockout/rate-limit) and admin unlock" --label "parent:OKSMVP-1,module:identity,sprint:1,type:feature,type:security,type:test,sp:13" --body-file ".claude/generated-issues/identity/ISSUE-06-api-login-guard-and-admin-unlock.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Context resolution and /me endpoints" --label "parent:OKSMVP-1,module:identity,sprint:2,type:feature,type:test,sp:13" --body-file ".claude/generated-issues/identity/ISSUE-07-api-context-resolution-and-me-endpoints.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Profile switch, permission cache, RBAC handler" --label "parent:OKSMVP-1,module:identity,sprint:3,type:feature,type:security,type:test,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-08-api-profile-switch-and-permission-cache.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Child/season switch, ABAC, read-only season policy" --label "parent:OKSMVP-1,module:identity,sprint:4,type:feature,type:security,type:test,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-09-api-child-season-switch-and-abac.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Password recovery flows (forgot/reset/change)" --label "parent:OKSMVP-1,module:identity,sprint:5,type:feature,type:security,type:test,sp:13" --body-file ".claude/generated-issues/identity/ISSUE-10-api-password-recovery-flows.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Audit logging and PII masking" --label "parent:OKSMVP-1,module:identity,sprint:1,type:feature,type:security,type:test,sp:13" --body-file ".claude/generated-issues/identity/ISSUE-11-api-audit-logging-and-masking.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] SignalR forced logout and Hangfire jobs" --label "parent:OKSMVP-1,module:identity,sprint:6,type:feature,type:infra,type:test,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-12-api-signalr-forced-logout-and-hangfire-jobs.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] OTP skeleton and 2FA prep" --label "parent:OKSMVP-1,module:identity,sprint:5,type:feature,type:security,type:test,sp:13" --body-file ".claude/generated-issues/identity/ISSUE-13-api-otp-skeleton-and-2fa-prep.md"
gh issue create --repo farukkaya/oksis-api --title "[Identity] Security and integration test suite" --label "parent:OKSMVP-1,module:identity,type:security,type:test,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-14-api-security-and-integration-tests.md"
gh issue create --repo farukkaya/oksis-web --title "[Identity] Web auth data layer, login, refresh interceptor" --label "parent:OKSMVP-1,module:identity,sprint:1,type:feature,type:i18n,type:test,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-15-web-auth-data-layer-and-login.md"
gh issue create --repo farukkaya/oksis-web --title "[Identity] Web context switch UI (profile/child/season)" --label "parent:OKSMVP-1,module:identity,sprint:3,type:feature,type:i18n,type:test,sp:21" --body-file ".claude/generated-issues/identity/ISSUE-16-web-context-switch-ui.md"
gh issue create --repo farukkaya/oksis-web --title "[Identity] Web password recovery flows" --label "parent:OKSMVP-1,module:identity,sprint:5,type:feature,type:i18n,type:test,sp:13" --body-file ".claude/generated-issues/identity/ISSUE-17-web-password-recovery-flows.md"
gh issue create --repo farukkaya/oksis-mobile --title "[Identity] Mobile auth and switch flows" --label "parent:OKSMVP-1,module:identity,sprint:1,type:feature,type:i18n,type:test,sp:13" --body-file ".claude/generated-issues/identity/ISSUE-18-mobile-auth-and-switch-flows.md"
```

## Notes

- `gh issue create` top-level GitHub issue oluşturur. `OKSMVP-1` Linear parent ise oluşturma sonrası Linear/GitHub entegrasyonuyla bağla.
- Issue body'leri kuralları kopyalamaz; kanonik kaynak `.claude/docs/modules/identity` ve teknik analiz dokümanıdır.
- **Sprint sırası bir bağımlılık zinciridir:** Sprint 1 foundation (01,02,04,05,06,11,15) → Sprint 2 context (03,07) → Sprint 3 profile switch (08,16) → Sprint 4 child/season (09) → Sprint 5 recovery/OTP (10,13,17) → Sprint 6 hardening (12). ISSUE-14 (testler) feature'larla artımlı ilerler. ISSUE-18 (mobile) backend hazır oldukça.
