import { Table } from '../types';

class TableService {
  private tablesKey = 'restaurant_tables';

  // Obtener todas las mesas
  getAllTables(): Table[] {
    const data = localStorage.getItem(this.tablesKey);
    return data ? JSON.parse(data) : this.generateSampleTables();
  }

  // Obtener mesas disponibles para una fecha, hora y número de comensales específicos
  getAvailableTables(
    date: string, 
    time: string, 
    guests: number, 
    duration: number = 120,
    tableType: string = 'any'
  ): Table[] {
    const allTables = this.getAllTables();
    
    // Filtrar por capacidad mínima
    let availableTables = allTables.filter(table => table.capacity >= guests);
    
    // Filtrar por tipo de mesa si se especifica
    if (tableType !== 'any') {
      availableTables = availableTables.filter(table => 
        table.type.toLowerCase().includes(tableType.toLowerCase())
      );
    }
    
    // Simular verificación de disponibilidad
    // En una implementación real, esto verificaría contra reservas existentes
    const occupiedTables = this.getOccupiedTables(date, time, duration);
    availableTables = availableTables.filter(table => 
      !occupiedTables.includes(table.id)
    );
    
    return availableTables.sort((a, b) => {
      // Priorizar mesas con capacidad más cercana al número de comensales
      const diffA = Math.abs(a.capacity - guests);
      const diffB = Math.abs(b.capacity - guests);
      return diffA - diffB;
    });
  }

  // Simular mesas ocupadas para una fecha y hora específicas
  private getOccupiedTables(date: string, time: string, duration: number): string[] {
    // En una implementación real, esto consultaría las reservas existentes
    // Por ahora, simulamos algunas mesas ocupadas
    const mockOccupiedTables = ['1', '5', '8']; // IDs de mesas ocupadas
    
    // Simular lógica más compleja basada en hora y duración
    if (time >= '20:00') {
      mockOccupiedTables.push('3', '7');
    }
    
    return mockOccupiedTables;
  }

  // Reservar una mesa específica
  reserveTable(tableId: string, date: string, time: string, duration: number): boolean {
    // En una implementación real, esto actualizaría la base de datos
    console.log(`Mesa ${tableId} reservada para ${date} a las ${time} por ${duration} minutos`);
    return true;
  }

  // Generar datos de ejemplo para las mesas
  private generateSampleTables(): Table[] {
    const sampleTables: Table[] = [
      {
        id: '1',
        number: '1',
        capacity: 2,
        type: 'Ventana',
        features: 'Vista al jardín',
        location: 'Planta baja'
      },
      {
        id: '2',
        number: '2',
        capacity: 4,
        type: 'Estándar',
        features: 'Mesa cuadrada',
        location: 'Planta baja'
      },
      {
        id: '3',
        number: '3',
        capacity: 6,
        type: 'Familiar',
        features: 'Mesa redonda',
        location: 'Planta baja'
      },
      {
        id: '4',
        number: '4',
        capacity: 2,
        type: 'Terraza',
        features: 'Al aire libre',
        location: 'Terraza'
      },
      {
        id: '5',
        number: '5',
        capacity: 4,
        type: 'Terraza',
        features: 'Vista panorámica',
        location: 'Terraza'
      },
      {
        id: '6',
        number: '6',
        capacity: 8,
        type: 'Privada',
        features: 'Zona reservada',
        location: 'Sala privada'
      },
      {
        id: '7',
        number: '7',
        capacity: 3,
        type: 'Barra',
        features: 'Vista a la cocina',
        location: 'Barra'
      },
      {
        id: '8',
        number: '8',
        capacity: 4,
        type: 'Ventana',
        features: 'Vista a la calle',
        location: 'Planta baja'
      },
      {
        id: '9',
        number: '9',
        capacity: 2,
        type: 'Íntima',
        features: 'Rincón acogedor',
        location: 'Planta baja'
      },
      {
        id: '10',
        number: '10',
        capacity: 6,
        type: 'Familiar',
        features: 'Mesa extensible',
        location: 'Planta baja'
      }
    ];

    localStorage.setItem(this.tablesKey, JSON.stringify(sampleTables));
    return sampleTables;
  }

  // Obtener información de una mesa específica
  getTableById(tableId: string): Table | null {
    const tables = this.getAllTables();
    return tables.find(table => table.id === tableId) || null;
  }

  // Obtener estadísticas de ocupación
  getOccupancyStats(date: string): {
    totalTables: number;
    occupiedTables: number;
    availableTables: number;
    occupancyRate: number;
  } {
    const allTables = this.getAllTables();
    const occupiedTables = this.getOccupiedTables(date, '20:00', 120); // Hora pico
    
    return {
      totalTables: allTables.length,
      occupiedTables: occupiedTables.length,
      availableTables: allTables.length - occupiedTables.length,
      occupancyRate: (occupiedTables.length / allTables.length) * 100
    };
  }
}

export const tableService = new TableService();