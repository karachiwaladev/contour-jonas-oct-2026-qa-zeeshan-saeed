// Markdown report for one eval run.
import { diffActions } from './rules.mjs';

const icon = ok => (ok ? '✅' : '❌');
const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 160);
const STATUS_ICON = { pass: '✅ pass', fail: '❌ fail', missing: '❌ no result', deferred: '⏳ deferred' };

export function buildReport({ title, base, head, changes, result, baseRun, headRun }) {
  const out = [];
  out.push(`# Eval report: ${title}`, '');
  out.push(`**Verdict: ${result.pass ? '✅ PASS' : '❌ FAIL'}**`, '');
  out.push(`- **Previous state:** \`${base.ref}\` (${base.sha.slice(0, 7)})`);
  out.push(`- **New state:** \`${head.ref}\` (${head.sha.slice(0, 7)})`);
  out.push(`- **Run at:** ${new Date().toISOString()}`, '');

  if (result.failures.length) {
    out.push('## Failures', '', ...result.failures.map(f => `- ${f}`), '');
  }

  out.push('## What changed', '');
  if (!changes.length) out.push('_No file changes between the two states._', '');
  else {
    out.push('| Project | Code | Tests / scenario | Other |', '|---|---|---|---|');
    for (const [name, c] of Object.entries(result.classified.byProject)) {
      if (!c.code.length && !c.tests.length && !c.other.length) continue;
      const list = files => files.map(f => `${f.status} \`${f.path}\``).join('<br>') || '—';
      out.push(`| ${name} | ${list(c.code)} | ${list(c.tests)} | ${list(c.other)} |`);
    }
    if (result.classified.outside.length) out.push(`| _(repo)_ | | | ${result.classified.outside.map(f => `${f.status} \`${f.path}\``).join('<br>')} |`);
    out.push('');
  }

  if (result.acceptance.length) {
    out.push('## Acceptance checks', '', '| Check | Verified by | Result | Detail |', '|---|---|---|---|');
    for (const c of result.acceptance) out.push(`| ${cell(c.description)} | \`${c.verifiedBy}\` | ${STATUS_ICON[c.status]} | ${cell(c.detail)} |`);
    out.push('');
  }

  out.push('## Browser scenario: previous vs new', '');
  if (headRun.browser.skipped) out.push(`_Skipped: ${headRun.browser.skipped}_`, '');
  else {
    out.push('| Step | Before | After | Change |', '|---|---|---|---|');
    for (const [id, now] of Object.entries(headRun.browser.steps)) {
      const was = baseRun.browser.steps?.[id];
      const change = !was ? 'new step' : was.ok === now.ok ? (now.ok ? 'still passes' : 'still fails') : now.ok ? 'now passes' : '**regression**';
      out.push(`| ${cell(now.name)} (\`${id}\`) | ${was ? icon(was.ok) : '—'} | ${icon(now.ok)} | ${change} |`);
    }
    out.push('');
  }

  out.push('## Action log comparison (front end / back end)', '');
  const rows = Object.entries(headRun.browser.steps ?? {}).map(([id, now]) => {
    const was = baseRun.browser.steps?.[id];
    if (!now.actions) return `| \`${id}\` | _no log available_ | |`;
    if (!was?.actions) return `| \`${id}\` | ${now.actions.length} entries (no log in previous state) | ${cell(summarise(now.actions))} |`;
    const { added, removed } = diffActions(was.actions, now.actions);
    if (!added.length && !removed.length) return null;
    return `| \`${id}\` | ${added.length ? '+ ' + cell(summarise(added)) : ''} ${removed.length ? '− ' + cell(summarise(removed)) : ''} | ${cell(summarise(now.actions))} |`;
  }).filter(Boolean);
  if (rows.length) out.push('| Step | Difference | New log |', '|---|---|---|', ...rows, '');
  else out.push('_Identical action logs in both states._', '');

  out.push('## Unit tests', '');
  const unitNames = new Set([...Object.keys(baseRun.unit), ...Object.keys(headRun.unit)]);
  const passed = run => Object.values(run.unit).filter(r => r.ok).length;
  out.push(`Before: ${passed(baseRun)}/${Object.keys(baseRun.unit).length} passing · After: ${passed(headRun)}/${Object.keys(headRun.unit).length} passing`, '');
  if (unitNames.size) {
    out.push('<details><summary>All unit tests</summary>', '', '| Test | Before | After |', '|---|---|---|');
    for (const name of [...unitNames].sort()) {
      const b = baseRun.unit[name]; const a = headRun.unit[name];
      out.push(`| ${cell(name)} | ${b ? icon(b.ok) : '—'} | ${a ? icon(a.ok) : '—'} |`);
    }
    out.push('', '</details>', '');
  }

  out.push('## Console errors', '');
  out.push(headRun.browser.consoleErrors?.length ? headRun.browser.consoleErrors.map(e => `- ${cell(e)}`).join('\n') : '_None._', '');
  return out.join('\n');
}

function summarise(actions) {
  const counts = actions.reduce((m, a) => m.set(a, (m.get(a) ?? 0) + 1), new Map());
  return [...counts].map(([a, n]) => (n > 1 ? `${a} ×${n}` : a)).join(', ');
}
