/**
 * @fileoverview Panel de Resultados y Dictamen Legal en Tiempo Real (Columna Derecha).
 * Presenta el Veredicto Principal de Estado, la evaluación de edad, la matriz de 4 documentos,
 * los permisos de circulación por infraestructura vial, la especificación técnica de cascos (NTC vs ECE)
 * y el régimen de sanciones e inmovilización.
 * 
 * Implementa divulgación progresiva (progressive disclosure) mediante desplegables accesibles
 * (<details>/<summary>) para mantener la interfaz despejada sin perder rigor legal.
 */

import { VEHICLE_TYPE_METADATA } from '../rulesEngine.js';
import { ICONS } from './icons.js';

const ROAD_ICONS = {
  ciclorruta: ICONS.roadCiclorruta,
  via_urbana: ICONS.roadUrban,
  andenes: ICONS.roadSidewalk,
  carretera_nacional: ICONS.roadNational,
};

const SAFETY_ICONS = {
  casco: ICONS.helmet,
  luces: ICONS.lights,
  reflectivos: ICONS.reflective,
  pasajeros: ICONS.passenger,
};

const CHEVRON_SVG = `
  <svg class="w-3.5 h-3.5 shrink-0 transition-transform duration-150 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
`;

/**
 * Devuelve tokens de color e icono de semáforo con contraste óptimo y soporte claro/oscuro.
 */
function getSemaphoreStyles(semaphore) {
  switch (semaphore) {
    case 'green':
      return {
        card: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80',
        badge:
          'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
        icon: 'text-emerald-700 dark:text-emerald-400',
        title: 'text-emerald-950 dark:text-emerald-100',
      };
    case 'yellow':
      return {
        card: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80',
        badge:
          'bg-amber-100 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
        icon: 'text-amber-700 dark:text-amber-400',
        title: 'text-amber-950 dark:text-amber-100',
      };
    case 'red':
    default:
      return {
        card: 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80',
        badge:
          'bg-rose-100 dark:bg-rose-900/80 text-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-700',
        icon: 'text-rose-700 dark:text-rose-400',
        title: 'text-rose-950 dark:text-rose-100',
      };
  }
}

