import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const Search = createRequire(import.meta.url)('../search.js');

const groceries = { title: 'Buy Groceries', tags: ['home', 'shopping'] };

test('search: empty or blank query matches everything', () => {
  assert.equal(Search.matches(groceries, ''), true);
  assert.equal(Search.matches(groceries, '   '), true);
  assert.equal(Search.matches(groceries, undefined), true);
});

test('search: case-insensitive partial match on the title', () => {
  assert.equal(Search.matches(groceries, 'groc'), true);
  assert.equal(Search.matches(groceries, 'BUY'), true);
  assert.equal(Search.matches(groceries, 'milk'), false);
});

test('search: matches tags too', () => {
  assert.equal(Search.matches(groceries, 'shop'), true);
  assert.equal(Search.matches({ title: 'Pay rent', tags: [] }, 'shop'), false);
});

test('search: every word must match (title or tag)', () => {
  assert.equal(Search.matches(groceries, 'buy home'), true);
  assert.equal(Search.matches(groceries, 'buy work'), false);
});

test('search: tasks without tags or title do not break', () => {
  assert.equal(Search.matches({ title: 'Legacy task' }, 'legacy'), true);
  assert.equal(Search.matches({}, 'x'), false);
});
