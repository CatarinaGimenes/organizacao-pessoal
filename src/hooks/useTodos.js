import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { createInitialTodos } from '../state/todo.js'

export function useTodos() {
  const [state, setState] = useState({ data: createInitialTodos(), loaded: false })
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api.getTodos()
      .then((response) => {
        if (active) setState({ data: response.todos, loaded: true })
      })
      .catch((requestError) => {
        if (active) setError(requestError)
        console.error(requestError)
      })
    return () => { active = false }
  }, [])

  const sync = useCallback((promise) => {
    promise
      .then((response) => setState({ data: response.todos, loaded: true }))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [])

  const addTodo = useCallback((title) => sync(api.createTodo({ title })), [sync])
  const toggleTodo = useCallback((id) => sync(api.toggleTodo(id)), [sync])
  const removeTodo = useCallback((id) => sync(api.deleteTodo(id)), [sync])

  return {
    todos: state.data,
    loading: !state.loaded,
    addTodo,
    toggleTodo,
    removeTodo,
    error,
  }
}
