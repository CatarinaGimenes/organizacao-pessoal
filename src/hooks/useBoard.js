import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { createInitialBoard } from '../state/board.js'

/**
 * Estado central do board semanal.
 *
 * As regras locais vivem em `src/state/board.js`; este hook sincroniza o
 * estado renderizado com a API persistente.
 */
export function useBoard(weekStart) {
  const [boardState, setBoardState] = useState(() => ({
    period: weekStart,
    data: createInitialBoard(),
  }))
  const board = boardState.period === weekStart ? boardState.data : createInitialBoard()
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api.getBoard(weekStart)
      .then((response) => {
        if (active) setBoardState({ period: weekStart, data: response.board })
      })
      .catch((requestError) => {
        if (active) setError(requestError)
        console.error(requestError)
      })

    return () => {
      active = false
    }
  }, [weekStart])

  const addTask = useCallback((dayId, text) => {
    api.createTask({ dayId, text, weekStart })
      .then((response) => setBoardState({ period: weekStart, data: response.board }))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [weekStart])

  const toggleTask = useCallback((dayId, taskId) => {
    const task = board.find((day) => day.id === dayId)?.tasks.find((item) => item.id === taskId)
    if (!task) return

    api.updateTask(taskId, {
      done: !task.done,
    })
      .then((response) => setBoardState({ period: weekStart, data: response.board }))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [board, weekStart])

  const removeTask = useCallback((dayId, taskId) => {
    void dayId
    api.removeTask(taskId)
      .then((response) => setBoardState({ period: weekStart, data: response.board }))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [weekStart])

  const moveTask = useCallback((sourceDayId, taskId, targetDayId, targetIndex) => {
    void sourceDayId
    api.moveTask(taskId, targetDayId, targetIndex)
      .then((response) => setBoardState({ period: weekStart, data: response.board }))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [weekStart])

  return { board, addTask, toggleTask, removeTask, moveTask, error }
}
