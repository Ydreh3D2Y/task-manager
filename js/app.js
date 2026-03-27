/**
  Punto de entrada principal. Inicializa la aplicación.
 */

import { initStorage, createTask, createUser, getAllUsers } from './storage.js';
import { getSession, login, logout, isAdmin } from './auth.js';
import { renderTasks, renderUserFilter, renderUsers } from './dom.js';

initStorage();

// ── Referencias DOM ────────────────────────────────────────────────────────

const loginView      = document.getElementById('login-view');
const dashboardView  = document.getElementById('dashboard-view');
const loginForm      = document.getElementById('login-form');
const loginError     = document.getElementById('login-error');
const logoutBtn      = document.getElementById('logout-btn');
const userMenu       = document.getElementById('user-menu');
const userAvatar     = document.getElementById('user-avatar');
const userDropdown   = document.getElementById('user-dropdown');
const userLabel      = document.getElementById('current-user-label');
const userRoleLabel  = document.getElementById('current-user-role');
const filterSection  = document.getElementById('filter-section');
const panelTitle     = document.getElementById('panel-title');
const panelSubtitle  = document.getElementById('panel-subtitle');
const taskForm       = document.getElementById('task-form');
const taskError      = document.getElementById('task-error');
const userForm       = document.getElementById('user-form');
const userError      = document.getElementById('user-error');
const modalTask      = document.getElementById('modal-task');
const modalUser      = document.getElementById('modal-user');
const btnNewTask     = document.getElementById('btn-new-task');
const sidebar        = document.getElementById('sidebar');
const sidebarToggle  = document.getElementById('sidebar-toggle');
const viewTasks      = document.getElementById('view-tasks');
const viewUsers      = document.getElementById('view-users');
const navMyTasks     = document.getElementById('nav-my-tasks');
const navAllTasks    = document.getElementById('nav-all-tasks');
const navUsers       = document.getElementById('nav-users');

// ── Helpers ────────────────────────────────────────────────────────────────

function showError(el, msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
}

function clearError(el) {
    el.textContent = '';
    el.classList.add('hidden');
}

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

// ── Modales ────────────────────────────────────────────────────────────────

function openModal(modal)  { modal.classList.remove('hidden'); }
function closeModal(modal) { modal.classList.add('hidden'); }

btnNewTask.addEventListener('click', () => openModal(modalTask));
document.getElementById('modal-task-close').addEventListener('click', () => closeModal(modalTask));
document.getElementById('modal-user-close').addEventListener('click', () => closeModal(modalUser));

// Cerrar modal al hacer click fuera
[modalTask, modalUser].forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(m); });
});


// ── Vista ──────────────────────────────────────────────────────────────────

function showDashboard(user) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');

    userAvatar.textContent  = user.username.charAt(0);
    userLabel.textContent   = user.username;
    userRoleLabel.textContent = user.role === 'admin' ? 'Administrador' : 'Usuario';

    if (isAdmin()) {
        panelTitle.textContent    = 'Panel General: Gestión Global de Tareas';
        panelSubtitle.textContent = 'Visualiza y administra las tareas de todos los usuarios.';
        filterSection.classList.remove('hidden');
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        // Admin no tiene "Mis Tareas", su vista inicial es "Todas las Tareas"
        navMyTasks.classList.add('hidden');
        navAllTasks.classList.add('active');
        populateAssignSelect();
    } else {
        panelTitle.textContent    = 'Panel de Control: Mis Tareas';
        panelSubtitle.textContent = `Bienvenido, ${user.username}. Aquí están tus tareas asignadas.`;
    }

    document.getElementById('task-due-date').min = new Date().toISOString().split('T')[0];
    renderUserFilter();
    renderTasks();
}

function showLogin() {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
}

// ── Toggle sidebar ─────────────────────────────────────────────────────────

const SIDEBAR_KEY = 'tm_sidebar_collapsed';

// Restaurar estado previo al cargar
if (localStorage.getItem(SIDEBAR_KEY) === 'true') {
    sidebar.classList.add('sidebar--collapsed');
}

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar--collapsed');
    localStorage.setItem(SIDEBAR_KEY, sidebar.classList.contains('sidebar--collapsed'));
});

// ── Navegación entre vistas ────────────────────────────────────────────────

function showView(view) {
    viewTasks.classList.add('hidden');
    viewUsers.classList.add('hidden');
    view.classList.remove('hidden');

    // Actualizar nav item activo
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
}

navMyTasks?.addEventListener('click', (e) => {
    e.preventDefault();
    showView(viewTasks);
    navMyTasks.classList.add('active');
    renderTasks();
});

navAllTasks?.addEventListener('click', (e) => {
    e.preventDefault();
    showView(viewTasks);
    navAllTasks.classList.add('active');
    renderTasks();
});

navUsers?.addEventListener('click', (e) => {
    e.preventDefault();
    showView(viewUsers);
    navUsers.classList.add('active');
    renderUsers();
});

document.getElementById('btn-new-user')?.addEventListener('click', () => openModal(modalUser));

// ── Avatar dropdown ────────────────────────────────────────────────────────

userMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
});

document.addEventListener('click', () => userDropdown.classList.add('hidden'));
logoutBtn.addEventListener('click', logout);

// ── Formulario: Login ──────────────────────────────────────────────────────

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

// ── Formulario: Nueva Tarea ────────────────────────────────────────────────

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title    = document.getElementById('task-title').value.trim();
    const due_date = document.getElementById('task-due-date').value;
    const user_id  = isAdmin()
        ? parseInt(document.getElementById('task-assign-user').value, 10)
        : getSession().id;

    try {
        createTask({ title, due_date, user_id });
        clearError(taskError);
        taskForm.reset();
        document.getElementById('task-due-date').min = new Date().toISOString().split('T')[0];
        closeModal(modalTask);
        renderTasks();
    } catch (err) {
        showError(taskError, err.message);
    }
});

// ── Formulario: Nuevo Usuario ──────────────────────────────────────────────

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
        closeModal(modalUser);
        populateAssignSelect();
        renderUserFilter();
    } catch (err) {
        showError(userError, err.message);
    }
});

// ── Arranque ───────────────────────────────────────────────────────────────

const session = getSession();
session ? showDashboard(session) : showLogin();
