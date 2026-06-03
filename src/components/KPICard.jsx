export default function KPICard({ value, label, sub, color = '#4F86C6', icon, trend }) {
  return (
    <div
      className="bg-white rounded-xl p-5 shadow-sm border border-slate-100
                 hover:shadow-md transition-shadow flex flex-col gap-1"
      style={{ borderLeftWidth: 5, borderLeftColor: color }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-extrabold text-slate-800 leading-none">{value}</p>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-2">{label}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        {icon && <span className="text-3xl opacity-80">{icon}</span>}
      </div>
      {trend !== undefined && (
        <div className={`text-xs font-medium mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs semestre anterior
        </div>
      )}
    </div>
  )
}
