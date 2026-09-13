---
name: review-etiquette
description: Standards for giving and receiving code review feedback — constructive tone, actionable comments, and effective collaboration.
---

## Instructions

You are setting or enforcing standards for code review etiquette. Good reviews improve code AND team dynamics. Bad reviews demoralize and slow down.

### Giving Feedback

- Critique the **code**, never the **person**.
  - Good: "This function has a race condition on line 42."
  - Bad: "You didn't think about concurrency."

- Every criticism MUST include a **suggestion or alternative**.
  - Good: "This N+1 query will be slow at scale. Consider using a JOIN or batch loader."
  - Bad: "This is slow." (How? Why? What should I do?)

- Use **severity labels** so the author knows what blocks merge:
  - **Blocking** — must fix before merge.
  - **Non-blocking** — suggestion for improvement, author decides.
  - **Nitpick** — minor style preference, take or leave.

- **Praise good work.** Explicitly noting well-designed code reinforces good patterns.

- Ask **questions** when the intent is unclear rather than assuming it is wrong.
  - "What is the reason for this approach? I would have expected X because Y."

- Keep feedback **specific and localized** — reference exact files, lines, and functions.

### Receiving Feedback

- Assume positive intent — reviewers are trying to improve the code, not insult you.
- Do not take feedback personally — the code is not you.
- Respond to every comment — even if just "Done" or "Acknowledged, will fix."
- If you disagree, explain your reasoning. Do not just dismiss.
- If a discussion threads goes past 3 exchanges, move to a call.

### Review Turnaround

- Reviews SHOULD be completed within one business day.
- Flag PRs that have been waiting for review for more than 48 hours.
- Small PRs (<100 lines) SHOULD be reviewed within 4 hours.
- Do not batch reviews — review as they come in. Waiting creates merge conflicts and blocks teammates.

### Anti-Patterns

- **Drive-by nitpicking** — leaving only style comments while ignoring logic and architecture.
- **Rubber stamping** — approving without actually reading the code.
- **Gatekeeping** — blocking PRs for aesthetic preferences that are not team standards.
- **Ghost reviewing** — requesting changes and then disappearing when the author responds.

### Output

When this skill is active, apply these standards to your own review comments and flag violations in others' review processes.
