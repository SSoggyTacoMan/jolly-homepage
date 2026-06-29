const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => Array.from(document.querySelectorAll(selector))

const STORAGE_KEY = 'snowtab.clean.v1'
const RING_LENGTH = 590.62

const wallpapers = [
  ['01-evergreen-glow.svg', 'Evergreen'], ['02-nordic-pine.svg', 'Nordic'], ['03-candle-window.svg', 'Candle'],
  ['04-frost-glass.svg', 'Frost'], ['05-gold-garland.svg', 'Garland'], ['06-blue-winter.svg', 'Blue'],
  ['07-cocoa-plaid.svg', 'Cocoa'], ['08-mint-lights.svg', 'Mint'], ['09-red-velvet.svg', 'Velvet'],
  ['10-snow-village.svg', 'Village'], ['11-pine-shadows.svg', 'Pine'], ['12-quiet-chapel.svg', 'Chapel'],
  ['13-warm-kitchen.svg', 'Kitchen'], ['14-ice-ornaments.svg', 'Ornaments'], ['15-ribbon-dusk.svg', 'Ribbon'],
  ['16-forest-stars.svg', 'Stars'], ['17-gingerbread.svg', 'Gingerbread'], ['18-silver-bells.svg', 'Bells'],
  ['19-toy-workshop.svg', 'Workshop'], ['20-holiday-desk.svg', 'Desk'], ['21-polar-night.svg', 'Polar'],
  ['22-cranberry-frost.svg', 'Cranberry'], ['23-soft-lanterns.svg', 'Lanterns'], ['24-holly-paper.svg', 'Holly'],
  ['25-golden-hour.svg', 'Golden'], ['26-snowy-street.svg', 'Street'], ['27-fir-branches.svg', 'Fir'],
  ['28-paper-stars.svg', 'Paper stars'], ['29-cabin-glow.svg', 'Cabin'], ['30-frozen-lake.svg', 'Lake'],
  ['31-candy-stripe.svg', 'Candy'], ['32-winter-market.svg', 'Market'], ['33-warm-fireplace.svg', 'Fireplace'],
  ['34-pine-wreath.svg', 'Wreath'], ['35-moonlit-snow.svg', 'Moonlit'], ['36-peppermint-haze.svg', 'Peppermint'],
  ['37-cedar-room.svg', 'Cedar'], ['38-snowfall-green.svg', 'Snowfall'], ['39-starry-cocoa.svg', 'Cocoa stars'],
  ['40-gift-wrap.svg', 'Gift wrap'], ['41-christmas-morning.svg', 'Morning'], ['42-glass-ornaments.svg', 'Glass'],
  ['43-quiet-red.svg', 'Quiet red'], ['44-northern-lights.svg', 'Aurora'], ['45-icy-mint.svg', 'Icy mint'],
  ['46-candle-pine.svg', 'Candle pine'], ['47-snow-curtain.svg', 'Curtain'], ['48-jolly-amber.svg', 'Amber'],
  ['49-deep-green.svg', 'Deep green'], ['50-holiday-lights.svg', 'Lights']
]

const defaultState = {
  theme: 'cream',
  wallpaper: '06-blue-winter.svg',
  customWallpaper: '',
  useCustomWallpaper: false,
  snow: true,
  lights: true,
  clockSeconds: false,
  showTimerSeconds: true,
  timerSound: true,
  focusSeconds: 25 * 60,
  breakSeconds: 5 * 60,
  links: [
    { id: crypto.randomUUID(), name: 'GitHub', url: 'https://github.com' },
    { id: crypto.randomUUID(), name: 'Hack Club', url: 'https://hackclub.com' },
    { id: crypto.randomUUID(), name: 'YouTube', url: 'https://youtube.com' },
    { id: crypto.randomUUID(), name: 'MDN Docs', url: 'https://developer.mozilla.org' },
    { id: crypto.randomUUID(), name: 'Google Drive', url: 'https://drive.google.com' },
    { id: crypto.randomUUID(), name: 'Gmail', url: 'https://mail.google.com' }
  ],
  tasks: [],
  selectedTaskId: null,
  taskFilter: 'open',
  sessions: 0
}

