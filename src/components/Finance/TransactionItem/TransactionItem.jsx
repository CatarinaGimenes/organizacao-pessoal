import { getCategoryLabel } from '../../../data/finance.js'
import { formatCurrency } from '../../../utils/currency.js'
import styles from './TransactionItem.module.css'

/**
 * Um registro da lista: descrição, categoria e valor.
 * Gasto aparece em vermelho, ganho em verde — a cor comunica o sinal do
 * dinheiro (positivo/negativo) do mesmo jeito que o saldo do resumo.
 */
export default function TransactionItem({ transaction, onRemove }) {
  const isExpense = transaction.type === 'gasto'

  return (
    <li className={styles.item}>
      <div className={styles.info}>
        <p className={styles.description}>{transaction.description}</p>
        <p className={styles.category}>
          {getCategoryLabel(transaction.type, transaction.category)}
        </p>
      </div>

      <span className={isExpense ? styles.expense : styles.income}>
        {isExpense ? '-' : '+'}
        {formatCurrency(transaction.amount)}
      </span>

      <button
        type="button"
        className={styles.remove}
        aria-label={`Excluir registro: ${transaction.description}`}
        onClick={() => onRemove(transaction.id)}
      >
        ×
      </button>
    </li>
  )
}
