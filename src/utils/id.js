let sequence = 0

/** Gera um id único e legível para tarefas. */
export function createId(prefix = 'id') {
  sequence += 1
  return `${prefix}-${Date.now().toString(36)}-${sequence}`
}
