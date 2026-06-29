const STORAGE_KEY = 'snowtab-state-v2'
const OLD_STORAGE_KEY = 'snowtab-state-v1'
const SESSION_KEY = 'snowtab-sessions-v1'

const defaultLinks = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Hack Club', url: 'https://hackclub.com' },
  { name: 'YouTube', url: 'https://youtube.com' },
  { name: 'MDN Docs', url: 'https://developer.mozilla.org' }
]

const defaultTodos = [
  { id: makeId(), text: 'Pick one subject to study', done: false },
  { id: makeId(), text: 'Start a focus sprint', done: false },
  { id: makeId(), text: 'Take a real break after', done: false }
]

const breakTips = [
  'Stand up and move for one minute.',
  'Drink water before starting again.',
  'Clean your desk for two minutes.',
  'Look away from the screen and rest your eyes.',
  'Write down the next tiny step.'
]

const state = loadState()
let timer = {
  mode: 'focus',
  running: false,
  interval: null,
  remaining: state.durations.focus * 60,
  total: state.durations.focus * 60
}

const els = {
  clock: document.querySelector('#clock'),
  dateLine: document.querySelector('#date-line'),
  countdownDays: document.querySelector('#countdown-days'),
  countdownLabel: document.querySelector('#countdown-label'),
  searchForm: document.querySelector('#search-form'),
  searchInput: document.querySelector('#search-input'),
  timerModeTitle: document.querySelector('#timer-mode-title'),
  timerDisplay: document.querySelector('#timer-display'),
  timerSubtitle: document.querySelector('#timer-subtitle'),
  timerProgress: document.querySelector('#timer-progress'),
  startPause: document.querySelector('#start-pause'),
  resetTimer: document.querySelector('#reset-timer'),
  skipMode: document.querySelector('#skip-mode'),
  modeTabs: document.querySelectorAll('.mode-tab'),
  focusGoal: document.querySelector('#focus-goal'),
  questText: document.querySelector('#quest-text'),
  roundDots: document.querySelector('#round-dots'),
  focusMinutes: document.querySelector('#focus-minutes'),
  shortMinutes: document.querySelector('#short-minutes'),
  longMinutes: document.querySelector('#long-minutes'),
  soundToggle: document.querySelector('#sound-toggle'),
  autoSwitchToggle: document.querySelector('#auto-switch-toggle'),
  sessionPill: document.querySelector('#session-pill'),
  todoForm: document.querySelector('#todo-form'),
  todoInput: document.querySelector('#todo-input'),
  todoList: document.querySelector('#todo-list'),
  todoCount: document.querySelector('#todo-count'),
  clearDone: document.querySelector('#clear-done'),
  resetTodos: document.querySelector('#reset-todos'),
  quickLinks: document.querySelector('#quick-links'),
  addLink: document.querySelector('#add-link'),
  linkDialog: document.querySelector('#link-dialog'),
  linkForm: document.querySelector('#link-form'),
  closeDialog: document.querySelector('#close-dialog'),
  dialogTitle: document.querySelector('#dialog-title'),
  editingIndex: document.querySelector('#editing-index'),
  linkName: document.querySelector('#link-name'),
  linkUrl: document.querySelector('#link-url'),
  deleteLink: document.querySelector('#delete-link'),
  toast: document.querySelector('#toast')
}

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function loadState() {
  const fallback = {
    theme: 'frost',
    links: defaultLinks,
    todos: defaultTodos,
    durations: { focus: 25, short: 5, long: 15 },
    sound: true,
    autoSwitch: true,
    focusGoal: ''
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY))
    const merged = {
      ...fallback,
      ...saved,
      durations: { ...fallback.durations, ...saved?.durations }
    }

    merged.links = sanitizeLinks(Array.isArray(merged.links) ? merged.links : defaultLinks)
    merged.todos = sanitizeTodos(Array.isArray(merged.todos) ? merged.todos : defaultTodos)
    return merged
  } catch {
    return fallback
  }
}

