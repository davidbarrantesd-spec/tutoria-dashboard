export default function LoadingScreen({ log = [] }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full mx-4">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
        </div>
        <h2 className="text-center font-bold text-slate-700 text-lg mb-2">
          Cargando datos de tutoría…
        </h2>
        <p className="text-center text-sm text-slate-400 mb-6">
          Procesando los 4 archivos Excel (~45 000 registros)
        </p>
        <div className="bg-slate-50 rounded-lg p-3 space-y-1 min-h-[80px]">
          {log.map((msg, i) => (
            <p key={i} className="text-xs text-slate-500 font-mono">
              {i === log.length - 1 ? '⟳ ' : '✓ '}{msg}
            </p>
          ))}
          {log.length === 0 && (
            <p className="text-xs text-slate-400 font-mono">Iniciando…</p>
          )}
        </div>
      </div>
    </div>
  )
}
