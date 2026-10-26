// Decision logic for the "eval right after tests" Claude Code hook (.claude/hooks/eval-after-tests.mjs).
// Pure functions, so evals/tests can cover them.

const TEST_COMMAND = /(^|[\s;&|("'\\/])(node(\.exe)?["']?\s+(?:[^;&|]*\s)?--test\b|(npm|pnpm|yarn)(\.cmd)?\s+(run\s+)?test\b)/;

/** True for shell commands that run tests. The eval runner itself never re-triggers the hook. */
export function isTestCommand(command = '') {
  if (/run-eval\.mjs/.test(command)) return false;
  return TEST_COMMAND.test(command);
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
