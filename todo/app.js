const form = document.getElementById('new-task');
const input = document.getElementById('title');
const list = document.getElementById('tasks');
const empty = document.getElementById('empty');

async function render() {
  const tasks = await TodoDB.all();
  list.replaceChildren(...tasks.map(taskItem));
  empty.hidden = tasks.length > 0;
}

function taskItem(task) {
  const li = document.createElement('li');
  li.className = task.done ? 'done' : '';

  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.addEventListener('change', async () => {
    await TodoDB.put({ ...task, done: checkbox.checked });
    render();
  });
  const title = document.createElement('span');
  title.textContent = task.title;
  label.append(checkbox, title);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete';
  del.textContent = 'Delete';
  del.setAttribute('aria-label', `Delete "${task.title}"`);
  del.addEventListener('click', async () => {
    await TodoDB.remove(task.id);
    render();
  });

  li.append(label, del);
  return li;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  await TodoDB.add(title);
  input.value = '';
  render();
});

render();