function sanitizeLinks(links) {
  const cleaned = links
    .filter(link => link?.name && link?.url)
    .filter(link => link.name.toLowerCase() !== 'zermelo' && !link.url.toLowerCase().includes('zermelo'))

  return cleaned.length ? cleaned : defaultLinks
}

function sanitizeTodos(todos) {
  return todos
    .filter(todo => todo?.text)
    .map(todo => ({
      id: todo.id || makeId(),
      text: String(todo.text).slice(0, 90),
      done: Boolean(todo.done)
    }))
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getSessionStore() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}')
  } catch {
    return {}
  }
}

function getSessions() {
  return getSessionStore()[todayKey()] || 0
}

function addSession() {
  const saved = getSessionStore()
  const key = todayKey()
  saved[key] = (saved[key] || 0) + 1
  localStorage.setItem(SESSION_KEY, JSON.stringify(saved))
}

function updateSessionPill() {
  const count = getSessions()
  els.sessionPill.textContent = `${count} focus session${count === 1 ? '' : 's'}`
  renderRoundDots()
}

function updateClock() {
  const now = new Date()
  els.clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  els.dateLine.textContent = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}

function updateCountdown() {
  const now = new Date()
  let christmas = new Date(now.getFullYear(), 11, 25)
  if (now > christmas) christmas = new Date(now.getFullYear() + 1, 11, 25)

  const diff = christmas.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  const days = Math.max(0, Math.ceil(diff / 86400000))
  els.countdownDays.textContent = days
  els.countdownLabel.textContent = days === 1 ? 'day left' : 'days left'
}

function handleSearch(event) {
  event.preventDefault()
  const value = els.searchInput.value.trim()
  if (!value) return

  const looksLikeUrl = value.includes('.') && !value.includes(' ')
  const target = looksLikeUrl
    ? (value.startsWith('http') ? value : `https://${value}`)
    : `https://www.google.com/search?q=${encodeURIComponent(value)}`

  window.location.href = target
}

function setTheme(theme) {
  state.theme = theme
  document.documentElement.dataset.theme = theme
  document.querySelectorAll('[data-theme-button]').forEach(button => {
    button.classList.toggle('active', button.dataset.themeButton === theme)
  })
  saveState()
}

function modeTitle(mode) {
  return {
    focus: 'Focus sprint',
    short: 'Short break',
    long: 'Long break'
  }[mode]
}

function setMode(mode, keepRunning = false) {
  clearInterval(timer.interval)
  timer.mode = mode
  timer.total = state.durations[mode] * 60
  timer.remaining = timer.total
  timer.running = false

  els.modeTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode))
  els.timerModeTitle.textContent = modeTitle(mode)
  updateQuestText()
  renderTimer()

  if (keepRunning) startTimer()
}

function updateQuestText() {
  const goal = state.focusGoal.trim()
  if (timer.mode === 'focus') {
    els.questText.textContent = goal ? `Current goal: ${goal}` : 'Pick one task, start the timer, then do only that.'
    els.timerSubtitle.textContent = goal ? 'One clean sprint' : 'Ready when you are'
  } else {
    const tip = breakTips[getSessions() % breakTips.length]
    els.questText.textContent = `Break idea: ${tip}`
    els.timerSubtitle.textContent = timer.mode === 'long' ? 'Proper recharge' : 'Quick reset'
  }
}

function renderTimer() {
  const minutes = Math.floor(timer.remaining / 60).toString().padStart(2, '0')
  const seconds = Math.floor(timer.remaining % 60).toString().padStart(2, '0')
  els.timerDisplay.textContent = `${minutes}:${seconds}`
  els.startPause.textContent = timer.running
    ? 'Pause'
    : timer.mode === 'focus'
      ? 'Start focus'
      : 'Start break'

  const progress = timer.total === 0 ? 0 : 1 - timer.remaining / timer.total
  const circumference = 2 * Math.PI * 96
  els.timerProgress.style.strokeDasharray = `${circumference}`
  els.timerProgress.style.strokeDashoffset = `${circumference * (1 - progress)}`

  document.body.classList.toggle('focus-running', timer.running && timer.mode === 'focus')
  document.title = timer.running ? `${minutes}:${seconds} · SnowTab` : 'SnowTab'
}

