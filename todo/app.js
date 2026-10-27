const form = document.getElementById('new-task');
const titleInput = document.getElementById('title');
const dueInput = document.getElementById('due');
const tagsInput = document.getElementById('tags');
const repeatSelect = document.getElementById('repeat');
const everyWrap = document.getElementById('every-wrap');
const everyInput = document.getElementById('every');
const formError = document.getElementById('form-error');
const prioritySelect = document.getElementById('priority');
const priorityFilter = document.getElementById('priority-filter');
const list = document.getElementById('tasks');
const empty = document.getElementById('empty');
const countFooter = document.getElementById('count');
const statusButtons = document.querySelectorAll('#status-filter button');
const tagFilter = document.getElementById('tag-filter');
const searchInput = document.getElementById('search');
const searchClear = document.getElementById('search-clear');

const filters = { status: 'all', tag: '', priority: '', search: '' };
const logUI = (action, details) => TodoLog.write('frontend', action, details);

function parseTags(text) {
  return [...new Set(text.split(',').map(t => t.trim().toLowerCase()).filter(Boolean))];
}

function matches(task) {
  if (filters.status === 'active' && task.done) return false;
  if (filters.status === 'done' && !task.done) return false;
  if (filters.tag && !(task.tags ?? []).includes(filters.tag)) return false;
  if (filters.priority && Priority.normalize(task.priority) !== filters.priority) return false;
  return Search.matches(task, filters.search);
}

function renderTagOptions(tasks) {
  const tags = [...new Set(tasks.flatMap(t => t.tags ?? []))].sort();
  if (filters.tag && !tags.includes(filters.tag)) filters.tag = '';
  tagFilter.replaceChildren(
    new Option('All tags', ''),
    ...tags.map(tag => new Option(tag, tag, false, tag === filters.tag)),
  );
}

async function render() {
  const tasks = await TodoDB.all();
  renderTagOptions(tasks);
  const visible = tasks.filter(matches).sort(Priority.compare);
  list.replaceChildren(...visible.map(taskItem));
  empty.hidden = visible.length > 0;
  empty.textContent = filters.search.trim() ? `No tasks match "${filters.search.trim()}"` : 'No tasks to show.';
  // Counts cover all tasks, not just the filtered ones; hidden when there are none.
  countFooter.textContent = Counts.summary(tasks).text;
  countFooter.hidden = tasks.length === 0;
}

function dueLabel(dueDate) {
  const today = new Date().toISOString().slice(0, 10);
  const span = document.createElement('span');
  span.className = 'due' + (dueDate < today ? ' overdue' : '');
  span.textContent = `Due ${dueDate}`;
  return span;
}

function taskItem(task) {
  const li = document.createElement('li');
  li.className = task.done ? 'done' : '';

  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.addEventListener('change', async () => {
    logUI(checkbox.checked ? 'task.complete' : 'task.uncomplete', { id: task.id, title: task.title });
    if (checkbox.checked && task.repeat) {
      // Keep the done occurrence as history; the series moves on to the next one.
      await TodoDB.put({ ...task, done: true, repeat: null });
      const nextDue = Recurrence.nextDueDate(task.dueDate, task.repeat);
      const nextId = await TodoDB.add({ title: task.title, tags: task.tags, repeat: task.repeat, dueDate: nextDue, priority: Priority.normalize(task.priority) });
      logUI('task.recurrence.next', { from: task.id, id: nextId, dueDate: nextDue });
    } else {
      await TodoDB.put({ ...task, done: checkbox.checked });
    }
    render();
  });
  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = task.title;
  label.append(checkbox, title);

  const meta = document.createElement('div');
  meta.className = 'meta';
  const level = Priority.normalize(task.priority);
  const badge = document.createElement('span');
  badge.className = `priority priority-${level}`;
  badge.textContent = Priority.label(level);
  meta.append(badge);
  if (task.dueDate) meta.append(dueLabel(task.dueDate));
  if (task.repeat) {
    const repeatBadge = document.createElement('span');
    repeatBadge.className = 'repeat';
    repeatBadge.textContent = `↻ ${Recurrence.label(task.repeat)}`;
    meta.append(repeatBadge);
  }
  for (const tag of task.tags ?? []) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'tag';
    chip.textContent = tag;
    chip.title = `Show only "${tag}"`;
    chip.addEventListener('click', () => { filters.tag = tag; logUI('filter.tag', { tag, via: 'chip' }); render(); });
    meta.append(chip);
  }

  const body = document.createElement('div');
  body.className = 'body';
  body.append(label, meta);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete';
  del.textContent = 'Delete';
  del.setAttribute('aria-label', `Delete "${task.title}"`);
  del.addEventListener('click', async () => {
    logUI('task.delete', { id: task.id, title: task.title });
    await TodoDB.remove(task.id);
    render();
  });

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'edit-btn';
  edit.textContent = 'Edit';
  edit.setAttribute('aria-label', `Edit "${task.title}"`);
  edit.addEventListener('click', () => {
    logUI('task.edit.open', { id: task.id });
    li.className = 'editing';
    li.replaceChildren(editForm(task));
    li.querySelector('.edit-title').focus();
  });

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.append(edit, del);

  li.append(body, actions);
  return li;
}

