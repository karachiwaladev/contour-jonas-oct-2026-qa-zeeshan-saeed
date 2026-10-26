# Todo

A minimal todo app (Tickets #3, #4 and #5).

- Create a task with an optional **due date** and **tags** (comma-separated), mark it done, delete it.
- **Filter** by status (All / Incomplete / Completed) and by tag (dropdown, or click a tag chip).
- Overdue tasks show their due date in red.
- **Recurring tasks** (Ticket #5): repeat daily, weekly, monthly or every N days (needs a due date). Ticking one off keeps it as done and creates the next occurrence with the same title and tags; monthly repeats clamp to the month's last day (Jan 31 → Feb 28). Deleting the open occurrence stops the series. Shown with a "↻" badge.

Tasks are stored client-side in the browser's **IndexedDB** (`todo-app` database), so they persist across reloads with no server. Tasks created before due dates and tags existed still work (they just have neither).

## Run

Open `index.html` in a browser, or serve the folder (e.g. `npx serve todo`).

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page markup: new-task form, filters, list |
| `db.js` | IndexedDB wrapper (`TodoDB.all/add/put/remove`) |
| `recurrence.js` | Repeat rules: next due date, form parsing, badge label |
| `app.js` | UI: render, filters, add / toggle / delete |
| `style.css` | Styles |