export function renderResultsDashboard(container, evaluation) {
  const {
    input,
    classification,
    ageEvaluation,
    documents,
    allowedRoads,
    safetyKit,
    sanctions,
  } = evaluation;

  const isVelmpu = classification.isVelmpu;
  const vehicleMeta = VEHICLE_TYPE_METADATA[input.vehicleType];
  const ageStyles = getSemaphoreStyles(ageEvaluation.semaphore);

  // Estilos del veredicto: VELMPU (verde), Ciclomotor exento por Art. 15 (ámbar), Ciclomotor con papeles (rojo)
  const hero = isVelmpu
    ? {
        section: 'bg-white dark:bg-[#111c27] border-emerald-600 dark:border-emerald-500',
        iconBox: 'bg-emerald-700 text-white',
        badge:
          'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
        label: 'Categoría VELMPU (Exento de trámites)',
      }
    : classification.isDocumentExempt
    ? {
        section: 'bg-white dark:bg-[#1f1a10] border-amber-500 dark:border-amber-500',
        iconBox: 'bg-amber-600 text-white',
        badge:
          'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
        label: 'Categoría Ciclomotor (Exento de trámites — Art. 15)',
      }
    : {
        section: 'bg-white dark:bg-[#1f131a] border-rose-600 dark:border-rose-500',
        iconBox: 'bg-rose-700 text-white',
        badge:
          'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
        label: 'Categoría Ciclomotor (Requiere trámites)',
      };

  // Ordenar vías: Ciclorruta, Vía Urbana, Andenes y Carretera Nacional
  const orderedRoadIds = ['ciclorruta', 'via_urbana', 'andenes', 'carretera_nacional'];
  const sortedRoads = orderedRoadIds
    .map((id) => allowedRoads.roads.find((r) => r.id === id))
    .filter(Boolean);

  const aiPromptText = `Hola. Actúa como un experto en la normativa de movilidad eléctrica y tránsito en Colombia, con pleno conocimiento de la nueva Ley 2486 de 2025 (categoría VELMPU: patinetas, bicicletas eléctricas y monociclos) y la Resolución 160 de 2017 (ciclomotores y motos eléctricas).

Por favor confírmame que estás listo respondiéndome con un saludo breve y diciéndome exactamente: "¡Claro! Dime qué preguntas tienes sobre tu vehículo o sobre la nueva ley" para que pueda hacerte mis consultas.`;

  container.innerHTML = `
    <div class="space-y-5" aria-live="polite">
      <!-- 1. DICTAMEN LEGAL PRINCIPAL (VEREDICTO HERO) -->
      <section
        class="rounded-xl p-5 sm:p-6 border-2 shadow-xs transition-colors ${hero.section}"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div
              class="p-2.5 rounded-lg shrink-0 ${hero.iconBox}"
            >
              ${isVelmpu ? ICONS.shieldCheck : ICONS.shieldAlert}
            </div>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${hero.badge}"
                >
                  ${hero.label}
                </span>
                <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
                  ${vehicleMeta.label} — ${input.powerWatts}W / ${input.weightKg}kg / ${input.maxSpeedKmh}km/h
                </span>
              </div>

              <h2 class="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
                ${classification.badgeTitle}
              </h2>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                ${classification.summary}
              </p>
            </div>
          </div>
        </div>

        ${
          classification.triggers.length > 0
            ? `
          <!-- Desplegable: Razones técnicas de clasificación como ciclomotor -->
          <details class="group mt-4 pt-3 border-t border-rose-200 dark:border-rose-900/60" open>
            <summary class="flex items-center justify-between cursor-pointer list-none text-xs font-bold text-rose-800 dark:text-rose-300 hover:text-rose-950 dark:hover:text-rose-100 select-none">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>¿Por qué clasifica como Ciclomotor? (${classification.triggers.length} límites superados)</span>
              </span>
              <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                <span>Ver más</span>
                ${CHEVRON_SVG}
              </span>
            </summary>
            <ul class="mt-2 space-y-1.5 text-xs text-rose-900 dark:text-rose-200 pl-3">
              ${classification.triggers
                .map(
                  (t) => `
                <li class="flex items-start gap-2">
                  <span class="text-rose-600 dark:text-rose-400 font-bold">•</span>
                  <span>${t.reason}</span>
                </li>
              `
                )
                .join('')}
            </ul>
          </details>
        `
            : ''
        }

        <!-- Sub-bloque de Validación de Edad (con desplegable) -->
        <details class="group mt-4 p-3.5 rounded-lg border ${ageStyles.card} transition-colors">
          <summary class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 cursor-pointer list-none select-none">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="${ageStyles.icon} shrink-0">
                ${
                  ageEvaluation.semaphore === 'green'
                    ? ICONS.checkCircle
                    : ageEvaluation.semaphore === 'yellow'
                    ? ICONS.alertTriangle
                    : ICONS.xOctagon
                }
              </span>
              <h3 class="text-xs sm:text-sm font-bold ${ageStyles.title}">
                ${ageEvaluation.title}
              </h3>
              <span class="text-[11px] font-semibold px-2 py-0.5 rounded ${ageStyles.badge}">
                ${
                  ageEvaluation.semaphore === 'green'
                    ? 'Edad permitida'
                    : ageEvaluation.semaphore === 'yellow'
                    ? 'Únicamente en ciclorruta'
                    : 'Prohibido transitar (Inmovilización)'
                }
              </span>
            </div>
            <span class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 self-end sm:self-auto shrink-0">
              <span>Ver más</span>
              ${CHEVRON_SVG}
            </span>
          </summary>
          <p class="text-xs text-slate-700 dark:text-slate-300 pt-2.5 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 leading-relaxed">
            ${ageEvaluation.description}
          </p>
        </details>
      </section>

      <!-- 2. MATRIZ DE DOCUMENTACIÓN OBLIGATORIA (CON DESPLEGABLES) -->
      <section class="bg-white dark:bg-[#111927] rounded-xl border border-slate-300/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div class="flex items-center justify-between gap-2 mb-3.5">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Documentación exigida por autoridades de tránsito
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Marco normativo: ${classification.legalFramework}
            </p>
            ${
              documents.exemptionReason
                ? `<p class="text-xs mt-1 font-medium ${
                    documents.requiresPapers
                      ? 'text-slate-500 dark:text-slate-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }">${documents.exemptionReason}</p>`
                : ''
            }
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${documents.items
            .map((doc) => {
              const st = getSemaphoreStyles(doc.semaphore);
              return `
              <div class="p-3.5 rounded-lg border ${st.card} flex flex-col justify-between transition-colors">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="${st.icon} shrink-0">
                      ${doc.required ? ICONS.xOctagon : ICONS.checkCircle}
                    </span>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      ${doc.name}
                    </h4>
                  </div>
                  <div>
                    <span class="inline-flex text-xs font-bold px-2 py-0.5 rounded ${st.badge}">
                      ${doc.badge}
                    </span>
                  </div>
                </div>

                <!-- Desplegable con detalle legal -->
                <details class="group mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <summary class="flex items-center justify-between cursor-pointer list-none text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 select-none">
                    <span>Ver más</span>
                    ${CHEVRON_SVG}
                  </summary>
                  <p class="text-xs text-slate-600 dark:text-slate-300 pt-2 leading-relaxed">
                    ${doc.description}
                  </p>
                </details>
              </div>
            `;
            })
            .join('')}
        </div>
      </section>

      <!-- 3. ZONAS DE CIRCULACIÓN Y LÍMITES DE VELOCIDAD (CON DESPLEGABLES) -->
      <section class="bg-white dark:bg-[#111927] rounded-xl border border-slate-300/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div class="mb-3.5">
          <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Infraestructura permitida y límites de velocidad
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Reglas de circulación vial bajo la Ley 2486 de 2025 y la Resolución 160 de 2017.
          </p>
        </div>

        <!-- Alerta Especial Bogotá D.C. -->
        ${
          allowedRoads.bogotaAlert.active
            ? `
          <div class="mb-3.5 p-3.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 flex items-start gap-3">
            <span class="text-amber-700 dark:text-amber-400 mt-0.5 shrink-0">
              ${ICONS.alertTriangle}
            </span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h4 class="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                  ${allowedRoads.bogotaAlert.title}
                </h4>
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                  Regulación Distrital Bogotá
                </span>
              </div>
              <p class="text-xs text-amber-900 dark:text-amber-200 mt-1 leading-relaxed">
                ${allowedRoads.bogotaAlert.message}
              </p>
            </div>
          </div>
        `
            : ''
        }

        <div class="space-y-2">
          ${sortedRoads
            .map((road) => {
              const st = getSemaphoreStyles(road.semaphore);
              return `
              <div class="p-3 rounded-lg border ${st.card} flex items-start gap-3">
                <div class="p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${st.icon} shrink-0">
                  ${ROAD_ICONS[road.id] || ICONS.roadUrban}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      ${road.name}
                    </h4>
                    <div class="flex flex-wrap items-center gap-1.5">
                      ${
                        road.maxSpeedKmh > 0
                          ? `
                        <span class="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                          ≤ ${road.maxSpeedKmh} km/h
                        </span>
                      `
                          : ''
                      }
                      <span class="text-xs font-semibold px-2 py-0.5 rounded ${st.badge}">
                        ${road.statusLabel}
                      </span>
                    </div>
                  </div>

                  <!-- Desplegable con condiciones de tránsito -->
                  <details class="group mt-1 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <summary class="flex items-center justify-between cursor-pointer list-none text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 select-none">
                      <span>Ver más</span>
                      ${CHEVRON_SVG}
                    </summary>
                    <p class="text-xs text-slate-600 dark:text-slate-300 pt-1.5 leading-relaxed">
                      ${road.description}
                    </p>
                  </details>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </section>

      <!-- 4. CASCOS TÉCNICOS, KIT DE SEGURIDAD Y MULTAS -->
      <section class="bg-white dark:bg-[#111927] rounded-xl border border-slate-300/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <!-- Kit de Seguridad -->
        <div>
          <div class="mb-3.5">
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Elementos de protección y equipamiento obligatorio
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Requisitos de protección personal y seguridad activa exigidos en vía pública.
            </p>
          </div>

          <!-- Especificación Técnica del Casco Reglamentario (con desplegable) -->
          <div class="mb-3.5 rounded-lg border ${
            isVelmpu
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
          }">
            <div class="p-3.5 sm:p-4 flex flex-col md:flex-row items-center gap-4">
              <div class="w-full md:w-36 shrink-0 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 flex flex-col items-center justify-center">
                <img
                  src="${isVelmpu ? './styles/casco-velmpu.svg' : './styles/casco-ciclomotor.png'}"
                  alt="Ilustración técnica del tipo de casco exigido por la ley para este vehículo"
                  class="${isVelmpu ? 'w-full h-full object-contain' : 'w-20 h-20 object-contain filter drop-shadow-sm'}"
                  loading="lazy"
                />
                <span class="mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded text-center ${
                  isVelmpu
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                }">
                  ${isVelmpu ? 'Casco Bici / Patineta' : 'Casco Reglamentario Moto'}
                </span>
              </div>
              <div class="flex-1 space-y-1.5 w-full">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    isVelmpu
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300'
                  }">
                    ${isVelmpu ? 'Casco para VELMPU (Ley 2486)' : 'Casco Reglamentario (Res. 23385)'}
                  </span>
                  <span class="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    Evita inmovilización inmediata
                  </span>
                </div>

                <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  ${
                    isVelmpu
                      ? '¿Qué tipo de casco exige la ley para patinetas y bicicletas eléctricas?'
                      : '¿Qué tipo de casco exige la ley para ciclomotores y motos eléctricas?'
                  }
                </h4>

                <p class="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                  ${
                    isVelmpu
                      ? 'Casco de seguridad obligatorio con las características que defina el Ministerio de Transporte. Como referencia: casco de ciclismo o patinaje certificado y con barboquejo abrochado.'
                      : 'Prohibido usar casco de bicicleta. Exige casco cerrado o abatible de moto (ECE 22.06 / DOT / NTC 4533).'
                  }
                </p>

                <!-- Desplegable técnico del casco -->
                <details class="group mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <summary class="inline-flex items-center gap-1.5 cursor-pointer list-none text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 select-none">
                    <span>Ver más</span>
                    ${CHEVRON_SVG}
                  </summary>
                  <div class="pt-2 space-y-2">
                    <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      ${
                        isVelmpu
                          ? 'La Ley 2486 exige <strong>casco de seguridad con las características que defina el Ministerio de Transporte</strong> (Art. 96-1 num. 10). Mientras tanto, como referencia, <strong>puedes usar casco de ciclismo o patinaje</strong> con certificación técnica (como <strong>NTC 5239, EN 1078 o CPSC 1203</strong>) y <strong>abrochado con su barboquejo</strong>. No se permite transitar con el casco suelto ni con cascos plásticos de juguete.'
                          : '<strong class="text-rose-700 dark:text-rose-300">ESTRICTAMENTE PROHIBIDO usar casco de bicicleta en ciclomotores.</strong> La norma exige casco cerrado o abatible de motocicleta certificado bajo <strong>ECE 22.05 / ECE 22.06, DOT FMVSS 218 o NTC 4533</strong> con visor reglamentario y broche micrométrico o doble D.'
                      }
                    </p>
                    <div class="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                      <span class="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        ${isVelmpu ? 'Referencia: NTC 5239 / EN 1078 (pendiente MinTransporte)' : 'Norma: ECE 22.06 / DOT / NTC 4533'}
                      </span>
                      <span class="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        Obligatorio barboquejo abrochado
                      </span>
                      <span class="px-2 py-0.5 rounded ${
                        isVelmpu
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }">
                        ${isVelmpu ? 'No exige casco cerrado de moto' : 'Casco de bicicleta = Inmovilización'}
                      </span>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          <!-- Otros elementos del kit de seguridad (con desplegables) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            ${safetyKit.items
              .map((item) => {
                const st = getSemaphoreStyles(item.semaphore);
                return `
                <div class="p-3.5 rounded-lg border ${st.card} flex flex-col justify-between transition-colors">
                  <div class="space-y-1.5">
                    <div class="flex items-center gap-2">
                      <div class="p-1.5 rounded-md bg-white dark:bg-slate-900 ${st.icon} shrink-0">
                        ${SAFETY_ICONS[item.id] || ICONS.helmet}
                      </div>
                      <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        ${item.name}
                      </h4>
                    </div>
                    <div>
                      <span class="inline-flex text-[11px] font-semibold px-2 py-0.5 rounded ${st.badge}">
                        ${item.badge}
                      </span>
                    </div>
                  </div>

                  <details class="group mt-2.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <summary class="flex items-center justify-between cursor-pointer list-none text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 select-none">
                      <span>Ver más</span>
                      ${CHEVRON_SVG}
                    </summary>
                    <p class="text-xs text-slate-600 dark:text-slate-300 pt-1.5 leading-relaxed">
                      ${item.specification}
                    </p>
                  </details>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>

        <!-- Cuadro de Sanciones, Multas e Inmovilización (Desplegable Principal) -->
        <div class="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Régimen sancionatorio y causales de inmovilización
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                ${sanctions.categoryCode}
              </p>
            </div>
            <span class="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              Multa estimada: ${sanctions.fineLabel}
            </span>
          </div>

          ${
            sanctions.activeAlerts.length > 0
              ? `
            <div class="mb-3 p-3 rounded-lg bg-rose-700 text-white shadow-xs">
              <div class="flex items-start gap-2.5">
                ${ICONS.xOctagon}
                <div class="text-xs font-semibold">
                  ${sanctions.activeAlerts.join(' ')}
                </div>
              </div>
            </div>
          `
              : ''
          }

          <!-- Desplegable del desglose de sanciones -->
          <details class="group rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <summary class="flex items-center justify-between cursor-pointer list-none p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 select-none transition-colors">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>Desglose de infracciones y causales de inmovilización</span>
              </span>
              <span class="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <span>Ver más</span>
                ${CHEVRON_SVG}
              </span>
            </summary>
            <div class="p-3.5 bg-white dark:bg-[#111927] border-t border-slate-200 dark:border-slate-800">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <!-- Conductas Sancionadas -->
                <div class="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/80">
                  <div class="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-bold text-xs sm:text-sm mb-2">
                    <span class="text-amber-700 dark:text-amber-400">${ICONS.alertTriangle}</span>
                    <span>Infracciones económicas (${sanctions.fineLabel})</span>
                  </div>
                  <ul class="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    ${sanctions.finesList
                      .map(
                        (fine) => `
                      <li class="flex items-start gap-2">
                        <span class="text-amber-600 dark:text-amber-400 font-bold">•</span>
                        <span>${fine}</span>
                      </li>
                    `
                      )
                      .join('')}
                  </ul>
                </div>

                <!-- Causales de Inmovilización -->
                <div class="p-3 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800/80">
                  <div class="flex items-center gap-2 text-rose-950 dark:text-rose-200 font-bold text-xs sm:text-sm mb-2">
                    <span class="text-rose-700 dark:text-rose-400">${ICONS.xOctagon}</span>
                    <span>Causales de inmovilización inmediata</span>
                  </div>
                  <ul class="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    ${sanctions.immobilizationCauses
                      .map(
                        (cause) => `
                      <li class="flex items-start gap-2">
                        <span class="text-rose-600 dark:text-rose-400 font-bold">•</span>
                        <span>${cause}</span>
                      </li>
                    `
                      )
                      .join('')}
                  </ul>
                </div>
              </div>
            </div>
          </details>
        </div>
      </section>

      <!-- 5. CONSULTA PERSONALIZADA CON INTELIGENCIA ARTIFICIAL (PROMPT LISTO PARA COPIAR) -->
      <section class="bg-white dark:bg-[#111927] rounded-xl border border-indigo-200/80 dark:border-indigo-950/60 p-5 sm:p-6 shadow-xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div class="flex items-start gap-2.5">
            <div class="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                <path d="M5 3v4"/>
                <path d="M19 17v4"/>
                <path d="M3 5h4"/>
                <path d="M17 19h4"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                ¿Quieres resolver dudas más específicas sobre tu caso?
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Copia este prompt y pégalo en <strong>ChatGPT, Claude o Gemini</strong> para hacer consultas jurídicas detalladas sobre la Ley 2486 de 2025.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-copy-ai-prompt"
            class="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shrink-0 shadow-2xs focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <span>Copiar prompt para IA</span>
          </button>
        </div>

        <p id="ai-prompt-toast" class="hidden text-xs font-semibold text-emerald-700 dark:text-emerald-400 text-right mb-2" role="status">
          ¡Prompt copiado al portapapeles! Listo para pegar en ChatGPT, Claude o Gemini.
        </p>

        <!-- Desplegable con el texto del prompt generado -->
        <details class="group rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900/40">
          <summary class="flex items-center justify-between cursor-pointer list-none p-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white select-none transition-colors">
            <span>Ver texto del prompt generado</span>
            <span class="inline-flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <span>Ver más</span>
              ${CHEVRON_SVG}
            </span>
          </summary>
          <div class="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121d]">
            <pre class="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed select-all bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">${aiPromptText}</pre>
            
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
              <span>Pega el prompt directamente en:</span>
              <div class="flex items-center gap-2.5">
                <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">ChatGPT ↗</a>
                <span>•</span>
                <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Claude ↗</a>
                <span>•</span>
                <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" class="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Gemini ↗</a>
              </div>
            </div>
          </div>
        </details>
      </section>
    </div>
  `;

  // Listener para copiar el prompt de IA con feedback
  const copyPromptBtn = container.querySelector('#btn-copy-ai-prompt');
  const promptToast = container.querySelector('#ai-prompt-toast');
  if (copyPromptBtn) {
    copyPromptBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(aiPromptText);
        if (promptToast) {
          promptToast.classList.remove('hidden');
          copyPromptBtn.classList.replace('bg-indigo-600', 'bg-emerald-700');
          copyPromptBtn.innerHTML = `
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            <span>¡Copiado!</span>
          `;
          setTimeout(() => {
            promptToast.classList.add('hidden');
            copyPromptBtn.classList.replace('bg-emerald-700', 'bg-indigo-600');
            copyPromptBtn.innerHTML = `
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>Copiar prompt para IA</span>
            `;
          }, 2400);
        }
      } catch {
        window.prompt('Copia este prompt para pegarlo en tu IA:', aiPromptText);
      }
    });
  }
}
