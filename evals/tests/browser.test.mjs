// Self-tests for the browser driver's Chrome launch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDevToolsActivePort, findChrome } from '../lib/browser.mjs';

test('browser: reads the port Chrome picked from DevToolsActivePort', () => {
  assert.equal(parseDevToolsActivePort('45123\n/devtools/browser/abc-123\n'), 45123);
  assert.equal(parseDevToolsActivePort('9222\r\n/devtools/browser/x'), 9222);
});

test('browser: ignores a missing or partly written DevToolsActivePort', () => {
  for (const text of ['', '\n', 'abc\n', '0\n', '70000\n', undefined]) assert.equal(parseDevToolsActivePort(text), null, String(text));
});

test('browser: an explicit Chrome path that does not exist is not used', () => {
  assert.notEqual(findChrome('/no/such/chrome'), '/no/such/chrome');
});
