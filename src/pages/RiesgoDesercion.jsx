import { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { useData } from '../hooks/useData'
import { useGlobalFilters } from '../hooks/useGlobalFilters'
import { extractoSeguro, mostrarEstudiante } from '../data/anonymizer'
import ChartCard from '../components/ChartCard'
import KPICard from '../components/KPICard'
import AIPanel from '../components/AIPanel'

const fmt  = n => Number(n).toLocaleString('es-PE')
const pct  = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : '0%'

// Palabras clave de deserción (ampliado)
const KEYWORDS_DESERCION = [
  'abandon', 'deserci', 'retiro de la carrera', 'quiere retirarse',
  'piensa retirarse', 'no quiere continuar', 'no acude', 'dejo de asistir',
  'dejó de asistir', 'inasistenc', 'discontinu', 'baja academica',
  'baja académica', 'no se presenta', 'no asiste', 'ausencia reiterada',
  'faltas reiteradas', 'piensa abandonar', 'quiere dejar', 'dejar la carrera',
  'suspender estudios', 'interrumpir estudios',
]

// Factores de riesgo adicionales que agravan la deserción
const FACTORES_RIESGO = {
  'Riesgo económico':    ['economico','económico','economica','económica','no puede pagar','deuda','trabaja para sostener','sin recursos','pension atrasada','pensión atrasada'],
  'Problema familiar':   ['divorci','conflicto familiar','abandono familiar','violencia familiar','padres separados','hogar disfuncional'],
  'Bajo rendimiento':    ['jalado','desaprobado','bajo rendimiento','notas bajas','perdio el semestre','perdió el semestre','retirado de curso'],
  'Salud mental':        ['depresion','depresión','ansiedad','crisis','desesperaci','no quiere vivir','triste','llanto'],
  'Falta de motivación': ['desmotivado','sin motivacion','sin motivación','no le gusta','equivocó de carrera','no es su vocacion'],
}

function esDesercion(row) {
  const texto = [row.OBSERVACION, row.MOTIVO, row.ACUERDO].join(' ').toLowerCase()
  return KEYWORDS_DESERCION.some(k => texto.includes(k))
}

function factoresDeRiesgo(row) {
  const texto = [row.OBSERVACION, row.MOTIVO, row.ACUERDO].join(' ').toLowerCase()
  return Object.entries(FACTORES_RIESGO)
    .filter(([, kws]) => kws.some(k => texto.includes(k)))
    .map(([factor]) => factor)
}

const COLORES = ['#EF4444','#F97316','#EAB308','#3B82F6','#8B5CF6','#10B981']
const TIPO_COLORES = { aula:'#4F86C6', psicologica:'#5BAD72', espiritual:'#9B72CF', fisica:'#F4A261' }

export default function RiesgoDesercion() {
  const { rows } = useData()
  const { aplicar, anonimizado } = useGlobalFilters()
  const [pagina, setPagina] = useState(0)
  const [tabActiva, setTabActiva] = useState('resumen')
  const POR_PAG = 15

  const data = useMemo(() => aplicar(rows), [rows, aplicar])

  const stats = useMemo(() => {
    if (!data.length) return null

    // Casos con señales de deserción
    const casosDeserc = data.filter(esDesercion).map(r => ({
      ...r,
      factores: factoresDeRiesgo(r),
    }))

    const total      = data.length
    const nDeserc    = casosDeserc.length
    const tasaDeserc = ((nDeserc / total) * 100).toFixed(1)

    // Estudiantes únicos en riesgo
    const estRiesgo  = new Set(casosDeserc.map(r => r.ID_ESTUDIANTE)).size

    // Estudiantes con 2+ atenciones de deserción (riesgo alto)
    const conteoEst = {}
    casosDeserc.forEach(r => {
      conteoEst[r.ID_ESTUDIANTE] = conteoEst[r.ID_ESTUDIANTE] || { id: r.ID_ESTUDIANTE, nombre: r.ESTUDIANTE, count: 0, ejes: new Set(), factores: new Set(), semestres: new Set() }
      conteoEst[r.ID_ESTUDIANTE].count++
      conteoEst[r.ID_ESTUDIANTE].ejes.add(r.tipo_label)
      r.factores.forEach(f => conteoEst[r.ID_ESTUDIANTE].factores.add(f))
      conteoEst[r.ID_ESTUDIANTE].semestres.add(r.SEMESTRE)
    })
    const multiRiesgo = Object.values(conteoEst)
      .filter(e => e.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)
      .map(e => ({ ...e, ejes: [...e.ejes], factores: [...e.factores], semestres: [...e.semestres] }))

    // Por semestre
    const semestres = [...new Set(data.map(r => r.SEMESTRE))].sort()
    const porSemestre = semestres.map(sem => {
      const total_sem  = data.filter(r => r.SEMESTRE === sem).length
      const riesgo_sem = casosDeserc.filter(r => r.SEMESTRE === sem).length
      return {
        semestre: sem,
        total: total_sem,
        riesgo: riesgo_sem,
        tasa: total_sem ? +((riesgo_sem / total_sem) * 100).toFixed(1) : 0,
      }
    })

    // Por facultad
    const porFacultad = {}
    casosDeserc.forEach(r => {
      if (!r.FACULTAD) return
      porFacultad[r.FACULTAD] = (porFacultad[r.FACULTAD] || 0) + 1
    })
    const topFacultad = Object.entries(porFacultad)
      .sort((a, b) => b[1] - a[1])
      .map(([f, n]) => ({ facultad: f, total: n }))

    // Por escuela
    const porEscuela = {}
    casosDeserc.forEach(r => {
      if (!r.ESCUELA) return
      porEscuela[r.ESCUELA] = (porEscuela[r.ESCUELA] || 0) + 1
    })
    const topEscuela = Object.entries(porEscuela)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([e, n]) => ({ escuela: e, total: n }))

    // Por eje
    const porEje = {}
    casosDeserc.forEach(r => {
      porEje[r.tipo_label] = (porEje[r.tipo_label] || 0) + 1
    })
    const porEjeArr = Object.entries(porEje)
      .sort((a, b) => b[1] - a[1])
      .map(([e, n]) => ({ eje: e, total: n, color: TIPO_COLORES[Object.keys(TIPO_COLORES).find(k => e.toLowerCase().includes(k))] || '#888' }))

    // Por ciclo
    const porCiclo = {}
    casosDeserc.forEach(r => {
      if (r.CICLO != null) porCiclo[r.CICLO] = (porCiclo[r.CICLO] || 0) + 1
    })
    const topCiclo = Object.entries(porCiclo)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([c, n]) => ({ ciclo: `Ciclo ${c}`, total: n }))

    // Factores de riesgo acumulados
    const factoresCount = {}
    casosDeserc.forEach(r => {
      r.factores.forEach(f => { factoresCount[f] = (factoresCount[f] || 0) + 1 })
    })
    const topFactores = Object.entries(factoresCount)
      .sort((a, b) => b[1] - a[1])
      .map(([f, n], i) => ({ factor: f, total: n, color: COLORES[i % COLORES.length] }))

    // Tabla de casos ordenados por score criticidad desc
    const tablaCasos = casosDeserc
      .sort((a, b) => b.criticidad_score - a.criticidad_score)

    return {
      nDeserc, tasaDeserc, estRiesgo, multiRiesgo,
      porSemestre, topFacultad, topEscuela, porEjeArr,
      topCiclo, topFactores, tablaCasos,
    }
  }, [data])

  if (!stats) return <p className="text-slate-400 p-4">Sin datos disponibles.</p>

  const paginas   = Math.ceil(stats.tablaCasos.length / POR_PAG)
  const filasPag  = stats.tablaCasos.slice(pagina * POR_PAG, (pagina + 1) * POR_PAG)

  const aiStats = {
    nota: 'Datos anonimizados y agregados — análisis de riesgo de deserción estudiantil',
    casos_con_senales_desercion: stats.nDeserc,
    tasa_desercion_estimada: stats.tasaDeserc + '%',
    estudiantes_unicos_en_riesgo: stats.estRiesgo,
    estudiantes_con_multiples_alertas: stats.multiRiesgo.length,
    por_semestre: stats.porSemestre,
    top_facultades: stats.topFacultad.slice(0, 5),
    top_escuelas: stats.topEscuela.slice(0, 5),
    factores_de_riesgo: stats.topFactores,
    por_ciclo: stats.topCiclo,
  }

  return (
    <div className="space-y-6">
      {/* Aviso */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-bold text-orange-800 text-sm">Detección automática por análisis de texto</p>
          <p className="text-xs text-orange-700 mt-1">
            Este dashboard detecta señales de riesgo de deserción en el texto de OBSERVACION.
            Es una <strong>estimación orientativa</strong> que requiere validación del equipo de tutoría.
            Puede haber falsos positivos (menciones preventivas, casos ya resueltos).
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">🚪 Riesgo de Deserción</h1>
        <p className="text-sm text-slate-500 mt-1">
          Identificación de estudiantes con señales de abandono o retiro — análisis de texto sobre {fmt(data.length)} atenciones
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard value={fmt(stats.nDeserc)}       label="Atenciones con señal de riesgo" icon="🚪" color="#EF4444"
          sub={`${stats.tasaDeserc}% del total`} />
        <KPICard value={fmt(stats.estRiesgo)}      label="Estudiantes únicos en riesgo"   icon="👤" color="#F97316" />
        <KPICard value={fmt(stats.multiRiesgo.length)} label="Con 2+ alertas registradas" icon="🔁" color="#8B5CF6"
          sub="Mayor prioridad de seguimiento" />
        <KPICard value={fmt(stats.topFactores.length)} label="Factores de riesgo detectados" icon="🔍" color="#3B82F6" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'resumen',   label: '📊 Resumen' },
          { id: 'factores',  label: '🔍 Factores de riesgo' },
          { id: 'escuelas',  label: '🏛️ Facultades & Escuelas' },
          { id: 'estudiantes', label: '👤 Estudiantes prioritarios' },
          { id: 'tabla',     label: '📋 Tabla de casos' },
        ].map(t => (
          <button key={t.id} onClick={() => { setTabActiva(t.id); setPagina(0) }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
              tabActiva === t.id
                ? 'bg-red-600 text-white border-red-600 shadow'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: RESUMEN ── */}
      {tabActiva === 'resumen' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Evolución por Semestre" subtitle="Casos con señal de deserción y tasa (%)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.porSemestre} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="semestre" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={v => v + '%'} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => n === 'tasa' ? v + '%' : fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left"  dataKey="riesgo" name="Casos deserción" fill="#EF4444" radius={[4,4,0,0]} />
                <Line yAxisId="right" type="monotone" dataKey="tasa" name="Tasa (%)" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Por Eje de Tutoría" subtitle="Distribución de casos de riesgo por eje">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.porEjeArr} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="eje" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <Tooltip formatter={fmt} />
                <Bar dataKey="total" name="Casos" radius={[4,4,0,0]}>
                  {stats.porEjeArr.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Por Ciclo Académico" subtitle="¿En qué ciclo se concentra el riesgo?">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.topCiclo} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="ciclo" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <Tooltip formatter={fmt} />
                <Bar dataKey="total" name="Casos" fill="#F97316" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Análisis IA" subtitle="Gemini analiza los patrones de riesgo">
            <AIPanel stats={aiStats} tipo="criticos" titulo="Riesgo de deserción" />
          </ChartCard>
        </div>
      )}

      {/* ── TAB: FACTORES ── */}
      {tabActiva === 'factores' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Factores de Riesgo Co-ocurrentes" subtitle="¿Qué agrava el riesgo de deserción?">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.topFactores} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <YAxis dataKey="factor" type="category" width={160} tick={{ fontSize: 11 }} />
                <Tooltip formatter={fmt} />
                <Bar dataKey="total" name="Casos" radius={[0,4,4,0]}>
                  {stats.topFactores.map((f, i) => <Cell key={i} fill={f.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Proporción de Factores" subtitle="Distribución porcentual">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stats.topFactores} dataKey="total" nameKey="factor"
                  cx="50%" cy="50%" outerRadius={100}
                  label={({ factor, percent }) => `${factor.split(' ')[0]}: ${(percent*100).toFixed(0)}%`}
                  labelLine={false}>
                  {stats.topFactores.map((f, i) => <Cell key={i} fill={f.color} />)}
                </Pie>
                <Tooltip formatter={fmt} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Descripción de cada factor */}
          <ChartCard title="Descripción de Factores Detectados" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(FACTORES_RIESGO).map(([factor, kws], i) => (
                <div key={factor} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORES[i % COLORES.length] }} />
                    <p className="text-sm font-semibold text-slate-700">{factor}</p>
                    <span className="ml-auto text-xs font-bold text-slate-500">
                      {fmt(stats.topFactores.find(f => f.factor === factor)?.total || 0)} casos
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Palabras clave: {kws.slice(0,5).join(', ')}…</p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* ── TAB: ESCUELAS ── */}
      {tabActiva === 'escuelas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Facultades con más Señales de Riesgo">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.topFacultad} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <YAxis dataKey="facultad" type="category" width={200} tick={{ fontSize: 10 }} />
                <Tooltip formatter={fmt} />
                <Bar dataKey="total" name="Casos riesgo" fill="#EF4444" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top 12 Escuelas con más Señales de Riesgo">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={stats.topEscuela} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                <YAxis dataKey="escuela" type="category" width={200} tick={{ fontSize: 9 }} />
                <Tooltip formatter={fmt} />
                <Bar dataKey="total" name="Casos riesgo" fill="#F97316" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ── TAB: ESTUDIANTES PRIORITARIOS ── */}
      {tabActiva === 'estudiantes' && (
        <ChartCard title="Estudiantes con 2+ Alertas de Deserción"
          subtitle="Prioridad alta de seguimiento — requiere contacto inmediato del tutor">
          {stats.multiRiesgo.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">No hay estudiantes con múltiples alertas en el filtro actual.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-red-50">
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs">#</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs">Estudiante</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs">Semestres</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs">Ejes atendidos</th>
                    <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs">Factores de riesgo</th>
                    <th className="text-center py-2 px-3 text-slate-500 font-semibold text-xs">Alertas</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.multiRiesgo.map((e, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-red-50 transition-colors">
                      <td className="py-2 px-3 text-slate-400 font-mono">{i + 1}</td>
                      <td className="py-2 px-3 font-mono text-blue-600 text-xs">
                        {mostrarEstudiante(e.nombre, e.id, anonimizado)}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-500">{e.semestres.join(', ')}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          {e.ejes.map(ej => (
                            <span key={ej} className="text-xs px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: TIPO_COLORES[Object.keys(TIPO_COLORES).find(k => ej.toLowerCase().includes(k))] || '#888' }}>
                              {ej.replace('Tutoría ', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          {e.factores.map(f => (
                            <span key={f} className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="bg-red-600 text-white font-bold text-xs px-2 py-1 rounded-full">
                          {e.count}×
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      )}

      {/* ── TAB: TABLA DE CASOS ── */}
      {tabActiva === 'tabla' && (
        <ChartCard title="Todos los Casos con Señal de Deserción"
          subtitle="Extractos completos anonimizados — datos sensibles, manejo responsable">
          <p className="text-xs text-slate-400 mb-3">
            {fmt(stats.tablaCasos.length)} registros · Página {pagina + 1} de {paginas || 1}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-2 px-2 text-slate-500 font-semibold">Estudiante</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-semibold">Eje / Semestre</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-semibold">Factores detectados</th>
                  <th className="text-left py-2 px-2 text-slate-500 font-semibold">Observación completa</th>
                </tr>
              </thead>
              <tbody>
                {filasPag.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-orange-50 align-top">
                    <td className="py-2 px-2 font-mono text-blue-600">
                      {mostrarEstudiante(r.ESTUDIANTE, r.ID_ESTUDIANTE, anonimizado)}
                    </td>
                    <td className="py-2 px-2">
                      <div className="text-slate-700 font-medium">{r.tipo_label}</div>
                      <div className="text-slate-400">{r.SEMESTRE}</div>
                      <div className="text-slate-400">{r.ESCUELA?.replace('EP ', '')}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {r.factores.map(f => (
                          <span key={f} className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs">
                            {f}
                          </span>
                        ))}
                        {r.factores.length === 0 && (
                          <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs">
                            Señal directa de abandono
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-slate-600" style={{ maxWidth: '420px' }}>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
                        {extractoSeguro(r.OBSERVACION, 99999)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginas > 1 && (
            <div className="flex items-center gap-2 mt-4 justify-center">
              <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-slate-50">
                ← Anterior
              </button>
              <span className="text-sm text-slate-500">{pagina + 1} / {paginas}</span>
              <button onClick={() => setPagina(p => Math.min(paginas - 1, p + 1))} disabled={pagina === paginas - 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-slate-50">
                Siguiente →
              </button>
            </div>
          )}
        </ChartCard>
      )}
    </div>
  )
}
