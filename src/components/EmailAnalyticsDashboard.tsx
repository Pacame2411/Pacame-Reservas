import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  UserX, 
  AlertTriangle,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Mail,
  Users,
  Target,
  Clock
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmailAnalyticsDashboardProps {
  onClose: () => void;
}

interface AnalyticsData {
  period: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

interface CampaignPerformance {
  id: string;
  name: string;
  type: string;
  sentDate: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  revenue: number;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

export const EmailAnalyticsDashboard: React.FC<EmailAnalyticsDashboardProps> = ({ onClose }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    // Simular carga de datos
    setTimeout(() => {
      // Datos de ejemplo
      const mockData: AnalyticsData[] = [
        {
          period: '2024-01-01',
          sent: 1250,
          delivered: 1200,
          opened: 480,
          clicked: 96,
          bounced: 50,
          unsubscribed: 5,
          openRate: 40.0,
          clickRate: 8.0,
          bounceRate: 4.2,
          unsubscribeRate: 0.4
        },
        {
          period: '2024-01-08',
          sent: 1180,
          delivered: 1150,
          opened: 506,
          clicked: 101,
          bounced: 30,
          unsubscribed: 3,
          openRate: 44.0,
          clickRate: 8.8,
          bounceRate: 2.6,
          unsubscribeRate: 0.3
        }
      ];

      const mockCampaigns: CampaignPerformance[] = [
        {
          id: '1',
          name: 'Promoción Navidad 2024',
          type: 'promotional',
          sentDate: '2024-01-15',
          recipients: 1250,
          openRate: 45.2,
          clickRate: 12.8,
          revenue: 3250,
          status: 'excellent'
        },
        {
          id: '2',
          name: 'Newsletter Enero',
          type: 'newsletter',
          sentDate: '2024-01-10',
          recipients: 980,
          openRate: 38.5,
          clickRate: 6.2,
          revenue: 850,
          status: 'good'
        }
      ];

      setAnalyticsData(mockData);
      setCampaignPerformance(mockCampaigns);
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-blue-400';
      case 'average':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'good':
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
      case 'average':
        return <BarChart3 className="w-4 h-4 text-yellow-400" />;
      case 'poor':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <BarChart3 className="w-4 h-4 text-slate-400" />;
    }
  };

  const totalMetrics = analyticsData.reduce((acc, data) => ({
    sent: acc.sent + data.sent,
    delivered: acc.delivered + data.delivered,
    opened: acc.opened + data.opened,
    clicked: acc.clicked + data.clicked,
    bounced: acc.bounced + data.bounced,
    unsubscribed: acc.unsubscribed + data.unsubscribed
  }), { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 });

  const averageRates = {
    openRate: totalMetrics.delivered > 0 ? (totalMetrics.opened / totalMetrics.delivered) * 100 : 0,
    clickRate: totalMetrics.delivered > 0 ? (totalMetrics.clicked / totalMetrics.delivered) * 100 : 0,
    bounceRate: totalMetrics.sent > 0 ? (totalMetrics.bounced / totalMetrics.sent) * 100 : 0,
    unsubscribeRate: totalMetrics.delivered > 0 ? (totalMetrics.unsubscribed / totalMetrics.delivered) * 100 : 0
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Cargando analíticas...</p>
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
            <h2 className="text-xl font-semibold text-white">Analíticas de Email Marketing</h2>
            <p className="text-slate-400 text-sm">
              Rendimiento detallado de tus campañas de email
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === '7d'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                7 días
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === '30d'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                30 días
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === '90d'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                90 días
              </button>
              <button
                onClick={() => setTimeRange('1y')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === '1y'
                    ? 'bg-amber-500 text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                1 año
              </button>
            </div>
            
            <button
              onClick={loadAnalyticsData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-slate-400 text-sm">Enviados</span>
              </div>
              <p className="text-white text-lg font-bold">{totalMetrics.sent.toLocaleString()}</p>
            </div>

            <div className="bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-slate-400 text-sm">Entregados</span>
              </div>
              <p className="text-white text-lg font-bold">{totalMetrics.delivered.toLocaleString()}</p>
            </div>

            <div className="bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400 text-sm">Aperturas</span>
              </div>
              <p className="text-white text-lg font-bold">{totalMetrics.opened.toLocaleString()}</p>
              <p className="text-amber-400 text-xs">{averageRates.openRate.toFixed(1)}%</p>
            </div>

            <div className="bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="w-4 h-4 text-purple-400" />
                <span className="text-slate-400 text-sm">Clicks</span>
              </div>
              <p className="text-white text-lg font-bold">{totalMetrics.clicked.toLocaleString()}</p>
              <p className="text-purple-400 text-xs">{averageRates.clickRate.toFixed(1)}%</p>
            </div>

            <div className="bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span className="text-slate-400 text-sm">Rebotes</span>
              </div>
              <p className="text-white text-lg font-bold">{totalMetrics.bounced.toLocaleString()}</p>
              <p className="text-orange-400 text-xs">{averageRates.bounceRate.toFixed(1)}%</p>
            </div>

            <div className="bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserX className="w-4 h-4 text-red-400" />
                <span className="text-slate-400 text-sm">Bajas</span>
              </div>
              <p className="text-white text-lg font-bold">{totalMetrics.unsubscribed.toLocaleString()}</p>
              <p className="text-red-400 text-xs">{averageRates.unsubscribeRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-slate-700 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Rendimiento por Período</h3>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-slate-300 rounded-lg hover:bg-slate-500 transition-colors">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>

            <div className="space-y-4">
              {analyticsData.map((data, index) => (
                <div key={index} className="border border-slate-600 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium">
                      {format(new Date(data.period), 'dd/MM/yyyy', { locale: es })}
                    </span>
                    <span className="text-slate-400 text-sm">
                      {data.sent.toLocaleString()} enviados
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Apertura</span>
                        <span className="text-amber-400 font-medium">{data.openRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(data.openRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Click</span>
                        <span className="text-purple-400 font-medium">{data.clickRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-purple-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(data.clickRate * 5, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Rebote</span>
                        <span className="text-orange-400 font-medium">{data.bounceRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-orange-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(data.bounceRate * 10, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-sm">Baja</span>
                        <span className="text-red-400 font-medium">{data.unsubscribeRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className="bg-red-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(data.unsubscribeRate * 20, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Performance */}
          <div className="bg-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Rendimiento por Campaña</h3>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent">
                  <option value="all">Todas las campañas</option>
                  <option value="promotional">Promocionales</option>
                  <option value="newsletter">Newsletters</option>
                  <option value="welcome">Bienvenida</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left text-slate-300 font-medium py-3">Campaña</th>
                    <th className="text-left text-slate-300 font-medium py-3">Fecha</th>
                    <th className="text-left text-slate-300 font-medium py-3">Destinatarios</th>
                    <th className="text-left text-slate-300 font-medium py-3">Apertura</th>
                    <th className="text-left text-slate-300 font-medium py-3">Click</th>
                    <th className="text-left text-slate-300 font-medium py-3">Ingresos</th>
                    <th className="text-left text-slate-300 font-medium py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignPerformance.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-slate-600/50 hover:bg-slate-600/30">
                      <td className="py-4">
                        <div>
                          <p className="text-white font-medium">{campaign.name}</p>
                          <p className="text-slate-400 text-sm">{campaign.type}</p>
                        </div>
                      </td>
                      <td className="py-4 text-slate-300">
                        {format(new Date(campaign.sentDate), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="py-4 text-slate-300">
                        {campaign.recipients.toLocaleString()}
                      </td>
                      <td className="py-4">
                        <span className="text-amber-400 font-medium">
                          {campaign.openRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-purple-400 font-medium">
                          {campaign.clickRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-green-400 font-medium">
                          €{campaign.revenue.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className={`flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          <span className="text-sm font-medium">
                            {campaign.status === 'excellent' ? 'Excelente' :
                             campaign.status === 'good' ? 'Bueno' :
                             campaign.status === 'average' ? 'Promedio' : 'Bajo'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};