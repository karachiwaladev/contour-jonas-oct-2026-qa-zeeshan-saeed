// Shell command parsing shared by the factory hooks (eval-after-tests, guard). Hooks decide by the commands a shell
// line actually runs, not by its raw text, so text that only mentions a command (a quoted commit message, a heredoc
// body, an `echo`) neither triggers nor gets blocked. Bash and PowerShell syntax, best effort. Pure functions.

// Prefixes that run the next word as the command.
const WRAPPERS = new Set(['sudo', 'time', 'env', 'nohup', 'exec', 'command']);

/**
 * Split a shell line into the commands it runs.
 * Returns [{ program, args, words, raw, after }]: `program` is the command's base name (lower-case, path and `.exe`
 * dropped), `args` its arguments with quotes removed, `raw` the segment's text, and `after` the separator that
 * follows it ('|', '&&', '||', ';', '&', '\n' or '').
 */
export function parseCommands(line = '') {
  const segments = [];
  let raw = '';
  let words = [];
  let word = '';
  let inWord = false;
  let quote = null;
  const heredocs = [];

  const endWord = () => { if (inWord) words.push(word); word = ''; inWord = false; };
  const endSegment = after => {
    endWord();
    if (words.length) segments.push(toCommand(words, raw.trim(), after));
    else if (segments.length && after) segments[segments.length - 1].after ||= after;
    words = []; raw = '';
  };

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      raw += c;
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && i + 1 < line.length && line[i + 1] === '"') { word += '"'; raw += line[++i]; }
      else word += c;
      continue;
    }
    // Heredoc (`<<EOF`, `<<'EOF'`, `<<-EOF`): the rest of this line parses as usual; its body is skipped below.
    const heredoc = line.slice(i).match(/^<<-?\s*(['"]?)([A-Za-z_][\w-]*)\1/);
    if (heredoc) { endWord(); heredocs.push(heredoc[2]); raw += heredoc[0]; i += heredoc[0].length - 1; continue; }
    if (c === "'" || c === '"') { quote = c; inWord = true; raw += c; continue; }
    if (c === '\\' && i + 1 < line.length && line[i + 1] === '\n') { i++; continue; }       // line continuation
    if (c === '`' && i + 1 < line.length && line[i + 1] === '\n') { i++; continue; }        // PowerShell continuation
    if (c === '\n' && heredocs.length) {
      // Skip heredoc bodies (data, not commands) up to each terminator line.
      endSegment('\n');
      for (const term of heredocs.splice(0)) {
        const m = new RegExp(`^[\\t ]*${term}[\\t ]*$`, 'm').exec(line.slice(i + 1));
        i = m ? i + 1 + m.index + m[0].length : line.length;
      }
      continue;
    }
    if (c === '\n' || c === ';') { endSegment(c === ';' ? ';' : '\n'); continue; }
    if (c === '|') { const op = line[i + 1] === '|' ? '||' : '|'; if (op === '||') i++; endSegment(op); continue; }
    if (c === '&') {
      if (line[i - 1] === '>' || line[i + 1] === '>') { word += c; inWord = true; raw += c; continue; }  // 2>&1, &>
      const op = line[i + 1] === '&' ? '&&' : '&'; if (op === '&&') i++; endSegment(op); continue;
    }
    if (/\s/.test(c)) { endWord(); raw += c; continue; }
    word += c; inWord = true; raw += c;
  }
  endSegment('');
  return segments;
}

function toCommand(words, raw, after) {
  let i = 0;
  // Skip environment assignments (FOO=1 cmd) and wrappers (sudo, time, ...).
  while (i < words.length - 1 && (/^[A-Za-z_]\w*=/.test(words[i]) || WRAPPERS.has(words[i].toLowerCase()))) i++;
  const program = words[i].split(/[\\/]/).pop().toLowerCase().replace(/\.(exe|cmd|bat|ps1)$/, '');
  return { program, args: words.slice(i + 1), words, raw, after };
}

/** The `-c` script of a shell invocation (`bash -c "..."`, `pwsh -Command "..."`), or null. */
export function innerScript(cmd) {
  if (!/^(ba|z|da|k)?sh$|^(pwsh|powershell)$/.test(cmd.program)) return null;
  const i = cmd.args.findIndex(a => /^-(c|command)$/i.test(a));
  return i >= 0 && i + 1 < cmd.args.length ? cmd.args[i + 1] : null;
}
