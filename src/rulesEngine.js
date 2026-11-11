/**
 * @fileoverview Motor de Reglas de Negocio para el Validador Normativo de Movilidad Eléctrica en Colombia
 * Comparativa: Ley 2486 de 2025 (VELMPU) vs. Resolución 160 de 2017 / Código Nacional de Tránsito (Ciclomotores).
 *
 * Módulo de funciones puras, sin dependencias de DOM, 100% testeable.
 *
 * Referencias a la Ley 2486 de 2025 usadas en este módulo:
 * - Art. 2: Definición de VELMPU (potencia nominal ≤ 1000 W, uso individual).
 * - Art. 3 (nuevo Art. 96-1 Ley 769): Normas específicas de circulación (numerales 1 a 14 + parágrafo).
 * - Art. 4 (literal G del Art. 131 Ley 769): Infracciones G.1 a G.14, multa de 6 SMLDV.
 * - Art. 7: Delegación al Ministerio de Transporte (especificaciones técnicas, cascos, prendas, pasajeros).
 * - Art. 15: Exención de matrícula, SOAT y licencia para VELMPU y para cualquier vehículo eléctrico
 *   con peso ≤ 60 kg (incluida batería) o que, pesando más, no pueda superar 40 km/h.
 */

export const LEGAL_LIMITS = Object.freeze({
  MAX_VELMPU_POWER_WATTS: 1000,
  BOGOTA_CICLORRUTA_WARNING_WATTS: 350,
  MAX_VELMPU_WEIGHT_KG: 60,
  MAX_VELMPU_DESIGN_SPEED_KMH: 40,
  // Art. 15 Ley 2486: umbrales de exención de documentos (criterios alternativos, no acumulativos).
  MAX_EXEMPT_WEIGHT_KG: 60,
  MAX_EXEMPT_SPEED_KMH: 40,
  MAX_CICLORRUTA_OPERATIONAL_SPEED_KMH: 25,
  MAX_URBAN_ROAD_OPERATIONAL_SPEED_KMH: 40,
  MIN_AGE_ABSOLUTE: 12,
  MIN_AGE_FULL_ROAD: 16,
  // Art. 96-1 num. 2: máximo de personas movilizadas simultáneamente (salvo vehículo diseñado para ello).
  MAX_VELMPU_PERSONS: 1,
  REFLECTIVE_START_HOUR: '18:00',
  REFLECTIVE_END_HOUR: '6:00',
  VELMPU_FINE_SMLDV: 6,
  CICLOMOTOR_FINE_D_SMLDV: 30,
  CICLOMOTOR_FINE_C_SMLDV: 15,
});

export const VEHICLE_TYPES = Object.freeze({
  SCOOTER: 'scooter',
  EBIKE: 'ebike',
  MOPED: 'moped',
  UNICYCLE: 'unicycle',
});

export const VEHICLE_TYPE_METADATA = Object.freeze({
  [VEHICLE_TYPES.SCOOTER]: {
    id: 'scooter',
    label: 'Patineta / Monopatín',
    shortDesc: 'Patineta eléctrica de pie',
  },
  [VEHICLE_TYPES.EBIKE]: {
    id: 'ebike',
    label: 'Bicicleta Eléctrica',
    shortDesc: 'Pedaleo asistido',
  },
  [VEHICLE_TYPES.MOPED]: {
    id: 'moped',
    label: 'Ciclomotor / Moto / Vespa',
    shortDesc: 'Tipo scooter con asiento / moto',
  },
  [VEHICLE_TYPES.UNICYCLE]: {
    id: 'unicycle',
    label: 'Monociclo / Hoverboard',
    shortDesc: 'Autobalanceado eléctrico',
  },
});

export const CATEGORIES = Object.freeze({
  VELMPU: 'VELMPU',
  CICLOMOTOR: 'CICLOMOTOR',
});

export const DEFAULT_INPUT = Object.freeze({
  vehicleType: VEHICLE_TYPES.SCOOTER,
  powerWatts: 500,
  weightKg: 25,
  maxSpeedKmh: 30,
  driverAge: 25,
  isBogota: false,
});

/**
 * Sanitiza y normaliza los datos de entrada del usuario dentro de rangos numéricos válidos.
 * @param {Partial<typeof DEFAULT_INPUT>} rawInput
 */
export function sanitizeInput(rawInput = {}) {
  const validTypes = Object.values(VEHICLE_TYPES);
  const vehicleType = validTypes.includes(rawInput.vehicleType)
    ? rawInput.vehicleType
    : DEFAULT_INPUT.vehicleType;

  const powerWatts = Number.isFinite(Number(rawInput.powerWatts))
    ? Math.max(50, Math.min(10000, Number(rawInput.powerWatts)))
    : DEFAULT_INPUT.powerWatts;

  const weightKg = Number.isFinite(Number(rawInput.weightKg))
    ? Math.max(1, Math.min(500, Number(rawInput.weightKg)))
    : DEFAULT_INPUT.weightKg;

  const maxSpeedKmh = Number.isFinite(Number(rawInput.maxSpeedKmh))
    ? Math.max(5, Math.min(200, Number(rawInput.maxSpeedKmh)))
    : DEFAULT_INPUT.maxSpeedKmh;

  const driverAge = Number.isFinite(Number(rawInput.driverAge))
    ? Math.max(1, Math.min(110, Math.round(Number(rawInput.driverAge))))
    : DEFAULT_INPUT.driverAge;

  const isBogota = Boolean(rawInput.isBogota);

  return {
    vehicleType,
    powerWatts,
    weightKg,
    maxSpeedKmh,
    driverAge,
    isBogota,
  };
}

