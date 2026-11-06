import { useState } from 'react'
import styles from './AddTaskForm.module.css'

/** Formulário inline para adicionar uma tarefa no fim da coluna. */
export default function AddTaskForm({ dayLabel, onAdd }) {
  const [value, setValue] = useState('')
  const canSubmit = value.trim().length > 0

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    onAdd(value)
    setValue('')
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Nova tarefa..."
        aria-label={`Nova tarefa em ${dayLabel}`}
        maxLength={140}
        autoComplete="off"
      />
      <button
        type="submit"
        className={styles.button}
        aria-label={`Adicionar tarefa em ${dayLabel}`}
        disabled={!canSubmit}
      >
        +
      </button>
    </form>
  )
}
