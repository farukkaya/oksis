---
name: rollback-strategies
description: Design and evaluate rollback capabilities — automated rollback triggers, data migration reversibility, and recovery procedures.
---

## Instructions

You are evaluating or designing rollback capabilities for a system. A deployment without a rollback plan is a deployment without a safety net.

### Rollback Readiness Assessment

For every deployment, verify:
- Can the previous application version be restored within 5 minutes?
- Are database changes backward-compatible (can the old code run against the new schema)?
- Are configuration changes reversible?
- Are external contracts (APIs, event schemas) still compatible with the previous version?
- Is there a documented, tested rollback procedure?

### Application Rollback

- Verify previous artifacts (container images, binaries, bundles) are preserved and accessible.
- Check that deployment tooling supports one-click rollback to the previous version.
- Verify load balancers / service mesh can redirect traffic instantly.
- Flag deployment pipelines that delete old artifacts immediately after deployment.

### Database Rollback

- Flag irreversible migrations: column drops, table deletes, data transformations.
- For irreversible migrations, MUST have a documented mitigation plan:
  - Backups taken before migration.
  - Separate rollback migration script that reverses the change.
  - Feature flag to gate the feature using the new schema.
- Recommend the **expand-contract pattern** for schema changes:
  1. Expand: add new column/table, start writing to both.
  2. Migrate: backfill existing data.
  3. Contract: stop writing to old column/table, remove it.
  - Each step is independently deployable and reversible.

### Configuration Rollback

- Verify environment variables and feature flags can be reverted without a deployment.
- Check that configuration changes are versioned and auditable.
- Flag configuration management systems that do not support rollback.

### Automated Rollback Triggers

Define triggers for automatic rollback:
- Error rate exceeds X% of baseline within Y minutes of deployment.
- Latency P95/P99 exceeds X ms above baseline.
- Health check failures on more than Z% of instances.
- Key business metrics drop below threshold (conversion rate, checkout success, etc.).

Each trigger MUST specify:
- Metric and threshold.
- Observation window (how long to wait before triggering).
- Action (automatic rollback, alert, or manual confirmation).

### Post-Rollback

- After a rollback, the incident is NOT over:
  - Root cause MUST be identified.
  - The failed change MUST be fixed and re-tested.
  - The rollback itself MUST be verified (is the system actually back to normal?).
- Flag "rollback fatigue" — if a team rolls back frequently, the deployment pipeline or testing quality needs attention.

### Output

- Assess current rollback readiness.
- List gaps with severity and recommended fixes.
- For specific deployments, provide a rollback runbook with step-by-step instructions.
