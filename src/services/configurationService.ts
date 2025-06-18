import { RestaurantConfig, TableLayout, ReservationRules, AnalyticsConfig } from '../types';

class ConfigurationService {
  private configKey = 'restaurant_config';
  private tableLayoutKey = 'restaurant_table_layout';
  private reservationRulesKey = 'restaurant_reservation_rules';
  private analyticsConfigKey = 'restaurant_analytics_config';

  // Configuration Management
  getConfiguration(): RestaurantConfig {
    const stored = localStorage.getItem(this.configKey);
    return stored ? JSON.parse(stored) : this.getDefaultConfiguration();
  }

  async saveConfiguration(config: RestaurantConfig): Promise<void> {
    localStorage.setItem(this.configKey, JSON.stringify(config));
    console.log('✅ Configuración guardada:', config);
  }

  getDefaultConfiguration(): RestaurantConfig {
    return {
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
  }

  // Table Layout Management
  getTableLayout(): TableLayout {
    const stored = localStorage.getItem(this.tableLayoutKey);
    return stored ? JSON.parse(stored) : this.getDefaultTableLayout();
  }

  async saveTableLayout(layout: TableLayout): Promise<void> {
    localStorage.setItem(this.tableLayoutKey, JSON.stringify(layout));
    console.log('✅ Layout de mesas guardado:', layout);
  }

  getDefaultTableLayout(): TableLayout {
    return {
      width: 800,
      height: 600,
      tables: [
        {
          id: 'table_1',
          number: '1',
          x: 50,
          y: 50,
          width: 60,
          height: 60,
          shape: 'square',
          capacity: 4,
          zone: 'interior',
          type: 'standard',
          features: []
        },
        {
          id: 'table_2',
          number: '2',
          x: 150,
          y: 50,
          width: 60,
          height: 60,
          shape: 'circle',
          capacity: 2,
          zone: 'interior',
          type: 'window',
          features: ['vista']
        },
        {
          id: 'table_3',
          number: '3',
          x: 250,
          y: 50,
          width: 80,
          height: 40,
          shape: 'rectangle',
          capacity: 6,
          zone: 'interior',
          type: 'standard',
          features: []
        },
        {
          id: 'table_4',
          number: '4',
          x: 50,
          y: 150,
          width: 60,
          height: 60,
          shape: 'square',
          capacity: 4,
          zone: 'exterior',
          type: 'standard',
          features: ['terraza']
        },
        {
          id: 'table_5',
          number: '5',
          x: 150,
          y: 150,
          width: 60,
          height: 60,
          shape: 'circle',
          capacity: 8,
          zone: 'vip',
          type: 'private',
          features: ['privada', 'premium']
        }
      ],
      zones: [
        { id: 'interior', name: 'Interior', color: '#475569' },
        { id: 'exterior', name: 'Exterior', color: '#059669' },
        { id: 'vip', name: 'VIP', color: '#7c3aed' },
        { id: 'bar', name: 'Barra', color: '#dc2626' }
      ]
    };
  }

  // Reservation Rules Management
  getReservationRules(): ReservationRules {
    const stored = localStorage.getItem(this.reservationRulesKey);
    return stored ? JSON.parse(stored) : this.getDefaultReservationRules();
  }

  async saveReservationRules(rules: ReservationRules): Promise<void> {
    localStorage.setItem(this.reservationRulesKey, JSON.stringify(rules));
    console.log('✅ Reglas de reserva guardadas:', rules);
  }

  getDefaultReservationRules(): ReservationRules {
    return {
      minAdvanceTime: '2h',
      maxAdvanceTime: '60d',
      cancellationPolicy: {
        freeUntil: '24h',
        lateFee: 50
      },
      requireDeposit: false,
      depositAmount: 20.00,
      depositRequiredForGroups: 6,
      specialDates: {
        enabled: true,
        extraDeposit: 10.00,
        dates: [
          '2024-12-24', // Nochebuena
          '2024-12-25', // Navidad
          '2024-12-31', // Nochevieja
          '2024-01-01', // Año Nuevo
          '2024-02-14', // San Valentín
        ]
      },
      tableRestrictions: {
        vipMinimumSpend: 100.00,
        windowTableSurcharge: 5.00
      }
    };
  }

  // Analytics Configuration Management
  getAnalyticsConfig(): AnalyticsConfig {
    const stored = localStorage.getItem(this.analyticsConfigKey);
    return stored ? JSON.parse(stored) : this.getDefaultAnalyticsConfig();
  }

  async saveAnalyticsConfig(config: AnalyticsConfig): Promise<void> {
    localStorage.setItem(this.analyticsConfigKey, JSON.stringify(config));
    console.log('✅ Configuración de analítica guardada:', config);
  }

  getDefaultAnalyticsConfig(): AnalyticsConfig {
    return {
      enableTracking: true,
      reportFrequency: 'weekly',
      metricsToTrack: [
        'occupancy_rate',
        'cancellation_rate',
        'no_show_rate',
        'average_party_size',
        'peak_hours',
        'popular_tables',
        'customer_frequency'
      ],
      alertThresholds: {
        lowOccupancy: 30,
        highCancellation: 20,
        highNoShow: 10
      },
      exportFormats: ['pdf', 'excel', 'csv'],
      autoReports: {
        daily: true,
        weekly: true,
        monthly: true
      }
    };
  }

  // Utility Methods
  validateConfiguration(config: RestaurantConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.maxTotalCapacity <= 0) {
      errors.push('La capacidad total debe ser mayor a 0');
    }

    if (config.maxGuestsPerReservation <= 0) {
      errors.push('El máximo de comensales por reserva debe ser mayor a 0');
    }

    if (config.timeSlotDuration < 15 || config.timeSlotDuration > 120) {
      errors.push('La duración del slot debe estar entre 15 y 120 minutos');
    }

    if (config.advanceBookingDays < 1 || config.advanceBookingDays > 365) {
      errors.push('Los días de reserva anticipada deben estar entre 1 y 365');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateTableLayout(layout: TableLayout): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (layout.tables.length === 0) {
      errors.push('Debe haber al menos una mesa');
    }

    // Verificar números de mesa únicos
    const tableNumbers = layout.tables.map(t => t.number);
    const uniqueNumbers = new Set(tableNumbers);
    if (tableNumbers.length !== uniqueNumbers.size) {
      errors.push('Los números de mesa deben ser únicos');
    }

    // Verificar capacidades válidas
    const invalidCapacities = layout.tables.filter(t => t.capacity < 1 || t.capacity > 20);
    if (invalidCapacities.length > 0) {
      errors.push('Las capacidades de mesa deben estar entre 1 y 20');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Export/Import Configuration
  exportConfiguration(): string {
    const fullConfig = {
      config: this.getConfiguration(),
      tableLayout: this.getTableLayout(),
      reservationRules: this.getReservationRules(),
      analyticsConfig: this.getAnalyticsConfig(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(fullConfig, null, 2);
  }

  async importConfiguration(configString: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fullConfig = JSON.parse(configString);

      // Validar estructura
      if (!fullConfig.config || !fullConfig.tableLayout || !fullConfig.reservationRules) {
        return { success: false, error: 'Formato de configuración inválido' };
      }

      // Validar configuración
      const configValidation = this.validateConfiguration(fullConfig.config);
      if (!configValidation.valid) {
        return { success: false, error: configValidation.errors.join(', ') };
      }

      // Validar layout de mesas
      const layoutValidation = this.validateTableLayout(fullConfig.tableLayout);
      if (!layoutValidation.valid) {
        return { success: false, error: layoutValidation.errors.join(', ') };
      }

      // Guardar configuración
      await this.saveConfiguration(fullConfig.config);
      await this.saveTableLayout(fullConfig.tableLayout);
      await this.saveReservationRules(fullConfig.reservationRules);
      
      if (fullConfig.analyticsConfig) {
        await this.saveAnalyticsConfig(fullConfig.analyticsConfig);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al procesar el archivo de configuración' };
    }
  }

  // Reset to defaults
  async resetToDefaults(): Promise<void> {
    await this.saveConfiguration(this.getDefaultConfiguration());
    await this.saveTableLayout(this.getDefaultTableLayout());
    await this.saveReservationRules(this.getDefaultReservationRules());
    await this.saveAnalyticsConfig(this.getDefaultAnalyticsConfig());
    console.log('✅ Configuración restablecida a valores por defecto');
  }
}

export const configurationService = new ConfigurationService();