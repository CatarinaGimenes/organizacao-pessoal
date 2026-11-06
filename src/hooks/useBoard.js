import { useCallback, useState } from 'react'
import {
  addTask as addTaskToBoard,
  createInitialBoard,
  moveTask as moveTaskOnBoard,
  removeTask as removeTaskFromBoard,
  toggleTask as toggleTaskOnBoard,
} from '../state/board.js'

/**
 * Estado central do board semanal.
 *
 * Toda a regra de negócio vive em `src/state/board.js` (funções puras);
 * aqui ficam apenas o estado em memória e os handlers memoizados. Trocar
 * "em memória" por localStorage ou uma API é uma mudança local neste hook.
 */
export function useBoard() {
  const [board, setBoard] = useState(createInitialBoard)

  const addTask = useCallback((dayId, text) => {
    setBoard((prev) => addTaskToBoard(prev, dayId, text))
  }, [])

  const toggleTask = useCallback((dayId, taskId) => {
    setBoard((prev) => toggleTaskOnBoard(prev, dayId, taskId))
  }, [])

  const removeTask = useCallback((dayId, taskId) => {
    setBoard((prev) => removeTaskFromBoard(prev, dayId, taskId))
  }, [])

  const moveTask = useCallback((sourceDayId, taskId, targetDayId, targetIndex) => {
    setBoard((prev) =>
      moveTaskOnBoard(prev, sourceDayId, taskId, targetDayId, targetIndex),
    )
  }, [])

  return { board, addTask, toggleTask, removeTask, moveTask }
}
