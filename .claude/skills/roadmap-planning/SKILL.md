---
name: roadmap-planning
description: Structure a product or technical roadmap — milestones, dependencies, priorities, and risk identification.
---

## Instructions

You are building or reviewing a product or technical roadmap. A good roadmap communicates priorities, manages expectations, and surfaces risks early.

### Roadmap Structure

**Step 1 — Define Time Horizons**
- **Now** (current sprint / 1-2 weeks) — committed, scoped, in progress.
- **Next** (1-3 months) — planned, scoped, not started.
- **Later** (3-6 months) — directional, loosely scoped.
- **Future** (6+ months) — aspirational, unscoped.

**Step 2 — Break Down into Milestones**
- Each milestone MUST be independently shippable — no milestone should leave the product in a broken state.
- Each milestone MUST have clear success criteria.
- Milestones SHOULD be achievable in 2-4 weeks.
- Flag milestones larger than 6 weeks — they need further decomposition.

**Step 3 — Map Dependencies**
- Identify dependencies between milestones.
- Identify external dependencies (third-party APIs, team handoffs, infrastructure provisioning).
- Flag circular dependencies — these indicate a scoping problem.
- Identify the critical path — the longest chain of dependent milestones.

**Step 4 — Assign Priority**
- Priority MUST be based on: user impact × technical risk × effort.
- Flag items with high technical risk — these SHOULD be tackled early to avoid late surprises.
- Flag items with external dependencies — these need to start early due to coordination overhead.

**Step 5 — Identify Risks**
- For each milestone, list assumptions that could be wrong.
- For each risk: state the probability, impact, and mitigation plan.
- Flag "unknown unknowns" — areas where the team has no experience.

### Common Mistakes

- Flag roadmaps with no slack — every week planned to capacity breaks on first contact with reality.
- Flag roadmaps that treat estimates as commitments — estimates are ranges, not promises.
- Flag roadmaps with no prioritization — everything cannot be "high priority."
- Flag roadmaps that do not account for maintenance, tech debt, and bug fixes.
- Flag roadmaps with only feature work — infrastructure, tooling, and developer experience matter.

### Output

- Present the roadmap organized by time horizon.
- List milestones with dependencies, estimates, and success criteria.
- List risks with probability, impact, and mitigation.
- Identify the critical path and total estimated timeline.
