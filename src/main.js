const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => Array.from(document.querySelectorAll(selector))

const storageKey = "snowtab-v5"

const searchEngines = {
  google: { label: "Google", url: "https://www.google.com/search?q=" },
  duckduckgo: { label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  bing: { label: "Bing", url: "https://www.bing.com/search?q=" },
  brave: { label: "Brave", url: "https://search.brave.com/search?q=" },
  youtube: { label: "YouTube", url: "https://www.youtube.com/results?search_query=" }
}

const wallpapers = [
  ["00-santa-village.svg", "Santa village"],
  ["01-santa-sleigh.svg", "Sleigh"],
  ["02-north-pole.svg", "North Pole"],
  ["03-cozy-cabin.svg", "Cabin"],
  ["04-toy-workshop.svg", "Workshop"],
  ["05-reindeer-night.svg", "Reindeer"],
  ["06-christmas-town.svg", "Town"],
  ["07-fireplace.svg", "Fireplace"],
  ["08-snowman-yard.svg", "Snowman"],
  ["09-gingerbread.svg", "Gingerbread"],
  ["10-present-pile.svg", "Presents"],
  ["11-candy-forest.svg", "Candy forest"],
  ["12-starry-tree.svg", "Star tree"],
  ["13-santa-rooftops.svg", "Rooftops"],
  ["14-winter-train.svg", "Winter train"],
  ["15-ornament-wall.svg", "Ornaments"],
  ["16-holly-window.svg", "Holly"],
  ["17-gift-wrap.svg", "Gift wrap"],
  ["18-pine-desk.svg", "Pine desk"],
  ["19-carol-street.svg", "Carol street"],
  ["20-cookie-table.svg", "Cookies"],
  ["21-snow-globe.svg", "Snow globe"],
  ["22-lantern-path.svg", "Lanterns"],
  ["23-elf-mail.svg", "Elf mail"],
  ["24-peppermint-sky.svg", "Peppermint"]
]

const defaultState = {
  theme: "evergreen",
  wallpaper: "00-santa-village.svg",
  customWallpaper: "",
  snow: true,
  lights: true,
  clockSeconds: false,
  showYear: true,
  searchEngine: "google",
  focusMinutes: 25,
  focusSeconds: 0,
  breakMinutes: 5,
  breakSeconds: 0,
  timerMode: "focus",
  timerRemaining: 25 * 60,
  running: false,
  sessions: 0,
  activeTodoId: null,
  todoFilter: "open",
  scratchpad: "",
  quickLinks: [
    { name: "GitHub", url: "https://github.com" },
    { name: "Hack Club", url: "https://hackclub.com" },
    { name: "YouTube", url: "https://youtube.com" },
    { name: "MDN Docs", url: "https://developer.mozilla.org" },
    { name: "Google Drive", url: "https://drive.google.com" },
    { name: "Gmail", url: "https://mail.google.com" },
    { name: "ChatGPT", url: "https://chatgpt.com" },
    { name: "Calendar", url: "https://calendar.google.com" }
  ],
  todos: []
}

let state = loadState()
let timerInterval = null
let toastTimer = null

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey))
    if (!saved) return structuredClone(defaultState)
    return {
      ...structuredClone(defaultState),
      ...saved,
      quickLinks: Array.isArray(saved.quickLinks) ? saved.quickLinks : structuredClone(defaultState.quickLinks),
      todos: Array.isArray(saved.todos) ? saved.todos : []
    }
  } catch {
    return structuredClone(defaultState)
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state))
}

function setTimerToMode(mode = state.timerMode) {
  const total = mode === "focus"
    ? state.focusMinutes * 60 + state.focusSeconds
    : state.breakMinutes * 60 + state.breakSeconds
  state.timerMode = mode
  state.timerRemaining = Math.max(1, total)
  state.running = false
  stopTimer()
  saveState()
  renderTimer()
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.floor(seconds))
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0")
  const secs = String(safe % 60).padStart(2, "0")
  return `${minutes}:${secs}`
}

