// Pure rule functions for the change eval. No I/O, so evals/tests can cover every rule.

// Each project: where its code lives, and which paths count as its tests/verification.
export const PROJECTS = {
  todo: { dir: 'todo', testPaths: ['todo/tests/', 'evals/scenarios/todo.mjs'] },
  evals: { dir: 'evals', testPaths: ['evals/tests/'] },
};

const CODE_FILE = /\.(m?js|html|css)$/;
const NOT_CODE_DIRS = ['/screenshots/', '/reports/', '/checks/'];

/** Parse `git diff --name-status` output into [{ status, path }]. Renames use the new path. */
export function parseNameStatus(text) {
  return text.split('\n').filter(Boolean).map(line => {
    const parts = line.split('\t');
    return { status: parts[0][0], path: parts[parts.length - 1].replace(/\\/g, '/') };
  });
}

/** Sort changed files into code / tests / other per project, plus files outside any project. */
export function classifyChanges(changes, projects = PROJECTS) {
  const byProject = Object.fromEntries(Object.keys(projects).map(name => [name, { code: [], tests: [], other: [] }]));
  const outside = [];
  for (const change of changes) {
    const isTestOf = name => projects[name].testPaths.some(p => change.path.startsWith(p));
    const name = Object.keys(projects).find(isTestOf)
      ?? Object.keys(projects).find(n => change.path.startsWith(projects[n].dir + '/'));
    if (!name) { outside.push(change); continue; }
    const kind = isTestOf(name) ? 'tests'
      : CODE_FILE.test(change.path) && !NOT_CODE_DIRS.some(d => change.path.includes(d)) ? 'code'
      : 'other';
    byProject[name][kind].push(change);
  }
  return { byProject, outside };
}

/** Rule: a project's code may not change unless its tests or browser scenario change too. */
export function checkSkippedTests(classified) {
  return Object.entries(classified.byProject)
    .filter(([, c]) => c.code.length && !c.tests.length)
    .map(([name, c]) => `${name}: code changed without test or scenario changes (${c.code.map(f => f.path).join(', ')})`);
}

/** Rule: anything that passed in the previous state must still exist and pass. */
export function findRegressions(base, head) {
  const failures = [];
  for (const [kind, label] of [['steps', 'browser step'], ['unit', 'unit test']]) {
    for (const [id, result] of Object.entries(base[kind] ?? {})) {
      if (!result.ok) continue;
      const now = head[kind]?.[id];
      if (!now) failures.push(`${label} "${id}" passed before but no longer runs (removed or skipped)`);
      else if (!now.ok) failures.push(`${label} "${id}" passed before but now fails: ${now.detail ?? ''}`.trim());
    }
  }
  return failures;
}

/** Rule: every current browser step and unit test must pass. */
export function findCurrentFailures(head) {
  return [
    ...Object.entries(head.steps ?? {}).filter(([, r]) => !r.ok).map(([id, r]) => `browser step "${id}" fails: ${r.detail ?? ''}`.trim()),
    ...Object.entries(head.unit ?? {}).filter(([, r]) => !r.ok).map(([id]) => `unit test "${id}" fails`),
  ];
}

/** Rule: the app must not log console errors. */
export function checkConsoleErrors(head) {
  return (head.consoleErrors ?? []).map(e => `console error: ${e}`);
}

/**
 * Rule: every acceptance check from the approved plan needs a recorded, passing result.
 * verifiedBy: "scenario:<stepId>" | "unit:<test name>" | "files:<a>,<b>" | "ci" | "manual" (needs `evidence`).
 */
export function checkAcceptance(checks, head, { changes = [], inCI = false } = {}) {
  return checks.map(check => {
    const [kind, ref = ''] = check.verifiedBy.split(/:(.*)/s);
    let status = 'missing';
    let detail = 'no recorded result';
    if (kind === 'scenario') {
      const r = head.steps?.[ref];
      if (r) { status = r.ok ? 'pass' : 'fail'; detail = r.detail ?? ''; }
    } else if (kind === 'unit') {
      const entry = Object.entries(head.unit ?? {}).find(([name]) => name.endsWith(ref));
      if (entry) { status = entry[1].ok ? 'pass' : 'fail'; detail = entry[0]; }
    } else if (kind === 'files') {
      const missing = ref.split(',').filter(f => !changes.some(c => c.path === f.trim()));
      status = missing.length ? 'fail' : 'pass';
      detail = missing.length ? `not changed: ${missing.join(', ')}` : `changed: ${ref}`;
    } else if (kind === 'ci') {
      status = inCI ? 'pass' : 'deferred';
      detail = inCI ? 'running in GitHub Actions' : 'verified by the GitHub Actions run on the PR';
    } else if (kind === 'manual') {
      if (check.evidence) { status = 'pass'; detail = check.evidence; }
      else detail = 'manual check has no evidence';
    }
    return { ...check, status, detail };
  });
}

/** Multiset difference of action lists: what the new state logs that the old one didn't, and vice versa. */
export function diffActions(before = [], after = []) {
  const count = list => list.reduce((m, a) => m.set(a, (m.get(a) ?? 0) + 1), new Map());
  const b = count(before ?? []);
  const a = count(after ?? []);
  const added = [];
  const removed = [];
  for (const [action, n] of a) for (let i = (b.get(action) ?? 0); i < n; i++) added.push(action);
  for (const [action, n] of b) for (let i = (a.get(action) ?? 0); i < n; i++) removed.push(action);
  return { added, removed };
}

/** Combine every rule into a verdict. */
export function verdict({ changes, base, head, checks = [], inCI = false }) {
  const classified = classifyChanges(changes);
  const acceptance = checkAcceptance(checks, head, { changes, inCI });
  const failures = [
    ...checkSkippedTests(classified),
    ...findRegressions(base, head),
    ...findCurrentFailures(head),
    ...checkConsoleErrors(head),
    ...acceptance.filter(c => c.status === 'fail' || c.status === 'missing')
      .map(c => `acceptance check "${c.id}" ${c.status === 'fail' ? 'fails' : 'has no result'}: ${c.detail}`),
  ];
  return { pass: failures.length === 0, failures, classified, acceptance };
}
