import { Reservation, TableLayoutTable } from '../types';
import { configurationService } from './configurationService';
import { reservationService } from './reservationService';

interface TableAssignment {
  reservationId: string;
  tableId: string;
  score: number;
  reasons: string[];
}

interface AssignmentCriteria {
  capacityMatch: number;
  zonePreference: number;
  proximityToFeatures: number;
  timeOptimization: number;
  groupSeparation: number;
}

class TableAssignmentService {
  private tableLayout = configurationService.getTableLayout();

  // Asignación automática de mesas
  async autoAssignTables(reservations: Reservation[], date: string): Promise<TableAssignment[]> {
    const assignments: TableAssignment[] = [];
    const availableTables = [...this.tableLayout.tables];
    const existingReservations = reservationService.getReservationsByDate(date);

    // Ordenar reservas por prioridad (grupos grandes primero, luego por hora)
    const sortedReservations = reservations.sort((a, b) => {
      if (a.guests !== b.guests) {
        return b.guests - a.guests; // Grupos grandes primero
      }
      return a.time.localeCompare(b.time); // Luego por hora
    });

    for (const reservation of sortedReservations) {
      const bestTable = this.findBestTable(
        reservation,
        availableTables,
        existingReservations,
        assignments
      );

      if (bestTable) {
        assignments.push({
          reservationId: reservation.id,
          tableId: bestTable.table.id,
          score: bestTable.score,
          reasons: bestTable.reasons
        });

        // Remover mesa de disponibles si es necesario
        const tableIndex = availableTables.findIndex(t => t.id === bestTable.table.id);
        if (tableIndex !== -1) {
          // Verificar si la mesa estará ocupada durante el tiempo de la reserva
          const conflictingReservations = this.getConflictingReservations(
            bestTable.table.id,
            reservation,
            existingReservations,
            assignments
          );

          if (conflictingReservations.length > 0) {
            availableTables.splice(tableIndex, 1);
          }
        }
      }
    }

    return assignments;
  }

  // Encontrar la mejor mesa para una reserva
  private findBestTable(
    reservation: Reservation,
    availableTables: TableLayoutTable[],
    existingReservations: Reservation[],
    currentAssignments: TableAssignment[]
  ): { table: TableLayoutTable; score: number; reasons: string[] } | null {
    let bestMatch: { table: TableLayoutTable; score: number; reasons: string[] } | null = null;

    for (const table of availableTables) {
      // Verificar disponibilidad básica
      if (!this.isTableAvailable(table, reservation, existingReservations, currentAssignments)) {
        continue;
      }

      const score = this.calculateTableScore(table, reservation, existingReservations);
      
      if (!bestMatch || score.total > bestMatch.score) {
        bestMatch = {
          table,
          score: score.total,
          reasons: score.reasons
        };
      }
    }

    return bestMatch;
  }

  // Verificar si una mesa está disponible
  private isTableAvailable(
    table: TableLayoutTable,
    reservation: Reservation,
    existingReservations: Reservation[],
    currentAssignments: TableAssignment[]
  ): boolean {
    // Verificar capacidad mínima
    if (table.capacity < reservation.guests) {
      return false;
    }

    // Verificar conflictos con reservas existentes
    const conflicts = this.getConflictingReservations(
      table.id,
      reservation,
      existingReservations,
      currentAssignments
    );

    return conflicts.length === 0;
  }

  // Obtener reservas que conflictan con una nueva asignación
  private getConflictingReservations(
    tableId: string,
    newReservation: Reservation,
    existingReservations: Reservation[],
    currentAssignments: TableAssignment[]
  ): Reservation[] {
    const duration = newReservation.duration || 120; // 2 horas por defecto
    const newStart = this.timeToMinutes(newReservation.time);
    const newEnd = newStart + duration;

    // Verificar reservas existentes
    const existingConflicts = existingReservations.filter(existing => {
      if (existing.assignedTable !== tableId || existing.status === 'cancelled') {
        return false;
      }

      const existingDuration = existing.duration || 120;
      const existingStart = this.timeToMinutes(existing.time);
      const existingEnd = existingStart + existingDuration;

      // Verificar solapamiento
      return newStart < existingEnd && newEnd > existingStart;
    });

    // Verificar asignaciones actuales
    const currentConflicts = currentAssignments.filter(assignment => {
      if (assignment.tableId !== tableId) {
        return false;
      }

      // Buscar la reserva correspondiente
      const assignedReservation = existingReservations.find(r => r.id === assignment.reservationId);
      if (!assignedReservation) return false;

      const assignedDuration = assignedReservation.duration || 120;
      const assignedStart = this.timeToMinutes(assignedReservation.time);
      const assignedEnd = assignedStart + assignedDuration;

      return newStart < assignedEnd && newEnd > assignedStart;
    });

    return [...existingConflicts, ...currentConflicts.map(c => 
      existingReservations.find(r => r.id === c.reservationId)!
    )];
  }

