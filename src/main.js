const storageKey = "snowtab-final-v1";

const wallpapers = [
  { id: "santa-village", name: "Santa village", path: "./wallpapers/00-santa-village.svg" },
  { id: "sleigh", name: "Sleigh night", path: "./wallpapers/01-santa-sleigh.svg" },
  { id: "north-pole", name: "North Pole", path: "./wallpapers/02-north-pole.svg" },
  { id: "cabin", name: "Cozy cabin", path: "./wallpapers/03-cozy-cabin.svg" },
  { id: "workshop", name: "Workshop", path: "./wallpapers/04-toy-workshop.svg" },
  { id: "reindeer", name: "Reindeer", path: "./wallpapers/05-reindeer-night.svg" },
  { id: "town", name: "Town", path: "./wallpapers/06-christmas-town.svg" },
  { id: "fireplace", name: "Fireplace", path: "./wallpapers/07-fireplace.svg" },
  { id: "snowman", name: "Snowman", path: "./wallpapers/08-snowman-yard.svg" },
  { id: "train", name: "Winter train", path: "./wallpapers/09-winter-train.svg" },
  { id: "market", name: "Market", path: "./wallpapers/10-christmas-market.svg" },
  { id: "rooftops", name: "Rooftops", path: "./wallpapers/11-rooftops.svg" }
];

const defaultLinks = [
  { name: "GitHub", url: "https://github.com" },
  { name: "Hack Club", url: "https://hackclub.com" },
  { name: "YouTube", url: "https://youtube.com" },
  { name: "MDN Docs", url: "https://developer.mozilla.org" },
  { name: "Google Drive", url: "https://drive.google.com" },
  { name: "Gmail", url: "https://mail.google.com" },
  { name: "ChatGPT", url: "https://chatgpt.com" },
  { name: "Calendar", url: "https://calendar.google.com" }
];

const defaultState = {
  settings: {
    clockSeconds: true,
    showYear: true,
    snow: true,
    lights: true,
    performance: true,
    searchEngine: "google",
    focusMinutes: 25,
    breakMinutes: 5,
    wallpaper: "santa-village",
    customWallpaper: ""
  },
  links: defaultLinks,
  todos: [],
  todoFilter: "open",
  currentTaskId: null,
  note: "",
  sessions: 0
};

const searchEngines = {
  google: { label: "Google", url: "https://www.google.com/search?q=" },
  duckduckgo: { label: "DuckDuckGo", url: "https://duckduckgo.com/?q=" },
  bing: { label: "Bing", url: "https://www.bing.com/search?q=" },
  brave: { label: "Brave", url: "https://search.brave.com/search?q=" },
  youtube: { label: "YouTube", url: "https://www.youtube.com/results?search_query=" }
};

