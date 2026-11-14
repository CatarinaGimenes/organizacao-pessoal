export function createInitialTodos() {
  return []
}

export function addTodo(todos, input) {
  const title = typeof input?.title === 'string' ? input.title.trim() : ''
  if (!title || title.length > 200) return todos

  return [
    ...todos,
    {
      id: input.id ?? crypto.randomUUID(),
      title,
      done: Boolean(input.done),
    },
  ]
}

export function toggleTodo(todos, id) {
  const index = todos.findIndex((todo) => todo.id === id)
  if (index < 0) return todos
  const next = [...todos]
  next[index] = { ...next[index], done: !next[index].done }
  return next
}

export function removeTodo(todos, id) {
  const next = todos.filter((todo) => todo.id !== id)
  return next.length === todos.length ? todos : next
}
