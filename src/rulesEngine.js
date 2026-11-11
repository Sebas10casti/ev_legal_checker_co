/**
 * @fileoverview Motor de Reglas de Negocio para el Validador Normativo de Movilidad Eléctrica en Colombia
 * Comparativa: Ley 2486 de 2025 (VELMPU) vs. Resolución 160 de 2017 / Código Nacional de Tránsito (Ciclomotores).
 *
 * Módulo de funciones puras, sin dependencias de DOM, 100% testeable.
 */

export const LEGAL_LIMITS = Object.freeze({
  MAX_VELMPU_POWER_WATTS: 1000,
  BOGOTA_CICLORRUTA_WARNING_WATTS: 350,
  MAX_VELMPU_WEIGHT_KG: 60,
  MAX_VELMPU_DESIGN_SPEED_KMH: 40,
  MAX_CICLORRUTA_OPERATIONAL_SPEED_KMH: 25,
  MAX_URBAN_ROAD_OPERATIONAL_SPEED_KMH: 40,
  MIN_AGE_ABSOLUTE: 12,
  MIN_AGE_FULL_ROAD: 16,
  REFLECTIVE_START_HOUR: '6:00 p.m.',
  REFLECTIVE_END_HOUR: '6:00 a.m.',
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
 * Regla 1: Clasificación del Vehículo
 * - Categoría VELMPU (Ley 2486 de 2025):
 *   powerWatts <= 1000 AND weightKg <= 60 AND maxSpeedKmh <= 40 AND vehicleType !== 'moped'
 * - Categoría Ciclomotor / Motocicleta Eléctrica (Resolución 160 de 2017):
 *   powerWatts > 1000 OR weightKg > 60 OR maxSpeedKmh > 40 OR vehicleType === 'moped'
 */
export function classifyVehicle(input) {
  const { vehicleType, powerWatts, weightKg, maxSpeedKmh } = sanitizeInput(input);

  const triggers = [];

  if (vehicleType === VEHICLE_TYPES.MOPED) {
    triggers.push({
      field: 'vehicleType',
      reason: 'El tipo de vehículo seleccionado es Ciclomotor / Moto eléctrica / Scooter tipo Vespa.',
    });
  }
  if (powerWatts > LEGAL_LIMITS.MAX_VELMPU_POWER_WATTS) {
    triggers.push({
      field: 'powerWatts',
      reason: `La potencia (${powerWatts} W) supera el límite legal de ${LEGAL_LIMITS.MAX_VELMPU_POWER_WATTS} W de la Ley 2486.`,
    });
  }
  if (weightKg > LEGAL_LIMITS.MAX_VELMPU_WEIGHT_KG) {
    triggers.push({
      field: 'weightKg',
      reason: `El peso con batería (${weightKg} kg) supera el tope de ${LEGAL_LIMITS.MAX_VELMPU_WEIGHT_KG} kg de la Ley 2486.`,
    });
  }
  if (maxSpeedKmh > LEGAL_LIMITS.MAX_VELMPU_DESIGN_SPEED_KMH) {
    triggers.push({
      field: 'maxSpeedKmh',
      reason: `La velocidad máxima por diseño (${maxSpeedKmh} km/h) excede los ${LEGAL_LIMITS.MAX_VELMPU_DESIGN_SPEED_KMH} km/h permitidos para VELMPU.`,
    });
  }

  const isVelmpu =
    powerWatts <= LEGAL_LIMITS.MAX_VELMPU_POWER_WATTS &&
    weightKg <= LEGAL_LIMITS.MAX_VELMPU_WEIGHT_KG &&
    maxSpeedKmh <= LEGAL_LIMITS.MAX_VELMPU_DESIGN_SPEED_KMH &&
    vehicleType !== VEHICLE_TYPES.MOPED;

  const category = isVelmpu ? CATEGORIES.VELMPU : CATEGORIES.CICLOMOTOR;

  return {
    category,
    isVelmpu,
    isCiclomotor: !isVelmpu,
    semaphore: isVelmpu ? 'green' : 'red',
    badgeTitle: isVelmpu
      ? 'Vehículo Eléctrico Liviano (Ley 2486 de 2025)'
      : 'Ciclomotor / Moto Eléctrica (Requiere Papeles)',
    legalFramework: isVelmpu
      ? 'Amparado como VELMPU por la Ley 2486 de 2025'
      : 'Regulado por la Resolución 160 de 2017 y el Código Nacional de Tránsito (Ley 769 de 2002)',
    summary: isVelmpu
      ? 'Cumple todos los topes técnicos de Vehículo Eléctrico Liviano de Movilidad Personal Urbana (≤ 1000 W, ≤ 60 kg, ≤ 40 km/h). Está exento de SOAT, matrícula y licencia.'
      : 'Supera los límites de vehículo liviano o corresponde a ciclomotor/moto eléctrica. Exige SOAT, matrícula (placa), RUNT y licencia de conducción.',
    triggers,
  };
}

/**
 * Regla 2: Validación de Edad del Conductor
 * - < 12 años: Prohibido conducir en infraestructura pública (Causal de inmovilización).
 * - 12 a 15 años (< 16):
 *   - Si es VELMPU: Uso permitido exclusivamente en ciclo-infraestructura (ciclorrutas). Prohibido salir a vías vehiculares (Causal de inmovilización).
 *   - Si es Ciclomotor: Prohibido conducir (Edad mínima para licencia A1 es 16 años).
 * - >= 16 años: Edad habilitada para circular según las reglas de la categoría del vehículo.
 */
export function evaluateDriverAge(driverAge, category) {
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
        'Está estrictamente prohibido conducir este tipo de vehículos en infraestructura pública para menores de 12 años.',
      immobilizationRisk: true,
      immobilizationReason:
        'Causal de inmovilización inmediata: Conductor menor de 12 años en infraestructura pública.',
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
          'Uso permitido EXCLUSIVAMENTE en ciclo-infraestructura (ciclorrutas). Tiene estrictamente prohibido salir a vías vehiculares o calzada.',
        immobilizationRisk: true,
        immobilizationReason:
          'Causal de inmovilización inmediata si el menor de 16 años sale de la ciclorruta hacia la calzada vehicular.',
      };
    }

    return {
      status: 'PROHIBITED_UNDER_16_CICLOMOTOR',
      canDrivePublicInfrastructure: false,
      canDriveCiclorruta: false,
      canDriveUrbanRoad: false,
      semaphore: 'red',
      title: `Prohibido conducir Ciclomotor (${age} años — Menor de 16 años)`,
      description:
        'No puede conducir ciclomotores ni motocicletas eléctricas. La edad mínima legal en Colombia para obtener licencia categoría A1 es 16 años cumplidos.',
      immobilizationRisk: true,
      immobilizationReason:
        'Causal de inmovilización y comparendo por conducir ciclomotor sin tener la edad mínima ni licencia A1/A2.',
    };
  }

  return {
    status: 'ALLOWED_16_PLUS',
    canDrivePublicInfrastructure: true,
    canDriveCiclorruta: isVelmpu,
    canDriveUrbanRoad: true,
    semaphore: 'green',
    title: `Edad Habilitada (${age} años)`,
    description: isVelmpu
      ? 'Cumple la edad mínima (16+ años) para circular tanto en ciclorrutas como en el carril derecho de vías urbanas cuando no exista ciclorruta.'
      : 'Cumple la edad mínima (16+ años) para tramitar/portar licencia de conducción categoría A1 (o A2 a partir de 18 años) y circular por vías vehiculares.',
    immobilizationRisk: false,
    immobilizationReason: null,
  };
}

