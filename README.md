# Interactive Task Manager

A feature-rich task management app built with vanilla JavaScript. Includes task CRUD, filtering, drag-and-drop reordering, dark/light theme, localStorage persistence, and backup/import.

## Features
- Add, edit, delete tasks
- Mark tasks complete/incomplete
- Filter (All, Active, Completed) and search
- Due dates and priority badges
- Drag and drop to reorder
- LocalStorage persistence
- Export/Import JSON backup
- Dark/Light mode toggle
- Quick stats (total/active/completed)

## Getting Started
1. Open `index.html` in your browser.
2. Add a task, pick an optional due date and priority, and submit.
3. Click checkbox to complete, ✏️ to edit, 🗑️ to delete.
4. Drag tasks to reorder; filters and search update instantly.
5. Toggle theme via header button; state and tasks are saved locally.

## Keyboard Shortcuts
- `N` focuses the task input.
- `/` focuses search.
- Enter submits the form when the task field is focused.

## Project Structure
```
week2-task-manager/
├── index.html
├── css/
│   ├── style.css
│   └── theme.css
├── js/
│   ├── app.js
│   ├── storage.js
│   ├── ui.js
│   └── utils.js
├── README.md
└── .gitignore
```

