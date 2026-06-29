# SnowTab

A Christmas themed study homepage with quick links, a Pomodoro timer, a better task list, countdown, settings, and festive CSS decorations.

## Features

- Search bar
- Editable quick links
- Christmas countdown
- Pomodoro timer
- Focus, short break, and long break modes
- Timer presets
- Custom minutes and seconds in settings
- Task list with priorities
- Task sprint estimates
- Task filters for open, all, and done
- Pick next task button
- Select a task for the timer
- Log focus sprints onto the selected task
- Move, edit, delete, and finish tasks
- Themes
- Snow and Christmas lights toggles
- Local storage saving

## Run locally

```bash
pnpm install
pnpm dev
```

If you already installed an older broken copy, reset the install first:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Notes

This version pins Vite and includes PostCSS in dev dependencies so the CSS startup error does not happen.
