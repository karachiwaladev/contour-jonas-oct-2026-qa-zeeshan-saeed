# Eval report: issue #12

**Verdict: ✅ PASS**

- **Previous state:** `origin/main` (8794368)
- **New state:** `working tree` (2f538b3)
- **Run at:** 2026-10-26T14:09:02.169Z

## What changed

| Project | Code | Tests / scenario | Other |
|---|---|---|---|
| todo | M `todo/app.js`<br>M `todo/db.js`<br>M `todo/index.html`<br>A `todo/logger.js` | A `evals/scenarios/todo.mjs`<br>A `todo/tests/recurrence.test.mjs` | M `todo/README.md`<br>A `todo/screenshots/issue-12/add-task.png`<br>A `todo/screenshots/issue-12/logs-frontend.png`<br>A `todo/screenshots/issue-12/recurring-weekly.png` |
| evals | A `evals/lib/browser.mjs`<br>A `evals/lib/hook.mjs`<br>A `evals/lib/report.mjs`<br>A `evals/lib/rules.mjs`<br>A `evals/run-eval.mjs` | A `evals/tests/hook.test.mjs`<br>A `evals/tests/rules.test.mjs`<br>A `evals/tests/browser.test.mjs` | A `evals/README.md`<br>A `evals/checks/issue-12.json` |
| _(repo)_ | | | A `.claude/hooks/eval-after-tests.mjs`<br>A `.claude/settings.json`<br>M `.claude/skills/factory-loop/SKILL.md`<br>A `.github/workflows/eval.yml`<br>M `.gitignore`<br>M `CLAUDE.md` |

## Acceptance checks

