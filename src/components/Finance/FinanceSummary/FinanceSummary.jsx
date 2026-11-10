import { formatCurrency } from '../../../utils/currency.js'
import styles from './FinanceSummary.module.css'

/**
 * Resumo financeiro: total de gastos, total de ganhos e saldo.
 * O saldo fica VERMELHO quando negativo e VERDE quando positivo — a cor
 * deriva do sinal do número, nunca é fixada na mão.
 * Calculado sempre sobre TODOS os registros (ignora os filtros das listas).
 */
export default function FinanceSummary({ summary }) {
  const isNegative = summary.saldo < 0

  return (
    <section className={styles.summary} aria-label="Resumo financeiro">
      <article className={styles.card}>
        <p className={styles.label}>Total de gastos</p>
        <p className={`${styles.value} ${styles.expense}`}>
          {formatCurrency(summary.gastos)}
        </p>
      </article>

      <article className={styles.card}>
        <p className={styles.label}>Total de ganhos</p>
        <p className={`${styles.value} ${styles.income}`}>
          {formatCurrency(summary.ganhos)}
        </p>
      </article>

      <article className={`${styles.card} ${isNegative ? styles.cardNegative : styles.cardPositive}`}>
        <p className={styles.label}>Saldo</p>
        <p
          className={`${styles.value} ${isNegative ? styles.negative : styles.positive}`}
          data-saldo={isNegative ? 'negativo' : 'positivo'}
        >
          {formatCurrency(summary.saldo)}
        </p>
      </article>
    </section>
  )
}
