const STORAGE_KEY = 'snowtab.v6';
const RING_LENGTH = 640.9;

const wallpaperNames = [
  'Evergreen glow', 'Nordic pine', 'Candle window', 'Frost glass', 'Gold garland',
  'Blue winter', 'Cocoa plaid', 'Mint lights', 'Red velvet', 'Snow village',
  'Pine shadows', 'Quiet chapel', 'Warm kitchen', 'Ice ornaments', 'Ribbon dusk',
  'Forest stars', 'Gingerbread', 'Silver bells', 'Toy workshop', 'Holiday desk',
  'Polar night', 'Cranberry frost', 'Soft lanterns', 'Holly paper', 'Golden hour',
  'Snowy street', 'Fir branches', 'Paper stars', 'Cabin glow', 'Frozen lake',
  'Candy stripe', 'Winter market', 'Warm fireplace', 'Pine wreath', 'Moonlit snow',
  'Peppermint haze', 'Cedar room', 'Snowfall green', 'Starry cocoa', 'Gift wrap',
  'Christmas morning', 'Glass ornaments', 'Quiet red', 'Northern lights', 'Icy mint',
  'Candle pine', 'Snow curtain', 'Jolly amber', 'Deep green', 'Holiday lights'
];

const wallpapers = wallpaperNames.map((name, index) => {
  const num = String(index + 1).padStart(2, '0');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return { name, file: `./wallpapers/${num}-${slug}.svg` };
});

const defaultLinks = [
  { id: crypto.randomUUID(), name: 'GitHub', url: 'https://github.com' },
  { id: crypto.randomUUID(), name: 'Hack Club', url: 'https://hackclub.com' },
  { id: crypto.randomUUID(), name: 'YouTube', url: 'https://youtube.com' },
  { id: crypto.randomUUID(), name: 'MDN Docs', url: 'https://developer.mozilla.org' },
  { id: crypto.randomUUID(), name: 'Google Drive', url: 'https://drive.google.com' },
  { id: crypto.randomUUID(), name: 'Gmail', url: 'https://mail.google.com' }
];

const defaultState = {
  theme: 'evergreen',
  wallpaper: wallpapers[0].file,
  customWallpaper: '',
  showClockSeconds: false,
  showTimerSeconds: true,
  showSnow: true,
  showLights: true,
  links: defaultLinks,
  tasks: [],
  selectedTaskId: null,
  taskFilter: 'open',
  taskSort: 'manual',
  taskSearch: '',
  timer: {
    mode: 'focus',
    running: false,
    remaining: 25 * 60,
    total: 25 * 60,
    focusMinutes: 25,
    shortMinutes: 5,
    longMinutes: 15,
    longEvery: 4,
    sessions: 0,
    autoCycle: true,
    autoStart: false,
    soundAlert: true,
    notifyAlert: false,
    autoCompleteTask: true
  }
};

let state = loadState();
let timerInterval = null;
let lastTick = null;
let editingLinkId = null;
let snowAnimation = null;

