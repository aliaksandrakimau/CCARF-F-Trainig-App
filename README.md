# CCAR-F Trainer — deploy (flat layout)

The build failed because the entry files were not in the repo. This flat layout
(no subfolders) removes that whole class of error.

## Put ALL of these at the TOP LEVEL of the repo (no src/ folder)

```
repo-root/
├─ index.html
├─ main.jsx
├─ App.jsx          ← your ccar-f-trainer.jsx, renamed to App.jsx
├─ package.json
├─ vite.config.js
└─ wrangler.jsonc   ← only needed for the Cloudflare Workers path
```

Verify on GitHub that App.jsx and main.jsx really appear in the file list at the
top level. If they are missing, that is exactly why the build could not resolve
the entry. main.jsx imports ./App.jsx; index.html loads ./main.jsx.

## Check locally first (catches errors before pushing)

```bash
npm install
npm run build     # must succeed and create a dist/ folder
npm run preview   # optional local preview
```

If `npm run build` fails locally, fix that before touching Cloudflare.

---

## Hosting

### Recommended — Cloudflare Pages (no wrangler, simplest)
Your current project is a **Worker** (deploy command `npx wrangler deploy`),
which needs extra config. Pages is simpler for a static site:

1. Cloudflare dashboard → Workers & Pages → Create application → **Pages** →
   Connect to Git → pick this repo.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Save and Deploy. You get a `*.pages.dev` URL, and every push redeploys.

(You can leave the Workers project or delete it.)

### Keep your current Workers setup
Add `wrangler.jsonc` (included here) to the repo root. Then your existing
commands work:

- Build command: `npm install && npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

`wrangler.jsonc` tells Wrangler to publish the built `./dist` folder as static
assets. No Worker script required.

### No Git at all — Netlify Drop
`npm run build`, then drag the `dist/` folder onto app.netlify.com/drop.
