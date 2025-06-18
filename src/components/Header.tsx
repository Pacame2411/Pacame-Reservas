import React from 'react';
import { Shield } from 'lucide-react';

interface HeaderProps {
  currentView: 'customer' | 'dashboard';
  onViewChange: (view: 'customer' | 'dashboard') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-light text-slate-800">Bella Vista</h1>
          </div>

          {/* Admin Access */}
          <button
            onClick={() => onViewChange('dashboard')}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors text-sm"
          >
            <Shield className="w-4 h-4" />
            Acceso Gerente
          </button>
        </div>
      </div>
    </header>
  );
};