/**
 * Regla 1b: Exención de documentos (Art. 15 Ley 2486 de 2025)
 * No se requiere ni puede exigirse matrícula, SOAT ni licencia de conducción a:
 *   - Los VELMPU, o
 *   - Cualquier vehículo eléctrico con peso (incluida batería) ≤ 60 kg, o
 *   - Cualquier vehículo eléctrico con peso > 60 kg que no pueda superar 40 km/h.
 * Es independiente de la clasificación VELMPU (que gobierna las reglas de circulación).
 */
export function evaluateDocumentExemption(input, isVelmpu) {
  const { weightKg, maxSpeedKmh } = sanitizeInput(input);

  if (isVelmpu) {
    return {
      exempt: true,
      basis: 'VELMPU',
      reason:
        'Art. 15 Ley 2486 de 2025: es un vehículo eléctrico liviano de movilidad personal urbana.',
    };
  }
  if (weightKg <= LEGAL_LIMITS.MAX_EXEMPT_WEIGHT_KG) {
    return {
      exempt: true,
      basis: 'WEIGHT',
      reason: `Art. 15 Ley 2486 de 2025: vehículo eléctrico cuyo peso con batería (${weightKg} kg) no supera los ${LEGAL_LIMITS.MAX_EXEMPT_WEIGHT_KG} kg.`,
    };
  }
  if (maxSpeedKmh <= LEGAL_LIMITS.MAX_EXEMPT_SPEED_KMH) {
    return {
      exempt: true,
      basis: 'LOW_SPEED',
      reason: `Art. 15 Ley 2486 de 2025: aunque pesa más de ${LEGAL_LIMITS.MAX_EXEMPT_WEIGHT_KG} kg, no puede desarrollar velocidades superiores a ${LEGAL_LIMITS.MAX_EXEMPT_SPEED_KMH} km/h (${maxSpeedKmh} km/h).`,
    };
  }
  return {
    exempt: false,
    basis: null,
    reason: `No aplica la exención del Art. 15 Ley 2486: pesa más de ${LEGAL_LIMITS.MAX_EXEMPT_WEIGHT_KG} kg (${weightKg} kg) y puede superar ${LEGAL_LIMITS.MAX_EXEMPT_SPEED_KMH} km/h (${maxSpeedKmh} km/h).`,
  };
}

/**
 * Regla 1: Clasificación del Vehículo
 * - Categoría VELMPU (Ley 2486 de 2025):
 *   powerWatts <= 1000 AND weightKg <= 60 AND maxSpeedKmh <= 40 AND vehicleType !== 'moped'
 *   Nota: la ley solo fija expresamente la potencia nominal (≤ 1000 W, Art. 2) y delega el resto de
 *   especificaciones en el Ministerio de Transporte (Art. 7). Peso y velocidad se usan como criterio
 *   conservador del validador, tomando los umbrales de "liviano o de baja velocidad" del Art. 15.
 * - Categoría Ciclomotor / Motocicleta Eléctrica (Resolución 160 de 2017):
 *   powerWatts > 1000 OR weightKg > 60 OR maxSpeedKmh > 40 OR vehicleType === 'moped'
 * - La exención de documentos se evalúa aparte (Art. 15), ver evaluateDocumentExemption.
 */