let state = loadState()
let timer = {
  mode: 'focus',
  remaining: state.focusSeconds,
  total: state.focusSeconds,
  running: false,
  interval: null,
  lastTick: null
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved) return structuredClone(defaultState)
    return {
      ...structuredClone(defaultState),
      ...saved,
      links: Array.isArray(saved.links) ? saved.links : structuredClone(defaultState.links),
      tasks: Array.isArray(saved.tasks) ? saved.tasks : []
    }
  } catch {
    return structuredClone(defaultState)
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function normalizeUrl(value) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

function toast(message) {
  const el = $('#toast')
  el.textContent = message
  el.classList.add('show')
  clearTimeout(toast.timeout)
  toast.timeout = setTimeout(() => el.classList.remove('show'), 1700)
}

function applyVisuals() {
  document.documentElement.dataset.theme = state.theme
  document.body.classList.toggle('no-snow', !state.snow)
  document.body.classList.toggle('no-lights', !state.lights)

  const source = state.useCustomWallpaper && state.customWallpaper
    ? state.customWallpaper
    : `./wallpapers/${state.wallpaper}`
  document.documentElement.style.setProperty('--wallpaper-image', `url("${source}")`)

  $$('.theme-option').forEach((button) => {
    button.classList.toggle('active', button.dataset.theme === state.theme)
  })
  $$('.wallpaper-tile').forEach((button) => {
    button.classList.toggle('active', !state.useCustomWallpaper && button.dataset.wallpaper === state.wallpaper)
  })
}

function renderClock() {
  const now = new Date()
  const timeOptions = { hour: '2-digit', minute: '2-digit' }
  if (state.clockSeconds) timeOptions.second = '2-digit'
  $('#clock').textContent = now.toLocaleTimeString([], timeOptions)
  $('#date-line').textContent = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

function renderCountdown() {
  const now = new Date()
  let year = now.getFullYear()
  let christmas = new Date(year, 11, 25)
  if (now > christmas) christmas = new Date(year + 1, 11, 25)

  const start = new Date(christmas.getFullYear(), 0, 1)
  const total = christmas - start
  const elapsed = now - start
  const days = Math.ceil((christmas - now) / 86400000)
  const progress = Math.max(0, Math.min(100, (elapsed / total) * 100))

  $('#countdown-days').textContent = days
  $('#countdown-line').textContent = days === 0
    ? 'Christmas is today.'
    : days === 1
      ? 'One day left.'
      : 'Lights, food, and break are getting closer.'
  $('#countdown-fill').style.width = `${progress}%`
}

function renderLinks() {
  $('#quick-links').innerHTML = state.links.map((link) => `
    <div class="link-card" data-id="${link.id}">
      <a href="${link.url}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(link.name)}">
        <span class="link-icon">${escapeHtml(link.name.slice(0, 1).toUpperCase())}</span>
        <strong>${escapeHtml(link.name)}</strong>
        <span>${escapeHtml(domainFromUrl(link.url))}</span>
      </a>
      <div class="link-actions">
        <button class="ghost edit-link" type="button">Edit</button>
        <button class="danger delete-link-inline" type="button">Delete</button>
      </div>
    </div>
  `).join('')
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function filteredTasks() {
  if (state.taskFilter === 'done') return state.tasks.filter((task) => task.done)
  if (state.taskFilter === 'all') return state.tasks
  return state.tasks.filter((task) => !task.done)
}

function renderTasks() {
  const openCount = state.tasks.filter((task) => !task.done).length
  $('#todo-count').textContent = `${openCount} open`
  $$('.filter').forEach((button) => button.classList.toggle('active', button.dataset.filter === state.taskFilter))

  const tasks = filteredTasks()
  if (!tasks.length) {
    $('#todo-list').innerHTML = `<div class="empty-state">${state.tasks.length ? 'Nothing here.' : 'No tasks yet.'}</div>`
    renderSelectedTask()
    return
  }

  $('#todo-list').innerHTML = tasks.map((task) => `
    <div class="task ${task.done ? 'done' : ''}" data-id="${task.id}">
      <input class="task-check" type="checkbox" ${task.done ? 'checked' : ''} aria-label="Mark task done" />
      <span class="task-title">${escapeHtml(task.title)}</span>
      <button class="ghost small task-focus ${state.selectedTaskId === task.id ? 'active' : ''}" type="button">Focus</button>
      <button class="ghost small task-delete" type="button">Delete</button>
    </div>
  `).join('')
  renderSelectedTask()
}

function renderSelectedTask() {
  const selected = state.tasks.find((task) => task.id === state.selectedTaskId && !task.done)
  $('#selected-task-title').textContent = selected ? selected.title : 'No task selected'
  $('#clear-selected-task').hidden = !selected
  if (!selected && state.selectedTaskId) {
    state.selectedTaskId = null
    saveState()
  }
}

function setTimerMode(mode) {
  stopTimer()
  timer.mode = mode
  timer.total = mode === 'focus' ? state.focusSeconds : state.breakSeconds
  timer.remaining = timer.total
  $$('.mode').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode))
  $('#timer-mode-title').textContent = mode === 'focus' ? 'Focus' : 'Break'
  $('#start-pause').textContent = 'Start'
  renderTimer()
}

function renderTimer() {
  const minutes = Math.floor(timer.remaining / 60)
  const seconds = timer.remaining % 60
  const showSeconds = state.showTimerSeconds || timer.remaining < 60
  $('#timer-display').textContent = showSeconds
    ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')} min`

  $('#timer-state').textContent = timer.running ? 'Running' : 'Ready'
  $('#session-count').textContent = `${state.sessions} session${state.sessions === 1 ? '' : 's'}`

  const progress = timer.total > 0 ? 1 - timer.remaining / timer.total : 1
  $('#timer-progress').style.strokeDashoffset = `${RING_LENGTH * (1 - progress)}`
}

function startTimer() {
  if (timer.running) return
  timer.running = true
  timer.lastTick = Date.now()
  timer.interval = setInterval(tickTimer, 250)
  $('#start-pause').textContent = 'Pause'
  renderTimer()
}

function stopTimer() {
  timer.running = false
  clearInterval(timer.interval)
  timer.interval = null
  $('#start-pause').textContent = 'Start'
  renderTimer()
}

function tickTimer() {
  const now = Date.now()
  const diff = Math.floor((now - timer.lastTick) / 1000)
  if (diff <= 0) return
  timer.lastTick += diff * 1000
  timer.remaining = Math.max(0, timer.remaining - diff)
  if (timer.remaining === 0) completeTimer()
  renderTimer()
}

function completeTimer() {
  stopTimer()
  if (timer.mode === 'focus') {
    state.sessions += 1
    saveState()
    toast('Focus session done')
    if (state.timerSound) playBell()
    setTimerMode('break')
  } else {
    toast('Break done')
    if (state.timerSound) playBell()
    setTimerMode('focus')
  }
}

function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.16)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.36)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.38)
  } catch {}
}