/**
 * Regla 3: Documentación Obligatoria
 */
export function evaluateDocuments(category) {
  const isVelmpu = category === CATEGORIES.VELMPU;

  if (isVelmpu) {
    return {
      requiresPapers: false,
      items: [
        {
          id: 'soat',
          name: 'SOAT',
          required: false,
          badge: 'Exento',
          semaphore: 'green',
          description: 'NO requiere SOAT (Exento expresamente por la Ley 2486 de 2025).',
        },
        {
          id: 'matricula',
          name: 'Matrícula (Placa) y RUNT',
          required: false,
          badge: 'Exento',
          semaphore: 'green',
          description: 'NO requiere matrícula, placa ni inscripción de vehículo ante el RUNT.',
        },
        {
          id: 'licencia',
          name: 'Licencia de Conducción',
          required: false,
          badge: 'Exento',
          semaphore: 'green',
          description: 'NO requiere licencia de conducción para operar dentro de los límites VELMPU.',
        },
        {
          id: 'tecnicomecanica',
          name: 'Revisión Técnico-Mecánica',
          required: false,
          badge: 'Exento',
          semaphore: 'green',
          description: 'NO requiere certificado de Revisión Técnico-Mecánica.',
        },
      ],
    };
  }

  return {
    requiresPapers: true,
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
 * Regla 4: Vías Permitidas y Límites de Velocidad Operativos
 */
export function evaluateAllowedRoads(input, classification, ageEvaluation) {
  const { vehicleType, powerWatts, isBogota } = sanitizeInput(input);
  const { isVelmpu } = classification;
  const isUnder12 = ageEvaluation.status === 'PROHIBITED_UNDER_12';
  const isMinor12To15 = ageEvaluation.status === 'RESTRICTED_CICLORRUTA_ONLY';
  const isMinorCiclomotor = ageEvaluation.status === 'PROHIBITED_UNDER_16_CICLOMOTOR';

  // Alerta especial Bogotá
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
            ? `Atención en Bogotá D.C.: Autoridades locales como la Secretaría Distrital de Movilidad pueden restringir el uso de ciclorrutas a vehículos que superen los 350 W (${
                exceedsBogotaPower ? `tu vehículo tiene ${powerWatts} W` : 'cumple potencia'
              }) o que no sean de pedaleo asistido (${
                isNotPedalAssist ? 'no es bicicleta de pedaleo asistido' : 'es pedaleo asistido'
              }). Verifica la señalización local en corredores distritales.`
            : 'Aviso Bogotá D.C.: La Secretaría de Movilidad de Bogotá vigila que en las ciclorrutas distritales no se superen los 350 W ni los 25 km/h y prioriza vehículos de pedaleo asistido.',
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
            'Estrictamente PROHIBIDO transitar sobre andenes, aceras o zonas exclusivas para peatones (debe bajarse del vehículo y llevarlo apagado/caminando).',
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
            : `Uso OBLIGATORIO siempre que exista ciclorruta disponible. Velocidad máxima operativa permitida: ${LEGAL_LIMITS.MAX_CICLORRUTA_OPERATIONAL_SPEED_KMH} km/h.`,
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
            : `Permitido circular por el carril derecho (únicamente cuando no haya ciclorruta) a máximo ${LEGAL_LIMITS.MAX_URBAN_ROAD_OPERATIONAL_SPEED_KMH} km/h. Estrictamente prohibido usar carriles exclusivos de transporte público (ej. TransMilenio, MIO, Metroplús).`,
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
              ? 'Por edad del conductor (< 16 años), solo puede circular en tramos que cuenten con ciclorruta segregada.'
              : 'PERMITIDO: Las bicicletas eléctricas de pedaleo asistido se asimilan a las bicicletas convencionales para circular en carreteras nacionales (o en tramos con ciclorruta).'
            : 'PROHIBIDO circular por la Red Vial Nacional / carreteras intermunicipales, EXCEPTO si el tramo nacional cuenta con ciclorruta segregada.',
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
          : 'Prohibido (Menor de 16 años sin licencia)',
        maxSpeedKmh: canOperateCiclomotor ? 50 : 0,
        description: canOperateCiclomotor
          ? 'Debe circular por el centro del carril vehicular como cualquier motocicleta, respetando los límites de velocidad de la vía (generalmente 50 km/h en zonas urbanas). Prohibido usar carriles exclusivos de TransMilenio.'
          : 'Prohibido conducir por no cumplir la edad mínima legal de 16 años para obtener licencia A1.',
      },
      {
        id: 'carretera_nacional',
        name: 'Carreteras / Red Vial Nacional',
        allowed: canOperateCiclomotor,
        semaphore: canOperateCiclomotor ? 'green' : 'red',
        statusLabel: canOperateCiclomotor
          ? 'Permitido (Con SOAT, Placa y Licencia)'
          : 'Prohibido (Menor de 16 años)',
        maxSpeedKmh: canOperateCiclomotor ? 80 : 0,
        description: canOperateCiclomotor
          ? 'Permitido circular por vías nacionales portando matrícula, SOAT, licencia A1/A2 y casco reglamentario de motocicleta, respetando la velocidad de la vía.'
          : 'Prohibido conducir ciclomotores para menores de 16 años.',
      },
    ],
  };
}

