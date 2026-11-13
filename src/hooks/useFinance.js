import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { createInitialTransactions } from '../state/finance.js'

/**
 * Estado central do planejamento financeiro.
 *
 * As regras locais vivem em `src/state/finance.js`; este hook sincroniza o
 * estado renderizado com a API persistente.
 *
 * Instanciado no App (e não na página) para não perder os registros ao
 * navegar entre as telas.
 */
export function useFinance(month, selectedDate) {
  const [transactionsState, setTransactionsState] = useState(() => ({
    period: month,
    data: createInitialTransactions(),
  }))
  const transactions = transactionsState.period === month
    ? transactionsState.data
    : createInitialTransactions()
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api.getTransactions(month)
      .then((response) => {
        if (active) setTransactionsState({ period: month, data: response.transactions })
      })
      .catch((requestError) => {
        if (active) setError(requestError)
        console.error(requestError)
      })

    return () => {
      active = false
    }
  }, [month])

  const addTransaction = useCallback((input) => {
    api.createTransaction({ ...input, occurredOn: input.occurredOn ?? selectedDate })
      .then((response) => setTransactionsState({ period: month, data: response.transactions }))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [month, selectedDate])

  const removeTransaction = useCallback((id) => {
    api.removeTransaction(id, month)
      .then((response) => setTransactionsState({ period: month, data: response.transactions }))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [month])

  return { transactions, addTransaction, removeTransaction, error }
}
