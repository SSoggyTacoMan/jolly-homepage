const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => [...document.querySelectorAll(selector)]

const STORAGE_KEY = 'snowtab-clean-v4'

const wallpapers = [
  ['01-santa-sleigh.svg', 'Santa sleigh'],
  ['02-north-pole.svg', 'North Pole'],
  ['03-cozy-cabin.svg', 'Cozy cabin'],
  ['04-toy-workshop.svg', 'Toy workshop'],
  ['05-reindeer-night.svg', 'Reindeer night'],
  ['06-christmas-town.svg', 'Christmas town'],
  ['07-fireplace.svg', 'Fireplace'],
  ['08-snowman-yard.svg', 'Snowman yard'],
  ['09-gingerbread.svg', 'Gingerbread'],
  ['10-present-pile.svg', 'Present pile'],
  ['11-candy-forest.svg', 'Candy forest'],
  ['12-starry-tree.svg', 'Starry tree'],
  ['13-santa-rooftops.svg', 'Rooftops'],
  ['14-winter-train.svg', 'Winter train'],
  ['15-ornament-wall.svg', 'Ornaments'],
  ['16-holly-window.svg', 'Holly window'],
  ['17-gift-wrap.svg', 'Gift wrap'],
  ['18-pine-desk.svg', 'Pine desk'],
  ['19-carol-street.svg', 'Carol street'],
  ['20-cookie-table.svg', 'Cookie table'],
  ['21-snow-globe.svg', 'Snow globe'],
  ['22-lantern-path.svg', 'Lantern path'],
  ['23-elf-mail.svg', 'Elf mail'],
  ['24-peppermint-sky.svg', 'Peppermint sky']
]

const defaultState = {
  theme: 'holly',
  wallpaper: './wallpapers/01-santa-sleigh.svg',
  customWallpaper: '',
  showClockSeconds: false,
  snow: true,
  lights: true,
  focusMinutes: 25,
  focusSeconds: 0,
  breakMinutes: 5,
  breakSeconds: 0,
  links: [
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Hack Club', url: 'https://hackclub.com' },
    { name: 'YouTube', url: 'https://youtube.com' },
    { name: 'MDN Docs', url: 'https://developer.mozilla.org' },
    { name: 'Google Drive', url: 'https://drive.google.com' },
    { name: 'Gmail', url: 'https://mail.google.com' }
  ],
  todos: [],
  todoFilter: 'open',
  focusedTodoId: null,
  sessions: 0
}

let state = loadState()
let timer = {
  mode: 'focus',
  running: false,
  remaining: durationFor('focus'),
  total: durationFor('focus'),
  intervalId: null,
  startedAt: null
}
let snowflakes = []
let snowRaf = null

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return { ...structuredClone(defaultState), ...(saved || {}) }
  } catch {
    return structuredClone(defaultState)
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function durationFor(mode) {
  if (!state) return 25 * 60
  if (mode === 'break') return Math.max(1, Number(state.breakMinutes || 0) * 60 + Number(state.breakSeconds || 0))
  return Math.max(1, Number(state.focusMinutes || 0) * 60 + Number(state.focusSeconds || 0))
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function normalizeUrl(url) {
  const clean = String(url || '').trim()
  if (!clean) return ''
  if (/^https?:\/\//i.test(clean)) return clean
  return `https://${clean}`
}

function domainFromUrl(url) {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function toast(message) {
  const el = $('#toast')
  el.textContent = message
  el.classList.add('show')
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => el.classList.remove('show'), 1800)
}

function updateClock() {
  const now = new Date()
  const options = { hour: '2-digit', minute: '2-digit' }
  if (state.showClockSeconds) options.second = '2-digit'
  $('#clock').textContent = now.toLocaleTimeString([], options)
  $('#date-line').textContent = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })
}

function updateCountdown() {
  const now = new Date()
  let christmas = new Date(now.getFullYear(), 11, 25)
  if (now > christmas) christmas = new Date(now.getFullYear() + 1, 11, 25)
  const days = Math.max(0, Math.ceil((christmas - now) / 86400000))
  $('#countdown-days').textContent = days
  $('#corner-days').textContent = days

  const start = new Date(christmas.getFullYear(), 0, 1)
  const progress = Math.min(100, Math.max(0, ((now - start) / (christmas - start)) * 100))
  $('#countdown-fill').style.width = `${progress}%`
}

function applyPageSettings() {
  document.documentElement.dataset.theme = state.theme
  const wallpaper = state.customWallpaper || state.wallpaper || defaultState.wallpaper
  document.documentElement.style.setProperty('--wallpaper-image', `url("${wallpaper}")`)
  document.body.classList.toggle('hide-snow', !state.snow)
  document.body.classList.toggle('hide-lights', !state.lights)
  $('#clock-seconds-toggle').checked = state.showClockSeconds
  $('#snow-toggle').checked = state.snow
  $('#lights-toggle').checked = state.lights
  $('#custom-wallpaper-url').value = state.customWallpaper || ''
  $('#focus-minutes').value = state.focusMinutes
  $('#focus-seconds').value = state.focusSeconds
  $('#break-minutes').value = state.breakMinutes
  $('#break-seconds').value = state.breakSeconds
  updateWallpaperGridActive()
  setupLights()
  setupSnow()
}

function setupLights() {
  const holder = $('#light-string')
  if (holder.children.length) return
  for (let i = 0; i < 22; i += 1) {
    holder.appendChild(document.createElement('span'))
  }
}

function setupSearch() {
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const query = $('#search-input').value.trim()
    if (!query) return
    const looksLikeUrl = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}/i.test(query)
    const target = looksLikeUrl ? normalizeUrl(query) : `https://www.google.com/search?q=${encodeURIComponent(query)}`
    window.location.href = target
  })
}

