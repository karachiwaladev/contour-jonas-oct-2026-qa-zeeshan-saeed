// Recurrence rules for repeating tasks: { unit: 'day' | 'week' | 'month', every: n }.
const Recurrence = (() => {
  const pad = n => String(n).padStart(2, '0');

  // Dates are 'YYYY-MM-DD' strings; math is done in UTC so DST never shifts a day.
  function nextDueDate(dueDate, repeat) {
    const [y, m, d] = dueDate.split('-').map(Number);
    if (repeat.unit === 'month') {
      const target = new Date(Date.UTC(y, m - 1 + repeat.every, 1));
      const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
      target.setUTCDate(Math.min(d, lastDay));
      return target.toISOString().slice(0, 10);
    }
    const days = repeat.unit === 'week' ? 7 * repeat.every : repeat.every;
    const next = new Date(Date.UTC(y, m - 1, d + days));
    return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
  }

  function fromForm(choice, everyDays) {
    switch (choice) {
      case 'daily': return { unit: 'day', every: 1 };
      case 'weekly': return { unit: 'week', every: 1 };
      case 'monthly': return { unit: 'month', every: 1 };
      case 'custom': return { unit: 'day', every: Math.max(1, Math.floor(Number(everyDays)) || 1) };
      default: return null;
    }
  }

  // Inverse of fromForm, to prefill the edit form.
  function toForm(repeat) {
    if (!repeat) return { choice: '', every: 2 };
    if (repeat.every === 1) return { choice: { day: 'daily', week: 'weekly', month: 'monthly' }[repeat.unit], every: 2 };
    return { choice: 'custom', every: repeat.unit === 'week' ? repeat.every * 7 : repeat.every };
  }

  function label(repeat) {
    if (repeat.every === 1) return { day: 'daily', week: 'weekly', month: 'monthly' }[repeat.unit];
    return `every ${repeat.every} ${repeat.unit}s`;
  }

  return { nextDueDate, fromForm, toForm, label };
})();

if (typeof module !== 'undefined') module.exports = Recurrence;
