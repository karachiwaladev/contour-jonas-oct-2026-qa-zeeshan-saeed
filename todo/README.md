# Todo

A minimal todo app (Tickets #3, #4 and #5).

- Create a task with an optional **due date** and **tags** (comma-separated), mark it done, delete it.
- **Filter** by status (All / Incomplete / Completed) and by tag (dropdown, or click a tag chip).
- Overdue tasks show their due date in red.
- **Recurring tasks** (Ticket #5): repeat daily, weekly, monthly or every N days (needs a due date). Ticking one off keeps it as done and creates the next occurrence with the same title and tags; monthly repeats clamp to the month's last day (Jan 31 → Feb 28). Deleting the open occurrence stops the series. Shown with a "↻" badge.

Tasks are stored client-side in the browser's **IndexedDB** (`todo-app` database), so they persist across reloads with no server. Tasks created before due dates and tags existed still work (they just have neither).

- **Priority** (Ticket #6): High, Medium (default) or Low, shown as a coloured badge. The list is sorted by priority, then due date (undated last). A **Priority** filter combines with the status and tag filters. Recurring tasks keep their priority; tasks saved before priorities existed count as Medium.
- **Edit**: the **Edit** button turns a task into an inline form (title, due date, tags, priority, repeat) with Save / Cancel, validated like adding.

**Action log** (#12): every UI action is logged as `frontend` (`task.add`, `task.complete`, `filter.status`, …) and every IndexedDB operation as `backend` (`tasks.add`, `tasks.put`, …), as `{ ts, layer, action, details }` entries in the `logs` store and the console. Read them with `await TodoLog.all()` (or `TodoLog.export()`) in the browser console. The change eval in `evals/` compares these logs before and after each change.

## Run

Open `index.html` in a browser, or serve the folder (e.g. `npx serve todo`).

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page markup: new-task form, filters, list |
| `db.js` | IndexedDB wrapper (`TodoDB.all/add/put/remove`) |
| `logger.js` | `TodoLog`: structured frontend/backend action log |
| `recurrence.js` | Repeat rules: next due date, form parsing, badge label |
| `priority.js` | Priority levels, default, labels and sort order |
| `tests/` | Unit tests (`node --test todo/tests/`) |
| `app.js` | UI: render, filters, add / toggle / delete |
| `style.css` | Styles |
