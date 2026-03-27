/**
  Renderizado dinámico de la UI y manipulación del DOM.
 */

import { getAllTasks, getTasksByUser, getAllUsers, toggleTaskStatus, deleteTask } from './storage.js';
import { isAdmin, getSession } from './auth.js';

const taskList     = document.getElementById('task-list');
const filterSelect = document.getElementById('filter-user');

// ── Helpers ────────────────────────────────────────────────────────────────

function isOverdue(task) {
    const today = new Date().toISOString().split('T')[0];
    return task.status === 'pending' && task.due_date < today;
}

function getUsernameById(users, userId) {
    return users.find(u => u.id === userId)?.username ?? 'Desconocido';
}

function getBadge(task, overdue) {
    if (overdue)                      return '<span class="task-badge badge-overdue">Vencida</span>';
    if (task.status === 'completed')  return '<span class="task-badge badge-completed">Completada</span>';
    return '<span class="task-badge badge-pending">Pendiente</span>';
}

// ── Stats ──────────────────────────────────────────────────────────────────

/**
  Actualiza los contadores del panel de estadísticas.
 */
function updateStats(tasks) {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('stat-total').textContent   = tasks.length;
    document.getElementById('stat-pending').textContent = tasks.filter(t => t.status === 'pending' && t.due_date >= today).length;
    document.getElementById('stat-overdue').textContent = tasks.filter(t => t.status === 'pending' && t.due_date < today).length;
    document.getElementById('stat-done').textContent    = tasks.filter(t => t.status === 'completed').length;
}

// ── Renderizado ────────────────────────────────────────────────────────────

/**
  Renderiza la grid de tarjetas de tareas.
 */
function renderTasks() {
    const session = getSession();
    const users   = getAllUsers();

    const tasks = isAdmin()
        ? getAllTasks()
        : getTasksByUser(session.id);

    const filterValue = filterSelect?.value;
    const filtered = (isAdmin() && filterValue && filterValue !== 'all')
        ? tasks.filter(t => t.user_id === parseInt(filterValue, 10))
        : tasks;

    updateStats(filtered);
    taskList.innerHTML = '';

    if (filtered.length === 0) {
        taskList.innerHTML = '<li class="empty-msg">No hay tareas para mostrar.</li>';
        return;
    }

    filtered.forEach(task => {
        const overdue  = isOverdue(task);
        const username = getUsernameById(users, task.user_id);
        const li = document.createElement('li');

        li.className = [
            'task-item',
            `task--${task.status}`,
            overdue ? 'task--overdue' : '',
        ].join(' ').trim();

        li.dataset.id = task.id;

        li.innerHTML = `
            <div class="task-card-head">
                <span class="task-title">${task.title}</span>
                ${getBadge(task, overdue)}
            </div>
            <div class="task-meta">
                <span><span class="date-label date-label--created">Creada</span>${task.created_at}</span>
                <span><span class="date-label date-label--due">Vence</span>${task.due_date}</span>
                ${isAdmin() ? `
                <div class="task-assigned">
                    <span class="assigned-avatar">${username.charAt(0)}</span>
                    ${username}
                </div>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn-toggle" data-id="${task.id}">
                    ${task.status === 'pending' ? '✓ Completar' : '↩ Reabrir'}
                </button>
                <button class="btn-delete" data-id="${task.id}">✕</button>
            </div>
        `;

        taskList.appendChild(li);
    });
}

/**
  Puebla el select de filtro por usuario (solo admin).
 */
function renderUserFilter() {
    if (!isAdmin() || !filterSelect) return;

    const users = getAllUsers();
    filterSelect.innerHTML = '<option value="all">Todos los usuarios</option>';
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

// ── Vista de Usuarios ──────────────────────────────────────────────────────

/**
  Renderiza la grid de tarjetas de usuarios con sus stats de tareas.
 */
function renderUsers() {
    const userList = document.getElementById('user-list');
    const users    = getAllUsers();
    const tasks    = getAllTasks();
    const today    = new Date().toISOString().split('T')[0];

    userList.innerHTML = '';

    users.forEach(u => {
        const userTasks   = tasks.filter(t => t.user_id === u.id);
        const pending     = userTasks.filter(t => t.status === 'pending' && t.due_date >= today).length;
        const overdue     = userTasks.filter(t => t.status === 'pending' && t.due_date < today).length;
        const completed   = userTasks.filter(t => t.status === 'completed').length;

        const li = document.createElement('li');
        li.className = 'user-card';
        li.innerHTML = `
            <div class="user-card-head">
                <div class="user-card-avatar ${u.role === 'admin' ? 'role-admin' : ''}">
                    ${u.username.charAt(0)}
                </div>
                <div class="user-card-info">
                    <span class="user-card-name">${u.username}</span>
                    <span class="user-card-role ${u.role === 'admin' ? 'role-badge-admin' : 'role-badge-user'}">
                        ${u.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </span>
                </div>
            </div>
            <div class="user-card-stats">
                <div class="user-stat stat-pending">
                    <span class="user-stat-value">${pending}</span>
                    <span class="user-stat-label">Pendientes</span>
                </div>
                <div class="user-stat stat-overdue">
                    <span class="user-stat-value">${overdue}</span>
                    <span class="user-stat-label">Vencidas</span>
                </div>
                <div class="user-stat stat-done">
                    <span class="user-stat-value">${completed}</span>
                    <span class="user-stat-label">Completadas</span>
                </div>
            </div>
        `;

        userList.appendChild(li);
    });
}

export { renderTasks, renderUserFilter, renderUsers };
