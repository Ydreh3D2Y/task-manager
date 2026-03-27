-- Task Manager (PostgreSQL) --

-- Tabla de Usuarios
CREATE TABLE users (
    id       SERIAL       PRIMARY KEY,
    username VARCHAR(50)  NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role     VARCHAR(20)  NOT NULL DEFAULT 'user'
                          CHECK (role IN ('admin', 'user'))
);

-- Tabla de Tareas
CREATE TABLE tasks (
    id          SERIAL       PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'completed')),
    created_at  DATE         NOT NULL DEFAULT CURRENT_DATE,
    due_date    DATE         NOT NULL,
    user_id     INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- La fecha de vencimiento no puede ser anterior a la fecha de creación
    CONSTRAINT chk_due_date CHECK (due_date >= created_at)
);

-- Datos semilla: 3 usuarios --

INSERT INTO users (username, password, role) VALUES
    ('admin',   'admin123',  'admin'),
    ('maria',   'maria123',  'user'),
    ('carlos',  'carlos123', 'user');

-- Datos semilla: 5 tareas --

    INSERT INTO tasks (title, status, created_at, due_date, user_id) VALUES
        ('Diseñar mockups de la app',    'completed', '2026-03-01', '2026-03-10', 2),
        ('Implementar módulo de login',  'pending',   '2026-03-05', '2026-03-20', 2),
        ('Revisar pull requests',        'pending',   '2026-03-10', '2026-03-15', 3),
        ('Documentar endpoints API',     'pending',   '2026-03-01', '2026-03-12', 3),
        ('Configurar entorno de pruebas','pending',   '2026-03-20', '2026-04-05', 2);

-- Consultas requeridas --

-- 1. Listado completo de tareas ordenadas por proximidad de vencimiento --
SELECT
    t.id,
    t.title,
    t.status,
    t.created_at,
    t.due_date,
    u.username AS assigned_to
FROM tasks t
JOIN users u ON t.user_id = u.id
ORDER BY t.due_date ASC;


-- 2. Conteo de tareas pendientes y completadas agrupadas por usuario --
SELECT
    u.username,
    SUM(CASE WHEN t.status = 'pending'   THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed,
    COUNT(t.id) AS total
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.username
ORDER BY u.username;


-- 3. Tareas atrasadas (pendiente y fecha de vencimiento < fecha actual) --
SELECT
    t.id,
    t.title,
    t.due_date,
    u.username AS assigned_to,
    (CURRENT_DATE - t.due_date) AS days_overdue
FROM tasks t
JOIN users u ON t.user_id = u.id
WHERE t.status = 'pending'
  AND t.due_date < CURRENT_DATE
ORDER BY t.due_date ASC;
