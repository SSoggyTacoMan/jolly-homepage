const STORAGE_KEY = 'snowtab-state-v5'
const OLD_STORAGE_KEYS = ['snowtab-state-v4', 'snowtab-state-v3', 'snowtab-state-v2', 'snowtab-state-v1']
const SESSION_KEY = 'snowtab-sessions-v3'

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
const priorityRank = { high: 3, normal: 2, low: 1 }
const priorityLabels = { high: 'High', normal: 'Normal', low: 'Low' }

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
  finishEarly: document.querySelector('#finish-early'),
  addFive: document.querySelector('#add-five'),
  subOne: document.querySelector('#sub-one'),
  modeTabs: document.querySelectorAll('.mode-tab'),
  presetButtons: document.querySelectorAll('[data-preset]'),
  focusGoal: document.querySelector('#focus-goal'),
  currentTaskTitle: document.querySelector('#current-task-title'),
  currentTaskMeta: document.querySelector('#current-task-meta'),
  nextBreakLabel: document.querySelector('#next-break-label'),
  roundDots: document.querySelector('#round-dots'),
  sessionPill: document.querySelector('#session-pill'),
  todoForm: document.querySelector('#todo-form'),
  todoInput: document.querySelector('#todo-input'),
  todoPriority: document.querySelector('#todo-priority'),
  todoEstimate: document.querySelector('#todo-estimate'),
  todoList: document.querySelector('#todo-list'),
  todoCount: document.querySelector('#todo-count'),
  taskProgressText: document.querySelector('#task-progress-text'),
  taskProgressFill: document.querySelector('#task-progress-fill'),
  pickNextTask: document.querySelector('#pick-next-task'),
  clearDone: document.querySelector('#clear-done'),
  resetTodos: document.querySelector('#reset-todos'),
  filterButtons: document.querySelectorAll('[data-filter]'),
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
    tasks: [],
    selectedTaskId: null,
    taskFilter: 'open',
    focusGoal: '',
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

const state = loadState()
let selectedTaskId = state.selectedTaskId || null
let timer = {
  mode: 'focus',
  running: false,
  interval: null,
  remaining: state.durations.focus,
  total: state.durations.focus,
  startedAt: null
}

