import { useMemo, useState } from 'react'
import { useData } from '../hooks/useData'
import { useGlobalFilters } from '../hooks/useGlobalFilters'
import { mostrarEstudiante, extractoSeguro } from '../data/anonymizer'
import { NIVEL_COLOR } from '../data/criticality'
import { SENTIMIENTO_COLOR } from '../data/sentiment'
import ChartCard from '../components/ChartCard'
import AIPanel from '../components/AIPanel'

const fmt = n => Number(n).toLocaleString('es-PE')

const TIPO_COLORES = {
  aula: '#4F86C6', psicologica: '#5BAD72', espiritual: '#9B72CF', fisica: '#F4A261'
}

export default function TrayectoriaEstudiante() {
  const { rows } = useData()
  const { aplicar, anonimizado } = useGlobalFilters()
  const [busqueda, setBusqueda]     = useState('')
  const [idSelec, setIdSelec]       = useState(null)
  const [resultados, setResultados] = useState([])

  const data = useMemo(() => aplicar(rows), [rows, aplicar])

  // Estudiantes que pasaron por 3+ ejes
  const multiEje = useMemo(() => {
    const est = {}
    data.forEach(r => {
      const id = r.ID_ESTUDIANTE
      if (!est[id]) est[id] = { id, nombre: r.ESTUDIANTE, ejes: new Set(), total: 0 }
      est[id].ejes.add(r.tipo_tutoria)
      est[id].total++
    })
    return Object.values(est)
      .filter(e => e.ejes.size >= 3)
      .sort((a,b) => b.ejes.size - a.ejes.size || b.total - a.total)
      .slice(0, 20)
      .map(e => ({ ...e, ejes: [...e.ejes] }))
  }, [data])

  // Trayectoria del estudiante seleccionado
  const trayectoria = useMemo(() => {
    if (!idSelec) return null
    const registros = data
      .filter(r => r.ID_ESTUDIANTE == idSelec)
      .sort((a,b) => (a.FEC_ATENCION || '').localeCompare(b.FEC_ATENCION || ''))
    if (!registros.length) return null

    const ejesVisitados = [...new Set(registros.map(r => r.tipo_tutoria))]
    const derivaciones  = registros.filter(r => r.DERIVAR === 'S').length
    const primero = registros[0]
    const ultimo  = registros[registros.length - 1]
    const evolucion = primero.sentimiento_label !== ultimo.sentimiento_label
      ? `${primero.sentimiento_label} → ${ultimo.sentimiento_label}`
      : primero.sentimiento_label

    return { registros, ejesVisitados, derivaciones, primero, ultimo, evolucion }
  }, [idSelec, data])

  function buscar(q) {
    setBusqueda(q)
    setIdSelec(null)
    if (!q.trim()) { setResultados([]); return }
    const lower = q.toLowerCase()
    // Buscar por ID o nombre (si no anonimizado)
    const encontrados = []
    const vistos = new Set()
    for (const r of data) {
      const id = String(r.ID_ESTUDIANTE)
      if (vistos.has(id)) continue
      const matchId   = id.includes(q)
      const matchNom  = !anonimizado && r.ESTUDIANTE.toLowerCase().includes(lower)
      if (matchId || matchNom) {
        vistos.add(id)
        encontrados.push({ id: r.ID_ESTUDIANTE, nombre: r.ESTUDIANTE })
        if (encontrados.length >= 10) break
      }
    }
    setResultados(encontrados)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Trayectoria del Estudiante</h1>
        <p className="text-sm text-slate-500 mt-1">
          Línea de tiempo por estudiante · Identifica recorridos por múltiples tutorías
        </p>
      </div>

      {/* Buscador */}
      <ChartCard title="Buscar Estudiante" subtitle={
        anonimizado ? 'Búsqueda por ID (activa anonimización OFF para buscar por nombre)' : 'Búsqueda por ID o nombre'
      }>
        <div className="relative mb-3">
          <input
            type="text"
            value={busqueda}
            onChange={e => buscar(e.target.value)}
            placeholder={anonimizado ? 'Ingresa ID de estudiante…' : 'ID o nombre del estudiante…'}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {busqueda && (
            <button onClick={() => { setBusqueda(''); setResultados([]); setIdSelec(null) }}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">✕</button>
          )}
        </div>

        {resultados.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {resultados.map((e, i) => (
              <button
                key={i}
                onClick={() => { setIdSelec(e.id); setResultados([]); setBusqueda(String(e.id)) }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-slate-100
                           last:border-0 transition-colors flex items-center justify-between"
              >
                <span className="font-mono text-blue-600">{mostrarEstudiante(e.nombre, e.id, anonimizado)}</span>
                <span className="text-slate-400 text-xs">ID: {e.id}</span>
              </button>
            ))}
          </div>
        )}
      </ChartCard>

      {/* Trayectoria */}
      {trayectoria && (
        <div className="space-y-4">
          {/* Resumen */}
          <ChartCard title={`Trayectoria: ${mostrarEstudiante(trayectoria.primero.ESTUDIANTE, idSelec, anonimizado)}`}
            subtitle={`${trayectoria.registros.length} atenciones · ${trayectoria.ejesVisitados.length} ejes · ${trayectoria.derivaciones} derivaciones`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-800">{trayectoria.registros.length}</p>
                <p className="text-xs text-slate-500 mt-1">Atenciones</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{trayectoria.ejesVisitados.length}</p>
                <p className="text-xs text-slate-500 mt-1">Tipos de tutoría</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-500">{trayectoria.derivaciones}</p>
                <p className="text-xs text-slate-500 mt-1">Derivaciones</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-sm font-bold text-slate-700">{trayectoria.evolucion}</p>
                <p className="text-xs text-slate-500 mt-1">Sentimiento (est.)</p>
              </div>
            </div>

            {/* Ejes visitados */}
            <div className="flex gap-2 flex-wrap mb-4">
              {trayectoria.ejesVisitados.map(e => (
                <span key={e} className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: TIPO_COLORES[e] || '#888' }}>
                  {e}
                </span>
              ))}
            </div>

            {/* Línea de tiempo */}
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pr-2">
              {trayectoria.registros.map((r, i) => {
                const nivel = NIVEL_COLOR[r.criticidad_nivel] || NIVEL_COLOR.bajo
                const sent  = SENTIMIENTO_COLOR[r.sentimiento_label]
                return (
                  <div key={i} className="flex gap-3">
                    {/* Línea temporal */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: TIPO_COLORES[r.tipo_tutoria] || '#888' }} />
                      {i < trayectoria.registros.length - 1 && (
                        <div className="w-0.5 flex-1 bg-slate-200 my-0.5" />
                      )}
                    </div>
                    {/* Contenido */}
                    <div className="flex-1 pb-3 border-b border-slate-100 last:border-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-400">{r.FEC_ATENCION || r.SEMESTRE}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: TIPO_COLORES[r.tipo_tutoria] || '#888' }}>
                          {r.tipo_label}
                        </span>
                        {r.DERIVAR === 'S' && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                            🔀 Derivado
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${nivel.bg} ${nivel.text}`}>
                          {r.criticidad_nivel}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sent?.bg} ${sent?.text}`}>
                          {r.sentimiento_label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {extractoSeguro(r.OBSERVACION, 200)}
                      </p>
                      {r.DERIVAR === 'S' && r.TIPO_SESION_DESTINO && (
                        <p className="text-xs text-orange-600 mt-1">
                          → Derivado a: <strong>{r.TIPO_SESION_DESTINO}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ChartCard>

          <ChartCard title="Análisis IA de esta Trayectoria">
            <AIPanel
              stats={{
                id_estudiante: idSelec,
                total_atenciones: trayectoria.registros.length,
                ejes_visitados: trayectoria.ejesVisitados,
                derivaciones: trayectoria.derivaciones,
                evolucion_sentimiento: trayectoria.evolucion,
                semestres: [...new Set(trayectoria.registros.map(r => r.SEMESTRE))],
                niveles_criticidad: trayectoria.registros.map(r => r.criticidad_nivel),
              }}
              tipo="trayectoria"
              titulo="Trayectoria del estudiante"
            />
          </ChartCard>
        </div>
      )}

      {/* Estudiantes multi-eje */}
      <ChartCard
        title="Estudiantes que pasaron por 3+ tipos de tutoría"
        subtitle="Casos de mayor complejidad de acompañamiento"
      >
        {multiEje.length === 0 ? (
          <p className="text-slate-400 text-sm">No hay estudiantes con 3+ ejes en el filtro actual.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs">#</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs">Estudiante</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs">Ejes visitados</th>
                  <th className="text-center py-2 px-3 text-slate-500 font-semibold text-xs">Atenciones</th>
                </tr>
              </thead>
              <tbody>
                {multiEje.map((e, i) => (
                  <tr key={i}
                    className="border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => { setIdSelec(e.id); setBusqueda(String(e.id)) }}
                  >
                    <td className="py-2 px-3 text-slate-400">{i+1}</td>
                    <td className="py-2 px-3 font-mono text-blue-600 text-xs">
                      {mostrarEstudiante(e.nombre, e.id, anonimizado)}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {e.ejes.map(ej => (
                          <span key={ej} className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: TIPO_COLORES[ej] || '#888' }}>
                            {ej}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-slate-700">{e.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  )
}
