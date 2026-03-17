# Bible Arcing React App

A Vite + React app for diagramming Bible propositions with SVG brackets, relationship labels, ESV passage loading, and PNG / print export.

## Setup

```bash
npm install
npm run dev
```

## GitHub Pages

1. Update `base` in `vite.config.js` from `/repo-name/` to your actual repository path.
2. Push the repo to GitHub.
3. Run:

```bash
npm run deploy
```

## Notes

- Uses `HashRouter` for GitHub Pages compatibility.
- Stores the ESV API key in `localStorage` under `esv-api-key`.
- Includes a `public/404.html` redirect helper.
