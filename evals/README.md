# Evals

A change eval for every AI or developer code change (Ticket #12). It checks the **previous state**, the
**new state** and **what changed**, and fails if anything was skipped.

## Run

```
node evals/run-eval.mjs --base origin/main --issue <n>
```

| Option | Meaning |
|--------|---------|
| `--base <ref>` | Previous state (required). The merge base with the new state is used. |
| `--head <ref>` | New state. Default: the working tree, so uncommitted changes count. |
| `--issue <n>` | Load acceptance checks from `checks/issue-<n>.json`; report goes to `reports/issue-<n>.md`. |
| `--out <file>` | Report path (default `reports/latest.md` without `--issue`). |
| `--screenshots <dir>` | Save a screenshot of each step marked `screenshot: true`. |
| `--chrome <path>` | Chrome/Edge binary (or set `CHROME_PATH`). |

Exit code `0` = pass, `1` = fail. Needs Node 22+ and Chrome or Edge. No npm install.

## What it does

1. **Diff:** lists changed files per project as code / tests / other.
2. **Both states:** checks the previous state out into a temporary `git worktree` (removed afterwards), then runs the
   unit tests (`todo/tests`, `evals/tests`) and the browser scenario (`scenarios/todo.mjs`, driven over the Chrome
   DevTools protocol) on both. The new state's scenario is used for both, so results line up step by step.
3. **Action logs:** records the app's `frontend` and `backend` log entries for each step and reports the difference.
4. **Verdict:** fails if
   - a project's code changed without changes to its tests or scenario,
   - something that passed before now fails or no longer runs (a regression or skipped check),
   - any current browser step or unit test fails,
   - the app logged a console error,
   - an acceptance check has no passing result.
5. **Report:** markdown with the verdict, the change, the acceptance checks, before/after per step, the log comparison and the unit tests.

## Acceptance checks

`checks/issue-<n>.json` holds the approved plan's checks: `{ id, description, verifiedBy, evidence? }`, where
`verifiedBy` is one of:

- `scenario:<project>/<step>`: a browser step.
- `unit:<test name>`: a unit test, or an eval self-test.
- `files:<a>,<b>`: these files must be changed.
- `ci`: satisfied by the GitHub Actions run (shown as deferred locally).
- `manual`: needs a non-empty `evidence`.

## Projects

Add a project by listing it in `PROJECTS` (`lib/rules.mjs`), its test folder in `UNIT_SUITES` and its scenario
in `SCENARIOS` (`run-eval.mjs`).

## Hook: eval right after tests

`.claude/settings.json` registers a Claude Code `PostToolUse` hook (`.claude/hooks/eval-after-tests.mjs`).
After every shell command the AI runs, it checks whether that was a test run (`node --test`, `npm`/`pnpm`/`yarn test`).
It judges the commands the line actually runs (`lib/command.mjs` splits on `;`, `&&`, `|`, newlines, skipping quoted
text and heredoc bodies), so a quoted or echoed mention of `--test` doesn't trigger it, and a test run on the same
line as `run-eval.mjs` still does. If it was a test run, it runs this eval straight away (base `origin/main`, or `EVAL_BASE`; issue from the branch's
`checks/issue-N.json`):

- **pass:** the verdict is added to the AI's context.
- **fail:** the hook returns `decision: "block"` with the failures, so the AI must fix them before carrying on.

Each run is logged to `.claude/logs/eval-hook.jsonl`, and the last report is `.claude/logs/eval-latest.md` (both git-ignored).
Skips that could look like a missed trigger are logged too (`verdict: "skip"` with a reason: `EVAL_HOOK=off`, or a
line that mentions a test command without running one). The hook tests log into a temp folder, never this one.
Set `EVAL_HOOK=off` to disable it. The runner sets this for its own child processes and never re-triggers itself.
The decision logic is in `lib/hook.mjs`, tested by `tests/hook.test.mjs`.

## CI

`.github/workflows/eval.yml` runs the same eval on every pull request (base = the PR's target branch, issue = the
PR's `Closes #N`) and fails the check if the eval fails. The report is shown in the job summary.

## Hidden content in tickets (#16)

The factory acts only on what a reader of the rendered issue sees. `ticket-text.mjs` prints a ticket body's visible
text and flags anything hidden (HTML comments, `<details>` bodies, `hidden` or `display:none` elements, and zero-width
or bidi characters). It exits with code 2 when it stripped something:

    gh issue view N --json body | node evals/ticket-text.mjs

The logic is in `lib/ticket-text.mjs`, tested by `tests/ticket-text.test.mjs`. The factory-loop skill runs it on every ticket.
