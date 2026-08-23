# CCAR-F Trainer — deploy guide

This turns the `ccar-f-trainer.jsx` component into a real website you can host for free.

## Folder layout

Put your downloaded file into `src/` and rename it to `App.jsx`:

```
ccar-f-trainer/
├─ index.html
├─ package.json
├─ vite.config.js
└─ src/
   ├─ main.jsx
   └─ App.jsx      ← your ccar-f-trainer.jsx, renamed
```

The component already ends with `export default function App()`, so no code changes are needed.

## Build it locally (requires Node.js 18+)

```bash
npm install
npm run dev      # local preview at http://localhost:5173
npm run build    # produces the static site in dist/
```

`dist/` is the folder you deploy.

---

## Free hosting options

### A. No terminal at all — StackBlitz / CodeSandbox
1. Go to stackblitz.com → New → Vite + React.
2. Replace `src/App.jsx` with your file's contents.
3. You instantly get a public live URL. From there you can one-click "Deploy to Netlify."

### B. Netlify Drop — drag & drop (simplest real deploy)
1. Run `npm run build` locally.
2. Open app.netlify.com/drop and drag the `dist/` folder onto the page.
3. You get a live URL in seconds. Free.

### C. GitHub + Vercel (best for a permanent URL that auto-updates)
1. Push this folder to a new GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. Vercel auto-detects Vite (build `npm run build`, output `dist`). Click Deploy.
4. Every future `git push` redeploys automatically. Free Hobby tier.

### D. Cloudflare Pages
1. Push to GitHub.
2. Cloudflare Pages → Create → connect repo → framework preset "Vite",
   build command `npm run build`, output directory `dist`. Free.

### E. GitHub Pages
1. Push to GitHub.
2. Add the `gh-pages` package or a GitHub Actions workflow that builds and
   publishes `dist/`. Because `vite.config.js` uses `base: "./"`, it works on
   the `username.github.io/repo/` subpath without extra config.

All five keep the app fully free. B is fastest one-off; C is best if you want a
stable link you can keep improving.
