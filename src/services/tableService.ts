import { Table, Reservation } from '../types';
import { supabase } from '../utils/supabase';
import { reservationService } from './reservationService';

class TableService {
  // Obtener todas las mesas de un restaurante
  async getAllTables(restaurantId: string): Promise<Table[]> {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('table_number', { ascending: true });

      if (error) {
        console.error('Error obteniendo mesas:', error);
        throw new Error(`Error al obtener mesas: ${error.message}`);
      }

      return this.mapSupabaseToTable(data || []);
    } catch (error) {
      console.error('Error en getAllTables:', error);
      return [];
    }
  }

  // Obtener mesas disponibles para una fecha, hora y número de comensales específicos
  async getAvailableTables(
    restaurantId: string,
    date: string, 
    time: string, 
    guests: number, 
    duration: number = 120,
    tableType: string = 'any'
  ): Promise<Table[]> {
    try {
      // Obtener todas las mesas del restaurante
      let availableTables = await this.getAllTables(restaurantId);
      
      // Filtrar por capacidad mínima
      availableTables = availableTables.filter(table => table.capacity >= guests);
      
      // Filtrar por tipo de mesa si se especifica
      if (tableType !== 'any') {
        availableTables = availableTables.filter(table => 
          table.type.toLowerCase().includes(tableType.toLowerCase()) ||
          table.zone.toLowerCase().includes(tableType.toLowerCase())
        );
      }
      
      // Obtener mesas ocupadas para el horario específico
      const occupiedTableIds = await this.getOccupiedTables(restaurantId, date, time, duration);
      
      // Filtrar mesas ocupadas
      availableTables = availableTables.filter(table => 
        !occupiedTableIds.includes(table.id)
      );
      
      // Ordenar por capacidad más cercana al número de comensales
      return availableTables.sort((a, b) => {
        const diffA = Math.abs(a.capacity - guests);
        const diffB = Math.abs(b.capacity - guests);
        return diffA - diffB;
      });
    } catch (error) {
      console.error('Error en getAvailableTables:', error);
      return [];
    }
  }

  // Obtener mesas ocupadas para una fecha, hora y duración específicas
  private async getOccupiedTables(
    restaurantId: string, 
    date: string, 
    time: string, 
    duration: number
  ): Promise<string[]> {
    try {
      // Obtener todas las reservas del día
      const dayReservations = await reservationService.getReservationsByDate(restaurantId, date);
      
      // Calcular el rango de tiempo de la nueva reserva
      const newStartTime = this.timeToMinutes(time);
      const newEndTime = newStartTime + duration;
      
      const occupiedTableIds: string[] = [];
      
      // Verificar cada reserva para conflictos de tiempo
      for (const reservation of dayReservations) {
        // Solo considerar reservas confirmadas o pendientes con mesa asignada
        if (
          reservation.status === 'cancelled' || 
          !reservation.assigned_table_id
        ) {
          continue;
        }
        
        const resStartTime = this.timeToMinutes(reservation.reservation_time);
        const resEndTime = resStartTime + (reservation.duration_minutes || 120);
        
        // Verificar solapamiento de tiempo
        if (newStartTime < resEndTime && newEndTime > resStartTime) {
          occupiedTableIds.push(reservation.assigned_table_id);
        }
      }
      
      return [...new Set(occupiedTableIds)]; // Eliminar duplicados
    } catch (error) {
      console.error('Error en getOccupiedTables:', error);
      return [];
    }
  }

  // Asignar mesa a una reserva (actualizar assigned_table_id)
  async assignTableToReservation(
    reservationId: string, 
    tableId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updatedReservation = await reservationService.updateReservation(reservationId, {
        assigned_table_id: tableId
      });
      
      if (updatedReservation) {
        console.log(`✅ Mesa ${tableId} asignada a reserva ${reservationId}`);
        return { success: true };
      } else {
        return { success: false, error: 'No se pudo actualizar la reserva' };
      }
    } catch (error) {
      console.error('Error en assignTableToReservation:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // Desasignar mesa de una reserva
  async unassignTableFromReservation(reservationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updatedReservation = await reservationService.updateReservation(reservationId, {
        assigned_table_id: null
      });
      
      if (updatedReservation) {
        console.log(`✅ Mesa desasignada de reserva ${reservationId}`);
        return { success: true };
      } else {
        return { success: false, error: 'No se pudo actualizar la reserva' };
      }
    } catch (error) {
      console.error('Error en unassignTableFromReservation:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // Obtener información de una mesa específica
  async getTableById(restaurantId: string, tableId: string): Promise<Table | null> {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('id', tableId)
        .single();

      if (error) {
        console.error('Error obteniendo mesa por ID:', error);
        return null;
      }

      return this.mapSupabaseToTable([data])[0];
    } catch (error) {
      console.error('Error en getTableById:', error);
      return null;
    }
  }

  // Obtener estadísticas de ocupación para un restaurante y fecha
  async getOccupancyStats(restaurantId: string, date: string): Promise<{
    totalTables: number;
    occupiedTables: number;
    availableTables: number;
    occupancyRate: number;
    peakHourOccupancy: number;
  }> {
    try {
      const allTables = await this.getAllTables(restaurantId);
      
      // Calcular ocupación para hora pico (20:00)
      const peakHourOccupiedTables = await this.getOccupiedTables(restaurantId, date, '20:00', 120);
      
      // Calcular ocupación promedio del día
      const dayReservations = await reservationService.getReservationsByDate(restaurantId, date);
      const assignedTables = new Set(
        dayReservations
          .filter(r => r.status !== 'cancelled' && r.assigned_table_id)
          .map(r => r.assigned_table_id!)
      );
      
      const totalTables = allTables.length;
      const occupiedTables = assignedTables.size;
      const availableTables = totalTables - occupiedTables;
      const occupancyRate = totalTables > 0 ? (occupiedTables / totalTables) * 100 : 0;
      const peakHourOccupancy = totalTables > 0 ? (peakHourOccupiedTables.length / totalTables) * 100 : 0;
      
      return {
        totalTables,
        occupiedTables,
        availableTables,
        occupancyRate: Math.round(occupancyRate),
        peakHourOccupancy: Math.round(peakHourOccupancy)
      };
    } catch (error) {
      console.error('Error en getOccupancyStats:', error);
      return {
        totalTables: 0,
        occupiedTables: 0,
        availableTables: 0,
        occupancyRate: 0,
        peakHourOccupancy: 0
      };
    }
  }

  // Crear nueva mesa
  async createTable(restaurantId: string, tableData: Omit<Table, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>): Promise<Table | null> {
    try {
      const supabaseTable = {
        restaurant_id: restaurantId,
        table_number: tableData.table_number,
        capacity: tableData.capacity,
        type: tableData.type,
        zone: tableData.zone,
        features: tableData.features || [],
        position: tableData.position || null,
        is_active: true
      };

      const { data, error } = await supabase
        .from('tables')
        .insert([supabaseTable])
        .select()
        .single();

      if (error) {
        console.error('Error creando mesa:', error);
        return null;
      }

      return this.mapSupabaseToTable([data])[0];
    } catch (error) {
      console.error('Error en createTable:', error);
      return null;
    }
  }

  // Actualizar mesa existente
  async updateTable(tableId: string, updates: Partial<Table>): Promise<Table | null> {
    try {
      const supabaseUpdates: any = {};
      
      if (updates.table_number !== undefined) supabaseUpdates.table_number = updates.table_number;
      if (updates.capacity !== undefined) supabaseUpdates.capacity = updates.capacity;
      if (updates.type !== undefined) supabaseUpdates.type = updates.type;
      if (updates.zone !== undefined) supabaseUpdates.zone = updates.zone;
      if (updates.features !== undefined) supabaseUpdates.features = updates.features;
      if (updates.position !== undefined) supabaseUpdates.position = updates.position;
      if (updates.is_active !== undefined) supabaseUpdates.is_active = updates.is_active;
      
      supabaseUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('tables')
        .update(supabaseUpdates)
        .eq('id', tableId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando mesa:', error);
        return null;
      }

      return this.mapSupabaseToTable([data])[0];
    } catch (error) {
      console.error('Error en updateTable:', error);
      return null;
    }
  }

  // Eliminar mesa (soft delete)
  async deleteTable(tableId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);

      if (error) {
        console.error('Error eliminando mesa:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en deleteTable:', error);
      return false;
    }
  }

  // Obtener mesas por zona
  async getTablesByZone(restaurantId: string, zone: string): Promise<Table[]> {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('zone', zone)
        .eq('is_active', true)
        .order('table_number', { ascending: true });

      if (error) {
        console.error('Error obteniendo mesas por zona:', error);
        return [];
      }

      return this.mapSupabaseToTable(data || []);
    } catch (error) {
      console.error('Error en getTablesByZone:', error);
      return [];
    }
  }

  // Verificar disponibilidad de una mesa específica
  async isTableAvailable(
    tableId: string, 
    date: string, 
    time: string, 
    duration: number = 120
  ): Promise<boolean> {
    try {
      // Obtener información de la mesa
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('restaurant_id')
        .eq('id', tableId)
        .single();

      if (tableError || !tableData) {
        return false;
      }

      const occupiedTables = await this.getOccupiedTables(
        tableData.restaurant_id, 
        date, 
        time, 
        duration
      );

      return !occupiedTables.includes(tableId);
    } catch (error) {
      console.error('Error en isTableAvailable:', error);
      return false;
    }
  }

  // Obtener reservas de una mesa específica para una fecha
  async getTableReservations(tableId: string, date: string): Promise<Reservation[]> {
    try {
      // Obtener información de la mesa para obtener el restaurant_id
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('restaurant_id')
        .eq('id', tableId)
        .single();

      if (tableError || !tableData) {
        return [];
      }

      const dayReservations = await reservationService.getReservationsByDate(
        tableData.restaurant_id, 
        date
      );

      return dayReservations.filter(reservation => 
        reservation.assigned_table_id === tableId && 
        reservation.status !== 'cancelled'
      );
    } catch (error) {
      console.error('Error en getTableReservations:', error);
      return [];
    }
  }

  // Convertir tiempo a minutos desde medianoche
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Mapear datos de Supabase (snake_case) al formato de la aplicación
  private mapSupabaseToTable(supabaseData: any[]): Table[] {
    return supabaseData.map(item => ({
      id: item.id,
      restaurant_id: item.restaurant_id,
      table_number: item.table_number,
      capacity: item.capacity,
      type: item.type,
      zone: item.zone,
      features: item.features || [],
      position: item.position,
      is_active: item.is_active,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  }

  // Métodos de conveniencia para mantener compatibilidad con código existente
  // Estos métodos usan un restaurant_id por defecto

  async getAllTablesDefault(): Promise<Table[]> {
    return this.getAllTables('default-restaurant-id');
  }

  async getAvailableTablesDefault(
    date: string, 
    time: string, 
    guests: number, 
    duration: number = 120,
    tableType: string = 'any'
  ): Promise<Table[]> {
    return this.getAvailableTables('default-restaurant-id', date, time, guests, duration, tableType);
  }

  async getTableByIdDefault(tableId: string): Promise<Table | null> {
    return this.getTableById('default-restaurant-id', tableId);
  }

  async getOccupancyStatsDefault(date: string) {
    return this.getOccupancyStats('default-restaurant-id', date);
  }

  async getTablesByZoneDefault(zone: string): Promise<Table[]> {
    return this.getTablesByZone('default-restaurant-id', zone);
  }
}

export const tableService = new TableService();