function validText(value, max = 140) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max
}

export function createInitialMonthlyData() {
  return { events: [], goals: [] }
}

export function addMonthlyEvent(data, input) {
  if (!validText(input?.title) || typeof input?.description !== 'string' || input.description.length > 500 || !input?.date) return data
  return {
    ...data,
    events: [...data.events, {
      id: input.id ?? crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description.trim(),
      date: input.date,
      done: Boolean(input.done),
    }],
  }
}

export function updateMonthlyEvent(data, id, input) {
  const index = data.events.findIndex((event) => event.id === id)
  if (index < 0) return data
  const current = data.events[index]
  const next = {
    ...current,
    ...(input?.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input?.description !== undefined ? { description: input.description.trim() } : {}),
    ...(input?.date !== undefined ? { date: input.date } : {}),
  }
  if (!validText(next.title) || typeof next.description !== 'string') return data
  const events = [...data.events]
  events[index] = next
  return { ...data, events }
}

export function toggleMonthlyEvent(data, id) {
  const index = data.events.findIndex((event) => event.id === id)
  if (index < 0) return data
  const events = [...data.events]
  events[index] = { ...events[index], done: !events[index].done }
  return { ...data, events }
}

export function removeMonthlyEvent(data, id) {
  const events = data.events.filter((event) => event.id !== id)
  return events.length === data.events.length ? data : { ...data, events }
}

export function addMonthlyGoal(data, input) {
  if (!validText(input?.title)) return data
  return {
    ...data,
    goals: [...data.goals, {
      id: input.id ?? crypto.randomUUID(),
      title: input.title.trim(),
      done: Boolean(input.done),
    }],
  }
}

export function toggleMonthlyGoal(data, id) {
  const index = data.goals.findIndex((goal) => goal.id === id)
  if (index < 0) return data
  const goals = [...data.goals]
  goals[index] = { ...goals[index], done: !goals[index].done }
  return { ...data, goals }
}

export function removeMonthlyGoal(data, id) {
  const goals = data.goals.filter((goal) => goal.id !== id)
  return goals.length === data.goals.length ? data : { ...data, goals }
}