function normalizeUrl(url) {
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function getHostname(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function faviconFor(url) {
  try {
    const parsed = new URL(normalizeUrl(url))
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`
  } catch {
    return ""
  }
}

function showToast(message) {
  const toast = $("#toast")
  toast.textContent = message
  toast.classList.add("show")
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800)
}

function renderAll() {
  applyAppearance()
  updateClock()
  updateCountdown()
  renderQuickLinks()
  renderTodos()
  renderTimer()
  renderSettings()
  renderWallpapers()
  $("#scratchpad").value = state.scratchpad
}

function applyAppearance() {
  document.documentElement.dataset.theme = state.theme
  document.body.classList.toggle("no-snow", !state.snow)
  document.body.classList.toggle("no-lights", !state.lights)
  const wallpaper = state.customWallpaper || `./wallpapers/${state.wallpaper}`
  document.documentElement.style.setProperty("--wallpaper", `url("${wallpaper}")`)
  $("#engine-label").textContent = searchEngines[state.searchEngine]?.label || "Google"
}

function updateClock() {
  const now = new Date()
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }
  if (state.clockSeconds) options.second = "2-digit"
  $("#clock").textContent = now.toLocaleTimeString([], options)

  const dateOptions = {
    weekday: "long",
    day: "numeric",
    month: "long"
  }
  if (state.showYear) dateOptions.year = "numeric"
  $("#date-line").textContent = now.toLocaleDateString([], dateOptions)
}

function updateCountdown() {
  const now = new Date()
  const year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear()
  const christmas = new Date(year, 11, 25)
  const start = new Date(year, 0, 1)
  const totalYear = christmas.getTime() - start.getTime()
  const left = christmas.getTime() - now.getTime()
  const days = Math.max(0, Math.ceil(left / 86400000))
  const passed = Math.min(1, Math.max(0, 1 - left / totalYear))
  $("#countdown-days").textContent = String(days)
  $("#countdown-fill").style.width = `${passed * 100}%`
}

function renderQuickLinks() {
  const container = $("#quick-links")
  container.innerHTML = ""

  state.quickLinks.forEach((link, index) => {
    const card = document.createElement("article")
    card.className = "quick-link"
    card.innerHTML = `
      <a class="link-main" href="${normalizeUrl(link.url)}">
        <span class="link-icon"><img alt="" src="${faviconFor(link.url)}"></span>
        <span>
          <span class="link-name"></span>
          <span class="link-url">${getHostname(link.url)}</span>
        </span>
      </a>
      <div class="link-actions">
        <button class="soft-button small" data-edit-link="${index}" type="button">Edit</button>
        <button class="danger-button small" data-delete-link="${index}" type="button">Delete</button>
      </div>
    `
    card.querySelector(".link-name").textContent = link.name
    container.appendChild(card)
  })
}

function openLinkDialog(index = null) {
  const dialog = $("#link-dialog")
  const editing = index !== null
  $("#dialog-title").textContent = editing ? "Edit link" : "Add link"
  $("#editing-index").value = editing ? String(index) : ""
  $("#link-name").value = editing ? state.quickLinks[index].name : ""
  $("#link-url").value = editing ? state.quickLinks[index].url : ""
  $("#delete-link").style.display = editing ? "inline-flex" : "none"
  dialog.showModal()
  $("#link-name").focus()
}

function renderTodos() {
  const list = $("#todo-list")
  const openTodos = state.todos.filter((todo) => !todo.done)
  $("#todo-count").textContent = `${openTodos.length} open`

  $$(".filter-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.todoFilter)
  })

  const visible = state.todos.filter((todo) => {
    if (state.todoFilter === "open") return !todo.done
    if (state.todoFilter === "done") return todo.done
    return true
  })

  list.innerHTML = ""
  if (!visible.length) {
    const empty = document.createElement("div")
    empty.className = "empty-state"
    empty.textContent = state.todoFilter === "done" ? "No done tasks yet." : "No tasks here."
    list.appendChild(empty)
    return
  }

  visible.forEach((todo) => {
    const item = document.createElement("div")
    item.className = `todo-item${todo.done ? " done" : ""}`
    item.dataset.id = todo.id
    item.innerHTML = `
      <input data-toggle-todo="${todo.id}" type="checkbox" ${todo.done ? "checked" : ""} aria-label="Mark task done">
      <span class="todo-title"></span>
      <div class="todo-actions">
        <button class="soft-button small ${state.activeTodoId === todo.id ? "active-focus" : ""}" data-focus-todo="${todo.id}" type="button">Focus</button>
        <button class="danger-button small" data-delete-todo="${todo.id}" type="button">Delete</button>
      </div>
    `
    item.querySelector(".todo-title").textContent = todo.text
    list.appendChild(item)
  })

  const activeTodo = state.todos.find((todo) => todo.id === state.activeTodoId && !todo.done)
  $("#current-task-title").textContent = activeTodo ? activeTodo.text : "No task selected"
}

function addTodo(text) {
  const clean = text.trim()
  if (!clean) return
  const todo = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    text: clean,
    done: false,
    createdAt: Date.now()
  }
  state.todos.unshift(todo)
  state.activeTodoId = todo.id
  state.todoFilter = "open"
  saveState()
  renderTodos()
}

function renderTimer() {
  const modeTitle = state.timerMode === "focus" ? "Focus" : "Break"
  $("#timer-mode-title").textContent = modeTitle
  $("#timer-display").textContent = formatTime(state.timerRemaining)
  $("#timer-subtitle").textContent = state.running ? "Running" : "Ready"
  $("#start-pause").textContent = state.running ? "Pause" : "Start"
  $("#session-pill").textContent = `${state.sessions} session${state.sessions === 1 ? "" : "s"}`

  const total = state.timerMode === "focus"
    ? state.focusMinutes * 60 + state.focusSeconds
    : state.breakMinutes * 60 + state.breakSeconds
  const progress = total ? 100 - (state.timerRemaining / total) * 100 : 0
  $("#timer-progress").style.width = `${Math.max(0, Math.min(100, progress))}%`

  $$(".mode-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.timerMode)
  })
}

function startTimer() {
  if (state.running) {
    state.running = false
    stopTimer()
    saveState()
    renderTimer()
    return
  }

  state.running = true
  timerInterval = setInterval(() => {
    state.timerRemaining -= 1
    if (state.timerRemaining <= 0) {
      finishTimer()
      return
    }
    saveState()
    renderTimer()
  }, 1000)
  saveState()
  renderTimer()
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = null
}

function finishTimer() {
  stopTimer()
  if (state.timerMode === "focus") {
    state.sessions += 1
    showToast("Focus done")
  } else {
    showToast("Break done")
  }
  state.running = false
  setTimerToMode(state.timerMode === "focus" ? "break" : "focus")
}

function renderSettings() {
  $("#clock-seconds-toggle").checked = state.clockSeconds
  $("#date-year-toggle").checked = state.showYear
  $("#snow-toggle").checked = state.snow
  $("#lights-toggle").checked = state.lights
  $("#search-engine").value = state.searchEngine
  $("#focus-minutes").value = state.focusMinutes
  $("#focus-seconds").value = state.focusSeconds
  $("#break-minutes").value = state.breakMinutes
  $("#break-seconds").value = state.breakSeconds
  $("#custom-wallpaper-url").value = state.customWallpaper

  $$(`[data-theme-button]`).forEach((button) => {
    button.classList.toggle("active", button.dataset.themeButton === state.theme)
  })
}

function renderWallpapers() {
  const grid = $("#wallpaper-grid")
  grid.innerHTML = ""
  wallpapers.forEach(([file, name]) => {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "wallpaper-tile"
    button.dataset.wallpaper = file
    button.dataset.name = name
    button.style.backgroundImage = `url("./wallpapers/${file}")`
    button.classList.toggle("active", !state.customWallpaper && state.wallpaper === file)
    grid.appendChild(button)
  })
}

function saveSettingsFromDialog() {
  const previousMode = state.timerMode
  state.clockSeconds = $("#clock-seconds-toggle").checked
  state.showYear = $("#date-year-toggle").checked
  state.snow = $("#snow-toggle").checked
  state.lights = $("#lights-toggle").checked
  state.searchEngine = $("#search-engine").value
  state.focusMinutes = Number($("#focus-minutes").value) || 0
  state.focusSeconds = Number($("#focus-seconds").value) || 0
  state.breakMinutes = Number($("#break-minutes").value) || 0
  state.breakSeconds = Number($("#break-seconds").value) || 0
  state.customWallpaper = $("#custom-wallpaper-url").value.trim()
  if (!state.running) setTimerToMode(previousMode)
  saveState()
  renderAll()
}

function bindEvents() {
  $("#search-form").addEventListener("submit", (event) => {
    event.preventDefault()
    const query = $("#search-input").value.trim()
    if (!query) return
    if (/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}/i.test(query) && !query.includes(" ")) {
      window.location.href = normalizeUrl(query)
      return
    }
    const engine = searchEngines[state.searchEngine] || searchEngines.google
    window.location.href = `${engine.url}${encodeURIComponent(query)}`
  })

  $("#settings-open").addEventListener("click", () => {
    renderSettings()
    renderWallpapers()
    $("#settings-dialog").showModal()
  })
  $("#settings-close").addEventListener("click", () => $("#settings-dialog").close())
  $("#settings-save").addEventListener("click", () => {
    saveSettingsFromDialog()
    $("#settings-dialog").close()
  })
  $("#reset-settings").addEventListener("click", () => {
    const keepLinks = state.quickLinks
    const keepTodos = state.todos
    state = structuredClone(defaultState)
    state.quickLinks = keepLinks
    state.todos = keepTodos
    saveState()
    renderAll()
    showToast("Settings reset")
  })

  $$(`[data-theme-button]`).forEach((button) => {
    button.addEventListener("click", () => {
      state.theme = button.dataset.themeButton
      saveState()
      renderAll()
    })
  })

  $("#wallpaper-grid").addEventListener("click", (event) => {
    const tile = event.target.closest("[data-wallpaper]")
    if (!tile) return
    state.wallpaper = tile.dataset.wallpaper
    state.customWallpaper = ""
    saveState()
    renderAll()
  })

  $("#random-wallpaper").addEventListener("click", () => {
    const random = wallpapers[Math.floor(Math.random() * wallpapers.length)][0]
    state.wallpaper = random
    state.customWallpaper = ""
    saveState()
    renderAll()
  })

  $("#add-link").addEventListener("click", () => openLinkDialog())
  $("#close-dialog").addEventListener("click", () => $("#link-dialog").close())
  $("#quick-links").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit-link]")
    const del = event.target.closest("[data-delete-link]")
    if (edit || del) event.preventDefault()
    if (edit) openLinkDialog(Number(edit.dataset.editLink))
    if (del) {
      state.quickLinks.splice(Number(del.dataset.deleteLink), 1)
      saveState()
      renderQuickLinks()
    }
  })

  $("#link-form").addEventListener("submit", (event) => {
    event.preventDefault()
    const index = $("#editing-index").value
    const link = {
      name: $("#link-name").value.trim(),
      url: normalizeUrl($("#link-url").value)
    }
    if (!link.name || !link.url) return
    if (index === "") state.quickLinks.push(link)
    else state.quickLinks[Number(index)] = link
    saveState()
    renderQuickLinks()
    $("#link-dialog").close()
  })

  $("#delete-link").addEventListener("click", () => {
    const index = $("#editing-index").value
    if (index !== "") state.quickLinks.splice(Number(index), 1)
    saveState()
    renderQuickLinks()
    $("#link-dialog").close()
  })

  $("#todo-form").addEventListener("submit", (event) => {
    event.preventDefault()
    addTodo($("#todo-input").value)
    $("#todo-input").value = ""
  })

  $("#todo-list").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-toggle-todo]")
    const focus = event.target.closest("[data-focus-todo]")
    const del = event.target.closest("[data-delete-todo]")
    if (toggle) {
      const todo = state.todos.find((item) => item.id === toggle.dataset.toggleTodo)
      if (todo) todo.done = toggle.checked
      if (todo?.done && state.activeTodoId === todo.id) state.activeTodoId = null
    }
    if (focus) {
      const id = focus.dataset.focusTodo
      state.activeTodoId = state.activeTodoId === id ? null : id
    }
    if (del) {
      const id = del.dataset.deleteTodo
      state.todos = state.todos.filter((item) => item.id !== id)
      if (state.activeTodoId === id) state.activeTodoId = null
    }
    saveState()
    renderTodos()
  })

  $$(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.todoFilter = button.dataset.filter
      saveState()
      renderTodos()
    })
  })

  $("#clear-done").addEventListener("click", () => {
    state.todos = state.todos.filter((todo) => !todo.done)
    saveState()
    renderTodos()
  })

  $("#scratchpad").addEventListener("input", (event) => {
    state.scratchpad = event.target.value
    saveState()
  })
  $("#clear-note").addEventListener("click", () => {
    state.scratchpad = ""
    $("#scratchpad").value = ""
    saveState()
  })

  $$(".mode-tab").forEach((button) => {
    button.addEventListener("click", () => setTimerToMode(button.dataset.mode))
  })
  $("#start-pause").addEventListener("click", startTimer)
  $("#reset-timer").addEventListener("click", () => setTimerToMode(state.timerMode))
}

function createSnow() {
  const canvas = $("#snow-canvas")
  const ctx = canvas.getContext("2d")
  let flakes = []

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio
    canvas.height = window.innerHeight * window.devicePixelRatio
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
    const count = Math.min(130, Math.floor(window.innerWidth / 12))
    flakes = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.2 + 0.6,
      s: Math.random() * 0.7 + 0.25,
      drift: Math.random() * 0.5 - 0.25
    }))
  }

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    if (!state.snow) {
      requestAnimationFrame(draw)
      return
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)"
    flakes.forEach((flake) => {
      flake.y += flake.s
      flake.x += flake.drift
      if (flake.y > window.innerHeight + 6) flake.y = -6
      if (flake.x < -6) flake.x = window.innerWidth + 6
      if (flake.x > window.innerWidth + 6) flake.x = -6
      ctx.beginPath()
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2)
      ctx.fill()
    })
    requestAnimationFrame(draw)
  }

  window.addEventListener("resize", resize)
  resize()
  draw()
}

bindEvents()
renderAll()
createSnow()
setInterval(updateClock, 250)
setInterval(updateCountdown, 60000)
