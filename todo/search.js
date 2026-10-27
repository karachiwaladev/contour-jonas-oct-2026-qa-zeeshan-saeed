// Search (#19): case-insensitive "contains" on the title and tags; every word in the query must match.
const Search = (() => {
  const words = query => String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean);

  function matches(task, query) {
    const terms = words(query);
    if (!terms.length) return true;
    const haystack = [task.title ?? '', ...(task.tags ?? [])].map(s => s.toLowerCase());
    return terms.every(term => haystack.some(text => text.includes(term)));
  }

  return { words, matches };
})();

if (typeof module !== 'undefined') module.exports = Search;
