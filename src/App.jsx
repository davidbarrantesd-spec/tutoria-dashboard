import { HashRouter, Routes, Route } from 'react-router-dom'
import { FiltersProvider } from './hooks/FiltersProvider'
import { useData } from './hooks/useData'
import Sidebar from './components/Sidebar'
import GlobalFilters from './components/GlobalFilters'
import LoadingScreen from './components/LoadingScreen'
import { lazy, Suspense } from 'react'

const SobreTutoria          = lazy(() => import('./pages/SobreTutoria'))
const ResumenEjecutivo      = lazy(() => import('./pages/ResumenEjecutivo'))
const Derivaciones          = lazy(() => import('./pages/Derivaciones'))
const PorTipoTutoria        = lazy(() => import('./pages/PorTipoTutoria'))
const TrayectoriaEstudiante = lazy(() => import('./pages/TrayectoriaEstudiante'))
const PercepcionMejora      = lazy(() => import('./pages/PercepcionMejora'))
const CasosCriticos         = lazy(() => import('./pages/CasosCriticos'))
const RiesgoDesercion       = lazy(() => import('./pages/RiesgoDesercion'))
const Configuracion         = lazy(() => import('./pages/Configuracion'))

function AppLayout() {
  const { loading, log, error } = useData()

  if (loading) return <LoadingScreen log={log} />
  if (error)   return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg text-center">
        <p className="text-4xl mb-3">❌</p>
        <p className="font-bold text-red-700 mb-2">Error al cargar los datos</p>
        <p className="text-sm text-red-600">{error}</p>
        <p className="text-xs text-slate-500 mt-3">
          Asegúrate de que los 4 archivos .xlsx estén en <code>/public/data/</code>
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <GlobalFilters />
        <main className="flex-1 p-6 overflow-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64 text-slate-400">
              Cargando vista…
            </div>
          }>
            <Routes>
              <Route path="/sobre"         element={<SobreTutoria />} />
              <Route path="/"              element={<ResumenEjecutivo />} />
              <Route path="/derivaciones"  element={<Derivaciones />} />
              <Route path="/tipo-tutoria"  element={<PorTipoTutoria />} />
              <Route path="/trayectoria"   element={<TrayectoriaEstudiante />} />
              <Route path="/percepcion"    element={<PercepcionMejora />} />
              <Route path="/criticos"      element={<CasosCriticos />} />
              <Route path="/desercion"     element={<RiesgoDesercion />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <FiltersProvider>
        <AppLayout />
      </FiltersProvider>
    </HashRouter>
  )
}
