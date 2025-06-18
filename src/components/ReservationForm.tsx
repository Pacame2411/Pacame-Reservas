import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, Mail, User, CheckCircle } from 'lucide-react';
import { format, addDays, startOfDay } from 'date-fns';
import { reservationService } from '../services/reservationService';
import { TimeSlot } from '../types';

interface ReservationFormProps {
  onSuccess?: () => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    specialRequests: ''
  });

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar horarios disponibles cuando cambia la fecha
  useEffect(() => {
    if (formData.date) {
      const slots = reservationService.getAvailableTimeSlots(formData.date);
      setAvailableSlots(slots);
      
      // Limpiar hora seleccionada si ya no está disponible
      if (formData.time && !slots.find(slot => slot.time === formData.time && slot.available)) {
        setFormData(prev => ({ ...prev, time: '' }));
      }
    }
  }, [formData.date]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

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

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }

    if (!formData.time) {
      newErrors.time = 'La hora es requerida';
    }

    if (formData.guests < 1 || formData.guests > 12) {
      newErrors.guests = 'El número de comensales debe ser entre 1 y 12';
    }

    // Validar disponibilidad
    if (formData.date && formData.time && formData.guests) {
      if (!reservationService.checkAvailability(formData.date, formData.time, formData.guests)) {
        newErrors.availability = 'No hay disponibilidad para la fecha, hora y número de comensales seleccionados';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reservation = reservationService.saveReservation({
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        date: formData.date,
        time: formData.time,
        guests: formData.guests,
        specialRequests: formData.specialRequests
      });

      setSuccess(true);
      
      // Reset form
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        guests: 2,
        specialRequests: ''
      });
      
      onSuccess?.();
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
      
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

  // Generar fechas disponibles (próximos 30 días)
  const generateAvailableDates = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      dates.push({
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'dd/MM/yyyy')
      });
    }
    
    return dates;
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-light text-slate-800 mb-4">
          Reserva Confirmada
        </h3>
        <p className="text-slate-600 mb-8 text-lg">
          Te hemos enviado un email de confirmación con todos los detalles.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-slate-800 text-white px-8 py-3 rounded-lg hover:bg-slate-700 transition-colors font-medium"
        >
          Nueva Reserva
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-center">
          {errors.submit}
        </div>
      )}

      {errors.availability && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700 text-center">
          {errors.availability}
        </div>
      )}

      {/* Personal Information */}
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Nombre Completo
            </label>
            <div className="relative">
              <User className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-slate-800 ${
                  errors.customerName ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                }`}
                placeholder="Tu nombre completo"
              />
            </div>
            {errors.customerName && (
              <p className="text-red-500 text-sm mt-2">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-slate-800 ${
                  errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                }`}
                placeholder="+34 600 000 000"
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-2">{errors.phone}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-slate-800 ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
              }`}
              placeholder="tu@email.com"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-2">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Reservation Details */}
      <div className="border-t border-slate-200 pt-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Fecha
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <select
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-slate-800 appearance-none ${
                  errors.date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
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
              <p className="text-red-500 text-sm mt-2">{errors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Comensales
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <select
                value={formData.guests}
                onChange={(e) => handleInputChange('guests', parseInt(e.target.value))}
                className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-slate-800 appearance-none ${
                  errors.guests ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
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
              <p className="text-red-500 text-sm mt-2">{errors.guests}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Hora
            </label>
            <div className="relative">
              <Clock className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              <select
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-slate-800 appearance-none ${
                  errors.time ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                }`}
                disabled={!formData.date}
              >
                <option value="">Seleccionar hora</option>
                {availableSlots.filter(slot => slot.available).map(slot => (
                  <option key={slot.time} value={slot.time}>
                    {slot.time}
                  </option>
                ))}
              </select>
            </div>
            {errors.time && (
              <p className="text-red-500 text-sm mt-2">{errors.time}</p>
            )}
          </div>
        </div>
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          Peticiones Especiales (Opcional)
        </label>
        <textarea
          value={formData.specialRequests}
          onChange={(e) => handleInputChange('specialRequests', e.target.value)}
          rows={3}
          className="w-full px-4 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none text-slate-800"
          placeholder="Alergias, celebraciones especiales, preferencias de mesa..."
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 px-6 rounded-xl text-white font-medium text-lg transition-all ${
            loading
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Procesando Reserva...
            </span>
          ) : (
            'Confirmar Reserva'
          )}
        </button>
      </div>
    </form>
  );
};