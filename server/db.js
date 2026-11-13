import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const databasePath = resolve(
  process.env.DATABASE_PATH ?? './server/data/organizacao.sqlite',
)

mkdirSync(dirname(databasePath), { recursive: true })

export const db = new DatabaseSync(databasePath)

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    display_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS weekly_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (user_id, week_start)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
    day_id TEXT NOT NULL,
    planned_date TEXT NOT NULL,
    text TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS tasks_plan_day_position
    ON tasks (plan_id, day_id, position);

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('gasto', 'ganho')),
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    category TEXT NOT NULL,
    occurred_on TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS transactions_user_created
    ON transactions (user_id, created_at);

  CREATE INDEX IF NOT EXISTS transactions_user_occurred
    ON transactions (user_id, occurred_on);

  CREATE TABLE IF NOT EXISTS monthly_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    event_date TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS monthly_events_user_date
    ON monthly_events (user_id, event_date);

  CREATE TABLE IF NOT EXISTS monthly_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS monthly_goals_user_month
    ON monthly_goals (user_id, month);

  CREATE TABLE IF NOT EXISTS goal_boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_value INTEGER NOT NULL CHECK (duration_value > 0),
    duration_unit TEXT NOT NULL CHECK (duration_unit IN ('dias', 'meses', 'anos')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS goal_boards_user_created
    ON goal_boards (user_id, created_at, id);

  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES goal_boards(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS goals_board_created
    ON goals (board_id, created_at, id);

  CREATE TABLE IF NOT EXISTS goal_actions (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    frequency TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS goal_actions_goal_created
    ON goal_actions (goal_id, created_at, id);
`)

const now = new Date().toISOString()
db.prepare(`
  INSERT INTO users (id, email, display_name, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(id) DO NOTHING
`).run('local-user', null, 'Usuário local', now, now)

export function closeDatabase() {
  db.close()
}
