var e=`https://openrouter.ai/api/v1/chat/completions`,t=[];async function n(e){if(t.length>0)return t;let n=await fetch(`https://openrouter.ai/api/v1/models`,{headers:{Authorization:`Bearer ${e}`}});if(!n.ok)throw Error(`No se pudo obtener la lista de modelos`);let{data:r}=await n.json();return t=(r||[]).filter(e=>e.pricing?.prompt===`0`&&(e.context_length||0)>=8e3&&!e.id.includes(`tts`)&&!e.id.includes(`vision`)).map(e=>e.id),t}function r(){return localStorage.getItem(`tutoria_gemini_key`)||``}function i(e){localStorage.setItem(`tutoria_gemini_key`,e.trim())}function a(){localStorage.removeItem(`tutoria_gemini_key`)}function o(){return!!r()}async function s(t,n,r){let i=await fetch(e,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${t}`,"HTTP-Referer":window.location.origin,"X-Title":`Sistema de Tutoría UPeU`},body:JSON.stringify({model:n,messages:r,temperature:.7,max_tokens:2048})}),a=await i.json();if(!i.ok){let e=a?.error?.message||`Error ${i.status}`;throw Error(e)}let o=a?.choices?.[0]?.message?.content;if(!o)throw Error(`Sin respuesta del modelo`);return{text:o,modelo:n}}async function c(e,t=``){let i=r();if(!i)throw Error(`No hay API key configurada. Ve a ⚙️ Configuración.`);let a=[];t&&a.push({role:`system`,content:t}),e.forEach(e=>a.push({role:e.role===`model`?`assistant`:e.role,content:e.content}));let o;try{o=await n(i)}catch{o=[]}o.length===0&&(o=[`deepseek/deepseek-chat-v3-0324:free`,`google/gemma-3-27b-it:free`,`google/gemma-2-9b-it:free`,`qwen/qwen-2.5-7b-instruct:free`,`meta-llama/llama-3.3-70b-instruct:free`]);let c=[];for(let e of o.slice(0,5))try{let{text:t}=await s(i,e,a);return t}catch(t){if(c.push(`${e}: ${t.message}`),t.message.includes(`401`)||t.message.includes(`403`)||t.message.toLowerCase().includes(`invalid api key`))throw Error(`API key inválida. Verifica en openrouter.ai/keys`);continue}throw Error(`Sin modelos disponibles ahora.\n${c.join(`
`)}`)}var l={resumen:`Eres un analista experto en bienestar universitario y sistemas de tutoría.
Analizas datos de atenciones de tutoría de la Universidad Peruana Unión.
Los datos que recibes ya están anonimizados — nunca incluyen nombres reales.
Tu rol: identificar patrones, grupos en riesgo, tendencias y dar recomendaciones accionables
para pastores, psicólogos, nutricionistas y tutores de aula.
Responde en español, de forma clara y estructurada con bullets y secciones. Sé directo y práctico.`,derivaciones:`Eres un analista de flujos de derivación en tutoría universitaria.
Analiza los patrones: qué eje deriva más, hacia dónde, qué facultades generan más derivaciones.
Datos anonimizados. Responde en español con recomendaciones concretas y accionables.`,criticos:`Eres un especialista en triage de casos de riesgo en bienestar universitario.
Los casos críticos son ESTIMACIONES automáticas que requieren validación profesional.
Ayuda a priorizar y contextualizar. Nunca hagas diagnósticos.
Sugiere pasos de seguimiento. Datos anonimizados. Tono sobrio y profesional en español.`,trayectoria:`Eres un analista de trayectorias estudiantiles en tutoría universitaria.
Analizas el recorrido de estudiantes por distintos tipos de tutoría.
Identifica patrones de evolución, mejora sostenida, estancamiento o deterioro.
Datos anonimizados. Responde en español con enfoque en acompañamiento.`,general:`Eres un analista experto en bienestar universitario y sistemas de tutoría universitaria.
Tienes acceso a estadísticas agregadas de atenciones. Datos anonimizados.
Responde en español con análisis profundos, prácticos y bien estructurados.`};function u(e){return`## Datos de tutoría (anonimizados y agregados)

${JSON.stringify(e,null,2)}

---
Analiza estos datos y proporciona:
1. **Patrones relevantes** detectados
2. **Grupos o situaciones** que requieren atención prioritaria
3. **Tendencias** positivas o preocupantes
4. **Recomendaciones accionables** para el equipo de tutoría
`}export{u as a,c as i,a as n,i as o,r,o as s,l as t};