---
description: "Validate, commit, merge to main, deploy to production"
agent: build
---

You are deploying the current changes to production (cvlt.ch). Follow these steps exactly:

## 1. Pre-flight checks
Run lint and typecheck to ensure nothing is broken:
- `npx next lint`
- `npx tsc --noEmit`

If there are errors, STOP and report them — do not proceed.

## 2. AI code review
Invoke the `@reviewer` subagent on the staged diff. Pass it all changed files so it can review for security issues, code quality, duplicate code, and best practices.

- If the reviewer returns **FAIL**: STOP and report the issues to the user. Do not proceed until the user confirms the issues are acceptable or have been fixed.
- If the reviewer returns **PASS**: proceed to the next step.

## 3. Commit
- Run `git status` and `git diff` to see all changes
- Stage all relevant files (`git add`)
- Write a concise commit message in **English** that describes the changes (imperative mood, e.g. "add contact section" not "added contact section" or "aggiunge sezione contatti")
- If no changes are staged, report that and stop

## 4. Push to dev
- Push to origin dev: `git push origin dev`
- If the push fails, report the error and stop

## 5. Merge into main
Since this project uses git worktrees:
- The main worktree is at `/home/ruben/repos/cvlt_web`
- Run: `git -C /home/ruben/repos/cvlt_web merge dev`
- If there are merge conflicts, report them and STOP — do not resolve automatically
- Push main: `git -C /home/ruben/repos/cvlt_web push origin main`

## 6. Report
- Confirm both dev and main are pushed successfully
- Report what was deployed to production (cvlt.ch)

IMPORTANT: Never force push. Never use --no-verify. If anything fails, stop and report.