export function classifyVehicle(input) {
  const sanitized = sanitizeInput(input);
  const { vehicleType, powerWatts, weightKg, maxSpeedKmh } = sanitized;

  const triggers = [];

  if (vehicleType === VEHICLE_TYPES.MOPED) {
    triggers.push({
      field: 'vehicleType',
      reason:
        'El tipo de vehículo seleccionado es Ciclomotor / Moto eléctrica / Scooter tipo Vespa (no diseñado como vehículo de movilidad personal).',
    });
  }
  if (powerWatts > LEGAL_LIMITS.MAX_VELMPU_POWER_WATTS) {
    triggers.push({
      field: 'powerWatts',
      reason: `La potencia nominal (${powerWatts} W) supera el límite de ${LEGAL_LIMITS.MAX_VELMPU_POWER_WATTS} W del Art. 2 de la Ley 2486.`,
    });
  }
  if (weightKg > LEGAL_LIMITS.MAX_VELMPU_WEIGHT_KG) {
    triggers.push({
      field: 'weightKg',
      reason: `El peso con batería (${weightKg} kg) supera los ${LEGAL_LIMITS.MAX_VELMPU_WEIGHT_KG} kg que este validador usa como tope de vehículo liviano (umbral del Art. 15).`,
    });
  }
  if (maxSpeedKmh > LEGAL_LIMITS.MAX_VELMPU_DESIGN_SPEED_KMH) {
    triggers.push({
      field: 'maxSpeedKmh',
      reason: `La velocidad máxima por diseño (${maxSpeedKmh} km/h) supera los ${LEGAL_LIMITS.MAX_VELMPU_DESIGN_SPEED_KMH} km/h, el máximo permitido a un VELMPU en cualquier vía (Art. 96-1 num. 7).`,
    });
  }

  const isVelmpu =
    powerWatts <= LEGAL_LIMITS.MAX_VELMPU_POWER_WATTS &&
    weightKg <= LEGAL_LIMITS.MAX_VELMPU_WEIGHT_KG &&
    maxSpeedKmh <= LEGAL_LIMITS.MAX_VELMPU_DESIGN_SPEED_KMH &&
    vehicleType !== VEHICLE_TYPES.MOPED;

  const category = isVelmpu ? CATEGORIES.VELMPU : CATEGORIES.CICLOMOTOR;
  const documentExemption = evaluateDocumentExemption(sanitized, isVelmpu);
  const isDocumentExempt = documentExemption.exempt;

  let badgeTitle;
  let legalFramework;
  let summary;
  let semaphore;

  if (isVelmpu) {
    semaphore = 'green';
    badgeTitle = 'Vehículo Eléctrico Liviano (Ley 2486 de 2025)';
    legalFramework = 'Amparado como VELMPU por la Ley 2486 de 2025';
    summary =
      'Cumple la potencia nominal máxima de 1000 W (Art. 2) y los criterios de vehículo liviano (≤ 60 kg, ≤ 40 km/h). No se le puede exigir matrícula, SOAT ni licencia de conducción (Art. 15).';
  } else if (isDocumentExempt) {
    semaphore = 'yellow';
    badgeTitle = 'Ciclomotor Eléctrico Exento de Documentos (Art. 15 Ley 2486)';
    legalFramework =
      'Circulación regulada por la Resolución 160 de 2017 y el Código Nacional de Tránsito (Ley 769 de 2002); exento de matrícula, SOAT y licencia por el Art. 15 de la Ley 2486 de 2025';
    summary = `No cumple los criterios de VELMPU, por lo que circula como ciclomotor (sin ciclo-infraestructura). Sin embargo, no se le puede exigir matrícula, SOAT ni licencia: ${documentExemption.reason}`;
  } else {
    semaphore = 'red';
    badgeTitle = 'Ciclomotor / Moto Eléctrica (Requiere Papeles)';
    legalFramework =
      'Regulado por la Resolución 160 de 2017 y el Código Nacional de Tránsito (Ley 769 de 2002)';
    summary =
      'Supera los límites de vehículo liviano y no aplica la exención del Art. 15 de la Ley 2486 (pesa más de 60 kg y supera 40 km/h). Exige SOAT, matrícula (placa), RUNT y licencia de conducción.';
  }

  return {
    category,
    isVelmpu,
    isCiclomotor: !isVelmpu,
    isDocumentExempt,
    documentExemption,
    semaphore,
    badgeTitle,
    legalFramework,
    summary,
    triggers,
  };
}

/**
 * Regla 2: Validación de Edad del Conductor (Art. 96-1 num. 1 y parágrafo)
 * - < 12 años: Prohibido conducir en infraestructura pública (Causal de inmovilización).
 * - 12 a 15 años (< 16):
 *   - Si es VELMPU: Uso permitido exclusivamente en ciclo-infraestructura (ciclorrutas). Prohibido salir a vías vehiculares (Causal de inmovilización).
 *   - Si es Ciclomotor: Prohibido conducir (Edad mínima para licencia A1 es 16 años).
 * - >= 16 años: Edad habilitada para circular según las reglas de la categoría del vehículo.
 * @param {number} driverAge
 * @param {string} category
 * @param {boolean} [isDocumentExempt] Si el vehículo está exento de licencia por el Art. 15 (ajusta los textos).
 */
