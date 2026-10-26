// Self-tests: prove each eval rule catches what it is meant to catch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNameStatus, classifyChanges, checkSkippedTests, findRegressions, findCurrentFailures,
  checkConsoleErrors, checkAcceptance, diffActions, verdict } from '../lib/rules.mjs';
import { buildReport } from '../lib/report.mjs';

const change = (path, status = 'M') => ({ status, path });
const okRun = { steps: { 'todo/load': { ok: true } }, unit: { 'todo: a': { ok: true } }, consoleErrors: [] };

test('rules: parses git name-status output, including renames', () => {
  assert.deepEqual(parseNameStatus('M\ttodo/app.js\nR100\told.js\ttodo/new.js\n'), [change('todo/app.js'), change('todo/new.js', 'R')]);
});

test('rules: classifies code, tests and other files per project', () => {
  const { byProject, outside } = classifyChanges([
    change('todo/app.js'), change('todo/tests/x.test.mjs'), change('evals/scenarios/todo.mjs'),
    change('todo/screenshots/a.png'), change('evals/lib/rules.mjs'), change('README.md'),
  ]);
  assert.deepEqual(byProject.todo.code.map(c => c.path), ['todo/app.js']);
  assert.deepEqual(byProject.todo.tests.map(c => c.path), ['todo/tests/x.test.mjs', 'evals/scenarios/todo.mjs']);
  assert.deepEqual(byProject.todo.other.map(c => c.path), ['todo/screenshots/a.png']);
  assert.deepEqual(byProject.evals.code.map(c => c.path), ['evals/lib/rules.mjs']);
  assert.deepEqual(outside.map(c => c.path), ['README.md']);
});

test('rules: fails when code changes without tests', () => {
  const failures = checkSkippedTests(classifyChanges([change('todo/app.js')]));
  assert.equal(failures.length, 1);
  assert.match(failures[0], /todo: code changed without test or scenario changes/);
});

test('rules: passes when code changes come with tests, or only docs change', () => {
  assert.deepEqual(checkSkippedTests(classifyChanges([change('todo/app.js'), change('evals/scenarios/todo.mjs')])), []);
  assert.deepEqual(checkSkippedTests(classifyChanges([change('todo/README.md'), change('CLAUDE.md')])), []);
});

test('rules: fails on a regression', () => {
  const head = { steps: { 'todo/load': { ok: false, detail: 'broken' } }, unit: { 'todo: a': { ok: true } } };
  assert.match(findRegressions(okRun, head)[0], /"todo\/load" passed before but now fails: broken/);
});

test('rules: fails when a previously passing check is removed or skipped', () => {
  assert.match(findRegressions(okRun, { steps: {}, unit: { 'todo: a': { ok: true } } })[0], /no longer runs/);
});

test('rules: a step that failed before and passes now is not a regression', () => {
  const base = { steps: { 'todo/new': { ok: false } }, unit: {} };
  assert.deepEqual(findRegressions(base, { steps: { 'todo/new': { ok: true } }, unit: {} }), []);
});

test('rules: fails on currently failing steps or unit tests', () => {
  assert.equal(findCurrentFailures({ steps: { s: { ok: false } }, unit: { u: { ok: false } } }).length, 2);
});

test('rules: fails on console errors', () => {
  assert.deepEqual(checkConsoleErrors({ consoleErrors: ['TypeError: x is undefined'] }), ['console error: TypeError: x is undefined']);
});

test('rules: fails when an acceptance check has no result', () => {
  const [c] = checkAcceptance([{ id: 'c1', description: 'd', verifiedBy: 'scenario:todo/missing' }], okRun);
  assert.equal(c.status, 'missing');
  const [m] = checkAcceptance([{ id: 'c2', description: 'd', verifiedBy: 'manual' }], okRun);
  assert.equal(m.status, 'missing');
});

test('rules: resolves scenario, unit, files and ci checks', () => {
  const checks = [
    { id: 'a', verifiedBy: 'scenario:todo/load' }, { id: 'b', verifiedBy: 'unit:a' },
    { id: 'c', verifiedBy: 'files:CLAUDE.md' }, { id: 'd', verifiedBy: 'ci' },
  ];
  const statuses = checkAcceptance(checks, okRun, { changes: [change('CLAUDE.md')] }).map(c => c.status);
  assert.deepEqual(statuses, ['pass', 'pass', 'pass', 'deferred']);
  assert.equal(checkAcceptance([{ id: 'd', verifiedBy: 'ci' }], okRun, { inCI: true })[0].status, 'pass');
});

test('rules: diffs action logs as multisets', () => {
  assert.deepEqual(diffActions(['frontend:task.add', 'backend:tasks.add'], ['frontend:task.add', 'backend:tasks.add', 'backend:tasks.add']),
    { added: ['backend:tasks.add'], removed: [] });
});

test('rules: verdict combines every rule', () => {
  const bad = verdict({ changes: [change('todo/app.js')], base: okRun, head: { ...okRun, consoleErrors: ['boom'] } });
  assert.equal(bad.pass, false);
  assert.equal(bad.failures.length, 2);
  assert.equal(verdict({ changes: [change('CLAUDE.md')], base: okRun, head: okRun }).pass, true);
});

test('report includes previous state, changes, checks and log comparison', () => {
  const head = { ...okRun, steps: { 'todo/load': { ok: true, name: 'Load', actions: ['frontend:task.add', 'backend:tasks.add'] } } };
  const base = { ...okRun, steps: { 'todo/load': { ok: true, name: 'Load', actions: ['frontend:task.add'] } } };
  const changes = [change('todo/app.js'), change('evals/scenarios/todo.mjs')];
  const checks = [{ id: 'a', description: 'Loads', verifiedBy: 'scenario:todo/load' }];
  const result = verdict({ changes, base, head, checks });
  const md = buildReport({
    title: 'issue #1', changes, result,
    base: { ref: 'origin/main', sha: 'aaaaaaaa' }, head: { ref: 'working tree', sha: 'bbbbbbbb' },
    baseRun: { unit: base.unit, browser: { steps: base.steps, consoleErrors: [] } },
    headRun: { unit: head.unit, browser: { steps: head.steps, consoleErrors: [] } },
  });
  for (const section of ['Verdict: ✅ PASS', 'Previous state:', '## What changed', '## Acceptance checks', '## Browser scenario', '## Action log comparison', '+ backend:tasks.add']) {
    assert.ok(md.includes(section), `missing "${section}"`);
  }
});
