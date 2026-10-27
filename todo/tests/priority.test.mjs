import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Priority = require('../priority.js');
const Recurrence = require('../recurrence.js');

test('priority: missing or unknown priority counts as medium', () => {
  assert.equal(Priority.normalize(undefined), 'medium');
  assert.equal(Priority.normalize('urgent'), 'medium');
  assert.equal(Priority.normalize('high'), 'high');
});

test('priority: labels', () => {
  assert.equal(Priority.label('high'), 'High');
  assert.equal(Priority.label(undefined), 'Medium');
});

test('priority: sorts high to low, then by due date with undated last', () => {
  const tasks = [
    { title: 'low', priority: 'low', dueDate: '2026-01-01' },
    { title: 'medium-undated', priority: 'medium', dueDate: '' },
    { title: 'high-late', priority: 'high', dueDate: '2026-12-01' },
    { title: 'legacy', dueDate: '2026-02-01' },
    { title: 'high-soon', priority: 'high', dueDate: '2026-03-01' },
    { title: 'high-undated', priority: 'high', dueDate: '' },
  ];
  assert.deepEqual([...tasks].sort(Priority.compare).map(t => t.title),
    ['high-soon', 'high-late', 'high-undated', 'legacy', 'medium-undated', 'low']);
});

test('recurrence: toForm round-trips with fromForm', () => {
  for (const choice of ['daily', 'weekly', 'monthly']) {
    assert.equal(Recurrence.toForm(Recurrence.fromForm(choice)).choice, choice);
  }
  assert.deepEqual(Recurrence.toForm({ unit: 'day', every: 3 }), { choice: 'custom', every: 3 });
  assert.equal(Recurrence.toForm(null).choice, '');
});
