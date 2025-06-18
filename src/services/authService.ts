import { User, LoginCredentials, AuthState } from '../types';
import { supabase } from '../utils/supabase';

class AuthService {
  private securityLogsKey = 'security_logs';

  // Obtener estado de autenticación actual
  async getCurrentAuth(): Promise<AuthState> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error al obtener sesión:', error);
        return { user: null, isAuthenticated: false, isLoading: false };
      }

      if (!session) {
        return { user: null, isAuthenticated: false, isLoading: false };
      }

      // Convertir el usuario de Supabase al formato de nuestra aplicación
      const user: User = {
        id: session.user.id,
        username: session.user.email || 'usuario',
        role: 'manager', // Por ahora, todos los usuarios autenticados son managers
        name: session.user.user_metadata?.full_name || session.user.email || 'Usuario',
        email: session.user.email || '',
        lastLogin: session.user.last_sign_in_at || new Date().toISOString()
      };

      return {
        user,
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
      // Usar email como username para Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.username,
        password: credentials.password
      });

      if (error) {
        // Log de intento fallido
        this.logSecurityEvent('LOGIN_FAILED', credentials.username);
        return { success: false, error: this.translateSupabaseError(error.message) };
      }

      if (data.user) {
        // Convertir el usuario de Supabase al formato de nuestra aplicación
        const user: User = {
          id: data.user.id,
          username: data.user.email || 'usuario',
          role: 'manager', // Por ahora, todos los usuarios autenticados son managers
          name: data.user.user_metadata?.full_name || data.user.email || 'Usuario',
          email: data.user.email || '',
          lastLogin: data.user.last_sign_in_at || new Date().toISOString()
        };

        // Log de éxito
        this.logSecurityEvent('LOGIN_SUCCESS', user.username);

        return { success: true, user };
      }

      return { success: false, error: 'Error desconocido durante la autenticación' };
    } catch (error) {
      console.error('Error en login:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      const currentAuth = await this.getCurrentAuth();
      if (currentAuth.user) {
        this.logSecurityEvent('LOGOUT', currentAuth.user.username);
      }
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error al cerrar sesión:', error);
      }
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }

  // Verificar si el usuario está autenticado
  async isAuthenticated(): Promise<boolean> {
    const auth = await this.getCurrentAuth();
    return auth.isAuthenticated;
  }

  // Verificar si el usuario tiene rol de gerente
  async isManager(): Promise<boolean> {
    const auth = await this.getCurrentAuth();
    // Por ahora, cualquier usuario autenticado es considerado manager
    // En el futuro, esto se puede expandir para verificar roles en la base de datos
    return auth.isAuthenticated && auth.user?.role === 'manager';
  }

  // Traducir errores de Supabase a mensajes más amigables
  private translateSupabaseError(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Credenciales incorrectas',
      'Email not confirmed': 'Email no confirmado',
      'Too many requests': 'Demasiados intentos. Inténtalo más tarde',
      'User not found': 'Usuario no encontrado',
      'Invalid email': 'Email inválido',
      'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres'
    };

    return errorMap[errorMessage] || 'Error de autenticación';
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
    
    // Mantener logs en localStorage por ahora
    // En el futuro, esto se puede migrar a una tabla de Supabase
    const securityLogs = JSON.parse(localStorage.getItem(this.securityLogsKey) || '[]');
    securityLogs.push(logEntry);
    
    // Mantener solo los últimos 100 logs
    if (securityLogs.length > 100) {
      securityLogs.splice(0, securityLogs.length - 100);
    }
    
    localStorage.setItem(this.securityLogsKey, JSON.stringify(securityLogs));
  }

  // Obtener logs de seguridad (solo para gerentes)
  async getSecurityLogs(): Promise<any[]> {
    const isManagerUser = await this.isManager();
    if (!isManagerUser) {
      throw new Error('Acceso denegado');
    }
    
    return JSON.parse(localStorage.getItem(this.securityLogsKey) || '[]');
  }

  // Cambiar contraseña
  async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        return { success: false, error: 'No autenticado' };
      }

      if (newPassword.length < 6) {
        return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: this.translateSupabaseError(error.message) };
      }

      this.logSecurityEvent('PASSWORD_CHANGED', 'usuario');
      return { success: true };
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // Registrar nuevo usuario (para administradores)
  async registerUser(email: string, password: string, userData?: { full_name?: string }): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const isManagerUser = await this.isManager();
      if (!isManagerUser) {
        return { success: false, error: 'Acceso denegado' };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData || {}
        }
      });

      if (error) {
        return { success: false, error: this.translateSupabaseError(error.message) };
      }

      if (data.user) {
        const user: User = {
          id: data.user.id,
          username: data.user.email || 'usuario',
          role: 'manager',
          name: userData?.full_name || data.user.email || 'Usuario',
          email: data.user.email || '',
          lastLogin: data.user.created_at || new Date().toISOString()
        };

        this.logSecurityEvent('USER_REGISTERED', email);
        return { success: true, user };
      }

      return { success: false, error: 'Error desconocido durante el registro' };
    } catch (error) {
      console.error('Error en registro:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // Obtener información del usuario actual
  async getCurrentUser(): Promise<User | null> {
    const auth = await this.getCurrentAuth();
    return auth.user;
  }

  // Escuchar cambios en el estado de autenticación
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Verificar si el email está confirmado
  async isEmailConfirmed(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.email_confirmed_at != null;
    } catch (error) {
      console.error('Error verificando confirmación de email:', error);
      return false;
    }
  }

  // Reenviar email de confirmación
  async resendConfirmation(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        return { success: false, error: this.translateSupabaseError(error.message) };
      }

      return { success: true };
    } catch (error) {
      console.error('Error reenviando confirmación:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // Solicitar restablecimiento de contraseña
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: this.translateSupabaseError(error.message) };
      }

      return { success: true };
    } catch (error) {
      console.error('Error solicitando restablecimiento:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}

export const authService = new AuthService();