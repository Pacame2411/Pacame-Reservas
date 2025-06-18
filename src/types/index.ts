export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'occupied' | 'blocked';
  special_requests?: string;
  table_type_preference?: string;
  duration_minutes?: number;
  assigned_table_id?: string;
  created_by: 'customer' | 'manager';
  created_at: string;
  updated_at?: string;
  confirmed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  reminder_sent?: boolean;
  notes?: string;
  source?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  maxCapacity: number;
  currentReservations: number;
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  type: string;
  features?: string;
  location: string;
}

export interface RestaurantConfig {
  name: string;
  maxTotalCapacity: number;
  maxGuestsPerReservation: number;
  maxCapacityPerSlot: number;
  openingHours: {
    start: string;
    end: string;
  };
  timeSlotDuration: number; // en minutos
  averageTableDuration: number; // en minutos
  advanceBookingDays: number;
  operatingHours: Array<{
    isOpen: boolean;
    start: string;
    end: string;
  }>;
}

export interface TableLayoutTable {
  id: string;
  number: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'square' | 'circle' | 'rectangle';
  capacity: number;
  zone: string;
  type: string;
  features: string[];
}

export interface TableLayout {
  width: number;
  height: number;
  tables: TableLayoutTable[];
  zones: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export interface ReservationRules {
  minAdvanceTime: string;
  maxAdvanceTime: string;
  cancellationPolicy: {
    freeUntil: string;
    lateFee: number; // percentage
  };
  requireDeposit: boolean;
  depositAmount: number;
  depositRequiredForGroups: number;
  specialDates: {
    enabled: boolean;
    extraDeposit: number;
    dates: string[];
  };
  tableRestrictions: {
    vipMinimumSpend: number;
    windowTableSurcharge: number;
  };
}

export interface AnalyticsConfig {
  enableTracking: boolean;
  reportFrequency: 'daily' | 'weekly' | 'monthly';
  metricsToTrack: string[];
  alertThresholds: {
    lowOccupancy: number;
    highCancellation: number;
    highNoShow: number;
  };
  exportFormats: string[];
  autoReports: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  role: 'manager' | 'admin';
  name: string;
  email: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  tableNumber?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  lastUpdated: string;
}

export interface DashboardStats {
  todayReservations: number;
  todayOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  occupancyRate: number;
}