import {
  ALL_CATEGORIES,
  EXPENSE_CATEGORIES,
  getCategories,
} from '../data/finance.js'
import { createId } from '../utils/id.js'

/**
 * Regras de estado do planejamento financeiro — funções puras, sem React.
 * Mesmo contrato de `state/board.js`: entrada inválida devolve o MESMO
 * referencial (nenhuma mutação), mudança válida devolve uma nova lista.
 *
 * Valores são centavos (inteiro) — ver `utils/currency.js`.
 */

export function createInitialTransactions() {
  return []
}

/** Valida o tipo e a categoria juntos: categoria só existe dentro do seu tipo. */
function isValidCategory(type, category) {
  return getCategories(type).some((item) => item.id === category)
}

/**
 * Cadastra um gasto ou ganho.
 * `input` = { type: 'gasto'|'ganho', description, amount (centavos), category }.
 */
export function addTransaction(transactions, input) {
  const { type, amount, category } = input ?? {}
  const description = (input?.description ?? '').trim()

  if (type !== 'gasto' && type !== 'ganho') return transactions
  if (!Number.isInteger(amount) || amount <= 0) return transactions
  if (!description) return transactions
  if (!isValidCategory(type, category)) return transactions

  return [
    ...transactions,
    {
      id: createId('tx'),
      type,
      description,
      amount,
      category,
    },
  ]
}

/** Remove um registro pelo id (id inexistente → mesmo referencial). */
export function removeTransaction(transactions, id) {
  if (!transactions.some((transaction) => transaction.id === id)) {
    return transactions
  }
  return transactions.filter((transaction) => transaction.id !== id)
}

/**
 * Seleção usada pelas listas: registros de um tipo, opcionalmente
 * restritos a uma categoria (`ALL_CATEGORIES` = sem restrição).
 */
export function selectTransactions(transactions, type, category = ALL_CATEGORIES) {
  return transactions.filter(
    (transaction) =>
      transaction.type === type &&
      (category === ALL_CATEGORIES || transaction.category === category),
  )
}

/**
 * Resumo geral — SEMPRE sobre todos os registros, ignorando filtros de tela.
 * Retorna centavos: { gastos, ganhos, saldo } (saldo = ganhos - gastos).
 */
export function calculateSummary(transactions) {
  let gastos = 0
  let ganhos = 0

  for (const transaction of transactions) {
    if (transaction.type === 'gasto') gastos += transaction.amount
    else ganhos += transaction.amount
  }

  return { gastos, ganhos, saldo: ganhos - gastos }
}

export function calculateExpenseDistribution(transactions) {
  return EXPENSE_CATEGORIES
    .map((category) => ({
      category: category.id,
      label: category.label,
      amount: transactions
        .filter((transaction) => transaction.type === 'gasto' && transaction.category === category.id)
        .reduce((total, transaction) => total + transaction.amount, 0),
    }))
    .filter((item) => item.amount > 0)
}

export function calculateDashboardKpis(transactions, selectedCategory = EXPENSE_CATEGORIES[0].id) {
  const totalByCategory = transactions
    .filter((transaction) => transaction.type === 'gasto' && transaction.category === selectedCategory)
    .reduce((total, transaction) => total + transaction.amount, 0)
  const otherIncome = transactions
    .filter((transaction) => transaction.type === 'ganho' && transaction.category !== 'salario')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const invested = transactions
    .filter((transaction) => transaction.type === 'gasto' && transaction.category === 'investimentos')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const nonEssential = transactions
    .filter((transaction) =>
      transaction.type === 'gasto' &&
      !['contas', 'saude', 'transporte', 'investimentos'].includes(transaction.category))
    .reduce((total, transaction) => total + transaction.amount, 0)

  return { totalByCategory, otherIncome, invested, nonEssential }
}

export function calculateMonthlyTotals(transactions, year) {
  const monthLabels = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ]
  return monthLabels.map((label, index) => {
    const month = String(index + 1).padStart(2, '0')
    const prefix = `${year}-${month}`
    const monthly = transactions.filter((transaction) => transaction.occurredOn?.startsWith(prefix))
    return {
      month: prefix,
      label,
      ganhos: calculateSummary(monthly).ganhos,
      gastos: calculateSummary(monthly).gastos,
    }
  })
}
