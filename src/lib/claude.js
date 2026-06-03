/**
 * claude.js
 * Integración con la API de Claude (Anthropic) directamente desde el browser.
 * Patrón "bring-your-own-key" — la API key se guarda en localStorage.
 *
 * ⚠️  SOLO para uso local/personal.
 *     Para producción, migra esta llamada a un backend proxy.
 */

const API_URL    = 'https://api.anthropic.com/v1/messages'
const API_MODEL  = 'claude-sonnet-4-5'
const MAX_TOKENS = 2048

// ─── Gestión de API key ───────────────────────────────────────────────────────
export function getApiKey()        { return localStorage.getItem('tutoria_api_key') || '' }
export function setApiKey(key)     { localStorage.setItem('tutoria_api_key', key.trim()) }
export function clearApiKey()      { localStorage.removeItem('tutoria_api_key') }
export function tieneApiKey()      { return !!getApiKey() }

// ─── Llamada a la API ─────────────────────────────────────────────────────────
/**
 * Envía un mensaje a Claude y devuelve la respuesta como string.
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 * @param {string} systemPrompt
 * @param {Function} onChunk  callback opcional para streaming parcial
 */
export async function llamarClaude(messages, systemPrompt = '', onChunk = null) {
  const key = getApiKey()
  if (!key) throw new Error('No hay API key configurada. Ve a Configuración.')

  const body = {
    model:      API_MODEL,
    max_tokens: MAX_TOKENS,
    system:     systemPrompt,
    messages,
  }

  const resp = await fetch(API_URL, {
    method:  'POST',
    headers: {
      'Content-Type':                         'application/json',
      'x-api-key':                            key,
      'anthropic-version':                    '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Error ${resp.status}: ${resp.statusText}`)
  }

  const data = await resp.json()
  return data.content?.[0]?.text || '(respuesta vacía)'
}

// ─── Prompts de sistema por dashboard ────────────────────────────────────────
export const SYSTEM_PROMPTS = {
  resumen: `Eres un analista experto en bienestar universitario y sistemas de tutoría.
Analizas datos de atenciones de tutoría de la Universidad Peruana Unión.
Los datos que recibes ya están anonimizados — nunca incluyen nombres reales de estudiantes.
Tu rol: identificar patrones, grupos en riesgo, tendencias y dar recomendaciones accionables
para pastores, psicólogos, nutricionistas y tutores de aula.
Responde en español, de forma clara y estructurada. Sé directo y práctico.`,

  derivaciones: `Eres un analista de flujos de derivación en tutoría universitaria.
Analiza los patrones de derivación: qué tipo de tutoría deriva más, hacia dónde,
qué facultades/carreras generan más derivaciones, y qué implicancias tiene.
Datos ya anonimizados. Responde en español con recomendaciones concretas.`,

  criticos: `Eres un especialista en triage de casos de riesgo en bienestar universitario.
Los casos críticos fueron detectados automáticamente por análisis de texto — son ESTIMACIONES
que requieren validación profesional. Tu rol es ayudar a priorizar y contextualizar.
Nunca hagas diagnósticos. Identifica patrones y sugiere pasos de seguimiento.
Datos anonimizados. Responde en español con tono sobrio y profesional.`,

  trayectoria: `Eres un analista de trayectorias estudiantiles en el sistema de tutoría universitaria.
Analizas el recorrido de estudiantes por distintos tipos de tutoría a lo largo del tiempo.
Identifica patrones de evolución, casos de mejora sostenida, estancamiento o deterioro.
Datos anonimizados. Responde en español con enfoque en seguimiento y acompañamiento.`,

  general: `Eres un analista experto en bienestar universitario y sistemas de tutoría.
Tienes acceso a estadísticas agregadas de atenciones de tutoría de una universidad.
Los datos ya están anonimizados. Responde en español con análisis profundos y prácticos.`,
}

// ─── Helper: prepara contexto de datos para enviar a la IA ───────────────────
/**
 * Construye el texto de contexto que se enviará a Claude.
 * NUNCA incluye nombres reales — solo agregados y extractos anonimizados.
 */
export function prepararContexto(stats, tipo = 'general') {
  return `## Contexto de datos (anonimizados)

${JSON.stringify(stats, null, 2)}

---
Analiza estos datos y proporciona:
1. Patrones relevantes detectados
2. Grupos o situaciones que requieren atención prioritaria
3. Tendencias positivas o preocupantes
4. Recomendaciones accionables para el equipo de tutoría
`
}
