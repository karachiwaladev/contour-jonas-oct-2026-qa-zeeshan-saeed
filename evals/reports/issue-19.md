# Eval report: issue #19

**Verdict: ✅ PASS**

- **Previous state:** `origin/main` (31fe2d8)
- **New state:** `working tree` (31fe2d8)
- **Run at:** 2026-10-27T07:43:11.961Z

## What changed

| Project | Code | Tests / scenario | Other |
|---|---|---|---|
| todo | M `todo/app.js`<br>M `todo/index.html`<br>M `todo/style.css`<br>A `todo/search.js` | M `evals/scenarios/todo.mjs`<br>A `todo/tests/search.test.mjs` | M `todo/README.md` |
| evals | — | — | A `evals/checks/issue-19.json` |
| _(repo)_ | | | M `.gitignore`<br>M `CLAUDE.md` |

## Acceptance checks

| Check | Verified by | Result | Detail |
|---|---|---|---|
| Typing filters by title as you type, case-insensitively | `scenario:todo/search-title` | ✅ pass | Search alpha |
| Search matches tags | `scenario:todo/search-tag` | ✅ pass | Search alpha |
| Search matching rules (title, tags, case, partial) | `unit:search: case-insensitive partial match on the title` | ✅ pass | todo: search: case-insensitive partial match on the title |
| Several words must all match | `scenario:todo/search-words` | ✅ pass | "search beta": Search beta; "alpha other": 0 |
| Search combines with the status, tag and priority filters | `scenario:todo/search-combines` | ✅ pass | done: Search beta; tag: Search alpha; high: 0 |
| The clear button and Esc clear the box and show all tasks again | `scenario:todo/search-clear` | ✅ pass | 14 tasks; after ×: ["",14,true]; after Esc: ["",14] |
| No matches shows: No tasks match "x" | `scenario:todo/search-no-match` | ✅ pass | "No tasks match "zzqx"" |
| The count footer is unchanged by search | `scenario:todo/search-footer` | ✅ pass | "10 open · 4 done" vs "10 open · 4 done" |
| A reload starts with an empty search | `scenario:todo/search-reload` | ✅ pass | ["",14] |
| The search box is labelled and keyboard reachable | `scenario:todo/search-a11y` | ✅ pass | {"label":"Search tasks by title or tag","tab":0,"visible":true} |
| Search actions are logged (frontend:filter.search, filter.search.clear) | `scenario:todo/search-logs` | ✅ pass | 10 filter.search entries (debounced) |
| No console errors and no regressions; GitHub Eval check passes | `ci` | ⏳ deferred | verified by the GitHub Actions run on the PR |
| README and CLAUDE.md index updated | `files:todo/README.md,CLAUDE.md` | ✅ pass | changed: todo/README.md,CLAUDE.md |

## Browser scenario: previous vs new

