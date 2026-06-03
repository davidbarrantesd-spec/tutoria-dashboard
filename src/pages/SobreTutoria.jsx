export default function SobreTutoria() {
  const EJES = [
    {
      color: '#4F86C6',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-800',
      icon: '🎓',
      titulo: 'Tutoría de Aula',
      subtitulo: 'Acompañamiento Académico',
      actor: 'Tutor de Aula',
      descripcion:
        'Es el primer nivel de intervención y el corazón del sistema. El tutor de aula acompaña directamente la trayectoria académica del estudiante, detecta señales tempranas de riesgo y lo orienta para mantenerse en el camino.',
      acciones: [
        'Tutoría académica individual y grupal',
        'Identificación temprana de riesgo académico',
        'Orientación en hábitos de estudio y autorregulación',
        'Derivación oportuna a actores especializados',
        'Seguimiento del rendimiento y conducta del estudiante',
        'Talleres de tutoría grupal y eventos institucionales',
      ],
    },
    {
      color: '#5BAD72',
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-800',
      icon: '🧠',
      titulo: 'Tutoría Psicológica',
      subtitulo: 'Bienestar Socioemocional',
      actor: 'Psicólogo / Bienestar Universitario',
      descripcion:
        'Brinda acompañamiento especializado en salud mental y bienestar emocional. Actúa tanto de forma preventiva como en situaciones de crisis, protegiendo la integridad del estudiante.',
      acciones: [
        'Evaluaciones psicológicas de entrada al ciclo',
        'Consejería individual ante ansiedad y problemas emocionales',
        'Talleres grupales de bienestar socioemocional',
        'Atención en situaciones de crisis y riesgo',
        'Derivación a especialistas externos cuando se requiere',
        'Promoción del autocuidado y búsqueda de ayuda',
      ],
    },
    {
      color: '#9B72CF',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-800',
      icon: '✨',
      titulo: 'Tutoría Espiritual',
      subtitulo: 'Acompañamiento Espiritual y de Valores',
      actor: 'Capellán Universitario',
      descripcion:
        'Atiende la dimensión espiritual del estudiante con respeto a su libertad de conciencia. Acompaña procesos de sentido de propósito, toma de decisiones y formación en valores, coherentes con la identidad institucional.',
      acciones: [
        'Consejería espiritual individual',
        'Talleres formativos en valores y propósito de vida',
        'Acompañamiento en decisiones personales y vocacionales',
        'Semanas de oración y actividades espirituales',
        'Atención a estudiantes derivados y auto-derivados',
        'Registro de atenciones en el sistema institucional',
      ],
    },
    {
      color: '#F4A261',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-800',
      icon: '💪',
      titulo: 'Tutoría de Bienestar Físico',
      subtitulo: 'Salud, Nutrición y Actividad Física',
      actor: 'Docentes de Salud, Cultura Física y Nutricionista',
      descripcion:
        'Promueve estilos de vida saludables desde el primer día. Incluye chequeos médicos, evaluación nutricional, actividad física regular y el proyecto ACTÍVATE, diseñado para todos los estudiantes a lo largo del ciclo.',
      acciones: [
        'Evaluación médica de entrada y salida del primer año',
        'Atención nutricional personalizada',
        'Proyecto ACTÍVATE: actividad física semanal para todos los ciclos',
        'Promoción de hábitos saludables desde el aula',
        'Identificación de estudiantes en riesgo físico',
        'Coordinación integrada con el sistema de tutoría',
      ],
    },
  ]

  const PRINCIPIOS = [
    { icono: '👤', nombre: 'Centralidad del Estudiante',    desc: 'El estudiante es el centro de cada decisión y acción del sistema.' },
    { icono: '🌱', nombre: 'Formación Integral',             desc: 'Atendemos lo académico, emocional, espiritual y físico en conjunto.' },
    { icono: '🛡️', nombre: 'Prevención y Acompañamiento',   desc: 'Actuamos antes de que los problemas escalen, no solo cuando ocurren.' },
    { icono: '🤝', nombre: 'Corresponsabilidad',             desc: 'El bienestar es una responsabilidad compartida entre todos los actores.' },
    { icono: '🗺️', nombre: 'Modelo EMAUS',                   desc: 'Marco pedagógico que guía el camino de acompañamiento institucional.' },
    { icono: '🔁', nombre: 'Enfoque TOCCA',                  desc: 'Tutoría · Orientación · Consejería · Consultoría · Acompañamiento.' },
  ]

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #4F86C6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #9B72CF 0%, transparent 50%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🎓</span>
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">Universidad Peruana Unión</p>
              <h1 className="text-2xl font-bold">Sistema de Tutoría Universitaria</h1>
            </div>
          </div>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Una <strong className="text-white">red integral de cuidado y acompañamiento</strong> que acompaña al estudiante
            desde su ingreso hasta el egreso — atendiendo su desarrollo académico, emocional, espiritual y físico
            en los tres campus: <strong className="text-white">Lima · Juliaca · Tarapoto</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Acogida', 'Permanencia', 'Retención', 'Egreso oportuno'].map(t => (
              <span key={t} className="bg-white/10 text-white text-xs px-3 py-1 rounded-full border border-white/20">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Ejes */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Los 4 Ejes de Acompañamiento</h2>
        <p className="text-sm text-slate-500 mb-4">Cada eje atiende una dimensión del desarrollo integral del estudiante</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {EJES.map((eje) => (
            <div key={eje.titulo}
              className={`rounded-xl border-2 ${eje.border} ${eje.bg} p-5 flex flex-col gap-3`}>

              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm shrink-0">
                  {eje.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-base">{eje.titulo}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${eje.badge}`}>
                      {eje.subtitulo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong>Actor principal:</strong> {eje.actor}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <p className="text-sm text-slate-700 leading-relaxed border-l-4 pl-3"
                style={{ borderColor: eje.color }}>
                {eje.descripcion}
              </p>

              {/* Acciones */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Funciones clave
                </p>
                <ul className="space-y-1.5">
                  {eje.acciones.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="mt-0.5 shrink-0" style={{ color: eje.color }}>✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Red de cuidado */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-bold text-slate-800 mb-1">🤝 Una Red de Cuidado Integral</h2>
        <p className="text-sm text-slate-600 mb-4">
          El bienestar del estudiante es una responsabilidad <strong>compartida y articulada</strong> entre todos los actores:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { icon: '📚', label: 'Docentes de asignatura' },
            { icon: '🎓', label: 'Tutores de aula' },
            { icon: '🧠', label: 'Psicólogos' },
            { icon: '✨', label: 'Capellanes' },
            { icon: '🏃', label: 'Docentes de Salud y Cultura Física' },
            { icon: '🥗', label: 'Nutricionista' },
            { icon: '🏛️', label: 'Coordinadores institucionales' },
          ].map(a => (
            <div key={a.label}
              className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-slate-100 text-sm">
              <span>{a.icon}</span>
              <span className="text-slate-700 font-medium text-xs">{a.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 italic">
          "Tutoría Universitaria y Bienestar Universitario juntos formamos una red de cuidado integral del estudiante."
        </p>
      </div>

      {/* Principios */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4">Principios que Guían el Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PRINCIPIOS.map(p => (
            <div key={p.nombre} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-2xl mb-2">{p.icono}</p>
              <p className="text-sm font-bold text-slate-800 mb-1">{p.nombre}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alcance */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '🏛️', label: 'Campus', value: '3', sub: 'Lima · Juliaca · Tarapoto' },
          { icon: '📋', label: 'Modalidades', value: '3', sub: 'Presencial · Semipresencial · Virtual' },
          { icon: '🔄', label: 'Ejes de atención', value: '4', sub: 'Académico · Psicológico · Espiritual · Físico' },
        ].map(item => (
          <div key={item.label} className="bg-slate-800 text-white rounded-xl p-5 text-center">
            <p className="text-3xl mb-1">{item.icon}</p>
            <p className="text-3xl font-black mb-0.5">{item.value}</p>
            <p className="text-xs font-semibold text-slate-300">{item.label}</p>
            <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>

    </div>
  )
}
