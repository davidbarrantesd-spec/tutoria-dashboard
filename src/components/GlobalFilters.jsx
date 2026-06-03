import { useMemo } from 'react'
import { useGlobalFilters } from '../hooks/useGlobalFilters'
import { useData } from '../hooks/useData'

const TIPOS = [
  { value: '',           label: 'Todos los ejes' },
  { value: 'aula',       label: 'Tutoría de Aula' },
  { value: 'psicologica',label: 'Psicológica' },
  { value: 'espiritual', label: 'Espiritual' },
  { value: 'fisica',     label: 'Física / Nutrición' },
]
const CRITICIDADES = [
  { value: '',        label: 'Cualquier nivel' },
  { value: 'critico', label: '🔴 Crítico' },
  { value: 'alto',    label: '🟠 Alto' },
  { value: 'medio',   label: '🟡 Medio' },
  { value: 'bajo',    label: '⚪ Bajo / Normal' },
]

export default function GlobalFilters() {
  const { filters, setFilter, limpiarFiltros, hayFiltros } = useGlobalFilters()
  const { meta } = useData()

  // Escuelas filtradas por facultad seleccionada
  const escuelasFiltradas = useMemo(() => {
    if (!meta) return []
    if (!filters.facultad) return meta.escuelas
    // Filtra del meta las escuelas que corresponden (aproximación — filtramos por lo que ya está en meta)
    return meta.escuelas
  }, [meta, filters.facultad])

  if (!meta) return null

  const años = [...new Set(meta.semestres.map(s => s.slice(0, 4)))].sort()

  const Select = ({ value, onChange, children }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700
                 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none cursor-pointer"
    >
      {children}
    </select>
  )

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filtros</span>

      <Select value={filters.año} onChange={v => setFilter('año', v)}>
        <option value="">Todos los años</option>
        {años.map(a => <option key={a} value={a}>{a}</option>)}
      </Select>

      <Select value={filters.semestre} onChange={v => setFilter('semestre', v)}>
        <option value="">Todos los semestres</option>
        {meta.semestres.map(s => <option key={s} value={s}>{s}</option>)}
      </Select>

      <Select value={filters.tipo_tutoria} onChange={v => setFilter('tipo_tutoria', v)}>
        {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </Select>

      <Select value={filters.facultad} onChange={v => setFilter('facultad', v)}>
        <option value="">Todas las facultades</option>
        {meta.facultades.map(f => <option key={f} value={f}>{f}</option>)}
      </Select>

      <Select value={filters.escuela} onChange={v => setFilter('escuela', v)}>
        <option value="">Todas las escuelas</option>
        {escuelasFiltradas.map(e => <option key={e} value={e}>{e}</option>)}
      </Select>

      <Select value={filters.derivado} onChange={v => setFilter('derivado', v)}>
        <option value="">Derivado: todos</option>
        <option value="S">✅ Derivados</option>
        <option value="N">❌ No derivados</option>
      </Select>

      <Select value={filters.criticidad} onChange={v => setFilter('criticidad', v)}>
        {CRITICIDADES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </Select>

      {hayFiltros && (
        <button
          onClick={limpiarFiltros}
          className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1.5
                     rounded border border-red-200 hover:bg-red-50 transition-colors"
        >
          ✕ Limpiar filtros
        </button>
      )}
    </div>
  )
}