export function evaluateDriverAge(driverAge, category, isDocumentExempt = category === CATEGORIES.VELMPU) {
  const age = Number(driverAge);
  const isVelmpu = category === CATEGORIES.VELMPU;

  if (age < LEGAL_LIMITS.MIN_AGE_ABSOLUTE) {
    return {
      status: 'PROHIBITED_UNDER_12',
      canDrivePublicInfrastructure: false,
      canDriveCiclorruta: false,
      canDriveUrbanRoad: false,
      semaphore: 'red',
      title: `Prohibido circular (${age} años — Menor de 12 años)`,
      description:
        'La edad mínima de conducción es de 16 años cumplidos (Art. 96-1 num. 1, Ley 2486). La única excepción —de 12 a 16 años, exclusivamente en ciclo-infraestructura— no cubre a menores de 12 años.',
      immobilizationRisk: true,
      immobilizationReason:
        'Causal de inmovilización: conductor por debajo de la edad mínima legal (menor de 12 años) en infraestructura pública.',
    };
  }

  if (age >= LEGAL_LIMITS.MIN_AGE_ABSOLUTE && age < LEGAL_LIMITS.MIN_AGE_FULL_ROAD) {
    if (isVelmpu) {
      return {
        status: 'RESTRICTED_CICLORRUTA_ONLY',
        canDrivePublicInfrastructure: true,
        canDriveCiclorruta: true,
        canDriveUrbanRoad: false,
        semaphore: 'yellow',
        title: `Circulación Restringida (${age} años — Entre 12 y 15 años)`,
        description:
          'Uso permitido EXCLUSIVAMENTE en ciclo-infraestructura (Parágrafo del Art. 96-1, Ley 2486). Tiene prohibido salir a vías vehiculares o calzada.',
        immobilizationRisk: true,
        immobilizationReason:
          'Causal de inmovilización si el menor de 16 años sale de la ciclo-infraestructura hacia la calzada vehicular (Art. 96-1 num. 1).',
      };
    }

    return {
      status: 'PROHIBITED_UNDER_16_CICLOMOTOR',
      canDrivePublicInfrastructure: false,
      canDriveCiclorruta: false,
      canDriveUrbanRoad: false,
      semaphore: 'red',
      title: `Prohibido conducir Ciclomotor (${age} años — Menor de 16 años)`,
      description: isDocumentExempt
        ? 'Este vehículo no es VELMPU, por lo que no aplica la excepción de 12 a 16 años en ciclo-infraestructura (Parágrafo del Art. 96-1). Aunque el Art. 15 lo exime de licencia, por seguridad este validador mantiene la edad mínima de 16 años.'
        : 'No puede conducir ciclomotores ni motocicletas eléctricas. La edad mínima legal en Colombia para obtener licencia categoría A1 es 16 años cumplidos.',
      immobilizationRisk: true,
      immobilizationReason: isDocumentExempt
        ? 'Riesgo de inmovilización: conductor menor de 16 años en un vehículo que no es VELMPU (no aplica la excepción de ciclo-infraestructura).'
        : 'Causal de inmovilización y comparendo por conducir ciclomotor sin tener la edad mínima ni licencia A1/A2.',
    };
  }

  let description;
  if (isVelmpu) {
    description =
      'Cumple la edad mínima de 16 años (Art. 96-1 num. 1) para circular por la ciclo-infraestructura y, cuando esta no exista o no sea transitable, por el carril derecho de las vías permitidas.';
  } else if (isDocumentExempt) {
    description =
      'Cumple la edad mínima (16+ años) para circular por vías vehiculares. No se le puede exigir licencia de conducción para este vehículo (Art. 15, Ley 2486).';
  } else {
    description =
      'Cumple la edad mínima (16+ años) para tramitar/portar licencia de conducción categoría A1 (o A2 a partir de 18 años) y circular por vías vehiculares.';
  }

  return {
    status: 'ALLOWED_16_PLUS',
    canDrivePublicInfrastructure: true,
    canDriveCiclorruta: isVelmpu,
    canDriveUrbanRoad: true,
    semaphore: 'green',
    title: `Edad Habilitada (${age} años)`,
    description,
    immobilizationRisk: false,
    immobilizationReason: null,
  };
}

/**
 * Regla 3: Documentación Obligatoria (Art. 15 Ley 2486 de 2025)
 * @param {string} category
 * @param {boolean} [isExempt] Exención del Art. 15. Por defecto, solo los VELMPU se consideran exentos.
 * @param {string|null} [exemptionReason] Fundamento de la exención para mostrar al usuario.
 */
export function evaluateDocuments(
  category,
  isExempt = category === CATEGORIES.VELMPU,
  exemptionReason = null
) {
  if (isExempt) {
    return {
      requiresPapers: false,
      exemptionReason,
      items: [
        {
          id: 'soat',
          name: 'SOAT',
          required: false,
          badge: 'Exento',
          semaphore: 'green',
          description:
            'NO se requiere ni puede exigirse SOAT (exento expresamente por el Art. 15 de la Ley 2486 de 2025).',
        },
        {
          id: 'matricula',
          name: 'Matrícula (Placa) y RUNT',
          required: false,
          badge: 'Exento',
          semaphore: 'green',
          description:
            'NO se requiere ni puede exigirse matrícula ante organismo de tránsito (Art. 15). En consecuencia, tampoco placa ni inscripción del vehículo ante el RUNT.',
        },
        {
          id: 'licencia',
          name: 'Licencia de Conducción',
          required: false,
          badge: 'Exento',
          semaphore: 'green',
          description:
            'NO se requiere ni puede exigirse licencia de conducción (Art. 15 de la Ley 2486 de 2025).',
        },
        {
          id: 'tecnicomecanica',
          name: 'Revisión Técnico-Mecánica',
          required: false,
          badge: 'Exento',
          semaphore: 'green',
          description:
            'No aplica: al no exigirse matrícula, no hay obligación de Revisión Técnico-Mecánica (el Art. 15 no la menciona expresamente).',
        },
      ],
    };
  }

  return {
    requiresPapers: true,
    exemptionReason,
    items: [
      {
        id: 'soat',
        name: 'SOAT',
        required: true,
        badge: 'Obligatorio',
        semaphore: 'red',
        description: 'SÍ requiere Seguro Obligatorio de Accidentes de Tránsito (SOAT) vigente.',
      },
      {
        id: 'matricula',
        name: 'Matrícula (Placa) y RUNT',
        required: true,
        badge: 'Obligatorio',
        semaphore: 'red',
        description: 'SÍ requiere registro en RUNT y matrícula (placa) ante organismo de tránsito.',
      },
      {
        id: 'licencia',
        name: 'Licencia de Conducción',
        required: true,
        badge: 'Obligatorio',
        semaphore: 'red',
        description: 'SÍ requiere licencia de conducción vigente (Mínimo categoría A1 o A2).',
      },
      {
        id: 'tecnicomecanica',
        name: 'Revisión Técnico-Mecánica',
        required: true,
        badge: 'Obligatorio',
        semaphore: 'red',
        description: 'SÍ requiere Revisión Técnico-Mecánica vigente (según plazos de ley tras matrícula).',
      },
    ],
  };
}

