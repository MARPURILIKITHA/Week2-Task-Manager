const storage = window.storage || {
  loadTasks: () => [],
  saveTasks: () => {},
  loadTheme: () => "light",
  saveTheme: () => {},
  exportTasks: () => {},
};

const ui = window.ui || {
  renderTasks: () => {},
  updateStats: () => {},
  setFilterActive: () => {},
  applyTheme: (t) => document.body.classList.add(`theme-${t}`),
};

const utils = window.utils || {
  createId: () => `id-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  reorderById: (list) => list,
  debounce: (fn) => fn,
};

const state = {
  tasks: [],
  filter: "all",
  sort: "manual",
  search: "",
  theme: "light",
  currentModalTaskId: null,
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
  sort: document.getElementById("sortSelect"),
  stats: {
    totalEl: document.getElementById("totalCount"),
    activeEl: document.getElementById("activeCount"),
    completedEl: document.getElementById("completedCount"),
  },
  clearCompleted: document.getElementById("clearCompleted"),
  themeToggle: document.getElementById("themeToggle"),
  exportBtn: document.getElementById("exportBtn"),
  importInput: document.getElementById("importInput"),
  // modal
  modal: document.getElementById("taskModal"),
  closeModalBtn: document.getElementById("closeModal"),
  modalForm: document.getElementById("modalForm"),
  modalTitle: document.getElementById("modalTitle"),
  modalDueDate: document.getElementById("modalDueDate"),
  modalPriority: document.getElementById("modalPriority"),
  modalCompleted: document.getElementById("modalCompleted"),
  deleteModalBtn: document.getElementById("deleteModalBtn"),
  cancelModalBtn: document.getElementById("cancelModal"),
};

function init() {
  state.tasks = storage.loadTasks();
  state.theme = storage.loadTheme();
  ui.applyTheme(state.theme);
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
      ui.setFilterActive(els.filters, state.filter);
      render();
    })
  );

  if (els.sort) {
    els.sort.addEventListener("change", (e) => {
      state.sort = e.target.value;
      render();
    });
  }

  els.search.addEventListener("input", utils.debounce((e) => {
    state.search = e.target.value.toLowerCase();
    render();
  }, 300));

  els.clearCompleted.addEventListener("click", () => {
    state.tasks = state.tasks.filter((t) => !t.completed);
    persist();
    render();
  });

  els.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "light" ? "dark" : "light";
    ui.applyTheme(state.theme);
    storage.saveTheme(state.theme);
    updateThemeButton();
  });

  els.exportBtn.addEventListener("click", () => storage.exportTasks(state.tasks));
  els.importInput.addEventListener("change", handleImport);

  // Modal handlers
  if (els.closeModalBtn) els.closeModalBtn.addEventListener("click", closeModal);
  if (els.cancelModalBtn) els.cancelModalBtn.addEventListener("click", closeModal);
  if (els.modalForm) els.modalForm.addEventListener("submit", handleModalSave);
  if (els.deleteModalBtn) els.deleteModalBtn.addEventListener("click", handleModalDelete);
  if (els.modal) {
    els.modal.addEventListener("click", (e) => {
      if (e.target === els.modal) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      els.modal &&
      (els.modal.open || els.modal.getAttribute && els.modal.getAttribute("data-open") === "true")
    )
      closeModal();
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
    id: utils.createId(),
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

  if (e.target.classList.contains("edit") || e.target.classList.contains("details")) {
    openModal(id);
  }
}

function handleListDblClick(e) {
  const item = e.target.closest(".task-item");
  if (!item) return;
  if (!e.target.classList.contains("task-title")) return;
  openModal(item.dataset.id);
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

  state.tasks = utils.reorderById(state.tasks, fromId, toId);
  // normalize order
  state.tasks = state.tasks.map((t, idx) => ({ ...t, order: idx }));
  persist();
  render();
}

function handleDragEnd() {
  const dragging = els.list.querySelector(".dragging");
  if (dragging) dragging.classList.remove("dragging");
}

function openModal(taskId) {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task || !els.modal) return;

  state.currentModalTaskId = taskId;
  if (els.modalTitle) els.modalTitle.value = task.title;
  if (els.modalDueDate) els.modalDueDate.value = task.dueDate || "";
  if (els.modalPriority) els.modalPriority.value = task.priority || "medium";
  if (els.modalCompleted) els.modalCompleted.checked = task.completed;

  if (typeof els.modal.showModal === "function") {
    els.modal.showModal();
  } else {
    els.modal.setAttribute("data-open", "true");
    els.modal.style.display = "block";
  }
}

function closeModal() {
  if (els.modal) {
    if (typeof els.modal.close === "function") els.modal.close();
    else {
      els.modal.removeAttribute("data-open");
      els.modal.style.display = "none";
    }
  }
  state.currentModalTaskId = null;
}

function handleModalSave(e) {
  e.preventDefault();
  const taskId = state.currentModalTaskId;
  if (!taskId) return;

  const newTitle = els.modalTitle?.value.trim();
  if (!newTitle) {
    alert("Task title cannot be empty");
    return;
  }

  state.tasks = state.tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          title: newTitle,
          dueDate: els.modalDueDate?.value || null,
          priority: els.modalPriority?.value || "medium",
          completed: els.modalCompleted?.checked || false,
        }
      : t
  );

  persist();
  closeModal();
  render();
}

function handleModalDelete() {
  const taskId = state.currentModalTaskId;
  if (!taskId || !confirm("Delete this task?")) return;
  deleteTask(taskId);
  closeModal();
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
        id: t.id ?? utils.createId(),
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
  const filtered = state.tasks.filter((task) => {
    if (state.filter === "active" && task.completed) return false;
    if (state.filter === "completed" && !task.completed) return false;
    if (state.search && !task.title.toLowerCase().includes(state.search)) return false;
    if (state.tagFilter && !task.tags?.includes(state.tagFilter)) return false;
    return true;
  });

  // sorting
  if (state.sort === "newest") {
    return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  if (state.sort === "oldest") {
    return filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  }

  if (state.sort === "duedate") {
    return filtered.sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aTime === bTime) return (a.order ?? 0) - (b.order ?? 0);
      return aTime - bTime;
    });
  }

  if (state.sort === "priority") {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return filtered.sort((a, b) => {
      const aPri = priorityOrder[a.priority] ?? 1;
      const bPri = priorityOrder[b.priority] ?? 1;
      if (aPri === bPri) return (a.order ?? 0) - (b.order ?? 0);
      return aPri - bPri;
    });
  }

  // default/manual: preserve custom order
  return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function render() {
  const visible = getVisibleTasks();
  ui.renderTasks(els.list, visible);
  ui.updateStats(els.stats, state.tasks);
  els.empty.style.display = state.tasks.length ? "none" : "block";
  ui.setFilterActive(els.filters, state.filter);
}

function persist() {
  storage.saveTasks(state.tasks);
}

function updateThemeButton() {
  const next = state.theme === "light" ? "🌙 Dark" : "☀️ Light";
  els.themeToggle.textContent = next;
}

init();

