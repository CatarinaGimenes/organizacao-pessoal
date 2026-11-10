import FinanceSummary from '../../components/Finance/FinanceSummary/FinanceSummary.jsx'
import TransactionForm from '../../components/Finance/TransactionForm/TransactionForm.jsx'
import TransactionList from '../../components/Finance/TransactionList/TransactionList.jsx'
import { calculateSummary } from '../../state/finance.js'
import styles from './FinancePage.module.css'

/**
 * Tela do Planejamento Financeiro: cadastro, resumo e as duas listas
 * (gastos e ganhos), cada uma com seu próprio filtro por categoria.
 * Os registros vêm do hook `useFinance`, que vive no App — navegar para
 * outra tela não zera o que foi cadastrado.
 */
function FinancePage({ transactions, onAdd, onRemove }) {
  const summary = calculateSummary(transactions)

  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Organização pessoal</p>
          <h1 className={styles.title}>Planejamento Financeiro</h1>
        </div>
        <p className={styles.summaryPill}>
          {transactions.length}{' '}
          {transactions.length === 1 ? 'registro' : 'registros'}
        </p>
      </header>

      <FinanceSummary summary={summary} />

      <TransactionForm onAdd={onAdd} />

      <div className={styles.lists}>
        <TransactionList
          type="gasto"
          title="Gastos"
          transactions={transactions}
          onRemove={onRemove}
        />
        <TransactionList
          type="ganho"
          title="Ganhos"
          transactions={transactions}
          onRemove={onRemove}
        />
      </div>
    </>
  )
}

export default FinancePage