/**
 * Regla 4: Vías Permitidas y Límites de Velocidad Operativos (Art. 96-1 num. 3 a 7)
 */
export function evaluateAllowedRoads(input, classification, ageEvaluation) {
  const { vehicleType, powerWatts, isBogota } = sanitizeInput(input);
  const { isVelmpu } = classification;
  const isDocumentExempt = Boolean(classification.isDocumentExempt);
  const isUnder12 = ageEvaluation.status === 'PROHIBITED_UNDER_12';
  const isMinor12To15 = ageEvaluation.status === 'RESTRICTED_CICLORRUTA_ONLY';
  const isMinorCiclomotor = ageEvaluation.status === 'PROHIBITED_UNDER_16_CICLOMOTOR';

  // Alerta especial Bogotá (regulación local, no contenida en la Ley 2486; la ley solo faculta a la
  // autoridad competente para restringir tramos de ciclo-infraestructura — Art. 96-1 num. 5).
  const exceedsBogotaPower = powerWatts > LEGAL_LIMITS.BOGOTA_CICLORRUTA_WARNING_WATTS;
  const isNotPedalAssist = vehicleType !== VEHICLE_TYPES.EBIKE;
  const bogotaAlert = isBogota
    ? {
        active: true,
        exceeds350W: exceedsBogotaPower,
        isNotPedalAssist,
        affectedByLocalRule: isVelmpu && (exceedsBogotaPower || isNotPedalAssist),
        semaphore: 'yellow',
        title: 'Alerta Reglamentación Distrital Bogotá D.C.',
        message:
          isVelmpu && (exceedsBogotaPower || isNotPedalAssist)
            ? `Atención en Bogotá D.C.: La Ley 2486 (Art. 96-1 num. 5) permite a la autoridad local restringir tramos de ciclo-infraestructura. La Secretaría Distrital de Movilidad puede limitar las ciclorrutas a vehículos de hasta 350 W (${
                exceedsBogotaPower ? `tu vehículo tiene ${powerWatts} W` : 'cumple potencia'
              }) o de pedaleo asistido (${
                isNotPedalAssist ? 'no es bicicleta de pedaleo asistido' : 'es pedaleo asistido'
              }). Este umbral es distrital, no de la Ley 2486: verifica la reglamentación y señalización local vigente.`
            : 'Aviso Bogotá D.C.: La Secretaría de Movilidad de Bogotá vigila que en las ciclorrutas distritales no se superen los 350 W ni los 25 km/h y prioriza vehículos de pedaleo asistido (regulación distrital, no contenida en la Ley 2486).',
      }
    : {
        active: false,
        exceeds350W: exceedsBogotaPower,
        isNotPedalAssist,
        affectedByLocalRule: false,
        semaphore: 'green',
        title: null,
        message: null,
      };

  if (isVelmpu) {
    const isEbike = vehicleType === VEHICLE_TYPES.EBIKE;

    return {
      bogotaAlert,
      roads: [
        {
          id: 'andenes',
          name: 'Andenes y Aceras Peatonales',
          allowed: false,
          semaphore: 'red',
          statusLabel: 'Estrictamente Prohibido',
          maxSpeedKmh: 0,
          description:
            'PROHIBIDO transitar sobre aceras, andenes o lugares destinados al tránsito de peatones, así como por vías donde la autoridad competente lo prohíba (Art. 96-1 num. 4 / Infracción G.3).',
        },
        {
          id: 'ciclorruta',
          name: 'Ciclorrutas (Ciclo-infraestructura)',
          allowed: !isUnder12,
          mandatoryWhenAvailable: !isUnder12,
          semaphore: isUnder12 ? 'red' : bogotaAlert.affectedByLocalRule ? 'yellow' : 'green',
          statusLabel: isUnder12
            ? 'Prohibido (< 12 años)'
            : bogotaAlert.affectedByLocalRule
            ? 'Obligatoria (Con Alerta Bogotá >350W / Sin Pedaleo)'
            : 'Obligatoria (cuando esté disponible)',
          maxSpeedKmh: isUnder12 ? 0 : LEGAL_LIMITS.MAX_CICLORRUTA_OPERATIONAL_SPEED_KMH,
          description: isUnder12
            ? 'Prohibido conducir en infraestructura pública por ser menor de 12 años.'
            : `Uso OBLIGATORIO cuando exista ciclo-infraestructura en condiciones adecuadas de seguridad y transitabilidad, salvo tramos restringidos por la autoridad (Art. 96-1 num. 5). Debe dar prelación a peatones y ciclistas. Velocidad máxima: ${LEGAL_LIMITS.MAX_CICLORRUTA_OPERATIONAL_SPEED_KMH} km/h, o el límite inferior señalizado.`,
        },
        {
          id: 'via_urbana',
          name: 'Vías Vehiculares Urbanas',
          allowed: !isUnder12 && !isMinor12To15,
          semaphore: !isUnder12 && !isMinor12To15 ? 'green' : 'red',
          statusLabel: isUnder12
            ? 'Prohibido (< 12 años)'
            : isMinor12To15
            ? 'Prohibido (12 a 15 años solo en ciclorruta)'
            : 'Permitido (Carril derecho - Máx. 40 km/h)',
          maxSpeedKmh:
            !isUnder12 && !isMinor12To15 ? LEGAL_LIMITS.MAX_URBAN_ROAD_OPERATIONAL_SPEED_KMH : 0,
          description: isUnder12
            ? 'Prohibido circular en vías públicas para menores de 12 años (Causal de inmovilización).'
            : isMinor12To15
            ? 'PROHIBIDO salir a la calzada vehicular para conductores entre 12 y 15 años (Causal de inmovilización inmediata).'
            : `Solo cuando no exista ciclo-infraestructura o no sea transitable: por el carril derecho, paralelo al andén y en el mismo sentido de la vía, a máximo ${LEGAL_LIMITS.MAX_URBAN_ROAD_OPERATIONAL_SPEED_KMH} km/h (o el límite inferior señalizado). Otros carriles solo para adelantar o girar a la izquierda. Prohibido usar vías preferenciales o exclusivas del transporte público (ej. TransMilenio, MIO, Metroplús) y adelantar por la derecha o entre vehículos (Art. 96-1 num. 6 a 8).`,
        },
        {
          id: 'carretera_nacional',
          name: 'Carreteras / Red Vial Nacional',
          allowed: !isUnder12 && !isMinor12To15 && isEbike,
          semaphore: !isUnder12 && !isMinor12To15 && isEbike ? 'green' : 'red',
          statusLabel:
            !isUnder12 && !isMinor12To15 && isEbike
              ? 'Permitido (Asimilada a bicicleta convencional)'
              : 'Prohibido (Salvo tramo con ciclorruta)',
          maxSpeedKmh: !isUnder12 && !isMinor12To15 && isEbike ? 40 : 0,
          description: isEbike
            ? isUnder12 || isMinor12To15
              ? 'Por edad del conductor (< 16 años), solo puede circular en tramos que cuenten con ciclo-infraestructura.'
              : 'PERMITIDO: Las bicicletas eléctricas se asimilan a las bicicletas en lo relativo a su circulación por la Red Vial Nacional (Art. 96-1 num. 3).'
            : 'PROHIBIDO circular por la Red Vial Nacional, EXCEPTO en tramos que cuenten con ciclo-infraestructura no restringida por la autoridad competente (Art. 96-1 num. 3 / Infracción G.2). El tránsito fuera del perímetro urbano depende de la regulación territorial.',
        },
      ],
    };
  }

  // Categoría Ciclomotor / Motocicleta Eléctrica
  const canOperateCiclomotor = !isUnder12 && !isMinorCiclomotor;

  return {
    bogotaAlert,
    roads: [
      {
        id: 'andenes',
        name: 'Andenes y Aceras Peatonales',
        allowed: false,
        semaphore: 'red',
        statusLabel: 'Estrictamente Prohibido',
        maxSpeedKmh: 0,
        description:
          'Estrictamente PROHIBIDO transitar por andenes, aceras o zonas peatonales (Multa D05 de 30 SMLDV + inmovilización).',
      },
      {
        id: 'ciclorruta',
        name: 'Ciclorrutas (Ciclo-infraestructura)',
        allowed: false,
        mandatoryWhenAvailable: false,
        semaphore: 'red',
        statusLabel: 'Estrictamente Prohibido',
        maxSpeedKmh: 0,
        description:
          'Estrictamente PROHIBIDO transitar por ciclorrutas o bicicarriles (Resolución 160 de 2017). Los ciclomotores no pueden invadir la ciclo-infraestructura.',
      },
      {
        id: 'via_urbana',
        name: 'Vías Vehiculares Urbanas',
        allowed: canOperateCiclomotor,
        semaphore: canOperateCiclomotor ? 'green' : 'red',
        statusLabel: canOperateCiclomotor
          ? 'Permitido (Ocupando el centro del carril)'
          : 'Prohibido (Menor de 16 años)',
        maxSpeedKmh: canOperateCiclomotor ? 50 : 0,
        description: canOperateCiclomotor
          ? 'Debe circular por el centro del carril vehicular como cualquier motocicleta, respetando los límites de velocidad de la vía (generalmente 50 km/h en zonas urbanas). Prohibido usar carriles exclusivos de TransMilenio.'
          : isDocumentExempt
          ? 'Prohibido conducir para menores de 16 años: al no ser VELMPU, no aplica la excepción de 12 a 16 años en ciclo-infraestructura.'
          : 'Prohibido conducir por no cumplir la edad mínima legal de 16 años para obtener licencia A1.',
      },
      {
        id: 'carretera_nacional',
        name: 'Carreteras / Red Vial Nacional',
        allowed: canOperateCiclomotor,
        semaphore: canOperateCiclomotor ? 'green' : 'red',
        statusLabel: canOperateCiclomotor
          ? isDocumentExempt
            ? 'Permitido (Exento de SOAT, Placa y Licencia)'
            : 'Permitido (Con SOAT, Placa y Licencia)'
          : 'Prohibido (Menor de 16 años)',
        maxSpeedKmh: canOperateCiclomotor ? 80 : 0,
        description: canOperateCiclomotor
          ? isDocumentExempt
            ? 'Permitido circular por vías nacionales con casco reglamentario, respetando la velocidad de la vía. No se le puede exigir matrícula, SOAT ni licencia (Art. 15, Ley 2486).'
            : 'Permitido circular por vías nacionales portando matrícula, SOAT, licencia A1/A2 y casco reglamentario de motocicleta, respetando la velocidad de la vía.'
          : 'Prohibido conducir ciclomotores para menores de 16 años.',
      },
    ],
  };
}

