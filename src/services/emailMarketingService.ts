import { Reservation } from '../types';
import { reservationService } from './reservationService';
import { businessAnalyticsService } from './businessAnalyticsService';
import { format, subDays, subMonths, parseISO, differenceInDays } from 'date-fns';

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
  gdprCompliant: boolean;
  consentVerified: boolean;
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

interface MarketingConsent {
  email: string;
  customerName: string;
  consentGiven: boolean;
  consentDate: string;
  ipAddress: string;
  source: 'reservation' | 'newsletter' | 'manual';
  unsubscribed: boolean;
  unsubscribeDate?: string;
  preferences: {
    promotional: boolean;
    newsletter: boolean;
    transactional: boolean;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  category: 'promotional' | 'newsletter' | 'welcome' | 'retention' | 'seasonal';
  description: string;
  html: string;
  text: string;
  thumbnail: string;
  tags: string[];
  isCustom: boolean;
  createdAt: string;
}

class EmailMarketingService {
  private campaignsKey = 'email_marketing_campaigns';
  private segmentsKey = 'email_marketing_segments';
  private consentsKey = 'email_marketing_consents';
  private templatesKey = 'email_marketing_templates';
  private analyticsKey = 'email_marketing_analytics';

  // Campaign Management
  async getAllCampaigns(): Promise<Campaign[]> {
    const stored = localStorage.getItem(this.campaignsKey);
    return stored ? JSON.parse(stored) : this.generateSampleCampaigns();
  }

  async createCampaign(campaignData: Partial<Campaign>): Promise<Campaign> {
    const campaigns = await this.getAllCampaigns();
    const segment = await this.getSegmentById(campaignData.segmentId!);
    
    const newCampaign: Campaign = {
      id: this.generateId(),
      name: campaignData.name!,
      subject: campaignData.subject!,
      status: 'draft',
      type: campaignData.type!,
      segmentId: campaignData.segmentId!,
      segmentName: segment?.name || 'Segmento desconocido',
      recipientCount: segment?.recipientCount || 0,
      scheduledDate: campaignData.scheduledDate,
      createdAt: new Date().toISOString(),
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0
      },
      template: campaignData.template || {
        html: '',
        text: '',
        previewText: ''
      },
      abTest: campaignData.abTest,
      gdprCompliant: true,
      consentVerified: true
    };

    campaigns.push(newCampaign);
    localStorage.setItem(this.campaignsKey, JSON.stringify(campaigns));
    
    return newCampaign;
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
    const campaigns = await this.getAllCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    
    if (index !== -1) {
      campaigns[index] = { ...campaigns[index], ...updates };
      localStorage.setItem(this.campaignsKey, JSON.stringify(campaigns));
      return campaigns[index];
    }
    
    return null;
  }

  async deleteCampaign(id: string): Promise<boolean> {
    const campaigns = await this.getAllCampaigns();
    const filteredCampaigns = campaigns.filter(c => c.id !== id);
    
    if (filteredCampaigns.length < campaigns.length) {
      localStorage.setItem(this.campaignsKey, JSON.stringify(filteredCampaigns));
      return true;
    }
    
    return false;
  }

