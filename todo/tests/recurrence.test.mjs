import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const Recurrence = createRequire(import.meta.url)('../recurrence.js');

test('recurrence: weekly adds 7 days', () => {
  assert.equal(Recurrence.nextDueDate('2026-10-26', { unit: 'week', every: 1 }), '2026-11-02');
});

test('recurrence: every N days crosses a month', () => {
  assert.equal(Recurrence.nextDueDate('2026-10-30', { unit: 'day', every: 3 }), '2026-11-02');
});

test('recurrence: monthly clamps to the last day of the month', () => {
  assert.equal(Recurrence.nextDueDate('2026-01-31', { unit: 'month', every: 1 }), '2026-02-28');
  assert.equal(Recurrence.nextDueDate('2028-01-31', { unit: 'month', every: 1 }), '2028-02-29');
});

test('recurrence: monthly rolls over the year', () => {
  assert.equal(Recurrence.nextDueDate('2026-12-15', { unit: 'month', every: 1 }), '2027-01-15');
});

test('recurrence: weekly across a DST change keeps the date', () => {
  assert.equal(Recurrence.nextDueDate('2026-03-28', { unit: 'week', every: 1 }), '2026-04-04');
});

test('recurrence: form choices map to rules', () => {
  assert.deepEqual(Recurrence.fromForm('daily'), { unit: 'day', every: 1 });
  assert.deepEqual(Recurrence.fromForm('custom', '3'), { unit: 'day', every: 3 });
  assert.equal(Recurrence.fromForm(''), null);
});

test('recurrence: badge labels', () => {
  assert.equal(Recurrence.label({ unit: 'week', every: 1 }), 'weekly');
  assert.equal(Recurrence.label({ unit: 'day', every: 3 }), 'every 3 days');
});
