import { Reservation, Table, TableLayoutTable } from '../types';
import { supabase } from '../utils/supabase';
import { reservationService } from './reservationService';
import { tableService } from './tableService';
import { configurationService } from './configurationService';

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

interface TableWithReservation extends Table {
  currentReservation?: Reservation;
  nextReservation?: Reservation;
  status: 'free' | 'reserved' | 'occupied' | 'blocked';
}

class TableAssignmentService {
  // Asignación automática de mesas para múltiples reservas
  async autoAssignTables(
    restaurantId: string,
    reservations: Reservation[], 
    date: string
  ): Promise<TableAssignment[]> {
    try {
      const assignments: TableAssignment[] = [];
      const availableTables = await tableService.getAllTables(restaurantId);
      const existingReservations = await reservationService.getReservationsByDate(restaurantId, date);

      // Ordenar reservas por prioridad (grupos grandes primero, luego por hora)
      const sortedReservations = reservations.sort((a, b) => {
        if (a.guests !== b.guests) {
          return b.guests - a.guests; // Grupos grandes primero
        }
        return a.reservation_time.localeCompare(b.reservation_time); // Luego por hora
      });

      for (const reservation of sortedReservations) {
        const bestTable = await this.findBestTable(
          restaurantId,
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

          console.log(`✅ Mesa ${bestTable.table.table_number} asignada a ${reservation.customer_name} (Score: ${bestTable.score})`);
        } else {
          console.warn(`⚠️ No se encontró mesa disponible para ${reservation.customer_name}`);
        }
      }

      return assignments;
    } catch (error) {
      console.error('Error en autoAssignTables:', error);
      return [];
    }
  }

