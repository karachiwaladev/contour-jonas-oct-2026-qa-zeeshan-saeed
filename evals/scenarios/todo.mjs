// Browser scenario for the todo app. Each step returns { ok, detail }; the eval runs it against
// both the previous state and the new state and compares results and action logs per step.

export const project = 'todo';
export const appDir = 'todo';

// Installed on every page load, before the app's own scripts.
export const pageHelpers = `
window.__e = {
  sleep: ms => new Promise(r => setTimeout(r, ms)),
  today: () => new Date().toISOString().slice(0, 10),
  addDays(date, n) { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); },
  async add(title, o = {}) {
    const $ = id => document.getElementById(id);
    $('title').value = title; $('due').value = o.due || ''; $('tags').value = o.tags || '';
    if (o.priority) { if (!$('priority')) throw new Error('no priority selector'); $('priority').value = o.priority; }
    const rep = $('repeat');
    if (o.repeat) {
      if (!rep) throw new Error('no repeat selector');
      rep.value = o.repeat; rep.dispatchEvent(new Event('change'));
      if (o.every) $('every').value = o.every;
    } else if (rep) { rep.value = ''; rep.dispatchEvent(new Event('change')); }
    document.querySelector('#new-task button[type=submit]').click();
    await this.sleep(400);
  },
  items() {
    return [...document.querySelectorAll('#tasks li')].map(li => ({
      title: li.querySelector('.title')?.textContent ?? li.textContent,
      done: li.querySelector('input[type=checkbox]').checked,
      due: li.querySelector('.due')?.textContent.replace('Due ', '') || '',
      overdue: !!li.querySelector('.due.overdue'),
      repeat: li.querySelector('.repeat')?.textContent || '',
      priority: li.querySelector('.priority')?.textContent || '',
      tags: [...li.querySelectorAll('.tag')].map(t => t.textContent),
    }));
  },
  // Open the inline editor for a task, fill fields, then 'save', 'cancel' or 'none' (leave open).
  // Returns the visible validation message, if any.
  async edit(title, done, fields = {}, action = 'save') {
    const li = this.li(title, done); if (!li) throw new Error('no task "' + title + '"');
    const btn = li.querySelector('.edit-btn'); if (!btn) throw new Error('no Edit button');
    btn.click(); await this.sleep(150);
    const f = document.querySelector('#tasks .edit-form'); if (!f) throw new Error('no edit form');
    const set = (sel, v) => { const el = f.querySelector(sel); el.value = v; el.dispatchEvent(new Event('change')); };
    const map = { title: '.edit-title', due: '.edit-due', tags: '.edit-tags', priority: '.edit-priority', repeat: '.edit-repeat', every: '.edit-every' };
    for (const [k, v] of Object.entries(fields)) set(map[k], v);
    if (action === 'save') f.querySelector('button[type=submit]').click();
    if (action === 'cancel') f.querySelector('.edit-cancel').click();
    await this.sleep(500);
    const err = f.querySelector('.edit-error');
    return err && !err.hidden ? err.textContent : '';
  },
  async closeEdit() { const c = document.querySelector('#tasks .edit-cancel'); if (c) { c.click(); await this.sleep(400); } },
  async selectPriority(p) { const s = document.getElementById('priority-filter'); s.value = p; s.dispatchEvent(new Event('change')); await this.sleep(400); },
  li(title, done) {
    return [...document.querySelectorAll('#tasks li')].find(li =>
      (li.querySelector('.title')?.textContent ?? '') === title && li.querySelector('input[type=checkbox]').checked === done);
  },
  async complete(title) {
    const li = this.li(title, false); if (!li) throw new Error('no open task "' + title + '"');
    li.querySelector('input[type=checkbox]').click(); await this.sleep(500);
  },
  async remove(title, done) {
    const li = this.li(title, done); if (!li) throw new Error('no task "' + title + '"');
    li.querySelector('.delete').click(); await this.sleep(500);
  },
  async click(selector) { document.querySelector(selector).click(); await this.sleep(400); },
  async selectTag(tag) { const s = document.getElementById('tag-filter'); s.value = tag; s.dispatchEvent(new Event('change')); await this.sleep(400); },
  async logs() { return typeof TodoLog === 'undefined' ? null : TodoLog.all(); },
};`;