function loadState() {
  const fallback = defaultState()
  try {
    const savedRaw = localStorage.getItem(STORAGE_KEY) || OLD_STORAGE_KEYS.map(key => localStorage.getItem(key)).find(Boolean)
    if (!savedRaw) return fallback

    const saved = JSON.parse(savedRaw)
    const merged = { ...fallback, ...saved }
    const rawTasks = Array.isArray(saved.tasks) ? saved.tasks : Array.isArray(saved.todos) ? saved.todos : []

    merged.theme = themes.includes(merged.theme) ? merged.theme : fallback.theme
    merged.links = withDefaultLinks(sanitizeLinks(Array.isArray(merged.links) ? merged.links : fallback.links))
    merged.tasks = sanitizeTasks(rawTasks)
    merged.selectedTaskId = merged.selectedTaskId || saved.selectedTodoId || null
    merged.taskFilter = ['open', 'all', 'done'].includes(merged.taskFilter) ? merged.taskFilter : 'open'
    merged.focusGoal = String(merged.focusGoal || '').slice(0, 90)
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

    if (!merged.tasks.some(task => task.id === merged.selectedTaskId && !task.done)) {
      merged.selectedTaskId = null
    }

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
  return links
    .filter(link => link?.name && link?.url)
    .filter(link => link.name.toLowerCase() !== 'zermelo' && !String(link.url).toLowerCase().includes('zermelo'))
    .map(link => ({ name: String(link.name).slice(0, 24), url: String(link.url) }))
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

function sanitizeTasks(tasks) {
  return tasks
    .filter(task => task?.title || task?.text)
    .map(task => {
      const estimate = clampNumber(task.estimate || task.estimateRounds || 1, 1, 12, 1)
      const rounds = clampNumber(task.rounds || task.sessions || task.completedRounds || 0, 0, 99, 0)
      const priority = ['high', 'normal', 'low'].includes(task.priority) ? task.priority : 'normal'
      return {
        id: task.id || makeId(),
        title: String(task.title || task.text).slice(0, 90),
        done: Boolean(task.done),
        priority,
        estimate,
        rounds,
        createdAt: task.createdAt || Date.now(),
        completedAt: task.completedAt || null
      }
    })
}

function saveState() {
  state.links = sanitizeLinks(state.links)
  state.tasks = sanitizeTasks(state.tasks)
  state.selectedTaskId = selectedTaskId
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
  return Math.max(1, Math.round(minutes * 60 + seconds))
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
  updateNextBreakLabel()
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
  els.countdownLabel.textContent = days === 1 ? 'sleep left' : 'sleeps left'

  const startOfYear = new Date(christmas.getFullYear(), 0, 1)
  const progress = 1 - Math.max(0, christmasDay - now) / Math.max(1, christmasDay - startOfYear)
  els.countdownFill.style.width = `${Math.min(100, Math.max(5, progress * 100))}%`
  renderOrnaments(progress)
}

function renderOrnaments(progress) {
  els.ornamentRow.innerHTML = ''
  const filled = Math.max(1, Math.round(progress * 12))
  for (let i = 0; i < 12; i++) {
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
  renderCurrentTask()
  renderTimer()

  if (keepRunning) startTimer()
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60).toString().padStart(2, '0')
  const seconds = (safe % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function renderTimer() {
  els.timerDisplay.textContent = formatTime(timer.remaining)
  els.startPause.textContent = timer.running ? 'Pause' : timer.mode === 'focus' ? 'Start focus' : 'Start break'
  els.finishEarly.textContent = timer.mode === 'focus' ? 'Finish focus' : 'End break'

  const progress = timer.total === 0 ? 0 : 1 - timer.remaining / timer.total
  const circumference = 2 * Math.PI * 98
  els.timerProgress.style.strokeDasharray = `${circumference}`
  els.timerProgress.style.strokeDashoffset = `${circumference * (1 - progress)}`

  els.timerSubtitle.textContent = timer.running ? 'Running' : timer.mode === 'focus' ? 'Ready to focus' : 'Ready for break'
  document.body.classList.toggle('focus-running', timer.running && timer.mode === 'focus')
  updateTimerEnd()
  document.title = timer.running ? `${formatTime(timer.remaining)} · SnowTab` : 'SnowTab'
}

function updateTimerEnd() {
  if (!timer.running) {
    els.timerEnd.textContent = 'Not running'
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
    finishTimer(false)
    return
  }
  renderTimer()
}

function finishTimer(manual) {
  clearInterval(timer.interval)
  timer.running = false
  timer.startedAt = null
  playChime()
  sendNotification()

  if (timer.mode === 'focus') {
    completeFocusRound()
    showToast(manual ? 'Focus logged' : 'Focus finished')
  } else {
    showToast(manual ? 'Break ended' : 'Break finished')
  }

  const nextMode = nextTimerMode()
  if (state.autoSwitch) setMode(nextMode, state.autoStart)
  else renderTimer()
}

function completeFocusRound() {
  addSession()

  const task = getSelectedTask()
  if (task && !task.done) {
    task.rounds = Math.min(99, task.rounds + 1)
    if (state.completeTaskOnFocusEnd && task.rounds >= task.estimate) {
      task.done = true
      task.completedAt = Date.now()
      selectedTaskId = null
    }
  }

  saveState()
  updateSessionPill()
  renderTasks()
  renderCurrentTask()
}

function nextTimerMode() {
  if (timer.mode !== 'focus') return 'focus'
  const nextSessionCount = getSessions()
  return nextSessionCount > 0 && nextSessionCount % state.longBreakEvery === 0 ? 'long' : 'short'
}

function resetTimer() {
  clearInterval(timer.interval)
  timer.running = false
  timer.remaining = state.durations[timer.mode]
  timer.total = state.durations[timer.mode]
  timer.startedAt = null
  renderTimer()
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
  updateNextBreakLabel()
}

function updateFocusGoal() {
  state.focusGoal = els.focusGoal.value.trim()
  selectedTaskId = null
  saveState()
  renderTasks()
  renderCurrentTask()
}

function getSelectedTask() {
  return state.tasks.find(task => task.id === selectedTaskId) || null
}

function renderCurrentTask() {
  const task = getSelectedTask()
  if (timer.mode !== 'focus') {
    els.currentTaskTitle.textContent = timer.mode === 'short' ? 'Short break' : 'Long break'
    els.currentTaskMeta.textContent = timer.mode === 'short' ? 'Step away for a few minutes.' : 'Take a proper reset before the next sprint.'
    return
  }

  if (task && !task.done) {
    els.currentTaskTitle.textContent = task.title
    els.currentTaskMeta.textContent = `${priorityLabels[task.priority]} priority · ${task.rounds}/${task.estimate} sprint${task.estimate === 1 ? '' : 's'}`
    return
  }

  const customGoal = state.focusGoal.trim()
  els.currentTaskTitle.textContent = customGoal || 'No task selected'
  els.currentTaskMeta.textContent = customGoal ? 'Custom sprint, not tied to the task list.' : 'Pick one from your task list or type a custom sprint.'
}

function updateNextBreakLabel() {
  const sessions = getSessions()
  const untilLong = state.longBreakEvery - (sessions % state.longBreakEvery)
  if (untilLong === state.longBreakEvery) {
    els.nextBreakLabel.textContent = 'Long break comes after this focus.'
  } else {
    els.nextBreakLabel.textContent = `${untilLong} focus sprint${untilLong === 1 ? '' : 's'} until long break.`
  }
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

function addTask(event) {
  event.preventDefault()
  const title = els.todoInput.value.trim()
  if (!title) return

  state.tasks.unshift({
    id: makeId(),
    title,
    done: false,
    priority: els.todoPriority.value,
    estimate: clampNumber(els.todoEstimate.value, 1, 12, 1),
    rounds: 0,
    createdAt: Date.now(),
    completedAt: null
  })

  els.todoInput.value = ''
  els.todoPriority.value = 'normal'
  els.todoEstimate.value = '1'
  saveState()
  renderTasks()
  showToast('Task added')
}

function renderTasks() {
  els.todoList.innerHTML = ''
  state.tasks = sanitizeTasks(state.tasks)

  const total = state.tasks.length
  const done = state.tasks.filter(task => task.done).length
  const open = total - done
  const progress = total ? Math.round((done / total) * 100) : 0

  els.todoCount.textContent = `${open} open`
  els.taskProgressText.textContent = total ? `${done}/${total} done` : 'No tasks yet'
  els.taskProgressFill.style.width = `${progress}%`
  els.filterButtons.forEach(button => button.classList.toggle('active', button.dataset.filter === state.taskFilter))

  const visible = state.tasks.filter(task => {
    if (state.taskFilter === 'done') return task.done
    if (state.taskFilter === 'open') return !task.done
    return true
  })

  if (visible.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'empty-state'
    empty.textContent = state.taskFilter === 'done' ? 'No finished tasks yet.' : state.taskFilter === 'all' ? 'No tasks yet.' : 'No open tasks.'
    els.todoList.append(empty)
    return
  }

  visible.forEach(task => {
    const item = document.createElement('article')
    const goalReached = task.rounds >= task.estimate && !task.done
    item.className = [
      'todo-item',
      task.done ? 'done' : '',
      task.id === selectedTaskId ? 'selected' : '',
      goalReached ? 'goal-reached' : ''
    ].filter(Boolean).join(' ')

    const check = document.createElement('button')
    check.type = 'button'
    check.className = 'todo-check'
    check.setAttribute('aria-label', task.done ? 'Mark task open' : 'Mark task done')
    check.addEventListener('click', () => toggleTask(task.id))

    const body = document.createElement('div')
    body.className = 'todo-body'
    const title = document.createElement('strong')
    title.textContent = task.title
    const meta = document.createElement('div')
    meta.className = 'todo-meta'

    const priority = document.createElement('span')
    priority.className = `priority-tag priority-${task.priority}`
    priority.textContent = priorityLabels[task.priority]

    const rounds = document.createElement('span')
    rounds.textContent = `${task.rounds}/${task.estimate} sprint${task.estimate === 1 ? '' : 's'}`

    const selected = document.createElement('span')
    selected.textContent = task.id === selectedTaskId ? 'Selected' : ''
    if (!selected.textContent) selected.hidden = true

    meta.append(priority, rounds, selected)
    body.append(title, meta)

    const actions = document.createElement('div')
    actions.className = 'task-actions'

    const focus = makeTaskButton(task.id === selectedTaskId ? 'Selected' : 'Focus', () => selectTask(task.id), task.done)
    const plus = makeTaskButton('+1', () => addRoundToTask(task.id), task.done)
    const edit = makeTaskButton('Edit', () => editTask(task.id), false)
    const up = makeTaskButton('Up', () => moveTask(task.id, -1), false)
    const down = makeTaskButton('Down', () => moveTask(task.id, 1), false)
    const remove = makeTaskButton('Delete', () => removeTask(task.id), false, 'danger-text')

    actions.append(focus, plus, edit, up, down, remove)
    item.append(check, body, actions)
    els.todoList.append(item)
  })
}

function makeTaskButton(label, handler, disabled, extraClass = '') {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `task-action ${extraClass}`.trim()
  button.textContent = label
  button.disabled = disabled
  button.addEventListener('click', handler)
  return button
}

function toggleTask(id) {
  const task = state.tasks.find(item => item.id === id)
  if (!task) return

  task.done = !task.done
  task.completedAt = task.done ? Date.now() : null
  if (task.done && selectedTaskId === id) selectedTaskId = null
  saveState()
  renderTasks()
  renderCurrentTask()
}

function selectTask(id) {
  const task = state.tasks.find(item => item.id === id)
  if (!task || task.done) return

  selectedTaskId = task.id
  state.focusGoal = ''
  els.focusGoal.value = ''
  saveState()
  setMode('focus')
  renderTasks()
  renderCurrentTask()
  showToast('Task selected')
}

function addRoundToTask(id) {
  const task = state.tasks.find(item => item.id === id)
  if (!task || task.done) return
  task.rounds = Math.min(99, task.rounds + 1)
  saveState()
  renderTasks()
  renderCurrentTask()
}

function editTask(id) {
  const task = state.tasks.find(item => item.id === id)
  if (!task) return
  const nextTitle = window.prompt('Edit task', task.title)
  if (nextTitle === null) return
  const clean = nextTitle.trim().slice(0, 90)
  if (!clean) return
  task.title = clean
  saveState()
  renderTasks()
  renderCurrentTask()
}

function moveTask(id, direction) {
  const index = state.tasks.findIndex(item => item.id === id)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= state.tasks.length) return
  const [task] = state.tasks.splice(index, 1)
  state.tasks.splice(nextIndex, 0, task)
  saveState()
  renderTasks()
}

function removeTask(id) {
  state.tasks = state.tasks.filter(item => item.id !== id)
  if (selectedTaskId === id) selectedTaskId = null
  saveState()
  renderTasks()
  renderCurrentTask()
}

function pickNextTask() {
  const openTasks = state.tasks.filter(task => !task.done)
  if (openTasks.length === 0) {
    showToast('No open tasks')
    return
  }

  const best = [...openTasks].sort((a, b) => {
    const priorityDiff = priorityRank[b.priority] - priorityRank[a.priority]
    if (priorityDiff) return priorityDiff
    return a.createdAt - b.createdAt
  })[0]

  selectTask(best.id)
}

function clearDoneTasks() {
  state.tasks = state.tasks.filter(task => !task.done)
  saveState()
  renderTasks()
  renderCurrentTask()
  showToast('Done tasks cleared')
}

function resetTaskList() {
  if (state.tasks.length && !window.confirm('Reset the whole task list?')) return
  state.tasks = []
  selectedTaskId = null
  state.focusGoal = ''
  els.focusGoal.value = ''
  saveState()
  renderTasks()
  renderCurrentTask()
  showToast('Task list reset')
}

function setTaskFilter(filter) {
  if (!['open', 'all', 'done'].includes(filter)) return
  state.taskFilter = filter
  saveState()
  renderTasks()
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
  const keepTasks = state.tasks
  const fresh = defaultState()
  Object.assign(state, fresh, { links: keepLinks, tasks: keepTasks })
  selectedTaskId = null
  setTheme(state.theme)
  setDurationInputs()
  applyPageToggles()
  saveState()
  resetTimerToModeDuration()
  updateClock()
  renderRoundDots()
  renderCurrentTask()
  showToast('Settings reset')
}

function showToast(message) {
  els.toast.textContent = message
  els.toast.classList.add('show')
  clearTimeout(showToast.timeout)
  showToast.timeout = setTimeout(() => els.toast.classList.remove('show'), 2200)
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
    const amount = Math.min(140, Math.floor(window.innerWidth / 8))
    for (let i = 0; i < amount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.random() * 2.3 + 0.7) * window.devicePixelRatio,
        speed: (Math.random() * 0.7 + 0.25) * window.devicePixelRatio,
        drift: (Math.random() * 0.8 - 0.4) * window.devicePixelRatio,
        opacity: Math.random() * 0.46 + 0.2
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
  els.finishEarly.addEventListener('click', () => finishTimer(true))
  els.addFive.addEventListener('click', () => adjustTimer(300))
  els.subOne.addEventListener('click', () => adjustTimer(-60))
  els.focusGoal.addEventListener('input', updateFocusGoal)
  els.todoForm.addEventListener('submit', addTask)
  els.pickNextTask.addEventListener('click', pickNextTask)
  els.clearDone.addEventListener('click', clearDoneTasks)
  els.resetTodos.addEventListener('click', resetTaskList)
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
  els.filterButtons.forEach(button => button.addEventListener('click', () => setTaskFilter(button.dataset.filter)))

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
  renderTasks()
  renderLinks()
  renderCurrentTask()
  renderTimer()
  bindEvents()
  initSnow()

  setInterval(updateClock, 1000)
  setInterval(updateCountdown, 60000)
}

init()
