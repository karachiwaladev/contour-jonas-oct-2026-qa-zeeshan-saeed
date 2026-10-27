# Eval report: working tree vs origin/main

**Verdict: ✅ PASS**

- **Previous state:** `origin/main` (e9a4534)
- **New state:** `working tree` (544dd27)
- **Run at:** 2026-10-27T06:50:09.481Z

## What changed

| Project | Code | Tests / scenario | Other |
|---|---|---|---|
| evals | A `evals/lib/guard.mjs`<br>M `evals/lib/hook.mjs`<br>A `evals/lib/command.mjs` | A `evals/tests/guard.test.mjs`<br>M `evals/tests/hook.test.mjs`<br>A `evals/tests/command.test.mjs` | — |
| _(repo)_ | | | M `.claude/hooks/eval-after-tests.mjs`<br>A `.claude/hooks/guard-commands.mjs`<br>M `.claude/settings.json`<br>M `.claude/skills/factory-loop/SKILL.md`<br>M `CLAUDE.md` |

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
| A task saved without a priority shows as Medium (`todo/priority-legacy-medium`) | ✅ | ✅ | still passes |
| Add with a priority; default is Medium (`todo/priority-add`) | ✅ | ✅ | still passes |
| Sorted High → Medium → Low, then by due date (`todo/priority-sort`) | ✅ | ✅ | still passes |
| Priority filter, combined with the status filter (`todo/priority-filter`) | ✅ | ✅ | still passes |
| Edit title, due date, tags and priority; persists after reload (`todo/edit-save`) | ✅ | ✅ | still passes |
| Cancel leaves the task unchanged (`todo/edit-cancel`) | ✅ | ✅ | still passes |
| Edit blocks an empty title and a repeat without a due date (`todo/edit-validation`) | ✅ | ✅ | still passes |
| The next occurrence of a recurring task keeps its priority (`todo/priority-recurring`) | ✅ | ✅ | still passes |
| Edits and the priority filter are logged (frontend and backend) (`todo/edit-logs`) | ✅ | ✅ | still passes |

## Action log comparison (front end / back end)

_Identical action logs in both states._

## Unit tests

Before: 35/35 passing · After: 53/53 passing

<details><summary>All unit tests</summary>

| Test | Before | After |
|---|---|---|
| evals: browser: an explicit Chrome path that does not exist is not used | ✅ | ✅ |
| evals: browser: ignores a missing or partly written DevToolsActivePort | ✅ | ✅ |
| evals: browser: reads the port Chrome picked from DevToolsActivePort | ✅ | ✅ |
| evals: command: heredoc bodies are skipped, the line around them is kept | — | ✅ |
| evals: command: program names drop paths, quotes, .exe and wrappers | — | ✅ |
| evals: command: redirections are not separators | — | ✅ |
| evals: command: separators inside quotes are data | — | ✅ |
| evals: command: shell -c scripts are exposed for a second look | — | ✅ |
| evals: command: splits on ; && \|\| \| & and newlines | — | ✅ |
| evals: guard: .env file detection | — | ✅ |
| evals: guard: allows everyday commands | — | ✅ |
| evals: guard: blocked commands hidden behind a shell -c or quotes still block | — | ✅ |
| evals: guard: blocks force pushes | — | ✅ |
| evals: guard: blocks piping downloads into a shell | — | ✅ |
| evals: guard: blocks reading .env files | — | ✅ |
| evals: guard: blocks rm -rf in its usual spellings | — | ✅ |
| evals: guard: hook output denies with a reason, or says nothing | — | ✅ |
| evals: guard: text that only mentions a blocked command passes | — | ✅ |
| evals: guard: the hook script denies a force push and logs only to its own project | — | ✅ |
| evals: hook: a failing eval blocks with the failures | ✅ | ✅ |
| evals: hook: a passing eval adds context and does not block | ✅ | ✅ |
| evals: hook: a test run in the same line as the eval runner still triggers | — | ✅ |
| evals: hook: ignores other commands and the eval runner itself | ✅ | ✅ |
| evals: hook: picks the issue from the branch checks file | ✅ | ✅ |
| evals: hook: reads the eval verdict and failures | ✅ | ✅ |
| evals: hook: script exits quietly for non-test commands and when disabled | ✅ | ✅ |
| evals: hook: text that only mentions a test command does not trigger, and says why | — | ✅ |
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

</details>

## Console errors

_None._