const $ = (id) => document.getElementById(id);
const els = {
  clock: $('clock'),
  dateLine: $('date-line'),
  searchForm: $('search-form'),
  searchInput: $('search-input'),
  settingsOpen: $('settings-open'),
  settingsDialog: $('settings-dialog'),
  quickLinks: $('quick-links'),
  addLink: $('add-link'),
  linkDialog: $('link-dialog'),
  linkForm: $('link-form'),
  linkTitle: $('link-dialog-title'),
  linkName: $('link-name'),
  linkUrl: $('link-url'),
  countdownDays: $('countdown-days'),
  countdownLabel: $('countdown-label'),
  countdownFill: $('countdown-fill'),
  countdownDots: $('countdown-dots'),
  timerModeTitle: $('timer-mode-title'),
  timerDisplay: $('timer-display'),
  timerSubtitle: $('timer-subtitle'),
  timerEnd: $('timer-end'),
  timerProgress: $('timer-progress'),
  startPause: $('start-pause'),
  resetTimer: $('reset-timer'),
  finishEarly: $('finish-early'),
  addFive: $('add-five'),
  subOne: $('sub-one'),
  sessionPill: $('session-pill'),
  nextBreakLabel: $('next-break-label'),
  roundDots: $('round-dots'),
  currentTaskTitle: $('current-task-title'),
  currentTaskMeta: $('current-task-meta'),
  focusGoal: $('focus-goal'),
  todoForm: $('todo-form'),
  todoInput: $('todo-input'),
  todoPriority: $('todo-priority'),
  todoEstimate: $('todo-estimate'),
  todoDue: $('todo-due'),
  todoList: $('todo-list'),
  todoCount: $('todo-count'),
  pickNextTask: $('pick-next-task'),
  taskSearch: $('task-search'),
  taskSort: $('task-sort'),
  taskProgressText: $('task-progress-text'),
  taskProgressFill: $('task-progress-fill'),
  clearDone: $('clear-done'),
  resetTodos: $('reset-todos'),
  themeSelect: $('theme-select'),
  wallpaperSelect: $('wallpaper-select'),
  wallpaperGrid: $('wallpaper-grid'),
  randomWallpaper: $('random-wallpaper'),
  customWallpaper: $('custom-wallpaper'),
  showClockSeconds: $('show-clock-seconds'),
  showTimerSeconds: $('show-timer-seconds'),
  showSnow: $('show-snow'),
  showLights: $('show-lights'),
  focusMinutes: $('focus-minutes'),
  shortMinutes: $('short-minutes'),
  longMinutes: $('long-minutes'),
  longEvery: $('long-every'),
  autoCycle: $('auto-cycle'),
  autoStart: $('auto-start'),
  soundAlert: $('sound-alert'),
  notifyAlert: $('notify-alert'),
  autoCompleteTask: $('auto-complete-task'),
  snowCanvas: $('snow-canvas')
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    const merged = mergeState(defaultState, parsed);
    merged.links = sanitizeLinks(merged.links);
    merged.tasks = Array.isArray(merged.tasks) ? merged.tasks : [];
    return merged;
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(base, saved) {
  const output = structuredClone(base);
  Object.assign(output, saved || {});
  output.timer = { ...base.timer, ...(saved?.timer || {}) };
  return output;
}

function sanitizeLinks(links) {
  const cleaned = Array.isArray(links) ? links.filter((link) => {
    const haystack = `${link.name || ''} ${link.url || ''}`.toLowerCase();
    return !haystack.includes('zermelo');
  }) : [];

  const byName = new Set(cleaned.map((link) => (link.name || '').toLowerCase()));
  for (const link of defaultLinks) {
    if (cleaned.length >= 6) break;
    if (!byName.has(link.name.toLowerCase())) cleaned.push({ ...link, id: crypto.randomUUID() });
  }

  return cleaned.length ? cleaned : structuredClone(defaultLinks);
}

function save() {
  state.timer.running = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveLive() {
  const timerRunning = state.timer.running;
  state.timer.running = false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  state.timer.running = timerRunning;
}

function applyLook() {
  document.documentElement.dataset.theme = state.theme;
  const wallpaper = state.customWallpaper || state.wallpaper || wallpapers[0].file;
  document.documentElement.style.setProperty('--wallpaper', `url("${wallpaper}")`);
  document.body.classList.toggle('hide-snow', !state.showSnow);
  document.body.classList.toggle('hide-lights', !state.showLights);
  if (state.showSnow) startSnow(); else stopSnow();
}

function renderAll() {
  applyLook();
  renderClock();
  renderCountdown();
  renderLinks();
  renderTasks();
  renderTimer();
  syncSettings();
}

function renderClock() {
  const now = new Date();
  els.clock.textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: state.showClockSeconds ? '2-digit' : undefined
  });
  els.dateLine.textContent = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}

function christmasTarget(now = new Date()) {
  let year = now.getFullYear();
  let target = new Date(year, 11, 25, 0, 0, 0);
  if (now > target) target = new Date(year + 1, 11, 25, 0, 0, 0);
  return target;
}

