import { useState } from 'react'
import { ALL_CATEGORIES, getCategories } from '../../../data/finance.js'
import { selectTransactions } from '../../../state/finance.js'
import CategoryFilter from '../CategoryFilter/CategoryFilter.jsx'
import TransactionItem from '../TransactionItem/TransactionItem.jsx'
import styles from './TransactionList.module.css'

/**
 * Lista de uma natureza (gastos OU ganhos) com filtro próprio por categoria.
 * O filtro é estado local (visível); a regra de seleção é pura e vem de
 * `state/finance.js`.
 */
export default function TransactionList({ type, title, transactions, onRemove }) {
  const [category, setCategory] = useState(ALL_CATEGORIES)

  const categories = getCategories(type)
  const allOfType = selectTransactions(transactions, type)
  const visible = selectTransactions(transactions, type, category)
  // Mais recentes primeiro (a ordem de cadastro é a ordem do array).
  const ordered = [...visible].reverse()

  const emptyText =
    allOfType.length === 0
      ? type === 'gasto'
        ? 'Nenhum gasto cadastrado'
        : 'Nenhum ganho cadastrado'
      : 'Nenhum registro nesta categoria'

  return (
    <section className={styles.list} aria-label={title}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <span className={styles.count}>
          {visible.length} {visible.length === 1 ? 'registro' : 'registros'}
        </span>
      </header>

      <CategoryFilter
        categories={categories}
        selected={category}
        onSelect={setCategory}
        label={`Filtrar ${title.toLowerCase()} por categoria`}
      />

      {ordered.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ul className={styles.items}>
          {ordered.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
