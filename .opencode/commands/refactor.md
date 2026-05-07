---
description: "Analyze code structure and suggest refactoring improvements"
agent: build
---

Analyze the codebase (or the path specified in $ARGUMENTS) for code structure improvements. Follow this workflow:

## 1. Scope
- If $ARGUMENTS is provided, focus on that file or directory
- If no arguments, analyze the files changed in the current session (check `git diff`)

## 2. Analysis — invoke @reviewer first
Use the @reviewer subagent to analyze the code for:
- Duplicate code that could be extracted into shared utilities
- Inconsistent patterns that should be standardized
- Missing abstractions (shared interfaces, base classes, utility functions)
- Code that belongs in a library/module vs inline

## 3. Create a refactoring plan
Based on the analysis, create a concrete plan with:
- **What to extract**: specific functions, components, or patterns
- **Where to put it**: proposed file paths for shared utilities
- **Before/After**: show the current code and the proposed structure
- **Priority**: which changes have the biggest impact

## 4. Ask for approval
Present the plan and ask the user which refactorings to proceed with before making any changes.

## 5. Implement
After approval, make the changes following the project conventions:
- Use TypeScript with proper types
- Follow existing file organization patterns
- Update all imports in affected files
- Run `npx next lint` and `npx tsc --noEmit` after changes to verify