function startTimer() {
  clearInterval(timer.interval)
  timer.running = true
  els.timerSubtitle.textContent = timer.mode === 'focus' ? 'Do not switch tabs' : 'Recharge for the next sprint'
  timer.interval = setInterval(() => {
    timer.remaining -= 1
    if (timer.remaining <= 0) completeTimer()
    renderTimer()
  }, 1000)
  renderTimer()
}

function pauseTimer() {
  timer.running = false
  clearInterval(timer.interval)
  els.timerSubtitle.textContent = 'Paused'
  renderTimer()
}

function completeTimer() {
  clearInterval(timer.interval)
  timer.running = false
  timer.remaining = 0
  renderTimer()

  if (timer.mode === 'focus') {
    addSession()
    updateSessionPill()
    showToast('Focus sprint complete. Take the break, not another tab.')
    playChime()
    markMatchingGoalDone()
    if (state.autoSwitch) setTimeout(() => setMode(getSessions() % 4 === 0 ? 'long' : 'short'), 450)
  } else {
    showToast('Break done. Pick the next tiny step.')
    playChime()
    if (state.autoSwitch) setTimeout(() => setMode('focus'), 450)
  }
}

function markMatchingGoalDone() {
  const goal = state.focusGoal.trim().toLowerCase()
  if (!goal) return

  const todo = state.todos.find(item => !item.done && item.text.trim().toLowerCase() === goal)
  if (!todo) return

  todo.done = true
  state.focusGoal = ''
  els.focusGoal.value = ''
  saveState()
  renderTodos()
  showToast('Task marked done. Nice sprint.')
}

function toggleTimer() {
  timer.running ? pauseTimer() : startTimer()
}

function resetTimer() {
  clearInterval(timer.interval)
  timer.running = false
  timer.remaining = state.durations[timer.mode] * 60
  timer.total = timer.remaining
  els.timerSubtitle.textContent = 'Reset'
  renderTimer()
}

function skipMode() {
  const next = timer.mode === 'focus' ? 'short' : 'focus'
  setMode(next)
}

function updateDurations() {
  state.durations.focus = clampNumber(els.focusMinutes.value, 1, 180, 25)
  state.durations.short = clampNumber(els.shortMinutes.value, 1, 60, 5)
  state.durations.long = clampNumber(els.longMinutes.value, 1, 90, 15)
  state.sound = els.soundToggle.checked
  state.autoSwitch = els.autoSwitchToggle.checked
  saveState()

  if (!timer.running) {
    timer.total = state.durations[timer.mode] * 60
    timer.remaining = timer.total
    renderTimer()
  }
}

function updateFocusGoal() {
  state.focusGoal = els.focusGoal.value.trim()
  saveState()
  updateQuestText()
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (Number.isNaN(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function playChime() {
  if (!state.sound) return
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return

  const ctx = new AudioContext()
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9)
  gain.connect(ctx.destination)

  ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
    const osc = ctx.createOscillator()
    osc.type = index % 2 === 0 ? 'triangle' : 'sine'
    osc.frequency.value = freq
    osc.connect(gain)
    osc.start(ctx.currentTime + index * 0.11)
    osc.stop(ctx.currentTime + index * 0.11 + 0.38)
  })
}

function renderRoundDots() {
  els.roundDots.innerHTML = ''
  const done = getSessions() % 4

  for (let i = 0; i < 4; i++) {
    const dot = document.createElement('span')
    dot.className = i < done ? 'round-dot filled' : 'round-dot'
    dot.title = i < done ? 'Completed sprint' : 'Sprint until long break'
    els.roundDots.append(dot)
  }
}