let state = loadState();
let timer = {
  mode: "focus",
  remaining: state.settings.focusMinutes * 60,
  total: state.settings.focusMinutes * 60,
  running: false,
  interval: null
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      settings: { ...defaultState.settings, ...(parsed.settings || {}) },
      links: Array.isArray(parsed.links) && parsed.links.length ? parsed.links : defaultLinks,
      todos: Array.isArray(parsed.todos) ? parsed.todos : []
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function normalizeUrl(value) {
  const input = value.trim();
  if (!input) return "";
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}

function hostname(url) {
  try { return new URL(normalizeUrl(url)).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function faviconUrl(url) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname(url))}&sz=64`;
}

function setWallpaper() {
  const custom = state.settings.customWallpaper.trim();
  const selected = wallpapers.find((item) => item.id === state.settings.wallpaper) || wallpapers[0];
  const path = custom || selected.path;
  document.body.style.backgroundImage = `linear-gradient(180deg, rgba(5, 20, 19, 0.18), rgba(5, 20, 19, 0.38)), url("${path}")`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundAttachment = "scroll";
  $$(".wallpaper-option").forEach((button) => button.classList.toggle("active", button.dataset.wallpaper === state.settings.wallpaper && !custom));
}

function renderClock() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  const clock = $("#clock");
  clock.textContent = state.settings.clockSeconds ? `${hour}:${minute}:${second}` : `${hour}:${minute}`;
  clock.classList.toggle("with-seconds", state.settings.clockSeconds);

  const options = { weekday: "long", day: "numeric", month: "long" };
  if (state.settings.showYear) options.year = "numeric";
  $("#date-line").textContent = now.toLocaleDateString(undefined, options);
}

function getChristmasCountdown() {
  const now = new Date();
  let christmas = new Date(now.getFullYear(), 11, 25);
  if (now > christmas) christmas = new Date(now.getFullYear() + 1, 11, 25);
  const days = Math.ceil((christmas - now) / 86400000);
  const yearStart = new Date(christmas.getFullYear(), 0, 1);
  const total = Math.ceil((christmas - yearStart) / 86400000);
  const elapsed = total - days;
  return { days, progress: Math.max(3, Math.min(100, (elapsed / total) * 100)) };
}

function renderCountdown() {
  const { days, progress } = getChristmasCountdown();
  $("#countdown-days").textContent = days;
  $("#countdown-fill").style.width = `${progress}%`;
}

function renderLinks() {
  const container = $("#quick-links");
  container.innerHTML = "";
  state.links.forEach((link, index) => {
    const card = document.createElement("article");
    card.className = "quick-link";
    card.innerHTML = `
      <a class="quick-link-main" href="${normalizeUrl(link.url)}">
        <span class="favicon"><img src="${faviconUrl(link.url)}" alt="" loading="lazy"></span>
        <strong>${escapeHtml(link.name)}</strong>
        <small>${escapeHtml(hostname(link.url))}</small>
      </a>
      <div class="quick-actions">
        <button type="button" data-edit-link="${index}">Edit</button>
        <button type="button" class="danger-lite" data-delete-link="${index}">Delete</button>
      </div>`;
    container.append(card);
  });
}

function renderTodos() {
  const openCount = state.todos.filter((task) => !task.done).length;
  $("#todo-count").textContent = `${openCount} open`;
  const list = $("#todo-list");
  list.innerHTML = "";
  const filtered = state.todos.filter((task) => {
    if (state.todoFilter === "open") return !task.done;
    if (state.todoFilter === "done") return task.done;
    return true;
  });
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "todo-empty";
    empty.textContent = state.todoFilter === "done" ? "No finished tasks." : "No tasks yet.";
    list.append(empty);
  }
  filtered.forEach((task) => {
    const item = document.createElement("article");
    item.className = `todo-item${task.done ? " done" : ""}${state.currentTaskId === task.id ? " current" : ""}`;
    item.innerHTML = `
      <input class="todo-check" type="checkbox" ${task.done ? "checked" : ""} data-toggle-task="${task.id}" aria-label="Mark task done">
      <div class="todo-text">${escapeHtml(task.text)}</div>
      <div class="todo-actions">
        <button type="button" data-focus-task="${task.id}">Focus</button>
        <button type="button" class="delete-task" data-delete-task="${task.id}">Delete</button>
      </div>`;
    list.append(item);
  });
  renderCurrentTask();
}

function renderCurrentTask() {
  const task = state.todos.find((item) => item.id === state.currentTaskId && !item.done);
  $("#current-task-title").textContent = task ? task.text : "No task selected";
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function setTimerMode(mode, reset = true) {
  timer.mode = mode;
  if (reset) {
    timer.remaining = mode === "focus" ? state.settings.focusMinutes * 60 : state.settings.breakMinutes * 60;
    timer.total = timer.remaining;
    timer.running = false;
    clearInterval(timer.interval);
  }
  $$(".mode-tab").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  $("#timer-mode-title").textContent = mode === "focus" ? "Focus" : "Break";
  renderTimer();
}

function renderTimer() {
  $("#timer-display").textContent = formatTime(timer.remaining);
  $("#timer-subtitle").textContent = timer.running ? "Running" : "Ready";
  $("#start-pause").textContent = timer.running ? "Pause" : "Start";
  $("#session-pill").textContent = `${state.sessions} session${state.sessions === 1 ? "" : "s"}`;
  const done = timer.total ? ((timer.total - timer.remaining) / timer.total) * 100 : 0;
  $("#timer-progress").style.width = `${Math.min(100, Math.max(0, done))}%`;
  document.title = timer.running ? `${formatTime(timer.remaining)} • SnowTab` : "SnowTab";
}

function startPauseTimer() {
  if (timer.running) {
    timer.running = false;
    clearInterval(timer.interval);
    renderTimer();
    return;
  }
  timer.running = true;
  timer.interval = setInterval(() => {
    timer.remaining -= 1;
    if (timer.remaining <= 0) finishTimer();
    renderTimer();
  }, 1000);
  renderTimer();
}

function finishTimer() {
  clearInterval(timer.interval);
  timer.running = false;
  timer.remaining = 0;
  if (timer.mode === "focus") {
    state.sessions += 1;
    saveState();
    showToast("Focus session done");
  } else {
    showToast("Break done");
  }
  renderTimer();
}

function resetTimer() {
  setTimerMode(timer.mode, true);
}

function renderSettings() {
  $("#clock-seconds-toggle").checked = state.settings.clockSeconds;
  $("#date-year-toggle").checked = state.settings.showYear;
  $("#snow-toggle").checked = state.settings.snow;
  $("#lights-toggle").checked = state.settings.lights;
  $("#search-engine").value = state.settings.searchEngine;
  const engineName = searchEngines[state.settings.searchEngine]?.label || "Google";
  $("#search-input").placeholder = `Search with ${engineName} or paste a URL`;
  $("#focus-minutes").value = state.settings.focusMinutes;
  $("#break-minutes").value = state.settings.breakMinutes;
  $("#custom-wallpaper-url").value = state.settings.customWallpaper;
  document.body.classList.toggle("no-snow", !state.settings.snow);
  document.body.classList.toggle("no-lights", !state.settings.lights);
  document.body.classList.toggle("performance-mode", state.settings.performance);
  setWallpaper();
}

function renderWallpaperGrid() {
  const grid = $("#wallpaper-grid");
  grid.innerHTML = "";
  wallpapers.forEach((wallpaper) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wallpaper-option";
    button.dataset.wallpaper = wallpaper.id;
    button.style.backgroundImage = `linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.16)), url("${wallpaper.path}")`;
    button.innerHTML = `<span>${escapeHtml(wallpaper.name)}</span>`;
    button.addEventListener("click", () => {
      state.settings.wallpaper = wallpaper.id;
      state.settings.customWallpaper = "";
      saveState();
      renderSettings();
    });
    grid.append(button);
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function openLinkDialog(index = null) {
  const dialog = $("#link-dialog");
  $("#editing-index").value = index ?? "";
  $("#dialog-title").textContent = index === null ? "Add link" : "Edit link";
  $("#delete-link").style.display = index === null ? "none" : "inline-flex";
  const link = index === null ? { name: "", url: "" } : state.links[index];
  $("#link-name").value = link.name;
  $("#link-url").value = link.url;
  dialog.showModal();
}

function wireEvents() {
  $("#settings-open").addEventListener("click", () => $("#settings-dialog").showModal());
  $("#settings-close").addEventListener("click", () => $("#settings-dialog").close());
  $("#settings-save").addEventListener("click", () => $("#settings-dialog").close());

  $("#search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const query = $("#search-input").value.trim();
    if (!query) return;
    const looksLikeUrl = /^https?:\/\//i.test(query) || /^[\w-]+\.[\w.-]+/.test(query);
    const target = looksLikeUrl ? normalizeUrl(query) : `${searchEngines[state.settings.searchEngine].url}${encodeURIComponent(query)}`;
    window.location.href = target;
  });

  $("#add-link").addEventListener("click", () => openLinkDialog());
  $("#quick-links").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit-link]");
    const del = event.target.closest("[data-delete-link]");
    if (edit) openLinkDialog(Number(edit.dataset.editLink));
    if (del) {
      state.links.splice(Number(del.dataset.deleteLink), 1);
      saveState();
      renderLinks();
    }
  });
  $("#close-dialog").addEventListener("click", () => $("#link-dialog").close());
  $("#link-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const index = $("#editing-index").value;
    const link = { name: $("#link-name").value.trim(), url: normalizeUrl($("#link-url").value) };
    if (!link.name || !link.url) return;
    if (index === "") state.links.push(link);
    else state.links[Number(index)] = link;
    saveState();
    renderLinks();
    $("#link-dialog").close();
  });
  $("#delete-link").addEventListener("click", () => {
    const index = $("#editing-index").value;
    if (index !== "") state.links.splice(Number(index), 1);
    saveState();
    renderLinks();
    $("#link-dialog").close();
  });

  $("#todo-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#todo-input");
    const text = input.value.trim();
    if (!text) return;
    state.todos.unshift({ id: crypto.randomUUID(), text, done: false });
    input.value = "";
    saveState();
    renderTodos();
  });
  $("#todo-list").addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-toggle-task]");
    const focus = event.target.closest("[data-focus-task]");
    const del = event.target.closest("[data-delete-task]");
    if (toggle) {
      const task = state.todos.find((item) => item.id === toggle.dataset.toggleTask);
      if (task) task.done = toggle.checked;
      if (task?.done && state.currentTaskId === task.id) state.currentTaskId = null;
    }
    if (focus) state.currentTaskId = focus.dataset.focusTask;
    if (del) {
      const id = del.dataset.deleteTask;
      state.todos = state.todos.filter((item) => item.id !== id);
      if (state.currentTaskId === id) state.currentTaskId = null;
    }
    saveState();
    renderTodos();
  });
  $$(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.todoFilter = button.dataset.filter;
      $$(".filter-button").forEach((item) => item.classList.toggle("active", item === button));
      saveState();
      renderTodos();
    });
  });
  $("#clear-done").addEventListener("click", () => {
    state.todos = state.todos.filter((task) => !task.done);
    saveState();
    renderTodos();
  });

  $("#scratch-pad").addEventListener("input", (event) => {
    state.note = event.target.value;
    saveState();
  });
  $("#clear-note").addEventListener("click", () => {
    state.note = "";
    $("#scratch-pad").value = "";
    saveState();
  });

  $("#start-pause").addEventListener("click", startPauseTimer);
  $("#reset-timer").addEventListener("click", resetTimer);
  $$(".mode-tab").forEach((button) => button.addEventListener("click", () => setTimerMode(button.dataset.mode)));

  $("#search-engine").addEventListener("change", (event) => {
    state.settings.searchEngine = event.target.value;
    saveState();
    renderSettings();
  });
  $("#clock-seconds-toggle").addEventListener("change", (event) => {
    state.settings.clockSeconds = event.target.checked;
    saveState();
    renderClock();
  });
  $("#date-year-toggle").addEventListener("change", (event) => {
    state.settings.showYear = event.target.checked;
    saveState();
    renderClock();
  });
  $("#snow-toggle").addEventListener("change", (event) => {
    state.settings.snow = event.target.checked;
    saveState();
    renderSettings();
  });
  $("#lights-toggle").addEventListener("change", (event) => {
    state.settings.lights = event.target.checked;
    saveState();
    renderSettings();
  });
  $("#focus-minutes").addEventListener("change", (event) => {
    state.settings.focusMinutes = Math.max(1, Number(event.target.value) || 25);
    saveState();
    if (timer.mode === "focus") setTimerMode("focus");
  });
  $("#break-minutes").addEventListener("change", (event) => {
    state.settings.breakMinutes = Math.max(1, Number(event.target.value) || 5);
    saveState();
    if (timer.mode === "break") setTimerMode("break");
  });
  $("#custom-wallpaper-url").addEventListener("change", (event) => {
    state.settings.customWallpaper = event.target.value.trim();
    saveState();
    renderSettings();
  });
  $("#random-wallpaper").addEventListener("click", () => {
    const choice = wallpapers[Math.floor(Math.random() * wallpapers.length)];
    state.settings.wallpaper = choice.id;
    state.settings.customWallpaper = "";
    saveState();
    renderSettings();
  });
  $("#reset-settings").addEventListener("click", () => {
    state.settings = structuredClone(defaultState.settings);
    saveState();
    renderSettings();
    setTimerMode("focus");
  });
}

function initSnow() {
  const canvas = $("#snow-canvas");
  const ctx = canvas.getContext("2d");
  const flakeCount = window.innerWidth < 760 ? 24 : 42;
  const flakes = Array.from({ length: flakeCount }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.7 + 0.55,
    speed: Math.random() * 0.42 + 0.12,
    sway: Math.random() * 0.55 + 0.12,
    phase: Math.random() * 8
  }));
  let lastDraw = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw(now = 0) {
    requestAnimationFrame(draw);
    if (!state.settings.snow || document.hidden) return;
    if (now - lastDraw < 34) return;
    lastDraw = now;

    const w = window.innerWidth;
    const h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,.68)";

    for (const flake of flakes) {
      const x = flake.x * w + Math.sin(now / 1300 + flake.phase) * flake.sway * 14;
      const y = flake.y * h;
      ctx.beginPath();
      ctx.arc(x, y, flake.r, 0, Math.PI * 2);
      ctx.fill();
      flake.y += flake.speed / h;
      if (flake.y > 1.02) {
        flake.y = -0.02;
        flake.x = Math.random();
      }
    }
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  requestAnimationFrame(draw);
}

function init() {
  renderWallpaperGrid();
  renderSettings();
  renderLinks();
  renderTodos();
  $("#scratch-pad").value = state.note;
  $$(".filter-button").forEach((button) => button.classList.toggle("active", button.dataset.filter === state.todoFilter));
  setTimerMode("focus");
  renderClock();
  renderCountdown();
  wireEvents();
  initSnow();
  setInterval(renderClock, 1000);
  setInterval(renderCountdown, 60000);
}

init();