function renderLinks() {
  const wrapper = $('#quick-links')
  wrapper.innerHTML = ''
  state.links.forEach((link, index) => {
    const card = document.createElement('div')
    card.className = 'link-card'
    const first = link.name.trim().charAt(0).toUpperCase() || '?'
    card.innerHTML = `
      <a class="link-main" href="${normalizeUrl(link.url)}">
        <span class="link-icon">${first}</span>
        <span class="link-title">${escapeHtml(link.name)}</span>
        <span class="link-url">${escapeHtml(domainFromUrl(link.url))}</span>
      </a>
      <div class="link-actions">
        <button class="soft-button edit-link-button" type="button" data-index="${index}">Edit</button>
        <button class="soft-button delete-link-button" type="button" data-index="${index}">Delete</button>
      </div>
    `
    wrapper.appendChild(card)
  })

  $$('.edit-link-button').forEach((button) => button.addEventListener('click', () => openLinkDialog(Number(button.dataset.index))))
  $$('.delete-link-button').forEach((button) => button.addEventListener('click', () => {
    state.links.splice(Number(button.dataset.index), 1)
    saveState()
    renderLinks()
  }))
}

function openLinkDialog(index = null) {
  const editing = index !== null
  $('#editing-index').value = editing ? String(index) : ''
  $('#dialog-title').textContent = editing ? 'Edit link' : 'Add link'
  $('#link-name').value = editing ? state.links[index].name : ''
  $('#link-url').value = editing ? state.links[index].url : ''
  $('#delete-link').style.display = editing ? 'inline-flex' : 'none'
  $('#link-dialog').showModal()
}

function setupLinks() {
  $('#add-link').addEventListener('click', () => openLinkDialog())
  $('#close-dialog').addEventListener('click', () => $('#link-dialog').close())
  $('#link-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const name = $('#link-name').value.trim()
    const url = normalizeUrl($('#link-url').value)
    if (!name || !url) return
    const index = $('#editing-index').value
    if (index === '') state.links.push({ name, url })
    else state.links[Number(index)] = { name, url }
    saveState()
    renderLinks()
    $('#link-dialog').close()
  })
  $('#delete-link').addEventListener('click', () => {
    const index = Number($('#editing-index').value)
    if (Number.isInteger(index)) {
      state.links.splice(index, 1)
      saveState()
      renderLinks()
    }
    $('#link-dialog').close()
  })
}

