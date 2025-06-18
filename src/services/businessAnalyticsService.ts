import { Reservation } from '../types';
import { reservationService } from './reservationService';
import { format, subMonths, subQuarters, subYears, parseISO, differenceInDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';

interface PeriodStats {
  period: string;
  reservations: number;
  guests: number;
  revenue: number;
  growth: number;
}

interface CustomerAnalytics {
  email: string;
  name: string;
  totalReservations: number;
  totalGuests: number;
  estimatedValue: number;
  lastVisit: string;
  frequency: number;
  category: 'VIP' | 'Regular' | 'Ocasional';
  daysSinceLastVisit: number;
  isInactive: boolean;
  phone?: string;
}

class BusinessAnalyticsService {
  private readonly AVERAGE_SPEND_PER_PERSON = 35; // €35 por persona promedio
  private readonly INACTIVE_THRESHOLD_DAYS = 90; // 3 meses

  // Obtener estadísticas del dashboard por período
  async getDashboardStats(
    timeRange: 'monthly' | 'quarterly' | 'yearly',
    customDateRange: { start: string; end: string }
  ): Promise<PeriodStats[]> {
    const allReservations = reservationService.getAllReservations()
      .filter(r => r.status !== 'cancelled');

    const stats: PeriodStats[] = [];
    const now = new Date();

    if (timeRange === 'monthly') {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i);
        const startDate = startOfMonth(date);
        const endDate = endOfMonth(date);
        
        const periodReservations = allReservations.filter(r => {
          const reservationDate = parseISO(r.date);
          return reservationDate >= startDate && reservationDate <= endDate;
        });

        const periodStats = this.calculatePeriodStats(
          format(date, 'MMM yyyy', { locale: es }),
          periodReservations,
          i === 11 ? [] : stats[stats.length - 1] ? [stats[stats.length - 1]] : []
        );

        stats.push(periodStats);
      }
    } else if (timeRange === 'quarterly') {
      // Últimos 4 trimestres
      for (let i = 3; i >= 0; i--) {
        const date = subQuarters(now, i);
        const startDate = startOfQuarter(date);
        const endDate = endOfQuarter(date);
        
        const periodReservations = allReservations.filter(r => {
          const reservationDate = parseISO(r.date);
          return reservationDate >= startDate && reservationDate <= endDate;
        });

        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const periodStats = this.calculatePeriodStats(
          `Q${quarter} ${date.getFullYear()}`,
          periodReservations,
          i === 3 ? [] : stats[stats.length - 1] ? [stats[stats.length - 1]] : []
        );

        stats.push(periodStats);
      }
    } else {
      // Últimos 3 años
      for (let i = 2; i >= 0; i--) {
        const date = subYears(now, i);
        const startDate = startOfYear(date);
        const endDate = endOfYear(date);
        
        const periodReservations = allReservations.filter(r => {
          const reservationDate = parseISO(r.date);
          return reservationDate >= startDate && reservationDate <= endDate;
        });

        const periodStats = this.calculatePeriodStats(
          date.getFullYear().toString(),
          periodReservations,
          i === 2 ? [] : stats[stats.length - 1] ? [stats[stats.length - 1]] : []
        );

        stats.push(periodStats);
      }
    }

    return stats;
  }

  // Calcular estadísticas de un período
  private calculatePeriodStats(
    period: string,
    reservations: Reservation[],
    previousPeriods: PeriodStats[]
  ): PeriodStats {
    const totalReservations = reservations.length;
    const totalGuests = reservations.reduce((sum, r) => sum + r.guests, 0);
    const estimatedRevenue = totalGuests * this.AVERAGE_SPEND_PER_PERSON;

    // Calcular crecimiento comparado con el período anterior
    let growth = 0;
    if (previousPeriods.length > 0) {
      const previousReservations = previousPeriods[previousPeriods.length - 1].reservations;
      if (previousReservations > 0) {
        growth = ((totalReservations - previousReservations) / previousReservations) * 100;
      }
    }

    return {
      period,
      reservations: totalReservations,
      guests: totalGuests,
      revenue: estimatedRevenue,
      growth
    };
  }

  // Obtener análisis de clientes
  async getCustomerAnalytics(): Promise<CustomerAnalytics[]> {
    const allReservations = reservationService.getAllReservations()
      .filter(r => r.status !== 'cancelled');

    // Agrupar reservas por cliente
    const customerMap = new Map<string, Reservation[]>();
    
    allReservations.forEach(reservation => {
      const key = reservation.email.toLowerCase();
      if (!customerMap.has(key)) {
        customerMap.set(key, []);
      }
      customerMap.get(key)!.push(reservation);
    });

    const customerAnalytics: CustomerAnalytics[] = [];

    customerMap.forEach((reservations, email) => {
      const sortedReservations = reservations.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const totalReservations = reservations.length;
      const totalGuests = reservations.reduce((sum, r) => sum + r.guests, 0);
      const estimatedValue = totalGuests * this.AVERAGE_SPEND_PER_PERSON;
      const lastVisit = sortedReservations[0].date;
      const daysSinceLastVisit = differenceInDays(new Date(), parseISO(lastVisit));
      
      // Calcular frecuencia promedio entre visitas
      let frequency = 0;
      if (reservations.length > 1) {
        const dates = sortedReservations.map(r => parseISO(r.date)).sort((a, b) => a.getTime() - b.getTime());
        const totalDays = differenceInDays(dates[dates.length - 1], dates[0]);
        frequency = totalDays / (dates.length - 1);
      }

      // Determinar categoría del cliente
      const yearlyReservations = this.getYearlyReservationCount(reservations);
      let category: 'VIP' | 'Regular' | 'Ocasional';
      
      if (yearlyReservations > 10) {
        category = 'VIP';
      } else if (yearlyReservations >= 5) {
        category = 'Regular';
      } else {
        category = 'Ocasional';
      }

      const isInactive = daysSinceLastVisit > this.INACTIVE_THRESHOLD_DAYS;

      customerAnalytics.push({
        email,
        name: sortedReservations[0].customerName,
        phone: sortedReservations[0].phone,
        totalReservations,
        totalGuests,
        estimatedValue,
        lastVisit,
        frequency: frequency || daysSinceLastVisit,
        category,
        daysSinceLastVisit,
        isInactive
      });
    });

    return customerAnalytics.sort((a, b) => b.totalReservations - a.totalReservations);
  }

  // Calcular reservas anuales (últimos 12 meses)
  private getYearlyReservationCount(reservations: Reservation[]): number {
    const oneYearAgo = subYears(new Date(), 1);
    return reservations.filter(r => parseISO(r.date) >= oneYearAgo).length;
  }

  // Calcular estadísticas totales
  calculateTotalStats(customers: CustomerAnalytics[], dashboardStats: PeriodStats[]) {
    const totalReservations = dashboardStats.reduce((sum, stat) => sum + stat.reservations, 0);
    const totalRevenue = dashboardStats.reduce((sum, stat) => sum + stat.revenue, 0);
    const averageReservationValue = totalReservations > 0 ? totalRevenue / totalReservations : 0;
    
    const totalCustomers = customers.length;
    const vipCustomers = customers.filter(c => c.category === 'VIP').length;
    const inactiveCustomers = customers.filter(c => c.isInactive).length;

    return {
      totalReservations,
      totalRevenue,
      averageReservationValue,
      totalCustomers,
      vipCustomers,
      inactiveCustomers
    };
  }

  // Exportar datos del dashboard
  exportDashboardData(stats: PeriodStats[], format: 'csv' | 'excel'): void {
    const headers = ['Período', 'Reservas', 'Comensales', 'Ingresos Estimados', 'Crecimiento (%)'];
    const rows = stats.map(stat => [
      stat.period,
      stat.reservations.toString(),
      stat.guests.toString(),
      stat.revenue.toFixed(2),
      stat.growth.toFixed(1)
    ]);

    this.downloadData(headers, rows, `dashboard-stats-${format}`, format);
  }

  // Exportar datos de clientes
  exportCustomerData(customers: CustomerAnalytics[], format: 'csv' | 'excel'): void {
    const headers = [
      'Nombre',
      'Email',
      'Teléfono',
      'Total Reservas',
      'Total Comensales',
      'Valor Estimado',
      'Última Visita',
      'Frecuencia (días)',
      'Categoría',
      'Días desde última visita',
      'Estado'
    ];

    const rows = customers.map(customer => [
      customer.name,
      customer.email,
      customer.phone || '',
      customer.totalReservations.toString(),
      customer.totalGuests.toString(),
      customer.estimatedValue.toFixed(2),
      customer.lastVisit,
      customer.frequency.toFixed(1),
      customer.category,
      customer.daysSinceLastVisit.toString(),
      customer.isInactive ? 'Inactivo' : 'Activo'
    ]);

    this.downloadData(headers, rows, `customer-analytics-${format}`, format);
  }

  // Función genérica para descargar datos
  private downloadData(headers: string[], rows: string[][], filename: string, format: 'csv' | 'excel'): void {
    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
    } else {
      // Para Excel, usamos el mismo formato CSV pero con extensión .xlsx
      // En una implementación real, usarías una librería como xlsx
      const csvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.xlsx`;
      link.click();
    }
  }

  // Obtener clientes inactivos
  getInactiveCustomers(customers: CustomerAnalytics[]): CustomerAnalytics[] {
    return customers.filter(customer => customer.isInactive);
  }

  // Obtener top clientes por valor
  getTopCustomersByValue(customers: CustomerAnalytics[], limit: number = 10): CustomerAnalytics[] {
    return customers
      .sort((a, b) => b.estimatedValue - a.estimatedValue)
      .slice(0, limit);
  }

  // Obtener estadísticas de fidelización
  getLoyaltyStats(customers: CustomerAnalytics[]) {
    const totalCustomers = customers.length;
    const vipCount = customers.filter(c => c.category === 'VIP').length;
    const regularCount = customers.filter(c => c.category === 'Regular').length;
    const occasionalCount = customers.filter(c => c.category === 'Ocasional').length;
    const inactiveCount = customers.filter(c => c.isInactive).length;

    return {
      total: totalCustomers,
      vip: {
        count: vipCount,
        percentage: totalCustomers > 0 ? (vipCount / totalCustomers) * 100 : 0
      },
      regular: {
        count: regularCount,
        percentage: totalCustomers > 0 ? (regularCount / totalCustomers) * 100 : 0
      },
      occasional: {
        count: occasionalCount,
        percentage: totalCustomers > 0 ? (occasionalCount / totalCustomers) * 100 : 0
      },
      inactive: {
        count: inactiveCount,
        percentage: totalCustomers > 0 ? (inactiveCount / totalCustomers) * 100 : 0
      }
    };
  }

  // Predecir próximas visitas basado en frecuencia
  predictNextVisits(customers: CustomerAnalytics[]): Array<{
    customer: CustomerAnalytics;
    predictedDate: string;
    confidence: 'high' | 'medium' | 'low';
  }> {
    return customers
      .filter(c => !c.isInactive && c.frequency > 0)
      .map(customer => {
        const lastVisitDate = parseISO(customer.lastVisit);
        const predictedDate = new Date(lastVisitDate.getTime() + (customer.frequency * 24 * 60 * 60 * 1000));
        
        // Determinar confianza basada en la regularidad del cliente
        let confidence: 'high' | 'medium' | 'low' = 'low';
        if (customer.category === 'VIP' && customer.totalReservations >= 10) {
          confidence = 'high';
        } else if (customer.category === 'Regular' && customer.totalReservations >= 5) {
          confidence = 'medium';
        }

        return {
          customer,
          predictedDate: format(predictedDate, 'yyyy-MM-dd'),
          confidence
        };
      })
      .sort((a, b) => new Date(a.predictedDate).getTime() - new Date(b.predictedDate).getTime());
  }
}

export const businessAnalyticsService = new BusinessAnalyticsService();