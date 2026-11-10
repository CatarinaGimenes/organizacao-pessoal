/**
 * Dinheiro em CENTAVOS (inteiro) para somar sem erro de ponto flutuante.
 * A UI só mostra valores formatados; a regra de negócio nunca vê "reais"
 * com vírgula.
 */

const formatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** Formata centavos como moeda brasileira (R$ 1.234,56). */
export function formatCurrency(cents) {
  return formatter.format(cents / 100)
}

/**
 * Converte o texto do campo de valor em centavos.
 * Aceita "12", "12,34", "12.34" e "1.234,56".
 * Retorna 0 para entradas vazias ou inválidas (a validação fica em
 * `state/finance.js`, que exige valor > 0).
 */
export function parseAmountToCents(text) {
  if (typeof text !== 'string') return 0

  let normalized = text.trim().replace(/r\$\s*/gi, '').replace(/\s/g, '')
  if (!normalized) return 0

  // Com vírgula, é formato brasileiro: ponto é separador de milhar.
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.')
  }

  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return 0

  return Math.round(value * 100)
}
