/**
 * gemini.js  (ahora usa OpenRouter — compatible con múltiples modelos IA)
 * Patrón "bring-your-own-key" — la API key se guarda en localStorage.
 *
 * Obtén tu API key GRATIS en: https://openrouter.ai/keys
 * Sin tarjeta de crédito · Modelos gratuitos disponibles
 */

const API_BASE = 'https://openrouter.ai/api/v1/chat/completions'

// Caché de modelos disponibles (se refresca cada sesión)
let _modelosCache = []

/** Consulta OpenRouter y devuelve modelos gratuitos con contexto >= 8k */
async function obtenerModelosGratuitos(key) {
  if (_modelosCache.length > 0) return _modelosCache
  const resp = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${key}` }
  })
  if (!resp.ok) throw new Error('No se pudo obtener la lista de modelos')
  const { data } = await resp.json()
  _modelosCache = (data || [])
    .filter(m =>
      m.pricing?.prompt === '0' &&          // precio = 0 (gratuito)
      (m.context_length || 0) >= 8000 &&   // contexto suficiente
      !m.id.includes('tts') &&              // sin modelos de voz
      !m.id.includes('vision')             // sin modelos de visión puros
    )
    .map(m => m.id)
  return _modelosCache
}

// ─── Gestión de API key ───────────────────────────────────────────────────────
// Key institucional por defecto — los usuarios pueden sobreescribir con la suya propia
const KEY_INSTITUCIONAL = 'REEMPLAZA_AQUI_CON_TU_KEY'

export function getApiKey()    { return localStorage.getItem('tutoria_gemini_key') || KEY_INSTITUCIONAL }
export function setApiKey(key) { localStorage.setItem('tutoria_gemini_key', key.trim()) }
export function clearApiKey()  { localStorage.removeItem('tutoria_gemini_key') }
export function tieneApiKey()  { return !!getApiKey() }

// ─── Llamada a la API ─────────────────────────────────────────────────────────
/**
 * Envía un mensaje a OpenRouter y devuelve la respuesta como string.
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 * @param {string} systemPrompt
 */
async function intentarModelo(key, modelo, msgs) {
  const resp = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer':  window.location.origin,
      'X-Title':       'Sistema de Tutoría UPeU',
    },
    body: JSON.stringify({
      model:       modelo,
      messages:    msgs,
      temperature: 0.7,
      max_tokens:  2048,
    }),
  })
  const data = await resp.json()
  if (!resp.ok) {
    const msg = data?.error?.message || `Error ${resp.status}`
    throw new Error(msg)
  }
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Sin respuesta del modelo')
  return { text, modelo }
}

export async function llamarGemini(messages, systemPrompt = '') {
  const key = getApiKey()
  if (!key) throw new Error('No hay API key configurada. Ve a ⚙️ Configuración.')

  // Construir array de mensajes en formato OpenAI
  const msgs = []
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
  messages.forEach(m => msgs.push({ role: m.role === 'model' ? 'assistant' : m.role, content: m.content }))

  // Obtener modelos disponibles dinámicamente
  let modelos
  try {
    modelos = await obtenerModelosGratuitos(key)
  } catch {
    modelos = []
  }

  // Si no hay modelos detectados, usar lista de respaldo conocida
  if (modelos.length === 0) {
    modelos = [
      'deepseek/deepseek-chat-v3-0324:free',
      'google/gemma-3-27b-it:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2.5-7b-instruct:free',
      'meta-llama/llama-3.3-70b-instruct:free',
    ]
  }

  // Intentar cada modelo hasta que uno funcione (máx 5 intentos)
  const errores = []
  for (const modelo of modelos.slice(0, 5)) {
    try {
      const { text } = await intentarModelo(key, modelo, msgs)
      return text
    } catch(e) {
      errores.push(`${modelo}: ${e.message}`)
      if (e.message.includes('401') || e.message.includes('403') || e.message.toLowerCase().includes('invalid api key')) {
        throw new Error('API key inválida. Verifica en openrouter.ai/keys')
      }
      continue
    }
  }
  throw new Error(`Sin modelos disponibles ahora.\n${errores.join('\n')}`)
}

// ─── Prompts de sistema por dashboard ────────────────────────────────────────
export const SYSTEM_PROMPTS = {
  resumen: `Eres un analista experto en bienestar universitario y sistemas de tutoría.
Analizas datos de atenciones de tutoría de la Universidad Peruana Unión.
Los datos que recibes ya están anonimizados — nunca incluyen nombres reales.
Tu rol: identificar patrones, grupos en riesgo, tendencias y dar recomendaciones accionables
para pastores, psicólogos, nutricionistas y tutores de aula.
Responde en español, de forma clara y estructurada con bullets y secciones. Sé directo y práctico.`,

  derivaciones: `Eres un analista de flujos de derivación en tutoría universitaria.
Analiza los patrones: qué eje deriva más, hacia dónde, qué facultades generan más derivaciones.
Datos anonimizados. Responde en español con recomendaciones concretas y accionables.`,

  criticos: `Eres un especialista en triage de casos de riesgo en bienestar universitario.
Los casos críticos son ESTIMACIONES automáticas que requieren validación profesional.
Ayuda a priorizar y contextualizar. Nunca hagas diagnósticos.
Sugiere pasos de seguimiento. Datos anonimizados. Tono sobrio y profesional en español.`,

  trayectoria: `Eres un analista de efectividad del programa de tutoría universitaria de la UPeU.
Tu enfoque es positivo y orientado a la mejora del programa.
Los estudiantes con múltiples atenciones NO están "deteriorándose" — son estudiantes que el programa
está identificando y acompañando activamente. Mayor recurrencia = mayor compromiso del sistema.
Analiza qué tan bien está respondiendo el programa, qué perfiles de estudiantes necesitan más apoyo,
y cómo fortalecer el acompañamiento. Datos anonimizados. Responde en español con tono propositivo.`,

  general: `Eres un analista experto en bienestar universitario y sistemas de tutoría universitaria.
Tienes acceso a estadísticas agregadas de atenciones. Datos anonimizados.
Responde en español con análisis profundos, prácticos y bien estructurados.`,
}

// ─── Helper: prepara contexto para enviar a la IA ─────────────────────────────
export function prepararContexto(stats) {
  return `## Datos de tutoría (anonimizados y agregados)

${JSON.stringify(stats, null, 2)}

---
Analiza estos datos y proporciona:
1. **Patrones relevantes** detectados
2. **Grupos o situaciones** que requieren atención prioritaria
3. **Tendencias** positivas o preocupantes
4. **Recomendaciones accionables** para el equipo de tutoría
`
}
