# SnowTab

SnowTab is a Christmas themed start page for studying. It has a quick link launch pad, a Pomodoro timer, a better task list, settings, a Christmas countdown, lights, snow, and a custom favicon.

## Features

- Clean Christmas homepage
- Search bar
- Quick links with editable cards
- Pomodoro timer with focus, break, and long break modes
- Timer settings with minutes and seconds
- Todo list with priority, sprint estimates, due labels, search, sorting, filters, progress, and task actions
- Selected task connects to the Pomodoro timer
- Christmas countdown with festive progress bar
- Theme picker
- Toggle snow and Christmas lights
- Settings saved with localStorage
- Favicon included

## Run locally

```bash
pnpm install
pnpm dev
```

Then open the local URL shown in the terminal.

## Build

```bash
pnpm build
```

## Terminal note

If your terminal says `uv_cwd` or `process.cwd failed`, your shell is inside a folder that no longer exists. Open a new terminal or run:

```bash
cd ..
cd snowtab
pnpm install
pnpm dev
```

If that still fails, unzip the project again into a fresh folder and run the commands there.

## License

MIT