| Step | Before | After | Change |
|---|---|---|---|
| App loads (`todo/load`) | ✅ | ✅ | still passes |
| Count footer is hidden when there are no tasks (`todo/count-empty-hidden`) | ✅ | ✅ | still passes |
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
| A task saved without a priority shows as Medium (`todo/priority-legacy-medium`) | ✅ | ✅ | still passes |
| Add with a priority; default is Medium (`todo/priority-add`) | ✅ | ✅ | still passes |
| Sorted High → Medium → Low, then by due date (`todo/priority-sort`) | ✅ | ✅ | still passes |
| Priority filter, combined with the status filter (`todo/priority-filter`) | ✅ | ✅ | still passes |
| Edit title, due date, tags and priority; persists after reload (`todo/edit-save`) | ✅ | ✅ | still passes |
| Cancel leaves the task unchanged (`todo/edit-cancel`) | ✅ | ✅ | still passes |
| Edit blocks an empty title and a repeat without a due date (`todo/edit-validation`) | ✅ | ✅ | still passes |
| The next occurrence of a recurring task keeps its priority (`todo/priority-recurring`) | ✅ | ✅ | still passes |
| Edits and the priority filter are logged (frontend and backend) (`todo/edit-logs`) | ✅ | ✅ | still passes |
| Count footer matches the open/done tasks in the list (`todo/count-matches-list`) | ✅ | ✅ | still passes |
| Adding 3 tasks adds 3 open (`todo/count-add`) | ✅ | ✅ | still passes |
| Completing and un-completing a task moves it between open and done (`todo/count-toggle`) | ✅ | ✅ | still passes |
| Deleting a task updates the counts (`todo/count-delete`) | ✅ | ✅ | still passes |
| Status, tag and priority filters don't change the counts (`todo/count-ignores-filters`) | ✅ | ✅ | still passes |
| Completing a recurring task adds 1 done and keeps open the same (`todo/count-recurring`) | ✅ | ✅ | still passes |
| Counts survive a reload (`todo/count-reload`) | ✅ | ✅ | still passes |
| Search filters by title as you type, case-insensitively (`todo/search-title`) | ❌ | ✅ | now passes |
| Search matches tags (`todo/search-tag`) | ❌ | ✅ | now passes |
| Every word in the search must match (`todo/search-words`) | ❌ | ✅ | now passes |
| Search combines with the status, tag and priority filters (`todo/search-combines`) | ❌ | ✅ | now passes |
| The clear button and Esc clear the search and show all tasks again (`todo/search-clear`) | ❌ | ✅ | now passes |
| No matches shows a message naming the search (`todo/search-no-match`) | ❌ | ✅ | now passes |
| Search does not change the count footer (`todo/search-footer`) | ❌ | ✅ | now passes |
| A reload starts with an empty search (`todo/search-reload`) | ❌ | ✅ | now passes |
| The search box is labelled and keyboard reachable (`todo/search-a11y`) | ❌ | ✅ | now passes |
| Search and clearing are logged (`todo/search-logs`) | ❌ | ✅ | now passes |

## Action log comparison (front end / back end)

| Step | Difference | New log |
|---|---|---|
| `todo/search-title` | + backend:tasks.getAll ×2, frontend:filter.search  | frontend:task.add ×2, backend:tasks.add ×2, backend:tasks.getAll ×4, frontend:filter.search |
| `todo/search-tag` | + backend:tasks.getAll ×2, frontend:filter.search  | backend:tasks.getAll ×2, frontend:filter.search |
| `todo/search-words` | + backend:tasks.getAll ×3, frontend:filter.search ×2  | backend:tasks.getAll ×3, frontend:filter.search ×2 |
| `todo/search-combines` | + backend:tasks.getAll ×8, frontend:filter.search, frontend:filter.status ×2, frontend:filter.tag ×2, frontend:filter.priority ×2  | frontend:task.complete, backend:tasks.put, backend:tasks.getAll ×9, frontend:filter.search, frontend:filter.status ×2, frontend:filter.tag ×2, frontend:filter.p |
| `todo/search-clear` | + backend:tasks.getAll ×4, frontend:filter.search ×2, frontend:filter.search.clear ×2  | backend:tasks.getAll ×4, frontend:filter.search ×2, frontend:filter.search.clear ×2 |
| `todo/search-no-match` | + backend:tasks.getAll ×2, frontend:filter.search  | backend:tasks.getAll ×2, frontend:filter.search |
| `todo/search-footer` | + backend:tasks.getAll ×2, frontend:filter.search  | backend:tasks.getAll ×2, frontend:filter.search |
| `todo/search-reload` | + backend:tasks.getAll ×2, frontend:filter.search  | backend:tasks.getAll ×2, frontend:filter.search |

## Unit tests

Before: 65/65 passing · After: 70/70 passing

<details><summary>All unit tests</summary>