function renderTodos() {
  const list = $('#todo-list')
  const filtered = state.todos.filter((todo) => {
    if (state.todoFilter === 'done') return todo.done
    if (state.todoFilter === 'open') return !todo.done
    return true
  })

  const openCount = state.todos.filter((todo) => !todo.done).length
  $('#todo-count').textContent = `${openCount} open`

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">${state.todos.length ? 'Nothing in this filter.' : 'No tasks yet.'}</div>`
    updateFocusedTask()
    return
  }

  list.innerHTML = ''
  filtered.forEach((todo) => {
    const item = document.createElement('div')
    item.className = `todo-item ${todo.done ? 'done' : ''}`
    item.innerHTML = `
      <input class="todo-check" type="checkbox" ${todo.done ? 'checked' : ''} aria-label="Mark task done" />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <button class="soft-button todo-focus" type="button">Focus</button>
      <button class="soft-button todo-delete" type="button">Delete</button>
    `
    item.querySelector('.todo-check').addEventListener('change', () => {
      todo.done = !todo.done
      if (todo.done && state.focusedTodoId === todo.id) state.focusedTodoId = null
      saveState()
      renderTodos()
    })
    item.querySelector('.todo-focus').addEventListener('click', () => {
      state.focusedTodoId = todo.id
      saveState()
      updateFocusedTask()
      toast('Task added to timer')
    })
    item.querySelector('.todo-delete').addEventListener('click', () => {
      state.todos = state.todos.filter((entry) => entry.id !== todo.id)
      if (state.focusedTodoId === todo.id) state.focusedTodoId = null
      saveState()
      renderTodos()
    })
    list.appendChild(item)
  })
  updateFocusedTask()
}

function setupTodos() {
  $('#todo-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const input = $('#todo-input')
    const text = input.value.trim()
    if (!text) return
    state.todos.unshift({ id: crypto.randomUUID(), text, done: false, createdAt: Date.now() })
    input.value = ''
    state.todoFilter = 'open'
    saveState()
    renderTodos()
  })

  $$('.filter-button').forEach((button) => {
    button.addEventListener('click', () => {
      state.todoFilter = button.dataset.filter
      $$('.filter-button').forEach((entry) => entry.classList.toggle('active', entry === button))
      saveState()
      renderTodos()
    })
  })

  $('#clear-done').addEventListener('click', () => {
    state.todos = state.todos.filter((todo) => !todo.done)
    saveState()
    renderTodos()
  })
}

function focusedTodo() {
  return state.todos.find((todo) => todo.id === state.focusedTodoId && !todo.done)
}

function updateFocusedTask() {
  const task = focusedTodo()
  $('#current-task-title').textContent = task ? task.text : 'No task selected'
}

function setMode(mode) {
  timer.mode = mode
  timer.running = false
  clearInterval(timer.intervalId)
  timer.total = durationFor(mode)
  timer.remaining = timer.total
  timer.startedAt = null
  $$('.mode-tab').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode))
  $('#timer-mode-title').textContent = mode === 'focus' ? 'Focus' : 'Break'
  renderTimer()
}

function renderTimer() {
  const time = formatTime(timer.remaining)
  $('#timer-display').textContent = time
  $('#mini-timer-time').textContent = time
  $('#mini-timer-label').textContent = timer.mode === 'focus' ? 'Focus' : 'Break'
  $('#timer-subtitle').textContent = timer.running ? 'Running' : 'Ready'
  $('#start-pause').textContent = timer.running ? 'Pause' : 'Start'
  $('#mini-start').textContent = timer.running ? 'Pause' : 'Start'
  $('#session-pill').textContent = `${state.sessions} session${state.sessions === 1 ? '' : 's'}`
  const done = 1 - timer.remaining / timer.total
  $('#timer-progress').style.width = `${Math.max(0, Math.min(100, done * 100))}%`
}

function toggleTimer() {
  if (timer.running) {
    timer.running = false
    clearInterval(timer.intervalId)
    renderTimer()
    return
  }
  timer.running = true
  timer.startedAt = Date.now()
  timer.intervalId = setInterval(() => {
    timer.remaining -= 1
    if (timer.remaining <= 0) finishTimer()
    else renderTimer()
  }, 1000)
  renderTimer()
}

function finishTimer() {
  clearInterval(timer.intervalId)
  timer.running = false
  timer.remaining = 0
  if (timer.mode === 'focus') state.sessions += 1
  saveState()
  renderTimer()
  toast(timer.mode === 'focus' ? 'Focus done' : 'Break done')
}

function resetTimer() {
  clearInterval(timer.intervalId)
  timer.running = false
  timer.total = durationFor(timer.mode)
  timer.remaining = timer.total
  renderTimer()
}

function setupTimer() {
  $('#start-pause').addEventListener('click', toggleTimer)
  $('#mini-start').addEventListener('click', toggleTimer)
  $('#reset-timer').addEventListener('click', resetTimer)
  $$('.mode-tab').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)))
}

