import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { useData } from '../hooks/useData'
import { useGlobalFilters } from '../hooks/useGlobalFilters'
import { SENTIMIENTO_COLOR } from '../data/sentiment'
import ChartCard from '../components/ChartCard'
import KPICard from '../components/KPICard'
import AIPanel from '../components/AIPanel'

const fmt = n => Number(n).toLocaleString('es-PE')
const pct = (a, b) => b ? ((a / b) * 100).toFixed(1) + '%' : '0%'

export default function PercepcionMejora() {
  const { rows } = useData()
  const { aplicar } = useGlobalFilters()
  const data = useMemo(() => aplicar(rows), [rows, aplicar])

  const stats = useMemo(() => {
    if (!data.length) return null

    // Distribución global de sentimiento
    const dist = { positivo: 0, neutral: 0, negativo: 0 }
    data.forEach(r => dist[r.sentimiento_label]++)
    const distArr = Object.entries(dist).map(([l, t]) => ({
      label: l, total: t,
      color: SENTIMIENTO_COLOR[l].hex,
    }))

    // Por semestre
    const semestres = [...new Set(data.map(r => r.SEMESTRE))].sort()
    const porSemestre = semestres.map(sem => {
      const sub = data.filter(r => r.SEMESTRE === sem)
      const pos = sub.filter(r => r.sentimiento_label === 'positivo').length
      const neg = sub.filter(r => r.sentimiento_label === 'negativo').length
      const neu = sub.filter(r => r.sentimiento_label === 'neutral').length
      const ratio = sub.length ? ((pos - neg) / sub.length * 100).toFixed(1) : 0
      return { semestre: sem, positivo: pos, negativo: neg, neutral: neu,
               total: sub.length, ratio: Number(ratio) }
    })

    // Por tipo de tutoría
    const tipoSent = {}
    data.forEach(r => {
      const k = r.tipo_label
      if (!tipoSent[k]) tipoSent[k] = { positivo: 0, neutral: 0, negativo: 0, total: 0, color: r.tipo_color }
      tipoSent[k][r.sentimiento_label]++
      tipoSent[k].total++
    })
    const porTipo = Object.entries(tipoSent).map(([tipo, v]) => ({
      tipo, ...v,
      pct_pos: pct(v.positivo, v.total),
      pct_neg: pct(v.negativo, v.total),
    }))

    // Recurrencia: estudiantes con 3+ sesiones
    const est = {}
    data.forEach(r => {
      const id = r.ID_ESTUDIANTE
      if (!est[id]) est[id] = { sesiones: [], sent: [] }
      est[id].sesiones.push(r.SEMESTRE)
      est[id].sent.push(r.sentimiento_score)
    })
    const recurrentes = Object.values(est).filter(e => e.sesiones.length >= 3)
    const mejora    = recurrentes.filter(e => {
      const first = e.sent[0], last = e.sent[e.sent.length-1]
      return last > first
    }).length
    const deterioro = recurrentes.filter(e => {
      const first = e.sent[0], last = e.sent[e.sent.length-1]
      return last < first
    }).length
    const estable = recurrentes.length - mejora - deterioro

    return { dist: distArr, porSemestre, porTipo, recurrentes: recurrentes.length,
             mejora, deterioro, estable }
  }, [data])

  if (!stats) return <p className="text-slate-400 p-4">Sin datos disponibles.</p>

  const aiStats = {
    advertencia: 'Esta es una estimación proxy basada en palabras clave, no un análisis psicológico real.',
    distribucion_sentimiento: stats.dist.map(d => ({ label: d.label, total: d.total })),
    por_semestre: stats.porSemestre.map(s => ({
      semestre: s.semestre,
      ratio_neto: s.ratio,
      positivo: s.positivo,
      negativo: s.negativo,
    })),
    estudiantes_recurrentes: stats.recurrentes,
    con_mejora_estimada: stats.mejora,
    con_deterioro_estimado: stats.deterioro,
    estables: stats.estable,
  }

  return (
    <div className="space-y-6">
      {/* Aviso */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <span className="text-xl">ℹ️</span>
        <p className="text-xs text-blue-700">
          <strong>Sentimiento proxy — ESTIMACIÓN.</strong> Detecta palabras positivas/negativas en el texto de
          OBSERVACION. No es un análisis psicológico profesional. Los resultados son orientativos para identificar
          tendencias generales, no casos individuales. Las cifras de "mejora" y "deterioro" son estimaciones.
        </p>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Percepción y Mejora</h1>
        <p className="text-sm text-slate-500 mt-1">Sentimiento proxy y recurrencia por semestre — estimaciones</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard value={fmt(stats.dist.find(d=>d.label==='positivo')?.total||0)}
          label="Registros Positivos (est.)" color="#16a34a" icon="😊"
          sub={pct(stats.dist.find(d=>d.label==='positivo')?.total||0, data.length)} />
        <KPICard value={fmt(stats.dist.find(d=>d.label==='negativo')?.total||0)}
          label="Registros Negativos (est.)" color="#dc2626" icon="😔"
          sub={pct(stats.dist.find(d=>d.label==='negativo')?.total||0, data.length)} />
        <KPICard value={fmt(stats.mejora)}    label="Con Mejora (est.)"    color="#5BAD72" icon="📈"
          sub="Estudiantes recurrentes" />
        <KPICard value={fmt(stats.deterioro)} label="Con Deterioro (est.)" color="#EF4444" icon="📉"
          sub="Requieren atención" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Distribución global */}
        <ChartCard title="Distribución de Sentimiento (est.)"
          subtitle="Basado en palabras clave en OBSERVACION">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.dist} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={fmt} />
              <Bar dataKey="total" name="Registros" radius={[4,4,0,0]}>
                {stats.dist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Ratio neto por semestre */}
        <ChartCard title="Ratio Sentimiento Neto por Semestre (est.)"
          subtitle="(positivos − negativos) / total · Positivo = tendencia favorable">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.porSemestre} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="semestre" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => v+'%'} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => v+'%'} />
              <Line type="monotone" dataKey="ratio" name="Ratio neto (%)"
                stroke="#4F86C6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Por semestre stacked */}
        <ChartCard title="Sentimiento por Semestre (est.)" subtitle="Positivo / Neutral / Negativo">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.porSemestre} margin={{ top: 8, right: 8, bottom: 40, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="semestre" angle={-35} textAnchor="end" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
              <Tooltip formatter={fmt} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="positivo" name="Positivo" fill="#16a34a" stackId="s" />
              <Bar dataKey="neutral"  name="Neutral"  fill="#94A3B8" stackId="s" />
              <Bar dataKey="negativo" name="Negativo" fill="#dc2626" stackId="s" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Por tipo de tutoría */}
        <ChartCard title="Sentimiento por Eje de Tutoría (est.)"
          subtitle="Comparativa de percepción entre ejes">
          <div className="space-y-3 mt-2">
            {stats.porTipo.map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">{t.tipo}</span>
                  <span className="text-slate-400">{fmt(t.total)} atenciones</span>
                </div>
                <div className="flex h-4 rounded-full overflow-hidden">
                  <div className="bg-green-500" style={{ width: pct(t.positivo, t.total) }}
                    title={`Positivo: ${pct(t.positivo, t.total)}`} />
                  <div className="bg-slate-300" style={{ width: pct(t.neutral, t.total) }}
                    title={`Neutral: ${pct(t.neutral, t.total)}`} />
                  <div className="bg-red-400" style={{ width: pct(t.negativo, t.total) }}
                    title={`Negativo: ${pct(t.negativo, t.total)}`} />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>😊 {t.pct_pos}</span>
                  <span>😔 {t.pct_neg}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block"/>Positivo</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-300 inline-block"/>Neutral</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block"/>Negativo</span>
          </div>
        </ChartCard>

      </div>

      {/* Recurrencia */}
      <ChartCard title="Análisis de Recurrencia" subtitle="Estudiantes con 3 o más atenciones">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Con mejora (est.)', val: stats.mejora, color: 'text-green-600', icon: '📈' },
            { label: 'Estables (est.)',   val: stats.estable,  color: 'text-blue-600',  icon: '➡️' },
            { label: 'Con deterioro (est.)', val: stats.deterioro, color: 'text-red-600', icon: '📉' },
          ].map(item => (
            <div key={item.label} className="text-center bg-slate-50 rounded-xl p-4">
              <p className="text-3xl mb-1">{item.icon}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{fmt(item.val)}</p>
              <p className="text-xs text-slate-500 mt-1">{item.label}</p>
              <p className="text-xs text-slate-400">{pct(item.val, stats.recurrentes)} de recurrentes</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 text-center">
          Total estudiantes recurrentes (≥3 sesiones): {fmt(stats.recurrentes)}
        </p>
      </ChartCard>

      <ChartCard title="Análisis IA de Percepción y Mejora">
        <AIPanel stats={aiStats} tipo="trayectoria" titulo="Análisis de percepción y mejora" />
      </ChartCard>
    </div>
  )
}