function addTodo(event) {
  event.preventDefault()
  const text = els.todoInput.value.trim()
  if (!text) return

  state.todos.unshift({ id: makeId(), text, done: false })
  els.todoInput.value = ''
  saveState()
  renderTodos()
  showToast('Task added')
}

function renderTodos() {
  els.todoList.innerHTML = ''
  const openTodos = state.todos.filter(todo => !todo.done).length
  els.todoCount.textContent = `${openTodos} left`

  if (state.todos.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'empty-state'
    empty.textContent = 'No tasks. Add one tiny thing and start a sprint.'
    els.todoList.append(empty)
    return
  }

  state.todos.forEach(todo => {
    const item = document.createElement('article')
    item.className = `todo-item${todo.done ? ' done' : ''}`

    const check = document.createElement('button')
    check.type = 'button'
    check.className = 'todo-check'
    check.setAttribute('aria-label', todo.done ? 'Mark task open' : 'Mark task done')
    check.addEventListener('click', () => toggleTodo(todo.id))

    const text = document.createElement('span')
    text.textContent = todo.text

    const use = document.createElement('button')
    use.type = 'button'
    use.className = 'task-action'
    use.textContent = 'Sprint'
    use.disabled = todo.done
    use.addEventListener('click', () => useTodoAsGoal(todo.id))

    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'task-action remove-task'
    remove.textContent = 'Remove'
    remove.addEventListener('click', () => removeTodo(todo.id))

    item.append(check, text, use, remove)
    els.todoList.append(item)
  })
}

function toggleTodo(id) {
  const todo = state.todos.find(item => item.id === id)
  if (!todo) return

  todo.done = !todo.done
  saveState()
  renderTodos()
}

function useTodoAsGoal(id) {
  const todo = state.todos.find(item => item.id === id)
  if (!todo || todo.done) return

  state.focusGoal = todo.text
  els.focusGoal.value = todo.text
  saveState()
  setMode('focus')
  updateQuestText()
  showToast('Sprint goal set')
}

function removeTodo(id) {
  state.todos = state.todos.filter(item => item.id !== id)
  saveState()
  renderTodos()
}

function clearDoneTodos() {
  state.todos = state.todos.filter(todo => !todo.done)
  saveState()
  renderTodos()
  showToast('Done tasks cleared')
}

function resetTodoList() {
  state.todos = []
  state.focusGoal = ''
  els.focusGoal.value = ''
  saveState()
  renderTodos()
  updateQuestText()
  showToast('List reset')
}

