import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useData } from '../hooks/useData'
import { useGlobalFilters } from '../hooks/useGlobalFilters'
import KPICard from '../components/KPICard'
import ChartCard from '../components/ChartCard'
import AIPanel from '../components/AIPanel'

const fmt = n => Number(n).toLocaleString('es-PE')
const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : '0%'

export default function ResumenEjecutivo() {
  const { rows, meta } = useData()
  const { aplicar } = useGlobalFilters()

  const data = useMemo(() => aplicar(rows), [rows, aplicar])

  const stats = useMemo(() => {
    if (!data.length) return null

    const total        = data.length
    const derivados    = data.filter(r => r.DERIVAR === 'S').length
    const estUnicos    = new Set(data.map(r => r.ID_ESTUDIANTE)).size
    const criticos     = data.filter(r => r.criticidad_nivel === 'critico').length
    const altos        = data.filter(r => r.criticidad_nivel === 'alto').length

    // Por tipo de tutoría
    const porTipo = ['aula','psicologica','espiritual','fisica'].map(tipo => {
      const sub = data.filter(r => r.tipo_tutoria === tipo)
      return {
        tipo,
        label: meta.porTipo.find(t => t.tipo === tipo)?.label || tipo,
        color: meta.porTipo.find(t => t.tipo === tipo)?.color || '#ccc',
        total: sub.length,
        derivados: sub.filter(r => r.DERIVAR === 'S').length,
      }
    })

    // Por semestre
    const semestres = [...new Set(data.map(r => r.SEMESTRE))].sort()
    const porSemestre = semestres.map(sem => {
      const sub = data.filter(r => r.SEMESTRE === sem)
      return {
        semestre: sem,
        total: sub.length,
        derivados: sub.filter(r => r.DERIVAR === 'S').length,
        criticos: sub.filter(r => r.criticidad_nivel === 'critico').length,
        aula:       sub.filter(r => r.tipo_tutoria === 'aula').length,
        psicologica:sub.filter(r => r.tipo_tutoria === 'psicologica').length,
        espiritual: sub.filter(r => r.tipo_tutoria === 'espiritual').length,
        fisica:     sub.filter(r => r.tipo_tutoria === 'fisica').length,
      }
    })

    // Por ciclo
    const ciclos = {}
    data.forEach(r => {
      if (r.CICLO != null) {
        ciclos[r.CICLO] = (ciclos[r.CICLO] || 0) + 1
      }
    })
    const porCiclo = Object.entries(ciclos)
      .sort((a,b) => Number(a[0]) - Number(b[0]))
      .map(([c, t]) => ({ ciclo: `Ciclo ${c}`, total: t }))

    return { total, derivados, estUnicos, criticos, altos, porTipo, porSemestre, porCiclo }
  }, [data, meta])

  if (!stats) return <p className="text-slate-400 p-4">Sin datos para mostrar.</p>

  const aiStats = {
    total_atenciones: stats.total,
    total_derivados: stats.derivados,
    estudiantes_unicos: stats.estUnicos,
    casos_criticos: stats.criticos,
    casos_altos: stats.altos,
    por_tipo: stats.porTipo.map(t => ({ tipo: t.label, total: t.total, derivados: t.derivados })),
    por_semestre: stats.porSemestre.map(s => ({ semestre: s.semestre, total: s.total })),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Resumen Ejecutivo</h1>
        <p className="text-sm text-slate-500 mt-1">
          Vista consolidada de los 4 ejes de tutoría · {fmt(stats.total)} atenciones
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPICard value={fmt(stats.total)}      label="Total Atenciones"     icon="📋" color="#4F86C6" />
        <KPICard value={fmt(stats.estUnicos)}  label="Estudiantes Únicos"   icon="👤" color="#5BAD72" />
        <KPICard value={fmt(stats.derivados)}  label="Casos Derivados"
          sub={pct(stats.derivados, stats.total)} icon="🔀" color="#F4A261" />
        <KPICard value={fmt(stats.criticos)}   label="Casos Críticos (est.)"
          sub="⚠️ Requiere validación" icon="🚨" color="#EF4444" />
        <KPICard value={fmt(stats.altos)}      label="Casos Altos (est.)"
          sub={pct(stats.altos, stats.total)} icon="🟠" color="#F97316" />
      </div>

      {/* KPIs por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.porTipo.map(t => (
          <KPICard
            key={t.tipo}
            value={fmt(t.total)}
            label={t.label}
            sub={`${fmt(t.derivados)} derivados (${pct(t.derivados, t.total)})`}
            color={t.color}
          />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard title="Atenciones por Semestre" subtitle="Evolución histórica por eje de tutoría">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.porSemestre} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="semestre" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="aula"        name="Aula"       fill="#4F86C6" stackId="a" />
              <Bar dataKey="psicologica" name="Psicológica" fill="#5BAD72" stackId="a" />
              <Bar dataKey="espiritual"  name="Espiritual"  fill="#9B72CF" stackId="a" />
              <Bar dataKey="fisica"      name="Física"      fill="#F4A261" stackId="a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribución por Eje de Tutoría" subtitle="Proporción de atenciones totales">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stats.porTipo}
                dataKey="total"
                nameKey="label"
                cx="50%" cy="50%"
                outerRadius={100}
                label={({ label, percent }) => `${label.split(' ')[1]}: ${(percent*100).toFixed(1)}%`}
                labelLine={false}
              >
                {stats.porTipo.map(t => <Cell key={t.tipo} fill={t.color} />)}
              </Pie>
              <Tooltip formatter={fmt} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Derivaciones y Casos Críticos por Semestre"
          subtitle="Tendencia de la complejidad de atenciones">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.porSemestre} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="semestre" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={fmt} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line type="monotone" dataKey="derivados" name="Derivados"
                stroke="#F4A261" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="criticos" name="Críticos (est.)"
                stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Atenciones por Ciclo Académico" subtitle="Concentración de casos por ciclo">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.porCiclo} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="ciclo" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={fmt} />
              <Bar dataKey="total" name="Atenciones" fill="#4F86C6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Panel IA */}
      <ChartCard title="Análisis Inteligente" subtitle="Claude analiza los datos filtrados actuales">
        <AIPanel stats={aiStats} tipo="resumen" titulo="Resumen ejecutivo" />
      </ChartCard>
    </div>
  )
}
