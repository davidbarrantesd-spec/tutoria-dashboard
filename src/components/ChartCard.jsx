export default function ChartCard({ title, subtitle, children, className = '', action }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 ${className}`}>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
