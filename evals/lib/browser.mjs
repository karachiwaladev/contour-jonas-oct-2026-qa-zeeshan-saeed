// Runs a browser scenario in headless Chrome over the DevTools protocol (no npm dependencies).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

export function findChrome(explicit) {
  const candidates = [
    explicit, process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  return candidates.find(c => c && fs.existsSync(c));
}

// Static server for the app folder: IndexedDB needs a real http origin.
function serve(rootDir) {
  const root = path.resolve(rootDir);
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end('<!doctype html><title>blank</title>');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/**
 * Run `scenario.steps` against the app in `appDir`.
 * Returns { steps: { id: { ok, detail, actions } }, consoleErrors, skipped? }.
 */
export async function runScenario(appDir, scenario, { chrome, screenshotDir } = {}) {
  if (!fs.existsSync(path.join(appDir, 'index.html'))) return { steps: {}, consoleErrors: [], skipped: `no app at ${appDir}` };
  const chromePath = findChrome(chrome);
  if (!chromePath) throw new Error('Chrome/Edge not found; set CHROME_PATH');

  const server = await serve(appDir);
  const url = `http://127.0.0.1:${server.address().port}/`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-chrome-'));
  const port = 9300 + Math.floor(Math.random() * 600);
  const args = ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--window-size=820,900', '--no-first-run', '--no-default-browser-check', 'about:blank'];
  if (process.env.CI) args.unshift('--no-sandbox');
  const proc = spawn(chromePath, args, { stdio: 'ignore' });

  let ws;
  try {
    let target;
    for (let i = 0; i < 75 && !target; i++) {
      try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch {}
      if (!target) await sleep(200);
    }
    if (!target) throw new Error('could not connect to Chrome');
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });

    let id = 0;
    const pending = new Map();
    const waiters = [];
    const consoleErrors = [];
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
      const p = msg.params;
      if (msg.method === 'Runtime.exceptionThrown') consoleErrors.push(p.exceptionDetails.exception?.description ?? p.exceptionDetails.text);
      if (msg.method === 'Runtime.consoleAPICalled' && p.type === 'error') consoleErrors.push(p.args.map(a => a.value ?? a.description).join(' '));
      if (msg.method === 'Log.entryAdded' && p.entry.level === 'error' && !/favicon|__eval_blank/.test(p.entry.url ?? '')) consoleErrors.push(p.entry.text);
      for (const w of [...waiters]) if (w.method === msg.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(p); }
    });
    const send = (method, params = {}) => new Promise(resolve => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
    const waitFor = (method, ms = 10000) => new Promise((resolve, reject) => {
      const w = { method, resolve };
      waiters.push(w);
      setTimeout(() => { const i = waiters.indexOf(w); if (i >= 0) { waiters.splice(i, 1); reject(new Error(`timeout waiting for ${method}`)); } }, ms);
    });

    const evaluate = async expression => {
      const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (res.result.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description ?? res.result.exceptionDetails.text);
      return res.result.result.value;
    };
    const navigate = async to => { const loaded = waitFor('Page.loadEventFired'); await send('Page.navigate', { url: to }); await loaded; await sleep(400); };
    const ctx = {
      url,
      evaluate,
      navigate,
      reload: async () => { const loaded = waitFor('Page.loadEventFired'); await send('Page.reload'); await loaded; await sleep(400); },
      screenshot: async name => {
        if (!screenshotDir) return;
        fs.mkdirSync(screenshotDir, { recursive: true });
        const res = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(screenshotDir, `${name}.png`), Buffer.from(res.result.data, 'base64'));
      },
    };

    await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
    if (scenario.pageHelpers) await send('Page.addScriptToEvaluateOnNewDocument', { source: scenario.pageHelpers });
    await navigate(url);

    const logs = () => evaluate(`typeof TodoLog === 'undefined' ? null : TodoLog.all().then(l => l.map(e => e.layer + ':' + e.action))`).catch(() => null);
    const steps = {};
    for (const step of scenario.steps) {
      const before = await logs();
      let result;
      try { result = await step.run(ctx); } catch (err) { result = { ok: false, detail: String(err.message ?? err).split('\n')[0] }; }
      const after = await logs();
      steps[step.id] = { name: step.name, ok: !!result.ok, detail: result.detail ?? '', actions: before && after ? after.slice(before.length) : null };
      if (step.screenshot) await ctx.screenshot(step.id);
    }
    return { steps, consoleErrors };
  } finally {
    try { ws?.close(); } catch {}
    proc.kill();
    server.close();
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}