// Inline edit form for a task: title, due date, tags, priority and repeat.
function editForm(task) {
  const f = document.createElement('form');
  f.className = 'edit-form';
  f.innerHTML = `
    <input class="edit-title" type="text" aria-label="Title" autocomplete="off">
    <div class="row">
      <input class="edit-due" type="date" aria-label="Due date">
      <input class="edit-tags" type="text" aria-label="Tags" placeholder="Tags, comma-separated" autocomplete="off">
    </div>
    <div class="row">
      <select class="edit-priority" aria-label="Priority">
        <option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option>
      </select>
      <select class="edit-repeat" aria-label="Repeat">
        <option value="">Doesn't repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option><option value="custom">Every N days</option>
      </select>
      <label class="edit-every-wrap" hidden>Every <input class="edit-every" type="number" min="1" aria-label="Repeat every N days"> days</label>
      <button type="submit">Save</button>
      <button type="button" class="edit-cancel">Cancel</button>
    </div>
    <p class="edit-error" role="alert" hidden></p>`;
  const $ = sel => f.querySelector(sel);
  const repeat = Recurrence.toForm(task.repeat);
  $('.edit-title').value = task.title;
  $('.edit-due').value = task.dueDate ?? '';
  $('.edit-tags').value = (task.tags ?? []).join(', ');
  $('.edit-priority').value = Priority.normalize(task.priority);
  $('.edit-repeat').value = repeat.choice;
  $('.edit-every').value = repeat.every;
  $('.edit-every-wrap').hidden = repeat.choice !== 'custom';
  $('.edit-repeat').addEventListener('change', () => { $('.edit-every-wrap').hidden = $('.edit-repeat').value !== 'custom'; });

  const fail = message => {
    $('.edit-error').textContent = message;
    $('.edit-error').hidden = false;
    logUI('task.edit.rejected', { id: task.id, reason: message });
  };

  f.addEventListener('submit', async e => {
    e.preventDefault();
    const title = $('.edit-title').value.trim();
    const dueDate = $('.edit-due').value;
    const repeatRule = Recurrence.fromForm($('.edit-repeat').value, $('.edit-every').value);
    if (!title) return fail('Title is required.');
    if (repeatRule && !dueDate) return fail('Repeating tasks need a due date.');
    const updated = { ...task, title, dueDate, tags: parseTags($('.edit-tags').value), priority: $('.edit-priority').value, repeat: repeatRule };
    const before = { title: task.title, dueDate: task.dueDate ?? '', tags: task.tags ?? [], priority: Priority.normalize(task.priority), repeat: task.repeat ?? null };
    const changes = Object.fromEntries(Object.keys(before)
      .filter(k => JSON.stringify(before[k]) !== JSON.stringify(updated[k]))
      .map(k => [k, updated[k]]));
    logUI('task.edit', { id: task.id, changes });
    await TodoDB.put(updated);
    render();
  });
  $('.edit-cancel').addEventListener('click', () => { logUI('task.edit.cancel', { id: task.id }); render(); });
  return f;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  const repeat = Recurrence.fromForm(repeatSelect.value, everyInput.value);
  if (repeat && !dueInput.value) {
    formError.textContent = 'Repeating tasks need a due date.';
    formError.hidden = false;
    dueInput.focus();
    logUI('task.add.rejected', { title, reason: 'repeat-needs-due-date' });
    return;
  }
  const task = { title, dueDate: dueInput.value, tags: parseTags(tagsInput.value), repeat, priority: prioritySelect.value };
  logUI('task.add', task);
  await TodoDB.add(task);
  form.reset();
  everyWrap.hidden = true;
  formError.hidden = true;
  titleInput.focus();
  render();
});

repeatSelect.addEventListener('change', () => {
  everyWrap.hidden = repeatSelect.value !== 'custom';
  if (!repeatSelect.value) formError.hidden = true;
});

statusButtons.forEach(button => button.addEventListener('click', () => {
  filters.status = button.dataset.status;
  logUI('filter.status', { status: filters.status });
  statusButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  render();
}));

priorityFilter.addEventListener('change', () => { filters.priority = priorityFilter.value; logUI('filter.priority', { priority: filters.priority }); render(); });

tagFilter.addEventListener('change', () => { filters.tag = tagFilter.value; logUI('filter.tag', { tag: filters.tag, via: 'dropdown' }); render(); });

// Search filters as you type; the log entry waits for a pause so typing isn't one entry per key.
let searchLogTimer;
function setSearch(value) {
  filters.search = value;
  searchClear.hidden = !value;
  clearTimeout(searchLogTimer);
  if (value.trim()) searchLogTimer = setTimeout(() => logUI('filter.search', { query: value.trim() }), 300);
  render();
}
function clearSearch(via) {
  if (!searchInput.value && !filters.search) return;
  searchInput.value = '';
  logUI('filter.search.clear', { via });
  setSearch('');
  searchInput.focus();
}
searchInput.addEventListener('input', () => setSearch(searchInput.value));
searchInput.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); clearSearch('escape'); } });
searchClear.addEventListener('click', () => clearSearch('button'));

render();