function renderWallpaperPicker() {
  $('#wallpaper-grid').innerHTML = wallpapers.map(([file, name]) => `
    <button class="wallpaper-tile" data-wallpaper="${file}" data-name="${escapeHtml(name)}" style="background-image: url('./wallpapers/${file}')" type="button"></button>
  `).join('')
}

function syncSettingsForm() {
  $('#focus-minutes').value = Math.floor(state.focusSeconds / 60)
  $('#focus-seconds').value = state.focusSeconds % 60
  $('#break-minutes').value = Math.floor(state.breakSeconds / 60)
  $('#break-seconds').value = state.breakSeconds % 60
  $('#show-timer-seconds').checked = state.showTimerSeconds
  $('#timer-sound').checked = state.timerSound
  $('#snow-toggle').checked = state.snow
  $('#lights-toggle').checked = state.lights
  $('#clock-seconds-toggle').checked = state.clockSeconds
  $('#custom-wallpaper-url').value = state.customWallpaper
}

function saveSettingsFromForm() {
  const focus = Number($('#focus-minutes').value) * 60 + Number($('#focus-seconds').value)
  const brk = Number($('#break-minutes').value) * 60 + Number($('#break-seconds').value)
  state.focusSeconds = Math.max(1, focus)
  state.breakSeconds = Math.max(1, brk)
  state.showTimerSeconds = $('#show-timer-seconds').checked
  state.timerSound = $('#timer-sound').checked
  state.snow = $('#snow-toggle').checked
  state.lights = $('#lights-toggle').checked
  state.clockSeconds = $('#clock-seconds-toggle').checked
  state.customWallpaper = $('#custom-wallpaper-url').value.trim()
  state.useCustomWallpaper = Boolean(state.customWallpaper)
  saveState()
  applyVisuals()
  setTimerMode(timer.mode)
  renderClock()
}

