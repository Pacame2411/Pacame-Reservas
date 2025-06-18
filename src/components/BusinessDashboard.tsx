import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Download,
  Filter,
  Star,
  Crown,
  User,
  AlertTriangle,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  Mail,
  Phone,
  Clock,
  Target
} from 'lucide-react';
import { format, subMonths, subQuarters, subYears, parseISO, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { reservationService } from '../services/reservationService';
import { businessAnalyticsService } from '../services/businessAnalyticsService';
import { Reservation } from '../types';

interface BusinessDashboardProps {
  onClose: () => void;
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

interface PeriodStats {
  period: string;
  reservations: number;
  guests: number;
  revenue: number;
  growth: number;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers'>('dashboard');
  const [timeRange, setTimeRange] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [customDateRange, setCustomDateRange] = useState({
    start: format(subMonths(new Date(), 12), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [customerFilter, setCustomerFilter] = useState<'all' | 'VIP' | 'Regular' | 'Ocasional' | 'Inactive'>('all');
  const [sortBy, setSortBy] = useState<'reservations' | 'value' | 'lastVisit'>('reservations');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showInactiveAlert, setShowInactiveAlert] = useState(true);
  
  const [dashboardStats, setDashboardStats] = useState<PeriodStats[]>([]);
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalReservations: 0,
    totalRevenue: 0,
    averageReservationValue: 0,
    totalCustomers: 0,
    vipCustomers: 0,
    inactiveCustomers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, customDateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Cargar datos del dashboard
      const stats = await businessAnalyticsService.getDashboardStats(timeRange, customDateRange);
      setDashboardStats(stats);

      // Cargar análisis de clientes
      const customers = await businessAnalyticsService.getCustomerAnalytics();
      setCustomerAnalytics(customers);

      // Calcular estadísticas totales
      const totals = businessAnalyticsService.calculateTotalStats(customers, stats);
      setTotalStats(totals);

    } catch (error) {
      console.error('Error cargando datos de analítica:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (type: 'dashboard' | 'customers', format: 'csv' | 'excel') => {
    if (type === 'dashboard') {
      businessAnalyticsService.exportDashboardData(dashboardStats, format);
    } else {
      businessAnalyticsService.exportCustomerData(filteredCustomers, format);
    }
  };

  const handleSort = (field: 'reservations' | 'value' | 'lastVisit') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredCustomers = customerAnalytics
    .filter(customer => {
      if (customerFilter === 'all') return true;
      if (customerFilter === 'Inactive') return customer.isInactive;
      return customer.category === customerFilter;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'reservations':
          aValue = a.totalReservations;
          bValue = b.totalReservations;
          break;
        case 'value':
          aValue = a.estimatedValue;
          bValue = b.estimatedValue;
          break;
        case 'lastVisit':
          aValue = new Date(a.lastVisit).getTime();
          bValue = new Date(b.lastVisit).getTime();
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const inactiveCustomers = customerAnalytics.filter(c => c.isInactive);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'VIP':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'Regular':
        return <Star className="w-4 h-4 text-blue-500" />;
      case 'Ocasional':
        return <User className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'VIP':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Regular':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Ocasional':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: es });
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (growth < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <BarChart3 className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Cargando análisis de negocio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-semibold text-white">Mi Negocio</h2>
            <p className="text-slate-400 text-sm">
              Análisis completo de rendimiento y fidelización de clientes
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={loadAnalyticsData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2 inline" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'customers'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Análisis de Clientes
            {inactiveCustomers.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {inactiveCustomers.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' ? (
            /* Dashboard Tab */
            <div className="p-6">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setTimeRange('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timeRange === 'monthly'
                        ? 'bg-amber-500 text-slate-900'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Mensual
                  </button>
                  <button
                    onClick={() => setTimeRange('quarterly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timeRange === 'quarterly'
                        ? 'bg-amber-500 text-slate-900'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Trimestral
                  </button>
                  <button
                    onClick={() => setTimeRange('yearly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timeRange === 'yearly'
                        ? 'bg-amber-500 text-slate-900'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Anual
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                  <span className="text-slate-400">a</span>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={() => handleExportData('dashboard', 'csv')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{totalStats.totalReservations}</p>
                      <p className="text-sm text-slate-400">Total Reservas</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{formatCurrency(totalStats.totalRevenue)}</p>
                      <p className="text-sm text-slate-400">Ingresos Estimados</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{totalStats.totalCustomers}</p>
                      <p className="text-sm text-slate-400">Total Clientes</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-yellow-900/30 rounded-lg flex items-center justify-center">
                      <Crown className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{totalStats.vipCustomers}</p>
                      <p className="text-sm text-slate-400">Clientes VIP</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="bg-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">
                    Tendencia de Reservas - Vista {timeRange === 'monthly' ? 'Mensual' : timeRange === 'quarterly' ? 'Trimestral' : 'Anual'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-amber-400" />
                    <span className="text-sm text-slate-400">Últimos {dashboardStats.length} períodos</span>
                  </div>
                </div>

                {/* Simple Chart Visualization */}
                <div className="space-y-4">
                  {dashboardStats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-slate-300 font-medium">
                        {stat.period}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-400">Reservas: {stat.reservations}</span>
                          <div className="flex items-center gap-1">
                            {getGrowthIcon(stat.growth)}
                            <span className={`text-sm font-medium ${getGrowthColor(stat.growth)}`}>
                              {stat.growth > 0 ? '+' : ''}{stat.growth.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min((stat.reservations / Math.max(...dashboardStats.map(s => s.reservations))) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-1">
                          <span>Comensales: {stat.guests}</span>
                          <span>Ingresos: {formatCurrency(stat.revenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Customers Tab */
            <div className="p-6">
              {/* Inactive Customers Alert */}
              {inactiveCustomers.length > 0 && showInactiveAlert && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div>
                        <h4 className="text-red-400 font-medium">Clientes Inactivos Detectados</h4>
                        <p className="text-red-300 text-sm">
                          {inactiveCustomers.length} clientes no han realizado reservas en más de 3 meses
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInactiveAlert(false)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value as any)}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  >
                    <option value="all">Todos los clientes</option>
                    <option value="VIP">Clientes VIP</option>
                    <option value="Regular">Clientes Regulares</option>
                    <option value="Ocasional">Clientes Ocasionales</option>
                    <option value="Inactive">Clientes Inactivos</option>
                  </select>
                </div>

                <button
                  onClick={() => handleExportData('customers', 'csv')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>

                <button
                  onClick={() => handleExportData('customers', 'excel')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Exportar Excel
                </button>
              </div>

              {/* Customer Categories Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <div>
                      <p className="text-yellow-400 font-medium">VIP</p>
                      <p className="text-white text-lg font-bold">
                        {customerAnalytics.filter(c => c.category === 'VIP').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Star className="w-6 h-6 text-blue-400" />
                    <div>
                      <p className="text-blue-400 font-medium">Regular</p>
                      <p className="text-white text-lg font-bold">
                        {customerAnalytics.filter(c => c.category === 'Regular').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/20 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="text-gray-400 font-medium">Ocasional</p>
                      <p className="text-white text-lg font-bold">
                        {customerAnalytics.filter(c => c.category === 'Ocasional').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    <div>
                      <p className="text-red-400 font-medium">Inactivos</p>
                      <p className="text-white text-lg font-bold">
                        {inactiveCustomers.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Table */}
              <div className="bg-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-600">
                  <h3 className="text-lg font-semibold text-white">
                    Análisis de Fidelización ({filteredCustomers.length} clientes)
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:text-white"
                          onClick={() => handleSort('reservations')}
                        >
                          <div className="flex items-center gap-1">
                            Reservas
                            {sortBy === 'reservations' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Frecuencia
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:text-white"
                          onClick={() => handleSort('value')}
                        >
                          <div className="flex items-center gap-1">
                            Valor Total
                            {sortBy === 'value' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider cursor-pointer hover:text-white"
                          onClick={() => handleSort('lastVisit')}
                        >
                          <div className="flex items-center gap-1">
                            Última Visita
                            {sortBy === 'lastVisit' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {filteredCustomers.map((customer, index) => (
                        <tr key={customer.email} className="hover:bg-slate-600/50">
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-white font-medium">{customer.name}</div>
                              <div className="text-slate-400 text-sm">{customer.email}</div>
                              {customer.phone && (
                                <div className="text-slate-500 text-xs">{customer.phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-white font-medium">{customer.totalReservations}</div>
                            <div className="text-slate-400 text-sm">{customer.totalGuests} comensales</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-white">{customer.frequency.toFixed(1)} días</div>
                            <div className="text-slate-400 text-sm">promedio</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-white font-medium">{formatCurrency(customer.estimatedValue)}</div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-white">{formatDate(customer.lastVisit)}</div>
                            <div className={`text-sm ${customer.isInactive ? 'text-red-400' : 'text-slate-400'}`}>
                              {customer.isInactive ? 
                                `${customer.daysSinceLastVisit} días (Inactivo)` : 
                                `hace ${customer.daysSinceLastVisit} días`
                              }
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(customer.category)}`}>
                              {getCategoryIcon(customer.category)}
                              {customer.category}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 rounded"
                                title="Ver detalles"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 rounded"
                                title="Enviar email"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              {customer.phone && (
                                <button
                                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 rounded"
                                  title="Llamar"
                                >
                                  <Phone className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredCustomers.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No hay clientes que coincidan con los filtros</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};