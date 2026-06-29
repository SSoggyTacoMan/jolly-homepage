const STORAGE_KEY = 'snowtab-state-v4'
const OLD_STORAGE_KEYS = ['snowtab-state-v3', 'snowtab-state-v2', 'snowtab-state-v1']
const SESSION_KEY = 'snowtab-sessions-v2'

const defaultLinks = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Hack Club', url: 'https://hackclub.com' },
  { name: 'Google', url: 'https://google.com' },
  { name: 'YouTube', url: 'https://youtube.com' },
  { name: 'Drive', url: 'https://drive.google.com' }
]

const presets = {
  classic: { focus: 25 * 60, short: 5 * 60, long: 15 * 60 },
  deep: { focus: 50 * 60, short: 10 * 60, long: 25 * 60 },
  quick: { focus: 15 * 60, short: 5 * 60, long: 10 * 60 }
}

const themes = ['holly', 'candy', 'cocoa', 'frost']

const state = loadState()
let selectedTodoId = state.selectedTodoId || null
let timer = {
  mode: 'focus',
  running: false,
  interval: null,
  remaining: state.durations.focus,
  total: state.durations.focus,
  startedAt: null
}

const els = {
  clock: document.querySelector('#clock'),
  dateLine: document.querySelector('#date-line'),
  countdownDays: document.querySelector('#countdown-days'),
  countdownLabel: document.querySelector('#countdown-label'),
  countdownFill: document.querySelector('#countdown-fill'),
  ornamentRow: document.querySelector('#ornament-row'),
  searchForm: document.querySelector('#search-form'),
  searchInput: document.querySelector('#search-input'),
  timerModeTitle: document.querySelector('#timer-mode-title'),
  timerDisplay: document.querySelector('#timer-display'),
  timerSubtitle: document.querySelector('#timer-subtitle'),
  timerEnd: document.querySelector('#timer-end'),
  timerProgress: document.querySelector('#timer-progress'),
  startPause: document.querySelector('#start-pause'),
  resetTimer: document.querySelector('#reset-timer'),
  skipMode: document.querySelector('#skip-mode'),
  markCurrentDone: document.querySelector('#mark-current-done'),
  addFive: document.querySelector('#add-five'),
  subOne: document.querySelector('#sub-one'),
  modeTabs: document.querySelectorAll('.mode-tab'),
  presetButtons: document.querySelectorAll('[data-preset]'),
  focusGoal: document.querySelector('#focus-goal'),
  questText: document.querySelector('#quest-text'),
  roundDots: document.querySelector('#round-dots'),
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
  settingsDialog: document.querySelector('#settings-dialog'),
  settingsOpen: document.querySelector('#settings-open'),
  settingsClose: document.querySelector('#settings-close'),
  settingsSave: document.querySelector('#settings-save'),
  resetSettings: document.querySelector('#reset-settings'),
  focusMinutes: document.querySelector('#focus-minutes'),
  focusSeconds: document.querySelector('#focus-seconds'),
  shortMinutes: document.querySelector('#short-minutes'),
  shortSeconds: document.querySelector('#short-seconds'),
  longMinutes: document.querySelector('#long-minutes'),
  longSeconds: document.querySelector('#long-seconds'),
  longBreakEvery: document.querySelector('#long-break-every'),
  autoStartToggle: document.querySelector('#auto-start-toggle'),
  autoSwitchToggle: document.querySelector('#auto-switch-toggle'),
  completeTaskToggle: document.querySelector('#complete-task-toggle'),
  soundToggle: document.querySelector('#sound-toggle'),
  notifyToggle: document.querySelector('#notify-toggle'),
  clockSecondsToggle: document.querySelector('#clock-seconds-toggle'),
  snowToggle: document.querySelector('#snow-toggle'),
  lightsToggle: document.querySelector('#lights-toggle'),
  lightString: document.querySelector('#light-string'),
  toast: document.querySelector('#toast')
}

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function defaultState() {
  return {
    theme: 'holly',
    links: [...defaultLinks],
    todos: [],
    focusGoal: '',
    selectedTodoId: null,
    durations: { focus: 25 * 60, short: 5 * 60, long: 15 * 60 },
    longBreakEvery: 4,
    autoStart: false,
    autoSwitch: true,
    completeTaskOnFocusEnd: false,
    sound: true,
    notify: false,
    showClockSeconds: false,
    showSnow: true,
    showLights: true
  }
}