function bindEvents() {
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const query = $('#search-input').value.trim()
    if (!query) return
    const looksLikeUrl = query.includes('.') && !query.includes(' ')
    window.location.href = looksLikeUrl ? normalizeUrl(query) : `https://www.google.com/search?q=${encodeURIComponent(query)}`
  })

  $('#add-link').addEventListener('click', () => openLinkDialog())
  $('#quick-links').addEventListener('click', (event) => {
    const card = event.target.closest('.link-card')
    if (!card) return
    const id = card.dataset.id
    if (event.target.closest('.edit-link')) {
      event.preventDefault()
      openLinkDialog(id)
    }
    if (event.target.closest('.delete-link-inline')) {
      event.preventDefault()
      state.links = state.links.filter((link) => link.id !== id)
      saveState()
      renderLinks()
    }
  })

  $('#link-close').addEventListener('click', () => $('#link-dialog').close())
  $('#link-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const id = $('#editing-link-id').value
    const name = $('#link-name').value.trim()
    const url = normalizeUrl($('#link-url').value)
    if (!name || !url) return
    if (id) {
      const link = state.links.find((item) => item.id === id)
      if (link) Object.assign(link, { name, url })
    } else {
      state.links.push({ id: crypto.randomUUID(), name, url })
    }
    saveState()
    renderLinks()
    $('#link-dialog').close()
  })
  $('#delete-link').addEventListener('click', () => {
    const id = $('#editing-link-id').value
    state.links = state.links.filter((link) => link.id !== id)
    saveState()
    renderLinks()
    $('#link-dialog').close()
  })

  $('#todo-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const input = $('#todo-input')
    const title = input.value.trim()
    if (!title) return
    state.tasks.unshift({ id: crypto.randomUUID(), title, done: false, createdAt: Date.now() })
    input.value = ''
    saveState()
    renderTasks()
  })

  $('#todo-list').addEventListener('click', (event) => {
    const taskEl = event.target.closest('.task')
    if (!taskEl) return
    const task = state.tasks.find((item) => item.id === taskEl.dataset.id)
    if (!task) return
    if (event.target.matches('.task-check')) {
      task.done = event.target.checked
      if (task.done && state.selectedTaskId === task.id) state.selectedTaskId = null
      saveState()
      renderTasks()
    }
    if (event.target.closest('.task-focus')) {
      if (!task.done) state.selectedTaskId = task.id
      saveState()
      renderTasks()
    }
    if (event.target.closest('.task-delete')) {
      state.tasks = state.tasks.filter((item) => item.id !== task.id)
      if (state.selectedTaskId === task.id) state.selectedTaskId = null
      saveState()
      renderTasks()
    }
  })

  $$('.filter').forEach((button) => button.addEventListener('click', () => {
    state.taskFilter = button.dataset.filter
    saveState()
    renderTasks()
  }))

  $('#clear-done').addEventListener('click', () => {
    state.tasks = state.tasks.filter((task) => !task.done)
    saveState()
    renderTasks()
  })
  $('#clear-selected-task').addEventListener('click', () => {
    state.selectedTaskId = null
    saveState()
    renderTasks()
  })

  $$('.mode').forEach((button) => button.addEventListener('click', () => setTimerMode(button.dataset.mode)))
  $('#start-pause').addEventListener('click', () => timer.running ? stopTimer() : startTimer())
  $('#reset-timer').addEventListener('click', () => setTimerMode(timer.mode))

  $('#settings-open').addEventListener('click', () => {
    syncSettingsForm()
    applyVisuals()
    $('#settings-dialog').showModal()
  })
  $('#settings-close').addEventListener('click', () => $('#settings-dialog').close())
  $('#settings-save').addEventListener('click', () => {
    saveSettingsFromForm()
    $('#settings-dialog').close()
  })
  $('#reset-settings').addEventListener('click', () => {
    const keepLinks = state.links
    const keepTasks = state.tasks
    state = { ...structuredClone(defaultState), links: keepLinks, tasks: keepTasks }
    saveState()
    syncSettingsForm()
    applyVisuals()
    setTimerMode('focus')
    renderAll()
    toast('Settings reset')
  })

  $$('.theme-option').forEach((button) => button.addEventListener('click', () => {
    state.theme = button.dataset.theme
    saveState()
    applyVisuals()
  }))

  $('#wallpaper-grid').addEventListener('click', (event) => {
    const button = event.target.closest('.wallpaper-tile')
    if (!button) return
    state.wallpaper = button.dataset.wallpaper
    state.useCustomWallpaper = false
    state.customWallpaper = ''
    $('#custom-wallpaper-url').value = ''
    saveState()
    applyVisuals()
  })

  $('#random-wallpaper').addEventListener('click', () => {
    const [file] = wallpapers[Math.floor(Math.random() * wallpapers.length)]
    state.wallpaper = file
    state.useCustomWallpaper = false
    state.customWallpaper = ''
    $('#custom-wallpaper-url').value = ''
    saveState()
    applyVisuals()
  })
}

