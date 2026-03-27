/**
  Manejo de sesión, login y validación de roles.
 */

import { findUserByCredentials } from './storage.js';

const SESSION_KEY = 'tm_session';

// ── Sesión ─────────────────────────────────────────────────────────────────

/**
  Retorna el usuario actualmente en sesión o null si no hay sesión activa.
 */
function getSession() {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
}

/**
  Inicia sesión con las credenciales dadas.
  @returns {object} el usuario autenticado.
  @throws {Error} si las credenciales son incorrectas.
 */
function login(username, password) {
    const user = findUserByCredentials(username, password);
    if (!user) throw new Error('Usuario o contraseña incorrectos.');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
}

/**
  Cierra la sesión activa y recarga la app.
 */
function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
}

// ── Roles ──────────────────────────────────────────────────────────────────

/**
  Retorna true si el usuario en sesión es administrador.
 */
function isAdmin() {
    return getSession()?.role === 'admin';
}

/**
  Verifica que haya una sesión activa.
  Si no la hay, recarga la página para volver al login.
 */
function requireAuth() {
    if (!getSession()) window.location.reload();
}

export { getSession, login, logout, isAdmin, requireAuth };
