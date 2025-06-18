import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CustomerView } from './components/CustomerView';
import { ReservationDashboard } from './components/ReservationDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { authService } from './services/authService';
import { reservationService } from './services/reservationService';

function App() {
  const [currentView, setCurrentView] = useState<'customer' | 'dashboard'>('customer');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar estado de autenticación al cargar la app
    const checkAuth = () => {
      const authState = authService.getCurrentAuth();
      setIsAuthenticated(authState.isAuthenticated);
      setLoading(false);
    };

    checkAuth();

    // Inicializar sistema de recordatorios de email
    reservationService.initializeReminderCheck();

    // Renovar sesión cada 5 minutos si está autenticado
    const renewInterval = setInterval(() => {
      if (authService.isAuthenticated()) {
        authService.renewSession();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(renewInterval);
  }, []);

  const handleViewChange = (view: 'customer' | 'dashboard') => {
    setCurrentView(view);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('customer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header solo se muestra en vista pública */}
      {currentView === 'customer' && (
        <Header currentView={currentView} onViewChange={handleViewChange} />
      )}
      
      {currentView === 'customer' ? (
        <CustomerView />
      ) : (
        <ProtectedRoute onLoginSuccess={handleLoginSuccess}>
          {isAuthenticated ? (
            <ManagerDashboard onLogout={handleLogout} />
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <ReservationDashboard />
            </div>
          )}
        </ProtectedRoute>
      )}
    </div>
  );
}

export default App;