| Check | Verified by | Result | Detail |
|---|---|---|---|
| Each UI action writes a frontend log entry with details | `scenario:todo/logs-frontend` | ✅ pass | 16 frontend entries |
| Each IndexedDB operation writes a backend log entry with details | `scenario:todo/logs-backend` | ✅ pass | 26 backend entries |
| Logs survive a reload and are readable with TodoLog.all() | `scenario:todo/logs-persist-reload` | ✅ pass | 42 before, 43 after |
| Existing tasks survive the DB v1 → v2 upgrade | `scenario:todo/db-upgrade-keeps-tasks` | ✅ pass | legacy task shown after upgrade |
| Eval fails when code changes without tests | `unit:rules: fails when code changes without tests` | ✅ pass | evals: rules: fails when code changes without tests |
| Eval fails on a regression | `unit:rules: fails on a regression` | ✅ pass | evals: rules: fails on a regression |
| Eval fails when a previously passing check is removed or skipped | `unit:rules: fails when a previously passing check is removed or skipped` | ✅ pass | evals: rules: fails when a previously passing check is removed or skipped |
| Eval fails on console errors | `unit:rules: fails on console errors` | ✅ pass | evals: rules: fails on console errors |
| Eval fails when an acceptance check has no result | `unit:rules: fails when an acceptance check has no result` | ✅ pass | evals: rules: fails when an acceptance check has no result |
| Report shows previous state, changes, per-check results and log comparison | `unit:report includes previous state, changes, checks and log comparison` | ✅ pass | evals: report includes previous state, changes, checks and log comparison |
| Existing todo features still pass in the browser (no regressions) | `scenario:todo/recurring-weekly` | ✅ pass | [{"title":"Water plants","done":true,"due":"2026-10-26","overdue":false,"repeat":"","tags":["home"]},{"title":"Water plants","done":false,"due":"2026-11-02","ov |
| Hook runs the eval after test commands | `unit:hook: triggers on test commands` | ✅ pass | evals: hook: triggers on test commands |
| Hook ignores other commands and never re-triggers itself | `unit:hook: ignores other commands and the eval runner itself` | ✅ pass | evals: hook: ignores other commands and the eval runner itself |
| Hook picks the issue from the branch checks file | `unit:hook: picks the issue from the branch checks file` | ✅ pass | evals: hook: picks the issue from the branch checks file |
| A failing eval blocks and feeds the failures back to the AI | `unit:hook: a failing eval blocks with the failures` | ✅ pass | evals: hook: a failing eval blocks with the failures |
| A passing eval adds context without blocking | `unit:hook: a passing eval adds context and does not block` | ✅ pass | evals: hook: a passing eval adds context and does not block |
| Hook exits quietly for non-test commands and when disabled | `unit:hook: script exits quietly for non-test commands and when disabled` | ✅ pass | evals: hook: script exits quietly for non-test commands and when disabled |
| Hook registered in .claude/settings.json | `files:.claude/settings.json,.claude/hooks/eval-after-tests.mjs` | ✅ pass | changed: .claude/settings.json,.claude/hooks/eval-after-tests.mjs |
| End to end: a real test run in a Claude Code session triggers the eval; a broken change is blocked | `manual` | ✅ pass | 2026-10-26 live session: after `node --test todo/tests/recurrence.test.mjs` (7/7 passing) with delete deliberately broken, the PostToolUse hook ran the eval and |
| GitHub Actions check runs on the PR and passes | `ci` | ⏳ deferred | verified by the GitHub Actions run on the PR |
| CLAUDE.md index and factory-loop skill updated | `files:CLAUDE.md,.claude/skills/factory-loop/SKILL.md` | ✅ pass | changed: CLAUDE.md,.claude/skills/factory-loop/SKILL.md |

## Browser scenario: previous vs new

| Step | Before | After | Change |
|---|---|---|---|
| App loads (`todo/load`) | ✅ | ✅ | still passes |
| Add a task with a tag (`todo/add-task`) | ✅ | ✅ | still passes |
| Complete a task (`todo/complete-task`) | ✅ | ✅ | still passes |
| Completed filter shows only done tasks (`todo/filter-status`) | ✅ | ✅ | still passes |
| Tag filter shows only tagged tasks (`todo/filter-tag`) | ✅ | ✅ | still passes |
| Overdue due date is highlighted (`todo/due-date-overdue`) | ✅ | ✅ | still passes |
| Completing a weekly task creates the next one (`todo/recurring-weekly`) | ✅ | ✅ | still passes |
| Monthly repeat clamps Jan 31 to Feb 28 (`todo/recurring-monthly-clamp`) | ✅ | ✅ | still passes |
| Repeating without a due date is blocked (`todo/validation-repeat-needs-due`) | ✅ | ✅ | still passes |
| Delete a task (`todo/delete-task`) | ✅ | ✅ | still passes |
| Tasks persist across reload (`todo/reload-persists`) | ✅ | ✅ | still passes |
| UI actions write frontend log entries (`todo/logs-frontend`) | ❌ | ✅ | now passes |
| Data-layer operations write backend log entries (`todo/logs-backend`) | ❌ | ✅ | now passes |
| Logs survive a reload (`todo/logs-persist-reload`) | ❌ | ✅ | now passes |
| Tasks stored by an older DB version survive the upgrade (`todo/db-upgrade-keeps-tasks`) | ✅ | ✅ | still passes |

## Action log comparison (front end / back end)

| Step | Difference | New log |
|---|---|---|
| `todo/load` | 0 entries (no log in previous state) |  |
| `todo/add-task` | 3 entries (no log in previous state) | frontend:task.add, backend:tasks.add, backend:tasks.getAll |
| `todo/complete-task` | 3 entries (no log in previous state) | frontend:task.complete, backend:tasks.put, backend:tasks.getAll |
| `todo/filter-status` | 4 entries (no log in previous state) | frontend:filter.status ×2, backend:tasks.getAll ×2 |
| `todo/filter-tag` | 7 entries (no log in previous state) | frontend:task.add, backend:tasks.add, backend:tasks.getAll ×3, frontend:filter.tag ×2 |
| `todo/due-date-overdue` | 3 entries (no log in previous state) | frontend:task.add, backend:tasks.add, backend:tasks.getAll |
| `todo/recurring-weekly` | 8 entries (no log in previous state) | frontend:task.add, backend:tasks.add ×2, backend:tasks.getAll ×2, frontend:task.complete, backend:tasks.put, frontend:task.recurrence.next |
| `todo/recurring-monthly-clamp` | 8 entries (no log in previous state) | frontend:task.add, backend:tasks.add ×2, backend:tasks.getAll ×2, frontend:task.complete, backend:tasks.put, frontend:task.recurrence.next |
| `todo/validation-repeat-needs-due` | 1 entries (no log in previous state) | frontend:task.add.rejected |
| `todo/delete-task` | 3 entries (no log in previous state) | frontend:task.delete, backend:tasks.delete, backend:tasks.getAll |
| `todo/reload-persists` | 1 entries (no log in previous state) | backend:tasks.getAll |
| `todo/logs-frontend` | 0 entries (no log in previous state) |  |
| `todo/logs-backend` | 0 entries (no log in previous state) |  |
| `todo/logs-persist-reload` | 1 entries (no log in previous state) | backend:tasks.getAll |
| `todo/db-upgrade-keeps-tasks` | 0 entries (no log in previous state) |  |

## Unit tests

Before: 0/0 passing · After: 31/31 passing

<details><summary>All unit tests</summary>

| Test | Before | After |
|---|---|---|
| evals: browser: an explicit Chrome path that does not exist is not used | — | ✅ |
| evals: browser: ignores a missing or partly written DevToolsActivePort | — | ✅ |
| evals: browser: reads the port Chrome picked from DevToolsActivePort | — | ✅ |
| evals: hook: a failing eval blocks with the failures | — | ✅ |
| evals: hook: a passing eval adds context and does not block | — | ✅ |
| evals: hook: ignores other commands and the eval runner itself | — | ✅ |
| evals: hook: picks the issue from the branch checks file | — | ✅ |
| evals: hook: reads the eval verdict and failures | — | ✅ |
| evals: hook: script exits quietly for non-test commands and when disabled | — | ✅ |
| evals: hook: triggers on test commands | — | ✅ |
| evals: report includes previous state, changes, checks and log comparison | — | ✅ |
| evals: rules: a step that failed before and passes now is not a regression | — | ✅ |
| evals: rules: classifies code, tests and other files per project | — | ✅ |
| evals: rules: diffs action logs as multisets | — | ✅ |
| evals: rules: fails on a regression | — | ✅ |
| evals: rules: fails on console errors | — | ✅ |
| evals: rules: fails on currently failing steps or unit tests | — | ✅ |
| evals: rules: fails when a previously passing check is removed or skipped | — | ✅ |
| evals: rules: fails when an acceptance check has no result | — | ✅ |
| evals: rules: fails when code changes without tests | — | ✅ |
| evals: rules: parses git name-status output, including renames | — | ✅ |
| evals: rules: passes when code changes come with tests, or only docs change | — | ✅ |
| evals: rules: resolves scenario, unit, files and ci checks | — | ✅ |
| evals: rules: verdict combines every rule | — | ✅ |
| todo: recurrence: badge labels | — | ✅ |
| todo: recurrence: every N days crosses a month | — | ✅ |
| todo: recurrence: form choices map to rules | — | ✅ |
| todo: recurrence: monthly clamps to the last day of the month | — | ✅ |
| todo: recurrence: monthly rolls over the year | — | ✅ |
| todo: recurrence: weekly across a DST change keeps the date | — | ✅ |
| todo: recurrence: weekly adds 7 days | — | ✅ |

</details>

## Console errors

_None._
