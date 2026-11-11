/**
 * @fileoverview Panel de Resultados en Tiempo Real (Columna Derecha).
 * Renderiza el Banner Principal de Estado, validación de edad, Grid de 4 Documentos,
 * sección "¿Por dónde puedo andar?" (con alerta Bogotá), Kit de Seguridad y Cuadro de Sanciones.
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
 * Devuelve clases de estilo tipo semáforo (verde, amarillo, rojo) con soporte claro/oscuro.
 */
function getSemaphoreStyles(semaphore) {
  switch (semaphore) {
    case 'green':
      return {
        card: 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/70',
        badge:
          'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
        icon: 'text-emerald-600 dark:text-emerald-400',
        title: 'text-emerald-950 dark:text-emerald-100',
      };
    case 'yellow':
      return {
        card: 'bg-amber-50/85 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/70',
        badge:
          'bg-amber-100 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
        icon: 'text-amber-600 dark:text-amber-400',
        title: 'text-amber-950 dark:text-amber-100',
      };
    case 'red':
    default:
      return {
        card: 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-200 dark:border-rose-800/70',
        badge:
          'bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700',
        icon: 'text-rose-600 dark:text-rose-400',
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

  // Ordenar vías para mostrar Ciclorruta, Vía Urbana, Andenes y Carretera Nacional
  const orderedRoadIds = ['ciclorruta', 'via_urbana', 'andenes', 'carretera_nacional'];
  const sortedRoads = orderedRoadIds
    .map((id) => allowedRoads.roads.find((r) => r.id === id))
    .filter(Boolean);

  container.innerHTML = `
    <div class="space-y-6" aria-live="polite">
      <!-- 1. BANNER PRINCIPAL DE ESTADO -->
      <section
        class="rounded-2xl p-5 sm:p-6 border-2 shadow-sm transition-all ${
          isVelmpu
            ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 dark:from-emerald-950/40 dark:via-slate-900 dark:to-emerald-950/20 border-emerald-500/80 dark:border-emerald-500/60'
            : 'bg-gradient-to-br from-rose-50 via-white to-orange-50/60 dark:from-rose-950/40 dark:via-slate-900 dark:to-orange-950/20 border-rose-500/80 dark:border-rose-500/60'
        }"
      >
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div class="flex items-start gap-3.5">
            <div
              class="p-3 rounded-2xl shrink-0 ${
                isVelmpu
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                  : 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
              }"
            >
              ${isVelmpu ? ICONS.shieldCheck : ICONS.shieldAlert}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                    isVelmpu
                      ? 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200'
                  }"
                >
                  ${isVelmpu ? 'Categoría VELMPU · Exento de Papeles' : 'Categoría Ciclomotor · Requiere Papeles'}
                </span>
                <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ${vehicleMeta.label} · ${input.powerWatts} W · ${input.weightKg} kg · ${input.maxSpeedKmh} km/h
                </span>
              </div>

              <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                ${classification.badgeTitle}
              </h2>
              <p class="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                ${classification.summary}
              </p>
            </div>
          </div>
        </div>

        ${
          classification.triggers.length > 0
            ? `
          <div class="mt-4 pt-3.5 border-t border-rose-200/80 dark:border-rose-900/60">
            <p class="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-2">
              ¿Por qué clasifica como Ciclomotor / Moto Eléctrica?
            </p>
            <ul class="space-y-1 text-xs text-rose-900 dark:text-rose-200">
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

        <!-- Sub-banner de Validación de Edad -->
        <div class="mt-4 p-3.5 rounded-xl border ${ageStyles.card} flex items-start gap-3">
          <div class="${ageStyles.icon} mt-0.5">
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
              <h3 class="text-sm font-bold ${ageStyles.title}">
                ${ageEvaluation.title}
              </h3>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-md ${ageStyles.badge}">
                ${
                  ageEvaluation.semaphore === 'green'
                    ? 'Edad Permitida'
                    : ageEvaluation.semaphore === 'yellow'
                    ? 'Solo Ciclorruta'
                    : 'Prohibido / Inmovilización'
                }
              </span>
            </div>
            <p class="text-xs text-slate-700 dark:text-slate-300 mt-1">
              ${ageEvaluation.description}
            </p>
          </div>
        </div>
      </section>

      <!-- 2. GRID DE DOCUMENTOS OBLIGATORIOS (4 TARJETAS) -->
      <section class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div class="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Documentación Exigida por Autoridades de Tránsito
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Requisitos documentales según ${classification.legalFramework}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${documents.items
            .map((doc) => {
              const st = getSemaphoreStyles(doc.semaphore);
              return `
              <div class="p-4 rounded-xl border ${st.card} flex flex-col justify-between transition-all">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-2">
                    <span class="${st.icon}">
                      ${doc.required ? ICONS.xOctagon : ICONS.checkCircle}
                    </span>
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                      ${doc.name}
                    </h4>
                  </div>
                  <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-full ${st.badge}">
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

      <!-- 3. SECCIÓN "¿POR DÓNDE PUEDO ANDAR?" -->
      <section class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div class="mb-4">
          <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            ¿Por dónde puedo andar y a qué velocidad?
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Infraestructura permitida, prohibiciones y límites operativos de velocidad.
          </p>
        </div>

        <!-- Alerta Especial Bogotá D.C. -->
        ${
          allowedRoads.bogotaAlert.active
            ? `
          <div class="mb-4 p-4 rounded-xl border-2 border-amber-400/90 dark:border-amber-600/80 bg-amber-50 dark:bg-amber-950/35 flex items-start gap-3">
            <span class="text-amber-600 dark:text-amber-400 mt-0.5">
              ${ICONS.alertTriangle}
            </span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h4 class="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                  ${allowedRoads.bogotaAlert.title}
                </h4>
                <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                  Regulación Local Distrital
                </span>
              </div>
              <p class="text-xs text-amber-900 dark:text-amber-200/90 mt-1 leading-relaxed">
                ${allowedRoads.bogotaAlert.message}
              </p>
            </div>
          </div>
        `
            : ''
        }

        <div class="space-y-3">
          ${sortedRoads
            .map((road) => {
              const st = getSemaphoreStyles(road.semaphore);
              return `
              <div class="p-4 rounded-xl border ${st.card} flex items-start gap-3.5 transition-all">
                <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 ${st.icon}">
                  ${ROAD_ICONS[road.id] || ICONS.roadUrban}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                      ${road.name}
                    </h4>
                    <div class="flex flex-wrap items-center gap-1.5">
                      ${
                        road.maxSpeedKmh > 0
                          ? `
                        <span class="text-xs font-extrabold px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                          Máx. ${road.maxSpeedKmh} km/h
                        </span>
                      `
                          : ''
                      }
                      <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${st.badge}">
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

      <!-- 4. SECCIÓN "OBLIGACIONES, KIT DE SEGURIDAD Y MULTAS" -->
      <section class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-6">
        <!-- Kit de Seguridad -->
        <div>
          <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Kit de Seguridad y Condiciones de Circulación
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
            Elementos de protección personal y reglas operativas exigidas en vía pública.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${safetyKit.items
              .map((item) => {
                const st = getSemaphoreStyles(item.semaphore);
                return `
                <div class="p-3.5 rounded-xl border ${st.card} flex items-start gap-3">
                  <div class="p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 ${st.icon}">
                    ${SAFETY_ICONS[item.id] || ICONS.helmet}
                  </div>
                  <div class="flex-1">
                    <div class="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        ${item.name}
                      </h4>
                      <span class="text-[11px] font-bold px-2 py-0.5 rounded ${st.badge}">
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

        <!-- Cuadro de Sanciones y Multas -->
        <div class="pt-5 border-t border-slate-200 dark:border-slate-800">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <div>
              <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Cuadro de Sanciones, Multas e Inmovilización
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                ${sanctions.categoryCode}
              </p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
              Multa: ${sanctions.fineLabel}
            </span>
          </div>

          ${
            sanctions.activeAlerts.length > 0
              ? `
            <div class="mb-4 p-3.5 rounded-xl bg-rose-600 text-white shadow-xs">
              <div class="flex items-start gap-2.5">
                ${ICONS.xOctagon}
                <div class="text-xs sm:text-sm font-bold">
                  ${sanctions.activeAlerts.join(' ')}
                </div>
              </div>
            </div>
          `
              : ''
          }

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Multas Económicas -->
            <div class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/70">
              <div class="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm mb-2.5">
                <span class="text-amber-600 dark:text-amber-400">${ICONS.alertTriangle}</span>
                <span>Conductas Sancionadas (${sanctions.fineLabel})</span>
              </div>
              <ul class="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                ${sanctions.finesList
                  .map(
                    (fine) => `
                  <li class="flex items-start gap-2">
                    <span class="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                    <span>${fine}</span>
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </div>

            <!-- Causales de Inmovilización -->
            <div class="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/70">
              <div class="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-sm mb-2.5">
                <span class="text-rose-600 dark:text-rose-400">${ICONS.xOctagon}</span>
                <span>Causales de Inmovilización Inmediata</span>
              </div>
              <ul class="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                ${sanctions.immobilizationCauses
                  .map(
                    (cause) => `
                  <li class="flex items-start gap-2">
                    <span class="text-rose-600 dark:text-rose-400 font-bold mt-0.5">•</span>
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
