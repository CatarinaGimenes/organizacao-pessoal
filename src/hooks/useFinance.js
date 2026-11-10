import { useCallback, useState } from 'react'
import {
  addTransaction as addTransactionToList,
  createInitialTransactions,
  removeTransaction as removeTransactionFromList,
} from '../state/finance.js'

/**
 * Estado central do planejamento financeiro.
 *
 * Toda a regra de negócio vive em `src/state/finance.js` (funções puras);
 * aqui ficam apenas o estado em memória e os handlers memoizados. Trocar
 * "em memória" por localStorage ou uma API é uma mudança local neste hook.
 *
 * Instanciado no App (e não na página) para não perder os registros ao
 * navegar entre as telas.
 */
export function useFinance() {
  const [transactions, setTransactions] = useState(createInitialTransactions)

  const addTransaction = useCallback((input) => {
    setTransactions((prev) => addTransactionToList(prev, input))
  }, [])

  const removeTransaction = useCallback((id) => {
    setTransactions((prev) => removeTransactionFromList(prev, id))
  }, [])

  return { transactions, addTransaction, removeTransaction }
}
