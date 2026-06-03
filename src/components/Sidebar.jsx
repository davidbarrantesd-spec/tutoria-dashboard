import { NavLink } from 'react-router-dom'
import { useGlobalFilters } from '../hooks/useGlobalFilters'

const NAV = [
  { to: '/sobre',         icon: '🏛️', label: 'Sobre la Tutoría' },
  { to: '/',              icon: '📊', label: 'Resumen Ejecutivo' },
  { to: '/derivaciones',  icon: '🔀', label: 'Derivaciones' },
  { to: '/tipo-tutoria',  icon: '🎓', label: 'Por Tipo de Tutoría' },
  { to: '/trayectoria',   icon: '🧭', label: 'Trayectoria Estudiante' },
  { to: '/percepcion',    icon: '📈', label: 'Percepción y Mejora' },
  { to: '/criticos',      icon: '🚨', label: 'Casos Críticos' },
  { to: '/desercion',     icon: '🚪', label: 'Riesgo de Deserción' },
  { to: '/configuracion', icon: '⚙️', label: 'Configuración' },
]

export default function Sidebar() {
  const { anonimizado, setAnonimizado } = useGlobalFilters()

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <div>
            <p className="font-bold text-sm leading-tight">Sistema de Tutoría</p>
            <p className="text-xs text-slate-400">Universidad Peruana Unión</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
               ${isActive
                 ? 'bg-blue-600 text-white shadow'
                 : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Toggle anonimización */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-300">Anonimización</p>
            <p className="text-xs text-slate-500">
              {anonimizado ? 'Nombres ocultos' : 'Nombres visibles'}
            </p>
          </div>
          <button
            onClick={() => setAnonimizado(v => !v)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              anonimizado ? 'bg-blue-500' : 'bg-slate-600'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
              ${anonimizado ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          🔒 Datos de salud — manejo responsable
        </p>
      </div>
    </aside>
  )
}
