#!/usr/bin/env node
// Show a ticket body as a reader sees it and flag hidden content (#16).
//   gh issue view N --json body | node evals/ticket-text.mjs
// Accepts the gh JSON ({ "body": ... }) or a raw body on stdin. Exits 2 when hidden content was stripped.
import fs from 'node:fs';
import { visibleText, formatReport } from './lib/ticket-text.mjs';

const raw = fs.readFileSync(0, 'utf8').replace(/^﻿/, '');
let body = raw;
try { const parsed = JSON.parse(raw); if (typeof parsed?.body === 'string') body = parsed.body; } catch { /* raw body */ }

const result = visibleText(body);
process.stdout.write(formatReport(result) + '\n');
process.exit(result.stripped.length ? 2 : 0);
