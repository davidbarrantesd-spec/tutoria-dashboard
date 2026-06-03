/**
 * anonymizer.js
 * Enmascara nombres propios dentro de textos libres (OBSERVACION, ACUERDO, etc.)
 * y gestiona el toggle global de anonimización.
 */

/**
 * Enmascara secuencias de palabras con mayúscula inicial (posibles nombres propios).
 * Estrategia conservadora: 2+ palabras consecutivas capitalizadas → [anónimo].
 * Evita enmascarar términos técnicos de 1 sola palabra capitalizada.
 */
export function enmascararNombres(texto) {
  if (!texto) return texto
  // Reemplaza 2+ tokens consecutivos que empiezan con mayúscula
  return texto.replace(
    /\b([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\s+[A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+)+)\b/g,
    '[anónimo]'
  )
}

/**
 * Anonimiza un nombre de estudiante para mostrar en UI.
 * Si anonimizado=true → muestra solo el ID.
 */
export function mostrarEstudiante(nombre, id, anonimizado) {
  if (anonimizado) return `EST-${id}`
  return nombre || `EST-${id}`
}

/**
 * Anonimiza un nombre de tutor para mostrar en UI.
 * Los tutores son profesionales, no estudiantes — en general se muestran.
 * Se incluye por si en algún contexto se quiere anonimizar también.
 */
export function mostrarTutor(nombre, id, anonimizado) {
  if (anonimizado) return `TUT-${id}`
  return nombre || `TUT-${id}`
}

/**
 * Prepara un extracto seguro de OBSERVACION para mostrar en UI o enviar a IA.
 * - Enmascara nombres propios
 * - Trunca a maxLen caracteres
 */
export function extractoSeguro(texto, maxLen = 300) {
  if (!texto) return '(sin observación registrada)'
  const limpio = enmascararNombres(texto)
  if (limpio.length <= maxLen) return limpio
  return limpio.slice(0, maxLen) + '…'
}
