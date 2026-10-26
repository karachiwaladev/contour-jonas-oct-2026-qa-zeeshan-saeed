const form = document.getElementById('new-task');
const titleInput = document.getElementById('title');
const dueInput = document.getElementById('due');
const tagsInput = document.getElementById('tags');
const repeatSelect = document.getElementById('repeat');
const everyWrap = document.getElementById('every-wrap');
const everyInput = document.getElementById('every');
const formError = document.getElementById('form-error');
const list = document.getElementById('tasks');
const empty = document.getElementById('empty');
const statusButtons = document.querySelectorAll('#status-filter button');
const tagFilter = document.getElementById('tag-filter');

const filters = { status: 'all', tag: '' };
const logUI = (action, details) => TodoLog.write('frontend', action, details);

function parseTags(text) {
  return [...new Set(text.split(',').map(t => t.trim().toLowerCase()).filter(Boolean))];
}

function matches(task) {
  if (filters.status === 'active' && task.done) return false;
  if (filters.status === 'done' && !task.done) return false;
  if (filters.tag && !(task.tags ?? []).includes(filters.tag)) return false;
  return true;
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
  const visible = tasks.filter(matches);
  list.replaceChildren(...visible.map(taskItem));
  empty.hidden = visible.length > 0;
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
      const nextId = await TodoDB.add({ title: task.title, tags: task.tags, repeat: task.repeat, dueDate: nextDue });
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
  if (task.dueDate) meta.append(dueLabel(task.dueDate));
  if (task.repeat) {
    const badge = document.createElement('span');
    badge.className = 'repeat';
    badge.textContent = `↻ ${Recurrence.label(task.repeat)}`;
    meta.append(badge);
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

  li.append(body, del);
  return li;
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
  const task = { title, dueDate: dueInput.value, tags: parseTags(tagsInput.value), repeat };
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

tagFilter.addEventListener('change', () => { filters.tag = tagFilter.value; logUI('filter.tag', { tag: filters.tag, via: 'dropdown' }); render(); });

render();