  // Calcular puntuación de una mesa para una reserva
  private calculateTableScore(
    table: TableLayoutTable,
    reservation: Reservation,
    existingReservations: Reservation[]
  ): { total: number; reasons: string[] } {
    const criteria: AssignmentCriteria = {
      capacityMatch: 0,
      zonePreference: 0,
      proximityToFeatures: 0,
      timeOptimization: 0,
      groupSeparation: 0
    };

    const reasons: string[] = [];

    // 1. Coincidencia de capacidad (40% del peso)
    const capacityRatio = reservation.guests / table.capacity;
    if (capacityRatio >= 0.75 && capacityRatio <= 1.0) {
      criteria.capacityMatch = 40; // Capacidad óptima
      reasons.push('Capacidad óptima');
    } else if (capacityRatio >= 0.5 && capacityRatio < 0.75) {
      criteria.capacityMatch = 30; // Capacidad buena
      reasons.push('Capacidad adecuada');
    } else if (capacityRatio < 0.5) {
      criteria.capacityMatch = 10; // Mesa muy grande
      reasons.push('Mesa grande disponible');
    } else {
      criteria.capacityMatch = 0; // No cabe
    }

    // 2. Preferencia de zona (25% del peso)
    if (reservation.tableType) {
      const preferredZones = this.getPreferredZones(reservation.tableType);
      if (preferredZones.includes(table.zone)) {
        criteria.zonePreference = 25;
        reasons.push(`Zona preferida: ${table.zone}`);
      } else {
        criteria.zonePreference = 10;
      }
    } else {
      criteria.zonePreference = 15; // Neutral
    }

    // 3. Proximidad a características especiales (20% del peso)
    const featureScore = this.calculateFeatureScore(table, reservation);
    criteria.proximityToFeatures = featureScore.score;
    if (featureScore.reasons.length > 0) {
      reasons.push(...featureScore.reasons);
    }

    // 4. Optimización de tiempo (10% del peso)
    const timeScore = this.calculateTimeOptimization(table, reservation, existingReservations);
    criteria.timeOptimization = timeScore;
    if (timeScore > 5) {
      reasons.push('Optimización de horarios');
    }

    // 5. Separación de grupos (5% del peso)
    const separationScore = this.calculateGroupSeparation(table, reservation, existingReservations);
    criteria.groupSeparation = separationScore;

    const total = Object.values(criteria).reduce((sum, score) => sum + score, 0);

    return { total, reasons };
  }

  // Obtener zonas preferidas según el tipo de mesa solicitado
  private getPreferredZones(tableType: string): string[] {
    const zoneMap: Record<string, string[]> = {
      'window': ['interior'],
      'terrace': ['exterior'],
      'private': ['vip'],
      'bar': ['bar'],
      'any': ['interior', 'exterior', 'vip', 'bar']
    };

    return zoneMap[tableType] || ['interior'];
  }

  // Calcular puntuación por características especiales
  private calculateFeatureScore(
    table: TableLayoutTable,
    reservation: Reservation
  ): { score: number; reasons: string[] } {
    let score = 10; // Base score
    const reasons: string[] = [];

    // Verificar peticiones especiales
    if (reservation.specialRequests) {
      const requests = reservation.specialRequests.toLowerCase();
      
      if (requests.includes('ventana') && table.features.includes('vista')) {
        score += 10;
        reasons.push('Mesa con vista');
      }
      
      if (requests.includes('privad') && table.zone === 'vip') {
        score += 10;
        reasons.push('Zona privada');
      }
      
      if (requests.includes('terraza') && table.zone === 'exterior') {
        score += 10;
        reasons.push('Mesa en terraza');
      }
      
      if (requests.includes('tranquil') && table.zone !== 'bar') {
        score += 5;
        reasons.push('Zona tranquila');
      }
    }

    // Bonificación por características premium
    if (table.features.includes('premium')) {
      score += 5;
      reasons.push('Mesa premium');
    }

    return { score: Math.min(score, 20), reasons };
  }

