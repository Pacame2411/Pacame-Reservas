import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Send, 
  Eye, 
  Smartphone, 
  Monitor, 
  Code, 
  Type, 
  Image, 
  Link, 
  Palette, 
  Settings,
  Calendar,
  Users,
  Target,
  BarChart3,
  Plus,
  Trash2,
  Copy,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  X
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmailCampaignEditorProps {
  campaign?: any;
  segments: any[];
  onClose: () => void;
  onSave: (campaign: any) => void;
}

interface EmailTemplate {
  html: string;
  text: string;
  previewText: string;
}

export const EmailCampaignEditor: React.FC<EmailCampaignEditorProps> = ({
  campaign,
  segments,
  onClose,
  onSave
}) => {
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: campaign?.name || '',
    subject: campaign?.subject || '',
    type: campaign?.type || 'promotional',
    segmentId: campaign?.segmentId || '',
    scheduledDate: campaign?.scheduledDate || '',
    previewText: campaign?.template?.previewText || '',
    abTestEnabled: campaign?.abTest?.enabled || false,
    abTestVariants: campaign?.abTest?.variants || []
  });

  const [template, setTemplate] = useState<EmailTemplate>({
    html: campaign?.template?.html || '',
    text: campaign?.template?.text || '',
    previewText: campaign?.template?.previewText || ''
  });

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showPersonalizationPanel, setShowPersonalizationPanel] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  const personalizationTags = [
    { tag: '{{customer_name}}', label: 'Nombre del Cliente', example: 'Juan Pérez' },
    { tag: '{{customer_email}}', label: 'Email del Cliente', example: 'juan@email.com' },
    { tag: '{{last_reservation_date}}', label: 'Última Reserva', example: '15/01/2024' },
    { tag: '{{total_reservations}}', label: 'Total Reservas', example: '12' },
    { tag: '{{customer_category}}', label: 'Categoría Cliente', example: 'VIP' },
    { tag: '{{restaurant_name}}', label: 'Nombre Restaurante', example: 'Bella Vista' },
    { tag: '{{restaurant_phone}}', label: 'Teléfono Restaurante', example: '+34 912 345 678' },
    { tag: '{{unsubscribe_link}}', label: 'Enlace de Baja', example: 'Darse de baja' }
  ];

  const emailTemplates = {
    promotional: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <header style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300;">{{restaurant_name}}</h1>
          <div style="width: 60px; height: 2px; background-color: #f59e0b; margin: 15px auto;"></div>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">Oferta Especial para Ti</p>
        </header>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hola {{customer_name}},</h2>
          
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Como cliente {{customer_category}} de {{restaurant_name}}, queremos ofrecerte una experiencia gastronómica única.
          </p>
          
          <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
            <h3 style="margin: 0 0 10px 0; font-size: 24px;">20% de Descuento</h3>
            <p style="margin: 0; font-size: 16px;">En tu próxima reserva</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #1e293b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Reservar Ahora
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Oferta válida hasta el 31 de diciembre de 2024
          </p>
        </div>
        
        <footer style="background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px;">
          <p>{{restaurant_name}} | C/ Gran Vía 123, Madrid | {{restaurant_phone}}</p>
          <p><a href="{{unsubscribe_link}}" style="color: #64748b;">Darse de baja</a></p>
        </footer>
      </div>
    `,
    newsletter: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <header style="background: #1e293b; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Newsletter {{restaurant_name}}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.8;">Novedades y eventos especiales</p>
        </header>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1e293b;">Hola {{customer_name}},</h2>
          
          <p style="color: #374151; line-height: 1.6;">
            Te mantenemos informado sobre las últimas novedades de {{restaurant_name}}.
          </p>
          
          <div style="border-left: 4px solid #f59e0b; padding-left: 20px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin: 0 0 10px 0;">Nuevo Menú de Temporada</h3>
            <p style="color: #374151; margin: 0;">Descubre nuestros platos de temporada preparados con ingredientes frescos y locales.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px;">
              Ver Menú
            </a>
          </div>
        </div>
        
        <footer style="background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
          <p>{{restaurant_name}} | <a href="{{unsubscribe_link}}" style="color: #64748b;">Darse de baja</a></p>
        </footer>
      </div>
    `,
    welcome: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <header style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">¡Bienvenido a {{restaurant_name}}!</h1>
          <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">Gracias por unirte a nuestra familia gastronómica</p>
        </header>
        
        <div style="padding: 40px 30px; background: white;">
          <h2 style="color: #1e293b;">Hola {{customer_name}},</h2>
          
          <p style="color: #374151; line-height: 1.6;">
            ¡Bienvenido a {{restaurant_name}}! Estamos emocionados de tenerte como parte de nuestra comunidad.
          </p>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #15803d; margin: 0 0 10px 0;">🎉 Regalo de Bienvenida</h3>
            <p style="color: #166534; margin: 0;">Disfruta de un 15% de descuento en tu primera reserva con nosotros.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              Hacer mi Primera Reserva
            </a>
          </div>
        </div>
        
        <footer style="background: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 14px;">
          <p>{{restaurant_name}} | {{restaurant_phone}}</p>
          <p><a href="{{unsubscribe_link}}" style="color: #64748b;">Darse de baja</a></p>
        </footer>
      </div>
    `
  };

  useEffect(() => {
    if (!template.html && campaignData.type) {
      setTemplate(prev => ({
        ...prev,
        html: emailTemplates[campaignData.type as keyof typeof emailTemplates] || emailTemplates.promotional
      }));
    }
  }, [campaignData.type]);

  const handleSave = () => {
    const campaignToSave = {
      ...campaign,
      ...campaignData,
      template,
      status: 'draft'
    };
    onSave(campaignToSave);
  };

  const handleSend = () => {
    if (window.confirm('¿Estás seguro de que quieres enviar esta campaña ahora?')) {
      const campaignToSend = {
        ...campaign,
        ...campaignData,
        template,
        status: 'sending'
      };
      onSave(campaignToSend);
    }
  };

  const insertPersonalizationTag = (tag: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const tagElement = document.createElement('span');
        tagElement.textContent = tag;
        tagElement.style.backgroundColor = '#fef3c7';
        tagElement.style.padding = '2px 4px';
        tagElement.style.borderRadius = '4px';
        tagElement.style.fontWeight = 'bold';
        range.insertNode(tagElement);
        range.collapse(false);
      }
    }
    setShowPersonalizationPanel(false);
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const selectedSegment = segments.find(s => s.id === campaignData.segmentId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-7xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {campaign ? 'Editar Campaña' : 'Nueva Campaña'}
            </h2>
            <p className="text-slate-400 text-sm">
              Paso {step} de 3 - {
                step === 1 ? 'Configuración Básica' :
                step === 2 ? 'Diseño del Email' :
                'Revisión y Envío'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber <= step 
                    ? 'bg-amber-500 text-slate-900' 
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    stepNumber < step ? 'bg-amber-500' : 'bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 1 && (
            /* Step 1: Basic Configuration */
            <div className="p-6 max-w-2xl mx-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre de la Campaña *
                  </label>
                  <input
                    type="text"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    placeholder="Ej: Promoción Navidad 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Asunto del Email *
                  </label>
                  <input
                    type="text"
                    value={campaignData.subject}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    placeholder="Ej: ¡Oferta especial para {{customer_name}}!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Campaña *
                  </label>
                  <select
                    value={campaignData.type}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  >
                    <option value="promotional">Promocional</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="welcome">Bienvenida</option>
                    <option value="retention">Retención</option>
                    <option value="reactivation">Reactivación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Segmento de Clientes *
                  </label>
                  <select
                    value={campaignData.segmentId}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, segmentId: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  >
                    <option value="">Seleccionar segmento</option>
                    {segments.map(segment => (
                      <option key={segment.id} value={segment.id}>
                        {segment.name} ({segment.recipientCount} destinatarios)
                      </option>
                    ))}
                  </select>
                  {selectedSegment && (
                    <p className="text-slate-400 text-sm mt-2">{selectedSegment.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Programar Envío (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={campaignData.scheduledDate}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    min={format(new Date(), 'yyyy-MM-dd\'T\'HH:mm')}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={campaignData.abTestEnabled}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, abTestEnabled: e.target.checked }))}
                      className="w-4 h-4 text-amber-600 bg-slate-700 border-slate-600 rounded focus:ring-amber-500"
                    />
                    <span className="text-slate-300">Habilitar Test A/B</span>
                  </label>
                  <p className="text-slate-400 text-sm mt-1">
                    Prueba diferentes versiones del email para optimizar resultados
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            /* Step 2: Email Design */
            <div className="flex h-full">
              {/* Editor Toolbar */}
              <div className="w-80 border-r border-slate-700 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {/* Editor Mode Toggle */}
                  <div className="flex bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setEditorMode('visual')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        editorMode === 'visual'
                          ? 'bg-amber-500 text-slate-900'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Eye className="w-4 h-4 mr-2 inline" />
                      Visual
                    </button>
                    <button
                      onClick={() => setEditorMode('code')}
                      className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        editorMode === 'code'
                          ? 'bg-amber-500 text-slate-900'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Code className="w-4 h-4 mr-2 inline" />
                      Código
                    </button>
                  </div>

                  {editorMode === 'visual' && (
                    <>
                      {/* Formatting Tools */}
                      <div>
                        <h4 className="text-white font-medium mb-3">Formato</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => formatText('bold')}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                            title="Negrita"
                          >
                            <Bold className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => formatText('italic')}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                            title="Cursiva"
                          >
                            <Italic className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => formatText('underline')}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                            title="Subrayado"
                          >
                            <Underline className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => formatText('justifyLeft')}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                            title="Alinear izquierda"
                          >
                            <AlignLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => formatText('justifyCenter')}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                            title="Centrar"
                          >
                            <AlignCenter className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => formatText('justifyRight')}
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
                            title="Alinear derecha"
                          >
                            <AlignRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Personalization */}
                      <div>
                        <button
                          onClick={() => setShowPersonalizationPanel(!showPersonalizationPanel)}
                          className="w-full flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Target className="w-4 h-4" />
                          Personalización
                        </button>
                        
                        {showPersonalizationPanel && (
                          <div className="mt-3 space-y-2">
                            {personalizationTags.map((tag) => (
                              <button
                                key={tag.tag}
                                onClick={() => insertPersonalizationTag(tag.tag)}
                                className="w-full text-left px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors text-sm"
                                title={`Ejemplo: ${tag.example}`}
                              >
                                {tag.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Preview Text */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Texto de Vista Previa
                    </label>
                    <textarea
                      value={campaignData.previewText}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, previewText: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 text-sm resize-none"
                      rows={3}
                      placeholder="Texto que aparece en la vista previa del email..."
                    />
                  </div>
                </div>
              </div>

              {/* Editor Area */}
              <div className="flex-1 flex flex-col">
                {/* Preview Controls */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                  <div className="flex bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        previewMode === 'desktop'
                          ? 'bg-amber-500 text-slate-900'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-4 h-4 mr-2 inline" />
                      Desktop
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        previewMode === 'mobile'
                          ? 'bg-amber-500 text-slate-900'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 mr-2 inline" />
                      Mobile
                    </button>
                  </div>

                  <div className="text-slate-400 text-sm">
                    Vista previa: {previewMode === 'desktop' ? 'Escritorio' : 'Móvil'}
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 p-4 bg-slate-900">
                  <div className={`mx-auto bg-white ${
                    previewMode === 'desktop' ? 'max-w-2xl' : 'max-w-sm'
                  } transition-all duration-300`}>
                    {editorMode === 'visual' ? (
                      <div
                        ref={editorRef}
                        contentEditable
                        dangerouslySetInnerHTML={{ __html: template.html }}
                        onInput={(e) => setTemplate(prev => ({ ...prev, html: e.currentTarget.innerHTML }))}
                        className="min-h-96 focus:outline-none"
                        style={{ lineHeight: '1.6' }}
                      />
                    ) : (
                      <textarea
                        value={template.html}
                        onChange={(e) => setTemplate(prev => ({ ...prev, html: e.target.value }))}
                        className="w-full h-96 p-4 bg-slate-800 text-white font-mono text-sm border border-slate-600 rounded focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                        placeholder="Código HTML del email..."
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            /* Step 3: Review and Send */
            <div className="p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Campaign Summary */}
                <div className="space-y-6">
                  <div className="bg-slate-700 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Resumen de la Campaña</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 text-sm">Nombre:</span>
                        <p className="text-white font-medium">{campaignData.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Asunto:</span>
                        <p className="text-white font-medium">{campaignData.subject}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Tipo:</span>
                        <p className="text-white font-medium">{campaignData.type}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Segmento:</span>
                        <p className="text-white font-medium">{selectedSegment?.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-sm">Destinatarios:</span>
                        <p className="text-white font-medium">{selectedSegment?.recipientCount || 0}</p>
                      </div>
                      {campaignData.scheduledDate && (
                        <div>
                          <span className="text-slate-400 text-sm">Programado para:</span>
                          <p className="text-white font-medium">
                            {format(new Date(campaignData.scheduledDate), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* GDPR Compliance Check */}
                  <div className="bg-green-900/20 border border-green-800 rounded-xl p-6">
                    <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Cumplimiento GDPR/LOPD
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 text-sm">Consentimiento verificado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 text-sm">Enlace de baja incluido</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 text-sm">Datos de contacto incluidos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Preview */}
                <div className="bg-slate-700 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Vista Previa del Email</h3>
                  <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: template.html }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-slate-700">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
              >
                Anterior
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!campaignData.name || !campaignData.subject || !campaignData.segmentId)) ||
                  (step === 2 && !template.html)
                }
                className="px-6 py-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Borrador
                </button>
                <button
                  onClick={handleSend}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {campaignData.scheduledDate ? 'Programar Envío' : 'Enviar Ahora'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};