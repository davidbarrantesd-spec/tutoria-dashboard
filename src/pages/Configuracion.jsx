import { useState } from 'react'
import { getApiKey, setApiKey, clearApiKey, tieneApiKey, llamarGemini } from '../lib/gemini'
import { useGlobalFilters } from '../hooks/useGlobalFilters'
import { limpiarCacheData } from '../hooks/useData'

export default function Configuracion() {
  const [apiKey, setApiKeyLocal] = useState(getApiKey())
  const [saved, setSaved]        = useState(false)
  const [testando, setTestando]  = useState(false)
  const [testResult, setTestResult] = useState('')
  const { excluirPrueba, setExcluirPrueba, anonimizado, setAnonimizado } = useGlobalFilters()

  function guardarKey() {
    setApiKey(apiKey)
    setSaved(true)
    setTestResult('')
    setTimeout(() => setSaved(false), 2500)
  }

  function borrarKey() {
    clearApiKey()
    setApiKeyLocal('')
    setTestResult('')
  }

  async function testearKey() {
    setTestando(true)
    setTestResult('')
    try {
      const resp = await llamarGemini(
        [{ role: 'user', content: 'Responde solo con el texto: Conexión exitosa ✅' }],
        ''
      )
      setTestResult(`✅ ${resp}`)
    } catch(e) {
      setTestResult(`❌ ${e.message}`)
    } finally {
      setTestando(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1">API key de OpenRouter, privacidad y ajustes del sistema</p>
      </div>

      {/* Cómo obtener la key */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h2 className="font-bold text-blue-800 mb-2">🔑 ¿Cómo obtener tu API key de OpenRouter? (GRATIS)</h2>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>Ve a <strong>openrouter.ai</strong> y crea una cuenta (puedes usar Google)</li>
          <li>Ve a <strong>openrouter.ai/keys</strong> → haz clic en <strong>"Create Key"</strong></li>
          <li>Copia la key (empieza con <code className="bg-blue-100 px-1 rounded">sk-or-v1-…</code>) y pégala aquí abajo</li>
        </ol>
        <div className="mt-2 text-xs text-blue-600 bg-blue-100 rounded-lg p-2">
          🎁 <strong>Sin tarjeta de crédito</strong> · Modelos gratuitos disponibles · Llama 3.3 70B · OpenRouter
        </div>
      </div>

      {/* API Key */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-700 mb-1">🤖 API Key de OpenRouter</h2>
        <p className="text-xs text-slate-500 mb-4">
          Se guarda en <code className="bg-slate-100 px-1 rounded">localStorage</code> de tu navegador —
          nunca sale de tu computadora ni se envía a ningún servidor externo salvo OpenRouter.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">
              API Key (empieza con sk-or-v1-…)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKeyLocal(e.target.value)}
              placeholder="sk-or-v1-…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono
                         focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={guardarKey}
              disabled={!apiKey.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                         rounded-lg disabled:opacity-40 transition-colors"
            >
              {saved ? '✅ Guardada' : '💾 Guardar API Key'}
            </button>

            {tieneApiKey() && (
              <>
                <button
                  onClick={testearKey}
                  disabled={testando}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold
                             rounded-lg disabled:opacity-50 transition-colors"
                >
                  {testando ? '⏳ Probando…' : '🧪 Probar conexión'}
                </button>
                <button
                  onClick={borrarKey}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold
                             rounded-lg border border-red-200 transition-colors"
                >
                  🗑️ Borrar Key
                </button>
              </>
            )}
          </div>

          {testResult && (
            <div className={`rounded-lg p-3 text-sm font-medium whitespace-pre-wrap ${
              testResult.startsWith('✅')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {testResult}
            </div>
          )}
        </div>
      </div>

      {/* Privacidad */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-700 mb-4">🔒 Privacidad y Datos</h2>
        <div className="space-y-4">

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-slate-700">Anonimización de nombres</p>
              <p className="text-xs text-slate-500 mt-0.5">Muestra solo ID en lugar de nombres de estudiantes</p>
            </div>
            <button
              onClick={() => setAnonimizado(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${anonimizado ? 'bg-blue-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${anonimizado ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-slate-700">Excluir facultades de prueba</p>
              <p className="text-xs text-slate-500 mt-0.5">"Facultad de prueba", "Faculty Business", "Faculty Computer Science"</p>
            </div>
            <button
              onClick={() => { setExcluirPrueba(v => !v); limpiarCacheData(); window.location.reload() }}
              className={`relative w-12 h-6 rounded-full transition-colors ${excluirPrueba ? 'bg-blue-500' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${excluirPrueba ? 'translate-x-6' : ''}`} />
            </button>
          </div>

        </div>
      </div>

      {/* Nota de privacidad */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <h2 className="font-bold text-red-700 mb-2">📋 Manejo responsable de datos sensibles</h2>
        <div className="text-xs text-red-700 space-y-1.5">
          <p>Esta herramienta procesa datos de salud mental y bienestar personal de estudiantes.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Todo se procesa en tu navegador — ningún dato va a servidores propios.</li>
            <li>La IA solo recibe estadísticas agregadas y extractos anonimizados.</li>
            <li>La detección de "casos críticos" es una estimación — requiere validación profesional.</li>
            <li>Acceso restringido al personal autorizado del sistema de tutoría.</li>
          </ul>
          <p className="mt-2 font-semibold">
            En caso de riesgo real: activar protocolos de intervención de la universidad de inmediato.
          </p>
        </div>
      </div>

      {/* Info técnica */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h2 className="font-bold text-slate-600 mb-2 text-sm">ℹ️ Información técnica</h2>
        <div className="text-xs text-slate-500 space-y-0.5 font-mono">
          <p>Stack: React 19 + Vite + Tailwind CSS 3 + Recharts + SheetJS</p>
          <p>IA: Llama 3.3 70B via OpenRouter (gratuito · openrouter.ai)</p>
          <p>Datos: 4 archivos .xlsx en /public/data/ — procesados localmente</p>
          <p>Semestres válidos: 2025-1 · 2025-2 · 2026-1</p>
        </div>
      </div>
    </div>
  )
}
