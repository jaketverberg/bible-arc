# Bible Arcing React App

A Vite + React app for diagramming Bible propositions with SVG brackets, relationship labels, ESV passage loading, and PNG / print export.

## Local setup

```bash
npm install
npm run dev
```

## GitHub Pages setup

This project is configured to deploy automatically with **GitHub Actions** when you push to `main` or `master`.

### One-time GitHub settings

1. Push the repository to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push changes to `main`.
4. GitHub will build and publish the site automatically.

You do **not** need to put the repository name in the app code, and you do **not** need to run `npm run deploy` for Pages to work.

## Notes

- Uses `HashRouter` for GitHub Pages compatibility.
- Uses relative Vite asset paths, so it works under a project site without hard-coding `/repo-name/`.
- Stores the ESV API key in `localStorage` under `esv-api-key`.
- Includes a `public/404.html` helper for edge-case direct loads.
