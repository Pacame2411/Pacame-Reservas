import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  User, 
  MessageSquare,
  X,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Timer,
  Hash
} from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { reservationService } from '../services/reservationService';
import { tableService } from '../services/tableService';
import { TimeSlot, Table } from '../types';

interface ManualReservationFormProps {
  onClose: () => void;
  onSuccess: (reservation: any) => void;
  editingReservation?: any;
}

export const ManualReservationForm: React.FC<ManualReservationFormProps> = ({ 
  onClose, 
  onSuccess, 
  editingReservation 
}) => {
  const [formData, setFormData] = useState({
    customerName: editingReservation?.customerName || '',
    email: editingReservation?.email || '',
    phone: editingReservation?.phone || '',
    date: editingReservation?.date || '',
    time: editingReservation?.time || '',
    guests: editingReservation?.guests || 2,
    tableType: editingReservation?.tableType || 'any',
    duration: editingReservation?.duration || 120,
    specialRequests: editingReservation?.specialRequests || '',
    assignedTable: editingReservation?.assignedTable || ''
  });

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [reservationNumber, setReservationNumber] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Cargar horarios disponibles cuando cambia la fecha
  useEffect(() => {
    if (formData.date) {
      const slots = reservationService.getAvailableTimeSlots(formData.date);
      setAvailableSlots(slots);
      
      // Limpiar hora seleccionada si ya no está disponible
      if (formData.time && !slots.find(slot => slot.time === formData.time && slot.available)) {
        setFormData(prev => ({ ...prev, time: '', assignedTable: '' }));
      }
    }
  }, [formData.date]);

  // Cargar mesas disponibles cuando cambian fecha, hora o número de comensales
  useEffect(() => {
    if (formData.date && formData.time && formData.guests) {
      const tables = tableService.getAvailableTables(
        formData.date, 
        formData.time, 
        formData.guests,
        formData.duration,
        formData.tableType
      );
      setAvailableTables(tables);
      
      // Limpiar mesa asignada si ya no está disponible
      if (formData.assignedTable && !tables.find(table => table.id === formData.assignedTable)) {
        setFormData(prev => ({ ...prev, assignedTable: '' }));
      }
    }
  }, [formData.date, formData.time, formData.guests, formData.duration, formData.tableType]);

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.customerName.trim()) {
        newErrors.customerName = 'El nombre es requerido';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'El email es requerido';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'El email no es válido';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'El teléfono es requerido';
      }
      if (formData.guests < 1 || formData.guests > 12) {
        newErrors.guests = 'El número de comensales debe ser entre 1 y 12';
      }
    }

    if (stepNumber === 2) {
      if (!formData.date) {
        newErrors.date = 'La fecha es requerida';
      }
      if (!formData.time) {
        newErrors.time = 'La hora es requerida';
      }
      if (formData.duration < 60 || formData.duration > 240) {
        newErrors.duration = 'La duración debe ser entre 60 y 240 minutos';
      }
    }

    if (stepNumber === 3) {
      // Validar disponibilidad
      if (formData.date && formData.time && formData.guests) {
        if (!reservationService.checkAvailability(formData.date, formData.time, formData.guests)) {
          newErrors.availability = 'No hay disponibilidad para la fecha, hora y número de comensales seleccionados';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      return;
    }

    setLoading(true);
    
    try {
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const reservationData = {
        ...formData,
        status: 'confirmed' as const,
        createdBy: 'manager'
      };

      let reservation;
      if (editingReservation) {
        // Actualizar reserva existente
        reservation = reservationService.updateReservation(editingReservation.id, reservationData);
      } else {
        // Crear nueva reserva
        reservation = reservationService.saveReservation(reservationData);
      }

      // Generar número de reserva
      const resNumber = `BV${Date.now().toString().slice(-6)}`;
      setReservationNumber(resNumber);
      setShowConfirmation(true);
      
      onSuccess(reservation);
      
    } catch (error) {
      setErrors({ submit: 'Error al procesar la reserva. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const sendConfirmationEmail = () => {
    // Simular envío de email
    console.log('📧 Enviando confirmación por email...');
    setTimeout(() => {
      alert('Email de confirmación enviado exitosamente');
    }, 1000);
  };

  // Generar fechas disponibles (próximos 60 días)
  const generateAvailableDates = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < 60; i++) {
      const date = addDays(today, i);
      dates.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'dd/MM/yyyy - EEEE')
      });
    }
    
    return dates;
  };

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">
              {editingReservation ? 'Reserva Actualizada' : 'Reserva Confirmada'}
            </h3>
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <p className="text-amber-400 font-mono text-lg">#{reservationNumber}</p>
              <p className="text-slate-300 text-sm mt-1">Número de reserva</p>
            </div>
            
            <div className="text-left space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="text-white">{formData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha:</span>
                <span className="text-white">{format(new Date(formData.date), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hora:</span>
                <span className="text-white">{formData.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Comensales:</span>
                <span className="text-white">{formData.guests}</span>
              </div>
              {formData.assignedTable && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Mesa:</span>
                  <span className="text-white">Mesa {formData.assignedTable}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={sendConfirmationEmail}
                className="flex-1 px-4 py-3 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-colors font-medium"
              >
                Enviar Email
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {editingReservation ? 'Editar Reserva' : 'Nueva Reserva Manual'}
            </h2>
            <p className="text-slate-400 text-sm">
              Paso {step} de 3 - {
                step === 1 ? 'Datos del Cliente' :
                step === 2 ? 'Detalles de la Reserva' :
                'Confirmación y Asignación'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step 
                    ? 'bg-amber-500 text-slate-900' 
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    stepNumber < step ? 'bg-amber-500' : 'bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-6">
          {errors.submit && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400">{errors.submit}</p>
            </div>
          )}

          {errors.availability && (
            <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-amber-400">{errors.availability}</p>
            </div>
          )}

          {/* Step 1: Customer Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">Información del Cliente</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                        errors.customerName ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder="Nombre completo del cliente"
                    />
                  </div>
                  {errors.customerName && (
                    <p className="text-red-400 text-sm mt-1">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                        errors.phone ? 'border-red-500' : 'border-slate-600'
                      }`}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors ${
                      errors.email ? 'border-red-500' : 'border-slate-600'
                    }`}
                    placeholder="email@ejemplo.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Número de Comensales *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <select
                    value={formData.guests}
                    onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-700 border rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors appearance-none ${
                      errors.guests ? 'border-red-500' : 'border-slate-600'
                    }`}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'persona' : 'personas'}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.guests && (
                  <p className="text-red-400 text-sm mt-1">{errors.guests}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Reservation Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">Detalles de la Reserva</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <select
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-700 border rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors appearance-none ${
                        errors.date ? 'border-red-500' : 'border-slate-600'
                      }`}
                    >
                      <option value="">Seleccionar fecha</option>
                      {generateAvailableDates().map(date => (
                        <option key={date.value} value={date.value}>
                          {date.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.date && (
                    <p className="text-red-400 text-sm mt-1">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hora *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <select
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-700 border rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors appearance-none ${
                        errors.time ? 'border-red-500' : 'border-slate-600'
                      }`}
                      disabled={!formData.date}
                    >
                      <option value="">Seleccionar hora</option>
                      {availableSlots.filter(slot => slot.available).map(slot => (
                        <option key={slot.time} value={slot.time}>
                          {slot.time} ({slot.maxCapacity - slot.currentReservations} espacios disponibles)
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.time && (
                    <p className="text-red-400 text-sm mt-1">{errors.time}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Mesa Preferida
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <select
                      value={formData.tableType}
                      onChange={(e) => handleInputChange('tableType', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors appearance-none"
                    >
                      <option value="any">Cualquier mesa</option>
                      <option value="window">Junto a ventana</option>
                      <option value="terrace">Terraza</option>
                      <option value="private">Zona privada</option>
                      <option value="bar">Barra</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duración Estimada (minutos) *
                  </label>
                  <div className="relative">
                    <Timer className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <select
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-700 border rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors appearance-none ${
                        errors.duration ? 'border-red-500' : 'border-slate-600'
                      }`}
                    >
                      <option value={60}>1 hora</option>
                      <option value={90}>1.5 horas</option>
                      <option value={120}>2 horas</option>
                      <option value={150}>2.5 horas</option>
                      <option value={180}>3 horas</option>
                      <option value={240}>4 horas</option>
                    </select>
                  </div>
                  {errors.duration && (
                    <p className="text-red-400 text-sm mt-1">{errors.duration}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notas Especiales
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    value={formData.specialRequests}
                    onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                    rows={3}
                    className="w-full pl-11 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors resize-none"
                    placeholder="Alergias, celebraciones especiales, preferencias específicas..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation and Table Assignment */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white mb-4">Confirmación y Asignación de Mesa</h3>
              
              {/* Reservation Summary */}
              <div className="bg-slate-700 rounded-lg p-6">
                <h4 className="font-medium text-white mb-4">Resumen de la Reserva</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cliente:</span>
                      <span className="text-white">{formData.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-white">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Teléfono:</span>
                      <span className="text-white">{formData.phone}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Fecha:</span>
                      <span className="text-white">{format(new Date(formData.date), 'dd/MM/yyyy')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hora:</span>
                      <span className="text-white">{formData.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Comensales:</span>
                      <span className="text-white">{formData.guests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duración:</span>
                      <span className="text-white">{formData.duration} min</span>
                    </div>
                  </div>
                </div>
                {formData.specialRequests && (
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <span className="text-slate-400 text-sm">Notas especiales:</span>
                    <p className="text-white text-sm mt-1">{formData.specialRequests}</p>
                  </div>
                )}
              </div>

              {/* Available Tables */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Mesas Disponibles
                </label>
                {availableTables.length === 0 ? (
                  <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                    <p className="text-amber-400 text-sm">
                      No hay mesas específicas disponibles, pero se puede acomodar la reserva con disponibilidad general.
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.assignedTable === ''
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                      }`}
                      onClick={() => handleInputChange('assignedTable', '')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                          <Hash className="w-5 h-5 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Asignación Automática</p>
                          <p className="text-slate-400 text-sm">El sistema asignará la mejor mesa</p>
                        </div>
                      </div>
                    </div>
                    
                    {availableTables.map(table => (
                      <div
                        key={table.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.assignedTable === table.id
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                        }`}
                        onClick={() => handleInputChange('assignedTable', table.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">Mesa {table.number}</p>
                            <p className="text-slate-400 text-sm">
                              {table.capacity} personas • {table.type}
                            </p>
                            {table.features && (
                              <p className="text-slate-500 text-xs">{table.features}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-slate-700">
            <div>
              {step > 1 && (
                <button
                  onClick={handlePrevious}
                  className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-medium"
                >
                  Anterior
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-medium"
              >
                Cancelar
              </button>
              
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-colors font-medium"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    loading
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Procesando...
                    </span>
                  ) : (
                    editingReservation ? 'Actualizar Reserva' : 'Confirmar Reserva'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};