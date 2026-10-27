#!/usr/bin/env node
// Claude Code PostToolUse hook (#12): right after the AI runs a test command, run the change eval
// and feed the verdict back. A failing eval blocks (decision: "block") so the AI must fix it.
// Every run is appended to .claude/logs/eval-hook.jsonl. Set EVAL_HOOK=off to disable.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { classifyCommand, pickIssue, parseEvalOutput, hookResult } from '../../evals/lib/hook.mjs';

const input = JSON.parse(fs.readFileSync(0, 'utf8').replace(/^﻿/, '') || '{}');
const command = input.tool_input?.command ?? '';
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const logDir = path.join(root, '.claude', 'logs');
const log = row => {
  fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(path.join(logDir, 'eval-hook.jsonl'), JSON.stringify({ ts: new Date().toISOString(), command, ...row }) + '\n');
};

// Skips are logged when they could look like a missed trigger, so every "why didn't it run?" has an answer.
const decision = classifyCommand(command);
if (process.env.EVAL_HOOK === 'off') { if (decision.test) log({ verdict: 'skip', reason: 'EVAL_HOOK=off' }); process.exit(0); }
if (!decision.test) { if (decision.nearMiss) log({ verdict: 'skip', reason: decision.reason }); process.exit(0); }
if (!fs.existsSync(path.join(root, 'evals', 'run-eval.mjs'))) { log({ verdict: 'skip', reason: 'no evals/run-eval.mjs in this project' }); process.exit(0); }

const base = process.env.EVAL_BASE || 'origin/main';
const git = args => { try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };
const changed = [...git(['diff', '--name-only', `${base}...HEAD`]).split('\n'), ...git(['ls-files', '--others', '--exclude-standard']).split('\n')]
  .map(p => p.trim()).filter(Boolean);
const issue = pickIssue(changed);

fs.mkdirSync(logDir, { recursive: true });
const reportPath = path.join(logDir, 'eval-latest.md');
const args = [path.join('evals', 'run-eval.mjs'), '--base', base, '--out', reportPath, ...(issue ? ['--issue', String(issue)] : [])];

let stdout = '';
let stderr = '';
try {
  stdout = execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: { ...process.env, EVAL_HOOK: 'off' }, stdio: ['ignore', 'pipe', 'pipe'] });
} catch (err) {
  stdout = err.stdout ?? '';
  stderr = err.stderr || err.message;
}

const parsed = parseEvalOutput(stdout);
const failures = parsed.ran ? parsed.failures : [`the eval could not run: ${String(stderr).trim().split('\n').slice(-3).join(' ')}`];
const result = hookResult({ pass: parsed.pass, failures, reportPath: path.relative(root, reportPath), issue });

fs.appendFileSync(path.join(logDir, 'eval-hook.jsonl'), JSON.stringify({
  ts: new Date().toISOString(), command, base, issue, verdict: parsed.pass ? 'pass' : parsed.ran ? 'fail' : 'error', failures,
}) + '\n');
process.stdout.write(JSON.stringify(result));
