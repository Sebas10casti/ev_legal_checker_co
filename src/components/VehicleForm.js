/**
 * @fileoverview Componente interactivo de configuración del vehículo y del conductor (Columna Izquierda).
 * Incluye tarjetas de selección de tipo de vehículo, sliders sincronizados con inputs numéricos,
 * marcas visuales en los umbrales legales (350W, 1000W, 60kg, 25km/h, 40km/h, 12 y 16 años)
 * y casos rápidos preconfigurados.
 */

import {
  VEHICLE_TYPES,
  VEHICLE_TYPE_METADATA,
  LEGAL_LIMITS,
  DEFAULT_INPUT,
} from '../rulesEngine.js';
import { ICONS } from './icons.js';

export const QUICK_PRESETS = [
  {
    id: 'scooter_std',
    label: 'Patineta Urbana (500W)',
    values: {
      vehicleType: VEHICLE_TYPES.SCOOTER,
      powerWatts: 500,
      weightKg: 22,
      maxSpeedKmh: 30,
      driverAge: 25,
      isBogota: false,
    },
  },
  {
    id: 'ebike_road',
    label: 'Bici Eléctrica (350W)',
    values: {
      vehicleType: VEHICLE_TYPES.EBIKE,
      powerWatts: 350,
      weightKg: 24,
      maxSpeedKmh: 25,
      driverAge: 30,
      isBogota: true,
    },
  },
  {
    id: 'scooter_pro',
    label: 'Patineta Potente (1200W)',
    values: {
      vehicleType: VEHICLE_TYPES.SCOOTER,
      powerWatts: 1200,
      weightKg: 34,
      maxSpeedKmh: 50,
      driverAge: 28,
      isBogota: false,
    },
  },
  {
    id: 'moped_vespa',
    label: 'Moto / Ciclomotor',
    values: {
      vehicleType: VEHICLE_TYPES.MOPED,
      powerWatts: 1500,
      weightKg: 72,
      maxSpeedKmh: 55,
      driverAge: 26,
      isBogota: false,
    },
  },
  {
    id: 'minor_14',
    label: 'Joven 14 años (VELMPU)',
    values: {
      vehicleType: VEHICLE_TYPES.SCOOTER,
      powerWatts: 350,
      weightKg: 16,
      maxSpeedKmh: 25,
      driverAge: 14,
      isBogota: false,
    },
  },
];

/**
 * Calcula el porcentaje (0 a 100%) de un valor dentro de un rango [min, max].
 */
function calcPercent(value, min, max) {
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)).toFixed(2);
}

