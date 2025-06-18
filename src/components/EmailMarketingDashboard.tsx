import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  Plus,
  Edit,
  Eye,
  Copy,
  Trash2,
  Play,
  Pause,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Search,
  Download,
  Upload,
  Zap,
  Palette,
  Code,
  Image,
  Type,
  Link,
  Smartphone,
  Monitor,
  Globe,
  Shield,
  UserCheck,
  UserX,
  FileText,
  PieChart
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { emailMarketingService } from '../services/emailMarketingService';
import { EmailCampaignEditor } from './EmailCampaignEditor';
import { EmailTemplateLibrary } from './EmailTemplateLibrary';
import { EmailAnalyticsDashboard } from './EmailAnalyticsDashboard';

interface EmailMarketingDashboardProps {
  onClose: () => void;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  type: 'promotional' | 'newsletter' | 'welcome' | 'retention' | 'reactivation';
  segmentId: string;
  segmentName: string;
  recipientCount: number;
  scheduledDate?: string;
  createdAt: string;
  sentAt?: string;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  template: {
    html: string;
    text: string;
    previewText: string;
  };
  abTest?: {
    enabled: boolean;
    variants: Array<{
      id: string;
      name: string;
      subject: string;
      percentage: number;
    }>;
  };
}

interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: {
    lastReservation: { operator: 'before' | 'after' | 'between'; value: string | string[] };
    totalReservations: { operator: 'gt' | 'lt' | 'eq' | 'between'; value: number | number[] };
    customerCategory: 'VIP' | 'Regular' | 'Ocasional' | 'all';
    hasConsent: boolean;
    isActive: boolean;
  };
  recipientCount: number;
  createdAt: string;
  lastUpdated: string;
}