/**
 * Regla 5: Kit de Seguridad y Condiciones de Circulación
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
          ? 'Casco certificado de ciclismo o movilidad personal (normas NTC 5239, EN 1078 o CPSC 1203) debidamente ajustado y con barboquejo abrochado. No requiere casco de moto, pero no llevarlo da inmovilización.'
          : 'Casco reglamentario de motocicleta certificado bajo norma técnica (ECE 22.05/22.06, DOT FMVSS 218 o NTC 4533 / Res. 23385). Prohibido usar casco de bicicleta aquí (causal de inmovilización y comparendo).',
      },
      {
        id: 'luces',
        name: 'Luces del Vehículo',
        mandatory: true,
        semaphore: 'yellow',
        badge: 'Blanca delantera + Roja trasera',
        specification:
          'Obligatorio contar con luz blanca en la parte delantera y luz roja en la parte trasera en buen estado.',
      },
      {
        id: 'reflectivos',
        name: 'Prendas Retrorreflectivas',
        mandatory: true,
        semaphore: 'yellow',
        badge: `${LEGAL_LIMITS.REFLECTIVE_START_HOUR} a ${LEGAL_LIMITS.REFLECTIVE_END_HOUR}`,
        specification: `Obligatorio usar chaqueta, chaleco o banda retrorreflectiva entre las ${LEGAL_LIMITS.REFLECTIVE_START_HOUR} y las ${LEGAL_LIMITS.REFLECTIVE_END_HOUR}, o en condiciones de lluvia/baja visibilidad.`,
      },
      {
        id: 'pasajeros',
        name: 'Límite de Pasajeros y Niños',
        mandatory: true,
        semaphore: 'red',
        badge: isVelmpu ? 'Individual / Máx. 2 niños en bicicarga' : 'Máx. 1 Acompañante',
        specification: isVelmpu
          ? 'Patinetas y monociclos: uso estrictamente individual (0 pasajeros). Bicicletas/E-bikes: 1 niño en sillita homologada o hasta 2 niños exclusivamente en bicicletas de carga (cargo bikes) diseñadas de fábrica con arnés. Llevar más de 2 niños (+2) está terminantemente prohibido por seguridad vial y sobrecupo.'
          : 'Prohibido sobrecupo (máximo 1 acompañante si la tarjeta de propiedad lo autoriza). Prohibido llevar más de un acompañante o transportar menores de 10 años en motocicleta (decretos distritales y municipales).',
      },
    ],
  };
}

/**
 * Regla 6: Cuadro de Sanciones, Multas y Causales de Inmovilización
 */