| Test | Before | After |
|---|---|---|
| evals: browser: an explicit Chrome path that does not exist is not used | ✅ | ✅ |
| evals: browser: ignores a missing or partly written DevToolsActivePort | ✅ | ✅ |
| evals: browser: reads the port Chrome picked from DevToolsActivePort | ✅ | ✅ |
| evals: command: heredoc bodies are skipped, the line around them is kept | ✅ | ✅ |
| evals: command: program names drop paths, quotes, .exe and wrappers | ✅ | ✅ |
| evals: command: redirections are not separators | ✅ | ✅ |
| evals: command: separators inside quotes are data | ✅ | ✅ |
| evals: command: shell -c scripts are exposed for a second look | ✅ | ✅ |
| evals: command: splits on ; && \|\| \| & and newlines | ✅ | ✅ |
| evals: guard: .env file detection | ✅ | ✅ |
| evals: guard: allows everyday commands | ✅ | ✅ |
| evals: guard: blocked commands hidden behind a shell -c or quotes still block | ✅ | ✅ |
| evals: guard: blocks force pushes | ✅ | ✅ |
| evals: guard: blocks piping downloads into a shell | ✅ | ✅ |
| evals: guard: blocks reading .env files | ✅ | ✅ |
| evals: guard: blocks rm -rf in its usual spellings | ✅ | ✅ |
| evals: guard: hook output denies with a reason, or says nothing | ✅ | ✅ |
| evals: guard: text that only mentions a blocked command passes | ✅ | ✅ |
| evals: guard: the hook script denies a force push and logs only to its own project | ✅ | ✅ |
| evals: hook: a failing eval blocks with the failures | ✅ | ✅ |
| evals: hook: a passing eval adds context and does not block | ✅ | ✅ |
| evals: hook: a test run in the same line as the eval runner still triggers | ✅ | ✅ |
| evals: hook: ignores other commands and the eval runner itself | ✅ | ✅ |
| evals: hook: picks the issue from the branch checks file | ✅ | ✅ |
| evals: hook: reads the eval verdict and failures | ✅ | ✅ |
| evals: hook: script exits quietly for non-test commands and when disabled | ✅ | ✅ |
| evals: hook: text that only mentions a test command does not trigger, and says why | ✅ | ✅ |
| evals: hook: triggers on test commands | ✅ | ✅ |
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
| evals: ticket-text: <details> blocks and hidden elements | ✅ | ✅ |
| evals: ticket-text: CLI reads gh JSON and exits 2 when content was hidden | ✅ | ✅ |
| evals: ticket-text: clean bodies pass through unchanged | ✅ | ✅ |
| evals: ticket-text: invisible characters are removed and reported | ✅ | ✅ |
| evals: ticket-text: issue 16 keeps the footer request and strips the hidden comment | ✅ | ✅ |
| evals: ticket-text: multi-line, multiple and unterminated comments | ✅ | ✅ |
| evals: ticket-text: report flags hidden content | ✅ | ✅ |
| todo: counts: a task without a done field counts as open | ✅ | ✅ |
| todo: counts: all done | ✅ | ✅ |
| todo: counts: all open | ✅ | ✅ |
| todo: counts: empty list | ✅ | ✅ |
| todo: counts: mixed open and done | ✅ | ✅ |
| todo: priority: labels | ✅ | ✅ |
| todo: priority: missing or unknown priority counts as medium | ✅ | ✅ |
| todo: priority: sorts high to low, then by due date with undated last | ✅ | ✅ |
| todo: recurrence: badge labels | ✅ | ✅ |
| todo: recurrence: every N days crosses a month | ✅ | ✅ |
| todo: recurrence: form choices map to rules | ✅ | ✅ |
| todo: recurrence: monthly clamps to the last day of the month | ✅ | ✅ |
| todo: recurrence: monthly rolls over the year | ✅ | ✅ |
| todo: recurrence: toForm round-trips with fromForm | ✅ | ✅ |
| todo: recurrence: weekly across a DST change keeps the date | ✅ | ✅ |
| todo: recurrence: weekly adds 7 days | ✅ | ✅ |
| todo: search: case-insensitive partial match on the title | — | ✅ |
| todo: search: empty or blank query matches everything | — | ✅ |
| todo: search: every word must match (title or tag) | — | ✅ |
| todo: search: matches tags too | — | ✅ |
| todo: search: tasks without tags or title do not break | — | ✅ |

</details>

## Console errors

_None._
