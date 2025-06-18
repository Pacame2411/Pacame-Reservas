import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Clock, 
  Filter,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Bell,
  Edit,
  Phone,
  Mail,
  Settings,
  Download,
  Upload,
  Eye,
  MapPin,
  MessageSquare,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { authService } from '../services/authService';
import { reservationService } from '../services/reservationService';
import { configurationService } from '../services/configurationService';
import { Reservation } from '../types';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ManualReservationForm } from './ManualReservationForm';
import { ConfigurationPanel } from './ConfigurationPanel';
import { ReservationVisualization } from './ReservationVisualization';
import { EmailNotificationPanel } from './EmailNotificationPanel';
import { BusinessDashboard } from './BusinessDashboard';

interface ManagerDashboardProps {
  onLogout: () => void;
}

interface NotificationItem {
  id: string;
  type: 'new_reservation' | 'status_change' | 'reminder';
  message: string;
  timestamp: string;
  read: boolean;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onLogout }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showConfigurationPanel, setShowConfigurationPanel] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [showBusinessDashboard, setShowBusinessDashboard] = useState(false);
  const [selectedReservationForEmail, setSelectedReservationForEmail] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = authService.getCurrentAuth().user;

  useEffect(() => {
    loadReservations();
    loadNotifications();
    
    // Simular notificaciones en tiempo real
    const interval = setInterval(() => {
      checkForNewReservations();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadReservations = () => {
    setLoading(true);
    setTimeout(() => {
      const allReservations = reservationService.getAllReservations();
      setReservations(allReservations.sort((a, b) => 
        new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()
      ));
      setLoading(false);
    }, 300);
  };

  const loadNotifications = () => {
    // Simular notificaciones
    const mockNotifications: NotificationItem[] = [
      {
        id: '1',
        type: 'new_reservation',
        message: 'Nueva reserva de María García para mañana a las 20:00',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'reminder',
        message: 'Recordatorio: 5 reservas confirmadas para esta noche',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      }
    ];
    setNotifications(mockNotifications);
  };

  const checkForNewReservations = () => {
    // Simular verificación de nuevas reservas
    const newReservations = reservationService.getAllReservations();
    if (newReservations.length > reservations.length) {
      const newNotification: NotificationItem = {
        id: Date.now().toString(),
        type: 'new_reservation',
        message: 'Nueva reserva recibida',
        timestamp: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
      setReservations(newReservations);
    }
  };

  // Filtrar reservas
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    const matchesTime = timeFilter === 'all' || 
                       (timeFilter === 'morning' && parseInt(reservation.time.split(':')[0]) < 15) ||
                       (timeFilter === 'evening' && parseInt(reservation.time.split(':')[0]) >= 15);
    
    const matchesDate = activeView === 'calendar' ? reservation.date === selectedDate : true;
    
    return matchesSearch && matchesStatus && matchesTime && matchesDate;
  });

  // Actualizar estado de reserva
  const updateReservationStatus = (id: string, status: Reservation['status']) => {
    if (reservationService.updateReservationStatus(id, status)) {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      
      // Agregar notificación
      const reservation = reservations.find(r => r.id === id);
      if (reservation) {
        const newNotification: NotificationItem = {
          id: Date.now().toString(),
          type: 'status_change',
          message: `Reserva de ${reservation.customerName} ${status === 'confirmed' ? 'confirmada' : 'cancelada'}`,
          timestamp: new Date().toISOString(),
          read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
      }
    }
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleReservationSuccess = (reservation: Reservation) => {
    loadReservations();
    setShowReservationForm(false);
    setEditingReservation(null);
    
    // Agregar notificación
    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      type: 'new_reservation',
      message: `${editingReservation ? 'Reserva actualizada' : 'Nueva reserva creada'} para ${reservation.customerName}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setShowReservationForm(true);
  };

  const handleShowEmailPanel = (reservationId?: string) => {
    setSelectedReservationForEmail(reservationId || null);
    setShowEmailPanel(true);
  };

  const exportConfiguration = () => {
    const config = configurationService.exportConfiguration();
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restaurant-config-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const configString = e.target?.result as string;
        const result = await configurationService.importConfiguration(configString);
        
        if (result.success) {
          alert('Configuración importada exitosamente');
          window.location.reload(); // Recargar para aplicar cambios
        } else {
          alert(`Error al importar configuración: ${result.error}`);
        }
      } catch (error) {
        alert('Error al leer el archivo de configuración');
      }
    };
    reader.readAsText(file);
  };

  const getStatusIcon = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-900/20 text-green-400 border-green-800';
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-800';
      case 'cancelled':
        return 'bg-red-900/20 text-red-400 border-red-800';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Generar vista de calendario
  const generateCalendarWeek = () => {
    const startDate = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      const dayReservations = reservations.filter(r => isSameDay(parseISO(r.date), day));
      days.push({
        date: day,
        reservations: dayReservations,
        isSelected: isSameDay(day, parseISO(selectedDate))
      });
    }
    
    return days;
  };

  const stats = {
    total: filteredReservations.length,
    confirmed: filteredReservations.filter(r => r.status === 'confirmed').length,
    pending: filteredReservations.filter(r => r.status === 'pending').length,
    cancelled: filteredReservations.filter(r => r.status === 'cancelled').length,
    totalGuests: filteredReservations.reduce((sum, r) => sum + r.guests, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Panel de Reservas</h1>
                <p className="text-sm text-slate-400">Bella Vista Restaurant</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Business Dashboard Button */}
              <button
                onClick={() => setShowBusinessDashboard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                title="Mi Negocio - Analytics"
              >
                <TrendingUp className="w-4 h-4" />
                Mi Negocio
              </button>

              {/* Email Panel Button */}
              <button
                onClick={() => handleShowEmailPanel()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Panel de Emails"
              >
                <MessageSquare className="w-4 h-4" />
                Emails
              </button>

              {/* Visualization Button */}
              <button
                onClick={() => setShowVisualization(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Vista de Calendario y Plano"
              >
                <Eye className="w-4 h-4" />
                Visualización
              </button>

              {/* Configuration Button */}
              <button
                onClick={() => setShowConfigurationPanel(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Configuración"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Export/Import */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportConfiguration}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  title="Exportar configuración"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                <label className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer" title="Importar configuración">
                  <Upload className="w-5 h-5" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={importConfiguration}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-12 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-slate-700">
                      <h3 className="text-white font-medium">Notificaciones</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-slate-400 text-center">No hay notificaciones</p>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-slate-700 hover:bg-slate-700 cursor-pointer ${
                              !notification.read ? 'bg-slate-750' : ''
                            }`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <p className="text-white text-sm">{notification.message}</p>
                            <p className="text-slate-400 text-xs mt-1">
                              {format(new Date(notification.timestamp), 'HH:mm')}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-medium text-white">{currentUser?.name}</p>
                <p className="text-xs text-slate-400">Gerente</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-medium text-slate-300">Total</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="font-medium text-slate-300">Confirmadas</h3>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.confirmed}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="font-medium text-slate-300">Pendientes</h3>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-900/30 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-medium text-slate-300">Canceladas</h3>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.cancelled}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-medium text-slate-300">Comensales</h3>
            </div>
            <p className="text-2xl font-bold text-amber-400">{stats.totalGuests}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* View Toggle */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setActiveView('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'list'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setActiveView('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'calendar'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Calendario
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full pl-11 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-11 pr-8 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="pending">Pendientes</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>

              <div className="relative">
                <Clock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="pl-11 pr-8 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none"
                >
                  <option value="all">Todos los horarios</option>
                  <option value="morning">Almuerzo (12:00-15:00)</option>
                  <option value="evening">Cena (15:00-23:00)</option>
                </select>
              </div>
            </div>

            {/* Add Reservation Button */}
            <button
              onClick={() => setShowReservationForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Nueva Reserva
            </button>
          </div>

          {/* Date Selector for Calendar View */}
          {activeView === 'calendar' && (
            <div className="mb-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Content */}
        {activeView === 'list' ? (
          /* List View */
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">
                Reservas
                {filteredReservations.length > 0 && (
                  <span className="ml-2 text-sm text-slate-400">
                    ({filteredReservations.length} {filteredReservations.length === 1 ? 'reserva' : 'reservas'})
                  </span>
                )}
              </h3>
            </div>

            {filteredReservations.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No hay reservas que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {filteredReservations.map((reservation) => (
                  <div key={reservation.id} className="p-6 hover:bg-slate-750 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(reservation.status)}
                            <h4 className="text-lg font-semibold text-white">
                              {reservation.customerName}
                            </h4>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                            {reservation.status === 'confirmed' ? 'Confirmada' : 
                             reservation.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                          </span>
                          {reservation.createdBy === 'manager' && (
                            <span className="px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded border border-blue-800">
                              Manual
                            </span>
                          )}
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(parseISO(reservation.date), 'dd/MM/yyyy', { locale: es })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{reservation.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{reservation.guests} {reservation.guests === 1 ? 'persona' : 'personas'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>{reservation.phone}</span>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{reservation.email}</span>
                        </div>

                        {reservation.assignedTable && (
                          <div className="mt-2 text-sm text-slate-400">
                            <span className="font-medium">Mesa asignada:</span> Mesa {reservation.assignedTable}
                          </div>
                        )}

                        {reservation.specialRequests && (
                          <div className="mt-3 p-3 bg-slate-700 rounded-lg">
                            <p className="text-sm text-slate-300">
                              <strong>Peticiones especiales:</strong> {reservation.specialRequests}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {/* Email Button */}
                        <button
                          onClick={() => handleShowEmailPanel(reservation.id)}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                          title="Gestionar emails"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        {reservation.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {reservation.status === 'confirmed' && (
                          <button
                            onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                        {reservation.status === 'cancelled' && (
                          <button
                            onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Reactivar
                          </button>
                        )}
                        <button
                          onClick={() => handleEditReservation(reservation)}
                          className="px-4 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-500 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Vista de Calendario</h3>
            <div className="grid grid-cols-7 gap-4">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="text-center text-slate-400 font-medium py-2">
                  {day}
                </div>
              ))}
              {generateCalendarWeek().map((day, index) => (
                <div
                  key={index}
                  className={`min-h-32 p-3 border border-slate-700 rounded-lg cursor-pointer transition-colors ${
                    day.isSelected ? 'bg-amber-500/20 border-amber-500' : 'hover:bg-slate-700'
                  }`}
                  onClick={() => setSelectedDate(format(day.date, 'yyyy-MM-dd'))}
                >
                  <div className="text-white font-medium mb-2">
                    {format(day.date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {day.reservations.slice(0, 3).map(reservation => (
                      <div
                        key={reservation.id}
                        className={`text-xs p-1 rounded truncate ${getStatusColor(reservation.status)}`}
                      >
                        {reservation.time} - {reservation.customerName}
                      </div>
                    ))}
                    {day.reservations.length > 3 && (
                      <div className="text-xs text-slate-400">
                        +{day.reservations.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Reservation Form Modal */}
      {showReservationForm && (
        <ManualReservationForm
          onClose={() => {
            setShowReservationForm(false);
            setEditingReservation(null);
          }}
          onSuccess={handleReservationSuccess}
          editingReservation={editingReservation}
        />
      )}

      {/* Configuration Panel Modal */}
      {showConfigurationPanel && (
        <ConfigurationPanel
          onClose={() => setShowConfigurationPanel(false)}
        />
      )}

      {/* Reservation Visualization Modal */}
      {showVisualization && (
        <ReservationVisualization
          onClose={() => setShowVisualization(false)}
        />
      )}

      {/* Email Notification Panel Modal */}
      {showEmailPanel && (
        <EmailNotificationPanel
          reservationId={selectedReservationForEmail}
          onClose={() => {
            setShowEmailPanel(false);
            setSelectedReservationForEmail(null);
          }}
        />
      )}

      {/* Business Dashboard Modal */}
      {showBusinessDashboard && (
        <BusinessDashboard
          onClose={() => setShowBusinessDashboard(false)}
        />
      )}
    </div>
  );
};