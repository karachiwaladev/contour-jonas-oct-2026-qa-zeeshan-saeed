#!/usr/bin/env node
// Change eval: compares the previous state (--base) with the new state and fails if anything was
// skipped. See evals/README.md.
//
//   node evals/run-eval.mjs --base origin/main [--head <ref>] [--issue N] [--out file] [--screenshots dir] [--chrome path]
//
// Without --head the new state is the working tree (committed or not). Exit code 1 = eval failed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseNameStatus, verdict } from './lib/rules.mjs';
import { runScenario } from './lib/browser.mjs';
import { buildReport } from './lib/report.mjs';

const args = parseArgs(process.argv.slice(2));
if (!args.base) {
  console.error('usage: node evals/run-eval.mjs --base <ref> [--head <ref>] [--issue N] [--out file] [--screenshots dir]');
  process.exit(2);
}

const evalsDir = path.dirname(fileURLToPath(import.meta.url));
const root = git(['rev-parse', '--show-toplevel'], evalsDir).trim();
const UNIT_SUITES = [{ project: 'todo', dir: 'todo/tests' }, { project: 'evals', dir: 'evals/tests' }];
const SCENARIOS = ['todo'];

const baseSha = git(['rev-parse', args.base]).trim();
const headSha = git(['rev-parse', args.head ?? 'HEAD']).trim();
const mergeBase = git(['merge-base', baseSha, headSha]).trim();
const changes = args.head ? parseNameStatus(git(['diff', '--name-status', `${mergeBase}...${headSha}`])) : workingTreeChanges(mergeBase);

const worktrees = [];
try {
  const baseRoot = addWorktree(mergeBase);
  const headRoot = args.head ? addWorktree(headSha) : root;
  console.log(`Previous state: ${args.base} (${mergeBase.slice(0, 7)})  New state: ${args.head ?? 'working tree'} (${headSha.slice(0, 7)})`);
  console.log(`${changes.length} changed file(s)`);

  const baseRun = await runState(baseRoot, {});
  const headRun = await runState(headRoot, { screenshots: args.screenshots });

  const checksFile = args.issue && path.join(headRoot, 'evals', 'checks', `issue-${args.issue}.json`);
  const checks = checksFile && fs.existsSync(checksFile) ? JSON.parse(fs.readFileSync(checksFile, 'utf8').replace(/^﻿/, '')) : [];
  if (args.issue && !checks.length) console.warn(`No acceptance checks found for issue #${args.issue} (evals/checks/issue-${args.issue}.json)`);

  const flatten = run => ({ steps: run.browser.steps, unit: run.unit, consoleErrors: run.browser.consoleErrors });
  const result = verdict({ changes, base: flatten(baseRun), head: flatten(headRun), checks, inCI: !!process.env.GITHUB_ACTIONS });

  const title = args.issue ? `issue #${args.issue}` : `${args.head ?? 'working tree'} vs ${args.base}`;
  const report = buildReport({
    title, changes, result, baseRun, headRun,
    base: { ref: args.base, sha: mergeBase },
    head: { ref: args.head ?? 'working tree', sha: headSha },
  });
  const out = path.resolve(args.out ?? path.join(root, 'evals', 'reports', args.issue ? `issue-${args.issue}.md` : 'latest.md'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, report);

  console.log(result.pass ? 'EVAL PASSED' : 'EVAL FAILED');
  for (const f of result.failures) console.log(`  - ${f}`);
  console.log(`Report: ${path.relative(process.cwd(), out)}`);
  process.exitCode = result.pass ? 0 : 1;
} finally {
  for (const dir of worktrees) {
    try { git(['worktree', 'remove', '--force', dir]); } catch { fs.rmSync(dir, { recursive: true, force: true }); }
  }
  if (worktrees.length) git(['worktree', 'prune']);
}

async function runState(stateRoot, { screenshots }) {
  const unit = runUnitTests(stateRoot);
  const browser = { steps: {}, consoleErrors: [] };
  for (const name of SCENARIOS) {
    // The new state's scenario is used for both states, so results are directly comparable.
    const scenario = await import(pathToFileURL(path.join(evalsDir, 'scenarios', `${name}.mjs`)));
    const run = await runScenario(path.join(stateRoot, scenario.appDir), scenario, { chrome: args.chrome, screenshotDir: screenshots });
    if (run.skipped) browser.skipped = run.skipped;
    for (const [id, r] of Object.entries(run.steps)) browser.steps[`${name}/${id}`] = r;
    browser.consoleErrors.push(...run.consoleErrors);
  }
  return { unit, browser };
}

function runUnitTests(stateRoot) {
  const results = {};
  for (const suite of UNIT_SUITES) {
    const dir = path.join(stateRoot, suite.dir);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.test.mjs')).map(f => path.join(suite.dir, f));
    if (!files.length) continue;
    let tap;
    try {
      tap = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: stateRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      tap = err.stdout ?? ''; // failing tests exit non-zero; the TAP output still has the results
    }
    for (const line of tap.split('\n')) {
      const m = line.match(/^\s*(not )?ok \d+ - (.+?)(?:\s+#\s*(?:SKIP|TODO).*)?$/);
      if (m && !m[2].endsWith('.mjs')) results[`${suite.project}: ${m[2].trim()}`] = { ok: !m[1] };
    }
  }
  return results;
}

function addWorktree(sha) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-state-'));
  git(['worktree', 'add', '--detach', '--quiet', dir, sha]);
  worktrees.push(dir);
  return dir;
}

function workingTreeChanges(fromSha) {
  const tracked = parseNameStatus(git(['diff', '--name-status', fromSha]));
  const untracked = git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
    .map(p => ({ status: 'A', path: p.replace(/\\/g, '/') }));
  return [...tracked, ...untracked].filter(c => !c.path.startsWith('evals/reports/'));
}

function git(argv, cwd = root) {
  return execFileSync('git', argv, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
  }
  return out;
}
