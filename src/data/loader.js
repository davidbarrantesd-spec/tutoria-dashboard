/**
 * loader.js
 * Carga los 4 archivos Excel con SheetJS, normaliza el dataset,
 * aplica filtro de semestres válidos y enriquece cada registro
 * con tipo_tutoria, criticidad y sentimiento.
 */
import * as XLSX from 'xlsx'
import { calcularCriticidad } from './criticality'
import { calcularSentimiento } from './sentiment'

// ─── Configuración de archivos ────────────────────────────────────────────────
const FUENTES = [
  {
    archivo: '/data/ATENCIONES_TUTORIA_DE_AULA.xlsx',
    tipo_tutoria: 'aula',
    label: 'Tutoría de Aula',
    color: '#4F86C6',
  },
  {
    archivo: '/data/ATENCIONES_TUTORIA_BIENESTAR_UNIVERSITARIO.xlsx',
    tipo_tutoria: 'psicologica',
    label: 'Tutoría Psicológica',
    color: '#5BAD72',
  },
  {
    archivo: '/data/ATENCION_TUTORIA_ESPIRITUAL.xlsx',
    tipo_tutoria: 'espiritual',
    label: 'Tutoría Espiritual',
    color: '#9B72CF',
  },
  {
    archivo: '/data/ATENCION_TUTORIA_de_BIENESTAR_FISICO.xlsx',
    tipo_tutoria: 'fisica',
    label: 'Tutoría Física / Nutrición',
    color: '#F4A261',
  },
]

// ─── Semestres válidos ────────────────────────────────────────────────────────
// Solo estos tres semestres con data suficiente
const SEMESTRES_VALIDOS = new Set(['2025-1', '2025-2', '2026-1'])

// Facultades de prueba a excluir (toggle opcional)
const FACULTADES_PRUEBA = [
  'facultad de prueba',
]

function esSemestreValido(sem) {
  if (!sem) return false
  return SEMESTRES_VALIDOS.has(String(sem).trim())
}

// ─── Filtros de calidad de datos (siempre activos) ───────────────────────────

/**
 * Solo conservar facultades reales: deben empezar con "Facultad".
 * Excluye: "Centro de Idiomas", "Faculty Business", "Faculty Computer Science",
 *          "Conservatorio de Música", "Escuela General de Posgrado", etc.
 */
function esFacultadReal(facultad) {
  if (!facultad) return false
  return facultad.trim().toLowerCase().startsWith('facultad')
}

/**
 * Solo conservar escuelas reales:
 *  - Inician con "EP " (Escuela Profesional)
 *  - Inician con "Programa" (programas de educación)
 * Excluye: "Centro de Idiomas", "Conservatorio de Música",
 *          "Escuela General de Posgrado", "Escuela de Posgrado", etc.
 */
function esEscuelaReal(escuela) {
  if (!escuela) return false
  const e = escuela.trim().toLowerCase()
  return e.startsWith('ep ') || e.startsWith('programa')
}

// ─── Normalización de una fila ────────────────────────────────────────────────
function normalizarFila(raw, fuente) {
  // SheetJS a veces retorna fechas como números seriales de Excel
  const parseFecha = (val) => {
    if (!val) return null
    if (val instanceof Date) return val.toISOString().split('T')[0]
    if (typeof val === 'number') {
      // número serial de Excel → Date
      const d = XLSX.SSF.parse_date_code(val)
      if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
    }
    // string ISO o similar
    const s = String(val).trim()
    if (s.length >= 10) return s.slice(0, 10)
    return null
  }

  return {
    // IDs
    ID_TUTORIA_DERIVACION: raw['ID_TUTORIA_DERIVACION'] ?? null,
    ID_PADRE:              raw['ID_PADRE']              ?? null,
    ID_ESTUDIANTE:         raw['ID_ESTUDIANTE']         ?? null,
    ESTUDIANTE:            String(raw['ESTUDIANTE']     || '').trim(),
    // Académico
    SEMESTRE:              String(raw['SEMESTRE']       || '').trim(),
    ID_FACULTAD:           raw['ID_FACULTAD']           ?? null,
    FACULTAD:              String(raw['FACULTAD']       || '').trim(),
    ID_ESCUELA:            raw['ID_ESCUELA']            ?? null,
    ESCUELA:               String(raw['ESCUELA']        || '').trim(),
    CICLO:                 raw['CICLO'] != null ? Number(raw['CICLO']) : null,
    GRUPO:                 raw['GRUPO'] != null ? String(raw['GRUPO']).trim() : null,
    // Tutor
    ID_TUTOR:              raw['ID_TUTOR']              ?? null,
    TUTOR:                 String(raw['TUTOR']          || '').trim(),
    TIPO_SESION_ORIGEN:    String(raw['TIPO_SESION_ORIGEN'] || '').trim(),
    // Fechas
    FEC_ATENCION:          parseFecha(raw['FEC_ATENCION']),
    FEC_PROXIMA:           parseFecha(raw['FEC_PROXIMA']),
    // Texto
    MOTIVO:                String(raw['MOTIVO']         || '').trim(),
    OBSERVACION:           String(raw['OBSERVACION']    || '').trim(),
    ACUERDO:               String(raw['ACUERDO']        || '').trim(),
    // Derivación
    DERIVAR:               String(raw['DERIVAR']        || 'N').trim().toUpperCase(),
    ESTADO:                raw['ESTADO']                ?? null,
    ID_DESTINO:            raw['ID_DESTINO']            ?? null,
    TUTOR_DESTINO:         String(raw['TUTOR_DESTINO']  || '').trim(),
    TIPO_SESION_DESTINO:   String(raw['TIPO_SESION_DESTINO'] || '').trim(),
    // Enriquecidos
    tipo_tutoria:          fuente.tipo_tutoria,
    tipo_label:            fuente.label,
    tipo_color:            fuente.color,
  }
}

