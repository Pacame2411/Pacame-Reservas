import React from 'react';
import { authService } from '../services/authService';
import { LoginForm } from './LoginForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onLoginSuccess?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  onLoginSuccess 
}) => {
  const isAuthenticated = authService.isAuthenticated();

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={onLoginSuccess || (() => {})} />;
  }

  return <>{children}</>;
};