const has = (logs, layer, action) => logs.some(e => e.layer === layer && e.action === action);
const missing = (logs, wanted) => wanted.filter(([layer, action]) => !has(logs, layer, action)).map(w => w.join(':'));

export const steps = [
  {
    id: 'load', name: 'App loads',
    run: async ({ evaluate }) => {
      const ok = await evaluate(`document.title === 'Todo' && !!document.getElementById('new-task')`);
      return { ok, detail: ok ? 'form rendered' : 'page did not render' };
    },
  },
  {
    id: 'add-task', name: 'Add a task with a tag', screenshot: true,
    run: async ({ evaluate }) => {
      await evaluate(`__e.add('Buy milk', { tags: 'shopping' })`);
      const t = (await evaluate(`__e.items()`)).find(i => i.title === 'Buy milk');
      return { ok: !!t && !t.done && t.tags.join() === 'shopping', detail: JSON.stringify(t ?? null) };
    },
  },
  {
    id: 'complete-task', name: 'Complete a task',
    run: async ({ evaluate }) => {
      await evaluate(`__e.complete('Buy milk')`);
      const t = (await evaluate(`__e.items()`)).find(i => i.title === 'Buy milk');
      return { ok: !!t?.done, detail: JSON.stringify(t ?? null) };
    },
  },
  {
    id: 'filter-status', name: 'Completed filter shows only done tasks',
    run: async ({ evaluate }) => {
      await evaluate(`__e.click('#status-filter [data-status=done]')`);
      const shown = await evaluate(`__e.items()`);
      await evaluate(`__e.click('#status-filter [data-status=all]')`);
      return { ok: shown.length > 0 && shown.every(i => i.done), detail: `${shown.length} shown` };
    },
  },
  {
    id: 'filter-tag', name: 'Tag filter shows only tagged tasks',
    run: async ({ evaluate }) => {
      await evaluate(`__e.add('Read book', { tags: 'leisure' })`);
      await evaluate(`__e.selectTag('shopping')`);
      const shown = await evaluate(`__e.items()`);
      await evaluate(`__e.selectTag('')`);
      return { ok: shown.length > 0 && shown.every(i => i.tags.includes('shopping')), detail: shown.map(i => i.title).join(', ') };
    },
  },
  {
    id: 'due-date-overdue', name: 'Overdue due date is highlighted',
    run: async ({ evaluate }) => {
      await evaluate(`__e.add('Old bill', { due: __e.addDays(__e.today(), -1) })`);
      const t = (await evaluate(`__e.items()`)).find(i => i.title === 'Old bill');
      return { ok: !!t?.overdue, detail: JSON.stringify(t ?? null) };
    },
  },
  {
    id: 'recurring-weekly', name: 'Completing a weekly task creates the next one', screenshot: true,
    run: async ({ evaluate }) => {
      await evaluate(`__e.add('Water plants', { due: __e.today(), tags: 'home', repeat: 'weekly' })`);
      await evaluate(`__e.complete('Water plants')`);
      const expected = await evaluate(`__e.addDays(__e.today(), 7)`);
      const items = (await evaluate(`__e.items()`)).filter(i => i.title === 'Water plants');
      const next = items.find(i => !i.done);
      const ok = items.some(i => i.done) && next?.due === expected && next.repeat.includes('weekly') && next.tags.join() === 'home';
      return { ok, detail: JSON.stringify(items) };
    },
  },
  {
    id: 'recurring-monthly-clamp', name: 'Monthly repeat clamps Jan 31 to Feb 28',
    run: async ({ evaluate }) => {
      await evaluate(`__e.add('Pay rent', { due: '2026-01-31', repeat: 'monthly' })`);
      await evaluate(`__e.complete('Pay rent')`);
      const next = (await evaluate(`__e.items()`)).find(i => i.title === 'Pay rent' && !i.done);
      return { ok: next?.due === '2026-02-28', detail: `next due ${next?.due}` };
    },
  },
  {
    id: 'validation-repeat-needs-due', name: 'Repeating without a due date is blocked',
    run: async ({ evaluate }) => {
      const before = (await evaluate(`__e.items()`)).length;
      await evaluate(`__e.add('No date', { repeat: 'daily' })`);
      const after = (await evaluate(`__e.items()`)).length;
      const msg = await evaluate(`(() => { const e = document.getElementById('form-error'); return e && !e.hidden ? e.textContent : ''; })()`);
      await evaluate(`(() => { document.getElementById('title').value = ''; const r = document.getElementById('repeat'); r.value = ''; r.dispatchEvent(new Event('change')); })()`);
      return { ok: after === before && msg === 'Repeating tasks need a due date.', detail: `message "${msg}"` };
    },
  },
  {
    id: 'delete-task', name: 'Delete a task',
    run: async ({ evaluate }) => {
      await evaluate(`__e.remove('Buy milk', true)`);
      const left = (await evaluate(`__e.items()`)).filter(i => i.title === 'Buy milk');
      return { ok: left.length === 0, detail: `${left.length} left` };
    },
  },
  {
    id: 'reload-persists', name: 'Tasks persist across reload',
    run: async ({ evaluate, reload }) => {
      const before = JSON.stringify(await evaluate(`__e.items()`));
      await reload();
      const after = JSON.stringify(await evaluate(`__e.items()`));
      return { ok: before === after, detail: `${JSON.parse(after).length} tasks after reload` };
    },
  },
  {
    id: 'logs-frontend', name: 'UI actions write frontend log entries', screenshot: true,
    run: async ({ evaluate }) => {
      const logs = await evaluate(`__e.logs()`);
      if (!logs) return { ok: false, detail: 'TodoLog is not available' };
      const gaps = missing(logs, [['frontend', 'task.add'], ['frontend', 'task.complete'], ['frontend', 'task.delete'],
        ['frontend', 'task.add.rejected'], ['frontend', 'task.recurrence.next'], ['frontend', 'filter.status'], ['frontend', 'filter.tag']]);
      const add = logs.find(e => e.layer === 'frontend' && e.action === 'task.add' && e.details?.title === 'Buy milk');
      const ok = !gaps.length && !!add && typeof logs[0].ts === 'string';
      return { ok, detail: gaps.length ? `missing ${gaps.join(', ')}` : `${logs.filter(e => e.layer === 'frontend').length} frontend entries` };
    },
  },
  {
    id: 'logs-backend', name: 'Data-layer operations write backend log entries',
    run: async ({ evaluate }) => {
      const logs = await evaluate(`__e.logs()`);
      if (!logs) return { ok: false, detail: 'TodoLog is not available' };
      const gaps = missing(logs, [['backend', 'tasks.getAll'], ['backend', 'tasks.add'], ['backend', 'tasks.put'], ['backend', 'tasks.delete']]);
      const add = logs.find(e => e.layer === 'backend' && e.action === 'tasks.add');
      const ok = !gaps.length && Number.isInteger(add?.details?.id);
      return { ok, detail: gaps.length ? `missing ${gaps.join(', ')}` : `${logs.filter(e => e.layer === 'backend').length} backend entries` };
    },
  },
  {
    id: 'logs-persist-reload', name: 'Logs survive a reload',
    run: async ({ evaluate, reload }) => {
      const before = await evaluate(`__e.logs().then(l => l && l.length)`);
      await reload();
      const after = await evaluate(`__e.logs().then(l => l && l.length)`);
      return { ok: !!before && after >= before, detail: `${before} before, ${after} after` };
    },
  },
  {
    id: 'db-upgrade-keeps-tasks', name: 'Tasks stored by an older DB version survive the upgrade',
    run: async ({ evaluate, navigate, url }) => {
      // Seed a version-1 database from a same-origin page that doesn't run the app.
      await navigate(url + '__eval_blank');
      await evaluate(`new Promise((resolve, reject) => {
        const del = indexedDB.deleteDatabase('todo-app');
        del.onerror = () => reject(del.error);
        del.onsuccess = () => {
          const req = indexedDB.open('todo-app', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          req.onsuccess = () => {
            const tx = req.result.transaction('tasks', 'readwrite');
            tx.objectStore('tasks').add({ title: 'Legacy task', done: false, dueDate: '', tags: [], createdAt: Date.now() });
            tx.oncomplete = () => { req.result.close(); resolve(); };
          };
        };
      })`);
      await navigate(url);
      const legacy = (await evaluate(`__e.items()`)).find(i => i.title === 'Legacy task');
      return { ok: !!legacy, detail: legacy ? 'legacy task shown after upgrade' : 'legacy task missing' };
    },
  },
  // --- Task priority (#13). Runs on the database left by db-upgrade-keeps-tasks (one legacy task). ---
  {
    id: 'priority-legacy-medium', name: 'A task saved without a priority shows as Medium',
    run: async ({ evaluate }) => {
      const legacy = (await evaluate(`__e.items()`)).find(i => i.title === 'Legacy task');
      return { ok: legacy?.priority === 'Medium', detail: `priority "${legacy?.priority}"` };
    },
  },
  {
    id: 'priority-add', name: 'Add with a priority; default is Medium',
    run: async ({ evaluate }) => {
      await evaluate(`__e.add('Plain task')`);
      await evaluate(`__e.add('Urgent fix', { priority: 'high' })`);
      const items = await evaluate(`__e.items()`);
      const plain = items.find(i => i.title === 'Plain task');
      const urgent = items.find(i => i.title === 'Urgent fix');
      return { ok: plain?.priority === 'Medium' && urgent?.priority === 'High', detail: `Plain task: ${plain?.priority}, Urgent fix: ${urgent?.priority}` };
    },
  },
  {
    id: 'priority-sort', name: 'Sorted High → Medium → Low, then by due date', screenshot: true,
    run: async ({ evaluate }) => {
      await evaluate(`__e.add('Later', { priority: 'low', due: __e.addDays(__e.today(), 1) })`);
      await evaluate(`__e.add('Big launch', { priority: 'high', due: __e.addDays(__e.today(), 10) })`);
      await evaluate(`__e.add('Hotfix', { priority: 'high', due: __e.addDays(__e.today(), 2) })`);
      const items = await evaluate(`__e.items()`);
      const rank = { High: 0, Medium: 1, Low: 2 };
      const ranksSorted = items.every((t, i) => i === 0 || rank[items[i - 1].priority] <= rank[t.priority]);
      const highs = items.filter(i => i.priority === 'High').map(i => i.title);
      const ok = ranksSorted && highs.join() === 'Hotfix,Big launch,Urgent fix';
      return { ok, detail: items.map(i => `${i.title} (${i.priority})`).join(' · ') };
    },
  },
  {
    id: 'priority-filter', name: 'Priority filter, combined with the status filter',
    run: async ({ evaluate }) => {
      await evaluate(`__e.selectPriority('high')`);
      const high = await evaluate(`__e.items()`);
      await evaluate(`__e.complete('Hotfix')`);
      await evaluate(`__e.click('#status-filter [data-status=active]')`);
      const highOpen = await evaluate(`__e.items()`);
      await evaluate(`__e.click('#status-filter [data-status=all]')`);
      await evaluate(`__e.selectPriority('')`);
      const ok = high.length === 3 && high.every(i => i.priority === 'High')
        && highOpen.length === 2 && highOpen.every(i => i.priority === 'High' && !i.done);
      return { ok, detail: `High: ${high.length}; High + Incomplete: ${highOpen.map(i => i.title).join(', ')}` };
    },
  },
  {
    id: 'edit-save', name: 'Edit title, due date, tags and priority; persists after reload',
    run: async ({ evaluate, reload }) => {
      const due = await evaluate(`__e.addDays(__e.today(), 3)`);
      const err = await evaluate(`__e.edit('Plain task', false, { title: 'Plain edited', due: '${due}', tags: 'work, home', priority: 'low' })`);
      const check = items => items.find(i => i.title === 'Plain edited');
      const t = check(await evaluate(`__e.items()`));
      await reload();
      const after = check(await evaluate(`__e.items()`));
      const ok = !err && t?.due === due && t?.priority === 'Low' && t?.tags.join() === 'work,home'
        && JSON.stringify(after) === JSON.stringify(t) && !(await evaluate(`__e.items()`)).some(i => i.title === 'Plain task');
      return { ok, detail: JSON.stringify(after ?? null) };
    },
  },
  {
    id: 'edit-cancel', name: 'Cancel leaves the task unchanged',
    run: async ({ evaluate }) => {
      const before = (await evaluate(`__e.items()`)).find(i => i.title === 'Plain edited');
      await evaluate(`__e.edit('Plain edited', false, { title: 'Should not save', priority: 'high' }, 'cancel')`);
      const items = await evaluate(`__e.items()`);
      const after = items.find(i => i.title === 'Plain edited');
      return { ok: JSON.stringify(before) === JSON.stringify(after) && !items.some(i => i.title === 'Should not save'), detail: JSON.stringify(after ?? null) };
    },
  },
  {
    id: 'edit-validation', name: 'Edit blocks an empty title and a repeat without a due date',
    run: async ({ evaluate, screenshot }) => {
      const noDue = await evaluate(`__e.edit('Plain edited', false, { due: '', repeat: 'daily' })`);
      await evaluate(`__e.closeEdit()`);
      const noTitle = await evaluate(`__e.edit('Plain edited', false, { title: '' })`);
      await screenshot('edit-validation');
      await evaluate(`__e.closeEdit()`);
      const still = (await evaluate(`__e.items()`)).find(i => i.title === 'Plain edited');
      const ok = noDue === 'Repeating tasks need a due date.' && noTitle === 'Title is required.' && !!still && !still.repeat;
      return { ok, detail: `"${noDue}" / "${noTitle}"` };
    },
  },
  {
    id: 'priority-recurring', name: 'The next occurrence of a recurring task keeps its priority',
    run: async ({ evaluate }) => {
      await evaluate(`__e.add('Standup', { due: __e.today(), repeat: 'weekly', priority: 'high' })`);
      await evaluate(`__e.complete('Standup')`);
      const next = (await evaluate(`__e.items()`)).find(i => i.title === 'Standup' && !i.done);
      return { ok: next?.priority === 'High' && next.repeat.includes('weekly'), detail: JSON.stringify(next ?? null) };
    },
  },
  {
    id: 'edit-logs', name: 'Edits and the priority filter are logged (frontend and backend)',
    run: async ({ evaluate }) => {
      const logs = await evaluate(`__e.logs()`);
      if (!logs) return { ok: false, detail: 'TodoLog is not available' };
      const gaps = missing(logs, [['frontend', 'task.edit'], ['frontend', 'task.edit.cancel'], ['frontend', 'task.edit.rejected'],
        ['frontend', 'filter.priority'], ['backend', 'tasks.put']]);
      const edit = logs.find(e => e.layer === 'frontend' && e.action === 'task.edit');
      const put = logs.find(e => e.layer === 'backend' && e.action === 'tasks.put' && e.details?.priority === 'low');
      const ok = !gaps.length && edit?.details?.changes?.priority === 'low' && edit.details.changes.title === 'Plain edited' && !!put;
      return { ok, detail: gaps.length ? `missing ${gaps.join(', ')}` : `task.edit changes: ${Object.keys(edit?.details?.changes ?? {}).join(', ')}` };
    },
  },
];
