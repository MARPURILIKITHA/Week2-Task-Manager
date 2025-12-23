const TASKS_KEY = "tm_tasks";
const THEME_KEY = "tm_theme";

export function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((task, idx) => ({
      id: task.id ?? `id-${idx}`,
      title: task.title ?? "Untitled task",
      completed: Boolean(task.completed),
      dueDate: task.dueDate ?? null,
      priority: task.priority ?? "medium",
      createdAt: task.createdAt ?? Date.now(),
      order: typeof task.order === "number" ? task.order : idx,
    }));
  } catch (err) {
    console.error("Failed to load tasks", err);
    return [];
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error("Failed to save tasks", err);
  }
}

export function loadTheme() {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

export function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function exportTasks(tasks) {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

