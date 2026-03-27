/**
  Punto de entrada principal. Inicializa la aplicación.
 */

import { initStorage, createTask, createUser, getAllUsers } from './storage.js';
import { getSession, login, logout, isAdmin } from './auth.js';
import { renderTasks, renderUserFilter } from './dom.js';

initStorage();

const loginView     = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm     = document.getElementById('login-form');
const loginError    = document.getElementById('login-error');
const logoutBtn     = document.getElementById('logout-btn');
const userLabel     = document.getElementById('current-user-label');
const filterSection = document.getElementById('filter-section');
const taskForm      = document.getElementById('task-form');
const taskError     = document.getElementById('task-error');
const userForm      = document.getElementById('user-form');
const userError     = document.getElementById('user-error');

// ── Helpers ────────────────────────────────────────────────────────────────

function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
}

function clearError(el) {
    el.textContent = '';
    el.classList.add('hidden');
}

/**
  Puebla el select de asignación de tareas con todos los usuarios (solo admin).
 */
function populateAssignSelect() {
    if (!isAdmin()) return;
    const select = document.getElementById('task-assign-user');
    const users  = getAllUsers();
    select.innerHTML = '';
    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.username;
        select.appendChild(opt);
    });
}

// ── Vista ──────────────────────────────────────────────────────────────────

function showDashboard(user) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userLabel.textContent = `${user.username} (${user.role})`;

    if (isAdmin()) {
        filterSection.classList.remove('hidden');
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        populateAssignSelect();
    }

    // Bloquear fechas anteriores a hoy en el formulario de tarea
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-due-date').min = today;

    renderUserFilter();
    renderTasks();
}

function showLogin() {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
}

// ── Eventos: Login / Logout ────────────────────────────────────────────────

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    try {
        const user = login(username, password);
        clearError(loginError);
        showDashboard(user);
    } catch (err) {
        showError(loginError, err.message);
    }
});

logoutBtn.addEventListener('click', logout);

// ── Eventos: Formulario de Tareas ──────────────────────────────────────────

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title    = document.getElementById('task-title').value.trim();
    const due_date = document.getElementById('task-due-date').value;

    // Admin puede asignar a cualquier usuario; usuario normal se asigna a sí mismo
    const user_id = isAdmin()
        ? parseInt(document.getElementById('task-assign-user').value, 10)
        : getSession().id;

    try {
        createTask({ title, due_date, user_id });
        clearError(taskError);
        taskForm.reset();
        document.getElementById('task-due-date').min = new Date().toISOString().split('T')[0];
        renderTasks();
    } catch (err) {
        showError(taskError, err.message);
    }
});

// ── Eventos: Formulario de Usuarios (solo admin) ───────────────────────────

userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const role     = document.getElementById('new-role').value;

    if (username.length < 3) {
        showError(userError, 'El nombre de usuario debe tener al menos 3 caracteres.');
        return;
    }
    if (password.length < 6) {
        showError(userError, 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    try {
        createUser({ username, password, role });
        clearError(userError);
        userForm.reset();
        // Actualizar selects que dependen de la lista de usuarios
        populateAssignSelect();
        renderUserFilter();
    } catch (err) {
        showError(userError, err.message);
    }
});

// ── Arranque ───────────────────────────────────────────────────────────────

const session = getSession();
session ? showDashboard(session) : showLogin();