function setupSettings() {
  $('#settings-open').addEventListener('click', () => $('#settings-dialog').showModal())
  $('#settings-close').addEventListener('click', () => $('#settings-dialog').close())
  $('#settings-save').addEventListener('click', () => {
    readSettingsInputs()
    saveState()
    applyPageSettings()
    resetTimer()
    updateClock()
    $('#settings-dialog').close()
  })
  $('#reset-settings').addEventListener('click', () => {
    state = structuredClone(defaultState)
    saveState()
    applyPageSettings()
    renderLinks()
    renderTodos()
    setMode('focus')
    updateClock()
    toast('Settings reset')
  })
  $$('.theme-tile').forEach((button) => button.addEventListener('click', () => {
    state.theme = button.dataset.themeButton
    saveState()
    applyPageSettings()
  }))
  $('#random-wallpaper').addEventListener('click', () => {
    const random = wallpapers[Math.floor(Math.random() * wallpapers.length)]
    state.wallpaper = `./wallpapers/${random[0]}`
    state.customWallpaper = ''
    saveState()
    applyPageSettings()
  })
  $('#custom-wallpaper-url').addEventListener('change', () => {
    state.customWallpaper = $('#custom-wallpaper-url').value.trim()
    saveState()
    applyPageSettings()
  })
}

function readSettingsInputs() {
  state.showClockSeconds = $('#clock-seconds-toggle').checked
  state.snow = $('#snow-toggle').checked
  state.lights = $('#lights-toggle').checked
  state.focusMinutes = clampNumber($('#focus-minutes').value, 0, 180, 25)
  state.focusSeconds = clampNumber($('#focus-seconds').value, 0, 59, 0)
  state.breakMinutes = clampNumber($('#break-minutes').value, 0, 90, 5)
  state.breakSeconds = clampNumber($('#break-seconds').value, 0, 59, 0)
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.floor(number)))
}

function renderWallpaperGrid() {
  const grid = $('#wallpaper-grid')
  grid.innerHTML = ''
  wallpapers.forEach(([file, label]) => {
    const button = document.createElement('button')
    button.className = 'wallpaper-tile'
    button.type = 'button'
    button.dataset.wallpaper = `./wallpapers/${file}`
    button.style.backgroundImage = `linear-gradient(180deg, transparent, rgba(0,0,0,.55)), url("./wallpapers/${file}")`
    button.textContent = label
    button.addEventListener('click', () => {
      state.wallpaper = button.dataset.wallpaper
      state.customWallpaper = ''
      saveState()
      applyPageSettings()
    })
    grid.appendChild(button)
  })
  updateWallpaperGridActive()
}

function updateWallpaperGridActive() {
  $$('.wallpaper-tile').forEach((button) => {
    button.classList.toggle('active', !state.customWallpaper && button.dataset.wallpaper === state.wallpaper)
  })
}

function setupSnow() {
  const canvas = $('#snow-canvas')
  const ctx = canvas.getContext('2d')
  const resize = () => {
    canvas.width = window.innerWidth * window.devicePixelRatio
    canvas.height = window.innerHeight * window.devicePixelRatio
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  snowflakes = Array.from({ length: 95 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 2.1 + 0.8,
    s: Math.random() * 0.7 + 0.25,
    drift: Math.random() * 0.4 - 0.2
  }))

  const draw = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    if (state.snow) {
      ctx.fillStyle = 'rgba(255,255,255,.72)'
      snowflakes.forEach((flake) => {
        flake.y += flake.s
        flake.x += flake.drift
        if (flake.y > window.innerHeight + 6) flake.y = -6
        if (flake.x > window.innerWidth + 6) flake.x = -6
        if (flake.x < -6) flake.x = window.innerWidth + 6
        ctx.beginPath()
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2)
        ctx.fill()
      })
    }
    snowRaf = requestAnimationFrame(draw)
  }
  if (!snowRaf) draw()
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]))
}

function init() {
  setupSearch()
  setupLinks()
  setupTodos()
  setupTimer()
  setupSettings()
  renderWallpaperGrid()
  applyPageSettings()
  renderLinks()
  renderTodos()
  setMode('focus')
  updateCountdown()
  updateClock()
  setInterval(updateClock, 1000)
  setInterval(updateCountdown, 60000)
}

init()
