import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { llamarGemini, getApiKey, prepararContexto, SYSTEM_PROMPTS } from '../lib/gemini'

export default function AIPanel({ stats, tipo = 'general', titulo = 'Análisis IA' }) {
  const [abierto, setAbierto]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [respuesta, setRespuesta] = useState('')
  const [error, setError]         = useState('')
  const [historial, setHistorial] = useState([])
  const [pregunta, setPregunta]   = useState('')

  const tieneKey = !!getApiKey()

  async function analizar() {
    if (!tieneKey) {
      setError('Ve a ⚙️ Configuración y agrega tu API key de OpenRouter (gratis en openrouter.ai).')
      return
    }
    setLoading(true)
    setError('')
    setRespuesta('')
    const contexto = prepararContexto(stats)
    const msgs     = [{ role: 'user', content: contexto }]
    try {
      const r = await llamarGemini(msgs, SYSTEM_PROMPTS[tipo] || SYSTEM_PROMPTS.general)
      setRespuesta(r)
      setHistorial([{ role: 'user', content: contexto }, { role: 'assistant', content: r }])
    } catch(e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function seguimiento() {
    if (!pregunta.trim()) return
    setLoading(true)
    setError('')
    const nuevos = [...historial, { role: 'user', content: pregunta }]
    try {
      const r = await llamarGemini(nuevos, SYSTEM_PROMPTS[tipo] || SYSTEM_PROMPTS.general)
      const conResp = [...nuevos, { role: 'assistant', content: r }]
      setHistorial(conResp)
      setRespuesta(r)
      setPregunta('')
    } catch(e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setAbierto(v => !v)}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700
                   text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
      >
        🤖 Trabajar con IA
        <span className="text-violet-300 text-xs">(OpenRouter · gratis)</span>
      </button>

      {abierto && (
        <div className="mt-3 border border-violet-200 rounded-xl bg-violet-50 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-violet-500">ℹ️</span>
            <p className="text-xs text-violet-700">
              <strong>Privacidad:</strong> Solo se envían <strong>estadísticas agregadas y anonimizadas</strong> —
              sin nombres ni datos personales. Usa <strong>Llama 3.3 70B</strong> vía OpenRouter (modelo gratuito).
            </p>
          </div>

          {!respuesta && !loading && (
            <button
              onClick={analizar}
              disabled={!tieneKey}
              className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors
                ${tieneKey
                  ? 'bg-violet-600 hover:bg-violet-700'
                  : 'bg-slate-300 cursor-not-allowed'}`}
            >
              {tieneKey ? `✨ Analizar: ${titulo}` : '⚙️ Configura tu API key de OpenRouter primero'}
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-violet-700 text-sm">
              <div className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
              Consultando a la IA…
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              ❌ {error}
            </div>
          )}

          {respuesta && (
            <div className="space-y-3">
              <div className="bg-white border border-violet-200 rounded-lg p-5 text-sm text-slate-700
                              max-h-[32rem] overflow-y-auto prose prose-sm prose-slate max-w-none
                              prose-headings:text-violet-800 prose-headings:font-bold
                              prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                              prose-strong:text-slate-800 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1
                              prose-hr:border-violet-200 prose-p:leading-relaxed">
                <ReactMarkdown>{respuesta}</ReactMarkdown>
              </div>

              {/* Chat de seguimiento */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pregunta}
                  onChange={e => setPregunta(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && seguimiento()}
                  placeholder="Haz una pregunta de seguimiento…"
                  className="flex-1 text-sm border border-violet-300 rounded-lg px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                />
                <button
                  onClick={seguimiento}
                  disabled={loading || !pregunta.trim()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm
                             font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  Enviar
                </button>
              </div>

              <button
                onClick={() => { setRespuesta(''); setHistorial([]) }}
                className="text-xs text-violet-500 hover:text-violet-700"
              >
                ↺ Nuevo análisis
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
