/**
 * FiltersProvider.jsx — Proveedor de contexto de filtros globales (con JSX)
 */
import { FiltersCtx, useFiltersState } from './useGlobalFilters'

export function FiltersProvider({ children }) {
  const state = useFiltersState()
  return (
    <FiltersCtx.Provider value={state}>
      {children}
    </FiltersCtx.Provider>
  )
}
