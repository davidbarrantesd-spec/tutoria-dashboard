/**
 * useData.js
 * Hook para cargar el dataset una sola vez y compartirlo en toda la app.
 * Usa un módulo-singleton para no recargar al navegar entre páginas.
 */
import { useState, useEffect } from 'react'
import { cargarTodo } from '../data/loader'

// Caché en módulo (persiste mientras la pestaña está abierta)
let _cache   = null
let _promise = null

export function useData(excluirPrueba = false) {
  const [state, setState] = useState({
    rows:     _cache?.rows     ?? null,
    meta:     _cache?.meta     ?? null,
    loading:  !_cache,
    error:    null,
    log:      [],
  })

  useEffect(() => {
    if (_cache) return  // ya cargado

    if (!_promise) {
      // Primera llamada: inicia la carga
      const msgs = []
      _promise = cargarTodo(
        (msg) => {
          msgs.push(msg)
          setState(s => ({ ...s, log: [...msgs] }))
        },
        excluirPrueba
      )
    }

    _promise
      .then(result => {
        _cache = result
        setState({ rows: result.rows, meta: result.meta, loading: false, error: null, log: [] })
      })
      .catch(err => {
        _promise = null
        setState(s => ({ ...s, loading: false, error: err.message }))
      })
  }, [])

  return state
}

/** Limpia la caché (útil si el usuario cambia el toggle excluirPrueba) */
export function limpiarCacheData() {
  _cache   = null
  _promise = null
}
