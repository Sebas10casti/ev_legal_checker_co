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

/**
 * Inicializa el control de tema Claro / Oscuro.
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById('btn-theme-toggle');
  const themeLabel = document.getElementById('theme-toggle-label');
  if (!toggleBtn) return;

  function syncThemeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    if (themeLabel) {
      themeLabel.textContent = isDark ? 'Modo Claro' : 'Modo Oscuro';
    }
    toggleBtn.setAttribute('aria-pressed', String(isDark));
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    try {
      localStorage.setItem('ev_legal_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignorar errores de almacenamiento en modo privado restringido
    }
    syncThemeUI();
  });

  syncThemeUI();
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
