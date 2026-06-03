/**
 * sentiment.js
 * Análisis de sentimiento proxy por heurística de palabras clave en español.
 * ⚠️ Esto es una ESTIMACIÓN para orientación — no es un análisis psicológico real.
 */

const POSITIVO = [
  'mejora', 'mejoró', 'avanza', 'avanzó', 'bien', 'bueno', 'excelente',
  'positivo', 'animado', 'motivado', 'contento', 'tranquilo', 'tranquilizó',
  'comprometido', 'optimista', 'recupera', 'recuperó', 'estable',
  'progresa', 'logró', 'superó', 'supera', 'confianza', 'esperanza',
  'dispuesto', 'reflexionó', 'acepta', 'aceptó', 'comprendió',
]

const NEGATIVO = [
  'triste', 'tristeza', 'llanto', 'llora', 'llorando', 'angustia',
  'angustiado', 'desesperado', 'desesperación', 'miedo', 'temor',
  'preocupado', 'preocupación', 'negativo', 'mal', 'difícil', 'crisis',
  'decaído', 'deprimido', 'frustrado', 'frustración', 'perdido',
  'sola', 'solo', 'aislado', 'abandono', 'deserci', 'inestable',
  'conflicto', 'problema', 'dificultad', 'estrés', 'estres',
]

/**
 * Calcula el sentimiento proxy de un texto.
 * @returns {{ score: number, label: 'positivo'|'neutral'|'negativo', pos: number, neg: number }}
 */
export function calcularSentimiento(texto) {
  if (!texto) return { score: 0, label: 'neutral', pos: 0, neg: 0 }
  const t = texto.toLowerCase()
  const pos = POSITIVO.filter(w => t.includes(w)).length
  const neg = NEGATIVO.filter(w => t.includes(w)).length
  const score = pos - neg
  const label = score > 0 ? 'positivo' : score < 0 ? 'negativo' : 'neutral'
  return { score, label, pos, neg }
}

/** Color para mostrar el sentimiento */
export const SENTIMIENTO_COLOR = {
  positivo: { text: 'text-green-700',  bg: 'bg-green-50',  hex: '#16a34a' },
  neutral:  { text: 'text-slate-600',  bg: 'bg-slate-50',  hex: '#64748b' },
  negativo: { text: 'text-red-600',    bg: 'bg-red-50',    hex: '#dc2626' },
}
