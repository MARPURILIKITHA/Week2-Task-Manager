function renderTasks(listEl, tasks) {
  listEl.innerHTML = "";
  const fragment = document.createDocumentFragment();

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.dataset.id = task.id;
    li.draggable = true;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "toggle";
    checkbox.checked = task.completed;
    checkbox.title = "Mark complete";

    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("p");
    title.className = "task-title" + (task.completed ? " completed" : "");
    title.textContent = task.title;
    title.title = "Double-click to edit or click details button";

    const meta = document.createElement("div");
    meta.className = "meta";

    const priority = document.createElement("span");
    priority.className = `badge ${task.priority}`;
    priority.textContent = `Priority: ${task.priority}`;

    const due = document.createElement("span");
    due.className = "badge";
    const fmt = window.utils && window.utils.formatDate ? window.utils.formatDate : () => "No due date";
    due.textContent = `Due: ${fmt(task.dueDate)}`;

    const created = document.createElement("span");
    created.className = "badge";
    created.textContent = new Date(task.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    meta.append(priority, due, created);

    content.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-button edit";
    editBtn.title = "Edit task";
    editBtn.textContent = "✏️";

    const delBtn = document.createElement("button");
    delBtn.className = "icon-button danger delete";
    delBtn.title = "Delete task";
    delBtn.textContent = "🗑️";

    const detailsBtn = document.createElement("button");
    detailsBtn.className = "icon-button details";
    detailsBtn.title = "View details";
    detailsBtn.textContent = "ℹ️";

    actions.append(detailsBtn, editBtn, delBtn);
    li.append(checkbox, content, actions);
    fragment.appendChild(li);
  });

  listEl.appendChild(fragment);
}

function updateStats({ totalEl, activeEl, completedEl }, tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;
  totalEl.textContent = `${total} total`;
  activeEl.textContent = `${active} active`;
  completedEl.textContent = `${completed} completed`;
}

function setFilterActive(buttons, filter) {
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

function applyTheme(theme) {
  document.body.classList.remove("theme-light", "theme-dark");
  document.body.classList.add(`theme-${theme}`);
}

window.ui = {
  renderTasks,
  updateStats,
  setFilterActive,
  applyTheme,
};

