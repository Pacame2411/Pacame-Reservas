import React from 'react';
import { MapPin } from 'lucide-react';
import { ReservationForm } from './ReservationForm';

export const CustomerView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-light mb-4 tracking-wide">
            Bella Vista
          </h1>
          <div className="w-24 h-px bg-amber-400 mx-auto mb-6"></div>
          <p className="text-xl text-slate-300 font-light mb-8">
            Cocina Mediterránea Contemporánea
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <MapPin className="w-5 h-5 text-amber-400" />
            <span className="text-lg font-light">C/ Gran Vía 123, Madrid</span>
          </div>
        </div>
      </div>

      {/* Reservation Section */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-slate-800 mb-4">
            Reserva tu Mesa
          </h2>
          <p className="text-slate-600 text-lg font-light">
            Completa el formulario para asegurar tu experiencia gastronómica
          </p>
        </div>

        {/* Reservation Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 md:p-12">
            <ReservationForm />
          </div>
        </div>
      </div>
    </div>
  );
};