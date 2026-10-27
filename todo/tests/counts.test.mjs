import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const Counts = createRequire(import.meta.url)('../counts.js');

test('counts: empty list', () => {
  assert.deepEqual(Counts.summary([]), { open: 0, done: 0, text: '0 open · 0 done' });
});

test('counts: all open', () => {
  assert.equal(Counts.summary([{ done: false }, { done: false }, { done: false }]).text, '3 open · 0 done');
});

test('counts: mixed open and done', () => {
  assert.deepEqual(Counts.summary([{ done: true }, { done: false }, { done: true }, { done: false }, { done: false }]),
    { open: 3, done: 2, text: '3 open · 2 done' });
});

test('counts: all done', () => {
  assert.equal(Counts.summary([{ done: true }, { done: true }]).text, '0 open · 2 done');
});

test('counts: a task without a done field counts as open', () => {
  assert.equal(Counts.summary([{ title: 'legacy' }, { done: true }]).text, '1 open · 1 done');
});
