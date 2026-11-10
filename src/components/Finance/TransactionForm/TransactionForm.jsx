import { useState } from 'react'
import { getCategories } from '../../../data/finance.js'
import { parseAmountToCents } from '../../../utils/currency.js'
import styles from './TransactionForm.module.css'

/**
 * Formulário de cadastro de gastos e ganhos.
 * O tipo (gasto/ganho) controla quais categorias aparecem no <select>:
 * trocar de tipo reseta a categoria para a primeira da nova lista.
 */
export default function TransactionForm({ onAdd }) {
  const [type, setType] = useState('gasto')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(getCategories('gasto')[0].id)

  const categories = getCategories(type)
  const amountInCents = parseAmountToCents(amount)
  const canSubmit = description.trim().length > 0 && amountInCents > 0

  const handleTypeChange = (event) => {
    const nextType = event.target.value
    setType(nextType)
    setCategory(getCategories(nextType)[0].id)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return

    onAdd({ type, description, amount: amountInCents, category })
    setDescription('')
    setAmount('')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Tipo: gasto ou ganho ---------------------------------------------- */}
      <fieldset className={styles.types}>
        <legend className={styles.legend}>Tipo</legend>
        <div className={styles.typeGroup}>
          <label className={styles.typeOption}>
            <input
              className={styles.typeRadio}
              type="radio"
              name="transaction-type"
              value="gasto"
              checked={type === 'gasto'}
              onChange={handleTypeChange}
            />
            <span>Gasto</span>
          </label>
          <label className={styles.typeOption}>
            <input
              className={styles.typeRadio}
              type="radio"
              name="transaction-type"
              value="ganho"
              checked={type === 'ganho'}
              onChange={handleTypeChange}
            />
            <span>Ganho</span>
          </label>
        </div>
      </fieldset>

      <div className={styles.fields}>
        {/* Descrição ------------------------------------------------------- */}
        <label className={styles.field}>
          <span className={styles.label}>Descrição</span>
          <input
            className={styles.input}
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={type === 'gasto' ? 'Ex.: Supermercado' : 'Ex.: Salário de novembro'}
            maxLength={140}
            autoComplete="off"
          />
        </label>

        {/* Valor ------------------------------------------------------------ */}
        <label className={styles.field}>
          <span className={styles.label}>Valor (R$)</span>
          <input
            className={styles.input}
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0,00"
            min="0.01"
            step="0.01"
            inputMode="decimal"
          />
        </label>

        {/* Categoria -------------------------------------------------------- */}
        <label className={styles.field}>
          <span className={styles.label}>Categoria</span>
          <select
            className={styles.select}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className={styles.button} disabled={!canSubmit}>
          Adicionar
        </button>
      </div>
    </form>
  )
}
