import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

export function useGoals() {
  const [boards, setBoards] = useState([])
  const [selectedBoardId, setSelectedBoardId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const replaceBoards = useCallback((nextBoards, preferredId = null) => {
    setBoards(nextBoards)
    setSelectedBoardId((currentId) => {
      if (preferredId && nextBoards.some((board) => board.id === preferredId)) return preferredId
      if (currentId && nextBoards.some((board) => board.id === currentId)) return currentId
      return nextBoards[0]?.id ?? null
    })
  }, [])

  useEffect(() => {
    let active = true
    api.getGoalBoards().then((response) => {
      if (!active) return
      replaceBoards(response.boards)
      setLoading(false)
    }).catch((requestError) => {
      if (!active) return
      setError(requestError)
      setLoading(false)
      console.error(requestError)
    })
    return () => { active = false }
  }, [replaceBoards])

  const sync = useCallback((promise, preferredId = null) => {
    setError(null)
    promise.then((response) => replaceBoards(response.boards, preferredId))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [replaceBoards])

  const selectedIndex = boards.findIndex((board) => board.id === selectedBoardId)
  const selectedBoard = boards[selectedIndex] ?? null
  const canGoPrevious = selectedIndex > 0
  const canGoNext = selectedIndex >= 0 && selectedIndex < boards.length - 1

  const previousBoard = useCallback(() => {
    if (canGoPrevious) setSelectedBoardId(boards[selectedIndex - 1].id)
  }, [boards, canGoPrevious, selectedIndex])

  const nextBoard = useCallback(() => {
    if (canGoNext) setSelectedBoardId(boards[selectedIndex + 1].id)
  }, [boards, canGoNext, selectedIndex])

  const createBoard = useCallback((input) => {
    setError(null)
    api.createGoalBoard(input).then((nextBoards) => {
      const created = nextBoards.boards[nextBoards.boards.length - 1]
      replaceBoards(nextBoards.boards, created?.id)
    }).catch((requestError) => {
      setError(requestError)
      console.error(requestError)
    })
  }, [replaceBoards])

  const updateBoard = useCallback((input) => {
    if (selectedBoardId) sync(api.updateGoalBoard(selectedBoardId, input), selectedBoardId)
  }, [selectedBoardId, sync])

  const deleteBoard = useCallback(() => {
    if (selectedBoardId) sync(api.deleteGoalBoard(selectedBoardId))
  }, [selectedBoardId, sync])

  const addGoal = useCallback((input) => {
    if (selectedBoardId) sync(api.createGoal(selectedBoardId, input), selectedBoardId)
  }, [selectedBoardId, sync])

  const updateGoal = useCallback((id, input) => sync(api.updateGoal(id, input), selectedBoardId), [selectedBoardId, sync])
  const deleteGoal = useCallback((id) => sync(api.deleteGoal(id), selectedBoardId), [selectedBoardId, sync])
  const addAction = useCallback((goalId, input) => sync(api.createGoalAction(goalId, input), selectedBoardId), [selectedBoardId, sync])
  const updateAction = useCallback((id, input) => sync(api.updateGoalAction(id, input), selectedBoardId), [selectedBoardId, sync])
  const toggleAction = useCallback((id) => sync(api.toggleGoalAction(id), selectedBoardId), [selectedBoardId, sync])
  const deleteAction = useCallback((id) => sync(api.deleteGoalAction(id), selectedBoardId), [selectedBoardId, sync])

  return useMemo(() => ({
    boards,
    selectedBoard,
    selectedBoardId,
    loading,
    error,
    canGoPrevious,
    canGoNext,
    previousBoard,
    nextBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    addGoal,
    updateGoal,
    deleteGoal,
    addAction,
    updateAction,
    toggleAction,
    deleteAction,
  }), [
    boards, selectedBoard, selectedBoardId, loading, error, canGoPrevious, canGoNext,
    previousBoard, nextBoard, createBoard, updateBoard, deleteBoard, addGoal,
    updateGoal, deleteGoal, addAction, updateAction, toggleAction, deleteAction,
  ])
}
