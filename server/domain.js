import { randomUUID } from 'node:crypto'
import { DAYS } from '../src/data/week.js'
import {
  ALL_CATEGORIES,
  getCategories,
} from '../src/data/finance.js'
import { db } from './db.js'

export const DEFAULT_USER_ID = 'local-user'

export function nowIso() {
  return new Date().toISOString()
}

export function getCurrentUserId() {
  // Ponto único para trocar o usuário local por uma sessão autenticada.
  return DEFAULT_USER_ID
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function getMonday(date = new Date()) {
  const result = new Date(date)
  const day = result.getUTCDay()
  const distance = day === 0 ? 6 : day - 1
  result.setUTCDate(result.getUTCDate() - distance)
  return result.toISOString().slice(0, 10)
}

export function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function getDay(dayId) {
  return DAYS.find((day) => day.id === dayId) ?? null
}

export function getWeekStart(value) {
  if (!value) return getMonday()
  if (!isValidDate(value)) {
    throw new Error('weekStart deve estar no formato AAAA-MM-DD')
  }
  return value
}

export function mapTask(row) {
  return {
    id: row.id,
    text: row.text,
    done: Boolean(row.done),
    plannedDate: row.planned_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapTransaction(row) {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amount: row.amount_cents,
    category: row.category,
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const STICKY_NOTE_COLORS = new Set(['yellow', 'pink', 'blue', 'green', 'orange'])

function mapTodo(row) {
  return {
    id: row.id,
    title: row.title,
    done: Boolean(row.done),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapStickyNote(row) {
  return {
    id: row.id,
    content: row.content,
    color: row.color,
    positionX: row.position_x,
    positionY: row.position_y,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function queryTodos(userId) {
  return db.prepare(`
    SELECT id, title, done, created_at, updated_at
    FROM todos
    WHERE user_id = ?
    ORDER BY done, created_at, id
  `).all(userId).map(mapTodo)
}

export function listTodos(userId) {
  return queryTodos(userId)
}

export function createTodo(userId, input) {
  const title = typeof input?.title === 'string' ? input.title.trim() : ''
  if (!title || title.length > 200) {
    throw new Error('title é obrigatório e deve ter até 200 caracteres')
  }

  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO todos (id, user_id, title, done, created_at, updated_at)
    VALUES (?, ?, ?, 0, ?, ?)
  `).run(randomUUID(), userId, title, timestamp, timestamp)
  return queryTodos(userId)
}

function getTodo(userId, id) {
  return db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(id, userId)
}

export function toggleTodo(userId, id) {
  const todo = getTodo(userId, id)
  if (!todo) throw new Error('TO DO não encontrado')
  db.prepare('UPDATE todos SET done = ?, updated_at = ? WHERE id = ?')
    .run(todo.done ? 0 : 1, nowIso(), id)
  return queryTodos(userId)
}

export function deleteTodo(userId, id) {
  const result = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, userId)
  if (result.changes === 0) throw new Error('TO DO não encontrado')
  return queryTodos(userId)
}

function queryStickyNotes(userId) {
  return db.prepare(`
    SELECT id, content, color, position_x, position_y, created_at, updated_at
    FROM sticky_notes
    WHERE user_id = ?
    ORDER BY created_at, id
  `).all(userId).map(mapStickyNote)
}

export function listStickyNotes(userId) {
  return queryStickyNotes(userId)
}

function normalizeNotePosition(value) {
  const position = Number(value)
  if (!Number.isFinite(position)) return null
  return Math.max(0, Math.min(100, position))
}

export function createStickyNote(userId, input) {
  const content = typeof input?.content === 'string' ? input.content.trim() : ''
  const color = input?.color ?? 'yellow'
  const positionX = normalizeNotePosition(input?.positionX ?? 8)
  const positionY = normalizeNotePosition(input?.positionY ?? 8)
  if (!content || content.length > 500) throw new Error('content é obrigatório e deve ter até 500 caracteres')
  if (!STICKY_NOTE_COLORS.has(color)) throw new Error('Cor de post-it inválida')
  if (positionX === null || positionY === null) throw new Error('Posição de post-it inválida')

  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO sticky_notes (
      id, user_id, content, color, position_x, position_y, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), userId, content, color, positionX, positionY, timestamp, timestamp)
  return queryStickyNotes(userId)
}

function getStickyNote(userId, id) {
  return db.prepare('SELECT * FROM sticky_notes WHERE id = ? AND user_id = ?').get(id, userId)
}

export function updateStickyNote(userId, id, input) {
  const note = getStickyNote(userId, id)
  if (!note) throw new Error('Post-it não encontrado')
  const payload = input ?? {}
  const content = payload.content === undefined ? note.content : String(payload.content).trim()
  const color = payload.color === undefined ? note.color : payload.color
  const positionX = payload.positionX === undefined ? note.position_x : normalizeNotePosition(payload.positionX)
  const positionY = payload.positionY === undefined ? note.position_y : normalizeNotePosition(payload.positionY)
  if (!content || content.length > 500) throw new Error('content deve ter entre 1 e 500 caracteres')
  if (!STICKY_NOTE_COLORS.has(color)) throw new Error('Cor de post-it inválida')
  if (positionX === null || positionY === null) throw new Error('Posição de post-it inválida')

  db.prepare(`
    UPDATE sticky_notes
    SET content = ?, color = ?, position_x = ?, position_y = ?, updated_at = ?
    WHERE id = ?
  `).run(content, color, positionX, positionY, nowIso(), id)
  return queryStickyNotes(userId)
}

export function deleteStickyNote(userId, id) {
  const result = db.prepare('DELETE FROM sticky_notes WHERE id = ? AND user_id = ?').run(id, userId)
  if (result.changes === 0) throw new Error('Post-it não encontrado')
  return queryStickyNotes(userId)
}

export function ensurePlan(userId, weekStart) {
  const existing = db.prepare(`
    SELECT id, week_start, created_at, updated_at
    FROM weekly_plans
    WHERE user_id = ? AND week_start = ?
  `).get(userId, weekStart)

  if (existing) return existing

  const id = randomUUID()
  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO weekly_plans (id, user_id, week_start, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, weekStart, timestamp, timestamp)

  return { id, week_start: weekStart, created_at: timestamp, updated_at: timestamp }
}

export function getBoard(userId, weekStart) {
  const plan = ensurePlan(userId, weekStart)
  const rows = db.prepare(`
    SELECT id, day_id, planned_date, text, done, position, created_at, updated_at
    FROM tasks
    WHERE plan_id = ?
    ORDER BY day_id, position
  `).all(plan.id)

  return DAYS.map((day) => ({
    ...day,
    tasks: rows
      .filter((row) => row.day_id === day.id)
      .map(mapTask),
  }))
}

export function getTaskForUser(userId, taskId) {
  return db.prepare(`
    SELECT tasks.*, weekly_plans.user_id
    FROM tasks
    JOIN weekly_plans ON weekly_plans.id = tasks.plan_id
    WHERE tasks.id = ? AND weekly_plans.user_id = ?
  `).get(taskId, userId)
}

function nextPosition(planId, dayId) {
  const row = db.prepare(`
    SELECT COALESCE(MAX(position) + 1, 0) AS next_position
    FROM tasks
    WHERE plan_id = ? AND day_id = ?
  `).get(planId, dayId)
  return row.next_position
}

function normalizePositions(planId, dayId, timestamp) {
  const rows = db.prepare(`
    SELECT id
    FROM tasks
    WHERE plan_id = ? AND day_id = ?
    ORDER BY position, created_at, id
  `).all(planId, dayId)

  const update = db.prepare(`
    UPDATE tasks SET position = ?, updated_at = ? WHERE id = ?
  `)
  rows.forEach((row, index) => update.run(index, timestamp, row.id))
}

function touchPlan(planId, timestamp) {
  db.prepare('UPDATE weekly_plans SET updated_at = ? WHERE id = ?').run(timestamp, planId)
}

export function createTask(userId, input) {
  const { dayId, text, weekStart, plannedDate } = input ?? {}
  const day = getDay(dayId)
  const trimmed = typeof text === 'string' ? text.trim() : ''
  if (!day || !trimmed || trimmed.length > 140) {
    throw new Error('dayId e text são obrigatórios; text deve ter até 140 caracteres')
  }

  const plan = ensurePlan(userId, getWeekStart(weekStart))
  const date = plannedDate ?? addDays(plan.week_start, day.jsDay === 0 ? 6 : day.jsDay - 1)
  if (!isValidDate(date)) throw new Error('plannedDate deve estar no formato AAAA-MM-DD')

  const id = randomUUID()
  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO tasks (
      id, plan_id, day_id, planned_date, text, done, position, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(id, plan.id, day.id, date, trimmed, nextPosition(plan.id, day.id), timestamp, timestamp)
  touchPlan(plan.id, timestamp)

  return getBoard(userId, plan.week_start)
}

export function updateTask(userId, taskId, input) {
  const task = getTaskForUser(userId, taskId)
  if (!task) throw new Error('Tarefa não encontrada')

  const payload = input ?? {}
  const timestamp = nowIso()
  const updates = []
  const values = []

  if (payload.done !== undefined) {
    if (typeof payload.done !== 'boolean') throw new Error('done deve ser booleano')
    updates.push('done = ?')
    values.push(payload.done ? 1 : 0)
  }
  if (payload.text !== undefined) {
    const text = typeof payload.text === 'string' ? payload.text.trim() : ''
    if (!text || text.length > 140) throw new Error('text deve ter entre 1 e 140 caracteres')
    updates.push('text = ?')
    values.push(text)
  }
  if (payload.plannedDate !== undefined) {
    if (!isValidDate(payload.plannedDate)) throw new Error('plannedDate inválida')
    updates.push('planned_date = ?')
    values.push(payload.plannedDate)
  }

  if (updates.length > 0) {
    values.push(timestamp, taskId)
    db.prepare(`
      UPDATE tasks SET ${updates.join(', ')}, updated_at = ? WHERE id = ?
    `).run(...values)
    touchPlan(task.plan_id, timestamp)
  }

  return getBoard(userId, task.plan_id
    ? db.prepare('SELECT week_start FROM weekly_plans WHERE id = ?').get(task.plan_id).week_start
    : getMonday())
}

export function deleteTask(userId, taskId) {
  const task = getTaskForUser(userId, taskId)
  if (!task) throw new Error('Tarefa não encontrada')

  const plan = db.prepare('SELECT week_start FROM weekly_plans WHERE id = ?').get(task.plan_id)
  const timestamp = nowIso()
  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId)
    normalizePositions(task.plan_id, task.day_id, timestamp)
    touchPlan(task.plan_id, timestamp)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return getBoard(userId, plan.week_start)
}

export function moveTask(userId, taskId, targetDayId, targetIndex) {
  const task = getTaskForUser(userId, taskId)
  const targetDay = getDay(targetDayId)
  if (!task || !targetDay || !Number.isInteger(targetIndex)) {
    throw new Error('Tarefa, dia ou índice de destino inválido')
  }

  const plan = db.prepare('SELECT week_start FROM weekly_plans WHERE id = ?').get(task.plan_id)
  const targetTasks = db.prepare(`
    SELECT id
    FROM tasks
    WHERE plan_id = ? AND day_id = ? AND id != ?
    ORDER BY position, created_at, id
  `).all(task.plan_id, targetDayId, taskId)
  const clampedIndex = Math.max(0, Math.min(targetIndex, targetTasks.length))
  const timestamp = nowIso()

  db.exec('BEGIN')
  try {
    db.prepare('UPDATE tasks SET day_id = ?, planned_date = ?, updated_at = ? WHERE id = ?')
      .run(targetDayId, addDays(plan.week_start, targetDay.jsDay === 0 ? 6 : targetDay.jsDay - 1), timestamp, taskId)

    const ordered = [...targetTasks.map((row) => row.id)]
    ordered.splice(clampedIndex, 0, taskId)
    const update = db.prepare('UPDATE tasks SET position = ?, updated_at = ? WHERE id = ?')
    ordered.forEach((id, index) => update.run(index, timestamp, id))

    if (task.day_id !== targetDayId) normalizePositions(task.plan_id, task.day_id, timestamp)
    touchPlan(task.plan_id, timestamp)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return getBoard(userId, plan.week_start)
}

export function getMonthBounds(month) {
  if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
    throw new Error('month deve estar no formato AAAA-MM')
  }
  const [year, monthNumber] = month.split('-').map(Number)
  const first = `${month}-01`
  const last = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10)
  if (!isValidDate(first) || monthNumber < 1 || monthNumber > 12) {
    throw new Error('month inválido')
  }
  return { first, last }
}

export function listTransactions(userId, month) {
  const { first, last } = getMonthBounds(month)
  return listTransactionsRange(userId, first, last)
}

export function listTransactionsRange(userId, from, to) {
  if (!isValidDate(from) || !isValidDate(to) || from > to) {
    throw new Error('Intervalo financeiro inválido')
  }
  return db.prepare(`
    SELECT id, type, description, amount_cents, category, occurred_on, created_at, updated_at
    FROM transactions
    WHERE user_id = ? AND occurred_on BETWEEN ? AND ?
    ORDER BY occurred_on, created_at, id
  `).all(userId, from, to).map(mapTransaction)
}

function isValidCategory(type, category) {
  return getCategories(type).some((item) => item.id === category)
}

export function createTransaction(userId, input) {
  const type = input?.type
  const description = typeof input?.description === 'string' ? input.description.trim() : ''
  const amount = input?.amount
  const category = input?.category
  const occurredOn = input?.occurredOn ?? new Date().toISOString().slice(0, 10)

  if (type !== 'gasto' && type !== 'ganho') throw new Error('Tipo de transação inválido')
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('amount deve ser um inteiro positivo em centavos')
  if (!description || description.length > 140) throw new Error('description deve ter entre 1 e 140 caracteres')
  if (!isValidCategory(type, category)) throw new Error('Categoria inválida para o tipo informado')
  if (!isValidDate(occurredOn)) throw new Error('occurredOn deve estar no formato AAAA-MM-DD')

  const id = randomUUID()
  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO transactions (
      id, user_id, type, description, amount_cents, category, occurred_on, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, type, description, amount, category, occurredOn, timestamp, timestamp)

  return listTransactions(userId, occurredOn.slice(0, 7))
}

export function deleteTransaction(userId, transactionId, month) {
  getMonthBounds(month)
  const result = db.prepare(`
    DELETE FROM transactions WHERE id = ? AND user_id = ?
  `).run(transactionId, userId)
  if (result.changes === 0) throw new Error('Transação não encontrada')
  return listTransactions(userId, month)
}

export function calculateSummary(transactions) {
  return transactions.reduce(
    (summary, transaction) => {
      if (transaction.type === 'gasto') summary.gastos += transaction.amount
      else summary.ganhos += transaction.amount
      summary.saldo = summary.ganhos - summary.gastos
      return summary
    },
    { gastos: 0, ganhos: 0, saldo: 0 },
  )
}

function getMonthFromDate(value) {
  if (!isValidDate(value)) throw new Error('date deve estar no formato AAAA-MM-DD')
  return value.slice(0, 7)
}

export function mapMonthlyEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.event_date,
    done: Boolean(row.done),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapMonthlyGoal(row) {
  return {
    id: row.id,
    title: row.title,
    done: Boolean(row.done),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function listMonthlyData(userId, month) {
  getMonthBounds(month)
  const events = db.prepare(`
    SELECT id, title, description, event_date, done, created_at, updated_at
    FROM monthly_events
    WHERE user_id = ? AND event_date BETWEEN ? AND ?
    ORDER BY event_date, created_at, id
  `).all(userId, `${month}-01`, getMonthBounds(month).last).map(mapMonthlyEvent)
  const goals = db.prepare(`
    SELECT id, title, done, created_at, updated_at
    FROM monthly_goals
    WHERE user_id = ? AND month = ?
    ORDER BY created_at, id
  `).all(userId, month).map(mapMonthlyGoal)
  return { month, events, goals }
}

export function createMonthlyEvent(userId, input) {
  const title = typeof input?.title === 'string' ? input.title.trim() : ''
  const description = typeof input?.description === 'string' ? input.description.trim() : ''
  const date = input?.date
  if (!title || title.length > 140 || description.length > 500) {
    throw new Error('title é obrigatório e description deve ter até 500 caracteres')
  }
  const month = getMonthFromDate(date)
  const id = randomUUID()
  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO monthly_events (id, user_id, title, description, event_date, done, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, userId, title, description, date, timestamp, timestamp)
  return listMonthlyData(userId, month)
}

function getMonthlyEvent(userId, id) {
  return db.prepare('SELECT * FROM monthly_events WHERE id = ? AND user_id = ?').get(id, userId)
}

export function updateMonthlyEvent(userId, id, input) {
  const event = getMonthlyEvent(userId, id)
  if (!event) throw new Error('Evento mensal não encontrado')
  const payload = input ?? {}
  const title = payload.title === undefined ? event.title : String(payload.title).trim()
  const description = payload.description === undefined ? event.description : String(payload.description).trim()
  const date = payload.date === undefined ? event.event_date : payload.date
  if (!title || title.length > 140 || description.length > 500) throw new Error('Dados do evento inválidos')
  const month = getMonthFromDate(date)
  const timestamp = nowIso()
  db.prepare(`
    UPDATE monthly_events SET title = ?, description = ?, event_date = ?, updated_at = ? WHERE id = ?
  `).run(title, description, date, timestamp, id)
  return listMonthlyData(userId, month)
}

export function toggleMonthlyEvent(userId, id) {
  const event = getMonthlyEvent(userId, id)
  if (!event) throw new Error('Evento mensal não encontrado')
  db.prepare('UPDATE monthly_events SET done = ?, updated_at = ? WHERE id = ?')
    .run(event.done ? 0 : 1, nowIso(), id)
  return listMonthlyData(userId, event.event_date.slice(0, 7))
}

export function deleteMonthlyEvent(userId, id, month) {
  getMonthBounds(month)
  const result = db.prepare('DELETE FROM monthly_events WHERE id = ? AND user_id = ?').run(id, userId)
  if (result.changes === 0) throw new Error('Evento mensal não encontrado')
  return listMonthlyData(userId, month)
}

export function createMonthlyGoal(userId, input) {
  const title = typeof input?.title === 'string' ? input.title.trim() : ''
  const month = input?.month
  getMonthBounds(month)
  if (!title || title.length > 140) throw new Error('title é obrigatório e deve ter até 140 caracteres')
  const id = randomUUID()
  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO monthly_goals (id, user_id, month, title, done, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `).run(id, userId, month, title, timestamp, timestamp)
  return listMonthlyData(userId, month)
}

function getMonthlyGoal(userId, id) {
  return db.prepare('SELECT * FROM monthly_goals WHERE id = ? AND user_id = ?').get(id, userId)
}

export function toggleMonthlyGoal(userId, id) {
  const goal = getMonthlyGoal(userId, id)
  if (!goal) throw new Error('Meta mensal não encontrada')
  db.prepare('UPDATE monthly_goals SET done = ?, updated_at = ? WHERE id = ?')
    .run(goal.done ? 0 : 1, nowIso(), id)
  return listMonthlyData(userId, goal.month)
}

export function deleteMonthlyGoal(userId, id, month) {
  getMonthBounds(month)
  const result = db.prepare('DELETE FROM monthly_goals WHERE id = ? AND user_id = ?').run(id, userId)
  if (result.changes === 0) throw new Error('Meta mensal não encontrada')
  return listMonthlyData(userId, month)
}

const GOAL_DURATION_UNITS = ['dias', 'meses', 'anos']
const GOAL_FREQUENCIES = ['diária', 'semanal', 'mensal']

function validateGoalBoardInput(input) {
  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  const durationValue = input?.durationValue
  const durationUnit = input?.durationUnit
  if (!name || name.length > 120) throw new Error('Nome do quadro deve ter entre 1 e 120 caracteres')
  if (!Number.isInteger(durationValue) || durationValue <= 0) {
    throw new Error('durationValue deve ser um inteiro positivo')
  }
  if (!GOAL_DURATION_UNITS.includes(durationUnit)) {
    throw new Error('Unidade de duração inválida')
  }
  return { name, durationValue, durationUnit }
}

function validateGoalInput(input) {
  const description = typeof input?.description === 'string' ? input.description.trim() : ''
  const requirements = typeof input?.requirements === 'string' ? input.requirements.trim() : ''
  if (!description || description.length > 500) {
    throw new Error('Descrição da meta deve ter entre 1 e 500 caracteres')
  }
  if (requirements.length > 1000) throw new Error('Requisitos devem ter até 1000 caracteres')
  return { description, requirements }
}

function validateGoalActionInput(input) {
  const description = typeof input?.description === 'string' ? input.description.trim() : ''
  const frequency = typeof input?.frequency === 'string' ? input.frequency.trim() : ''
  if (!description || description.length > 300) {
    throw new Error('Descrição da ação deve ter entre 1 e 300 caracteres')
  }
  if (!frequency || frequency.length > 100) {
    throw new Error('Periodicidade deve ter entre 1 e 100 caracteres')
  }
  if (!GOAL_FREQUENCIES.includes(frequency) && !frequency.startsWith('personalizada:')) {
    throw new Error('Periodicidade inválida')
  }
  return { description, frequency }
}

export function mapGoalAction(row) {
  return {
    id: row.id,
    description: row.description,
    frequency: row.frequency,
    done: Boolean(row.done),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapGoal(row, actions = []) {
  return {
    id: row.id,
    description: row.description,
    requirements: row.requirements,
    actions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapGoalBoard(row, goals = []) {
  return {
    id: row.id,
    name: row.name,
    durationValue: row.duration_value,
    durationUnit: row.duration_unit,
    goals,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function ensureGoalBoard(userId) {
  const existing = db.prepare(`
    SELECT id, name, duration_value, duration_unit, created_at, updated_at
    FROM goal_boards
    WHERE user_id = ?
    ORDER BY created_at, id
    LIMIT 1
  `).get(userId)
  if (existing) return existing

  const id = randomUUID()
  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO goal_boards (
      id, user_id, name, duration_value, duration_unit, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, 'Meu primeiro quadro', 1, 'anos', timestamp, timestamp)
  return db.prepare(`
    SELECT id, name, duration_value, duration_unit, created_at, updated_at
    FROM goal_boards WHERE id = ?
  `).get(id)
}

export function listGoalBoards(userId) {
  ensureGoalBoard(userId)
  const boardRows = db.prepare(`
    SELECT id, name, duration_value, duration_unit, created_at, updated_at
    FROM goal_boards
    WHERE user_id = ?
    ORDER BY created_at, id
  `).all(userId)
  const goalRows = db.prepare(`
    SELECT id, board_id, description, requirements, created_at, updated_at
    FROM goals
    WHERE board_id IN (SELECT id FROM goal_boards WHERE user_id = ?)
    ORDER BY created_at, id
  `).all(userId)
  const actionRows = db.prepare(`
    SELECT id, goal_id, description, frequency, done, created_at, updated_at
    FROM goal_actions
    WHERE goal_id IN (
      SELECT goals.id
      FROM goals
      JOIN goal_boards ON goal_boards.id = goals.board_id
      WHERE goal_boards.user_id = ?
    )
    ORDER BY created_at, id
  `).all(userId)

  return boardRows.map((board) => mapGoalBoard(
    board,
    goalRows
      .filter((goal) => goal.board_id === board.id)
      .map((goal) => mapGoal(
        goal,
        actionRows.filter((action) => action.goal_id === goal.id).map(mapGoalAction),
      )),
  ))
}

function getGoalBoardForUser(userId, boardId) {
  return db.prepare(`
    SELECT * FROM goal_boards WHERE id = ? AND user_id = ?
  `).get(boardId, userId)
}

function getGoalForUser(userId, goalId) {
  return db.prepare(`
    SELECT goals.*
    FROM goals
    JOIN goal_boards ON goal_boards.id = goals.board_id
    WHERE goals.id = ? AND goal_boards.user_id = ?
  `).get(goalId, userId)
}

function getGoalActionForUser(userId, actionId) {
  return db.prepare(`
    SELECT goal_actions.*
    FROM goal_actions
    JOIN goals ON goals.id = goal_actions.goal_id
    JOIN goal_boards ON goal_boards.id = goals.board_id
    WHERE goal_actions.id = ? AND goal_boards.user_id = ?
  `).get(actionId, userId)
}

export function createGoalBoard(userId, input) {
  const { name, durationValue, durationUnit } = validateGoalBoardInput(input)
  const id = randomUUID()
  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO goal_boards (
      id, user_id, name, duration_value, duration_unit, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, name, durationValue, durationUnit, timestamp, timestamp)
  return listGoalBoards(userId)
}

export function updateGoalBoard(userId, boardId, input) {
  if (!getGoalBoardForUser(userId, boardId)) throw new Error('Quadro de metas não encontrado')
  const current = getGoalBoardForUser(userId, boardId)
  const { name, durationValue, durationUnit } = validateGoalBoardInput({
    name: input?.name ?? current.name,
    durationValue: input?.durationValue ?? current.duration_value,
    durationUnit: input?.durationUnit ?? current.duration_unit,
  })
  db.prepare(`
    UPDATE goal_boards
    SET name = ?, duration_value = ?, duration_unit = ?, updated_at = ?
    WHERE id = ?
  `).run(name, durationValue, durationUnit, nowIso(), boardId)
  return listGoalBoards(userId)
}

export function deleteGoalBoard(userId, boardId) {
  if (!getGoalBoardForUser(userId, boardId)) throw new Error('Quadro de metas não encontrado')
  const count = db.prepare('SELECT COUNT(*) AS count FROM goal_boards WHERE user_id = ?').get(userId).count
  if (count <= 1) throw new Error('Não é possível excluir o último quadro de metas')
  db.prepare('DELETE FROM goal_boards WHERE id = ? AND user_id = ?').run(boardId, userId)
  return listGoalBoards(userId)
}

export function createGoal(userId, boardId, input) {
  if (!getGoalBoardForUser(userId, boardId)) throw new Error('Quadro de metas não encontrado')
  const { description, requirements } = validateGoalInput(input)
  const id = randomUUID()
  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO goals (id, board_id, description, requirements, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, boardId, description, requirements, timestamp, timestamp)
  return listGoalBoards(userId)
}

export function updateGoal(userId, goalId, input) {
  const current = getGoalForUser(userId, goalId)
  if (!current) throw new Error('Meta não encontrada')
  const { description, requirements } = validateGoalInput({
    description: input?.description ?? current.description,
    requirements: input?.requirements ?? current.requirements,
  })
  db.prepare(`
    UPDATE goals SET description = ?, requirements = ?, updated_at = ? WHERE id = ?
  `).run(description, requirements, nowIso(), goalId)
  return listGoalBoards(userId)
}

export function deleteGoal(userId, goalId) {
  if (!getGoalForUser(userId, goalId)) throw new Error('Meta não encontrada')
  db.prepare('DELETE FROM goals WHERE id = ?').run(goalId)
  return listGoalBoards(userId)
}

export function createGoalAction(userId, goalId, input) {
  if (!getGoalForUser(userId, goalId)) throw new Error('Meta não encontrada')
  const { description, frequency } = validateGoalActionInput(input)
  const id = randomUUID()
  const timestamp = nowIso()
  db.prepare(`
    INSERT INTO goal_actions (id, goal_id, description, frequency, done, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `).run(id, goalId, description, frequency, timestamp, timestamp)
  return listGoalBoards(userId)
}

export function updateGoalAction(userId, actionId, input) {
  const current = getGoalActionForUser(userId, actionId)
  if (!current) throw new Error('Plano de ação não encontrado')
  const { description, frequency } = validateGoalActionInput({
    description: input?.description ?? current.description,
    frequency: input?.frequency ?? current.frequency,
  })
  db.prepare(`
    UPDATE goal_actions
    SET description = ?, frequency = ?, updated_at = ?
    WHERE id = ?
  `).run(description, frequency, nowIso(), actionId)
  return listGoalBoards(userId)
}

export function toggleGoalAction(userId, actionId) {
  const action = getGoalActionForUser(userId, actionId)
  if (!action) throw new Error('Plano de ação não encontrado')
  db.prepare('UPDATE goal_actions SET done = ?, updated_at = ? WHERE id = ?')
    .run(action.done ? 0 : 1, nowIso(), actionId)
  return listGoalBoards(userId)
}

export function deleteGoalAction(userId, actionId) {
  if (!getGoalActionForUser(userId, actionId)) throw new Error('Plano de ação não encontrado')
  db.prepare('DELETE FROM goal_actions WHERE id = ?').run(actionId)
  return listGoalBoards(userId)
}

export { ALL_CATEGORIES }
