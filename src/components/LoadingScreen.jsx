import { useState, useEffect } from 'react'

export default function LoadingScreen() {
  const [segundos, setSegundos] = useState(10)

  useEffect(() => {
    if (segundos <= 0) return
    const t = setTimeout(() => setSegundos(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [segundos])

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-6">

        {/* Spinner con número en el centro */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            {segundos > 0
              ? <span className="text-xl font-bold text-blue-500">{segundos}</span>
              : <span className="text-xs font-semibold text-slate-400 text-center leading-tight">casi<br/>listo</span>
            }
          </div>
        </div>

        <div className="text-center">
          <p className="font-semibold text-slate-600 text-sm">Sistema de Tutoría</p>
          <p className="text-xs text-slate-400 mt-1">Universidad Peruana Unión</p>
        </div>

      </div>
    </div>
  )
}