  async duplicateCampaign(id: string): Promise<Campaign | null> {
    const campaigns = await this.getAllCampaigns();
    const originalCampaign = campaigns.find(c => c.id === id);
    
    if (originalCampaign) {
      const duplicatedCampaign: Campaign = {
        ...originalCampaign,
        id: this.generateId(),
        name: `${originalCampaign.name} (Copia)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        sentAt: undefined,
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0
        }
      };
      
      campaigns.push(duplicatedCampaign);
      localStorage.setItem(this.campaignsKey, JSON.stringify(campaigns));
      
      return duplicatedCampaign;
    }
    
    return null;
  }

  async sendCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.updateCampaign(id, {
        status: 'sending',
        sentAt: new Date().toISOString()
      });
      
      if (!campaign) {
        return { success: false, error: 'Campaña no encontrada' };
      }

      // Validar GDPR compliance
      if (!this.validateGDPRCompliance(campaign)) {
        return { success: false, error: 'La campaña no cumple con GDPR/LOPD' };
      }

      // Simular envío
      setTimeout(async () => {
        const simulatedMetrics = this.simulateCampaignMetrics(campaign.recipientCount);
        await this.updateCampaign(id, {
          status: 'sent',
          metrics: simulatedMetrics
        });
      }, 5000);

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  async pauseCampaign(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateCampaign(id, { status: 'paused' });
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error pausando campaña' };
    }
  }

  // Segment Management
  async getAllSegments(): Promise<Segment[]> {
    const stored = localStorage.getItem(this.segmentsKey);
    return stored ? JSON.parse(stored) : this.generateSampleSegments();
  }

  async getSegmentById(id: string): Promise<Segment | null> {
    const segments = await this.getAllSegments();
    return segments.find(s => s.id === id) || null;
  }

  async createSegment(segmentData: Partial<Segment>): Promise<Segment> {
    const segments = await this.getAllSegments();
    const recipientCount = await this.calculateSegmentSize(segmentData.criteria!);
    
    const newSegment: Segment = {
      id: this.generateId(),
      name: segmentData.name!,
      description: segmentData.description!,
      criteria: segmentData.criteria!,
      recipientCount,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    segments.push(newSegment);
    localStorage.setItem(this.segmentsKey, JSON.stringify(segments));
    
    return newSegment;
  }

  private async calculateSegmentSize(criteria: Segment['criteria']): Promise<number> {
    const customers = await businessAnalyticsService.getCustomerAnalytics();
    
    return customers.filter(customer => {
      // Filtrar por categoría
      if (criteria.customerCategory !== 'all' && customer.category !== criteria.customerCategory) {
        return false;
      }

      // Filtrar por última reserva
      if (criteria.lastReservation) {
        const lastReservationDate = parseISO(customer.lastVisit);
        const now = new Date();
        
        if (criteria.lastReservation.operator === 'before') {
          const beforeDate = parseISO(criteria.lastReservation.value as string);
          if (lastReservationDate >= beforeDate) return false;
        } else if (criteria.lastReservation.operator === 'after') {
          const afterDate = parseISO(criteria.lastReservation.value as string);
          if (lastReservationDate <= afterDate) return false;
        }
      }

      // Filtrar por total de reservas
      if (criteria.totalReservations) {
        const totalReservations = customer.totalReservations;
        const value = criteria.totalReservations.value as number;
        
        switch (criteria.totalReservations.operator) {
          case 'gt':
            if (totalReservations <= value) return false;
            break;
          case 'lt':
            if (totalReservations >= value) return false;
            break;
          case 'eq':
            if (totalReservations !== value) return false;
            break;
        }
      }

      // Filtrar por consentimiento
      if (criteria.hasConsent) {
        const consent = this.getConsentForEmail(customer.email);
        if (!consent || !consent.consentGiven || consent.unsubscribed) return false;
      }

      // Filtrar por estado activo
      if (criteria.isActive && customer.isInactive) {
        return false;
      }

      return true;
    }).length;
  }

  // Consent Management (GDPR/LOPD)
  async recordConsent(consentData: Partial<MarketingConsent>): Promise<MarketingConsent> {
    const consents = this.getAllConsents();
    const existingIndex = consents.findIndex(c => c.email === consentData.email);
    
    const consent: MarketingConsent = {
      email: consentData.email!,
      customerName: consentData.customerName!,
      consentGiven: consentData.consentGiven!,
      consentDate: new Date().toISOString(),
      ipAddress: consentData.ipAddress || 'unknown',
      source: consentData.source || 'manual',
      unsubscribed: false,
      preferences: consentData.preferences || {
        promotional: true,
        newsletter: true,
        transactional: true
      }
    };

    if (existingIndex !== -1) {
      consents[existingIndex] = consent;
    } else {
      consents.push(consent);
    }

    localStorage.setItem(this.consentsKey, JSON.stringify(consents));
    return consent;
  }

  async unsubscribe(email: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const consents = this.getAllConsents();
      const index = consents.findIndex(c => c.email === email);
      
      if (index !== -1) {
        consents[index].unsubscribed = true;
        consents[index].unsubscribeDate = new Date().toISOString();
        localStorage.setItem(this.consentsKey, JSON.stringify(consents));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error procesando baja' };
    }
  }

  getAllConsents(): MarketingConsent[] {
    const stored = localStorage.getItem(this.consentsKey);
    return stored ? JSON.parse(stored) : [];
  }

  getConsentForEmail(email: string): MarketingConsent | null {
    const consents = this.getAllConsents();
    return consents.find(c => c.email === email) || null;
  }

  // Template Management
  async getAllTemplates(): Promise<EmailTemplate[]> {
    const stored = localStorage.getItem(this.templatesKey);
    return stored ? JSON.parse(stored) : this.generateSampleTemplates();
  }

  // Analytics and Reporting
  async getMarketingStats(): Promise<any> {
    const campaigns = await this.getAllCampaigns();
    const consents = this.getAllConsents();
    
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length;
    const totalSent = campaigns.reduce((sum, c) => sum + c.metrics.sent, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.metrics.opened, 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + c.metrics.clicked, 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.metrics.delivered, 0);
    
    const averageOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const averageClickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
    
    const totalSubscribers = consents.filter(c => c.consentGiven && !c.unsubscribed).length;
    const totalConsents = consents.length;
    const consentRate = totalConsents > 0 ? (totalSubscribers / totalConsents) * 100 : 0;
    const unsubscribeRate = totalConsents > 0 ? (consents.filter(c => c.unsubscribed).length / totalConsents) * 100 : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalSent,
      averageOpenRate,
      averageClickRate,
      totalSubscribers,
      consentRate,
      unsubscribeRate
    };
  }

  // Validation and Compliance
  private validateGDPRCompliance(campaign: Campaign): boolean {
    // Verificar que todos los destinatarios tienen consentimiento
    const segment = this.getSegmentById(campaign.segmentId);
    if (!segment) return false;

    // Verificar que el email incluye enlace de baja
    if (!campaign.template.html.includes('{{unsubscribe_link}}')) {
      return false;
    }

    // Verificar que incluye información de contacto
    if (!campaign.template.html.includes('{{restaurant_name}}') || 
        !campaign.template.html.includes('{{restaurant_phone}}')) {
      return false;
    }

    return true;
  }

  private validateEmailContent(content: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Verificar contenido spam
    const spamWords = ['GRATIS', 'URGENTE', '!!!', 'OFERTA LIMITADA', 'ACTÚA AHORA'];
    const upperCaseContent = content.toUpperCase();
    
    spamWords.forEach(word => {
      if (upperCaseContent.includes(word)) {
        issues.push(`Evita usar palabras como "${word}" que pueden activar filtros de spam`);
      }
    });

    // Verificar ratio texto/imagen
    const textLength = content.replace(/<[^>]*>/g, '').length;
    const imageCount = (content.match(/<img/g) || []).length;
    
    if (imageCount > 0 && textLength / imageCount < 100) {
      issues.push('Ratio texto/imagen muy bajo, puede activar filtros de spam');
    }

    // Verificar enlaces
    const linkCount = (content.match(/<a/g) || []).length;
    if (linkCount > 10) {
      issues.push('Demasiados enlaces pueden activar filtros de spam');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Utility Methods
  private simulateCampaignMetrics(recipientCount: number) {
    const delivered = Math.floor(recipientCount * (0.95 + Math.random() * 0.04)); // 95-99% delivery
    const opened = Math.floor(delivered * (0.20 + Math.random() * 0.25)); // 20-45% open rate
    const clicked = Math.floor(opened * (0.05 + Math.random() * 0.15)); // 5-20% click rate
    const bounced = recipientCount - delivered;
    const unsubscribed = Math.floor(delivered * (0.001 + Math.random() * 0.004)); // 0.1-0.5% unsubscribe

    return {
      sent: recipientCount,
      delivered,
      opened,
      clicked,
      bounced,
      unsubscribed,
      openRate: (opened / delivered) * 100,
      clickRate: (clicked / delivered) * 100,
      bounceRate: (bounced / recipientCount) * 100
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Sample Data Generation
  private generateSampleCampaigns(): Campaign[] {
    const sampleCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Promoción Navidad 2024',
        subject: '🎄 Oferta especial de Navidad para {{customer_name}}',
        status: 'sent',
        type: 'promotional',
        segmentId: '1',
        segmentName: 'Clientes VIP',
        recipientCount: 1250,
        createdAt: '2024-01-15T10:00:00Z',
        sentAt: '2024-01-15T14:00:00Z',
        metrics: {
          sent: 1250,
          delivered: 1200,
          opened: 480,
          clicked: 96,
          bounced: 50,
          unsubscribed: 5,
          openRate: 40.0,
          clickRate: 8.0,
          bounceRate: 4.0
        },
        template: {
          html: '<div>HTML content</div>',
          text: 'Text content',
          previewText: 'Oferta especial de Navidad'
        },
        gdprCompliant: true,
        consentVerified: true
      },
      {
        id: '2',
        name: 'Newsletter Enero 2024',
        subject: 'Novedades del mes en {{restaurant_name}}',
        status: 'draft',
        type: 'newsletter',
        segmentId: '2',
        segmentName: 'Todos los clientes',
        recipientCount: 2100,
        createdAt: '2024-01-20T09:00:00Z',
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0
        },
        template: {
          html: '<div>Newsletter HTML</div>',
          text: 'Newsletter text',
          previewText: 'Novedades del mes'
        },
        gdprCompliant: true,
        consentVerified: true
      }
    ];

    localStorage.setItem(this.campaignsKey, JSON.stringify(sampleCampaigns));
    return sampleCampaigns;
  }

  private generateSampleSegments(): Segment[] {
    const sampleSegments: Segment[] = [
      {
        id: '1',
        name: 'Clientes VIP',
        description: 'Clientes con más de 10 reservas en el último año',
        criteria: {
          lastReservation: { operator: 'after', value: '2023-01-01' },
          totalReservations: { operator: 'gt', value: 10 },
          customerCategory: 'VIP',
          hasConsent: true,
          isActive: true
        },
        recipientCount: 1250,
        createdAt: '2024-01-01T00:00:00Z',
        lastUpdated: '2024-01-15T00:00:00Z'
      },
      {
        id: '2',
        name: 'Todos los clientes',
        description: 'Todos los clientes con consentimiento de marketing',
        criteria: {
          lastReservation: { operator: 'after', value: '2020-01-01' },
          totalReservations: { operator: 'gt', value: 0 },
          customerCategory: 'all',
          hasConsent: true,
          isActive: true
        },
        recipientCount: 2100,
        createdAt: '2024-01-01T00:00:00Z',
        lastUpdated: '2024-01-15T00:00:00Z'
      },
      {
        id: '3',
        name: 'Clientes Inactivos',
        description: 'Clientes sin reservas en los últimos 6 meses',
        criteria: {
          lastReservation: { operator: 'before', value: '2023-07-01' },
          totalReservations: { operator: 'gt', value: 0 },
          customerCategory: 'all',
          hasConsent: true,
          isActive: false
        },
        recipientCount: 450,
        createdAt: '2024-01-01T00:00:00Z',
        lastUpdated: '2024-01-15T00:00:00Z'
      }
    ];

    localStorage.setItem(this.segmentsKey, JSON.stringify(sampleSegments));
    return sampleSegments;
  }

  private generateSampleTemplates(): EmailTemplate[] {
    const sampleTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Promoción Elegante',
        category: 'promotional',
        description: 'Plantilla moderna para promociones y ofertas especiales',
        html: '<div>Template HTML</div>',
        text: 'Template text',
        thumbnail: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
        tags: ['promoción', 'descuento', 'elegante'],
        isCustom: false,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];

    localStorage.setItem(this.templatesKey, JSON.stringify(sampleTemplates));
    return sampleTemplates;
  }
}

export const emailMarketingService = new EmailMarketingService();