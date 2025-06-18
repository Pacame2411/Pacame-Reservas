import { Order, InventoryItem, DashboardStats, OrderItem } from '../types';
import { reservationService } from './reservationService';
import { format } from 'date-fns';

class DashboardService {
  private ordersKey = 'restaurant_orders';
  private inventoryKey = 'restaurant_inventory';

  // Obtener estadísticas del dashboard
  getDashboardStats(): DashboardStats {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayReservations = reservationService.getReservationsByDate(today);
    const todayOrders = this.getOrdersByDate(today);
    
    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = todayOrders.length > 0 ? totalRevenue / todayOrders.length : 0;
    
    // Calcular tasa de ocupación (simplificado)
    const totalSlots = 22; // 11 horas * 2 slots por hora
    const reservedSlots = todayReservations.filter(r => r.status === 'confirmed').length;
    const occupancyRate = (reservedSlots / totalSlots) * 100;

    return {
      todayReservations: todayReservations.length,
      todayOrders: todayOrders.length,
      totalRevenue,
      averageOrderValue,
      occupancyRate
    };
  }

  // Gestión de pedidos
  getAllOrders(): Order[] {
    const data = localStorage.getItem(this.ordersKey);
    return data ? JSON.parse(data) : this.generateSampleOrders();
  }

  getOrdersByDate(date: string): Order[] {
    const orders = this.getAllOrders();
    return orders.filter(order => order.createdAt.startsWith(date));
  }

  updateOrderStatus(orderId: string, status: Order['status']): boolean {
    const orders = this.getAllOrders();
    const index = orders.findIndex(o => o.id === orderId);
    
    if (index !== -1) {
      orders[index].status = status;
      localStorage.setItem(this.ordersKey, JSON.stringify(orders));
      return true;
    }
    
    return false;
  }

  // Gestión de inventario
  getInventory(): InventoryItem[] {
    const data = localStorage.getItem(this.inventoryKey);
    return data ? JSON.parse(data) : this.generateSampleInventory();
  }

  updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): boolean {
    const inventory = this.getInventory();
    const index = inventory.findIndex(i => i.id === itemId);
    
    if (index !== -1) {
      inventory[index] = { ...inventory[index], ...updates, lastUpdated: new Date().toISOString() };
      localStorage.setItem(this.inventoryKey, JSON.stringify(inventory));
      return true;
    }
    
    return false;
  }

  getLowStockItems(): InventoryItem[] {
    const inventory = this.getInventory();
    return inventory.filter(item => item.stock <= item.minStock);
  }

  // Generar datos de ejemplo para pedidos
  private generateSampleOrders(): Order[] {
    const sampleOrders: Order[] = [
      {
        id: '1',
        customerName: 'Mesa 5',
        items: [
          { id: '1', name: 'Paella Valenciana', price: 18.50, quantity: 2 },
          { id: '2', name: 'Sangría', price: 12.00, quantity: 1 }
        ],
        total: 49.00,
        status: 'preparing',
        createdAt: new Date().toISOString(),
        tableNumber: 5
      },
      {
        id: '2',
        customerName: 'Mesa 3',
        items: [
          { id: '3', name: 'Gazpacho', price: 8.50, quantity: 2 },
          { id: '4', name: 'Cordero Asado', price: 22.00, quantity: 1 }
        ],
        total: 39.00,
        status: 'ready',
        createdAt: new Date().toISOString(),
        tableNumber: 3
      },
      {
        id: '3',
        customerName: 'Mesa 8',
        items: [
          { id: '5', name: 'Tortilla Española', price: 9.50, quantity: 1 },
          { id: '6', name: 'Vino Tinto', price: 15.00, quantity: 1 }
        ],
        total: 24.50,
        status: 'pending',
        createdAt: new Date().toISOString(),
        tableNumber: 8
      }
    ];

    localStorage.setItem(this.ordersKey, JSON.stringify(sampleOrders));
    return sampleOrders;
  }

  // Generar datos de ejemplo para inventario
  private generateSampleInventory(): InventoryItem[] {
    const sampleInventory: InventoryItem[] = [
      {
        id: '1',
        name: 'Arroz Bomba',
        category: 'Cereales',
        stock: 25,
        minStock: 10,
        unit: 'kg',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Aceite de Oliva',
        category: 'Aceites',
        stock: 8,
        minStock: 5,
        unit: 'litros',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Tomates',
        category: 'Verduras',
        stock: 3,
        minStock: 5,
        unit: 'kg',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Pollo',
        category: 'Carnes',
        stock: 12,
        minStock: 8,
        unit: 'kg',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Vino Tinto',
        category: 'Bebidas',
        stock: 24,
        minStock: 12,
        unit: 'botellas',
        lastUpdated: new Date().toISOString()
      }
    ];

    localStorage.setItem(this.inventoryKey, JSON.stringify(sampleInventory));
    return sampleInventory;
  }
}

export const dashboardService = new DashboardService();