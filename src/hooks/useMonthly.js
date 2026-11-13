import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { createInitialMonthlyData } from '../state/monthly.js'

export function useMonthly(month) {
  const [state, setState] = useState({ period: month, data: createInitialMonthlyData() })
  const [error, setError] = useState(null)
  const data = state.period === month ? state.data : createInitialMonthlyData()

  useEffect(() => {
    let active = true
    api.getMonthly(month).then((response) => {
      if (active) setState({ period: month, data: { events: response.events, goals: response.goals } })
    }).catch((requestError) => {
      if (active) setError(requestError)
      console.error(requestError)
    })
    return () => { active = false }
  }, [month])

  const sync = useCallback((promise) => {
    promise.then((response) => setState({ period: month, data: { events: response.monthly.events, goals: response.monthly.goals } }))
      .catch((requestError) => { setError(requestError); console.error(requestError) })
  }, [month])
  const addEvent = useCallback((input) => sync(api.createMonthlyEvent({ ...input, date: input.date, month })), [month, sync])
  const updateEvent = useCallback((id, input) => sync(api.updateMonthlyEvent(id, input)), [sync])
  const toggleEvent = useCallback((id) => sync(api.toggleMonthlyEvent(id)), [sync])
  const removeEvent = useCallback((id) => sync(api.removeMonthlyEvent(id, month)), [month, sync])
  const addGoal = useCallback((title) => sync(api.createMonthlyGoal({ title, month })), [month, sync])
  const toggleGoal = useCallback((id) => sync(api.toggleMonthlyGoal(id)), [sync])
  const removeGoal = useCallback((id) => sync(api.removeMonthlyGoal(id, month)), [month, sync])
  return { ...data, addEvent, updateEvent, toggleEvent, removeEvent, addGoal, toggleGoal, removeGoal, error }
}
