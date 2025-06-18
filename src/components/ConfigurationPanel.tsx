import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Clock, 
  Calendar, 
  MapPin, 
  Grid, 
  BarChart3, 
  Bell,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  Copy,
  Move,
  Square,
  Circle,
  Triangle,
  Maximize2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { configurationService } from '../services/configurationService';
import { RestaurantConfig, TableLayout, ReservationRules, AnalyticsConfig } from '../types';

interface ConfigurationPanelProps {
  onClose: () => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'capacity' | 'tables' | 'rules' | 'experience' | 'analytics'>('capacity');
  const [config, setConfig] = useState<RestaurantConfig>(configurationService.getConfiguration());
  const [tableLayout, setTableLayout] = useState<TableLayout>(configurationService.getTableLayout());
  const [reservationRules, setReservationRules] = useState<ReservationRules>(configurationService.getReservationRules());
  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig>(configurationService.getAnalyticsConfig());
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [draggedTable, setDraggedTable] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Editor de mesas
  const [editorMode, setEditorMode] = useState<'select' | 'add' | 'move'>('select');
  const [newTableType, setNewTableType] = useState<'square' | 'circle' | 'rectangle'>('square');

  useEffect(() => {
    setHasChanges(true);
  }, [config, tableLayout, reservationRules, analyticsConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await configurationService.saveConfiguration(config);
      await configurationService.saveTableLayout(tableLayout);
      await configurationService.saveReservationRules(reservationRules);
      await configurationService.saveAnalyticsConfig(analyticsConfig);
      setHasChanges(false);
      
      // Mostrar confirmación
      setTimeout(() => setSaving(false), 1000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(configurationService.getDefaultConfiguration());
    setTableLayout(configurationService.getDefaultTableLayout());
    setReservationRules(configurationService.getDefaultReservationRules());
    setAnalyticsConfig(configurationService.getDefaultAnalyticsConfig());
  };

  const addTable = (x: number, y: number) => {
    const newTable = {
      id: `table_${Date.now()}`,
      number: (tableLayout.tables.length + 1).toString(),
      x,
      y,
      width: newTableType === 'rectangle' ? 80 : 60,
      height: newTableType === 'rectangle' ? 40 : 60,
      shape: newTableType,
      capacity: 4,
      zone: 'interior',
      type: 'standard',
      features: []
    };
    
    setTableLayout(prev => ({
      ...prev,
      tables: [...prev.tables, newTable]
    }));
  };

  const updateTable = (tableId: string, updates: any) => {
    setTableLayout(prev => ({
      ...prev,
      tables: prev.tables.map(table => 
        table.id === tableId ? { ...table, ...updates } : table
      )
    }));
  };

  const deleteTable = (tableId: string) => {
    setTableLayout(prev => ({
      ...prev,
      tables: prev.tables.filter(table => table.id !== tableId)
    }));
    setSelectedTable(null);
  };

  const tabs = [
    { id: 'capacity', label: 'Capacidad y Límites', icon: Users },
    { id: 'tables', label: 'Editor de Mesas', icon: Grid },
    { id: 'rules', label: 'Reglas de Reserva', icon: Calendar },
    { id: 'experience', label: 'Experiencia', icon: Bell },
    { id: 'analytics', label: 'Analítica', icon: BarChart3 }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Configuración del Restaurante</h2>
              <p className="text-slate-400 text-sm">Gestiona todos los aspectos operativos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {hasChanges && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Cambios sin guardar
              </div>
            )}
            
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restablecer
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                saving || !hasChanges
                  ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900 border-r border-slate-700 p-4">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-amber-500 text-slate-900'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Capacity and Limits Tab */}
            {activeTab === 'capacity' && (
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Capacidad y Límites</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Capacidad Total del Restaurante
                        </label>
                        <input
                          type="number"
                          value={config.maxTotalCapacity}
                          onChange={(e) => setConfig(prev => ({ ...prev, maxTotalCapacity: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          min="1"
                          max="500"
                        />
                        <p className="text-slate-400 text-sm mt-1">Número máximo de comensales simultáneos</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Máximo de Comensales por Reserva
                        </label>
                        <input
                          type="number"
                          value={config.maxGuestsPerReservation}
                          onChange={(e) => setConfig(prev => ({ ...prev, maxGuestsPerReservation: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          min="1"
                          max="50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Intervalo entre Reservas (minutos)
                        </label>
                        <select
                          value={config.timeSlotDuration}
                          onChange={(e) => setConfig(prev => ({ ...prev, timeSlotDuration: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none"
                        >
                          <option value={15}>15 minutos</option>
                          <option value={30}>30 minutos</option>
                          <option value={45}>45 minutos</option>
                          <option value={60}>60 minutos</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Tiempo Promedio por Mesa (minutos)
                        </label>
                        <input
                          type="number"
                          value={config.averageTableDuration}
                          onChange={(e) => setConfig(prev => ({ ...prev, averageTableDuration: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          min="30"
                          max="300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Días de Reserva Anticipada
                        </label>
                        <input
                          type="number"
                          value={config.advanceBookingDays}
                          onChange={(e) => setConfig(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          min="1"
                          max="365"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Capacidad por Franja Horaria
                        </label>
                        <input
                          type="number"
                          value={config.maxCapacityPerSlot}
                          onChange={(e) => setConfig(prev => ({ ...prev, maxCapacityPerSlot: parseInt(e.target.value) }))}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          min="1"
                          max="200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Horarios de Operación</h4>
                  <div className="space-y-4">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, index) => (
                      <div key={day} className="flex items-center gap-4 p-4 bg-slate-700 rounded-lg">
                        <div className="w-24">
                          <span className="text-white font-medium">{day}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={config.operatingHours[index]?.isOpen || false}
                            onChange={(e) => {
                              const newHours = [...config.operatingHours];
                              newHours[index] = { ...newHours[index], isOpen: e.target.checked };
                              setConfig(prev => ({ ...prev, operatingHours: newHours }));
                            }}
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <span className="text-slate-300 text-sm">Abierto</span>
                        </div>

                        {config.operatingHours[index]?.isOpen && (
                          <>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <input
                                type="time"
                                value={config.operatingHours[index]?.start || '12:00'}
                                onChange={(e) => {
                                  const newHours = [...config.operatingHours];
                                  newHours[index] = { ...newHours[index], start: e.target.value };
                                  setConfig(prev => ({ ...prev, operatingHours: newHours }));
                                }}
                                className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              />
                            </div>
                            
                            <span className="text-slate-400">a</span>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={config.operatingHours[index]?.end || '23:00'}
                                onChange={(e) => {
                                  const newHours = [...config.operatingHours];
                                  newHours[index] = { ...newHours[index], end: e.target.value };
                                  setConfig(prev => ({ ...prev, operatingHours: newHours }));
                                }}
                                className="px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Table Editor Tab */}
            {activeTab === 'tables' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Editor Visual de Mesas</h3>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        showPreview ? 'bg-amber-500 text-slate-900' : 'bg-slate-600 text-white hover:bg-slate-500'
                      }`}
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPreview ? 'Ocultar Vista Previa' : 'Vista Previa'}
                    </button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-4 gap-6">
                  {/* Tools Panel */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-3">Herramientas</h4>
                      <div className="space-y-2">
                        {[
                          { id: 'select', label: 'Seleccionar', icon: Move },
                          { id: 'add', label: 'Agregar Mesa', icon: Plus },
                          { id: 'move', label: 'Mover', icon: Move }
                        ].map(tool => {
                          const Icon = tool.icon;
                          return (
                            <button
                              key={tool.id}
                              onClick={() => setEditorMode(tool.id as any)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                editorMode === tool.id
                                  ? 'bg-amber-500 text-slate-900'
                                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {tool.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {editorMode === 'add' && (
                      <div>
                        <h4 className="text-white font-medium mb-3">Tipo de Mesa</h4>
                        <div className="space-y-2">
                          {[
                            { id: 'square', label: 'Cuadrada', icon: Square },
                            { id: 'circle', label: 'Redonda', icon: Circle },
                            { id: 'rectangle', label: 'Rectangular', icon: Maximize2 }
                          ].map(type => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.id}
                                onClick={() => setNewTableType(type.id as any)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                  newTableType === type.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {type.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedTable && (
                      <div>
                        <h4 className="text-white font-medium mb-3">Propiedades de Mesa</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-slate-300 mb-1">Número</label>
                            <input
                              type="text"
                              value={tableLayout.tables.find(t => t.id === selectedTable)?.number || ''}
                              onChange={(e) => updateTable(selectedTable, { number: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-amber-400"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm text-slate-300 mb-1">Capacidad</label>
                            <input
                              type="number"
                              value={tableLayout.tables.find(t => t.id === selectedTable)?.capacity || 4}
                              onChange={(e) => updateTable(selectedTable, { capacity: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-amber-400"
                              min="1"
                              max="12"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-slate-300 mb-1">Zona</label>
                            <select
                              value={tableLayout.tables.find(t => t.id === selectedTable)?.zone || 'interior'}
                              onChange={(e) => updateTable(selectedTable, { zone: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-amber-400 appearance-none"
                            >
                              <option value="interior">Interior</option>
                              <option value="exterior">Exterior</option>
                              <option value="terraza">Terraza</option>
                              <option value="vip">VIP</option>
                              <option value="bar">Barra</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm text-slate-300 mb-1">Tipo</label>
                            <select
                              value={tableLayout.tables.find(t => t.id === selectedTable)?.type || 'standard'}
                              onChange={(e) => updateTable(selectedTable, { type: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-2 focus:ring-amber-400 appearance-none"
                            >
                              <option value="standard">Estándar</option>
                              <option value="window">Ventana</option>
                              <option value="private">Privada</option>
                              <option value="smoking">Fumadores</option>
                              <option value="non-smoking">No Fumadores</option>
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const table = tableLayout.tables.find(t => t.id === selectedTable);
                                if (table) {
                                  const copy = { ...table, id: `table_${Date.now()}`, number: `${table.number}_copy` };
                                  setTableLayout(prev => ({ ...prev, tables: [...prev.tables, copy] }));
                                }
                              }}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Duplicar
                            </button>
                            
                            <button
                              onClick={() => deleteTable(selectedTable)}
                              className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Canvas */}
                  <div className="lg:col-span-3">
                    <div className="bg-slate-700 rounded-lg p-4 h-96 relative overflow-hidden border-2 border-dashed border-slate-600">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-600/20 to-slate-800/20"></div>
                      
                      {/* Grid */}
                      <div className="absolute inset-0 opacity-20">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={`h-${i}`} className="absolute w-full h-px bg-slate-500" style={{ top: `${i * 5}%` }} />
                        ))}
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={`v-${i}`} className="absolute h-full w-px bg-slate-500" style={{ left: `${i * 5}%` }} />
                        ))}
                      </div>

                      {/* Tables */}
                      {tableLayout.tables.map(table => (
                        <div
                          key={table.id}
                          className={`absolute cursor-pointer transition-all ${
                            selectedTable === table.id ? 'ring-2 ring-amber-400' : ''
                          } ${
                            table.shape === 'circle' ? 'rounded-full' : 'rounded-lg'
                          }`}
                          style={{
                            left: `${table.x}px`,
                            top: `${table.y}px`,
                            width: `${table.width}px`,
                            height: `${table.height}px`,
                            backgroundColor: table.zone === 'vip' ? '#7c3aed' : 
                                           table.zone === 'exterior' ? '#059669' : 
                                           table.zone === 'bar' ? '#dc2626' : '#475569'
                          }}
                          onClick={() => setSelectedTable(table.id)}
                          onMouseDown={() => setDraggedTable(table.id)}
                        >
                          <div className="w-full h-full flex items-center justify-center text-white text-xs font-medium">
                            <div className="text-center">
                              <div>{table.number}</div>
                              <div className="text-xs opacity-75">{table.capacity}p</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Click to add table */}
                      {editorMode === 'add' && (
                        <div
                          className="absolute inset-0 cursor-crosshair"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            addTable(x, y);
                          }}
                        />
                      )}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-slate-500 rounded"></div>
                        <span className="text-slate-300">Interior</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                        <span className="text-slate-300">Exterior</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-600 rounded"></div>
                        <span className="text-slate-300">VIP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-600 rounded"></div>
                        <span className="text-slate-300">Barra</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reservation Rules Tab */}
            {activeTab === 'rules' && (
              <div className="p-6 space-y-8">
                <h3 className="text-lg font-semibold text-white">Reglas de Reserva</h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-4">Tiempos de Antelación</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Tiempo Mínimo de Antelación</label>
                          <select
                            value={reservationRules.minAdvanceTime}
                            onChange={(e) => setReservationRules(prev => ({ ...prev, minAdvanceTime: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 appearance-none"
                          >
                            <option value="30m">30 minutos</option>
                            <option value="1h">1 hora</option>
                            <option value="2h">2 horas</option>
                            <option value="4h">4 horas</option>
                            <option value="1d">1 día</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Tiempo Máximo de Antelación</label>
                          <select
                            value={reservationRules.maxAdvanceTime}
                            onChange={(e) => setReservationRules(prev => ({ ...prev, maxAdvanceTime: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 appearance-none"
                          >
                            <option value="7d">7 días</option>
                            <option value="15d">15 días</option>
                            <option value="30d">30 días</option>
                            <option value="60d">60 días</option>
                            <option value="90d">90 días</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Políticas de Cancelación</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Tiempo Límite para Cancelación Gratuita</label>
                          <select
                            value={reservationRules.cancellationPolicy.freeUntil}
                            onChange={(e) => setReservationRules(prev => ({ 
                              ...prev, 
                              cancellationPolicy: { ...prev.cancellationPolicy, freeUntil: e.target.value }
                            }))}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 appearance-none"
                          >
                            <option value="2h">2 horas antes</option>
                            <option value="4h">4 horas antes</option>
                            <option value="12h">12 horas antes</option>
                            <option value="24h">24 horas antes</option>
                            <option value="48h">48 horas antes</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Penalización por Cancelación Tardía (%)</label>
                          <input
                            type="number"
                            value={reservationRules.cancellationPolicy.lateFee}
                            onChange={(e) => setReservationRules(prev => ({ 
                              ...prev, 
                              cancellationPolicy: { ...prev.cancellationPolicy, lateFee: parseInt(e.target.value) }
                            }))}
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-4">Depósitos y Garantías</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={reservationRules.requireDeposit}
                            onChange={(e) => setReservationRules(prev => ({ ...prev, requireDeposit: e.target.checked }))}
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Requerir depósito para reservas</label>
                        </div>

                        {reservationRules.requireDeposit && (
                          <>
                            <div>
                              <label className="block text-sm text-slate-300 mb-2">Monto del Depósito (€)</label>
                              <input
                                type="number"
                                value={reservationRules.depositAmount}
                                onChange={(e) => setReservationRules(prev => ({ ...prev, depositAmount: parseFloat(e.target.value) }))}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400"
                                min="0"
                                step="0.01"
                              />
                            </div>

                            <div>
                              <label className="block text-sm text-slate-300 mb-2">Depósito requerido para grupos de</label>
                              <input
                                type="number"
                                value={reservationRules.depositRequiredForGroups}
                                onChange={(e) => setReservationRules(prev => ({ ...prev, depositRequiredForGroups: parseInt(e.target.value) }))}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400"
                                min="1"
                              />
                              <p className="text-slate-400 text-sm mt-1">personas o más</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Fechas Especiales</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={reservationRules.specialDates.enabled}
                            onChange={(e) => setReservationRules(prev => ({ 
                              ...prev, 
                              specialDates: { ...prev.specialDates, enabled: e.target.checked }
                            }))}
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Aplicar reglas especiales en fechas festivas</label>
                        </div>

                        {reservationRules.specialDates.enabled && (
                          <div>
                            <label className="block text-sm text-slate-300 mb-2">Depósito adicional en fechas especiales (€)</label>
                            <input
                              type="number"
                              value={reservationRules.specialDates.extraDeposit}
                              onChange={(e) => setReservationRules(prev => ({ 
                                ...prev, 
                                specialDates: { ...prev.specialDates, extraDeposit: parseFloat(e.target.value) }
                              }))}
                              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Experience Tab */}
            {activeTab === 'experience' && (
              <div className="p-6 space-y-8">
                <h3 className="text-lg font-semibold text-white">Personalización de Experiencia</h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-4">Menús Especiales</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Menú degustación disponible</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Menú vegetariano/vegano</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Menú sin gluten</label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Preferencias Dietéticas</h4>
                      <div className="space-y-3">
                        {['Vegetariano', 'Vegano', 'Sin Gluten', 'Sin Lactosa', 'Kosher', 'Halal'].map(diet => (
                          <div key={diet} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                            />
                            <label className="text-slate-300">{diet}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-4">Notificaciones Automáticas</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Confirmación de reserva por email</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Recordatorio 24h antes</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">SMS de confirmación</label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Lista de Espera</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Habilitar lista de espera</label>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Tiempo máximo en lista de espera (minutos)</label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400"
                            defaultValue={30}
                            min="5"
                            max="120"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Eventos Privados</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Permitir reservas de eventos privados</label>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-300 mb-2">Capacidad mínima para eventos privados</label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400"
                            defaultValue={20}
                            min="10"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="p-6 space-y-8">
                <h3 className="text-lg font-semibold text-white">Analítica y Reportes</h3>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-4">Métricas de Ocupación</h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300">Ocupación Promedio</span>
                            <span className="text-white font-semibold">78%</span>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300">Hora Pico</span>
                            <span className="text-white font-semibold">20:00 - 22:00</span>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300">Mesa Más Popular</span>
                            <span className="text-white font-semibold">Mesa 5 (Ventana)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Patrones de Reserva</h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300">Día Más Concurrido</span>
                            <span className="text-white font-semibold">Sábado</span>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300">Tamaño Promedio de Grupo</span>
                            <span className="text-white font-semibold">3.2 personas</span>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300">Tiempo Promedio de Estancia</span>
                            <span className="text-white font-semibold">1h 45min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-white font-medium mb-4">Estadísticas de Cancelaciones</h4>
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300">Tasa de Cancelación</span>
                            <span className="text-white font-semibold">12%</span>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-slate-300">No-Shows</span>
                            <span className="text-white font-semibold">5%</span>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Clientes Frecuentes</h4>
                      <div className="space-y-3">
                        {[
                          { name: 'María García', visits: 12 },
                          { name: 'Carlos López', visits: 8 },
                          { name: 'Ana Martín', visits: 6 },
                          { name: 'Pedro Ruiz', visits: 5 }
                        ].map(customer => (
                          <div key={customer.name} className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                            <span className="text-white">{customer.name}</span>
                            <span className="text-amber-400 font-semibold">{customer.visits} visitas</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-4">Configuración de Reportes</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Reporte diario automático</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Reporte semanal de ocupación</label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-amber-500 bg-slate-600 border-slate-500 rounded focus:ring-amber-400"
                          />
                          <label className="text-slate-300">Alertas de baja ocupación</label>
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
    </div>
  );
};