function renderLinks() {
  els.quickLinks.innerHTML = ''

  state.links = sanitizeLinks(state.links)

  state.links.forEach((link, index) => {
    const card = document.createElement('article')
    card.className = 'link-card'

    const anchor = document.createElement('a')
    anchor.href = link.url
    anchor.textContent = link.name
    anchor.target = '_blank'
    anchor.rel = 'noreferrer'

    const domain = document.createElement('span')
    domain.textContent = getDomain(link.url)

    const edit = document.createElement('button')
    edit.type = 'button'
    edit.textContent = 'Edit'
    edit.addEventListener('click', () => openLinkDialog(index))

    card.append(anchor, domain, edit)
    els.quickLinks.append(card)
  })
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function openLinkDialog(index = null) {
  const editing = index !== null
  els.dialogTitle.textContent = editing ? 'Edit link' : 'Add link'
  els.editingIndex.value = editing ? String(index) : ''
  els.deleteLink.style.display = editing ? 'inline-flex' : 'none'

  if (editing) {
    els.linkName.value = state.links[index].name
    els.linkUrl.value = state.links[index].url
  } else {
    els.linkName.value = ''
    els.linkUrl.value = ''
  }

  els.linkDialog.showModal()
  setTimeout(() => els.linkName.focus(), 50)
}

function saveLink(event) {
  event.preventDefault()
  const name = els.linkName.value.trim()
  let url = els.linkUrl.value.trim()
  if (!name || !url) return
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`

  const index = els.editingIndex.value
  const link = { name, url }

  if (index === '') state.links.push(link)
  else state.links[Number(index)] = link

  state.links = sanitizeLinks(state.links)
  saveState()
  renderLinks()
  els.linkDialog.close()
  showToast('Link saved')
}

function deleteLink() {
  const index = Number(els.editingIndex.value)
  if (Number.isNaN(index)) return
  state.links.splice(index, 1)
  state.links = sanitizeLinks(state.links)
  saveState()
  renderLinks()
  els.linkDialog.close()
  showToast('Link removed')
}

function showToast(message) {
  els.toast.textContent = message
  els.toast.classList.add('show')
  clearTimeout(showToast.timeout)
  showToast.timeout = setTimeout(() => els.toast.classList.remove('show'), 2800)
}

function initSnow() {
  const canvas = document.querySelector('#snow-canvas')
  const ctx = canvas.getContext('2d')
  const flakes = []
  let width = 0
  let height = 0

  function resize() {
    width = canvas.width = window.innerWidth * window.devicePixelRatio
    height = canvas.height = window.innerHeight * window.devicePixelRatio
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`

    flakes.length = 0
    const amount = Math.min(150, Math.floor(window.innerWidth / 8))
    for (let i = 0; i < amount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.random() * 2.6 + 0.7) * window.devicePixelRatio,
        speed: (Math.random() * 0.7 + 0.25) * window.devicePixelRatio,
        drift: (Math.random() * 0.6 - 0.3) * window.devicePixelRatio,
        opacity: Math.random() * 0.55 + 0.22
      })
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height)
    flakes.forEach(flake => {
      flake.y += flake.speed
      flake.x += flake.drift

      if (flake.y > height) {
        flake.y = -10
        flake.x = Math.random() * width
      }
      if (flake.x > width) flake.x = 0
      if (flake.x < 0) flake.x = width

      ctx.beginPath()
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`
      ctx.fill()
    })
    requestAnimationFrame(draw)
  }

  resize()
  draw()
  window.addEventListener('resize', resize)
}

function bindEvents() {
  els.searchForm.addEventListener('submit', handleSearch)
  els.startPause.addEventListener('click', toggleTimer)
  els.resetTimer.addEventListener('click', resetTimer)
  els.skipMode.addEventListener('click', skipMode)
  els.focusGoal.addEventListener('input', updateFocusGoal)
  els.todoForm.addEventListener('submit', addTodo)
  els.clearDone.addEventListener('click', clearDoneTodos)
  els.resetTodos.addEventListener('click', resetTodoList)
  els.addLink.addEventListener('click', () => openLinkDialog())
  els.linkForm.addEventListener('submit', saveLink)
  els.closeDialog.addEventListener('click', () => els.linkDialog.close())
  els.deleteLink.addEventListener('click', deleteLink)

  els.modeTabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)))

  document.querySelectorAll('[data-theme-button]').forEach(button => {
    button.addEventListener('click', () => setTheme(button.dataset.themeButton))
  })

  ;[els.focusMinutes, els.shortMinutes, els.longMinutes, els.soundToggle, els.autoSwitchToggle].forEach(input => {
    input.addEventListener('change', updateDurations)
  })
}

function init() {
  document.documentElement.dataset.theme = state.theme
  els.focusMinutes.value = state.durations.focus
  els.shortMinutes.value = state.durations.short
  els.longMinutes.value = state.durations.long
  els.soundToggle.checked = state.sound
  els.autoSwitchToggle.checked = state.autoSwitch
  els.focusGoal.value = state.focusGoal
  timer.remaining = state.durations.focus * 60
  timer.total = timer.remaining

  setTheme(state.theme)
  updateClock()
  updateCountdown()
  updateSessionPill()
  renderTodos()
  renderLinks()
  updateQuestText()
  renderTimer()
  bindEvents()
  initSnow()

  setInterval(updateClock, 1000)
  setInterval(updateCountdown, 60000)
}

init()