function openLinkDialog(id = '') {
  const link = state.links.find((item) => item.id === id)
  $('#editing-link-id').value = link?.id || ''
  $('#link-dialog-title').textContent = link ? 'Edit link' : 'Add link'
  $('#link-name').value = link?.name || ''
  $('#link-url').value = link?.url || ''
  $('#delete-link').hidden = !link
  $('#link-dialog').showModal()
  $('#link-name').focus()
}

function renderAll() {
  renderLinks()
  renderTasks()
  renderClock()
  renderCountdown()
  renderTimer()
}

function setupSnow() {
  const canvas = $('#snow-canvas')
  const ctx = canvas.getContext('2d')
  let flakes = []

  function resize() {
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    flakes = Array.from({ length: Math.min(160, Math.floor(window.innerWidth / 9)) }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.8 + 0.7,
      s: Math.random() * 0.45 + 0.18,
      drift: Math.random() * 0.35 - 0.18
    }))
  }

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    if (state.snow) {
      ctx.fillStyle = 'rgba(255,255,255,0.72)'
      for (const flake of flakes) {
        ctx.beginPath()
        ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2)
        ctx.fill()
        flake.y += flake.s
        flake.x += flake.drift
        if (flake.y > window.innerHeight + 8) {
          flake.y = -8
          flake.x = Math.random() * window.innerWidth
        }
      }
    }
    requestAnimationFrame(draw)
  }

  window.addEventListener('resize', resize)
  resize()
  draw()
}

renderWallpaperPicker()
applyVisuals()
syncSettingsForm()
bindEvents()
renderAll()
setupSnow()
setInterval(renderClock, 1000)
setInterval(renderCountdown, 60000)
