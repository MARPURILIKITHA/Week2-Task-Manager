export function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function reorderById(list, fromId, toId) {
  const copy = [...list];
  const fromIndex = copy.findIndex((t) => t.id === fromId);
  if (fromIndex === -1) return list;
  const [item] = copy.splice(fromIndex, 1);

  if (!toId) {
    copy.push(item);
    return copy;
  }

  const toIndex = copy.findIndex((t) => t.id === toId);
  if (toIndex === -1) {
    copy.push(item);
    return copy;
  }

  copy.splice(toIndex, 0, item);
  return copy;
}

