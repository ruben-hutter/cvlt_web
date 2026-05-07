---
description: "Capture an idea as a plan in plans/ directory"
agent: build
---

The user has an idea they want to capture as a plan document. Based on their input ($ARGUMENTS), do the following:

1. Create a new plan document in `plans/` with a descriptive filename (kebab-case, e.g. `plans/feature-name.md`)
2. The plan should include:
   - **Title** and brief description of the idea
   - **Why** — motivation and context
   - **What** — proposed approach / implementation outline
   - **Open questions** — anything that needs research or decisions
3. Keep it concise — this is a starting point, not a full spec
4. Report back the file path so the user can review it

If the idea is very small and doesn't warrant a full plan, suggest adding it to TODO.md instead.
