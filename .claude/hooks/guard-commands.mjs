#!/usr/bin/env node
// Claude Code PreToolUse hook: deny rm -rf, git push --force, curl | sh and reading .env files before they run.
// Backs up permissions.deny in .claude/settings.json, which matches by prefix and can miss chained or reordered forms.
// Every denial is appended to .claude/logs/guard.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { checkToolCall, guardResult } from '../../evals/lib/guard.mjs';

const input = JSON.parse(fs.readFileSync(0, 'utf8').replace(/^﻿/, '') || '{}');
const rule = checkToolCall(input.tool_name, input.tool_input ?? {});
if (!rule) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const logDir = path.join(root, '.claude', 'logs');
fs.mkdirSync(logDir, { recursive: true });
fs.appendFileSync(path.join(logDir, 'guard.jsonl'), JSON.stringify({
  ts: new Date().toISOString(), tool: input.tool_name, input: input.tool_input, rule,
}) + '\n');
process.stdout.write(JSON.stringify(guardResult(rule)));
