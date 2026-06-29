# SnowTab

A Christmas themed focus homepage with quick links, a real task list, 50 built-in wallpapers, and a Pomodoro timer.

## Features

- Search bar that supports normal searches and direct URLs
- Editable quick links with site favicons
- Task list with priorities, due labels, sprint estimates, filters, sorting, search, progress, and editing
- Pomodoro timer connected to the selected task
- Settings menu for theme, wallpaper, clock seconds, timer seconds, snow, lights, durations, notifications, and task behavior
- 50 bundled SVG wallpapers, so there are no random external image licenses to worry about
- Favicon included
- No Vite or build dependencies, so `pnpm install` does not need esbuild or PostCSS

## Run locally

```bash
pnpm install
pnpm dev
```

Then open:

```txt
http://localhost:5173
```

You can also just open `index.html`, but the local server is better for browser behavior.

## Build

```bash
pnpm build
```

The static output is copied to `dist/`.

## Deploy

Deploy the folder to GitHub Pages, Netlify, Vercel, or any static host.

For Vercel or Netlify:

- Build command: `pnpm build`
- Output folder: `dist`
