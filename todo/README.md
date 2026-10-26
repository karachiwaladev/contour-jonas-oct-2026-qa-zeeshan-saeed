# Todo

A minimal todo app (Ticket #3): create a task, mark it done, delete it.
Tasks are stored client-side in the browser's **IndexedDB** (`todo-app` database), so they persist across reloads with no server.

## Run

Open `index.html` in a browser, or serve the folder (e.g. `npx serve todo`).

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page markup |
| `db.js` | IndexedDB wrapper (`TodoDB.all/add/put/remove`) |
| `app.js` | UI: render list, add / toggle / delete |
| `style.css` | Styles |