function renderCountdown() {
  const now = new Date();
  const target = christmasTarget(now);
  const days = Math.max(0, Math.ceil((target - now) / 86400000));
  els.countdownDays.textContent = String(days);
  els.countdownLabel.textContent = days === 1 ? 'day left' : 'days left';

  const start = new Date(target.getFullYear(), 0, 1);
  const total = target - start;
  const done = Math.min(1, Math.max(0, (now - start) / total));
  els.countdownFill.style.width = `${done * 100}%`;

  els.countdownDots.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const dot = document.createElement('span');
    dot.className = i / 20 <= done ? 'done' : '';
    els.countdownDots.appendChild(dot);
  }
}

function renderLinks() {
  els.quickLinks.innerHTML = '';
  state.links.forEach((link) => {
    const card = document.createElement('div');
    card.className = 'link-card';

    const domain = getDomain(link.url);
    card.innerHTML = `
      <a class="link-main" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
        <div class="link-top">
          <span class="site-icon"><img src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64" alt="" onerror="this.remove()"><span>${escapeHtml(link.name[0] || '?')}</span></span>
        </div>
        <strong>${escapeHtml(link.name)}</strong>
        <small>${escapeHtml(domain)}</small>
      </a>
      <span class="link-actions">
        <button class="secondary-button" data-link-action="edit" data-id="${link.id}" type="button">Edit</button>
        <button class="secondary-button danger" data-link-action="delete" data-id="${link.id}" type="button">Delete</button>
      </span>
    `;
    els.quickLinks.appendChild(card);
  });
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function renderTasks() {
  const tasks = getVisibleTasks();
  els.todoList.innerHTML = '';

  const open = state.tasks.filter((task) => !task.done).length;
  els.todoCount.textContent = `${open} open`;
  els.taskSearch.value = state.taskSearch;
  els.taskSort.value = state.taskSort;
  document.querySelectorAll('.filter-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === state.taskFilter);
  });

  const totalEstimate = state.tasks.reduce((sum, task) => sum + Number(task.estimate || 1), 0);
  const totalDone = state.tasks.reduce((sum, task) => sum + Math.min(Number(task.progress || 0), Number(task.estimate || 1)), 0);
  els.taskProgressText.textContent = totalEstimate ? `${totalDone}/${totalEstimate} sprints logged` : 'No tasks yet';
  els.taskProgressFill.style.width = totalEstimate ? `${Math.min(100, (totalDone / totalEstimate) * 100)}%` : '0%';

  if (!tasks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = state.tasks.length ? 'No tasks match this view.' : 'No tasks yet.';
    els.todoList.appendChild(empty);
    renderCurrentTask();
    return;
  }

  tasks.forEach((task) => {
    const card = document.createElement('div');
    const progress = Math.min(100, (Number(task.progress || 0) / Number(task.estimate || 1)) * 100);
    card.className = `task-card ${task.done ? 'done' : ''} ${task.id === state.selectedTaskId ? 'selected' : ''}`;
    card.dataset.id = task.id;
    card.innerHTML = `
      <button class="task-check" data-task-action="toggle" title="Mark done" type="button">${task.done ? '✓' : ''}</button>
      <div class="task-main">
        <div class="task-title-row">
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
          <span class="task-chip ${task.priority}">${labelPriority(task.priority)}</span>
        </div>
        <div class="task-meta">
          <span class="task-chip">${task.progress || 0}/${task.estimate || 1} sprints</span>
          <span class="task-chip">${labelDue(task.due)}</span>
          ${task.id === state.selectedTaskId ? '<span class="task-chip low">Active</span>' : ''}
        </div>
        <div class="task-progress"><span style="width:${progress}%"></span></div>
        <div class="task-actions">
          <button class="secondary-button" data-task-action="start" type="button">Start</button>
          <button class="secondary-button" data-task-action="progress" type="button">+ sprint</button>
          <button class="secondary-button" data-task-action="edit" type="button">Edit</button>
          <button class="secondary-button" data-task-action="up" type="button">Up</button>
          <button class="secondary-button" data-task-action="down" type="button">Down</button>
          <button class="secondary-button danger" data-task-action="delete" type="button">Delete</button>
        </div>
      </div>
    `;
    els.todoList.appendChild(card);
  });
  renderCurrentTask();
}

