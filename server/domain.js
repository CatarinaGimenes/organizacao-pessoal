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
  return db.prepare(`
    SELECT id, type, description, amount_cents, category, occurred_on, created_at, updated_at
    FROM transactions
    WHERE user_id = ? AND occurred_on BETWEEN ? AND ?
    ORDER BY occurred_on, created_at, id
  `).all(userId, first, last).map(mapTransaction)
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

export { ALL_CATEGORIES }