  // Encontrar la mejor mesa para una reserva específica
  private async findBestTable(
    restaurantId: string,
    reservation: Reservation,
    availableTables: Table[],
    existingReservations: Reservation[],
    currentAssignments: TableAssignment[]
  ): Promise<{ table: Table; score: number; reasons: string[] } | null> {
    let bestMatch: { table: Table; score: number; reasons: string[] } | null = null;

    for (const table of availableTables) {
      // Verificar disponibilidad básica
      const isAvailable = await this.isTableAvailable(
        table, 
        reservation, 
        existingReservations, 
        currentAssignments
      );

      if (!isAvailable) {
        continue;
      }

      const score = await this.calculateTableScore(
        restaurantId,
        table, 
        reservation, 
        existingReservations
      );
      
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

  // Verificar si una mesa está disponible para una reserva
  private async isTableAvailable(
    table: Table,
    reservation: Reservation,
    existingReservations: Reservation[],
    currentAssignments: TableAssignment[]
  ): Promise<boolean> {
    // Verificar capacidad mínima
    if (table.capacity < reservation.guests) {
      return false;
    }

    // Verificar conflictos con reservas existentes
    const conflicts = await this.getConflictingReservations(
      table.id,
      reservation,
      existingReservations,
      currentAssignments
    );

    return conflicts.length === 0;
  }

  // Obtener reservas que conflictan con una nueva asignación
  private async getConflictingReservations(
    tableId: string,
    newReservation: Reservation,
    existingReservations: Reservation[],
    currentAssignments: TableAssignment[]
  ): Promise<Reservation[]> {
    const duration = newReservation.duration_minutes || 120;
    const newStart = this.timeToMinutes(newReservation.reservation_time);
    const newEnd = newStart + duration;

    // Verificar reservas existentes
    const existingConflicts = existingReservations.filter(existing => {
      if (existing.assigned_table_id !== tableId || existing.status === 'cancelled') {
        return false;
      }

      const existingDuration = existing.duration_minutes || 120;
      const existingStart = this.timeToMinutes(existing.reservation_time);
      const existingEnd = existingStart + existingDuration;

      // Verificar solapamiento
      return newStart < existingEnd && newEnd > existingStart;
    });

    // Verificar asignaciones actuales en el mismo proceso
    const currentConflicts = currentAssignments.filter(assignment => {
      if (assignment.tableId !== tableId) {
        return false;
      }

      // Buscar la reserva correspondiente
      const assignedReservation = existingReservations.find(r => r.id === assignment.reservationId);
      if (!assignedReservation) return false;

      const assignedDuration = assignedReservation.duration_minutes || 120;
      const assignedStart = this.timeToMinutes(assignedReservation.reservation_time);
      const assignedEnd = assignedStart + assignedDuration;

      return newStart < assignedEnd && newEnd > assignedStart;
    });

    return [...existingConflicts, ...currentConflicts.map(c => 
      existingReservations.find(r => r.id === c.reservationId)!
    ).filter(Boolean)];
  }

  // Calcular puntuación de una mesa para una reserva
  private async calculateTableScore(
    restaurantId: string,
    table: Table,
    reservation: Reservation,
    existingReservations: Reservation[]
  ): Promise<{ total: number; reasons: string[] }> {
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
    if (reservation.table_type_preference) {
      const preferredZones = this.getPreferredZones(reservation.table_type_preference);
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
    const timeScore = await this.calculateTimeOptimization(table, reservation, existingReservations);
    criteria.timeOptimization = timeScore;
    if (timeScore > 5) {
      reasons.push('Optimización de horarios');
    }

    // 5. Separación de grupos (5% del peso)
    const separationScore = await this.calculateGroupSeparation(
      restaurantId,
      table, 
      reservation, 
      existingReservations
    );
    criteria.groupSeparation = separationScore;

    const total = Object.values(criteria).reduce((sum, score) => sum + score, 0);

    return { total, reasons };
  }

  // Obtener zonas preferidas según el tipo de mesa solicitado
  private getPreferredZones(tableType: string): string[] {
    const zoneMap: Record<string, string[]> = {
      'window': ['interior', 'ventana'],
      'terrace': ['exterior', 'terraza'],
      'private': ['vip', 'privada'],
      'bar': ['bar', 'barra'],
      'any': ['interior', 'exterior', 'vip', 'bar']
    };

    return zoneMap[tableType] || ['interior'];
  }

  // Calcular puntuación por características especiales
  private calculateFeatureScore(
    table: Table,
    reservation: Reservation
  ): { score: number; reasons: string[] } {
    let score = 10; // Base score
    const reasons: string[] = [];

    // Verificar peticiones especiales
    if (reservation.special_requests) {
      const requests = reservation.special_requests.toLowerCase();
      
      if (requests.includes('ventana') && table.features?.includes('vista')) {
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
    if (table.features?.includes('premium')) {
      score += 5;
      reasons.push('Mesa premium');
    }

    return { score: Math.min(score, 20), reasons };
  }

  // Calcular optimización de tiempo
  private async calculateTimeOptimization(
    table: Table,
    reservation: Reservation,
    existingReservations: Reservation[]
  ): Promise<number> {
    const tableReservations = existingReservations.filter(r => 
      r.assigned_table_id === table.id && r.status !== 'cancelled'
    );

    if (tableReservations.length === 0) {
      return 10; // Mesa completamente libre
    }

    // Verificar si hay tiempo suficiente entre reservas
    const reservationTime = this.timeToMinutes(reservation.reservation_time);
    const duration = reservation.duration_minutes || 120;

    for (const existing of tableReservations) {
      const existingTime = this.timeToMinutes(existing.reservation_time);
      const existingDuration = existing.duration_minutes || 120;
      
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
  private async calculateGroupSeparation(
    restaurantId: string,
    table: Table,
    reservation: Reservation,
    existingReservations: Reservation[]
  ): Promise<number> {
    // Lógica simple: evitar mesas adyacentes para grupos grandes
    if (reservation.guests >= 6) {
      try {
        const nearbyTables = await this.getNearbyTables(restaurantId, table);
        const busyNearbyTables = nearbyTables.filter(nearbyTable => 
          existingReservations.some(r => 
            r.assigned_table_id === nearbyTable.id && 
            r.status !== 'cancelled' &&
            Math.abs(
              this.timeToMinutes(r.reservation_time) - 
              this.timeToMinutes(reservation.reservation_time)
            ) < 60
          )
        );

        if (busyNearbyTables.length === 0) {
          return 5; // Área tranquila
        } else if (busyNearbyTables.length <= 1) {
          return 3; // Algo de espacio
        }
      } catch (error) {
        console.error('Error calculando separación de grupos:', error);
      }
    }

    return 2; // Puntuación base
  }

  // Obtener mesas cercanas (basado en posición si está disponible)
  private async getNearbyTables(restaurantId: string, table: Table): Promise<Table[]> {
    try {
      const allTables = await tableService.getAllTables(restaurantId);
      
      // Si no hay información de posición, usar zona como proximidad
      if (!table.position) {
        return allTables.filter(otherTable => 
          otherTable.id !== table.id && otherTable.zone === table.zone
        );
      }

      // Si hay información de posición, calcular distancia
      const proximityThreshold = 100; // píxeles
      
      return allTables.filter(otherTable => {
        if (otherTable.id === table.id || !otherTable.position) return false;
        
        const distance = Math.sqrt(
          Math.pow(table.position!.x - otherTable.position!.x, 2) + 
          Math.pow(table.position!.y - otherTable.position!.y, 2)
        );
        
        return distance <= proximityThreshold;
      });
    } catch (error) {
      console.error('Error obteniendo mesas cercanas:', error);
      return [];
    }
  }

  // Sugerir mesa alternativa
  async suggestAlternativeTable(
    restaurantId: string,
    reservation: Reservation,
    preferredTableId: string,
    date: string
  ): Promise<{ table: Table; reasons: string[] } | null> {
    try {
      const availableTables = await tableService.getAllTables(restaurantId);
      const filteredTables = availableTables.filter(t => t.id !== preferredTableId);
      const existingReservations = await reservationService.getReservationsByDate(restaurantId, date);
      
      const bestAlternative = await this.findBestTable(
        restaurantId,
        reservation,
        filteredTables,
        existingReservations,
        []
      );

      return bestAlternative;
    } catch (error) {
      console.error('Error sugiriendo mesa alternativa:', error);
      return null;
    }
  }

  // Optimizar distribución completa del día
  async optimizeFullDayDistribution(restaurantId: string, date: string): Promise<TableAssignment[]> {
    try {
      const allReservations = await reservationService.getReservationsByDate(restaurantId, date);
      const unassignedReservations = allReservations
        .filter(r => r.status !== 'cancelled')
        .map(r => ({ ...r, assigned_table_id: undefined }));
      
      return this.autoAssignTables(restaurantId, unassignedReservations, date);
    } catch (error) {
      console.error('Error optimizando distribución del día:', error);
      return [];
    }
  }

  // Verificar conflictos de asignación
  async validateAssignment(
    restaurantId: string,
    reservation: Reservation,
    tableId: string,
    date: string
  ): Promise<{ valid: boolean; conflicts: string[]; warnings: string[] }> {
    try {
      const table = await tableService.getTableById(restaurantId, tableId);
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
      const existingReservations = await reservationService.getReservationsByDate(restaurantId, date);
      const timeConflicts = await this.getConflictingReservations(tableId, reservation, existingReservations, []);
      
      if (timeConflicts.length > 0) {
        conflicts.push(`Conflicto de horario con reserva existente`);
      }

      return {
        valid: conflicts.length === 0,
        conflicts,
        warnings
      };
    } catch (error) {
      console.error('Error validando asignación:', error);
      return {
        valid: false,
        conflicts: ['Error interno del servidor'],
        warnings: []
      };
    }
  }

  // Aplicar asignaciones automáticas
  async applyAssignments(assignments: TableAssignment[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const assignment of assignments) {
      try {
        const result = await tableService.assignTableToReservation(
          assignment.reservationId,
          assignment.tableId
        );

        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(`Error asignando mesa a reserva ${assignment.reservationId}: ${result.error}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Error procesando asignación para reserva ${assignment.reservationId}: ${error}`);
      }
    }

    return { success, failed, errors };
  }

  // Obtener estado de mesas para una fecha y hora específica
  async getTablesStatus(
    restaurantId: string, 
    date: string, 
    time?: string
  ): Promise<TableWithReservation[]> {
    try {
      const tables = await tableService.getAllTables(restaurantId);
      const dayReservations = await reservationService.getReservationsByDate(restaurantId, date);
      
      return tables.map(table => {
        let currentReservation: Reservation | undefined;
        let nextReservation: Reservation | undefined;
        let status: 'free' | 'reserved' | 'occupied' | 'blocked' = 'free';

        const tableReservations = dayReservations
          .filter(r => r.assigned_table_id === table.id && r.status !== 'cancelled')
          .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));

        if (time) {
          // Buscar reserva actual para la hora específica
          const currentTime = this.timeToMinutes(time);
          
          for (const reservation of tableReservations) {
            const resStart = this.timeToMinutes(reservation.reservation_time);
            const resEnd = resStart + (reservation.duration_minutes || 120);
            
            if (currentTime >= resStart && currentTime < resEnd) {
              currentReservation = reservation;
              status = reservation.status === 'confirmed' ? 'occupied' : 'reserved';
              break;
            }
          }

          // Buscar próxima reserva
          nextReservation = tableReservations.find(r => 
            this.timeToMinutes(r.reservation_time) > currentTime
          );
        } else {
          // Sin hora específica, mostrar primera reserva del día
          if (tableReservations.length > 0) {
            currentReservation = tableReservations[0];
            status = 'reserved';
            nextReservation = tableReservations[1];
          }
        }

        return {
          ...table,
          currentReservation,
          nextReservation,
          status
        };
      });
    } catch (error) {
      console.error('Error obteniendo estado de mesas:', error);
      return [];
    }
  }

  // Convertir tiempo a minutos desde medianoche
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Métodos de conveniencia para mantener compatibilidad
  async autoAssignTablesDefault(reservations: Reservation[], date: string): Promise<TableAssignment[]> {
    return this.autoAssignTables('default-restaurant-id', reservations, date);
  }

  async suggestAlternativeTableDefault(
    reservation: Reservation,
    preferredTableId: string,
    date: string
  ): Promise<{ table: Table; reasons: string[] } | null> {
    return this.suggestAlternativeTable('default-restaurant-id', reservation, preferredTableId, date);
  }

  async optimizeFullDayDistributionDefault(date: string): Promise<TableAssignment[]> {
    return this.optimizeFullDayDistribution('default-restaurant-id', date);
  }

  async validateAssignmentDefault(
    reservation: Reservation,
    tableId: string,
    date: string
  ): Promise<{ valid: boolean; conflicts: string[]; warnings: string[] }> {
    return this.validateAssignment('default-restaurant-id', reservation, tableId, date);
  }

  async getTablesStatusDefault(date: string, time?: string): Promise<TableWithReservation[]> {
    return this.getTablesStatus('default-restaurant-id', date, time);
  }
}

export const tableAssignmentService = new TableAssignmentService();