function getVisibleTasks() {
  let tasks = [...state.tasks];
  if (state.taskFilter === 'open') tasks = tasks.filter((task) => !task.done);
  if (state.taskFilter === 'done') tasks = tasks.filter((task) => task.done);
  const q = state.taskSearch.trim().toLowerCase();
  if (q) tasks = tasks.filter((task) => task.title.toLowerCase().includes(q));

  const priorityValue = { high: 0, normal: 1, low: 2 };
  const dueValue = { today: 0, tomorrow: 1, week: 2, none: 3 };
  if (state.taskSort === 'priority') tasks.sort((a, b) => priorityValue[a.priority] - priorityValue[b.priority]);
  if (state.taskSort === 'due') tasks.sort((a, b) => dueValue[a.due] - dueValue[b.due]);
  if (state.taskSort === 'progress') tasks.sort((a, b) => (a.progress / a.estimate) - (b.progress / b.estimate));
  if (state.taskSort === 'created') tasks.sort((a, b) => b.created - a.created);
  return tasks;
}

function labelPriority(value) {
  if (value === 'high') return 'High';
  if (value === 'low') return 'Low';
  return 'Normal';
}

function labelDue(value) {
  if (value === 'today') return 'Today';
  if (value === 'tomorrow') return 'Tomorrow';
  if (value === 'week') return 'This week';
  return 'No due';
}

function renderCurrentTask() {
  const task = state.tasks.find((item) => item.id === state.selectedTaskId && !item.done);
  if (!task) {
    state.selectedTaskId = null;
    els.currentTaskTitle.textContent = 'No task selected';
    els.currentTaskMeta.textContent = 'Pick one from the study list or type a quick sprint.';
    return;
  }
  els.currentTaskTitle.textContent = task.title;
  els.currentTaskMeta.textContent = `${task.progress || 0}/${task.estimate || 1} sprints, ${labelPriority(task.priority).toLowerCase()} priority`;
}

