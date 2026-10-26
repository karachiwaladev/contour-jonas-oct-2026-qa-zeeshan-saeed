# Eval report: issue #13

**Verdict: ✅ PASS**

- **Previous state:** `origin/ticket-12-eval` (a58f846)
- **New state:** `working tree` (a58f846)
- **Run at:** 2026-10-26T11:49:37.262Z

## What changed

| Project | Code | Tests / scenario | Other |
|---|---|---|---|
| todo | M `todo/app.js`<br>M `todo/db.js`<br>M `todo/index.html`<br>M `todo/recurrence.js`<br>M `todo/style.css`<br>A `todo/priority.js` | M `evals/scenarios/todo.mjs`<br>A `todo/tests/priority.test.mjs` | M `todo/README.md` |
| evals | — | — | A `evals/checks/issue-13.json` |
| _(repo)_ | | | M `CLAUDE.md` |

## Acceptance checks

| Check | Verified by | Result | Detail |
|---|---|---|---|
| Adding with priority High shows a High badge; default is Medium | `scenario:todo/priority-add` | ✅ pass | Plain task: Medium, Urgent fix: High |
| Sorted High → Medium → Low, then by due date | `scenario:todo/priority-sort` | ✅ pass | Hotfix (High) · Big launch (High) · Urgent fix (High) · Legacy task (Medium) · Plain task (Medium) · Later (Low) |
| Sort order rules (priority, due date, undated last) | `unit:priority: sorts high to low, then by due date with undated last` | ✅ pass | todo: priority: sorts high to low, then by due date with undated last |
| Priority filter shows only the chosen level and combines with status/tag filters | `scenario:todo/priority-filter` | ✅ pass | High: 3; High + Incomplete: Big launch, Urgent fix |
| Edit title, due date, tags, priority → Save updates the task and persists after reload | `scenario:todo/edit-save` | ✅ pass | {"title":"Plain edited","done":false,"due":"2026-10-29","overdue":false,"repeat":"","priority":"Low","tags":["work","home"]} |
| Edit → Cancel leaves the task unchanged | `scenario:todo/edit-cancel` | ✅ pass | {"title":"Plain edited","done":false,"due":"2026-10-29","overdue":false,"repeat":"","priority":"Low","tags":["work","home"]} |
| Edit blocks an empty title and a repeat without a due date | `scenario:todo/edit-validation` | ✅ pass | "Repeating tasks need a due date." / "Title is required." |
| A recurring High task's next occurrence is High | `scenario:todo/priority-recurring` | ✅ pass | {"title":"Standup","done":false,"due":"2026-11-02","overdue":false,"repeat":"↻ weekly","priority":"High","tags":[]} |
| A task without a priority (older data) shows as Medium | `scenario:todo/priority-legacy-medium` | ✅ pass | priority "Medium" |
| Edits are logged as frontend:task.edit and backend:tasks.put | `scenario:todo/edit-logs` | ✅ pass | task.edit changes: title, dueDate, tags, priority |
| GitHub Eval check passes on the PR | `ci` | ⏳ deferred | verified by the GitHub Actions run on the PR |
| README and CLAUDE.md index updated | `files:todo/README.md,CLAUDE.md` | ✅ pass | changed: todo/README.md,CLAUDE.md |

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
| UI actions write frontend log entries (`todo/logs-frontend`) | ✅ | ✅ | still passes |
| Data-layer operations write backend log entries (`todo/logs-backend`) | ✅ | ✅ | still passes |
| Logs survive a reload (`todo/logs-persist-reload`) | ✅ | ✅ | still passes |
| Tasks stored by an older DB version survive the upgrade (`todo/db-upgrade-keeps-tasks`) | ✅ | ✅ | still passes |
| A task saved without a priority shows as Medium (`todo/priority-legacy-medium`) | ❌ | ✅ | now passes |
| Add with a priority; default is Medium (`todo/priority-add`) | ❌ | ✅ | now passes |
| Sorted High → Medium → Low, then by due date (`todo/priority-sort`) | ❌ | ✅ | now passes |
| Priority filter, combined with the status filter (`todo/priority-filter`) | ❌ | ✅ | now passes |
| Edit title, due date, tags and priority; persists after reload (`todo/edit-save`) | ❌ | ✅ | now passes |
| Cancel leaves the task unchanged (`todo/edit-cancel`) | ❌ | ✅ | now passes |
| Edit blocks an empty title and a repeat without a due date (`todo/edit-validation`) | ❌ | ✅ | now passes |
| The next occurrence of a recurring task keeps its priority (`todo/priority-recurring`) | ❌ | ✅ | now passes |
| Edits and the priority filter are logged (frontend and backend) (`todo/edit-logs`) | ❌ | ✅ | now passes |

