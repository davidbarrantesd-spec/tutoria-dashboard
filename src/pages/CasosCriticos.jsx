import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { useData } from '../hooks/useData'
import { useGlobalFilters } from '../hooks/useGlobalFilters'
import { NIVEL_COLOR } from '../data/criticality'
import { extractoSeguro, mostrarEstudiante } from '../data/anonymizer'
import ChartCard from '../components/ChartCard'
import KPICard from '../components/KPICard'
import AIPanel from '../components/AIPanel'

const fmt = n => Number(n).toLocaleString('es-PE')

function NivelBadge({ nivel }) {
  const c = NIVEL_COLOR[nivel] || NIVEL_COLOR.bajo
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      {nivel === 'critico' ? '🔴 Crítico' : nivel === 'alto' ? '🟠 Alto' : nivel === 'medio' ? '🟡 Medio' : '⚪ Bajo'}
    </span>
  )
}

export default function CasosCriticos() {
  const { rows } = useData()
  const { aplicar, anonimizado } = useGlobalFilters()
  const [nivelFiltro, setNivelFiltro] = useState('critico')
  const [temaFiltro, setTemaFiltro]   = useState('')
  const [pagina, setPagina]           = useState(0)
  const POR_PAG = 20

  const data = useMemo(() => aplicar(rows), [rows, aplicar])

  const stats = useMemo(() => {
    const criticos = data.filter(r => r.criticidad_nivel === 'critico')
    const altos    = data.filter(r => r.criticidad_nivel === 'alto')
    const medios   = data.filter(r => r.criticidad_nivel === 'medio')
    const noCrit   = data.filter(r => ['critico','alto','medio'].includes(r.criticidad_nivel))

    // Temas detectados
    const temas = {}
    noCrit.forEach(r => {
      r.criticidad_temas.forEach(t => {
        temas[t] = (temas[t] || 0) + 1
      })
    })
    const porTema = Object.entries(temas)
      .sort((a,b) => b[1]-a[1])
      .map(([t, n]) => ({ tema: t, total: n }))

    // Por eje
    const porEje = {}
    noCrit.forEach(r => {
      porEje[r.tipo_label] = (porEje[r.tipo_label] || 0) + 1
    })
    const porEjeArr = Object.entries(porEje)
      .sort((a,b) => b[1]-a[1])
      .map(([e, n]) => ({ eje: e, total: n }))

    // Estudiantes con múltiples atenciones críticas
    const estCrit = {}
    noCrit.forEach(r => {
      const id = r.ID_ESTUDIANTE
      if (!estCrit[id]) estCrit[id] = { id, nombre: r.ESTUDIANTE, count: 0, ejes: new Set() }
      estCrit[id].count++
      estCrit[id].ejes.add(r.tipo_label)
    })
    const multiCrit = Object.values(estCrit)
      .filter(e => e.count >= 2)
      .sort((a,b) => b.count-a.count)
      .slice(0, 10)
      .map(e => ({ ...e, ejes: [...e.ejes] }))

    return { criticos: criticos.length, altos: altos.length, medios: medios.length,
             total: noCrit.length, porTema, porEjeArr, multiCrit }
  }, [data])

  // Filas filtradas para la tabla
  const filasFiltradas = useMemo(() => {
    return data
      .filter(r => r.criticidad_nivel === nivelFiltro || nivelFiltro === '')
      .filter(r => !temaFiltro || r.criticidad_temas.includes(temaFiltro))
      .filter(r => r.criticidad_nivel !== 'bajo')
      .sort((a,b) => b.criticidad_score - a.criticidad_score)
  }, [data, nivelFiltro, temaFiltro])

  const paginas = Math.ceil(filasFiltradas.length / POR_PAG)
  const filasPag = filasFiltradas.slice(pagina * POR_PAG, (pagina+1) * POR_PAG)

  if (!stats) return <p className="text-slate-400 p-4">Sin datos disponibles.</p>

  const aiStats = {
    casos_criticos: stats.criticos,
    casos_altos: stats.altos,
    casos_medios: stats.medios,
    por_tema: stats.porTema.slice(0,8),
    por_eje: stats.porEjeArr,
    estudiantes_con_multiples_casos: stats.multiCrit.length,
  }

  return (
    <div className="space-y-6">
      {/* Aviso importante */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-bold text-amber-800 text-sm">Estimación automática por análisis de texto</p>
          <p className="text-xs text-amber-700 mt-1">
            Esta clasificación detecta palabras clave en los registros de observación.
            <strong> Requiere validación profesional</strong> — habrá falsos positivos.
            Es una herramienta de <em>triage</em>, no un diagnóstico. Usa el botón "Trabajar con IA"
            para que Claude contextualice cada caso.
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Casos Críticos</h1>
        <p className="text-sm text-slate-500 mt-1">
          Detección automática por análisis de texto · {fmt(stats.total)} registros con señales de alerta
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard value={fmt(stats.criticos)} label="Nivel Crítico (≥5 pts)"  icon="🔴" color="#EF4444"
          sub="Revisión urgente" />
        <KPICard value={fmt(stats.altos)}    label="Nivel Alto (3–4 pts)"    icon="🟠" color="#F97316" />
        <KPICard value={fmt(stats.medios)}   label="Nivel Medio (1–2 pts)"   icon="🟡" color="#EAB308" />
        <KPICard value={fmt(stats.multiCrit.length)} label="Multiples atenciones"
          sub="2+ registros críticos" icon="👁️" color="#9B72CF" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Por tema */}
        <ChartCard title="Temas Detectados" subtitle="Frecuencia de cada categoría de riesgo">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.porTema} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <YAxis dataKey="tema" type="category" width={200} tick={{ fontSize: 10 }} />
              <Tooltip formatter={fmt} />
              <Bar dataKey="total" name="Casos" radius={[0,4,4,0]}>
                {stats.porTema.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#EF4444' : i === 1 ? '#F97316' : '#EAB308'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Por eje */}
        <ChartCard title="Por Eje de Tutoría" subtitle="Distribución de casos críticos/altos/medios por eje">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.porEjeArr} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="eje" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={fmt} />
              <Bar dataKey="total" name="Casos" fill="#F97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Estudiantes con múltiples casos */}
          {stats.multiCrit.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Estudiantes con múltiples atenciones críticas
              </p>
              <div className="space-y-1">
                {stats.multiCrit.slice(0,5).map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-mono">
                      {mostrarEstudiante(e.nombre, e.id, anonimizado)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{e.ejes.join(', ')}</span>
                      <span className="bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                        {e.count}×
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

      </div>

      {/* Tabla de casos */}
      <ChartCard
        title="Tabla de Casos por Nivel de Riesgo"
        subtitle="Extractos anonimizados — datos sensibles de salud, tratar con responsabilidad"
        action={
          <div className="flex gap-2 flex-wrap">
            {['critico','alto','medio',''].map(n => (
              <button
                key={n}
                onClick={() => { setNivelFiltro(n); setPagina(0) }}
                className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors
                  ${nivelFiltro === n
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {n === '' ? 'Todos' : n === 'critico' ? '🔴 Crítico' : n === 'alto' ? '🟠 Alto' : '🟡 Medio'}
              </button>
            ))}
          </div>
        }
      >
        {/* Filtro por tema */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() => { setTemaFiltro(''); setPagina(0) }}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              !temaFiltro ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            Todos los temas
          </button>
          {stats.porTema.map(t => (
            <button
              key={t.tema}
              onClick={() => { setTemaFiltro(t.tema); setPagina(0) }}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                temaFiltro === t.tema ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {t.tema} ({fmt(t.total)})
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-400 mb-3">
          Mostrando {filasFiltradas.length.toLocaleString()} casos · Página {pagina+1} de {paginas || 1}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-2 px-2 text-slate-500 font-semibold">Nivel</th>
                <th className="text-left py-2 px-2 text-slate-500 font-semibold">Estudiante</th>
                <th className="text-left py-2 px-2 text-slate-500 font-semibold">Eje / Tutor</th>
                <th className="text-left py-2 px-2 text-slate-500 font-semibold">Semestre</th>
                <th className="text-left py-2 px-2 text-slate-500 font-semibold">Temas detectados</th>
                <th className="text-left py-2 px-2 text-slate-500 font-semibold">Extracto observación</th>
              </tr>
            </thead>
            <tbody>
              {filasPag.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-red-50 transition-colors">
                  <td className="py-2 px-2"><NivelBadge nivel={r.criticidad_nivel} /></td>
                  <td className="py-2 px-2 font-mono text-slate-600">
                    {mostrarEstudiante(r.ESTUDIANTE, r.ID_ESTUDIANTE, anonimizado)}
                  </td>
                  <td className="py-2 px-2">
                    <div className="text-slate-700 font-medium">{r.tipo_label}</div>
                    <div className="text-slate-400">{r.TUTOR ? r.TUTOR.split(' ')[0] : '—'}</div>
                  </td>
                  <td className="py-2 px-2 text-slate-600">{r.SEMESTRE}</td>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                      {r.criticidad_temas.slice(0,2).map(t => (
                        <span key={t} className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs">
                          {t.split('/')[0].trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-slate-600" style={{maxWidth: '420px'}}>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {extractoSeguro(r.OBSERVACION, 99999)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {paginas > 1 && (
          <div className="flex items-center gap-2 mt-4 justify-center">
            <button onClick={() => setPagina(p => Math.max(0, p-1))} disabled={pagina === 0}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-slate-50">
              ← Anterior
            </button>
            <span className="text-sm text-slate-500">{pagina+1} / {paginas}</span>
            <button onClick={() => setPagina(p => Math.min(paginas-1, p+1))} disabled={pagina === paginas-1}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-slate-50">
              Siguiente →
            </button>
          </div>
        )}
      </ChartCard>

      <ChartCard title="Análisis IA de Casos Críticos"
        subtitle="Claude puede contextualizar y priorizar estos casos (datos anonimizados)">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-700">
          🔒 Solo se enviarán estadísticas agregadas y extractos anonimizados. Nunca nombres reales.
        </div>
        <AIPanel stats={aiStats} tipo="criticos" titulo="Casos críticos detectados" />
      </ChartCard>
    </div>
  )
}