export function mountVehicleForm(container, initialState, onChange) {
  const pos350W = calcPercent(350, 100, 3000);
  const pos1000W = calcPercent(1000, 100, 3000);
  const pos60Kg = calcPercent(60, 5, 120);
  const pos25Kmh = calcPercent(25, 15, 80);
  const pos40Kmh = calcPercent(40, 15, 80);
  const pos12Age = calcPercent(12, 8, 80);
  const pos16Age = calcPercent(16, 8, 80);

  container.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 transition-colors">
      <!-- Encabezado de tarjeta -->
      <div class="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-sm font-extrabold">1</span>
            Datos del Vehículo y Conductor
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Ajusta los controles para evaluar tu clasificación legal en tiempo real.
          </p>
        </div>
        <button
          type="button"
          id="btn-reset-form"
          class="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Restablecer valores por defecto"
        >
          Restablecer
        </button>
      </div>

      <!-- Perfiles Rápidos -->
      <div class="mb-6">
        <span class="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Ejemplos rápidos de prueba:
        </span>
        <div class="flex flex-wrap gap-1.5" id="preset-buttons-container">
          ${QUICK_PRESETS.map(
            (preset) => `
            <button
              type="button"
              data-preset-id="${preset.id}"
              class="preset-btn text-xs px-2.5 py-1.5 rounded-lg font-medium border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all cursor-pointer"
            >
              ${preset.label}
            </button>
          `
          ).join('')}
        </div>
      </div>

      <form id="ev-legal-form" class="space-y-6" novalidate>
        <!-- 1. Tipo de Vehículo -->
        <fieldset>
          <legend class="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2.5">
            1. Tipo de vehículo eléctrico
          </legend>
          <div class="grid grid-cols-2 gap-2.5 sm:gap-3" role="radiogroup" aria-label="Tipo de vehículo eléctrico">
            ${Object.values(VEHICLE_TYPE_METADATA)
              .map(
                (type) => `
              <button
                type="button"
                role="radio"
                aria-checked="false"
                data-vehicle-type="${type.id}"
                class="vehicle-type-card group relative flex flex-col items-start p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <div class="flex items-center justify-between w-full mb-1.5">
                  <span class="vehicle-icon p-2 rounded-lg transition-colors">
                    ${ICONS[type.id]}
                  </span>
                  <span class="vehicle-radio-dot w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors">
                    <span class="w-2 h-2 rounded-full bg-current opacity-0 transition-opacity"></span>
                  </span>
                </div>
                <span class="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  ${type.label}
                </span>
                <span class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  ${type.shortDesc}
                </span>
              </button>
            `
              )
              .join('')}
          </div>
        </fieldset>

        <!-- 2. Potencia Nominal del Motor (W) -->
        <div class="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
          <div class="flex items-center justify-between gap-2 mb-2">
            <label for="input-power-num" class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              2. Potencia nominal del motor
            </label>
            <div class="flex items-center gap-1.5">
              <input
                id="input-power-num"
                type="number"
                min="100"
                max="3000"
                step="10"
                aria-label="Potencia nominal en Vatios"
                class="w-24 px-2.5 py-1 text-right text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span class="text-xs font-bold text-slate-500 dark:text-slate-400">W</span>
            </div>
          </div>

          <input
            id="input-power-range"
            type="range"
            min="100"
            max="3000"
            step="10"
            aria-label="Deslizador de potencia nominal en Vatios"
            class="w-full accent-emerald-600 cursor-pointer"
          />

          <!-- Marcas de referencia (350W y 1000W) -->
          <div class="relative h-9 mt-1 text-[11px] select-none">
            <span class="absolute left-0 top-1 text-slate-400">100W</span>
            <button
              type="button"
              data-jump-field="powerWatts"
              data-jump-value="350"
              style="left: ${pos350W}%"
              class="threshold-marker -translate-x-1/2 absolute top-0 flex flex-col items-center group cursor-pointer"
              title="Haz clic para fijar en 350 W (Alerta Bogotá)"
            >
              <span class="w-0.5 h-2 bg-amber-500"></span>
              <span class="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800 group-hover:scale-105 transition-transform">
                350W Bogotá
              </span>
            </button>
            <button
              type="button"
              data-jump-field="powerWatts"
              data-jump-value="1000"
              style="left: ${pos1000W}%"
              class="threshold-marker -translate-x-1/2 absolute top-0 flex flex-col items-center group cursor-pointer"
              title="Haz clic para fijar en 1000 W (Tope Ley 2486)"
            >
              <span class="w-0.5 h-2 bg-rose-500"></span>
              <span class="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 font-semibold border border-rose-300 dark:border-rose-800 group-hover:scale-105 transition-transform">
                1000W Límite Ley
              </span>
            </button>
            <span class="absolute right-0 top-1 text-slate-400">3000W</span>
          </div>
          <p id="power-status-hint" class="text-xs mt-1 font-medium"></p>
        </div>

        <!-- 3. Peso del Vehículo (kg) -->
        <div class="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
          <div class="flex items-center justify-between gap-2 mb-2">
            <label for="input-weight-num" class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              3. Peso del vehículo (con batería)
            </label>
            <div class="flex items-center gap-1.5">
              <input
                id="input-weight-num"
                type="number"
                min="5"
                max="120"
                step="1"
                aria-label="Peso del vehículo en kilogramos"
                class="w-20 px-2.5 py-1 text-right text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span class="text-xs font-bold text-slate-500 dark:text-slate-400">kg</span>
            </div>
          </div>

          <input
            id="input-weight-range"
            type="range"
            min="5"
            max="120"
            step="1"
            aria-label="Deslizador de peso del vehículo en kilogramos"
            class="w-full accent-emerald-600 cursor-pointer"
          />

          <!-- Marca de referencia (60kg) -->
          <div class="relative h-9 mt-1 text-[11px] select-none">
            <span class="absolute left-0 top-1 text-slate-400">5 kg</span>
            <button
              type="button"
              data-jump-field="weightKg"
              data-jump-value="60"
              style="left: ${pos60Kg}%"
              class="threshold-marker -translate-x-1/2 absolute top-0 flex flex-col items-center group cursor-pointer"
              title="Haz clic para fijar en 60 kg (Tope Ley 2486)"
            >
              <span class="w-0.5 h-2 bg-rose-500"></span>
              <span class="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 font-semibold border border-rose-300 dark:border-rose-800 group-hover:scale-105 transition-transform">
                60 kg Límite Ley
              </span>
            </button>
            <span class="absolute right-0 top-1 text-slate-400">120 kg</span>
          </div>
          <p id="weight-status-hint" class="text-xs mt-1 font-medium"></p>
        </div>

        <!-- 4. Velocidad Máxima por Diseño (km/h) -->
        <div class="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
          <div class="flex items-center justify-between gap-2 mb-2">
            <label for="input-speed-num" class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              4. Velocidad máxima por diseño
            </label>
            <div class="flex items-center gap-1.5">
              <input
                id="input-speed-num"
                type="number"
                min="15"
                max="80"
                step="1"
                aria-label="Velocidad máxima en kilómetros por hora"
                class="w-20 px-2.5 py-1 text-right text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span class="text-xs font-bold text-slate-500 dark:text-slate-400">km/h</span>
            </div>
          </div>

          <input
            id="input-speed-range"
            type="range"
            min="15"
            max="80"
            step="1"
            aria-label="Deslizador de velocidad máxima en km/h"
            class="w-full accent-emerald-600 cursor-pointer"
          />

          <!-- Marcas de referencia (25 km/h y 40 km/h) -->
          <div class="relative h-9 mt-1 text-[11px] select-none">
            <span class="absolute left-0 top-1 text-slate-400">15</span>
            <button
              type="button"
              data-jump-field="maxSpeedKmh"
              data-jump-value="25"
              style="left: ${pos25Kmh}%"
              class="threshold-marker -translate-x-1/2 absolute top-0 flex flex-col items-center group cursor-pointer"
              title="Haz clic para fijar en 25 km/h (Velocidad máx. en ciclorruta)"
            >
              <span class="w-0.5 h-2 bg-emerald-500"></span>
              <span class="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800 group-hover:scale-105 transition-transform">
                25 Ciclorruta
              </span>
            </button>
            <button
              type="button"
              data-jump-field="maxSpeedKmh"
              data-jump-value="40"
              style="left: ${pos40Kmh}%"
              class="threshold-marker -translate-x-1/2 absolute top-0 flex flex-col items-center group cursor-pointer"
              title="Haz clic para fijar en 40 km/h (Tope Ley 2486)"
            >
              <span class="w-0.5 h-2 bg-rose-500"></span>
              <span class="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-300 font-semibold border border-rose-300 dark:border-rose-800 group-hover:scale-105 transition-transform">
                40 km/h Límite Ley
              </span>
            </button>
            <span class="absolute right-0 top-1 text-slate-400">80 km/h</span>
          </div>
          <p id="speed-status-hint" class="text-xs mt-1 font-medium"></p>
        </div>

        <!-- 5. Edad del Conductor (años) -->
        <div class="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
          <div class="flex items-center justify-between gap-2 mb-2">
            <label for="input-age-num" class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              5. Edad del conductor
            </label>
            <div class="flex items-center gap-1.5">
              <input
                id="input-age-num"
                type="number"
                min="8"
                max="80"
                step="1"
                aria-label="Edad del conductor en años"
                class="w-20 px-2.5 py-1 text-right text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span class="text-xs font-bold text-slate-500 dark:text-slate-400">años</span>
            </div>
          </div>

          <input
            id="input-age-range"
            type="range"
            min="8"
            max="80"
            step="1"
            aria-label="Deslizador de edad del conductor"
            class="w-full accent-emerald-600 cursor-pointer"
          />

          <!-- Marcas de referencia (12 y 16 años) -->
          <div class="relative h-9 mt-1 text-[11px] select-none">
            <span class="absolute left-0 top-1 text-slate-400">8</span>
            <button
              type="button"
              data-jump-field="driverAge"
              data-jump-value="12"
              style="left: ${pos12Age}%"
              class="threshold-marker -translate-x-1/2 absolute top-0 flex flex-col items-center group cursor-pointer"
              title="12 años: Edad mínima en ciclorruta"
            >
              <span class="w-0.5 h-2 bg-amber-500"></span>
              <span class="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-800">
                12a
              </span>
            </button>
            <button
              type="button"
              data-jump-field="driverAge"
              data-jump-value="16"
              style="left: ${pos16Age}%"
              class="threshold-marker -translate-x-1/2 absolute top-0 flex flex-col items-center group cursor-pointer"
              title="16 años: Vía urbana / Licencia A1"
            >
              <span class="w-0.5 h-2 bg-emerald-500"></span>
              <span class="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                16a Vía/A1
              </span>
            </button>
            <span class="absolute right-0 top-1 text-slate-400">80 años</span>
          </div>
          <p id="age-status-hint" class="text-xs mt-1 font-medium"></p>
        </div>

        <!-- 6. Toggle Bogotá D.C. -->
        <div class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60">
          <label for="input-is-bogota" class="flex items-start justify-between gap-3 cursor-pointer select-none">
            <div>
              <span class="block text-sm font-bold text-slate-900 dark:text-white">
                6. ¿Circula principalmente en Bogotá D.C.?
              </span>
              <span class="block text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Activa avisos sobre reglamentación distrital de la Secretaría de Movilidad (restricciones en ciclorrutas a &gt;350 W o sin pedaleo asistido).
              </span>
            </div>
            <div class="relative inline-flex items-center shrink-0 mt-1">
              <input
                id="input-is-bogota"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </div>
          </label>
        </div>
      </form>
    </div>
  `;

  // Referencias a elementos del DOM
  const typeCards = Array.from(container.querySelectorAll('.vehicle-type-card'));
  const powerNum = container.querySelector('#input-power-num');
  const powerRange = container.querySelector('#input-power-range');
  const powerHint = container.querySelector('#power-status-hint');

  const weightNum = container.querySelector('#input-weight-num');
  const weightRange = container.querySelector('#input-weight-range');
  const weightHint = container.querySelector('#weight-status-hint');

  const speedNum = container.querySelector('#input-speed-num');
  const speedRange = container.querySelector('#input-speed-range');
  const speedHint = container.querySelector('#speed-status-hint');

  const ageNum = container.querySelector('#input-age-num');
  const ageRange = container.querySelector('#input-age-range');
  const ageHint = container.querySelector('#age-status-hint');

  const bogotaCheckbox = container.querySelector('#input-is-bogota');
  const resetBtn = container.querySelector('#btn-reset-form');
  const presetBtns = Array.from(container.querySelectorAll('.preset-btn'));
  const jumpBtns = Array.from(container.querySelectorAll('.threshold-marker'));

  let currentState = { ...initialState };

  function updateUI(state) {
    currentState = { ...state };

    // 1. Actualizar tarjetas de tipo de vehículo
    typeCards.forEach((card) => {
      const cardType = card.getAttribute('data-vehicle-type');
      const isSelected = cardType === state.vehicleType;
      card.setAttribute('aria-checked', String(isSelected));

      const iconBox = card.querySelector('.vehicle-icon');
      const radioDot = card.querySelector('.vehicle-radio-dot');
      const innerDot = radioDot.querySelector('span');

      if (isSelected) {
        card.className =
          'vehicle-type-card group relative flex flex-col items-start p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer border-emerald-600 dark:border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-xs';
        iconBox.className =
          'vehicle-icon p-2 rounded-lg transition-colors bg-emerald-600 text-white';
        radioDot.className =
          'vehicle-radio-dot w-4 h-4 rounded-full border-2 flex items-center justify-center border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400';
        innerDot.classList.remove('opacity-0');
      } else {
        card.className =
          'vehicle-type-card group relative flex flex-col items-start p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700';
        iconBox.className =
          'vehicle-icon p-2 rounded-lg transition-colors bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
        radioDot.className =
          'vehicle-radio-dot w-4 h-4 rounded-full border-2 flex items-center justify-center border-slate-300 dark:border-slate-600 text-transparent';
        innerDot.classList.add('opacity-0');
      }
    });

    // 2. Actualizar controles numéricos y sliders sin romper el foco activo
    if (document.activeElement !== powerNum) powerNum.value = state.powerWatts;
    if (document.activeElement !== powerRange) powerRange.value = state.powerWatts;

    if (document.activeElement !== weightNum) weightNum.value = state.weightKg;
    if (document.activeElement !== weightRange) weightRange.value = state.weightKg;

    if (document.activeElement !== speedNum) speedNum.value = state.maxSpeedKmh;
    if (document.activeElement !== speedRange) speedRange.value = state.maxSpeedKmh;

    if (document.activeElement !== ageNum) ageNum.value = state.driverAge;
    if (document.activeElement !== ageRange) ageRange.value = state.driverAge;

    bogotaCheckbox.checked = Boolean(state.isBogota);

    // 3. Mensajes de ayuda contextual en cada slider
    if (state.powerWatts > LEGAL_LIMITS.MAX_VELMPU_POWER_WATTS) {
      powerHint.textContent = `Supera los 1000 W (+${state.powerWatts - 1000} W): Pasa a categoría Ciclomotor (Res. 160 de 2017).`;
      powerHint.className = 'text-xs mt-1 font-semibold text-rose-600 dark:text-rose-400';
    } else if (state.isBogota && state.powerWatts > LEGAL_LIMITS.BOGOTA_CICLORRUTA_WARNING_WATTS) {
      powerHint.textContent = `Dentro de Ley 2486 (≤ 1000 W), pero supera 350 W (Alerta Bogotá en ciclorrutas).`;
      powerHint.className = 'text-xs mt-1 font-semibold text-amber-600 dark:text-amber-400';
    } else {
      powerHint.textContent = `Cumple límite nacional de potencia VELMPU (≤ 1000 W).`;
      powerHint.className = 'text-xs mt-1 font-medium text-emerald-700 dark:text-emerald-400';
    }

    if (state.weightKg > LEGAL_LIMITS.MAX_VELMPU_WEIGHT_KG) {
      weightHint.textContent = `Supera los 60 kg (+${state.weightKg - 60} kg): Clasifica como Ciclomotor.`;
      weightHint.className = 'text-xs mt-1 font-semibold text-rose-600 dark:text-rose-400';
    } else {
      weightHint.textContent = `Cumple límite de peso para vehículo liviano (≤ 60 kg).`;
      weightHint.className = 'text-xs mt-1 font-medium text-emerald-700 dark:text-emerald-400';
    }

    if (state.maxSpeedKmh > LEGAL_LIMITS.MAX_VELMPU_DESIGN_SPEED_KMH) {
      speedHint.textContent = `Supera los 40 km/h por diseño: Clasifica como Ciclomotor.`;
      speedHint.className = 'text-xs mt-1 font-semibold text-rose-600 dark:text-rose-400';
    } else if (state.maxSpeedKmh > LEGAL_LIMITS.MAX_CICLORRUTA_OPERATIONAL_SPEED_KMH) {
      speedHint.textContent = `Cumple Ley 2486 (≤ 40 km/h). Recuerda no pasar de 25 km/h en ciclorruta.`;
      speedHint.className = 'text-xs mt-1 font-medium text-emerald-700 dark:text-emerald-400';
    } else {
      speedHint.textContent = `Cumple velocidad de diseño (≤ 40 km/h) y tope de ciclorruta (≤ 25 km/h).`;
      speedHint.className = 'text-xs mt-1 font-medium text-emerald-700 dark:text-emerald-400';
    }

    if (state.driverAge < LEGAL_LIMITS.MIN_AGE_ABSOLUTE) {
      ageHint.textContent = `Menor de 12 años: Prohibido conducir en infraestructura pública.`;
      ageHint.className = 'text-xs mt-1 font-semibold text-rose-600 dark:text-rose-400';
    } else if (state.driverAge < LEGAL_LIMITS.MIN_AGE_FULL_ROAD) {
      ageHint.textContent = `Entre 12 y 15 años: Solo ciclorruta en VELMPU (Prohibido calzada y Ciclomotor).`;
      ageHint.className = 'text-xs mt-1 font-semibold text-amber-600 dark:text-amber-400';
    } else {
      ageHint.textContent = `Mayor de 16 años: Edad habilitada para circular según categoría.`;
      ageHint.className = 'text-xs mt-1 font-medium text-emerald-700 dark:text-emerald-400';
    }
  }

  function emitPatch(patch) {
    const nextState = { ...currentState, ...patch };
    updateUI(nextState);
    onChange(nextState);
  }

  // Event Listeners
  typeCards.forEach((card) => {
    card.addEventListener('click', () => {
      const vehicleType = card.getAttribute('data-vehicle-type');
      emitPatch({ vehicleType });
    });
  });

  function bindSyncedInputs(numEl, rangeEl, fieldName, min, max) {
    rangeEl.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      numEl.value = val;
      emitPatch({ [fieldName]: val });
    });

    numEl.addEventListener('input', (e) => {
      const raw = e.target.value;
      if (raw === '') return;
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        const clamped = Math.max(min, Math.min(max, parsed));
        rangeEl.value = clamped;
        emitPatch({ [fieldName]: clamped });
      }
    });

    numEl.addEventListener('blur', () => {
      const parsed = Number(numEl.value);
      const clamped = Number.isFinite(parsed)
        ? Math.max(min, Math.min(max, parsed))
        : DEFAULT_INPUT[fieldName];
      numEl.value = clamped;
      rangeEl.value = clamped;
      emitPatch({ [fieldName]: clamped });
    });
  }

  bindSyncedInputs(powerNum, powerRange, 'powerWatts', 100, 3000);
  bindSyncedInputs(weightNum, weightRange, 'weightKg', 5, 120);
  bindSyncedInputs(speedNum, speedRange, 'maxSpeedKmh', 15, 80);
  bindSyncedInputs(ageNum, ageRange, 'driverAge', 8, 80);

  bogotaCheckbox.addEventListener('change', (e) => {
    emitPatch({ isBogota: e.target.checked });
  });

  resetBtn.addEventListener('click', () => {
    emitPatch({ ...DEFAULT_INPUT });
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetId = btn.getAttribute('data-preset-id');
      const found = QUICK_PRESETS.find((p) => p.id === presetId);
      if (found) {
        emitPatch({ ...found.values });
      }
    });
  });

  jumpBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const field = btn.getAttribute('data-jump-field');
      const value = Number(btn.getAttribute('data-jump-value'));
      if (field && Number.isFinite(value)) {
        emitPatch({ [field]: value });
      }
    });
  });

  updateUI(initialState);

  return {
    updateUI,
  };
}