export const EmailMarketingDashboard: React.FC<EmailMarketingDashboardProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'segments' | 'templates' | 'analytics' | 'settings'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [showCampaignEditor, setShowCampaignEditor] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [marketingStats, setMarketingStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalSent: 0,
    averageOpenRate: 0,
    averageClickRate: 0,
    totalSubscribers: 0,
    consentRate: 0,
    unsubscribeRate: 0
  });

  useEffect(() => {
    loadMarketingData();
  }, []);

  const loadMarketingData = async () => {
    setLoading(true);
    try {
      const [campaignsData, segmentsData, stats] = await Promise.all([
        emailMarketingService.getAllCampaigns(),
        emailMarketingService.getAllSegments(),
        emailMarketingService.getMarketingStats()
      ]);

      setCampaigns(campaignsData);
      setSegments(segmentsData);
      setMarketingStats(stats);
    } catch (error) {
      console.error('Error cargando datos de marketing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setShowCampaignEditor(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowCampaignEditor(true);
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      await emailMarketingService.duplicateCampaign(campaign.id);
      loadMarketingData();
    } catch (error) {
      console.error('Error duplicando campaña:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta campaña?')) {
      try {
        await emailMarketingService.deleteCampaign(campaignId);
        loadMarketingData();
      } catch (error) {
        console.error('Error eliminando campaña:', error);
      }
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (window.confirm('¿Estás seguro de que quieres enviar esta campaña ahora?')) {
      try {
        await emailMarketingService.sendCampaign(campaignId);
        loadMarketingData();
      } catch (error) {
        console.error('Error enviando campaña:', error);
      }
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      await emailMarketingService.pauseCampaign(campaignId);
      loadMarketingData();
    } catch (error) {
      console.error('Error pausando campaña:', error);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'sending':
        return <Send className="w-4 h-4 text-orange-500 animate-pulse" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'promotional':
        return <Target className="w-4 h-4 text-purple-500" />;
      case 'newsletter':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'welcome':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'retention':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'reactivation':
        return <Zap className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Cargando Email Marketing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-semibold text-white">Email Marketing</h2>
            <p className="text-slate-400 text-sm">
              Gestión completa de campañas y automatización de emails
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleCreateCampaign}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Campaña
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6 border-b border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400 text-sm">Campañas</span>
              </div>
              <p className="text-white text-lg font-bold">{marketingStats.totalCampaigns}</p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Play className="w-4 h-4 text-green-400" />
                <span className="text-slate-400 text-sm">Activas</span>
              </div>
              <p className="text-white text-lg font-bold">{marketingStats.activeCampaigns}</p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-purple-400" />
                <span className="text-slate-400 text-sm">Enviados</span>
              </div>
              <p className="text-white text-lg font-bold">{marketingStats.totalSent.toLocaleString()}</p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400 text-sm">Apertura</span>
              </div>
              <p className="text-white text-lg font-bold">{marketingStats.averageOpenRate.toFixed(1)}%</p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400 text-sm">Clicks</span>
              </div>
              <p className="text-white text-lg font-bold">{marketingStats.averageClickRate.toFixed(1)}%</p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400 text-sm">Suscriptores</span>
              </div>
              <p className="text-white text-lg font-bold">{marketingStats.totalSubscribers}</p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-slate-400 text-sm">Consentimiento</span>
              </div>
              <p className="text-white text-lg font-bold">{marketingStats.consentRate.toFixed(1)}%</p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="w-4 h-4 text-red-400" />
                <span className="text-slate-400 text-sm">Bajas</span>
              </div>
              <p className="text-white text-lg font-bold">{marketingStats.unsubscribeRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 mr-2 inline" />
            Campañas
          </button>
          <button
            onClick={() => setActiveTab('segments')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'segments'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Segmentos
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4 mr-2 inline" />
            Plantillas
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2 inline" />
            Analíticas
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 mr-2 inline" />
            Configuración
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'campaigns' && (
            <div className="p-6">
              {/* Campaign Controls */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar campañas..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="draft">Borradores</option>
                  <option value="scheduled">Programadas</option>
                  <option value="sending">Enviando</option>
                  <option value="sent">Enviadas</option>
                  <option value="paused">Pausadas</option>
                </select>

                <button
                  onClick={() => setShowTemplateLibrary(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Palette className="w-4 h-4" />
                  Plantillas
                </button>
              </div>

              {/* Campaigns List */}
              <div className="space-y-4">
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-slate-700 rounded-xl p-6 hover:bg-slate-600/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getTypeIcon(campaign.type)}
                          <h3 className="text-white font-semibold text-lg">{campaign.name}</h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                            {getStatusIcon(campaign.status)}
                            {campaign.status === 'draft' ? 'Borrador' :
                             campaign.status === 'scheduled' ? 'Programada' :
                             campaign.status === 'sending' ? 'Enviando' :
                             campaign.status === 'sent' ? 'Enviada' : 'Pausada'}
                          </span>
                        </div>

                        <p className="text-slate-300 mb-3">{campaign.subject}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-slate-400 text-sm">Segmento</p>
                            <p className="text-white font-medium">{campaign.segmentName}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Destinatarios</p>
                            <p className="text-white font-medium">{campaign.recipientCount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Tasa de Apertura</p>
                            <p className="text-white font-medium">{campaign.metrics.openRate.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-sm">Tasa de Click</p>
                            <p className="text-white font-medium">{campaign.metrics.clickRate.toFixed(1)}%</p>
                          </div>
                        </div>

                        {campaign.scheduledDate && (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>Programada para: {format(new Date(campaign.scheduledDate), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                          </div>
                        )}

                        {campaign.abTest?.enabled && (
                          <div className="flex items-center gap-2 text-sm text-blue-400 mt-2">
                            <BarChart3 className="w-4 h-4" />
                            <span>Test A/B activo ({campaign.abTest.variants.length} variantes)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditCampaign(campaign)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicateCampaign(campaign)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => handleSendCampaign(campaign.id)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-slate-600 rounded-lg transition-colors"
                            title="Enviar ahora"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {campaign.status === 'sending' && (
                          <button
                            onClick={() => handlePauseCampaign(campaign.id)}
                            className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-slate-600 rounded-lg transition-colors"
                            title="Pausar"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-12">
                    <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No hay campañas que coincidan con los filtros</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'segments' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Gestión de segmentos en desarrollo</p>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Palette className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Biblioteca de plantillas en desarrollo</p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Panel de analíticas en desarrollo</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Configuración GDPR/LOPD en desarrollo</p>
              </div>
            </div>
          )}
        </div>

        {/* Campaign Editor Modal */}
        {showCampaignEditor && (
          <EmailCampaignEditor
            campaign={editingCampaign}
            segments={segments}
            onClose={() => {
              setShowCampaignEditor(false);
              setEditingCampaign(null);
            }}
            onSave={() => {
              setShowCampaignEditor(false);
              setEditingCampaign(null);
              loadMarketingData();
            }}
          />
        )}

        {/* Template Library Modal */}
        {showTemplateLibrary && (
          <EmailTemplateLibrary
            onClose={() => setShowTemplateLibrary(false)}
            onSelectTemplate={(template) => {
              setShowTemplateLibrary(false);
              // Crear nueva campaña con plantilla seleccionada
              handleCreateCampaign();
            }}
          />
        )}
      </div>
    </div>
  );
};