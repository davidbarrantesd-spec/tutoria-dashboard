/**
 * criticality.js
 * Detección automática de casos críticos por análisis de texto (§12 del prompt).
 * ⚠️ ESTIMACIÓN AUTOMÁTICA — requiere validación profesional.
 */

// Lexicón con pesos. Cada entrada: [peso, [...patrones]]
// Los patrones se prueban como substrings sobre el texto en minúsculas.
const LEXICO = [
  {
    tema: 'Riesgo suicida / autolesión',
    peso: 5,
    nivel_min: 'critico',
    patrones: [
      'suicid', 'autolesi', 'quitarse la vida', 'no quiere vivir',
      'hacerse daño', 'intento de suicidio', 'ideacion', 'ideación',
      'ideas de muerte', 'atentar contra', 'cortarse', 'quiero morir',
    ],
  },
  {
    tema: 'Violencia / abuso / acoso',
    peso: 4,
    patrones: [
      'violenc', 'abus', 'maltrat', 'agredi', 'agresi', 'acos',
      'hostigam', 'bullying', 'acoso sexual', 'tocamiento', 'violacion',
      'golpe', 'amenaza', 'intimidac',
    ],
  },
  {
    tema: 'Salud mental severa',
    peso: 3,
    patrones: [
      'depresion', 'depresión', 'ansiedad sever', 'crisis nerviosa',
      'ataque de panico', 'ataque de pánico', 'colaps', 'contencion',
      'contención', 'descompensac', 'llanto incontrolable', 'llanto intenso',
      'desesperacion', 'desesperación', 'desmayo', 'trastorno',
    ],
  },
  {
    tema: 'Duelo / muerte / pérdida',
    peso: 2,
    patrones: [
      'duelo', 'fallec', 'falleci', 'muerte', 'perdio a', 'perdió a',
      'perdida de un', 'pérdida de un', 'luto', 'fallecimiento',
    ],
  },
  {
    tema: 'Riesgo de abandono / deserción',
    peso: 2,
    patrones: [
      'abandon', 'deserci', 'retiro de la carrera', 'no acude',
      'dejo de asistir', 'dejó de asistir', 'inasistenc',
      'quiere retirarse', 'piensa retirarse', 'no quiere continuar',
      'discontinu', 'baja academica', 'baja académica',
    ],
  },
  {
    tema: 'Problema familiar grave',
    peso: 2,
    patrones: [
      'divorci', 'separacion de sus padres', 'separación de sus padres',
      'conflicto familiar', 'abandono familiar', 'disfunci',
      'violencia familiar', 'violencia domest', 'padres separados',
      'hogar disfuncional', 'maltrato familiar',
    ],
  },
  {
    tema: 'Salud física / nutricional alterada',
    peso: 2,
    patrones: [
      'anemia', 'parametros alterados', 'parámetros alterados',
      'hematologico', 'hematológico', 'perfil lipidico', 'perfil lipídico',
      'desnutri', 'obesid', 'sobrepeso severo', 'glucosa elevada',
      'hipertension', 'hipertensión',
    ],
  },
  {
    tema: 'Crisis económica',
    peso: 1,
    patrones: [
      'economico', 'económico', 'economica', 'económica',
      'no puede pagar', 'deuda', 'trabaja para sostener',
      'problema economico', 'problema económico', 'sin recursos',
      'falta de dinero', 'beca en riesgo', 'pension', 'pensión atrasada',
    ],
  },
]

/** Mapea score numérico a nivel de criticidad */
export function scoreANivel(score) {
  if (score >= 5) return 'critico'
  if (score >= 3) return 'alto'
  if (score >= 1) return 'medio'
  return 'bajo'
}

/** Color de badge por nivel */
export const NIVEL_COLOR = {
  critico: { bg: 'bg-critico-light', text: 'text-red-700',    border: 'border-red-300',    hex: '#EF4444' },
  alto:    { bg: 'bg-alto-light',    text: 'text-orange-700', border: 'border-orange-300', hex: '#F97316' },
  medio:   { bg: 'bg-medio-light',   text: 'text-yellow-700', border: 'border-yellow-300', hex: '#EAB308' },
  bajo:    { bg: 'bg-slate-100',     text: 'text-slate-600',  border: 'border-slate-200',  hex: '#94A3B8' },
}

/**
 * Analiza un registro y devuelve su score + temas detectados.
 * @param {Object} row - fila normalizada del dataset
 * @returns {{ score: number, nivel: string, temas: string[] }}
 */
export function calcularCriticidad(row) {
  const texto = [
    (row.OBSERVACION  || ''),
    (row.MOTIVO       || ''),
    (row.ACUERDO      || ''),
  ].join(' ').toLowerCase()

  let score = 0
  const temas = []

  for (const entrada of LEXICO) {
    const match = entrada.patrones.some(p => texto.includes(p))
    if (match) {
      score += entrada.peso
      temas.push(entrada.tema)
    }
  }

  return { score, nivel: scoreANivel(score), temas }
}

export { LEXICO }
