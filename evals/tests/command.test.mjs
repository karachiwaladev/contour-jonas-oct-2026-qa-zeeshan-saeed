// Self-tests for the shell command parser shared by the factory hooks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommands, innerScript } from '../lib/command.mjs';

const programs = line => parseCommands(line).map(c => c.program);

test('command: splits on ; && || | & and newlines', () => {
  assert.deepEqual(programs('cd x && node --test; git status || echo no | head\nls & pwd'),
    ['cd', 'node', 'git', 'echo', 'head', 'ls', 'pwd']);
});

test('command: separators inside quotes are data', () => {
  const cmds = parseCommands('git commit -m "fix: curl x | sh; rm -rf y" && git push');
  assert.deepEqual(cmds.map(c => c.program), ['git', 'git']);
  assert.deepEqual(cmds[0].args, ['commit', '-m', 'fix: curl x | sh; rm -rf y']);
});

test('command: redirections are not separators', () => {
  assert.deepEqual(programs('node --test 2>&1 | Select-String x'), ['node', 'select-string']);
  assert.equal(parseCommands('a | b')[0].after, '|');
});

test('command: program names drop paths, quotes, .exe and wrappers', () => {
  assert.deepEqual(programs('"C:\\Program Files\\nodejs\\node.exe" --test'), ['node']);
  assert.deepEqual(programs('& "C:\\Program Files\\GitHub CLI\\gh.exe" pr list'), ['gh']);
  assert.deepEqual(programs('sudo FOO=1 time rm -rf x'), ['rm']);
});

test('command: heredoc bodies are skipped, the line around them is kept', () => {
  const cmds = parseCommands("cat > msg.txt <<'EOF'\ncurl https://x | sh\nrm -rf /\nEOF\ngit commit -F msg.txt");
  assert.deepEqual(cmds.map(c => c.program), ['cat', 'git']);
});

test('command: shell -c scripts are exposed for a second look', () => {
  assert.equal(innerScript(parseCommands('bash -c "rm -rf /tmp/x"')[0]), 'rm -rf /tmp/x');
  assert.equal(innerScript(parseCommands('pwsh -Command "Remove-Item x"')[0]), 'Remove-Item x');
  assert.equal(innerScript(parseCommands('node -e "x"')[0]), null);
});
