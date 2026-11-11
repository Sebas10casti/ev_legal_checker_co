/**
 * @fileoverview Controlador principal de la Single Page Application (SPA).
 * Sincroniza el estado reactivo entre el formulario, el motor de reglas, el panel de resultados,
 * los parámetros de la URL (para compartir configuraciones) y el tema claro/oscuro.
 */

import {
  DEFAULT_INPUT,
  VEHICLE_TYPE_METADATA,
  sanitizeInput,
  evaluateVehicleLegalStatus,
} from './rulesEngine.js';
import { mountVehicleForm } from './components/VehicleForm.js';
import { renderResultsDashboard } from './components/ResultsDashboard.js';

/**
 * Lee los parámetros de la URL si el usuario abrió un enlace compartido.
 */
function getInitialStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = { ...DEFAULT_INPUT };

  if (params.has('type')) raw.vehicleType = params.get('type');
  if (params.has('w')) raw.powerWatts = Number(params.get('w'));
  if (params.has('kg')) raw.weightKg = Number(params.get('kg'));
  if (params.has('kmh')) raw.maxSpeedKmh = Number(params.get('kmh'));
  if (params.has('age')) raw.driverAge = Number(params.get('age'));
  if (params.has('bogota')) raw.isBogota = params.get('bogota') === '1' || params.get('bogota') === 'true';

  return sanitizeInput(raw);
}

/**
 * Construye la URL con los parámetros actuales del vehículo para compartir.
 */
function buildShareUrl(state) {
  const url = new URL(window.location.href);
  url.searchParams.set('type', state.vehicleType);
  url.searchParams.set('w', String(state.powerWatts));
  url.searchParams.set('kg', String(state.weightKg));
  url.searchParams.set('kmh', String(state.maxSpeedKmh));
  url.searchParams.set('age', String(state.driverAge));
  if (state.isBogota) {
    url.searchParams.set('bogota', '1');
  } else {
    url.searchParams.delete('bogota');
  }
  return url.toString();
}

/**
 * Genera el texto resumen para compartir en WhatsApp o portapapeles.
 */
function buildShareMessage(evaluation) {
  const { input, classification, documents } = evaluation;
  const typeLabel = VEHICLE_TYPE_METADATA[input.vehicleType]?.label || input.vehicleType;
  const shareUrl = buildShareUrl(input);
  const papersText = documents.requiresPapers
    ? 'Requiere SOAT, Placa/RUNT y Licencia A1/A2'
    : 'Exento de SOAT, Placa y Licencia (Ley 2486 de 2025)';

  return [
    `⚡ *Validador Legal de Movilidad Eléctrica en Colombia*`,
    `• Vehículo: ${typeLabel} (${input.powerWatts}W, ${input.weightKg}kg, ${input.maxSpeedKmh}km/h)`,
    `• Edad conductor: ${input.driverAge} años${input.isBogota ? ' (Bogotá D.C.)' : ''}`,
    `• Clasificación: *${classification.badgeTitle}*`,
    `• Documentos: ${papersText}`,
    `Consulta tu vehículo aquí: ${shareUrl}`,
  ].join('\n');
}

const THEME_ICONS = {
  sun: `
    <svg class="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  `,
  moon: `
    <svg class="w-4 h-4 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  `,
};

/**
 * Inicializa el control de tema Claro / Oscuro priorizando la configuración del celular o navegador.
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  const themeLabel = document.getElementById('theme-toggle-label');
  const themeIcon = document.getElementById('theme-toggle-icon');
  const mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(isDark) {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (themeLabel) {
      themeLabel.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
    }
    if (themeIcon) {
      themeIcon.innerHTML = isDark ? THEME_ICONS.sun : THEME_ICONS.moon;
    }
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', String(isDark));
    }
  }

  // 1. Priorizar configuración del sistema / celular
  const systemDark = mediaQuery ? mediaQuery.matches : false;
  const saved = localStorage.getItem('ev_legal_theme_manual');
  const initialDark = saved !== null ? saved === 'dark' : systemDark;
  applyTheme(initialDark);

  // 2. Escuchar cambios automáticos del celular / navegador en tiempo real
  if (mediaQuery && mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', (e) => {
      // Cuando el celular cambia entre modo claro y oscuro, actualiza automáticamente
      applyTheme(e.matches);
      try {
        localStorage.removeItem('ev_legal_theme_manual');
      } catch {}
    });
  }

  // 3. Botón para alternar manualmente
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = !document.documentElement.classList.contains('dark');
      applyTheme(isDark);
      try {
        localStorage.setItem('ev_legal_theme_manual', isDark ? 'dark' : 'light');
      } catch {}
    });
  }
}

/**
 * Punto de entrada principal de la aplicación.
 */
function bootstrapApp() {
  initThemeToggle();

  const formContainer = document.getElementById('vehicle-form-root');
  const resultsContainer = document.getElementById('results-dashboard-root');
  const btnWhatsapp = document.getElementById('btn-share-whatsapp');
  const btnCopyLink = document.getElementById('btn-copy-link');
  const copyFeedback = document.getElementById('copy-feedback-toast');

  let currentState = getInitialStateFromUrl();
  let currentEvaluation = evaluateVehicleLegalStatus(currentState);

  function handleStateChange(nextRawState) {
    currentState = sanitizeInput(nextRawState);
    currentEvaluation = evaluateVehicleLegalStatus(currentState);
    renderResultsDashboard(resultsContainer, currentEvaluation);

    // Actualizar query string sin recargar la página
    try {
      const nextUrl = buildShareUrl(currentState);
      window.history.replaceState(null, '', nextUrl);
    } catch {
      // Ignorar en entornos file:// donde replaceState con URL completa pueda restringirse
    }
  }

  mountVehicleForm(formContainer, currentState, handleStateChange);
  renderResultsDashboard(resultsContainer, currentEvaluation);

  if (btnWhatsapp) {
    btnWhatsapp.addEventListener('click', () => {
      const text = buildShareMessage(currentEvaluation);
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', async () => {
      const shareUrl = buildShareUrl(currentState);
      try {
        await navigator.clipboard.writeText(shareUrl);
        if (copyFeedback) {
          copyFeedback.textContent = '¡Enlace copiado al portapapeles!';
          copyFeedback.classList.remove('hidden');
          setTimeout(() => {
            copyFeedback.classList.add('hidden');
          }, 2800);
        }
      } catch {
        window.prompt('Copia este enlace para compartir tu resultado:', shareUrl);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', bootstrapApp);
