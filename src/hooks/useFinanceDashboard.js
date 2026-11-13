import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { getFinanceDashboardRange } from '../utils/calendar.js'

export function useFinanceDashboard(selectedDate, period) {
  const range = useMemo(
    () => getFinanceDashboardRange(selectedDate, period),
    [selectedDate, period],
  )
  const rangeKey = range ? `${range.start}:${range.end}` : ''
  const [state, setState] = useState({
    rangeKey: '',
    transactions: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let active = true
    if (!range) {
      return () => { active = false }
    }

    api.getFinancialDashboard(range.start, range.end)
      .then((response) => {
        if (active) setState({ rangeKey, transactions: response.transactions, loading: false, error: null })
      })
      .catch((requestError) => {
        if (active) setState({ rangeKey, transactions: [], loading: false, error: requestError })
        console.error(requestError)
      })

    return () => { active = false }
  }, [range, rangeKey])

  return {
    transactions: state.rangeKey === rangeKey ? state.transactions : [],
    range,
    loading: state.loading || state.rangeKey !== rangeKey,
    error: state.error,
  }
}
