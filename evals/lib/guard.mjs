// Decision logic for the PreToolUse guard (.claude/hooks/guard-commands.mjs): blocks destructive or risky tool calls
// before they run. Mirrors permissions.deny in .claude/settings.json. Pure functions, so evals/tests can cover them.

// Command boundaries: start, or after ; & | ( or a newline, optionally behind sudo.
const START = String.raw`(?:^|[;&|(\n]\s*)(?:sudo\s+)?`;

const SHELL_RULES = [
  {
    name: 'rm -rf',
    pattern: new RegExp(`${START}rm\\s+(?:[^;&|\\n]*\\s)?(?:-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|--recursive\\s+(?:[^;&|\\n]*\\s)?--force|--force\\s+(?:[^;&|\\n]*\\s)?--recursive|-r\\s+(?:[^;&|\\n]*\\s)?-f|-f\\s+(?:[^;&|\\n]*\\s)?-r)\\b`, 'i'),
  },
  {
    name: 'Remove-Item -Recurse -Force (PowerShell rm -rf)',
    pattern: new RegExp(`${START}(?:Remove-Item|rm|ri|del|rmdir|rd)\\b(?=[^;&|\\n]*\\s-Recurse\\b)(?=[^;&|\\n]*\\s-Force\\b)`, 'i'),
  },
  {
    name: 'git push --force',
    pattern: new RegExp(`${START}git\\b[^;&|\\n]*\\spush\\b[^;&|\\n]*(?:\\s--force(?:-with-lease|-if-includes)?\\b|\\s-[a-zA-Z]*f[a-zA-Z]*\\b|\\s\\+[^\\s]+)`, 'i'),
  },
  {
    name: 'curl | sh',
    pattern: /\b(?:curl|wget|iwr|irm|Invoke-WebRequest|Invoke-RestMethod)\b[^;&\n]*\|\s*(?:sudo\s+)?(?:(?:ba|z|da|k)?sh|iex|Invoke-Expression|python3?|node)\b/i,
  },
  {
    name: 'curl | sh',
    pattern: /\b(?:ba|z)?sh\s+(?:-c\s+)?["']?\$\(\s*(?:curl|wget)\b|\b(?:iex|Invoke-Expression)\s*\(?\s*\(?\s*(?:iwr|irm|Invoke-WebRequest|Invoke-RestMethod|New-Object\s+Net\.WebClient)\b/i,
  },
];

// A .env file: `.env` or `.env.<anything>` as a whole path segment.
const ENV_FILE = /(?:^|[\\/])\.env(?:\.[\w.-]+)?$/i;
const ENV_IN_COMMAND = /(?:^|[\s"'=:\\/(<])\.env(?:\.[\w.-]+)?(?=$|[\s"';|&)>,])/i;

/** True when a path names a .env file (`.env`, `.env.local`, `config/.env.production`, ...). */
export function isEnvFile(filePath = '') {
  return ENV_FILE.test(String(filePath).trim().replace(/["']/g, ''));
}

/** The rule a shell command breaks, or null. */
export function checkCommand(command = '') {
  for (const rule of SHELL_RULES) if (rule.pattern.test(command)) return rule.name;
  if (ENV_IN_COMMAND.test(command)) return 'reading .env files';
  return null;
}

/** The rule a tool call breaks, or null. Shell tools are checked by command, file tools by path. */
export function checkToolCall(toolName = '', toolInput = {}) {
  if (toolName === 'Bash' || toolName === 'PowerShell') return checkCommand(toolInput.command ?? '');
  if (toolName === 'Read' && isEnvFile(toolInput.file_path)) return 'reading .env files';
  if (toolName === 'Grep' && (isEnvFile(toolInput.path) || /(^|[\\/{,])\.env\b/i.test(toolInput.glob ?? ''))) return 'reading .env files';
  return null;
}

/** Hook output: deny with the reason, or nothing (let the normal permission flow decide). */
export function guardResult(rule) {
  if (!rule) return null;
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Blocked by the factory guard: ${rule} is never allowed here (see .claude/hooks/guard-commands.mjs). ` +
        'Find a non-destructive way, or ask the user to do it themselves.',
    },
  };
}
