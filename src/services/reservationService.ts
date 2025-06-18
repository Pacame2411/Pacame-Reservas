import { Reservation, TimeSlot, RestaurantConfig } from '../types';
import { format, parseISO, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { emailService } from './emailService';
import { supabase } from '../utils/supabase';

// Configuración temporal del restaurante (se cargará desde configurationService más adelante)
const DEFAULT_CONFIG = {
  name: "Bella Vista Restaurant",
  maxTotalCapacity: 120,
  maxGuestsPerReservation: 12,
  maxCapacityPerSlot: 50,
  timeSlotDuration: 30,
  averageTableDuration: 120,
  advanceBookingDays: 60,
  operatingHours: [
    { isOpen: true, start: '12:00', end: '23:00' }, // Lunes
    { isOpen: true, start: '12:00', end: '23:00' }, // Martes
    { isOpen: true, start: '12:00', end: '23:00' }, // Miércoles
    { isOpen: true, start: '12:00', end: '23:00' }, // Jueves
    { isOpen: true, start: '12:00', end: '24:00' }, // Viernes
    { isOpen: true, start: '12:00', end: '24:00' }, // Sábado
    { isOpen: true, start: '12:00', end: '22:00' }, // Domingo
  ]
};

class ReservationService {
  // Obtener todas las reservas de un restaurante
  async getAllReservations(restaurantId: string): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true });

      if (error) {
        console.error('Error obteniendo reservas:', error);
        throw new Error(`Error al obtener reservas: ${error.message}`);
      }

      return this.mapSupabaseToReservation(data || []);
    } catch (error) {
      console.error('Error en getAllReservations:', error);
      return [];
    }
  }

  // Guardar nueva reserva
  async saveReservation(
    reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Reservation> {
    try {
      // El objeto reservation ya debe tener restaurant_id incluido
      // Mapear los datos al formato snake_case de Supabase
      const supabaseReservation = {
        restaurant_id: reservation.restaurant_id,
        customer_name: reservation.customer_name,
        customer_email: reservation.customer_email,
        customer_phone: reservation.customer_phone,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        guests: reservation.guests,
        status: reservation.status || 'pending',
        special_requests: reservation.special_requests || null,
        table_type_preference: reservation.table_type_preference || null,
        duration_minutes: reservation.duration_minutes || 120,
        assigned_table_id: reservation.assigned_table_id || null,
        created_by: reservation.created_by || 'customer'
      };

      const { data, error } = await supabase
        .from('reservations')
        .insert([supabaseReservation])
        .select()
        .single();

      if (error) {
        console.error('Error guardando reserva:', error);
        throw new Error(`Error al guardar la reserva: ${error.message}`);
      }

      const newReservation = this.mapSupabaseToReservation([data])[0];
      
      // Enviar email de confirmación inmediato
      await this.sendConfirmationEmail(newReservation);
      
      // Programar email recordatorio para el día de la reserva
      this.scheduleReminderEmail(newReservation);
      
      return newReservation;
    } catch (error) {
      console.error('Error en saveReservation:', error);
      throw error;
    }
  }

  // Actualizar reserva existente
  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    try {
      // Obtener la reserva actual para comparar cambios
      const { data: currentData, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentData) {
        console.error('Error obteniendo reserva actual:', fetchError);
        return null;
      }

      const oldReservation = this.mapSupabaseToReservation([currentData])[0];

      // Mapear las actualizaciones al formato snake_case de Supabase
      const supabaseUpdates: any = {};
      
      if (updates.customer_name !== undefined) supabaseUpdates.customer_name = updates.customer_name;
      if (updates.customer_email !== undefined) supabaseUpdates.customer_email = updates.customer_email;
      if (updates.customer_phone !== undefined) supabaseUpdates.customer_phone = updates.customer_phone;
      if (updates.reservation_date !== undefined) supabaseUpdates.reservation_date = updates.reservation_date;
      if (updates.reservation_time !== undefined) supabaseUpdates.reservation_time = updates.reservation_time;
      if (updates.guests !== undefined) supabaseUpdates.guests = updates.guests;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.special_requests !== undefined) supabaseUpdates.special_requests = updates.special_requests;
      if (updates.table_type_preference !== undefined) supabaseUpdates.table_type_preference = updates.table_type_preference;
      if (updates.duration_minutes !== undefined) supabaseUpdates.duration_minutes = updates.duration_minutes;
      if (updates.assigned_table_id !== undefined) supabaseUpdates.assigned_table_id = updates.assigned_table_id;
      if (updates.created_by !== undefined) supabaseUpdates.created_by = updates.created_by;

      // Agregar timestamp de actualización
      supabaseUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('reservations')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando reserva:', error);
        return null;
      }

      const updatedReservation = this.mapSupabaseToReservation([data])[0];
      
      // Verificar si hubo cambios significativos para enviar email
      const significantChanges = this.hasSignificantChanges(oldReservation, updatedReservation);
      
      if (significantChanges) {
        await this.sendModificationEmail(updatedReservation);
      }
      
      return updatedReservation;
    } catch (error) {
      console.error('Error en updateReservation:', error);
      return null;
    }
  }

  // Obtener reservas por fecha y restaurante
  async getReservationsByDate(restaurantId: string, date: string): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('reservation_date', date)
        .order('reservation_time', { ascending: true });

      if (error) {
        console.error('Error obteniendo reservas por fecha:', error);
        throw new Error(`Error al obtener reservas por fecha: ${error.message}`);
      }

      return this.mapSupabaseToReservation(data || []);
    } catch (error) {
      console.error('Error en getReservationsByDate:', error);
      return [];
    }
  }

  // Eliminar reserva
  async deleteReservation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error eliminando reserva:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en deleteReservation:', error);
      return false;
    }
  }

  // Generar horarios disponibles para una fecha y restaurante
  async getAvailableTimeSlots(restaurantId: string, date: string): Promise<TimeSlot[]> {
    try {
      const reservations = await this.getReservationsByDate(restaurantId, date);
      const slots: TimeSlot[] = [];
      
      // Obtener configuración del restaurante (por ahora usamos la configuración por defecto)
      const config = await this.getRestaurantConfig(restaurantId);
      
      const startTime = config.operatingHours[0].start;
      const endTime = config.operatingHours[0].end;
      
      let currentTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(`${date}T${endTime}:00`);
      
      while (isBefore(currentTime, endDateTime)) {
        const timeString = format(currentTime, 'HH:mm');
        const reservationsAtTime = reservations.filter(r => 
          r.reservation_time === timeString && r.status !== 'cancelled'
        );
        const totalGuests = reservationsAtTime.reduce((sum, r) => sum + r.guests, 0);
        
        slots.push({
          time: timeString,
          available: totalGuests < config.maxCapacityPerSlot,
          maxCapacity: config.maxCapacityPerSlot,
          currentReservations: totalGuests
        });
        
        currentTime = addMinutes(currentTime, config.timeSlotDuration);
      }
      
      return slots;
    } catch (error) {
      console.error('Error en getAvailableTimeSlots:', error);
      return [];
    }
  }

  // Validar disponibilidad para un restaurante específico
  async checkAvailability(restaurantId: string, date: string, time: string, guests: number): Promise<boolean> {
    try {
      const reservations = await this.getReservationsByDate(restaurantId, date);
      const reservationsAtTime = reservations.filter(r => 
        r.reservation_time === time && r.status !== 'cancelled'
      );
      const totalGuests = reservationsAtTime.reduce((sum, r) => sum + r.guests, 0);
      
      // Obtener configuración del restaurante
      const config = await this.getRestaurantConfig(restaurantId);
      
      return (totalGuests + guests) <= config.maxCapacityPerSlot;
    } catch (error) {
      console.error('Error en checkAvailability:', error);
      return false;
    }
  }

  // Obtener reservas del día actual para un restaurante
  async getTodayReservations(restaurantId: string): Promise<Reservation[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.getReservationsByDate(restaurantId, today);
  }

  // Actualizar estado de reserva
  async updateReservationStatus(id: string, status: Reservation['status']): Promise<boolean> {
    try {
      // Obtener la reserva actual para el email
      const { data: currentData, error: fetchError } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !currentData) {
        console.error('Error obteniendo reserva:', fetchError);
        return false;
      }

      const oldStatus = currentData.status;

      // Actualizar el estado
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error actualizando estado:', error);
        return false;
      }

      // Enviar email según el cambio de estado
      if (oldStatus !== status) {
        const reservation = this.mapSupabaseToReservation([{ ...currentData, status }])[0];
        await this.handleStatusChangeEmail(reservation, oldStatus, status);
      }
      
      return true;
    } catch (error) {
      console.error('Error en updateReservationStatus:', error);
      return false;
    }
  }

  // Buscar reservas en un restaurante específico
  async searchReservations(restaurantId: string, query: string): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .or(`customer_name.ilike.%${query}%,customer_email.ilike.%${query}%,customer_phone.like.%${query}%,id.ilike.%${query}%`);

      if (error) {
        console.error('Error buscando reservas:', error);
        throw new Error(`Error al buscar reservas: ${error.message}`);
      }

      return this.mapSupabaseToReservation(data || []);
    } catch (error) {
      console.error('Error en searchReservations:', error);
      return [];
    }
  }

  // Obtener estadísticas de reservas para un restaurante
  async getReservationStats(restaurantId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('reservation_date', startDate)
        .lte('reservation_date', endDate);

      if (error) {
        console.error('Error obteniendo estadísticas:', error);
        throw new Error(`Error al obtener estadísticas: ${error.message}`);
      }

      const reservations = data || [];
      
      return {
        total: reservations.length,
        confirmed: reservations.filter(r => r.status === 'confirmed').length,
        pending: reservations.filter(r => r.status === 'pending').length,
        cancelled: reservations.filter(r => r.status === 'cancelled').length,
        totalGuests: reservations.reduce((sum, r) => sum + r.guests, 0),
        averagePartySize: reservations.length > 0 ? 
          reservations.reduce((sum, r) => sum + r.guests, 0) / reservations.length : 0
      };
    } catch (error) {
      console.error('Error en getReservationStats:', error);
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        totalGuests: 0,
        averagePartySize: 0
      };
    }
  }

  // Validar conflictos de horario para un restaurante
  async checkTimeConflicts(
    restaurantId: string, 
    date: string, 
    time: string, 
    duration: number, 
    excludeId?: string
  ): Promise<boolean> {
    try {
      const reservations = await this.getReservationsByDate(restaurantId, date);
      const startTime = new Date(`${date}T${time}:00`);
      const endTime = addMinutes(startTime, duration);
      
      return reservations.some(reservation => {
        if (excludeId && reservation.id === excludeId) return false;
        if (reservation.status === 'cancelled') return false;
        
        const resStartTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}:00`);
        const resEndTime = addMinutes(resStartTime, reservation.duration_minutes || 120);
        
        // Verificar solapamiento
        return (startTime < resEndTime && endTime > resStartTime);
      });
    } catch (error) {
      console.error('Error en checkTimeConflicts:', error);
      return false;
    }
  }

  // Inicializar verificación de recordatorios pendientes para un restaurante
  async initializeReminderCheck(restaurantId: string): Promise<void> {
    try {
      await emailService.checkAndSendPendingReminders();
      
      // Configurar verificación periódica cada hora
      setInterval(async () => {
        await emailService.checkAndSendPendingReminders();
      }, 60 * 60 * 1000); // 1 hora
      
      console.log(`✅ Sistema de recordatorios inicializado para restaurante ${restaurantId}`);
    } catch (error) {
      console.error('Error inicializando sistema de recordatorios:', error);
    }
  }

  // Obtener configuración del restaurante (temporal - se cargará desde configurationService más adelante)
  async getRestaurantConfig(restaurantId: string): Promise<RestaurantConfig> {
    try {
      // TODO: Cargar configuración real desde la tabla restaurant_configurations
      // Por ahora, devolvemos la configuración por defecto
      return {
        ...DEFAULT_CONFIG,
        name: `Restaurant ${restaurantId}` // Personalizar según el restaurante
      };
    } catch (error) {
      console.error('Error obteniendo configuración del restaurante:', error);
      return DEFAULT_CONFIG;
    }
  }

  // Mapear datos de Supabase (snake_case) al formato de la aplicación
  private mapSupabaseToReservation(supabaseData: any[]): Reservation[] {
    return supabaseData.map(item => ({
      id: item.id,
      restaurant_id: item.restaurant_id,
      customer_name: item.customer_name,
      customer_email: item.customer_email,
      customer_phone: item.customer_phone,
      reservation_date: item.reservation_date,
      reservation_time: item.reservation_time,
      guests: item.guests,
      status: item.status,
      special_requests: item.special_requests,
      table_type_preference: item.table_type_preference,
      duration_minutes: item.duration_minutes,
      assigned_table_id: item.assigned_table_id,
      created_by: item.created_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
      confirmed_at: item.confirmed_at,
      cancelled_at: item.cancelled_at,
      cancellation_reason: item.cancellation_reason,
      reminder_sent: item.reminder_sent,
      notes: item.notes,
      source: item.source
    }));
  }

  // Enviar email de confirmación
  private async sendConfirmationEmail(reservation: Reservation): Promise<void> {
    try {
      const config = await this.getRestaurantConfig(reservation.restaurant_id);
      
      const emailData = {
        to: reservation.customer_email,
        customerName: reservation.customer_name,
        reservationId: reservation.id,
        restaurantName: config.name,
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        guests: reservation.guests,
        phone: reservation.customer_phone,
        specialRequests: reservation.special_requests,
        assignedTable: reservation.assigned_table_id,
        confirmationUrl: `${window.location.origin}/reservation/${reservation.id}`,
        cancellationUrl: `${window.location.origin}/cancel/${reservation.id}`
      };

      const result = await emailService.sendConfirmationEmail(emailData);
      
      if (result.success) {
        console.log(`✅ Email de confirmación enviado exitosamente a ${reservation.customer_email}`);
      } else {
        console.error(`❌ Error enviando email de confirmación: ${result.error}`);
      }
    } catch (error) {
      console.error('Error en sendConfirmationEmail:', error);
    }
  }

  // Programar email recordatorio
  private scheduleReminderEmail(reservation: Reservation): void {
    try {
      const emailData = {
        to: reservation.customer_email,
        customerName: reservation.customer_name,
        reservationId: reservation.id,
        restaurantName: DEFAULT_CONFIG.name, // TODO: usar configuración real
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        guests: reservation.guests,
        phone: reservation.customer_phone,
        specialRequests: reservation.special_requests,
        assignedTable: reservation.assigned_table_id
      };

      emailService.scheduleReminderEmail(emailData);
      console.log(`📅 Recordatorio programado para ${reservation.customer_name} - ${reservation.reservation_date}`);
    } catch (error) {
      console.error('Error programando recordatorio:', error);
    }
  }

  // Enviar email de modificación
  private async sendModificationEmail(reservation: Reservation): Promise<void> {
    try {
      const config = await this.getRestaurantConfig(reservation.restaurant_id);
      
      const emailData = {
        to: reservation.customer_email,
        customerName: reservation.customer_name,
        reservationId: reservation.id,
        restaurantName: config.name,
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        guests: reservation.guests,
        phone: reservation.customer_phone,
        specialRequests: reservation.special_requests,
        assignedTable: reservation.assigned_table_id
      };

      const result = await emailService.sendModificationEmail(emailData);
      
      if (result.success) {
        console.log(`✅ Email de modificación enviado exitosamente a ${reservation.customer_email}`);
      } else {
        console.error(`❌ Error enviando email de modificación: ${result.error}`);
      }
    } catch (error) {
      console.error('Error en sendModificationEmail:', error);
    }
  }

  // Manejar emails por cambio de estado
  private async handleStatusChangeEmail(
    reservation: Reservation, 
    oldStatus: Reservation['status'], 
    newStatus: Reservation['status']
  ): Promise<void> {
    try {
      // Solo enviar email si el cambio es significativo
      if (oldStatus === 'pending' && newStatus === 'confirmed') {
        // Reserva confirmada - enviar confirmación
        await this.sendConfirmationEmail(reservation);
      } else if (newStatus === 'cancelled') {
        // Reserva cancelada - enviar cancelación
        const config = await this.getRestaurantConfig(reservation.restaurant_id);
        
        const emailData = {
          to: reservation.customer_email,
          customerName: reservation.customer_name,
          reservationId: reservation.id,
          restaurantName: config.name,
          date: reservation.reservation_date,
          time: reservation.reservation_time,
          guests: reservation.guests,
          phone: reservation.customer_phone
        };

        const result = await emailService.sendCancellationEmail(emailData);
        
        if (result.success) {
          console.log(`✅ Email de cancelación enviado exitosamente a ${reservation.customer_email}`);
        } else {
          console.error(`❌ Error enviando email de cancelación: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error en handleStatusChangeEmail:', error);
    }
  }

  // Verificar si hay cambios significativos
  private hasSignificantChanges(oldReservation: Reservation, newReservation: Reservation): boolean {
    return (
      oldReservation.reservation_date !== newReservation.reservation_date ||
      oldReservation.reservation_time !== newReservation.reservation_time ||
      oldReservation.guests !== newReservation.guests ||
      oldReservation.assigned_table_id !== newReservation.assigned_table_id
    );
  }

  // Obtener historial de emails para una reserva
  getEmailHistoryForReservation(reservationId: string): any[] {
    const emailHistory = emailService.getEmailHistory();
    return emailHistory.filter(log => log.reservationId === reservationId);
  }

  // Reenviar email de confirmación
  async resendConfirmationEmail(reservationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (error || !data) {
        return { success: false, error: 'Reserva no encontrada' };
      }

      const reservation = this.mapSupabaseToReservation([data])[0];
      await this.sendConfirmationEmail(reservation);
      return { success: true };
    } catch (error) {
      console.error('Error en resendConfirmationEmail:', error);
      return { success: false, error: 'Error reenviando email' };
    }
  }

  // Enviar recordatorio manual
  async sendManualReminder(reservationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (error || !data) {
        return { success: false, error: 'Reserva no encontrada' };
      }

      const reservation = this.mapSupabaseToReservation([data])[0];
      const config = await this.getRestaurantConfig(reservation.restaurant_id);

      const emailData = {
        to: reservation.customer_email,
        customerName: reservation.customer_name,
        reservationId: reservation.id,
        restaurantName: config.name,
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        guests: reservation.guests,
        phone: reservation.customer_phone,
        specialRequests: reservation.special_requests,
        assignedTable: reservation.assigned_table_id
      };

      const result = await emailService.sendReminderEmail(emailData);
      return result;
    } catch (error) {
      console.error('Error en sendManualReminder:', error);
      return { success: false, error: 'Error enviando recordatorio' };
    }
  }

  // Métodos de conveniencia para mantener compatibilidad con código existente
  // Estos métodos usan un restaurant_id por defecto

  // Obtener todas las reservas (usando restaurant_id por defecto)
  async getAllReservationsDefault(): Promise<Reservation[]> {
    return this.getAllReservations('default-restaurant-id');
  }

  // Guardar reserva (usando restaurant_id por defecto)
  async saveReservationDefault(reservation: Omit<Reservation, 'id' | 'created_at'>): Promise<Reservation> {
    // Agregar restaurant_id por defecto si no está presente
    const reservationWithRestaurant = {
      ...reservation,
      restaurant_id: reservation.restaurant_id || 'default-restaurant-id'
    };
    return this.saveReservation(reservationWithRestaurant);
  }

  // Obtener reservas por fecha (usando restaurant_id por defecto)
  async getReservationsByDateDefault(date: string): Promise<Reservation[]> {
    return this.getReservationsByDate('default-restaurant-id', date);
  }

  // Verificar disponibilidad (usando restaurant_id por defecto)
  async checkAvailabilityDefault(date: string, time: string, guests: number): Promise<boolean> {
    return this.checkAvailability('default-restaurant-id', date, time, guests);
  }

  // Obtener horarios disponibles (usando restaurant_id por defecto)
  async getAvailableTimeSlotsDefault(date: string): Promise<TimeSlot[]> {
    return this.getAvailableTimeSlots('default-restaurant-id', date);
  }

  // Obtener reservas de hoy (usando restaurant_id por defecto)
  async getTodayReservationsDefault(): Promise<Reservation[]> {
    return this.getTodayReservations('default-restaurant-id');
  }

  // Buscar reservas (usando restaurant_id por defecto)
  async searchReservationsDefault(query: string): Promise<Reservation[]> {
    return this.searchReservations('default-restaurant-id', query);
  }

  // Obtener estadísticas (usando restaurant_id por defecto)
  async getReservationStatsDefault(startDate: string, endDate: string) {
    return this.getReservationStats('default-restaurant-id', startDate, endDate);
  }

  // Verificar conflictos de tiempo (usando restaurant_id por defecto)
  async checkTimeConflictsDefault(date: string, time: string, duration: number, excludeId?: string): Promise<boolean> {
    return this.checkTimeConflicts('default-restaurant-id', date, time, duration, excludeId);
  }

  // Inicializar recordatorios (usando restaurant_id por defecto)
  async initializeReminderCheckDefault(): Promise<void> {
    return this.initializeReminderCheck('default-restaurant-id');
  }
}

export const reservationService = new ReservationService();