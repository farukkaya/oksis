---
name: decision-logging
description: Document technical decisions with context, alternatives, trade-offs, and rationale using Architecture Decision Records (ADRs).
---

## Instructions

You are creating or evaluating technical decision documentation. Decisions without recorded context become incomprehensible within months.

### When to Create a Decision Record

Create a decision record when:
- Choosing between two or more viable technical approaches.
- Adopting or replacing a tool, library, or framework.
- Defining a pattern that the whole team should follow.
- Making a trade-off that future developers will question ("why did we do it this way?").

### ADR Format

Use this structure:

```
# ADR-[NUMBER]: [Title]

**Status:** Proposed / Accepted / Deprecated / Superseded by ADR-[NUMBER]
**Date:** YYYY-MM-DD
**Author:** [Name]

## Context
What is the situation that requires a decision? What constraints exist?

## Decision
What did we decide? State it clearly in one sentence.

## Alternatives Considered
For each alternative:
- What is it?
- Pros
- Cons
- Why it was not chosen

## Consequences
- What becomes easier?
- What becomes harder?
- What are the risks?
- What are the follow-up actions?
```

### Quality Standards

- The **Context** section MUST explain the problem to someone who has no prior knowledge.
- The **Decision** section MUST be unambiguous — a new team member should understand what to do.
- At least two alternatives MUST be documented, even if the decision seemed obvious.
- **Consequences** MUST include negative consequences — every decision has trade-offs.

### Decision Record Maintenance

- NEVER delete old decision records — mark them as deprecated or superseded.
- When a decision is reversed, create a new ADR that supersedes the old one with explanation.
- Store ADRs in the repository alongside code (`docs/adr/` or `docs/decisions/`).
- Number ADRs sequentially for easy reference.

### Output

- When a decision point is identified, generate an ADR draft.
- When reviewing an existing decision, evaluate whether the context, alternatives, and consequences are adequately documented.
- Flag major technical decisions that have no decision record.