/**
 * Regla 5: Kit de Seguridad y Condiciones de Circulación (Art. 96-1 num. 2, 10, 11 y 12)
 */
export function evaluateSafetyKit(category) {
  const isVelmpu = category === CATEGORIES.VELMPU;

  return {
    items: [
      {
        id: 'casco',
        name: 'Casco de Protección',
        mandatory: true,
        semaphore: 'red',
        badge: 'Obligatorio (Evita Inmovilización)',
        specification: isVelmpu
          ? 'Casco de seguridad obligatorio con las características que defina el Ministerio de Transporte (Art. 96-1 num. 10 y Art. 7 num. 5). Como referencia, se recomienda casco certificado de ciclismo o movilidad personal (NTC 5239, EN 1078 o CPSC 1203) con barboquejo abrochado. No llevarlo da lugar a multa e inmovilización (G.10).'
          : 'Casco reglamentario de motocicleta certificado bajo norma técnica (ECE 22.05/22.06, DOT FMVSS 218 o NTC 4533 / Res. 23385). Prohibido usar casco de bicicleta aquí (causal de inmovilización y comparendo).',
      },
      {
        id: 'luces',
        name: 'Luces del Vehículo',
        mandatory: true,
        semaphore: 'yellow',
        badge: 'Blanca delantera + Roja trasera',
        specification:
          'Obligatorio contar con dispositivos que proyecten luz blanca en la parte delantera y luz roja en la parte trasera (Art. 96-1 num. 12).',
      },
      {
        id: 'reflectivos',
        name: 'Prendas Retrorreflectivas',
        mandatory: true,
        semaphore: 'yellow',
        badge: `${LEGAL_LIMITS.REFLECTIVE_START_HOUR} a ${LEGAL_LIMITS.REFLECTIVE_END_HOUR}`,
        specification: `Obligatorio vestir prendas retrorreflectivas de identificación visibles entre las ${LEGAL_LIMITS.REFLECTIVE_START_HOUR} y las ${LEGAL_LIMITS.REFLECTIVE_END_HOUR} horas del día siguiente${
          isVelmpu
            ? ', con las características que defina el Ministerio de Transporte (Art. 96-1 num. 11).'
            : '.'
        }`,
      },
      {
        id: 'pasajeros',
        name: 'Límite de Pasajeros',
        mandatory: true,
        semaphore: 'red',
        badge: isVelmpu ? 'Uso individual (solo el conductor)' : 'Máx. 1 Acompañante',
        specification: isVelmpu
          ? 'No puede movilizar a más de una persona de forma simultánea, sin importar si es adulto o niño (Art. 96-1 num. 2). Excepcionalmente se permite cuando el vehículo esté especialmente diseñado para ello y cumpla las condiciones que defina el Ministerio de Transporte (ej. bicicletas de carga homologadas). Incumplirlo es la infracción G.1.'
          : 'Prohibido sobrecupo (máximo 1 acompañante si la tarjeta de propiedad lo autoriza). Prohibido llevar más de un acompañante o transportar menores de 10 años en motocicleta (decretos distritales y municipales).',
      },
    ],
  };
}

