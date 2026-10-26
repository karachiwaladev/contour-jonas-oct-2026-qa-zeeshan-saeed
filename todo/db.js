// Client-side storage for tasks, backed by IndexedDB.
const TodoDB = (() => {
  const DB_NAME = 'todo-app';
  const STORE = 'tasks';
  let dbPromise;

  function open() {
    dbPromise ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  async function run(mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  return {
    all: () => run('readonly', s => s.getAll()),
    add: ({ title, dueDate = '', tags = [], repeat = null }) =>
      run('readwrite', s => s.add({ title, done: false, dueDate, tags, repeat, createdAt: Date.now() })),
    put: task => run('readwrite', s => s.put(task)),
    remove: id => run('readwrite', s => s.delete(id)),
  };
})();
