/**
  Punto de entrada principal. Inicializa la aplicación.
 */

import { initStorage } from './storage.js';
import { getSession, login, logout } from './auth.js';

initStorage();

const loginView     = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm     = document.getElementById('login-form');
const loginError    = document.getElementById('login-error');
const logoutBtn     = document.getElementById('logout-btn');
const userLabel     = document.getElementById('current-user-label');

function showDashboard(user) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userLabel.textContent = `${user.username} (${user.role})`;
}

function showLogin() {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
}

// ── Eventos ────────────────────────────────────────────────────────────────

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    try {
        const user = login(username, password);
        loginError.classList.add('hidden');
        showDashboard(user);
    } catch (err) {
        loginError.textContent = err.message;
        loginError.classList.remove('hidden');
    }
});

logoutBtn.addEventListener('click', logout);

// ── Arranque ───────────────────────────────────────────────────────────────

const session = getSession();
session ? showDashboard(session) : showLogin();
