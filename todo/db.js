// Client-side storage for tasks (and the action log), backed by IndexedDB.
// Every task operation is recorded as a "backend" entry in TodoLog.
const TodoDB = (() => {
  const DB_NAME = 'todo-app';
  const VERSION = 2; // v2 adds the `logs` store; existing tasks are kept.
  let dbPromise;

  function open() {
    dbPromise ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'seq', autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function run(store, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  const log = (action, details) => { if (typeof TodoLog !== 'undefined') TodoLog.write('backend', action, details); };

  return {
    async all() {
      const tasks = await run('tasks', 'readonly', s => s.getAll());
      log('tasks.getAll', { count: tasks.length });
      return tasks;
    },
    async add({ title, dueDate = '', tags = [], repeat = null, priority = 'medium' }) {
      const id = await run('tasks', 'readwrite', s => s.add({ title, done: false, dueDate, tags, repeat, priority, createdAt: Date.now() }));
      log('tasks.add', { id, title, priority });
      return id;
    },
    async put(task) {
      await run('tasks', 'readwrite', s => s.put(task));
      log('tasks.put', { id: task.id, done: task.done, priority: task.priority });
    },
    async remove(id) {
      await run('tasks', 'readwrite', s => s.delete(id));
      log('tasks.delete', { id });
    },
    // Log storage; not itself logged.
    appendLog: entry => run('logs', 'readwrite', s => s.add(entry)),
    readLogs: () => run('logs', 'readonly', s => s.getAll()),
  };
})();
