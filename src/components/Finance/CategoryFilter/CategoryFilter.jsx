import { ALL_CATEGORIES } from '../../../data/finance.js'
import styles from './CategoryFilter.module.css'

/**
 * Filtro de categorias de uma lista (chips).
 * "Todas" limpa a restrição; o valor controlado é estado da lista que o
 * usa — cada lista tem o seu próprio filtro.
 */
export default function CategoryFilter({ categories, selected, onSelect, label }) {
  return (
    <div className={styles.filter} role="group" aria-label={label}>
      <button
        type="button"
        className={styles.chip}
        data-active={selected === ALL_CATEGORIES ? 'true' : 'false'}
        aria-pressed={selected === ALL_CATEGORIES}
        onClick={() => onSelect(ALL_CATEGORIES)}
      >
        Todas
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={styles.chip}
          data-active={selected === category.id ? 'true' : 'false'}
          aria-pressed={selected === category.id}
          onClick={() => onSelect(category.id)}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}
