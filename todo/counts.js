// Task count footer (#16): how many tasks are open and done, over all tasks regardless of filters.
const Counts = (() => {
  function summary(tasks) {
    const done = tasks.filter(t => t.done).length;
    const open = tasks.length - done;
    return { open, done, text: `${open} open · ${done} done` };
  }

  return { summary };
})();

if (typeof module !== 'undefined') module.exports = Counts;
