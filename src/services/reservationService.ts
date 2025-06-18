import { Reservation, TimeSlot, RestaurantConfig } from '../types';
import { format, parseISO, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { emailService } from './emailService';

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

// Simulación de base de datos con localStorage
class ReservationService {
  private storageKey = 'restaurant_reservations';

  // Obtener todas las reservas
  getAllReservations(): Reservation[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  // Guardar reserva
  async saveReservation(reservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> {
    const reservations = this.getAllReservations();
    const newReservation: Reservation = {
      ...reservation,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      status: reservation.status || 'confirmed'
    };
    
    reservations.push(newReservation);
    localStorage.setItem(this.storageKey, JSON.stringify(reservations));
    
    // Enviar email de confirmación inmediato
    await this.sendConfirmationEmail(newReservation);
    
    // Programar email recordatorio para el día de la reserva
    this.scheduleReminderEmail(newReservation);
    
    return newReservation;
  }

  // Actualizar reserva existente
  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    const reservations = this.getAllReservations();
    const index = reservations.findIndex(r => r.id === id);
    
    if (index !== -1) {
      const oldReservation = { ...reservations[index] };
      reservations[index] = { ...reservations[index], ...updates };
      localStorage.setItem(this.storageKey, JSON.stringify(reservations));
      
      const updatedReservation = reservations[index];
      
      // Verificar si hubo cambios significativos para enviar email
      const significantChanges = this.hasSignificantChanges(oldReservation, updatedReservation);
      
      if (significantChanges) {
        await this.sendModificationEmail(updatedReservation);
      }
      
      return updatedReservation;
    }
    
    return null;
  }

  // Obtener reservas por fecha
  getReservationsByDate(date: string): Reservation[] {
    const reservations = this.getAllReservations();
    return reservations.filter(reservation => reservation.date === date);
  }

  // Generar horarios disponibles para una fecha
  getAvailableTimeSlots(date: string): TimeSlot[] {
    const reservations = this.getReservationsByDate(date);
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
  }

  // Validar disponibilidad
  checkAvailability(date: string, time: string, guests: number): boolean {
    const reservations = this.getReservationsByDate(date);
    const reservationsAtTime = reservations.filter(r => r.time === time && r.status !== 'cancelled');
    const totalGuests = reservationsAtTime.reduce((sum, r) => sum + r.guests, 0);
    
    return (totalGuests + guests) <= restaurantConfig.maxCapacityPerSlot;
  }

  // Obtener reservas del día actual
  getTodayReservations(): Reservation[] {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.getReservationsByDate(today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  // Actualizar estado de reserva
  async updateReservationStatus(id: string, status: Reservation['status']): Promise<boolean> {
    const reservations = this.getAllReservations();
    const index = reservations.findIndex(r => r.id === id);
    
    if (index !== -1) {
      const oldStatus = reservations[index].status;
      reservations[index].status = status;
      localStorage.setItem(this.storageKey, JSON.stringify(reservations));
      
      // Enviar email según el cambio de estado
      if (oldStatus !== status) {
        await this.handleStatusChangeEmail(reservations[index], oldStatus, status);
      }
      
      return true;
    }
    
    return false;
  }

  // Eliminar reserva
  deleteReservation(id: string): boolean {
    const reservations = this.getAllReservations();
    const filteredReservations = reservations.filter(r => r.id !== id);
    
    if (filteredReservations.length < reservations.length) {
      localStorage.setItem(this.storageKey, JSON.stringify(filteredReservations));
      return true;
    }
    
    return false;
  }

  // Buscar reservas
  searchReservations(query: string): Reservation[] {
    const reservations = this.getAllReservations();
    const lowerQuery = query.toLowerCase();
    
    return reservations.filter(reservation =>
      reservation.customerName.toLowerCase().includes(lowerQuery) ||
      reservation.email.toLowerCase().includes(lowerQuery) ||
      reservation.phone.includes(query) ||
      reservation.id.toLowerCase().includes(lowerQuery)
    );
  }

  // Obtener estadísticas de reservas
  getReservationStats(startDate: string, endDate: string) {
    const reservations = this.getAllReservations().filter(r => 
      r.date >= startDate && r.date <= endDate
    );
    
    return {
      total: reservations.length,
      confirmed: reservations.filter(r => r.status === 'confirmed').length,
      pending: reservations.filter(r => r.status === 'pending').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
      totalGuests: reservations.reduce((sum, r) => sum + r.guests, 0),
      averagePartySize: reservations.length > 0 ? 
        reservations.reduce((sum, r) => sum + r.guests, 0) / reservations.length : 0
    };
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

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Obtener configuración del restaurante
  getRestaurantConfig(): RestaurantConfig {
    return restaurantConfig;
  }

  // Validar conflictos de horario
  checkTimeConflicts(date: string, time: string, duration: number, excludeId?: string): boolean {
    const reservations = this.getReservationsByDate(date);
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
  }

  // Obtener historial de emails para una reserva
  getEmailHistoryForReservation(reservationId: string): any[] {
    const emailHistory = emailService.getEmailHistory();
    return emailHistory.filter(log => log.reservationId === reservationId);
  }

  // Reenviar email de confirmación
  async resendConfirmationEmail(reservationId: string): Promise<{ success: boolean; error?: string }> {
    const reservation = this.getAllReservations().find(r => r.id === reservationId);
    
    if (!reservation) {
      return { success: false, error: 'Reserva no encontrada' };
    }

    try {
      await this.sendConfirmationEmail(reservation);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error reenviando email' };
    }
  }

  // Enviar recordatorio manual
  async sendManualReminder(reservationId: string): Promise<{ success: boolean; error?: string }> {
    const reservation = this.getAllReservations().find(r => r.id === reservationId);
    
    if (!reservation) {
      return { success: false, error: 'Reserva no encontrada' };
    }

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

      const result = await emailService.sendReminderEmail(emailData);
      return result;
    } catch (error) {
      return { success: false, error: 'Error enviando recordatorio' };
    }
  }
}

export const reservationService = new ReservationService();