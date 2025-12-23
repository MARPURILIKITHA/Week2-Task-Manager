import { loadTasks, saveTasks, loadTheme, saveTheme, exportTasks } from "./storage.js";
import { renderTasks, updateStats, setFilterActive, applyTheme } from "./ui.js";
import { createId, reorderById } from "./utils.js";

const state = {
  tasks: [],
  filter: "all",
  search: "",
  theme: "light",
};

const els = {
  form: document.getElementById("taskForm"),
  taskInput: document.getElementById("taskInput"),
  dueInput: document.getElementById("dueInput"),
  priority: document.getElementById("prioritySelect"),
  list: document.getElementById("taskList"),
  empty: document.getElementById("emptyState"),
  filters: Array.from(document.querySelectorAll(".filter-button")),
  search: document.getElementById("searchInput"),
  stats: {
    totalEl: document.getElementById("totalCount"),
    activeEl: document.getElementById("activeCount"),
    completedEl: document.getElementById("completedCount"),
  },
  clearCompleted: document.getElementById("clearCompleted"),
  themeToggle: document.getElementById("themeToggle"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
};

function init() {
  state.tasks = loadTasks();
  state.theme = loadTheme();
  applyTheme(state.theme);
  updateThemeButton();
  render();
  bindEvents();
}

function bindEvents() {
  els.form.addEventListener("submit", handleSubmit);
  els.list.addEventListener("click", handleListClick);
  els.list.addEventListener("dblclick", handleListDblClick);
  els.list.addEventListener("dragstart", handleDragStart);
  els.list.addEventListener("dragover", handleDragOver);
  els.list.addEventListener("drop", handleDrop);
  els.list.addEventListener("dragend", handleDragEnd);

  els.filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      state.filter = btn.dataset.filter;
      setFilterActive(els.filters, state.filter);
      render();
    })
  );

  els.search.addEventListener("input", (e) => {
    state.search = e.target.value.toLowerCase();
    render();
  });

  els.clearCompleted.addEventListener("click", () => {
    state.tasks = state.tasks.filter((t) => !t.completed);
    persist();
    render();
  });

  els.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    applyTheme(state.theme);
    saveTheme(state.theme);
    updateThemeButton();
  });

  els.exportBtn.addEventListener("click", () => exportTasks(state.tasks));
  els.importInput.addEventListener("change", handleImport);

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== els.search) {
      e.preventDefault();
      els.search.focus();
    }
    if ((e.key === "n" || e.key === "N") && document.activeElement !== els.taskInput) {
      els.taskInput.focus();
    }
  });
}

function handleSubmit(e) {
  e.preventDefault();
  const title = els.taskInput.value.trim();
  if (!title) return;

  const task = {
    id: createId(),
    title,
    completed: false,
    dueDate: els.dueInput.value || null,
    priority: els.priority.value || "medium",
    createdAt: Date.now(),
    order: state.tasks.length ? Math.max(...state.tasks.map((t) => t.order ?? 0)) + 1 : 0,
  };

  state.tasks.push(task);
  els.form.reset();
  persist();
  render();
}

function handleListClick(e) {
  const item = e.target.closest(".task-item");
  if (!item) return;
  const id = item.dataset.id;

  if (e.target.classList.contains("toggle")) {
    toggleComplete(id, e.target.checked);
  }

  if (e.target.classList.contains("delete")) {
    deleteTask(id);
  }

  if (e.target.classList.contains("edit")) {
    promptEdit(id);
  }
}

function handleListDblClick(e) {
  const item = e.target.closest(".task-item");
  if (!item) return;
  if (!e.target.classList.contains("task-title")) return;
  promptEdit(item.dataset.id);
}

function toggleComplete(id, isComplete) {
  state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, completed: isComplete } : t));
  persist();
  render();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  persist();
  render();
}

function promptEdit(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  const nextTitle = prompt("Edit task", task.title);
  if (!nextTitle) return;
  const trimmed = nextTitle.trim();
  if (!trimmed) return;
  state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, title: trimmed } : t));
  persist();
  render();
}

function handleDragStart(e) {
  const item = e.target.closest(".task-item");
  if (!item) return;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", item.dataset.id);
  item.classList.add("dragging");
}

function handleDragOver(e) {
  e.preventDefault();
  const overItem = e.target.closest(".task-item");
  if (!overItem) return;
  const dragging = els.list.querySelector(".dragging");
  if (!dragging || dragging === overItem) return;
  const bounding = overItem.getBoundingClientRect();
  const offset = e.clientY - bounding.top;
  const shouldInsertBefore = offset < bounding.height / 2;
  els.list.insertBefore(dragging, shouldInsertBefore ? overItem : overItem.nextSibling);
}

function handleDrop(e) {
  e.preventDefault();
  const dragging = els.list.querySelector(".dragging");
  if (dragging) dragging.classList.remove("dragging");

  const fromId = e.dataTransfer.getData("text/plain");
  const overItem = e.target.closest(".task-item");
  const toId = overItem ? overItem.dataset.id : null;
  if (!fromId || fromId === toId) return;

  state.tasks = reorderById(state.tasks, fromId, toId);
  // normalize order
  state.tasks = state.tasks.map((t, idx) => ({ ...t, order: idx }));
  persist();
  render();
}

function handleDragEnd() {
  const dragging = els.list.querySelector(".dragging");
  if (dragging) dragging.classList.remove("dragging");
}

function handleImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed)) throw new Error("Invalid file");
      state.tasks = parsed.map((t, idx) => ({
        id: t.id ?? createId(),
        title: t.title ?? "Untitled task",
        completed: Boolean(t.completed),
        dueDate: t.dueDate ?? null,
        priority: t.priority ?? "medium",
        createdAt: t.createdAt ?? Date.now(),
        order: typeof t.order === "number" ? t.order : idx,
      }));
      persist();
      render();
    } catch (err) {
      alert("Could not import tasks: " + err.message);
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
}

function getVisibleTasks() {
  return state.tasks
    .filter((task) => {
      if (state.filter === "active" && task.completed) return false;
      if (state.filter === "completed" && !task.completed) return false;
      if (state.search && !task.title.toLowerCase().includes(state.search)) return false;
      return true;
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function render() {
  const visible = getVisibleTasks();
  renderTasks(els.list, visible);
  updateStats(els.stats, state.tasks);
  els.empty.style.display = state.tasks.length ? "none" : "block";
  setFilterActive(els.filters, state.filter);
}

function persist() {
  saveTasks(state.tasks);
}

function updateThemeButton() {
  const next = state.theme === "light" ? "🌙 Dark" : "☀️ Light";
  els.themeToggle.textContent = next;
}

init();

