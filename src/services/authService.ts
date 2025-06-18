import { User, LoginCredentials, AuthState } from '../types';

// Credenciales predefinidas para el gerente (en producción esto estaría en una base de datos)
const MANAGER_CREDENTIALS = {
  username: 'gerente',
  password: 'admin123', // En producción esto estaría hasheado
  user: {
    id: '1',
    username: 'gerente',
    role: 'manager' as const,
    name: 'Gerente del Restaurante',
    email: 'gerente@bellavista.com'
  }
};

class AuthService {
  private storageKey = 'restaurant_auth';
  private sessionTimeout = 8 * 60 * 60 * 1000; // 8 horas en milisegundos

  // Obtener estado de autenticación actual
  getCurrentAuth(): AuthState {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return { user: null, isAuthenticated: false, isLoading: false };
      }

      const authData = JSON.parse(stored);
      
      // Verificar si la sesión ha expirado
      if (this.isSessionExpired(authData.timestamp)) {
        this.logout();
        return { user: null, isAuthenticated: false, isLoading: false };
      }

      return {
        user: authData.user,
        isAuthenticated: true,
        isLoading: false
      };
    } catch (error) {
      console.error('Error al obtener estado de autenticación:', error);
      return { user: null, isAuthenticated: false, isLoading: false };
    }
  }

  // Iniciar sesión
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validar credenciales
      if (credentials.username === MANAGER_CREDENTIALS.username && 
          credentials.password === MANAGER_CREDENTIALS.password) {
        
        const user: User = {
          ...MANAGER_CREDENTIALS.user,
          lastLogin: new Date().toISOString()
        };

        // Guardar en localStorage con timestamp
        const authData = {
          user,
          timestamp: Date.now()
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(authData));

        // Log de seguridad
        this.logSecurityEvent('LOGIN_SUCCESS', user.username);

        return { success: true, user };
      } else {
        // Log de intento fallido
        this.logSecurityEvent('LOGIN_FAILED', credentials.username);
        return { success: false, error: 'Credenciales incorrectas' };
      }
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // Cerrar sesión
  logout(): void {
    const currentAuth = this.getCurrentAuth();
    if (currentAuth.user) {
      this.logSecurityEvent('LOGOUT', currentAuth.user.username);
    }
    
    localStorage.removeItem(this.storageKey);
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.getCurrentAuth().isAuthenticated;
  }

  // Verificar si el usuario tiene rol de gerente
  isManager(): boolean {
    const auth = this.getCurrentAuth();
    return auth.isAuthenticated && auth.user?.role === 'manager';
  }

  // Verificar si la sesión ha expirado
  private isSessionExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.sessionTimeout;
  }

  // Renovar sesión
  renewSession(): void {
    const auth = this.getCurrentAuth();
    if (auth.isAuthenticated && auth.user) {
      const authData = {
        user: auth.user,
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(authData));
    }
  }

  // Log de eventos de seguridad
  private logSecurityEvent(event: string, username: string): void {
    const logEntry = {
      event,
      username,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: 'localhost' // En producción obtener IP real
    };
    
    console.log('🔐 Evento de seguridad:', logEntry);
    
    // En producción, enviar a un servicio de logging
    const securityLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    securityLogs.push(logEntry);
    
    // Mantener solo los últimos 100 logs
    if (securityLogs.length > 100) {
      securityLogs.splice(0, securityLogs.length - 100);
    }
    
    localStorage.setItem('security_logs', JSON.stringify(securityLogs));
  }

  // Obtener logs de seguridad (solo para gerentes)
  getSecurityLogs(): any[] {
    if (!this.isManager()) {
      throw new Error('Acceso denegado');
    }
    
    return JSON.parse(localStorage.getItem('security_logs') || '[]');
  }

  // Cambiar contraseña (funcionalidad básica)
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'No autenticado' };
    }

    if (currentPassword !== MANAGER_CREDENTIALS.password) {
      return { success: false, error: 'Contraseña actual incorrecta' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' };
    }

    // En producción, aquí actualizarías la base de datos
    console.log('⚠️ Cambio de contraseña simulado - En producción actualizar BD');
    
    return { success: true };
  }
}

export const authService = new AuthService();