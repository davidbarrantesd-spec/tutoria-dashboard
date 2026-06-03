import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { useData } from '../hooks/useData'
import { useGlobalFilters } from '../hooks/useGlobalFilters'
import { FUENTES } from '../data/loader'
import ChartCard from '../components/ChartCard'
import KPICard from '../components/KPICard'
import AIPanel from '../components/AIPanel'
import { extractoSeguro } from '../data/anonymizer'

const fmt = n => Number(n).toLocaleString('es-PE')
const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : '0%'

export default function PorTipoTutoria() {
  const { rows, meta } = useData()
  const { aplicar } = useGlobalFilters()
  const [tipoActivo, setTipoActivo] = useState('aula')

  const data = useMemo(() => aplicar(rows), [rows, aplicar])
  const subdata = useMemo(() => data.filter(r => r.tipo_tutoria === tipoActivo), [data, tipoActivo])

  const fuente = FUENTES.find(f => f.tipo_tutoria === tipoActivo)
  const metaTipo = meta?.porTipo?.find(t => t.tipo === tipoActivo)

  const stats = useMemo(() => {
    if (!subdata.length) return null

    // Top tutores
    const tutores = {}
    subdata.forEach(r => {
      const k = r.TUTOR || 'Sin asignar'
      if (!tutores[k]) tutores[k] = { tutor: k, total: 0, derivados: 0 }
      tutores[k].total++
      if (r.DERIVAR === 'S') tutores[k].derivados++
    })
    const topTutores = Object.values(tutores)
      .sort((a,b) => b.total - a.total)
      .slice(0, 15)

    // Por escuela
    const escuelas = {}
    subdata.forEach(r => {
      if (r.ESCUELA) escuelas[r.ESCUELA] = (escuelas[r.ESCUELA] || 0) + 1
    })
    const porEscuela = Object.entries(escuelas)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 10)
      .map(([e, t]) => ({ escuela: e, total: t }))

    // Criticidad dentro del tipo
    const criticos = subdata.filter(r => r.criticidad_nivel === 'critico').length
    const altos    = subdata.filter(r => r.criticidad_nivel === 'alto').length

    // Casos frecuentes (mayor recurrencia por ID_ESTUDIANTE)
    const estCount = {}
    subdata.forEach(r => {
      estCount[r.ID_ESTUDIANTE] = (estCount[r.ID_ESTUDIANTE] || 0) + 1
    })
    const recurrentes = Object.entries(estCount)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 5)
      .map(([id, cnt]) => ({ id, cnt }))

    // Ejemplos de observaciones (top críticos)
    const ejemplos = subdata
      .filter(r => r.criticidad_nivel === 'critico' || r.criticidad_nivel === 'alto')
      .slice(0, 5)

    // Por semestre
    const semestres = [...new Set(subdata.map(r => r.SEMESTRE))].sort()
    const porSemestre = semestres.map(s => ({
      semestre: s,
      total:     subdata.filter(r => r.SEMESTRE === s).length,
      derivados: subdata.filter(r => r.SEMESTRE === s && r.DERIVAR === 'S').length,
      criticos:  subdata.filter(r => r.SEMESTRE === s && r.criticidad_nivel === 'critico').length,
    }))

    return { topTutores, porEscuela, criticos, altos, recurrentes, ejemplos, porSemestre }
  }, [subdata])

  const aiStats = {
    tipo: metaTipo?.label,
    total: subdata.length,
    derivados: subdata.filter(r => r.DERIVAR === 'S').length,
    criticos: stats?.criticos,
    altos: stats?.altos,
    top_tutores: stats?.topTutores?.slice(0,5).map(t => ({ tutor: t.tutor.split(' ')[0], total: t.total })),
    por_escuela: stats?.porEscuela?.slice(0,5),
    evolucion: stats?.porSemestre,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Por Tipo de Tutoría</h1>
        <p className="text-sm text-slate-500 mt-1">Análisis detallado por eje de atención</p>
      </div>

      {/* Selector de tipo */}
      <div className="flex flex-wrap gap-2">
        {FUENTES.map(f => (
          <button
            key={f.tipo_tutoria}
            onClick={() => setTipoActivo(f.tipo_tutoria)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              tipoActivo === f.tipo_tutoria
                ? 'text-white shadow-md scale-105'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
            style={tipoActivo === f.tipo_tutoria ? { backgroundColor: f.color, borderColor: f.color } : {}}
          >
            {f.label}
            <span className="ml-2 opacity-70 text-xs">
              ({fmt(data.filter(r => r.tipo_tutoria === f.tipo_tutoria).length)})
            </span>
          </button>
        ))}
      </div>

      {!stats ? (
        <p className="text-slate-400 p-4">Sin datos para este tipo con los filtros actuales.</p>
      ) : (
        <>
          {/* KPIs del tipo activo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard value={fmt(subdata.length)} label="Atenciones" color={fuente?.color} />
            <KPICard value={fmt(subdata.filter(r => r.DERIVAR === 'S').length)} label="Derivados"
              sub={pct(subdata.filter(r => r.DERIVAR === 'S').length, subdata.length)} color={fuente?.color} />
            <KPICard value={fmt(stats.criticos)} label="Críticos (est.)" color="#EF4444" icon="🚨" />
            <KPICard value={new Set(subdata.map(r => r.ID_ESTUDIANTE)).size.toLocaleString()}
              label="Estudiantes únicos" color={fuente?.color} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top tutores */}
            <ChartCard title={`Top Tutores — ${metaTipo?.label}`}
              subtitle="Atenciones registradas por profesional">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.topTutores} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="tutor" type="category" width={160} tick={{ fontSize: 9 }} />
                  <Tooltip
                    formatter={(v, n) => [fmt(v), n === 'total' ? 'Atenciones' : 'Derivados']}
                  />
                  <Bar dataKey="total" name="Atenciones" radius={[0,4,4,0]}>
                    {stats.topTutores.map((_, i) => (
                      <Cell key={i} fill={fuente?.color} opacity={0.7 + (i === 0 ? 0.3 : 0)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Por escuela */}
            <ChartCard title="Top Escuelas con más Atenciones"
              subtitle="Distribución por carrera profesional">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.porEscuela} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="escuela" type="category" width={170} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={fmt} />
                  <Bar dataKey="total" name="Atenciones" fill={fuente?.color} opacity={0.85} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Evolución semestral */}
            <ChartCard title="Evolución por Semestre"
              subtitle="Atenciones, derivaciones y casos críticos (est.)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.porSemestre} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="semestre" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={fmt} />
                  <Bar dataKey="total"    name="Total"    fill={fuente?.color} opacity={0.8} />
                  <Bar dataKey="derivados" name="Derivados" fill="#F4A261" opacity={0.8} />
                  <Bar dataKey="criticos"  name="Críticos"  fill="#EF4444" opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Ejemplos de casos */}
            <ChartCard title="Ejemplos de Casos Críticos/Altos"
              subtitle="Extractos anonimizados — solo para análisis profesional">
              <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                {stats.ejemplos.length === 0 && (
                  <p className="text-slate-400 text-sm">No hay casos críticos o altos en este filtro.</p>
                )}
                {stats.ejemplos.map((r, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                        ${r.criticidad_nivel === 'critico' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {r.criticidad_nivel === 'critico' ? '🔴 Crítico' : '🟠 Alto'}
                      </span>
                      <span className="text-xs text-slate-400">{r.SEMESTRE} · {r.ESCUELA}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {extractoSeguro(r.OBSERVACION, 250)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {r.criticidad_temas.map(t => (
                        <span key={t} className="bg-red-50 text-red-600 text-xs px-1.5 py-0.5 rounded">
                          {t.split('/')[0].trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

          </div>

          <ChartCard title={`Análisis IA — ${metaTipo?.label}`}>
            <AIPanel stats={aiStats} tipo="general" titulo={`Análisis de ${metaTipo?.label}`} />
          </ChartCard>
        </>
      )}
    </div>
  )
}
