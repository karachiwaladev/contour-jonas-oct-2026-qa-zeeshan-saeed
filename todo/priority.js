// Task priority: High, Medium (default) or Low. Tasks saved before priorities existed count as Medium.
const Priority = (() => {
  const LEVELS = ['high', 'medium', 'low'];
  const DEFAULT = 'medium';

  const normalize = p => (LEVELS.includes(p) ? p : DEFAULT);
  const label = p => { const n = normalize(p); return n[0].toUpperCase() + n.slice(1); };

  // High first; within a level, earliest due date first and undated tasks last.
  function compare(a, b) {
    const byLevel = LEVELS.indexOf(normalize(a.priority)) - LEVELS.indexOf(normalize(b.priority));
    if (byLevel) return byLevel;
    if (a.dueDate && b.dueDate) return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    return (a.dueDate ? 0 : 1) - (b.dueDate ? 0 : 1);
  }

  return { LEVELS, DEFAULT, normalize, label, compare };
})();

if (typeof module !== 'undefined') module.exports = Priority;
