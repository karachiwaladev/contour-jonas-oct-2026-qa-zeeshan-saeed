// Self-tests for the "eval right after tests" hook.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { isTestCommand, classifyCommand, pickIssue, parseEvalOutput, hookResult } from '../lib/hook.mjs';

const hookScript = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '.claude', 'hooks', 'eval-after-tests.mjs');

test('hook: triggers on test commands', () => {
  for (const cmd of ['node --test todo/tests/', 'node --test --test-reporter=tap a.test.mjs', 'npm test', 'npm run test',
    'pnpm test', 'yarn test', 'cd x && node --test', '"C:\\Program Files\\nodejs\\node.exe" --test']) {
    assert.equal(isTestCommand(cmd), true, cmd);
  }
});

test('hook: ignores other commands and the eval runner itself', () => {
  for (const cmd of ['git status', 'node --check todo/app.js', 'npm install', 'echo node --testing',
    'node evals/run-eval.mjs --base origin/main', 'gh pr list', '']) {
    assert.equal(isTestCommand(cmd), false, cmd);
  }
});

test('hook: picks the issue from the branch checks file', () => {
  assert.equal(pickIssue(['todo/app.js', 'evals/checks/issue-12.json']), 12);
  assert.equal(pickIssue(['evals/checks/issue-12.json', 'evals\\checks\\issue-13.json']), 13);
  assert.equal(pickIssue(['todo/app.js']), null);
});

test('hook: reads the eval verdict and failures', () => {
  const out = 'Previous state: x\nEVAL FAILED\n  - todo: code changed without test or scenario changes (todo/app.js)\n  - console error: boom\nReport: r.md\n';
  assert.deepEqual(parseEvalOutput(out), { pass: false, ran: true, failures: ['todo: code changed without test or scenario changes (todo/app.js)', 'console error: boom'] });
  assert.equal(parseEvalOutput('EVAL PASSED\n').pass, true);
  assert.equal(parseEvalOutput('Error: Chrome not found').ran, false);
});

test('hook: a failing eval blocks with the failures', () => {
  const r = hookResult({ pass: false, failures: ['console error: boom'], reportPath: '.claude/logs/eval-latest.md', issue: 12 });
  assert.equal(r.decision, 'block');
  assert.match(r.reason, /issue #12 FAILED/);
  assert.match(r.reason, /- console error: boom/);
});

test('hook: a passing eval adds context and does not block', () => {
  const r = hookResult({ pass: true, reportPath: 'r.md' });
  assert.equal(r.decision, undefined);
  assert.equal(r.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.match(r.hookSpecificOutput.additionalContext, /passed/);
});

test('hook: a test run in the same line as the eval runner still triggers', () => {
  assert.equal(isTestCommand('node --test evals/tests/; node evals/run-eval.mjs --base origin/main'), true);
});

test('hook: text that only mentions a test command does not trigger, and says why', () => {
  for (const cmd of ['node -e "if (/--test/.test(x)) run()"', 'git commit -m "run node --test before pushing"',
    "cat > notes.md <<'EOF'\nnode --test todo/tests/\nEOF"]) {
    const d = classifyCommand(cmd);
    assert.equal(d.test, false, cmd);
    assert.equal(d.nearMiss, true, cmd);
  }
  assert.equal(classifyCommand('git status').nearMiss, undefined);
});

test('hook: script exits quietly for non-test commands and when disabled', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-hook-'));
  const run = (command, env = {}) => spawnSync(process.execPath, [hookScript], {
    input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }), encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: project, ...env },
  });
  const other = run('git status');
  assert.equal(other.status, 0);
  assert.equal(other.stdout, '');
  const disabled = run('node --test', { EVAL_HOOK: 'off' });
  assert.equal(disabled.status, 0);
  assert.equal(disabled.stdout, '');
  const rows = fs.readFileSync(path.join(project, '.claude', 'logs', 'eval-hook.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(rows.map(r => [r.verdict, r.reason]), [['skip', 'EVAL_HOOK=off']]);
  fs.rmSync(project, { recursive: true, force: true });
});
