# SnowTab

A clean Christmas focus homepage with quick links, a simple todo list, a simple Pomodoro timer, and working wallpaper settings.

## Features

- Search bar for Google or direct URLs
- Editable quick links
- Simple todo list with filters
- Simple Pomodoro timer with focus and break mode
- Current task selection from the todo list
- Christmas countdown
- 50 bundled Christmas/winter wallpapers
- Custom wallpaper URL option
- Theme picker
- Snow, lights, and clock settings
- Favicon included
- Saves settings, tasks, and links in localStorage

## Run locally

This version has no Vite, PostCSS, esbuild, or build-step dependency.

```bash
pnpm install
pnpm dev
```

Then open:

```txt
http://localhost:5173
```

You can also run it directly with Python:

```bash
python3 -m http.server 5173
```

## Deploy

The project is static. Deploy the whole folder, or run:

```bash
pnpm build
```

Then deploy the `dist` folder.
