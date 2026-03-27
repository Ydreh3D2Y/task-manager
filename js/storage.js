/*
  Capa de persistencia usando localStorage.
 */

const KEYS = {
    USERS: 'tm_users',
    TASKS: 'tm_tasks',
    NEXT_USER_ID: 'tm_next_user_id',
    NEXT_TASK_ID: 'tm_next_task_id',
};

// ── Datos semilla (igual que schema.sql) ──────────────────────────────────

const SEED_USERS = [
    { id: 1, username: 'admin',  password: 'admin123',  role: 'admin' },
    { id: 2, username: 'maria',  password: 'maria123',  role: 'user'  },
    { id: 3, username: 'carlos', password: 'carlos123', role: 'user'  },
];

const SEED_TASKS = [
    { id: 1, title: 'Diseñar mockups de la app',    status: 'completed', created_at: '2026-03-01', due_date: '2026-03-10', user_id: 2 },
    { id: 2, title: 'Implementar módulo de login',  status: 'pending',   created_at: '2026-03-05', due_date: '2026-03-20', user_id: 2 },
    { id: 3, title: 'Revisar pull requests',        status: 'pending',   created_at: '2026-03-10', due_date: '2026-03-15', user_id: 3 },
    { id: 4, title: 'Documentar endpoints API',     status: 'pending',   created_at: '2026-03-01', due_date: '2026-03-12', user_id: 3 },
    { id: 5, title: 'Configurar entorno de pruebas',status: 'pending',   created_at: '2026-03-20', due_date: '2026-04-05', user_id: 2 },
];

// ── Inicialización ─────────────────────────────────────────────────────────

/**
  Carga los datos semilla en localStorage si aún no existen.
  Se llama una sola vez al arrancar la app.
 */
function initStorage() {
    if (!localStorage.getItem(KEYS.USERS)) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
        localStorage.setItem(KEYS.NEXT_USER_ID, SEED_USERS.length + 1);
    }
    if (!localStorage.getItem(KEYS.TASKS)) {
        localStorage.setItem(KEYS.TASKS, JSON.stringify(SEED_TASKS));
        localStorage.setItem(KEYS.NEXT_TASK_ID, SEED_TASKS.length + 1);
    }
}

// ── Helpers internos ───────────────────────────────────────────────────────

function readUsers() {
    return JSON.parse(localStorage.getItem(KEYS.USERS)) ?? [];
}

function writeUsers(users) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

function readTasks() {
    return JSON.parse(localStorage.getItem(KEYS.TASKS)) ?? [];
}

function writeTasks(tasks) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}

function nextUserId() {
    const id = parseInt(localStorage.getItem(KEYS.NEXT_USER_ID), 10);
    localStorage.setItem(KEYS.NEXT_USER_ID, id + 1);
    return id;
}

function nextTaskId() {
    const id = parseInt(localStorage.getItem(KEYS.NEXT_TASK_ID), 10);
    localStorage.setItem(KEYS.NEXT_TASK_ID, id + 1);
    return id;
}

// ── API de Usuarios ────────────────────────────────────────────────────────

/**
  Devuelve todos los usuarios (sin la contraseña).
 */
function getAllUsers() {
    return readUsers().map(({ password: _, ...user }) => user);
}

/**
  Busca un usuario por username y password. Retorna el usuario o null.
 */
function findUserByCredentials(username, password) {
    return readUsers().find(u => u.username === username && u.password === password) ?? null;
}

/**
  Crea un nuevo usuario.
  @returns {object} el usuario creado o lanza un Error si el username ya existe.
 */
function createUser({ username, password, role }) {
    const users = readUsers();
    if (users.some(u => u.username === username)) {
        throw new Error(`El usuario "${username}" ya existe.`);
    }
    const newUser = { id: nextUserId(), username, password, role };
    writeUsers([...users, newUser]);
    return { ...newUser, password: undefined };
}

// ── API de Tareas ──────────────────────────────────────────────────────────

/**
  Devuelve todas las tareas, ordenadas por fecha de vencimiento (más próxima primero).
 */
function getAllTasks() {
    return readTasks().sort((a, b) => a.due_date.localeCompare(b.due_date));
}

/**
  Devuelve solo las tareas asignadas a un usuario específico.
 */
function getTasksByUser(userId) {
    return getAllTasks().filter(t => t.user_id === userId);
}

/**
  Crea una nueva tarea.
  Valida que due_date no sea anterior a created_at (espejo del CHECK en SQL).
  @returns {object} la tarea creada.
 */
function createTask({ title, due_date, user_id }) {
    const created_at = new Date().toISOString().split('T')[0];

    if (due_date < created_at) {
        throw new Error('La fecha de vencimiento no puede ser anterior a hoy.');
    }

    const newTask = {
        id: nextTaskId(),
        title,
        status: 'pending',
        created_at,
        due_date,
        user_id,
    };

    writeTasks([...readTasks(), newTask]);
    return newTask;
}

/**
  Cambia el estado de una tarea entre 'pending' y 'completed'.
  @returns {object} la tarea actualizada o null si no existe.
 */
function toggleTaskStatus(taskId) {
    const tasks = readTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    tasks[index].status = tasks[index].status === 'pending' ? 'completed' : 'pending';
    writeTasks(tasks);
    return tasks[index];
}

/**
  Elimina una tarea por ID.
  @returns {boolean} true si se eliminó, false si no existía.
 */
function deleteTask(taskId) {
    const tasks = readTasks();
    const filtered = tasks.filter(t => t.id !== taskId);
    if (filtered.length === tasks.length) return false;
    writeTasks(filtered);
    return true;
}

export {
    initStorage,
    getAllUsers,
    findUserByCredentials,
    createUser,
    getAllTasks,
    getTasksByUser,
    createTask,
    toggleTaskStatus,
    deleteTask,
};
