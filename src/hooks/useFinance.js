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
export function useFinance() {
  const [transactions, setTransactions] = useState(createInitialTransactions)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api.getTransactions()
      .then((response) => {
        if (active) setTransactions(response.transactions)
      })
      .catch((requestError) => {
        if (active) setError(requestError)
        console.error(requestError)
      })

    return () => {
      active = false
    }
  }, [])

  const addTransaction = useCallback((input) => {
    api.createTransaction(input)
      .then((response) => setTransactions(response.transactions))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [])

  const removeTransaction = useCallback((id) => {
    api.removeTransaction(id)
      .then((response) => setTransactions(response.transactions))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [])

  return { transactions, addTransaction, removeTransaction, error }
}
