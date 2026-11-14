export const STICKY_NOTE_COLORS = [
  { id: 'yellow', label: 'Amarelo' },
  { id: 'pink', label: 'Rosa' },
  { id: 'blue', label: 'Azul' },
  { id: 'green', label: 'Verde' },
  { id: 'orange', label: 'Laranja' },
]

export function createInitialStickyNotes() {
  return []
}

export function addStickyNote(notes, input) {
  const content = typeof input?.content === 'string' ? input.content.trim() : ''
  if (!content || content.length > 500) return notes

  return [
    ...notes,
    {
      id: input.id ?? crypto.randomUUID(),
      content,
      color: input.color ?? 'yellow',
      positionX: Number.isFinite(input.positionX) ? input.positionX : 8,
      positionY: Number.isFinite(input.positionY) ? input.positionY : 8,
    },
  ]
}

export function updateStickyNote(notes, id, input) {
  const index = notes.findIndex((note) => note.id === id)
  if (index < 0) return notes
  const current = notes[index]
  const content = input?.content === undefined ? current.content : input.content.trim()
  if (!content || content.length > 500) return notes

  const next = [...notes]
  next[index] = {
    ...current,
    ...input,
    content,
  }
  return next
}

export function removeStickyNote(notes, id) {
  const next = notes.filter((note) => note.id !== id)
  return next.length === notes.length ? notes : next
}
