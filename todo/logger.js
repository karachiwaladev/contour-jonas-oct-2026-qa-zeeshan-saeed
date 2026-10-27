// Structured action log: "frontend" (UI) and "backend" (data layer) entries,
// persisted in IndexedDB and mirrored to the console. Read with TodoLog.all().
const TodoLog = (() => {
  let pending = Promise.resolve();

  function write(layer, action, details = {}) {
    const entry = { ts: new Date().toISOString(), layer, action, details };
    console.debug('[todo-log]', layer, action, details);
    // Chain writes so entries are stored in the order they happened.
    pending = pending.then(() => TodoDB.appendLog(entry)).catch(err => console.warn('[todo-log] write failed', err));
    return pending;
  }

  async function all() {
    await pending;
    return TodoDB.readLogs();
  }

  return { write, all, export: async () => JSON.stringify(await all(), null, 2) };
})();
