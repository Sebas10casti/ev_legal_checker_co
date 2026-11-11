/**
 * @fileoverview Panel de Resultados y Dictamen Legal en Tiempo Real (Columna Derecha).
 * Presenta el Veredicto Principal de Estado, la evaluación de edad, la matriz de 4 documentos,
 * los permisos de circulación por infraestructura vial, la especificación técnica de cascos (NTC vs ECE)
 * y el régimen de sanciones e inmovilización.
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

  // Ordenar vías: Ciclorruta, Vía Urbana, Andenes y Carretera Nacional
  const orderedRoadIds = ['ciclorruta', 'via_urbana', 'andenes', 'carretera_nacional'];
  const sortedRoads = orderedRoadIds
    .map((id) => allowedRoads.roads.find((r) => r.id === id))
    .filter(Boolean);

  container.innerHTML = `
    <div class="space-y-6" aria-live="polite">
      <!-- 1. DICTAMEN LEGAL PRINCIPAL (VEREDICTO HERO) -->
      <section
        class="rounded-xl p-5 sm:p-6 border-2 shadow-xs transition-colors ${
          isVelmpu
            ? 'bg-white dark:bg-[#111c27] border-emerald-600 dark:border-emerald-500'
            : 'bg-white dark:bg-[#1f131a] border-rose-600 dark:border-rose-500'
        }"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div
              class="p-2.5 rounded-lg shrink-0 ${
                isVelmpu
                  ? 'bg-emerald-700 text-white'
                  : 'bg-rose-700 text-white'
              }"
            >
              ${isVelmpu ? ICONS.shieldCheck : ICONS.shieldAlert}
            </div>
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    isVelmpu
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                  }"
                >
                  ${isVelmpu ? 'Categoría VELMPU (Exento de trámites)' : 'Categoría Ciclomotor (Requiere trámites)'}
                </span>
                <span class="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
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
          <div class="mt-4 pt-3.5 border-t border-rose-200 dark:border-rose-900/60">
            <h3 class="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
              Límites técnicos superados (causales de clasificación como Ciclomotor)
            </h3>
            <ul class="space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
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
          </div>
        `
            : ''
        }

        <!-- Sub-bloque de Validación de Edad -->
        <div class="mt-4 p-3.5 rounded-lg border ${ageStyles.card} flex items-start gap-3">
          <div class="${ageStyles.icon} mt-0.5 shrink-0">
            ${
              ageEvaluation.semaphore === 'green'
                ? ICONS.checkCircle
                : ageEvaluation.semaphore === 'yellow'
                ? ICONS.alertTriangle
                : ICONS.xOctagon
            }
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap items-center justify-between gap-2">
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
            <p class="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
              ${ageEvaluation.description}
            </p>
          </div>
        </div>
      </section>

      <!-- 2. MATRIZ DE DOCUMENTACIÓN OBLIGATORIA (4 REQUISITOS) -->
      <section class="bg-white dark:bg-[#111927] rounded-xl border border-slate-300/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div class="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Documentación exigida por autoridades de tránsito
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Marco normativo aplicable: ${classification.legalFramework}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${documents.items
            .map((doc) => {
              const st = getSemaphoreStyles(doc.semaphore);
              return `
              <div class="p-3.5 rounded-lg border ${st.card} flex flex-col justify-between">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <span class="${st.icon} shrink-0">
                      ${doc.required ? ICONS.xOctagon : ICONS.checkCircle}
                    </span>
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      ${doc.name}
                    </h4>
                  </div>
                  <span class="text-xs font-bold px-2 py-0.5 rounded ${st.badge}">
                    ${doc.badge}
                  </span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  ${doc.description}
                </p>
              </div>
            `;
            })
            .join('')}
        </div>
      </section>

      <!-- 3. ZONAS DE CIRCULACIÓN Y LÍMITES DE VELOCIDAD -->
      <section class="bg-white dark:bg-[#111927] rounded-xl border border-slate-300/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div class="mb-4">
          <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Infraestructura permitida y límites de velocidad
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Reglas de tránsito por tipo de vía según la Ley 2486 de 2025 y la Resolución 160 de 2017.
          </p>
        </div>

        <!-- Alerta Especial Bogotá D.C. -->
        ${
          allowedRoads.bogotaAlert.active
            ? `
          <div class="mb-4 p-3.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 flex items-start gap-3">
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

        <div class="space-y-2.5">
          ${sortedRoads
            .map((road) => {
              const st = getSemaphoreStyles(road.semaphore);
              return `
              <div class="p-3.5 rounded-lg border ${st.card} flex items-start gap-3">
                <div class="p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${st.icon} shrink-0">
                  ${ROAD_ICONS[road.id] || ICONS.roadUrban}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      ${road.name}
                    </h4>
                    <div class="flex flex-wrap items-center gap-1.5">
                      ${
                        road.maxSpeedKmh > 0
                          ? `
                        <span class="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
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
                  <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    ${road.description}
                  </p>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      </section>

      <!-- 4. CASCOS TÉCNICOS, KIT DE SEGURIDAD Y MULTAS -->
      <section class="bg-white dark:bg-[#111927] rounded-xl border border-slate-300/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
        <!-- Kit de Seguridad -->
        <div>
          <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Elementos de protección y equipamiento obligatorio
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
            Requisitos de protección personal y seguridad activa exigidos en vía pública.
          </p>

          <!-- Especificación Técnica del Casco Reglamentario -->
          <div class="mb-4 rounded-lg border ${
            isVelmpu
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
          }">
            <div class="p-4 sm:p-5 flex flex-col md:flex-row items-center gap-5">
              <div class="w-full md:w-48 shrink-0 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 flex flex-col items-center justify-center">
                <img
                  src="${isVelmpu ? './styles/casco-velmpu.svg' : './styles/casco-ciclomotor.png'}"
                  alt="Ilustración técnica del tipo de casco exigido por la ley para este vehículo"
                  class="${isVelmpu ? 'w-full h-full object-contain' : 'w-24 h-24 object-contain filter drop-shadow-sm'}"
                  loading="lazy"
                />
                <span class="mt-1 text-[11px] font-bold px-2 py-0.5 rounded text-center ${
                  isVelmpu
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                }">
                  ${isVelmpu ? 'Casco Bicicleta / Patineta' : 'Casco Reglamentario Moto'}
                </span>
              </div>
              <div class="flex-1 space-y-2">
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

                <h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  ${
                    isVelmpu
                      ? '¿Qué tipo de casco exige la ley para patinetas y bicicletas eléctricas?'
                      : '¿Qué tipo de casco exige la ley para ciclomotores y motos eléctricas?'
                  }
                </h4>

                <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  ${
                    isVelmpu
                      ? '<strong>Está permitido el casco de ciclismo o patinaje</strong>, siempre que cuente con certificación técnica (como <strong>NTC 5239, EN 1078 o CPSC 1203</strong>) y esté <strong>abrochado con su barboquejo</strong>. No se permite transitar con el casco suelto ni con cascos plásticos de juguete.'
                      : '<strong class="text-rose-700 dark:text-rose-300">PROHIBIDO usar casco de bicicleta en ciclomotores.</strong> La norma exige casco cerrado o abatible de motocicleta certificado bajo <strong>ECE 22.05 / ECE 22.06, DOT FMVSS 218 o NTC 4533</strong> con visor reglamentario y broche micrométrico o doble D.'
                  }
                </p>

                <div class="pt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                  <span class="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono">
                    ${isVelmpu ? 'Norma: NTC 5239 / EN 1078' : 'Norma: ECE 22.06 / DOT / NTC 4533'}
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
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${safetyKit.items
              .map((item) => {
                const st = getSemaphoreStyles(item.semaphore);
                return `
                <div class="p-3.5 rounded-lg border ${st.card} flex items-start gap-3">
                  <div class="p-2 rounded-md bg-white dark:bg-slate-900 ${st.icon} shrink-0">
                    ${SAFETY_ICONS[item.id] || ICONS.helmet}
                  </div>
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        ${item.name}
                      </h4>
                      <span class="text-[11px] font-semibold px-2 py-0.5 rounded ${st.badge}">
                        ${item.badge}
                      </span>
                    </div>
                    <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      ${item.specification}
                    </p>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>

        <!-- Cuadro de Sanciones, Multas e Inmovilización -->
        <div class="pt-5 border-t border-slate-200 dark:border-slate-800">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <div>
              <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Régimen sancionatorio y causales de inmovilización
              </h3>
              <p class="text-xs font-mono text-slate-500 dark:text-slate-400">
                ${sanctions.categoryCode}
              </p>
            </div>
            <span class="px-2.5 py-0.5 rounded text-xs font-bold font-mono bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
              Multa estimada: ${sanctions.fineLabel}
            </span>
          </div>

          ${
            sanctions.activeAlerts.length > 0
              ? `
            <div class="mb-4 p-3 rounded-lg bg-rose-700 text-white shadow-xs">
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

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <!-- Conductas Sancionadas -->
            <div class="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/80">
              <div class="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-bold text-xs sm:text-sm mb-2.5">
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
            <div class="p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800/80">
              <div class="flex items-center gap-2 text-rose-950 dark:text-rose-200 font-bold text-xs sm:text-sm mb-2.5">
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
      </section>
    </div>
  `;
}
