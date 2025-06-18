import { Reservation, TimeSlot, RestaurantConfig } from '../types';
import { format, parseISO, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { emailService } from './emailService';
import { supabase } from '../utils/supabase';

// Configuración del restaurante
const restaurantConfig: RestaurantConfig = {
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

// ID del restaurante por defecto (en producción esto vendría del usuario autenticado)
const DEFAULT_RESTAURANT_ID = 'default-restaurant-id';

class ReservationService {
  // Obtener todas las reservas
  async getAllReservations(): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', DEFAULT_RESTAURANT_ID)
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true });

      if (error) {
        console.error('Error obteniendo reservas:', error);
        return [];
      }

      return this.mapSupabaseToReservation(data || []);
    } catch (error) {
      console.error('Error en getAllReservations:', error);
      return [];
    }
  }

  // Guardar reserva
  async saveReservation(reservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> {
    try {
      // Mapear los datos al formato de Supabase
      const supabaseReservation = {
        restaurant_id: DEFAULT_RESTAURANT_ID,
        customer_name: reservation.customerName,
        customer_email: reservation.email,
        customer_phone: reservation.phone,
        reservation_date: reservation.date,
        reservation_time: reservation.time,
        guests: reservation.guests,
        status: reservation.status || 'confirmed',
        special_requests: reservation.specialRequests || null,
        table_id: reservation.assignedTable || null,
        duration: reservation.duration || 120,
        source: reservation.createdBy === 'manager' ? 'manual' : 'online',
        created_by: null // Se puede vincular al usuario autenticado en el futuro
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

      // Mapear las actualizaciones al formato de Supabase
      const supabaseUpdates: any = {};
      
      if (updates.customerName !== undefined) supabaseUpdates.customer_name = updates.customerName;
      if (updates.email !== undefined) supabaseUpdates.customer_email = updates.email;
      if (updates.phone !== undefined) supabaseUpdates.customer_phone = updates.phone;
      if (updates.date !== undefined) supabaseUpdates.reservation_date = updates.date;
      if (updates.time !== undefined) supabaseUpdates.reservation_time = updates.time;
      if (updates.guests !== undefined) supabaseUpdates.guests = updates.guests;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.specialRequests !== undefined) supabaseUpdates.special_requests = updates.specialRequests;
      if (updates.assignedTable !== undefined) supabaseUpdates.table_id = updates.assignedTable;
      if (updates.duration !== undefined) supabaseUpdates.duration = updates.duration;

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

  // Obtener reservas por fecha
  async getReservationsByDate(date: string): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', DEFAULT_RESTAURANT_ID)
        .eq('reservation_date', date)
        .order('reservation_time', { ascending: true });

      if (error) {
        console.error('Error obteniendo reservas por fecha:', error);
        return [];
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

  // Generar horarios disponibles para una fecha
  async getAvailableTimeSlots(date: string): Promise<TimeSlot[]> {
    try {
      const reservations = await this.getReservationsByDate(date);
      const slots: TimeSlot[] = [];
      
      const startTime = restaurantConfig.operatingHours[0].start;
      const endTime = restaurantConfig.operatingHours[0].end;
      
      let currentTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(`${date}T${endTime}:00`);
      
      while (isBefore(currentTime, endDateTime)) {
        const timeString = format(currentTime, 'HH:mm');
        const reservationsAtTime = reservations.filter(r => r.time === timeString && r.status !== 'cancelled');
        const totalGuests = reservationsAtTime.reduce((sum, r) => sum + r.guests, 0);
        
        slots.push({
          time: timeString,
          available: totalGuests < restaurantConfig.maxCapacityPerSlot,
          maxCapacity: restaurantConfig.maxCapacityPerSlot,
          currentReservations: totalGuests
        });
        
        currentTime = addMinutes(currentTime, restaurantConfig.timeSlotDuration);
      }
      
      return slots;
    } catch (error) {
      console.error('Error en getAvailableTimeSlots:', error);
      return [];
    }
  }

  // Validar disponibilidad
  async checkAvailability(date: string, time: string, guests: number): Promise<boolean> {
    try {
      const reservations = await this.getReservationsByDate(date);
      const reservationsAtTime = reservations.filter(r => r.time === time && r.status !== 'cancelled');
      const totalGuests = reservationsAtTime.reduce((sum, r) => sum + r.guests, 0);
      
      return (totalGuests + guests) <= restaurantConfig.maxCapacityPerSlot;
    } catch (error) {
      console.error('Error en checkAvailability:', error);
      return false;
    }
  }

  // Obtener reservas del día actual
  async getTodayReservations(): Promise<Reservation[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.getReservationsByDate(today);
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

  // Buscar reservas
  async searchReservations(query: string): Promise<Reservation[]> {
    try {
      const lowerQuery = query.toLowerCase();
      
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', DEFAULT_RESTAURANT_ID)
        .or(`customer_name.ilike.%${query}%,customer_email.ilike.%${query}%,customer_phone.like.%${query}%,id.ilike.%${query}%`);

      if (error) {
        console.error('Error buscando reservas:', error);
        return [];
      }

      return this.mapSupabaseToReservation(data || []);
    } catch (error) {
      console.error('Error en searchReservations:', error);
      return [];
    }
  }

  // Obtener estadísticas de reservas
  async getReservationStats(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', DEFAULT_RESTAURANT_ID)
        .gte('reservation_date', startDate)
        .lte('reservation_date', endDate);

      if (error) {
        console.error('Error obteniendo estadísticas:', error);
        return {
          total: 0,
          confirmed: 0,
          pending: 0,
          cancelled: 0,
          totalGuests: 0,
          averagePartySize: 0
        };
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

  // Mapear datos de Supabase al formato de la aplicación
  private mapSupabaseToReservation(supabaseData: any[]): Reservation[] {
    return supabaseData.map(item => ({
      id: item.id,
      customerName: item.customer_name,
      email: item.customer_email,
      phone: item.customer_phone,
      date: item.reservation_date,
      time: item.reservation_time,
      guests: item.guests,
      status: item.status,
      createdAt: item.created_at,
      specialRequests: item.special_requests,
      tableType: item.table_type,
      duration: item.duration,
      assignedTable: item.table_id,
      createdBy: item.source === 'manual' ? 'manager' : 'customer'
    }));
  }

  // Enviar email de confirmación
  private async sendConfirmationEmail(reservation: Reservation): Promise<void> {
    try {
      const emailData = {
        to: reservation.email,
        customerName: reservation.customerName,
        reservationId: reservation.id,
        restaurantName: restaurantConfig.name,
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        phone: reservation.phone,
        specialRequests: reservation.specialRequests,
        assignedTable: reservation.assignedTable,
        confirmationUrl: `${window.location.origin}/reservation/${reservation.id}`,
        cancellationUrl: `${window.location.origin}/cancel/${reservation.id}`
      };

      const result = await emailService.sendConfirmationEmail(emailData);
      
      if (result.success) {
        console.log(`✅ Email de confirmación enviado exitosamente a ${reservation.email}`);
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
        to: reservation.email,
        customerName: reservation.customerName,
        reservationId: reservation.id,
        restaurantName: restaurantConfig.name,
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        phone: reservation.phone,
        specialRequests: reservation.specialRequests,
        assignedTable: reservation.assignedTable
      };

      emailService.scheduleReminderEmail(emailData);
      console.log(`📅 Recordatorio programado para ${reservation.customerName} - ${reservation.date}`);
    } catch (error) {
      console.error('Error programando recordatorio:', error);
    }
  }

  // Enviar email de modificación
  private async sendModificationEmail(reservation: Reservation): Promise<void> {
    try {
      const emailData = {
        to: reservation.email,
        customerName: reservation.customerName,
        reservationId: reservation.id,
        restaurantName: restaurantConfig.name,
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        phone: reservation.phone,
        specialRequests: reservation.specialRequests,
        assignedTable: reservation.assignedTable
      };

      const result = await emailService.sendModificationEmail(emailData);
      
      if (result.success) {
        console.log(`✅ Email de modificación enviado exitosamente a ${reservation.email}`);
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
        const emailData = {
          to: reservation.email,
          customerName: reservation.customerName,
          reservationId: reservation.id,
          restaurantName: restaurantConfig.name,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.guests,
          phone: reservation.phone
        };

        const result = await emailService.sendCancellationEmail(emailData);
        
        if (result.success) {
          console.log(`✅ Email de cancelación enviado exitosamente a ${reservation.email}`);
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
      oldReservation.date !== newReservation.date ||
      oldReservation.time !== newReservation.time ||
      oldReservation.guests !== newReservation.guests ||
      oldReservation.assignedTable !== newReservation.assignedTable
    );
  }

  // Inicializar verificación de recordatorios pendientes
  async initializeReminderCheck(): Promise<void> {
    try {
      await emailService.checkAndSendPendingReminders();
      
      // Configurar verificación periódica cada hora
      setInterval(async () => {
        await emailService.checkAndSendPendingReminders();
      }, 60 * 60 * 1000); // 1 hora
      
      console.log('✅ Sistema de recordatorios inicializado');
    } catch (error) {
      console.error('Error inicializando sistema de recordatorios:', error);
    }
  }

  // Obtener configuración del restaurante
  getRestaurantConfig(): RestaurantConfig {
    return restaurantConfig;
  }

  // Validar conflictos de horario
  async checkTimeConflicts(date: string, time: string, duration: number, excludeId?: string): Promise<boolean> {
    try {
      const reservations = await this.getReservationsByDate(date);
      const startTime = new Date(`${date}T${time}:00`);
      const endTime = addMinutes(startTime, duration);
      
      return reservations.some(reservation => {
        if (excludeId && reservation.id === excludeId) return false;
        if (reservation.status === 'cancelled') return false;
        
        const resStartTime = new Date(`${reservation.date}T${reservation.time}:00`);
        const resEndTime = addMinutes(resStartTime, reservation.duration || 120);
        
        // Verificar solapamiento
        return (startTime < resEndTime && endTime > resStartTime);
      });
    } catch (error) {
      console.error('Error en checkTimeConflicts:', error);
      return false;
    }
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

      const emailData = {
        to: reservation.email,
        customerName: reservation.customerName,
        reservationId: reservation.id,
        restaurantName: restaurantConfig.name,
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        phone: reservation.phone,
        specialRequests: reservation.specialRequests,
        assignedTable: reservation.assignedTable
      };

      const result = await emailService.sendReminderEmail(emailData);
      return result;
    } catch (error) {
      console.error('Error en sendManualReminder:', error);
      return { success: false, error: 'Error enviando recordatorio' };
    }
  }

  // Obtener ID del restaurante (para uso futuro con autenticación)
  private async getRestaurantId(): Promise<string> {
    // En el futuro, esto obtendrá el restaurant_id del usuario autenticado
    // Por ahora, usamos un ID por defecto
    return DEFAULT_RESTAURANT_ID;
  }
}

export const reservationService = new ReservationService();