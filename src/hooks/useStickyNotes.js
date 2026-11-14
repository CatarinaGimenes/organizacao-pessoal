import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { createInitialStickyNotes } from '../state/stickyNotes.js'

export function useStickyNotes() {
  const [state, setState] = useState({ data: createInitialStickyNotes(), loaded: false })
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    api.getStickyNotes()
      .then((response) => {
        if (active) setState({ data: response.stickyNotes, loaded: true })
      })
      .catch((requestError) => {
        if (active) setError(requestError)
        console.error(requestError)
      })
    return () => { active = false }
  }, [])

  const sync = useCallback((promise) => {
    promise
      .then((response) => setState({ data: response.stickyNotes, loaded: true }))
      .catch((requestError) => {
        setError(requestError)
        console.error(requestError)
      })
  }, [])

  const addStickyNote = useCallback((input) => sync(api.createStickyNote(input)), [sync])
  const updateStickyNote = useCallback((id, input) => sync(api.updateStickyNote(id, input)), [sync])
  const removeStickyNote = useCallback((id) => sync(api.deleteStickyNote(id)), [sync])

  return {
    notes: state.data,
    loading: !state.loaded,
    addStickyNote,
    updateStickyNote,
    removeStickyNote,
    error,
  }
}