// ─── Carga de un archivo ──────────────────────────────────────────────────────
async function cargarArchivo(fuente, onProgress) {
  const resp = await fetch(fuente.archivo)
  if (!resp.ok) throw new Error(`No se pudo cargar ${fuente.archivo}`)
  const buf  = await resp.arrayBuffer()
  const wb   = XLSX.read(buf, { type: 'array', cellDates: false })
  const ws   = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null })
  onProgress?.(`${fuente.label}: ${rows.length.toLocaleString()} filas`)
  return rows.map(r => normalizarFila(r, fuente))
}

// ─── Función principal exportada ──────────────────────────────────────────────
/**
 * Carga y procesa todos los archivos.
 * @param {Function} onProgress  callback(mensaje: string)
 * @param {boolean}  excluirPrueba  excluir facultades de prueba
 * @returns {Promise<{ rows: Object[], meta: Object }>}
 */
export async function cargarTodo(onProgress, excluirPrueba = false) {
  const partes = []

  for (const fuente of FUENTES) {
    const filas = await cargarArchivo(fuente, onProgress)
    partes.push(filas)
  }

  onProgress?.('Normalizando y filtrando…')
  let rows = partes.flat()

  // 1. Filtro de semestres válidos (§3 — obligatorio)
  rows = rows.filter(r => esSemestreValido(r.SEMESTRE))

  // 2. Filtro de calidad: solo facultades reales (empiezan con "Facultad")
  rows = rows.filter(r => esFacultadReal(r.FACULTAD))

  // 3. Filtro de calidad: solo escuelas reales (EP ... o Programa ...)
  rows = rows.filter(r => esEscuelaReal(r.ESCUELA))

  // 4. Filtro de facultades de prueba (toggle opcional)
  if (excluirPrueba) {
    rows = rows.filter(r =>
      !FACULTADES_PRUEBA.includes(r.FACULTAD.toLowerCase())
    )
  }

  onProgress?.('Calculando criticidad y sentimiento…')

  // Enriquecer con criticidad y sentimiento
  rows = rows.map(r => {
    const crit = calcularCriticidad(r)
    const sent = calcularSentimiento(r.OBSERVACION)
    // Extraer año y mes de FEC_ATENCION
    const año  = r.FEC_ATENCION ? r.FEC_ATENCION.slice(0, 4) : null
    const mes  = r.FEC_ATENCION ? r.FEC_ATENCION.slice(0, 7) : null
    return {
      ...r,
      criticidad_score:  crit.score,
      criticidad_nivel:  crit.nivel,
      criticidad_temas:  crit.temas,
      sentimiento_score: sent.score,
      sentimiento_label: sent.label,
      año,
      mes,
    }
  })

  // Metadatos del dataset
  const semestres    = [...new Set(rows.map(r => r.SEMESTRE))].sort()
  const facultades   = [...new Set(rows.map(r => r.FACULTAD).filter(Boolean))].sort()
  const escuelas     = [...new Set(rows.map(r => r.ESCUELA).filter(Boolean))].sort()
  const totalDeriv   = rows.filter(r => r.DERIVAR === 'S').length
  const estUnicos    = new Set(rows.map(r => r.ID_ESTUDIANTE)).size
  const criticos     = rows.filter(r => r.criticidad_nivel === 'critico').length
  const altos        = rows.filter(r => r.criticidad_nivel === 'alto').length

  const meta = {
    total:           rows.length,
    totalDerivados:  totalDeriv,
    estudiantesUnicos: estUnicos,
    casosCriticos:   criticos,
    casosAltos:      altos,
    semestres,
    facultades,
    escuelas,
    porTipo: FUENTES.map(f => ({
      tipo:  f.tipo_tutoria,
      label: f.label,
      color: f.color,
      total: rows.filter(r => r.tipo_tutoria === f.tipo_tutoria).length,
    })),
  }

  onProgress?.(`✓ Dataset listo: ${rows.length.toLocaleString()} registros válidos`)
  return { rows, meta }
}

export { FUENTES }
