import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES,
  VEHICLE_TYPES,
  classifyVehicle,
  evaluateDriverAge,
  evaluateDocuments,
  evaluateAllowedRoads,
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

    it('Exige SOAT, Matrícula/RUNT, Licencia y Técnico-Mecánica a categoría CICLOMOTOR', () => {
      const docs = evaluateDocuments(CATEGORIES.CICLOMOTOR);
      assert.equal(docs.requiresPapers, true);
      assert.equal(docs.items.every((item) => item.required === true && item.badge === 'Obligatorio'), true);
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
  });
});