  // Calcular optimización de tiempo
  private calculateTimeOptimization(
    table: TableLayoutTable,
    reservation: Reservation,
    existingReservations: Reservation[]
  ): number {
    const tableReservations = existingReservations.filter(r => 
      r.assignedTable === table.id && r.status !== 'cancelled'
    );

    if (tableReservations.length === 0) {
      return 10; // Mesa completamente libre
    }

    // Verificar si hay tiempo suficiente entre reservas
    const reservationTime = this.timeToMinutes(reservation.time);
    const duration = reservation.duration || 120;

    for (const existing of tableReservations) {
      const existingTime = this.timeToMinutes(existing.time);
      const existingDuration = existing.duration || 120;
      
      const timeBetween = Math.abs(reservationTime - (existingTime + existingDuration));
      
      if (timeBetween >= 30) { // 30 minutos de buffer
        return 8;
      } else if (timeBetween >= 15) { // 15 minutos de buffer
        return 5;
      }
    }

    return 2; // Tiempo ajustado
  }

  // Calcular separación de grupos
  private calculateGroupSeparation(
    table: TableLayoutTable,
    reservation: Reservation,
    existingReservations: Reservation[]
  ): number {
    // Lógica simple: evitar mesas adyacentes para grupos grandes
    if (reservation.guests >= 6) {
      const nearbyTables = this.getNearbyTables(table);
      const busyNearbyTables = nearbyTables.filter(nearbyTable => 
        existingReservations.some(r => 
          r.assignedTable === nearbyTable.id && 
          r.status !== 'cancelled' &&
          Math.abs(this.timeToMinutes(r.time) - this.timeToMinutes(reservation.time)) < 60
        )
      );

      if (busyNearbyTables.length === 0) {
        return 5; // Área tranquila
      } else if (busyNearbyTables.length <= 1) {
        return 3; // Algo de espacio
      }
    }

    return 2; // Puntuación base
  }

  // Obtener mesas cercanas (simplificado)
  private getNearbyTables(table: TableLayoutTable): TableLayoutTable[] {
    const proximityThreshold = 100; // píxeles
    
    return this.tableLayout.tables.filter(otherTable => {
      if (otherTable.id === table.id) return false;
      
      const distance = Math.sqrt(
        Math.pow(table.x - otherTable.x, 2) + 
        Math.pow(table.y - otherTable.y, 2)
      );
      
      return distance <= proximityThreshold;
    });
  }

  // Convertir tiempo a minutos desde medianoche
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Sugerir mesa alternativa
  async suggestAlternativeTable(
    reservation: Reservation,
    preferredTableId: string,
    date: string
  ): Promise<{ table: TableLayoutTable; reasons: string[] } | null> {
    const availableTables = this.tableLayout.tables.filter(t => t.id !== preferredTableId);
    const existingReservations = reservationService.getReservationsByDate(date);
    
    const bestAlternative = this.findBestTable(
      reservation,
      availableTables,
      existingReservations,
      []
    );

    return bestAlternative;
  }

  // Optimizar distribución completa del día
  async optimizeFullDayDistribution(date: string): Promise<TableAssignment[]> {
    const allReservations = reservationService.getReservationsByDate(date)
      .filter(r => r.status !== 'cancelled');
    
    // Remover asignaciones existentes temporalmente
    const unassignedReservations = allReservations.map(r => ({ ...r, assignedTable: undefined }));
    
    return this.autoAssignTables(unassignedReservations, date);
  }

  // Verificar conflictos de asignación
  validateAssignment(
    reservation: Reservation,
    tableId: string,
    date: string
  ): { valid: boolean; conflicts: string[]; warnings: string[] } {
    const table = this.tableLayout.tables.find(t => t.id === tableId);
    const conflicts: string[] = [];
    const warnings: string[] = [];

    if (!table) {
      conflicts.push('Mesa no encontrada');
      return { valid: false, conflicts, warnings };
    }

    // Verificar capacidad
    if (table.capacity < reservation.guests) {
      conflicts.push(`La mesa tiene capacidad para ${table.capacity} pero la reserva es para ${reservation.guests} personas`);
    } else if (table.capacity > reservation.guests * 2) {
      warnings.push('La mesa es considerablemente más grande que el grupo');
    }

    // Verificar disponibilidad de tiempo
    const existingReservations = reservationService.getReservationsByDate(date);
    const timeConflicts = this.getConflictingReservations(tableId, reservation, existingReservations, []);
    
    if (timeConflicts.length > 0) {
      conflicts.push(`Conflicto de horario con reserva existente`);
    }

    return {
      valid: conflicts.length === 0,
      conflicts,
      warnings
    };
  }
}

export const tableAssignmentService = new TableAssignmentService();