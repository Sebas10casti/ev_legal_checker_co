import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES,
  DEFAULT_INPUT,
  LEGAL_LIMITS,
  VEHICLE_TYPES,
  classifyVehicle,
  evaluateDriverAge,
  evaluateDocuments,
  evaluateAllowedRoads,
  evaluateSafetyKit,
  evaluateVehicleLegalStatus,
} from './rulesEngine.js';

describe('Motor de Reglas Normativas (Ley 2486 de 2025 vs Resolución 160 de 2017)', () => {
  describe('Regla 1: Clasificación del Vehículo (Casos Borde)', () => {
    it('Clasifica como VELMPU una patineta exactamente en el límite legal (1000W, 60kg, 40km/h)', () => {
      const result = classifyVehicle({
        vehicleType: VEHICLE_TYPES.SCOOTER,
        powerWatts: 1000,
        weightKg: 60,
        maxSpeedKmh: 40,
      });

      assert.equal(result.category, CATEGORIES.VELMPU);
      assert.equal(result.isVelmpu, true);
      assert.equal(result.triggers.length, 0);
    });

    it('Clasifica como CICLOMOTOR una patineta de 1001W (supera por 1W el límite de 1000W)', () => {
      const result = classifyVehicle({
        vehicleType: VEHICLE_TYPES.SCOOTER,
        powerWatts: 1001,
        weightKg: 25,
        maxSpeedKmh: 30,
      });

      assert.equal(result.category, CATEGORIES.CICLOMOTOR);
      assert.equal(result.isCiclomotor, true);
      assert.equal(result.triggers.some((t) => t.field === 'powerWatts'), true);
    });

    it('Clasifica como CICLOMOTOR cuando el peso supera 60 kg (61 kg)', () => {
      const result = classifyVehicle({
        vehicleType: VEHICLE_TYPES.EBIKE,
        powerWatts: 500,
        weightKg: 61,
        maxSpeedKmh: 30,
      });

      assert.equal(result.category, CATEGORIES.CICLOMOTOR);
      assert.equal(result.triggers.some((t) => t.field === 'weightKg'), true);
    });

    it('Clasifica como CICLOMOTOR cuando la velocidad de diseño supera 40 km/h (41 km/h)', () => {
      const result = classifyVehicle({
        vehicleType: VEHICLE_TYPES.UNICYCLE,
        powerWatts: 800,
        weightKg: 28,
        maxSpeedKmh: 41,
      });

      assert.equal(result.category, CATEGORIES.CICLOMOTOR);
      assert.equal(result.triggers.some((t) => t.field === 'maxSpeedKmh'), true);
    });

    it('Clasifica como CICLOMOTOR cualquier vehículo tipo "moped" incluso con 350W, 30kg y 25km/h', () => {
      const result = classifyVehicle({
        vehicleType: VEHICLE_TYPES.MOPED,
        powerWatts: 350,
        weightKg: 30,
        maxSpeedKmh: 25,
      });

      assert.equal(result.category, CATEGORIES.CICLOMOTOR);
      assert.equal(result.triggers.some((t) => t.field === 'vehicleType'), true);
    });
  });

  describe('Regla 2: Validación de Edad del Conductor', () => {
    it('Prohíbe circular en infraestructura pública a menores de 12 años (ej. 11 años)', () => {
      const ageEval = evaluateDriverAge(11, CATEGORIES.VELMPU);
      assert.equal(ageEval.status, 'PROHIBITED_UNDER_12');
      assert.equal(ageEval.canDrivePublicInfrastructure, false);
      assert.equal(ageEval.canDriveCiclorruta, false);
      assert.equal(ageEval.canDriveUrbanRoad, false);
      assert.equal(ageEval.immobilizationRisk, true);
    });

    it('Restringe a un menor de 15 años en VELMPU exclusivamente a ciclorrutas (prohibido vías vehiculares)', () => {
      const ageEval = evaluateDriverAge(15, CATEGORIES.VELMPU);
      assert.equal(ageEval.status, 'RESTRICTED_CICLORRUTA_ONLY');
      assert.equal(ageEval.canDriveCiclorruta, true);
      assert.equal(ageEval.canDriveUrbanRoad, false);
      assert.equal(ageEval.semaphore, 'yellow');
      assert.equal(ageEval.immobilizationRisk, true);
    });

    it('Prohíbe a un menor de 15 años conducir un Ciclomotor (edad mínima licencia A1 es 16 años)', () => {
      const ageEval = evaluateDriverAge(15, CATEGORIES.CICLOMOTOR);
      assert.equal(ageEval.status, 'PROHIBITED_UNDER_16_CICLOMOTOR');
      assert.equal(ageEval.canDrivePublicInfrastructure, false);
      assert.equal(ageEval.canDriveUrbanRoad, false);
      assert.equal(ageEval.semaphore, 'red');
    });

    it('Habilita circulación completa a conductores de 16 años o más', () => {
      const ageEvalVelmpu = evaluateDriverAge(16, CATEGORIES.VELMPU);
      assert.equal(ageEvalVelmpu.status, 'ALLOWED_16_PLUS');
      assert.equal(ageEvalVelmpu.canDriveCiclorruta, true);
      assert.equal(ageEvalVelmpu.canDriveUrbanRoad, true);

      const ageEvalCiclomotor = evaluateDriverAge(16, CATEGORIES.CICLOMOTOR);
      assert.equal(ageEvalCiclomotor.status, 'ALLOWED_16_PLUS');
      assert.equal(ageEvalCiclomotor.canDriveCiclorruta, false);
      assert.equal(ageEvalCiclomotor.canDriveUrbanRoad, true);
    });
  });

  describe('Regla 3: Documentación Obligatoria', () => {
    it('Exime de SOAT, Matrícula/RUNT, Licencia y Técnico-Mecánica a categoría VELMPU', () => {
      const docs = evaluateDocuments(CATEGORIES.VELMPU);
      assert.equal(docs.requiresPapers, false);
      assert.equal(docs.items.every((item) => item.required === false && item.badge === 'Exento'), true);
    });

    it('Exige SOAT, Matrícula/RUNT, Licencia y Técnico-Mecánica a categoría CICLOMOTOR no exenta', () => {
      const docs = evaluateDocuments(CATEGORIES.CICLOMOTOR);
      assert.equal(docs.requiresPapers, true);
      assert.equal(docs.items.every((item) => item.required === true && item.badge === 'Obligatorio'), true);
    });
  });

  describe('Regla 3b: Exención del Art. 15 Ley 2486 (independiente de la categoría VELMPU)', () => {
    it('Exime de documentos a un vehículo de más de 1000 W si pesa 60 kg o menos', () => {
      const status = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.SCOOTER,
        powerWatts: 1500,
        weightKg: 50,
        maxSpeedKmh: 45,
        driverAge: 30,
      });
      assert.equal(status.classification.category, CATEGORIES.CICLOMOTOR);
      assert.equal(status.classification.isDocumentExempt, true);
      assert.equal(status.classification.documentExemption.basis, 'WEIGHT');
      assert.equal(status.documents.requiresPapers, false);
      assert.equal(status.classification.semaphore, 'yellow');
    });

    it('Exime de documentos a un vehículo de más de 60 kg que no supera 40 km/h', () => {
      const status = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.EBIKE,
        powerWatts: 800,
        weightKg: 80,
        maxSpeedKmh: 35,
        driverAge: 30,
      });
      assert.equal(status.classification.isVelmpu, false);
      assert.equal(status.classification.documentExemption.basis, 'LOW_SPEED');
      assert.equal(status.documents.requiresPapers, false);
    });

    it('Exime de documentos a un "moped" liviano (40 kg) aunque no sea VELMPU', () => {
      const status = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.MOPED,
        powerWatts: 800,
        weightKg: 40,
        maxSpeedKmh: 25,
        driverAge: 30,
      });
      assert.equal(status.classification.isVelmpu, false);
      assert.equal(status.documents.requiresPapers, false);
      const ciclorruta = status.allowedRoads.roads.find((r) => r.id === 'ciclorruta');
      assert.equal(ciclorruta.allowed, false);
    });

    it('Exige documentos solo si pesa más de 60 kg Y supera 40 km/h', () => {
      const status = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.MOPED,
        powerWatts: 1500,
        weightKg: 75,
        maxSpeedKmh: 55,
        driverAge: 30,
      });
      assert.equal(status.classification.isDocumentExempt, false);
      assert.equal(status.documents.requiresPapers, true);
      assert.equal(status.classification.semaphore, 'red');
    });

    it('No incluye multas por SOAT, licencia, placa o RTM a un ciclomotor exento por el Art. 15', () => {
      const status = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.SCOOTER,
        powerWatts: 1500,
        weightKg: 50,
        maxSpeedKmh: 45,
        driverAge: 30,
      });
      const fines = status.sanctions.finesList.join(' ');
      assert.equal(/D02|D01|B03|C35/.test(fines), false);
      assert.equal(/D05/.test(fines), true);
      assert.equal(
        status.sanctions.immobilizationCauses.some((c) => c.includes('sin SOAT')),
        false
      );
    });
  });

  describe('Regla 4: Vías Permitidas, Carretera Nacional y Alerta Bogotá', () => {
    it('Permite a una bicicleta eléctrica (ebike) VELMPU circular en Carretera Nacional pero lo prohíbe a una patineta (scooter)', () => {
      const ebikeStatus = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.EBIKE,
        powerWatts: 500,
        weightKg: 22,
        maxSpeedKmh: 32,
        driverAge: 28,
        isBogota: false,
      });
      const ebikeNationalRoad = ebikeStatus.allowedRoads.roads.find(
        (r) => r.id === 'carretera_nacional'
      );
      assert.equal(ebikeNationalRoad.allowed, true);

      const scooterStatus = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.SCOOTER,
        powerWatts: 500,
        weightKg: 22,
        maxSpeedKmh: 32,
        driverAge: 28,
        isBogota: false,
      });
      const scooterNationalRoad = scooterStatus.allowedRoads.roads.find(
        (r) => r.id === 'carretera_nacional'
      );
      assert.equal(scooterNationalRoad.allowed, false);
    });

    it('Activa la alerta amarilla en Bogotá para vehículos que superen 350W o no sean de pedaleo asistido', () => {
      const statusBogota = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.SCOOTER,
        powerWatts: 500,
        weightKg: 20,
        maxSpeedKmh: 30,
        driverAge: 25,
        isBogota: true,
      });

      assert.equal(statusBogota.allowedRoads.bogotaAlert.active, true);
      assert.equal(statusBogota.allowedRoads.bogotaAlert.exceeds350W, true);
      assert.equal(statusBogota.allowedRoads.bogotaAlert.affectedByLocalRule, true);

      const ciclorruta = statusBogota.allowedRoads.roads.find((r) => r.id === 'ciclorruta');
      assert.equal(ciclorruta.semaphore, 'yellow');
      assert.equal(ciclorruta.maxSpeedKmh, 25);
    });

    it('Prohíbe ciclorrutas y andenes a los Ciclomotores', () => {
      const statusMoped = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.MOPED,
        powerWatts: 1500,
        weightKg: 75,
        maxSpeedKmh: 55,
        driverAge: 30,
        isBogota: false,
      });

      const andenes = statusMoped.allowedRoads.roads.find((r) => r.id === 'andenes');
      const ciclorruta = statusMoped.allowedRoads.roads.find((r) => r.id === 'ciclorruta');
      const viaUrbana = statusMoped.allowedRoads.roads.find((r) => r.id === 'via_urbana');

      assert.equal(andenes.allowed, false);
      assert.equal(ciclorruta.allowed, false);
      assert.equal(viaUrbana.allowed, true);
    });
  });

  describe('Regla 5 y 6: Kit de Seguridad y Cuadro de Sanciones', () => {
    it('Asigna multa de 6 SMLDV (Categoría G) para VELMPU y 30 SMLDV para Ciclomotor', () => {
      const velmpu = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.SCOOTER,
        powerWatts: 500,
        weightKg: 25,
        maxSpeedKmh: 30,
        driverAge: 25,
      });
      assert.equal(velmpu.sanctions.fineSmldv, 6);
      assert.equal(velmpu.safetyKit.items.length, 4);

      const ciclomotor = evaluateVehicleLegalStatus({
        vehicleType: VEHICLE_TYPES.SCOOTER,
        powerWatts: 1200,
        weightKg: 25,
        maxSpeedKmh: 30,
        driverAge: 25,
      });
      assert.equal(ciclomotor.sanctions.fineSmldv, 30);
    });

    it('Lista las 14 infracciones del literal G (G.1 a G.14) para VELMPU', () => {
      const velmpu = evaluateVehicleLegalStatus(DEFAULT_INPUT);
      const fines = velmpu.sanctions.finesList;
      assert.equal(fines.length, 14);
      for (let i = 1; i <= 14; i += 1) {
        assert.equal(
          fines.some((f) => f.startsWith(`G.${i}:`)),
          true,
          `Falta la infracción G.${i}`
        );
      }
    });

    it('Limita el VELMPU a una sola persona (sin excepción para niños en bicicleta convencional)', () => {
      const kit = evaluateSafetyKit(CATEGORIES.VELMPU);
      const pasajeros = kit.items.find((i) => i.id === 'pasajeros');
      assert.equal(pasajeros.badge, 'Uso individual (solo el conductor)');
      assert.equal(/sillita|2 niños/.test(pasajeros.specification), false);
      assert.equal(LEGAL_LIMITS.MAX_VELMPU_PERSONS, 1);
    });

    it('Exige prendas retrorreflectivas entre las 18:00 y las 6:00 horas', () => {
      const kit = evaluateSafetyKit(CATEGORIES.VELMPU);
      const reflectivos = kit.items.find((i) => i.id === 'reflectivos');
      assert.equal(reflectivos.badge, '18:00 a 6:00');
    });
  });
});
