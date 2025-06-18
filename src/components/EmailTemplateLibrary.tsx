import React, { useState } from 'react';
import { 
  Palette, 
  Eye, 
  Copy, 
  Download, 
  Upload, 
  Search, 
  Filter,
  Star,
  Heart,
  Gift,
  Calendar,
  Users,
  Target,
  Zap,
  X
} from 'lucide-react';

interface EmailTemplateLibraryProps {
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}

interface Template {
  id: string;
  name: string;
  category: 'promotional' | 'newsletter' | 'welcome' | 'retention' | 'seasonal';
  description: string;
  thumbnail: string;
  html: string;
  tags: string[];
  rating: number;
  downloads: number;
  isPremium: boolean;
}

export const EmailTemplateLibrary: React.FC<EmailTemplateLibraryProps> = ({
  onClose,
  onSelectTemplate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const templates: Template[] = [
    {
      id: '1',
      name: 'Promoción Elegante',
      category: 'promotional',
      description: 'Plantilla moderna para promociones y ofertas especiales',
      thumbnail: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <header style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300;">{{restaurant_name}}</h1>
            <div style="width: 60px; height: 2px; background-color: #f59e0b; margin: 15px auto;"></div>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">Oferta Especial</p>
          </header>
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #1e293b;">Hola {{customer_name}},</h2>
            <p style="color: #374151; line-height: 1.6;">Disfruta de nuestra oferta especial.</p>
            <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h3 style="margin: 0; font-size: 24px;">20% de Descuento</h3>
            </div>
          </div>
        </div>
      `,
      tags: ['promoción', 'descuento', 'elegante'],
      rating: 4.8,
      downloads: 1250,
      isPremium: false
    },
    {
      id: '2',
      name: 'Newsletter Minimalista',
      category: 'newsletter',
      description: 'Diseño limpio y minimalista para newsletters regulares',
      thumbnail: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <header style="background: #1e293b; color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Newsletter {{restaurant_name}}</h1>
          </header>
          <div style="padding: 30px; background: white;">
            <h2 style="color: #1e293b;">Hola {{customer_name}},</h2>
            <p style="color: #374151; line-height: 1.6;">Novedades de este mes.</p>
          </div>
        </div>
      `,
      tags: ['newsletter', 'minimalista', 'limpio'],
      rating: 4.6,
      downloads: 890,
      isPremium: false
    },
    {
      id: '3',
      name: 'Bienvenida Premium',
      category: 'welcome',
      description: 'Plantilla de bienvenida con diseño premium y animaciones',
      thumbnail: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <header style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">¡Bienvenido!</h1>
          </header>
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #1e293b;">Hola {{customer_name}},</h2>
            <p style="color: #374151; line-height: 1.6;">Bienvenido a nuestra familia.</p>
          </div>
        </div>
      `,
      tags: ['bienvenida', 'premium', 'gradiente'],
      rating: 4.9,
      downloads: 2100,
      isPremium: true
    },
    {
      id: '4',
      name: 'Navidad Festiva',
      category: 'seasonal',
      description: 'Plantilla especial para las fiestas navideñas',
      thumbnail: 'https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <header style="background: #dc2626; color: white; padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎄 Feliz Navidad 🎄</h1>
          </header>
          <div style="padding: 40px 30px; background: white;">
            <h2 style="color: #1e293b;">Hola {{customer_name}},</h2>
            <p style="color: #374151; line-height: 1.6;">Celebra la Navidad con nosotros.</p>
          </div>
        </div>
      `,
      tags: ['navidad', 'festivo', 'temporada'],
      rating: 4.7,
      downloads: 1680,
      isPremium: false
    }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'promotional':
        return <Target className="w-4 h-4" />;
      case 'newsletter':
        return <Calendar className="w-4 h-4" />;
      case 'welcome':
        return <Users className="w-4 h-4" />;
      case 'retention':
        return <Heart className="w-4 h-4" />;
      case 'seasonal':
        return <Gift className="w-4 h-4" />;
      default:
        return <Palette className="w-4 h-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      promotional: 'Promocional',
      newsletter: 'Newsletter',
      welcome: 'Bienvenida',
      retention: 'Retención',
      seasonal: 'Temporada'
    };
    return names[category] || category;
  };

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template);
  };

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Biblioteca de Plantillas</h2>
            <p className="text-slate-400 text-sm">
              Selecciona una plantilla para tu campaña de email marketing
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              Subir Plantilla
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-6 border-b border-slate-700">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar plantillas..."
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              <option value="promotional">Promocional</option>
              <option value="newsletter">Newsletter</option>
              <option value="welcome">Bienvenida</option>
              <option value="retention">Retención</option>
              <option value="seasonal">Temporada</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-slate-700 rounded-xl overflow-hidden hover:bg-slate-600/50 transition-colors">
                {/* Template Thumbnail */}
                <div className="relative">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-48 object-cover"
                  />
                  {template.isPremium && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-slate-900 px-2 py-1 rounded text-xs font-bold">
                      PREMIUM
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePreviewTemplate(template)}
                      className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors"
                      title="Vista previa"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className="p-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-colors"
                      title="Usar plantilla"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(template.category)}
                    <span className="text-slate-400 text-sm">{getCategoryName(template.category)}</span>
                  </div>
                  
                  <h3 className="text-white font-semibold mb-2">{template.name}</h3>
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-slate-300 text-sm">{template.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-400 text-sm">{template.downloads}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Palette className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No se encontraron plantillas que coincidan con los filtros</p>
            </div>
          )}
        </div>

        {/* Template Preview Modal */}
        {showPreview && selectedTemplate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-4xl w-full h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedTemplate.name}</h3>
                  <p className="text-slate-400 text-sm">{selectedTemplate.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSelectTemplate(selectedTemplate)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-lg hover:bg-amber-400 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Usar Plantilla
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
                <div className="max-w-2xl mx-auto bg-white">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};