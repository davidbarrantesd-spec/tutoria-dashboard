/**
 * useGlobalFilters.js — solo lógica pura (sin JSX)
 * El Provider con JSX está en FiltersProvider.jsx
 */
import { createContext, useContext, useState, useMemo, useCallback } from 'react'

export const DEFAULTS = {
  semestre:     '',
  año:          '',
  facultad:     '',
  escuela:      '',
  tipo_tutoria: '',
  derivado:     '',
  criticidad:   '',
}

export const FiltersCtx = createContext(null)

export function useFiltersState() {
  const [filters, setFilters] = useState(DEFAULTS)
  const [anonimizado, setAnonimizado] = useState(true)
  const [excluirPrueba, setExcluirPrueba] = useState(false)

  const setFilter = useCallback((key, value) => {
    setFilters(f => {
      const next = { ...f, [key]: value }
      if (key === 'facultad') next.escuela = ''
      return next
    })
  }, [])

  const limpiarFiltros = useCallback(() => setFilters(DEFAULTS), [])

  const aplicar = useCallback((rows) => {
    if (!rows) return []
    return rows.filter(r => {
      if (filters.semestre     && r.SEMESTRE        !== filters.semestre)     return false
      if (filters.año          && r.año              !== filters.año)          return false
      if (filters.facultad     && r.FACULTAD         !== filters.facultad)     return false
      if (filters.escuela      && r.ESCUELA          !== filters.escuela)      return false
      if (filters.tipo_tutoria && r.tipo_tutoria     !== filters.tipo_tutoria) return false
      if (filters.derivado     && r.DERIVAR          !== filters.derivado)     return false
      if (filters.criticidad   && r.criticidad_nivel !== filters.criticidad)   return false
      return true
    })
  }, [filters])

  const hayFiltros = useMemo(
    () => Object.values(filters).some(v => v !== ''),
    [filters]
  )

  return {
    filters, setFilter, limpiarFiltros, aplicar, hayFiltros,
    anonimizado, setAnonimizado,
    excluirPrueba, setExcluirPrueba,
  }
}

export function useGlobalFilters() {
  const ctx = useContext(FiltersCtx)
  if (!ctx) throw new Error('useGlobalFilters debe usarse dentro de FiltersProvider')
  return ctx
}
