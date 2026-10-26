# Todo

A minimal todo app (Tickets #3 and #4).

- Create a task with an optional **due date** and **tags** (comma-separated), mark it done, delete it.
- **Filter** by status (All / Incomplete / Completed) and by tag (dropdown, or click a tag chip).
- Overdue tasks show their due date in red.

Tasks are stored client-side in the browser's **IndexedDB** (`todo-app` database), so they persist across reloads with no server. Tasks created before due dates and tags existed still work (they just have neither).

## Run

Open `index.html` in a browser, or serve the folder (e.g. `npx serve todo`).

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page markup: new-task form, filters, list |
| `db.js` | IndexedDB wrapper (`TodoDB.all/add/put/remove`) |
| `app.js` | UI: render, filters, add / toggle / delete |
| `style.css` | Styles |
