import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  RefreshCw,
  Calendar,
  User,
  Phone,
  MessageSquare,
  X,
  Zap,
  Target,
  Users,
  BarChart3
} from 'lucide-react';
import { emailService } from '../services/emailService';
import { reservationService } from '../services/reservationService';
import { EmailMarketingDashboard } from './EmailMarketingDashboard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmailNotificationPanelProps {
  reservationId?: string;
  onClose: () => void;
}

interface EmailLog {
  type: string;
  to: string;
  reservationId: string;
  customerName: string;
  sentAt: string;
}

export const EmailNotificationPanel: React.FC<EmailNotificationPanelProps> = ({ 
  reservationId, 
  onClose 
}) => {
  const [emailHistory, setEmailHistory] = useState<EmailLog[]>([]);
  const [scheduledReminders, setScheduledReminders] = useState<any[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'scheduled' | 'send' | 'marketing'>('history');
  const [showMarketingDashboard, setShowMarketingDashboard] = useState(false);

  useEffect(() => {
    loadEmailData();
    if (reservationId) {
      loadReservationDetails();
    }
  }, [reservationId]);

  const loadEmailData = () => {
    const history = emailService.getEmailHistory();
    const scheduled = JSON.parse(localStorage.getItem('scheduled_reminders') || '[]');
    
    if (reservationId) {
      setEmailHistory(history.filter(log => log.reservationId === reservationId));
      setScheduledReminders(scheduled.filter(reminder => reminder.reservationId === reservationId));
    } else {
      setEmailHistory(history);
      setScheduledReminders(scheduled);
    }
  };

  const loadReservationDetails = () => {
    if (reservationId) {
      const reservations = reservationService.getAllReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      setSelectedReservation(reservation);
    }
  };

  const handleResendConfirmation = async () => {
    if (!reservationId) return;
    
    setSendingEmail('confirmation');
    try {
      const result = await reservationService.resendConfirmationEmail(reservationId);
      
      if (result.success) {
        alert('Email de confirmación reenviado exitosamente');
        loadEmailData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Error reenviando email');
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSendManualReminder = async () => {
    if (!reservationId) return;
    
    setSendingEmail('reminder');
    try {
      const result = await reservationService.sendManualReminder(reservationId);
      
      if (result.success) {
        alert('Recordatorio enviado exitosamente');
        loadEmailData();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Error enviando recordatorio');
    } finally {
      setSendingEmail(null);
    }
  };

  const getEmailTypeIcon = (type: string) => {
    switch (type) {
      case 'confirmation':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'cancellation':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'modification':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getEmailTypeName = (type: string) => {
    const names: Record<string, string> = {
      confirmation: 'Confirmación',
      reminder: 'Recordatorio',
      cancellation: 'Cancelación',
      modification: 'Modificación'
    };
    return names[type] || type;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm', { locale: es });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {reservationId ? 'Notificaciones de Reserva' : 'Panel de Email'}
            </h2>
            {selectedReservation && (
              <p className="text-slate-400 text-sm">
                {selectedReservation.customerName} - {formatDateTime(selectedReservation.date + 'T' + selectedReservation.time)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {!reservationId && (
              <button
                onClick={() => setShowMarketingDashboard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
              >
                <Target className="w-4 h-4" />
                Email Marketing
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 mr-2 inline" />
            Historial
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'scheduled'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 mr-2 inline" />
            Programados
          </button>
          {reservationId && (
            <button
              onClick={() => setActiveTab('send')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'send'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-4 h-4 mr-2 inline" />
              Enviar
            </button>
          )}
          {!reservationId && (
            <button
              onClick={() => setActiveTab('marketing')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'marketing'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-4 h-4 mr-2 inline" />
              Marketing
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Historial de Emails</h3>
                <button
                  onClick={loadEmailData}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </button>
              </div>

              {emailHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No hay emails enviados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailHistory.map((log, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getEmailTypeIcon(log.type)}
                          <span className="text-white font-medium">
                            {getEmailTypeName(log.type)}
                          </span>
                        </div>
                        <span className="text-slate-400 text-sm">
                          {formatDateTime(log.sentAt)}
                        </span>
                      </div>
                      <div className="text-slate-300 text-sm">
                        <div>Para: {log.to}</div>
                        <div>Cliente: {log.customerName}</div>
                        {!reservationId && (
                          <div>Reserva: #{log.reservationId}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'scheduled' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Recordatorios Programados</h3>

              {scheduledReminders.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No hay recordatorios programados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledReminders.map((reminder, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-medium">
                            Recordatorio {reminder.sent ? '(Enviado)' : '(Pendiente)'}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          reminder.sent 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-blue-900/20 text-blue-400'
                        }`}>
                          {reminder.sent ? 'Enviado' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="text-slate-300 text-sm">
                        <div>Cliente: {reminder.customerName}</div>
                        <div>Email: {reminder.email}</div>
                        <div>Programado para: {formatDateTime(reminder.reminderTime)}</div>
                        {!reservationId && (
                          <div>Reserva: #{reminder.reservationId}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'send' && selectedReservation && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-white">Enviar Notificaciones</h3>

              {/* Reservation Details */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Detalles de la Reserva</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{selectedReservation.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{selectedReservation.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{selectedReservation.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">
                      {formatDateTime(selectedReservation.date + 'T' + selectedReservation.time)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Send Actions */}
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Email de Confirmación</h4>
                      <p className="text-slate-400 text-sm">
                        Reenviar email de confirmación con todos los detalles de la reserva
                      </p>
                    </div>
                    <button
                      onClick={handleResendConfirmation}
                      disabled={sendingEmail === 'confirmation'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        sendingEmail === 'confirmation'
                          ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {sendingEmail === 'confirmation' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Reenviar Confirmación
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Recordatorio Manual</h4>
                      <p className="text-slate-400 text-sm">
                        Enviar recordatorio inmediato sobre la reserva
                      </p>
                    </div>
                    <button
                      onClick={handleSendManualReminder}
                      disabled={sendingEmail === 'reminder'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        sendingEmail === 'reminder'
                          ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {sendingEmail === 'reminder' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          Enviar Recordatorio
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Email Preview */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">Vista Previa del Email</h4>
                <div className="bg-slate-800 rounded-lg p-4 text-sm">
                  <div className="text-slate-300 mb-2">
                    <strong>Para:</strong> {selectedReservation.email}
                  </div>
                  <div className="text-slate-300 mb-2">
                    <strong>Asunto:</strong> Confirmación de Reserva - Bella Vista
                  </div>
                  <div className="text-slate-400 text-xs">
                    El email incluirá todos los detalles de la reserva, información de contacto 
                    del restaurante y enlaces para modificar o cancelar la reserva.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Email Marketing</h3>
                <button
                  onClick={() => setShowMarketingDashboard(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Abrir Dashboard Completo
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-6 h-6 text-purple-400" />
                    <span className="text-slate-300">Campañas Activas</span>
                  </div>
                  <p className="text-white text-2xl font-bold">3</p>
                  <p className="text-slate-400 text-sm">En progreso</p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-6 h-6 text-blue-400" />
                    <span className="text-slate-300">Suscriptores</span>
                  </div>
                  <p className="text-white text-2xl font-bold">2,150</p>
                  <p className="text-slate-400 text-sm">Con consentimiento</p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-6 h-6 text-green-400" />
                    <span className="text-slate-300">Tasa de Apertura</span>
                  </div>
                  <p className="text-white text-2xl font-bold">42.5%</p>
                  <p className="text-slate-400 text-sm">Promedio mensual</p>
                </div>
              </div>

              {/* Recent Campaigns */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-4">Campañas Recientes</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Promoción Navidad 2024</p>
                      <p className="text-slate-400 text-sm">Enviada hace 2 días</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-medium">45.2% apertura</p>
                      <p className="text-slate-400 text-sm">1,250 destinatarios</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                    <div>
                      <p className="text-white font-medium">Newsletter Enero</p>
                      <p className="text-slate-400 text-sm">Borrador</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 font-medium">Pendiente</p>
                      <p className="text-slate-400 text-sm">2,100 destinatarios</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-left">
                  <Send className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Nueva Campaña</p>
                    <p className="text-slate-400 text-sm">Crear campaña promocional</p>
                  </div>
                </button>

                <button className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-left">
                  <Users className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Gestionar Segmentos</p>
                    <p className="text-slate-400 text-sm">Organizar listas de clientes</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div>
              {emailHistory.length > 0 && (
                <span>Total emails enviados: {emailHistory.length}</span>
              )}
            </div>
            <div>
              Sistema de notificaciones activo
            </div>
          </div>
        </div>

        {/* Email Marketing Dashboard Modal */}
        {showMarketingDashboard && (
          <EmailMarketingDashboard
            onClose={() => setShowMarketingDashboard(false)}
          />
        )}
      </div>
    </div>
  );
};