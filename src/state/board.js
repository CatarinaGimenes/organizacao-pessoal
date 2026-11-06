import { DAYS } from '../data/week.js'
import { createId } from '../utils/id.js'

/**
 * Regras de estado do board — funções puras, sem React e sem efeitos.
 * Todas retornam um novo board (imutáveis), o que deixa a lógica testável
 * de forma isolada e pronta para ser usada com useReducer, persistência etc.
 */

export function createInitialBoard() {
  return DAYS.map((day) => ({ ...day, tasks: [] }))
}

export function addTask(board, dayId, text) {
  const trimmed = text.trim()
  if (!trimmed) return board

  return board.map((day) =>
    day.id === dayId
      ? {
          ...day,
          tasks: [
            ...day.tasks,
            { id: createId('task'), text: trimmed, done: false },
          ],
        }
      : day,
  )
}

export function toggleTask(board, dayId, taskId) {
  return board.map((day) =>
    day.id === dayId
      ? {
          ...day,
          tasks: day.tasks.map((task) =>
            task.id === taskId ? { ...task, done: !task.done } : task,
          ),
        }
      : day,
  )
}

export function removeTask(board, dayId, taskId) {
  return board.map((day) =>
    day.id === dayId
      ? { ...day, tasks: day.tasks.filter((task) => task.id !== taskId) }
      : day,
  )
}

/**
 * Move uma tarefa para outro dia ou para outra posição no mesmo dia.
 * `targetIndex` é a posição de destino calculada antes da remoção
 * (índice da tarefa sobre a qual o item foi solto, ou o fim da lista).
 */
export function moveTask(board, sourceDayId, taskId, targetDayId, targetIndex) {
  const source = board.find((day) => day.id === sourceDayId)
  if (!source) return board
  if (!board.some((day) => day.id === targetDayId)) return board

  const sourceIndex = source.tasks.findIndex((task) => task.id === taskId)
  if (sourceIndex === -1) return board

  const next = board.map((day) => ({ ...day, tasks: [...day.tasks] }))
  const from = next.find((day) => day.id === sourceDayId)
  const to = next.find((day) => day.id === targetDayId)

  const [task] = from.tasks.splice(sourceIndex, 1)

  // Remover antes de inserir desloca as posições seguintes no mesmo dia.
  const insertAt =
    sourceDayId === targetDayId && sourceIndex < targetIndex
      ? targetIndex - 1
      : targetIndex
  const clamped = Math.max(0, Math.min(insertAt, to.tasks.length))

  to.tasks.splice(clamped, 0, task)
  return next
}
