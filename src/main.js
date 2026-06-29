const STORAGE_KEY = 'snowtab-state-v1'
const SESSION_KEY = 'snowtab-sessions-v1'

const defaultLinks = [
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Hack Club', url: 'https://hackclub.com' },
  { name: 'YouTube', url: 'https://youtube.com' },
  { name: 'Zermelo', url: 'https://zermelo.nl' }
]

const messages = [
  'Make it cozy first, then lock in.',
  'Small progress still counts.',
  'Finish one clean task before opening ten tabs.',
  'Take the break before your brain takes it for you.',
  'A good page makes starting easier.',
  'Warm drink, clear goal, start timer.',
  'Do the tiny version first. Polish after.',
  'One focus sprint can fix a whole messy day.',
  'Close the random tab. You know which one.',
  'Get the README done before the panic starts.'
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
  dailyMessage: document.querySelector('#daily-message'),
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
  focusMinutes: document.querySelector('#focus-minutes'),
  shortMinutes: document.querySelector('#short-minutes'),
  longMinutes: document.querySelector('#long-minutes'),
  soundToggle: document.querySelector('#sound-toggle'),
  sessionPill: document.querySelector('#session-pill'),
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

function loadState() {
  const fallback = {
    theme: 'frost',
    links: defaultLinks,
    durations: { focus: 25, short: 5, long: 15 },
    sound: true
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return { ...fallback, ...saved, durations: { ...fallback.durations, ...saved?.durations } }
  } catch {
    return fallback
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getSessions() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY)) || {}
    return saved[todayKey()] || 0
  } catch {
    return 0
  }
}

function addSession() {
  const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}')
  const key = todayKey()
  saved[key] = (saved[key] || 0) + 1
  localStorage.setItem(SESSION_KEY, JSON.stringify(saved))
}

function updateSessionPill() {
  const count = getSessions()
  els.sessionPill.textContent = `${count} session${count === 1 ? '' : 's'} today`
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

function setDailyMessage() {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const day = Math.floor((new Date() - start) / 86400000)
  els.dailyMessage.textContent = messages[day % messages.length]
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
    focus: 'Focus',
    short: 'Short break',
    long: 'Long break'
  }[mode]
}

function setMode(mode, keepRunning = false) {
  timer.mode = mode
  timer.total = state.durations[mode] * 60
  timer.remaining = timer.total
  timer.running = keepRunning

  els.modeTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode))
  els.timerModeTitle.textContent = modeTitle(mode)
  els.timerSubtitle.textContent = mode === 'focus' ? 'Ready to focus' : 'Break time'
  renderTimer()

  if (keepRunning) startTimer()
}

function renderTimer() {
  const minutes = Math.floor(timer.remaining / 60).toString().padStart(2, '0')
  const seconds = Math.floor(timer.remaining % 60).toString().padStart(2, '0')
  els.timerDisplay.textContent = `${minutes}:${seconds}`
  els.startPause.textContent = timer.running ? 'Pause' : 'Start'

  const progress = timer.total === 0 ? 0 : 1 - timer.remaining / timer.total
  const circumference = 2 * Math.PI * 96
  els.timerProgress.style.strokeDasharray = `${circumference}`
  els.timerProgress.style.strokeDashoffset = `${circumference * (1 - progress)}`

  document.title = timer.running ? `${minutes}:${seconds} · SnowTab` : 'SnowTab'
}

function startTimer() {
  clearInterval(timer.interval)
  timer.running = true
  els.timerSubtitle.textContent = timer.mode === 'focus' ? 'Lock in' : 'Recharge'
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

  if (timer.mode === 'focus') {
    addSession()
    updateSessionPill()
    showToast('Focus session complete. Take a real break.')
    playChime()
    setTimeout(() => setMode(getSessions() % 4 === 0 ? 'long' : 'short'), 400)
  } else {
    showToast('Break is over. Start another focus sprint.')
    playChime()
    setTimeout(() => setMode('focus'), 400)
  }
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
  clearInterval(timer.interval)
  setMode(next)
}

function updateDurations() {
  state.durations.focus = clampNumber(els.focusMinutes.value, 1, 180, 25)
  state.durations.short = clampNumber(els.shortMinutes.value, 1, 60, 5)
  state.durations.long = clampNumber(els.longMinutes.value, 1, 90, 15)
  state.sound = els.soundToggle.checked
  saveState()

  if (!timer.running) {
    timer.total = state.durations[timer.mode] * 60
    timer.remaining = timer.total
    renderTimer()
  }
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
  gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
  gain.connect(ctx.destination)

  ;[523.25, 659.25, 783.99].forEach((freq, index) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(gain)
    osc.start(ctx.currentTime + index * 0.12)
    osc.stop(ctx.currentTime + index * 0.12 + 0.42)
  })
}

function renderLinks() {
  els.quickLinks.innerHTML = ''

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

  saveState()
  renderLinks()
  els.linkDialog.close()
  showToast('Link saved')
}

function deleteLink() {
  const index = Number(els.editingIndex.value)
  if (Number.isNaN(index)) return
  state.links.splice(index, 1)
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
    const amount = Math.min(130, Math.floor(window.innerWidth / 9))
    for (let i = 0; i < amount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.random() * 2.4 + 0.8) * window.devicePixelRatio,
        speed: (Math.random() * 0.7 + 0.25) * window.devicePixelRatio,
        drift: (Math.random() * 0.6 - 0.3) * window.devicePixelRatio,
        opacity: Math.random() * 0.55 + 0.25
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
  els.addLink.addEventListener('click', () => openLinkDialog())
  els.linkForm.addEventListener('submit', saveLink)
  els.closeDialog.addEventListener('click', () => els.linkDialog.close())
  els.deleteLink.addEventListener('click', deleteLink)

  els.modeTabs.forEach(tab => tab.addEventListener('click', () => {
    clearInterval(timer.interval)
    setMode(tab.dataset.mode)
  }))

  document.querySelectorAll('[data-theme-button]').forEach(button => {
    button.addEventListener('click', () => setTheme(button.dataset.themeButton))
  })

  ;[els.focusMinutes, els.shortMinutes, els.longMinutes, els.soundToggle].forEach(input => {
    input.addEventListener('change', updateDurations)
  })
}

function init() {
  document.documentElement.dataset.theme = state.theme
  els.focusMinutes.value = state.durations.focus
  els.shortMinutes.value = state.durations.short
  els.longMinutes.value = state.durations.long
  els.soundToggle.checked = state.sound
  timer.remaining = state.durations.focus * 60
  timer.total = timer.remaining

  setTheme(state.theme)
  updateClock()
  updateCountdown()
  setDailyMessage()
  updateSessionPill()
  renderLinks()
  renderTimer()
  bindEvents()
  initSnow()

  setInterval(updateClock, 1000)
  setInterval(updateCountdown, 60000)
}

init()