function loadState() {
  const fallback = defaultState()
  try {
    const savedRaw = localStorage.getItem(STORAGE_KEY) || OLD_STORAGE_KEYS.map(key => localStorage.getItem(key)).find(Boolean)
    if (!savedRaw) return fallback
    const saved = JSON.parse(savedRaw)
    const merged = { ...fallback, ...saved }
    merged.theme = themes.includes(merged.theme) ? merged.theme : fallback.theme
    merged.links = withDefaultLinks(sanitizeLinks(Array.isArray(merged.links) ? merged.links : fallback.links))
    merged.todos = sanitizeTodos(Array.isArray(merged.todos) ? merged.todos : [])
    merged.durations = normalizeDurations(saved.durations || fallback.durations)
    merged.longBreakEvery = clampNumber(merged.longBreakEvery, 2, 12, 4)
    merged.autoStart = Boolean(merged.autoStart)
    merged.autoSwitch = merged.autoSwitch !== false
    merged.completeTaskOnFocusEnd = Boolean(merged.completeTaskOnFocusEnd)
    merged.sound = merged.sound !== false
    merged.notify = Boolean(merged.notify)
    merged.showClockSeconds = Boolean(merged.showClockSeconds)
    merged.showSnow = merged.showSnow !== false
    merged.showLights = merged.showLights !== false
    merged.focusGoal = String(merged.focusGoal || '').slice(0, 90)
    merged.selectedTodoId = merged.selectedTodoId || null
    return merged
  } catch {
    return fallback
  }
}

function normalizeDurations(value) {
  const fallback = defaultState().durations
  const result = { ...fallback }
  ;['focus', 'short', 'long'].forEach(mode => {
    const raw = Number(value?.[mode])
    if (Number.isFinite(raw) && raw > 0) {
      result[mode] = raw <= 180 ? Math.round(raw * 60) : Math.round(raw)
    }
  })
  return result
}

function sanitizeLinks(links) {
  const cleaned = links
    .filter(link => link?.name && link?.url)
    .filter(link => link.name.toLowerCase() !== 'zermelo' && !link.url.toLowerCase().includes('zermelo'))
    .map(link => ({ name: String(link.name).slice(0, 24), url: String(link.url) }))

  return cleaned
}

function withDefaultLinks(links) {
  const next = [...links]
  const names = new Set(next.map(link => link.name.toLowerCase()))
  defaultLinks.forEach(link => {
    if (next.length < 5 && !names.has(link.name.toLowerCase())) {
      next.push({ ...link })
      names.add(link.name.toLowerCase())
    }
  })
  return next.length ? next : [...defaultLinks]
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
  state.links = sanitizeLinks(state.links)
  state.todos = sanitizeTodos(state.todos)
  state.selectedTodoId = selectedTodoId
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function secondsFromInputs(minInput, secInput, fallback) {
  const minutes = clampNumber(minInput.value, 0, 180, Math.floor(fallback / 60))
  const seconds = clampNumber(secInput.value, 0, 59, fallback % 60)
  const total = Math.round(minutes * 60 + seconds)
  return Math.max(1, total)
}

function setDurationInputs() {
  setMinuteSecondInputs(els.focusMinutes, els.focusSeconds, state.durations.focus)
  setMinuteSecondInputs(els.shortMinutes, els.shortSeconds, state.durations.short)
  setMinuteSecondInputs(els.longMinutes, els.longSeconds, state.durations.long)
  els.longBreakEvery.value = state.longBreakEvery
  els.autoStartToggle.checked = state.autoStart
  els.autoSwitchToggle.checked = state.autoSwitch
  els.completeTaskToggle.checked = state.completeTaskOnFocusEnd
  els.soundToggle.checked = state.sound
  els.notifyToggle.checked = state.notify
  els.clockSecondsToggle.checked = state.showClockSeconds
  els.snowToggle.checked = state.showSnow
  els.lightsToggle.checked = state.showLights
}

function setMinuteSecondInputs(minInput, secInput, total) {
  minInput.value = Math.floor(total / 60)
  secInput.value = total % 60
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
  els.clock.textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: state.showClockSeconds ? '2-digit' : undefined
  })
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

  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const christmasDay = new Date(christmas)
  christmasDay.setHours(0, 0, 0, 0)
  const days = Math.max(0, Math.ceil((christmasDay - today) / 86400000))

  els.countdownDays.textContent = days
  els.countdownLabel.textContent = days === 1 ? 'day to Christmas' : 'days to Christmas'

  const startOfYear = new Date(christmas.getFullYear(), 0, 1)
  const progress = 1 - Math.max(0, christmasDay - now) / Math.max(1, christmasDay - startOfYear)
  els.countdownFill.style.width = `${Math.min(100, Math.max(4, progress * 100))}%`
  renderOrnaments(progress)
}

