async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(body.error ?? 'Não foi possível concluir a operação')
  }
  return body
}

export const api = {
  getBoard: (weekStart) => request(`/board?weekStart=${encodeURIComponent(weekStart)}`),
  createTask: (input) =>
    request('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateTask: (id, input) =>
    request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  moveTask: (id, targetDayId, targetIndex) =>
    request(`/tasks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ targetDayId, targetIndex }),
    }),
  removeTask: (id) =>
    request(`/tasks/${id}`, {
      method: 'DELETE',
    }),
  getTransactions: (month) => request(`/transactions?month=${encodeURIComponent(month)}`),
  createTransaction: (input) =>
    request('/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  removeTransaction: (id, month) =>
    request(`/transactions/${id}?month=${encodeURIComponent(month)}`, {
      method: 'DELETE',
    }),
}
