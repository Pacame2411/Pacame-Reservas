import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Users, MapPin, Filter, ChevronLeft, ChevronRight, Eye, EyeOff, RotateCcw, Zap, Move, Square, Circle, RectangleVertical as Rectangle, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { reservationService } from '../services/reservationService';
import { configurationService } from '../services/configurationService';
import { tableAssignmentService } from '../services/tableAssignmentService';
import { Reservation, TableLayoutTable } from '../types';

interface ReservationVisualizationProps {
  onClose: () => void;
}

interface TableWithReservation extends TableLayoutTable {
  reservation?: Reservation;
  status: 'free' | 'reserved' | 'occupied' | 'blocked';
  nextReservation?: Reservation;
}

export const ReservationVisualization: React.FC<ReservationVisualizationProps> = ({ onClose }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'floor'>('calendar');
  const [timeFilter, setTimeFilter] = useState<'all' | 'lunch' | 'dinner'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [showOccupancyOnly, setShowOccupancyOnly] = useState(false);
  const [autoAssignMode, setAutoAssignMode] = useState(true);
  const [draggedReservation, setDraggedReservation] = useState<Reservation | null>(null);
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tablesWithReservations, setTablesWithReservations] = useState<TableWithReservation[]>([]);
  const [weekReservations, setWeekReservations] = useState<Reservation[]>([]);
  const [occupancyStats, setOccupancyStats] = useState<any>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const tableLayout = configurationService.getTableLayout();
  const config = configurationService.getConfiguration();

  useEffect(() => {
    loadWeekReservations();
  }, [selectedDate]);

  useEffect(() => {
    if (viewMode === 'floor') {
      updateFloorPlan();
    }
  }, [selectedDate, selectedTime, viewMode, zoneFilter]);

  const loadWeekReservations = () => {
    const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const reservations: Reservation[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(startOfCurrentWeek, i);
      const dayReservations = reservationService.getReservationsByDate(format(date, 'yyyy-MM-dd'));
      reservations.push(...dayReservations);
    }
    
    setWeekReservations(reservations);
    calculateOccupancyStats(reservations);
  };

  const calculateOccupancyStats = (reservations: Reservation[]) => {
    const stats: any = {};
    const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(startOfCurrentWeek, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayReservations = reservations.filter(r => r.date === dateStr && r.status !== 'cancelled');
      
      const totalCapacity = tableLayout.tables.reduce((sum, table) => sum + table.capacity, 0);
      const reservedCapacity = dayReservations.reduce((sum, r) => sum + r.guests, 0);
      const occupancyRate = totalCapacity > 0 ? (reservedCapacity / totalCapacity) * 100 : 0;
      
      stats[dateStr] = {
        reservations: dayReservations.length,
        guests: reservedCapacity,
        occupancyRate: Math.round(occupancyRate),
        totalCapacity
      };
    }
    
    setOccupancyStats(stats);
  };

  const updateFloorPlan = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayReservations = reservationService.getReservationsByDate(dateStr);
    
    const tablesWithRes: TableWithReservation[] = tableLayout.tables.map(table => {
      // Filtrar por zona si está seleccionada
      if (zoneFilter !== 'all' && table.zone !== zoneFilter) {
        return null;
      }

      // Encontrar reserva actual para esta mesa
      let currentReservation: Reservation | undefined;
      let status: 'free' | 'reserved' | 'occupied' | 'blocked' = 'free';

      if (selectedTime) {
        currentReservation = dayReservations.find(r => 
          r.assignedTable === table.id && 
          r.time === selectedTime && 
          r.status !== 'cancelled'
        );
        
        if (currentReservation) {
          status = currentReservation.status === 'confirmed' ? 'reserved' : 'occupied';
        }
      } else {
        // Mostrar todas las reservas del día
        const tableReservations = dayReservations.filter(r => 
          r.assignedTable === table.id && r.status !== 'cancelled'
        );
        
        if (tableReservations.length > 0) {
          status = 'reserved';
          currentReservation = tableReservations[0];
        }
      }

      return {
        ...table,
        reservation: currentReservation,
        status,
        nextReservation: undefined
      };
    }).filter(Boolean) as TableWithReservation[];

    setTablesWithReservations(tablesWithRes);
  };

  const handleTableClick = (table: TableWithReservation) => {
    setSelectedTable(table.id);
    
    if (draggedReservation && autoAssignMode) {
      // Asignar reserva a mesa
      assignReservationToTable(draggedReservation, table);
    }
  };

  const assignReservationToTable = async (reservation: Reservation, table: TableWithReservation) => {
    if (table.status !== 'free') {
      alert('Esta mesa ya está ocupada');
      return;
    }

    if (reservation.guests > table.capacity) {
      const confirm = window.confirm(
        `La mesa tiene capacidad para ${table.capacity} personas pero la reserva es para ${reservation.guests}. ¿Continuar?`
      );
      if (!confirm) return;
    }

    // Actualizar reserva con mesa asignada
    const updatedReservation = await reservationService.updateReservation(reservation.id, {
      assignedTable: table.id
    });

    if (updatedReservation) {
      setDraggedReservation(null);
      updateFloorPlan();
      alert(`Reserva asignada a Mesa ${table.number}`);
    }
  };

  const handleAutoAssign = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const unassignedReservations = reservationService.getReservationsByDate(dateStr)
      .filter(r => !r.assignedTable && r.status !== 'cancelled');

    if (unassignedReservations.length === 0) {
      alert('No hay reservas sin asignar para esta fecha');
      return;
    }

    const assignments = await tableAssignmentService.autoAssignTables(unassignedReservations, dateStr);
    
    // Aplicar asignaciones
    for (const assignment of assignments) {
      await reservationService.updateReservation(assignment.reservationId, {
        assignedTable: assignment.tableId
      });
    }

    updateFloorPlan();
    alert(`${assignments.length} reservas asignadas automáticamente`);
  };

  const getTableColor = (table: TableWithReservation) => {
    switch (table.status) {
      case 'free':
        return '#10b981'; // Verde
      case 'reserved':
        return '#f59e0b'; // Amarillo
      case 'occupied':
        return '#ef4444'; // Rojo
      case 'blocked':
        return '#6b7280'; // Gris
      default:
        return '#e5e7eb';
    }
  };

  const getZoneColor = (zoneId: string) => {
    const zone = tableLayout.zones.find(z => z.id === zoneId);
    return zone?.color || '#6b7280';
  };

  const renderTable = (table: TableWithReservation) => {
    const isSelected = selectedTable === table.id;
    const isHovered = hoveredTable === table.id;
    const color = getTableColor(table);
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: table.x,
      top: table.y,
      width: table.width,
      height: table.height,
      backgroundColor: color,
      border: `2px solid ${isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : 'transparent'}`,
      borderRadius: table.shape === 'circle' ? '50%' : table.shape === 'square' ? '8px' : '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      zIndex: isSelected ? 10 : 1
    };

    return (
      <div
        key={table.id}
        style={style}
        onClick={() => handleTableClick(table)}
        onMouseEnter={() => setHoveredTable(table.id)}
        onMouseLeave={() => setHoveredTable(null)}
        title={`Mesa ${table.number} - ${table.capacity} personas - ${table.zone}`}
      >
        <div className="text-center">
          <div>{table.number}</div>
          <div className="text-xs opacity-75">{table.capacity}p</div>
        </div>
      </div>
    );
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 12; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const filteredTimeSlots = generateTimeSlots().filter(time => {
    if (timeFilter === 'all') return true;
    const hour = parseInt(time.split(':')[0]);
    if (timeFilter === 'lunch') return hour >= 12 && hour < 16;
    if (timeFilter === 'dinner') return hour >= 16 && hour <= 23;
    return true;
  });

  const getWeekDays = () => {
    const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(startOfCurrentWeek, i);
      days.push(day);
    }
    
    return days;
  };

  const unassignedReservations = reservationService.getReservationsByDate(format(selectedDate, 'yyyy-MM-dd'))
    .filter(r => !r.assignedTable && r.status !== 'cancelled');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Visualización de Reservas</h2>
            <p className="text-slate-400 text-sm">
              Gestión visual del restaurante y asignación de mesas
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 mr-2 inline" />
                Calendario
              </button>
              <button
                onClick={() => setViewMode('floor')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'floor'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <MapPin className="w-4 h-4 mr-2 inline" />
                Plano
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Time Filter */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              <option value="all">Todos los horarios</option>
              <option value="lunch">Almuerzo (12:00-16:00)</option>
              <option value="dinner">Cena (16:00-23:00)</option>
            </select>

            {/* Zone Filter */}
            {viewMode === 'floor' && (
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="all">Todas las zonas</option>
                {tableLayout.zones.map(zone => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
            )}

            {/* Time Slot Selector for Floor View */}
            {viewMode === 'floor' && (
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              >
                <option value="">Todo el día</option>
                {filteredTimeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            )}

            {/* Auto Assign Button */}
            {viewMode === 'floor' && (
              <button
                onClick={handleAutoAssign}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Asignar Auto
              </button>
            )}

            {/* Toggle Options */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoAssignMode(!autoAssignMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  autoAssignMode 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Move className="w-4 h-4" />
                Auto-asignar
              </button>
              
              {viewMode === 'floor' && (
                <button
                  onClick={() => setShowOccupancyOnly(!showOccupancyOnly)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    showOccupancyOnly 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  {showOccupancyOnly ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  Solo ocupadas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'calendar' ? (
            /* Calendar View */
            <div className="h-full p-6">
              <div className="grid grid-cols-7 gap-4 h-full">
                {getWeekDays().map((day, index) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayStats = occupancyStats[dateStr] || { reservations: 0, guests: 0, occupancyRate: 0 };
                  const isSelected = isSameDay(day, selectedDate);
                  
                  return (
                    <div
                      key={index}
                      className={`bg-slate-700 rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected ? 'ring-2 ring-amber-400' : 'hover:bg-slate-600'
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className="text-center mb-4">
                        <div className="text-slate-400 text-sm">
                          {format(day, 'EEE', { locale: es })}
                        </div>
                        <div className="text-white text-lg font-semibold">
                          {format(day, 'd')}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Reservas:</span>
                          <span className="text-white">{dayStats.reservations}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Comensales:</span>
                          <span className="text-white">{dayStats.guests}</span>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">Ocupación</span>
                            <span className="text-white">{dayStats.occupancyRate}%</span>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                dayStats.occupancyRate > 80 ? 'bg-red-500' :
                                dayStats.occupancyRate > 60 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(dayStats.occupancyRate, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Floor Plan View */
            <div className="h-full flex">
              {/* Floor Plan */}
              <div className="flex-1 p-6">
                <div className="bg-slate-700 rounded-lg h-full relative overflow-hidden">
                  {/* Floor Plan Container */}
                  <div 
                    className="relative w-full h-full"
                    style={{ 
                      backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  >
                    {/* Zone Labels */}
                    {tableLayout.zones.map(zone => {
                      const zoneTables = tablesWithReservations.filter(t => t.zone === zone.id);
                      if (zoneTables.length === 0) return null;
                      
                      const minX = Math.min(...zoneTables.map(t => t.x));
                      const minY = Math.min(...zoneTables.map(t => t.y));
                      
                      return (
                        <div
                          key={zone.id}
                          className="absolute text-xs font-medium text-slate-300 bg-slate-800/80 px-2 py-1 rounded"
                          style={{ left: minX, top: minY - 25 }}
                        >
                          {zone.name}
                        </div>
                      );
                    })}

                    {/* Tables */}
                    {tablesWithReservations
                      .filter(table => !showOccupancyOnly || table.status !== 'free')
                      .map(table => renderTable(table))}

                    {/* Selected Table Info */}
                    {selectedTable && (
                      <div className="absolute top-4 right-4 bg-slate-800 border border-slate-600 rounded-lg p-4 max-w-xs">
                        {(() => {
                          const table = tablesWithReservations.find(t => t.id === selectedTable);
                          if (!table) return null;
                          
                          return (
                            <div>
                              <h4 className="text-white font-medium mb-2">Mesa {table.number}</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Capacidad:</span>
                                  <span className="text-white">{table.capacity} personas</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Zona:</span>
                                  <span className="text-white">{table.zone}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Estado:</span>
                                  <span className={`${
                                    table.status === 'free' ? 'text-green-400' :
                                    table.status === 'reserved' ? 'text-yellow-400' :
                                    table.status === 'occupied' ? 'text-red-400' :
                                    'text-gray-400'
                                  }`}>
                                    {table.status === 'free' ? 'Libre' :
                                     table.status === 'reserved' ? 'Reservada' :
                                     table.status === 'occupied' ? 'Ocupada' : 'Bloqueada'}
                                  </span>
                                </div>
                                {table.reservation && (
                                  <div className="mt-3 pt-3 border-t border-slate-600">
                                    <div className="text-white font-medium">{table.reservation.customerName}</div>
                                    <div className="text-slate-400 text-xs">
                                      {table.reservation.time} - {table.reservation.guests} personas
                                    </div>
                                    {table.reservation.phone && (
                                      <div className="text-slate-400 text-xs">{table.reservation.phone}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-80 border-l border-slate-700 p-6 overflow-y-auto">
                {/* Legend */}
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3">Leyenda</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-slate-300 text-sm">Libre</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-slate-300 text-sm">Reservada</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-slate-300 text-sm">Ocupada</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gray-500 rounded"></div>
                      <span className="text-slate-300 text-sm">Bloqueada</span>
                    </div>
                  </div>
                </div>

                {/* Unassigned Reservations */}
                {unassignedReservations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-medium mb-3">Reservas sin Asignar</h3>
                    <div className="space-y-2">
                      {unassignedReservations.map(reservation => (
                        <div
                          key={reservation.id}
                          className={`p-3 bg-slate-700 rounded-lg cursor-pointer transition-colors ${
                            draggedReservation?.id === reservation.id ? 'ring-2 ring-amber-400' : 'hover:bg-slate-600'
                          }`}
                          onClick={() => setDraggedReservation(
                            draggedReservation?.id === reservation.id ? null : reservation
                          )}
                        >
                          <div className="text-white font-medium">{reservation.customerName}</div>
                          <div className="text-slate-400 text-sm">
                            {reservation.time} - {reservation.guests} personas
                          </div>
                          {reservation.specialRequests && (
                            <div className="text-slate-500 text-xs mt-1">
                              {reservation.specialRequests}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div>
                  <h3 className="text-white font-medium mb-3">Estadísticas del Día</h3>
                  <div className="space-y-3">
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Mesas Libres</span>
                        <span className="text-green-400 font-medium">
                          {tablesWithReservations.filter(t => t.status === 'free').length}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Mesas Reservadas</span>
                        <span className="text-yellow-400 font-medium">
                          {tablesWithReservations.filter(t => t.status === 'reserved').length}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Mesas Ocupadas</span>
                        <span className="text-red-400 font-medium">
                          {tablesWithReservations.filter(t => t.status === 'occupied').length}
                        </span>
                      </div>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">Sin Asignar</span>
                        <span className="text-amber-400 font-medium">
                          {unassignedReservations.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};