function renderTimer() {
  const timer = state.timer;
  const modeName = timer.mode === 'focus' ? 'Focus' : timer.mode === 'short' ? 'Break' : 'Long break';
  els.timerModeTitle.textContent = modeName;

  document.querySelectorAll('.mode-tab').forEach((button) => {
    button.classList.toggle('active', button.dataset.mode === timer.mode);
  });

  els.timerDisplay.textContent = formatTime(timer.remaining, state.showTimerSeconds);
  els.timerSubtitle.textContent = timer.running ? 'Running' : 'Ready';
  els.startPause.textContent = timer.running ? 'Pause' : 'Start';
  els.finishEarly.textContent = timer.mode === 'focus' ? 'Log sprint' : 'Skip break';
  els.sessionPill.textContent = `${timer.sessions} ${timer.sessions === 1 ? 'session' : 'sessions'}`;

  const percent = timer.total ? Math.min(1, Math.max(0, timer.remaining / timer.total)) : 0;
  els.timerProgress.style.strokeDasharray = RING_LENGTH;
  els.timerProgress.style.strokeDashoffset = RING_LENGTH * (1 - percent);

  if (timer.running) {
    const end = new Date(Date.now() + timer.remaining * 1000);
    els.timerEnd.textContent = `Ends ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    els.timerEnd.textContent = 'Not running';
  }

  const nextIsLong = (timer.sessions + 1) % timer.longEvery === 0;
  els.nextBreakLabel.textContent = timer.mode === 'focus'
    ? `${nextIsLong ? 'Long break' : 'Short break'} after this focus`
    : 'Focus after this break';

  els.roundDots.innerHTML = '';
  for (let i = 0; i < timer.longEvery; i++) {
    const dot = document.createElement('span');
    dot.className = i < (timer.sessions % timer.longEvery) ? 'done' : '';
    els.roundDots.appendChild(dot);
  }
}

function formatTime(seconds, showSeconds = true) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  if (!showSeconds) return `${minutes}m`;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function modeSeconds(mode = state.timer.mode) {
  if (mode === 'short') return Number(state.timer.shortMinutes) * 60;
  if (mode === 'long') return Number(state.timer.longMinutes) * 60;
  return Number(state.timer.focusMinutes) * 60;
}

function setMode(mode, keepRunning = false) {
  state.timer.mode = mode;
  state.timer.total = modeSeconds(mode);
  state.timer.remaining = state.timer.total;
  state.timer.running = keepRunning;
  if (keepRunning) startTimer(); else stopTimer(false);
  saveLive();
  renderTimer();
}

function startTimer() {
  if (state.timer.running && timerInterval) return;
  state.timer.running = true;
  lastTick = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 300);
  renderTimer();
}

function pauseTimer() {
  state.timer.running = false;
  clearInterval(timerInterval);
  timerInterval = null;
  saveLive();
  renderTimer();
}

function stopTimer(render = true) {
  state.timer.running = false;
  clearInterval(timerInterval);
  timerInterval = null;
  if (render) renderTimer();
}

function tickTimer() {
  if (!state.timer.running) return;
  const now = Date.now();
  const diff = (now - lastTick) / 1000;
  lastTick = now;
  state.timer.remaining = Math.max(0, state.timer.remaining - diff);
  if (state.timer.remaining <= 0) completeTimer();
  renderTimer();
}

function completeTimer() {
  const completedMode = state.timer.mode;
  stopTimer(false);
  if (completedMode === 'focus') {
    state.timer.sessions += 1;
    logSelectedTaskSprint();
  }
  notifyDone(completedMode);

  if (state.timer.autoCycle) {
    const nextMode = completedMode === 'focus'
      ? (state.timer.sessions % state.timer.longEvery === 0 ? 'long' : 'short')
      : 'focus';
    setMode(nextMode, state.timer.autoStart);
  } else {
    state.timer.remaining = state.timer.total;
  }
  saveLive();
  renderAll();
}

function notifyDone(mode) {
  if (state.timer.soundAlert) playDing();
  if (state.timer.notifyAlert && 'Notification' in window && Notification.permission === 'granted') {
    const title = mode === 'focus' ? 'Focus finished' : 'Break finished';
    new Notification(title, { body: 'SnowTab timer is done.' });
  }
}

function playDing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.52);
  } catch {}
}

function logSelectedTaskSprint() {
  const task = state.tasks.find((item) => item.id === state.selectedTaskId && !item.done);
  if (!task) return;
  task.progress = Math.min(Number(task.estimate || 1), Number(task.progress || 0) + 1);
  if (state.timer.autoCompleteTask && task.progress >= task.estimate) {
    task.done = true;
    state.selectedTaskId = null;
  }
}

function finishEarly() {
  if (state.timer.mode === 'focus') {
    state.timer.sessions += 1;
    logSelectedTaskSprint();
    const nextMode = state.timer.sessions % state.timer.longEvery === 0 ? 'long' : 'short';
    setMode(nextMode, false);
  } else {
    setMode('focus', false);
  }
  saveLive();
  renderAll();
}

function syncSettings() {
  els.themeSelect.value = state.theme;
  els.wallpaperSelect.value = state.wallpaper;
  els.customWallpaper.value = state.customWallpaper || '';
  els.showClockSeconds.checked = state.showClockSeconds;
  els.showTimerSeconds.checked = state.showTimerSeconds;
  els.showSnow.checked = state.showSnow;
  els.showLights.checked = state.showLights;
  els.focusMinutes.value = state.timer.focusMinutes;
  els.shortMinutes.value = state.timer.shortMinutes;
  els.longMinutes.value = state.timer.longMinutes;
  els.longEvery.value = state.timer.longEvery;
  els.autoCycle.checked = state.timer.autoCycle;
  els.autoStart.checked = state.timer.autoStart;
  els.soundAlert.checked = state.timer.soundAlert;
  els.notifyAlert.checked = state.timer.notifyAlert;
  els.autoCompleteTask.checked = state.timer.autoCompleteTask;
}

function buildWallpaperSettings() {
  els.wallpaperSelect.innerHTML = '';
  wallpapers.forEach((wallpaper) => {
    const option = document.createElement('option');
    option.value = wallpaper.file;
    option.textContent = wallpaper.name;
    els.wallpaperSelect.appendChild(option);
  });

  els.wallpaperGrid.innerHTML = '';
  wallpapers.forEach((wallpaper) => {
    const button = document.createElement('button');
    button.className = 'wallpaper-choice';
    button.type = 'button';
    button.title = wallpaper.name;
    button.dataset.file = wallpaper.file;
    button.style.backgroundImage = `url("${wallpaper.file}")`;
    button.addEventListener('click', () => {
      state.wallpaper = wallpaper.file;
      state.customWallpaper = '';
      saveLive();
      renderAll();
      markWallpaperChoice();
    });
    els.wallpaperGrid.appendChild(button);
  });
  markWallpaperChoice();
}

function markWallpaperChoice() {
  document.querySelectorAll('.wallpaper-choice').forEach((button) => {
    button.classList.toggle('active', button.dataset.file === state.wallpaper && !state.customWallpaper);
  });
}

function bindEvents() {
  els.searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = els.searchInput.value.trim();
    if (!query) return;
    const url = looksLikeUrl(query) ? normalizeUrl(query) : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.location.href = url;
  });

  els.settingsOpen.addEventListener('click', () => els.settingsDialog.showModal());
  els.addLink.addEventListener('click', () => openLinkDialog());
  els.linkForm.addEventListener('submit', (event) => {
    event.preventDefault();
    saveLinkFromDialog();
  });

  els.quickLinks.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-link-action]');
    if (!button) return;
    event.preventDefault();
    const id = button.dataset.id;
    if (button.dataset.linkAction === 'edit') openLinkDialog(id);
    if (button.dataset.linkAction === 'delete') {
      state.links = state.links.filter((link) => link.id !== id);
      saveLive();
      renderLinks();
    }
  });

  els.startPause.addEventListener('click', () => state.timer.running ? pauseTimer() : startTimer());
  els.resetTimer.addEventListener('click', () => setMode(state.timer.mode, false));
  els.finishEarly.addEventListener('click', finishEarly);
  els.addFive.addEventListener('click', () => adjustTimer(5 * 60));
  els.subOne.addEventListener('click', () => adjustTimer(-60));

  document.querySelectorAll('.mode-tab').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode, false));
  });

  document.querySelectorAll('.preset-button').forEach((button) => {
    button.addEventListener('click', () => applyPreset(button.dataset.preset));
  });

  els.todoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    addTask();
  });

  els.todoList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-task-action]');
    if (!button) return;
    const card = button.closest('.task-card');
    if (!card) return;
    handleTaskAction(card.dataset.id, button.dataset.taskAction);
  });

  document.querySelectorAll('.filter-button').forEach((button) => {
    button.addEventListener('click', () => {
      state.taskFilter = button.dataset.filter;
      saveLive();
      renderTasks();
    });
  });

  els.taskSearch.addEventListener('input', () => {
    state.taskSearch = els.taskSearch.value;
    saveLive();
    renderTasks();
  });
  els.taskSort.addEventListener('change', () => {
    state.taskSort = els.taskSort.value;
    saveLive();
    renderTasks();
  });
  els.pickNextTask.addEventListener('click', pickNextTask);
  els.clearDone.addEventListener('click', () => {
    state.tasks = state.tasks.filter((task) => !task.done);
    saveLive();
    renderTasks();
  });
  els.resetTodos.addEventListener('click', () => {
    if (!confirm('Clear all tasks?')) return;
    state.tasks = [];
    state.selectedTaskId = null;
    saveLive();
    renderTasks();
  });

  els.themeSelect.addEventListener('change', () => updateSetting('theme', els.themeSelect.value));
  els.wallpaperSelect.addEventListener('change', () => {
    state.wallpaper = els.wallpaperSelect.value;
    state.customWallpaper = '';
    saveLive();
    renderAll();
  });
  els.randomWallpaper.addEventListener('click', () => {
    const pick = wallpapers[Math.floor(Math.random() * wallpapers.length)];
    state.wallpaper = pick.file;
    state.customWallpaper = '';
    saveLive();
    renderAll();
  });
  els.customWallpaper.addEventListener('change', () => {
    state.customWallpaper = els.customWallpaper.value.trim();
    saveLive();
    renderAll();
  });

  bindCheckbox(els.showClockSeconds, 'showClockSeconds');
  bindCheckbox(els.showTimerSeconds, 'showTimerSeconds');
  bindCheckbox(els.showSnow, 'showSnow');
  bindCheckbox(els.showLights, 'showLights');
  bindTimerNumber(els.focusMinutes, 'focusMinutes');
  bindTimerNumber(els.shortMinutes, 'shortMinutes');
  bindTimerNumber(els.longMinutes, 'longMinutes');
  bindTimerNumber(els.longEvery, 'longEvery');
  bindTimerCheckbox(els.autoCycle, 'autoCycle');
  bindTimerCheckbox(els.autoStart, 'autoStart');
  bindTimerCheckbox(els.soundAlert, 'soundAlert');
  bindTimerCheckbox(els.autoCompleteTask, 'autoCompleteTask');
  els.notifyAlert.addEventListener('change', async () => {
    if (els.notifyAlert.checked && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    state.timer.notifyAlert = els.notifyAlert.checked && (!('Notification' in window) || Notification.permission === 'granted');
    saveLive();
    renderAll();
  });
}

function bindCheckbox(element, key) {
  element.addEventListener('change', () => {
    state[key] = element.checked;
    saveLive();
    renderAll();
  });
}

function bindTimerCheckbox(element, key) {
  element.addEventListener('change', () => {
    state.timer[key] = element.checked;
    saveLive();
    renderAll();
  });
}

function bindTimerNumber(element, key) {
  element.addEventListener('change', () => {
    const value = Number(element.value);
    if (!Number.isFinite(value) || value < 1) return;
    state.timer[key] = Math.round(value);
    if (!state.timer.running) {
      state.timer.total = modeSeconds(state.timer.mode);
      state.timer.remaining = Math.min(state.timer.remaining, state.timer.total);
      if (state.timer.remaining <= 0 || Math.abs(state.timer.remaining - state.timer.total) < 2) {
        state.timer.remaining = state.timer.total;
      }
    }
    saveLive();
    renderAll();
  });
}

function updateSetting(key, value) {
  state[key] = value;
  saveLive();
  renderAll();
}

function openLinkDialog(id = null) {
  editingLinkId = id;
  const link = state.links.find((item) => item.id === id);
  els.linkTitle.textContent = link ? 'Edit link' : 'Add link';
  els.linkName.value = link?.name || '';
  els.linkUrl.value = link?.url || '';
  els.linkDialog.showModal();
}

function saveLinkFromDialog() {
  const name = els.linkName.value.trim();
  const url = normalizeUrl(els.linkUrl.value.trim());
  if (!name || !url) return;
  if (editingLinkId) {
    const link = state.links.find((item) => item.id === editingLinkId);
    if (link) Object.assign(link, { name, url });
  } else {
    state.links.push({ id: crypto.randomUUID(), name, url });
  }
  saveLive();
  renderLinks();
  els.linkDialog.close();
}

function addTask() {
  const title = els.todoInput.value.trim();
  if (!title) return;
  state.tasks.push({
    id: crypto.randomUUID(),
    title,
    priority: els.todoPriority.value,
    estimate: Number(els.todoEstimate.value),
    due: els.todoDue.value,
    progress: 0,
    done: false,
    created: Date.now()
  });
  els.todoInput.value = '';
  state.taskFilter = 'open';
  saveLive();
  renderTasks();
}

function handleTaskAction(id, action) {
  const index = state.tasks.findIndex((task) => task.id === id);
  const task = state.tasks[index];
  if (!task) return;

  if (action === 'toggle') task.done = !task.done;
  if (action === 'start') {
    state.selectedTaskId = task.id;
    if (state.timer.mode !== 'focus') setMode('focus', false);
  }
  if (action === 'progress') addTaskProgress(task);
  if (action === 'edit') editTask(task);
  if (action === 'delete') {
    state.tasks.splice(index, 1);
    if (state.selectedTaskId === id) state.selectedTaskId = null;
  }
  if (action === 'up' && index > 0) {
    [state.tasks[index - 1], state.tasks[index]] = [state.tasks[index], state.tasks[index - 1]];
    state.taskSort = 'manual';
  }
  if (action === 'down' && index < state.tasks.length - 1) {
    [state.tasks[index + 1], state.tasks[index]] = [state.tasks[index], state.tasks[index + 1]];
    state.taskSort = 'manual';
  }
  saveLive();
  renderTasks();
}

function addTaskProgress(task) {
  task.progress = Math.min(Number(task.estimate || 1), Number(task.progress || 0) + 1);
  if (state.timer.autoCompleteTask && task.progress >= task.estimate) task.done = true;
}

function editTask(task) {
  const title = prompt('Task name', task.title);
  if (title === null) return;
  const clean = title.trim();
  if (!clean) return;
  task.title = clean;
  const estimate = Number(prompt('Sprint estimate', task.estimate));
  if (Number.isFinite(estimate) && estimate > 0) task.estimate = Math.round(estimate);
  task.progress = Math.min(task.progress, task.estimate);
}

function pickNextTask() {
  const candidates = state.tasks.filter((task) => !task.done);
  if (!candidates.length) return;
  const priorityValue = { high: 0, normal: 1, low: 2 };
  candidates.sort((a, b) => priorityValue[a.priority] - priorityValue[b.priority] || (a.progress / a.estimate) - (b.progress / b.estimate));
  state.selectedTaskId = candidates[0].id;
  setMode('focus', false);
  saveLive();
  renderAll();
}

function adjustTimer(delta) {
  state.timer.remaining = Math.max(60, state.timer.remaining + delta);
  state.timer.total = Math.max(state.timer.remaining, state.timer.total);
  saveLive();
  renderTimer();
}

function applyPreset(preset) {
  const presets = {
    classic: { focusMinutes: 25, shortMinutes: 5, longMinutes: 15 },
    deep: { focusMinutes: 50, shortMinutes: 10, longMinutes: 25 },
    quick: { focusMinutes: 15, shortMinutes: 5, longMinutes: 12 }
  };
  Object.assign(state.timer, presets[preset] || presets.classic);
  document.querySelectorAll('.preset-button').forEach((button) => button.classList.toggle('active', button.dataset.preset === preset));
  setMode('focus', false);
  saveLive();
  renderAll();
}

function looksLikeUrl(value) {
  return /^(https?:\/\/|www\.|[\w-]+\.[a-z]{2,})(\S*)?$/i.test(value);
}

function normalizeUrl(value) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function startSnow() {
  const canvas = els.snowCanvas;
  const ctx = canvas.getContext('2d');
  const flakes = [];
  const count = Math.min(130, Math.floor(window.innerWidth / 13));

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function makeFlake() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.2 + 0.7,
      s: Math.random() * 0.7 + 0.25,
      drift: Math.random() * 0.8 - 0.4,
      phase: Math.random() * Math.PI * 2
    };
  }

  if (!flakes.length) {
    for (let i = 0; i < count; i++) flakes.push(makeFlake());
  }

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fillStyle = 'rgba(255, 255, 255, .75)';
    flakes.forEach((flake) => {
      flake.phase += 0.01;
      flake.y += flake.s;
      flake.x += flake.drift + Math.sin(flake.phase) * 0.18;
      if (flake.y > window.innerHeight + 10) {
        flake.y = -10;
        flake.x = Math.random() * window.innerWidth;
      }
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
      ctx.fill();
    });
    snowAnimation = requestAnimationFrame(draw);
  }

  stopSnow();
  resize();
  window.addEventListener('resize', resize, { passive: true });
  draw();
}

function stopSnow() {
  if (snowAnimation) cancelAnimationFrame(snowAnimation);
  snowAnimation = null;
  const canvas = els.snowCanvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

buildWallpaperSettings();
bindEvents();
renderAll();
setInterval(() => {
  renderClock();
  renderCountdown();
}, 1000);
