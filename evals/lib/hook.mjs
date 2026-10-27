// Decision logic for the "eval right after tests" Claude Code hook (.claude/hooks/eval-after-tests.mjs).
// Pure functions, so evals/tests can cover them.

import { parseCommands } from './command.mjs';

const runsTests = ({ program, args }) => (program === 'node' && args.includes('--test'))
  || (['npm', 'pnpm', 'yarn'].includes(program) && (args[0] === 'test' || (args[0] === 'run' && args[1] === 'test')));

/**
 * Whether a shell line runs tests, judged by the commands it runs (not its raw text), with the reason.
 * The eval runner's own command is not a test run; recursion is prevented by EVAL_HOOK=off in its child processes.
 */
export function classifyCommand(command = '') {
  const cmds = parseCommands(command);
  const test = cmds.find(runsTests);
  if (test) return { test: true, reason: `runs tests: ${test.raw}` };
  if (/--test\b|\b(npm|pnpm|yarn)(\.cmd)?\s+(run\s+)?test\b/.test(command)) {
    return { test: false, reason: 'mentions a test command but does not run one (quoted, heredoc or echo)', nearMiss: true };
  }
  return { test: false, reason: 'not a test command' };
}

/** True for shell lines that run tests. */
export function isTestCommand(command = '') {
  return classifyCommand(command).test;
}

/** The issue whose acceptance checks this branch adds (highest number if several), or null. */
export function pickIssue(changedPaths) {
  const issues = changedPaths
    .map(p => p.replace(/\\/g, '/').match(/^evals\/checks\/issue-(\d+)\.json$/)?.[1])
    .filter(Boolean)
    .map(Number);
  return issues.length ? Math.max(...issues) : null;
}

/** Read the verdict from run-eval's stdout. */
export function parseEvalOutput(stdout = '') {
  const pass = /^EVAL PASSED/m.test(stdout);
  const ran = pass || /^EVAL FAILED/m.test(stdout);
  const failures = stdout.split(/\r?\n/).filter(l => l.startsWith('  - ')).map(l => l.slice(4).trim());
  return { pass, ran, failures };
}

/** Hook output: context for the AI on a pass, a blocking reason with the failures otherwise. */
export function hookResult({ pass, failures = [], reportPath, issue }) {
  const scope = issue ? ` for issue #${issue}` : '';
  if (pass) {
    return { hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `Change eval${scope} passed right after this test run. Report: ${reportPath}` } };
  }
  return {
    decision: 'block',
    reason: [`Change eval${scope} FAILED right after this test run. Fix these before committing or opening a PR:`,
      ...failures.map(f => `- ${f}`), `Report: ${reportPath}`].join('\n'),
  };
}
