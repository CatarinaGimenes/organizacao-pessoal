/**
 * Definição dos dias do board semanal.
 * Os campos são dados (não layout), então personalizar nomes, ordem ou
 * adicionar colunas no futuro exige mudar apenas este arquivo.
 */
export const DAYS = [
  { id: 'monday', label: 'Segunda-feira', short: 'Seg', jsDay: 1 },
  { id: 'tuesday', label: 'Terça-feira', short: 'Ter', jsDay: 2 },
  { id: 'wednesday', label: 'Quarta-feira', short: 'Qua', jsDay: 3 },
  { id: 'thursday', label: 'Quinta-feira', short: 'Qui', jsDay: 4 },
  { id: 'friday', label: 'Sexta-feira', short: 'Sex', jsDay: 5 },
  { id: 'saturday', label: 'Sábado', short: 'Sáb', jsDay: 6 },
  { id: 'sunday', label: 'Domingo', short: 'Dom', jsDay: 0 },
]

/** Retorna o id do dia de hoje (ou null, caso o mapa seja alterado). */
export function getTodayId() {
  const jsDay = new Date().getDay()
  return DAYS.find((day) => day.jsDay === jsDay)?.id ?? null
}