export function evaluateSanctions(input, classification, ageEvaluation) {
  const { isVelmpu } = classification;
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
        'Exceder los 25 km/h en ciclorrutas o los 40 km/h en vías vehiculares urbanas.',
        'Transitar por andenes, aceras o zonas peatonales.',
        'Circular sin luces (blanca delantera / roja trasera) o sin prendas reflectivas entre las 6:00 p.m. y las 6:00 a.m.',
        'Transportar pasajeros en patinetas/monociclos o llevar más de 2 niños en bicicleta (prohibido sobrecupo e inseguridad vial).',
        'Transportar paquetes, cargas o elementos que afecten la visibilidad o la maniobrabilidad.',
        'No utilizar la ciclorruta cuando esta se encuentre disponible.',
      ],
      immobilizationCauses: [
        'No utilizar el casco certificado obligatorio.',
        'Conductor menor de 16 años circulando fuera de la ciclorruta (o menor de 12 años en cualquier vía pública).',
        'Conducir bajo el influjo de bebidas embriagantes o sustancias psicoactivas.',
      ],
    };
  }

  return {
    categoryCode: 'Código Nacional de Tránsito (Ley 769 de 2002 / Resolución 160 de 2017)',
    fineSmldv: LEGAL_LIMITS.CICLOMOTOR_FINE_D_SMLDV,
    fineLabel: '15 a 30 SMLDV + Inmovilización',
    activeAlerts,
    finesList: [
      'Multa Tipo D02 (30 SMLDV + Inmovilización): Transitar sin portar el SOAT vigente.',
      'Multa Tipo D01 (30 SMLDV + Inmovilización): Conducir sin haber obtenido la licencia de conducción categoría A1/A2.',
      'Multa Tipo D05 (30 SMLDV + Inmovilización): Transitar por andenes, aceras, puentes peatonales o ciclorrutas.',
      'Multa Tipo C15 / C24 (15 SMLDV + Inmovilización): Conducir con sobrecupo (llevar más de 1 acompañante o transportar menores de 10 años).',
      'Multa Tipo C35 (15 SMLDV + Inmovilización): No realizar la Revisión Técnico-Mecánica en el plazo legal.',
      'Multa Tipo B03 (8 SMLDV): Conducir un vehículo sin placas o sin matrícula registrada en el RUNT.',
    ],
    immobilizationCauses: [
      'Transitar sin SOAT vigente, sin licencia de conducción o sin matrícula (placa).',
      'Invadir ciclorrutas o andenes peatonales.',
      'No portar casco reglamentario de motocicleta certificado.',
      'Conducir bajo efectos del alcohol o sustancias psicoactivas.',
    ],
  };
}

/**
 * Función principal orquestadora que evalúa todas las reglas de negocio.
 * @param {Partial<typeof DEFAULT_INPUT>} rawInput
 */
export function evaluateVehicleLegalStatus(rawInput = {}) {
  const input = sanitizeInput(rawInput);
  const classification = classifyVehicle(input);
  const ageEvaluation = evaluateDriverAge(input.driverAge, classification.category);
  const documents = evaluateDocuments(classification.category);
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