function renderOrnaments(progress) {
  els.ornamentRow.innerHTML = ''
  const filled = Math.max(1, Math.round(progress * 10))
  for (let i = 0; i < 10; i++) {
    const dot = document.createElement('span')
    dot.className = i < filled ? 'ornament-dot lit' : 'ornament-dot'
    els.ornamentRow.append(dot)
  }
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
  if (!themes.includes(theme)) theme = 'holly'
  state.theme = theme
  document.documentElement.dataset.theme = theme
  document.querySelectorAll('[data-theme-button]').forEach(button => {
    button.classList.toggle('active', button.dataset.themeButton === theme)
  })
  saveState()
}

function applyPageToggles() {
  document.body.classList.toggle('snow-off', !state.showSnow)
  document.body.classList.toggle('lights-off', !state.showLights)
  els.lightString.hidden = !state.showLights
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
  timer.total = state.durations[mode]
  timer.remaining = timer.total
  timer.running = false
  timer.startedAt = null

  els.modeTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode))
  els.timerModeTitle.textContent = modeTitle(mode)
  updateQuestText()
  renderTimer()

  if (keepRunning) startTimer()
}

function updateQuestText() {
  const goal = state.focusGoal.trim()
  if (timer.mode === 'focus') {
    els.questText.textContent = goal || 'No sprint selected.'
    els.timerSubtitle.textContent = goal ? 'Ready to start' : 'Pick one task'
  } else if (timer.mode === 'short') {
    els.questText.textContent = 'Short break. Stand up or rest your eyes.'
    els.timerSubtitle.textContent = 'Break'
  } else {
    els.questText.textContent = 'Long break. Reset before the next sprint.'
    els.timerSubtitle.textContent = 'Long break'
  }
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60).toString().padStart(2, '0')
  const seconds = (safe % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function renderTimer() {
  els.timerDisplay.textContent = formatTime(timer.remaining)
  els.startPause.textContent = timer.running
    ? 'Pause'
    : timer.mode === 'focus'
      ? 'Start focus'
      : 'Start break'

  const progress = timer.total === 0 ? 0 : 1 - timer.remaining / timer.total
  const circumference = 2 * Math.PI * 98
  els.timerProgress.style.strokeDasharray = `${circumference}`
  els.timerProgress.style.strokeDashoffset = `${circumference * (1 - progress)}`

  document.body.classList.toggle('focus-running', timer.running && timer.mode === 'focus')
  updateTimerEnd()
  document.title = timer.running ? `${formatTime(timer.remaining)} · SnowTab` : 'SnowTab'
}

function updateTimerEnd() {
  if (!timer.running) {
    els.timerEnd.textContent = 'End time appears after start'
    return
  }
  const end = new Date(Date.now() + timer.remaining * 1000)
  els.timerEnd.textContent = `Ends at ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

function startTimer() {
  clearInterval(timer.interval)
  timer.running = true
  timer.startedAt = Date.now()
  timer.interval = setInterval(tick, 1000)
  renderTimer()
}

function pauseTimer() {
  clearInterval(timer.interval)
  timer.running = false
  timer.startedAt = null
  renderTimer()
}

function toggleTimer() {
  if (timer.running) pauseTimer()
  else startTimer()
}

function tick() {
  timer.remaining -= 1
  if (timer.remaining <= 0) {
    timer.remaining = 0
    renderTimer()
    finishTimer()
    return
  }
  renderTimer()
}

function finishTimer() {
  clearInterval(timer.interval)
  timer.running = false
  timer.startedAt = null
  playChime()
  sendNotification()

  if (timer.mode === 'focus') {
    addSession()
    updateSessionPill()
    if (state.completeTaskOnFocusEnd) markSelectedTodoDone(false)
    showToast('Focus session finished')
  } else {
    showToast('Break finished')
  }

  const nextMode = nextTimerMode()
  if (state.autoSwitch) setMode(nextMode, state.autoStart)
  else renderTimer()
}

function nextTimerMode() {
  if (timer.mode !== 'focus') return 'focus'
  const sessions = getSessions()
  return sessions > 0 && sessions % state.longBreakEvery === 0 ? 'long' : 'short'
}

function resetTimer() {
  clearInterval(timer.interval)
  timer.running = false
  timer.remaining = state.durations[timer.mode]
  timer.total = state.durations[timer.mode]
  timer.startedAt = null
  renderTimer()
}

function skipMode() {
  const next = timer.mode === 'focus' ? nextTimerMode() : 'focus'
  setMode(next, false)
}

function adjustTimer(seconds) {
  const next = Math.max(1, timer.remaining + seconds)
  timer.remaining = next
  if (!timer.running) timer.total = Math.max(timer.total, next)
  renderTimer()
}

function applyPreset(name) {
  const preset = presets[name]
  if (!preset) return
  state.durations = { ...preset }
  setDurationInputs()
  saveState()
  resetTimerToModeDuration()
  showToast('Preset applied')
}

function resetTimerToModeDuration() {
  timer.total = state.durations[timer.mode]
  timer.remaining = timer.total
  renderTimer()
}

function updateSettingsFromInputs() {
  state.durations.focus = secondsFromInputs(els.focusMinutes, els.focusSeconds, state.durations.focus)
  state.durations.short = secondsFromInputs(els.shortMinutes, els.shortSeconds, state.durations.short)
  state.durations.long = secondsFromInputs(els.longMinutes, els.longSeconds, state.durations.long)
  state.longBreakEvery = clampNumber(els.longBreakEvery.value, 2, 12, 4)
  state.autoStart = els.autoStartToggle.checked
  state.autoSwitch = els.autoSwitchToggle.checked
  state.completeTaskOnFocusEnd = els.completeTaskToggle.checked
  state.sound = els.soundToggle.checked
  state.showClockSeconds = els.clockSecondsToggle.checked
  state.showSnow = els.snowToggle.checked
  state.showLights = els.lightsToggle.checked
  state.notify = els.notifyToggle.checked

  if (state.notify && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      state.notify = permission === 'granted'
      els.notifyToggle.checked = state.notify
      saveState()
    })
  }

  saveState()
  applyPageToggles()
  updateClock()
  resetTimerToModeDuration()
  renderRoundDots()
}

function updateFocusGoal() {
  state.focusGoal = els.focusGoal.value.trim()
  selectedTodoId = null
  saveState()
  renderTodos()
  updateQuestText()
}

function playChime() {
  if (!state.sound) return
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return

  const ctx = new AudioContext()
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1)
  gain.connect(ctx.destination)

  ;[659.25, 783.99, 987.77, 1318.51].forEach((freq, index) => {
    const osc = ctx.createOscillator()
    osc.type = index % 2 === 0 ? 'triangle' : 'sine'
    osc.frequency.value = freq
    osc.connect(gain)
    osc.start(ctx.currentTime + index * 0.13)
    osc.stop(ctx.currentTime + index * 0.13 + 0.42)
  })
}

function sendNotification() {
  if (!state.notify || !('Notification' in window) || Notification.permission !== 'granted') return
  const title = timer.mode === 'focus' ? 'Focus finished' : 'Break finished'
  const body = timer.mode === 'focus' ? 'Time for a break.' : 'Back to focus.'
  new Notification(title, { body })
}

function renderRoundDots() {
  els.roundDots.innerHTML = ''
  const done = getSessions() % state.longBreakEvery

  for (let i = 0; i < state.longBreakEvery; i++) {
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
    empty.textContent = 'No tasks yet.'
    els.todoList.append(empty)
    els.markCurrentDone.disabled = true
    return
  }

  state.todos.forEach(todo => {
    const item = document.createElement('article')
    item.className = `todo-item${todo.done ? ' done' : ''}${todo.id === selectedTodoId ? ' selected' : ''}`

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
    use.textContent = todo.id === selectedTodoId ? 'Selected' : 'Sprint'
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

  els.markCurrentDone.disabled = !selectedTodoId
}

function toggleTodo(id) {
  const todo = state.todos.find(item => item.id === id)
  if (!todo) return

  todo.done = !todo.done
  if (todo.done && selectedTodoId === id) {
    selectedTodoId = null
    state.focusGoal = ''
    els.focusGoal.value = ''
  }
  saveState()
  renderTodos()
}

function useTodoAsGoal(id) {
  const todo = state.todos.find(item => item.id === id)
  if (!todo || todo.done) return

  selectedTodoId = todo.id
  state.focusGoal = todo.text
  els.focusGoal.value = todo.text
  saveState()
  setMode('focus')
  renderTodos()
  updateQuestText()
  showToast('Sprint selected')
}

function markSelectedTodoDone(showMessage = true) {
  if (!selectedTodoId) return
  const todo = state.todos.find(item => item.id === selectedTodoId)
  if (!todo) return
  todo.done = true
  selectedTodoId = null
  state.focusGoal = ''
  els.focusGoal.value = ''
  saveState()
  renderTodos()
  updateQuestText()
  if (showMessage) showToast('Task marked done')
}

function removeTodo(id) {
  state.todos = state.todos.filter(item => item.id !== id)
  if (selectedTodoId === id) selectedTodoId = null
  saveState()
  renderTodos()
  updateQuestText()
}

function clearDoneTodos() {
  state.todos = state.todos.filter(todo => !todo.done)
  saveState()
  renderTodos()
  showToast('Done tasks cleared')
}

function resetTodoList() {
  state.todos = []
  selectedTodoId = null
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

  if (state.links.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'empty-state'
    empty.textContent = 'No links yet.'
    els.quickLinks.append(empty)
    return
  }

  state.links.forEach((link, index) => {
    const card = document.createElement('article')
    card.className = 'link-card'

    const icon = document.createElement('span')
    icon.className = 'link-icon'
    icon.textContent = link.name.slice(0, 1).toUpperCase()

    const meta = document.createElement('div')
    const anchor = document.createElement('a')
    anchor.href = link.url
    anchor.textContent = link.name
    anchor.target = '_blank'
    anchor.rel = 'noreferrer'

    const domain = document.createElement('span')
    domain.textContent = getDomain(link.url)
    meta.append(anchor, domain)

    const edit = document.createElement('button')
    edit.type = 'button'
    edit.textContent = 'Edit'
    edit.addEventListener('click', () => openLinkDialog(index))

    card.append(icon, meta, edit)
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

function openSettings() {
  setDurationInputs()
  els.settingsDialog.showModal()
}

function closeSettings() {
  updateSettingsFromInputs()
  els.settingsDialog.close()
  showToast('Settings saved')
}

function resetAllSettings() {
  const keepLinks = state.links
  const keepTodos = state.todos
  const fresh = defaultState()
  Object.assign(state, fresh, { links: keepLinks, todos: keepTodos })
  selectedTodoId = null
  setTheme(state.theme)
  setDurationInputs()
  applyPageToggles()
  saveState()
  resetTimerToModeDuration()
  updateClock()
  renderRoundDots()
  showToast('Settings reset')
}

function showToast(message) {
  els.toast.textContent = message
  els.toast.classList.add('show')
  clearTimeout(showToast.timeout)
  showToast.timeout = setTimeout(() => els.toast.classList.remove('show'), 2600)
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
    const amount = Math.min(130, Math.floor(window.innerWidth / 9))
    for (let i = 0; i < amount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.random() * 2.4 + 0.6) * window.devicePixelRatio,
        speed: (Math.random() * 0.7 + 0.25) * window.devicePixelRatio,
        drift: (Math.random() * 0.8 - 0.4) * window.devicePixelRatio,
        opacity: Math.random() * 0.48 + 0.2
      })
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height)
    if (state.showSnow) {
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
    }
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
  els.markCurrentDone.addEventListener('click', () => markSelectedTodoDone(true))
  els.addFive.addEventListener('click', () => adjustTimer(300))
  els.subOne.addEventListener('click', () => adjustTimer(-60))
  els.focusGoal.addEventListener('input', updateFocusGoal)
  els.todoForm.addEventListener('submit', addTodo)
  els.clearDone.addEventListener('click', clearDoneTodos)
  els.resetTodos.addEventListener('click', resetTodoList)
  els.addLink.addEventListener('click', () => openLinkDialog())
  els.linkForm.addEventListener('submit', saveLink)
  els.closeDialog.addEventListener('click', () => els.linkDialog.close())
  els.deleteLink.addEventListener('click', deleteLink)
  els.settingsOpen.addEventListener('click', openSettings)
  els.settingsClose.addEventListener('click', () => els.settingsDialog.close())
  els.settingsSave.addEventListener('click', closeSettings)
  els.resetSettings.addEventListener('click', resetAllSettings)

  els.modeTabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.mode)))
  els.presetButtons.forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)))

  document.querySelectorAll('[data-theme-button]').forEach(button => {
    button.addEventListener('click', () => setTheme(button.dataset.themeButton))
  })

  ;[
    els.focusMinutes,
    els.focusSeconds,
    els.shortMinutes,
    els.shortSeconds,
    els.longMinutes,
    els.longSeconds,
    els.longBreakEvery,
    els.autoStartToggle,
    els.autoSwitchToggle,
    els.completeTaskToggle,
    els.soundToggle,
    els.notifyToggle,
    els.clockSecondsToggle,
    els.snowToggle,
    els.lightsToggle
  ].forEach(input => input.addEventListener('change', updateSettingsFromInputs))
}

function init() {
  setTheme(state.theme)
  applyPageToggles()
  setDurationInputs()
  els.focusGoal.value = state.focusGoal
  timer.remaining = state.durations.focus
  timer.total = timer.remaining

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
