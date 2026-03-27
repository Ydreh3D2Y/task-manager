/**
  Renderizado dinámico de la UI y manipulación del DOM.
 */

import { getAllTasks, getTasksByUser, getAllUsers, toggleTaskStatus, deleteTask } from './storage.js';
import { isAdmin, getSession } from './auth.js';

const taskList    = document.getElementById('task-list');
const filterSelect = document.getElementById('filter-user');

// ── Helpers ────────────────────────────────────────────────────────────────

/**
  Retorna true si una tarea está vencida (pendiente y due_date < hoy).
 */
function isOverdue(task) {
    const today = new Date().toISOString().split('T')[0];
    return task.status === 'pending' && task.due_date < today;
}

/**
  Dado un user_id, retorna el username. Fallback a 'Desconocido'.
 */
function getUsernameById(users, userId) {
    return users.find(u => u.id === userId)?.username ?? 'Desconocido';
}

// ── Renderizado ────────────────────────────────────────────────────────────

/**
  Renderiza la lista de tareas en el DOM.
  Aplica clase 'overdue' a las tareas vencidas para diferenciación visual.
 */
function renderTasks() {
    const session = getSession();
    const users   = getAllUsers();

    const tasks = isAdmin()
        ? getAllTasks()
        : getTasksByUser(session.id);

    // Si admin tiene filtro activo por usuario
    const filterValue = filterSelect?.value;
    const filtered = (isAdmin() && filterValue && filterValue !== 'all')
        ? tasks.filter(t => t.user_id === parseInt(filterValue, 10))
        : tasks;

    taskList.innerHTML = '';

    if (filtered.length === 0) {
        taskList.innerHTML = '<li class="empty-msg">No hay tareas para mostrar.</li>';
        return;
    }

    filtered.forEach(task => {
        const overdue = isOverdue(task);
        const li = document.createElement('li');
        li.className = [
            'task-item',
            `task--${task.status}`,
            overdue ? 'task--overdue' : '',
        ].join(' ').trim();

        li.dataset.id = task.id;

        li.innerHTML = `
            <div class="task-info">
                <span class="task-title">${task.title}</span>
                <span class="task-meta">
                    Vence: ${task.due_date}
                    ${isAdmin() ? `· ${getUsernameById(users, task.user_id)}` : ''}
                    ${overdue ? '<span class="badge-overdue">VENCIDA</span>' : ''}
                </span>
            </div>
            <div class="task-actions">
                <button class="btn-toggle" data-id="${task.id}">
                    ${task.status === 'pending' ? 'Completar' : 'Reabrir'}
                </button>
                <button class="btn-delete" data-id="${task.id}">Eliminar</button>
            </div>
        `;

        taskList.appendChild(li);
    });
}

/**
  Puebla el select de filtro por usuario (solo visible para admin).
 */
function renderUserFilter() {
    if (!isAdmin() || !filterSelect) return;

    const users = getAllUsers();
    filterSelect.innerHTML = '<option value="all">Todos</option>';
    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.username;
        filterSelect.appendChild(opt);
    });

    filterSelect.addEventListener('change', renderTasks);
}

// ── Eventos delegados ──────────────────────────────────────────────────────

taskList.addEventListener('click', (e) => {
    const id = parseInt(e.target.dataset.id, 10);
    if (!id) return;

    if (e.target.classList.contains('btn-toggle')) {
        toggleTaskStatus(id);
        renderTasks();
    }

    if (e.target.classList.contains('btn-delete')) {
        deleteTask(id);
        renderTasks();
    }
});

export { renderTasks, renderUserFilter };
