// Decision logic for the PreToolUse guard (.claude/hooks/guard-commands.mjs): blocks destructive or risky tool calls
// before they run. Mirrors permissions.deny in .claude/settings.json. Pure functions, so evals/tests can cover them.
// Shell lines are judged by the commands they run (lib/command.mjs), so text that only mentions a blocked command
// (a commit message, a heredoc body, an echo) passes.
import { parseCommands, innerScript } from './command.mjs';

const DOWNLOADERS = new Set(['curl', 'wget', 'iwr', 'irm', 'invoke-webrequest', 'invoke-restmethod']);
const RUNNERS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh', 'iex', 'invoke-expression', 'python', 'python3', 'node', 'pwsh', 'powershell']);
const REMOVERS = new Set(['remove-item', 'rm', 'ri', 'del', 'rmdir', 'rd', 'erase']);

const isRmRf = ({ program, args }) => {
  if (program !== 'rm') return false;
  const short = args.filter(a => /^-[a-z]+$/i.test(a)).join('');
  const long = new Set(args.filter(a => a.startsWith('--')));
  return (/r/i.test(short) || long.has('--recursive')) && (/f/.test(short) || long.has('--force'));
};
const isPsRecurseForce = ({ program, args }) => REMOVERS.has(program)
  && args.some(a => /^-recurse$/i.test(a)) && args.some(a => /^-force$/i.test(a));
const isForcePush = ({ program, args }) => program === 'git' && args.includes('push')
  && args.slice(args.indexOf('push') + 1).some(a => /^--force(-with-lease|-if-includes)?(=|$)/.test(a) || /^-[a-z]*f[a-z]*$/i.test(a) || /^\+\S/.test(a));
// `iex (iwr https://x).Content`, `bash -c "$(curl -fsSL https://x)"`: a download evaluated in place.
const isInlineDownloadRun = cmd => (cmd.program === 'iex' || cmd.program === 'invoke-expression')
  ? /\b(iwr|irm|invoke-webrequest|invoke-restmethod|net\.webclient)\b/i.test(cmd.args.join(' '))
  : /\$\(\s*(curl|wget)\b/.test(innerScript(cmd) ?? '');

// A .env file: `.env` or `.env.<anything>` as a whole path segment.
const ENV_FILE = /(?:^|[\\/])\.env(?:\.[\w.-]+)?$/i;

/** True when a path names a .env file (`.env`, `.env.local`, `config/.env.production`, ...). */
export function isEnvFile(filePath = '') {
  return ENV_FILE.test(String(filePath).trim().replace(/["']/g, ''));
}

/** The rule a shell command breaks, or null. */
export function checkCommand(command = '', depth = 0) {
  const cmds = parseCommands(command);
  for (const [i, cmd] of cmds.entries()) {
    if (isRmRf(cmd)) return 'rm -rf';
    if (isPsRecurseForce(cmd)) return 'Remove-Item -Recurse -Force (PowerShell rm -rf)';
    if (isForcePush(cmd)) return 'git push --force';
    if (isInlineDownloadRun(cmd)) return 'curl | sh';
    if (DOWNLOADERS.has(cmd.program) && cmd.after === '|' && RUNNERS.has(cmds[i + 1]?.program)) return 'curl | sh';
    if (cmd.args.some(isEnvFile)) return 'reading .env files';
    // `bash -c "..."` / `pwsh -Command "..."` runs its script: check that too.
    const inner = innerScript(cmd);
    if (inner && depth < 3) { const rule = checkCommand(inner, depth + 1); if (rule) return rule; }
  }
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
