/**
 * Categorias financeiras — dados, não layout (mesma ideia de `data/week.js`).
 * Renomear/reordenar categorias é só editar estes arrays; os componentes
 * apenas leem os rótulos.
 */

/** Categorias disponíveis para GASTOS. */
export const EXPENSE_CATEGORIES = [
  { id: 'contas', label: 'Contas' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'lazer', label: 'Lazer' },
  { id: 'saude', label: 'Saúde' },
  { id: 'investimentos', label: 'Investimentos' },
  { id: 'outros-gastos', label: 'Outros' },
]

/** Categorias disponíveis para GANHOS. */
export const INCOME_CATEGORIES = [
  { id: 'salario', label: 'Salário' },
  { id: 'presente', label: 'Presente' },
  { id: 'renda-extra', label: 'Renda extra' },
  { id: 'outros-ganhos', label: 'Outros' },
]

/** Valor especial do filtro "sem restrição de categoria". */
export const ALL_CATEGORIES = 'all'

/** Lista de categorias de um tipo ('gasto' | 'ganho'). */
export function getCategories(type) {
  return type === 'ganho' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

/** Rótulo legível de uma categoria, pelo id. */
export function getCategoryLabel(type, categoryId) {
  const found = getCategories(type).find((category) => category.id === categoryId)
  return found ? found.label : categoryId
}
