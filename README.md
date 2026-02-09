# HTMSQL DB-Driven Pages

This repo serves a static HTMSQL landing site where all visible content is loaded from a browser SQLite database. The JS/WASM runtime is internal glue; the experience is positioned as HTML + SQL for developers.

## How to view

SQLite WASM requires an HTTP server (file:// will not load the WASM file).

```bash
cd /Users/jordan.cleigh/devel/htmsql
python3 -m http.server 8000
```

Open any page in your browser:

- http://localhost:8000/index.html
- http://localhost:8000/docs.html
- http://localhost:8000/launch.html
- http://localhost:8000/start.html
- http://localhost:8000/generate.html
- http://localhost:8000/sales.html

## GitHub Pages

This repo includes a GitHub Actions workflow that publishes the repository root to GitHub Pages on pushes to `main`.

## Editing content live

Open DevTools and run SQL against the content database:

```js
await window.htmlsql.ready;
const [hero] = await window.htmlsql.exec(
  "SELECT id, payload FROM blocks WHERE page_slug = ? AND type = ?",
  ["home", "hero"]
);
const payload = JSON.parse(hero.payload);
payload.title = "New title";
await window.htmlsql.exec("UPDATE blocks SET payload = ? WHERE id = ?", [
  JSON.stringify(payload),
  hero.id,
]);
await window.htmlsql.render();
```