/**
 * Regla 6: Cuadro de Sanciones, Multas y Causales de Inmovilización
 * VELMPU: literal G del Art. 131 de la Ley 769 de 2002, adicionado por el Art. 4 de la Ley 2486 (G.1 a G.14).
 */
export function evaluateSanctions(input, classification, ageEvaluation) {
  const { isVelmpu } = classification;
  const isDocumentExempt = Boolean(classification.isDocumentExempt);
  const activeAlerts = [];

  if (ageEvaluation.immobilizationRisk && ageEvaluation.immobilizationReason) {
    activeAlerts.push(ageEvaluation.immobilizationReason);
  }

  if (isVelmpu) {
    return {
      categoryCode: 'Infracciones Categoría G (Ley 2486 de 2025)',
      fineSmldv: LEGAL_LIMITS.VELMPU_FINE_SMLDV,
      fineLabel: `${LEGAL_LIMITS.VELMPU_FINE_SMLDV} SMLDV`,
      activeAlerts,
      finesList: [
        'G.1: Transportar a más de una persona de manera simultánea en un vehículo que no esté expresamente diseñado para ello o sin cumplir las condiciones del Ministerio de Transporte.',
        'G.2: Circular por la Red Vial Nacional, salvo en tramos con ciclo-infraestructura no restringida (no aplica a bicicletas eléctricas).',
        'G.3: Circular sobre aceras, andenes, lugares destinados al tránsito de peatones o por vías donde la autoridad lo haya prohibido expresamente.',
        'G.4: No circular por la ciclo-infraestructura habilitada cuando esté en condiciones adecuadas de seguridad y transitabilidad.',
        'G.5: Usar carriles distintos al derecho sin necesidad de adelantar o girar a la izquierda, circular en contravía o por vías preferenciales o exclusivas del transporte público.',
        `G.6: Superar los límites de velocidad señalizados o exceder los máximos de ${LEGAL_LIMITS.MAX_CICLORRUTA_OPERATIONAL_SPEED_KMH} km/h en ciclo-infraestructura y ${LEGAL_LIMITS.MAX_URBAN_ROAD_OPERATIONAL_SPEED_KMH} km/h en vías permitidas.`,
        'G.7: Adelantar a otros vehículos por la derecha o entre vehículos que transiten por sus respectivos carriles.',
        'G.8: Realizar una maniobra de giro o de adelantamiento sin utilizar señales direccionales.',
        'G.9: No respetar las señales o normas de tránsito de la ciclo-infraestructura o de las vías permitidas.',
        'G.10: Circular sin casco de seguridad que cumpla las características del Ministerio de Transporte (además, inmovilización).',
        `G.11: Circular entre las ${LEGAL_LIMITS.REFLECTIVE_START_HOUR} y las ${LEGAL_LIMITS.REFLECTIVE_END_HOUR} horas sin vestir prendas retrorreflectivas de identificación.`,
        'G.12: Circular sin dispositivos que proyecten luz blanca adelante y luz roja atrás.',
        'G.13: Transportar objetos que disminuyan la visibilidad, incomoden la conducción o constituyan un peligro para los demás actores de la vía.',
        'G.14: Conducir en estado de embriaguez o bajo los efectos de sustancias psicoactivas (además, inmovilización y comparendo).',
      ],
      immobilizationCauses: [
        'No utilizar el casco de seguridad obligatorio (G.10).',
        'Conducir en estado de embriaguez o bajo los efectos de sustancias psicoactivas (G.14, además del comparendo).',
        'Conductor menor de 16 años circulando fuera de la ciclo-infraestructura, o menor de 12 años en cualquier vía pública (Art. 96-1 num. 1 y parágrafo).',
      ],
    };
  }

  const ciclomotorFines = [
    {
      requiresPapers: true,
      text: 'Multa Tipo D02 (30 SMLDV + Inmovilización): Transitar sin portar el SOAT vigente.',
    },
    {
      requiresPapers: true,
      text: 'Multa Tipo D01 (30 SMLDV + Inmovilización): Conducir sin haber obtenido la licencia de conducción categoría A1/A2.',
    },
    {
      requiresPapers: false,
      text: 'Multa Tipo D05 (30 SMLDV + Inmovilización): Transitar por andenes, aceras, puentes peatonales o ciclorrutas.',
    },
    {
      requiresPapers: false,
      text: 'Multa Tipo C15 / C24 (15 SMLDV + Inmovilización): Conducir con sobrecupo (llevar más de 1 acompañante o transportar menores de 10 años).',
    },
    {
      requiresPapers: true,
      text: 'Multa Tipo C35 (15 SMLDV + Inmovilización): No realizar la Revisión Técnico-Mecánica en el plazo legal.',
    },
    {
      requiresPapers: true,
      text: 'Multa Tipo B03 (8 SMLDV): Conducir un vehículo sin placas o sin matrícula registrada en el RUNT.',
    },
  ];

  const ciclomotorImmobilizations = [
    {
      requiresPapers: true,
      text: 'Transitar sin SOAT vigente, sin licencia de conducción o sin matrícula (placa).',
    },
    { requiresPapers: false, text: 'Invadir ciclorrutas o andenes peatonales.' },
    { requiresPapers: false, text: 'No portar casco reglamentario de motocicleta certificado.' },
    { requiresPapers: false, text: 'Conducir bajo efectos del alcohol o sustancias psicoactivas.' },
  ];

  const applies = (rule) => !isDocumentExempt || !rule.requiresPapers;

  return {
    categoryCode: 'Código Nacional de Tránsito (Ley 769 de 2002 / Resolución 160 de 2017)',
    fineSmldv: LEGAL_LIMITS.CICLOMOTOR_FINE_D_SMLDV,
    fineLabel: '15 a 30 SMLDV + Inmovilización',
    activeAlerts,
    finesList: ciclomotorFines.filter(applies).map((rule) => rule.text),
    immobilizationCauses: ciclomotorImmobilizations.filter(applies).map((rule) => rule.text),
  };
}

/**
 * Función principal orquestadora que evalúa todas las reglas de negocio.
 * @param {Partial<typeof DEFAULT_INPUT>} rawInput
 */
export function evaluateVehicleLegalStatus(rawInput = {}) {
  const input = sanitizeInput(rawInput);
  const classification = classifyVehicle(input);
  const ageEvaluation = evaluateDriverAge(
    input.driverAge,
    classification.category,
    classification.isDocumentExempt
  );
  const documents = evaluateDocuments(
    classification.category,
    classification.isDocumentExempt,
    classification.documentExemption.reason
  );
  const allowedRoads = evaluateAllowedRoads(input, classification, ageEvaluation);
  const safetyKit = evaluateSafetyKit(classification.category);
  const sanctions = evaluateSanctions(input, classification, ageEvaluation);

  return {
    input,
    classification,
    ageEvaluation,
    documents,
    allowedRoads,
    safetyKit,
    sanctions,
  };
}
