import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell
} from 'recharts'
import { useData } from '../hooks/useData'
import { useGlobalFilters } from '../hooks/useGlobalFilters'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import AIPanel from '../components/AIPanel'

const fmt = n => Number(n).toLocaleString('es-PE')
const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : '0%'

const COLORES = ['#4F86C6','#5BAD72','#9B72CF','#F4A261','#E07B7B','#4BC0C0','#F59E0B','#8B5CF6']

export default function Derivaciones() {
  const { rows, meta } = useData()
  const { aplicar } = useGlobalFilters()

  const data     = useMemo(() => aplicar(rows), [rows, aplicar])
  const derivados = useMemo(() => data.filter(r => r.DERIVAR === 'S'), [data])

  const stats = useMemo(() => {
    if (!derivados.length) return null

    // Por destino
    const destinos = {}
    derivados.forEach(r => {
      const d = r.TIPO_SESION_DESTINO || 'Sin especificar'
      destinos[d] = (destinos[d] || 0) + 1
    })
    const porDestino = Object.entries(destinos)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 12)
      .map(([d, t]) => ({ destino: d, total: t }))

    // Por eje origen
    const origenes = {}
    derivados.forEach(r => {
      origenes[r.tipo_label] = (origenes[r.tipo_label] || 0) + 1
    })
    const porOrigen = Object.entries(origenes)
      .sort((a,b) => b[1]-a[1])
      .map(([o, t], i) => ({ origen: o, total: t, color: COLORES[i] }))

    // Por facultad
    const facultades = {}
    derivados.forEach(r => {
      if (r.FACULTAD) facultades[r.FACULTAD] = (facultades[r.FACULTAD] || 0) + 1
    })
    const porFacultad = Object.entries(facultades)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 10)
      .map(([f, t]) => ({ facultad: f, total: t }))

    // Por semestre y eje
    const semestres = [...new Set(derivados.map(r => r.SEMESTRE))].sort()
    const heatmap = semestres.map(sem => {
      const sub = derivados.filter(r => r.SEMESTRE === sem)
      const row = { semestre: sem, total: sub.length }
      ;['aula','psicologica','espiritual','fisica'].forEach(t => {
        row[t] = sub.filter(r => r.tipo_tutoria === t).length
      })
      return row
    })

    // Flujo origen → destino (para tabla Sankey simplificada)
    const flujos = {}
    derivados.forEach(r => {
      const key = `${r.tipo_label} → ${r.TIPO_SESION_DESTINO || 'Sin especificar'}`
      flujos[key] = (flujos[key] || 0) + 1
    })
    const topFlujos = Object.entries(flujos)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 15)
      .map(([f, t]) => ({ flujo: f, total: t }))

    return { porDestino, porOrigen, porFacultad, heatmap, topFlujos, semestres }
  }, [derivados])

  if (!stats) return <p className="text-slate-400 p-4">Sin derivaciones para mostrar con los filtros actuales.</p>

  const tasaDeriv = pct(derivados.length, data.length)

  const aiStats = {
    total_derivaciones: derivados.length,
    tasa_derivacion: tasaDeriv,
    por_origen: stats.porOrigen.map(o => ({ origen: o.origen, total: o.total })),
    por_destino: stats.porDestino.slice(0,8).map(d => ({ destino: d.destino, total: d.total })),
    por_facultad: stats.porFacultad.slice(0,5).map(f => ({ facultad: f.facultad, total: f.total })),
    evolucion: stats.heatmap.map(h => ({ semestre: h.semestre, total: h.total })),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Derivaciones</h1>
        <p className="text-sm text-slate-500 mt-1">
          Análisis de los {fmt(derivados.length)} casos derivados ({tasaDeriv} del total)
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard value={fmt(derivados.length)} label="Total Derivaciones"   icon="🔀" color="#F4A261" />
        <KPICard value={tasaDeriv}             label="Tasa de Derivación"   icon="📊" color="#4F86C6"
          sub="del total de atenciones" />
        <KPICard value={stats.porDestino.length} label="Tipos de Destino"  icon="🎯" color="#5BAD72" />
        <KPICard value={stats.porFacultad.length} label="Facultades con Deriv." icon="🏛️" color="#9B72CF" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Por eje origen */}
        <ChartCard title="¿Quién deriva más?" subtitle="Derivaciones por eje de tutoría origen">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.porOrigen} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <YAxis dataKey="origen" type="category" width={130} tick={{ fontSize: 11 }} />
              <Tooltip formatter={fmt} />
              <Bar dataKey="total" name="Derivaciones" radius={[0,4,4,0]}>
                {stats.porOrigen.map((o, i) => <Cell key={i} fill={o.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Por destino */}
        <ChartCard title="¿A dónde se deriva?" subtitle="Tipo de sesión de destino">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.porDestino} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <YAxis dataKey="destino" type="category" width={180} tick={{ fontSize: 10 }} />
              <Tooltip formatter={fmt} />
              <Bar dataKey="total" name="Derivaciones" fill="#4F86C6" radius={[0,4,4,0]}>
                {stats.porDestino.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Por facultad */}
        <ChartCard title="Facultades con más derivaciones" subtitle="Top 10 facultades">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.porFacultad} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <YAxis dataKey="facultad" type="category" width={180} tick={{ fontSize: 10 }} />
              <Tooltip formatter={fmt} />
              <Bar dataKey="total" name="Derivaciones" fill="#5BAD72" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Evolución por semestre */}
        <ChartCard title="Evolución de Derivaciones por Semestre" subtitle="Por eje de tutoría">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.heatmap} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="semestre" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={fmt} />
              <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
              <Bar dataKey="aula"        name="Aula"        fill="#4F86C6" stackId="s" />
              <Bar dataKey="psicologica" name="Psicológica" fill="#5BAD72" stackId="s" />
              <Bar dataKey="espiritual"  name="Espiritual"  fill="#9B72CF" stackId="s" />
              <Bar dataKey="fisica"      name="Física"      fill="#F4A261" stackId="s" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Tabla de flujos */}
      <ChartCard title="Top Flujos de Derivación" subtitle="Origen → Destino más frecuentes">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs uppercase">#</th>
                <th className="text-left py-2 px-3 text-slate-500 font-semibold text-xs uppercase">Flujo (Origen → Destino)</th>
                <th className="text-right py-2 px-3 text-slate-500 font-semibold text-xs uppercase">Casos</th>
                <th className="text-right py-2 px-3 text-slate-500 font-semibold text-xs uppercase">% del total</th>
              </tr>
            </thead>
            <tbody>
              {stats.topFlujos.map((f, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-400">{i+1}</td>
                  <td className="py-2 px-3 font-medium text-slate-700">{f.flujo}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800">{fmt(f.total)}</td>
                  <td className="py-2 px-3 text-right">
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {pct(f.total, derivados.length)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <ChartCard title="Análisis IA de Derivaciones">
        <AIPanel stats={aiStats} tipo="derivaciones" titulo="Análisis de derivaciones" />
      </ChartCard>
    </div>
  )
}