## Action log comparison (front end / back end)

| Step | Difference | New log |
|---|---|---|
| `todo/priority-add` | + frontend:task.add, backend:tasks.add, backend:tasks.getAll  | frontend:task.add ×2, backend:tasks.add ×2, backend:tasks.getAll ×2 |
| `todo/priority-sort` | + frontend:task.add ×3, backend:tasks.add ×3, backend:tasks.getAll ×3  | frontend:task.add ×3, backend:tasks.add ×3, backend:tasks.getAll ×3 |
| `todo/priority-filter` | + frontend:filter.priority ×2, backend:tasks.getAll ×5, frontend:task.complete, backend:tasks.put, frontend:filter.status ×2  | frontend:filter.priority ×2, backend:tasks.getAll ×5, frontend:task.complete, backend:tasks.put, frontend:filter.status ×2 |
| `todo/edit-save` | + frontend:task.edit.open, frontend:task.edit, backend:tasks.put, backend:tasks.getAll ×2  | frontend:task.edit.open, frontend:task.edit, backend:tasks.put, backend:tasks.getAll ×2 |
| `todo/edit-cancel` | + frontend:task.edit.open, frontend:task.edit.cancel, backend:tasks.getAll  | frontend:task.edit.open, frontend:task.edit.cancel, backend:tasks.getAll |
| `todo/edit-validation` | + frontend:task.edit.open ×2, frontend:task.edit.rejected ×2, frontend:task.edit.cancel ×2, backend:tasks.getAll ×2  | frontend:task.edit.open ×2, frontend:task.edit.rejected ×2, frontend:task.edit.cancel ×2, backend:tasks.getAll ×2 |
| `todo/priority-recurring` | + frontend:task.add, backend:tasks.add ×2, backend:tasks.getAll ×2, frontend:task.complete, backend:tasks.put, frontend:task.recurrence.next  | frontend:task.add, backend:tasks.add ×2, backend:tasks.getAll ×2, frontend:task.complete, backend:tasks.put, frontend:task.recurrence.next |

## Unit tests

Before: 21/21 passing · After: 25/25 passing

<details><summary>All unit tests</summary>

| Test | Before | After |
|---|---|---|
| evals: report includes previous state, changes, checks and log comparison | ✅ | ✅ |
| evals: rules: a step that failed before and passes now is not a regression | ✅ | ✅ |
| evals: rules: classifies code, tests and other files per project | ✅ | ✅ |
| evals: rules: diffs action logs as multisets | ✅ | ✅ |
| evals: rules: fails on a regression | ✅ | ✅ |
| evals: rules: fails on console errors | ✅ | ✅ |
| evals: rules: fails on currently failing steps or unit tests | ✅ | ✅ |
| evals: rules: fails when a previously passing check is removed or skipped | ✅ | ✅ |
| evals: rules: fails when an acceptance check has no result | ✅ | ✅ |
| evals: rules: fails when code changes without tests | ✅ | ✅ |
| evals: rules: parses git name-status output, including renames | ✅ | ✅ |
| evals: rules: passes when code changes come with tests, or only docs change | ✅ | ✅ |
| evals: rules: resolves scenario, unit, files and ci checks | ✅ | ✅ |
| evals: rules: verdict combines every rule | ✅ | ✅ |
| todo: priority: labels | — | ✅ |
| todo: priority: missing or unknown priority counts as medium | — | ✅ |
| todo: priority: sorts high to low, then by due date with undated last | — | ✅ |
| todo: recurrence: badge labels | ✅ | ✅ |
| todo: recurrence: every N days crosses a month | ✅ | ✅ |
| todo: recurrence: form choices map to rules | ✅ | ✅ |
| todo: recurrence: monthly clamps to the last day of the month | ✅ | ✅ |
| todo: recurrence: monthly rolls over the year | ✅ | ✅ |
| todo: recurrence: toForm round-trips with fromForm | — | ✅ |
| todo: recurrence: weekly across a DST change keeps the date | ✅ | ✅ |
| todo: recurrence: weekly adds 7 days | ✅ | ✅ |

</details>

## Console errors

_None._
