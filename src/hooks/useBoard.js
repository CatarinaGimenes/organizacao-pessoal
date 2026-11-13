import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { createInitialBoard } from '../state/board.js'

/**
 * Estado central do board semanal.
 *
 * As regras locais vivem em `src/state/board.js`; este hook sincroniza o
 * estado renderizado com a API persistente.
 */
export function useBoard() {
  const [board, setBoard] = useState(createInitialBoard)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api.getBoard()
      .then((response) => {
        if (active) setBoard(response.board)
      })
      .catch((requestError) => {
        if (active) setError(requestError)
        console.error(requestError)
      })

    return () => {
      active = false
    }
  }, [])

  const addTask = useCallback((dayId, text) => {
    api.createTask({ dayId, text })
      .then((response) => setBoard(response.board))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [])

  const toggleTask = useCallback((dayId, taskId) => {
    const task = board.find((day) => day.id === dayId)?.tasks.find((item) => item.id === taskId)
    if (!task) return

    api.updateTask(taskId, {
      done: !task.done,
    })
      .then((response) => setBoard(response.board))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [board])

  const removeTask = useCallback((dayId, taskId) => {
    void dayId
    api.removeTask(taskId)
      .then((response) => setBoard(response.board))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [])

  const moveTask = useCallback((sourceDayId, taskId, targetDayId, targetIndex) => {
    void sourceDayId
    api.moveTask(taskId, targetDayId, targetIndex)
      .then((response) => setBoard(response.board))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [])

  return { board, addTask, toggleTask, removeTask, moveTask, error }
}
